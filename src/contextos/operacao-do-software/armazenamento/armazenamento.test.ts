/**
 * Testes da metade de **T002** que diz *"sao lidos e gravados pela porta de
 * dados"*: a primitiva de opcao, por site e de rede.
 *
 * Nao sao os testes de nenhuma historia — esses sao T004, T006, T008 e os demais
 * `[P]` de `tasks.md`, um por caso de `../../../../backlog/tests.md`. Aqui se
 * afirma **qual comando sai, com quais parametros, e em que ordem**, que e o
 * criterio da area *"efeito no banco"* da Decisao 2 de `parity_specs.md`:
 * *"snapshot + sequencia de comandos"*.
 *
 * Metade destes testes afirma **ausencia de comando**. Nao e enfeite: sao
 * quatro caminhos do legado em que nenhuma escrita sai, e um porte que escreva
 * neles muda o `snapshot` e o numero de linhas tocadas.
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
  criarArmazenamentoDeOperacaoDoSoftware,
  criarPortaDeDadosFalsa,
  determinarAutocarregamento,
  mesmoValorDeOpcao,
  OPCAO_DE_FALHA_DA_ATUALIZACAO,
  SITE_UNICO,
  tabelaDeOpcoesDeRede,
  tabelaDeOpcoesDoSite,
  TAMANHO_MAXIMO_DE_OPCAO_AUTOCARREGADA,
  textoDoParametro,
  verdadeiroComoNoPhp,
  VALORES_QUE_AUTOCARREGAM,
  VALORES_REAVALIAVEIS,
  type EscopoDeRede,
} from './index.js';

/** Uma rede, com a opcao de rede vivendo em `{base}sitemeta`. */
const EM_REDE: EscopoDeRede = { emRede: true, redeId: 1 };

function textos(consultas: readonly { readonly texto: string }[]): string[] {
  return consultas.map((consulta) => consulta.texto);
}

test('as duas tabelas levam prefixos DIFERENTES, porque o legado tem dois', () => {
  const { porta } = criarPortaDeDadosFalsa({
    prefixoDeTabela: 'wp_2_',
    prefixoBaseDeTabela: 'wp_',
  });

  // `options` esta no bloco ESCOPO POR SITE do DDL (`schema.php:141`), e
  // `sitemeta` e global (`:290`). Derivar um prefixo do outro por corte de texto
  // nao funciona: um prefixo base pode terminar em digito e sublinhado.
  assert.equal(tabelaDeOpcoesDoSite(porta), 'wp_2_options');
  assert.equal(tabelaDeOpcoesDeRede(porta), 'wp_sitemeta');
});

test('ler opcao emite a cadeia do legado, com LIMIT 1 e o nome como parametro', () => {
  const falsa = criarPortaDeDadosFalsa();
  const { opcoesDoSite } = criarArmazenamentoDeOperacaoDoSoftware(falsa.porta);

  falsa.responder([{ option_value: 'enabled' }]);
  const leitura = opcoesDoSite.ler('auto_update_core_minor');

  assert.deepEqual(falsa.selecoes, [
    {
      texto:
        'SELECT option_value FROM wp_options WHERE option_name = ? LIMIT 1',
      parametros: ['auto_update_core_minor'],
    },
  ]);
  assert.deepEqual(falsa.escritas, []);
  assert.deepEqual(leitura, { existe: true, valor: texto('enabled') });
});

test('opcao gravada com cadeia vazia EXISTE: a linha decide, nao o valor', () => {
  const falsa = criarPortaDeDadosFalsa();
  const { opcoesDoSite } = criarArmazenamentoDeOperacaoDoSoftware(falsa.porta);

  falsa.responder([{ option_value: '' }]);
  const presente = opcoesDoSite.ler('qualquer');

  falsa.responderSemLinha();
  const ausente = opcoesDoSite.ler('qualquer');

  // E a razao pela qual `get_option()` usa `get_row()` e nao `get_var()`, com o
  // comentario no proprio codigo (`wp-includes/option.php:208`): "funkiness
  // with 0, false, null values". A diferenca decide entre `INSERT` e `UPDATE`.
  assert.deepEqual(presente, { existe: true, valor: texto('') });
  assert.deepEqual(ausente, { existe: false });
});

