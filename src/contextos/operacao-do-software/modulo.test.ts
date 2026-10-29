/**
 * Testes da entrega de T001: *"o modulo carrega com as portas de sistema de
 * arquivos, de cliente externo, de dados e de envio de e-mail declaradas, e
 * nenhuma delas implementada alem da variante local"*.
 *
 * Nao sao os testes de nenhuma historia — esses sao T004, T006, T008 e os demais
 * `[P]` de `tasks.md`, um por caso de `../../../backlog/tests.md`. Aqui se afirma
 * so o que T001 entrega, mais as duas invariantes de arquitetura que um esqueleto
 * pode quebrar em silencio: estado de modulo (`EXT-CONTEXTO`) e trabalho no
 * carregamento (`EXT-ORDEM`).
 *
 * As portas sao compostas por **duplo que registra comando** em vez de duplo que
 * simula disco, rede ou caixa postal. Nao e preferencia de estilo: o criterio de
 * aceite desta area e *"efeito no banco + comportamento de caso de uso"*
 * (`parity_specs.md`, area da Decisao 2 de PT-013), e o cenario `@composicao`
 * dos testes de paridade pede a porta *"substituida por duplo que registra cada
 * operacao"*. Um disco de mentira esconderia justamente o caso em que o legado
 * **nao emite comando nenhum** — que e o que os dois testes de `EXT-ORDEM`
 * afirmam.
 *
 * **Nenhum valor de fabrica e afirmado aqui, e isso tambem e a entrega.** Os
 * pontos de configuracao nomeados com os valores do legado sao **T002**, e quem
 * os afirma e `configuracao/configuracao.test.ts`; numero semeado antes da
 * tarefa que o pede e numero inventado, e o P6 o recusa. O que T002 acrescentou
 * a este arquivo foi uma linha: a superficie do modulo passou a ter
 * `armazenamento` e `configuracao`.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarModuloDeOperacaoDoSoftware,
  TRANSPORTE_LOCAL,
  type Consulta,
  type EntradaDePasta,
  type LeituraDeArquivo,
  type MensagemDeEmail,
  type OperacaoDeArquivo,
  type PedidoExterno,
  type PortaDeClienteExterno,
  type PortaDeDados,
  type PortaDeEmail,
  type PortaDeSistemaDeArquivos,
  type PortasDeOperacaoDoSoftware,
  type ResultadoDaConexao,
  type ResultadoDeDownload,
  type ResultadoDeEnvio,
  type ResultadoDeEscrita,
  type ResultadoExterno,
  type TransporteDeArquivo,
} from './index.js';

/** Um comando que chegou a uma porta, com o que foi passado nele. */
interface Toque {
  readonly porta: 'arquivos' | 'externo' | 'dados' | 'email';
  readonly operacao: string;
  readonly argumentos: readonly unknown[];
}

interface OpcoesDasPortasDeTeste {
  readonly transporte?: TransporteDeArquivo;
  readonly prefixoDeTabela?: string;
  readonly prefixoBaseDeTabela?: string;
  readonly resultadoDaConexao?: ResultadoDaConexao;
  readonly apagamento?: OperacaoDeArquivo;
  readonly listagem?: LeituraDeArquivo<readonly EntradaDePasta[]>;
  readonly resultadoExterno?: ResultadoExterno;
  readonly resultadoDeDownload?: ResultadoDeDownload;
  readonly resultadoDeEnvio?: ResultadoDeEnvio;
}

