/**
 * A entrega de **T020**: *"5 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-016-1, UT-016-2, UT-016-3, UT-016-4,
 * UT-016-5), com o mesmo dado de entrada, acao e resultado esperado. O teste de
 * regra de negocio (UT-016-5) entra na mesma suite."*
 *
 * ---
 *
 * ⚠️ **`backlog/tests.md` NAO EXISTE nesta arvore, e os cinco casos foram
 * RECONSTRUIDOS, nao copiados.** O caminho que `tasks.md` cita resolve para
 * `backlog/tests.md` na raiz do repositorio, e ali nao ha nada: nem a pasta
 * `backlog/`, nem o arquivo, nem copia em `_discovery/`. As unicas mencoes ao
 * catalogo no pacote entregue o descrevem **de fora** — `parity_specs.md`
 * (*"os 985 testes de `../backlog/tests.md` sao especificacao, nao
 * evidencia"*) e a primeira *Pergunta em aberto* de `spec.md`. T008, T016 e as
 * refeituras de T010, T012 e T014 encontraram a mesma ausencia e a registraram
 * do mesmo modo — ver `../sessao/ut-003-expiracao-de-sessao.test.ts` e
 * `./ut-014-autorizacao-por-capacidade.test.ts`.
 *
 * ## 🔴 A correspondencia de US-9 e a UNICA da feature em que a aritmetica de
 * `tasks.md` nao fecha, e esta suite NAO escolhe por ninguem
 *
 * Em nove das onze historias o numero de casos e *"criterios de aceite + regras
 * de negocio"*: US-2 tem 3 e 3 casos com 0 regras, US-3 tem 4 e 5 com 1, US-7
 * tem 5 e 8 com 3, e assim por diante (a conta esta no cabecalho de
 * `./ut-014-autorizacao-por-capacidade.test.ts`). **US-9 tem 4 criterios, 1
 * regra e 5 casos** — e os dois documentos do pacote divergem sobre qual
 * criterio sobra:
 *
 * - a aritmetica diria `UT-016-4` = **CA-9.4**, fechando 4 + 1 = 5;
 * - mas `tasks.md`, na propria linha de T020, declara *"satisfaz: CA-9.1,
 *   CA-9.2, CA-9.3"* — **sem CA-9.4** —, e a primeira *Pergunta em aberto* de
 *   `spec.md` e literal sobre CA-9.4: *"e o unico criterio deste pacote sem
 *   nenhum teste registrado em `backlog/tests.md`"*.
 *
 * As duas afirmacoes explicitas (a linha de T020 e a pergunta da `spec.md`)
 * valem contra a inferencia aritmetica, logo **os 5 casos cobrem CA-9.1, CA-9.2
 * e CA-9.3 mais a regra, e um dos tres criterios tem dois casos**. O criterio
 * desdobrado e CA-9.3, porque e o unico cuja frase tem dois estados de saida
 * opostos — *"compara as capacidades exigidas no codigo com a matriz declarada"*
 * **e** *"falha quando sobra alguma"* —, e porque sao os dois estados que o
 * cenario `@substituicao` de `07-autorizacao-por-capacidade.feature` distingue
 * (com e sem a concessao registrada no ponto de extensao).
 *
 * | caso | o que afirma | fonte |
 * |---|---|---|
 * | `UT-016-1` | CA-9.1 — as quatro que entram so por filtro constam de regra declarada, **sem** entrar em papel algum | `spec.md`, US-9; `PERM-7` (BR-MIGRAR-093) |
 * | `UT-016-2` | CA-9.2 — numa instalacao de fabrica ha ao menos um ator capaz de retomar extensao pausada | `spec.md`, US-9; UC-36; UC-32 |
 * | `UT-016-3` | CA-9.3, metade *"compara"* — a conferencia **fecha** para tudo o que os casos de uso de US-9 exigem | `spec.md`, US-9; UC-36, UC-32, UC-37 |
 * | `UT-016-4` | CA-9.3, metade *"falha quando sobra alguma"* — a conferencia acusa, **com nome**, o que ficou sem responsavel | `spec.md`, US-9; `07-autorizacao-por-capacidade.feature`, cenario `@substituicao` |
 * | `UT-016-5` | a regra de US-9: as quatro *"nao estao em papel algum: entram por filtro de prioridade 1"* | `spec.md`, US-9, unica regra; `PERM-7` (BR-MIGRAR-093); UC-37 |
 *
 * **O que isto deixa devendo, declarado para nao ser descoberto depois:** se o
 * catalogo aparecer e um UT-016-* tiver dado de entrada diferente do que esta
 * aqui, o caso de la vale e este arquivo muda; e se ele mostrar que o quinto
 * caso e de CA-9.4, quem o reescrever ja tem o mecanismo pronto
 * (`conferirMatrizDeclarada`) e precisa so da lista dos 93 nomes, que **nao esta
 * nesta arvore**. Nenhuma assercao daqui inventa comportamento: cada uma sai de
 * `spec.md`, de `target_business_rules.md` (BR-MIGRAR-093), do cenario de
 * paridade `PT-007` ou de UC-36, UC-32 e UC-37, que sao os casos de uso que a
 * tabela de rastreabilidade de `spec.md` liga a US-9. **CA-9.4 continua aberto, e
 * esta tarefa nao o fecha** — fecha-lo e decidir no lugar de quem decide.
 *
 * ---
 *
 * # Nao sao os testes de criterio de T019
 *
 * T019 entregou duas suites proprias:
 * `../../../plataforma/autorizacao/us-9-capacidades-por-extensao.test.ts`, no
 * nivel da **unidade**, com matriz inventada de proposito; e
 * `./us-9-instalacao-de-fabrica.test.ts`, sobre a matriz de fabrica obtida
 * direto de `povoarPapeis()`.
 *
 * Esta suite e o catalogo UT-016-*, no nivel do **cenario**: cada caso parte de
 * uma instalacao com banco, grava a matriz de fabrica na opcao
 * `{site}user_roles`, grava a autorizacao da conta na chave
 * `{site}capabilities`, atravessa o codec do formato serializado e o adaptador
 * de `./fonte-de-papeis.ts`, e so entao chega a `perguntarPermissao`. A
 * diferenca nao e cerimonia: as quatro capacidades de `PERM-7` **nao sao
 * gravadas em lugar nenhum**, logo o que estes casos provam e que elas
 * sobrevivem a ida e volta pelo armazenamento sem que ninguem as grave — e que
 * os bytes da opcao continuam os da matriz de fabrica, que e o que o cenario de
 * paridade exige identico byte a byte.
 *
 * E e por isso que ela mora aqui, em `contextos/`, e nao ao lado da politica: a
 * regra de dependencia 2 de `target_architecture.md` proibe `plataforma/`
 * importar `contextos/`, e um caso de ponta a ponta precisa dos dois lados.
 *
 * **T020 depende de T019** (`tasks.md`: *"depende de: T019"*), e por isso esta
 * suite importa `concessao-por-extensao.ts` e `catalogo-de-capacidades.ts`, que
 * sao de T019: numa arvore sem T019 ela nao compila, que e o que a dependencia
 * declarada significa. Nenhum arquivo fora desta suite e tocado, como o `[P]` de
 * T020 exige — *"tarefa de teste, que toca so a propria suite"*.
 *
 * ---
 *
 * # 🔴 O conflito REQ-017 e exercitado nos dois lados, e nenhum e escolhido
 *
 * As pseudocapacidades de nivel numerico (`level_0` a `level_10`) estao em
 * disputa entre o card `REQ-017` (prioridade `wont`) e a resposta 5 de
 * `questions.md`, e a tabela **Nao negociavel** da constituicao poe a
 * reconciliacao fora do alcance de quem codifica. Todo caso que semeia a matriz
 * de fabrica roda nos **dois** lados, com a mesma expectativa, dentro de um
 * unico `test()` — assim a contagem de cinco casos continua sendo cinco e nenhum
 * lado e escolhido por omissao. As quatro concessoes de T019 dependem de
 * `activate_plugins`, `switch_themes`, `install_plugins`, `install_themes` e
 * `update_core`, e nenhuma delas e nivel numerico, logo o resultado e o mesmo
 * nos dois lados — e estes casos sao a prova disso.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CONCESSOES_POR_EXTENSAO_DE_FABRICA,
  PRIORIDADE_DA_CONCESSAO_POR_EXTENSAO,
  REDE_INATIVA_NA_AUTORIZACAO,
  atorDeAutorizacao,
  capacidadesConcedidasPorExtensao,
  capacidadesDeclaradas,
  comAtor,
  conferirMatrizDeclarada,
  papeisQueConcedem,
  perguntarPermissao,
  quemTemCapacidade,
  type BaseDeAutorizacao,
  type Capacidade,
  type ConcessaoPorExtensao,
  type EstadoDaRedeNaAutorizacao,
  type FonteDeAutorizacao,
  type GanchosDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarArmazenamento,
  type Armazenamento,
  type ConcessaoDeCapacidade,
  type LadoDoConflitoDeNivelNumerico,
} from '../armazenamento/index.js';
import type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ValorDeColuna,
} from '../portas/index.js';
import { criarFonteDeAutorizacao, matrizGravada } from './fonte-de-papeis.js';

// ===========================================================================
// O que o pacote nomeia, e que esta suite nao reescreve
// ===========================================================================

/**
 * Os dois lados do conflito REQ-017, percorridos por todo caso que semeia a
 * matriz de fabrica. Ver o cabecalho.
 */
