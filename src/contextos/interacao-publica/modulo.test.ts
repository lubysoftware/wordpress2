/**
 * Testes da entrega de T001: *"o modulo carrega com as portas de dados, de
 * relogio, de envio de e-mail e de cliente externo declaradas, e os pontos de
 * configuracao de moderacao criados com os valores de fabrica do legado"*.
 *
 * Nao sao os testes de nenhuma historia — esses sao T005, T007, T009 e os demais
 * `[P]` de `tasks.md`, um por caso de `backlog/tests.md`. Aqui se afirma so o
 * que T001 entrega, mais as duas invariantes de arquitetura que um esqueleto
 * pode quebrar em silencio: estado de modulo (`EXT-CONTEXTO`) e trabalho no
 * carregamento (`EXT-ORDEM`).
 *
 * Os valores de fabrica sao afirmados um por um, com a linha do legado que
 * semeia cada um no nome do teste, porque e o que o P6 pede: *"cada numero vive
 * num ponto de configuracao nomeado, com o valor de fabrica do legado, e existe
 * teste que afirma o valor"*. O **efeito de borda** de cada numero — o ultimo
 * instante que aceita e o seguinte que recusa — e das tarefas que aplicam o
 * numero, porque em T001 nao ha o que aceitar nem recusar.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  configuracaoDaInteracaoPublica,
  criarModuloDeInteracaoPublica,
  CONFIGURACAO_DA_INTERACAO_PUBLICA_DE_FABRICA,
  LIMITES_DA_MODERACAO_DE_FABRICA,
  OPCOES_DE_MODERACAO_DE_FABRICA,
  SEGUNDOS_POR_DIA,
  SEGUNDOS_POR_HORA,
  TIPOS_DE_CONTEUDO_COM_FECHAMENTO_AUTOMATICO_DE_FABRICA,
  type Consulta,
  type MensagemDeEmail,
  type PedidoExterno,
  type PortaDeClienteExterno,
  type PortaDeDados,
  type PortaDeEmail,
  type PortaDeRelogio,
  type PortasDeInteracaoPublica,
  type ResultadoDeEnvio,
  type ResultadoDeEscrita,
  type ResultadoExterno,
} from './index.js';

/** Conta os toques em cada porta, para afirmar que o modulo nao as usa ainda. */
interface Toques {
  selecionar: Consulta[];
  escrever: Consulta[];
  enviar: MensagemDeEmail[];
  chamar: PedidoExterno[];
  relogio: number;
}

interface OpcoesDasPortasDeTeste {
  readonly prefixoDeTabela?: string;
  readonly resultadoDeEnvio?: ResultadoDeEnvio;
  readonly resultadoExterno?: ResultadoExterno;
}

function portasDeTeste(opcoes: OpcoesDasPortasDeTeste = {}): {
  portas: PortasDeInteracaoPublica;
  toques: Toques;
} {
  const toques: Toques = {
    selecionar: [],
    escrever: [],
    enviar: [],
    chamar: [],
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

  const clienteExterno: PortaDeClienteExterno = {
    chamar(pedido) {
      toques.chamar.push(pedido);
      return (
        opcoes.resultadoExterno ?? {
          completou: true,
          resposta: { codigo: 200, cabecalhos: {}, corpo: '' },
        }
      );
    },
  };

  return { portas: { dados, relogio, email, clienteExterno }, toques };
}

test('o modulo carrega com as quatro portas declaradas', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeInteracaoPublica(portas);

  assert.equal(modulo.nome, 'interacao-publica');
  assert.equal(modulo.portas.dados, portas.dados);
  assert.equal(modulo.portas.relogio, portas.relogio);
  assert.equal(modulo.portas.email, portas.email);
  assert.equal(modulo.portas.clienteExterno, portas.clienteExterno);
});

test('a superficie do modulo tem exatamente o que T001 entrega', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeInteracaoPublica(portas);

  // Esta lista cresce NA TAREFA DE CADA HISTORIA, nunca antes: e o que o P4 da
  // constituicao cobra, "toda operacao exposta nova nasce com declaracao
  // explicita de permissao". T001 nao expoe operacao nenhuma — so as portas e a
  // configuracao. A tabela de quem entra, com a permissao de cada uma ja lida
  // dos casos de uso, esta no comentario de `ModuloDeInteracaoPublica`.
  assert.deepEqual(Object.keys(modulo).sort(), [
    'configuracao',
    'nome',
    'portas',
  ]);
});

test('criar o modulo nao toca em porta nenhuma (EXT-ORDEM: nada se resolve no carregamento)', () => {
  const { portas, toques } = portasDeTeste();

  criarModuloDeInteracaoPublica(portas);

  assert.deepEqual(toques.selecionar, []);
  assert.deepEqual(toques.escrever, []);
  assert.deepEqual(toques.enviar, []);
  assert.deepEqual(toques.chamar, []);
  assert.equal(toques.relogio, 0);
});