function portasDeTeste(opcoes: OpcoesDasPortasDeTeste = {}): {
  portas: PortasDeOperacaoDoSoftware;
  toques: Toque[];
} {
  const toques: Toque[] = [];

  function registrar(
    porta: Toque['porta'],
    operacao: string,
    ...argumentos: readonly unknown[]
  ): void {
    toques.push({ porta, operacao, argumentos });
  }

  const concluido: OperacaoDeArquivo = { concluido: true };

  const sistemaDeArquivos: PortaDeSistemaDeArquivos = {
    transporte: opcoes.transporte ?? TRANSPORTE_LOCAL,
    conectar(credenciais) {
      registrar('arquivos', 'conectar', credenciais);
      return opcoes.resultadoDaConexao ?? { conectado: true };
    },
    raiz() {
      registrar('arquivos', 'raiz');
      return '/instalacao/';
    },
    raizDeConteudo() {
      registrar('arquivos', 'raizDeConteudo');
      return '/instalacao/wp-content/';
    },
    raizDePlugins() {
      registrar('arquivos', 'raizDePlugins');
      return '/instalacao/wp-content/plugins/';
    },
    raizDeTemas() {
      registrar('arquivos', 'raizDeTemas');
      return '/instalacao/wp-content/themes/';
    },
    acharPasta(caminho) {
      registrar('arquivos', 'acharPasta', caminho);
      return caminho;
    },
    existe(caminho) {
      registrar('arquivos', 'existe', caminho);
      return false;
    },
    ehArquivo(caminho) {
      registrar('arquivos', 'ehArquivo', caminho);
      return false;
    },
    ehPasta(caminho) {
      registrar('arquivos', 'ehPasta', caminho);
      return false;
    },
    gravavel(caminho) {
      registrar('arquivos', 'gravavel', caminho);
      return true;
    },
    criarPasta(caminho, modo) {
      registrar('arquivos', 'criarPasta', caminho, modo);
      return concluido;
    },
    escrever(caminho, conteudo, modo) {
      registrar('arquivos', 'escrever', caminho, conteudo, modo);
      return concluido;
    },
    ler(caminho) {
      registrar('arquivos', 'ler', caminho);
      return { concluido: true, valor: new Uint8Array() };
    },
    copiar(origem, destino, sobrescrever, modo) {
      registrar('arquivos', 'copiar', origem, destino, sobrescrever, modo);
      return concluido;
    },
    apagar(caminho, recursivo) {
      registrar('arquivos', 'apagar', caminho, recursivo);
      return opcoes.apagamento ?? concluido;
    },
    listar(pasta, incluirOcultos, recursivo) {
      registrar('arquivos', 'listar', pasta, incluirOcultos, recursivo);
      return opcoes.listagem ?? { concluido: true, valor: [] };
    },
    definirPermissoes(caminho, modo, recursivo) {
      registrar('arquivos', 'definirPermissoes', caminho, modo, recursivo);
      return concluido;
    },
  };

  const clienteExterno: PortaDeClienteExterno = {
    chamar(pedido) {
      registrar('externo', 'chamar', pedido);
      return (
        opcoes.resultadoExterno ?? {
          completou: true,
          resposta: { codigo: 200, cabecalhos: {}, corpo: '' },
        }
      );
    },
    baixar(pedido, destino) {
      registrar('externo', 'baixar', pedido, destino);
      return (
        opcoes.resultadoDeDownload ?? { completou: true, caminho: destino }
      );
    },
  };

  const dados: PortaDeDados = {
    prefixoDeTabela: opcoes.prefixoDeTabela ?? 'wp_',
    prefixoBaseDeTabela: opcoes.prefixoBaseDeTabela ?? 'wp_',
    selecionar(consulta) {
      registrar('dados', 'selecionar', consulta);
      return [];
    },
    escrever(consulta): ResultadoDeEscrita {
      registrar('dados', 'escrever', consulta);
      return { linhasAfetadas: 0, idGerado: null };
    },
  };

  const email: PortaDeEmail = {
    enviar(mensagem) {
      registrar('email', 'enviar', mensagem);
      return opcoes.resultadoDeEnvio ?? { enviado: true };
    },
  };

  return {
    portas: { sistemaDeArquivos, clienteExterno, dados, email },
    toques,
  };
}

