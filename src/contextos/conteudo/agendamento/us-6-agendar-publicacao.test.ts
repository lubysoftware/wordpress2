/**
 * Testes da entrega de **T013**: *"o comportamento de US-6 existe e os criterios
 * CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5 passam contra o sistema novo"*.
 *
 * **Nao sao os sete testes de `backlog/tests.md`** — UT-024-1 a UT-024-7 sao
 * **T014**, a tarefa `[P]` que roda em paralelo com esta. Aqui se afirma o que
 * esta tarefa entrega, criterio por criterio, pelos meios que a Decisao 2 fixa
 * para esta area: **efeito no banco** (*"snapshot + sequencia de comandos"*),
 * **valor devolvido** e **ordem de emissao**. Nesta historia a sequencia que
 * mais importa nao e a de comandos SQL: e a de chamadas **a fila**, porque e ali
 * que o agendamento acontece — por isso o cenario registra as duas.
 *
 * O relogio e controlado em todos os testes, como o **P4** pede (*"teste por
 * atestado que fixa prazo e forca, com relogio controlado"*), e as bordas de
 * tempo sao afirmadas nos dois lados, como o **P6** pede (*"no ultimo instante
 * aceita, um instante depois recusa"*).
 *
 * Cada afirmacao foi conferida contra o codigo do sistema analisado, legivel em
 * disco em `~/Downloads/wordpress` (WordPress 7.1.2, a mesma versao do pacote),
 * e por isso cita arquivo e linha. Quando o oraculo executavel existir (T001 da
 * feature 015), e por essas linhas que a comparacao caso a caso passa a rodar.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ATOR_ANONIMO,
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type MatrizDePapeis,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarRepositorioDeConteudo,
  DATA_SENTINELA,
} from '../armazenamento/index.js';
import {
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import { ESTADOS_EDITORIAIS } from '../estado-editorial.js';
import type { LinhaDeResultado } from '../portas/index.js';
import {
  ESTADO_AGENDADO,
  ESTADO_PUBLICADO,
  GANCHO_DE_PUBLICACAO_AGENDADA,
  transitarEstado,
  type ContextoDePublicacao,
} from '../publicacao/index.js';
import {
  FOLGA_DE_AGENDAMENTO_EM_SEGUNDOS,
  PRIORIDADE_DA_VERIFICACAO_DUPLA,
  PRIORIDADE_DO_OUVINTE_DE_AGENDAMENTO,
  TIPO_FORA_DA_COMPARACAO_DE_DATA,
  instanteDaDataDoBanco,
  publicarSeAindaAgendado,
  resolverEstadoPelaData,
  type ContextoDeAgendamento,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const ID = 42;
const ENDERECO = 'https://exemplo.test/?p=42';

/** 2026-10-08 12:00:00 UTC, em segundos inteiros: o `time()` dos testes. */
const AGORA = Date.UTC(2026, 9, 8, 12, 0, 0) / 1000;

/** O texto de uma coluna `datetime` a partir do instante, no formato do banco. */
function dataDoBanco(instanteEmSegundos: number): string {
  return new Date(instanteEmSegundos * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
}

const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'author',
    capacidades: [
      { capacidade: 'edit_posts', concedida: true },
      { capacidade: 'publish_posts', concedida: true },
    ],
  },
];

const BASE: BaseDeAutorizacao = {
  matriz: MATRIZ,
  rede: REDE_INATIVA_NA_AUTORIZACAO,
};

/** `get_post_type_object( 'post' )`, com os dois campos que decidem. */
const TIPO_POST: TipoDeConteudoNaAutorizacao = {
  nome: 'post',
  traduzMetaCapacidade: true,
  capacidades: {
    edit_posts: 'edit_posts',
    publish_posts: 'publish_posts',
  },
};

/** `get_post_type_object( 'attachment' )`. O anexo tambem e tipo registrado. */
const TIPO_ANEXO: TipoDeConteudoNaAutorizacao = {
  nome: TIPO_FORA_DA_COMPARACAO_DE_DATA,
  traduzMetaCapacidade: true,
  capacidades: {
    edit_posts: 'edit_posts',
    publish_posts: 'publish_posts',
  },
};

/** As 23 colunas de `posts`, com os defaults do cenario. */
function linhaDeConteudo(
  campos: Partial<Record<string, string | number>> = {},
): LinhaDeResultado {
  return {
    ID,
    post_author: 7,
    post_date: dataDoBanco(AGORA + 3600),
    post_date_gmt: dataDoBanco(AGORA + 3600),
    post_content: 'corpo',
    post_title: 'titulo',
    post_excerpt: '',
    post_status: ESTADO_AGENDADO,
    comment_status: 'open',
    ping_status: 'open',
    post_password: '',
    post_name: 'titulo',
    to_ping: '',
    pinged: '',
    post_modified: dataDoBanco(AGORA),
    post_modified_gmt: dataDoBanco(AGORA),
    post_content_filtered: '',
    post_parent: 0,
    guid: ENDERECO,
    menu_order: 0,
    post_type: 'post',
    post_mime_type: '',
    comment_count: 0,
    ...campos,
  };
}

