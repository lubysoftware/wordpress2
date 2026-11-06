/**
 * Metade da entrega de **T006** da feature `006-biblioteca-de-midia`: os dois
 * casos de REQ-057 que cobram a **gravacao** — UT-057-2 e UT-057-5, o de regra
 * de negocio.
 *
 * ---
 *
 * # Por que dois casos de midia moram em BC-01
 *
 * Os outros tres (UT-057-1, UT-057-3 e UT-057-4) estao em
 * `contextos/midia/visibilidade/ut-057-visibilidade-herdada.test.ts`, e o
 * cabecalho de la tem a tabela dos cinco e a razao inteira. Em uma frase: os dois
 * casos daqui dizem *"reescrito"*, a unica linha do legado que reescreve o estado
 * do anexo e `wp-includes/post.php:4706`, dentro de `wp_insert_post()`, e essa
 * linha esta portada **neste** contexto — `./estado-na-gravacao.ts`, desde T005
 * da feature 002. A regra de dependencia 3 de `target_architecture.md` proibe
 * `contextos/midia/` importar `contextos/conteudo/` *"sempre, sem excecao"*, logo
 * o caso vai ate o codigo, e nao o contrario.
 *
 * | caso | nome, como o catalogo o escreve | tipo | prova |
 * |---|---|---|---|
 * | `UT-057-2` | reescreve para herdado qualquer estado fora dos quatro aceitos | `erro` | CA-2.2 |
 * | `UT-057-5` | impede o anexo de chegar ao estado publicado por qualquer caminho de escrita | `borda` | P2 — anexo nunca é publicado: qualquer estado fora de herdado, privado, lixeira e rascunho automático é reescrito |
 *
 * (`backlog/tests.md:878` e `:881`.)
 *
 * O caminho de escrita que a midia usa chega aqui: `wp_insert_attachment()`
 * (`wp-includes/post.php:6778`) forca `post_type = 'attachment'` (`:6790`) e
 * delega para `wp_insert_post()` (`:6792`). Por isso cada caso grava pelo
 * {@link gravarConteudo} com `tipo: 'attachment'`, e afirma o valor que foi para
 * a coluna lido do proprio SQL — o *"efeito no banco"* da Decisao 2.
 *
 * ---
 *
 * # ⚠️ O que *"qualquer caminho de escrita"* cobre aqui, e o que NAO cobre
 *
 * **Cobre os caminhos que passam por `wp_insert_post()`**: insercao, insercao
 * com `ID = 0` e atualizacao de anexo existente — que e o que `wp_update_post()`
 * entrega a `wp_insert_post()` depois de misturar a linha (`:5327`). E o que
 * BR-MIGRAR-002 ancora (`:4705`) e o que o cenario `@invariante` de `P2` em
 * `PT-014` descreve: *"um anexo criado com um estado fora do conjunto aceito,
 * quando gravado"*.
 *
 * 🔴 **Nao cobre `wp_publish_post()`, e a frase do criterio diz mais do que a
 * arvore.** `wp_publish_post()` (`:5404`) nao olha o tipo: ela grava
 * `post_status = 'publish'` com um `$wpdb->update()` direto (`:5446`), sem
 * passar por `:4705`. O nucleo so a chama a partir de
 * `check_and_publish_future_post()` (`:5503`), que exige o conteudo em `future`
 * — estado que a gravacao de anexo nunca deixa passar, como este arquivo
 * afirma —, mas ela e funcao publica, e quem a chamar com um anexo o publica. O
 * porte reproduz isso em `../publicacao/publicar.ts` (`transitarParaPublicado`),
 * como deve (P1). Esta suite **nao** afirma o contrario e **nao** fecha o
 * caminho: registra a diferenca entre CA-2.2 e o legado, que e o caso em que a
 * spec diz mais do que a arvore e o P1 resolve a favor da arvore.
 *
 * ⚠️ **E nao afirma estado com maiuscula nem espaco.** No legado o pedido passa
 * por `sanitize_post( $postarr, 'db' )` (`:4632`) antes de `:4703`, e
 * `pre_post_status` tem `sanitize_key` de fabrica
 * (`wp-includes/default-filters.php:106`): `'Private'` vira `'private'` e e
 * conservado. A gravacao deste porte ainda nao aplica `sanitize_post()` — o
 * `README.md` deste modulo o atribui a `plataforma/`, feature 015, com 🔴
 * REQ-030 fora do pacote. Um caso com `'Private'` afirmaria aqui `inherit`, que
 * nao e o que o legado grava; por isso todo estado desta suite ja e uma chave
 * sanitizada, para a qual `sanitize_key` e identidade.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { REDE_INATIVA_NA_AUTORIZACAO } from '../../../plataforma/autorizacao/index.js';
import {
  criarRepositorioDeConteudo,
  TIPO_DE_ANEXO,
} from '../armazenamento/index.js';
import {
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import type { LinhaDeResultado } from '../portas/index.js';
import {
  ESTADO_HERDADO_DO_ANEXO,
  ESTADOS_PRESERVADOS_DO_ANEXO,
  gravarConteudo,
  type ContextoDeGravacao,
  type PedidoDeGravacao,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const ID_GERADO = 7;
const ID_DO_ANEXO = 101;
const ID_DO_DESTINO = 42;

/**
 * A linha de anexo que ja esta no banco, com as 23 colunas — o alvo da
 * atualizacao.
 */
