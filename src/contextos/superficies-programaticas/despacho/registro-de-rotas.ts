/**
 * O registro de rotas — os dois armazens de `WP_REST_Server` e os tres leitores
 * que os expoem, mais o ato de registrar.
 *
 * Tarefa **T001** da feature `013-superficies-programaticas` (os armazens e os
 * leitores) e **T002** (o formato declarado, `registrar()` e a normalizacao do
 * leitor). `satisfaz: — (infraestrutura)` nas duas: nenhum criterio de aceite, e
 * nenhuma regra de negocio de historia.
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
 * A entrega de T001 pede o registro *"vazio"*, e `$namespaces = array()`
 * (`:64`) e `$route_options = array()` (`:80`) sao exatamente isso. `$endpoints`
 * **nao e**: o construtor (`:103`-`:160`) o semeia com **duas rotas meta**, com
 * o comentario `// Meta endpoints.` em `:105`:
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
 * **T002 tambem nao as semeia, e agora por outro motivo.** T001 nao podia: *"as
 * duas tem esquema de argumento declarado, e o formato de esquema de rota e a
 * entrega de T002"*. O formato agora existe — `./esquema-de-rota.ts` — e o que
 * falta e a **funcao** de cada uma: `get_index` e **T007** (US-3) e
 * `serve_batch_request_v1` nao tem tarefa. Semear com funcao nula trocaria o
 * registro vazio que `../modulo.test.ts` afirma por duas rotas que nao
 * respondem. Quem fechar T007 semeia `/` com a funcao na mao, e registra a
 * pergunta sobre `/batch/v1` em vez de decidir.
 *
 * ## 🔴 O achado de T002: os dois armazens NAO concordam sempre, e o legado
 * recorta pelo segundo
 *
 * T001 implementou o recorte por espaco de nome a partir do indice
 * `$namespaces` e deixou escrito: *"quem fechar T002, que e quem passa a
 * estampar o espaco de nome na declaracao, confere que os dois continuam
 * concordando"*. Conferido: **nao concordam**, e ha um caso alcancavel.
 *
 * O legado recorta com `wp_list_filter( $endpoints, array( 'namespace' =>
 * $route_namespace ) )` (`:961`) — pelo valor **estampado dentro dos argumentos
 * da rota** em `:926`, e nao pelo indice. Registre o mesmo caminho duas vezes,
 * sob espacos de nome diferentes, sem sobrepor:
 *
 * - `$namespaces` fica com o caminho nas **duas** listas (`:924`, uma por
 *   chamada);
 * - os argumentos ficam com **um** `namespace`, o da segunda chamada, porque
 *   `array_merge` deixa a chave nao numerica da direita vencer (`:931`).
 *
 * Logo `get_routes( <primeiro espaco> )` **nao** devolve a rota, e um recorte
 * tirado do indice devolveria. Como o recorte alimenta o mapa da superficie
 * (**US-3**, cuja saida e byte a byte pela area 1 de `parity_specs.md`), T002
 * passou a recortar pelo estampado, que e o que o legado faz. O indice continua
 * existindo porque e ele que `espacosDeNome()` devolve, e porque e ele que
 * impede registro em dobro.
 *
 * ## Onde o leitor ESCREVE, e por que isso ficou como esta
 *
 * `get_routes()` nao e so leitura: ele normaliza os tratadores com os defaults
 * de `:977`-`:983`, reparte `methods` (`:1007`-`:1021`) e **popula
 * `$this->route_options`** (`:992`-`:994` e `:998`-`:1002`). A consequencia
 * observavel e que, **antes da primeira chamada a `get_routes()`,
 * `get_route_options()` devolve `null` para toda rota, inclusive para rota que
 * declarou opcao**.
 *
 * T001 deixou a escolha para esta tarefa: *"quem fechar T002 decide se reproduz
 * o acoplamento ou se o declara como divergencia — e, se declarar, precisa da
 * referencia que o P1 cobra"*. **T002 reproduz.** A referencia que uma
 * divergencia exigiria nao existe: `questions.md` nao tem resposta sobre isto e
 * nao ha ADR, e as tres divergencias autorizadas da constituicao sao outras.
 * {@link RegistroDeRotas.opcoesDaRota} tem o teste do antes e do depois.
 */

import {
  ATALHOS_DE_METODO,
  OPCAO_DO_ESPACO_DE_NOME,
  normalizarTratador,
  type ArgumentosDaRota,
  type DeclaracaoDeOpcaoDeRota,
  type DeclaracaoDeRota,
  type OpcoesDeclaradasDaRota,
  type TratadorDeRota,
} from './esquema-de-rota.js';

