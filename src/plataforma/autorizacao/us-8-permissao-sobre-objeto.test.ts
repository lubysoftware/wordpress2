/**
 * Testes da entrega de **T017** (US-8): *"o comportamento de US-8 existe e os
 * criterios CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5 passam contra o sistema novo"*.
 *
 * Nao sao os testes de US-8: esses sao **T018**, sete casos registrados em
 * `backlog/tests.md` (UT-015-1 a UT-015-7), e esse arquivo nao esta nesta arvore.
 * Aqui estao os cinco criterios de aceite e as regras que a implementacao
 * quebraria **em silencio** — as que o cenario `@critico @invariante` de
 * `parity_tests/07-autorizacao-por-capacidade.feature` resume em quatro linhas:
 * *"as duas metades traduzem a capacidade antes de decidir; a mesma capacidade
 * verificada sem informar o objeto, as duas negam; o objeto informado nao existe,
 * as duas negam; e nenhuma das duas concede por ausencia de informacao"*.
 *
 * Os nomes de tipo usados nos casos sao inventados de proposito
 * (`conteudo-comum`, `conteudo-de-pagina`, …): nenhum ramo da traducao olha o nome
 * do tipo — tudo sai do **registro** dele —, e um teste que usasse os nomes de
 * fabrica passaria por acidente. O unico nome de tipo que a traducao conhece e
 * `revision`, e ele esta aqui como constante importada.
 *
 * Cada teste afirma as duas coisas que importam, e nunca so uma: a **lista
 * exigida** que a traducao devolveu, porque e ela que `PERM-3` descreve, e a
 * **decisao** sobre um ator concreto, porque e ela que o ator vive.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAPACIDADE_DA_PAGINA_ESPECIAL,
  CAPACIDADE_DE_PRIVACIDADE,
  CAPACIDADE_DE_PRIVACIDADE_EM_REDE,
  CAPACIDADE_MAIS_ALTA,
  CAPACIDADE_NEGADA,
  REDE_INATIVA_NA_AUTORIZACAO,
  TIPO_DE_REVISAO,
  capacidadesExigidas,
  casoDeConteudo,
  comAtor,
  ehSuperAdmin,
  perguntarPermissao,
  traducaoDePrivacidade,
  type AtorDeAutorizacao,
  type AvisoDeUsoIndevido,
  type BaseDeAutorizacao,
  type Capacidade,
  type ConteudoNaAutorizacao,
  type EstadoDeConteudoNaAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type MatrizDePapeis,
  type PapelDeclarado,
  type TipoDeConteudoNaAutorizacao,
} from './index.js';

// ── Montagem dos casos ──────────────────────────────────────────────────────

/** Quem escreveu, e quem nao escreveu. */
const AUTORA = 7;
const OUTRA_PESSOA = 9;

const TIPO_COMUM = 'conteudo-comum';
const TIPO_DE_PAGINA = 'conteudo-de-pagina';
const TIPO_QUE_DISPENSA = 'conteudo-de-terceiro';
const TIPO_INCOMPLETO = 'conteudo-mal-registrado';

/** Os dez nomes que um tipo da familia comum declara. */
const CAPACIDADES_COMUNS: Readonly<Record<string, Capacidade>> = {
  edit_posts: 'edit_posts',
  edit_others_posts: 'edit_others_posts',
  edit_published_posts: 'edit_published_posts',
  edit_private_posts: 'edit_private_posts',
  delete_posts: 'delete_posts',
  delete_others_posts: 'delete_others_posts',
  delete_published_posts: 'delete_published_posts',
  delete_private_posts: 'delete_private_posts',
  read: 'read',
  read_private_posts: 'read_private_posts',
};

/**
 * Os mesmos dez slots, com os nomes da familia de pagina.
 *
 * E este mapa, e **nenhum `if`**, que faz a assimetria de UC-07: *"a capacidade
 * muda de familia: `edit_others_pages`"*.
 */
const CAPACIDADES_DE_PAGINA: Readonly<Record<string, Capacidade>> = {
  edit_posts: 'edit_pages',
  edit_others_posts: 'edit_others_pages',
  edit_published_posts: 'edit_published_pages',
  edit_private_posts: 'edit_private_pages',
  delete_posts: 'delete_pages',
  delete_others_posts: 'delete_others_pages',
  delete_published_posts: 'delete_published_pages',
  delete_private_posts: 'delete_private_pages',
  read: 'read',
  read_private_posts: 'read_private_pages',
};

const TIPOS: readonly TipoDeConteudoNaAutorizacao[] = [
  { nome: TIPO_COMUM, traduzMetaCapacidade: true, capacidades: CAPACIDADES_COMUNS },
  {
    nome: TIPO_DE_PAGINA,
    traduzMetaCapacidade: true,
    capacidades: CAPACIDADES_DE_PAGINA,
  },
  {
    nome: TIPO_DE_REVISAO,
    traduzMetaCapacidade: true,
    capacidades: CAPACIDADES_COMUNS,
  },
  // O tipo que dispensa a traducao: o registro declara o nome pedido, e e esse
  // nome que sai, sem resolucao por autoria nenhuma.
  {
    nome: TIPO_QUE_DISPENSA,
    traduzMetaCapacidade: false,
    capacidades: {
      edit_post: 'mexer-no-de-terceiro',
      delete_post: 'apagar-o-de-terceiro',
      read_post: 'ler-o-de-terceiro',
    },
  },
  // O tipo registrado sem declarar os nomes que a resolucao consulta.
  { nome: TIPO_INCOMPLETO, traduzMetaCapacidade: true, capacidades: {} },
];

