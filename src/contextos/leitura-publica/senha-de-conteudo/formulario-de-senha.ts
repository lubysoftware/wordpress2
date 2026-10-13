/**
 * O formulario de senha de conteudo — `get_the_password_form()`
 * (`wp-includes/post-template.php:1779-1848`), que e a tela `SCR-011` de
 * `target_screens.md` e o que substitui o corpo quando o atestado falta.
 *
 * Entrega de **T013** (US-6, CA-6.1 e CA-6.3).
 *
 * ---
 *
 * ## Por que isto e DADO, e nao uma string de HTML
 *
 * Esta arvore nao monta marcacao, e a regra e anterior a esta tarefa:
 * `contextos/identidade-e-acesso/administracao-de-contas/mensagens-da-administracao.ts`
 * declara as mensagens e diz, na linha, que *"a montagem da marcacao e da borda,
 * que nao existe nesta arvore"*; `contextos/conteudo/revisao/fila-de-revisao.ts`
 * faz o mesmo com o `<p>` da recusa. Montar HTML aqui tambem arrastaria
 * `esc_url()`, `esc_attr()` e `esc_attr_x()` para dentro do contexto, e as tres
 * sao de `plataforma/formatacao` (feature 015) — e `esc_attr()` tem um detalhe
 * que nao se aproxima: `_wp_specialchars()` roda com `$double_encode = false`,
 * logo entidade que ja existia no texto e **preservada**, e um escape ingenuo a
 * codificaria duas vezes.
 *
 * O que esta declarado aqui e exatamente o contrato que a paridade protege.
 * `PTS-004` (`parity_tests/screens/04-formulario-de-senha-de-conteudo.feature`)
 * compara `dom-and-field-names`, nao pixel, e cobra tres coisas: os **nomes** dos
 * campos (`redirect_to`, `post_password`, `Submit`), o tipo de cada um, e o
 * destino e o metodo do formulario. As tres sao campos desta interface.
 *
 * ## 🔴 Duas divergencias entre os documentos do pacote e o oraculo, registradas e nao escolhidas
 *
 * 1. **O atributo de obrigatoriedade.** O comentario de `PTS-004` afirma que
 *    *"Nenhum deles tem atributo de obrigatoriedade no HTML do legado"*. O
 *    oraculo tem: `post-template.php:1828` emite `required` no campo
 *    `post_password`, e a propria tabela § 3 de `target_screens.md` registra
 *    *"Obrigatorio no HTML: sim"* para ele, com *"1 de 3 campos com `required`"*
 *    em § 6. Ou seja o comentario do `.feature` contradiz a tabela do documento
 *    de onde ele foi gerado. O passo executavel do cenario **nao** contradiz
 *    nada — ele diz *"nenhum campo recebeu atributo de obrigatoriedade que o
 *    legado nao tem"* —, logo este porte emite o `required` do legado e continua
 *    satisfazendo o cenario. Fica registrado porque a frase do comentario,
 *    lida sozinha, mandaria tirar o atributo.
 * 2. **O destino do formulario.** § 2 de `target_screens.md` registra o `action`
 *    como *"(vazio: posta na propria URL)"*, e o oraculo tem
 *    `site_url( 'wp-login.php?action=postpass', 'login_post' )` em `:1826` — o
 *    analisador estatico nao resolveu a expressao. O campo `spec.route` do mesmo
 *    documento, duas linhas acima, diz o certo: *"o POST vai para
 *    /wp-login.php?action=postpass"*. Este porte segue o oraculo e a `spec.route`
 *    (P1: o comportamento observavel do legado e a especificacao).
 *
 * Nenhuma das duas e decisao de agente: as duas sao leitura do oraculo contra
 * documento gerado, com a ancora de cada afirmacao, e as duas estao no README do
 * modulo para quem revisar.
 */

import { vazioComoNoPhp } from '../consulta/semantica-de-php.js';
import {
  contextoDeSenhaResolvido,
  type ContextoDaSenhaDeConteudo,
} from './contexto-de-senha-de-conteudo.js';
import type { ConteudoProtegido } from './senha-exigida.js';

/**
 * As tres mensagens literais da tela, **em ingles**, que e a chave do catalogo
 * (`EC-05` de `target_screens.md`; as tres com arquivo e linha em § 4).
 *
 * Traduzir aqui trocaria a chave, e `diff` de string tem de ser zero.
 */
export const MENSAGEM_DE_SENHA_INVALIDA = 'Invalid password.';

/** `post-template.php:1827`. */
export const AVISO_DE_CONTEUDO_PROTEGIDO =
  'This content is password-protected. To view it, please enter the password below.';

/** `post-template.php:1828`, o rotulo do campo. */
export const ROTULO_DA_SENHA = 'Password:';

