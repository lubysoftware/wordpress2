/**
 * A liberacao do corpo — o que muda na pagina quando o conteudo pede senha.
 *
 * Entrega de **T013** (US-6, CA-6.1, CA-6.2, CA-6.3 e CA-6.6).
 *
 * ---
 *
 * ## O que o portao governa, e o que ele NAO governa
 *
 * Esta e a tabela que torna CA-6.1 e CA-6.6 conferiveis, e ela e leitura de
 * `wp-includes/post-template.php`:
 *
 * | o que | pergunta ao portao? | efeito |
 * |---|---|---|
 * | o corpo, `get_the_content()` | **sim** (`:319`) | devolve o formulario em lugar do corpo, e devolve **antes** de qualquer paginacao |
 * | o resumo, `get_the_excerpt()` | **sim** (`:423`) | devolve a frase propria de `:424`, e nao o resumo gravado |
 * | a classe `post-password-required`, `post_class()` | **sim** (`:531-535`) | marca a listagem |
 * | a imagem destacada, `post_class()` | **sim** (`:541`) | a classe `has-post-thumbnail` **nao** sai |
 * | o titulo, `get_the_title()` | **nao** (`:125`) | prefixa *"Protected: %s"* olhando so se ha senha gravada |
 * | a classe `post-password-protected`, `post_class()` | **nao** (`:536-537`) | idem |
 *
 * 🔴 **As duas ultimas linhas sao a prova de CA-6.6, e sao contraintuitivas.** O
 * titulo e a segunda classe olham `! empty( $post->post_password )` **sem**
 * perguntar se o visitante informou a senha: quem acertou a senha continua vendo
 * *"Protected: titulo"*, e a listagem continua marcando o item como protegido. A
 * protecao e do **corpo**, nao da existencia — e e isso que `plan.md` fixa:
 * *"o conteudo protegido continua listado, continua no mapa do site e continua
 * aceitando pedido de comentario recusado com motivo proprio"*.
 *
 * ## O que este arquivo NAO porta de `get_the_content()`, e de quem e
 *
 * `get_the_content()` tem 80 linhas, e so as tres do portao sao desta tarefa. O
 * resto — `generate_postdata()`, a divisao do corpo pelo `<!--nextpage-->`, a
 * correcao da pagina pedida, o `<!--more-->` e o texto do link de continuacao
 * (`:277-394`) — e paginacao de corpo e apresentacao: a paginacao e **T007**
 * (US-3) e o que o tema le e **T005** (US-2). {@link corpoOuFormulario} ocupa
 * exatamente a posicao do portao, que no legado e a **primeira** decisao depois
 * do texto default do link (`:318-321`): quem acrescentar o resto acrescenta
 * **depois** dela, porque o legado devolve o formulario sem nunca olhar a pagina
 * pedida.
 *
 * ⚠️ **E o filtro `the_content` roda sobre o formulario tambem.** `the_content()`
 * chama `get_the_content()` e passa o que voltou por `apply_filters(
 * 'the_content', $content )` (`:246-258`), sem ramo nenhum para o caso do
 * formulario. Logo a expansao de macro textual de **US-8** (T017) acontece
 * tambem dentro do formulario de senha, e um porte que curto-circuitasse o
 * filtro no caminho protegido mudaria a pagina. A anotacao fica aqui porque e
 * aqui que o caminho se bifurca.
 */

import { vazioComoNoPhp } from '../consulta/semantica-de-php.js';
import {
  contextoDeSenhaResolvido,
  type ContextoDaSenhaDeConteudo,
} from './contexto-de-senha-de-conteudo.js';
import {
  montarFormularioDeSenha,
  type FiltroDaMensagemDeSenhaInvalida,
  type FormularioDeSenha,
} from './formulario-de-senha.js';
import {
  senhaDoConteudoExigida,
  type ConteudoProtegido,
  type FiltroDeSenhaExigida,
} from './senha-exigida.js';

