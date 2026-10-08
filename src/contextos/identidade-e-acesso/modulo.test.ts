/**
 * Testes da entrega de T001: "o modulo carrega com as portas de dados, de envio
 * de e-mail e de relogio declaradas, e nenhuma regra de negocio implementada".
 *
 * Nao sao os testes de nenhuma historia — esses sao T004, T006, T008 e os
 * demais `[P]` de `tasks.md`, um por caso de `backlog/tests.md`. Aqui se afirma
 * so o que T001 entrega, mais as duas invariantes de arquitetura que um
 * esqueleto pode quebrar em silencio: estado de modulo (`EXT-CONTEXTO`) e
 * trabalho no carregamento (`EXT-ORDEM`).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarModuloDeIdentidadeEAcesso,
  type Consulta,
  type MensagemDeEmail,
  type PortaDeDados,
  type PortaDeEmail,
  type PortaDeRelogio,
  type PortasDeIdentidadeEAcesso,
  type ResultadoDeEnvio,
  type ResultadoDeEscrita,
} from './index.js';

/** Conta os toques em cada porta, para afirmar que o modulo nao as usa ainda. */
interface Toques {
  selecionar: Consulta[];
  escrever: Consulta[];
  enviar: MensagemDeEmail[];
  relogio: number;
}

function portasDeTeste(
  prefixoDeTabela = 'wp_',
  prefixoBaseDeTabela = prefixoDeTabela,
  resultadoDeEnvio: ResultadoDeEnvio = { enviado: true },
): { portas: PortasDeIdentidadeEAcesso; toques: Toques } {
  const toques: Toques = {
    selecionar: [],
    escrever: [],
    enviar: [],
    relogio: 0,
  };

  const dados: PortaDeDados = {
    prefixoDeTabela,
    prefixoBaseDeTabela,
    selecionar(consulta) {
      toques.selecionar.push(consulta);
      return [];
    },
    escrever(consulta): ResultadoDeEscrita {
      toques.escrever.push(consulta);
      return { linhasAfetadas: 0, idGerado: null };
    },
  };

  const email: PortaDeEmail = {
    enviar(mensagem) {
      toques.enviar.push(mensagem);
      return resultadoDeEnvio;
    },
  };

  const relogio: PortaDeRelogio = {
    agoraEmSegundos() {
      toques.relogio += 1;
      return 0;
    },
  };

  return { portas: { dados, email, relogio }, toques };
}

test('o modulo carrega com as tres portas declaradas', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeIdentidadeEAcesso(portas);

  assert.equal(modulo.nome, 'identidade-e-acesso');
  assert.equal(modulo.portas.dados, portas.dados);
  assert.equal(modulo.portas.email, portas.email);
  assert.equal(modulo.portas.relogio, portas.relogio);
});

