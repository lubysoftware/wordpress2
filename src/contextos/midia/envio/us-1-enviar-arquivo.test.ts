/**
 * Testes da entrega de **T003**: *"o comportamento de US-1 existe e os criterios
 * CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5 e CA-1.6 passam contra o sistema
 * novo"*.
 *
 * **Nao sao os seis testes de `backlog/tests.md`** — UT-056-1 a UT-056-6 sao
 * **T004**, a tarefa `[P]` que roda em paralelo com esta. Aqui se afirma o que
 * esta tarefa entrega, criterio por criterio, pelos meios que a Decisao 2 fixa
 * para esta area: **efeito no banco** (*"snapshot + sequencia de comandos"*) e
 * **sequencia de operacoes na porta de sistema de arquivos**, que e o que o
 * cenario `@composicao` de `parity_tests/14-ingestao-e-derivadas-de-midia.feature`
 * compara — *"a sequencia de operacoes registrada e identica a do oraculo"* e
 * *"nenhuma operacao a mais e executada"*.
 *
 * E por isso que as duas portas daqui **registram comando** em vez de simular
 * banco e disco: e a unica forma de afirmar o caso em que o legado **nao emite
 * comando nenhum** — que e metade de CA-1.5 (*"e nenhum registro de anexo e
 * criado"*).
 *
 * Cada afirmacao foi conferida contra o codigo do sistema analisado, legivel em
 * disco na arvore do 7.1.2 (a mesma versao do pacote), e por isso cita arquivo e
 * linha.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  casoDeConteudo,
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type EstadoDeConteudoNaAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type MatrizDePapeis,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarArmazenamentoDeMidia,
  criarPortaDeDadosFalsa,
  textoDoParametro,
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
  MENSAGEM_DE_ANEXO_NAO_PERMITIDO_NO_CONTEUDO,
  MENSAGEM_DE_ARQUIVO_NAO_MOVIDO,
  MENSAGEM_DE_ARQUIVO_NAO_RECEBIDO,
  MENSAGEM_DE_ARQUIVO_VAZIO,
  MENSAGEM_DE_ENVIO_NAO_PERMITIDO,
  MENSAGEM_DE_PASTA_NAO_CRIADA,
  MENSAGEM_DE_TIPO_NAO_PERMITIDO,
  MENSAGENS_DE_ERRO_DE_ENVIO,
  sanitizarNomeDeArquivo,
  TIPOS_DE_ARQUIVO_DE_FABRICA,
  tiposPermitidos,
  type ArquivoRecebido,
  type ContextoDeEnvio,
  type DeteccaoDeTipoReal,
  type MetadadoDeImagemLido,
  type ResultadoDoEnvio,
  type SuperficieDeEnvio,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const RAIZ_DA_INSTALACAO = '/var/www/';
const RAIZ_DE_ENVIOS = '/var/www/wp-content/uploads';
const ENDERECO_BASE = 'https://exemplo.test/wp-content/uploads';
/** `current_time( 'mysql' )` congelado: a pasta e `/2026/10`. */
const AGORA = '2026-10-11 14:30:00';
const PASTA_DO_MES = `${RAIZ_DE_ENVIOS}/2026/10`;
/**
 * `$_FILES[...]['tmp_name']`.
 *
 * ⚠️ Ele **existe** em disco em todo cenario, e isso nao e detalhe de duplo:
 * `wp_check_filetype_and_ext()` desiste do confronto quando o arquivo nao existe
 * — *"we can't do any further validation without a file to work with"*
 * (`wp-includes/functions.php:3131`) — e devolve o tipo da extensao sem olhar o
 * conteudo. Um duplo que respondesse "nao existe" tornaria CA-1.2 inalcancavel.
 */
const CAMINHO_TEMPORARIO = '/tmp/phpA1b2c3';

const CONTA_DO_AUTOR = 7;
const CONTA_ALHEIA = 9;
const ID_DO_DESTINO = 42;
const ID_DO_ANEXO = 101;

/** As tres superficies do legado, para os testes que varrem CA-1.6. */
const SUPERFICIES: readonly SuperficieDeEnvio[] = [
  'tela-de-midia',
  'envio-assincrono',
  'envio-assincrono-do-editor',
];

/**
 * A matriz de papeis do cenario.
 *
 * `author` tem `upload_files` e `edit_posts` e **nao** tem `edit_others_posts`,
 * que e a assimetria que faz CA-1.1 recusar o destino alheio. `contributor` nao
 * tem `upload_files`, que e o que UC-12 registra: *"`upload_files`, que o
 * colaborador nao tem"*.
 */
const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'author',
    capacidades: [
      { capacidade: 'upload_files', concedida: true },
      { capacidade: 'edit_posts', concedida: true },
      { capacidade: 'edit_published_posts', concedida: true },
      { capacidade: 'edit_others_posts', concedida: false },
    ],
  },
  {
    identificador: 'contributor',
    capacidades: [
      { capacidade: 'edit_posts', concedida: true },
      { capacidade: 'upload_files', concedida: false },
    ],
  },
];

function ator(
  papel: string,
  contaId = CONTA_DO_AUTOR,
  extras: readonly string[] = [],
): AtorDeAutorizacao {
  return {
    contaId,
    login: `conta-${contaId}`,
    existe: true,
    concessoes: [
      { capacidade: papel, concedida: true },
      ...extras.map((capacidade) => ({ capacidade, concedida: true })),
    ],
  };
}

/** Os 15 slots que `get_post_type_capabilities()` deriva (`post.php:1884`). */
function tipoRegistrado(nome: string): TipoDeConteudoNaAutorizacao {
  return {
    nome,
    traduzMetaCapacidade: true,
    capacidades: {
      edit_posts: 'edit_posts',
      edit_others_posts: 'edit_others_posts',
      edit_published_posts: 'edit_published_posts',
      edit_private_posts: 'edit_private_posts',
      publish_posts: 'publish_posts',
      read: 'read',
      read_private_posts: 'read_private_posts',
      delete_posts: 'delete_posts',
      delete_others_posts: 'delete_others_posts',
      delete_published_posts: 'delete_published_posts',
      delete_private_posts: 'delete_private_posts',
      create_posts: 'edit_posts',
      read_post: 'read',
      edit_post: 'edit_posts',
      delete_post: 'delete_posts',
    },
  };
}

