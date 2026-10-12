/**
 * Testes da entrega de **T002**, metade do esquema de rota: *"o formato existe
 * como declaracao, com validacao de parametro ainda vazia, e o registro de uma
 * rota sem declaracao de permissao reproduz o aviso de uso indevido do legado"*.
 *
 * Nao sao os testes de nenhuma historia — esses sao T004, T006 e os demais `[P]`
 * de `tasks.md`, um por caso de `backlog/tests.md`. `satisfaz: —
 * (infraestrutura)`.
 *
 * O arquivo gemeo e `../operacao-nomeada/esquema-de-operacao-nomeada.test.ts`, e
 * a leitura dos dois lado a lado e o ponto: aqui a camada **atende** sem
 * declaracao de permissao, la ela **recusa**.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import type { AvisoDeUsoIndevido } from '../../../plataforma/autorizacao/index.js';

import {
  ATALHOS_DE_METODO,
  OPCAO_DO_ESPACO_DE_NOME,
  PADROES_DO_TRATADOR_NA_FUNCAO_DE_REGISTRO,
  PADROES_DO_TRATADOR_NO_LEITOR,
  PALAVRAS_CHAVE_DE_ESQUEMA_PUBLICADAS,
  avisoDePermissaoNaoDeclarada,
  normalizarMetodos,
  normalizarTratador,
  type DeclaracaoDeRota,
} from './esquema-de-rota.js';
import { registrarRotaDeApi } from './registro-de-rota-de-api.js';
import { criarRegistroDeRotas } from './registro-de-rotas.js';
import { conferirParametros, conferirValor } from './validacao-de-parametro.js';

/** Coleta os avisos de uso indevido, para afirmar texto, versao e ordem. */
function coletorDeAvisos(): {
  avisar: (aviso: AvisoDeUsoIndevido) => void;
  avisos: AvisoDeUsoIndevido[];
} {
  const avisos: AvisoDeUsoIndevido[] = [];
  return { avisar: (aviso) => void avisos.push(aviso), avisos };
}

/** Uma funcao de rota qualquer: nenhum teste desta tarefa a chama. */
const funcaoQualquer = (): unknown => null;

test('os cinco atalhos de metodo tem o valor do legado, inclusive os dois com virgula', () => {
  // `class-wp-rest-server.php:24`, `:32`, `:40`, `:48`, `:56`. Os nomes das
  // chaves sao constante publicada (P8) e por isso nao foram traduzidos.
  assert.deepEqual({ ...ATALHOS_DE_METODO }, {
    READABLE: 'GET',
    CREATABLE: 'POST',
    EDITABLE: 'POST, PUT, PATCH',
    DELETABLE: 'DELETE',
    ALLMETHODS: 'GET, POST, PUT, PATCH, DELETE',
  });
});

test('as 25 palavras-chave publicadas sao as do legado, na ordem, e `required` nao esta entre elas', () => {
  // `rest-api.php:2169`-`:2197`. A ordem importa porque e a lista que recorta o
  // esquema publicado no mapa da superficie (T007).
  assert.equal(PALAVRAS_CHAVE_DE_ESQUEMA_PUBLICADAS.length, 25);
  assert.equal(PALAVRAS_CHAVE_DE_ESQUEMA_PUBLICADAS[0], 'title');
  assert.equal(PALAVRAS_CHAVE_DE_ESQUEMA_PUBLICADAS[24], 'oneOf');

  // ⚠️ `required` e acrescentado a mao pelo indice (`:1687`), sempre, e por
  // isso NAO esta na lista. Um porte que o incluisse aqui o publicaria duas
  // vezes.
  assert.ok(
    !(PALAVRAS_CHAVE_DE_ESQUEMA_PUBLICADAS as readonly string[]).includes(
      'required',
    ),
  );
});

