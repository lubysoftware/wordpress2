/**
 * Os criterios de aceite de US-1 — *"Instalar e atualizar extensao a partir do
 * catalogo ou de arquivo enviado"* —, entrega de **T003** da feature
 * `010-operacao-do-software`: CA-1.1 a CA-1.7 e a regra *"as capacidades de
 * instalacao sao exclusivas do papel de administracao, e em rede sao negadas a
 * quem nao administra a rede"*.
 *
 * Os casos do catalogo (`UT-106-1` a `UT-106-8`) sao de **T004**, numa suite
 * propria; esta afirma os criterios contra o que T003 construiu.
 *
 * Nada de rede, disco ou relogio: o cliente externo e um duplo que registra cada
 * pedido, e o `run()` do legado e um duplo que registra cada chamada — e assim
 * que se afirma o caso em que **nada** sai.
 *
 * A matriz e transcrita do legado, so com o que estes casos leem:
 * `wp-admin/includes/schema.php:762` (`activate_plugins`), `:920`
 * (`update_plugins`), `:934`-`:935` (`install_plugins`, `update_themes`) e
 * `:948` (`install_themes`), todas do administrador. `upload_plugins` e
 * `upload_themes` **nao** estao em papel nenhum.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type ConstantesDoServidor,
  type ContextoDeAutorizacao,
  type GanchosDeAutorizacao,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';
import type {
  PedidoExterno,
  PortaDeClienteExterno,
  ResultadoExterno,
} from '../portas/index.js';
import {
  AVISO_DE_CANAL_SEM_CIFRA,
  CAPACIDADES_DE_MODIFICAR_ARQUIVO,
  CODIGO_DE_PHP_INCOMPATIVEL,
  MENSAGEM_DE_ARQUIVO_QUE_NAO_E_ZIP,
  MENSAGEM_DE_FALHA_DO_CATALOGO,
  MENSAGEM_DE_TOKEN_VENCIDO,
  MENSAGEM_SEM_PERMISSAO_DE_ATUALIZAR_PLUGINS,
  MENSAGEM_SEM_PERMISSAO_DE_INSTALAR_PLUGINS,
  PERMISSOES_DA_INSTALACAO,
  TEMPO_LIMITE_DA_CONSULTA_AO_CATALOGO,
  TITULO_DE_TOKEN_VENCIDO,
  acaoDoToken,
  criarAreaDeInstalacao,
  type AcaoDaTelaDeAtualizacao,
  type ConclusaoDaExecucao,
  type ContextoDaInstalacao,
  type GanchosDaInstalacao,
  type OfertaDeAtualizacao,
  type OpcoesDaExecucao,
  type PacoteEnviado,
  type ResultadoDaExecucao,
} from './index.js';

const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'administrator',
    capacidades: [
      'switch_themes',
      'activate_plugins',
      'delete_users',
      'update_plugins',
      'delete_plugins',
      'install_plugins',
      'update_themes',
      'install_themes',
      'update_core',
    ].map((capacidade) => ({ capacidade, concedida: true })),
  },
  {
    identificador: 'editor',
    capacidades: ['edit_posts', 'edit_others_posts', 'moderate_comments'].map(
      (capacidade) => ({ capacidade, concedida: true }),
    ),
  },
];

function ator(login: string, ...concessoes: readonly string[]): AtorDeAutorizacao {
  return {
    contaId: login.length,
    login,
    existe: true,
    concessoes: concessoes.map((capacidade) => ({ capacidade, concedida: true })),
  };
}

const ADMINISTRADOR = ator('admin', 'administrator');
const EDITOR = ator('editora', 'editor');

/** O token que o duplo de `wp_verify_nonce()` aceita para uma acao. */
function tokenValido(acao: string): string {
  return `valido:${acao}`;
}

interface Registro {
  readonly rodadas: OpcoesDaExecucao[];
  readonly conexoes: (readonly string[])[];
  readonly manutencoes: boolean[];
  readonly conclusoes: ConclusaoDaExecucao[];
  readonly tokensConferidos: string[];
  readonly limpezas: PacoteEnviado[];
  readonly erros: string[];
  readonly personalizadas: string[];
}

interface OpcoesDoContexto {
  readonly ator?: AtorDeAutorizacao;
  readonly redeAtiva?: boolean;
  readonly superAdmins?: readonly string[];
  readonly constantes?: ConstantesDoServidor;
  readonly menuDePluginsLiberado?: boolean;
  readonly aoPerguntarSeModificaArquivo?: (permitido: boolean, contexto: string) => boolean;
  readonly aoMontarCapacidadesDoAtor?: GanchosDeAutorizacao['aoMontarCapacidadesDoAtor'];
  readonly suportaTls?: boolean;
  readonly pedidoJson?: boolean;
  readonly ofertasDePlugins?: ReadonlyMap<string, OfertaDeAtualizacao>;
  readonly ofertasDeTemas?: ReadonlyMap<string, OfertaDeAtualizacao>;
  readonly pluginsAtivos?: readonly string[];
  readonly resultados?: ReadonlyMap<string, ResultadoDaExecucao>;
  readonly conexao?: boolean;
  readonly envio?:
    | { readonly recebido: true; readonly pacote: PacoteEnviado }
    | { readonly recebido: false; readonly mensagem: string };
  readonly phpCompativel?: boolean;
  readonly ganchos?: GanchosDaInstalacao;
}

