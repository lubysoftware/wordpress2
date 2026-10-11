/**
 * O registro de rotas — os dois armazens de `WP_REST_Server` e os tres leitores
 * que os expoem.
 *
 * Tarefa **T001** da feature `013-superficies-programaticas`, cuja entrega e
 * *"o despachante de rotas carrega com o registro de rotas vazio e
 * inspecionavel, e a porta de dados declarada"*. Este arquivo e a primeira
 * metade dela. `satisfaz: — (infraestrutura)`: nenhum criterio de aceite, e
 * nenhuma regra de negocio.
 *
 * ---
 *
 * ## O legado guarda DOIS armazens, e a diferenca entre eles e observavel
 *
 * `wp-includes/rest-api/class-wp-rest-server.php` declara tres campos, nestas
 * linhas:
 *
 * | campo | linha | o que guarda | aqui |
 * |---|---|---|---|
 * | `$namespaces` | `:64` | espaco de nome para o conjunto de caminhos dele, *"associativo para evitar registro em dobro"* (`:924`) | {@link RegistroDeRotas.espacosDeNome} |
 * | `$endpoints` | `:72` | caminho para a declaracao da rota | {@link RegistroDeRotas.rotas} |
 * | `$route_options` | `:80` | caminho para as opcoes **da rota**, que nao sao de nenhum tratador | {@link RegistroDeRotas.opcoesDaRota} |
 *
 * Os dois primeiros parecem redundantes e nao sao: `register_route()` escreve
 * **nos dois** na mesma respiracao (`:924` e `:929`), de modo que concordam para
 * tudo que passa por ele — mas o construtor (`:103`) semeia `$endpoints`
 * **direto**, sem passar por `register_route()`, e por isso as duas rotas meta
 * do construtor existem em `$endpoints` e **nao** existem em `$namespaces`.
 * E por isso que `get_routes( 'wp/v2' )` nunca devolve `/`.
 *
 * ## 🔴 O achado de T001: no legado o registro NAO nasce vazio
 *
 * A entrega desta tarefa pede o registro *"vazio"*, e `$namespaces = array()`
 * (`:64`) e `$route_options = array()` (`:80`) sao exatamente isso. `$endpoints`
 * **nao e**: o construtor (`:103-160`) o semeia com **duas rotas meta**, com o
 * comentario `// Meta endpoints.` em `:105`:
 *
 * - `/` — `methods: 'GET'`, `callback: get_index`, com o argumento `context`
 *   em `default: 'view'`. E a raiz da API, e e **US-3** (T007): *"ha um
 *   endereco que lista as rotas registradas e os seus esquemas"*.
 * - `/batch/v1` — `methods: 'POST'`, `callback: serve_batch_request_v1`, com o
 *   esquema de `validation` (`enum: require-all-validate | normal`,
 *   `default: normal`) e de `requests` (`maxItems: get_max_batch_size()`).
 *   ⚠️ **Nenhuma das nove historias desta feature a cobre**, e ela e superficie
 *   publicada. Esta registrada em `../README.md`, secao *O que ninguem
 *   decidiu*, porque o P8 poe remocao de superficie fora do que esta agente
 *   decide.
 *
 * T001 **nao semeia nenhuma das duas**, e a razao e de divisao de tarefa, nao de
 * escopo: as duas tem esquema de argumento declarado, e *"o formato de esquema
 * de rota"* e a entrega de **T002**. Semear aqui exigiria inventar o formato
 * uma tarefa antes de quem o especifica. Quem fechar T002 e T007 encontra a
 * divida nomeada aqui e em `../README.md`.
 *
 * ## Por que nao existe `registrar` neste arquivo
 *
 * Porque o ato de registrar e a entrega de **T002** — *"o registro de uma rota
 * sem declaracao de permissao reproduz o aviso de uso indevido do legado"* — e o
 * que se registra e uma declaracao no formato que T002 define. {@link
 * DeclaracaoDeRota} e {@link DeclaracaoDeOpcaoDeRota} marcam os dois lugares, e
 * sao `never` de proposito: enquanto o formato nao existe, **o compilador nao
 * deixa nada entrar no registro**, e e assim que "vazio" deixa de ser uma
 * afirmacao do teste e passa a ser uma propriedade do tipo.
 */

/**
 * A declaracao de uma rota, como `register_route()` a recebe em `$route_args`
 * (`class-wp-rest-server.php:899`): a lista ordenada de tratadores, cada um com
 * metodo, funcao, declaracao de permissao e esquema de argumento.
 *
 * ⚠️ **E `never` porque T001 nao define o formato — T002 define.** A linha da
 * tarefa T002 e *"declarar o formato de esquema de rota e o de operacao
 * nomeada"*, e e la que entram os seis campos que `get_routes()` normaliza em
 * `:977-983` (`methods`, `accept_json`, `accept_raw`, `show_in_index`, `args`,
 * mais `callback` e o `permission_callback` opcional cujo default aberto e a
 * regra `I7`/BR-MIGRAR-074).
 *
 * Trocar este `never` pela interface e a primeira linha de T002.
 */
