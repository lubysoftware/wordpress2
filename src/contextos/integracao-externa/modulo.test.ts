/**
 * Testes da entrega de T001: *"a porta de cliente externo e a de envio de
 * e-mail existem com uma implementacao cada, e toda chamada de saida do sistema
 * passa por elas, sem nenhuma politica de prazo ou de repeticao definida"*.
 *
 * Nao sao os testes de nenhuma historia — esses sao T004, T006, T008, T010,
 * T012, T014, T016 e T018 de `tasks.md`, um por caso de `backlog/tests.md`
 * (UT-149, UT-151 a UT-156 e UT-181). Aqui se afirma so o que T001 entrega,
 * mais as invariantes que um esqueleto pode quebrar em silencio: estado de
 * modulo (`EXT-CONTEXTO`), trabalho no carregamento (`EXT-ORDEM`), falha que
 * atravessa a porta como **valor**, e — a mais importante deste contexto — que
 * **nem a repeticao em claro de `ESC-HTTP` nem a recusa que REQ-149 pede estao
 * decididas aqui**.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarClienteExternoQueRegistra,
  criarEmailQueRegistra,
  criarPortaDeDadosFalsa,
  criarModuloDeIntegracaoExterna,
  ENVIO_ACEITO_PELO_TRANSPORTE,
  FALHA_SEM_RESPOSTA_PROGRAMADA,
  type MensagemDeEmail,
  type PedidoExterno,
  type PortasDeIntegracaoExterna,
  type RespostaExterna,
} from './index.js';

/**
 * Um pedido completo, para os testes.
 *
 * ⚠️ **Os valores daqui sao do teste, nao do modulo.** T001 entrega a borda
 * *"sem nenhuma politica de prazo"*, e os valores de fabrica do legado (5 s de
 * tempo limite, 5 redirecionamentos, verificacao de certificado ligada) sao de
 * **T011**, com o ponto de configuracao nomeado que o P6 exige. Nenhum numero
 * deste arquivo e importado de `./index.js`, e nao existe de onde importar: e
 * isso que o teste *"nenhum numero de prazo nasce em T001"* afirma.
 */
function pedidoDeTeste(mudancas: Partial<PedidoExterno> = {}): PedidoExterno {
  const base: PedidoExterno = {
    url: 'https://api.exemplo.org/core/version-check/1.7/',
    metodo: 'POST',
    versaoDoProtocolo: '1.0',
    cabecalhos: { wp_blog: 'https://sitio.exemplo/' },
    cookies: {},
    corpo: 'translations=%5B%5D',
    tempoLimiteEmSegundos: 3,
    limiteDeRedirecionamentos: 5,
    agenteDeUsuario: 'WordPress/7.1.2; https://sitio.exemplo/',
    recusarUrlInsegura: false,
    bloqueante: true,
    comprimirPedido: false,
    descomprimirResposta: true,
    verificarCertificado: true,
    certificadosDeAutoridade: null,
    gravarEmArquivo: false,
    nomeDeArquivo: null,
    limiteDeBytesDaResposta: null,
  };

  return { ...base, ...mudancas };
}

function respostaDeTeste(
  mudancas: Partial<RespostaExterna> = {},
): RespostaExterna {
  const base: RespostaExterna = {
    codigo: 200,
    mensagemDoEstado: 'OK',
    cabecalhos: { 'content-type': 'application/json' },
    corpo: '{"offers":[]}',
    cookies: {},
    nomeDeArquivo: null,
  };

  return { ...base, ...mudancas };
}

function mensagemDeTeste(
  mudancas: Partial<MensagemDeEmail> = {},
): MensagemDeEmail {
  const base: MensagemDeEmail = {
    destinatarios: ['dono@sitio.exemplo'],
    assunto: '[Sitio] Redefinicao de senha',
    corpo: 'Alguem pediu a redefinicao da senha desta conta.',
    cabecalhos: ['Content-Type: text/plain; charset=UTF-8'],
    anexos: [],
    incorporados: [],
  };

  return { ...base, ...mudancas };
}

