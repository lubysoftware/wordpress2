/**
 * A chave de confirmacao: a forma com que ela e **guardada**, e nada alem.
 *
 * Terceira metade da entrega de **T002** da feature
 * `008-privacidade-e-dados-pessoais`: *"a chave de confirmacao guardada com
 * resumo criptografico"*. `satisfaz: — (infraestrutura)`.
 *
 * **O prazo e a conferencia nao estao aqui, e isso e fronteira de tarefa.** O
 * prazo de 24 horas, o ponto de extensao que o altera
 * (`user_request_key_expiration`, `wp-includes/user.php:5112`) e a **ordem dos
 * cinco ramos** de `wp_validate_user_request_key` (`:5093`, `:5097`, `:5101`,
 * `:5115`, `:5119`) sao de **T005** (US-2), e o P6 cobra o teste de borda junto
 * com o numero. O que e desta tarefa e onde a chave mora, com que forma, e qual
 * valor significa "nao ha chave".
 *
 * ── A COLUNA E COMPARTILHADA, E ISSO E UMA PERGUNTA EM ABERTO ──────────────
 *
 * 🔴 A chave vive em **`posts.post_password`**, a mesma coluna em que o conteudo
 * guarda senha em **texto claro**. `D6` / BR-MIGRAR-044, 🟢: *"Senha de post e
 * texto claro, por desenho — e senha de acesso a conteudo, nao de conta, e
 * precisa poder ser exibida a quem edita"*. Na solicitacao a mesma coluna guarda
 * um **resumo**, e o significado e decidido pelo `post_type` da linha.
 *
 * A `spec.md` desta feature deixou a pergunta aberta, com todas as palavras: *"O
 * modelo novo mantem o campo compartilhado, com significados diferentes por tipo
 * de registro, ou separa os dois? Separar e mais claro e **muda o que um
 * programa de terceiro le**"*. O risco 3 do `plan.md` repete: *"e o tipo de
 * heranca que um porte 'limpa' sem perceber que mudou o que se le"*.
 *
 * **T002 nao decide: mantem o campo compartilhado, que e o observavel**, e isso
 * e o unico caminho que o P1 deixa — *"reproduza o comportamento observavel do
 * sistema analisado, inclusive quando ele parecer defeito"*. Separar exigiria
 * decisao humana registrada, e nao ha. A direcao inversa — passar a guardar a
 * senha de conteudo com resumo — e `BR-HUMANA-009`, **pendente**, e
 * `target_data_model.md` registra o custo dela: *"invalida toda senha de
 * conteudo existente"*.
 *
 * ── A FUNCAO DE RESUMO CHEGA POR ARGUMENTO, E A RAZAO E AUSENCIA DE
 * PRIMITIVA ───────────────────────────────────────────────────────────────
 *
 * No legado o resumo e `wp_fast_hash()` e a conferencia e
 * `wp_verify_fast_hash()` — `wp-includes/functions.php:9363` e `:9386`, chamadas
 * de `wp-includes/user.php:5067` e `:5115`. O que elas fazem esta medido:
 * `sodium_crypto_generichash( $message, 'wp_fast_hash_6.8+', 30 )` seguido de
 * `sodium_bin2base64( ..., SODIUM_BASE64_VARIANT_URLSAFE_NO_PADDING )`, com o
 * resultado prefixado por {@link MARCADOR_DE_RESUMO_GENERICO} — isto e, **BLAKE2b
 * com chave, saida de 30 bytes**, da libsodium.
 *
 * ⚠️ **Correcao de uma afirmacao de T001.** O `../README.md` escrito por T001
 * diz que as duas *"sao funcoes substituiveis do nucleo (`wp-includes/user.php:5067`
 * e `:5115`)"*. As duas ancoras sao os **pontos de chamada**, nao as definicoes,
 * e as definicoes **nao tem guarda `function_exists`**: elas estao em
 * `functions.php`, nao em `pluggable.php`, logo **nao** sao dos 38 substituiveis.
 * O que e substituivel no legado e o objeto de hash de senha, que e outra coisa
 * — o proprio docblock de `wp_fast_hash` e literal: *"This function must not be
 * used for hashing user-generated passwords. Use `wp_hash_password()` for that"*.
 * A ancora correta esta acima; o resto da decisao de T001 continua valendo, e o
 * motivo e outro:
 *
 * 1. **O `plan.md` desta feature nao tem slot de resumo.** O slot `hash-de-senha`
 *    do pacote e bcrypt mais HMAC do runtime, e e o de `wp_hash_password()` —
 *    explicitamente **nao** esta.
 * 2. **A primitiva nao existe na biblioteca padrao do runtime.** BLAKE2b com
 *    chave e saida de 30 bytes nao e alcancavel por `crypto.createHash`, e
 *    escolher a biblioteca que a traga e *"escolher a tecnologia de qualquer slot
 *    do plano"*, que a tabela **Nao negociavel** da constituicao poe fora do
 *    alcance de um agente.
 *
 * Por isso {@link HashDaChaveDeConfirmacao} e {@link GeradorDaChaveDeConfirmacao}
 * sao **interfaces**, resolvidas por quem compoe. E a mesma decisao que BC-05
 * registrou em `contextos/identidade-e-acesso/redefinicao-de-senha/chave-de-redefinicao.ts`,
 * com **uma diferenca medida**: la o comprimento da chave em claro nao esta no
 * pacote nem no legado lido, e aqui **esta** — ver
 * {@link COMPRIMENTO_DA_CHAVE_DE_CONFIRMACAO}.
 *
 * ── A DIFERENCA PARA A CHAVE DE REDEFINICAO DE SENHA, QUE E A ARMADILHA ────
 *
 * `target_domain_model.md` avisa que `VO-ChaveDeAtivacao` esconde tres coisas
 * incompativeis: *"reset de senha com 24 h, confirmacao de privacidade com hash
 * e 24 h, ativacao de cadastro em rede sem prazo"*. A segunda e esta, e o que a
 * separa da primeira **nao** e o prazo:
 *
 * | | chave de redefinicao (BC-05) | chave de confirmacao (BC-06) |
 * |---|---|---|
 * | onde mora | `users.user_activation_key` | `posts.post_password` |
 * | o que a coluna guarda | **o instante do pedido**, `:`, e o resumo | **so** o resumo |
 * | de onde sai o instante do prazo | da propria coluna | de `post_modified_gmt` da **linha** |
 *
 * ⚠️ A consequencia e grande e e de T005, T007 e T009: como o instante nao esta
 * na coluna da chave, **gerar a chave precisa tocar a linha** para que o relogio
 * do prazo reinicie. E exatamente o que o legado faz — `wp_generate_user_request_key`
 * grava por `wp_update_post` (`user.php:5063`), e `wp_insert_post` reescreve
 * `post_modified` e `post_modified_gmt` para o agora sempre que e atualizacao
 * (`wp-includes/post.php:4789` a `:4791`). Gravar a chave sem reescrever a data
 * deixaria o prazo correndo do envio anterior, e o reenvio de CA-3.3 nasceria
 * com menos de 24 horas de vida. Ver `./solicitacao.ts`, secao da gravacao.
 */

