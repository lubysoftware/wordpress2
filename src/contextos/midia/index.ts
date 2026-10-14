/**
 * Modulo de midia — BC-04 de `target_architecture.md`.
 *
 * Feature `006-biblioteca-de-midia`, tarefas fechadas **T001**, **T002**,
 * **T003** e **T005**. O que existe aqui e o que as quatro entregam: T001, *"o
 * modulo carrega com as portas de dados, de sistema de arquivos e de
 * processamento de imagem declaradas, e os tamanhos de fabrica do legado
 * registrados como dado"*; T002, *"o anexo existe como registro de conteudo com
 * estado herdado, e o metadado que descreve as derivadas e gravado e lido pela
 * porta de dados com a mesma forma do legado"*; T003, *"o comportamento de US-1
 * existe e os criterios CA-1.1 a CA-1.6 passam contra o sistema novo"*; T005,
 * *"o comportamento de US-2 existe e os criterios CA-2.1 a CA-2.4 passam contra
 * o sistema novo"*.
 *
 * **As duas regras de negocio implementadas sao a de US-1** — o envio com
 * validacao do tipo real do arquivo, em `envio/` — **e a de US-2**, a
 * visibilidade herdada do anexo, em `visibilidade/`, que e a metade de leitura de
 * `P2` (a metade de gravacao e de BC-01 e ja existia). A geracao de derivadas, a
 * reducao na ingestao, o relato de falha, a escolha da derivada, a
 * transformacao, o descarte do arquivo e o contorno do filtro com registro
 * entram nas tarefas delas (T007 em diante), e a leitura obrigatoria de cada uma
 * esta em `./README.md`.
 *
 * A pasta e `contextos/midia/` porque e assim que `target_architecture.md`
 * nomeia BC-04 no esboco de arvore; a feature se chama `006-biblioteca-de-midia`
 * no pacote de specs, e sao a mesma coisa.
 *
 * Duas coisas que este arquivo faz de proposito, as mesmas que o esqueleto de
 * BC-05 faz, e pelos mesmos dois motivos:
 *
 * - **Nao guarda estado de modulo.** BR-MIGRAR-105 (`EXT-CONTEXTO`) poe
 *   identidade, consulta corrente e conexao no escopo da REQUISICAO. Por isso as
 *   portas chegam por argumento e nao existe instancia compartilhada neste
 *   arquivo: duas composicoes nao se enxergam, e o armazenamento de cada uma
 *   nasce da porta dela. O unico dado compartilhado e a lista de tamanhos de
 *   fabrica, que e congelada.
 * - **Nao resolve nada no carregamento.** O modulo nao consulta dados, nao toca
 *   disco e nao abre imagem ao ser criado: compor o armazenamento monta nome de
 *   tabela e nada mais. A ordem de arranque e contrato publico (BR-MIGRAR-106,
 *   `EXT-ORDEM`), e trabalho feito na importacao e trabalho fora da ordem.
 *   `modulo.test.ts` afirma as duas coisas.
 */

import {
  criarArmazenamentoDeMidia,
  type ArmazenamentoDeMidia,
} from './armazenamento/index.js';
import {
  enviarArquivo,
  type ContextoDeEnvio,
  type PedidoDeEnvio,
  type ResultadoDoEnvio,
} from './envio/index.js';
import type {
  PortaDeDados,
  PortaDeProcessamentoDeImagem,
  PortaDeSistemaDeArquivos,
} from './portas/index.js';
import {
  TAMANHOS_DE_IMAGEM_DE_FABRICA,
  type TamanhoDeImagemDeFabrica,
} from './tamanhos/index.js';
import {
  visibilidadeDoAnexo,
  type ContextoDeVisibilidade,
  type RegistroNaVisibilidade,
} from './visibilidade/index.js';

export * from './armazenamento/index.js';
export * from './envio/index.js';
export * from './portas/index.js';
export * from './tamanhos/index.js';
export * from './visibilidade/index.js';

/** As tres portas de que este modulo depende, na forma em que ele as recebe. */
export interface PortasDeMidia {
  readonly dados: PortaDeDados;
  readonly sistemaDeArquivos: PortaDeSistemaDeArquivos;
  readonly processamentoDeImagem: PortaDeProcessamentoDeImagem;
}

