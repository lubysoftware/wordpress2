/**
 * Testes da entrega de **T003** (US-1): *"o comportamento de US-1 existe e os
 * criterios CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5 passam contra o sistema
 * novo"*.
 *
 * **Nao sao os testes de US-1**: esses sao **T004**, sete casos registrados em
 * `backlog/tests.md` (UT-047-1 a UT-047-7), que se **transcrevem** do catalogo e
 * nao se reconstroem. Aqui estao os cinco criterios de aceite e o que a
 * implementacao quebraria **em silencio**: a ordem dos doze passos, o que
 * acontece quando nenhum comando sai, e o estado inconsistente que sobra quando
 * a gravacao falha no meio.
 *
 * O criterio desta area de paridade e *"efeito no banco"* — a area 3 da Decisao
 * 2 de `parity_specs.md` manda comparar *"snapshot + sequencia de comandos"* —, e
 * e por isso que a porta falsa de T002 **registra comando** em lugar de simular
 * banco, e que a sequencia de colaboracoes e afirmada numa lista so: um teste que
 * olhasse apenas o estado final passaria com os passos trocados de lugar.
 *
 * Os nomes de tipo de conteudo sao inventados de proposito (`conteudo-comum`), do
 * mesmo jeito que em `us-8-permissao-sobre-objeto.test.ts`: nenhum ramo da
 * traducao de capacidade olha o nome do tipo — tudo sai do **registro** dele —, e
 * um teste que usasse `post` passaria por acidente. O unico nome de tipo que a
 * traducao conhece e `revision`, e ele entra aqui como constante importada.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAPACIDADE_NEGADA,
  REDE_INATIVA_NA_AUTORIZACAO,
  TIPO_DE_REVISAO,
  capacidadesExigidas,
  casoDeConteudo,
  comAtor,
  traducaoDePrivacidade,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type Capacidade,
  type ConteudoNaAutorizacao,
  type EstadoDeConteudoNaAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarMarcadoresDeLixeiraDoConteudo,
  criarPortaDeDadosFalsa,
  MARCADOR_DE_ESTADO_ANTERIOR,
  MARCADOR_DO_INSTANTE_DO_DESCARTE,
  textoDoParametro,
} from '../armazenamento/index.js';
import { PRAZO_DE_RETENCAO_DE_FABRICA } from '../configuracao/index.js';
import type { PortaDeDados, PortaDeRelogio } from '../portas/index.js';
import {
  CODIGO_HTTP_DE_RECUSA_NO_PAINEL,
  ESTADO_DE_LIXEIRA,
  MENSAGEM_DE_RECUSA_NO_PAINEL,
  PROPRIEDADES_DO_ESTADO_DE_LIXEIRA,
  descartar,
  descartarParaALixeira,
  type ContextoDeDescarte,
  type GanchosDoDescarte,
  type RegistroNoDescarte,
} from './index.js';

// ── Montagem ────────────────────────────────────────────────────────────────

/** Quem escreveu, e quem nao escreveu. */
const AUTORA = 7;
const OUTRA_PESSOA = 9;

const CONTEUDO_ID = 42;
const TIPO_COMUM = 'conteudo-comum';

/** O instante que o relogio controlado devolve — o `time()` do descarte. */
const AGORA = 1762800000;

/** Os slots que a familia de exclusao consulta no registro do tipo. */
const CAPACIDADES_COMUNS: Readonly<Record<string, Capacidade>> = {
  delete_posts: 'delete_posts',
  delete_others_posts: 'delete_others_posts',
  delete_published_posts: 'delete_published_posts',
  delete_private_posts: 'delete_private_posts',
  edit_posts: 'edit_posts',
  edit_others_posts: 'edit_others_posts',
  read: 'read',
};

const TIPOS: readonly TipoDeConteudoNaAutorizacao[] = [
  {
    nome: TIPO_COMUM,
    traduzMetaCapacidade: true,
    capacidades: CAPACIDADES_COMUNS,
  },
  {
    nome: TIPO_DE_REVISAO,
    traduzMetaCapacidade: true,
    capacidades: CAPACIDADES_COMUNS,
  },
];

const ESTADOS: readonly EstadoDeConteudoNaAutorizacao[] = [
  { nome: 'publish', publico: true, privado: false },
  { nome: 'draft', publico: false, privado: false },
  { nome: 'private', publico: false, privado: true },
  { nome: 'inherit', publico: false, privado: false },
  { nome: ESTADO_DE_LIXEIRA, publico: false, privado: false },
];

