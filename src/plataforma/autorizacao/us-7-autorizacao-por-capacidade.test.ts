/**
 * Testes da entrega de **T015** (US-7): *"o comportamento de US-7 existe e os
 * criterios CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5 passam contra o sistema
 * novo"*.
 *
 * Nao sao os testes de US-7: esses sao **T016**, oito casos registrados em
 * `backlog/tests.md` (UT-014-1 a UT-014-8), e esse arquivo nao esta nesta arvore.
 * Aqui estao os cinco criterios de aceite e as regras que a implementacao
 * quebraria **em silencio** — as que o cenario
 * `parity_tests/07-autorizacao-por-capacidade.feature` chama de `@invariante`.
 *
 * Os nomes de papel usados nos casos sao inventados de proposito
 * (`papel-de-cima`, `papel-de-baixo`, …): se a decisao conhecesse os nomes de
 * fabrica, estes testes passariam por acidente. A matriz de fabrica de verdade e
 * exercitada do lado de BC-05, onde ela mora, em
 * `contextos/identidade-e-acesso/autorizacao/fonte-de-papeis.test.ts`.
 *
 * O que **nao** esta aqui, porque nao e desta tarefa: os 86 casos de traducao de
 * capacidade sobre objeto (US-8 / T017), as quatro capacidades concedidas so por
 * ponto de extensao (US-9 / T019) e o recorte de rede de `PERM-10` — este ultimo
 * com a consequencia declarada em `revogacao-por-constante.ts`.
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';

import {
  ATOR_ANONIMO,
  CAPACIDADE_CONCEDIDA_A_TODOS,
  CAPACIDADE_NEGADA,
  REDE_INATIVA_NA_AUTORIZACAO,
  atorDeAutorizacao,
  candidatosComCapacidade,
  capacidadesDeclaradas,
  capacidadesDoAtor,
  capacidadesExigidas,
  capacidadesExigidasSemDeclaracao,
  comAtor,
  ehSuperAdmin,
  papeisDoAtor,
  perguntarPermissao,
  quemTemCapacidade,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type CasoDeTraducao,
  type ConcessaoDeCapacidade,
  type ContextoDeAutorizacao,
  type FonteDeAutorizacao,
  type MatrizDePapeis,
  type PapelDeclarado,
} from './index.js';

// ── Montagem dos casos ──────────────────────────────────────────────────────

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

function concessoes(...nomes: readonly string[]): ConcessaoDeCapacidade[] {
  return nomes.map((capacidade) => ({ capacidade, concedida: true }));
}

function ator(
  login: string,
  ...gravadas: readonly ConcessaoDeCapacidade[]
): AtorDeAutorizacao {
  return { contaId: 1, login, existe: true, concessoes: gravadas };
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

/** Papeis de nome diferente com a MESMA capacidade. */
const MATRIZ_DE_DOIS_NOMES: MatrizDePapeis = [
  papel('papel-de-cima', 'mexer-no-alheio', 'ler'),
  papel('papel-de-outro-nome', 'mexer-no-alheio', 'ler'),
  papel('papel-de-baixo', 'ler'),
];

// ── CA-7.1 · nenhuma decisao compara nome de papel ──────────────────────────

/**
 * Os cinco papeis que o legado semeia. Estao aqui **como lista proibida**: e esta
 * a busca que o **P3** da constituicao manda fazer — *"uma busca por nome de papel
 * dentro de decisao de autorizacao devolve zero ocorrencias"*.
 */
const NOMES_DE_PAPEL_DE_FABRICA = [
  'administrator',
  'editor',
  'author',
  'contributor',
  'subscriber',
];

/** A raiz do projeto, achada pelo `package.json`, para ler o fonte da politica. */
function raizDoProjeto(): string {
  let pasta = dirname(fileURLToPath(import.meta.url));
  for (let salto = 0; salto < 10; salto += 1) {
    try {
      readFileSync(join(pasta, 'package.json'));
      return pasta;
    } catch {
      pasta = dirname(pasta);
    }
  }
  throw new Error('raiz do projeto nao encontrada a partir do teste');
}

