/**
 * Testes da entrega de **T001**: *"o modulo carrega com as portas de dados, de
 * relogio, de envio de e-mail e de sistema de arquivos declaradas, e o registro
 * de provedores de dado pessoal vazio e inspecionavel"*.
 *
 * Nao sao os testes de nenhuma historia — esses sao T004, T006, T008 e os demais
 * `[P]` de `tasks.md`, um por caso de `backlog/tests.md`. Aqui se afirma so o que
 * T001 entrega, mais as duas invariantes de arquitetura que um esqueleto pode
 * quebrar em silencio: estado de modulo (`EXT-CONTEXTO`) e trabalho no
 * carregamento (`EXT-ORDEM`).
 *
 * **Nao ha teste de prazo aqui, e isso e de proposito.** O P6 pede, para cada
 * numero, *"o valor e o efeito da borda (no ultimo instante aceita, um instante
 * depois recusa)"* — e T001 nao declara numero nenhum: os tres prazos desta
 * feature entram com as tarefas que os aplicam (T005, T009, T015), com as
 * ancoras ja anotadas em `portas/porta-de-relogio.ts`. Afirmar borda aqui exigiria
 * inventar o numero antes da tarefa dele.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarModuloDePrivacidade,
  criarRegistroDeProvedores,
  type ApagadorDeDadoPessoal,
  type Consulta,
  type ExportadorDeDadoPessoal,
  type LeituraDeArquivo,
  type MensagemDeEmail,
  type OperacaoDeArquivo,
  type PortaDeDados,
  type PortaDeEmail,
  type PortaDeRelogio,
  type PortaDeSistemaDeArquivos,
  type PortasDePrivacidade,
  type ResultadoDeEnvio,
  type ResultadoDeEscrita,
} from './index.js';

/** Conta os toques em cada porta, para afirmar que o modulo nao as usa ainda. */
interface Toques {
  selecionar: Consulta[];
  escrever: Consulta[];
  enviar: MensagemDeEmail[];
  apagar: string[];
  listar: string[];
  relogio: number;
}

interface OpcoesDasPortasDeTeste {
  readonly prefixoDeTabela?: string;
  readonly raizDeExportacoes?: string;
  readonly resultadoDeEnvio?: ResultadoDeEnvio;
  readonly resultadoDeApagar?: OperacaoDeArquivo;
  readonly instanteDeModificacao?: LeituraDeArquivo<number>;
}

function portasDeTeste(opcoes: OpcoesDasPortasDeTeste = {}): {
  portas: PortasDePrivacidade;
  toques: Toques;
} {
  const toques: Toques = {
    selecionar: [],
    escrever: [],
    enviar: [],
    apagar: [],
    listar: [],
    relogio: 0,
  };

  const dados: PortaDeDados = {
    prefixoDeTabela: opcoes.prefixoDeTabela ?? 'wp_',
    selecionar(consulta) {
      toques.selecionar.push(consulta);
      return [];
    },
    escrever(consulta): ResultadoDeEscrita {
      toques.escrever.push(consulta);
      return { linhasAfetadas: 0, idGerado: null };
    },
  };

  const relogio: PortaDeRelogio = {
    agoraEmSegundos() {
      toques.relogio += 1;
      return 0;
    },
  };

  const email: PortaDeEmail = {
    enviar(mensagem) {
      toques.enviar.push(mensagem);
      return opcoes.resultadoDeEnvio ?? { enviado: true };
    },
  };

  const raiz =
    opcoes.raizDeExportacoes ??
    '/var/www/wp-content/uploads/wp-personal-data-exports/';

  const sistemaDeArquivos: PortaDeSistemaDeArquivos = {
    raizDeExportacoes: raiz,
    enderecoDeExportacoes:
      'https://exemplo.invalido/wp-content/uploads/wp-personal-data-exports/',
    existe() {
      return false;
    },
    ehPasta() {
      return true;
    },
    criarPasta() {
      return { concluido: true };
    },
    escrever() {
      return { concluido: true };
    },
    apagar(caminho) {
      toques.apagar.push(caminho);
      return opcoes.resultadoDeApagar ?? { concluido: true };
    },
    listar(pasta) {
      toques.listar.push(pasta);
      return { concluido: true, valor: [] };
    },
    instanteDeModificacaoEmSegundos() {
      return opcoes.instanteDeModificacao ?? { concluido: true, valor: 0 };
    },
  };

  return {
    portas: { dados, relogio, email, sistemaDeArquivos },
    toques,
  };
}

