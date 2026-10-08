/**
 * A entrega de **T006**: *"4 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-034-1, UT-034-2, UT-034-3, UT-034-4), com o
 * mesmo dado de entrada, acao e resultado esperado."*
 *
 * ---
 *
 * # Os quatro casos sao TRANSCRITOS, nao reconstruidos
 *
 * O caminho `../../../backlog/tests.md` que `tasks.md` cita resolve para
 * `backlog/tests.md` na raiz do repositorio, e a secao `REQ-034` tem os quatro
 * casos com nome, tipo e prova. Esta suite **copia** os quatro, um `test()` por
 * caso, na ordem do catalogo, com o nome do caso no nome do teste:
 *
 * | caso | nome no catalogo | tipo | prova (coluna `Prova`) |
 * |---|---|---|---|
 * | `UT-034-1` | *"substitui integralmente os vínculos do conteúdo naquele contexto"* | `feliz` | CA-2.1 — *"A lista de termos enviada substitui integralmente os vínculos daquele conteúdo naquele contexto"* |
 * | `UT-034-2` | *"ignora o rótulo desconhecido de quem não pode criar termo, sem criar nada"* | `erro` | CA-2.2 — *"Criar termo novo pela tela de edição exige a capacidade de criar termo daquele contexto; sem ela o rótulo desconhecido é ignorado, sem criar nada"* |
 * | `UT-034-3` | *"deixa a contagem de uso correta em todos os termos afetados"* | `feliz` | CA-2.3 — *"A contagem de uso de cada termo afetado fica correta ao fim da operação"* |
 * | `UT-034-4` | *"recusa vínculo em contexto não declarado para o tipo do conteúdo"* | `erro` | CA-2.4 — *"Só contextos declarados para aquele tipo de conteúdo aceitam vínculo"* |
 *
 * Nenhum caso foi acrescentado e nenhum foi desdobrado em dois: sao **quatro**
 * `test()`, e o que cada um afirma e o que a coluna `Prova` do caso diz.
 * `REQ-034` nao tem bloco *Achados do QA* e nao tem teste de regra de negocio —
 * ao contrario de `REQ-033` —, logo quatro e o numero inteiro do card.
 *
 * # Nao sao os testes de criterio de T005
 *
 * T005 entrega *"o comportamento de US-2 existe e os criterios CA-2.1, CA-2.2,
 * CA-2.3, CA-2.4 passam contra o sistema novo"*, e tem a suite dela ao lado, em
 * `./us-2-classificar-conteudo.test.ts`: 30 testes que percorrem os oito passos
 * de `wp_set_object_terms()`, os cinco que so saem sob condicao, os tres
 * criterios de contagem de `DB-TRG2`, as tres recusas silenciosas e o isolamento
 * entre duas composicoes. Esta suite e o **catalogo**: quatro casos, um por linha
 * de `REQ-034`, cada um com o dado de entrada e o resultado que o caso descreve,
 * e nada mais.
 *
 * **T006 depende de T005** (`tasks.md`: *"depende de: T005"*), e por isso esta
 * suite chama as operacoes de `./`: numa arvore sem T005 ela nao compila, que e o
 * que a dependencia declarada significa. O `[P]` de T006 — *"tarefa de teste, que
 * toca so a propria suite"* — e honrado ao pe da letra: **este arquivo e o unico
 * tocado por esta tarefa**, nem `./index.ts` nem `../index.ts` nem `../README.md`
 * mudaram.
 *
 * # O que estes quatro testes afirmam, e por que desta forma
 *
 * O criterio de aceite desta area e **efeito no banco** (area 3 da Decisao 2 de
 * `parity_specs.md`, que compara *"snapshot + sequencia de comandos"*), e por
 * isso a porta de teste **registra comando** em vez de simular banco
 * (`../armazenamento/porta-falsa.ts`). Cada caso afirma, quando o caso tem
 * escrita, **qual comando sai, com quais parametros e em que ordem** — e tambem,
 * onde isso e a regra, que **nenhum comando sai**. UT-034-1 carrega a `@cascata`
 * que `parity_specs.md` torna obrigatoria em *"exclusao de conteudo e de termo"*:
 * o que a lista nao trouxe sai da juncao e o **rotulo permanece**.
 *
 * Os quatro entram pela operacao de cima, {@link
 * ModuloDeClassificacao.classificarConteudo} — o bloco de classificacao de
 * `wp_insert_post()` (`wp-includes/post.php:5053`-`:5109`) —, porque e dela que
 * os quatro casos falam: *"os vinculos do conteudo"*, *"pela tela de edicao"*,
 * *"o tipo do conteudo"*. A camada de baixo, `wp_set_object_terms()`, nao verifica
 * capacidade nem tipo de objeto, e quem a afirma nesse recorte e a suite de T005.
 *
 * ⚠️ **Nenhum destes testes e teste de paridade.** Nao existe `.feature` de
 * classificacao em `.specify/migration/parity_tests/` e o oraculo executavel do
 * legado **nao existe nesta arvore** (`oracleAvailable: false`; levanta-lo e T001
 * da feature `015-plataforma-transversal`). Cada afirmacao abaixo e **leitura
 * estatica** do legado, com `arquivo:linha` no comentario, e nao comparacao de
 * execucao.
 *
 * # 🔴 UT-034-2 cai sobre um limite declarado, e esta suite NAO o resolve
 *
 * O caso pede *"ignora o rotulo desconhecido de quem nao pode criar termo, sem
 * criar nada"*, e nomeia a capacidade como se ela fosse o portao. **No legado o
 * portao de `edit_terms` nao esta no caminho de atribuicao**: ele esta nas telas
 * que criam o termo — `_wp_ajax_add_hierarchical_term()`
 * (`wp-admin/includes/ajax-actions.php:613`, com `wp_die( -1 )`),
 * `wp_ajax_add_tag()` (`:1116`) e o XML-RPC
 * (`class-wp-xmlrpc-server.php:1685`) —, e `wp_set_object_terms()` cria rotulo
 * **sem verificar capacidade nenhuma** (`wp-includes/taxonomy.php:2896`). Em
 * contexto **hierarquico**, que e o da tela de edicao de conteudo do tipo padrao,
 * o resultado que o caso pede acontece pelo mecanismo do legado e nao pelo
 * portao: `wp_set_post_terms()` passa a lista por `intval` (`post.php:5212`), o
 * nome vira `0` e `term_exists( 0 )` sai **sem consultar o banco**
 * (`taxonomy.php:1651`). Em contexto **plano** o legado criaria o rotulo, e quem
 * tem `assign_post_tags` — que resolve para `edit_posts` — o cria.
 *
 * A analise inteira, com o que cada documento do pacote diz e o que falta
 * decidir, esta no cabecalho de `./rotulos-informados.ts`, e esta **aberta**.
 * **O que este teste faz com isso, e por que nao e decidir:** transcreve o caso —
 * o ator que nao pode criar termo, o rotulo desconhecido, e o resultado *"e
 * ignorado, sem criar nada"* — e afirma, junto, que **nenhum comando de criacao
 * sai**. Se a decisao humana for *"`edit_terms` tambem no caminho de
 * atribuicao"*, entra um portao em `resolverRotuloInformado()` e **o caso
 * `UT-034-2` e o criterio CA-2.2 passam a descrever um sistema mais fechado que o
 * original** — a nota de UC-05 *"atribuir termo e poder de conteudo, nao de
 * classificacao"* precisa de nova redacao junto. Nada disso e escolhido aqui.
 *
 * # ⚠️ UT-034-4 e UT-033-4 tem a mesma frase e afirmam camadas diferentes
 *
 * `REQ-033` tem *"recusa o vinculo em tipo de conteudo que o contexto nao
 * declara"* (CA-1.4) e `REQ-034` tem *"recusa vinculo em contexto nao declarado
 * para o tipo do conteudo"* (CA-2.4), e o proprio catalogo as distingue: o bloco
 * *Achados do QA* de `REQ-035` manda procurar *"a de contexto nao declarado em
 * REQ-033 (UT-033-4)"*. UT-033-4 afirma a **declaracao** —
 * `is_object_in_taxonomy()` como predicado, sobre o registro desta requisicao, em
 * `../rotulo-e-contexto/ut-033-separacao-entre-rotulo-e-contexto.test.ts` —, e
 * UT-034-4 afirma a **operacao**: pedir o vinculo e nao conseguir, sem comando e
 * sem erro.
 *
 * 🔴 E ha um limite declarado tambem aqui, e ele e do portao e nao do teste: no
 * legado o mapa `tax_input` de `wp_insert_post()` **nao** chama
 * `is_object_in_taxonomy()` (`post.php:5090`-`:5109`), e quem impede o vinculo na
 * pratica sao as tres superficies. O portao existe nesta arvore porque `plan.md`
 * poe *"contexto nao declarado para aquele tipo de conteudo"* na coluna de erros
 * da operacao, a pre-condicao de UC-05 e *"a taxonomia esta registrada e
 * declarada para aquele tipo de conteudo"* e CA-2.4 e criterio de aceite — a
 * leitura inteira esta em `./classificar-conteudo.ts`.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  comAtor,
  perguntarPermissao,
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarPortaDeDadosFalsa,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import type { Consulta, LinhaDeResultado } from '../portas/index.js';
import { ehErroDeTermo } from '../rotulo-e-contexto/index.js';
import {
  criarModuloDeClassificacao,
  type ModuloDeClassificacao,
} from '../index.js';
import type {
  ColaboracaoDaClassificacao,
  ColaboracaoDoVinculo,
  ConteudoNaClassificacao,
} from './escopo-de-vinculo-de-objeto.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

/** O conteudo que recebe a classificacao nos quatro casos. */
const OBJETO = 42;