test('os defaults do tratador sao DOIS conjuntos diferentes, e `metodos` e o que os separa', () => {
  // O achado 2 do cabecalho de `esquema-de-rota.ts`: a funcao de registro
  // mescla `'GET'` (`rest-api.php:108`) e o leitor mescla `''`
  // (`class-wp-rest-server.php:978`).
  assert.equal(PADROES_DO_TRATADOR_NA_FUNCAO_DE_REGISTRO.metodos, 'GET');
  assert.equal(PADROES_DO_TRATADOR_NO_LEITOR.metodos, '');
  assert.equal(PADROES_DO_TRATADOR_NO_LEITOR.mostrarNoIndice, true);
  assert.equal(PADROES_DO_TRATADOR_NO_LEITOR.aceitarJson, false);
  assert.equal(PADROES_DO_TRATADOR_NO_LEITOR.aceitarBruto, false);
});

test('`metodos` e repartido nas tres formas do legado, em maiusculas e sem espaco', () => {
  // `class-wp-rest-server.php:1007`-`:1021`.
  assert.deepEqual(normalizarMetodos(ATALHOS_DE_METODO.EDITABLE), {
    POST: true,
    PUT: true,
    PATCH: true,
  });
  assert.deepEqual(normalizarMetodos(['get', ' delete ']), {
    GET: true,
    DELETE: true,
  });
  assert.deepEqual(normalizarMetodos({ GET: true }), { GET: true });

  // O `else` de `:1012`: qualquer outra coisa vale NENHUM metodo, e e isso que
  // esconde a rota do indice (`:1707`).
  assert.deepEqual(normalizarMetodos(null), {});
  assert.deepEqual(normalizarMetodos(undefined), {});
});

test('a normalizacao pergunta se a chave existe, e nao se o valor e nulo', () => {
  // O achado 4: `wp_parse_args()` e `array_merge( $defaults, $args )`, logo
  // chave presente com nulo sobrescreve o default — e `mostrarNoIndice: null`
  // esconde a rota, porque o indice testa com `empty()` (`:1662`).
  const escondida = normalizarTratador({
    metodos: 'GET',
    funcao: funcaoQualquer,
    mostrarNoIndice: null,
  });
  assert.equal(escondida.mostrarNoIndice, null);

  const visivel = normalizarTratador({ metodos: 'GET', funcao: funcaoQualquer });
  assert.equal(visivel.mostrarNoIndice, true);
});

test('a validacao de parametro esta declarada e VAZIA: nada foi conferido', () => {
  // E a entrega literal de T002, *"com validacao de parametro ainda vazia"*, e
  // `conferido: false` e o que impede que a ausencia de recusa seja lida como
  // aprovacao. T005 (US-2) passa a devolver `true`.
  const conferencia = conferirParametros(
    { per_page: 'nao e numero' },
    { per_page: { type: 'integer', minimum: 1, maximum: 100 } },
  );
  assert.equal(conferencia.conferido, false);
  assert.deepEqual(conferencia.recusados, []);

  const umValor = conferirValor('nao e numero', { type: 'integer' }, 'per_page');
  assert.equal(umValor.conferido, false);
  assert.deepEqual(umValor.recusados, []);
});

