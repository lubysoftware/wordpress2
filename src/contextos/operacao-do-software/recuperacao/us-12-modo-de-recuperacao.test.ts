/**
 * US-12 — entrar em modo de recuperacao quando um erro fatal derruba a area
 * protegida. Os criterios de aceite de **T025**, CA-12.1 a CA-12.7, e a semana
 * de `A10`.
 *
 * Os casos do catalogo (`UT-117-1` a `UT-117-8`) sao de **T026**, a tarefa
 * `[P]` paralela; esta suite afirma os criterios contra o legado lido em
 * `class-wp-recovery-mode*.php`, `class-wp-paused-extensions-storage.php` e
 * `class-wp-fatal-error-handler.php`.
 *
 * As opcoes vivem num duplo de memoria **por baixo** da sessao de T002 — a
 * sessao e a de verdade —, e o duplo registra cada leitura, gravacao,
 * apagamento e envio numa linha do tempo so: e assim que se afirma que o
 * marcador e gravado **antes** do envio.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type ContextoDeAutorizacao,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';
import {
  arranjo,
  arranjoPorNome,
  inteiro,
  texto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import {
  mesmoValorDeOpcao,
  type LeituraDeOpcao,
  type RepositorioDeOpcoesDeRede,
  type RepositorioDeOpcoesDoSite,
} from '../armazenamento/index.js';
import { criarSessaoDeRecuperacao } from '../configuracao/index.js';
import { acrescentarConsultaComoNoPhp } from '../instalacao/texto-como-no-php.js';
import type { MensagemDeEmail, PortaDeEmail } from '../portas/index.js';
import {
  CAPACIDADE_DE_RETOMAR_PLUGIN,
  CAPACIDADE_DE_RETOMAR_TEMA,
  MENSAGEM_DE_ERRO_COM_AVISO,
  MENSAGEM_DE_ERRO_CRITICO,
  MENSAGEM_DE_ERRO_EM_RECUPERACAO,
  MENSAGEM_DE_LINK_DE_SAIDA_VENCIDO,
  PERMISSOES_DA_RECUPERACAO,
  RECUPERACAO_NAO_INICIALIZADA,
  SEGUNDOS_POR_ANO,
  criarAreaDeRecuperacao,
  perguntarNaRecuperacao,
  type AreaDeRecuperacao,
  type ContextoDaRecuperacao,
  type DesfechoDoErroFatal,
  type ErroDaRecuperacao,
  type ErroFatal,
  type EstadoDaRecuperacao,
  type GanchosDaRecuperacao,
  type InstrucaoDeCookie,
} from './index.js';

const DIA = 86400;
const SEMANA = 7 * DIA;
const INICIO = 1_760_000_000;

// ── o duplo das opcoes e da caixa postal ──────────────────────────────────

type Evento =
  | { readonly acao: 'ler'; readonly nome: string }
  | { readonly acao: 'gravar'; readonly nome: string; readonly valor: ValorPhp }
  | { readonly acao: 'apagar'; readonly nome: string }
  | { readonly acao: 'enviar'; readonly mensagem: MensagemDeEmail };

interface Mundo {
  readonly opcoes: Map<string, ValorPhp>;
  readonly linha: Evento[];
  readonly falhaAoGravar: Set<string>;
  envioFalha: boolean;
  agora: number;
  /** O contador de `wp_generate_password()`: do mundo, para que cada sorteio seja novo. */
  sorteio: number;
}

function criarMundo(): Mundo {
  return {
    opcoes: new Map(),
    linha: [],
    falhaAoGravar: new Set(),
    envioFalha: false,
    agora: INICIO,
    sorteio: 0,
  };
}

/** `update_option()` com os dois casos que importam aqui: valor igual e falha. */
function opcoesDoSite(mundo: Mundo): RepositorioDeOpcoesDoSite {
  const ler = (nome: string): LeituraDeOpcao => {
    mundo.linha.push({ acao: 'ler', nome });
    const valor = mundo.opcoes.get(nome);
    return valor === undefined ? { existe: false } : { existe: true, valor };
  };
  const gravar = (nome: string, valor: ValorPhp): boolean => {
    const atual = mundo.opcoes.get(nome);
    if (atual !== undefined && mesmoValorDeOpcao(atual, valor)) {
      return false;
    }
    mundo.linha.push({ acao: 'gravar', nome, valor });
    if (mundo.falhaAoGravar.has(nome)) {
      return false;
    }
    mundo.opcoes.set(nome, valor);
    return true;
  };
  return {
    ler,
    acrescentar: gravar,
    gravar,
    apagar(nome) {
      if (!mundo.opcoes.has(nome)) {
        return false;
      }
      mundo.linha.push({ acao: 'apagar', nome });
      mundo.opcoes.delete(nome);
      return true;
    },
  };
}

/** Em site unico a opcao de rede e a do site, como em `opcao.ts`. */
function opcoesDeRede(site: RepositorioDeOpcoesDoSite): RepositorioDeOpcoesDeRede {
  return {
    ler: (_, nome) => site.ler(nome),
    acrescentar: (_, nome, valor) => site.acrescentar(nome, valor),
    gravar: (_, nome, valor) => site.gravar(nome, valor),
    apagar: (_, nome) => site.apagar(nome),
  };
}

function caixaPostal(mundo: Mundo): PortaDeEmail {
  return {
    enviar(mensagem) {
      mundo.linha.push({ acao: 'enviar', mensagem });
      return mundo.envioFalha ? { enviado: false, motivo: 'fora do ar' } : { enviado: true };
    },
  };
}

function area(mundo: Mundo): AreaDeRecuperacao {
  const site = opcoesDoSite(mundo);
  return criarAreaDeRecuperacao(
    criarSessaoDeRecuperacao(site, opcoesDeRede(site)),
    caixaPostal(mundo),
  );
}

