/**
 * Os cinco criterios de **US-1**, afirmados contra o sistema novo — entrega de
 * **T003** da feature `008-privacidade-e-dados-pessoais`.
 *
 * | criterio | o que esta suite afirma |
 * |---|---|
 * | CA-1.1 | a capacidade de cada tela, a recusa como valor, e que a recusa **nao emite comando nenhum** |
 * | CA-1.2 | a solicitacao nasce em `request-pending`, com o endereco em `post_title` e sem chave |
 * | CA-1.3 | titular sem conta no site nasce com `post_author = 0`, e a solicitacao vale |
 * | CA-1.4 | a solicitacao aparece na lista, com o estado visivel, e a paginacao de fabrica |
 * | CA-1.5 | nada e exportado nem apagado: nem provedor, nem e-mail, nem escrita |
 *
 * **Nao sao os testes do catalogo.** `UT-086-1` a `UT-086-7` sao a tarefa `[P]`
 * **T004**, que os **transcreve** de `backlog/tests.md` com o mesmo dado de
 * entrada, acao e resultado. O que esta aqui sao os criterios de aceite da
 * tarefa de implementacao, afirmados por **efeito no banco** e **sequencia de
 * comandos**, que e o criterio desta area (area 3 da Decisao 2 de
 * `parity_specs.md`).
 *
 * **Nao ha teste de prazo aqui, e isso e de proposito.** US-1 nao tem prazo: a
 * chave e o vencimento de 24 horas sao de T005, e o P6 cobra o teste de borda
 * junto com o numero. O unico numero desta tarefa e a paginacao da lista, e a
 * borda dele esta afirmada.
 *
 * ⚠️ **Os dobles das quatro sanitizacoes nao sao `sanitize_email()`,
 * `is_email()`, `sanitize_key()` nem `sanitize_text_field()`**, e nao poderiam
 * ser: as quatro sao de `plataforma/formatacao/` (feature 015) e chegam por
 * argumento justamente para que esta pasta nao as reimplemente — a razao esta em
 * `./contexto-de-abertura.ts`. O que estes dobles reproduzem e o **contrato**
 * delas (o que cada uma devolve para a entrada do teste), e e so sobre isso que
 * os testes afirmam.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type Capacidade,
} from '../../../plataforma/autorizacao/index.js';
import type { LinhaDeResultado, MensagemDeEmail } from '../portas/index.js';
import {
  criarArmazenamentoDePrivacidade,
  criarPortaDeDadosFalsa,
  ESTADO_CONCLUIDO,
  ESTADO_CONFIRMADO,
  ESTADO_DE_FALHA,
  ESTADO_PENDENTE,
  MARCADOR_DE_RESUMO_GENERICO,
  SEM_CONTA,
  TIPO_DE_SOLICITACAO,
  type PortaDeDadosFalsa,
} from '../armazenamento/index.js';
import { criarRegistroDeProvedores } from '../registro/index.js';
import {
  abrirSolicitacao,
  ERROS_DA_ABERTURA,
  ESTADOS_DE_SOLICITACAO_INCOMPLETA,
  ESTADO_PEDIDO_PADRAO,
} from './abrir-solicitacao.js';
import type {
  ContaDoTitular,
  ContextoDeAbertura,
  PedidoDeInsercaoDaSolicitacao,
  ResultadoDaConsultaDeSolicitacoes,
  VariaveisDaConsultaDeSolicitacoes,
} from './contexto-de-abertura.js';
import {
  ESTADO_QUALQUER_NA_LISTA,
  ITENS_POR_PAGINA_DA_LISTA,
  estadoVisivelNaLista,
  itensPorPaginaDaLista,
  listarSolicitacoes,
} from './lista-de-solicitacoes.js';
import {
  autorizarAbertura,
  CAPACIDADE_DE_APAGAR_CONTAS,
  CAPACIDADE_DE_APAGAR_DADO_DE_TERCEIRO,
  CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO,
  MENSAGEM_DE_APAGAMENTO_NAO_PERMITIDO,
  MENSAGEM_DE_EXPORTACAO_NAO_PERMITIDA,
  RECUSA_PADRAO_DE_TELA,
} from './permissao-de-abertura.js';
import {
  abrirSolicitacaoPelaTela,
  AJUSTE_DO_ENDERECO,
  AJUSTE_DO_TIPO_DE_ACAO,
  MENSAGENS_DA_TELA_DE_ABERTURA,
} from './tela-de-abertura.js';

const ENDERECO = 'titular@exemplo.invalido';
const ACAO_DE_EXPORTAR = 'export_personal_data';
const ACAO_DE_APAGAR = 'remove_personal_data';

/** Tudo o que o cenario registra, para afirmar sequencia de comandos. */
interface Registros {
  readonly insercoes: PedidoDeInsercaoDaSolicitacao[];
  readonly consultas: VariaveisDaConsultaDeSolicitacoes[];
  readonly enderecosConsultados: string[];
  readonly loginsConsultados: string[];
  readonly emails: MensagemDeEmail[];
  readonly exportacoes: string[];
  readonly apagamentos: string[];
}

interface OpcoesDoCenario {
  /** O que o ator tem concedido. */
  readonly capacidades?: readonly Capacidade[];
  /** A conta que `get_user_by( 'email', ... )` devolve. */
  readonly contaPorEmail?: ContaDoTitular | null;
  /** A conta que `get_user_by( 'login', ... )` devolve. */
  readonly contaPorLogin?: ContaDoTitular | null;
  /** O que cada `WP_Query` devolve, na ordem das chamadas. */
  readonly consultas?: readonly ResultadoDaConsultaDeSolicitacoes[];
  /** `wp_insert_post()` devolvendo erro. */
  readonly erroDaInsercao?: { readonly codigo: string; readonly mensagem: string };
  /** O identificador que a insercao devolve. */
  readonly idInserido?: number;
  /** `get_user_option( '{acao}_requests_per_page' )`. */
  readonly itensPorPaginaDaConta?: number;
}