/** Um pedido qualquer, com os valores que o legado passa na consulta de versao. */
function pedidoDeConsulta(): PedidoExterno {
  return {
    // `wp-includes/update.php:226` monta a URL em `http://` e so a promove a
    // `https` se o transporte suportar TLS (`:231`). O valor em claro e o que o
    // legado repete quando a chamada cifrada falha (`:258`).
    url: 'http://api.wordpress.org/core/version-check/1.7/',
    metodo: 'POST',
    cabecalhos: { wp_blog: 'https://exemplo.invalido/' },
    cookies: {},
    corpo: 'version=7.1.2',
    // `$doing_cron ? 30 : 3` (`wp-includes/update.php:237`).
    tempoLimiteEmSegundos: 3,
    limiteDeRedirecionamentos: 5,
    limiteDeBytesDaResposta: null,
    agenteDeUsuario: 'WordPress/7.1.2; https://exemplo.invalido/',
    verificarCertificado: true,
    recusarUrlInsegura: false,
  };
}

function mensagemDeAviso(): MensagemDeEmail {
  return {
    destinatarios: ['admin@exemplo.invalido'],
    assunto: '',
    corpo: '',
    cabecalhos: [],
    anexos: [],
  };
}

test('o modulo carrega com as quatro portas declaradas', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeOperacaoDoSoftware(portas);

  assert.equal(modulo.nome, 'operacao-do-software');
  assert.equal(modulo.portas.sistemaDeArquivos, portas.sistemaDeArquivos);
  assert.equal(modulo.portas.clienteExterno, portas.clienteExterno);
  assert.equal(modulo.portas.dados, portas.dados);
  assert.equal(modulo.portas.email, portas.email);

  // As quatro, e nenhuma a mais: a quinta borda de AD-08 e o cache de objeto, e
  // o contexto de PT-013 roda com "o cache de objeto desligado nas duas
  // metades". Porta que entrar aqui sem historia que a peca e superficie que
  // este modulo nao usa.
  assert.deepEqual(Object.keys(modulo.portas).sort(), [
    'clienteExterno',
    'dados',
    'email',
    'sistemaDeArquivos',
  ]);
});

test('a superficie do modulo tem exatamente o que T001, T002 e T003 entregam', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeOperacaoDoSoftware(portas);

  // Esta lista cresce NA TAREFA DE CADA HISTORIA, nunca antes: e o que o P4 da
  // constituicao cobra, "toda operacao exposta nova nasce com declaracao
  // explicita de permissao". T001 entregou as portas; T002 acrescentou
  // `armazenamento` e `configuracao`, e NENHUMA DAS DUAS E OPERACAO — as duas
  // linhas de `tasks.md` dizem `satisfaz: — (infraestrutura)`. A tabela de quem
  // entra, com a permissao de cada uma ja lida dos casos de uso, esta no
  // comentario de `ModuloDeOperacaoDoSoftware`. T003 acrescentou `instalacao`,
  // a primeira operacao, com `PERMISSOES_DA_INSTALACAO` como declaracao.
  assert.deepEqual(Object.keys(modulo).sort(), [
    'armazenamento',
    'configuracao',
    'instalacao',
    'nome',
    'portas',
  ]);
});

test('criar o modulo nao toca em porta nenhuma (EXT-ORDEM: nada se resolve no carregamento)', () => {
  const { portas, toques } = portasDeTeste();

  criarModuloDeOperacaoDoSoftware(portas);

  // A ordem de arranque e contrato publico (BR-MIGRAR-106, e a tabela "Nao
  // negociavel" da constituicao). Compor o modulo nao le o banco, nao abre o
  // transporte de arquivos, nao chama a rede e nao envia e-mail.
  assert.deepEqual(toques, []);
});

test('o modulo nao envolve porta nenhuma: a referencia que entra e a que sai', () => {
  const { portas, toques } = portasDeTeste();

  const modulo = criarModuloDeOperacaoDoSoftware(portas);

  // Importa porque o modo de falha depende disso. `D3` poe falha de envio como
  // ESTADO e nao excecao, e `A5`/`A6` classificam a falha por CODIGO: qualquer
  // camada entre o chamador e a porta poderia transformar um dos dois em
  // excecao, e a classificacao de CA-9.4 deixaria de ser possivel.
  modulo.portas.dados.selecionar({ texto: 'SELECT 1', parametros: [] });

  assert.deepEqual(toques, [
    {
      porta: 'dados',
      operacao: 'selecionar',
      argumentos: [{ texto: 'SELECT 1', parametros: [] }],
    },
  ]);
});