function conteudoNaAutorizacao(
  campos: {
    readonly id?: number;
    readonly tipo?: string;
    readonly estado?: string;
    readonly autorId?: number;
    readonly paiId?: number;
  } = {},
): ConteudoNaAutorizacao {
  const estado = campos.estado ?? 'publish';
  return {
    id: campos.id ?? CONTEUDO_ID,
    tipo: campos.tipo ?? TIPO_COMUM,
    estado,
    estadoParaLeitura: estado,
    autorId: campos.autorId ?? AUTORA,
    paiId: campos.paiId ?? 0,
  };
}

function ator(
  contaId: number,
  ...capacidades: readonly string[]
): AtorDeAutorizacao {
  return {
    contaId,
    login: `conta-${contaId}`,
    existe: true,
    concessoes: capacidades.map((capacidade) => ({
      capacidade,
      concedida: true,
    })),
  };
}

interface OpcoesDoCenario {
  /** A linha de `{site}posts` que a porta de BC-01 devolve, ou `null`. */
  readonly registro?: RegistroNoDescarte | null;
  /** Quantos dias de lixeira. Omitido, os 30 de fabrica. */
  readonly diasNaLixeira?: number;
  /** `wp_update_post()` devolvendo `0` — a falha do passo 10. */
  readonly gravacaoFalha?: boolean;
  /** O que a exclusao definitiva do passo 1 devolve. */
  readonly exclusaoApaga?: boolean;
  /** O conteudo como a **autorizacao** o le (pode divergir do de cima). */
  readonly conteudoNaAutorizacao?: ConteudoNaAutorizacao;
  readonly ator?: AtorDeAutorizacao;
  readonly emRede?: boolean;
  readonly paginaInicial?: number;
  readonly paginaDeConteudos?: number;
  readonly paginaDePolitica?: number;
  readonly ganchos?: GanchosDoDescarte;
}

interface Cenario {
  readonly contexto: ContextoDeDescarte;
  /** Toda escrita e toda leitura pedidas a porta de dados, na ordem. */
  readonly escritas: readonly { texto: string; parametros: readonly unknown[] }[];
  /** A sequencia de **tudo** — comando, colaboracao e ponto de extensao. */
  readonly sequencia: readonly string[];
  readonly estadosGravados: readonly { id: number; estado: string }[];
  readonly leiturasDeConteudo: readonly number[];
  readonly exclusoesDefinitivas: readonly number[];
  readonly suspensoes: readonly number[];
  readonly base: BaseDeAutorizacao;
}

/**
 * Monta o contexto da operacao com tudo registrado: os comandos, as
 * colaboracoes de ligacao tardia e os tres pontos de extensao.
 *
 * A porta de dados de T002 e **envolvida** por outra que escreve na mesma lista
 * de sequencia, para que a ordem entre comando e colaboracao seja afirmavel. Sem
 * isso haveria dois registros paralelos e a interleacao — que e justamente o que
 * a area 3 da Decisao 2 compara — ficaria de fora.
 */