test('🔴 rota sem declaracao de permissao FUNCIONA, e emite o aviso do legado (I7)', () => {
  // A entrega desta tarefa, e a camada de autorizacao que falha ABERTA:
  // `rest-api.php:122`-`:133`, `I7` / BR-MIGRAR-074, cenario `@divida-herdada`
  // de `parity_tests/18-superficies-de-escrita-paralelas.feature`.
  const registro = criarRegistroDeRotas();
  const { avisar, avisos } = coletorDeAvisos();

  const resultado = registrarRotaDeApi(
    registro,
    {
      espacoDeNome: 'wp/v2',
      caminho: '/posts',
      argumentos: {
        tratadores: [
          { metodos: ATALHOS_DE_METODO.CREATABLE, funcao: funcaoQualquer },
        ],
      },
    },
    avisar,
  );

  // 1. A rota ENTRA. "Nenhuma das duas nega por ausencia de declaracao."
  assert.equal(resultado, true);
  const rotas = registro.rotas();
  assert.ok(rotas.has('/wp/v2/posts'));
  assert.deepEqual(rotas.get('/wp/v2/posts')?.[0]?.metodos, { POST: true });

  // 2. E o aviso sai, com o texto que ENSINA a liberacao explicita.
  assert.equal(avisos.length, 1);
  assert.deepEqual(avisos[0], avisoDePermissaoNaoDeclarada('wp/v2/posts'));
  assert.equal(avisos[0]?.funcao, 'register_rest_route');
  assert.equal(avisos[0]?.versao, '5.5.0');
  assert.match(avisos[0]?.mensagem ?? '', /<code>__return_true<\/code>/);
  assert.match(
    avisos[0]?.mensagem ?? '',
    /missing the required <code>permission_callback<\/code> argument/,
  );

  // 3. ⚠️ O caminho do aviso NAO tem a barra inicial, e o da rota tem
  // (`:128` contra `:153`).
  assert.match(avisos[0]?.mensagem ?? '', /<code>wp\/v2\/posts<\/code>/);
});

test('🔴 `permissao: null` tambem avisa, porque `isset()` e falso para nulo', () => {
  // O achado 1: declarar a permissao como nula nao e declarar.
  const registro = criarRegistroDeRotas();
  const { avisar, avisos } = coletorDeAvisos();

  registrarRotaDeApi(
    registro,
    {
      espacoDeNome: 'wp/v2',
      caminho: '/posts',
      argumentos: {
        tratadores: [{ metodos: 'GET', funcao: funcaoQualquer, permissao: null }],
      },
    },
    avisar,
  );

  assert.equal(avisos.length, 1);
  assert.equal(avisos[0]?.versao, '5.5.0');
});

test('rota COM declaracao de permissao nao avisa nada', () => {
  const registro = criarRegistroDeRotas();
  const { avisar, avisos } = coletorDeAvisos();

  registrarRotaDeApi(
    registro,
    {
      espacoDeNome: 'wp/v2',
      caminho: '/posts',
      argumentos: {
        tratadores: [
          { metodos: 'GET', funcao: funcaoQualquer, permissao: () => true },
        ],
      },
    },
    avisar,
  );

  assert.deepEqual(avisos, []);
});

test('o aviso e opcional, e o registro acontece igual sem ele (P7)', () => {
  // *"Acrescentar registro e permitido; fazer o fluxo depender dele troca o
  // produto"*: nenhuma ramificacao consulta o relator.
  const registro = criarRegistroDeRotas();

  const resultado = registrarRotaDeApi(registro, {
    espacoDeNome: 'wp/v2',
    caminho: '/posts',
    argumentos: { tratadores: [{ metodos: 'GET', funcao: funcaoQualquer }] },
  });

  assert.equal(resultado, true);
  assert.ok(registro.rotas().has('/wp/v2/posts'));
});

test('espaco de nome vazio e caminho vazio RECUSAM, e os dois casos incluem `0`', () => {
  // `rest-api.php:35`-`:63`, e `empty()` e verdadeiro para `''` e para `'0'`:
  // um porte que so comparasse com texto vazio registraria rota que o legado
  // recusa.
  const registro = criarRegistroDeRotas();
  const { avisar, avisos } = coletorDeAvisos();

  assert.equal(
    registrarRotaDeApi(
      registro,
      { espacoDeNome: '', caminho: '/posts' },
      avisar,
    ),
    false,
  );
  assert.equal(avisos[0]?.versao, '4.4.0');
  assert.match(avisos[0]?.mensagem ?? '', /^Routes must be namespaced/);

  assert.equal(
    registrarRotaDeApi(
      registro,
      { espacoDeNome: '0', caminho: '/posts' },
      avisar,
    ),
    false,
  );

  assert.equal(
    registrarRotaDeApi(
      registro,
      { espacoDeNome: 'wp/v2', caminho: '' },
      avisar,
    ),
    false,
  );
  assert.match(avisos[2]?.mensagem ?? '', /^Route must be specified/);

  assert.equal(
    registrarRotaDeApi(
      registro,
      { espacoDeNome: 'wp/v2', caminho: '0' },
      avisar,
    ),
    false,
  );

  // Nenhuma das quatro chegou ao registro.
  assert.equal(registro.rotas().size, 0);
  assert.deepEqual(registro.espacosDeNome(), []);
});

