/**
 * Testes de **T021**: os cinco critérios de US-10 contra o sistema novo —
 * CA-10.1, CA-10.2, CA-10.3, CA-10.4 e CA-10.5.
 *
 * Esta suite e a da **entrega**: ela afirma os critérios, a ordem dos passos, a
 * ordem dos pontos de extensao e o **efeito no banco**, que e o critério de
 * paridade desta area (Decisao 2 de `parity_specs.md`). Os seis casos registrados
 * em `backlog/tests.md` (UT-011-1 a UT-011-6) sao de **T022**, e nao estao aqui —
 * aquele arquivo, aliás, nao existe nesta arvore.
 *
 * O armazenamento e exercitado de verdade, e nao simulado: o repositorio de T021
 * roda sobre um `usermeta` em memoria que reproduz as tres regras que `perfil.ts`
 * declara — repeticao de chave, "gravar valor identico nao escreve nada" e ausencia
 * de transacao. E as assercoes de valor gravado sao sobre os **bytes** do formato
 * serializado, porque e isso que o oraculo vai comparar.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  capacidadesExigidas,
  comAtor,
  perguntarPermissao,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type Capacidade,
  type CasoDeTraducao,
  type ContextoDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import { matrizDeAutorizacao } from '../autorizacao/fonte-de-papeis.js';
import {
  CHAVE_DE_SENHAS_DE_APLICACAO,
  criarArmazenamento,
  criarRepositorioDeSenhasDeAplicacao,
  povoarPapeis,
  type LadoDoConflitoDeNivelNumerico,
  type MetadadoDeConta,
  type RepositorioDeMetadadosDeConta,
} from '../armazenamento/index.js';
import {
  criarPortaDeDadosFalsa,
  textoDoParametro,
} from '../armazenamento/porta-falsa.js';
import type { ValorDeColuna, ValorDeParametro } from '../portas/index.js';
import {
  CAPACIDADES_DE_SENHA_DE_APLICACAO,
  CAPACIDADE_DE_EDICAO_DE_CONTA,
  casoDeSenhaDeAplicacao,
} from './autorizacao-de-senha-de-aplicacao.js';
import type {
  ContextoDeSenhaDeAplicacao,
  CredencialEmitida,
  CredencialRevogada,
} from './contexto-de-senha-de-aplicacao.js';
import { emitirCredencialDeAplicacao } from './emitir-credencial.js';
import {
  COMPRIMENTO_DA_SENHA_DE_APLICACAO,
  agruparSenhaDeAplicacao,
} from './geracao-de-credencial.js';
import { revogarCredencialDeAplicacao } from './revogar-credencial.js';

const LADOS: readonly LadoDoConflitoDeNivelNumerico[] = [
  'legado-integral',
  'req-017-sem-niveis',
];

const TITULAR = 7;
const OUTRA_CONTA = 9;
const INEXISTENTE = 404;
const AGORA = 1_700_000_000;

/**
 * `usermeta` em memoria, com as tres regras que `perfil.ts` declara.
 *
 * Existe aqui, e nao em arquivo de fonte, porque a porta falsa de T002 serve a
 * outra pergunta — *"qual comando sai"* —, e esta suite precisa das duas: ha um
 * teste de comando no fim, e todos os outros precisam de um `usermeta` que **se
 * lembre** do que foi gravado entre duas operacoes.
 */
