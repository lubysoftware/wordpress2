/**
 * Testes da entrega de **T019**: *"o comportamento de US-9 existe e os criterios
 * CA-9.1, CA-9.2, CA-9.3 e CA-9.4 passam contra o sistema novo"*.
 *
 * **Nao sao os cinco testes de `backlog/tests.md`** — UT-064-1 a UT-064-5 sao
 * **T020**, a tarefa `[P]` que roda em paralelo com esta.
 *
 * ## Por que tudo aqui passa pelo envio, e nao pela pergunta de capacidade
 *
 * O mecanismo que nega `unfiltered_upload` por omissao e de
 * `plataforma/autorizacao/` e **ja tem teste la**
 * (`us-7-autorizacao-por-capacidade.test.ts`, *"PERM-8: `unfiltered_upload` e a
 * inversa"*). Repeti-lo aqui afirmaria a feature 001 de novo. O que esta tarefa
 * tem de provar e que **o envio** se comporta como UC-12 descreve: que o filtro
 * de tipo so e contornavel pelo caminho declarado, e que o contorno deixa
 * registro. Por isso todo teste chama `enviarArquivo()` e olha tres coisas —
 * **a recusa**, **o que foi gravado** e **o que foi registrado**.
 *
 * O arquivo do cenario e `instalador.bin`: `bin` nao esta nas 93 entradas de
 * `wp_get_mime_types()`, logo `wp_check_filetype()` nao reconhece o tipo
 * (`$ext` e `$type` caem juntos) e o `if` de
 * `wp-admin/includes/file.php:971` e alcancado — que e a unica porta de entrada
 * do contorno neste caminho.
 *
 * Cada afirmacao foi conferida contra o codigo do sistema analisado, legivel em
 * disco na arvore do 7.1.2 (a mesma versao do pacote), e por isso cita arquivo e
 * linha.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type ConstantesDoServidor,
  type EstadoDaRedeNaAutorizacao,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarCanalQueRegistra,
  type CanalQueRegistra,
} from '../../../plataforma/registro-de-operacao/index.js';
import {
  criarArmazenamentoDeMidia,
  criarPortaDeDadosFalsa,
  type PedidoDeAnexo,
  type PortaDeDadosFalsa,
} from '../armazenamento/index.js';
import type {
  LeituraDeArquivo,
  OperacaoDeArquivo,
  PortaDeSistemaDeArquivos,
} from '../portas/index.js';
import {
  enviarArquivo,
  MENSAGEM_DE_ENVIO_NAO_PERMITIDO,
  MENSAGEM_DE_TIPO_NAO_PERMITIDO,
  ORIGEM_DO_ENVIO_SEM_FILTRO,
  SEVERIDADE_DO_ENVIO_SEM_FILTRO,
  type ContextoDeEnvio,
  type DeteccaoDeTipoReal,
  type ResultadoDoEnvio,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const RAIZ_DA_INSTALACAO = '/var/www/';
const RAIZ_DE_ENVIOS = '/var/www/wp-content/uploads';
const ENDERECO_BASE = 'https://exemplo.test/wp-content/uploads';
/** `current_time( 'mysql' )` congelado: a pasta e `/2026/10`. */
const AGORA_NO_BANCO = '2026-10-11 14:30:00';
const PASTA_DO_MES = `${RAIZ_DE_ENVIOS}/2026/10`;
const CAMINHO_TEMPORARIO = '/tmp/phpA1b2c3';

/**
 * O instante do **evento**, que nao e o do envio.
 *
 * Os dois valores sao diferentes de proposito: `registro-de-envio-sem-filtro.ts`
 * registra que o relogio do envio e `current_time( 'mysql' )` — hora local em
 * texto, e **retrodatavel pelo destino** — e que o evento quer milissegundos
 * desde a epoca, do relogio de agora. Se um dia alguem ligar os dois, este
 * cenario quebra.
 */
const AGORA_EM_MILISSEGUNDOS = 1_792_000_000_000;

const CONTA_DA_ADMINISTRADORA = 3;
const CONTA_DA_AUTORA = 7;
const ID_DO_ANEXO = 101;