function contextoDeTeste(opcoes: OpcoesDoContexto = {}): {
  contexto: ContextoDaInstalacao;
  registro: Registro;
} {
  const registro: Registro = {
    rodadas: [],
    conexoes: [],
    manutencoes: [],
    conclusoes: [],
    tokensConferidos: [],
    limpezas: [],
    erros: [],
    personalizadas: [],
  };

  const ganchoDoAtor = opcoes.aoMontarCapacidadesDoAtor;
  const autorizacao: ContextoDeAutorizacao = {
    matriz: MATRIZ,
    rede:
      opcoes.redeAtiva === true
        ? { ativa: true, loginsDeSuperAdmin: opcoes.superAdmins ?? [] }
        : REDE_INATIVA_NA_AUTORIZACAO,
    ator: opcoes.ator ?? ADMINISTRADOR,
    ...(opcoes.constantes === undefined ? {} : { constantes: opcoes.constantes }),
    ...(ganchoDoAtor === undefined
      ? {}
      : { ganchos: { aoMontarCapacidadesDoAtor: ganchoDoAtor } }),
  };

  const contexto: ContextoDaInstalacao = {
    autorizacao,
    ...(opcoes.aoPerguntarSeModificaArquivo === undefined
      ? {}
      : { aoPerguntarSeModificaArquivo: opcoes.aoPerguntarSeModificaArquivo }),
    menuDePluginsLiberadoNosSites: () => opcoes.menuDePluginsLiberado ?? false,
    verificarNonce(acao, valor) {
      registro.tokensConferidos.push(acao);
      return valor === tokenValido(acao);
    },
    ambiente: {
      versaoDoNucleo: '7.1.2',
      versaoDoPhp: '8.3.0',
      nucleoCompativel: () => true,
      phpCompativel: () => opcoes.phpCompativel ?? true,
      idiomaDoAtor: 'pt_BR',
      enderecoDoSite: 'https://exemplo.test/',
      suportaTls: opcoes.suportaTls ?? true,
      pedidoJson: opcoes.pedidoJson ?? false,
      pedidoAjax: false,
    },
    pastas: {
      conteudo: '/srv/wp-content',
      plugins: '/srv/wp-content/plugins',
      temas: '/srv/wp-content/themes',
      raizDoTema: () => '/srv/wp-content/themes',
    },
    ofertasDePlugins: () => opcoes.ofertasDePlugins ?? new Map(),
    ofertasDeTemas: () => opcoes.ofertasDeTemas ?? new Map(),
    pluginAtivo: (plugin) => (opcoes.pluginsAtivos ?? []).includes(plugin),
    folhaDeEstiloAtiva: 'twentytwentyfive',
    modeloAtivo: 'twentytwentyfive',
    execucao: {
      rodar(execucao) {
        registro.rodadas.push(execucao);
        const chave = execucao.hook_extra.plugin ?? execucao.hook_extra.theme ?? execucao.package;
        return opcoes.resultados?.get(chave) ?? true;
      },
      conectar(pastas) {
        registro.conexoes.push(pastas);
        return opcoes.conexao ?? true;
      },
      manutencao(ligar) {
        registro.manutencoes.push(ligar);
      },
      concluir(conclusao) {
        registro.conclusoes.push(conclusao);
      },
    },
    recepcao: {
      receber: () =>
        opcoes.envio ?? {
          recebido: true,
          pacote: { package: '/srv/wp-content/uploads/meu-plugin.zip', filename: 'meu-plugin.zip', id: 42 },
        },
      limpar(pacote) {
        registro.limpezas.push(pacote);
      },
    },
    dispararErro(funcao, mensagem) {
      registro.erros.push(`${funcao}: ${mensagem}`);
    },
    ganchos: {
      aoReceberAcaoPersonalizada: (acao) => {
        registro.personalizadas.push(acao);
      },
      ...opcoes.ganchos,
    },
  };

  return { contexto, registro };
}

function clienteDeTeste(respostas: readonly ResultadoExterno[] = []): {
  cliente: PortaDeClienteExterno;
  pedidos: PedidoExterno[];
} {
  const pedidos: PedidoExterno[] = [];
  const fila = [...respostas];
  return {
    pedidos,
    cliente: {
      chamar(pedido) {
        pedidos.push(pedido);
        return (
          fila.shift() ?? {
            completou: true,
            resposta: { codigo: 200, cabecalhos: {}, corpo: '{}' },
          }
        );
      },
      baixar() {
        throw new Error('a tela de US-1 nao baixa: baixar e do run() do legado');
      },
    },
  };
}

function respostaJson(corpo: unknown): ResultadoExterno {
  return {
    completou: true,
    resposta: { codigo: 200, cabecalhos: {}, corpo: JSON.stringify(corpo) },
  };
}

