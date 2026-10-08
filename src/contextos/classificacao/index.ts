/**
 * Modulo de classificacao — BC-02 de `target_architecture.md`.
 *
 * Feature `003-classificacao-do-conteudo`, tarefas T001, T002, T003, T005, T007 e
 * T009. O que existe aqui e o que as seis entregam: o modulo carrega com a porta
 * de dados declarada, com os oito contextos de classificacao do nucleo
 * registrados, com a forma de armazenamento de rotulo, contexto e juncao, com **a
 * separacao entre rotulo e contexto** (US-1, em `./rotulo-e-contexto/`), com **a
 * classificacao do conteudo** (US-2, em `./vinculo-de-objeto/`), que e a
 * primeira historia desta feature a escrever na juncao, com **o termo padrao do
 * contexto** (US-3, em `./termo-padrao/`), que e a regra `P3`, e com **a
 * manutencao da lista** (US-4, em `./manutencao-da-lista/`), que fecha os sete
 * comandos de `AGG-Termo`. A proibicao de apagar o padrao (US-5) entra em T011. A
 * leitura obrigatoria de cada uma esta em `./README.md`.
 *
 * BC-02 e a fusao de `taxonomias-e-termos` com `links-e-bookmarks`, e
 * `target_architecture.md` chama a fusao de *"contraintuitiva e necessaria"*:
 * `term_relationships.object_id` e polimorfico e serve `posts` **e** `links`, e
 * separa-los *"deixaria a coluna polimorfica sem dono"*. E por isso que
 * `link_category` esta entre os oito contextos registrados aqui.
 *
 * Duas coisas que este arquivo faz de proposito:
 *
 * - **Nao guarda estado de modulo.** `BR-MIGRAR-105` (`EXT-CONTEXTO`) poe
 *   identidade, consulta corrente e conexao no escopo da REQUISICAO, e a
 *   dimensao **D-A** de `parity_specs.md` da nome ao risco. Aqui isso alcanca o
 *   registro de contextos: no legado `$wp_taxonomies` e uma `global` mutavel por
 *   extensao, e um mapa no escopo deste modulo cruzaria os contextos de duas
 *   requisicoes concorrentes. Por isso as portas chegam por argumento e o
 *   registro nasce **dentro** de {@link criarModuloDeClassificacao}: duas
 *   composicoes nao se enxergam.
 * - **Nao resolve nada no carregamento.** O modulo nao le relogio, nao consulta
 *   dados e nao escreve nada ao ser criado — registrar os oito contextos e
 *   trabalho em memoria, sobre declaracao em codigo, sem tocar a porta. A ordem
 *   de arranque e contrato publico (`BR-MIGRAR-106`, `EXT-ORDEM`), e trabalho
 *   feito na importacao e trabalho fora da ordem.
 */

import {
  criarArmazenamentoDeClassificacao,
  type ArmazenamentoDeClassificacao,
} from './armazenamento/index.js';
import type { PortaDeDados } from './portas/index.js';
import {
  criarRegistroComOsContextosDoNucleo,
  type ContextoDeClassificacao,
  type RegistroDeContextos,
} from './registro/index.js';
import {
  contextoAceitaTipoDeObjeto,
  contextosDoTipoDeObjeto,
  nomesDosContextosDoTipoDeObjeto,
  obterTermo,
  renomearRotulo,
  type EscopoDeRotuloEContexto,
  type PedidoDeRenomeacao,
  type ResultadoDaRenomeacao,
  type RotuloLido,
} from './rotulo-e-contexto/index.js';
import {
  aplicarTermoPadraoNaGravacao,
  criarClassificacaoNaPublicacao,
  type AplicacaoDoTermoPadrao,
  type ClassificacaoNaPublicacao,
  type ColaboracaoDoTermoPadrao,
  type ColaboracaoDoTermoPadraoSemAtor,
  type PedidoDeTermoPadraoNaGravacao,
} from './termo-padrao/index.js';
import {
  classificarConteudo,
  recontarUsoDosRotulos,
  removerVinculosDoObjeto,
  substituirVinculosDoObjeto,
  type ColaboracaoDaClassificacao,
  type ColaboracaoDoVinculo,
  type EscopoDeVinculoDeObjeto,
  type PedidoDeClassificacao,
  type PedidoDeRemocaoDeVinculo,
  type PedidoDeVinculo,
  type ResultadoDaClassificacao,
  type ResultadoDaRemocaoDeVinculo,
  type ResultadoDoVinculo,
} from './vinculo-de-objeto/index.js';
import {
  criarRotuloNoContexto,
  permissaoDeCriarRotulo,
  permissaoDeGerenciarRotulos,
  reposicionarRotuloNaHierarquia,
  type ColaboracaoDaGestaoDaLista,
  type PedidoDeCriacaoDeRotulo,
  type PedidoDeReposicionamento,
  type ResultadoDaCriacaoDeRotulo,
  type ResultadoDaGestaoDaLista,
  type ResultadoDoReposicionamento,
} from './manutencao-da-lista/index.js';