interface Cenario {
  readonly contexto: ContextoDeAbertura;
  readonly registros: Registros;
  readonly dados: PortaDeDadosFalsa;
}

function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const registros: Registros = {
    insercoes: [],
    consultas: [],
    enderecosConsultados: [],
    loginsConsultados: [],
    emails: [],
    exportacoes: [],
    apagamentos: [],
  };

  const dados = criarPortaDeDadosFalsa();
  const respostasDeConsulta = [...(opcoes.consultas ?? [])];

  const ator: AtorDeAutorizacao = {
    contaId: 9,
    login: 'quem-administra',
    existe: true,
    concessoes: (opcoes.capacidades ?? []).map((capacidade) => ({
      capacidade,
      concedida: true,
    })),
  };

  // Sem papel na matriz e sem rede: a concessao individual e o unico caminho, e
  // e assim que o teste fica sobre a PERGUNTA e nao sobre a matriz de fabrica.
  const base: BaseDeAutorizacao = {
    matriz: [],
    rede: REDE_INATIVA_NA_AUTORIZACAO,
  };

  const contexto: ContextoDeAbertura = {
    base,
    ator,
    armazenamento: criarArmazenamentoDePrivacidade(dados.porta),
    conta: {
      obterPorEmail(enderecoDeEmail) {
        registros.enderecosConsultados.push(enderecoDeEmail);
        return opcoes.contaPorEmail ?? null;
      },
      obterPorLogin(login) {
        registros.loginsConsultados.push(login);
        return opcoes.contaPorLogin ?? null;
      },
    },
    conteudo: {
      inserirSolicitacao(pedido) {
        registros.insercoes.push(pedido);
        if (opcoes.erroDaInsercao !== undefined) {
          return { inserido: false, ...opcoes.erroDaInsercao };
        }
        return { inserido: true, solicitacaoId: opcoes.idInserido ?? 42 };
      },
    },
    consultarSolicitacoes(variaveis) {
      registros.consultas.push(variaveis);
      return respostasDeConsulta.shift() ?? { ids: [], totalEncontrado: 0 };
    },
    relogio: {
      agoraNoFormatoDoBanco() {
        return '2026-10-14 06:00:00';
      },
      agoraNoFormatoDoBancoEmGmt() {
        return '2026-10-14 09:00:00';
      },
    },
    // `sanitize_email()`: o doble corta o espaco das pontas, que e o efeito
    // visivel dela sobre a entrada destes testes.
    sanitizarEmail: (email) => email.trim(),
    // `is_email()`: o doble reproduz as duas conferencias que o legado faz
    // primeiro — comprimento minimo de 6 (`formatting.php:3619`) e presenca do
    // `@` — e devolve o endereco, como la.
    ehEmail: (email) =>
      email.length >= 6 && email.includes('@') && email.includes('.')
        ? email
        : false,
    // `sanitize_key()`: caixa baixa e so `[a-z0-9_-]`.
    sanitizarChave: (chave) => chave.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
    sanitizarTexto: (texto) => texto.trim(),
    // `wp_json_encode()`: ⚠️ o doble NAO escapa barra nem caractere fora de
    // ASCII, e o legado escapa os dois. A diferenca esta declarada em
    // `./contexto-de-abertura.ts` e nao e exercitada aqui: a tela passa sempre
    // `array()`, que codifica para `[]` nas duas linguagens.
    codificarJson: (valor) => JSON.stringify(valor),
    ...(opcoes.itensPorPaginaDaConta === undefined
      ? {}
      : { itensPorPaginaDaConta: opcoes.itensPorPaginaDaConta }),
  };

  return { contexto, registros, dados };
}

/** A linha de `user_request` como a abertura a deixa, para a lista ler. */
function linhaDeSolicitacao(
  sobreposicoes: Readonly<Record<string, string | number | null>> = {},
): LinhaDeResultado {
  return {
    ID: 42,
    post_author: SEM_CONTA,
    post_date: '2026-10-14 06:00:00',
    post_date_gmt: '2026-10-14 09:00:00',
    post_content: '[]',
    post_title: ENDERECO,
    post_excerpt: '',
    post_status: ESTADO_PENDENTE,
    comment_status: 'closed',
    ping_status: 'closed',
    post_password: '',
    post_name: ACAO_DE_EXPORTAR,
    to_ping: '',
    pinged: '',
    post_modified: '2026-10-14 06:00:00',
    post_modified_gmt: '2026-10-14 09:00:00',
    post_content_filtered: '',
    post_parent: 0,
    guid: '',
    menu_order: 0,
    post_type: TIPO_DE_SOLICITACAO,
    post_mime_type: '',
    comment_count: 0,
    ...sobreposicoes,
  };
}

/* ── CA-1.1 — A CAPACIDADE DA TELA, ANTES DE A TELA ABRIR ──────────────── */