const INFORMACAO_DO_AKISMET = {
  name: 'Akismet Anti-spam',
  version: '5.4',
  download_link: 'https://downloads.wordpress.org/plugin/akismet.5.4.zip',
};

// ---------------------------------------------------------------------------
// CA-1.1 — capacidade e token
// ---------------------------------------------------------------------------

test('CA-1.1: sem a capacidade, a tela recusa antes do token e sem tocar nada', () => {
  const { contexto, registro } = contextoDeTeste({ ator: EDITOR });
  const { cliente, pedidos } = clienteDeTeste();

  const resposta = criarAreaDeInstalacao(cliente).atenderTelaDeAtualizacao(contexto, {
    acao: 'install-plugin',
    plugin: 'akismet',
    token: tokenValido('install-plugin_akismet'),
  });

  assert.deepEqual(resposta, {
    tipo: 'recusada',
    motivo: 'sem-permissao',
    status: 500,
    titulo: null,
    mensagem: MENSAGEM_SEM_PERMISSAO_DE_INSTALAR_PLUGINS,
  });
  assert.deepEqual(registro.tokensConferidos, []);
  assert.deepEqual(pedidos, []);
  assert.deepEqual(registro.rodadas, []);
});

test('CA-1.1: com a capacidade e token vencido, recusa com 403 e nao consulta o catalogo', () => {
  const { contexto, registro } = contextoDeTeste();
  const { cliente, pedidos } = clienteDeTeste();

  const resposta = criarAreaDeInstalacao(cliente).atenderTelaDeAtualizacao(contexto, {
    acao: 'install-plugin',
    plugin: 'akismet',
    token: 'vencido',
  });

  assert.deepEqual(resposta, {
    tipo: 'recusada',
    motivo: 'token-vencido',
    status: 403,
    titulo: TITULO_DE_TOKEN_VENCIDO,
    mensagem: MENSAGEM_DE_TOKEN_VENCIDO,
  });
  assert.deepEqual(registro.tokensConferidos, ['install-plugin_akismet']);
  assert.deepEqual(pedidos, []);
  assert.deepEqual(registro.rodadas, []);
});

test('CA-1.1: cada acao declara a sua capacidade e o seu token, como update.php', () => {
  const esperado: Record<AcaoDaTelaDeAtualizacao, readonly [string, string]> = {
    'update-selected': ['update_plugins', 'bulk-update-plugins'],
    'upgrade-plugin': ['update_plugins', 'upgrade-plugin_akismet/akismet.php'],
    'install-plugin': ['install_plugins', 'install-plugin_akismet/akismet.php'],
    'upload-plugin': ['upload_plugins', 'plugin-upload'],
    'upgrade-theme': ['update_themes', 'upgrade-theme_twentytwentyfive'],
    'update-selected-themes': ['update_themes', 'bulk-update-themes'],
    'install-theme': ['install_themes', 'install-theme_twentytwentyfive'],
    'upload-theme': ['upload_themes', 'theme-upload'],
  };
  for (const [acao, [capacidade, token]] of Object.entries(esperado)) {
    const a = acao as AcaoDaTelaDeAtualizacao;
    assert.equal(PERMISSOES_DA_INSTALACAO[a], capacidade, acao);
    assert.equal(acaoDoToken(a, 'akismet/akismet.php', 'twentytwentyfive'), token, acao);
  }
});

test('CA-1.1: o plugin do token e aparado como o trim() do PHP, e o tema decodificado', () => {
  const { contexto, registro } = contextoDeTeste();
  const area = criarAreaDeInstalacao(clienteDeTeste().cliente);

  area.atenderTelaDeAtualizacao(contexto, { acao: 'upgrade-plugin', plugin: ' \takismet/akismet.php\n' });
  area.atenderTelaDeAtualizacao(contexto, { acao: 'upgrade-theme', tema: 'meu+tema%2Dnovo' });

  assert.deepEqual(registro.tokensConferidos, [
    'upgrade-plugin_akismet/akismet.php',
    'upgrade-theme_meu tema-novo',
  ]);
});

// ---------------------------------------------------------------------------
// CA-1.2 — catalogo
// ---------------------------------------------------------------------------