export * from './portas/index.js';
export * from './registro/index.js';
export * from './armazenamento/index.js';
export * from './rotulo-e-contexto/index.js';
export * from './vinculo-de-objeto/index.js';
export * from './termo-padrao/index.js';
export * from './manutencao-da-lista/index.js';

/**
 * A porta de que este modulo depende, na forma em que ele a recebe.
 *
 * E uma so, e continua sendo uma depois de T002, T003, T005 e **T007**: as tres
 * estruturas de armazenamento leem e gravam **por ela**, e nenhuma outra borda
 * entrou. A razao de nao haver porta de cache nem de serializacao esta em
 * `portas/index.ts`.
 *
 * ⚠️ **T007 nao acrescentou a "porta de opcoes" que T001, T003 e T005
 * anunciaram**, e a razao esta inteira no bloco 🔴 de
 * `termo-padrao/escopo-de-termo-padrao.ts`: AD-08 fixa *"portas somente nas 5
 * bordas"* e nomeia as cinco — *"dados, HTTP, sistema de arquivos, cache de
 * objeto e e-mail"* —, opcao nao e uma delas, `options` e tabela de
 * `plataforma/opcoes/` (que nao existe nesta arvore) e o outro lado da **mesma**
 * chamada ja declarou a leitura como colaboracao e nao como porta
 * (`ClassificacaoNaPublicacao.opcaoDeTermoPadrao`, em BC-01, merged). A opcao
 * `default_category` chega, portanto, por ligacao tardia (AD-10), em
 * {@link OpcoesNaClassificacao}.
 */
export interface PortasDeClassificacao {
  readonly dados: PortaDeDados;
}

/*
 * ⚠️ **T009 tampouco acrescentou porta, e a conta segue uma.** A manutencao da
 * lista precisa de tres coisas que nao estao no banco deste contexto — a decisao
 * de capacidade, a opcao do termo padrao do contexto e as duas contagens que
 * atravessam `posts` — e nenhuma delas virou porta. A primeira e
 * `plataforma/autorizacao/`, e a regra de dependencia 1 permite o `import`; as
 * outras duas chegam por ligacao tardia (AD-10), em `OpcoesNaClassificacao` e em
 * `ConteudoNaClassificacao`, que T007 e T005 ja declararam. Ver
 * `manutencao-da-lista/escopo-de-manutencao-da-lista.ts`.
 */

/*
 * ⚠️ **T005 nao acrescentou porta, e isso merece uma linha.** US-2 precisa de
 * tres coisas que nao estao no banco deste contexto — `post_type_exists()` e as
 * duas contagens que atravessam `posts` — e nenhuma delas virou porta: AD-08 poe
 * portas somente nas cinco bordas, e AD-10 manda resolver chamada entre
 * contextos **no momento da chamada**. Elas chegam por argumento, na forma de
 * `ConteudoNaClassificacao`, declarada em
 * `./vinculo-de-objeto/escopo-de-vinculo-de-objeto.ts` e implementada em BC-01 —
 * a imagem espelhada de `ClassificacaoNaPublicacao`, que BC-01 declara e este
 * modulo implementa.
 */

