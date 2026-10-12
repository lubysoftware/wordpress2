/**
 * O registro de uma rota pela **funcao** — `register_rest_route()`
 * (`wp-includes/rest-api.php:34`-`:156`), e com ele o aviso de uso indevido que
 * esta tarefa entrega.
 *
 * Tarefa **T002** da feature `013-superficies-programaticas`, cuja entrega e
 * *"... e o registro de uma rota sem declaracao de permissao reproduz o aviso de
 * uso indevido do legado"*. `satisfaz: — (infraestrutura)`.
 *
 * ---
 *
 * ## Por que isto e um arquivo separado de `./registro-de-rotas.ts`
 *
 * Porque no legado sao duas coisas, e a diferenca entre elas e **a** diferenca
 * que importa nesta feature: o **metodo** `WP_REST_Server::register_route()`
 * nao confere nada e nao avisa nada; a **funcao** `register_rest_route()` faz
 * seis conferencias, emite seis avisos de uso indevido, aplica tres defaults e
 * so entao chama o metodo. O proprio legado documenta o desvio, em
 * `rest-api.php:37`-`:40`: quem precisa de rota sem espaco de nome *"chama
 * `WP_REST_Server::register_route` direto"* — e com isso contorna os seis
 * avisos. Juntar os dois num arquivo fecharia um caminho publicado (P8).
 *
 * ## 🔴 A camada de rotas falha ABERTA, e esta tarefa e a que escreve o aviso
 *
 * Rota registrada **sem** declaracao de permissao **funciona**. A funcao emite
 * {@link avisoDePermissaoNaoDeclarada} e registra a rota do mesmo jeito, e o
 * texto do aviso ensina a declarar liberacao explicita para rota publica. E
 * `I7` / BR-MIGRAR-074, ancora `rest-api.php:122`.
 *
 * **T002 preserva, e isso nao e uma escolha desta tarefa — e o que o pacote
 * manda, e a propria linha da tarefa diz.** O estado do conflito, que T001
 * registrou em `../README.md` secao *O que ninguem decidiu* item 1, continua
 * aberto e nao foi resolvido aqui:
 *
 * | artefato | o que diz |
 * |---|---|
 * | a linha de **T002** em `tasks.md` | *"o registro de uma rota sem declaracao de permissao **reproduz** o aviso de uso indevido do legado"* |
 * | `I7` / BR-MIGRAR-074 | rota sem `permission_callback` *"funciona, emitindo apenas aviso de uso indevido desde a 5.5.0"* |
 * | `BR-HUMANA-008` | *"`BC-09` reproduz a falha ABERTA por padrao, como o legado. Mudar isso produz um sistema mais fechado que o legado, e e decisao humana"* |
 * | `spec.md`, *Riscos* 1 | *"fecha-la e divergir sem card que autorize, porque REQ-138 ficou fora"* |
 * | `parity_tests/18-...feature`, `@divida-herdada` | *"nenhuma das duas nega por ausencia de declaracao"* |
 * | o **P1** da constituicao | divergir do observavel exige decisao humana registrada e citada no codigo. Sao exatamente tres, e nenhuma e esta |
 * | `UC-44`, *O que um porte precisa saber* | 🔴 *"num porte, essa e a inversao mais importante a **nao copiar**"* |
 *
 * A ultima linha e a unica em sentido contrario, e ela e uma frase. **Preservar
 * nao precisa de referencia; fechar precisaria, e a referencia nao existe** —
 * REQ-138, que fecharia a falha, ficou `bloqueado` e nao entrou no pacote
 * (`spec.md`, *Perguntas em aberto*). O cenario `@divida-herdada` cobra ainda
 * que *"esta divergencia de default esteja declarada como divida herdada nas
 * duas metades"*: esta declaracao, este docblock e a secao do `../README.md` sao
 * a metade nova dela.
 *
 * ## Os seis avisos, na ordem, e o que cada um faz com o registro
 *
 * | # | quando | ancora | versao | recusa o registro? |
 * |---|---|---|---|---|
 * | 1 | espaco de nome vazio | `:41`-`:50` | 4.4.0 | **sim**, devolve `false` |
 * | 2 | caminho vazio | `:53`-`:62` | 4.4.0 | **sim**, devolve `false` |
 * | 3 | espaco de nome com barra na ponta | `:69`-`:78` | 5.4.2 | nao — segue com o nome aparado |
 * | 4 | registro fora do gancho de inicializacao | `:82`-`:91` | 5.1.0 | nao |
 * | 5 | **declaracao de permissao ausente** | `:123`-`:133` | 5.5.0 | **nao** — e a falha aberta |
 * | 6 | argumento que nao e vetor | `:138`-`:147` | 6.1.0 | nao — para de conferir os outros |
 *
 * Os seis textos ficam **em ingles**, pela razao de `EC-05` registrada em
 * `contextos/classificacao/registro/erro-de-registro.ts`: *"o `msgid` em ingles
 * E a chave do catalogo"*, e traduzir aqui trocaria a chave.
 *
 * ## O que esta declarado e nao emitido, e por que
 *
 * O **aviso 4** depende de saber se o gancho `rest_api_init` ja disparou
 * (`did_action()`), e o barramento de ganchos **nao tem tarefa neste pacote** —
 * REQ-162 esta em `do-not-rewrite.md`. Ele fica declarado em
 * {@link avisoDeRegistroForaDoGancho}, com o texto e a versao, no arquivo que o
 * emitiria: e o mesmo tratamento que T001 deu a `rest_endpoints` e a
 * `rest_pre_dispatch`. Quem ligar o barramento liga o gatilho; ninguem precisa
 * reescrever a mensagem.
 *
 * O **aviso 6** confere se cada argumento e vetor. {@link EsquemaDeArgumento}
 * torna isso impossivel para quem chama com tipos — mas o slot de entrega desta
 * stack e *"compilado para JavaScript"*, e em JavaScript todo chamador de
 * terceiro e sem tipo. A conferencia fica, porque o aviso e contrato para quem
 * estende (a mesma ressalva de BR-MIGRAR-091) e porque remove-la trocaria o
 * aviso por um erro de tipo em execucao, mais adiante e menos informativo.
 *
 * ## 🔴 O que o formato tipado torna inalcancavel, e esta registrado
 *
 * No legado, `$args` e **um vetor so** em que chave numerica e tratador e chave
 * nao numerica e opcao da rota, e ha um atalho: *"upgrade a single set to
 * multiple"* (`:102`-`:105`), acionado por `isset( $args['callback'] )`. Como e
 * `isset`, um tratador unico declarado com `'callback' => null` **nao** e
 * promovido — e entao todas as chaves dele sao nao numericas, nenhum tratador e
 * registrado e `callback` e `methods` viram **opcoes da rota**. E uma rota que
 * existe no armazem e nao atende nada.
 *
 * {@link ArgumentosDeRegistroDeRota} separa tratadores de opcoes e torna esse
 * caminho inalcancavel. Nao e descarte: e consequencia do formato, declarada
 * aqui e em `../README.md`. Quem um dia expuser esta funcao a um chamador sem
 * tipo decide se reproduz a promocao por `isset`.
 */

