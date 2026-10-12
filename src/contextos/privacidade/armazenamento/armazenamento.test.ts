/**
 * Testes da entrega de **T002**: *"a solicitacao existe como tipo de conteudo
 * proprio, com os quatro estados do legado e a chave de confirmacao guardada
 * com resumo criptografico, lida e gravada pela porta de dados"*.
 *
 * Nao sao os testes de nenhuma historia — esses sao T004, T006, T008 e os demais
 * `[P]` de `tasks.md`, um por caso de `backlog/tests.md`. Aqui se afirma a
 * **forma** e a **sequencia de comandos**, que e o que a area 3 da Decisao 2 de
 * `parity_specs.md` compara com zero tolerancia: *"snapshot + sequencia de
 * comandos"*.
 *
 * **Nao ha teste de prazo aqui, e isso e de proposito.** O P6 pede, para cada
 * numero, *"o valor e o efeito da borda (no ultimo instante aceita, um instante
 * depois recusa)"* — e T002 nao compara prazo nenhum: os tres prazos desta
 * feature entram com as tarefas que os aplicam (T005, T009, T015). O que esta
 * aqui e a **aritmetica de data** de que o prazo de T005 vai depender, que e
 * outra coisa: `instanteDaColunaDeData` e a conversao de coluna, nao a
 * comparacao.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  arranjoPorNome,
  inteiro,
  texto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import type { LinhaDeResultado } from '../portas/index.js';
import {
  ACOES_DE_SOLICITACAO,
  ALFABETO_DA_CHAVE_DE_CONFIRMACAO,
  AUSENTE_NA_LEITURA_UNICA,
  CHAVE_DO_INSTANTE_DE_CONCLUSAO,
  CHAVE_DO_INSTANTE_DE_CONFIRMACAO,
  COMPRIMENTO_DA_CHAVE_DE_CONFIRMACAO,
  criarArmazenamentoDePrivacidade,
  criarPortaDeDadosFalsa,
  criarRepositorioDeMetadados,
  criarRepositorioDeSolicitacoes,
  ESTADOS_ACEITOS_NA_ABERTURA,
  ESTADOS_DA_SOLICITACAO,
  ESTADOS_QUE_ACEITAM_VALIDACAO_DE_CHAVE,
  instanteDaColunaDeData,
  lerSolicitacao,
  MARCADOR_DE_RESUMO_GENERICO,
  PREFIXO_DO_ESTADO,
  PROPRIEDADES_DO_ESTADO_DA_SOLICITACAO,
  SEM_CHAVE,
  SEM_CONTA,
  tabelaDeConteudo,
  tabelaDeMetadadosDeConteudo,
  textoDoParametro,
  TIPO_DE_SOLICITACAO,
} from './index.js';

/** A linha de `user_request` como a abertura do legado a deixa. */
function linhaDeSolicitacao(
  sobreposicoes: Readonly<Record<string, string | number | null>> = {},
): LinhaDeResultado {
  return {
    ID: 42,
    post_author: 7,
    post_date: '2026-10-11 09:00:00',
    post_date_gmt: '2026-10-11 12:00:00',
    post_content: '{"foo":"bar"}',
    post_title: 'titular@exemplo.invalido',
    post_excerpt: '',
    post_status: 'request-pending',
    comment_status: 'closed',
    ping_status: 'closed',
    post_password: `${MARCADOR_DE_RESUMO_GENERICO}aGFzaC1kYS1jaGF2ZQ`,
    post_name: 'export_personal_data',
    to_ping: '',
    pinged: '',
    post_modified: '2026-10-11 09:30:00',
    post_modified_gmt: '2026-10-11 12:30:00',
    post_content_filtered: '',
    post_parent: 0,
    guid: 'https://exemplo.invalido/?p=42',
    menu_order: 0,
    post_type: TIPO_DE_SOLICITACAO,
    post_mime_type: '',
    comment_count: 0,
    ...sobreposicoes,
  };
}

/* ── O TIPO, AS TABELAS E AS CHAVES ────────────────────────────────────── */