/**
 * O modulo carregado.
 *
 * A superficie cresce **uma historia por vez**: cada tarefa acrescenta aqui a
 * sua operacao — as cinco da tabela *Contratos* de `plan.md` —, com a declaracao
 * explicita de permissao que o **P4** da constituicao exige, e nenhuma antes da
 * propria tarefa. Com T003 fechada entraram as cinco de US-1; com T005, as
 * **quatro** de US-2 — e so uma delas verifica capacidade, porque so uma delas
 * corresponde a um ponto em que o legado verifica; com **T007**, **uma** de US-3
 * ({@link ModuloDeClassificacao.aplicarTermoPadraoNaGravacao}) mais a fabrica da
 * colaboracao que BC-01 consome, que **nao** e operacao; e com **T009**,
 * **quatro** de US-4 — duas de permissao, que **verificam**, e duas de escrita,
 * que declaram sem verificar.
 *
 * O armazenamento **nao e operacao**, e por isso nao declara permissao: ele nao
 * decide nada. Quem decide e a historia que o chama.
 *
 * ⚠️ **DUAS pecas da cascata de exclusao ficam de fora desta superficie de
 * proposito**, e as duas pelo mesmo motivo:
 *
 * - `removerRotuloDoContexto()` (T003), que e o **trecho final** de
 *   `wp_delete_term()` (`wp-includes/taxonomy.php:2200`-`:2216`) e e onde
 *   **CA-1.3** se decide;
 * - `apagarRotuloDoContexto()` (**T009**), que e a **cascata inteira** —
 *   `DB-TRG3`, `DB-TRG4` e as contagens, onde **CA-4.3**, **CA-4.4** e metade de
 *   **CA-4.5** se decidem.
 *
 * As duas sao exportadas pelo modulo e **nenhuma e operacao**. T003 escreveu a
 * razao em duas partes — *"sem a protecao do termo padrao (US-5, T011) e sem a
 * cascata (US-4, T009), publica-la criaria um caminho de apagar dado que o legado
 * **nao expoe**"* —, e **T009 fechou a segunda parte e nao a primeira**: a
 * protecao do termo padrao e `CA-5.1` e `CA-5.2`, criterios de **T011**, cuja
 * linha em `tasks.md` depende desta. Publicar agora exporia um caminho que destroi
 * a categoria padrao, e a tabela *Nao negociavel* da constituicao poe *"apagar
 * dado"* fora do alcance do agente. As razoes inteiras estao nos blocos 🔴 de
 * `rotulo-e-contexto/remover-rotulo-do-contexto.ts` e de
 * `manutencao-da-lista/apagar-rotulo-do-contexto.ts` — o segundo com a
 * consequencia concreta que T011 fecha com um `if`.
 */
export interface ModuloDeClassificacao {
  readonly nome: 'classificacao';
  readonly portas: PortasDeClassificacao;
  /**
   * Os contextos desta requisicao, com os oito do nucleo ja dentro.
   *
   * E **mutavel de proposito**: `register_taxonomy()` e API publica e uma extensao
   * registra contexto em execucao (P2, P8). O que nao e compartilhado e o
   * registro entre composicoes — ver o cabecalho.
   */
  readonly contextos: RegistroDeContextos;
  /**
   * A forma de armazenamento de rotulo, contexto e juncao (T002). Le e grava
   * **somente** pela porta de dados.
   */
  readonly armazenamento: ArmazenamentoDeClassificacao;

  /**
   * Le um rotulo, opcionalmente dentro de um contexto — `get_term()` sobre
   * `WP_Term::get_instance()` (US-1, T003, **CA-1.1**).
   *
   * **Permissao exigida: nenhuma**, e isso e leitura do legado, nao economia:
   * `get_term()` nao verifica capacidade, e e chamada em pagina publica sem
   * ninguem autenticado. Quem cobra e a tela de termos (`manage_terms`,
   * `wp-admin/edit-tags.php:26`), que e **CA-4.1**, de T009.
   *
   * As quatro saidas — a linha do contexto pedido, a linha unica,
   * `ambiguous_term_id` e `invalid_taxonomy` — estao em
   * `rotulo-e-contexto/resolucao-do-rotulo-no-contexto.ts`, com o inventario de
   * por que o rotulo compartilhado e, no legado de hoje, dado herdado.
   */
  obterTermo(rotuloId: number, contexto?: string): RotuloLido;

