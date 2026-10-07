/**
 * Testes de **T015** do lado de BC-05: a decisao de capacidade sobre o dado de
 * papel **como ele e gravado**, pela porta de dados.
 *
 * Os testes da politica em si estao em
 * `plataforma/autorizacao/us-7-autorizacao-por-capacidade.test.ts`, com matriz
 * inventada de proposito. Aqui a matriz e a **de fabrica**, e e por isso que estes
 * casos moram deste lado: a matriz de fabrica e dado de BC-05, e `plataforma/` nao
 * pode importar `contextos/` (regra de dependencia 2).
 *
 * 🔴 **Os dois lados do conflito REQ-017 sao exercitados, e nenhum e escolhido** —
 * o mesmo que `armazenamento/matriz-de-fabrica.test.ts` fez em T002, pela mesma
 * razao: a reconciliacao entre o card `wont` e a resposta 5 e decisao humana, e a
 * tabela *Nao negociavel* da constituicao a poe fora do alcance de quem codifica.
 * As decisoes de autorizacao desta tarefa nao dependem do lado escolhido, e estes
 * testes sao a prova disso.
 *
 * O criterio de paridade desta area e **efeito no banco** (Decisao 2 de
 * `parity_specs.md`), logo o que se afirma aqui e qual consulta sai, com quais
 * parametros — inclusive o `LIKE` com curinga dos dois lados que e a unica forma de
 * perguntar "quem tem esta capacidade" (CA-7.4, pegadinha 5 de `permissions.md`).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  atorDeAutorizacao,
  candidatosComCapacidade,
  capacidadesDeclaradas,
  capacidadesExigidasSemDeclaracao,
  comAtor,
  perguntarPermissao,
  quemTemCapacidade,
  type BaseDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import { serializarComoTexto } from '../../../plataforma/serializacao/index.js';

import {
  concessoesParaValor,
  criarArmazenamento,
  criarConstrutorDeDefinicao,
  definicaoParaValor,
  povoarPapeis,
  type ConcessaoDeCapacidade,
  type DefinicaoDePapeis,
  type LadoDoConflitoDeNivelNumerico,
} from '../armazenamento/index.js';
import {
  criarPortaDeDadosFalsa,
  textoDoParametro,
} from '../armazenamento/porta-falsa.js';

import {
  criarFonteDeAutorizacao,
  matrizDeAutorizacao,
  matrizGravada,
} from './fonte-de-papeis.js';

const LADOS: readonly LadoDoConflitoDeNivelNumerico[] = [
  'legado-integral',
  'req-017-sem-niveis',
];

/** O valor da opcao `{site}user_roles`, como a coluna o guarda. */
function opcaoGravada(definicao: DefinicaoDePapeis): string {
  return serializarComoTexto(definicaoParaValor(definicao));
}

/** O valor da chave `{site}capabilities`, como a coluna o guarda. */
function capacidadesGravadas(
  concessoes: readonly ConcessaoDeCapacidade[],
): string {
  return serializarComoTexto(concessoesParaValor(concessoes));
}

function papel(identificador: string): ConcessaoDeCapacidade[] {
  return [{ capacidade: identificador, concedida: true }];
}

function baseCom(definicao: DefinicaoDePapeis): BaseDeAutorizacao {
  return {
    matriz: matrizDeAutorizacao(definicao),
    rede: REDE_INATIVA_NA_AUTORIZACAO,
  };
}

for (const lado of LADOS) {
  test(`${lado}: a matriz de fabrica gravada decide por capacidade, e nao por papel`, () => {
    const definicao = povoarPapeis(lado);
    const contexto = baseCom(definicao);

    const administracao = comAtor(contexto, {
      contaId: 1,
      login: 'uma',
      existe: true,
      concessoes: papel('administrator'),
    });
    const assinatura = comAtor(contexto, {
      contaId: 2,
      login: 'outra',
      existe: true,
      concessoes: papel('subscriber'),
    });

    // As decisoes que o esquema da matriz de fabrica sustenta, nos dois lados do
    // conflito: o nivel numerico nao participa de nenhuma.
    assert.equal(perguntarPermissao(administracao, 'manage_options'), true);
    assert.equal(perguntarPermissao(administracao, 'unfiltered_html'), true);
    assert.equal(perguntarPermissao(assinatura, 'read'), true);
    assert.equal(perguntarPermissao(assinatura, 'edit_posts'), false);
    assert.equal(perguntarPermissao(assinatura, 'manage_options'), false);
  });

  test(`${lado}: CA-7.5 — as capacidades que UC-24 exige constam da matriz de fabrica`, () => {
    const declaradas = capacidadesDeclaradas(
      matrizDeAutorizacao(povoarPapeis(lado)),
    );

    // A linha *Autorizacao* de UC-24: "`list_users` para ver, `create_users` para
    // criar, `edit_users` para alterar, `promote_users` para mudar papel,
    // `delete_users` para apagar e `remove_users` para desvincular do site".
    const exigidasPorUc24 = [
      'list_users',
      'create_users',
      'edit_users',
      'promote_users',
      'delete_users',
      'remove_users',
    ];

    assert.deepEqual(
      capacidadesExigidasSemDeclaracao(exigidasPorUc24, declaradas),
      [],
    );
  });

  test(`${lado}: CA-7.5 — as quatro de PERM-7 NAO constam, e fechar isso e T019`, () => {
    const declaradas = capacidadesDeclaradas(
      matrizDeAutorizacao(povoarPapeis(lado)),
    );

    // BR-MIGRAR-093: elas entram por ponto de extensao de prioridade 1, e o
    // cenario de paridade confirma que, sem extensao registrada, **as duas
    // metades negam**. Declarar quem as tem e US-9 / T019; esta tarefa so mostra
    // que a conferencia as encontra.
    const soPorExtensao = [
      'install_languages',
      'resume_plugins',
      'resume_themes',
      'view_site_health_checks',
    ];

    assert.deepEqual(
      capacidadesExigidasSemDeclaracao(soPorExtensao, declaradas),
      soPorExtensao,
    );
  });
}