interface Cenario {
  readonly contexto: ContextoDeAgendamento;
  readonly dados: PortaDeDadosFalsa;
  /**
   * Toda chamada a fila, na ordem e em uma lista so — e **a ordem e a
   * afirmacao**: entrar em agendado limpa duas vezes e agenda uma.
   */
  readonly chamadasDaFila: string[];
  /** Os pontos de extensao disparados, na ordem. */
  readonly pontos: string[];
  /** Quantas vezes o relogio foi lido. O legado le `time()` uma vez. */
  readonly leiturasDoRelogio: () => number;
}

interface OpcoesDoCenario {
  readonly linha?: LinhaDeResultado;
  readonly agora?: number;
  readonly tipos?: Readonly<Record<string, TipoDeConteudoNaAutorizacao>>;
  /** O deslocamento de fuso que `get_gmt_from_date()` aplica, em segundos. */
  readonly deslocamentoDoFuso?: number;
  readonly eventosRemovidos?: number | false;
  readonly agendamentoAceito?: boolean;
  /** Quantas linhas a porta responde. */
  readonly leituras?: number;
}

function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const dados = criarPortaDeDadosFalsa();
  const linha = opcoes.linha ?? linhaDeConteudo();
  for (let i = 0; i < (opcoes.leituras ?? 4); i += 1) {
    dados.responder([linha]);
  }

  const chamadasDaFila: string[] = [];
  const pontos: string[] = [];
  const tipos = opcoes.tipos ?? { post: TIPO_POST, attachment: TIPO_ANEXO };
  const deslocamentoDoFuso = opcoes.deslocamentoDoFuso ?? 0;
  let leiturasDoRelogio = 0;

  const ator: AtorDeAutorizacao = {
    contaId: 7,
    login: 'author',
    existe: true,
    concessoes: [{ capacidade: 'author', concedida: true }],
  };

  const contexto: ContextoDeAgendamento = {
    base: BASE,
    ator,
    armazenamento: { conteudo: criarRepositorioDeConteudo(dados.porta) },
    classificacao: {
      taxonomiasDoTipo() {
        return [];
      },
      termosDoConteudo() {
        return { erro: false, termos: [] };
      },
      opcaoDeTermoPadrao() {
        return 0;
      },
      definirTermos() {},
    },
    fila: {
      limparGancho(gancho, argumentos) {
        chamadasDaFila.push(`limpar ${gancho} ${JSON.stringify(argumentos)}`);
        return opcoes.eventosRemovidos ?? 1;
      },
      agendarEventoUnico(instanteEmSegundos, gancho, argumentos) {
        chamadasDaFila.push(
          `agendar ${gancho} ${JSON.stringify(argumentos)} em ${instanteEmSegundos}`,
        );
        return opcoes.agendamentoAceito ?? true;
      },
    },
    relogio: {
      agoraEmSegundos() {
        leiturasDoRelogio += 1;
        return opcoes.agora ?? AGORA;
      },
    },
    tipoDeConteudo(nome) {
      return tipos[nome] ?? null;
    },
    enderecoDoConteudo() {
      return ENDERECO;
    },
    // `get_gmt_from_date()`: a data LOCAL convertida para UTC. O deslocamento
    // existe para que o teste do ouvinte de agendamento possa provar de qual das
    // duas colunas ele parte.
    dataGmtDeDataLocal(dataLocal) {
      const instante = instanteDaDataDoBanco(dataLocal);
      return instante === null
        ? '1970-01-01 00:00:00'
        : dataDoBanco(instante - deslocamentoDoFuso);
    },
    ganchos: {
      aoTransitarEstado() {
        pontos.push('transition_post_status');
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
    },
  };

  return {
    contexto,
    dados,
    chamadasDaFila,
    pontos,
    leiturasDoRelogio: () => leiturasDoRelogio,
  };
}

/** `limpar` com o gancho e o identificador, na forma que o log registra. */
const LIMPAR = `limpar ${GANCHO_DE_PUBLICACAO_AGENDADA} [${ID}]`;

/** `agendar` para um instante, na forma que o log registra. */
function agendarEm(instanteEmSegundos: number): string {
  return `agendar ${GANCHO_DE_PUBLICACAO_AGENDADA} [${ID}] em ${instanteEmSegundos}`;
}

/* ── CA-6.1: DATA A 60 SEGUNDOS OU MAIS A FRENTE RESULTA EM AGENDADO ───────── */

test('CA-6.1 publicado com data a frente vira agendado, sem comando proprio', () => {
  // `wp-includes/post.php:4800`-`:4802`. Ninguem pediu "agendar": o estado
  // pedido foi `publish` e a comparacao o reescreveu (ADR-0005).
  assert.equal(
    resolverEstadoPelaData(
      { tipo: 'post', estado: ESTADO_PUBLICADO, dataGmt: dataDoBanco(AGORA + 3600) },
      AGORA,
    ),
    ESTADO_AGENDADO,
  );
});

