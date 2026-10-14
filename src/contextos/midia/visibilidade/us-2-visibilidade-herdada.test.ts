/**
 * Testes da entrega de **T005**: *"o comportamento de US-2 existe e os criterios
 * CA-2.1, CA-2.2, CA-2.3 e CA-2.4 passam contra o sistema novo"*.
 *
 * **Nao sao os cinco testes de `backlog/tests.md`** — UT-057-1 a UT-057-5 sao
 * **T006**, a tarefa `[P]` que roda em paralelo com esta. Aqui se afirma o que
 * esta tarefa entrega, criterio por criterio.
 *
 * O meio e o que a Decisao 2 de `parity_specs.md` fixa para esta area, e nesta
 * historia ele tem duas metades:
 *
 * - **comportamento de caso de uso** — o valor resolvido em cada um dos cinco
 *   desfechos de `get_post_status()`, que e o que o cenario `@invariante` de
 *   `parity_tests/14-ingestao-e-derivadas-de-midia.feature` cobra: *"a
 *   visibilidade efetiva do arquivo e a do conteudo pai nas duas"*;
 * - **efeito no banco** (*"snapshot + sequencia de comandos"*) — e aqui ele e
 *   afirmado pela **ausencia**: a resolucao nao emite comando nenhum pela porta
 *   de dados deste modulo, e e por isso que CA-2.4 acontece sem escrita no
 *   anexo. O duplo das leituras do pai **registra chamada** em vez de simular
 *   banco, pelo mesmo motivo de `../armazenamento/porta-falsa.ts`: a contagem e
 *   a ordem das leituras sao observaveis, com o cache de objeto desligado nas
 *   duas metades.
 *
 * Cada afirmacao foi conferida contra o codigo do sistema analisado, legivel em
 * disco na arvore do 7.1.2 (a mesma versao do pacote), e por isso cita arquivo e
 * linha.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarArmazenamentoDeMidia,
  criarPortaDeDadosFalsa,
  ESTADO_HERDADO,
  ESTADOS_DE_ANEXO_ACEITOS,
  lerAnexo,
  SEM_CONTEUDO_DE_DESTINO,
  TIPO_DE_ANEXO,
  type PedidoDeAnexo,
} from '../armazenamento/index.js';
import type { LinhaDeResultado } from '../portas/index.js';
import {
  ESTADO_PRESUMIDO_DO_ANEXO,
  ESTADOS_PROPRIOS_DO_ANEXO,
  PONTO_DE_EXTENSAO_DO_ESTADO,
  visibilidadeDoAnexo,
  type ConteudoNaVisibilidade,
  type ContextoDeVisibilidade,
  type RegistroNaVisibilidade,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const ID_DO_ANEXO = 101;
const ID_DO_DESTINO = 42;
const ID_DO_OUTRO_ANEXO = 102;
const ID_INEXISTENTE = 999;

/** Uma linha de `posts` de `attachment`, no recorte que a resolucao le. */
function anexo(
  estado: string,
  conteudoDeDestino: number = SEM_CONTEUDO_DE_DESTINO,
  id: number = ID_DO_ANEXO,
): RegistroNaVisibilidade {
  return { id, tipo: TIPO_DE_ANEXO, estado, conteudoDeDestino };
}

/** Uma linha de `posts` de conteudo comum — o conteudo de destino. */
function conteudo(
  estado: string,
  id: number = ID_DO_DESTINO,
  conteudoDeDestino: number = SEM_CONTEUDO_DE_DESTINO,
): RegistroNaVisibilidade {
  return { id, tipo: 'post', estado, conteudoDeDestino };
}

interface ConteudoFalso {
  readonly contexto: ContextoDeVisibilidade;
  /** Toda leitura pedida, na ordem. Lista vazia e afirmacao, nao ausencia. */
  readonly leituras: string[];
}

/**
 * O duplo das duas leituras do conteudo pai.
 *
 * `linhas` e o banco: o que nao esta nele nao existe, e `obterConteudo` devolve
 * `null` — o `false` de `get_post()`. `marcadores` e a chave
 * `_wp_trash_meta_status` de cada identificador; ausente e `''`, que e o que a
 * leitura unica do legado devolve.
 */
