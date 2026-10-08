/**
 * Testes da entrega de **T007**: *"o comportamento de US-3 existe e os criterios
 * CA-3.1, CA-3.2, CA-3.3, CA-3.4 passam contra o sistema novo"*.
 *
 * **Nao sao os seis testes de `backlog/tests.md`** — UT-021-1 a UT-021-6 sao
 * **T008**, a tarefa `[P]` que roda em paralelo com esta. Aqui se afirma o que
 * esta tarefa entrega, criterio por criterio, pelos meios que a Decisao 2 fixa
 * para esta area: **efeito no banco** (*"snapshot + sequencia de comandos"*),
 * **valor devolvido pelo ponto de extensao** e **ordem de emissao** deles.
 *
 * Cada afirmacao foi conferida contra o codigo do sistema analisado, legivel em
 * disco em `~/Downloads/wordpress` (WordPress 7.1.2, a mesma versao do pacote),
 * e por isso cita arquivo e linha. Quando o oraculo executavel existir (T001 da
 * feature 015), e por essas linhas que a comparacao caso a caso passa a rodar.
 *
 * ---
 *
 * # Por que esta suite tem porta de dados propria
 *
 * `criarPortaDeDadosFalsa()`, de T002, responde por **fila**: a enesima leitura
 * recebe a enesima resposta programada, qualquer que seja a consulta. Esta regra
 * nao cabe nessa forma — o laco do sufixo faz **uma consulta por tentativa**, e
 * quantas tentativas acontecem depende do que cada uma respondeu. Programar isso
 * por fila seria programar o resultado.
 *
 * A porta daqui responde **por consulta**, a partir de um conjunto de
 * identificadores ocupados, e **registra tudo** — e por isso ela continua
 * servindo o criterio da area: os textos e os parametros de cada comando sao
 * afirmados por extenso.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAPACIDADE_NEGADA,
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type AvisoDeUsoIndevido,
  type BaseDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarRepositorioDeConteudo,
  lerConteudo,
  TIPO_DE_ANEXO,
  TIPO_DE_VERSAO,
  type Conteudo,
} from '../armazenamento/index.js';
import type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ValorDeParametro,
} from '../portas/index.js';
import {
  AVISO_DE_PUBLICACAO_SEM_OBJETO,
  CAPACIDADE_DE_PUBLICAR_ESTE_CONTEUDO,
  casoDePublicacaoDeConteudo,
  ESTADOS_QUE_DISPENSAM_IDENTIFICADOR,
  ESTADOS_SEM_ENDERECO_SERVIDO,
  ESTADO_EM_REVISAO,
  gravarConteudo,
  identificadorDeAmostra,
  identificadorMudouNaGravacao,
  identificadorUnico,
  identificadorValido,
  PRIMEIRO_SUFIXO_DO_IDENTIFICADOR,
  TAMANHO_MAXIMO_DO_IDENTIFICADOR,
  TIPO_DE_ITEM_DE_MENU,
  TIPO_DE_SOLICITACAO_DE_DADO_PESSOAL,
  urlencodeComoNoPhp,
  type ContextoDeGravacao,
  type ContextoDoIdentificadorUnico,
  type GanchosDaGravacao,
  type TextoDoIdentificador,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const ID_GERADO = 7;
const ID_EXISTENTE = 42;
const TIPO_DE_PAGINA = 'page';

/** As consultas de unicidade, com o texto que o legado envia. */
const CONSULTA_DE_ANEXO =
  'SELECT post_name FROM wp_posts WHERE post_name = ? AND ID != ? LIMIT 1';
const CONSULTA_HIERARQUICA =
  'SELECT post_name FROM wp_posts WHERE post_name = ? ' +
  "AND post_type IN ( ?, 'attachment' ) AND ID != ? AND post_parent = ? LIMIT 1";
const CONSULTA_PLANA =
  'SELECT post_name FROM wp_posts WHERE post_name = ? AND post_type = ? ' +
  'AND ID != ? LIMIT 1';

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
    post_status: 'draft',
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

interface OpcoesDaPorta {
  /** Os identificadores que a tabela ja tem. */
  readonly ocupados?: readonly string[];
  /** A linha que `SELECT *` devolve. `null` responde vazio. */
  readonly linha?: LinhaDeResultado | null;
}

interface PortaDeTeste {
  readonly porta: PortaDeDados;
  readonly selecoes: Consulta[];
  readonly escritas: Consulta[];
}

/**
 * A porta de dados desta suite: responde **por consulta** e registra tudo.
 *
 * As tres consultas de unicidade respondem a partir de {@link
 * OpcoesDaPorta.ocupados} — devolvendo a **linha com o `post_name`
 * encontrado**, como `$wpdb->get_var()` devolve. Ver a razao no cabecalho.
 */
function porta(opcoes: OpcoesDaPorta = {}): PortaDeTeste {
  const ocupados = opcoes.ocupados ?? [];
  const linha = opcoes.linha === undefined ? linhaDeConteudo() : opcoes.linha;
  const selecoes: Consulta[] = [];
  const escritas: Consulta[] = [];

  return {
    porta: {
      prefixoDeTabela: 'wp_',
      selecionar(consulta) {
        selecoes.push(consulta);

        if (consulta.texto.startsWith('SELECT post_name')) {
          const pedido = String(consulta.parametros[0]);
          return ocupados.includes(pedido) ? [{ post_name: pedido }] : [];
        }
        if (consulta.texto.startsWith('SELECT * FROM')) {
          return linha === null ? [] : [linha];
        }
        // `SELECT ID` — a pergunta do `import_id`, que esta suite nao exercita.
        return [];
      },
      escrever(consulta) {
        escritas.push(consulta);
        return { linhasAfetadas: 1, idGerado: ID_GERADO };
      },
    },
    selecoes,
    escritas,
  };
}

/** As chamadas a `sanitize_title()`, para afirmar o **contexto** de cada uma. */
interface ChamadaDeSanitizacao {
  readonly titulo: string;
  readonly reserva: string;
  readonly contexto: string;
}

/**
 * `sanitize_title()` reduzida ao determinismo que esta suite precisa: caixa
 * baixa, espaco e sublinhado virando hifen, o resto do que nao e letra, digito
 * ou hifen caindo fora, e a reserva quando sobra vazio.
 *
 * ⚠️ **Nao e a funcao do legado**, e nao tenta ser: a de verdade tem 80 linhas,
 * preserva octeto escapado e apaga 30 sequencias percent-codificadas (o aviso
 * esta em `identificador-na-url.ts`), e ela e de `plataforma/formatacao/`,
 * feature 015. O que esta suite afirma sobre ela e **quando** e **com que
 * contexto** ela e chamada, nao o texto que ela produz.
 */