test('CA-6.1 a borda e 60 segundos: exatamente 60 agenda, 59 nao', () => {
  function estadoCom(deslocamento: number): string {
    return resolverEstadoPelaData(
      {
        tipo: 'post',
        estado: ESTADO_PUBLICADO,
        dataGmt: dataDoBanco(AGORA + deslocamento),
      },
      AGORA,
    );
  }

  // `>= MINUTE_IN_SECONDS` (`:4801`). O P6 cobra os dois lados da borda: "no
  // ultimo instante aceita, um instante depois recusa".
  assert.equal(FOLGA_DE_AGENDAMENTO_EM_SEGUNDOS, 60);
  assert.equal(estadoCom(60), ESTADO_AGENDADO);
  assert.equal(estadoCom(59), ESTADO_PUBLICADO);
  assert.equal(estadoCom(61), ESTADO_AGENDADO);
  // "Publicar agora" significa agora, e e para isso que a folga existe.
  assert.equal(estadoCom(0), ESTADO_PUBLICADO);
  assert.equal(estadoCom(-3600), ESTADO_PUBLICADO);
});

test('CA-6.1 o anexo contorna o bloco inteiro, e e o unico tipo que o faz', () => {
  // `:4797`: `if ( 'attachment' !== $post_type )`. BR-MIGRAR-002, "anexo nunca e
  // publicado": o estado do anexo tem outro ciclo, e ADR-0005 avisa que "quem
  // generalizar a regra para todos os tipos muda o comportamento da midia".
  assert.equal(
    resolverEstadoPelaData(
      {
        tipo: TIPO_FORA_DA_COMPARACAO_DE_DATA,
        estado: ESTADO_PUBLICADO,
        dataGmt: dataDoBanco(AGORA + 3600),
      },
      AGORA,
    ),
    ESTADO_PUBLICADO,
  );

  // E qualquer outro tipo, inclusive um que ninguem registrou, entra no bloco.
  for (const tipo of ['post', 'page', 'wp_template', 'tipo-de-extensao']) {
    assert.equal(
      resolverEstadoPelaData(
        { tipo, estado: ESTADO_PUBLICADO, dataGmt: dataDoBanco(AGORA + 3600) },
        AGORA,
      ),
      ESTADO_AGENDADO,
    );
  }
});

test('CA-6.1 nenhum dos outros dez estados e tocado pela comparacao de data', () => {
  // O `if`/`elseif` de `:4800`-`:4806` cobre `publish` e `future` e mais nada.
  // Rascunho com data futura continua rascunho: quem acrescentasse `draft` a
  // comparacao agendaria rascunho, que o legado nao agenda.
  const intocados = ESTADOS_EDITORIAIS.filter(
    (estado) => estado !== ESTADO_PUBLICADO && estado !== ESTADO_AGENDADO,
  );

  assert.equal(intocados.length, 10);

  for (const estado of intocados) {
    for (const deslocamento of [-3600, 0, 59, 60, 3600]) {
      assert.equal(
        resolverEstadoPelaData(
          { tipo: 'post', estado, dataGmt: dataDoBanco(AGORA + deslocamento) },
          AGORA,
        ),
        estado,
      );
    }
  }
});

/* ── CA-6.2: AGENDADO COM DATA NO PASSADO PUBLICA PELA MESMA COMPARACAO ────── */

test('CA-6.2 agendado com data no passado e publicado pela mesma comparacao', () => {
  // `:4804`-`:4806`. "A conversao e bidirecional e ninguem a comanda" (UC-04).
  assert.equal(
    resolverEstadoPelaData(
      { tipo: 'post', estado: ESTADO_AGENDADO, dataGmt: dataDoBanco(AGORA - 1) },
      AGORA,
    ),
    ESTADO_PUBLICADO,
  );
});

test('CA-6.2 a volta usa a MESMA folga de 60 segundos, com a comparacao complementar', () => {
  function estadoCom(deslocamento: number): string {
    return resolverEstadoPelaData(
      {
        tipo: 'post',
        estado: ESTADO_AGENDADO,
        dataGmt: dataDoBanco(AGORA + deslocamento),
      },
      AGORA,
    );
  }

  // `< MINUTE_IN_SECONDS` contra o `>=` do outro ramo: as duas comparacoes sao
  // complementares, logo nao existe data que caia nos dois nem que escape dos
  // dois. Um conteudo agendado para 59 segundos a frente e publicado na propria
  // gravacao.
  assert.equal(estadoCom(59), ESTADO_PUBLICADO);
  assert.equal(estadoCom(60), ESTADO_AGENDADO);
  assert.equal(estadoCom(0), ESTADO_PUBLICADO);
  assert.equal(estadoCom(-3600), ESTADO_PUBLICADO);
});

test('CA-6.2 o anexo tambem nao volta: a excecao vale nos dois sentidos', () => {
  assert.equal(
    resolverEstadoPelaData(
      {
        tipo: TIPO_FORA_DA_COMPARACAO_DE_DATA,
        estado: ESTADO_AGENDADO,
        dataGmt: dataDoBanco(AGORA - 3600),
      },
      AGORA,
    ),
    ESTADO_AGENDADO,
  );
});

test('CA-6.2 data que o legado nao consegue ler publica o agendado, por coercao', () => {
  // `strtotime()` devolve `false` e a SUBTRACAO do PHP o ve como `0`, logo a
  // distancia e um numero muito negativo. A sentinela e o caso real: ela recusa
  // mes e dia zero. Ver `instante-da-data.ts`.
  assert.equal(instanteDaDataDoBanco(DATA_SENTINELA), null);

  for (const dataGmt of [DATA_SENTINELA, 'nao e data', '']) {
    assert.equal(
      resolverEstadoPelaData(
        { tipo: 'post', estado: ESTADO_AGENDADO, dataGmt },
        AGORA,
      ),
      ESTADO_PUBLICADO,
    );
    // E um publicado com a mesma data ilegivel permanece publicado.
    assert.equal(
      resolverEstadoPelaData(
        { tipo: 'post', estado: ESTADO_PUBLICADO, dataGmt },
        AGORA,
      ),
      ESTADO_PUBLICADO,
    );
  }
});