function usermetaEmMemoria(): {
  readonly perfil: RepositorioDeMetadadosDeConta;
  valorGravado(contaId: number, chave: string): string | null;
  linhas(contaId: number, chave: string): number;
  readonly gravacoes: string[];
  falharProximaGravacao(): void;
} {
  const tabela: MetadadoDeConta[] = [];
  const gravacoes: string[] = [];
  let proximoId = 1;
  let falhar = false;

  const perfil: RepositorioDeMetadadosDeConta = {
    listar(contaId) {
      return tabela.filter((linha) => linha.contaId === contaId);
    },
    obter(contaId, chave) {
      return tabela.filter(
        (linha) => linha.contaId === contaId && linha.chave === chave,
      );
    },
    acrescentar(contaId, chave, valor) {
      const id = proximoId++;
      tabela.push({ id, contaId, chave, valor: comoColuna(valor) });
      return id;
    },
    gravar(contaId, chave, valor) {
      if (falhar) {
        falhar = false;
        return false;
      }
      const existentes = tabela.filter(
        (linha) => linha.contaId === contaId && linha.chave === chave,
      );
      const texto = textoDe(comoColuna(valor));

      // A regra 2 de `perfil.ts`: uma linha com o mesmo valor nao escreve nada.
      if (existentes.length === 1 && textoDe(existentes[0]!.valor) === texto) {
        return false;
      }

      gravacoes.push(texto);
      if (existentes.length === 0) {
        tabela.push({
          id: proximoId++,
          contaId,
          chave,
          valor: comoColuna(valor),
        });
        return true;
      }
      for (const linha of existentes) {
        const posicao = tabela.indexOf(linha);
        tabela[posicao] = { ...linha, valor: comoColuna(valor) };
      }
      return true;
    },
    apagar(contaId, chave) {
      const alvos = tabela.filter(
        (linha) => linha.contaId === contaId && linha.chave === chave,
      );
      for (const linha of alvos) {
        tabela.splice(tabela.indexOf(linha), 1);
      }
      return alvos.length;
    },
    // `apagarPorId` entrou na interface pela T023, que rodou em PARALELO com a
    // T021 e não estava nesta árvore — o dublê desta suíte nasceu sem ela e o
    // merge das duas só acusou no `tsc`. A primitiva é por LINHA: apaga aquele
    // metadado e devolve quantas linhas saíram.
    apagarPorId(metadadoId) {
      const alvo = tabela.find((linha) => linha.id === metadadoId);
      if (!alvo) return 0;
      tabela.splice(tabela.indexOf(alvo), 1);
      return 1;
    },
    idsDeContasComValorContendo(chave, trecho) {
      return tabela
        .filter(
          (linha) =>
            linha.chave === chave && textoDe(linha.valor).includes(trecho),
        )
        .map((linha) => linha.contaId);
    },
  };

  return {
    perfil,
    valorGravado(contaId, chave) {
      const linha = tabela.find(
        (atual) => atual.contaId === contaId && atual.chave === chave,
      );
      return linha === undefined ? null : textoDe(linha.valor);
    },
    linhas(contaId, chave) {
      return tabela.filter(
        (linha) => linha.contaId === contaId && linha.chave === chave,
      ).length;
    },
    gravacoes,
    falharProximaGravacao() {
      falhar = true;
    },
  };
}

function comoColuna(valor: ValorDeParametro): ValorDeColuna {
  return valor as ValorDeColuna;
}

function textoDe(valor: ValorDeColuna): string {
  if (valor instanceof Uint8Array) {
    return new TextDecoder().decode(valor);
  }
  return valor === null || valor === undefined ? '' : String(valor);
}

/** Um sorteio determinista: devolve sempre o mesmo indice, e conta as chamadas. */
function sorteioFixo(indice: number): {
  readonly aleatorio: (limite: number) => number;
  chamadas(): number;
} {
  let chamadas = 0;
  return {
    aleatorio(limite) {
      chamadas += 1;
      return indice % limite;
    },
    chamadas: () => chamadas,
  };
}

/** Um sorteio que percorre o alfabeto, para ver 24 caracteres diferentes. */
function sorteioEmSequencia(): (limite: number) => number {
  let proximo = 0;
  return (limite) => {
    const valor = proximo % limite;
    proximo += 1;
    return valor;
  };
}

interface Cenario {
  readonly contexto: ContextoDeSenhaDeAplicacao;
  readonly banco: ReturnType<typeof usermetaEmMemoria>;
  readonly ganchos: {
    readonly emitidos: {
      contaId: number;
      credencial: CredencialEmitida;
      segredo: string;
      nomePedido: string;
    }[];
    readonly revogados: { contaId: number; credencial: CredencialRevogada }[];
    readonly ordem: string[];
  };
  readonly marcasDeUso: string[];
}