function enviados(mundo: Mundo): MensagemDeEmail[] {
  return mundo.linha.flatMap((evento) => (evento.acao === 'enviar' ? [evento.mensagem] : []));
}

function gravacoes(mundo: Mundo): string[] {
  return mundo.linha.flatMap((evento) =>
    evento.acao === 'gravar' || evento.acao === 'apagar' ? [`${evento.acao}:${evento.nome}`] : [],
  );
}

// ── o contexto da requisicao ──────────────────────────────────────────────

interface Pedido {
  readonly pagina?: string;
  readonly painel?: boolean;
  readonly ajax?: boolean;
  readonly acao?: unknown;
  readonly consulta?: { readonly [nome: string]: unknown };
  readonly cookie?: string;
  readonly cabecalhosEnviados?: boolean;
  readonly emRede?: boolean;
  readonly constantes?: Partial<ContextoDaRecuperacao['constantes']>;
  readonly ganchos?: GanchosDaRecuperacao;
  readonly validarChave?: ContextoDaRecuperacao['validarChave'];
  readonly referencia?: string | false;
}

interface Registro {
  readonly chavesValidadas: (readonly [unknown, unknown, number])[];
  readonly agendados: string[];
}

function contexto(mundo: Mundo, pedido: Pedido = {}): {
  contexto: ContextoDaRecuperacao;
  registro: Registro;
} {
  const registro: Registro = { chavesValidadas: [], agendados: [] };
  const contexto: ContextoDaRecuperacao = {
    instante: () => mundo.agora,
    gerarSenha(comprimento) {
      mundo.sorteio += 1;
      return `s${mundo.sorteio}`.padEnd(comprimento, 'x');
    },
    resumirChave: (chave) => `resumo(${chave})`,
    validarChave(token, chave, prazo) {
      registro.chavesValidadas.push([token, chave, prazo]);
      return pedido.validarChave === undefined ? true : pedido.validarChave(token, chave, prazo);
    },
    verificarNonce: (acao, valor) => valor === `valido:${acao}`,
    constantes: {
      RECOVERY_MODE_COOKIE: 'wordpress_rec_abc',
      COOKIEPATH: '/',
      SITECOOKIEPATH: '/wp/',
      COOKIE_DOMAIN: false,
      WP_PLUGIN_DIR: '/srv/wp-content/plugins',
      ...pedido.constantes,
    },
    instalacao: {
      emRede: pedido.emRede ?? false,
      instalando: false,
      emManutencao: false,
      pastasDeTemas: ['/srv/wp-content/themes'],
      pluginsAtivosNaRede: () => ['/srv/wp-content/plugins/quebrado/quebrado.php'],
      tratadorSubstituto: false,
      telaDeErroSubstituta: false,
    },
    pedido: {
      ...(pedido.pagina === undefined ? {} : { pagina: pedido.pagina }),
      naAreaAdministrativa: pedido.painel ?? false,
      pedidoAjax: pedido.ajax ?? false,
      ...(pedido.acao === undefined ? {} : { acaoDoPedido: pedido.acao }),
      consulta: pedido.consulta ?? {},
      ...(pedido.cookie === undefined ? {} : { cookie: pedido.cookie }),
      cifrado: true,
      host: 'exemplo.test',
      caminho: '/wp-admin/plugins.php',
      cabecalhosEnviados: () => pedido.cabecalhosEnviados ?? false,
    },
    site: {
      enderecoDeEntrada: 'https://exemplo.test/wp-login.php',
      enderecoInicial: 'https://exemplo.test/',
      enderecoDaPagina: 'https://exemplo.test/wp-admin/plugins.php',
      enderecoDoPainel: 'https://exemplo.test/wp-admin/',
      referencia: pedido.referencia ?? false,
      conectado: true,
      nome: 'Loja &amp; Cia',
      emailDoAdministrador: 'admin@exemplo.test',
      versaoDoNucleo: '7.1.2',
      versaoDoPhp: '8.3.0',
    },
    extensoes: {
      plugins: () =>
        new Map([
          ['akismet/akismet.php', { Name: 'Akismet', Version: '5.3' }],
          ['quebrado/principal.php', { Name: 'Plugin Quebrado', Version: '1.0' }],
        ]),
      tema: (slug) => ({ existe: slug === 'tema-x', nomeExibido: 'Tema X' }),
      temaAtivo: { nome: 'Twenty Twenty-Five', versao: '1.2' },
      nomeBaseDoPlugin: (arquivo) => arquivo.replace('/srv/wp-content/plugins/', ''),
    },
    formatacao: {
      ehEmail: (valor) => valor.includes('@'),
      decodificarCaracteresEspeciais: (valor) => valor.replace(/&amp;/g, '&'),
      removerTodasAsTags: (valor) => valor.replace(/<[^>]*>/g, '').trim(),
      diferencaHumanaDeTempo: (de, ate) => `${Math.round(Math.abs(ate - de) / 3600)} horas`,
      acrescentarConsulta: (base, argumentos) => acrescentarConsultaComoNoPhp(base, argumentos),
    },
    agendamento: {
      proximo: () => false,
      agendar(_, recorrencia, evento) {
        registro.agendados.push(`${recorrencia}:${evento}`);
      },
    },
    ...(pedido.ganchos === undefined ? {} : { ganchos: pedido.ganchos }),
  };
  return { contexto, registro };
}

const ERRO_NO_PLUGIN: ErroFatal = {
  tipo: 1,
  mensagem: 'Uncaught Error: Call to undefined function quebrar()',
  arquivo: '/srv/wp-content/plugins/quebrado/inc/nucleo.php',
  linha: 42,
};

