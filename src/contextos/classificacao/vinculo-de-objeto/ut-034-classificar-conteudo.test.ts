/**
 * A entrega de **T006**: *"4 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-034-1, UT-034-2, UT-034-3, UT-034-4), com o
 * mesmo dado de entrada, acao e resultado esperado."*
 *
 * ---
 *
 * # Os quatro casos sao TRANSCRITOS, e nao reconstruidos
 *
 * O caminho `../../../backlog/tests.md` que `tasks.md` cita resolve para
 * `backlog/tests.md` na raiz do repositorio, e a secao `REQ-034` de la tem os
 * quatro casos com nome, tipo e prova. Esta suite **copia** os quatro: um
 * `test()` por caso, na ordem do catalogo, com o nome do caso no nome do teste.
 *
 * | caso | nome no catalogo | tipo | prova (coluna `Prova`) |
 * |---|---|---|---|
 * | `UT-034-1` | *"substitui integralmente os vínculos do conteúdo naquele contexto"* | `feliz` | CA-2.1 — *"A lista de termos enviada substitui integralmente os vínculos daquele conteúdo naquele contexto"* |
 * | `UT-034-2` | *"ignora o rótulo desconhecido de quem não pode criar termo, sem criar nada"* | `erro` | CA-2.2 — *"Criar termo novo pela tela de edição exige a capacidade de criar termo daquele contexto; sem ela o rótulo desconhecido é ignorado, sem criar nada"* |
 * | `UT-034-3` | *"deixa a contagem de uso correta em todos os termos afetados"* | `feliz` | CA-2.3 — *"A contagem de uso de cada termo afetado fica correta ao fim da operação"* |
 * | `UT-034-4` | *"recusa vínculo em contexto não declarado para o tipo do conteúdo"* | `erro` | CA-2.4 — *"Só contextos declarados para aquele tipo de conteúdo aceitam vínculo"* |
 *
 * `REQ-034` **nao tem linha de regra de negocio** no catalogo — ao contrario de
 * `REQ-033`, que tem duas —, logo sao **quatro** `test()` e nenhum a mais:
 * nenhum caso foi acrescentado e nenhum foi desdobrado em dois.
 *
 * # A acao dos quatro e a MESMA operacao, e e a de cima
 *
 * Os quatro casos falam de *"conteudo"*, e a camada que o legado poe no caminho
 * do conteudo e o bloco de classificacao de `wp_insert_post()`
 * (`wp-includes/post.php:5053`-`:5109`) — e nao `wp_set_object_terms()`, que nao
 * verifica capacidade nem tipo de objeto. Por isso os quatro chamam
 * {@link ModuloDeClassificacao.classificarConteudo}, que e o porte daquele
 * bloco: e ela que tem o portao de CA-2.4, o portao de capacidade de UC-05 passo
 * 2 e a normalizacao por contexto que decide CA-2.2. A operacao de baixo tem
 * suite propria, ao lado.
 *
 * # Nao sao os testes de criterio de T005
 *
 * T005 entrega *"o comportamento de US-2 existe e os criterios CA-2.1, CA-2.2,
 * CA-2.3, CA-2.4 passam contra o sistema novo"*, e tem a suite dela em
 * `./us-2-classificar-conteudo.test.ts`: 27 testes que percorrem os oito passos
 * da substituicao, os tres criterios de contagem de `DB-TRG2`, as tres recusas
 * silenciosas e os tres retornos da remocao. Esta suite e o **catalogo**: quatro
 * casos, um por linha de `REQ-034`, cada um com o dado de entrada e o resultado
 * que o caso descreve, e nada mais. As duas afirmam a mesma regra por recortes
 * diferentes de proposito.
 *
 * **T006 depende de T005** (`tasks.md`: *"depende de: T005"*), e por isso esta
 * suite chama a operacao de `./` e o armazenamento de T002: numa arvore sem T005
 * ela nao compila, que e o que a dependencia declarada significa. O `[P]` de
 * T006 — *"tarefa de teste, que toca so a propria suite"* — e honrado ao pe da
 * letra, como T004 fez: **este arquivo e o unico tocado por esta tarefa**, nem
 * `./index.ts` nem `../index.ts` nem `../README.md` mudaram, porque suite de
 * teste nao entra em barril e a tabela de arquivos do modulo e disputada pelas
 * tarefas de implementacao da mesma onda.
 *
 * # O que estes quatro testes afirmam, e por que desta forma
 *
 * O criterio desta area e **efeito no banco** (area 3 da Decisao 2 de
 * `parity_specs.md`, que compara *"snapshot + sequencia de comandos"*), e por
 * isso a porta de teste **registra comando** em vez de simular banco
 * (`../armazenamento/porta-falsa.ts`). Cada caso afirma, quando tem escrita,
 * **qual comando sai, com quais parametros e em que ordem** — e tambem, onde
 * isso e a regra, que **nenhum comando sai**: em UT-034-2 e em UT-034-4 a
 * ausencia de comando E o resultado esperado, porque as duas recusas do legado
 * sao `if` que simplesmente nao chamam a atribuicao (P7).
 *
 * ⚠️ **Nenhum destes testes e teste de paridade.** Nao existe `.feature` de
 * classificacao em `.specify/migration/parity_tests/` e o oraculo executavel do
 * legado **nao existe nesta arvore** (`oracleAvailable: false`; levanta-lo e
 * T001 da feature `015-plataforma-transversal`). Cada afirmacao abaixo e
 * **leitura estatica** do legado, com `arquivo:linha` no comentario, e nao
 * comparacao de execucao.
 *
 * # 🔴 UT-034-2 cai sobre uma analise aberta, e esta suite NAO a resolve
 *
 * O caso pede *"ignora o rotulo desconhecido de **quem nao pode criar termo**,
 * sem criar nada"*, e o nome sugere que a capacidade e a causa da recusa. **No
 * legado ela nao e**, no caminho de atribuicao: `wp_set_object_terms()` cria o
 * rotulo que falta **sem verificar capacidade nenhuma**
 * (`wp-includes/taxonomy.php:2896`), e quem ignora o rotulo desconhecido em
 * contexto hierarquico e o `intval` de `wp_set_post_terms()`
 * (`wp-includes/post.php:5212`), que transforma o nome em `0`. Os portoes de
 * `edit_terms` do legado estao nas telas que **criam** termo
 * (`wp-admin/includes/ajax-actions.php:613` e `:1116`) e no XML-RPC
 * (`class-wp-xmlrpc-server.php:1685`). A analise inteira, com o que cada
 * documento do pacote diz e o que falta decidir, esta no cabecalho de
 * `./rotulos-informados.ts`, e e dela que vem a frase: cobrar `edit_terms` aqui
 * *"faria o sistema novo recusar a etiqueta que o legado cria para o autor"*.
 *
 * **O que este teste faz com isso, e por que nao e decidir:** ele transcreve o
 * caso — o ator que **nao** pode criar termo, o rotulo desconhecido, o resultado
 * *"ignorado, sem criar nada"* — e afirma, junto, que o mesmo acontece para quem
 * **pode** criar termo. A segunda afirmacao e o que fixa onde o mecanismo mora
 * hoje; se a decisao humana for *"`edit_terms` tambem no caminho de
 * atribuicao"*, e **ela** que falha e devolve a pergunta a quem decide.
 *
 * # ⚠️ Os dois limites declarados que aparecem aqui, e de quem sao
 *
 * | limite | consequencia nesta suite | de quem e |
 * |---|---|---|
 * | `term_exists()` por apelido e por nome, `sanitize_title()` e `wp_insert_term()` nao existem nesta arvore | em contexto **plano** o rotulo informado por nome nao e criado; UT-034-2 usa `category`, que e hierarquico, onde o legado tambem nao cria nada | T009 (US-4) e a feature 015 |
 * | o adiamento da contagem (`wp_defer_term_counting()`) nao foi portado | a contagem de UT-034-3 e **sempre** imediata, que e o default de fabrica do legado (P6) | declarado e nao construido: ver `./contagem-de-uso.ts` |
 *
 * 🔴 **E a segunda *Pergunta em aberto* de `spec.md` continua aberta:** a
 * contagem de uso e dado gravado e pode divergir de quem escreve na juncao por
 * fora. UT-034-3 afirma o valor **gravado**, que e o comportamento identico;
 * nenhuma leitura desta arvore recalcula, e esta suite nao decide nada a
 * respeito.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
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

/** O conteudo que recebe a classificacao. Ele ja existe: esta operacao nao o grava. */
const OBJETO = 42;

