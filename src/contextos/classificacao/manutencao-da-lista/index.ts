/**
 * `manutencao-da-lista/` — manter a lista de termos de cada contexto, com
 * hierarquia e contagem de uso.
 *
 * Entrega de **T009** da feature `003-classificacao-do-conteudo` (US-4), e e
 * **UC-08** inteiro menos a protecao do termo padrao, que e US-5. A historia esta
 * em quatro verbos: *"Como editor, quero **criar**, **renomear**, **reorganizar**
 * e **apagar** as classificacoes do site"* — e o segundo deles e de T003
 * (`../rotulo-e-contexto/renomear-rotulo.ts`, CA-1.2), que o portou quando portou
 * a separacao entre rotulo e contexto.
 *
 * | arquivo | o que e |
 * |---|---|
 * | `escopo-de-manutencao-da-lista.ts` | as duas colaboracoes, e por que esta historia **nao** tem escopo proprio |
 * | `caso-de-gestao-de-rotulo.ts` | **CA-4.1** e `UT-036-7`: os **cinco** nomes de capacidade que resolvem para `manage_categories` (`PERM-6`) |
 * | `permissao-na-gestao-de-rotulos.ts` | **CA-4.1**: os portoes da tela de termos, com os `msgid` do legado byte a byte — e os tres portoes que sao de T011 |
 * | `hierarquia-do-rotulo.ts` | **CA-4.2**: a regra de qual pai cada contexto aceita, e o reposicionamento na arvore |
 * | `criar-rotulo-no-contexto.ts` | `wp_insert_term()`: a sequencia que **insere antes de perguntar**, e **CA-4.5** no instante zero |
 * | `apagar-rotulo-do-contexto.ts` | **CA-4.3**, **CA-4.4** e **CA-4.5**: a cascata de `wp_delete_term()`, com `DB-TRG3` e `DB-TRG4` |
 * | `us-4-manutencao-da-lista.test.ts` | os cinco criterios, por efeito no banco, por sequencia de comandos e por **ausencia** de comando |
 *
 * ---
 *
 * # Os cinco criterios, e onde cada um se decide
 *
 * | criterio | onde |
 * |---|---|
 * | CA-4.1 — a tela exige a capacidade que o contexto declara | `permissao-na-gestao-de-rotulos.ts`, sobre `caso-de-gestao-de-rotulo.ts` |
 * | CA-4.2 — hierarquico aceita pai e mantem a arvore; plano recusa hierarquia | `hierarquia-do-rotulo.ts`, usado pelas duas operacoes que escrevem a coluna |
 * | CA-4.3 — apagar termo em uso remove o vinculo e nao apaga o conteudo | `apagar-rotulo-do-contexto.ts`, passo 7 |
 * | CA-4.4 — conteudo que fica sem termo num contexto com padrao recebe o padrao | idem, passo 7, sobre a opcao que `chaveDoTermoPadrao()` monta (T007) |
 * | CA-4.5 — a contagem dos termos afetados fica correta ao fim | a criacao grava `count = 0`; a cascata reconta **por dentro** das operacoes de US-2 (T005) |
 *
 * ⚠️ **Nenhuma destas cinco linhas e uma operacao nova de contagem.** CA-4.5 e
 * CA-2.3 sao a **mesma** coluna e o **mesmo** calculo, e `wp_update_term_count()`
 * ja foi portada em T005 (`../vinculo-de-objeto/contagem-de-uso.ts`), com os tres
 * criterios de `DB-TRG2` e a escolha entre eles. Recontar de fora aqui emitiria
 * comando que o legado nao emite — no legado a recontagem sai **de dentro** de
 * `wp_set_object_terms()` e de `wp_remove_object_terms()`.
 *
 * # Como se confere que esta pasta tem paridade
 *
 * `parity_specs.md` fixa criterio **por area** (Decisao 2), e desta pasta saem
 * tres linhas, nao uma:
 *
 * | o que | criterio |
 * |---|---|
 * | a cascata de exclusao | **efeito no banco** com `@cascata` — a tag e **obrigatoria** em *"exclusao de conteudo e de termo"*, e esta e a exclusao de termo |
 * | `DB-TRG4` | `@invariante`, obrigatoria em *"todo fluxo cujo aggregate tem invariante"*: *"apagar um termo devolve o objeto ao termo padrao, se aquele era o unico"* e a **terceira** das quatro invariantes de `AGG-Termo` em `target_domain_model.md` |
 * | a tela de termos | `@paridade-contrato-de-tela` — `SCR-044 lista-de-termos` esta entre as **99** telas em modo modernizado, e e marcada como **tela critica** |
 *
 * ⚠️ **Nao existe `.feature` de classificacao em `parity_tests/`** e o oraculo
 * executavel do legado **nao existe nesta arvore** (`oracleAvailable: false`;
 * levanta-lo e T001 da feature `015-plataforma-transversal`). E 🔴 **desde T007
 * nem a leitura estatica e possivel aqui**: a instalacao do legado **nao esta no
 * disco desta maquina** — nao ha `wp-includes/taxonomy.php` nem
 * `wp-admin/edit-tags.php` para abrir, e nenhuma varredura encontra
 * `wp-settings.php`.
 *
 * Logo **cada afirmacao desta pasta vem do pacote ou de transcricao merged**, e
 * nunca de memoria. As fontes, uma por uma:
 *
 * | fonte | o que dela veio |
 * |---|---|
 * | `spec.md` US-4 | os cinco criterios e as duas regras de negocio |
 * | `plan.md`, tabela *Contratos* | a entrada, a saida e os erros de *criar ou renomear rotulo* e de *apagar rotulo* |
 * | `UC-08` | o fluxo, a sequencia, os dois fluxos alternativos, as duas excecoes e as pos-condicoes |
 * | `BR-MIGRAR-079` (`DB-TRG3`) e `BR-MIGRAR-080` (`DB-TRG4`) | o reposicionamento no avo e a devolucao ao termo padrao, com as ancoras `:2132` e `:2152` |
 * | `BR-MIGRAR-092` (`PERM-6`) | os cinco nomes de capacidade, com a ancora `capabilities.php:751` |
 * | `target_screens.md`, `SCR-044` | os cinco `msgid` da tela, com a linha de cada um, e as capacidades que ela exige |
 * | `target_domain_model.md` | as quatro invariantes de `AGG-Termo` e os sete comandos dele |
 * | `backlog/tests.md` | os sete casos `UT-036-1` a `UT-036-7` — que sao **T010**, e nao esta tarefa |
 * | T002 e T003, **merged** | as ancoras do corpo de `wp_insert_term()`, de `wp_update_term()` e dos dez passos de `wp_delete_term()`, com a tabela de donos |
 *
 * **O que o pacote nao especifica ficou marcado com 🔴 e tem teste**, em tres
 * lugares: onde o contexto plano recusa a hierarquia
 * (`hierarquia-do-rotulo.ts`), o que a cascata faz com um termo padrao informado
 * que nao existe e o `orderby` da leitura inversa dela
 * (`apagar-rotulo-do-contexto.ts`).
 *
 * # 🔴 A CONSULTA DE TERMOS POR FILTRO NAO ESTA AQUI, e isso vale explicacao
 *
 * A tabela *Contratos* de `plan.md` tem cinco linhas, e uma delas e *"listar
 * rotulos | contexto, filtros | lista com hierarquia e contagem | nenhum"*. **Ela
 * nao foi entregue por esta tarefa**, e a razao esta escrita desde T002, no
 * `README.md` deste modulo:
 *
 * > **Nao transcreveu a consulta de termos por filtro.** Ela e `WP_Term_Query`,
 * > montada **por fragmento com ponto de extensao entre os fragmentos** — e e de
 * > T009 e da camada de dados da feature 015. Uma versao simplificada dela aqui
 * > seria uma segunda consulta de termos **sem** os pontos de extensao, que o P2
 * > poe no contrato publico.
 *
 * As duas metades daquela frase cobram coisas diferentes, e e a segunda que
 * decide: a camada de dados **por fragmento** e **T007 da feature
 * `015-plataforma-transversal`** e nao existe nesta arvore. Sem ela, as duas
 * saidas possiveis sao (a) transcrever uma consulta de termos simplificada,
 * **sem** `terms_clauses` e sem os fragmentos que uma extensao intercepta — o que
 * o **P2** trata como remover ponto de extensao, e a tabela *Nao negociavel* poe
 * fora do alcance do agente —, ou (b) construir a camada de dados de outra
 * feature dentro desta tarefa. **Nenhuma das duas e esta tarefa.**
 *
 * E a ausencia **nao** impede nenhum dos cinco criterios: CA-4.1 a CA-4.5 falam
 * de capacidade, de hierarquia, de cascata, de termo padrao e de contagem — e
 * **nenhum deles e uma leitura filtrada**. A hierarquia e a contagem que o titulo
 * da historia cita sao a coluna `parent` e a coluna `count`, as duas escritas por
 * esta pasta e lidas pela leitura fundida de T002.
 *
 * O que ela **impede**, e esta declarado em cada lugar, sao as tres recusas que
 * passam por ela: nome duplicado no mesmo nivel e apelido duplicado na criacao
 * (`criar-rotulo-no-contexto.ts`) e `missing_parent` na hierarquia
 * (`hierarquia-do-rotulo.ts`). As tres ja estavam declaradas por T003 com o mesmo
 * dono.
 *
 * # O que mais esta pasta nao tem, e de quem e
 *
 * | o que | de quem |
 * |---|---|
 * | a protecao do termo padrao, e os tres portoes de item da tela que passam por ela | **T011**, US-5 (CA-5.1 a CA-5.3) — ver o bloco 🔴 de `apagar-rotulo-do-contexto.ts` |
 * | a consulta de termos por filtro, `term_exists()`, `get_term_by()` e `wp_unique_term_slug()` | feature `015`, T007 — ver o bloco acima |
 * | `sanitize_title()`, e com ela a derivacao do apelido a partir do nome | `plataforma/`, que nao tem o modulo: a ausencia foi declarada por T003 e esta repetida em `criar-rotulo-no-contexto.ts` |
 * | o agrupamento de sinonimos (`alias_of`) | declarado e nao construido: nenhum criterio de US-4 o menciona. Ver a tabela de ausencias de `criar-rotulo-no-contexto.ts` |
 * | a verificacao de laco na arvore (`wp_check_term_hierarchy_for_loops()`) | declarada e nao construida: depende de `wp_find_hierarchy_loop()`, de `plataforma/`. Ver `hierarquia-do-rotulo.ts` |
 * | `termmeta`, e o `meta_input` da criacao | quem portar `termmeta` — a posicao em que a cascata o apaga esta declarada |
 * | o HTML da tela, a resposta HTTP da recusa e o `nonce` das seis acoes | **BC-10** (`plataforma/telas`) e `SCR-112` |
 * | o cache de objeto, o barramento de pontos de extensao e o catalogo de traducao | REQ-165, REQ-162 e a feature 015 |
 */