/**
 * A matriz de papeis do recorte que os quatro casos exercitam: **autor**, que e
 * o ator principal de UC-05.
 *
 * `edit_posts` e a unica concessao, e e ela que faz as duas metades do dado de
 * entrada de UT-034-2 ao mesmo tempo:
 *
 * - **pode atribuir** rotulo, porque `assign_categories` nao esta em papel nenhum
 *   do legado e resolve para `edit_posts` (`wp-includes/capabilities.php:757`);
 * - **nao pode criar** termo em `category`, porque `edit_categories` resolve para
 *   `manage_categories` (`:749`-`:754`), que o autor nao tem.
 */
const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'author',
    capacidades: [{ capacidade: 'edit_posts', concedida: true }],
  },
];

const BASE: BaseDeAutorizacao = {
  matriz: MATRIZ,
  rede: REDE_INATIVA_NA_AUTORIZACAO,
};

function ator(papel: string, contaId = 7): AtorDeAutorizacao {
  return {
    contaId,
    login: papel,
    existe: true,
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

/** Quantas vezes a colaboracao com BC-01 foi chamada, e com o que. */
interface ChamadasDoConteudo {
  readonly contagensDeConteudo: {
    readonly rotuloNoContextoId: number;
    readonly tipos: readonly string[];
    readonly estados: readonly string[];
  }[];
  readonly contagensDeAnexo: {
    readonly rotuloNoContextoId: number;
    readonly estados: readonly string[];
  }[];
}

interface OpcoesDoConteudo {
  /** Os tipos que `post_type_exists()` reconhece. */
  readonly tiposRegistrados?: readonly string[];
  /**
   * Quantos conteudos publicados cada rotulo no contexto tem, **por
   * identificador**.
   *
   * E por identificador, e nao um numero so, porque e disso que UT-034-3
   * precisa: *"a contagem de uso correta em **todos** os termos afetados"* exige
   * que dois termos afetados na mesma operacao recebam numeros **diferentes**,
   * senao a afirmacao passaria com a contagem de um gravada no outro.
   */
  readonly contagemPorRotulo?: Readonly<Record<number, number>>;
}

/**
 * A colaboracao com BC-01, que no alvo e `posts` e aqui e um duble que registra
 * as chamadas — e o que permite afirmar **qual** criterio de `DB-TRG2` foi usado
 * sem inspecionar o SQL de outro contexto (`./escopo-de-vinculo-de-objeto.ts`).
 */
function conteudoDeTeste(opcoes: OpcoesDoConteudo = {}): {
  colaboracao: ColaboracaoDoVinculo;
  chamadas: ChamadasDoConteudo;
} {
  const registrados = opcoes.tiposRegistrados ?? ['post', 'page', 'attachment'];
  const contagens = opcoes.contagemPorRotulo ?? {};
  const chamadas: ChamadasDoConteudo = {
    contagensDeConteudo: [],
    contagensDeAnexo: [],
  };

  const conteudo: ConteudoNaClassificacao = {
    tipoDeConteudoEhRegistrado(tipo) {
      return registrados.includes(tipo);
    },
    contarConteudoPublicado(rotuloNoContextoId, tipos, estados) {
      chamadas.contagensDeConteudo.push({
        rotuloNoContextoId,
        tipos,
        estados,
      });
      return contagens[rotuloNoContextoId] ?? 0;
    },
    contarAnexosPublicados(rotuloNoContextoId, estados) {
      chamadas.contagensDeAnexo.push({ rotuloNoContextoId, estados });
      return 0;
    },
  };

  return { colaboracao: { conteudo }, chamadas };
}

/** A colaboracao de quem classifica em nome de alguem. */
function comAtorNaColaboracao(
  colaboracao: ColaboracaoDoVinculo,
  papel: string,
): ColaboracaoDaClassificacao {
  return { ...colaboracao, base: BASE, ator: ator(papel) };
}

/**
 * Uma composicao do modulo sobre a porta que registra comando.
 *
 * O registro de contextos nasce **dentro** da composicao (`EXT-CONTEXTO`,
 * BR-MIGRAR-105, dimensao D-A de `parity_specs.md`), logo cada teste tem os oito
 * contextos do nucleo e nenhum vizinho.
 */
function montar(prefixoDeTabela = 'wp_'): {
  falsa: PortaDeDadosFalsa;
  modulo: ModuloDeClassificacao;
} {
  const falsa = criarPortaDeDadosFalsa({ prefixoDeTabela });
  return { falsa, modulo: criarModuloDeClassificacao({ dados: falsa.porta }) };
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
}): LinhaDeResultado {
  return {
    term_id: campos.term_id,
    term_taxonomy_id: campos.term_taxonomy_id,
    name: 'Noticias',
    slug: 'noticias',
    taxonomy: campos.taxonomy,
    description: '',
    parent: 0,
    count: 0,
    term_group: 0,
  };
}

/** Um vinculo que o objeto ja tem, do jeito que a leitura inversa o devolve. */
interface VinculoExistente {
  readonly rotuloId: number;
  readonly rotuloNoContextoId: number;
  readonly contexto: string;
}

/**
 * Programa as respostas da leitura inversa: **um** comando com os `term_id` e,
 * depois, a leitura fundida de cada rotulo — que e o segundo passo que
 * `populate_terms()` faz (`class-wp-term-query.php:1123`, e a nota em
 * `./substituir-vinculos.ts`).
 */
function programarConjunto(
  falsa: PortaDeDadosFalsa,
  vinculos: readonly VinculoExistente[],
): void {
  falsa.responder(vinculos.map((vinculo) => ({ term_id: vinculo.rotuloId })));
  for (const vinculo of vinculos) {
    falsa.responder([
      linhaDeTermo({
        term_id: vinculo.rotuloId,
        term_taxonomy_id: vinculo.rotuloNoContextoId,
        taxonomy: vinculo.contexto,
      }),
    ]);
  }
}

/** A resposta de `idDoRotuloNoContexto`: o par existe naquele contexto, ou nao. */
function programarPar(
  falsa: PortaDeDadosFalsa,
  rotuloNoContextoId: number | null,
): void {
  falsa.responder(
    rotuloNoContextoId === null
      ? []
      : [{ term_taxonomy_id: rotuloNoContextoId }],
  );
}

/** A resposta de `vinculos.existe`. */
function programarVinculoJaGravado(
  falsa: PortaDeDadosFalsa,
  existe: boolean,
  rotuloNoContextoId = 1,
): void {
  falsa.responder(existe ? [{ term_taxonomy_id: rotuloNoContextoId }] : []);
}

/** So o texto dos comandos, para afirmar a sequencia sem repetir parametros. */
function textos(consultas: readonly Consulta[]): readonly string[] {
  return consultas.map((consulta) => consulta.texto);
}

/* ══════════════════════════════════════════════════════════════════════════
   UT-034-1 `feliz` — "substitui integralmente os vinculos do conteudo naquele
   contexto"
   Prova: CA-2.1 — "A lista de termos enviada substitui integralmente os
   vinculos daquele conteudo naquele contexto"
   @cascata — o que a lista nao trouxe sai da juncao, e o rotulo permanece
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-034-1 substitui integralmente os vinculos do conteudo naquele contexto (CA-2.1)', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste({
    contagemPorRotulo: { 31: 0, 32: 1 },
  });

  // Dado de entrada: o conteudo 42 tem DOIS rotulos em `category` — o 12 (par no
  // contexto 30) e o 13 (par 31). A lista enviada traz o 12 e o **14** (par 32):
  // um que ja estava, um que nao estava, e um que estava e nao veio.
  programarConjunto(falsa, [
    { rotuloId: 12, rotuloNoContextoId: 30, contexto: 'category' },
    { rotuloId: 13, rotuloNoContextoId: 31, contexto: 'category' },
  ]);
  programarPar(falsa, 30); // o 12 existe em `category`...
  programarVinculoJaGravado(falsa, true, 30); // ...e ja esta vinculado
  programarPar(falsa, 32); // o 14 existe em `category`...
  programarVinculoJaGravado(falsa, false); // ...e nao esta vinculado
  falsa.responder([{ term_id: 13 }]); // a volta de tt_id para term_id (`:2954`)
  programarPar(falsa, 31); // a remocao resolve o 13 outra vez

  // Acao: o autor envia a lista do conteudo pela tela de edicao.
  const resultado = modulo.classificarConteudo(
    comAtorNaColaboracao(colaboracao, 'author'),
    {
      objetoId: OBJETO,
      tipoDeObjeto: 'post',
      contexto: 'category',
      rotulos: [12, 14],
    },
  );

  // Resultado esperado, primeira metade — o retorno e o `$tt_ids` do legado
  // (`taxonomy.php:3009`): os pares **informados e resolvidos**, na ordem em que
  // vieram, inclusive o que ja estava vinculado.
  assert.deepEqual(resultado, {
    classificado: true,
    rotulosNoContextoIds: [30, 32],
  });

  // Resultado esperado, segunda metade — a **substituicao integral**, comando por
  // comando: o par 32 entra, o 31 sai, o 30 nao e reinserido. `plan.md` nao deixa
  // margem: "A substituicao integral da lista e contrato, nao detalhe: enviar
  // lista parcial remove o que nao veio".
  assert.deepEqual(textos(falsa.escritas), [
    'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id) VALUES (?, ?)',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_term_relationships WHERE object_id = ? AND term_taxonomy_id IN (?)',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
  ]);
  assert.deepEqual(falsa.escritas[0]?.parametros, [OBJETO, 32]);
  assert.deepEqual(falsa.escritas[2]?.parametros, [OBJETO, 31]);

  // @invariante — o `INSERT` e o `DELETE` referenciam o `term_taxonomy_id`, e
  // **nunca** o `term_id`: a juncao aponta para o rotulo *dentro do contexto*.
  // E o erro que a volta de `term_taxonomy_id` para `term_id` do legado
  // (`:2954`) convida a cometer.
  for (const escrita of falsa.escritas) {
    assert.equal(escrita.parametros.includes(12), false);
    assert.equal(escrita.parametros.includes(13), false);
    assert.equal(escrita.parametros.includes(14), false);
  }

  // @cascata — o conjunto exato do que sumiu e do que ficou, que e o que o **P5**
  // cobra: o `DELETE` alcanca **so** a juncao. O rotulo 13 continua em `terms` e
  // continua no contexto, orfao de vinculo; apagar rotulo e cascata de T009.
  assert.equal(
    falsa.escritas.some((escrita) => escrita.texto.includes('wp_terms')),
    false,
  );
  assert.equal(
    falsa.escritas.some((escrita) => escrita.texto.startsWith('DELETE FROM wp_term_taxonomy')),
    false,
  );

  // E "naquele contexto" e literal: os quatro comandos citam `category` ou um par
  // de `category`, e nenhum alcanca o mesmo objeto em outro contexto. A unica
  // leitura que nomeia contexto filtra por ele.
  assert.deepEqual(falsa.selecoes[0], {
    texto:
      'SELECT t.term_id FROM wp_terms AS t ' +
      'INNER JOIN wp_term_taxonomy AS tt ON t.term_id = tt.term_id ' +
      'INNER JOIN wp_term_relationships AS tr ON tr.term_taxonomy_id = tt.term_taxonomy_id ' +
      'WHERE tt.taxonomy IN (?) AND tr.object_id IN (?)',
    parametros: ['category', OBJETO],
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-034-2 `erro` — "ignora o rotulo desconhecido de quem nao pode criar termo,
   sem criar nada"
   Prova: CA-2.2 — "Criar termo novo pela tela de edicao exige a capacidade de
   criar termo daquele contexto; sem ela o rotulo desconhecido e ignorado, sem
   criar nada"
   🔴 Cai sobre o limite declarado de CA-2.2. Ver o cabecalho.
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-034-2 ignora o rotulo desconhecido de quem nao pode criar termo, sem criar nada (CA-2.2)', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();

  // Dado de entrada, primeira metade — **quem nao pode criar termo**. A
  // capacidade de criar rotulo em `category` e a que o contexto declara em
  // `editarRotulos` (`$tax->cap->edit_terms`, `wp-includes/taxonomy.php:63`), e
  // ela resolve para `manage_categories` (`capabilities.php:749`-`:754`), que o
  // autor nao tem. ⚠️ Os cinco atalhos de nomenclatura de taxonomia sao de T009
  // (`./caso-de-atribuicao-de-rotulo.ts`), logo a pergunta aqui e pela capacidade
  // real, que e onde o atalho desemboca.
  assert.equal(
    modulo.contextos.obter('category')?.capacidades.editarRotulos,
    'edit_categories',
  );
  assert.equal(
    perguntarPermissao(comAtor(BASE, ator('author')), 'manage_categories'),
    false,
  );

  // Dado de entrada, segunda metade — o **rotulo desconhecido**, informado por
  // nome pela tela de edicao.
  programarConjunto(falsa, []);

  const resultado = modulo.classificarConteudo(
    comAtorNaColaboracao(colaboracao, 'author'),
    {
      objetoId: OBJETO,
      tipoDeObjeto: 'post',
      contexto: 'category',
      rotulos: ['Novidades'],
    },
  );

  // Resultado esperado, primeira metade — **e ignorado**: a operacao classifica,
  // e nao recusa (o autor tem `assign_categories` pela traducao para
  // `edit_posts`), e a lista de pares afetados sai vazia. O rotulo desconhecido
  // nao virou nada.
  assert.deepEqual(resultado, { classificado: true, rotulosNoContextoIds: [] });

  // Resultado esperado, segunda metade — **sem criar nada**: nenhum comando sai.
  // Nem `INSERT` em `terms`, nem em `term_taxonomy`, nem vinculo, nem contagem.
  assert.deepEqual(falsa.escritas, []);

  // E o mecanismo pelo qual isso acontece e o do legado, visivel na sequencia de
  // LEITURAS: `wp_set_post_terms()` passa a lista por `intval` em contexto
  // hierarquico (`post.php:5212`), o nome vira `0`, e `term_exists( 0 )` devolve
  // sem consultar o banco (`taxonomy.php:1651`). Logo **nem a leitura do par
  // sai** — o rotulo desconhecido nao e nem procurado.
  assert.equal(
    falsa.selecoes.some((consulta) =>
      consulta.texto.includes('WHERE tt.taxonomy = ? AND t.term_id = ?'),
    ),
    false,
  );
  // A unica leitura e a do conjunto anterior, que e o passo 1 da substituicao e
  // acontece antes de olhar a lista informada (`:2867`).
  assert.equal(falsa.selecoes.length, 1);
  assert.equal(
    String(falsa.selecoes[0]?.texto).includes('tr.object_id IN'),
    true,
  );

  // ⚠️ "Ignora" nao e erro: nao ha `WP_Error` neste caminho do legado, nao ha
  // mensagem e nao ha registro — o **P7** poe o silencio no contrato.
  assert.equal(ehErroDeTermo(resultado), false);
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-034-3 `feliz` — "deixa a contagem de uso correta em todos os termos
   afetados"
   Prova: CA-2.3 — "A contagem de uso de cada termo afetado fica correta ao fim
   da operacao"
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-034-3 deixa a contagem de uso correta em todos os termos afetados (CA-2.3)', () => {
  const { falsa, modulo } = montar();
  // Dado de entrada da contagem: numeros **diferentes** por termo, para que uma
  // gravacao trocada nao passe. O 30 e o que entra, e fica com 4; o 31 e o que
  // sai, e fica com 2 — os dois numeros vem do `COUNT(*)` que BC-01 responde
  // **depois** da escrita que o afetou.
  const { colaboracao, chamadas } = conteudoDeTeste({
    contagemPorRotulo: { 30: 4, 31: 2 },
  });

  // O conteudo tem o rotulo 13 (par 31) em `category`, e a lista enviada traz o
  // 12 (par 30): os **dois** termos sao afetados pela mesma operacao — um pelo
  // `INSERT`, o outro pelo `DELETE`.
  programarConjunto(falsa, [
    { rotuloId: 13, rotuloNoContextoId: 31, contexto: 'category' },
  ]);
  programarPar(falsa, 30);
  programarVinculoJaGravado(falsa, false);
  falsa.responder([{ term_id: 13 }]);
  programarPar(falsa, 31);

  modulo.classificarConteudo(comAtorNaColaboracao(colaboracao, 'author'), {
    objetoId: OBJETO,
    tipoDeObjeto: 'post',
    contexto: 'category',
    rotulos: [12],
  });

  // Resultado esperado: a contagem de **cada** termo afetado foi recalculada e
  // gravada, com o numero que o criterio devolveu para ele.
  assert.deepEqual(
    falsa.escritas.filter((escrita) =>
      escrita.texto.startsWith('UPDATE wp_term_taxonomy SET count'),
    ),
    [
      {
        texto: 'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
        parametros: [4, 30],
      },
      {
        texto: 'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
        parametros: [2, 31],
      },
    ],
  );

  // "Ao fim da operacao" e posicao na sequencia, e ela e do legado: cada
  // recontagem vem **depois** da escrita que mexeu naquele termo — a do vinculo
  // novo em `wp_set_object_terms()` (`taxonomy.php:2946`) e a do removido dentro
  // de `wp_remove_object_terms()` (`:3105`). Sao **duas** recontagens por
  // operacao, e nao uma: a segunda ja nao conta a linha apagada.
  assert.deepEqual(textos(falsa.escritas), [
    'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id) VALUES (?, ?)',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_term_relationships WHERE object_id = ? AND term_taxonomy_id IN (?)',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
  ]);

  // E "correta" tem uma definicao por contexto, que e `BR-MIGRAR-078`
  // (`DB-TRG2`): `category` so tem tipo de conteudo entre os tipos de objeto,
  // logo o criterio e `_update_post_term_count()` (`:4193`) — que conta **so**
  // `post_status = 'publish'` (`:4214`) e atravessa `posts`, isto e, BC-01. Sem
  // anexo entre os tipos, a segunda consulta do criterio nao sai.
  assert.deepEqual(chamadas.contagensDeConteudo, [
    { rotuloNoContextoId: 30, tipos: ['post'], estados: ['publish'] },
    { rotuloNoContextoId: 31, tipos: ['post'], estados: ['publish'] },
  ]);
  assert.deepEqual(chamadas.contagensDeAnexo, []);

  // ⚠️ A contagem e **dado gravado** na coluna `term_taxonomy.count`, e nenhuma
  // leitura a recalcula. E a segunda *Pergunta em aberto* de `spec.md` — manter o
  // valor gravado, com a possibilidade de divergir, e o comportamento identico —,
  // e ela **continua aberta**: `./contagem-de-uso.ts` registra que ninguem
  // decidiu, e este teste nao decide.
  assert.equal(
    falsa.escritas.some((escrita) =>
      escrita.texto.startsWith('UPDATE wp_term_taxonomy SET count'),
    ),
    true,
  );
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-034-4 `erro` — "recusa vinculo em contexto nao declarado para o tipo do
   conteudo"
   Prova: CA-2.4 — "So contextos declarados para aquele tipo de conteudo aceitam
   vinculo"
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-034-4 recusa vinculo em contexto nao declarado para o tipo do conteudo (CA-2.4)', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste();

  // Dado de entrada: `link_category` e contexto registrado — e nao se aplica a
  // conteudo nenhum. O tipo de objeto que ele declara e `link`, e so
  // (`wp-includes/taxonomy.php:136`), o que faz dele o dono da coluna polimorfica
  // da juncao.
  assert.deepEqual(modulo.contextos.obter('link_category')?.tiposDeObjeto, [
    'link',
  ]);

  // Acao: pedir o vinculo de um conteudo do tipo `post` nesse contexto.
  const resultado = modulo.classificarConteudo(
    comAtorNaColaboracao(colaboracao, 'author'),
    {
      objetoId: OBJETO,
      tipoDeObjeto: 'post',
      contexto: 'link_category',
      rotulos: [20],
    },
  );

  // Resultado esperado: o vinculo e recusado, e a recusa diz qual dos tres `if`
  // do legado barrou — `is_object_in_taxonomy( $post_type, $taxonomy )`
  // (`wp-includes/post.php:5054`), que e o primeiro deles.
  assert.deepEqual(resultado, {
    classificado: false,
    motivo: 'tipo-de-objeto-nao-declarado',
  });

  // ⚠️ "Recusa" **nao** e erro: o legado nao tem mensagem, nao tem excecao e nao
  // tem registro aqui — e um `if` que simplesmente nao classifica, e o **P7** poe
  // esse silencio no contrato. O motivo viaja para que o criterio seja afirmavel,
  // e nenhum ramo do fluxo o consulta.
  assert.equal(ehErroDeTermo(resultado), false);

  // E a recusa acontece **antes do banco**: nenhuma leitura, nenhuma escrita.
  // Nem o conjunto anterior e lido, porque a substituicao nunca e chamada.
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);

  // O contraste que mostra que a recusa vem da **declaracao**, e nao de um
  // `false` generico: o tipo declarado aceita, e o mesmo contexto que recusa
  // `post` aceita `link`.
  assert.equal(modulo.contextoAceitaTipoDeObjeto('post', 'link_category'), false);
  assert.equal(modulo.contextoAceitaTipoDeObjeto('link', 'link_category'), true);
});