const ERRO_NO_TEMA: ErroFatal = {
  tipo: 4,
  mensagem: 'syntax error, unexpected end of file',
  arquivo: '/srv/wp-content/themes/tema-x/functions.php',
  linha: 7,
};

/** O estado de quem abriu o caminho: inicializa com o cookie que a area gravou. */
function emSessao(mundo: Mundo, recuperacao: AreaDeRecuperacao): {
  estado: EstadoDaRecuperacao;
  cookie: string;
} {
  const entrada = recuperacao.inicializar(
    contexto(mundo, {
      pagina: 'wp-login.php',
      consulta: { action: 'enter_recovery_mode', rm_token: 't', rm_key: 'k' },
    }).contexto,
  );
  assert.equal(entrada.resposta?.tipo, 'redirecionar');
  const cookie = entrada.resposta?.cookies[0]?.valor ?? '';
  const { estado } = recuperacao.inicializar(contexto(mundo, { cookie, painel: true }).contexto);
  assert.equal(estado.ativo, true);
  return { estado, cookie };
}

function valorPausado(mundo: Mundo, sessaoId: string): ValorPhp | undefined {
  return mundo.opcoes.get(`${sessaoId}_paused_extensions`);
}

const INATIVO_INICIALIZADO: EstadoDaRecuperacao = {
  inicializado: true,
  ativo: false,
  sessaoId: '',
};

// ── CA-12.1 ───────────────────────────────────────────────────────────────

test('CA-12.1: erro fatal no painel identifica o plugin, emite a chave e avisa quem administra', () => {
  const mundo = criarMundo();
  const recuperacao = area(mundo);
  const { contexto: ctx } = contexto(mundo, { painel: true });

  const desfecho = recuperacao.tratarErroFatal(ctx, INATIVO_INICIALIZADO, ERRO_NO_PLUGIN);

  // A chave: o token (1o sorteio) e a chave (2o), gravada resumida com o instante.
  const token = 's1'.padEnd(22, 'x');
  const chave = 's2'.padEnd(22, 'x');
  assert.deepEqual(
    mundo.opcoes.get('recovery_keys'),
    arranjo([
      {
        chave: { tipo: 'texto', valor: token },
        valor: arranjoPorNome([
          ['hashed_key', texto(`resumo(${chave})`)],
          ['created_at', inteiro(INICIO)],
        ]),
      },
    ]),
  );

  const [aviso, ...outros] = enviados(mundo);
  assert.equal(outros.length, 0, 'um aviso, e so um');
  assert.ok(aviso);
  assert.deepEqual(aviso.destinatarios, ['admin@exemplo.test']);
  assert.equal(aviso.assunto, '[Loja & Cia] Your Site is Experiencing a Technical Issue');
  assert.deepEqual(aviso.cabecalhos, []);
  assert.deepEqual(aviso.anexos, ['']);

  // O corpo inteiro, byte a byte: o plugin e achado pelo diretorio (nao ha
  // `quebrado/quebrado.php`, logo vale o primeiro arquivo do diretorio).
  const url = `https://exemplo.test/wp-login.php?action=enter_recovery_mode&rm_token=${token}&rm_key=${chave}`;
  assert.equal(
    aviso.corpo,
    `Howdy!

WordPress has a built-in feature that detects when a plugin or theme causes a fatal error on your site, and notifies you with this automated email.

In this case, WordPress caught an error with one of your plugins, Plugin Quebrado.

First, visit your website (https://exemplo.test/) and check for any visible issues. Next, visit the page where the error was caught (https://exemplo.test/wp-admin/plugins.php) and check for any visible issues.

Please contact your host for assistance with investigating this issue further.

If your site appears broken and you can't access your dashboard normally, WordPress now has a special "recovery mode". This lets you safely login to your dashboard and investigate further.

${url}

To keep your site safe, this link will expire in 24 horas. Don't worry about that, though: a new link will be emailed to you if the error occurs again after it expires.

When seeking help with this issue, you may be asked for some of the following information:
WordPress version 7.1.2\r
Active theme: Twenty Twenty-Five (version 1.2)\r
Current plugin: Plugin Quebrado (version 1.0)\r
PHP version 8.3.0



Error Details
=============
An error of type E_ERROR was caused in line 42 of the file /srv/wp-content/plugins/quebrado/inc/nucleo.php. Error message: Uncaught Error: Call to undefined function quebrar()`,
  );

  // A tela diz ao ator que ha instrucoes na caixa postal.
  assert.equal(desfecho.tipo, 'tela');
  if (desfecho.tipo === 'tela') {
    assert.equal(desfecho.tratado, true);
    assert.equal(desfecho.argumentos.response, 500);
    assert.ok(desfecho.erro.mensagem.startsWith(`<p>${MENSAGEM_DE_ERRO_COM_AVISO}</p>`));
  }
});

test('CA-12.1: erro no tema identifica o tema, e RECOVERY_MODE_EMAIL valida vence admin_email', () => {
  const mundo = criarMundo();
  const recuperacao = area(mundo);
  const { contexto: ctx } = contexto(mundo, {
    painel: true,
    constantes: { RECOVERY_MODE_EMAIL: 'plantao@exemplo.test' },
  });

  assert.equal(recuperacao.tratarErro(ctx, INATIVO_INICIALIZADO, ERRO_NO_TEMA), true);
  const [aviso] = enviados(mundo);
  assert.deepEqual(aviso?.destinatarios, ['plantao@exemplo.test']);
  assert.ok(aviso?.corpo.includes('\nIn this case, WordPress caught an error with your theme, Tema X.\n'));
  assert.ok(aviso?.corpo.includes('error of type E_PARSE'));

  // Declarada mas invalida, a constante cai para admin_email.
  const outroMundo = criarMundo();
  area(outroMundo).tratarErro(
    contexto(outroMundo, { painel: true, constantes: { RECOVERY_MODE_EMAIL: 'sem-arroba' } })
      .contexto,
    INATIVO_INICIALIZADO,
    ERRO_NO_TEMA,
  );
  assert.deepEqual(enviados(outroMundo)[0]?.destinatarios, ['admin@exemplo.test']);
});