test('o tipo de conteudo e as duas chaves de metadado sao os nomes do legado', () => {
  // `register_post_type( 'user_request', ... )`, `wp-includes/post.php:285`, e as
  // duas chaves que `WP_User_Request` le (`class-wp-user-request.php:117` e
  // `:118`). Byte a byte, porque e o que vai para a coluna.
  assert.equal(TIPO_DE_SOLICITACAO, 'user_request');
  assert.equal(
    CHAVE_DO_INSTANTE_DE_CONFIRMACAO,
    '_wp_user_request_confirmed_timestamp',
  );
  assert.equal(
    CHAVE_DO_INSTANTE_DE_CONCLUSAO,
    '_wp_user_request_completed_timestamp',
  );
});

test('as duas tabelas levam o prefixo DO SITE, e nenhuma e nova', () => {
  const dados = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_2_' }).porta;

  // Conteudo e por site (`target_data_model.md`, bloco ESCOPO POR SITE). Numa
  // rede a solicitacao do site 2 vive em `wp_2_posts`, e o cenario @invariante
  // de PT-012 cobra que "nenhuma das duas cria tabela propria".
  assert.equal(tabelaDeConteudo(dados), 'wp_2_posts');
  assert.equal(tabelaDeMetadadosDeConteudo(dados), 'wp_2_postmeta');
});

test('as duas acoes sao as do legado, com o verbo que o legado usa', () => {
  // `_wp_privacy_action_request_types()`, `wp-includes/user.php:4010` a `:4015`.
  // `remove_personal_data`, e nao `erase_personal_data`: o nome da capacidade e
  // o do arquivo de tela usam outro verbo para a mesma coisa.
  assert.deepEqual(ACOES_DE_SOLICITACAO, [
    'export_personal_data',
    'remove_personal_data',
  ]);
});

/* ── OS QUATRO ESTADOS ─────────────────────────────────────────────────── */

test('sao quatro estados, na ordem em que o legado os registra', () => {
  // `wp-includes/post.php:768`, `:783`, `:798` e `:813`. A ordem e observavel:
  // `get_post_stati()` devolve na ordem de registro, e e a mesma de
  // `_wp_privacy_statuses()` (`:1400` a `:1405`).
  assert.deepEqual(ESTADOS_DA_SOLICITACAO, [
    'request-pending',
    'request-confirmed',
    'request-failed',
    'request-completed',
  ]);
});

test('os quatro sao internos e nenhum e excluido da busca', () => {
  for (const estado of ESTADOS_DA_SOLICITACAO) {
    const propriedades = PROPRIEDADES_DO_ESTADO_DA_SOLICITACAO[estado];

    assert.equal(propriedades.interno, true, estado);
    assert.equal(propriedades.publico, false, estado);
    assert.equal(propriedades.protegido, false, estado);
    assert.equal(propriedades.privado, false, estado);
    assert.equal(propriedades.consultavelPeloPublico, false, estado);
    // ⚠️ `exclude_from_search => false` e declarado CONTRA o default de
    // `internal` (`post.php:778` e o default em `:1511`). Reproduzir `true`
    // porque "e interno, logo deveria ser" inverteria uma declaracao explicita.
    assert.equal(propriedades.excluidoDaBusca, false, estado);
    assert.equal(propriedades.visivelNaListaDeTodos, false, estado);
    assert.equal(propriedades.visivelNaListaDeEstados, false, estado);
    // Nenhum declara `date_floating`, logo a solicitacao nunca tem a sentinela
    // de data: a abertura informa as duas datas (`user.php:4849` e `:4850`).
    assert.equal(propriedades.dataFlutuante, false, estado);
  }
});

test('so dois estados aceitam validacao de chave, e sao os dois do legado', () => {
  // `in_array( $request->status, array( 'request-pending', 'request-failed' ),
  // true )` — `wp-includes/user.php:5097` e `:4252`. E o que fecha CA-2.3,
  // CA-2.4 e CA-3.2: o estado de falha aceita, o concluido nao.
  assert.deepEqual(ESTADOS_QUE_ACEITAM_VALIDACAO_DE_CHAVE, [
    'request-pending',
    'request-failed',
  ]);
  assert.ok(
    !ESTADOS_QUE_ACEITAM_VALIDACAO_DE_CHAVE.includes('request-completed'),
  );
  assert.ok(
    !ESTADOS_QUE_ACEITAM_VALIDACAO_DE_CHAVE.includes('request-confirmed'),
  );
});