import type {
  AvisoDeUsoIndevido,
  RelatorDeUsoIndevido,
} from '../../../plataforma/autorizacao/index.js';

import {
  PADROES_DO_TRATADOR_NA_FUNCAO_DE_REGISTRO,
  avisoDePermissaoNaoDeclarada,
  type ArgumentosDaRota,
  type DeclaracaoDeRota,
  type EsquemaDeArgumento,
  type EsquemaDosArgumentos,
  type OpcoesDeclaradasDaRota,
} from './esquema-de-rota.js';
import type { RegistroDeRotas } from './registro-de-rotas.js';

/** A funcao que o legado nomeia nos seis avisos — `__FUNCTION__`. */
export const FUNCAO_DE_REGISTRO_DE_ROTA_DE_API = 'register_rest_route';

/** O gancho em que o legado espera que o registro aconteca (`:81`). */
export const GANCHO_DE_REGISTRO_DE_ROTA = 'rest_api_init';

/** Aviso 1 — espaco de nome vazio (`:41`-`:50`). Recusa o registro. */
export function avisoDeEspacoDeNomeVazio(
  espacoDeNome: string,
  caminho: string,
): AvisoDeUsoIndevido {
  return {
    funcao: FUNCAO_DE_REGISTRO_DE_ROTA_DE_API,
    mensagem:
      'Routes must be namespaced with plugin or theme name and version. ' +
      `Instead there seems to be an empty namespace '<code>${espacoDeNome}</code>' ` +
      `for route '<code>${caminho}</code>'.`,
    versao: '4.4.0',
  };
}

