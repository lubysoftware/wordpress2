/**
 * `plataforma/dados/` — a camada de dados, carregada vazia.
 *
 * Entrega de **T002** da feature `015-plataforma-transversal`: *"registro de
 * operacao, traducao, sanitizacao e camada de dados carregam como modulos
 * proprios, com as portas declaradas e nenhuma regra implementada"*.
 * `satisfaz: — (infraestrutura)`. **Nenhum criterio de aceite esta satisfeito
 * aqui**, e nenhuma regra de negocio esta implementada: US-3 (REQ-164) e
 * **T007**, e os sete testes do catalogo (UT-164-1 a UT-164-7) sao **T008**.
 * Leitura obrigatoria de quem pegar T007: `./README.md`.
 *
 * **O nome da pasta nao foi escolhido aqui.** `target_architecture.md` nomeia
 * `plataforma/dados/` na tabela de componentes, com a responsabilidade escrita
 * ao lado — *"montagem de SQL **por fragmento, com ponto de filtro entre cada
 * fragmento**"* — e a origem: *"fundido — `camada-de-dados-wpdb` (33
 * dependentes); 9 classes montam SQL assim"*. E a segunda porta do plano de
 * migracao e a maior: 1.128 chamadas `$wpdb->` em 98 dos 1.467 arquivos PHP,
 * pela medicao do slot `persistencia` do `plan.md`.
 *
 * Duas coisas que este arquivo faz de proposito, as mesmas dos esqueletos das
 * features anteriores:
 *
 * - **Nao guarda estado de modulo.** `EXT-CONTEXTO` (BR-MIGRAR-105) poe
 *   identidade, consulta corrente e **conexao de banco** no escopo da
 *   REQUISICAO, e diz que isso e regra e nao acidente: no legado `$wpdb` e, de
 *   fato, variavel de requisicao, porque o processo e montado por
 *   `wp-settings.php:134` (`global $wpdb`) e descartado no fim da resposta.
 *   Guardar a conexao como estado de modulo num processo longo-vivo e a
 *   implicacao 2, que `parity_specs.md` poe na linha 5 da metrica primaria com
 *   tolerancia **zero, sem excecao**. `./modulo.test.ts` afirma que cada
 *   composicao e independente.
 * - **Nao resolve nada no carregamento.** Criar o modulo nao abre conexao e nao
 *   executa consulta. A ordem de arranque e contrato publico (`EXT-ORDEM`,
 *   BR-MIGRAR-106) e no legado a camada de dados nasce num ponto nomeado da
 *   sequencia (`require_wp_db()`, `wp-includes/load.php:706`, antes de
 *   `wp_set_wpdb_vars()` em `wp-settings.php:148`). `./modulo.test.ts` afirma
 *   que nenhuma consulta e emitida ao compor.
 */

import type { PortaDeDriver } from './portas/index.js';

export * from './portas/index.js';
export {
  criarDriverQueRegistra,
  NADA_ENCONTRADO,
  type DriverQueRegistra,
  type OpcoesDoDriverQueRegistra,
} from './driver-que-registra.js';

/**
 * A porta de que este modulo depende, na forma em que ele a recebe.
 *
 * Uma so, e `./portas/index.ts` explica por que nao cinco.
 */
export interface PortasDeDados {
  readonly driver: PortaDeDriver;
}

/**
 * O modulo carregado.
 *
 * Hoje ha duas coisas, as duas de T002: a porta, e os dois prefixos que a borda
 * declara — repetidos aqui porque **todo nome de tabela se monta com um deles**
 * e porque e o unico dado da borda que a camada pode expor sem decidir nada.
 *
 * A tabela abaixo e a pauta de T007, cruzando os criterios de US-3 com o que
 * cada um exige do legado. Esta aqui para que a tarefa seguinte nao precise
 * redescobri-la, e **nada dela esta implementado**:
 *
 * | criterio | o que ele exige | ancora no legado |
 * |---|---|---|
 * | CA-3.1 | toda consulta por parametro, nunca por texto concatenado com dado | `class-wpdb.php:1458` (`prepare`), `:1402` e `:1442` (`%i`, identificador, desde a 6.2) |
 * | CA-3.2 | a camada recusa fragmento de consulta vindo de **dado de entrada** | ⚠️ ver `./README.md`: fragmento **de extensao** e contrato publico (`EXT-FILTROS`), e as duas coisas nao sao a mesma |
 * | CA-3.3 | verificacao automatizada falha ao encontrar consulta concatenada | nao existe no legado: zero arquivo de teste em 3.381 |
 * | CA-3.4 | a camada e a unica porta: nenhum modulo de dominio abre conexao | `class-wpdb.php:2214` (`query`) e o unico ponto de execucao; o *drop-in* `wp-content/db.php` o substitui inteiro (`load.php:711`) |
 * | CA-3.5 | o perfil de consultas por requisicao e mensuravel | `class-wpdb.php:93` (`num_queries`), `:719` e os portoes `SAVEQUERIES` em `:2348` e `:2358` |
 *
 * E a lista do que **nao** entra, com a regra de cada um: transacao
 * (`EXT-EXCLUSAO`, zero `START TRANSACTION` em 1.467 arquivos), chave
 * estrangeira (P5: 18 tabelas, 59 indices, **zero** FK) e erro de escrita
 * (`DB-DEG`: a escrita invalida se degrada em silencio).
 */
export interface ModuloDeDados {
  readonly nome: 'dados';
  readonly portas: PortasDeDados;
  /** O prefixo do site corrente, como a borda o declara. */
  readonly prefixoDeTabela: string;
  /** O prefixo das tabelas globais da rede. */
  readonly prefixoBaseDeTabela: string;
}

/**
 * Compoe o modulo sobre a porta recebida.
 *
 * Substitui, no alvo, o que no legado era o *drop-in* `wp-content/db.php`:
 * `EXT-SUBST` (BR-MIGRAR-103) manda preservar os 42 pontos de substituicao como
 * requisito funcional, com o criterio declarado de *"um ponto e substituivel no
 * alvo se um pacote de terceiro puder trocar a implementacao sem alterar arquivo
 * do nucleo, com a resolucao acontecendo antes do primeiro uso"*. Trocar a porta
 * aqui e exatamente isso. Se o **caminho de arquivo** tambem continua sendo API
 * e questao aberta — REQ-170 quer descarta-la, P2 e P8 a preservam, e `spec.md`
 * registra o conflito sem resolve-lo.
 */
export function criarModuloDeDados(portas: PortasDeDados): ModuloDeDados {
  return {
    nome: 'dados',
    portas,
    prefixoDeTabela: portas.driver.prefixoDeTabela,
    prefixoBaseDeTabela: portas.driver.prefixoBaseDeTabela,
  };
}