interface Duplos {
  portas: PortasDeIntegracaoExterna;
  cliente: ReturnType<typeof criarClienteExternoQueRegistra>;
  email: ReturnType<typeof criarEmailQueRegistra>;
  dados: ReturnType<typeof criarPortaDeDadosFalsa>;
}

function duplos(): Duplos {
  const cliente = criarClienteExternoQueRegistra();
  const email = criarEmailQueRegistra();
  const dados = criarPortaDeDadosFalsa();

  return {
    portas: { clienteExterno: cliente.porta, email: email.porta, dados: dados.porta },
    cliente,
    email,
    dados,
  };
}

test('o modulo carrega com as duas portas declaradas', () => {
  const { portas } = duplos();

  const modulo = criarModuloDeIntegracaoExterna(portas);

  assert.equal(modulo.nome, 'integracao-externa');
  assert.equal(modulo.portas.clienteExterno, portas.clienteExterno);
  assert.equal(modulo.portas.email, portas.email);
});

test('a superficie do modulo tem exatamente o que T001, T002 e T007 entregaram', () => {
  const { portas } = duplos();

  const modulo = criarModuloDeIntegracaoExterna(portas);

  // Esta lista cresce NA TAREFA DE CADA HISTORIA, nunca antes: e o que o P4 da
  // constituicao cobra, "toda operacao exposta nova nasce com declaracao
  // explicita de permissao". T001: nenhuma operacao, nenhum dado, so as portas.
  // T002 acrescentou `catalogo`, que e o dado que aquela tarefa anunciava — e
  // continua nao havendo OPERACAO nenhuma aqui, logo nenhuma permissao a
  // declarar. As consultas ao catalogo recebem a fonte por argumento e vivem em
  // `catalogo/consultas.ts`, fora desta interface. T007 acrescentou
  // `credencial`, a primeira operacao, com `PERMISSOES_DA_CREDENCIAL`.
  assert.deepEqual(Object.keys(modulo).sort(), [
    'catalogo',
    'credencial',
    'nome',
    'portas',
  ]);
});

test('criar o modulo nao toca em porta nenhuma (EXT-ORDEM: nada se resolve no carregamento)', () => {
  const { portas, cliente, email, dados } = duplos();

  criarModuloDeIntegracaoExterna(portas);

  // Lista vazia e AFIRMACAO: o esqueleto nao faz chamada de saida nenhuma ao ser
  // criado, e nao manda e-mail nenhum. A contagem de e-mails ao administrador e
  // criterio de aceite por AD-06, logo um envio no carregamento seria falha de
  // paridade medida, nao detalhe.
  assert.deepEqual(cliente.requisicoes, []);
  assert.deepEqual(email.mensagens, []);
  // T007: a precedencia de credencial le o banco so quando resolve.
  assert.deepEqual(dados.selecoes, []);
});

test('duas composicoes nao compartilham estado (EXT-CONTEXTO, e o @concorrencia de PT-017)', () => {
  const primeira = duplos();
  const segunda = duplos();

  const moduloA = criarModuloDeIntegracaoExterna(primeira.portas);
  const moduloB = criarModuloDeIntegracaoExterna(segunda.portas);

  assert.notEqual(moduloA, moduloB);

  moduloA.portas.clienteExterno.chamar(
    pedidoDeTeste({ url: 'https://api.exemplo.org/sitio-1' }),
  );

  // "Dois sites da mesma instalacao com credenciais de conector diferentes ...
  // cada requisicao leva a credencial do seu proprio site ... e o estado de
  // rebaixamento de canal de um nao afeta o do outro" (PT-017, @concorrencia).
  // Rebaixamento de canal e estado com prazo; estado de modulo o vazaria.
  assert.equal(primeira.cliente.requisicoes.length, 1);
  assert.deepEqual(segunda.cliente.requisicoes, []);
});