/**
 * O fonte da politica, sem comentario.
 *
 * Sem comentario porque a busca do **P3** e sobre **decisao**, e prosa explicando
 * a regra cita os nomes — este proprio arquivo cita os cinco. O que nao pode
 * existir e comparacao.
 *
 * Os arquivos de teste ficam de fora pela mesma razao: eles montam caso, nao
 * decidem.
 */
function fonteDaPolitica(): readonly { arquivo: string; codigo: string }[] {
  const pasta = join(raizDoProjeto(), 'src', 'plataforma', 'autorizacao');
  return readdirSync(pasta)
    .filter((arquivo) => arquivo.endsWith('.ts') && !arquivo.endsWith('.test.ts'))
    .map((arquivo) => ({
      arquivo,
      codigo: readFileSync(join(pasta, arquivo), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/\/\/.*$/gm, ' '),
    }));
}

test('CA-7.1: nenhum nome de papel aparece no codigo da decisao (P3)', () => {
  const arquivos = fonteDaPolitica();

  // Se a leitura falhar, o teste nao pode passar por vacuidade.
  assert.ok(arquivos.length >= 8, 'o fonte da politica nao foi encontrado');

  for (const { arquivo, codigo } of arquivos) {
    for (const nome of NOMES_DE_PAPEL_DE_FABRICA) {
      assert.ok(
        !codigo.includes(nome),
        `${arquivo} compara o nome de papel "${nome}" — CA-7.1 e o P3 proibem`,
      );
    }
  }
});

test('CA-7.1: duas contas com papeis de nome diferente e as mesmas capacidades respondem igual', () => {
  const contexto = base(MATRIZ_DE_DOIS_NOMES);
  const umaConta = comAtor(contexto, ator('uma', ...concessoes('papel-de-cima')));
  const outraConta = comAtor(
    contexto,
    ator('outra', ...concessoes('papel-de-outro-nome')),
  );

  for (const capacidade of ['mexer-no-alheio', 'ler', 'inexistente']) {
    assert.equal(
      perguntarPermissao(umaConta, capacidade),
      perguntarPermissao(outraConta, capacidade),
      `a decisao divergiu em "${capacidade}" so pelo nome do papel`,
    );
  }
  assert.equal(perguntarPermissao(umaConta, 'mexer-no-alheio'), true);
});

test('CA-7.1: renomear o papel sem mudar capacidade nao altera a decisao', () => {
  const antes = base([papel('nome-antigo', 'mexer-no-alheio')]);
  const depois = base([papel('nome-novo', 'mexer-no-alheio')]);

  // A conta aponta para o papel pelo identificador: renomear o IDENTIFICADOR
  // muda o dado da conta tambem, e e o que o legado faz. O que CA-7.1 cobra e
  // que nenhum dos dois nomes seja privilegiado pela decisao.
  assert.equal(
    perguntarPermissao(
      comAtor(antes, ator('uma', ...concessoes('nome-antigo'))),
      'mexer-no-alheio',
    ),
    true,
  );
  assert.equal(
    perguntarPermissao(
      comAtor(depois, ator('uma', ...concessoes('nome-novo'))),
      'mexer-no-alheio',
    ),
    true,
  );
});

// ── CA-7.2 · a matriz e dado, consultavel e editavel em execucao ────────────

test('CA-7.2: acrescentar capacidade a um papel em execucao passa a conceder', () => {
  const comum = ator('uma', ...concessoes('papel-de-baixo'));

  const antes = base([papel('papel-de-baixo', 'ler')]);
  assert.equal(perguntarPermissao(comAtor(antes, comum), 'moderar'), false);

  // Nada de codigo muda: muda o DADO que chega por argumento.
  const depois = base([papel('papel-de-baixo', 'ler', 'moderar')]);
  assert.equal(perguntarPermissao(comAtor(depois, comum), 'moderar'), true);
});