/**
 * O modulo carregado.
 *
 * Cada historia acrescenta aqui a sua operacao, com a declaracao explicita de
 * permissao que o P4 da constituicao exige, e nenhuma antes da propria tarefa.
 * Hoje ha cinco coisas: as portas e os tamanhos de fabrica, de T001, o
 * armazenamento, de T002, e **duas** operacoes — {@link
 * ModuloDeMidia.enviarArquivo}, de T003, e {@link
 * ModuloDeMidia.visibilidadeDoAnexo}, de T005.
 *
 * A tabela abaixo e o que a secao *Contratos* de `plan.md` lista, com a
 * capacidade que a `spec.md` cobra em cada uma. Ela esta aqui como **pauta**, e
 * nao como promessa de forma: quem fechar cada tarefa escreve a operacao dela e
 * declara a permissao na interface, como BC-05 fez.
 *
 * | operacao | historia | tarefa | permissao, como o pacote a declara |
 * |---|---|---|---|
 * | enviar arquivo ✔ | US-1 | T003 | `upload_files`, mais `edit_post` do destino quando ha destino — UC-12 nomeia as duas, CA-1.1 as cobra |
 * | visibilidade do anexo ✔ | US-2 | T005 | **nenhuma**, e e declaracao e nao omissao: e esta leitura que alimenta a decisao de capacidade (`capabilities.php:350`) — ver {@link ModuloDeMidia.visibilidadeDoAnexo} |
 * | gerar derivadas | US-3 | T007 | o pacote nao declara nenhuma; CA-3.3 pede uma acao explicita para regerar, e quem a expor declara a dela (P4) |
 * | servir derivada | US-6 | T013 | nenhuma: a historia e do visitante, e a rastreabilidade dela aponta UC-01 |
 * | transformar imagem | US-7 | T015 | *"a capacidade de editar aquele anexo"* (CA-7.1), sem que o pacote a nomeie |
 * | restaurar original | US-7 | T015 | a mesma (CA-7.4) |
 * | apagar anexo | US-8 | T017 | `plan.md` registra so o erro *"sem permissao"*, sem nomear capacidade — e o apagamento e **definitivo** (`R3`) |
 * | contornar filtro de tipo | US-9 | T019 | `unfiltered_upload`, que UC-12 nomeia e que **so existe se a instalacao declarar** (CA-9.1, CA-9.2) |
 */
export interface ModuloDeMidia {
  readonly nome: 'midia';
  readonly portas: PortasDeMidia;

  /**
   * A forma de armazenamento do anexo e das derivadas (T002). Le e grava
   * **somente** pela porta de dados.
   *
   * **Nao e operacao, e por isso nao declara permissao:** ele nao decide nada,
   * nao recusa nada e nao autoriza nada. A linha de `tasks.md` e literal —
   * `satisfaz: — (infraestrutura)`.
   */
  readonly armazenamento: ArmazenamentoDeMidia;

  /**
   * Coloca um arquivo na biblioteca, validando o **tipo real** dele (US-1,
   * T003). E `media_handle_upload()` com `_wp_handle_upload()` dentro
   * (`wp-admin/includes/media.php:296` e `wp-admin/includes/file.php:809`), e e
   * o fluxo principal de UC-12.
   *
   * **Permissao exigida: `upload_files`, mais `edit_post` do conteudo de destino
   * quando ha destino** — as duas que UC-12 nomeia e que CA-1.1 cobra. A recusa
   * e **valor**, com os textos do legado.
   *
   * ⚠️ **A consequencia da segunda pergunta depende da superficie, e isso e o
   * legado, nao uma brecha.** Duas das tres superficies do envio **descartam o
   * destino** e seguem — o anexo nasce sem pai — e so o envio assincrono do
   * editor recusa. CA-1.1 lido como *"toda superficie recusa"* divergiria do
   * legado em duas das tres, e a divergencia esta registrada, com as ancoras das
   * tres, em `envio/permissao-de-envio.ts`. Esta tarefa **nao a resolve**:
   * {@link PedidoDeEnvio.superficie} diz de onde a chamada veio e os tres
   * desfechos do legado sao devolvidos como sao.
   *
   * **O que esta operacao NAO faz:** nao gera derivada (T007), nao reduz imagem
   * na ingestao (T009), nao relata falha de processamento (T011) e nao registra
   * o envio sem filtro de tipo (T019, CA-9.4). Os quatro pontos estao nomeados
   * no lugar exato do fluxo, em `envio/enviar-arquivo.ts`.
   *
   * O contexto chega por argumento, e nao pela composicao, porque identidade,
   * matriz de papeis e estado de rede sao escopo de REQUISICAO (AD-02,
   * BR-MIGRAR-105) — e porque a colaboracao com BC-01, que e quem grava a linha
   * do anexo, e de ligacao tardia (AD-10, regra de dependencia 3).
   */
  enviarArquivo(
    contexto: ContextoDeEnvio,
    pedido: PedidoDeEnvio,
  ): ResultadoDoEnvio;