test('CA-12.1: erro fora de plugin e de tema nao e da recuperacao (invalid_source)', () => {
  const mundo = criarMundo();
  const desfecho = area(mundo).tratarErro(
    contexto(mundo, { painel: true }).contexto,
    INATIVO_INICIALIZADO,
    { ...ERRO_NO_PLUGIN, arquivo: '/srv/wp-includes/post.php' },
  );
  assert.deepEqual(desfecho, {
    codigo: 'invalid_source',
    mensagem: 'Error not caused by a plugin or theme.',
  });
  assert.deepEqual(gravacoes(mundo), []);
  assert.deepEqual(enviados(mundo), []);
});

// ── CA-12.2 ───────────────────────────────────────────────────────────────

test('CA-12.2: abrir o caminho grava o cookie da sessao com o prazo declarado e volta para a entrada', () => {
  const mundo = criarMundo();
  const recuperacao = area(mundo);
  const { contexto: ctx, registro } = contexto(mundo, {
    pagina: 'wp-login.php',
    consulta: { action: 'enter_recovery_mode', rm_token: 'tok', rm_key: 'chave' },
  });

  const { estado, resposta } = recuperacao.inicializar(ctx);

  // A verificacao e de T027: e chamada com os dois valores e o prazo do link.
  assert.deepEqual(registro.chavesValidadas, [['tok', 'chave', DIA]]);
  assert.deepEqual(registro.agendados, ['daily:recovery_mode_clean_expired_keys']);
  assert.deepEqual(estado, INATIVO_INICIALIZADO);

  assert.equal(resposta?.tipo, 'redirecionar');
  if (resposta?.tipo !== 'redirecionar') return;
  assert.equal(resposta.url, 'https://exemplo.test/wp-login.php?action=entered_recovery_mode');
  assert.equal(resposta.seguro, false, 'wp_redirect(), nao wp_safe_redirect()');

  // Dois cookies, porque COOKIEPATH e SITECOOKIEPATH diferem; uma semana.
  assert.deepEqual(
    resposta.cookies.map((cookie) => [cookie.caminho, cookie.expiraEm, cookie.seguro, cookie.somenteHttp]),
    [
      ['/', INICIO + SEMANA, true, true],
      ['/wp/', INICIO + SEMANA, true, true],
    ],
  );

  // O formato: recovery_mode|iat|rand|hmac. O aleatorio (20 caracteres) e
  // sorteado ANTES da chave e do sal de assinatura, que vem depois.
  const partes = Buffer.from(resposta.cookies[0]?.valor ?? '', 'base64').toString('latin1').split('|');
  assert.equal(partes.length, 4);
  assert.deepEqual(partes.slice(0, 3), ['recovery_mode', String(INICIO), 's1'.padEnd(20, 'x')]);

  // Sem AUTH_KEY nem AUTH_SALT, a chave e o sal de assinatura sao gerados e gravados.
  assert.deepEqual(gravacoes(mundo), ['gravar:recovery_mode_auth_key', 'gravar:recovery_mode_auth_salt']);
});

test('CA-12.2: com o cookie, a requisicao seguinte esta numa sessao propria, identificada pelo sha1 do aleatorio', () => {
  const mundo = criarMundo();
  const recuperacao = area(mundo);
  const { estado, cookie } = emSessao(mundo, recuperacao);

  const aleatorio = Buffer.from(cookie, 'base64').toString('latin1').split('|')[2] ?? '';
  assert.deepEqual(estado, {
    inicializado: true,
    ativo: true,
    sessaoId: createHash('sha1').update(aleatorio).digest('hex'),
  });

  // Cada abertura do caminho e uma sessao nova.
  const outra = emSessao(mundo, recuperacao);
  assert.notEqual(outra.estado.sessaoId, estado.sessaoId);
});

test('CA-12.2: chave recusada nao cria sessao, e fora da tela de entrada o caminho nem e olhado', () => {
  const mundo = criarMundo();
  const recuperacao = area(mundo);
  const recusa: ErroDaRecuperacao = { codigo: 'hash_mismatch', mensagem: 'Invalid recovery key.' };

  const { resposta } = recuperacao.inicializar(
    contexto(mundo, {
      pagina: 'wp-login.php',
      consulta: { action: 'enter_recovery_mode', rm_token: 'tok', rm_key: 'errada' },
      validarChave: () => recusa,
    }).contexto,
  );
  assert.deepEqual(resposta, { tipo: 'morrer', conteudo: recusa, titulo: '', argumentos: {}, cookies: [] });

  // Os dois pontos do prazo disparam mesmo fora da tela de entrada: o
  // argumento de handle_begin_link() e avaliado antes da chamada.
  const disparos: string[] = [];
  const fora = contexto(mundo, {
    pagina: 'index.php',
    consulta: { action: 'enter_recovery_mode', rm_token: 'tok', rm_key: 'k' },
    ganchos: {
      aoLimitarAvisos: (limite) => (disparos.push('rate_limit'), limite),
      aoDefinirPrazoDoLink: (prazo) => (disparos.push('link_ttl'), prazo),
    },
  });
  assert.equal(recuperacao.inicializar(fora.contexto).resposta, null);
  assert.deepEqual(fora.registro.chavesValidadas, []);
  assert.deepEqual(disparos, ['rate_limit', 'link_ttl']);
});

