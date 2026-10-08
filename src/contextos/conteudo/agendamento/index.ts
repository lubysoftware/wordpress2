/**
 * `agendamento/` — marcar uma data futura para o conteudo aparecer sozinho.
 *
 * Entrega de **T013** da feature `002-autoria-e-publicacao` (US-6), e e UC-04,
 * que *"estende UC-03"* — a mesma autorizacao, o mesmo caminho de gravacao, e
 * **nenhum comando proprio**.
 *
 * | arquivo | o que e |
 * |---|---|
 * | `instante-da-data.ts` | o `strtotime()` das quatro comparacoes, com o `false` do PHP preservado como zero |
 * | `estado-pela-data.ts` | **CA-6.1** e **CA-6.2**: a conversao bidirecional, a folga de 60 segundos e o anexo fora do bloco |
 * | `evento-de-publicacao-agendada.ts` | `_future_post_hook()`: limpa e agenda ao entrar em agendado, prioridade 5 no ponto 3 |
 * | `publicacao-agendada.ts` | **CA-6.3** e **CA-6.4**: `check_and_publish_future_post()`, as duas guardas e o reagendamento |
 * | `us-6-agendar-publicacao.test.ts` | os cinco criterios, por efeito no banco e por sequencia de chamadas a fila |
 *
 * **CA-6.5 nao esta nesta pasta, e isso nao e omissao.** *"Qualquer transicao de
 * estado do conteudo limpa o evento pendente"* e o ultimo bloco de
 * `_transition_post_status()` (`wp-includes/post.php:8189`), que T003 ja
 * implementou em `../publicacao/transicao-de-estado.ts` como CA-1.5 — sao o
 * **mesmo** codigo, cobrado por duas historias. O que T013 acrescentou naquele
 * arquivo foi o ouvinte do **ponto 3**, que e o que poe o evento de volta na
 * fila, e a afirmacao de que a limpeza alcanca toda transicao e nao so a entrada
 * em publicado — ver a secao de CA-6.5 na suite desta pasta.
 *
 * ---
 *
 * # Os tres mecanismos de guarda, e onde cada um mora
 *
 * ADR-0005 os tabela, e sao eles que tornam REQ-024 construivel sobre uma fila
 * que nao e confiavel:
 *
 * | mecanismo | o que faz | onde esta |
 * |---|---|---|
 * | `_future_post_hook()` | ao entrar em agendado, limpa o evento pendente e agenda um novo na data | `evento-de-publicacao-agendada.ts`, disparado por `../publicacao/transicao-de-estado.ts` |
 * | `_transition_post_status()` | em **qualquer** transicao, limpa o evento | `../publicacao/transicao-de-estado.ts` (T003, CA-1.5) |
 * | `check_and_publish_future_post()` | ao ser chamada pela fila, reconfere estado **e** data | `publicacao-agendada.ts` |
 *
 * ---
 *
 * # 🔴 Uma divergencia entre `plan.md` e `spec.md` que T013 NAO fechou
 *
 * A tabela *Contratos* de `plan.md` descreve uma operacao
 * **`agendar publicacao`** com *"entrada: identificador e instante futuro"* e
 * *"erros: instante no passado"*. Nenhuma das duas metades dessa linha existe no
 * sistema analisado:
 *
 * - **nao ha operacao de agendar.** UC-04 e literal no gatilho — *"o autor salva
 *   conteudo publicado com data no futuro — nao ha comando 'agendar'"* — e
 *   ADR-0005 recusa a alternativa pelo nome (*"`future` como transicao
 *   explicita"*, descartada);
 * - **instante no passado nao e erro: e publicacao imediata.** E o que CA-6.2
 *   manda (*"Salvar conteudo agendado com data no passado o publica na hora, pela
 *   mesma comparacao"*), o que UC-04 repete (*"a conversao e bidirecional e
 *   ninguem a comanda"*) e o que o `elseif` de `:4804` faz.
 *
 * T013 implementou o lado da spec, do caso de uso, do ADR e de BR-MIGRAR-006 —
 * que concordam entre si — e **nao** criou a operacao que erra no passado, porque
 * ela derrubaria CA-6.2. A autoridade para isso esta no proprio `plan.md`, que
 * abre dizendo *"a spec diz **o que** e **por que**; este arquivo diz **como**"* e
 * *"nenhum requisito novo nasce aqui: o que nao estiver na spec nao e requisito,
 * e invencao"*. Fica registrado aqui e no README do modulo, sem ser resolvido:
 * quem revisar a tabela *Contratos* decide se a linha se reescreve.
 */

export {
  FOLGA_DE_AGENDAMENTO_EM_SEGUNDOS,
  TIPO_FORA_DA_COMPARACAO_DE_DATA,
  resolverEstadoPelaData,
  type ConteudoNaComparacaoDeData,
} from './estado-pela-data.js';

export {
  PRIORIDADE_DO_OUVINTE_DE_AGENDAMENTO,
  agendarPublicacaoFutura,
  type EventoDePublicacaoAgendada,
} from './evento-de-publicacao-agendada.js';

export {
  instanteDaDataDoBanco,
  instanteDaDataDoBancoOuZero,
} from './instante-da-data.js';

export {
  PRIORIDADE_DA_VERIFICACAO_DUPLA,
  publicarSeAindaAgendado,
  type ContextoDeAgendamento,
  type DesfechoDaPublicacaoAgendada,
  type ReagendamentoDaPublicacao,
  type ResultadoDaPublicacaoAgendada,
} from './publicacao-agendada.js';
