/**
 * A entrega de **T008**: *"6 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-021-1, UT-021-2, UT-021-3, UT-021-4,
 * UT-021-5, UT-021-6), com o mesmo dado de entrada, acao e resultado esperado.
 * Os 2 testes de regra de negocio (UT-021-5, UT-021-6) entram na mesma suite."*
 *
 * ---
 *
 * # Os seis casos foram COPIADOS do catalogo, nao reconstruidos
 *
 * `backlog/tests.md` **existe nesta arvore** (secao *REQ-021 — Exigir
 * identificador unico na URL so a partir da publicacao*, `must` · `pronto` ·
 * veredito `aprovado` · 4 de 4 criterios cobertos), e cada teste daqui carrega o
 * **nome** e a **prova** da linha dele, na ordem do catalogo:
 *
 * | caso | nome no catalogo | tipo | prova no catalogo |
 * |---|---|---|---|
 * | `UT-021-1` | aceita identificadores de URL repetidos em rascunho, pendente e rascunho automatico | `borda` | *"Em rascunho, pendente e rascunho automatico, identificadores de URL repetidos sao aceitos"* (CA-3.1) |
 * | `UT-021-2` | torna o identificador unico na publicacao | `feliz` | *"Na publicacao, o identificador e tornado unico e o conteudo passa a responder nesse endereco"* (CA-3.2) |
 * | `UT-021-3` | informa o autor quando o identificador muda na publicacao | `feliz` | *"O autor e informado quando o identificador muda na publicacao, em lugar de descobrir pelo endereco quebrado"* (CA-3.3) |
 * | `UT-021-4` | deixa vazio o identificador do pendente de quem nao pode publicar | `borda` | *"Em conteudo pendente de quem nao pode publicar, o identificador fica vazio e so e atribuido na publicacao"* (CA-3.4) |
 * | `UT-021-5` | descarta o identificador escolhido por quem nao pode publicar | `erro` | *"P4 — colaborador nao escolhe a URL do que esta em revisao"* |
 * | `UT-021-6` | muda sozinho o identificador do rascunho duplicado no instante da publicacao | `borda` | *"P5 — rascunho pode ter identificador duplicado; publicado, nao. O identificador do rascunho muda sozinho ao publicar"* |
 *
 * ⚠️ **A suite de 001 (`sessao/ut-003-expiracao-de-sessao.test.ts`) declara no
 * cabecalho que reconstruiu os casos dela porque o catalogo nao estava na
 * arvore.** Esta nao reconstruiu nada: o catalogo chegou, e o que esta aqui e
 * copia dele. Onde o catalogo nomeia a regra em vez do criterio — UT-021-5 e
 * UT-021-6 —, a regra citada e a de `target_business_rules.md` (BR-MIGRAR-004 e
 * BR-MIGRAR-005), e e por ela que o teste afirma.
 *
 * ---
 *
 * # Nao sao os testes de criterio de T007
 *
 * T007 entrega *"o comportamento de US-3 existe e os criterios CA-3.1 a CA-3.4
 * passam"* e tem a suite dela em `us-3-identificador-unico.test.ts`, no nivel da
 * **unidade**: `identificadorUnico()`, `identificadorValido()` e
 * `identificadorDeQuemNaoPodePublicar()` chamadas direto, com uma porta que
 * responde por consulta a partir de um conjunto de identificadores ocupados.
 *
 * Esta suite e o catalogo UT-021-*, no nivel do **cenario**: cada caso entra
 * pela operacao que o produto expoe — `gravarConteudo()`, que e
 * `wp_insert_post()` — e sai pela **tabela**. A porta daqui e uma `wp_posts` de
 * verdade, em memoria: `INSERT` grava linha, `UPDATE` altera linha, e as tres
 * consultas de unicidade respondem a partir do que foi gravado. E por isso que
 * ela cobre o que a suite de unidade nao alcanca:
 *
 * - **o duplicado e observavel como duas linhas**, e nao como uma consulta que
 *   nao saiu. BR-MIGRAR-005 e explicita no que isso cobra do alvo — *"um alvo
 *   que declare `UNIQUE` no slug **quebra** o produto: a dispensa e a regra"* —,
 *   e uma porta que responde por conjunto programado nunca poderia recusar a
 *   segunda linha. Esta pode, e nao recusa: e isso que UT-021-1 e UT-021-6
 *   afirmam;
 * - **a mudanca sozinha e uma sequencia de duas gravacoes**, nao uma chamada: o
 *   rascunho e gravado, a linha fica com o identificador duplicado, e e a
 *   gravacao seguinte — a que publica — que o troca. UT-021-6 e esse par.
 *
 * O criterio de paridade da area e o que pede essa forma:
 * `parity_specs.md`, Decisao 2, area 3 — *"esquema e efeito de escrita no banco
 * ... **zero** divergencia ... corpus: snapshot + sequencia de comandos"*. O
 * *snapshot* e {@link identificadoresNaTabela}; a sequencia de comandos e
 * {@link consultasDeUnicidade} e `banco.escritas`.
 *
 * O cenario `@paridade @critico @invariante` de
 * `parity_tests/02-publicacao-e-agendamento-de-conteudo.feature` e UT-021-6 em
 * outras palavras — *"Dado dois rascunhos com o mesmo slug ... Quando um deles e
 * publicado, Entao o slug dele muda sozinho"* —, e o cenario seguinte do mesmo
 * arquivo e UT-021-5: *"Dado um ator sem a capacidade de publicar, Quando ele
 * submete um conteudo para revisao **informando um slug**, Entao as duas metades
 * gravam o campo de slug vazio E nenhuma das duas reserva o slug"*.
 *
 * **T008 depende de T007** (`tasks.md`: *"depende de: T007"*), e por isso esta
 * suite importa `gravarConteudo`, `identificadorMudouNaGravacao` e
 * `identificadorDeAmostra`, que sao de T007: numa arvore sem T007 ela nao
 * compila, que e o que a dependencia declarada significa. Nenhum arquivo fora
 * desta suite e tocado, como o `[P]` de T008 exige — *"tarefa de teste, que toca
 * so a propria suite"*.
 *
 * Cada afirmacao cita arquivo e linha do sistema analisado, legivel em disco em
 * `~/Downloads/wordpress` (WordPress 7.1.2, a mesma versao do pacote). Quando o
 * oraculo executavel existir (resposta 16 de `questions.md`, T001 da feature
 * 015), e por essas linhas que a comparacao caso a caso passa a rodar.
 *
 * ---
 *
 * # ⚠️ O que UT-021-3 afirma, e o que ele NAO prova
 *
 * O catalogo pede que *"o autor e informado quando o identificador muda na
 * publicacao, em lugar de descobrir pelo endereco quebrado"*. **O legado nao tem
 * notificacao nenhuma nesse ponto** — nao ha e-mail, aviso em tela nem campo de
 * retorno dedicado em `wp_insert_post()`. O que ele tem, e e o que T007 portou,
 * sao duas coisas:
 *
 * 1. o par **pedido / gravado** que a gravacao devolve
 *    ({@link identificadorMudouNaGravacao}), que e o que uma superficie precisa
 *    para dizer que o endereco mudou;
 * 2. `get_sample_permalink()` (`wp-admin/includes/post.php:1479`), que **finge
 *    `publish`** para mostrar ao autor, ainda no rascunho, o endereco que a
 *    publicacao vai produzir — `identificadorDeAmostra()`.
 *
 * UT-021-3 afirma esses dois, porque sao o comportamento que existe. **Ele nao
 * prova que o catalogo quis dizer isso**: se o enunciado de CA-3.3 esperava uma
 * notificacao que o legado nao tem, quem decide e o oraculo da resposta 16, e
 * nao quem escreve teste — inventar o aviso seria violar o P1 ("regra que voce
 * melhora e regra que voce quebrou") e o P6 (numero e superficie que o legado
 * nao tem nao se inventam). T007 registrou a mesma leitura em
 * `identificador-de-amostra.ts`; esta suite a repete no nivel do cenario e marca
 * aqui onde ela mudaria.
 *
 * ---
 *
 * # Duas notas de leitura, para o caso nao parecer contradicao
 *
 * **A publicacao destes casos entra por `gravarConteudo()`, nao por
 * `publicar()`.** `wp_publish_post()` — `publicar()`, de T003 — troca
 * `post_status` por `UPDATE` direto e **nao recalcula o identificador**; quem o
 * recalcula e `wp_insert_post()`, que e o caminho do botao de publicar do editor
 * e o que UC-03 descreve no passo 4 (*"Sistema cobra unicidade do identificador
 * na URL ... dispensada em draft e pending, logo o slug muda sozinho ao
 * publicar"*). Por isso o "instante da publicacao" de UT-021-6 e a gravacao com
 * `estado: 'publish'`, e nao uma chamada a `publicar()`.
 *
 * **`auto-draft` e pedido direto em UT-021-1, e isso nao contradiz CA-11.3.**
 * O criterio de US-11 diz que o estado de rascunho automatico *"nao pode ser
 * pedido por quem chama a API"*; a recusa e da **superficie** (T023), nao de
 * `wp_insert_post()`, que aceita o estado de quem o chama. O catalogo nomeia os
 * tres estados no caso, e e com os tres que o caso roda.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarRepositorioDeConteudo,
  lerConteudo,
  TIPO_DE_ANEXO,
} from '../armazenamento/index.js';
import type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ValorDeParametro,
} from '../portas/index.js';
import {
  ESTADOS_QUE_DISPENSAM_IDENTIFICADOR,
  ESTADO_EM_REVISAO,
  gravarConteudo,
  identificadorDeAmostra,
  identificadorMudouNaGravacao,
  PRIMEIRO_SUFIXO_DO_IDENTIFICADOR,
  type ContextoDeGravacao,
  type ContextoDoIdentificadorUnico,
  type DatasDoSite,
  type PedidoDeGravacao,
  type ReescritaNaGravacao,
  type TextoDoIdentificador,
} from './index.js';

/* ── A TABELA ──────────────────────────────────────────────────────────────── */