test('espaco de nome com barra na ponta avisa e SEGUE, com o nome aparado', () => {
  // `:68`-`:79`, versao 5.4.2: este aviso nao recusa.
  const registro = criarRegistroDeRotas();
  const { avisar, avisos } = coletorDeAvisos();

  const resultado = registrarRotaDeApi(
    registro,
    {
      espacoDeNome: '/wp/v2/',
      caminho: '/posts',
      argumentos: {
        tratadores: [
          { metodos: 'GET', funcao: funcaoQualquer, permissao: () => true },
        ],
      },
    },
    avisar,
  );

  assert.equal(resultado, true);
  assert.equal(avisos.length, 1);
  assert.equal(avisos[0]?.versao, '5.4.2');
  // O aviso carrega o nome COMO VEIO; o registro usa o aparado.
  assert.match(avisos[0]?.mensagem ?? '', /<code>\/wp\/v2\/<\/code>/);
  assert.deepEqual(registro.espacosDeNome(), ['wp/v2']);
  assert.ok(registro.rotas().has('/wp/v2/posts'));
});

test('o esquema comum e mesclado em cada tratador, e o do tratador vence', () => {
  // `rest-api.php:95`-`:100` e `:120`: `array_merge( $comum, $do_tratador )`, e
  // a mescla e rasa — o argumento inteiro e substituido, nao somado.
  const registro = criarRegistroDeRotas();

  registrarRotaDeApi(registro, {
    espacoDeNome: 'wp/v2',
    caminho: '/posts/(?P<id>[\\d]+)',
    argumentos: {
      argumentosComuns: {
        id: { type: 'integer', description: 'do comum' },
        context: { type: 'string' },
      },
      tratadores: [
        {
          metodos: 'GET',
          funcao: funcaoQualquer,
          permissao: () => true,
          argumentos: { id: { type: 'string' } },
        },
      ],
    },
  });

  const tratador = registro.rotas().get('/wp/v2/posts/(?P<id>[\\d]+)')?.[0];
  assert.equal(tratador?.argumentos.id?.type, 'string');
  // A mescla e rasa: `description` do comum NAO sobrevive no mesmo argumento.
  assert.equal(tratador?.argumentos.id?.description, undefined);
  // E o argumento que so o comum declarou continua la.
  assert.equal(tratador?.argumentos.context?.type, 'string');
});

test('o default de `metodos` da funcao de registro e `GET`, e chega ao registro', () => {
  // O achado 2 visto de fora: tratador sem metodo declarado, registrado pela
  // funcao, atende `GET` — e nao desaparece do indice.
  const registro = criarRegistroDeRotas();

  registrarRotaDeApi(registro, {
    espacoDeNome: 'wp/v2',
    caminho: '/posts',
    argumentos: { tratadores: [{ funcao: funcaoQualquer, permissao: () => true }] },
  });

  assert.deepEqual(registro.rotas().get('/wp/v2/posts')?.[0]?.metodos, {
    GET: true,
  });
});