/**
 * O mapa de rotas: caminho para a lista de tratadores **normalizados** daquele
 * caminho.
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
 * para ca; o registro so declara que a chave e o caminho registrado.
 *
 * O valor e {@link TratadorDeRota}, e nao {@link DeclaracaoDeRota}: o leitor
 * normaliza, e quem recebe ja tem os cinco defaults aplicados e `metodos` como
 * mapa. **T002 trocou o elemento deste tipo**, que em T001 era `never`.
 */
export type MapaDeRotas = ReadonlyMap<string, readonly TratadorDeRota[]>;

/** As opcoes de uma rota, por nome. */
export type OpcoesDaRota = ReadonlyMap<string, DeclaracaoDeOpcaoDeRota>;

/**
 * A declaracao da rota de indice de um espaco de nome, como `register_route()`
 * a monta quando o espaco de nome aparece pela primeira vez
 * (`class-wp-rest-server.php:903`-`:920`).
 *
 * Tres coisas dela sao faceis de perder, e as tres sao observaveis:
 *
 * 1. **Ela nao tem declaracao de permissao, e nao emite aviso nenhum.** O aviso
 *    de `I7` mora na **funcao** `register_rest_route()`
 *    (`wp-includes/rest-api.php:122`), e esta rota e registrada pelo **metodo**
 *    `register_route()`, que nao avisa. O indice do proprio nucleo e, portanto,
 *    uma rota sem declaracao de permissao que ninguem avisa a respeito — e o
 *    comentario de `:37`-`:40` do legado documenta esse desvio como caminho
 *    legitimo. Tem teste.
 * 2. **Os dois argumentos declaram so `default`**, sem `type`: `namespace` com o
 *    nome do espaco e `context` com `'view'` (`:910`-`:917`). Reproduzido
 *    letra por letra; acrescentar `type` aqui mudaria o mapa da superficie, que
 *    e byte a byte.
 * 3. 🔴 **A funcao e `null` nesta tarefa.** No legado e
 *    `array( $this, 'get_namespace_index' )`, e aquele metodo e **US-3** (T007).
 *    A rota existe no registro porque a existencia dela e observavel — ela
 *    aparece em `rotas()` e em `espacosDeNome()` —, mas ela nao responde ate
 *    T007. Esta registrado em `../README.md`.
 */
export function declaracaoDoIndiceDeEspacoDeNome(
  espacoDeNome: string,
): DeclaracaoDeRota {
  return {
    metodos: ATALHOS_DE_METODO.READABLE,
    funcao: null,
    argumentos: {
      namespace: { default: espacoDeNome },
      context: { default: 'view' },
    },
  };
}