test('o esquema da URL atravessa a porta como foi escrito, nos dois sentidos (REQ-149 x resposta 12)', () => {
  const { portas, cliente } = duplos();

  const modulo = criarModuloDeIntegracaoExterna(portas);

  // No legado o endereco NASCE em texto claro e e promovido so se o ambiente
  // suportar: `$url = 'http://api.wordpress.org/core/version-check/1.7/?'`,
  // `$http_url = $url`, `$ssl = wp_http_supports( array( 'ssl' ) )`
  // (wp-includes/update.php:226 a :231). Treze canais nascem assim.
  modulo.portas.clienteExterno.chamar(
    pedidoDeTeste({ url: 'http://api.exemplo.org/core/version-check/1.7/' }),
  );
  modulo.portas.clienteExterno.chamar(
    pedidoDeTeste({ url: 'https://api.exemplo.org/core/version-check/1.7/' }),
  );

  // A porta nao promove e nao recusa: 🔴 o conflito REQ-149 x resposta 12 esta
  // registrado e NAO resolvido, e as duas leituras continuam possiveis depois de
  // T001. Se este teste passar a afirmar um dos dois esquemas, alguem decidiu o
  // que a tabela "Nao negociavel" da constituicao proibe decidir aqui.
  assert.deepEqual(
    cliente.requisicoes.map((pedido) => new URL(pedido.url).protocol),
    ['http:', 'https:'],
  );
});

test('o pedido atravessa a porta campo por campo, sem normalizacao', () => {
  const { portas, cliente } = duplos();

  const modulo = criarModuloDeIntegracaoExterna(portas);
  const pedido = pedidoDeTeste({
    metodo: 'HEAD',
    versaoDoProtocolo: '1.1',
    tempoLimiteEmSegundos: 0.01,
    limiteDeRedirecionamentos: 0,
    recusarUrlInsegura: true,
    bloqueante: false,
    verificarCertificado: false,
    gravarEmArquivo: true,
    nomeDeArquivo: '/tmp/pacote.zip',
    limiteDeBytesDaResposta: 153600,
  });

  modulo.portas.clienteExterno.chamar(pedido);

  // Identidade, e nao copia equivalente: nada entre o chamador e o adaptador
  // reescreve o pedido. Os campos acima sao os que mais doem se alguem os
  // "corrigir" — o `HEAD` com redirecionamento 0 (class-wp-http.php:239), o
  // 0,01 s nao bloqueante do agendador (cron.php:990 a :993) e o teto de 150 KB
  // da prova do pingback (class-wp-xmlrpc-server.php:7092).
  assert.equal(cliente.requisicoes[0], pedido);
  assert.equal(cliente.requisicoes.length, 1);
});

test('uma chamada e uma chamada: a porta nao repete nada (AD-06)', () => {
  const { portas, cliente } = duplos();

  const modulo = criarModuloDeIntegracaoExterna(portas);
  cliente.responder({
    completou: false,
    codigo: 'http_request_failed',
    mensagem: 'cURL error 35: SSL connect error',
  });

  const resultado = modulo.portas.clienteExterno.chamar(pedidoDeTeste());

  // AD-06: "nao ha broker, DLQ nem retry generico". A falha volta como valor, com
  // o identificador do legado (class-wp-http.php:425), e UMA requisicao foi
  // registrada. Se a porta repetisse, o cenario @divida-herdada de PT-017 nao
  // poderia comparar "o conjunto de canais que repete".
  assert.equal(resultado.completou, false);
  assert.equal(
    resultado.completou === false ? resultado.codigo : null,
    'http_request_failed',
  );
  assert.equal(cliente.requisicoes.length, 1);
});

