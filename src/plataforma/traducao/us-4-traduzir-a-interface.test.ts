/**
 * Testes de **T009** — US-4, *"traduzir a interface a partir de catalogo
 * declarado e atualizavel"*: um bloco por criterio de aceite, CA-4.1 a CA-4.5.
 *
 * Nao sao os testes do catalogo (`backlog/tests.md`, UT-166-1 a UT-166-6): esses
 * sao **T010**, e transcrevem os casos de la.
 *
 * ⚠️ **Nenhum catalogo real entra aqui.** Os catalogos nao estao na arvore
 * analisada (lacuna L5 de `soul.md`); os desta suite sao montados por
 * {@link montarMo} no layout que o proprio legado escreve
 * (`WP_Translation_File_MO::export()`, `class-wp-translation-file-mo.php:184`):
 * cabecalho de 28 bytes, as duas tabelas de pares, e as cadeias terminadas em
 * `\0`. O vetor contra arquivo de verdade sai do oraculo de T001.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { CONCESSOES_POR_EXTENSAO_DE_FABRICA } from '../autorizacao/index.js';
import {
  CAPACIDADE_DE_INSTALAR_CATALOGO,
  ErroNaAvaliacaoDoPlural,
  IDIOMA_DE_FABRICA,
  compilarExpressaoDePlural,
  criarCatalogoQueRegistra,
  criarModuloDeTraducao,
  formaDePlural,
  idiomaDaConta,
  idiomaDaInstalacao,
  idiomaDaRequisicao,
  instalacaoDeCatalogoAutorizada,
  instalacaoDeCatalogoPossivel,
  lerCatalogoMo,
  type FiltrosDaTraducao,
} from './index.js';

const CODIFICADOR = new TextEncoder();

/**
 * Um `.mo` no layout de `export()`: `[original, traducao]`, com o cabecalho
 * como a entrada de chave vazia. `\0` separa singular e plural; `\x04` separa
 * contexto e texto.
 */
function montarMo(
  cabecalho: string,
  entradas: readonly (readonly [string, string])[],
  ordem: 'V' | 'N' = 'V',
  revisao = 0,
): Uint8Array {
  const todas: (readonly [string, string])[] = [['', cabecalho], ...entradas];
  const originais = todas.map(([o]) => CODIFICADOR.encode(o));
  const traducoes = todas.map(([, t]) => CODIFICADOR.encode(t));
  const n = todas.length;
  const enderecoDosOriginais = 28;
  const enderecoDasTraducoes = enderecoDosOriginais + n * 8;
  const enderecoDaDispersao = enderecoDasTraducoes + n * 8;
  let deslocamento = enderecoDaDispersao;
  const pares: number[] = [];
  for (const cadeia of [...originais, ...traducoes]) {
    pares.push(cadeia.length, deslocamento);
    deslocamento += cadeia.length + 1;
  }
  const bytes = new Uint8Array(deslocamento);
  const vista = new DataView(bytes.buffer);
  const escrever = (posicao: number, valor: number): void =>
    vista.setUint32(posicao, valor, ordem === 'V');
  [0x950412de, revisao, n, enderecoDosOriginais, enderecoDasTraducoes, 0, enderecoDaDispersao].forEach(
    (valor, i) => escrever(i * 4, valor),
  );
  pares.forEach((valor, i) => escrever(enderecoDosOriginais + i * 4, valor));
  let posicao = enderecoDaDispersao;
  for (const cadeia of [...originais, ...traducoes]) {
    bytes.set(cadeia, posicao);
    posicao += cadeia.length + 1;
  }
  return bytes;
}

const CABECALHO_PT_BR =
  'Content-Type: text/plain; charset=UTF-8\nPlural-Forms: nplurals=2; plural=n > 1;\n';

const CATALOGO_PT_BR = montarMo(CABECALHO_PT_BR, [
  ['Posts', 'Posts traduzidos'],
  ['Save Draft', 'Salvar rascunho'],
  ['post type general name\u0004Posts', 'Publicacoes'],
  ['%s post\u0000%s posts', '%s publicacao\u0000%s publicacoes'],
  ['comment count\u0004%s item\u0000%s items', '%s comentario\u0000%s comentarios'],
  ['%1$s by %2$s', '%2$s escreveu %1$s'],
]);