  /**
   * Os contextos registrados que se aplicam ao tipo de objeto —
   * `get_object_taxonomies( $tipo, 'objects' )` (US-1, T003, **CA-1.4**).
   *
   * **Permissao exigida: nenhuma** — le o registro desta requisicao, nao o
   * banco. A ordem e a de registro, e ela e dado: ver
   * `rotulo-e-contexto/tipos-de-objeto-do-contexto.ts`.
   */
  contextosDoTipoDeObjeto(
    tipoDeObjeto: string | readonly string[],
  ): readonly ContextoDeClassificacao[];

  /**
   * Os **nomes** dos mesmos contextos — `get_object_taxonomies( $tipo )`, o
   * default `$output = 'names'` (US-1, T003, **CA-1.4**).
   *
   * **Permissao exigida: nenhuma.** As duas formas entram porque as duas sao
   * contrato publico da mesma funcao do legado (P8).
   */
  nomesDosContextosDoTipoDeObjeto(
    tipoDeObjeto: string | readonly string[],
  ): readonly string[];

  /**
   * Se aquele tipo de objeto aceita vinculo naquele contexto —
   * `is_object_in_taxonomy()` (US-1, T003, **CA-1.4**).
   *
   * **Permissao exigida: nenhuma**, e a **recusa e silenciosa**: devolve `false`
   * e quem perguntou segue adiante sem erro, sem mensagem e sem registro, como
   * em `wp-includes/post.php:5053`. O P7 poe esse silencio no contrato.
   */
  contextoAceitaTipoDeObjeto(tipoDeObjeto: string, contexto: string): boolean;

  /**
   * Renomeia o rotulo, e o nome muda em todos os contextos em que ele serve —
   * o caminho do nome de `wp_update_term()` (US-1, T003, **CA-1.2**).
   *
   * **Permissao declarada: a capacidade que o contexto declara em
   * `capacidades.editarRotulos` (`$tax->cap->edit_terms`), e ela nao e
   * verificada aqui** — porque `wp_update_term()` tambem nao a verifica. Quem
   * cobra e a tela (`wp-admin/edit-tags.php:112`) e a API REST, e o nucleo chama
   * a funcao **sem ator** em `register_taxonomy()` e em `wp_set_object_terms()`.
   * Verificar aqui recusaria o que o legado aceita (P1). A cobranca entra com a
   * superficie: CA-4.1 em T009, e a capacidade de criar termo de CA-2.2 em T005.
   *
   * 🔴 **Ha uma divergencia aberta neste criterio**, e ela esta registrada em
   * `rotulo-e-contexto/renomear-rotulo.ts`, nao resolvida: para um rotulo
   * **compartilhado** entre dois contextos, o legado **divide** o rotulo antes
   * de renomear (`_split_shared_term()`) em vez de propagar o nome. As duas
   * leituras coincidem em tudo que uma instalacao nova alcanca.
   */
  renomearRotulo(pedido: PedidoDeRenomeacao): ResultadoDaRenomeacao;

  /**
   * Classifica um conteudo num contexto declarado para o tipo dele — o bloco de
   * classificacao de `wp_insert_post()` (US-2, T005, **CA-2.4** e o portao de
   * **CA-2.2**).
   *
   * **Permissao exigida: a que o contexto declara em
   * `capacidades.atribuirRotulos` (`$tax->cap->assign_terms`), e ela E
   * verificada** — e a unica operacao deste modulo que verifica capacidade, e
   * verifica porque e aqui que o legado a verifica
   * (`wp-includes/post.php:5105`). Para `category` e `post_tag` ela resolve para
   * **`edit_posts`**: *"atribuir termo e poder de conteudo, nao de
   * classificacao"* (UC-05).
   *
   * As **tres recusas sao silenciosas** — tipo de objeto nao declarado, contexto
   * nao registrado e capacidade ausente —, como os tres `if` do legado, e o
   * motivo viaja no resultado sem que nenhum ramo do fluxo o consulte (P7).
   */
  classificarConteudo(
    colaboracao: ColaboracaoDaClassificacao,
    pedido: PedidoDeClassificacao,
  ): ResultadoDaClassificacao;

