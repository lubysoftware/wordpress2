/**
 * A forma da lista de permissao: **o que pode ser publicado, e por quem.**
 *
 * Tarefa **T002** da feature `015-plataforma-transversal` — *"as portas
 * declaradas e nenhuma regra implementada"*. `satisfaz: — (infraestrutura)`.
 * A lista de fabrica, com os elementos e atributos um por um, **nao esta aqui**:
 * ela e regra, e regra e da tarefa da historia.
 *
 * ---
 *
 * ## ⚠️ Esta metade do modulo e fronteira de autorizacao, nao higiene de HTML
 *
 * O slot `analise-de-html` do `plan.md` separa as duas metades em uma frase, e
 * ela e o aviso mais importante desta pasta: *"a metade que parece substituivel,
 * o tokenizador, e um editor de string que nenhum analisador de arvore reproduz
 * sem reescrever o `post_content`; e a outra metade, KSES, e **fronteira de
 * autorizacao, nao higiene de HTML**"*. Trocar esta lista por um sanitizador de
 * terceiro muda **o que cada papel pode publicar**, que e comportamento
 * observavel e regra de negocio (`P8`/BR-MIGRAR-008: *"HTML bruto e privilegio,
 * e revogavel por constante"*).
 *
 * As ancoras da fronteira, conferidas no oraculo:
 *
 * | o que | ancora |
 * |---|---|
 * | a funcao que filtra, recebendo a lista **por argumento** | `wp-includes/kses.php:961` (`wp_kses( $content, $allowed_html, $allowed_protocols )`) |
 * | a lista de fabrica, no escopo global | `wp-includes/kses.php:68` (`$allowedposttags`), `:605` (`$allowedtags`, a lista curta de comentario) |
 * | a lista **por contexto**, e filtravel | `wp-includes/kses.php:1063` (`wp_kses_allowed_html( $context )`) |
 * | os protocolos permitidos | `wp-includes/functions.php:7331` (`wp_allowed_protocols()`) |
 * | quem **escapa** da filtragem | `wp-includes/kses.php:2606` (`kses_init()`), que so instala os filtros se a conta **nao** tiver `unfiltered_html` (`:2609`); e `:2546` (`kses_init_filters()`), com o atalho de `:2551` |
 * | a constante que revoga o privilegio de quem o tem | `wp-includes/capabilities.php:597` (`DISALLOW_UNFILTERED_HTML`) — `PERM-8`/BR-MIGRAR-094 |
 * | a constante que substitui a lista inteira | `wp-includes/kses.php:59` (`if ( ! CUSTOM_TAGS )`) |
 *
 * ---
 *
 * ## Por que a decisao de capacidade nao mora nesta pasta
 *
 * Porque no legado ela tambem nao mora dentro do filtro. `wp_kses()` e **puro**:
 * recebe conteudo, lista e protocolos, e devolve texto. Quem pergunta pela
 * capacidade e `kses_init()` (`kses.php:2606`), que decide **se os filtros sao
 * instalados** — e isso e fiacao, no barramento, nao sanitizacao. Reproduzir
 * essa divisao e o que mantem esta pasta sem dependencia de
 * `plataforma/autorizacao/`: a lista chega por argumento, como no legado, e a
 * decisao de qual lista usar fica com quem compoe a operacao.
 *
 * E e tambem o que permite que o desenho mova a metade pura para
 * `utilitarios/` sem mudar nada do que se ve: `target_architecture.md` lista
 * *"parser de HTML"* e *"saneamento"* entre os **6 modulos puros, sem regra de
 * negocio** de `utilitarios/`, e a regra de dependencia 1 permite
 * `plataforma/` para `utilitarios/`. Ver `./README.md` sobre a escolha da pasta.
 */

/**
 * Os atributos admitidos num elemento.
 *
 * `true` e *"admitido sem restricao"*; o objeto com restricoes nomeadas e o que
 * o legado expressa como `array( 'maxlength' => true, 'required' => true )` por
 * atributo. T011 declara as restricoes que a lista de fabrica usa; T002 declara
 * so a forma, e **conjunto aberto** em elemento e atributo, porque
 * `BR-MIGRAR-075` fixa o principio (*"o conjunto documentado e piso, nao
 * teto"*) e porque `wp_kses_allowed_html()` e filtravel.
 */
export interface AtributosAdmitidos {
  readonly [atributo: string]: boolean | { readonly [restricao: string]: boolean | undefined } | undefined;
}

/**
 * A lista de permissao: elemento para atributos admitidos.
 *
 * Elemento ausente da lista **nao** e elemento proibido com mensagem: e elemento
 * removido em silencio, que e o que `wp_kses()` faz. Nenhuma linha disso esta
 * implementada aqui.
 */
export interface ListaDePermissao {
  readonly [elemento: string]: AtributosAdmitidos | undefined;
}

/**
 * O contexto em que a sanitizacao acontece.
 *
 * Os tres campos sao os tres argumentos de `wp_kses()`
 * (`wp-includes/kses.php:961`) menos o conteudo: a lista, os protocolos, e o
 * **nome do contexto**, que e o que `wp_kses_allowed_html( $context )`
 * (`:1063`) usa para escolher a lista. Os nomes que aquele `switch` reconhece
 * (`:1086` em diante) sao `'post'`, `'user_description'`,
 * `'pre_term_description'`, `'pre_user_description'`, `'strip'`, `'entities'` e
 * `'data'`, com `'data'` empatado com o `default` — e o conjunto e aberto por
 * filtro.
 *
 * ⚠️ **Nao ha campo de capacidade, e nao pode haver.** Quem tem
 * `unfiltered_html` nao chega aqui: no legado os filtros nem sao instalados
 * (`:2609`). Declarar a capacidade neste contexto inverteria a fronteira —
 * passaria a sanitizar quem o legado nao sanitiza, e a decisao viraria desta
 * pasta.
 */
export interface ContextoDeSanitizacao {
  readonly contexto: string;
  readonly lista: ListaDePermissao;
  readonly protocolos: readonly string[];
}