function conteudoFalso(
  linhas: readonly RegistroNaVisibilidade[],
  marcadores: ReadonlyMap<number, string> = new Map(),
): ConteudoFalso {
  const leituras: string[] = [];
  const porId = new Map(linhas.map((linha) => [linha.id, linha]));

  const conteudoNaVisibilidade: ConteudoNaVisibilidade = {
    obterConteudo(conteudoId) {
      leituras.push(`obterConteudo ${conteudoId}`);
      return porId.get(conteudoId) ?? null;
    },
    estadoAnteriorNaLixeira(conteudoId) {
      leituras.push(`estadoAnteriorNaLixeira ${conteudoId}`);
      return marcadores.get(conteudoId) ?? '';
    },
  };

  return { contexto: { conteudo: conteudoNaVisibilidade }, leituras };
}

/* ── CA-2.1 ────────────────────────────────────────────────────────────────── */

test('CA-2.1 o anexo com destino responde a visibilidade do destino, nunca a propria', () => {
  // `wp-includes/post.php:1321`-`:1322` — o ramo da heranca.
  for (const estadoDoDestino of [
    'draft',
    'publish',
    'private',
    'future',
    'pending',
  ]) {
    const registro = anexo(ESTADO_HERDADO, ID_DO_DESTINO);
    const { contexto } = conteudoFalso([
      registro,
      conteudo(estadoDoDestino),
    ]);

    assert.equal(
      visibilidadeDoAnexo(contexto, registro),
      estadoDoDestino,
      `o destino em ${estadoDoDestino} nao foi herdado`,
    );

    // A coluna do anexo continua sendo a instrucao de herdar, nao a resposta.
    assert.equal(registro.estado, ESTADO_HERDADO);
  }
});

test('CA-2.1 um estado nao registrado no destino tambem e herdado como esta (DB-ENUM)', () => {
  /*
    `post_status` e `varchar(20)` sem `ENUM` e sem `CHECK` (`DB-ENUM`,
    BR-MIGRAR-075) e `register_post_status()` e ponto de extensao publico: o
    legado nao conhece a lista de estados aqui, ele copia o do pai. Quem fechar o
    retorno numa uniao de nomes deixa de representar estado de terceiro.
  */
  const registro = anexo(ESTADO_HERDADO, ID_DO_DESTINO);
  const { contexto } = conteudoFalso([
    registro,
    conteudo('em-revisao-do-plugin'),
  ]);

  assert.equal(visibilidadeDoAnexo(contexto, registro), 'em-revisao-do-plugin');
});

test('CA-2.1 a heranca atravessa a cadeia: anexo pendurado em anexo resolve no avo', () => {
  /*
    `:1322` chama `get_post_status()` de novo, e a chamada passa pelos MESMOS
    ramos: um anexo cujo pai e anexo herda do pai do pai. E por isso que a
    resolucao aceita conteudo de qualquer tipo, e nao so o anexo.
  */
  const folha = anexo(ESTADO_HERDADO, ID_DO_OUTRO_ANEXO);
  const meio = anexo(ESTADO_HERDADO, ID_DO_DESTINO, ID_DO_OUTRO_ANEXO);
  const { contexto } = conteudoFalso([folha, meio, conteudo('draft')]);

  assert.equal(visibilidadeDoAnexo(contexto, folha), 'draft');
});

test('CA-2.1 a resolucao aceita o identificador, como `get_post_status( $id )`', () => {
  // `:1292`-`:1294` — a normalizacao de `int|WP_Post`.
  const { contexto, leituras } = conteudoFalso([
    anexo(ESTADO_HERDADO, ID_DO_DESTINO),
    conteudo('private'),
  ]);

  assert.equal(visibilidadeDoAnexo(contexto, ID_DO_ANEXO), 'private');

  // A primeira leitura e a do proprio anexo, que o legado faz em `:1293`.
  assert.equal(leituras[0], `obterConteudo ${ID_DO_ANEXO}`);
});