  /**
   * Substitui integralmente os vinculos de um objeto num contexto —
   * `wp_set_object_terms()` (US-2, T005, **CA-2.1**).
   *
   * **Permissao exigida: nenhuma**, e isso e leitura do legado: a funcao nao tem
   * `current_user_can` no corpo e o nucleo a chama **sem ator** — no laco do
   * termo padrao da publicacao (`wp-includes/post.php:5438`) e na fila agendada,
   * onde nao ha ninguem autenticado. Quem cobra capacidade e a camada de cima
   * ({@link ModuloDeClassificacao.classificarConteudo}) e as outras superficies.
   *
   * E **nao** verifica se o contexto se aplica ao tipo do objeto: a guarda e
   * `taxonomy_exists()` e nada mais, porque e assim no legado. Cobrar aqui
   * recusaria classificar um marcador em `link_category`, que e o dono da coluna
   * polimorfica da juncao.
   */
  substituirVinculosDoObjeto(
    colaboracao: ColaboracaoDoVinculo,
    pedido: PedidoDeVinculo,
  ): ResultadoDoVinculo;

  /**
   * Remove vinculos de um objeto num contexto — `wp_remove_object_terms()`
   * (US-2, T005, a outra metade de **CA-2.1**).
   *
   * **Permissao exigida: nenhuma**, pelo mesmo motivo. Ela e API publica (P8) e
   * e chamada de dentro da substituicao, com a diferenca entre o conjunto
   * anterior e o informado.
   *
   * ⚠️ Devolve `false` quando nao havia o que remover, e `false` **nao e erro**:
   * e o `return false` de `wp-includes/taxonomy.php:3110`, que a substituicao
   * recebe e deixa passar.
   */
  removerVinculosDoObjeto(
    colaboracao: ColaboracaoDoVinculo,
    pedido: PedidoDeRemocaoDeVinculo,
  ): ResultadoDaRemocaoDeVinculo;

  /**
   * Recalcula e grava a contagem de uso dos rotulos informados —
   * `wp_update_term_count()` (US-2, T005, **CA-2.3**).
   *
   * **Permissao exigida: nenhuma** — as duas funcoes do legado
   * (`wp_update_term_count()` e `wp_update_term_count_now()`) nao verificam
   * capacidade e sao chamadas de dentro da atribuicao e da remocao, sem ator.
   *
   * Entra na superficie porque e **API publica** (P8) e porque a cascata de
   * T009 e T011 vai chama-la; a escolha entre os tres criterios de `DB-TRG2` e
   * feita aqui dentro, na hora de contar, e nao pelo chamador.
   */
  recontarUsoDosRotulos(
    colaboracao: ColaboracaoDoVinculo,
    rotulosNoContextoIds: readonly number[],
    contexto: string,
  ): boolean;

  /**
   * Aplica o termo padrao do contexto quando nenhum termo e informado, no caminho
   * de **gravacao** — os dois ramos de `wp_insert_post()` que a regra `P3` ocupa
   * (US-3, T007, **CA-3.1**, **CA-3.3** e **CA-3.4**).
   *
   * **Permissao declarada: depende da porta, e a assimetria e do legado.** A
   * categoria do tipo padrao e gravada por `wp_set_post_categories()`
   * (`wp-includes/post.php:5053`), que **nao cobra capacidade nenhuma** — so o
   * portao do tipo de objeto, que e o `if` que guarda a chamada (**CA-2.4**); o
   * termo padrao de qualquer outro contexto e gravado pelo bloco de `tax_input`,
   * que cobra `$tax->cap->assign_terms` (`:5105`) e **recusa em silencio** quem
   * nao a tem. Fundir as duas portas mudaria quem consegue classificar — a
   * analise inteira esta em `termo-padrao/termo-padrao-na-gravacao.ts`.
   *
   * ⚠️ **Em rascunho automatico nao sai comando nenhum** (CA-3.3): o `if` que
   * envolve o laco do legado envolve tambem as leituras, logo nem a juncao nem a
   * opcao sao consultadas. Devolve lista vazia, e a lista vazia e **afirmacao**.
   */
  aplicarTermoPadraoNaGravacao(
    colaboracao: ColaboracaoDoTermoPadrao,
    pedido: PedidoDeTermoPadraoNaGravacao,
  ): readonly AplicacaoDoTermoPadrao[];

