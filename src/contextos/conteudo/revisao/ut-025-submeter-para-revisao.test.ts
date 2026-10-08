/**
 * A entrega de **T016**: *"8 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-025-1, UT-025-2, UT-025-3, UT-025-4,
 * UT-025-5, UT-025-6, UT-025-7, UT-025-8), com o mesmo dado de entrada, acao e
 * resultado esperado. Os 2 testes de regra de negocio (UT-025-7, UT-025-8)
 * entram na mesma suite."*
 *
 * ✅ **O catalogo EXISTE nesta arvore, e os oito casos foram COPIADOS dele, nao
 * reconstruidos.** A tabela de `REQ-025` em `backlog/tests.md` — *"`must` ·
 * `pronto` · veredito `aprovado` · 6 de 6 critérios de aceite cobertos"* — da
 * os oito casos com nome, tipo e prova, e e ela que esta transcrita abaixo:
 *
 * | caso | tipo | nome no catalogo | prova que o catalogo cita |
 * |---|---|---|---|
 * | `UT-025-1` | `feliz` | envia para pendente o conteudo de quem escreve e nao publica | CA-7.1 |
 * | `UT-025-2` | `feliz` | apresenta o pendente na fila de quem pode publicar aquele tipo | CA-7.2 |
 * | `UT-025-3` | `feliz` | mantem o pendente fora de toda consulta publica | CA-7.3 |
 * | `UT-025-4` | `borda` | deixa vazio o identificador de quem nao pode publicar | CA-7.4 |
 * | `UT-025-5` | `feliz` | mantem o identificador escolhido por quem pode publicar e ainda assim submete | CA-7.5 |
 * | `UT-025-6` | `erro` | recusa a leitura do pendente alheio a quem nao pode edita-lo | CA-7.6 |
 * | `UT-025-7` | `erro` | ignora o identificador informado por quem esta em revisao sem poder publicar | `P4` (BR-MIGRAR-004) |
 * | `UT-025-8` | `borda` | aceita identificador repetido entre dois conteudos pendentes | `P5` (BR-MIGRAR-005) |
 *
 * **O que o catalogo NAO da, e de onde veio:** ele registra o nome, o tipo e a
 * prova de cada caso, e **nao** o dado de entrada literal — nenhum dos 985
 * casos o registra, porque *"nenhum deles cita arquivo, classe ou framework: a
 * stack do sistema novo ainda nao foi escolhida"*. O dado de entrada de cada
 * teste daqui sai do fluxo de **UC-06**
 * (`.specify/use-cases/UC-06-submeter-conteudo-para-revisao.md`), que a tabela
 * de rastreabilidade de `spec.md` liga a US-7: a pre-condicao dele e literal —
 * *"o ator tem `edit_posts` e **nao** tem `publish_posts`"* —, o gatilho e *"o
 * colaborador salva o conteudo pedindo revisao"*, e o fluxo alternativo *"O ator
 * tem `publish_posts` e ainda assim pede revisao"* e o dado de UT-025-5 e de
 * UT-025-8. Nenhuma assercao inventa comportamento: cada uma afirma a frase da
 * coluna *Prova*.
 *
 * ---
 *
 * # Nao e a suite de T015, e o nivel e outro
 *
 * `./us-7-submeter-para-revisao.test.ts` e a suite da **entrega** de T015: ela
 * afirma os seis criterios chamando as funcoes de cada decisao direto —
 * `resolverEstadoDaSubmissao`, `estadoPedidoPelosBotoes`, `itensPorPaginaDaFila`
 * —, com uma porta de dados que **responde por consulta e registra o comando**,
 * e o cabecalho dela ja declara a fronteira: *"os oito testes de
 * `backlog/tests.md` (UT-025-1 a UT-025-8) sao de **T016**, a tarefa `[P]` que
 * roda em paralelo com esta"*.
 *
 * Esta e a suite do **catalogo**, e ela entra por outro lugar:
 *
 * | | T015 (`us-7-…`) | T016 (este arquivo) |
 * |---|---|---|
 * | entrada | a funcao de cada decisao, uma por uma | **so** a operacao publica: {@link submeterParaRevisao}, {@link filaDeRevisao}, {@link autorizarLeituraEmRevisao} |
 * | saida | o objeto devolvido, e o texto do comando que saiu | **a linha gravada na tabela**, relida pelo repositorio de T002 |
 * | a porta | responde por consulta, programada | uma **tabela em memoria** que aplica a escrita, **sem restricao de unicidade** |
 *
 * A tabela sem restricao nao e conveniencia: **e a regra**. BR-MIGRAR-005 e
 * literal — *"Um alvo que declare `UNIQUE` no slug **quebra** o produto: a
 * dispensa e a regra"* —, e UT-025-8 so e observavel num armazenamento que
 * aceite a repeticao. Um banco de mentira com indice unico faria o caso do
 * catalogo passar a falhar por uma restricao que o legado nao tem (P6: numero,
 * prazo e limite que o legado nao tem nao se inventam).
 *
 * Os dois niveis conviverem na mesma pasta e o precedente de
 * `../../identidade-e-acesso/senha-de-aplicacao/` (`us-10-…` e `ut-011-…`), e o
 * meio — *"snapshot + sequencia de comandos"* — e a **area 3** do criterio de
 * paridade da Decisao 2 (`parity_specs.md`), que vale para esta superficie:
 * *"Esquema e efeito de escrita no banco · **zero** divergencia"*.
 *
 * ---
 *
 * # Onde esta suite PARA, e por que isso nao e lacuna
 *
 * - **CA-7.3 nao tem consulta publica para interrogar nesta arvore.** Quem
 *   filtra `post_status` na consulta publica e `WP_Query`, que e **T009 da
 *   feature 004** (`contextos/leitura-publica/`). UT-025-3 afirma a **condicao**
 *   do criterio pelo registro de estado de `../estado-editorial.ts` — o unico
 *   estado de fabrica com `public => true` e `publish`, e o gravado nao e ele.
 *   Mesmo precedente de CA-2.3 em T005 e de CA-7.3 em T015.
 * - **UT-025-2 nao afirma que o colaborador NAO ve a fila.** O portao da tela e
 *   `edit_posts`, e nao `publish_posts` (`wp-admin/edit.php:44`), e o recorte por
 *   autoria e a variavel `perm => readable`, resolvida por `WP_Query`. Afirmar
 *   exclusao aqui seria afirmar comportamento que esta arvore nao tem.
 * - **Nenhum ponto de extensao e exercitado.** REQ-162 esta em
 *   `do-not-rewrite.md`: o barramento nao existe, e ponto sem interceptador e,
 *   no legado, um no-op.
 * - **Nenhuma assercao e sobre o corpo gravado.** REQ-030 (sanitizacao) e
 *   REQ-032 (formato em blocos) estao nas *Perguntas em aberto* de `spec.md`, e
 *   decidir qualquer um dos dois aqui seria decidir no lugar de quem decide.
 *
 * Cada afirmacao foi conferida contra o codigo do sistema analisado, legivel em
 * disco em `~/Downloads/wordpress` (WordPress 7.1.2, a mesma versao do pacote),
 * e por isso cita arquivo e linha. Quando o oraculo executavel existir (T001 da
 * feature 015), e por essas linhas que a comparacao caso a caso passa a rodar.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarRepositorioDeConteudo,
  DATA_SENTINELA,
  lerConteudo,
  type Conteudo,
} from '../armazenamento/index.js';
import { comoInteiro, comoTexto } from '../armazenamento/leitura-de-linha.js';
import { PROPRIEDADES_DO_ESTADO_EDITORIAL } from '../estado-editorial.js';
import { ESTADO_EM_REVISAO } from '../gravacao/index.js';
import type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ValorDeColuna,
} from '../portas/index.js';
import {
  CODIGO_DE_RECUSA_DE_LEITURA,
  MENSAGEM_DE_RECUSA_DE_LEITURA,
  autorizarLeituraEmRevisao,
  filaDeRevisao,
  podeEditarEsteConteudo,
  podePublicarEsteTipo,
  submeterParaRevisao,
  type ContextoDeRevisao,
  type PedidoDeSubmissao,
} from './index.js';

/* ────────────────────────────────────────────────────────────────────────────
   O DADO DE ENTRADA, que sai de UC-06
   ──────────────────────────────────────────────────────────────────────────── */