test('CA-7.2: a matriz nao e estado de modulo — duas bases convivem na mesma decisao', () => {
  const comum = ator('uma', ...concessoes('papel-de-baixo'));
  const deUmSite = base([papel('papel-de-baixo', 'ler', 'moderar')]);
  const deOutroSite = base([papel('papel-de-baixo', 'ler')]);

  // Intercaladas: se a matriz virasse estado de modulo, a segunda resposta
  // contaminaria a terceira (EXT-CONTEXTO, area 5 do critério de paridade).
  assert.equal(perguntarPermissao(comAtor(deUmSite, comum), 'moderar'), true);
  assert.equal(perguntarPermissao(comAtor(deOutroSite, comum), 'moderar'), false);
  assert.equal(perguntarPermissao(comAtor(deUmSite, comum), 'moderar'), true);
});

// ── CA-7.3 · negacao explicita vence qualquer concessao ─────────────────────

const CAPACIDADE_FECHADA = 'operacao-fechada';

/** Um caso de traducao que fecha a porta, como os 40 pontos do legado fazem. */
const fechaAPorta: CasoDeTraducao = (pedido) =>
  pedido.capacidade === CAPACIDADE_FECHADA ? [CAPACIDADE_NEGADA] : null;

test('CA-7.3: a negacao explicita vence a concessao gravada', () => {
  const contexto = comAtor(
    base([papel('papel-de-cima', CAPACIDADE_FECHADA)], {
      casosDeTraducao: [fechaAPorta],
    }),
    // A conta tem a capacidade pelo papel E individualmente: nao basta.
    ator('uma', ...concessoes('papel-de-cima', CAPACIDADE_FECHADA)),
  );

  assert.equal(perguntarPermissao(contexto, CAPACIDADE_FECHADA), false);
});

test('CA-7.3: a negacao explicita vence o super administrador da rede', () => {
  const rede = { ativa: true, loginsDeSuperAdmin: ['dona-da-rede'] };
  const contexto = comAtor(
    base([], { rede, casosDeTraducao: [fechaAPorta] }),
    ator('dona-da-rede'),
  );

  assert.equal(ehSuperAdmin(contexto), true);
  // Tudo o mais passa, inclusive o que nenhum papel concede...
  assert.equal(perguntarPermissao(contexto, 'manage_network'), true);
  // ...menos o que foi negado explicitamente.
  assert.equal(perguntarPermissao(contexto, CAPACIDADE_FECHADA), false);
});

test('CA-7.3: ninguem consegue TER do_not_allow, nem gravada nem por ponto de extensao', () => {
  const contexto = comAtor(
    base([papel('papel-de-cima', CAPACIDADE_NEGADA)], {
      casosDeTraducao: [fechaAPorta],
      ganchos: {
        aoMontarCapacidadesDoAtor(capacidades) {
          return new Map(capacidades).set(CAPACIDADE_NEGADA, true);
        },
      },
    }),
    ator('uma', ...concessoes('papel-de-cima', CAPACIDADE_NEGADA)),
  );

  assert.equal(perguntarPermissao(contexto, CAPACIDADE_FECHADA), false);
  assert.equal(perguntarPermissao(contexto, CAPACIDADE_NEGADA), false);
});

test('CA-7.3: o ponto de extensao roda DEPOIS do atalho do super admin, e nao lhe retira poder', () => {
  const ordem: string[] = [];
  const rede = { ativa: true, loginsDeSuperAdmin: ['dona-da-rede'] };
  const contexto = comAtor(
    base([], {
      rede,
      casosDeTraducao: [
        (pedido) => {
          ordem.push(`traducao:${pedido.capacidade}`);
          return null;
        },
      ],
      ganchos: {
        aoMontarCapacidadesDoAtor() {
          ordem.push('gancho');
          // Uma extensao tentando fechar tudo.
          return new Map();
        },
      },
    }),
    ator('dona-da-rede'),
  );

  assert.equal(perguntarPermissao(contexto, 'manage_options'), true);
  // O gancho nem foi consultado: a decisao saiu antes dele (ADR-0009, garantia 2).
  assert.deepEqual(ordem, ['traducao:manage_options']);
});

