/**
 * Porta de envio de e-mail do modulo de integracao externa (BC-13).
 *
 * Tarefa **T001** da feature `014-integracao-externa`: a segunda das duas portas
 * que a entrega nomeia. `satisfaz: — (infraestrutura)`.
 *
 * O slot de tecnologia e `envio-de-email` (`plan.md`, secao Stack), e e o slot
 * com o achado mais incomodo do plano: **e o unico em que "identico" e
 * impossivel por AUSENCIA DE PRIMITIVA, nao por decisao**. O transporte de
 * fabrica do legado e `$phpmailer->isMail()`
 * (`wp-includes/pluggable.php:505`), que usa a funcao `mail()` do PHP, sem
 * credencial nenhuma — e essa funcao nao existe neste runtime. Por isso o
 * transporte fica **selecionavel atras desta porta**, que e a FORMA que o legado
 * tem: `wp_mail()` e uma funcao envolvida em `if ( ! function_exists( 'wp_mail' )
 * )` (`:146`), ou seja, substituivel por declaracao previa — e e exatamente o
 * que BR-MIGRAR-103 (`EXT-SUBST`) manda trocar por registro explicito.
 *
 * O que esta porta carrega, e o que nao carrega:
 *
 * - **Carrega a mensagem**, nos seis argumentos de `wp_mail()`. Ver
 *   {@link MensagemDeEmail}.
 * - **Nao carrega o canal.** CA-6.1 pede que *"o canal de envio seja declarado
 *   na configuracao da instalacao, com credencial resolvida pela precedencia
 *   declarada"* — e isso e **T013** (US-6), que depende de T007 (a precedencia
 *   I1). Declarar aqui um campo de servidor, porta ou credencial seria decidir no
 *   lugar de T013, e pior: CA-6.5 exige que *"nenhum segredo do canal de envio
 *   apareca em registro ou em tela"*, e segredo que nao atravessa a porta nao
 *   vaza por ela.
 * - **Nao carrega remetente.** No legado o remetente nasce de default
 *   (`wordpress@{dominio}`) e passa por dois pontos de filtro, `wp_mail_from` e
 *   `wp_mail_from_name` (`pluggable.php:437` e `:446`). E regra, com ponto de
 *   extensao, logo e do modulo que montar a mensagem — nao da borda. O P2 poe
 *   esses dois nomes no contrato publico, e quem portar US-6 os preserva.
 *
 * **Falha de envio e valor devolvido, nunca excecao.** Quatro fontes mandam
 * isso, e as quatro pelo mesmo motivo observavel:
 *
 * - `wp_mail()` devolve booleano, e devolve `false` nos dois caminhos de falha
 *   da arvore analisada: a excecao do remetente (`pluggable.php:457`) e a do
 *   envio (`:667`). Em ambos ele dispara a acao `wp_mail_failed` com um
 *   `WP_Error` que carrega a mensagem do transporte (`:455` e `:665`).
 * - `D3` do catalogo de regras e literal: *"falha de envio de e-mail e
 *   **estado**, nao excecao"* (BR-MIGRAR, `domain.md §2.5`), e AD-06 a cita ao
 *   recusar retry de infraestrutura.
 * - `A10` (`domain.md §2.6`): *"o marcador do aviso de recuperacao e gravado
 *   ANTES do envio, de modo que falhar em gravar significa nao avisar"* — a
 *   gravacao vem antes, logo o envio nao pode desfazer nada ao falhar.
 * - O P7 da constituicao preserva o modo de falha, inclusive o silencio: o
 *   motivo informado pelo canal atravessa a porta para que CA-6.2 tenha o que
 *   registrar (*"destinatario, assunto, instante e motivo"*), e **nao** para que
 *   alguem ramifique nele.
 *
 * O metodo e sincrono por AD-04: a fronteira de `await` fica em `adaptadores/`.
 * No legado `wp_mail()` e sincrona e bloqueante como todo o resto, e o site
 * espera o transporte.
 *
 * ⚠️ **O que esta porta NAO tem, e cada ausencia tem motivo:**
 *
 * - **Nenhum prazo e nenhuma repeticao.** A entrega de T001 termina em *"sem
 *   nenhuma politica de prazo ou de repeticao definida"*. E aqui a ausencia tem
 *   consequencia medida: AD-06 diz que `A5`, `A6` e `A7` sao implementadas como
 *   estao e que **o numero de e-mails ao administrador e criterio de aceite**, e
 *   `parity_specs.md` poe *"contagem de e-mails ao administrador divergente do
 *   oraculo"* na linha 11 das divergencias que reprovam paridade. Uma repeticao
 *   dentro da porta mudaria essa contagem.
 * - **Nenhum instante.** CA-6.2 pede o instante no registro da falha; relogio e
 *   outra porta, e BC-13 nao declara nenhuma hoje. Quem precisar dele declara,
 *   como BC-05 fez.
 * - **Nenhum registro.** Mesmo motivo da porta de cliente externo: P7, e
 *   REQ-159 e de outra feature.
 * - **Nenhum caminho de caixa postal.** 🔴 A segunda pergunta em aberto da
 *   `spec.md` e um conflito nao resolvido: REQ-153 proibe guardar credencial de
 *   integracao em texto recuperavel, e a credencial da caixa postal do legado
 *   fica em texto puro na configuracao (`wp-mail.php:18`) e trafega sem cifra
 *   (`wp-includes/class-pop3.php`). O descarte REQ-157 tiraria o caminho de
 *   escopo, e as respostas 10 e 19 o contradizem por consequencia ao mandar
 *   preservar a trava de cinco minutos daquele caminho. Esta porta e de SAIDA e
 *   nao decide nada disso: publicar conteudo por caixa postal e **leitura** de
 *   uma caixa, protocolo diferente, e porta diferente de quem portar UC-40.
 */