function texto(registro?: ChamadaDeSanitizacao[]): TextoDoIdentificador {
  return {
    sanitizarTitulo(titulo, reserva, contexto) {
      registro?.push({ titulo, reserva, contexto });
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
}

/** `$wp_rewrite` e `permalink_structure` com os valores de fabrica do legado. */
const FEEDS_DE_FABRICA = ['feed', 'rdf', 'rss', 'rss2', 'atom'];

interface OpcoesDaReescrita {
  readonly feeds?: readonly string[];
  readonly baseDePaginacao?: string;
  readonly estruturaDeLinks?: string;
}

function reescrita(opcoes: OpcoesDaReescrita = {}) {
  return {
    feeds: () => opcoes.feeds ?? FEEDS_DE_FABRICA,
    baseDePaginacao: () => opcoes.baseDePaginacao ?? 'page',
    estruturaDeLinks: () => opcoes.estruturaDeLinks ?? '',
  };
}

function ator(contaId = 3, login = 'autora'): AtorDeAutorizacao {
  return { contaId, login, existe: true, concessoes: [] };
}

/**
 * A base de autorizacao com a matriz vazia.
 *
 * Matriz vazia **e um estado do legado**, e nao atalho de teste: o papel e dado
 * gravado (ADR-0001), e quem decide e a concessao do ator. Os testes de CA-3.4
 * concedem capacidade direto ao ator, que e o caminho do `allcaps` individual
 * por cima do papel (`PERM-1`); o teste de concorrencia, no fim, usa papel.
 */
const BASE_SEM_PAPEL: BaseDeAutorizacao = {
  matriz: [],
  rede: REDE_INATIVA_NA_AUTORIZACAO,
};

/** Um ator com as capacidades concedidas individualmente. */
function atorCom(...capacidades: readonly string[]): AtorDeAutorizacao {
  return {
    contaId: 3,
    login: 'autora',
    existe: true,
    concessoes: capacidades.map((capacidade) => ({
      capacidade,
      concedida: true,
    })),
  };
}

interface OpcoesDoContexto extends OpcoesDaReescrita {
  readonly ocupados?: readonly string[];
  readonly linha?: LinhaDeResultado | null;
  readonly hierarquico?: boolean;
  readonly registroDeSanitizacao?: ChamadaDeSanitizacao[];
  readonly ganchos?: GanchosDaGravacao;
}

interface CenarioDoIdentificador {
  readonly contexto: ContextoDoIdentificadorUnico;
  readonly dados: PortaDeTeste;
}

/** O contexto de `wp_unique_post_slug()`, isolado. */
function cenarioDoIdentificador(
  opcoes: OpcoesDoContexto = {},
): CenarioDoIdentificador {
  const dados = porta({
    ...(opcoes.ocupados === undefined ? {} : { ocupados: opcoes.ocupados }),
    ...(opcoes.linha === undefined ? {} : { linha: opcoes.linha }),
  });

  return {
    dados,
    contexto: {
      texto: texto(opcoes.registroDeSanitizacao),
      repositorio: criarRepositorioDeConteudo(dados.porta),
      reescrita: reescrita(opcoes),
      tipoEHierarquico: (tipo) =>
        opcoes.hierarquico === true || tipo === TIPO_DE_PAGINA,
      ...(opcoes.ganchos === undefined ? {} : { ganchos: opcoes.ganchos }),
    },
  };
}

interface OpcoesDaGravacao extends OpcoesDoContexto {
  readonly ator?: AtorDeAutorizacao;
  readonly base?: BaseDeAutorizacao;
  /** `get_post_type_object()`: `null` reproduz o tipo nao registrado. */
  readonly tipoRegistrado?: boolean;
  readonly avisos?: AvisoDeUsoIndevido[];
}

interface CenarioDaGravacao {
  readonly contexto: ContextoDeGravacao;
  readonly dados: PortaDeTeste;
}

/** O contexto da gravacao inteira, com os colaboradores de T005 e de T007. */
function cenarioDaGravacao(
  opcoes: OpcoesDaGravacao = {},
): CenarioDaGravacao {
  const { contexto: doIdentificador, dados } = cenarioDoIdentificador(opcoes);
  const avisos = opcoes.avisos;

  return {
    dados,
    contexto: {
      ator: opcoes.ator ?? ator(),
      base: opcoes.base ?? BASE_SEM_PAPEL,
      armazenamento: { conteudo: doIdentificador.repositorio },
      texto: doIdentificador.texto,
      reescrita: doIdentificador.reescrita,
      tipoDeConteudo: (nome) =>
        opcoes.tipoRegistrado === false
          ? null
          : {
              nome,
              traduzMetaCapacidade: true,
              capacidades: {
                publish_posts:
                  nome === TIPO_DE_PAGINA ? 'publish_pages' : 'publish_posts',
              },
            },
      tipoEHierarquico: doIdentificador.tipoEHierarquico,
      datas: {
        agoraNoFusoDoSite: () => '2026-10-08 12:00:00',
        agoraEmUtc: () => '2026-10-08 15:00:00',
        deUtcParaOFusoDoSite: () => '2026-10-08 12:00:00',
        doFusoDoSiteParaUtc: () => '2026-10-08 15:00:00',
      },
      suportaRecurso: () => true,
      estadoPadraoDeComentario: () => 'open',
      enderecoDoConteudo: () => 'https://exemplo.test/?p=7',
      ...(avisos === undefined
        ? {}
        : { avisarUsoIndevido: (aviso) => avisos.push(aviso) }),
      ...(opcoes.ganchos === undefined ? {} : { ganchos: opcoes.ganchos }),
    },
  };
}

/** O valor de uma coluna nomeada, lido do proprio comando. */
function valorGravado(
  dados: PortaDeTeste,
  indice: number,
  coluna: string,
): string {
  const consulta = dados.escritas[indice];
  assert.ok(consulta !== undefined, `nao houve escrita no indice ${indice}`);

  const colunas = /INSERT INTO \S+ \(([^)]+)\)/.exec(consulta.texto);
  if (colunas !== null) {
    const posicao = (colunas[1] as string)
      .split(', ')
      .findIndex((nome) => nome === coluna);
    assert.ok(posicao >= 0, `a coluna ${coluna} nao esta no comando`);
    return String(consulta.parametros[posicao]);
  }

  const atribuicoes = /SET (.+) WHERE/.exec(consulta.texto);
  assert.ok(atribuicoes !== null, 'o comando nao e insercao nem atualizacao');
  const posicao = (atribuicoes[1] as string)
    .split(', ')
    .findIndex((atribuicao) => atribuicao === `${coluna} = ?`);
  assert.ok(posicao >= 0, `a coluna ${coluna} nao esta no comando`);
  return String(consulta.parametros[posicao]);
}

/** Um `Conteudo` a partir das colunas, para os testes de amostra. */
function conteudo(campos: Partial<Record<string, string | number>>): Conteudo {
  return lerConteudo(linhaDeConteudo(campos));
}

/** As consultas de unicidade que sairam, na ordem. */
function consultasDeUnicidade(dados: PortaDeTeste): Consulta[] {
  return dados.selecoes.filter((consulta) =>
    consulta.texto.startsWith('SELECT post_name'),
  );
}

function parametros(consulta: Consulta | undefined): readonly ValorDeParametro[] {
  assert.ok(consulta !== undefined, 'a consulta esperada nao saiu');
  return consulta.parametros;
}

/* ── CA-3.1: EM RASCUNHO, PENDENTE E RASCUNHO AUTOMATICO, REPETIDO E ACEITO ─ */

test('CA-3.1 os tres estados que dispensam a unicidade sao os do legado', () => {
  // `:4746`, `:5047` e `:5561` — a mesma lista, com `in_array( ..., true )` nas
  // tres, e e por isso que ela e uma constante so.
  assert.deepEqual([...ESTADOS_QUE_DISPENSAM_IDENTIFICADOR], [
    'draft',
    'pending',
    'auto-draft',
  ]);
});

test('CA-3.1 identificador repetido e aceito nos tres estados, sem UMA consulta', () => {
  for (const estado of ESTADOS_QUE_DISPENSAM_IDENTIFICADOR) {
    const { contexto, dados } = cenarioDoIdentificador({
      ocupados: ['titulo-repetido'],
    });

    // `:5561`-`:5565`: a dispensa devolve o identificador **como veio**.
    const resultado = identificadorUnico(contexto, {
      identificadorNaUrl: 'titulo-repetido',
      conteudoId: 0,
      estado,
      tipo: 'post',
      paiId: 0,
    });

    assert.equal(resultado, 'titulo-repetido');
    // A dispensa e observavel tambem na **sequencia de comandos**: nenhuma sai.
    assert.equal(consultasDeUnicidade(dados).length, 0);
  }
});

test('CA-3.1 a dispensa vale tambem para revisao e para solicitacao de dado pessoal', () => {
  // `:5562` — os dois casos que nao sao desta feature e que sao linhas desta
  // funcao. O cenario `@critico` de `PT-002` cobra os quatro juntos: *"a
  // dispensa de unicidade vale tambem para pendente, rascunho automatico,
  // revisao e solicitacao de dado pessoal"*.
  const versao = cenarioDoIdentificador({ ocupados: ['42-revision-v1'] });
  assert.equal(
    identificadorUnico(versao.contexto, {
      identificadorNaUrl: '42-revision-v1',
      conteudoId: 0,
      estado: 'inherit',
      tipo: TIPO_DE_VERSAO,
      paiId: ID_EXISTENTE,
    }),
    '42-revision-v1',
  );
  assert.equal(consultasDeUnicidade(versao.dados).length, 0);

  const solicitacao = cenarioDoIdentificador({ ocupados: ['alguem-exemplo'] });
  assert.equal(
    identificadorUnico(solicitacao.contexto, {
      identificadorNaUrl: 'alguem-exemplo',
      conteudoId: 0,
      estado: 'request-pending',
      tipo: TIPO_DE_SOLICITACAO_DE_DADO_PESSOAL,
      paiId: 0,
    }),
    'alguem-exemplo',
  );
  assert.equal(consultasDeUnicidade(solicitacao.dados).length, 0);
});

test('CA-3.1 `inherit` fora de revisao NAO dispensa: a dispensa e do par', () => {
  // `:5562` — `'inherit' === $post_status && 'revision' === $post_type`. Um
  // anexo em `inherit` passa pela unicidade, e pela consulta do ramo de anexo.
  const { contexto, dados } = cenarioDoIdentificador({
    ocupados: ['arquivo'],
  });

  assert.equal(
    identificadorUnico(contexto, {
      identificadorNaUrl: 'arquivo',
      conteudoId: 0,
      estado: 'inherit',
      tipo: TIPO_DE_ANEXO,
      paiId: ID_EXISTENTE,
    }),
    'arquivo-2',
  );
  assert.ok(consultasDeUnicidade(dados).length > 0);
});

test('CA-3.1 nenhum dos cinco pontos de extensao dispara na dispensa', () => {
  // `:5561` vem ANTES de `:5582`: em rascunho o ponto que curto-circuitaria a
  // geracao nao e nem consultado.
  const pontos: string[] = [];
  const { contexto } = cenarioDoIdentificador({
    ganchos: {
      filtrarIdentificadorAntesDaUnicidade() {
        pontos.push('pre_wp_unique_post_slug');
        return 'o-que-o-interceptador-quis';
      },
      filtrarIdentificadorUnico(identificadorNaUrl) {
        pontos.push('wp_unique_post_slug');
        return identificadorNaUrl;
      },
    },
  });

  assert.equal(
    identificadorUnico(contexto, {
      identificadorNaUrl: 'rascunho',
      conteudoId: 0,
      estado: 'draft',
      tipo: 'post',
      paiId: 0,
    }),
    'rascunho',
  );
  assert.deepEqual(pontos, []);
});

test('CA-3.1 gravar nos tres estados sem identificador grava a coluna vazia', () => {
  // `:4745`-`:4750`: nos tres o campo fica vazio, e e dessa ausencia que o
  // *"muda sozinho"* da publicacao nasce.
  for (const estado of ESTADOS_QUE_DISPENSAM_IDENTIFICADOR) {
    const { contexto, dados } = cenarioDaGravacao();
    gravarConteudo(contexto, { titulo: 'Meu titulo', estado });
    assert.equal(valorGravado(dados, 0, 'post_name'), '');
  }
});

test('CA-3.1 gravar rascunho COM identificador o grava como veio', () => {
  const registroDeSanitizacao: ChamadaDeSanitizacao[] = [];
  const { contexto, dados } = cenarioDaGravacao({
    ocupados: ['ja-usado'],
    registroDeSanitizacao,
  });

  gravarConteudo(contexto, {
    titulo: 'Meu titulo',
    estado: 'draft',
    identificadorNaUrl: 'ja-usado',
  });

  // `:4761` — o informado e **sanitizado** mesmo em rascunho (o que muda em
  // rascunho e a unicidade, nao a sanitizacao).
  assert.equal(valorGravado(dados, 0, 'post_name'), 'ja-usado');
  assert.ok(
    registroDeSanitizacao.some((chamada) => chamada.contexto === 'save'),
    'o informado passa por sanitize_title com contexto `save`',
  );
  assert.equal(consultasDeUnicidade(dados).length, 0);
});

/* ── CA-3.2: NA PUBLICACAO, O IDENTIFICADOR E TORNADO UNICO ────────────────── */

test('CA-3.2 publicar salvando deriva o identificador do titulo', () => {
  // `:4747` — `sanitize_title( $post_title )`, e **so** fora dos tres estados.
  const { contexto, dados } = cenarioDaGravacao();

  gravarConteudo(contexto, { titulo: 'Meu Titulo', estado: 'publish' });

  assert.equal(valorGravado(dados, 0, 'post_name'), 'meu-titulo');
});

test('CA-3.2 o identificador duplicado recebe sufixo, e o primeiro sufixo e 2', () => {
  // `:5615` — `$suffix = 2`. O segundo `meu-titulo` do site e `meu-titulo-2`, e
  // e por isso que o endereco que o autor viu some sem aviso.
  assert.equal(PRIMEIRO_SUFIXO_DO_IDENTIFICADOR, 2);

  const { contexto, dados } = cenarioDaGravacao({ ocupados: ['meu-titulo'] });
  gravarConteudo(contexto, { titulo: 'Meu Titulo', estado: 'publish' });

  assert.equal(valorGravado(dados, 0, 'post_name'), 'meu-titulo-2');
});

test('CA-3.2 o laco continua enquanto a consulta acha, e nao para no primeiro', () => {
  // `:5616`-`:5620` — `do ... while ( $post_name_check )`.
  const { contexto, dados } = cenarioDoIdentificador({
    ocupados: ['t', 't-2', 't-3'],
  });

  assert.equal(
    identificadorUnico(contexto, {
      identificadorNaUrl: 't',
      conteudoId: 0,
      estado: 'publish',
      tipo: 'post',
      paiId: 0,
    }),
    't-4',
  );
  // Uma consulta por tentativa: a do desejado e tres do laco.
  assert.equal(consultasDeUnicidade(dados).length, 4);
});

test('CA-3.2 o identificador `0` encontrado conta como NAO encontrado (verdade de PHP)', () => {
  // `while ( $post_name_check )` (`:5620`) le o valor devolvido pela **verdade
  // de PHP**, e `'0'` e falso la. Um conteudo gravado com `post_name = '0'`
  // nunca provoca sufixo, e nunca e empurrado por um.
  const { contexto, dados } = cenarioDoIdentificador({ ocupados: ['0'] });

  assert.equal(
    identificadorUnico(contexto, {
      identificadorNaUrl: '0',
      conteudoId: 0,
      estado: 'publish',
      tipo: 'post',
      paiId: 0,
    }),
    '0',
  );
  // A consulta **saiu** — a diferenca esta na leitura do que ela devolveu.
  assert.equal(consultasDeUnicidade(dados).length, 1);
});

test('CA-3.2 o ramo plano cobra unicidade dentro do PROPRIO tipo', () => {
  // `:5662` — e o texto do comando e o que a area 3 da Decisao 2 compara.
  const { contexto, dados } = cenarioDoIdentificador({ ocupados: ['t'] });

  identificadorUnico(contexto, {
    identificadorNaUrl: 't',
    conteudoId: ID_EXISTENTE,
    estado: 'publish',
    tipo: 'post',
    paiId: 0,
  });

  const consultas = consultasDeUnicidade(dados);
  assert.equal(consultas[0]?.texto, CONSULTA_PLANA);
  assert.deepEqual([...parametros(consultas[0])], ['t', 'post', ID_EXISTENTE]);
});

test('CA-3.2 o ramo plano le o conteudo mesmo quando o identificador nao e numerico', () => {
  // `:5665` — `get_post( $post_id )` **sem condicao**. A leitura sai em toda
  // gravacao que chega a este ramo, e o resultado dela so e consultado no teste
  // de colisao com arquivo de data.
  const { contexto, dados } = cenarioDoIdentificador();

  identificadorUnico(contexto, {
    identificadorNaUrl: 'nada-numerico',
    conteudoId: ID_EXISTENTE,
    estado: 'publish',
    tipo: 'post',
    paiId: 0,
  });

  assert.ok(
    dados.selecoes.some(
      (consulta) => consulta.texto === 'SELECT * FROM wp_posts WHERE ID = ? LIMIT 1',
    ),
  );
});

test('CA-3.2 o ramo do anexo cobra unicidade em TODA a tabela', () => {
  // `:5598` — sem `post_type` na clausula: *"Attachment slugs must be unique
  // across all types"*.
  const { contexto, dados } = cenarioDoIdentificador({ ocupados: ['arquivo'] });

  assert.equal(
    identificadorUnico(contexto, {
      identificadorNaUrl: 'arquivo',
      conteudoId: ID_EXISTENTE,
      estado: 'publish',
      tipo: TIPO_DE_ANEXO,
      paiId: 0,
    }),
    'arquivo-2',
  );

  const consultas = consultasDeUnicidade(dados);
  assert.equal(consultas[0]?.texto, CONSULTA_DE_ANEXO);
  assert.deepEqual([...parametros(consultas[0])], ['arquivo', ID_EXISTENTE]);
});

test('CA-3.2 o ramo hierarquico cobra unicidade dentro da propria arvore', () => {
  // `:5632` — com `post_parent` na clausula e `attachment` no `IN`: *"Pages are
  // in a separate namespace than posts so page slugs are allowed to overlap
  // post slugs"*.
  const { contexto, dados } = cenarioDoIdentificador({ ocupados: ['sobre'] });

  assert.equal(
    identificadorUnico(contexto, {
      identificadorNaUrl: 'sobre',
      conteudoId: ID_EXISTENTE,
      estado: 'publish',
      tipo: TIPO_DE_PAGINA,
      paiId: 9,
    }),
    'sobre-2',
  );

  const consultas = consultasDeUnicidade(dados);
  assert.equal(consultas[0]?.texto, CONSULTA_HIERARQUICA);
  assert.deepEqual(
    [...parametros(consultas[0])],
    ['sobre', TIPO_DE_PAGINA, ID_EXISTENTE, 9],
  );
});

test('CA-3.2 item de menu devolve o identificador sem consultar, e DEPOIS do ponto 1', () => {
  // `:5624`-`:5625` — a sexta dispensa, e ela e mais tarde que as outras: o
  // ponto `pre_wp_unique_post_slug` **dispara** para item de menu.
  const pontos: string[] = [];
  const { contexto, dados } = cenarioDoIdentificador({
    hierarquico: true,
    ocupados: ['item'],
    ganchos: {
      filtrarIdentificadorAntesDaUnicidade() {
        pontos.push('pre_wp_unique_post_slug');
        return null;
      },
    },
  });

  assert.equal(
    identificadorUnico(contexto, {
      identificadorNaUrl: 'item',
      conteudoId: 0,
      estado: 'publish',
      tipo: TIPO_DE_ITEM_DE_MENU,
      paiId: 0,
    }),
    'item',
  );
  assert.deepEqual(pontos, ['pre_wp_unique_post_slug']);
  assert.equal(consultasDeUnicidade(dados).length, 0);
});

test('CA-3.2 nome de feed e `embed` forcam sufixo mesmo sem colisao', () => {
  // `:5612`, `:5648` e `:5704` — sao enderecos que o roteador reserva.
  for (const reservado of [...FEEDS_DE_FABRICA, 'embed']) {
    const { contexto } = cenarioDoIdentificador();
    assert.equal(
      identificadorUnico(contexto, {
        identificadorNaUrl: reservado,
        conteudoId: 0,
        estado: 'publish',
        tipo: 'post',
        paiId: 0,
      }),
      `${reservado}-2`,
    );
  }
});

test('CA-3.2 no ramo hierarquico, numero e numero com a base de paginacao colidem', () => {
  // `:5649` — `@^(page)?\d+$@`.
  for (const identificador of ['2', 'page2']) {
    const { contexto } = cenarioDoIdentificador({ hierarquico: true });
    assert.equal(
      identificadorUnico(contexto, {
        identificadorNaUrl: identificador,
        conteudoId: 0,
        estado: 'publish',
        tipo: TIPO_DE_PAGINA,
        paiId: 0,
      }),
      `${identificador}-2`,
    );
  }

  // E `pagina2` nao colide: a base de fabrica e `page`.
  const { contexto } = cenarioDoIdentificador({ hierarquico: true });
  assert.equal(
    identificadorUnico(contexto, {
      identificadorNaUrl: 'pagina2',
      conteudoId: 0,
      estado: 'publish',
      tipo: TIPO_DE_PAGINA,
      paiId: 0,
    }),
    'pagina2',
  );
});

test('CA-3.2 a colisao com arquivo de data depende da estrutura de links', () => {
  // `:5667`-`:5690`, e as tres posicoes que o comentario do legado nomeia.
  const semEstrutura = cenarioDoIdentificador({ linha: null });
  assert.equal(
    identificadorUnico(semEstrutura.contexto, {
      identificadorNaUrl: '2026',
      conteudoId: 0,
      estado: 'publish',
      tipo: 'post',
      paiId: 0,
    }),
    '2026',
    'em instalacao de fabrica a estrutura e vazia, logo nenhum numero colide',
  );

  const comNomeNaPrimeiraPosicao = cenarioDoIdentificador({
    linha: null,
    estruturaDeLinks: '/%postname%/',
  });
  assert.equal(
    identificadorUnico(comNomeNaPrimeiraPosicao.contexto, {
      identificadorNaUrl: '2026',
      conteudoId: 0,
      estado: 'publish',
      tipo: 'post',
      paiId: 0,
    }),
    '2026-2',
    'numero na primeira posicao poderia ser ano',
  );

  const depoisDoAno = cenarioDoIdentificador({
    linha: null,
    estruturaDeLinks: '/%year%/%postname%/',
  });
  assert.equal(
    identificadorUnico(depoisDoAno.contexto, {
      identificadorNaUrl: '12',
      conteudoId: 0,
      estado: 'publish',
      tipo: 'post',
      paiId: 0,
    }),
    '12-2',
    'depois de %year%, numero menor que 13 conflita com o mes',
  );
  assert.equal(
    identificadorUnico(
      cenarioDoIdentificador({ linha: null, estruturaDeLinks: '/%year%/%postname%/' })
        .contexto,
      {
        identificadorNaUrl: '13',
        conteudoId: 0,
        estado: 'publish',
        tipo: 'post',
        paiId: 0,
      },
    ),
    '13',
    'e 13 nao conflita: a borda do legado e `13 > $slug_num`',
  );

  const depoisDoMes = cenarioDoIdentificador({
    linha: null,
    estruturaDeLinks: '/%year%/%monthnum%/%postname%/',
  });
  assert.equal(
    identificadorUnico(depoisDoMes.contexto, {
      identificadorNaUrl: '31',
      conteudoId: 0,
      estado: 'publish',
      tipo: 'post',
      paiId: 0,
    }),
    '31-2',
    'depois de %monthnum%, numero menor que 32 conflita com o dia',
  );
});

test('CA-3.2 o zero nao colide com arquivo de data, e o tipo pagina nunca colide', () => {
  // `:5672` — `if ( $slug_num )` descarta `'0'`, `'00'` e `'0000'`; `:5669`
  // exige `'post' === $post_type`.
  const zero = cenarioDoIdentificador({
    linha: null,
    estruturaDeLinks: '/%postname%/',
  });
  assert.equal(
    identificadorUnico(zero.contexto, {
      identificadorNaUrl: '00',
      conteudoId: 0,
      estado: 'publish',
      tipo: 'post',
      paiId: 0,
    }),
    '00',
  );

  const pagina = cenarioDoIdentificador({
    linha: null,
    estruturaDeLinks: '/%postname%/',
    hierarquico: false,
  });
  assert.equal(
    identificadorUnico(pagina.contexto, {
      identificadorNaUrl: '2026',
      conteudoId: 0,
      estado: 'publish',
      tipo: 'produto',
      paiId: 0,
    }),
    '2026',
    'o arquivo de data existe so para o tipo `post`',
  );
});

test('CA-3.2 o conteudo que JA tem aquele identificador nao colide com data', () => {
  // `:5669` — `( ! $post || $post->post_name !== $slug )`: o endereco gravado se
  // conserva, e a colisao e verificada so para endereco novo.
  const { contexto } = cenarioDoIdentificador({
    linha: linhaDeConteudo({ post_name: '2026' }),
    estruturaDeLinks: '/%postname%/',
  });

  assert.equal(
    identificadorUnico(contexto, {
      identificadorNaUrl: '2026',
      conteudoId: ID_EXISTENTE,
      estado: 'publish',
      tipo: 'post',
      paiId: 0,
    }),
    '2026',
  );
});

test('CA-3.2 o truncamento desconta o tamanho do sufixo em digitos', () => {
  // `:5617` — `200 - ( strlen( $suffix ) + 1 )`. Ao passar de `-9` para `-10` o
  // identificador base encolhe um caractere: o endereco do centesimo homonimo
  // nao e o do nono com outro numero.
  assert.equal(TAMANHO_MAXIMO_DO_IDENTIFICADOR, 200);

  const base200 = 'a'.repeat(TAMANHO_MAXIMO_DO_IDENTIFICADOR);
  const ocupados = [base200];
  for (let sufixo = 2; sufixo <= 10; sufixo += 1) {
    const corte = TAMANHO_MAXIMO_DO_IDENTIFICADOR - (String(sufixo).length + 1);
    ocupados.push(`${base200.slice(0, corte)}-${sufixo}`);
  }

  const { contexto } = cenarioDoIdentificador({ ocupados });
  const resultado = identificadorUnico(contexto, {
    identificadorNaUrl: base200,
    conteudoId: 0,
    estado: 'publish',
    tipo: 'post',
    paiId: 0,
  });

  // O 11 tem dois digitos, logo o corte e 200 - 3.
  assert.equal(resultado, `${base200.slice(0, 197)}-11`);
  assert.equal(resultado.length, TAMANHO_MAXIMO_DO_IDENTIFICADOR);
});

test('CA-3.2 o hifen do fim cai antes do sufixo (rtrim do legado)', () => {
  // `_truncate_post_slug()` (`:5755`) faz `rtrim( $slug, '-' )` nos **tres**
  // ramos, inclusive quando o identificador cabe: `titulo-` mais sufixo da
  // `titulo-2`, e nao `titulo--2`.
  const { contexto } = cenarioDoIdentificador({ ocupados: ['titulo-'] });

  assert.equal(
    identificadorUnico(contexto, {
      identificadorNaUrl: 'titulo-',
      conteudoId: 0,
      estado: 'publish',
      tipo: 'post',
      paiId: 0,
    }),
    'titulo-2',
  );
});

test('CA-3.2 a SEGUNDA escrita grava o identificador quando a coluna ficou vazia', () => {
  // `:5047`-`:5052`. Acontece **depois** do `INSERT`, e por isso e a unica
  // chamada a `wp_unique_post_slug()` que recebe um identificador de conteudo
  // real. O titulo daqui sanitiza para vazio, logo a reserva — o proprio
  // identificador — e o que vai para a coluna.
  const { contexto, dados } = cenarioDaGravacao();

  const resultado = gravarConteudo(contexto, {
    titulo: '!!!',
    estado: 'publish',
  });

  assert.equal(valorGravado(dados, 0, 'post_name'), '');
  assert.equal(
    dados.escritas[1]?.texto,
    'UPDATE wp_posts SET post_name = ? WHERE ID = ?',
  );
  assert.deepEqual([...parametros(dados.escritas[1])], [
    String(ID_GERADO),
    ID_GERADO,
  ]);
  // O resultado devolve o identificador **da coluna**, nao o do filtro de dados.
  assert.equal(resultado.identificadorNaUrl, String(ID_GERADO));
  assert.equal(resultado.colunas?.post_name, String(ID_GERADO));
});

test('CA-3.2 a segunda escrita NAO acontece nos tres estados que dispensam', () => {
  // `:5047` — a mesma lista de novo.
  for (const estado of ESTADOS_QUE_DISPENSAM_IDENTIFICADOR) {
    const { contexto, dados } = cenarioDaGravacao();
    gravarConteudo(contexto, { titulo: '!!!', estado });

    assert.equal(valorGravado(dados, 0, 'post_name'), '');
    assert.equal(
      dados.escritas.length,
      1,
      `${estado} nao provoca a segunda escrita`,
    );
  }
});

test('CA-3.2 um interceptador que esvazie a coluna provoca a segunda escrita', () => {
  // A pergunta de `:5047` e sobre `$data['post_name']` — o valor **depois** do
  // filtro de dados —, e e por isso que ela nao e redundante com o passo 18.
  const { contexto, dados } = cenarioDaGravacao({
    ganchos: {
      filtrarDadosDoConteudo: (colunas) => ({ ...colunas, post_name: '' }),
    },
  });

  gravarConteudo(contexto, { titulo: 'Meu Titulo', estado: 'publish' });

  assert.equal(valorGravado(dados, 0, 'post_name'), '');
  assert.equal(
    dados.escritas[1]?.texto,
    'UPDATE wp_posts SET post_name = ? WHERE ID = ?',
  );
  // E o valor da segunda escrita vem do **titulo**, nao do que o filtro apagou.
  assert.equal(valorGravado(dados, 1, 'post_name'), 'meu-titulo');
});

test('CA-3.2 o identificador do rascunho muda sozinho ao publicar salvando (P5)', () => {
  // O cenario `@critico` de `PT-002`, na ordem dele: *"dois rascunhos com o
  // mesmo slug"* → *"as duas metades aceitam o slug duplicado"* → *"quando um
  // deles e publicado, o slug dele muda sozinho"*.
  const rascunho = cenarioDaGravacao({ ocupados: ['mesmo-slug'] });
  gravarConteudo(rascunho.contexto, {
    titulo: 'Mesmo slug',
    estado: 'draft',
    identificadorNaUrl: 'mesmo-slug',
  });
  assert.equal(valorGravado(rascunho.dados, 0, 'post_name'), 'mesmo-slug');

  const publicacao = cenarioDaGravacao({
    ocupados: ['mesmo-slug'],
    linha: linhaDeConteudo({ post_name: 'mesmo-slug', post_status: 'draft' }),
  });
  gravarConteudo(publicacao.contexto, {
    id: ID_EXISTENTE,
    titulo: 'Mesmo slug',
    estado: 'publish',
    identificadorNaUrl: 'mesmo-slug',
  });
  assert.equal(valorGravado(publicacao.dados, 0, 'post_name'), 'mesmo-slug-2');
});

test('CA-3.2 os cinco pontos de extensao da unicidade, na ordem e com os argumentos', () => {
  // A tabela do cabecalho de `identificador-na-url.ts`, afirmada: o ponto 1
  // curto-circuita, o do ramo forca o sufixo, e o ultimo recebe o original.
  const pontos: string[] = [];
  const argumentosDoFinal: unknown[] = [];

  const curtoCircuito = cenarioDoIdentificador({
    ganchos: {
      filtrarIdentificadorAntesDaUnicidade: () => 'escolhido-pela-extensao',
      filtrarIdentificadorUnico: (identificadorNaUrl) => {
        pontos.push('wp_unique_post_slug');
        return identificadorNaUrl;
      },
    },
  });
  assert.equal(
    identificadorUnico(curtoCircuito.contexto, {
      identificadorNaUrl: 't',
      conteudoId: 0,
      estado: 'publish',
      tipo: 'post',
      paiId: 0,
    }),
    'escolhido-pela-extensao',
  );
  // `:5583` — o curto-circuito salta **tudo**, inclusive o ponto final.
  assert.deepEqual(pontos, []);
  assert.equal(consultasDeUnicidade(curtoCircuito.dados).length, 0);

  // O ponto do ramo plano forca o sufixo sem colisao nenhuma (`:5701`).
  const ruim = cenarioDoIdentificador({
    ganchos: { filtrarIdentificadorRuimPlano: () => true },
  });
  assert.equal(
    identificadorUnico(ruim.contexto, {
      identificadorNaUrl: 't',
      conteudoId: 0,
      estado: 'publish',
      tipo: 'post',
      paiId: 0,
    }),
    't-2',
  );

  // O ponto final recebe as duas versoes (`:5730`).
  const finais = cenarioDoIdentificador({
    ocupados: ['t'],
    ganchos: {
      filtrarIdentificadorUnico(...argumentos) {
        argumentosDoFinal.push(...argumentos);
        return 'a-palavra-final';
      },
    },
  });
  assert.equal(
    identificadorUnico(finais.contexto, {
      identificadorNaUrl: 't',
      conteudoId: ID_EXISTENTE,
      estado: 'publish',
      tipo: 'post',
      paiId: 5,
    }),
    'a-palavra-final',
  );
  assert.deepEqual(argumentosDoFinal, [
    't-2',
    ID_EXISTENTE,
    'publish',
    'post',
    5,
    't',
  ]);
});

test('CA-3.2 o ponto 1 para a geracao tambem quando devolve cadeia vazia', () => {
  // `:5583` — o teste e `null !== $override_slug`, e **nao** a verdade de PHP.
  const { contexto, dados } = cenarioDoIdentificador({ ocupados: ['t'] });
  const comVazio = {
    ...contexto,
    ganchos: { filtrarIdentificadorAntesDaUnicidade: () => '' },
  };

  assert.equal(
    identificadorUnico(comVazio, {
      identificadorNaUrl: 't',
      conteudoId: 0,
      estado: 'publish',
      tipo: 'post',
      paiId: 0,
    }),
    '',
  );
  assert.equal(consultasDeUnicidade(dados).length, 0);
});

test('CA-3.2 o ramo de compatibilidade conserva o identificador gravado por versao antiga', () => {
  // `:4752`-`:4759`, e o curto-circuito do `&&`: a terceira condicao e uma
  // **leitura**, e ela nao acontece quando a segunda falha.
  const registroDeSanitizacao: ChamadaDeSanitizacao[] = [];
  const conservado = cenarioDoIdentificador({
    linha: linhaDeConteudo({ post_name: 'titulo-anterior' }),
    registroDeSanitizacao,
  });

  assert.equal(
    identificadorValido(conservado.contexto.texto, conservado.contexto.repositorio, {
      identificadorNaUrl: 'titulo-anterior',
      titulo: 'outro titulo',
      estado: 'publish',
      atualizacao: true,
      conteudoId: ID_EXISTENTE,
    }),
    'titulo-anterior',
  );
  // A sanitizacao antiga e calculada antes do `if`, com o contexto `old-save`.
  assert.deepEqual(registroDeSanitizacao, [
    { titulo: 'titulo-anterior', reserva: '', contexto: 'old-save' },
  ]);
  // E a leitura da terceira condicao saiu.
  assert.equal(conservado.dados.selecoes.length, 1);

  // Na **insercao** a leitura nao sai: a primeira condicao do `&&` e `$update`.
  const insercao = cenarioDoIdentificador({ registroDeSanitizacao: [] });
  identificadorValido(insercao.contexto.texto, insercao.contexto.repositorio, {
    identificadorNaUrl: 'titulo-anterior',
    titulo: 'outro titulo',
    estado: 'publish',
    atualizacao: false,
    conteudoId: 0,
  });
  assert.equal(insercao.dados.selecoes.length, 0);
});

test('CA-3.2 `urlencode` do PHP nao e `encodeURIComponent`', () => {
  // A comparacao de `:4756` e sobre o resultado dele, logo cada divergencia
  // conservaria um identificador que o legado reescreveria, ou o contrario.
  assert.equal(urlencodeComoNoPhp('a b'), 'a+b');
  assert.equal(urlencodeComoNoPhp("til~e'aspas(1)"), 'til%7Ee%27aspas%281%29');
  assert.equal(urlencodeComoNoPhp('acentuado-ç'), 'acentuado-%C3%A7');
  assert.equal(urlencodeComoNoPhp('ja-sanitizado-1.0_x'), 'ja-sanitizado-1.0_x');
});

/* ── CA-3.3: O AUTOR E INFORMADO QUANDO O IDENTIFICADOR MUDA ───────────────── */

test('CA-3.3 a gravacao devolve o identificador pedido e o gravado, lado a lado', () => {
  const { contexto } = cenarioDaGravacao({ ocupados: ['meu-titulo'] });

  const resultado = gravarConteudo(contexto, {
    titulo: 'Meu Titulo',
    estado: 'publish',
    identificadorNaUrl: 'meu-titulo',
  });

  assert.equal(resultado.identificadorPedido, 'meu-titulo');
  assert.equal(resultado.identificadorNaUrl, 'meu-titulo-2');
  assert.equal(identificadorMudouNaGravacao(resultado), true);
});

test('CA-3.3 sem colisao o identificador nao muda, e a comparacao diz isso', () => {
  const { contexto } = cenarioDaGravacao();

  const resultado = gravarConteudo(contexto, {
    titulo: 'Meu Titulo',
    estado: 'publish',
    identificadorNaUrl: 'meu-titulo',
  });

  assert.equal(identificadorMudouNaGravacao(resultado), false);
});

test('CA-3.3 nos tres desfechos de falha nao ha identificador a comparar', () => {
  // Nos tres o legado devolve `0` ou um `WP_Error` e **nenhum registro**.
  const { contexto } = cenarioDaGravacao({ linha: null });

  const inexistente = gravarConteudo(contexto, {
    id: ID_EXISTENTE,
    titulo: 't',
    identificadorNaUrl: 'queria-este',
  });

  assert.equal(inexistente.desfecho, 'inexistente');
  assert.equal(inexistente.identificadorPedido, '');
  assert.equal(inexistente.identificadorNaUrl, '');
  assert.equal(identificadorMudouNaGravacao(inexistente), false);
});

test('CA-3.3 o endereco de amostra finge publicado e JA traz o sufixo', () => {
  // `wp-admin/includes/post.php:1493`-`:1507`: o truque que faz o autor ver
  // `titulo-2` **antes** de publicar, em vez de descobrir pelo endereco
  // quebrado.
  const { contexto, dados } = cenarioDoIdentificador({
    ocupados: ['meu-titulo'],
    linha: null,
  });

  const amostra = identificadorDeAmostra(contexto, {
    conteudo: conteudo({
      post_status: 'draft',
      post_name: '',
      post_title: 'Meu Titulo',
    }),
  });

  assert.equal(amostra, 'meu-titulo-2');
  // E a consulta saiu, apesar de o conteudo estar em rascunho: e o estado
  // **fingido** que a unicidade ve.
  assert.ok(consultasDeUnicidade(dados).length > 0);
});

test('CA-3.3 os quatro estados do truque incluem o agendado', () => {
  // `:1493` — `auto-draft`, `draft`, `pending` e **`future`**. A lista nao e a
  // dos tres que dispensam unicidade, e usar aquela daria o endereco errado
  // para todo conteudo agendado.
  assert.deepEqual([...ESTADOS_SEM_ENDERECO_SERVIDO], [
    'auto-draft',
    'draft',
    'pending',
    'future',
  ]);

  for (const estado of ESTADOS_SEM_ENDERECO_SERVIDO) {
    const { contexto } = cenarioDoIdentificador({
      ocupados: ['meu-titulo'],
      linha: null,
    });
    assert.equal(
      identificadorDeAmostra(contexto, {
        conteudo: conteudo({
          post_status: estado,
          post_name: '',
          post_title: 'Meu Titulo',
        }),
      }),
      'meu-titulo-2',
    );
  }
});

test('CA-3.3 o identificador informado na amostra vence, e o vazio cai no titulo', () => {
  // `:1503`-`:1505`, e a pergunta e `! is_null( $name )`: informar cadeia vazia
  // **nao** e o mesmo que nao informar — *"if empty name is supplied -- use the
  // title instead, see #6072"*.
  const { contexto } = cenarioDoIdentificador({ linha: null });
  const rascunho = conteudo({
    post_status: 'draft',
    post_name: 'gravado',
    post_title: 'Titulo Gravado',
  });

  assert.equal(
    identificadorDeAmostra(contexto, {
      conteudo: rascunho,
      identificadorNaUrl: 'Escolhido Agora',
    }),
    'escolhido-agora',
  );

  assert.equal(
    identificadorDeAmostra(contexto, {
      conteudo: rascunho,
      titulo: 'Titulo Digitado',
      identificadorNaUrl: '',
    }),
    'titulo-digitado',
  );

  assert.equal(
    identificadorDeAmostra(contexto, { conteudo: rascunho }),
    'gravado',
    'sem informar nada, o gravado se conserva',
  );
});

test('CA-3.3 a amostra usa o identificador do conteudo como reserva da sanitizacao', () => {
  // `:1495` — `sanitize_title( ..., $post->ID )`: titulo que sanitiza para
  // vazio recebe o proprio identificador numerico como endereco.
  const { contexto } = cenarioDoIdentificador({ linha: null });

  assert.equal(
    identificadorDeAmostra(contexto, {
      conteudo: conteudo({ post_status: 'draft', post_name: '', post_title: '!!!' }),
    }),
    String(ID_EXISTENTE),
  );
});

test('CA-3.3 o ponto `editable_slug` e o ultimo valor que o autor ve', () => {
  // `:1534`.
  const { contexto } = cenarioDoIdentificador({ linha: null });
  const vistos: string[] = [];

  assert.equal(
    identificadorDeAmostra(
      contexto,
      {
        conteudo: conteudo({
          post_status: 'draft',
          post_name: 'gravado',
          post_title: 'Titulo',
        }),
      },
      {
        filtrarIdentificadorEditavel(identificadorNaUrl) {
          vistos.push(identificadorNaUrl);
          return 'o-que-a-tela-mostra';
        },
      },
    ),
    'o-que-a-tela-mostra',
  );
  assert.deepEqual(vistos, ['gravado']);
});

test('CA-3.3 a amostra nao escreve nada', () => {
  const { contexto, dados } = cenarioDoIdentificador({ linha: null });

  identificadorDeAmostra(contexto, {
    conteudo: conteudo({ post_status: 'draft', post_name: '', post_title: 'T' }),
  });

  assert.deepEqual(dados.escritas, []);
});

/* ── CA-3.4: EM PENDENTE DE QUEM NAO PODE PUBLICAR, O CAMPO FICA VAZIO ─────── */

test('CA-3.4 inserir pendente sem a capacidade de publicar esvazia o identificador', () => {
  // `:4734` — a primitiva, e a decisao e sobre o ator do contexto.
  const { contexto, dados } = cenarioDaGravacao({
    ator: atorCom('edit_posts'),
  });

  gravarConteudo(contexto, {
    titulo: 'Meu Titulo',
    estado: ESTADO_EM_REVISAO,
    identificadorNaUrl: 'endereco-que-eu-queria',
  });

  assert.equal(valorGravado(dados, 0, 'post_name'), '');
  // E **nenhuma** reserva acontece: o pendente dispensa unicidade, logo nem
  // consulta sai.
  assert.equal(consultasDeUnicidade(dados).length, 0);
});

test('CA-3.4 quem PODE publicar e ainda assim submete mantem o identificador', () => {
  // `:4734`, o outro lado da mesma condicao. UC-06, fluxo alternativo: *"a
  // regra do slug vazio so vale para quem nao pode publicar"*.
  const { contexto, dados } = cenarioDaGravacao({
    ator: atorCom('edit_posts', 'publish_posts'),
  });

  gravarConteudo(contexto, {
    titulo: 'Meu Titulo',
    estado: ESTADO_EM_REVISAO,
    identificadorNaUrl: 'endereco-escolhido',
  });

  assert.equal(valorGravado(dados, 0, 'post_name'), 'endereco-escolhido');
});

test('CA-3.4 a capacidade cobrada e a do TIPO, nao a cadeia `publish_posts`', () => {
  // `$post_type_object->cap->publish_posts` e um **slot**: para `page` o valor e
  // `publish_pages`, e e por isso que publicar pagina nao se faz com capacidade
  // de post sem um unico `if` sobre o nome `page`.
  const comCapacidadeDePost = cenarioDaGravacao({
    ator: atorCom('publish_posts'),
  });
  gravarConteudo(comCapacidadeDePost.contexto, {
    titulo: 'Sobre',
    tipo: TIPO_DE_PAGINA,
    estado: ESTADO_EM_REVISAO,
    identificadorNaUrl: 'sobre',
  });
  assert.equal(valorGravado(comCapacidadeDePost.dados, 0, 'post_name'), '');

  const comCapacidadeDePagina = cenarioDaGravacao({
    ator: atorCom('publish_pages'),
  });
  gravarConteudo(comCapacidadeDePagina.contexto, {
    titulo: 'Sobre',
    tipo: TIPO_DE_PAGINA,
    estado: ESTADO_EM_REVISAO,
    identificadorNaUrl: 'sobre',
  });
  assert.equal(valorGravado(comCapacidadeDePagina.dados, 0, 'post_name'), 'sobre');
});

test('CA-3.4 inserir pendente de tipo NAO registrado conserva o identificador', () => {
  // `:4734` — `! $update && $post_type_object && ...`: com o objeto de tipo
  // falso a conjuncao inteira cai, ninguem pergunta nada e o campo fica como
  // veio. E a assimetria com a atualizacao, que degrada para a capacidade mais
  // alta.
  const { contexto, dados } = cenarioDaGravacao({
    ator: atorCom('edit_posts'),
    tipoRegistrado: false,
  });

  gravarConteudo(contexto, {
    titulo: 'Meu Titulo',
    tipo: 'tipo-de-extensao',
    estado: ESTADO_EM_REVISAO,
    identificadorNaUrl: 'endereco-que-eu-queria',
  });

  assert.equal(valorGravado(dados, 0, 'post_name'), 'endereco-que-eu-queria');
});

test('CA-3.4 atualizar pendente pergunta pela META-capacidade, com o objeto', () => {
  // `:4736` — `current_user_can( 'publish_post', $post_id )`, que passa por
  // `map_meta_cap()` e resolve pelo tipo **da linha**.
  const semCapacidade = cenarioDaGravacao({
    ator: atorCom('edit_posts'),
    linha: linhaDeConteudo({ post_status: 'draft' }),
  });
  gravarConteudo(semCapacidade.contexto, {
    id: ID_EXISTENTE,
    titulo: 'Meu Titulo',
    estado: ESTADO_EM_REVISAO,
    identificadorNaUrl: 'endereco-que-eu-queria',
  });
  assert.equal(valorGravado(semCapacidade.dados, 0, 'post_name'), '');

  const comCapacidade = cenarioDaGravacao({
    ator: atorCom('publish_posts'),
    linha: linhaDeConteudo({ post_status: 'draft' }),
  });
  gravarConteudo(comCapacidade.contexto, {
    id: ID_EXISTENTE,
    titulo: 'Meu Titulo',
    estado: ESTADO_EM_REVISAO,
    identificadorNaUrl: 'endereco-escolhido',
  });
  assert.equal(
    valorGravado(comCapacidade.dados, 0, 'post_name'),
    'endereco-escolhido',
  );
});

test('CA-3.4 fora de `pending` nada e esvaziado e nada e perguntado', () => {
  // `:4731` — a regra existe **so** em pendente.
  for (const estado of ['draft', 'publish', 'private', 'future']) {
    const { contexto, dados } = cenarioDaGravacao({
      ator: atorCom('edit_posts'),
    });

    gravarConteudo(contexto, {
      titulo: 'Meu Titulo',
      estado,
      identificadorNaUrl: 'endereco-escolhido',
    });

    assert.equal(
      valorGravado(dados, 0, 'post_name'),
      'endereco-escolhido',
      `${estado} nao perde o identificador`,
    );
  }
});

test('CA-3.4 o `case publish_post` resolve o slot do tipo e fecha a porta nos erros', () => {
  // `capabilities.php:382`-`:423`, os quatro ramos.
  const avisos: AvisoDeUsoIndevido[] = [];
  const caso = casoDePublicacaoDeConteudo(
    {
      conteudo: (referencia) =>
        referencia === ID_EXISTENTE ? { tipo: TIPO_DE_PAGINA } : null,
      tipoDeConteudo: (nome) =>
        nome === TIPO_DE_PAGINA
          ? {
              nome,
              traduzMetaCapacidade: true,
              capacidades: { publish_posts: 'publish_pages' },
            }
          : null,
    },
    (aviso) => avisos.push(aviso),
  );

  const pedido = {
    capacidade: CAPACIDADE_DE_PUBLICAR_ESTE_CONTEUDO,
    contaId: 3,
    constantes: {},
    emRede: false,
  };

  // Ramo 4: o slot do tipo.
  assert.deepEqual(caso({ ...pedido, argumentos: [ID_EXISTENTE] }), [
    'publish_pages',
  ]);

  // Ramo 1: sem objeto, nega e avisa.
  assert.deepEqual(caso({ ...pedido, argumentos: [] }), [CAPACIDADE_NEGADA]);
  assert.deepEqual(avisos, [AVISO_DE_PUBLICACAO_SEM_OBJETO]);

  // Ramo 2: conteudo inexistente nega, e **sem** aviso.
  assert.deepEqual(caso({ ...pedido, argumentos: [999] }), [CAPACIDADE_NEGADA]);
  assert.equal(avisos.length, 1);

  // Outra capacidade segue para o caso seguinte.
  assert.equal(caso({ ...pedido, capacidade: 'edit_post', argumentos: [ID_EXISTENTE] }), null);
});

test('CA-3.4 atualizar pendente de tipo nao registrado exige a capacidade mais alta', () => {
  // `capabilities.php:421` — o ramo 3 **nao nega**: ele exige
  // `edit_others_posts`, logo um editor passa e um colaborador nao. E o aviso
  // de uso indevido sai, sem que nenhuma decisao dependa dele (P7).
  const avisos: AvisoDeUsoIndevido[] = [];
  const editor = cenarioDaGravacao({
    ator: atorCom('edit_others_posts'),
    tipoRegistrado: false,
    linha: linhaDeConteudo({ post_type: 'tipo-de-extensao', post_status: 'draft' }),
    avisos,
  });
  gravarConteudo(editor.contexto, {
    id: ID_EXISTENTE,
    titulo: 'Meu Titulo',
    tipo: 'tipo-de-extensao',
    estado: ESTADO_EM_REVISAO,
    identificadorNaUrl: 'endereco-escolhido',
  });
  assert.equal(valorGravado(editor.dados, 0, 'post_name'), 'endereco-escolhido');
  assert.equal(avisos.length, 1);
  assert.match(avisos[0]?.mensagem ?? '', /is not registered/);

  const colaborador = cenarioDaGravacao({
    ator: atorCom('edit_posts'),
    tipoRegistrado: false,
    linha: linhaDeConteudo({ post_type: 'tipo-de-extensao', post_status: 'draft' }),
  });
  gravarConteudo(colaborador.contexto, {
    id: ID_EXISTENTE,
    titulo: 'Meu Titulo',
    tipo: 'tipo-de-extensao',
    estado: ESTADO_EM_REVISAO,
    identificadorNaUrl: 'endereco-escolhido',
  });
  assert.equal(valorGravado(colaborador.dados, 0, 'post_name'), '');
});

test('CA-3.4 a decisao usa a capacidade de QUEM GRAVOU, e duas nao se misturam', () => {
  // O cenario `@concorrencia` de `PT-002`: *"a decisao sobre o slug de cada um
  // usa a capacidade de quem o gravou"*. Nada deste modulo guarda estado, logo a
  // ordem das chamadas nao muda nenhuma delas.
  const matrizCompartilhada: BaseDeAutorizacao = {
    matriz: [
      {
        identificador: 'colaborador',
        capacidades: [{ capacidade: 'edit_posts', concedida: true }],
      },
      {
        identificador: 'autor',
        capacidades: [{ capacidade: 'publish_posts', concedida: true }],
      },
    ],
    rede: REDE_INATIVA_NA_AUTORIZACAO,
  };

  const comoColaborador = cenarioDaGravacao({
    base: matrizCompartilhada,
    ator: {
      contaId: 11,
      login: 'colaboradora',
      existe: true,
      concessoes: [{ capacidade: 'colaborador', concedida: true }],
    },
  });
  const comoAutor = cenarioDaGravacao({
    base: matrizCompartilhada,
    ator: {
      contaId: 22,
      login: 'autora',
      existe: true,
      concessoes: [{ capacidade: 'autor', concedida: true }],
    },
  });

  gravarConteudo(comoColaborador.contexto, {
    titulo: 'Meu Titulo',
    estado: ESTADO_EM_REVISAO,
    identificadorNaUrl: 'endereco',
  });
  gravarConteudo(comoAutor.contexto, {
    titulo: 'Meu Titulo',
    estado: ESTADO_EM_REVISAO,
    identificadorNaUrl: 'endereco',
  });

  assert.equal(valorGravado(comoColaborador.dados, 0, 'post_name'), '');
  assert.equal(valorGravado(comoAutor.dados, 0, 'post_name'), 'endereco');
});
