/**
 * Testes da entrega de T002: *"as estruturas da secao Modelo de dados do plano
 * existem e sao lidas e gravadas pela porta de dados, incluindo a
 * auto-referencia que liga filho, anexo e versao ao registro pai"*.
 *
 * O que cada teste afirma e **efeito no banco**: qual comando sai, em que ordem,
 * com quais parametros e — no valor serializado — com quais bytes. E o criterio
 * da area 3 da Decisao 2 de `parity_specs.md`, que compara *"snapshot +
 * sequencia de comandos"* com **zero** divergencia admitida.
 *
 * Os testes das historias sao outros — T004, T006, T008 … —, e estes nao
 * publicam, nao resolvem estado, nao cobram unicidade e nao autorizam nada:
 * nenhuma dessas regras existe neste modulo ainda, e cada uma tem a tarefa dela.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  lista,
  texto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';

import {
  camposDaVersao,
  colunaDoVinculo,
  criarArmazenamentoDeConteudo,
  DATA_SENTINELA,
  nomeDaVersao,
  TIPO_DE_ANEXO,
  TIPO_DE_VERSAO,
  valorDeMetadado,
  versaoDoNome,
  vinculoDaLinha,
  type Conteudo,
  type ConteudoGravavel,
} from './index.js';
import { criarPortaDeDadosFalsa, textoDoParametro } from './porta-falsa.js';

/**
 * Os 21 campos gravaveis, resolvidos como `wp_insert_post()` os resolveria.
 *
 * Resolver default e da tarefa que grava (T005): aqui eles so precisam estar
 * todos presentes, porque o caminho de aplicacao nunca omite coluna.
 */
const CONTEUDO: ConteudoGravavel = {
  autorId: 3,
  data: '2026-10-08 09:00:00',
  dataGmt: '2026-10-08 12:00:00',
  corpo: 'Corpo.',
  corpoFiltrado: '',
  titulo: 'Titulo',
  resumo: '',
  estado: 'draft',
  tipo: 'post',
  estadoDeComentario: 'open',
  estadoDeNotificacao: 'open',
  senha: '',
  identificadorNaUrl: 'titulo',
  aPingar: '',
  pingados: '',
  modificadoEm: '2026-10-08 09:00:00',
  modificadoEmGmt: '2026-10-08 12:00:00',
  vinculo: { tipo: 'sem-pai' },
  ordemNoMenu: 0,
  tipoMime: '',
  guid: '',
};

/** Uma linha de `posts` como o banco a devolve, com as 23 colunas. */
function linhaDeConteudo(
  sobrescritas: Record<string, string | number> = {},
): Record<string, string | number> {
  return {
    ID: 12,
    post_author: 3,
    post_date: '2026-10-08 09:00:00',
    post_date_gmt: '2026-10-08 12:00:00',
    post_content: 'Corpo.',
    post_title: 'Titulo',
    post_excerpt: '',
    post_status: 'draft',
    comment_status: 'open',
    ping_status: 'open',
    post_password: '',
    post_name: 'titulo',
    to_ping: '',
    pinged: '',
    post_modified: '2026-10-08 09:00:00',
    post_modified_gmt: '2026-10-08 12:00:00',
    post_content_filtered: '',
    post_parent: 0,
    guid: 'http://exemplo.invalido/?p=12',
    menu_order: 0,
    post_type: 'post',
    post_mime_type: '',
    comment_count: 0,
    ...sobrescritas,
  };
}

