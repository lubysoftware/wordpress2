/**
 * A entrega de **T010** da feature `005-retencao-e-descarte`: *"5 testes
 * automatizados, um por caso registrado em `../../../backlog/tests.md`
 * (UT-050-1, UT-050-2, UT-050-3, UT-050-4, UT-050-5), com o mesmo dado de
 * entrada, acao e resultado esperado. O teste de regra de negocio (UT-050-5)
 * entra na mesma suite."*
 *
 * ---
 *
 * # Os cinco casos foram COPIADOS do catalogo, nao reconstruidos
 *
 * O card REQ-050 e a secao *"Avisar que apagar e irreversivel quando a lixeira
 * esta desligada"* de `backlog/tests.md`, e os cinco casos sao as linhas `:773`
 * a `:777`, com **ID, nome, tipo e prova**. Esta suite copia os quatro campos de
 * cada um, na ordem do catalogo, e cada `test()` leva o ID e o nome do caso no
 * titulo.
 *
 * | caso | nome, como o catalogo o escreve | tipo | o que a prova e |
 * |---|---|---|---|
 * | `UT-050-1` | apaga em definitivo quando a lixeira esta desligada | `borda` | CA-4.1 |
 * | `UT-050-2` | nao pede confirmacao ao ator antes de apagar com a lixeira desligada | `feliz` | CA-4.2 |
 * | `UT-050-3` | distingue na tela descartar de apagar em definitivo antes da acao | `feliz` | CA-4.3 |
 * | `UT-050-4` | omite a acao de restaurar quando a lixeira esta desligada | `borda` | CA-4.4 |
 * | `UT-050-5` | retem por 30 dias com a lixeira ligada e torna o apagamento irreversivel com ela em zero | `borda` | a regra `R1` (BR-MIGRAR-030) |
 *
 * ⚠️ **UT-050-2 afirma uma AUSENCIA, e isso e decisao humana registrada.** O
 * catalogo o reescreveu junto com CA-4.2 depois da parada de T009: *"no caminho
 * de conteudo o pedido apaga sem dialogo, como no legado (UC-09, fluxo Lixeira
 * desligada)"*. A decisao de 2026-10-29 e o censo que a sustenta estao na caixa
 * de DECISAO de `aviso-de-exclusao-definitiva.ts`; trocar a afirmacao por uma
 * confirmacao e divergir do observavel (P1).
 *
 * ---
 *
 * # Nao e a suite de criterio de T009
 *
 * T009 entrega *"os criterios CA-4.1 a CA-4.4 passam"* e tem a suite dela em
 * `./us-4-aviso-de-exclusao-definitiva.test.ts`, que vai alem do criterio: o
 * prazo negativo que painel e API leem diferente, a recusa `501` da API, as
 * confirmacoes de midia e de link que o legado pede em outras telas. Esta suite
 * fica no que o catalogo escreveu, caso por caso, e acrescenta o que so um caso
 * de regra de negocio cobra: **UT-050-5 junta as duas metades de `R1`** — os 30
 * dias de fabrica com a lixeira ligada e o apagamento sem volta com ela em zero
 * — numa mesma afirmacao, lida em tres pontos do modulo (o prazo, o descarte e a
 * varredura da coleta).
 *
 * ---
 *
 * # Como se confere
 *
 * Cada afirmacao cita arquivo e linha do sistema analisado, e **todas as linhas
 * citadas aqui foram relidas nesta tarefa** contra a arvore 7.1.2 legivel em
 * disco:
 *
 * | o que | onde |
 * |---|---|
 * | `define( 'EMPTY_TRASH_DAYS', 30 )` | `wp-includes/default-constants.php:388` |
 * | `if ( ! EMPTY_TRASH_DAYS ) { return wp_delete_post( $post_id, true ); }` | `wp-includes/post.php:4085`-`:4086` |
 * | os dois `add_post_meta` do descarte | `wp-includes/post.php:4128`-`:4129` |
 * | `$delete_timestamp = time() - ( DAY_IN_SECONDS * EMPTY_TRASH_DAYS )` | `wp-includes/functions.php:6977` |
 * | `... meta_key = '_wp_trash_meta_time' AND meta_value < %d` | `wp-includes/functions.php:6979` |
 * | o rotulo do editor | `wp-admin/includes/meta-boxes.php:364`-`:368` |
 * | as acoes da linha (`untrash`, `trash`, `delete`) | `wp-admin/includes/class-wp-posts-list-table.php:1614`-`:1640` |
 * | as acoes em massa | `wp-admin/includes/class-wp-posts-list-table.php:436`-`:448` |
 * | `$action = ( $force_delete \|\| ! EMPTY_TRASH_DAYS ) ? 'delete' : 'trash'` | `wp-includes/link-template.php:1577` |
 *
 * A spec de paridade que cobre UT-050-1 e UT-050-5 e
 * `.specify/migration/parity_tests/04-retencao-e-coleta-da-lixeira.feature`
 * (PT-004), cenario `@paridade @invariante` *"O prazo de retencao da lixeira e o
 * do legado, e desliga-lo torna apagar irreversivel"*. Ele **nao e executavel
 * por esta suite**: pede *"um oraculo com o legado na mesma versao, com relogio
 * controlavel"*, que e `scripts/oraculo/` da feature 015 (resposta 16 de
 * `questions.md`). Aqui o relogio e controlado ({@link AGORA}) e a porta de dados
 * e a falsa de T002, que **registra comando** — e e por isso que *"nenhuma
 * escrita"* e afirmavel em UT-050-1 e UT-050-5.
 *
 * Os rotulos de UT-050-3 sao comparados **literais**: a area 4 da Decisao 2 de
 * `parity_specs.md` (*"HTML de tema e painel"*) cobra o texto da tela, e a secao
 * 4 de cada tela de `target_screens.md` cobra `diff` de string igual a zero.
 *
 * ---
 *
 * # O que esta suite NAO afirma, e de quem e
 *
 * | o que | de quem |
 * |---|---|
 * | o que a exclusao definitiva faz por dentro (revisoes, filhos, anexos) | **T017** e **T018** (US-8). Aqui ela entra pelo contexto e so a **chamada** e observada |
 * | a coleta em si, e quem a agenda | **T011** e **T012** (US-5). UT-050-5 le so a consulta que ela emitiria |
 * | o prazo negativo, e a recusa `501` da API | `./us-4-aviso-de-exclusao-definitiva.test.ts` (T009) — nenhum caso do catalogo os pede |
 * | o `Restore` que o legado ainda oferece ao registro que **ja estava** na lixeira quando o prazo foi zerado | idem: CA-4.4 e verdadeiro por consequencia (`'trash' === $post->post_status`, `class-wp-posts-list-table.php:1614`), e T009 o afirma. UT-050-4 fala do registro que **nao** esta na lixeira, que e o unico que uma instalacao sem lixeira produz |
 * | a lixeira de midia | **ninguem**: a resposta 9 de `questions.md` decidiu que apagar midia continua definitivo, e REQ-051 esta bloqueado |
 *
 * Nenhum arquivo fora desta suite e tocado, como o `[P]` de T010 exige.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  MARCADOR_DE_ESTADO_ANTERIOR,
  MARCADOR_DO_INSTANTE_DO_DESCARTE,
  METADADO_DE_CONTEUDO,
  criarMarcadoresDeLixeiraDoConteudo,
  criarPortaDeDadosFalsa,
  type PortaDeDadosFalsa,
} from '../armazenamento/index.js';
import { consultaDeVencidos } from '../coleta/index.js';
import {
  PRAZO_DE_RETENCAO_DE_FABRICA,
  SEGUNDOS_POR_DIA,
  instanteLimiteDeRetencao,
  lixeiraEstaLigada,
  type PrazoDeRetencao,
} from '../configuracao/index.js';
import type { PortaDeRelogio } from '../portas/index.js';
import {
  CONFIRMACAO_PEDIDA_AO_ATOR,
  ESTADO_DE_LIXEIRA,
  acaoNoEditor,
  acoesEmMassa,
  acoesNaLinha,
  descartarParaALixeira,
  enderecoDeExclusao,
  type ContextoDeDescarte,
  type RegistroNaTelaDeDescarte,
  type VisaoDaListaDeConteudo,
} from './index.js';

/* ── O CENARIO DO CATALOGO ────────────────────────────────────────────────── */