test('CA-7.3: em site unico o administrador PASSA pelo ponto de extensao, e pode perder poder', () => {
  const contexto = comAtor(
    base([papel('papel-de-cima', 'delete_users', 'manage_options')], {
      ganchos: {
        aoMontarCapacidadesDoAtor(capacidades) {
          const sem = new Map(capacidades);
          sem.delete('manage_options');
          return sem;
        },
      },
    }),
    ator('uma', ...concessoes('papel-de-cima')),
  );

  // Fora da rede quem tem `delete_users` E o super administrador (PERM-9)...
  assert.equal(ehSuperAdmin(contexto), true);
  // ...e mesmo assim o ponto de extensao o alcanca, porque o atalho nao existe
  // fora da rede. E a consequencia que ADR-0009 registra.
  assert.equal(perguntarPermissao(contexto, 'manage_options'), false);
});

test('PERM-9: as duas definicoes de super administrador nao foram unificadas', () => {
  const matriz = [papel('papel-de-cima', 'delete_users')];
  const quemApagaContas = ator('uma', ...concessoes('papel-de-cima'));

  // Fora da rede: quem tem `delete_users`, e a lista de logins nao e consultada.
  const foraDaRede = base(matriz, {
    rede: { ativa: false, loginsDeSuperAdmin: [] },
  });
  assert.equal(ehSuperAdmin(comAtor(foraDaRede, quemApagaContas)), true);

  // Em rede: a lista de logins, e `delete_users` nao basta.
  const naRede = base(matriz, {
    rede: { ativa: true, loginsDeSuperAdmin: ['dona-da-rede'] },
  });
  assert.equal(ehSuperAdmin(comAtor(naRede, quemApagaContas)), false);
  assert.equal(
    ehSuperAdmin(comAtor(naRede, ator('dona-da-rede'))),
    true,
  );

  // Quem nao existe nunca e super administrador, nos dois modelos.
  assert.equal(ehSuperAdmin(comAtor(naRede, ATOR_ANONIMO)), false);
  assert.equal(ehSuperAdmin(comAtor(foraDaRede, ATOR_ANONIMO)), false);
});

// ── PERM-8 · as quatro constantes que retiram poder ─────────────────────────

const PODERES_DE_ARQUIVO = [
  'edit_plugins',
  'install_plugins',
  'update_core',
  'unfiltered_html',
];

function contextoDeDonoDoServidor(
  constantes: BaseDeAutorizacao['constantes'],
): ContextoDeAutorizacao {
  return comAtor(
    base([papel('papel-de-cima', ...PODERES_DE_ARQUIVO, 'unfiltered_upload')], {
      rede: { ativa: true, loginsDeSuperAdmin: ['dona-da-rede'] },
      ...(constantes === undefined ? {} : { constantes }),
    }),
    ator('dona-da-rede', ...concessoes('papel-de-cima')),
  );
}

test('PERM-8: de fabrica as tres constantes de proibicao nao revogam nada', () => {
  const contexto = contextoDeDonoDoServidor(undefined);

  for (const capacidade of PODERES_DE_ARQUIVO) {
    assert.equal(
      perguntarPermissao(contexto, capacidade),
      true,
      `${capacidade} foi revogada sem constante definida`,
    );
  }
});

test('PERM-8: cada constante retira o poder, inclusive do super administrador', () => {
  assert.equal(
    perguntarPermissao(
      contextoDeDonoDoServidor({ DISALLOW_UNFILTERED_HTML: true }),
      'unfiltered_html',
    ),
    false,
  );

  const semEdicao = contextoDeDonoDoServidor({ DISALLOW_FILE_EDIT: true });
  assert.equal(perguntarPermissao(semEdicao, 'edit_plugins'), false);
  // `DISALLOW_FILE_EDIT` alcanca editar, e nao instalar.
  assert.equal(perguntarPermissao(semEdicao, 'install_plugins'), true);

  const semModificacao = contextoDeDonoDoServidor({ DISALLOW_FILE_MODS: true });
  assert.equal(perguntarPermissao(semModificacao, 'install_plugins'), false);
  assert.equal(perguntarPermissao(semModificacao, 'update_core'), false);
  // E alcanca editar tambem, pelo `fall through` do legado.
  assert.equal(perguntarPermissao(semModificacao, 'edit_plugins'), false);
});

