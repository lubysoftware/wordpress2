/**
 * Testes da entrega de **T007** (US-3): *"o comportamento de US-3 existe e os
 * criterios CA-3.1, CA-3.2, CA-3.3, CA-3.4, CA-3.5 passam contra o sistema
 * novo"*.
 *
 * **Nao sao os testes de US-3**: esses sao **T008**, oito casos de
 * `backlog/tests.md` (UT-049-1 a UT-049-8), que se transcrevem do catalogo. Aqui
 * estao os cinco criterios e o que a implementacao quebraria **em silencio**: a
 * ordem dos treze passos, o que acontece quando nenhum comando sai e o estado que
 * sobra quando a gravacao falha.
 *
 * A montagem e a de `us-1-descartar-conteudo.test.ts`, pelos motivos escritos
 * la: a porta falsa registra comando, a sequencia e uma lista so, e o nome do tipo
 * de conteudo e inventado para que nenhum ramo da traducao passe por acidente.
 * `attachment` entra como constante importada: e o unico nome de tipo que esta
 * operacao conhece.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  casoDeConteudo,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type Capacidade,
  type EstadoDeConteudoNaAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  MARCADOR_DE_ESTADO_ANTERIOR,
  MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
  MARCADOR_DO_INSTANTE_DO_DESCARTE,
  criarArmazenamentoDeRetencao,
  criarMarcadoresDeLixeiraDoConteudo,
  criarPortaDeDadosFalsa,
} from '../armazenamento/index.js';
import { cascataNaRestauracao } from '../cascata-de-comentarios/index.js';
import { ESTADO_DE_LIXEIRA } from '../descarte/index.js';
import { TIPO_DE_ANEXO } from '../exclusao/index.js';
import type { PortaDeDados } from '../portas/index.js';
import {
  CAPACIDADE_DE_RESTAURAR,
  CODIGO_HTTP_DE_RECUSA_DE_RESTAURACAO_NO_PAINEL,
  ESTADO_DE_RASCUNHO,
  ESTADO_HERDADO,
  MENSAGEM_DE_RECUSA_DE_RESTAURACAO_NO_PAINEL,
  estadoAnteriorNaRestauracao,
  estadoPadraoDaRestauracao,
  restaurar,
  restaurarDaLixeira,
  restauradoNaVisaoDoChamador,
  type ContextoDeRestauracao,
  type GanchosDaRestauracao,
  type RegistroNaRestauracao,
  type ResultadoDaRestauracaoDoConteudo,
} from './index.js';

// ── Montagem ────────────────────────────────────────────────────────────────

const AUTORA = 7;
const OUTRA_PESSOA = 9;

const CONTEUDO_ID = 42;
const TIPO_COMUM = 'conteudo-comum';

const CAPACIDADES_COMUNS: Readonly<Record<string, Capacidade>> = {
  delete_posts: 'delete_posts',
  delete_others_posts: 'delete_others_posts',
  delete_published_posts: 'delete_published_posts',
  delete_private_posts: 'delete_private_posts',
};

const TIPOS: readonly TipoDeConteudoNaAutorizacao[] = [
  { nome: TIPO_COMUM, traduzMetaCapacidade: true, capacidades: CAPACIDADES_COMUNS },
];

const ESTADOS: readonly EstadoDeConteudoNaAutorizacao[] = [
  { nome: ESTADO_DE_LIXEIRA, publico: false, privado: false },
];

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
  readonly registro?: RegistroNaRestauracao | null;
  /**
   * O valor de `_wp_trash_meta_status`, ou `null` quando o marcador nao existe.
   * E a mesma memoria que a autorizacao le.
   */
  readonly estadoAnterior?: string | null;
  /** `wp_update_post()` devolvendo `0` — a falha do passo 11. */
  readonly gravacaoFalha?: boolean;
  /** Quem escreveu o conteudo. */
  readonly autorId?: number;
  readonly ator?: AtorDeAutorizacao;
  readonly ganchos?: GanchosDaRestauracao;
}