test('CA-1.1 a tela de exportacao exige `export_others_personal_data`', () => {
  const semCapacidade = cenario();

  const recusada = autorizarAbertura(
    { base: semCapacidade.contexto.base, ator: semCapacidade.contexto.ator },
    'tela-de-exportacao',
  );

  // `wp_die( __( 'Sorry, you are not allowed to export personal data on this
  // site.' ) )`, `wp-admin/export-personal-data.php:12` e `:13`. O titulo, o
  // codigo e o 500 sao os defaults que `_wp_die_process_input()` resolve.
  assert.deepEqual(recusada, {
    desfecho: 'recusado',
    recusa: {
      titulo: RECUSA_PADRAO_DE_TELA.titulo,
      codigo: 'wp_die',
      codigoHttp: 500,
      mensagem: MENSAGEM_DE_EXPORTACAO_NAO_PERMITIDA,
    },
  });

  const comCapacidade = cenario({
    capacidades: [CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO],
  });

  assert.deepEqual(
    autorizarAbertura(
      { base: comCapacidade.contexto.base, ator: comCapacidade.contexto.ator },
      'tela-de-exportacao',
    ),
    { desfecho: 'autorizado' },
  );
});

test('CA-1.1 a tela de apagamento exige as DUAS capacidades, e nao uma', () => {
  const soPrivacidade = cenario({
    capacidades: [CAPACIDADE_DE_APAGAR_DADO_DE_TERCEIRO],
  });
  const soContas = cenario({ capacidades: [CAPACIDADE_DE_APAGAR_CONTAS] });
  const asDuas = cenario({
    capacidades: [
      CAPACIDADE_DE_APAGAR_DADO_DE_TERCEIRO,
      CAPACIDADE_DE_APAGAR_CONTAS,
    ],
  });

  // `! current_user_can( 'erase_others_personal_data' ) || ! current_user_can(
  // 'delete_users' )` (`wp-admin/erase-personal-data.php:12`): ter uma so nao
  // abre a tela. Omitir `delete_users` abriria para quem o legado nao abre.
  for (const incompleto of [soPrivacidade, soContas]) {
    const decisao = autorizarAbertura(
      { base: incompleto.contexto.base, ator: incompleto.contexto.ator },
      'tela-de-apagamento',
    );
    assert.equal(decisao.desfecho, 'recusado');
    assert.equal(
      decisao.desfecho === 'recusado' ? decisao.recusa.mensagem : '',
      MENSAGEM_DE_APAGAMENTO_NAO_PERMITIDO,
    );
  }

  assert.deepEqual(
    autorizarAbertura(
      { base: asDuas.contexto.base, ator: asDuas.contexto.ator },
      'tela-de-apagamento',
    ),
    { desfecho: 'autorizado' },
  );
});

test('CA-1.1 a recusa da tela nao emite comando nenhum, e nao cria nada', () => {
  const { contexto, registros, dados } = cenario();

  const resultado = abrirSolicitacaoPelaTela(contexto, {
    superficie: 'tela-de-exportacao',
    action: 'add_export_personal_data_request',
    type_of_action: ACAO_DE_EXPORTAR,
    username_or_email_for_privacy_request: ENDERECO,
    send_confirmation_email: '1',
  });

  assert.equal(resultado.desfecho, 'recusado');
  assert.equal(resultado.solicitacaoId, null);
  assert.deepEqual(resultado.avisos, []);

  // A capacidade e a PRIMEIRA linha da tela: quem nao a tem nao chega a leitura
  // de conta, nao chega a consulta de duplicidade e nao chega a insercao. Lista
  // vazia e afirmacao, nao ausencia.
  assert.deepEqual(registros.enderecosConsultados, []);
  assert.deepEqual(registros.consultas, []);
  assert.deepEqual(registros.insercoes, []);
  assert.deepEqual(dados.selecoes, []);
  assert.deepEqual(dados.escritas, []);
});

test('CA-1.1 🔴 o portao e da TELA: a tela de exportacao cria pedido de apagamento', () => {
  const { contexto, registros } = cenario({
    capacidades: [CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO],
  });

  const resultado = abrirSolicitacaoPelaTela(contexto, {
    superficie: 'tela-de-exportacao',
    action: 'add_remove_personal_data_request',
    // O campo oculto do formulario, que o tratador le sem reconferir
    // (`wp-admin/includes/privacy-tools.php:111`).
    type_of_action: ACAO_DE_APAGAR,
    username_or_email_for_privacy_request: ENDERECO,
    send_confirmation_email: '1',
  });

  /*
    ⚠️ Este teste afirma o LEGADO, e nao o que CA-1.1 diz ao pe da letra. A
    solicitacao de apagamento e criada com o ator tendo SO
    `export_others_personal_data` — nem `erase_others_personal_data` nem
    `delete_users` sao perguntadas em lugar nenhum, porque o `switch` do
    tratador aceita os dois valores de `action` em qualquer uma das duas telas.
    A divergencia esta registrada em `./permissao-de-abertura.ts` e no
    `../README.md`, e NAO foi resolvida: fecha-la mudaria permissao observavel
    sem decisao humana (P1).
  */
  assert.equal(resultado.desfecho, 'tratado');
  assert.equal(resultado.solicitacaoId, 42);
  assert.equal(registros.insercoes.length, 1);
  assert.equal(registros.insercoes[0]?.post_name, ACAO_DE_APAGAR);
});

/* ── CA-1.2 — PENDENTE, E VINCULADA AO ENDERECO ────────────────────────── */

test('CA-1.2 a solicitacao nasce pendente, com as oito chaves do legado', () => {
  const { contexto, registros } = cenario({
    contaPorEmail: { id: 7, enderecoDeEmail: ENDERECO },
  });

  const resultado = abrirSolicitacao(contexto, {
    enderecoDeEmail: ENDERECO,
    acao: ACAO_DE_EXPORTAR,
  });

  assert.deepEqual(resultado, { aberta: true, solicitacaoId: 42 });

  // As oito chaves de `wp_insert_post` (`wp-includes/user.php:4842` a `:4851`),
  // com os nomes e os valores do legado. O cenario @invariante de PT-012 cobra
  // tres destas linhas: o tipo, o campo do endereco e o estado inicial.
  assert.deepEqual(registros.insercoes, [
    {
      post_author: 7,
      post_name: ACAO_DE_EXPORTAR,
      post_title: ENDERECO,
      post_content: '[]',
      post_status: ESTADO_PENDENTE,
      post_type: TIPO_DE_SOLICITACAO,
      post_date: '2026-10-14 06:00:00',
      post_date_gmt: '2026-10-14 09:00:00',
    },
  ]);
});