test('a abertura aceita dois estados sem prefixo, e o prefixo e concatenado', () => {
  // `in_array( $status, array( 'pending', 'confirmed' ), true )`
  // (`user.php:4816`) e `'post_status' => 'request-' . $status` (`:4847`).
  assert.deepEqual(ESTADOS_ACEITOS_NA_ABERTURA, ['pending', 'confirmed']);
  assert.equal(PREFIXO_DO_ESTADO, 'request-');
  for (const aceito of ESTADOS_ACEITOS_NA_ABERTURA) {
    assert.ok(
      (ESTADOS_DA_SOLICITACAO as readonly string[]).includes(
        `${PREFIXO_DO_ESTADO}${aceito}`,
      ),
      aceito,
    );
  }
  // Falha e conclusao NAO podem ser pedidas na abertura.
  assert.ok(!ESTADOS_ACEITOS_NA_ABERTURA.includes('failed'));
  assert.ok(!ESTADOS_ACEITOS_NA_ABERTURA.includes('completed'));
});

/* ── A CHAVE DE CONFIRMACAO ────────────────────────────────────────────── */

test('a chave em claro tem 20 caracteres do alfabeto sem simbolo', () => {
  // `wp_generate_password( 20, false )` — `wp-includes/user.php:5060`, com o
  // alfabeto de `pluggable.php:2965`. O numero existe no legado, logo o P6
  // manda reproduzi-lo.
  assert.equal(COMPRIMENTO_DA_CHAVE_DE_CONFIRMACAO, 20);
  assert.equal(ALFABETO_DA_CHAVE_DE_CONFIRMACAO.length, 62);
  assert.ok(!ALFABETO_DA_CHAVE_DE_CONFIRMACAO.includes('!'));
  assert.ok(!ALFABETO_DA_CHAVE_DE_CONFIRMACAO.includes('-'));
});

test('a ausencia de chave e a cadeia vazia, e o marcador do resumo e observavel', () => {
  // `post_password varchar(255) NOT NULL default ''` — a ausencia e a sentinela
  // vazia, nao `NULL` (`DB-SENT`). E `$generic$` e o prefixo que
  // `wp_verify_fast_hash` testa para decidir entre o resumo novo e o phpass
  // antigo (`wp-includes/functions.php:9368` e `:9391`).
  assert.equal(SEM_CHAVE, '');
  assert.equal(MARCADOR_DE_RESUMO_GENERICO, '$generic$');
});

/* ── A LEITURA DA SOLICITACAO ──────────────────────────────────────────── */

test('a solicitacao e lida com uma consulta em posts e UMA em postmeta', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([linhaDeSolicitacao()]);
  falsa.responder([
    { post_id: 42, meta_key: CHAVE_DO_INSTANTE_DE_CONFIRMACAO, meta_value: '1760000000' },
  ]);

  const repositorio = criarRepositorioDeSolicitacoes(falsa.porta);
  const solicitacao = repositorio.obterPorId(42);

  assert.notEqual(solicitacao, null);
  // Duas consultas, nunca tres: `WP_User_Request` chama `get_post_meta` duas
  // vezes sobre o MESMO cache de objeto, logo so a primeira emite comando
  // (`wp-includes/meta.php:673` a `:678`).
  assert.equal(falsa.selecoes.length, 2);
  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT * FROM wp_posts WHERE ID = ? LIMIT 1',
  );
  assert.deepEqual(falsa.selecoes[0]?.parametros, [42]);
  assert.equal(
    falsa.selecoes[1]?.texto,
    'SELECT post_id, meta_key, meta_value FROM wp_postmeta ' +
      'WHERE post_id IN (?) ORDER BY meta_id ASC',
  );
  // E nenhuma escrita: ler nao grava.
  assert.deepEqual(falsa.escritas, []);
});