interface Cenario {
  readonly contexto: ContextoDeRestauracao;
  readonly escritas: readonly { texto: string; parametros: readonly unknown[] }[];
  /** A sequencia de **tudo** — comando, colaboracao e ponto de extensao. */
  readonly sequencia: readonly string[];
  readonly estadosGravados: readonly { id: number; estado: string }[];
  readonly restauracoesDeComentarios: readonly number[];
}

/** Monta o contexto com tudo registrado, como `cenario()` de US-1. */
function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const sequencia: string[] = [];
  const estadosGravados: { id: number; estado: string }[] = [];
  const restauracoesDeComentarios: number[] = [];

  const registro =
    opcoes.registro === undefined
      ? { id: CONTEUDO_ID, estado: ESTADO_DE_LIXEIRA, tipo: TIPO_COMUM }
      : opcoes.registro;

  const estadoAnterior =
    opcoes.estadoAnterior === undefined ? 'publish' : opcoes.estadoAnterior;

  const falsa = criarPortaDeDadosFalsa();

  // O que os tres `SELECT` da funcao encontram, na ordem: a leitura do estado
  // anterior e o `SELECT meta_id` de cada exclusao.
  if (estadoAnterior !== null) {
    falsa.responder([
      {
        post_id: CONTEUDO_ID,
        meta_key: MARCADOR_DE_ESTADO_ANTERIOR,
        meta_value: estadoAnterior,
      },
    ]);
    falsa.responder([{ meta_id: 101 }]);
    falsa.responder([{ meta_id: 102 }]);
  }

  const dados: PortaDeDados = {
    prefixoDeTabela: falsa.porta.prefixoDeTabela,
    selecionar(consulta) {
      const chave = consulta.parametros[0];
      sequencia.push(
        typeof chave === 'string' ? `selecionar:${chave}` : 'selecionar:metadados',
      );
      return falsa.porta.selecionar(consulta);
    },
    escrever(consulta) {
      sequencia.push(`escrever:${consulta.texto.split(' ')[0]}`);
      return falsa.porta.escrever(consulta);
    },
  };

  const fonte: FonteDeConteudoNaAutorizacao = {
    conteudo(referencia) {
      return typeof referencia === 'number' && referencia === CONTEUDO_ID
        ? {
            id: CONTEUDO_ID,
            tipo: TIPO_COMUM,
            estado: ESTADO_DE_LIXEIRA,
            estadoParaLeitura: ESTADO_DE_LIXEIRA,
            autorId: opcoes.autorId ?? AUTORA,
            paiId: 0,
          }
        : null;
    },
    tipoDeConteudo(nome) {
      return TIPOS.find((tipo) => tipo.nome === nome) ?? null;
    },
    estadoDeConteudo(nome) {
      return ESTADOS.find((estado) => estado.nome === nome) ?? null;
    },
    estadoAnteriorNaLixeira() {
      return estadoAnterior ?? '';
    },
    paginaInicial: () => 0,
    paginaDeConteudos: () => 0,
    paginaDePoliticaDePrivacidade: () => 0,
  };

  const base: BaseDeAutorizacao = {
    matriz: [],
    rede: REDE_INATIVA_NA_AUTORIZACAO,
    casosDeTraducao: [casoDeConteudo(fonte)],
  };

  const contexto: ContextoDeRestauracao = {
    base,
    ator:
      opcoes.ator ??
      ator(AUTORA, 'delete_posts', 'delete_published_posts'),
    armazenamento: {
      marcadoresDoConteudo: criarMarcadoresDeLixeiraDoConteudo(dados),
    },
    conteudo: {
      obterPorId(conteudoId) {
        sequencia.push(`le-conteudo:${conteudoId}`);
        return registro;
      },
      gravarEstado(conteudoId, estado) {
        sequencia.push(`grava-estado:${estado}`);
        estadosGravados.push({ id: conteudoId, estado });
        return opcoes.gravacaoFalha === true ? 0 : conteudoId;
      },
    },
    restaurarComentarios(conteudoId) {
      sequencia.push('restaura-comentarios');
      restauracoesDeComentarios.push(conteudoId);
    },
    ganchos: {
      filtrarRestauracao(restauracao, conteudo, anterior) {
        sequencia.push(`gancho:pre_untrash_post:${anterior}`);
        return (
          opcoes.ganchos?.filtrarRestauracao?.(restauracao, conteudo, anterior) ??
          null
        );
      },
      antesDeRestaurar(conteudoId, anterior) {
        sequencia.push(`gancho:untrash_post:${anterior}`);
        opcoes.ganchos?.antesDeRestaurar?.(conteudoId, anterior);
      },
      filtrarEstadoRestaurado(novoEstado, conteudoId, anterior) {
        sequencia.push(`gancho:wp_untrash_post_status:${novoEstado}:${anterior}`);
        return (
          opcoes.ganchos?.filtrarEstadoRestaurado?.(
            novoEstado,
            conteudoId,
            anterior,
          ) ?? novoEstado
        );
      },
      depoisDeRestaurar(conteudoId, anterior) {
        sequencia.push(`gancho:untrashed_post:${anterior}`);
        opcoes.ganchos?.depoisDeRestaurar?.(conteudoId, anterior);
      },
    },
  };

  return {
    contexto,
    escritas: falsa.escritas,
    sequencia,
    estadosGravados,
    restauracoesDeComentarios,
  };
}