/**
 * O valor que significa **nao ha chave**: a cadeia vazia.
 *
 * `posts.post_password` e `varchar(255) NOT NULL default ''`, logo a ausencia e
 * a sentinela vazia e **nao** `NULL` (`DB-SENT`, BR-MIGRAR-081).
 *
 * Dois caminhos escrevem este valor, e os dois sao observaveis:
 *
 * 1. **A abertura**, que nao informa `post_password` e portanto recebe o default
 *    que `wp_insert_post` resolve (`wp-includes/post.php:4616` na tabela de
 *    defaults e `:4840` no ponto em que o valor e montado): a solicitacao nasce
 *    **sem chave**, e a chave so aparece no envio. `wp_create_user_request`
 *    (`user.php:4841` a `:4853`) nao a menciona.
 * 2. **A expiracao**, que a grava de volta no **mesmo `UPDATE`** que muda o
 *    estado: `'post_status' => 'request-failed', 'post_password' => ''`
 *    (`wp-admin/includes/privacy-tools.php:226` e `:227`). `D3b` /
 *    BR-MIGRAR-041, 🟢: *"a chave e apagada no mesmo `UPDATE` — o link antigo
 *    deixa de existir em vez de apenas vencer"*, e o documento acrescenta que
 *    isso e *"atomicidade obtida por uma unica instrucao, nao por transacao — e
 *    nao ha transacao no sistema para quebrar"*.
 *
 * 🔴 **E ha um terceiro caminho que o pacote exige e a arvore nao tem.** CA-2.5
 * manda que *"confirmar apaga a chave"* e a pos-condicao de UC-26 repete — *"a
 * chave de confirmacao nao existe mais"*. T001 registrou isso como *"candidata a
 * quarta divergencia"* e pediu a conferencia do caminho inteiro; **T002 teve de
 * ler esse caminho para decidir onde a gravacao mora, e confirma a divergencia**:
 * `wp-login.php:1240` a `:1276` valida a chave e dispara
 * `user_request_action_confirmed`, que tem **dois** ouvintes
 * (`wp-includes/default-filters.php:453` e `:454`); nenhum dos dois toca
 * `post_password`, e `wp_update_post` carrega o valor existente de volta porque
 * faz `array_merge( $post, $postarr )` sobre a linha lida
 * (`wp-includes/post.php:5335` e `:5367`). **A chave sobrevive a confirmacao.**
 * T002 nao escolhe lado: o conflito esta no `../README.md`, e quem o resolve e
 * quem tiver a decisao humana — nao T005.
 *
 * ⚠️ **Esta sentinela e lida com a verdade de PHP, e e por isso que ela nao
 * precisa de guarda aqui.** `wp_validate_user_request_key` decide com
 * `! $saved_key` (`user.php:5093`), que e falso para `''` **e** para `'0'`. Um
 * resumo gerado nunca e `'0'` — ele comeca por {@link MARCADOR_DE_RESUMO_GENERICO}
 * —, mas a coluna aceita qualquer coisa que uma extensao grave la. Aplicar o
 * ramo e de **T005**.
 */