/** Aviso 2 — caminho vazio (`:53`-`:62`). Recusa o registro. */
export function avisoDeCaminhoVazio(
  espacoDeNome: string,
  caminho: string,
): AvisoDeUsoIndevido {
  return {
    funcao: FUNCAO_DE_REGISTRO_DE_ROTA_DE_API,
    mensagem:
      `Route must be specified. Instead within the namespace '<code>${espacoDeNome}</code>', ` +
      `there seems to be an empty route '<code>${caminho}</code>'.`,
    versao: '4.4.0',
  };
}

/**
 * Aviso 3 — espaco de nome com barra na ponta (`:69`-`:78`).
 *
 * ⚠️ **Nao recusa**: o legado avisa e segue com o nome aparado, e e com o nome
 * aparado que a rota fica registrada. O aviso carrega o nome **como veio**.
 */
export function avisoDeEspacoDeNomeComBarra(
  espacoDeNome: string,
  caminho: string,
): AvisoDeUsoIndevido {
  return {
    funcao: FUNCAO_DE_REGISTRO_DE_ROTA_DE_API,
    mensagem:
      'Namespace must not start or end with a slash. Instead namespace ' +
      `'<code>${espacoDeNome}</code>' for route '<code>${caminho}</code>' ` +
      'seems to contain a slash.',
    versao: '5.4.2',
  };
}

/**
 * Aviso 4 — registro fora do gancho de inicializacao (`:82`-`:91`).
 *
 * 🔴 **Declarado e nao emitido**: o gatilho e `did_action( 'rest_api_init' )`, e
 * o barramento de ganchos nao tem tarefa neste pacote. Ver o cabecalho.
 */
export function avisoDeRegistroForaDoGancho(
  espacoDeNome: string,
  caminho: string,
): AvisoDeUsoIndevido {
  return {
    funcao: FUNCAO_DE_REGISTRO_DE_ROTA_DE_API,
    mensagem:
      `REST API routes must be registered on the <code>${GANCHO_DE_REGISTRO_DE_ROTA}</code> ` +
      `action. Instead route '<code>${caminho}</code>' with namespace ` +
      `'<code>${espacoDeNome}</code>' was not registered on this action.`,
    versao: '5.1.0',
  };
}

/** Aviso 6 — argumento que nao e vetor (`:138`-`:147`). */
export function avisoDeArgumentoQueNaoEVetor(
  caminhoSemBarra: string,
): AvisoDeUsoIndevido {
  return {
    funcao: FUNCAO_DE_REGISTRO_DE_ROTA_DE_API,
    mensagem:
      'REST API <code>$args</code> should be an array of arrays. ' +
      `Non-array value detected for <code>${caminhoSemBarra}</code>.`,
    versao: '6.1.0',
  };
}

/**
 * Os argumentos que a **funcao** de registro recebe.
 *
 * E {@link ArgumentosDaRota} mais o esquema comum, que so existe nesta camada:
 * o metodo nao o conhece.
 */
export interface ArgumentosDeRegistroDeRota {
  /**
   * `$args['args']` — o esquema **comum**, mesclado no `argumentos` de **cada**
   * tratador (`rest-api.php:95`-`:100` e `:120`).
   *
   * ⚠️ Tres coisas dele:
   *
   * 1. E retirado dos argumentos antes de qualquer outra coisa (`:97`), logo
   *    **nao** vira opcao da rota como as outras chaves nao numericas viram.
   * 2. A mescla e `array_merge( $common_args, $arg_group['args'] )`: o do
   *    tratador **vence** o comum, argumento por argumento, e a mescla e rasa —
   *    declarar `type` no comum e `enum` no tratador nao soma os dois no mesmo
   *    argumento, substitui o argumento inteiro.
   * 3. A mescla acontece **antes** da conferencia de permissao (`:120` e
   *    `:122`), logo o esquema comum nao tem como suprir a permissao que falta.
   */
  readonly argumentosComuns?: EsquemaDosArgumentos;
  /** Os tratadores — as chaves numericas de `$args`. */
  readonly tratadores: readonly DeclaracaoDeRota[];
  /** As opcoes da rota — as outras chaves nao numericas de `$args`. */
  readonly opcoes?: OpcoesDeclaradasDaRota;
}