test('CA-12.2: o prazo do link e o maior entre o limite e o ponto do prazo, e em rede nada inicializa', () => {
  const mundo = criarMundo();
  const recuperacao = area(mundo);
  const pedido = {
    pagina: 'wp-login.php',
    consulta: { action: 'enter_recovery_mode', rm_token: 'tok', rm_key: 'k' },
  };

  const curto = contexto(mundo, { ...pedido, ganchos: { aoDefinirPrazoDoLink: () => 60 } });
  recuperacao.inicializar(curto.contexto);
  assert.equal(curto.registro.chavesValidadas[0]?.[2], DIA, 'encurtar nao encurta');

  const longo = contexto(mundo, { ...pedido, ganchos: { aoLimitarAvisos: () => 2 * DIA } });
  recuperacao.inicializar(longo.contexto);
  assert.equal(longo.registro.chavesValidadas[0]?.[2], 2 * DIA, 'o limite puxa o prazo');

  const rede = contexto(mundo, { ...pedido, emRede: true });
  assert.deepEqual(recuperacao.inicializar(rede.contexto), {
    estado: RECUPERACAO_NAO_INICIALIZADA,
    resposta: null,
  });
  assert.deepEqual(rede.registro.agendados, []);
});

// ── CA-12.3 ───────────────────────────────────────────────────────────────

test('CA-12.3: dentro da sessao o erro pausa o plugin na opcao da sessao e repete a requisicao', () => {
  const mundo = criarMundo();
  const recuperacao = area(mundo);
  const { estado, cookie } = emSessao(mundo, recuperacao);

  const ctx = contexto(mundo, { cookie, painel: true }).contexto;
  const desfecho = recuperacao.tratarErroFatal(ctx, estado, ERRO_NO_PLUGIN);

  assert.deepEqual(desfecho, {
    tipo: 'encerrado',
    resposta: {
      tipo: 'redirecionar',
      url: 'https://exemplo.test/wp-admin/plugins.php',
      seguro: true,
      cookies: [],
    },
  });
  assert.deepEqual(
    valorPausado(mundo, estado.sessaoId),
    arranjoPorNome([
      [
        'plugin',
        arranjoPorNome([
          [
            'quebrado',
            arranjoPorNome([
              ['type', inteiro(1)],
              ['message', texto(ERRO_NO_PLUGIN.mensagem)],
              ['file', texto(ERRO_NO_PLUGIN.arquivo)],
              ['line', inteiro(42)],
            ]),
          ],
        ]),
      ],
    ]),
  );
  assert.deepEqual(enviados(mundo), [], 'dentro da sessao nao ha aviso');
});

test('CA-12.3: a pausa vale so para quem esta na sessao — o visitante carrega o plugin', () => {
  const mundo = criarMundo();
  const recuperacao = area(mundo);
  const { estado, cookie } = emSessao(mundo, recuperacao);
  recuperacao.tratarErro(contexto(mundo, { cookie, painel: true }).contexto, estado, ERRO_NO_PLUGIN);

  const ativos = [
    '/srv/wp-content/plugins/akismet/akismet.php',
    '/srv/wp-content/plugins/quebrado/principal.php',
  ];
  const ctx = contexto(mundo).contexto;

  const naSessao = recuperacao.pluginsQueCarregam(ctx, estado, ativos);
  assert.deepEqual(naSessao.carregam, ['/srv/wp-content/plugins/akismet/akismet.php']);
  assert.deepEqual([...naSessao.pausadas.keys()], ['quebrado']);

  // O visitante: sem cookie, sem sessao — e nenhuma leitura de pausa.
  const antes = mundo.linha.length;
  const visitante = recuperacao.pluginsQueCarregam(ctx, INATIVO_INICIALIZADO, ativos);
  assert.deepEqual(visitante.carregam, ativos);
  assert.equal(mundo.linha.length, antes);

  // Outra sessao tambem nao ve a pausa desta.
  const outra = emSessao(mundo, recuperacao);
  assert.deepEqual(recuperacao.pluginsQueCarregam(ctx, outra.estado, ativos).carregam, ativos);
});

test('CA-12.3: o mesmo erro de novo nao grava, e o tema pausado deixa a sessao sem tema', () => {
  const mundo = criarMundo();
  const recuperacao = area(mundo);
  const { estado, cookie } = emSessao(mundo, recuperacao);
  const ctx = contexto(mundo, { cookie, painel: true, cabecalhosEnviados: true }).contexto;

  recuperacao.tratarErro(ctx, estado, ERRO_NO_TEMA);
  const depoisDaPrimeira = gravacoes(mundo).length;
  // Cabecalhos ja enviados: `true`, sem redirecionar.
  assert.equal(recuperacao.tratarErro(ctx, estado, ERRO_NO_TEMA), true);
  assert.equal(gravacoes(mundo).length, depoisDaPrimeira, 'erro igual: nenhum comando');

  const temas = recuperacao.temasQueCarregam(estado, ['/srv/wp-content/themes/tema-x']);
  assert.deepEqual(temas.carregam, []);
  assert.equal(temas.semTemas, true);
});

test('CA-12.3: com os cabecalhos enviados a tela diz que o site entrou em recuperacao', () => {
  const mundo = criarMundo();
  const recuperacao = area(mundo);
  const { estado, cookie } = emSessao(mundo, recuperacao);
  const desfecho = recuperacao.tratarErroFatal(
    contexto(mundo, { cookie, painel: true, cabecalhosEnviados: true }).contexto,
    estado,
    ERRO_NO_PLUGIN,
  );
  assert.equal(desfecho.tipo, 'tela');
  if (desfecho.tipo === 'tela') {
    assert.ok(desfecho.erro.mensagem.startsWith(`<p>${MENSAGEM_DE_ERRO_EM_RECUPERACAO}</p>`));
  }
});

// ── CA-12.4 ───────────────────────────────────────────────────────────────