/**
 * Uma mensagem, nos mesmos **seis** argumentos de `wp_mail()`
 * (`wp-includes/pluggable.php:189`), para que a forma da chamada nao mude.
 *
 * **Seis, e nao cinco — conferido na arvore analisada.** A assinatura e
 * `wp_mail( $to, $subject, $message, $headers = '', $attachments = array(),
 * $embeds = array() )`, com `@since 6.9.0 The $embeds parameter was added.`
 * (`:176`). O sexto argumento nao e detalhe interno: o ponto de filtro `wp_mail`
 * recebe os seis num arranjo (`compact( 'to', 'subject', 'message', 'headers',
 * 'attachments', 'embeds' )`, `:209`), e o P2 poe os ARGUMENTOS do ponto de
 * extensao no contrato publico. Declarar cinco entregaria a extensao um
 * argumento a menos do que o legado lhe da.
 *
 * Nenhuma historia desta feature usa `incorporados`, e ele entra assim mesmo,
 * pelo precedente explicito da resposta 7 de `questions.md`: *"existir sem ser
 * chamada e parte do que se clona"* (BR-MIGRAR-111).
 *
 * > ⚠️ **Tres contextos desta arvore declaram uma porta com este nome, e elas
 * > nao concordam.** `contextos/conteudo` declara seis campos e registra, no
 * > cabecalho dele, que `contextos/identidade-e-acesso` declara **cinco** e
 * > chama o conjunto de *"os mesmos cinco argumentos de `wp_mail()`"* — contra
 * > esta arvore, falta um. `contextos/interacao-publica` tambem declara cinco.
 * > Este arquivo declara seis, pela conferencia acima. **Nao mexe nos outros
 * > tres**: nao e tarefa de T001 desta feature, e a regra de dependencia 3
 * > proibe os contextos compartilharem o tipo de qualquer forma. Fica registrado
 * > aqui porque BC-13 e o contexto que detem a politica do slot `envio-de-email`
 * > (`target_architecture.md`, BC-13), logo e daqui que a divergencia tem de ser
 * > visivel para quem revisar a paridade do slot.
 */
export interface MensagemDeEmail {
  /**
   * Destinatarios. No legado e `string|string[]`: texto com enderecos separados
   * por virgula, ou arranjo (`pluggable.php:181`). A forma de arranjo e a unica
   * declarada aqui, porque a divisao da virgula e normalizacao de entrada e nao
   * borda — e quem monta a mensagem ja sabe quantos enderecos tem.
   */
  readonly destinatarios: readonly string[];
  readonly assunto: string;
  readonly corpo: string;
  /**
   * Cabecalhos como linhas, na forma que o legado aceita (`Cc:`, `Bcc:`,
   * `Reply-To:`, `Content-Type:`).
   *
   * Sao linhas, e nao pares nome/valor, porque e disso que o legado extrai
   * destinatario adicional: os tres enderecos de copia saem da ANALISE dessas
   * linhas (`pluggable.php:465`, o bloco de `$address_headers`), e `Content-Type`
   * decide se a mensagem e texto ou HTML. Trocar por pares perderia a ordem e a
   * repeticao, que o transporte respeita.
   */
  readonly cabecalhos: readonly string[];
  /** Caminhos de anexo, na forma que o legado aceita. */
  readonly anexos: readonly string[];
  /**
   * Caminhos de arquivo a **incorporar** na mensagem (o `$embeds` do legado), que
   * e como a imagem referenciada por `cid:` chega ao corpo HTML
   * (`pluggable.php:161` a `:172`). O identificador de cada arquivo e a chave do
   * arranjo, alteravel pelo filtro `wp_mail_embed_args` (`:165`).
   */
  readonly incorporados: readonly string[];
}

/**
 * O resultado de uma tentativa de envio.
 *
 * A falha carrega o motivo que o canal informou, porque e dele que sai o
 * *"motivo"* de CA-6.2 — no legado a mensagem vem da excecao do transporte e
 * viaja dentro do `WP_Error` da acao `wp_mail_failed`
 * (`pluggable.php:455` e `:665`).
 *
 * Nao ha terceiro estado. Em particular nao ha "enfileirado": AD-06 recusa fila,
 * e `D3` ja diz que a falha e estado.
 */
export type ResultadoDeEnvio =
  | { readonly enviado: true }
  | { readonly enviado: false; readonly motivo: string };

export interface PortaDeEmail {
  /** Tenta enviar UMA vez. Nao lanca: a falha volta como `enviado: false`. */
  enviar(mensagem: MensagemDeEmail): ResultadoDeEnvio;
}
