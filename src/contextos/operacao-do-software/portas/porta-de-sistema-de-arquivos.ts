/**
 * Porta de sistema de arquivos do modulo de operacao do software (BC-11).
 *
 * Terceira das cinco bordas de AD-08 (`target_architecture.md`), e a borda que
 * **existe por causa desta feature**: a decisao fundadora D7 e que este produto
 * se instala, se atualiza e sobrescreve os proprios arquivos em execucao, logo
 * *"o alvo de implantacao e o sistema de arquivos e o pipeline de implantacao e o
 * painel administrativo"* (`spec.md`). O slot do plano e `sistema-de-arquivos`,
 * recomendado como `fs-mais-ssh2-e-ftp`, e a razao registrada em
 * `tech-stack.json` e que *"e o unico candidato que mantem os quatro caminhos que
 * a tela de credencial do produto oferece, e reduzir para um e mudanca
 * observavel que nenhuma das 23 respostas autoriza"*.
 *
 * **O transporte e dado da porta, nao detalhe do adaptador, e e por uma linha
 * so.** `wp-admin/includes/update-core.php:1598` decide com ele:
 * `if ( $check_is_writable && 'direct' === $wp_filesystem->method )` — a
 * conferencia previa de gravabilidade **so acontece no transporte local**, e nos
 * outros tres o legado parte para a copia sem conferir. `$wp_filesystem->method`
 * tambem viaja no relatorio de atualizacao automatica
 * (`wp-admin/includes/class-core-upgrader.php:237`, `'fs_method'`). Esconder o
 * transporte atras da porta apagaria uma ramificacao observavel.
 *
 * **Nenhuma operacao lanca excecao: a falha volta como valor.** Tres fontes
 * mandam isso, e nesta feature as tres convergem no mesmo ponto:
 *
 * - O legado devolve booleano ou `false` em toda operacao de `WP_Filesystem`, e
 *   o chamador decide. `D3` do catalogo e literal sobre o padrao — falha de
 *   negocio e **estado**, nao excecao (AD-06).
 * - CA-5.2 exige que *"o diretorio temporario e limpo em todo caminho de saida,
 *   inclusive no de erro"*, e CA-5.4 que *"reversao que tambem falha e tratada
 *   como falha critica, com registro proprio"*. Quem porta isso tem de poder
 *   **ler** o resultado de cada apagamento: e `! $wp_filesystem->delete( $x,
 *   true )` que distingue a falha critica de `A5` da falha comum
 *   (`wp-admin/includes/class-wp-upgrader.php:472`, `:1289`).
 * - O P7 da constituicao preserva o modo de falha, inclusive o silencio. Nesta
 *   borda o silencio e medido: `maintenance_mode()` apaga e grava o marcador
 *   **sem olhar o retorno de nenhuma das duas chamadas**
 *   (`wp-admin/includes/class-wp-upgrader.php:1034` e `:1035`). Uma porta que
 *   lancasse obrigaria o chamador a tratar o que o legado ignora, e CA-4.4 fala
 *   justamente da manutencao que *"ficou presa"*.
 *
 * **Nenhuma operacao escreve registro.** Observabilidade nova e permitida pelo
 * P7, mas *"nenhuma decisao do sistema pode passar a depender dela"*. Quem
 * quiser registro poe no adaptador, so como escrita.
 *
 * Os metodos sao sincronos por AD-04: a fronteira de `await` fica em
 * `adaptadores/`. Aqui isso e exigencia da propria feature, nao estilo — os
 * passos 5, 6 e 7 de UC-33 (manutencao, copia, saida da manutencao) sao uma
 * sequencia em que o estado intermediario e observavel pelo visitante, e `await`
 * no meio dela muda quando o marcador de manutencao existe.
 *
 * **O que esta porta NAO tem, e cada ausencia tem motivo medido:**
 *
 * - **Nao tem `mover`.** Contado no legado: nas seis fontes do caminho de
 *   atualizacao (`class-wp-upgrader.php`, `class-core-upgrader.php`,
 *   `class-plugin-upgrader.php`, `class-theme-upgrader.php`, `update-core.php`,
 *   `class-wp-automatic-updater.php`) ha 27 `delete`, 4 `copy` e **zero**
 *   `move`. O legado substitui arquivo copiando e apagando, e e essa sequencia
 *   que CA-5.3 reverte. Declarar `mover` convidaria a uma operacao atomica que o
 *   legado nao faz — e a janela entre copiar e apagar e observavel.
 * - **Nao tem as outras 10 operacoes de `WP_Filesystem_Direct`** (`touch`,
 *   `size`, `mtime`, `atime`, `owner`, `group`, `chown`, `chgrp`, `cwd`,
 *   `chdir`). Nenhuma e chamada por este caminho; declara-las seria declarar
 *   superficie que este modulo nao usa. Elas continuam no adaptador, que
 *   implementa a classe inteira — o P8 nao e violado porque nada e removido da
 *   superficie publica: o que se escolhe aqui e o que ESTE contexto consome.
 * - **Nao tem operacao de descompactacao.** `unzip_file()`
 *   (`wp-admin/includes/file.php`) e regra do caminho de instalacao, nao da
 *   borda: ela decide nome de pasta e sobrescrita, e por isso vive na tarefa de
 *   quem porta US-1. Daqui saem as primitivas que ela usa.
 * - **Nao baixa pacote.** O legado baixa pelo transporte HTTP direto para um
 *   arquivo temporario, **sem passar por `WP_Filesystem`** — ver
 *   {@link ./porta-de-cliente-externo.ts}. A assimetria e do legado e esta
 *   registrada la.
 */

