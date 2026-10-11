/**
 * Porta de sistema de arquivos do modulo de privacidade (BC-06).
 *
 * Tarefa **T001** da feature `008-privacidade-e-dados-pessoais`.
 * `satisfaz: — (infraestrutura)`.
 *
 * Terceira das cinco bordas de AD-08 (`target_architecture.md`), e nesta feature
 * ela e a borda que guarda **dado pessoal em disco**: o arquivo de exportacao
 * vive em `{basedir}/wp-personal-data-exports/`
 * (`wp-includes/functions.php:8507`), por tres dias, num diretorio publicamente
 * acessivel. O slot escolhido para este no e `fs-mais-ssh2-e-ftp`, e as
 * implementacoes vivem em `adaptadores/`; aqui so a forma.
 *
 * **Nenhuma operacao lanca excecao: a falha volta como valor.** E AD-06, a mesma
 * razao da porta de e-mail, e aqui ela tem dois casos lidos do legado:
 *
 * - A geracao do arquivo trata **tres** falhas de disco como mensagem ao ator,
 *   nao como excecao: `wp_mkdir_p()` falhando (`privacy-tools.php:338`),
 *   `fopen()` do arquivo de protecao falhando (`:346`) e a escrita do relatorio.
 * - A varredura trata a **ausencia** como estado normal: se o diretorio nao
 *   existe, a rotina simplesmente retorna (`functions.php:8606`), e o `plan.md`
 *   poe *"arquivo ausente, que e estado tolerado"* na tabela de contratos.
 *
 * **Nenhuma operacao escreve registro.** Observabilidade nova e permitida pelo
 * P7, e *"nenhuma decisao do sistema pode passar a depender dela"*. CA-7.5 pede
 * que *"cada execucao registra quantos arquivos apagou"*, e isso e **contagem
 * devolvida pela operacao de T015**, nao linha escrita por esta porta: quem
 * conta e quem varre.
 *
 * Os metodos sao sincronos por AD-04: a fronteira de `await` fica em
 * `adaptadores/`.
 *
 * ---
 *
 * ## O que esta porta NAO faz, de proposito
 *
 * - **Nao gera nome de arquivo, e nesta feature isso e regra regulatoria.** O
 *   nome e `wp-personal-data-file-` mais 32 caracteres aleatorios
 *   (`privacy-tools.php:353`), e esse trecho aleatorio **e a unica protecao do
 *   arquivo**: UC-27 diz *"a protecao e a imprevisibilidade do nome, nao uma
 *   verificacao de identidade"*, e REQ-092, que exigiria verificacao de
 *   identidade, ficou `bloqueado` e esta nas perguntas em aberto da `spec.md`.
 *   Gerar o nome aqui esconderia a decisao numa borda; ele chega decidido, por
 *   argumento, para que a protecao fique visivel em T011.
 * - **Nao varre nem recursiona.** A varredura do legado e
 *   `list_files( $exports_dir, 100, array( 'index.php' ) )`
 *   (`functions.php:8611`): profundidade 100 e o arquivo de protecao fora da
 *   lista. Os dois numeros sao **regra de T015**, e sao expressaveis com
 *   {@link PortaDeSistemaDeArquivos.listar} mais
 *   {@link PortaDeSistemaDeArquivos.ehPasta}. Embuti-los aqui poria numero do
 *   legado numa borda onde nenhum teste de borda os alcanca, e o P6 pede o
 *   contrario.
 * - **Nao le o arquivo de exportacao de volta.** Nenhuma historia desta feature
 *   le o que escreveu: o titular baixa pelo endereco, que e o servidor web
 *   servindo o diretorio de envios. Acrescentar `ler` seria superficie sem
 *   chamador.
 * - **Nao monta nem comprime o pacote.** O legado grava um `.html` e um `.json`
 *   e os poe num `ZipArchive` (`privacy-tools.php:317`), e o `plan.md` nao
 *   escolhe slot de compressao. A porta recebe bytes; de que formato eles sao e
 *   de T011.
 */

/** Resultado de operacao que nao devolve valor. A falha carrega a mensagem. */
export type OperacaoDeArquivo =
  | { readonly concluido: true }
  | { readonly concluido: false; readonly mensagem: string };

/** Resultado de operacao que devolve valor. A falha carrega a mensagem. */
export type LeituraDeArquivo<V> =
  | { readonly concluido: true; readonly valor: V }
  | { readonly concluido: false; readonly mensagem: string };