/**
 * O registro de estado, no recorte que `map_meta_cap()` le.
 *
 * Declarado **aqui** e nao importado de BC-01: a regra de dependencia 3 de
 * `target_architecture.md` proibe `contextos/<a>/` importar `contextos/<b>/`
 * *"sempre, sem excecao"*, e `PROPRIEDADES_DO_ESTADO_EDITORIAL` e de BC-01.
 */
const ESTADOS: Record<string, EstadoDeConteudoNaAutorizacao> = {
  draft: { nome: 'draft', publico: false, privado: false },
  publish: { nome: 'publish', publico: true, privado: false },
};

interface DestinoDeTeste {
  readonly autorId: number;
  readonly tipo: string;
  readonly estado: string;
  readonly data: string;
}

const DESTINO_PROPRIO: DestinoDeTeste = {
  autorId: CONTA_DO_AUTOR,
  tipo: 'post',
  estado: 'draft',
  data: '2026-03-04 08:00:00',
};

const DESTINO_ALHEIO: DestinoDeTeste = {
  ...DESTINO_PROPRIO,
  autorId: CONTA_ALHEIA,
};

/** As leituras que `map_meta_cap()` faz, registradas para CA-1.6. */
interface FonteRegistrada {
  readonly fonte: FonteDeConteudoNaAutorizacao;
  /** Toda referencia perguntada a `get_post()` pela traducao de `edit_post`. */
  readonly perguntas: unknown[];
}

function fonteDeConteudo(destino: DestinoDeTeste | null): FonteRegistrada {
  const perguntas: unknown[] = [];

  return {
    perguntas,
    fonte: {
      conteudo(referencia) {
        perguntas.push(referencia);
        if (destino === null || referencia !== ID_DO_DESTINO) {
          return null;
        }
        return {
          id: ID_DO_DESTINO,
          tipo: destino.tipo,
          estado: destino.estado,
          estadoParaLeitura: destino.estado,
          autorId: destino.autorId,
          paiId: 0,
        };
      },
      tipoDeConteudo: (nome) =>
        nome === 'post' ? tipoRegistrado(nome) : null,
      estadoDeConteudo: (nome) => ESTADOS[nome] ?? null,
      estadoAnteriorNaLixeira: () => '',
      paginaInicial: () => 0,
      paginaDeConteudos: () => 0,
      paginaDePoliticaDePrivacidade: () => 0,
    },
  };
}

/* ── OS DUPLOS DAS BORDAS ───────────────────────────────────────────────────── */

interface ArquivosFalsos {
  readonly porta: PortaDeSistemaDeArquivos;
  /** Cada operacao, na ordem — o duplo que `@composicao` pede. */
  readonly operacoes: string[];
}

interface OpcoesDeArquivos {
  /** Os caminhos que ja existem em disco. */
  readonly existentes?: readonly string[];
  /** O conteudo da pasta, como `@scandir()` o devolve menos `.` e `..`. */
  readonly listagem?: readonly string[];
  /** A pasta nao pode ser criada: a mensagem do sistema de arquivos. */
  readonly falhaAoCriarPasta?: string;
  /** O arquivo nao pode ser movido. */
  readonly falhaAoMover?: boolean;
  /** `@scandir()` falhou: lista vazia e limite de fabrica. */
  readonly falhaAoListar?: boolean;
}

function arquivosFalsos(opcoes: OpcoesDeArquivos = {}): ArquivosFalsos {
  const operacoes: string[] = [];
  const existentes = new Set([
    CAMINHO_TEMPORARIO,
    ...(opcoes.existentes ?? []),
  ]);

  return {
    operacoes,
    porta: {
      raizDeEnvios: RAIZ_DE_ENVIOS,
      existe(caminho) {
        operacoes.push(`existe ${caminho}`);
        return existentes.has(caminho);
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
        return opcoes.falhaAoCriarPasta === undefined
          ? { concluido: true }
          : { concluido: false, mensagem: opcoes.falhaAoCriarPasta };
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
        return opcoes.falhaAoMover === true
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
        return opcoes.falhaAoListar === true
          ? { concluido: false, mensagem: 'Permission denied' }
          : { concluido: true, valor: opcoes.listagem ?? [] };
      },
    },
  };
}

/**
 * O duplo da deteccao de tipo real.
 *
 * `tipoDeImagem` e `wp_get_image_mime()`; `tipoPorConteudo` e `finfo_file()`.
 * Os dois chegam programados porque e o **conteudo** do arquivo que eles
 * descrevem, e e disso que CA-1.2 fala.
 */
function deteccao(
  tipoDeImagem: string | null,
  tipoPorConteudo: string | null,
  fileinfoDisponivel = true,
): DeteccaoDeTipoReal {
  return {
    tipoDeImagem: () => tipoDeImagem,
    fileinfoDisponivel: () => fileinfoDisponivel,
    tipoPorConteudo: () => tipoPorConteudo,
  };
}

interface ConteudoRegistrado {
  /** Todo `wp_insert_attachment()` pedido, na ordem. Lista vazia e afirmacao. */
  readonly insercoes: PedidoDeAnexo[];
  /** Todo `get_post()` que o fluxo (nao a autorizacao) fez. */
  readonly leiturasDeDestino: number[];
}

interface Cenario {
  readonly contexto: ContextoDeEnvio;
  readonly dados: PortaDeDadosFalsa;
  readonly arquivos: ArquivosFalsos;
  readonly conteudo: ConteudoRegistrado;
  readonly autorizacao: FonteRegistrada;
}