export const SEM_CHAVE = '';

/**
 * `$generic$` — o prefixo que o resumo gravado carrega.
 *
 * Nao e detalhe de implementacao: ele e **observavel na coluna** e e o
 * discriminante de um ramo de compatibilidade. `wp_verify_fast_hash` testa
 * `str_starts_with( $hash, '$generic$' )` e, quando o prefixo **nao** esta,
 * trata o valor como resumo *phpass* antigo em vez de recusar
 * (`wp-includes/functions.php:9391` a `:9395`). Isto e, uma coluna gravada por
 * uma instalacao anterior a 6.8.0 continua conferindo — `@since 6.8.0 The key is
 * now hashed using wp_fast_hash() instead of phpass`
 * (`wp-includes/class-wp-user-request.php:96`).
 *
 * ⚠️ **O ramo de compatibilidade nao e exercitavel nesta arvore, e nao e por
 * isso que ele desaparece.** O alvo parte de *"instalacao nova, sem dado a
 * migrar"* (respostas 1 a 5 de `questions.md`), logo nenhuma coluna com resumo
 * *phpass* existe aqui. P8 e literal — *"nao remova funcao, constante, tabela,
 * rota, superficie nem comportamento publicado"* —, e o P7 acrescenta que
 * *"existir sem ser chamada e parte do que se clona"*. A constante fica
 * declarada; **implementar o ramo e de T005**, que e quem confere.
 */
export const MARCADOR_DE_RESUMO_GENERICO = '$generic$';