test('o valor serializado atravessa a porta como bytes, nos dois sentidos', () => {
  const falsa = criarPortaDeDadosFalsa();
  const { opcoesDeRede } = criarArmazenamentoDeOperacaoDoSoftware(falsa.porta);

  const registro = arranjoPorNome([
    ['attempted', texto('7.1.3')],
    ['timestamp', inteiro(1760000000)],
  ]);
  const serializado = serializarComoTexto(registro);

  falsa.responder([{ meta_value: serializado }]);
  const leitura = opcoesDeRede.ler(EM_REDE, OPCAO_DE_FALHA_DA_ATUALIZACAO);

  assert.deepEqual(leitura, { existe: true, valor: registro });

  // E na ida, o parametro e a MESMA cadeia: `maybe_serialize()` do legado.
  falsa.responderSemLinha();
  opcoesDeRede.gravar(EM_REDE, OPCAO_DE_FALHA_DA_ATUALIZACAO, registro);

  assert.equal(
    textoDoParametro(falsa.escritas[0]?.parametros[2]),
    serializado,
  );
  assert.equal(
    serializado,
    'a:2:{s:9:"attempted";s:5:"7.1.3";s:9:"timestamp";i:1760000000;}',
  );
});

test('gravar o valor que ja esta la NAO emite escrita (option.php:923)', () => {
  const falsa = criarPortaDeDadosFalsa();
  const { opcoesDoSite } = criarArmazenamentoDeOperacaoDoSoftware(falsa.porta);

  falsa.responder([{ option_value: 'enabled' }]);
  const gravou = opcoesDoSite.gravar('auto_update_core_major', texto('enabled'));

  assert.equal(gravou, false);
  // Uma leitura, e NENHUMA escrita. Nem a leitura de `autoload` sai: o legado
  // desiste antes dela.
  assert.equal(falsa.selecoes.length, 1);
  assert.deepEqual(falsa.escritas, []);
});

test('o tipo conta na comparacao: inteiro sobre o texto da coluna EMITE comando', () => {
  const falsa = criarPortaDeDadosFalsa();
  const { opcoesDoSite } = criarArmazenamentoDeOperacaoDoSoftware(falsa.porta);

  // A coluna devolve sempre texto; `update_option( ..., time() )` passa inteiro.
  // Em PHP `'1760000000' === 1760000000` e falso, e `maybe_serialize()` nao
  // toca escalar — logo o comando sai. E o caminho do marcador de aviso de
  // `A10`, que precisa gravar para que o aviso possa sair.
  falsa.responder([{ option_value: '1760000000' }]);
  falsa.responder([{ autoload: 'auto' }]);
  const gravou = opcoesDoSite.gravar(
    'recovery_mode_email_last_sent',
    inteiro(1760000000),
  );

  assert.equal(gravou, true);
  assert.equal(falsa.escritas.length, 1);
  assert.equal(mesmoValorDeOpcao(texto('1760000000'), inteiro(1760000000)), false);
});

test('gravar opcao ausente vira INSERT, com DUAS leituras antes', () => {
  const falsa = criarPortaDeDadosFalsa();
  const { opcoesDoSite } = criarArmazenamentoDeOperacaoDoSoftware(falsa.porta);

  falsa.responderSemLinha();
  falsa.responderSemLinha();
  const gravou = opcoesDoSite.gravar(
    'recovery_mode_email_last_sent',
    inteiro(1760000000),
  );

  assert.equal(gravou, true);
  // `update_option()` le, delega para `add_option()` (`option.php:929`), e
  // `add_option()` LE DE NOVO (`:1123`). Com o cache de objeto ligado a segunda
  // e gratuita; o `Contexto:` de PT-013 exige o cache DESLIGADO nas duas
  // metades, e ai sao dois `SELECT`.
  assert.deepEqual(textos(falsa.selecoes), [
    'SELECT option_value FROM wp_options WHERE option_name = ? LIMIT 1',
    'SELECT option_value FROM wp_options WHERE option_name = ? LIMIT 1',
  ]);
  assert.deepEqual(falsa.escritas, [
    {
      texto:
        'INSERT INTO `wp_options` (`option_name`, `option_value`, `autoload`) ' +
        'VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ' +
        '`option_name` = VALUES(`option_name`), ' +
        '`option_value` = VALUES(`option_value`), ' +
        '`autoload` = VALUES(`autoload`)',
      parametros: ['recovery_mode_email_last_sent', 1760000000, 'auto'],
    },
  ]);
});

test('acrescentar opcao que existe NAO emite INSERT (option.php:1123)', () => {
  const falsa = criarPortaDeDadosFalsa();
  const { opcoesDoSite } = criarArmazenamentoDeOperacaoDoSoftware(falsa.porta);

  falsa.responder([{ option_value: 'a:0:{}' }]);
  const acrescentou = opcoesDoSite.acrescentar('recovery_keys', texto('x'));

  assert.equal(acrescentou, false);
  assert.deepEqual(falsa.escritas, []);
});

