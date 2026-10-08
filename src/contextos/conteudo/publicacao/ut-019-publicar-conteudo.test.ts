/**
 * A entrega de **T004**: *"8 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-019-1, UT-019-2, UT-019-3, UT-019-4,
 * UT-019-5, UT-019-6, UT-019-7, UT-019-8), com o mesmo dado de entrada, acao e
 * resultado esperado. Os 3 testes de regra de negocio (UT-019-6, UT-019-7,
 * UT-019-8) entram na mesma suite."*
 *
 * ✅ **O catalogo EXISTE nesta arvore, e os oito casos foram COPIADOS dele, nao
 * reconstruidos.** O caminho que `tasks.md` cita resolve para `backlog/tests.md`
 * na raiz do repositorio, e a tabela de `REQ-019` — *"`must` · `pronto` ·
 * veredito `aprovado` · 5 de 5 critérios de aceite cobertos"* — da os oito casos
 * com nome, tipo e prova. Mesmo precedente de T022 em
 * `../../identidade-e-acesso/senha-de-aplicacao/ut-011-credencial-de-aplicacao.test.ts`,
 * e o oposto de T008, T016 e T020, que acharam o arquivo ausente e reconstruiram
 * os casos.
 *
 * | caso | tipo | nome no catalogo | prova que o catalogo cita |
 * |---|---|---|---|
 * | `UT-019-1` | `erro` | recusa a publicação de quem não tem a capacidade de publicar aquele tipo | CA-1.1 |
 * | `UT-019-2` | `feliz` | grava o estado publicado disparando a transição uma única vez | CA-1.2 |
 * | `UT-019-3` | `feliz` | passa a devolver o conteúdo na consulta pública com endereço definitivo | CA-1.3 |
 * | `UT-019-4` | `feliz` | atribui termo em toda taxonomia que declare um padrão ao fim da publicação | CA-1.4 |
 * | `UT-019-5` | `feliz` | remove o evento de publicação agendada pendente do conteúdo publicado | CA-1.5 |
 * | `UT-019-6` | `feliz` | grava o estado publicado somente pelo comando de publicar | `P1` (BR-MIGRAR-001) |
 * | `UT-019-7` | `borda` | deixa o conteúdo do tipo padrão sempre com categoria ao fim da publicação | `P3` (BR-MIGRAR-003) |
 * | `UT-019-8` | `borda` | não dispara a transição uma segunda vez ao republicar o já publicado | `P7` (BR-MIGRAR-007) |
 *
 * **O que o catalogo NAO da, e de onde veio:** ele registra o nome, o tipo e a
 * prova de cada caso, e nao o dado de entrada literal — nenhum dos 985 casos o
 * registra, porque *"nenhum deles cita arquivo, classe ou framework: a stack do
 * sistema novo ainda nao foi escolhida"*. O dado de entrada de cada teste daqui
 * sai do fluxo principal de **UC-03** (o autor, no proprio conteudo do tipo
 * padrao, salvo pedindo publicacao), dos critérios de `spec.md` e das tres
 * regras que US-1 declara. Nenhuma assercao inventa comportamento: cada uma
 * afirma a frase da coluna *Prova*, e cita **arquivo e linha** do sistema
 * analisado, legivel em disco em `~/Downloads/wordpress` (WordPress 7.1.2, a
 * mesma versao do pacote). `parity_specs.md` registra que **nao ha oraculo
 * executavel nesta arvore** — levanta-lo e T001 da feature 015 —, e e por essas
 * linhas que a comparacao caso a caso passa a rodar quando ele existir.
 *
 * ---
 *
 * # Nao e a suite de T003
 *
 * `./us-1-publicar-conteudo.test.ts` e a suite da **entrega** de T003: ela afirma
 * os cinco critérios pelos meios da area 3 da Decisao 2 — *"snapshot + sequencia
 * de comandos"* —, com uma porta de dados que **registra comando** e nao aplica
 * escrita, porque e a unica forma de afirmar o caso em que o legado nao emite
 * comando nenhum. O cabecalho dela ja declara a fronteira: *"Nao sao os oito
 * testes de `backlog/tests.md` — UT-019-1 a UT-019-8 sao T004"*.
 *
 * Esta suite e a do **catalogo**, e roda sobre um `{site}posts` **em memoria que
 * aplica as escritas** ({@link bancoDeConteudo}): quatro dos oito casos falam do
 * que fica no banco **ao fim da publicacao** — *"passa a devolver o conteudo na
 * consulta publica"*, *"ao fim da publicacao"* (duas vezes), *"ao republicar o ja
 * publicado"* —, e isso e pos-condicao, nao sequencia de comandos. Com a linha
 * mudando de verdade, republicar e **reler o que a primeira publicacao gravou**,
 * em lugar de reprogramar um duble para responder `publish`. As duas suites
 * afirmam as mesmas regras por caminhos diferentes de proposito: se so a
 * sequencia de comandos estiver certa e o efeito acumulado estiver errado, esta
 * e a que abre.
 *
 * **T004 depende de T003** (`tasks.md`: *"depende de: T003"*) e por isso importa
 * `./index.js`, que e de T003: numa arvore sem T003 esta suite nao compila, que e
 * o que a dependencia declarada significa. Nenhum arquivo fora desta suite e
 * tocado, como o `[P]` de T004 exige — *"tarefa de teste, que toca so a propria
 * suite"*.
 *
 * ---
 *
 * # Quatro coisas declaradas, e nenhuma delas e decidida aqui
 *
 * 1. **🔴 CA-1.1 diz *"recusa explicita na tela"*, e o painel do legado NAO
 *    recusa: ele rebaixa o estado pedido para `pending`**
 *    (`wp-admin/includes/post.php:150`-`:158`, com o comentario do proprio
 *    legado: *"Change status from 'publish' to 'pending' if user lacks
 *    permissions to publish"*). A divergencia foi registrada por T003 em
 *    `./permissao-de-publicacao.ts` e **nao foi resolvida por ninguem**; o **P1**
 *    exige *"uma decisao humana registrada"* para divergir e nenhuma existe.
 *    `UT-019-1` afirma a metade que o legado tem com codigo e texto — a da API,
 *    que e a superficie que o criterio nomeia com numero — e **nao** afirma
 *    recusa de tela nenhuma. O rebaixamento e o estado `pending` de **US-7**, e
 *    chega em T015 pelo caminho de gravacao.
 * 2. **A consulta publica de `UT-019-3` nao existe nesta arvore.** Ela e BC-08
 *    (feature 004), e a regra de dependencia 3 de `target_architecture.md`
 *    proibe `contextos/<a>/` importar `contextos/<b>/` *"sempre, sem excecao"*.
 *    Por isso {@link BancoDeConteudo.consultaPublica} e **duble desta suite**, na
 *    forma da clausula que `WP_Query` monta para o visitante anonimo
 *    (`wp-includes/class-wp-query.php:2739`-`:2744`: um `OR` por estado de
 *    `get_post_stati( array( 'public' => true ) )`), com os estados vindos do
 *    vocabulario de T001 em lugar de cravados. Ela nao acrescenta superficie
 *    nenhuma ao sistema, e quando BC-08 existir o teste da consulta e dele.
 * 3. **`UT-019-6` tem uma metade fora desta arvore.** `P1` fala de duas regras
 *    para a mesma coluna, e a outra e *"`wp_insert_post()` grava `draft` quando o
 *    status nao e informado"* (`wp-includes/post.php:4703`) — caminho de
 *    **gravacao**, que e **T005** (US-2) e nao existe aqui. O caso afirma o que e
 *    observavel deste lado, que e exatamente a frase do catalogo (*"somente pelo
 *    comando de publicar"*) e o cenario `@invariante` de `PT-002`: *"Nenhuma
 *    transicao para publicado acontece por efeito colateral"*. Os dois defaults
 *    divergentes ficam afirmados onde T001 e T002 os declararam, sem serem
 *    unificados — BR-MIGRAR-001 e literal: o alvo *"nao pode unificar os dois
 *    defaults"*.
 * 4. **`UT-019-8` afirma a ausencia da segunda transicao, e so ela.** Os critérios
 *    de US-5 — CA-5.1 (*"retorna sucesso sem alterar o registro"*), CA-5.2 e
 *    CA-5.3 — sao de **T011 e T012**, e a guarda que os produz esta em
 *    `./publicar.ts` porque e a terceira linha de `wp_publish_post()`
 *    (`wp-includes/post.php:5412`).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type MatrizDePapeis,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarRepositorioDeConteudo,
  DATA_SENTINELA,
  ddlDeConteudo,
} from '../armazenamento/index.js';
import {
  ESTADOS_EDITORIAIS,
  ESTADO_PADRAO_DA_APLICACAO,
  ESTADO_PADRAO_DO_ARMAZENAMENTO,
  PROPRIEDADES_DO_ESTADO_EDITORIAL,
  type EstadoEditorial,
} from '../estado-editorial.js';
import type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ValorDeColuna,
  ValorDeParametro,
} from '../portas/index.js';
import {
  CODIGO_DE_RECUSA_DE_PUBLICACAO,
  ESTADO_PUBLICADO,
  GANCHO_DE_PUBLICACAO_AGENDADA,
  MENSAGEM_DE_RECUSA_DE_PUBLICACAO,
  OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
  PREFIXO_DA_OPCAO_DE_TERMO_PADRAO,
  TAXONOMIA_DE_CATEGORIA,
  chaveDoTermoPadrao,
  publicar,
  type ContextoDePublicacao,
  type GanchosDaPublicacao,
  type TaxonomiaNaPublicacao,
  type TermosDoConteudoNaPublicacao,
} from './index.js';

/* ────────────────────────────────────────────────────────────────────────────
   `{site}posts` EM MEMORIA, COM AS ESCRITAS APLICADAS
   ──────────────────────────────────────────────────────────────────────────── */

