/**
 * Testes da entrega de **T009** (US-4): *"o comportamento de US-4 existe e os
 * criterios CA-4.1, CA-4.2, CA-4.3, CA-4.4 passam contra o sistema novo"*.
 *
 * **CA-4.2 afirma uma ausencia:** o legado **nao pede confirmacao nenhuma** no
 * caminho de conteudo, e a decisao humana de 2026-10-29 alinhou o criterio a isso
 * (caixa de DECISAO de `aviso-de-exclusao-definitiva.ts`). Ela se afirma do mesmo
 * jeito que a porta falsa de T002 registra comando para que *"nenhum comando"*
 * seja afirmavel. Trocar essa afirmacao por uma confirmacao e divergir do
 * observavel (P1).
 *
 * **Nao sao os testes de US-4**: esses sao **T010**, cinco casos registrados em
 * `backlog/tests.md` (UT-050-1 a UT-050-5), que se **transcrevem** do catalogo e
 * nao se reconstroem.
 *
 * A area de paridade destes criterios e a **4** da Decisao 2 de
 * `parity_specs.md` (*"HTML de tema e painel: comportamento de caso de uso"*)
 * para os rotulos e as acoes, e a **1** (*"contrato de terceiro: REST ... byte a
 * byte, zero divergencia"*) para a recusa de `501`. Por isso os rotulos sao
 * comparados **literais**: a secao 4 de cada tela de `target_screens.md` cobra
 * `diff` de string igual a zero.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarMarcadoresDeLixeiraDoConteudo,
  criarPortaDeDadosFalsa,
} from '../armazenamento/index.js';
import { PRAZO_DE_RETENCAO_DE_FABRICA } from '../configuracao/index.js';
import type { PortaDeRelogio } from '../portas/index.js';
import {
  CODIGO_DE_LIXEIRA_NAO_SUPORTADA_NA_API,
  CODIGO_HTTP_DE_LIXEIRA_NAO_SUPORTADA_NA_API,
  CONFIRMACAO_DE_EXCLUSAO_DE_MIDIA,
  CONFIRMACAO_PEDIDA_AO_ATOR,
  ESTADO_DE_LIXEIRA,
  GANCHOS_DAS_ACOES_NA_TELA,
  MENSAGEM_DE_LIXEIRA_NAO_SUPORTADA_NA_API,
  PROPRIEDADES_DO_ESTADO_DE_LIXEIRA,
  ROTULO_DE_DESCARTE_EM_MASSA,
  ROTULO_DE_DESCARTE_NA_LINHA,
  ROTULO_DE_DESCARTE_NO_EDITOR,
  ROTULO_DE_EXCLUSAO_DEFINITIVA_EM_MASSA,
  ROTULO_DE_EXCLUSAO_DEFINITIVA_NA_LINHA,
  ROTULO_DE_EXCLUSAO_DEFINITIVA_NO_EDITOR,
  ROTULO_DE_RESTAURACAO,
  acaoNoEditor,
  acoesEmMassa,
  acoesNaLinha,
  confirmacaoDeExclusaoDeLink,
  descartarParaALixeira,
  enderecoDeExclusao,
  ganchoDeSuporteALixeiraNaApi,
  lixeiraSuportadaNaApi,
  perguntasDaLixeiraDivergem,
  recusaDeLixeiraNaoSuportadaNaApi,
  type ContextoDeDescarte,
  type RegistroNaTelaDeDescarte,
} from './index.js';

// ── Montagem ────────────────────────────────────────────────────────────────

const CONTEUDO_ID = 42;
const TITULO = 'Uma pagina qualquer';

const SEM_LIXEIRA = { diasNaLixeira: 0 };
const LIXEIRA_NEGATIVA = { diasNaLixeira: -1 };

const PODE = { podeApagar: true };
const NAO_PODE = { podeApagar: false };

function registro(
  campos: { readonly estado?: string } = {},
): RegistroNaTelaDeDescarte {
  return {
    id: CONTEUDO_ID,
    estado: campos.estado ?? 'publish',
    titulo: TITULO,
  };
}

/** O ator anonimo do legado: existe como objeto, com `exists()` falso. */
const ANONIMO: AtorDeAutorizacao = {
  contaId: 0,
  login: '',
  existe: false,
  concessoes: [],
};

