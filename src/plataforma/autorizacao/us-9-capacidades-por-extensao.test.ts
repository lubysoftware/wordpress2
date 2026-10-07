/**
 * Testes da entrega de **T019** (US-9): *"o comportamento de US-9 existe e os
 * criterios CA-9.1, CA-9.2, CA-9.3, CA-9.4 passam contra o sistema novo"*.
 *
 * Nao sao os testes de US-9: esses sao **T020**, cinco casos registrados em
 * `backlog/tests.md` (UT-016-1 a UT-016-5), e esse arquivo nao esta nesta arvore.
 * Aqui estao os criterios de aceite e as regras que a implementacao quebraria
 * **em silencio** — comecando pela que a propria spec nomeia: *"quem portar lendo
 * apenas a matriz de papeis produz um sistema em que ninguem retoma extensao
 * pausada"*.
 *
 * Os nomes de papel usados nos casos sao inventados de proposito
 * (`papel-de-cima`, `papel-de-baixo`): a instalacao **de fabrica** e exercitada
 * do lado de BC-05, onde a matriz mora, em
 * `contextos/identidade-e-acesso/autorizacao/us-9-instalacao-de-fabrica.test.ts`
 * — e e la que CA-9.2 fecha, porque CA-9.2 fala de fabrica.
 *
 * 🔴 **CA-9.4 nao tem teste de fechamento aqui, e nao e esquecimento.** Ele exige
 * que nenhuma das 93 capacidades verificadas no codigo fique fora da matriz, e a
 * lista dos 93 nomes nao esta nesta arvore: a primeira *Pergunta em aberto* da
 * `spec.md` poe para uma pessoa decidir se a matriz cresce ou se o critério se
 * reescreve. O que esta testado e o **mecanismo** que fecha a conta no dia em que
 * a lista existir — `conferirMatrizDeclarada`, com a lista por argumento.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAPACIDADES_QUE_HABILITAM_O_IDIOMA,
  CAPACIDADE_NEGADA,
  CONCESSOES_POR_EXTENSAO_DE_FABRICA,
  PRIORIDADE_DA_CONCESSAO_POR_EXTENSAO,
  REDE_INATIVA_NA_AUTORIZACAO,
  aplicarConcessoesPorExtensao,
  capacidadesConcedidasPorExtensao,
  capacidadesDeclaradas,
  capacidadesDeclaradasPorRegra,
  capacidadesExigidasSemDeclaracao,
  comAtor,
  conferirMatrizDeclarada,
  perguntarPermissao,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type Capacidade,
  type ConcessaoPorExtensao,
  type MatrizDePapeis,
  type PapelDeclarado,
  type PedidoDeConcessao,
} from './index.js';

// ── Montagem dos casos ──────────────────────────────────────────────────────

/** As quatro de `PERM-7` (BR-MIGRAR-093), na ordem em que o pacote as lista. */
const QUATRO_SO_POR_EXTENSAO: readonly Capacidade[] = [
  'install_languages',
  'resume_plugins',
  'resume_themes',
  'view_site_health_checks',
];

function papel(
  identificador: string,
  ...capacidades: readonly string[]
): PapelDeclarado {
  return {
    identificador,
    capacidades: capacidades.map((capacidade) => ({
      capacidade,
      concedida: true,
    })),
  };
}

function ator(
  login: string,
  ...papeis: readonly string[]
): AtorDeAutorizacao {
  return {
    contaId: 1,
    login,
    existe: true,
    concessoes: papeis.map((capacidade) => ({ capacidade, concedida: true })),
  };
}

function base(
  matriz: MatrizDePapeis,
  resto: Omit<BaseDeAutorizacao, 'matriz' | 'rede'> & {
    readonly rede?: BaseDeAutorizacao['rede'];
  } = {},
): BaseDeAutorizacao {
  const { rede, ...demais } = resto;
  return { matriz, rede: rede ?? REDE_INATIVA_NA_AUTORIZACAO, ...demais };
}

/** O pedido que a decisao monta, para exercitar a aplicacao direto. */
function pedido(
  quemPergunta: AtorDeAutorizacao,
  resto: Partial<Omit<PedidoDeConcessao, 'ator'>> = {},
): PedidoDeConcessao {
  return {
    exigidas: [],
    argumentos: [],
    ator: quemPergunta,
    redeAtiva: false,
    ehSuperAdmin: () => false,
    ...resto,
  };
}