/** Uma linha de `posts`, mutavel porque o `UPDATE` a altera de verdade. */
type LinhaMutavel = Record<string, ValorDeColuna>;

/**
 * Os estados que a consulta publica aceita: `get_post_stati( array( 'public' =>
 * true ) )` (`wp-includes/class-wp-query.php:2739`).
 *
 * Derivado do vocabulario de T001 em lugar de cravado, porque e o registro do
 * legado que decide quais sao — e porque um porte que acrescentasse um estado
 * publico teria de ve-lo aqui tambem.
 */
const ESTADOS_PUBLICOS: readonly EstadoEditorial[] = ESTADOS_EDITORIAIS.filter(
  (estado) => PROPRIEDADES_DO_ESTADO_EDITORIAL[estado].publico,
);

/**
 * A clausula de estado que `WP_Query` monta para o visitante anonimo
 * (`wp-includes/class-wp-query.php:2736`-`:2744`).
 *
 * Os estados sao **interpolados literalmente**, e nao como marcador de
 * parametro, porque e assim que o legado os monta: `"{$wpdb->posts}.post_status
 * = '$public_status'"`. Duble desta suite — ver a nota 2 do cabecalho.
 */
function sqlDaConsultaPublica(tabela: string): string {
  const estados = ESTADOS_PUBLICOS.map(
    (estado) => `${tabela}.post_status = '${estado}'`,
  ).join(' OR ');
  return (
    `SELECT * FROM ${tabela} WHERE 1=1 AND ${tabela}.ID = ? ` +
    `AND ${tabela}.post_type = ? AND ((${estados}))`
  );
}