test('CA-6.2 a comparacao nao le relogio nenhum: o instante chega por argumento', () => {
  // O legado le `$now` UMA vez por gravacao (`:4798`) e o compara nos dois
  // ramos. Ler duas vezes abriria uma janela de um segundo entre as comparacoes,
  // e e por isso que esta funcao e pura.
  const dataGmt = dataDoBanco(AGORA + 60);

  assert.equal(
    resolverEstadoPelaData({ tipo: 'post', estado: ESTADO_PUBLICADO, dataGmt }, AGORA),
    ESTADO_AGENDADO,
  );
  assert.equal(
    resolverEstadoPelaData(
      { tipo: 'post', estado: ESTADO_PUBLICADO, dataGmt },
      AGORA + 1,
    ),
    ESTADO_PUBLICADO,
  );
});

/* ── CA-6.3: A HORA DE PUBLICAR RECUSA O QUE NAO ESTA MAIS AGENDADO ────────── */

test('CA-6.3 o que nao esta mais agendado nao e publicado, e nada acontece', () => {
  // `:5489`: `if ( 'future' !== $post->post_status ) { return; }`. O docblock do
  // legado diz a intencao: "This safeguard prevents cron from publishing
  // drafts, etc." (`:5475`).
  for (const estado of ['draft', 'publish', 'pending', 'private', 'trash']) {
    const { contexto, dados, chamadasDaFila, pontos } = cenario({
      linha: linhaDeConteudo({ post_status: estado }),
    });

    const resultado = publicarSeAindaAgendado(contexto, ID);

    assert.equal(resultado.desfecho, 'nao-esta-agendado');
    assert.equal(resultado.publicacao, null);
    assert.equal(resultado.reagendamento, null);
    // Efeito no banco: NENHUM. E nenhum ponto de extensao e nenhuma fila — e
    // nenhum erro: PT-002 cobra "nenhuma das duas registra erro".
    assert.deepEqual(dados.escritas, []);
    assert.deepEqual(chamadasDaFila, []);
    assert.deepEqual(pontos, []);
  }
});

test('CA-6.3 a guarda de estado vem ANTES da de data, e isso impede reagendar rascunho', () => {
  const { contexto, chamadasDaFila, leiturasDoRelogio } = cenario({
    // Um rascunho com data no futuro: se a ordem fosse invertida, ele seria
    // REAGENDADO — isto e, um evento de publicacao posto na fila para um
    // rascunho, que o legado nunca poe.
    linha: linhaDeConteudo({
      post_status: 'draft',
      post_date_gmt: dataDoBanco(AGORA + 3600),
    }),
  });

  const resultado = publicarSeAindaAgendado(contexto, ID);

  assert.equal(resultado.desfecho, 'nao-esta-agendado');
  assert.deepEqual(chamadasDaFila, []);
  // E o relogio nem e lido: a data nao chega a ser comparada.
  assert.equal(leiturasDoRelogio(), 0);
});

test('CA-6.3 conteudo inexistente e silencio, nao erro', () => {
  // `:5485`: `if ( ! $post ) { return; }`. A funcao nao devolve valor nenhum no
  // legado — "wp_publish_post() returns no meaningful value" — e nada aqui
  // inventa mensagem para o caso (P7).
  const { contexto, dados, chamadasDaFila } = cenario({ leituras: 0 });

  const resultado = publicarSeAindaAgendado(contexto, ID);

  assert.equal(resultado.desfecho, 'inexistente');
  assert.equal(resultado.conteudo, null);
  assert.deepEqual(dados.escritas, []);
  assert.deepEqual(chamadasDaFila, []);
});

test('CA-6.3 as duas verificacoes sao independentes, e a prioridade do registro e 10', () => {
  // UC-04 as chama de "dois guardas independentes", e e o unico ponto do sistema
  // que desconfia da propria fila. O registro e
  // `add_action( 'publish_future_post', 'check_and_publish_future_post', 10, 1 )`
  // (`wp-includes/default-filters.php:357`): uma extensao registrada em 5 roda
  // antes da verificacao dupla e ve o conteudo ainda em `future`.
  assert.equal(PRIORIDADE_DA_VERIFICACAO_DUPLA, 10);

  // Guarda 1 sozinha: estado errado, data boa.
  const comEstadoErrado = cenario({
    linha: linhaDeConteudo({
      post_status: 'draft',
      post_date_gmt: dataDoBanco(AGORA - 1),
    }),
  });
  assert.equal(
    publicarSeAindaAgendado(comEstadoErrado.contexto, ID).desfecho,
    'nao-esta-agendado',
  );

  // Guarda 2 sozinha: estado certo, data que nao chegou.
  const comDataAFrente = cenario({
    linha: linhaDeConteudo({ post_date_gmt: dataDoBanco(AGORA + 1) }),
  });
  assert.equal(
    publicarSeAindaAgendado(comDataAFrente.contexto, ID).desfecho,
    'reagendado',
  );

  // As duas passando: publica.
  const comAsDuas = cenario({
    linha: linhaDeConteudo({ post_date_gmt: dataDoBanco(AGORA) }),
  });
  assert.equal(
    publicarSeAindaAgendado(comAsDuas.contexto, ID).desfecho,
    'publicado',
  );
});

