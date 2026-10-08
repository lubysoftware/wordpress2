/**
 * A chave de opcao em que o termo padrao de um contexto esta gravado, e os tres
 * valores do legado que decidem a regra `P3`.
 *
 * Entrega de **T007** da feature `003-classificacao-do-conteudo` (US-3). A regra
 * e `BR-MIGRAR-003` (`P3`), e a descricao dela e uma frase: *"**Post do tipo
 * `post` sempre tem categoria.** Sem categoria e fora de `auto-draft`, recebe
 * `default_category`; na publicacao a regra se repete para toda taxonomia com
 * termo padrao"*, com ancora em `wp-includes/post.php:4719` e
 * `wp-includes/post.php:5419`. `database/business-rules.md` §3.4 a chama de *"a
 * regra de negocio mais claramente de dominio em todo o modelo de dados"*, e a
 * nota de compatibilidade da propria regra fecha a porta a qualquer atalho:
 * *"inexpressavel em DDL — e codigo nos dois lados"*.
 *
 * ---
 *
 * # SAO DUAS COISAS COM O MESMO NOME, e confundi-las e o erro desta feature
 *
 * `registro/contexto-de-classificacao.ts` ja havia separado as duas em T001, e a
 * separacao e a razao deste arquivo existir:
 *
 * | o que | onde vive | quem o le |
 * |---|---|---|
 * | o argumento `default_term` de `register_taxonomy()` | no **registro**, em {@link ContextoDeClassificacao.rotuloPadrao} — e **nulo nos oito contextos do nucleo** | quem registra, para **criar** o rotulo e gravar o identificador dele na opcao (`taxonomy.php:539`-`:558`) |
 * | a **opcao** com o identificador do rotulo padrao | em `options`, por chave que depende do contexto | a regra `P3`, nos dois caminhos — e e esta que este arquivo nomeia |
 *
 * E por isso que `category` **nao** declara `default_term` e ainda assim tem
 * termo padrao: o padrao dela vive na opcao `default_category`, que o instalador
 * semeia com `1` (`BR-MIGRAR-084`, `DB-SEED`: *"`populate_options()` semeia ~150
 * linhas (incluindo `db_version`, `default_category = 1`, ...)"*), e e por isso
 * que a categoria "Uncategorized" sobrevive a uma instalacao nova.
 *
 * # Nomes de opcao sao superficie publicada
 *
 * As duas chaves abaixo sao lidas e escritas por extensao de terceiro, e o **P8**
 * as poe em contrato absoluto — *"nao remova funcao, constante, tabela, rota,
 * superficie nem comportamento publicado"*. Renomear qualquer uma quebraria
 * codigo que o nucleo nao conhece, e a tabela *Nao negociavel* da constituicao
 * poe *"renomear ou remover ponto de extensao, rota, **opcao**, constante ou
 * funcao publicada"* fora do alcance do agente.
 *
 * # ⚠️ A MESMA FUNCAO EXISTE EM BC-01, e a repeticao e exigida
 *
 * `../../conteudo/publicacao/termo-padrao-na-publicacao.ts` tem
 * `chaveDoTermoPadrao()` com o mesmo corpo e as mesmas duas constantes, porque e
 * ele que monta a chave do laco da publicacao. A duplicacao **nao** e descuido: a
 * regra de dependencia 3 de `target_architecture.md` proibe `contextos/<a>/`
 * importar `contextos/<b>/` por `import` no topo do modulo *"sempre, sem
 * excecao"*, e e a mesma razao pela qual a porta de dados deste contexto repete a
 * de BC-05 (ver `../portas/porta-de-dados.ts`).
 *
 * As duas copias **tem de concordar**, porque as duas montam a chave da **mesma**
 * linha de `options`: um `default_term_category` de um lado e um
 * `default_category` do outro leriam opcoes diferentes. A concordancia esta
 * afirmada por teste em `us-3-termo-padrao.test.ts`, com os valores por extenso.
 */

import { CONTEXTO_DE_CATEGORIA } from '../registro/index.js';

/**
 * `default_category` — a opcao que guarda o termo padrao da categoria
 * (`wp-includes/post.php:4719` e `:5432`).
 *
 * Valor de fabrica `1`, semeado pelo instalador (`BR-MIGRAR-084`). O **P6** cobra
 * que *"cada numero vive num ponto de configuracao nomeado, com o valor de
 * fabrica do legado"* — aqui o numero e dado gravado, nao constante de codigo, e
 * por isso o que mora neste arquivo e a **chave**, nao o `1`: quem le o valor e a
 * colaboracao de opcoes ({@link OpcoesNaClassificacao}), e o valor de fabrica
 * pertence ao instalador. Inventar `1` como default de codigo faria o sistema
 * novo classificar em `1` numa instalacao que gravou outro identificador.
 */