/** Um exportador de mentira, que registra as paginas pedidas. */
function exportadorDeTeste(
  nomeAmigavel: string,
  paginas: string[] = [],
): ExportadorDeDadoPessoal {
  return {
    nomeAmigavel,
    exportar(enderecoDeEmail, pagina) {
      paginas.push(`${enderecoDeEmail}#${String(pagina)}`);
      return { falhou: false, dados: [], terminou: true };
    },
  };
}

/** Um apagador de mentira, com a forma booleana que o legado devolve. */
function apagadorDeTeste(nomeAmigavel: string): ApagadorDeDadoPessoal {
  return {
    nomeAmigavel,
    apagar() {
      return {
        falhou: false,
        itensRemovidos: false,
        itensRetidos: false,
        mensagens: [],
        terminou: true,
      };
    },
  };
}

test('o modulo carrega com as quatro portas declaradas', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDePrivacidade(portas);

  assert.equal(modulo.nome, 'privacidade');
  assert.equal(modulo.portas.dados, portas.dados);
  assert.equal(modulo.portas.relogio, portas.relogio);
  assert.equal(modulo.portas.email, portas.email);
  assert.equal(modulo.portas.sistemaDeArquivos, portas.sistemaDeArquivos);
});

test('a superficie do modulo tem exatamente o que T001 entrega', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDePrivacidade(portas);

  // Esta lista cresce NA TAREFA DE CADA HISTORIA, nunca antes: e o que o P4 da
  // constituicao cobra, "toda operacao exposta nova nasce com declaracao
  // explicita de permissao". T001 nao expoe operacao nenhuma — so as portas e o
  // registro. A tabela de quem entra, com a permissao de cada uma ja lida dos
  // casos de uso, esta no comentario de `ModuloDePrivacidade`.
  assert.deepEqual(Object.keys(modulo).sort(), ['nome', 'portas', 'provedores']);
});

test('criar o modulo nao toca em porta nenhuma (EXT-ORDEM: nada se resolve no carregamento)', () => {
  const { portas, toques } = portasDeTeste();

  criarModuloDePrivacidade(portas);

  assert.deepEqual(toques.selecionar, []);
  assert.deepEqual(toques.escrever, []);
  assert.deepEqual(toques.enviar, []);
  assert.deepEqual(toques.apagar, []);
  assert.deepEqual(toques.listar, []);
  assert.equal(toques.relogio, 0);
});

test('o registro de provedores nasce vazio e inspecionavel', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDePrivacidade(portas);

  // Vazio e o estado inicial do legado, nao uma pendencia: as quatro leituras do
  // registro passam `array()` como valor inicial do filtro
  // (`wp-admin/includes/ajax-actions.php:5047` e `:5238`,
  // `wp-admin/includes/privacy-tools.php:822` e `:955`).
  assert.deepEqual(modulo.provedores.exportadores(), []);
  assert.deepEqual(modulo.provedores.apagadores(), []);
  assert.equal(modulo.provedores.obterExportador('wordpress-user'), null);
  assert.equal(modulo.provedores.obterApagador('wordpress-comments'), null);
});

test('duas composicoes nao compartilham portas nem registro (EXT-CONTEXTO, BR-MIGRAR-105)', () => {
  const primeira = portasDeTeste({ prefixoDeTabela: 'wp_' });
  const segunda = portasDeTeste({ prefixoDeTabela: 'wp_2_' });

  const moduloA = criarModuloDePrivacidade(primeira.portas);
  const moduloB = criarModuloDePrivacidade(segunda.portas);

  assert.notEqual(moduloA, moduloB);
  assert.equal(moduloA.portas.dados.prefixoDeTabela, 'wp_');
  assert.equal(moduloB.portas.dados.prefixoDeTabela, 'wp_2_');
  assert.notEqual(moduloA.provedores, moduloB.provedores);

  moduloA.provedores.registrarExportador(
    'wordpress-user',
    exportadorDeTeste('WordPress User'),
  );

  // O cenario @concorrencia de PT-012 tem tolerancia zero aqui: "nenhum arquivo
  // de exportacao contem dado do outro titular". Se o registro fosse estado de
  // modulo, o provedor de uma composicao apareceria na outra.
  assert.deepEqual(
    moduloA.provedores.exportadores().map((entrada) => entrada.chave),
    ['wordpress-user'],
  );
  assert.deepEqual(moduloB.provedores.exportadores(), []);

  moduloA.portas.dados.selecionar({ texto: 'SELECT 1', parametros: [] });
  assert.equal(primeira.toques.selecionar.length, 1);
  assert.equal(segunda.toques.selecionar.length, 0);
});

