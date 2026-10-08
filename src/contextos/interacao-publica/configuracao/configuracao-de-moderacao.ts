/**
 * Os pontos de configuracao nomeados da moderacao, com os valores de fabrica do
 * legado.
 *
 * O **P6** da constituicao cobra exatamente esta forma: *"todo prazo, contagem e
 * limite vem do legado, com o valor de fabrica e o ponto de configuracao que o
 * altera em execucao"*, e *"cada numero vive num ponto de configuracao nomeado,
 * com o valor de fabrica do legado, e existe teste que afirma o valor e o efeito
 * da borda"*. Por isso nada deste modulo le `2`, `14`, `5` ou `3600` de dentro
 * de uma expressao: tudo passa por aqui, e `../modulo.test.ts` afirma cada
 * valor contra a linha do legado que o semeia.
 *
 * O `plan.md` desta feature diz, na linha *configuracao de moderacao* do modelo
 * de dados, o que este arquivo entrega: *"continuam pontos de configuracao
 * nomeados, com os valores de fabrica. **Cada um deles e uma etapa da
 * cascata**"*.
 *
 * As duas familias estao separadas porque **vem de lugares diferentes do
 * legado**, e confundi-las e o jeito mais rapido de dar valor de fabrica a dado
 * de instalacao:
 *
 * - {@link OpcoesDeModeracao} e o que a **instalacao grava**. O valor de fabrica
 *   e a linha que `populate_options()` semeia (`DB-SEED`, BR-MIGRAR-084: *"o
 *   esquema vazio nao e funcional: parte da regra esta nas linhas que o
 *   instalador cria"*), e depois disso o dado gravado e a verdade. Cada campo
 *   cita a linha de `wp-admin/includes/schema.php` que o semeia.
 * - {@link LimitesDaModeracao} e o que o **codigo** impoe. Esta no codigo, e o
 *   valor de fabrica e o unico valor que existe sem extensao instalada.
 *
 * **Nada deste arquivo le a opcao.** Ler as treze linhas de `options` e trabalho
 * do registro de opcoes (`REG-Opcao`), que nao existe nesta arvore. Aqui, como
 * em `OPCOES_DO_CADASTRO_DE_FABRICA` de BC-05, a opcao e **entrada lida de
 * fora**, e o valor de fabrica e o que vale quando ninguem informa nada.
 *
 * **Toda etapa continua sendo um default filtravel, e preservar isso E o porte**
 * (BR-MIGRAR-108, `ESC-FILTRAVEL`; e o ultimo cenario de
 * `../../../../.specify/migration/parity_tests/01-cascata-de-moderacao-de-comentario.feature`).
 * Por isso os valores chegam por argumento as funcoes que os usam, em vez de
 * serem lidos da constante no ponto de uso.
 */

/**
 * Segundos numa hora, como o legado os declara (`HOUR_IN_SECONDS`,
 * `wp-includes/default-constants.php`).
 *
 * Declarado aqui, e nao importado de BC-05 que declara o mesmo numero: AD-10
 * proibe um contexto importar outro no topo do modulo, e um numero de calendario
 * nao vale uma ligacao horizontal entre contextos.
 */
export const SEGUNDOS_POR_HORA = 3600;

/** Segundos num dia, como o legado os declara (`DAY_IN_SECONDS`). */
export const SEGUNDOS_POR_DIA = 86400;

/**
 * O que a instalacao gravou, e que a cascata de moderacao le.
 *
 * ⚠️ **Dois campos sao comparados em modo ESTRITO contra a string `'1'` no
 * legado, e os outros onze por veracidade.** `check_comment()` faz
 * `'1' === get_option( 'comment_moderation' )`
 * (`wp-includes/comment.php:47`) e `'1' === get_option(
 * 'comment_previously_approved' )` (`wp-includes/comment.php:133`), enquanto
 * `comment_registration`, `require_name_email`, `thread_comments`,
 * `comments_notify`, `moderation_notify` e `close_comments_for_old_posts` entram
 * direto num `if`. A diferenca E observavel: uma instalacao com
 * `comment_moderation = 'yes'` **nao** tem moderacao manual ligada, e a mesma
 * instalacao com `comment_registration = 'yes'` **tem** a exigencia de conta
 * ligada. Aqui os treze aparecem como booleano ou numero de dominio; a conversao
 * do valor gravado para este tipo pertence a quem le a opcao, e e ali que esta
 * assimetria tem de ser reproduzida.
 */
