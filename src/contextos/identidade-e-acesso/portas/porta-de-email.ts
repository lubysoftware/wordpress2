/**
 * Porta de envio de e-mail do modulo de identidade e acesso (BC-05).
 *
 * O slot de tecnologia e `envio-de-email`
 * (`.specify/specs/001-identidade-e-acesso/plan.md`), e e o unico slot em que
 * "identico" e impossivel por ausencia de primitiva: o transporte de fabrica do
 * legado e a funcao `mail()` do PHP, que nao existe neste runtime. Por isso o
 * transporte fica selecionavel atras desta porta, que e a forma que o legado
 * tem (funcao substituivel), e nao a implementacao.
 *
 * **Falha de envio e valor devolvido, nunca excecao.** Tres fontes mandam isso,
 * e as tres pelo mesmo motivo observavel:
 *
 * - `wp_mail()` devolve booleano; quem chama decide o que fazer.
 * - CA-5.1 e CA-5.2 de `spec.md` (US-5) exigem que a falha chegue ao
 *   requisitante como aviso distinto do sucesso, e que fique registrada com
 *   instante, destinatario e **motivo informado pelo canal de envio** — logo o
 *   motivo tem de atravessar a porta.
 * - O P7 da constituicao preserva o modo de falha, inclusive o silencio:
 *   registro acrescentado e so escrita, e nenhuma ramificacao do sistema pode
 *   passar a depender dele.
 *
 * Uma porta que lancasse excecao transformaria o estado em fluxo de erro, e os
 * contratos do plano chamam esta falha de "estado reportavel e nao excecao".
 *
 * Os metodos sao sincronos por AD-04 de `target_architecture.md`: a fronteira de
 * `await` fica em `adaptadores/`.
 */

/**
 * Uma mensagem, nos mesmos cinco argumentos de `wp_mail()`
 * (`wp-includes/pluggable.php:505`), para que a forma da chamada nao mude.
 */
export interface MensagemDeEmail {
  readonly destinatarios: readonly string[];
  readonly assunto: string;
  readonly corpo: string;
  /** Cabecalhos como linhas, na forma que o legado aceita. */
  readonly cabecalhos: readonly string[];
  /** Caminhos de anexo, na forma que o legado aceita. */
  readonly anexos: readonly string[];
}

/**
 * O resultado de uma tentativa de envio. A falha carrega o motivo que o canal
 * informou, porque CA-5.2 exige registra-lo.
 */
export type ResultadoDeEnvio =
  | { readonly enviado: true }
  | { readonly enviado: false; readonly motivo: string };

export interface PortaDeEmail {
  /** Tenta enviar. Nao lanca: a falha volta como `enviado: false`. */
  enviar(mensagem: MensagemDeEmail): ResultadoDeEnvio;
}