function pedir(cena: Cenario): ResultadoDaRestauracaoDoConteudo {
  return restaurar(cena.contexto, { conteudoId: CONTEUDO_ID });
}

// ── CA-3.1 ──────────────────────────────────────────────────────────────────

test('CA-3.1 a restauracao grava rascunho, e nao o estado anterior', () => {
  const cena = cenario({ estadoAnterior: 'publish' });

  const resultado = pedir(cena);

  assert.equal(resultado.desfecho, 'restaurado');
  assert.equal(resultado.estadoAnterior, 'publish');
  assert.equal(resultado.estadoGravado, ESTADO_DE_RASCUNHO);
  assert.deepEqual(
    [...cena.estadosGravados],
    [{ id: CONTEUDO_ID, estado: 'draft' }],
  );
});

test('CA-3.1 todo estado anterior volta rascunho: o default nao le a memoria', () => {
  for (const estadoAnterior of ['publish', 'future', 'private', 'pending', 'draft']) {
    const cena = cenario({ estadoAnterior });

    assert.equal(pedir(cena).estadoGravado, 'draft', estadoAnterior);
  }

  // A assinatura e a afirmacao: o default recebe so o tipo.
  assert.equal(estadoPadraoDaRestauracao.length, 1);
});

test('CA-3.1 R2 e default filtravel: wp_untrash_post_status decide o estado gravado (P2)', () => {
  const cena = cenario({
    ganchos: { filtrarEstadoRestaurado: () => 'pending' },
  });

  assert.equal(pedir(cena).estadoGravado, 'pending');
  assert.deepEqual([...cena.estadosGravados], [
    { id: CONTEUDO_ID, estado: 'pending' },
  ]);
});

test('CA-3.1 a funcao publicada do legado devolve o estado anterior, como faz o Desfazer', () => {
  // `wp-admin/edit.php:151` pendura esta funcao no filtro quando `doaction=undo`.
  const cena = cenario({
    estadoAnterior: 'publish',
    ganchos: { filtrarEstadoRestaurado: estadoAnteriorNaRestauracao },
  });

  assert.equal(pedir(cena).estadoGravado, 'publish');
  assert.equal(estadoAnteriorNaRestauracao('draft', CONTEUDO_ID, 'private'), 'private');
});

// ── CA-3.2 ──────────────────────────────────────────────────────────────────

test('CA-3.2 anexo restaurado volta a herdar, qualquer que tenha sido o estado anterior', () => {
  const cena = cenario({
    registro: { id: CONTEUDO_ID, estado: ESTADO_DE_LIXEIRA, tipo: TIPO_DE_ANEXO },
    estadoAnterior: 'private',
  });

  const resultado = pedir(cena);

  assert.equal(ESTADO_HERDADO, 'inherit');
  assert.equal(resultado.estadoGravado, ESTADO_HERDADO);
  assert.deepEqual([...cena.estadosGravados], [
    { id: CONTEUDO_ID, estado: 'inherit' },
  ]);
  // O filtro recebe `inherit` como valor de partida (`wp-includes/post.php:4226`).
  assert.ok(
    cena.sequencia.includes('gancho:wp_untrash_post_status:inherit:private'),
  );
});