  /**
   * Monta o que BC-01 chama no laco do termo padrao da **publicacao** — as quatro
   * perguntas de `wp_publish_post()` a este modulo (US-3, T007, **CA-3.2**).
   *
   * **Nao e operacao e nao declara permissao**, como o `armazenamento`: ela nao
   * decide nada. Quem decide e o laco de BC-01, que esta merged em
   * `../conteudo/publicacao/termo-padrao-na-publicacao.ts` — e **nenhum** dos
   * quatro metodos cobra capacidade, porque o nucleo chama esse laco sem ator.
   *
   * E a imagem espelhada de {@link ConteudoNaClassificacao}: la este modulo
   * declara tres perguntas e BC-01 as responde, aqui BC-01 declara quatro e este
   * modulo as responde. As duas metades existem porque a regra de dependencia 3
   * proibe o `import` entre contextos *"sempre, sem excecao"* (AD-10).
   */
  classificacaoNaPublicacao(
    colaboracao: ColaboracaoDoTermoPadraoSemAtor,
  ): ClassificacaoNaPublicacao;

  /**
   * O portao de entrada da tela de termos — `wp-admin/edit-tags.php:26` (US-4,
   * T009, **CA-4.1**).
   *
   * **Permissao exigida: `$tax->cap->manage_terms`, o
   * `capacidades.gerenciarRotulos` do contexto, e ela E verificada** — e esta e a
   * **segunda** operacao deste modulo que verifica capacidade, ao lado de
   * {@link ModuloDeClassificacao.classificarConteudo}, e pela mesma razao: e aqui
   * que o legado a verifica. Para `post_tag` o nome e `manage_post_tags`, que
   * **resolve** para `manage_categories` pelo caso deste modulo
   * (`manutencao-da-lista/caso-de-gestao-de-rotulo.ts`, `PERM-6`) — sem ele
   * ninguem gerenciaria etiquetas, nem o administrador.
   *
   * ⚠️ **Nao toca o banco**: os tres portoes leem o registro desta requisicao e a
   * matriz que chegou por argumento. UC-08 e literal — a recusa e *"antes de
   * tocar qualquer registro"*.
   *
   * As tres recusas e os `msgid` de cada uma estao em
   * `manutencao-da-lista/permissao-na-gestao-de-rotulos.ts`, transcritos de
   * `target_screens.md` (`SCR-044`) com a linha. Quem renderiza a recusa e a
   * resposta HTTP e **BC-10**, e nao este modulo.
   */
  permissaoDeGerenciarRotulos(
    colaboracao: ColaboracaoDaGestaoDaLista,
    contexto: string,
  ): ResultadoDaGestaoDaLista;

  /**
   * O portao da acao de **criar** rotulo pela tela —
   * `wp-admin/edit-tags.php:86` (US-4, T009, **CA-4.1**).
   *
   * **Permissao exigida: `$tax->cap->edit_terms`, o `capacidades.editarRotulos`
   * do contexto, e ela E verificada.** Para `category` e `edit_categories` e para
   * `post_tag` e `edit_post_tags`, e as duas resolvem para `manage_categories`:
   * em papeis de fabrica isso significa que **autor nao cria categoria**, a
   * consequencia que o bloco 🔴 de
   * `vinculo-de-objeto/rotulos-informados.ts` descreve.
   *
   * ⚠️ E o portao **da tela**, e nao do caminho de atribuir rotulo: T005 deixou
   * registrado que `wp_set_object_terms()` chama `wp_insert_term()` **sem**
   * `current_user_can`, e esta tarefa nao acrescentou portao nenhum la.
   */
  permissaoDeCriarRotulo(
    colaboracao: ColaboracaoDaGestaoDaLista,
    contexto: string,
  ): ResultadoDaGestaoDaLista;

  /**
   * Cria um rotulo num contexto — `wp_insert_term()`
   * (`wp-includes/taxonomy.php:2458`) (US-4, T009, **CA-4.2** e **CA-4.5** no
   * instante zero).
   *
   * **Permissao declarada: `$tax->cap->edit_terms`
   * (`capacidades.editarRotulos`), e ela NAO e verificada aqui** — porque
   * `wp_insert_term()` tambem nao a verifica, e o nucleo a chama **sem ator** de
   * dentro de `wp_set_object_terms()` (`:2896`) e de `register_taxonomy()`
   * (`:539`-`:558`). Verificar aqui recusaria a etiqueta que o legado cria para o
   * autor (P1). Quem cobra e {@link ModuloDeClassificacao.permissaoDeCriarRotulo}.
   *
   * ⚠️ **A sequencia insere antes de perguntar**, e o par devolvido pode ser o de
   * **outro** rotulo: quando a confirmacao de duplicata acusa colisao, o legado
   * apaga as duas linhas que acabou de gravar e devolve o par antigo. As seis
   * etapas, com as tres que um porte faria diferente sem perceber, estao em
   * `manutencao-da-lista/criar-rotulo-no-contexto.ts`.
   */
  criarRotuloNoContexto(
    pedido: PedidoDeCriacaoDeRotulo,
  ): ResultadoDaCriacaoDeRotulo;

