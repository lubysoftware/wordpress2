/**
 * O tema ativo, **como a escolha de apresentacao o enxerga** — os dois caminhos
 * que `wp_set_template_globals()` publica (`wp-includes/template.php:694-699`),
 * os dois nomes que `_wp_is_template_path_allowed()` consulta (`:737` e `:742`),
 * o diretorio de compatibilidade de `locate_template()` (`:802`) e as tres
 * perguntas que esta etapa faz ao sistema de arquivos.
 *
 * Entrega de **T005** (US-2, CA-2.4).
 *
 * ---
 *
 * ## Por que o tema chega por argumento, e nao por porta deste modulo
 *
 * Porque o dono dele e `plataforma/tema` — `target_architecture.md` mapeia a
 * hierarquia de modelos para la, e o README deste modulo ja registra que esta
 * feature **atravessa** `BC-01`, `plataforma/rotas` e `plataforma/tema` sem ser
 * nenhuma das tres. A pasta nao existe nesta arvore, e a feature que a traz e a
 * `009-apresentacao-e-personalizacao`. Logo o tema e **ligacao tardia**, como o
 * repositorio de conteudo de T003 e a fonte de regras de traducao de T002:
 * chega no contexto da operacao, nunca como estado de modulo.
 *
 * E e tambem o que CA-2.4 pede para poder ser conferido — *"trocar o tema troca
 * a apresentacao sem alterar conteudo nem consulta"*: com o tema como argumento,
 * a troca e trocar um valor, e a consulta nem sabe que houve troca. Se o tema
 * fosse porta do modulo, a troca passaria por recompor o modulo, e a
 * propriedade deixaria de ser verificavel sem banco.
 *
 * ## As tres perguntas ao sistema de arquivos, e o que a ausencia de cada uma diz
 *
 * | colaborador | legado | ausente significa |
 * |---|---|---|
 * | {@link TemaAtivo.arquivoExiste} | `file_exists()` (`template.php:798`, `:800`, `:802`) | **nenhum** modelo existe no tema |
 * | {@link TemaAtivo.caminhoReal} | `realpath()` (`:722` e `:747`) | o caminho nao resolve, que e o `false` de `realpath` — e o legado **recusa** o modelo (`:724-726`) |
 * | {@link TemaAtivo.modeloEmBlocos} | `locate_block_template()` (`:66`) | o tema **nao** declara `block-templates`, e a funcao devolve o modelo recebido sem tocar nele (`block-template.php:65-67`) |
 *
 * ⚠️ **Nenhuma das tres ausencias e "ainda nao implementado".** A primeira e um
 * tema sem arquivo de modelo; a segunda e o caminho que o sistema de arquivos
 * nao resolve; a terceira e um tema classico, que e o que `twentytwentythree` e
 * anteriores sao. As tres sao estados que o legado tem.
 *
 * ## 🔴 Qual tema serve de oraculo continua sem resposta, e nao bloqueia esta tarefa
 *
 * A pergunta aberta da `spec.md` desta feature — *"os modelos vem do tema, que
 * esta na feature 009. Qual tema serve de oraculo para o teste de paridade desta
 * historia?"* — continua **aberta**, e nada aqui a responde.
 *
 * O que ela decide, e o que ela nao decide, esta em `parity_specs.md` § *Decisao
 * 2*: HTML de tema e painel e conferido por **comportamento de caso de uso**
 * (os 47 UCs), explicitamente **nao** byte a byte, e `pending_decisions.md:159`
 * registra o motivo — *"a ordem de emissao varia no proprio legado conforme
 * tema; exigir byte a byte aqui congela acidente"*. Ou seja: o tema de oraculo e
 * necessario para comparar a **pagina renderizada**, que e trabalho da feature
 * 009; a **ordem de procura** e o nucleo, mora em `wp-includes/template.php` e
 * em `wp-includes/template-loader.php`, e e o que esta tarefa porta. Os quatro
 * criterios de US-2 sao conferiveis contra um tema declarado como duplo, que e
 * tambem como os quatro casos de `UT-039` de `backlog/tests.md` os descrevem.
 */

