/**
 * Testes de **T019** do lado de BC-05: as quatro capacidades de `PERM-7` contra a
 * matriz **de fabrica**.
 *
 * Os testes do mecanismo estao em
 * `plataforma/autorizacao/us-9-capacidades-por-extensao.test.ts`, com matriz
 * inventada de proposito. Aqui mora **CA-9.2** — *"existe ao menos um ator capaz
 * de retomar uma extensao pausada numa instalacao de fabrica"* —, e ela mora deste
 * lado porque fala de fabrica: a matriz de fabrica e dado de BC-05, e
 * `plataforma/` nao pode importar `contextos/` (regra de dependencia 2). E a mesma
 * divisao que T015 seguiu em `fonte-de-papeis.test.ts`.
 *
 * 🔴 **Os dois lados do conflito REQ-017 sao exercitados, e nenhum e escolhido.**
 * As quatro concessoes de T019 dependem de `activate_plugins`, `switch_themes`,
 * `install_plugins`, `install_themes` e `update_core` — nenhuma delas e nivel
 * numerico —, logo o resultado e o mesmo nos dois lados, e estes testes sao a
 * prova disso.
 *
 * O achado que estes casos protegem e o de UC-36, na letra do caso de uso:
 * *"quem migrar pela matriz produz um sistema em que **ninguem** retoma"*.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  capacidadesDeclaradas,
  comAtor,
  conferirMatrizDeclarada,
  papeisQueConcedem,
  perguntarPermissao,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type Capacidade,
} from '../../../plataforma/autorizacao/index.js';

import {
  povoarPapeis,
  type LadoDoConflitoDeNivelNumerico,
} from '../armazenamento/index.js';

import { matrizDeAutorizacao } from './fonte-de-papeis.js';

const LADOS: readonly LadoDoConflitoDeNivelNumerico[] = [
  'legado-integral',
  'req-017-sem-niveis',
];

/** As quatro de `PERM-7` (BR-MIGRAR-093), na ordem em que o pacote as lista. */
const QUATRO_SO_POR_EXTENSAO: readonly Capacidade[] = [
  'install_languages',
  'resume_plugins',
  'resume_themes',
  'view_site_health_checks',
];

/** A base da decisao sobre a matriz de fabrica daquele lado do conflito. */
function baseDeFabrica(lado: LadoDoConflitoDeNivelNumerico): BaseDeAutorizacao {
  return {
    matriz: matrizDeAutorizacao(povoarPapeis(lado)),
    rede: REDE_INATIVA_NA_AUTORIZACAO,
  };
}

/** Uma conta com aquele papel de fabrica gravado, e nada mais. */
function contaComPapel(identificador: string): AtorDeAutorizacao {
  return {
    contaId: 1,
    login: 'ada',
    existe: true,
    concessoes: [{ capacidade: identificador, concedida: true }],
  };
}

test('CA-9.2: numa instalacao de fabrica ha quem retome a extensao pausada', () => {
  for (const lado of LADOS) {
    const base = baseDeFabrica(lado);
    const dona = comAtor(base, contaComPapel('administrator'));

    // UC-36: "retomar as extensoes exige `resume_plugins` ou `resume_themes`,
    // que nao estao em papel algum". Com a concessao de prioridade 1 do nucleo,
    // quem tem `activate_plugins` e `switch_themes` de fabrica retoma as duas.
    assert.equal(
      perguntarPermissao(dona, 'resume_plugins'),
      true,
      `${lado}: alguem retoma extensao pausada de fabrica`,
    );
    assert.equal(
      perguntarPermissao(dona, 'resume_themes'),
      true,
      `${lado}: alguem retoma tema pausado de fabrica`,
    );

    // E as outras duas, pela mesma via: UC-37 exige `install_plugins`, que o
    // papel de maior poder tem de fabrica, e o idioma sai de `update_core`.
    assert.equal(
      perguntarPermissao(dona, 'view_site_health_checks'),
      true,
      `${lado}: alguem abre o diagnostico de fabrica`,
    );
    assert.equal(
      perguntarPermissao(dona, 'install_languages'),
      true,
      `${lado}: alguem instala traducao de fabrica`,
    );
  }
});