test('CA-1.2: instalar do catalogo consulta o servico e instala o download_link', () => {
  const { contexto, registro } = contextoDeTeste();
  const { cliente, pedidos } = clienteDeTeste([respostaJson(INFORMACAO_DO_AKISMET)]);

  const resposta = criarAreaDeInstalacao(cliente).atenderTelaDeAtualizacao(contexto, {
    acao: 'install-plugin',
    plugin: 'akismet',
    token: tokenValido('install-plugin_akismet'),
  });

  assert.equal(pedidos.length, 1);
  const pedido = pedidos[0] as PedidoExterno;
  assert.equal(
    pedido.url,
    'https://api.wordpress.org/plugins/info/1.2/?action=plugin_information' +
      '&request%5Bslug%5D=akismet&request%5Bfields%5D%5Bsections%5D=0' +
      '&request%5Blocale%5D=pt_BR&request%5Bwp_version%5D=7.1',
  );
  assert.equal(pedido.metodo, 'GET');
  assert.equal(pedido.tempoLimiteEmSegundos, TEMPO_LIMITE_DA_CONSULTA_AO_CATALOGO);
  assert.equal(pedido.tempoLimiteEmSegundos, 15);
  assert.equal(pedido.agenteDeUsuario, 'WordPress/7.1.2; https://exemplo.test/');
  assert.equal(pedido.recusarUrlInsegura, false);

  assert.deepEqual(registro.rodadas, [
    {
      tipo: 'plugin',
      package: INFORMACAO_DO_AKISMET.download_link,
      destination: '/srv/wp-content/plugins',
      clear_destination: false,
      clear_working: true,
      hook_extra: { type: 'plugin', action: 'install' },
      filtrosAcoplados: ['check_package'],
    },
  ]);
  assert.equal(resposta.tipo, 'instalada');
  if (resposta.tipo === 'instalada') {
    assert.equal(resposta.origem, 'web');
    assert.equal(resposta.resultado, true);
    assert.equal(resposta.pacote, INFORMACAO_DO_AKISMET.download_link);
  }
});

test('CA-1.2: falha em https repete a MESMA consulta em claro, com aviso (resposta 12)', () => {
  const { contexto, registro } = contextoDeTeste();
  const { cliente, pedidos } = clienteDeTeste([
    { completou: false, codigoDeErro: 'http_request_failed', motivo: 'cURL error 60' },
    respostaJson(INFORMACAO_DO_AKISMET),
  ]);

  const resposta = criarAreaDeInstalacao(cliente).consultarInformacaoDoPlugin(contexto, 'akismet');

  assert.equal(pedidos.length, 2);
  assert.ok(pedidos[0]?.url.startsWith('https://api.wordpress.org/plugins/info/1.2/?'));
  assert.equal(pedidos[1]?.url, pedidos[0]?.url.replace('https://', 'http://'));
  assert.deepEqual(registro.erros, [`plugins_api: ${AVISO_DE_CANAL_SEM_CIFRA}`]);
  assert.deepEqual(resposta, { ok: true, informacao: INFORMACAO_DO_AKISMET });
});

test('CA-1.2: em pedido JSON a repeticao em claro acontece sem aviso; sem TLS nao ha repeticao', () => {
  const json = contextoDeTeste({ pedidoJson: true });
  const comFalha = clienteDeTeste([
    { completou: false, codigoDeErro: 'http_request_failed', motivo: 'x' },
    respostaJson(INFORMACAO_DO_AKISMET),
  ]);
  criarAreaDeInstalacao(comFalha.cliente).consultarInformacaoDoPlugin(json.contexto, 'akismet');
  assert.equal(comFalha.pedidos.length, 2);
  assert.deepEqual(json.registro.erros, []);

  const semTls = contextoDeTeste({ suportaTls: false });
  const unico = clienteDeTeste([
    { completou: false, codigoDeErro: 'http_request_failed', motivo: 'recusada' },
  ]);
  const resposta = criarAreaDeInstalacao(unico.cliente).consultarInformacaoDoPlugin(
    semTls.contexto,
    'akismet',
  );
  assert.equal(unico.pedidos.length, 1);
  assert.ok(unico.pedidos[0]?.url.startsWith('http://'));
  assert.deepEqual(resposta, {
    ok: false,
    erro: { codigo: 'plugins_api_failed', mensagem: MENSAGEM_DE_FALHA_DO_CATALOGO, dado: 'recusada' },
  });
});

test('CA-1.2: falha do catalogo para a tela num wp_die() 500 e nao instala nada', () => {
  const { contexto, registro } = contextoDeTeste();
  const { cliente } = clienteDeTeste([respostaJson({ error: 'Plugin not found.' })]);

  const resposta = criarAreaDeInstalacao(cliente).atenderTelaDeAtualizacao(contexto, {
    acao: 'install-plugin',
    plugin: 'nao-existe',
    token: tokenValido('install-plugin_nao-existe'),
  });

  assert.deepEqual(resposta, {
    tipo: 'recusada',
    motivo: 'catalogo',
    status: 500,
    titulo: null,
    mensagem: 'Plugin not found.',
  });
  assert.deepEqual(registro.rodadas, []);
});

test('CA-1.2: tema do catalogo pede tambem tags=0 e instala em get_theme_root()', () => {
  const { contexto, registro } = contextoDeTeste();
  const { cliente, pedidos } = clienteDeTeste([
    respostaJson({ name: 'T', version: '1', download_link: 'https://downloads.wordpress.org/theme/t.1.zip' }),
  ]);

  criarAreaDeInstalacao(cliente).atenderTelaDeAtualizacao(contexto, {
    acao: 'install-theme',
    tema: 't',
    token: tokenValido('install-theme_t'),
  });

  assert.equal(
    pedidos[0]?.url,
    'https://api.wordpress.org/themes/info/1.2/?action=theme_information' +
      '&request%5Bslug%5D=t&request%5Bfields%5D%5Bsections%5D=0&request%5Bfields%5D%5Btags%5D=0' +
      '&request%5Blocale%5D=pt_BR&request%5Bwp_version%5D=7.1',
  );
  assert.equal(registro.rodadas[0]?.destination, '/srv/wp-content/themes');
  assert.deepEqual(registro.rodadas[0]?.filtrosAcoplados, ['check_package', 'check_parent_theme_filter']);
});