test('CA-7.2: a matriz e lida do armazenamento a cada pergunta — mudou o dado, mudou a decisao', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);

  const original = povoarPapeis('legado-integral');
  const comCapacidadeNova = (() => {
    const construtor = criarConstrutorDeDefinicao(original);
    construtor.adicionarCapacidade('subscriber', 'moderate_comments');
    return construtor.resultado();
  })();

  const assinatura: ConcessaoDeCapacidade[] = papel('subscriber');

  falsa.responder([{ option_value: opcaoGravada(original) }]);
  assert.equal(
    perguntarPermissao(
      comAtor(baseCom(matrizLida(armazenamento)), {
        contaId: 2,
        login: 'outra',
        existe: true,
        concessoes: assinatura,
      }),
      'moderate_comments',
    ),
    false,
  );

  // Nenhuma linha de codigo muda entre as duas perguntas: muda o que a opcao
  // guarda. E o que ADR-0001 chama de "o dado gravado e a verdade, e o codigo
  // deixa de ser".
  falsa.responder([{ option_value: opcaoGravada(comCapacidadeNova) }]);
  assert.equal(
    perguntarPermissao(
      comAtor(baseCom(matrizLida(armazenamento)), {
        contaId: 2,
        login: 'outra',
        existe: true,
        concessoes: assinatura,
      }),
      'moderate_comments',
    ),
    true,
  );

  // A leitura e a da opcao por site, e nenhuma outra consulta sai.
  assert.equal(falsa.selecoes.length, 2);
  for (const selecao of falsa.selecoes) {
    assert.match(selecao.texto, /FROM wp_options WHERE option_name = \?/);
    assert.deepEqual(selecao.parametros, ['wp_user_roles']);
  }
});

test('CA-7.2: a capacidade acrescentada em execucao e gravada e volta valendo', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);

  const construtor = criarConstrutorDeDefinicao(povoarPapeis('legado-integral'));
  construtor.adicionarCapacidade('subscriber', 'moderate_comments');

  // A opcao ainda nao existe: a gravacao insere.
  falsa.responder([]);
  assert.equal(armazenamento.papeis.gravarDefinicao(construtor.resultado()), true);
  assert.equal(falsa.escritas.length, 1);
  const escrita = falsa.escritas[0];
  assert.ok(escrita !== undefined);
  assert.match(escrita.texto, /INSERT INTO wp_options/);

  // E o que voltar do banco sao os MESMOS bytes, que e o criterio desta area.
  falsa.responder([{ option_value: textoDoParametro(escrita.parametros[1]) }]);
  assert.equal(
    perguntarPermissao(
      comAtor(baseCom(matrizLida(armazenamento)), {
        contaId: 2,
        login: 'outra',
        existe: true,
        concessoes: papel('subscriber'),
      }),
      'moderate_comments',
    ),
    true,
  );
});

