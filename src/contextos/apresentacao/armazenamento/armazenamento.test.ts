/**
 * Testes da entrega de **T002** da feature `009-apresentacao-e-personalizacao`:
 * *"o conjunto de alteracoes existe como tipo de conteudo proprio e a
 * configuracao declarada pelo tema e lida como dado, pela porta de dados, com a
 * mesma forma do legado"*.
 *
 * Nao sao os testes de nenhuma historia — esses sao T004, T006, T008 e os demais
 * `[P]` de `tasks.md`, um por caso de `backlog/tests.md`. Aqui se afirma forma:
 * o nome, o vocabulario, a capacidade resolvida, o byte do valor gravado e **a
 * sequencia de comandos**, que e o que a area 3 de `parity_specs.md` compara —
 * *"snapshot + sequencia de comandos"*, com `LACUNA-IN-12` apontando para esta
 * feature: *"trocar o tema ativo **escreve opcao** — e area 3"*.
 *
 * As afirmacoes de "nenhum comando sai" sao tao importantes quanto as outras, e
 * sao tres: gravar o valor que ja esta gravado, apagar opcao que nao existe e
 * pedir carga automatica que a linha ja tem.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  arranjoPorNome,
  inteiro,
  serializarComoTexto,
  texto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import {
  CARGA_AUTOMATICA_DECIDIDA_DESLIGADA,
  CARGA_AUTOMATICA_DESLIGADA,
  CARGA_AUTOMATICA_INDECISA,
  CARGA_AUTOMATICA_LIGADA,
  ESTADOS_ACEITOS_NA_ESCRITA,
  ESTADOS_DO_CONJUNTO,
  ESTADO_APLICADO,
  ESTADO_DE_RASCUNHO_AUTOMATICO,
  ESTADO_GUARDADO,
  ESTADO_NA_LIXEIRA,
  OPCAO_DA_FOLHA_DE_ESTILO,
  OPCAO_DO_NOME_DO_TEMA,
  TETO_DE_BYTES_DA_CARGA_AUTOMATICA,
  TIPO_DECLARADO_DO_CONJUNTO,
  TIPO_DO_CONJUNTO_DE_ALTERACOES,
  VALORES_DE_CARGA_AUTOMATICA_QUE_CARREGAM,
  atribuirChave,
  capacidadesResolvidas,
  capacidadesResolvidasDoConjunto,
  chaveDaConfiguracaoNoConjunto,
  conteudoDoConjunto,
  criarArmazenamentoDaApresentacao,
  criarPortaDeDadosFalsa,
  determinarCargaAutomatica,
  estadoAceitoNaEscrita,
  identificadorDoConjuntoValido,
  lerConjuntoDeAlteracoes,
  lerDadosDoConjunto,
  lerParametrosDaConfiguracao,
  opcaoDeModificacoesAntiga,
  opcaoDeModificacoesDoTema,
  tabelaDeConteudo,
  tabelaDeOpcoes,
  textoDoParametro,
  transicaoPermitida,
  valorDaChave,
  type TipoDeConteudoDeclarado,
} from './index.js';

/** O nome do tema de fabrica, citado pelo legado e nunca decidido aqui. */
const TEMA = 'twentytwentyfive';

function armazenamento(prefixoDeTabela = 'wp_') {
  const falsa = criarPortaDeDadosFalsa({ prefixoDeTabela });
  return { falsa, alvo: criarArmazenamentoDaApresentacao(falsa.porta) };
}

// ── Nomes de tabela, de tipo e de opcao ─────────────────────────────────────

test('as duas tabelas levam o prefixo DO SITE, e nenhum nome se monta a mao', () => {
  const falsa = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_7_' });

  // `target_data_model.md` poe `posts` e `options` no bloco "ESCOPO POR SITE", e
  // numa rede o identificador do site entra DENTRO do nome da tabela.
  assert.equal(tabelaDeConteudo(falsa.porta), 'wp_7_posts');
  assert.equal(tabelaDeOpcoes(falsa.porta), 'wp_7_options');
});

test('a chave de modificacoes leva a folha de estilo dentro do nome da opcao', () => {
  // `wp-includes/theme.php:1028`: `get_option( "theme_mods_$theme_slug" )`. E a
  // invariante do produto: dois temas nunca colidem.
  assert.equal(
    opcaoDeModificacoesDoTema(TEMA),
    'theme_mods_twentytwentyfive',
  );
  // `:1036`, a localizacao obsoleta, por NOME e nao por diretorio.
  assert.equal(
    opcaoDeModificacoesAntiga('Twenty Twenty-Five'),
    'mods_Twenty Twenty-Five',
  );
});

// ── O tipo de conteudo proprio ──────────────────────────────────────────────

test('o tipo declarado e o do legado, campo por campo (post.php:220-:264)', () => {
  const declarado = TIPO_DECLARADO_DO_CONJUNTO;

  assert.equal(declarado.nome, TIPO_DO_CONJUNTO_DE_ALTERACOES);
  assert.equal(declarado.nome, 'customize_changeset');
  assert.equal(declarado.publico, false);
  assert.equal(declarado.doNucleo, true);
  assert.equal(declarado.traduzCapacidadeSobreObjeto, true);
  assert.equal(declarado.hierarquico, false);
  assert.equal(declarado.reescritaDeEndereco, false);
  assert.equal(declarado.variavelDeConsulta, false);
  assert.equal(declarado.exportavel, false);
  // P5: apagar a conta NAO apaga o conjunto dela — ele fica orfao.
  assert.equal(declarado.apagaComAConta, false);
  assert.equal(declarado.baseDeCapacidade, 'customize_changeset');
});