const LADOS: readonly LadoDoConflitoDeNivelNumerico[] = [
  'legado-integral',
  'req-017-sem-niveis',
];

/**
 * As quatro de `PERM-7` (BR-MIGRAR-093), na ordem em que o pacote as lista.
 *
 * A ordem importa porque `capacidadesConcedidasPorExtensao()` deriva a lista das
 * concessoes declaradas, e UT-016-1 compara as duas: se alguem acrescentar uma
 * concessao sem registrar o caso, a comparacao abre.
 */
const QUATRO_SO_POR_EXTENSAO: readonly Capacidade[] = [
  'install_languages',
  'resume_plugins',
  'resume_themes',
  'view_site_health_checks',
];

/**
 * A capacidade de origem de cada uma das quatro, na letra dos casos de uso.
 *
 * `install_languages` sai de **qualquer uma** das tres de
 * `CAPACIDADES_QUE_HABILITAM_O_IDIOMA`, e aqui esta a que o papel de maior poder
 * da matriz de fabrica tem — a enumeracao das tres e caso da suite de unidade de
 * T019, nao deste nivel.
 */
const ORIGEM_DE_CADA_UMA: readonly (readonly [Capacidade, Capacidade])[] = [
  // UC-33 / `capabilities.php:1309`: "ao menos uma de `update_core`,
  // `install_plugins` e `install_themes`".
  ['install_languages', 'update_core'],
  // UC-36: "entra por filtro de prioridade 1 para quem tem `activate_plugins`".
  ['resume_plugins', 'activate_plugins'],
  // UC-32: "e concedida por filtro a quem tem `switch_themes`".
  ['resume_themes', 'switch_themes'],
  // UC-37: "concedida por filtro a quem tem `install_plugins`".
  ['view_site_health_checks', 'install_plugins'],
];