test('CA-1.2 o estado gravado e `request-` mais o estado pedido, e o default e pendente', () => {
  const padrao = cenario();
  abrirSolicitacao(padrao.contexto, {
    enderecoDeEmail: ENDERECO,
    acao: ACAO_DE_EXPORTAR,
  });

  // `'post_status' => 'request-' . $status`, com `$status = 'pending'` de
  // fabrica (`wp-includes/user.php:4804` e `:4847`).
  assert.equal(padrao.registros.insercoes[0]?.post_status, ESTADO_PENDENTE);
  assert.equal(ESTADO_PEDIDO_PADRAO, 'pending');

  const confirmada = cenario();
  abrirSolicitacao(confirmada.contexto, {
    enderecoDeEmail: ENDERECO,
    acao: ACAO_DE_EXPORTAR,
    estado: 'confirmed',
  });

  // ⚠️ `'confirmed'` e superficie publicada desde a 5.7.0 (P8), e a tela a
  // alcanca — ver o bloco 🔴 de `./tela-de-abertura.ts`. T003 porta a opcao e
  // nao decide nada sobre ela.
  assert.equal(confirmada.registros.insercoes[0]?.post_status, ESTADO_CONFIRMADO);
});

test('CA-1.2 a solicitacao nasce SEM chave: a abertura nao informa `post_password`', () => {
  const { contexto, registros } = cenario();

  abrirSolicitacao(contexto, {
    enderecoDeEmail: ENDERECO,
    acao: ACAO_DE_EXPORTAR,
  });

  // `wp_create_user_request` nao menciona `post_password` (`:4842`-`:4851`): a
  // chave e gerada no ENVIO (`wp_generate_user_request_key`, T005), e o default
  // que `wp_insert_post` resolve e a cadeia vazia. Afirmar a AUSENCIA da chave
  // e afirmar quantas chaves existem por solicitacao.
  const pedido = registros.insercoes[0] as unknown as Record<string, unknown>;
  assert.equal('post_password' in pedido, false);
  assert.equal(
    Object.keys(pedido).includes(MARCADOR_DE_RESUMO_GENERICO),
    false,
  );
});

test('CA-1.2 os tres portoes de validacao recusam ANTES de qualquer comando', () => {
  // `! is_email()` (`:4808`): nem a conta e lida.
  const email = cenario();
  assert.deepEqual(
    abrirSolicitacao(email.contexto, {
      enderecoDeEmail: 'curto',
      acao: ACAO_DE_EXPORTAR,
    }),
    { aberta: false, erro: ERROS_DA_ABERTURA.emailInvalido },
  );

  // `! in_array( $action_name, ... )` (`:4812`).
  const acao = cenario();
  assert.deepEqual(
    abrirSolicitacao(acao.contexto, {
      enderecoDeEmail: ENDERECO,
      acao: 'exportar_tudo',
    }),
    { aberta: false, erro: ERROS_DA_ABERTURA.acaoInvalida },
  );

  // `! in_array( $status, array( 'pending', 'confirmed' ), true )` (`:4816`):
  // nem `request-failed` nem `completed` podem ser pedidos na abertura.
  const estado = cenario();
  assert.deepEqual(
    abrirSolicitacao(estado.contexto, {
      enderecoDeEmail: ENDERECO,
      acao: ACAO_DE_EXPORTAR,
      estado: 'failed',
    }),
    { aberta: false, erro: ERROS_DA_ABERTURA.estadoInvalido },
  );

  for (const recusado of [email, acao, estado]) {
    assert.deepEqual(recusado.registros.enderecosConsultados, []);
    assert.deepEqual(recusado.registros.consultas, []);
    assert.deepEqual(recusado.registros.insercoes, []);
    assert.deepEqual(recusado.dados.selecoes, []);
    assert.deepEqual(recusado.dados.escritas, []);
  }
});

test('CA-1.2 `sanitize_key` na acao: caixa alta nao e acao invalida', () => {
  const { contexto, registros } = cenario();

  const resultado = abrirSolicitacao(contexto, {
    enderecoDeEmail: ENDERECO,
    acao: 'Export_Personal_Data',
  });

  // `$action_name = sanitize_key( $action_name )` acontece ANTES da comparacao
  // (`:4806` e `:4812`), logo o valor gravado em `post_name` e o sanitizado.
  assert.equal(resultado.aberta, true);
  assert.equal(registros.insercoes[0]?.post_name, ACAO_DE_EXPORTAR);
});

