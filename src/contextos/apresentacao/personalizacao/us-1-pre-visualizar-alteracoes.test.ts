/**
 * Testes de **T003** (US-1): *"Pre-visualizar alteracoes de aparencia antes de
 * elas chegarem ao visitante"* — CA-1.1 a CA-1.6.
 *
 * Afirma os criterios de aceite contra o comportamento lido do legado
 * (`wp-includes/class-wp-customize-manager.php`, `wp-admin/customize.php`,
 * `wp-includes/theme.php:3536`). Os oito casos do catalogo (`UT-096-1` a
 * `UT-096-8`) sao **T004**, em suite propria.
 *
 * As ligacoes tardias com `BC-01` sao duplos que **registram comando**: e
 * assim que se afirma que abrir e pre-visualizar nao gravam nada.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type GanchosDeAutorizacao,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';
import type {
  ConjuntoDeAlteracoes,
  PedidoDoConjunto,
  ValorDeJson,
} from '../armazenamento/index.js';
import { criarModuloDeApresentacao } from '../index.js';
import {
  CAPACIDADE_DE_ADMINISTRAR_A_APARENCIA,
  MENSAGEM_DE_CONJUNTO_JA_APLICADO,
  MENSAGEM_DE_IDENTIFICADOR_INEXISTENTE,
  MENSAGEM_DE_IDENTIFICADOR_INVALIDO,
  MENSAGEM_SEM_PERMISSAO_DE_PERSONALIZAR,
  PERMISSOES_DA_PERSONALIZACAO,
  perguntarNaPersonalizacao,
  type AberturaDaPersonalizacao,
  type ConfiguracaoDaPersonalizacao,
  type ContextoDaPersonalizacao,
  type OperacoesDaPersonalizacao,
  type PedidoDaPersonalizacao,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const FOLHA = 'twentytwentyfive';
const UUID_GERADO = '6f1c5a32-1f2b-4c7d-9e8f-0a1b2c3d4e5f';
const UUID_GUARDADO = '11111111-2222-4333-8444-555555555555';
const NONCE_DE_PREVIA = 'n-previa';
const NONCE_DE_GRAVACAO = 'n-gravacao';

/** Os estados que o nucleo registra, na ordem de `create_initial_post_types()`. */
const ESTADOS_REGISTRADOS = [
  'publish',
  'future',
  'draft',
  'pending',
  'private',
  'trash',
  'auto-draft',
  'inherit',
];

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