test('CA-12.4: erro fatal no site publico nao aciona a recuperacao', () => {
  const mundo = criarMundo();
  const recuperacao = area(mundo);
  const ctx = contexto(mundo, { pagina: 'index.php' }).contexto;

  assert.deepEqual(recuperacao.tratarErro(ctx, INATIVO_INICIALIZADO, ERRO_NO_PLUGIN), {
    codigo: 'non_protected_endpoint',
    mensagem: 'Error occurred on a non-protected endpoint.',
  });

  const desfecho: DesfechoDoErroFatal = recuperacao.tratarErroFatal(ctx, INATIVO_INICIALIZADO, ERRO_NO_PLUGIN);
  assert.equal(desfecho.tipo, 'tela');
  if (desfecho.tipo === 'tela') {
    assert.equal(desfecho.erro.mensagem.startsWith(`<p>${MENSAGEM_DE_ERRO_CRITICO}</p>`), true);
  }
  assert.deepEqual(gravacoes(mundo), [], 'nem marcador, nem chave');
  assert.deepEqual(enviados(mundo), []);
});

test('CA-12.4: entrada, painel e as nove acoes de Ajax sao protegidas; o resto so pelo ponto de extensao', () => {
  const protegido = (pedido: Pedido): boolean => {
    const mundo = criarMundo();
    const desfecho = area(mundo).tratarErro(contexto(mundo, pedido).contexto, INATIVO_INICIALIZADO, ERRO_NO_PLUGIN);
    return desfecho === true;
  };

  assert.equal(protegido({ pagina: 'wp-login.php' }), true);
  assert.equal(protegido({ painel: true }), true);
  assert.equal(protegido({ painel: true, ajax: true, acao: 'heartbeat' }), true);
  assert.equal(protegido({ painel: true, ajax: true, acao: 'query-attachments' }), false);
  assert.equal(protegido({ painel: true, ajax: true, acao: ['heartbeat'] }), false, 'in_array estrito');
  assert.equal(
    protegido({ pagina: 'index.php', ganchos: { aoPerguntarSeEndpointProtegido: () => 1 } }),
    true,
  );
  // O ponto so e consultado quando as tres areas falham: nao desprotege o painel.
  assert.equal(protegido({ painel: true, ganchos: { aoPerguntarSeEndpointProtegido: () => false } }), true);
});

test('CA-12.4: em rede o erro nao chega a recuperacao, e plugin de rede por caminho absoluto nao e reconhecido', () => {
  const mundo = criarMundo();
  const recuperacao = area(mundo);
  const desfecho = recuperacao.tratarErroFatal(
    contexto(mundo, { painel: true, emRede: true }).contexto,
    INATIVO_INICIALIZADO,
    ERRO_NO_PLUGIN,
  );
  assert.equal(desfecho.tipo, 'tela');
  if (desfecho.tipo === 'tela') assert.equal(desfecho.tratado, false);
  assert.deepEqual(enviados(mundo), []);

  // `is_network_plugin()` compara `quebrado/` com caminho absoluto: nunca casa.
  const direto = recuperacao.tratarErro(
    contexto(mundo, { painel: true, emRede: true }).contexto,
    INATIVO_INICIALIZADO,
    { ...ERRO_NO_PLUGIN, arquivo: '/srv/wp-content/plugins/quebrado/quebrado.php' },
  );
  assert.equal(direto, true);
});

// ── CA-12.5 ───────────────────────────────────────────────────────────────

test('CA-12.5: sair retoma plugins e temas de uma vez e zera o limite de avisos', () => {
  const mundo = criarMundo();
  const recuperacao = area(mundo);
  // Um aviso ja foi mandado: o marcador existe.
  recuperacao.tratarErro(contexto(mundo, { painel: true }).contexto, INATIVO_INICIALIZADO, ERRO_NO_PLUGIN);
  const { estado, cookie } = emSessao(mundo, recuperacao);
  const naSessao = contexto(mundo, { cookie, painel: true, cabecalhosEnviados: true }).contexto;
  recuperacao.tratarErro(naSessao, estado, ERRO_NO_PLUGIN);
  recuperacao.tratarErro(naSessao, estado, ERRO_NO_TEMA);
  recuperacao.tratarErro(naSessao, estado, {
    ...ERRO_NO_PLUGIN,
    arquivo: '/srv/wp-content/plugins/akismet/akismet.php',
  });

  const inicio = mundo.linha.length;
  const saida = recuperacao.sair(contexto(mundo, { cookie }).contexto, estado);

  assert.equal(saida.saiu, true);
  assert.deepEqual(
    mundo.linha.slice(inicio).flatMap((evento) =>
      evento.acao === 'gravar' || evento.acao === 'apagar' ? [`${evento.acao}:${evento.nome}`] : [],
    ),
    [
      'apagar:recovery_mode_email_last_sent',
      // `delete_all()` dos plugins: sobra o tema, logo REGRAVA...
      `gravar:${estado.sessaoId}_paused_extensions`,
      // ...e o dos temas esvazia, logo APAGA.
      `apagar:${estado.sessaoId}_paused_extensions`,
    ],
  );
  assert.equal(valorPausado(mundo, estado.sessaoId), undefined);
  assert.equal(mundo.opcoes.has('recovery_mode_email_last_sent'), false);

  // O cookie e apagado nos dois caminhos, um ano no passado, sem secure/httponly.
  assert.deepEqual(saida.cookies, [
    cookieApagado('/'),
    cookieApagado('/wp/'),
  ]);

  // Com o limite zerado, o proximo erro avisa na hora.
  const antes = enviados(mundo).length;
  recuperacao.tratarErro(contexto(mundo, { painel: true }).contexto, INATIVO_INICIALIZADO, ERRO_NO_PLUGIN);
  assert.equal(enviados(mundo).length, antes + 1);
});

