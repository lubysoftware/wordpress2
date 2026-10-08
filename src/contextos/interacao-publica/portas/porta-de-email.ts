/**
 * Porta de envio de e-mail do modulo de interacao publica (BC-03).
 *
 * O slot de tecnologia e `envio-de-email`
 * (`.specify/specs/007-interacao-publica-e-moderacao/plan.md`), e e o unico slot
 * em que "identico" e impossivel por AUSENCIA DE PRIMITIVA: o transporte de
 * fabrica do legado e `$phpmailer->isMail()`, que usa a funcao `mail()` do PHP
 * (`wp-includes/pluggable.php:505`), sem credencial nenhuma — e essa funcao nao
 * existe neste runtime. Por isso o transporte fica selecionavel atras desta
 * porta, que e a FORMA que o legado tem (funcao substituivel), e nao a
 * implementacao.
 *
 * **Falha de envio e valor devolvido, nunca excecao.** Tres fontes mandam isso:
 *
 * - `wp_mail()` devolve booleano; quem chama decide o que fazer, e `D3` do
 *   catalogo de regras e literal — *"falha de envio de e-mail e **estado**, nao
 *   excecao"* (AD-06).
 * - CA-9.4 de `spec.md` (US-9) exige que *"falha no envio do aviso nao desfaz a
 *   gravacao do comentario, e fica registrada"* — logo o comentario ja esta
 *   gravado quando o envio falha, e uma excecao aqui desfaria a ordem dos passos
 *   6 e 7 de UC-14.
 * - O P7 da constituicao preserva o modo de falha, inclusive o silencio:
 *   registro acrescentado e so escrita, e nenhuma ramificacao do sistema pode
 *   passar a depender dele. O motivo informado pelo canal atravessa a porta para
 *   que CA-9.4 tenha o que registrar, e nao para que alguem ramifique nele.
 *
 * Os metodos sao sincronos por AD-04: a fronteira de `await` fica em
 * `adaptadores/`. Os passos 7 de UC-14 e 6 de UC-16 estao marcados `async` na
 * tabela de sequencia dos casos de uso, e isso descreve que **o site nao espera
 * o servidor de e-mail**, nao que a chamada devolva promessa: no legado
 * `wp_mail()` e sincrona e bloqueante como todo o resto.
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
 * informou, porque CA-9.4 exige registra-lo.
 */
export type ResultadoDeEnvio =
  | { readonly enviado: true }
  | { readonly enviado: false; readonly motivo: string };

export interface PortaDeEmail {
  /** Tenta enviar. Nao lanca: a falha volta como `enviado: false`. */
  enviar(mensagem: MensagemDeEmail): ResultadoDeEnvio;
}
