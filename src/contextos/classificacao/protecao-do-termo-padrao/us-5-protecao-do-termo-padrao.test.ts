/**
 * Testes de **US-5** — *"Impedir a remocao do termo padrao de um contexto"* —,
 * entrega de **T011**: *"o comportamento de US-5 existe e os criterios CA-5.1,
 * CA-5.2, CA-5.3 passam contra o sistema novo"*.
 *
 * O que se afirma aqui, e por que desta forma:
 *
 * 1. **A ausencia de comando**, porque o criterio desta area e *"efeito no
 *    banco"* (area 3 da Decisao 2 de `parity_specs.md`, que compara *"snapshot +
 *    sequencia de comandos"*) e nesta historia o efeito e **nao escrever**. Por
 *    isso a porta de teste registra consulta em vez de simular banco: um banco de
 *    mentira esconderia justamente o comando que nao sai.
 * 2. **A `@cascata`**, que `parity_specs.md` torna **obrigatoria** em *"exclusao
 *    de conteudo e de termo"*: aqui ela e a cascata que **nao comeca**.
 * 3. **A `@invariante`**, obrigatoria em *"todo fluxo cujo aggregate tem
 *    invariante"*: *"o termo padrao da taxonomia continua existindo"* e
 *    pos-condicao de UC-08.
 * 4. **Que a recusa vence o ator de maior poder**, nos dois sentidos de CA-5.2: o
 *    super administrador da rede e negado, e um interceptador no ponto de extensao
 *    que **conceda** `do_not_allow` nao muda a resposta (ADR 0009, garantias 1 e
 *    2).
 * 5. **Que a recusa da funcao nao tem ator nenhum**, que e CA-5.1 na letra:
 *    `ColaboracaoDaExclusaoDeRotulo` nao carrega ator, e a recusa alcanca a tela,
 *    a API, o lote e a fila agendada do mesmo jeito.
 *
 * ⚠️ **Nenhum destes testes e teste de paridade.** Nao existe `.feature` de
 * classificacao em `parity_tests/`, o oraculo **executavel** do legado nao existe
 * nesta arvore (`oracleAvailable: false`; levanta-lo e T001 da feature `015`) e,
 * nesta arvore de trabalho, **a instalacao do legado tambem nao esta no disco** —
 * nao ha `wp-includes/capabilities.php`, `wp-includes/taxonomy.php` nem
 * `wp-admin/edit-tags.php` para reconferir ancora. Cada afirmacao abaixo vem do
 * pacote (`spec.md`, `plan.md`, `UC-08`, ADR 0009, `BR-MIGRAR-091`,
 * `BR-MIGRAR-092`, `target_screens.md` `SCR-044`) ou da transcricao **merged** de
 * T002, T003, T005, T007, T009 e de T015 da feature `001`. Os pontos que o pacote
 * nao especifica tem teste com 🔴 no nome.
 *
 * ⚠️ **E nao sao os testes de `backlog/tests.md`**: os cinco casos `UT-037-1` a
 * `UT-037-5` sao **T012**, que roda em paralelo com esta tarefa e tem suite
 * propria.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ATOR_ANONIMO,
  CAPACIDADE_NEGADA,
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
import { MENSAGENS_DA_TELA_DE_ROTULOS } from '../manutencao-da-lista/index.js';
import type { ColaboracaoDaExclusaoDeRotulo } from '../manutencao-da-lista/index.js';
import type { Consulta, LinhaDeResultado } from '../portas/index.js';
import {
  OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
  PREFIXO_DA_OPCAO_DE_TERMO_PADRAO,
  SEM_TERMO_PADRAO,
  type OpcoesNaClassificacao,
} from '../termo-padrao/index.js';
import type {
  ColaboracaoDoVinculo,
  ConteudoNaClassificacao,
} from '../vinculo-de-objeto/index.js';
import {
  CAPACIDADES_SOBRE_O_ROTULO,
  CAPACIDADE_DE_APAGAR_O_ROTULO,
  CAPACIDADE_DE_EDITAR_O_ROTULO,
} from './caso-de-capacidade-sobre-rotulo.js';
import type { ColaboracaoDaProtecaoDoTermoPadrao } from './escopo-de-protecao-do-termo-padrao.js';
import { MENSAGENS_DOS_PORTOES_DE_ITEM } from './permissao-sobre-rotulo.js';
import { RECUSA_DO_TERMO_PADRAO } from './termo-padrao-indestrutivel.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

/** O rotulo que a opcao `default_category` guarda, e o par dele em `category`. */
const ROTULO_PADRAO = 1;
const ROTULO_PADRAO_NO_CONTEXTO = 5;

/** Um rotulo comum do mesmo contexto — o que **pode** ser apagado. */
const ROTULO = 12;
const ROTULO_NO_CONTEXTO = 30;

