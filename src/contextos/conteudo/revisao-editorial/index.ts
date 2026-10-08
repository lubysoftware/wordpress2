/**
 * `revisao-editorial/` — avaliar, ajustar e publicar o texto que outra pessoa
 * escreveu, sem se apropriar dele.
 *
 * Entrega de **T017** da feature `002-autoria-e-publicacao` (US-8), e e
 * [UC-07](../../../../.specify/use-cases/UC-07-revisar-e-publicar-conteudo-de-outro-autor.md)
 * menos o que pertence a outras historias (ver a lista no fim).
 *
 * | arquivo | o que e |
 * |---|---|
 * | `permissao-da-revisao-editorial.ts` | **CA-8.1**, **CA-8.5** e **CA-8.6**: a soma que a traducao devolve, lida como valor, e o portao que a compara |
 * | `autoria-na-revisao.ts` | **CA-8.2**: os dois mecanismos que preservam o autor, e o ramo que o legado resolve pela linha |
 * | `revisar-e-publicar.ts` | as duas operacoes — publicar o alheio e devolver ao autor —, e o achado de que as duas sao o **mesmo** campo do formulario |
 * | `us-8-revisar-e-publicar.test.ts` | os seis criterios, afirmados por efeito no banco e por lista de capacidades |
 *
 * ---
 *
 * # Os seis criterios, e onde cada um se cumpre
 *
 * | criterio | o que o cumpre | ancora no legado |
 * |---|---|---|
 * | **CA-8.1** *soma o alheio ao exigido pelo estado* | {@link capacidadesDaEdicaoDesteConteudo}, sobre o ramo do alheio da traducao | `wp-includes/capabilities.php:266`-`:275` |
 * | **CA-8.2** *a publicacao mantem o autor original* | {@link autorNaRevisaoEditorial} mais a mistura de `wp_update_post()` | `wp-admin/includes/post.php:691`-`:695` · `wp-includes/post.php:5367` |
 * | **CA-8.3** *o identificador vazio e fixado na publicacao* | **ja estava em T007**: `identificadorValido()`, quando o estado sai de `pending` | `wp-includes/post.php:4741`-`:4763` |
 * | **CA-8.4** *devolver volta para rascunho sem perder o texto* | {@link devolverAoAutor}, com o seletor de estado e a mistura | `wp-admin/includes/meta-boxes.php:160`-`:165` |
 * | **CA-8.5** *o hierarquico resolve em familia distinta* | os **slots** do registro do tipo, sem um `if` sobre o nome `page` | `wp-includes/post.php:1884` |
 * | **CA-8.6** *a funcao especial exige a capacidade dela* | o ramo da pagina de politica, que **soma** `manage_privacy_options` traduzida | `wp-includes/capabilities.php:282` |
 *
 * **As ancoras que `spec.md` da para US-8 sao `wp-admin/post.php:236`,
 * `wp-includes/capabilities.php:149` e `:113`** — e as duas de
 * `capabilities.php` **ja estavam na arvore** quando esta tarefa comecou: sao de
 * T017 da feature 001, em `plataforma/autorizacao/traducao-de-conteudo.ts`. O
 * que faltava era `wp-admin/post.php:236` — o `case 'editpost'`, que e
 * `edit_post()` —, e e a **operacao** que esta pasta entrega, do mesmo modo e
 * pelo mesmo motivo que T015 entregou a de US-7.
 *
 * ⚠️ **E e a MESMA funcao do legado.** `edit_post()` foi portada por T015, em
 * `../revisao/submeter-para-revisao.ts`, e esta pasta a **chama**: o botao
 * primario do editor e o mesmo campo `publish` para publicar e para submeter
 * (`wp-admin/includes/meta-boxes.php:376`-`:398`), e o que separa as duas
 * historias e a capacidade de quem clicou. O que esta pasta acrescenta esta na
 * tabela de arquivos acima, e nenhum arquivo de `../revisao/` foi alterado.
 *
 * ---
 *
 * # Como se confere que esta pasta tem paridade
 *
 * O criterio desta area e **efeito no banco** (area 3 da Decisao 2 —
 * *"snapshot + sequencia de comandos"*), somado ao **valor devolvido pelo ponto
 * de extensao, byte a byte** (area 2), e e por essa segunda que a lista de
 * capacidades entra no resultado: ela e o valor que o interceptador de
 * `map_meta_cap` recebe.
 *
 * As specs de paridade sao duas, e desta pasta e uma metade de cada:
 *
 * - `.specify/migration/parity_tests/07-autorizacao-por-capacidade.feature`,
 *   cenario `@critico` *"Capacidade sobre objeto e traduzida, e todo caminho de
 *   erro fecha a porta"*, que abre com **exatamente** o cenario desta historia:
 *
 *   > **Dado** um ator com papel de editor **e um conteudo de outro autor**
 *   > **Quando** uma capacidade sobre esse objeto e verificada
 *   > **Entao** as duas metades **traduzem** a capacidade antes de decidir
 *   > **E** a decisao final e identica nas duas
 *
 * - `.specify/migration/parity_tests/02-publicacao-e-agendamento-de-conteudo.feature`,
 *   cenario `@critico` *"Rascunho pode ter slug duplicado, publicado nao — e o
 *   slug muda sozinho ao publicar"*, na metade *"Quando um deles e publicado /
 *   Entao o slug dele muda sozinho, da mesma forma nas duas metades"*: e esta
 *   operacao que publica **salvando**, e e so por este caminho que o slug muda
 *   (ver o achado de T003 no README deste modulo).
 *
 * **Nenhum cenario e executavel hoje:** `parity_specs.md` registra que nao ha
 * oraculo executavel nesta arvore, e levanta-lo e T001 da feature 015. O que
 * esta pasta faz, e o que o README deste modulo manda fazer, e citar **arquivo e
 * linha** do legado em cada afirmacao, em vez de descrever comportamento de
 * memoria.
 *
 * ---
 *
 * # 🔴 O que esta tarefa encontrou aberto, e NAO fechou
 *
 * **1. UC-07 atribui a edicao uma protecao que, no legado, so existe na
 * exclusao.** UC-07 diz *"o editor nao consegue editar a pagina inicial"*; o
 * ramo que troca a familia por `manage_options` esta somente no
 * `case 'delete_post'` (`capabilities.php:113`-`:118`) e **nao** no
 * `case 'edit_post'` (`:188`-`:285`). `traducao-de-conteudo.ts` o aplica aos
 * dois verbos. A analise completa esta no cabecalho de
 * `permissao-da-revisao-editorial.ts`; **CA-8.6 nao se apoia nesse ramo**, e sim
 * na pagina de politica de privacidade, que o `case 'edit_post'` tem.
 *
 * **2. US-9 pede aviso onde UC-07 diz que nao ha aviso.** Esta pasta constroi o
 * caminho de volta (CA-8.4) e **nao envia nada**: UC-07 e literal — *"Nenhuma
 * notificacao e enviada ao autor: o sistema nao avisa"* — e a PARADA de
 * `../portas/porta-de-email.ts` registra a divergencia inteira. Quem pegar
 * **T019** decide com quem decide, nao aqui.
 *
 * **3. O rebaixamento de quem nao pode publicar continua como T015 o deixou.** Um
 * ator com `edit_others_posts` e **sem** `publish_posts` que aperte o botao de
 * publicar o alheio nao e recusado: o estado grava `pending`. Nenhuma das duas
 * tarefas escolhe entre *"recusa explicita na tela"* (a leitura de CA-1.1) e o
 * rebaixamento do painel — o item 5 de *O que ninguem decidiu* segue aberto.
 *
 * ---
 *
 * # O que esta pasta nao tem, e de quem e
 *
 * | o que | de quem |
 * |---|---|
 * | os oito testes de `backlog/tests.md` (UT-026-1 a UT-026-8) | **T018**, a tarefa `[P]` que roda em paralelo com esta |
 * | o aviso ao autor quando o conteudo e devolvido ou publicado | **T019** (US-9) — ver o item 2 acima |
 * | registrar quem revisou e quando | **ninguem**: REQ-028 esta em `do-not-rewrite.md`, e UC-07 confirma — *"nenhum registro de quem aprovou foi gravado"* |
 * | a fila de onde o editor abre o pendente, que e o **gatilho** de UC-07 | **T015**, em `../revisao/fila-de-revisao.ts` (CA-7.2) |
 * | a versao anterior do texto ajustado | **T021** (US-10) |
 * | a visibilidade privada, o outro destino do seletor de estado | **T009** (US-4) |
 * | o agendamento, que e o **mesmo** campo `publish` com outro rotulo | **T013** (US-6) |
 * | a autorizacao sobre o conteudo na lixeira, decidida pelo estado **anterior** | ja esta em `plataforma/autorizacao/traducao-de-conteudo.ts`; a operacao de descartar e a feature 005 |
 * | a traducao dos 86 `case`, e os que nao sao de conteudo nem de conta | `plataforma/autorizacao/`, cada um na feature do seu objeto |
 * | `sanitize_key()` e `sanitize_title()` | `plataforma/formatacao/`, feature 015 |
 * | a sanitizacao do corpo (REQ-030) e o formato dele (REQ-032) | **ninguem** — e esta operacao nao grava corpo que o pedido nao traga |
 * | emitir ponto de extensao por um barramento | ninguem deste pacote: REQ-162 esta em `do-not-rewrite.md` |
 * | invalidar cache | nao ha cache nesta arvore (REQ-165 ficou fora do pacote) |
 */

export {
  CODIGO_DE_RECUSA_DE_AUTORIA_ALHEIA_NA_API,
  MENSAGEM_DE_RECUSA_DE_AUTORIA_ALHEIA_NA_API,
  autorizarRevisaoEditorial,
  capacidadesDaEdicaoDesteConteudo,
} from './permissao-da-revisao-editorial.js';

export {
  autorNaRevisaoEditorial,
  autoriaPreservada,
  type AutoriaPedidaNaRevisao,
} from './autoria-na-revisao.js';

export {
  BOTAO_ACIONADO,
  devolverAoAutor,
  revisarEPublicar,
  type DesfechoDaRevisaoEditorial,
  type PedidoDeRevisaoEditorial,
  type ResultadoDaRevisaoEditorial,
} from './revisar-e-publicar.js';