test('supports tem title e author, e NAO tem revisions — e e isso que manda o aplicado para a lixeira', () => {
  // `post.php:244`. A ausencia de `revisions` e a condicao de
  // `_wp_customize_publish_changeset()` (`theme.php:3703`).
  assert.deepEqual(TIPO_DECLARADO_DO_CONJUNTO.suporta, ['title', 'author']);
  assert.equal(TIPO_DECLARADO_DO_CONJUNTO.suporta.includes('revisions'), false);
});

test('os 11 rotulos sao os do legado, com o contexto de traducao de dois deles', () => {
  const rotulos = TIPO_DECLARADO_DO_CONJUNTO.rotulos;

  assert.deepEqual(Object.keys(rotulos), [
    'name',
    'singular_name',
    'add_new',
    'add_new_item',
    'new_item',
    'edit_item',
    'view_item',
    'all_items',
    'search_items',
    'not_found',
    'not_found_in_trash',
  ]);
  // `_x()` carrega contexto, que e parte da chave de traducao e nao comentario.
  assert.deepEqual(rotulos['name'], {
    texto: 'Changesets',
    contexto: 'post type general name',
  });
  // `__()` nao tem contexto.
  assert.deepEqual(rotulos['not_found'], { texto: 'No changesets found.' });
});

test('as 15 capacidades sao as declaradas, com a unica negacao no lugar dela', () => {
  const capacidades = TIPO_DECLARADO_DO_CONJUNTO.capacidades;

  assert.equal(Object.keys(capacidades).length, 15);
  // Doze apontam para a meta-capacidade `customize` (`BR-MIGRAR-092`: ela
  // resolve para `edit_theme_options`).
  assert.equal(
    Object.values(capacidades).filter((valor) => valor === 'customize').length,
    13,
  );
  assert.equal(capacidades['read'], 'read');
  // Depois de aplicado, o conjunto nao se edita: ele vai para a lixeira.
  assert.equal(capacidades['edit_published_posts'], 'do_not_allow');
});

test('a resolucao de capacidade nao muda NADA: as 14 defaults estao todas declaradas', () => {
  // `get_post_type_capabilities()` (`post.php:2034`-`:2081`) funde defaults com
  // declaradas. Para este tipo nenhum default sobrevive — e e por isso que CA-2.3
  // ("declarada na matriz, e nao concedida por caminho indireto") e satisfeita
  // pela declaracao, sem matriz paralela.
  assert.deepEqual(
    capacidadesResolvidasDoConjunto(),
    TIPO_DECLARADO_DO_CONJUNTO.capacidades,
  );
});

test('a fusao de capacidade monta a base plural com s e cai em edit_posts quando create_posts falta', () => {
  const semDeclaracao: TipoDeConteudoDeclarado = {
    ...TIPO_DECLARADO_DO_CONJUNTO,
    capacidades: {},
  };

  const resolvidas = capacidadesResolvidas(semDeclaracao);

  // `$args->capability_type . 's'` (`post.php:2036`): a base plural e a singular
  // com `s`, porque a declaracao passa cadeia e nao par.
  assert.equal(resolvidas['edit_post'], 'edit_customize_changeset');
  assert.equal(resolvidas['edit_posts'], 'edit_customize_changesets');
  assert.equal(
    resolvidas['delete_others_posts'],
    'delete_others_customize_changesets',
  );
  // `map_meta_cap` acrescenta as seis usadas DENTRO da traducao (`:2057`-`:2064`).
  assert.equal(resolvidas['read'], 'read');
  assert.equal(
    resolvidas['edit_published_posts'],
    'edit_published_customize_changesets',
  );
  // `:2071`-`:2073`.
  assert.equal(resolvidas['create_posts'], resolvidas['edit_posts']);

  // Sem `map_meta_cap` as seis nao existem.
  const semTraducao = capacidadesResolvidas({
    ...semDeclaracao,
    traduzCapacidadeSobreObjeto: false,
  });
  assert.equal(semTraducao['read'], undefined);
  assert.equal(semTraducao['edit_published_posts'], undefined);
});

// ── SM-CHANGESET: a maquina de estado propria ───────────────────────────────

test('a maquina tem cinco estados, e a lixeira nao e um deles', () => {
  // `state-machines.md` §5 lista cinco estados aceitos; `trash` aparece so como
  // destino no diagrama.
  assert.deepEqual(ESTADOS_DO_CONJUNTO, [
    'auto-draft',
    'draft',
    'pending',
    'future',
    'publish',
  ]);
  assert.equal(
    (ESTADOS_DO_CONJUNTO as readonly string[]).includes(ESTADO_NA_LIXEIRA),
    false,
  );
});

test('a escrita aceita quatro estados, e o rascunho automatico nao esta entre eles (CA-1.6)', () => {
  // `class-wp-customize-manager.php:2479`, na ordem literal do legado.
  assert.deepEqual(ESTADOS_ACEITOS_NA_ESCRITA, [
    'draft',
    'pending',
    'publish',
    'future',
  ]);
  // O legado nega `auto-draft` por AUSENCIA na lista, nao por ramo proprio.
  assert.equal(estadoAceitoNaEscrita(ESTADO_DE_RASCUNHO_AUTOMATICO), false);
  assert.equal(estadoAceitoNaEscrita(ESTADO_GUARDADO), true);
  assert.equal(estadoAceitoNaEscrita('trash'), false);
  assert.equal(estadoAceitoNaEscrita('private'), false);
});

