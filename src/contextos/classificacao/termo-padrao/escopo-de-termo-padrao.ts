/**
 * O que US-3 precisa e que **nao** e porta deste modulo: a leitura da opcao.
 *
 * Entrega de **T007** da feature `003-classificacao-do-conteudo` (US-3). Mesma
 * forma e mesmas razoes de `../vinculo-de-objeto/escopo-de-vinculo-de-objeto.ts`:
 * chega por argumento, nao e estado de modulo (`BR-MIGRAR-105`, `EXT-CONTEXTO`,
 * dimensao **D-A** de `parity_specs.md`), e a colaboracao com o que esta fora
 * deste contexto e resolvida **no momento da chamada** (AD-10).
 *
 * ---
 *
 * # 🔴 POR QUE A OPCAO NAO VIROU PORTA, e isso contraria uma nota de T001
 *
 * Quatro arquivos desta arvore — `../index.ts`, `../rotulo-e-contexto/index.ts`,
 * `../rotulo-e-contexto/escopo-de-rotulo-e-contexto.ts` e
 * `../vinculo-de-objeto/escopo-de-vinculo-de-objeto.ts` — escreveram, em T001, T003
 * e T005, que *"a porta de opcoes chega com T007"*. **Ela nao chegou, e o motivo e
 * uma decisao registrada que esta acima das notas das ondas anteriores:**
 *
 * - **AD-08 de `target_architecture.md`** fixa *"portas somente nas 5 bordas"*, e
 *   as cinco estao nomeadas: *"dados, HTTP, sistema de arquivos, cache de objeto e
 *   e-mail"*. Opcao **nao** e uma delas. A justificativa da decisao e que as cinco
 *   *"sao as unicas que o legado **ja declara substituiveis**, com mais de uma
 *   implementacao presente"*, e `get_option()` nao e substituivel: e funcao do
 *   nucleo sobre a tabela `options`.
 * - **Opcao e dado, e a tabela e de outro dono.** `target_architecture.md` poe
 *   `options` e as quatro familias de metadado em `plataforma/opcoes/` (*"53 de 71
 *   dependentes"*), que e **servico de plataforma** e nao contexto. A regra de
 *   dependencia 1 permitiria o `import` — se o modulo existisse. **Ele nao existe
 *   nesta arvore, e nenhuma tarefa dos 15 `tasks.md` o constroi**, que e a mesma
 *   situacao do barramento de pontos de extensao (`REQ-162`, em
 *   `do-not-rewrite.md`) e do catalogo de traducao.
 * - **A porta de dados deste contexto recusa o atalho por escrito.** Ela declara
 *   um unico `prefixoDeTabela` porque *"as cinco tabelas deste contexto sao todas
 *   por site"*, e fecha com a frase que decide este caso: *"se alguma tarefa desta
 *   feature precisar ler conta ou conteudo, a travessia e por **ligacao tardia**
 *   (AD-10), nao por nome de tabela de outro contexto"*. `options` e tabela de
 *   outro dono pela mesma regra.
 * - **O outro lado da mesma chamada ja escolheu esta forma, e esta merged.**
 *   BC-01 declara `ClassificacaoNaPublicacao.opcaoDeTermoPadrao( chave )` como
 *   **metodo de colaboracao**, nao como porta, e explica por que a chave nao viaja
 *   como parametro de porta: *"a escolha entre `default_category` e
 *   `default_term_{taxonomia}` e regra deste caminho e nao detalhe de quem le
 *   opcao"*. Declarar porta aqui faria a **mesma** leitura ter duas formas
 *   diferentes nos dois lados da mesma regra.
 * - **E e a forma que BC-05 ja usou para o mesmo problema.**
 *   `../../identidade-e-acesso/cadastro/configuracao-de-cadastro.ts` registrou a
 *   doutrina em uma linha: *"ler `users_can_register` e `default_role` do
 *   armazenamento e trabalho do registro de opcoes (`REG-Opcao`), que nao existe
 *   nesta arvore... aqui a opcao e **entrada lida de fora**"*.
 *
 * **O que isto cobra de quem construir `plataforma/opcoes/`:** implementar
 * {@link OpcoesNaClassificacao} sobre `get_option()`, com a coercao para inteiro
 * no lugar em que o legado a faz, e **nada mais** — esta interface tem um metodo
 * so de proposito, e nenhuma operacao desta feature le outra opcao.
 *
 * # O escopo e o de US-2, e isso e afirmacao
 *
 * US-3 **nao tem escopo proprio**: ela le o registro e as quatro pecas do
 * armazenamento, que e exatamente {@link EscopoDeVinculoDeObjeto}, e escreve
 * **pelas operacoes de US-2** — como no legado, em que o laco do termo padrao nao
 * grava nada: ele decide a lista e deixa `wp_set_post_categories()` e o bloco de
 * `tax_input` gravarem (`wp-includes/post.php:5053` e `:5089`). Declarar um
 * escopo gemeo aqui faria duas leituras do mesmo armazenamento divergirem no dia
 * em que uma das duas ganhasse uma peca.
 */

