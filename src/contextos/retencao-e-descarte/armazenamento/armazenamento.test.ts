/**
 * Testes da entrega de **T002**: *"o estado anterior e o instante do descarte
 * sao gravados e lidos como metadado do registro, para conteudo e para
 * comentario, pela porta de dados"*.
 *
 * Nao sao os testes de nenhuma historia — esses sao T004, T006, T008 e os demais
 * `[P]` de `tasks.md`, um por caso de `backlog/tests.md`. Aqui se afirma o que
 * T002 entrega: **qual comando sai, com quais parametros, com quais bytes, e
 * quando nenhum comando sai**. E o criterio da area 3 da Decisao 2 de
 * `parity_specs.md` (*"efeito no banco ... snapshot + sequencia de comandos"*),
 * e e por isso que a porta falsa registra comando em vez de simular banco.
 *
 * O que estes testes **nao** afirmam, porque nao e desta tarefa: o prazo e a
 * comparacao de vencimento (T001 entregou o numero, T011 faz a varredura), a
 * ordem em que cada fluxo chama as primitivas (T003, T005, T007, T015) e a
 * cascata que preenche o marcador agrupado (T005).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  arranjo,
  serializarComoTexto,
} from '../../../plataforma/serializacao/index.js';
import {
  colunaDoObjeto,
  criarArmazenamentoDeRetencao,
  criarMarcadoresDeLixeiraDoComentario,
  criarMarcadoresDeLixeiraDoConteudo,
  criarPortaDeDadosFalsa,
  criarRepositorioDeMetadados,
  MARCADORES_DE_LIXEIRA,
  MARCADOR_DE_ESTADO_ANTERIOR,
  MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
  MARCADOR_DO_INSTANTE_DO_DESCARTE,
  METADADO_DE_COMENTARIO,
  METADADO_DE_CONTEUDO,
  tabelaDeMetadado,
  textoDoParametro,
} from './index.js';

test('as tres chaves de marcador sao as do legado, byte a byte', () => {
  // Sao chave de metadado gravada em banco: renomear qualquer uma delas torna
  // invisivel o descarte de toda instalacao existente, e cai em P8.
  assert.equal(MARCADOR_DE_ESTADO_ANTERIOR, '_wp_trash_meta_status');
  assert.equal(MARCADOR_DO_INSTANTE_DO_DESCARTE, '_wp_trash_meta_time');
  assert.equal(
    MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
    '_wp_trash_meta_comments_status',
  );
  assert.deepEqual([...MARCADORES_DE_LIXEIRA], [
    '_wp_trash_meta_status',
    '_wp_trash_meta_time',
    '_wp_trash_meta_comments_status',
  ]);
});

test('a tabela e a coluna sao derivadas do tipo de metadado, com o prefixo do site', () => {
  const doSite = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_' });
  const deOutroSiteDaRede = criarPortaDeDadosFalsa({
    prefixoDeTabela: 'wp_7_',
  });

  // `_get_meta_table()`: `$type . 'meta'` (`wp-includes/meta.php:1290`).
  assert.equal(
    tabelaDeMetadado(doSite.porta, METADADO_DE_CONTEUDO),
    'wp_postmeta',
  );
  assert.equal(
    tabelaDeMetadado(doSite.porta, METADADO_DE_COMENTARIO),
    'wp_commentmeta',
  );
  // As duas tabelas sao de ESCOPO POR SITE: numa rede o identificador do site
  // entra dentro do nome (`target_data_model.md`).
  assert.equal(
    tabelaDeMetadado(deOutroSiteDaRede.porta, METADADO_DE_CONTEUDO),
    'wp_7_postmeta',
  );

  // `sanitize_key( $meta_type . '_id' )` (`wp-includes/meta.php:59`) — e a caixa
  // baixa e o que faz `comment_id` ser diferente de `comments.comment_ID`.
  assert.equal(colunaDoObjeto(METADADO_DE_CONTEUDO), 'post_id');
  assert.equal(colunaDoObjeto(METADADO_DE_COMENTARIO), 'comment_id');
});

test('compor o armazenamento nao emite comando nenhum (EXT-ORDEM)', () => {
  const dados = criarPortaDeDadosFalsa();

  const armazenamento = criarArmazenamentoDeRetencao(dados.porta);

  assert.deepEqual(dados.selecoes, []);
  assert.deepEqual(dados.escritas, []);
  assert.equal(armazenamento.marcadoresDoConteudo.metadados.tipo, 'post');
  assert.equal(
    armazenamento.marcadoresDoComentario.metadados.tabela,
    'wp_commentmeta',
  );
});

test('o descarte do conteudo grava o estado anterior em postmeta, por insercao', () => {
  const dados = criarPortaDeDadosFalsa();
  const marcadores = criarMarcadoresDeLixeiraDoConteudo(dados.porta);

  const id = marcadores.acrescentarEstadoAnterior(42, 'publish');

  // `add_post_meta( $post_id, '_wp_trash_meta_status', $previous_status )`
  // (`wp-includes/post.php:4128`): insercao, sempre — nunca `UPDATE`, e sem
  // consultar antes, porque a forma com `$unique` nao e a que o legado usa.
  assert.deepEqual(dados.selecoes, []);
  assert.equal(dados.escritas.length, 1);
  assert.equal(
    dados.escritas[0]?.texto,
    'INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (?, ?, ?)',
  );
  assert.deepEqual(dados.escritas[0]?.parametros, [
    42,
    '_wp_trash_meta_status',
    'publish',
  ]);
  assert.equal(id, 7);
});

test('o instante do descarte chega a coluna como a cadeia decimal que a coleta compara', () => {
  const dados = criarPortaDeDadosFalsa();
  const marcadores = criarMarcadoresDeLixeiraDoConteudo(dados.porta);

  marcadores.acrescentarInstanteDoDescarte(42, 1762800000);

  // `add_post_meta( $post_id, '_wp_trash_meta_time', time() )`
  // (`wp-includes/post.php:4129`). `maybe_serialize()` nao toca inteiro, logo o
  // que a coluna `longtext` recebe e `1762800000` — e e sobre essa cadeia que
  // `meta_value < %d` (`wp-includes/functions.php:6979`) vai comparar em T011.
  assert.equal(dados.escritas.length, 1);
  assert.deepEqual(dados.escritas[0]?.parametros, [
    42,
    '_wp_trash_meta_time',
    1762800000,
  ]);
  assert.equal(textoDoParametro(dados.escritas[0]?.parametros[2]), '1762800000');
});

test('o comentario grava os mesmos dois marcadores, em commentmeta', () => {
  const dados = criarPortaDeDadosFalsa();
  const marcadores = criarMarcadoresDeLixeiraDoComentario(dados.porta);

  // `wp_trash_comment()` grava `$comment->comment_approved`, que e a coluna de
  // aprovacao e nao um estado editorial: `'1'` e aprovado
  // (`wp-includes/comment.php:1691`).
  marcadores.acrescentarEstadoAnterior(13, '1');
  marcadores.acrescentarInstanteDoDescarte(13, 1762800000);

  assert.deepEqual(
    dados.escritas.map((escrita) => escrita.texto),
    [
      'INSERT INTO wp_commentmeta (comment_id, meta_key, meta_value) VALUES (?, ?, ?)',
      'INSERT INTO wp_commentmeta (comment_id, meta_key, meta_value) VALUES (?, ?, ?)',
    ],
  );
  assert.deepEqual(dados.escritas[0]?.parametros, [
    13,
    '_wp_trash_meta_status',
    '1',
  ]);
  assert.deepEqual(dados.escritas[1]?.parametros, [
    13,
    '_wp_trash_meta_time',
    1762800000,
  ]);
});

test('ler o marcador e UM comando que carrega todas as linhas do registro', () => {
  const dados = criarPortaDeDadosFalsa();
  dados.responder([
    { post_id: 42, meta_key: '_wp_trash_meta_status', meta_value: 'private' },
    { post_id: 42, meta_key: '_wp_trash_meta_time', meta_value: '1762800000' },
    { post_id: 42, meta_key: '_thumbnail_id', meta_value: '9' },
  ]);
  const marcadores = criarMarcadoresDeLixeiraDoConteudo(dados.porta);

  assert.equal(marcadores.estadoAnterior(42), 'private');

  // `get_metadata_raw()` nao consulta por chave: ele carrega o registro inteiro
  // (`update_meta_cache()`, `wp-includes/meta.php:1204`) e filtra em memoria.
  // Consultar por chave emitiria um comando por marcador lido.
  assert.equal(dados.selecoes.length, 1);
  assert.equal(
    dados.selecoes[0]?.texto,
    'SELECT post_id, meta_key, meta_value FROM wp_postmeta ' +
      'WHERE post_id IN (?) ORDER BY meta_id ASC',
  );
  assert.deepEqual(dados.selecoes[0]?.parametros, [42]);
});

test('marcador ausente le como texto vazio, e e esse vazio que decide tres fluxos', () => {
  const dados = criarPortaDeDadosFalsa();
  dados.responder([]);
  const marcadores = criarMarcadoresDeLixeiraDoConteudo(dados.porta);

  // `get_metadata_default()` devolve `''` quando se pede um valor so
  // (`wp-includes/meta.php:713`). E o `! $previous_status` do anexo
  // (`wp-includes/post.php:1317`) e o `empty( $status )` do comentario
  // restaurado (`wp-includes/comment.php:1756`) que dependem disto.
  assert.equal(marcadores.estadoAnterior(42), '');
  assert.equal(dados.selecoes.length, 1);
});

test('chave repetida: a leitura devolve a PRIMEIRA linha, na ordem de meta_id', () => {
  const dados = criarPortaDeDadosFalsa();
  dados.responder([
    { post_id: 42, meta_key: '_wp_trash_meta_status', meta_value: 'publish' },
    { post_id: 42, meta_key: '_wp_trash_meta_status', meta_value: 'draft' },
  ]);
  const marcadores = criarMarcadoresDeLixeiraDoConteudo(dados.porta);

  // Nada no esquema impede a repeticao, e `add_post_meta()` sem `$unique`
  // sempre insere: duas passagens pela lixeira deixariam duas linhas. O
  // `ORDER BY meta_id ASC` da consulta e o que decide qual vence.
  assert.equal(marcadores.estadoAnterior(42), 'publish');
});

test('o instante lido distingue ausente de zero', () => {
  const semMarcador = criarPortaDeDadosFalsa();
  semMarcador.responder([]);
  assert.equal(
    criarMarcadoresDeLixeiraDoConteudo(semMarcador.porta).instanteDoDescarte(42),
    null,
  );

  const comMarcador = criarPortaDeDadosFalsa();
  comMarcador.responder([
    { post_id: 42, meta_key: '_wp_trash_meta_time', meta_value: '1762800000' },
  ]);
  assert.equal(
    criarMarcadoresDeLixeiraDoConteudo(comMarcador.porta).instanteDoDescarte(42),
    1762800000,
  );

  // Valor ilegivel coerce para `0`, que e o que o MySQL faz ao comparar
  // `meta_value < %d` sobre coluna de texto — e `0` vence sempre, logo o
  // registro com marcador corrompido e apagado pela coleta. Comportamento, nao
  // defeito a corrigir (P1).
  const corrompido = criarPortaDeDadosFalsa();
  corrompido.responder([
    { post_id: 42, meta_key: '_wp_trash_meta_time', meta_value: 'ontem' },
  ]);
  assert.equal(
    criarMarcadoresDeLixeiraDoConteudo(corrompido.porta).instanteDoDescarte(42),
    0,
  );
});

test('apagar marcador sao dois comandos: le os meta_id e apaga por eles', () => {
  const dados = criarPortaDeDadosFalsa({
    resultadoDeEscrita: { linhasAfetadas: 2, idGerado: null },
  });
  dados.responder([{ meta_id: 11 }, { meta_id: 12 }]);
  const marcadores = criarMarcadoresDeLixeiraDoConteudo(dados.porta);

  const apagadas = marcadores.apagarEstadoAnterior(42);

  // `delete_metadata()`: `SELECT meta_id ...` e so entao `DELETE ... IN( ... )`
  // (`wp-includes/meta.php:456` e `:514`). A ordem das condicoes do `SELECT` e a
  // do legado — `meta_key` primeiro, porque a coluna do objeto e concatenada a
  // cadeia ja preparada (`:459`).
  assert.equal(dados.selecoes.length, 1);
  assert.equal(
    dados.selecoes[0]?.texto,
    'SELECT meta_id FROM wp_postmeta WHERE meta_key = ? AND post_id = ?',
  );
  assert.deepEqual(dados.selecoes[0]?.parametros, [
    '_wp_trash_meta_status',
    42,
  ]);
  assert.equal(dados.escritas.length, 1);
  assert.equal(
    dados.escritas[0]?.texto,
    'DELETE FROM wp_postmeta WHERE meta_id IN( ?,? )',
  );
  assert.deepEqual(dados.escritas[0]?.parametros, [11, 12]);
  assert.equal(apagadas, 2);
});

test('apagar marcador que nao existe NAO emite DELETE — e e o caso comum de US-7', () => {
  const dados = criarPortaDeDadosFalsa();
  dados.responder([]);
  const marcadores = criarMarcadoresDeLixeiraDoComentario(dados.porta);

  const apagadas = marcadores.apagarInstanteDoDescarte(13);

  // `if ( ! count( $meta_ids ) ) return false` (`wp-includes/meta.php:467`): o
  // `DELETE` nao sai. A coleta de US-7 passa por aqui em todo registro que outro
  // caminho ja limpou, e a lista de escritas vazia e a afirmacao.
  assert.equal(dados.selecoes.length, 1);
  assert.deepEqual(dados.escritas, []);
  assert.equal(apagadas, 0);
});

test('identificador zero e recusado antes de qualquer comando', () => {
  const dados = criarPortaDeDadosFalsa();
  const marcadores = criarMarcadoresDeLixeiraDoConteudo(dados.porta);

  // `absint( $object_id )` e `if ( ! $object_id ) return false`
  // (`wp-includes/meta.php:47`, `:406` e `:633`). O zero nao consulta e nao
  // grava: e a guarda, nao uma consulta que devolve vazio.
  assert.equal(marcadores.acrescentarEstadoAnterior(0, 'publish'), 0);
  assert.equal(marcadores.estadoAnterior(0), '');
  assert.equal(marcadores.instanteDoDescarte(0), null);
  assert.equal(marcadores.apagarEstadoAnterior(0), 0);

  assert.deepEqual(dados.selecoes, []);
  assert.deepEqual(dados.escritas, []);
});

test('identificador negativo nao e recusado: ele e espelhado no positivo', () => {
  const dados = criarPortaDeDadosFalsa();
  const marcadores = criarMarcadoresDeLixeiraDoConteudo(dados.porta);

  marcadores.acrescentarEstadoAnterior(-5, 'publish');

  // `absint( -5 )` e `abs( (int) -5 )`, ou seja `5`
  // (`wp-includes/load.php:1468`): o marcador vai para o conteudo 5. O bloco de
  // documentacao de `get_metadata_raw()` diz o contrario — "False for an invalid
  // $object_id (non-numeric, zero, or negative value)" — e o CODIGO ganha, por
  // P1. Reproduzido de proposito.
  assert.equal(dados.escritas.length, 1);
  assert.deepEqual(dados.escritas[0]?.parametros, [
    5,
    '_wp_trash_meta_status',
    'publish',
  ]);
});

test('o estado anterior dos comentarios e gravado agrupado, com chave inteira e na ordem dada', () => {
  const dados = criarPortaDeDadosFalsa();
  const marcadores = criarMarcadoresDeLixeiraDoConteudo(dados.porta);

  marcadores.acrescentarEstadosDosComentarios(42, [
    { comentarioId: 9, estado: '1' },
    { comentarioId: 5, estado: '0' },
    { comentarioId: 7, estado: 'spam' },
  ]);

  // `add_post_meta( $post_id, '_wp_trash_meta_comments_status', $statuses )`
  // (`wp-includes/post.php:4299`), com `maybe_serialize()` no caminho. Duas
  // coisas sao observaveis nos bytes e as duas estao afirmadas aqui:
  //
  // 1. a chave e INTEIRA, porque o PHP normaliza a cadeia numerica que vem do
  //    driver (`$statuses[ $comment->comment_ID ]`) para chave inteira;
  // 2. a ORDEM e a da consulta que leu os comentarios, que nao tem `ORDER BY`
  //    (`wp-includes/post.php:4288`) — nao a ordem crescente de identificador.
  //    Ordenar aqui mudaria o byte gravado, e o cenario de
  //    `15-fronteira-do-banco-e-codec-serialize` exige que ninguem "normalize,
  //    reordene nem reindexe a estrutura".
  assert.equal(dados.escritas.length, 1);
  assert.equal(
    dados.escritas[0]?.texto,
    'INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (?, ?, ?)',
  );
  assert.equal(
    textoDoParametro(dados.escritas[0]?.parametros[2]),
    'a:3:{i:9;s:1:"1";i:5;s:1:"0";i:7;s:4:"spam";}',
  );
});

test('o estado anterior dos comentarios e lido de volta na mesma ordem', () => {
  const dados = criarPortaDeDadosFalsa();
  const guardado = arranjo([
    { chave: { tipo: 'inteiro', valor: 9 }, valor: { tipo: 'texto', valor: '1' } },
    {
      chave: { tipo: 'inteiro', valor: 5 },
      valor: { tipo: 'texto', valor: 'spam' },
    },
  ]);
  dados.responder([
    {
      post_id: 42,
      meta_key: '_wp_trash_meta_comments_status',
      meta_value: serializarComoTexto(guardado),
    },
  ]);
  const marcadores = criarMarcadoresDeLixeiraDoConteudo(dados.porta);

  // `get_post_meta( $post_id, '_wp_trash_meta_comments_status', true )`
  // (`wp-includes/post.php:4340`). A restauracao agrupa por estado e emite um
  // `UPDATE` por grupo — e isso e T007, nao daqui.
  assert.deepEqual(marcadores.estadosDosComentarios(42), [
    { comentarioId: 9, estado: '1' },
    { comentarioId: 5, estado: 'spam' },
  ]);
});

test('marcador agrupado ausente le como null, e nenhum comando de escrita sai', () => {
  const dados = criarPortaDeDadosFalsa();
  dados.responder([]);
  const marcadores = criarMarcadoresDeLixeiraDoConteudo(dados.porta);

  // `if ( ! $statuses ) return true` (`wp-includes/post.php:4342`): a
  // restauracao de comentarios encerra sem tocar em `comments`. E a borda de
  // UT-048-6 em termos de banco.
  assert.equal(marcadores.estadosDosComentarios(42), null);
  assert.deepEqual(dados.escritas, []);

  // Arranjo vazio NAO e o mesmo estado do banco que marcador ausente, e os dois
  // caem no mesmo `! $statuses` do legado. Quem decide o que fazer com cada um e
  // T007; aqui os dois sao distinguiveis de proposito.
  const comArranjoVazio = criarPortaDeDadosFalsa();
  comArranjoVazio.responder([
    {
      post_id: 42,
      meta_key: '_wp_trash_meta_comments_status',
      meta_value: serializarComoTexto(arranjo([])),
    },
  ]);
  assert.deepEqual(
    criarMarcadoresDeLixeiraDoConteudo(
      comArranjoVazio.porta,
    ).estadosDosComentarios(42),
    [],
  );
});

test('duas composicoes nao compartilham estado (EXT-CONTEXTO, BR-MIGRAR-105)', () => {
  const doSitePrincipal = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_' });
  const doSeteDaRede = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_7_' });

  const principal = criarMarcadoresDeLixeiraDoConteudo(doSitePrincipal.porta);
  const sete = criarMarcadoresDeLixeiraDoConteudo(doSeteDaRede.porta);

  principal.acrescentarEstadoAnterior(42, 'publish');

  // Se o repositorio guardasse a porta em estado de modulo, o marcador de um
  // site cairia na tabela do outro — e a coleta de um apagaria conteudo do
  // outro.
  assert.equal(doSitePrincipal.escritas.length, 1);
  assert.deepEqual(doSeteDaRede.escritas, []);
  assert.equal(sete.metadados.tabela, 'wp_7_postmeta');
  assert.equal(principal.metadados.tabela, 'wp_postmeta');
});

test('`listar` nao aplica a guarda de identificador, e e o legado que nao aplica', () => {
  const dados = criarPortaDeDadosFalsa();
  const metadados = criarRepositorioDeMetadados(
    dados.porta,
    METADADO_DE_CONTEUDO,
  );

  metadados.listar(0);

  // `update_meta_cache()` so faz `array_map( 'intval', $object_ids )`
  // (`wp-includes/meta.php:1156`); quem recusa o zero e `get_metadata_raw()`,
  // acima dele (`:633`). A consulta com `IN (0)` sai, e devolve vazio. A
  // diferenca importa para quem for montar a leitura em lote da coleta.
  assert.equal(dados.selecoes.length, 1);
  assert.deepEqual(dados.selecoes[0]?.parametros, [0]);
});
