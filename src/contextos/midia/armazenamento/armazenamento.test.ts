/**
 * Testes da entrega de **T002**: *"o anexo existe como registro de conteudo com
 * estado herdado, e o metadado que descreve as derivadas e gravado e lido pela
 * porta de dados com a mesma forma do legado"*.
 *
 * O que cada teste afirma e **efeito no banco**: qual comando sai, em que ordem,
 * com quais parametros e — no valor serializado — com quais bytes. E o criterio
 * da area 3 da Decisao 2 de `parity_specs.md`, que compara *"snapshot +
 * sequencia de comandos"* com **zero** divergencia admitida.
 *
 * Os testes das historias sao outros — T004, T006, T008 … —, e estes nao
 * validam tipo de arquivo, nao reescrevem estado, nao geram derivada e nao
 * autorizam nada: nenhuma dessas regras existe neste modulo ainda, e cada uma
 * tem a tarefa dela.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  arranjoPorNome,
  inteiro,
  serializarComoTexto,
  texto,
} from '../../../plataforma/serializacao/index.js';

import {
  atribuirChave,
  CHAVE_DO_ARQUIVO_ANEXADO,
  CHAVE_DO_METADADO_DE_ANEXO,
  CHAVE_DOS_TAMANHOS_DE_BACKUP,
  comDerivada,
  criarArmazenamentoDeMidia,
  derivadaChamada,
  derivadaComoValor,
  ESTADO_HERDADO,
  ESTADOS_DE_ANEXO_ACEITOS,
  lerMetadadoDeAnexo,
  metadadoInicialDeImagem,
  ORDEM_DAS_CHAVES_DE_IMAGEM,
  SEM_CONTEUDO_DE_DESTINO,
  tamanhoDeBackupComoValor,
  TIPO_DE_ANEXO,
  verdadeiroComoNoPhp,
  type DerivadaDeImagem,
} from './index.js';
import { criarPortaDeDadosFalsa, textoDoParametro } from './porta-falsa.js';

/** Uma linha de `posts` de anexo como o banco a devolve, com as 23 colunas. */
function linhaDeAnexo(
  sobrescritas: Record<string, string | number> = {},
): Record<string, string | number> {
  return {
    ID: 42,
    post_author: 3,
    post_date: '2026-10-08 09:00:00',
    post_date_gmt: '2026-10-08 12:00:00',
    post_content: 'Descricao da midia.',
    post_title: 'foto-da-praia',
    post_excerpt: 'A legenda da foto.',
    post_status: ESTADO_HERDADO,
    comment_status: 'open',
    ping_status: 'closed',
    post_password: '',
    post_name: 'foto-da-praia',
    to_ping: '',
    pinged: '',
    post_modified: '2026-10-08 09:00:00',
    post_modified_gmt: '2026-10-08 12:00:00',
    post_content_filtered: '',
    post_parent: 7,
    guid: 'http://exemplo.invalido/wp-content/uploads/2026/10/foto-da-praia.jpg',
    menu_order: 0,
    post_type: TIPO_DE_ANEXO,
    post_mime_type: 'image/jpeg',
    comment_count: 0,
    ...sobrescritas,
  };
}

/** Uma linha de `postmeta` como a leitura em lote a devolve: tres colunas. */
function linhaDeMetadado(
  chave: string,
  valor: string,
): Record<string, string | number> {
  return { post_id: 42, meta_key: chave, meta_value: valor };
}

const MINIATURA: DerivadaDeImagem = {
  nomeDeArquivo: 'foto-da-praia-150x150.jpg',
  largura: 150,
  altura: 150,
  tipoMime: 'image/jpeg',
  bytes: 4096,
};