test('a maquina do conjunto NAO e a do conteudo editorial (PT-019)', () => {
  // As que ela tem.
  assert.equal(transicaoPermitida(null, ESTADO_DE_RASCUNHO_AUTOMATICO), true);
  assert.equal(
    transicaoPermitida(ESTADO_DE_RASCUNHO_AUTOMATICO, ESTADO_GUARDADO),
    true,
  );
  assert.equal(transicaoPermitida(ESTADO_APLICADO, ESTADO_NA_LIXEIRA), true);

  // E a que o conteudo editorial tem e esta nao: despublicar. E o caso que
  // PT-019 descreve — "uma transicao valida no conteudo editorial e tentada no
  // changeset".
  assert.equal(transicaoPermitida(ESTADO_APLICADO, ESTADO_GUARDADO), false);
  assert.equal(transicaoPermitida(ESTADO_NA_LIXEIRA, ESTADO_GUARDADO), false);
  assert.equal(transicaoPermitida(ESTADO_GUARDADO, 'private'), false);
});

// ── O identificador e o valor gravado do conjunto ───────────────────────────

test('o identificador e conferido pela FORMA, nao pela versao (wp_is_uuid sem argumento)', () => {
  assert.equal(
    identificadorDoConjuntoValido('95e3e05a-4e98-4c4e-9e6b-3c8c4b7f7c2d'),
    true,
  );
  // O legado chama `wp_is_uuid()` sem versao (`:534`), logo isto passa — o
  // digito de versao nao e `4` e nao e conferido.
  assert.equal(
    identificadorDoConjuntoValido('95e3e05a-4e98-7c4e-1e6b-3c8c4b7f7c2d'),
    true,
  );
  // Maiuscula nao passa: o regex do legado e `[0-9a-f]`.
  assert.equal(
    identificadorDoConjuntoValido('95E3E05A-4E98-4C4E-9E6B-3C8C4B7F7C2D'),
    false,
  );
  assert.equal(identificadorDoConjuntoValido('nao-e-uuid'), false);
  assert.equal(identificadorDoConjuntoValido(''), false);
});

test('a chave da configuracao no conjunto e prefixada SO quando o tipo e modificacao de tema', () => {
  // `sprintf( '%s::%s', $this->get_stylesheet(), $setting_id )` (`:2841`).
  assert.equal(
    chaveDaConfiguracaoNoConjunto('header_textcolor', 'theme_mod', TEMA),
    'twentytwentyfive::header_textcolor',
  );
  // Configuracao de opcao entra com o identificador cru.
  assert.equal(
    chaveDaConfiguracaoNoConjunto('blogname', 'option', TEMA),
    'blogname',
  );
});

test('o conteudo do conjunto e JSON com recuo de quatro espacos, e barra nao e escapada', () => {
  const gravado = conteudoDoConjunto({
    'twentytwentyfive::header_image': {
      value: 'https://exemplo.invalido/wp-content/uploads/capa.jpg',
      type: 'theme_mod',
      user_id: 1,
      date_modified_gmt: '2026-10-11 12:00:00',
    },
  });

  assert.equal(
    gravado,
    [
      '{',
      '    "twentytwentyfive::header_image": {',
      '        "value": "https://exemplo.invalido/wp-content/uploads/capa.jpg",',
      '        "type": "theme_mod",',
      '        "user_id": 1,',
      '        "date_modified_gmt": "2026-10-11 12:00:00"',
      '    }',
      '}',
    ].join('\n'),
  );
  // `JSON_UNESCAPED_SLASHES` (`:2921`): a barra sai crua.
  assert.equal(gravado.includes('\\/'), false);
});

test('o conteudo escapa fora de ASCII, porque JSON_UNESCAPED_UNICODE nao foi passado', () => {
  const gravado = conteudoDoConjunto({
    // O dado de entrada e escrito em escape para que o fonte siga em ASCII; os
    // bytes sao os de `acucar` com cedilha e `u` com acento agudo.
    'twentytwentyfive::blogdescription': { value: 'Cafe com a\u00e7\u00fa' },
  });

  // Minusculas, por unidade de codigo, como PHP as emite.
  assert.equal(gravado.includes('a\\u00e7\\u00fa'), true);
  assert.equal(gravado.includes('\u00e7'), false);
});

test('conjunto sem alteracao nenhuma grava [], e nao {}', () => {
  // `$data` nasce `array()` (`:2813`-`:2816`), e PHP serializa arranjo vazio como
  // lista. E o primeiro byte do conteudo do conjunto recem-salvo.
  assert.equal(conteudoDoConjunto({}), '[]');
});

test('a leitura do conteudo devolve os codigos de erro do legado, e [] e valido', () => {
  const comDados = lerDadosDoConjunto('{"a::b":{"value":1}}');
  assert.equal(comDados.ok, true);
  assert.deepEqual(comDados.ok ? comDados.dados : null, {
    'a::b': { value: 1 },
  });

  // Lista passa: `is_array()` aceita (`:1144`).
  assert.equal(lerDadosDoConjunto('[]').ok, true);

  // Coluna vazia: `json_decode('')` devolve nulo COM erro de sintaxe.
  assert.deepEqual(lerDadosDoConjunto(''), {
    ok: false,
    erro: 'json_parse_error',
  });
  assert.deepEqual(lerDadosDoConjunto('{nao e json'), {
    ok: false,
    erro: 'json_parse_error',
  });
  // JSON valido que nao e arranjo.
  for (const conteudo of ['"texto"', '42', 'true', 'null']) {
    assert.deepEqual(lerDadosDoConjunto(conteudo), {
      ok: false,
      erro: 'expected_array',
    });
  }
});

test('os dois nulos dos parametros da configuracao tem significados opostos (RF-14)', () => {
  // `array_key_exists( 'value', ... )` (`:2744`): a chave existe com nulo.
  const comNulo = lerParametrosDaConfiguracao({ value: null });
  assert.equal(comNulo.temValor, true);
  assert.equal(comNulo.valor, null);

  // A chave nao existe: ausencia, que nao e invalidez.
  const semValor = lerParametrosDaConfiguracao({ type: 'theme_mod' });
  assert.equal(semValor.temValor, false);
  assert.equal(semValor.valor, null);

  const completo = lerParametrosDaConfiguracao({
    value: 'blue',
    type: 'theme_mod',
    user_id: 7,
    date_modified_gmt: '2026-10-11 12:00:00',
    starter_content: true,
  });
  assert.deepEqual(completo, {
    temValor: true,
    valor: 'blue',
    tipo: 'theme_mod',
    contaId: 7,
    modificadoEmGmt: '2026-10-11 12:00:00',
    conteudoInicial: true,
  });
});