test('duas composicoes nao compartilham estado (EXT-CONTEXTO, BR-MIGRAR-105)', () => {
  const primeira = portasDeTeste({ prefixoDeTabela: 'wp_' });
  const segunda = portasDeTeste({ prefixoDeTabela: 'wp_2_' });

  const moduloA = criarModuloDeInteracaoPublica(primeira.portas);
  const moduloB = criarModuloDeInteracaoPublica(segunda.portas, {
    ...CONFIGURACAO_DA_INTERACAO_PUBLICA_DE_FABRICA,
    moderacao: {
      ...OPCOES_DE_MODERACAO_DE_FABRICA,
      moderacaoManual: true,
    },
  });

  assert.notEqual(moduloA, moduloB);
  assert.equal(moduloA.portas.dados.prefixoDeTabela, 'wp_');
  assert.equal(moduloB.portas.dados.prefixoDeTabela, 'wp_2_');

  // O cenario @concorrencia de
  // `parity_tests/01-cascata-de-moderacao-de-comentario.feature` tem tolerancia
  // zero aqui: "o comentario do visitante nao recebe o atalho de confianca do
  // moderador". Se o modulo guardasse porta ou configuracao em estado de
  // modulo, duas submissoes trocariam de decisao.
  assert.equal(moduloA.configuracao.moderacao.moderacaoManual, false);
  assert.equal(moduloB.configuracao.moderacao.moderacaoManual, true);

  moduloA.portas.dados.selecionar({ texto: 'SELECT 1', parametros: [] });
  assert.equal(primeira.toques.selecionar.length, 1);
  assert.equal(segunda.toques.selecionar.length, 0);
});

test('as opcoes de moderacao nascem com os valores que o instalador do legado semeia', () => {
  // Um assert por linha de `populate_options()` em
  // `wp-admin/includes/schema.php`, que e o que BR-MIGRAR-084 (`DB-SEED`) poe no
  // contrato: "o esquema vazio nao e funcional: parte da regra esta nas linhas
  // que o instalador cria".
  assert.equal(OPCOES_DE_MODERACAO_DE_FABRICA.exigirConta, false); // :459
  assert.equal(OPCOES_DE_MODERACAO_DE_FABRICA.exigirNomeEEmail, true); // :422
  assert.equal(OPCOES_DE_MODERACAO_DE_FABRICA.moderacaoManual, false); // :441
  assert.equal(OPCOES_DE_MODERACAO_DE_FABRICA.maximoDeLinks, 2); // :451
  assert.equal(OPCOES_DE_MODERACAO_DE_FABRICA.palavrasDeModeracao, ''); // :447
  assert.equal(OPCOES_DE_MODERACAO_DE_FABRICA.listaDeProibicao, ''); // :545
  assert.equal(OPCOES_DE_MODERACAO_DE_FABRICA.exigirAutorJaAprovado, true); // :546
  assert.equal(
    OPCOES_DE_MODERACAO_DE_FABRICA.fecharInteracaoEmConteudoAntigo,
    false,
  ); // :500
  assert.equal(OPCOES_DE_MODERACAO_DE_FABRICA.diasParaFecharInteracao, 14); // :501
  assert.equal(OPCOES_DE_MODERACAO_DE_FABRICA.encadearRespostas, true); // :502
  assert.equal(
    OPCOES_DE_MODERACAO_DE_FABRICA.profundidadeMaximaDeEncadeamento,
    5,
  ); // :503
  assert.equal(OPCOES_DE_MODERACAO_DE_FABRICA.avisarAutorDoConteudo, true); // :423
  assert.equal(OPCOES_DE_MODERACAO_DE_FABRICA.avisarQuemModera, true); // :442

  // As treze, e nenhuma a mais: opcao que entra aqui sem tarefa que a peca e
  // numero inventado, e o P6 o recusa.
  assert.deepEqual(Object.keys(OPCOES_DE_MODERACAO_DE_FABRICA).sort(), [
    'avisarAutorDoConteudo',
    'avisarQuemModera',
    'diasParaFecharInteracao',
    'encadearRespostas',
    'exigirAutorJaAprovado',
    'exigirConta',
    'exigirNomeEEmail',
    'fecharInteracaoEmConteudoAntigo',
    'listaDeProibicao',
    'maximoDeLinks',
    'moderacaoManual',
    'palavrasDeModeracao',
    'profundidadeMaximaDeEncadeamento',
  ]);
});

