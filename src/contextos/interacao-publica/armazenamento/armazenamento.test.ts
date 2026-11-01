/**
 * Testes da entrega de T002: *"a estrutura de comentario existe com o
 * vocabulario de estado e de tipo do legado, a auto-referencia que encadeia
 * respostas e o vinculo opcional com conta, e e lida e gravada pela porta de
 * dados"*.
 *
 * O que estes testes afirmam, e por que e assim que se afirma: o criterio de
 * paridade desta area e *"efeito no banco"* (Decisao 2 de `parity_specs.md`,
 * area 3), e o que o documento manda comparar e *"snapshot + sequencia de
 * comandos"*. Por isso a porta falsa **registra consulta** em vez de simular
 * banco: o que se afirma e qual comando saiu, com quais parametros, em que ordem
 * — inclusive os tres casos em que o legado **nao emite comando nenhum**.
 *
 * Nao sao os testes de nenhuma historia. Esses sao T005, T007, T009 e os demais
 * `[P]` de `tasks.md`, um por caso de `backlog/tests.md`. Aqui nao ha decisao de
 * moderacao, nem recusa, nem contagem: T002 nao implementa regra.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  arranjoPorNome,
  inteiro,
  texto,
  NULO,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import {
  campoDaColuna,
  criarArmazenamentoDeInteracao,
  eAnonimo,
  eDePrimeiroNivel,
  lerComentario,
  tipoNormalizado,
  valorDeMetadado,
  valorEntraNaClausula,
  vazioComoNoPhp,
  CHAVES_DO_DESCARTE,
  COLUNAS_DA_ATUALIZACAO,
  COLUNAS_DA_INSERCAO,
  DATA_SENTINELA,
  ESTADO_ALCANCAVEL_PELA_API_DE_ESTADO,
  ESTADO_CONTEUDO_NA_LIXEIRA,
  ESTADOS_DO_COMENTARIO,
  SEM_CONTA,
  SEM_RESPOSTA,
  TIPOS_DE_COMENTARIO,
  type ComentarioGravavel,
} from './index.js';
import { criarPortaDeDadosFalsa, textoDoParametro } from './porta-falsa.js';

/** Um comentario gravavel com as 14 colunas, todas distinguiveis no comando. */
function gravavel(
  sobrepor: Partial<ComentarioGravavel> = {},
): ComentarioGravavel {
  return {
    conteudoId: 11,
    autor: 'Visitante',
    autorEmail: 'visitante@exemplo.invalido',
    autorUrl: 'https://exemplo.invalido/',
    autorIp: '203.0.113.7',
    data: '2026-10-11 12:00:00',
    dataGmt: '2026-10-11 15:00:00',
    texto: 'Primeiro.',
    karma: 0,
    estado: '1',
    agente: 'Mozilla/5.0',
    tipo: 'comment',
    paiId: SEM_RESPOSTA,
    contaId: SEM_CONTA,
    ...sobrepor,
  };
}

/** Uma linha de `comments` como o driver a devolveria, com as 15 colunas. */
function linhaDeComentario(sobrepor: Record<string, unknown> = {}) {
  return {
    comment_ID: '42',
    comment_post_ID: '11',
    comment_author: 'Visitante',
    comment_author_email: 'visitante@exemplo.invalido',
    comment_author_url: 'https://exemplo.invalido/',
    comment_author_IP: '203.0.113.7',
    comment_date: '2026-10-11 12:00:00',
    comment_date_gmt: '2026-10-11 15:00:00',
    comment_content: 'Primeiro.',
    comment_karma: '0',
    comment_approved: '1',
    comment_agent: 'Mozilla/5.0',
    comment_type: 'comment',
    comment_parent: '0',
    user_id: '0',
    ...sobrepor,
  } as Record<string, string>;
}

function armazenamento(prefixo = 'wp_') {
  const falsa = criarPortaDeDadosFalsa({ prefixoDeTabela: prefixo });
  return { ...criarArmazenamentoDeInteracao(falsa.porta), falsa };
}

/* ─── o vocabulario de estado e de tipo ─────────────────────────────────── */