const PREFIXO_DE_TABELA = 'wp_';
const TABELA = `${PREFIXO_DE_TABELA}posts`;

/**
 * O primeiro identificador que a tabela gera, longe dos semeados a mao.
 *
 * `AUTO_INCREMENT` do legado comeca em 1; o valor aqui e arbitrario de proposito,
 * para que nenhum teste passe por coincidencia entre um id gerado e um semeado.
 */
const PRIMEIRO_ID_GERADO = 101;

/**
 * As cinco consultas que `criarRepositorioDeConteudo()` sabe emitir, com o texto
 * **exato** de `armazenamento/conteudo.ts`.
 *
 * Sao copiadas e nao derivadas: se o repositorio mudar uma delas, esta porta
 * deixa de reconhece-la e os seis casos quebram em voz alta, no `throw` do fim de
 * {@link criarBanco}. O slot `persistencia` do plano manda poder enviar *"a MESMA
 * string que o legado envia"*, e e isso que se perde em silencio quando o teste
 * casa consulta por prefixo.
 */
const CONSULTA_DE_LINHA = `SELECT * FROM ${TABELA} WHERE ID = ? LIMIT 1`;
const CONSULTA_DE_EXISTENCIA = `SELECT ID FROM ${TABELA} WHERE ID = ?`;
const CONSULTA_DE_ANEXO =
  `SELECT post_name FROM ${TABELA} WHERE post_name = ? AND ID != ? LIMIT 1`;
