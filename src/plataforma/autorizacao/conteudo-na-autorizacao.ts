/**
 * O que a traducao de capacidade sobre conteudo precisa saber do conteudo — e
 * nada mais do que isso.
 *
 * Entrega de **T017** da feature `001-identidade-e-acesso` (US-8): *"resolver
 * permissao sobre um objeto conforme autoria e estado do objeto"*. Este arquivo e
 * o **vocabulario**; os casos estao em `traducao-de-conteudo.ts`.
 *
 * ## Por que isto e uma porta, e nao um `import`
 *
 * A regra de dependencia 2 de `target_architecture.md` proibe `plataforma/`
 * importar `contextos/`, e conteudo e BC-01, nao BC-05. Mas a traducao de
 * capacidade sobre objeto mora aqui por decisao registrada:
 * `target_architecture.md` poe em `plataforma/autorizacao/` *"a **decisao** de
 * capacidade e a traducao de capacidade sobre objeto (`map_meta_cap`)"*.
 *
 * As duas coisas valem ao mesmo tempo com a mesma costura de ligacao tardia que
 * `fonte-de-autorizacao.ts` usa para o dado do papel: a interface e **declarada
 * embaixo** e **implementada em cima**. {@link FonteDeConteudoNaAutorizacao} e a
 * lista fechada do que `map_meta_cap()` le do conteudo — nada mais do registro
 * atravessa esta fronteira, e em particular o corpo do texto nunca atravessa.
 *
 * **E sincrona**, como todo `plataforma/`: AD-04 fixa a fronteira de `await` em
 * `adaptadores/`. No legado, as cinco leituras abaixo saem do cache de objeto da
 * requisicao, nao do banco.
 *
 * ## As cinco leituras, e a anotacao de legado de cada uma
 *
 * | leitura | o que e no legado |
 * |---|---|
 * | {@link FonteDeConteudoNaAutorizacao.conteudo} | `get_post( $args[0] )` |
 * | {@link FonteDeConteudoNaAutorizacao.tipoDeConteudo} | `get_post_type_object( $post->post_type )` |
 * | {@link FonteDeConteudoNaAutorizacao.estadoDeConteudo} | `get_post_status_object( get_post_status( $post ) )` |
 * | {@link FonteDeConteudoNaAutorizacao.estadoAnteriorNaLixeira} | `get_post_meta( $post->ID, '_wp_trash_meta_status', true )` |
 * | as tres paginas de funcao especial | `get_option( 'page_for_posts' )`, `get_option( 'page_on_front' )`, `get_option( 'wp_page_for_privacy_policy' )` |
 */

import type { Capacidade } from './capacidade.js';

/**
 * `$post->post_type` de uma revisao.
 *
 * Nao e nome de conveniencia: a revisao e o unico tipo que os casos de objeto
 * tratam pelo **nome do tipo** e nao pelo registro dele, e os dois casos a tratam
 * de forma **oposta** — editar segue para o conteudo pai, apagar fecha a porta
 * (`BR-MIGRAR-091`: *"revisao nao se apaga por capacidade"*; UC-07 e UC-09 repetem
 * a frase na tabela de excecoes).
 */
export const TIPO_DE_REVISAO = 'revision';

/**
 * Os dois estados que contam como *"ja esta publicado"* na resolucao por estado.
 *
 * Agendado entra junto com publicado, e isso e do legado: `in_array(
 * $post->post_status, array( 'publish', 'future' ) )`. UC-07 diz a mesma coisa na
 * nota do passo 2 — *"edit_others_posts + edit_published_posts se publish ou
 * future"*. Quem le so a tela supoe que agendado ainda e rascunho; a autorizacao
 * nao supoe.
 */
export const ESTADOS_PUBLICADOS: readonly string[] = ['publish', 'future'];

/** `private` — o estado que acrescenta a capacidade de privado ao mexer no alheio. */
export const ESTADO_PRIVADO = 'private';

/**
 * `trash` — o estado em que a permissao e decidida pelo estado **anterior**
 * (CA-8.2).
 */
export const ESTADO_DE_LIXEIRA = 'trash';

/**
 * A chave de metadado em que a lixeira guarda o estado anterior do conteudo.
 *
 * O nome e do legado e nao se traduz: o **P8** poe superficie publicada no
 * contrato publico, e esta chave e lida por extensao de terceiro. UC-09 passo 3 a
 * nomeia — *"`_wp_trash_meta_status` e `_wp_trash_meta_time`: a lixeira tem
 * memoria"* — e UC-10 passo 2 e quem diz para que ela serve aqui: *"map_meta_cap
 * le `_wp_trash_meta_status` quando o status e trash"*.
 */
export const CHAVE_DO_ESTADO_ANTERIOR_NA_LIXEIRA = '_wp_trash_meta_status';

/** `page_on_front` — a opcao que aponta a pagina inicial. */
export const OPCAO_DA_PAGINA_INICIAL = 'page_on_front';

