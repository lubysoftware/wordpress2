/**
 * A entrega de **T006**: *"4 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-020-1, UT-020-2, UT-020-3, UT-020-4), com o
 * mesmo dado de entrada, acao e resultado esperado. O teste de regra de negocio
 * (UT-020-4) entra na mesma suite."*
 *
 * ---
 *
 * # O catalogo EXISTE nesta arvore, e os quatro casos foram COPIADOS
 *
 * `backlog/tests.md` esta em disco, e REQ-020 ocupa as linhas 335 a 349 dele,
 * com veredito `aprovado` e *"3 de 3 criterios de aceite cobertos"*. Os quatro
 * casos sao estes, transcritos da tabela do card — nome e prova byte a byte, e
 * nenhum deles reconstruido por aritmetica:
 *
 * | ID | Nome | Tipo | Prova |
 * |---|---|---|---|
 * | `UT-020-1` | grava rascunho quando o estado não é informado | `feliz` | Gravar conteúdo sem informar o estado resulta em rascunho, nunca em publicado |
 * | `UT-020-2` | mantém a omissão sem publicar em todo caminho de escrita | `borda` | O default do armazenamento não contradiz esta regra: não existe caminho em que a omissão publique |
 * | `UT-020-3` | mantém o rascunho fora de toda consulta pública | `feliz` | Conteúdo em rascunho não aparece em consulta pública alguma |
 * | `UT-020-4` | faz a escrita vencer o valor de fábrica do armazenamento na mesma coluna | `borda` | P1 — publicar é ato explícito: a escrita grava rascunho quando o estado não é informado, enquanto o default do esquema é publicado. Duas regras para a mesma coluna, dependendo de quem escreve |
 *
 * ⚠️ **Isto e diferente do que as suites `ut-*` da feature 001 puderam fazer.**
 * `ut-014-autorizacao-por-capacidade.test.ts` e `ut-003-expiracao-de-sessao.test.ts`
 * abrem declarando que o catalogo **nao existia** na arvore delas e que os casos
 * foram *reconstruidos* por contagem de criterios. Aqui nao ha reconstrucao
 * nenhuma a declarar: o nome de cada `test()` abaixo e o nome do caso no
 * catalogo, com os acentos dele, e cada afirmacao responde a coluna *Prova*.
 * Os tres primeiros casos mapeiam um a um nos tres criterios de US-2 — CA-2.1,
 * CA-2.2 e CA-2.3, na ordem — e o quarto e a regra de negocio, que e
 * **BR-MIGRAR-001** (`P1`).
 *
 * O card tambem registra um achado de QA, e ele explica a ausencia que esta
 * suite tem de propria: *"Card `must` sem teste de erro: os tres criterios
 * descrevem uma invariante de escrita e nao ha entrada invalida nem permissao
 * ausente propria deste card. A recusa por falta de capacidade de publicar esta
 * em REQ-019 (UT-019-1)."* Por isso nenhum dos quatro e do tipo `erro`, e por
 * isso **nao** ha aqui teste de permissao: `wp_insert_post()` nao tem portao, e
 * quem o inventasse nesta suite estaria afirmando comportamento que o legado nao
 * tem.
 *
 * ---
 *
 * # Nao sao os testes de criterio de T005
 *
 * T005 entrega *"o comportamento de US-2 existe e os criterios CA-2.1, CA-2.2,
 * CA-2.3 passam contra o sistema novo"*, e a suite dela e
 * `us-2-gravar-rascunho.test.ts`, com 34 testes organizados **por criterio**.
 * Esta suite e organizada **por caso do catalogo**: sao quatro testes, um por
 * linha da tabela acima, e a contagem de quatro e parte da entrega.
 *
 * As duas se sobrepoem de proposito em parte do que afirmam — e tem de se
 * sobrepor, porque as duas espelham os mesmos tres criterios. O que esta suite
 * acrescenta, e que a de T005 nao tenta, e a **varredura**: UT-020-2 e `borda`,
 * logo ele percorre os cinco caminhos de escrita deste porte cruzados com as
 * tres formas de omissao, mais o primeiro passo **alem** da borda do `empty()`
 * do PHP — os valores que *parecem* vazios e nao sao.
 *
 * ---
 *
 * # O que UT-020-3 pode afirmar aqui, e o que ele nao pode
 *
 * *"Conteudo em rascunho nao aparece em consulta publica alguma"* tem duas
 * metades, e so uma e desta feature. **A consulta publica nao existe nesta
 * arvore**: quem filtra `post_status` e *"o portao de `post_status`"*, que
 * `contextos/leitura-publica/requisicao/atender-leitura-publica.ts` declara, na
 * posicao exata, como **T009 da feature 004** (US-4, BC-08). Importa-lo daqui
 * seria `contextos/<a>` falando com `contextos/<b>`, que a regra de dependencia
 * 3 de `target_architecture.md` proibe *"sempre, sem excecao"*.
 *
 * O que esta suite afirma e a **condicao** do criterio, lida do registro de
 * estados que T001 transcreveu: a linha gravada carrega um estado que o legado
 * registra com `public => false` e `publicly_queryable => false`, e `publish` e
 * o unico dos 12 que tem os dois verdadeiros. Quando o portao existir, e esta a
 * propriedade que ele vai ler. E a mesma forma pela qual T005 afirmou CA-2.3 e
 * pela qual T003 afirmou CA-1.3, e esta declarada aqui para nao ser descoberta
 * depois como lacuna.
 *
 * ---
 *
 * # Como estes quatro se conferem contra o legado
 *
 * Pelos meios que a **Decisao 2** de `parity_specs.md` fixa para esta area —
 * *"esquema e efeito de escrita no banco"*, area 3, tolerancia **zero**, corpus
 * *"snapshot + sequencia de comandos"*. Por isso a porta de dados desta suite
 * **registra comando**: o que se afirma e o valor que foi para a coluna, lido do
 * proprio SQL emitido, e nao o valor que a funcao devolveu.
 *
 * O cenario de paridade correspondente e o primeiro de
 * `.specify/migration/parity_tests/02-publicacao-e-agendamento-de-conteudo.feature`
 * (`PT-002`), *"Publicar e ato explicito, e o default do codigo nao e o default
 * do DDL"*, e ele e exatamente o que UT-020-4 afirma nas duas metades. **Ele nao
 * e executavel hoje:** `parity_specs.md` registra `oracleAvailable: false`, e
 * levantar o oraculo e T001 da feature 015. Ate la cada afirmacao cita arquivo e
 * linha do sistema analisado, legivel em disco em `~/Downloads/wordpress`
 * (WordPress 7.1.2, a mesma versao do pacote).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarRepositorioDeConteudo,
  ddlDeConteudo,
  TIPO_DE_ANEXO,
} from '../armazenamento/index.js';
import {
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import {
  ESTADOS_EDITORIAIS,
  ESTADO_PADRAO_DA_APLICACAO,
  ESTADO_PADRAO_DO_ARMAZENAMENTO,
  PROPRIEDADES_DO_ESTADO_EDITORIAL,
  type EstadoEditorial,
} from '../estado-editorial.js';
import type { LinhaDeResultado } from '../portas/index.js';
import {
  ESTADO_ANTERIOR_DE_CONTEUDO_NOVO,
  ESTADO_HERDADO_DO_ANEXO,
  gravarConteudo,
  type ContextoDeGravacao,
  type PedidoDeGravacao,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const ID_GERADO = 7;
const ID_EXISTENTE = 42;
const ENDERECO = `https://exemplo.test/?p=${ID_GERADO}`;

/** `current_time( 'mysql' )` do cenario — o relogio do site, fixo. */
const AGORA_LOCAL = '2026-10-08 12:00:00';
/** `current_time( 'mysql', true )` — o mesmo instante em UTC. */
const AGORA_UTC = '2026-10-08 15:00:00';