export type DeclaracaoDeRota = never;

/**
 * Uma opcao **da rota**, nao de um tratador: no legado e qualquer chave **nao
 * numerica** de `$route_args`, que `get_routes()` retira da lista de tratadores
 * e move para `$this->route_options[ $route ]` (`:998-1002`). `schema` e
 * `allow_batch` sao as duas que o nucleo usa.
 *
 * ⚠️ `never` pelo mesmo motivo de {@link DeclaracaoDeRota}: e parte do formato,
 * e o formato e de T002.
 */
export type DeclaracaoDeOpcaoDeRota = never;

/**
 * O mapa de rotas: caminho para a lista de tratadores daquele caminho.
 *
 * A chave e o caminho **completo**, com o espaco de nome e a versao dentro dele
 * — `register_rest_route()` monta `'/' . $clean_namespace . '/' . trim( $route, '/' )`
 * antes de registrar (`wp-includes/rest-api.php:153`). E e dai que sai CA-1.5,
 * *"toda rota tem versao no caminho"*: a versao e parte do espaco de nome
 * (`wp/v2`, `oembed/1.0`, `wp-site-health/v1`), e nao um cabecalho nem um
 * parametro.
 *
 * ⚠️ No legado a chave e uma **expressao regular** com `@` escapado, porque e
 * ela que `preg_match()` consome no casamento — o docblock de `get_routes()`
 * (`:947`) diz isso com todas as letras. Casar caminho e metodo e **T003**
 * (CA-1.1), e e quem fizer T003 que decide como a expressao do legado viaja
 * para ca; T001 so declara que a chave e o caminho registrado.
 */
export type MapaDeRotas = ReadonlyMap<string, readonly DeclaracaoDeRota[]>;

/** As opcoes de uma rota, por nome. */
export type OpcoesDaRota = ReadonlyMap<string, DeclaracaoDeOpcaoDeRota>;

/**
 * O registro de rotas de **uma** requisicao.
 *
 * Os tres metodos sao os tres leitores do legado, e nada mais: `get_routes()`
 * (`:957`), `get_namespaces()` (`:1035`) e `get_route_options()` (`:1047`).
 *
 * ⚠️ **No legado este registro e um global, e e por isso que aqui ele nao e.**
 * `rest_get_server()` (`wp-includes/rest-api.php:629`) guarda o servidor em
 * `global $wp_rest_server`, cria-o na primeira chamada e **so entao** dispara
 * `rest_api_init` (`:657`), que e onde todo modulo e toda extensao registram as
 * rotas deles. Num modelo de processo por requisicao — o slot de isolamento
 * desta feature — aquele global morre com a resposta, logo ele **ja e** escopo
 * de requisicao, e reproduzi-lo como estado de modulo num processo longo-vivo
 * trocaria o produto: as rotas de uma requisicao vazariam para a seguinte, e
 * numa rede as de um site para outro. E a implicacao 2 e `EXT-CONTEXTO`
 * (BR-MIGRAR-105). `../modulo.test.ts` afirma que duas composicoes nao se
 * enxergam.
 */
export interface RegistroDeRotas {
  /**
   * Os espacos de nome registrados, na ordem em que o primeiro registro de cada
   * um chegou — `array_keys( $this->namespaces )` (`:1035-1037`).
   */
  espacosDeNome(): readonly string[];

