/**
 * A entrega de **T006** da feature `006-biblioteca-de-midia`: *"5 testes
 * automatizados, um por caso registrado em `../../../backlog/tests.md`
 * (UT-057-1, UT-057-2, UT-057-3, UT-057-4, UT-057-5), com o mesmo dado de
 * entrada, acao e resultado esperado. O teste de regra de negocio (UT-057-5)
 * entra na mesma suite."*
 *
 * ---
 *
 * # Os cinco casos foram COPIADOS do catalogo, e moram em DOIS arquivos
 *
 * O card REQ-057 e a secao que comeca em `backlog/tests.md:871`, e os cinco
 * casos sao as linhas `:877` a `:881`, com **ID, nome, tipo e prova**. O
 * catalogo nao traz tabela de dados para este card: a prova de cada caso e o
 * texto do criterio, e o cenario e o do criterio.
 *
 * | caso | nome, como o catalogo o escreve | tipo | prova | onde esta |
 * |---|---|---|---|---|
 * | `UT-057-1` | dá ao anexo com destino a visibilidade do conteúdo de destino | `feliz` | CA-2.1 | **aqui** |
 * | `UT-057-2` | reescreve para herdado qualquer estado fora dos quatro aceitos | `erro` | CA-2.2 | `contextos/conteudo/gravacao/ut-057-estado-do-anexo-na-gravacao.test.ts` |
 * | `UT-057-3` | dá visibilidade própria ao anexo sem conteúdo de destino | `feliz` | CA-2.3 | **aqui** |
 * | `UT-057-4` | acompanha a mudança de visibilidade do conteúdo de destino | `feliz` | CA-2.4 | **aqui** |
 * | `UT-057-5` | impede o anexo de chegar ao estado publicado por qualquer caminho de escrita | `borda` | P2 | `contextos/conteudo/gravacao/ut-057-estado-do-anexo-na-gravacao.test.ts` |
 *
 * **A divisao e a regra de dependencia 3, e nao escolha de organizacao.** A
 * regra `P2` (BR-MIGRAR-002) tem duas metades no legado, em dois arquivos e dois
 * momentos — o cabecalho de `./visibilidade-de-anexo.ts` tem a tabela:
 *
 * - a **leitura**, `get_post_status()` (`wp-includes/post.php:1290`-`:1348`),
 *   que resolve o `inherit` gravado na visibilidade do pai. E deste contexto
 *   (T005), e e o que UT-057-1, UT-057-3 e UT-057-4 cobram: os tres falam do
 *   valor **resolvido**;
 * - a **gravacao**, `wp_insert_post()` (`wp-includes/post.php:4705`-`:4707`),
 *   que reescreve para `inherit` o estado fora dos quatro aceitos. E de BC-01 e
 *   ja existe em `contextos/conteudo/gravacao/estado-na-gravacao.ts` — e e o que
 *   UT-057-2 e UT-057-5 cobram: os dois dizem *"reescrito"*, e a unica linha do
 *   legado que reescreve e a `:4706`.
 *
 * `target_architecture.md` proibe `contextos/<a>/` importar `contextos/<b>/`
 * *"sempre, sem excecao"*, e um arquivo de teste dentro de `contextos/midia/` e
 * modulo de `contextos/midia/`. Uma suite unica teria de escolher entre afirmar
 * metade do catalogo ou importar BC-01. A saida e a que nao quebra nenhuma das
 * duas coisas: cada caso mora no contexto cujo codigo ele exercita, e os dois
 * arquivos sao **a mesma suite da tarefa**, com o caso de regra de negocio
 * (UT-057-5) junto do caso de criterio que ele generaliza (UT-057-2). O
 * precedente da recusa ao import e `ut-020-gravar-rascunho.test.ts` (UT-020-3),
 * que afirmou so a condicao do criterio porque o portao de leitura publica nao
 * existia; aqui o codigo da outra metade **existe**, e por isso o caso vai ate
 * ele em vez de ser rebaixado.
 *
 * ---
 *
 * # Nao e a suite de criterio de T005, e a diferenca esta em DUAS fixtures
 *
 * T005 entrega *"os criterios CA-2.1 a CA-2.4 passam"* e tem a suite dela em
 * `./us-2-visibilidade-herdada.test.ts`: a contagem e a ordem das leituras do
 * pai, os cinco desfechos de `get_post_status()` e o ponto de extensao. Esta
 * suite nao repete nada disso e cobra o catalogo pelo **estado**:
 *
 * 1. **o anexo e o registro que o banco devolve**, com as 23 colunas, lido por
 *    `lerAnexo()` de T002 — e nao uma forma de quatro campos montada para o
 *    teste. E a linha que o envio de US-1 deixa no banco: `post_status` em
 *    `inherit` porque o pedido de `wp_insert_attachment()` nao traz estado
 *    (`wp-admin/includes/media.php:413`-`:419`) e `wp_insert_post()` o resolve
 *    (`:4703`, `:4705`);
 * 2. **o conteudo de destino e uma tabela em memoria que muda.** O duplo das
 *    duas leituras do pai le de um mapa por identificador que o teste
 *    reescreve entre uma resolucao e a outra, e e com isso que UT-057-4 afirma
 *    *"muda junto"* como estado — a coluna do destino muda, a do anexo nao, e a
 *    resposta acompanha a do destino. O duplo continua registrando cada leitura,
 *    porque a ausencia de leitura e afirmacao em UT-057-3.
 *
 * ---
 *
 * # 🔴 O que UT-057-3 afirma, e a frase do criterio que ele NAO afirma
 *
 * CA-2.3 diz *"visibilidade propria, declarada no registro"*, e o legado
 * **presume** `publish` para o anexo solto em `inherit`: *"Unattached
 * attachments with inherit status are assumed to be published"*
 * (`wp-includes/post.php:1311`-`:1312`). O achado e de T005 e esta registrado no
 * cabecalho de `./visibilidade-de-anexo.ts` e em `../README.md`, *O que T005
 * encontrou, e NAO resolveu*. Esta suite segue a arvore (P1): o que o registro
 * declara e a decisao de nao herdar e, para os tres estados proprios, o valor;
 * para `inherit` solto o valor e presumido. O caso afirma os dois lados, e nao
 * reescreve o criterio.
 *
 * ---
 *
 * # Como se confere
 *
 * Pela Decisao 2 de `parity_specs.md` nas duas areas de `PT-014`
 * (`.specify/migration/parity_tests/14-ingestao-e-derivadas-de-midia.feature`):
 * *comportamento de caso de uso* — o valor resolvido, que e o
 * *"a visibilidade efetiva do arquivo e a do conteudo pai nas duas"* do
 * cenario `@invariante` de `P2` (`:69`-`:76`) — e *efeito no banco*, afirmado
 * pela **ausencia**: nenhuma resolucao desta suite emite comando pela porta de
 * dados do modulo. As ancoras de `wp-includes/post.php` foram relidas na arvore
 * do 7.1.2 legivel em disco antes de citadas.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarArmazenamentoDeMidia,
  criarPortaDeDadosFalsa,
  ESTADO_HERDADO,
  lerAnexo,
  SEM_CONTEUDO_DE_DESTINO,
  TIPO_DE_ANEXO,
  type Anexo,
} from '../armazenamento/index.js';
import type { LinhaDeResultado } from '../portas/index.js';
import {
  ESTADO_PRESUMIDO_DO_ANEXO,
  ESTADOS_PROPRIOS_DO_ANEXO,
  visibilidadeDoAnexo,
  type ContextoDeVisibilidade,
  type RegistroNaVisibilidade,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const ID_DO_ANEXO = 101;
const ID_DO_DESTINO = 42;

/**
 * A linha de `posts` que o envio de US-1 deixa no banco, com as 23 colunas.
 *
 * `post_status` e `inherit` e `post_parent` e o conteudo de destino — ou `0`,
 * o `SEM_CONTEUDO_DE_DESTINO` de `DB-SENT` (BR-MIGRAR-081). As tres colunas que
 * querem dizer outra coisa no anexo (`post_mime_type`, `guid`, `post_excerpt`)
 * vem preenchidas como `wp-admin/includes/media.php:413`-`:419` as preenche.
 */