export interface OpcoesDeModeracao {
  /**
   * `comment_registration` = **0**, desligada de fabrica
   * (`schema.php:459`). Ligada, CA-1.2 manda recusar o comentario anonimo
   * *"antes de qualquer outra verificacao"*, e o legado a confere em
   * `wp-includes/comment.php:4100`.
   */
  readonly exigirConta: boolean;
  /**
   * `require_name_email` = **1**, ligada de fabrica (`schema.php:422`). UC-14
   * registra o valor no proprio passo 2 — *"require_name_email nasce em 1"* — e
   * o legado a confere em `wp-includes/comment.php:4107`, so para quem nao tem
   * conta.
   */
  readonly exigirNomeEEmail: boolean;
  /**
   * `comment_moderation` = **0**, desligada de fabrica (`schema.php:441`).
   *
   * `C4` (BR-MIGRAR-012) e o curto-circuito mais forte da cascata: ligada,
   * *"`check_comment()` retorna falso na primeira linha: nenhuma outra regra e
   * consultada"* (`wp-includes/comment.php:47`), e CA-4.2 cobra as duas metades
   * disso. Comparacao estrita contra `'1'` — ver o aviso da interface.
   */
  readonly moderacaoManual: boolean;
  /**
   * `comment_max_links` = **2** (`schema.php:451`).
   *
   * `C5` (BR-MIGRAR-013): `num_links >= comment_max_links` manda para a fila, e
   * a contagem **inclui a URL do autor**. Duas coisas do legado que um porte
   * perde: a comparacao e `>=`, logo com o valor de fabrica **dois** links ja
   * bastam; e o valor zero desliga a etapa inteira por veracidade
   * (`if ( $max_links )`, `wp-includes/comment.php:56`), em vez de proibir todo
   * link.
   */
  readonly maximoDeLinks: number;
  /**
   * `moderation_keys` = **''** (`schema.php:447`).
   *
   * `C6` (BR-MIGRAR-014): as palavras sao buscadas em **seis** campos — autor,
   * e-mail, URL, texto, **IP e identificacao do navegador** —, linha a linha,
   * como expressao regular (`wp-includes/comment.php:80` em diante).
   *
   * E `string` crua, e nao lista, de proposito: no legado uma unica opcao guarda
   * o texto inteiro, e o que e observavel e **como** ele e quebrado — `trim()`
   * no conjunto, `explode( "\n", ... )`, `trim()` por linha, linha vazia
   * ignorada, e o `preg_quote( $word, '#' )` que existe so para o caractere `#`
   * nao quebrar o padrao. Guardar lista aqui decidiria, antes de T010, onde esse
   * corte acontece.
   */
  readonly palavrasDeModeracao: string;
  /**
   * `disallowed_keys` = **''** (`schema.php:545`).
   *
   * `C9` (BR-MIGRAR-017): casar manda para a **lixeira** quando a lixeira esta
   * ligada e para **spam** quando nao, *"para que o conteudo seja
   * recuperavel"* — ver {@link LimitesDaModeracao.lixeiraLigada}. Mesma forma de
   * `string` crua de {@link OpcoesDeModeracao.palavrasDeModeracao}, e com um
   * passo a mais que o legado faz so aqui: a marcacao e removida do texto antes
   * da comparacao, *"para que etiqueta HTML nao seja usada para escapar da
   * lista"* (`wp-includes/comment.php:1465`).
   */
  readonly listaDeProibicao: string;
  /**
   * `comment_previously_approved` = **1**, ligada de fabrica
   * (`schema.php:546`).
   *
   * `C7` (BR-MIGRAR-015): exige comentario anterior aprovado da mesma conta, ou
   * do mesmo par nome e e-mail, **e** que o e-mail nao contenha palavra de
   * moderacao. *"A conjuncao das duas condicoes e a regra; trata-las como
   * alternativas inverte o resultado."* Comparacao estrita contra `'1'` — ver o
   * aviso da interface.
   */
  readonly exigirAutorJaAprovado: boolean;
  /**
   * `close_comments_for_old_posts` = **0**, desligada de fabrica
   * (`schema.php:500`).
   *
   * `C11` (BR-MIGRAR-019), e CA-6.3 cobra o caminho de volta: desligar devolve a
   * aceitacao de todo o conteudo antigo *"sem precisar de migracao de dados"* —
   * o que so e verdade porque o fechamento acontece EM MEMORIA e o banco nao
   * muda (`wp-includes/comment.php:3864`).
   *
   * ⚠️ A etapa existe em DOIS lugares no legado, e os dois leem esta opcao:
   * `_close_comments_for_old_posts()` (`:3841`), que reescreve o objeto do
   * conteudo em consulta singular, e `_close_comments_for_old_post()`
   * (`:3881`), que responde ao ponto de filtro que pergunta se a interacao esta
   * aberta — e so o segundo dispensa o conteudo com data zerada
   * (`'0000-00-00 00:00:00'`, `:3903`), porque *"rascunho sem data nao deve
   * aparecer como comentario fechado"*. Quem pegar T014 precisa dos dois.
   */
  readonly fecharInteracaoEmConteudoAntigo: boolean;
  /**
   * `close_comments_days_old` = **14** (`schema.php:501`), e CA-6.4 fixa o
   * numero.
   *
   * O legado le com conversao para inteiro e **desliga a etapa quando o valor e
   * zero** (`if ( ! $days_old )`,
   * `wp-includes/comment.php:3859` e `:3891`), em vez de fechar tudo. A comparacao e
   * `> dias * DAY_IN_SECONDS` sobre a data GMT do conteudo, logo e `>` e nao
   * `>=`: e a borda que o P6 manda testar.
   */
  readonly diasParaFecharInteracao: number;
  /**
   * `thread_comments` = **1**, ligado de fabrica (`schema.php:502`). CA-7.4:
   * desligado, *"todas as respostas ficam no primeiro nivel"*.
   */
  readonly encadearRespostas: boolean;
  /**
   * `thread_comments_depth` = **5** (`schema.php:503`). UC-14 registra o valor
   * no fluxo alternativo de resposta encadeada — *"a profundidade e limitada por
   * `thread_comments_depth`, que nasce em 5"* — e CA-7.2 o cobra.
   */
  readonly profundidadeMaximaDeEncadeamento: number;
  /**
   * `comments_notify` = **1**, ligado de fabrica (`schema.php:423`). CA-9.1: o
   * comentario aprovado avisa o autor do conteudo comentado. O legado le com
   * conversao para booleano em `wp-includes/comment.php:2552`.
   */
  readonly avisarAutorDoConteudo: boolean;
  /**
   * `moderation_notify` = **1**, ligado de fabrica (`schema.php:442`). CA-9.2: o
   * comentario que entrou na fila avisa quem pode moderar
   * (`wp-includes/pluggable.php:2012`).
   */
  readonly avisarQuemModera: boolean;
}