/** As 23 colunas de `posts`, com os defaults do cenario. */
function linhaDeConteudo(
  campos: Partial<Record<string, string | number>> = {},
): LinhaDeResultado {
  return {
    ID: ID_EXISTENTE,
    post_author: 3,
    post_date: '2026-10-01 09:00:00',
    post_date_gmt: '2026-10-01 12:00:00',
    post_content: 'corpo anterior',
    post_title: 'titulo anterior',
    post_excerpt: '',
    post_status: 'publish',
    comment_status: 'open',
    ping_status: 'open',
    post_password: '',
    post_name: 'titulo-anterior',
    to_ping: '',
    pinged: '',
    post_modified: '2026-10-01 09:00:00',
    post_modified_gmt: '2026-10-01 12:00:00',
    post_content_filtered: '',
    post_parent: 0,
    guid: 'https://exemplo.test/?p=42',
    menu_order: 0,
    post_type: 'post',
    post_mime_type: '',
    comment_count: 0,
    ...campos,
  };
}

interface Cenario {
  readonly contexto: ContextoDeGravacao;
  readonly dados: PortaDeDadosFalsa;
}

/**
 * Um contexto de gravacao com os cinco colaboradores de ligacao tardia fixos.
 *
 * **Sem nenhum ponto de extensao registrado**, e isso e escolha: os quatro casos
 * do catalogo falam do que a **omissao do pedido** produz, e o poder de um
 * interceptador mudar a coluna continua existindo — e e contrato publico (P2).
 * Quem o afirma e a suite de T005, no teste *"CA-2.2 quem publica na omissao e
 * um interceptador, e isso e contrato (P2)"*. Registrar ganchos aqui faria estes
 * quatro testes medirem outra coisa.
 */