/**
 * Os quatro transportes que o legado tem, com os nomes dele.
 *
 * O comentario de `wp-admin/includes/file.php:2272` e a lista fechada: *"Please
 * ensure that this is either 'direct', 'ssh2', 'ftpext', or 'ftpsockets'"*, e
 * `get_filesystem_method()` (`:2271`) escolhe entre eles — `direct` quando o
 * dono do arquivo criado coincide com o dono dos arquivos do produto (`:2305`)
 * ou quando a posse relaxada foi autorizada (`:2313`), e os tres remotos por
 * extensao disponivel (`:2323`, `:2326`, `:2329`).
 *
 * Os nomes ficam em ingles porque sao **valores gravados e publicados**: a
 * constante `FS_METHOD` os aceita como texto (`:2273`) e o filtro
 * `filesystem_method` os devolve. Traduzi-los seria renomear contrato publico, e
 * isso esta na tabela *Nao negociavel* da constituicao.
 */
export type TransporteDeArquivo = 'direct' | 'ssh2' | 'ftpext' | 'ftpsockets';

/** O unico transporte que nao sai da maquina. */
export const TRANSPORTE_LOCAL: TransporteDeArquivo = 'direct';

/**
 * As credenciais que a tela de coleta do produto oferece, nos campos do legado
 * (`wp-admin/includes/file.php`, `request_filesystem_credentials()`).
 *
 * ⚠️ **O que se grava e MENOS do que o que se usa, e isso e observavel.** O
 * legado monta uma copia, concatena a porta no nome do host *"to simplify above
 * code"* e remove senha, porta, chave privada e chave publica antes de gravar
 * em `ftp_credentials` (`wp-admin/includes/file.php:2491` a `:2503`). A
 * diferenca entre o que atravessa esta porta e o que a opcao guarda e de quem
 * porta US-1 e US-5 (CA-5.5), nao desta interface.
 */
export interface CredenciaisDeArquivo {
  readonly hostname: string;
  readonly username: string;
  readonly password: string | null;
  readonly publicKey: string | null;
  readonly privateKey: string | null;
  /** `ftp`, `ftps` ou `ssh`, como o formulario do produto os nomeia. */
  readonly connectionType: string | null;
  readonly port: number | null;
}

/**
 * O resultado de abrir o transporte.
 *
 * A falha carrega **lista** de mensagens, e nao uma, porque no legado ela e um
 * `WP_Error` que ACUMULA: `fs_connect()` le
 * `$wp_filesystem->errors->has_errors()` e devolve o objeto inteiro para a tela
 * de credencial redesenhar com ele (`class-wp-upgrader.php:245` a `:252`). Uma
 * mensagem so perderia o que o ator ve.
 */
export type ResultadoDaConexao =
  | { readonly conectado: true }
  | { readonly conectado: false; readonly mensagens: readonly string[] };

/** Resultado de operacao que nao devolve valor. A falha carrega a mensagem. */
export type OperacaoDeArquivo =
  | { readonly concluido: true }
  | { readonly concluido: false; readonly mensagem: string };

/** Resultado de operacao que devolve valor. A falha carrega a mensagem. */
export type LeituraDeArquivo<V> =
  | { readonly concluido: true; readonly valor: V }
  | { readonly concluido: false; readonly mensagem: string };

/**
 * Uma entrada de pasta, com os tres campos que este caminho le.
 *
 * O `dirlist()` do legado devolve doze campos por entrada
 * (`class-wp-filesystem-direct.php:653`), e o caminho de atualizacao usa
 * **tres**: a chave do mapa (o nome), `type` (`'d'` ou `'f'`, lido em
 * `class-wp-upgrader.php:461`) e `files` (a recursao, lida pelo achatamento de
 * `flatten_dirlist()`). Os outros nove — permissao em duas formas, dono, grupo,
 * tamanho, tres formas de data e `number` — alimentam o navegador de arquivos
 * das telas, que e BC-10. Declara-los aqui seria declarar superficie que este
 * modulo nao usa.
 */