/** `page_for_posts` — a opcao que aponta a pagina de conteudos. */
export const OPCAO_DA_PAGINA_DE_CONTEUDOS = 'page_for_posts';

/** `wp_page_for_privacy_policy` — a opcao que aponta a pagina de politica. */
export const OPCAO_DA_PAGINA_DE_POLITICA = 'wp_page_for_privacy_policy';

/**
 * O conteudo, do ponto de vista da autorizacao: seis campos, e nenhum deles e o
 * texto.
 */
export interface ConteudoNaAutorizacao {
  /** `$post->ID`. */
  readonly id: number;
  /** `$post->post_type`. */
  readonly tipo: string;
  /**
   * `$post->post_status` **cru**, como esta gravado.
   *
   * E o que os casos de editar e de apagar consultam, e e por isso que
   * {@link estadoParaLeitura} existe separado: ler consulta o estado
   * **resolvido**, e os dois nao sao o mesmo campo no legado.
   */
  readonly estado: string;
  /**
   * `get_post_status( $post )` — o estado **resolvido**, que e o que o caso de
   * ler consulta.
   *
   * ⚠️ **Para tudo o que nao e anexo, este campo e igual a {@link estado}**, e e
   * a porta que o preenche. A diferenca existe porque `get_post_status()` resolve
   * o estado de um anexo pelo conteudo pai (`inherit`, anexo solto, pai na
   * lixeira), e essa resolucao e da biblioteca de midia — feature 006, nao esta.
   * Declarar o campo aqui nomeia a fronteira; preenche-lo com `estado` e o que
   * todo tipo que nao e anexo faz de qualquer forma. Fecha contra o oraculo
   * (`ESC-ORACULO`, BR-MIGRAR-116).
   */
  readonly estadoParaLeitura: string;
  /**
   * `$post->post_author` — o identificador de quem escreveu, ou `0` quando nao ha.
   *
   * **`0` nao e "ninguem e o autor": e "a autoria nao decide nada".** No legado a
   * condicao e `if ( $post->post_author && $user_id == $post->post_author )`, e o
   * primeiro termo e um teste de valor verdadeiro: autoria ausente cai no ramo do
   * alheio **inclusive para quem nao esta autenticado**, que tambem tem
   * identificador `0`. Sem esse curto-circuito, o ator anonimo seria autor de todo
   * conteudo sem autor.
   */
  readonly autorId: number;
  /** `$post->post_parent` — o conteudo pai; `0` quando nao ha. */
  readonly paiId: number;
}

/**
 * O tipo de conteudo registrado — `get_post_type_object()`.
 *
 * Dois campos decidem, e o segundo e o que quase todo porte perde.
 */
export interface TipoDeConteudoNaAutorizacao {
  /** O nome com que o tipo foi registrado. */
  readonly nome: string;
  /**
   * `$post_type->map_meta_cap` — se este tipo passa pela resolucao por autoria e
   * estado, ou se ele a **dispensa**.
   *
   * Desligado, o caso devolve a capacidade que o proprio registro declarou para o
   * nome pedido e **para**: nem autoria, nem estado, nem lixeira, nem pagina de
   * politica. E o valor de fabrica de um tipo registrado sem declarar nada, e
   * reproduzi-lo e o que impede o sistema novo de ser **mais fechado** que o
   * legado para tipo de terceiro.
   */
  readonly traduzMetaCapacidade: boolean;
  /**
   * `$post_type->cap` — o mapa de nome pedido (e de slot primitivo) para o nome
   * de capacidade **daquele tipo**.
   *
   * E aqui que `edit_posts` vira `edit_pages`: no legado o conjunto e derivado de
   * `capability_type`, e e por isso que *"nenhuma capacidade de pagina chega a
   * autor ou colaborador"* (UC-07, fluxo alternativo "O conteudo e uma pagina") sem
   * que exista um unico `if` sobre o nome `page` na decisao.
   *
   * Mapa aberto, e nao uniao fechada, pela mesma razao de `capacidade.ts`: um tipo
   * de terceiro declara o conjunto que quiser, em execucao.
   */
  readonly capacidades: Readonly<Record<string, Capacidade>>;
}

/**
 * O estado de conteudo registrado — `get_post_status_object()`.
 *
 * Os dois sinalizadores que o caso de ler consulta, e so eles.
 */
export interface EstadoDeConteudoNaAutorizacao {
  /** O nome com que o estado foi registrado. */
  readonly nome: string;
  /** `$status_obj->public` — visivel a quem nao esta autenticado. */
  readonly publico: boolean;
  /** `$status_obj->private` — exige a capacidade de ler privado do tipo. */
  readonly privado: boolean;
}

/**
 * As cinco leituras que `map_meta_cap()` faz do conteudo, declaradas embaixo e
 * implementadas em cima.
 */