const BASE_VAZIA: BaseDeAutorizacao = {
  matriz: [],
  rede: REDE_INATIVA_NA_AUTORIZACAO,
  casosDeTraducao: [],
};

interface Cenario {
  readonly contexto: ContextoDeDescarte;
  readonly escritas: readonly { texto: string }[];
  readonly sequencia: readonly string[];
}

/**
 * O contexto da operacao, com **tudo** registrado — e aqui o que importa e o que
 * **nao** e registrado: com a lixeira desligada, a primeira linha de
 * `wp_trash_post()` para antes de ler, de gravar e de disparar qualquer coisa.
 */
function cenario(
  opcoes: { readonly diasNaLixeira?: number } = {},
): Cenario {
  const sequencia: string[] = [];
  const falsa = criarPortaDeDadosFalsa();

  const relogio: PortaDeRelogio = {
    agoraEmSegundos() {
      sequencia.push('relogio');
      return 0;
    },
  };

  const contexto: ContextoDeDescarte = {
    base: BASE_VAZIA,
    ator: ANONIMO,
    prazoDeRetencao:
      opcoes.diasNaLixeira === undefined
        ? PRAZO_DE_RETENCAO_DE_FABRICA
        : { diasNaLixeira: opcoes.diasNaLixeira },
    relogio,
    armazenamento: {
      marcadoresDoConteudo: criarMarcadoresDeLixeiraDoConteudo(falsa.porta),
    },
    conteudo: {
      obterPorId(conteudoId) {
        sequencia.push(`le-conteudo:${conteudoId}`);
        return { id: conteudoId, estado: 'publish' };
      },
      gravarEstado(conteudoId, estado) {
        sequencia.push(`grava-estado:${conteudoId}:${estado}`);
        return conteudoId;
      },
    },
    exclusaoDefinitiva: (conteudoId) => {
      sequencia.push(`apaga-em-definitivo:${conteudoId}`);
      return true;
    },
    suspenderComentarios: (conteudoId) => {
      sequencia.push(`suspende-comentarios:${conteudoId}`);
    },
    ganchos: {
      filtrarDescarte: () => {
        sequencia.push('gancho:pre_trash_post');
        return null;
      },
      antesDeDescartar: () => {
        sequencia.push('gancho:wp_trash_post');
      },
      depoisDeDescartar: () => {
        sequencia.push('gancho:trashed_post');
      },
    },
  };

  return { contexto, escritas: falsa.escritas, sequencia };
}

// ── CA-4.1 ──────────────────────────────────────────────────────────────────

test('CA-4.1 com a lixeira desligada o pedido de descarte apaga em definitivo, na primeira linha', () => {
  const cena = cenario({ diasNaLixeira: 0 });

  const resultado = descartarParaALixeira(cena.contexto, CONTEUDO_ID);

  // `if ( ! EMPTY_TRASH_DAYS ) { return wp_delete_post( $post_id, true ); }`
  // (`wp-includes/post.php:4085`-`:4086`).
  assert.equal(resultado.desfecho, 'apagado-em-definitivo');
  assert.equal(resultado.apagadoEmDefinitivo, true);

  // E a primeira linha e a PRIMEIRA: nenhuma leitura, nenhum marcador, nenhum
  // estado gravado, nenhuma cascata de comentario e nenhum dos tres pontos de
  // extensao do descarte. Quem escuta `wp_trash_post` nao e chamado — e por isso
  // que uma extensao que confiasse nesse gancho para auditar exclusao perde
  // TODAS as exclusoes de uma instalacao sem lixeira.
  assert.deepEqual(cena.sequencia, [`apaga-em-definitivo:${CONTEUDO_ID}`]);
  assert.equal(cena.escritas.length, 0);
  assert.equal(resultado.estadoAnterior, null);
  assert.equal(resultado.instanteDoDescarte, null);
  assert.equal(resultado.estadoGravado, null);
});