test('identificador que nao existe devolve o `false` do legado (`:1296`-`:1298`)', () => {
  const { contexto } = conteudoFalso([]);

  assert.equal(visibilidadeDoAnexo(contexto, ID_INEXISTENTE), null);
});

/* ── CA-2.2 ────────────────────────────────────────────────────────────────── */

test('CA-2.2 nenhum estado fora dos aceitos sobrevive a leitura de um anexo (`:1324`-`:1336`)', () => {
  /*
    O ramo que o proprio legado documenta como espelho da gravacao: "Ensure
    uninherited attachments have a permitted status either 'private', 'trash',
    'auto-draft'. This is to match the logic in wp_insert_post()."

    `publish` e `draft` sao alcancaveis na coluna — o default do DDL e `publish`
    (`wp-admin/includes/schema.php:167`) e uma linha inserida direto na tabela
    nao passa pela reescrita de `:4705`. A leitura NAO corrige a coluna: ela
    responde um estado permitido.
  */
  for (const estadoNaColuna of [
    'publish',
    'draft',
    'pending',
    'future',
    'estado-de-plugin',
    '',
  ]) {
    const registro = anexo(estadoNaColuna, ID_DO_DESTINO);
    const { contexto, leituras } = conteudoFalso([
      registro,
      conteudo('draft'),
    ]);

    assert.equal(
      visibilidadeDoAnexo(contexto, registro),
      ESTADO_PRESUMIDO_DO_ANEXO,
      `o estado ${estadoNaColuna} na coluna nao foi resolvido`,
    );

    // Este ramo nao le o pai: ele nao herda, presume (`:1335`).
    assert.deepEqual(leituras, []);
  }
});

test('CA-2.2 os tres estados proprios do anexo atravessam intactos, com destino ou sem', () => {
  for (const estadoProprio of ESTADOS_PROPRIOS_DO_ANEXO) {
    const solto = anexo(estadoProprio);
    const comDestino = anexo(estadoProprio, ID_DO_DESTINO);
    const { contexto } = conteudoFalso([
      solto,
      conteudo('publish'),
    ]);

    assert.equal(visibilidadeDoAnexo(contexto, solto), estadoProprio);
    assert.equal(visibilidadeDoAnexo(contexto, comDestino), estadoProprio);
  }
});

test('CA-2.2 os tres proprios sao os quatro aceitos menos o herdado, e `publish` nao esta em nenhuma (`:1332`)', () => {
  /*
    A invariante que o comentario do legado declara: "Note: 'inherit' is excluded
    from this check as it is resolved to the parent post's status in the logic
    block above". As duas listas sao transcritas, cada uma no seu arquivo; esta
    afirmacao e a costura entre elas.
  */
  assert.deepEqual(
    [...ESTADOS_PROPRIOS_DO_ANEXO],
    ESTADOS_DE_ANEXO_ACEITOS.filter((estado) => estado !== ESTADO_HERDADO),
  );

  assert.equal(ESTADOS_PROPRIOS_DO_ANEXO.includes('publish'), false);
  assert.equal(
    (ESTADOS_DE_ANEXO_ACEITOS as readonly string[]).includes('publish'),
    false,
  );

  // E `publish` e exatamente o que a leitura presume onde nao ha de onde herdar.
  assert.equal(ESTADO_PRESUMIDO_DO_ANEXO, 'publish');
});