const CONSULTA_HIERARQUICA =
  `SELECT post_name FROM ${TABELA} WHERE post_name = ? ` +
  `AND post_type IN ( ?, '${TIPO_DE_ANEXO}' ) AND ID != ? AND post_parent = ? LIMIT 1`;
const CONSULTA_PLANA =
  `SELECT post_name FROM ${TABELA} WHERE post_name = ? AND post_type = ? ` +
  `AND ID != ? LIMIT 1`;

/** Uma linha de `wp_posts`, coluna a coluna, como o driver a devolveria. */
type Linha = Record<string, ValorDeParametro>;

/** As 23 colunas de `posts`, com os valores de fabrica do cenario. */
const LINHA_PADRAO: Linha = Object.freeze({
  ID: 0,
  post_author: 3,
  post_date: '2026-10-01 09:00:00',
  post_date_gmt: '2026-10-01 12:00:00',
  post_content: 'corpo anterior',
  post_title: 'titulo anterior',
  post_excerpt: '',
  post_status: 'draft',
  comment_status: 'open',
  ping_status: 'open',
  post_password: '',
  post_name: '',
  to_ping: '',
  pinged: '',
  post_modified: '2026-10-01 09:00:00',
  post_modified_gmt: '2026-10-01 12:00:00',
  post_content_filtered: '',
  post_parent: 0,
  guid: '',
  menu_order: 0,
  post_type: 'post',
  post_mime_type: '',
  comment_count: 0,
});

interface Banco {
  readonly porta: PortaDeDados;
  /** A tabela, por identificador. E o *snapshot* do criterio de paridade. */
  readonly linhas: Map<number, Linha>;
  /** Toda leitura, na ordem em que saiu. */
  readonly selecoes: Consulta[];
  /** Toda escrita, na ordem em que saiu. */
  readonly escritas: Consulta[];
}

/**
 * Uma `wp_posts` em memoria, **sem restricao de unicidade no identificador**.
 *
 * A ausencia da restricao e o ponto: BR-MIGRAR-005 diz que *"um alvo que declare
 * `UNIQUE` no slug **quebra** o produto"*, e `esquema.ts` de T002 nao declara
 * nenhuma. Esta tabela aceita duas linhas com o mesmo `post_name` porque a de
 * verdade aceita, e e nessa aceitacao que UT-021-1 e UT-021-6 se apoiam.
 *
 * Consulta que esta porta nao reconhece **estoura**. Responder vazio por omissao
 * e o que faz um teste de borda passar pela razao errada.
 */