/** Um ator que tem tudo o que habilita as quatro concessoes do nucleo. */
const PAPEL_QUE_HABILITA = papel(
  'papel-de-cima',
  'activate_plugins',
  'switch_themes',
  'install_plugins',
  'update_core',
  'install_themes',
);

// ── CA-9.1 · as quatro constam de regra declarada ───────────────────────────

test('CA-9.1: as quatro capacidades de PERM-7 constam da regra declarada', () => {
  assert.deepEqual(
    [...capacidadesConcedidasPorExtensao()],
    [...QUATRO_SO_POR_EXTENSAO],
  );

  // E a conferencia as da por declaradas sem que ninguem precise passa-las:
  // numa instalacao de fabrica elas tem responsavel (CA-9.1).
  const conferencia = conferirMatrizDeclarada({
    matriz: [PAPEL_QUE_HABILITA],
    exigidas: QUATRO_SO_POR_EXTENSAO,
  });
  assert.equal(conferencia.fechou, true);
  assert.deepEqual([...conferencia.semDeclaracao], []);
});

test('CA-9.1: elas NAO entram nas regras que a decisao aplica sempre, e isso e escolha', () => {
  // `capacidadesDeclaradasPorRegra` reune o que a decisao aplica em toda
  // pergunta — as duas sinteticas e as quatro constantes. A concessao por
  // extensao e removivel, logo nao pertence a essa lista, e os testes de T015 e
  // T016 afirmam os dois estados do terceiro argumento de
  // `capacidadesDeclaradas`. Trocar isto quebraria aqueles dois.
  for (const capacidade of QUATRO_SO_POR_EXTENSAO) {
    assert.equal(
      capacidadesDeclaradasPorRegra().includes(capacidade),
      false,
      `${capacidade} nao e declarada pelas regras que a decisao aplica sempre`,
    );
  }

  assert.deepEqual(
    [
      ...capacidadesExigidasSemDeclaracao(
        QUATRO_SO_POR_EXTENSAO,
        capacidadesDeclaradas([PAPEL_QUE_HABILITA]),
      ),
    ],
    [...QUATRO_SO_POR_EXTENSAO],
  );
});

test('CA-9.1: nenhum papel precisa conceder as quatro para que alguem as tenha', () => {
  const contexto = comAtor(
    base([PAPEL_QUE_HABILITA]),
    ator('uma', 'papel-de-cima'),
  );

  // A matriz nao menciona nenhuma das quatro...
  for (const capacidade of QUATRO_SO_POR_EXTENSAO) {
    assert.equal(
      capacidadesDeclaradas([PAPEL_QUE_HABILITA]).has(capacidade),
      false,
      `${capacidade} nao esta na matriz`,
    );
    // ...e ainda assim a decisao responde que sim, pela concessao de
    // prioridade 1 do nucleo.
    assert.equal(
      perguntarPermissao(contexto, capacidade),
      true,
      `${capacidade} deveria ser concedida por extensao`,
    );
  }
});

// ── CA-9.2 · ha quem retome extensao pausada, e so quem o legado deixa ──────

test('CA-9.2: retomar extensao pausada exige a capacidade de origem, e so ela', () => {
  const matriz: MatrizDePapeis = [
    PAPEL_QUE_HABILITA,
    papel('papel-de-baixo', 'read'),
  ];

  // UC-36: "entra por filtro de prioridade 1 para quem tem `activate_plugins`".
  assert.equal(
    perguntarPermissao(
      comAtor(base(matriz), ator('uma', 'papel-de-cima')),
      'resume_plugins',
    ),
    true,
  );
  // UC-32: "concedida por filtro a quem tem `switch_themes`".
  assert.equal(
    perguntarPermissao(
      comAtor(base(matriz), ator('uma', 'papel-de-cima')),
      'resume_themes',
    ),
    true,
  );

  // E quem nao tem a de origem continua negado: a concessao e condicional, nao
  // e uma capacidade dada a todos.
  for (const capacidade of QUATRO_SO_POR_EXTENSAO) {
    assert.equal(
      perguntarPermissao(
        comAtor(base(matriz), ator('outra', 'papel-de-baixo')),
        capacidade,
      ),
      false,
      `${capacidade} nao deveria chegar a quem nao tem a de origem`,
    );
  }
});