test('as seis colunas reaproveitadas chegam com o significado da solicitacao', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([linhaDeSolicitacao()]);
  falsa.responder([]);

  const solicitacao = criarRepositorioDeSolicitacoes(falsa.porta).obterPorId(42);

  // O mapa do construtor de `WP_User_Request`
  // (`class-wp-user-request.php:110` a `:120`).
  assert.equal(solicitacao?.id, 42);
  assert.equal(solicitacao?.contaDoTitular, 7);
  assert.equal(solicitacao?.enderecoDeEmail, 'titular@exemplo.invalido');
  assert.equal(solicitacao?.acao, 'export_personal_data');
  assert.equal(solicitacao?.estado, 'request-pending');
  assert.deepEqual(solicitacao?.dadosDoPedido, { foo: 'bar' });
  assert.equal(
    solicitacao?.chaveDeConfirmacao,
    `${MARCADOR_DE_RESUMO_GENERICO}aGFzaC1kYS1jaGF2ZQ`,
  );
  // As duas datas lidas sao as GMT, e nao as locais: o construtor usa
  // `post_date_gmt` e `post_modified_gmt` (`:115` e `:116`).
  assert.equal(solicitacao?.criadaEm, Date.UTC(2026, 9, 11, 12, 0, 0) / 1000);
  assert.equal(
    solicitacao?.modificadaEm,
    Date.UTC(2026, 9, 11, 12, 30, 0) / 1000,
  );
});

test('titular sem conta chega como 0, que e o que faz CA-1.3 valer', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([linhaDeSolicitacao({ post_author: 0 })]);
  falsa.responder([]);

  const solicitacao = criarRepositorioDeSolicitacoes(falsa.porta).obterPorId(42);

  // `$user_id = $user && ! is_wp_error( $user ) ? $user->ID : 0;`
  // (`wp-includes/user.php:4821`). As tres leituras do campo usam
  // `! empty( $request->user_id )`, logo `0` e `'0'` sao indistinguiveis.
  assert.equal(solicitacao?.contaDoTitular, SEM_CONTA);
  assert.equal(SEM_CONTA, 0);
});

test('identificador nao positivo nao emite comando nenhum', () => {
  const falsa = criarPortaDeDadosFalsa();
  const repositorio = criarRepositorioDeSolicitacoes(falsa.porta);

  assert.equal(repositorio.obterPorId(0), null);

  // `get_post()` desiste em `if ( $post_id <= 0 ) { return false; }`
  // (`wp-includes/class-wp-post.php:282`), ANTES da consulta. Lista vazia e
  // afirmacao, nao ausencia — e e por isso que a porta falsa registra comando
  // em vez de simular banco.
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('identificador negativo vira o positivo dele, como absint', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([linhaDeSolicitacao({ ID: 5 })]);
  falsa.responder([]);

  const solicitacao = criarRepositorioDeSolicitacoes(falsa.porta).obterPorId(-5);

  // `absint( $request_id )` e `abs( (int) $v )` — `wp-includes/user.php:5135`.
  // Nao e defesa, e coercao: a consulta sai para 5 quando se pediu -5.
  assert.deepEqual(falsa.selecoes[0]?.parametros, [5]);
  assert.equal(solicitacao?.id, 5);
});

test('linha de outro tipo devolve nulo e NAO consulta metadado', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([linhaDeSolicitacao({ post_type: 'post' })]);

  const solicitacao = criarRepositorioDeSolicitacoes(falsa.porta).obterPorId(42);

  // `if ( ! $post || 'user_request' !== $post->post_type ) { return false; }`
  // (`wp-includes/user.php:5138`): a guarda e em codigo, logo a leitura de
  // `posts` sai igual — e a de metadado nao sai. "Nao existe" e "existe e e
  // outra coisa" sao indistinguiveis porque sao indistinguiveis la.
  assert.equal(solicitacao, null);
  assert.equal(falsa.selecoes.length, 1);
});

test('linha ausente devolve nulo depois de uma consulta so', () => {
  const falsa = criarPortaDeDadosFalsa();

  const solicitacao = criarRepositorioDeSolicitacoes(falsa.porta).obterPorId(42);

  assert.equal(solicitacao, null);
  assert.equal(falsa.selecoes.length, 1);
});

