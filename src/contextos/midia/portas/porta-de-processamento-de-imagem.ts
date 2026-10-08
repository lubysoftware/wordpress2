/**
 * Porta de processamento de imagem do modulo de midia (BC-04).
 *
 * **Esta porta e a sexta, e a conta de AD-08 diz cinco. A diferenca esta
 * declarada, nao escondida.** AD-08 de `target_architecture.md` lista dados,
 * HTTP, sistema de arquivos, cache de objeto e e-mail, e o que ela recusa e dar
 * porta ao barramento de hooks, a traducao e ao escape, por custo de indirecao
 * em escala de 13.335 e 3.416 pontos de entrada. O `plan.md` desta feature poe o
 * processamento de imagem no leque de slots justamente por nao estar entre as
 * cinco, e diz por que ele precisa estar: *"`edicao-de-imagem` tem 2
 * implementacoes da mesma interface na arvore — `class-wp-image-editor-gd.php` e
 * `class-wp-image-editor-imagick.php`, com `class-wp-image-editor.php` como base
 * — selecionadas em execucao pelo que a hospedagem tiver. E adaptador sem o
 * nome"*. T001 de `tasks.md` pede esta porta pelo nome. As duas coisas convivem:
 * a borda que AD-08 exige e "mais de uma implementacao presente, que o porte
 * troca de qualquer forma", e esta borda tem duas implementacoes no legado.
 *
 * **O que "identico" significa aqui NAO e byte a byte, e isso e decisao
 * registrada, nao atalho.** O risco 1 de `plan.md` e literal: *"duas
 * bibliotecas produzem arquivos diferentes para a mesma entrada, e 'identico'
 * aqui nao pode significar byte a byte: o teste de paridade precisa comparar
 * dimensao, tipo e nome de arquivo, nao o conteudo binario"*. O contexto do
 * cenario de paridade (`parity_tests/14-ingestao-e-derivadas-de-midia.feature`)
 * fecha o resto: *"um oraculo com o legado na mesma versao e a mesma biblioteca
 * de imagem"*. Por isso cada operacao desta porta devolve **dimensao, tipo e
 * nome**, que e o que se compara, e nunca os bytes.
 *
 * 🔴 **O que esta porta NAO decide, e ninguem decidiu:** a razao da recomendacao
 * deste slot em `tech-stack.json` termina dizendo que *"a decisao que realmente
 * importa neste slot nao e a biblioteca, e declarar se 'identico' para imagem e
 * o arquivo ou a grade de derivadas"*. O risco 1 de `plan.md` propoe a grade; o
 * cenario de paridade compara arquivo por arquivo com a mesma biblioteca nas
 * duas metades. Nao e a mesma afirmacao, e nenhuma tarefa deste pacote a
 * resolve. Esta porta serve as duas leituras: ela devolve o suficiente para
 * comparar a grade, e nao impede comparar arquivo.
 *
 * **A falha volta como valor, nunca como excecao — e o chamador tem o direito
 * de ignora-la.** `M4` (BR-MIGRAR-060) e a regra mais importante desta borda:
 * *"falha ao gerar derivada de imagem e silenciosa"*, e os cinco pontos estao
 * em `wp-admin/includes/image.php:356`, `:359`, `:385`, `:483` e `:492`, todos
 * com `// TODO: Log errors.` e nenhum escrevendo linha. No legado cada operacao
 * devolve `WP_Error`, que e valor, e quem chama joga fora. Uma porta que
 * lancasse tornaria o silencio impossivel de reproduzir, e o P7 da constituicao
 * poe o silencio no contrato.
 *
 * Os metodos sao sincronos por AD-04: a fronteira de `await` fica em
 * `adaptadores/`.
 *
 * **O que esta porta NAO faz, de proposito:** nao gera nome de arquivo. O
 * legado gera (`WP_Image_Editor::generate_filename()`,
 * `wp-includes/class-wp-image-editor.php:435`), e aqui o nome chega decidido —
 * a mesma divisao que a porta de sistema de arquivos faz, e pelo mesmo motivo:
 * nome de arquivo e endereco publico, e o sufixo da copia reduzida e **pergunta
 * em aberto** da `spec.md`. Mover a geracao do nome para o adaptador poria uma
 * regra observavel atras da troca de biblioteca.
 */

/** Posicao horizontal do recorte, nos tres valores que o legado aceita. */
export type PosicaoHorizontalDeRecorte = 'left' | 'center' | 'right';

/** Posicao vertical do recorte, nos tres valores que o legado aceita. */
export type PosicaoVerticalDeRecorte = 'top' | 'center' | 'bottom';