test('PERM-8: a constante definida como falsa nao revoga (defined && X)', () => {
  assert.equal(
    perguntarPermissao(
      contextoDeDonoDoServidor({ DISALLOW_FILE_MODS: false }),
      'install_plugins',
    ),
    true,
  );
});

test('PERM-8: `unfiltered_upload` e a inversa — negada de fabrica, mesmo a quem a tem', () => {
  assert.equal(
    perguntarPermissao(contextoDeDonoDoServidor(undefined), 'unfiltered_upload'),
    false,
  );
  assert.equal(
    perguntarPermissao(
      contextoDeDonoDoServidor({ ALLOW_UNFILTERED_UPLOADS: true }),
      'unfiltered_upload',
    ),
    true,
  );
});

test('PERM-8: a revogacao e a PRIMEIRA da ordem, e um caso de objeto nao a reabre', () => {
  const contexto = comAtor(
    base([papel('papel-de-cima', 'unfiltered_html')], {
      constantes: { DISALLOW_UNFILTERED_HTML: true },
      // Um caso que tentasse reabrir o que a constante fechou.
      casosDeTraducao: [
        (pedido) =>
          pedido.capacidade === 'unfiltered_html' ? ['unfiltered_html'] : null,
      ],
    }),
    ator('uma', ...concessoes('papel-de-cima')),
  );

  assert.deepEqual(capacidadesExigidas(contexto, 'unfiltered_html'), [
    CAPACIDADE_NEGADA,
  ]);
  assert.equal(perguntarPermissao(contexto, 'unfiltered_html'), false);
});

// ── PERM-1 · o mapa do ator, e as regras que ele carrega ────────────────────

test('PERM-1: o mapa funde os papeis na ordem e sobrepoe as individuais', () => {
  const matriz: MatrizDePapeis = [
    papel('papel-de-cima', 'ler', 'moderar'),
    papel('papel-de-baixo', 'ler'),
  ];
  const comDoisPapeis = ator(
    'uma',
    ...concessoes('papel-de-baixo', 'papel-de-cima'),
    { capacidade: 'moderar', concedida: false },
  );

  const mapa = capacidadesDoAtor(comDoisPapeis, matriz);

  // Os dois papeis valem ao mesmo tempo (`PERM-1`: pode ter varios papeis)...
  assert.equal(mapa.get('ler'), true);
  // ...e a individual sobrepoe a concessao do papel, inclusive para negar.
  assert.equal(mapa.get('moderar'), false);
  assert.equal(
    perguntarPermissao(comAtor(base(matriz), comDoisPapeis), 'moderar'),
    false,
  );
  // A posicao de quem ja estava no mapa nao muda com a sobreposicao: e a
  // semantica de `array_merge`, e o mapa e percorrido por ponto de extensao.
  assert.deepEqual(
    [...mapa.keys()],
    ['ler', 'moderar', 'papel-de-baixo', 'papel-de-cima'],
  );
});

test('PERM-1: capacidade sem papel nenhum vale, e o nome do papel sobra no mapa', () => {
  const contexto = base([papel('papel-de-cima', 'moderar')]);
  const semPapel = ator('uma', ...concessoes('moderar'));

  assert.deepEqual(papeisDoAtor(semPapel, contexto.matriz), []);
  assert.equal(perguntarPermissao(comAtor(contexto, semPapel), 'moderar'), true);

  // E a pegadinha que vem de graca do `array_merge` do legado: o nome do papel
  // fica no mapa como se fosse capacidade, logo perguntar por ele responde
  // "sim". Esta reproduzido de proposito (P1) — e NAO e a decisao comparando
  // nome de papel: e o dado do ator contendo o nome.
  const comPapel = ator('outra', ...concessoes('papel-de-cima'));
  assert.equal(
    perguntarPermissao(comAtor(contexto, comPapel), 'papel-de-cima'),
    true,
  );
});