test('autocarregamento pedido vai na UPDATE; omitido, custa um SELECT a mais', () => {
  const comPedido = criarPortaDeDadosFalsa();
  const deComPedido = criarArmazenamentoDeOperacaoDoSoftware(comPedido.porta);

  comPedido.responder([{ option_value: 'a:0:{}' }]);
  deComPedido.opcoesDoSite.gravar('recovery_keys', texto('novo'), false);

  // `recovery_keys` grava com `false` (`class-wp-recovery-mode-key-service.php:191`):
  // o autocarregamento e explicito, logo NAO ha o `SELECT autoload`.
  assert.equal(comPedido.selecoes.length, 1);
  assert.deepEqual(comPedido.escritas, [
    {
      texto:
        'UPDATE `wp_options` SET `option_value` = ?, `autoload` = ? ' +
        'WHERE `option_name` = ?',
      parametros: ['novo', 'off', 'recovery_keys'],
    },
  ]);

  const semPedido = criarPortaDeDadosFalsa();
  const deSemPedido = criarArmazenamentoDeOperacaoDoSoftware(semPedido.porta);

  semPedido.responder([{ option_value: '1' }]);
  semPedido.responder([{ autoload: 'on' }]);
  deSemPedido.opcoesDoSite.gravar('recovery_mode_email_last_sent', texto('2'));

  // Valor EXPLICITO gravado na coluna nao e reavaliado (`option.php:954`): o
  // `UPDATE` sai sem a coluna `autoload`.
  assert.deepEqual(textos(semPedido.selecoes), [
    'SELECT option_value FROM wp_options WHERE option_name = ? LIMIT 1',
    'SELECT autoload FROM wp_options WHERE option_name = ? LIMIT 1',
  ]);
  assert.deepEqual(semPedido.escritas, [
    {
      texto: 'UPDATE `wp_options` SET `option_value` = ? WHERE `option_name` = ?',
      parametros: ['2', 'recovery_mode_email_last_sent'],
    },
  ]);
});

test('autocarregamento automatico e reavaliado, e so muda se o valor novo diferir', () => {
  const muda = criarPortaDeDadosFalsa();
  const deMuda = criarArmazenamentoDeOperacaoDoSoftware(muda.porta);

  muda.responder([{ option_value: '1' }]);
  muda.responder([{ autoload: 'auto-off' }]);
  deMuda.opcoesDoSite.gravar('qualquer', texto('2'));

  // `'auto-off'` esta na lista reavaliavel; o valor novo e pequeno, logo o
  // legado recalcula `'auto'` e grava a coluna.
  assert.deepEqual(muda.escritas[0]?.parametros, ['2', 'auto', 'qualquer']);

  const naoMuda = criarPortaDeDadosFalsa();
  const deNaoMuda = criarArmazenamentoDeOperacaoDoSoftware(naoMuda.porta);

  naoMuda.responder([{ option_value: '1' }]);
  naoMuda.responder([{ autoload: 'auto' }]);
  deNaoMuda.opcoesDoSite.gravar('qualquer', texto('2'));

  // Recalculou `'auto'`, que e o que ja estava: a coluna fica fora do comando
  // (`option.php:959`).
  assert.deepEqual(naoMuda.escritas[0]?.parametros, ['2', 'qualquer']);
});

test('as duas listas de autocarregamento sao as do legado, com os valores de la', () => {
  assert.deepEqual(VALORES_QUE_AUTOCARREGAM, ['yes', 'on', 'auto-on', 'auto']);
  assert.deepEqual(VALORES_REAVALIAVEIS, ['auto-on', 'auto-off', 'auto']);

  // `wp_determine_option_autoload_value()` (`option.php:1306`), caso a caso.
  assert.equal(determinarAutocarregamento(true, 0), 'on');
  assert.equal(determinarAutocarregamento(false, 0), 'off');
  assert.equal(determinarAutocarregamento('yes', 0), 'on');
  assert.equal(determinarAutocarregamento('no', 0), 'off');
  assert.equal(determinarAutocarregamento('on', 0), 'on');
  assert.equal(determinarAutocarregamento('off', 0), 'off');
  assert.equal(determinarAutocarregamento(null, 0), 'auto');

  // A borda dos 150000 bytes, com o P6 cobrando "no ultimo instante aceita, um
  // instante depois recusa" (`option.php:1362`).
  assert.equal(TAMANHO_MAXIMO_DE_OPCAO_AUTOCARREGADA, 150000);
  assert.equal(
    determinarAutocarregamento(null, TAMANHO_MAXIMO_DE_OPCAO_AUTOCARREGADA),
    'auto',
  );
  assert.equal(
    determinarAutocarregamento(null, TAMANHO_MAXIMO_DE_OPCAO_AUTOCARREGADA + 1),
    'auto-off',
  );
});