/**
 * O conteudo, nos campos que a liberacao do corpo le.
 *
 * E {@link ConteudoProtegido} mais o corpo, o resumo e o titulo — os tres que
 * mudam de valor quando o portao fecha. Os nomes sao os de
 * `contextos/conteudo/armazenamento/conteudo.ts`, pela mesma razao de
 * `../consulta/conteudo-consultado.ts`: e a mesma linha de `posts` vista por dois
 * contextos.
 */
export interface ConteudoComCorpo extends ConteudoProtegido {
  /** `post_content`. */
  readonly corpo: string;
  /** `post_excerpt`. */
  readonly resumo?: string;
  /** `post_title`. */
  readonly titulo?: string;
}

/** A frase que substitui o resumo de um conteudo protegido (`:424`). */
export const AVISO_DE_RESUMO_PROTEGIDO =
  'There is no excerpt because this is a protected post.';

/** O formato do prefixo do titulo protegido (`:128`). */
export const FORMATO_DO_TITULO_PROTEGIDO = 'Protected: %s';

/** A classe de quem pede senha e nao a recebeu (`:535`). */
export const CLASSE_DE_SENHA_EXIGIDA = 'post-password-required';

/** A classe de quem tem senha e ja a recebeu (`:537`). */
export const CLASSE_DE_SENHA_INFORMADA = 'post-password-protected';

/** A classe que a imagem destacada acrescenta, e que o portao suprime (`:542`). */
export const CLASSE_DE_IMAGEM_DESTACADA = 'has-post-thumbnail';

/**
 * O ponto de filtro `protected_title_format` (`:141`).
 *
 * Substitui o formato do prefixo, e o docblock do legado registra o escopo:
 * *"The filter is only applied on the front end"*.
 */
export type FiltroDoTituloProtegido = (
  formato: string,
  conteudo: ConteudoProtegido,
) => string;

/** O que as operacoes desta area recebem alem do conteudo. */
export interface OpcoesDaLiberacaoDoCorpo {
  readonly contexto?: ContextoDaSenhaDeConteudo;
  /** `post_password_required`, repassado ao portao. */
  readonly filtrosDoPortao?: readonly FiltroDeSenhaExigida[];
  /** `the_password_form_incorrect_password`, repassado ao formulario. */
  readonly filtrosDaMensagem?: readonly FiltroDaMensagemDeSenhaInvalida[];
}

/** O corpo liberado, ou o formulario em lugar dele. */
export type CorpoOuFormulario =
  | { readonly liberado: true; readonly corpo: string }
  | { readonly liberado: false; readonly formulario: FormularioDeSenha };

/** Repassa ao portao e ao formulario o que cada um aceita. */
function opcoesDoPortao(
  opcoes: OpcoesDaLiberacaoDoCorpo,
): Parameters<typeof senhaDoConteudoExigida>[1] {
  return {
    ...(opcoes.contexto === undefined ? {} : { contexto: opcoes.contexto }),
    ...(opcoes.filtrosDoPortao === undefined
      ? {}
      : { filtros: opcoes.filtrosDoPortao }),
  };
}

/**
 * O portao de `get_the_content()` (`post-template.php:318-321`), e so ele.
 *
 * **Permissao exigida: nenhuma capacidade, e a declaracao e o ponto** (P4): a
 * decisao e do atestado, e `senhaDoConteudoExigida` nao pergunta capacidade — ver
 * `./senha-exigida.ts`.
 *
 * ⚠️ **O corpo devolvido e o corpo gravado, sem mais nada.** O `<!--more-->` e o
 * `<!--nextpage-->` continuam nele, porque no legado eles sao tratados depois
 * desta decisao, nas linhas que T005 e T007 trazem.
 */
export function corpoOuFormulario(
  conteudo: ConteudoComCorpo,
  opcoes: OpcoesDaLiberacaoDoCorpo = {},
): CorpoOuFormulario {
  if (senhaDoConteudoExigida(conteudo, opcoesDoPortao(opcoes))) {
    return Object.freeze({
      liberado: false,
      formulario: montarFormularioDeSenha(conteudo, {
        ...(opcoes.contexto === undefined ? {} : { contexto: opcoes.contexto }),
        ...(opcoes.filtrosDaMensagem === undefined
          ? {}
          : { filtrosDaMensagem: opcoes.filtrosDaMensagem }),
      }),
    });
  }
  return Object.freeze({ liberado: true, corpo: conteudo.corpo });
}

