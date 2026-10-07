/**
 * **T006 — os testes de US-2.** Tres testes, um por caso que `tasks.md` registra
 * para esta tarefa: `UT-002-1`, `UT-002-2` e `UT-002-3`, nessa ordem e com um
 * criterio de aceite cada.
 *
 * | caso | criterio | o que afirma |
 * |---|---|---|
 * | `UT-002-1` | CA-2.1 | sair destroi **apenas** o token da sessao corrente e limpa a credencial do navegador |
 * | `UT-002-2` | CA-2.2 | a sessao aberta em outro dispositivo continua autenticando depois da saida |
 * | `UT-002-3` | CA-2.3 | a requisicao feita com o token destruido e tratada como anonima |
 *
 * ---
 *
 * ## ⚠️ Duas coisas desta tarefa que ninguem resolveu, e que esta suite nao resolve
 *
 * **1. `backlog/tests.md` nao existe nesta arvore.** `tasks.md` manda escrever os
 * tres testes *"com o mesmo dado de entrada, acao e resultado esperado"* do caso
 * registrado em `../../../backlog/tests.md`, e esse arquivo **nao veio no pacote**
 * (nem ele, nem a pasta `backlog/`; `UT-002-1` aparece em `tasks.md` e em mais
 * lugar nenhum). Logo o dado de entrada, a acao e o resultado esperado de cada
 * caso abaixo foram **derivados**, e a derivacao esta declarada em cada teste:
 * do criterio de aceite em `spec.md`, do fluxo alternativo *"Sair do sistema"* de
 * `UC-19` (*"1. Sistema destroi o token da sessao e limpa os cookies. 2. As
 * demais sessoes da mesma conta continuam validas"*), da linha *"encerrar sessao
 * corrente"* da tabela *Contratos* de `plan.md` e de `BR-MIGRAR-111`
 * (`ESC-SESSAO`). Se o catalogo do backlog aparecer e disser outro dado de
 * entrada, **ele ganha** — estes tres testes sao a reconstrucao, nao o registro.
 *
 * **2. T005 nao estava na arvore quando esta suite foi escrita, e T005 traz suite
 * propria.** `tasks.md` poe *"T006 depende de T005"*, e no commit em que esta
 * tarefa comecou a linha de T005 seguia `[ ]` e nenhum arquivo de US-2 existia.
 * Dai duas consequencias, e nenhuma e escolha desta tarefa:
 *
 * - a superficie de US-2 e resolvida **em execucao** (ver
 *   `resolverSuperficieDeUS2`), com o contrato declarado aqui em vez de
 *   importado. Isso e o que faz esta suite ser verificacao **independente**: ela
 *   cobra de US-2 o contrato que `spec.md` e `plan.md` descrevem, e falha —
 *   alto, nomeando o que falta — quando a implementacao nao esta la ou nao tem
 *   essa forma. Com um `import` estatico a suite adotaria em silencio qualquer
 *   forma que a implementacao tivesse;
 * - T005 entrega `sessao/saida.test.ts`, que afirma os **mesmos** tres criterios.
 *   Duas suites para CA-2.1, CA-2.2 e CA-2.3 e trabalho duplicado entre tarefas
 *   da mesma onda — o mesmo que aconteceu com as duas `Conta` de T002 e T003
 *   (ver o bloco de merge em `../index.ts`). Qual das duas fica e **decisao de
 *   produto**, registrada aqui para uma pessoa tomar. Esta suite nao apaga a
 *   outra e nao se funde com ela por conta propria.
 *
 * ---
 *
 * ## O que esta suite nao afirma, de proposito
 *
 * - **Cookie, nonce e carencia de 12 horas.** Validar a credencial do navegador,
 *   com o fragmento de 4 caracteres do hash da senha na chave do HMAC, e US-3 /
 *   T007. CA-2.3 se afirma aqui no **registro de sessoes** — o token destruido
 *   nao abre mais sessao — e na identidade corrente da requisicao. A outra ponta
 *   e da tarefa dela, e o risco 3 de `plan.md` avisa que e *"o tipo de detalhe
 *   que um porte perde sem o teste notar"*.
 * - **`encerrarOutras` e `encerrarTodas`.** `BR-MIGRAR-111` manda portar as duas
 *   *"definidas e sem chamador"* e o cenario de paridade da area cobra que
 *   *"nenhum caminho de uso do produto as invoca"*. Elas nao sao US-2: o criterio
 *   de US-2 e o oposto — CA-2.2 exige que as outras sessoes **sobrevivam**.
 *   Chama-las aqui seria dar-lhes o chamador que o legado nao tem.
 * - **Limite de quantidade de sessao e poda do que venceu.** Nenhum dos dois e
 *   regra do legado neste fluxo (P6: numero que o legado nao tem nao se inventa);
 *   o descarte do que venceu e de T007, que tem o relogio.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { expiracaoDoToken } from '../autenticacao/prazos-de-sessao.js';
import {
  abrirSessao,
  resumoDoTokenDeSessao,
  type ArmazenamentoDeSessoes,
  type MapaDeSessoes,
  type Sessao,
} from './registro-de-sessoes.js';

/*
  ── O CONTRATO DE US-2, COMO ESTA SUITE O COBRA ─────────────────────────────

  Declarado aqui, e nao importado, pelo motivo do item 2 do cabecalho. Cada campo
  abaixo vem de um documento do pacote, e a origem esta dita no comentario: o que
  nao tem origem declarada nao e cobrado.
*/