export {
  CAPACIDADES_DE_GESTAO_DE_ROTULO,
  CAPACIDADE_DE_APAGAR_CATEGORIAS,
  CAPACIDADE_DE_APAGAR_ETIQUETAS,
  CAPACIDADE_DE_EDITAR_CATEGORIAS,
  CAPACIDADE_DE_EDITAR_ETIQUETAS,
  CAPACIDADE_DE_GERENCIAR_CLASSIFICACAO,
  CAPACIDADE_DE_GERENCIAR_ETIQUETAS,
  casoDeGestaoDeRotulo,
} from './caso-de-gestao-de-rotulo.js';

export type {
  ColaboracaoDaExclusaoDeRotulo,
  ColaboracaoDaGestaoDaLista,
} from './escopo-de-manutencao-da-lista.js';

export {
  MENSAGENS_DA_TELA_DE_ROTULOS,
  permissaoDeCriarRotulo,
  permissaoDeGerenciarRotulos,
  type MotivoDaRecusaDaTelaDeRotulos,
  type RecusaDaTelaDeRotulos,
  type ResultadoDaGestaoDaLista,
} from './permissao-na-gestao-de-rotulos.js';

export {
  paiAceitoNoContexto,
  reposicionarRotuloNaHierarquia,
  type PedidoDeReposicionamento,
  type ResultadoDoReposicionamento,
} from './hierarquia-do-rotulo.js';

export {
  criarRotuloNoContexto,
  type PedidoDeCriacaoDeRotulo,
  type ResultadoDaCriacaoDeRotulo,
} from './criar-rotulo-no-contexto.js';

export {
  apagarRotuloDoContexto,
  type PedidoDeExclusaoDeRotulo,
  type ResultadoDaExclusaoDeRotulo,
} from './apagar-rotulo-do-contexto.js';