test('a superficie do modulo tem exatamente as operacoes das tarefas fechadas', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeIdentidadeEAcesso(portas);

  // Esta lista cresce NA TAREFA DE CADA HISTORIA, nunca antes: e o que o P4 da
  // constituicao cobra, "toda operacao exposta nova nasce com declaracao
  // explicita de permissao".
  //
  // T001: nenhuma operacao, so as portas. T002: `armazenamento`, a forma de
  // armazenamento de conta, perfil, sessao e definicao de papel, que nao expoe
  // operacao de dominio nenhuma. T003 (US-1): `autenticar`, com a permissao
  // declarada na interface do modulo — nenhuma capacidade, porque UC-19 fixa
  // que o papel decide o que a pessoa faz depois, nao se ela entra. T005
  // (US-2): `sair`, tambem sem capacidade nenhuma — o que guarda a rota de
  // saida e o atestado de nonce, que nao e deste pacote.
  //
  // As duas operacoes de encerramento de sessao que BR-MIGRAR-111 manda portar
  // **definidas e sem chamador** NAO entram nesta lista: elas saem pelo barril,
  // como as funcoes globais que sao no legado, e nenhum fluxo do produto as
  // invoca. Ver `sessao/encerramento-de-sessao.ts`.
  // que o papel decide o que a pessoa faz depois, nao se ela entra. T007
  // (US-3): `sessaoDaRequisicao`, tambem sem capacidade exigida, porque e ela
  // que PRODUZ a identidade com que as capacidades sao decididas. T009 (US-4):
  // `solicitarRedefinicaoDeSenha` e `redefinirSenha`, as duas sem capacidade
  // nenhuma — a chave de redefinicao e um dos CINCO ATESTADOS que o P4 manda
  // nao esconder, e UC-20 fixa que "a posse do e-mail e a autorizacao".
  // que PRODUZ a identidade com que as capacidades sao decididas. T013 (US-6):
  // `cadastrar`, tambem sem capacidade — quem autoriza e a OPCAO
  // `users_can_register`, que nasce desligada (`U1`), e o ator e o visitante,
  // que por definicao nao tem papel.
  //
  // T021 (US-10): `emitirCredencialDeAplicacao` e
  // `revogarCredencialDeAplicacao`, as duas com `edit_user` da conta alvo
  // declarado na interface do modulo — e sao as PRIMEIRAS operacoes desta lista
  // que exigem capacidade. As quatro anteriores declaram "nenhuma"; estas
  // declaram a de UC-22, e CA-10.4 e o critério que a cobra.
  //
  // T023 (US-11): mais CINCO que exigem capacidade — `promoverContas`,
  // `apagarContas`, `removerContasDoSite`, `criarContaPorAdministrador` e
  // `alterarContaPorAdministrador` —, e cada uma exige DUAS: a da acao e a da
  // conta alvo, uma a uma (CA-11.1, e os passos 3 e 4 de UC-24). A declaracao
  // de cada uma esta na interface do modulo.
  //
  // T015 (US-7) e T019 (US-9) **nao** entram nesta lista, e continuam fora de
  // proposito: "perguntar permissao" e operacao da plataforma, que fica abaixo
  // de todo contexto, e o que BC-05 acrescenta ali e leitura de dado. Ver o
  // comentario do `index.ts` onde aqueles exports entram.
  assert.deepEqual(Object.keys(modulo).sort(), [
    'alterarContaPorAdministrador',
    'apagarContas',
    'armazenamento',
    'autenticar',
    'cadastrar',
    'criarContaPorAdministrador',
    'emitirCredencialDeAplicacao',
    'nome',
    'portas',
    'promoverContas',
    'redefinirSenha',
    'removerContasDoSite',
    'revogarCredencialDeAplicacao',
    'sair',
    'sessaoDaRequisicao',
    'solicitarRedefinicaoDeSenha',
  ]);
});

test('criar o modulo nao toca em porta nenhuma (EXT-ORDEM: nada se resolve no carregamento)', () => {
  const { portas, toques } = portasDeTeste();

  criarModuloDeIdentidadeEAcesso(portas);

  assert.deepEqual(toques.selecionar, []);
  assert.deepEqual(toques.escrever, []);
  assert.deepEqual(toques.enviar, []);
  assert.equal(toques.relogio, 0);
});

test('duas composicoes nao compartilham estado (EXT-CONTEXTO, BR-MIGRAR-105)', () => {
  const primeira = portasDeTeste('wp_');
  const segunda = portasDeTeste('wp_2_', 'wp_');

  const moduloA = criarModuloDeIdentidadeEAcesso(primeira.portas);
  const moduloB = criarModuloDeIdentidadeEAcesso(segunda.portas);

  assert.notEqual(moduloA, moduloB);
  assert.equal(moduloA.portas.dados.prefixoDeTabela, 'wp_');
  assert.equal(moduloB.portas.dados.prefixoDeTabela, 'wp_2_');

  // O prefixo carrega o identificador do site (BR-MIGRAR-088): se o modulo
  // guardasse a porta em estado de modulo, duas requisicoes de sites diferentes
  // leriam a autorizacao uma da outra.
  moduloA.portas.dados.selecionar({ texto: 'SELECT 1', parametros: [] });
  assert.equal(primeira.toques.selecionar.length, 1);
  assert.equal(segunda.toques.selecionar.length, 0);
});

test('a porta de e-mail devolve a falha como valor, sem lancar (D3, CA-5.1, CA-5.2)', () => {
  const { portas } = portasDeTeste('wp_', 'wp_', {
    enviado: false,
    motivo: 'transporte indisponivel',
  });

  const modulo = criarModuloDeIdentidadeEAcesso(portas);

  // O modulo entrega a porta sem envolve-la: nada entre o chamador e o
  // transporte pode transformar este estado em excecao.
  const resultado = modulo.portas.email.enviar({
    destinatarios: ['titular@exemplo.invalido'],
    assunto: '',
    corpo: '',
    cabecalhos: [],
    anexos: [],
  });

  assert.equal(resultado.enviado, false);
  assert.equal(
    resultado.enviado === false ? resultado.motivo : null,
    'transporte indisponivel',
  );
});