export interface EntradaDePasta {
  readonly nome: string;
  /** `'d'` para pasta, `'f'` para arquivo. Os valores do legado, nao traduzidos. */
  readonly tipo: 'd' | 'f';
  /**
   * O conteudo, quando {@link tipo} e `'d'` e a listagem foi recursiva.
   *
   * Lista **vazia** quando a listagem nao foi recursiva: e o que o legado poe
   * (`class-wp-filesystem-direct.php:701`), e nao `false`. Quem achata a arvore
   * depende de os dois casos serem distinguiveis de "pasta vazia" — e nao sao,
   * nem no legado.
   */
  readonly filhos: readonly EntradaDePasta[];
}

export interface PortaDeSistemaDeArquivos {
  /**
   * Qual dos quatro transportes esta implementacao e (o
   * `$wp_filesystem->method` do legado).
   *
   * Esta na porta porque uma decisao de produto depende dele:
   * `update-core.php:1598` so confere gravabilidade previa quando o transporte
   * e {@link TRANSPORTE_LOCAL}.
   */
  readonly transporte: TransporteDeArquivo;

  /**
   * Abre o transporte (o `WP_Filesystem( $credentials )` do legado).
   *
   * Recebe `null` no transporte local, que e o caso em que o legado nao coleta
   * credencial nenhuma: `request_filesystem_credentials()` devolve `true` sem
   * desenhar formulario quando o metodo e `direct`
   * (`wp-admin/includes/file.php:2410`). CA-5.5 e o outro caso — *"destino nao
   * gravavel pede credenciais de acesso a arquivo e, sem elas, cancela antes de
   * tocar o destino"*.
   */
  conectar(credenciais: CredenciaisDeArquivo | null): ResultadoDaConexao;

  /**
   * Raiz da instalacao, como o transporte a enxerga (o `abspath()` do legado).
   *
   * Devolve `null` quando o transporte nao a encontra, porque e disso que sai o
   * erro `fs_no_root_dir` de `fs_connect()`
   * (`class-wp-upgrader.php:266`). As quatro raizes sao conferidas uma por uma,
   * **cada uma com a sua mensagem** (`:264` a `:291`), e por isso sao quatro
   * metodos e nao um com argumento.
   *
   * E tambem onde o marcador de manutencao e gravado:
   * `$wp_filesystem->abspath() . '.maintenance'`
   * (`class-wp-upgrader.php:1025`).
   */
  raiz(): string | null;

  /** Raiz de `wp-content` (o `wp_content_dir()`, erro `fs_no_content_dir`). */
  raizDeConteudo(): string | null;

  /** Raiz dos plugins (o `wp_plugins_dir()`, erro `fs_no_plugins_dir`). */
  raizDePlugins(): string | null;

  /** Raiz dos temas (o `wp_themes_dir()`, erro `fs_no_themes_dir`). */
  raizDeTemas(): string | null;

  /**
   * Traduz um caminho local no caminho que o transporte usa (o `find_folder()`
   * do legado).
   *
   * Existe porque nos tres transportes remotos o caminho do produto **nao e** o
   * caminho do servidor de arquivos, e o legado procura a pasta a partir da
   * raiz da conexao. No transporte local a traducao e a identidade. Sem ela, a
   * copia de US-1 escreve no lugar errado quando a credencial e de FTP
   * (`class-wp-upgrader.php:573`, `:1160`, `:1219`).
   */
  acharPasta(caminho: string): string | null;

  /** Existe algo neste caminho (o `exists()`). Booleano, como no legado. */
  existe(caminho: string): boolean;

  /**
   * E um arquivo (o `is_file()`).
   *
   * Existe ao lado de {@link existe} porque `update-core.php:1875` usa as duas
   * em sequencia para decidir se um apagamento que falhou importa:
   * `! delete( $old_file, true ) && is_file( $old_file )`. Falhar em apagar o
   * que nao e mais arquivo nao e falha.
   */
  ehArquivo(caminho: string): boolean;

  /** E uma pasta (o `is_dir()`). */
  ehPasta(caminho: string): boolean;

  /**
   * O transporte consegue escrever aqui (o `is_writable()`).
   *
   * Booleano, e nao resultado com mensagem, porque e assim que o legado a usa:
   * `clear_destination()` pergunta, tenta corrigir a permissao com
   * {@link definirPermissoes} e pergunta de novo, e so entao acumula o nome do
   * arquivo na lista de nao gravaveis (`class-wp-upgrader.php:458` a `:466`).
   */
  gravavel(caminho: string): boolean;