/**
 * O tema ativo nos campos que esta etapa le.
 *
 * Os quatro primeiros sao **dado** e os tres ultimos sao **pergunta**, e a
 * divisao e a do legado: `wp_set_template_globals()` resolve os caminhos uma vez
 * por requisicao e `locate_template()` pergunta ao sistema de arquivos a cada
 * candidato.
 */
export interface TemaAtivo {
  /**
   * `$wp_stylesheet_path` — `get_stylesheet_directory()`
   * (`template.php:697`).
   *
   * E o diretorio consultado **primeiro**, e e isso que permite a um tema filho
   * sobrescrever um arquivo so (`:765-767`).
   */
  readonly diretorioDaFolhaDeEstilo: string;
  /** `$wp_template_path` — `get_template_directory()` (`template.php:698`). */
  readonly diretorioDoModelo: string;
  /**
   * `get_stylesheet()` — o **nome** do tema ativo, nao o caminho.
   *
   * Lido so por `_wp_is_template_path_allowed()`, que aceita o diretorio pai
   * quando o nome contem `/`, isto e quando o tema esta em subdiretorio
   * (`template.php:737-739`).
   */
  readonly folhaDeEstilo: string;
  /** `get_template()` — o nome do tema pai (`template.php:742-744`). */
  readonly modelo: string;
  /**
   * `ABSPATH . WPINC . '/theme-compat'` — o terceiro e ultimo diretorio de
   * `locate_template()` (`template.php:802`).
   *
   * E dado, e nao constante deste arquivo, porque `ABSPATH` e fato de
   * implantacao: o caminho do webroot nao e regra do produto.
   */
  readonly diretorioDeCompatibilidade: string;
  /** `file_exists( $caminho )`. */
  readonly arquivoExiste: (caminho: string) => boolean;
  /**
   * `realpath( $caminho )` — a resolucao verdadeira do caminho.
   *
   * Devolve ausencia no lugar do `false` do legado. So e chamada no caminho
   * lento de `_wp_is_template_path_allowed()`, isto e quando o nome do candidato
   * contem um segmento `..`; nenhum candidato que a hierarquia do nucleo monta
   * contem um.
   */
  readonly caminhoReal?: (caminho: string) => string | undefined;
  /**
   * `locate_block_template( $template, $type, $templates )`
   * (`wp-includes/block-template.php:62`), na posicao de `template.php:66`.
   *
   * ⚠️ **A posicao e o contrato:** ela roda **depois** de `locate_template()` e
   * **antes** do ponto de extensao `{$type}_template`, e recebe os tres
   * argumentos daquela linha. Quem a implementar — feature 009 — encontra o
   * modelo classico ja localizado, que e o que o legado chama de *"fallback
   * candidate"* (`block-template.php:70-77`).
   */
  readonly modeloEmBlocos?: (
    modelo: string,
    tipo: string,
    candidatos: readonly string[],
  ) => string;
}

/**
 * `is_child_theme()` (`wp-includes/theme.php:163-167`).
 *
 * E a comparacao dos dois caminhos, e nao um campo proprio: o legado a calcula
 * assim, e um campo separado poderia divergir deles.
 */
export function temaFilho(tema: TemaAtivo): boolean {
  return tema.diretorioDaFolhaDeEstilo !== tema.diretorioDoModelo;
}

/**
 * O tema de uma instalacao em que nenhum arquivo de modelo existe.
 *
 * E o default quando ninguem informa tema, e **nao** e um esboco — e o mesmo
 * tipo de default que `REPOSITORIO_SEM_CONTEUDO` de T003: o estado em que
 * `locate_template()` percorre todos os candidatos e nao localiza nenhum, com o
 * que o legado faz a seguir (nada e incluido, e quem pode trocar tema recebe os
 * erros do tema — `template-loader.php:133-138`) registrado em
 * `./escolher-apresentacao.ts`.
 */
export const TEMA_SEM_MODELOS: TemaAtivo = Object.freeze({
  diretorioDaFolhaDeEstilo: '',
  diretorioDoModelo: '',
  folhaDeEstilo: '',
  modelo: '',
  diretorioDeCompatibilidade: '',
  arquivoExiste: () => false,
});