test('a repeticao em claro de ESC-HTTP e escrita pelo chamador, e a borda a torna observavel', () => {
  const { portas, cliente } = duplos();

  const modulo = criarModuloDeIntegracaoExterna(portas);
  cliente.responder({
    completou: false,
    codigo: 'http_request_failed',
    mensagem: 'cURL error 35: SSL connect error',
  });
  cliente.responder({ completou: true, resposta: respostaDeTeste() });

  // E o que o legado faz em sete pontos, e o codigo e do CHAMADOR:
  // `if ( $ssl && is_wp_error( $response ) ) { ... wp_remote_post( $http_url,
  // $options ) }` (wp-includes/update.php:248 a :258). Aqui a sequencia esta
  // escrita no teste de proposito: nenhum arquivo do modulo a conhece.
  const segura = modulo.portas.clienteExterno.chamar(
    pedidoDeTeste({ url: 'https://api.exemplo.org/core/checksums/1.0/' }),
  );
  assert.equal(segura.completou, false);

  const emClaro = modulo.portas.clienteExterno.chamar(
    pedidoDeTeste({ url: 'http://api.exemplo.org/core/checksums/1.0/' }),
  );
  assert.equal(emClaro.completou, true);

  // Duas requisicoes, com o MESMO corpo e esquemas diferentes: e exatamente o
  // que o cenario @divida-herdada compara ("o corpo da requisicao repetida e
  // identico ao da primeira nas duas"). T001 nao decide se isto deve acontecer —
  // torna conferivel quando acontecer.
  assert.deepEqual(
    cliente.requisicoes.map((pedido) => new URL(pedido.url).protocol),
    ['https:', 'http:'],
  );
  assert.equal(cliente.requisicoes[0]?.corpo, cliente.requisicoes[1]?.corpo);
});

test('o disparo nao bloqueante e expressavel, e a resposta sem codigo atravessa (AD-07)', () => {
  const { portas, cliente } = duplos();

  const modulo = criarModuloDeIntegracaoExterna(portas);
  // Com `blocking` falso o legado devolve `'response' => array( 'code' => false,
  // 'message' => false )` e corpo vazio (class-wp-http.php:446 a :456). O `false`
  // e o estado que AD-07 manda preservar: "o criterio de aceite verifica A FALHA,
  // nao a latencia", porque R5 e o ADR-0006 dependem de o disparo falhar.
  cliente.responder({
    completou: true,
    resposta: respostaDeTeste({
      codigo: false,
      mensagemDoEstado: false,
      corpo: '',
    }),
  });

  const resultado = modulo.portas.clienteExterno.chamar(
    pedidoDeTeste({
      url: 'https://sitio.exemplo/wp-cron.php?doing_wp_cron',
      tempoLimiteEmSegundos: 0.01,
      bloqueante: false,
      verificarCertificado: false,
    }),
  );

  assert.equal(resultado.completou, true);
  assert.equal(
    resultado.completou === true ? resultado.resposta.codigo : 0,
    false,
  );
  assert.equal(cliente.requisicoes[0]?.bloqueante, false);

  // Reproduzir a falha e do adaptador e de BC-11; o que T001 garante e que a
  // chamada caiba na borda. A porta de BC-03 nao tem este campo, de proposito, e
  // o cabecalho dela diz por que.
  assert.equal(cliente.requisicoes[0]?.tempoLimiteEmSegundos, 0.01);
});

test('sem resposta programada a chamada falha, e nao inventa resposta', () => {
  const { portas, cliente } = duplos();

  const modulo = criarModuloDeIntegracaoExterna(portas);

  const resultado = modulo.portas.clienteExterno.chamar(pedidoDeTeste());

  // Sucesso exigiria inventar codigo, cabecalhos e corpo, e a area 1 da Decisao 2
  // de parity_specs.md compara "saida byte a byte": corpo inventado e observavel
  // inventado. A mensagem e vazia porque no legado ela vem do transporte.
  assert.deepEqual(resultado, FALHA_SEM_RESPOSTA_PROGRAMADA);
  assert.equal(resultado.completou, false);
  assert.equal(resultado.completou === false ? resultado.mensagem : null, '');
  assert.ok(Object.isFrozen(FALHA_SEM_RESPOSTA_PROGRAMADA));
  assert.equal(cliente.requisicoes.length, 1);
});