function cenario(linha: LinhaDeResultado | null = linhaDeConteudo()): Cenario {
  const dados = criarPortaDeDadosFalsa({
    resultadoDeEscrita: { linhasAfetadas: 1, idGerado: ID_GERADO },
  });
  // A atualizacao faz quatro leituras; a insercao, uma. Programar quatro cobre
  // os dois caminhos sem que o cenario precise saber qual deles vai rodar.
  for (let i = 0; i < 4; i += 1) {
    dados.responder(linha === null ? [] : [linha]);
  }

  const contexto: ContextoDeGravacao = {
    ator: { contaId: 3, login: 'autora', existe: true, concessoes: [] },
    armazenamento: { conteudo: criarRepositorioDeConteudo(dados.porta) },
    datas: {
      agoraNoFusoDoSite: () => AGORA_LOCAL,
      agoraEmUtc: () => AGORA_UTC,
      deUtcParaOFusoDoSite: () => '2001-01-01 01:01:01',
      doFusoDoSiteParaUtc: () => '2002-02-02 02:02:02',
    },
    suportaRecurso: () => true,
    estadoPadraoDeComentario: () => 'open',
    enderecoDoConteudo: () => ENDERECO,
  };

  return { contexto, dados };
}

/** O texto de uma escrita com os parametros ao lado, para afirmar bytes. */
function escrita(
  dados: PortaDeDadosFalsa,
  indice: number,
): { texto: string; parametros: string[] } {
  const consulta = dados.escritas[indice];
  assert.ok(consulta !== undefined, `nao houve escrita no indice ${indice}`);
  return {
    texto: consulta.texto,
    parametros: consulta.parametros.map(textoDoParametro),
  };
}

/**
 * O valor que **uma coluna nomeada** recebeu no comando, lido do proprio SQL.
 *
 * E este o *"efeito no banco"* da area 3: o que se afirma nao e o que a funcao
 * devolveu, e sim o que foi parar na coluna — os dois podem divergir, e e por
 * isso que esta suite le os dois lado a lado.
 */
function valorGravado(
  dados: PortaDeDadosFalsa,
  indice: number,
  coluna: string,
): string {
  const { texto, parametros } = escrita(dados, indice);
  const colunas = texto.startsWith('INSERT')
    ? (texto.match(/\(([^)]*)\)/)?.[1] ?? '').split(', ')
    : (texto.match(/SET (.*) WHERE/)?.[1] ?? '')
        .split(', ')
        .map((atribuicao) => atribuicao.replace(' = ?', ''));

  const posicao = colunas.indexOf(coluna);
  assert.ok(posicao >= 0, `a coluna ${coluna} nao esta no comando: ${texto}`);
  return parametros[posicao] ?? '';
}

/* ── UT-020-1 · feliz · CA-2.1 ─────────────────────────────────────────────── */