interface OpcoesDoCenario {
  readonly papel?: string;
  readonly capacidadesExtras?: readonly string[];
  readonly destino?: DestinoDeTeste | null;
  readonly arquivos?: OpcoesDeArquivos;
  readonly deteccao?: DeteccaoDeTipoReal;
  readonly metadadoDeImagem?: MetadadoDeImagemLido;
  readonly organizarPorAnoEMes?: boolean;
  readonly falhaAoInserir?: { readonly codigo: string; readonly mensagem: string };
}

function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const destino = opcoes.destino === undefined ? DESTINO_PROPRIO : opcoes.destino;
  const autorizacao = fonteDeConteudo(destino);
  const dados = criarPortaDeDadosFalsa();
  const arquivos = arquivosFalsos(opcoes.arquivos);

  const insercoes: PedidoDeAnexo[] = [];
  const leiturasDeDestino: number[] = [];

  const base: BaseDeAutorizacao = {
    matriz: MATRIZ,
    rede: REDE_INATIVA_NA_AUTORIZACAO,
    casosDeTraducao: [casoDeConteudo(autorizacao.fonte)],
  };

  const contexto: ContextoDeEnvio = {
    base,
    ator: ator(
      opcoes.papel ?? 'author',
      CONTA_DO_AUTOR,
      opcoes.capacidadesExtras ?? [],
    ),
    sistemaDeArquivos: arquivos.porta,
    armazenamento: criarArmazenamentoDeMidia(dados.porta),
    conteudo: {
      obterDestino(conteudoId) {
        leiturasDeDestino.push(conteudoId);
        if (destino === null || conteudoId !== ID_DO_DESTINO) {
          return null;
        }
        return { tipo: destino.tipo, data: destino.data };
      },
      inserirAnexo(pedido) {
        insercoes.push(pedido);
        if (opcoes.falhaAoInserir !== undefined) {
          return { inserido: false, ...opcoes.falhaAoInserir };
        }
        return { inserido: true, anexoId: ID_DO_ANEXO };
      },
    },
    relogio: { agoraNoFormatoDoBanco: () => AGORA },
    texto: {
      // Identidade: o dado deste cenario e ASCII, e o que `remove_accents()`
      // faz fora do ASCII e da plataforma (feature 015), nao desta tarefa.
      removerAcentos: (valor) => valor,
      ehUtf8Valido: () => true,
      sanitizarTituloComTracos: (valor) =>
        valor.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sanitizarCampoDeTexto: (valor) => valor.trim(),
    },
    escaparHtml: (valor) => valor.split('&').join('&amp;'),
    deteccao: opcoes.deteccao ?? deteccao('image/jpeg', 'image/jpeg'),
    ...(opcoes.metadadoDeImagem === undefined
      ? {}
      : {
          metadadoDoArquivo: {
            lerMetadadoDeImagem: () => opcoes.metadadoDeImagem ?? null,
          },
        }),
    enderecoBaseDeEnvios: ENDERECO_BASE,
    raizDaInstalacao: RAIZ_DA_INSTALACAO,
    organizarPorAnoEMes: opcoes.organizarPorAnoEMes ?? true,
  };

  return {
    contexto,
    dados,
    arquivos,
    conteudo: { insercoes, leiturasDeDestino },
    autorizacao,
  };
}

/** Um elemento de `$_FILES` sem nenhum erro. */
function arquivoRecebido(
  nome: string,
  tipoInformado = 'image/jpeg',
): ArquivoRecebido {
  return {
    nome,
    tipoInformado,
    caminhoTemporario: CAMINHO_TEMPORARIO,
    bytes: 2048,
    erro: 0,
    recebidoNaRequisicao: true,
  };
}

function enviar(
  cen: Cenario,
  nome: string,
  superficie: SuperficieDeEnvio = 'tela-de-midia',
  conteudoDeDestino = ID_DO_DESTINO,
  tipoInformado = 'image/jpeg',
): ResultadoDoEnvio {
  return enviarArquivo(cen.contexto, {
    superficie,
    conteudoDeDestino,
    arquivo: arquivoRecebido(nome, tipoInformado),
  });
}

/* ── CA-1.1 ─────────────────────────────────────────────────────────────────
   "O envio exige a capacidade de enviar arquivo e, quando ha conteudo de
   destino, a de editar aquele conteudo" */