test('criar o armazenamento nao toca na porta (EXT-ORDEM)', () => {
  const falsa = criarPortaDeDadosFalsa();

  criarArmazenamentoDeConteudo(falsa.porta);

  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('inserir escreve as 21 colunas na ordem do legado, e nem `ID` nem `comment_count`', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);

  const id = armazenamento.conteudo.inserir(CONTEUDO);

  assert.equal(id, 7);
  assert.equal(falsa.escritas.length, 1);
  const consulta = falsa.escritas[0];
  assert.ok(consulta);
  // A ordem e a do `compact()` de `wp_insert_post()`
  // (`wp-includes/post.php:4912` a `:4933`).
  assert.equal(
    consulta.texto,
    'INSERT INTO wp_posts (post_author, post_date, post_date_gmt, ' +
      'post_content, post_content_filtered, post_title, post_excerpt, ' +
      'post_status, post_type, comment_status, ping_status, post_password, ' +
      'post_name, to_ping, pinged, post_modified, post_modified_gmt, ' +
      'post_parent, menu_order, post_mime_type, guid) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  // As duas colunas que a escrita do legado nao menciona: a chave, que o banco
  // gera, e o contador desnormalizado, mantido por outro caminho (`DB-TRG1`).
  assert.ok(!/\(ID,|, ID,/.test(consulta.texto));
  assert.ok(!consulta.texto.includes('comment_count'));
  assert.deepEqual(consulta.parametros, [
    3,
    '2026-10-08 09:00:00',
    '2026-10-08 12:00:00',
    'Corpo.',
    '',
    'Titulo',
    '',
    'draft',
    'post',
    'open',
    'open',
    '',
    'titulo',
    '',
    '',
    '2026-10-08 09:00:00',
    '2026-10-08 12:00:00',
    0,
    0,
    '',
    '',
  ]);
});

test('inserir com identificador sugerido escreve a coluna `ID` (o `import_id`)', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);

  const id = armazenamento.conteudo.inserir(CONTEUDO, 940);

  assert.equal(id, 940);
  assert.ok(falsa.escritas[0]?.texto.startsWith('INSERT INTO wp_posts (ID, '));
  assert.equal(falsa.escritas[0]?.parametros[0], 940);
});

test('a verificacao do identificador sugerido e a consulta do legado', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);

  assert.equal(armazenamento.conteudo.existeId(940), false);
  falsa.responder([{ ID: 940 }]);
  assert.equal(armazenamento.conteudo.existeId(940), true);

  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT ID FROM wp_posts WHERE ID = ?',
  );
  assert.deepEqual(falsa.selecoes[0]?.parametros, [940]);
});

test('a linha e lida por `SELECT *`, e a sentinela de data sobrevive literal', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);
  falsa.responder([
    linhaDeConteudo({
      post_date: DATA_SENTINELA,
      post_date_gmt: DATA_SENTINELA,
      post_status: 'draft',
    }),
  ]);

  const conteudo = armazenamento.conteudo.obterPorId(12);

  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT * FROM wp_posts WHERE ID = ? LIMIT 1',
  );
  assert.deepEqual(falsa.selecoes[0]?.parametros, [12]);
  assert.equal(conteudo?.id, 12);
  assert.equal(conteudo?.autorId, 3);
  // Nao vira nulo e nao vira data deste runtime: e a cadeia (`DB-SENT`, e
  // 🔴 `BR-HUMANA-003` pendente).
  assert.equal(conteudo?.data, DATA_SENTINELA);
  assert.equal(conteudo?.dataGmt, DATA_SENTINELA);
  assert.equal(conteudo?.contagemDeComentarios, 0);
  assert.equal(armazenamento.conteudo.obterPorId(999), null);
});

test('`SELECT *` carrega a coluna que uma extensao acrescentou (DB-MIG)', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);
  falsa.responder([linhaDeConteudo({ coluna_de_extensao: 'x' })]);

  // A linha com coluna a mais e lida sem recusa: *"o DDL e o piso, nao o
  // retrato"* (`DB-MIG`, BR-MIGRAR-085). As 23 conhecidas saem como sempre.
  const conteudo = armazenamento.conteudo.obterPorId(12);

  assert.equal(conteudo?.titulo, 'Titulo');
  assert.ok(falsa.selecoes[0]?.texto.includes('SELECT *'));
});