test('CA-9.2: a capacidade de origem de cada uma e a que o pacote nomeia', () => {
  const casos: readonly { readonly origem: string; readonly alvo: Capacidade }[] =
    [
      { origem: 'activate_plugins', alvo: 'resume_plugins' },
      { origem: 'switch_themes', alvo: 'resume_themes' },
      { origem: 'install_plugins', alvo: 'view_site_health_checks' },
    ];

  for (const { origem, alvo } of casos) {
    const contexto = comAtor(
      base([papel('papel-de-cima', origem)]),
      ator('uma', 'papel-de-cima'),
    );
    assert.equal(
      perguntarPermissao(contexto, alvo),
      true,
      `${origem} deveria conceder ${alvo}`,
    );

    // E so aquela: ter uma das outras tres nao abre esta.
    for (const { origem: outra, alvo: mesmo } of casos) {
      if (outra === origem || mesmo === alvo) {
        continue;
      }
      assert.equal(
        perguntarPermissao(
          comAtor(
            base([papel('papel-de-cima', outra)]),
            ator('uma', 'papel-de-cima'),
          ),
          alvo,
        ),
        false,
        `${outra} nao deveria conceder ${alvo}`,
      );
    }
  }
});

test('CA-9.2: `install_languages` sai de qualquer uma das tres que a habilitam', () => {
  // ⚠️ A condicao desta e a unica que o pacote nao escreve: vem da ancora que
  // BR-MIGRAR-093 aponta (`capabilities.php:1309`) e fecha contra o oraculo.
  // O teste afirma o que foi portado, para que a conferencia seja de uma lista.
  assert.deepEqual(
    [...CAPACIDADES_QUE_HABILITAM_O_IDIOMA],
    ['update_core', 'install_plugins', 'install_themes'],
  );

  for (const origem of CAPACIDADES_QUE_HABILITAM_O_IDIOMA) {
    assert.equal(
      perguntarPermissao(
        comAtor(
          base([papel('papel-de-cima', origem)]),
          ator('uma', 'papel-de-cima'),
        ),
        'install_languages',
      ),
      true,
      `${origem} deveria conceder install_languages`,
    );
  }

  // E uma capacidade de perto, que nao esta na lista, nao concede.
  assert.equal(
    perguntarPermissao(
      comAtor(
        base([papel('papel-de-cima', 'update_themes')]),
        ator('uma', 'papel-de-cima'),
      ),
      'install_languages',
    ),
    false,
  );
});

// ── A ORDEM · prioridade 1 e antes do interceptador de terceiro ─────────────

test('PERM-7: a concessao do nucleo chega ao ponto de extensao, e ele pode retira-la', () => {
  const vistas: string[] = [];
  const contexto = comAtor(
    base([PAPEL_QUE_HABILITA], {
      ganchos: {
        aoMontarCapacidadesDoAtor(capacidades) {
          vistas.push(...QUATRO_SO_POR_EXTENSAO.filter((nome) =>
            capacidades.has(nome),
          ));
          const sem = new Map(capacidades);
          sem.delete('resume_plugins');
          return sem;
        },
      },
    }),
    ator('uma', 'papel-de-cima'),
  );

  // O interceptador de terceiro roda DEPOIS: o mapa que ele recebe ja traz as
  // quatro, porque a concessao do nucleo e prioridade 1.
  assert.equal(perguntarPermissao(contexto, 'resume_plugins'), false);
  assert.deepEqual(vistas, [...QUATRO_SO_POR_EXTENSAO]);

  // E o que ele nao retirou continua valendo.
  assert.equal(perguntarPermissao(contexto, 'resume_themes'), true);
});

test('PERM-7: a prioridade do legado esta declarada, e e 1', () => {
  // BR-MIGRAR-093: "a prioridade 1 e parte da regra". O barramento que a
  // consumiria nao existe nesta arvore (REQ-162 esta em `do-not-rewrite.md`),
  // logo o numero fica declarado e a ordem e cumprida pela posicao.
  assert.equal(PRIORIDADE_DA_CONCESSAO_POR_EXTENSAO, 1);
});

