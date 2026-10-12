/**
 * Modulo de superficies programaticas — feature `013-superficies-programaticas`,
 * epico EP-13.
 *
 * Esqueleto de **T001** mais os dois formatos de **T002**. O que existe aqui:
 * *"o despachante de rotas carrega com o registro de rotas vazio e
 * inspecionavel, e a porta de dados declarada"* (T001) e *"os dois formatos
 * existem como declaracao, com validacao de parametro ainda vazia, e o registro
 * de uma rota sem declaracao de permissao reproduz o aviso de uso indevido do
 * legado"* (T002). **Nenhuma regra de negocio de historia esta implementada.**
 * O despacho entra em T003, a validacao de parametro de verdade em T005, o mapa
 * da superficie em T007, o registro de acesso em T009, o token de sessao de
 * navegador em T011, a execucao de operacao nomeada em T013, o mapa do site em
 * T015, os feeds em T017 e a representacao embutivel em T019. A leitura
 * obrigatoria de quem pegar a tarefa seguinte e `./README.md`.
 *
 * ⚠️ **T002 nao acrescentou operacao ao modulo, e isso e de proposito.** Ele
 * declarou formato e registro, que sao infraestrutura (`satisfaz: —`), e a
 * tabela de `ModuloDeSuperficiesProgramaticas` abaixo cresce **na tarefa de cada
 * historia**, nunca antes — e o que o **P4** cobra. As duas camadas de registro
 * de T002 sao criadas por quem compoe: o registro de rotas pelo despachante, e
 * o de operacoes nomeadas por T013, que e a tarefa que as executa.
 *
 * **Onde este modulo mora, e por que a pasta leva o nome da feature.** Esta
 * feature nao e um contexto do desenho: ela atravessa dois. As historias US-1 a
 * US-6 sao `BC-09` *Superficies de Programacao* — *"as quatro superficies de
 * escrita paralelas a API... com o comportamento atual"*. As historias US-7,
 * US-8 e US-9 — mapa do site, feeds e representacao embutivel — sao `BC-08`
 * *Contratos de Leitura*, que `target_architecture.md` agrupa *"pelo criterio de
 * aceite"* porque os tres sao byte a byte. A pasta leva o nome da feature, como
 * `004-leitura-publica` fez com a dela, por tres razoes: a tarefa nomeia *"o
 * modulo de superficies programaticas"*; `BC-08` e tambem destino da feature
 * `004`, que esta sendo construida em paralelo, e duas features escrevendo a
 * mesma pasta e conflito de merge, nao arquitetura; e a escolha nao muda nada do
 * que o teste de borda da Opcao 3 mede — *"muda a saida HTTP, o efeito no banco
 * ou o comportamento de caso de uso?"*. Consolidar as pastas no desenho de
 * `target_architecture.md` e trabalho de quem tiver as 15 features na mao, e e
 * reversivel: nenhum nome publico depende do caminho do arquivo.
 *
 * Duas coisas que este arquivo faz de proposito, as mesmas que os esqueletos das
 * features anteriores:
 *
 * - **Nao guarda estado de modulo.** BR-MIGRAR-105 (`EXT-CONTEXTO`) poe
 *   identidade, consulta corrente e conexao no escopo da REQUISICAO. Aqui a
 *   tentacao e maior do que em qualquer outro contexto, porque o legado **de
 *   fato** guarda o servidor num global (`rest_get_server()`,
 *   `wp-includes/rest-api.php:629`) — mas num modelo de processo por requisicao
 *   aquele global morre com a resposta, logo ele ja e escopo de requisicao.
 *   Copia-lo como estado de modulo num processo longo-vivo faria as rotas de uma
 *   requisicao vazarem para a seguinte, e numa rede as de um site para outro. E
 *   a linha 5 da metrica de `parity_specs.md`, a unica com tolerancia **zero,
 *   sem excecao**.
 * - **Nao resolve nada no carregamento.** O modulo nao consulta dados e nao
 *   registra rota ao ser criado. A ordem de arranque e contrato publico
 *   (BR-MIGRAR-106, `EXT-ORDEM`): no legado o registro acontece em
 *   `rest_api_init`, que dispara **depois** de o servidor existir
 *   (`wp-includes/rest-api.php:644-657`), e `register_rest_route()` **avisa**
 *   quem registra fora daquele gancho (`:81-92`). `./modulo.test.ts` afirma as
 *   duas coisas.
 */

import { criarDespachanteDeRotas, type DespachanteDeRotas } from './despacho/index.js';
import type { PortaDeDados } from './portas/index.js';

export * from './portas/index.js';
export * from './despacho/index.js';
export * from './operacao-nomeada/index.js';

/**
 * A porta de que este modulo depende, na forma em que ele a recebe.
 *
 * Uma so em T001, e `./portas/index.ts` explica por que nao cinco.
 */
export interface PortasDeSuperficiesProgramaticas {
  readonly dados: PortaDeDados;
}