test('a MESMA coluna lida nas tres semanticas, pelo tipo da linha filha', () => {
  // E a entrega que T002 nomeia, e a tabela do cabecalho de
  // `vinculo-com-o-pai.ts`: quem separa as tres e o `post_type` do filho, que e
  // como `wp_delete_post()` as pergunta (`wp-includes/post.php:3899`, `:3913` e
  // `:3923`).
  assert.deepEqual(vinculoDaLinha('page', 12), { tipo: 'pagina-mae', id: 12 });
  assert.deepEqual(vinculoDaLinha(TIPO_DE_ANEXO, 12), {
    tipo: 'anfitriao-do-anexo',
    id: 12,
  });
  assert.deepEqual(vinculoDaLinha(TIPO_DE_VERSAO, 12), {
    tipo: 'original-da-versao',
    id: 12,
  });

  // `0` e ausencia, e nao nulo (`DB-SENT`): *"um LEFT JOIN ... WHERE pai IS
  // NULL nao encontra orfao nenhum neste banco"*.
  assert.deepEqual(vinculoDaLinha('page', 0), { tipo: 'sem-pai' });
  assert.deepEqual(vinculoDaLinha(TIPO_DE_VERSAO, 0), { tipo: 'sem-pai' });

  // O caminho de volta e total: as tres gravam o identificador, a ausencia
  // grava `0`.
  assert.equal(colunaDoVinculo({ tipo: 'sem-pai' }), 0);
  assert.equal(colunaDoVinculo(vinculoDaLinha(TIPO_DE_ANEXO, 12)), 12);
  assert.equal(colunaDoVinculo(vinculoDaLinha('page', 12)), 12);
});

test('o vinculo da linha lida ja vem desambiguado', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);
  falsa.responder([
    linhaDeConteudo({ ID: 40, post_type: TIPO_DE_VERSAO, post_parent: 12 }),
  ]);

  const versao = armazenamento.conteudo.obterPorId(40);

  assert.deepEqual(versao?.vinculo, { tipo: 'original-da-versao', id: 12 });
});

test('os filhos de um tipo sao a consulta do legado, e a crua devolve so o ID', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);
  falsa.responder([
    linhaDeConteudo({ ID: 13, post_type: 'page', post_parent: 12 }),
  ]);

  const filhos = armazenamento.conteudo.listarFilhosDoTipo(12, 'page');

  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT * FROM wp_posts WHERE post_parent = ? AND post_type = ?',
  );
  assert.deepEqual(falsa.selecoes[0]?.parametros, [12, 'page']);
  assert.equal(filhos.length, 1);
  assert.deepEqual(filhos[0]?.vinculo, { tipo: 'pagina-mae', id: 12 });

  falsa.responder([{ ID: 40 }, { ID: 41 }]);
  const ids = armazenamento.conteudo.idsDeFilhosDoTipo(12, TIPO_DE_VERSAO);

  assert.equal(
    falsa.selecoes[1]?.texto,
    'SELECT ID FROM wp_posts WHERE post_parent = ? AND post_type = ?',
  );
  assert.deepEqual(falsa.selecoes[1]?.parametros, [12, TIPO_DE_VERSAO]);
  assert.deepEqual(ids, [40, 41]);
});

test('atualizar escreve so o que foi informado, e nada quando nada foi', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);

  const afetadas = armazenamento.conteudo.atualizar(12, {
    estado: 'publish',
    identificadorNaUrl: 'titulo-2',
  });

  assert.equal(afetadas, 1);
  assert.equal(
    falsa.escritas[0]?.texto,
    'UPDATE wp_posts SET post_status = ?, post_name = ? WHERE ID = ?',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, ['publish', 'titulo-2', 12]);

  // Campo nenhum informado: nenhum comando sai. E a mesma disciplina da regra
  // 2 de `metadado.ts` — ausencia de comando e afirmacao.
  assert.equal(armazenamento.conteudo.atualizar(12, {}), 0);
  assert.equal(falsa.escritas.length, 1);
});

test('apagar emite SO o `DELETE` da linha: a cascata e de quem apaga (P5)', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);

  armazenamento.conteudo.apagar(12);

  assert.equal(falsa.escritas.length, 1);
  assert.equal(falsa.escritas[0]?.texto, 'DELETE FROM wp_posts WHERE ID = ?');
  // Nenhum reparenteamento, nenhuma exclusao de versao, nenhum metadado: as
  // sete etapas de `EXT-EXCLUSAO` sao da feature 005, e e la que o P5 cobra
  // "o conjunto exato do que sumiu e do que permaneceu".
  assert.deepEqual(falsa.selecoes, []);
});