/** O pedido de registro, com os quatro argumentos que o legado recebe. */
export interface PedidoDeRegistroDeRotaDeApi {
  /** `$route_namespace` — *"o primeiro segmento depois do prefixo do nucleo"*. */
  readonly espacoDeNome: string;
  /** `$route` — o caminho dentro do espaco de nome. */
  readonly caminho: string;
  /** `$args`. O default do legado e vetor vazio, logo nenhum tratador. */
  readonly argumentos?: ArgumentosDeRegistroDeRota;
  /**
   * `$override`. `false` **mescla** com a rota que ja existe, e o legado
   * descreve a mescla como *"newer overriding if duplicate keys exist"*.
   */
  readonly sobrepor?: boolean;
}

/**
 * `empty()` para um texto: verdadeiro para vazio **e para `'0'`**.
 *
 * ⚠️ Nao e curiosidade de PHP sem consequencia: e por causa dela que um espaco
 * de nome chamado `0`, ou um caminho chamado `0`, sao recusados pelos avisos 1 e
 * 2 em vez de registrados. Um porte que comparasse so com texto vazio
 * registraria rota que o legado recusa.
 */
function vazioComoNoLegado(texto: string): boolean {
  return texto === '' || texto === '0';
}

/**
 * Aplica em um tratador os tres defaults da **funcao** de registro e mescla o
 * esquema comum (`rest-api.php:107`-`:120`).
 *
 * ⚠️ Os defaults daqui nao sao os do leitor: `metodos` nasce `'GET'` aqui e
 * `''` la. Ver o achado 2 do cabecalho de `./esquema-de-rota.ts`.
 *
 * ⚠️ `array_merge( $defaults, $arg_group )` deixa a chave presente vencer, mesmo
 * nula — e por isso a pergunta e se a chave existe, e nao se o valor e nulo.
 */
function aplicarPadroesDaFuncao(
  tratador: DeclaracaoDeRota,
  argumentosComuns: EsquemaDosArgumentos,
): DeclaracaoDeRota {
  const padroes = PADROES_DO_TRATADOR_NA_FUNCAO_DE_REGISTRO;

  const proprios =
    'argumentos' in tratador
      ? (tratador.argumentos ?? padroes.argumentos)
      : padroes.argumentos;

  return {
    ...tratador,
    metodos: 'metodos' in tratador ? (tratador.metodos ?? null) : padroes.metodos,
    funcao: 'funcao' in tratador ? (tratador.funcao ?? null) : padroes.funcao,
    // `:120` — o do tratador vence o comum, e a mescla e rasa.
    argumentos: { ...argumentosComuns, ...proprios },
  };
}

/**
 * Registra uma rota pela funcao — `register_rest_route()`.
 *
 * Devolve `true` no sucesso e `false` **so** nos avisos 1 e 2, como o legado
 * (`:32`: *"True on success, false on error"*). Os outros quatro avisos nao
 * mudam o retorno: a rota entra.
 *
 * @param registro O registro desta requisicao. No legado e
 *   `rest_get_server()`, que resolve um global; aqui chega por argumento, porque
 *   `EXT-CONTEXTO` (BR-MIGRAR-105) poe o registro no escopo da requisicao.
 * @param avisar Quem recebe o aviso de uso indevido, quando houver. **E
 *   opcional, e e so escrita**: nenhuma ramificacao desta funcao consulta o
 *   resultado dela, que e o que o **P7** cobra — ausente, o registro acontece
 *   igual.
 */