/** A identidade desta requisicao — escopo de REQUISICAO (AD-02, BR-MIGRAR-105). */
interface IdentidadeCorrente {
  /** A conta autenticada, ou `0` quando anonima — o valor do legado. */
  readonly idDaConta: number;
  /** O token corrente, lido da credencial do navegador. Vazio quando nao ha. */
  readonly tokenDaSessao: string;
  /** Torna a identidade anonima **ainda nesta requisicao** (CA-2.3). */
  tornarAnonima(): void;
}

/**
 * A limpeza da credencial guardada no navegador (CA-2.1).
 *
 * ⚠️ **Quais cookies exatamente a limpeza cobre nao esta registrado em documento
 * nenhum deste pacote.** CA-2.1 fala no plural — *"limpa as credenciais
 * guardadas no navegador"* — e e esse plural que esta suite cobra: que a saida
 * chame a limpeza, uma vez, com a conta que esta saindo. A **lista** de cookies
 * e da borda e fecha contra o oraculo (`ESC-ORACULO`, BR-MIGRAR-116), nao aqui.
 */
interface CredenciaisDoNavegador {
  limpar(idDaConta: number): void;
}

/** O contexto que a saida recebe, e o unico estado que ela toca. */
interface ContextoDeSaida {
  readonly sessoes: ArmazenamentoDeSessoes;
  readonly identidade: IdentidadeCorrente;
  readonly credenciaisDoNavegador: CredenciaisDoNavegador;
}

/**
 * O relato da saida.
 *
 * `motivo` existe porque a tabela *Contratos* de `plan.md` declara, para
 * *"encerrar sessao corrente"*, o erro **token inexistente**. ⚠️ O **nome** do
 * codigo nao esta em documento nenhum: `plan.md` nomeia o erro, nao a string.
 * Esta suite cobra o literal que a implementacao de US-2 publica, para que uma
 * troca de nome apareca aqui em vez de passar em silencio — e o literal em si e
 * ponto para a conferencia contra o oraculo.
 */
interface ResultadoDeSaida {
  readonly idDaConta: number;
  readonly sessaoEncerrada: boolean;
  readonly credencialLimpa: true;
  readonly motivo?: 'token-inexistente';
}

/** As tres operacoes de US-2 que estes tres testes exercitam. */
interface SuperficieDeUS2 {
  /** O fluxo de saida: UC-19, alternativo *"Sair do sistema"*. */
  sair(contexto: ContextoDeSaida): ResultadoDeSaida;
  /** Se aquele token ainda abre sessao (CA-2.2, CA-2.3). */
  sessaoEstaAberta(
    armazenamento: ArmazenamentoDeSessoes,
    idDaConta: number,
    token: string,
  ): boolean;
  /** A sessao gravada sob aquele token, ou `null` (CA-2.2). */
  sessaoDoToken(
    armazenamento: ArmazenamentoDeSessoes,
    idDaConta: number,
    token: string,
  ): Sessao | null;
}

const OPERACOES_DE_US2 = [
  'sair',
  'sessaoEstaAberta',
  'sessaoDoToken',
] as const satisfies readonly (keyof SuperficieDeUS2)[];