test('os seis argumentos de wp_mail atravessam a porta inteiros', () => {
  const { portas, email } = duplos();

  const modulo = criarModuloDeIntegracaoExterna(portas);
  const mensagem = mensagemDeTeste({
    destinatarios: ['dono@sitio.exemplo', 'segundo@sitio.exemplo'],
    cabecalhos: [
      'Content-Type: text/html; charset=UTF-8',
      'Reply-To: nao-responda@sitio.exemplo',
    ],
    anexos: ['/tmp/exportacao.zip'],
    incorporados: ['/tmp/logotipo.png'],
  });

  const resultado = modulo.portas.email.enviar(mensagem);

  // Seis, e nao cinco: `$embeds` esta na assinatura desta versao
  // (wp-includes/pluggable.php:189) e no arranjo do ponto de filtro `wp_mail`
  // (:209), e o P2 poe os argumentos do ponto de extensao no contrato publico.
  assert.equal(email.mensagens[0], mensagem);
  assert.deepEqual(Object.keys(mensagem).sort(), [
    'anexos',
    'assunto',
    'cabecalhos',
    'corpo',
    'destinatarios',
    'incorporados',
  ]);
  assert.deepEqual(resultado, ENVIO_ACEITO_PELO_TRANSPORTE);
  assert.ok(Object.isFrozen(ENVIO_ACEITO_PELO_TRANSPORTE));
});

test('falha de envio e valor com o motivo do canal, e nao excecao (D3)', () => {
  const { portas, email } = duplos();

  const modulo = criarModuloDeIntegracaoExterna(portas);
  email.responder({
    enviado: false,
    motivo: 'SMTP Error: Could not authenticate.',
  });

  const resultado = modulo.portas.email.enviar(mensagemDeTeste());

  // D3: "falha de envio de e-mail e ESTADO, nao excecao". No legado `wp_mail()`
  // devolve `false` e dispara `wp_mail_failed` com a mensagem do transporte
  // dentro de um WP_Error (pluggable.php:665 e :667) — e o motivo atravessa para
  // que CA-6.2 tenha o que registrar, nao para que alguem ramifique nele (P7).
  // A10 fecha o argumento: o marcador do aviso de recuperacao e gravado ANTES do
  // envio, logo a falha nao pode desfazer nada.
  assert.equal(resultado.enviado, false);
  assert.equal(
    resultado.enviado === false ? resultado.motivo : null,
    'SMTP Error: Could not authenticate.',
  );
  assert.equal(email.mensagens.length, 1);
});

test('nenhum prazo, nenhuma repeticao e nenhum limite nascem em T001', () => {
  const { portas } = duplos();

  const modulo = criarModuloDeIntegracaoExterna(portas);

  // A entrega termina em "sem nenhuma politica de prazo ou de repeticao
  // definida". Nao ha onde um numero se esconder: as portas sao duas e o dado de
  // T002 e um catalogo de ENDERECOS. Os valores de fabrica do legado (5 s, 5
  // redirecionamentos, 30 s do construtor de prompt de IA) entram em T011, cada
  // um "num ponto de configuracao nomeado, com o valor de fabrica do legado"
  // (P6) — e a divergencia autorizada pela resposta 18 tem de ser citada no
  // codigo que a exercer (P1). Que nenhuma LINHA do catalogo traga numero e
  // afirmado na suite propria de T002, campo por campo.
  assert.deepEqual(Object.keys(modulo).sort(), [
    'catalogo',
    'credencial',
    'nome',
    'portas',
  ]);
  assert.deepEqual(Object.keys(modulo.portas).sort(), [
    'clienteExterno',
    'dados',
    'email',
  ]);
  assert.equal(
    Object.values(modulo).some((valor) => typeof valor === 'number'),
    false,
  );
});