test('criar o armazenamento nao toca na porta (EXT-ORDEM)', () => {
  const falsa = criarPortaDeDadosFalsa();

  criarArmazenamentoDeMidia(falsa.porta);

  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('o nome da tabela leva o prefixo DO SITE, e duas composicoes nao se enxergam', () => {
  const site1 = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_' });
  const site2 = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_2_' });

  criarArmazenamentoDeMidia(site1.porta).anexos.obterPorId(42);
  criarArmazenamentoDeMidia(site2.porta).anexos.obterPorId(42);

  assert.equal(site1.selecoes[0]?.texto, 'SELECT * FROM wp_posts WHERE ID = ?');
  assert.equal(
    site2.selecoes[0]?.texto,
    'SELECT * FROM wp_2_posts WHERE ID = ?',
  );
});

test('a linha do anexo e lida com a cadeia crua de wp_delete_attachment (post.php:6817)', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([linhaDeAnexo()]);

  const anexo = criarArmazenamentoDeMidia(falsa.porta).anexos.obterPorId(42);

  assert.deepEqual(falsa.selecoes, [
    { texto: 'SELECT * FROM wp_posts WHERE ID = ?', parametros: [42] },
  ]);
  assert.equal(anexo?.id, 42);
  assert.equal(anexo?.estado, ESTADO_HERDADO);
  assert.equal(anexo?.tipo, TIPO_DE_ANEXO);
  // As tres colunas que querem dizer outra coisa no anexo (`plan.md`, Modelo de
  // dados): tipo de midia, endereco do arquivo e legenda.
  assert.equal(anexo?.tipoMime, 'image/jpeg');
  assert.equal(
    anexo?.endereco,
    'http://exemplo.invalido/wp-content/uploads/2026/10/foto-da-praia.jpg',
  );
  assert.equal(anexo?.legenda, 'A legenda da foto.');
  assert.equal(anexo?.descricao, 'Descricao da midia.');
  assert.equal(anexo?.conteudoDeDestino, 7);
});

test('anexo sem conteudo de destino tem 0, e nao nulo (DB-SENT, CA-2.3)', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([linhaDeAnexo({ post_parent: 0 })]);

  const anexo = criarArmazenamentoDeMidia(falsa.porta).anexos.obterPorId(42);

  assert.equal(anexo?.conteudoDeDestino, SEM_CONTEUDO_DE_DESTINO);
  assert.equal(anexo?.conteudoDeDestino, 0);
});

test('a leitura NAO corrige estado fora de P2: a reescrita e da gravacao (post.php:4705)', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([linhaDeAnexo({ post_status: 'publish' })]);

  const anexo = criarArmazenamentoDeMidia(falsa.porta).anexos.obterPorId(42);

  // `P2` (BR-MIGRAR-002) e reescrita de valor em transito, dentro de
  // `wp_insert_post()`. A linha que ja esta assim no banco continua sendo
  // devolvida como esta, e nenhuma escrita sai da leitura.
  assert.equal(anexo?.estado, 'publish');
  assert.deepEqual(falsa.escritas, []);
});

test('o vocabulario de P2 tem os quatro estados do legado, e publish nao esta neles', () => {
  assert.deepEqual([...ESTADOS_DE_ANEXO_ACEITOS], [
    'inherit',
    'private',
    'trash',
    'auto-draft',
  ]);
  assert.equal(ESTADO_HERDADO, 'inherit');
  assert.equal(
    (ESTADOS_DE_ANEXO_ACEITOS as readonly string[]).includes('publish'),
    false,
  );
});

test('apagar o anexo e so a linha: um comando, sem cascata (R3 e P5)', () => {
  const falsa = criarPortaDeDadosFalsa({
    resultadoDeEscrita: { linhasAfetadas: 1, idGerado: null },
  });

  const apagadas = criarArmazenamentoDeMidia(falsa.porta).anexos.apagar(42);

  assert.equal(apagadas, 1);
  assert.deepEqual(falsa.escritas, [
    { texto: 'DELETE FROM wp_posts WHERE ID = ?', parametros: [42] },
  ]);
  // Nenhuma leitura, nenhum metadado, nenhum arquivo: a cascata inteira de
  // `wp_delete_attachment()` e de T017, e o P5 manda afirma-la por teste la.
  assert.deepEqual(falsa.selecoes, []);
});