function cookieApagado(caminho: string): InstrucaoDeCookie {
  return {
    nome: 'wordpress_rec_abc',
    valor: ' ',
    expiraEm: INICIO - SEGUNDOS_POR_ANO,
    caminho,
    dominio: false,
    seguro: false,
    somenteHttp: false,
  };
}

test('CA-12.5: a tela de saida exige o token, e fora da sessao so redireciona', () => {
  const mundo = criarMundo();
  const recuperacao = area(mundo);
  const { estado, cookie } = emSessao(mundo, recuperacao);
  const pedido = (wpnonce: string): Pedido => ({
    cookie,
    pagina: 'wp-login.php',
    consulta: { action: 'exit_recovery_mode', _wpnonce: wpnonce },
    referencia: 'https://exemplo.test/wp-admin/plugins.php',
  });

  assert.deepEqual(recuperacao.atenderSaida(contexto(mundo, pedido('velho')).contexto, estado), {
    tipo: 'morrer',
    conteudo: MENSAGEM_DE_LINK_DE_SAIDA_VENCIDO,
    titulo: '',
    argumentos: { response: 403 },
    cookies: [],
  });

  const ok = recuperacao.atenderSaida(contexto(mundo, pedido('valido:exit_recovery_mode')).contexto, estado);
  assert.equal(ok?.tipo, 'redirecionar');
  assert.equal(ok?.tipo === 'redirecionar' ? ok.url : '', 'https://exemplo.test/wp-admin/plugins.php');
  assert.equal(ok?.cookies.length, 2);

  // Sem referencia e conectado: o painel. Fora da sessao nada e apagado.
  const antes = gravacoes(mundo).length;
  assert.deepEqual(
    recuperacao.atenderSaida(contexto(mundo, { consulta: { action: 'exit_recovery_mode' } }).contexto, INATIVO_INICIALIZADO),
    { tipo: 'redirecionar', url: 'https://exemplo.test/wp-admin/', seguro: true, cookies: [] },
  );
  assert.equal(gravacoes(mundo).length, antes);
  assert.equal(PERMISSOES_DA_RECUPERACAO['sair-da-recuperacao'].capacidade, null);
});

// ── CA-12.6 ───────────────────────────────────────────────────────────────

test('CA-12.6: o marcador e gravado antes da chave e antes do envio', () => {
  const mundo = criarMundo();
  area(mundo).tratarErro(contexto(mundo, { painel: true }).contexto, INATIVO_INICIALIZADO, ERRO_NO_PLUGIN);

  const ordem = mundo.linha.flatMap((evento) =>
    evento.acao === 'gravar' ? [`gravar:${evento.nome}`] : evento.acao === 'enviar' ? ['enviar'] : [],
  );
  assert.deepEqual(ordem, ['gravar:recovery_mode_email_last_sent', 'gravar:recovery_keys', 'enviar']);
  assert.deepEqual(mundo.opcoes.get('recovery_mode_email_last_sent'), inteiro(INICIO));
});

test('CA-12.6: um aviso por dia — dentro do limite nao envia nem grava, e no instante seguinte envia', () => {
  const mundo = criarMundo();
  const recuperacao = area(mundo);
  const avisar = () =>
    recuperacao.tratarErro(contexto(mundo, { painel: true }).contexto, INATIVO_INICIALIZADO, ERRO_NO_PLUGIN);

  assert.equal(avisar(), true);
  const depoisDoPrimeiro = gravacoes(mundo).length;

  mundo.agora = INICIO + DIA; // no ultimo instante do limite: `time() > last + limit` e falso
  const repetido = avisar();
  assert.equal(typeof repetido === 'object' && 'codigo' in repetido ? repetido.codigo : '', 'email_sent_already');
  assert.equal(
    typeof repetido === 'object' && 'mensagem' in repetido ? repetido.mensagem : '',
    'A recovery link was already sent 24 horas ago. Please wait another 0 horas before requesting a new email.',
  );
  assert.equal(enviados(mundo).length, 1);
  assert.equal(gravacoes(mundo).length, depoisDoPrimeiro);

  mundo.agora = INICIO + DIA + 1;
  assert.equal(avisar(), true);
  assert.equal(enviados(mundo).length, 2);
});

test('CA-12.6: falhar em gravar o marcador e nao avisar — nem chave, nem e-mail', () => {
  const mundo = criarMundo();
  mundo.falhaAoGravar.add('recovery_mode_email_last_sent');

  const desfecho = area(mundo).tratarErro(contexto(mundo, { painel: true }).contexto, INATIVO_INICIALIZADO, ERRO_NO_PLUGIN);

  assert.deepEqual(desfecho, {
    codigo: 'storage_error',
    mensagem: 'Could not update the email last sent time.',
  });
  assert.deepEqual(enviados(mundo), []);
  assert.equal(mundo.opcoes.has('recovery_keys'), false);
});

test('CA-12.6: o envio que falha deixa o marcador gravado — o aviso do dia esta perdido', () => {
  const mundo = criarMundo();
  mundo.envioFalha = true;
  const recuperacao = area(mundo);
  const avisar = () =>
    recuperacao.tratarErro(contexto(mundo, { painel: true }).contexto, INATIVO_INICIALIZADO, ERRO_NO_PLUGIN);

  assert.deepEqual(avisar(), {
    codigo: 'email_failed',
    mensagem: 'The email could not be sent. Possible reason: your host may have disabled the mail() function.',
  });
  mundo.envioFalha = false;
  mundo.agora = INICIO + 3600;
  const segundo = avisar();
  assert.equal(typeof segundo === 'object' && 'codigo' in segundo ? segundo.codigo : '', 'email_sent_already');
  assert.equal(enviados(mundo).length, 1, 'so a tentativa que falhou');
});