test('a versao e conteudo: os nove campos que o legado fixa, e nenhum autor', () => {
  const original: Conteudo = {
    id: 12,
    autorId: 3,
    data: '2026-10-08 09:00:00',
    dataGmt: '2026-10-08 12:00:00',
    corpo: 'Corpo novo.',
    titulo: 'Titulo novo',
    resumo: 'Resumo',
    estado: 'publish',
    estadoDeComentario: 'open',
    estadoDeNotificacao: 'open',
    senha: '',
    identificadorNaUrl: 'titulo',
    aPingar: '',
    pingados: '',
    modificadoEm: '2026-10-09 10:00:00',
    modificadoEmGmt: '2026-10-09 13:00:00',
    corpoFiltrado: '',
    vinculo: { tipo: 'sem-pai' },
    guid: '',
    ordemNoMenu: 0,
    tipo: 'post',
    tipoMime: '',
    contagemDeComentarios: 2,
  };

  const campos = camposDaVersao(original);

  // `_wp_post_revision_data()` (`wp-includes/revision.php:75` a `:95`).
  assert.deepEqual(campos, {
    titulo: 'Titulo novo',
    corpo: 'Corpo novo.',
    resumo: 'Resumo',
    vinculo: { tipo: 'original-da-versao', id: 12 },
    estado: 'inherit',
    tipo: 'revision',
    identificadorNaUrl: '12-revision-v1',
    // A data da versao e o `post_modified` do original, nao a hora corrente.
    data: '2026-10-09 10:00:00',
    dataGmt: '2026-10-09 13:00:00',
  });
  // O autor NAO esta entre os campos: ele e um dos nove que o legado se recusa
  // a versionar (`revision.php:57`), logo a versao fica com o autor de quem a
  // gravou — ver o cabecalho de `versao.ts`.
  assert.ok(!Object.keys(campos).includes('autorId'));
  assert.equal(
    camposDaVersao(original, true).identificadorNaUrl,
    '12-autosave-v1',
  );
});

test('o identificador na URL da versao: o mesmo para todas, e legivel de volta', () => {
  assert.equal(nomeDaVersao(12, false), '12-revision-v1');
  assert.equal(nomeDaVersao(12, true), '12-autosave-v1');

  // BR-MIGRAR-005 dispensa a unicidade do identificador em revisao, e e por
  // isso que as tres versoes de um conteudo tem o MESMO nome.
  assert.equal(nomeDaVersao(12, false), nomeDaVersao(12, false));

  assert.deepEqual(versaoDoNome('12-revision-v1'), {
    idDoOriginal: 12,
    autosave: false,
    sistemaDeVersionamento: 1,
  });
  assert.deepEqual(versaoDoNome('12-autosave-v1'), {
    idDoOriginal: 12,
    autosave: true,
    sistemaDeVersionamento: 1,
  });
  assert.equal(versaoDoNome('titulo'), null);
  assert.equal(versaoDoNome('12-revision'), null);
});

test('as versoes de um conteudo: os tres criterios e a ordem do legado', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);
  falsa.responder([
    linhaDeConteudo({
      ID: 41,
      post_type: TIPO_DE_VERSAO,
      post_status: 'inherit',
      post_parent: 12,
      post_name: '12-revision-v1',
    }),
  ]);

  const versoes = armazenamento.versoes.listar(12);

  // `wp_get_post_revisions()`: `post_parent`, `post_type`, `post_status`, e
  // `order => DESC` com `orderby => 'date ID'`
  // (`wp-includes/revision.php:666` a `:700`).
  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT * FROM wp_posts WHERE post_parent = ? AND post_type = ? ' +
      'AND post_status = ? ORDER BY post_date DESC, ID DESC',
  );
  assert.deepEqual(falsa.selecoes[0]?.parametros, [12, 'revision', 'inherit']);
  assert.equal(versoes[0]?.id, 41);
  assert.deepEqual(versoes[0]?.vinculo, { tipo: 'original-da-versao', id: 12 });

  falsa.responder([]);
  assert.equal(armazenamento.versoes.maisRecente(12), null);
  assert.ok(
    falsa.selecoes[1]?.texto.endsWith(
      'ORDER BY post_date DESC, ID DESC LIMIT 1',
    ),
  );
});