export const OPCOES_DE_MODERACAO_DE_FABRICA: OpcoesDeModeracao = {
  exigirConta: false,
  exigirNomeEEmail: true,
  moderacaoManual: false,
  maximoDeLinks: 2,
  palavrasDeModeracao: '',
  listaDeProibicao: '',
  exigirAutorJaAprovado: true,
  fecharInteracaoEmConteudoAntigo: false,
  diasParaFecharInteracao: 14,
  encadearRespostas: true,
  profundidadeMaximaDeEncadeamento: 5,
  avisarAutorDoConteudo: true,
  avisarQuemModera: true,
};

/**
 * Os numeros que o **codigo** do legado impoe, e que nenhuma linha de `options`
 * guarda.
 *
 * Eles estao aqui, e nao soltos no ponto de uso, porque o P6 nao distingue
 * origem: *"cada numero vive num ponto de configuracao nomeado"*. Os tres sao
 * filtraveis ou substituiveis no legado, cada um por um caminho diferente, e a
 * nota de cada campo diz qual.
 */
export interface LimitesDaModeracao {
  /**
   * A janela da vazao: **uma hora** (`HOUR_IN_SECONDS`,
   * `wp-includes/comment.php:922`).
   *
   * `C2` (BR-MIGRAR-010) procura, nessa janela, o ultimo comentario da mesma
   * conta — ou do mesmo endereco de origem, para quem nao tem conta — **ou** do
   * mesmo e-mail. A janela nao e opcao: e constante de codigo, e o que o legado
   * deixa filtravel e a DECISAO, pelo ponto de extensao `comment_flood_filter`.
   */
  readonly janelaDeVazaoEmSegundos: number;
  /**
   * O intervalo minimo entre dois comentarios do mesmo autor: **15 segundos**
   * (`wp_throttle_comment_flood`, `wp-includes/comment.php:2319`).
   *
   * 🔴 **PARADA PARA T008, E ELA NAO E DESTA TAREFA.** Ha uma divergencia entre
   * o pacote e o legado neste numero, e T001 nao a resolve — apenas a registra
   * com os dois lados:
   *
   * - **O pacote** diz que o segundo comentario na ultima hora ja aciona o
   *   freio. CA-3.1 de `spec.md`: *"um segundo comentario da mesma conta na
   *   ultima hora aciona o freio com HTTP 429"*; BR-MIGRAR-010 repete: *"um
   *   comentario do mesmo usuario logado, ou do mesmo IP/e-mail anonimo, na
   *   ultima hora aciona o filtro de enxurrada"*; e o cenario de paridade de
   *   `01-cascata-de-moderacao-de-comentario.feature` encena exatamente isso.
   * - **O legado** so recusa quando os dois comentarios estao a **menos de 15
   *   segundos** um do outro. A consulta da janela de uma hora
   *   (`wp-includes/comment.php:922`) serve para ACHAR o comentario anterior; a
   *   decisao sai do ponto de extensao `comment_flood_filter`, cujo unico
   *   interceptador de fabrica e `wp_throttle_comment_flood`
   *   (`wp-includes/default-filters.php:311`), e ele devolve verdadeiro apenas
   *   para `$time_newcomment - $time_lastcomment < 15`. Com o valor de fabrica,
   *   um segundo comentario vinte minutos depois **nao** e recusado.
   *
   * Escolher um dos dois lados muda o que o visitante recebe — 429 contra
   * comentario gravado —, e o P1 manda que divergencia do observavel tenha
   * decisao humana registrada e citada no codigo. Os dois numeros vivem aqui,
   * nomeados, e quem pegar T008 leva a divergencia a quem decide em vez de
   * escolher.
   */
  readonly intervaloMinimoEntreComentariosEmSegundos: number;
  /**
   * Se a lixeira esta ligada nesta instalacao. De fabrica **sim**, porque
   * `EMPTY_TRASH_DAYS` nasce em 30 (`wp-includes/default-constants.php:388`).
   *
   * E booleano, e nao o numero 30, de proposito: `C9` le a constante **por
   * veracidade** — `EMPTY_TRASH_DAYS ? 'trash' : 'spam'`
   * (`wp-includes/comment.php:1392`) — e o unico efeito observavel dela nesta
   * feature e qual dos dois estados o comentario recebe. O numero de dias
   * pertence a feature `005-retencao-e-descarte`, que e dona do prazo; duplicar
   * o 30 aqui criaria dois donos para o mesmo numero, e P6 pede um ponto de
   * configuracao por numero, nao dois.
   */
  readonly lixeiraLigada: boolean;
}