test('o vocabulario de estado tem os cinco valores do legado, e so eles', () => {
  // `state-machines.md` §2: uma coluna que e booleano e maquina de estados ao
  // mesmo tempo. O `plan.md` exige os cinco: "o modelo novo precisa dos cinco
  // valores, porque o ultimo e o que permite restaurar o conteudo".
  assert.deepEqual(ESTADOS_DO_COMENTARIO, [
    '1',
    '0',
    'spam',
    'trash',
    'post-trashed',
  ]);
});

test('um estado nao e alcancavel pela interface de estado: post-trashed (CA-10.2)', () => {
  // `wp_set_comment_status()` aceita quatro e devolve `false` para qualquer
  // outra coisa (`comment.php:2814`). `post-trashed` so e gravado pela cascata
  // de lixeira do conteudo, e `''` nao existe no vocabulario.
  assert.deepEqual(ESTADO_ALCANCAVEL_PELA_API_DE_ESTADO, [
    '0',
    '1',
    'spam',
    'trash',
  ]);
  assert.equal(
    ESTADO_ALCANCAVEL_PELA_API_DE_ESTADO.includes(ESTADO_CONTEUDO_NA_LIXEIRA),
    false,
  );
  assert.equal(ESTADOS_DO_COMENTARIO.includes(ESTADO_CONTEUDO_NA_LIXEIRA), true);
});

test('o vocabulario de tipo tem os quatro do nucleo, inclusive a nota editorial', () => {
  // UC-18: "a tabela de comentarios ganhou um uso que nao e comentario... quem
  // migrar modelando comentario como interacao publica perde esta
  // funcionalidade inteira".
  assert.deepEqual(TIPOS_DE_COMENTARIO, [
    'comment',
    'pingback',
    'trackback',
    'note',
  ]);
});

test('o tipo vazio e normalizado na LEITURA, e o dado gravado nao muda', () => {
  // `get_comment_type()` (`comment-template.php:1161`): comentario gravado
  // antes da versao 5.5 pode ter o tipo vazio, e o legado nao conserta o dado.
  assert.equal(tipoNormalizado(''), 'comment');
  assert.equal(tipoNormalizado('pingback'), 'pingback');
  // Tipo de extensao atravessa sem toque: o registro e aberto (P2).
  assert.equal(tipoNormalizado('tipo-de-extensao'), 'tipo-de-extensao');

  // E a linha continua com o byte da coluna: quem le decide normalizar.
  const linha = linhaDeComentario({ comment_type: '' });
  assert.equal(lerComentario(linha).tipo, '');
});

test('a sentinela de data e lida como esta, sem virar ausencia', () => {
  const comentario = lerComentario(
    linhaDeComentario({
      comment_date: DATA_SENTINELA,
      comment_date_gmt: DATA_SENTINELA,
    }),
  );

  assert.equal(comentario.data, '0000-00-00 00:00:00');
  assert.equal(comentario.dataGmt, '0000-00-00 00:00:00');
});

/* ─── a linha, o vinculo com conta e a auto-referencia ──────────────────── */

test('a linha e lida nas 15 colunas, com os cinco inteiros convertidos', () => {
  const comentario = lerComentario(
    linhaDeComentario({ comment_parent: '7', user_id: '3' }),
  );

  assert.deepEqual(comentario, {
    id: 42,
    conteudoId: 11,
    autor: 'Visitante',
    autorEmail: 'visitante@exemplo.invalido',
    autorUrl: 'https://exemplo.invalido/',
    autorIp: '203.0.113.7',
    data: '2026-10-11 12:00:00',
    dataGmt: '2026-10-11 15:00:00',
    texto: 'Primeiro.',
    karma: 0,
    estado: '1',
    agente: 'Mozilla/5.0',
    tipo: 'comment',
    paiId: 7,
    contaId: 3,
  });
});

test('o estado fora do vocabulario e lido como qualquer outro (DB-DEG, DB-ENUM)', () => {
  // Nenhum `ENUM`, nenhum `CHECK`, e o legado tolera em vez de recusar: uma
  // linha gravada por extensao com estado proprio continua legivel.
  const comentario = lerComentario(
    linhaDeComentario({ comment_approved: 'em-revisao-pela-extensao' }),
  );

  assert.equal(comentario.estado, 'em-revisao-pela-extensao');
});