function criarBanco(): Banco {
  const linhas = new Map<number, Linha>();
  const selecoes: Consulta[] = [];
  const escritas: Consulta[] = [];
  let proximoId = PRIMEIRO_ID_GERADO;

  const porta: PortaDeDados = {
    prefixoDeTabela: PREFIXO_DE_TABELA,

    selecionar(consulta) {
      selecoes.push(consulta);
      const { parametros, texto } = consulta;

      if (texto === CONSULTA_DE_LINHA) {
        const encontrada = linhas.get(Number(parametros[0]));
        return encontrada === undefined ? [] : [{ ...encontrada }];
      }

      if (texto === CONSULTA_DE_EXISTENCIA) {
        const id = Number(parametros[0]);
        return linhas.has(id) ? [{ ID: id }] : [];
      }

      // `wp_unique_post_slug()`, escopo de anexo: `post_name` em qualquer tipo.
      if (texto === CONSULTA_DE_ANEXO) {
        return ocupacao(
          linhas,
          (linha) =>
            linha['post_name'] === parametros[0] &&
            linha['ID'] !== Number(parametros[1]),
        );
      }

      // Escopo hierarquico: o mesmo pai, e o tipo ou um anexo.
      if (texto === CONSULTA_HIERARQUICA) {
        return ocupacao(
          linhas,
          (linha) =>
            linha['post_name'] === parametros[0] &&
            (linha['post_type'] === parametros[1] ||
              linha['post_type'] === TIPO_DE_ANEXO) &&
            linha['ID'] !== Number(parametros[2]) &&
            linha['post_parent'] === Number(parametros[3]),
        );
      }

      // Escopo plano: o mesmo tipo, qualquer pai. ⚠️ Sem `post_status` na
      // clausula — e por isso que o identificador de um RASCUNHO bloqueia o de
      // um publicado (`:5637`). A dispensa e da escrita, nao da consulta.
      if (texto === CONSULTA_PLANA) {
        return ocupacao(
          linhas,
          (linha) =>
            linha['post_name'] === parametros[0] &&
            linha['post_type'] === parametros[1] &&
            linha['ID'] !== Number(parametros[2]),
        );
      }

      throw new Error(`consulta nao prevista nesta suite: ${texto}`);
    },

    escrever(consulta) {
      escritas.push(consulta);

      const insercao = /^INSERT INTO (\S+) \(([^)]+)\) VALUES/.exec(
        consulta.texto,
      );
      if (insercao !== null) {
        assert.equal(grupo(insercao, 1), TABELA);
        // So as colunas que o comando informou — e `ID` esta entre elas apenas
        // quando o chamador pediu identificador (`import_id`), que e o ramo em
        // que `AUTO_INCREMENT` nao decide.
        const informadas: Linha = {};
        grupo(insercao, 2)
          .split(', ')
          .forEach((coluna, posicao) => {
            informadas[coluna] = parametroEm(consulta, posicao);
          });

        const idPedido = informadas['ID'];
        const id = idPedido === undefined ? proximoId : Number(idPedido);
        if (idPedido === undefined) {
          proximoId += 1;
        }
        linhas.set(id, { ...LINHA_PADRAO, ...informadas, ID: id });
        return { linhasAfetadas: 1, idGerado: id };
      }

      const atualizacao = /^UPDATE (\S+) SET (.+) WHERE ID = \?$/.exec(
        consulta.texto,
      );
      if (atualizacao !== null) {
        assert.equal(grupo(atualizacao, 1), TABELA);
        const atribuicoes = grupo(atualizacao, 2).split(', ');
        const id = Number(parametroEm(consulta, atribuicoes.length));
        const anterior = linhas.get(id);
        if (anterior === undefined) {
          return { linhasAfetadas: 0, idGerado: null };
        }

        const mudada: Linha = { ...anterior };
        atribuicoes.forEach((atribuicao, posicao) => {
          mudada[atribuicao.replace(' = ?', '')] = parametroEm(
            consulta,
            posicao,
          );
        });
        linhas.set(id, mudada);
        return { linhasAfetadas: 1, idGerado: null };
      }

      throw new Error(`comando nao previsto nesta suite: ${consulta.texto}`);
    },
  };

  return { porta, linhas, selecoes, escritas };
}

/** `$wpdb->get_var()` das tres consultas de unicidade: o `post_name` achado. */
function ocupacao(
  linhas: ReadonlyMap<number, Linha>,
  encontra: (linha: Linha) => boolean,
): readonly LinhaDeResultado[] {
  for (const linha of linhas.values()) {
    if (encontra(linha)) {
      return [{ post_name: linha['post_name'] ?? null }];
    }
  }
  return [];
}

function grupo(correspondencia: RegExpExecArray, indice: number): string {
  const valor = correspondencia[indice];
  assert.ok(valor !== undefined, `o comando nao tem o grupo ${indice}`);
  return valor;
}

function parametroEm(consulta: Consulta, posicao: number): ValorDeParametro {
  const valor = consulta.parametros[posicao];
  assert.ok(valor !== undefined, `o comando nao tem o parametro ${posicao}`);
  return valor;
}

/** Semeia uma linha pronta, sem passar pela gravacao. */
function semear(banco: Banco, campos: Linha & { readonly ID: number }): number {
  banco.linhas.set(campos.ID, { ...LINHA_PADRAO, ...campos });
  return campos.ID;
}

/* ── AS AFIRMACOES SOBRE A TABELA ──────────────────────────────────────────── */

/** As consultas de unicidade que sairam, na ordem. */
function consultasDeUnicidade(banco: Banco): readonly Consulta[] {
  return banco.selecoes.filter((consulta) =>
    consulta.texto.startsWith('SELECT post_name'),
  );
}

function linhaGravada(banco: Banco, id: number): Linha {
  const linha = banco.linhas.get(id);
  assert.ok(linha !== undefined, `a tabela nao tem a linha ${id}`);
  return linha;
}

/** O `post_name` gravado — o que o criterio de paridade compara. */
function identificadorGravado(banco: Banco, id: number): string {
  return String(linhaGravada(banco, id)['post_name'] ?? '');
}

/** O *snapshot* do identificador de toda linha, na ordem do identificador. */
function identificadoresNaTabela(banco: Banco): readonly string[] {
  return [...banco.linhas.keys()]
    .sort((um, outro) => um - outro)
    .map((id) => identificadorGravado(banco, id));
}

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const ENDERECO_DO_SITE = 'https://exemplo.test';
const ID_DA_AUTORA = 3;
const TIPO_DE_PAGINA = 'page';

/** A capacidade primitiva de publicar o tipo `post`, no nome do legado. */
const PUBLICAR_POST = 'publish_posts';

/** O titulo que todos os casos usam, e o identificador que ele deriva. */
const TITULO = 'Duas receitas';
const CORPO = 'o corpo do texto';
const IDENTIFICADOR_DO_TITULO = 'duas-receitas';
const IDENTIFICADOR_ALTERNATIVO = 'duas-receitas-2';

/** O identificador que o colaborador de UT-021-5 escolhe, e nao fica com. */
const IDENTIFICADOR_ESCOLHIDO = 'endereco-que-eu-escolhi';

/** A linha que ja ocupa o endereco disputado, publicada. */
const ID_DO_PUBLICADO = 42;

/** A linha em revisao que UT-021-5 atualiza. */
const ID_EM_REVISAO = 43;