test('os dois instantes de metadado saem de UMA leitura, e ausente e zero', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([linhaDeSolicitacao()]);
  falsa.responder([
    { post_id: 42, meta_key: CHAVE_DO_INSTANTE_DE_CONFIRMACAO, meta_value: '1760000000' },
    { post_id: 42, meta_key: '_wp_admin_notified', meta_value: '1' },
  ]);

  const solicitacao = criarRepositorioDeSolicitacoes(falsa.porta).obterPorId(42);

  assert.equal(solicitacao?.confirmadaEm, 1760000000);
  // ⚠️ `(int) get_post_meta( ..., true )` sobre chave ausente e `(int) ''`, que
  // e `0` (`class-wp-user-request.php:118`, com o default de
  // `wp-includes/meta.php:713`). A ausencia do metadado e INDISTINGUIVEL do
  // instante zero, e o legado nao as distingue tampouco.
  assert.equal(solicitacao?.concluidaEm, 0);
});

test('o dado auxiliar do pedido e JSON, e tudo o que json_decode recusa e nulo', () => {
  for (const [corpo, esperado] of [
    ['{"foo":"bar"}', { foo: 'bar' }],
    ['[]', []],
    ['', null],
    ['nao e json', null],
    ['null', null],
  ] as const) {
    const falsa = criarPortaDeDadosFalsa();
    falsa.responder([linhaDeSolicitacao({ post_content: corpo })]);
    falsa.responder([]);

    const solicitacao = criarRepositorioDeSolicitacoes(
      falsa.porta,
    ).obterPorId(42);

    // `json_decode( $post->post_content, true )`
    // (`class-wp-user-request.php:119`): coluna vazia, JSON invalido e o
    // literal `null` produzem o MESMO resultado, e o legado nao confere.
    assert.deepEqual(solicitacao?.dadosDoPedido, esperado, corpo);
  }
});