interface OpcoesDoCenario {
  readonly ator?: AtorDeAutorizacao;
  readonly lado?: LadoDoConflitoDeNivelNumerico;
  readonly contasExistentes?: readonly number[];
  readonly casosDeEdicaoDeConta?: readonly CasoDeTraducao[];
  readonly aleatorio?: (limite: number) => number;
  readonly comRegistroDeUso?: boolean;
}

/** O titular do fluxo principal de UC-22: assinante, no proprio perfil. */
function assinante(contaId: number = TITULAR): AtorDeAutorizacao {
  return {
    contaId,
    login: 'ada',
    existe: true,
    concessoes: [{ capacidade: 'subscriber', concedida: true }],
  };
}

function administrador(contaId: number = 1): AtorDeAutorizacao {
  return {
    contaId,
    login: 'root',
    existe: true,
    concessoes: [{ capacidade: 'administrator', concedida: true }],
  };
}

function baseDeAutorizacao(opcoes: OpcoesDoCenario): BaseDeAutorizacao {
  const existentes = new Set(
    opcoes.contasExistentes ?? [TITULAR, OUTRA_CONTA, 1],
  );
  const caso = casoDeSenhaDeAplicacao({
    contaExiste: (contaId) => existentes.has(contaId),
    ...(opcoes.casosDeEdicaoDeConta === undefined
      ? {}
      : { casosDeEdicaoDeConta: opcoes.casosDeEdicaoDeConta }),
  });

  return {
    matriz: matrizDeAutorizacao(povoarPapeis(opcoes.lado ?? 'legado-integral')),
    rede: REDE_INATIVA_NA_AUTORIZACAO,
    // Os casos de `edit_user` entram DUAS vezes, e e assim que a composicao tem
    // de fazer: na cadeia, porque `edit_user` tambem e perguntado direto, e na
    // reentrada do caso de credencial, porque e ela que o atalho de `PERM-6`
    // percorre. No legado sao a mesma coisa — um `switch` que chama a si mesmo.
    casosDeTraducao: [caso, ...(opcoes.casosDeEdicaoDeConta ?? [])],
  };
}

function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const banco = usermetaEmMemoria();
  const ganchos: Cenario['ganchos'] = {
    emitidos: [],
    revogados: [],
    ordem: [],
  };
  const marcasDeUso: string[] = [];
  let emUso = false;

  const autorizacao: ContextoDeAutorizacao = comAtor(
    baseDeAutorizacao(opcoes),
    opcoes.ator ?? assinante(),
  );

  let identificadores = 0;

  const contexto: ContextoDeSenhaDeAplicacao = {
    relogio: { agoraEmSegundos: () => AGORA },
    credenciais: criarRepositorioDeSenhasDeAplicacao(banco.perfil),
    autorizacao,
    resumo: { gerar: (segredo) => `$resumo$${segredo.length}` },
    // O saneamento do pacote nao existe nesta arvore: aqui vale um que corta as
    // pontas, o suficiente para afirmar a ORDEM em que ele e aplicado.
    sanitizarTexto: (texto) => texto.trim(),
    aleatorio: opcoes.aleatorio ?? sorteioFixo(0).aleatorio,
    gerarIdentificador: () => {
      identificadores += 1;
      return `uuid-${identificadores}`;
    },
    ganchos: {
      aoEmitirCredencial: (contaId, credencial, segredo, pedido) => {
        ganchos.ordem.push('emitir');
        ganchos.emitidos.push({
          contaId,
          credencial,
          segredo,
          nomePedido: pedido.nome,
        });
      },
      aoRevogarCredencial: (contaId, credencial) => {
        ganchos.ordem.push('revogar');
        ganchos.revogados.push({ contaId, credencial });
      },
    },
    ...(opcoes.comRegistroDeUso === true
      ? {
          usoNaInstalacao: {
            estaEmUso: () => {
              marcasDeUso.push('leu');
              return emUso;
            },
            marcarEmUso: () => {
              marcasDeUso.push('marcou');
              emUso = true;
            },
          },
        }
      : {}),
  };

  return { contexto, banco, ganchos, marcasDeUso };
}