interface BancoDeConteudo {
  readonly porta: PortaDeDados;
  /** Toda leitura pedida, na ordem. */
  readonly selecoes: Consulta[];
  /** Toda escrita pedida, na ordem. Lista vazia e afirmacao, nao ausencia. */
  readonly escritas: Consulta[];
  /** Poe no banco uma linha que o legado ja tinha gravado antes desta operacao. */
  semear(linha: LinhaDeResultado): void;
  /** A linha como ela esta agora. `null` quando nao existe. */
  linha(id: number): LinhaDeResultado | null;
  /** A consulta publica do visitante anonimo. **Duble desta suite**, nao BC-08. */
  consultaPublica(id: number, tipo: string): LinhaDeResultado | null;
}

/**
 * `{site}posts` em memoria: o repositorio de T002 roda de verdade sobre ele.
 *
 * Toda consulta que esta suite nao preve **levanta erro** em lugar de devolver
 * lista vazia: um duble silencioso faria um teste de pos-condicao passar por
 * acidente, que e o oposto do que estes oito casos existem para pegar.
 */
function bancoDeConteudo(): BancoDeConteudo {
  const prefixoDeTabela = 'wp_';
  const tabela = `${prefixoDeTabela}posts`;
  const linhas = new Map<number, LinhaMutavel>();
  const selecoes: Consulta[] = [];
  const escritas: Consulta[] = [];

  const SELECAO_POR_ID = `SELECT * FROM ${tabela} WHERE ID = ? LIMIT 1`;
  const CONSULTA_PUBLICA = sqlDaConsultaPublica(tabela);
  const PREFIXO_DE_UPDATE = `UPDATE ${tabela} SET `;
  const SUFIXO_DE_UPDATE = ' WHERE ID = ?';

  function inteiro(valor: ValorDeParametro | undefined): number {
    return typeof valor === 'number' ? valor : Number(valor);
  }

  const porta: PortaDeDados = {
    prefixoDeTabela,

    selecionar(consulta) {
      selecoes.push(consulta);

      if (consulta.texto === SELECAO_POR_ID) {
        const linha = linhas.get(inteiro(consulta.parametros[0]));
        return linha === undefined ? [] : [{ ...linha }];
      }

      if (consulta.texto === CONSULTA_PUBLICA) {
        const linha = linhas.get(inteiro(consulta.parametros[0]));
        if (linha === undefined) {
          return [];
        }
        const tipoPedido = String(consulta.parametros[1]);
        const estado = String(linha['post_status']);
        const publico = ESTADOS_PUBLICOS.some(
          (candidato) => candidato === estado,
        );
        return String(linha['post_type']) === tipoPedido && publico
          ? [{ ...linha }]
          : [];
      }

      throw new Error(`leitura nao prevista nesta suite: ${consulta.texto}`);
    },

    escrever(consulta) {
      escritas.push(consulta);

      if (
        !consulta.texto.startsWith(PREFIXO_DE_UPDATE) ||
        !consulta.texto.endsWith(SUFIXO_DE_UPDATE)
      ) {
        throw new Error(`escrita nao prevista nesta suite: ${consulta.texto}`);
      }

      const colunas = consulta.texto
        .slice(
          PREFIXO_DE_UPDATE.length,
          consulta.texto.length - SUFIXO_DE_UPDATE.length,
        )
        .split(', ')
        .map((par) => par.slice(0, par.indexOf(' = ?')));

      const linha = linhas.get(inteiro(consulta.parametros[colunas.length]));
      if (linha === undefined) {
        return { linhasAfetadas: 0, idGerado: null };
      }
      colunas.forEach((coluna, indice) => {
        linha[coluna] = consulta.parametros[indice] ?? null;
      });
      return { linhasAfetadas: 1, idGerado: null };
    },
  };

  return {
    porta,
    selecoes,
    escritas,

    semear(linha) {
      const copia: LinhaMutavel = {};
      for (const [coluna, valor] of Object.entries(linha)) {
        copia[coluna] = valor ?? null;
      }
      linhas.set(inteiro(copia['ID']), copia);
    },

    linha(id) {
      const encontrada = linhas.get(id);
      return encontrada === undefined ? null : { ...encontrada };
    },

    consultaPublica(id, tipo) {
      return (
        porta.selecionar({
          texto: CONSULTA_PUBLICA,
          parametros: [id, tipo],
        })[0] ?? null
      );
    },
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   O CENARIO: O AUTOR DE UC-03, NO PROPRIO CONTEUDO DO TIPO PADRAO
   ──────────────────────────────────────────────────────────────────────────── */

/** O conteudo do fluxo principal de UC-03. */
const ID = 42;
/** Um segundo conteudo, que serve so para provar que a limpeza da fila e dirigida. */
const OUTRO_ID = 99;
/** `get_permalink( 42 )` — o endereco definitivo de CA-1.3. */
const ENDERECO = 'https://exemplo.test/2026/10/08/titulo/';

/**
 * A matriz de papeis do cenario, com o recorte que estes oito casos exercitam.
 *
 * Os nomes de capacidade sao os do legado: `publish_posts` e `publish_pages` sao
 * slots derivados de `capability_type` pelo registro do tipo
 * (`wp-includes/post.php:1884`), e a pre-condicao de UC-03 e literal — *"o ator
 * tem `publish_posts` — o que exclui o colaborador, que percorre UC-06"*.
 */
const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'author',
    capacidades: [
      { capacidade: 'edit_posts', concedida: true },
      { capacidade: 'publish_posts', concedida: true },
    ],
  },
  {
    identificador: 'contributor',
    capacidades: [{ capacidade: 'edit_posts', concedida: true }],
  },
  {
    identificador: 'editor',
    capacidades: [
      { capacidade: 'edit_posts', concedida: true },
      { capacidade: 'publish_posts', concedida: true },
      { capacidade: 'edit_pages', concedida: true },
      { capacidade: 'publish_pages', concedida: true },
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

/** `get_post_type_object( 'post' )` — o tipo padrao, o de UC-03 e o de `P3`. */
const TIPO_POST: TipoDeConteudoNaAutorizacao = {
  nome: 'post',
  traduzMetaCapacidade: true,
  capacidades: {
    edit_posts: 'edit_posts',
    publish_posts: 'publish_posts',
  },
};

/** `get_post_type_object( 'page' )` — os slots valem **outros nomes**. */
const TIPO_PAGINA: TipoDeConteudoNaAutorizacao = {
  nome: 'page',
  traduzMetaCapacidade: true,
  capacidades: {
    edit_posts: 'edit_pages',
    publish_posts: 'publish_pages',
  },
};

/** As 23 colunas de `posts`, com o rascunho de UC-03 nos defaults. */
function linhaDeConteudo(
  campos: Readonly<Record<string, string | number>> = {},
): LinhaDeResultado {
  return {
    ID,
    post_author: 7,
    post_date: '2026-10-08 12:00:00',
    post_date_gmt: DATA_SENTINELA,
    post_content: 'corpo',
    post_title: 'titulo',
    post_excerpt: '',
    post_status: 'draft',
    comment_status: 'open',
    ping_status: 'open',
    post_password: '',
    post_name: 'titulo',
    to_ping: '',
    pinged: '',
    post_modified: '2026-10-08 12:00:00',
    post_modified_gmt: '2026-10-08 15:00:00',
    post_content_filtered: '',
    post_parent: 0,
    guid: '',
    menu_order: 0,
    post_type: 'post',
    post_mime_type: '',
    comment_count: 3,
    ...campos,
  };
}

/** Um evento da fila agendada, identificado por gancho **mais** argumentos. */
interface EventoAgendado {
  readonly gancho: string;
  readonly argumentos: readonly unknown[];
}

/**
 * `get_the_terms()` e `wp_set_post_terms()` com estado: o que foi atribuido
 * **fica atribuido**.
 *
 * Quatro dos oito casos falam de *"ao fim da publicacao"*, e isso e pos-condicao
 * — as pos-condicoes de UC-03 incluem *"toda taxonomia com termo padrao tem ao
 * menos um termo atribuido"*. Um duble sem memoria nao a alcanca.
 */
interface TermosDoCenario {
  /** As chamadas a `wp_set_post_terms()`, na ordem. */
  readonly atribuicoes: { taxonomia: string; termos: readonly number[] }[];
  /** As opcoes de termo padrao consultadas, na ordem. */
  readonly opcoesLidas: string[];
  /** Os termos que o conteudo tem naquela taxonomia, **agora**. */
  termosDe(taxonomia: string): readonly number[];
}

interface FilaDoCenario {
  /** Os eventos que seguem na fila, **agora**. */
  readonly agendados: EventoAgendado[];
  /** As chamadas a `wp_clear_scheduled_hook()`, na ordem. */
  readonly limpezas: EventoAgendado[];
}

interface Cenario {
  readonly contexto: ContextoDePublicacao;
  readonly banco: BancoDeConteudo;
  /** Os pontos de extensao disparados, na ordem. */
  readonly pontos: string[];
  /** Os argumentos de cada disparo de `transition_post_status`, na ordem. */
  readonly transicoes: { estadoNovo: string; estadoAnterior: string }[];
  readonly termos: TermosDoCenario;
  readonly fila: FilaDoCenario;
}

interface OpcoesDoCenario {
  readonly papel?: string;
  readonly linha?: LinhaDeResultado;
  readonly tipos?: Readonly<Record<string, TipoDeConteudoNaAutorizacao>>;
  readonly taxonomias?: readonly TaxonomiaNaPublicacao[];
  /** Os termos que o conteudo ja tinha antes de publicar. */
  readonly termosIniciais?: Readonly<Record<string, readonly number[]>>;
  /** Taxonomia em que `get_the_terms()` devolve `WP_Error`. */
  readonly taxonomiasInvalidas?: readonly string[];
  readonly opcoes?: Readonly<Record<string, number>>;
  readonly endereco?: string | false;
  readonly agendados?: readonly EventoAgendado[];
}

function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const banco = bancoDeConteudo();
  banco.semear(opcoes.linha ?? linhaDeConteudo());

  const pontos: string[] = [];
  const transicoes: Cenario['transicoes'] = [];
  const atribuicoes: TermosDoCenario['atribuicoes'] = [];
  const opcoesLidas: string[] = [];
  const limpezas: EventoAgendado[] = [];
  const agendados: EventoAgendado[] = [...(opcoes.agendados ?? [])];

  const tipos = opcoes.tipos ?? { post: TIPO_POST, page: TIPO_PAGINA };
  const valoresDeOpcao = opcoes.opcoes ?? {};
  const invalidas = opcoes.taxonomiasInvalidas ?? [];
  const termosPorTaxonomia = new Map<string, readonly number[]>(
    Object.entries(opcoes.termosIniciais ?? {}),
  );

  // Todos os dez pontos sao registrados, e cada um anota o proprio nome: e por
  // essa lista que *"uma unica vez"* e *"uma segunda vez"* se afirmam.
  const ganchos: GanchosDaPublicacao = {
    filtrarGuid(guid) {
      pontos.push('get_the_guid');
      return guid;
    },
    aoEntrarEmPublicadoPeloPontoDepreciado(gancho) {
      pontos.push(gancho);
    },
    aoTransitarEstado(estadoNovo, estadoAnterior) {
      pontos.push('transition_post_status');
      transicoes.push({ estadoNovo, estadoAnterior });
    },
    aoTransitarDeParaEstado(gancho) {
      pontos.push(gancho);
    },
    aoEntrarNoEstadoDoTipo(gancho) {
      pontos.push(gancho);
    },
    aoEditarConteudoDoTipo(gancho) {
      pontos.push(gancho);
    },
    aoEditarConteudo() {
      pontos.push('edit_post');
    },
    aoGravarConteudoDoTipo(gancho) {
      pontos.push(gancho);
    },
    aoGravarConteudo() {
      pontos.push('save_post');
    },
    aoInserirConteudo() {
      pontos.push('wp_insert_post');
    },
    depoisDeInserirConteudo() {
      pontos.push('wp_after_insert_post');
    },
  };

  const contexto: ContextoDePublicacao = {
    base: BASE,
    ator: ator(opcoes.papel ?? 'author'),
    armazenamento: { conteudo: criarRepositorioDeConteudo(banco.porta) },

    classificacao: {
      taxonomiasDoTipo() {
        return opcoes.taxonomias ?? [];
      },
      termosDoConteudo(_conteudoId, taxonomia): TermosDoConteudoNaPublicacao {
        // `! empty( WP_Error )` e verdadeiro no legado, e por isso o erro salta a
        // taxonomia em lugar de valer como "sem termos"
        // (`wp-includes/post.php:5427`).
        if (invalidas.includes(taxonomia)) {
          return { erro: true, codigo: 'invalid_taxonomy' };
        }
        return { erro: false, termos: termosPorTaxonomia.get(taxonomia) ?? [] };
      },
      opcaoDeTermoPadrao(chave) {
        opcoesLidas.push(chave);
        return valoresDeOpcao[chave] ?? 0;
      },
      definirTermos(_conteudoId, termos, taxonomia) {
        atribuicoes.push({ taxonomia, termos });
        // `$append = false` no unico chamador deste caminho: substituicao integral.
        termosPorTaxonomia.set(taxonomia, [...termos]);
      },
    },

    fila: {
      // `wp_clear_scheduled_hook( $hook, $args )` (`wp-includes/cron.php:576`):
      // devolve quantos eventos foram desagendados, e `0` quando nao havia
      // nenhum — *"zero if no events were registered with the hook"*.
      limparGancho(gancho, argumentos) {
        limpezas.push({ gancho, argumentos });
        const procurado = JSON.stringify(argumentos);
        let removidos = 0;
        for (let indice = agendados.length - 1; indice >= 0; indice -= 1) {
          const evento = agendados[indice];
          if (
            evento !== undefined &&
            evento.gancho === gancho &&
            JSON.stringify(evento.argumentos) === procurado
          ) {
            agendados.splice(indice, 1);
            removidos += 1;
          }
        }
        return removidos;
      },
    },

    tipoDeConteudo(nome) {
      return tipos[nome] ?? null;
    },

    enderecoDoConteudo() {
      return opcoes.endereco === undefined ? ENDERECO : opcoes.endereco;
    },

    ganchos,
  };

  return {
    contexto,
    banco,
    pontos,
    transicoes,
    termos: {
      atribuicoes,
      opcoesLidas,
      termosDe(taxonomia) {
        return termosPorTaxonomia.get(taxonomia) ?? [];
      },
    },
    fila: { agendados, limpezas },
  };
}

/** O estado que esta gravado na coluna, agora. */
function estadoGravado(banco: BancoDeConteudo, id = ID): string {
  return String(banco.linha(id)?.['post_status']);
}

/** As escritas que tocam a coluna de estado. Nenhuma outra deveria. */
function escritasDeEstado(banco: BancoDeConteudo): Consulta[] {
  return banco.escritas.filter((consulta) =>
    consulta.texto.includes('post_status'),
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   UT-019-1 · `erro` · CA-1.1
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-019-1 recusa a publicação de quem não tem a capacidade de publicar aquele tipo (CA-1.1)', () => {
  // Entrada: o colaborador de UC-06 — tem `edit_posts`, nao tem `publish_posts`
  // —, no rascunho do tipo padrao. Acao: pedir a publicacao.
  const colaborador = cenario({ papel: 'contributor' });

  const recusado = publicar(colaborador.contexto, { conteudoId: ID });

  // `class-wp-rest-posts-controller.php:1588`-`:1589` e
  // `wp-includes/rest-api.php:1439` (`is_user_logged_in() ? 403 : 401`): o
  // codigo, o texto e o numero sao os do legado, byte a byte. A metade *"recusa
  // explicita na tela"* do criterio NAO e afirmada aqui — ver a nota 1 do
  // cabecalho.
  assert.equal(recusado.desfecho, 'recusado');
  assert.equal(recusado.recusa?.codigo, CODIGO_DE_RECUSA_DE_PUBLICACAO);
  assert.equal(recusado.recusa?.mensagem, MENSAGEM_DE_RECUSA_DE_PUBLICACAO);
  assert.equal(recusado.recusa?.codigoHttp, 403);

  // E a acao nao aconteceu: o estado gravado segue o de antes, e nenhum comando,
  // ponto de extensao, termo ou limpeza de fila saiu.
  assert.equal(estadoGravado(colaborador.banco), 'draft');
  assert.deepEqual(colaborador.banco.escritas, []);
  assert.deepEqual(colaborador.pontos, []);
  assert.deepEqual(colaborador.termos.atribuicoes, []);
  assert.deepEqual(colaborador.fila.limpezas, []);

  // *"aquele tipo"*: a capacidade e o slot do REGISTRO DO TIPO, nao a cadeia
  // `publish_posts` (`wp-includes/post.php:1884`). O mesmo ator, o mesmo
  // conteudo, so o tipo muda — e nao ha um unico `if` sobre o nome `page`.
  const autorNoPost = cenario({ papel: 'author' });
  const autorNaPagina = cenario({
    papel: 'author',
    linha: linhaDeConteudo({ post_type: 'page' }),
  });
  const editorNaPagina = cenario({
    papel: 'editor',
    linha: linhaDeConteudo({ post_type: 'page' }),
  });

  assert.equal(
    publicar(autorNoPost.contexto, { conteudoId: ID }).desfecho,
    'publicado',
  );
  assert.equal(
    publicar(autorNaPagina.contexto, { conteudoId: ID }).desfecho,
    'recusado',
  );
  assert.equal(estadoGravado(autorNaPagina.banco), 'draft');
  assert.equal(
    publicar(editorNaPagina.contexto, { conteudoId: ID }).desfecho,
    'publicado',
  );
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-019-2 · `feliz` · CA-1.2
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-019-2 grava o estado publicado disparando a transição uma única vez (CA-1.2)', () => {
  // Entrada: o autor de UC-03 no proprio rascunho. Acao: publicar, uma vez.
  const { contexto, banco, pontos, transicoes } = cenario();

  const resultado = publicar(contexto, { conteudoId: ID });

  // O estado publicado, gravado: `$wpdb->update( $wpdb->posts, array(
  // 'post_status' => 'publish' ), array( 'ID' => $post->ID ) )`
  // (`wp-includes/post.php:5448`). UMA coluna, UM comando.
  assert.equal(resultado.desfecho, 'publicado');
  assert.equal(estadoGravado(banco), ESTADO_PUBLICADO);
  assert.equal(resultado.conteudo?.estado, ESTADO_PUBLICADO);
  assert.equal(resultado.estadoAnterior, 'draft');

  const deEstado = escritasDeEstado(banco);
  assert.equal(deEstado.length, 1);
  assert.equal(
    deEstado[0]?.texto,
    'UPDATE wp_posts SET post_status = ? WHERE ID = ?',
  );
  assert.deepEqual(deEstado[0]?.parametros, [ESTADO_PUBLICADO, ID]);

  // E a transicao, uma unica vez: `wp_transition_post_status( 'publish',
  // $old_status, $post )` e chamada uma vez (`:5452`), com o estado novo no
  // objeto e o antigo no argumento (`:5450`-`:5451`).
  assert.deepEqual(transicoes, [
    { estadoNovo: ESTADO_PUBLICADO, estadoAnterior: 'draft' },
  ]);
  assert.equal(
    pontos.filter((ponto) => ponto === 'transition_post_status').length,
    1,
  );
  // Os dois pontos de nome dinamico tambem saem uma vez, e `draft_to_publish` e
  // o que prova de qual par a transicao foi (`:5938`, `:5975`).
  assert.equal(pontos.filter((ponto) => ponto === 'draft_to_publish').length, 1);
  assert.equal(pontos.filter((ponto) => ponto === 'publish_post').length, 1);
  // Nenhum dos dez pontos repetido.
  assert.equal(new Set(pontos).size, pontos.length);
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-019-3 · `feliz` · CA-1.3
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-019-3 passa a devolver o conteúdo na consulta pública com endereço definitivo (CA-1.3)', () => {
  // Entrada: o rascunho, com `guid` vazio. Acao: publicar. A consulta publica e
  // duble desta suite — ver a nota 2 do cabecalho.
  const { contexto, banco } = cenario();

  // Antes: a consulta publica nao o devolve, porque `draft` nao e publico.
  assert.equal(banco.consultaPublica(ID, 'post'), null);
  assert.deepEqual(ESTADOS_PUBLICOS, [ESTADO_PUBLICADO]);

  const resultado = publicar(contexto, { conteudoId: ID });

  // Depois: devolve.
  const encontrado = banco.consultaPublica(ID, 'post');
  assert.ok(encontrado !== null);
  assert.equal(encontrado['post_status'], ESTADO_PUBLICADO);
  assert.equal(encontrado['ID'], ID);

  // E com endereco definitivo, nas duas pontas em que ele e observavel: o que a
  // operacao devolve (passo 7 de UC-03) e o `guid` vazio reposto com
  // `get_permalink()` ao entrar em publicado
  // (`wp-includes/post.php:8159`-`:8160`).
  assert.equal(resultado.endereco, ENDERECO);
  assert.equal(encontrado['guid'], ENDERECO);
  assert.equal(resultado.efeitosDaTransicao?.enderecoGravadoNoGuid, ENDERECO);

  // ⚠️ O registro devolvido guarda o `guid` ANTIGO: o legado grava a coluna e nao
  // repassa ao objeto em memoria. E observavel por extensao, e esta reproduzido.
  assert.equal(resultado.conteudo?.guid, '');
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-019-4 · `feliz` · CA-1.4
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-019-4 atribui termo em toda taxonomia que declare um padrão ao fim da publicação (CA-1.4)', () => {
  // Entrada: tres taxonomias no tipo, duas delas declarando termo padrao, e o
  // conteudo sem termo em nenhuma. Acao: publicar.
  const taxonomias: readonly TaxonomiaNaPublicacao[] = [
    { nome: 'genero', declaraTermoPadrao: true },
    { nome: 'post_tag', declaraTermoPadrao: false },
    { nome: 'tema', declaraTermoPadrao: true },
  ];
  const { contexto, termos } = cenario({
    taxonomias,
    opcoes: {
      [chaveDoTermoPadrao('genero')]: 9,
      [chaveDoTermoPadrao('tema')]: 4,
      [chaveDoTermoPadrao('post_tag')]: 3,
    },
  });

  const resultado = publicar(contexto, { conteudoId: ID });
  assert.equal(resultado.desfecho, 'publicado');

  // A pos-condicao de UC-03, afirmada taxonomia por taxonomia: *"toda taxonomia
  // com termo padrao tem ao menos um termo atribuido"*
  // (`wp-includes/post.php:5419`-`:5439`).
  for (const taxonomia of taxonomias) {
    if (taxonomia.declaraTermoPadrao) {
      assert.ok(
        termos.termosDe(taxonomia.nome).length >= 1,
        `${taxonomia.nome} ficou sem termo`,
      );
    }
  }

  // E so elas: quem nao declara termo padrao nao entra no laco, e por isso a
  // opcao dela — que existe — nem chega a ser lida (`:5422`-`:5425`).
  assert.deepEqual(termos.termosDe('post_tag'), []);
  assert.deepEqual(termos.opcoesLidas, [
    `${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}genero`,
    `${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}tema`,
  ]);
  // A ordem das atribuicoes e a ordem de registro das taxonomias, que e dado.
  assert.deepEqual(termos.atribuicoes, [
    { taxonomia: 'genero', termos: [9] },
    { taxonomia: 'tema', termos: [4] },
  ]);
  assert.deepEqual(resultado.termosPadraoAtribuidos, [
    { taxonomia: 'genero', termoId: 9 },
    { taxonomia: 'tema', termoId: 4 },
  ]);

  // Taxonomia que devolve `WP_Error` e tratada como taxonomia que JA TEM termo, e
  // por isso termina SEM termo: `! empty( WP_Error )` e verdadeiro (`:5427`).
  const comErro = cenario({
    taxonomias: [{ nome: 'genero', declaraTermoPadrao: true }],
    taxonomiasInvalidas: ['genero'],
    opcoes: { [chaveDoTermoPadrao('genero')]: 9 },
  });
  publicar(comErro.contexto, { conteudoId: ID });
  assert.deepEqual(comErro.termos.atribuicoes, []);
  assert.deepEqual(comErro.termos.termosDe('genero'), []);
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-019-5 · `feliz` · CA-1.5
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-019-5 remove o evento de publicação agendada pendente do conteúdo publicado (CA-1.5)', () => {
  // Entrada: o conteudo agendado, com evento `publish_future_post` pendente — e
  // um segundo conteudo com o evento dele na mesma fila. Acao: publicar o
  // primeiro.
  const { contexto, fila } = cenario({
    linha: linhaDeConteudo({ post_status: 'future' }),
    agendados: [
      { gancho: GANCHO_DE_PUBLICACAO_AGENDADA, argumentos: [ID] },
      { gancho: GANCHO_DE_PUBLICACAO_AGENDADA, argumentos: [OUTRO_ID] },
    ],
  });

  const resultado = publicar(contexto, { conteudoId: ID });

  // `wp_clear_scheduled_hook( 'publish_future_post', array( $post->ID ) )`
  // (`wp-includes/post.php:8189`). O argumento viaja porque e parte da
  // identidade do evento: limpar sem ele apagaria o evento de todo conteudo
  // agendado do site — e e isso que a segunda afirmacao protege.
  assert.equal(resultado.desfecho, 'publicado');
  assert.deepEqual(fila.limpezas, [
    { gancho: GANCHO_DE_PUBLICACAO_AGENDADA, argumentos: [ID] },
  ]);
  assert.deepEqual(fila.agendados, [
    { gancho: GANCHO_DE_PUBLICACAO_AGENDADA, argumentos: [OUTRO_ID] },
  ]);
  assert.equal(resultado.efeitosDaTransicao?.eventosAgendadosRemovidos, 1);

  // E a limpeza e INCONDICIONAL, com o comentario do legado na propria linha:
  // *"Always clears the hook in case the post status bounced from future to
  // draft."* Sem evento pendente ela acontece do mesmo jeito, e devolve zero.
  const semEvento = cenario();
  const segundo = publicar(semEvento.contexto, { conteudoId: ID });
  assert.equal(semEvento.fila.limpezas.length, 1);
  assert.equal(segundo.efeitosDaTransicao?.eventosAgendadosRemovidos, 0);
  assert.equal(segundo.desfecho, 'publicado');
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-019-6 · `feliz` · `P1` — publicar e ato explicito
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-019-6 grava o estado publicado somente pelo comando de publicar (P1)', () => {
  // Entrada: o rascunho. Acao: toda outra escrita que este modulo expoe sobre a
  // linha, e so depois o comando de publicar. A metade de `P1` que vive no
  // caminho de gravacao e T005 — ver a nota 3 do cabecalho.
  const { contexto, banco, pontos, transicoes } = cenario();

  contexto.armazenamento.conteudo.atualizar(ID, {
    titulo: 'outro titulo',
    corpo: 'outro corpo',
    identificadorNaUrl: 'outro-titulo',
  });

  // Nenhuma transicao para publicado por efeito colateral — o cenario
  // `@invariante` de `PT-002`: nenhuma escrita tocou a coluna de estado, o
  // estado gravado segue `draft` e nenhum gancho de transicao disparou.
  assert.deepEqual(escritasDeEstado(banco), []);
  assert.equal(estadoGravado(banco), 'draft');
  assert.deepEqual(pontos, []);
  assert.deepEqual(transicoes, []);

  // E o comando grava — e e o unico que grava.
  assert.equal(publicar(contexto, { conteudoId: ID }).desfecho, 'publicado');
  assert.equal(estadoGravado(banco), ESTADO_PUBLICADO);
  assert.equal(escritasDeEstado(banco).length, 1);
  assert.deepEqual(transicoes, [
    { estadoNovo: ESTADO_PUBLICADO, estadoAnterior: 'draft' },
  ]);

  // As duas regras para a mesma coluna seguem divergentes, e e isso que `P1` e:
  // a gravacao por aplicacao assume `draft` (`wp-includes/post.php:4703`) e o
  // armazenamento assume `publish` (`wp-admin/includes/schema.php:167`).
  // BR-MIGRAR-001: o alvo *"nao pode unificar os dois defaults"*.
  assert.equal(ESTADO_PADRAO_DA_APLICACAO, 'draft');
  assert.equal(ESTADO_PADRAO_DO_ARMAZENAMENTO, ESTADO_PUBLICADO);
  assert.notEqual(ESTADO_PADRAO_DA_APLICACAO, ESTADO_PADRAO_DO_ARMAZENAMENTO);
  assert.ok(
    ddlDeConteudo(banco.porta, { clausulaDeCharset: '' }).includes(
      `post_status varchar(20) NOT NULL default '${ESTADO_PADRAO_DO_ARMAZENAMENTO}'`,
    ),
  );
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-019-7 · `borda` · `P3` — conteudo do tipo padrao sempre tem categoria
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-019-7 deixa o conteúdo do tipo padrão sempre com categoria ao fim da publicação (P3)', () => {
  // Entrada: conteudo do tipo padrao (`post`), sem nenhum termo de categoria, e
  // a taxonomia `category` SEM `default_term` declarado — porque o padrao dela
  // nao vive no registro, vive na opcao `default_category`, que o instalador
  // semeia com `1`. Acao: publicar.
  const semCategoria = cenario({
    taxonomias: [{ nome: TAXONOMIA_DE_CATEGORIA, declaraTermoPadrao: false }],
    opcoes: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: 1 },
  });

  publicar(semCategoria.contexto, { conteudoId: ID });

  // `if ( 'category' !== $taxonomy && empty( $tax_object->default_term ) )`
  // (`wp-includes/post.php:5422`): a categoria entra no laco por NOME. Ao fim da
  // publicacao o conteudo tem categoria.
  assert.deepEqual(semCategoria.termos.termosDe(TAXONOMIA_DE_CATEGORIA), [1]);
  assert.deepEqual(semCategoria.termos.opcoesLidas, [
    OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
  ]);
  assert.equal(
    chaveDoTermoPadrao(TAXONOMIA_DE_CATEGORIA),
    OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
  );

  // A outra borda da mesma regra: quem JA tem categoria nao e modificado —
  // *"Do not modify previously set terms"* (`:5427`) — e ao fim da publicacao
  // continua com categoria, pelo outro ramo do laco.
  const comCategoria = cenario({
    taxonomias: [{ nome: TAXONOMIA_DE_CATEGORIA, declaraTermoPadrao: false }],
    termosIniciais: { [TAXONOMIA_DE_CATEGORIA]: [5] },
    opcoes: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: 1 },
  });

  publicar(comCategoria.contexto, { conteudoId: ID });

  assert.deepEqual(comCategoria.termos.termosDe(TAXONOMIA_DE_CATEGORIA), [5]);
  assert.deepEqual(comCategoria.termos.atribuicoes, []);
  assert.deepEqual(comCategoria.termos.opcoesLidas, []);

  // ⚠️ E a borda em que o legado DESISTE: `if ( ! $default_term_id ) { continue; }`
  // (`:5436`). Com a opcao em `0` o conteudo termina SEM categoria, e isso e o
  // comportamento do sistema analisado, nao defeito a corrigir — a regra se
  // sustenta no legado porque o instalador semeia `default_category` em `1` e o
  // termo padrao e indestrutivel (BR-MIGRAR-091, que e da feature 003). Fechar
  // esta borda seria inventar invariante que o legado nao cobra, e cai em *Nao
  // negociavel* (**P1**).
  const semOpcao = cenario({
    taxonomias: [{ nome: TAXONOMIA_DE_CATEGORIA, declaraTermoPadrao: false }],
    opcoes: {},
  });

  const resultado = publicar(semOpcao.contexto, { conteudoId: ID });

  assert.deepEqual(semOpcao.termos.opcoesLidas, [
    OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
  ]);
  assert.deepEqual(semOpcao.termos.termosDe(TAXONOMIA_DE_CATEGORIA), []);
  assert.deepEqual(resultado.termosPadraoAtribuidos, []);
  // E a publicacao acontece de todo jeito: o laco nao interrompe nada.
  assert.equal(resultado.desfecho, 'publicado');
  assert.equal(estadoGravado(semOpcao.banco), ESTADO_PUBLICADO);
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-019-8 · `borda` · `P7` — republicar e operacao nula
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-019-8 não dispara a transição uma segunda vez ao republicar o já publicado (P7)', () => {
  // Entrada: o rascunho, com taxonomia de termo padrao e evento agendado — para
  // que a segunda chamada tenha o que repetir se a guarda falhar. Acao: publicar
  // e, sobre a MESMA linha ja gravada, pedir a publicacao de novo.
  const { contexto, banco, pontos, transicoes, termos, fila } = cenario({
    taxonomias: [{ nome: 'genero', declaraTermoPadrao: true }],
    opcoes: { [chaveDoTermoPadrao('genero')]: 9 },
    agendados: [{ gancho: GANCHO_DE_PUBLICACAO_AGENDADA, argumentos: [ID] }],
  });

  const primeira = publicar(contexto, { conteudoId: ID });
  assert.equal(primeira.desfecho, 'publicado');
  assert.equal(estadoGravado(banco), ESTADO_PUBLICADO);

  const pontosDaPrimeira = [...pontos];
  const escritasDaPrimeira = banco.escritas.length;

  const segunda = publicar(contexto, { conteudoId: ID });

  // `if ( 'publish' === $post->post_status ) { return; }`
  // (`wp-includes/post.php:5412`), BR-MIGRAR-007: a segunda transicao nao
  // dispara. *"Um emissor de evento idempotente por identificador dispararia o
  // gancho; aqui ele NAO dispara."*
  assert.equal(segunda.desfecho, 'ja-publicado');
  assert.deepEqual(pontos, pontosDaPrimeira);
  assert.equal(
    pontos.filter((ponto) => ponto === 'transition_post_status').length,
    1,
  );
  assert.deepEqual(transicoes, [
    { estadoNovo: ESTADO_PUBLICADO, estadoAnterior: 'draft' },
  ]);
  assert.equal(segunda.efeitosDaTransicao, null);

  // E nada mais aconteceu de novo: nenhuma escrita, nenhum termo e nenhuma
  // limpeza de fila. A ausencia e o que uma extensao que escuta transicao
  // observa. Os critérios de US-5 sao de T011 e T012 — nota 4 do cabecalho.
  assert.equal(banco.escritas.length, escritasDaPrimeira);
  assert.equal(termos.atribuicoes.length, 1);
  assert.equal(fila.limpezas.length, 1);
  assert.equal(segunda.recusa, null);
});