const ESTADOS: readonly EstadoDeConteudoNaAutorizacao[] = [
  { nome: 'publish', publico: true, privado: false },
  { nome: 'future', publico: false, privado: false },
  { nome: 'draft', publico: false, privado: false },
  { nome: 'pending', publico: false, privado: false },
  { nome: 'private', publico: false, privado: true },
  { nome: 'trash', publico: false, privado: false },
];

function conteudo(
  id: number,
  campos: {
    readonly tipo?: string;
    readonly estado?: string;
    readonly estadoParaLeitura?: string;
    readonly autorId?: number;
    readonly paiId?: number;
  } = {},
): ConteudoNaAutorizacao {
  const estado = campos.estado ?? 'draft';
  return {
    id,
    tipo: campos.tipo ?? TIPO_COMUM,
    estado,
    estadoParaLeitura: campos.estadoParaLeitura ?? estado,
    autorId: campos.autorId ?? AUTORA,
    paiId: campos.paiId ?? 0,
  };
}

interface Cenario {
  readonly conteudos?: readonly ConteudoNaAutorizacao[];
  readonly tipos?: readonly TipoDeConteudoNaAutorizacao[];
  readonly estados?: readonly EstadoDeConteudoNaAutorizacao[];
  readonly lixeira?: ReadonlyMap<number, string>;
  readonly paginaInicial?: number;
  readonly paginaDeConteudos?: number;
  readonly paginaDePolitica?: number;
}

/**
 * A fonte de conteudo de teste, com o registro do que ela foi perguntada.
 *
 * O registro existe porque dois testes afirmam uma **ausencia** de leitura: o
 * descartado de outra pessoa nao consulta o estado anterior, e o tipo que dispensa
 * a traducao nao consulta estado nenhum.
 */
function fonteDeConteudo(cenario: Cenario = {}): {
  readonly fonte: FonteDeConteudoNaAutorizacao;
  readonly avisos: readonly AvisoDeUsoIndevido[];
  readonly avisar: (aviso: AvisoDeUsoIndevido) => void;
  readonly leiturasDeLixeira: readonly number[];
} {
  const porId = new Map(
    (cenario.conteudos ?? []).map((registro) => [registro.id, registro]),
  );
  const tipos = new Map(
    (cenario.tipos ?? TIPOS).map((registro) => [registro.nome, registro]),
  );
  const estados = new Map(
    (cenario.estados ?? ESTADOS).map((registro) => [registro.nome, registro]),
  );
  const avisos: AvisoDeUsoIndevido[] = [];
  const leiturasDeLixeira: number[] = [];

  const fonte: FonteDeConteudoNaAutorizacao = {
    conteudo(referencia) {
      return typeof referencia === 'number'
        ? (porId.get(referencia) ?? null)
        : null;
    },
    tipoDeConteudo(nome) {
      return tipos.get(nome) ?? null;
    },
    estadoDeConteudo(nome) {
      return estados.get(nome) ?? null;
    },
    estadoAnteriorNaLixeira(conteudoId) {
      leiturasDeLixeira.push(conteudoId);
      return cenario.lixeira?.get(conteudoId) ?? '';
    },
    paginaInicial() {
      return cenario.paginaInicial ?? 0;
    },
    paginaDeConteudos() {
      return cenario.paginaDeConteudos ?? 0;
    },
    paginaDePoliticaDePrivacidade() {
      return cenario.paginaDePolitica ?? 0;
    },
  };

  return {
    fonte,
    avisos,
    avisar: (aviso) => {
      avisos.push(aviso);
    },
    leiturasDeLixeira,
  };
}

function papel(
  identificador: string,
  ...capacidades: readonly string[]
): PapelDeclarado {
  return {
    identificador,
    capacidades: capacidades.map((capacidade) => ({
      capacidade,
      concedida: true,
    })),
  };
}

function ator(contaId: number, ...papeis: readonly string[]): AtorDeAutorizacao {
  return {
    contaId,
    login: `conta-${contaId}`,
    existe: true,
    concessoes: papeis.map((capacidade) => ({ capacidade, concedida: true })),
  };
}

function base(
  fonte: FonteDeConteudoNaAutorizacao,
  resto: {
    readonly matriz?: MatrizDePapeis;
    readonly rede?: BaseDeAutorizacao['rede'];
    readonly avisar?: (aviso: AvisoDeUsoIndevido) => void;
  } = {},
): BaseDeAutorizacao {
  return {
    matriz: resto.matriz ?? [],
    rede: resto.rede ?? REDE_INATIVA_NA_AUTORIZACAO,
    casosDeTraducao: [casoDeConteudo(fonte, resto.avisar), traducaoDePrivacidade],
  };
}