function linhaDoAnexo(
  sobrescritas: Partial<Record<string, string | number>> = {},
): LinhaDeResultado {
  return {
    ID: ID_DO_ANEXO,
    post_author: 3,
    post_date: '2026-10-08 09:00:00',
    post_date_gmt: '2026-10-08 12:00:00',
    post_content: '',
    post_title: 'foto-do-rascunho',
    post_excerpt: '',
    post_status: ESTADO_HERDADO,
    comment_status: 'open',
    ping_status: 'closed',
    post_password: '',
    post_name: 'foto-do-rascunho',
    to_ping: '',
    pinged: '',
    post_modified: '2026-10-08 09:00:00',
    post_modified_gmt: '2026-10-08 12:00:00',
    post_content_filtered: '',
    post_parent: ID_DO_DESTINO,
    guid: 'https://exemplo.test/wp-content/uploads/2026/10/foto-do-rascunho.jpg',
    menu_order: 0,
    post_type: TIPO_DE_ANEXO,
    post_mime_type: 'image/jpeg',
    comment_count: 0,
    ...sobrescritas,
  };
}

/** O conteudo de destino, no recorte que a resolucao le. */
function destino(estado: string): RegistroNaVisibilidade {
  return {
    id: ID_DO_DESTINO,
    tipo: 'post',
    estado,
    conteudoDeDestino: SEM_CONTEUDO_DE_DESTINO,
  };
}