test('CA-10.1: o segredo tem 24 caracteres, do alfabeto sem caractere especial', () => {
  const { contexto } = cenario({ aleatorio: sorteioEmSequencia() });

  const resultado = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Leitor de feed' },
    contexto,
  );

  assert.equal(resultado.emitida, true);
  assert.ok(resultado.emitida);
  assert.equal(resultado.segredo.length, COMPRIMENTO_DA_SENHA_DE_APLICACAO);
  assert.equal(resultado.segredo.length, 24);
  assert.match(resultado.segredo, /^[A-Za-z0-9]{24}$/);
});

test('CA-10.1: o sorteio e por caractere, 24 vezes — e nao um bloco de bytes', () => {
  const sorteio = sorteioFixo(3);
  const { contexto } = cenario({ aleatorio: sorteio.aleatorio });

  emitirCredencialDeAplicacao({ contaId: TITULAR, nome: 'Agenda' }, contexto);

  assert.equal(sorteio.chamadas(), 24);
});

test('CA-10.1 e CA-10.2: so o resumo e gravado; o segredo nao esta no metadado', () => {
  const { contexto, banco } = cenario({ aleatorio: sorteioEmSequencia() });

  const resultado = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Agenda' },
    contexto,
  );
  assert.ok(resultado.emitida);

  const gravado = banco.valorGravado(TITULAR, CHAVE_DE_SENHAS_DE_APLICACAO);
  assert.ok(gravado !== null);
  assert.ok(gravado.includes('$resumo$24'));
  assert.equal(gravado.includes(resultado.segredo), false);
});

test('CA-10.2: nenhuma leitura do que ficou gravado devolve o segredo', () => {
  const { contexto } = cenario({ aleatorio: sorteioEmSequencia() });

  const resultado = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Agenda' },
    contexto,
  );
  assert.ok(resultado.emitida);

  // A unica superficie de leitura que T021 entrega e o repositorio, e o que ele
  // devolve e o item gravado — sem campo que carregue o segredo. A excecao de
  // UC-22 e esta: "nao ha recuperacao: so o hash foi guardado".
  const gravados = contexto.credenciais.obter(TITULAR);
  assert.equal(gravados.length, 1);
  assert.equal(
    JSON.stringify(gravados).includes(resultado.segredo),
    false,
    'o segredo nao pode sobreviver em nenhum campo do que foi gravado',
  );
});

test('CA-10.5: o item gravado tem os sete campos do legado, na ordem, com nome, criacao e ultimo uso', () => {
  const { contexto, banco } = cenario();

  const resultado = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Leitor de feed', aplicacaoId: 'app-1' },
    contexto,
  );
  assert.ok(resultado.emitida);

  // Os bytes, e nao a forma interpretada: e o que o oraculo compara.
  assert.equal(
    banco.valorGravado(TITULAR, CHAVE_DE_SENHAS_DE_APLICACAO),
    'a:1:{i:0;a:7:{s:4:"uuid";s:6:"uuid-1";s:6:"app_id";s:5:"app-1";' +
      's:4:"name";s:14:"Leitor de feed";s:8:"password";s:10:"$resumo$24";' +
      's:7:"created";i:1700000000;s:9:"last_used";N;s:7:"last_ip";N;}}',
  );

  assert.deepEqual(resultado.credencial, {
    identificador: 'uuid-1',
    aplicacaoId: 'app-1',
    nome: 'Leitor de feed',
    resumo: '$resumo$24',
    criadoEm: AGORA,
    ultimoUsoEm: null,
    ultimoIp: null,
  });
});

test('CA-10.3: revogar tira o item, e nao sobra resumo contra o qual conferir', () => {
  const { contexto, banco } = cenario();

  const primeira = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Agenda' },
    contexto,
  );
  const segunda = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Leitor' },
    contexto,
  );
  assert.ok(primeira.emitida && segunda.emitida);

  const revogacao = revogarCredencialDeAplicacao(
    { contaId: TITULAR, identificador: primeira.credencial.identificador },
    contexto,
  );

  assert.ok(revogacao.revogada);
  assert.equal(revogacao.credencial.nome, 'Agenda');

  const restantes = contexto.credenciais.obter(TITULAR);
  assert.equal(restantes.length, 1);

  const gravado = banco.valorGravado(TITULAR, CHAVE_DE_SENHAS_DE_APLICACAO);
  assert.ok(gravado !== null);
  assert.equal(gravado.includes('uuid-1'), false);
  assert.ok(gravado.includes('uuid-2'));
});