  /**
   * Move um rotulo de pai naquele contexto — `wp_update_term()` pelo caminho do
   * `parent`, e o comando `reposicionarNaHierarquia` de `AGG-Termo` (US-4, T009,
   * **CA-4.2**).
   *
   * **Permissao declarada: `$tax->cap->edit_terms`, e ela NAO e verificada
   * aqui** — identica a {@link ModuloDeClassificacao.renomearRotulo}, porque e a
   * **mesma funcao do legado** vista pelo outro argumento. O portao da tela e
   * `wp-admin/edit-tags.php:173`, e ele passa pelo `case` de capacidade sobre o
   * termo, que e **T011** (ver
   * `manutencao-da-lista/permissao-na-gestao-de-rotulos.ts`).
   *
   * ⚠️ Em contexto **plano** o pai informado e **descartado** e a linha fica com
   * `0`. O bloco 🔴 de `manutencao-da-lista/hierarquia-do-rotulo.ts` registra as
   * quatro fontes do pacote que convergem no efeito no banco e divergem sobre o
   * valor devolvido, e por que descartar e o lado que nao decide nada.
   */
  reposicionarRotuloNaHierarquia(
    pedido: PedidoDeReposicionamento,
  ): ResultadoDoReposicionamento;
}

/**
 * Compoe o modulo sobre a porta recebida, e registra os oito contextos do
 * nucleo.
 *
 * Substitui, no alvo, o que no legado era `create_initial_taxonomies()`
 * chamada a partir de `wp-settings.php` sobre uma `global`
 * (`wp-includes/taxonomy.php:25`). Trocar a porta e passar outra implementacao
 * aqui — sem alterar arquivo deste modulo, que e o criterio de "substituivel"
 * que `BR-MIGRAR-103` (`EXT-SUBST`) propoe.
 *
 * O registro e escrito a mao de proposito: a Lacuna 1 de `pending_decisions.md`
 * fixou *"nenhum framework opinativo... sem container de DI, sem ORM, sem ciclo
 * de vida de framework"*, porque a ordem de arranque do legado e contrato
 * publico e framework com ciclo de vida proprio disputa com ela.
 */