/**
 * `sanitize_title()` reduzida ao determinismo que esta suite precisa: caixa
 * baixa, espaco e sublinhado virando hifen, e o resto do que nao e letra, digito
 * ou hifen caindo fora.
 *
 * ⚠️ **Nao e a funcao do legado**, e nao tenta ser: a de verdade tem 80 linhas,
 * preserva octeto escapado e apaga 30 sequencias percent-codificadas, e ela e de
 * `plataforma/formatacao/`, feature 015. Os titulos dos casos sao ASCII justo
 * para que nenhuma afirmacao daqui dependa dela — o que esta suite afirma e o
 * identificador **gravado**, nao o texto que a sanitizacao produz.
 */
const TEXTO: TextoDoIdentificador = {
  sanitizarTitulo(titulo, reserva) {
    const sanitizado = titulo
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    return sanitizado === '' ? reserva : sanitizado;
  },
  codificarEmUtf8NaUrl(valor, tamanho) {
    return valor.slice(0, tamanho);
  },
};

/** `$wp_rewrite` e `permalink_structure` com os valores de fabrica do legado. */
const REESCRITA: ReescritaNaGravacao = {
  feeds: () => ['feed', 'rdf', 'rss', 'rss2', 'atom'],
  baseDePaginacao: () => 'page',
  estruturaDeLinks: () => '',
};

/** O relogio do site, parado: nenhum caso daqui afirma data. */
const DATAS: DatasDoSite = {
  agoraNoFusoDoSite: () => '2026-10-08 12:00:00',
  agoraEmUtc: () => '2026-10-08 15:00:00',
  deUtcParaOFusoDoSite: () => '2026-10-08 12:00:00',
  doFusoDoSiteParaUtc: () => '2026-10-08 15:00:00',
};

/**
 * A base de autorizacao com a matriz **vazia**.
 *
 * Matriz vazia e um estado do legado, e nao atalho de teste: o papel e dado
 * gravado (ADR-0001), e quem decide aqui e a concessao individual do ator — o
 * `allcaps` por cima do papel (`PERM-1`). Nenhuma decisao desta suite olha nome
 * de papel, como o P3 da constituicao cobra.
 */
const BASE_SEM_PAPEL: BaseDeAutorizacao = {
  matriz: [],
  rede: REDE_INATIVA_NA_AUTORIZACAO,
};

function ator(podePublicar: boolean): AtorDeAutorizacao {
  return {
    contaId: ID_DA_AUTORA,
    login: 'autora',
    existe: true,
    concessoes: podePublicar
      ? [{ capacidade: PUBLICAR_POST, concedida: true }]
      : [],
  };
}

interface OpcoesDaGravacao {
  /** `current_user_can( 'publish_posts' )` — a capacidade que decide o P4. */
  readonly podePublicar: boolean;
}

/** O contexto de `wp_insert_post()`, com os colaboradores de T005 e de T007. */
function contextoDeGravacao(
  banco: Banco,
  opcoes: OpcoesDaGravacao,
): ContextoDeGravacao {
  return {
    ator: ator(opcoes.podePublicar),
    base: BASE_SEM_PAPEL,
    armazenamento: { conteudo: criarRepositorioDeConteudo(banco.porta) },
    texto: TEXTO,
    reescrita: REESCRITA,
    // `get_post_type_object()`: o mapa `$post_type->cap` do tipo, e e dele que
    // sai `publish_pages` para pagina sem um unico `if` sobre o nome `page`.
    tipoDeConteudo: (nome) => ({
      nome,
      traduzMetaCapacidade: true,
      capacidades: {
        publish_posts:
          nome === TIPO_DE_PAGINA ? 'publish_pages' : PUBLICAR_POST,
      },
    }),
    tipoEHierarquico: (tipo) => tipo === TIPO_DE_PAGINA,
    datas: DATAS,
    suportaRecurso: () => true,
    estadoPadraoDeComentario: () => 'open',
    enderecoDoConteudo: (id) => `${ENDERECO_DO_SITE}/?p=${id}`,
  };
}

/** O contexto de `wp_unique_post_slug()`, para o lado de amostra de UT-021-3. */
function contextoDoIdentificador(banco: Banco): ContextoDoIdentificadorUnico {
  return {
    texto: TEXTO,
    repositorio: criarRepositorioDeConteudo(banco.porta),
    reescrita: REESCRITA,
    tipoEHierarquico: (tipo) => tipo === TIPO_DE_PAGINA,
  };
}

/** O pedido do editor: titulo e corpo vao em toda gravacao, como o formulario faz. */
function pedidoDoEditor(campos: PedidoDeGravacao = {}): PedidoDeGravacao {
  return { titulo: TITULO, corpo: CORPO, ...campos };
}

/* ── UT-021-1 ──────────────────────────────────────────────────────────────── */