test('CA-10.3: revogar a ultima grava o arranjo vazio e NAO apaga a linha de metadado', () => {
  const { contexto, banco } = cenario();

  const unica = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Agenda' },
    contexto,
  );
  assert.ok(unica.emitida);

  revogarCredencialDeAplicacao(
    { contaId: TITULAR, identificador: unica.credencial.identificador },
    contexto,
  );

  assert.equal(banco.linhas(TITULAR, CHAVE_DE_SENHAS_DE_APLICACAO), 1);
  assert.equal(
    banco.valorGravado(TITULAR, CHAVE_DE_SENHAS_DE_APLICACAO),
    'a:0:{}',
  );
});

test('apagar o item do meio nao reindexa, e a credencial seguinte nasce depois do maior', () => {
  const { contexto, banco } = cenario();

  emitirCredencialDeAplicacao({ contaId: TITULAR, nome: 'Um' }, contexto);
  const doMeio = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Dois' },
    contexto,
  );
  emitirCredencialDeAplicacao({ contaId: TITULAR, nome: 'Tres' }, contexto);
  assert.ok(doMeio.emitida);

  revogarCredencialDeAplicacao(
    { contaId: TITULAR, identificador: doMeio.credencial.identificador },
    contexto,
  );
  emitirCredencialDeAplicacao({ contaId: TITULAR, nome: 'Quatro' }, contexto);

  const gravado = banco.valorGravado(TITULAR, CHAVE_DE_SENHAS_DE_APLICACAO);
  assert.ok(gravado !== null);
  // As chaves gravadas sao 0, 2 e 3: o vao do item apagado fica, e a credencial
  // nova nasce em 3. Ver a PARADA em `proximaChaveDaLista`.
  assert.deepEqual(
    contexto.credenciais.obter(TITULAR).map((registro) => registro.chave),
    [
      { tipo: 'inteiro', valor: 0 },
      { tipo: 'inteiro', valor: 2 },
      { tipo: 'inteiro', valor: 3 },
    ],
  );
});

test('CA-10.4: o titular administra a propria credencial — lista vazia significa permitido', () => {
  for (const lado of LADOS) {
    const { contexto, banco } = cenario({ lado, ator: assinante() });

    // O assinante de fabrica tem `read` e nada mais: se a lista exigida nao fosse
    // vazia, nenhuma das seis capacidades passaria.
    assert.deepEqual(
      capacidadesExigidas(contexto.autorizacao, 'create_app_password', TITULAR),
      [],
    );

    const resultado = emitirCredencialDeAplicacao(
      { contaId: TITULAR, nome: 'Agenda' },
      contexto,
    );
    assert.ok(resultado.emitida, `lado ${lado}`);
    assert.equal(banco.linhas(TITULAR, CHAVE_DE_SENHAS_DE_APLICACAO), 1);
  }
});

test('CA-10.4: as seis capacidades exigem exatamente o que editar aquela conta exige', () => {
  // O `case` de `edit_user` e de T023; aqui ele entra como dublê, para afirmar que
  // a traducao DELEGA em vez de decidir por conta propria.
  const edicaoDeConta: CasoDeTraducao = (pedido) =>
    pedido.capacidade === CAPACIDADE_DE_EDICAO_DE_CONTA
      ? ['edit_users', 'list_users']
      : null;

  const { contexto } = cenario({
    ator: administrador(),
    casosDeEdicaoDeConta: [edicaoDeConta],
  });

  const deEdicao = capacidadesExigidas(
    contexto.autorizacao,
    CAPACIDADE_DE_EDICAO_DE_CONTA,
    OUTRA_CONTA,
  );

  for (const capacidade of CAPACIDADES_DE_SENHA_DE_APLICACAO) {
    assert.deepEqual(
      capacidadesExigidas(contexto.autorizacao, capacidade, OUTRA_CONTA),
      deEdicao,
      `${capacidade} tem de exigir o mesmo que ${CAPACIDADE_DE_EDICAO_DE_CONTA}`,
    );
  }

  // E com o dublê registrado, o administrador de fabrica administra a credencial
  // de outra conta — que e o fluxo alternativo de UC-22, e o que fecha quando T023
  // registrar o `case` de verdade.
  assert.equal(
    perguntarPermissao(
      contexto.autorizacao,
      'create_app_password',
      OUTRA_CONTA,
    ),
    true,
  );
});