test('o vinculo com conta e opcional: zero e anonimo legitimo, nao erro', () => {
  // `target_data_model.md` § Relacoes: "`0` e anonimo legitimo", e "orfao e
  // estado normal". CA-1.1: "comentario sem conta e gravado com autoria
  // anonima legitima, e nao como erro".
  assert.equal(SEM_CONTA, 0);
  assert.equal(eAnonimo(lerComentario(linhaDeComentario()).contaId), true);
  assert.equal(
    eAnonimo(lerComentario(linhaDeComentario({ user_id: '3' })).contaId),
    false,
  );

  // E anonimo nao quer dizer sem nome: o par nome/e-mail fica na propria linha,
  // e e ele que `C7` usa para reconhecer o autor ja aprovado.
  const anonimo = lerComentario(linhaDeComentario());
  assert.equal(anonimo.autor, 'Visitante');
  assert.equal(anonimo.autorEmail, 'visitante@exemplo.invalido');
});

test('a conta apagada deixa o vinculo apontando para ela: orfao e estado normal', () => {
  // Cenario `@invariante` de `PT-001`: "apagar a conta nao apaga comentario... o
  // vinculo com a conta apagada fica no mesmo estado nas duas". Nenhum metodo
  // deste armazenamento confere a existencia da conta, e por isso ler uma linha
  // orfa e indistinguivel de ler qualquer outra.
  const orfao = lerComentario(linhaDeComentario({ user_id: '999' }));

  assert.equal(orfao.contaId, 999);
  assert.equal(eAnonimo(orfao.contaId), false);
});

test('a auto-referencia: zero e primeiro nivel, e nao ha pai nulo no banco', () => {
  // "Ausencia de vinculo e escrita como `0`", e a consequencia que o documento
  // tira: "um LEFT JOIN ... WHERE pai IS NULL nao encontra orfao nenhum".
  assert.equal(SEM_RESPOSTA, 0);
  assert.equal(eDePrimeiroNivel(0), true);
  assert.equal(eDePrimeiroNivel(7), false);
});

/* ─── a insercao ────────────────────────────────────────────────────────── */

test('a insercao escreve 14 colunas na ordem do legado, com o IP na SEGUNDA', () => {
  const { comentarios, falsa } = armazenamento();

  const id = comentarios.inserir(gravavel());

  assert.equal(falsa.escritas.length, 1);
  assert.equal(
    falsa.escritas[0]?.texto,
    'INSERT INTO wp_comments (comment_post_ID, comment_author_IP, ' +
      'comment_author, comment_author_email, comment_author_url, comment_date, ' +
      'comment_date_gmt, comment_content, comment_karma, comment_approved, ' +
      'comment_agent, comment_type, comment_parent, user_id) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, [
    11,
    '203.0.113.7',
    'Visitante',
    'visitante@exemplo.invalido',
    'https://exemplo.invalido/',
    '2026-10-11 12:00:00',
    '2026-10-11 15:00:00',
    'Primeiro.',
    0,
    '1',
    'Mozilla/5.0',
    'comment',
    0,
    0,
  ]);
  // O identificador vem do banco: nao ha equivalente do `import_id` de `posts`.
  assert.equal(id, 7);
});

test('`comment_ID` nao entra na insercao nem na atualizacao', () => {
  const colunas = [
    ...COLUNAS_DA_INSERCAO.map(([, coluna]) => coluna),
    ...COLUNAS_DA_ATUALIZACAO.map(([, coluna]) => coluna),
  ];

  assert.equal(colunas.includes('comment_ID'), false);
  assert.equal(COLUNAS_DA_INSERCAO.length, 14);
  assert.equal(COLUNAS_DA_ATUALIZACAO.length, 14);
});

test('`comment_karma` e escrita, sempre, e isso e o que DB-DEAD diz', () => {
  const { comentarios, falsa } = armazenamento();

  comentarios.inserir(gravavel());

  // BR-MIGRAR-086: o nucleo "nunca escreve nada alem de `0`" — e escrever zero
  // e escrever. A coluna esta nas duas listas do legado (`comment.php:2191` e
  // `:2973`), e tirar a coluna do comando mudaria o comando.
  assert.ok(falsa.escritas[0]?.texto.includes('comment_karma'));
  assert.equal(falsa.escritas[0]?.parametros[8], 0);
});