test('apagar opcao que nao existe NAO emite DELETE, e a leitura vem SEM LIMIT', () => {
  const falsa = criarPortaDeDadosFalsa();
  const { opcoesDoSite } = criarArmazenamentoDeOperacaoDoSoftware(falsa.porta);

  falsa.responderSemLinha();
  const apagou = opcoesDoSite.apagar(OPCAO_DE_FALHA_DA_ATUALIZACAO);

  assert.equal(apagou, false);
  // ⚠️ `delete_option()` e a UNICA leitura de opcao do legado sem `LIMIT 1`
  // (`option.php:1215`), e o texto do comando e o que a area 3 compara.
  assert.deepEqual(falsa.selecoes, [
    {
      texto: 'SELECT autoload FROM wp_options WHERE option_name = ?',
      parametros: ['auto_core_update_failed'],
    },
  ]);
  assert.deepEqual(falsa.escritas, []);
});

test('apagar opcao que existe emite o DELETE do legado', () => {
  const falsa = criarPortaDeDadosFalsa();
  const { opcoesDoSite } = criarArmazenamentoDeOperacaoDoSoftware(falsa.porta);

  falsa.responder([{ autoload: 'off' }]);
  const apagou = opcoesDoSite.apagar(OPCAO_DE_FALHA_DA_ATUALIZACAO);

  assert.equal(apagou, true);
  assert.deepEqual(falsa.escritas, [
    {
      texto: 'DELETE FROM `wp_options` WHERE `option_name` = ?',
      parametros: ['auto_core_update_failed'],
    },
  ]);
});

test('em site unico, a opcao de REDE vive em options e nasce com autoload off', () => {
  const falsa = criarPortaDeDadosFalsa({
    prefixoDeTabela: 'wp_',
    prefixoBaseDeTabela: 'wp_',
  });
  const { opcoesDeRede } = criarArmazenamentoDeOperacaoDoSoftware(falsa.porta);

  falsa.responderSemLinha();
  falsa.responderSemLinha();
  opcoesDeRede.gravar(SITE_UNICO, OPCAO_DE_FALHA_DA_ATUALIZACAO, texto('x'));

  // `update_network_option()` cai em `update_option( $option, $value, false )`
  // (`option.php:2446`), que por sua vez cai em
  // `add_option( $option, $value, '', false )` (`:2189`) quando a opcao nao
  // existe: `sitemeta` nao e tocada, e a coluna `autoload` nasce `'off'`.
  assert.deepEqual(textos(falsa.selecoes), [
    'SELECT option_value FROM wp_options WHERE option_name = ? LIMIT 1',
    'SELECT option_value FROM wp_options WHERE option_name = ? LIMIT 1',
  ]);
  assert.equal(falsa.escritas.length, 1);
  assert.equal(
    falsa.escritas[0]?.texto.startsWith('INSERT INTO `wp_options`'),
    true,
  );
  assert.deepEqual(falsa.escritas[0]?.parametros, [
    'auto_core_update_failed',
    'x',
    'off',
  ]);
});

test('em rede, a opcao de rede vive em sitemeta, com a ordem de WHERE do legado', () => {
  const falsa = criarPortaDeDadosFalsa({
    prefixoDeTabela: 'wp_2_',
    prefixoBaseDeTabela: 'wp_',
  });
  const { opcoesDeRede } = criarArmazenamentoDeOperacaoDoSoftware(falsa.porta);

  falsa.responder([{ meta_value: 'antigo' }]);
  opcoesDeRede.gravar(EM_REDE, OPCAO_DE_FALHA_DA_ATUALIZACAO, texto('novo'));

  assert.deepEqual(falsa.selecoes, [
    {
      texto:
        'SELECT meta_value FROM wp_sitemeta WHERE meta_key = ? AND site_id = ?',
      parametros: ['auto_core_update_failed', 1],
    },
  ]);
  // `$wpdb->update( $wpdb->sitemeta, ..., array( 'site_id' =>, 'meta_key' => ) )`
  // monta o `WHERE` na ordem do arranjo: `site_id` antes de `meta_key`
  // (`option.php:2451`).
  assert.deepEqual(falsa.escritas, [
    {
      texto:
        'UPDATE `wp_sitemeta` SET `meta_value` = ? ' +
        'WHERE `site_id` = ? AND `meta_key` = ?',
      parametros: ['novo', 1, 'auto_core_update_failed'],
    },
  ]);
});