test('o metadado inicial de imagem sai nas cinco chaves do legado, na ordem dele', () => {
  const metadado = metadadoInicialDeImagem({
    largura: 4000,
    altura: 3000,
    arquivoRelativo: '2026/10/foto-da-praia.jpg',
    bytes: 1048576,
  });

  // `wp-admin/includes/image.php:249` a `:255`, com `sizes` vazio E presente.
  assert.equal(
    serializarComoTexto(metadado),
    'a:5:{s:5:"width";i:4000;s:6:"height";i:3000;' +
      's:4:"file";s:25:"2026/10/foto-da-praia.jpg";' +
      's:8:"filesize";i:1048576;s:5:"sizes";a:0:{}}',
  );
  assert.deepEqual(
    ORDEM_DAS_CHAVES_DE_IMAGEM.slice(0, 5),
    ['width', 'height', 'file', 'filesize', 'sizes'],
  );
});

test('a derivada sai na ordem do literal do editor, e filesize so entra se houver', () => {
  // `wp-includes/class-wp-image-editor-gd.php:589` a `:593`.
  assert.equal(
    serializarComoTexto(derivadaComoValor(MINIATURA)),
    'a:5:{s:4:"file";s:25:"foto-da-praia-150x150.jpg";s:5:"width";i:150;' +
      's:6:"height";i:150;s:9:"mime-type";s:10:"image/jpeg";' +
      's:8:"filesize";i:4096;}',
  );

  const semBytes: DerivadaDeImagem = {
    nomeDeArquivo: 'antiga-150x150.jpg',
    largura: 150,
    altura: 150,
    tipoMime: 'image/jpeg',
  };
  assert.equal(
    serializarComoTexto(derivadaComoValor(semBytes)),
    'a:4:{s:4:"file";s:18:"antiga-150x150.jpg";s:5:"width";i:150;' +
      's:6:"height";i:150;s:9:"mime-type";s:10:"image/jpeg";}',
  );
});

test('o backup do arquivo principal tem OUTRA ordem de campos (image-edit.php:1048)', () => {
  assert.equal(
    serializarComoTexto(
      tamanhoDeBackupComoValor({
        nome: 'full-orig',
        nomeDeArquivo: 'foto-da-praia.jpg',
        largura: 2560,
        altura: 1920,
        bytes: 900000,
      }),
    ),
    'a:4:{s:5:"width";i:2560;s:6:"height";i:1920;s:8:"filesize";i:900000;' +
      's:4:"file";s:17:"foto-da-praia.jpg";}',
  );
});

test('atribuir chave que existe substitui NO LUGAR; chave nova entra no fim', () => {
  const inicial = metadadoInicialDeImagem({
    largura: 4000,
    altura: 3000,
    arquivoRelativo: '2026/10/foto.jpg',
    bytes: 1000,
  });

  // A sequencia de `_wp_image_meta_replace_original()`
  // (`wp-admin/includes/image.php:213` a `:223`): quatro chaves existentes
  // reatribuidas e uma nova no fim.
  let metadado = atribuirChave(inicial, 'width', inteiro(2560));
  metadado = atribuirChave(metadado, 'height', inteiro(1920));
  metadado = atribuirChave(metadado, 'file', texto('2026/10/foto-scaled.jpg'));
  metadado = atribuirChave(metadado, 'filesize', inteiro(700));
  metadado = atribuirChave(metadado, 'original_image', texto('foto.jpg'));

  assert.equal(
    serializarComoTexto(metadado),
    'a:6:{s:5:"width";i:2560;s:6:"height";i:1920;' +
      's:4:"file";s:23:"2026/10/foto-scaled.jpg";s:8:"filesize";i:700;' +
      's:5:"sizes";a:0:{}s:14:"original_image";s:8:"foto.jpg";}',
  );
});