  /**
   * A visibilidade com que o arquivo e visto — a do conteudo de destino, nunca a
   * propria (US-2, T005). E `get_post_status()`
   * (`wp-includes/post.php:1290`-`:1348`), e e a **metade de leitura** de `P2`
   * (BR-MIGRAR-002).
   *
   * **Permissao exigida: nenhuma, e isso e declaracao explicita e nao
   * omissao** (P4). A funcao do legado nao pergunta capacidade alguma, e nao
   * poderia: e ela que **alimenta** a decisao de capacidade —
   * `map_meta_cap()` resolve `read_post` com
   * `get_post_status_object( get_post_status( $post ) )`
   * (`wp-includes/capabilities.php:350`) e `is_post_publicly_viewable()` decide
   * o acesso do visitante com o mesmo valor (`wp-includes/post.php:2550`).
   * Exigir capacidade aqui inverteria a ordem das duas.
   *
   * ⚠️ **A outra metade de `P2` nao esta neste modulo, e nao e esquecimento.** A
   * reescrita do estado na **gravacao** (`:4705`) acontece dentro de
   * `wp_insert_post()`, que e BC-01, e ja existe em
   * `contextos/conteudo/gravacao/estado-na-gravacao.ts`. O que esta feature
   * garante do lado da escrita e que o pedido que atravessa a ligacao tardia
   * **nao tem campo de estado** — ver `PedidoDeAnexo`.
   *
   * ⚠️ **Nao escreve nada, nem corrige a coluna.** O valor resolvido vive so na
   * resposta, e e por isso que CA-2.4 — *"mudar a visibilidade do conteudo de
   * destino muda a do anexo junto"* — acontece sem escrita nenhuma no anexo.
   *
   * Devolve `null` onde o legado devolve `false`: identificador que nao existe.
   *
   * O contexto chega por argumento, e nao pela composicao, porque as duas
   * leituras que ela faz sao do **conteudo pai** — `get_post()` de BC-01 e o
   * marcador de lixeira de BC-05 —, e colaboracao entre contextos e ligacao
   * tardia (AD-10, regra de dependencia 3).
   */
  visibilidadeDoAnexo(
    contexto: ContextoDeVisibilidade,
    conteudo: number | RegistroNaVisibilidade,
  ): string | null;

  /**
   * Os seis tamanhos de fabrica do legado, na ordem dele (`M2`,
   * BR-MIGRAR-058; CA-3.2).
   *
   * E dado, nao registro: acrescentar tamanho e `add_image_size()`, que e
   * estado de requisicao e nao de modulo. Ver `tamanhos/tamanhos-de-fabrica.ts`.
   */
  readonly tamanhosDeFabrica: readonly TamanhoDeImagemDeFabrica[];
}

/**
 * Compoe o modulo sobre as portas recebidas.
 *
 * Substitui, no alvo, o que no legado era ausencia de codigo: BR-MIGRAR-103
 * (`EXT-SUBST`) poe o registro explicito, resolvido antes do primeiro uso, no
 * lugar da redefinicao de funcao global. Trocar uma porta e passar outra
 * implementacao aqui — sem alterar arquivo deste modulo, que e o criterio de
 * "substituivel" que BR-MIGRAR-103 propoe, e que o cenario `@composicao` do
 * teste de paridade desta feature exercita quando substitui a porta de sistema
 * de arquivos por um duplo que registra cada operacao.
 *
 * O registro e escrito a mao de proposito: a Lacuna 1 de `pending_decisions.md`
 * fixou "nenhum framework opinativo... sem container de DI, sem ORM, sem ciclo
 * de vida de framework", porque a ordem de arranque do legado e contrato publico
 * e framework com ciclo de vida proprio disputa com ela.
 */
export function criarModuloDeMidia(portas: PortasDeMidia): ModuloDeMidia {
  return {
    nome: 'midia',
    portas,
    // Compor o armazenamento monta nome de tabela e nada mais: nenhuma consulta
    // sai daqui (`EXT-ORDEM`, BR-MIGRAR-106).
    armazenamento: criarArmazenamentoDeMidia(portas.dados),
    enviarArquivo,
    visibilidadeDoAnexo,
    tamanhosDeFabrica: TAMANHOS_DE_IMAGEM_DE_FABRICA,
  };
}