test('a linha de posts e lida como conjunto sem interpretar nada', () => {
  const conjunto = lerConjuntoDeAlteracoes({
    ID: '12',
    post_author: 3,
    post_date: '2026-10-11 09:00:00',
    post_date_gmt: '0000-00-00 00:00:00',
    post_content: '[]',
    post_title: '',
    post_status: 'publish',
    post_name: '95e3e05a-4e98-4c4e-9e6b-3c8c4b7f7c2d',
    post_parent: '0',
    post_type: 'customize_changeset',
    comment_count: 0,
  });

  assert.equal(conjunto.id, 12);
  assert.equal(conjunto.autorId, 3);
  assert.equal(conjunto.identificador, '95e3e05a-4e98-4c4e-9e6b-3c8c4b7f7c2d');
  assert.equal(conjunto.conteudo, '[]');
  // Coluna ausente vira texto vazio ou zero, como no legado — nenhuma leitura
  // recusa linha (`DB-DEG`, BR-MIGRAR-083).
  assert.equal(conjunto.senha, '');
  assert.equal(conjunto.ordemNoMenu, 0);
  // O estado NAO e validado contra a maquina na leitura: o que entra na coluna
  // sai da coluna.
  assert.equal(conjunto.estado, 'publish');
});

test('levar o conjunto para a lixeira emite UM update, e nenhuma leitura', () => {
  const { falsa, alvo } = armazenamento();

  const linhas = alvo.conjuntoDeAlteracoes.levarParaALixeira(12);

  // `$wpdb->update( $wpdb->posts, array( 'post_status' => 'trash' ), array(
  // 'ID' => $post->ID ) )` (`class-wp-customize-manager.php:3105`) — direto na
  // tabela, sem passar por `wp_trash_post()`.
  assert.equal(linhas, 1);
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, [
    {
      texto: 'UPDATE wp_posts SET post_status = ? WHERE ID = ?',
      parametros: ['trash', 12],
    },
  ]);
});

// ── A linha de options ──────────────────────────────────────────────────────

test('ler opcao distingue linha ausente de valor vazio', () => {
  const { falsa, alvo } = armazenamento();
  const opcoes = alvo.configuracaoDoTema.opcoes;

  assert.equal(opcoes.ler('stylesheet'), null);
  assert.deepEqual(falsa.selecoes, [
    {
      texto:
        'SELECT option_value FROM wp_options WHERE option_name = ? LIMIT 1',
      parametros: ['stylesheet'],
    },
  ]);

  falsa.responder([{ option_value: '' }]);
  assert.deepEqual(opcoes.ler('stylesheet'), texto(''));
});

test('a ausencia lida como no legado e false, que e o default de get_option', () => {
  const { alvo } = armazenamento();

  assert.deepEqual(alvo.configuracaoDoTema.opcoes.lerComoNoLegado('qualquer'), {
    tipo: 'booleano',
    valor: false,
  });
});

test('valor serializado volta como arranjo, e serializado ilegivel volta como false', () => {
  const { falsa, alvo } = armazenamento();
  const opcoes = alvo.configuracaoDoTema.opcoes;

  const mods = arranjoPorNome([['header_textcolor', texto('blue')]]);
  falsa.responder([{ option_value: serializarComoTexto(mods) }]);
  assert.deepEqual(opcoes.ler('theme_mods_x'), mods);

  // `maybe_unserialize()` sobre texto que PARECE serializado e nao desserializa
  // devolve `false` — e o legado nao o distingue de um `false` gravado. O valor
  // abaixo passa por `is_serialized` (comeca com `a:1:{` e termina com `}`) e
  // falha na leitura, porque o tamanho declarado da cadeia nao e o dela.
  falsa.responder([{ option_value: 'a:1:{s:9:"abc";}' }]);
  assert.deepEqual(opcoes.ler('theme_mods_x'), {
    tipo: 'booleano',
    valor: false,
  });

  // E texto que NAO parece serializado volta como esta, inclusive quando e um
  // serializado truncado: `is_serialized` em modo estrito exige o ultimo byte
  // ser `;` ou `}`.
  falsa.responder([{ option_value: 'a:1:{s:3:"abc"' }]);
  assert.deepEqual(opcoes.ler('theme_mods_x'), texto('a:1:{s:3:"abc"'));
});

test('gravar o valor que ja esta gravado NAO emite escrita (option.php:923)', () => {
  const { falsa, alvo } = armazenamento();
  const opcoes = alvo.configuracaoDoTema.opcoes;

  falsa.responder([{ option_value: 'twentytwentyfive' }]);
  const gravou = opcoes.gravar('stylesheet', texto('twentytwentyfive'));

  assert.equal(gravou, false);
  assert.deepEqual(falsa.escritas, []);
});