/** O atalho mais usado daqui: a lista exigida para aquela conta e aquele objeto. */
function exigidas(
  fonte: FonteDeConteudoNaAutorizacao,
  contaId: number,
  capacidade: Capacidade,
  ...argumentos: readonly unknown[]
): readonly Capacidade[] {
  return capacidadesExigidas(
    comAtor(base(fonte), ator(contaId)),
    capacidade,
    ...argumentos,
  );
}

// ── CA-8.1 · autoria resolve em capacidades distintas ───────────────────────

const RASCUNHO_PROPRIO = 1;
const PUBLICADO_PROPRIO = 2;
const RASCUNHO_ALHEIO = 3;
const PUBLICADO_ALHEIO = 4;
const PRIVADO_ALHEIO = 5;
const AGENDADO_ALHEIO = 6;

function cenarioDeAutoria(): FonteDeConteudoNaAutorizacao {
  return fonteDeConteudo({
    conteudos: [
      conteudo(RASCUNHO_PROPRIO),
      conteudo(PUBLICADO_PROPRIO, { estado: 'publish' }),
      conteudo(RASCUNHO_ALHEIO, { autorId: OUTRA_PESSOA }),
      conteudo(PUBLICADO_ALHEIO, { autorId: OUTRA_PESSOA, estado: 'publish' }),
      conteudo(PRIVADO_ALHEIO, { autorId: OUTRA_PESSOA, estado: 'private' }),
      conteudo(AGENDADO_ALHEIO, { autorId: OUTRA_PESSOA, estado: 'future' }),
    ],
  }).fonte;
}

test('CA-8.1: editar resolve em capacidades distintas conforme o ator ser ou nao o autor', () => {
  const fonte = cenarioDeAutoria();

  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', RASCUNHO_PROPRIO), [
    'edit_posts',
  ]);
  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', PUBLICADO_PROPRIO), [
    'edit_published_posts',
  ]);
  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', RASCUNHO_ALHEIO), [
    'edit_others_posts',
  ]);

  // UC-07, passo 2: mexer no alheio SOMA a capacidade do estado.
  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', PUBLICADO_ALHEIO), [
    'edit_others_posts',
    'edit_published_posts',
  ]);
  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', AGENDADO_ALHEIO), [
    'edit_others_posts',
    'edit_published_posts',
  ]);
  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', PRIVADO_ALHEIO), [
    'edit_others_posts',
    'edit_private_posts',
  ]);
});

test('CA-8.1: apagar resolve na propria familia de capacidades, pela mesma autoria', () => {
  const fonte = cenarioDeAutoria();

  assert.deepEqual(exigidas(fonte, AUTORA, 'delete_post', RASCUNHO_PROPRIO), [
    'delete_posts',
  ]);
  assert.deepEqual(exigidas(fonte, AUTORA, 'delete_post', PUBLICADO_PROPRIO), [
    'delete_published_posts',
  ]);
  assert.deepEqual(exigidas(fonte, AUTORA, 'delete_post', PUBLICADO_ALHEIO), [
    'delete_others_posts',
    'delete_published_posts',
  ]);
  assert.deepEqual(exigidas(fonte, AUTORA, 'delete_post', PRIVADO_ALHEIO), [
    'delete_others_posts',
    'delete_private_posts',
  ]);
});

test('CA-8.1: o mesmo papel mexe no proprio rascunho e NAO no publicado de outro', () => {
  const fonte = cenarioDeAutoria();
  // A historia de US-8, na letra: "para que o mesmo papel possa mexer no proprio
  // rascunho e nao no publicado de outro".
  const contexto = comAtor(
    base(fonte, { matriz: [papel('papel-de-baixo', 'edit_posts')] }),
    ator(AUTORA, 'papel-de-baixo'),
  );

  assert.equal(perguntarPermissao(contexto, 'edit_post', RASCUNHO_PROPRIO), true);
  assert.equal(perguntarPermissao(contexto, 'edit_post', PUBLICADO_PROPRIO), false);
  assert.equal(perguntarPermissao(contexto, 'edit_post', RASCUNHO_ALHEIO), false);
  assert.equal(perguntarPermissao(contexto, 'edit_post', PUBLICADO_ALHEIO), false);
});

test('CA-8.1: sao exigidas TODAS as capacidades da lista, nao qualquer uma', () => {
  const fonte = cenarioDeAutoria();
  // Quem pode mexer no alheio mas nao no publicado nao mexe no publicado de
  // outro: `PERM-1` manda exigir todas as devolvidas.
  const soOAlheio = comAtor(
    base(fonte, { matriz: [papel('papel-do-meio', 'edit_others_posts')] }),
    ator(AUTORA, 'papel-do-meio'),
  );
  assert.equal(perguntarPermissao(soOAlheio, 'edit_post', RASCUNHO_ALHEIO), true);
  assert.equal(perguntarPermissao(soOAlheio, 'edit_post', PUBLICADO_ALHEIO), false);

  const asDuas = comAtor(
    base(fonte, {
      matriz: [papel('papel-de-cima', 'edit_others_posts', 'edit_published_posts')],
    }),
    ator(AUTORA, 'papel-de-cima'),
  );
  assert.equal(perguntarPermissao(asDuas, 'edit_post', PUBLICADO_ALHEIO), true);
});

