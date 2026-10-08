/**
 * Testes de **US-4** — *"Manter a lista de termos de cada contexto, com
 * hierarquia e contagem de uso"* —, entrega de **T009**: *"o comportamento de
 * US-4 existe e os criterios CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5 passam contra
 * o sistema novo"*.
 *
 * O que se afirma aqui, e por que desta forma:
 *
 * 1. **A sequencia de comandos**, porque o criterio desta area e *"efeito no
 *    banco"* (area 3 da Decisao 2 de `parity_specs.md`, que compara *"snapshot +
 *    sequencia de comandos"*). Nesta historia duas sequencias sao a propria
 *    regra: a criacao **insere antes de perguntar** e desfaz as duas insercoes se
 *    a resposta vier, e a cascata de exclusao emite sete comandos em ordem fixa.
 *    Por isso a porta de teste **registra consulta** em vez de simular banco.
 * 2. **A `@cascata`**, que `parity_specs.md` torna **obrigatoria** em *"exclusao
 *    de conteudo e de termo"* — e esta e a exclusao de termo. O **P5** manda
 *    afirmar *"o conjunto exato do que sumiu e do que permaneceu, inclusive o que
 *    permaneceu orfao"*, e e o que os testes de CA-4.3 fazem: o `DELETE` alcanca
 *    **so** a juncao, e nenhum comando toca o conteudo.
 * 3. **A `@invariante`**, obrigatoria em *"todo fluxo cujo aggregate tem
 *    invariante"*: `DB-TRG4` (*"apagar um termo devolve o objeto ao termo padrao,
 *    se aquele era o unico"*) e a **terceira** das quatro invariantes de
 *    `AGG-Termo` em `target_domain_model.md`.
 * 4. **Que a recusa de CA-4.1 nao toca o banco**, porque UC-08 e literal: a acao
 *    em lote e recusada *"antes de tocar qualquer registro"*.
 * 5. **Que `manage_post_tags` resolve para `manage_categories`** — `PERM-6`, e o
 *    caso em que um porte que leia so a matriz de papeis tranca **todo mundo**
 *    fora da lista de etiquetas, inclusive o administrador.
 *
 * ⚠️ **Nenhum destes testes e teste de paridade.** Nao existe `.feature` de
 * classificacao em `parity_tests/`, o oraculo **executavel** do legado nao existe
 * nesta arvore (`oracleAvailable: false`; levanta-lo e T001 da feature `015`) e,
 * nesta arvore de trabalho, **a instalacao do legado tambem nao esta no disco** —
 * nao ha `wp-includes/taxonomy.php` nem `wp-admin/edit-tags.php` para reconferir
 * ancora. Cada afirmacao abaixo vem do pacote (`spec.md`, `plan.md`, `UC-08`,
 * `BR-MIGRAR-079`, `BR-MIGRAR-080`, `BR-MIGRAR-092`, `target_screens.md`
 * `SCR-044`, `target_domain_model.md`) ou da transcricao **merged** de T002 e
 * T003. Os tres pontos que o pacote nao especifica tem teste com 🔴 no nome.
 *
 * ⚠️ **E nao sao os testes de `backlog/tests.md`**: os sete casos `UT-036-1` a
 * `UT-036-7` sao **T010**, que roda em paralelo com esta tarefa e tem suite
 * propria.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ATOR_ANONIMO,
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarPortaDeDadosFalsa,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import { criarModuloDeClassificacao, type ModuloDeClassificacao } from '../index.js';
import type { Consulta, LinhaDeResultado } from '../portas/index.js';
import { ehErroDeTermo, type ErroDeTermo } from '../rotulo-e-contexto/index.js';
import type {
  ColaboracaoDoVinculo,
  ConteudoNaClassificacao,
} from '../vinculo-de-objeto/index.js';
import {
  OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
  SEM_TERMO_PADRAO,
  type OpcoesNaClassificacao,
} from '../termo-padrao/index.js';
import { apagarRotuloDoContexto } from './apagar-rotulo-do-contexto.js';
import {
  CAPACIDADES_DE_GESTAO_DE_ROTULO,
  CAPACIDADE_DE_GERENCIAR_CLASSIFICACAO,
  casoDeGestaoDeRotulo,
} from './caso-de-gestao-de-rotulo.js';
import type { ColaboracaoDaExclusaoDeRotulo } from './escopo-de-manutencao-da-lista.js';
import { paiAceitoNoContexto } from './hierarquia-do-rotulo.js';
import { MENSAGENS_DA_TELA_DE_ROTULOS } from './permissao-na-gestao-de-rotulos.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

/** O objeto classificado. "Objeto", nao "conteudo": a coluna e polimorfica. */
const OBJETO = 42;

/** O rotulo que esta sendo apagado, e o `term_taxonomy_id` dele em `category`. */
const ROTULO = 12;
const ROTULO_NO_CONTEXTO = 30;

/** Um segundo rotulo do mesmo objeto, para o ramo *"perde so aquele termo"*. */
const OUTRO_ROTULO = 99;
const OUTRO_ROTULO_NO_CONTEXTO = 31;

/** O rotulo que a opcao `default_category` guarda. E um `term_id`. */
const ROTULO_PADRAO = 1;
/** O `term_taxonomy_id` dele em `category` — e e este que a juncao grava. */
const ROTULO_PADRAO_NO_CONTEXTO = 5;

/** O pai de {@link ROTULO} — o **avo** dos filhos dele, em `DB-TRG3`. */
const ROTULO_AVO = 7;

/**
 * A matriz de papeis, com os tres atores que esta historia distingue.
 *
 * `manage_categories` so no editor e **nenhum papel tem `manage_post_tags`**, que
 * e o fato de que `PERM-6` depende: o nome nao e primitivo e nao esta em papel
 * algum.
 */
const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'editor',
    capacidades: [
      { capacidade: 'manage_categories', concedida: true },
      { capacidade: 'edit_posts', concedida: true },
    ],
  },
  {
    identificador: 'author',
    capacidades: [{ capacidade: 'edit_posts', concedida: true }],
  },
  {
    identificador: 'subscriber',
    capacidades: [{ capacidade: 'read', concedida: true }],
  },
];

const BASE: BaseDeAutorizacao = {
  matriz: MATRIZ,
  rede: REDE_INATIVA_NA_AUTORIZACAO,
};

/**
 * Um ator com um papel.
 *
 * O papel chega como **concessao individual com o nome do papel**, que e a forma
 * do legado: `{site}capabilities` guarda o nome do papel como chave, e
 * `capacidadesDoAtor()` funde os papeis e sobrepoe as individuais.
 */