test('ler a solicitacao de uma linha que ja esta na mao nao emite comando', () => {
  const falsa = criarPortaDeDadosFalsa();
  const metadados = criarRepositorioDeMetadados(falsa.porta);

  // E o que o caminho da lista do painel faz: constroi o objeto a partir da
  // linha que a consulta da tabela ja trouxe
  // (`wp-admin/includes/class-wp-privacy-requests-table.php:401`).
  const solicitacao = lerSolicitacao(linhaDeSolicitacao(), [], metadados);

  assert.equal(solicitacao.enderecoDeEmail, 'titular@exemplo.invalido');
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('a leitura nao recusa estado nem acao fora do vocabulario (DB-DEG)', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([
    linhaDeSolicitacao({
      post_status: 'request-de-extensao',
      post_name: 'acao_de_extensao',
    }),
  ]);
  falsa.responder([]);

  const solicitacao = criarRepositorioDeSolicitacoes(falsa.porta).obterPorId(42);

  // `DB-DEG` (BR-MIGRAR-083) e `DB-ENUM`: a coluna nao tem `ENUM` nem `CHECK`,
  // `register_post_status()` e ponto de extensao publico, e o legado tolera o
  // valor nao registrado em vez de recusar. Um guarda aqui quebraria todo
  // estado e toda acao que uma extensao registrou.
  assert.equal(solicitacao?.estado, 'request-de-extensao');
  assert.equal(solicitacao?.acao, 'acao_de_extensao');
});

/* ── A ARITMETICA DA COLUNA DE DATA ────────────────────────────────────── */

test('a coluna de data vira segundos inteiros em UTC', () => {
  // `strtotime()` com `date_default_timezone_set( 'UTC' )`
  // (`wp-settings.php:73`): a expressao sem fuso e resolvida em UTC, e e por
  // isso que as duas colunas lidas assim sao as GMT.
  assert.equal(
    instanteDaColunaDeData('2026-10-11 12:30:00'),
    Date.UTC(2026, 9, 11, 12, 30, 0) / 1000,
  );
  assert.equal(instanteDaColunaDeData('1970-01-01 00:00:00'), 0);
});

test('a sentinela de data e o que a coluna nao sabe ler devolvem nulo', () => {
  // `strtotime( '0000-00-00 00:00:00' )` devolve `false`, e
  // `wp_validate_user_request_key` decide com `! $key_request_time`
  // (`wp-includes/user.php:5093`).
  assert.equal(instanteDaColunaDeData('0000-00-00 00:00:00'), null);
  assert.equal(instanteDaColunaDeData(''), null);
  assert.equal(instanteDaColunaDeData(null), null);
  assert.equal(instanteDaColunaDeData('ontem'), null);
});

test('nulo e o instante zero continuam distinguiveis, e o ramo e de T005', () => {
  // ⚠️ O legado trata `false` e `0` no mesmo ramo. A conversao preserva a
  // distincao porque devolver booleano apagaria o instante legitimo; aplicar a
  // verdade de PHP ao resultado e de quem tem o ramo.
  assert.notEqual(
    instanteDaColunaDeData('1970-01-01 00:00:00'),
    instanteDaColunaDeData('0000-00-00 00:00:00'),
  );
});

/* ── AS PRIMITIVAS DE METADADO ─────────────────────────────────────────── */

test('o valor unico sai da lista ja lida, e chave ausente e cadeia vazia', () => {
  const falsa = criarPortaDeDadosFalsa();
  const metadados = criarRepositorioDeMetadados(falsa.porta);
  const linhas = metadados.listar(42);

  assert.deepEqual(
    metadados.valorUnico(linhas, CHAVE_DO_INSTANTE_DE_CONFIRMACAO),
    AUSENTE_NA_LEITURA_UNICA,
  );
  // `get_metadata_default()` com `$single` devolve `''`
  // (`wp-includes/meta.php:713` a `:714`), e nao arranjo vazio nem nulo.
  assert.deepEqual(AUSENTE_NA_LEITURA_UNICA, { tipo: 'texto', valor: '' });
  assert.equal(falsa.selecoes.length, 1);
});

test('a chave repetida devolve a primeira na ordem de meta_id', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([
    { post_id: 42, meta_key: CHAVE_DO_INSTANTE_DE_CONFIRMACAO, meta_value: '100' },
    { post_id: 42, meta_key: CHAVE_DO_INSTANTE_DE_CONFIRMACAO, meta_value: '200' },
  ]);

  const metadados = criarRepositorioDeMetadados(falsa.porta);
  const valor = metadados.valorUnico(
    metadados.listar(42),
    CHAVE_DO_INSTANTE_DE_CONFIRMACAO,
  );

  // Nada no esquema impede a repeticao (`DB-UNIQ`, BR-MIGRAR-076), e o `ORDER
  // BY meta_id ASC` da consulta e o que decide quem vence
  // (`wp-includes/meta.php:1204` e `:686`).
  //
  // ⚠️ E o valor volta como TEXTO, nao como inteiro: `maybe_unserialize('100')`
  // devolve a cadeia, porque `'100'` nao esta serializado. O proprio docblock de
  // `get_metadata()` declara isso — *"numbers (both integer and float) are
  // returned as strings"* (`wp-includes/meta.php:598`) — e e dele que depende o
  // teste de baixo sobre o `UPDATE` que sai.
  assert.deepEqual(valor, { tipo: 'texto', valor: '100' });
});

test('gravar instante inexistente insere, e informa o identificador gerado', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([]); // a leitura da comparacao
  falsa.responder([]); // o `SELECT meta_id`

  const resultado = criarRepositorioDeMetadados(falsa.porta).gravar(
    42,
    CHAVE_DO_INSTANTE_DE_CONFIRMACAO,
    inteiro(1760000000),
  );

  // `update_metadata()` le duas vezes antes de escrever — a comparacao
  // (`wp-includes/meta.php:257`) e o `SELECT meta_id` (`:265`) — e delega para
  // `add_metadata()` quando nao ha linha (`:267`).
  assert.deepEqual(resultado, { gravou: true, acrescentadoComId: 7 });
  assert.equal(falsa.selecoes.length, 2);
  assert.equal(
    falsa.selecoes[1]?.texto,
    'SELECT meta_id FROM wp_postmeta WHERE meta_key = ? AND post_id = ?',
  );
  assert.equal(falsa.escritas.length, 1);
  assert.equal(
    falsa.escritas[0]?.texto,
    'INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (?, ?, ?)',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, [
    42,
    CHAVE_DO_INSTANTE_DE_CONFIRMACAO,
    1760000000,
  ]);
});