test('CA-8.1: a familia de capacidade sai do REGISTRO do tipo, sem nenhum nome no codigo', () => {
  const fonte = fonteDeConteudo({
    conteudos: [
      conteudo(1, { tipo: TIPO_DE_PAGINA, autorId: OUTRA_PESSOA, estado: 'publish' }),
      conteudo(2, { tipo: TIPO_DE_PAGINA }),
    ],
  }).fonte;

  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', 1), [
    'edit_others_pages',
    'edit_published_pages',
  ]);
  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', 2), ['edit_pages']);
  assert.deepEqual(exigidas(fonte, AUTORA, 'delete_post', 1), [
    'delete_others_pages',
    'delete_published_pages',
  ]);
});

test('CA-8.1: autoria ausente cai no ramo do alheio, inclusive para quem nao esta autenticado', () => {
  // `$post->post_author` e testado por valor verdadeiro ANTES da comparacao. Sem
  // isso, a conta de identificador 0 seria autora de todo conteudo sem autor.
  const fonte = fonteDeConteudo({
    conteudos: [conteudo(1, { autorId: 0, estado: 'publish' })],
  }).fonte;

  assert.deepEqual(exigidas(fonte, 0, 'edit_post', 1), [
    'edit_others_posts',
    'edit_published_posts',
  ]);
  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', 1), [
    'edit_others_posts',
    'edit_published_posts',
  ]);
});

// ── CA-8.2 · o descartado e decidido pelo estado anterior ───────────────────

test('CA-8.2: o descartado proprio e decidido pelo estado que tinha antes do descarte', () => {
  const descartadoQueEraPublicado = 1;
  const descartadoQueEraAgendado = 2;
  const descartadoQueEraRascunho = 3;
  const descartadoSemMemoria = 4;
  const { fonte } = fonteDeConteudo({
    conteudos: [
      conteudo(descartadoQueEraPublicado, { estado: 'trash' }),
      conteudo(descartadoQueEraAgendado, { estado: 'trash' }),
      conteudo(descartadoQueEraRascunho, { estado: 'trash' }),
      conteudo(descartadoSemMemoria, { estado: 'trash' }),
    ],
    lixeira: new Map([
      [descartadoQueEraPublicado, 'publish'],
      [descartadoQueEraAgendado, 'future'],
      [descartadoQueEraRascunho, 'draft'],
    ]),
  });

  // UC-07: "um conteudo que estava publicado continua exigindo
  // delete_published_posts enquanto esta na lixeira".
  assert.deepEqual(
    exigidas(fonte, AUTORA, 'delete_post', descartadoQueEraPublicado),
    ['delete_published_posts'],
  );
  assert.deepEqual(
    exigidas(fonte, AUTORA, 'delete_post', descartadoQueEraAgendado),
    ['delete_published_posts'],
  );
  assert.deepEqual(
    exigidas(fonte, AUTORA, 'delete_post', descartadoQueEraRascunho),
    ['delete_posts'],
  );
  // UC-10: o estado anterior pode nao estar gravado, e ausente nao e publicado.
  assert.deepEqual(exigidas(fonte, AUTORA, 'delete_post', descartadoSemMemoria), [
    'delete_posts',
  ]);

  // Editar le a mesma memoria, na propria familia.
  assert.deepEqual(
    exigidas(fonte, AUTORA, 'edit_post', descartadoQueEraPublicado),
    ['edit_published_posts'],
  );
  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', descartadoQueEraRascunho), [
    'edit_posts',
  ]);
});

test('CA-8.2: restaurar usa a MESMA capacidade de descartar, lida da mesma memoria', () => {
  const descartado = 1;
  const { fonte } = fonteDeConteudo({
    conteudos: [conteudo(descartado, { estado: 'trash' })],
    lixeira: new Map([[descartado, 'publish']]),
  });
  // UC-10, linha de autorizacao: "restaurar usa a mesma capacidade de descartar,
  // resolvida pelo estado anterior lido dos metadados". Logo quem so tem a
  // capacidade comum nao restaura o que estava publicado.
  const comum = comAtor(
    base(fonte, { matriz: [papel('papel-de-baixo', 'delete_posts')] }),
    ator(AUTORA, 'papel-de-baixo'),
  );
  assert.equal(perguntarPermissao(comum, 'delete_post', descartado), false);

  const doPublicado = comAtor(
    base(fonte, {
      matriz: [papel('papel-do-meio', 'delete_posts', 'delete_published_posts')],
    }),
    ator(AUTORA, 'papel-do-meio'),
  );
  assert.equal(perguntarPermissao(doPublicado, 'delete_post', descartado), true);
});

test('CA-8.2: o descartado de OUTRA pessoa nao consulta a memoria da lixeira', () => {
  const descartadoAlheio = 1;
  const { fonte, leiturasDeLixeira } = fonteDeConteudo({
    conteudos: [
      conteudo(descartadoAlheio, { autorId: OUTRA_PESSOA, estado: 'trash' }),
    ],
    lixeira: new Map([[descartadoAlheio, 'publish']]),
  });

  // A assimetria e do legado: o ramo do alheio soma por `publish`/`future`/
  // `private`, e `trash` nao e nenhum dos tres. Ler a memoria aqui tornaria o
  // sistema MAIS fechado que o legado para quem administra conteudo alheio.
  assert.deepEqual(exigidas(fonte, AUTORA, 'delete_post', descartadoAlheio), [
    'delete_others_posts',
  ]);
  assert.deepEqual(leiturasDeLixeira, []);
});