  /**
   * Cria a pasta (o `mkdir()`).
   *
   * O modo chega por argumento e **nao tem valor de fabrica nesta porta**: no
   * legado ele e `FS_CHMOD_DIR`, que nao e numero fixo — e
   * `fileperms( ABSPATH ) & 0777 | 0755`, lido do disco
   * (`wp-admin/includes/file.php:2236`). `null` e o caso em que o legado nao
   * passa modo nenhum (`class-wp-upgrader.php:1151`).
   */
  criarPasta(caminho: string, modo: number | null): OperacaoDeArquivo;

  /**
   * Grava bytes no caminho (o `put_contents()`).
   *
   * O modo de fabrica do legado e `FS_CHMOD_FILE`, tambem lido do disco:
   * `fileperms( ABSPATH . 'index.php' ) & 0777 | 0644`
   * (`wp-admin/includes/file.php:2239`).
   */
  escrever(
    caminho: string,
    conteudo: Uint8Array,
    modo: number | null,
  ): OperacaoDeArquivo;

  /**
   * Le os bytes do arquivo (o `get_contents()`).
   *
   * ⚠️ **E o unico membro desta porta com ZERO chamada nas seis fontes do caminho
   * de atualizacao, e esta aqui de proposito.** O legado nunca le arquivo por
   * `WP_Filesystem` neste caminho porque o unico arquivo que ele le e o marcador
   * de manutencao, e ele o le **executando**: `wp_is_maintenance_mode()` faz
   * `require ABSPATH . '.maintenance'` e colhe a global que o arquivo define
   * (`wp-includes/load.php:444`), sendo o conteudo gravado
   * `'<?php $upgrading = ' . time() . '; ?>'`
   * (`wp-admin/includes/class-wp-upgrader.php:1033`).
   *
   * Executar um arquivo para ler um numero **nao tem equivalente no alvo**: e o
   * mecanismo que `BR-DESCARTAR-009` descarta — *"a linguagem do alvo torna o
   * mecanismo inexprimivel, nao indesejavel"* — com a regra migrando por
   * `EXT-SUBST`. No alvo o marcador tem de ser **lido como dado**, e sem esta
   * operacao CA-4.4 (*"uma manutencao que ficou presa e detectavel e removivel
   * sem acesso ao servidor"*) nao e portavel: a deteccao do legado depende do
   * instante gravado dentro do arquivo, que vence em **10 minutos**
   * (`wp-includes/load.php:447`). O formato do marcador e o numero dos 10
   * minutos sao de T002 e T009, nao desta porta.
   */
  ler(caminho: string): LeituraDeArquivo<Uint8Array>;

  /**
   * Copia o arquivo (o `copy()`).
   *
   * `sobrescrever` e argumento explicito porque o legado passa os dois valores e
   * a diferenca e observavel: a copia do proprio `update-core.php` para dentro
   * da instalacao passa `true` (`class-core-upgrader.php:163`) e a copia do
   * arquivo de versao para a area temporaria passa o default `false`
   * (`update-core.php:1418`).
   */
  copiar(
    origem: string,
    destino: string,
    sobrescrever: boolean,
    modo: number | null,
  ): OperacaoDeArquivo;

  /**
   * Apaga o caminho (o `delete()`).
   *
   * `recursivo` e argumento explicito, e e **o argumento mais usado desta porta
   * no legado**: 27 chamadas de `delete` no caminho de atualizacao, a maioria
   * com `true` para limpar area temporaria e destino anterior. CA-5.2 depende
   * dele, e CA-5.4 depende de poder **ler o resultado**: e o apagamento que
   * falha depois de a copia ter comecado que `A5` classifica como critico
   * (`class-wp-automatic-updater.php:816` a `:822`).
   */
  apagar(caminho: string, recursivo: boolean): OperacaoDeArquivo;

  /**
   * Lista a pasta (o `dirlist()`).
   *
   * A falha volta como valor, e nao como lista vazia, porque **os dois casos
   * decidem coisas diferentes no legado**: `clear_destination()` trata `false`
   * como *"o destino nao existe"* e devolve sucesso sem apagar nada
   * (`class-wp-upgrader.php:447`), enquanto `install_package()` trata `false`
   * como `source_read_failed` e aborta (`:568`). Pasta vazia e um terceiro caso,
   * com terceiro efeito (`:579`). Colapsar os tres muda o resultado de US-1 e de
   * US-5.
   */
  listar(
    pasta: string,
    incluirOcultos: boolean,
    recursivo: boolean,
  ): LeituraDeArquivo<readonly EntradaDePasta[]>;

  /** Ajusta a permissao (o `chmod()`). */
  definirPermissoes(
    caminho: string,
    modo: number,
    recursivo: boolean,
  ): OperacaoDeArquivo;
}