/* ── CA-6.4: DATA QUE NAO CHEGOU REAGENDA EM LUGAR DE PUBLICAR ─────────────── */

test('CA-6.4 a data que nao chegou reagenda, e nao publica', () => {
  const instante = AGORA + 3600;
  const { contexto, dados, chamadasDaFila, pontos } = cenario({
    linha: linhaDeConteudo({ post_date_gmt: dataDoBanco(instante) }),
  });

  const resultado = publicarSeAindaAgendado(contexto, ID);

  // `:5495`, com o comentario do legado na linha: "Uh oh, someone jumped the
  // gun!". Limpa e agenda, nesta ordem — a limpeza traz o comentario "Clear
  // anything else in the system." (`:5497`).
  assert.equal(resultado.desfecho, 'reagendado');
  assert.equal(resultado.publicacao, null);
  assert.deepEqual(chamadasDaFila, [LIMPAR, agendarEm(instante)]);

  // Efeito no banco: NENHUM. Reagendar nao escreve, e nenhum ponto de extensao
  // dispara — nada transitou.
  assert.deepEqual(dados.escritas, []);
  assert.deepEqual(pontos, []);
});

test('CA-6.4 o reagendamento usa o MESMO instante, sem adiar e sem folga', () => {
  const instante = AGORA + 1;
  const { contexto, chamadasDaFila } = cenario({
    linha: linhaDeConteudo({ post_date_gmt: dataDoBanco(instante) }),
  });

  const resultado = publicarSeAindaAgendado(contexto, ID);

  // PT-002: "as duas reagendam a tarefa, com o mesmo proximo horario". O legado
  // reusa o `$time` que a comparacao acabou de rejeitar (`:5498`).
  assert.equal(resultado.reagendamento?.instanteEmSegundos, instante);
  assert.deepEqual(chamadasDaFila, [LIMPAR, agendarEm(instante)]);
});

test('CA-6.4 a borda e `>`: data igual ao instante corrente publica', () => {
  // `if ( $time > time() )` (`:5496`). Nao ha folga nenhuma nesta comparacao —
  // ao contrario dos 60 segundos da gravacao —, e e por isso que um conteudo
  // pode ser agendado na gravacao e publicado no segundo exato da data.
  const noSegundoExato = cenario({
    linha: linhaDeConteudo({ post_date_gmt: dataDoBanco(AGORA) }),
  });
  assert.equal(
    publicarSeAindaAgendado(noSegundoExato.contexto, ID).desfecho,
    'publicado',
  );

  const umSegundoDepois = cenario({
    linha: linhaDeConteudo({ post_date_gmt: dataDoBanco(AGORA + 1) }),
  });
  assert.equal(
    publicarSeAindaAgendado(umSegundoDepois.contexto, ID).desfecho,
    'reagendado',
  );
});

test('CA-6.4 data ilegivel NAO reagenda: a comparacao do PHP a trata como falso', () => {
  // `false > time()` converte o inteiro para booleano, e `false > true` e falso.
  // Logo um conteudo em `future` com a data sentinela e PUBLICADO pela fila no
  // primeiro disparo, em vez de ficar agendado para sempre. Ver
  // `instante-da-data.ts`.
  const { contexto, chamadasDaFila } = cenario({
    linha: linhaDeConteudo({ post_date_gmt: DATA_SENTINELA }),
  });

  const resultado = publicarSeAindaAgendado(contexto, ID);

  assert.equal(resultado.desfecho, 'publicado');
  assert.ok(!chamadasDaFila.some((chamada) => chamada.startsWith('agendar')));
});

test('CA-6.4 o relogio e lido uma vez, e o resultado da fila nao muda o fluxo (P7)', () => {
  const instante = AGORA + 3600;
  const { contexto, chamadasDaFila, leiturasDoRelogio } = cenario({
    linha: linhaDeConteudo({ post_date_gmt: dataDoBanco(instante) }),
    eventosRemovidos: false,
    agendamentoAceito: false,
  });

  const resultado = publicarSeAindaAgendado(contexto, ID);

  // O legado ignora os dois retornos: um `false` no agendamento significa
  // conteudo em `future` SEM evento na fila, em silencio — e a fila tem duas
  // razoes para recusar (instante `<= 0`, `wp-includes/cron.php:50`, e duplicata
  // na janela de 10 minutos, `:134`). O desfecho continua `reagendado`.
  assert.equal(resultado.desfecho, 'reagendado');
  assert.equal(resultado.reagendamento?.eventosRemovidos, false);
  assert.equal(resultado.reagendamento?.agendado, false);
  assert.deepEqual(chamadasDaFila, [LIMPAR, agendarEm(instante)]);
  assert.equal(leiturasDoRelogio(), 1);
});

/* ── A PUBLICACAO QUE A FILA FAZ, QUANDO AS DUAS GUARDAS PASSAM ───────────── */