/**
 * O texto do botao (`post-template.php:1828`).
 *
 * ⚠️ Passa por `esc_attr_x( 'Enter', 'post password form' )` e nao por `__()`, e
 * e por isso que § 4 de `target_screens.md` conta **3** mensagens e nao 4: a
 * tabela lista so as de `__()`. A chave do catalogo desta tem **contexto**, e o
 * contexto faz parte da chave.
 */
export const TEXTO_DO_BOTAO = 'Enter';

/** O contexto do catalogo para {@link TEXTO_DO_BOTAO}. */
export const CONTEXTO_DO_TEXTO_DO_BOTAO = 'post password form';

/** O prefixo do `id` do campo de senha (`post-template.php:1781`). */
export const PREFIXO_DO_ID_DO_CAMPO = 'pwbox-';

/** O prefixo do `id` do paragrafo de erro (`post-template.php:1800`). */
export const PREFIXO_DO_ID_DO_ERRO = 'error-';

/** O nome do campo oculto de retorno (`post-template.php:1807`). */
export const CAMPO_DE_RETORNO = 'redirect_to';

/** O nome do campo da senha (`post-template.php:1828`). */
export const CAMPO_DA_SENHA = 'post_password';

/** O nome do botao (`post-template.php:1828`). */
export const CAMPO_DE_ENVIO = 'Submit';

/** A classe do formulario (`post-template.php:1826`). */
export const CLASSE_DO_FORMULARIO = 'post-password-form';

/** A classe que o formulario ganha quando a senha veio errada (`:1803`). */
export const CLASSE_DE_ERRO_DO_FORMULARIO = 'password-form-error';

/** A classe do bloco de aviso de senha invalida (`:1800`). */
export const CLASSE_DO_AVISO_DE_ERRO = 'post-password-form-invalid-password';

/** O `role` do bloco de aviso de senha invalida (`:1800`). */
export const PAPEL_DO_AVISO_DE_ERRO = 'alert';

/** O caminho a que o formulario posta (`post-template.php:1826`). */
export const CAMINHO_DO_ENVIO = 'wp-login.php?action=postpass';

/** O esquema com que `site_url()` e chamada para esse caminho (`:1826`). */
export const ESQUEMA_DO_ENVIO = 'login_post';

/** O metodo do formulario (`post-template.php:1826`). */
export const METODO_DO_ENVIO = 'post';

/** O tamanho declarado do campo de senha (`post-template.php:1828`). */
export const TAMANHO_DO_CAMPO_DE_SENHA = 20;

/** A classe do botao no tema de blocos (`post-template.php:1816`). */
export const CLASSE_DO_BOTAO_DE_BLOCO = 'wp-block-button__link';

/**
 * A classe de elemento que `wp_theme_get_element_class_name( 'button' )`
 * devolve: `wp-element-button`
 * (`class-wp-theme-json.php:887`, mapa `__EXPERIMENTAL_ELEMENT_CLASS_NAMES`).
 */
export const CLASSE_DE_ELEMENTO_DO_BOTAO = 'wp-element-button';

/** O envoltorio do botao no tema de blocos (`post-template.php:1817-1818`). */
export const CLASSE_DO_ENVOLTORIO_DO_BOTAO = 'wp-block-button';

/** O apelido do estilo que o tema de blocos enfileira (`post-template.php:1820-1821`). */
export const ESTILO_DO_BOTAO_DE_BLOCO = 'wp-block-button';

/**
 * O ponto de filtro `the_password_form_incorrect_password`
 * (`post-template.php:1799`).
 *
 * Substitui a mensagem de senha invalida, e **so dispara quando o conteudo esta
 * protegido e a senha veio errada** — o docblock do legado e explicito: *"The
 * filter is only applied if the post is password-protected"*.
 */
export type FiltroDaMensagemDeSenhaInvalida = (
  mensagem: string,
  conteudo: ConteudoProtegido,
) => string;

/**
 * O ponto de filtro `the_password_form` (`post-template.php:1847`).
 *
 * ⚠️ **Nao dispara neste arquivo, e isso e lacuna declarada e nao omissao.** No
 * legado ele recebe o **HTML montado** — `( $output, $post, $invalid_password )`,
 * nessa ordem — e e o ultimo passo de `get_the_password_form()`. Como a montagem
 * da marcacao e da borda (ver o cabecalho), e la que ele dispara, e esta
 * declaracao existe para que o nome, os argumentos e a posicao estejam no
 * contrato do ponto, como o P2 exige. Quem montar a borda dispara **depois** de
 * montar e **antes** de devolver; a mensagem filtrada que o terceiro argumento
 * carrega e {@link FormularioDeSenha.mensagemDeSenhaInvalida}.
 */