test('UT-020-1 (CA-2.1) grava rascunho quando o estado não é informado', () => {
  // DADO: um pedido de gravacao que **nao informa o estado**. Tudo o mais e
  // entrada bem-comportada — e o caso `feliz` do catalogo.
  const { contexto, dados } = cenario();
  const pedido: PedidoDeGravacao = {
    titulo: 'um titulo',
    corpo: 'um corpo',
  };

  // QUANDO: o conteudo e gravado pelo caminho de aplicacao.
  const resultado = gravarConteudo(contexto, pedido);

  // ENTAO: *"resulta em rascunho"*. O valor que foi para a coluna, lido do SQL.
  // `$post_status = empty( $postarr['post_status'] ) ? 'draft' : ...`
  // — `wp-includes/post.php:4703`.
  assert.equal(valorGravado(dados, 0, 'post_status'), 'draft');

  // E *"nunca em publicado"*. As duas metades da frase sao afirmacoes
  // diferentes: a primeira fixa o valor, e esta fecha a porta do outro default.
  assert.notEqual(valorGravado(dados, 0, 'post_status'), 'publish');

  // O valor e a constante que T001 declarou, e nao um literal novo nascido nesta
  // suite — P6: *"cada numero vive num ponto de configuracao nomeado, com o
  // valor de fabrica do legado"*.
  assert.equal(ESTADO_PADRAO_DA_APLICACAO, 'draft');
  assert.equal(resultado.colunas?.post_status, ESTADO_PADRAO_DA_APLICACAO);

  // E a gravacao aconteceu de verdade: um INSERT, com o identificador gerado e
  // sem erro. Um caso `feliz` que nao gravasse passaria por acidente.
  assert.equal(resultado.desfecho, 'inserido');
  assert.equal(resultado.conteudoId, ID_GERADO);
  assert.equal(resultado.erro, null);
  assert.equal(resultado.estadoAnterior, ESTADO_ANTERIOR_DE_CONTEUDO_NOVO);
  assert.equal(dados.escritas.length, 1);
  assert.ok(escrita(dados, 0).texto.startsWith('INSERT INTO wp_posts ('));
});

/* ── UT-020-2 · borda · CA-2.2 ─────────────────────────────────────────────── */

test('UT-020-2 (CA-2.2) mantém a omissão sem publicar em todo caminho de escrita', () => {
  // DADO: *"todo caminho de escrita"* deste porte. Sao cinco, e cada um chega a
  // mesma funcao por uma porta diferente — a linha do legado de cada um esta no
  // comentario.
  const caminhos: readonly {
    readonly nome: string;
    readonly pedido: PedidoDeGravacao;
    readonly linha: LinhaDeResultado | null;
    readonly esperado: string;
  }[] = [
    // `! empty( $postarr['ID'] )` e falso: insercao (`:4639`).
    {
      nome: 'insercao',
      pedido: { titulo: 't' },
      linha: linhaDeConteudo(),
      esperado: 'draft',
    },
    // `ID = 0` tambem e ausencia para o `empty()` do legado, logo **insere**.
    {
      nome: 'insercao com ID igual a zero',
      pedido: { id: 0, titulo: 't' },
      linha: linhaDeConteudo(),
      esperado: 'draft',
    },
    // Atualizacao de linha que ja estava em rascunho (`:4643`).
    {
      nome: 'atualizacao de rascunho',
      pedido: { id: ID_EXISTENTE, titulo: 't' },
      linha: linhaDeConteudo({ post_status: 'draft' }),
      esperado: 'draft',
    },
    // ⚠️ Atualizacao de linha **publicada**. `wp_insert_post()` nao conserva o
    // estado da linha: quem conserva e a mistura de `wp_update_post()`
    // (`:5366`), que nao e desta tarefa. A omissao aqui **rebaixa** — e o que
    // importa para este caso e que ela nao publica em nenhuma direcao.
    {
      nome: 'atualizacao de publicado',
      pedido: { id: ID_EXISTENTE, titulo: 't' },
      linha: linhaDeConteudo({ post_status: 'publish' }),
      esperado: 'draft',
    },
    // O anexo, cuja omissao produz `inherit` e nao `draft` (`:4705`,
    // BR-MIGRAR-002). E caminho de escrita, e tambem nao publica.
    {
      nome: 'insercao de anexo',
      pedido: { titulo: 't', tipo: TIPO_DE_ANEXO },
      linha: linhaDeConteudo(),
      esperado: ESTADO_HERDADO_DO_ANEXO,
    },
  ];

  // E as tres formas de **omitir** que o pedido aceita. A chave ausente cai na
  // 1a barreira (o arranjo de defaults, `:4612`); a chave presente e vazia cai
  // na 2a (o `empty()`, `:4703`). A cadeia `'0'` e a borda: o PHP a considera
  // vazia e este runtime a consideraria cheia — ver `verdade-de-php.ts`.
  const omissoes: readonly (string | undefined)[] = [undefined, '', '0'];

  for (const caminho of caminhos) {
    for (const omissao of omissoes) {
      const { contexto, dados } = cenario(caminho.linha);
      const pedido: PedidoDeGravacao =
        omissao === undefined
          ? caminho.pedido
          : { ...caminho.pedido, estado: omissao };

      const resultado = gravarConteudo(contexto, pedido);
      const gravado = valorGravado(dados, 0, 'post_status');
      const onde = `${caminho.nome} / omissao ${JSON.stringify(omissao)}`;

      // *"Nao existe caminho em que a omissao publique"* — a afirmacao do caso,
      // feita em cada uma das quinze combinacoes.
      assert.notEqual(gravado, 'publish', onde);
      assert.notEqual(gravado, ESTADO_PADRAO_DO_ARMAZENAMENTO, onde);
      assert.equal(gravado, caminho.esperado, onde);
      assert.equal(resultado.colunas?.post_status, caminho.esperado, onde);
    }
  }

  // E o **primeiro passo alem da borda**: os valores que parecem vazios e nao
  // sao para o `empty()` do PHP. Eles passam inteiros para a coluna, porque o
  // legado nao valida `post_status` — `varchar(20)` sem `ENUM` e sem `CHECK`
  // (`DB-ENUM`) e `register_post_status()` e ponto de extensao publico (P2).
  // Nenhum deles publica tampouco: o que publica e pedir `publish`.
  for (const quaseVazio of ['00', '0.0', ' ', 'false']) {
    const { contexto, dados } = cenario();
    gravarConteudo(contexto, { titulo: 't', estado: quaseVazio });

    assert.equal(valorGravado(dados, 0, 'post_status'), quaseVazio);
    assert.notEqual(valorGravado(dados, 0, 'post_status'), 'publish');
  }

  // O outro lado da borda, que fecha o teste: quem **pede** publicado publica.
  // Sem esta linha, um porte que gravasse `draft` sempre passaria nas quinze.
  const pedindo = cenario();
  gravarConteudo(pedindo.contexto, { titulo: 't', estado: 'publish' });
  assert.equal(valorGravado(pedindo.dados, 0, 'post_status'), 'publish');
});