test('UT-021-1 aceita identificadores de URL repetidos em rascunho, pendente e rascunho automatico (CA-3.1)', () => {
  // Os tres estados vem do nome do caso, nao da constante do codigo — e a
  // igualdade entre as duas listas e afirmada depois, para que um porte que
  // mexesse na constante nao levasse o caso com ele.
  const estadosDoCaso = ['draft', 'pending', 'auto-draft'];

  for (const estado of estadosDoCaso) {
    const banco = criarBanco();
    // Dado: o endereco ja esta ocupado por um conteudo publicado.
    semear(banco, {
      ID: ID_DO_PUBLICADO,
      post_status: 'publish',
      post_name: IDENTIFICADOR_DO_TITULO,
    });

    // Quando: o autor grava, no estado do caso, informando o MESMO identificador.
    // O ator pode publicar de proposito: em `pending`, quem nao pode teria o
    // campo esvaziado pelo P4 (`:4731`), e esse e o caso UT-021-5.
    const resultado = gravarConteudo(
      contextoDeGravacao(banco, { podePublicar: true }),
      pedidoDoEditor({ estado, identificadorNaUrl: IDENTIFICADOR_DO_TITULO }),
    );

    // Entao: o identificador repetido e aceito, como veio.
    assert.equal(resultado.desfecho, 'inserido');
    assert.equal(
      identificadorGravado(banco, resultado.conteudoId),
      IDENTIFICADOR_DO_TITULO,
      `o estado ${estado} nao aceitou o identificador repetido`,
    );

    // E a tabela fica com DUAS linhas no mesmo endereco: a dispensa e visivel no
    // *snapshot*, e nenhuma restricao de unicidade a impede (BR-MIGRAR-005).
    assert.deepEqual(identificadoresNaTabela(banco), [
      IDENTIFICADOR_DO_TITULO,
      IDENTIFICADOR_DO_TITULO,
    ]);

    // E a unicidade nao foi nem perguntada: `:5560`-`:5565` devolve antes da
    // primeira consulta. A dispensa e observavel tambem na sequencia de comandos.
    assert.equal(consultasDeUnicidade(banco).length, 0);
  }

  // A lista do caso e a do legado: `in_array( $post_status, array( 'draft',
  // 'pending', 'auto-draft' ), true )`, a mesma em `:4746`, `:5047` e `:5561`.
  assert.deepEqual([...ESTADOS_QUE_DISPENSAM_IDENTIFICADOR], estadosDoCaso);
});

/* ── UT-021-2 ──────────────────────────────────────────────────────────────── */

test('UT-021-2 torna o identificador unico na publicacao, e o conteudo responde nesse endereco (CA-3.2)', () => {
  const banco = criarBanco();
  // Dado: o endereco ja esta ocupado por um conteudo publicado.
  semear(banco, {
    ID: ID_DO_PUBLICADO,
    post_status: 'publish',
    post_name: IDENTIFICADOR_DO_TITULO,
  });

  // Quando: o autor grava publicado, informando o identificador ocupado.
  const resultado = gravarConteudo(
    contextoDeGravacao(banco, { podePublicar: true }),
    pedidoDoEditor({
      estado: 'publish',
      identificadorNaUrl: IDENTIFICADOR_DO_TITULO,
    }),
  );

  // Entao: o identificador foi tornado unico, com o sufixo numerado do legado.
  assert.equal(resultado.desfecho, 'inserido');
  assert.equal(
    identificadorGravado(banco, resultado.conteudoId),
    IDENTIFICADOR_ALTERNATIVO,
  );
  // `:5663` — `$suffix = 2`, e nao 1: o primeiro alternativo e sempre `-2`.
  assert.equal(PRIMEIRO_SUFIXO_DO_IDENTIFICADOR, 2);

  // E a cobranca saiu como DUAS consultas no escopo plano, com o texto e os
  // parametros do legado: a primeira acha o ocupado, a segunda acha livre o `-2`.
  // O identificador do conteudo e `0` nas duas porque a linha ainda nao existe.
  const consultas = consultasDeUnicidade(banco);
  assert.equal(consultas.length, 2);
  assert.equal(consultas[0]?.texto, CONSULTA_PLANA);
  assert.deepEqual(consultas[0]?.parametros, [
    IDENTIFICADOR_DO_TITULO,
    'post',
    0,
  ]);
  assert.deepEqual(consultas[1]?.parametros, [
    IDENTIFICADOR_ALTERNATIVO,
    'post',
    0,
  ]);

  // E o conteudo passa a responder nesse endereco: o `guid` gravado e o endereco
  // do conteudo novo, e a linha guarda o identificador unico.
  assert.equal(
    resultado.enderecoGravadoNoGuid,
    `${ENDERECO_DO_SITE}/?p=${resultado.conteudoId}`,
  );
  assert.equal(
    linhaGravada(banco, resultado.conteudoId)['guid'],
    `${ENDERECO_DO_SITE}/?p=${resultado.conteudoId}`,
  );
  assert.equal(resultado.identificadorNaUrl, IDENTIFICADOR_ALTERNATIVO);

  // E o publicado que ja estava ali nao foi tocado: quem cede e quem chega.
  assert.equal(
    identificadorGravado(banco, ID_DO_PUBLICADO),
    IDENTIFICADOR_DO_TITULO,
  );
  assert.deepEqual(identificadoresNaTabela(banco), [
    IDENTIFICADOR_DO_TITULO,
    IDENTIFICADOR_ALTERNATIVO,
  ]);
});

/* ── UT-021-3 ──────────────────────────────────────────────────────────────── */