// ── CA-8.3 · o que nao existe nega, em lugar de permitir por omissao ────────

test('CA-8.3: perguntar sem informar o objeto NEGA, e nao concede por ausencia', () => {
  const { fonte } = fonteDeConteudo({ conteudos: [conteudo(1)] });

  for (const capacidade of ['edit_post', 'delete_post', 'read_post']) {
    assert.deepEqual(
      exigidas(fonte, AUTORA, capacidade),
      [CAPACIDADE_NEGADA],
      `${capacidade} sem objeto deveria fechar a porta`,
    );
    assert.deepEqual(exigidas(fonte, AUTORA, capacidade, null), [
      CAPACIDADE_NEGADA,
    ]);
  }
});

test('CA-8.3: o objeto que nao existe mais NEGA, mesmo para quem tem tudo', () => {
  const { fonte } = fonteDeConteudo({ conteudos: [conteudo(1)] });
  const contexto = comAtor(
    base(fonte, {
      matriz: [
        papel(
          'papel-de-cima',
          'edit_posts',
          'edit_others_posts',
          'edit_published_posts',
          'delete_posts',
          'delete_others_posts',
          'delete_published_posts',
        ),
      ],
    }),
    ator(AUTORA, 'papel-de-cima'),
  );

  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', 404), [CAPACIDADE_NEGADA]);
  assert.equal(perguntarPermissao(contexto, 'edit_post', 404), false);
  assert.equal(perguntarPermissao(contexto, 'delete_post', 404), false);
  // E o que existe continua passando: a negacao e do objeto, nao do ator.
  assert.equal(perguntarPermissao(contexto, 'edit_post', 1), true);
});

test('CA-8.3: a revisao e transparente para editar e para ler, e orfa fecha a porta', () => {
  const revisaoComPai = 10;
  const revisaoOrfa = 11;
  const paiPublicado = 12;
  const { fonte } = fonteDeConteudo({
    conteudos: [
      conteudo(revisaoComPai, { tipo: TIPO_DE_REVISAO, paiId: paiPublicado }),
      conteudo(revisaoOrfa, { tipo: TIPO_DE_REVISAO, paiId: 999 }),
      conteudo(paiPublicado, { estado: 'publish' }),
    ],
  });

  // Decide-se sobre o PAI: a revisao propria de um conteudo publicado exige a
  // capacidade do publicado, nao a do rascunho que a revisao e.
  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', revisaoComPai), [
    'edit_published_posts',
  ]);
  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', revisaoOrfa), [
    CAPACIDADE_NEGADA,
  ]);
  assert.deepEqual(exigidas(fonte, AUTORA, 'read_post', revisaoOrfa), [
    CAPACIDADE_NEGADA,
  ]);
});

test('CA-8.3: revisao NAO se apaga por capacidade — nem pelo super administrador', () => {
  const revisao = 10;
  const pai = 12;
  const { fonte } = fonteDeConteudo({
    conteudos: [
      conteudo(revisao, { tipo: TIPO_DE_REVISAO, paiId: pai }),
      conteudo(pai, { estado: 'publish' }),
    ],
  });

  assert.deepEqual(exigidas(fonte, AUTORA, 'delete_post', revisao), [
    CAPACIDADE_NEGADA,
  ]);

  // ADR-0009: `do_not_allow` e o unico mecanismo que vence o super admin, e
  // este caso de objeto e um dos que o produzem.
  const rede = { ativa: true, loginsDeSuperAdmin: [`conta-${AUTORA}`] };
  const superAdmin = comAtor(base(fonte, { rede }), ator(AUTORA));
  assert.equal(ehSuperAdmin(superAdmin), true);
  assert.equal(perguntarPermissao(superAdmin, 'delete_post', pai), true);
  assert.equal(perguntarPermissao(superAdmin, 'delete_post', revisao), false);
});

// ── CA-8.4 · tipo ou estado nao registrado, e o aviso ───────────────────────

/**
 * ⚠️ **Estes dois testes fixam BR-MIGRAR-090, nao a letra de CA-8.4.** A spec diz
 * *"nega a acao"*; a analise diz *"degradam para a capacidade mais alta,
 * `edit_others_posts`, com aviso"*, e e ela que o **P1** manda seguir. A
 * divergencia de redacao esta registrada no cabecalho de
 * `traducao-de-conteudo.ts` e no relato desta tarefa. O efeito pratico de
 * degradar — e o que o teste afirma — e que a porta fecha para quem nao mexe no
 * alheio.
 */