/** O texto do colaborador — o conteudo do fluxo principal de UC-06. */
const ID_DO_TEXTO = 42;
/** Um segundo conteudo, de quem pode publicar: UT-025-7 e UT-025-8. */
const ID_DO_SEGUNDO_TEXTO = 43;

/** O **Colaborador** de UC-06: *"tem `edit_posts` e nao tem `publish_posts`"*. */
const CONTA_DA_COLABORADORA = 3;
/** Quem publica o proprio — o ator do fluxo alternativo de UC-06. */
const CONTA_DA_AUTORA = 5;
/** O **Editor**, ator secundario de UC-06: publica o alheio. */
const CONTA_DA_EDITORA = 7;

/** `current_time( 'mysql' )` do cenario — o relogio do site, fixo. */
const AGORA_LOCAL = '2026-10-08 12:00:00';
/** O mesmo instante em UTC. */
const AGORA_UTC = '2026-10-08 15:00:00';
/** A data gravada na linha, distinguivel de {@link AGORA_LOCAL}. */
const DATA_ANTIGA = '2026-10-01 09:00:00';

/** O endereco que o ator escolhe na tela, e que UT-025-4 e UT-025-7 observam. */
const ENDERECO_ESCOLHIDO = 'endereco-que-eu-quero';
/** O endereco que dois conteudos pendentes dividem, em UT-025-8. */
const ENDERECO_REPETIDO = 'endereco-repetido';

/** `post` — o tipo de fabrica de que esta historia fala. */
const TIPO_EM_LINHA_DO_TEMPO = 'post';
/** `page` — o tipo hierarquico, com a outra familia de capacidades. */
const TIPO_DE_PAGINA = 'page';