test('CA-1.2 solicitacao incompleta identica recusa, e nao grava', () => {
  const { contexto, registros } = cenario({
    consultas: [{ ids: [11], totalEncontrado: 1 }],
  });

  const resultado = abrirSolicitacao(contexto, {
    enderecoDeEmail: ENDERECO,
    acao: ACAO_DE_EXPORTAR,
  });

  assert.deepEqual(resultado, {
    aberta: false,
    erro: ERROS_DA_ABERTURA.solicitacaoDuplicada,
  });

  // A consulta do legado, variavel por variavel (`:4825` a `:4834`). Os dois
  // estados sao SO pendente e confirmada: uma solicitacao em falha ou concluida
  // nao bloqueia a abertura da proxima.
  assert.deepEqual(registros.consultas, [
    {
      post_type: TIPO_DE_SOLICITACAO,
      post_name__in: [ACAO_DE_EXPORTAR],
      title: ENDERECO,
      post_status: ESTADOS_DE_SOLICITACAO_INCOMPLETA,
      fields: 'ids',
    },
  ]);
  assert.deepEqual(ESTADOS_DE_SOLICITACAO_INCOMPLETA, [
    ESTADO_PENDENTE,
    ESTADO_CONFIRMADO,
  ]);
  assert.deepEqual(registros.insercoes, []);
});

test('CA-1.2 a duplicidade decide por `found_posts`, e nao pelas linhas devolvidas', () => {
  // `if ( $requests_query->found_posts )` (`:4837`): com `fields => 'ids'` o
  // legado nem le as linhas. Total zero com identificador na mao **nao** e
  // duplicidade — e o que acontece quando o `LIMIT` da consulta nao bate com a
  // contagem.
  const { contexto } = cenario({
    consultas: [{ ids: [11, 12], totalEncontrado: 0 }],
  });

  assert.deepEqual(
    abrirSolicitacao(contexto, {
      enderecoDeEmail: ENDERECO,
      acao: ACAO_DE_EXPORTAR,
    }),
    { aberta: true, solicitacaoId: 42 },
  );
});

test('CA-1.2 o erro da insercao volta como valor, com o codigo e o texto dele', () => {
  const { contexto } = cenario({
    erroDaInsercao: {
      codigo: 'db_insert_error',
      mensagem: 'Could not insert post into the database.',
    },
  });

  // `wp_insert_post( ..., true )` devolve `WP_Error`, e o legado o devolve sem
  // envolver (`:4855`). AD-06: falha de negocio e valor de retorno.
  assert.deepEqual(
    abrirSolicitacao(contexto, {
      enderecoDeEmail: ENDERECO,
      acao: ACAO_DE_EXPORTAR,
    }),
    {
      aberta: false,
      erro: {
        codigo: 'db_insert_error',
        mensagem: 'Could not insert post into the database.',
      },
    },
  );
});

/* ── CA-1.3 — TITULAR SEM CONTA NO SITE ────────────────────────────────── */

test('CA-1.3 titular sem conta tem solicitacao valida, com `post_author = 0`', () => {
  const { contexto, registros } = cenario({ contaPorEmail: null });

  const resultado = abrirSolicitacao(contexto, {
    enderecoDeEmail: 'visitante@exemplo.invalido',
    acao: ACAO_DE_EXPORTAR,
  });

  // *"Requests are stored inside a post type named `user_request` since they can
  // apply to both users on the site, or guests without a user account"*
  // (`wp-includes/user.php:4790`). A conta e resolvida, nunca exigida: `$user &&
  // ! is_wp_error( $user ) ? $user->ID : 0` (`:4821`).
  assert.equal(resultado.aberta, true);
  assert.equal(registros.insercoes[0]?.post_author, SEM_CONTA);
  assert.equal(registros.insercoes[0]?.post_title, 'visitante@exemplo.invalido');
  assert.deepEqual(registros.enderecosConsultados, [
    'visitante@exemplo.invalido',
  ]);
});

test('CA-1.3 a solicitacao e identificada pelo ENDERECO, e nao pela conta', () => {
  const { contexto, registros } = cenario({
    // A conta existe com OUTRO endereco: o legado grava o endereco informado em
    // `post_title` e a conta em `post_author`, e e por `post_title` que a
    // duplicidade e a lista procuram.
    contaPorEmail: { id: 7, enderecoDeEmail: 'outro@exemplo.invalido' },
  });

  abrirSolicitacao(contexto, {
    enderecoDeEmail: ENDERECO,
    acao: ACAO_DE_EXPORTAR,
  });

  assert.equal(registros.insercoes[0]?.post_title, ENDERECO);
  assert.equal(registros.consultas[0]?.title, ENDERECO);
});

/* ── CA-1.4 — A LISTA, COM O ESTADO VISIVEL ────────────────────────────── */

test('CA-1.4 a solicitacao aparece na lista aguardando o titular, com o estado', () => {
  const { contexto, dados } = cenario({
    consultas: [{ ids: [42], totalEncontrado: 1 }],
  });
  dados.responder([linhaDeSolicitacao()]);
  dados.responder([]);

  const lista = listarSolicitacoes(contexto, { acao: ACAO_DE_EXPORTAR });

  // As variaveis de `prepare_items()` (`class-wp-privacy-requests-table.php:370`
  // a `:377`): `s` esta sempre no arranjo, com cadeia vazia, e o estado pedido e
  // `any` quando ninguem filtrou.
  assert.deepEqual(lista.variaveis, {
    post_type: TIPO_DE_SOLICITACAO,
    post_name__in: [ACAO_DE_EXPORTAR],
    post_status: ESTADO_QUALQUER_NA_LISTA,
    posts_per_page: ITENS_POR_PAGINA_DA_LISTA,
    offset: 0,
    s: '',
  });

  assert.equal(lista.itens.length, 1);
  assert.equal(lista.totalDeItens, 1);
  assert.equal(lista.itens[0]?.solicitacao.enderecoDeEmail, ENDERECO);
  // O estado visivel: pendente, e **sem data** — a coluna de estado so imprime
  // instante em confirmada e concluida (`:449`-`:458`).
  assert.deepEqual(lista.itens[0]?.estadoVisivel, {
    estado: ESTADO_PENDENTE,
    instante: false,
  });
});