test('PERM-7: os nomes dos tres interceptadores do legado nao foram traduzidos (P8)', () => {
  assert.deepEqual(
    CONCESSOES_POR_EXTENSAO_DE_FABRICA.map((entrada) => entrada.nome),
    [
      'wp_maybe_grant_install_languages_cap',
      'wp_maybe_grant_resume_extensions_caps',
      'wp_maybe_grant_site_health_caps',
    ],
  );

  // Um deles concede DUAS, e e por isso que a entrada e o interceptador e nao a
  // capacidade: o P2 manda preservar o nome e a ordem de disparo de cada ponto.
  assert.deepEqual(
    CONCESSOES_POR_EXTENSAO_DE_FABRICA.map((entrada) =>
      entrada.concessoes.map((concessao) => concessao.capacidade),
    ),
    [
      ['install_languages'],
      ['resume_plugins', 'resume_themes'],
      ['view_site_health_checks'],
    ],
  );
});

test('PERM-7: a concessao recebe os mesmos argumentos do ponto de extensao', () => {
  const recebidos: PedidoDeConcessao[] = [];
  const espia: ConcessaoPorExtensao = {
    nome: 'interceptador-de-teste',
    concessoes: [
      {
        capacidade: 'capacidade-de-teste',
        quando: (_capacidades, pedidoRecebido) => {
          recebidos.push(pedidoRecebido);
          return false;
        },
      },
    ],
  };

  const quemPergunta = ator('uma', 'papel-de-cima');
  const contexto = comAtor(
    base([PAPEL_QUE_HABILITA], { concessoesPorExtensao: [espia] }),
    quemPergunta,
  );
  const objeto = { id: 7 };

  perguntarPermissao(contexto, 'moderar', objeto);

  assert.equal(recebidos.length, 1);
  const [unico] = recebidos;
  assert.ok(unico !== undefined);
  assert.deepEqual([...unico.exigidas], ['moderar']);
  assert.deepEqual(unico.argumentos, [objeto]);
  assert.equal(unico.ator, quemPergunta);
  assert.equal(unico.redeAtiva, false);
});

test('PERM-7: a cadeia e em serie — o interceptador seguinte ve o que o anterior concedeu', () => {
  const dependente: ConcessaoPorExtensao = {
    nome: 'interceptador-que-depende-do-anterior',
    concessoes: [
      {
        capacidade: 'capacidade-em-cascata',
        quando: (capacidades) => capacidades.get('resume_plugins') === true,
      },
    ],
  };

  const capacidades = aplicarConcessoesPorExtensao(
    new Map([['activate_plugins', true]]),
    pedido(ator('uma')),
    [...CONCESSOES_POR_EXTENSAO_DE_FABRICA, dependente],
  );

  assert.equal(capacidades.get('capacidade-em-cascata'), true);
});

// ── O estado "nenhuma extensao registrada", do cenario de paridade ──────────

test('@substituicao: sem concessao registrada no ponto, as quatro sao negadas', () => {
  // O cenario de paridade, na letra: "dado nenhuma extensao registrada no ponto
  // de concessao de capacidade (...) as duas metades negam".
  const semConcessao = comAtor(
    base([PAPEL_QUE_HABILITA], { concessoesPorExtensao: [] }),
    ator('uma', 'papel-de-cima'),
  );

  for (const capacidade of QUATRO_SO_POR_EXTENSAO) {
    assert.equal(
      perguntarPermissao(semConcessao, capacidade),
      false,
      `${capacidade} nao deveria existir sem registro no ponto`,
    );
  }

  // "Quando o ponto de extensao correspondente concede a capacidade, as duas
  // metades passam a permitir a operacao que a exige."
  const comExtensao = comAtor(
    base([PAPEL_QUE_HABILITA], {
      concessoesPorExtensao: [],
      ganchos: {
        aoMontarCapacidadesDoAtor(capacidades) {
          return new Map(capacidades).set('resume_plugins', true);
        },
      },
    }),
    ator('uma', 'papel-de-cima'),
  );
  assert.equal(perguntarPermissao(comExtensao, 'resume_plugins'), true);

  // E nessa instalacao a conferencia volta a acusar as quatro, com nome: e o
  // relato correto para uma instalacao em que elas foram removidas do ponto.
  const conferencia = conferirMatrizDeclarada({
    matriz: [PAPEL_QUE_HABILITA],
    exigidas: QUATRO_SO_POR_EXTENSAO,
    concessoesPorExtensao: [],
  });
  assert.equal(conferencia.fechou, false);
  assert.deepEqual([...conferencia.semDeclaracao], [...QUATRO_SO_POR_EXTENSAO]);
});