test('gravar valor de texto identico NAO emite comando de escrita', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([
    {
      post_id: 42,
      meta_key: '_export_file_name',
      meta_value: 'wp-personal-data-file-abc.zip',
    },
  ]);

  const resultado = criarRepositorioDeMetadados(falsa.porta).gravar(
    42,
    '_export_file_name',
    texto('wp-personal-data-file-abc.zip'),
  );

  // `if ( $old_value[0] === $meta_value ) { return false; }`
  // (`wp-includes/meta.php:259`), e so quando a chave existe UMA vez. A chave
  // usada aqui e de T011, e esta neste teste porque e o caso em que o ramo
  // REALMENTE dispara: o valor e texto dos dois lados.
  assert.deepEqual(resultado, { gravou: false, acrescentadoComId: null });
  assert.deepEqual(falsa.escritas, []);
  assert.equal(falsa.selecoes.length, 1);
});

test('o instante inteiro contra a coluna de texto NAO e identico, e o UPDATE sai', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([
    { post_id: 42, meta_key: CHAVE_DO_INSTANTE_DE_CONCLUSAO, meta_value: '1760000000' },
  ]);
  falsa.responder([{ meta_id: 11 }]);

  const resultado = criarRepositorioDeMetadados(falsa.porta).gravar(
    42,
    CHAVE_DO_INSTANTE_DE_CONCLUSAO,
    inteiro(1760000000),
  );

  // ⚠️ **O ramo de "valor identico" nunca dispara para os dois instantes desta
  // feature**, e nao e detalhe: a coluna devolve `'1760000000'` como TEXTO
  // (`wp-includes/meta.php:598`) e `update_post_meta` recebe `time()`, que e
  // INTEIRO (`user.php:4256`, `privacy-tools.php:55`). O `===` do PHP compara
  // tipo antes de valor, logo a comparacao e falsa e o `UPDATE` sai — inclusive
  // quando o instante gravado e exatamente o mesmo.
  assert.deepEqual(resultado, { gravou: true, acrescentadoComId: null });
  assert.equal(falsa.escritas.length, 1);
});

test('gravar valor diferente atualiza todas as linhas daquela chave', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([
    { post_id: 42, meta_key: CHAVE_DO_INSTANTE_DE_CONCLUSAO, meta_value: '100' },
  ]);
  falsa.responder([{ meta_id: 11 }, { meta_id: 12 }]);

  const resultado = criarRepositorioDeMetadados(falsa.porta).gravar(
    42,
    CHAVE_DO_INSTANTE_DE_CONCLUSAO,
    inteiro(200),
  );

  assert.deepEqual(resultado, { gravou: true, acrescentadoComId: null });
  assert.equal(
    falsa.escritas[0]?.texto,
    'UPDATE wp_postmeta SET meta_value = ? WHERE post_id = ? AND meta_key = ?',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, [
    200,
    42,
    CHAVE_DO_INSTANTE_DE_CONCLUSAO,
  ]);
});

test('a comparacao olha o valor do PHP, nao os bytes da coluna', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([
    { post_id: 42, meta_key: '_export_data_raw', meta_value: 'a:1:{s:3:"foo";i:1;}' },
  ]);

  // A coluna guarda o arranjo serializado; o valor a gravar e o arranjo. A
  // comparacao e feita DEPOIS de `maybe_unserialize` sobre o lido e ANTES de
  // `maybe_serialize` sobre o novo (`wp-includes/meta.php:257` e `:271`), logo
  // os dois sao identicos e nenhum comando sai. Compara-los como bytes daria
  // outro resultado para todo valor nao escalar.
  const resultado = criarRepositorioDeMetadados(falsa.porta).gravar(
    42,
    '_export_data_raw',
    arranjoPorNome([['foo', inteiro(1)]]),
  );

  assert.equal(resultado.gravou, false);
  assert.deepEqual(falsa.escritas, []);
});