test('gravar opcao ausente vai pelo INSERT ... ON DUPLICATE KEY UPDATE', () => {
  const { falsa, alvo } = armazenamento();
  const opcoes = alvo.configuracaoDoTema.opcoes;

  // Linha ausente: `get_option()` devolve `false`, que e igual ao default, e
  // `update_option()` delega a `add_option()` (`option.php:928`-`:930`).
  const gravou = opcoes.gravar('theme_mods_novo', arranjoPorNome([]));

  assert.equal(gravou, true);
  assert.equal(falsa.escritas.length, 1);
  const escrita = falsa.escritas[0];
  assert.equal(
    escrita?.texto,
    'INSERT INTO `wp_options` (`option_name`, `option_value`, `autoload`) ' +
      'VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ' +
      '`option_name` = VALUES(`option_name`), ' +
      '`option_value` = VALUES(`option_value`), ' +
      '`autoload` = VALUES(`autoload`)',
  );
  // O valor vai para a coluna em BYTES, porque o *codec* trabalha em bytes: e
  // sobre eles que a area 3 compara "byte a byte".
  assert.deepEqual(
    escrita?.parametros.map((parametro) => textoDoParametro(parametro)),
    ['theme_mods_novo', 'a:0:{}', CARGA_AUTOMATICA_INDECISA],
  );
});

test('acrescentar opcao que JA existe nao sobrescreve, e nao emite comando', () => {
  const { falsa, alvo } = armazenamento();

  // `add_option()` confere a existencia antes de inserir
  // (`option.php:1121`-`:1125`), e e por isso que `switch_theme()` a usa onde
  // NAO quer sobrescrever (`theme.php:818`-`:823`).
  falsa.responder([{ option_value: 'a:0:{}' }]);
  const acrescentou = alvo.configuracaoDoTema.opcoes.acrescentar(
    'theme_mods_twentytwentyfive',
    arranjoPorNome([['header_textcolor', texto('blue')]]),
  );

  assert.equal(acrescentou, false);
  assert.deepEqual(falsa.escritas, []);
});

test('gravar opcao existente com carga explicita escreve as duas colunas', () => {
  const { falsa, alvo } = armazenamento();
  const opcoes = alvo.configuracaoDoTema.opcoes;

  falsa.responder([{ option_value: 'antigo' }]);
  opcoes.gravar('theme_switch_menu_locations', texto('novo'), true);

  // `update_option( ..., true )` (`theme.php:786`): a coluna entra sempre, e o
  // valor gravado e `on`.
  assert.deepEqual(falsa.escritas, [
    {
      texto:
        'UPDATE wp_options SET option_value = ?, autoload = ? WHERE option_name = ?',
      parametros: ['novo', CARGA_AUTOMATICA_LIGADA, 'theme_switch_menu_locations'],
    },
  ]);
});

test('sem pedido de carga, a coluna decidida por heuristica e reavaliada e a explicita nao', () => {
  const grande = 'x'.repeat(TETO_DE_BYTES_DA_CARGA_AUTOMATICA + 1);

  // Coluna `auto`: o legado rele e reavalia (`option.php:951`-`:958`).
  const reavaliada = armazenamento();
  reavaliada.falsa.responder([{ option_value: 'curto' }]);
  reavaliada.falsa.responder([{ autoload: CARGA_AUTOMATICA_INDECISA }]);
  reavaliada.alvo.configuracaoDoTema.opcoes.gravar(
    'theme_mods_x',
    texto(grande),
  );
  assert.equal(
    reavaliada.falsa.escritas[0]?.texto,
    'UPDATE wp_options SET option_value = ?, autoload = ? WHERE option_name = ?',
  );
  assert.equal(
    reavaliada.falsa.escritas[0]?.parametros[1],
    CARGA_AUTOMATICA_DECIDIDA_DESLIGADA,
  );

  // Coluna `on`: nao e reavaliada, e o UPDATE toca uma coluna so.
  const explicita = armazenamento();
  explicita.falsa.responder([{ option_value: 'curto' }]);
  explicita.falsa.responder([{ autoload: CARGA_AUTOMATICA_LIGADA }]);
  explicita.alvo.configuracaoDoTema.opcoes.gravar(
    'theme_mods_x',
    texto(grande),
  );
  assert.equal(
    explicita.falsa.escritas[0]?.texto,
    'UPDATE wp_options SET option_value = ? WHERE option_name = ?',
  );
});

test('o teto de 150000 bytes da carga automatica tem borda estrita (P6)', () => {
  // `wp-includes/option.php:1362` e o filtro de fabrica de
  // `default-filters.php:299`. No teto exato ainda carrega; um byte acima, nao.
  assert.equal(TETO_DE_BYTES_DA_CARGA_AUTOMATICA, 150000);
  assert.equal(
    determinarCargaAutomatica(null, TETO_DE_BYTES_DA_CARGA_AUTOMATICA),
    CARGA_AUTOMATICA_INDECISA,
  );
  assert.equal(
    determinarCargaAutomatica(null, TETO_DE_BYTES_DA_CARGA_AUTOMATICA + 1),
    CARGA_AUTOMATICA_DECIDIDA_DESLIGADA,
  );

  // Pedido explicito ignora o tamanho, nos cinco formatos que o legado aceita.
  assert.equal(determinarCargaAutomatica(true, 0), CARGA_AUTOMATICA_LIGADA);
  assert.equal(determinarCargaAutomatica('yes', 0), CARGA_AUTOMATICA_LIGADA);
  assert.equal(determinarCargaAutomatica('on', 0), CARGA_AUTOMATICA_LIGADA);
  assert.equal(determinarCargaAutomatica(false, 0), CARGA_AUTOMATICA_DESLIGADA);
  assert.equal(determinarCargaAutomatica('no', 0), CARGA_AUTOMATICA_DESLIGADA);
  assert.equal(determinarCargaAutomatica('off', 0), CARGA_AUTOMATICA_DESLIGADA);

  // E `yes` continua na lista do que CARREGA, porque e o default do DDL.
  assert.deepEqual(VALORES_DE_CARGA_AUTOMATICA_QUE_CARREGAM, [
    'yes',
    'on',
    'auto-on',
    'auto',
  ]);
});

