/**
 * Testes da entrega de T002, lado definicao de papel: *"a matriz de fabrica e
 * carregada com as mesmas concessoes que o legado semeia"*.
 *
 * 🔴 **Os dois lados do conflito REQ-017 sao testados, e nenhum e escolhido.**
 * A razao esta em `matriz-de-fabrica.ts`: as duas posicoes sao decisao humana,
 * a tabela *Nao negociavel* da constituicao poe a reconciliacao fora do alcance
 * de quem codifica, e o risco 1 do `plan.md` avisa que comecar pelo lado errado
 * joga fora esta tarefa e estes testes. Com os dois lados cobertos, a decisao
 * quando vier nao custa retrabalho.
 *
 * As contagens afirmadas aqui sao as da constituicao, § P3: *"a matriz de
 * fabrica tem 61 concessoes, das quais 50 sao reais"* — e sao elas que provam
 * que a transcricao das oito rotinas nao perdeu nem inventou concessao.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { serializarComoTexto } from '../../../plataforma/serializacao/index.js';

import {
  criarArmazenamento,
  criarConstrutorDeDefinicao,
  definicaoDeValor,
  definicaoParaValor,
  povoarPapeis,
  povoarPapeis160,
  povoarPapeis300,
  type DefinicaoDePapeis,
  type LadoDoConflitoDeNivelNumerico,
} from './index.js';
import { criarPortaDeDadosFalsa, textoDoParametro } from './porta-falsa.js';

function nomesDeCapacidade(definicao: DefinicaoDePapeis): string[] {
  const nomes = new Set<string>();
  for (const entrada of definicao) {
    for (const concessao of entrada.papel.capacidades) {
      nomes.add(concessao.capacidade);
    }
  }
  return [...nomes];
}

function contagemPorPapel(definicao: DefinicaoDePapeis): Record<string, number> {
  const contagem: Record<string, number> = {};
  for (const entrada of definicao) {
    contagem[entrada.identificador] = entrada.papel.capacidades.length;
  }
  return contagem;
}

function semNiveis(definicao: DefinicaoDePapeis): DefinicaoDePapeis {
  return definicao.map((entrada) => ({
    identificador: entrada.identificador,
    papel: {
      nome: entrada.papel.nome,
      capacidades: entrada.papel.capacidades.filter(
        (concessao) => !concessao.capacidade.startsWith('level_'),
      ),
    },
  }));
}

const LADOS: readonly LadoDoConflitoDeNivelNumerico[] = [
  'legado-integral',
  'req-017-sem-niveis',
];

for (const lado of LADOS) {
  test(`${lado}: os cinco papeis nascem na ordem do legado, com o nome sem traducao`, () => {
    const definicao = povoarPapeis(lado);

    assert.deepEqual(
      definicao.map((entrada) => entrada.identificador),
      ['administrator', 'editor', 'author', 'contributor', 'subscriber'],
    );
    assert.deepEqual(
      definicao.map((entrada) => entrada.papel.nome),
      ['Administrator', 'Editor', 'Author', 'Contributor', 'Subscriber'],
    );
  });

  test(`${lado}: as 50 concessoes reais sao as mesmas, e o administrador tem todas`, () => {
    const definicao = povoarPapeis(lado);
    const reais = nomesDeCapacidade(definicao).filter(
      (nome) => !nome.startsWith('level_'),
    );

    assert.equal(reais.length, 50);

    const administrador = definicao[0];
    assert.equal(administrador?.identificador, 'administrator');
    assert.equal(
      administrador?.papel.capacidades.filter(
        (concessao) => !concessao.capacidade.startsWith('level_'),
      ).length,
      50,
    );
  });

  test(`${lado}: nenhuma concessao e negada na matriz de fabrica`, () => {
    for (const entrada of povoarPapeis(lado)) {
      for (const concessao of entrada.papel.capacidades) {
        assert.equal(concessao.concedida, true);
      }
    }
  });
}

test('lado do legado: 61 concessoes, com as 11 de nivel numerico', () => {
  const definicao = povoarPapeis('legado-integral');

  assert.equal(nomesDeCapacidade(definicao).length, 61);
  assert.deepEqual(contagemPorPapel(definicao), {
    administrator: 61,
    editor: 34,
    author: 10,
    contributor: 5,
    subscriber: 2,
  });
});

test('lado do REQ-017: 50 concessoes, e nenhum nivel numerico em papel nenhum', () => {
  const definicao = povoarPapeis('req-017-sem-niveis');

  assert.equal(nomesDeCapacidade(definicao).length, 50);
  assert.deepEqual(contagemPorPapel(definicao), {
    administrator: 50,
    editor: 26,
    author: 7,
    contributor: 3,
    subscriber: 1,
  });
  assert.equal(
    nomesDeCapacidade(definicao).filter((nome) => nome.startsWith('level_'))
      .length,
    0,
  );
});

test('os dois lados diferem SOMENTE nas concessoes de nivel numerico', () => {
  // E a afirmacao que torna a decisao pendente baratra: o que o conflito decide
  // e exatamente este recorte, e nada mais da matriz muda com ele.
  assert.deepEqual(
    semNiveis(povoarPapeis('legado-integral')),
    povoarPapeis('req-017-sem-niveis'),
  );
});

test('o nivel numerico e concedido do maior para o menor, como o legado concede', () => {
  const definicao = povoarPapeis('legado-integral');
  const administrador = definicao[0];
  const niveis = (administrador?.papel.capacidades ?? [])
    .map((concessao) => concessao.capacidade)
    .filter((nome) => nome.startsWith('level_'));

  assert.deepEqual(niveis, [
    'level_10',
    'level_9',
    'level_8',
    'level_7',
    'level_6',
    'level_5',
    'level_4',
    'level_3',
    'level_2',
    'level_1',
    'level_0',
  ]);
});

test('a ordem das primeiras concessoes do administrador e a da primeira rotina', () => {
  const definicao = povoarPapeis('legado-integral');

  assert.deepEqual(
    (definicao[0]?.papel.capacidades ?? [])
      .slice(0, 5)
      .map((concessao) => concessao.capacidade),
    [
      'switch_themes',
      'edit_themes',
      'activate_plugins',
      'edit_plugins',
      'edit_users',
    ],
  );
});

test('a ultima rotina acrescenta as sete concessoes dela ao fim, so no administrador', () => {
  const definicao = povoarPapeis('legado-integral');

  assert.deepEqual(
    (definicao[0]?.papel.capacidades ?? [])
      .slice(-7)
      .map((concessao) => concessao.capacidade),
    [
      'update_core',
      'list_users',
      'remove_users',
      'promote_users',
      'edit_theme_options',
      'delete_themes',
      'export',
    ],
  );
  assert.equal(
    definicao[1]?.papel.capacidades.some(
      (concessao) => concessao.capacidade === 'update_core',
    ),
    false,
  );
});

test('conceder a papel inexistente nao faz nada, como nas oito rotinas', () => {
  const construtor = criarConstrutorDeDefinicao();

  povoarPapeis300(construtor);

  assert.deepEqual(construtor.resultado(), []);
});

test('criar papel que ja existe nao apaga a customizacao dele', () => {
  const construtor = criarConstrutorDeDefinicao();
  povoarPapeis160(construtor, 'req-017-sem-niveis');
  construtor.adicionarCapacidade('subscriber', 'minha_capacidade');

  // Repovoar e o que acontece ao criar um site de rede e ao atualizar.
  povoarPapeis160(construtor, 'req-017-sem-niveis');

  assert.deepEqual(
    construtor
      .resultado()
      .find((entrada) => entrada.identificador === 'subscriber')
      ?.papel.capacidades.map((concessao) => concessao.capacidade),
    ['read', 'minha_capacidade'],
  );
});

test('conceder de novo mantem a posicao e troca o valor', () => {
  const construtor = criarConstrutorDeDefinicao();
  construtor.adicionarPapel('editor', 'Editor');
  construtor.adicionarCapacidade('editor', 'read');
  construtor.adicionarCapacidade('editor', 'edit_posts');
  construtor.adicionarCapacidade('editor', 'read', false);

  assert.deepEqual(construtor.resultado()[0]?.papel.capacidades, [
    { capacidade: 'read', concedida: false },
    { capacidade: 'edit_posts', concedida: true },
  ]);
});

test('a definicao vai e volta pelo formato serializado sem mudar', () => {
  const definicao = povoarPapeis('legado-integral');
  const valor = definicaoParaValor(definicao);

  assert.deepEqual(definicaoDeValor(valor), definicao);
});

test('os bytes do papel de assinante sao os do legado, nos dois lados', () => {
  assert.ok(
    serializarComoTexto(definicaoParaValor(povoarPapeis('legado-integral'))).endsWith(
      's:10:"subscriber";a:2:{s:4:"name";s:10:"Subscriber";' +
        's:12:"capabilities";a:2:{s:4:"read";b:1;s:7:"level_0";b:1;}}}',
    ),
  );

  assert.ok(
    serializarComoTexto(
      definicaoParaValor(povoarPapeis('req-017-sem-niveis')),
    ).endsWith(
      's:10:"subscriber";a:2:{s:4:"name";s:10:"Subscriber";' +
        's:12:"capabilities";a:1:{s:4:"read";b:1;}}}',
    ),
  );
});

test('o inicio dos bytes da opcao e o do legado: cinco papeis, nome e capacidades', () => {
  const texto = serializarComoTexto(
    definicaoParaValor(povoarPapeis('legado-integral')),
  );

  assert.ok(
    texto.startsWith(
      'a:5:{s:13:"administrator";a:2:{s:4:"name";s:13:"Administrator";' +
        's:12:"capabilities";a:61:{s:13:"switch_themes";b:1;',
    ),
  );
});

test('semear grava a opcao de papeis do site, e nada mais', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  falsa.responder([]);

  armazenamento.papeis.semearMatrizDeFabrica('legado-integral');

  assert.equal(falsa.escritas.length, 1);
  const escrita = falsa.escritas[0];
  assert.equal(
    escrita?.texto,
    'INSERT INTO wp_options (option_name, option_value) VALUES (?, ?)',
  );
  assert.equal(escrita?.parametros[0], 'wp_user_roles');
  assert.ok(
    textoDoParametro(escrita?.parametros[1]).startsWith('a:5:{s:13:"administrator"'),
  );
});

test('gravar a definicao com o valor que ja esta la nao emite comando', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  const definicao = povoarPapeis('legado-integral');
  const gravado = serializarComoTexto(definicaoParaValor(definicao));
  falsa.responder([{ option_value: gravado }]);

  assert.equal(armazenamento.papeis.gravarDefinicao(definicao), false);
  assert.deepEqual(falsa.escritas, []);
});

test('a definicao gravada e lida de volta pela opcao do site', () => {
  const falsa = criarPortaDeDadosFalsa({
    prefixoDeTabela: 'wp_2_',
    prefixoBaseDeTabela: 'wp_',
  });
  const armazenamento = criarArmazenamento(falsa.porta);
  const definicao = povoarPapeis('legado-integral');
  falsa.responder([
    { option_value: serializarComoTexto(definicaoParaValor(definicao)) },
  ]);

  const lida = armazenamento.papeis.obterDefinicao();

  assert.deepEqual(falsa.selecoes[0]?.parametros, ['wp_2_user_roles']);
  assert.deepEqual(lida?.interpretado, definicao);
});

test('a autorizacao da conta mora na chave com o prefixo do site dentro do nome', () => {
  const falsa = criarPortaDeDadosFalsa({
    prefixoDeTabela: 'wp_2_',
    prefixoBaseDeTabela: 'wp_',
  });
  const armazenamento = criarArmazenamento(falsa.porta);
  falsa.responder([]);

  armazenamento.papeis.gravarCapacidadesDaConta(12, [
    { capacidade: 'administrator', concedida: true },
  ]);

  const escrita = falsa.escritas[0];
  assert.deepEqual(escrita?.parametros[1], 'wp_2_capabilities');
  assert.equal(
    textoDoParametro(escrita?.parametros[2]),
    'a:1:{s:13:"administrator";b:1;}',
  );
});

test('o nivel da conta e gravado como texto decimal, nao serializado', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  falsa.responder([]);

  armazenamento.papeis.gravarNivelDaConta(12, 10);

  assert.deepEqual(falsa.escritas[0]?.parametros, [12, 'wp_user_level', '10']);
});

test('perguntar quem tem um papel e busca por texto sobre valor serializado', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  falsa.responder([{ user_id: 1 }]);

  const ids = armazenamento.papeis.idsDeContasComPapel('administrator');

  assert.deepEqual(ids, [1]);
  assert.deepEqual(falsa.selecoes[0]?.parametros, [
    'wp_capabilities',
    '%"administrator"%',
  ]);
});

test('estrutura gravada que nao e a do legado nao e interpretada nem normalizada', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  // Um papel com um campo que este nucleo nao escreve.
  falsa.responder([
    {
      option_value:
        'a:1:{s:6:"editor";a:3:{s:4:"name";s:6:"Editor";' +
        's:12:"capabilities";a:1:{s:4:"read";b:1;}s:5:"extra";b:1;}}',
    },
  ]);

  const lida = armazenamento.papeis.obterDefinicao();

  assert.equal(lida?.interpretado, null);
  // O bruto continua la, e volta para a coluna sem um byte de diferenca.
  assert.equal(
    serializarComoTexto(lida?.bruto ?? { tipo: 'nulo' }),
    'a:1:{s:6:"editor";a:3:{s:4:"name";s:6:"Editor";' +
      's:12:"capabilities";a:1:{s:4:"read";b:1;}s:5:"extra";b:1;}}',
  );
});