// ── CA-3.3 ──────────────────────────────────────────────────────────────────

test('CA-3.3 os dois marcadores do conteudo sao apagados, nessa ordem', () => {
  const cena = cenario();

  pedir(cena);

  // Cada exclusao e `SELECT meta_id` + `DELETE` (`wp-includes/meta.php:468`).
  assert.deepEqual(
    cena.escritas.map((escrita) => [...escrita.parametros]),
    [[101], [102]],
  );
  assert.deepEqual(
    cena.sequencia.filter((passo) => passo.startsWith('selecionar:_')),
    [
      `selecionar:${MARCADOR_DE_ESTADO_ANTERIOR}`,
      `selecionar:${MARCADOR_DO_INSTANTE_DO_DESCARTE}`,
    ],
  );
});

test('CA-3.3 marcador ausente e estado tolerado: nenhum DELETE sai e o conteudo volta', () => {
  const cena = cenario({ estadoAnterior: null });

  const resultado = pedir(cena);

  assert.equal(resultado.desfecho, 'restaurado');
  assert.equal(resultado.estadoAnterior, '');
  assert.equal(resultado.estadoGravado, 'draft');
  assert.deepEqual([...cena.escritas], []);
});

test('CA-3.3 a ordem dos treze passos e a do legado, comando por comando', () => {
  const cena = cenario();

  pedir(cena);

  // ⚠️ Os marcadores saem ANTES da gravacao (`wp-includes/post.php:4228`-`:4231`),
  // ao contrario da numeracao de UC-10. Ver o cabecalho de
  // `restaurar-da-lixeira.ts`.
  assert.deepEqual(cena.sequencia, [
    `le-conteudo:${CONTEUDO_ID}`,
    `le-conteudo:${CONTEUDO_ID}`,
    'selecionar:metadados',
    'gancho:pre_untrash_post:publish',
    'gancho:untrash_post:publish',
    'gancho:wp_untrash_post_status:draft:publish',
    `selecionar:${MARCADOR_DE_ESTADO_ANTERIOR}`,
    'escrever:DELETE',
    `selecionar:${MARCADOR_DO_INSTANTE_DO_DESCARTE}`,
    'escrever:DELETE',
    'grava-estado:draft',
    'restaura-comentarios',
    'gancho:untrashed_post:publish',
  ]);
});

test('CA-3.3 gravacao que falha deixa o conteudo em trash, sem marcador e sem cascata', () => {
  const cena = cenario({ gravacaoFalha: true });

  const resultado = pedir(cena);

  // Os dois `DELETE` ja sairam e nada os desfaz: a coleta, que varre pelo
  // marcador de instante, nunca mais alcanca este conteudo.
  assert.equal(resultado.desfecho, 'nao-gravado');
  assert.equal(resultado.estadoGravado, null);
  assert.equal(cena.escritas.length, 2);
  assert.deepEqual([...cena.restauracoesDeComentarios], []);
  assert.ok(!cena.sequencia.some((passo) => passo.startsWith('gancho:untrashed_post')));
  assert.equal(restauradoNaVisaoDoChamador(resultado), false);
});