test('CA-1.2: o atalho plugins_api pula a rede e marca o resultado como externo', () => {
  const { contexto } = contextoDeTeste({
    ganchos: {
      aoConsultarCatalogoDePlugins: () => ({ ok: true, informacao: { download_link: 'https://espelho.test/a.zip' } }),
    },
  });
  const { cliente, pedidos } = clienteDeTeste();

  const resposta = criarAreaDeInstalacao(cliente).consultarInformacaoDoPlugin(contexto, 'a');

  assert.deepEqual(pedidos, []);
  assert.deepEqual(resposta, {
    ok: true,
    informacao: { download_link: 'https://espelho.test/a.zip', external: true },
  });
});

// ---------------------------------------------------------------------------
// CA-1.3 — envio
// ---------------------------------------------------------------------------

test('CA-1.3: upload_plugins resolve para install_plugins e upload_themes para install_themes', () => {
  const area = criarAreaDeInstalacao(clienteDeTeste().cliente);

  const soInstalar = contextoDeTeste({ ator: ator('a', 'install_plugins', 'install_themes') });
  assert.equal(area.perguntar(soInstalar.contexto, 'upload_plugins'), true);
  assert.equal(area.perguntar(soInstalar.contexto, 'upload_themes'), true);

  // A capacidade de envio concedida sozinha nao serve: o que se exige e a de instalar.
  const soEnviar = contextoDeTeste({ ator: ator('b', 'upload_plugins', 'upload_themes') });
  assert.equal(area.perguntar(soEnviar.contexto, 'upload_plugins'), false);
  assert.equal(area.perguntar(soEnviar.contexto, 'upload_themes'), false);
});

test('CA-1.3: instalar de arquivo enviado nao consulta o servico e limpa o pacote', () => {
  const { contexto, registro } = contextoDeTeste();
  const { cliente, pedidos } = clienteDeTeste();

  const resposta = criarAreaDeInstalacao(cliente).atenderTelaDeAtualizacao(contexto, {
    acao: 'upload-plugin',
    token: tokenValido('plugin-upload'),
    nomeDoArquivoEnviado: 'Meu-Plugin.ZIP',
    sobrescrita: 'update-plugin',
  });

  assert.deepEqual(pedidos, []);
  assert.deepEqual(registro.rodadas, [
    {
      tipo: 'plugin',
      package: '/srv/wp-content/uploads/meu-plugin.zip',
      destination: '/srv/wp-content/plugins',
      clear_destination: 'update-plugin',
      clear_working: true,
      hook_extra: { type: 'plugin', action: 'install' },
      filtrosAcoplados: ['check_package'],
    },
  ]);
  assert.equal(registro.limpezas.length, 1);
  assert.equal(resposta.tipo, 'instalada');
  if (resposta.tipo === 'instalada') {
    assert.equal(resposta.origem, 'upload');
    assert.deepEqual(resposta.enviado?.limpo, true);
  }
});

test('CA-1.3: sobrescrita fora da lista vira texto vazio, e false mantem o pacote', () => {
  const { contexto, registro } = contextoDeTeste({
    resultados: new Map([['/srv/wp-content/uploads/meu-plugin.zip', false]]),
  });

  criarAreaDeInstalacao(clienteDeTeste().cliente).atenderTelaDeAtualizacao(contexto, {
    acao: 'upload-plugin',
    token: tokenValido('plugin-upload'),
    sobrescrita: 'update-theme',
  });

  assert.equal(registro.rodadas[0]?.clear_destination, '');
  assert.deepEqual(registro.limpezas, []);
});

test('CA-1.3: arquivo que nao termina em .zip e recusado depois do token', () => {
  const { contexto, registro } = contextoDeTeste();

  const resposta = criarAreaDeInstalacao(clienteDeTeste().cliente).atenderTelaDeAtualizacao(
    contexto,
    { acao: 'upload-theme', token: tokenValido('theme-upload'), nomeDoArquivoEnviado: 'tema.tar.gz' },
  );

  assert.deepEqual(resposta, {
    tipo: 'recusada',
    motivo: 'arquivo-que-nao-e-zip',
    status: 500,
    titulo: null,
    mensagem: MENSAGEM_DE_ARQUIVO_QUE_NAO_E_ZIP,
  });
  assert.deepEqual(registro.tokensConferidos, ['theme-upload']);
  assert.deepEqual(registro.rodadas, []);
});

// ---------------------------------------------------------------------------
// CA-1.4 — ativar e outra capacidade
// ---------------------------------------------------------------------------