/**
 * O registro de rotas de **uma** requisicao.
 *
 * Os tres leitores sao os tres do legado, e nada mais: `get_routes()`
 * (`:957`), `get_namespaces()` (`:1035`) e `get_route_options()` (`:1047`).
 * {@link RegistroDeRotas.registrar} e `register_route()` (`:899`).
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
   * Registra uma rota — `register_route()` (`:899`-`:933`).
   *
   * ⚠️ **Este e o metodo, nao a funcao: ele nao avisa nada.** Toda conferencia
   * de uso indevido, inclusive a da declaracao de permissao ausente, mora em
   * `./registro-de-rota-de-api.ts`, que e o porte da funcao
   * `register_rest_route()`. O legado documenta a diferenca em
   * `wp-includes/rest-api.php:37`-`:40`: quem precisa de rota sem espaco de
   * nome *"chama `WP_REST_Server::register_route` direto"*, e com isso desvia
   * de todos os avisos. Fechar esse desvio seria fechar um caminho publicado
   * (P8).
   *
   * Quatro efeitos, na ordem em que o legado os produz:
   *
   * 1. **Espaco de nome novo registra o indice dele primeiro** (`:900`-`:921`),
   *    numa chamada recursiva — ver {@link declaracaoDoIndiceDeEspacoDeNome}. A
   *    lista do espaco de nome e criada **antes** da recursao, e e isso que
   *    impede a recursao infinita.
   * 2. O caminho entra na lista do espaco de nome, como chave, *"associativo
   *    para evitar registro em dobro"* (`:924`).
   * 3. O espaco de nome e **estampado nas opcoes da rota** (`:926`) — ver
   *    {@link OPCAO_DO_ESPACO_DE_NOME} e o achado 2 do cabecalho deste arquivo.
   * 4. Rota nova entra; rota que ja existe **mescla**, salvo `sobrepor`
   *    (`:928`-`:932`): os tratadores da chamada nova vao para o **fim** da
   *    lista, porque `array_merge` renumera chave numerica, e as opcoes da
   *    chamada nova **vencem**, porque chave nao numerica da direita sobrescreve.
   *
   * ⚠️ A condicao do legado e `$override || empty( $this->endpoints[ $route ] )`,
   * e `empty()` tambem e verdadeiro para vetor vazio. Aqui a condicao e "o
   * caminho nao existe", e as duas coincidem: depois de uma passagem por este
   * metodo a rota **nunca** esta vazia, porque o passo 3 sempre estampa o espaco
   * de nome. Semear o armazem por fora e o unico jeito de separar as duas, e
   * nada nesta arvore semeia.
   */
  registrar(
    espacoDeNome: string,
    caminho: string,
    argumentos: ArgumentosDaRota,
    sobrepor?: boolean,
  ): void;

  /**
   * Os espacos de nome registrados, na ordem em que o primeiro registro de cada
   * um chegou — `array_keys( $this->namespaces )` (`:1035`-`:1037`).
   */
  espacosDeNome(): readonly string[];

  /**
   * O mapa de rotas, opcionalmente recortado por espaco de nome.
   *
   * Quatro propriedades do legado que este leitor preserva:
   *
   * 1. **Devolve copia, nao o armazem.** `$endpoints = $this->endpoints;`
   *    (`:958`) copia antes de qualquer coisa, e e sobre a copia que o filtro e
   *    a normalizacao trabalham. Quem altera o que `rotas()` devolveu nao altera
   *    o que esta registrado — e e isso que faz do ponto de extensao um filtro
   *    de leitura e nao uma porta de escrita no registro.
   * 2. **Aqui dispara o ponto de extensao `rest_endpoints`** (`:974`), que
   *    recebe o mapa e pode devolver outro — logo pode **acrescentar, tirar e
   *    trocar** rota depois do registro. E ponto de extensao, logo e produto
   *    (P2), e fica declarado neste docblock porque o barramento de ganchos nao
   *    tem tarefa neste pacote (REQ-162 esta em `do-not-rewrite.md`). A posicao
   *    e **depois** do recorte por espaco de nome e **antes** da normalizacao:
   *    quem o acrescentar poe exatamente ali.
   * 3. ⚠️ **Este leitor ESCREVE**, e T002 reproduziu: ele normaliza os
   *    tratadores e popula as opcoes da rota. Ver o cabecalho deste arquivo e
   *    {@link RegistroDeRotas.opcoesDaRota}.
   * 4. **O recorte limita tambem a escrita.** O `foreach` da normalizacao roda
   *    sobre o conjunto **ja recortado** (`:985`), logo `rotas( 'wp/v2' )`
   *    popula as opcoes das rotas daquele espaco de nome e **nao** das outras.
   *    Tem teste.
   *
   * @param espacoDeNome Quando informado, so as rotas daquele espaco de nome.
   *   Texto vazio vale como "todas", porque no legado o recorte esta atras de um
   *   `if ( $route_namespace )` (`:960`) e o default do parametro e `''`
   *   (`:957`).
   */
  rotas(espacoDeNome?: string): MapaDeRotas;

  /**
   * As opcoes de uma rota, ou `null` quando nao ha nenhuma — `null` e o retorno
   * declarado do legado para rota ausente (`:1048`-`:1052`), e **nao** um mapa
   * vazio. A diferenca e visivel para quem chama.
   *
   * ⚠️ **Enquanto `rotas()` nao for chamada, isto devolve `null` para toda
   * rota**, inclusive para rota que declarou opcao, porque e o leitor que move a
   * opcao de lugar (`:998`-`:1002`). Depois de `rotas()`, **toda** rota do
   * recorte tem entrada, ainda que vazia (`:992`-`:994`) — logo o `null`
   * tambem some para quem nunca declarou opcao nenhuma. E acoplamento, e esta
   * reproduzido de proposito: ver o cabecalho deste arquivo.
   *
   * Devolve copia, pelo mesmo motivo de {@link RegistroDeRotas.rotas}: no legado
   * o vetor sai por valor, e quem o altera nao altera o registro.
   */
  opcoesDaRota(caminho: string): OpcoesDaRota | null;
}

/** O que o armazem de caminhos guarda: os tratadores e as opcoes, separados. */
interface RotaRegistrada {
  readonly tratadores: readonly DeclaracaoDeRota[];
  readonly opcoes: OpcoesDeclaradasDaRota;
}

/**
 * Cria um registro de rotas vazio.
 *
 * Nao recebe nada e nao resolve nada: `EXT-ORDEM` (BR-MIGRAR-106) poe a ordem de
 * arranque no contrato publico, e a tabela *Nao negociavel* da constituicao poe
 * *"mudar a ordem de carregamento do arranque"* fora do que este agente decide.
 * No legado o povoamento acontece em `rest_api_init`, que dispara **depois** de
 * o servidor existir (`wp-includes/rest-api.php:644`-`:657`) — construir e
 * povoar sao dois momentos, e os dois sao contrato.
 *
 * Cada chamada devolve um registro novo, com armazens proprios. Ver a nota de
 * {@link RegistroDeRotas} sobre por que o global do legado nao se reproduz como
 * estado de modulo.
 */