const ID_DO_CONTEUDO = 42;
const TITULO = 'Uma pagina qualquer';

/**
 * `time()` do cenario, em segundos inteiros UTC — o valor que vai para
 * `_wp_trash_meta_time` (`wp-includes/post.php:4129`). Relogio controlado, como
 * o **P6** e o Contexto de PT-004 pedem.
 */
const AGORA = 1762800000;

/** `define( 'EMPTY_TRASH_DAYS', 0 )` em `wp-config.php`: a lixeira desligada. */
const LIXEIRA_DESLIGADA: PrazoDeRetencao = { diasNaLixeira: 0 };

/** Quem pode apagar o registro: `current_user_can( 'delete_post', $id )`. */
const PODE_APAGAR = { podeApagar: true };

/** A lista fora da visao de lixeira, com as duas capacidades do tipo. */
const LISTA_DE_TODOS: VisaoDaListaDeConteudo = {
  naVisaoDeLixeira: false,
  podeEditarEmLote: true,
  podeApagarEmLote: true,
};

/** Um conteudo publicado, que e o que o autor de US-4 pede para descartar. */
const PUBLICADO: RegistroNaTelaDeDescarte = {
  id: ID_DO_CONTEUDO,
  estado: 'publish',
  titulo: TITULO,
};

/** O ator anonimo do legado: `wp_trash_post()` nao tem portao de capacidade. */
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
  readonly dados: PortaDeDadosFalsa;
  /** Tudo que a operacao tocou, na ordem: leitura, escrita, gancho, exclusao. */
  readonly sequencia: readonly string[];
}