function ator(papel: string, contaId = 3): AtorDeAutorizacao {
  return {
    contaId,
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

/** Uma linha de `posts` de tipo `customize_changeset`. */
function conjunto(
  campos: Partial<ConjuntoDeAlteracoes> & { readonly id: number },
): ConjuntoDeAlteracoes {
  return {
    autorId: 3,
    data: '2026-10-29 10:00:00',
    dataGmt: '2026-10-29 13:00:00',
    conteudo: '[]',
    titulo: '',
    resumo: '',
    estado: 'auto-draft',
    estadoDeComentario: 'closed',
    estadoDeNotificacao: 'closed',
    senha: '',
    identificador: UUID_GUARDADO,
    aPingar: '',
    pingados: '',
    modificadoEm: '2026-10-29 10:00:00',
    modificadoEmGmt: '2026-10-29 13:00:00',
    conteudoFiltrado: '',
    paiId: 0,
    endereco: '',
    ordemNoMenu: 0,
    tipo: 'customize_changeset',
    tipoMime: '',
    contagemDeComentarios: 0,
    ...campos,
  };
}

/** Uma modificacao de tema registrada, que aceita texto e recusa o resto. */
function modificacao(id: string): ConfiguracaoDaPersonalizacao {
  return {
    id,
    tipo: 'theme_mod',
    capacidade: 'edit_theme_options',
    suportadaPeloTema: true,
    validar: (valor) =>
      typeof valor === 'string'
        ? true
        : { codigo: 'invalid_value', mensagem: 'Invalid value.' },
    sanitizar: (valor) => ({ ok: true, valor }),
  };
}

const CONFIGURACOES: Record<string, ConfiguracaoDaPersonalizacao> = {
  background_color: modificacao('background_color'),
  header_textcolor: modificacao('header_textcolor'),
};

interface Registro {
  porIdentificador: string[];
  maisRecente: (readonly string[])[];
  inserir: PedidoDoConjunto[];
  atualizar: PedidoDoConjunto[];
  apagarSalvamentoAutomatico: [number, number][];
}

interface Opcoes {
  readonly ator?: AtorDeAutorizacao;
  readonly existentes?: readonly ConjuntoDeAlteracoes[];
  readonly guardado?: ConjuntoDeAlteracoes | null;
  readonly estadosRegistrados?: readonly string[];
  readonly ganchos?: GanchosDeAutorizacao;
}

function cenario(opcoes: Opcoes = {}): {
  contexto: ContextoDaPersonalizacao;
  registro: Registro;
  personalizacao: OperacoesDaPersonalizacao;
} {
  const registro: Registro = {
    porIdentificador: [],
    maisRecente: [],
    inserir: [],
    atualizar: [],
    apagarSalvamentoAutomatico: [],
  };
  const base: BaseDeAutorizacao = {
    matriz: MATRIZ,
    rede: REDE_INATIVA_NA_AUTORIZACAO,
    ...(opcoes.ganchos === undefined ? {} : { ganchos: opcoes.ganchos }),
  };
  const contexto: ContextoDaPersonalizacao = {
    autorizacao: { ...base, ator: opcoes.ator ?? ator('administrator') },
    folhaDeEstilo: FOLHA,
    estadosRegistrados: opcoes.estadosRegistrados ?? ESTADOS_REGISTRADOS,
    ramificacao: false,
    conjuntos: {
      porIdentificador(identificador) {
        registro.porIdentificador.push(identificador);
        return (
          (opcoes.existentes ?? []).find(
            (linha) => linha.identificador === identificador,
          ) ?? null
        );
      },
      maisRecente(estados) {
        registro.maisRecente.push(estados);
        return opcoes.guardado ?? null;
      },
      inserir(pedido) {
        registro.inserir.push(pedido);
        return { ok: true, id: 51 };
      },
      atualizar(pedido) {
        registro.atualizar.push(pedido);
        return { ok: true, id: pedido.id ?? 0 };
      },
      apagarSalvamentoAutomaticoDaConta(conjuntoId, contaId) {
        registro.apagarSalvamentoAutomatico.push([conjuntoId, contaId]);
      },
    },
    gerarIdentificador: () => UUID_GERADO,
    verificarNonce: (acao, valor) =>
      (acao === `preview-customize_${FOLHA}` && valor === NONCE_DE_PREVIA) ||
      (acao === `save-customize_${FOLHA}` && valor === NONCE_DE_GRAVACAO),
    sanitizarChave: (valor) => valor.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
    sanitizarTexto: (valor) => valor.trim(),
    configuracao: (id) => CONFIGURACOES[id],
    agora: { local: '2026-10-29 11:30:00', gmt: '2026-10-29 14:30:00' },
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
  return { contexto, registro, personalizacao: modulo.personalizacao };
}

function pedido(
  campos: Partial<PedidoDaPersonalizacao> = {},
): PedidoDaPersonalizacao {
  return {
    naTelaDaPersonalizacao: false,
    ajax: false,
    consulta: {},
    corpo: {},
    ...campos,
  };
}

const NA_TELA = pedido({ naTelaDaPersonalizacao: true });

function aberta(
  conjuntoCarregado: ConjuntoDeAlteracoes | null,
  identificador = conjuntoCarregado?.identificador ?? UUID_GERADO,
): AberturaDaPersonalizacao {
  return {
    situacao: 'aberta',
    identificador,
    conjunto: conjuntoCarregado,
    canalDeMensagens: null,
  };
}

/** O conteudo gravado de um conjunto com uma modificacao de tema. */
function conteudoCom(folha: string, id: string, valor: ValorDeJson): string {
  return JSON.stringify({
    [`${folha}::${id}`]: {
      value: valor,
      type: 'theme_mod',
      user_id: 3,
      date_modified_gmt: '2026-10-28 09:00:00',
    },
  });
}

/* ── CA-1.1 ────────────────────────────────────────────────────────────────── */

test('CA-1.1 abrir a personalizacao gera o identificador do conjunto e nao grava nada', () => {
  const { contexto, registro, personalizacao } = cenario();

  const resultado = personalizacao.abrir(contexto, NA_TELA);

  assert.deepEqual(resultado, aberta(null, UUID_GERADO));
  // O modo linear procurou o conjunto guardado mais recente, com a lista de
  // estados registrados menos os cinco que nao se retomam (`:634`).
  assert.deepEqual(registro.maisRecente, [['future', 'draft', 'pending']]);
  assert.deepEqual(registro.inserir, []);
  assert.deepEqual(registro.atualizar, []);
});

test('CA-1.1 a primeira gravacao sem estado faz o conjunto nascer como rascunho automatico', () => {
  const { contexto, registro, personalizacao } = cenario();

  const resultado = personalizacao.gravarSemAplicar(contexto, {
    abertura: aberta(null),
    estado: null,
    titulo: null,
    dados: {},
    enviados: { background_color: '#000000' },
  });

  assert.equal(resultado.ok, true);
  assert.equal(registro.inserir.length, 1);
  const linha = registro.inserir[0] as PedidoDoConjunto;
  assert.equal(linha.tipo, 'customize_changeset');
  assert.equal(linha.identificador, UUID_GERADO);
  assert.equal(linha.estado, 'auto-draft');
  assert.equal(
    linha.conteudo,
    JSON.stringify(
      {
        [`${FOLHA}::background_color`]: {
          value: '#000000',
          type: 'theme_mod',
          user_id: 3,
          date_modified_gmt: '2026-10-29 14:30:00',
        },
      },
      null,
      4,
    ),
  );
});

test('CA-1.1 o visitante nao instancia a personalizacao e nao ve valor nenhum', () => {
  const { contexto, registro, personalizacao } = cenario({
    ator: ANONIMO,
    existentes: [
      conjunto({
        id: 9,
        conteudo: conteudoCom(FOLHA, 'background_color', '#ff0000'),
      }),
    ],
  });

  assert.deepEqual(personalizacao.abrir(contexto, pedido()), {
    situacao: 'fora-da-personalizacao',
  });
  assert.deepEqual(personalizacao.pedirPrevia(contexto, pedido()), {
    emPrevia: false,
    recusa: null,
  });
  // Nenhuma consulta ao conjunto: o visitante nem chega a procura-lo.
  assert.deepEqual(registro.porIdentificador, []);
  assert.deepEqual(registro.maisRecente, []);
});

test('CA-1.1 na tela, sem a capacidade: sem sessao vai para o login, com sessao e 403', () => {
  const anonimo = cenario({ ator: ANONIMO });
  assert.deepEqual(anonimo.personalizacao.abrir(anonimo.contexto, NA_TELA), {
    situacao: 'recusada',
    recusa: { tipo: 'autenticar' },
  });

  const editor = cenario({ ator: ator('editor') });
  const resultado = editor.personalizacao.abrir(editor.contexto, NA_TELA);
  assert.equal(resultado.situacao, 'recusada');
  assert.deepEqual(resultado.situacao === 'recusada' && resultado.recusa, {
    tipo: 'proibida',
    status: 403,
    titulo: 'You need a higher level of permission.',
    mensagem: MENSAGEM_SEM_PERMISSAO_DE_PERSONALIZAR,
  });
});

test('CA-1.1 identificador sem a forma de UUID interrompe; em maiusculas e aceito, minusculo', () => {
  const { contexto, personalizacao } = cenario();

  const invalido = personalizacao.abrir(
    contexto,
    pedido({ naTelaDaPersonalizacao: true, consulta: { changeset_uuid: 'abc' } }),
  );
  assert.deepEqual(invalido, {
    situacao: 'recusada',
    recusa: {
      tipo: 'interrompida',
      respostaAjax: -1,
      mensagem: MENSAGEM_DE_IDENTIFICADOR_INVALIDO,
    },
  });

  // `isset( '' )` e verdadeiro na tela, e vazio nao e UUID.
  const vazio = personalizacao.abrir(
    contexto,
    pedido({ naTelaDaPersonalizacao: true, consulta: { changeset_uuid: '' } }),
  );
  assert.equal(vazio.situacao, 'recusada');

  const maiusculo = personalizacao.abrir(
    contexto,
    pedido({
      naTelaDaPersonalizacao: true,
      consulta: { changeset_uuid: UUID_GUARDADO.toUpperCase() },
    }),
  );
  assert.equal(
    maiusculo.situacao === 'aberta' && maiusculo.identificador,
    UUID_GUARDADO,
  );
});

/* ── CA-1.2 ────────────────────────────────────────────────────────────────── */

test('CA-1.2 a previa de quem personaliza ve o conjunto e, com o nonce, o que mandou sem gravar', () => {
  const guardado = conjunto({
    id: 9,
    estado: 'draft',
    conteudo: JSON.stringify({
      [`${FOLHA}::background_color`]: { value: '#ff0000', type: 'theme_mod' },
      // Guardada sob outro tema: nao vaza para o ativo (`:1785`-`:1791`).
      'outrotema::header_textcolor': { value: '111111', type: 'theme_mod' },
      blogname: { value: 'Site na previa', type: 'option' },
      // Sem `value`, nao entra (`:1782`).
      blogdescription: { type: 'option' },
    }),
  });
  const { contexto, personalizacao } = cenario({ existentes: [guardado] });

  const resultado = personalizacao.pedirPrevia(
    contexto,
    pedido({
      consulta: { customize_changeset_uuid: UUID_GUARDADO },
      corpo: {
        nonce: NONCE_DE_PREVIA,
        customized: JSON.stringify({ header_textcolor: '222222' }),
      },
    }),
  );

  assert.deepEqual(resultado, {
    emPrevia: true,
    identificador: UUID_GUARDADO,
    valores: {
      background_color: '#ff0000',
      blogname: 'Site na previa',
      header_textcolor: '222222',
    },
  });
});

test('CA-1.2 sem o nonce, o que foi enviado sem gravar e descartado', () => {
  const guardado = conjunto({
    id: 9,
    conteudo: conteudoCom(FOLHA, 'background_color', '#ff0000'),
  });
  const { contexto, personalizacao } = cenario({ existentes: [guardado] });

  const resultado = personalizacao.pedirPrevia(
    contexto,
    pedido({
      consulta: { customize_changeset_uuid: UUID_GUARDADO },
      corpo: { customized: JSON.stringify({ background_color: '#00ff00' }) },
    }),
  );

  assert.deepEqual(
    resultado.emPrevia === true && resultado.valores,
    { background_color: '#ff0000' },
  );
});

test('CA-1.2 sem a capacidade, so o identificador de um conjunto existente abre a previa, e so com o conjunto', () => {
  const guardado = conjunto({
    id: 9,
    conteudo: conteudoCom(FOLHA, 'background_color', '#ff0000'),
  });
  const { contexto, personalizacao } = cenario({
    ator: ANONIMO,
    existentes: [guardado],
  });

  // "the UUID serves as a secret key" (`:556`-`:560`).
  const comIdentificador = personalizacao.pedirPrevia(
    contexto,
    pedido({
      consulta: { customize_changeset_uuid: UUID_GUARDADO },
      corpo: {
        nonce: NONCE_DE_PREVIA,
        customized: JSON.stringify({ background_color: '#00ff00' }),
      },
    }),
  );
  assert.deepEqual(
    comIdentificador.emPrevia === true && comIdentificador.valores,
    { background_color: '#ff0000' },
  );

  const inexistente = personalizacao.pedirPrevia(
    contexto,
    pedido({ consulta: { customize_changeset_uuid: UUID_GERADO } }),
  );
  assert.deepEqual(inexistente, {
    emPrevia: false,
    recusa: {
      tipo: 'interrompida',
      respostaAjax: -1,
      mensagem: MENSAGEM_DE_IDENTIFICADOR_INEXISTENTE,
    },
  });

  // Com canal de mensagens a resposta assincrona e `0`, nao `-1`.
  const comCanal = personalizacao.pedirPrevia(
    contexto,
    pedido({
      consulta: {
        customize_changeset_uuid: UUID_GERADO,
        customize_messenger_channel: 'preview-0',
      },
    }),
  );
  assert.equal(
    comCanal.emPrevia === false &&
      comCanal.recusa !== null &&
      comCanal.recusa.tipo === 'interrompida' &&
      comCanal.recusa.respostaAjax,
    0,
  );
});

test('CA-1.2 o valor na previa: sem valor, invalido ou sanitizado para nulo devolve o padrao', async () => {
  const { valorNaPrevia } = await import('./index.js');
  const cor = modificacao('background_color');
  const nula: ConfiguracaoDaPersonalizacao = {
    ...cor,
    sanitizar: () => ({ ok: true, valor: null }),
  };

  assert.equal(valorNaPrevia(cor, {}, '#ffffff'), '#ffffff');
  assert.equal(valorNaPrevia(cor, { background_color: 42 }, '#ffffff'), '#ffffff');
  assert.equal(
    valorNaPrevia(nula, { background_color: '#000000' }, '#ffffff'),
    '#ffffff',
  );
  assert.equal(
    valorNaPrevia(cor, { background_color: '#000000' }, '#ffffff'),
    '#000000',
  );
});

/* ── CA-1.3 ────────────────────────────────────────────────────────────────── */

test('CA-1.3 salvar como rascunho grava o conjunto sem aplica-lo, e reabrir o retoma', () => {
  const primeira = cenario();
  const gravacao = primeira.personalizacao.gravarSemAplicar(primeira.contexto, {
    abertura: aberta(null),
    estado: 'draft',
    titulo: 'Cores de outubro',
    dados: {},
    enviados: { background_color: '#000000' },
  });

  assert.deepEqual(gravacao.ok && gravacao.conjuntoId, 51);
  const linha = primeira.registro.inserir[0] as PedidoDoConjunto;
  assert.equal(linha.estado, 'draft');
  assert.equal(linha.titulo, 'Cores de outubro');
  // Gravar sem aplicar nao toca o valor do site: nenhuma escrita alem da linha.
  assert.equal(primeira.registro.atualizar.length, 0);

  // A tela reaberta sem identificador retoma o conjunto guardado (modo linear).
  const guardado = conjunto({
    id: 51,
    estado: 'draft',
    identificador: UUID_GUARDADO,
    conteudo: linha.conteudo,
  });
  const segunda = cenario({ guardado, existentes: [guardado] });
  const reaberta = segunda.personalizacao.abrir(segunda.contexto, NA_TELA);
  assert.deepEqual(reaberta, aberta(guardado));

  const previa = segunda.personalizacao.pedirPrevia(
    segunda.contexto,
    pedido({ consulta: { customize_changeset_uuid: UUID_GUARDADO } }),
  );
  assert.deepEqual(previa.emPrevia === true && previa.valores, {
    background_color: '#000000',
  });
});

test('CA-1.3 regravar o rascunho automatico empurra a data e apaga a revisao automatica da conta', () => {
  const existente = conjunto({
    id: 9,
    conteudo: conteudoCom(FOLHA, 'background_color', '#ff0000'),
  });
  const { contexto, registro, personalizacao } = cenario({
    existentes: [existente],
  });

  personalizacao.gravarSemAplicar(contexto, {
    abertura: aberta(existente),
    estado: null,
    titulo: null,
    dados: {},
    enviados: { header_textcolor: '333333' },
  });

  assert.equal(registro.inserir.length, 0);
  const linha = registro.atualizar[0] as PedidoDoConjunto;
  assert.equal(linha.id, 9);
  assert.equal(linha.estado, undefined);
  assert.equal(linha.preservarData, true);
  assert.equal(linha.data, '2026-10-29 11:30:00');
  assert.equal(linha.dataGmt, '');
  assert.deepEqual(registro.apagarSalvamentoAutomatico, [[9, 3]]);
  // A entrada que nao mudou guarda o `user_id` e a data dela.
  const dados = JSON.parse(linha.conteudo) as Record<
    string,
    Record<string, ValorDeJson>
  >;
  assert.equal(
    dados[`${FOLHA}::background_color`]?.['date_modified_gmt'],
    '2026-10-28 09:00:00',
  );
  assert.equal(dados[`${FOLHA}::header_textcolor`]?.['value'], '333333');
});

test('CA-1.3 gravar sobre conjunto ja aplicado ou na lixeira falha e ja devolve um identificador novo', () => {
  for (const estado of ['publish', 'trash']) {
    const existente = conjunto({ id: 9, estado });
    const { contexto, registro, personalizacao } = cenario({
      existentes: [existente],
    });

    const resultado = personalizacao.gravarSemAplicar(contexto, {
      abertura: aberta(existente),
      estado: 'draft',
      titulo: null,
      dados: {},
      enviados: { background_color: '#000000' },
    });

    assert.deepEqual(resultado, {
      ok: false,
      codigo: 'changeset_already_published',
      mensagem: MENSAGEM_DE_CONJUNTO_JA_APLICADO,
      proximoIdentificador: UUID_GERADO,
    });
    assert.deepEqual(registro.atualizar, []);
  }
});

test('CA-1.3 com estado pedido a gravacao e transacional: configuracao invalida nao grava nada', () => {
  const { contexto, registro, personalizacao } = cenario();

  const resultado = personalizacao.gravarSemAplicar(contexto, {
    abertura: aberta(null),
    estado: 'draft',
    titulo: null,
    dados: {},
    enviados: { background_color: '#000000', nao_registrada: 'x' },
  });

  assert.deepEqual(resultado, {
    ok: false,
    codigo: 'transaction_fail',
    mensagem: 'Unable to save due to 1 invalid setting.',
    validades: {
      background_color: true,
      nao_registrada: {
        codigo: 'unrecognized',
        mensagem: 'Setting does not exist or is unrecognized.',
      },
    },
  });
  assert.deepEqual(registro.inserir, []);

  // Sem estado, a mesma invalidez nao interrompe: so a entrada invalida e pulada.
  const semEstado = cenario();
  const gravado = semEstado.personalizacao.gravarSemAplicar(semEstado.contexto, {
    abertura: aberta(null),
    estado: null,
    titulo: null,
    dados: {},
    enviados: { background_color: '#000000', nao_registrada: 'x' },
  });
  assert.equal(gravado.ok, true);
  assert.equal(
    Object.keys(
      JSON.parse((semEstado.registro.inserir[0] as PedidoDoConjunto).conteudo),
    ).join(),
    `${FOLHA}::background_color`,
  );
});

/* ── CA-1.4 ────────────────────────────────────────────────────────────────── */

test('CA-1.4 toda verificacao da personalizacao resolve em administrar a aparencia', () => {
  assert.deepEqual(PERMISSOES_DA_PERSONALIZACAO, {
    abrir: 'customize',
    criarConjunto: 'customize',
    editarConjunto: 'customize',
    aplicarConjunto: 'customize',
  });

  const administrador = cenario().contexto.autorizacao;
  const editor = cenario({ ator: ator('editor') }).contexto.autorizacao;
  assert.equal(perguntarNaPersonalizacao(administrador, 'customize'), true);
  assert.equal(perguntarNaPersonalizacao(editor, 'customize'), false);
  assert.equal(
    perguntarNaPersonalizacao(editor, CAPACIDADE_DE_ADMINISTRAR_A_APARENCIA),
    false,
  );
});

test('CA-1.4 pedir aplicacao sem a capacidade e recusado com 403, num ponto separado da edicao', () => {
  const existente = conjunto({ id: 9, estado: 'draft' });
  // `user_has_cap` que nega a capacidade quando ela e pedida SEM objeto: a
  // edicao (`:2454`, com o identificador) passa, a aplicacao (`:2483`) nao.
  const { contexto, registro, personalizacao } = cenario({
    existentes: [existente],
    ganchos: {
      aoMontarCapacidadesDoAtor: (capacidades, _exigidas, argumentos) =>
        argumentos.length === 0
          ? new Map([...capacidades].filter(([nome]) => nome !== 'edit_theme_options'))
          : capacidades,
    },
  });

  const resultado = personalizacao.validarPedidoDeGravacao(
    contexto,
    pedido({
      corpo: {
        nonce: NONCE_DE_GRAVACAO,
        customize_changeset_status: 'publish',
      },
    }),
    aberta(existente),
  );

  assert.deepEqual(resultado, {
    ok: false,
    recusa: { codigo: 'changeset_publish_unauthorized', status: 403 },
  });
  assert.deepEqual(registro.atualizar, []);

  const semCapacidade = cenario({ ator: ator('editor') });
  assert.deepEqual(
    semCapacidade.personalizacao.validarPedidoDeGravacao(
      semCapacidade.contexto,
      pedido({ corpo: { nonce: NONCE_DE_GRAVACAO } }),
      aberta(null),
    ),
    { ok: false, recusa: { codigo: 'cannot_create_changeset_post', status: null } },
  );

  const administrador = cenario({ existentes: [existente] });
  const aceito = administrador.personalizacao.validarPedidoDeGravacao(
    administrador.contexto,
    pedido({
      corpo: { nonce: NONCE_DE_GRAVACAO, customize_changeset_status: 'future' },
    }),
    aberta(existente),
  );
  assert.equal(aceito.ok && aceito.pedido.ehAplicacao, true);
});

/* ── CA-1.5 ────────────────────────────────────────────────────────────────── */

test('CA-1.5 o anexo que entra pela personalizacao nasce como rascunho automatico', () => {
  const { personalizacao } = cenario();

  assert.deepEqual(
    personalizacao.pedidoDoAnexo(
      { post_title: 'Cafe', post_name: 'image-cafe' },
      FOLHA,
    ),
    {
      dados: { post_title: 'Cafe', post_status: 'auto-draft' },
      paiId: 0,
      metadados: [
        ['_starter_content_theme', FOLHA],
        ['_customize_draft_post_name', 'image-cafe'],
      ],
    },
  );
});

/* ── CA-1.6 ────────────────────────────────────────────────────────────────── */

test('CA-1.6 estado fora dos quatro aceitos e recusado com 400, e o rascunho automatico nao pode ser pedido', () => {
  for (const estado of ['auto-draft', 'private', 'trash', 'inherit', 'inventado']) {
    const { contexto, personalizacao } = cenario();
    assert.deepEqual(
      personalizacao.validarPedidoDeGravacao(
        contexto,
        pedido({
          corpo: { nonce: NONCE_DE_GRAVACAO, customize_changeset_status: estado },
        }),
        aberta(null),
      ),
      { ok: false, recusa: { codigo: 'bad_customize_changeset_status', status: 400 } },
      estado,
    );
  }

  for (const estado of ['draft', 'pending', 'publish', 'future']) {
    const { contexto, personalizacao } = cenario();
    const resultado = personalizacao.validarPedidoDeGravacao(
      contexto,
      pedido({
        corpo: { nonce: NONCE_DE_GRAVACAO, customize_changeset_status: estado },
      }),
      aberta(null),
    );
    assert.equal(resultado.ok && resultado.pedido.estado, estado);
  }
});

test('CA-1.6 dos quatro, o que nao esta registrado tambem e recusado', () => {
  const { contexto, personalizacao } = cenario({
    estadosRegistrados: ESTADOS_REGISTRADOS.filter((e) => e !== 'pending'),
  });

  assert.deepEqual(
    personalizacao.validarPedidoDeGravacao(
      contexto,
      pedido({
        corpo: { nonce: NONCE_DE_GRAVACAO, customize_changeset_status: 'pending' },
      }),
      aberta(null),
    ),
    { ok: false, recusa: { codigo: 'bad_customize_changeset_status', status: 400 } },
  );
});

test('as guardas anteriores ao estado seguem a ordem do legado', () => {
  const anonimo = cenario({ ator: ANONIMO });
  assert.deepEqual(
    anonimo.personalizacao.validarPedidoDeGravacao(
      anonimo.contexto,
      pedido({ corpo: { customize_changeset_status: 'auto-draft' } }),
      aberta(null),
    ),
    { ok: false, recusa: { codigo: 'unauthenticated', status: null } },
  );

  const semNonce = cenario();
  assert.deepEqual(
    semNonce.personalizacao.validarPedidoDeGravacao(
      semNonce.contexto,
      pedido({ corpo: { customize_changeset_status: 'auto-draft' } }),
      aberta(null),
    ),
    { ok: false, recusa: { codigo: 'invalid_nonce', status: null } },
  );

  const dadosRuins = cenario();
  assert.deepEqual(
    dadosRuins.personalizacao.validarPedidoDeGravacao(
      dadosRuins.contexto,
      pedido({
        corpo: { nonce: NONCE_DE_GRAVACAO, customize_changeset_data: '"texto"' },
      }),
      aberta(null),
    ),
    { ok: false, recusa: { codigo: 'invalid_customize_changeset_data', status: null } },
  );
});