test('CA-4.1 com a lixeira ligada o mesmo pedido nao apaga: vai para a lixeira', () => {
  const cena = cenario();

  const resultado = descartarParaALixeira(cena.contexto, CONTEUDO_ID);

  assert.equal(resultado.desfecho, 'descartado');
  assert.equal(resultado.apagadoEmDefinitivo, null);
  assert.ok(!cena.sequencia.includes(`apaga-em-definitivo:${CONTEUDO_ID}`));
});

test('CA-4.1 prazo NEGATIVO nao desliga a lixeira no descarte, porque em PHP `! -1` e falso', () => {
  const cena = cenario({ diasNaLixeira: -1 });

  const resultado = descartarParaALixeira(cena.contexto, CONTEUDO_ID);

  // A borda esta no OPERADOR, nao no numero: `configuracao/prazo-de-retencao.ts`
  // ja registrou que so o zero desliga, e nenhuma guarda foi acrescentada contra
  // o negativo porque o legado nao tem nenhuma (P1).
  assert.equal(resultado.desfecho, 'descartado');
});

// ── CA-4.1, a mesma pergunta em tres formas ─────────────────────────────────

test('a API pergunta `EMPTY_TRASH_DAYS > 0`, e nao `! EMPTY_TRASH_DAYS`', () => {
  // `class-wp-rest-posts-controller.php:1099`.
  assert.equal(lixeiraSuportadaNaApi(PRAZO_DE_RETENCAO_DE_FABRICA), true);
  assert.equal(lixeiraSuportadaNaApi({ diasNaLixeira: 1 }), true);
  assert.equal(lixeiraSuportadaNaApi(SEM_LIXEIRA), false);
  assert.equal(lixeiraSuportadaNaApi(LIXEIRA_NEGATIVA), false);
});

test('🔴 prazo negativo e o unico valor em que painel e API discordam sobre haver lixeira', () => {
  assert.equal(perguntasDaLixeiraDivergem(PRAZO_DE_RETENCAO_DE_FABRICA), false);
  assert.equal(perguntasDaLixeiraDivergem({ diasNaLixeira: 1 }), false);
  assert.equal(perguntasDaLixeiraDivergem(SEM_LIXEIRA), false);

  // Com `-1` o painel descarta o registro e a API se recusa a descartar o MESMO
  // registro (`501`), e nada no legado reconcilia as duas leituras.
  assert.equal(perguntasDaLixeiraDivergem(LIXEIRA_NEGATIVA), true);
});

// ── CA-4.3 ──────────────────────────────────────────────────────────────────

test('CA-4.3 o endereco da acao muda antes da acao: `trash` com lixeira, `delete` sem', () => {
  // `$action = ( $force_delete || ! EMPTY_TRASH_DAYS ) ? 'delete' : 'trash';`
  // (`wp-includes/link-template.php:1577`), e o `nonce` carrega a acao
  // (`:1590`).
  assert.deepEqual(
    enderecoDeExclusao(registro(), PRAZO_DE_RETENCAO_DE_FABRICA, PODE),
    { acaoNaRota: 'trash', nonce: `trash-post_${CONTEUDO_ID}` },
  );
  assert.deepEqual(enderecoDeExclusao(registro(), SEM_LIXEIRA, PODE), {
    acaoNaRota: 'delete',
    nonce: `delete-post_${CONTEUDO_ID}`,
  });
});