test('comDerivada grava uma derivada em sizes, na posicao que a atribuicao daria', () => {
  const inicial = metadadoInicialDeImagem({
    largura: 4000,
    altura: 3000,
    arquivoRelativo: '2026/10/foto.jpg',
    bytes: 1000,
  });

  const comMedium = comDerivada(inicial, 'medium', {
    nomeDeArquivo: 'foto-300x225.jpg',
    largura: 300,
    altura: 225,
    tipoMime: 'image/jpeg',
    bytes: 2048,
  });
  const comDuas = comDerivada(comMedium, 'thumbnail', MINIATURA);

  const lido = lerMetadadoDeAnexo(comDuas);
  assert.ok(lido);
  assert.deepEqual(
    lido.derivadas.map((derivada) => derivada.nome),
    ['medium', 'thumbnail'],
  );
  assert.equal(derivadaChamada(lido, 'thumbnail')?.largura, 150);

  // Regerar um tamanho que ja existe o substitui NO LUGAR: a ordem das chaves em
  // `sizes` nao muda, e e ela que sai nos bytes.
  const regerado = comDerivada(comDuas, 'medium', {
    nomeDeArquivo: 'foto-300x225.jpg',
    largura: 300,
    altura: 225,
    tipoMime: 'image/webp',
    bytes: 1024,
  });
  const relido = lerMetadadoDeAnexo(regerado);
  assert.ok(relido);
  assert.deepEqual(
    relido.derivadas.map((derivada) => derivada.nome),
    ['medium', 'thumbnail'],
  );
  assert.equal(derivadaChamada(relido, 'medium')?.tipoMime, 'image/webp');
});

test('o metadado e lido pela cadeia de update_meta_cache, e a projecao nomeia as chaves', () => {
  const falsa = criarPortaDeDadosFalsa();
  const gravado = comDerivada(
    atribuirChave(
      metadadoInicialDeImagem({
        largura: 2560,
        altura: 1920,
        arquivoRelativo: '2026/10/foto-scaled.jpg',
        bytes: 700,
      }),
      'original_image',
      texto('foto.jpg'),
    ),
    'thumbnail',
    MINIATURA,
  );
  falsa.responder([
    linhaDeMetadado(CHAVE_DO_METADADO_DE_ANEXO, serializarComoTexto(gravado)),
  ]);

  const metadado = criarArmazenamentoDeMidia(
    falsa.porta,
  ).metadadoDeAnexo.obterMetadado(42);

  assert.deepEqual(falsa.selecoes, [
    {
      texto:
        'SELECT post_id, meta_key, meta_value FROM wp_postmeta ' +
        'WHERE post_id IN (?) ORDER BY meta_id ASC',
      parametros: [42],
    },
  ]);
  assert.ok(metadado);
  assert.equal(metadado.largura, 2560);
  assert.equal(metadado.altura, 1920);
  assert.equal(metadado.arquivo, '2026/10/foto-scaled.jpg');
  assert.equal(metadado.bytes, 700);
  assert.equal(metadado.nomeDoOriginal, 'foto.jpg');
  assert.equal(metadado.derivadas.length, 1);
  assert.deepEqual(metadado.derivadas[0], { nome: 'thumbnail', ...MINIATURA });
  // A projecao nao e o dado: o arranjo lido continua inteiro na mao de quem leu.
  assert.equal(
    serializarComoTexto(metadado.valor),
    serializarComoTexto(gravado),
  );
});

test('metadado ausente e metadado vazio sao o mesmo "nao ha" do legado (post.php:7116)', () => {
  const ausente = criarPortaDeDadosFalsa();
  assert.equal(
    criarArmazenamentoDeMidia(ausente.porta).metadadoDeAnexo.obterMetadado(42),
    null,
  );

  const vazio = criarPortaDeDadosFalsa();
  vazio.responder([linhaDeMetadado(CHAVE_DO_METADADO_DE_ANEXO, 'a:0:{}')]);
  assert.equal(
    criarArmazenamentoDeMidia(vazio.porta).metadadoDeAnexo.obterMetadado(42),
    null,
  );
});