/**
 * Onde a implementacao de US-2 e procurada.
 *
 * Os dois caminhos sao os modulos que T005 entrega. Sao **variaveis**, e nao
 * literais no `import`, exatamente para que a ausencia deles seja uma falha de
 * teste com nome — *"US-2 nao esta nesta arvore"* — em lugar de uma falha de
 * compilacao da arvore inteira, que levaria embora tambem as suites de T002 e
 * T003, que nada tem a ver com esta tarefa.
 */
const MODULOS_DE_US2: readonly string[] = [
  './saida.js',
  './encerramento-de-sessao.js',
];

type Resolucao =
  | { readonly disponivel: true; readonly us2: SuperficieDeUS2 }
  | { readonly disponivel: false; readonly faltando: readonly string[] };

/**
 * Resolve a superficie de US-2 e **confere a forma dela** antes de devolver.
 *
 * A conferencia por `typeof` e o que autoriza a conversao da ultima linha: o que
 * chega de um `import` dinamico e `any`, e so depois de cada nome cobrado estar
 * la, e ser funcao, a conversao deixa de ser aposta. Nome que falta volta em
 * `faltando`, e e esse nome que o teste imprime.
 */
async function resolverSuperficieDeUS2(): Promise<Resolucao> {
  const encontrado: Record<string, unknown> = {};

  for (const caminho of MODULOS_DE_US2) {
    let modulo: Record<string, unknown>;
    try {
      modulo = (await import(caminho)) as Record<string, unknown>;
    } catch {
      continue;
    }
    for (const [nome, valor] of Object.entries(modulo)) {
      encontrado[nome] = valor;
    }
  }

  const faltando = OPERACOES_DE_US2.filter(
    (nome) => typeof encontrado[nome] !== 'function',
  );

  if (faltando.length > 0) {
    return { disponivel: false, faltando };
  }
  return { disponivel: true, us2: encontrado as unknown as SuperficieDeUS2 };
}

const RESOLUCAO = await resolverSuperficieDeUS2();

/** A superficie, ou uma falha que diz o que falta e de quem e a tarefa. */
function us2(): SuperficieDeUS2 {
  if (!RESOLUCAO.disponivel) {
    assert.fail(
      `US-2 nao esta nesta arvore: faltam ${RESOLUCAO.faltando.join(', ')}. ` +
        'Estes tres testes sao T006, e `tasks.md` poe "T006 depende de T005" — ' +
        'o comportamento de US-2 e entrega de T005.',
    );
  }
  return RESOLUCAO.us2;
}

/*
  ── O DADO DE ENTRADA DOS TRES CASOS ────────────────────────────────────────
*/

/** O instante do relogio controlado, como o P4 cobra para todo prazo. */
const AGORA = 1_700_000_000;

/** A conta que sai, e uma terceira conta que a saida nao pode tocar. */
const CONTA = 7;
const OUTRA_CONTA = 99;

interface RegistroFalso {
  readonly sessoes: ArmazenamentoDeSessoes;
  /** Toda gravacao, em ordem: e por aqui que se ve o efeito no armazenamento. */
  readonly gravacoes: readonly { readonly idDaConta: number }[];
  mapaDe(idDaConta: number): MapaDeSessoes;
}

/**
 * O registro de sessoes em memoria, atras da porta que T003 declarou.
 *
 * E a mesma costura que a suite de T003 usa: le e grava o mapa inteiro, porque e
 * assim que o legado trata o metadado — um unico valor serializado por conta,
 * lido e reescrito por inteiro.
 */
function registroFalso(): RegistroFalso {
  const porConta = new Map<number, MapaDeSessoes>();
  const gravacoes: { readonly idDaConta: number }[] = [];

  return {
    sessoes: {
      ler: (idDaConta) => porConta.get(idDaConta) ?? {},
      gravar: (idDaConta, sessoes) => {
        porConta.set(idDaConta, sessoes);
        gravacoes.push({ idDaConta });
      },
    },
    gravacoes,
    mapaDe: (idDaConta) => porConta.get(idDaConta) ?? {},
  };
}

interface RequisicaoDeSaida {
  readonly contexto: ContextoDeSaida;
  /** Os passos da saida, na ordem em que a requisicao os viu. */
  readonly passos: readonly string[];
  /** A conta informada a cada limpeza de credencial. */
  readonly limpezas: readonly number[];
  readonly identidade: IdentidadeCorrente;
}