test('CA-4.3 forcar e OR, nao AND: com lixeira ligada a acao forcada ainda e `delete`', () => {
  // E assim que a linha de um registro que ESTA na lixeira o apaga de vez
  // (`class-wp-posts-list-table.php:1635`).
  assert.deepEqual(
    enderecoDeExclusao(registro(), PRAZO_DE_RETENCAO_DE_FABRICA, {
      podeApagar: true,
      forcar: true,
    }),
    { acaoNaRota: 'delete', nonce: `delete-post_${CONTEUDO_ID}` },
  );
});

test('sem `delete_post` nao ha endereco nenhum, nem com a lixeira desligada', () => {
  // `get_delete_post_link()` devolve `null` (`link-template.php:1573`), e as tres
  // superficies ja estao dentro do `current_user_can` (`meta-boxes.php:363`,
  // `class-wp-posts-list-table.php:1613`).
  assert.equal(enderecoDeExclusao(registro(), SEM_LIXEIRA, NAO_PODE), null);
  assert.equal(acaoNoEditor(registro(), SEM_LIXEIRA, NAO_PODE), null);
  assert.deepEqual(acoesNaLinha(registro(), SEM_LIXEIRA, NAO_PODE), []);
});

test('CA-4.3 o editor troca o rotulo e a acao, e oferece uma acao so', () => {
  const comLixeira = acaoNoEditor(
    registro(),
    PRAZO_DE_RETENCAO_DE_FABRICA,
    PODE,
  );
  assert.deepEqual(comLixeira, {
    acao: 'descartar',
    rotulo: 'Move to Trash',
    descricao: null,
    acaoNaRota: 'trash',
    nonce: `trash-post_${CONTEUDO_ID}`,
  });

  // `wp-admin/includes/meta-boxes.php:364`-`:370`.
  const semLixeira = acaoNoEditor(registro(), SEM_LIXEIRA, PODE);
  assert.deepEqual(semLixeira, {
    acao: 'apagar-em-definitivo',
    rotulo: 'Delete permanently',
    descricao: null,
    acaoNaRota: 'delete',
    nonce: `delete-post_${CONTEUDO_ID}`,
  });
});

test('CA-4.3 a linha da lista troca rotulo, acao e nome acessivel', () => {
  const comLixeira = acoesNaLinha(
    registro(),
    PRAZO_DE_RETENCAO_DE_FABRICA,
    PODE,
  );
  assert.deepEqual(comLixeira, [
    {
      acao: 'descartar',
      rotulo: 'Trash',
      descricao: `Move &#8220;${TITULO}&#8221; to the Trash`,
      acaoNaRota: 'trash',
      nonce: `trash-post_${CONTEUDO_ID}`,
    },
  ]);

  // `class-wp-posts-list-table.php:1632`-`:1639`: sem lixeira a linha oferece
  // **so** a exclusao definitiva, e o `aria-label` tambem muda.
  const semLixeira = acoesNaLinha(registro(), SEM_LIXEIRA, PODE);
  assert.deepEqual(semLixeira, [
    {
      acao: 'apagar-em-definitivo',
      rotulo: 'Delete Permanently',
      descricao: `Delete &#8220;${TITULO}&#8221; permanently`,
      acaoNaRota: 'delete',
      nonce: `delete-post_${CONTEUDO_ID}`,
    },
  ]);
});

test('CA-4.3 a acao em massa troca o rotulo pela mesma condicao da linha', () => {
  const visao = {
    naVisaoDeLixeira: false,
    podeEditarEmLote: true,
    podeApagarEmLote: true,
  };

  assert.deepEqual(acoesEmMassa(PRAZO_DE_RETENCAO_DE_FABRICA, visao), [
    { acao: 'descartar', rotulo: 'Move to Trash' },
  ]);
  assert.deepEqual(acoesEmMassa(SEM_LIXEIRA, visao), [
    { acao: 'apagar-em-definitivo', rotulo: 'Delete permanently' },
  ]);

  // `:444`: sem `delete_posts` do tipo, nenhuma das duas aparece — e `Restore`
  // em lote nao e governado por essa capacidade, mas por `edit_posts` (`:436`).
  assert.deepEqual(
    acoesEmMassa(SEM_LIXEIRA, { ...visao, podeApagarEmLote: false }),
    [],
  );
});

