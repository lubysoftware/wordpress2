/**
 * Porta de envio de e-mail do modulo de operacao do software (BC-11).
 *
 * Quinta das cinco bordas de AD-08, e o slot `envio-de-email` do `plan.md` — *"o
 * unico slot em que 'identico' e impossivel por AUSENCIA DE PRIMITIVA"*: o
 * transporte de fabrica do legado e `$phpmailer->isMail()`
 * (`wp-includes/pluggable.php:505`), que usa a funcao `mail()` do PHP, sem
 * credencial nenhuma, e essa funcao nao existe neste runtime. Por isso o
 * transporte fica selecionavel atras desta porta, que e a FORMA que o legado tem
 * (funcao substituivel, `EXT-SUBST`), e nao a implementacao.
 *
 * **Nesta feature o e-mail nao e aviso: e o criterio de aceite.** O cabecalho de
 * `parity_tests/13-atualizacao-automatica-do-nucleo.feature` e literal: *"O
 * CRITERIO DE ACEITE DESTE ARQUIVO E O NUMERO DE E-MAILS AO ADMINISTRADOR"*.
 * Tres regras decidem esse numero e nenhuma delas e configuravel:
 *
 * - `A6` (BR-MIGRAR-050): falha transitoria da **exatamente uma** segunda
 *   chance, em uma hora, e **nao notifica** — `$send = false` quando o codigo
 *   esta na lista de transitorios e ainda nao ha registro de falha
 *   (`wp-admin/includes/class-wp-automatic-updater.php:856`). Zero e-mail na
 *   primeira falha, um na segunda.
 * - `A7` (BR-MIGRAR-051): o mesmo aviso nao e repetido. A dupla
 *   destinatario-e-versao e consultada antes do envio, em dois lugares
 *   (`:315` para a oferta de versao, `:864` para a falha).
 * - `A10` (BR-MIGRAR-054): no modo de recuperacao o marcador e gravado **antes**
 *   do envio, e falhar na gravacao **aborta o aviso** —
 *   `if ( ! update_option( self::RATE_LIMIT_OPTION, time() ) ) { return new
 *   WP_Error( 'storage_error', ... ); }` em
 *   `wp-includes/class-wp-recovery-mode-email-service.php:58` a `:59`, com o envio so em
 *   `:62`. A ordem e a regra: ela escolhe **perder** o aviso em vez de arriscar
 *   repeti-lo.
 *
 * ⚠️ **E assimetrico de proposito: ha portao que avisa e portao que cala.** UC-35
 * registra o achado — *"falha de permissao e de politica geram e-mail;
 * incompatibilidade de ambiente nao gera nada. O site que mais precisa de
 * atencao e justamente o que fica calado"*. CA-10.1 da `spec.md` pede o
 * contrario (*"todo portao que cancela a atualizacao automatica produz aviso,
 * inclusive o de incompatibilidade de ambiente"*) e CA-3.4 tambem. Isto esta
 * registrado, nao resolvido, em `../README.md`: T001 declara a borda, que serve
 * as duas leituras, e nao escolhe.
 *
 * **Falha de envio e valor devolvido, nunca excecao.** Tres fontes mandam isso:
 *
 * - `wp_mail()` devolve booleano, e `D3` e literal: *"falha de envio de e-mail e
 *   **estado**, nao excecao"* (AD-06).
 * - O P7 preserva o modo de falha **inclusive o silencio**, e aqui o silencio e
 *   medido: o aviso de atualizacao **descarta** o retorno
 *   (`class-wp-automatic-updater.php:1149`, `wp_mail( ... );` sem atribuicao),
 *   enquanto o aviso de desenvolvimento o guarda (`:1543`,
 *   `$result = wp_mail( ... )`). Sao duas chamadas a mesma funcao com dois
 *   tratamentos, e os dois sao comportamento.
 * - CA-9.5 exige que o registro de falha guarde *"tentativa, versao, codigo de
 *   erro, instante e severidade"*, e o motivo informado pelo canal atravessa a
 *   porta para que haja o que registrar — **nao** para que alguem ramifique
 *   nele.
 *
 * O metodo e sincrono por AD-04: a fronteira de `await` fica em `adaptadores/`.
 * O passo 3 de UC-36 e o 7 de UC-35 estao marcados `async` na tabela de
 * sequencia dos casos de uso, e isso descreve que **o site nao espera o servidor
 * de e-mail**, nao que a chamada devolva promessa — e em `A10` a ordem entre
 * gravar e enviar e a regra, logo ela nao pode depender de onde cai um `await`.
 */

/**
 * Uma mensagem, nos mesmos cinco argumentos de `wp_mail()`
 * (`wp-includes/pluggable.php:505`), para que a forma da chamada nao mude.
 *
 * Esta feature usa quatro dos cinco: `wp_mail( $email['to'], ... $subject,
 * $body, $email['headers'] )` (`class-wp-automatic-updater.php:1149`). O quinto,
 * {@link anexos}, esta declarado porque `wp_mail` e uma das 38 funcoes
 * substituiveis do legado (`EXT-SUBST`, BR-MIGRAR-103) e a assinatura dela e
 * contrato publico: uma porta mais estreita que a funcao tornaria este contexto
 * o unico que nao aceita a substituicao que o legado admite. E a mesma forma que
 * BC-03 declara, e as duas sao a mesma borda de AD-08.
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
 * informou, porque CA-9.5 exige ter o que registrar.
 */
export type ResultadoDeEnvio =
  | { readonly enviado: true }
  | { readonly enviado: false; readonly motivo: string };

export interface PortaDeEmail {
  /** Tenta enviar. Nao lanca: a falha volta como `enviado: false`. */
  enviar(mensagem: MensagemDeEmail): ResultadoDeEnvio;
}