// ── O que a implementacao quebraria em silencio ─────────────────────────────

test('PERM-7: a concessao SOBREPOE a negacao gravada no mapa', () => {
  // O legado escreve `$allcaps['resume_plugins'] = true;` sem olhar o que havia
  // antes. Um papel que negue a capacidade a quem tem a de origem nao impede
  // nada — e um porte que so preenchesse o que falta ficaria mais FECHADO que o
  // legado, que e o erro que esta feature existe para nao cometer.
  const matriz: MatrizDePapeis = [
    {
      identificador: 'papel-de-cima',
      capacidades: [
        { capacidade: 'activate_plugins', concedida: true },
        { capacidade: 'resume_plugins', concedida: false },
      ],
    },
  ];

  assert.equal(
    perguntarPermissao(
      comAtor(base(matriz), ator('uma', 'papel-de-cima')),
      'resume_plugins',
    ),
    true,
  );
});

test('PERM-7: a chave nova entra no fim do mapa, e a que existia mantem a posicao', () => {
  const capacidades = aplicarConcessoesPorExtensao(
    new Map([
      ['activate_plugins', true],
      ['resume_plugins', false],
      ['switch_themes', true],
    ]),
    pedido(ator('uma')),
  );

  // `resume_plugins` ja estava: troca de valor e NAO de posicao, como o
  // `array_merge` do PHP. `resume_themes` e nova: entra no fim.
  assert.deepEqual(
    [...capacidades.keys()],
    ['activate_plugins', 'resume_plugins', 'switch_themes', 'resume_themes'],
  );
  assert.equal(capacidades.get('resume_plugins'), true);
});

test('PERM-7: capacidade de origem gravada com valor falso nao habilita nada', () => {
  const capacidades = aplicarConcessoesPorExtensao(
    new Map([['activate_plugins', false]]),
    pedido(ator('uma')),
  );

  // `! empty( $allcaps['activate_plugins'] )`: presente nao basta, tem de ser
  // verdadeira.
  assert.equal(capacidades.has('resume_plugins'), false);
});

test('PERM-7 e PERM-9: o diagnostico do site tem recorte de rede, e os outros tres nao', () => {
  const matriz: MatrizDePapeis = [PAPEL_QUE_HABILITA];
  const naRede = base(matriz, {
    rede: { ativa: true, loginsDeSuperAdmin: ['dona-da-rede'] },
  });
  const administradoraDeSite = comAtor(naRede, ator('uma', 'papel-de-cima'));

  // UC-37: "em multisite, administrador de site nao a abre nunca".
  assert.equal(
    perguntarPermissao(administradoraDeSite, 'view_site_health_checks'),
    false,
  );

  // E o recorte e SO desta: o legado comenta a razao nas outras duas — "even in
  // a multisite, regular administrators should be able to resume plugins".
  assert.equal(perguntarPermissao(administradoraDeSite, 'resume_plugins'), true);
  assert.equal(perguntarPermissao(administradoraDeSite, 'resume_themes'), true);
  assert.equal(
    perguntarPermissao(administradoraDeSite, 'install_languages'),
    true,
  );
});

test('PERM-7: fora da rede a definicao de super administrador NAO e consultada', () => {
  // O legado escreve `! is_multisite() || is_super_admin( $user->ID )`, e fora da
  // rede a segunda metade nunca e avaliada. Nao e economia: fora da rede "super
  // administrador" e *quem tem `delete_users`* (PERM-9), que e outra pergunta de
  // permissao — avaliar as duas metades sempre poria a decisao a chamar a si
  // mesma. Se alguem trocar a funcao por um booleano calculado antes, este teste
  // e o que acusa.
  let consultas = 0;
  const capacidades = aplicarConcessoesPorExtensao(
    new Map([['install_plugins', true]]),
    pedido(ator('uma'), {
      redeAtiva: false,
      ehSuperAdmin: () => {
        consultas += 1;
        return false;
      },
    }),
  );

  assert.equal(capacidades.get('view_site_health_checks'), true);
  assert.equal(consultas, 0);

  // Em rede ela e consultada, e e ela que decide.
  let emRede = 0;
  const naRede = aplicarConcessoesPorExtensao(
    new Map([['install_plugins', true]]),
    pedido(ator('dona-da-rede'), {
      redeAtiva: true,
      ehSuperAdmin: () => {
        emRede += 1;
        return true;
      },
    }),
  );
  assert.equal(naRede.get('view_site_health_checks'), true);
  assert.equal(emRede, 1);
});