function moduloCom(
  programar: (catalogo: ReturnType<typeof criarCatalogoQueRegistra>) => void = () => {},
) {
  const catalogo = criarCatalogoQueRegistra();
  programar(catalogo);
  return { catalogo, modulo: criarModuloDeTraducao({ catalogo: catalogo.porta }) };
}

// ---------------------------------------------------------------------------
// CA-4.1 — o idioma da interface e configuravel por instalacao e por conta
// ---------------------------------------------------------------------------

test('CA-4.1: instalacao nova, sem opcao nem constante, fala en_US', () => {
  assert.equal(IDIOMA_DE_FABRICA, 'en_US');
  assert.equal(idiomaDaInstalacao({ opcoes: { rede: false, opcaoDoSite: false } }), 'en_US');
});

test('CA-4.1: a opcao WPLANG gravada configura o idioma da instalacao', () => {
  assert.equal(idiomaDaInstalacao({ opcoes: { rede: false, opcaoDoSite: 'pt_BR' } }), 'pt_BR');
});

test('CA-4.1: pacote local, depois constante, depois opcao — a opcao vence', () => {
  assert.equal(
    idiomaDaInstalacao({ pacoteLocal: 'fr_FR', opcoes: { rede: false, opcaoDoSite: false } }),
    'fr_FR',
  );
  assert.equal(
    idiomaDaInstalacao({
      pacoteLocal: 'fr_FR',
      constanteWplang: 'de_DE',
      opcoes: { rede: false, opcaoDoSite: false },
    }),
    'de_DE',
  );
  assert.equal(
    idiomaDaInstalacao({
      pacoteLocal: 'fr_FR',
      constanteWplang: 'de_DE',
      opcoes: { rede: false, opcaoDoSite: 'pt_BR' },
    }),
    'pt_BR',
  );
});

test('CA-4.1: opcao gravada vazia sobrescreve a constante, e o vazio cai em en_US', () => {
  assert.equal(
    idiomaDaInstalacao({ constanteWplang: 'de_DE', opcoes: { rede: false, opcaoDoSite: '' } }),
    'en_US',
  );
  assert.equal(idiomaDaInstalacao({ opcoes: { rede: false, opcaoDoSite: '0' } }), 'en_US');
});

test('CA-4.1: em rede, a opcao do site antes da da rede; instalando, so a da rede', () => {
  const lidas: string[] = [];
  const opcoes = (instalando: boolean, doSite: string | false) => ({
    rede: true as const,
    instalando,
    opcaoDoSite: () => {
      lidas.push('site');
      return doSite;
    },
    opcaoDaRede: () => {
      lidas.push('rede');
      return 'es_ES';
    },
  });

  assert.equal(idiomaDaInstalacao({ opcoes: opcoes(false, 'pt_BR') }), 'pt_BR');
  assert.deepEqual(lidas.splice(0), ['site']);

  assert.equal(idiomaDaInstalacao({ opcoes: opcoes(false, false) }), 'es_ES');
  assert.deepEqual(lidas.splice(0), ['site', 'rede']);

  assert.equal(idiomaDaInstalacao({ opcoes: opcoes(true, 'pt_BR') }), 'es_ES');
  assert.deepEqual(lidas.splice(0), ['rede']);
});

test('CA-4.1: o ponto `locale` altera o idioma da instalacao', () => {
  assert.equal(
    idiomaDaInstalacao({
      opcoes: { rede: false, opcaoDoSite: 'pt_BR' },
      filtros: [(idioma) => `${idioma}-x`, (idioma) => idioma.toUpperCase()],
    }),
    'PT_BR-X',
  );
});

test('CA-4.1: a conta com idioma proprio fala o dela, sem perguntar a instalacao', () => {
  let perguntou = false;
  const instalacao = (): string => {
    perguntou = true;
    return 'pt_BR';
  };

  assert.equal(idiomaDaConta({ idioma: 'de_DE' }, instalacao), 'de_DE');
  assert.equal(perguntou, false);
});

