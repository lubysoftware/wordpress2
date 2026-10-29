/**
 * Testes de **T015** (US-7): *"Organizar componentes nas areas que o tema
 * oferece"* — CA-7.1 a CA-7.4.
 *
 * Afirma os criterios de aceite contra o comportamento lido do legado
 * (`wp-admin/widgets.php`, `wp-admin/widgets-form.php`,
 * `wp-admin/includes/ajax-actions.php`, `wp-includes/widgets.php`,
 * `wp-includes/class-wp-widget.php`, os dois controladores da superficie
 * programatica e `wp-includes/class-wp-customize-widgets.php`). Os seis casos
 * do catalogo (`UT-102-1` a `UT-102-6`) sao **T016**, em suite propria.
 *
 * As opcoes sao um duplo em memoria que **registra cada escrita** e, como
 * `update_option()`, nao escreve quando o valor e identico ao gravado: e assim
 * que se afirma o que cada operacao grava, em que ordem, e o caso em que ela
 * nao grava nada. O byte serializado e afirmado tambem sobre o armazenamento de
 * verdade de T002.
 */

import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';
import {
  arranjoPorNome,
  booleano,
  inteiro,
  lista,
  nomeDaChave,
  serializarComoTexto,
  texto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import {
  criarPortaDeDadosFalsa,
  criarRepositorioDeOpcoes,
  textoDoParametro,
  type RepositorioDeOpcoes,
} from '../armazenamento/index.js';
import { criarModuloDeApresentacao } from '../index.js';
import { PERMISSOES_DOS_MENUS, portaoDaTelaDeMenus } from '../menus/index.js';
import {
  AREA_DE_INATIVOS,
  CODIGO_SEM_PERMISSAO_NA_API,
  ENDERECO_DE_COMPONENTES_GRAVADOS,
  ENDERECO_DE_COMPONENTE_FORA_DA_AREA,
  MENSAGEM_DE_TEMA_SEM_AREAS,
  MENSAGEM_DE_TOKEN_VENCIDO_NOS_COMPONENTES,
  MENSAGEM_SEM_PERMISSAO_NA_API,
  MENSAGEM_SEM_PERMISSAO_NOS_COMPONENTES,
  PERMISSOES_DOS_COMPONENTES,
  argumentosDaConfiguracaoDeComponente,
  atribuirComponenteAArea,
  decodificadoDeBase64Estrito,
  gravarConfiguracoes,
  gravarMapaDeAreas,
  idDaConfiguracaoDoComponente,
  lerConfiguracoes,
  sanitizarComponentesDaArea,
  sanitizarInstanciaDoComponente,
  tipoDaConfiguracaoDeComponente,
  type ComponenteRegistrado,
  type ContextoDosComponentes,
  type OperacoesDosComponentes,
  type TipoDeComponente,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const SAL = 'sal-de-teste';

const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'administrator',
    capacidades: [{ capacidade: 'edit_theme_options', concedida: true }],
  },
  {
    identificador: 'editor',
    capacidades: [{ capacidade: 'edit_others_posts', concedida: true }],
  },
];