test('CA-3.3 a cascata real apaga o terceiro marcador, depois de gravar e antes da ultima acao', () => {
  const falsa = criarPortaDeDadosFalsa();
  const sequencia: string[] = [];
  const dados: PortaDeDados = {
    prefixoDeTabela: falsa.porta.prefixoDeTabela,
    selecionar: (consulta) => falsa.porta.selecionar(consulta),
    escrever(consulta) {
      sequencia.push(`escrever:${consulta.texto.split(' ')[0]}`);
      return falsa.porta.escrever(consulta);
    },
  };
  const armazenamento = criarArmazenamentoDeRetencao(dados);
  const registro = { id: CONTEUDO_ID, estado: ESTADO_DE_LIXEIRA, tipo: TIPO_COMUM };

  // Estado anterior, os dois `SELECT meta_id` e entao a memoria da cascata:
  // `a:1:{i:5;s:1:"1";}` e o `SELECT meta_id` do marcador agrupado.
  const estadoAnterior = {
    post_id: CONTEUDO_ID,
    meta_key: MARCADOR_DE_ESTADO_ANTERIOR,
    meta_value: 'publish',
  };
  falsa.responder([estadoAnterior]);
  falsa.responder([{ meta_id: 1 }]);
  falsa.responder([{ meta_id: 2 }]);
  falsa.responder([
    {
      post_id: CONTEUDO_ID,
      meta_key: MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
      meta_value: 'a:1:{i:5;s:1:"1";}',
    },
  ]);
  falsa.responder([{ meta_id: 3 }]);

  const contexto: ContextoDeRestauracao = {
    ...cenario().contexto,
    armazenamento,
    conteudo: {
      obterPorId: () => registro,
      gravarEstado(conteudoId) {
        sequencia.push('grava-estado');
        return conteudoId;
      },
    },
    restaurarComentarios: cascataNaRestauracao({
      conteudo: { obterPorId: () => registro },
      armazenamento,
    }),
    ganchos: {
      depoisDeRestaurar: () => {
        sequencia.push('gancho:untrashed_post');
      },
    },
  };

  const resultado = restaurarDaLixeira(contexto, CONTEUDO_ID);

  assert.equal(resultado.desfecho, 'restaurado');
  assert.deepEqual(sequencia, [
    'escrever:DELETE',
    'escrever:DELETE',
    'grava-estado',
    'escrever:UPDATE',
    'escrever:DELETE',
    'gancho:untrashed_post',
  ]);
});

// ── CA-3.4 ──────────────────────────────────────────────────────────────────

test('CA-3.4 o conteudo publicado nao volta ao ar: uma gravacao, e nao publica', () => {
  const cena = cenario({ estadoAnterior: 'publish' });

  pedir(cena);

  assert.equal(cena.estadosGravados.length, 1);
  assert.notEqual(cena.estadosGravados[0]?.estado, 'publish');
});

test('CA-3.4 o agendado tambem volta rascunho, sem data de publicacao em jogo', () => {
  const cena = cenario({ estadoAnterior: 'future' });

  assert.equal(pedir(cena).estadoGravado, 'draft');
  assert.equal(cena.estadosGravados.length, 1);
});

test('CA-3.4 o retorno carrega o estado trash, nao o gravado', () => {
  const resultado = pedir(cenario());

  // `return $post` (`wp-includes/post.php:4255`), o registro do passo 1.
  assert.equal(resultado.conteudo?.estado, ESTADO_DE_LIXEIRA);
  assert.equal(resultado.estadoGravado, 'draft');
});

// ── CA-3.5 ──────────────────────────────────────────────────────────────────

test('CA-3.5 a capacidade e a de descartar: nao existe untrash_post', () => {
  assert.equal(CAPACIDADE_DE_RESTAURAR, 'delete_post');
});

test('CA-3.5 o estado anterior publicado exige do autor a capacidade do publicado', () => {
  const semPublicado = cenario({
    estadoAnterior: 'publish',
    ator: ator(AUTORA, 'delete_posts'),
  });

  const resultado = pedir(semPublicado);

  assert.equal(resultado.desfecho, 'recusado');
  assert.deepEqual(resultado.recusa, {
    codigo: null,
    mensagem: MENSAGEM_DE_RECUSA_DE_RESTAURACAO_NO_PAINEL,
    codigoHttp: CODIGO_HTTP_DE_RECUSA_DE_RESTAURACAO_NO_PAINEL,
  });
  // A recusa vem antes da funcao do legado: uma leitura e nenhuma escrita.
  assert.deepEqual(semPublicado.sequencia, [`le-conteudo:${CONTEUDO_ID}`]);
  assert.deepEqual([...semPublicado.estadosGravados], []);

  const comPublicado = cenario({
    estadoAnterior: 'publish',
    ator: ator(AUTORA, 'delete_published_posts'),
  });
  assert.equal(pedir(comPublicado).desfecho, 'restaurado');
});

test('CA-3.5 o estado anterior agendado pesa como publicado', () => {
  const cena = cenario({
    estadoAnterior: 'future',
    ator: ator(AUTORA, 'delete_posts'),
  });

  assert.equal(pedir(cena).desfecho, 'recusado');
});