test('apagar metadado emite dois comandos, e nenhum quando nao acha linha', () => {
  const comLinhas = criarPortaDeDadosFalsa();
  comLinhas.responder([{ meta_id: 11 }, { meta_id: 12 }]);

  const apagadas = criarRepositorioDeMetadados(comLinhas.porta).apagar(
    42,
    '_export_data_raw',
  );

  // `delete_metadata()`: `SELECT $id_column ...` (`wp-includes/meta.php:456`) e
  // so entao `DELETE ... WHERE meta_id IN( ... )` (`:514`).
  assert.equal(apagadas, 1);
  assert.equal(
    comLinhas.escritas[0]?.texto,
    'DELETE FROM wp_postmeta WHERE meta_id IN( ?,? )',
  );
  assert.deepEqual(comLinhas.escritas[0]?.parametros, [11, 12]);

  const semLinhas = criarPortaDeDadosFalsa();
  const nada = criarRepositorioDeMetadados(semLinhas.porta).apagar(
    42,
    '_export_data_raw',
  );

  // `if ( ! count( $meta_ids ) ) { return false; }` (`:467`): o `DELETE` NAO
  // sai, e e isso que a lista vazia afirma.
  assert.equal(nada, 0);
  assert.deepEqual(semLinhas.escritas, []);
});

test('o valor booleano vai para a coluna como 1 e como vazio', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([]);
  falsa.responder([]);

  criarRepositorioDeMetadados(falsa.porta).gravar(42, '_wp_admin_notified', {
    tipo: 'booleano',
    valor: true,
  } satisfies ValorPhp);

  // `update_post_meta( $request_id, '_wp_admin_notified', true )`
  // (`wp-includes/user.php:4474`): o `(string)` do PHP no marcador `%s`
  // produz `'1'`, e e por isso que o legado le a chave com `(bool)`.
  assert.equal(textoDoParametro(falsa.escritas[0]?.parametros[2]), '1');
});

/* ── A COMPOSICAO ──────────────────────────────────────────────────────── */

test('compor o armazenamento nao emite comando nenhum (EXT-ORDEM)', () => {
  const falsa = criarPortaDeDadosFalsa();

  criarArmazenamentoDePrivacidade(falsa.porta);

  // BR-MIGRAR-106 (`EXT-ORDEM`): a ordem de arranque e contrato publico, e
  // trabalho feito na composicao e trabalho fora da ordem.
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('duas composicoes de sites diferentes nao se enxergam (EXT-CONTEXTO)', () => {
  const primeira = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_' });
  const segunda = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_2_' });

  const a = criarArmazenamentoDePrivacidade(primeira.porta);
  const b = criarArmazenamentoDePrivacidade(segunda.porta);

  a.solicitacoes.obterPorId(42);

  // BR-MIGRAR-105 (`EXT-CONTEXTO`) e a primeira metade do cenario
  // @concorrencia de PT-012: "nenhum arquivo de exportacao contem dado do
  // outro titular".
  assert.equal(primeira.selecoes.length, 1);
  assert.equal(
    primeira.selecoes[0]?.texto,
    'SELECT * FROM wp_posts WHERE ID = ? LIMIT 1',
  );
  assert.equal(segunda.selecoes.length, 0);

  b.solicitacoes.obterPorId(42);
  assert.equal(
    segunda.selecoes[0]?.texto,
    'SELECT * FROM wp_2_posts WHERE ID = ? LIMIT 1',
  );
});

test('o armazenamento nao oferece escrita da linha de posts', () => {
  const falsa = criarPortaDeDadosFalsa();

  const armazenamento = criarArmazenamentoDePrivacidade(falsa.porta);

  // 🔴 A ausencia e a decisao de T002, e esta afirmada aqui para que
  // acrescentar `inserir` ou `atualizar` quebre um teste em vez de passar em
  // silencio. O caminho da privacidade do legado nao emite comando proprio
  // sobre `posts`: as cinco escritas passam por `wp_insert_post()` /
  // `wp_update_post()`, que reescrevem 21 colunas, reescrevem `post_modified`
  // (de onde sai o prazo de 24 h) e disparam cinco pontos de extensao. A razao
  // inteira, com as ancoras, esta no cabecalho de `./solicitacao.ts`.
  assert.deepEqual(Object.keys(armazenamento).sort(), ['solicitacoes']);
  assert.deepEqual(Object.keys(armazenamento.solicitacoes).sort(), [
    'metadados',
    'obterPorId',
  ]);
  assert.deepEqual(Object.keys(armazenamento.solicitacoes.metadados).sort(), [
    'apagar',
    'gravar',
    'listar',
    'valorUnico',
    'valoresDe',
  ]);
});