test('⚠️ os seis rotulos sao seis chaves de catalogo, e a caixa do P e observavel', () => {
  // Unifica-los perderia uma traducao e mudaria o texto de uma das telas.
  assert.equal(ROTULO_DE_EXCLUSAO_DEFINITIVA_NO_EDITOR, 'Delete permanently');
  assert.equal(ROTULO_DE_EXCLUSAO_DEFINITIVA_EM_MASSA, 'Delete permanently');
  assert.equal(ROTULO_DE_EXCLUSAO_DEFINITIVA_NA_LINHA, 'Delete Permanently');
  assert.notEqual(
    ROTULO_DE_EXCLUSAO_DEFINITIVA_NA_LINHA,
    ROTULO_DE_EXCLUSAO_DEFINITIVA_NO_EDITOR,
  );

  assert.equal(ROTULO_DE_DESCARTE_NO_EDITOR, 'Move to Trash');
  assert.equal(ROTULO_DE_DESCARTE_EM_MASSA, 'Move to Trash');
  // `_x( 'Trash', 'verb' )` (`:1628`): mesma palavra, contexto proprio.
  assert.equal(ROTULO_DE_DESCARTE_NA_LINHA, 'Trash');
  assert.equal(ROTULO_DE_RESTAURACAO, 'Restore');
});

// ── CA-4.4 ──────────────────────────────────────────────────────────────────

test('CA-4.4 com a lixeira desligada nenhuma superficie oferece restaurar', () => {
  const linha = acoesNaLinha(registro(), SEM_LIXEIRA, PODE);
  assert.ok(!linha.some((acao) => acao.acao === 'restaurar'));
  assert.ok(!linha.some((acao) => acao.acaoNaRota === 'untrash'));

  const massa = acoesEmMassa(SEM_LIXEIRA, {
    naVisaoDeLixeira: false,
    podeEditarEmLote: true,
    podeApagarEmLote: true,
  });
  assert.ok(!massa.some((acao) => acao.acao === 'restaurar'));

  // O editor nunca oferece restaurar, com lixeira ou sem: a tela de um registro
  // em `trash` nem abre (`wp-admin/post.php:154`, `409`).
  assert.notEqual(
    acaoNoEditor(registro(), SEM_LIXEIRA, PODE)?.acao,
    'restaurar',
  );
  assert.notEqual(
    acaoNoEditor(registro({ estado: ESTADO_DE_LIXEIRA }), SEM_LIXEIRA, PODE)
      ?.acao,
    'restaurar',
  );
});

test('CA-4.4 e verdadeiro por CONSEQUENCIA: quem decide restaurar e o estado, nao a constante', () => {
  // `'trash' === $post->post_status` (`class-wp-posts-list-table.php:1614`).
  // Numa instalacao que JA tinha conteudo na lixeira quando o prazo foi zerado,
  // o legado continua oferecendo restaurar linha por linha — e o porte reproduz
  // o mecanismo, nao a frase do criterio. Esconder o `Restore` testando a
  // constante seria fechar um caminho que o legado deixa aberto.
  const naLixeiraSemPrazo = acoesNaLinha(
    registro({ estado: ESTADO_DE_LIXEIRA }),
    SEM_LIXEIRA,
    PODE,
  );

  assert.deepEqual(
    naLixeiraSemPrazo.map((acao) => acao.acao),
    ['restaurar', 'apagar-em-definitivo'],
  );
  assert.equal(naLixeiraSemPrazo[0]?.acaoNaRota, 'untrash');
  assert.equal(naLixeiraSemPrazo[0]?.nonce, `untrash-post_${CONTEUDO_ID}`);
  assert.equal(
    naLixeiraSemPrazo[0]?.descricao,
    `Restore &#8220;${TITULO}&#8221; from the Trash`,
  );
});