test('CA-8.4: tipo nao registrado degrada para a capacidade mais alta, com aviso', () => {
  const { fonte, avisos, avisar } = fonteDeConteudo({
    conteudos: [conteudo(1, { tipo: 'tipo-que-ninguem-registrou' })],
  });
  const contexto = comAtor(
    base(fonte, {
      matriz: [papel('papel-de-baixo', 'edit_posts', 'delete_posts')],
      avisar,
    }),
    ator(AUTORA, 'papel-de-baixo'),
  );

  assert.deepEqual(capacidadesExigidas(contexto, 'edit_post', 1), [
    CAPACIDADE_MAIS_ALTA,
  ]);
  assert.deepEqual(capacidadesExigidas(contexto, 'delete_post', 1), [
    CAPACIDADE_MAIS_ALTA,
  ]);
  assert.deepEqual(capacidadesExigidas(contexto, 'read_post', 1), [
    CAPACIDADE_MAIS_ALTA,
  ]);

  // A porta fecha para quem tem a capacidade comum e nao a do alheio.
  assert.equal(perguntarPermissao(contexto, 'edit_post', 1), false);
  assert.equal(perguntarPermissao(contexto, 'delete_post', 1), false);

  assert.equal(avisos.length, 5);
  for (const aviso of avisos) {
    assert.equal(aviso.funcao, 'map_meta_cap');
    assert.ok(aviso.mensagem.includes('tipo-que-ninguem-registrou'));
    assert.ok(aviso.mensagem.includes('is not registered'));
  }
  assert.ok(avisos[0]?.mensagem.includes('edit_post'));
});

test('CA-8.4: estado nao registrado degrada do mesmo jeito, e e so o caso de ler que o consulta', () => {
  const { fonte, avisos, avisar } = fonteDeConteudo({
    conteudos: [conteudo(1, { estado: 'estado-que-ninguem-registrou' })],
  });
  const contexto = comAtor(base(fonte, { avisar }), ator(AUTORA));

  assert.deepEqual(capacidadesExigidas(contexto, 'read_post', 1), [
    CAPACIDADE_MAIS_ALTA,
  ]);
  assert.equal(avisos.length, 1);
  assert.ok(avisos[0]?.mensagem.includes('estado-que-ninguem-registrou'));
  assert.ok(avisos[0]?.mensagem.includes('post status'));

  // Editar e apagar NAO consultam o registro de estado: um estado desconhecido
  // simplesmente nao e publicado, nem lixeira, nem privado.
  assert.deepEqual(capacidadesExigidas(contexto, 'edit_post', 1), ['edit_posts']);
  assert.deepEqual(capacidadesExigidas(contexto, 'delete_post', 1), [
    'delete_posts',
  ]);
  assert.equal(avisos.length, 1);
});

test('CA-8.4 (P7): o aviso nao decide nada — sem relator, a lista e a mesma', () => {
  const cenario: Cenario = {
    conteudos: [conteudo(1, { tipo: 'tipo-que-ninguem-registrou' })],
  };
  const comRelator = fonteDeConteudo(cenario);
  const semRelator = fonteDeConteudo(cenario);

  assert.deepEqual(
    capacidadesExigidas(
      comAtor(
        base(comRelator.fonte, { avisar: comRelator.avisar }),
        ator(AUTORA),
      ),
      'edit_post',
      1,
    ),
    capacidadesExigidas(
      comAtor(base(semRelator.fonte), ator(AUTORA)),
      'edit_post',
      1,
    ),
  );
  assert.equal(comRelator.avisos.length, 1);
  assert.equal(semRelator.avisos.length, 0);
});

// ── CA-8.5 · conteudo com funcao especial declarada ─────────────────────────

test('CA-8.5: a pagina inicial e a de conteudos exigem a capacidade da funcao EM LUGAR da comum', () => {
  const paginaInicial = 1;
  const paginaDeConteudos = 2;
  const paginaComum = 3;
  const { fonte } = fonteDeConteudo({
    conteudos: [
      conteudo(paginaInicial, { tipo: TIPO_DE_PAGINA, estado: 'publish' }),
      conteudo(paginaDeConteudos, { tipo: TIPO_DE_PAGINA, estado: 'publish' }),
      conteudo(paginaComum, { tipo: TIPO_DE_PAGINA, estado: 'publish' }),
    ],
    paginaInicial,
    paginaDeConteudos,
  });

  // Em lugar, e nao somada: a lista tem um nome so, e nenhum e de conteudo.
  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', paginaInicial), [
    CAPACIDADE_DA_PAGINA_ESPECIAL,
  ]);
  assert.deepEqual(exigidas(fonte, AUTORA, 'delete_post', paginaDeConteudos), [
    CAPACIDADE_DA_PAGINA_ESPECIAL,
  ]);
  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', paginaComum), [
    'edit_published_pages',
  ]);

  // UC-07: "o editor nao edita a pagina inicial" — quem tem toda a familia de
  // pagina e nao tem a capacidade de configuracao nao passa.
  const contexto = comAtor(
    base(fonte, {
      matriz: [
        papel(
          'papel-do-meio',
          'edit_pages',
          'edit_others_pages',
          'edit_published_pages',
        ),
      ],
    }),
    ator(AUTORA, 'papel-do-meio'),
  );
  assert.equal(perguntarPermissao(contexto, 'edit_post', paginaComum), true);
  assert.equal(perguntarPermissao(contexto, 'edit_post', paginaInicial), false);
});

test('CA-8.5: ler a pagina inicial NAO exige a capacidade da funcao', () => {
  const paginaInicial = 1;
  const { fonte } = fonteDeConteudo({
    conteudos: [conteudo(paginaInicial, { tipo: TIPO_DE_PAGINA, estado: 'publish' })],
    paginaInicial,
  });

  // O caso de ler nao tem o ramo da funcao especial, e nao se inventa um.
  assert.deepEqual(exigidas(fonte, AUTORA, 'read_post', paginaInicial), ['read']);
});