test('os limites que o codigo do legado impoe nascem com os valores dele', () => {
  // A janela da vazao e `HOUR_IN_SECONDS` (`wp-includes/comment.php:922`).
  assert.equal(LIMITES_DA_MODERACAO_DE_FABRICA.janelaDeVazaoEmSegundos, 3600);
  assert.equal(SEGUNDOS_POR_HORA, 3600);
  assert.equal(SEGUNDOS_POR_DIA, 86400);

  // O intervalo minimo vem de `wp_throttle_comment_flood`
  // (`wp-includes/comment.php:2319`), e carrega a divergencia entre o pacote e o
  // legado que esta registrada no proprio campo. T001 declara os dois numeros;
  // quem decide qual vale e quem responde a T008.
  assert.equal(
    LIMITES_DA_MODERACAO_DE_FABRICA.intervaloMinimoEntreComentariosEmSegundos,
    15,
  );

  // `EMPTY_TRASH_DAYS` nasce em 30 (`wp-includes/default-constants.php:388`), e
  // `C9` le a constante por veracidade: so o booleano e observavel aqui.
  assert.equal(LIMITES_DA_MODERACAO_DE_FABRICA.lixeiraLigada, true);

  assert.deepEqual(Object.keys(LIMITES_DA_MODERACAO_DE_FABRICA).sort(), [
    'intervaloMinimoEntreComentariosEmSegundos',
    'janelaDeVazaoEmSegundos',
    'lixeiraLigada',
  ]);
});

test('o fechamento automatico nasce valendo so para o tipo `post`', () => {
  // Valor de fabrica do ponto de extensao `close_comments_for_post_types`
  // (`wp-includes/comment.php:3853`), que no legado nao tem interface.
  assert.deepEqual(TIPOS_DE_CONTEUDO_COM_FECHAMENTO_AUTOMATICO_DE_FABRICA, [
    'post',
  ]);
});

test('o modulo nasce na configuracao de fabrica quando ninguem informa nada', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeInteracaoPublica(portas);

  assert.deepEqual(modulo.configuracao.moderacao, OPCOES_DE_MODERACAO_DE_FABRICA);
  assert.deepEqual(modulo.configuracao.limites, LIMITES_DA_MODERACAO_DE_FABRICA);
});

test('informar um ponto de configuracao nao mexe nos outros nem na constante de fabrica', () => {
  const resolvida = configuracaoDaInteracaoPublica({
    moderacao: { maximoDeLinks: 7 },
    limites: { lixeiraLigada: false },
  });

  assert.equal(resolvida.moderacao.maximoDeLinks, 7);
  assert.equal(resolvida.limites.lixeiraLigada, false);

  // O que nao foi informado continua de fabrica.
  assert.equal(resolvida.moderacao.diasParaFecharInteracao, 14);
  assert.equal(resolvida.limites.janelaDeVazaoEmSegundos, 3600);

  // E a constante de fabrica nao foi mutada: uma composicao que vazasse para
  // ela mudaria o default de todas as outras.
  assert.equal(OPCOES_DE_MODERACAO_DE_FABRICA.maximoDeLinks, 2);
  assert.equal(LIMITES_DA_MODERACAO_DE_FABRICA.lixeiraLigada, true);
  assert.notEqual(resolvida.moderacao, OPCOES_DE_MODERACAO_DE_FABRICA);
  assert.notEqual(resolvida.limites, LIMITES_DA_MODERACAO_DE_FABRICA);

  // Sem argumento, devolve a instalacao de fabrica.
  assert.deepEqual(
    configuracaoDaInteracaoPublica(),
    CONFIGURACAO_DA_INTERACAO_PUBLICA_DE_FABRICA,
  );
});

test('a porta de e-mail devolve a falha como valor, sem lancar (D3, CA-9.4)', () => {
  const { portas } = portasDeTeste({
    resultadoDeEnvio: { enviado: false, motivo: 'transporte indisponivel' },
  });

  const modulo = criarModuloDeInteracaoPublica(portas);

  // O modulo entrega a porta sem envolve-la: nada entre o chamador e o
  // transporte pode transformar este estado em excecao. CA-9.4 depende disso —
  // "falha no envio do aviso nao desfaz a gravacao do comentario".
  const resultado = modulo.portas.email.enviar({
    destinatarios: ['autor@exemplo.invalido'],
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

test('a porta de cliente externo devolve a falha como valor, sem lancar (CA-16.2, UC-17)', () => {
  const { portas, toques } = portasDeTeste({
    resultadoExterno: { completou: false, motivo: 'origem inalcancavel' },
  });

  const modulo = criarModuloDeInteracaoPublica(portas);

  // Excecao atravessando a cadeia de moderacao a interromperia, e AD-05 exige
  // que quem encerra a decisao seja uma ETAPA, nao um erro de transporte.
  const resultado = modulo.portas.clienteExterno.chamar({
    url: 'https://origem.invalido/pagina',
    metodo: 'GET',
    cabecalhos: {},
    corpo: null,
    tempoLimiteEmSegundos: 10,
    limiteDeRedirecionamentos: 0,
    limiteDeBytesDaResposta: 153600,
    agenteDeUsuario: 'WordPress/7.1.2',
    verificarCertificado: true,
    recusarUrlInsegura: true,
  });

  assert.deepEqual(resultado, {
    completou: false,
    motivo: 'origem inalcancavel',
  });
  // O pedido chegou a porta como foi montado: e por ele que a prova de origem
  // de CA-15.1 vai ser buscada, com os valores que o legado passa.
  assert.equal(toques.chamar.length, 1);
  assert.equal(toques.chamar[0]?.limiteDeBytesDaResposta, 153600);
});