test('CA-4.4 na visao da lixeira as duas acoes convivem, e o descarte sai de cena', () => {
  // Os quatro estados da linha, da tabela de `acoesNaLinha`.
  assert.deepEqual(
    acoesNaLinha(
      registro({ estado: ESTADO_DE_LIXEIRA }),
      PRAZO_DE_RETENCAO_DE_FABRICA,
      PODE,
    ).map((acao) => acao.acao),
    ['restaurar', 'apagar-em-definitivo'],
  );

  assert.deepEqual(
    acoesEmMassa(PRAZO_DE_RETENCAO_DE_FABRICA, {
      naVisaoDeLixeira: true,
      podeEditarEmLote: true,
      podeApagarEmLote: true,
    }),
    [
      { acao: 'restaurar', rotulo: 'Restore' },
      { acao: 'apagar-em-definitivo', rotulo: 'Delete permanently' },
    ],
  );
});

test('CA-4.4 a barra de estados some por CONTAGEM, nao por registro de estado', () => {
  // `trash` se declara visivel na barra de contagem (T003,
  // `wp-includes/post.php:743`), e o link mesmo assim nao aparece com a lixeira
  // desligada porque `empty( $num_posts->trash )` corta antes
  // (`class-wp-posts-list-table.php:369`). As duas metades sao de donos
  // diferentes, e e por isso que esta tarefa NAO mexeu no registro do estado.
  assert.equal(PROPRIEDADES_DO_ESTADO_DE_LIXEIRA.visivelNaListaDeEstados, true);
  assert.equal(PROPRIEDADES_DO_ESTADO_DE_LIXEIRA.visivelNaListaDeTodos, false);
});

// ── CA-4.2: a ausencia, afirmada ────────────────────────────────────────────

test('CA-4.2 nenhuma superficie de conteudo pede confirmacao ao ator', () => {
  // O censo esta na caixa de DECISAO de `aviso-de-exclusao-definitiva.ts`:
  // `showNotice.warn()` nao tem chamador de conteudo, os links de conteudo nao tem
  // `onclick`, e o unico ouvinte de `a.submitdelete` (`wp-admin/js/post.js:352`)
  // nao confirma.
  //
  // Trocar qualquer `null` por texto e divergir do observavel, o que o P1 so
  // permite com decisao humana registrada e citada aqui.
  assert.deepEqual(CONFIRMACAO_PEDIDA_AO_ATOR, {
    'painel-editor': null,
    'painel-linha-da-lista': null,
    'painel-acao-em-massa': null,
    'api-rest': null,
    'xml-rpc': null,
  });
});

test('CA-4.2 a confirmacao de exclusao do legado existe, e nao e do conteudo', () => {
  // `wp-admin/js/common.js:548`, chamado de midia (`meta-boxes.php:477`,
  // `class-wp-media-list-table.php:835`, `media.js:197`) e de termo (`tags.js:29`
  // e `:168`).
  assert.equal(
    CONFIRMACAO_DE_EXCLUSAO_DE_MIDIA,
    "You are about to permanently delete these items from your site.\nThis action cannot be undone.\n'Cancel' to stop, 'OK' to delete.",
  );

  // E a caixa de publicacao SABE confirmar: a tela de link herdada confirma no
  // proprio `submitdelete` (`meta-boxes.php:1137`). Logo a ausencia no conteudo
  // nao e limitacao tecnica.
  assert.equal(
    confirmacaoDeExclusaoDeLink('Um link'),
    "You are about to delete this link 'Um link'\n  'Cancel' to stop, 'OK' to delete.",
  );
});

// ── A unica parada que o legado TEM: a API ──────────────────────────────────