/** Os cinco papeis que as oito rotinas de povoamento semeiam. */
const PAPEIS_DE_FABRICA: readonly string[] = [
  'administrator',
  'editor',
  'author',
  'contributor',
  'subscriber',
];

/** Os quatro papeis de fabrica que **nao** tem nenhuma capacidade de origem. */
const PAPEIS_SEM_ORIGEM: readonly string[] = PAPEIS_DE_FABRICA.filter(
  (identificador) => identificador !== 'administrator',
);

// ===========================================================================
// A montagem: uma instalacao com banco
// ===========================================================================

/** Uma linha de `usermeta`, como esta montagem a guarda. */
interface LinhaDeMetadado {
  readonly umeta_id: number;
  readonly user_id: number;
  readonly meta_key: string;
  meta_value: ValorDeColuna;
}

interface Banco {
  /** A porta sobre este banco, com o prefixo informado. */
  readonly porta: PortaDeDados;
  /** O valor gravado numa opcao, como texto, para afirmar bytes. */
  opcao(nome: string): string | null;
  /** O valor gravado numa chave de metadado, como texto. */
  metadado(contaId: number, chave: string): string | null;
  /**
   * Poe a linha de `users` direto.
   *
   * Direto, e nao pelo fluxo de cadastro: criar conta e US-6 / T013, e fazer os
   * casos de US-9 dependerem dela os faria falhar por motivo alheio.
   */
  inserirLinhaDeConta(id: number, login: string): void;
}

/**
 * O banco desta suite: ele responde a partir do que foi escrito.
 *
 * `../armazenamento/porta-falsa.ts` explica por que as suites de T002 em diante
 * usam uma porta que so registra. Aqui a resposta por estado foi acrescentada
 * porque **cada caso de US-9 atravessa varias leituras encadeadas**: gravar a
 * opcao, reler a opcao, ler a autorizacao da conta, ler o login, percorrer
 * candidatos pelo `LIKE`. Com respostas programadas em fila, a ordem da fila
 * passaria a ser o objeto do teste em vez da decisao.
 *
 * Toda consulta que esta montagem nao reconhece **lanca**. Se uma consulta do
 * armazenamento mudar de forma, o caso diz qual, em vez de responder vazio e
 * fazer a assercao falhar tres passos adiante.
 */
function criarBanco(prefixo: string): Banco {
  const opcoes = new Map<string, ValorDeColuna>();
  const metadados: LinhaDeMetadado[] = [];
  const contas = new Map<number, string>();
  let proximoMetaId = 1;

  const tabelaDeOpcoes = `${prefixo}options`;
  const tabelaDeMetadados = `${prefixo}usermeta`;
  const tabelaDeContas = `${prefixo}users`;

  const LEITURA_DE_OPCAO =
    `SELECT option_value FROM ${tabelaDeOpcoes} WHERE option_name = ?`;
  const LEITURA_DE_METADADO =
    `SELECT umeta_id, user_id, meta_key, meta_value FROM ${tabelaDeMetadados} ` +
    'WHERE user_id = ? AND meta_key = ?';
  const BUSCA_POR_TRECHO =
    `SELECT user_id FROM ${tabelaDeMetadados} ` +
    'WHERE meta_key = ? AND meta_value LIKE ?';

  function responderLeitura(consulta: Consulta): readonly LinhaDeResultado[] {
    const { texto, parametros } = consulta;

    if (texto === LEITURA_DE_OPCAO) {
      const valor = opcoes.get(comoCadeia(parametros[0]));
      return valor === undefined ? [] : [{ option_value: valor }];
    }

    if (texto === LEITURA_DE_METADADO) {
      const contaId = Number(parametros[0]);
      const chave = comoCadeia(parametros[1]);
      return metadados
        .filter((linha) => linha.user_id === contaId && linha.meta_key === chave)
        .map((linha) => ({
          umeta_id: linha.umeta_id,
          user_id: linha.user_id,
          meta_key: linha.meta_key,
          meta_value: linha.meta_value,
        }));
    }

    if (texto === BUSCA_POR_TRECHO) {
      const chave = comoCadeia(parametros[0]);
      const padrao = comoCadeia(parametros[1]);
      return metadados
        .filter(
          (linha) =>
            linha.meta_key === chave &&
            casaComLike(comoCadeia(linha.meta_value), padrao),
        )
        .map((linha) => ({ user_id: linha.user_id }));
    }

    if (
      texto.startsWith('SELECT ID, user_login') &&
      texto.endsWith(`FROM ${tabelaDeContas} WHERE ID = ?`)
    ) {
      const id = Number(parametros[0]);
      const login = contas.get(id);
      return login === undefined ? [] : [{ ID: id, user_login: login }];
    }

    throw new Error(`leitura nao prevista por esta montagem: ${texto}`);
  }

  function responderEscrita(consulta: Consulta): void {
    const { texto, parametros } = consulta;

    if (
      texto ===
      `INSERT INTO ${tabelaDeOpcoes} (option_name, option_value) VALUES (?, ?)`
    ) {
      opcoes.set(comoCadeia(parametros[0]), parametros[1] ?? null);
      return;
    }

    if (
      texto ===
      `UPDATE ${tabelaDeOpcoes} SET option_value = ? WHERE option_name = ?`
    ) {
      opcoes.set(comoCadeia(parametros[1]), parametros[0] ?? null);
      return;
    }

    if (
      texto ===
      `INSERT INTO ${tabelaDeMetadados} (user_id, meta_key, meta_value) VALUES (?, ?, ?)`
    ) {
      metadados.push({
        umeta_id: proximoMetaId,
        user_id: Number(parametros[0]),
        meta_key: comoCadeia(parametros[1]),
        meta_value: parametros[2] ?? null,
      });
      proximoMetaId += 1;
      return;
    }

    if (
      texto ===
      `UPDATE ${tabelaDeMetadados} SET meta_value = ? WHERE user_id = ? AND meta_key = ?`
    ) {
      const contaId = Number(parametros[1]);
      const chave = comoCadeia(parametros[2]);
      for (const linha of metadados) {
        if (linha.user_id === contaId && linha.meta_key === chave) {
          linha.meta_value = parametros[0] ?? null;
        }
      }
      return;
    }

    if (
      texto ===
      `DELETE FROM ${tabelaDeMetadados} WHERE user_id = ? AND meta_key = ?`
    ) {
      const contaId = Number(parametros[0]);
      const chave = comoCadeia(parametros[1]);
      for (let indice = metadados.length - 1; indice >= 0; indice -= 1) {
        const linha = metadados[indice] as LinhaDeMetadado;
        if (linha.user_id === contaId && linha.meta_key === chave) {
          metadados.splice(indice, 1);
        }
      }
      return;
    }

    throw new Error(`escrita nao prevista por esta montagem: ${texto}`);
  }

  return {
    porta: {
      prefixoDeTabela: prefixo,
      prefixoBaseDeTabela: prefixo,
      selecionar(consulta) {
        return responderLeitura(consulta);
      },
      escrever(consulta) {
        responderEscrita(consulta);
        // `linhasAfetadas: 1` porque esta montagem so recebe escrita que
        // alcanca linha: a decisao de nao escrever e do repositorio.
        return { linhasAfetadas: 1, idGerado: proximoMetaId };
      },
    },

    opcao(nome) {
      const valor = opcoes.get(nome);
      return valor === undefined ? null : comoCadeia(valor);
    },

    metadado(contaId, chave) {
      const linha = metadados.find(
        (candidata) =>
          candidata.user_id === contaId && candidata.meta_key === chave,
      );
      return linha === undefined ? null : comoCadeia(linha.meta_value);
    },

    inserirLinhaDeConta(id, login) {
      contas.set(id, login);
    },
  };
}