/**
 * Uma requisicao que vai sair: identidade corrente mais a borda que guarda a
 * credencial do navegador, as duas registrando o que a saida faz com elas.
 *
 * A ordem entre limpar a credencial e tornar a identidade anonima e registrada
 * porque ela e **observavel**: a limpeza recebe o id da conta que sai, e uma
 * ordem invertida limparia a credencial do id errado — a identidade ja seria
 * anonima.
 */
function requisicaoDeSaida(
  sessoes: ArmazenamentoDeSessoes,
  idDaConta: number,
  tokenDaSessao: string,
): RequisicaoDeSaida {
  const passos: string[] = [];
  const limpezas: number[] = [];
  const estado = { idDaConta, tokenDaSessao };

  const identidade: IdentidadeCorrente = {
    get idDaConta() {
      return estado.idDaConta;
    },
    get tokenDaSessao() {
      return estado.tokenDaSessao;
    },
    tornarAnonima() {
      estado.idDaConta = 0;
      estado.tokenDaSessao = '';
      passos.push('identidade-anonima');
    },
  };

  const credenciaisDoNavegador: CredenciaisDoNavegador = {
    limpar(conta: number) {
      limpezas.push(conta);
      passos.push('credencial-limpa');
    },
  };

  return {
    contexto: { sessoes, identidade, credenciaisDoNavegador },
    passos,
    limpezas,
    identidade,
  };
}

interface Cenario {
  readonly registro: RegistroFalso;
  /** O token deste dispositivo: o que a saida destroi. */
  readonly tokenCorrente: string;
  /** O token do outro dispositivo: o que CA-2.2 manda sobreviver. */
  readonly tokenDoOutroDispositivo: string;
  /** A sessao do outro dispositivo, como ela estava antes da saida. */
  readonly sessaoDoOutroDispositivo: Sessao;
  /** O token de uma terceira conta, que a saida nao pode tocar. */
  readonly tokenDeOutraConta: string;
}

/**
 * O dado de entrada comum aos tres casos: uma conta com **duas** sessoes abertas
 * em dispositivos diferentes, e uma terceira conta com a sua.
 *
 * As duas sessoes sao abertas por `abrirSessao`, a operacao de T003, e nao
 * escritas a mao no mapa: e ela que fixa que o registro **soma** em vez de
 * substituir (`BR-MIGRAR-111` poe o acumulo no criterio de aceite), e um cenario
 * montado a mao nao provaria que as duas coexistem de verdade.
 *
 * O outro dispositivo entra com lembranca e este sem, que e o par de prazos de
 * fabrica de `U5`. Nenhum numero e escrito aqui: os dois vem de
 * `expiracaoDoToken`.
 */
function cenarioDeDuasSessoes(): Cenario {
  const registro = registroFalso();

  const deste = abrirSessao(
    registro.sessoes,
    CONTA,
    expiracaoDoToken(AGORA, false),
    AGORA,
    { endereco: '203.0.113.10', agente: 'navegador-deste-dispositivo' },
  );
  const doOutro = abrirSessao(
    registro.sessoes,
    CONTA,
    expiracaoDoToken(AGORA, true),
    AGORA,
    { endereco: '203.0.113.20', agente: 'navegador-do-outro-dispositivo' },
  );
  const deOutraConta = abrirSessao(
    registro.sessoes,
    OUTRA_CONTA,
    expiracaoDoToken(AGORA, false),
    AGORA,
  );

  const abertas = registro.mapaDe(CONTA);
  assert.equal(
    Object.keys(abertas).length,
    2,
    'o cenario exige as duas sessoes abertas ao mesmo tempo na mesma conta',
  );

  const sessaoDoOutroDispositivo = abertas[resumoDoTokenDeSessao(doOutro.token)];
  assert.ok(sessaoDoOutroDispositivo, 'a sessao do outro dispositivo foi gravada');

  return {
    registro,
    tokenCorrente: deste.token,
    tokenDoOutroDispositivo: doOutro.token,
    sessaoDoOutroDispositivo,
    tokenDeOutraConta: deOutraConta.token,
  };
}