/**
 * O contexto da operacao com **tudo** registrado. Com a lixeira desligada o que
 * importa e o que **nao** aparece: a primeira linha de `wp_trash_post()` para
 * antes de ler o registro, de gravar marcador, de suspender comentario e de
 * disparar ponto de extensao.
 */
function cenario(prazo: PrazoDeRetencao): Cenario {
  const sequencia: string[] = [];
  const dados = criarPortaDeDadosFalsa();

  const relogio: PortaDeRelogio = {
    agoraEmSegundos() {
      sequencia.push('relogio');
      return AGORA;
    },
  };

  const contexto: ContextoDeDescarte = {
    base: BASE_VAZIA,
    ator: ANONIMO,
    prazoDeRetencao: prazo,
    relogio,
    armazenamento: {
      marcadoresDoConteudo: criarMarcadoresDeLixeiraDoConteudo(dados.porta),
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

  return { contexto, dados, sequencia };
}

/* ── UT-050-1 ─────────────────────────────────────────────────────────────── */

test('UT-050-1 apaga em definitivo quando a lixeira esta desligada', () => {
  // Entrada: lixeira desligada, conteudo publicado. Acao: o pedido de descarte.
  const cena = cenario(LIXEIRA_DESLIGADA);

  const resultado = descartarParaALixeira(cena.contexto, ID_DO_CONTEUDO);

  // Resultado: `return wp_delete_post( $post_id, true );`
  // (`wp-includes/post.php:4086`), com o `true` da forca.
  assert.equal(resultado.desfecho, 'apagado-em-definitivo');
  assert.equal(resultado.apagadoEmDefinitivo, true);

  // E a exclusao definitiva e a UNICA coisa que acontece: nada vai para a
  // lixeira, nenhum estado e gravado, nenhuma escrita sai pela porta.
  assert.deepEqual(cena.sequencia, [`apaga-em-definitivo:${ID_DO_CONTEUDO}`]);
  assert.deepEqual(cena.dados.escritas, []);
  assert.equal(resultado.estadoGravado, null);
  assert.ok(!cena.sequencia.includes(`grava-estado:${ID_DO_CONTEUDO}:trash`));
});

/* ── UT-050-2 ─────────────────────────────────────────────────────────────── */

test('UT-050-2 nao pede confirmacao ao ator antes de apagar com a lixeira desligada', () => {
  // Nenhuma superficie de conteudo tem texto de confirmacao: os cinco `null` sao
  // o censo da caixa de DECISAO de `aviso-de-exclusao-definitiva.ts` (decisao
  // humana de 2026-10-29).
  assert.deepEqual(CONFIRMACAO_PEDIDA_AO_ATOR, {
    'painel-editor': null,
    'painel-linha-da-lista': null,
    'painel-acao-em-massa': null,
    'api-rest': null,
    'xml-rpc': null,
  });

  // E o pedido apaga SEM dialogo: um pedido so, sem passo intermediario que
  // devolva ao ator uma pergunta, e a exclusao ja aconteceu quando ele volta.
  const cena = cenario(LIXEIRA_DESLIGADA);

  const resultado = descartarParaALixeira(cena.contexto, ID_DO_CONTEUDO);

  assert.equal(resultado.desfecho, 'apagado-em-definitivo');
  assert.equal(
    cena.sequencia.filter((passo) => passo.startsWith('apaga-em-definitivo:'))
      .length,
    1,
  );

  // A tela tambem nao interpoe nada: a acao do editor e da linha e um endereco
  // direto para `delete`, sem confirmacao no meio (`meta-boxes.php:370`,
  // `class-wp-posts-list-table.php:1633`, links sem `onclick`).
  assert.equal(
    acaoNoEditor(PUBLICADO, LIXEIRA_DESLIGADA, PODE_APAGAR)?.acaoNaRota,
    'delete',
  );
  assert.deepEqual(
    acoesNaLinha(PUBLICADO, LIXEIRA_DESLIGADA, PODE_APAGAR).map(
      (acao) => acao.acaoNaRota,
    ),
    ['delete'],
  );
});

/* ── UT-050-3 ─────────────────────────────────────────────────────────────── */

test('UT-050-3 distingue na tela descartar de apagar em definitivo antes da acao', () => {
  // Entrada: o mesmo registro, com a lixeira ligada (fabrica) e desligada.
  // Acao: montar a tela. Nenhum pedido de descarte e feito.
  const comLixeira = cenario(PRAZO_DE_RETENCAO_DE_FABRICA);
  const semLixeira = cenario(LIXEIRA_DESLIGADA);

  // O editor: `Move to Trash` contra `Delete permanently`
  // (`wp-admin/includes/meta-boxes.php:365` e `:367`).
  assert.equal(
    acaoNoEditor(PUBLICADO, comLixeira.contexto.prazoDeRetencao, PODE_APAGAR)
      ?.rotulo,
    'Move to Trash',
  );
  assert.equal(
    acaoNoEditor(PUBLICADO, semLixeira.contexto.prazoDeRetencao, PODE_APAGAR)
      ?.rotulo,
    'Delete permanently',
  );

  // A linha da lista: rotulo e nome acessivel mudam juntos
  // (`class-wp-posts-list-table.php:1627`-`:1628` contra `:1637`-`:1638`).
  assert.deepEqual(
    acoesNaLinha(PUBLICADO, PRAZO_DE_RETENCAO_DE_FABRICA, PODE_APAGAR).map(
      (acao) => [acao.rotulo, acao.descricao],
    ),
    [['Trash', `Move &#8220;${TITULO}&#8221; to the Trash`]],
  );
  assert.deepEqual(
    acoesNaLinha(PUBLICADO, LIXEIRA_DESLIGADA, PODE_APAGAR).map((acao) => [
      acao.rotulo,
      acao.descricao,
    ]),
    [['Delete Permanently', `Delete &#8220;${TITULO}&#8221; permanently`]],
  );

  // A acao em massa (`class-wp-posts-list-table.php:446` e `:448`).
  assert.deepEqual(
    acoesEmMassa(PRAZO_DE_RETENCAO_DE_FABRICA, LISTA_DE_TODOS).map(
      (acao) => acao.rotulo,
    ),
    ['Move to Trash'],
  );
  assert.deepEqual(
    acoesEmMassa(LIXEIRA_DESLIGADA, LISTA_DE_TODOS).map((acao) => acao.rotulo),
    ['Delete permanently'],
  );

  // E o proprio endereco ja carrega a diferenca, com o `nonce` da acao
  // (`wp-includes/link-template.php:1577`).
  assert.deepEqual(
    enderecoDeExclusao(PUBLICADO, PRAZO_DE_RETENCAO_DE_FABRICA, PODE_APAGAR),
    { acaoNaRota: 'trash', nonce: `trash-post_${ID_DO_CONTEUDO}` },
  );
  assert.deepEqual(
    enderecoDeExclusao(PUBLICADO, LIXEIRA_DESLIGADA, PODE_APAGAR),
    { acaoNaRota: 'delete', nonce: `delete-post_${ID_DO_CONTEUDO}` },
  );

  // ANTES da acao, e nao depois: montar a tela nao tocou nada.
  assert.deepEqual(comLixeira.sequencia, []);
  assert.deepEqual(semLixeira.sequencia, []);
  assert.deepEqual(comLixeira.dados.escritas, []);
  assert.deepEqual(semLixeira.dados.escritas, []);
});

/* ── UT-050-4 ─────────────────────────────────────────────────────────────── */

test('UT-050-4 omite a acao de restaurar quando a lixeira esta desligada', () => {
  // Entrada: lixeira desligada, conteudo fora da lixeira. Acao: montar a tela.
  const linha = acoesNaLinha(PUBLICADO, LIXEIRA_DESLIGADA, PODE_APAGAR);
  const massa = acoesEmMassa(LIXEIRA_DESLIGADA, LISTA_DE_TODOS);
  const editor = acaoNoEditor(PUBLICADO, LIXEIRA_DESLIGADA, PODE_APAGAR);

  // A linha oferece so `delete`: o `untrash` exige `'trash' === post_status`
  // (`class-wp-posts-list-table.php:1614`), e com a lixeira desligada nenhum
  // pedido de descarte leva o registro a esse estado (UT-050-1).
  assert.deepEqual(
    linha.map((acao) => acao.acao),
    ['apagar-em-definitivo'],
  );
  assert.ok(!linha.some((acao) => acao.acaoNaRota === 'untrash'));

  // A acao em massa so tem `Restore` na visao de lixeira (`:437`-`:438`).
  assert.ok(!massa.some((acao) => acao.acao === 'restaurar'));
  assert.ok(!massa.some((acao) => acao.rotulo === 'Restore'));

  // O editor oferece uma acao so, e ela nao e restaurar.
  assert.equal(editor?.acao, 'apagar-em-definitivo');

  // E depois do pedido o registro nem existe para ser restaurado: nada foi
  // gravado como `trash`.
  const cena = cenario(LIXEIRA_DESLIGADA);
  const resultado = descartarParaALixeira(cena.contexto, ID_DO_CONTEUDO);
  assert.notEqual(resultado.estadoGravado, ESTADO_DE_LIXEIRA);
});

/* ── UT-050-5 (regra de negocio R1) ───────────────────────────────────────── */

test('UT-050-5 retem por 30 dias com a lixeira ligada e torna o apagamento irreversivel com ela em zero', () => {
  // ── Metade 1: lixeira de 30 dias ──────────────────────────────────────────
  //
  // O valor de fabrica (`wp-includes/default-constants.php:388`), que liga a
  // lixeira.
  assert.equal(PRAZO_DE_RETENCAO_DE_FABRICA.diasNaLixeira, 30);
  assert.equal(lixeiraEstaLigada(PRAZO_DE_RETENCAO_DE_FABRICA), true);

  // O descarte vai para a lixeira e grava a memoria que a restauracao vai ler
  // (`wp-includes/post.php:4128`-`:4129`): o registro e retido, nao apagado.
  const ligada = cenario(PRAZO_DE_RETENCAO_DE_FABRICA);
  const descarte = descartarParaALixeira(ligada.contexto, ID_DO_CONTEUDO);

  assert.equal(descarte.desfecho, 'descartado');
  assert.equal(descarte.estadoGravado, ESTADO_DE_LIXEIRA);
  assert.equal(descarte.instanteDoDescarte, AGORA);
  assert.ok(!ligada.sequencia.includes(`apaga-em-definitivo:${ID_DO_CONTEUDO}`));
  assert.deepEqual(
    ligada.dados.escritas.map((escrita) => escrita.parametros[1]),
    [MARCADOR_DE_ESTADO_ANTERIOR, MARCADOR_DO_INSTANTE_DO_DESCARTE],
  );

  // A coleta so o alcanca depois de 30 dias: o limite e
  // `time() - ( DAY_IN_SECONDS * EMPTY_TRASH_DAYS )` (`functions.php:6977`) e a
  // varredura compara com `meta_value < %d` (`:6979`), estritamente menor.
  const trintaDias = 30 * SEGUNDOS_POR_DIA;
  assert.equal(trintaDias, 2592000);

  const umDiaAntes = AGORA + trintaDias - SEGUNDOS_POR_DIA;
  const noLimite = AGORA + trintaDias;
  const umSegundoDepois = AGORA + trintaDias + 1;

  const consulta = consultaDeVencidos(
    ligada.dados.porta,
    METADADO_DE_CONTEUDO,
    instanteLimiteDeRetencao(umDiaAntes, PRAZO_DE_RETENCAO_DE_FABRICA),
  );
  assert.equal(
    consulta.texto,
    "SELECT post_id FROM wp_postmeta WHERE meta_key = '_wp_trash_meta_time' AND meta_value < ?",
  );
  assert.deepEqual(consulta.parametros, [AGORA - SEGUNDOS_POR_DIA]);

  // O predicado `meta_value < limite` sobre o instante gravado no descarte,
  // nos tres pontos de PT-004: um dia antes e exatamente no prazo o registro
  // continua retido; um segundo depois ele vence.
  const vence = (agora: number): boolean =>
    AGORA < instanteLimiteDeRetencao(agora, PRAZO_DE_RETENCAO_DE_FABRICA);
  assert.equal(vence(umDiaAntes), false);
  assert.equal(vence(noLimite), false);
  assert.equal(vence(umSegundoDepois), true);

  // ── Metade 2: com a lixeira em zero, apagar e irreversivel ────────────────
  assert.equal(lixeiraEstaLigada(LIXEIRA_DESLIGADA), false);

  const desligada = cenario(LIXEIRA_DESLIGADA);
  const exclusao = descartarParaALixeira(desligada.contexto, ID_DO_CONTEUDO);

  // `if ( ! EMPTY_TRASH_DAYS ) { return wp_delete_post( $post_id, true ); }`
  // (`wp-includes/post.php:4085`-`:4086`): apaga na hora, sem passar pela
  // lixeira, e sem gravar memoria nenhuma — nao ha estado anterior nem instante
  // de que uma restauracao pudesse partir.
  assert.equal(exclusao.desfecho, 'apagado-em-definitivo');
  assert.deepEqual(desligada.sequencia, [
    `apaga-em-definitivo:${ID_DO_CONTEUDO}`,
  ]);
  assert.deepEqual(desligada.dados.escritas, []);
  assert.equal(exclusao.estadoAnterior, null);
  assert.equal(exclusao.instanteDoDescarte, null);
});