test('CA-4.1: conta sem idioma, com idioma vazio, ou ausente, fala o da instalacao', () => {
  const instalacao = (): string => 'pt_BR';

  assert.equal(idiomaDaConta({}, instalacao), 'pt_BR');
  assert.equal(idiomaDaConta({ idioma: '' }, instalacao), 'pt_BR');
  assert.equal(idiomaDaConta({ idioma: '0' }, instalacao), 'pt_BR');
  assert.equal(idiomaDaConta(null, instalacao), 'pt_BR');
});

test('CA-4.1: no painel vale o idioma da conta; no site publico, o da instalacao', () => {
  const chamadas: string[] = [];
  const fontes = {
    idiomaDaInstalacao: () => {
      chamadas.push('instalacao');
      return 'pt_BR';
    },
    idiomaDaConta: () => {
      chamadas.push('conta');
      return 'de_DE';
    },
  };

  assert.equal(idiomaDaRequisicao({ noPainel: true }, fontes), 'de_DE');
  assert.deepEqual(chamadas.splice(0), ['conta']);

  assert.equal(idiomaDaRequisicao({}, fontes), 'pt_BR');
  assert.deepEqual(chamadas.splice(0), ['instalacao']);

  assert.equal(idiomaDaRequisicao({ localeNaConsulta: 'user', pedidoJson: true }, fontes), 'de_DE');
  assert.equal(idiomaDaRequisicao({ localeNaConsulta: 'user', pedidoJson: false }, fontes), 'pt_BR');
});

test('CA-4.1: na tela de entrada, `wp_lang` da consulta antes do cookie, sanitizado', () => {
  const fontes = { idiomaDaInstalacao: () => 'pt_BR', idiomaDaConta: () => 'de_DE' };

  assert.equal(
    idiomaDaRequisicao(
      { telaDeEntrada: true, wpLangNaConsulta: 'fr_FR<x>', wpLangNoCookie: 'it_IT' },
      fontes,
    ),
    'fr_FRx',
  );
  assert.equal(idiomaDaRequisicao({ telaDeEntrada: true, wpLangNoCookie: 'it_IT' }, fontes), 'it_IT');
  // A sanitizacao que esvazia cai na instalacao.
  assert.equal(idiomaDaRequisicao({ telaDeEntrada: true, wpLangNaConsulta: '<>' }, fontes), 'pt_BR');
  // Fora da tela de entrada, `wp_lang` nao vale.
  assert.equal(idiomaDaRequisicao({ wpLangNaConsulta: 'fr_FR' }, fontes), 'pt_BR');
});

test('CA-4.1: instalando, o idioma escolhido na tela do instalador, senao o do pacote', () => {
  const fontes = { idiomaDaInstalacao: () => 'en_US', idiomaDaConta: () => 'de_DE' };

  assert.equal(
    idiomaDaRequisicao({ instalando: true, idiomaPedidoNaInstalacao: 'pt_BR' }, fontes),
    'pt_BR',
  );
  assert.equal(idiomaDaRequisicao({ instalando: true, pacoteLocal: 'ja' }, fontes), 'ja');
  assert.equal(idiomaDaRequisicao({ idiomaPedidoNaInstalacao: 'pt_BR' }, fontes), 'en_US');
});

test('CA-4.1: `pre_determine_locale` encerra a determinacao sem passar por `determine_locale`', () => {
  const fontes = {
    idiomaDaInstalacao: () => 'pt_BR',
    idiomaDaConta: () => 'de_DE',
    filtrosAntes: [() => 'ko_KR'],
    filtros: [(idioma: string) => `${idioma}!`],
  };

  assert.equal(idiomaDaRequisicao({ noPainel: true }, fontes), 'ko_KR');
  assert.equal(
    idiomaDaRequisicao({ noPainel: true }, { ...fontes, filtrosAntes: [() => ''] }),
    'de_DE!',
  );
});