/** As 23 colunas de `posts`, com os defaults do cenario. */
function linhaDeConteudo(
  campos: Partial<Record<string, ValorDeColuna>> = {},
): LinhaDeResultado {
  return {
    ID: ID_DO_TEXTO,
    post_author: CONTA_DA_COLABORADORA,
    post_date: DATA_ANTIGA,
    // Rascunho tem data flutuante, logo a coluna GMT fica na sentinela
    // (`wp-includes/post.php:4780`-`:4784`).
    post_date_gmt: DATA_SENTINELA,
    post_content: 'o texto que eu escrevi',
    post_title: 'Meu Texto',
    post_excerpt: '',
    post_status: 'draft',
    comment_status: 'open',
    ping_status: 'open',
    post_password: '',
    post_name: 'meu-texto',
    to_ping: '',
    pinged: '',
    post_modified: DATA_ANTIGA,
    post_modified_gmt: DATA_ANTIGA,
    post_content_filtered: '',
    post_parent: 0,
    guid: 'https://exemplo.test/?p=42',
    menu_order: 0,
    post_type: TIPO_EM_LINHA_DO_TEMPO,
    post_mime_type: '',
    comment_count: 0,
    ...campos,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   A TABELA `posts` EM MEMORIA — e por que ela aplica a escrita
   ──────────────────────────────────────────────────────────────────────────── */

interface TabelaDePosts {
  readonly porta: PortaDeDados;
  /** Todo comando que saiu, na ordem. Lista vazia e afirmacao, nao ausencia. */
  readonly comandos: Consulta[];
  /** A linha como ela esta na tabela, ou `null`. */
  linha(id: number): LinhaDeResultado | null;
  /** Toda linha da tabela, na ordem de insercao. */
  linhas(): readonly LinhaDeResultado[];
  /** A linha como `Conteudo`, pelo repositorio de T002. */
  conteudo(id: number): Conteudo | null;
}

/**
 * `posts` em memoria: o repositorio de T002 e a gravacao de T005/T007 rodam de
 * verdade sobre ela.
 *
 * **Sem indice unico em `post_name`, e sem chave estrangeira.** As duas
 * ausencias sao do legado: a tabela tem 59 indices e **zero** chave estrangeira
 * (P5), e a unicidade do identificador e *"verificacao de codigo, sujeita a
 * corrida"* e nao restricao do banco (BR-MIGRAR-096). Declarar qualquer uma das
 * duas aqui faria UT-025-8 falhar por uma regra que o produto nao tem.
 *
 * O comando que nao e reconhecido **lanca**, em vez de devolver vazio: um
 * comando novo que esta tabela nao entendesse faria um teste passar por engano.
 */
function tabelaDePosts(semeadas: readonly LinhaDeResultado[]): TabelaDePosts {
  const linhas: Record<string, ValorDeColuna>[] = semeadas.map((linha) => ({
    ...linha,
  })) as Record<string, ValorDeColuna>[];
  const comandos: Consulta[] = [];
  let proximoId = 1 + Math.max(0, ...linhas.map((linha) => comoInteiro(linha['ID'])));

  function porId(id: number): Record<string, ValorDeColuna> | undefined {
    return linhas.find((linha) => comoInteiro(linha['ID']) === id);
  }

  function selecionar(consulta: Consulta): readonly LinhaDeResultado[] {
    const { texto, parametros } = consulta;

    // `SELECT * FROM {site}posts WHERE ID = ? LIMIT 1`
    // (`wp-includes/class-wp-post.php:289`).
    if (texto.startsWith('SELECT * FROM') && texto.includes('WHERE ID = ?')) {
      const linha = porId(comoInteiro(parametros[0] as ValorDeColuna));
      return linha === undefined ? [] : [linha];
    }
    // `SELECT ID FROM $wpdb->posts WHERE ID = %d` — o `import_id`
    // (`wp-includes/post.php:5013`).
    if (texto.startsWith('SELECT ID FROM') && texto.includes('WHERE ID = ?')) {
      const linha = porId(comoInteiro(parametros[0] as ValorDeColuna));
      return linha === undefined ? [] : [{ ID: linha['ID'] }];
    }
    // A unicidade do tipo hierarquico (`wp-includes/post.php:5632`).
    if (texto.startsWith('SELECT post_name') && texto.includes('post_type IN')) {
      return identificadoresEmUso(
        (linha) =>
          comoTexto(linha['post_name']) ===
            comoTexto(parametros[0] as ValorDeColuna) &&
          [comoTexto(parametros[1] as ValorDeColuna), 'attachment'].includes(
            comoTexto(linha['post_type']),
          ) &&
          comoInteiro(linha['ID']) !==
            comoInteiro(parametros[2] as ValorDeColuna) &&
          comoInteiro(linha['post_parent']) ===
            comoInteiro(parametros[3] as ValorDeColuna),
      );
    }
    // A unicidade do tipo plano (`wp-includes/post.php:5662`).
    if (texto.startsWith('SELECT post_name') && texto.includes('post_type = ?')) {
      return identificadoresEmUso(
        (linha) =>
          comoTexto(linha['post_name']) ===
            comoTexto(parametros[0] as ValorDeColuna) &&
          comoTexto(linha['post_type']) ===
            comoTexto(parametros[1] as ValorDeColuna) &&
          comoInteiro(linha['ID']) !==
            comoInteiro(parametros[2] as ValorDeColuna),
      );
    }
    // A unicidade do anexo (`wp-includes/post.php:5598`).
    if (texto.startsWith('SELECT post_name')) {
      return identificadoresEmUso(
        (linha) =>
          comoTexto(linha['post_name']) ===
            comoTexto(parametros[0] as ValorDeColuna) &&
          comoInteiro(linha['ID']) !==
            comoInteiro(parametros[1] as ValorDeColuna),
      );
    }

    throw new Error(`leitura nao reconhecida por esta tabela: ${texto}`);
  }

  /**
   * O `$wpdb->get_var()` da consulta de unicidade: a **primeira** linha, com a
   * coluna `post_name` — e lista vazia quando nada casou. O `LIMIT 1` do legado
   * esta aqui, e nao no filtro, porque e ele que faz a consulta parar na
   * primeira colisao.
   */
  function identificadoresEmUso(
    casa: (linha: Record<string, ValorDeColuna>) => boolean,
  ): readonly LinhaDeResultado[] {
    const linha = linhas.find(casa);
    return linha === undefined ? [] : [{ post_name: linha['post_name'] }];
  }

  function escrever(consulta: Consulta): {
    linhasAfetadas: number;
    idGerado: number | null;
  } {
    const { texto, parametros } = consulta;

    if (texto.startsWith('INSERT INTO')) {
      const colunas = texto
        .slice(texto.indexOf('(') + 1, texto.indexOf(')'))
        .split(', ');
      const nova: Record<string, ValorDeColuna> = {};
      colunas.forEach((coluna, posicao) => {
        nova[coluna] = (parametros[posicao] ?? null) as ValorDeColuna;
      });
      if (nova['ID'] === undefined) {
        nova['ID'] = proximoId;
        proximoId += 1;
      }
      linhas.push(nova);
      return { linhasAfetadas: 1, idGerado: comoInteiro(nova['ID']) };
    }

    if (texto.startsWith('UPDATE')) {
      const atribuicoes = texto
        .slice(texto.indexOf(' SET ') + 5, texto.lastIndexOf(' WHERE ID = ?'))
        .split(', ');
      const id = comoInteiro(parametros[atribuicoes.length] as ValorDeColuna);
      const linha = porId(id);
      if (linha === undefined) {
        return { linhasAfetadas: 0, idGerado: null };
      }
      atribuicoes.forEach((atribuicao, posicao) => {
        const coluna = atribuicao.slice(0, atribuicao.indexOf(' '));
        linha[coluna] = (parametros[posicao] ?? null) as ValorDeColuna;
      });
      // ⚠️ O MySQL devolve `0` quando os valores sao identicos aos gravados, e
      // **nenhum ramo** de `wp_insert_post()` consulta este numero no caminho de
      // atualizacao (`wp-includes/post.php:4978`): o legado nao distingue a
      // atualizacao sem efeito da que nao achou linha. Fica `1` porque a linha
      // existe, e nada desta suite depende do valor.
      return { linhasAfetadas: 1, idGerado: null };
    }

    throw new Error(`escrita nao reconhecida por esta tabela: ${texto}`);
  }

  const porta: PortaDeDados = {
    prefixoDeTabela: 'wp_',
    selecionar(consulta) {
      comandos.push(consulta);
      return selecionar(consulta);
    },
    escrever(consulta) {
      comandos.push(consulta);
      return escrever(consulta);
    },
  };

  return {
    porta,
    comandos,
    linha(id) {
      return porId(id) ?? null;
    },
    linhas() {
      return linhas;
    },
    conteudo(id) {
      const linha = porId(id);
      return linha === undefined ? null : lerConteudo(linha);
    },
  };
}

/** O valor de uma coluna da linha gravada, como texto. */
function colunaGravada(
  tabela: TabelaDePosts,
  id: number,
  coluna: string,
): string {
  const linha = tabela.linha(id);
  assert.ok(linha !== null, `a linha ${id} nao esta na tabela`);
  return comoTexto(linha[coluna]);
}

/** As consultas de unicidade que sairam a partir de um ponto da sequencia. */
function consultasDeUnicidade(
  tabela: TabelaDePosts,
  desde = 0,
): readonly Consulta[] {
  return tabela.comandos
    .slice(desde)
    .filter((consulta) => consulta.texto.startsWith('SELECT post_name'));
}

/* ────────────────────────────────────────────────────────────────────────────
   OS ATORES, e a matriz que e DADO e nao codigo
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Um ator com as capacidades concedidas **individualmente**.
 *
 * Matriz vazia e concessao individual **sao um estado do legado**, e nao atalho
 * de teste: o papel e dado gravado (ADR-0001) e o `allcaps` individual passa
 * por cima dele (`PERM-1`). A regra de dependencia 3 impede esta suite de
 * importar a matriz de fabrica de BC-05, e por isso os conjuntos de fabrica
 * aparecem como lista, com o papel nomeado em comentario.
 */
function atorCom(
  contaId: number,
  login: string,
  ...capacidades: readonly string[]
): AtorDeAutorizacao {
  return {
    contaId,
    login,
    existe: true,
    concessoes: capacidades.map((capacidade) => ({
      capacidade,
      concedida: true,
    })),
  };
}

/** Papel `contributor`: escreve e **nao** publica — a pre-condicao de UC-06. */
const COLABORADORA = atorCom(
  CONTA_DA_COLABORADORA,
  'colaboradora',
  'edit_posts',
  'read',
  'delete_posts',
);

/** Papel `author`: o do colaborador mais publicar o proprio e subir arquivo. */
const AUTORA = atorCom(
  CONTA_DA_AUTORA,
  'autora',
  'edit_posts',
  'read',
  'delete_posts',
  'upload_files',
  'edit_published_posts',
  'publish_posts',
);

/**
 * Papel `editor`: o do autor mais o alheio, o privado e as de **pagina**.
 *
 * As de pagina estao aqui porque a assimetria de UC-07 e deliberada —
 * *"nenhuma capacidade de pagina chega a autor ou colaborador"* — e UT-025-2 a
 * encosta ao perguntar pela fila de um tipo hierarquico.
 */
const EDITORA = atorCom(
  CONTA_DA_EDITORA,
  'editora',
  'edit_posts',
  'read',
  'delete_posts',
  'upload_files',
  'edit_published_posts',
  'publish_posts',
  'edit_others_posts',
  'read_private_posts',
  'edit_pages',
  'edit_others_pages',
  'edit_published_pages',
  'publish_pages',
);

const BASE_SEM_PAPEL: BaseDeAutorizacao = {
  matriz: [],
  rede: REDE_INATIVA_NA_AUTORIZACAO,
};

/* ────────────────────────────────────────────────────────────────────────────
   O REGISTRO DE TIPOS
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Os tipos que este cenario conhece. Lista fechada de proposito:
 * `get_post_type_object()` devolve `false` para o que nao esta registrado.
 */
const TIPOS_REGISTRADOS: readonly string[] = [
  TIPO_EM_LINHA_DO_TEMPO,
  TIPO_DE_PAGINA,
  'attachment',
];

/**
 * Os 15 slots que `get_post_type_capabilities()` deriva de `capability_type`
 * (`wp-includes/post.php:1884`).
 *
 * Derivados, e nao escritos a mao, pelo mesmo motivo pelo qual o legado os
 * deriva: e assim que `edit_posts` vira `edit_pages` **sem um unico `if` sobre
 * o nome `page`**.
 */
function tipoRegistrado(nome: string): TipoDeConteudoNaAutorizacao {
  const plural = nome === TIPO_DE_PAGINA ? 'pages' : 'posts';
  return {
    nome,
    traduzMetaCapacidade: true,
    capacidades: {
      edit_posts: `edit_${plural}`,
      edit_others_posts: `edit_others_${plural}`,
      edit_published_posts: `edit_published_${plural}`,
      edit_private_posts: `edit_private_${plural}`,
      publish_posts: `publish_${plural}`,
      read: 'read',
      read_private_posts: `read_private_${plural}`,
      delete_posts: `delete_${plural}`,
      delete_others_posts: `delete_others_${plural}`,
      delete_published_posts: `delete_published_${plural}`,
      delete_private_posts: `delete_private_${plural}`,
      create_posts: `edit_${plural}`,
      read_post: 'read',
      edit_post: `edit_${plural}`,
      delete_post: `delete_${plural}`,
    },
  };
}

function tipoDeConteudo(nome: string): TipoDeConteudoNaAutorizacao | null {
  return TIPOS_REGISTRADOS.includes(nome) ? tipoRegistrado(nome) : null;
}

/**
 * A fonte de `map_meta_cap()`, lendo a **mesma** tabela.
 *
 * Ler a tabela, e nao uma lista a parte, e o que faz a decisao de capacidade
 * enxergar o estado **depois** da submissao — que e exatamente o que UT-025-6
 * precisa: o conteudo ja esta em `pending` quando a leitura e perguntada.
 *
 * O registro de **estado** sai de `../estado-editorial.ts`, e nao de uma tabela
 * escrita aqui: e o que o README do modulo manda fazer, para que a terceira
 * derivacao do mesmo registro nao divirja da primeira.
 */
function fonteDeConteudo(tabela: TabelaDePosts): FonteDeConteudoNaAutorizacao {
  return {
    conteudo(referencia) {
      const id = typeof referencia === 'number' ? referencia : 0;
      const linha = tabela.linha(id);
      if (linha === null) {
        return null;
      }
      const estado = comoTexto(linha['post_status']);
      return {
        id,
        tipo: comoTexto(linha['post_type']),
        estado,
        estadoParaLeitura: estado,
        autorId: comoInteiro(linha['post_author']),
        paiId: comoInteiro(linha['post_parent']),
      };
    },
    tipoDeConteudo,
    estadoDeConteudo(nome) {
      const propriedades =
        PROPRIEDADES_DO_ESTADO_EDITORIAL[
          nome as keyof typeof PROPRIEDADES_DO_ESTADO_EDITORIAL
        ];
      return propriedades === undefined
        ? null
        : {
            nome,
            publico: propriedades.publico,
            privado: propriedades.privado,
          };
    },
    // Esta historia nao passa pela lixeira nem pelas tres paginas de funcao
    // especial: as quatro leituras existem porque `map_meta_cap()` as faz, e
    // devolvem o que o legado devolve numa instalacao que nao as configurou.
    estadoAnteriorNaLixeira: () => '',
    paginaInicial: () => 0,
    paginaDeConteudos: () => 0,
    paginaDePoliticaDePrivacidade: () => 0,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   O CENARIO: uma requisicao, com um ator, sobre uma tabela
   ──────────────────────────────────────────────────────────────────────────── */

interface OpcoesDoCenario {
  readonly ator: AtorDeAutorizacao;
  /** A tabela, quando duas requisicoes com atores diferentes a dividem. */
  readonly tabela?: TabelaDePosts;
  readonly linhas?: readonly LinhaDeResultado[];
}

interface Cenario {
  readonly contexto: ContextoDeRevisao;
  readonly tabela: TabelaDePosts;
  /** As variaveis que a consulta da fila recebeu, na ordem. */
  readonly consultasDaFila: unknown[];
}

/**
 * A composicao de **uma** requisicao.
 *
 * Identidade, matriz e estado de rede sao escopo de requisicao
 * (`EXT-CONTEXTO`, BR-MIGRAR-105), logo dois atores sao dois contextos — e a
 * tabela, que e o banco, e a mesma. E assim que UT-025-2 e UT-025-7 observam o
 * que uma requisicao gravou pelos olhos da seguinte.
 */
function cenario(opcoes: OpcoesDoCenario): Cenario {
  const tabela =
    opcoes.tabela ?? tabelaDePosts(opcoes.linhas ?? [linhaDeConteudo()]);
  const consultasDaFila: unknown[] = [];

  const contexto: ContextoDeRevisao = {
    ator: opcoes.ator,
    base: BASE_SEM_PAPEL,
    armazenamento: { conteudo: criarRepositorioDeConteudo(tabela.porta) },
    fonteDeConteudo: fonteDeConteudo(tabela),
    // `sanitize_key()`: caixa baixa, e so letra, digito, `_` e `-` passam. E a
    // reducao do que a funcao de `plataforma/formatacao/` (feature 015) faz, e
    // nenhuma assercao desta suite e sobre o texto dela.
    sanitizarChave: (valor) => valor.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
    consultarConteudo(variaveis) {
      consultasDaFila.push(variaveis);
      // O duble de `WP_Query`: o clausulado dela e **T009 da feature 004**, e o
      // que se reproduz aqui e so o efeito das tres variaveis que esta tarefa
      // entrega — tipo, estado e ordem. Nenhuma assercao desta suite e sobre o
      // comando que `WP_Query` emitiria.
      return tabela
        .linhas()
        .filter(
          (linha) =>
            comoTexto(linha['post_type']) === variaveis.post_type &&
            comoTexto(linha['post_status']) === variaveis.post_status,
        )
        .map((linha) => lerConteudo(linha))
        .sort((esquerda, direita) =>
          // `orderby => modified`, `order => ASC` — a fila do pendente e a mais
          // antiga primeiro (`wp-admin/includes/post.php:1269` e `:1277`).
          esquerda.modificadoEm.localeCompare(direita.modificadoEm),
        )
        .slice(0, variaveis.posts_per_page);
    },
    // `get_user_option( "edit_{$tipo}_per_page" )` nao gravada: `0` e o que a
    // coercao do legado produz para `false` (`wp-admin/includes/post.php:1281`).
    itensPorPaginaDaConta: () => 0,
    texto: {
      sanitizarTitulo(titulo, reserva) {
        const sanitizado = titulo
          .toLowerCase()
          .replace(/[\s_]+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        return sanitizado === '' ? reserva : sanitizado;
      },
      codificarEmUtf8NaUrl: (valor, tamanho) => valor.slice(0, tamanho),
    },
    reescrita: {
      feeds: () => ['feed', 'rdf', 'rss', 'rss2', 'atom'],
      baseDePaginacao: () => 'page',
      estruturaDeLinks: () => '',
    },
    tipoDeConteudo,
    tipoEHierarquico: (tipo) => tipo === TIPO_DE_PAGINA,
    datas: {
      agoraNoFusoDoSite: () => AGORA_LOCAL,
      agoraEmUtc: () => AGORA_UTC,
      deUtcParaOFusoDoSite: () => AGORA_LOCAL,
      doFusoDoSiteParaUtc: () => AGORA_UTC,
    },
    suportaRecurso: () => true,
    estadoPadraoDeComentario: () => 'open',
    enderecoDoConteudo: (id) => `https://exemplo.test/?p=${id}`,
  };

  return { contexto, tabela, consultasDaFila };
}

/**
 * *"o colaborador salva o conteudo pedindo revisao"* — o gatilho de UC-06.
 *
 * No painel pedir revisao e o campo `pending`, *"Submit for Review"*
 * (`wp-admin/includes/post.php:135`).
 */
function pedidoDeRevisao(
  conteudoId: number,
  campos: PedidoDeSubmissao['campos'] = {},
): PedidoDeSubmissao {
  return {
    conteudoId,
    campos,
    botoes: { submeterParaRevisao: 'Submit for Review' },
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   UT-025-1 · feliz
   "envia para pendente o conteudo de quem escreve e nao publica"
   Prova: "Quem tem permissao de escrever e nao tem de publicar envia o conteudo
   para o estado pendente" (CA-7.1)
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-025-1 envia para pendente o conteudo de quem escreve e nao publica (CA-7.1)', () => {
  const { contexto, tabela } = cenario({ ator: COLABORADORA });

  // A pre-condicao de UC-06, afirmada e nao suposta: *"o ator tem `edit_posts`
  // e **nao** tem `publish_posts`"*.
  assert.equal(podeEditarEsteConteudo(contexto, ID_DO_TEXTO), true);
  assert.equal(podePublicarEsteTipo(contexto, TIPO_EM_LINHA_DO_TEMPO), false);

  // A acao: o passo 1 do fluxo principal.
  const resultado = submeterParaRevisao(contexto, pedidoDeRevisao(ID_DO_TEXTO));

  // O passo 2: *"Sistema grava o status pendente"* — e e a **coluna** que fecha
  // o criterio, nao o objeto devolvido.
  assert.equal(resultado.desfecho, 'submetido');
  assert.equal(colunaGravada(tabela, ID_DO_TEXTO, 'post_status'), ESTADO_EM_REVISAO);

  // E a outra metade da mesma frase, que e a razao de o criterio existir: o
  // formulario do painel chega **como se fosse publicar** — *"Posts 'submitted
  // for approval' are submitted to $_POST the same as if they were being
  // published"* (`wp-admin/includes/post.php:148`-`:159`) — e a falta da
  // capacidade e o que o rebaixa.
  const comoSeFossePublicar = cenario({ ator: COLABORADORA });
  const rebaixado = submeterParaRevisao(comoSeFossePublicar.contexto, {
    conteudoId: ID_DO_TEXTO,
    campos: { estado: 'publish' },
  });

  assert.equal(rebaixado.estadoPedido, 'publish');
  assert.equal(rebaixado.rebaixado, true);
  assert.equal(
    colunaGravada(comoSeFossePublicar.tabela, ID_DO_TEXTO, 'post_status'),
    ESTADO_EM_REVISAO,
  );

  // O texto nao se perde no caminho: a pos-condicao de UC-06 fala do registro,
  // nao de um registro novo.
  assert.equal(
    colunaGravada(tabela, ID_DO_TEXTO, 'post_content'),
    'o texto que eu escrevi',
  );
  assert.equal(
    comoInteiro(tabela.linha(ID_DO_TEXTO)?.['post_author']),
    CONTA_DA_COLABORADORA,
  );
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-025-2 · feliz
   "apresenta o pendente na fila de quem pode publicar aquele tipo"
   Prova: "O conteudo pendente aparece na fila de quem pode publicar aquele
   tipo" (CA-7.2)
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-025-2 apresenta o pendente na fila de quem pode publicar aquele tipo (CA-7.2)', () => {
  // Uma tabela, duas requisicoes: a colaboradora submete, e quem pode publicar
  // abre a fila. E o passo 4 de UC-06 — *"Sistema expoe o conteudo na lista de
  // pendentes do painel"* —, e o `async` da tabela de sequencia e literal: nada
  // e enviado, alguem **abre a tela**.
  const submissao = cenario({ ator: COLABORADORA });
  submeterParaRevisao(submissao.contexto, pedidoDeRevisao(ID_DO_TEXTO));

  const fila = cenario({ ator: AUTORA, tabela: submissao.tabela });
  assert.equal(podePublicarEsteTipo(fila.contexto, TIPO_EM_LINHA_DO_TEMPO), true);

  const resultado = filaDeRevisao(fila.contexto, { tipo: TIPO_EM_LINHA_DO_TEMPO });

  assert.equal(resultado.desfecho, 'listado');
  // As variaveis que `wp_edit_posts_query()` entrega a `wp()`
  // (`wp-admin/includes/post.php:1314`-`:1322`): e por `post_status` que a fila
  // e a do pendente.
  assert.equal(resultado.variaveis?.post_status, ESTADO_EM_REVISAO);
  assert.equal(resultado.variaveis?.post_type, TIPO_EM_LINHA_DO_TEMPO);
  assert.deepEqual(fila.consultasDaFila, [resultado.variaveis]);

  // E o conteudo submetido esta nela.
  assert.deepEqual(
    resultado.conteudos.map((conteudo) => conteudo.id),
    [ID_DO_TEXTO],
  );
  assert.equal(resultado.conteudos[0]?.estado, ESTADO_EM_REVISAO);

  // A editora, que publica aquele tipo **e** o hierarquico, ve a mesma fila — e
  // a de pagina responde pela familia de capacidades da pagina
  // (`wp-admin/edit.php:44`, pelo slot do registro do tipo).
  const editora = cenario({ ator: EDITORA, tabela: submissao.tabela });
  assert.deepEqual(
    filaDeRevisao(editora.contexto, { tipo: TIPO_EM_LINHA_DO_TEMPO }).conteudos.map(
      (conteudo) => conteudo.id,
    ),
    [ID_DO_TEXTO],
  );
  assert.equal(
    filaDeRevisao(editora.contexto, { tipo: TIPO_DE_PAGINA }).desfecho,
    'listado',
  );

  // ⚠️ Esta suite **nao** afirma que o colaborador fica fora da fila: o portao
  // da tela e `edit_posts` e nao `publish_posts`, e o recorte por autoria e a
  // variavel `perm => readable`, resolvida por `WP_Query` (T009 da feature
  // 004). Ver *"Onde esta suite PARA"*, no cabecalho.
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-025-3 · feliz
   "mantem o pendente fora de toda consulta publica"
   Prova: "O conteudo pendente nao aparece em consulta publica alguma" (CA-7.3)
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-025-3 mantem o pendente fora de toda consulta publica (CA-7.3)', () => {
  const { contexto, tabela } = cenario({ ator: COLABORADORA });

  submeterParaRevisao(contexto, pedidoDeRevisao(ID_DO_TEXTO));

  const estadoGravado = colunaGravada(tabela, ID_DO_TEXTO, 'post_status');
  assert.equal(estadoGravado, ESTADO_EM_REVISAO);

  // A condicao do criterio, lida do registro de estado do legado
  // (`wp-includes/post.php:704`): o estado gravado nao e publico e nao pode ser
  // pedido pela consulta publica.
  const registro = PROPRIEDADES_DO_ESTADO_EDITORIAL.pending;
  assert.equal(registro.publico, false);
  assert.equal(registro.consultavelPeloPublico, false);
  assert.equal(registro.protegido, true);

  // E a frase *"consulta publica alguma"* na forma mais forte que esta arvore
  // permite afirmar: **um** estado de fabrica e publico, e o gravado nao e ele.
  const publicos = Object.entries(PROPRIEDADES_DO_ESTADO_EDITORIAL)
    .filter(([, propriedades]) => propriedades.publico)
    .map(([nome]) => nome);
  assert.deepEqual(publicos, ['publish']);
  assert.equal(publicos.includes(estadoGravado), false);

  // O outro lado, que e CA-7.2: `pending` aparece **no painel**, com os dois
  // sinalizadores de listagem ligados.
  assert.equal(registro.visivelNaListaDeTodos, true);
  assert.equal(registro.visivelNaListaDeEstados, true);
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-025-4 · borda
   "deixa vazio o identificador de quem nao pode publicar"
   Prova: "Quem nao pode publicar nao reserva endereco: o identificador de URL
   fica vazio" (CA-7.4)
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-025-4 deixa vazio o identificador de quem nao pode publicar (CA-7.4)', () => {
  // O passo 3 de UC-06: *"Sistema esvazia o identificador de URL do conteudo,
  // porque quem nao publica nao reserva endereco"* —
  // `wp-includes/post.php:4731`-`:4739`, com o comentario do legado: *"Don't
  // allow contributors to set the post slug for pending review posts"*.
  const { contexto, tabela } = cenario({ ator: COLABORADORA });

  // A linha entra com endereco gravado, e o pedido traz outro: os dois somem.
  assert.equal(colunaGravada(tabela, ID_DO_TEXTO, 'post_name'), 'meu-texto');

  submeterParaRevisao(
    contexto,
    pedidoDeRevisao(ID_DO_TEXTO, { identificadorNaUrl: ENDERECO_ESCOLHIDO }),
  );

  assert.equal(colunaGravada(tabela, ID_DO_TEXTO, 'post_name'), '');
  // A pos-condicao de UC-06: *"o identificador de URL esta vazio e sera
  // atribuido na publicacao"* — a atribuicao e CA-8.3, em T017.
  assert.equal(colunaGravada(tabela, ID_DO_TEXTO, 'post_status'), ESTADO_EM_REVISAO);
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-025-5 · feliz
   "mantem o identificador escolhido por quem pode publicar e ainda assim
   submete"
   Prova: "Quem pode publicar e ainda assim envia para revisao mantem o
   identificador escolhido" (CA-7.5)
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-025-5 mantem o identificador escolhido por quem pode publicar e ainda assim submete (CA-7.5)', () => {
  // O fluxo alternativo de UC-06: *"O ator tem `publish_posts` e ainda assim
  // pede revisao — Sistema grava pendente e **mantem** o identificador de URL.
  // A regra do slug vazio so vale para quem nao pode publicar"*. E o outro ramo
  // da **mesma** linha `:4736`.
  const { contexto, tabela } = cenario({
    ator: AUTORA,
    linhas: [linhaDeConteudo({ post_author: CONTA_DA_AUTORA })],
  });
  assert.equal(podePublicarEsteTipo(contexto, TIPO_EM_LINHA_DO_TEMPO), true);

  submeterParaRevisao(
    contexto,
    pedidoDeRevisao(ID_DO_TEXTO, { identificadorNaUrl: ENDERECO_ESCOLHIDO }),
  );

  assert.equal(colunaGravada(tabela, ID_DO_TEXTO, 'post_status'), ESTADO_EM_REVISAO);
  assert.equal(colunaGravada(tabela, ID_DO_TEXTO, 'post_name'), ENDERECO_ESCOLHIDO);
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-025-6 · erro
   "recusa a leitura do pendente alheio a quem nao pode edita-lo"
   Prova: "Ler o conteudo pendente de outra pessoa exige poder edita-lo"
   (CA-7.6)
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-025-6 recusa a leitura do pendente alheio a quem nao pode edita-lo (CA-7.6)', () => {
  // A excecao de UC-06: *"Colaborador tenta ler o pendente de outro: `read_post`
  // de status nao publico cai em `edit_post`, logo ler o rascunho de outro exige
  // poder edita-lo — o que o colaborador nao tem"*
  // (`wp-includes/capabilities.php:369`-`:380`, a ancora de US-7).
  //
  // O dado de entrada e o estado **depois** da submissao: a autora submete o
  // texto dela, e a colaboradora tenta ler.
  const submissao = cenario({
    ator: AUTORA,
    linhas: [linhaDeConteudo({ post_author: CONTA_DA_AUTORA })],
  });
  submeterParaRevisao(submissao.contexto, pedidoDeRevisao(ID_DO_TEXTO));
  assert.equal(
    colunaGravada(submissao.tabela, ID_DO_TEXTO, 'post_status'),
    ESTADO_EM_REVISAO,
  );

  const pendente = submissao.tabela.conteudo(ID_DO_TEXTO);
  assert.ok(pendente !== null);

  // Quem nao pode editar o alheio e recusado.
  const colaboradora = cenario({
    ator: COLABORADORA,
    tabela: submissao.tabela,
  });
  assert.deepEqual(autorizarLeituraEmRevisao(colaboradora.contexto, pendente), {
    codigo: CODIGO_DE_RECUSA_DE_LEITURA,
    mensagem: MENSAGEM_DE_RECUSA_DE_LEITURA,
    codigoHttp: 403,
  });

  // E a recusa e exatamente *"exige poder edita-lo"*, e nao uma porta fechada a
  // todos: quem tem a capacidade do alheio le, e quem escreveu le o proprio.
  const editora = cenario({ ator: EDITORA, tabela: submissao.tabela });
  assert.equal(autorizarLeituraEmRevisao(editora.contexto, pendente), null);
  assert.equal(
    autorizarLeituraEmRevisao(submissao.contexto, pendente),
    null,
  );
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-025-7 · erro · REGRA DE NEGOCIO
   "ignora o identificador informado por quem esta em revisao sem poder
   publicar"
   Prova: "P4 — colaborador nao escolhe a URL do que esta em revisao"
   (BR-MIGRAR-004)
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-025-7 ignora o identificador informado por quem esta em revisao sem poder publicar (P4)', () => {
  // BR-MIGRAR-004, confianca 🟢: *"Em `pending`, quem nao tem `publish_posts`
  // tem o `post_name` esvaziado, **para nao reservar slug sem poder
  // publicar**"*. A segunda metade da frase e o que separa este caso de
  // UT-025-4, e e o quinto cenario de `PT-002`: *"Entao as duas metades gravam o
  // campo de slug vazio · **E nenhuma das duas reserva o slug**"*.
  const tabela = tabelaDePosts([
    linhaDeConteudo(),
    linhaDeConteudo({
      ID: ID_DO_SEGUNDO_TEXTO,
      post_author: CONTA_DA_AUTORA,
      post_name: 'texto-da-autora',
      post_title: 'Texto da Autora',
      guid: 'https://exemplo.test/?p=43',
    }),
  ]);

  const colaboradora = cenario({ ator: COLABORADORA, tabela });
  const antes = tabela.comandos.length;

  const resultado = submeterParaRevisao(
    colaboradora.contexto,
    pedidoDeRevisao(ID_DO_TEXTO, { identificadorNaUrl: ENDERECO_ESCOLHIDO }),
  );

  // 1. O pedido **chegou** com endereco, e a coluna ficou vazia: a regra e
  //    *"ignora"*, e nao *"recusa"* — a submissao foi gravada.
  assert.equal(resultado.desfecho, 'submetido');
  assert.equal(resultado.gravacao?.identificadorPedido, ENDERECO_ESCOLHIDO);
  assert.equal(colunaGravada(tabela, ID_DO_TEXTO, 'post_name'), '');

  // 2. Nenhuma consulta de unicidade saiu: a dispensa de `pending`
  //    (BR-MIGRAR-005) tambem e **sequencia de comandos**, e a area 3 da
  //    Decisao 2 a compara.
  assert.deepEqual(consultasDeUnicidade(tabela, antes), []);

  // 3. *"E nenhuma das duas reserva o slug"*: quem pode publicar leva aquele
  //    endereco **sem sufixo**, porque ninguem o reservou. Se o pendente da
  //    colaboradora o tivesse reservado, `wp_unique_post_slug()`
  //    (`wp-includes/post.php:5662`) devolveria `endereco-que-eu-quero-2`.
  const autora = cenario({ ator: AUTORA, tabela });
  const publicacao = submeterParaRevisao(autora.contexto, {
    conteudoId: ID_DO_SEGUNDO_TEXTO,
    campos: { estado: 'publish', identificadorNaUrl: ENDERECO_ESCOLHIDO },
  });

  assert.equal(publicacao.estado, 'publish');
  assert.equal(
    colunaGravada(tabela, ID_DO_SEGUNDO_TEXTO, 'post_name'),
    ENDERECO_ESCOLHIDO,
  );
  // E a unicidade **foi** cobrada neste caminho, o que torna o item 3 uma
  // afirmacao e nao uma coincidencia: fora dos tres estados que a dispensam, a
  // consulta sai.
  assert.equal(consultasDeUnicidade(tabela, antes).length > 0, true);
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-025-8 · borda · REGRA DE NEGOCIO
   "aceita identificador repetido entre dois conteudos pendentes"
   Prova: "P5 — a unicidade do identificador e dispensada em pendente"
   (BR-MIGRAR-005)
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-025-8 aceita identificador repetido entre dois conteudos pendentes (P5)', () => {
  // BR-MIGRAR-005: *"A unicidade e dispensada em `draft`, `pending`,
  // `auto-draft`, em revisao e no tipo `user_request`"*, e
  // `wp-includes/post.php:4745`-`:4750` e a linha. O ator e o do fluxo
  // alternativo — quem **pode** publicar e ainda assim submete —, porque so
  // assim os dois identificadores sobrevivem a regra P4 e a repeticao fica
  // observavel.
  const tabela = tabelaDePosts([
    linhaDeConteudo({ post_author: CONTA_DA_AUTORA }),
    linhaDeConteudo({
      ID: ID_DO_SEGUNDO_TEXTO,
      post_author: CONTA_DA_AUTORA,
      post_name: 'segundo-texto',
      post_title: 'Segundo Texto',
      guid: 'https://exemplo.test/?p=43',
    }),
  ]);
  const { contexto } = cenario({ ator: AUTORA, tabela });
  const antes = tabela.comandos.length;

  submeterParaRevisao(
    contexto,
    pedidoDeRevisao(ID_DO_TEXTO, { identificadorNaUrl: ENDERECO_REPETIDO }),
  );
  submeterParaRevisao(
    contexto,
    pedidoDeRevisao(ID_DO_SEGUNDO_TEXTO, {
      identificadorNaUrl: ENDERECO_REPETIDO,
    }),
  );

  // Os dois estao em revisao, e os dois tem o **mesmo** endereco gravado: o
  // segundo nao recebeu sufixo, e o primeiro nao foi alterado.
  assert.equal(colunaGravada(tabela, ID_DO_TEXTO, 'post_status'), ESTADO_EM_REVISAO);
  assert.equal(
    colunaGravada(tabela, ID_DO_SEGUNDO_TEXTO, 'post_status'),
    ESTADO_EM_REVISAO,
  );
  assert.equal(colunaGravada(tabela, ID_DO_TEXTO, 'post_name'), ENDERECO_REPETIDO);
  assert.equal(
    colunaGravada(tabela, ID_DO_SEGUNDO_TEXTO, 'post_name'),
    ENDERECO_REPETIDO,
  );

  // E a dispensa e **ausencia de consulta**, nao consulta que tolera: nenhuma
  // das duas submissoes perguntou pela unicidade.
  assert.deepEqual(consultasDeUnicidade(tabela, antes), []);
});