/** O valor de uma coluna ou de um parametro como texto. */
function comoCadeia(valor: ValorDeColuna | undefined): string {
  if (valor === null || valor === undefined) {
    return '';
  }
  if (valor instanceof Uint8Array) {
    return new TextDecoder().decode(valor);
  }
  return String(valor);
}

/**
 * O `LIKE` do banco, com os tres caracteres que o legado escapa.
 *
 * Existe porque a unica pergunta que o armazenamento responde sobre autorizacao
 * e um `LIKE` com curinga dos dois lados sobre texto serializado (`PERM-2`): sem
 * reproduzi-lo, UT-016-2 nao teria resposta para conferir — e e justamente essa
 * busca que **nao** alcanca o que chega por ponto de extensao.
 */
function casaComLike(valor: string, padrao: string): boolean {
  let expressao = '';
  for (let indice = 0; indice < padrao.length; indice += 1) {
    const caractere = padrao.charAt(indice);
    if (caractere === '\\' && indice + 1 < padrao.length) {
      expressao += literal(padrao.charAt(indice + 1));
      indice += 1;
      continue;
    }
    if (caractere === '%') {
      expressao += '[\\s\\S]*';
      continue;
    }
    if (caractere === '_') {
      expressao += '[\\s\\S]';
      continue;
    }
    expressao += literal(caractere);
  }
  return new RegExp(`^${expressao}$`).test(valor);
}