test('CA-4.1: o tradutor fala o idioma que recebeu, e duas requisicoes nao se enxergam', () => {
  const { catalogo, modulo } = moduloCom((c) => c.programar('default', 'pt_BR', CATALOGO_PT_BR));

  const emPortugues = modulo.criarTradutor({ idioma: 'pt_BR' });
  const emIngles = modulo.criarTradutor({ idioma: 'en_US' });

  assert.equal(emPortugues.traduzir({ forma: 'texto', texto: 'Save Draft', dominio: 'default' }), 'Salvar rascunho');
  assert.equal(emIngles.traduzir({ forma: 'texto', texto: 'Save Draft', dominio: 'default' }), 'Save Draft');
  assert.deepEqual(catalogo.leituras, [
    { dominio: 'default', idioma: 'pt_BR' },
    { dominio: 'default', idioma: 'en_US' },
  ]);
});

// ---------------------------------------------------------------------------
// CA-4.2 — os textos vem de catalogo externo ao codigo, atualizavel sem alterar o sistema
// ---------------------------------------------------------------------------

test('CA-4.2: o texto sai do catalogo que a porta entrega', () => {
  const { modulo } = moduloCom((c) => c.programar('default', 'pt_BR', CATALOGO_PT_BR));
  const tradutor = modulo.criarTradutor({ idioma: 'pt_BR' });

  assert.equal(tradutor.traduzir({ forma: 'texto', texto: 'Posts', dominio: 'default' }), 'Posts traduzidos');
});

test('CA-4.2: trocar o catalogo troca o texto, sem trocar codigo', () => {
  const atualizado = montarMo(CABECALHO_PT_BR, [['Save Draft', 'Guardar rascunho']]);
  const pedido = { forma: 'texto', texto: 'Save Draft', dominio: 'default' } as const;

  const antes = moduloCom((c) => c.programar('default', 'pt_BR', CATALOGO_PT_BR));
  const depois = moduloCom((c) => c.programar('default', 'pt_BR', atualizado));

  assert.equal(antes.modulo.criarTradutor({ idioma: 'pt_BR' }).traduzir(pedido), 'Salvar rascunho');
  assert.equal(depois.modulo.criarTradutor({ idioma: 'pt_BR' }).traduzir(pedido), 'Guardar rascunho');
});

test('CA-4.2: cada dominio tem o seu catalogo, lido uma vez por requisicao', () => {
  const daExtensao = montarMo(CABECALHO_PT_BR, [['Posts', 'Artigos da extensao']]);
  const { catalogo, modulo } = moduloCom((c) => {
    c.programar('default', 'pt_BR', CATALOGO_PT_BR);
    c.programar('akismet', 'pt_BR', daExtensao);
  });
  const tradutor = modulo.criarTradutor({ idioma: 'pt_BR' });

  assert.equal(tradutor.traduzir({ forma: 'texto', texto: 'Posts', dominio: 'akismet' }), 'Artigos da extensao');
  assert.equal(tradutor.traduzir({ forma: 'texto', texto: 'Posts', dominio: 'default' }), 'Posts traduzidos');
  tradutor.traduzir({ forma: 'texto', texto: 'Save Draft', dominio: 'default' });

  assert.deepEqual(catalogo.leituras, [
    { dominio: 'akismet', idioma: 'pt_BR' },
    { dominio: 'default', idioma: 'pt_BR' },
  ]);
});

test('CA-4.2: o leitor aceita as duas ordens de bytes, e guarda o cabecalho em minusculas', () => {
  for (const ordem of ['V', 'N'] as const) {
    const lido = lerCatalogoMo(montarMo(CABECALHO_PT_BR, [['Posts', 'Publicacoes']], ordem));

    assert.equal(lido.erro, null);
    assert.equal(lido.entradas.get('Posts'), 'Publicacoes');
    assert.equal(lido.cabecalhos.get('plural-forms'), 'nplurals=2; plural=n > 1;');
    assert.equal(lido.cabecalhos.get('content-type'), 'text/plain; charset=UTF-8');
  }
});

