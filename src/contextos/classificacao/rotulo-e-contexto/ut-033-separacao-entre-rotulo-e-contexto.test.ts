/**
 * A entrega de **T004**: *"6 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-033-1, UT-033-2, UT-033-3, UT-033-4,
 * UT-033-5, UT-033-6), com o mesmo dado de entrada, acao e resultado esperado.
 * Os 2 testes de regra de negocio (UT-033-5, UT-033-6) entram na mesma suite."*
 *
 * ---
 *
 * # O catalogo EXISTE nesta arvore, e os seis casos sao TRANSCRITOS
 *
 * ⚠️ Vale escrever porque as ondas anteriores fizeram o contrario, e disseram
 * por que: `../../identidade-e-acesso/autorizacao/ut-014-autorizacao-por-capacidade.test.ts`
 * e `../../identidade-e-acesso/sessao/ut-003-expiracao-de-sessao.test.ts`
 * registram que `backlog/tests.md` **nao existia** e que os casos de la foram
 * *reconstruidos* pela aritmetica de criterios de aceite e regras de negocio.
 * **Agora o arquivo esta no disco** — o caminho `../../../backlog/tests.md` que
 * `tasks.md` cita resolve para `backlog/tests.md` na raiz do repositorio, e a
 * secao `REQ-033` tem os seis casos com nome, tipo e prova. Logo esta suite
 * **copia** os seis, um teste por caso, na ordem do catalogo, com o nome do
 * caso no nome do teste:
 *
 * | caso | nome no catalogo | tipo | prova (coluna `Prova`) |
 * |---|---|---|---|
 * | `UT-033-1` | *"mantém um rótulo só servindo em dois contextos ao mesmo tempo"* | `feliz` | CA-1.1 — *"Um rótulo existe uma vez e pode pertencer a mais de um contexto de classificação ao mesmo tempo"* |
 * | `UT-033-2` | *"propaga a renomeação do rótulo para todos os contextos em que ele serve"* | `feliz` | CA-1.2 — *"Renomear o rótulo muda o nome em todos os contextos em que ele serve"* |
 * | `UT-033-3` | *"preserva o rótulo no outro contexto ao removê-lo de um"* | `borda` | CA-1.3 — *"Remover o rótulo de um contexto não o remove do outro"* |
 * | `UT-033-4` | *"recusa o vínculo em tipo de conteúdo que o contexto não declara"* | `erro` | CA-1.4 — *"Contexto de classificação é declarado e diz a quais tipos de conteúdo se aplica"* |
 * | `UT-033-5` | *"grava uma linha de rótulo e uma linha de vínculo por contexto"* | `feliz` | regra — *"Term é o rótulo e Taxonomy é o contexto: o mesmo Term vive em duas taxonomias como duas linhas de vínculo e uma de rótulo"* |
 * | `UT-033-6` | *"trata o menu de navegação como contexto de classificação cujos itens são conteúdo"* | `feliz` | regra — *"Um menu de navegação é um contexto de classificação, e cada item do menu é um conteúdo"* |
 *
 * Nenhum caso foi acrescentado e nenhum foi desdobrado em dois: sao **seis**
 * `test()`, e o que cada um afirma e o que a coluna `Prova` do caso diz.
 *
 * # Nao sao os testes de criterio de T003
 *
 * T003 entrega *"o comportamento de US-1 existe e os criterios CA-1.1, CA-1.2,
 * CA-1.3, CA-1.4 passam contra o sistema novo"*, e tem a suite dela ao lado, em
 * `./us-1-rotulo-e-contexto.test.ts`: 17 testes que percorrem **as quatro
 * saidas de `WP_Term::get_instance()`**, os portoes de recusa de cada operacao,
 * o contexto `raw` da sanitizacao e o isolamento entre duas composicoes. Esta
 * suite e o **catalogo**: seis casos, um por linha de `REQ-033`, cada um com o
 * dado de entrada e o resultado que o caso descreve, e nada mais. As duas
 * afirmam a mesma regra por recortes diferentes de proposito — e o mesmo
 * arranjo que `ut-014-autorizacao-por-capacidade.test.ts` descreve: *"se so a
 * politica estiver certa e a costura com o dado estiver errada, esta e a que
 * abre"*.
 *
 * **T004 depende de T003** (`tasks.md`: *"depende de: T003"*), e por isso esta
 * suite chama as operacoes de `./` e o armazenamento de T002: numa arvore sem
 * T003 ela nao compila, que e o que a dependencia declarada significa. O `[P]`
 * de T004 — *"tarefa de teste, que toca so a propria suite"* — e honrado ao pe
 * da letra: **este arquivo e o unico tocado por esta tarefa**, nem `./index.ts`
 * nem `../index.ts` nem `../README.md` mudaram.
 *
 * # O que estes seis testes afirmam, e por que desta forma
 *
 * O criterio de aceite desta area e **efeito no banco** (area 3 da Decisao 2 de
 * `parity_specs.md`, que compara *"snapshot + sequencia de comandos"*), e por
 * isso a porta de teste **registra consulta** em vez de simular banco
 * (`../armazenamento/porta-falsa.ts`). Cada caso afirma, quando o caso tem
 * escrita, **qual comando sai, com quais parametros e em que ordem** — e
 * tambem, onde isso e a regra, que **nenhum comando sai**.
 *
 * ⚠️ **Nenhum destes testes e teste de paridade.** Nao existe `.feature` de
 * classificacao em `.specify/migration/parity_tests/` — os 20 arquivos de la
 * cobrem outros fluxos — e o oraculo executavel do legado **nao existe nesta
 * arvore** (`oracleAvailable: false`; levanta-lo e T001 da feature
 * `015-plataforma-transversal`). Cada afirmacao abaixo e **leitura estatica**
 * do legado, com `arquivo:linha` no comentario, e nao comparacao de execucao.
 *
 * # 🔴 UT-033-2 cai sobre uma divergencia aberta, e esta suite NAO a resolve
 *
 * O caso pede *"propaga a renomeacao do rotulo para todos os contextos em que
 * ele serve"*, e e exatamente o que CA-1.2 pede. **O legado 7.1.2 faz outra
 * coisa quando o rotulo e compartilhado**: entre a leitura e o `UPDATE`,
 * `wp_update_term()` chama `_split_shared_term()`
 * (`wp-includes/taxonomy.php:3383`), que insere uma linha **nova** em `terms`,
 * repoe nela a linha de contexto que esta sendo editada e so entao renomeia —
 * ou seja, **desfaz o compartilhamento em vez de propagar o nome**. A analise
 * inteira, com o que cada documento do pacote diz e o que falta decidir, esta
 * no cabecalho de `./renomear-rotulo.ts`, e esta aberta: nenhum documento de
 * `.specify/migration/` menciona divisao de rotulo compartilhado, e o **P1** da
 * constituicao exige *"uma decisao humana registrada, citada no codigo que
 * divergiu"*, que nao existe.
 *
 * **O que este teste faz com isso, e por que nao e decidir:** ele transcreve o
 * caso do catalogo — o dado de entrada, a acao e o resultado esperado que
 * `UT-033-2` escreve — e afirma, junto, que **a divisao nao aconteceu**
 * (nenhum `INSERT` em `terms` na sequencia). Assim o teste fixa o que a arvore
 * faz hoje **e** falha no dia em que alguem portar a divisao, que e quando a
 * pergunta tem de voltar para quem decide. Se a decisao for *"o legado manda"*,
 * **o caso `UT-033-2` e o criterio CA-1.2 precisam de nova redacao**, porque
 * passam a descrever o oposto do comportamento — e e por isso que a divergencia
 * esta escrita aqui tambem, e nao so na implementacao.
 *
 * Numa instalacao nova nenhuma operacao do legado cria rotulo compartilhado (o
 * inventario esta em `./resolucao-do-rotulo-no-contexto.ts`), logo nenhum
 * caminho alcancavel distingue as duas leituras: o estado que UT-033-1,
 * UT-033-2 e UT-033-3 descrevem entra nesta suite **pelo armazenamento**, que e
 * como o legado tambem o aceita.
 *
 * # ⚠️ UT-033-5 afirma uma gravacao que ainda nao tem operacao
 *
 * O caso pede *"grava uma linha de rotulo e uma linha de vinculo por
 * contexto"*. A operacao que grava rotulo no legado e `wp_insert_term()`
 * inteira — duplicata de nome no mesmo nivel, laco de sufixo do slug,
 * confirmacao de duplicata depois do `INSERT` —, e ela e de **T009** (US-4),
 * nao de T003: `./index.ts` diz isso na tabela *O que esta pasta nao tem*. O
 * que existe nesta arvore e a **forma de armazenamento** de T002, que emite os
 * mesmos dois `INSERT` nas mesmas duas tabelas, nas mesmas colunas e na mesma
 * ordem do legado (`wp-includes/taxonomy.php:2624` e `:2652`).
 *
 * Logo este teste afirma o caso **no nivel que a arvore tem**: a sequencia de
 * comandos de gravar o mesmo rotulo em dois contextos. E o que a regra de
 * negocio descreve — *"uma linha em `terms` e duas em `term_taxonomy`"*, nas
 * palavras de UC-05 (*"O mesmo rotulo em duas taxonomias"*) e de UC-08 (passo
 * 4: *"uma linha em terms, uma em term_taxonomy por taxonomia"*) —, e e
 * observavel por si. **O que fica devendo, declarado:** quando T009 trouxer
 * `wp_insert_term()`, este caso ganha a operacao no lugar dos dois `inserir()`,
 * e a sequencia afirmada aqui tem de continuar valendo byte a byte.
 *
 * ⚠️ E uma nota de vocabulario, porque ela confunde: *"linha de vinculo"* no
 * nome do caso e a linha de **`term_taxonomy`** — o rotulo dentro do contexto —,
 * e nao `term_relationships`. E a propria regra que define assim (*"vive em duas
 * taxonomias como duas linhas de vinculo e uma de rotulo"*), e a juncao
 * `term_relationships`, que liga **objeto** a rotulo, e de US-2 (T005): o escopo
 * desta pasta nao a recebe, de proposito
 * (`./escopo-de-rotulo-e-contexto.ts`). Por isso os seis testes afirmam que
 * nenhum comando deles a toca.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import type { Termo } from '../armazenamento/index.js';
import {
  criarPortaDeDadosFalsa,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import {
  criarModuloDeClassificacao,
  type ModuloDeClassificacao,
} from '../index.js';
import type { LinhaDeResultado, ResultadoDeEscrita } from '../portas/index.js';
import { ehErroDeTermo, type ErroDeTermo } from './erro-de-termo.js';
import { removerRotuloDoContexto } from './remover-rotulo-do-contexto.js';
import type { RotuloLido } from './resolucao-do-rotulo-no-contexto.js';

/**
 * Uma composicao do modulo sobre a porta que registra consulta.
 *
 * O registro de contextos nasce **dentro** da composicao (`EXT-CONTEXTO`,
 * BR-MIGRAR-105, dimensao D-A de `parity_specs.md`), logo cada teste tem os
 * oito contextos do nucleo e nenhum vizinho.
 */