test('CA-10.4: sem o `case` de T023, administrar a credencial de outra conta e NEGADO', () => {
  // A consequencia declarada no cabecalho de
  // `autorizacao-de-senha-de-aplicacao.ts`: hoje este sistema e mais FECHADO que o
  // legado neste ponto. O teste existe para que a mudanca de T023 apareca.
  const { contexto, banco } = cenario({ ator: administrador() });

  assert.deepEqual(
    capacidadesExigidas(
      contexto.autorizacao,
      'create_app_password',
      OUTRA_CONTA,
    ),
    [CAPACIDADE_DE_EDICAO_DE_CONTA],
  );

  const resultado = emitirCredencialDeAplicacao(
    { contaId: OUTRA_CONTA, nome: 'Agenda' },
    contexto,
  );

  assert.deepEqual(resultado, { emitida: false, motivo: 'sem-permissao' });
  assert.equal(banco.linhas(OUTRA_CONTA, CHAVE_DE_SENHAS_DE_APLICACAO), 0);
  assert.deepEqual(banco.gravacoes, []);
});

test('CA-10.4: conta alvo inexistente nega — "not even themselves"', () => {
  const { contexto, banco } = cenario({
    ator: assinante(INEXISTENTE),
    contasExistentes: [TITULAR],
  });

  const capacidades: readonly Capacidade[] = CAPACIDADES_DE_SENHA_DE_APLICACAO;
  for (const capacidade of capacidades) {
    assert.deepEqual(
      capacidadesExigidas(contexto.autorizacao, capacidade, INEXISTENTE),
      ['do_not_allow'],
      `${capacidade} sobre conta inexistente`,
    );
  }

  const emissao = emitirCredencialDeAplicacao(
    { contaId: INEXISTENTE, nome: 'Agenda' },
    contexto,
  );
  const revogacao = revogarCredencialDeAplicacao(
    { contaId: INEXISTENTE, identificador: 'uuid-1' },
    contexto,
  );

  assert.deepEqual(emissao, { emitida: false, motivo: 'sem-permissao' });
  assert.deepEqual(revogacao, { revogada: false, motivo: 'sem-permissao' });
  assert.deepEqual(banco.gravacoes, []);
});

test('CA-10.4: capacidade de credencial sem a conta alvo no argumento nega', () => {
  const { contexto } = cenario();

  assert.deepEqual(
    capacidadesExigidas(contexto.autorizacao, 'create_app_password'),
    ['do_not_allow'],
  );
});

test('o identificador da conta alvo e comparado como no legado: texto e numero sao a mesma conta', () => {
  const { contexto } = cenario({ ator: assinante(TITULAR) });

  assert.deepEqual(
    capacidadesExigidas(
      contexto.autorizacao,
      'create_app_password',
      String(TITULAR),
    ),
    [],
  );
});

test('o nome vazio e recusado, e o nome `0` conta como vazio', () => {
  const { contexto, banco } = cenario();

  for (const nome of ['', '   ', '0']) {
    const resultado = emitirCredencialDeAplicacao(
      { contaId: TITULAR, nome },
      contexto,
    );
    assert.ok(!resultado.emitida);
    assert.ok(resultado.motivo === 'recusada');
    assert.equal(resultado.erro.codigo, 'application_password_empty_name');
    assert.equal(
      resultado.erro.mensagem,
      'An application name is required to create an application password.',
    );
  }

  // `00` nao e vazio para o legado, e por isso e aceito.
  assert.ok(
    emitirCredencialDeAplicacao({ contaId: TITULAR, nome: '00' }, contexto)
      .emitida,
  );
  assert.deepEqual(banco.gravacoes.length, 1);
});