test('CA-8.5: a pagina de politica SOMA a capacidade de privacidade a comum (D5)', () => {
  const paginaDePolitica = 1;
  const { fonte } = fonteDeConteudo({
    conteudos: [
      conteudo(paginaDePolitica, { tipo: TIPO_DE_PAGINA, estado: 'publish' }),
    ],
    paginaDePolitica,
  });

  // Somada, e nao em lugar: a lista tem a capacidade de conteudo E a de
  // privacidade, ja traduzida (BR-MIGRAR-042).
  assert.deepEqual(exigidas(fonte, AUTORA, 'delete_post', paginaDePolitica), [
    'delete_published_pages',
    CAPACIDADE_DA_PAGINA_ESPECIAL,
  ]);
  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', paginaDePolitica), [
    'edit_published_pages',
    CAPACIDADE_DA_PAGINA_ESPECIAL,
  ]);

  const contexto = comAtor(
    base(fonte, {
      matriz: [papel('papel-do-meio', 'delete_published_pages')],
    }),
    ator(AUTORA, 'papel-do-meio'),
  );
  assert.equal(
    perguntarPermissao(contexto, 'delete_post', paginaDePolitica),
    false,
  );

  const comPrivacidade = comAtor(
    base(fonte, {
      matriz: [
        papel(
          'papel-de-cima',
          'delete_published_pages',
          CAPACIDADE_DA_PAGINA_ESPECIAL,
        ),
      ],
    }),
    ator(AUTORA, 'papel-de-cima'),
  );
  assert.equal(
    perguntarPermissao(comPrivacidade, 'delete_post', paginaDePolitica),
    true,
  );
});

test('CA-8.5: em rede, a capacidade de privacidade resolve na da rede (BR-MIGRAR-042)', () => {
  const paginaDePolitica = 1;
  const { fonte } = fonteDeConteudo({
    conteudos: [conteudo(paginaDePolitica, { estado: 'publish' })],
    paginaDePolitica,
  });
  const rede = { ativa: true, loginsDeSuperAdmin: ['dona-da-rede'] };
  const contexto = comAtor(base(fonte, { rede }), ator(AUTORA));

  assert.deepEqual(capacidadesExigidas(contexto, 'delete_post', paginaDePolitica), [
    'delete_published_posts',
    CAPACIDADE_DE_PRIVACIDADE_EM_REDE,
  ]);

  // E quem pergunta pela capacidade de privacidade direto recebe a mesma
  // traducao, nos dois modos de instalacao.
  assert.deepEqual(
    capacidadesExigidas(contexto, CAPACIDADE_DE_PRIVACIDADE),
    [CAPACIDADE_DE_PRIVACIDADE_EM_REDE],
  );
  assert.deepEqual(
    exigidas(fonte, AUTORA, CAPACIDADE_DE_PRIVACIDADE),
    [CAPACIDADE_DA_PAGINA_ESPECIAL],
  );
});

test('CA-8.5: a funcao de pagina inicial PARA o caso antes do ramo de privacidade', () => {
  // A mesma pagina nas duas opcoes: o ramo da funcao especial termina o caso, e
  // a capacidade de privacidade nao e somada. A ordem e a regra.
  const pagina = 1;
  const { fonte } = fonteDeConteudo({
    conteudos: [conteudo(pagina, { tipo: TIPO_DE_PAGINA, estado: 'publish' })],
    paginaInicial: pagina,
    paginaDePolitica: pagina,
  });

  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', pagina), [
    CAPACIDADE_DA_PAGINA_ESPECIAL,
  ]);
});

// ── Regras que a implementacao quebraria em silencio ───────────────────────

test('PERM-3: o tipo que dispensa a traducao nao tem resolucao por autoria nenhuma', () => {
  const proprio = 1;
  const alheio = 2;
  const { fonte, leiturasDeLixeira } = fonteDeConteudo({
    conteudos: [
      conteudo(proprio, { tipo: TIPO_QUE_DISPENSA, estado: 'trash' }),
      conteudo(alheio, {
        tipo: TIPO_QUE_DISPENSA,
        autorId: OUTRA_PESSOA,
        estado: 'publish',
      }),
    ],
    lixeira: new Map([[proprio, 'publish']]),
  });

  for (const id of [proprio, alheio]) {
    assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', id), [
      'mexer-no-de-terceiro',
    ]);
    assert.deepEqual(exigidas(fonte, AUTORA, 'delete_post', id), [
      'apagar-o-de-terceiro',
    ]);
    assert.deepEqual(exigidas(fonte, AUTORA, 'read_post', id), [
      'ler-o-de-terceiro',
    ]);
  }
  assert.deepEqual(leiturasDeLixeira, []);
});