test('CA-7.4: quem tem a capacidade sai do `LIKE` sobre o valor serializado', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  const fonte = criarFonteDeAutorizacao(armazenamento);
  const base = baseCom(povoarPapeis('legado-integral'));

  // 1: a busca pelo papel que concede `manage_options` encontra a conta 1.
  falsa.responder([{ user_id: 1 }]);
  // 2: a busca pela propria capacidade nao encontra ninguem.
  falsa.responder([]);
  // 3 e 4: o ator da conta 1 — login e capacidades gravadas.
  falsa.responder([{ ID: 1, user_login: 'uma' }]);
  falsa.responder([
    {
      umeta_id: 1,
      user_id: 1,
      meta_key: 'wp_capabilities',
      meta_value: capacidadesGravadas(papel('administrator')),
    },
  ]);

  assert.deepEqual(quemTemCapacidade('manage_options', base, fonte), [1]);

  // O efeito no banco: duas buscas por texto, com curinga dos dois lados, sobre
  // a chave de autorizacao daquele site. Nenhum indice alcanca isto, e e de
  // proposito (pegadinha 5 de `permissions.md`, risco declarado no `plan.md`).
  const buscas = falsa.selecoes.slice(0, 2);
  for (const busca of buscas) {
    assert.match(
      busca.texto,
      /SELECT user_id FROM wp_usermeta WHERE meta_key = \? AND meta_value LIKE \?/,
    );
    assert.equal(busca.parametros[0], 'wp_capabilities');
  }
  // O sublinhado do nome vai ESCAPADO: ele e o curinga de um caractere do
  // `LIKE`, e sem o escape `manage_options` casaria com qualquer nome de mesmo
  // comprimento. E o que o legado faz antes de montar o padrao, e e por isso que
  // `escaparParaLike` existe em T002.
  assert.deepEqual(
    buscas.map((busca) => busca.parametros[1]),
    ['%"administrator"%', '%"manage\\_options"%'],
  );
  assert.deepEqual(falsa.escritas, []);
});

test('CA-7.4: o candidato que a busca encontra sem concessao real nao entra na resposta', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  const fonte = criarFonteDeAutorizacao(armazenamento);
  const base = baseCom(povoarPapeis('legado-integral'));

  // A conta 9 menciona `manage_options` no texto, com a concessao em falso.
  falsa.responder([]);
  falsa.responder([{ user_id: 9 }]);
  falsa.responder([{ ID: 9, user_login: 'nove' }]);
  falsa.responder([
    {
      umeta_id: 2,
      user_id: 9,
      meta_key: 'wp_capabilities',
      meta_value: capacidadesGravadas([
        { capacidade: 'manage_options', concedida: false },
      ]),
    },
  ]);

  assert.deepEqual(quemTemCapacidade('manage_options', base, fonte), []);
});

test('candidatos e resposta sao dois passos, e o primeiro so olha o armazenamento', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  const fonte = criarFonteDeAutorizacao(armazenamento);

  falsa.responder([{ user_id: 3 }, { user_id: 4 }]);
  falsa.responder([{ user_id: 4 }]);

  assert.deepEqual(
    candidatosComCapacidade(
      'manage_options',
      baseCom(povoarPapeis('legado-integral')),
      fonte,
    ),
    [3, 4],
  );
  // Duas consultas, e nenhuma leitura de conta: o primeiro passo nao decide.
  assert.equal(falsa.selecoes.length, 2);
});

test('o ator sai do armazenamento, e a conta inexistente nao vira ator com poder', () => {
  const falsa = criarPortaDeDadosFalsa();
  const fonte = criarFonteDeAutorizacao(criarArmazenamento(falsa.porta));

  falsa.responder([]);
  const inexistente = atorDeAutorizacao(99, fonte);
  assert.equal(inexistente.existe, false);
  assert.deepEqual(inexistente.concessoes, []);
  // Nao foi buscar capacidade de quem nao existe.
  assert.equal(falsa.selecoes.length, 1);

  falsa.responder([{ ID: 5, user_login: 'cinco' }]);
  falsa.responder([
    {
      umeta_id: 3,
      user_id: 5,
      meta_key: 'wp_capabilities',
      meta_value: capacidadesGravadas(papel('editor')),
    },
  ]);
  const existente = atorDeAutorizacao(5, fonte);
  assert.equal(existente.existe, true);
  assert.equal(existente.login, 'cinco');
  assert.deepEqual(existente.concessoes, papel('editor'));
});

test('autorizacao gravada com estrutura que o legado nao escreve vira vazia, e o bruto fica', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  const fonte = criarFonteDeAutorizacao(armazenamento);

  // Texto serializado, e nao arranjo: no legado `! is_array( $caps )` vira
  // arranjo vazio, e e o que se reproduz aqui.
  falsa.responder([{ ID: 6, user_login: 'seis' }]);
  falsa.responder([
    {
      umeta_id: 4,
      user_id: 6,
      meta_key: 'wp_capabilities',
      meta_value: 's:5:"nada";',
    },
  ]);

  const ator = atorDeAutorizacao(6, fonte);
  assert.deepEqual(ator.concessoes, []);
  assert.equal(
    perguntarPermissao(
      comAtor(baseCom(povoarPapeis('legado-integral')), ator),
      'manage_options',
    ),
    false,
  );
});

test('a matriz gravada ausente nao concede nada por papel, e nao lanca', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);

  falsa.responder([]);
  assert.deepEqual(matrizGravada(armazenamento), []);
});

/** A matriz como esta gravada agora, lida pela porta. */
function matrizLida(
  armazenamento: ReturnType<typeof criarArmazenamento>,
): DefinicaoDePapeis {
  const gravada = armazenamento.papeis.obterDefinicao();
  assert.ok(gravada !== null && gravada.interpretado !== null);
  return gravada.interpretado;
}