/**
 * Como o recorte e pedido, na mesma forma que `add_image_size()` aceita
 * (`wp-includes/media.php:312`): `false` redimensiona dentro da caixa, `true`
 * recorta pelo centro, e o par recorta na posicao declarada.
 */
export type Recorte =
  | boolean
  | readonly [PosicaoHorizontalDeRecorte, PosicaoVerticalDeRecorte];

/** Dimensoes em pixel, na mesma forma que `WP_Image_Editor::get_size()`. */
export interface Dimensoes {
  readonly largura: number;
  readonly altura: number;
}

/**
 * O tamanho pedido a {@link ImagemAberta.derivar}.
 *
 * `largura` ou `altura` pode ser `null`, porque no legado pode: o tamanho
 * `medium_large` nasce com altura `0`, e `make_subsize()` converte o ausente em
 * `null` antes de redimensionar (`wp-includes/class-wp-image-editor-gd.php:315`
 * e `:319`). A regra de qual dos dois manda, e o que acontece quando os dois
 * faltam, e de quem porta a geracao de derivadas (T007), nao desta porta.
 */
export interface TamanhoPedido {
  readonly largura: number | null;
  readonly altura: number | null;
  readonly recorte: Recorte;
}

/**
 * O que uma gravacao informa de volta.
 *
 * Sao os campos do arranjo que `WP_Image_Editor::_save()` devolve
 * (`wp-includes/class-wp-image-editor-gd.php:580-595`), e eles sao exatamente o
 * que o metadado da derivada guarda. A forma do metadado e de T002; aqui so o
 * que a borda informa.
 */
export interface ArquivoDeImagemGravado {
  /** Caminho absoluto do arquivo gravado (o `path` do legado). */
  readonly caminho: string;
  /** Nome do arquivo, sem pasta (o `file` do legado). */
  readonly nomeDeArquivo: string;
  readonly largura: number;
  readonly altura: number;
  /** Tipo MIME efetivo da gravacao (o `mime-type` do legado). */
  readonly tipoMime: string;
  /** Bytes em disco (o `filesize` do legado). */
  readonly bytes: number;
}

/** Resultado de operacao que nao devolve valor. A falha carrega o motivo. */
export type OperacaoDeImagem =
  | { readonly concluido: true }
  | { readonly concluido: false; readonly motivo: string };

/** Resultado de operacao que devolve valor. A falha carrega o motivo. */
export type ResultadoDeImagem<V> =
  | { readonly concluido: true; readonly valor: V }
  | { readonly concluido: false; readonly motivo: string };

/**
 * Uma imagem carregada, com as operacoes do editor do legado.
 *
 * O estado e da imagem carregada, nao do modulo: cada {@link
 * PortaDeProcessamentoDeImagem.abrir} devolve um objeto proprio, e duas
 * requisicoes nunca compartilham um (`EXT-CONTEXTO`, BR-MIGRAR-105).
 */
export interface ImagemAberta {
  /** Dimensoes correntes (`WP_Image_Editor::get_size()`). */
  dimensoes(): Dimensoes;

  /** Tipo MIME com que a imagem foi carregada. */
  tipoMime(): string;

  /**
   * Redimensiona **a imagem carregada**, alterando o estado dela
   * (`WP_Image_Editor::resize()`,
   * `wp-includes/class-wp-image-editor-gd.php:185`).
   *
   * E a operacao da reducao na ingestao (US-4) e da transformacao (US-7), nao
   * a da geracao de derivadas: para aquela existe {@link derivar}, e a
   * diferenca entre as duas e comportamento do legado, nao gosto. Ver {@link
   * derivar}.
   */
  redimensionar(
    largura: number | null,
    altura: number | null,
    recorte: Recorte,
  ): OperacaoDeImagem;

  /**
   * Gira a imagem carregada (`WP_Image_Editor::rotate()`,
   * `wp-includes/class-wp-image-editor-gd.php:416`). Altera o estado.
   */
  girar(graus: number): OperacaoDeImagem;

  /**
   * Inverte a imagem carregada (`WP_Image_Editor::flip()`,
   * `wp-includes/class-wp-image-editor-gd.php:448`). Altera o estado.
   */
  inverter(horizontal: boolean, vertical: boolean): OperacaoDeImagem;

  /**
   * Grava a imagem carregada no caminho dado (`WP_Image_Editor::save()`,
   * `wp-includes/class-wp-image-editor-gd.php:494`).
   *
   * O caminho e **obrigatorio** aqui, e no legado e opcional: sem argumento ele
   * gera o nome. A diferenca e de arranjo interno, nao de comportamento
   * observavel — quem chama passa o mesmo nome que o legado geraria —, e existe
   * porque o nome e endereco publico. Ver o cabecalho deste arquivo.
   *
   * `tipoMime` ausente significa "o mesmo com que a imagem foi carregada", que
   * e o default do legado. A conversao de formato na gravacao
   * (`wp_get_image_editor_output_format()`, `wp-includes/media.php:6542`) nao e
   * decidida aqui.
   */
  gravar(
    caminho: string,
    tipoMime?: string,
  ): ResultadoDeImagem<ArquivoDeImagemGravado>;