test('CA-4.2: a chave e so o singular, e o contexto vai na frente dela', () => {
  const lido = lerCatalogoMo(CATALOGO_PT_BR);

  assert.equal(lido.entradas.get('%s post'), '%s publicacao\u0000%s publicacoes');
  assert.equal(lido.entradas.has('%s post\u0000%s posts'), false);
  assert.equal(lido.entradas.get('post type general name\u0004Posts'), 'Publicacoes');
});

test('CA-4.2: arquivo invalido e lido como vazio, com a mensagem do legado', () => {
  assert.equal(lerCatalogoMo(new Uint8Array(10)).erro, 'Invalid data');
  assert.equal(lerCatalogoMo(new Uint8Array(40)).erro, 'Magic marker does not exist');
  const revisaoUm = lerCatalogoMo(montarMo('', [['Posts', 'Publicacoes']], 'V', 1));
  assert.equal(revisaoUm.erro, 'Unsupported revision');
  assert.equal(revisaoUm.entradas.size, 0);
});

// ---------------------------------------------------------------------------
// CA-4.3 — texto sem traducao cai no idioma de origem, sem erro e sem espaco vazio
// ---------------------------------------------------------------------------

test('CA-4.3: sem catalogo nenhum, as quatro formas devolvem o texto de origem', () => {
  const { modulo } = moduloCom();
  const tradutor = modulo.criarTradutor({ idioma: 'pt_BR' });

  assert.equal(tradutor.traduzir({ forma: 'texto', texto: 'Posts', dominio: 'default' }), 'Posts');
  assert.equal(
    tradutor.traduzir({ forma: 'com-contexto', texto: 'Posts', contexto: 'post type general name', dominio: 'default' }),
    'Posts',
  );
  for (const [numero, esperado] of [[1, '%s post'], [0, '%s posts'], [2, '%s posts'], [1.9, '%s post']] as const) {
    assert.equal(
      tradutor.traduzir({ forma: 'com-plural', singular: '%s post', plural: '%s posts', numero, dominio: 'default' }),
      esperado,
    );
    assert.equal(
      tradutor.traduzir({
        forma: 'com-plural-e-contexto',
        singular: '%s post',
        plural: '%s posts',
        numero,
        contexto: 'x',
        dominio: 'default',
      }),
      esperado,
    );
  }
});

test('CA-4.3: o dominio sem catalogo fica marcado, e a porta nao e consultada de novo', () => {
  const { catalogo, modulo } = moduloCom();
  const tradutor = modulo.criarTradutor({ idioma: 'pt_BR' });

  tradutor.traduzir({ forma: 'texto', texto: 'Posts', dominio: 'default' });
  tradutor.traduzir({ forma: 'texto', texto: 'Pages', dominio: 'default' });

  assert.deepEqual(catalogo.leituras, [{ dominio: 'default', idioma: 'pt_BR' }]);
});

test('CA-4.3: com catalogo, a entrada ausente devolve o texto de origem', () => {
  const { modulo } = moduloCom((c) => c.programar('default', 'pt_BR', CATALOGO_PT_BR));
  const tradutor = modulo.criarTradutor({ idioma: 'pt_BR' });

  assert.equal(tradutor.traduzir({ forma: 'texto', texto: 'Pages', dominio: 'default' }), 'Pages');
  assert.equal(
    tradutor.traduzir({ forma: 'com-plural', singular: '%s page', plural: '%s pages', numero: 3, dominio: 'default' }),
    '%s pages',
  );
});

test('CA-4.3: catalogo invalido nao e erro: o texto de origem volta', () => {
  const { modulo } = moduloCom((c) => c.programar('default', 'pt_BR', new Uint8Array([1, 2, 3])));
  const tradutor = modulo.criarTradutor({ idioma: 'pt_BR' });

  assert.equal(tradutor.traduzir({ forma: 'texto', texto: 'Posts', dominio: 'default' }), 'Posts');
});