test('CA-3.5 o mesmo ator, em dois estados anteriores, recebe respostas diferentes', () => {
  const quem = ator(AUTORA, 'delete_posts');

  assert.equal(
    pedir(cenario({ estadoAnterior: 'draft', ator: quem })).desfecho,
    'restaurado',
  );
  assert.equal(
    pedir(cenario({ estadoAnterior: 'publish', ator: quem })).desfecho,
    'recusado',
  );
});

test('CA-3.5 sem marcador, o autor precisa so da capacidade comum', () => {
  const cena = cenario({
    estadoAnterior: null,
    ator: ator(AUTORA, 'delete_posts'),
  });

  assert.equal(pedir(cena).desfecho, 'restaurado');
});

test('CA-3.5 para o conteudo alheio o legado nao le o estado anterior', () => {
  const publicadoAlheio = {
    estadoAnterior: 'publish',
    autorId: OUTRA_PESSOA,
  } as const;

  // So `delete_others_posts`, sem `delete_published_posts`
  // (`wp-includes/capabilities.php:166`-`:172`). A assimetria e do legado.
  assert.equal(
    pedir(cenario({ ...publicadoAlheio, ator: ator(AUTORA, 'delete_others_posts') }))
      .desfecho,
    'restaurado',
  );
  assert.equal(
    pedir(cenario({ ...publicadoAlheio, ator: ator(AUTORA, 'delete_published_posts') }))
      .desfecho,
    'recusado',
  );
});

// ── As guardas, e o que nao emite comando ───────────────────────────────────

test('conteudo inexistente: uma leitura, nenhum comando e nenhum ponto de extensao', () => {
  const cena = cenario({ registro: null, estadoAnterior: null });

  const resultado = pedir(cena);

  assert.equal(resultado.desfecho, 'inexistente');
  assert.deepEqual(cena.sequencia, [`le-conteudo:${CONTEUDO_ID}`]);
  assert.equal(restauradoNaVisaoDoChamador(resultado), false);
});

test('fora da lixeira nao emite nada: restaurar duas vezes nao toca no rascunho', () => {
  const cena = cenario({
    registro: { id: CONTEUDO_ID, estado: 'draft', tipo: TIPO_COMUM },
    estadoAnterior: null,
  });

  const resultado = restaurarDaLixeira(cena.contexto, CONTEUDO_ID);

  assert.equal(resultado.desfecho, 'fora-da-lixeira');
  assert.deepEqual(cena.sequencia, [`le-conteudo:${CONTEUDO_ID}`]);
  assert.deepEqual([...cena.escritas], []);
  assert.equal(restauradoNaVisaoDoChamador(resultado), false);
});

test('pre_untrash_post para tudo antes de qualquer escrita, e o valor dele viaja', () => {
  for (const interceptacao of [true, false]) {
    const cena = cenario({
      ganchos: { filtrarRestauracao: () => interceptacao },
    });

    const resultado = pedir(cena);

    assert.equal(resultado.desfecho, 'interceptado');
    assert.equal(resultado.interceptacao, interceptacao);
    assert.deepEqual([...cena.escritas], []);
    assert.ok(!cena.sequencia.some((passo) => passo.startsWith('gancho:untrash_post')));
    // O filtro que devolve `true` conta como restaurado sem nada ter acontecido.
    assert.equal(restauradoNaVisaoDoChamador(resultado), interceptacao);
  }
});

test('os pontos de extensao de abertura veem o conteudo com a memoria intacta', () => {
  const vistos: string[] = [];
  const cena = cenario({
    ganchos: {
      filtrarRestauracao(restauracao, conteudo, anterior) {
        vistos.push(`${String(restauracao)}:${conteudo.estado}:${anterior}`);
        return null;
      },
    },
  });

  assert.equal(restauradoNaVisaoDoChamador(pedir(cena)), true);
  assert.deepEqual(vistos, ['null:trash:publish']);
});

test('a funcao do legado nao tem portao: sem capacidade nenhuma, ela restaura', () => {
  const cena = cenario({ ator: ator(AUTORA) });

  assert.equal(
    restaurarDaLixeira(cena.contexto, CONTEUDO_ID).desfecho,
    'restaurado',
  );
});