function linhaDoAnexo(
  campos: Partial<Record<string, string | number>> = {},
): LinhaDeResultado {
  return {
    ID: ID_DO_ANEXO,
    post_author: 3,
    post_date: '2026-10-08 09:00:00',
    post_date_gmt: '2026-10-08 12:00:00',
    post_content: '',
    post_title: 'foto',
    post_excerpt: '',
    post_status: ESTADO_HERDADO_DO_ANEXO,
    comment_status: 'open',
    ping_status: 'closed',
    post_password: '',
    post_name: 'foto',
    to_ping: '',
    pinged: '',
    post_modified: '2026-10-08 09:00:00',
    post_modified_gmt: '2026-10-08 12:00:00',
    post_content_filtered: '',
    post_parent: ID_DO_DESTINO,
    guid: 'https://exemplo.test/wp-content/uploads/2026/10/foto.jpg',
    menu_order: 0,
    post_type: TIPO_DE_ANEXO,
    post_mime_type: 'image/jpeg',
    comment_count: 0,
    ...campos,
  };
}

interface Cenario {
  readonly contexto: ContextoDeGravacao;
  readonly dados: PortaDeDadosFalsa;
}

/**
 * O contexto de gravacao de `ut-020-gravar-rascunho.test.ts`, com os mesmos
 * colaboradores de ligacao tardia fixos e **sem ponto de extensao registrado**:
 * os dois casos falam do que a gravacao faz com o estado pedido, e o poder de
 * um interceptador mudar a coluna depois (`wp_insert_attachment_data`) e outro
 * contrato, afirmado na suite de criterio de T005 da feature 002.
 *
 * `linha` e o que as leituras da gravacao encontram: a linha do anexo na
 * atualizacao, e nada na insercao — o identificador na URL sai unico na
 * primeira tentativa.
 */
function cenario(linha: LinhaDeResultado | null): Cenario {
  const dados = criarPortaDeDadosFalsa({
    resultadoDeEscrita: { linhasAfetadas: 1, idGerado: ID_GERADO },
  });
  for (let i = 0; i < 4; i += 1) {
    dados.responder(linha === null ? [] : [linha]);
  }

  const contexto: ContextoDeGravacao = {
    ator: { contaId: 3, login: 'autora', existe: true, concessoes: [] },
    armazenamento: { conteudo: criarRepositorioDeConteudo(dados.porta) },
    base: { matriz: [], rede: REDE_INATIVA_NA_AUTORIZACAO },
    texto: {
      sanitizarTitulo: (titulo: string, reserva: string) =>
        titulo
          .toLowerCase()
          .replace(/[\s_]+/g, '-')
          .replace(/[^a-z0-9-]/g, '') || reserva,
      codificarEmUtf8NaUrl: (texto: string, tamanho: number) =>
        texto.slice(0, tamanho),
    },
    reescrita: {
      feeds: () => ['feed', 'rdf', 'rss', 'rss2', 'atom'],
      baseDePaginacao: () => 'page',
      estruturaDeLinks: () => '',
    },
    tipoDeConteudo: (nome: string) => ({
      nome,
      traduzMetaCapacidade: true,
      capacidades: { publish_posts: 'publish_posts' },
    }),
    tipoEHierarquico: () => false,
    datas: {
      agoraNoFusoDoSite: () => '2026-10-08 12:00:00',
      agoraEmUtc: () => '2026-10-08 15:00:00',
      deUtcParaOFusoDoSite: () => '2001-01-01 01:01:01',
      doFusoDoSiteParaUtc: () => '2002-02-02 02:02:02',
    },
    suportaRecurso: () => true,
    estadoPadraoDeComentario: () => 'open',
    enderecoDoConteudo: () => `https://exemplo.test/?p=${ID_GERADO}`,
  };

  return { contexto, dados };
}