test('duas composicoes nao compartilham estado (EXT-CONTEXTO, BR-MIGRAR-105)', () => {
  const primeira = portasDeTeste({ prefixoDeTabela: 'wp_' });
  const segunda = portasDeTeste({
    prefixoDeTabela: 'wp_2_',
    prefixoBaseDeTabela: 'wp_',
  });

  const moduloA = criarModuloDeOperacaoDoSoftware(primeira.portas);
  const moduloB = criarModuloDeOperacaoDoSoftware(segunda.portas);

  assert.notEqual(moduloA, moduloB);
  assert.equal(moduloA.portas.dados.prefixoDeTabela, 'wp_');
  assert.equal(moduloB.portas.dados.prefixoDeTabela, 'wp_2_');

  // `A10` poe a extensao pausada no escopo da SESSAO de recuperacao, nao do
  // site: UC-36 registra que "o nome da opcao que guarda as extensoes pausadas
  // carrega o identificador da sessao", e e isso que faz CA-12.3 valer — "o
  // visitante continua vendo o site como estava". Se o modulo guardasse porta em
  // estado de modulo, a pausa de uma sessao alcancaria a outra.
  const consulta: Consulta = { texto: 'SELECT 1', parametros: [] };
  moduloA.portas.dados.selecionar(consulta);

  assert.equal(primeira.toques.length, 1);
  assert.equal(segunda.toques.length, 0);
});

test('os dois prefixos de tabela sao campos distintos, porque o legado tem dois', () => {
  const { portas } = portasDeTeste({
    prefixoDeTabela: 'wp_2_',
    prefixoBaseDeTabela: 'wp_',
  });

  const modulo = criarModuloDeOperacaoDoSoftware(portas);

  // `auto_core_update_failed` e `auto_core_update_notified` sao gravados com
  // `update_site_option` (`class-wp-automatic-updater.php:838`, `:861`, `:873`),
  // e opcao de rede vive no prefixo BASE. Derivar um prefixo do outro por corte
  // de texto nao funciona: um prefixo base pode terminar em digito e sublinhado.
  assert.equal(modulo.portas.dados.prefixoDeTabela, 'wp_2_');
  assert.equal(modulo.portas.dados.prefixoBaseDeTabela, 'wp_');
});

test('a variante local e a unica nomeada, e e o transporte `direct` do legado', () => {
  // O comentario de `wp-admin/includes/file.php:2272` fecha a lista: "Please
  // ensure that this is either 'direct', 'ssh2', 'ftpext', or 'ftpsockets'". O
  // nome fica em ingles porque `FS_METHOD` o aceita como texto e o filtro
  // `filesystem_method` o devolve: traduzi-lo seria renomear contrato publico.
  assert.equal(TRANSPORTE_LOCAL, 'direct');

  const { portas } = portasDeTeste();
  const modulo = criarModuloDeOperacaoDoSoftware(portas);

  assert.equal(modulo.portas.sistemaDeArquivos.transporte, TRANSPORTE_LOCAL);

  // O transporte e dado da porta porque uma decisao de produto ramifica nele:
  // `update-core.php:1598` so confere gravabilidade previa quando o metodo e
  // `direct`. Os tres transportes remotos sao aceitos pelo tipo e nao tem
  // implementacao em lugar nenhum deste repositorio — eles nascem em
  // `adaptadores/`, pela regra de dependencia 4.
  const remoto = criarModuloDeOperacaoDoSoftware(
    portasDeTeste({ transporte: 'ssh2' }).portas,
  );
  assert.equal(remoto.portas.sistemaDeArquivos.transporte, 'ssh2');
});