  /**
   * O mapa de rotas, opcionalmente recortado por espaco de nome.
   *
   * Tres propriedades do legado que este leitor preserva, e que sao faceis de
   * perder quando o registro deixar de ser vazio:
   *
   * 1. **Devolve copia, nao o armazem.** `$endpoints = $this->endpoints;`
   *    (`:958`) copia antes de qualquer coisa, e e sobre a copia que o filtro e
   *    a normalizacao trabalham. Quem altera o que `rotas()` devolveu nao altera
   *    o que esta registrado.
   * 2. **Aqui dispara o ponto de extensao `rest_endpoints`** (`:974`), que
   *    recebe o mapa e pode devolver outro — logo pode **acrescentar, tirar e
   *    trocar** rota depois do registro. E ponto de extensao, logo e produto
   *    (P2), e fica declarado neste docblock porque o barramento de ganchos nao
   *    tem tarefa neste pacote (REQ-162 esta em `do-not-rewrite.md`). Com o
   *    registro vazio ele nao tem o que mudar; quem acrescentar tratador
   *    acrescenta o ponto **nesta posicao**, antes da normalizacao.
   * 3. ⚠️ **No legado este leitor ESCREVE.** `get_routes()` normaliza os
   *    tratadores com os defaults de `:977-983`, expande `methods` de texto
   *    separado por virgula para mapa em maiusculas (`:1007-1019`) e **popula
   *    `$this->route_options`** (`:992-994` e `:998-1002`) — ou seja, antes da primeira
   *    chamada a `get_routes()`, `get_route_options()` devolve `null` para toda
   *    rota, inclusive para rota que declarou opcao. Isso e ordem observavel,
   *    nao detalhe: ver {@link RegistroDeRotas.opcoesDaRota}.
   *
   * @param espacoDeNome Quando informado, so as rotas daquele espaco de nome.
   *   Texto vazio vale como "todas", porque no legado o recorte esta atras de um
   *   `if ( $route_namespace )` (`:960`) e o default do parametro e `''`
   *   (`:957`).
   */
  rotas(espacoDeNome?: string): MapaDeRotas;

  /**
   * As opcoes de uma rota, ou `null` quando nao ha nenhuma — `null` e o retorno
   * declarado do legado para rota ausente (`:1048-1052`), e **nao** um mapa
   * vazio. A diferenca e visivel para quem chama.
   *
   * ⚠️ Enquanto `rotas()` nao for chamada, no legado isto devolve `null` para
   * toda rota (ver a propriedade 3 de {@link RegistroDeRotas.rotas}). T001 nao
   * reproduz a ordem porque nao tem o que normalizar; quem fechar T002 decide se
   * reproduz o acoplamento ou se o declara como divergencia — e, se declarar,
   * precisa da referencia que o P1 cobra.
   */
  opcoesDaRota(caminho: string): OpcoesDaRota | null;
}

/**
 * Cria um registro de rotas vazio.
 *
 * Nao recebe nada e nao resolve nada: `EXT-ORDEM` (BR-MIGRAR-106) poe a ordem de
 * arranque no contrato publico, e a tabela *Nao negociavel* da constituicao poe
 * *"mudar a ordem de carregamento do arranque"* fora do que este agente decide.
 * No legado o povoamento acontece em `rest_api_init`, que dispara **depois** de
 * o servidor existir (`wp-includes/rest-api.php:644-657`) — construir e povoar
 * sao dois momentos, e os dois sao contrato.
 *
 * Cada chamada devolve um registro novo, com armazens proprios. Ver a nota de
 * {@link RegistroDeRotas} sobre por que o global do legado nao se reproduz como
 * estado de modulo.
 */
export function criarRegistroDeRotas(): RegistroDeRotas {
  /** `$this->namespaces` — espaco de nome para os caminhos dele. */
  const porEspacoDeNome = new Map<string, ReadonlySet<string>>();
  /** `$this->endpoints` — caminho para os tratadores dele. */
  const porCaminho = new Map<string, readonly DeclaracaoDeRota[]>();
  /** `$this->route_options` — caminho para as opcoes da rota. */
  const porRota = new Map<string, OpcoesDaRota>();

  return {
    espacosDeNome() {
      return [...porEspacoDeNome.keys()];
    },

    rotas(espacoDeNome) {
      // `$endpoints = $this->endpoints;` (`:958`): a copia vem primeiro, e e
      // ela que sai. O ponto de extensao `rest_endpoints` (`:974`) entra aqui,
      // sobre a copia, antes da normalizacao.
      const copia = new Map(porCaminho);

      if (espacoDeNome === undefined || espacoDeNome === '') {
        return copia;
      }

      // O legado recorta com `wp_list_filter( $endpoints, array( 'namespace' =>
      // $route_namespace ) )` (`:961`), pelo espaco de nome que
      // `register_route()` estampa dentro da declaracao em `:926`. Aqui o
      // recorte sai do indice de espacos de nome, que e o outro armazem do
      // mesmo `register_route()` (`:924`) — os dois sao escritos juntos, e
      // nenhum dos dois contem as rotas meta do construtor. Quem fechar T002,
      // que e quem passa a estampar o espaco de nome na declaracao, confere que
      // os dois continuam concordando.
      const recorte = new Map<string, readonly DeclaracaoDeRota[]>();
      for (const caminho of porEspacoDeNome.get(espacoDeNome) ?? []) {
        const tratadores = copia.get(caminho);
        if (tratadores !== undefined) {
          recorte.set(caminho, tratadores);
        }
      }
      return recorte;
    },

    opcoesDaRota(caminho) {
      // `isset()` e `null`, nao mapa vazio (`:1048-1052`).
      return porRota.get(caminho) ?? null;
    },
  };
}
