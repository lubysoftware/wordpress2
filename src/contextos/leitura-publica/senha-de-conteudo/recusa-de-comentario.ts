/**
 * A recusa do comentario em conteudo protegido — o ramo de senha de
 * `wp_handle_comment_submission()`
 * (`wp-includes/comment.php:4053` e `:4064`).
 *
 * Entrega de **T013** (US-6, CA-6.5), e e a unica parte desta tarefa cujo
 * **chamador** mora em outro contexto.
 *
 * ---
 *
 * ## Por que a decisao esta aqui e a cadeia esta em BC-07
 *
 * `wp_handle_comment_submission()` tem **13** recusas em sequencia
 * (`comment.php:3981` a `:4153`, contagem mecanica dos `return new WP_Error`), e
 * doze delas sao de **BC-07** (interacao publica e moderacao, feature `007`):
 * resposta a comentario nao aprovado, conteudo inexistente, conteudo privado sem
 * capacidade, comentario fechado, conteudo na lixeira, conteudo em estado nao
 * publico, visitante nao autenticado, campo obrigatorio ausente, e-mail
 * invalido, texto vazio e falha de gravacao. A **oitava** e esta, e a regra que
 * ela consulta e o portao de senha desta feature.
 *
 * A regra de dependencia 3 de `target_architecture.md` proibe
 * `contextos/interacao-publica/` importar `contextos/leitura-publica/` *"sempre,
 * sem excecao"*. Logo: a **decisao** fica aqui, junto do portao que ela consulta,
 * e chega la por ligacao tardia — como `ClassificacaoNaPublicacao` chega em
 * `contextos/conteudo/publicacao/`. O que BC-07 acrescenta e a **posicao** dela
 * na cadeia, que e contrato (ver a tabela abaixo).
 *
 * ## A posicao na cadeia, que BC-07 nao pode trocar
 *
 * | # | recusa | codigo | legado |
 * |---|---|---|---|
 * | 1 | resposta a comentario nao aprovado | `comment_reply_to_unapproved_comment` | `:3981` |
 * | 2 | conteudo inexistente | `comment_id_not_found` | `:3998` |
 * | 3 | conteudo privado sem a capacidade de ler | `comment_id_not_found` | `:4006` |
 * | 4 | comentario fechado | `comment_closed` | `:4022` |
 * | 5 | conteudo na lixeira | `comment_on_trash` | `:4035` |
 * | 6 e 7 | conteudo em estado nao publico | `comment_on_draft` | `:4049` e `:4051` |
 * | **8** | **conteudo protegido por senha** | `comment_on_password_protected` | **`:4064`** |
 * | 9 a 13 | identidade, campo e gravacao | `not_logged_in` … `comment_save_error` | `:4101`-`:4153` |
 *
 * ⚠️ **A ordem importa, e o caso que a revela e o rascunho protegido:** um
 * conteudo em rascunho **com** senha e recusado por `comment_on_draft`, e nao por
 * `comment_on_password_protected`, porque o ramo de estado vem antes. Inverter a
 * ordem troca o motivo que o visitante recebe.
 *
 * 🔴 **E esta recusa nao tem mensagem nem codigo HTTP, e as vizinhas tem.**
 * `:4064` e `new WP_Error( 'comment_on_password_protected' )`, com **um**
 * argumento: `comment_closed` carrega *"Sorry, comments are closed for this
 * item."* e 403, `comment_on_draft` carrega mensagem e 403 quando o visitante
 * pode ler o conteudo. Aqui nao ha nem uma nem outro — e e por isso que
 * {@link RecusaDeComentarioProtegido} tem um campo so. Preencher a mensagem
 * "para ficar consistente" mudaria o que a borda HTTP devolve.
 */

import {
  senhaDoConteudoExigida,
  type ConteudoProtegido,
  type OpcoesDoPortaoDeSenha,
} from './senha-exigida.js';

/**
 * O codigo da recusa (`comment.php:4064`), e tambem o nome da acao que dispara
 * antes dela (`:4062`).
 *
 * Os dois sao o mesmo texto no legado, e os dois sao contrato publico: o codigo
 * e lido pela borda que monta a resposta, e a acao e ponto de extensao (P2).
 */
export const MOTIVO_DE_COMENTARIO_EM_CONTEUDO_PROTEGIDO =
  'comment_on_password_protected';

/**
 * A acao `comment_on_password_protected` (`comment.php:4062`).
 *
 * Recebe o identificador do conteudo e nao devolve valor — nao da para
 * curto-circuitar a recusa por ela.
 */
export type ObservadorDeComentarioRecusado = (idDoConteudo: number) => void;

/** A recusa, nos campos que o legado produz: **so** o codigo. */
export interface RecusaDeComentarioProtegido {
  readonly codigo: typeof MOTIVO_DE_COMENTARIO_EM_CONTEUDO_PROTEGIDO;
}

/** O que a recusa recebe alem do conteudo. */
export interface OpcoesDaRecusaDeComentario extends OpcoesDoPortaoDeSenha {
  /** `comment_on_password_protected`, antes da recusa (`:4062`). */
  readonly aoRecusar?: readonly ObservadorDeComentarioRecusado[];
}

/**
 * O ramo de senha de `wp_handle_comment_submission()`.
 *
 * **Permissao exigida: nenhuma capacidade, e a declaracao e o ponto** (P4). As
 * recusas vizinhas perguntam `read_post` (`:4005` e `:4049`); esta nao pergunta
 * nada — ela consulta o atestado, pelo portao.
 *
 * Devolve a recusa quando o portao exige senha, e **ausencia** quando nao exige:
 * no legado a ausencia nao e um valor, e a continuacao da cadeia (o `else` de
 * `:4066`, que dispara `pre_comment_on_post`). Quem chama segue para a etapa
 * seguinte **so** com a ausencia em maos.
 */
export function recusaDeComentarioEmConteudoProtegido(
  conteudo: ConteudoProtegido,
  opcoes: OpcoesDaRecusaDeComentario = {},
): RecusaDeComentarioProtegido | undefined {
  const doPortao: OpcoesDoPortaoDeSenha = {
    ...(opcoes.contexto === undefined ? {} : { contexto: opcoes.contexto }),
    ...(opcoes.filtros === undefined ? {} : { filtros: opcoes.filtros }),
  };

  if (!senhaDoConteudoExigida(conteudo, doPortao)) {
    return undefined;
  }

  // `:4062` — a acao dispara **antes** da recusa, e nao a impede.
  for (const observador of opcoes.aoRecusar ?? []) {
    observador(conteudo.id);
  }

  return Object.freeze({ codigo: MOTIVO_DE_COMENTARIO_EM_CONTEUDO_PROTEGIDO });
}