test('PERM-3: o registro incompleto nega sem produzir do_not_allow', () => {
  // ⚠️ Borda do legado: `$post_type->cap->$cap` ausente acrescenta nulo a lista,
  // e a comparacao final nega. Nulo NAO e `do_not_allow`, logo o atalho do super
  // administrador continua passando. Ver CAPACIDADE_SEM_NOME.
  const { fonte } = fonteDeConteudo({
    conteudos: [conteudo(1, { tipo: TIPO_INCOMPLETO })],
  });

  const lista = exigidas(fonte, AUTORA, 'edit_post', 1);
  assert.deepEqual(lista, ['']);
  assert.ok(!lista.includes(CAPACIDADE_NEGADA));

  const semRede = comAtor(
    base(fonte, { matriz: [papel('papel-de-cima', 'edit_posts')] }),
    ator(AUTORA, 'papel-de-cima'),
  );
  assert.equal(perguntarPermissao(semRede, 'edit_post', 1), false);

  const rede = { ativa: true, loginsDeSuperAdmin: [`conta-${AUTORA}`] };
  const emRede = comAtor(base(fonte, { rede }), ator(AUTORA));
  assert.equal(perguntarPermissao(emRede, 'edit_post', 1), true);
});

test('o caso de ler: publico basta a capacidade de ler, privado exige a de privado', () => {
  const publicado = 1;
  const privadoAlheio = 2;
  const privadoProprio = 3;
  const { fonte } = fonteDeConteudo({
    conteudos: [
      conteudo(publicado, { autorId: OUTRA_PESSOA, estado: 'publish' }),
      conteudo(privadoAlheio, { autorId: OUTRA_PESSOA, estado: 'private' }),
      conteudo(privadoProprio, { estado: 'private' }),
    ],
  });

  assert.deepEqual(exigidas(fonte, AUTORA, 'read_post', publicado), ['read']);
  // UC-03, fluxo "publicar como privado": "o conteudo passa a exigir
  // read_private_posts de quem o le".
  assert.deepEqual(exigidas(fonte, AUTORA, 'read_post', privadoAlheio), [
    'read_private_posts',
  ]);
  // Quem escreveu le o proprio, em qualquer estado.
  assert.deepEqual(exigidas(fonte, AUTORA, 'read_post', privadoProprio), ['read']);
});

test('o caso de ler: estado nem publico nem privado cai inteiro na resolucao de EDICAO', () => {
  const rascunhoAlheio = 1;
  const agendadoAlheio = 2;
  const { fonte } = fonteDeConteudo({
    conteudos: [
      conteudo(rascunhoAlheio, { autorId: OUTRA_PESSOA }),
      conteudo(agendadoAlheio, { autorId: OUTRA_PESSOA, estado: 'future' }),
    ],
  });

  // A lista devolvida SUBSTITUI a da leitura: quem pode editar o rascunho de
  // outra pessoa pode ve-lo, e ninguem mais.
  assert.deepEqual(exigidas(fonte, AUTORA, 'read_post', rascunhoAlheio), [
    'edit_others_posts',
  ]);
  assert.deepEqual(exigidas(fonte, AUTORA, 'read_post', agendadoAlheio), [
    'edit_others_posts',
    'edit_published_posts',
  ]);
});

test('o caso de ler consulta o estado RESOLVIDO, nao o estado cru', () => {
  // O campo existe porque `get_post_status()` resolve o estado de um anexo pelo
  // pai; editar e apagar continuam no estado cru. Ver ConteudoNaAutorizacao.
  const { fonte } = fonteDeConteudo({
    conteudos: [
      conteudo(1, { estado: 'inherit', estadoParaLeitura: 'publish' }),
    ],
    estados: [
      ...ESTADOS,
      { nome: 'inherit', publico: false, privado: false },
    ],
  });

  assert.deepEqual(exigidas(fonte, AUTORA, 'read_post', 1), ['read']);
  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post', 1), ['edit_posts']);
});

test('o caso devolve null para o que nao e capacidade de conteudo', () => {
  const { fonte } = fonteDeConteudo({ conteudos: [conteudo(1)] });

  // O ramo final da traducao devolve a propria capacidade pedida: o caso de
  // conteudo nao se mete no que nao e dele.
  assert.deepEqual(exigidas(fonte, AUTORA, 'manage_options'), ['manage_options']);
  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_posts'), ['edit_posts']);
  assert.deepEqual(exigidas(fonte, AUTORA, 'edit_post_meta', 1), [
    'edit_post_meta',
  ]);
});

test('a lista exigida nunca e vazia nos casos de conteudo', () => {
  // Lista vazia significa PERMITIDO (`PERM-6`), e nenhum ramo de conteudo a
  // produz. Se um dia produzir, a pergunta passa a ser concedida a todos.
  const { fonte } = fonteDeConteudo({
    conteudos: [
      conteudo(1),
      conteudo(2, { estado: 'publish' }),
      conteudo(3, { autorId: OUTRA_PESSOA, estado: 'private' }),
      conteudo(4, { estado: 'trash' }),
      conteudo(5, { tipo: TIPO_DE_REVISAO, paiId: 2 }),
      conteudo(6, { tipo: TIPO_QUE_DISPENSA }),
      conteudo(7, { tipo: 'tipo-que-ninguem-registrou' }),
    ],
  });

  for (const id of [1, 2, 3, 4, 5, 6, 7, 404, null]) {
    for (const capacidade of ['edit_post', 'delete_post', 'read_post']) {
      assert.ok(
        exigidas(fonte, AUTORA, capacidade, id).length > 0,
        `${capacidade} sobre ${String(id)} devolveu lista vazia, que significa PERMITIDO`,
      );
    }
  }
});