test('CA-1.1 quem nao tem a capacidade de enviar arquivo e recusado com o texto do legado', () => {
  const cen = cenario({ papel: 'contributor' });

  const resultado = enviar(cen, 'foto.jpg');

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

test('CA-1.1 a recusa na primeira pergunta nao toca disco, nao le destino e nao grava nada', () => {
  const cen = cenario({ papel: 'contributor' });

  enviar(cen, 'foto.jpg');

  // A ordem do legado e observavel pelo que NAO aconteceu: `upload_files` e
  // perguntada antes de `get_post()` (`wp-admin/media-new.php:15` antes de
  // `:24`), logo nenhuma leitura de destino e nenhuma operacao de disco saem.
  assert.deepEqual(cen.arquivos.operacoes, []);
  assert.deepEqual(cen.conteudo.leiturasDeDestino, []);
  assert.deepEqual(cen.conteudo.insercoes, []);
  assert.deepEqual(cen.dados.escritas, []);
});

test('CA-1.1 com as duas capacidades o anexo e criado apontando para o destino', () => {
  const cen = cenario();

  const resultado = enviar(cen, 'foto.jpg');

  assert.equal(resultado.enviado, true);
  assert.equal(cen.conteudo.insercoes.length, 1);
  assert.equal(cen.conteudo.insercoes[0]?.conteudoDeDestino, ID_DO_DESTINO);
  assert.equal(
    resultado.enviado === true ? resultado.destinoDescartado : true,
    false,
  );
});

test('CA-1.1 sem destino no pedido, a segunda pergunta nao e feita', () => {
  const cen = cenario();

  const resultado = enviar(cen, 'foto.jpg', 'tela-de-midia', 0);

  assert.equal(resultado.enviado, true);
  // `map_meta_cap()` nao foi consultado: o `! isset( $_REQUEST['post_id'] )` do
  // legado nao chega a `current_user_can( 'edit_post', ... )`.
  assert.deepEqual(cen.autorizacao.perguntas, []);
  assert.equal(cen.conteudo.insercoes[0]?.conteudoDeDestino, 0);
});

test('CA-1.1 no envio do editor, nao poder editar o destino recusa o envio', () => {
  const cen = cenario({ destino: DESTINO_ALHEIO });

  const resultado = enviar(
    cen,
    'foto.jpg',
    'envio-assincrono-do-editor',
  );

  assert.equal(resultado.enviado, false);
  assert.equal(
    resultado.enviado === false ? resultado.mensagem : '',
    MENSAGEM_DE_ANEXO_NAO_PERMITIDO_NO_CONTEUDO,
  );
  assert.deepEqual(cen.conteudo.insercoes, []);
  assert.deepEqual(cen.arquivos.operacoes, []);
});

test('🔴 CA-1.1 na tela, nao poder editar o destino DESCARTA o destino e o envio segue', () => {
  /*
    E o legado, e nao e defeito: `wp-admin/media-new.php:24`-`:26` e
    `wp-admin/async-upload.php:108`-`:110` fazem `$post_id = 0` em vez de
    recusar. CA-1.1 lido como "toda superficie recusa" divergiria do legado em
    duas das tres superficies, e P1 exige decisao humana registrada para
    divergir — nao existe nenhuma. A analise esta em `permissao-de-envio.ts`, e
    esta tarefa NAO resolve o conflito.
  */
  const cen = cenario({ destino: DESTINO_ALHEIO });

  const resultado = enviar(cen, 'foto.jpg', 'tela-de-midia');

  assert.equal(resultado.enviado, true);
  assert.equal(
    resultado.enviado === true ? resultado.destinoDescartado : false,
    true,
  );
  assert.equal(cen.conteudo.insercoes[0]?.conteudoDeDestino, 0);
});

/* ── CA-1.2 ─────────────────────────────────────────────────────────────────
   "O tipo e decidido pelo conteudo do arquivo, nao pela extensao informada, e
   confrontado com a lista de tipos permitidos" */

test('CA-1.2 extensao de documento com conteudo de imagem e recusada', () => {
  // `relatorio.pdf` cujo `finfo_file()` devolve `image/png`: o `else` final de
  // `wp_check_filetype_and_ext()` (`wp-includes/functions.php:3288`) — "if the
  // real content type doesn't match the file extension, assume it's dangerous".
  const cen = cenario({ deteccao: deteccao(null, 'image/png') });

  const resultado = enviar(cen, 'relatorio.pdf', 'tela-de-midia', 0);

  assert.equal(resultado.enviado, false);
  assert.equal(
    resultado.enviado === false ? resultado.mensagem : '',
    MENSAGEM_DE_TIPO_NAO_PERMITIDO,
  );
});

test('CA-1.2 imagem com extensao errada tem o NOME corrigido, nao o envio recusado', () => {
  // `foto.png` que e mesmo `image/jpeg`: o legado renomeia para `foto.jpg` e
  // refaz o mapeamento (`wp-includes/functions.php:3182`-`:3193`). O tipo
  // gravado e o do conteudo, e o nome em disco tambem.
  const cen = cenario({ deteccao: deteccao('image/jpeg', null) });

  const resultado = enviar(cen, 'foto.png', 'tela-de-midia', 0);

  assert.equal(resultado.enviado, true);
  assert.equal(resultado.enviado === true ? resultado.tipoMime : '', 'image/jpeg');
  assert.equal(
    resultado.enviado === true ? resultado.nomeDeArquivo : '',
    'foto.jpg',
  );
  assert.equal(cen.conteudo.insercoes[0]?.tipoMime, 'image/jpeg');
  // O titulo sai do nome CORRIGIDO, porque `media_handle_upload()` le
  // `$_FILES[...]['name']` depois da reescrita (`media.php:313`).
  assert.equal(cen.conteudo.insercoes[0]?.titulo, 'foto');
});

test('CA-1.2 tipo reconhecido mas fora da lista permitida e recusado', () => {
  // `exe` esta em `wp_get_mime_types()` e `get_allowed_mime_types()` o
  // **retira sempre** (`wp-includes/functions.php:3695`).
  const cen = cenario({
    deteccao: deteccao(null, 'application/x-msdownload'),
  });

  const resultado = enviar(
    cen,
    'instalador.exe',
    'tela-de-midia',
    0,
    'application/x-msdownload',
  );

  assert.equal(resultado.enviado, false);
  assert.equal(
    resultado.enviado === false ? resultado.mensagem : '',
    MENSAGEM_DE_TIPO_NAO_PERMITIDO,
  );
  assert.ok(
    TIPOS_DE_ARQUIVO_DE_FABRICA.some(
      (entrada) => entrada.padraoDeExtensao === 'exe',
    ),
    'a lista de fabrica conserva `exe`: quem o retira e a lista permitida',
  );
});

test('CA-1.2 a lista permitida depende de quem pergunta: html so com unfiltered_html', () => {
  const semHtmlBruto = cenario({ deteccao: deteccao(null, 'text/html') });
  const recusado = enviar(semHtmlBruto, 'pagina.html', 'tela-de-midia', 0);

  assert.equal(recusado.enviado, false);

  const comHtmlBruto = cenario({
    capacidadesExtras: ['unfiltered_html'],
    deteccao: deteccao(null, 'text/html'),
  });
  const aceito = enviar(comHtmlBruto, 'pagina.html', 'tela-de-midia', 0);

  assert.equal(aceito.enviado, true);
  assert.equal(aceito.enviado === true ? aceito.tipoMime : '', 'text/html');

  // E o contrario e o mesmo dado: a lista permitida de quem nao tem a
  // capacidade nao contem `htm|html` nem `js` (`functions.php:3702`).
  const padroes = tiposPermitidos(false).map(
    (entrada) => entrada.padraoDeExtensao,
  );
  assert.ok(!padroes.includes('htm|html'));
  assert.ok(!padroes.includes('js'));
  assert.ok(tiposPermitidos(true).some((e) => e.padraoDeExtensao === 'htm|html'));
});

test('CA-1.2 sem fileinfo o confronto nao acontece e a extensao decide', () => {
  // `extension_loaded( 'fileinfo' )` falso: o bloco inteiro de vetos nao roda
  // (`wp-includes/functions.php:3205`). Um porte que tratasse "sem deteccao"
  // como "tipo real ausente" recusaria o que o legado aceita.
  const cen = cenario({ deteccao: deteccao(null, null, false) });

  const resultado = enviar(cen, 'relatorio.pdf', 'tela-de-midia', 0);

  assert.equal(resultado.enviado, true);
  assert.equal(
    resultado.enviado === true ? resultado.tipoMime : '',
    'application/pdf',
  );
});

/* ── CA-1.3 ─────────────────────────────────────────────────────────────────
   "Tipo fora da lista e recusado com motivo informado ao ator" */

test('CA-1.3 a recusa de tipo informa o motivo e nao cria registro nem move arquivo', () => {
  const cen = cenario({ deteccao: deteccao(null, 'image/png') });

  const resultado = enviar(cen, 'relatorio.pdf', 'tela-de-midia', 0);

  assert.equal(resultado.enviado, false);
  assert.equal(
    resultado.enviado === false ? resultado.motivo : null,
    'erro-de-envio',
  );
  assert.equal(
    resultado.enviado === false ? resultado.mensagem : '',
    MENSAGEM_DE_TIPO_NAO_PERMITIDO,
  );
  assert.deepEqual(cen.conteudo.insercoes, []);
  assert.deepEqual(cen.dados.escritas, []);
  // A validacao de tipo e o passo 6; a pasta (7) e o move (9) vem depois, logo
  // a unica operacao de disco e o `file_exists()` da propria validacao.
  assert.deepEqual(cen.arquivos.operacoes, ['existe /tmp/phpA1b2c3']);
});

test('CA-1.3 as tres causas de recusa de tipo dao o MESMO motivo, como no legado', () => {
  // `wp-admin/includes/file.php:972` tem um texto so para extensao nao
  // reconhecida, tipo real divergente e tipo fora da lista permitida.
  const semExtensao = cenario({ deteccao: deteccao(null, null) });
  const divergente = cenario({ deteccao: deteccao(null, 'image/png') });
  const foraDaLista = cenario({
    deteccao: deteccao(null, 'application/x-msdownload'),
  });

  const mensagens = [
    enviar(semExtensao, 'arquivo-sem-extensao', 'tela-de-midia', 0),
    enviar(divergente, 'relatorio.pdf', 'tela-de-midia', 0),
    enviar(foraDaLista, 'instalador.exe', 'tela-de-midia', 0),
  ].map((resultado) =>
    resultado.enviado === false ? resultado.mensagem : 'enviou',
  );

  assert.deepEqual(mensagens, [
    MENSAGEM_DE_TIPO_NAO_PERMITIDO,
    MENSAGEM_DE_TIPO_NAO_PERMITIDO,
    MENSAGEM_DE_TIPO_NAO_PERMITIDO,
  ]);
});

/* ── CA-1.4 ─────────────────────────────────────────────────────────────────
   "Colisao de nome no destino e resolvida renomeando, sem sobrescrever arquivo
   existente" */

test('CA-1.4 nome em colisao recebe sufixo e o arquivo existente nao e tocado', () => {
  const cen = cenario({
    arquivos: {
      existentes: [`${PASTA_DO_MES}/foto.jpg`],
      listagem: ['foto.jpg'],
    },
  });

  const resultado = enviar(cen, 'foto.jpg', 'tela-de-midia', 0);

  assert.equal(
    resultado.enviado === true ? resultado.nomeDeArquivo : '',
    'foto-1.jpg',
  );
  // O `mover` aponta para o nome novo: nada sobrescreve `foto.jpg`.
  assert.ok(
    cen.arquivos.operacoes.includes(
      `mover /tmp/phpA1b2c3 ${PASTA_DO_MES}/foto-1.jpg`,
    ),
  );
  assert.ok(
    !cen.arquivos.operacoes.some((operacao) =>
      operacao.startsWith(`mover /tmp/phpA1b2c3 ${PASTA_DO_MES}/foto.jpg`),
    ),
  );
});

test('CA-1.4 tres envios do mesmo nome geram a sequencia do legado', () => {
  // `PT-014`: "quando o envio e repetido tres vezes, a sequencia de nomes
  // gerada e identica nas duas". O disco cresce entre os envios.
  const existentes = [`${PASTA_DO_MES}/foto.jpg`];
  const listagem = ['foto.jpg'];
  const nomes: string[] = [];

  for (let volta = 0; volta < 3; volta += 1) {
    const cen = cenario({
      arquivos: { existentes: [...existentes], listagem: [...listagem] },
    });
    const resultado = enviar(cen, 'foto.jpg', 'tela-de-midia', 0);
    const nome = resultado.enviado === true ? resultado.nomeDeArquivo : 'falhou';
    nomes.push(nome);
    existentes.push(`${PASTA_DO_MES}/${nome}`);
    listagem.push(nome);
  }

  assert.deepEqual(nomes, ['foto-1.jpg', 'foto-2.jpg', 'foto-3.jpg']);
});

test('CA-1.4 nome que parece derivada recebe numero mesmo sem colisao', () => {
  // `/-(?:\d+x\d+|scaled|rotated)$/` (`wp-includes/functions.php:2616`):
  // "always append a number to file names that can potentially match image
  // sub-size file names".
  const cen = cenario();

  const resultado = enviar(cen, 'grafico-1024x768.jpg', 'tela-de-midia', 0);

  assert.equal(
    resultado.enviado === true ? resultado.nomeDeArquivo : '',
    'grafico-1024x768-1.jpg',
  );
});

test('CA-1.4 colisao com nome de derivada de OUTRO anexo tambem renomeia', () => {
  // O laco 2 (`functions.php:2719`): sem ele, as derivadas deste anexo
  // sobrescreveriam as do anexo que ja esta na pasta.
  const cen = cenario({
    arquivos: { listagem: ['foto-150x150.jpg'] },
  });

  const resultado = enviar(cen, 'foto.jpg', 'tela-de-midia', 0);

  assert.equal(
    resultado.enviado === true ? resultado.nomeDeArquivo : '',
    'foto-1.jpg',
  );
});

test('CA-1.4 a sanitizacao do nome e a do legado, incluindo a extensao do meio', () => {
  const texto = {
    removerAcentos: (valor: string) => valor,
    ehUtf8Valido: () => true,
    sanitizarTituloComTracos: (valor: string) => valor,
    sanitizarCampoDeTexto: (valor: string) => valor,
  };
  const permitida = tiposPermitidos(false);

  // `exploit.php.jpg` → `exploit.php_.jpg` (`formatting.php:2099`): `php` e
  // alfabetico de 2 a 5 letras e nao esta na lista permitida.
  assert.equal(
    sanitizarNomeDeArquivo(
      'exploit.php.jpg',
      texto,
      TIPOS_DE_ARQUIVO_DE_FABRICA,
      permitida,
    ),
    'exploit.php_.jpg',
  );

  /*
    ⚠️ **Espaco vira traco; `+` e `%` DESAPARECEM em vez de virar traco.** Os
    dois estao em `$special_chars` (`formatting.php:2039`) e sao removidos na
    linha **anterior** a que troca `array( '%20', '+' )` por `-` (`:2073`-`:2074`)
    — logo, com a lista de caracteres de fabrica, **essa troca e inalcancavel**:
    quando ela roda, nao ha mais `+` nem `%` no nome. Ela nao e codigo morto no
    geral porque a lista e ponto de extensao (`sanitize_file_name_chars`, P2) e
    uma extensao pode retirar `%` dela. Um porte que "corrigisse" a ordem
    produziria `minha-foto-final.jpg` e `minha-foto.jpg` — nomes que o legado
    nao gera, em endereco publico.
  */
  assert.equal(
    sanitizarNomeDeArquivo(
      'minha  foto+final!.jpg',
      texto,
      TIPOS_DE_ARQUIVO_DE_FABRICA,
      permitida,
    ),
    'minha-fotofinal.jpg',
  );
  assert.equal(
    sanitizarNomeDeArquivo(
      'minha%20foto.jpg',
      texto,
      TIPOS_DE_ARQUIVO_DE_FABRICA,
      permitida,
    ),
    'minha20foto.jpg',
  );

  // Nome que e so uma extensao conhecida ganha nome (`formatting.php:2078`).
  assert.equal(
    sanitizarNomeDeArquivo(
      'pdf',
      texto,
      TIPOS_DE_ARQUIVO_DE_FABRICA,
      permitida,
    ),
    'unnamed-file.pdf',
  );
});

/* ── CA-1.5 ─────────────────────────────────────────────────────────────────
   "Destino nao gravavel devolve erro com a mensagem do sistema de arquivos, e
   nenhum registro de anexo e criado" */

test('CA-1.5 pasta que nao pode ser criada devolve a mensagem do legado', () => {
  const cen = cenario({
    arquivos: { falhaAoCriarPasta: 'mkdir(): Permission denied' },
  });

  const resultado = enviar(cen, 'foto.jpg', 'tela-de-midia', 0);

  assert.equal(resultado.enviado, false);
  assert.equal(
    resultado.enviado === false ? resultado.mensagem : '',
    MENSAGEM_DE_PASTA_NAO_CRIADA.replace('%s', 'wp-content/uploads/2026/10'),
  );
});

test('CA-1.5 nenhum registro de anexo e criado quando a pasta falha', () => {
  const cen = cenario({
    arquivos: { falhaAoCriarPasta: 'mkdir(): Permission denied' },
  });

  enviar(cen, 'foto.jpg', 'tela-de-midia', 0);

  assert.deepEqual(cen.conteudo.insercoes, []);
  assert.deepEqual(cen.dados.escritas, []);
  // E o arquivo nao foi movido: a ordem dos passos 7 e 9 e o que garante isso.
  assert.ok(
    !cen.arquivos.operacoes.some((operacao) => operacao.startsWith('mover ')),
  );
});

test('CA-1.5 falha ao mover devolve a outra mensagem, e tambem sem registro', () => {
  const cen = cenario({ arquivos: { falhaAoMover: true } });

  const resultado = enviar(cen, 'foto.jpg', 'tela-de-midia', 0);

  assert.equal(resultado.enviado, false);
  assert.equal(
    resultado.enviado === false ? resultado.mensagem : '',
    MENSAGEM_DE_ARQUIVO_NAO_MOVIDO.replace('%s', 'wp-content/uploads/2026/10'),
  );
  assert.deepEqual(cen.conteudo.insercoes, []);
  assert.deepEqual(cen.dados.escritas, []);
});

test('CA-1.5 os erros de envio do runtime chegam ao ator com o texto do legado', () => {
  const cen = cenario();

  const resultado = enviarArquivo(cen.contexto, {
    superficie: 'tela-de-midia',
    conteudoDeDestino: 0,
    arquivo: { ...arquivoRecebido('foto.jpg'), erro: 1 },
  });

  assert.equal(
    resultado.enviado === false ? resultado.mensagem : '',
    MENSAGENS_DE_ERRO_DE_ENVIO[1],
  );
  assert.deepEqual(cen.conteudo.insercoes, []);

  const vazio = cenario();
  const semBytes = enviarArquivo(vazio.contexto, {
    superficie: 'tela-de-midia',
    conteudoDeDestino: 0,
    arquivo: { ...arquivoRecebido('foto.jpg'), bytes: 0 },
  });
  assert.equal(
    semBytes.enviado === false ? semBytes.mensagem : '',
    MENSAGEM_DE_ARQUIVO_VAZIO,
  );

  const forasteiro = cenario();
  const naoRecebido = enviarArquivo(forasteiro.contexto, {
    superficie: 'tela-de-midia',
    conteudoDeDestino: 0,
    arquivo: { ...arquivoRecebido('foto.jpg'), recebidoNaRequisicao: false },
  });
  assert.equal(
    naoRecebido.enviado === false ? naoRecebido.mensagem : '',
    MENSAGEM_DE_ARQUIVO_NAO_RECEBIDO,
  );
});

test('CA-1.5 falha de BC-01 ao gravar a linha devolve o codigo e o texto dele', () => {
  const cen = cenario({
    falhaAoInserir: {
      codigo: 'db_insert_error',
      mensagem: 'Could not insert post into the database.',
    },
  });

  const resultado = enviar(cen, 'foto.jpg', 'tela-de-midia', 0);

  assert.equal(resultado.enviado, false);
  assert.equal(
    resultado.enviado === false ? resultado.motivo : null,
    'falha-ao-criar-anexo',
  );
  assert.equal(
    resultado.enviado === false && resultado.motivo === 'falha-ao-criar-anexo'
      ? resultado.codigo
      : '',
    'db_insert_error',
  );
  // 🔴 E nenhum metadado sobrevive. No legado a gravacao do texto alternativo
  // vem ANTES da verificacao do erro (`media.php:431` contra `:433`) e recebe o
  // objeto de erro como identificador, o que mata a requisicao; o observavel
  // que as duas leituras compartilham e este. Ver `enviar-arquivo.ts`.
  assert.deepEqual(cen.dados.escritas, []);
});

/* ── CA-1.6 ─────────────────────────────────────────────────────────────────
   "O envio pela tela e o envio assincrono do editor aplicam as mesmas duas
   verificacoes de capacidade" */

test('CA-1.6 as tres superficies recusam quem nao tem a capacidade de enviar', () => {
  const mensagens = SUPERFICIES.map((superficie) => {
    const cen = cenario({ papel: 'contributor' });
    const resultado = enviar(cen, 'foto.jpg', superficie);
    return resultado.enviado === false ? resultado.mensagem : 'enviou';
  });

  assert.deepEqual(mensagens, [
    MENSAGEM_DE_ENVIO_NAO_PERMITIDO,
    MENSAGEM_DE_ENVIO_NAO_PERMITIDO,
    MENSAGEM_DE_ENVIO_NAO_PERMITIDO,
  ]);
});

test('CA-1.6 as tres superficies perguntam `edit_post` sobre o MESMO objeto', () => {
  /*
    E a igualdade que o criterio cobra: as duas verificacoes acontecem nas tres.
    A pergunta e observavel porque a traducao de `edit_post` le o conteudo pela
    fonte de `map_meta_cap()`, e o duplo registra cada leitura.
  */
  for (const superficie of SUPERFICIES) {
    const cen = cenario({ destino: DESTINO_ALHEIO });

    enviar(cen, 'foto.jpg', superficie);

    assert.ok(
      cen.autorizacao.perguntas.includes(ID_DO_DESTINO),
      `a superficie ${superficie} nao perguntou edit_post do destino`,
    );
  }
});

test('🔴 CA-1.6 a pergunta e a mesma nas tres, a CONSEQUENCIA nao', () => {
  // Ver `permissao-de-envio.ts`: duas superficies descartam o destino e seguem,
  // a do editor recusa. Esta tarefa reproduz as duas e nao escolhe.
  const desfechos = SUPERFICIES.map((superficie) => {
    const cen = cenario({ destino: DESTINO_ALHEIO });
    const resultado = enviar(cen, 'foto.jpg', superficie);
    return resultado.enviado;
  });

  assert.deepEqual(desfechos, [true, true, false]);
});

/* ── A SEQUENCIA, E O QUE O ENVIO GRAVA ─────────────────────────────────────
   O cenario `@composicao` de `PT-014` compara a sequencia de operacoes e exige
   que "nenhuma operacao a mais seja executada". */

test('a sequencia de operacoes de um envio sem colisao e a do legado', () => {
  const cen = cenario({ deteccao: deteccao('image/jpeg', null) });

  enviar(cen, 'foto.jpg', 'tela-de-midia', 0);

  assert.deepEqual(cen.arquivos.operacoes, [
    // passo 6: `file_exists( $file )` dentro de `wp_check_filetype_and_ext()`
    'existe /tmp/phpA1b2c3',
    // passo 7: `wp_mkdir_p( $uploads['path'] )`
    `criarPasta ${PASTA_DO_MES}`,
    // passo 8, laco 1: `file_exists( $_dir . $filename )`
    `existe ${PASTA_DO_MES}/foto.jpg`,
    // passo 8, laco 2: `@is_dir( $dir )` e `@scandir( $dir )`
    `ehPasta ${PASTA_DO_MES}`,
    `listar ${PASTA_DO_MES}`,
    // passo 8, laco 3: os quatro nomes alternativos de conversao HEIC/HEIF
    // mais o proprio, so quando ha conversao a considerar — aqui o laco nao
    // roda porque nenhum dos cinco existe, e a primeira pergunta e a do
    // `.heic`.
    `existe ${PASTA_DO_MES}/foto.heic`,
    `existe ${PASTA_DO_MES}/foto.heif`,
    `existe ${PASTA_DO_MES}/foto.heics`,
    `existe ${PASTA_DO_MES}/foto.heifs`,
    `existe ${PASTA_DO_MES}/foto.jpg`,
    // passo 9: `@move_uploaded_file()`
    `mover /tmp/phpA1b2c3 ${PASTA_DO_MES}/foto.jpg`,
  ]);
});

test('o pedido do anexo leva as tres colunas que mudam de sentido no anexo', () => {
  const cen = cenario({ deteccao: deteccao('image/jpeg', null) });

  enviar(cen, 'ferias no mar.jpg', 'tela-de-midia', 0);

  const pedido = cen.conteudo.insercoes[0];
  assert.equal(pedido?.tipoMime, 'image/jpeg');
  // `guid` e o ENDERECO do arquivo (`plan.md`, Modelo de dados).
  assert.equal(
    pedido?.endereco,
    `${ENDERECO_BASE}/2026/10/ferias-no-mar.jpg`,
  );
  /*
    ⚠️ **O titulo sai do nome CRU, nao do nome em disco** — e e por isso que ele
    conserva o espaco que o arquivo perdeu. `media_handle_upload()` le
    `$_FILES[...]['name']` (`media.php:313`), tira a extensao com
    `wp_basename()` e passa por `sanitize_text_field()` (`:316`);
    `sanitize_file_name()` roda **so** dentro de `wp_unique_filename()`, para o
    nome do arquivo. Sao duas cadeias diferentes sobre a mesma entrada, e um
    porte que usasse o nome em disco para o titulo trocaria o que a biblioteca
    de midia exibe.
  */
  assert.equal(pedido?.titulo, 'ferias no mar');
  assert.equal(
    pedido?.arquivo,
    `${PASTA_DO_MES}/ferias-no-mar.jpg`,
    'o nome em disco e o sanitizado',
  );
  // `file` e o caminho ABSOLUTO: quem relativiza e `update_attached_file()`,
  // dentro de `wp_insert_post()` (BC-01).
  assert.equal(pedido?.arquivo, `${PASTA_DO_MES}/ferias-no-mar.jpg`);
  // E o pedido NAO traz estado: `P2` o resolve em `wp_insert_post()`.
  assert.ok(!Object.hasOwn(pedido ?? {}, 'estado'));
});

test('a data do destino retrodata a pasta, e `page` nao retrodata', () => {
  // `wp-admin/includes/media.php:300`-`:303`.
  const comPost = cenario({ deteccao: deteccao('image/jpeg', null) });
  const resultadoPost = enviar(comPost, 'foto.jpg');
  assert.equal(
    resultadoPost.enviado === true ? resultadoPost.caminho : '',
    `${RAIZ_DE_ENVIOS}/2026/03/foto.jpg`,
  );

  const comPagina = cenario({
    destino: { ...DESTINO_PROPRIO, tipo: 'page' },
    deteccao: deteccao('image/jpeg', null),
  });
  const resultadoPagina = enviar(comPagina, 'foto.jpg');
  assert.equal(
    resultadoPagina.enviado === true ? resultadoPagina.caminho : '',
    `${PASTA_DO_MES}/foto.jpg`,
  );
});

test('a opcao desligada tira a subpasta de ano e mes', () => {
  const cen = cenario({
    organizarPorAnoEMes: false,
    deteccao: deteccao('image/jpeg', null),
  });

  const resultado = enviar(cen, 'foto.jpg', 'tela-de-midia', 0);

  assert.equal(
    resultado.enviado === true ? resultado.caminho : '',
    `${RAIZ_DE_ENVIOS}/foto.jpg`,
  );
});

test('o texto alternativo so e gravado quando ha texto (a chave ausente e observavel)', () => {
  const semTexto = cenario({
    deteccao: deteccao('image/jpeg', null),
    metadadoDeImagem: { titulo: '', legenda: '', textoAlternativo: '   ' },
  });
  enviar(semTexto, 'foto.jpg', 'tela-de-midia', 0);
  // `if ( trim( $alt ) )` (`wp-admin/includes/media.php:431`): nenhum comando.
  assert.deepEqual(semTexto.dados.escritas, []);

  const comTexto = cenario({
    deteccao: deteccao('image/jpeg', null),
    metadadoDeImagem: {
      titulo: 'Praia ao amanhecer',
      legenda: 'O sol subindo',
      textoAlternativo: 'Praia com o sol no horizonte',
    },
  });
  enviar(comTexto, 'foto.jpg', 'tela-de-midia', 0);

  assert.equal(comTexto.dados.escritas.length, 1);
  const escrita = comTexto.dados.escritas[0];
  assert.ok(escrita?.texto.startsWith('INSERT INTO wp_postmeta'));
  assert.equal(
    textoDoParametro(escrita?.parametros[1]),
    '_wp_attachment_image_alt',
  );
  assert.equal(
    textoDoParametro(escrita?.parametros[2]),
    'Praia com o sol no horizonte',
  );

  // E o titulo e a legenda do EXIF entram no pedido do anexo (`media.php:395`).
  assert.equal(comTexto.conteudo.insercoes[0]?.titulo, 'Praia ao amanhecer');
  assert.equal(comTexto.conteudo.insercoes[0]?.legenda, 'O sol subindo');
});

test('titulo EXIF que e so numero NAO substitui o nome do arquivo', () => {
  // `! is_numeric( sanitize_title( $image_meta['title'] ) )`
  // (`wp-admin/includes/media.php:395`): muita camera grava o numero da foto.
  const cen = cenario({
    deteccao: deteccao('image/jpeg', null),
    metadadoDeImagem: { titulo: '1024', legenda: '', textoAlternativo: '' },
  });

  enviar(cen, 'foto.jpg', 'tela-de-midia', 0);

  assert.equal(cen.conteudo.insercoes[0]?.titulo, 'foto');
});

test('o envio nao gera derivada nenhuma: isso e T007', () => {
  /*
    `media_handle_upload()` termina em `wp_generate_attachment_metadata()`
    (`media.php:444`), que e US-3. A prova e negativa: o metadado de derivadas
    nao e gravado, e a unica escrita possivel aqui e o texto alternativo.
  */
  const cen = cenario({ deteccao: deteccao('image/jpeg', null) });

  enviar(cen, 'foto.jpg', 'tela-de-midia', 0);

  assert.ok(
    !cen.dados.escritas.some((consulta) =>
      consulta.parametros.some(
        (valor) => textoDoParametro(valor) === '_wp_attachment_metadata',
      ),
    ),
  );
});