interface TabelaDoDestino {
  readonly contexto: ContextoDeVisibilidade;
  /** `posts` do lado do pai. O teste a reescreve entre duas resolucoes. */
  readonly linhas: Map<number, RegistroNaVisibilidade>;
  /** `_wp_trash_meta_status` por identificador; ausente e `''`. */
  readonly marcadores: Map<number, string>;
  /** Toda leitura pedida, na ordem. Lista vazia e afirmacao. */
  readonly leituras: string[];
}

/**
 * As duas leituras do conteudo pai sobre uma tabela em memoria **mutavel**.
 *
 * `obterConteudo` devolve o que esta na tabela no momento da chamada, e `null`
 * — o `false` de `get_post()` — para o que nao esta. O cache de objeto fica
 * desligado, como o `Contexto` de `PT-014` fixa: cada leitura ve a tabela como
 * ela esta agora.
 */
function tabelaDoDestino(
  linhas: readonly RegistroNaVisibilidade[] = [],
): TabelaDoDestino {
  const tabela = new Map(linhas.map((linha) => [linha.id, linha]));
  const marcadores = new Map<number, string>();
  const leituras: string[] = [];

  return {
    contexto: {
      conteudo: {
        obterConteudo(conteudoId) {
          leituras.push(`obterConteudo ${conteudoId}`);
          return tabela.get(conteudoId) ?? null;
        },
        estadoAnteriorNaLixeira(conteudoId) {
          leituras.push(`estadoAnteriorNaLixeira ${conteudoId}`);
          return marcadores.get(conteudoId) ?? '';
        },
      },
    },
    linhas: tabela,
    marcadores,
    leituras,
  };
}

/* ── UT-057-1 · feliz · CA-2.1 ─────────────────────────────────────────────── */

test('UT-057-1 (CA-2.1) dá ao anexo com destino a visibilidade do conteúdo de destino', () => {
  // DADO: o anexo que o envio deixou no banco, em `inherit`, apontando para o
  // conteudo de destino. E a historia de US-2: *"um arquivo anexado a um
  // rascunho nao fique publico antes do rascunho"*.
  const anexo: Anexo = lerAnexo(linhaDoAnexo());
  assert.equal(anexo.estado, ESTADO_HERDADO);
  assert.equal(anexo.conteudoDeDestino, ID_DO_DESTINO);

  // Cada estado em que o destino pode estar — os cinco editoriais de fabrica
  // que um conteudo comum alcanca, mais um de terceiro: a coluna e
  // `varchar(20)` sem `ENUM` (`DB-ENUM`) e o legado copia o que encontrar.
  for (const estadoDoDestino of [
    'draft',
    'pending',
    'private',
    'future',
    'publish',
    'estado-de-plugin',
  ]) {
    const { contexto } = tabelaDoDestino([destino(estadoDoDestino)]);

    // QUANDO: a visibilidade do anexo e resolvida.
    const visibilidade = visibilidadeDoAnexo(contexto, anexo);

    // ENTAO: *"tem a visibilidade do destino"* — `:1321`-`:1322`.
    assert.equal(visibilidade, estadoDoDestino, `destino em ${estadoDoDestino}`);

    // E *"nunca a propria"*: a coluna do anexo e a instrucao de herdar, e nao
    // aparece na resposta em caso nenhum.
    assert.notEqual(visibilidade, ESTADO_HERDADO, `destino em ${estadoDoDestino}`);
  }

  // O caso da historia, por extenso: o anexo do rascunho NAO responde publicado.
  const doRascunho = tabelaDoDestino([destino('draft')]);
  assert.notEqual(
    visibilidadeDoAnexo(doRascunho.contexto, anexo),
    ESTADO_PRESUMIDO_DO_ANEXO,
  );

  // E a resposta nao foi gravada em lugar nenhum: o registro continua `inherit`.
  assert.equal(anexo.estado, ESTADO_HERDADO);
});

/* ── UT-057-3 · feliz · CA-2.3 ─────────────────────────────────────────────── */