test('CA-1.4: quem so instala nao ve "Activate Plugin"; o administrador ve', () => {
  const area = criarAreaDeInstalacao(clienteDeTeste().cliente);
  const fim = {
    resultado: true as const,
    arquivoDoPlugin: 'akismet/akismet.php',
    origem: 'web' as const,
    de: undefined,
    informacao: INFORMACAO_DO_AKISMET,
    sobrescritaOferecida: false,
  };

  const instalador = contextoDeTeste({ ator: ator('i', 'install_plugins') });
  assert.equal(area.perguntar(instalador.contexto, 'install_plugins'), true);
  assert.equal(area.perguntar(instalador.contexto, 'activate_plugin', 'akismet/akismet.php'), false);
  assert.deepEqual(
    [...(area.acoesDepoisDeInstalarPlugin(instalador.contexto, fim)?.keys() ?? [])],
    ['plugins_page'],
  );

  const administrador = contextoDeTeste();
  const acoes = area.acoesDepoisDeInstalarPlugin(administrador.contexto, fim);
  assert.deepEqual([...(acoes?.keys() ?? [])], ['activate_plugin', 'plugins_page']);
  assert.deepEqual(acoes?.get('activate_plugin'), {
    rotulo: 'Activate Plugin',
    endereco: 'plugins.php?action=activate&plugin=akismet%2Fakismet.php',
    base: 'relativo',
    token: 'activate-plugin_akismet/akismet.php',
  });
});

test('CA-1.4: plugin ja ativo, ou instalacao que falhou, nao oferecem ativar', () => {
  const area = criarAreaDeInstalacao(clienteDeTeste().cliente);
  const base = {
    arquivoDoPlugin: 'akismet/akismet.php',
    origem: 'upload' as const,
    de: undefined,
    informacao: null,
    sobrescritaOferecida: false,
  };

  const ativo = contextoDeTeste({ pluginsAtivos: ['akismet/akismet.php'] });
  assert.deepEqual(
    [...(area.acoesDepoisDeInstalarPlugin(ativo.contexto, { ...base, resultado: true })?.keys() ?? [])],
    ['plugins_page'],
  );

  const falhou = contextoDeTeste();
  assert.deepEqual(
    [
      ...(area
        .acoesDepoisDeInstalarPlugin(falhou.contexto, {
          ...base,
          resultado: { codigo: 'folder_exists', mensagem: 'x' },
        })
        ?.keys() ?? []),
    ],
    ['plugins_page'],
  );

  // A tela de sobrescrita do envio substitui a lista inteira.
  assert.equal(
    area.acoesDepoisDeInstalarPlugin(falhou.contexto, { ...base, resultado: true, sobrescritaOferecida: true }),
    null,
  );
});

test('CA-1.4: em rede, ativar soma manage_network_plugins se a rede nao liberou o menu', () => {
  const area = criarAreaDeInstalacao(clienteDeTeste().cliente);
  const administradorDeSite = ator('site', 'administrator');

  const fechado = contextoDeTeste({ ator: administradorDeSite, redeAtiva: true });
  assert.equal(area.perguntar(fechado.contexto, 'activate_plugin', 'a/a.php'), false);

  const liberado = contextoDeTeste({
    ator: administradorDeSite,
    redeAtiva: true,
    menuDePluginsLiberado: true,
  });
  assert.equal(area.perguntar(liberado.contexto, 'activate_plugin', 'a/a.php'), true);
  // E, ainda assim, nao instala: ativar nao passa por is_super_admin(), instalar passa.
  assert.equal(area.perguntar(liberado.contexto, 'install_plugins'), false);
});

test('CA-1.4: o super administrador da rede ve "Network Activate" no lugar de "Activate Plugin"', () => {
  const area = criarAreaDeInstalacao(clienteDeTeste().cliente);
  const { contexto } = contextoDeTeste({ redeAtiva: true, superAdmins: ['admin'] });

  const acoes = area.acoesDepoisDeInstalarPlugin(contexto, {
    resultado: true,
    arquivoDoPlugin: 'akismet/akismet.php',
    origem: 'web',
    de: undefined,
    informacao: null,
    sobrescritaOferecida: false,
  });

  assert.deepEqual([...(acoes?.keys() ?? [])], ['network_activate', 'plugins_page']);
});

// ---------------------------------------------------------------------------
// CA-1.5 — lote
// ---------------------------------------------------------------------------