// ── CA-12.7 ───────────────────────────────────────────────────────────────

/** O papel de administracao de fabrica, nas capacidades que importam aqui (`schema.php`, `populate_roles()`). */
const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'administrator',
    capacidades: ['activate_plugins', 'switch_themes', 'edit_plugins', 'manage_options'].map(
      (capacidade) => ({ capacidade, concedida: true }),
    ),
  },
  {
    identificador: 'editor',
    capacidades: ['edit_posts', 'moderate_comments'].map((capacidade) => ({ capacidade, concedida: true })),
  },
];

function autorizacao(papel: string, extra: Partial<ContextoDeAutorizacao> = {}): ContextoDeAutorizacao {
  const ator: AtorDeAutorizacao = {
    contaId: 1,
    login: papel,
    existe: true,
    concessoes: [{ capacidade: papel, concedida: true }],
  };
  return { matriz: MATRIZ, rede: REDE_INATIVA_NA_AUTORIZACAO, ator, ...extra };
}

test('CA-12.7: numa instalacao de fabrica o administrador retoma plugin e tema pausados', () => {
  assert.equal(perguntarNaRecuperacao(autorizacao('administrator'), CAPACIDADE_DE_RETOMAR_PLUGIN, 'quebrado/principal.php'), true);
  assert.equal(perguntarNaRecuperacao(autorizacao('administrator'), CAPACIDADE_DE_RETOMAR_TEMA, 'tema-x'), true);
  assert.equal(perguntarNaRecuperacao(autorizacao('editor'), CAPACIDADE_DE_RETOMAR_PLUGIN, 'quebrado/principal.php'), false);
});

test('CA-12.7: a capacidade vem da concessao, nao do papel — sem ela, ninguem retoma', () => {
  // Nenhum papel tem `resume_plugins`; tirada a concessao de prioridade 1, a
  // pergunta e negada ate ao administrador. E o sistema que UC-36 descreve
  // para quem migra pela matriz.
  assert.equal(
    MATRIZ.some((papel) => papel.capacidades.some((item) => item.capacidade === 'resume_plugins')),
    false,
  );
  assert.equal(
    perguntarNaRecuperacao(autorizacao('administrator', { concessoesPorExtensao: [] }), CAPACIDADE_DE_RETOMAR_PLUGIN),
    false,
  );
});

// ── A10: a semana ─────────────────────────────────────────────────────────

test('A10: a sessao vale uma semana; no instante seguinte o cookie e recusado, apagado, e a pausa fica orfa', () => {
  const mundo = criarMundo();
  const recuperacao = area(mundo);
  const { estado, cookie } = emSessao(mundo, recuperacao);
  recuperacao.tratarErro(
    contexto(mundo, { cookie, painel: true, cabecalhosEnviados: true }).contexto,
    estado,
    ERRO_NO_PLUGIN,
  );

  mundo.agora = INICIO + SEMANA;
  assert.equal(recuperacao.inicializar(contexto(mundo, { cookie }).contexto).estado.ativo, true);

  mundo.agora = INICIO + SEMANA + 1;
  const antes = gravacoes(mundo).length;
  const vencido = recuperacao.inicializar(contexto(mundo, { cookie }).contexto);
  assert.equal(vencido.estado.ativo, false);
  assert.deepEqual(vencido.resposta, {
    tipo: 'morrer',
    conteudo: { codigo: 'expired', mensagem: 'Cookie expired.', dado: { status: 403 } },
    titulo: '',
    argumentos: {},
    cookies: [
      { ...cookieApagado('/'), expiraEm: INICIO + SEMANA + 1 - SEGUNDOS_POR_ANO },
      { ...cookieApagado('/wp/'), expiraEm: INICIO + SEMANA + 1 - SEGUNDOS_POR_ANO },
    ],
  });
  assert.equal(gravacoes(mundo).length, antes, 'vencer nao apaga nada');
  assert.ok(valorPausado(mundo, estado.sessaoId), 'a opcao da sessao vencida continua la');

  // O prazo e lido na validacao: alonga-lo revive o cookie.
  const revivido = recuperacao.inicializar(
    contexto(mundo, { cookie, ganchos: { aoDefinirPrazoDoCookie: () => SEMANA + 10 } }).contexto,
  );
  assert.equal(revivido.estado.ativo, true);
});

test('A10: cookie adulterado e recusado pela assinatura, e com menos de quatro partes pelo formato', () => {
  const mundo = criarMundo();
  const recuperacao = area(mundo);
  const { cookie } = emSessao(mundo, recuperacao);
  const partes = Buffer.from(cookie, 'base64').toString('latin1').split('|');
  const adulterado = Buffer.from([partes[0], partes[1], 'outro-aleatorio', partes[3]].join('|'), 'latin1').toString('base64');

  const codigo = (valor: string): string => {
    const { resposta } = recuperacao.inicializar(contexto(mundo, { cookie: valor }).contexto);
    return resposta?.tipo === 'morrer' && typeof resposta.conteudo !== 'string' ? resposta.conteudo.codigo : '';
  };
  assert.equal(codigo(adulterado), 'signature_mismatch');
  assert.equal(codigo(Buffer.from('recovery_mode|1|2').toString('base64')), 'invalid_format');
  assert.equal(codigo(Buffer.from('recovery_mode|ontem|2|3').toString('base64')), 'invalid_created_at');
  // A constante liga o modo sem cookie e sem chave.
  const declarada = recuperacao.inicializar(
    contexto(mundo, { constantes: { WP_RECOVERY_MODE_SESSION_ID: 'manual' } }).contexto,
  );
  assert.deepEqual(declarada.estado, { inicializado: true, ativo: true, sessaoId: 'manual' });
});