function montar(
  prefixoDeTabela = 'wp_',
  resultadoDeEscrita?: ResultadoDeEscrita,
): { falsa: PortaDeDadosFalsa; modulo: ModuloDeClassificacao } {
  const falsa = criarPortaDeDadosFalsa(
    resultadoDeEscrita === undefined
      ? { prefixoDeTabela }
      : { prefixoDeTabela, resultadoDeEscrita },
  );
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
  readonly name?: string;
  readonly slug?: string;
}): LinhaDeResultado {
  return {
    term_id: campos.term_id,
    term_taxonomy_id: campos.term_taxonomy_id,
    name: campos.name ?? 'Noticias',
    slug: campos.slug ?? 'noticias',
    taxonomy: campos.taxonomy,
    description: '',
    parent: 0,
    count: 0,
    term_group: 0,
  };
}

/**
 * O dado de entrada de UT-033-1, UT-033-2 e UT-033-3: **um** rotulo
 * (`term_id` 12) servindo `category` e `post_tag` ao mesmo tempo — uma linha de
 * `terms`, duas de `term_taxonomy`, com `term_taxonomy_id` 30 e 31.
 *
 * O estado entra pelo armazenamento, e nao por operacao: ver o bloco 🔴 do
 * cabecalho.
 */
const ROTULO_EM_DOIS_CONTEXTOS: readonly LinhaDeResultado[] = [
  linhaDeTermo({ term_id: 12, term_taxonomy_id: 30, taxonomy: 'category' }),
  linhaDeTermo({ term_id: 12, term_taxonomy_id: 31, taxonomy: 'post_tag' }),
];