/**
 * O valor que `post_status` recebeu no **primeiro comando de escrita**, lido do
 * proprio SQL — o *"efeito no banco"*, e nao o que a funcao devolveu.
 */
function estadoGravado(dados: PortaDeDadosFalsa): string {
  const consulta = dados.escritas[0];
  assert.ok(consulta !== undefined, 'a gravacao nao emitiu comando');

  const colunas = consulta.texto.startsWith('INSERT')
    ? (consulta.texto.match(/\(([^)]*)\)/)?.[1] ?? '').split(', ')
    : (consulta.texto.match(/SET (.*) WHERE/)?.[1] ?? '')
        .split(', ')
        .map((atribuicao) => atribuicao.replace(' = ?', ''));

  const posicao = colunas.indexOf('post_status');
  assert.ok(posicao >= 0, `post_status nao esta no comando: ${consulta.texto}`);
  return textoDoParametro(consulta.parametros[posicao]);
}

/** O pedido que `wp_insert_attachment()` entrega a `wp_insert_post()`. */
function pedidoDeAnexo(
  estado: string | undefined,
  id?: number,
): PedidoDeGravacao {
  return {
    ...(id === undefined ? {} : { id }),
    titulo: 'foto',
    tipo: TIPO_DE_ANEXO,
    paiId: ID_DO_DESTINO,
    tipoMime: 'image/jpeg',
    guid: 'https://exemplo.test/wp-content/uploads/2026/10/foto.jpg',
    ...(estado === undefined ? {} : { estado }),
  };
}

/**
 * Os estados fora dos quatro aceitos que um pedido pode trazer, todos ja chaves
 * sanitizadas (ver o cabecalho): os cinco editoriais de fabrica que nao estao na
 * lista, e um de terceiro — `post_status` e `varchar(20)` sem `ENUM`
 * (`DB-ENUM`), e a reescrita nao conhece a lista de estados registrados.
 */
const ESTADOS_FORA_DOS_ACEITOS: readonly string[] = [
  'publish',
  'future',
  'draft',
  'pending',
  'request-pending',
  'estado-de-plugin',
];

/* ── UT-057-2 · erro · CA-2.2 ──────────────────────────────────────────────── */

test('UT-057-2 (CA-2.2) reescreve para herdado qualquer estado fora dos quatro aceitos', () => {
  // DADO: a lista que a gravacao aceita para anexo, transcrita de `:4705`.
  assert.deepEqual(
    [...ESTADOS_PRESERVADOS_DO_ANEXO],
    ['inherit', 'private', 'trash', 'auto-draft'],
  );

  for (const estadoPedido of ESTADOS_FORA_DOS_ACEITOS) {
    // DADO: um pedido de anexo com um estado fora dos quatro aceitos.
    const { contexto, dados } = cenario(null);

    // QUANDO: o anexo e gravado.
    const resultado = gravarConteudo(
      contexto,
      pedidoDeAnexo(estadoPedido),
    );

    // ENTAO: o estado que foi para a coluna e `inherit` — `:4705`-`:4707`.
    assert.equal(resultado.desfecho, 'inserido', estadoPedido);
    assert.equal(estadoGravado(dados), ESTADO_HERDADO_DO_ANEXO, estadoPedido);
    assert.equal(
      resultado.colunas?.post_status,
      ESTADO_HERDADO_DO_ANEXO,
      estadoPedido,
    );
  }

  // E o caso `erro` e o pedido de PUBLICAR, por extenso: quem pede `publish`
  // para um anexo nao recebe `publish` nem recebe recusa — recebe `inherit`. O
  // legado nao devolve erro nenhum aqui: a reescrita e silenciosa.
  const publicar = cenario(null);
  const resultado = gravarConteudo(publicar.contexto, pedidoDeAnexo('publish'));
  assert.notEqual(estadoGravado(publicar.dados), 'publish');
  assert.equal(resultado.erro, null);

  // A contraprova, que e o segundo `Quando` do cenario `@invariante` de `P2`:
  // *"quando o estado informado ja e um dos aceitos, nenhuma das duas o
  // reescreve"*. Sem ela, um porte que gravasse `inherit` sempre passaria.
  for (const aceito of ESTADOS_PRESERVADOS_DO_ANEXO) {
    const { contexto, dados } = cenario(null);
    gravarConteudo(contexto, pedidoDeAnexo(aceito));

    assert.equal(estadoGravado(dados), aceito, `aceito ${aceito}`);
  }
});