test('apagar opcao que nao existe nao emite DELETE, e a leitura dela e sem LIMIT', () => {
  const { falsa, alvo } = armazenamento();

  assert.equal(alvo.configuracaoDoTema.opcoes.apagar('template_root'), false);
  // `delete_option()` le a carga automatica primeiro, e a consulta dela NAO tem
  // `LIMIT` (`option.php:1215`), diferente da de `update_option()` (`:953`).
  assert.deepEqual(falsa.selecoes, [
    {
      texto: 'SELECT autoload FROM wp_options WHERE option_name = ?',
      parametros: ['template_root'],
    },
  ]);
  assert.deepEqual(falsa.escritas, []);
});

test('apagar opcao existente emite o DELETE', () => {
  const { falsa, alvo } = armazenamento();

  falsa.responder([{ autoload: CARGA_AUTOMATICA_LIGADA }]);
  assert.equal(alvo.configuracaoDoTema.opcoes.apagar('template_root'), true);
  assert.deepEqual(falsa.escritas, [
    {
      texto: 'DELETE FROM wp_options WHERE option_name = ?',
      parametros: ['template_root'],
    },
  ]);
});

// ── A configuracao do tema ──────────────────────────────────────────────────

test('o tema ativo sao tres opcoes, e a ausencia de cada uma e nula', () => {
  const { falsa, alvo } = armazenamento();

  falsa.responder([{ option_value: TEMA }]);
  falsa.responder([{ option_value: TEMA }]);
  const ativo = alvo.configuracaoDoTema.temaAtivo();

  assert.deepEqual(ativo, {
    folhaDeEstilo: TEMA,
    modelo: TEMA,
    // `current_theme` ausente: o legado recorreria ao cabecalho de `style.css`,
    // que e leitura de disco e e de T025/T031.
    nome: null,
  });
  assert.deepEqual(
    falsa.selecoes.map((consulta) => consulta.parametros[0]),
    [OPCAO_DA_FOLHA_DE_ESTILO, 'template', OPCAO_DO_NOME_DO_TEMA],
  );
});

test('as modificacoes do tema saem da opcao nova, e a cadeia de recurso nao e consultada', () => {
  const { falsa, alvo } = armazenamento();
  const mods = arranjoPorNome([
    ['nav_menu_locations', arranjoPorNome([['primary', inteiro(4)]])],
  ]);

  falsa.responder([{ option_value: serializarComoTexto(mods) }]);
  const lidas = alvo.configuracaoDoTema.modificacoes(TEMA);

  assert.deepEqual(lidas.valores, mods);
  assert.equal(lidas.daLocalizacaoAntiga, false);
  // Uma consulta so: a localizacao obsoleta nao e lida quando a nova existe.
  assert.equal(falsa.selecoes.length, 1);
});

test('opcao ausente faz a leitura cair na localizacao obsoleta, pelo NOME do tema', () => {
  const { falsa, alvo } = armazenamento();
  const antigas = arranjoPorNome([['header_textcolor', texto('blue')]]);

  // `theme_mods_{folha}` ausente -> `false` -> le `current_theme` -> le
  // `mods_{Nome}` (`theme.php:1030`-`:1040`).
  falsa.responder([]);
  falsa.responder([{ option_value: 'Twenty Twenty-Five' }]);
  falsa.responder([{ option_value: serializarComoTexto(antigas) }]);

  const lidas = alvo.configuracaoDoTema.modificacoes(TEMA);

  assert.deepEqual(lidas.valores, antigas);
  assert.equal(lidas.daLocalizacaoAntiga, true);
  assert.deepEqual(
    falsa.selecoes.map((consulta) => consulta.parametros[0]),
    ['theme_mods_twentytwentyfive', 'current_theme', 'mods_Twenty Twenty-Five'],
  );
});

test('arranjo vazio gravado NAO dispara a cadeia de recurso (false ===, nao empty)', () => {
  const { falsa, alvo } = armazenamento();

  falsa.responder([{ option_value: 'a:0:{}' }]);
  const lidas = alvo.configuracaoDoTema.modificacoes(TEMA);

  assert.deepEqual(lidas.valores, arranjoPorNome([]));
  assert.equal(falsa.selecoes.length, 1);
});

test('valor que nao e arranjo vira arranjo vazio na leitura, mas e preservado como gravado', () => {
  const { falsa, alvo } = armazenamento();

  falsa.responder([{ option_value: 'nao sou arranjo' }]);
  const lidas = alvo.configuracaoDoTema.modificacoes(TEMA);

  // `if ( ! is_array( $mods ) ) { $mods = array(); }` (`theme.php:1043`).
  assert.deepEqual(lidas.valores, arranjoPorNome([]));
  // E o cru, que e o que a migracao do legado gravaria (`:1038`).
  assert.deepEqual(lidas.valorGravado, texto('nao sou arranjo'));
});

test('ler uma modificacao e isset, nao comparacao com vazio', () => {
  const { falsa, alvo } = armazenamento();
  const mods = arranjoPorNome([['header_textcolor', texto('')]]);

  falsa.responder([{ option_value: serializarComoTexto(mods) }]);
  assert.deepEqual(
    alvo.configuracaoDoTema.modificacao(TEMA, 'header_textcolor'),
    texto(''),
  );

  falsa.responder([{ option_value: serializarComoTexto(mods) }]);
  assert.equal(
    alvo.configuracaoDoTema.modificacao(TEMA, 'nao_existe'),
    undefined,
  );
});