/** O contexto de extensao que declara `default_term`, para o segundo `if`. */
const CONTEXTO_DE_EXTENSAO = 'resenha';
const ROTULO_PADRAO_DA_EXTENSAO = 77;
const ROTULO_PADRAO_DA_EXTENSAO_NO_CONTEXTO = 78;

/** A chave de opcao daquele contexto: `default_term_resenha`. */
const OPCAO_DO_TERMO_PADRAO_DA_EXTENSAO = `${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}${CONTEXTO_DE_EXTENSAO}`;

/**
 * A matriz de papeis.
 *
 * `manage_categories` so no editor, e **nenhum papel tem `delete_categories`**:
 * e o atalho de `PERM-6` que leva um ao outro, e sem ele o editor nao apagaria
 * categoria nenhuma.
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
];

const BASE: BaseDeAutorizacao = {
  matriz: MATRIZ,
  rede: REDE_INATIVA_NA_AUTORIZACAO,
};

/** O login do super administrador da rede, em `EstadoDaRedeNaAutorizacao`. */
const LOGIN_DO_SUPER_ADMIN = 'dona-da-rede';

/**
 * A base de uma instalacao **em rede**, com o super administrador na lista.
 *
 * ⚠️ A matriz continua a mesma, e **ele nao tem papel nenhum**: `PERM-9` e
 * literal — *"super admin **nao e capacidade**: e nome de login numa lista de
 * rede"*.
 */
const BASE_EM_REDE: BaseDeAutorizacao = {
  matriz: MATRIZ,
  rede: { ativa: true, loginsDeSuperAdmin: [LOGIN_DO_SUPER_ADMIN] },
};