test('o metadado e lido pela cadeia do cache, na ordem de `meta_id`', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);
  falsa.responder([
    { post_id: 12, meta_key: '_edit_last', meta_value: '3' },
    { post_id: 12, meta_key: '_thumbnail_id', meta_value: '88' },
  ]);

  const linhas = armazenamento.metadados.listar(12);

  // `update_meta_cache()` (`wp-includes/meta.php:1204`): tres colunas, sem
  // `meta_id`, e `ORDER BY meta_id ASC`.
  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT post_id, meta_key, meta_value FROM wp_postmeta ' +
      'WHERE post_id IN (?) ORDER BY meta_id ASC',
  );
  assert.deepEqual(falsa.selecoes[0]?.parametros, [12]);
  assert.equal(linhas.length, 2);
  assert.equal(linhas[0]?.chave, '_edit_last');
});

test('os valores de uma chave saem da MESMA consulta, filtrados em memoria', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);
  falsa.responder([
    { post_id: 12, meta_key: 'cor', meta_value: 'azul' },
    { post_id: 12, meta_key: 'tamanho', meta_value: 'G' },
    { post_id: 12, meta_key: 'cor', meta_value: 'verde' },
  ]);

  const valores = armazenamento.metadados.valoresDe(12, 'cor');

  // Uma consulta, nao duas: `get_metadata_raw()` filtra a chave sobre o que o
  // cache carregou (`wp-includes/meta.php:684`). E a chave REPETE: a leitura
  // devolve lista, porque nada no esquema impede duas linhas iguais
  // (`DB-UNIQ`).
  assert.equal(falsa.selecoes.length, 1);
  assert.deepEqual(valores, ['azul', 'verde']);
});

test('acrescentar metadado sempre insere; com `unico`, pergunta antes', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);

  const id = armazenamento.metadados.acrescentar(12, 'cor', texto('azul'));

  assert.equal(id, 7);
  assert.equal(falsa.selecoes.length, 0);
  assert.equal(
    falsa.escritas[0]?.texto,
    'INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (?, ?, ?)',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, [12, 'cor', 'azul']);

  // Com `unico`, o legado pergunta `SELECT COUNT(*)` e NAO insere se ja houver
  // linha (`wp-includes/meta.php:97`).
  falsa.responder([{ 'COUNT(*)': 1 }]);
  assert.equal(
    armazenamento.metadados.acrescentar(12, 'cor', texto('verde'), true),
    0,
  );
  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT COUNT(*) FROM wp_postmeta WHERE meta_key = ? AND post_id = ?',
  );
  assert.equal(falsa.escritas.length, 1);

  // E insere quando a contagem volta zero.
  falsa.responder([{ 'COUNT(*)': 0 }]);
  assert.equal(
    armazenamento.metadados.acrescentar(12, 'cor', texto('verde'), true),
    7,
  );
  assert.equal(falsa.escritas.length, 2);
});

test('O ACHADO: gravar valor identico nao emite escrita nenhuma', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);
  falsa.responder([{ post_id: 12, meta_key: 'cor', meta_value: 'azul' }]);

  const resultado = armazenamento.metadados.gravar(12, 'cor', texto('azul'));

  // `update_metadata()` devolve `false` e nenhum comando de escrita sai
  // (`wp-includes/meta.php:255` a `:262`). Um porte que sempre escrevesse
  // mudaria o efeito no banco de toda requisicao que "salva sem mudar nada".
  assert.deepEqual(resultado, { gravou: false, acrescentadoComId: null });
  assert.deepEqual(falsa.escritas, []);
  assert.equal(falsa.selecoes.length, 1);
});

test('gravar valor diferente atualiza TODAS as linhas da chave', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);
  falsa.responder([{ post_id: 12, meta_key: 'cor', meta_value: 'azul' }]);
  falsa.responder([{ meta_id: 5 }]);

  const resultado = armazenamento.metadados.gravar(12, 'cor', texto('verde'));

  assert.deepEqual(resultado, { gravou: true, acrescentadoComId: null });
  assert.equal(
    falsa.selecoes[1]?.texto,
    'SELECT meta_id FROM wp_postmeta WHERE meta_key = ? AND post_id = ?',
  );
  assert.equal(
    falsa.escritas[0]?.texto,
    'UPDATE wp_postmeta SET meta_value = ? WHERE post_id = ? AND meta_key = ?',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, ['verde', 12, 'cor']);
});