test('as duas listas de coluna tem o mesmo conteudo em ordens diferentes', () => {
  const daInsercao = COLUNAS_DA_INSERCAO.map(([, coluna]) => coluna);
  const daAtualizacao = COLUNAS_DA_ATUALIZACAO.map(([, coluna]) => coluna);

  assert.deepEqual([...daInsercao].sort(), [...daAtualizacao].sort());
  // E nao sao a mesma ordem: o IP e a segunda na insercao e a quinta na
  // atualizacao, porque o legado monta as duas de formas diferentes.
  assert.notDeepEqual(daInsercao, daAtualizacao);
  assert.equal(daInsercao[1], 'comment_author_IP');
  assert.equal(daAtualizacao[4], 'comment_author_IP');
});

test('a traducao de nome de coluna para campo serve o ponto de extensao', () => {
  // `wp_update_comment_data` fala por nome de coluna, e uma extensao que troque
  // `$data['comment_approved']` muda o que vai gravado (P2).
  assert.equal(campoDaColuna('comment_approved'), 'estado');
  assert.equal(campoDaColuna('comment_author_IP'), 'autorIp');
  assert.equal(campoDaColuna('user_id'), 'contaId');
  assert.equal(campoDaColuna('comment_parent'), 'paiId');
  // `comment_ID` nao e gravavel.
  assert.equal(campoDaColuna('comment_ID'), null);
  assert.equal(campoDaColuna('coluna_de_extensao'), null);
});

test('a gravacao nao valida nada: estado, tipo e tamanho passam como vieram', () => {
  const { comentarios, falsa } = armazenamento();

  comentarios.inserir(
    gravavel({
      estado: 'estado-que-ninguem-registrou',
      tipo: '',
      autor: 'x'.repeat(400),
      conteudoId: 0,
      paiId: 999999,
      contaId: 999999,
    }),
  );

  // DB-DEG (BR-MIGRAR-083): "escrita invalida nao falha, ela se degrada". A
  // recusa do campo longo e `C10` e e T012, do lado da aplicacao; a existencia
  // do conteudo, do pai e da conta nao e cobrada em lugar nenhum do esquema.
  assert.equal(falsa.escritas.length, 1);
  assert.equal(falsa.escritas[0]?.parametros[9], 'estado-que-ninguem-registrou');
  assert.equal(falsa.escritas[0]?.parametros[11], '');
  assert.equal(textoDoParametro(falsa.escritas[0]?.parametros[2]).length, 400);
});

/* ─── a atualizacao ─────────────────────────────────────────────────────── */

test('a atualizacao com as 14 colunas sai na ordem de `wp_update_comment()`', () => {
  const { comentarios, falsa } = armazenamento();

  const afetadas = comentarios.atualizar(42, gravavel());

  assert.equal(
    falsa.escritas[0]?.texto,
    'UPDATE wp_comments SET comment_post_ID = ?, comment_author = ?, ' +
      'comment_author_email = ?, comment_author_url = ?, comment_author_IP = ?, ' +
      'comment_date = ?, comment_date_gmt = ?, comment_content = ?, ' +
      'comment_karma = ?, comment_approved = ?, comment_agent = ?, ' +
      'comment_type = ?, comment_parent = ?, user_id = ? WHERE comment_ID = ?',
  );
  assert.equal(falsa.escritas[0]?.parametros.at(-1), 42);
  assert.equal(afetadas, 1);
});

test('informar so o estado produz a cadeia de `wp_set_comment_status()`', () => {
  const { comentarios, falsa } = armazenamento();

  comentarios.atualizar(42, { estado: 'trash' });

  // `comment.php:2820` manda uma coluna so. E por isso que nao existe aqui um
  // `atualizarEstado`: ele emitiria exatamente esta cadeia com outro nome.
  assert.equal(
    falsa.escritas[0]?.texto,
    'UPDATE wp_comments SET comment_approved = ? WHERE comment_ID = ?',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, ['trash', 42]);
});

test('atualizacao sem campo nenhum nao emite comando', () => {
  const { comentarios, falsa } = armazenamento();

  const afetadas = comentarios.atualizar(42, {});

  assert.deepEqual(falsa.escritas, []);
  assert.equal(afetadas, 0);
});