function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const sequencia: string[] = [];
  const estadosGravados: { id: number; estado: string }[] = [];
  const leiturasDeConteudo: number[] = [];
  const exclusoesDefinitivas: number[] = [];
  const suspensoes: number[] = [];

  const registro =
    opcoes.registro === undefined
      ? { id: CONTEUDO_ID, estado: 'publish' }
      : opcoes.registro;

  const falsa = criarPortaDeDadosFalsa();
  const dados: PortaDeDados = {
    prefixoDeTabela: falsa.porta.prefixoDeTabela,
    selecionar(consulta) {
      sequencia.push(`selecionar:${consulta.texto}`);
      return falsa.porta.selecionar(consulta);
    },
    escrever(consulta) {
      sequencia.push(`escrever:${String(consulta.parametros[1])}`);
      return falsa.porta.escrever(consulta);
    },
  };

  const relogio: PortaDeRelogio = {
    agoraEmSegundos() {
      sequencia.push('relogio');
      return AGORA;
    },
  };

  const naAutorizacao =
    opcoes.conteudoNaAutorizacao ?? conteudoNaAutorizacao({});
  const fonte: FonteDeConteudoNaAutorizacao = {
    conteudo(referencia) {
      return typeof referencia === 'number' && referencia === naAutorizacao.id
        ? naAutorizacao
        : null;
    },
    tipoDeConteudo(nome) {
      return TIPOS.find((tipo) => tipo.nome === nome) ?? null;
    },
    estadoDeConteudo(nome) {
      return ESTADOS.find((estado) => estado.nome === nome) ?? null;
    },
    estadoAnteriorNaLixeira() {
      return '';
    },
    paginaInicial() {
      return opcoes.paginaInicial ?? 0;
    },
    paginaDeConteudos() {
      return opcoes.paginaDeConteudos ?? 0;
    },
    paginaDePoliticaDePrivacidade() {
      return opcoes.paginaDePolitica ?? 0;
    },
  };

  const base: BaseDeAutorizacao = {
    matriz: [],
    rede:
      opcoes.emRede === true
        ? { ativa: true, loginsDeSuperAdmin: ['conta-1'] }
        : REDE_INATIVA_NA_AUTORIZACAO,
    casosDeTraducao: [casoDeConteudo(fonte), traducaoDePrivacidade],
  };

  const ganchosRegistrados: GanchosDoDescarte = {
    filtrarDescarte: (descarte, conteudo, estadoAnterior) => {
      sequencia.push(`gancho:pre_trash_post:${estadoAnterior}`);
      return (
        opcoes.ganchos?.filtrarDescarte?.(
          descarte,
          conteudo,
          estadoAnterior,
        ) ?? null
      );
    },
    antesDeDescartar: (conteudoId, estadoAnterior) => {
      sequencia.push(`gancho:wp_trash_post:${conteudoId}:${estadoAnterior}`);
      opcoes.ganchos?.antesDeDescartar?.(conteudoId, estadoAnterior);
    },
    depoisDeDescartar: (conteudoId, estadoAnterior) => {
      sequencia.push(`gancho:trashed_post:${conteudoId}:${estadoAnterior}`);
      opcoes.ganchos?.depoisDeDescartar?.(conteudoId, estadoAnterior);
    },
  };

  const contexto: ContextoDeDescarte = {
    base,
    ator:
      opcoes.ator ??
      ator(
        AUTORA,
        'delete_posts',
        'delete_others_posts',
        'delete_published_posts',
        'delete_private_posts',
      ),
    prazoDeRetencao:
      opcoes.diasNaLixeira === undefined
        ? PRAZO_DE_RETENCAO_DE_FABRICA
        : { diasNaLixeira: opcoes.diasNaLixeira },
    relogio,
    armazenamento: {
      marcadoresDoConteudo: criarMarcadoresDeLixeiraDoConteudo(dados),
    },
    conteudo: {
      obterPorId(conteudoId) {
        sequencia.push(`le-conteudo:${conteudoId}`);
        leiturasDeConteudo.push(conteudoId);
        return registro;
      },
      gravarEstado(conteudoId, estado) {
        sequencia.push(`grava-estado:${conteudoId}:${estado}`);
        estadosGravados.push({ id: conteudoId, estado });
        return opcoes.gravacaoFalha === true ? 0 : conteudoId;
      },
    },
    exclusaoDefinitiva: (conteudoId) => {
      sequencia.push(`apaga-em-definitivo:${conteudoId}`);
      exclusoesDefinitivas.push(conteudoId);
      return opcoes.exclusaoApaga ?? true;
    },
    suspenderComentarios: (conteudoId) => {
      sequencia.push(`suspende-comentarios:${conteudoId}`);
      suspensoes.push(conteudoId);
    },
    ganchos: ganchosRegistrados,
  };

  return {
    contexto,
    escritas: falsa.escritas,
    sequencia,
    estadosGravados,
    leiturasDeConteudo,
    exclusoesDefinitivas,
    suspensoes,
    base,
  };
}

// ── CA-1.1 ──────────────────────────────────────────────────────────────────