test('chave de extensao sobrevive a volta: ler e gravar devolve os mesmos bytes (P2)', () => {
  const comExtra = atribuirChave(
    comDerivada(
      metadadoInicialDeImagem({
        largura: 800,
        altura: 600,
        arquivoRelativo: '2026/10/foto.jpg',
        bytes: 500,
      }),
      'thumbnail',
      MINIATURA,
    ),
    'inventado_por_extensao',
    arranjoPorNome([['qualquer', texto('coisa')]]),
  );
  const bytes = serializarComoTexto(comExtra);

  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([linhaDeMetadado(CHAVE_DO_METADADO_DE_ANEXO, bytes)]);
  const armazenamento = criarArmazenamentoDeMidia(falsa.porta);
  const metadado = armazenamento.metadadoDeAnexo.obterMetadado(42);
  assert.ok(metadado);

  // A projecao nao conhece a chave da extensao, e isso nao a apaga: quem grava
  // de volta grava o arranjo, nao a projecao.
  falsa.responder([linhaDeMetadado(CHAVE_DO_METADADO_DE_ANEXO, bytes)]);
  falsa.responder([{ meta_id: 9 }]);
  armazenamento.metadadoDeAnexo.gravarMetadado(
    42,
    atribuirChave(metadado.valor, 'filesize', inteiro(501)),
  );

  const escrita = falsa.escritas[0];
  assert.equal(
    escrita?.texto,
    'UPDATE wp_postmeta SET meta_value = ? WHERE post_id = ? AND meta_key = ?',
  );
  assert.equal(
    textoDoParametro(escrita?.parametros[0]),
    bytes.replace('s:8:"filesize";i:500;', 's:8:"filesize";i:501;'),
  );
});

test('gravar metadado identico nao emite escrita nenhuma (meta.php:255)', () => {
  const metadado = metadadoInicialDeImagem({
    largura: 800,
    altura: 600,
    arquivoRelativo: '2026/10/foto.jpg',
    bytes: 500,
  });
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([
    linhaDeMetadado(CHAVE_DO_METADADO_DE_ANEXO, serializarComoTexto(metadado)),
  ]);

  const resultado = criarArmazenamentoDeMidia(
    falsa.porta,
  ).metadadoDeAnexo.gravarMetadado(42, metadado);

  assert.deepEqual(resultado, {
    caminho: 'gravado',
    resultado: { gravou: false, acrescentadoComId: null },
  });
  assert.deepEqual(falsa.escritas, []);
});

test('metadado vazio APAGA a chave, pela verdade de PHP (post.php:7174)', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([{ meta_id: 9 }]);

  const resultado = criarArmazenamentoDeMidia(
    falsa.porta,
  ).metadadoDeAnexo.gravarMetadado(42, arranjoPorNome([]));

  assert.deepEqual(resultado, { caminho: 'apagado', linhasApagadas: 1 });
  // Os dois comandos de `delete_metadata()`, nessa ordem: acha os
  // identificadores, e so entao apaga por eles (`meta.php:456` a `:514`).
  assert.deepEqual(falsa.selecoes, [
    {
      texto:
        'SELECT meta_id FROM wp_postmeta WHERE meta_key = ? AND post_id = ?',
      parametros: [CHAVE_DO_METADADO_DE_ANEXO, 42],
    },
  ]);
  assert.deepEqual(falsa.escritas, [
    {
      texto: 'DELETE FROM wp_postmeta WHERE meta_id IN( ? )',
      parametros: [9],
    },
  ]);
  assert.equal(verdadeiroComoNoPhp(arranjoPorNome([])), false);
});

test('o caminho do arquivo e lido e gravado como o valor da coluna, sem resolver pasta', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([
    linhaDeMetadado(CHAVE_DO_ARQUIVO_ANEXADO, '2026/10/foto-da-praia.jpg'),
  ]);
  const armazenamento = criarArmazenamentoDeMidia(falsa.porta);

  assert.equal(
    armazenamento.metadadoDeAnexo.obterCaminhoRelativo(42),
    '2026/10/foto-da-praia.jpg',
  );

  falsa.responder([
    linhaDeMetadado(CHAVE_DO_ARQUIVO_ANEXADO, '2026/10/foto-da-praia.jpg'),
  ]);
  falsa.responder([{ meta_id: 4 }]);
  armazenamento.metadadoDeAnexo.gravarCaminhoRelativo(
    42,
    '2026/10/foto-da-praia-scaled.jpg',
  );

  assert.deepEqual(falsa.escritas, [
    {
      texto:
        'UPDATE wp_postmeta SET meta_value = ? WHERE post_id = ? AND meta_key = ?',
      parametros: [
        '2026/10/foto-da-praia-scaled.jpg',
        42,
        CHAVE_DO_ARQUIVO_ANEXADO,
      ],
    },
  ]);
});