/* ── UT-020-3 · feliz · CA-2.3 ─────────────────────────────────────────────── */

test('UT-020-3 (CA-2.3) mantém o rascunho fora de toda consulta pública', () => {
  // DADO: o mesmo conteudo gravado sem estado informado.
  const { contexto, dados } = cenario();

  // QUANDO: ele e gravado.
  const resultado = gravarConteudo(contexto, { titulo: 't' });

  // ENTAO: a linha carrega `draft`.
  assert.equal(valorGravado(dados, 0, 'post_status'), ESTADO_PADRAO_DA_APLICACAO);
  assert.equal(resultado.colunas?.post_status, 'draft');

  // E `draft` esta fora do que uma consulta publica pode devolver. O portao e
  // `post_status`, e a propriedade que ele le e a do registro de estados
  // (`wp-includes/post.php:661` a `:825`): dos 12 de fabrica, **um so** nasce
  // `public => true`, e **um so** fica `publicly_queryable`.
  const publicos = ESTADOS_EDITORIAIS.filter(
    (estado) => PROPRIEDADES_DO_ESTADO_EDITORIAL[estado].publico,
  );
  const consultaveis = ESTADOS_EDITORIAIS.filter(
    (estado) =>
      PROPRIEDADES_DO_ESTADO_EDITORIAL[estado].consultavelPeloPublico,
  );
  assert.ok(!publicos.includes('draft'));
  assert.ok(!consultaveis.includes('draft'));
  // E o conjunto inteiro, para que o teste quebre tambem se `draft` continuar de
  // fora e outro estado entrar: a lista e a afirmacao, nao so a ausencia.
  assert.deepEqual(publicos, ['publish'] satisfies EstadoEditorial[]);
  assert.deepEqual(consultaveis, ['publish'] satisfies EstadoEditorial[]);

  // ⚠️ E a armadilha que um porte "coerente" corrigiria: `draft` tem
  // `exclude_from_search => false`. Ele NAO e excluido da busca pela propriedade
  // — e protegido, nao interno (`:689`), e o default de `exclude_from_search` e
  // o valor de `internal` (`:1511`). Quem o some da consulta publica e o portao
  // de `post_status`, nao esta coluna do registro. Marcar `true` aqui seria mais
  // intuitivo, mudaria o registro que o endpoint REST de status publica e cairia
  // em *Nao negociavel* (P8).
  assert.equal(PROPRIEDADES_DO_ESTADO_EDITORIAL.draft.excluidoDaBusca, false);
  assert.equal(PROPRIEDADES_DO_ESTADO_EDITORIAL.draft.protegido, true);
  assert.equal(PROPRIEDADES_DO_ESTADO_EDITORIAL.draft.interno, false);

  // E nada mais deste caminho reescreve a coluna depois da insercao: *"nenhuma
  // transicao para publicado acontece por efeito colateral"* — o segundo cenario
  // de `02-publicacao-e-agendamento-de-conteudo.feature`.
  assert.equal(dados.escritas.length, 1);
});