test('CA-1.4 a lista le uma linha por solicitacao, e descarta o que nao e do tipo', () => {
  const { contexto, dados } = cenario({
    consultas: [{ ids: [42, 43], totalEncontrado: 2 }],
  });
  dados.responder([linhaDeSolicitacao()]);
  dados.responder([]);
  // A segunda linha e de outro tipo: `wp_get_user_request()` devolve `false` e o
  // `array_filter` de `:404` a descarta — e o total NAO e corrigido (`:408`).
  dados.responder([linhaDeSolicitacao({ ID: 43, post_type: 'post' })]);

  const lista = listarSolicitacoes(contexto, { acao: ACAO_DE_EXPORTAR });

  assert.equal(lista.itens.length, 1);
  assert.equal(lista.totalDeItens, 2);
  // Tres comandos: a linha de `posts` e o metadado da primeira, e a linha de
  // `posts` da segunda — que, sendo de outro tipo, NAO consulta metadado
  // (`user.php:5138`).
  assert.equal(dados.selecoes.length, 3);
});

test('CA-1.4 o instante da coluna de estado sai do metadado do estado correspondente', () => {
  // `switch ( $status )` com dois casos e nenhum `default`
  // (`class-wp-privacy-requests-table.php:451`-`:458`).
  const base = {
    id: 42,
    contaDoTitular: SEM_CONTA,
    enderecoDeEmail: ENDERECO,
    acao: ACAO_DE_EXPORTAR,
    criadaEm: 0,
    modificadaEm: 0,
    confirmadaEm: 1_760_000_000,
    concluidaEm: 1_770_000_000,
    dadosDoPedido: null,
    chaveDeConfirmacao: '',
  };

  assert.deepEqual(estadoVisivelNaLista({ ...base, estado: ESTADO_CONFIRMADO }), {
    estado: ESTADO_CONFIRMADO,
    instante: 1_760_000_000,
  });
  assert.deepEqual(estadoVisivelNaLista({ ...base, estado: ESTADO_CONCLUIDO }), {
    estado: ESTADO_CONCLUIDO,
    instante: 1_770_000_000,
  });
  // Pendente e falha nao mostram data, mesmo com os metadados gravados.
  assert.deepEqual(estadoVisivelNaLista({ ...base, estado: ESTADO_PENDENTE }), {
    estado: ESTADO_PENDENTE,
    instante: false,
  });
  assert.deepEqual(estadoVisivelNaLista({ ...base, estado: ESTADO_DE_FALHA }), {
    estado: ESTADO_DE_FALHA,
    instante: false,
  });
  // `if ( $timestamp )`: o instante zero tambem nao e impresso, e e
  // indistinguivel do metadado ausente — como no legado.
  assert.deepEqual(
    estadoVisivelNaLista({
      ...base,
      estado: ESTADO_CONFIRMADO,
      confirmadaEm: 0,
    }),
    { estado: ESTADO_CONFIRMADO, instante: false },
  );
});

test('CA-1.4 a paginacao de fabrica e 20, e a borda e `< 1` (P6)', () => {
  // `get_items_per_page( $option, $default_value = 20 )` com
  // `empty( $per_page ) || $per_page < 1` (`class-wp-list-table.php:990`-`:992`).
  assert.equal(ITENS_POR_PAGINA_DA_LISTA, 20);
  assert.equal(itensPorPaginaDaLista(cenario().contexto), 20);
  assert.equal(
    itensPorPaginaDaLista(cenario({ itensPorPaginaDaConta: 0 }).contexto),
    20,
  );
  assert.equal(
    itensPorPaginaDaLista(cenario({ itensPorPaginaDaConta: -5 }).contexto),
    20,
  );
  // `1` passa: e o ultimo valor aceito antes da borda.
  assert.equal(
    itensPorPaginaDaLista(cenario({ itensPorPaginaDaConta: 1 }).contexto),
    1,
  );
  assert.equal(
    itensPorPaginaDaLista(cenario({ itensPorPaginaDaConta: 50 }).contexto),
    50,
  );
});

test('CA-1.4 o salto da pagina e `max( 0, absint( paged ) - 1 ) * por_pagina`', () => {
  const comPagina = (pagina: number | undefined): number => {
    const { contexto } = cenario({ consultas: [{ ids: [], totalEncontrado: 0 }] });
    const lista = listarSolicitacoes(
      contexto,
      pagina === undefined ? { acao: ACAO_DE_EXPORTAR } : { acao: ACAO_DE_EXPORTAR, pagina },
    );
    return lista.variaveis.offset ?? -1;
  };

  // `:374`. Pagina ausente, 0 e 1 saltam nada; negativa vira positiva por
  // `absint`, logo `-3` salta como `3`.
  assert.equal(comPagina(undefined), 0);
  assert.equal(comPagina(0), 0);
  assert.equal(comPagina(1), 0);
  assert.equal(comPagina(3), 40);
  assert.equal(comPagina(-3), 40);
});