/**
 * A matriz de papeis do recorte que os quatro casos exercitam.
 *
 * ⚠️ `assign_categories` **nao esta aqui**, e e esse o ponto: ela nao esta em
 * papel nenhum da matriz de fabrica do legado tampouco. Quem a resolve para
 * `edit_posts` e o caso de traducao de `./caso-de-atribuicao-de-rotulo.ts`
 * (`wp-includes/capabilities.php:757`) — *"atribuir termo e poder de conteudo,
 * nao de classificacao"* (UC-05).
 */
const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'author',
    // Pode escrever, logo pode atribuir. E **nao** tem `manage_categories`,
    // que e onde `edit_categories` — a capacidade de CRIAR termo em `category`
    // — resolve (`capabilities.php:749`). E o ator de UT-034-2.
    capacidades: [{ capacidade: 'edit_posts', concedida: true }],
  },
  {
    identificador: 'editor',
    capacidades: [
      { capacidade: 'edit_posts', concedida: true },
      { capacidade: 'manage_categories', concedida: true },
    ],
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

/** O que a colaboracao com BC-01 foi perguntada, e na ordem. */
interface ChamadasDoConteudo {
  readonly tiposPerguntados: string[];
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
   * Quantos conteudos publicados cada rotulo no contexto tem, por
   * `term_taxonomy_id`.
   *
   * E um mapa, e nao um numero so, porque UT-034-3 precisa de contagens
   * **diferentes** por rotulo: e assim que se ve que o valor gravado e o que a
   * consulta devolveu, e nao um incremento calculado em memoria.
   */
  readonly publicadosPorRotulo?: ReadonlyMap<number, number>;
}

/**
 * A colaboracao com BC-01 — `post_type_exists()` e as duas contagens que
 * atravessam `posts` —, aqui como duble que registra as chamadas.
 *
 * E o que permite afirmar **qual** criterio de `DB-TRG2` foi usado sem
 * inspecionar o SQL de outro contexto: a travessia e ligacao tardia (AD-10), e
 * nao porta de dados desta feature.
 */
function conteudoDeTeste(opcoes: OpcoesDoConteudo = {}): {
  colaboracao: ColaboracaoDoVinculo;
  chamadas: ChamadasDoConteudo;
} {
  const registrados = opcoes.tiposRegistrados ?? ['post', 'page', 'attachment'];
  const publicados = opcoes.publicadosPorRotulo ?? new Map<number, number>();
  const chamadas: ChamadasDoConteudo = {
    tiposPerguntados: [],
    contagensDeConteudo: [],
    contagensDeAnexo: [],
  };

  const conteudo: ConteudoNaClassificacao = {
    tipoDeConteudoEhRegistrado(tipo) {
      chamadas.tiposPerguntados.push(tipo);
      return registrados.includes(tipo);
    },
    contarConteudoPublicado(rotuloNoContextoId, tipos, estados) {
      chamadas.contagensDeConteudo.push({ rotuloNoContextoId, tipos, estados });
      return publicados.get(rotuloNoContextoId) ?? 0;
    },
    contarAnexosPublicados(rotuloNoContextoId, estados) {
      chamadas.contagensDeAnexo.push({ rotuloNoContextoId, estados });
      return 0;
    },
  };

  return { colaboracao: { conteudo }, chamadas };
}

/** A colaboracao de quem classifica **em nome de alguem**: a de cima, com ator. */
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
function montar(): {
  falsa: PortaDeDadosFalsa;
  modulo: ModuloDeClassificacao;
} {
  const falsa = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_' });
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
}): LinhaDeResultado {
  return {
    term_id: campos.term_id,
    term_taxonomy_id: campos.term_taxonomy_id,
    name: campos.name ?? 'Noticias',
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
 * Programa as respostas do conjunto anterior: **um** comando com os `term_id` e,
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

/** A resposta de `vinculos.existe` — o `get_var` de `taxonomy.php:2906`. */
function programarVinculoJaGravado(
  falsa: PortaDeDadosFalsa,
  rotuloNoContextoId: number | null,
): void {
  falsa.responder(
    rotuloNoContextoId === null
      ? []
      : [{ term_taxonomy_id: rotuloNoContextoId }],
  );
}

/** So o texto dos comandos, para afirmar a sequencia sem repetir parametros. */
function textos(consultas: readonly Consulta[]): readonly string[] {
  return consultas.map((consulta) => consulta.texto);
}

/* ── OS COMANDOS, pelo nome do passo que os emite ──────────────────────────── */

/** Passo 1: o conjunto anterior, sem `ORDER BY` (`taxonomy.php:2867`). */
const LEITURA_DO_CONJUNTO_ANTERIOR =
  'SELECT t.term_id FROM wp_terms AS t ' +
  'INNER JOIN wp_term_taxonomy AS tt ON t.term_id = tt.term_id ' +
  'INNER JOIN wp_term_relationships AS tr ON tr.term_taxonomy_id = tt.term_taxonomy_id ' +
  'WHERE tt.taxonomy IN (?) AND tr.object_id IN (?)';

/** Passo 1b: `populate_terms()` completa cada rotulo do conjunto anterior. */
const LEITURA_FUNDIDA_DO_ROTULO =
  'SELECT t.*, tt.* FROM wp_terms AS t ' +
  'INNER JOIN wp_term_taxonomy AS tt ON t.term_id = tt.term_id ' +
  'WHERE t.term_id = ?';

/** Passo 2: a leitura do par informado (`:2888`). */
const LEITURA_DO_PAR =
  'SELECT tt.term_taxonomy_id FROM wp_term_taxonomy AS tt ' +
  'INNER JOIN wp_terms AS t ON tt.term_id = t.term_id ' +
  'WHERE tt.taxonomy = ? AND t.term_id = ?';

/** Passo 3: o vinculo ja existe? (`:2906`). */
const LEITURA_DO_VINCULO =
  'SELECT term_taxonomy_id FROM wp_term_relationships ' +
  'WHERE object_id = ? AND term_taxonomy_id = ?';

/** Passo 6: a volta de `term_taxonomy_id` para `term_id` (`:2954`). */
const VOLTA_PARA_O_ROTULO =
  'SELECT tt.term_id FROM wp_term_taxonomy AS tt ' +
  'WHERE tt.taxonomy = ? AND tt.term_taxonomy_id IN (?)';

/** Passo 4: o `INSERT` do vinculo, com DUAS colunas (`:2922`). */
const INSERCAO_DO_VINCULO =
  'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id) VALUES (?, ?)';

/** Passo 7: a remocao, em UM comando para o lote (`:3088`). */
const REMOCAO_DO_VINCULO =
  'DELETE FROM wp_term_relationships WHERE object_id = ? AND term_taxonomy_id IN (?)';

/** A gravacao da contagem de uso (`:4252` e `:4282`). */
const GRAVACAO_DA_CONTAGEM =
  'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?';

/* ══════════════════════════════════════════════════════════════════════════
   UT-034-1 `feliz` — "substitui integralmente os vinculos do conteudo naquele
   contexto"
   Prova: CA-2.1 — "A lista de termos enviada substitui integralmente os
   vinculos daquele conteudo naquele contexto"
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-034-1 substitui integralmente os vinculos do conteudo naquele contexto (CA-2.1)', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = conteudoDeTeste({
    publicadosPorRotulo: new Map([
      [31, 0],
      [32, 1],
    ]),
  });

  // Dado de entrada: o conteudo 42, do tipo `post`, ja esta em DOIS rotulos de
  // `category` — o 12 (`term_taxonomy_id` 30) e o 13 (31).
  programarConjunto(falsa, [
    { rotuloId: 12, rotuloNoContextoId: 30, contexto: 'category' },
    { rotuloId: 13, rotuloNoContextoId: 31, contexto: 'category' },
  ]);
  programarPar(falsa, 30); // o 12 da lista existe em `category`...
  programarVinculoJaGravado(falsa, 30); // ...e ja esta vinculado
  programarPar(falsa, 32); // o 14 da lista existe...
  programarVinculoJaGravado(falsa, null); // ...e nao esta vinculado
  falsa.responder([{ term_id: 13 }]); // a volta de tt_id para term_id (`:2954`)
  programarPar(falsa, 31); // a remocao resolve o 13 outra vez

  // Acao: a lista enviada mantem o 12, acrescenta o 14 e **nao traz** o 13.
  const resultado = modulo.classificarConteudo(
    comAtorNaColaboracao(colaboracao, 'author'),
    {
      objetoId: OBJETO,
      tipoDeObjeto: 'post',
      contexto: 'category',
      rotulos: [12, 14],
    },
  );

  // Resultado esperado, primeira metade — o que a operacao devolve e a lista
  // informada e resolvida, na ordem informada: e o `$tt_ids` de `:3009`, que
  // inclui o que ja estava vinculado.
  assert.deepEqual(resultado, {
    classificado: true,
    rotulosNoContextoIds: [30, 32],
  });

  // Resultado esperado, segunda metade — e e aqui que esta a palavra
  // "integralmente": a juncao passa a ter **exatamente** a lista enviada. O 32
  // entra, o 31 sai, e o 30 nao e tocado por comando nenhum, porque ja estava
  // vinculado (`if ( $wpdb->get_var( ... ) ) { continue; }`, `:2906`).
  assert.deepEqual(textos(falsa.escritas), [
    INSERCAO_DO_VINCULO,
    GRAVACAO_DA_CONTAGEM,
    REMOCAO_DO_VINCULO,
    GRAVACAO_DA_CONTAGEM,
  ]);
  assert.deepEqual(falsa.escritas[0]?.parametros, [OBJETO, 32]);
  assert.deepEqual(falsa.escritas[2]?.parametros, [OBJETO, 31]);
  assert.equal(
    falsa.escritas.some((escrita) => escrita.parametros.includes(30)),
    false,
  );

  // ⚠️ `@cascata` — o que a lista nao trouxe desaparece **da juncao** e o rotulo
  // permanece: nenhum comando apaga linha de `terms` nem de `term_taxonomy`. E o
  // conjunto exato do que sumiu e do que ficou que o **P5** cobra, e a resposta 2
  // proibe que uma restricao declarada no armazenamento o mude.
  for (const escrita of falsa.escritas) {
    assert.equal(escrita.texto.startsWith('DELETE FROM wp_terms'), false);
    assert.equal(
      escrita.texto.startsWith('DELETE FROM wp_term_taxonomy'),
      false,
    );
  }

  // E a sequencia de leituras e a do legado, passo a passo: trocar duas de lugar
  // nao muda o estado final e muda o que a area 3 da Decisao 2 compara.
  assert.deepEqual(textos(falsa.selecoes), [
    LEITURA_DO_CONJUNTO_ANTERIOR,
    LEITURA_FUNDIDA_DO_ROTULO,
    LEITURA_FUNDIDA_DO_ROTULO,
    LEITURA_DO_PAR,
    LEITURA_DO_VINCULO,
    LEITURA_DO_PAR,
    LEITURA_DO_VINCULO,
    VOLTA_PARA_O_ROTULO,
    LEITURA_DO_PAR,
  ]);
  assert.deepEqual(falsa.selecoes[0]?.parametros, ['category', OBJETO]);
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-034-2 `erro` — "ignora o rotulo desconhecido de quem nao pode criar termo,
   sem criar nada"
   Prova: CA-2.2 — "Criar termo novo pela tela de edicao exige a capacidade de
   criar termo daquele contexto; sem ela o rotulo desconhecido e ignorado, sem
   criar nada"
   🔴 Cai sobre a analise aberta de `./rotulos-informados.ts`. Ver o cabecalho.
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-034-2 ignora o rotulo desconhecido de quem nao pode criar termo, sem criar nada (CA-2.2)', () => {
  const { falsa, modulo } = montar();
  const { colaboracao, chamadas } = conteudoDeTeste();

  // Dado de entrada: o autor — que tem `edit_posts`, logo tem
  // `assign_categories` traduzida, e **nao** tem `manage_categories`, onde
  // `edit_categories` resolve — envia um rotulo que nao existe, **por nome**.
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

  // Resultado esperado: a operacao **classifica**, e classifica com lista vazia
  // — o rotulo desconhecido foi ignorado. Nao e erro, nao e recusa e nao e
  // mensagem: `wp_set_post_terms()` passa tudo por `intval` em contexto
  // hierarquico (`wp-includes/post.php:5212`), o nome vira `0`, e
  // `term_exists( 0 )` sai **sem consultar o banco** (`taxonomy.php:1651`).
  assert.deepEqual(resultado, { classificado: true, rotulosNoContextoIds: [] });

  // "Sem criar nada", na letra: **nenhum** comando de escrita. Nem `INSERT` em
  // `terms`, nem em `term_taxonomy`, nem na juncao, nem gravacao de contagem.
  assert.deepEqual(falsa.escritas, []);

  // E sem leitura nenhuma por causa do rotulo: a unica consulta e a do conjunto
  // anterior, que sai antes do laco. O par nunca e lido, e e isso que prova que
  // o item foi saltado **antes** de tocar o banco.
  assert.deepEqual(textos(falsa.selecoes), [LEITURA_DO_CONJUNTO_ANTERIOR]);

  // Nenhum termo afetado, logo nenhuma contagem: `if ( $new_tt_ids )` (`:2945`)
  // e `if ( empty( $terms ) ) { return false; }` (`:3597`).
  assert.deepEqual(chamadas.contagensDeConteudo, []);
  assert.deepEqual(chamadas.contagensDeAnexo, []);

  // 🔴 E o mesmo acontece com quem **pode** criar termo. O editor tem
  // `manage_categories`, que e onde `edit_categories` resolve
  // (`capabilities.php:749`), e o desfecho e identico — porque no legado o
  // portao de `edit_terms` nao esta neste caminho, esta no caminho que CRIA o
  // termo (`wp-admin/includes/ajax-actions.php:613`, com `wp_die( -1 )`). Esta
  // afirmacao fixa onde o mecanismo mora hoje: se a decisao humana for
  // "`edit_terms` tambem na atribuicao", e ela que falha e devolve a pergunta a
  // quem decide. A analise esta em `./rotulos-informados.ts`; nada e decidido
  // aqui.
  const comQuemPodeCriar = montar();
  programarConjunto(comQuemPodeCriar.falsa, []);

  const resultadoDoEditor = comQuemPodeCriar.modulo.classificarConteudo(
    comAtorNaColaboracao(colaboracao, 'editor'),
    {
      objetoId: OBJETO,
      tipoDeObjeto: 'post',
      contexto: 'category',
      rotulos: ['Novidades'],
    },
  );

  assert.deepEqual(resultadoDoEditor, resultado);
  assert.deepEqual(comQuemPodeCriar.falsa.escritas, []);
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-034-3 `feliz` — "deixa a contagem de uso correta em todos os termos
   afetados"
   Prova: CA-2.3 — "A contagem de uso de cada termo afetado fica correta ao fim
   da operacao"
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-034-3 deixa a contagem de uso correta em todos os termos afetados (CA-2.3)', () => {
  const { falsa, modulo } = montar();
  // As contagens que `posts` devolve DEPOIS da operacao, por rotulo no
  // contexto: o 32 ganhou este conteudo e tem 1; o 31 perdeu este e ainda tem 2,
  // de outros conteudos. Numeros diferentes de proposito — e assim que se ve que
  // o valor gravado e o que a consulta devolveu, e nao um incremento em memoria.
  const { colaboracao, chamadas } = conteudoDeTeste({
    publicadosPorRotulo: new Map([
      [31, 2],
      [32, 1],
    ]),
  });

  // Dado de entrada: o mesmo de UT-034-1 — tres rotulos envolvidos, e cada um
  // numa situacao diferente. O 30 continua vinculado, o 32 entra, o 31 sai.
  programarConjunto(falsa, [
    { rotuloId: 12, rotuloNoContextoId: 30, contexto: 'category' },
    { rotuloId: 13, rotuloNoContextoId: 31, contexto: 'category' },
  ]);
  programarPar(falsa, 30);
  programarVinculoJaGravado(falsa, 30);
  programarPar(falsa, 32);
  programarVinculoJaGravado(falsa, null);
  falsa.responder([{ term_id: 13 }]);
  programarPar(falsa, 31);

  modulo.classificarConteudo(comAtorNaColaboracao(colaboracao, 'author'), {
    objetoId: OBJETO,
    tipoDeObjeto: 'post',
    contexto: 'category',
    rotulos: [12, 14],
  });

  // Resultado esperado, primeira metade — **quais** termos sao recontados.
  // "Afetado" no legado e o que **mudou de vinculo**: o novo (`$new_tt_ids`,
  // `:2946`) e o removido (de dentro de `wp_remove_object_terms()`, `:3105`). O
  // 30, que ja estava vinculado e continua, **nao** e recontado — e a contagem
  // dele segue correta porque nao mudou. Recontar os tres emitiria comando que o
  // legado nao emite, e o defeito seria invisivel fora da sequencia.
  assert.deepEqual(
    chamadas.contagensDeConteudo.map((chamada) => chamada.rotuloNoContextoId),
    [32, 31],
  );

  // Resultado esperado, segunda metade — o valor gravado em cada um e o que a
  // contagem devolveu, um `UPDATE` por identificador.
  assert.deepEqual(
    falsa.escritas.filter(
      (escrita) => escrita.texto === GRAVACAO_DA_CONTAGEM,
    ),
    [
      { texto: GRAVACAO_DA_CONTAGEM, parametros: [1, 32] },
      { texto: GRAVACAO_DA_CONTAGEM, parametros: [2, 31] },
    ],
  );

  // "Ao fim da operacao" e literal, e e por isso que a ORDEM dos quatro comandos
  // importa: a contagem do removido sai **depois** do `DELETE` (`:3105`), logo
  // ela ja nao conta a linha apagada; a do novo sai depois do `INSERT`
  // (`:2945`). Sao **duas** recontagens nesta operacao, e nao uma.
  assert.deepEqual(textos(falsa.escritas), [
    INSERCAO_DO_VINCULO,
    GRAVACAO_DA_CONTAGEM,
    REMOCAO_DO_VINCULO,
    GRAVACAO_DA_CONTAGEM,
  ]);

  // E o criterio de contagem e o de **conteudo**, porque `category` declara
  // `post` e so ele, e `post` e tipo de conteudo registrado (`:3637`): um
  // comando por rotulo, com o `publish` de fabrica (`:4214`) e sem a consulta de
  // anexo, que `category` nao tem entre os tipos.
  assert.deepEqual(chamadas.contagensDeConteudo, [
    { rotuloNoContextoId: 32, tipos: ['post'], estados: ['publish'] },
    { rotuloNoContextoId: 31, tipos: ['post'], estados: ['publish'] },
  ]);
  assert.deepEqual(chamadas.contagensDeAnexo, []);
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-034-4 `erro` — "recusa vinculo em contexto nao declarado para o tipo do
   conteudo"
   Prova: CA-2.4 — "So contextos declarados para aquele tipo de conteudo aceitam
   vinculo"
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-034-4 recusa vinculo em contexto nao declarado para o tipo do conteudo (CA-2.4)', () => {
  const { falsa, modulo } = montar();
  const { colaboracao, chamadas } = conteudoDeTeste();

  // Dado de entrada: um conteudo do tipo `post` e um contexto registrado que
  // **nao** se aplica a ele. `link_category` declara `link`
  // (`wp-includes/taxonomy.php:136`), e e a declaracao que decide.
  assert.deepEqual(modulo.contextos.obter('link_category')?.tiposDeObjeto, [
    'link',
  ]);

  const resultado = modulo.classificarConteudo(
    comAtorNaColaboracao(colaboracao, 'editor'),
    {
      objetoId: OBJETO,
      tipoDeObjeto: 'post',
      contexto: 'link_category',
      rotulos: [20],
    },
  );

  // Resultado esperado: nao classificou, e o motivo e o tipo de objeto —
  // `if ( is_object_in_taxonomy( $post_type, $tax ) )` (`post.php:5054`).
  assert.deepEqual(resultado, {
    classificado: false,
    motivo: 'tipo-de-objeto-nao-declarado',
  });

  // ⚠️ "Recusa" aqui **nao** e erro: no legado nao ha mensagem, nao ha excecao e
  // nao ha registro. E um `if` que simplesmente nao chama a atribuicao, e o
  // **P7** poe esse silencio no contrato — a mesma doutrina que CA-1.4 ja tinha
  // em `../rotulo-e-contexto/tipos-de-objeto-do-contexto.ts`. O motivo viaja no
  // resultado para que o caso seja afirmavel, e **nenhum ramo do fluxo o
  // consulta**.
  assert.equal(ehErroDeTermo(resultado), false);

  // E a recusa e **antes** do banco: nenhuma leitura, nenhuma escrita, e nem a
  // pergunta a BC-01 sobre tipo de conteudo registrado.
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
  assert.deepEqual(chamadas.tiposPerguntados, []);

  // O contraste que mostra que a recusa vem da declaracao, e nao de um `false`
  // generico: o tipo declarado aceita, e o que nao e declarado nao aparece na
  // lista daquele tipo (`is_object_in_taxonomy()`, `post.php:5015`).
  assert.equal(modulo.contextoAceitaTipoDeObjeto('post', 'link_category'), false);
  assert.equal(modulo.contextoAceitaTipoDeObjeto('link', 'link_category'), true);
  assert.equal(
    modulo.nomesDosContextosDoTipoDeObjeto('post').includes('link_category'),
    false,
  );
});