/**
 * O portao de `get_the_excerpt()` (`post-template.php:422-425`).
 *
 * ⚠️ Devolve a frase **antes** do filtro `get_the_excerpt` (`:436`), logo um
 * interceptador registrado ali nunca ve o resumo gravado de um conteudo
 * protegido — nem a frase, porque o legado devolve sem passar por ele.
 */
export function resumoOuAviso(
  conteudo: ConteudoComCorpo,
  opcoes: OpcoesDaLiberacaoDoCorpo = {},
): string {
  if (senhaDoConteudoExigida(conteudo, opcoesDoPortao(opcoes))) {
    return AVISO_DE_RESUMO_PROTEGIDO;
  }
  return conteudo.resumo ?? '';
}

/**
 * O prefixo do titulo (`get_the_title()`, `post-template.php:124-143`).
 *
 * 🔴 **Nao pergunta ao portao.** As duas condicoes sao *"nao estamos no painel"*
 * e *"ha senha gravada"* — quem informou a senha continua vendo o prefixo, e
 * essa e metade da prova de CA-6.6. O ramo de conteudo privado (`:144-163`) e
 * `elseif`, logo um conteudo com senha **e** privado mostra so *"Protected:"*;
 * aquele ramo e de US-4 (T009) e nao esta aqui.
 */
export function tituloComPrefixoDeProtecao(
  conteudo: ConteudoComCorpo,
  opcoes: OpcoesDaLiberacaoDoCorpo & {
    readonly filtrosDoFormato?: readonly FiltroDoTituloProtegido[];
  } = {},
): string {
  const contexto = contextoDeSenhaResolvido(opcoes.contexto);
  const titulo = conteudo.titulo ?? '';
  if (contexto.noPainel || vazioComoNoPhp(conteudo.senha)) {
    return titulo;
  }
  let formato = FORMATO_DO_TITULO_PROTEGIDO;
  for (const filtro of opcoes.filtrosDoFormato ?? []) {
    formato = filtro(formato, conteudo);
  }
  // `sprintf( $formato, $titulo )` (`:143`) — um `%s` so.
  return formato.replace('%s', titulo);
}

/** O que `post_class()` acrescenta por causa da senha, e o que ele suprime. */
export interface ClassesDaSenhaNoConteudo {
  /** As classes acrescentadas, na ordem de `post_class()`. */
  readonly classes: readonly string[];
  /**
   * Se a classe da imagem destacada pode sair (`:541`).
   *
   * Falso quando o portao fechou: o legado exige `! $post_password_required` na
   * mesma linha em que pergunta pelo tema e pela imagem.
   */
  readonly imagemDestacadaPermitida: boolean;
}

/**
 * O que a senha decide em `post_class()` (`post-template.php:531-542`).
 *
 * As duas classes sao **exclusivas** entre si, e a segunda nao pergunta ao
 * portao: `if ( $exigida ) ... elseif ( ! empty( $post->post_password ) )`.
 */
export function classesDaSenhaNoConteudo(
  conteudo: ConteudoProtegido,
  opcoes: OpcoesDaLiberacaoDoCorpo = {},
): ClassesDaSenhaNoConteudo {
  const exigida = senhaDoConteudoExigida(conteudo, opcoesDoPortao(opcoes));
  if (exigida) {
    return Object.freeze({
      classes: Object.freeze([CLASSE_DE_SENHA_EXIGIDA]),
      imagemDestacadaPermitida: false,
    });
  }
  if (!vazioComoNoPhp(conteudo.senha)) {
    return Object.freeze({
      classes: Object.freeze([CLASSE_DE_SENHA_INFORMADA]),
      imagemDestacadaPermitida: true,
    });
  }
  return Object.freeze({
    classes: Object.freeze([]),
    imagemDestacadaPermitida: true,
  });
}