function ator(papel: string, contaId = 7): AtorDeAutorizacao {
  return {
    contaId,
    login: papel,
    existe: true,
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

/** A colaboracao com BC-01, que no alvo e `posts` e aqui registra as chamadas. */
function conteudoDeTeste(): {
  colaboracao: ColaboracaoDoVinculo;
  contagensPedidas: number[];
} {
  const contagensPedidas: number[] = [];
  const conteudo: ConteudoNaClassificacao = {
    tipoDeConteudoEhRegistrado: (tipo) =>
      ['post', 'page', 'attachment'].includes(tipo),
    contarConteudoPublicado: (rotuloNoContextoId) => {
      contagensPedidas.push(rotuloNoContextoId);
      return 0;
    },
    contarAnexosPublicados: () => 0,
  };
  return { colaboracao: { conteudo }, contagensPedidas };
}

/** A leitura de opcao por ligacao tardia, que **registra as chaves lidas**. */
function opcoesDeTeste(valores: Readonly<Record<string, number>> = {}): {
  opcoes: OpcoesNaClassificacao;
  chavesLidas: string[];
} {
  const chavesLidas: string[] = [];
  return {
    opcoes: {
      identificadorDoTermoPadrao(chave) {
        chavesLidas.push(chave);
        return valores[chave] ?? SEM_TERMO_PADRAO;
      },
    },
    chavesLidas,
  };
}

function montar(prefixoDeTabela = 'wp_'): {
  falsa: PortaDeDadosFalsa;
  modulo: ModuloDeClassificacao;
} {
  const falsa = criarPortaDeDadosFalsa({ prefixoDeTabela });
  return { falsa, modulo: criarModuloDeClassificacao({ dados: falsa.porta }) };
}

/** O cenario da cascata, com os dois dubles ligados. */
function cenarioDeExclusao(
  opcoes: Readonly<Record<string, number>> = {},
): {
  falsa: PortaDeDadosFalsa;
  modulo: ModuloDeClassificacao;
  colaboracao: ColaboracaoDaExclusaoDeRotulo;
  chavesLidas: string[];
  contagensPedidas: number[];
} {
  const { falsa, modulo } = montar();
  const leitura = opcoesDeTeste(opcoes);
  const conteudo = conteudoDeTeste();

  return {
    falsa,
    modulo,
    colaboracao: { ...conteudo.colaboracao, opcoes: leitura.opcoes },
    chavesLidas: leitura.chavesLidas,
    contagensPedidas: conteudo.contagensPedidas,
  };
}

/** A colaboracao de CA-4.1: so a base e o ator, sem `conteudo` e sem `opcoes`. */
function cenarioDeTela(papel?: string): {
  falsa: PortaDeDadosFalsa;
  modulo: ModuloDeClassificacao;
  colaboracao: { base: BaseDeAutorizacao; ator: AtorDeAutorizacao };
} {
  const { falsa, modulo } = montar();
  return {
    falsa,
    modulo,
    colaboracao: {
      base: BASE,
      ator: papel === undefined ? ATOR_ANONIMO : ator(papel),
    },
  };
}

/**
 * Uma linha da leitura fundida `SELECT t.*, tt.*`
 * (`wp-includes/class-wp-term.php:132`), com as nove colunas que o nucleo
 * conhece.
 */
function linhaDeTermo(campos: {
  readonly term_id: number;
  readonly term_taxonomy_id: number;
  readonly taxonomy: string;
  readonly name?: string;
  readonly slug?: string;
  readonly parent?: number;
  readonly count?: number;
}): LinhaDeResultado {
  return {
    term_id: campos.term_id,
    term_taxonomy_id: campos.term_taxonomy_id,
    name: campos.name ?? 'Noticias',
    slug: campos.slug ?? 'noticias',
    taxonomy: campos.taxonomy,
    description: '',
    parent: campos.parent ?? 0,
    count: campos.count ?? 0,
    term_group: 0,
  };
}

/** A resposta de `idDoRotuloNoContexto` e de `vinculos.existe`: o par, ou nada. */
function programarPar(
  falsa: PortaDeDadosFalsa,
  rotuloNoContextoId: number | null,
): void {
  falsa.responder(
    rotuloNoContextoId === null ? [] : [{ term_taxonomy_id: rotuloNoContextoId }],
  );
}

/** A resposta de qualquer leitura que devolve uma coluna de `term_id`. */
function programarRotulos(
  falsa: PortaDeDadosFalsa,
  rotuloIds: readonly number[],
): void {
  falsa.responder(rotuloIds.map((term_id) => ({ term_id })));
}

/** A resposta de `listarObjetosDoRotuloNoContexto` (`taxonomy.php:2152`). */
function programarObjetos(
  falsa: PortaDeDadosFalsa,
  objetoIds: readonly number[],
): void {
  falsa.responder(objetoIds.map((object_id) => ({ object_id })));
}

/** So o texto dos comandos, para afirmar a sequencia sem repetir parametros. */
function textos(consultas: readonly Consulta[]): readonly string[] {
  return consultas.map((consulta) => consulta.texto);
}

function comoErro(valor: unknown): ErroDeTermo {
  assert.equal(ehErroDeTermo(valor), true);
  return valor as ErroDeTermo;
}

/**
 * Programa a cascata de exclusao de {@link ROTULO} em `category`, do inicio ao
 * fim, para um objeto so.
 *
 * A ordem das respostas e a ordem das leituras, e ela **e** a sequencia que o
 * legado emite — por isso este helper e um por um, e nao um mapa: trocar duas
 * linhas aqui muda o que se esta afirmando.
 */
function programarCascata(
  falsa: PortaDeDadosFalsa,
  cenario: {
    /** Os rotulos que o objeto tem naquele contexto, em `term_id`. */
    readonly rotulosDoObjeto: readonly number[];
    /** O pai de {@link ROTULO}: o avo dos filhos dele. */
    readonly rotuloPaiId?: number;
    /** Os filhos que a leitura de `:2121` devolve. */
    readonly filhos?: readonly { term_id: number; term_taxonomy_id: number }[];
    /** O par que a substituicao resolve para o rotulo informado, se houver. */
    readonly rotuloInformadoNoContexto?: number;
    /** Se o vinculo informado ja estava gravado. */
    readonly vinculoJaGravado?: boolean;
    /**
     * Os rotulos que a substituicao integral remove — o que a volta de
     * `term_taxonomy_id` para `term_id` devolve (`:2954`).
     */
    readonly rotulosRemovidos?: readonly number[];
    /** Em quantos contextos o rotulo ainda serve, depois do `DELETE`. */
    readonly contextosRestantes?: number;
  },
): void {
  const paiId = cenario.rotuloPaiId ?? 0;
  const linhaDoRotulo = linhaDeTermo({
    term_id: ROTULO,
    term_taxonomy_id: ROTULO_NO_CONTEXTO,
    taxonomy: 'category',
    parent: paiId,
  });

  // 1. `get_term()` — a resolucao do par (passo 1 da cascata).
  falsa.responder([linhaDoRotulo]);
  // 2. os filhos (`:2121`), que **nao** filtram por contexto.
  falsa.responder(cenario.filhos ?? []);
  // 3. os objetos vinculados (`:2152`).
  programarObjetos(falsa, [OBJETO]);
  // 4. os rotulos que o objeto tem naquele contexto.
  programarRotulos(falsa, cenario.rotulosDoObjeto);

  // 5. dentro de `wp_set_object_terms()`: o conjunto anterior, em dois passos.
  programarRotulos(falsa, cenario.rotulosDoObjeto);
  for (const rotuloId of cenario.rotulosDoObjeto) {
    falsa.responder([
      linhaDeTermo({
        term_id: rotuloId,
        term_taxonomy_id:
          rotuloId === ROTULO ? ROTULO_NO_CONTEXTO : OUTRO_ROTULO_NO_CONTEXTO,
        taxonomy: 'category',
        parent: paiId,
      }),
    ]);
  }

  // 6. a resolucao do rotulo informado, e a leitura do vinculo existente.
  if (cenario.rotuloInformadoNoContexto !== undefined) {
    programarPar(falsa, cenario.rotuloInformadoNoContexto);
    programarPar(
      falsa,
      cenario.vinculoJaGravado === true
        ? cenario.rotuloInformadoNoContexto
        : null,
    );
  }

  // 7. a volta de `term_taxonomy_id` para `term_id` da remocao (`:2954`), e a
  //    resolucao de cada um dentro de `wp_remove_object_terms()`.
  const removidos = cenario.rotulosRemovidos ?? [ROTULO];
  programarRotulos(falsa, removidos);
  for (const rotuloId of removidos) {
    programarPar(
      falsa,
      rotuloId === ROTULO ? ROTULO_NO_CONTEXTO : OUTRO_ROTULO_NO_CONTEXTO,
    );
  }

  // 8. o trecho final de T003: a leitura do par, e a contagem de contextos.
  falsa.responder([linhaDoRotulo]);
  falsa.responder([{ 'COUNT(*)': cenario.contextosRestantes ?? 0 }]);
}

/* ══════════════════════════════════════════════════════════════════════════
   CA-4.1 — "A tela exige a capacidade que o contexto declara para gerencia-lo"
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-4.1 o editor gerencia a lista de categorias, e nenhum comando sai', () => {
  const { falsa, modulo, colaboracao } = cenarioDeTela('editor');

  const resultado = modulo.permissaoDeGerenciarRotulos(colaboracao, 'category');

  assert.deepEqual(resultado, {
    permitido: true,
    contexto: modulo.contextos.obter('category'),
  });

  // UC-08 e literal: a recusa e *"antes de tocar qualquer registro"*, e a
  // permissao tambem nao le nada — os tres portoes olham o registro desta
  // requisicao e a matriz que chegou por argumento.
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('CA-4.1 `manage_post_tags` resolve para `manage_categories`, e sem isso ninguem gerencia etiquetas (PERM-6)', () => {
  const { modulo, colaboracao } = cenarioDeTela('editor');

  // `post_tag` declara `manage_post_tags` em `manage_terms`
  // (`../registro/contextos-do-nucleo.ts`), e **nenhum papel da matriz o
  // concede**: sem o atalho de `capabilities.php:751` o editor seria recusado.
  assert.equal(
    modulo.contextos.obter('post_tag')?.capacidades.gerenciarRotulos,
    'manage_post_tags',
  );
  assert.equal(
    MATRIZ.some((papel) =>
      papel.capacidades.some(
        (concessao) => concessao.capacidade === 'manage_post_tags',
      ),
    ),
    false,
  );

  const resultado = modulo.permissaoDeGerenciarRotulos(colaboracao, 'post_tag');

  assert.equal(resultado.permitido, true);
});

test('CA-4.1 os cinco nomes de capacidade de taxonomia resolvem para a MESMA capacidade real', () => {
  // `BR-MIGRAR-092` (`PERM-6`), `capabilities.php:751`, e a primeira regra de
  // negocio de *Regras de negocio aplicadas* de UC-08.
  assert.deepEqual(CAPACIDADES_DE_GESTAO_DE_ROTULO, [
    'manage_post_tags',
    'edit_categories',
    'edit_post_tags',
    'delete_categories',
    'delete_post_tags',
  ]);

  for (const capacidade of CAPACIDADES_DE_GESTAO_DE_ROTULO) {
    assert.deepEqual(
      casoDeGestaoDeRotulo({
        capacidade,
        contaId: 7,
        argumentos: [],
        constantes: {},
        emRede: false,
      }),
      [CAPACIDADE_DE_GERENCIAR_CLASSIFICACAO],
    );
  }

  // ⚠️ `manage_categories` **nao** esta na lista: ela e a capacidade real, e
  // atravessa a traducao pelo `default:`. E `assign_categories` tampouco: ela
  // resolve para `edit_posts`, e e o caso de T005.
  for (const capacidade of [
    'manage_categories',
    'assign_categories',
    'assign_post_tags',
    'edit_posts',
  ]) {
    assert.equal(
      casoDeGestaoDeRotulo({
        capacidade,
        contaId: 7,
        argumentos: [],
        constantes: {},
        emRede: false,
      }),
      null,
    );
  }
});

test('CA-4.1 quem nao tem a capacidade e recusado, com o titulo e a mensagem do legado, e sem tocar o banco', () => {
  const { falsa, modulo, colaboracao } = cenarioDeTela('subscriber');

  const resultado = modulo.permissaoDeGerenciarRotulos(colaboracao, 'category');

  // Os dois `msgid` que o legado emite juntos — `wp-admin/edit-tags.php:28` e
  // `:29`, transcritos de `target_screens.md` (`SCR-044` § 4).
  assert.deepEqual(resultado, {
    permitido: false,
    recusa: {
      motivo: 'sem-capacidade-de-gerenciar',
      mensagem: 'Sorry, you are not allowed to manage terms in this taxonomy.',
      titulo: 'You need a higher level of permission.',
    },
  });
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('CA-4.1 o ator anonimo e recusado como qualquer outro', () => {
  const { modulo, colaboracao } = cenarioDeTela();

  const resultado = modulo.permissaoDeGerenciarRotulos(colaboracao, 'category');

  assert.equal(resultado.permitido, false);
});

test('CA-4.1 contexto nao registrado e contexto fora do painel recusam ANTES da capacidade', () => {
  const { falsa, modulo, colaboracao } = cenarioDeTela('editor');

  // 1. `if ( ! $tax )` (`edit-tags.php:13`).
  assert.deepEqual(
    modulo.permissaoDeGerenciarRotulos(colaboracao, 'resenha'),
    {
      permitido: false,
      recusa: {
        motivo: 'contexto-nao-registrado',
        mensagem: 'Invalid taxonomy.',
      },
    },
  );

  // 2. O contexto tem de ser visivel no painel (`:23`), e `nav_menu` declara
  //    `mostrarNaInterface: false`. ⚠️ O editor **tem** a capacidade que
  //    `nav_menu` declara? Nao: ela e `edit_theme_options`, e ninguem a tem na
  //    matriz. O que este teste afirma e que o motivo e o da **visibilidade**, e
  //    nao o da capacidade — e e por isso que a ordem importa.
  assert.equal(modulo.contextos.obter('nav_menu')?.mostrarNaInterface, false);
  assert.deepEqual(
    modulo.permissaoDeGerenciarRotulos(colaboracao, 'nav_menu'),
    {
      permitido: false,
      recusa: {
        motivo: 'contexto-fora-do-painel',
        mensagem: 'Sorry, you are not allowed to edit terms in this taxonomy.',
      },
    },
  );

  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('CA-4.1 criar rotulo pela tela cobra `edit_terms`, e o autor nao cria categoria', () => {
  const comEditor = cenarioDeTela('editor');
  const comAutor = cenarioDeTela('author');

  // `category` declara `edit_categories` em `edit_terms`, que resolve para
  // `manage_categories`: o editor a tem, o autor nao.
  assert.equal(
    comEditor.modulo.contextos.obter('category')?.capacidades.editarRotulos,
    'edit_categories',
  );
  assert.equal(
    comEditor.modulo.permissaoDeCriarRotulo(comEditor.colaboracao, 'category')
      .permitido,
    true,
  );

  const recusado = comAutor.modulo.permissaoDeCriarRotulo(
    comAutor.colaboracao,
    'category',
  );
  assert.deepEqual(recusado, {
    permitido: false,
    recusa: {
      motivo: 'sem-capacidade-de-criar',
      mensagem: MENSAGENS_DA_TELA_DE_ROTULOS.semCapacidadeDeCriar,
    },
  });

  // ⚠️ E o autor tambem nao cria **etiqueta** por esta tela: `post_tag` declara
  // `edit_post_tags` em `edit_terms`, e ele e o terceiro dos cinco nomes que
  // resolvem para `manage_categories`. A capacidade que o autor **tem** nas
  // etiquetas e a de *atribuir* (`assign_post_tags`, que resolve para
  // `edit_posts`), e e por ela que ele cria etiqueta **pelo caminho de
  // classificar conteudo** — o caso de T005, disjunto deste. O inventario dos
  // cinco lugares em que o legado cobra `edit_terms`, e de por que no caminho de
  // atribuicao ele nao existe, esta no bloco 🔴 de
  // `../vinculo-de-objeto/rotulos-informados.ts`.
  assert.equal(
    comAutor.modulo.permissaoDeCriarRotulo(comAutor.colaboracao, 'post_tag')
      .permitido,
    false,
  );
  assert.equal(
    comAutor.modulo.contextos.obter('post_tag')?.capacidades.editarRotulos,
    'edit_post_tags',
  );
  assert.equal(
    comAutor.modulo.contextos.obter('post_tag')?.capacidades.atribuirRotulos,
    'assign_post_tags',
  );

  assert.deepEqual(comAutor.falsa.escritas, []);
});

/* ══════════════════════════════════════════════════════════════════════════
   CA-4.2 — "Contexto hierarquico aceita termo pai e mantem a arvore; contexto
   plano recusa hierarquia"
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-4.2 contexto hierarquico grava o pai informado na linha de contexto', () => {
  const { falsa, modulo } = montar();
  // A leitura do par, que no caminho normal nao encontra nada (`:2643`).
  programarPar(falsa, null);
  // A confirmacao de duplicata (`:2664`): nenhuma.
  falsa.responder([]);

  const resultado = modulo.criarRotuloNoContexto({
    contexto: 'category',
    nome: 'Resenhas',
    slug: 'resenhas',
    rotuloPaiId: ROTULO_AVO,
  });

  // UC-08, *Taxonomia hierarquica*: *"Sistema aceita o termo pai e mantem a
  // arvore em `term_taxonomy.parent`"*.
  assert.deepEqual(falsa.escritas[1], {
    texto:
      'INSERT INTO wp_term_taxonomy (term_id, taxonomy, description, parent, count) ' +
      'VALUES (?, ?, ?, ?, ?)',
    parametros: [7, 'category', '', ROTULO_AVO, 0],
  });
  assert.deepEqual(resultado, { rotuloId: 7, rotuloNoContextoId: 7 });
});

test('🔴 CA-4.2 contexto plano DESCARTA o pai informado e grava `0` — e o pacote nao diz se o legado devolve erro', () => {
  const { falsa, modulo } = montar();
  programarPar(falsa, null);
  falsa.responder([]);

  assert.equal(modulo.contextos.obter('post_tag')?.hierarquico, false);

  const resultado = modulo.criarRotuloNoContexto({
    contexto: 'post_tag',
    nome: 'Resenhas',
    slug: 'resenhas',
    rotuloPaiId: ROTULO_AVO,
  });

  // O efeito no banco e o que as quatro fontes do pacote afirmam, e elas
  // concordam: *"Contexto plano grava `0` em toda linha"*
  // (`../armazenamento/rotulo-no-contexto.ts`, T002, merged).
  assert.deepEqual(falsa.escritas[1]?.parametros, [7, 'post_tag', '', 0, 0]);

  // 🔴 O que elas **nao** dizem e se o chamador recebe erro. Esta tarefa
  // descarta e devolve o par, porque devolver erro exigiria inventar um codigo
  // de `WP_Error` que o pacote nao nomeia, e recusar e a direcao que a resposta
  // 2 proibe. Ver o bloco 🔴 de `hierarquia-do-rotulo.ts`.
  assert.deepEqual(resultado, { rotuloId: 7, rotuloNoContextoId: 7 });
});

test('CA-4.2 a regra do pai e UMA, e vale igual nas duas operacoes que escrevem a coluna', () => {
  const { modulo } = montar();
  const hierarquico = modulo.contextos.obter('category');
  const plano = modulo.contextos.obter('post_tag');
  assert.ok(hierarquico !== null && plano !== null);

  assert.equal(paiAceitoNoContexto(hierarquico, ROTULO_AVO), ROTULO_AVO);
  assert.equal(paiAceitoNoContexto(hierarquico, undefined), 0);
  assert.equal(paiAceitoNoContexto(plano, ROTULO_AVO), 0);
  assert.equal(paiAceitoNoContexto(plano, undefined), 0);
});

test('CA-4.2 reposicionar emite os DOIS `UPDATE` do legado, e o segundo leva o pai novo', () => {
  const { falsa, modulo } = montar();
  falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'category',
      parent: 0,
    }),
  ]);
  programarPar(falsa, ROTULO_NO_CONTEXTO);

  const resultado = modulo.reposicionarRotuloNaHierarquia({
    rotuloId: ROTULO,
    contexto: 'category',
    rotuloPaiId: ROTULO_AVO,
  });

  // E a MESMA sequencia de `wp_update_term()` que T003 porta pelo caminho do
  // nome (`:3414` e `:3446`), e o primeiro `UPDATE` sai mesmo sem nada mudar
  // nele: no legado os campos chegam por `array_merge( $term, $args )`.
  assert.deepEqual(falsa.escritas, [
    {
      texto:
        'UPDATE wp_terms SET name = ?, slug = ?, term_group = ? WHERE term_id = ?',
      parametros: ['Noticias', 'noticias', 0, ROTULO],
    },
    {
      texto:
        'UPDATE wp_term_taxonomy SET term_id = ?, taxonomy = ?, description = ?, parent = ? ' +
        'WHERE term_taxonomy_id = ?',
      parametros: [ROTULO, 'category', '', ROTULO_AVO, ROTULO_NO_CONTEXTO],
    },
  ]);
  assert.deepEqual(resultado, {
    rotuloId: ROTULO,
    rotuloNoContextoId: ROTULO_NO_CONTEXTO,
  });
});

test('🔴 CA-4.2 reposicionar em contexto plano grava `0`, pela mesma regra e com a mesma pergunta aberta', () => {
  const { falsa, modulo } = montar();
  falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: OUTRO_ROTULO_NO_CONTEXTO,
      taxonomy: 'post_tag',
    }),
  ]);
  programarPar(falsa, OUTRO_ROTULO_NO_CONTEXTO);

  modulo.reposicionarRotuloNaHierarquia({
    rotuloId: ROTULO,
    contexto: 'post_tag',
    rotuloPaiId: ROTULO_AVO,
  });

  assert.deepEqual(falsa.escritas[1]?.parametros, [
    ROTULO,
    'post_tag',
    '',
    0,
    OUTRO_ROTULO_NO_CONTEXTO,
  ]);
});

test('CA-4.2 contexto nao registrado, rotulo inexistente e nome gravado vazio recusam sem escrever nada', () => {
  const { falsa, modulo } = montar();

  // `if ( ! taxonomy_exists( $taxonomy ) )` (`:3266`): nem leitura sai.
  assert.equal(
    comoErro(
      modulo.reposicionarRotuloNaHierarquia({
        rotuloId: ROTULO,
        contexto: 'resenha',
        rotuloPaiId: 0,
      }),
    ).codigo,
    'invalid_taxonomy',
  );
  assert.deepEqual(falsa.selecoes, []);

  // `! $term` (`:3279`) vira `invalid_term`, e nao `null`.
  falsa.responder([]);
  assert.equal(
    comoErro(
      modulo.reposicionarRotuloNaHierarquia({
        rotuloId: ROTULO,
        contexto: 'category',
        rotuloPaiId: 0,
      }),
    ).codigo,
    'invalid_term',
  );

  // `'' === trim( $name )` (`:3307`-`:3308`) sobre o nome que veio do
  // `array_merge( $term, $args )`: nome gravado vazio recusa.
  falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'category',
      name: '  ',
    }),
  ]);
  assert.equal(
    comoErro(
      modulo.reposicionarRotuloNaHierarquia({
        rotuloId: ROTULO,
        contexto: 'category',
        rotuloPaiId: ROTULO_AVO,
      }),
    ).codigo,
    'empty_term_name',
  );

  assert.deepEqual(falsa.escritas, []);
});

/* ══════════════════════════════════════════════════════════════════════════
   A CRIACAO: a sequencia que insere ANTES de perguntar
   (`wp_insert_term()`, `wp-includes/taxonomy.php:2458`)
   ══════════════════════════════════════════════════════════════════════════ */

test('criar emite as duas insercoes, a leitura do par entre elas e a confirmacao de duplicata depois', () => {
  const { falsa, modulo } = montar();
  programarPar(falsa, null);
  falsa.responder([]);

  modulo.criarRotuloNoContexto({
    contexto: 'category',
    nome: 'Resenhas',
    slug: 'resenhas',
    descricao: 'Textos sobre livros',
  });

  // UC-08 passo 4: *"uma linha em `terms`, uma em `term_taxonomy` por
  // taxonomia"*. A ordem das colunas e a do `compact()` do legado.
  assert.deepEqual(falsa.escritas, [
    {
      texto:
        'INSERT INTO wp_terms (name, slug, term_group) VALUES (?, ?, ?)',
      parametros: ['Resenhas', 'resenhas', 0],
    },
    {
      texto:
        'INSERT INTO wp_term_taxonomy (term_id, taxonomy, description, parent, count) ' +
        'VALUES (?, ?, ?, ?, ?)',
      parametros: [7, 'category', 'Textos sobre livros', 0, 0],
    },
  ]);

  // A leitura do par vem **entre** as duas insercoes (`:2643`), e a confirmacao
  // de duplicata **depois** das duas (`:2664`).
  assert.deepEqual(textos(falsa.selecoes), [
    'SELECT tt.term_taxonomy_id FROM wp_term_taxonomy AS tt ' +
      'INNER JOIN wp_terms AS t ON tt.term_id = t.term_id ' +
      'WHERE tt.taxonomy = ? AND t.term_id = ?',
    'SELECT t.term_id, t.slug, tt.term_taxonomy_id, tt.taxonomy ' +
      'FROM wp_terms AS t ' +
      'INNER JOIN wp_term_taxonomy AS tt ON ( tt.term_id = t.term_id ) ' +
      'WHERE t.slug = ? AND tt.parent = ? AND tt.taxonomy = ? ' +
      'AND t.term_id < ? AND tt.term_taxonomy_id != ?',
  ]);
  assert.deepEqual(falsa.selecoes[1]?.parametros, [
    'resenhas',
    0,
    'category',
    7,
    7,
  ]);
});

test('criar DESFAZ as duas insercoes quando a confirmacao acusa duplicata, e devolve o par antigo', () => {
  const { falsa, modulo } = montar();
  programarPar(falsa, null);
  // A duplicata: um rotulo **anterior** com o mesmo apelido, no mesmo pai.
  falsa.responder([
    {
      term_id: ROTULO,
      slug: 'resenhas',
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'category',
    },
  ]);

  const resultado = modulo.criarRotuloNoContexto({
    contexto: 'category',
    nome: 'Resenhas',
    slug: 'resenhas',
  });

  // `:2685` apaga a linha de `terms` e `:2686` a de `term_taxonomy` — **nesta
  // ordem**, que e o inverso da ordem da exclusao de verdade.
  assert.deepEqual(textos(falsa.escritas), [
    'INSERT INTO wp_terms (name, slug, term_group) VALUES (?, ?, ?)',
    'INSERT INTO wp_term_taxonomy (term_id, taxonomy, description, parent, count) ' +
      'VALUES (?, ?, ?, ?, ?)',
    'DELETE FROM wp_terms WHERE term_id = ?',
    'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
  ]);

  // E devolve o par **antigo** (`:2694`), nao o que acabou de gravar e apagar.
  assert.deepEqual(resultado, {
    rotuloId: ROTULO,
    rotuloNoContextoId: ROTULO_NO_CONTEXTO,
  });
});

test('criar devolve o par existente SEM inserir a linha de contexto quando o par ja esta gravado', () => {
  const { falsa, modulo } = montar();
  // O ramo de `:2650`, que no caminho normal e inalcancavel porque o
  // identificador acabou de ser gerado — portado porque *"existir sem ser
  // chamado e parte do que se clona"* (resposta 7 de `questions.md`, P8).
  programarPar(falsa, ROTULO_NO_CONTEXTO);

  const resultado = modulo.criarRotuloNoContexto({
    contexto: 'category',
    nome: 'Resenhas',
    slug: 'resenhas',
  });

  assert.deepEqual(textos(falsa.escritas), [
    'INSERT INTO wp_terms (name, slug, term_group) VALUES (?, ?, ?)',
  ]);
  // E **nao** confirma duplicata: a leitura do par foi a unica.
  assert.equal(falsa.selecoes.length, 1);
  assert.deepEqual(resultado, {
    rotuloId: 7,
    rotuloNoContextoId: ROTULO_NO_CONTEXTO,
  });
});

test('criar recusa contexto nao registrado e nome vazio sem tocar o banco', () => {
  const { falsa, modulo } = montar();

  assert.equal(
    comoErro(
      modulo.criarRotuloNoContexto({ contexto: 'resenha', nome: 'Resenhas' }),
    ).codigo,
    'invalid_taxonomy',
  );

  // `'' === trim( $name )` (`:2486`), com a mesma mensagem do gemeo de `:3308`.
  const vazio = comoErro(
    modulo.criarRotuloNoContexto({ contexto: 'category', nome: '  ' }),
  );
  assert.equal(vazio.codigo, 'empty_term_name');
  assert.equal(vazio.mensagem, 'A name is required for this term.');

  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('🔴 criar sem apelido grava `` e NAO emite o `UPDATE` corretivo — `sanitize_title()` nao existe nesta arvore', () => {
  const { falsa, modulo } = montar();
  programarPar(falsa, null);
  falsa.responder([]);

  modulo.criarRotuloNoContexto({ contexto: 'category', nome: 'Resenhas' });

  // O legado derivaria o apelido do nome (`sanitize_title()`) e o tornaria unico
  // (`wp_unique_term_slug()`, `:2609`), e tem um `UPDATE` corretivo em `:2636`
  // para o caso de ele ficar vazio. **Nenhuma das duas existe nesta arvore**, e
  // a mesma ausencia foi declarada por T003 no ramo gemeo (`:3416`-`:3419`).
  assert.deepEqual(falsa.escritas[0]?.parametros, ['Resenhas', '', 0]);
  assert.equal(
    textos(falsa.escritas).includes('UPDATE wp_terms SET slug = ? WHERE term_id = ?'),
    false,
  );
});

/* ══════════════════════════════════════════════════════════════════════════
   CA-4.3 — "Apagar um termo em uso remove o vinculo e nao apaga o conteudo"
   CA-4.4 — "Conteudo que fica sem termo algum num contexto com padrao recebe
   o padrao"                                        @cascata @invariante
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-4.3 e CA-4.4 (@cascata @invariante) apagar o unico termo do objeto devolve o objeto ao termo padrao', () => {
  const { falsa, modulo, colaboracao, chavesLidas } = cenarioDeExclusao({
    [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO,
  });
  programarCascata(falsa, {
    rotulosDoObjeto: [ROTULO],
    rotuloInformadoNoContexto: ROTULO_PADRAO_NO_CONTEXTO,
  });

  const resultado = apagarRotuloDoContexto(modulo, colaboracao, {
    rotuloId: ROTULO,
    contexto: 'category',
  });

  // `BR-MIGRAR-080` (`DB-TRG4`): *"se era o unico termo do objeto naquela
  // taxonomia e a taxonomia tem termo padrao, o objeto recebe o padrao"*.
  // A sequencia inteira, na ordem do legado:
  assert.deepEqual(textos(falsa.escritas), [
    // passo 5, `DB-TRG3`: o `UPDATE` sai sempre em contexto hierarquico.
    'UPDATE wp_term_taxonomy SET parent = ? WHERE parent = ? AND taxonomy = ?',
    // passo 7: o vinculo com o termo padrao entra...
    'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id) VALUES (?, ?)',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
    // ...e o vinculo com o termo apagado sai.
    'DELETE FROM wp_term_relationships WHERE object_id = ? AND term_taxonomy_id IN (?)',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
    // passo 9, o trecho final de T003.
    'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_terms WHERE term_id = ?',
  ]);

  // ⚠️ **O identificador gravado e o `term_taxonomy_id` do padrao, e nao o
  // `term_id` que a opcao guarda** — a troca que esta historia convida a fazer.
  assert.deepEqual(falsa.escritas[1]?.parametros, [
    OBJETO,
    ROTULO_PADRAO_NO_CONTEXTO,
  ]);
  assert.deepEqual(falsa.escritas[3]?.parametros, [OBJETO, ROTULO_NO_CONTEXTO]);

  // A chave da opcao e a de `category`, e e lida **uma** vez.
  assert.deepEqual(chavesLidas, [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]);
  assert.equal(resultado, true);
});

test('CA-4.3 (@cascata) o `DELETE` alcanca SO a juncao: nenhum comando toca o conteudo', () => {
  const { falsa, modulo, colaboracao } = cenarioDeExclusao({
    [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO,
  });
  programarCascata(falsa, {
    rotulosDoObjeto: [ROTULO],
    rotuloInformadoNoContexto: ROTULO_PADRAO_NO_CONTEXTO,
  });

  apagarRotuloDoContexto(modulo, colaboracao, {
    rotuloId: ROTULO,
    contexto: 'category',
  });

  // UC-08: *"O conteudo nao e apagado: perde a relacao"*. O **P5** manda afirmar
  // o conjunto exato do que sumiu: a juncao do objeto com o termo apagado, a
  // linha de contexto e a linha de rotulo — e **nada** de `posts`.
  for (const consulta of [...falsa.selecoes, ...falsa.escritas]) {
    assert.equal(consulta.texto.includes('wp_posts'), false);
  }

  const apagados = textos(falsa.escritas).filter((texto) =>
    texto.startsWith('DELETE'),
  );
  assert.deepEqual(apagados, [
    'DELETE FROM wp_term_relationships WHERE object_id = ? AND term_taxonomy_id IN (?)',
    'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_terms WHERE term_id = ?',
  ]);
});

test('CA-4.4 (@invariante) o objeto que tem OUTRO termo perde so o vinculo, e nao recebe o padrao', () => {
  const { falsa, modulo, colaboracao } = cenarioDeExclusao({
    [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO,
  });
  programarCascata(falsa, {
    rotulosDoObjeto: [ROTULO, OUTRO_ROTULO],
    rotuloInformadoNoContexto: OUTRO_ROTULO_NO_CONTEXTO,
    vinculoJaGravado: true,
  });

  apagarRotuloDoContexto(modulo, colaboracao, {
    rotuloId: ROTULO,
    contexto: 'category',
  });

  // `BR-MIGRAR-080`: *"senao perde so aquele termo"*. O vinculo com o outro
  // rotulo **ja estava gravado**, logo nenhum `INSERT` sai — e o padrao nao
  // entra em lugar nenhum.
  assert.deepEqual(textos(falsa.escritas), [
    'UPDATE wp_term_taxonomy SET parent = ? WHERE parent = ? AND taxonomy = ?',
    'DELETE FROM wp_term_relationships WHERE object_id = ? AND term_taxonomy_id IN (?)',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_terms WHERE term_id = ?',
  ]);
  for (const escrita of falsa.escritas) {
    assert.equal(
      escrita.parametros.includes(ROTULO_PADRAO_NO_CONTEXTO),
      false,
    );
  }
});

test('CA-4.4 contexto SEM termo padrao deixa o objeto sem termo algum, e nenhum vinculo novo entra', () => {
  // A opcao vale `0`, que e tambem o valor de opcao ausente: o legado nao
  // distingue os dois ({@link SEM_TERMO_PADRAO}).
  const { falsa, modulo, colaboracao } = cenarioDeExclusao();
  programarCascata(falsa, { rotulosDoObjeto: [ROTULO] });

  apagarRotuloDoContexto(modulo, colaboracao, {
    rotuloId: ROTULO,
    contexto: 'category',
  });

  assert.deepEqual(textos(falsa.escritas), [
    'UPDATE wp_term_taxonomy SET parent = ? WHERE parent = ? AND taxonomy = ?',
    'DELETE FROM wp_term_relationships WHERE object_id = ? AND term_taxonomy_id IN (?)',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_terms WHERE term_id = ?',
  ]);
});

test('CA-4.4 `forcarPadrao` aplica o padrao mesmo quando o objeto tem outros termos', () => {
  const { falsa, modulo, colaboracao } = cenarioDeExclusao({
    [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO,
  });
  programarCascata(falsa, {
    rotulosDoObjeto: [ROTULO, OUTRO_ROTULO],
    rotuloInformadoNoContexto: ROTULO_PADRAO_NO_CONTEXTO,
    // Com o padrao forcado, **os dois** vinculos anteriores saem.
    rotulosRemovidos: [ROTULO, OUTRO_ROTULO],
  });

  apagarRotuloDoContexto(modulo, colaboracao, {
    rotuloId: ROTULO,
    contexto: 'category',
    forcarPadrao: true,
  });

  // T003 descreveu o par `default` / `force_default` como *"o que decide entre
  // 'devolve ao padrao' e 'so perde o vinculo'"* (`:2089`-`:2098`). Com ele
  // ligado, a lista que vai para a substituicao e **so** o padrao, logo os dois
  // vinculos anteriores saem no mesmo `DELETE`.
  assert.deepEqual(falsa.escritas[1], {
    texto:
      'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id) VALUES (?, ?)',
    parametros: [OBJETO, ROTULO_PADRAO_NO_CONTEXTO],
  });
  assert.deepEqual(falsa.escritas[3]?.texto,
    'DELETE FROM wp_term_relationships WHERE object_id = ? AND term_taxonomy_id IN (?, ?)',
  );
});

test('CA-4.4 o termo padrao informado vence a opcao, e e validado naquele contexto', () => {
  const { falsa, modulo, colaboracao, chavesLidas } = cenarioDeExclusao({
    [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO,
  });

  // A validacao do padrao informado (`:2089`-`:2098`) e a primeira leitura, e ela
  // vem **antes** da leitura dos filhos.
  falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'category',
    }),
  ]);
  programarPar(falsa, OUTRO_ROTULO_NO_CONTEXTO);
  falsa.responder([]);
  programarObjetos(falsa, [OBJETO]);
  programarRotulos(falsa, [ROTULO]);
  programarRotulos(falsa, [ROTULO]);
  falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'category',
    }),
  ]);
  programarPar(falsa, OUTRO_ROTULO_NO_CONTEXTO);
  programarPar(falsa, null);
  programarRotulos(falsa, [ROTULO]);
  programarPar(falsa, ROTULO_NO_CONTEXTO);
  falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'category',
    }),
  ]);
  falsa.responder([{ 'COUNT(*)': 0 }]);

  apagarRotuloDoContexto(modulo, colaboracao, {
    rotuloId: ROTULO,
    contexto: 'category',
    rotuloPadraoId: OUTRO_ROTULO,
  });

  // A opcao e lida de qualquer jeito — no legado o passo 2 a le antes, para a
  // protecao que e de T011 —, e o informado entra por cima.
  assert.deepEqual(chavesLidas, [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]);
  assert.deepEqual(falsa.escritas[1]?.parametros, [
    OBJETO,
    OUTRO_ROTULO_NO_CONTEXTO,
  ]);
});

test('🔴 CA-4.4 termo padrao informado que nao existe naquele contexto e DESCARTADO, e vale o da opcao', () => {
  const { falsa, modulo, colaboracao } = cenarioDeExclusao({
    [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO,
  });

  falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'category',
    }),
  ]);
  // A validacao: o padrao informado **nao** existe em `category`.
  programarPar(falsa, null);
  falsa.responder([]);
  programarObjetos(falsa, [OBJETO]);
  programarRotulos(falsa, [ROTULO]);
  programarRotulos(falsa, [ROTULO]);
  falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'category',
    }),
  ]);
  programarPar(falsa, ROTULO_PADRAO_NO_CONTEXTO);
  programarPar(falsa, null);
  programarRotulos(falsa, [ROTULO]);
  programarPar(falsa, ROTULO_NO_CONTEXTO);
  falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'category',
    }),
  ]);
  falsa.responder([{ 'COUNT(*)': 0 }]);

  apagarRotuloDoContexto(modulo, colaboracao, {
    rotuloId: ROTULO,
    contexto: 'category',
    rotuloPadraoId: 404,
  });

  // 🔴 O pacote nao diz o que `:2089`-`:2098` faz com um padrao invalido: T003 so
  // o descreve como *"a validacao do padrao informado"*. Esta tarefa **descarta**
  // e volta para o da opcao, porque aceitar um rotulo inexistente faria a
  // substituicao integral **remover** o vinculo em vez de troca-lo — o oposto de
  // CA-4.4. Ver a tabela 🔴 de `apagar-rotulo-do-contexto.ts`.
  assert.deepEqual(falsa.escritas[1]?.parametros, [
    OBJETO,
    ROTULO_PADRAO_NO_CONTEXTO,
  ]);
});

test('CA-4.3 contexto nao registrado e rotulo inexistente devolvem `false` sem apagar nada', () => {
  const { falsa, modulo, colaboracao, chavesLidas } = cenarioDeExclusao();

  // O caminho indireto de `:2063`, que T003 transcreveu: **nao e erro**.
  assert.equal(
    apagarRotuloDoContexto(modulo, colaboracao, {
      rotuloId: ROTULO,
      contexto: 'resenha',
    }),
    false,
  );
  assert.deepEqual(falsa.selecoes, []);

  falsa.responder([]);
  assert.equal(
    apagarRotuloDoContexto(modulo, colaboracao, {
      rotuloId: ROTULO,
      contexto: 'category',
    }),
    false,
  );
  assert.deepEqual(falsa.escritas, []);

  // E a opcao do termo padrao **nao** e lida em nenhum dos dois casos: o passo 3
  // vem depois da resolucao do par, e a lista vazia e afirmacao.
  assert.deepEqual(chavesLidas, []);
});

test('CA-4.3 o rotulo sobrevive em `terms` quando outro contexto ainda o usa', () => {
  const { falsa, modulo, colaboracao } = cenarioDeExclusao();
  programarCascata(falsa, {
    rotulosDoObjeto: [ROTULO],
    contextosRestantes: 1,
  });

  apagarRotuloDoContexto(modulo, colaboracao, {
    rotuloId: ROTULO,
    contexto: 'category',
  });

  // **CA-1.3**, de T003, continua valendo dentro da cascata: a contagem de
  // contextos e feita **depois** do `DELETE` da linha de contexto, e e ela que
  // decide o segundo `DELETE` (`:2214`-`:2216`).
  assert.equal(
    textos(falsa.escritas).includes('DELETE FROM wp_terms WHERE term_id = ?'),
    false,
  );
  assert.deepEqual(
    textos(falsa.escritas).at(-1),
    'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
  );
});

/* ══════════════════════════════════════════════════════════════════════════
   `DB-TRG3` — "apagar reposiciona os filhos em vez de apaga-los"
   (BR-MIGRAR-079, `wp-includes/taxonomy.php:2132`)
   ══════════════════════════════════════════════════════════════════════════ */

test('(@cascata) os filhos do rotulo apagado passam a apontar para o AVO, e nao sao apagados', () => {
  const { falsa, modulo, colaboracao } = cenarioDeExclusao();
  programarCascata(falsa, {
    rotulosDoObjeto: [ROTULO],
    rotuloPaiId: ROTULO_AVO,
    filhos: [{ term_id: 55, term_taxonomy_id: 56 }],
  });

  apagarRotuloDoContexto(modulo, colaboracao, {
    rotuloId: ROTULO,
    contexto: 'category',
  });

  // `BR-MIGRAR-079`: *"termo hierarquico tem o pai trocado pelo **avo**"*, e a
  // nota de paradigma da regra e o aviso inteiro: *"`ON DELETE CASCADE` ingenuo
  // no destino muda o produto"*.
  assert.deepEqual(falsa.escritas[0], {
    texto:
      'UPDATE wp_term_taxonomy SET parent = ? WHERE parent = ? AND taxonomy = ?',
    parametros: [ROTULO_AVO, ROTULO, 'category'],
  });

  // ⚠️ A leitura dos filhos **nao filtra por contexto** e o `UPDATE` filtra — a
  // assimetria do legado que T002 declarou no metodo.
  assert.deepEqual(falsa.selecoes[1], {
    texto: 'SELECT term_id, term_taxonomy_id FROM wp_term_taxonomy WHERE `parent` = ?',
    parametros: [ROTULO],
  });

  // E nenhum `DELETE` alcanca o filho.
  for (const escrita of falsa.escritas) {
    assert.equal(escrita.parametros.includes(56), false);
  }
});

test('(@cascata) contexto plano nao le filho e nao emite o reposicionamento', () => {
  const { falsa, modulo, colaboracao } = cenarioDeExclusao();

  const linha = linhaDeTermo({
    term_id: ROTULO,
    term_taxonomy_id: OUTRO_ROTULO_NO_CONTEXTO,
    taxonomy: 'post_tag',
  });
  falsa.responder([linha]);
  programarObjetos(falsa, []);
  falsa.responder([linha]);
  falsa.responder([{ 'COUNT(*)': 0 }]);

  apagarRotuloDoContexto(modulo, colaboracao, {
    rotuloId: ROTULO,
    contexto: 'post_tag',
  });

  // T003 registrou que o passo 5 e *"em contexto hierarquico"* (`:2114`), e
  // `post_tag` nao e: nem a leitura de `:2121` nem o `UPDATE` de `:2133` saem.
  assert.deepEqual(
    textos(falsa.selecoes).filter((texto) => texto.includes('`parent`')),
    [],
  );
  assert.deepEqual(textos(falsa.escritas), [
    'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_terms WHERE term_id = ?',
  ]);
});

/* ══════════════════════════════════════════════════════════════════════════
   CA-4.5 — "A contagem de uso dos termos afetados fica correta ao fim da
   operacao"
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-4.5 a linha de contexto nasce com `count = 0`, explicito na insercao', () => {
  const { falsa, modulo } = montar();
  programarPar(falsa, null);
  falsa.responder([]);

  modulo.criarRotuloNoContexto({
    contexto: 'category',
    nome: 'Resenhas',
    slug: 'resenhas',
  });

  // O `0` e do legado e e **explicito**: `compact( ... ) + array( 'count' => 0 )`
  // (`:2652`), e por isso `count` e a ultima coluna do comando.
  const insercao = falsa.escritas[1];
  assert.match(String(insercao?.texto), /parent, count\) VALUES/);
  assert.equal(insercao?.parametros.at(-1), 0);
});

test('CA-4.5 a cascata reconta os dois rotulos afetados, cada um pelo criterio de conteudo', () => {
  const { falsa, modulo, colaboracao, contagensPedidas } = cenarioDeExclusao({
    [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO,
  });
  programarCascata(falsa, {
    rotulosDoObjeto: [ROTULO],
    rotuloInformadoNoContexto: ROTULO_PADRAO_NO_CONTEXTO,
  });

  apagarRotuloDoContexto(modulo, colaboracao, {
    rotuloId: ROTULO,
    contexto: 'category',
  });

  // UC-08 passo 5: *"Sistema recalcula a contagem de uso dos termos afetados"*.
  // A recontagem sai **por dentro** da substituicao e da remocao, como no legado,
  // e nao por uma chamada desta funcao — recontar de fora emitiria comando que o
  // legado nao emite.
  const contagens = falsa.escritas.filter((escrita) =>
    escrita.texto.startsWith('UPDATE wp_term_taxonomy SET count'),
  );
  assert.deepEqual(
    contagens.map((escrita) => escrita.parametros.at(-1)),
    [ROTULO_PADRAO_NO_CONTEXTO, ROTULO_NO_CONTEXTO],
  );

  // ⚠️ E o criterio e o **de conteudo**, nao o generico: `category` declara
  // `post`, que e tipo de conteudo registrado, logo a contagem atravessa `posts`
  // e sai por BC-01 (`DB-TRG2`, `BR-MIGRAR-078`). O duble registra as chamadas, e
  // e isso que torna a escolha afirmavel sem inspecionar SQL de outro contexto.
  assert.deepEqual(contagensPedidas, [
    ROTULO_PADRAO_NO_CONTEXTO,
    ROTULO_NO_CONTEXTO,
  ]);
  for (const consulta of falsa.selecoes) {
    assert.equal(consulta.texto.includes('COUNT(*) FROM wp_term_relationships'), false);
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-036-6 — "o estado de um termo e a existencia dele"
   (`terms` nao tem coluna de estado, `state-machines.md` 10)
   ══════════════════════════════════════════════════════════════════════════ */

test('nenhum comando desta historia liga ou desliga estado de termo: criar e apagar sao as duas transicoes', () => {
  const criacao = montar();
  programarPar(criacao.falsa, null);
  criacao.falsa.responder([]);
  criacao.modulo.criarRotuloNoContexto({
    contexto: 'category',
    nome: 'Resenhas',
    slug: 'resenhas',
  });

  const exclusao = cenarioDeExclusao();
  programarCascata(exclusao.falsa, { rotulosDoObjeto: [ROTULO] });
  apagarRotuloDoContexto(exclusao.modulo, exclusao.colaboracao, {
    rotuloId: ROTULO,
    contexto: 'category',
  });

  // As **unicas** transicoes sao `INSERT` e `DELETE`, nas duas tabelas de
  // `AGG-Termo`: nenhuma coluna de estado e escrita, porque nenhuma existe.
  // `../armazenamento/esquema.ts` afirma o DDL das tres tabelas byte a byte.
  const colunasEscritas = [...criacao.falsa.escritas, ...exclusao.falsa.escritas]
    .map((escrita) => escrita.texto)
    .join(' ');
  for (const coluna of ['status', 'state', 'estado', 'active', 'deleted']) {
    assert.equal(colunasEscritas.includes(coluna), false);
  }
});
