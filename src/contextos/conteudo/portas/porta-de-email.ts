/**
 * Porta de envio de e-mail do modulo de conteudo (BC-01).
 *
 * O slot de tecnologia e `envio-de-email`
 * (`.specify/specs/002-autoria-e-publicacao/plan.md`), e e o unico slot em que
 * "identico" e impossivel por ausencia de primitiva: o transporte de fabrica do
 * legado e `$phpmailer->isMail()`, que usa a funcao `mail()` do PHP
 * (`wp-includes/pluggable.php:505`), e ela nao existe neste runtime. Por isso o
 * transporte fica selecionavel atras desta porta, que e a forma que o legado tem
 * (funcao substituivel), e nao a implementacao.
 *
 * ┌─ PARADA ANTES DE USAR ESTA PORTA NESTA FEATURE ──────────────────────────┐
 * │                                                                          │
 * │ **A spec e a analise do legado discordam sobre o unico consumidor que    │
 * │ esta porta tem aqui, e T001 NAO resolve a divergencia.**                 │
 * │                                                                          │
 * │ US-9 de `spec.md` (REQ-027) pede: *"Notificar o autor quando o conteudo  │
 * │ e devolvido ou publicado por outra pessoa"*, com CA-9.1 (devolver envia  │
 * │ aviso), CA-9.2 (publicar envia aviso), CA-9.3 (o aviso diz quem agiu) e  │
 * │ CA-9.4 (falha no envio nao impede a transicao, e fica registrada).       │
 * │                                                                          │
 * │ `.specify/use-cases/UC-07-revisar-e-publicar-conteudo-de-outro-autor.md` │
 * │ — que e o caso de uso que a tabela de rastreabilidade liga a US-9 — diz o │
 * │ contrario, no fluxo alternativo *Devolver ao autor*, palavra por palavra: │
 * │ *"Nenhuma notificacao e enviada ao autor: o sistema nao avisa"*. A        │
 * │ pos-condicao do mesmo caso de uso repete: *"nenhum registro de quem       │
 * │ aprovou foi gravado"*. E a arvore analisada confirma: as duas unicas      │
 * │ funcoes de notificacao do nucleo sao de COMENTARIO                        │
 * │ (`wp_notify_postauthor` em `wp-includes/pluggable.php:1749` e            │
 * │ `wp_notify_moderator` em `:2009`), nenhuma delas dispara em transicao de  │
 * │ estado editorial, e `wp-admin/post.php:236` — a ancora que `spec.md` da   │
 * │ para US-9 — e a chamada de `edit_post()`, que nao envia e-mail nenhum.    │
 * │                                                                          │
 * │ Ou seja: US-9 pede comportamento que o sistema analisado nao tem. O P1 da │
 * │ constituicao diz que o comportamento observavel do legado E a             │
 * │ especificacao e que divergir *"exige uma decisao humana registrada,       │
 * │ citada no codigo que divergiu"*, e `pending_decisions.md` nao tem decisao │
 * │ sobre isto. **Quem pegar T019 para antes de implementar e escreve, em vez │
 * │ de escolher um dos dois lados.** Esta porta existe porque T001 de         │
 * │ `tasks.md` a pede pelo nome; ela nao autoriza a notificacao.              │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * **Falha de envio e valor devolvido, nunca excecao.** Tres fontes mandam isso,
 * e as tres pelo mesmo motivo observavel:
 *
 * - `wp_mail()` devolve booleano; quem chama decide o que fazer.
 * - A tabela *Contratos* de `plan.md` fecha com *"erro e devolvido como valor,
 *   nao como excecao: e assim no legado e e o que permite a um ponto de extensao
 *   inspecionar a falha"*.
 * - O P7 da constituicao preserva o modo de falha, inclusive o silencio:
 *   registro acrescentado e so escrita, e nenhuma ramificacao do sistema pode
 *   passar a depender dele. E o que CA-9.4 cobra, se US-9 for construida: a
 *   falha do aviso **nao** impede a transicao de estado.
 *
 * Os metodos sao sincronos por AD-04 de `target_architecture.md`: a fronteira de
 * `await` fica em `adaptadores/`.
 */

/**
 * Uma mensagem, nos mesmos **seis** argumentos de `wp_mail()`
 * (`wp-includes/pluggable.php:189`), para que a forma da chamada nao mude.
 *
 * **Seis, e nao cinco — conferido na arvore analisada.** O sexto parametro,
 * `$embeds`, foi acrescentado na 6.9.0 e esta no codigo desta versao
 * (`@since 6.9.0 The $embeds parameter was added.`, `:176`). Ele nao e detalhe
 * interno: o ponto de filtro `wp_mail` recebe os seis num arranjo
 * (`compact( 'to', 'subject', 'message', 'headers', 'attachments', 'embeds' )`,
 * `:209`), e o P2 da constituicao poe os ARGUMENTOS do ponto de extensao no
 * contrato publico. Declarar cinco entregaria a extensao um argumento a menos do
 * que o legado lhe da.
 *
 * Nenhuma historia desta feature usa `incorporados`, e ele entra assim mesmo,
 * pelo precedente explicito da resposta 7 de `questions.md` que BR-MIGRAR-111
 * cita: *"existir sem ser chamada e parte do que se clona"*.
 *
 * > ⚠️ A porta de e-mail de BC-05
 * > (`contextos/identidade-e-acesso/portas/porta-de-email.ts`, entregue por T001
 * > daquela feature) declara **cinco** campos e chama o conjunto de *"os mesmos
 * > cinco argumentos de `wp_mail()`"*. Contra esta arvore falta um. Este arquivo
 * > nao mexe no de BC-05 — nao e tarefa de T001 desta feature, e a regra de
 * > dependencia 3 proibe os dois contextos compartilharem o tipo de qualquer
 * > forma —, mas fica registrado aqui para quem revisar a paridade do slot
 * > `envio-de-email`.
 */
export interface MensagemDeEmail {
  readonly destinatarios: readonly string[];
  readonly assunto: string;
  readonly corpo: string;
  /** Cabecalhos como linhas, na forma que o legado aceita. */
  readonly cabecalhos: readonly string[];
  /** Caminhos de anexo, na forma que o legado aceita. */
  readonly anexos: readonly string[];
  /**
   * Caminhos de arquivo a **incorporar** na mensagem (o `$embeds` do legado),
   * que e como a imagem referenciada por `cid:` chega ao corpo HTML
   * (`wp-includes/pluggable.php:161` a `:172` e `:570`).
   */
  readonly incorporados: readonly string[];
}

/**
 * O resultado de uma tentativa de envio. A falha carrega o motivo que o canal
 * informou, porque o registro que CA-9.4 pede precisa dele.
 */
export type ResultadoDeEnvio =
  | { readonly enviado: true }
  | { readonly enviado: false; readonly motivo: string };

export interface PortaDeEmail {
  /** Tenta enviar. Nao lanca: a falha volta como `enviado: false`. */
  enviar(mensagem: MensagemDeEmail): ResultadoDeEnvio;
}