export interface PortaDeSistemaDeArquivos {
  /**
   * Caminho absoluto do diretorio de exportacoes — o
   * `trailingslashit( $upload_dir['basedir'] ) . 'wp-personal-data-exports/'` de
   * `wp_privacy_exports_dir()` (`wp-includes/functions.php:8505` e `:8507`).
   *
   * Esta na porta porque e fato da borda, nao regra, como o prefixo de tabela na
   * porta de dados. O legado o resolve por `wp_upload_dir()`, e o filtro
   * `wp_privacy_exports_dir` (`:8518`) e o ponto de extensao que o altera —
   * ponto de extensao e produto (P2), e quem o dispara e quem compoe o modulo.
   */
  readonly raizDeExportacoes: string;

  /**
   * Endereco publico do mesmo diretorio — o `wp_privacy_exports_url()` de
   * `wp-includes/functions.php:8530` e `:8532`, com o filtro proprio em `:8543`.
   *
   * Esta aqui, e nao numa porta de endereco, porque no legado as duas metades
   * saem da **mesma** chamada a `wp_upload_dir()`: `basedir` e `baseurl`.
   * Separa-las criaria a chance de uma instalacao em que o caminho e o endereco
   * apontam para lugares diferentes, que o legado nao tem — e e por este
   * endereco que CA-5.4 entrega o arquivo ao titular, logo ele e observavel.
   */
  readonly enderecoDeExportacoes: string;

  /**
   * Existe algo neste caminho (o `file_exists()` do legado).
   *
   * **Nao devolve falha, devolve booleano**, porque e assim que o legado a usa:
   * o arquivo de protecao so e criado quando `! file_exists( $index_pathname )`
   * (`privacy-tools.php:344`), e ali uma falha de leitura e indistinguivel de
   * "nao existe".
   */
  existe(caminho: string): boolean;

  /**
   * E uma pasta (o `is_dir()` do legado).
   *
   * Booleano pelo mesmo motivo: a varredura desiste quando
   * `! is_dir( $exports_dir )` (`functions.php:8606`), sem distinguir ausencia
   * de falha.
   */
  ehPasta(caminho: string): boolean;

  /**
   * Cria a pasta e as intermediarias que faltarem (o `wp_mkdir_p()`).
   *
   * E desta operacao que sai a primeira das tres mensagens de falha de disco de
   * T011: *"Unable to create personal data export folder."*
   * (`privacy-tools.php:338`).
   */
  criarPasta(caminho: string): OperacaoDeArquivo;

  /** Grava bytes no caminho, criando o arquivo ou substituindo o que havia. */
  escrever(caminho: string, conteudo: Uint8Array): OperacaoDeArquivo;

  /**
   * Apaga o arquivo (o `unlink()` de `functions.php:8629`).
   *
   * **Nao tem guarda, e isso e de proposito.** Apagar o arquivo de exportacao
   * nao tem lixeira e nao tem aviso, e CA-7.4 fixa o que **nao** e apagado: *"a
   * solicitacao continua como prova do procedimento"*. Quem apaga o que e de
   * T015; esta porta nao sabe o que e uma solicitacao.
   */
  apagar(caminho: string): OperacaoDeArquivo;

  /**
   * Lista os nomes contidos na pasta, sem `.` e sem `..`.
   *
   * Plana de proposito: a profundidade 100 e a exclusao do `index.php` sao regra
   * de T015, nao da borda. Ver *O que esta porta NAO faz* no cabecalho.
   *
   * A falha volta como valor porque T015 precisa distinguir "pasta vazia" de
   * "falha ao listar": no legado as duas levam ao mesmo lugar, e reproduzir isso
   * exige poder ver a diferenca para entao ignora-la.
   */
  listar(pasta: string): LeituraDeArquivo<readonly string[]>;

  /**
   * Instante da ultima modificacao do arquivo, em segundos inteiros desde a
   * epoca Unix (o `filemtime()` de `functions.php:8626`).
   *
   * ⚠️ **Esta operacao, e nao o relogio, e metade da conta de idade do arquivo.**
   * A varredura calcula `time() - filemtime( $export_file )` e compara com os
   * tres dias; os dois lados da subtracao vem de bordas diferentes, e e por isso
   * que ela nao mora na porta de relogio.
   *
   * ⚠️ **A falha tem efeito observavel, e T015 tem de reproduzi-lo.** No legado
   * `filemtime()` devolve `false` quando nao consegue ler, `false` vale `0` na
   * subtracao, a idade passa a ser o instante corrente inteiro — maior que
   * qualquer prazo — e o arquivo e **apagado**. Por isso a falha volta como
   * valor em vez de virar excecao ou `0` silencioso: quem portar T015 escolhe
   * tratar a falha como zero **citando esta linha**, e nao por acidente de
   * tipo.
   */
  instanteDeModificacaoEmSegundos(caminho: string): LeituraDeArquivo<number>;
}
