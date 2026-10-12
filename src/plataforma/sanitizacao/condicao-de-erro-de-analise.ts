/**
 * A forma da condicao de erro de analise: **o que o analisador do legado
 * reconhece e nao tem como reportar.**
 *
 * Tarefa **T002** da feature `015-plataforma-transversal` — *"as portas
 * declaradas e nenhuma regra implementada"*. `satisfaz: — (infraestrutura)`.
 * US-5 e **T011**; os cinco testes do catalogo (UT-167-1 a UT-167-5) sao
 * **T012**.
 *
 * ---
 *
 * ## O achado, conferido no oraculo
 *
 * A regra de negocio de US-5 diz: *"o analisador de marcacao carrega 50
 * marcadores, a maioria declarando que reconhece a condicao de erro e nao tem
 * como reporta-la. Quem depende de validacao de marcacao nao a tem"*. A
 * contagem fecha, e esta e a conferencia:
 *
 * - `wp-includes/html-api/class-wp-html-processor.php` (a classe comeca em
 *   `:147`) tem **50** marcadores `@todo`;
 * - **29** deles sao a mesma frase literal — `@todo Indicate a parse error once
 *   it's possible` —, e `:2018` e uma delas, no caminho da etiqueta de
 *   fechamento `</template>` que nao casa com a pilha de elementos abertos;
 * - a expressao *"parse error"* aparece **64** vezes nos arquivos de
 *   `wp-includes/html-api/`: o analisador **sabe** onde os erros estao, e segue
 *   adiante.
 *
 * E a consequencia observavel do silencio e o que CA-5.3 manda preservar: *"o
 * conteudo com erro de marcacao continua sendo servido, sem ser reescrito"*. O
 * analisador do legado nao conserta nem recusa — ele reconhece e cala. T011
 * acrescenta o **relato**; nao muda o que e servido.
 *
 * ⚠️ **Isto e acrescimo sob P7, e e o unico caminho autorizado.** O principio:
 * *"registro e diagnostico novos podem ser acrescentados, mas nenhuma decisao do
 * sistema pode passar a depender deles"*. Reportar a condicao e permitido;
 * **recusar** o conteudo por causa dela seria decisao nova, e trocaria o
 * produto.
 */

/**
 * A posicao da condicao no texto analisado, em **bytes**.
 *
 * Bytes e deslocamento, nao linha e coluna: e assim que o analisador do legado
 * marca posicao — `WP_HTML_Span` tem `start` e `length`
 * (`wp-includes/html-api/class-wp-html-span.php:33`, `:42`), e o tokenizador
 * trabalha sobre a string e **edita no lugar**, o que o slot `analise-de-html`
 * do `plan.md` registra como a razao de nao se usar analisador de arvore de
 * terceiro. Converter para linha e coluna e trabalho de quem mostra ao autor
 * (CA-5.2), que e tela e nao analise.
 */
export interface PosicaoNaMarcacao {
  /** Deslocamento inicial, em bytes, a partir do inicio do texto analisado. */
  readonly inicio: number;
  /** Quantos bytes a condicao cobre. */
  readonly tamanho: number;
}

/**
 * O codigo da condicao.
 *
 * ⚠️ **Conjunto aberto, e nao por preguica.** O legado nao tem **nenhum** codigo
 * de condicao de erro: ele tem 29 comentarios dizendo que o relato nao existe. O
 * conjunto do sistema novo e, portanto, trabalho de T011 — e a referencia natural
 * e a nomenclatura da propria especificacao de HTML, que e o que o analisador
 * persegue (`@link https://html.spec.whatwg.org/` no cabecalho da classe,
 * `class-wp-html-processor.php:144`). Fechar a uniao aqui seria escolher esse
 * vocabulario sem o oraculo na mao.
 */
export type CodigoDeCondicao = string;

/**
 * Uma condicao de erro encontrada, com a posicao — que e literalmente o que
 * CA-5.1 pede: *"o analisador de marcacao devolve, junto do resultado, a lista
 * de condicoes de erro que encontrou, com posicao"*.
 */
export interface CondicaoDeErroDeAnalise {
  readonly codigo: CodigoDeCondicao;
  readonly posicao: PosicaoNaMarcacao;
}

/**
 * O resultado da analise: **o resultado e a lista, juntos**.
 *
 * O *"junto do resultado"* de CA-5.1 e a forma: nao e um canal paralelo, nao e
 * uma excecao e nao e um registro que alguem precisa ir buscar. E um par, e a
 * lista vazia e afirmacao — *"nao encontrei condicao nenhuma"*.
 *
 * `marcacao` e o texto **como entrou**. CA-5.3 nao admite reescrita, e por isso
 * o campo nao se chama `marcacaoCorrigida` nem nada parecido: quem analisa
 * devolve o que recebeu.
 */
export interface ResultadoDeAnalise {
  readonly marcacao: string;
  readonly condicoes: readonly CondicaoDeErroDeAnalise[];
}