export type FiltroDoFormularioDeSenha = (
  html: string,
  conteudo: ConteudoProtegido,
  mensagemDeSenhaInvalida: string,
) => string;

/** Um campo do formulario, nos tres atributos que `PTS-004` compara. */
export interface CampoDoFormularioDeSenha {
  readonly nome: string;
  readonly tipo: string;
  /** `required` no HTML. So o campo da senha o tem (`post-template.php:1828`). */
  readonly obrigatorio: boolean;
}

/** O formulario de senha, como a borda precisa dele para montar `SCR-011`. */
export interface FormularioDeSenha {
  /** O destino do envio, ja resolvido por `site_url()` (`:1826`). */
  readonly destino: string;
  /** `post` (`:1826`). */
  readonly metodo: string;
  /**
   * As classes do formulario: a fixa, mais a de erro quando a senha veio errada.
   *
   * No legado as duas se concatenam numa string so, e a de erro entra com espaco
   * a esquerda (`:1803`, `' password-form-error'`).
   */
  readonly classes: readonly string[];
  /** O `id` do campo de senha, e o `for` do rotulo (`:1781`). */
  readonly idDoCampo: string;
  /**
   * O valor do campo `redirect_to`: o endereco do proprio conteudo (`:1808`).
   *
   * **Ausente** quando o registro nao tem identificador — `! empty( $post->ID )`
   * em `:1806` —, e ai o campo nao e emitido.
   */
  readonly retorno?: string;
  /** Os campos, na ordem em que o legado os emite. */
  readonly campos: readonly CampoDoFormularioDeSenha[];
  /** O aviso de conteudo protegido (`:1827`). */
  readonly aviso: string;
  /** O rotulo do campo (`:1828`). */
  readonly rotulo: string;
  /** O texto do botao, e o contexto do catalogo dele (`:1828`). */
  readonly textoDoBotao: string;
  readonly contextoDoTextoDoBotao: string;
  /**
   * A mensagem de senha invalida, **ja filtrada**, ou texto vazio quando a senha
   * nao veio errada.
   *
   * O legado mantem a variavel vazia nesse caso (`:1782`), e e esse vazio que
   * chega ao terceiro argumento de `the_password_form`.
   */
  readonly mensagemDeSenhaInvalida: string;
  /**
   * O `id` do paragrafo de erro e o `aria-describedby` do campo, quando ha erro
   * (`:1800-1802`). Ausente quando nao ha.
   */
  readonly idDoErro?: string;
  /** A classe do bloco de aviso (`:1800`), presente so quando ha erro. */
  readonly classeDoAvisoDeErro?: string;
  /** O `role` do bloco de aviso (`:1800`). */
  readonly papelDoAvisoDeErro?: string;
  /**
   * As classes do botao e o envoltorio dele, presentes **so** no tema de blocos
   * (`:1815-1818`).
   */
  readonly classesDoBotao: readonly string[];
  readonly envoltorioDoBotao?: string;
}

/** O que {@link montarFormularioDeSenha} recebe. */
export interface OpcoesDoFormularioDeSenha {
  readonly contexto?: ContextoDaSenhaDeConteudo;
  /** `the_password_form_incorrect_password`, na ordem dada. */
  readonly filtrosDaMensagem?: readonly FiltroDaMensagemDeSenhaInvalida[];
}

/**
 * `get_the_password_form( $post )`.
 *
 * **Permissao exigida: nenhuma capacidade, e a declaracao e o ponto** (P4) —
 * `target_screens.md` registra, para `SCR-011`, *"nenhuma checagem
 * `current_user_can()` neste arquivo"*, e `PTS-004` tem cenario proprio para
 * isso: *"nenhuma das duas exige capacidade que o legado nao exige"*.
 *
 * ⚠️ **A deteccao de senha errada e indireta, e e o unico sinal que o visitante
 * recebe** (`:1789`): o legado nao sabe que a senha falhou, ele **deduz** —
 * *"If the referrer is the same as the current request, the user has entered an
 * invalid password"*. As tres condicoes sao conjuntas: o registro tem
 * identificador, o remetente da requisicao e igual ao endereco do conteudo, e
 * **existe** cookie de atestado. Note que a terceira olha so a presenca do
 * cookie, nunca o conteudo dele; e por isso que um visitante que acertou a senha
 * de **outro** conteudo, e chega neste por um link do proprio conteudo, ve
 * *"Invalid password."* sem ter digitado nada.
 *
 * ⚠️ **O efeito colateral do tema de blocos acontece aqui, e nao na montagem**
 * (`:1819-1822`): se o estilo `wp-block-button` esta registrado, o legado o
 * enfileira de dentro desta funcao. Enfileirar muda o `<head>` da pagina, logo e
 * observavel, e a posicao e a do legado — antes de o formulario existir.
 */