/*
  ── UT-002-1 ───────────────────────────────────────────────────────────────

  CA-2.1 — *"Sair destroi apenas o token da sessao corrente e limpa as
  credenciais guardadas no navegador"*.

  Entrada: conta com duas sessoes abertas em dispositivos diferentes, mais uma
  terceira conta com a sua; a requisicao traz o token deste dispositivo.
  Acao: sair.
  Esperado: do registro da conta sumiu **uma** entrada, a do token corrente; a
  do outro dispositivo ficou intacta; a terceira conta nao foi tocada; a
  credencial do navegador foi limpa uma vez, com a conta que saiu, **antes** de a
  identidade virar anonima; e o relato diz que a sessao foi encerrada, sem motivo
  de erro.
*/
test('UT-002-1 · CA-2.1 · sair destroi apenas o token corrente e limpa a credencial do navegador', () => {
  const cenario = cenarioDeDuasSessoes();
  const requisicao = requisicaoDeSaida(
    cenario.registro.sessoes,
    CONTA,
    cenario.tokenCorrente,
  );

  // Onde a montagem do cenario parou de gravar. As gravacoes contadas abaixo sao
  // so as da saida: abrir as tres sessoes tambem grava, inclusive na terceira
  // conta, e contar desde o inicio acusaria a propria montagem.
  const gravacoesAntesDaSaida = cenario.registro.gravacoes.length;

  const relato = us2().sair(requisicao.contexto);

  // Destruiu uma, e exatamente uma: a do token corrente.
  assert.deepEqual(
    Object.keys(cenario.registro.mapaDe(CONTA)),
    [resumoDoTokenDeSessao(cenario.tokenDoOutroDispositivo)],
    'sobra no registro da conta exatamente a sessao do outro dispositivo',
  );
  assert.equal(
    cenario.registro.mapaDe(CONTA)[
      resumoDoTokenDeSessao(cenario.tokenCorrente)
    ],
    undefined,
    'o token corrente nao abre mais nenhuma entrada do registro',
  );

  // A sessao do outro dispositivo nao foi reescrita: campo por campo, a mesma.
  assert.deepStrictEqual(
    cenario.registro.mapaDe(CONTA)[
      resumoDoTokenDeSessao(cenario.tokenDoOutroDispositivo)
    ],
    cenario.sessaoDoOutroDispositivo,
    'a sessao que sobra e a mesma de antes da saida, campo por campo',
  );

  // Nenhuma conta alheia entrou na gravacao: "apenas o token da sessao corrente"
  // vale tambem entre contas.
  assert.deepEqual(
    cenario.registro.gravacoes
      .slice(gravacoesAntesDaSaida)
      .filter((gravacao) => gravacao.idDaConta !== CONTA),
    [],
    'a saida nao gravou no registro de nenhuma outra conta',
  );
  assert.equal(
    us2().sessaoEstaAberta(
      cenario.registro.sessoes,
      OUTRA_CONTA,
      cenario.tokenDeOutraConta,
    ),
    true,
    'a sessao da terceira conta continua aberta',
  );

  // E limpou a credencial do navegador, uma vez, com a conta que saiu — e antes
  // de a identidade corrente virar anonima.
  assert.deepEqual(
    requisicao.limpezas,
    [CONTA],
    'a credencial do navegador foi limpa uma vez, com a conta que saiu',
  );
  assert.deepEqual(
    requisicao.passos,
    ['credencial-limpa', 'identidade-anonima'],
    'a credencial e limpa antes de a identidade corrente virar anonima',
  );

  assert.deepStrictEqual(relato, {
    idDaConta: CONTA,
    sessaoEncerrada: true,
    credencialLimpa: true,
  });
});