test('editar o texto nao toca no estado (CA-10.4)', () => {
  const { comentarios, falsa } = armazenamento();

  comentarios.atualizar(42, { texto: 'Corrigido.' });

  assert.equal(
    falsa.escritas[0]?.texto,
    'UPDATE wp_comments SET comment_content = ? WHERE comment_ID = ?',
  );
  assert.equal(falsa.escritas[0]?.texto.includes('comment_approved'), false);
});

/* ─── a leitura por identificador ───────────────────────────────────────── */

test('a leitura por identificador e `SELECT *`, com LIMIT 1', () => {
  const { comentarios, falsa } = armazenamento('wp_2_');
  falsa.responder([linhaDeComentario()]);

  const comentario = comentarios.obterPorId(42);

  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT * FROM wp_2_comments WHERE comment_ID = ? LIMIT 1',
  );
  assert.deepEqual(falsa.selecoes[0]?.parametros, [42]);
  assert.equal(comentario?.id, 42);
});

test('a leitura de comentario inexistente devolve nulo, sem lancar', () => {
  const { comentarios } = armazenamento();

  assert.equal(comentarios.obterPorId(999), null);
});

/* ─── a cascata da auto-referencia ──────────────────────────────────────── */

test('apagar le as respostas diretas antes, num comando separado', () => {
  const { comentarios, falsa } = armazenamento();
  falsa.responder([{ comment_ID: '43' }, { comment_ID: '44' }]);

  const ids = comentarios.idsDeRespostasDiretas(42);

  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT comment_ID FROM wp_comments WHERE comment_parent = ?',
  );
  assert.deepEqual(falsa.selecoes[0]?.parametros, [42]);
  assert.deepEqual(ids, [43, 44]);
});

test('sem respostas, a lista vazia e a resposta — e o UPDATE nao sai', () => {
  const { comentarios, falsa } = armazenamento();

  // `comment.php:1591`: `if ( ! empty( $children ) )`. Quem decide chamar o
  // reparenteamento e o fluxo que apaga, e a condicao e esta lista.
  assert.deepEqual(comentarios.idsDeRespostasDiretas(42), []);
  assert.deepEqual(falsa.escritas, []);
});

test('reparentear sobe as respostas um nivel, num comando so para a ninhada', () => {
  const { comentarios, falsa } = armazenamento();

  // `comment.php:1592`: o novo pai e o pai do comentario que sai — o avo.
  const afetadas = comentarios.reparentearRespostas(42, 7);

  assert.equal(falsa.escritas.length, 1);
  assert.equal(
    falsa.escritas[0]?.texto,
    'UPDATE wp_comments SET comment_parent = ? WHERE comment_parent = ?',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, [7, 42]);
  assert.equal(afetadas, 1);
});

test('apagar um comentario de primeiro nivel sobe as respostas para a raiz', () => {
  const { comentarios, falsa } = armazenamento();

  // O avo de um comentario de primeiro nivel e `SEM_RESPOSTA`: as respostas
  // viram de primeiro nivel, e NAO sao apagadas. Um `ON DELETE CASCADE` as
  // apagaria, e e esse o primeiro dos tres motivos pelos quais a integridade
  // referencial esta desativada no legado.
  comentarios.reparentearRespostas(42, SEM_RESPOSTA);

  assert.deepEqual(falsa.escritas[0]?.parametros, [0, 42]);
});

test('apagar e so a linha: nenhuma cascata nasce no repositorio', () => {
  const { comentarios, falsa } = armazenamento();

  const afetadas = comentarios.apagar(42);

  assert.equal(falsa.escritas.length, 1);
  assert.equal(
    falsa.escritas[0]?.texto,
    'DELETE FROM wp_comments WHERE comment_ID = ?',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, [42]);
  assert.equal(afetadas, 1);
  // Nenhuma leitura: a sequencia de quatro passos da exclusao e de quem apaga.
  assert.deepEqual(falsa.selecoes, []);
});

/* ─── o metadado ────────────────────────────────────────────────────────── */