test('CA-4.3: o contexto separa traducoes; sem contexto, a entrada com contexto nao vale', () => {
  const { modulo } = moduloCom((c) => c.programar('default', 'pt_BR', CATALOGO_PT_BR));
  const tradutor = modulo.criarTradutor({ idioma: 'pt_BR' });

  assert.equal(
    tradutor.traduzir({ forma: 'com-contexto', texto: 'Posts', contexto: 'post type general name', dominio: 'default' }),
    'Publicacoes',
  );
  assert.equal(tradutor.traduzir({ forma: 'texto', texto: 'Posts', dominio: 'default' }), 'Posts traduzidos');
  // Contexto vazio e o mesmo que nenhum (`'' !== $context`).
  assert.equal(
    tradutor.traduzir({ forma: 'com-contexto', texto: 'Posts', contexto: '', dominio: 'default' }),
    'Posts traduzidos',
  );
  assert.equal(
    tradutor.traduzir({ forma: 'com-contexto', texto: 'Save Draft', contexto: 'outro', dominio: 'default' }),
    'Save Draft',
  );
});

// ---------------------------------------------------------------------------
// CA-4.4 — instalar catalogo novo exige a capacidade declarada, e ela consta da matriz
// ---------------------------------------------------------------------------

test('CA-4.4: a capacidade perguntada e a que a matriz concede por extensao', () => {
  assert.equal(CAPACIDADE_DE_INSTALAR_CATALOGO, 'install_languages');
  const concedidas = CONCESSOES_POR_EXTENSAO_DE_FABRICA.flatMap((extensao) =>
    extensao.concessoes.map((concessao) => concessao.capacidade),
  );
  assert.ok(concedidas.includes(CAPACIDADE_DE_INSTALAR_CATALOGO));
});

test('CA-4.4: sem a capacidade, o pedido e recusado', () => {
  const perguntadas: string[] = [];
  const semCapacidade = (capacidade: string): boolean => {
    perguntadas.push(capacidade);
    return false;
  };

  assert.equal(instalacaoDeCatalogoAutorizada(semCapacidade), false);
  assert.deepEqual(perguntadas, ['install_languages']);
  assert.equal(instalacaoDeCatalogoAutorizada(() => true), true);
});

test('CA-4.4: sem a capacidade, o sistema de arquivos nem e consultado', () => {
  let consultou = false;
  const sistema = (): boolean => {
    consultou = true;
    return true;
  };

  assert.equal(instalacaoDeCatalogoPossivel(() => false, sistema), false);
  assert.equal(consultou, false);

  assert.equal(instalacaoDeCatalogoPossivel(() => true, sistema), true);
  assert.equal(consultou, true);
  assert.equal(instalacaoDeCatalogoPossivel(() => true, () => false), false);
});

// ---------------------------------------------------------------------------
// CA-4.5 — numero e ordem de palavras por forma declarada, nao por concatenacao
// ---------------------------------------------------------------------------

test('CA-4.5: o plural escolhe a forma pela expressao do catalogo (pt_BR: n > 1)', () => {
  const { modulo } = moduloCom((c) => c.programar('default', 'pt_BR', CATALOGO_PT_BR));
  const tradutor = modulo.criarTradutor({ idioma: 'pt_BR' });
  const plural = (numero: number): string =>
    tradutor.traduzir({ forma: 'com-plural', singular: '%s post', plural: '%s posts', numero, dominio: 'default' });

  // Em pt_BR, zero e singular — no ingles, plural. A forma e do catalogo.
  assert.equal(plural(0), '%s publicacao');
  assert.equal(plural(1), '%s publicacao');
  assert.equal(plural(2), '%s publicacoes');
  assert.equal(
    tradutor.traduzir({
      forma: 'com-plural-e-contexto',
      singular: '%s item',
      plural: '%s items',
      numero: 5,
      contexto: 'comment count',
      dominio: 'default',
    }),
    '%s comentarios',
  );
});

test('CA-4.5: tres formas, como o polones declara', () => {
  const expressao =
    'nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);';

  assert.deepEqual(
    [1, 2, 4, 5, 12, 22, 25, 101].map((n) => formaDePlural(expressao, n)),
    [0, 1, 1, 2, 2, 1, 2, 2],
  );
});