test('🔴 o indice do espaco de nome e registrado sozinho, e ele nao tem declaracao de permissao', () => {
  // `class-wp-rest-server.php:900`-`:921`. E o caso mais limpo da falha aberta:
  // o proprio nucleo tem rota sem declaracao de permissao, e como ela entra
  // pelo METODO, ninguem avisa a respeito.
  const registro = criarRegistroDeRotas();
  const { avisar, avisos } = coletorDeAvisos();

  registrarRotaDeApi(
    registro,
    {
      espacoDeNome: 'wp/v2',
      caminho: '/posts',
      argumentos: {
        tratadores: [
          { metodos: 'GET', funcao: funcaoQualquer, permissao: () => true },
        ],
      },
    },
    avisar,
  );

  const rotas = registro.rotas();
  const indice = rotas.get('/wp/v2')?.[0];

  assert.ok(indice, 'o indice do espaco de nome tem de existir');
  assert.deepEqual(indice?.metodos, { GET: true });
  assert.equal(indice?.permissao, undefined);
  // Os dois argumentos declaram SO `default`, sem `type` (`:910`-`:917`).
  assert.deepEqual(indice?.argumentos, {
    namespace: { default: 'wp/v2' },
    context: { default: 'view' },
  });
  // A funcao e `get_namespace_index`, que e T007. Ate la, nula.
  assert.equal(indice?.funcao, null);
  // E nenhum aviso saiu por causa dela.
  assert.deepEqual(avisos, []);
});

test('registrar o mesmo caminho duas vezes MESCLA: tratador novo no fim, opcao nova vencendo', () => {
  // `:928`-`:932`, `array_merge`: chave numerica renumera e vai para o fim,
  // chave nao numerica sobrescreve.
  const registro = criarRegistroDeRotas();

  registro.registrar('wp/v2', '/wp/v2/posts', {
    tratadores: [{ metodos: 'GET', funcao: funcaoQualquer }],
    opcoes: { allow_batch: { v1: false } },
  });
  registro.registrar('wp/v2', '/wp/v2/posts', {
    tratadores: [{ metodos: 'POST', funcao: funcaoQualquer }],
    opcoes: { allow_batch: { v1: true } },
  });

  const tratadores = registro.rotas().get('/wp/v2/posts');
  assert.equal(tratadores?.length, 2);
  assert.deepEqual(tratadores?.[0]?.metodos, { GET: true });
  assert.deepEqual(tratadores?.[1]?.metodos, { POST: true });
  assert.deepEqual(registro.opcoesDaRota('/wp/v2/posts')?.get('allow_batch'), {
    v1: true,
  });

  // E `sobrepor` troca a rota inteira.
  registro.registrar(
    'wp/v2',
    '/wp/v2/posts',
    { tratadores: [{ metodos: 'DELETE', funcao: funcaoQualquer }] },
    true,
  );
  assert.equal(registro.rotas().get('/wp/v2/posts')?.length, 1);
});

test('🔴 a opcao da rota so existe DEPOIS de `rotas()`, e o leitor so popula o recorte', () => {
  // O acoplamento que T001 deixou para esta tarefa decidir, e que T002
  // reproduziu: e `get_routes()` que move a chave nao numerica para as opcoes
  // (`:992`-`:1002`), logo antes dele `get_route_options()` devolve `null`
  // mesmo para rota que declarou opcao.
  const registro = criarRegistroDeRotas();

  registro.registrar('wp/v2', '/wp/v2/posts', {
    tratadores: [{ metodos: 'GET', funcao: funcaoQualquer }],
    opcoes: { schema: () => ({}) },
  });
  registro.registrar('oembed/1.0', '/oembed/1.0/embed', {
    tratadores: [{ metodos: 'GET', funcao: funcaoQualquer }],
  });

  // Antes do leitor: nulo nos dois.
  assert.equal(registro.opcoesDaRota('/wp/v2/posts'), null);
  assert.equal(registro.opcoesDaRota('/oembed/1.0/embed'), null);

  // Um recorte popula SO o que ele devolve (`:985` roda sobre o recortado).
  registro.rotas('wp/v2');
  assert.ok(registro.opcoesDaRota('/wp/v2/posts') !== null);
  assert.equal(registro.opcoesDaRota('/oembed/1.0/embed'), null);

  // A leitura sem recorte popula o resto — e ate a rota que nao declarou opcao
  // nenhuma passa a ter entrada, ainda que so com o espaco de nome estampado.
  registro.rotas();
  const opcoesDoEmbed = registro.opcoesDaRota('/oembed/1.0/embed');
  assert.deepEqual([...(opcoesDoEmbed?.keys() ?? [])], [
    OPCAO_DO_ESPACO_DE_NOME,
  ]);
  assert.equal(opcoesDoEmbed?.get(OPCAO_DO_ESPACO_DE_NOME), 'oembed/1.0');
});