test('CA-2.2 o pedido que atravessa a ligacao com BC-01 nao tem como levar estado', () => {
  /*
    A outra metade de `P2` e a gravacao, e ela NAO esta nesta feature: o unico
    caminho de escrita da linha do anexo e `wp_insert_attachment()` →
    `wp_insert_post()` (`:6778`, `:6790`), que e BC-01, e a reescrita vive em
    `contextos/conteudo/gravacao/estado-na-gravacao.ts`. O que esta feature
    garante e que o pedido que atravessa a ligacao tardia nao carrega estado
    nenhum — o legado tambem nao o manda (`wp-admin/includes/media.php:413`-`:419`).

    A garantia e do TIPO: `PedidoDeAnexo` nao tem campo de estado, logo nao ha
    valor a mandar. A afirmacao abaixo e a sombra disso em execucao.
  */
  const pedido: PedidoDeAnexo = {
    tipoMime: 'image/jpeg',
    endereco: 'https://exemplo.test/wp-content/uploads/2026/10/foto.jpg',
    conteudoDeDestino: ID_DO_DESTINO,
    titulo: 'foto',
    descricao: '',
    legenda: '',
  };

  for (const nome of ['estado', 'post_status', 'status']) {
    assert.equal(nome in pedido, false, `o pedido levou ${nome}`);
  }
});

/* ── CA-2.3 ────────────────────────────────────────────────────────────────── */

test('CA-2.3 anexo sem conteudo de destino nao herda, e nenhuma leitura sai (`:1307`)', () => {
  /*
    `0 === $post->post_parent` e o primeiro termo e curto-circuita: o legado nao
    le pai nenhum. ⚠️ O valor presumido e `publish` e NAO o da coluna — ver o
    achado registrado no cabecalho de `visibilidade-de-anexo.ts`: CA-2.3 diz
    "declarada no registro" e `:1311` diz "assumed to be published".
  */
  const registro = anexo(ESTADO_HERDADO);
  const { contexto, leituras } = conteudoFalso([registro]);

  assert.equal(visibilidadeDoAnexo(contexto, registro), 'publish');
  assert.deepEqual(leituras, []);
});

test('CA-2.3 destino que nao existe mais tambem nao herda, e a leitura sai uma vez (`:1308`)', () => {
  // Orfao e estado normal neste banco: zero chave estrangeira (P5, resposta 2).
  const registro = anexo(ESTADO_HERDADO, ID_INEXISTENTE);
  const { contexto, leituras } = conteudoFalso([registro]);

  assert.equal(visibilidadeDoAnexo(contexto, registro), 'publish');
  assert.deepEqual(leituras, [`obterConteudo ${ID_INEXISTENTE}`]);
});

test('CA-2.3 anexo que aponta para si mesmo nao herda, e a leitura do pai AINDA sai (`:1309`)', () => {
  /*
    A ordem dos tres termos de `:1306`-`:1310` e observavel: a existencia do pai
    e perguntada antes da auto-referencia, logo a leitura sai. Um porte que
    testasse a auto-referencia primeiro economizaria uma consulta que o legado
    emite.
  */
  const registro = anexo(ESTADO_HERDADO, ID_DO_ANEXO);
  const { contexto, leituras } = conteudoFalso([registro]);

  assert.equal(visibilidadeDoAnexo(contexto, registro), 'publish');
  assert.deepEqual(leituras, [`obterConteudo ${ID_DO_ANEXO}`]);
});

test('CA-2.3 o estado proprio do registro vence a presuncao, sem destino', () => {
  // Esta e a metade de CA-2.3 que o registro de fato declara.
  for (const estadoProprio of ESTADOS_PROPRIOS_DO_ANEXO) {
    const registro = anexo(estadoProprio);
    const { contexto, leituras } = conteudoFalso([registro]);

    assert.equal(visibilidadeDoAnexo(contexto, registro), estadoProprio);
    assert.deepEqual(leituras, []);
  }
});

/* ── CA-2.4 ────────────────────────────────────────────────────────────────── */