/** Um ator com um papel, na forma do legado (o nome do papel como concessao). */
function ator(papel: string, contaId = 7): AtorDeAutorizacao {
  return {
    contaId,
    login: papel,
    existe: true,
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

/** O super administrador: **sem papel e sem capacidade**, so o login da lista. */
const SUPER_ADMIN: AtorDeAutorizacao = {
  contaId: 1,
  login: LOGIN_DO_SUPER_ADMIN,
  existe: true,
  concessoes: [],
};

/** A colaboracao com BC-01, que no alvo e `posts` e aqui registra as chamadas. */
function conteudoDeTeste(): ColaboracaoDoVinculo {
  const conteudo: ConteudoNaClassificacao = {
    tipoDeConteudoEhRegistrado: (tipo) =>
      ['post', 'page', 'attachment'].includes(tipo),
    contarConteudoPublicado: () => 0,
    contarAnexosPublicados: () => 0,
  };
  return { conteudo };
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

/**
 * O cenario inteiro: o modulo, a porta falsa, e as duas colaboracoes.
 *
 * As duas chegam separadas porque o legado as separa: a da exclusao **nao tem
 * ator** (`wp_delete_term()` nao consulta capacidade) e a dos portoes tem.
 */
function cenario(opcoes: {
  readonly valoresDeOpcao?: Readonly<Record<string, number>>;
  readonly base?: BaseDeAutorizacao;
  readonly ator?: AtorDeAutorizacao;
  readonly comContextoDeExtensao?: boolean;
} = {}): {
  falsa: PortaDeDadosFalsa;
  modulo: ModuloDeClassificacao;
  exclusao: ColaboracaoDaExclusaoDeRotulo;
  portao: ColaboracaoDaProtecaoDoTermoPadrao;
  chavesLidas: string[];
} {
  const falsa = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_' });
  const modulo = criarModuloDeClassificacao({ dados: falsa.porta });
  const leitura = opcoesDeTeste(opcoes.valoresDeOpcao ?? {});

  if (opcoes.comContextoDeExtensao === true) {
    // Um contexto de extensao que **declara `default_term`** — o segundo `if` do
    // passo 2 (`taxonomy.php:2083`). Nenhum dos oito do nucleo o declara.
    modulo.contextos.registrar(CONTEXTO_DE_EXTENSAO, {
      tiposDeObjeto: 'post',
      hierarquico: false,
      mostrarNaInterface: true,
      rotuloPadrao: 'Sem resenha',
    });
  }

  return {
    falsa,
    modulo,
    exclusao: { ...conteudoDeTeste(), opcoes: leitura.opcoes },
    portao: {
      base: opcoes.base ?? BASE,
      ator: opcoes.ator ?? ator('editor'),
      opcoes: leitura.opcoes,
    },
    chavesLidas: leitura.chavesLidas,
  };
}

/** Uma linha da leitura fundida `SELECT t.*, tt.*` (`class-wp-term.php:132`). */
function linhaDeTermo(campos: {
  readonly term_id: number;
  readonly term_taxonomy_id: number;
  readonly taxonomy: string;
  readonly parent?: number;
}): LinhaDeResultado {
  return {
    term_id: campos.term_id,
    term_taxonomy_id: campos.term_taxonomy_id,
    name: 'Uncategorized',
    slug: 'uncategorized',
    taxonomy: campos.taxonomy,
    description: '',
    parent: campos.parent ?? 0,
    count: 0,
    term_group: 0,
  };
}

/** A linha do termo padrao de `category`, que e a que todo teste daqui usa. */
function linhaDoPadrao(taxonomy = 'category'): LinhaDeResultado {
  return linhaDeTermo({
    term_id: ROTULO_PADRAO,
    term_taxonomy_id: ROTULO_PADRAO_NO_CONTEXTO,
    taxonomy,
  });
}

/**
 * Programa a exclusao de um rotulo **sem objeto vinculado**, do inicio ao fim.
 *
 * A ordem das respostas e a ordem das leituras, e ela **e** a sequencia que o
 * legado emite. Sem objeto vinculado o passo 7 nao itera, e o que resta e o
 * caminho mais curto da cascata — exatamente o que CA-5.3 precisa afirmar: que a
 * exclusao **acontece** quando o rotulo nao e mais o padrao.
 */
function programarExclusaoSemObjetos(
  falsa: PortaDeDadosFalsa,
  linha: LinhaDeResultado,
  contexto: { readonly hierarquico: boolean },
): void {
  // 1. `get_term()` — a resolucao do par (passo 1).
  falsa.responder([linha]);
  // 2. os filhos (`:2121`), so em contexto hierarquico (passo 5).
  if (contexto.hierarquico) {
    falsa.responder([]);
  }
  // 3. os objetos vinculados (`:2152`) — nenhum (passo 7).
  falsa.responder([]);
  // 4. o trecho final de T003: a leitura do par, e a contagem de contextos.
  falsa.responder([linha]);
  falsa.responder([{ 'COUNT(*)': 0 }]);
}

/** So o texto dos comandos, para afirmar a sequencia sem repetir parametros. */
function textos(consultas: readonly Consulta[]): readonly string[] {
  return consultas.map((consulta) => consulta.texto);
}

/* ══════════════════════════════════════════════════════════════════════════
   CA-5.1 — "Apagar o termo declarado como padrao de um contexto e recusado,
   para qualquer ator"                                  @cascata @invariante
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-5.1 (@cascata @invariante) apagar o termo padrao devolve `0` e NAO emite comando nenhum', () => {
  const { falsa, modulo, exclusao, chavesLidas } = cenario({
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });

  // So a leitura do passo 1: o legado resolve o par antes de olhar a opcao.
  falsa.responder([linhaDoPadrao()]);

  const resultado = modulo.apagarRotuloDoContexto(exclusao, {
    rotuloId: ROTULO_PADRAO,
    contexto: 'category',
  });

  // `return 0` (`taxonomy.php:2077`) — *"Don't delete the default category"*.
  assert.equal(resultado, RECUSA_DO_TERMO_PADRAO);

  // ⚠️ **A invariante de UC-08 e esta:** *"o termo padrao da taxonomia continua
  // existindo"*. O **P5** manda afirmar o conjunto exato do que sumiu, e aqui o
  // conjunto e **vazio**: nenhuma escrita, em tabela nenhuma.
  assert.deepEqual(falsa.escritas, []);

  // E a cascata nao comecou: a unica leitura e a do passo 1. Nem os filhos
  // (`:2121`), nem os objetos vinculados (`:2152`), nem a contagem de contextos.
  assert.equal(falsa.selecoes.length, 1);
  assert.deepEqual(chavesLidas, [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]);
});

test('CA-5.1 a recusa NAO consulta ator: a colaboracao da exclusao nao tem nenhum', () => {
  const { falsa, modulo, exclusao } = cenario({
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });
  falsa.responder([linhaDoPadrao()]);

  // `ColaboracaoDaExclusaoDeRotulo` e `conteudo` + `opcoes`, e **nada mais** —
  // T009 declarou a ausencia do ator e a razao (*"`wp_delete_term()` nao tem
  // `current_user_can` no corpo"*). E e isso que faz CA-5.1 valer *"para qualquer
  // ator"*: nao ha a quem abrir excecao. A ausencia e verificavel, e nao so uma
  // frase no cabecalho.
  assert.deepEqual(Object.keys(exclusao).sort(), ['conteudo', 'opcoes']);

  assert.equal(
    modulo.apagarRotuloDoContexto(exclusao, {
      rotuloId: ROTULO_PADRAO,
      contexto: 'category',
    }),
    RECUSA_DO_TERMO_PADRAO,
  );
});

test('CA-5.1 `0` nao e `false`: o par inexistente e o termo padrao sao desfechos diferentes', () => {
  const { falsa, modulo, exclusao } = cenario({
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });

  // `if ( ! $ids ) { return false; }` (`:2063`): o rotulo nao existe.
  falsa.responder([]);
  assert.equal(
    modulo.apagarRotuloDoContexto(exclusao, {
      rotuloId: ROTULO,
      contexto: 'category',
    }),
    false,
  );

  // `return 0` (`:2077`): o rotulo existe e **e** o padrao.
  falsa.responder([linhaDoPadrao()]);
  assert.equal(
    modulo.apagarRotuloDoContexto(exclusao, {
      rotuloId: ROTULO_PADRAO,
      contexto: 'category',
    }),
    RECUSA_DO_TERMO_PADRAO,
  );

  // Em PHP os dois sao falsos; o **valor devolvido** e diferente, e e superficie
  // publicada (P8). Colapsar um no outro apagaria a distincao para quem chama.
  assert.notEqual(RECUSA_DO_TERMO_PADRAO as unknown, false);
});

test('CA-5.1 o rotulo que NAO e o padrao do contexto e apagado, com a cascata inteira', () => {
  const { falsa, modulo, exclusao, chavesLidas } = cenario({
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });

  programarExclusaoSemObjetos(
    falsa,
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'category',
    }),
    { hierarquico: true },
  );

  const resultado = modulo.apagarRotuloDoContexto(exclusao, {
    rotuloId: ROTULO,
    contexto: 'category',
  });

  assert.equal(resultado, true);
  assert.deepEqual(textos(falsa.escritas), [
    // passo 5, `DB-TRG3`: o `UPDATE` sai sempre em contexto hierarquico.
    'UPDATE wp_term_taxonomy SET parent = ? WHERE parent = ? AND taxonomy = ?',
    // passo 9, o trecho final de T003.
    'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_terms WHERE term_id = ?',
  ]);

  // A opcao e lida **uma** vez, e e a mesma leitura que serve ao passo 2 e ao
  // passo 3: no legado o passo 2 grava `$defaults['default']` e o passo 3 o
  // recebe por `wp_parse_args()` (`:2100`).
  assert.deepEqual(chavesLidas, [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]);
});

test('CA-5.1 contexto de extensao com `default_term`: a chave e `default_term_{nome}`, e a recusa e a mesma', () => {
  const { falsa, modulo, exclusao, chavesLidas } = cenario({
    comContextoDeExtensao: true,
    valoresDeOpcao: {
      [OPCAO_DO_TERMO_PADRAO_DA_EXTENSAO]: ROTULO_PADRAO_DA_EXTENSAO,
    },
  });

  falsa.responder([
    linhaDeTermo({
      term_id: ROTULO_PADRAO_DA_EXTENSAO,
      term_taxonomy_id: ROTULO_PADRAO_DA_EXTENSAO_NO_CONTEXTO,
      taxonomy: CONTEXTO_DE_EXTENSAO,
    }),
  ]);

  const resultado = modulo.apagarRotuloDoContexto(exclusao, {
    rotuloId: ROTULO_PADRAO_DA_EXTENSAO,
    contexto: CONTEXTO_DE_EXTENSAO,
  });

  // O segundo `return 0` do passo 2 (`:2086`), com a chave de `:2084`.
  assert.equal(resultado, RECUSA_DO_TERMO_PADRAO);
  assert.deepEqual(chavesLidas, [OPCAO_DO_TERMO_PADRAO_DA_EXTENSAO]);
  assert.deepEqual(falsa.escritas, []);
});

test('CA-5.1 contexto que NAO declara `default_term` nao tem padrao: a opcao nem e lida', () => {
  const { falsa, modulo, exclusao, chavesLidas } = cenario();

  // `post_tag` nao e `category` e **nao declara `default_term`** — como nenhum
  // dos oito do nucleo —, logo o passo 2 do legado nao entra em ramo nenhum:
  // `$defaults` fica vazio e nao ha `get_option` a emitir (`:2074` e `:2083`).
  programarExclusaoSemObjetos(
    falsa,
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'post_tag',
    }),
    { hierarquico: false },
  );

  assert.equal(
    modulo.apagarRotuloDoContexto(exclusao, {
      rotuloId: ROTULO,
      contexto: 'post_tag',
    }),
    true,
  );

  // Lista vazia e **afirmacao**: nenhuma chave de opcao foi lida.
  assert.deepEqual(chavesLidas, []);

  // E o `UPDATE` do passo 5 **nao** sai: o contexto e plano (`DB-TRG3`).
  assert.deepEqual(textos(falsa.escritas), [
    'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_terms WHERE term_id = ?',
  ]);
});

test('CA-5.1 o portao da tela recusa apagar o termo padrao a quem TEM a capacidade do contexto', () => {
  const { falsa, modulo, portao } = cenario({
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });
  falsa.responder([linhaDoPadrao()]);

  const resultado = modulo.permissaoDeApagarRotulo(portao, ROTULO_PADRAO);

  // O editor **tem** `manage_categories`, e e por isso que este teste prova algo:
  // a recusa nao vem de falta de capacidade, vem de `do_not_allow`.
  assert.deepEqual(resultado, {
    permitido: false,
    recusa: {
      motivo: 'sem-capacidade-de-apagar-o-item',
      mensagem: MENSAGENS_DOS_PORTOES_DE_ITEM.semCapacidadeDeApagarOItem,
    },
  });

  // O mesmo editor apaga um rotulo que **nao** e o padrao.
  falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'category',
    }),
  ]);
  assert.deepEqual(modulo.permissaoDeApagarRotulo(portao, ROTULO), {
    permitido: true,
  });

  // E nenhuma escrita saiu de portao nenhum.
  assert.deepEqual(falsa.escritas, []);
});

test('CA-5.1 o portao de item le o termo, e e por isso que ele toca o banco', () => {
  const { falsa, modulo, portao } = cenario({
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });
  falsa.responder([linhaDoPadrao()]);

  modulo.permissaoDeApagarRotulo(portao, ROTULO_PADRAO);

  // `$term = get_term( (int) $args[0] )`, a leitura fundida de T003, **sem**
  // contexto pedido: capacidade sobre objeto nao se decide sem o objeto. E uma
  // leitura, e so uma — a recursao do ramo 4 nao le de novo.
  assert.equal(falsa.selecoes.length, 1);
  assert.equal(
    falsa.selecoes[0]?.texto.includes('FROM wp_terms AS t'),
    true,
    falsa.selecoes[0]?.texto,
  );
});

/* ══════════════════════════════════════════════════════════════════════════
   CA-5.2 — "A recusa vence inclusive o ator de maior poder da instalacao"
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-5.2 o super administrador da rede e negado no termo padrao, e so nele', () => {
  const { falsa, modulo, portao } = cenario({
    base: BASE_EM_REDE,
    ator: SUPER_ADMIN,
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });

  // ADR 0009, garantia 2: o atalho do super administrador roda **antes** do ponto
  // de extensao, e `do_not_allow` e verificado **dentro** do atalho — e a unica
  // coisa que o detem.
  falsa.responder([linhaDoPadrao()]);
  assert.equal(
    modulo.permissaoDeApagarRotulo(portao, ROTULO_PADRAO).permitido,
    false,
  );

  // E ele passa em tudo o mais, **sem ter capacidade nenhuma na matriz**: e o
  // *"recebe tudo, menos o negado explicitamente"* de `PERM-9`.
  falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'category',
    }),
  ]);
  assert.equal(modulo.permissaoDeApagarRotulo(portao, ROTULO).permitido, true);
});

test('CA-5.2 um interceptador que CONCEDA `do_not_allow` nao muda a resposta', () => {
  const { falsa, modulo, portao } = cenario({
    base: {
      ...BASE,
      ganchos: {
        // `user_has_cap`: pode conceder e pode retirar — e aqui tenta conceder a
        // propria negacao, mais a capacidade real, por cima.
        aoMontarCapacidadesDoAtor: (capacidades) =>
          new Map([
            ...capacidades,
            [CAPACIDADE_NEGADA, true],
            ['manage_categories', true],
          ]),
      },
    },
    ator: ator('author'),
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });

  falsa.responder([linhaDoPadrao()]);

  // ADR 0009, garantia 1: *"ninguem pode ter a capacidade"* — ela e removida do
  // mapa **depois** do ponto de extensao (passo 6 de `decisao-de-capacidade.ts`),
  // logo *"um plugin que a conceda por filtro nao consegue nada"*.
  assert.equal(
    modulo.permissaoDeApagarRotulo(portao, ROTULO_PADRAO).permitido,
    false,
  );

  // O mesmo interceptador **funciona** para o que nao esta negado: e assim que se
  // sabe que o teste acima nao passou por acidente.
  falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'category',
    }),
  ]);
  assert.equal(modulo.permissaoDeApagarRotulo(portao, ROTULO).permitido, true);
});

test('CA-5.2 a recusa da funcao alcanca o super administrador pelo mesmo caminho dos outros', () => {
  const { falsa, modulo, exclusao } = cenario({
    base: BASE_EM_REDE,
    ator: SUPER_ADMIN,
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });
  falsa.responder([linhaDoPadrao()]);

  // `wp_delete_term()` nao tem ator, logo nao ha como ser super administrador
  // dentro dela: o `return 0` e o mesmo para todos. E e esta recusa — e **nao** o
  // `do_not_allow` — que protege o padrao na acao em lote e na API.
  assert.equal(
    modulo.apagarRotuloDoContexto(exclusao, {
      rotuloId: ROTULO_PADRAO,
      contexto: 'category',
    }),
    RECUSA_DO_TERMO_PADRAO,
  );
  assert.deepEqual(falsa.escritas, []);
});

test('CA-5.2 todo caminho de erro do `case` fecha a porta, e fecha tambem para o super admin', () => {
  const { falsa, modulo, portao } = cenario({
    base: BASE_EM_REDE,
    ator: SUPER_ADMIN,
  });

  // `PERM-5` e `PERM-4`: *"no mapeamento de capacidade, todo caminho de erro
  // fecha a porta"*. Os tres caminhos nao-termo de `get_term()`:

  // 1. o rotulo nao existe (`null`).
  falsa.responder([]);
  assert.equal(
    modulo.permissaoDeApagarRotulo(portao, ROTULO).permitido,
    false,
  );

  // 2. identificador zero (`invalid_term`), **sem** tocar o banco.
  const selecoesAntes = falsa.selecoes.length;
  assert.equal(modulo.permissaoDeApagarRotulo(portao, 0).permitido, false);
  assert.equal(falsa.selecoes.length, selecoesAntes);

  // 3. rotulo compartilhado entre dois contextos registrados
  //    (`ambiguous_term_id`), que T003 inventariou como dado herdado.
  falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'category',
    }),
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: 31,
      taxonomy: 'post_tag',
    }),
  ]);
  assert.equal(
    modulo.permissaoDeApagarRotulo(portao, ROTULO).permitido,
    false,
  );

  // 4. o contexto da linha nao esta registrado (`! $tax`).
  falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'contexto-que-ninguem-registrou',
    }),
  ]);
  assert.equal(
    modulo.permissaoDeApagarRotulo(portao, ROTULO).permitido,
    false,
  );
});

test('CA-5.2 o `case` recursiona no nome que o contexto declara, e e assim que `PERM-6` vale', () => {
  const { falsa, modulo, portao } = cenario();

  // `post_tag` declara `delete_post_tags` em `delete_terms`, e **nenhum papel da
  // matriz o concede**. Sem a recursao do ramo 4 — `map_meta_cap( $tax->cap->
  // delete_terms, ... )` — o nome chegaria cru a comparacao e **todo mundo seria
  // recusado, inclusive o administrador**.
  assert.equal(
    modulo.contextos.obter('post_tag')?.capacidades.apagarRotulos,
    'delete_post_tags',
  );
  assert.equal(
    MATRIZ.some((papel) =>
      papel.capacidades.some(
        (concessao) => concessao.capacidade === 'delete_post_tags',
      ),
    ),
    false,
  );

  falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'post_tag',
    }),
  ]);

  // O editor passa porque `delete_post_tags` resolve para `manage_categories`
  // (`capabilities.php:749`-`:754`, o caso de T009).
  assert.equal(modulo.permissaoDeApagarRotulo(portao, ROTULO).permitido, true);
});

test('CA-5.2 quem nao tem a capacidade do contexto e recusado com o mesmo `msgid`', () => {
  const { falsa, modulo } = cenario();
  const anonimo: ColaboracaoDaProtecaoDoTermoPadrao = {
    base: BASE,
    ator: ATOR_ANONIMO,
    opcoes: opcoesDeTeste().opcoes,
  };

  falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'category',
    }),
  ]);

  // ⚠️ O legado **nao distingue** na interface "nao pode" de "e indestrutivel":
  // os dois terminam no mesmo `wp_die` com o mesmo `msgid` (`:117`). Distinguir
  // aqui inventaria uma entrada de catalogo.
  assert.deepEqual(modulo.permissaoDeApagarRotulo(anonimo, ROTULO), {
    permitido: false,
    recusa: {
      motivo: 'sem-capacidade-de-apagar-o-item',
      mensagem: MENSAGENS_DOS_PORTOES_DE_ITEM.semCapacidadeDeApagarOItem,
    },
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   CA-5.3 — "Trocar qual termo e o padrao e permitido, e so entao o anterior
   pode ser apagado"
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-5.3 com o padrao apontando para outro rotulo, o anterior E apagado', () => {
  // A troca do padrao e uma escrita em `options`, que nao mora neste contexto —
  // ver a tabela de ausencias de `escopo-de-protecao-do-termo-padrao.ts`. O que
  // este teste afirma e o **efeito** dela: a opcao agora devolve outro valor.
  const { falsa, modulo, exclusao, chavesLidas } = cenario({
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO },
  });

  programarExclusaoSemObjetos(falsa, linhaDoPadrao(), { hierarquico: true });

  const resultado = modulo.apagarRotuloDoContexto(exclusao, {
    rotuloId: ROTULO_PADRAO,
    contexto: 'category',
  });

  // O **mesmo** rotulo que o primeiro teste desta suite recusou apagar.
  assert.equal(resultado, true);
  assert.deepEqual(textos(falsa.escritas), [
    'UPDATE wp_term_taxonomy SET parent = ? WHERE parent = ? AND taxonomy = ?',
    'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_terms WHERE term_id = ?',
  ]);
  assert.deepEqual(chavesLidas, [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]);
});

test('CA-5.3 e o novo padrao passa a ser o indestrutivel, pelos dois caminhos', () => {
  const { falsa, modulo, exclusao, portao } = cenario({
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO },
  });

  const linhaDoNovoPadrao = linhaDeTermo({
    term_id: ROTULO,
    term_taxonomy_id: ROTULO_NO_CONTEXTO,
    taxonomy: 'category',
  });

  // 1. a funcao recusa.
  falsa.responder([linhaDoNovoPadrao]);
  assert.equal(
    modulo.apagarRotuloDoContexto(exclusao, {
      rotuloId: ROTULO,
      contexto: 'category',
    }),
    RECUSA_DO_TERMO_PADRAO,
  );

  // 2. o portao da tela recusa.
  falsa.responder([linhaDoNovoPadrao]);
  assert.equal(modulo.permissaoDeApagarRotulo(portao, ROTULO).permitido, false);

  // 3. e o antigo padrao passa nos dois.
  falsa.responder([linhaDoPadrao()]);
  assert.equal(
    modulo.permissaoDeApagarRotulo(portao, ROTULO_PADRAO).permitido,
    true,
  );

  // Nenhuma das tres perguntas escreveu nada: a leitura e por chamada, e nao ha
  // estado guardado entre elas.
  assert.deepEqual(falsa.escritas, []);
});

test('CA-5.3 editar o termo padrao E permitido: o ramo de `:738` e so de `delete_term`', () => {
  const { falsa, modulo, portao } = cenario({
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });

  falsa.responder([linhaDoPadrao()]);

  // A pos-condicao de UC-08 e que o termo padrao *"continua existindo"*, e nao que
  // ele e imutavel. Negar `edit_term` aqui trancaria a tela de edicao da
  // categoria "Uncategorized", que o legado abre.
  assert.deepEqual(modulo.permissaoDeEditarRotulo(portao, ROTULO_PADRAO), {
    permitido: true,
  });
});

test('CA-5.3 a opcao do termo padrao e lida POR CHAMADA: nada e resolvido no carregamento', () => {
  const falsa = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_' });
  const modulo = criarModuloDeClassificacao({ dados: falsa.porta });

  // A troca do padrao acontece **entre** as duas perguntas, e a segunda a ve: a
  // leitura chega por ligacao tardia (AD-10) e o modulo nao guarda estado
  // (`EXT-CONTEXTO`, dimensao D-A de `parity_specs.md`).
  let padraoGravado = ROTULO_PADRAO;
  const opcoes: OpcoesNaClassificacao = {
    identificadorDoTermoPadrao: () => padraoGravado,
  };
  const exclusao: ColaboracaoDaExclusaoDeRotulo = {
    ...conteudoDeTeste(),
    opcoes,
  };

  falsa.responder([linhaDoPadrao()]);
  assert.equal(
    modulo.apagarRotuloDoContexto(exclusao, {
      rotuloId: ROTULO_PADRAO,
      contexto: 'category',
    }),
    RECUSA_DO_TERMO_PADRAO,
  );

  padraoGravado = ROTULO;

  programarExclusaoSemObjetos(falsa, linhaDoPadrao(), { hierarquico: true });
  assert.equal(
    modulo.apagarRotuloDoContexto(exclusao, {
      rotuloId: ROTULO_PADRAO,
      contexto: 'category',
    }),
    true,
  );
});

/* ══════════════════════════════════════════════════════════════════════════
   O PORTAO EM LOTE, e a correcao de leitura que ele carrega
   ══════════════════════════════════════════════════════════════════════════ */

test('o portao em lote pergunta a capacidade do CONTEXTO, no plural, e nao le a opcao', () => {
  const { falsa, modulo, chavesLidas } = cenario();

  const resultado = modulo.permissaoDeApagarRotulosEmLote(
    { base: BASE, ator: ator('editor') },
    'category',
  );

  assert.deepEqual(resultado, { permitido: true });

  // UC-08, *Excecoes*: *"Ator sem `delete_terms` | a acao em lote e recusada
  // **antes de tocar qualquer registro**"*. E e literal: nem leitura, nem opcao.
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
  assert.deepEqual(chavesLidas, []);

  // Quem nao tem a capacidade e recusado com o `msgid` de `:137`.
  assert.deepEqual(
    modulo.permissaoDeApagarRotulosEmLote(
      { base: BASE, ator: ator('author') },
      'category',
    ),
    {
      permitido: false,
      recusa: {
        motivo: 'sem-capacidade-de-apagar-os-itens',
        mensagem: MENSAGENS_DOS_PORTOES_DE_ITEM.semCapacidadeDeApagarOsItens,
      },
    },
  );
});

test('o portao em lote NAO protege o termo padrao: quem protege e o `0` da funcao', () => {
  const { falsa, modulo, exclusao } = cenario({
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });

  // ⚠️ **A correcao de leitura de T011**, com UC-08 e `SCR-044` § 6 de um lado e
  // a prosa de T009 do outro: o portao do lote e `$tax->cap->delete_terms`, no
  // plural, logo ele **nao** passa pelo `case` de objeto e responde *"pode"* para
  // um lote que inclua o termo padrao.
  assert.deepEqual(
    modulo.permissaoDeApagarRotulosEmLote(
      { base: BASE, ator: ator('editor') },
      'category',
    ),
    { permitido: true },
  );

  // E o lote e um `foreach` de `wp_delete_term()`: o padrao sobrevive por `0`...
  falsa.responder([linhaDoPadrao()]);
  assert.equal(
    modulo.apagarRotuloDoContexto(exclusao, {
      rotuloId: ROTULO_PADRAO,
      contexto: 'category',
    }),
    RECUSA_DO_TERMO_PADRAO,
  );

  // ...e os **outros** termos do lote sao apagados, como no legado. Endurecer o
  // portao para negar o lote inteiro recusaria o que o legado aceita (P1).
  programarExclusaoSemObjetos(
    falsa,
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: 'category',
    }),
    { hierarquico: true },
  );
  assert.equal(
    modulo.apagarRotuloDoContexto(exclusao, {
      rotuloId: ROTULO,
      contexto: 'category',
    }),
    true,
  );
});

test('o portao em lote recusa contexto nao registrado com o `msgid` de `:13`', () => {
  const { modulo } = cenario();

  // Na tela a recusa acontece no portao de entrada de T009, muito antes do
  // `switch` das acoes; o `msgid` e o mesmo, e nao se inventa outro.
  assert.deepEqual(
    modulo.permissaoDeApagarRotulosEmLote(
      { base: BASE, ator: ator('editor') },
      'contexto-que-ninguem-registrou',
    ),
    {
      permitido: false,
      recusa: {
        motivo: 'contexto-nao-registrado',
        mensagem: MENSAGENS_DA_TELA_DE_ROTULOS.contextoNaoRegistrado,
      },
    },
  );
});

/* ══════════════════════════════════════════════════════════════════════════
   AS MENSAGENS, e o que esta tarefa NAO portou
   ══════════════════════════════════════════════════════════════════════════ */

test('as tres mensagens dos portoes de item vem byte a byte de `SCR-044`', () => {
  // `EC-05`: *"o `msgid` em ingles **E** a chave do catalogo"*, e `SCR-044` § 4 e
  // literal sobre a comparacao — *"`diff` de string tem de ser zero"*.
  assert.deepEqual(MENSAGENS_DOS_PORTOES_DE_ITEM, {
    semCapacidadeDeApagarOItem: 'Sorry, you are not allowed to delete this item.',
    semCapacidadeDeApagarOsItens:
      'Sorry, you are not allowed to delete these items.',
    semCapacidadeDeEditarOItem: 'Sorry, you are not allowed to edit this item.',
  });
});

test('🔴 o `case` reconhece `edit_term` e `delete_term`, e nenhum terceiro nome', () => {
  // `SCR-044` e `SCR-045` listam `delete_term` e `edit_term`; **nenhum documento
  // do pacote nomeia um terceiro** — UC-08 lista os quatro nomes da taxonomia no
  // plural, e nenhum criterio de US-5 fala de atribuir. T003 fixou a doutrina:
  // *"P8 proibe remover superficie; **nao autoriza acrescentar**"*. Ver a tabela
  // 🔴 de `caso-de-capacidade-sobre-rotulo.ts`.
  assert.deepEqual(CAPACIDADES_SOBRE_O_ROTULO, [
    CAPACIDADE_DE_EDITAR_O_ROTULO,
    CAPACIDADE_DE_APAGAR_O_ROTULO,
  ]);
  assert.deepEqual(
    [CAPACIDADE_DE_EDITAR_O_ROTULO, CAPACIDADE_DE_APAGAR_O_ROTULO],
    ['edit_term', 'delete_term'],
  );
});

test('nenhuma operacao de US-5 escreve opcao: a troca do padrao nao e deste contexto', () => {
  const { falsa, modulo, exclusao, portao } = cenario({
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });

  // `OpcoesNaClassificacao` tem **um** metodo, e ele e de leitura: T007 declarou
  // a interface com um metodo so de proposito. Se CA-5.3 exigisse escrever a
  // opcao aqui, esta asercao quebraria — e a conversa seria com quem construir
  // `plataforma/opcoes/`.
  assert.deepEqual(Object.keys(portao.opcoes), ['identificadorDoTermoPadrao']);

  falsa.responder([linhaDoPadrao()]);
  modulo.apagarRotuloDoContexto(exclusao, {
    rotuloId: ROTULO_PADRAO,
    contexto: 'category',
  });

  for (const consulta of [...falsa.selecoes, ...falsa.escritas]) {
    assert.equal(consulta.texto.includes('options'), false);
  }
});