test('o registro devolve os exportadores na ordem de insercao', () => {
  const registro = criarRegistroDeProvedores();

  // A ordem efetiva do legado, que NAO e a ordem das linhas de
  // `wp-includes/default-filters.php:455` a `:457`: a de conta e registrada com
  // prioridade 1 e por isso entra primeiro. Ver o cabecalho de
  // `registro/registro-de-provedores.ts`.
  registro.registrarExportador(
    'wordpress-user',
    exportadorDeTeste('WordPress User'),
  );
  registro.registrarExportador(
    'wordpress-comments',
    exportadorDeTeste('WordPress Comments'),
  );
  registro.registrarExportador(
    'wordpress-media',
    exportadorDeTeste('WordPress Media'),
  );

  assert.deepEqual(
    registro.exportadores().map((entrada) => entrada.chave),
    ['wordpress-user', 'wordpress-comments', 'wordpress-media'],
  );
  // A contagem que o legado compara com o indice para saber se chegou ao ultimo
  // (`count( $exporters ) === $exporter_index`).
  assert.equal(registro.exportadores().length, 3);
});

test('chave repetida substitui o provedor e mantem a posicao, como o array do PHP', () => {
  const registro = criarRegistroDeProvedores();

  registro.registrarExportador(
    'wordpress-user',
    exportadorDeTeste('WordPress User'),
  );
  registro.registrarExportador(
    'wordpress-comments',
    exportadorDeTeste('WordPress Comments'),
  );

  const substituto = exportadorDeTeste('Exportador de extensao');
  registro.registrarExportador('wordpress-user', substituto);

  // `$exporters['wordpress-user'] = array( ... )` nao recusa e nao avisa: e
  // assim que uma extensao troca o exportador de conta do nucleo.
  assert.equal(registro.obterExportador('wordpress-user'), substituto);
  assert.deepEqual(
    registro.exportadores().map((entrada) => entrada.chave),
    ['wordpress-user', 'wordpress-comments'],
  );
  assert.equal(registro.exportadores().length, 2);
});

test('exportadores e apagadores sao dois registros independentes, como os dois filtros', () => {
  const registro = criarRegistroDeProvedores();

  registro.registrarExportador(
    'wordpress-comments',
    exportadorDeTeste('WordPress Comments'),
  );
  registro.registrarApagador(
    'wordpress-comments',
    apagadorDeTeste('WordPress Comments'),
  );

  // A mesma chave nos dois lados nao e colisao: no legado sao `$exporters` e
  // `$erasers`, de filtros diferentes. De fabrica sao tres exportadores e UM
  // apagador, e a contagem de um nao diz nada sobre a do outro.
  assert.equal(registro.exportadores().length, 1);
  assert.equal(registro.apagadores().length, 1);
  assert.notEqual(
    registro.obterExportador('wordpress-comments'),
    registro.obterApagador('wordpress-comments'),
  );
  assert.equal(registro.obterApagador('wordpress-media'), null);
});

test('compor com um registro informado usa aquele registro, e nao um vazio', () => {
  const { portas } = portasDeTeste();
  const registro = criarRegistroDeProvedores();
  registro.registrarApagador(
    'wordpress-comments',
    apagadorDeTeste('WordPress Comments'),
  );

  const modulo = criarModuloDePrivacidade(portas, registro);

  // E por este argumento que os provedores dos outros contextos chegam: a regra
  // de dependencia 3 de `target_architecture.md` proibe que eles entrem por
  // `import`.
  assert.equal(modulo.provedores, registro);
  assert.equal(modulo.provedores.apagadores().length, 1);
});

test('o provedor devolve a falha como valor, sem lancar (AD-06)', () => {
  const registro = criarRegistroDeProvedores();
  registro.registrarExportador('provedor-que-falha', {
    nomeAmigavel: 'Provedor que falha',
    exportar() {
      return { falhou: true, mensagem: 'origem indisponivel' };
    },
  });

  const exportador = registro.obterExportador('provedor-que-falha');
  assert.notEqual(exportador, null);

  // 🔴 O que o legado FAZ com esta falha contradiz CA-5.3 — o laco do navegador
  // para em `wp-admin/js/privacy-tools.js:135` a `:138`. A divergencia esta no
  // README; o que T001 fixa e so que a falha atravessa como VALOR, que e o que
  // AD-06 e o cenario @invariante de PT-012 exigem.
  assert.deepEqual(exportador?.exportar('titular@exemplo.invalido', 1), {
    falhou: true,
    mensagem: 'origem indisponivel',
  });
});