test('a porta de arquivos devolve a falha como valor, sem lancar (CA-5.4, A5)', () => {
  const { portas, toques } = portasDeTeste({
    apagamento: { concluido: false, mensagem: 'destino nao gravavel' },
  });

  const modulo = criarModuloDeOperacaoDoSoftware(portas);

  // E o retorno de `delete` que distingue a falha critica da comum: no legado,
  // `! $wp_filesystem->delete( $x, true )` depois de a copia ter comecado e o
  // que `A5` marca como critico (`class-wp-automatic-updater.php:816` a `:822`)
  // e o que congela a automacao ate intervencao humana (ADR-0008). Excecao aqui
  // apagaria a distincao.
  const resultado = modulo.portas.sistemaDeArquivos.apagar(
    '/instalacao/wp-content/upgrade/tmp/',
    true,
  );

  assert.deepEqual(resultado, {
    concluido: false,
    mensagem: 'destino nao gravavel',
  });
  // O `recursivo` chegou como foi passado: e o argumento mais usado desta borda
  // no legado (27 chamadas de `delete` no caminho de atualizacao) e e dele que
  // CA-5.2 depende para limpar a area temporaria "em todo caminho de saida".
  assert.deepEqual(toques[0]?.argumentos, [
    '/instalacao/wp-content/upgrade/tmp/',
    true,
  ]);
});

test('listar distingue falha de pasta vazia, porque o legado decide coisas diferentes nos dois', () => {
  const falha = criarModuloDeOperacaoDoSoftware(
    portasDeTeste({
      listagem: { concluido: false, mensagem: 'pasta ilegivel' },
    }).portas,
  );
  const vazia = criarModuloDeOperacaoDoSoftware(portasDeTeste().portas);

  // `clear_destination()` trata o `false` do `dirlist` como "o destino nao
  // existe" e devolve SUCESSO sem apagar nada
  // (`class-wp-upgrader.php:447`), enquanto `install_package()` trata o mesmo
  // `false` como `source_read_failed` e ABORTA (`:568`). Pasta vazia e um
  // terceiro caso, com terceiro efeito (`:579`). Colapsar os tres muda o
  // resultado de US-1 e de US-5.
  assert.deepEqual(falha.portas.sistemaDeArquivos.listar('/x/', true, true), {
    concluido: false,
    mensagem: 'pasta ilegivel',
  });
  assert.deepEqual(vazia.portas.sistemaDeArquivos.listar('/x/', true, true), {
    concluido: true,
    valor: [],
  });
});

test('a conexao de arquivos devolve LISTA de mensagens, porque o legado acumula', () => {
  const { portas } = portasDeTeste({
    resultadoDaConexao: {
      conectado: false,
      mensagens: ['host inalcancavel', 'credencial recusada'],
    },
  });

  const modulo = criarModuloDeOperacaoDoSoftware(portas);

  // `fs_connect()` le `$wp_filesystem->errors->has_errors()` e devolve o
  // `WP_Error` INTEIRO para a tela de credencial redesenhar com ele
  // (`class-wp-upgrader.php:245` a `:252`). Uma mensagem so perderia o que o
  // ator ve, e CA-5.5 depende do que ele ve para informar a credencial.
  assert.deepEqual(modulo.portas.sistemaDeArquivos.conectar(null), {
    conectado: false,
    mensagens: ['host inalcancavel', 'credencial recusada'],
  });
});

test('a porta de cliente externo devolve a falha como valor, com o codigo que A5 e A6 classificam', () => {
  const { portas, toques } = portasDeTeste({
    resultadoExterno: {
      completou: false,
      codigoDeErro: 'download_failed',
      motivo: 'origem inalcancavel',
    },
  });

  const modulo = criarModuloDeOperacaoDoSoftware(portas);

  const pedido = pedidoDeConsulta();
  const resultado = modulo.portas.clienteExterno.chamar(pedido);

  // `download_failed` esta na lista de transitorios do legado
  // (`class-wp-automatic-updater.php:855`), e e por ela que `A6` da EXATAMENTE
  // UMA segunda chance, em uma hora, sem notificar. O codigo tem de atravessar a
  // borda como dado: CA-9.4 exige que a classificacao seja declarada em um lugar
  // so, e nao da para classificar o que a borda nao devolveu.
  assert.deepEqual(resultado, {
    completou: false,
    codigoDeErro: 'download_failed',
    motivo: 'origem inalcancavel',
  });

  // 🔴 O pedido atravessa a porta com a URL em claro e sem alteracao nenhuma
  // deste modulo. `ESC-HTTP`/BR-MIGRAR-115 e a resposta 12 registram o
  // rebaixamento como divida herdada reproduzida de proposito, e fechar o
  // rebaixamento esta na tabela "Nao negociavel" da constituicao.
  assert.equal(toques[0]?.operacao, 'chamar');
  assert.equal(
    (toques[0]?.argumentos[0] as PedidoExterno).url,
    'http://api.wordpress.org/core/version-check/1.7/',
  );
  assert.equal(
    (toques[0]?.argumentos[0] as PedidoExterno).tempoLimiteEmSegundos,
    3,
  );
});