export interface FonteDeConteudoNaAutorizacao {
  /**
   * `get_post( $args[0] )` — o conteudo a que a pergunta se refere, ou `null`
   * quando ele nao existe.
   *
   * A referencia chega em `unknown` porque e o `...$args` do chamador, e no legado
   * ela pode ser identificador ou o proprio registro. Quem resolve as duas formas
   * e a porta.
   *
   * 🔴 **Uma nota de legado que esta tarefa NAO reproduziu, e a razao esta no
   * pacote.** `get_post( null )` no legado devolve o conteudo **global** da
   * requisicao, logo perguntar sem informar o objeto, dentro de um laco de
   * listagem, decide sobre o conteudo corrente. O pacote declara a regra pelo
   * resultado e nao pela implementacao — BR-MIGRAR-091: *"verificar capacidade de
   * post **sem informar o objeto** devolve `do_not_allow`"* —, o cenario
   * `@critico` de `07-autorizacao-por-capacidade.feature` cobra *"quando a mesma
   * capacidade e verificada sem informar o objeto, as duas metades negam"*, e
   * `EXT-CONTEXTO` (BR-MIGRAR-105) poe a identidade e o estado da requisicao fora
   * de variavel global. Os tres apontam para o mesmo lado, e e esse lado que
   * `traducao-de-conteudo.ts` implementa: argumento ausente **nega**, sem chegar a
   * esta porta.
   */
  conteudo(referencia: unknown): ConteudoNaAutorizacao | null;

  /**
   * `get_post_type_object( $nome )`, ou `null` quando o tipo nao esta registrado.
   *
   * `null` nao e caminho raro: e um dos tres ramos de erro de `PERM-4`
   * (BR-MIGRAR-090), e o que ele produz esta em `traducao-de-conteudo.ts`.
   */
  tipoDeConteudo(nome: string): TipoDeConteudoNaAutorizacao | null;

  /** `get_post_status_object( $nome )`, ou `null` quando o estado nao esta registrado. */
  estadoDeConteudo(nome: string): EstadoDeConteudoNaAutorizacao | null;

  /**
   * O estado anterior gravado pela lixeira, ou cadeia vazia quando nao ha.
   *
   * Cadeia vazia e o valor que `get_post_meta( ..., true )` devolve para metadado
   * ausente, e e **legitimo**: UC-10 registra o caso em que o estado anterior nao
   * esta gravado, com o comentario do proprio legado (*"Confidence check. This
   * shouldn't happen."*). Um estado anterior ausente nao e publicado, logo a
   * resolucao cai na capacidade comum — e esse e o resultado do legado.
   */
  estadoAnteriorNaLixeira(conteudoId: number): string;

  /**
   * `get_option( 'page_on_front' )` como numero.
   *
   * A porta faz a conversao que o legado faz: a opcao e texto no armazenamento, a
   * comparacao do legado e frouxa (`==`) e o valor de fabrica e `0` — que nao
   * colide com conteudo algum, porque identificador de conteudo comeca em 1.
   */
  paginaInicial(): number;

  /** `get_option( 'page_for_posts' )` como numero. Ver {@link paginaInicial}. */
  paginaDeConteudos(): number;

  /**
   * `get_option( 'wp_page_for_privacy_policy' )` como numero.
   *
   * No legado esta e a unica das tres cuja comparacao e estrita — `(int)
   * get_option( ... ) === $post->ID` —, e com a conversao feita na porta as tres
   * ficam iguais aqui.
   */
  paginaDePoliticaDePrivacidade(): number;
}

/**
 * Um aviso de uso indevido — o `_doing_it_wrong()` do legado.
 *
 * **Por que ele e dado, e nao texto solto num log.** BR-MIGRAR-091 diz que o
 * aviso e **observavel**: *"negacao por ausencia de argumento e padrao que um
 * alvo com tipos obrigatorios tornaria impossivel de alcancar — e o aviso de uso
 * indevido deixaria de existir, **o que e observavel por quem estende**"*. No
 * legado `_doing_it_wrong()` dispara a acao `doing_it_wrong_run` e so entao
 * escreve, e escrever depende do modo de depuracao. Logo o aviso e ponto de
 * extensao antes de ser diagnostico, e o barramento que o disparara
 * (`plataforma/barramento/`) nao existe nesta arvore.
 *
 * O **P7** fixa o limite do que esta estrutura pode fazer: *"registro e
 * diagnostico novos podem ser acrescentados, mas nenhuma decisao do sistema pode
 * passar a depender deles"*. Dai {@link RelatorDeUsoIndevido} ser opcional e nao
 * devolver nada: ausente, a traducao decide igual; presente, ela decide igual.
 */
export interface AvisoDeUsoIndevido {
  /** `__FUNCTION__` — a funcao que avisa. */
  readonly funcao: string;
  /** O texto do aviso, com o nome nao registrado e a capacidade pedida. */
  readonly mensagem: string;
  /** A versao em que o aviso passou a existir, como o legado a declara. */
  readonly versao: string;
}

/**
 * Quem recebe o aviso de uso indevido.
 *
 * Nao devolve nada, e e de proposito: ver o **P7** em {@link AvisoDeUsoIndevido}.
 */
export type RelatorDeUsoIndevido = (aviso: AvisoDeUsoIndevido) => void;