/*
  ── UT-002-2 ───────────────────────────────────────────────────────────────

  CA-2.2 — *"Uma sessao aberta em outro dispositivo continua autenticando depois
  da saida"*.

  Entrada: o mesmo cenario, com a saida ja feita neste dispositivo.
  Acao: perguntar ao registro pelo token do outro dispositivo, e em seguida sair
  por ele tambem.
  Esperado: o token do outro dispositivo ainda abre sessao, com o registro
  intacto — e e credencial **viva**, nao residuo: sair por ele encerra de fato, e
  so entao o registro da conta fica vazio.
*/
test('UT-002-2 · CA-2.2 · a sessao do outro dispositivo continua autenticando depois da saida', () => {
  const cenario = cenarioDeDuasSessoes();
  const requisicao = requisicaoDeSaida(
    cenario.registro.sessoes,
    CONTA,
    cenario.tokenCorrente,
  );

  us2().sair(requisicao.contexto);

  // Continua autenticando: o registro responde que sim, e devolve a MESMA
  // sessao — prazo, instante de abertura, endereco e agente.
  assert.equal(
    us2().sessaoEstaAberta(
      cenario.registro.sessoes,
      CONTA,
      cenario.tokenDoOutroDispositivo,
    ),
    true,
    'o token do outro dispositivo ainda abre sessao',
  );
  assert.deepStrictEqual(
    us2().sessaoDoToken(
      cenario.registro.sessoes,
      CONTA,
      cenario.tokenDoOutroDispositivo,
    ),
    cenario.sessaoDoOutroDispositivo,
    'a sessao devolvida e a de antes da saida, campo por campo',
  );

  // E e credencial viva: a saida por ela encerra de verdade. Sem este passo, um
  // registro que apenas guardasse lixo passaria no teste acima.
  const outraRequisicao = requisicaoDeSaida(
    cenario.registro.sessoes,
    CONTA,
    cenario.tokenDoOutroDispositivo,
  );
  const relato = us2().sair(outraRequisicao.contexto);

  assert.equal(
    relato.sessaoEncerrada,
    true,
    'sair pelo token do outro dispositivo encerra a sessao dele',
  );
  assert.deepEqual(
    Object.keys(cenario.registro.mapaDe(CONTA)),
    [],
    'so depois das duas saidas o registro da conta fica vazio',
  );
});

/*
  ── UT-002-3 ───────────────────────────────────────────────────────────────

  CA-2.3 — *"Uma requisicao feita com o token destruido e tratada como anonima"*.

  Entrada: o mesmo cenario, com a saida ja feita; uma requisicao seguinte chega
  trazendo o token destruido.
  Acao: perguntar ao registro por esse token, e sair por ele.
  Esperado: o token destruido nao abre sessao nenhuma; a identidade da requisicao
  que saiu ja e anonima — `0`, que e o valor do legado — ainda nela mesma; e a
  requisicao que chega com o token morto e atendida sem nada ser ressuscitado,
  com a ausencia relatada como **valor** e nao como excecao, do jeito que a
  tabela *Contratos* de `plan.md` declara o erro *"token inexistente"*.

  ⚠️ A outra ponta de "tratada como anonima" — o cookie e o nonce que a borda
  confere — e US-3 / T007 e nao esta aqui, pelo motivo dito no cabecalho.
*/
test('UT-002-3 · CA-2.3 · a requisicao feita com o token destruido e tratada como anonima', () => {
  const cenario = cenarioDeDuasSessoes();
  const requisicao = requisicaoDeSaida(
    cenario.registro.sessoes,
    CONTA,
    cenario.tokenCorrente,
  );

  us2().sair(requisicao.contexto);

  // O token destruido nao abre mais sessao, nem como registro nem como booleano.
  assert.equal(
    us2().sessaoEstaAberta(
      cenario.registro.sessoes,
      CONTA,
      cenario.tokenCorrente,
    ),
    false,
    'o token destruido nao abre mais sessao',
  );
  assert.equal(
    us2().sessaoDoToken(
      cenario.registro.sessoes,
      CONTA,
      cenario.tokenCorrente,
    ),
    null,
    'o registro nao devolve sessao para o token destruido',
  );

  // A identidade da propria requisicao que saiu ja e anonima, ainda nela: o `0`
  // e o valor do legado para identidade ausente, nao sentinela inventada aqui.
  assert.equal(
    requisicao.identidade.idDaConta,
    0,
    'a identidade corrente virou anonima ainda nesta requisicao',
  );
  assert.equal(
    requisicao.identidade.tokenDaSessao,
    '',
    'a identidade anonima nao carrega mais token de sessao',
  );

  // E a requisicao seguinte, que chega com o token morto, e atendida: nada e
  // ressuscitado, a credencial e limpa igual, e a ausencia volta como valor.
  const seguinte = requisicaoDeSaida(
    cenario.registro.sessoes,
    CONTA,
    cenario.tokenCorrente,
  );
  const relato = us2().sair(seguinte.contexto);

  assert.deepStrictEqual(relato, {
    idDaConta: CONTA,
    sessaoEncerrada: false,
    credencialLimpa: true,
    motivo: 'token-inexistente',
  });
  assert.deepEqual(
    Object.keys(cenario.registro.mapaDe(CONTA)),
    [resumoDoTokenDeSessao(cenario.tokenDoOutroDispositivo)],
    'a requisicao com o token morto nao ressuscita nada e nao derruba a outra sessao',
  );
});