test('CA-1.1 o descarte guarda o estado que o conteudo tinha e o instante, como metadado do conteudo', () => {
  const cena = cenario();

  const resultado = descartar(cena.contexto, { conteudoId: CONTEUDO_ID });

  assert.equal(resultado.desfecho, 'descartado');
  assert.equal(resultado.estadoAnterior, 'publish');
  assert.equal(resultado.instanteDoDescarte, AGORA);

  // `add_post_meta( $post_id, '_wp_trash_meta_status', $previous_status )` e
  // `add_post_meta( $post_id, '_wp_trash_meta_time', time() )`
  // (`wp-includes/post.php:4128` e `:4129`): duas insercoes, nessa ordem, e
  // nenhum `SELECT` antes — a forma com `$unique` nao e a que o legado usa.
  assert.equal(cena.escritas.length, 2);
  assert.equal(
    cena.escritas[0]?.texto,
    'INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (?, ?, ?)',
  );
  assert.deepEqual(cena.escritas[0]?.parametros, [
    CONTEUDO_ID,
    MARCADOR_DE_ESTADO_ANTERIOR,
    'publish',
  ]);
  assert.deepEqual(cena.escritas[1]?.parametros, [
    CONTEUDO_ID,
    MARCADOR_DO_INSTANTE_DO_DESCARTE,
    AGORA,
  ]);

  // O instante chega a coluna `longtext` como a cadeia decimal que a coleta de
  // T011 vai comparar com `meta_value < %d`.
  assert.equal(
    textoDoParametro(cena.escritas[1]?.parametros[2]),
    '1762800000',
  );
});

test('CA-1.1 a ordem dos doze passos e a do legado, comando por comando', () => {
  const cena = cenario();

  descartar(cena.contexto, { conteudoId: CONTEUDO_ID });

  // E esta lista que um porte troca sem quebrar nenhuma afirmacao de estado
  // final — e o que o cenario de paridade compara. As duas leituras da mesma
  // linha sao do legado: a superficie le (`wp-admin/post.php:253`) e
  // `wp_trash_post()` le de novo (`wp-includes/post.php:4089`), sem cache de
  // objeto nesta arvore.
  assert.deepEqual(cena.sequencia, [
    `le-conteudo:${CONTEUDO_ID}`,
    `le-conteudo:${CONTEUDO_ID}`,
    'gancho:pre_trash_post:publish',
    `gancho:wp_trash_post:${CONTEUDO_ID}:publish`,
    `escrever:${MARCADOR_DE_ESTADO_ANTERIOR}`,
    'relogio',
    `escrever:${MARCADOR_DO_INSTANTE_DO_DESCARTE}`,
    `grava-estado:${CONTEUDO_ID}:${ESTADO_DE_LIXEIRA}`,
    `suspende-comentarios:${CONTEUDO_ID}`,
    `gancho:trashed_post:${CONTEUDO_ID}:publish`,
  ]);
});

test('CA-1.1 o retorno carrega o estado ANTERIOR, nao o estado de lixeira', () => {
  const cena = cenario();

  const resultado = descartar(cena.contexto, { conteudoId: CONTEUDO_ID });

  // `return $post` (`wp-includes/post.php:4155`) devolve o registro lido antes
  // da gravacao: nada no caminho repassa o estado novo ao objeto em memoria.
  // Quem le o estado do retorno sem reconsultar ve o conteudo como ele era — e
  // e por isso que a API REST reconsulta (`:1171`).
  assert.equal(resultado.conteudo?.estado, 'publish');
  assert.equal(resultado.estadoGravado, ESTADO_DE_LIXEIRA);
});

// ── CA-1.2 ──────────────────────────────────────────────────────────────────

test('CA-1.2 o conteudo descartado continua existindo: o estado e trocado, nada e apagado', () => {
  const cena = cenario();

  const resultado = descartar(cena.contexto, { conteudoId: CONTEUDO_ID });

  assert.equal(resultado.estadoGravado, ESTADO_DE_LIXEIRA);
  assert.deepEqual([...cena.estadosGravados], [
    { id: CONTEUDO_ID, estado: ESTADO_DE_LIXEIRA },
  ]);

  // Nenhuma exclusao foi acionada, e as duas unicas escritas que saem da porta
  // de dados sao os dois marcadores: `INSERT`, nunca `DELETE`.
  assert.deepEqual([...cena.exclusoesDefinitivas], []);
  assert.equal(resultado.apagadoEmDefinitivo, null);
  assert.deepEqual(
    cena.escritas.map((escrita) => escrita.texto.split(' ')[0]),
    ['INSERT', 'INSERT'],
  );
});