export function criarModuloDeClassificacao(
  portas: PortasDeClassificacao,
): ModuloDeClassificacao {
  const contextos = criarRegistroComOsContextosDoNucleo();
  // Compor o armazenamento monta nome de tabela e nada mais: nenhuma consulta
  // sai daqui, que e o que `EXT-ORDEM` cobra e o que `modulo.test.ts` afirma.
  const armazenamento = criarArmazenamentoDeClassificacao(portas.dados);

  /*
   * O escopo das operacoes de US-1 (T003), fechado sobre ESTA composicao e nao
   * sobre o modulo: e o mesmo motivo pelo qual o registro nasce aqui dentro
   * (`EXT-CONTEXTO`, BR-MIGRAR-105, dimensao D-A de `parity_specs.md`). Duas
   * requisicoes concorrentes tem dois escopos, e nenhuma enxerga o contexto que
   * uma extensao registrou na outra.
   *
   * Ele e deliberadamente mais estreito que o modulo: `rotulo-e-contexto/`
   * **nao recebe a juncao** (`vinculos`), porque US-1 nao escreve nela. Ver
   * `rotulo-e-contexto/escopo-de-rotulo-e-contexto.ts`.
   */
  const escopo: EscopoDeRotuloEContexto = { contextos, armazenamento };

  /*
   * O escopo das operacoes de US-2 (T005), fechado sobre a MESMA composicao.
   *
   * Ele e mais largo que o de US-1 por uma peca so, e e a peca da historia: a
   * juncao (`vinculos`). O que US-2 **nao** recebe aqui e a colaboracao com BC-01
   * — `post_type_exists()` e as duas contagens que atravessam `posts` —, porque
   * ela e de quem chama e nao desta composicao: chega por argumento em cada
   * operacao, que e o que AD-10 pede para toda chamada entre contextos. Ver
   * `vinculo-de-objeto/escopo-de-vinculo-de-objeto.ts`.
   */
  const escopoDoVinculo: EscopoDeVinculoDeObjeto = { contextos, armazenamento };

  return {
    nome: 'classificacao',
    portas,
    contextos,
    armazenamento,
    obterTermo: (rotuloId, contexto) => obterTermo(escopo, rotuloId, contexto),
    contextosDoTipoDeObjeto: (tipoDeObjeto) =>
      contextosDoTipoDeObjeto(escopo, tipoDeObjeto),
    nomesDosContextosDoTipoDeObjeto: (tipoDeObjeto) =>
      nomesDosContextosDoTipoDeObjeto(escopo, tipoDeObjeto),
    contextoAceitaTipoDeObjeto: (tipoDeObjeto, contexto) =>
      contextoAceitaTipoDeObjeto(escopo, tipoDeObjeto, contexto),
    renomearRotulo: (pedido) => renomearRotulo(escopo, pedido),
    classificarConteudo: (colaboracao, pedido) =>
      classificarConteudo(escopoDoVinculo, colaboracao, pedido),
    substituirVinculosDoObjeto: (colaboracao, pedido) =>
      substituirVinculosDoObjeto(escopoDoVinculo, colaboracao, pedido),
    removerVinculosDoObjeto: (colaboracao, pedido) =>
      removerVinculosDoObjeto(escopoDoVinculo, colaboracao, pedido),
    recontarUsoDosRotulos: (colaboracao, rotulosNoContextoIds, contexto) =>
      recontarUsoDosRotulos(
        escopoDoVinculo,
        colaboracao,
        rotulosNoContextoIds,
        contexto,
      ),
    /*
     * US-3 (T007) reusa o escopo de US-2, e a ausencia de um escopo proprio e
     * afirmacao: no legado o laco do termo padrao **nao grava nada** — ele decide
     * a lista e deixa `wp_set_post_categories()` e o bloco de `tax_input`
     * gravarem. Logo esta historia le o mesmo registro e o mesmo armazenamento, e
     * escreve pelas operacoes de US-2. O que ela acrescenta — a leitura da opcao —
     * **nao** e desta composicao: chega por argumento em cada chamada, que e o que
     * AD-10 pede para toda travessia que sai deste contexto.
     */
    aplicarTermoPadraoNaGravacao: (colaboracao, pedido) =>
      aplicarTermoPadraoNaGravacao(escopoDoVinculo, colaboracao, pedido),
    classificacaoNaPublicacao: (colaboracao) =>
      criarClassificacaoNaPublicacao(escopoDoVinculo, colaboracao),
    /*
     * US-4 (T009) reusa o escopo de US-2, e a ausencia de um escopo proprio e
     * afirmacao: as tres operacoes de manutencao da lista leem o mesmo registro
     * e o mesmo armazenamento, e a cascata de exclusao **escreve pelas operacoes
     * de US-2** — como no legado, em que `wp_delete_term()` chama
     * `wp_set_object_terms()` para cada objeto alcancado
     * (`wp-includes/taxonomy.php:2152`-`:2183`). O que US-4 acrescenta — a
     * decisao de capacidade e a leitura da opcao do termo padrao — **nao** e
     * desta composicao: chega por argumento em cada chamada, que e o que AD-10
     * pede para toda travessia que sai deste contexto. Ver
     * `manutencao-da-lista/escopo-de-manutencao-da-lista.ts`.
     */
    permissaoDeGerenciarRotulos: (colaboracao, contexto) =>
      permissaoDeGerenciarRotulos(escopoDoVinculo, colaboracao, contexto),
    permissaoDeCriarRotulo: (colaboracao, contexto) =>
      permissaoDeCriarRotulo(escopoDoVinculo, colaboracao, contexto),
    criarRotuloNoContexto: (pedido) =>
      criarRotuloNoContexto(escopoDoVinculo, pedido),
    reposicionarRotuloNaHierarquia: (pedido) =>
      reposicionarRotuloNaHierarquia(escopoDoVinculo, pedido),
  };
}