test('gravar uma modificacao grava o ARRANJO INTEIRO, com a chave nova no fim', () => {
  const { falsa, alvo } = armazenamento();
  const mods = arranjoPorNome([['header_textcolor', texto('blue')]]);

  // Duas respostas para a MESMA linha, e e a consequencia declarada em
  // `opcao.ts`: `set_theme_mod()` le por `get_theme_mods()` e `update_option()`
  // le de novo para comparar (`option.php:887`). No legado a segunda leitura e
  // acerto do cache de objeto; aqui ela e consulta, porque o cache e porta de
  // AD-08 que esta feature so declara em T025. A sequencia de ESCRITA e a mesma.
  falsa.responder([{ option_value: serializarComoTexto(mods) }]);
  falsa.responder([{ option_value: serializarComoTexto(mods) }]);
  // `set_theme_mod()` le, atribui e grava a opcao inteira
  // (`theme.php:1105`-`:1126`).
  alvo.configuracaoDoTema.definirModificacao(
    TEMA,
    'nav_menu_locations',
    arranjoPorNome([['primary', inteiro(4)]]),
  );

  const esperado = atribuirChave(
    mods,
    'nav_menu_locations',
    arranjoPorNome([['primary', inteiro(4)]]),
  );
  assert.equal(falsa.escritas.length, 1);
  assert.equal(
    falsa.escritas[0]?.texto,
    'UPDATE wp_options SET option_value = ? WHERE option_name = ?',
  );
  assert.deepEqual(
    falsa.escritas[0]?.parametros.map((parametro) =>
      textoDoParametro(parametro),
    ),
    [serializarComoTexto(esperado), 'theme_mods_twentytwentyfive'],
  );
});

test('a atribuicao substitui no lugar e acrescenta no fim, porque a ordem e byte-observavel', () => {
  const base = arranjoPorNome([
    ['a', texto('1')],
    ['b', texto('2')],
  ]);

  const substituido = atribuirChave(base, 'a', texto('9'));
  assert.equal(
    serializarComoTexto(substituido),
    serializarComoTexto(
      arranjoPorNome([
        ['a', texto('9')],
        ['b', texto('2')],
      ]),
    ),
  );

  const acrescentado = atribuirChave(base, 'c', texto('3'));
  assert.equal(
    serializarComoTexto(acrescentado),
    serializarComoTexto(
      arranjoPorNome([
        ['a', texto('1')],
        ['b', texto('2')],
        ['c', texto('3')],
      ]),
    ),
  );
  assert.deepEqual(valorDaChave(acrescentado, 'c'), texto('3'));
});

test('remover modificacao que nao existe nao emite comando nenhum', () => {
  const { falsa, alvo } = armazenamento();
  const mods = arranjoPorNome([['header_textcolor', texto('blue')]]);

  falsa.responder([{ option_value: serializarComoTexto(mods) }]);
  alvo.configuracaoDoTema.removerModificacao(TEMA, 'nao_existe');

  // `if ( ! isset( $mods[ $name ] ) ) { return; }` (`theme.php:1141`).
  assert.deepEqual(falsa.escritas, []);
});

test('remover a ULTIMA modificacao apaga as duas opcoes, e nao grava arranjo vazio', () => {
  const { falsa, alvo } = armazenamento();
  const mods = arranjoPorNome([['sidebars_widgets', arranjoPorNome([])]]);

  falsa.responder([{ option_value: serializarComoTexto(mods) }]);
  falsa.responder([{ autoload: CARGA_AUTOMATICA_LIGADA }]);
  falsa.responder([{ autoload: CARGA_AUTOMATICA_LIGADA }]);

  // O Nome do tema chega por argumento: sem ele, o legado o buscaria em
  // `current_theme` e, na ausencia, no cabecalho de `style.css` — leitura de
  // disco que este modulo nao faz.
  alvo.configuracaoDoTema.removerModificacao(
    TEMA,
    'sidebars_widgets',
    'Twenty Twenty-Five',
  );

  // `if ( empty( $mods ) ) { remove_theme_mods(); return; }` (`:1147`-`:1150`),
  // e `remove_theme_mods()` apaga a nova E a obsoleta (`:1163`, `:1171`).
  assert.deepEqual(
    falsa.escritas.map((consulta) => consulta.parametros[0]),
    ['theme_mods_twentytwentyfive', 'mods_Twenty Twenty-Five'],
  );
  assert.equal(
    falsa.escritas.every((consulta) =>
      consulta.texto.startsWith('DELETE FROM wp_options'),
    ),
    true,
  );
});

test('remover modificacao com outras sobrando grava o arranjo sem ela', () => {
  const { falsa, alvo } = armazenamento();
  const mods = arranjoPorNome([
    ['header_textcolor', texto('blue')],
    ['sidebars_widgets', arranjoPorNome([])],
  ]);

  // Duas respostas pela mesma razao do teste de `set_theme_mod()`: sem cache de
  // objeto, a comparacao de `update_option()` e uma segunda consulta.
  falsa.responder([{ option_value: serializarComoTexto(mods) }]);
  falsa.responder([{ option_value: serializarComoTexto(mods) }]);
  alvo.configuracaoDoTema.removerModificacao(TEMA, 'sidebars_widgets');

  assert.equal(falsa.escritas.length, 1);
  assert.equal(
    falsa.escritas[0]?.texto,
    'UPDATE wp_options SET option_value = ? WHERE option_name = ?',
  );
  assert.deepEqual(
    falsa.escritas[0]?.parametros.map((parametro) =>
      textoDoParametro(parametro),
    ),
    [
      serializarComoTexto(arranjoPorNome([['header_textcolor', texto('blue')]])),
      'theme_mods_twentytwentyfive',
    ],
  );
});