test('CA-1.5: a capacidade do lote e perguntada uma vez, e cada item tem resultado proprio', () => {
  let perguntasDeAtualizar = 0;
  const erro = { codigo: 'download_failed', mensagem: 'Download failed.' };
  const { contexto, registro } = contextoDeTeste({
    aoMontarCapacidadesDoAtor: (capacidades, exigidas) => {
      if (exigidas.includes('update_plugins')) {
        perguntasDeAtualizar += 1;
      }
      return capacidades;
    },
    ofertasDePlugins: new Map([
      ['a/a.php', { package: 'https://d.test/a.zip' }],
      ['b/b.php', { package: 'https://d.test/b.zip' }],
      ['d/d.php', { package: 'https://d.test/d.zip', requires_php: '9.0' }],
    ]),
    resultados: new Map<string, ResultadoDaExecucao>([['a/a.php', erro]]),
    phpCompativel: false,
  });

  const resposta = criarAreaDeInstalacao(clienteDeTeste().cliente).atenderTelaDeAtualizacao(
    contexto,
    {
      acao: 'update-selected',
      token: tokenValido('bulk-update-plugins'),
      pluginsNaUrl: 'a%2Fa.php,b%2Fb.php,c%2Fc.php,d%2Fd.php',
    },
  );

  assert.equal(perguntasDeAtualizar, 1);
  assert.equal(resposta.tipo, 'lote');
  if (resposta.tipo !== 'lote' || resposta.resultados === false) {
    assert.fail('o lote devia ter resultados');
  }
  assert.deepEqual(resposta.itens, ['a/a.php', 'b/b.php', 'c/c.php', 'd/d.php']);
  assert.deepEqual([...resposta.resultados.entries()], [
    ['a/a.php', erro],
    ['b/b.php', true],
    ['c/c.php', true],
    [
      'd/d.php',
      {
        codigo: CODIGO_DE_PHP_INCOMPATIVEL,
        mensagem: 'The PHP version on your server is 8.3.0, however the new plugin version requires 9.0.',
      },
    ],
  ]);
  // O que falhou nao interrompeu: b foi aplicado depois de a; c nao tinha oferta e
  // d foi barrado antes do run().
  assert.deepEqual(
    registro.rodadas.map((r) => r.hook_extra.plugin),
    ['a/a.php', 'b/b.php'],
  );
  assert.deepEqual(registro.rodadas[0]?.hook_extra.temp_backup, {
    slug: 'a',
    src: '/srv/wp-content/plugins',
    dir: 'plugins',
  });
  assert.equal(registro.rodadas[0]?.is_multi, true);
  assert.deepEqual(registro.conexoes, [['/srv/wp-content', '/srv/wp-content/plugins']]);
  assert.deepEqual(registro.manutencoes, [false]);
  assert.equal(registro.conclusoes.length, 1);
});

test('CA-1.5: so false interrompe o lote, e a conexao que falha encerra sem resultado', () => {
  const ofertas = new Map([
    ['a', { package: 'https://d.test/a.zip' }],
    ['b', { package: 'https://d.test/b.zip' }],
  ]);
  const interrompido = contextoDeTeste({
    ofertasDeTemas: ofertas,
    resultados: new Map([['a', false]]),
  });
  const area = criarAreaDeInstalacao(clienteDeTeste().cliente);

  const resposta = area.atenderTelaDeAtualizacao(interrompido.contexto, {
    acao: 'update-selected-themes',
    token: tokenValido('bulk-update-themes'),
    marcados: ['a', 'b'],
  });
  assert.ok(resposta.tipo === 'lote' && resposta.resultados !== false);
  assert.deepEqual([...resposta.resultados.entries()], [['a', false]]);
  assert.deepEqual(interrompido.registro.conexoes, [['/srv/wp-content']]);
  assert.deepEqual(interrompido.registro.manutencoes, [false]);

  const semConexao = contextoDeTeste({ ofertasDeTemas: ofertas, conexao: false });
  const recusada = area.atenderTelaDeAtualizacao(semConexao.contexto, {
    acao: 'update-selected-themes',
    token: tokenValido('bulk-update-themes'),
    marcados: ['a', 'b'],
  });
  assert.deepEqual(recusada, { tipo: 'lote', extensao: 'theme', itens: ['a', 'b'], resultados: false });
  assert.deepEqual(semConexao.registro.rodadas, []);
  assert.deepEqual(semConexao.registro.manutencoes, []);
  assert.deepEqual(semConexao.registro.conclusoes, []);
});

test('CA-1.5: lote sem permissao recusa antes de qualquer item', () => {
  const { contexto, registro } = contextoDeTeste({ ator: EDITOR });

  const resposta = criarAreaDeInstalacao(clienteDeTeste().cliente).atenderTelaDeAtualizacao(
    contexto,
    { acao: 'update-selected', token: tokenValido('bulk-update-plugins'), pluginsNaUrl: 'a,b' },
  );

  assert.deepEqual(resposta, {
    tipo: 'recusada',
    motivo: 'sem-permissao',
    status: 500,
    titulo: null,
    mensagem: MENSAGEM_SEM_PERMISSAO_DE_ATUALIZAR_PLUGINS,
  });
  assert.deepEqual(registro.conexoes, []);
});

// ---------------------------------------------------------------------------
// CA-1.6 — proibicao de modificar arquivos
// ---------------------------------------------------------------------------