test('o nome repetido e recusado, em caixa — e o saneamento vem ANTES da conferencia', () => {
  const { contexto } = cenario();

  assert.ok(
    emitirCredencialDeAplicacao({ contaId: TITULAR, nome: 'Agenda' }, contexto)
      .emitida,
  );

  const repetido = emitirCredencialDeAplicacao(
    // Com espaco nas pontas: o saneamento o tira, e e o nome saneado que colide.
    { contaId: TITULAR, nome: '  AGENDA  ' },
    contexto,
  );

  assert.ok(!repetido.emitida);
  assert.ok(repetido.motivo === 'recusada');
  assert.equal(repetido.erro.codigo, 'application_password_duplicate_name');
  assert.equal(repetido.erro.mensagem, 'Each application name should be unique.');

  // Em outra conta o mesmo nome passa: a unicidade e por conta.
  const outra = cenario({ ator: assinante(OUTRA_CONTA) });
  assert.ok(
    emitirCredencialDeAplicacao(
      { contaId: OUTRA_CONTA, nome: 'Agenda' },
      outra.contexto,
    ).emitida,
  );
});

test('a falha de gravacao e recusa com `db_error`, e as duas operacoes tem mensagens diferentes', () => {
  const emissao = cenario();
  emissao.banco.falharProximaGravacao();

  const recusada = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Agenda' },
    emissao.contexto,
  );
  assert.ok(!recusada.emitida);
  assert.ok(recusada.motivo === 'recusada');
  assert.equal(recusada.erro.codigo, 'db_error');
  assert.equal(recusada.erro.mensagem, 'Could not save application password.');
  // A recusa de gravacao nao dispara o ponto de extensao.
  assert.deepEqual(emissao.ganchos.ordem, []);

  const revogacao = cenario();
  const emitida = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Agenda' },
    revogacao.contexto,
  );
  assert.ok(emitida.emitida);
  revogacao.banco.falharProximaGravacao();

  const naoRevogou = revogarCredencialDeAplicacao(
    { contaId: TITULAR, identificador: emitida.credencial.identificador },
    revogacao.contexto,
  );
  assert.ok(!naoRevogou.revogada);
  assert.ok(naoRevogou.motivo === 'recusada');
  assert.equal(naoRevogou.erro.codigo, 'db_error');
  assert.equal(
    naoRevogou.erro.mensagem,
    'Could not delete application password.',
  );
});

test('revogar identificador que nao existe recusa e nao grava nada', () => {
  const { contexto, banco } = cenario();

  emitirCredencialDeAplicacao({ contaId: TITULAR, nome: 'Agenda' }, contexto);
  const gravacoesAntes = banco.gravacoes.length;

  const resultado = revogarCredencialDeAplicacao(
    { contaId: TITULAR, identificador: 'uuid-nao-existe' },
    contexto,
  );

  assert.ok(!resultado.revogada);
  assert.ok(resultado.motivo === 'recusada');
  assert.equal(resultado.erro.codigo, 'application_password_not_found');
  assert.equal(
    resultado.erro.mensagem,
    'Could not find an application password with that id.',
  );
  assert.equal(banco.gravacoes.length, gravacoesAntes);
});

test('P2: os dois pontos de extensao disparam DEPOIS da gravacao, na ordem e com os argumentos declarados', () => {
  const { contexto, ganchos } = cenario({ aleatorio: sorteioEmSequencia() });

  const emitida = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: '  Agenda  ' },
    contexto,
  );
  assert.ok(emitida.emitida);

  revogarCredencialDeAplicacao(
    { contaId: TITULAR, identificador: emitida.credencial.identificador },
    contexto,
  );

  assert.deepEqual(ganchos.ordem, ['emitir', 'revogar']);

  // O ponto da emissao recebe o segredo em claro: e o legado que o passa, e e o
  // unico lugar deste pacote em que ele atravessa uma fronteira.
  // Sao quatro argumentos, e o quarto e o pedido como chegou — com o nome ANTES
  // do saneamento, que e o que o legado passa.
  assert.deepEqual(ganchos.emitidos, [
    {
      contaId: TITULAR,
      credencial: emitida.credencial,
      segredo: emitida.segredo,
      nomePedido: '  Agenda  ',
    },
  ]);

  // O da revogacao recebe o item apagado, na forma em que estava gravado.
  assert.equal(ganchos.revogados.length, 1);
  assert.equal(ganchos.revogados[0]?.contaId, TITULAR);
  assert.equal(ganchos.revogados[0]?.credencial.nome, 'Agenda');
  assert.equal(ganchos.revogados[0]?.credencial.ultimoUsoEm, null);
});

