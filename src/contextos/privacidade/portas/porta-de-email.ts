/**
 * Porta de envio de e-mail do modulo de privacidade (BC-06).
 *
 * Tarefa **T001** da feature `008-privacidade-e-dados-pessoais`.
 * `satisfaz: — (infraestrutura)`.
 *
 * O slot de tecnologia e `envio-de-email` (`plan.md`), e e o unico slot em que
 * "identico" e impossivel por **ausencia de primitiva**: o transporte de fabrica
 * do legado e `$phpmailer->isMail()` (`wp-includes/pluggable.php:505`), que usa a
 * funcao `mail()` do PHP, sem credencial nenhuma — e essa funcao nao existe neste
 * runtime. Por isso o transporte fica selecionavel atras desta porta, que e a
 * FORMA que o legado tem (funcao substituivel, uma das 42 de BR-MIGRAR-103), e
 * nao a implementacao. O `plan.md` registra que este slot carrega UC-26, e os
 * quatro envios desta feature sao:
 *
 * | mensagem | de onde sai | tarefa |
 * |---|---|---|
 * | o link de confirmacao ao titular | `wp_send_user_request`, `wp-includes/user.php:4901` | T003 |
 * | o aviso a quem administra de que a solicitacao esta pronta | `_wp_privacy_send_request_confirmation_notification`, `wp-includes/user.php:4275` | T005 |
 * | o endereco do arquivo ao titular | `wp_privacy_send_personal_data_export_email`, `wp-admin/includes/privacy-tools.php:594` | T011 |
 * | o aviso de apagamento concluido ao titular | `_wp_privacy_send_erasure_fulfillment_notification`, `wp-includes/user.php:4487` | T013 |
 *
 * **Falha de envio e valor devolvido, nunca excecao.** Tres fontes mandam isso:
 *
 * - `wp_mail()` devolve booleano (`wp-includes/pluggable.php:189`) e quem chama
 *   decide o que fazer. `wp_send_user_request` traduz o booleano falso em
 *   `WP_Error( 'privacy_email_error', ... )` (`wp-includes/user.php:5044`), e o
 *   envio do arquivo faz o mesmo (`privacy-tools.php:753`).
 * - `D3` / BR-MIGRAR-040 e literal — *"falha de envio de e-mail e **estado**,
 *   nao excecao"* — e o cabecalho de
 *   `parity_tests/12-solicitacao-de-dado-pessoal.feature` cita AD-06 pelo nome:
 *   *"falha de negocio e VALOR DE RETORNO, nao excecao"*. O cenario `@critico
 *   @regulatorio @invariante` cobra que *"nenhuma das duas lanca excecao que
 *   interrompa o fluxo"*.
 * - BR-MIGRAR-040 ainda avisa do caminho pelo qual um porte perde a regra sem
 *   perceber: *"um `retry` de infraestrutura sobrepoe a politica e muda o que o
 *   titular ve"*. Reenviar e **operacao do produto** (US-3, T007), com chave
 *   nova e estado novo; nao e politica de transporte. Esta porta nao tem
 *   repeticao, nao tem espera e nao tem fila.
 *
 * **Esta porta nao escreve registro.** O P7 permite acrescentar observabilidade
 * e proibe o fluxo depender dela. O motivo informado pelo canal atravessa a
 * porta porque CA-3.1 e CA-3.4 precisam de algo para mostrar na lista, e nao
 * para que alguem ramifique nele.
 *
 * Os metodos sao sincronos por AD-04: a fronteira de `await` fica em
 * `adaptadores/`. Os passos 5 de UC-25, 6 de UC-26 e 5 de UC-27 estao marcados
 * `async` na tabela de sequencia dos casos de uso, e isso descreve que **o site
 * nao espera o servidor de e-mail**, nao que a chamada devolva promessa: no
 * legado `wp_mail()` e sincrona e bloqueante como todo o resto.
 *
 * ---
 *
 * ## 🔴 O que esta porta NAO resolve: quem move a solicitacao para o estado de falha
 *
 * **Na arvore analisada, nada move a solicitacao para `request-failed` por causa
 * de uma falha de envio.** Uma busca por `request-failed` nos dois diretorios de
 * codigo devolve **uma** escrita: `wp-admin/includes/privacy-tools.php:226`,
 * dentro de `_wp_personal_data_cleanup_requests()` — a rotina das 24 horas, que
 * e US-4. No caminho de abertura, o retorno de `wp_send_user_request()` e
 * **ignorado** (`privacy-tools.php:169`) e a tela informa *"Confirmation request
 * initiated successfully."* de qualquer maneira; no caminho de reenvio, o erro
 * vira mensagem na tela (`privacy-tools.php:81`) e a solicitacao continua
 * pendente.
 *
 * CA-3.1 diz o contrario — *"falha no envio move a solicitacao para um estado
 * proprio de falha, e nao a deixa pendente nem a apaga"* —, e a tabela de
 * excecoes de UC-25 repete. **T001 nao resolve e nao depende disso:** esta porta
 * devolve a falha como valor, que e o que as tres fontes exigem, e quem grava o
 * que a partir dela e de **T007**. A divergencia esta registrada em
 * `../README.md`, secao *O que T001 encontrou aberto*, com o P1 e o P7 ao lado:
 * o silencio do caminho de abertura e comportamento, nao defeito de leitura.
 */

/**
 * Uma mensagem, nos mesmos cinco argumentos de `wp_mail()`
 * (`wp-includes/pluggable.php:189`), para que a forma da chamada nao mude.
 *
 * O sexto parametro (`$embeds`) existe na assinatura do legado e nenhum dos
 * quatro envios desta feature o usa; quando alguma tarefa precisar dele, ela o
 * acrescenta aqui — o P8 proibe remover superficie publicada, e esta porta e
 * deste modulo, nao a assinatura publicada de `wp_mail()`.
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
 * informou, porque CA-3.4 exige mostrar o estado de cada solicitacao com o
 * instante da ultima alteracao.
 */
export type ResultadoDeEnvio =
  | { readonly enviado: true }
  | { readonly enviado: false; readonly motivo: string };

export interface PortaDeEmail {
  /** Tenta enviar. Nao lanca: a falha volta como `enviado: false`. */
  enviar(mensagem: MensagemDeEmail): ResultadoDeEnvio;
}