/* ── UT-057-5 · borda · a regra de negocio (P2 / BR-MIGRAR-002) ────────────── */

test('UT-057-5 (P2) impede o anexo de chegar ao estado publicado por qualquer caminho de escrita', () => {
  // A regra, em `target_business_rules.md`: *"**Anexo nunca e 'publicado'.**
  // Status fora de `inherit`, `private`, `trash`, `auto-draft` e reescrito para
  // `inherit`: a visibilidade do arquivo e a do post pai."* E a nota de
  // compatibilidade: *"No alvo e funcao pura aplicada na borda de escrita; o
  // efeito observavel e o valor gravado."*

  // DADO: os caminhos de escrita que chegam a `wp_insert_post()` com um anexo.
  const caminhos: readonly {
    readonly nome: string;
    readonly id: number | undefined;
    readonly linha: LinhaDeResultado | null;
    readonly comando: string;
  }[] = [
    // `wp_insert_attachment()` do envio: sem identificador, insere (`:4639`).
    { nome: 'insercao', id: undefined, linha: null, comando: 'INSERT' },
    // `ID = 0` e ausencia para o `empty()` do legado, logo tambem insere.
    { nome: 'insercao com ID igual a zero', id: 0, linha: null, comando: 'INSERT' },
    // A atualizacao de um anexo que ja esta no banco — o que `wp_update_post()`
    // entrega depois de misturar a linha, com `post_type` ja preenchido.
    {
      nome: 'atualizacao de anexo existente',
      id: ID_DO_ANEXO,
      linha: linhaDoAnexo(),
      comando: 'UPDATE',
    },
  ];

  // E as entradas: as tres formas de OMITIR o estado — a chave ausente cai no
  // default de `:4612`, `''` e `'0'` no `empty()` de `:4703`, e as tres dao
  // `draft`, que nao esta na lista — mais todo estado fora dos quatro aceitos.
  const entradas: readonly (string | undefined)[] = [
    undefined,
    '',
    '0',
    ...ESTADOS_FORA_DOS_ACEITOS,
  ];

  for (const caminho of caminhos) {
    for (const entrada of entradas) {
      const { contexto, dados } = cenario(caminho.linha);
      const onde = `${caminho.nome} / estado ${JSON.stringify(entrada)}`;

      // QUANDO: o anexo e gravado por este caminho.
      const resultado = gravarConteudo(
        contexto,
        pedidoDeAnexo(entrada, caminho.id),
      );

      // ENTAO: o comando e o do caminho — a borda e alcancada de verdade —
      assert.ok(
        dados.escritas[0]?.texto.startsWith(caminho.comando),
        `${onde}: ${dados.escritas[0]?.texto ?? 'nenhum comando'}`,
      );

      // — o anexo NAO chega a publicado —
      assert.notEqual(estadoGravado(dados), 'publish', onde);
      // — nem a `future`, que a fila agendada transformaria em publicado depois
      // por `check_and_publish_future_post()` (`:5503`) —
      assert.notEqual(estadoGravado(dados), 'future', onde);
      // — e o que vai para a coluna e o estado de heranca.
      assert.equal(estadoGravado(dados), ESTADO_HERDADO_DO_ANEXO, onde);
      assert.equal(resultado.colunas?.post_status, ESTADO_HERDADO_DO_ANEXO, onde);
    }
  }

  // A BORDA, do outro lado: a reescrita e do TIPO, e nao do estado. O mesmo
  // pedido de `publish` sem `tipo: 'attachment'` publica — e o que prova que a
  // regra e a de `:4705` (`'attachment' === $post_type`), e nao uma recusa
  // geral de `publish` que um porte "coerente" poria no lugar.
  const naoAnexo = cenario(null);
  gravarConteudo(naoAnexo.contexto, { titulo: 'foto', estado: 'publish' });
  assert.equal(estadoGravado(naoAnexo.dados), 'publish');

  // E a lista conservada nao tem `publish`: nenhum estado aceito para anexo e
  // publicado, logo nenhuma entrada sai da gravacao como publicado.
  assert.equal(ESTADOS_PRESERVADOS_DO_ANEXO.includes('publish'), false);
  assert.equal(ESTADOS_PRESERVADOS_DO_ANEXO.includes('future'), false);
});