test('o metadado e carregado em lote, na ordem de meta_id', () => {
  const { metadados, falsa } = armazenamento();
  falsa.responder([
    { comment_id: '42', meta_key: 'a', meta_value: 'um' },
    { comment_id: '42', meta_key: 'a', meta_value: 'dois' },
  ]);

  const linhas = metadados.listar(42);

  // A cadeia de `update_meta_cache()` (`meta.php:1204`), com marcador de
  // parametro em lugar da concatenacao de inteiros que REQ-164 proibe.
  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT comment_id, meta_key, meta_value FROM wp_commentmeta ' +
      'WHERE comment_id IN (?) ORDER BY meta_id ASC',
  );
  // A chave aceita repeticao: a leitura devolve LISTA, nao valor.
  assert.equal(linhas.length, 2);
  assert.deepEqual(
    linhas.map((linha) => linha.valor),
    ['um', 'dois'],
  );
});

test('os valores de uma chave sao filtrados em memoria: uma consulta, nao duas', () => {
  const { metadados, falsa } = armazenamento();
  falsa.responder([
    { comment_id: '42', meta_key: 'outra', meta_value: 'x' },
    { comment_id: '42', meta_key: CHAVES_DO_DESCARTE.estadoAnterior, meta_value: '1' },
  ]);

  const valores = metadados.valoresDe(42, CHAVES_DO_DESCARTE.estadoAnterior);

  assert.equal(falsa.selecoes.length, 1);
  assert.deepEqual(valores, ['1']);
});

test('acrescentar sempre insere, e com `unico` pergunta antes', () => {
  const { metadados, falsa } = armazenamento();

  metadados.acrescentar(42, 'chave', texto('valor'));

  assert.equal(falsa.selecoes.length, 0);
  assert.equal(
    falsa.escritas[0]?.texto,
    'INSERT INTO wp_commentmeta (comment_id, meta_key, meta_value) VALUES (?, ?, ?)',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, [42, 'chave', 'valor']);
});

test('com `unico` e chave ja presente, nada e inserido (`meta.php:97`)', () => {
  const { metadados, falsa } = armazenamento();
  falsa.responder([{ 'COUNT(*)': '1' }]);

  const id = metadados.acrescentar(42, 'chave', texto('valor'), true);

  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT COUNT(*) FROM wp_commentmeta WHERE meta_key = ? AND comment_id = ?',
  );
  assert.deepEqual(falsa.escritas, []);
  assert.equal(id, 0);
});

test('gravar valor identico NAO emite escrita (`meta.php:255` a `:263`)', () => {
  const { metadados, falsa } = armazenamento();
  falsa.responder([{ comment_id: '42', meta_key: 'chave', meta_value: 'igual' }]);

  const resultado = metadados.gravar(42, 'chave', texto('igual'));

  assert.deepEqual(resultado, { gravou: false, acrescentadoComId: null });
  assert.deepEqual(falsa.escritas, []);
});

test('gravar chave inexistente delega para a insercao', () => {
  const { metadados, falsa } = armazenamento();
  falsa.responder([]); // a leitura em lote nao acha nada
  falsa.responder([]); // nem a consulta de meta_id

  const resultado = metadados.gravar(42, 'chave', inteiro(3));

  assert.equal(falsa.escritas.length, 1);
  assert.ok(falsa.escritas[0]?.texto.startsWith('INSERT INTO wp_commentmeta'));
  assert.deepEqual(resultado, { gravou: true, acrescentadoComId: 7 });
});

test('gravar com valor anterior leva `meta_value` na condicao', () => {
  const { metadados, falsa } = armazenamento();
  falsa.responder([{ meta_id: '5' }]);

  metadados.gravar(42, 'chave', texto('novo'), texto('antigo'));

  // Com valor anterior NAO vazio, a comparacao de valor identico nao acontece:
  // a primeira consulta e a de `meta_id`, nao a leitura em lote.
  assert.equal(falsa.selecoes.length, 1);
  assert.equal(
    falsa.escritas[0]?.texto,
    'UPDATE wp_commentmeta SET meta_value = ? WHERE comment_id = ? AND meta_key = ? AND meta_value = ?',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, [
    'novo',
    42,
    'chave',
    'antigo',
  ]);
});