function literal(caractere: string): string {
  return caractere.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** O que um caso pode mudar na base da pergunta, alem da matriz gravada. */
interface RestoDaBase {
  readonly rede?: EstadoDaRedeNaAutorizacao;
  readonly concessoesPorExtensao?: readonly ConcessaoPorExtensao[];
  readonly ganchos?: GanchosDeAutorizacao;
}

interface Instalacao {
  readonly banco: Banco;
  readonly armazenamento: Armazenamento;
  readonly fonte: FonteDeAutorizacao;
  /** O nome da opcao da definicao de papeis desta instalacao. */
  readonly opcaoDePapeis: string;
  /** `{site}capabilities` — a chave com o site dentro do nome. */
  readonly chaveDeCapacidades: string;
  /**
   * A base da pergunta, com a matriz **relida do armazenamento a cada
   * chamada**.
   *
   * Relida e nao guardada: e isso que `PERM-13` cobra e o que o risco 4 do
   * `plan.md` avisa que um cache mudaria — *"muda o momento em que uma alteracao
   * de papel passa a valer, o que e observavel"*.
   */
  base(resto?: RestoDaBase): BaseDeAutorizacao;
  /** A pergunta de permissao, de ponta a ponta. */
  pode(contaId: number, capacidade: Capacidade, resto?: RestoDaBase): boolean;
  /** Cria a linha de `users` e devolve o identificador. */
  conta(login: string): number;
  /** Grava `{site}capabilities` daquela conta, como o legado a grava. */
  atribuir(contaId: number, ...concessoes: readonly ConcessaoDeCapacidade[]): void;
  /** Semeia a matriz de fabrica pelo lado informado do conflito REQ-017. */
  semear(lado: LadoDoConflitoDeNivelNumerico): void;
}

/**
 * Uma instalacao: o armazenamento de T002 sobre o banco, e a costura de T015
 * por cima.
 */
function criarInstalacao(prefixo = 'wp_'): Instalacao {
  const banco = criarBanco(prefixo);
  const armazenamento = criarArmazenamento(banco.porta);
  const fonte = criarFonteDeAutorizacao(armazenamento);
  let proximaConta = 1;

  const instalacao: Instalacao = {
    banco,
    armazenamento,
    fonte,
    opcaoDePapeis: `${prefixo}user_roles`,
    chaveDeCapacidades: `${prefixo}capabilities`,

    base(resto = {}) {
      return {
        matriz: matrizGravada(armazenamento),
        rede: REDE_INATIVA_NA_AUTORIZACAO,
        ...resto,
      };
    },

    pode(contaId, capacidade, resto = {}) {
      return perguntarPermissao(
        comAtor(instalacao.base(resto), atorDeAutorizacao(contaId, fonte)),
        capacidade,
      );
    },

    conta(login) {
      const id = proximaConta;
      proximaConta += 1;
      banco.inserirLinhaDeConta(id, login);
      return id;
    },

    atribuir(contaId, ...concessoes) {
      armazenamento.papeis.gravarCapacidadesDaConta(contaId, concessoes);
    },

    semear(lado) {
      armazenamento.papeis.semearMatrizDeFabrica(lado);
    },
  };

  return instalacao;
}

/** Uma concessao concedida, no formato em que `{site}capabilities` a guarda. */
function concedida(capacidade: string): ConcessaoDeCapacidade {
  return { capacidade, concedida: true };
}

/** Uma instalacao de fabrica com uma conta por papel semeado. */
function instalacaoDeFabrica(lado: LadoDoConflitoDeNivelNumerico): {
  readonly instalacao: Instalacao;
  /** O identificador da conta de cada papel de fabrica. */
  readonly porPapel: ReadonlyMap<string, number>;
} {
  const instalacao = criarInstalacao();
  instalacao.semear(lado);

  const porPapel = new Map<string, number>();
  for (const identificador of PAPEIS_DE_FABRICA) {
    const contaId = instalacao.conta(`conta-${identificador}`);
    instalacao.atribuir(contaId, concedida(identificador));
    porPapel.set(identificador, contaId);
  }

  return { instalacao, porPapel };
}

/** O identificador da conta daquele papel, ou falha dizendo qual faltou. */
function contaDoPapel(
  porPapel: ReadonlyMap<string, number>,
  identificador: string,
): number {
  const contaId = porPapel.get(identificador);
  assert.notEqual(contaId, undefined, `a conta de ${identificador} deveria existir`);
  return contaId ?? 0;
}

// ---------------------------------------------------------------------------
// UT-016-1 — CA-9.1 *"As quatro capacidades que no legado entram so por filtro
// — instalar traducao, retomar plugin pausado, retomar tema pausado e ver
// diagnosticos — constam de ao menos um papel ou de regra declarada"*
//
// entrada:  uma instalacao de fabrica, nos dois lados do conflito REQ-017, com a
//           matriz gravada na opcao `{site}user_roles`
// acao:     reler a matriz do armazenamento, procurar as quatro nela e nos bytes
//           gravados, e pedir a conferencia da matriz declarada
// esperado: nenhum papel as concede e nenhuma delas aparece nos bytes da opcao —
//           o porte NAO as acrescentou a matriz —, e ainda assim as quatro
//           constam da declaracao por regra, logo a conferencia fecha
// ---------------------------------------------------------------------------

test('UT-016-1 as quatro que entram so por filtro tem declaracao por regra, sem entrar em papel algum (CA-9.1)', () => {
  // A lista do caso e a lista derivada das concessoes declaradas: se alguem
  // acrescentar uma concessao ao nucleo sem registrar o caso, isto abre.
  assert.deepEqual(
    [...capacidadesConcedidasPorExtensao()],
    [...QUATRO_SO_POR_EXTENSAO],
    'as quatro declaradas sao as quatro de PERM-7, nesta ordem',
  );

  for (const lado of LADOS) {
    const { instalacao } = instalacaoDeFabrica(lado);
    const matriz = matrizGravada(instalacao.armazenamento);
    assert.ok(matriz.length > 0, `${lado}: a matriz deveria estar gravada`);

    const bytes = instalacao.banco.opcao(instalacao.opcaoDePapeis);
    assert.notEqual(bytes, null, `${lado}: a opcao de papeis deveria estar gravada`);

    for (const capacidade of QUATRO_SO_POR_EXTENSAO) {
      // "Nao estao em papel algum": a entrega de T019 e declara-las por regra,
      // nao acrescenta-las a matriz. Semea-las num papel mudaria o valor gravado
      // na opcao, que e o que a interface de papeis do produto le e o que o
      // cenario de paridade exige identico byte a byte.
      assert.deepEqual(
        [...papeisQueConcedem(matriz, capacidade)],
        [],
        `${lado}: ${capacidade} nao e concedida por papel algum`,
      );
      assert.equal(
        bytes?.includes(capacidade),
        false,
        `${lado}: ${capacidade} nao esta nos bytes gravados da matriz`,
      );
      assert.equal(
        capacidadesDeclaradas(matriz).has(capacidade),
        false,
        `${lado}: ${capacidade} nao chega pela matriz`,
      );
    }

    // E a outra metade do "ou de regra declarada": com as concessoes do nucleo,
    // as quatro tem responsavel declarado e a conferencia nao as acusa.
    const conferencia = conferirMatrizDeclarada({
      matriz,
      exigidas: QUATRO_SO_POR_EXTENSAO,
    });
    for (const capacidade of QUATRO_SO_POR_EXTENSAO) {
      assert.equal(
        conferencia.declaradas.has(capacidade),
        true,
        `${lado}: ${capacidade} consta de regra declarada`,
      );
    }
    assert.equal(conferencia.fechou, true, `${lado}: as quatro tem declaracao`);
  }
});

// ---------------------------------------------------------------------------
// UT-016-2 — CA-9.2 *"Existe ao menos um ator capaz de retomar uma extensao
// pausada numa instalacao de fabrica"*
//
// entrada:  uma instalacao de fabrica, nos dois lados do conflito REQ-017, com
//           uma conta por papel semeado e o papel gravado em `{site}capabilities`
// acao:     perguntar `resume_plugins` e `resume_themes` — e as outras duas —
//           para cada uma das cinco contas; e perguntar ao armazenamento quem
//           tem a capacidade de origem e quem tem a concedida por filtro
// esperado: a conta de maior poder retoma plugin e tema pausados, as outras
//           quatro nao retomam nada, e a busca do armazenamento responde a
//           capacidade de origem e NAO responde a concedida por filtro — a
//           ausencia que o legado tem e que o porte preserva
// ---------------------------------------------------------------------------

test('UT-016-2 numa instalacao de fabrica ha quem retome a extensao pausada, e so quem tem a capacidade de origem (CA-9.2)', () => {
  for (const lado of LADOS) {
    const { instalacao, porPapel } = instalacaoDeFabrica(lado);
    const administradora = contaDoPapel(porPapel, 'administrator');

    // UC-36: "retomar as extensoes exige `resume_plugins` ou `resume_themes`,
    // que nao estao em papel algum". Com a concessao de prioridade 1 do nucleo,
    // quem tem `activate_plugins` e `switch_themes` de fabrica retoma as duas —
    // e sem ela "quem migrar pela matriz produz um sistema em que NINGUEM
    // retoma", que e o que UT-016-4 afirma do outro lado.
    assert.equal(
      instalacao.pode(administradora, 'resume_plugins'),
      true,
      `${lado}: alguem retoma extensao pausada de fabrica`,
    );
    assert.equal(
      instalacao.pode(administradora, 'resume_themes'),
      true,
      `${lado}: alguem retoma tema pausado de fabrica`,
    );
    // E as outras duas pela mesma via, para que nao exista operacao cujo
    // responsavel nao exista: UC-37 exige `install_plugins`, que o papel de
    // maior poder tem de fabrica, e o idioma sai de `update_core`.
    assert.equal(
      instalacao.pode(administradora, 'view_site_health_checks'),
      true,
      `${lado}: alguem abre o diagnostico de fabrica`,
    );
    assert.equal(
      instalacao.pode(administradora, 'install_languages'),
      true,
      `${lado}: alguem instala traducao de fabrica`,
    );

    // A concessao e condicional, e nao capacidade dada a todos: nenhum dos
    // outros quatro papeis de fabrica tem capacidade de origem alguma.
    for (const identificador of PAPEIS_SEM_ORIGEM) {
      const contaId = contaDoPapel(porPapel, identificador);
      for (const capacidade of QUATRO_SO_POR_EXTENSAO) {
        assert.equal(
          instalacao.pode(contaId, capacidade),
          false,
          `${lado}: ${identificador} nao deveria receber ${capacidade}`,
        );
      }
    }

    // A conta tem o papel gravado no mapa serializado, e e sobre esse texto que
    // a unica busca do legado corre (`PERM-2`).
    assert.equal(
      instalacao.banco
        .metadado(administradora, instalacao.chaveDeCapacidades)
        ?.includes('"administrator"'),
      true,
      `${lado}: o papel da conta esta no mapa serializado`,
    );

    const base = instalacao.base();
    for (const [capacidade, origem] of ORIGEM_DE_CADA_UMA) {
      // A capacidade de ORIGEM esta gravada em papel, logo o `LIKE` a alcanca.
      assert.deepEqual(
        [...quemTemCapacidade(origem, base, instalacao.fonte)],
        [administradora],
        `${lado}: a busca responde quem tem ${origem}`,
      );
      // A concedida por filtro NAO esta gravada em lugar nenhum, logo a busca
      // devolve vazio — e isso e o legado, nao um defeito deste porte:
      // `quem-tem-capacidade.ts` declara a ausencia, e quem precisa da resposta
      // completa pergunta conta por conta, como as assercoes acima fazem.
      assert.deepEqual(
        [...quemTemCapacidade(capacidade, base, instalacao.fonte)],
        [],
        `${lado}: a busca nao alcanca ${capacidade}, que nao e gravada`,
      );
    }
  }
});

// ---------------------------------------------------------------------------
// UT-016-3 — CA-9.3, metade *"uma verificacao automatizada compara as
// capacidades exigidas no codigo com a matriz declarada"*
//
// entrada:  uma instalacao de fabrica, nos dois lados do conflito REQ-017, e a
//           lista das capacidades que UC-36, UC-32 e UC-37 exigem: as quatro de
//           `PERM-7` e a capacidade de origem de cada uma
// acao:     rodar a conferencia da matriz declarada sobre essa lista
// esperado: nada sobra — toda capacidade exigida pelos casos de uso de US-9 tem
//           responsavel declarado —, e a conferencia e so relato: perguntar por
//           capacidade que ninguem declarou responde "nao", sem lancar
// ---------------------------------------------------------------------------

test('UT-016-3 a conferencia fecha para toda capacidade que os casos de uso de US-9 exigem (CA-9.3)', () => {
  const exigidasPelosCasosDeUso: readonly Capacidade[] = [
    ...QUATRO_SO_POR_EXTENSAO,
    ...ORIGEM_DE_CADA_UMA.map(([, origem]) => origem),
    // As outras duas que habilitam o idioma, nomeadas por
    // `CAPACIDADES_QUE_HABILITAM_O_IDIOMA`: a condicao e "qualquer uma destas",
    // logo todas as tres sao exigidas em algum caminho.
    'install_plugins',
    'install_themes',
  ];

  for (const lado of LADOS) {
    const { instalacao, porPapel } = instalacaoDeFabrica(lado);
    const matriz = matrizGravada(instalacao.armazenamento);

    const conferencia = conferirMatrizDeclarada({
      matriz,
      exigidas: exigidasPelosCasosDeUso,
    });

    assert.deepEqual(
      [...conferencia.semDeclaracao],
      [],
      `${lado}: toda capacidade dos casos de uso de US-9 tem declaracao`,
    );
    assert.equal(conferencia.fechou, true, `${lado}: a conferencia fecha`);
    for (const capacidade of exigidasPelosCasosDeUso) {
      assert.equal(
        conferencia.declaradas.has(capacidade),
        true,
        `${lado}: ${capacidade} consta da matriz declarada`,
      );
    }

    // E a conferencia nao e porta: a decisao nao a consulta. Perguntar por uma
    // capacidade que ninguem declarou responde "nao" no legado, e transformar
    // isso em erro de execucao mudaria o observavel (**P1**).
    const administradora = contaDoPapel(porPapel, 'administrator');
    assert.equal(
      instalacao.pode(administradora, 'capacidade_que_ninguem_declarou'),
      false,
      `${lado}: capacidade sem declaracao e negada, nao erro`,
    );
  }
});

// ---------------------------------------------------------------------------
// UT-016-4 — CA-9.3, metade *"e falha quando sobra alguma"*
//
// entrada:  a mesma instalacao de fabrica, nos dois lados do conflito REQ-017,
//           com duas listas de exigidas: uma que inclui um nome que ninguem
//           declara, e a propria lista das quatro numa instalacao em que a
//           concessao foi retirada do ponto de extensao (o cenario
//           `@substituicao` de `07-autorizacao-por-capacidade.feature`)
// acao:     rodar a conferencia nas duas, e perguntar `resume_plugins` para a
//           conta de maior poder na instalacao sem a concessao
// esperado: a conferencia falha e acusa, com nome, exatamente o que ficou sem
//           responsavel — so o nome estranho na primeira, as quatro na segunda —
//           e, sem o ponto de concessao, ninguem retoma extensao pausada
// ---------------------------------------------------------------------------

test('UT-016-4 a conferencia falha e acusa, com nome, a capacidade exigida que ficou sem responsavel (CA-9.3)', () => {
  const SEM_RESPONSAVEL: Capacidade = 'retomar_extensao_sem_responsavel';

  for (const lado of LADOS) {
    const { instalacao, porPapel } = instalacaoDeFabrica(lado);
    const matriz = matrizGravada(instalacao.armazenamento);

    // 1. Um nome que nenhum papel menciona, nenhuma regra alcanca e nenhuma
    //    concessao declara. As quatro de `PERM-7` continuam fora do relato.
    const comNomeEstranho = conferirMatrizDeclarada({
      matriz,
      exigidas: [...QUATRO_SO_POR_EXTENSAO, SEM_RESPONSAVEL],
    });
    assert.equal(
      comNomeEstranho.fechou,
      false,
      `${lado}: sobrou capacidade, logo a conferencia falha`,
    );
    assert.deepEqual(
      [...comNomeEstranho.semDeclaracao],
      [SEM_RESPONSAVEL],
      `${lado}: e acusa so o que ficou sem responsavel, com nome`,
    );

    // 2. A instalacao em que a concessao foi retirada do ponto de extensao —
    //    `remove_filter` existe no legado, e e o estado que o cenario
    //    `@substituicao` descreve. Ali as quatro voltam a nao ter responsavel, e
    //    e ISSO que o relato tem de dizer.
    const semConcessao = conferirMatrizDeclarada({
      matriz,
      exigidas: QUATRO_SO_POR_EXTENSAO,
      concessoesPorExtensao: [],
    });
    assert.equal(semConcessao.fechou, false, `${lado}: a conferencia acusa`);
    assert.deepEqual(
      [...semConcessao.semDeclaracao],
      [...QUATRO_SO_POR_EXTENSAO],
      `${lado}: e acusa as quatro, com nome`,
    );

    // E a decisao nega, que e o sistema de que UC-36 avisa: "quem migrar pela
    // matriz produz um sistema em que NINGUEM retoma".
    const administradora = contaDoPapel(porPapel, 'administrator');
    for (const capacidade of QUATRO_SO_POR_EXTENSAO) {
      assert.equal(
        instalacao.pode(administradora, capacidade, {
          concessoesPorExtensao: [],
        }),
        false,
        `${lado}: sem o ponto de concessao, ninguem tem ${capacidade}`,
      );
    }
  }
});

// ---------------------------------------------------------------------------
// UT-016-5 — a regra de negocio de US-9: *"`resume_plugins`, `resume_themes`,
// `install_languages` e `view_site_health_checks` nao estao em papel algum:
// entram por filtro de prioridade 1"* (`PERM-7`, BR-MIGRAR-093)
//
// entrada:  uma instalacao de fabrica, nos dois lados do conflito REQ-017, com a
//           conta de maior poder; um interceptador de terceiro no ponto
//           `user_has_cap`, que roda na prioridade de omissao; e a mesma conta
//           numa instalacao em rede, sem estar na lista de super administradores
// acao:     ler a prioridade e os nomes declarados; perguntar as quatro com o
//           interceptador registrado, capturando o mapa que chega a ele; e
//           perguntar o diagnostico do site com a rede ativa
// esperado: a prioridade declarada e 1 e os tres nomes do legado nao foram
//           traduzidos; o mapa que chega ao interceptador JA traz as quatro,
//           logo a concessao rodou antes dele, e ele consegue retirar o que o
//           nucleo concedeu; e o recorte de rede de UC-37 vale — em multisite o
//           administrador de site nao abre o diagnostico, e o super
//           administrador abre
// ---------------------------------------------------------------------------

test('UT-016-5 as quatro entram por filtro de PRIORIDADE 1: antes de toda extensao, e removiveis por ela (PERM-7)', () => {
  // A prioridade e parte da regra, nao detalhe: BR-MIGRAR-093 exige "um ponto de
  // injecao que rode antes dos pontos de extensao de terceiro".
  assert.equal(
    PRIORIDADE_DA_CONCESSAO_POR_EXTENSAO,
    1,
    'a prioridade do legado esta declarada, e e 1',
  );

  // Os nomes publicados dos tres interceptadores do nucleo, na ordem em que o
  // legado os registra (`default-filters.php:771`-`:773`). Nao sao enfeite: o
  // **P8** poe funcao publicada no contrato publico, e uma extensao que hoje faz
  // `remove_filter` escreve exatamente estas cadeias de caracteres.
  assert.deepEqual(
    CONCESSOES_POR_EXTENSAO_DE_FABRICA.map((entrada) => entrada.nome),
    [
      'wp_maybe_grant_install_languages_cap',
      'wp_maybe_grant_resume_extensions_caps',
      'wp_maybe_grant_site_health_caps',
    ],
    'os nomes dos tres interceptadores do legado nao foram traduzidos',
  );

  for (const lado of LADOS) {
    const { instalacao, porPapel } = instalacaoDeFabrica(lado);
    const administradora = contaDoPapel(porPapel, 'administrator');

    // Um interceptador de terceiro no ponto `user_has_cap`: ele roda na
    // prioridade de omissao, logo DEPOIS da prioridade 1.
    const mapasQueChegaram: ReadonlyMap<string, boolean>[] = [];
    const interceptadorQueObserva: GanchosDeAutorizacao = {
      aoMontarCapacidadesDoAtor(capacidades) {
        mapasQueChegaram.push(capacidades);
        return capacidades;
      },
    };

    assert.equal(
      instalacao.pode(administradora, 'resume_plugins', {
        ganchos: interceptadorQueObserva,
      }),
      true,
      `${lado}: a conta de maior poder retoma extensao pausada`,
    );

    assert.equal(
      mapasQueChegaram.length,
      1,
      `${lado}: o ponto de extensao deveria ter sido chamado uma vez`,
    );
    const observado = mapasQueChegaram[0];
    for (const capacidade of QUATRO_SO_POR_EXTENSAO) {
      // O mapa que chega ao interceptador JA traz as quatro: e exatamente isto
      // que "prioridade 1" quer dizer, e e o que um porte que concedesse depois
      // perderia sem o teste notar.
      assert.equal(
        observado?.get(capacidade),
        true,
        `${lado}: ${capacidade} chega ao ponto de extensao ja concedida`,
      );
    }

    // E o interceptador consegue RETIRAR o que o nucleo concedeu, que e a
    // consequencia de a concessao vir antes dele. Fechar isso produziria um
    // sistema mais aberto que o legado.
    const interceptadorQueRetira: GanchosDeAutorizacao = {
      aoMontarCapacidadesDoAtor(capacidades) {
        const sem = new Map(capacidades);
        sem.delete('resume_plugins');
        return sem;
      },
    };
    assert.equal(
      instalacao.pode(administradora, 'resume_plugins', {
        ganchos: interceptadorQueRetira,
      }),
      false,
      `${lado}: a extensao retira o que a prioridade 1 concedeu`,
    );
    assert.equal(
      instalacao.pode(administradora, 'resume_themes', {
        ganchos: interceptadorQueRetira,
      }),
      true,
      `${lado}: e retira so o que ela nomeia`,
    );

    // O recorte de rede de UC-37, e ele existe so para o diagnostico do site:
    // "concedida por filtro a quem tem `install_plugins`, e em multisite so a
    // super administrador" — com a excecao dizendo a consequencia, "em
    // multisite, administrador de site nao a abre nunca".
    const superAdministradora = instalacao.conta('raiz');
    instalacao.atribuir(superAdministradora, concedida('administrator'));
    const emRede: EstadoDaRedeNaAutorizacao = {
      ativa: true,
      loginsDeSuperAdmin: ['raiz'],
    };

    assert.equal(
      instalacao.pode(administradora, 'view_site_health_checks', { rede: emRede }),
      false,
      `${lado}: em rede o administrador de site nao abre o diagnostico`,
    );
    // E as outras tres nao tem recorte de rede: o legado comenta a razao —
    // "even in a multisite, regular administrators should be able to resume
    // plugins" (`capabilities.php:1326`).
    for (const capacidade of ['resume_plugins', 'resume_themes', 'install_languages'] as const) {
      assert.equal(
        instalacao.pode(administradora, capacidade, { rede: emRede }),
        true,
        `${lado}: em rede o administrador de site mantem ${capacidade}`,
      );
    }
    // O super administrador abre — e quem responde ali e o atalho de `PERM-9`,
    // que roda antes do ponto de extensao (ADR-0009, garantia 2), nao a
    // concessao de prioridade 1.
    assert.equal(
      instalacao.pode(superAdministradora, 'view_site_health_checks', {
        rede: emRede,
      }),
      true,
      `${lado}: em rede o super administrador abre o diagnostico`,
    );
  }
});