export function montarFormularioDeSenha(
  conteudo: ConteudoProtegido,
  opcoes: OpcoesDoFormularioDeSenha = {},
): FormularioDeSenha {
  const contexto = contextoDeSenhaResolvido(opcoes.contexto);
  const temIdentificador = !vazioComoNoPhp(conteudo.id);

  // `:1781` — sem identificador, o `id` do campo e sorteado.
  const idDoCampo =
    PREFIXO_DO_ID_DO_CAMPO +
    String(temIdentificador ? conteudo.id : contexto.numeroAleatorio());

  // `:1789` — as tres condicoes conjuntas da deteccao de senha errada, na ordem
  // do legado. ⚠️ O `&&` do interpretador curto-circuita: sem identificador, o
  // endereco do conteudo **nao** e pedido; com identificador, ele e pedido
  // mesmo quando nao ha cookie, porque a condicao do cookie e a ultima.
  const senhaVeioErrada =
    temIdentificador &&
    contexto.remetenteDaRequisicao === contexto.enderecoDoConteudo(conteudo.id) &&
    contexto.atestado !== undefined;

  // `:1799` — a mensagem, e o filtro que a substitui.
  let mensagem = '';
  if (senhaVeioErrada) {
    mensagem = MENSAGEM_DE_SENHA_INVALIDA;
    for (const filtro of opcoes.filtrosDaMensagem ?? []) {
      mensagem = filtro(mensagem, conteudo);
    }
  }

  // `:1819-1822` — o efeito colateral do tema de blocos, na posicao do legado.
  const classesDoBotao: string[] = [];
  let envoltorio: string | undefined;
  if (contexto.temaDeBlocos) {
    classesDoBotao.push(CLASSE_DO_BOTAO_DE_BLOCO, CLASSE_DE_ELEMENTO_DO_BOTAO);
    envoltorio = CLASSE_DO_ENVOLTORIO_DO_BOTAO;
    if (contexto.estiloRegistrado(ESTILO_DO_BOTAO_DE_BLOCO)) {
      contexto.enfileirarEstilo(ESTILO_DO_BOTAO_DE_BLOCO);
    }
  }

  const campos: CampoDoFormularioDeSenha[] = [];
  if (temIdentificador) {
    // `:1806-1810` — o campo oculto so existe quando ha identificador.
    campos.push({ nome: CAMPO_DE_RETORNO, tipo: 'hidden', obrigatorio: false });
  }
  campos.push(
    // `:1828` — e o `required` e do legado; ver a divergencia 1 do cabecalho.
    { nome: CAMPO_DA_SENHA, tipo: 'password', obrigatorio: true },
    { nome: CAMPO_DE_ENVIO, tipo: 'submit', obrigatorio: false },
  );

  return Object.freeze({
    destino: contexto.enderecoDoSite(CAMINHO_DO_ENVIO, ESQUEMA_DO_ENVIO),
    metodo: METODO_DO_ENVIO,
    classes: Object.freeze(
      senhaVeioErrada
        ? [CLASSE_DO_FORMULARIO, CLASSE_DE_ERRO_DO_FORMULARIO]
        : [CLASSE_DO_FORMULARIO],
    ),
    idDoCampo,
    // `:1806-1810` — o legado pede o endereco **de novo** aqui, e nao reusa o da
    // deteccao: sao duas chamadas de `get_permalink()`, e ela dispara ponto de
    // extensao (`post_link` e as irmas). Reusar o valor trocaria duas
    // execucoes do interceptador por uma, que e efeito observavel (P2).
    ...(temIdentificador
      ? { retorno: contexto.enderecoDoConteudo(conteudo.id) }
      : {}),
    campos: Object.freeze(campos),
    aviso: AVISO_DE_CONTEUDO_PROTEGIDO,
    rotulo: ROTULO_DA_SENHA,
    textoDoBotao: TEXTO_DO_BOTAO,
    contextoDoTextoDoBotao: CONTEXTO_DO_TEXTO_DO_BOTAO,
    mensagemDeSenhaInvalida: mensagem,
    ...(senhaVeioErrada
      ? {
          idDoErro: PREFIXO_DO_ID_DO_ERRO + idDoCampo,
          classeDoAvisoDeErro: CLASSE_DO_AVISO_DE_ERRO,
          papelDoAvisoDeErro: PAPEL_DO_AVISO_DE_ERRO,
        }
      : {}),
    classesDoBotao: Object.freeze(classesDoBotao),
    ...(envoltorio === undefined ? {} : { envoltorioDoBotao: envoltorio }),
  });
}