test('CA-1.4 a ordenacao e o filtro da tela entram so quando a requisicao os pede', () => {
  const semNada = cenario({ consultas: [{ ids: [], totalEncontrado: 0 }] });
  const variaveisSemNada = listarSolicitacoes(semNada.contexto, {
    acao: ACAO_DE_EXPORTAR,
    // Valor fora do mapa de ordenacao: o legado nao acrescenta `orderby` e nao
    // recusa (`:384`).
    ordenarPor: 'coluna-que-nao-existe',
    ordem: 'aleatoria',
    filtroDeEstado: '',
  }).variaveis;

  assert.equal(variaveisSemNada.orderby, undefined);
  assert.equal(variaveisSemNada.order, undefined);
  assert.equal(variaveisSemNada.post_status, ESTADO_QUALQUER_NA_LISTA);

  const comTudo = cenario({ consultas: [{ ids: [], totalEncontrado: 0 }] });
  const variaveisComTudo = listarSolicitacoes(comTudo.contexto, {
    acao: ACAO_DE_EXPORTAR,
    ordenarPor: 'requester',
    // `strtoupper` antes da conferencia (`:388`).
    ordem: 'asc',
    filtroDeEstado: ESTADO_DE_FALHA,
  }).variaveis;

  assert.equal(variaveisComTudo.orderby, 'post_title');
  assert.equal(variaveisComTudo.order, 'ASC');
  assert.equal(variaveisComTudo.post_status, ESTADO_DE_FALHA);
});

/* ── CA-1.5 — NADA E EXPORTADO NEM APAGADO NA ABERTURA ─────────────────── */

test('CA-1.5 a abertura nao chama provedor, nao envia e-mail e nao escreve', () => {
  const { contexto, registros, dados } = cenario({
    capacidades: [CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO],
  });

  // O registro de provedores existe e **nao e alcancavel** pela abertura: ela
  // nao o recebe no contexto. Os dobles gravam cada chamada para que a ausencia
  // seja afirmacao, e nao suposicao.
  const provedores = criarRegistroDeProvedores();
  provedores.registrarExportador('wordpress-user', {
    nomeAmigavel: 'WordPress User',
    exportar(enderecoDeEmail) {
      registros.exportacoes.push(enderecoDeEmail);
      return { falhou: false, dados: [], terminou: true };
    },
  });
  provedores.registrarApagador('wordpress-comments', {
    nomeAmigavel: 'WordPress Comments',
    apagar(enderecoDeEmail) {
      registros.apagamentos.push(enderecoDeEmail);
      return {
        falhou: false,
        itensRemovidos: false,
        itensRetidos: false,
        mensagens: [],
        terminou: true,
      };
    },
  });

  const resultado = abrirSolicitacaoPelaTela(contexto, {
    superficie: 'tela-de-exportacao',
    action: 'add_export_personal_data_request',
    type_of_action: ACAO_DE_EXPORTAR,
    username_or_email_for_privacy_request: ENDERECO,
    send_confirmation_email: '1',
  });

  assert.equal(resultado.desfecho, 'tratado');
  assert.equal(resultado.solicitacaoId, 42);

  // `D2` comeca aqui: nada acontece sem confirmacao do titular.
  assert.deepEqual(registros.exportacoes, []);
  assert.deepEqual(registros.apagamentos, []);
  assert.deepEqual(registros.emails, []);
  // E nenhum comando sai pela porta DESTE modulo: o caminho da privacidade do
  // legado nao emite comando proprio sobre `posts` (ver
  // `./contexto-de-abertura.ts`).
  assert.deepEqual(dados.escritas, []);
  assert.deepEqual(dados.selecoes, []);
});

test('CA-1.5 o envio da confirmacao fica MARCADO, e nao acontece (T005)', () => {
  const pendente = cenario({
    capacidades: [CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO],
  });

  const comCaixaMarcada = abrirSolicitacaoPelaTela(pendente.contexto, {
    superficie: 'tela-de-exportacao',
    action: 'add_export_personal_data_request',
    type_of_action: ACAO_DE_EXPORTAR,
    username_or_email_for_privacy_request: ENDERECO,
    send_confirmation_email: '1',
  });

  // `if ( 'pending' === $status ) { wp_send_user_request( $request_id ); ... }`
  // (`wp-admin/includes/privacy-tools.php:168`-`:171`): o ponto existe, o envio
  // e de T005, e nenhuma mensagem saiu daqui.
  assert.equal(comCaixaMarcada.envioDeConfirmacaoDevido, true);
  assert.deepEqual(pendente.registros.emails, []);
  assert.deepEqual(comCaixaMarcada.avisos, [
    {
      ajuste: AJUSTE_DO_ENDERECO,
      codigo: AJUSTE_DO_ENDERECO,
      mensagem: MENSAGENS_DA_TELA_DE_ABERTURA.confirmacaoIniciada,
      tipo: 'success',
    },
  ]);
});

/* ── A TELA: OS AVISOS, E O RAMO QUE NASCE CONFIRMADA ──────────────────── */

test('🔴 a caixa de confirmacao desmarcada abre a solicitacao JA confirmada', () => {
  const { contexto, registros } = cenario({
    capacidades: [CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO],
  });

  const resultado = abrirSolicitacaoPelaTela(contexto, {
    superficie: 'tela-de-exportacao',
    action: 'add_export_personal_data_request',
    type_of_action: ACAO_DE_EXPORTAR,
    username_or_email_for_privacy_request: ENDERECO,
    // `send_confirmation_email` ausente: `isset()` falso (`:116`).
  });

  /*
    ⚠️ Afirmacao do LEGADO, e nao de `D2`. A solicitacao nasce em
    `request-confirmed`, sem chave, sem e-mail e sem o titular ter autorizado
    nada — e dali ela e executavel. A caixa vem marcada de fabrica
    (`wp-admin/export-personal-data.php:130`), logo o caminho normal e pendente;
    esta e a excecao, e ela esta registrada e NAO resolvida no `../README.md`.
  */
  assert.equal(registros.insercoes[0]?.post_status, ESTADO_CONFIRMADO);
  assert.equal(resultado.envioDeConfirmacaoDevido, false);
  assert.deepEqual(resultado.avisos, [
    {
      ajuste: AJUSTE_DO_ENDERECO,
      codigo: AJUSTE_DO_ENDERECO,
      mensagem: MENSAGENS_DA_TELA_DE_ABERTURA.solicitacaoAdicionada,
      tipo: 'success',
    },
  ]);
});