test('baixar devolve caminho de arquivo, e nao corpo: o pacote nao passa pela porta de arquivos', () => {
  const { portas, toques } = portasDeTeste();

  const modulo = criarModuloDeOperacaoDoSoftware(portas);

  const resultado = modulo.portas.clienteExterno.baixar(
    pedidoDeConsulta(),
    '/tmp/pacote.zip',
  );

  // `download_url()` chama `wp_safe_remote_get` com `'stream' => true` e
  // `'filename' => $tmpfname` (`wp-admin/includes/file.php:1177` a `:1184`): e o
  // TRANSPORTE HTTP que grava o arquivo, nao o `WP_Filesystem`. A assimetria e
  // observavel — o temporario nasce com a identidade do processo, nao com a da
  // credencial de FTP ou SSH —, e e por isso que uma instalacao que precisa de
  // credencial remota consegue baixar e falha ao APLICAR.
  assert.deepEqual(resultado, { completou: true, caminho: '/tmp/pacote.zip' });

  // A prova de que nao passou pela outra porta: nenhum toque em `arquivos`.
  assert.deepEqual(
    toques.filter((toque) => toque.porta === 'arquivos'),
    [],
  );
});

test('a porta de e-mail devolve a falha como valor, sem lancar (D3, A10)', () => {
  const { portas } = portasDeTeste({
    resultadoDeEnvio: { enviado: false, motivo: 'transporte indisponivel' },
  });

  const modulo = criarModuloDeOperacaoDoSoftware(portas);

  // `A10` grava o marcador ANTES de enviar, e falhar na gravacao aborta o aviso
  // (`class-wp-recovery-mode-email-service.php:58` a `:62`). A ordem e a regra,
  // logo o envio que falha DEPOIS da gravacao nao pode desfazer nada — e uma
  // excecao atravessando daqui desfaria. O numero de e-mails e o criterio de
  // aceite declarado de PT-013.
  const resultado = modulo.portas.email.enviar(mensagemDeAviso());

  assert.deepEqual(resultado, {
    enviado: false,
    motivo: 'transporte indisponivel',
  });
});

test('nenhuma porta escreve registro: o silencio do legado continua silencio (P7)', () => {
  const { portas, toques } = portasDeTeste({
    apagamento: { concluido: false, mensagem: 'falhou' },
    resultadoDeEnvio: { enviado: false, motivo: 'falhou' },
    resultadoExterno: {
      completou: false,
      codigoDeErro: 'download_failed',
      motivo: 'falhou',
    },
  });

  const modulo = criarModuloDeOperacaoDoSoftware(portas);

  modulo.portas.sistemaDeArquivos.apagar('/x/', true);
  modulo.portas.email.enviar(mensagemDeAviso());
  modulo.portas.clienteExterno.chamar(pedidoDeConsulta());

  // Tres falhas, tres toques: exatamente as tres operacoes pedidas, e nenhuma
  // escrita a mais. O P7 permite acrescentar registro, mas "nenhuma decisao do
  // sistema pode passar a depender dela" — e nesta feature o silencio e medido:
  // `maintenance_mode()` nao olha o retorno das duas chamadas que faz
  // (`class-wp-upgrader.php:1034` e `:1035`), e o aviso de atualizacao descarta
  // o retorno de `wp_mail` (`class-wp-automatic-updater.php:1149`). Porta que
  // registrasse por conta propria tiraria o silencio do lugar.
  assert.deepEqual(
    toques.map((toque) => `${toque.porta}.${toque.operacao}`),
    ['arquivos.apagar', 'email.enviar', 'externo.chamar'],
  );
});