test('CA-9.2: e so o papel de maior poder as recebe — os outros quatro nao', () => {
  for (const lado of LADOS) {
    const base = baseDeFabrica(lado);

    // Nenhum dos outros papeis de fabrica tem `activate_plugins`,
    // `switch_themes`, `install_plugins`, `install_themes` nem `update_core`,
    // logo nenhuma das quatro lhes chega. A concessao e condicional, e nao uma
    // capacidade dada a todos.
    for (const identificador of ['editor', 'author', 'contributor', 'subscriber']) {
      const conta = comAtor(base, contaComPapel(identificador));
      for (const capacidade of QUATRO_SO_POR_EXTENSAO) {
        assert.equal(
          perguntarPermissao(conta, capacidade),
          false,
          `${lado}: ${identificador} nao deveria receber ${capacidade}`,
        );
      }
    }
  }
});

test('CA-9.1: as quatro continuam fora de todo papel da matriz de fabrica', () => {
  for (const lado of LADOS) {
    const matriz = baseDeFabrica(lado).matriz;

    for (const capacidade of QUATRO_SO_POR_EXTENSAO) {
      // "Nao estao em papel algum": a entrega de T019 e declara-las por regra,
      // nao acrescenta-las a matriz. Semea-las num papel mudaria o valor gravado
      // na opcao `{site}user_roles`, que e o que a interface de papeis do produto
      // le e o que o cenario de paridade exige identico byte a byte.
      assert.deepEqual(
        [...papeisQueConcedem(matriz, capacidade)],
        [],
        `${lado}: ${capacidade} nao e concedida por papel algum`,
      );
      assert.equal(
        capacidadesDeclaradas(matriz).has(capacidade),
        false,
        `${lado}: ${capacidade} nao esta na matriz`,
      );
    }

    // E ainda assim a conferencia fecha, porque elas tem regra declarada.
    const conferencia = conferirMatrizDeclarada({
      matriz,
      exigidas: QUATRO_SO_POR_EXTENSAO,
    });
    assert.equal(
      conferencia.fechou,
      true,
      `${lado}: as quatro tem declaracao por regra`,
    );
  }
});

test('CA-9.3: a conferencia fecha para o que os casos de uso de US-9 exigem', () => {
  // As capacidades que UC-36, UC-32 e UC-37 nomeiam: as quatro de `PERM-7` e as
  // de origem de cada uma. Nenhuma pode ficar sem responsavel, ou existe operacao
  // sem ninguem que a faca — que e o que a historia pede em uma linha: "para que
  // nao exista operacao cujo responsavel nao exista".
  const exigidasPelosCasosDeUso: readonly Capacidade[] = [
    ...QUATRO_SO_POR_EXTENSAO,
    'activate_plugins',
    'switch_themes',
    'install_plugins',
    'install_themes',
    'update_core',
  ];

  for (const lado of LADOS) {
    const conferencia = conferirMatrizDeclarada({
      matriz: baseDeFabrica(lado).matriz,
      exigidas: exigidasPelosCasosDeUso,
    });

    assert.deepEqual(
      [...conferencia.semDeclaracao],
      [],
      `${lado}: toda capacidade dos casos de uso de US-9 tem declaracao`,
    );
  }
});

test('CA-9.3: sem a concessao registrada no ponto, a conferencia acusa as quatro', () => {
  // O cenario `@substituicao` de `07-autorizacao-por-capacidade.feature`, agora
  // sobre a matriz de fabrica: tirada a concessao do ponto de extensao, as quatro
  // voltam a nao ter responsavel, e e ISSO que o relato tem de dizer.
  for (const lado of LADOS) {
    const matriz = baseDeFabrica(lado).matriz;
    const conferencia = conferirMatrizDeclarada({
      matriz,
      exigidas: QUATRO_SO_POR_EXTENSAO,
      concessoesPorExtensao: [],
    });

    assert.equal(conferencia.fechou, false, `${lado}: a conferencia acusa`);
    assert.deepEqual(
      [...conferencia.semDeclaracao],
      [...QUATRO_SO_POR_EXTENSAO],
      `${lado}: e acusa as quatro, com nome`,
    );

    // E a decisao nega, que e o sistema em que "ninguem retoma extensao pausada".
    assert.equal(
      perguntarPermissao(
        comAtor(
          { matriz, rede: REDE_INATIVA_NA_AUTORIZACAO, concessoesPorExtensao: [] },
          contaComPapel('administrator'),
        ),
        'resume_plugins',
      ),
      false,
      `${lado}: sem o ponto de concessao, ninguem retoma`,
    );
  }
});