test('a tela acumula TRES avisos quando os campos do formulario nao vem', () => {
  const { contexto, registros } = cenario({
    capacidades: [CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO],
  });

  const resultado = abrirSolicitacaoPelaTela(contexto, {
    superficie: 'tela-de-exportacao',
    action: 'add_export_personal_data_request',
  });

  // Os tres portoes que NAO interrompem (`:103`, `:120` e `:129`), na ordem em
  // que o legado os acumula; quem interrompe e o `empty( $email_address )` de
  // `:145`. Um porte que desistisse no primeiro mostraria um aviso onde o legado
  // mostra tres.
  assert.deepEqual(resultado.avisos, [
    {
      ajuste: AJUSTE_DO_TIPO_DE_ACAO,
      codigo: AJUSTE_DO_TIPO_DE_ACAO,
      mensagem: MENSAGENS_DA_TELA_DE_ABERTURA.acaoInvalida,
      tipo: 'error',
    },
    {
      ajuste: AJUSTE_DO_TIPO_DE_ACAO,
      codigo: AJUSTE_DO_TIPO_DE_ACAO,
      mensagem: MENSAGENS_DA_TELA_DE_ABERTURA.acaoInvalida,
      tipo: 'error',
    },
    {
      ajuste: AJUSTE_DO_ENDERECO,
      codigo: AJUSTE_DO_ENDERECO,
      mensagem: MENSAGENS_DA_TELA_DE_ABERTURA.enderecoNaoResolvido,
      tipo: 'error',
    },
  ]);
  assert.equal(resultado.solicitacaoId, null);
  assert.deepEqual(registros.insercoes, []);
});

test('a tela resolve o login em endereco quando o que veio nao e e-mail', () => {
  const { contexto, registros } = cenario({
    capacidades: [CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO],
    contaPorLogin: { id: 7, enderecoDeEmail: ENDERECO },
  });

  const resultado = abrirSolicitacaoPelaTela(contexto, {
    superficie: 'tela-de-exportacao',
    action: 'add_export_personal_data_request',
    type_of_action: ACAO_DE_EXPORTAR,
    username_or_email_for_privacy_request: 'titular',
    send_confirmation_email: '1',
  });

  // `get_user_by( 'login', ... )` e `$email_address = $user->user_email`
  // (`:130` e `:139`).
  assert.equal(resultado.desfecho, 'tratado');
  assert.deepEqual(registros.loginsConsultados, ['titular']);
  assert.equal(registros.insercoes[0]?.post_title, ENDERECO);
});

test('a tela ignora o envio cuja acao nao e nenhuma das duas, sem aviso nenhum', () => {
  const { contexto, registros } = cenario({
    capacidades: [CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO],
  });

  const resultado = abrirSolicitacaoPelaTela(contexto, {
    superficie: 'tela-de-exportacao',
    action: 'alguma_outra_acao',
    type_of_action: ACAO_DE_EXPORTAR,
    username_or_email_for_privacy_request: ENDERECO,
  });

  // O `switch` do legado nao tem `default` (`:98`-`:185`): nada acontece, e
  // nenhum aviso e acumulado.
  assert.deepEqual(resultado, {
    desfecho: 'ignorado',
    recusa: null,
    avisos: [],
    solicitacaoId: null,
    envioDeConfirmacaoDevido: false,
  });
  assert.deepEqual(registros.insercoes, []);
});

test('a tela devolve o texto do erro da criacao, e interrompe nele', () => {
  const { contexto } = cenario({
    capacidades: [CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO],
    consultas: [{ ids: [11], totalEncontrado: 1 }],
  });

  const resultado = abrirSolicitacaoPelaTela(contexto, {
    superficie: 'tela-de-exportacao',
    action: 'add_export_personal_data_request',
    type_of_action: ACAO_DE_EXPORTAR,
    username_or_email_for_privacy_request: ENDERECO,
    send_confirmation_email: '1',
  });

  // `$message = $request_id->get_error_message()` e o `break` de `:165`: o
  // aviso e um so, e ele e de erro.
  assert.deepEqual(resultado.avisos, [
    {
      ajuste: AJUSTE_DO_ENDERECO,
      codigo: AJUSTE_DO_ENDERECO,
      mensagem: ERROS_DA_ABERTURA.solicitacaoDuplicada.mensagem,
      tipo: 'error',
    },
  ]);
  assert.equal(resultado.envioDeConfirmacaoDevido, false);
  assert.equal(resultado.solicitacaoId, null);
});

test('a tela tem texto proprio para a criacao sem identificador, e ele existe', () => {
  const { contexto } = cenario({
    capacidades: [CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO],
    idInserido: 0,
  });

  const resultado = abrirSolicitacaoPelaTela(contexto, {
    superficie: 'tela-de-exportacao',
    action: 'add_export_personal_data_request',
    type_of_action: ACAO_DE_EXPORTAR,
    username_or_email_for_privacy_request: ENDERECO,
    send_confirmation_email: '1',
  });

  // `elseif ( ! $request_id )` (`:154`-`:156`). Com `$wp_error = true` este ramo
  // nao e alcancavel no legado, e **existir sem ser chamado e parte do que se
  // clona** (P7, P8).
  assert.deepEqual(resultado.avisos, [
    {
      ajuste: AJUSTE_DO_ENDERECO,
      codigo: AJUSTE_DO_ENDERECO,
      mensagem: MENSAGENS_DA_TELA_DE_ABERTURA.criacaoSemIdentificador,
      tipo: 'error',
    },
  ]);
});