test('a marca de uso da instalacao e lida antes de ser escrita, e so na primeira emissao', () => {
  const { contexto, marcasDeUso } = cenario({ comRegistroDeUso: true });

  emitirCredencialDeAplicacao({ contaId: TITULAR, nome: 'Um' }, contexto);
  emitirCredencialDeAplicacao({ contaId: TITULAR, nome: 'Dois' }, contexto);

  assert.deepEqual(marcasDeUso, ['leu', 'marcou', 'leu']);
});

test('sem o colaborador de uso, nada e escrito fora do metadado da conta', () => {
  const { contexto, marcasDeUso, banco } = cenario();

  emitirCredencialDeAplicacao({ contaId: TITULAR, nome: 'Um' }, contexto);

  assert.deepEqual(marcasDeUso, []);
  assert.equal(banco.gravacoes.length, 1);
});

test('efeito no banco: a emissao emite UM comando de escrita, em `usermeta`, com os bytes do arranjo', () => {
  // Aqui o alvo e outro: nao o comportamento, e **qual comando sai** — a pergunta
  // que a porta falsa de T002 existe para responder, e o critério de paridade
  // desta area (Decisao 2 de `parity_specs.md`).
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);

  const contexto: ContextoDeSenhaDeAplicacao = {
    relogio: { agoraEmSegundos: () => AGORA },
    credenciais: armazenamento.senhasDeAplicacao,
    autorizacao: comAtor(baseDeAutorizacao({}), assinante()),
    resumo: { gerar: () => '$resumo$' },
    sanitizarTexto: (texto) => texto.trim(),
    aleatorio: sorteioFixo(0).aleatorio,
    gerarIdentificador: () => 'uuid-1',
  };

  const resultado = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Agenda' },
    contexto,
  );
  assert.ok(resultado.emitida);

  assert.equal(falsa.escritas.length, 1);
  const escrita = falsa.escritas[0];
  assert.equal(
    escrita?.texto,
    'INSERT INTO wp_usermeta (user_id, meta_key, meta_value) VALUES (?, ?, ?)',
  );
  assert.equal(escrita?.parametros[0], TITULAR);
  assert.equal(escrita?.parametros[1], CHAVE_DE_SENHAS_DE_APLICACAO);
  assert.equal(
    textoDoParametro(escrita?.parametros[2]),
    'a:1:{i:0;a:7:{s:4:"uuid";s:6:"uuid-1";s:6:"app_id";s:0:"";' +
      's:4:"name";s:6:"Agenda";s:8:"password";s:8:"$resumo$";' +
      's:7:"created";i:1700000000;s:9:"last_used";N;s:7:"last_ip";N;}}',
  );

  // E as leituras: a lista, e a conferencia que a gravacao de metadado faz antes
  // de decidir entre inserir e atualizar. Nenhuma outra.
  assert.deepEqual(
    falsa.selecoes.map((consulta) => consulta.parametros[1]),
    [CHAVE_DE_SENHAS_DE_APLICACAO, CHAVE_DE_SENHAS_DE_APLICACAO],
  );
});

test('o agrupamento de exibicao e de quatro em quatro, e nao altera o segredo emitido', () => {
  const { contexto } = cenario({ aleatorio: sorteioEmSequencia() });

  const resultado = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Agenda' },
    contexto,
  );
  assert.ok(resultado.emitida);

  const agrupado = agruparSenhaDeAplicacao(resultado.segredo);
  assert.equal(agrupado.split(' ').length, 6);
  assert.equal(agrupado.replace(/ /g, ''), resultado.segredo);
  assert.equal(agruparSenhaDeAplicacao('ab cd-ef'), 'abcd ef');
});