test('PERM-7: a concessao por extensao nao reabre o que a traducao fechou', () => {
  // A ordem de `decisao-de-capacidade.ts`: a traducao e o passo 1 e a concessao
  // e o passo 4. Uma capacidade que a traducao transformou em `do_not_allow` nao
  // volta por aqui, porque o que se procura no mapa ja nao e o nome pedido.
  const contexto = comAtor(
    base([PAPEL_QUE_HABILITA], {
      casosDeTraducao: [
        (pedidoDeTraducao) =>
          pedidoDeTraducao.capacidade === 'resume_plugins'
            ? [CAPACIDADE_NEGADA]
            : null,
      ],
    }),
    ator('uma', 'papel-de-cima'),
  );

  assert.equal(perguntarPermissao(contexto, 'resume_plugins'), false);
});

// ── CA-9.3 · a verificacao automatizada, e o que ela acusa ──────────────────

test('CA-9.3: a conferencia falha quando sobra capacidade exigida sem declaracao', () => {
  const conferencia = conferirMatrizDeclarada({
    matriz: [papel('papel-de-cima', 'moderar')],
    exigidas: [
      'moderar',
      ...QUATRO_SO_POR_EXTENSAO,
      'ninguem-declarou',
      'ninguem-declarou',
    ],
  });

  assert.equal(conferencia.fechou, false);
  // Com nome, na ordem da entrada e sem repetir: o relato aponta para onde quem
  // confere olha.
  assert.deepEqual([...conferencia.semDeclaracao], ['ninguem-declarou']);
});

test('CA-9.3: a conferencia soma matriz, regra, concessao por extensao e chamador', () => {
  const conferencia = conferirMatrizDeclarada({
    matriz: [papel('papel-de-cima', 'moderar')],
    exigidas: [
      // da matriz — o nome da capacidade que o papel menciona, e so ele: o
      // IDENTIFICADOR do papel nao e capacidade declarada, ainda que sobre no
      // mapa do ator (`capacidades-do-ator.ts`, item 3).
      'moderar',
      // das duas sinteticas
      'exist',
      CAPACIDADE_NEGADA,
      // das quatro constantes, sem estar em papel algum
      'upload_plugins',
      'unfiltered_upload',
      // das concessoes de prioridade 1
      ...QUATRO_SO_POR_EXTENSAO,
      // do que o chamador declarar
      'declarada-pelo-chamador',
    ],
    declaradasPeloChamador: ['declarada-pelo-chamador'],
  });

  assert.equal(conferencia.fechou, true);
  assert.deepEqual([...conferencia.semDeclaracao], []);
});

test('CA-9.4: o mecanismo fecha a conta no dia em que a lista existir', () => {
  // 🔴 A lista dos 93 nomes nao esta nesta arvore, e inventa-la seria inventar
  // dado de analise. O que se afirma aqui e que a conferencia e **por
  // argumento**: quem decidir a primeira Pergunta em aberto da spec passa os 93
  // nomes em `exigidas` e le `semDeclaracao`, sem reescrever nada.
  const exigidas = [...QUATRO_SO_POR_EXTENSAO, 'moderar', 'ainda-sem-dono'];
  const conferencia = conferirMatrizDeclarada({
    matriz: [papel('papel-de-cima', 'moderar')],
    exigidas,
  });

  assert.deepEqual([...conferencia.semDeclaracao], ['ainda-sem-dono']);
  assert.equal(
    exigidas.every((capacidade) => conferencia.declaradas.has(capacidade)),
    false,
  );

  // E com a capacidade declarada pelo chamador, fecha.
  assert.equal(
    conferirMatrizDeclarada({
      matriz: [papel('papel-de-cima', 'moderar')],
      exigidas,
      declaradasPeloChamador: ['ainda-sem-dono'],
    }).fechou,
    true,
  );
});
