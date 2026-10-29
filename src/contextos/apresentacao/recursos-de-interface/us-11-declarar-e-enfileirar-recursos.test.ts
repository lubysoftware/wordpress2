/**
 * Testes de **T023** (US-11): *"Declarar e enfileirar os recursos de interface
 * com dependencia e versao"* — CA-11.1 a CA-11.5.
 *
 * Afirma os criterios contra o comportamento lido do legado
 * (`wp-includes/class-wp-dependencies.php`, `class-wp-dependency.php`,
 * `class-wp-scripts.php`, `class-wp-styles.php`, `functions.wp-scripts.php` e
 * `functions.wp-styles.php`). Os cinco casos do catalogo (`UT-172-1` a
 * `UT-172-5`) sao **T024**, em suite propria.
 *
 * Nada de rede nem de HTML: o registro devolve o que `do_item()` imprimiria —
 * identificador e endereco, na ordem —, e os saneadores de endereco sao duplos
 * que deixam visivel qual dos dois foi usado.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  avisarSeCedoDemais,
  codificarComoRawurlencode,
  criarAreaDeRecursosDeInterface,
  enfileirarEstilo,
  enfileirarScript,
  registrarEstilo,
  registrarScript,
  scriptEsta,
  type AvisoDeUsoIndevidoDosRecursos,
  type ConfiguracaoDoRegistro,
  type ContextoDoRegistro,
  type RegistroDeRecursos,
} from './index.js';

const CONFIGURACAO: ConfiguracaoDoRegistro = {
  enderecoBase: 'https://exemplo.invalido',
  enderecoDoConteudo: 'https://exemplo.invalido/wp-content',
  versaoPadrao: '7.1.2',
};

function contextoDeTeste(avisos: AvisoDeUsoIndevidoDosRecursos[] = []): ContextoDoRegistro {
  return {
    escaparEnderecoBruto: (endereco) => endereco,
    // `esc_url()` troca `&` por `&#038;` para exibicao; o duplo so faz isso.
    escaparEnderecoParaExibir: (endereco) => endereco.replaceAll('&', '&#038;'),
    avisar: (aviso) => avisos.push(aviso),
  };
}

function scripts(
  avisos: AvisoDeUsoIndevidoDosRecursos[] = [],
  configuracao: ConfiguracaoDoRegistro = CONFIGURACAO,
): RegistroDeRecursos {
  return criarAreaDeRecursosDeInterface().criarRegistroDeScripts(
    configuracao,
    contextoDeTeste(avisos),
  );
}

function estilos(avisos: AvisoDeUsoIndevidoDosRecursos[] = []): RegistroDeRecursos {
  return criarAreaDeRecursosDeInterface().criarRegistroDeEstilos(
    CONFIGURACAO,
    contextoDeTeste(avisos),
  );
}

const SEM_AVISO = {};

// --- CA-11.1 -------------------------------------------------------------

test('CA-11.1 cada recurso e registrado com identificador, endereco, dependencias e versao', () => {
  const registro = scripts();

  assert.equal(
    registrarScript(registro, SEM_AVISO, 'grafico', '/js/grafico.js', ['base'], '2.0'),
    true,
  );

  assert.deepEqual(registro.consultar('grafico'), {
    identificador: 'grafico',
    endereco: '/js/grafico.js',
    dependencias: ['base'],
    versao: '2.0',
    argumentos: null,
  });
  // Registrar nao enfileira: o recurso existe, e ninguem o pediu.
  assert.equal(scriptEsta(registro, SEM_AVISO, 'grafico'), false);
  assert.equal(scriptEsta(registro, SEM_AVISO, 'grafico', 'registered'), true);
});

test('CA-11.1 a versao padrao e false, e o estilo guarda a midia, que por padrao e all', () => {
  const registroDeScripts = scripts();
  registrarScript(registroDeScripts, SEM_AVISO, 'a', '/a.js');
  assert.equal((registroDeScripts.consultar('a') as { versao: unknown }).versao, false);
  assert.deepEqual((registroDeScripts.consultar('a') as { dependencias: unknown }).dependencias, []);

  const registroDeEstilos = estilos();
  registrarEstilo(registroDeEstilos, SEM_AVISO, 'tema', '/style.css');
  registrarEstilo(registroDeEstilos, SEM_AVISO, 'impressao', '/print.css', [], '1', 'print');
  assert.equal((registroDeEstilos.consultar('tema') as { argumentos: unknown }).argumentos, 'all');
  assert.equal((registroDeEstilos.consultar('impressao') as { argumentos: unknown }).argumentos, 'print');
});

// --- CA-11.2 -------------------------------------------------------------

test('CA-11.2 a ordem de entrega respeita as dependencias declaradas', () => {
  const registro = scripts();
  registrarScript(registro, SEM_AVISO, 'painel', '/painel.js', ['grafico', 'utilitarios'], '1');
  registrarScript(registro, SEM_AVISO, 'grafico', '/grafico.js', ['base'], '1');
  registrarScript(registro, SEM_AVISO, 'utilitarios', '/utilitarios.js', ['base'], '1');
  registrarScript(registro, SEM_AVISO, 'base', '/base.js', [], '1');

  enfileirarScript(registro, SEM_AVISO, 'painel');
  const feitos = registro.processar();

  assert.deepEqual(feitos, ['base', 'grafico', 'utilitarios', 'painel']);
  assert.deepEqual(
    registro.entregues().map((recurso) => recurso.identificador),
    ['base', 'grafico', 'utilitarios', 'painel'],
  );
});

test('CA-11.2 a dependencia ausente e reportada com o texto e a funcao do legado, e o recurso nao sai', () => {
  const avisos: AvisoDeUsoIndevidoDosRecursos[] = [];
  const registro = scripts(avisos);
  registrarScript(registro, SEM_AVISO, 'mapa', '/mapa.js', ['leaflet', 'proj4'], '1');
  registrarScript(registro, SEM_AVISO, 'outro', '/outro.js', [], '1');

  enfileirarScript(registro, SEM_AVISO, 'mapa');
  enfileirarScript(registro, SEM_AVISO, 'outro');
  registro.processar();

  assert.deepEqual(avisos, [
    {
      funcao: 'WP_Scripts::add',
      mensagem:
        'The script with the handle "mapa" was enqueued with dependencies that are not registered: leaflet, proj4.',
      versao: '6.9.1',
    },
  ]);
  // O quebrado some; o vizinho sai normalmente.
  assert.deepEqual(registro.entregues().map((recurso) => recurso.identificador), ['outro']);
  assert.equal(registro.consultar('mapa', 'done'), false);

  // O aviso sai uma vez por recurso, mesmo processando de novo.
  registro.processar();
  assert.equal(avisos.length, 1);
});

test('CA-11.2 no estilo o texto do aviso e o do estilo', () => {
  const avisos: AvisoDeUsoIndevidoDosRecursos[] = [];
  const registro = estilos(avisos);
  enfileirarEstilo(registro, SEM_AVISO, 'tema', '/style.css', ['fonte']);
  registro.processar();

  assert.deepEqual(avisos, [
    {
      funcao: 'WP_Styles::add',
      mensagem:
        'The style with the handle "tema" was enqueued with dependencies that are not registered: fonte.',
      versao: '6.9.1',
    },
  ]);
  assert.deepEqual(registro.entregues(), []);
});

test('CA-11.2 quem depende de um recurso quebrado some em silencio: o aviso e so de quem declarou a ausente', () => {
  const avisos: AvisoDeUsoIndevidoDosRecursos[] = [];
  const registro = scripts(avisos);
  registrarScript(registro, SEM_AVISO, 'app', '/app.js', ['quebrado'], '1');
  registrarScript(registro, SEM_AVISO, 'quebrado', '/quebrado.js', ['inexistente'], '1');

  enfileirarScript(registro, SEM_AVISO, 'app');
  registro.processar();

  assert.deepEqual(registro.entregues(), []);
  assert.deepEqual(avisos.map((aviso) => aviso.mensagem), [
    'The script with the handle "quebrado" was enqueued with dependencies that are not registered: inexistente.',
  ]);
});

test('CA-11.2 sem quem receba o aviso, a decisao e a mesma (P7)', () => {
  const registro = criarAreaDeRecursosDeInterface().criarRegistroDeScripts(CONFIGURACAO, {
    escaparEnderecoBruto: (endereco) => endereco,
    escaparEnderecoParaExibir: (endereco) => endereco,
  });
  enfileirarScript(registro, SEM_AVISO, 'mapa', '/mapa.js', ['leaflet']);
  enfileirarScript(registro, SEM_AVISO, 'outro', '/outro.js');

  assert.deepEqual(registro.processar(), ['outro']);
});

test('achado: ciclo de dependencia nao e detectado, como no legado ("Does NOT catch infinite loops")', () => {
  const registro = scripts();
  registrarScript(registro, SEM_AVISO, 'a', '/a.js', ['b']);
  registrarScript(registro, SEM_AVISO, 'b', '/b.js', ['a']);
  enfileirarScript(registro, SEM_AVISO, 'a');

  // No PHP 8.3 e erro fatal de pilha; aqui, o estouro de pilha do runtime.
  assert.throws(() => registro.processar(), RangeError);
});

// --- CA-11.3 -------------------------------------------------------------

test('CA-11.3 a versao declarada entra no endereco servido, e trocar a versao troca o endereco', () => {
  const antes = scripts();
  enfileirarScript(antes, SEM_AVISO, 'app', '/wp-content/themes/t/app.js', [], '1.0');
  antes.processar();

  const depois = scripts();
  enfileirarScript(depois, SEM_AVISO, 'app', '/wp-content/themes/t/app.js', [], '1.1');
  depois.processar();

  assert.deepEqual(antes.entregues(), [
    { identificador: 'app', endereco: 'https://exemplo.invalido/wp-content/themes/t/app.js?ver=1.0' },
  ]);
  assert.deepEqual(depois.entregues(), [
    { identificador: 'app', endereco: 'https://exemplo.invalido/wp-content/themes/t/app.js?ver=1.1' },
  ]);
});

test('CA-11.3 versao false e a do produto; null e nenhuma; "0" vira a do produto', () => {
  const registro = scripts();
  enfileirarScript(registro, SEM_AVISO, 'padrao', '/padrao.js');
  enfileirarScript(registro, SEM_AVISO, 'sem', '/sem.js', [], null);
  enfileirarScript(registro, SEM_AVISO, 'zero', '/zero.js', [], '0');
  enfileirarScript(registro, SEM_AVISO, 'verdadeiro', '/verdadeiro.js', [], true);
  registro.processar();

  assert.deepEqual(registro.entregues().map((recurso) => recurso.endereco), [
    'https://exemplo.invalido/padrao.js?ver=7.1.2',
    'https://exemplo.invalido/sem.js',
    'https://exemplo.invalido/zero.js?ver=7.1.2',
    'https://exemplo.invalido/verdadeiro.js?ver=1',
  ]);
});

test('CA-11.3 antes da versao do produto existir, false nao poe versao nenhuma', () => {
  const registro = scripts([], { enderecoBase: '', enderecoDoConteudo: '', versaoPadrao: null });
  enfileirarScript(registro, SEM_AVISO, 'cedo', '/cedo.js');
  registro.processar();

  assert.deepEqual(registro.entregues().map((recurso) => recurso.endereco), ['/cedo.js']);
});

test('CA-11.3 a versao vai codificada, depois do ? que ja houver, antes do argumento e do fragmento', () => {
  const registro = scripts();
  enfileirarScript(registro, SEM_AVISO, 'consulta', 'https://cdn.invalido/x.js?a=1', [], '1 beta!');
  registrarScript(registro, SEM_AVISO, 'fragmento', '//cdn.invalido/y.js#topo', [], '2');
  registro.enfileirar('fragmento?modo=leve');
  registro.processar();

  assert.deepEqual(registro.entregues().map((recurso) => recurso.endereco), [
    'https://cdn.invalido/x.js?a=1&ver=1%20beta%21',
    '//cdn.invalido/y.js?ver=2&modo=leve#topo',
  ]);
  assert.equal(codificarComoRawurlencode("(a)*'"), '%28a%29%2A%27');
});

test('CA-11.3 endereco que comeca pelo do conteudo nao ganha o endereco base', () => {
  const registro = scripts();
  enfileirarScript(registro, SEM_AVISO, 'extensao', 'https://exemplo.invalido/wp-content/plugins/p/p.js', [], '3');
  registro.processar();

  assert.deepEqual(registro.entregues().map((recurso) => recurso.endereco), [
    'https://exemplo.invalido/wp-content/plugins/p/p.js?ver=3',
  ]);
});

test('CA-11.3 o estilo usa o saneamento de exibicao, e o script o bruto', () => {
  const registroDeScripts = scripts();
  registrarScript(registroDeScripts, SEM_AVISO, 'r', '/r.js', [], '1');
  registroDeScripts.enfileirar('r?x=1');
  registroDeScripts.processar();

  const registroDeEstilos = estilos();
  registrarEstilo(registroDeEstilos, SEM_AVISO, 'r', '/r.css', [], '1');
  registroDeEstilos.enfileirar('r?x=1');
  registroDeEstilos.processar();

  assert.equal(registroDeScripts.entregues()[0]?.endereco, 'https://exemplo.invalido/r.js?ver=1&x=1');
  assert.equal(registroDeEstilos.entregues()[0]?.endereco, 'https://exemplo.invalido/r.css?ver=1&#038;x=1');
});

// --- CA-11.4 -------------------------------------------------------------

test('CA-11.4 recurso declarado e nao usado na pagina nao e entregue', () => {
  const registro = scripts();
  registrarScript(registro, SEM_AVISO, 'usado', '/usado.js', ['dependencia'], '1');
  registrarScript(registro, SEM_AVISO, 'dependencia', '/dependencia.js', [], '1');
  registrarScript(registro, SEM_AVISO, 'esquecido', '/esquecido.js', [], '1');

  enfileirarScript(registro, SEM_AVISO, 'usado');
  registro.processar();

  // A dependencia sai porque alguem enfileirado depende dela; o resto, nao.
  assert.deepEqual(registro.entregues().map((recurso) => recurso.identificador), ['dependencia', 'usado']);
  assert.equal(registro.consultar('esquecido', 'done'), false);
  assert.equal(scriptEsta(registro, SEM_AVISO, 'dependencia'), true);
  assert.equal(scriptEsta(registro, SEM_AVISO, 'esquecido'), false);
});

test('CA-11.4 tirar da fila antes de processar tira da pagina', () => {
  const registro = scripts();
  enfileirarScript(registro, SEM_AVISO, 'a', '/a.js');
  enfileirarScript(registro, SEM_AVISO, 'b', '/b.js');
  registro.desenfileirar('a');
  registro.processar();

  assert.deepEqual(registro.entregues().map((recurso) => recurso.identificador), ['b']);
});

test('CA-11.4 o apelido sem endereco entra na ordem, puxa as dependencias e nao imprime nada', () => {
  const registro = scripts();
  registrarScript(registro, SEM_AVISO, 'conjunto', false, ['um', 'dois']);
  registrarScript(registro, SEM_AVISO, 'um', '/um.js', [], '1');
  registrarScript(registro, SEM_AVISO, 'dois', '/dois.js', [], '1');
  enfileirarScript(registro, SEM_AVISO, 'conjunto');

  assert.deepEqual(registro.processar(), ['um', 'dois', 'conjunto']);
  assert.deepEqual(registro.entregues().map((recurso) => recurso.identificador), ['um', 'dois']);
});

// --- CA-11.5 -------------------------------------------------------------

test('CA-11.5 o mesmo recurso declarado duas vezes: o segundo registro e recusado e o primeiro vale', () => {
  const registro = scripts();
  assert.equal(registrarScript(registro, SEM_AVISO, 'lib', '/lib-1.js', [], '1'), true);
  assert.equal(registrarScript(registro, SEM_AVISO, 'lib', '/lib-2.js', [], '2'), false);

  enfileirarScript(registro, SEM_AVISO, 'lib', '/lib-3.js', [], '3');
  enfileirarScript(registro, SEM_AVISO, 'lib');
  registro.processar();

  assert.deepEqual(registro.entregues(), [
    { identificador: 'lib', endereco: 'https://exemplo.invalido/lib-1.js?ver=1' },
  ]);
});

test('CA-11.5 dependencia comum a dois recursos sai uma vez, e processar de novo nao entrega de novo', () => {
  const registro = scripts();
  registrarScript(registro, SEM_AVISO, 'comum', '/comum.js', [], '1');
  enfileirarScript(registro, SEM_AVISO, 'a', '/a.js', ['comum'], '1');
  enfileirarScript(registro, SEM_AVISO, 'b', '/b.js', ['comum'], '1');

  registro.processar();
  registro.processar();
  registro.processar('comum');

  assert.deepEqual(registro.entregues().map((recurso) => recurso.identificador), ['comum', 'a', 'b']);
});

// --- o resto do contrato do legado ---------------------------------------

test('enfileirar antes de registrar e lembrado, com o argumento, e o registro posterior enfileira', () => {
  const registro = scripts();
  registro.enfileirar('tardio?lang=pt');
  assert.deepEqual(registro.fila(), []);

  registrarScript(registro, SEM_AVISO, 'tardio', '/tardio.js', [], '1');
  assert.deepEqual(registro.fila(), ['tardio']);
  registro.processar();

  assert.equal(registro.entregues()[0]?.endereco, 'https://exemplo.invalido/tardio.js?ver=1&lang=pt');
});

test('registrar e enfileirar antes das quatro acoes avisa, e registra igual', () => {
  const avisos: AvisoDeUsoIndevidoDosRecursos[] = [];
  const registro = scripts();
  const cedo = { acaoJaDisparada: () => false, avisar: (aviso: AvisoDeUsoIndevidoDosRecursos) => avisos.push(aviso) };

  assert.equal(registrarScript(registro, cedo, 'h', '/h.js'), true);
  assert.deepEqual(avisos, [
    {
      funcao: 'wp_register_script',
      mensagem:
        'Scripts and styles should not be registered or enqueued until the <code>wp_enqueue_scripts</code>, <code>admin_enqueue_scripts</code>, or <code>login_enqueue_scripts</code> hooks. This notice was triggered by the <code>h</code> handle.',
      versao: '3.3.0',
    },
  ]);

  const depois: AvisoDeUsoIndevidoDosRecursos[] = [];
  avisarSeCedoDemais(
    { acaoJaDisparada: (acao) => acao === 'init', avisar: (aviso) => depois.push(aviso) },
    'wp_enqueue_script',
    'h',
  );
  assert.deepEqual(depois, []);
});

test('dois registros da mesma area nao compartilham estado (EXT-CONTEXTO)', () => {
  const area = criarAreaDeRecursosDeInterface();
  const primeiro = area.criarRegistroDeScripts(CONFIGURACAO, contextoDeTeste());
  const segundo = area.criarRegistroDeScripts(CONFIGURACAO, contextoDeTeste());

  enfileirarScript(primeiro, SEM_AVISO, 'so-no-primeiro', '/x.js');

  assert.equal(segundo.consultar('so-no-primeiro'), false);
  assert.deepEqual(segundo.fila(), []);
  assert.equal(area.permissoes.enfileirar, null);
});