test('a API recusa o descarte sem forca quando nao reconhece lixeira: 501, com texto literal', () => {
  const recusa = recusaDeLixeiraNaoSuportadaNaApi(SEM_LIXEIRA, {
    forcar: false,
  });

  // `class-wp-rest-posts-controller.php:1148`-`:1154`.
  assert.deepEqual(recusa, {
    codigo: 'rest_trash_not_supported',
    mensagem: "The post does not support trashing. Set 'force=true' to delete.",
    codigoHttp: 501,
  });
  assert.equal(recusa?.codigo, CODIGO_DE_LIXEIRA_NAO_SUPORTADA_NA_API);
  assert.equal(recusa?.mensagem, MENSAGEM_DE_LIXEIRA_NAO_SUPORTADA_NA_API);
  assert.equal(recusa?.codigoHttp, CODIGO_HTTP_DE_LIXEIRA_NAO_SUPORTADA_NA_API);
});

test('⚠️ a recusa da API NAO fala em irreversibilidade: ela ensina o parametro, e o pedido forcado nao ve nada', () => {
  // `:1136`: com `force`, apaga e devolve o registro em `previous`, sem nenhuma
  // mensagem. E o mais perto que o legado chega de uma confirmacao sem ser uma.
  assert.equal(
    recusaDeLixeiraNaoSuportadaNaApi(SEM_LIXEIRA, { forcar: true }),
    null,
  );
  assert.ok(!MENSAGEM_DE_LIXEIRA_NAO_SUPORTADA_NA_API.includes('undone'));
  assert.equal(
    recusaDeLixeiraNaoSuportadaNaApi(PRAZO_DE_RETENCAO_DE_FABRICA, {
      forcar: false,
    }),
    null,
  );
});

test('🔴 com prazo negativo a API recusa o que o painel descarta', () => {
  const recusa = recusaDeLixeiraNaoSuportadaNaApi(LIXEIRA_NEGATIVA, {
    forcar: false,
  });

  assert.equal(recusa?.codigoHttp, 501);
  // E o painel, no mesmo instante e no mesmo registro, oferece "Move to Trash".
  assert.equal(
    acaoNoEditor(registro(), LIXEIRA_NEGATIVA, PODE)?.rotulo,
    'Move to Trash',
  );
});

test('o ponto de extensao da API decide o suporte a lixeira nos dois sentidos (P2)', () => {
  // `apply_filters( "rest_{$this->post_type}_trashable", ... )` (`:1123`), cujo
  // bloco de documentacao e literal: *"Pass false to disable Trash support"*.
  assert.equal(
    recusaDeLixeiraNaoSuportadaNaApi(PRAZO_DE_RETENCAO_DE_FABRICA, {
      forcar: false,
      suporteDeExtensao: false,
    })?.codigo,
    'rest_trash_not_supported',
  );

  // E no sentido oposto: a extensao LIGA a lixeira numa instalacao com prazo
  // zero, e ai o `DELETE` sem forca chama `wp_trash_post()`, que apaga em
  // definitivo na primeira linha. O P2 manda preservar inclusive isso.
  assert.equal(
    recusaDeLixeiraNaoSuportadaNaApi(SEM_LIXEIRA, {
      forcar: false,
      suporteDeExtensao: true,
    }),
    null,
  );
});

test('os nomes dos pontos de extensao sao os do legado, com o dinamico montado igual', () => {
  assert.equal(ganchoDeSuporteALixeiraNaApi('post'), 'rest_post_trashable');
  assert.equal(ganchoDeSuporteALixeiraNaApi('page'), 'rest_page_trashable');

  assert.deepEqual(GANCHOS_DAS_ACOES_NA_TELA, {
    acoesDaLinhaDeTipoSimples: 'post_row_actions',
    acoesDaLinhaDeTipoHierarquico: 'page_row_actions',
    prefixoDasAcoesEmMassa: 'bulk_actions-',
    enderecoDeExclusao: 'get_delete_post_link',
  });
});