test('PERM-1: o papel gravado com valor falso continua sendo papel do ator', () => {
  // ⚠️ Mecanismo lido do legado — `array_filter( array_keys( $caps ), is_role )`
  // filtra a CHAVE e ignora o valor — e nao documentado nome por nome neste
  // pacote. Fecha contra o oraculo (ESC-ORACULO). A escolha oposta produziria um
  // sistema MAIS FECHADO que o legado, que e o erro que esta feature evita.
  const contexto = base([papel('papel-de-cima', 'moderar')]);
  const comPapelDesligado: AtorDeAutorizacao = {
    contaId: 1,
    login: 'uma',
    existe: true,
    concessoes: [{ capacidade: 'papel-de-cima', concedida: false }],
  };

  assert.deepEqual(papeisDoAtor(comPapelDesligado, contexto.matriz), [
    'papel-de-cima',
  ]);
  assert.equal(
    perguntarPermissao(comAtor(contexto, comPapelDesligado), 'moderar'),
    true,
  );
  // Mas o nome do papel, esse sim, foi sobreposto com falso.
  assert.equal(
    perguntarPermissao(comAtor(contexto, comPapelDesligado), 'papel-de-cima'),
    false,
  );
});

test('PERM-1: `exist` e concedida a todo mundo, inclusive a quem nao esta autenticado', () => {
  const contexto = base([]);

  assert.equal(
    perguntarPermissao(comAtor(contexto, ATOR_ANONIMO), CAPACIDADE_CONCEDIDA_A_TODOS),
    true,
  );
  // E nem o ponto de extensao a retira: ela e aplicada depois dele.
  const comGanchoQueFechaTudo = base([], {
    ganchos: { aoMontarCapacidadesDoAtor: () => new Map() },
  });
  assert.equal(
    perguntarPermissao(
      comAtor(comGanchoQueFechaTudo, ATOR_ANONIMO),
      CAPACIDADE_CONCEDIDA_A_TODOS,
    ),
    true,
  );
  // Quem nao esta autenticado e negado em tudo o mais.
  assert.equal(perguntarPermissao(comAtor(contexto, ATOR_ANONIMO), 'ler'), false);
});

test('PERM-1: sao exigidas TODAS as capacidades devolvidas, nao qualquer uma', () => {
  const contexto = comAtor(
    base([papel('papel-de-cima', 'mexer-no-alheio')], {
      casosDeTraducao: [
        (pedido) =>
          pedido.capacidade === 'mexer-no-publicado-de-outro'
            ? ['mexer-no-alheio', 'mexer-no-publicado']
            : null,
      ],
    }),
    ator('uma', ...concessoes('papel-de-cima')),
  );

  assert.equal(perguntarPermissao(contexto, 'mexer-no-alheio'), true);
  assert.equal(perguntarPermissao(contexto, 'mexer-no-publicado-de-outro'), false);
});

test('PERM-6: lista vazia de mapeamento significa PERMITIDO', () => {
  const contexto = comAtor(
    base([], {
      casosDeTraducao: [
        (pedido) => (pedido.capacidade === 'o-proprio-perfil' ? [] : null),
      ],
    }),
    // Sem papel, sem capacidade, e nem autenticado.
    ATOR_ANONIMO,
  );

  assert.deepEqual(capacidadesExigidas(contexto, 'o-proprio-perfil'), []);
  assert.equal(perguntarPermissao(contexto, 'o-proprio-perfil'), true);
});