test('UT-021-3 informa o autor quando o identificador muda na publicacao (CA-3.3)', () => {
  const comColisao = criarBanco();
  semear(comColisao, {
    ID: ID_DO_PUBLICADO,
    post_status: 'publish',
    post_name: IDENTIFICADOR_DO_TITULO,
  });

  // Quando o identificador muda, a gravacao devolve o PAR pedido/gravado, que e
  // o que a superficie precisa para dizer ao autor que o endereco mudou.
  const mudou = gravarConteudo(
    contextoDeGravacao(comColisao, { podePublicar: true }),
    pedidoDoEditor({
      estado: 'publish',
      identificadorNaUrl: IDENTIFICADOR_DO_TITULO,
    }),
  );

  assert.equal(mudou.identificadorPedido, IDENTIFICADOR_DO_TITULO);
  assert.equal(mudou.identificadorNaUrl, IDENTIFICADOR_ALTERNATIVO);
  assert.equal(identificadorMudouNaGravacao(mudou), true);

  // E quando nada colide, o par e igual: nao ha o que informar, e a superficie
  // nao avisa o que nao mudou.
  const semColisao = criarBanco();
  const manteve = gravarConteudo(
    contextoDeGravacao(semColisao, { podePublicar: true }),
    pedidoDoEditor({
      estado: 'publish',
      identificadorNaUrl: IDENTIFICADOR_DO_TITULO,
    }),
  );

  assert.equal(manteve.identificadorPedido, IDENTIFICADOR_DO_TITULO);
  assert.equal(manteve.identificadorNaUrl, IDENTIFICADOR_DO_TITULO);
  assert.equal(identificadorMudouNaGravacao(manteve), false);

  // E, ANTES de publicar, o endereco que a publicacao vai produzir ja e mostravel
  // ao autor: `get_sample_permalink()` finge `publish` e cobra a unicidade que o
  // rascunho dispensa (`wp-admin/includes/post.php:1493`-`:1497`). E assim que o
  // legado evita que o autor descubra pelo endereco quebrado.
  const rascunho = criarBanco();
  semear(rascunho, {
    ID: ID_DO_PUBLICADO,
    post_status: 'publish',
    post_name: IDENTIFICADOR_DO_TITULO,
  });
  const gravado = gravarConteudo(
    contextoDeGravacao(rascunho, { podePublicar: true }),
    pedidoDoEditor({
      estado: 'draft',
      identificadorNaUrl: IDENTIFICADOR_DO_TITULO,
    }),
  );

  const amostra = identificadorDeAmostra(contextoDoIdentificador(rascunho), {
    conteudo: lerConteudo(linhaGravada(rascunho, gravado.conteudoId)),
  });

  assert.equal(amostra, IDENTIFICADOR_ALTERNATIVO);
  // E a amostra nao grava nada: a linha do rascunho continua com o duplicado.
  assert.equal(
    identificadorGravado(rascunho, gravado.conteudoId),
    IDENTIFICADOR_DO_TITULO,
  );
});

/* ── UT-021-4 ──────────────────────────────────────────────────────────────── */

test('UT-021-4 deixa vazio o identificador do pendente de quem nao pode publicar, e o atribui na publicacao (CA-3.4)', () => {
  const banco = criarBanco();

  // Quando: o colaborador envia o conteudo para revisao, sem escolher endereco.
  const revisao = gravarConteudo(
    contextoDeGravacao(banco, { podePublicar: false }),
    pedidoDoEditor({ estado: ESTADO_EM_REVISAO }),
  );

  // Entao: o identificador fica VAZIO. Em `pending` o titulo nao deriva
  // identificador nenhum (`:4745`-`:4750`), e nenhum endereco e reservado.
  assert.equal(revisao.desfecho, 'inserido');
  assert.equal(identificadorGravado(banco, revisao.conteudoId), '');
  assert.deepEqual(identificadoresNaTabela(banco), ['']);
  assert.equal(consultasDeUnicidade(banco).length, 0);

  // Quando: quem pode publicar grava o mesmo conteudo como publicado.
  const publicacao = gravarConteudo(
    contextoDeGravacao(banco, { podePublicar: true }),
    pedidoDoEditor({ id: revisao.conteudoId, estado: 'publish' }),
  );

  // Entao: o identificador e atribuido ali, derivado do titulo, e so ali.
  assert.equal(publicacao.desfecho, 'atualizado');
  assert.equal(
    identificadorGravado(banco, revisao.conteudoId),
    IDENTIFICADOR_DO_TITULO,
  );

  // E a unicidade foi cobrada nesse instante, sobre a linha que ja existe.
  const consultas = consultasDeUnicidade(banco);
  assert.equal(consultas.length, 1);
  assert.equal(consultas[0]?.texto, CONSULTA_PLANA);
  assert.deepEqual(consultas[0]?.parametros, [
    IDENTIFICADOR_DO_TITULO,
    'post',
    revisao.conteudoId,
  ]);
});

/* ── UT-021-5 — regra de negocio (P4 / BR-MIGRAR-004) ──────────────────────── */