test('em rede, acrescentar e apagar usam as cadeias do legado, e a leitura de meta_id', () => {
  const insere = criarPortaDeDadosFalsa({ prefixoBaseDeTabela: 'wp_' });
  const deInsere = criarArmazenamentoDeOperacaoDoSoftware(insere.porta);

  insere.responderSemLinha();
  deInsere.opcoesDeRede.acrescentar(EM_REDE, 'recovery_mode_auth_key', texto('s'));

  assert.deepEqual(insere.escritas, [
    {
      texto:
        'INSERT INTO `wp_sitemeta` (`site_id`, `meta_key`, `meta_value`) ' +
        'VALUES (?, ?, ?)',
      parametros: [1, 'recovery_mode_auth_key', 's'],
    },
  ]);

  const apaga = criarPortaDeDadosFalsa({ prefixoBaseDeTabela: 'wp_' });
  const deApaga = criarArmazenamentoDeOperacaoDoSoftware(apaga.porta);

  apaga.responder([{ meta_id: 12 }]);
  deApaga.opcoesDeRede.apagar(EM_REDE, OPCAO_DE_FALHA_DA_ATUALIZACAO);

  // O legado confere a EXISTENCIA com `SELECT meta_id`, e o teste dele e
  // `is_null( $row ) || ! $row->meta_id` (`option.php:2311` e `:2312`). E o
  // `DELETE` leva `meta_key` ANTES de `site_id`, ao contrario do `UPDATE`
  // (`:2318`).
  assert.deepEqual(textos(apaga.selecoes), [
    'SELECT meta_id FROM wp_sitemeta WHERE meta_key = ? AND site_id = ?',
  ]);
  assert.deepEqual(apaga.escritas, [
    {
      texto: 'DELETE FROM `wp_sitemeta` WHERE `meta_key` = ? AND `site_id` = ?',
      parametros: ['auto_core_update_failed', 1],
    },
  ]);
});

test('a escrita que nao afeta linha devolve false, como `if ( ! $result )`', () => {
  const falsa = criarPortaDeDadosFalsa({
    resultadoDeEscrita: { linhasAfetadas: 0, idGerado: null },
  });
  const { opcoesDoSite } = criarArmazenamentoDeOperacaoDoSoftware(falsa.porta);

  falsa.responder([{ option_value: 'antigo' }]);
  falsa.responder([{ autoload: 'on' }]);
  const gravou = opcoesDoSite.gravar('qualquer', texto('novo'));

  // `update_option()` devolve `false` quando `$wpdb->update()` nao afetou linha
  // (`option.php:964`). O comando SAIU — e o retorno e que diz que nao pegou.
  assert.equal(gravou, false);
  assert.equal(falsa.escritas.length, 1);
});

test('a verdade de PHP de um valor de opcao, caso a caso', () => {
  // As duas linhas que DIVERGEM deste runtime: arranjo vazio e a cadeia `'0'`.
  assert.equal(verdadeiroComoNoPhp(arranjoPorNome([])), false);
  assert.equal(verdadeiroComoNoPhp(texto('0')), false);
  assert.equal(verdadeiroComoNoPhp(texto('')), false);
  assert.equal(verdadeiroComoNoPhp(texto('0.0')), true);
  assert.equal(verdadeiroComoNoPhp(inteiro(0)), false);
  assert.equal(verdadeiroComoNoPhp({ tipo: 'nulo' }), false);
  assert.equal(verdadeiroComoNoPhp(inteiro(1)), true);
  assert.equal(
    verdadeiroComoNoPhp(arranjoPorNome([['critical', inteiro(1)]])),
    true,
  );
});

test('duas composicoes nao compartilham estado (EXT-CONTEXTO, BR-MIGRAR-105)', () => {
  const primeira = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_' });
  const segunda = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_2_' });

  const a = criarArmazenamentoDeOperacaoDoSoftware(primeira.porta);
  const b = criarArmazenamentoDeOperacaoDoSoftware(segunda.porta);

  // Compor NAO consulta (`EXT-ORDEM`, BR-MIGRAR-106).
  assert.equal(primeira.selecoes.length, 0);
  assert.equal(segunda.selecoes.length, 0);

  primeira.responderSemLinha();
  a.opcoesDoSite.ler('x');

  assert.equal(primeira.selecoes.length, 1);
  assert.equal(segunda.selecoes.length, 0);
  assert.equal(primeira.selecoes[0]?.texto.includes('wp_options'), true);

  segunda.responderSemLinha();
  b.opcoesDoSite.ler('x');
  assert.equal(segunda.selecoes[0]?.texto.includes('wp_2_options'), true);
});