test('a data que chegou publica por `wp_publish_post()`, e ela recebe o IDENTIFICADOR', () => {
  const { contexto, dados, chamadasDaFila, pontos } = cenario({
    linha: linhaDeConteudo({ post_date_gmt: dataDoBanco(AGORA - 1) }),
  });

  const resultado = publicarSeAindaAgendado(contexto, ID);

  assert.equal(resultado.desfecho, 'publicado');
  assert.equal(resultado.publicacao?.desfecho, 'publicado');
  assert.equal(resultado.publicacao?.estadoAnterior, ESTADO_AGENDADO);

  // `:5503`: `wp_publish_post( $post->ID )` — o identificador, nao o registro
  // que ela ja tem em maos. Logo a linha e RELIDA: uma leitura da verificacao
  // dupla, mais as tres de `wp_publish_post()`. Passar o objeto para economizar
  // a consulta mudaria a sequencia que a area 3 da Decisao 2 compara.
  assert.equal(dados.selecoes.length, 4);

  // E a escrita e a de US-1: UMA coluna.
  assert.equal(dados.escritas.length, 1);
  assert.equal(
    dados.escritas[0]?.texto,
    'UPDATE wp_posts SET post_status = ? WHERE ID = ?',
  );
  assert.deepEqual(dados.escritas[0]?.parametros.map(textoDoParametro), [
    ESTADO_PUBLICADO,
    String(ID),
  ]);

  // A transicao `future` -> `publish` dispara, e com ela a limpeza do evento.
  assert.ok(pontos.includes('future_to_publish'));
  assert.deepEqual(chamadasDaFila, [LIMPAR]);
});

test('publicar pela fila nao exige capacidade nenhuma, e isso e o legado (P4)', () => {
  // `add_action( 'publish_future_post', 'check_and_publish_future_post', 10, 1 )`:
  // quem chama e a fila, e nao ha ator no disparo. Dar um portao de capacidade
  // aqui tornaria a publicacao agendada dependente de quem passou pelo site.
  const { contexto, dados } = cenario({
    linha: linhaDeConteudo({ post_date_gmt: dataDoBanco(AGORA - 1) }),
  });

  const resultado = publicarSeAindaAgendado(
    { ...contexto, ator: ATOR_ANONIMO },
    ID,
  );

  assert.equal(resultado.desfecho, 'publicado');
  assert.equal(resultado.publicacao?.desfecho, 'publicado');
  assert.equal(dados.escritas.length, 1);
});

test('com o registro em maos a verificacao dupla nao o rele (get_post aceita int|WP_Post)', () => {
  const { contexto, dados } = cenario({
    linha: linhaDeConteudo({ post_status: 'draft' }),
    leituras: 0,
  });

  const resultado = publicarSeAindaAgendado(contexto, {
    id: ID,
    autorId: 7,
    data: dataDoBanco(AGORA + 3600),
    dataGmt: dataDoBanco(AGORA + 3600),
    corpo: 'corpo',
    titulo: 'titulo',
    resumo: '',
    estado: 'draft',
    estadoDeComentario: 'open',
    estadoDeNotificacao: 'open',
    senha: '',
    identificadorNaUrl: 'titulo',
    aPingar: '',
    pingados: '',
    modificadoEm: dataDoBanco(AGORA),
    modificadoEmGmt: dataDoBanco(AGORA),
    corpoFiltrado: '',
    vinculo: { tipo: 'sem-pai' },
    guid: ENDERECO,
    ordemNoMenu: 0,
    tipo: 'post',
    tipoMime: '',
    contagemDeComentarios: 0,
  });

  assert.equal(resultado.desfecho, 'nao-esta-agendado');
  assert.deepEqual(dados.selecoes, []);
});

/* ── CA-6.5: QUALQUER TRANSICAO DE ESTADO LIMPA O EVENTO PENDENTE ──────────── */

test('CA-6.5 toda transicao de estado limpa o evento pendente daquele conteudo', () => {
  // `:8189`, com o comentario do legado por cima: "Always clears the hook in
  // case the post status bounced from future to draft." A limpeza e
  // incondicional e esta no ouvinte do ponto 1, que CA-1.5 ja cobrava — sao o
  // MESMO codigo, cobrado por duas historias.
  const pares: readonly (readonly [string, string])[] = [
    [ESTADO_AGENDADO, 'draft'],
    [ESTADO_AGENDADO, 'trash'],
    ['draft', 'pending'],
    ['pending', 'private'],
    ['publish', 'draft'],
    ['auto-draft', 'draft'],
  ];

  for (const [estadoAnterior, estadoNovo] of pares) {
    const { contexto, chamadasDaFila } = cenario({ leituras: 0 });

    transitar(contexto, estadoNovo, estadoAnterior);

    // O argumento viaja: limpar sem o identificador apagaria o evento de todo
    // conteudo agendado do site.
    assert.equal(
      chamadasDaFila[0],
      LIMPAR,
      `a transicao ${estadoAnterior} -> ${estadoNovo} nao limpou o evento`,
    );
  }
});

/* ── O OUVINTE QUE POE O EVENTO NA FILA, AO ENTRAR EM AGENDADO ─────────────── */