test('CA-1.2 o estado de lixeira sai da consulta publica pelo registro dele, nao por um if', () => {
  // `register_post_status( 'trash', ... )` (`wp-includes/post.php:732`): o que
  // tira o descartado da consulta publica e da busca e **a ausencia** de
  // `public` e de `private` no registro, mais `exclude_from_search` herdado de
  // `internal`. A clausula que le isso e da feature 004.
  assert.equal(PROPRIEDADES_DO_ESTADO_DE_LIXEIRA.publico, false);
  assert.equal(PROPRIEDADES_DO_ESTADO_DE_LIXEIRA.privado, false);
  assert.equal(PROPRIEDADES_DO_ESTADO_DE_LIXEIRA.consultavelPeloPublico, false);
  assert.equal(PROPRIEDADES_DO_ESTADO_DE_LIXEIRA.excluidoDaBusca, true);
  assert.equal(PROPRIEDADES_DO_ESTADO_DE_LIXEIRA.visivelNaListaDeTodos, false);

  // E a quarta, que impede o porte de tratar `internal` como "esconde em tudo":
  // a lixeira **aparece** na barra de contagem por estado do painel, declarada
  // explicitamente contra o default — e e por ela que se chega ao descartado
  // para restaurar (US-3).
  assert.equal(PROPRIEDADES_DO_ESTADO_DE_LIXEIRA.visivelNaListaDeEstados, true);

  // E a cadeia da coluna, que nao se renomeia (P8).
  assert.equal(ESTADO_DE_LIXEIRA, 'trash');
});

// ── CA-1.3 ──────────────────────────────────────────────────────────────────

test('CA-1.3 a permissao de descartar e resolvida por autoria e estado', () => {
  function exigidasPara(conteudo: ConteudoNaAutorizacao): readonly string[] {
    const cena = cenario({ conteudoNaAutorizacao: conteudo });
    return capacidadesExigidas(
      comAtor(cena.base, cena.contexto.ator),
      'delete_post',
      conteudo.id,
    );
  }

  // Do proprio e publicado: a capacidade do publicado, e so ela
  // (`wp-includes/capabilities.php:149`, ramo 6).
  assert.deepEqual(exigidasPara(conteudoNaAutorizacao({ estado: 'publish' })), [
    'delete_published_posts',
  ]);

  // Do proprio em qualquer outro estado: a capacidade comum.
  assert.deepEqual(exigidasPara(conteudoNaAutorizacao({ estado: 'draft' })), [
    'delete_posts',
  ]);

  // De outra pessoa: a do alheio, e o estado **soma** uma segunda.
  assert.deepEqual(
    exigidasPara(
      conteudoNaAutorizacao({ estado: 'publish', autorId: OUTRA_PESSOA }),
    ),
    ['delete_others_posts', 'delete_published_posts'],
  );
  assert.deepEqual(
    exigidasPara(
      conteudoNaAutorizacao({ estado: 'private', autorId: OUTRA_PESSOA }),
    ),
    ['delete_others_posts', 'delete_private_posts'],
  );
});

test('CA-1.3 quem tem a capacidade comum e nao a do publicado nao descarta o proprio publicado', () => {
  const semAPublicada = cenario({
    ator: ator(AUTORA, 'delete_posts', 'delete_others_posts'),
  });

  const recusado = descartar(semAPublicada.contexto, {
    conteudoId: CONTEUDO_ID,
  });

  assert.equal(recusado.desfecho, 'recusado');
  assert.equal(recusado.recusa?.mensagem, MENSAGEM_DE_RECUSA_NO_PAINEL);
  assert.equal(recusado.recusa?.codigoHttp, CODIGO_HTTP_DE_RECUSA_NO_PAINEL);
  // O `wp_die()` do painel nao tem codigo de texto, so numero e mensagem.
  assert.equal(recusado.recusa?.codigo, null);

  // Recusa nao emite comando nenhum, e nao chama colaboracao nenhuma: a
  // pergunta vem antes de qualquer escrita, como nas tres superficies.
  assert.deepEqual([...semAPublicada.escritas], []);
  assert.deepEqual([...semAPublicada.estadosGravados], []);
  assert.deepEqual([...semAPublicada.suspensoes], []);

  const comAPublicada = cenario({
    ator: ator(AUTORA, 'delete_published_posts'),
  });
  assert.equal(
    descartar(comAPublicada.contexto, { conteudoId: CONTEUDO_ID }).desfecho,
    'descartado',
  );
});

// ── CA-1.4 ──────────────────────────────────────────────────────────────────