test('gravar chave que nao existe vira insercao, e devolve o identificador', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);
  falsa.responder([]);
  falsa.responder([]);

  const resultado = armazenamento.metadados.gravar(12, 'cor', texto('azul'));

  assert.deepEqual(resultado, { gravou: true, acrescentadoComId: 7 });
  assert.equal(
    falsa.escritas[0]?.texto,
    'INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (?, ?, ?)',
  );
});

test('com valor anterior informado, a comparacao nao acontece e ele entra na condicao', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);
  falsa.responder([{ meta_id: 5 }]);

  const resultado = armazenamento.metadados.gravar(
    12,
    'cor',
    texto('azul'),
    texto('azul'),
  );

  // `if ( empty( $prev_value ) )` (`wp-includes/meta.php:256`): com valor
  // anterior, nem a leitura de comparacao sai — e a escrita acontece mesmo com
  // o valor identico.
  assert.deepEqual(resultado, { gravou: true, acrescentadoComId: null });
  assert.equal(falsa.selecoes.length, 1);
  assert.equal(
    falsa.escritas[0]?.texto,
    'UPDATE wp_postmeta SET meta_value = ? ' +
      'WHERE post_id = ? AND meta_key = ? AND meta_value = ?',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, ['azul', 12, 'cor', 'azul']);
});

test('arranjo vai serializado para a coluna, e volta arranjo', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);

  armazenamento.metadados.acrescentar(12, 'lista', lista([texto('b')]));

  assert.equal(
    textoDoParametro(falsa.escritas[0]?.parametros[2]),
    'a:1:{i:0;s:1:"b";}',
  );
  assert.deepEqual(valorDeMetadado('a:1:{i:0;s:1:"b";}'), lista([texto('b')]));
});

test('BR-MIGRAR-082: texto que PARECE serializado e serializado de novo', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);

  armazenamento.metadados.acrescentar(12, 'cru', texto('a:1:{i:0;s:1:"b";}'));

  // "gravar a string 'a:1:{i:0;s:1:"b";}' e le-la de volta devolve a string,
  // nao o array" — BR-MIGRAR-082 (`DB-SER`).
  const gravado = textoDoParametro(falsa.escritas[0]?.parametros[2]);
  assert.equal(gravado, 's:18:"a:1:{i:0;s:1:"b";}";');
  assert.deepEqual(valorDeMetadado(gravado), texto('a:1:{i:0;s:1:"b";}'));
});

test('a comparacao de valor identico e feita no VALOR, nao nos bytes da coluna', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);
  falsa.responder([
    { post_id: 12, meta_key: 'lista', meta_value: 'a:1:{i:0;s:1:"b";}' },
  ]);

  const mesmo: ValorPhp = lista([texto('b')]);
  const resultado = armazenamento.metadados.gravar(12, 'lista', mesmo);

  // O legado compara `$old_value[0] === $meta_value`, com o valor da coluna JA
  // desserializado e o novo ainda nao serializado (`wp-includes/meta.php:255` a
  // `:259`). Arranjo igual, nenhuma escrita.
  assert.deepEqual(resultado, { gravou: false, acrescentadoComId: null });
  assert.deepEqual(falsa.escritas, []);
});

test('o escalar vai para a coluna como o legado o coage', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);

  armazenamento.metadados.acrescentar(12, 'n', { tipo: 'inteiro', valor: 5 });
  armazenamento.metadados.acrescentar(12, 'v', {
    tipo: 'booleano',
    valor: true,
  });
  armazenamento.metadados.acrescentar(12, 'f', {
    tipo: 'booleano',
    valor: false,
  });
  armazenamento.metadados.acrescentar(12, 'z', { tipo: 'nulo' });

  assert.equal(falsa.escritas[0]?.parametros[2], 5);
  // `(string) true` e `'1'`, `(string) false` e `''`.
  assert.equal(falsa.escritas[1]?.parametros[2], '1');
  assert.equal(falsa.escritas[2]?.parametros[2], '');
  // Nulo e `NULL` de verdade: `_insert_replace_helper()` troca o formato do
  // campo por `'NULL'` (`wp-includes/class-wpdb.php:2601`).
  assert.equal(falsa.escritas[3]?.parametros[2], null);
});