test('UT-021-5 descarta o identificador escolhido por quem nao pode publicar (P4)', () => {
  // ── Conteudo novo: a capacidade PRIMITIVA (`:4733`).
  const semPoder = criarBanco();
  const descartado = gravarConteudo(
    contextoDeGravacao(semPoder, { podePublicar: false }),
    pedidoDoEditor({
      estado: ESTADO_EM_REVISAO,
      identificadorNaUrl: IDENTIFICADOR_ESCOLHIDO,
    }),
  );

  // O identificador escolhido e descartado: o campo gravado e vazio.
  assert.equal(descartado.desfecho, 'inserido');
  assert.equal(identificadorGravado(semPoder, descartado.conteudoId), '');
  assert.equal(descartado.identificadorPedido, IDENTIFICADOR_ESCOLHIDO);
  assert.equal(descartado.identificadorNaUrl, '');

  // E nada reserva o endereco: ele nao esta na tabela, e nem foi perguntado.
  assert.equal(
    identificadoresNaTabela(semPoder).includes(IDENTIFICADOR_ESCOLHIDO),
    false,
  );
  assert.equal(consultasDeUnicidade(semPoder).length, 0);

  // ── O controle: quem PODE publicar, no mesmo estado e com o mesmo pedido,
  // mantem o identificador escolhido. O que separa os dois e a capacidade, e nao
  // o estado — e o fluxo alternativo de UC-06 (*"Sistema grava pendente e
  // mantem o identificador de URL"*), que e CA-7.5 de US-7.
  const comPoder = criarBanco();
  const mantido = gravarConteudo(
    contextoDeGravacao(comPoder, { podePublicar: true }),
    pedidoDoEditor({
      estado: ESTADO_EM_REVISAO,
      identificadorNaUrl: IDENTIFICADOR_ESCOLHIDO,
    }),
  );

  assert.equal(
    identificadorGravado(comPoder, mantido.conteudoId),
    IDENTIFICADOR_ESCOLHIDO,
  );

  // ── Atualizacao: a pergunta e a META capacidade, sobre o conteudo (`:4736`).
  // Sao dois ramos no legado — *"For new posts check the primitive capability,
  // for updates check the meta capability"* —, e os dois descartam.
  const atualizacao = criarBanco();
  semear(atualizacao, {
    ID: ID_EM_REVISAO,
    post_status: ESTADO_EM_REVISAO,
    post_name: '',
  });
  const descartadoNaAtualizacao = gravarConteudo(
    contextoDeGravacao(atualizacao, { podePublicar: false }),
    pedidoDoEditor({
      id: ID_EM_REVISAO,
      estado: ESTADO_EM_REVISAO,
      identificadorNaUrl: IDENTIFICADOR_ESCOLHIDO,
    }),
  );

  assert.equal(descartadoNaAtualizacao.desfecho, 'atualizado');
  assert.equal(identificadorGravado(atualizacao, ID_EM_REVISAO), '');
  assert.equal(consultasDeUnicidade(atualizacao).length, 0);

  // E o mesmo ramo, com a capacidade, mantem o escolhido.
  const mantidoNaAtualizacao = criarBanco();
  semear(mantidoNaAtualizacao, {
    ID: ID_EM_REVISAO,
    post_status: ESTADO_EM_REVISAO,
    post_name: '',
  });
  gravarConteudo(
    contextoDeGravacao(mantidoNaAtualizacao, { podePublicar: true }),
    pedidoDoEditor({
      id: ID_EM_REVISAO,
      estado: ESTADO_EM_REVISAO,
      identificadorNaUrl: IDENTIFICADOR_ESCOLHIDO,
    }),
  );

  assert.equal(
    identificadorGravado(mantidoNaAtualizacao, ID_EM_REVISAO),
    IDENTIFICADOR_ESCOLHIDO,
  );
});

/* ── UT-021-6 — regra de negocio (P5 / BR-MIGRAR-005) ──────────────────────── */

test('UT-021-6 muda sozinho o identificador do rascunho duplicado no instante da publicacao (P5)', () => {
  const banco = criarBanco();
  const contexto = contextoDeGravacao(banco, { podePublicar: true });

  // Dado: dois rascunhos com o mesmo identificador.
  const primeiro = gravarConteudo(
    contexto,
    pedidoDoEditor({
      estado: 'draft',
      identificadorNaUrl: IDENTIFICADOR_DO_TITULO,
    }),
  );
  const segundo = gravarConteudo(
    contexto,
    pedidoDoEditor({
      estado: 'draft',
      identificadorNaUrl: IDENTIFICADOR_DO_TITULO,
    }),
  );

  // Entao: os dois ficam com o MESMO identificador, e a tabela os aceita.
  assert.notEqual(primeiro.conteudoId, segundo.conteudoId);
  assert.deepEqual(identificadoresNaTabela(banco), [
    IDENTIFICADOR_DO_TITULO,
    IDENTIFICADOR_DO_TITULO,
  ]);
  assert.equal(consultasDeUnicidade(banco).length, 0);

  // Quando: um deles e publicado, sem que ninguem peca identificador nenhum.
  const publicacao = gravarConteudo(
    contexto,
    pedidoDoEditor({ id: segundo.conteudoId, estado: 'publish' }),
  );

  // Entao: o identificador muda SOZINHO. O pedido continua sendo o que a linha
  // tinha, e o gravado e outro — e essa diferenca e o efeito observavel que
  // BR-MIGRAR-005 declara.
  assert.equal(publicacao.desfecho, 'atualizado');
  assert.equal(publicacao.identificadorPedido, IDENTIFICADOR_DO_TITULO);
  assert.equal(identificadorMudouNaGravacao(publicacao), true);
  assert.equal(
    identificadorGravado(banco, segundo.conteudoId),
    IDENTIFICADOR_ALTERNATIVO,
  );

  // E o rascunho que ficou nao foi tocado: quem muda e quem publica.
  assert.equal(
    identificadorGravado(banco, primeiro.conteudoId),
    IDENTIFICADOR_DO_TITULO,
  );
  assert.deepEqual(identificadoresNaTabela(banco), [
    IDENTIFICADOR_DO_TITULO,
    IDENTIFICADOR_ALTERNATIVO,
  ]);
});