export const LIMITES_DA_MODERACAO_DE_FABRICA: LimitesDaModeracao = {
  janelaDeVazaoEmSegundos: SEGUNDOS_POR_HORA,
  intervaloMinimoEntreComentariosEmSegundos: 15,
  lixeiraLigada: true,
};

/**
 * Os tipos de conteudo que fecham a interacao por idade: **so `post`** de
 * fabrica.
 *
 * Esta separado das opcoes porque no legado nao e opcao: e o valor de fabrica de
 * um ponto de extensao, `close_comments_for_post_types`
 * (`wp-includes/comment.php:3853` e `:3898`), sem interface que o altere — a mesma forma
 * que a lista de logins proibidos tem em BC-05. CA-6.1 fala em *"conteudo do
 * tipo em linha do tempo"*, e BR-MIGRAR-019 nomeia o tipo: `post`.
 *
 * `C11` confere o tipo **antes** de olhar o prazo, e confere **somente o
 * primeiro** item do conjunto consultado (`$posts[0]`), porque a etapa so roda
 * em consulta singular. Isso e de T014; aqui mora apenas o valor de fabrica.
 */
export const TIPOS_DE_CONTEUDO_COM_FECHAMENTO_AUTOMATICO_DE_FABRICA: readonly string[] =
  ['post'];