test('CA-1.4 uma versao anterior nao e descartavel por permissao de conteudo', () => {
  const versao = cenario({
    registro: { id: CONTEUDO_ID, estado: 'inherit' },
    conteudoNaAutorizacao: conteudoNaAutorizacao({
      tipo: TIPO_DE_REVISAO,
      estado: 'inherit',
      paiId: 11,
    }),
  });

  // A negacao sai da **traducao**, e nao de um `if` desta operacao: linha de
  // tipo `revision` devolve `do_not_allow` e nao segue para o pai
  // (`wp-includes/capabilities.php:108`, `PERM-5`).
  assert.deepEqual(
    capacidadesExigidas(
      comAtor(versao.base, versao.contexto.ator),
      'delete_post',
      CONTEUDO_ID,
    ),
    [CAPACIDADE_NEGADA],
  );

  const resultado = descartar(versao.contexto, { conteudoId: CONTEUDO_ID });

  assert.equal(resultado.desfecho, 'recusado');
  assert.deepEqual([...versao.escritas], []);
  assert.deepEqual([...versao.estadosGravados], []);
});

test('CA-1.4 nem o super administrador descarta uma versao anterior', () => {
  const versao = cenario({
    emRede: true,
    ator: { contaId: 1, login: 'conta-1', existe: true, concessoes: [] },
    registro: { id: CONTEUDO_ID, estado: 'inherit' },
    conteudoNaAutorizacao: conteudoNaAutorizacao({
      tipo: TIPO_DE_REVISAO,
      estado: 'inherit',
      paiId: 11,
    }),
  });

  // `do_not_allow` e o unico nome que o atalho de rede de `PERM-9` nao vence
  // (ADR-0009, garantia 2). E o teste que prova que a negacao vem da traducao:
  // se ela estivesse cravada numa guarda daqui, este caso passaria por acidente.
  const resultado = descartar(versao.contexto, { conteudoId: CONTEUDO_ID });

  assert.equal(resultado.desfecho, 'recusado');
  assert.deepEqual([...versao.escritas], []);
});

// ── CA-1.5 ──────────────────────────────────────────────────────────────────

test('CA-1.5 a pagina inicial e a de conteudos exigem a capacidade da funcao, EM LUGAR da de conteudo', () => {
  const familiaDeExclusao = [
    'delete_posts',
    'delete_others_posts',
    'delete_published_posts',
  ] as const;

  const porFuncao: readonly OpcoesDoCenario[] = [
    { paginaInicial: CONTEUDO_ID },
    { paginaDeConteudos: CONTEUDO_ID },
  ];

  for (const funcao of porFuncao) {
    const especial = cenario({
      ...funcao,
      ator: ator(AUTORA, ...familiaDeExclusao),
    });

    // O ramo 3 **troca** a familia e para o caso: toda a familia de exclusao
    // junta nao descarta a pagina inicial (`PERM-5`).
    assert.deepEqual(
      capacidadesExigidas(
        comAtor(especial.base, especial.contexto.ator),
        'delete_post',
        CONTEUDO_ID,
      ),
      ['manage_options'],
    );
    assert.equal(
      descartar(especial.contexto, { conteudoId: CONTEUDO_ID }).desfecho,
      'recusado',
    );

    const comAFuncao = cenario({
      ...funcao,
      ator: ator(AUTORA, 'manage_options'),
    });
    assert.equal(
      descartar(comAFuncao.contexto, { conteudoId: CONTEUDO_ID }).desfecho,
      'descartado',
    );
  }
});

test('CA-1.5 a pagina de politica de privacidade SOMA a capacidade de privacidade', () => {
  const politica = cenario({
    paginaDePolitica: CONTEUDO_ID,
    ator: ator(AUTORA, 'delete_published_posts'),
  });

  // Ramo 7: a capacidade de privacidade e **somada**, traduzida — fora de rede
  // ela resolve em `manage_options` (BR-MIGRAR-042, `D5`). Quem pode apagar o
  // proprio publicado e nao administra privacidade **nao** apaga esta pagina.
  assert.deepEqual(
    capacidadesExigidas(
      comAtor(politica.base, politica.contexto.ator),
      'delete_post',
      CONTEUDO_ID,
    ),
    ['delete_published_posts', 'manage_options'],
  );
  assert.equal(
    descartar(politica.contexto, { conteudoId: CONTEUDO_ID }).desfecho,
    'recusado',
  );

  const comPrivacidade = cenario({
    paginaDePolitica: CONTEUDO_ID,
    ator: ator(AUTORA, 'delete_published_posts', 'manage_options'),
  });
  assert.equal(
    descartar(comPrivacidade.contexto, { conteudoId: CONTEUDO_ID }).desfecho,
    'descartado',
  );
});