test('CA-2.4 mudar a visibilidade do destino muda a do anexo, sem tocar no anexo', () => {
  const registro = anexo(ESTADO_HERDADO, ID_DO_DESTINO);
  const destino = { estado: 'draft' };

  const leituras: string[] = [];
  const contexto: ContextoDeVisibilidade = {
    conteudo: {
      obterConteudo(conteudoId) {
        leituras.push(`obterConteudo ${conteudoId}`);
        if (conteudoId === ID_DO_ANEXO) {
          return registro;
        }
        return conteudoId === ID_DO_DESTINO
          ? conteudo(destino.estado)
          : null;
      },
      estadoAnteriorNaLixeira(conteudoId) {
        leituras.push(`estadoAnteriorNaLixeira ${conteudoId}`);
        return '';
      },
    },
  };

  assert.equal(visibilidadeDoAnexo(contexto, registro), 'draft');

  // A unica coisa que muda e a coluna do DESTINO.
  destino.estado = 'publish';
  assert.equal(visibilidadeDoAnexo(contexto, registro), 'publish');

  destino.estado = 'private';
  assert.equal(visibilidadeDoAnexo(contexto, registro), 'private');

  // E nada foi escrito em lugar nenhum: so leitura saiu.
  assert.equal(
    leituras.every((leitura) => leitura.startsWith('obterConteudo')),
    true,
  );
  assert.equal(registro.estado, ESTADO_HERDADO);
});

test('CA-2.4 destino na lixeira devolve o estado que ele tinha ANTES de ir para a lixeira (`:1315`)', () => {
  /*
    "Get parent status prior to trashing." O marcador e
    `_wp_trash_meta_status`, gravado por `wp_trash_post()` — e o mesmo que
    `map_meta_cap()` le quando o estado e `trash` (UC-10, passo 2).
  */
  const registro = anexo(ESTADO_HERDADO, ID_DO_DESTINO);
  const { contexto, leituras } = conteudoFalso(
    [registro, conteudo('trash')],
    new Map([[ID_DO_DESTINO, 'private']]),
  );

  assert.equal(visibilidadeDoAnexo(contexto, registro), 'private');

  /*
    A sequencia do ramo da lixeira: a existencia do pai (`:1308`), a resolucao do
    pai para compara-la com `trash` (`:1313`, que le o pai de novo) e so entao o
    marcador (`:1315`). O `get_post_meta` NAO sai para pai que nao esta na
    lixeira.
  */
  assert.deepEqual(leituras, [
    `obterConteudo ${ID_DO_DESTINO}`,
    `obterConteudo ${ID_DO_DESTINO}`,
    `estadoAnteriorNaLixeira ${ID_DO_DESTINO}`,
  ]);
});

test('CA-2.4 destino na lixeira sem marcador cai na mesma presuncao (`:1317`-`:1320`)', () => {
  /*
    `if ( ! $post_status )` e a verdade do PHP, nao uma comparacao com vazio: a
    chave ausente devolve `''` e a cadeia `'0'` tambem e falsa. Os dois casos sao
    "Assume publish as above".
  */
  const semMarcador = anexo(ESTADO_HERDADO, ID_DO_DESTINO);
  const primeiro = conteudoFalso([semMarcador, conteudo('trash')]);

  assert.equal(visibilidadeDoAnexo(primeiro.contexto, semMarcador), 'publish');

  const comZero = conteudoFalso(
    [semMarcador, conteudo('trash')],
    new Map([[ID_DO_DESTINO, '0']]),
  );

  assert.equal(visibilidadeDoAnexo(comZero.contexto, semMarcador), 'publish');
});

test('CA-2.4 destino cujo PAI esta na lixeira: a comparacao e com o estado resolvido (`:1313`)', () => {
  /*
    `'trash' === get_post_status( $post->post_parent )` compara o estado
    RESOLVIDO do pai, nao a coluna dele. Um anexo pendurado em outro anexo que
    herda de um conteudo na lixeira cai no ramo da lixeira — do pai dele.
  */
  const folha = anexo(ESTADO_HERDADO, ID_DO_OUTRO_ANEXO);
  const meio = anexo(ESTADO_HERDADO, ID_DO_DESTINO, ID_DO_OUTRO_ANEXO);
  const { contexto } = conteudoFalso(
    [folha, meio, conteudo('trash')],
    new Map([[ID_DO_DESTINO, 'draft']]),
  );

  // O meio resolve em `draft` (o estado anterior do avo), e a folha herda isso.
  assert.equal(visibilidadeDoAnexo(contexto, meio), 'draft');
  assert.equal(visibilidadeDoAnexo(contexto, folha), 'draft');
});