test('CA-1.6: com DISALLOW_FILE_MODS, as nove sao negadas ao administrador e ao super administrador', () => {
  const area = criarAreaDeInstalacao(clienteDeTeste().cliente);
  const site = contextoDeTeste({ constantes: { DISALLOW_FILE_MODS: true } });
  const rede = contextoDeTeste({
    constantes: { DISALLOW_FILE_MODS: true },
    redeAtiva: true,
    superAdmins: ['admin'],
  });

  for (const capacidade of CAPACIDADES_DE_MODIFICAR_ARQUIVO) {
    assert.equal(area.perguntar(site.contexto, capacidade), false, capacidade);
    assert.equal(area.perguntar(rede.contexto, capacidade), false, capacidade);
  }

  const resposta = area.atenderTelaDeAtualizacao(site.contexto, {
    acao: 'upload-plugin',
    token: tokenValido('plugin-upload'),
  });
  assert.equal(resposta.tipo, 'recusada');
});

test('CA-1.6: file_mod_allowed que devolve false fecha as nove mesmo sem a constante', () => {
  const contextos: string[] = [];
  const { contexto } = contextoDeTeste({
    aoPerguntarSeModificaArquivo: (permitido, ctx) => {
      contextos.push(`${String(permitido)}:${ctx}`);
      return false;
    },
  });
  const area = criarAreaDeInstalacao(clienteDeTeste().cliente);

  assert.equal(area.perguntar(contexto, 'install_plugins'), false);
  assert.deepEqual(contextos, ['true:capability_update_core']);
  // Ativar nao e modificar arquivo: o filtro nao e consultado.
  assert.equal(area.perguntar(contexto, 'activate_plugins'), true);
  assert.equal(contextos.length, 1);
});

// ---------------------------------------------------------------------------
// CA-1.7 e a regra — poder de rede, papel de administracao
// ---------------------------------------------------------------------------

test('CA-1.7: em rede, instalar e atualizar sao do super administrador', () => {
  const area = criarAreaDeInstalacao(clienteDeTeste().cliente);
  const administradorDeSite = contextoDeTeste({ redeAtiva: true, superAdmins: ['outro'] });
  const superAdmin = contextoDeTeste({ redeAtiva: true, superAdmins: ['admin'] });

  for (const capacidade of ['install_plugins', 'update_plugins', 'upload_plugins', 'install_themes', 'update_themes', 'upload_themes']) {
    assert.equal(area.perguntar(administradorDeSite.contexto, capacidade), false, capacidade);
    assert.equal(area.perguntar(superAdmin.contexto, capacidade), true, capacidade);
  }
});

test('regra: as capacidades de instalacao sao do papel de administracao, e so dele', () => {
  const area = criarAreaDeInstalacao(clienteDeTeste().cliente);
  const administrador = contextoDeTeste();
  const editora = contextoDeTeste({ ator: EDITOR });

  for (const capacidade of ['install_plugins', 'update_plugins', 'upload_plugins', 'install_themes', 'update_themes', 'upload_themes']) {
    assert.equal(area.perguntar(administrador.contexto, capacidade), true, capacidade);
    assert.equal(area.perguntar(editora.contexto, capacidade), false, capacidade);
  }
});

// ---------------------------------------------------------------------------
// A superficie da tela
// ---------------------------------------------------------------------------

test('acao desconhecida dispara update-custom_{acao}; as tres nao portadas nao disparam', () => {
  const { contexto, registro } = contextoDeTeste();
  const area = criarAreaDeInstalacao(clienteDeTeste().cliente);

  assert.deepEqual(area.atenderTelaDeAtualizacao(contexto, { acao: 'minha-acao' }), {
    tipo: 'personalizada',
    acao: 'minha-acao',
  });
  assert.deepEqual(area.atenderTelaDeAtualizacao(contexto, { acao: 'activate-plugin' }), {
    tipo: 'nao-portada',
    acao: 'activate-plugin',
  });
  assert.deepEqual(registro.personalizadas, ['minha-acao']);
});

test('atualizar um so sem oferta devolve false sem chamar run(); com oferta, leva a copia de seguranca', () => {
  const sem = contextoDeTeste();
  const area = criarAreaDeInstalacao(clienteDeTeste().cliente);
  const resposta = area.atenderTelaDeAtualizacao(sem.contexto, {
    acao: 'upgrade-plugin',
    plugin: 'hello.php',
    token: tokenValido('upgrade-plugin_hello.php'),
  });
  assert.deepEqual(resposta, { tipo: 'atualizada', extensao: 'plugin', item: 'hello.php', resultado: false });
  assert.deepEqual(sem.registro.rodadas, []);

  const com = contextoDeTeste({ ofertasDePlugins: new Map([['hello.php', { package: 'https://d.test/h.zip' }]]) });
  area.atenderTelaDeAtualizacao(com.contexto, {
    acao: 'upgrade-plugin',
    plugin: 'hello.php',
    token: tokenValido('upgrade-plugin_hello.php'),
  });
  assert.deepEqual(com.registro.rodadas[0]?.hook_extra, {
    plugin: 'hello.php',
    type: 'plugin',
    action: 'update',
    temp_backup: { slug: '.', src: '/srv/wp-content/plugins', dir: 'plugins' },
  });
  assert.deepEqual(com.registro.conclusoes, [{ metodo: 'upgrade', tipo: 'plugin', item: 'hello.php' }]);
});