test('CA-1.5 a pagina inicial que tambem e a de politica exige manage_options e NAO soma privacidade', () => {
  const asDuas = cenario({
    paginaInicial: CONTEUDO_ID,
    paginaDePolitica: CONTEUDO_ID,
    ator: ator(AUTORA, 'manage_options'),
  });

  // O ramo 3 **para** o caso antes do ramo 7: a lista nao tem a segunda entrada.
  // UC-09 registra as duas excecoes na tabela dela sem dizer que uma cancela a
  // outra; o codigo diz.
  assert.deepEqual(
    capacidadesExigidas(
      comAtor(asDuas.base, asDuas.contexto.ator),
      'delete_post',
      CONTEUDO_ID,
    ),
    ['manage_options'],
  );
  assert.equal(
    descartar(asDuas.contexto, { conteudoId: CONTEUDO_ID }).desfecho,
    'descartado',
  );
});

// ── A primeira linha: `R1` / BR-MIGRAR-030 ──────────────────────────────────

test('com a lixeira desligada o descarte apaga em definitivo, na primeira linha', () => {
  const semLixeira = cenario({ diasNaLixeira: 0 });

  const resultado = descartar(semLixeira.contexto, { conteudoId: CONTEUDO_ID });

  assert.equal(resultado.desfecho, 'apagado-em-definitivo');
  assert.equal(resultado.apagadoEmDefinitivo, true);
  assert.deepEqual([...semLixeira.exclusoesDefinitivas], [CONTEUDO_ID]);

  // A primeira linha e `! EMPTY_TRASH_DAYS` (`wp-includes/post.php:4085`), e ela
  // vem ANTES da leitura do passo 2: a unica leitura aqui e a da superficie, e
  // nenhum marcador, nenhuma cascata e nenhum dos tres pontos de extensao
  // acontece. O ator **nao** e avisado da diferenca, e e assim no legado (UC-09
  // e CA-4.2).
  assert.deepEqual(semLixeira.sequencia, [
    `le-conteudo:${CONTEUDO_ID}`,
    `apaga-em-definitivo:${CONTEUDO_ID}`,
  ]);
  assert.deepEqual([...semLixeira.escritas], []);
  assert.deepEqual([...semLixeira.estadosGravados], []);
  assert.deepEqual([...semLixeira.suspensoes], []);
});

test('prazo negativo NAO desliga a lixeira: em PHP `! -1` e falso', () => {
  const negativo = cenario({ diasNaLixeira: -1 });

  // Nenhuma guarda foi acrescentada contra isso porque o legado nao tem nenhuma
  // (P1). A consequencia aparece na coleta de T011, onde o instante limite cai
  // no futuro; aqui o descarte segue normal.
  const resultado = descartar(negativo.contexto, { conteudoId: CONTEUDO_ID });

  assert.equal(resultado.desfecho, 'descartado');
  assert.deepEqual([...negativo.exclusoesDefinitivas], []);
});

// ── Os desfechos que NAO emitem comando ─────────────────────────────────────

test('conteudo que ja esta na lixeira nao e descartado de novo, e nada e emitido', () => {
  const naLixeira = cenario({
    registro: { id: CONTEUDO_ID, estado: ESTADO_DE_LIXEIRA },
    conteudoNaAutorizacao: conteudoNaAutorizacao({
      estado: ESTADO_DE_LIXEIRA,
    }),
  });

  const resultado = descartar(naLixeira.contexto, { conteudoId: CONTEUDO_ID });

  // `if ( 'trash' === $post->post_status ) { return false; }` (`:4095`). E esta
  // guarda que faz o conteudo nunca gravar marcador duas vezes — ao contrario do
  // comentario, que apaga os marcadores antes de gravar.
  assert.equal(resultado.desfecho, 'ja-na-lixeira');
  assert.deepEqual([...naLixeira.escritas], []);
  assert.deepEqual([...naLixeira.estadosGravados], []);
  assert.deepEqual([...naLixeira.suspensoes], []);
  assert.deepEqual(
    naLixeira.sequencia.filter((passo) => passo.startsWith('gancho:')),
    [],
  );
});