test('apagar metadado le os identificadores e apaga por eles — ou nao apaga', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);
  falsa.responder([{ meta_id: 5 }, { meta_id: 9 }]);

  armazenamento.metadados.apagar(12, 'cor');

  // Dois comandos, nessa ordem (`wp-includes/meta.php:456` a `:514`).
  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT meta_id FROM wp_postmeta WHERE meta_key = ? AND post_id = ?',
  );
  assert.equal(
    falsa.escritas[0]?.texto,
    'DELETE FROM wp_postmeta WHERE meta_id IN( ?, ? )',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, [5, 9]);

  // E NENHUM comando de escrita quando a leitura nao devolve linha.
  falsa.responder([]);
  assert.equal(armazenamento.metadados.apagar(12, 'cor'), 0);
  assert.equal(falsa.escritas.length, 1);
});

test('apagar metadado com valor poe `meta_value` na leitura', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);
  falsa.responder([{ meta_id: 5 }]);

  armazenamento.metadados.apagar(12, 'cor', texto('azul'));

  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT meta_id FROM wp_postmeta ' +
      'WHERE meta_key = ? AND post_id = ? AND meta_value = ?',
  );
  assert.deepEqual(falsa.selecoes[0]?.parametros, ['cor', 12, 'azul']);
});

test('a exclusao por linha e um par: ler a linha, depois apagar (um a um)', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);
  falsa.responder([{ meta_id: 5 }, { meta_id: 9 }]);

  const ids = armazenamento.metadados.idsDeMetadados(12);

  // A consulta que `wp_delete_post()` faz, com o espaco final que o legado
  // tem (`wp-includes/post.php:3937`).
  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT meta_id FROM wp_postmeta WHERE post_id = ? ',
  );
  assert.deepEqual(ids, [5, 9]);

  falsa.responder([
    { meta_id: 5, post_id: 12, meta_key: 'cor', meta_value: 'azul' },
  ]);
  const linha = armazenamento.metadados.obterPorId(5);
  assert.equal(
    falsa.selecoes[1]?.texto,
    'SELECT * FROM wp_postmeta WHERE meta_id = ?',
  );
  assert.equal(linha?.id, 5);
  assert.equal(linha?.chave, 'cor');

  armazenamento.metadados.apagarPorId(5);
  assert.equal(
    falsa.escritas[0]?.texto,
    'DELETE FROM wp_postmeta WHERE meta_id = ?',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, [5]);
});

test('duas composicoes de sites diferentes nao se enxergam (EXT-CONTEXTO)', () => {
  const primeira = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_' });
  const segunda = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_2_' });

  const aqui = criarArmazenamentoDeConteudo(primeira.porta);
  const ali = criarArmazenamentoDeConteudo(segunda.porta);

  aqui.conteudo.inserir(CONTEUDO);
  ali.conteudo.inserir(CONTEUDO);

  // `posts` e `postmeta` sao de ESCOPO POR SITE: numa rede, o identificador do
  // site esta no NOME da tabela (`target_data_model.md`). Estado de modulo aqui
  // gravaria o conteudo de um site na tabela do outro.
  assert.ok(primeira.escritas[0]?.texto.startsWith('INSERT INTO wp_posts ('));
  assert.ok(segunda.escritas[0]?.texto.startsWith('INSERT INTO wp_2_posts ('));
  assert.equal(primeira.escritas.length, 1);
  assert.equal(segunda.escritas.length, 1);
});

test('o armazenamento nao recusa estado nem tipo fora do vocabulario (DB-ENUM)', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeConteudo(falsa.porta);

  // Estado e tipo registrados por extensao: `register_post_status()` e
  // `register_post_type()` sao pontos de extensao publicos (P2), a coluna e
  // `varchar(20)` sem `ENUM` e sem `CHECK` (`DB-ENUM`), e o legado TOLERA o
  // nao registrado em vez de recusar. Um guarda aqui quebraria todo estado de
  // terceiro.
  armazenamento.conteudo.inserir({
    ...CONTEUDO,
    estado: 'em-revisao-editorial',
    tipo: 'produto',
  });

  assert.equal(falsa.escritas[0]?.parametros[7], 'em-revisao-editorial');
  assert.equal(falsa.escritas[0]?.parametros[8], 'produto');
});