export function registrarRotaDeApi(
  registro: RegistroDeRotas,
  pedido: PedidoDeRegistroDeRotaDeApi,
  avisar?: RelatorDeUsoIndevido,
): boolean {
  const { espacoDeNome, caminho } = pedido;

  // Aviso 1 (`:35`-`:51`): recusa, e a mensagem carrega os dois como vieram.
  if (vazioComoNoLegado(espacoDeNome)) {
    avisar?.(avisoDeEspacoDeNomeVazio(espacoDeNome, caminho));
    return false;
  }

  // Aviso 2 (`:52`-`:63`).
  if (vazioComoNoLegado(caminho)) {
    avisar?.(avisoDeCaminhoVazio(espacoDeNome, caminho));
    return false;
  }

  // `:66` — o aparo e o que vale dali para frente.
  const espacoDeNomeAparado = aparar(espacoDeNome, '/');

  // Aviso 3 (`:68`-`:79`): avisa e SEGUE.
  if (espacoDeNomeAparado !== espacoDeNome) {
    avisar?.(avisoDeEspacoDeNomeComBarra(espacoDeNome, caminho));
  }

  // Aviso 4 (`:81`-`:92`): declarado e nao emitido — ver o cabecalho. O
  // barramento que responderia `did_action( 'rest_api_init' )` nao existe nesta
  // arvore, e `avisoDeRegistroForaDoGancho()` guarda o texto e a versao para
  // quem o ligar.

  const argumentos = pedido.argumentos;
  const argumentosComuns = argumentos?.argumentosComuns ?? {};

  // `:128` — o caminho que os avisos 5 e 6 nomeiam NAO tem a barra inicial, ao
  // contrario do caminho com que a rota e registrada em `:153`.
  const caminhoSemBarra = `${espacoDeNomeAparado}/${aparar(caminho, '/')}`;

  const tratadores: DeclaracaoDeRota[] = [];

  for (const tratador of argumentos?.tratadores ?? []) {
    const comPadroes = aplicarPadroesDaFuncao(tratador, argumentosComuns);

    // Aviso 5 (`:122`-`:134`) — `isset()` e falso para nulo, logo permissao
    // nula conta como ausente. A ROTA ENTRA DE QUALQUER FORMA: e a falha
    // ABERTA de `I7`, e e o que esta tarefa entrega.
    if (comPadroes.permissao === undefined || comPadroes.permissao === null) {
      avisar?.(avisoDePermissaoNaoDeclarada(caminhoSemBarra));
    }

    // Aviso 6 (`:136`-`:150`) — e o `break` do legado: encontrado um argumento
    // que nao e vetor, a conferencia dos outros para.
    for (const argumento of Object.values(comPadroes.argumentos ?? {})) {
      if (!ehVetorComoNoLegado(argumento)) {
        avisar?.(avisoDeArgumentoQueNaoEVetor(caminhoSemBarra));
        break;
      }
    }

    tratadores.push(comPadroes);
  }

  // `:153`-`:155` — aqui o caminho ganha a barra inicial.
  const caminhoCompleto = `/${caminhoSemBarra}`;

  const argumentosDaRota: ArgumentosDaRota =
    argumentos?.opcoes === undefined
      ? { tratadores }
      : { tratadores, opcoes: argumentos.opcoes };

  registro.registrar(
    espacoDeNomeAparado,
    caminhoCompleto,
    argumentosDaRota,
    pedido.sobrepor ?? false,
  );

  return true;
}

/** `trim( $texto, $caractere )` — tira o caractere das duas pontas. */
function aparar(texto: string, caractere: string): string {
  let inicio = 0;
  let fim = texto.length;
  while (inicio < fim && texto[inicio] === caractere) {
    inicio += 1;
  }
  while (fim > inicio && texto[fim - 1] === caractere) {
    fim -= 1;
  }
  return texto.slice(inicio, fim);
}

/**
 * `is_array( $arg )` para um esquema de argumento.
 *
 * O vetor associativo do legado chega aqui como objeto; `null` nao e vetor, e
 * uma lista **e**. Ver o cabecalho sobre por que esta conferencia fica mesmo
 * sendo inalcancavel por um chamador com tipos.
 */
function ehVetorComoNoLegado(argumento: EsquemaDeArgumento): boolean {
  return typeof argumento === 'object' && argumento !== null;
}