/* ── A SEQUENCIA DE LEITURAS, QUE E OBSERVAVEL ─────────────────────────────── */

test('o destino comum e lido TRES vezes, porque o legado o le tres vezes (`:1308`, `:1313`, `:1322`)', () => {
  /*
    `:1313` resolve o estado do pai, compara com `trash` e DESCARTA o resultado;
    `:1322` resolve de novo. Com o cache de objeto desligado nas duas metades —
    que e o `Contexto` de `PT-014` — cada uma dessas resolucoes e uma consulta, e
    a sequencia entra na area 3 da Decisao 2. Economizar uma leitura aqui seria
    divergir em sequencia de comandos.
  */
  const registro = anexo(ESTADO_HERDADO, ID_DO_DESTINO);
  const { contexto, leituras } = conteudoFalso([
    registro,
    conteudo('draft'),
  ]);

  assert.equal(visibilidadeDoAnexo(contexto, registro), 'draft');
  assert.deepEqual(leituras, [
    `obterConteudo ${ID_DO_DESTINO}`,
    `obterConteudo ${ID_DO_DESTINO}`,
    `obterConteudo ${ID_DO_DESTINO}`,
  ]);
});

/* ── O QUE A RESOLUCAO NAO FAZ ─────────────────────────────────────────────── */

test('a resolucao nao emite comando nenhum pela porta de dados deste modulo', () => {
  /*
    As duas leituras do pai sao ligacao tardia para BC-01 e BC-05 (AD-10), e nao
    consulta deste contexto. A diferenca e byte: o `obterPorId` do armazenamento
    de T002 emite `SELECT * FROM {site}posts WHERE ID = ?` — a consulta de
    `wp_delete_attachment()` (`:6817`), SEM `LIMIT` —, e o `get_post()` que esta
    resolucao usa emite `SELECT * FROM $wpdb->posts WHERE ID = %d LIMIT 1`
    (`wp-includes/class-wp-post.php:289`). Resolver o pai pelo repositorio daqui
    trocaria uma cadeia pela outra.
  */
  const dados = criarPortaDeDadosFalsa();
  criarArmazenamentoDeMidia(dados.porta);

  const registro = anexo(ESTADO_HERDADO, ID_DO_DESTINO);
  const { contexto } = conteudoFalso([registro, conteudo('private')]);

  assert.equal(visibilidadeDoAnexo(contexto, registro), 'private');

  assert.deepEqual(dados.selecoes, []);
  assert.deepEqual(dados.escritas, []);
});

test('o anexo lido pelo armazenamento de T002 serve a resolucao sem conversao nenhuma', () => {
  /*
    `Anexo` tem os quatro campos desta forma com os mesmos nomes, de proposito:
    quem ja leu a linha passa o registro direto, sem segunda leitura e sem
    mapeamento. Esta afirmacao e de tipo tanto quanto de execucao — se algum dos
    quatro nomes mudar de um lado, isto deixa de compilar.
  */
  const linha: LinhaDeResultado = {
    ID: ID_DO_ANEXO,
    post_type: TIPO_DE_ANEXO,
    post_status: ESTADO_HERDADO,
    post_parent: ID_DO_DESTINO,
  };

  const lido = lerAnexo(linha);
  const { contexto } = conteudoFalso([conteudo('draft')]);

  assert.equal(visibilidadeDoAnexo(contexto, lido), 'draft');
});

test('o ponto de extensao do estado esta declarado com o nome do legado (P2)', () => {
  /*
    `apply_filters( 'get_post_status', $post_status, $post )` (`:1347`). Declarado
    e nao disparado: o barramento e `REQ-162`, em `do-not-rewrite.md` — escopo
    recusado, nao trabalho pendente. O P2 cobra que o ponto exista com o nome, os
    argumentos e a posicao, e a posicao e o FIM da funcao: um interceptador ve o
    estado resolvido, nao o da coluna.
  */
  assert.equal(PONTO_DE_EXTENSAO_DO_ESTADO, 'get_post_status');
});