test('a capacidade que ninguem declarou e negada, pelo ramo final da traducao', () => {
  const contexto = comAtor(
    base([papel('papel-de-cima', 'moderar')]),
    ator('uma', ...concessoes('papel-de-cima')),
  );

  assert.deepEqual(capacidadesExigidas(contexto, 'capacidade-que-ninguem-declarou'), [
    'capacidade-que-ninguem-declarou',
  ]);
  assert.equal(
    perguntarPermissao(contexto, 'capacidade-que-ninguem-declarou'),
    false,
  );
});

test('a mesma pergunta repetida na mesma requisicao devolve o mesmo (sem cache, sem estado)', () => {
  const contexto = comAtor(
    base([papel('papel-de-cima', 'moderar')]),
    ator('uma', ...concessoes('papel-de-cima')),
  );

  const respostas = [1, 2, 3].map(() => perguntarPermissao(contexto, 'moderar'));
  assert.deepEqual(respostas, [true, true, true]);
});

// ── CA-7.4 · quem tem uma capacidade dada ───────────────────────────────────

/**
 * Uma fonte de teste que **registra o que foi perguntado ao armazenamento**: e o
 * criterio de paridade desta area (*"efeito no banco"*), e o que importa afirmar e
 * por quais nomes a busca foi feita.
 */
function fonteDeTeste(
  gravado: ReadonlyMap<number, readonly ConcessaoDeCapacidade[]>,
): { fonte: FonteDeAutorizacao; nomesProcurados: string[] } {
  const nomesProcurados: string[] = [];
  return {
    nomesProcurados,
    fonte: {
      concessoesDaConta(contaId) {
        return gravado.get(contaId) ?? [];
      },
      loginDaConta(contaId) {
        return gravado.has(contaId) ? `conta-${String(contaId)}` : null;
      },
      contasComNomeNasCapacidades(nome) {
        nomesProcurados.push(nome);
        const encontradas: number[] = [];
        for (const [contaId, concessoesDaConta] of gravado) {
          if (concessoesDaConta.some((item) => item.capacidade === nome)) {
            encontradas.push(contaId);
          }
        }
        return encontradas;
      },
    },
  };
}

test('CA-7.4: quem tem a capacidade sai por consulta ao armazenamento, por papel e por concessao individual', () => {
  const { fonte, nomesProcurados } = fonteDeTeste(
    new Map<number, readonly ConcessaoDeCapacidade[]>([
      [1, concessoes('papel-de-cima')],
      [2, concessoes('papel-de-baixo')],
      [3, concessoes('papel-de-baixo', 'moderar')],
      [4, [{ capacidade: 'moderar', concedida: false }]],
    ]),
  );
  const contexto = base([
    papel('papel-de-cima', 'moderar'),
    papel('papel-de-baixo', 'ler'),
  ]);

  assert.deepEqual(quemTemCapacidade('moderar', contexto, fonte), [1, 3]);

  // A busca foi pelos nomes que o armazenamento alcanca: o papel que concede, e
  // a propria capacidade. Nenhum indice, nenhuma outra consulta.
  assert.deepEqual(nomesProcurados, ['papel-de-cima', 'moderar']);
});

test('CA-7.4: o candidato que o texto encontra e CONFIRMADO pela decisao', () => {
  const { fonte } = fonteDeTeste(
    new Map<number, readonly ConcessaoDeCapacidade[]>([
      [1, concessoes('moderar', CAPACIDADE_FECHADA)],
      [2, [{ capacidade: 'moderar', concedida: false }]],
    ]),
  );
  const contexto = base([], { casosDeTraducao: [fechaAPorta] });

  // O texto serializado menciona o nome nas duas contas...
  assert.deepEqual(candidatosComCapacidade('moderar', contexto, fonte), [1, 2]);
  // ...e so uma tem a concessao.
  assert.deepEqual(quemTemCapacidade('moderar', contexto, fonte), [1]);

  // E uma capacidade fechada por negacao explicita nao tem ninguem (CA-7.3),
  // mesmo com a concessao gravada e encontrada pela busca.
  assert.deepEqual(
    candidatosComCapacidade(CAPACIDADE_FECHADA, contexto, fonte),
    [1],
  );
  assert.deepEqual(quemTemCapacidade(CAPACIDADE_FECHADA, contexto, fonte), []);
});