test('a migracao da localizacao obsoleta sao dois comandos, e a guarda de painel nao e daqui', () => {
  const { falsa, alvo } = armazenamento();
  const antigas = arranjoPorNome([['header_textcolor', texto('blue')]]);

  falsa.responder([]);
  falsa.responder([{ autoload: CARGA_AUTOMATICA_LIGADA }]);
  alvo.configuracaoDoTema.migrarModificacoesAntigas(
    TEMA,
    'Twenty Twenty-Five',
    antigas,
  );

  // `update_option( "theme_mods_$theme_slug", $mods ); delete_option(
  // "mods_$theme_name" );` (`theme.php:1038`-`:1039`), nessa ordem.
  assert.equal(falsa.escritas.length, 2);
  assert.equal(
    falsa.escritas[0]?.texto.startsWith('INSERT INTO `wp_options`'),
    true,
  );
  assert.equal(
    falsa.escritas[1]?.texto,
    'DELETE FROM wp_options WHERE option_name = ?',
  );
  assert.equal(falsa.escritas[1]?.parametros[0], 'mods_Twenty Twenty-Five');
});

// ── A troca de carga automatica na troca de tema (area 3) ───────────────────

test('mover a carga automatica na troca de tema sao UMA leitura e DUAS escritas', () => {
  const { falsa, alvo } = armazenamento();

  // A leitura devolve `option_name`, porque e essa a coluna que o legado pede.
  falsa.responder([
    { option_name: 'theme_mods_novo' },
    { option_name: 'theme_mods_velho' },
  ]);
  alvo.configuracaoDoTema.moverCargaAutomaticaDasModificacoes(
    'novo',
    'velho',
  );

  // `wp_set_option_autoload_values()` (`option.php:397`): um `SELECT
  // option_name` com os dois baldes em `OR`, e no maximo dois `UPDATE`.
  assert.deepEqual(falsa.selecoes, [
    {
      texto:
        'SELECT option_name FROM wp_options ' +
        'WHERE autoload != ? AND option_name IN (?) ' +
        'OR autoload != ? AND option_name IN (?)',
      parametros: ['on', 'theme_mods_novo', 'off', 'theme_mods_velho'],
    },
  ]);
  // Os valores GRAVADOS sao `on` e `off`, mesmo com o legado pedindo `yes`/`no`
  // (`theme.php:857`-`:860`).
  assert.deepEqual(falsa.escritas, [
    {
      texto: 'UPDATE wp_options SET autoload = ? WHERE option_name IN (?)',
      parametros: ['on', 'theme_mods_novo'],
    },
    {
      texto: 'UPDATE wp_options SET autoload = ? WHERE option_name IN (?)',
      parametros: ['off', 'theme_mods_velho'],
    },
  ]);
});

test('carga automatica que todas as linhas ja tem nao emite UPDATE nenhum', () => {
  const { falsa, alvo } = armazenamento();

  // `if ( ! $options_to_update ) { return $results; }` (`option.php:445`).
  const resultado = alvo.configuracaoDoTema.opcoes.definirCargaAutomatica([
    ['theme_mods_novo', 'yes'],
    ['theme_mods_velho', 'no'],
  ]);

  assert.equal(falsa.selecoes.length, 1);
  assert.deepEqual(falsa.escritas, []);
  assert.deepEqual(resultado, [
    { nome: 'theme_mods_novo', atualizada: false },
    { nome: 'theme_mods_velho', atualizada: false },
  ]);
});

test('lote de carga automatica sem pedido nenhum nao consulta nada', () => {
  const { falsa, alvo } = armazenamento();

  assert.deepEqual(
    alvo.configuracaoDoTema.opcoes.definirCargaAutomatica([]),
    [],
  );
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

// ── Invariantes de arquitetura ──────────────────────────────────────────────

test('compor o armazenamento nao toca em porta nenhuma (EXT-ORDEM)', () => {
  const falsa = criarPortaDeDadosFalsa();

  criarArmazenamentoDaApresentacao(falsa.porta);

  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('dois armazenamentos de sites diferentes nao se enxergam (EXT-CONTEXTO, CA-8.5)', () => {
  const primeiro = armazenamento('wp_');
  const segundo = armazenamento('wp_7_');

  primeiro.alvo.conjuntoDeAlteracoes.levarParaALixeira(1);

  assert.equal(primeiro.falsa.escritas.length, 1);
  assert.equal(segundo.falsa.escritas.length, 0);
  assert.equal(
    primeiro.falsa.escritas[0]?.texto.includes('wp_posts'),
    true,
  );

  segundo.alvo.conjuntoDeAlteracoes.levarParaALixeira(1);
  assert.equal(
    segundo.falsa.escritas[0]?.texto.includes('wp_7_posts'),
    true,
  );
});

test('o armazenamento nao expoe operacao, e por isso nao declara permissao (P4)', () => {
  const { alvo } = armazenamento();

  assert.deepEqual(Object.keys(alvo).sort(), [
    'configuracaoDoTema',
    'conjuntoDeAlteracoes',
  ]);
  assert.deepEqual(Object.keys(alvo.conjuntoDeAlteracoes).sort(), [
    'levarParaALixeira',
  ]);
  assert.deepEqual(Object.keys(alvo.configuracaoDoTema).sort(), [
    'definirModificacao',
    'migrarModificacoesAntigas',
    'modificacao',
    'modificacoes',
    'moverCargaAutomaticaDasModificacoes',
    'opcoes',
    'removerModificacao',
    'removerModificacoes',
    'temaAtivo',
  ]);
});

test('nenhum valor de modificacao e interpretado: o arranjo e a verdade', () => {
  // A estrutura e aberta — tema e extensao gravam modificacao propria por
  // `set_theme_mod()`, que e funcao publica (P8). O tipo que atravessa o
  // armazenamento e `ValorPhp`, e uma modificacao desconhecida sobrevive a ida e
  // volta.
  const desconhecida: ValorPhp = arranjoPorNome([
    ['extensao_de_terceiro', arranjoPorNome([['x', inteiro(1)]])],
  ]);

  assert.deepEqual(
    valorDaChave(desconhecida, 'extensao_de_terceiro'),
    arranjoPorNome([['x', inteiro(1)]]),
  );
});