test("valor anterior `'0'` e VAZIO no PHP, e por isso nao filtra nada", () => {
  const { metadados, falsa } = armazenamento();
  falsa.responder([{ comment_id: '42', meta_key: 'chave', meta_value: 'outro' }]);
  falsa.responder([{ meta_id: '5' }]);

  metadados.gravar(42, 'chave', texto('novo'), texto('0'));

  // `empty( '0' )` e verdadeiro (`meta.php:256`), logo a comparacao de valor
  // identico VOLTA a acontecer — duas consultas, nao uma — e o `UPDATE` sai
  // SEM a clausula de `meta_value`. E a diferenca entre reproduzir `empty()` e
  // testar "o argumento chegou".
  assert.equal(falsa.selecoes.length, 2);
  assert.equal(
    falsa.escritas[0]?.texto,
    'UPDATE wp_commentmeta SET meta_value = ? WHERE comment_id = ? AND meta_key = ?',
  );
});

test('apagar le os identificadores e so entao apaga, por eles', () => {
  const { metadados, falsa } = armazenamento();
  falsa.responder([{ meta_id: '5' }, { meta_id: '6' }]);

  const apagadas = metadados.apagar(42, 'chave');

  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT meta_id FROM wp_commentmeta WHERE meta_key = ? AND comment_id = ?',
  );
  assert.equal(
    falsa.escritas[0]?.texto,
    'DELETE FROM wp_commentmeta WHERE meta_id IN( ?, ? )',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, [5, 6]);
  assert.equal(apagadas, 1);
});

test('apagar o que nao existe NAO emite o DELETE', () => {
  const { metadados, falsa } = armazenamento();

  const apagadas = metadados.apagar(42, 'chave');

  assert.equal(falsa.selecoes.length, 1);
  assert.deepEqual(falsa.escritas, []);
  assert.equal(apagadas, 0);
});

test('apagar com texto vazio emite a MESMA consulta que apagar sem valor', () => {
  const comValor = armazenamento();
  const semValor = armazenamento();

  comValor.metadados.apagar(42, 'chave', texto(''));
  semValor.metadados.apagar(42, 'chave');

  // `delete_comment_meta()` declara `$meta_value = ''` por default
  // (`comment.php:552`) e `delete_metadata()` testa tres valores antes de
  // acrescentar a clausula (`meta.php:462`).
  assert.deepEqual(comValor.falsa.selecoes, semValor.falsa.selecoes);
  assert.equal(
    comValor.falsa.selecoes[0]?.texto.includes('meta_value'),
    false,
  );
});

test("apagar com `'0'` ENTRA na clausula, ao contrario do texto vazio", () => {
  const { metadados, falsa } = armazenamento();

  metadados.apagar(42, 'chave', texto('0'));

  // O teste do legado e `!==` contra `''`, `null` e `false`: `'0'` passa. E o
  // ponto em que este teste e `empty()` divergem.
  assert.ok(falsa.selecoes[0]?.texto.endsWith('AND meta_value = ?'));
  assert.deepEqual(falsa.selecoes[0]?.parametros, ['chave', 42, '0']);
});

test('os dois testes do PHP divergem em quatro valores, e os dois sao do legado', () => {
  const casos: readonly (readonly [string, ValorPhp, boolean, boolean])[] = [
    // valor, `empty()`, entra na clausula
    ['nulo', NULO, true, false],
    ['texto vazio', texto(''), true, false],
    ["texto '0'", texto('0'), true, true],
    ['inteiro 0', inteiro(0), true, true],
    ['inteiro 1', inteiro(1), false, true],
    ['texto comum', texto('x'), false, true],
  ];

  for (const [nome, valor, vazio, naClausula] of casos) {
    assert.equal(vazioComoNoPhp(valor), vazio, `${nome}: empty()`);
    assert.equal(valorEntraNaClausula(valor), naClausula, `${nome}: clausula`);
  }
});

test('a leitura por identificador de metadado traz as quatro colunas', () => {
  const { metadados, falsa } = armazenamento();
  falsa.responder([
    { meta_id: '5', comment_id: '42', meta_key: 'chave', meta_value: 'v' },
  ]);

  const metadado = metadados.obterPorId(5);

  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT * FROM wp_commentmeta WHERE meta_id = ?',
  );
  assert.deepEqual(metadado, {
    id: 5,
    comentarioId: 42,
    chave: 'chave',
    valor: 'v',
  });
});