export const OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA = 'default_category';

/**
 * `default_term_` — o prefixo da opcao de qualquer outro contexto
 * (`wp-includes/post.php:5434`).
 *
 * A concatenacao e crua no legado (`'default_term_' . $taxonomy`), sem apelidar
 * nem validar o nome: contexto com nome estranho produz chave de opcao estranha,
 * e e assim que `register_taxonomy()` a grava tambem (`taxonomy.php:543`).
 * Apelidar aqui produziria uma chave que o registro nao escreveu.
 */
export const PREFIXO_DA_OPCAO_DE_TERMO_PADRAO = 'default_term_';

/**
 * `auto-draft` — o estado em que a regra **nao** se aplica, e e **CA-3.3**:
 * *"conteudo em rascunho automatico nao recebe o padrao: ainda nao e conteudo"*.
 *
 * UC-05 o poe na tabela de excecoes com a mesma frase — *"Conteudo e `auto-draft`
 * | o termo padrao nao e aplicado: o registro ainda nao e conteudo"* — e
 * `BR-MIGRAR-003` o cita por nome. A cadeia e comparada por valor nos dois
 * caminhos do legado, e e por isso que ela e constante e nao predicado.
 *
 * ⚠️ **O estado nao e lido daqui: ele chega por argumento.** `posts` e BC-01, e a
 * regra de dependencia 3 proibe a travessia por `import`. Ver
 * {@link PedidoDeTermoPadraoNaGravacao.estado}.
 */
export const ESTADO_DE_RASCUNHO_AUTOMATICO = 'auto-draft';

/**
 * `post` — o *"tipo padrao"* de que **CA-3.4** fala: *"ao fim de qualquer
 * gravacao, nenhum conteudo do tipo padrao esta sem classificacao"*.
 *
 * `BR-MIGRAR-003` o nomeia (*"post do tipo `post`"*), UC-05 repete no fluxo
 * alternativo (*"para o tipo `post` isso significa `default_category`"*) e o
 * comentario do proprio legado, acima do ramo, e *"'post' requires at least one
 * category"*.
 *
 * ⚠️ **E tipo de objeto, nao tipo de conteudo registrado**, e a distincao e a
 * mesma de `../rotulo-e-contexto/tipos-de-objeto-do-contexto.ts`: a comparacao do
 * legado e `'post' === $post_type`, uma igualdade de cadeia, e **nao** uma
 * consulta a `post_type_exists()`. Trocar a igualdade por uma pergunta ao
 * registro de tipos de conteudo (que nao existe nesta arvore) aplicaria a
 * categoria padrao a `page` e a `attachment`, que o legado nao alcanca.
 */
export const TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO = 'post';

/**
 * `0` — o valor de opcao que faz a regra **desistir**, sem emitir comando.
 *
 * E o ramo 4 do laco da publicacao, transcrito por T003 de BC-01 em
 * `../../conteudo/publicacao/termo-padrao-na-publicacao.ts`: *"a opcao vale `0` |
 * `:5436`-`:5437` | salta a taxonomia"*. No legado e
 * `(int) get_option( $chave, 0 )` seguido de `if ( ! $default_term_id )
 * { continue; }`, logo `0` e tambem o valor de **opcao ausente** — e os dois casos
 * terminam no mesmo lugar.
 *
 * O ponto de configuracao nomeado que o **P6** exige e esta constante; o teste de
 * borda (`0` desiste, `1` escreve) esta em `us-3-termo-padrao.test.ts`.
 */
export const SEM_TERMO_PADRAO = 0;

/**
 * A chave de opcao em que o termo padrao daquele contexto esta gravado.
 *
 * E o ramo 3 do laco da publicacao (`post.php:5431`-`:5435`): *"`category` le a
 * opcao `default_category`; o resto le `default_term_{taxonomia}`"*. A escolha
 * entre as duas chaves e **regra deste caminho**, e nao detalhe de quem le opcao
 * — e por isso ela mora aqui e nao na colaboracao, exatamente como BC-01 a
 * manteve fora da porta dele.
 *
 * A assimetria e do legado e e a mesma do ramo 1: `category` e excecao **por
 * nome**, porque o padrao dela e dado de instalacao e nao argumento de registro.
 * O nome vem de `../registro/contextos-do-nucleo.ts`, que e quem o declara.
 */
export function chaveDoTermoPadrao(contexto: string): string {
  return contexto === CONTEXTO_DE_CATEGORIA
    ? OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA
    : `${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}${contexto}`;
}