function ator(papel: string): AtorDeAutorizacao {
  return {
    contaId: 3,
    login: papel,
    existe: true,
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

const ANONIMO: AtorDeAutorizacao = {
  contaId: 0,
  login: '',
  existe: false,
  concessoes: [],
};

/** Um token valido para a acao: o duplo de `wp_verify_nonce()`. */
function token(acao: string): string {
  return `ok:${acao}`;
}

function instancia(titulo: string): ValorPhp {
  return arranjoPorNome([['title', texto(titulo)]]);
}

/** O mapa de partida: um inativo, dois na lateral, rodape vazio. */
function mapaInicial(): ValorPhp {
  return arranjoPorNome([
    [AREA_DE_INATIVOS, lista([texto('text-4')])],
    ['sidebar-1', lista([texto('text-2'), texto('text-3')])],
    ['footer-1', lista([])],
    ['array_version', inteiro(3)],
  ]);
}

/** As instancias de partida do tipo `text`. */
function textoInicial(): ValorPhp {
  return arranjoPorNome([
    ['2', instancia('A')],
    ['3', instancia('B')],
    ['4', instancia('C')],
    ['_multiwidget', inteiro(1)],
  ]);
}

/** `WP_Widget::update()` da base: devolve a instancia nova como veio. */
function tipoBase(idBase: string, extra: Partial<TipoDeComponente> = {}): TipoDeComponente {
  return {
    idBase,
    instanciaCruaPermitida: false,
    atualizar: (novo) => novo,
    ...extra,
  };
}

const TIPOS: readonly TipoDeComponente[] = [
  tipoBase('text'),
  tipoBase('block', { instanciaCruaPermitida: true }),
  tipoBase('recent-posts', { opcaoAlternativa: 'widget_recent_entries' }),
];

/** As opcoes em memoria, com o registro de cada escrita. */
interface Mundo {
  readonly opcoes: Map<string, ValorPhp>;
  readonly gravacoes: string[];
}

function opcoesDoMundo(mundo: Mundo): ContextoDosComponentes['opcoes'] {
  const lerComoNoLegado = (nome: string): ValorPhp =>
    mundo.opcoes.get(nome) ?? booleano(false);
  return {
    ler: (nome) => mundo.opcoes.get(nome) ?? null,
    lerComoNoLegado,
    gravar(nome, valor) {
      // `update_option()` nao escreve o valor identico (`option.php:923`).
      if (serializarComoTexto(lerComoNoLegado(nome)) === serializarComoTexto(valor)) {
        return false;
      }
      mundo.gravacoes.push(`update_option ${nome}`);
      mundo.opcoes.set(nome, valor);
      return true;
    },
    apagar(nome) {
      if (!mundo.opcoes.has(nome)) {
        return false;
      }
      mundo.gravacoes.push(`delete_option ${nome}`);
      mundo.opcoes.delete(nome);
      return true;
    },
  };
}

/**
 * `$wp_registered_widgets` como o arranque o deixaria: cada numero da opcao do
 * tipo, ou o modelo `{base}-1` com numero `-1` (`class-wp-widget.php:253`).
 */
function registrados(mundo: Mundo): ComponenteRegistrado[] {
  const resultado: ComponenteRegistrado[] = [];
  for (const tipo of TIPOS) {
    const valor = mundo.opcoes.get(`widget_${tipo.idBase}`);
    const numeros =
      valor?.tipo === 'arranjo'
        ? valor.entradas.flatMap((entrada) =>
            entrada.chave.tipo === 'inteiro' ? [entrada.chave.valor] : [],
          )
        : [];
    if (numeros.length === 0) {
      resultado.push({ id: `${tipo.idBase}-1`, numero: -1 });
    }
    for (const numero of numeros) {
      resultado.push({ id: `${tipo.idBase}-${String(numero)}`, numero });
    }
  }
  return resultado;
}

interface Opcoes {
  readonly ator?: AtorDeAutorizacao;
  readonly suportes?: readonly string[];
  readonly opcoesIniciais?: readonly (readonly [string, ValorPhp])[];
}

function cenario(opcoes: Opcoes = {}): {
  contexto: ContextoDosComponentes;
  mundo: Mundo;
  componentes: OperacoesDosComponentes;
} {
  const mundo: Mundo = {
    opcoes: new Map(
      opcoes.opcoesIniciais ?? [
        ['sidebars_widgets', mapaInicial()],
        ['widget_text', textoInicial()],
      ],
    ),
    gravacoes: [],
  };
  const suportes = opcoes.suportes ?? ['widgets'];
  const contexto: ContextoDosComponentes = {
    autorizacao: {
      matriz: MATRIZ,
      rede: REDE_INATIVA_NA_AUTORIZACAO,
      ator: opcoes.ator ?? ator('administrator'),
    },
    opcoes: opcoesDoMundo(mundo),
    areasRegistradas: [
      { id: 'sidebar-1', nome: 'Blog Sidebar' },
      { id: 'footer-1', nome: 'Footer' },
    ],
    componentesRegistrados: registrados(mundo),
    tipoDeComponente: (idBase) => TIPOS.find((tipo) => tipo.idBase === idBase),
    temaSuporta: (recurso) => suportes.includes(recurso),
    verificarNonce: (acao, valor) => valor === token(acao),
    resumir: (dados) => createHmac('md5', SAL).update(dados).digest('hex'),
    usaEditorDeBlocos: false,
    filtrarHtmlPermitido: (html) => html.replace(/<script[^>]*>.*?<\/script>/gs, ''),
  };
  const modulo = criarModuloDeApresentacao({
    dados: {
      prefixoDeTabela: 'wp_',
      selecionar: () => [],
      escrever: () => ({ linhasAfetadas: 0, idGerado: null }),
    },
    clienteExterno: {
      chamar: () => ({ completou: false, motivo: 'nao chamado' }),
    },
  });
  return { contexto, mundo, componentes: modulo.componentesDeArea };
}

/** O byte gravado numa opcao. */
function bytes(mundo: Mundo, nome: string): string {
  const valor = mundo.opcoes.get(nome);
  assert.ok(valor !== undefined, `a opcao ${nome} deveria existir`);
  return serializarComoTexto(valor);
}

/** A estrutura do mapa: a lista de cada area, sem as chaves. */
function estrutura(mundo: Mundo): Record<string, string[]> {
  const mapa = mundo.opcoes.get('sidebars_widgets');
  const resultado: Record<string, string[]> = {};
  if (mapa?.tipo !== 'arranjo') {
    return resultado;
  }
  for (const area of mapa.entradas) {
    if (area.valor.tipo !== 'arranjo') {
      continue;
    }
    resultado[nomeDaChave(area.chave)] = area.valor.entradas.map((entrada) =>
      entrada.valor.tipo === 'texto' ? String(entrada.valor.valor) : '?',
    );
  }
  return resultado;
}

/** A instancia codificada, como a personalizacao e a superficie programatica a recebem. */
function codificada(valor: ValorPhp): { readonly base64: string; readonly resumo: string } {
  const serializada = Buffer.from(serializarComoTexto(valor), 'utf8');
  return {
    base64: serializada.toString('base64'),
    resumo: createHmac('md5', SAL).update(serializada).digest('hex'),
  };
}

/* ── CA-7.1 — a capacidade de administrar aparencia ────────────────────────── */

test('CA-7.1 sem edit_theme_options, as tres superficies recusam e nada e gravado', () => {
  const { contexto, mundo, componentes } = cenario({ ator: ator('editor') });

  const pelaTela = componentes.gravarPelaTela(contexto, {
    savewidget: texto('Save'),
    'widget-id': texto('text-2'),
    _wpnonce: texto(token('save-delete-widget-text-2')),
    sidebar: texto('footer-1'),
    id_base: texto('text'),
  });
  assert.deepEqual(pelaTela, {
    desfecho: 'recusada',
    recusa: {
      tipo: 'proibida',
      status: 403,
      titulo: 'You need a higher level of permission.',
      mensagem: MENSAGEM_SEM_PERMISSAO_NOS_COMPONENTES,
    },
  });

  // O Ajax da tela responde `wp_die( -1 )`: corpo `-1`, estado 200.
  assert.deepEqual(
    componentes.ordenarPeloAjax(contexto, {
      savewidgets: texto(token('save-sidebar-widgets')),
      sidebars: arranjoPorNome([['sidebar-1', texto('')]]),
    }),
    { status: 200, corpo: '-1' },
  );
  assert.deepEqual(
    componentes.limparInativosPeloAjax(contexto, {
      removeinactivewidgets: texto(token('remove-inactive-widgets')),
    }),
    { status: 200, corpo: '-1' },
  );

  // A superficie programatica: 403 com sessao.
  const pelaApi = componentes.apagarPelaApi(contexto, { id: 'text-2', forcar: true });
  assert.deepEqual(pelaApi, {
    ok: false,
    erro: { codigo: CODIGO_SEM_PERMISSAO_NA_API, mensagem: MENSAGEM_SEM_PERMISSAO_NA_API, status: 403 },
  });

  // A personalizacao: a configuracao nao e gravada.
  assert.equal(
    componentes.gravarPelaPersonalizacao(contexto, 'sidebars_widgets[footer-1]', lista([texto('text-2')])),
    false,
  );

  assert.deepEqual(mundo.gravacoes, []);
});

test('CA-7.1 a superficie programatica responde 401 a quem nao tem sessao', () => {
  const { contexto, mundo, componentes } = cenario({ ator: ANONIMO });

  const resultado = componentes.atualizarAreaPelaApi(contexto, {
    id: 'sidebar-1',
    componentes: [],
  });

  assert.equal(resultado.ok, false);
  assert.equal(resultado.ok ? 0 : resultado.erro.status, 401);
  assert.deepEqual(mundo.gravacoes, []);
});

test('CA-7.1 na tela a capacidade vem antes do tema (widgets.php:15-25)', () => {
  const semAreas = cenario({ suportes: [] });
  assert.deepEqual(semAreas.componentes.abrirTela(semAreas.contexto), {
    tipo: 'tema-sem-suporte',
    status: 500,
    mensagem: MENSAGEM_DE_TEMA_SEM_AREAS,
  });

  // Quem nao tem permissao num tema sem areas ve a mensagem de permissao.
  const editor = cenario({ suportes: [], ator: ator('editor') });
  assert.equal(editor.componentes.abrirTela(editor.contexto)?.tipo, 'proibida');

  const pronto = cenario();
  assert.equal(pronto.componentes.abrirTela(pronto.contexto), null);
});

test('CA-7.1 o token vencido recusa sem gravar; no Ajax ele vem antes da capacidade', () => {
  const { contexto, mundo, componentes } = cenario();

  const pelaTela = componentes.gravarPelaTela(contexto, {
    savewidget: texto('Save'),
    'widget-id': texto('text-2'),
    _wpnonce: texto('vencido'),
    sidebar: texto('footer-1'),
    id_base: texto('text'),
  });
  assert.deepEqual(pelaTela, {
    desfecho: 'recusada',
    recusa: {
      tipo: 'token-vencido',
      status: 403,
      titulo: 'An error occurred.',
      mensagem: MENSAGEM_DE_TOKEN_VENCIDO_NOS_COMPONENTES,
    },
  });

  // O token de um componente nao serve para outro.
  const deOutro = componentes.gravarPelaTela(contexto, {
    savewidget: texto('Save'),
    'widget-id': texto('text-3'),
    _wpnonce: texto(token('save-delete-widget-text-2')),
    sidebar: texto('footer-1'),
    id_base: texto('text'),
  });
  assert.equal(deOutro.desfecho, 'recusada');

  // `check_ajax_referer()` morre com 403 antes de perguntar a capacidade.
  const editor = cenario({ ator: ator('editor') });
  assert.deepEqual(
    editor.componentes.limparInativosPeloAjax(editor.contexto, {
      removeinactivewidgets: texto('vencido'),
    }),
    { status: 403, corpo: '-1' },
  );

  assert.deepEqual(mundo.gravacoes, []);
});

test('CA-7.1 a mesma capacidade primitiva libera componentes e menus, e e a que a personalizacao declara', () => {
  for (const capacidade of Object.values(PERMISSOES_DOS_COMPONENTES)) {
    assert.equal(capacidade, 'edit_theme_options');
  }
  assert.equal(PERMISSOES_DOS_COMPONENTES.abrirATela, PERMISSOES_DOS_MENUS.abrirATela);
  assert.equal(argumentosDaConfiguracaoDeComponente('sidebars_widgets[footer-1]')?.capacidade, 'edit_theme_options');

  // Uma conta com SO `edit_theme_options` passa os dois portoes.
  const { contexto } = cenario({
    ator: {
      contaId: 9,
      login: 'so-aparencia',
      existe: true,
      concessoes: [{ capacidade: 'edit_theme_options', concedida: true }],
    },
    suportes: ['widgets'],
  });
  assert.equal(
    portaoDaTelaDeMenus({
      autorizacao: contexto.autorizacao,
      temaSuporta: contexto.temaSuporta,
    } as Parameters<typeof portaoDaTelaDeMenus>[0]),
    null,
  );
  assert.equal(cenario().componentes.abrirTela(contexto), null);
});

/* ── CA-7.2 — mapa e configuracao gravados como configuracao do site ───────── */

test('CA-7.2 mover pela tela grava a configuracao do tipo e depois o mapa, com buraco na chave e array_version no fim', () => {
  const { contexto, mundo, componentes } = cenario();

  const desfecho = componentes.gravarPelaTela(contexto, {
    savewidget: texto('Save'),
    'widget-id': texto('text-2'),
    _wpnonce: texto(token('save-delete-widget-text-2')),
    sidebar: texto('footer-1'),
    'footer-1_position': texto('1'),
    id_base: texto('text'),
    'widget-text': arranjoPorNome([['2', instancia('A2')]]),
  });

  assert.deepEqual(desfecho, { desfecho: 'redirecionar', endereco: ENDERECO_DE_COMPONENTES_GRAVADOS });
  assert.deepEqual(mundo.gravacoes, ['update_option widget_text', 'update_option sidebars_widgets']);
  // `array_diff()` deixa `sidebar-1` com a chave 1; `array_splice()` renumera
  // so a area de destino.
  assert.equal(
    bytes(mundo, 'sidebars_widgets'),
    'a:4:{s:19:"wp_inactive_widgets";a:1:{i:0;s:6:"text-4";}' +
      's:9:"sidebar-1";a:1:{i:1;s:6:"text-3";}' +
      's:8:"footer-1";a:1:{i:0;s:6:"text-2";}' +
      's:13:"array_version";i:3;}',
  );
  assert.equal(
    bytes(mundo, 'widget_text'),
    'a:4:{i:2;a:1:{s:5:"title";s:2:"A2";}i:3;a:1:{s:5:"title";s:1:"B";}' +
      'i:4;a:1:{s:5:"title";s:1:"C";}s:12:"_multiwidget";i:1;}',
  );
});

test('CA-7.2 retirar pela tela tira a instancia da opcao do tipo e o componente da area, sem reinserir', () => {
  const { contexto, mundo, componentes } = cenario();

  componentes.gravarPelaTela(contexto, {
    removewidget: texto('Delete'),
    'widget-id': texto('text-2'),
    _wpnonce: texto(token('save-delete-widget-text-2')),
    sidebar: texto('sidebar-1'),
    id_base: texto('text'),
  });

  assert.equal(
    bytes(mundo, 'widget_text'),
    'a:3:{i:3;a:1:{s:5:"title";s:1:"B";}i:4;a:1:{s:5:"title";s:1:"C";}s:12:"_multiwidget";i:1;}',
  );
  assert.deepEqual(estrutura(mundo), {
    [AREA_DE_INATIVOS]: ['text-4'],
    'sidebar-1': ['text-3'],
    'footer-1': [],
  });

  // Retirar o que nao esta na area informada volta com `error=0` e nao grava.
  const fora = cenario();
  assert.deepEqual(
    fora.componentes.gravarPelaTela(fora.contexto, {
      removewidget: texto('Delete'),
      'widget-id': texto('text-4'),
      _wpnonce: texto(token('save-delete-widget-text-4')),
      sidebar: texto('sidebar-1'),
      id_base: texto('text'),
    }),
    { desfecho: 'redirecionar', endereco: ENDERECO_DE_COMPONENTE_FORA_DA_AREA },
  );
  assert.deepEqual(fora.mundo.gravacoes, []);
});

test('CA-7.2 a tela tira do valor gravado a area vazia que o tema nao registra, e mantem a cheia', () => {
  const { contexto, mundo, componentes } = cenario({
    opcoesIniciais: [
      [
        'sidebars_widgets',
        arranjoPorNome([
          [AREA_DE_INATIVOS, lista([])],
          ['sidebar-1', lista([texto('text-2')])],
          ['area-velha-vazia', lista([])],
          ['area-velha-cheia', lista([texto('text-3')])],
          ['footer-1', lista([])],
          ['array_version', inteiro(3)],
        ]),
      ],
      ['widget_text', textoInicial()],
    ],
  });

  componentes.gravarPelaTela(contexto, {
    savewidget: texto('Save'),
    'widget-id': texto('text-2'),
    _wpnonce: texto(token('save-delete-widget-text-2')),
    sidebar: texto('footer-1'),
    id_base: texto('text'),
    'widget-text': arranjoPorNome([['2', instancia('A')]]),
  });

  assert.deepEqual(Object.keys(estrutura(mundo)), [
    AREA_DE_INATIVOS,
    'sidebar-1',
    'area-velha-cheia',
    'footer-1',
  ]);
});

test('CA-7.2 o byte vai para a linha de options pelo armazenamento de T002 — e so para ela', () => {
  const falsa = criarPortaDeDadosFalsa();
  const opcoes: RepositorioDeOpcoes = criarRepositorioDeOpcoes(falsa.porta);

  gravarMapaDeAreas(opcoes, arranjoPorNome([['sidebar-1', lista([texto('text-2')])]]));
  gravarConfiguracoes(opcoes, 'text', arranjoPorNome([['2', instancia('A')]]));

  assert.equal(falsa.escritas.length, 2);
  for (const escrita of falsa.escritas) {
    assert.match(escrita.texto, /^INSERT INTO `wp_options` /);
  }
  assert.deepEqual(
    falsa.escritas.map((escrita) => textoDoParametro(escrita.parametros[1])),
    [
      'a:2:{s:9:"sidebar-1";a:1:{i:0;s:6:"text-2";}s:13:"array_version";i:3;}',
      'a:2:{i:2;a:1:{s:5:"title";s:1:"A";}s:12:"_multiwidget";i:1;}',
    ],
  );
  assert.deepEqual(
    falsa.escritas.map((escrita) => textoDoParametro(escrita.parametros[0])),
    ['sidebars_widgets', 'widget_text'],
  );
});

test('CA-7.2 ler a configuracao de um tipo sem opcao grava a marca na hora, e consome a opcao antiga', () => {
  const vazio = cenario({ opcoesIniciais: [] });
  assert.deepEqual(lerConfiguracoes(vazio.contexto.opcoes, tipoBase('text')), arranjoPorNome([]));
  assert.deepEqual(vazio.mundo.gravacoes, ['update_option widget_text']);
  assert.equal(bytes(vazio.mundo, 'widget_text'), 'a:1:{s:12:"_multiwidget";i:1;}');

  const antigo = cenario({
    opcoesIniciais: [['widget_recent_entries', arranjoPorNome([['2', instancia('R')], ['_multiwidget', inteiro(1)]])]],
  });
  const tipo = TIPOS.find((candidato) => candidato.idBase === 'recent-posts');
  assert.ok(tipo !== undefined);
  assert.deepEqual(
    lerConfiguracoes(antigo.contexto.opcoes, tipo),
    arranjoPorNome([['2', instancia('R')]]),
  );
  assert.deepEqual(antigo.mundo.gravacoes, [
    'delete_option widget_recent_entries',
    'update_option widget_recent-posts',
  ]);
});

/* ── CA-7.3 — tela, personalizacao e API, com o mesmo resultado ─────────────── */

test('CA-7.3 mover um componente de area chega ao mesmo mapa pelas tres superficies', () => {
  const pelaTela = cenario();
  pelaTela.componentes.gravarPelaTela(pelaTela.contexto, {
    savewidget: texto('Save'),
    'widget-id': texto('text-3'),
    _wpnonce: texto(token('save-delete-widget-text-3')),
    sidebar: texto('footer-1'),
    'footer-1_position': texto('1'),
    id_base: texto('text'),
    'widget-text': arranjoPorNome([['3', instancia('B')]]),
  });

  const pelaApi = cenario();
  const resposta = pelaApi.componentes.atualizarPelaApi(pelaApi.contexto, {
    id: 'text-3',
    area: 'footer-1',
  });
  assert.deepEqual(resposta, { ok: true, status: 200, id: 'text-3', area: 'footer-1' });

  const pelaPersonalizacao = cenario();
  for (const [id, valor] of [
    ['sidebars_widgets[sidebar-1]', ['text-2']],
    ['sidebars_widgets[footer-1]', ['text-3']],
  ] as const) {
    assert.equal(tipoDaConfiguracaoDeComponente(id), 'sidebar_widgets');
    assert.equal(
      pelaPersonalizacao.componentes.gravarPelaPersonalizacao(
        pelaPersonalizacao.contexto,
        id,
        sanitizarComponentesDaArea([...valor]),
      ),
      true,
    );
  }

  const esperado =
    'a:4:{s:19:"wp_inactive_widgets";a:1:{i:0;s:6:"text-4";}' +
    's:9:"sidebar-1";a:1:{i:0;s:6:"text-2";}' +
    's:8:"footer-1";a:1:{i:0;s:6:"text-3";}' +
    's:13:"array_version";i:3;}';
  assert.equal(bytes(pelaTela.mundo, 'sidebars_widgets'), esperado);
  assert.equal(bytes(pelaApi.mundo, 'sidebars_widgets'), esperado);
  assert.equal(bytes(pelaPersonalizacao.mundo, 'sidebars_widgets'), esperado);
  // A configuracao identica nao e regravada; a personalizacao grava o mapa uma
  // vez por configuracao aplicada.
  assert.deepEqual(pelaTela.mundo.gravacoes, ['update_option sidebars_widgets']);
  assert.deepEqual(pelaApi.mundo.gravacoes, ['update_option sidebars_widgets']);
  assert.deepEqual(pelaPersonalizacao.mundo.gravacoes, [
    'update_option sidebars_widgets',
    'update_option sidebars_widgets',
  ]);
});

test('CA-7.3 componente novo: mesma estrutura pelas tres superficies; a personalizacao poe a instancia depois de _multiwidget', () => {
  const novo = instancia('D');

  const pelaTela = cenario();
  pelaTela.componentes.gravarPelaTela(pelaTela.contexto, {
    savewidget: texto('Save'),
    'widget-id': texto('text-5'),
    _wpnonce: texto(token('save-delete-widget-text-5')),
    multi_number: texto('5'),
    sidebar: texto('footer-1'),
    'footer-1_position': texto('1'),
    id_base: texto('text'),
    'widget-text': arranjoPorNome([['__i__', novo]]),
  });

  const pelaApi = cenario();
  const { base64, resumo } = codificada(novo);
  const criado = pelaApi.componentes.criarPelaApi(pelaApi.contexto, {
    idBase: 'text',
    area: 'footer-1',
    instancia: { codificada: base64, resumo },
  });
  // `next_widget_id_number()`: o maior registrado (4) mais um.
  assert.deepEqual(criado, { ok: true, status: 201, id: 'text-5', area: 'footer-1' });

  const pelaPersonalizacao = cenario();
  const id = idDaConfiguracaoDoComponente('text-5');
  assert.equal(id, 'widget_text[5]');
  const sanitizada = sanitizarInstanciaDoComponente(
    pelaPersonalizacao.contexto,
    {
      encoded_serialized_instance: base64,
      title: 'D',
      is_widget_customizer_js_value: true,
      instance_hash_key: resumo,
    },
    'text',
  );
  assert.deepEqual(sanitizada, novo);
  pelaPersonalizacao.componentes.gravarPelaPersonalizacao(pelaPersonalizacao.contexto, id, sanitizada);
  pelaPersonalizacao.componentes.gravarPelaPersonalizacao(
    pelaPersonalizacao.contexto,
    'sidebars_widgets[footer-1]',
    sanitizarComponentesDaArea(['text-5']),
  );

  for (const { mundo } of [pelaTela, pelaApi, pelaPersonalizacao]) {
    assert.deepEqual(estrutura(mundo), {
      [AREA_DE_INATIVOS]: ['text-4'],
      'sidebar-1': ['text-2', 'text-3'],
      'footer-1': ['text-5'],
    });
  }

  const pelaFuncaoDoTipo =
    'a:5:{i:2;a:1:{s:5:"title";s:1:"A";}i:3;a:1:{s:5:"title";s:1:"B";}' +
    'i:4;a:1:{s:5:"title";s:1:"C";}i:5;a:1:{s:5:"title";s:1:"D";}s:12:"_multiwidget";i:1;}';
  assert.equal(bytes(pelaTela.mundo, 'widget_text'), pelaFuncaoDoTipo);
  assert.equal(bytes(pelaApi.mundo, 'widget_text'), pelaFuncaoDoTipo);
  // A personalizacao troca a chave no lugar: a nova entra no fim, depois da marca.
  assert.equal(
    bytes(pelaPersonalizacao.mundo, 'widget_text'),
    'a:5:{i:2;a:1:{s:5:"title";s:1:"A";}i:3;a:1:{s:5:"title";s:1:"B";}' +
      'i:4;a:1:{s:5:"title";s:1:"C";}s:12:"_multiwidget";i:1;i:5;a:1:{s:5:"title";s:1:"D";}}',
  );
});

test('CA-7.3 a area pela API recebe exatamente a lista, e o omitido vai para os inativos na proxima chave livre', () => {
  const { contexto, mundo, componentes } = cenario();

  const resultado = componentes.atualizarAreaPelaApi(contexto, {
    id: 'sidebar-1',
    componentes: ['text-4'],
  });

  assert.deepEqual(resultado, { ok: true, area: { id: 'sidebar-1', nome: 'Blog Sidebar' } });
  // `text-4` saiu da chave 0 dos inativos; os dois omitidos entram em 1 e 2,
  // porque `unset()` nao devolve a chave livre.
  assert.equal(
    bytes(mundo, 'sidebars_widgets'),
    'a:4:{s:19:"wp_inactive_widgets";a:2:{i:1;s:6:"text-2";i:2;s:6:"text-3";}' +
      's:9:"sidebar-1";a:1:{i:0;s:6:"text-4";}' +
      's:8:"footer-1";a:0:{}' +
      's:13:"array_version";i:3;}',
  );
});

test('CA-7.3 apagar pela API: sem force retira para os inativos; com force tira a instancia e toda area', () => {
  const retirar = cenario();
  assert.deepEqual(retirar.componentes.apagarPelaApi(retirar.contexto, { id: 'text-2' }), {
    ok: true,
    status: 200,
    id: 'text-2',
    area: AREA_DE_INATIVOS,
  });
  assert.deepEqual(estrutura(retirar.mundo)[AREA_DE_INATIVOS], ['text-4', 'text-2']);
  assert.deepEqual(retirar.mundo.gravacoes, ['update_option sidebars_widgets']);

  const apagar = cenario();
  assert.deepEqual(apagar.componentes.apagarPelaApi(apagar.contexto, { id: 'text-2', forcar: true }), {
    ok: true,
    status: 200,
    id: 'text-2',
    area: 'sidebar-1',
    apagado: true,
  });
  assert.deepEqual(apagar.mundo.gravacoes, ['update_option widget_text', 'update_option sidebars_widgets']);
  assert.deepEqual(estrutura(apagar.mundo)['sidebar-1'], ['text-3']);
  assert.ok(!bytes(apagar.mundo, 'widget_text').includes('i:2;'));

  const inexistente = cenario();
  const resposta = inexistente.componentes.apagarPelaApi(inexistente.contexto, { id: 'text-9' });
  assert.equal(resposta.ok ? 0 : resposta.erro.status, 404);
  assert.deepEqual(inexistente.mundo.gravacoes, []);
});

test('CA-7.3 a API recusa instancia crua de tipo que nao a permite, e resumo que nao confere', () => {
  const { contexto, mundo, componentes } = cenario();

  const crua = componentes.criarPelaApi(contexto, {
    idBase: 'text',
    instancia: { crua: instancia('X') },
  });
  assert.deepEqual(crua, {
    ok: false,
    erro: { codigo: 'rest_invalid_widget', mensagem: 'Widget type does not support raw instances.', status: 400 },
  });

  const { base64 } = codificada(instancia('X'));
  const adulterada = componentes.criarPelaApi(contexto, {
    idBase: 'text',
    instancia: { codificada: base64, resumo: 'outro' },
  });
  assert.equal(adulterada.ok ? '' : adulterada.erro.mensagem, 'The provided instance is malformed.');

  const semTipo = componentes.criarPelaApi(contexto, {});
  assert.equal(semTipo.ok ? '' : semTipo.erro.mensagem, 'Widget type (id_base) is required.');

  assert.deepEqual(mundo.gravacoes, []);
});

test('CA-7.3 reordenar pelo Ajax grava SO as areas enviadas, com a chave na posicao do pedaco', () => {
  const { contexto, mundo, componentes } = cenario();

  const resposta = componentes.ordenarPeloAjax(contexto, {
    savewidgets: texto(token('save-sidebar-widgets')),
    sidebars: arranjoPorNome([
      ['sidebar-1', texto('widget-1_text-3,widget-2_text-2')],
      ['footer-1', texto('lixo,widget-3_text-4')],
    ]),
  });

  assert.deepEqual(resposta, { status: 200, corpo: '1' });
  assert.equal(
    bytes(mundo, 'sidebars_widgets'),
    'a:3:{s:9:"sidebar-1";a:2:{i:0;s:6:"text-3";i:1;s:6:"text-2";}' +
      's:8:"footer-1";a:1:{i:1;s:6:"text-4";}' +
      's:13:"array_version";i:3;}',
  );
});

test('CA-7.3 atribuir a area em que o componente ja esta o duplica (widgets.php:1987-1989)', () => {
  const { contexto, mundo } = cenario();

  atribuirComponenteAArea(contexto.opcoes, 'text-2', 'sidebar-1');

  assert.deepEqual(estrutura(mundo)['sidebar-1'], ['text-2', 'text-3', 'text-2']);
});

test('CA-7.3 as sanitizacoes da personalizacao: identificador, lista e base64 estrito', () => {
  assert.equal(tipoDaConfiguracaoDeComponente('widget_text[2]'), 'widget_instance');
  assert.equal(tipoDaConfiguracaoDeComponente('sidebars_widgets[sidebar-1]'), 'sidebar_widgets');
  assert.equal(tipoDaConfiguracaoDeComponente('blogname'), null);
  assert.equal(idDaConfiguracaoDoComponente('calendar'), 'widget_calendar');

  assert.deepEqual(
    sanitizarComponentesDaArea(['Text-2', 'text 3<b>', 7, true, null]),
    lista([texto('ext-2'), texto('text3b'), texto('7'), texto('1'), texto('')]),
  );
  assert.deepEqual(sanitizarComponentesDaArea('text-2'), lista([texto('text-2')]));

  assert.deepEqual(decodificadoDeBase64Estrito('YQ=='), new Uint8Array([0x61]));
  assert.deepEqual(decodificadoDeBase64Estrito('YQ'), new Uint8Array([0x61]));
  assert.equal(decodificadoDeBase64Estrito('Y*Q='), null);
  assert.equal(decodificadoDeBase64Estrito('YQ==YQ'), null);
  assert.equal(decodificadoDeBase64Estrito('Y'), null);

  const { contexto } = cenario();
  assert.deepEqual(sanitizarInstanciaDoComponente(contexto, [], 'text'), arranjoPorNome([]));
  assert.equal(
    sanitizarInstanciaDoComponente(
      contexto,
      { encoded_serialized_instance: 'YQ==', is_widget_customizer_js_value: true, instance_hash_key: 'x' },
      'text',
    ),
    null,
  );
  assert.equal(sanitizarInstanciaDoComponente(contexto, { title: 'D' }, 'text'), null);
});

/* ── CA-7.4 — limpar de uma vez os componentes sem area ─────────────────────── */

test('CA-7.4 limpar pela tela tira a instancia de cada inativo e esvazia a area, que fica no mapa', () => {
  const { contexto, mundo, componentes } = cenario();

  const desfecho = componentes.limparInativosPelaTela(contexto, {
    removeinactivewidgets: texto('Clear Inactive Widgets'),
    _wpnonce_remove_inactive_widgets: texto(token('remove-inactive-widgets')),
  });

  assert.deepEqual(desfecho, { desfecho: 'redirecionar', endereco: ENDERECO_DE_COMPONENTES_GRAVADOS });
  assert.deepEqual(mundo.gravacoes, ['update_option widget_text', 'update_option sidebars_widgets']);
  // A opcao do tipo e gravada direto: `_multiwidget` fica onde estava.
  assert.equal(
    bytes(mundo, 'widget_text'),
    'a:3:{i:2;a:1:{s:5:"title";s:1:"A";}i:3;a:1:{s:5:"title";s:1:"B";}s:12:"_multiwidget";i:1;}',
  );
  assert.equal(
    bytes(mundo, 'sidebars_widgets'),
    'a:4:{s:19:"wp_inactive_widgets";a:0:{}' +
      's:9:"sidebar-1";a:2:{i:0;s:6:"text-2";i:1;s:6:"text-3";}' +
      's:8:"footer-1";a:0:{}' +
      's:13:"array_version";i:3;}',
  );
});

test('CA-7.4 o campo presente e falso confere o token e nao grava nada', () => {
  const { contexto, mundo, componentes } = cenario();

  const desfecho = componentes.limparInativosPelaTela(contexto, {
    removeinactivewidgets: texto(''),
    _wpnonce_remove_inactive_widgets: texto(token('remove-inactive-widgets')),
  });

  assert.deepEqual(desfecho, { desfecho: 'redirecionar', endereco: ENDERECO_DE_COMPONENTES_GRAVADOS });
  assert.deepEqual(mundo.gravacoes, []);
});

test('CA-7.4 limpar pelo Ajax tem o mesmo efeito e responde vazio', () => {
  const pelaTela = cenario();
  pelaTela.componentes.limparInativosPelaTela(pelaTela.contexto, {
    removeinactivewidgets: texto('Clear Inactive Widgets'),
    _wpnonce_remove_inactive_widgets: texto(token('remove-inactive-widgets')),
  });

  const peloAjax = cenario();
  const resposta = peloAjax.componentes.limparInativosPeloAjax(peloAjax.contexto, {
    removeinactivewidgets: texto(token('remove-inactive-widgets')),
  });

  assert.deepEqual(resposta, { status: 200, corpo: '' });
  assert.equal(bytes(peloAjax.mundo, 'sidebars_widgets'), bytes(pelaTela.mundo, 'sidebars_widgets'));
  assert.equal(bytes(peloAjax.mundo, 'widget_text'), bytes(pelaTela.mundo, 'widget_text'));
});

test('CA-7.4 inativo de tipo sem opcao nao gera escrita na opcao do tipo — so no mapa', () => {
  const { contexto, mundo, componentes } = cenario({
    opcoesIniciais: [
      [
        'sidebars_widgets',
        arranjoPorNome([
          [AREA_DE_INATIVOS, lista([texto('calendar-3')])],
          ['array_version', inteiro(3)],
        ]),
      ],
    ],
  });

  componentes.limparInativosPeloAjax(contexto, {
    removeinactivewidgets: texto(token('remove-inactive-widgets')),
  });

  assert.deepEqual(mundo.gravacoes, ['update_option sidebars_widgets']);
  assert.equal(mundo.opcoes.has('widget_calendar'), false);
});