test('UT-057-3 (CA-2.3) dá visibilidade própria ao anexo sem conteúdo de destino', () => {
  // DADO: o anexo enviado SEM conteudo de destino — o fluxo alternativo
  // *Arquivo sem conteudo de destino* de UC-12. `post_parent` e `0`, nao nulo.
  const solto: Anexo = lerAnexo(
    linhaDoAnexo({ post_parent: SEM_CONTEUDO_DE_DESTINO }),
  );
  assert.equal(solto.conteudoDeDestino, SEM_CONTEUDO_DE_DESTINO);

  // E um rascunho na mesma tabela, com o identificador que o anexo apontaria
  // se tivesse destino: se a resolucao herdasse de alguem, herdaria dele.
  const { contexto, leituras } = tabelaDoDestino([destino('draft')]);

  // QUANDO: a visibilidade do anexo solto e resolvida.
  const visibilidade = visibilidadeDoAnexo(contexto, solto);

  // ENTAO: *"passa a ter visibilidade propria"*. Para o registro em `inherit`
  // o valor e o que o legado presume — `:1311`-`:1312`, *"Unattached
  // attachments with inherit status are assumed to be published"*. Ver o achado
  // no cabecalho desta suite: o registro declara a decisao de nao herdar, e o
  // valor e presumido.
  assert.equal(visibilidade, ESTADO_PRESUMIDO_DO_ANEXO);
  assert.notEqual(visibilidade, 'draft');

  // E *"deixa de ser herdada"* e literal: nenhuma leitura de pai sai. O `0`
  // curto-circuita o primeiro termo de `:1307`.
  assert.deepEqual(leituras, []);

  // ENTAO, a metade de *"declarada no registro"* que o registro de fato
  // declara: os tres estados proprios do anexo atravessam a resolucao como
  // estao na coluna (`:1324`-`:1326`), e nenhum deles le pai.
  for (const estadoProprio of ESTADOS_PROPRIOS_DO_ANEXO) {
    const proprio: Anexo = lerAnexo(
      linhaDoAnexo({
        post_parent: SEM_CONTEUDO_DE_DESTINO,
        post_status: estadoProprio,
      }),
    );
    const tabela = tabelaDoDestino([destino('draft')]);

    assert.equal(visibilidadeDoAnexo(tabela.contexto, proprio), estadoProprio);
    assert.deepEqual(tabela.leituras, [], `estado proprio ${estadoProprio}`);
  }
});

/* ── UT-057-4 · feliz · CA-2.4 ─────────────────────────────────────────────── */

test('UT-057-4 (CA-2.4) acompanha a mudança de visibilidade do conteúdo de destino', () => {
  // DADO: o anexo em `inherit` apontando para um destino em rascunho, e o
  // armazenamento do modulo montado sobre uma porta que registra comando.
  const dados = criarPortaDeDadosFalsa();
  criarArmazenamentoDeMidia(dados.porta);

  const linha = linhaDoAnexo();
  const anexo: Anexo = lerAnexo(linha);
  const tabela = tabelaDoDestino([destino('draft')]);

  assert.equal(visibilidadeDoAnexo(tabela.contexto, anexo), 'draft');

  // QUANDO: a visibilidade do DESTINO muda — e so ela. Cada passo reescreve a
  // linha do destino na tabela, e nada mais.
  const passos: readonly { readonly estado: string; readonly esperado: string }[] = [
    // O rascunho e publicado: o anexo passa a ser visto como publicado junto.
    { estado: 'publish', esperado: 'publish' },
    // O conteudo e tornado privado: o anexo deixa de ser publico junto.
    { estado: 'private', esperado: 'private' },
    // Volta para rascunho.
    { estado: 'draft', esperado: 'draft' },
  ];

  for (const passo of passos) {
    tabela.linhas.set(ID_DO_DESTINO, destino(passo.estado));

    // ENTAO: *"muda a do anexo junto"* — a resposta acompanha a coluna do
    // destino na leitura seguinte (`:1322`).
    assert.equal(
      visibilidadeDoAnexo(tabela.contexto, anexo),
      passo.esperado,
      `destino em ${passo.estado}`,
    );
  }

  // E o destino que vai para a lixeira leva o anexo para o estado que ele tinha
  // ANTES da lixeira — `:1313`-`:1315`, *"Get parent status prior to
  // trashing"*. `wp_trash_post()` guarda esse estado no marcador.
  tabela.marcadores.set(ID_DO_DESTINO, 'draft');
  tabela.linhas.set(ID_DO_DESTINO, destino('trash'));
  assert.equal(visibilidadeDoAnexo(tabela.contexto, anexo), 'draft');

  // ENTAO, o lado de *efeito no banco*: o anexo acompanhou quatro mudancas sem
  // escrita nenhuma. Nenhum comando saiu pela porta de dados do modulo, e a
  // linha do anexo continua exatamente como o envio a deixou.
  assert.deepEqual(dados.escritas, []);
  assert.deepEqual(dados.selecoes, []);
  assert.deepEqual(lerAnexo(linha), anexo);
  assert.equal(anexo.estado, ESTADO_HERDADO);

  // E so leitura do pai saiu, nunca do anexo: a heranca e resolvida na
  // leitura, e a coluna do anexo nao e consultada de novo.
  assert.equal(
    tabela.leituras.every(
      (leitura) =>
        leitura === `obterConteudo ${ID_DO_DESTINO}` ||
        leitura === `estadoAnteriorNaLixeira ${ID_DO_DESTINO}`,
    ),
    true,
  );
});