import type {
  ColaboracaoDaClassificacao,
  ColaboracaoDoVinculo,
} from '../vinculo-de-objeto/index.js';

/**
 * A leitura da opcao que guarda o termo padrao, declarada aqui e implementada
 * fora (AD-10, ligacao tardia).
 *
 * **E sincrona**, como todo `contextos/`: AD-04 fixa a fronteira de `await` em
 * `adaptadores/`.
 */
export interface OpcoesNaClassificacao {
  /**
   * `(int) get_option( $chave, 0 )` — o identificador do rotulo padrao gravado
   * naquela chave (`wp-includes/post.php:5432` e `:5434`).
   *
   * A **chave** chega montada, e quem a monta e {@link chaveDoTermoPadrao}: a
   * escolha entre `default_category` e `default_term_{nome}` e regra do caminho
   * do termo padrao, nao detalhe de quem le opcao. E a mesma assinatura, com a
   * mesma razao, que BC-01 declarou em
   * `../../conteudo/publicacao/contexto-de-publicacao.ts`.
   *
   * ⚠️ **Devolve inteiro, e {@link SEM_TERMO_PADRAO} (`0`) e "nao ha padrao"** —
   * o legado nao distingue opcao ausente de opcao com `0`, porque
   * `get_option( $chave, 0 )` devolve o default `0` para a ausente e o `! $id`
   * logo adiante trata os dois igual. Devolver `null` aqui criaria uma distincao
   * que o legado nao tem.
   *
   * 🔴 **Onde a coercao para inteiro acontece no legado nao foi reconferido nesta
   * tarefa, e o limite esta declarado em `termo-padrao-na-gravacao.ts`**: o
   * caminho da publicacao converte antes de testar (`(int) get_option(...)`,
   * transcrito por T003 de BC-01) e o caminho da gravacao e ancorado em
   * `post.php:4719`, cuja linha esta no pacote mas cujo corpo **nao e legivel
   * nesta arvore** — a instalacao do legado nao esta no disco desta maquina. Esta
   * interface fixa a forma que os dois caminhos tem em comum: inteiro, com `0`
   * como "nao ha".
   */
  identificadorDoTermoPadrao(chave: string): number;
}

/**
 * O que **nao** vem da composicao e tem de chegar por chamada no caminho de
 * gravacao: a colaboracao de US-2 **mais** a leitura da opcao.
 *
 * Estende {@link ColaboracaoDaClassificacao} — logo traz o ator e a base da
 * decisao de capacidade — e **a heranca e a regra do legado, nao conveniencia**:
 * o termo padrao de um contexto que nao e `category` e aplicado **pelo bloco de
 * `tax_input`**, que cobra `$tax->cap->assign_terms` antes de gravar
 * (`wp-includes/post.php:5105`). Sem ator nao se decide essa capacidade. A
 * assimetria com o caminho da categoria, que **nao** cobra capacidade nenhuma,
 * esta analisada em `termo-padrao-na-gravacao.ts`.
 */
export interface ColaboracaoDoTermoPadrao extends ColaboracaoDaClassificacao {
  readonly opcoes: OpcoesNaClassificacao;
}

/**
 * A colaboracao do caminho de **publicacao**: a de US-2 mais a opcao, e **sem
 * ator**.
 *
 * Separada da de cima de proposito, e a separacao e o legado: o laco de
 * `wp_publish_post()` grava por `wp_set_post_terms()` (`:5438`), que **nao
 * verifica capacidade nenhuma** e e chamada pelo nucleo sem ninguem autenticado —
 * ver `../vinculo-de-objeto/substituir-vinculos.ts`, secao *"O que esta operacao
 * NAO verifica"*. Pedir ator aqui obrigaria quem publica pela fila agendada a
 * inventar um.
 */
export interface ColaboracaoDoTermoPadraoSemAtor extends ColaboracaoDoVinculo {
  readonly opcoes: OpcoesNaClassificacao;
}