test('CA-4.5: sem cabecalho de plural, a regra do ingles; forma que falta cai na primeira', () => {
  assert.equal(formaDePlural(undefined, 1), 0);
  assert.equal(formaDePlural(undefined, 0), 1);

  const { modulo } = moduloCom((c) =>
    c.programar(
      'default',
      'ja',
      montarMo('Plural-Forms: nplurals=3; plural=2;\n', [['%s post\u0000%s posts', '%s ken\u0000%s kens']]),
    ),
  );
  assert.equal(
    modulo
      .criarTradutor({ idioma: 'ja' })
      .traduzir({ forma: 'com-plural', singular: '%s post', plural: '%s posts', numero: 7, dominio: 'default' }),
    '%s ken',
  );
});

test('CA-4.5: cabecalho sem espaco depois do `;` ou com simbolo desconhecido recai em `n != 1`', () => {
  assert.equal(formaDePlural('nplurals=2;plural=n>1;', 0), 1);
  assert.equal(formaDePlural('nplurals=2; plural=n>1;', 0), 0);
  assert.equal(formaDePlural('nplurals=2; plural=x > 1;', 0), 1);
  assert.equal(formaDePlural('nplurals=2; plural=(n > 1;', 1), 0);
});

test('CA-4.5: o avaliador compara como o interpretador do legado', () => {
  // `==` e estrito: booleano nunca e igual a inteiro.
  assert.equal(compilarExpressaoDePlural('(n > 1) == 1').avaliar(5), 0);
  // Booleano contra inteiro compara como booleano: `true < 2` e `true < true`.
  assert.equal(compilarExpressaoDePlural('(n > 1) < 2').avaliar(5), 0);
  assert.equal(compilarExpressaoDePlural('(n > 1) < 2').avaliar(0), 1);
});

test('CA-4.5: expressao que analisa mas nao avalia para, como o erro fatal do legado', () => {
  assert.throws(() => formaDePlural('nplurals=2; plural=n % 0;', 3), ErroNaAvaliacaoDoPlural);
  assert.throws(() => compilarExpressaoDePlural('n 1').avaliar(1), ErroNaAvaliacaoDoPlural);
});

test('CA-4.5: a ordem das palavras e do molde traduzido, e quem interpola e o chamador', () => {
  const { modulo } = moduloCom((c) => c.programar('default', 'pt_BR', CATALOGO_PT_BR));
  const molde = modulo
    .criarTradutor({ idioma: 'pt_BR' })
    .traduzir({ forma: 'texto', texto: '%1$s by %2$s', dominio: 'default' });

  assert.equal(molde, '%2$s escreveu %1$s');
});

test('CA-4.5: os pontos de extensao disparam o geral e depois o do dominio', () => {
  const ordem: string[] = [];
  const filtros: FiltrosDaTraducao = {
    texto: {
      gettext: [(traducao, texto, dominio) => (ordem.push(`gettext:${texto}:${dominio}`), `${traducao}+g`)],
      gettext_default: [(traducao) => (ordem.push('gettext_default'), `${traducao}+d`)],
      gettext_akismet: [() => 'nunca'],
    },
    plural: {
      ngettext: [(traducao, _s, _p, numero) => (ordem.push(`ngettext:${numero}`), traducao)],
    },
  };
  const { modulo } = moduloCom((c) => c.programar('default', 'pt_BR', CATALOGO_PT_BR));
  const tradutor = modulo.criarTradutor({ idioma: 'pt_BR', filtros });

  assert.equal(tradutor.traduzir({ forma: 'texto', texto: 'Posts', dominio: 'default' }), 'Posts traduzidos+g+d');
  tradutor.traduzir({ forma: 'com-plural', singular: '%s post', plural: '%s posts', numero: 2.5, dominio: 'default' });
  // O numero chega ao ponto como o chamador passou, sem o `(int)`.
  assert.deepEqual(ordem, ['gettext:Posts:default', 'gettext_default', 'ngettext:2.5']);
});