test('🔴 o recorte por espaco de nome sai do valor ESTAMPADO, e nao do indice', () => {
  // O achado 2 do cabecalho de `registro-de-rotas.ts`: o legado recorta com
  // `wp_list_filter( $endpoints, array( 'namespace' => $ns ) )` (`:961`), e com
  // o mesmo caminho registrado sob dois espacos de nome os dois armazens
  // discordam. T002 passou a recortar como o legado recorta.
  const registro = criarRegistroDeRotas();

  registro.registrar('wp/v2', '/compartilhada', {
    tratadores: [{ metodos: 'GET', funcao: funcaoQualquer }],
  });
  registro.registrar('oembed/1.0', '/compartilhada', {
    tratadores: [{ metodos: 'POST', funcao: funcaoQualquer }],
  });

  // O indice tem o caminho nas DUAS listas...
  assert.deepEqual(registro.espacosDeNome(), ['wp/v2', 'oembed/1.0']);

  // ...e o estampado tem so o ultimo, logo o recorte do primeiro nao a devolve.
  assert.ok(!registro.rotas('wp/v2').has('/compartilhada'));
  assert.ok(registro.rotas('oembed/1.0').has('/compartilhada'));
  assert.ok(registro.rotas().has('/compartilhada'));
});

test('a opcao da rota devolve copia: alterar o que saiu nao altera o registro', () => {
  const registro = criarRegistroDeRotas();

  registro.registrar('wp/v2', '/wp/v2/posts', {
    tratadores: [{ metodos: 'GET', funcao: funcaoQualquer }],
  });
  registro.rotas();

  const primeira = registro.opcoesDaRota('/wp/v2/posts');
  (primeira as Map<string, unknown>).set('allow_batch', { v1: true });

  assert.equal(
    registro.opcoesDaRota('/wp/v2/posts')?.get('allow_batch'),
    undefined,
  );
});

test('duas composicoes de registro nao se enxergam (EXT-CONTEXTO)', () => {
  // A mesma invariante que `../modulo.test.ts` afirma para o modulo, agora com
  // rota registrada de verdade: e a linha 5 da metrica de `parity_specs.md`,
  // tolerancia zero sem excecao.
  const primeiro = criarRegistroDeRotas();
  const segundo = criarRegistroDeRotas();

  primeiro.registrar('wp/v2', '/wp/v2/posts', {
    tratadores: [{ metodos: 'GET', funcao: funcaoQualquer }],
  });

  assert.equal(primeiro.rotas().size, 2);
  assert.equal(segundo.rotas().size, 0);
  assert.deepEqual(segundo.espacosDeNome(), []);
});

test('o formato aceita um esquema de argumento com as duas formas de `required`', () => {
  // O achado 3: `true` na propriedade e a forma do draft 3 e a do parametro de
  // topo; lista de nomes e a do draft 4. O legado aceita as duas, e o formato
  // tambem — este teste e de compilacao tanto quanto de execucao.
  const declaracao: DeclaracaoDeRota = {
    metodos: ATALHOS_DE_METODO.EDITABLE,
    funcao: funcaoQualquer,
    permissao: () => true,
    argumentos: {
      id: { type: 'integer', required: true },
      meta: {
        type: 'object',
        required: ['chave'],
        properties: { chave: { type: 'string', required: true } },
        additionalProperties: false,
      },
    },
  };

  const tratador = normalizarTratador(declaracao);
  assert.equal(tratador.argumentos.id?.required, true);
  assert.deepEqual(tratador.argumentos.meta?.required, ['chave']);
  assert.equal(tratador.argumentos.meta?.additionalProperties, false);
});