/** O arquivo cujo tipo a lista de fabrica **nao** reconhece. */
const ARQUIVO_SEM_TIPO = 'instalador.bin';
/** `$_FILES[...]['type']` — o que o navegador afirmou, e nada mais. */
const TIPO_AFIRMADO_PELO_CLIENTE = 'application/octet-stream';

/**
 * A matriz do cenario.
 *
 * `administrator` tem `unfiltered_upload` porque e o legado que a concede:
 * `populate_roles_230()` faz `$role->add_cap( 'unfiltered_upload' )` no
 * administrador e **em ninguem mais** (`wp-admin/includes/schema.php:890`-`:894`,
 * conferido no censo deste porte). `author` nao tem — e e esse par que torna
 * CA-9.3 afirmavel.
 */
const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'administrator',
    capacidades: [
      { capacidade: 'upload_files', concedida: true },
      { capacidade: 'unfiltered_upload', concedida: true },
    ],
  },
  {
    identificador: 'author',
    capacidades: [{ capacidade: 'upload_files', concedida: true }],
  },
  {
    identificador: 'contributor',
    capacidades: [{ capacidade: 'upload_files', concedida: false }],
  },
];

function ator(papel: string, contaId: number, login = `conta-${contaId}`): AtorDeAutorizacao {
  return {
    contaId,
    login,
    existe: true,
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

/* ── OS DUPLOS DAS BORDAS ───────────────────────────────────────────────────── */

interface ArquivosFalsos {
  readonly porta: PortaDeSistemaDeArquivos;
  /** Cada operacao, na ordem — o duplo que `@composicao` de `PT-014` pede. */
  readonly operacoes: string[];
}

function arquivosFalsos(falhaAoMover = false): ArquivosFalsos {
  const operacoes: string[] = [];

  return {
    operacoes,
    porta: {
      raizDeEnvios: RAIZ_DE_ENVIOS,
      existe(caminho) {
        operacoes.push(`existe ${caminho}`);
        return caminho === CAMINHO_TEMPORARIO;
      },
      ehPasta(caminho) {
        operacoes.push(`ehPasta ${caminho}`);
        return caminho === PASTA_DO_MES;
      },
      gravavel(caminho) {
        operacoes.push(`gravavel ${caminho}`);
        return true;
      },
      criarPasta(caminho): OperacaoDeArquivo {
        operacoes.push(`criarPasta ${caminho}`);
        return { concluido: true };
      },
      escrever(caminho): OperacaoDeArquivo {
        operacoes.push(`escrever ${caminho}`);
        return { concluido: true };
      },
      ler(caminho): LeituraDeArquivo<Uint8Array> {
        operacoes.push(`ler ${caminho}`);
        return { concluido: true, valor: new Uint8Array() };
      },
      mover(origem, destino): OperacaoDeArquivo {
        operacoes.push(`mover ${origem} ${destino}`);
        return falhaAoMover
          ? { concluido: false, mensagem: 'Permission denied' }
          : { concluido: true };
      },
      copiar(origem, destino): OperacaoDeArquivo {
        operacoes.push(`copiar ${origem} ${destino}`);
        return { concluido: true };
      },
      apagar(caminho): OperacaoDeArquivo {
        operacoes.push(`apagar ${caminho}`);
        return { concluido: true };
      },
      listar(pasta): LeituraDeArquivo<readonly string[]> {
        operacoes.push(`listar ${pasta}`);
        return { concluido: true, valor: [] };
      },
    },
  };
}

/**
 * A deteccao de tipo real, que neste cenario **nao e chamada**.
 *
 * Os tres blocos de confronto de `wp_check_filetype_and_ext()` sao guardados por
 * `$ext && $type` (`wp-includes/functions.php:3134`, `:3203`, `:3345`): sem tipo
 * esperado nao ha o que confrontar, e nenhuma borda e consultada. O duplo
 * registra as chamadas para que isso seja afirmacao e nao suposicao.
 */
function deteccaoQueRegistra(): {
  readonly deteccao: DeteccaoDeTipoReal;
  readonly chamadas: string[];
} {
  const chamadas: string[] = [];
  return {
    chamadas,
    deteccao: {
      tipoDeImagem(caminho) {
        chamadas.push(`tipoDeImagem ${caminho}`);
        return null;
      },
      fileinfoDisponivel() {
        chamadas.push('fileinfoDisponivel');
        return true;
      },
      tipoPorConteudo(caminho) {
        chamadas.push(`tipoPorConteudo ${caminho}`);
        return null;
      },
    },
  };
}

interface Cenario {
  readonly contexto: ContextoDeEnvio;
  readonly dados: PortaDeDadosFalsa;
  readonly arquivos: ArquivosFalsos;
  /** Todo `wp_insert_attachment()` pedido, na ordem. Lista vazia e afirmacao. */
  readonly insercoes: PedidoDeAnexo[];
  /** O canal do registro de operacao, quando o cenario tem um. */
  readonly canal: CanalQueRegistra | null;
  readonly deteccao: { readonly chamadas: string[] };
}

interface OpcoesDoCenario {
  readonly papel?: string;
  readonly contaId?: number;
  readonly login?: string;
  /** As quatro constantes do dono do servidor. Omitidas, valem as de fabrica. */
  readonly constantes?: ConstantesDoServidor;
  readonly rede?: EstadoDaRedeNaAutorizacao;
  /** Sem canal, o modulo nao registra nada — que e o legado (P7). */
  readonly semCanal?: boolean;
  readonly falhaAoMover?: boolean;
}

function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const dados = criarPortaDeDadosFalsa();
  const arquivos = arquivosFalsos(opcoes.falhaAoMover ?? false);
  const insercoes: PedidoDeAnexo[] = [];
  const canal = opcoes.semCanal === true ? null : criarCanalQueRegistra();
  const deteccao = deteccaoQueRegistra();

  const base: BaseDeAutorizacao = {
    matriz: MATRIZ,
    rede: opcoes.rede ?? REDE_INATIVA_NA_AUTORIZACAO,
    ...(opcoes.constantes === undefined ? {} : { constantes: opcoes.constantes }),
  };

  const contexto: ContextoDeEnvio = {
    base,
    ator: ator(
      opcoes.papel ?? 'administrator',
      opcoes.contaId ?? CONTA_DA_ADMINISTRADORA,
      opcoes.login ?? `conta-${opcoes.contaId ?? CONTA_DA_ADMINISTRADORA}`,
    ),
    sistemaDeArquivos: arquivos.porta,
    armazenamento: criarArmazenamentoDeMidia(dados.porta),
    conteudo: {
      // O cenario e sem conteudo de destino (`$post_id = 0`): a segunda
      // pergunta de capacidade de CA-1.1 nao e feita, e o anexo nasce sem pai.
      obterDestino: () => null,
      inserirAnexo(pedido) {
        insercoes.push(pedido);
        return { inserido: true, anexoId: ID_DO_ANEXO };
      },
    },
    relogio: { agoraNoFormatoDoBanco: () => AGORA_NO_BANCO },
    texto: {
      removerAcentos: (valor) => valor,
      ehUtf8Valido: () => true,
      sanitizarTituloComTracos: (valor) =>
        valor.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sanitizarCampoDeTexto: (valor) => valor.trim(),
    },
    escaparHtml: (valor) => valor.split('&').join('&amp;'),
    deteccao: deteccao.deteccao,
    enderecoBaseDeEnvios: ENDERECO_BASE,
    raizDaInstalacao: RAIZ_DA_INSTALACAO,
    organizarPorAnoEMes: true,
    ...(canal === null
      ? {}
      : {
          registroDeEnvioSemFiltro: {
            canal: canal.porta,
            agoraEmMilissegundos: () => AGORA_EM_MILISSEGUNDOS,
          },
        }),
  };

  return { contexto, dados, arquivos, insercoes, canal, deteccao };
}

function enviar(cen: Cenario, nome = ARQUIVO_SEM_TIPO): ResultadoDoEnvio {
  return enviarArquivo(cen.contexto, {
    superficie: 'tela-de-midia',
    conteudoDeDestino: 0,
    arquivo: {
      nome,
      tipoInformado: TIPO_AFIRMADO_PELO_CLIENTE,
      caminhoTemporario: CAMINHO_TEMPORARIO,
      bytes: 2048,
      erro: 0,
      recebidoNaRequisicao: true,
    },
  });
}

/** A instalacao que declarou o contorno: `define( 'ALLOW_UNFILTERED_UPLOADS', true )`. */
const INSTALACAO_QUE_DECLAROU: ConstantesDoServidor = {
  ALLOW_UNFILTERED_UPLOADS: true,
};

/* ── CA-9.1 ─────────────────────────────────────────────────────────────────
   "A capacidade de enviar arquivo sem filtro de tipo e negada a toda conta por
   padrao, inclusive a de maior poder" */

test('CA-9.1 a administradora, que TEM a capacidade na matriz, e recusada numa instalacao de fabrica', () => {
  const cen = cenario();

  const resultado = enviar(cen);

  // `populate_roles_230()` concede `unfiltered_upload` ao administrador
  // (`schema.php:894`) e o `case` de `map_meta_cap()` a devolve como
  // `do_not_allow` sem a constante (`capabilities.php:587`-`:592`). As duas
  // coisas sao verdade ao mesmo tempo, e e isso que UC-12 chama de "a unica
  // capacidade cuja concessao depende de uma constante existir".
  assert.equal(resultado.enviado, false);
  assert.equal(
    resultado.enviado === false ? resultado.motivo : null,
    'erro-de-envio',
  );
  assert.equal(
    resultado.enviado === false ? resultado.mensagem : '',
    MENSAGEM_DE_TIPO_NAO_PERMITIDO,
  );
});

test('CA-9.1 recusado, nada entra na biblioteca: nenhum anexo, nenhuma escrita, nenhum arquivo movido', () => {
  const cen = cenario();

  enviar(cen);

  assert.deepEqual(cen.insercoes, []);
  assert.deepEqual(cen.dados.escritas, []);
  // A recusa e no passo 6, antes da area de envios (passo 7) e do `mover`
  // (passo 9): o unico toque em disco e o `existe()` da validacao de tipo.
  assert.deepEqual(cen.arquivos.operacoes, [`existe ${CAMINHO_TEMPORARIO}`]);
});

test('CA-9.1 nem o super administrador da rede escapa, e e o comentario do legado que diz isso', () => {
  // BR-MIGRAR-094: "quatro constantes retiram poder de quem ja o tem, inclusive
  // administrador e super admin". Em rede, o super administrador recebe tudo
  // menos o negado explicitamente (`PERM-9`) — e `do_not_allow` e exatamente a
  // negacao explicita que o detem (ADR-0009).
  const cen = cenario({
    login: 'dona-da-rede',
    rede: { ativa: true, loginsDeSuperAdmin: ['dona-da-rede'] },
  });

  const resultado = enviar(cen);

  assert.equal(resultado.enviado, false);
  assert.equal(
    resultado.enviado === false ? resultado.mensagem : '',
    MENSAGEM_DE_TIPO_NAO_PERMITIDO,
  );
});

test('CA-9.1 a recusa de tipo nao e a recusa de capacidade de envio: sao dois textos e dois motivos', () => {
  // Quem nao tem `upload_files` nem chega ao filtro de tipo: a recusa e a do
  // passo 1, sem codigo de erro (`wp_die()` na tela do legado). Distinguir as
  // duas e o que impede ler esta historia como "o colaborador tambem contorna".
  const cen = cenario({ papel: 'contributor' });

  const resultado = enviar(cen);

  assert.equal(resultado.enviado, false);
  assert.equal(
    resultado.enviado === false ? resultado.motivo : null,
    'sem-permissao',
  );
  assert.equal(
    resultado.enviado === false ? resultado.mensagem : '',
    MENSAGEM_DE_ENVIO_NAO_PERMITIDO,
  );
});

/* ── CA-9.2 ─────────────────────────────────────────────────────────────────
   "Ela so passa a existir quando a instalacao declara explicitamente que a
   permite" */

test('CA-9.2 com a constante declarada, o mesmo envio passa e o anexo e criado', () => {
  const cen = cenario({ constantes: INSTALACAO_QUE_DECLAROU });

  const resultado = enviar(cen);

  assert.equal(resultado.enviado, true);
  assert.equal(cen.insercoes.length, 1);
  assert.equal(
    resultado.enviado === true ? resultado.nomeDeArquivo : '',
    ARQUIVO_SEM_TIPO,
  );
});

test('CA-9.2 passando pelo contorno, o tipo gravado e o que o CLIENTE afirmou', () => {
  const cen = cenario({ constantes: INSTALACAO_QUE_DECLAROU });

  const resultado = enviar(cen);

  // `if ( ! $type ) { $type = $file['type']; }` (`file.php:974`-`:976`). E a
  // consequencia que o criterio pede para ficar registrada: o `post_mime_type`
  // de um envio por este caminho nao foi confrontado com o conteudo de nada.
  assert.equal(
    resultado.enviado === true ? resultado.tipoMime : '',
    TIPO_AFIRMADO_PELO_CLIENTE,
  );
  assert.equal(cen.insercoes[0]?.tipoMime, TIPO_AFIRMADO_PELO_CLIENTE);
});

test('CA-9.2 constante definida como FALSA nao declara nada: `defined( X ) && X`', () => {
  const cen = cenario({ constantes: { ALLOW_UNFILTERED_UPLOADS: false } });

  const resultado = enviar(cen);

  assert.equal(resultado.enviado, false);
  assert.equal(
    resultado.enviado === false ? resultado.mensagem : '',
    MENSAGEM_DE_TIPO_NAO_PERMITIDO,
  );
});

test('CA-9.2 a declaracao e so sobre o contorno: ela nao muda o envio de tipo reconhecido', () => {
  // A constante nao e um interruptor de envio: com ela ou sem ela, um `.jpg`
  // entra do mesmo jeito. Quem a lesse como "modo permissivo" ampliaria o
  // alcance dela para alem do `if` de `file.php:971`.
  const comDeclaracao = cenario({ constantes: INSTALACAO_QUE_DECLAROU });
  const semDeclaracao = cenario();

  const umComDeclaracao = enviar(comDeclaracao, 'foto.jpg');
  const umSemDeclaracao = enviar(semDeclaracao, 'foto.jpg');

  assert.equal(umComDeclaracao.enviado, true);
  assert.equal(umSemDeclaracao.enviado, true);
  assert.equal(
    umComDeclaracao.enviado === true ? umComDeclaracao.tipoMime : '',
    'image/jpeg',
  );
  assert.equal(
    umSemDeclaracao.enviado === true ? umSemDeclaracao.tipoMime : '',
    'image/jpeg',
  );
});

/* ── CA-9.3 ─────────────────────────────────────────────────────────────────
   "Mesmo liberada, ela so alcanca quem tem a capacidade declarada de enviar sem
   filtro" */

test('CA-9.3 com a constante declarada, quem NAO tem a capacidade continua recusado', () => {
  const cen = cenario({
    papel: 'author',
    contaId: CONTA_DA_AUTORA,
    constantes: INSTALACAO_QUE_DECLAROU,
  });

  const resultado = enviar(cen);

  // A autora tem `upload_files`, logo o envio comeca; o que ela nao tem e
  // `unfiltered_upload`, e e no passo 6 que isso aparece.
  assert.equal(resultado.enviado, false);
  assert.equal(
    resultado.enviado === false ? resultado.mensagem : '',
    MENSAGEM_DE_TIPO_NAO_PERMITIDO,
  );
  assert.deepEqual(cen.insercoes, []);
});

test('CA-9.3 o contorno nao amplia a lista de tipos: ele passa APESAR de a lista nao reconhecer', () => {
  const cen = cenario({ constantes: INSTALACAO_QUE_DECLAROU });

  enviar(cen);

  // Nenhuma borda de deteccao e consultada, porque nao ha tipo esperado para
  // confrontar: os tres blocos de `wp_check_filetype_and_ext()` sao guardados
  // por `$ext && $type`. O contorno nao "descobre" o tipo — ele desiste de
  // decidi-lo, e e por isso que o gravado e o afirmado pelo cliente.
  assert.deepEqual(cen.deteccao.chamadas, []);
});

test('CA-9.3 a capacidade so alcanca o contorno, e nao a lista de `unfiltered_html`', () => {
  // Sao duas perguntas diferentes no mesmo envio: `unfiltered_html` decide se
  // `htm|html` e `js` entram na lista permitida (`functions.php:3702`), e
  // `unfiltered_upload` decide se o envio passa APESAR da lista. A
  // administradora deste cenario tem a segunda e nao tem a primeira.
  const cen = cenario({ constantes: INSTALACAO_QUE_DECLAROU });

  const resultado = enviar(cen, 'pagina.html');

  // `htm|html` foi **retirado da lista** por `get_allowed_mime_types()`
  // (`functions.php:3702`), e e com a lista permitida que a extensao e mapeada —
  // logo o tipo nem chega a ser reconhecido. O envio passa pelo mesmo contorno,
  // com o tipo do cliente, e NAO com `text/html`: ter `unfiltered_upload` nao
  // devolveu `htm|html` a lista.
  assert.equal(resultado.enviado, true);
  assert.equal(
    resultado.enviado === true ? resultado.tipoMime : '',
    TIPO_AFIRMADO_PELO_CLIENTE,
  );
});

/* ── CA-9.4 ─────────────────────────────────────────────────────────────────
   "Cada envio feito por esse caminho fica registrado com conta, arquivo e
   instante" */

test('CA-9.4 o envio pelo contorno escreve um evento, com conta, arquivo e instante', () => {
  const cen = cenario({ constantes: INSTALACAO_QUE_DECLAROU });

  enviar(cen);

  const eventos = cen.canal?.eventos ?? [];
  assert.equal(eventos.length, 1);

  const evento = eventos[0];
  assert.equal(evento?.instante, AGORA_EM_MILISSEGUNDOS);
  assert.equal(evento?.origem, ORIGEM_DO_ENVIO_SEM_FILTRO);
  assert.equal(evento?.severidade, SEVERIDADE_DO_ENVIO_SEM_FILTRO);
  assert.equal(evento?.contexto['contaId'], CONTA_DA_ADMINISTRADORA);
  assert.equal(evento?.contexto['arquivo'], ARQUIVO_SEM_TIPO);
  assert.equal(evento?.contexto['anexoId'], ID_DO_ANEXO);
  assert.equal(
    evento?.contexto['endereco'],
    `${ENDERECO_BASE}/2026/10/${ARQUIVO_SEM_TIPO}`,
  );
  assert.equal(evento?.contexto['tipoGravado'], TIPO_AFIRMADO_PELO_CLIENTE);
});

test('CA-9.4 todo campo do evento e escalar, e o login do ator NAO esta nele', () => {
  const cen = cenario({
    constantes: INSTALACAO_QUE_DECLAROU,
    login: 'dona-do-site',
  });

  enviar(cen);

  const contexto = cen.canal?.eventos[0]?.contexto ?? {};
  for (const [chave, valor] of Object.entries(contexto)) {
    assert.ok(
      valor === null || ['string', 'number', 'boolean'].includes(typeof valor),
      `${chave} nao e escalar, e campo aninhado e por onde dado pessoal entra`,
    );
  }

  // CA-1.3 de REQ-159: "sem credencial nem dado pessoal alem do declarado". A
  // conta e identificada pelo numero, e o nome de quem entra com ela fica fora.
  assert.deepEqual(
    Object.values(contexto).filter((valor) => valor === 'dona-do-site'),
    [],
  );
});

test('CA-9.4 um envio de tipo reconhecido nao escreve evento nenhum', () => {
  const cen = cenario({ constantes: INSTALACAO_QUE_DECLAROU });

  const resultado = enviar(cen, 'foto.jpg');

  assert.equal(resultado.enviado, true);
  // O registro e do contorno, nao do envio: se ele saisse de todo envio, a
  // resposta de "quantos envios sem filtro houve" seria o total de envios.
  assert.deepEqual(cen.canal?.eventos, []);
});

test('CA-9.4 o contorno recusado nao escreve evento: nao houve envio por esse caminho', () => {
  const cen = cenario({ papel: 'author', contaId: CONTA_DA_AUTORA });

  const resultado = enviar(cen);

  assert.equal(resultado.enviado, false);
  assert.deepEqual(cen.canal?.eventos, []);
});

test('CA-9.4 o contorno que falhou depois nao escreve evento: nada entrou na biblioteca', () => {
  const cen = cenario({
    constantes: INSTALACAO_QUE_DECLAROU,
    falhaAoMover: true,
  });

  const resultado = enviar(cen);

  // O criterio e sobre envio **feito**. A alternativa — registrar no proprio
  // `if` de `file.php:971` — esta discutida em
  // `registro-de-envio-sem-filtro.ts`, com o que ela ganharia e o que perderia.
  assert.equal(resultado.enviado, false);
  assert.deepEqual(cen.insercoes, []);
  assert.deepEqual(cen.canal?.eventos, []);
});

test('CA-9.4 o registro e so escrita: sem canal, o envio e identico (P7)', () => {
  const comCanal = cenario({ constantes: INSTALACAO_QUE_DECLAROU });
  const semCanal = cenario({
    constantes: INSTALACAO_QUE_DECLAROU,
    semCanal: true,
  });

  const umComCanal = enviar(comCanal);
  const umSemCanal = enviar(semCanal);

  // "O registro acrescentado e so escrita: nenhuma ramificacao do codigo testa o
  // resultado de escrever log" (P7, forma de conferir). O que o legado faz e o
  // caminho sem canal, e ele tem de ser indistinguivel no resultado, no que foi
  // gravado e na sequencia de operacoes de disco — que e o que o cenario
  // `@composicao` de `PT-014` compara.
  assert.deepEqual(umSemCanal, umComCanal);
  assert.deepEqual(semCanal.insercoes, comCanal.insercoes);
  assert.deepEqual(semCanal.arquivos.operacoes, comCanal.arquivos.operacoes);
  assert.deepEqual(semCanal.dados.escritas, comCanal.dados.escritas);
});

test('CA-9.4 o instante do evento nao e o do envio, e nao e retrodatavel', () => {
  const cen = cenario({ constantes: INSTALACAO_QUE_DECLAROU });

  enviar(cen);

  // `current_time( 'mysql' )` serve a subpasta `/AAAA/MM` e e retrodatado pelo
  // conteudo de destino (`media.php:297`-`:303`). Um evento de auditoria
  // carimbado com aquele valor diria que o envio aconteceu na data do rascunho.
  const evento = cen.canal?.eventos[0];
  assert.equal(typeof evento?.instante, 'number');
  assert.equal(evento?.instante, AGORA_EM_MILISSEGUNDOS);

  // E o valor do relogio do envio nao aparece em campo nenhum do evento: se
  // alguem ligar as duas leituras de tempo, este teste e que avisa.
  assert.deepEqual(
    Object.values(evento?.contexto ?? {}).filter(
      (valor) => valor === AGORA_NO_BANCO,
    ),
    [],
  );
});

test('CA-9.4 dois contornos escrevem dois eventos, na ordem', () => {
  const cen = cenario({ constantes: INSTALACAO_QUE_DECLAROU });

  enviar(cen, 'primeiro.bin');
  enviar(cen, 'segundo.bin');

  assert.equal(cen.canal?.eventos.length, 2);
  assert.equal(cen.canal?.eventos[0]?.contexto['arquivo'], 'primeiro.bin');
  assert.equal(cen.canal?.eventos[1]?.contexto['arquivo'], 'segundo.bin');
});

test('CA-9.4 o evento guarda o nome final E o informado, porque podem diferir', () => {
  const cen = cenario({ constantes: INSTALACAO_QUE_DECLAROU });

  // `sanitize_file_name()` roda dentro de `wp_unique_filename()`, logo o nome em
  // disco nao e o informado: `meu instalador.bin` vira `meu-instalador.bin`.
  enviar(cen, 'meu instalador.bin');

  const contexto = cen.canal?.eventos[0]?.contexto ?? {};
  assert.equal(contexto['arquivo'], 'meu-instalador.bin');
  assert.equal(contexto['nomeInformado'], 'meu instalador.bin');
});

/* ── A REGRA DE NEGOCIO DA HISTORIA ────────────────────────────────────────
   "A permissao de envio sem filtro e o inverso das outras: sem a declaracao da
   instalacao, ela e sempre negada" */

test('a inversa: o contorno e o unico caminho do envio que fecha por OMISSAO de constante', () => {
  // As outras tres constantes de BR-MIGRAR-094 sao proibicoes — indefinidas,
  // nao revogam nada. Esta e a inversa, e o efeito dela e de fabrica. O par de
  // envios abaixo e a regra inteira: o mesmo ator, o mesmo arquivo, e a unica
  // diferenca e uma linha no arquivo de configuracao da instalacao.
  const deFabrica = cenario();
  const declarada = cenario({ constantes: INSTALACAO_QUE_DECLAROU });

  assert.equal(enviar(deFabrica).enviado, false);
  assert.equal(enviar(declarada).enviado, true);
});