  /**
   * Gera **uma** derivada a partir da imagem carregada, **sem altera-la**
   * (`WP_Image_Editor::make_subsize()`,
   * `wp-includes/class-wp-image-editor-gd.php:308`).
   *
   * **Por que esta operacao existe ao lado de {@link redimensionar} mais {@link
   * gravar}, que fariam o mesmo:** porque no legado nao fazem. `make_subsize()`
   * redimensiona uma copia e **restaura** o tamanho da imagem carregada no fim
   * (`$this->size = $orig_size`, `:339`), logo as N derivadas saem todas do
   * mesmo estado carregado. Portar a geracao como "redimensiona e grava, uma vez
   * por tamanho" produziria cada derivada a partir da anterior, e cada uma seria
   * uma imagem diferente da do legado — e o cenario de paridade cobra que *"o
   * metadado de cada derivada e identico campo por campo nas duas"*.
   *
   * 🔴 **De qual ARQUIVO a imagem carregada vem, quando houve reducao na
   * ingestao, e um conflito aberto — e esta porta nao o resolve.** Ver a secao
   * *O que T001 encontrou aberto* do `README.md` deste modulo antes de compor
   * T007 ou T009: a `spec.md` (CA-4.3) e o fluxo alternativo de UC-12 afirmam
   * que as derivadas saem da copia reduzida, e a arvore analisada passa o
   * caminho do **original** para `_wp_make_subsizes()`
   * (`wp-admin/includes/image.php:412`), com o comentario de `:337` dizendo que
   * e de proposito. Como esta porta recebe o caminho por argumento, a decisao
   * cabe inteira em quem a chamar — e e por isso que ela cabe aqui sem ser
   * decidida aqui.
   *
   * O resultado nao traz `caminho`, e isso tambem e do legado:
   * `make_subsize()` remove `path` do arranjo antes de devolver (`:342`),
   * porque o que vai para o metadado e o nome, nao o caminho absoluto.
   */
  derivar(
    tamanho: TamanhoPedido,
    caminho: string,
  ): ResultadoDeImagem<Omit<ArquivoDeImagemGravado, 'caminho'>>;
}

export interface PortaDeProcessamentoDeImagem {
  /**
   * Nome da implementacao que respondeu, para o relato de paridade.
   *
   * No legado e a classe escolhida em execucao por `_wp_image_editor_choose()`
   * (`wp-includes/media.php:4417`), e qual delas respondeu muda os bytes
   * gerados. O contexto do cenario de paridade exige *"a mesma biblioteca de
   * imagem"* nas duas metades, e sem este campo nao ha como afirmar que o
   * requisito foi cumprido.
   */
  readonly implementacao: string;

  /**
   * Ha biblioteca de imagem utilizavel neste servidor
   * (`WP_Image_Editor::test()`, `wp-includes/class-wp-image-editor.php:46`, e
   * `wp_image_editor_supports()`, `wp-includes/media.php:4403`).
   *
   * E o que CA-7.6 cobra — *"servidor sem biblioteca de imagem disponivel nao
   * oferece a tela, e informa o motivo"* —, e a resposta e **valor, nao
   * excecao**: UC-12 e UC-13 param sem a biblioteca, e parar e comportamento,
   * nao erro de programacao.
   */
  disponivel(): boolean;

  /**
   * A implementacao presente processa este tipo MIME
   * (`WP_Image_Editor::supports_mime_type()`,
   * `wp-includes/class-wp-image-editor.php:61`).
   *
   * Nao confundir com a lista de tipos permitidos no envio (CA-1.2, CA-1.3,
   * US-9): aquela e regra de dominio e nao mora nesta porta. Esta pergunta e
   * sobre o que a biblioteca sabe abrir.
   */
  suporta(tipoMime: string): boolean;

  /**
   * Carrega o arquivo (o `wp_get_image_editor()`,
   * `wp-includes/media.php:4354`).
   *
   * A falha volta como valor porque no legado volta: a funcao devolve
   * `WP_Error`, e `wp-admin/includes/image.php` trata o caso com um `return`
   * silencioso — *"This image cannot be edited"* — sem avisar ninguem.
   */
  abrir(caminho: string): ResultadoDeImagem<ImagemAberta>;
}