test('o exportador recebe o e-mail e a pagina, com a pagina comecando em 1', () => {
  const paginas: string[] = [];
  const registro = criarRegistroDeProvedores();
  registro.registrarExportador(
    'wordpress-user',
    exportadorDeTeste('WordPress User', paginas),
  );

  const exportador = registro.obterExportador('wordpress-user');
  exportador?.exportar('titular@exemplo.invalido', 1);
  exportador?.exportar('titular@exemplo.invalido', 2);

  // Os dois argumentos de `call_user_func( $callback, $email_address, $page )`
  // (`wp-admin/includes/ajax-actions.php:5102`), nesta ordem, e o laco abrindo
  // em 1 (`wp-admin/js/privacy-tools.js:159`).
  assert.deepEqual(paginas, [
    'titular@exemplo.invalido#1',
    'titular@exemplo.invalido#2',
  ]);
});

test('a porta de e-mail devolve a falha como valor, sem lancar (D3, BR-MIGRAR-040)', () => {
  const { portas } = portasDeTeste({
    resultadoDeEnvio: { enviado: false, motivo: 'transporte indisponivel' },
  });

  const modulo = criarModuloDePrivacidade(portas);

  // O modulo entrega a porta sem envolve-la: nada entre o chamador e o
  // transporte pode transformar este estado em excecao. O cenario @invariante de
  // PT-012 cobra que "nenhuma das duas lanca excecao que interrompa o fluxo".
  const resultado = modulo.portas.email.enviar({
    destinatarios: ['titular@exemplo.invalido'],
    assunto: '',
    corpo: '',
    cabecalhos: [],
    anexos: [],
  });

  assert.deepEqual(resultado, {
    enviado: false,
    motivo: 'transporte indisponivel',
  });
});

test('a porta de sistema de arquivos devolve a falha como valor, nas duas formas', () => {
  const { portas, toques } = portasDeTeste({
    resultadoDeApagar: { concluido: false, mensagem: 'permissao negada' },
    instanteDeModificacao: { concluido: false, mensagem: 'nao foi possivel ler' },
  });

  const modulo = criarModuloDePrivacidade(portas);
  const caminho = `${modulo.portas.sistemaDeArquivos.raizDeExportacoes}wp-personal-data-file-abc.zip`;

  assert.deepEqual(modulo.portas.sistemaDeArquivos.apagar(caminho), {
    concluido: false,
    mensagem: 'permissao negada',
  });
  assert.deepEqual(toques.apagar, [caminho]);

  // A falha do instante de modificacao precisa ser DISTINGUIVEL de zero: no
  // legado `filemtime()` devolve `false`, `false` vale `0` na subtracao, e o
  // arquivo acaba apagado. Quem portar T015 escolhe reproduzir isso citando a
  // linha, e nao por acidente de tipo.
  assert.deepEqual(
    modulo.portas.sistemaDeArquivos.instanteDeModificacaoEmSegundos(caminho),
    { concluido: false, mensagem: 'nao foi possivel ler' },
  );
});

test('a raiz e o endereco das exportacoes sao fatos da borda, e saem da mesma origem', () => {
  const { portas } = portasDeTeste({
    raizDeExportacoes: '/srv/site/wp-content/uploads/wp-personal-data-exports/',
  });

  const modulo = criarModuloDePrivacidade(portas);

  // `wp_privacy_exports_dir()` e `wp_privacy_exports_url()` saem da mesma
  // chamada a `wp_upload_dir()` (`wp-includes/functions.php:8507` e `:8532`), e o
  // nome do diretorio e parte do endereco observavel: e por ele que CA-5.4
  // entrega o arquivo ao titular.
  assert.ok(
    modulo.portas.sistemaDeArquivos.raizDeExportacoes.endsWith(
      'wp-personal-data-exports/',
    ),
  );
  assert.ok(
    modulo.portas.sistemaDeArquivos.enderecoDeExportacoes.endsWith(
      'wp-personal-data-exports/',
    ),
  );
});