/** A leitura que devolveu termo: nem `null`, nem erro. */
function termoLido(valor: RotuloLido): Termo {
  assert.equal(valor !== null && !ehErroDeTermo(valor), true);
  return valor as Termo;
}

/** A leitura que devolveu erro. */
function erroLido(valor: unknown): ErroDeTermo {
  assert.equal(ehErroDeTermo(valor), true);
  return valor as ErroDeTermo;
}

/* ══════════════════════════════════════════════════════════════════════════
   UT-033-1 `feliz` — "mantem um rotulo so servindo em dois contextos ao mesmo
   tempo"
   Prova: CA-1.1 — "Um rotulo existe uma vez e pode pertencer a mais de um
   contexto de classificacao ao mesmo tempo"
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-033-1 mantem um rotulo so servindo em dois contextos ao mesmo tempo (CA-1.1)', () => {
  const { falsa, modulo } = montar();

  // Dado de entrada: UM rotulo, duas linhas de contexto. A leitura do legado
  // devolve as duas, porque a consulta de `WP_Term::get_instance()` **nao tem
  // `LIMIT 1`** — "Grab all matching terms, in case any are shared between
  // taxonomies" (`wp-includes/class-wp-term.php:131`).
  falsa.responder(ROTULO_EM_DOIS_CONTEXTOS);
  const emCategoria = termoLido(modulo.obterTermo(12, 'category'));

  falsa.responder(ROTULO_EM_DOIS_CONTEXTOS);
  const emEtiqueta = termoLido(modulo.obterTermo(12, 'post_tag'));

  // Resultado esperado, primeira metade — **existe uma vez**: o identificador
  // do rotulo, o nome e o slug sao os mesmos nos dois contextos, porque moram
  // na unica linha de `terms`.
  assert.deepEqual(
    [emCategoria.rotuloId, emCategoria.nome, emCategoria.slug],
    [12, 'Noticias', 'noticias'],
  );
  assert.deepEqual(
    [emEtiqueta.rotuloId, emEtiqueta.nome, emEtiqueta.slug],
    [12, 'Noticias', 'noticias'],
  );

  // Resultado esperado, segunda metade — **pertence a mais de um contexto ao
  // mesmo tempo**: o que distingue as duas leituras e o contexto e o
  // `term_taxonomy_id`, que e o identificador que a juncao referencia
  // (`../armazenamento/vinculo.ts`).
  assert.deepEqual(
    [emCategoria.contexto, emCategoria.rotuloNoContextoId],
    ['category', 30],
  );
  assert.deepEqual(
    [emEtiqueta.contexto, emEtiqueta.rotuloNoContextoId],
    ['post_tag', 31],
  );

  // "Ao mesmo tempo" e verificavel por uma terceira leitura, sobre o MESMO
  // dado: sem contexto pedido, as duas linhas estao vivas e o legado acusa
  // ambiguidade em vez de escolher uma (`class-wp-term.php:160`). E a
  // consequencia que o proprio legado tira deste estado.
  falsa.responder(ROTULO_EM_DOIS_CONTEXTOS);
  const ambiguo = erroLido(modulo.obterTermo(12));
  assert.equal(ambiguo.codigo, 'ambiguous_term_id');
  assert.equal(ambiguo.dado, 12);

  // As tres leituras enviam a mesma consulta, sem `LIMIT`, e nenhuma escreve.
  for (const consulta of falsa.selecoes) {
    assert.deepEqual(consulta, {
      texto:
        'SELECT t.*, tt.* FROM wp_terms AS t ' +
        'INNER JOIN wp_term_taxonomy AS tt ON t.term_id = tt.term_id ' +
        'WHERE t.term_id = ?',
      parametros: [12],
    });
  }
  assert.equal(falsa.selecoes.length, 3);
  assert.deepEqual(falsa.escritas, []);
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-033-2 `feliz` — "propaga a renomeacao do rotulo para todos os contextos
   em que ele serve"
   Prova: CA-1.2 — "Renomear o rotulo muda o nome em todos os contextos em que
   ele serve"
   🔴 Cai sobre a divergencia aberta do rotulo compartilhado. Ver o cabecalho.
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-033-2 propaga a renomeacao do rotulo para todos os contextos em que ele serve (CA-1.2)', () => {
  const { falsa, modulo } = montar();

  // Dado de entrada: o mesmo rotulo em dois contextos, e o nome novo informado
  // por um deles. `wp_update_term()` exige a taxonomia (`:3266`) — renomear e
  // operacao por contexto no legado, e e dai que vem a divergencia declarada.
  falsa.responder(ROTULO_EM_DOIS_CONTEXTOS);
  falsa.responder([{ term_taxonomy_id: 30 }]);

  const resultado = modulo.renomearRotulo({
    rotuloId: 12,
    contexto: 'category',
    nome: 'Noticias do dia',
  });

  // `return array( 'term_id' => $term_id, 'term_taxonomy_id' => $tt_id )`
  // (`wp-includes/taxonomy.php:3543`).
  assert.deepEqual(resultado, { rotuloId: 12, rotuloNoContextoId: 30 });

  // Resultado esperado: o nome e gravado UMA vez, na linha de `terms`, e o
  // comando e filtrado por **`term_id`** — nao por `term_taxonomy_id`. E aqui
  // que a propagacao acontece, e ela e do esquema: a coluna `name` existe uma
  // vez so (`:3414`).
  assert.deepEqual(falsa.escritas[0], {
    texto:
      'UPDATE wp_terms SET name = ?, slug = ?, term_group = ? WHERE term_id = ?',
    parametros: ['Noticias do dia', 'noticias', 0, 12],
  });

  // O segundo `UPDATE` sai sempre, com as quatro colunas que **nao mudaram**
  // (`:3446`), e nele a linha de `category` continua apontando para o `term_id`
  // 12 — a de `post_tag` nao e tocada e tambem continua apontando para 12.
  assert.deepEqual(falsa.escritas[1], {
    texto:
      'UPDATE wp_term_taxonomy SET term_id = ?, taxonomy = ?, description = ?, parent = ? ' +
      'WHERE term_taxonomy_id = ?',
    parametros: [12, 'category', '', 0, 30],
  });
  assert.equal(falsa.escritas.length, 2);

  // Nenhum comando escreve nome em `term_taxonomy`: a coluna nao existe la, e e
  // por isso que "todos os contextos" e por construcao, e nao por laco.
  for (const escrita of falsa.escritas) {
    if (escrita.texto.includes('wp_term_taxonomy')) {
      assert.equal(escrita.texto.includes('name'), false);
    }
  }

  // 🔴 E a prova de que a divisao NAO aconteceu: nenhum `INSERT` em `terms`.
  // O legado chamaria `_split_shared_term()` (`:3383`) antes do `UPDATE` e
  // **desfaria** o compartilhamento. Este teste fixa o que a arvore faz hoje e
  // falha no dia em que alguem portar a divisao — que e quando a pergunta volta
  // para quem decide. A analise esta em `./renomear-rotulo.ts`; nada e
  // decidido aqui.
  for (const escrita of falsa.escritas) {
    assert.equal(escrita.texto.startsWith('INSERT INTO wp_terms'), false);
  }

  // O snapshot depois da sequencia: a linha de `terms` com o nome novo, lida
  // pelo OUTRO contexto — o que ninguem renomeou.
  falsa.responder([
    linhaDeTermo({
      term_id: 12,
      term_taxonomy_id: 31,
      taxonomy: 'post_tag',
      name: 'Noticias do dia',
    }),
  ]);
  const emEtiqueta = termoLido(modulo.obterTermo(12, 'post_tag'));
  assert.deepEqual(
    [emEtiqueta.rotuloId, emEtiqueta.contexto, emEtiqueta.nome],
    [12, 'post_tag', 'Noticias do dia'],
  );
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-033-3 `borda` — "preserva o rotulo no outro contexto ao remove-lo de um"
   Prova: CA-1.3 — "Remover o rotulo de um contexto nao o remove do outro"
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-033-3 preserva o rotulo no outro contexto ao remove-lo de um (CA-1.3)', () => {
  const { falsa, modulo } = montar();

  // Dado de entrada: o mesmo rotulo em dois contextos, e a remocao de um deles.
  falsa.responder(ROTULO_EM_DOIS_CONTEXTOS);
  // A contagem e respondida DEPOIS do `DELETE`, e sobra a linha de `post_tag`:
  // e esta a borda do caso — um contexto restante preserva o rotulo, zero o
  // apagaria (`wp-includes/taxonomy.php:2214`).
  falsa.responder([{ 'COUNT(*)': 1 }]);

  // `removerRotuloDoContexto()` e o trecho `:2200`-`:2216` de
  // `wp_delete_term()`, e **nao** e operacao do modulo de proposito: sem a
  // protecao do termo padrao (US-5, T011) e sem a cascata (US-4, T009),
  // publica-la criaria um caminho de apagar dado que o legado nao expoe. A
  // razao inteira esta no bloco 🔴 de `./remover-rotulo-do-contexto.ts`.
  const resultado = removerRotuloDoContexto(modulo, {
    rotuloId: 12,
    contexto: 'category',
  });

  assert.equal(resultado, true);

  // Resultado esperado: **um** comando, e so ele — a linha de contexto de
  // `category` (`:2202`). O rotulo continua em `terms`.
  assert.deepEqual(falsa.escritas, [
    {
      texto: 'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
      parametros: [30],
    },
  ]);

  // A contagem que decide o segundo comando vem **depois** do `DELETE`, e e a
  // frase de CA-1.3 em SQL (`:2214`).
  assert.deepEqual(falsa.selecoes[1], {
    texto: 'SELECT COUNT(*) FROM wp_term_taxonomy WHERE term_id = ?',
    parametros: [12],
  });

  // Nenhum `DELETE` em `terms`: e o que "nao o remove do outro" significa no
  // esquema. (A outra ponta da borda — ultimo contexto, contagem zero, rotulo
  // apagado — e a segunda afirmacao de CA-1.3 em `./us-1-rotulo-e-contexto.test.ts`.)
  for (const escrita of falsa.escritas) {
    assert.equal(escrita.texto.includes('wp_terms'), false);
  }

  // E o rotulo continua legivel pelo contexto que sobrou, com o mesmo nome e o
  // mesmo identificador.
  falsa.responder([
    linhaDeTermo({ term_id: 12, term_taxonomy_id: 31, taxonomy: 'post_tag' }),
  ]);
  const sobrevivente = termoLido(modulo.obterTermo(12, 'post_tag'));
  assert.deepEqual(
    [sobrevivente.rotuloId, sobrevivente.contexto, sobrevivente.nome],
    [12, 'post_tag', 'Noticias'],
  );

  // E a remocao nao toca a juncao: o vinculo orfao e da cascata de T009, e esta
  // pasta nao recebe `term_relationships` (`./escopo-de-rotulo-e-contexto.ts`).
  for (const consulta of [...falsa.selecoes, ...falsa.escritas]) {
    assert.equal(consulta.texto.includes('term_relationships'), false);
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-033-4 `erro` — "recusa o vinculo em tipo de conteudo que o contexto nao
   declara"
   Prova: CA-1.4 — "Contexto de classificacao e declarado e diz a quais tipos
   de conteudo se aplica"
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-033-4 recusa o vinculo em tipo de conteudo que o contexto nao declara (CA-1.4)', () => {
  const { falsa, modulo } = montar();

  // Dado de entrada: a declaracao do contexto, que e o que decide. `category`
  // declara `post`, e **so** `post` (`wp-includes/taxonomy.php:63`).
  assert.deepEqual(modulo.contextos.obter('category')?.tiposDeObjeto, ['post']);

  // Resultado esperado: o tipo que o contexto nao declara nao aceita vinculo —
  // `is_object_in_taxonomy( 'page', 'category' )` (`:5015`).
  assert.equal(modulo.contextoAceitaTipoDeObjeto('page', 'category'), false);
  // E o contraste que mostra que a recusa vem da declaracao, e nao de um
  // `false` generico: o tipo declarado aceita.
  assert.equal(modulo.contextoAceitaTipoDeObjeto('post', 'category'), true);

  // ⚠️ A palavra "recusa" do caso **nao** significa erro: no legado nao ha
  // mensagem, nao ha excecao e nao ha registro. O chamador e um `if` que
  // simplesmente nao classifica (`wp-includes/post.php:5053`), e o **P7** da
  // constituicao poe esse silencio no contrato.
  const recusa: boolean = modulo.contextoAceitaTipoDeObjeto('page', 'category');
  assert.equal(ehErroDeTermo(recusa), false);
  assert.equal(recusa, false);

  // E a recusa e a mesma pelo outro lado da leitura: `category` nao aparece na
  // lista de `page`, que por sinal nao tem contexto nenhum — o que faz valer a
  // guarda `if ( empty( $taxonomies ) )` (`:5017`), redundante no legado e
  // portada assim mesmo.
  assert.deepEqual(modulo.nomesDosContextosDoTipoDeObjeto('page'), []);

  // Decidir vinculo nao consulta o banco e nao grava nada: o contexto nao e
  // entidade gravada, e a declaracao esta no registro desta requisicao.
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-033-5 `feliz` — "grava uma linha de rotulo e uma linha de vinculo por
   contexto"
   Prova: a regra de negocio — "Term e o rotulo e Taxonomy e o contexto: o
   mesmo Term vive em duas taxonomias como duas linhas de vinculo e uma de
   rotulo"
   ⚠️ A operacao `wp_insert_term()` e de T009. Ver o cabecalho.
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-033-5 grava uma linha de rotulo e uma linha de vinculo por contexto (regra: um Term, duas Taxonomies)', () => {
  // `idGerado: 12` e o `term_id` que o banco devolve ao `INSERT` em `terms`, e
  // e ele que vai nas duas linhas de contexto.
  const { falsa, modulo } = montar('wp_', { linhasAfetadas: 1, idGerado: 12 });

  // Acao: gravar o mesmo rotulo em dois contextos. Uma linha de rotulo...
  const rotuloId = modulo.armazenamento.rotulos.inserir({
    nome: 'Noticias',
    slug: 'noticias',
    grupoDeSinonimos: 0,
  });
  assert.equal(rotuloId, 12);

  // ...e uma linha de vinculo por contexto, as duas com o MESMO `term_id`.
  modulo.armazenamento.rotulosNoContexto.inserir({
    rotuloId,
    contexto: 'category',
    descricao: '',
    rotuloPaiId: 0,
  });
  modulo.armazenamento.rotulosNoContexto.inserir({
    rotuloId,
    contexto: 'post_tag',
    descricao: '',
    rotuloPaiId: 0,
  });

  // Resultado esperado: TRES comandos — um em `terms`
  // (`wp-includes/taxonomy.php:2624`) e um em `term_taxonomy` por contexto
  // (`:2652`), com `count = 0` como ultima coluna, que e onde o legado o
  // acrescenta. E a sequencia que UC-05 descreve em "O mesmo rotulo em duas
  // taxonomias": "Sistema grava uma linha em `terms` e duas em `term_taxonomy`".
  assert.deepEqual(falsa.escritas, [
    {
      texto: 'INSERT INTO wp_terms (name, slug, term_group) VALUES (?, ?, ?)',
      parametros: ['Noticias', 'noticias', 0],
    },
    {
      texto:
        'INSERT INTO wp_term_taxonomy (term_id, taxonomy, description, parent, count) ' +
        'VALUES (?, ?, ?, ?, ?)',
      parametros: [12, 'category', '', 0, 0],
    },
    {
      texto:
        'INSERT INTO wp_term_taxonomy (term_id, taxonomy, description, parent, count) ' +
        'VALUES (?, ?, ?, ?, ?)',
      parametros: [12, 'post_tag', '', 0, 0],
    },
  ]);

  // O nome foi gravado **uma** vez: nenhuma das duas linhas de contexto o
  // carrega, e e isso que faz do rotulo um cadastro so.
  assert.equal(
    falsa.escritas.filter((escrita) =>
      escrita.texto.startsWith('INSERT INTO wp_terms'),
    ).length,
    1,
  );
  for (const escrita of falsa.escritas) {
    if (escrita.texto.includes('wp_term_taxonomy')) {
      assert.equal(escrita.texto.includes('name'), false);
    }
  }

  // ⚠️ "Linha de vinculo" na regra e a linha de `term_taxonomy`. A juncao
  // `term_relationships`, que liga objeto a rotulo, e de US-2 (T005) e nao e
  // tocada por nenhum dos tres comandos.
  for (const escrita of falsa.escritas) {
    assert.equal(escrita.texto.includes('term_relationships'), false);
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-033-6 `feliz` — "trata o menu de navegacao como contexto de classificacao
   cujos itens sao conteudo"
   Prova: a regra de negocio — "Um menu de navegacao e um contexto de
   classificacao, e cada item do menu e um conteudo"
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-033-6 trata o menu de navegacao como contexto de classificacao cujos itens sao conteudo (regra: nav_menu e nav_menu_item)', () => {
  const { falsa, modulo } = montar();

  // Resultado esperado, primeira metade — o menu **e** um contexto de
  // classificacao: `nav_menu` esta entre os oito registrados por
  // `create_initial_taxonomies()` (`wp-includes/taxonomy.php:136`), e carrega o
  // `_builtin` que o torna irremovivel.
  const menu = modulo.contextos.obter('nav_menu');
  assert.equal(menu !== null, true);
  assert.equal(menu?.integradoAoNucleo, true);

  // Resultado esperado, segunda metade — os **itens** dele sao conteudo: o
  // tipo de objeto declarado e `nav_menu_item`, que e tipo de conteudo, e nao
  // `post`. "Um menu de navegacao e uma taxonomia e cada item do menu e um
  // Post" (`domain.md` 1.2, pela boca de UC-05).
  assert.deepEqual(menu?.tiposDeObjeto, ['nav_menu_item']);
  assert.equal(
    modulo.contextoAceitaTipoDeObjeto('nav_menu_item', 'nav_menu'),
    true,
  );
  assert.equal(modulo.contextoAceitaTipoDeObjeto('post', 'nav_menu'), false);
  assert.deepEqual(modulo.nomesDosContextosDoTipoDeObjeto('nav_menu_item'), [
    'nav_menu',
  ]);

  // E "tratar como contexto de classificacao" tem consequencia no
  // armazenamento: um menu e um rotulo nas **mesmas duas tabelas** de qualquer
  // outro contexto, lido pela mesma consulta. Nao ha tabela de menu, nao ha
  // coluna de menu — e e por isso que o produto tem oito contextos de nucleo
  // "sem inventar uma tabela por contexto" (`spec.md`).
  falsa.responder([
    linhaDeTermo({
      term_id: 44,
      term_taxonomy_id: 70,
      taxonomy: 'nav_menu',
      name: 'Principal',
      slug: 'principal',
    }),
  ]);
  const umMenu = termoLido(modulo.obterTermo(44, 'nav_menu'));
  assert.deepEqual(
    [umMenu.rotuloId, umMenu.rotuloNoContextoId, umMenu.contexto, umMenu.nome],
    [44, 70, 'nav_menu', 'Principal'],
  );
  assert.deepEqual(falsa.selecoes, [
    {
      texto:
        'SELECT t.*, tt.* FROM wp_terms AS t ' +
        'INNER JOIN wp_term_taxonomy AS tt ON t.term_id = tt.term_id ' +
        'WHERE t.term_id = ?',
      parametros: [44],
    },
  ]);
  assert.deepEqual(falsa.escritas, []);
});