/** Uma transicao para um estado qualquer, com o registro do cenario. */
function transitar(
  contexto: ContextoDePublicacao,
  estadoNovo: string,
  estadoAnterior: string,
  tipo = 'post',
  data = dataDoBanco(AGORA + 3600),
): ReturnType<typeof transitarEstado> {
  return transitarEstado(contexto, {
    estadoNovo,
    estadoAnterior,
    conteudo: {
      id: ID,
      autorId: 7,
      data,
      dataGmt: dataDoBanco(AGORA + 3600),
      corpo: 'corpo',
      titulo: 'titulo',
      resumo: '',
      estado: estadoNovo,
      estadoDeComentario: 'open',
      estadoDeNotificacao: 'open',
      senha: '',
      identificadorNaUrl: 'titulo',
      aPingar: '',
      pingados: '',
      modificadoEm: dataDoBanco(AGORA),
      modificadoEmGmt: dataDoBanco(AGORA),
      corpoFiltrado: '',
      vinculo: { tipo: 'sem-pai' },
      guid: ENDERECO,
      ordemNoMenu: 0,
      tipo,
      tipoMime: '',
      contagemDeComentarios: 0,
    },
  });
}

test('entrar em agendado limpa DUAS vezes e agenda uma, nesta ordem', () => {
  const { contexto, chamadasDaFila } = cenario({ leituras: 0 });

  const efeitos = transitar(contexto, ESTADO_AGENDADO, 'draft');

  // Sao dois ouvintes do nucleo em dois pontos diferentes da mesma transicao:
  // `_transition_post_status()` limpa incondicionalmente no ponto 1 (`:8189`) e
  // `_future_post_hook()` limpa de novo e agenda no ponto 3 (`:8206`-`:8207`).
  // Fundir as duas numa "otimizacao" muda a sequencia que o ultimo cenario de
  // PT-002 compara — "a sequencia de chamadas registrada e identica nas duas
  // metades".
  assert.deepEqual(chamadasDaFila, [LIMPAR, LIMPAR, agendarEm(AGORA + 3600)]);
  assert.equal(efeitos.eventoDePublicacaoAgendada?.agendado, true);
  assert.equal(efeitos.eventosAgendadosRemovidos, 1);
});

test('o ouvinte de agendamento roda no ponto 3, em 5, ANTES do interceptador de terceiro', () => {
  const { contexto } = cenario({ leituras: 0 });
  const ordem: string[] = [];

  const comObservador: ContextoDePublicacao = {
    ...contexto,
    fila: {
      ...contexto.fila,
      agendarEventoUnico(instante, gancho, argumentos) {
        ordem.push('nucleo');
        return contexto.fila.agendarEventoUnico(instante, gancho, argumentos);
      },
    },
    ganchos: {
      ...contexto.ganchos,
      aoEntrarNoEstadoDoTipo() {
        ordem.push('terceiro');
      },
    },
  };

  transitar(comObservador, ESTADO_AGENDADO, 'draft');

  // `add_action( 'future_' . $this->name, '_future_post_hook', 5, 2 )`
  // (`wp-includes/class-wp-post-type.php:767`), e `add_action` sem prioridade
  // entra em 10: quem escuta `future_post` de uma extensao ve o evento JA na
  // fila.
  assert.deepEqual(ordem, ['nucleo', 'terceiro']);
  assert.equal(PRIORIDADE_DO_OUVINTE_DE_AGENDAMENTO, 5);
});

test('so a entrada em agendado agenda: o ouvinte esta registrado em `future_{tipo}`', () => {
  for (const estadoNovo of ['publish', 'draft', 'pending', 'private', 'trash']) {
    const { contexto, chamadasDaFila } = cenario({ leituras: 2 });

    const efeitos = transitar(contexto, estadoNovo, 'draft');

    assert.equal(efeitos.eventoDePublicacaoAgendada, null);
    assert.ok(
      !chamadasDaFila.some((chamada) => chamada.startsWith('agendar')),
      `a transicao para ${estadoNovo} agendou um evento`,
    );
  }
});

test('tipo que ninguem registrou entra em agendado SEM evento na fila', () => {
  // `WP_Post_Type::add_hooks()` roda em `register_post_type()`, e
  // `remove_hooks()` o desfaz em `unregister_post_type()`
  // (`class-wp-post-type.php:767` e `:856`). Logo o conteudo de um tipo nao
  // registrado fica agendado para sempre: a mesma tolerancia a tipo e estado nao
  // registrados que o vocabulario documenta, e recusar seria outro produto (P1).
  const { contexto, chamadasDaFila } = cenario({ leituras: 0 });

  const efeitos = transitar(
    contexto,
    ESTADO_AGENDADO,
    'draft',
    'tipo-de-extensao-nao-registrado',
  );

  assert.equal(efeitos.eventoDePublicacaoAgendada, null);
  // A limpeza do ponto 1 acontece de qualquer forma: ela nao depende do tipo.
  assert.deepEqual(chamadasDaFila, [LIMPAR]);
});