test('caminho vazio e caminho "0" APAGAM a chave (post.php:901, verdade de PHP)', () => {
  for (const caminho of ['', '0']) {
    const falsa = criarPortaDeDadosFalsa();
    falsa.responder([{ meta_id: 4 }]);

    const resultado = criarArmazenamentoDeMidia(
      falsa.porta,
    ).metadadoDeAnexo.gravarCaminhoRelativo(42, caminho);

    assert.deepEqual(resultado, { caminho: 'apagado', linhasApagadas: 1 });
    assert.equal(falsa.escritas[0]?.texto.startsWith('DELETE'), true);
  }
});

test('os tamanhos de backup sao gravados sem o ramo de exclusao, e apagados a parte', () => {
  const falsa = criarPortaDeDadosFalsa();
  const backup = arranjoPorNome([
    [
      'full-orig',
      tamanhoDeBackupComoValor({
        nome: 'full-orig',
        nomeDeArquivo: 'foto.jpg',
        largura: 4000,
        altura: 3000,
        bytes: 1000,
      }),
    ],
  ]);
  falsa.responder([]);
  falsa.responder([]);
  const armazenamento = criarArmazenamentoDeMidia(falsa.porta);

  armazenamento.metadadoDeAnexo.gravarTamanhosDeBackup(42, backup);

  assert.equal(
    falsa.escritas[0]?.texto,
    'INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES (?, ?, ?)',
  );
  assert.equal(
    textoDoParametro(falsa.escritas[0]?.parametros[1]),
    CHAVE_DOS_TAMANHOS_DE_BACKUP,
  );

  falsa.responder([linhaDeMetadado(CHAVE_DOS_TAMANHOS_DE_BACKUP, 'x')]);
  assert.equal(
    criarArmazenamentoDeMidia(falsa.porta).metadadoDeAnexo.obterTamanhosDeBackup(
      42,
    ).length,
    0,
  );
});

test('a guarda da miniatura compartilhada procura dentro do valor serializado', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([{ meta_id: 3 }]);

  const usada = criarArmazenamentoDeMidia(
    falsa.porta,
  ).metadadoDeAnexo.outroAnexoReferenciaMiniatura('foto_da_praia-thumb.jpg', 42);

  assert.equal(usada, true);
  assert.deepEqual(falsa.selecoes, [
    {
      texto:
        "SELECT meta_id FROM wp_postmeta WHERE meta_key = '_wp_attachment_metadata' " +
        'AND meta_value LIKE ? AND post_id <> ?',
      // `esc_like()` escapa o `_`, que no `LIKE` seria curinga de um caractere
      // (`wp-includes/class-wpdb.php:1786`).
      parametros: ['%foto\\_da\\_praia-thumb.jpg%', 42],
    },
  ]);
});

test('o contexto do anexo e acrescentado como chave unica, e nao sobrescreve', () => {
  const falsa = criarPortaDeDadosFalsa();
  falsa.responder([{ 'COUNT(*)': 1 }]);

  const id = criarArmazenamentoDeMidia(
    falsa.porta,
  ).metadadoDeAnexo.declararContexto(42, 'custom-header');

  // `add_post_meta( ..., true )`: a contagem sai sempre, e com linha existente
  // **nenhuma** insercao acontece (`wp-includes/post.php:5130`).
  assert.equal(id, 0);
  assert.deepEqual(falsa.selecoes, [
    {
      texto:
        'SELECT COUNT(*) FROM wp_postmeta WHERE meta_key = ? AND post_id = ?',
      parametros: ['_wp_attachment_context', 42],
    },
  ]);
  assert.deepEqual(falsa.escritas, []);
});