test('os identificadores de metadado de um comentario, para a exclusao', () => {
  const { metadados, falsa } = armazenamento();
  falsa.responder([{ meta_id: '5' }, { meta_id: '6' }]);

  const ids = metadados.idsDeMetadados(42);

  // `comment.php:1597`: a consulta que `wp_delete_comment()` faz antes de
  // apagar uma linha por vez.
  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT meta_id FROM wp_commentmeta WHERE comment_id = ?',
  );
  assert.deepEqual(ids, [5, 6]);
});

test('apagar metadado por identificador e um comando so', () => {
  const { metadados, falsa } = armazenamento();

  metadados.apagarPorId(5);

  assert.equal(
    falsa.escritas[0]?.texto,
    'DELETE FROM wp_commentmeta WHERE meta_id = ?',
  );
});

test('o valor nao escalar e serializado na escrita, e o texto serializado DE NOVO', () => {
  const { metadados, falsa } = armazenamento();

  metadados.acrescentar(
    42,
    'estrutura',
    arranjoPorNome([['a', texto('b')]]),
  );
  metadados.acrescentar(42, 'texto', texto('a:1:{s:1:"a";s:1:"b";}'));

  // DB-SER (BR-MIGRAR-082): "gravar a string `a:1:{i:0;s:1:"b";}` e le-la de
  // volta devolve a string, nao o array". A dupla serializacao e observavel.
  assert.equal(
    textoDoParametro(falsa.escritas[0]?.parametros[2]),
    'a:1:{s:1:"a";s:1:"b";}',
  );
  assert.equal(
    textoDoParametro(falsa.escritas[1]?.parametros[2]),
    's:22:"a:1:{s:1:"a";s:1:"b";}";',
  );
});

test('o valor nulo vai para a coluna como NULL de verdade', () => {
  const { metadados, falsa } = armazenamento();

  metadados.acrescentar(42, 'chave', NULO);

  // `meta_value` e a unica coluna anulavel da familia, e
  // `_insert_replace_helper()` troca o formato por `'NULL'` quando o valor e
  // nulo (`class-wpdb.php:2602`).
  assert.equal(falsa.escritas[0]?.parametros[2], null);
  assert.deepEqual(valorDeMetadado(null), { tipo: 'nulo' });
});

test('as duas chaves do descarte sao as do legado', () => {
  // CA-11.1: "o descarte guarda o estado anterior e o instante, junto do
  // comentario" (`comment.php:1691` e `:1692`).
  assert.deepEqual(CHAVES_DO_DESCARTE, {
    estadoAnterior: '_wp_trash_meta_status',
    instante: '_wp_trash_meta_time',
  });
});

/* ─── as invariantes de arquitetura ─────────────────────────────────────── */

test('compor o armazenamento nao emite comando nenhum (EXT-ORDEM)', () => {
  const falsa = criarPortaDeDadosFalsa();

  criarArmazenamentoDeInteracao(falsa.porta);

  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('dois armazenamentos de sites diferentes nao se enxergam (EXT-CONTEXTO)', () => {
  const primeiro = armazenamento('wp_');
  const segundo = armazenamento('wp_2_');

  primeiro.comentarios.inserir(gravavel());

  assert.equal(primeiro.falsa.escritas.length, 1);
  assert.equal(segundo.falsa.escritas.length, 0);
  assert.ok(primeiro.falsa.escritas[0]?.texto.includes('wp_comments'));

  segundo.comentarios.inserir(gravavel());
  assert.ok(segundo.falsa.escritas[0]?.texto.includes('wp_2_comments'));
});

test('nenhuma consulta e montada por concatenacao de valor (REQ-164)', () => {
  const { comentarios, metadados, falsa } = armazenamento();
  falsa.responder([{ meta_id: '5' }]);

  comentarios.inserir(gravavel({ autor: "Robert'); DROP TABLE --" }));
  comentarios.atualizar(42, { texto: "'; DELETE --" });
  metadados.apagar(42, "'; DELETE --");

  for (const consulta of [...falsa.selecoes, ...falsa.escritas]) {
    assert.equal(consulta.texto.includes('DROP TABLE'), false);
    assert.equal(consulta.texto.includes('DELETE --'), false);
  }
});