/**
 * O comprimento da chave em claro: **20** caracteres.
 *
 * `wp_generate_password( 20, false )` (`wp-includes/user.php:5060`). O numero
 * existe no legado, logo o P6 manda reproduzi-lo — *"todo prazo, contagem e
 * limite vem do legado, com o valor de fabrica"* — e manda, na mesma frase, nao
 * inventar o que nao existe: **nao ha limite de tentativa de chave**, e UC-26 e
 * literal sobre isso, *"nenhum contador de tentativa existe"*. Introduzir um
 * cai na tabela *Nao negociavel*.
 *
 * ⚠️ 20 caracteres do alfabeto de {@link ALFABETO_DA_CHAVE_DE_CONFIRMACAO} sao
 * cerca de 119 bits, e e disso que depende a seguranca do resumo: o docblock de
 * `wp_fast_hash` avisa que a funcao **nao salga** o valor e que *"input to this
 * function must originate from a random generator with sufficiently high
 * entropy, preferably greater than 128 bits"*
 * (`wp-includes/functions.php:9345` a `:9347`). Encurtar a chave enfraqueceria o
 * resumo sem mudar linha nenhuma do codigo que o gera.
 */
export const COMPRIMENTO_DA_CHAVE_DE_CONFIRMACAO = 20;

/**
 * O alfabeto da chave em claro: as 62 letras e digitos de
 * `wp_generate_password` com `$special_chars = false`
 * (`wp-includes/pluggable.php:2965` e `:2966`).
 *
 * A ordem e a do legado porque o sorteio e por **indice** —
 * `substr( $chars, wp_rand( 0, strlen( $chars ) - 1 ), 1 )` (`:2975`) —, logo
 * reordenar o alfabeto muda a sequencia que um gerador semeado produz, que e o
 * que um teste de paridade com aleatoriedade fixa compara.
 *
 * ⚠️ O caractere sorteado passa por `random_password`, que e **ponto de
 * extensao publico** (`pluggable.php:2989`): o valor devolvido ali e o que vale,
 * e por isso o comprimento e o alfabeto sao **default filtravel**, nao garantia
 * (BR-MIGRAR-108, `ESC-FILTRAVEL`).
 */
export const ALFABETO_DA_CHAVE_DE_CONFIRMACAO =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Como a chave em claro e gerada.
 *
 * Borda de aleatoriedade: `wp_rand()` tem semeadura propria, e AD-04 poe borda
 * em `adaptadores/`. Sincrono pela mesma regra.
 *
 * O valor devolvido **so** pode acabar no e-mail ao titular: CA-2.1 e literal,
 * *"o valor em claro so existe no e-mail enviado ao titular"*, e a pos-condicao
 * de UC-25 repete. Nada deste modulo o guarda.
 */
export interface GeradorDaChaveDeConfirmacao {
  /** A chave em claro, com {@link COMPRIMENTO_DA_CHAVE_DE_CONFIRMACAO}. */
  gerar(): string;
}

/**
 * Com que funcao a chave e resumida para ser gravada, e conferida na volta — ver
 * o cabecalho sobre por que ela chega por argumento.
 *
 * Os dois metodos sao os dois lados de `wp_fast_hash` e `wp_verify_fast_hash`,
 * e a assimetria deles e do legado: **nao ha sal**, logo o mesmo valor em claro
 * produz sempre o mesmo resumo, e a conferencia e `hash_equals( $hash,
 * wp_fast_hash( $message ) )` (`wp-includes/functions.php:9397`) — comparacao em
 * tempo constante sobre o resumo recalculado, nao sobre o valor em claro.
 */
export interface HashDaChaveDeConfirmacao {
  /**
   * O resumo a gravar em `post_password`. Comeca por
   * {@link MARCADOR_DE_RESUMO_GENERICO} na implementacao do legado.
   */
  gerar(chaveEmClaro: string): string;
  /**
   * Confere a chave apresentada contra o resumo gravado.
   *
   * Devolve **booleano** e nao lanca: AD-06 poe falha de negocio em valor de
   * retorno, e o cenario `@invariante` de `PT-012` cobra que *"nenhuma das duas
   * lanca excecao que interrompa o fluxo"*.
   */
  conferir(chaveEmClaro: string, resumoGravado: string): boolean;
}