test('conteudo inexistente e silencio, nao erro', () => {
  const ausente = cenario({ registro: null });

  const resultado = descartar(ausente.contexto, { conteudoId: CONTEUDO_ID });

  // `if ( ! $post ) { return $post; }` (`:4091`): o legado devolve o proprio
  // nulo, sem erro e sem mensagem, e o P7 manda preservar o silencio. O texto
  // de 410 do painel existe (`MENSAGEM_DE_CONTEUDO_INEXISTENTE_NO_PAINEL`) e e
  // da borda, nao desta operacao.
  assert.equal(resultado.desfecho, 'inexistente');
  assert.equal(resultado.recusa, null);
  assert.equal(resultado.conteudo, null);
  assert.deepEqual([...ausente.escritas], []);

  // E pela porta do legado, sem a leitura da superficie, o desfecho e o mesmo.
  const direto = cenario({ registro: null });
  assert.equal(
    descartarParaALixeira(direto.contexto, CONTEUDO_ID).desfecho,
    'inexistente',
  );
});

test('o filtro pre_trash_post cancela o descarte antes de qualquer escrita', () => {
  const interceptado = cenario({
    ganchos: { filtrarDescarte: () => false },
  });

  const resultado = descartar(interceptado.contexto, {
    conteudoId: CONTEUDO_ID,
  });

  // `if ( null !== $check ) { return $check; }` (`:4113`): o valor do filtro **e**
  // o retorno da funcao. Nada foi gravado, a cascata nao rodou e nem a acao
  // `wp_trash_post` — que e a posicao seguinte — disparou.
  assert.equal(resultado.desfecho, 'interceptado');
  assert.equal(resultado.interceptacao, false);
  assert.equal(resultado.estadoAnterior, 'publish');
  assert.deepEqual([...interceptado.escritas], []);
  assert.deepEqual([...interceptado.estadosGravados], []);
  assert.deepEqual([...interceptado.suspensoes], []);
  assert.deepEqual(interceptado.sequencia, [
    `le-conteudo:${CONTEUDO_ID}`,
    `le-conteudo:${CONTEUDO_ID}`,
    'gancho:pre_trash_post:publish',
  ]);
});

// ── O estado inconsistente que a falha deixa — e que US-7 tolera ────────────

test('gravacao de estado falhada deixa os dois marcadores gravados, e nao suspende comentario', () => {
  const falhou = cenario({ gravacaoFalha: true });

  const resultado = descartar(falhou.contexto, { conteudoId: CONTEUDO_ID });

  // `if ( ! $post_updated ) { return false; }` (`:4138`). Nao ha transacao —
  // BR-MIGRAR-104 mede zero `START TRANSACTION` em 1.467 arquivos —, logo os
  // marcadores do passo 7 e do passo 8 FICAM, com o conteudo fora da lixeira.
  // E exatamente o estado que `R6` manda a coleta tolerar (US-7, T015): "apaga
  // so o metadado e segue". Um porte transacional apagaria a historia.
  assert.equal(resultado.desfecho, 'nao-gravado');
  assert.equal(resultado.estadoGravado, null);
  assert.equal(resultado.estadoAnterior, 'publish');
  assert.equal(resultado.instanteDoDescarte, AGORA);
  assert.equal(falhou.escritas.length, 2);
  assert.deepEqual([...falhou.suspensoes], []);
  assert.deepEqual(
    falhou.sequencia.filter((passo) =>
      passo.startsWith('gancho:trashed_post'),
    ),
    [],
  );
});

// ── A funcao do legado nao tem portao (P4, P8) ──────────────────────────────

test('descartarParaALixeira nao verifica capacidade, e e assim no legado', () => {
  const semPoder = cenario({ ator: ator(OUTRA_PESSOA) });

  // `wp_trash_post()` e funcao publica sem portao
  // (`wp-includes/post.php:4084`), chamada tambem por `wp_delete_post()`
  // (`:3855`), onde nao ha ator nenhum. Dar-lhe um portao fecharia o sistema
  // mais que o legado; o P4 cobra preservar o default de cada camada "inclusive
  // quando o default e permissivo".
  const resultado = descartarParaALixeira(semPoder.contexto, CONTEUDO_ID);

  assert.equal(resultado.desfecho, 'descartado');
  assert.equal(semPoder.escritas.length, 2);

  // E a operacao exposta, com o mesmo ator, recusa.
  const pelaOperacao = cenario({ ator: ator(OUTRA_PESSOA) });
  assert.equal(
    descartar(pelaOperacao.contexto, { conteudoId: CONTEUDO_ID }).desfecho,
    'recusado',
  );
});