export function criarRegistroDeRotas(): RegistroDeRotas {
  /** `$this->namespaces` — espaco de nome para os caminhos dele. */
  const porEspacoDeNome = new Map<string, Map<string, true>>();
  /** `$this->endpoints` — caminho para os tratadores e as opcoes dele. */
  const porCaminho = new Map<string, RotaRegistrada>();
  /** `$this->route_options` — caminho para as opcoes da rota, **depois** do leitor. */
  const porRota = new Map<string, Map<string, DeclaracaoDeOpcaoDeRota>>();

  function registrar(
    espacoDeNome: string,
    caminho: string,
    argumentos: ArgumentosDaRota,
    sobrepor = false,
  ): void {
    let caminhosDoEspacoDeNome = porEspacoDeNome.get(espacoDeNome);

    if (caminhosDoEspacoDeNome === undefined) {
      // `:901`: a lista nasce ANTES da recursao, e e so por isso que a
      // recursao termina — a segunda chamada ja encontra o espaco de nome.
      caminhosDoEspacoDeNome = new Map();
      porEspacoDeNome.set(espacoDeNome, caminhosDoEspacoDeNome);

      registrar(espacoDeNome, `/${espacoDeNome}`, {
        tratadores: [declaracaoDoIndiceDeEspacoDeNome(espacoDeNome)],
      });
    }

    // `:924` — chave, nao item: registrar o mesmo caminho duas vezes nao o
    // duplica na lista do espaco de nome.
    caminhosDoEspacoDeNome.set(caminho, true);

    // `:926` — o espaco de nome e estampado DENTRO dos argumentos, e por nao
    // ser chave numerica o leitor o move para as opcoes da rota.
    const opcoes: OpcoesDeclaradasDaRota = {
      ...argumentos.opcoes,
      [OPCAO_DO_ESPACO_DE_NOME]: espacoDeNome,
    };

    const existente = porCaminho.get(caminho);

    if (sobrepor || existente === undefined) {
      porCaminho.set(caminho, { tratadores: argumentos.tratadores, opcoes });
      return;
    }

    // `:931` — `array_merge`: tratador novo vai para o fim, opcao nova vence.
    porCaminho.set(caminho, {
      tratadores: [...existente.tratadores, ...argumentos.tratadores],
      opcoes: { ...existente.opcoes, ...opcoes },
    });
  }

  return {
    registrar,

    espacosDeNome() {
      return [...porEspacoDeNome.keys()];
    },

    rotas(espacoDeNome) {
      // `$endpoints = $this->endpoints;` (`:958`): a copia vem primeiro, e e
      // ela que sai.
      const copia = new Map(porCaminho);

      // `:960`-`:962`: o recorte sai do `namespace` estampado nas opcoes, e nao
      // do indice de espacos de nome. Ver o achado 2 do cabecalho — os dois
      // discordam quando o mesmo caminho entra sob dois espacos de nome.
      const selecionadas =
        espacoDeNome === undefined || espacoDeNome === ''
          ? copia
          : new Map(
              [...copia].filter(
                ([, rota]) =>
                  rota.opcoes[OPCAO_DO_ESPACO_DE_NOME] === espacoDeNome,
              ),
            );

      // O ponto de extensao `rest_endpoints` (`:974`) entra AQUI, sobre o
      // conjunto recortado e antes da normalizacao. Ver a propriedade 2 de
      // `RegistroDeRotas.rotas`.

      const normalizadas = new Map<string, readonly TratadorDeRota[]>();

      for (const [caminho, rota] of selecionadas) {
        // `:992`-`:994`: a entrada de opcoes passa a existir, ainda que vazia.
        let opcoesDaRota = porRota.get(caminho);
        if (opcoesDaRota === undefined) {
          opcoesDaRota = new Map();
          porRota.set(caminho, opcoesDaRota);
        }

        // `:998`-`:1002`: a chave nao numerica muda de lugar — sai da lista de
        // tratadores e entra nas opcoes da rota.
        for (const [nome, valor] of Object.entries(rota.opcoes)) {
          opcoesDaRota.set(nome, valor);
        }

        // `:1005`-`:1021`: os cinco defaults e a reparticao dos metodos.
        normalizadas.set(caminho, rota.tratadores.map(normalizarTratador));
      }

      return normalizadas;
    },

    opcoesDaRota(caminho) {
      // `isset()` e `null`, nao mapa vazio (`:1048`-`:1052`).
      const opcoes = porRota.get(caminho);
      return opcoes === undefined ? null : new Map(opcoes);
    },
  };
}
