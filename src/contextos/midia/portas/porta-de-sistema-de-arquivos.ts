/**
 * Porta de sistema de arquivos do modulo de midia (BC-04).
 *
 * Terceira das cinco bordas de AD-08 (`target_architecture.md`), e a borda que
 * define esta feature: *"a area de envios e a porta `sistema-de-arquivos`, e
 * ela tem quatro implementacoes no legado (direta, e tres remotas)"*
 * (`plan.md`, secao Modelo de dados). O slot escolhido para este no e
 * `fs-mais-ssh2-e-ftp` — sistema de arquivos do runtime, com biblioteca de SSH2
 * e de FTP —, e a razao registrada em `tech-stack.json` e que *"e o unico
 * candidato que mantem os quatro caminhos que a tela de credencial do produto
 * oferece, e reduzir para um e mudanca observavel que nenhuma das 23 respostas
 * autoriza"*. As quatro implementacoes vivem em `adaptadores/`; aqui so a forma.
 *
 * **Nenhuma operacao lanca excecao: a falha volta como valor, com a mensagem do
 * sistema de arquivos.** Tres fontes mandam isso, e as tres pelo mesmo motivo
 * observavel:
 *
 * - CA-1.5 de `spec.md`: *"destino nao gravavel devolve erro com a mensagem do
 *   sistema de arquivos, e nenhum registro de anexo e criado"*. A mensagem
 *   atravessa a porta, logo ela e parte do contrato — e no legado ela e literal
 *   (`wp-includes/functions.php:2446`, *"Unable to create directory %s. Is its
 *   parent directory writable by the server?"*).
 * - O P7 da constituicao preserva o modo de falha **inclusive o silencio**, e
 *   `M4`/BR-MIGRAR-060 e o silencio desta feature: cinco pontos do
 *   processamento tem `// TODO: Log errors.` e nenhum registra nada. Uma porta
 *   que lancasse obrigaria o chamador a tratar o que o legado ignora, e o
 *   cenario `@divida-herdada` de `parity_tests/14-ingestao-e-derivadas-de-midia.feature`
 *   cobra que *"nenhuma das duas avisa o ator"*.
 * - AD-09: o adaptador **reproduz** o modo de falha do legado, que silencia com
 *   `@` na frente da chamada (`@scandir`, `@move_uploaded_file`, `@copy`).
 *
 * **Nenhuma operacao escreve registro.** Observabilidade nova e permitida pelo
 * P7, mas *"nenhuma decisao do sistema pode passar a depender dela"* — e aqui o
 * risco e concreto: se a porta registrasse, o silencio de `M4` deixaria de ser
 * silencio. Quem quiser registro poe no adaptador, so como escrita.
 *
 * Os metodos sao sincronos por AD-04: a fronteira de `await` fica em
 * `adaptadores/`.
 *
 * **O que esta porta NAO faz, de proposito:**
 *
 * - **Nao resolve nome de arquivo.** Nem o `-{largura}x{altura}` da derivada,
 *   nem o `-scaled` da copia reduzida, nem o sufixo de colisao de CA-1.4. Nome
 *   de arquivo e **endereco publico** e por isso e regra de dominio, nao da
 *   borda; e o sufixo da copia reduzida e **pergunta em aberto** da `spec.md`
 *   (*"ninguem decidiu se o sufixo e contrato"*). A porta recebe o caminho ja
 *   decidido, para que a decisao caiba num lugar so quando ela for tomada.
 * - **Nao organiza a area de envios por ano e mes.** A organizacao e regra
 *   dirigida pela opcao `uploads_use_yearmonth_folders` (semeada em `1`,
 *   `wp-admin/includes/schema.php:470`), e opcao se le pela porta de dados.
 *   Daqui sai so a raiz, que e fato da borda.
 * - **Nao tem operacao de varredura da area de envios em busca de orfao.** A
 *   `spec.md` registra que US-8 (REQ-063) *"cria comportamento que o legado nao
 *   tem"* e que ninguem decidiu se e melhoria deliberada. {@link
 *   PortaDeSistemaDeArquivos.listar} existe por outro motivo, declarado nela.
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
   * Caminho absoluto da raiz da area de envios (o `basedir` de
   * `wp_upload_dir()`, `wp-includes/functions.php:2404`).
   *
   * Esta na porta porque e fato da borda, nao regra — o mesmo lugar que o
   * prefixo de tabela ocupa na porta de dados. E vale registrar o que a analise
   * apurou: a area de envios **nao existe** na arvore analisada (lacuna L5 de
   * `soul.md`), e `plan.md` conclui que ela *"nasce vazia"*. Nenhuma afirmacao
   * sobre arquivo real desta instalacao foi possivel em nenhuma etapa.
   */
  readonly raizDeEnvios: string;

  /**
   * Existe algo neste caminho (o `file_exists()` do legado).
   *
   * **Nao devolve falha, devolve booleano**, porque e assim que o legado a usa:
   * `wp_unique_filename()` decide o sufixo de colisao com ela
   * (`wp-includes/functions.php`, laco de `_wp_check_existing_file_names`), e
   * uma falha de leitura ali e indistinguivel de "nao existe" para o legado.
   */
  existe(caminho: string): boolean;

  /** E uma pasta (o `is_dir()` do legado). Booleano pelo mesmo motivo acima. */
  ehPasta(caminho: string): boolean;

  /**
   * O processo consegue escrever aqui (o `is_writable()` do legado).
   *
   * Booleano, e nao resultado com mensagem: a mensagem de CA-1.5 nasce de
   * {@link criarPasta} e de {@link escrever}, que sao as operacoes que
   * efetivamente falham. Perguntar antes e conveniencia; o legado tambem
   * pergunta antes e ainda assim trata a falha da escrita.
   */
  gravavel(caminho: string): boolean;

  /**
   * Cria a pasta e as intermediarias que faltarem (o `wp_mkdir_p()`,
   * `wp-includes/functions.php:2050`).
   *
   * E desta operacao que sai a mensagem de CA-1.5 quando a area de envios nao
   * pode ser criada.
   */
  criarPasta(caminho: string): OperacaoDeArquivo;

  /** Grava bytes no caminho, criando o arquivo ou substituindo o que havia. */
  escrever(caminho: string, conteudo: Uint8Array): OperacaoDeArquivo;

  /** Le os bytes do arquivo. */
  ler(caminho: string): LeituraDeArquivo<Uint8Array>;

  /**
   * Move o arquivo (o `move_uploaded_file()`/`rename()` do legado,
   * `wp-admin/includes/file.php:1021`).
   *
   * **Nao sobrescreve nada por conta propria:** quem resolve colisao e a regra
   * de CA-1.4, antes de chamar. O legado faz a mesma divisao — resolve o nome
   * em `wp_unique_filename()` e so depois move.
   */
  mover(origem: string, destino: string): OperacaoDeArquivo;

  /**
   * Copia o arquivo (o `@copy()` do legado, `wp-admin/includes/file.php:1025`).
   *
   * Existe ao lado de {@link mover} porque o legado usa as duas e o comentario
   * dele diz por que: *"Use copy and unlink because rename breaks streams"*.
   * Qual das duas cada caminho usa e decisao de quem porta o caminho, nao da
   * porta.
   */
  copiar(origem: string, destino: string): OperacaoDeArquivo;

  /**
   * Apaga o arquivo (o `unlink()`/`wp_delete_file()` do legado).
   *
   * **Isto e definitivo, e e definitivo de proposito.** `R3`
   * (BR-MIGRAR-032) e a resposta 9 de `questions.md`: apagar midia nao tem
   * lixeira e nao tem aviso, e `REQ-051`, que pedia o contrario, esta em
   * `do-not-rewrite.md`. Nenhuma guarda nova entra nesta porta.
   */
  apagar(caminho: string): OperacaoDeArquivo;

  /**
   * Lista os nomes contidos na pasta, sem `.` e sem `..`.
   *
   * **Nao existe para varrer orfao** — existe porque o legado lista a pasta de
   * destino para resolver colisao de nome: `wp_unique_filename()` chama
   * `@scandir( $dir )` (`wp-includes/functions.php:2712`), remove os dois nomes
   * de ponto e usa a **contagem** como limite do laco que gera o sufixo. Sem
   * esta operacao, CA-1.4 nao e portavel com a mesma sequencia de nomes que o
   * cenario de paridade cobra (*"a sequencia de nomes gerada e identica nas
   * duas"*).
   *
   * A falha volta como valor porque no legado ela e **silenciada** pelo `@` e
   * tratada como lista vazia, que leva o limite do laco ao valor fixo de
   * fallback. Quem portar CA-1.4 tem de poder reproduzir isso, e para isso
   * precisa distinguir "pasta vazia" de "falha ao listar".
   */
  listar(pasta: string): LeituraDeArquivo<readonly string[]>;
}