/**
 * O modulo carregado.
 *
 * Cada historia acrescenta aqui a sua operacao, com a declaracao explicita de
 * permissao que o P4 da constituicao exige, e **nenhuma antes da propria
 * tarefa**. Hoje ha duas coisas, as duas de T001: a porta e o despachante — e
 * T002, que e infraestrutura, nao acrescentou nenhuma.
 *
 * A tabela abaixo e a secao *Contratos* de `plan.md` cruzada com a permissao que
 * a `spec.md` e os casos de uso declaram para cada historia. Ela esta aqui como
 * **pauta**, para que nenhuma operacao nasca sem declaracao e para que a tarefa
 * que a escrever nao precise redescobri-la:
 *
 * | operacao | historia | tarefa | permissao, como o pacote a declara |
 * |---|---|---|---|
 * | despachar requisicao de programa | US-1 | T003 | **a declaracao de cada rota — e a camada falha ABERTA:** rota sem declaracao funciona e so avisa (`I7`/BR-MIGRAR-074; UC-44). Reproduzir e o que `BR-HUMANA-008` manda ate alguem decidir |
 * | validar e sanitizar parametro | US-2 | T005 | nenhuma propria: e a etapa 4 do fluxo de UC-44, **depois** do portao da rota (CA-2.3) |
 * | publicar o mapa da superficie | US-3 | T007 | **nenhuma, e a declaracao e o ponto:** *"a raiz da API lista as rotas e os esquemas sem exigir credencial: o mapa da superficie e publico"* (UC-44; regra de negocio de US-3) |
 * | registrar o acesso | US-4 | T009 | nenhuma: e registro interno. 🔴 e o legado **nao registra nada** — *"nenhum registro da chamada foi guardado"* (UC-44, pos-condicoes). Ver `README.md` |
 * | exigir token adicional | US-5 | T011 | nenhuma capacidade: o portao e o token, exigido **so** quando a identidade vem de sessao de navegador, *"porque a requisicao e falsificavel"* (UC-44, fluxo alternativo; UC-23) |
 * | executar operacao nomeada | US-6 | T013 | **a declaracao da propria operacao — e a camada falha FECHADA:** ausente ou nao chamavel e erro, nao liberacao (`I4`/BR-MIGRAR-071), e o resultado e filtravel **para conceder** (`I5`/BR-MIGRAR-072) |
 * | servir o indice de mapa do site | US-7 | T015 | nenhuma: o ator e o buscador. O portao e `blog_public` e a restricao de leitura (CA-7.2, CA-7.3) |
 * | servir feed | US-8 | T017 | nenhuma: *"o feed e montado da mesma consulta publica que a pagina, sem regra de visibilidade propria"* (CA-8.2) |
 * | servir representacao embutivel | US-9 | T019 | **nenhuma, por desenho:** `permission_callback` e `__return_true` na rota `oembed/1.0/embed` (`wp-includes/class-wp-oembed-controller.php:41`) |
 *
 * As historias US-3, US-7, US-8 e US-9 declaram *"nenhuma"* e isso **e** a
 * declaracao que o P4 pede: o default dessas superficies e aberto por regra lida
 * do legado, e acrescentar verificacao ali fecharia o sistema mais que o
 * original.
 */
export interface ModuloDeSuperficiesProgramaticas {
  readonly nome: 'superficies-programaticas';
  readonly portas: PortasDeSuperficiesProgramaticas;
  /**
   * O despachante desta composicao, com o registro de rotas vazio e
   * inspecionavel. Ver `./despacho/despachante-de-rotas.ts` para a ordem das
   * etapas do atendimento, que e contrato antes de ser codigo.
   */
  readonly despachante: DespachanteDeRotas;
}

/**
 * Compoe o modulo sobre a porta recebida.
 *
 * Substitui, no alvo, o que no legado era redefinicao de funcao global:
 * BR-MIGRAR-103 (`EXT-SUBST`) poe o registro explicito, resolvido antes do
 * primeiro uso, no lugar das guardas de existencia de funcao. Trocar a porta e
 * passar outra implementacao aqui, sem alterar arquivo deste modulo — que e o
 * criterio de "substituivel" daquela regra.
 *
 * ⚠️ **O legado tem um ponto de extensao para trocar a propria classe do
 * servidor**, `wp_rest_server_class` (`wp-includes/rest-api.php:644`), e ele e
 * contrato publico (P2). Trocar o despachante inteiro nao e a mesma coisa que
 * trocar uma porta, e T001 **nao** o reproduz: quem precisar dele declara o
 * parametro na tarefa dele. Fica registrado para que ninguem o perca por
 * silencio.
 *
 * O registro e escrito a mao de proposito: a Lacuna 1 de `pending_decisions.md`
 * fixou *"nenhum framework opinativo... sem container de DI, sem ORM, sem ciclo
 * de vida de framework"*, porque a ordem de arranque do legado e contrato
 * publico e framework com ciclo de vida proprio disputa com ela. Nesta feature a
 * frase morde direto: o slot `framework-http` do `plan.md` recomenda servidor
 * HTTP do runtime com roteador proprio, porque *"todo framework que ajudasse na
 * borda normalizaria algo que o criterio de identico proibe normalizar: ordem de
 * cabecalho, resposta malformada aceita, e as 7 formas de saida observaveis"*.
 */
export function criarModuloDeSuperficiesProgramaticas(
  portas: PortasDeSuperficiesProgramaticas,
): ModuloDeSuperficiesProgramaticas {
  return {
    nome: 'superficies-programaticas',
    portas,
    despachante: criarDespachanteDeRotas(),
  };
}