test('o ouvinte de agendamento parte de `post_date` convertida, nao de `post_date_gmt`', () => {
  // `:8207`: `strtotime( get_gmt_from_date( $post->post_date ) . ' GMT' )`. O
  // docblock do legado diz o contrario ("The $post properties used and must
  // exist are 'ID' and 'post_date_gmt'", `:8195`), e o codigo vence: P1 poe o
  // comportamento observavel como especificacao. Com o fuso deslocado, as duas
  // colunas dao instantes diferentes e o evento vai para o da LOCAL convertida.
  const UMA_HORA = 3600;
  const { contexto, chamadasDaFila } = cenario({
    leituras: 0,
    deslocamentoDoFuso: UMA_HORA,
  });

  const efeitos = transitar(
    contexto,
    ESTADO_AGENDADO,
    'draft',
    'post',
    // `post_date` local, enquanto o `dataGmt` do registro fica em AGORA + 3600.
    dataDoBanco(AGORA + 2 * UMA_HORA),
  );

  assert.equal(
    efeitos.eventoDePublicacaoAgendada?.instanteEmSegundos,
    AGORA + UMA_HORA,
  );
  assert.deepEqual(chamadasDaFila, [LIMPAR, LIMPAR, agendarEm(AGORA + UMA_HORA)]);
});

test('data que `get_gmt_from_date()` nao le vira epoca zero, e a fila recusa em silencio', () => {
  // `get_gmt_from_date()` devolve `gmdate( $format, 0 )` quando nao consegue
  // criar a data (`wp-includes/formatting.php:3744`-`:3745`), e `strtotime()`
  // daquele texto e `0` — instante que a fila recusa de saida
  // (`wp-includes/cron.php:50`). O conteudo fica em `future` sem evento, sem
  // erro e sem registro. E P7.
  const { contexto, chamadasDaFila } = cenario({
    leituras: 0,
    agendamentoAceito: false,
  });

  const efeitos = transitar(
    contexto,
    ESTADO_AGENDADO,
    'draft',
    'post',
    'nao e data',
  );

  assert.equal(efeitos.eventoDePublicacaoAgendada?.instanteEmSegundos, 0);
  assert.equal(efeitos.eventoDePublicacaoAgendada?.agendado, false);
  assert.deepEqual(chamadasDaFila, [LIMPAR, LIMPAR, agendarEm(0)]);
});

/* ── A LEITURA DE DATA, QUE E O QUE DECIDE AS QUATRO COMPARACOES ───────────── */

test('a data do banco e lida em segundos inteiros UTC, com o sufixo GMT irrelevante', () => {
  // `wp-settings.php:73` executa `date_default_timezone_set( 'UTC' )`, logo as
  // duas formas do legado — com e sem `' GMT'` — colapsam na mesma leitura.
  assert.equal(instanteDaDataDoBanco('1970-01-01 00:00:00'), 0);
  assert.equal(instanteDaDataDoBanco('2026-10-08 12:00:00'), AGORA);
  assert.equal(instanteDaDataDoBanco('2026-10-08 12:00:01'), AGORA + 1);

  // O ano de quatro digitos vale ao pe da letra. `Date.UTC( 99, 0, 1 )` mapeia
  // ano de dois digitos para o seculo XX e daria 1999: a leitura usa
  // `setUTCFullYear` justamente para nao fazer isso.
  const anoNoventaENove = new Date(0);
  anoNoventaENove.setUTCFullYear(99, 0, 1);
  anoNoventaENove.setUTCHours(0, 0, 0, 0);

  assert.equal(
    instanteDaDataDoBanco('0099-01-01 00:00:00'),
    anoNoventaENove.getTime() / 1000,
  );
  assert.notEqual(
    instanteDaDataDoBanco('0099-01-01 00:00:00'),
    Date.UTC(99, 0, 1) / 1000,
  );
});

test('o que `strtotime()` recusa, esta leitura recusa — e mes ou dia zero e o caso real', () => {
  // A sentinela e o unico desses que o produto grava, e ela carrega significado
  // de negocio (`DB-SENT`): marca o conteudo cujo estado declara data flutuante.
  assert.equal(instanteDaDataDoBanco(DATA_SENTINELA), null);
  assert.equal(instanteDaDataDoBanco('2026-00-08 12:00:00'), null);
  assert.equal(instanteDaDataDoBanco('2026-10-00 12:00:00'), null);
  assert.equal(instanteDaDataDoBanco('2026-13-08 12:00:00'), null);
  assert.equal(instanteDaDataDoBanco(''), null);
  assert.equal(instanteDaDataDoBanco('2026-10-08'), null);
  assert.equal(instanteDaDataDoBanco('2026-10-08 12:00:00 GMT'), null);
});

test('data fora do calendario NAO e recusada: nao ha validacao de calendario aqui', () => {
  // A decisao afirmada e a ausencia de validacao: o legado nao chama
  // `checkdate()` neste caminho — quem o chama e `wp_checkdate()`, no caminho de
  // resolucao da data (`wp-includes/post.php:5520`, T005) —, logo recusar aqui
  // seria recusar data que o agendamento aceita.
  //
  // ⚠️ O instante exato que o `strtotime()` do PHP devolve para uma data fora do
  // calendario e semantica do parser do PHP, nao codigo do legado: **nao se le
  // na arvore e so fecha contra o oraculo executavel** (T001 da feature 015). O
  // acomodamento do `Date` do runtime foi adotado como a aproximacao mais
  // proxima do que o PHP documenta, e esta afirmado aqui para que a divergencia,
  // se houver, apareca num teste e nao num bug.
  assert.equal(
    instanteDaDataDoBanco('2026-02-30 00:00:00'),
    Date.UTC(2026, 2, 2, 0, 0, 0) / 1000,
  );
});