/* ── UT-020-4 · borda · a regra de negocio (P1 / BR-MIGRAR-001) ────────────── */

test('UT-020-4 (P1) faz a escrita vencer o valor de fábrica do armazenamento na mesma coluna', () => {
  // A regra, em `target_business_rules.md`: *"**Publicar e ato explicito.**
  // `wp_insert_post()` grava `draft` quando o status nao e informado, enquanto o
  // default do DDL e `publish`: duas regras para a mesma coluna, dependendo de
  // quem escreve."* E a nota de compatibilidade: *"O alvo nao pode unificar os
  // dois defaults."*

  // METADE 1 — quem escreve pela aplicacao. A escrita **vence**: grava `draft`.
  const aplicacao = cenario();
  const resultado = gravarConteudo(aplicacao.contexto, { titulo: 't' });
  assert.equal(valorGravado(aplicacao.dados, 0, 'post_status'), 'draft');
  assert.equal(resultado.colunas?.post_status, ESTADO_PADRAO_DA_APLICACAO);

  // E o motivo de ela vencer, que e o que este caso `borda` existe para fixar:
  // o comando **nomeia a coluna sempre**, logo o default do DDL nunca e
  // consultado por este caminho. Nas duas portas do repositorio.
  assert.ok(
    escrita(aplicacao.dados, 0).texto.startsWith(
      'INSERT INTO wp_posts (post_author, post_date, post_date_gmt, post_content, ' +
        'post_content_filtered, post_title, post_excerpt, post_status, ',
    ),
  );

  const atualizacao = cenario(linhaDeConteudo({ post_status: 'publish' }));
  gravarConteudo(atualizacao.contexto, { id: ID_EXISTENTE, titulo: 't' });
  assert.ok(escrita(atualizacao.dados, 0).texto.includes('post_status = ?'));
  assert.equal(valorGravado(atualizacao.dados, 0, 'post_status'), 'draft');

  // METADE 2 — quem escreve direto na tabela. Para ele o valor de fabrica do
  // armazenamento continua valendo, e continua sendo `publish`
  // (`wp-admin/includes/schema.php:167`). O DDL e o que T002 emite, lido dele e
  // nao reescrito aqui.
  const ddl = ddlDeConteudo(aplicacao.dados.porta, { clausulaDeCharset: '' });
  assert.ok(ddl.includes("post_status varchar(20) NOT NULL default 'publish'"));
  assert.ok(!ddl.includes("post_status varchar(20) NOT NULL default 'draft'"));
  assert.equal(ESTADO_PADRAO_DO_ARMAZENAMENTO, 'publish');

  // A DIVERGENCIA, que e a regra. *"Duas regras para a mesma coluna, dependendo
  // de quem escreve"*: as duas constantes existem, sao diferentes, e cada uma
  // vive no seu ponto nomeado. Unificar as duas apagaria BR-MIGRAR-001 sem que
  // teste nenhum de criterio ficasse vermelho — e e por isso que a afirmacao e
  // sobre as duas ao mesmo tempo, e nao sobre cada uma no seu lugar.
  assert.notEqual(ESTADO_PADRAO_DA_APLICACAO, ESTADO_PADRAO_DO_ARMAZENAMENTO);
  assert.equal(
    new Set([ESTADO_PADRAO_DA_APLICACAO, ESTADO_PADRAO_DO_ARMAZENAMENTO]).size,
    2,
  );

  // E os dois valores sao estados do vocabulario de fabrica, e nao invencao
  // desta suite: estao entre os 12 que `create_initial_post_types()` registra.
  assert.ok(ESTADOS_EDITORIAIS.includes(ESTADO_PADRAO_DA_APLICACAO));
  assert.ok(ESTADOS_EDITORIAIS.includes(ESTADO_PADRAO_DO_ARMAZENAMENTO));
});