test('CA-7.4: o ator de cada candidato e montado da fonte, e quem nao existe nao vira ator', () => {
  const { fonte } = fonteDeTeste(
    new Map<number, readonly ConcessaoDeCapacidade[]>([
      [7, concessoes('papel-de-cima')],
    ]),
  );

  const existente = atorDeAutorizacao(7, fonte);
  assert.equal(existente.existe, true);
  assert.equal(existente.login, 'conta-7');
  assert.deepEqual(existente.concessoes, concessoes('papel-de-cima'));

  const inexistente = atorDeAutorizacao(8, fonte);
  assert.equal(inexistente.existe, false);
  assert.deepEqual(inexistente.concessoes, []);

  // E a requisicao sem ninguem autenticado nao vai ao armazenamento.
  assert.equal(atorDeAutorizacao(0, fonte), ATOR_ANONIMO);
});

// ── CA-7.5 · toda capacidade exigida consta da matriz declarada ─────────────

test('CA-7.5: a conferencia acha a capacidade exigida que nao esta declarada', () => {
  const matriz: MatrizDePapeis = [papel('papel-de-cima', 'moderar', 'ler')];
  const declaradas = capacidadesDeclaradas(matriz);

  assert.deepEqual(
    capacidadesExigidasSemDeclaracao(['moderar', 'ler'], declaradas),
    [],
  );
  assert.deepEqual(
    capacidadesExigidasSemDeclaracao(
      ['moderar', 'ninguem-declarou', 'ninguem-declarou'],
      declaradas,
    ),
    ['ninguem-declarou'],
  );
});

test('CA-7.5: a capacidade NEGADA por um papel conta como declarada', () => {
  const matriz: MatrizDePapeis = [
    {
      identificador: 'papel-de-baixo',
      capacidades: [{ capacidade: 'moderar', concedida: false }],
    },
  ];

  assert.deepEqual(
    capacidadesExigidasSemDeclaracao(['moderar'], capacidadesDeclaradas(matriz)),
    [],
  );
});

test('CA-7.5: as sinteticas e as alcancadas por constante sao declaradas sem estar em papel algum', () => {
  const declaradas = capacidadesDeclaradas([]);

  assert.deepEqual(
    capacidadesExigidasSemDeclaracao(
      [
        CAPACIDADE_CONCEDIDA_A_TODOS,
        CAPACIDADE_NEGADA,
        'unfiltered_html',
        'unfiltered_upload',
        // Nenhum papel as concede: UC-33 diz que resolvem para as de instalar.
        'upload_plugins',
        'upload_themes',
      ],
      declaradas,
    ),
    [],
  );
});

test('CA-7.5: o terceiro argumento e o encaixe de T019, e sem ele a conferencia acusa', () => {
  // As quatro capacidades que o legado concede SO por ponto de extensao
  // (`PERM-7`, BR-MIGRAR-093). Hoje nao estao declaradas, e o cenario de
  // paridade confirma que de fabrica as duas metades NEGAM. Declarar que elas
  // tem responsavel e US-9 / T019, com a verificacao automatizada de CA-9.3 —
  // esta tarefa entrega o mecanismo e nao fecha a conta, porque a lista das 93
  // capacidades nao esta neste pacote (primeira Pergunta em aberto da spec).
  const soPorExtensao = [
    'install_languages',
    'resume_plugins',
    'resume_themes',
    'view_site_health_checks',
  ];

  assert.deepEqual(
    capacidadesExigidasSemDeclaracao(
      soPorExtensao,
      capacidadesDeclaradas([papel('papel-de-cima', 'moderar')]),
    ),
    soPorExtensao,
  );

  assert.deepEqual(
    capacidadesExigidasSemDeclaracao(
      soPorExtensao,
      capacidadesDeclaradas([papel('papel-de-cima', 'moderar')], soPorExtensao),
    ),
    [],
  );
});
