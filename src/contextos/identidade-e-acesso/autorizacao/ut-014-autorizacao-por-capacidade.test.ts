/**
 * A entrega de **T016**: *"8 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-014-1, UT-014-2, UT-014-3, UT-014-4,
 * UT-014-5, UT-014-6, UT-014-7, UT-014-8), com o mesmo dado de entrada, acao e
 * resultado esperado. Os 3 testes de regra de negocio (UT-014-6, UT-014-7,
 * UT-014-8) entram na mesma suite."*
 *
 * ---
 *
 * ⚠️ **`backlog/tests.md` NAO EXISTE nesta arvore, e os oito casos foram
 * RECONSTRUIDOS, nao copiados.** O caminho que `tasks.md` cita resolve para
 * `backlog/tests.md` na raiz do repositorio, e ali nao ha nada: nem a pasta
 * `backlog/`, nem o arquivo, nem copia em `_discovery/`. As unicas mencoes ao
 * catalogo no pacote entregue o descrevem **de fora** — `parity_specs.md`
 * (*"os **985 testes** de `../backlog/tests.md` sao especificacao, nao
 * evidencia"*) e a primeira *Pergunta em aberto* de `spec.md` (*"e o unico
 * critério deste pacote sem nenhum teste registrado em `backlog/tests.md`"*).
 * Logo o enunciado de cada UT-014-* nao esta disponivel para ser seguido ao pe
 * da letra, e a frase *"com o mesmo dado de entrada, acao e resultado
 * esperado"* nao tem fonte a espelhar. T008 encontrou a mesma ausencia e a
 * registrou do mesmo modo em `../sessao/ut-003-expiracao-de-sessao.test.ts`.
 *
 * **Como os oito foram reconstruidos, e por que esta correspondencia e a
 * defensavel.** `tasks.md` da duas informacoes aritmeticas: US-7 tem **8** casos
 * e **3** deles sao *"testes de regra de negocio (UT-014-6, UT-014-7,
 * UT-014-8)"*. Sobram 5 casos, e US-7 tem exatamente **5** critérios de aceite,
 * na ordem. E `spec.md` lista para US-7 exatamente **3** regras de negocio. A
 * mesma aritmetica fecha em nove das onze historias da feature (US-2: 3 critérios
 * e 3 casos, 0 regras; US-3: 4 e 5, 1 regra; US-4: 5 e 6, 1; US-5: 3 e 4, 1;
 * US-6: 6 e 8, 2; US-8: 5 e 7, 2; US-9: 4 e 5, 1; US-10: 5 e 6, 1; US-11: 7 e 8,
 * 1). A correspondencia adotada:
 *
 * | caso | o que afirma | fonte |
 * |---|---|---|
 * | `UT-014-1` | CA-7.1 — nenhuma decisao compara nome de papel; toda verificacao pergunta por capacidade | `spec.md`, US-7; **P3** da constituicao |
 * | `UT-014-2` | CA-7.2 — papel para capacidades e dado consultavel e editavel em execucao | `spec.md`, US-7 |
 * | `UT-014-3` | CA-7.3 — negacao explicita vence qualquer concessao, inclusive a do ator de maior poder | `spec.md`, US-7 |
 * | `UT-014-4` | CA-7.4 — da para responder, por consulta ao armazenamento, quem tem uma capacidade | `spec.md`, US-7 |
 * | `UT-014-5` | CA-7.5 — toda capacidade exigida consta da matriz declarada | `spec.md`, US-7 |
 * | `UT-014-6` | a regra ADR-0001 / `PERM-13` (BR-MIGRAR-099): o papel e dado mutavel, nao codigo | `spec.md`, US-7, 1ª regra |
 * | `UT-014-7` | a regra ADR-0009 / `PERM-9` (BR-MIGRAR-095): a negacao explicita vence o super admin | `spec.md`, US-7, 2ª regra |
 * | `UT-014-8` | a regra "pegadinha 5" / `PERM-2` (BR-MIGRAR-088): nenhuma consulta SQL responde "quem e administrador" | `spec.md`, US-7, 3ª regra |
 *
 * **O que isto deixa devendo, declarado para nao ser descoberto depois:** se o
 * catalogo aparecer e um UT-014-* tiver dado de entrada diferente do que esta
 * aqui, o caso de la vale e este arquivo muda. A reconstrucao nao inventa
 * comportamento — cada assercao sai de `spec.md`, de `target_business_rules.md`,
 * dos ADRs 0001 e 0009 ou de UC-24, UC-07 e UC-43, que sao os casos de uso que a
 * tabela de rastreabilidade de `spec.md` liga a US-7.
 *
 * ---
 *
 * # Nao sao os testes de critério de T015
 *
 * T015 entrega *"o comportamento de US-7 existe e os critérios CA-7.1 a CA-7.5
 * passam"* e tem a suite dela em
 * `../../../plataforma/autorizacao/us-7-autorizacao-por-capacidade.test.ts`, no
 * nivel da **unidade**: a politica com matriz escrita a mao, papeis de nome
 * inventado e ator montado por literal — de proposito, porque *"se a decisao
 * conhecesse os nomes de fabrica, estes testes passariam por acidente"*.
 *
 * Esta suite e o catalogo UT-014-*, no nivel do **cenario**: cada caso parte de
 * uma instalacao com banco, atravessa a matriz **gravada** na opcao
 * `{site}user_roles` pelas oito rotinas de povoamento, a autorizacao da conta
 * **gravada** na chave `{site}capabilities`, o codec do formato serializado e o
 * adaptador de `fonte-de-papeis.ts`, e so entao chega a `perguntarPermissao`. As
 * duas suites afirmam a mesma regra por caminhos diferentes de proposito — se so
 * a politica estiver certa e a costura com o dado estiver errada, esta e a que
 * abre.
 *
 * E e por isso que ela mora aqui, em `contextos/`, e nao ao lado da politica: a
 * regra de dependencia 2 de `target_architecture.md` proibe `plataforma/`
 * importar `contextos/`, e um caso de ponta a ponta precisa dos dois lados.
 *
 * **T016 depende de T015** (`tasks.md`: *"depende de: T015"*), e por isso importa
 * `plataforma/autorizacao/` e `./fonte-de-papeis.js`, que sao de T015: numa
 * arvore sem T015 esta suite nao compila, que e o que a dependencia declarada
 * significa. Nenhum arquivo fora desta suite e tocado, como o `[P]` de T016
 * exige — *"tarefa de teste, que toca so a propria suite"*.
 *
 * ---
 *
 * # 🔴 O conflito REQ-017 e exercitado nos dois lados, e nenhum e escolhido
 *
 * As pseudocapacidades de nivel numerico (`level_0` a `level_10`) estao em
 * disputa entre o card `REQ-017` (prioridade `wont`) e a resposta 5 de
 * `questions.md`, e a tabela **Nao negociavel** da constituicao poe a
 * reconciliacao fora do alcance de quem codifica. T002 isolou a decisao num
 * argumento obrigatorio sem valor padrao; esta suite faz o que resta a um teste:
 * **todo caso que semeia a matriz de fabrica roda nos dois lados**, com a mesma
 * expectativa, dentro de um unico `test()` — assim a contagem de oito casos
 * continua sendo oito e nenhum lado e escolhido por omissao.
 *
 * # 🔴 Um ponto que esta suite encontrou aberto, e NAO resolveu
 *
 * **Repovoar sobre uma definicao ja customizada preserva a customizacao, ou a
 * substitui?**
 *
 * - ADR-0001 descreve o mecanismo como `use_db = false` sobre o `$wp_roles`
 *   **corrente** — que foi carregado da opcao gravada — seguido de uma gravacao
 *   unica, e registra como consequencia que *"um site instalado em 2010 e
 *   atualizado desde entao tem papeis cuja historia nao esta em
 *   `populate_roles()` — esta no que os plugins fizeram"*. E `../armazenamento/papel.ts`
 *   diz, sobre o construtor que T002 escreveu: *"`adicionarPapel` nao faz nada se
 *   o papel ja existe — e por isso que repovoar nao apaga customizacao de papel
 *   existente"*. As duas frases juntas descrevem preservacao.
 * - `semearMatrizDeFabrica` de T002 chama `povoarPapeis()`, que parte de um
 *   construtor **vazio**, logo hoje ela substitui a definicao gravada pela de
 *   fabrica.
 *
 * Nenhum documento deste pacote afirma qual das duas e o comportamento do legado:
 * a preservacao e inferencia sobre o `add_role()` do legado, cujo fonte nao esta
 * nesta arvore. UT-014-6 **fixa o comportamento implementado** e nomeia onde a
 * outra leitura mudaria a assercao, do mesmo jeito que UT-003-5 fez com a
 * carencia da sessao. A conferencia e contra o oraculo executavel
 * (`ESC-ORACULO`, BR-MIGRAR-116), que nesta arvore nao existe
 * (`oracleAvailable: false`), e **nao** e decisao de quem escreve teste.
 */

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  atorDeAutorizacao,
  candidatosComCapacidade,
  capacidadesDeclaradas,
  capacidadesDeclaradasPorRegra,
  capacidadesExigidas,
  capacidadesExigidasSemDeclaracao,
  comAtor,
  ehSuperAdmin,
  papeisQueConcedem,
  perguntarPermissao,
  quemTemCapacidade,
  type BaseDeAutorizacao,
  type ConstantesDoServidor,
  type EstadoDaRedeNaAutorizacao,
  type FonteDeAutorizacao,
  type GanchosDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarArmazenamento,
  criarConstrutorDeDefinicao,
  escaparParaLike,
  povoarPapeis,
  type Armazenamento,
  type ConcessaoDeCapacidade,
  type DefinicaoDePapeis,
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
// A montagem: uma instalacao com banco, e os dois lados do conflito REQ-017
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
 * Uma linha de `usermeta`, com a tabela em que ela vive.
 *
 * A tabela entra na linha porque UT-014-8 precisa de **duas** instalacoes
 * compartilhando `usermeta` e `users` e separando `options`: e assim que uma
 * rede guarda a mesma identidade com autorizacao diferente por site
 * (BR-MIGRAR-088).
 */
interface LinhaDeMetadado {
  readonly tabela: string;
  readonly umeta_id: number;
  readonly user_id: number;
  readonly meta_key: string;
  readonly meta_value: ValorDeColuna;
}

/** Uma linha de `users`, com as duas colunas que a autorizacao le. */
interface LinhaDeConta {
  readonly tabela: string;
  readonly ID: number;
  readonly user_login: string;
}

interface Banco {
  /** Toda leitura e toda escrita pedidas, na ordem. */
  readonly consultas: Consulta[];
  readonly escritas: Consulta[];
  /** Uma porta sobre este mesmo banco, com os dois prefixos informados. */
  porta(prefixoDeTabela: string, prefixoBaseDeTabela: string): PortaDeDados;
  /** O valor gravado numa opcao, como texto, para afirmar bytes. */
  opcao(tabela: string, nome: string): string | null;
  /** O valor gravado numa chave de metadado, como texto. */
  metadado(tabela: string, contaId: number, chave: string): string | null;
  /**
   * Poe a linha de `users` direto.
   *
   * Direto, e nao pelo fluxo de cadastro: criar conta e US-6 / T013, e fazer os
   * casos de US-7 dependerem dela os faria falhar por motivo alheio.
   */
  inserirLinhaDeConta(tabela: string, id: number, login: string): void;
}

/**
 * O banco desta suite: ele **registra** toda consulta e tambem **responde** a
 * partir do que foi escrito.
 *
 * `../armazenamento/porta-falsa.ts` explica por que as suites de T002 em diante
 * usam uma porta que so registra: o criterio de paridade desta area e *"efeito
 * no banco"*, e o que se afirma e qual comando sai, com quais parametros e com
 * quais bytes. Aqui o registro continua — `consultas` e `escritas` estao
 * expostas e UT-014-8 e feito sobre elas — e a resposta por estado foi
 * acrescentada porque **um caso de US-7 atravessa varias leituras encadeadas**:
 * semear a opcao, reler a opcao, ler a autorizacao da conta, ler o login,
 * percorrer candidatos. Com respostas programadas em fila, a ordem da fila
 * passaria a ser o objeto do teste em vez da decisao.
 *
 * Toda consulta que esta montagem nao reconhece **lanca**. Se uma consulta do
 * armazenamento mudar de forma, o caso diz qual, em vez de responder vazio e
 * fazer a assercao falhar tres passos adiante.
 */
function criarBanco(): Banco {
  const opcoes = new Map<string, ValorDeColuna>();
  const metadados: LinhaDeMetadado[] = [];
  const contas: LinhaDeConta[] = [];
  const consultas: Consulta[] = [];
  const escritas: Consulta[] = [];
  let proximoMetaId = 1;

  function chaveDeOpcao(tabela: string, nome: string): string {
    return `${tabela}\u0000${nome}`;
  }

  function responderLeitura(consulta: Consulta): readonly LinhaDeResultado[] {
    const { texto, parametros } = consulta;

    if (texto.startsWith('SELECT option_value FROM ')) {
      const tabela = entre(texto, 'FROM ', ' WHERE');
      const valor = opcoes.get(chaveDeOpcao(tabela, comoCadeia(parametros[0])));
      return valor === undefined ? [] : [{ option_value: valor }];
    }

    if (texto.startsWith('SELECT user_id FROM ')) {
      const tabela = entre(texto, 'FROM ', ' WHERE');
      const chave = comoCadeia(parametros[0]);
      const padrao = comoCadeia(parametros[1]);
      return metadados
        .filter(
          (linha) =>
            linha.tabela === tabela &&
            linha.meta_key === chave &&
            casaComLike(comoCadeia(linha.meta_value), padrao),
        )
        .map((linha) => ({ user_id: linha.user_id }));
    }

    if (texto.startsWith('SELECT umeta_id, user_id, meta_key, meta_value FROM ')) {
      const tabela = entre(texto, 'FROM ', ' WHERE');
      const contaId = Number(parametros[0]);
      const porChave = texto.includes('AND meta_key = ?');
      const chave = porChave ? comoCadeia(parametros[1]) : null;
      return metadados
        .filter(
          (linha) =>
            linha.tabela === tabela &&
            linha.user_id === contaId &&
            (chave === null || linha.meta_key === chave),
        )
        .map((linha) => ({
          umeta_id: linha.umeta_id,
          user_id: linha.user_id,
          meta_key: linha.meta_key,
          meta_value: linha.meta_value,
        }));
    }

    if (texto.startsWith('SELECT ID, user_login')) {
      const tabela = entre(texto, 'FROM ', ' WHERE');
      const id = Number(parametros[0]);
      return contas
        .filter((linha) => linha.tabela === tabela && linha.ID === id)
        .map((linha) => ({ ID: linha.ID, user_login: linha.user_login }));
    }

    throw new Error(`leitura nao prevista por esta montagem: ${texto}`);
  }

  function responderEscrita(consulta: Consulta): void {
    const { texto, parametros } = consulta;

    if (texto.includes('(option_name, option_value) VALUES')) {
      const tabela = entre(texto, 'INSERT INTO ', ' (');
      opcoes.set(
        chaveDeOpcao(tabela, comoCadeia(parametros[0])),
        parametros[1] ?? null,
      );
      return;
    }

    if (texto.includes('SET option_value = ?')) {
      const tabela = entre(texto, 'UPDATE ', ' SET');
      opcoes.set(
        chaveDeOpcao(tabela, comoCadeia(parametros[1])),
        parametros[0] ?? null,
      );
      return;
    }

    if (texto.includes('(user_id, meta_key, meta_value) VALUES')) {
      const tabela = entre(texto, 'INSERT INTO ', ' (');
      metadados.push({
        tabela,
        umeta_id: proximoMetaId,
        user_id: Number(parametros[0]),
        meta_key: comoCadeia(parametros[1]),
        meta_value: parametros[2] ?? null,
      });
      proximoMetaId += 1;
      return;
    }

    if (texto.includes('SET meta_value = ?')) {
      const tabela = entre(texto, 'UPDATE ', ' SET');
      const contaId = Number(parametros[1]);
      const chave = comoCadeia(parametros[2]);
      for (let indice = 0; indice < metadados.length; indice += 1) {
        const linha = metadados[indice] as LinhaDeMetadado;
        if (
          linha.tabela === tabela &&
          linha.user_id === contaId &&
          linha.meta_key === chave
        ) {
          metadados[indice] = { ...linha, meta_value: parametros[0] ?? null };
        }
      }
      return;
    }

    if (texto.startsWith('DELETE FROM ')) {
      const tabela = entre(texto, 'DELETE FROM ', ' WHERE');
      const contaId = Number(parametros[0]);
      const chave = comoCadeia(parametros[1]);
      for (let indice = metadados.length - 1; indice >= 0; indice -= 1) {
        const linha = metadados[indice] as LinhaDeMetadado;
        if (
          linha.tabela === tabela &&
          linha.user_id === contaId &&
          linha.meta_key === chave
        ) {
          metadados.splice(indice, 1);
        }
      }
      return;
    }

    throw new Error(`escrita nao prevista por esta montagem: ${texto}`);
  }

  return {
    consultas,
    escritas,

    porta(prefixoDeTabela, prefixoBaseDeTabela) {
      return {
        prefixoDeTabela,
        prefixoBaseDeTabela,
        selecionar(consulta) {
          consultas.push(consulta);
          return responderLeitura(consulta);
        },
        escrever(consulta) {
          consultas.push(consulta);
          escritas.push(consulta);
          responderEscrita(consulta);
          // `linhasAfetadas: 1` porque esta montagem so recebe escrita que
          // alcanca linha: a decisao de nao escrever e do repositorio, e e
          // afirmada pela lista `escritas` estar vazia, nao por este retorno.
          return { linhasAfetadas: 1, idGerado: proximoMetaId };
        },
      };
    },

    opcao(tabela, nome) {
      const valor = opcoes.get(chaveDeOpcao(tabela, nome));
      return valor === undefined ? null : comoCadeia(valor);
    },

    metadado(tabela, contaId, chave) {
      const linha = metadados.find(
        (candidata) =>
          candidata.tabela === tabela &&
          candidata.user_id === contaId &&
          candidata.meta_key === chave,
      );
      return linha === undefined ? null : comoCadeia(linha.meta_value);
    },

    inserirLinhaDeConta(tabela, id, login) {
      contas.push({ tabela, ID: id, user_login: login });
    },
  };
}

/** O trecho entre dois marcadores do texto de uma consulta. */
function entre(texto: string, inicio: string, fim: string): string {
  const daqui = texto.indexOf(inicio);
  const ate = texto.indexOf(fim, daqui + inicio.length);
  return texto.slice(daqui + inicio.length, ate === -1 ? undefined : ate);
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
 * reproduzi-lo, UT-014-4 e UT-014-8 nao teriam resposta para conferir.
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
  readonly constantes?: ConstantesDoServidor;
  readonly ganchos?: GanchosDeAutorizacao;
}

interface Instalacao {
  readonly banco: Banco;
  readonly armazenamento: Armazenamento;
  readonly fonte: FonteDeAutorizacao;
  /** `{site}options`, `{base}usermeta`, `{base}users` desta instalacao. */
  readonly tabelaDeOpcoes: string;
  readonly tabelaDeMetadados: string;
  readonly tabelaDeContas: string;
  /** `{site}capabilities` — a chave com o site dentro do nome. */
  readonly chaveDeCapacidades: string;
  /** O nome da opcao da definicao de papeis desta instalacao. */
  readonly opcaoDePapeis: string;
  /**
   * A base da pergunta, com a matriz **relida do armazenamento a cada
   * chamada**.
   *
   * Relida e nao guardada: e isso que CA-7.2 cobra e o que o risco 4 do
   * `plan.md` avisa que um cache mudaria — *"muda o momento em que uma alteracao
   * de papel passa a valer, o que e observavel"*.
   */
  base(resto?: RestoDaBase): BaseDeAutorizacao;
  /** A pergunta de permissao, de ponta a ponta. */
  pode(contaId: number, capacidade: string, resto?: RestoDaBase): boolean;
  /** Cria a linha de `users` e devolve o identificador. */
  conta(login: string): number;
  /** Grava `{site}capabilities` daquela conta, como o legado a grava. */
  atribuir(contaId: number, ...concessoes: readonly ConcessaoDeCapacidade[]): void;
  /** Semeia a matriz de fabrica pelo lado informado do conflito REQ-017. */
  semear(lado: LadoDoConflitoDeNivelNumerico): DefinicaoDePapeis;
  /** A definicao como esta gravada agora, interpretada. */
  definicao(): DefinicaoDePapeis;
  /** Grava uma definicao inteira, como uma extensao a reescreveria. */
  gravarDefinicao(definicao: DefinicaoDePapeis): boolean;
  /** Edita a definicao gravada pelo construtor do legado, e regrava. */
  editar(alteracao: (construtor: ReturnType<typeof criarConstrutorDeDefinicao>) => void): void;
}

/**
 * Uma instalacao: o armazenamento de T002 sobre o banco, e a costura de T015
 * por cima.
 *
 * Os dois prefixos sao argumento porque a diferenca entre eles **e** a regra que
 * UT-014-8 afirma: `users` e `usermeta` sao globais e ficam no prefixo base,
 * `options` e por site, e a chave de autorizacao leva o prefixo do site dentro
 * do nome.
 */
function criarInstalacao(
  opcoes: {
    readonly banco?: Banco;
    readonly prefixoDeTabela?: string;
    readonly prefixoBaseDeTabela?: string;
  } = {},
): Instalacao {
  const banco = opcoes.banco ?? criarBanco();
  const prefixoDeTabela = opcoes.prefixoDeTabela ?? 'wp_';
  const prefixoBaseDeTabela = opcoes.prefixoBaseDeTabela ?? prefixoDeTabela;
  const armazenamento = criarArmazenamento(
    banco.porta(prefixoDeTabela, prefixoBaseDeTabela),
  );
  const fonte = criarFonteDeAutorizacao(armazenamento);
  const tabelaDeContas = `${prefixoBaseDeTabela}users`;
  let proximaConta = 1;

  const instalacao: Instalacao = {
    banco,
    armazenamento,
    fonte,
    tabelaDeOpcoes: `${prefixoDeTabela}options`,
    tabelaDeMetadados: `${prefixoBaseDeTabela}usermeta`,
    tabelaDeContas,
    chaveDeCapacidades: `${prefixoDeTabela}capabilities`,
    opcaoDePapeis: `${prefixoDeTabela}user_roles`,

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
      banco.inserirLinhaDeConta(tabelaDeContas, id, login);
      return id;
    },

    atribuir(contaId, ...concessoes) {
      armazenamento.papeis.gravarCapacidadesDaConta(contaId, concessoes);
    },

    semear(lado) {
      return armazenamento.papeis.semearMatrizDeFabrica(lado);
    },

    definicao() {
      const gravada = armazenamento.papeis.obterDefinicao();
      assert.notEqual(gravada, null, 'a definicao deveria estar gravada');
      assert.notEqual(
        gravada?.interpretado,
        null,
        'a definicao gravada deveria ser interpretavel',
      );
      return gravada?.interpretado ?? [];
    },

    gravarDefinicao(definicao) {
      return armazenamento.papeis.gravarDefinicao(definicao);
    },

    editar(alteracao) {
      const construtor = criarConstrutorDeDefinicao(instalacao.definicao());
      alteracao(construtor);
      armazenamento.papeis.gravarDefinicao(construtor.resultado());
    },
  };

  return instalacao;
}

/** Uma concessao concedida, no formato em que `{site}capabilities` a guarda. */
function concedida(capacidade: string): ConcessaoDeCapacidade {
  return { capacidade, concedida: true };
}

/** Uma concessao **negada** — o mesmo mapa guarda as duas (`PERM-1`). */
function negada(capacidade: string): ConcessaoDeCapacidade {
  return { capacidade, concedida: false };
}

/** Uma instalacao com a matriz de fabrica semeada pelo lado informado. */
function instalacaoDeFabrica(lado: LadoDoConflitoDeNivelNumerico): Instalacao {
  const instalacao = criarInstalacao();
  instalacao.semear(lado);
  return instalacao;
}

/** Troca o identificador de um papel preservando as capacidades dele. */
function renomearPapel(
  definicao: DefinicaoDePapeis,
  de: string,
  para: string,
): DefinicaoDePapeis {
  return definicao.map((entrada) =>
    entrada.identificador === de
      ? { identificador: para, papel: entrada.papel }
      : entrada,
  );
}

// ===========================================================================
// UT-014-1 — CA-7.1
// ===========================================================================

/**
 * Os cinco papeis que o legado semeia, aqui como **lista proibida**: e esta a
 * busca que o **P3** da constituicao manda fazer, em uma linha — *"uma busca por
 * nome de papel dentro de decisao de autorizacao devolve zero ocorrencias"*.
 */
const NOMES_DE_PAPEL_DE_FABRICA: readonly string[] = [
  'administrator',
  'editor',
  'author',
  'contributor',
  'subscriber',
];

/**
 * As duas pastas em que a **decisao** mora, e so elas.
 *
 * `plataforma/autorizacao/` e a politica; `contextos/identidade-e-acesso/autorizacao/`
 * e a costura que entrega o dado a ela. `../armazenamento/` fica **fora** de
 * proposito: ali os nomes de papel sao **dado** — as oito rotinas de povoamento
 * os escrevem —, e o P3 fala de decisao, nao de dado.
 */
const PASTAS_DA_DECISAO: readonly (readonly string[])[] = [
  ['src', 'plataforma', 'autorizacao'],
  ['src', 'contextos', 'identidade-e-acesso', 'autorizacao'],
];

/** A raiz do projeto, achada pelo `package.json`. */
function raizDoProjeto(): string {
  let pasta = dirname(fileURLToPath(import.meta.url));
  for (let salto = 0; salto < 10; salto += 1) {
    try {
      readFileSync(join(pasta, 'package.json'));
      return pasta;
    } catch {
      pasta = dirname(pasta);
    }
  }
  throw new Error('raiz do projeto nao encontrada a partir do teste');
}

/**
 * O fonte da decisao, **sem comentario** e sem arquivo de teste.
 *
 * Sem comentario porque a busca do P3 e sobre decisao, e prosa explicando a
 * regra cita os nomes — este proprio arquivo cita os cinco. Sem arquivo de
 * teste porque teste monta caso; ele nao decide.
 */
function fonteDaDecisao(): readonly { readonly arquivo: string; readonly codigo: string }[] {
  const raiz = raizDoProjeto();
  const lidos: { arquivo: string; codigo: string }[] = [];
  for (const partes of PASTAS_DA_DECISAO) {
    const pasta = join(raiz, ...partes);
    for (const arquivo of readdirSync(pasta)) {
      if (!arquivo.endsWith('.ts') || arquivo.endsWith('.test.ts')) {
        continue;
      }
      lidos.push({
        arquivo: join(...partes, arquivo),
        codigo: readFileSync(join(pasta, arquivo), 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, ' ')
          .replace(/\/\/.*$/gm, ' '),
      });
    }
  }
  return lidos;
}

// ---------------------------------------------------------------------------
// UT-014-1 — CA-7.1 *"Nenhuma decisao de autorizacao compara nome de papel:
// toda verificacao pergunta por uma capacidade"*
//
// entrada:  a matriz de fabrica gravada, nos dois lados do conflito REQ-017; uma
//           conta com o papel `administrator`, uma com `editor`, e uma com um
//           papel de nome inventado que tem **a mesma** lista de capacidades de
//           `editor`
// acao:     perguntar as mesmas capacidades para as tres; e renomear `editor`
//           para `revisor` sem tocar nas capacidades dele
// esperado: a decisao acompanha a capacidade e nunca o nome — conjuntos iguais
//           respondem igual, renomear nao altera resultado — e o fonte da
//           decisao nao menciona nenhum dos cinco nomes de fabrica (P3)
// ---------------------------------------------------------------------------

test('UT-014-1 a decisao e por capacidade: nome de papel nao decide nada, e nao aparece no fonte da decisao (CA-7.1)', () => {
  // As capacidades perguntadas: uma que `editor` tem e uma que ele nao tem.
  const PERGUNTADAS = ['moderate_comments', 'manage_options'] as const;

  for (const lado of LADOS) {
    const instalacao = instalacaoDeFabrica(lado);

    const admin = instalacao.conta('ada');
    instalacao.atribuir(admin, concedida('administrator'));
    const editora = instalacao.conta('bia');
    instalacao.atribuir(editora, concedida('editor'));

    // Um papel de nome que nenhuma das oito rotinas produz, com a MESMA lista de
    // capacidades de `editor`. Se o nome decidisse algo, ele decidiria aqui.
    const capacidadesDeEditor =
      instalacao
        .definicao()
        .find((entrada) => entrada.identificador === 'editor')?.papel
        .capacidades ?? [];
    assert.ok(
      capacidadesDeEditor.length > 0,
      `${lado}: a matriz de fabrica deveria trazer editor`,
    );
    instalacao.editar((construtor) => {
      construtor.adicionarPapel('papel-de-outro-nome', 'Papel De Outro Nome');
      for (const concessao of capacidadesDeEditor) {
        construtor.adicionarCapacidade(
          'papel-de-outro-nome',
          concessao.capacidade,
          concessao.concedida,
        );
      }
    });
    const homonima = instalacao.conta('cleo');
    instalacao.atribuir(homonima, concedida('papel-de-outro-nome'));

    for (const capacidade of PERGUNTADAS) {
      assert.equal(
        instalacao.pode(homonima, capacidade),
        instalacao.pode(editora, capacidade),
        `${lado}: ${capacidade} — dois nomes, as mesmas capacidades, a mesma decisao`,
      );
    }

    // E as duas contas NAO respondem igual ao administrador: o conjunto de
    // capacidades e que decide, e os conjuntos sao diferentes.
    assert.equal(instalacao.pode(admin, 'manage_options'), true, `${lado}: admin`);
    assert.equal(
      instalacao.pode(editora, 'manage_options'),
      false,
      `${lado}: editor nao tem manage_options na matriz de fabrica`,
    );

    // *"renomear papel sem mudar capacidade nao altera resultado"* (P3): o
    // identificador gravado troca, a lista de concessoes nao.
    const antes = PERGUNTADAS.map((capacidade) =>
      instalacao.pode(editora, capacidade),
    );
    instalacao.gravarDefinicao(
      renomearPapel(instalacao.definicao(), 'editor', 'revisor'),
    );
    instalacao.atribuir(editora, concedida('revisor'));
    const depois = PERGUNTADAS.map((capacidade) =>
      instalacao.pode(editora, capacidade),
    );
    assert.deepEqual(depois, antes, `${lado}: renomear o papel nao muda a decisao`);

    // E o nome antigo deixou de ser papel: a conta que ficou com ele perde o que
    // o papel concedia, porque quem diz que um nome e papel e a MATRIZ.
    const presa = instalacao.conta('dora');
    instalacao.atribuir(presa, concedida('editor'));
    assert.equal(
      instalacao.pode(presa, 'moderate_comments'),
      false,
      `${lado}: o nome que saiu da matriz nao concede mais nada`,
    );
  }

  // A busca do P3, sobre o fonte da decisao e da costura, sem comentario.
  const arquivos = fonteDaDecisao();
  assert.ok(arquivos.length > 0, 'o fonte da decisao deveria ter sido lido');
  for (const { arquivo, codigo } of arquivos) {
    for (const nome of NOMES_DE_PAPEL_DE_FABRICA) {
      assert.equal(
        codigo.includes(nome),
        false,
        `${arquivo} menciona o papel "${nome}" em codigo de decisao (P3)`,
      );
    }
  }
});

// ---------------------------------------------------------------------------
// UT-014-2 — CA-7.2 *"O conjunto papel → capacidades e dado consultavel e
// editavel em tempo de execucao, nao constante de codigo"*
//
// entrada:  a matriz de fabrica gravada, nos dois lados; uma conta com `editor`
// acao:     perguntar; acrescentar `manage_options` a `editor` em execucao;
//           perguntar de novo; depois negar uma capacidade que ele tinha; e
//           criar, em execucao, um papel que o codigo nunca produz
// esperado: a resposta muda com o dado, nos tres casos, e os bytes gravados na
//           opcao mudam junto — nada e lido do codigo depois do povoamento
// ---------------------------------------------------------------------------

test('UT-014-2 o conjunto papel por capacidade e dado: editar em execucao muda a decisao (CA-7.2)', () => {
  for (const lado of LADOS) {
    const instalacao = instalacaoDeFabrica(lado);
    const editora = instalacao.conta('bia');
    instalacao.atribuir(editora, concedida('editor'));

    const bytesDeFabrica = instalacao.banco.opcao(
      instalacao.tabelaDeOpcoes,
      instalacao.opcaoDePapeis,
    );
    assert.notEqual(bytesDeFabrica, null, `${lado}: a opcao deveria estar gravada`);

    // 1. Acrescentar capacidade a um papel em execucao passa a conceder.
    assert.equal(instalacao.pode(editora, 'manage_options'), false, `${lado}: antes`);
    instalacao.editar((construtor) => {
      construtor.adicionarCapacidade('editor', 'manage_options');
    });
    assert.equal(instalacao.pode(editora, 'manage_options'), true, `${lado}: depois`);

    const bytesAlterados = instalacao.banco.opcao(
      instalacao.tabelaDeOpcoes,
      instalacao.opcaoDePapeis,
    );
    assert.notEqual(
      bytesAlterados,
      bytesDeFabrica,
      `${lado}: a alteracao tem de estar GRAVADA, nao so em memoria`,
    );
    assert.ok(
      (bytesAlterados ?? '').includes('"manage_options"'),
      `${lado}: o nome da capacidade entra no texto serializado da opcao`,
    );

    // 2. Negar, em execucao, uma capacidade que o papel concedia tambem vale: o
    //    mesmo mapa guarda concessao e negacao, e `b:0` nao e ausencia.
    assert.equal(instalacao.pode(editora, 'moderate_comments'), true, `${lado}: antes`);
    instalacao.editar((construtor) => {
      construtor.adicionarCapacidade('editor', 'moderate_comments', false);
    });
    assert.equal(
      instalacao.pode(editora, 'moderate_comments'),
      false,
      `${lado}: negar em execucao tira a capacidade`,
    );

    // 3. Um papel que o codigo NUNCA produz concede o que ele declara. E a prova
    //    de que a matriz nao e constante de codigo: `povoarPapeis` nao conhece
    //    este identificador nem esta capacidade.
    const deFabrica = povoarPapeis(lado);
    assert.equal(
      deFabrica.some((entrada) => entrada.identificador === 'papel-de-plugin'),
      false,
      `${lado}: o codigo nao deveria conhecer papel-de-plugin`,
    );
    instalacao.editar((construtor) => {
      construtor.adicionarPapel('papel-de-plugin', 'Papel De Plugin');
      construtor.adicionarCapacidade('papel-de-plugin', 'publicar_no_mural');
    });
    const assinante = instalacao.conta('eva');
    instalacao.atribuir(assinante, concedida('papel-de-plugin'));
    assert.equal(
      instalacao.pode(assinante, 'publicar_no_mural'),
      true,
      `${lado}: papel criado em execucao concede o que declara`,
    );

    // E a mesma pergunta, repetida, continua respondendo pela matriz gravada —
    // nenhuma resposta ficou guardada entre as duas (risco 4 do `plan.md`).
    assert.equal(instalacao.pode(assinante, 'publicar_no_mural'), true, `${lado}: de novo`);
  }
});

// ---------------------------------------------------------------------------
// UT-014-3 — CA-7.3 *"Uma negacao explicita vence qualquer concessao, inclusive
// a do ator de maior poder da instalacao"*
//
// entrada:  a matriz de fabrica gravada, nos dois lados; uma conta com
//           `administrator` (que tem `unfiltered_html` e `unfiltered_upload` na
//           matriz) e, em rede, um super administrador
// acao:     perguntar com as constantes de fabrica e com `DISALLOW_UNFILTERED_HTML`
//           definida; gravar `do_not_allow` como concessao da conta; e conceder
//           `do_not_allow` por ponto de extensao
// esperado: a negacao vence a concessao gravada, vence o super administrador,
//           nao pode ser possuida e nao pode ser concedida por extensao
// ---------------------------------------------------------------------------

test('UT-014-3 a negacao explicita vence a concessao, o administrador e o super administrador (CA-7.3)', () => {
  for (const lado of LADOS) {
    const instalacao = instalacaoDeFabrica(lado);
    const admin = instalacao.conta('ada');
    instalacao.atribuir(admin, concedida('administrator'));

    // A concessao existe na matriz, e de fabrica ela vale.
    assert.equal(
      papeisQueConcedem(instalacao.base().matriz, 'unfiltered_html').includes(
        'administrator',
      ),
      true,
      `${lado}: a matriz concede unfiltered_html ao administrador`,
    );
    assert.equal(instalacao.pode(admin, 'unfiltered_html'), true, `${lado}: de fabrica`);

    // A declaracao do dono do servidor **retira** o poder de quem o tem — e e o
    // unico mecanismo do sistema que funciona assim (`PERM-8`).
    const comHtmlProibido: RestoDaBase = {
      constantes: { DISALLOW_UNFILTERED_HTML: true },
    };
    assert.equal(
      instalacao.pode(admin, 'unfiltered_html', comHtmlProibido),
      false,
      `${lado}: a negacao vence a concessao gravada`,
    );

    // E em rede ela vence tambem o ator de maior poder da instalacao, que recebe
    // tudo **menos** o negado (ADR-0009).
    const rede: EstadoDaRedeNaAutorizacao = {
      ativa: true,
      loginsDeSuperAdmin: ['ada'],
    };
    assert.equal(
      instalacao.pode(admin, 'unfiltered_html', { rede }),
      true,
      `${lado}: o super administrador recebe o que nao esta negado`,
    );
    assert.equal(
      instalacao.pode(admin, 'unfiltered_html', {
        rede,
        constantes: { DISALLOW_UNFILTERED_HTML: true },
      }),
      false,
      `${lado}: a negacao vence o super administrador`,
    );

    // A capacidade negada nao pode ser POSSUIDA: gravada na conta, ela nao
    // concede nada, nem a si mesma.
    const teimosa = instalacao.conta('bia');
    instalacao.atribuir(
      teimosa,
      concedida('administrator'),
      concedida('do_not_allow'),
    );
    assert.equal(
      instalacao.pode(teimosa, 'do_not_allow'),
      false,
      `${lado}: ninguem pode ter do_not_allow`,
    );
    assert.equal(
      instalacao.pode(teimosa, 'unfiltered_html', comHtmlProibido),
      false,
      `${lado}: te-la gravada nao reabre o que a constante fechou`,
    );

    // Nem por ponto de extensao: o `user_has_cap` roda ANTES das duas
    // sinteticas, logo conceder a negada por ali nao chega a comparacao.
    const concedendoTudo: GanchosDeAutorizacao = {
      aoMontarCapacidadesDoAtor(capacidades) {
        const copia = new Map(capacidades);
        copia.set('do_not_allow', true);
        copia.set('unfiltered_html', true);
        return copia;
      },
    };
    assert.equal(
      instalacao.pode(admin, 'unfiltered_html', {
        constantes: { DISALLOW_UNFILTERED_HTML: true },
        ganchos: concedendoTudo,
      }),
      false,
      `${lado}: extensao nenhuma concede do_not_allow`,
    );

    // A inversa, e ela tem efeito JA de fabrica: sem `ALLOW_UNFILTERED_UPLOADS`
    // a capacidade e negada mesmo a quem a matriz a concede.
    assert.equal(
      papeisQueConcedem(instalacao.base().matriz, 'unfiltered_upload').includes(
        'administrator',
      ),
      true,
      `${lado}: a matriz concede unfiltered_upload ao administrador`,
    );
    assert.equal(
      instalacao.pode(admin, 'unfiltered_upload'),
      false,
      `${lado}: negada de fabrica, mesmo a quem a tem`,
    );
    assert.equal(
      instalacao.pode(admin, 'unfiltered_upload', {
        constantes: { ALLOW_UNFILTERED_UPLOADS: true },
      }),
      true,
      `${lado}: com a constante, a concessao gravada passa a valer`,
    );
  }
});

// ---------------------------------------------------------------------------
// UT-014-4 — CA-7.4 *"E possivel responder, por consulta ao armazenamento, quem
// tem uma capacidade dada"*
//
// entrada:  a matriz de fabrica gravada, nos dois lados, e quatro contas: uma
//           `administrator`, uma `editor`, uma com `manage_options` individual e
//           **sem papel nenhum**, e uma com `manage_options` gravada como NEGADA
// acao:     perguntar quem tem `manage_options`
// esperado: a resposta sai do armazenamento — pelo `LIKE` sobre o valor
//           serializado da chave `{site}capabilities` — e e confirmada pela
//           decisao: entram a administradora e a conta sem papel, ficam fora a
//           editora e a conta com a concessao negada
// ---------------------------------------------------------------------------

test('UT-014-4 quem tem a capacidade sai de consulta ao armazenamento, e a decisao confirma (CA-7.4)', () => {
  for (const lado of LADOS) {
    const instalacao = instalacaoDeFabrica(lado);

    const admin = instalacao.conta('ada');
    instalacao.atribuir(admin, concedida('administrator'));
    const editora = instalacao.conta('bia');
    instalacao.atribuir(editora, concedida('editor'));
    // *"um usuario pode ter varios papeis, ou capacidade sem papel nenhum"*.
    const semPapel = instalacao.conta('cleo');
    instalacao.atribuir(semPapel, concedida('manage_options'));
    const comNegacao = instalacao.conta('dora');
    instalacao.atribuir(comNegacao, negada('manage_options'));

    const antesDaBusca = instalacao.banco.consultas.length;
    const quem = quemTemCapacidade('manage_options', instalacao.base(), instalacao.fonte);

    assert.deepEqual(
      [...quem],
      [admin, semPapel],
      `${lado}: quem tem manage_options`,
    );

    // A resposta passou pelo armazenamento: a consulta que a produziu e o `LIKE`
    // com curinga dos dois lados sobre a chave com o prefixo do site.
    const buscas = instalacao.banco.consultas
      .slice(antesDaBusca)
      .filter((consulta) => consulta.texto.includes('LIKE'));
    assert.ok(buscas.length > 0, `${lado}: alguma busca deveria ter saido`);
    for (const busca of buscas) {
      assert.equal(
        busca.texto,
        `SELECT user_id FROM ${instalacao.tabelaDeMetadados} ` +
          'WHERE meta_key = ? AND meta_value LIKE ?',
        `${lado}: a forma da consulta`,
      );
      assert.equal(busca.parametros[0], instalacao.chaveDeCapacidades);
      assert.equal(
        String(busca.parametros[1]).startsWith('%') &&
          String(busca.parametros[1]).endsWith('%'),
        true,
        `${lado}: curinga dos dois lados`,
      );
    }

    // Os dois passos sao distintos, e e o segundo que impede a resposta de
    // mentir: o armazenamento alcanca o NOME, nao o valor.
    const candidatos = candidatosComCapacidade(
      'manage_options',
      instalacao.base(),
      instalacao.fonte,
    );
    assert.deepEqual(
      [...candidatos],
      [admin, semPapel, comNegacao],
      `${lado}: o armazenamento alcanca tambem quem tem a concessao NEGADA`,
    );
    assert.equal(
      candidatos.includes(comNegacao) && !quem.includes(comNegacao),
      true,
      `${lado}: a decisao e que tira o candidato cuja concessao e falsa`,
    );

    // E a resposta acompanha o dado: conceder a capacidade ao papel da editora
    // em execucao a faz aparecer, sem que nada no codigo mude.
    instalacao.editar((construtor) => {
      construtor.adicionarCapacidade('editor', 'manage_options');
    });
    assert.deepEqual(
      [...quemTemCapacidade('manage_options', instalacao.base(), instalacao.fonte)],
      [admin, editora, semPapel],
      `${lado}: a resposta vem do dado, nao de uma lista`,
    );
  }
});

// ---------------------------------------------------------------------------
// UT-014-5 — CA-7.5 *"Toda capacidade exigida em alguma verificacao do sistema
// consta da matriz declarada"*
//
// entrada:  a matriz de fabrica gravada, nos dois lados, e as capacidades que os
//           casos de uso de US-7 exigem: as seis de UC-24 e as quatro de UC-07
// acao:     conferir a lista exigida contra a matriz declarada
// esperado: nenhuma das dez fica sem declaracao; e a conferencia ACUSA, com
//           nome, o que o pacote registra como ainda nao declarado — as quatro
//           de `PERM-7` (US-9 / T019) e as nove de rede de `PERM-10`
// ---------------------------------------------------------------------------

/**
 * As capacidades que UC-24 nomeia no campo **Autorizacao**: *"`list_users` para
 * ver, `create_users` para criar, `edit_users` para alterar, `promote_users`
 * para mudar papel, `delete_users` para apagar e `remove_users` para desvincular
 * do site"*.
 */
const EXIGIDAS_POR_UC_24: readonly string[] = [
  'list_users',
  'create_users',
  'edit_users',
  'promote_users',
  'delete_users',
  'remove_users',
];

/**
 * As de UC-07: *"`edit_others_posts`, somada a `edit_published_posts` quando o
 * conteudo ja esta publicado e a `edit_private_posts` quando esta privado"*,
 * mais `publish_posts`, que a pre-condicao do caso exige.
 */
const EXIGIDAS_POR_UC_07: readonly string[] = [
  'edit_others_posts',
  'edit_published_posts',
  'edit_private_posts',
  'publish_posts',
];

/**
 * As quatro de `PERM-7` (BR-MIGRAR-093): *"quatro capacidades que o codigo exige
 * nao estao em papel algum"*. Fechar a declaracao delas e **US-9 / T019**
 * (CA-9.1), nao esta tarefa.
 */
const QUATRO_SO_POR_EXTENSAO: readonly string[] = [
  'install_languages',
  'resume_plugins',
  'resume_themes',
  'view_site_health_checks',
];

/**
 * As nove de `PERM-10` (BR-MIGRAR-096): *"nove capacidades sao so de rede e nao
 * sao concedidas a papel algum"*. UC-43 repete a frase.
 */
const NOVE_SO_DE_REDE: readonly string[] = [
  'create_sites',
  'delete_sites',
  'manage_network',
  'manage_sites',
  'manage_network_users',
  'manage_network_plugins',
  'manage_network_themes',
  'manage_network_options',
  'upgrade_network',
];

test('UT-014-5 toda capacidade que os casos de uso de US-7 exigem consta da matriz declarada (CA-7.5)', () => {
  for (const lado of LADOS) {
    const instalacao = instalacaoDeFabrica(lado);
    const matriz = instalacao.base().matriz;
    const declaradas = capacidadesDeclaradas(matriz);

    const exigidas = [...EXIGIDAS_POR_UC_24, ...EXIGIDAS_POR_UC_07];
    assert.deepEqual(
      [...capacidadesExigidasSemDeclaracao(exigidas, declaradas)],
      [],
      `${lado}: as dez capacidades de UC-24 e UC-07 constam da matriz declarada`,
    );

    // Declarada nao e o mesmo que concedida, e a diferenca e observavel:
    // `unfiltered_upload` esta na matriz e e negada de fabrica (UT-014-3).
    assert.equal(
      declaradas.has('unfiltered_upload'),
      true,
      `${lado}: unfiltered_upload e declarada`,
    );

    // E capacidade declarada por REGRA, sem estar em papel algum, tambem conta:
    // `upload_plugins` e `upload_themes` sao alcancadas pelas constantes.
    for (const capacidade of ['upload_plugins', 'upload_themes']) {
      assert.equal(
        papeisQueConcedem(matriz, capacidade).length,
        0,
        `${lado}: ${capacidade} nao esta em papel algum`,
      );
      assert.equal(
        capacidadesDeclaradasPorRegra().includes(capacidade),
        true,
        `${lado}: ${capacidade} e declarada por regra`,
      );
      assert.equal(
        declaradas.has(capacidade),
        true,
        `${lado}: ${capacidade} entra na conferencia`,
      );
    }

    // A conferencia ACUSA o que ainda nao tem declaracao, e o pacote diz de quem
    // e cada caso. As quatro de `PERM-7` sao US-9 / T019 (CA-9.1): elas entram na
    // conferencia pelo terceiro argumento, que e o encaixe daquela tarefa.
    assert.deepEqual(
      [...capacidadesExigidasSemDeclaracao(QUATRO_SO_POR_EXTENSAO, declaradas)],
      [...QUATRO_SO_POR_EXTENSAO],
      `${lado}: as quatro de PERM-7 nao estao na matriz, e fechar isso e T019`,
    );
    assert.deepEqual(
      [
        ...capacidadesExigidasSemDeclaracao(
          QUATRO_SO_POR_EXTENSAO,
          capacidadesDeclaradas(matriz, QUATRO_SO_POR_EXTENSAO),
        ),
      ],
      [],
      `${lado}: declaradas por regra, elas fecham`,
    );

    // As nove de rede nao estao em papel algum, e isso e a regra, nao falta: o
    // recorte de rede de `PERM-10` nao e de nenhuma tarefa desta feature.
    for (const capacidade of NOVE_SO_DE_REDE) {
      assert.equal(
        papeisQueConcedem(matriz, capacidade).length,
        0,
        `${lado}: ${capacidade} nao e concedida a papel algum`,
      );
    }
    assert.deepEqual(
      [...capacidadesExigidasSemDeclaracao(NOVE_SO_DE_REDE, declaradas)],
      [...NOVE_SO_DE_REDE],
      `${lado}: a conferencia acusa as nove de rede, com nome`,
    );

    /*
      ⚠️ O QUE ESTE CASO NAO FECHA, e de quem e a palavra.

      CA-9.4 exige que *"nenhuma das 93 capacidades verificadas no codigo fique
      fora da matriz declarada"*, e a primeira *Pergunta em aberto* de `spec.md`
      registra que o pacote **nao enumera as 93** e que este e *"o unico critério
      deste pacote sem nenhum teste registrado em `backlog/tests.md`"*. Logo este
      caso confere o que o pacote nomeia — as dez de UC-24 e UC-07, as quatro de
      `PERM-7` e as nove de `PERM-10` — e nao afirma contagem nenhuma. Inventar a
      lista de 93 seria inventar dado de analise.
    */
  }
});

// ---------------------------------------------------------------------------
// UT-014-6 — regra de negocio: ADR-0001 / `PERM-13` (BR-MIGRAR-099), *"a
// definicao de papel e um retrato tirado na instalacao; depois disso a opcao
// `{prefixo}user_roles` e a verdade e o codigo deixa de ser"*
//
// entrada:  uma definicao GRAVADA que divergе do codigo — `administrator` sem
//           `manage_options` e um papel que `povoarPapeis` nunca produz
// acao:     compor o armazenamento, perguntar permissao, e observar o que e
//           escrito
// esperado: a decisao segue o dado gravado e nunca o codigo; nada repovoa por
//           conta propria; semear e chamada explicita, e escreve so a opcao do
//           site
// ---------------------------------------------------------------------------

test('UT-014-6 a definicao de papel e retrato da instalacao: o dado gravado vence o codigo (ADR-0001, PERM-13)', () => {
  const instalacao = criarInstalacao();

  // Compor o armazenamento nao toca na porta, e perguntar nao escreve nada: nada
  // repovoa "para garantir" (`EXT-ORDEM`, e os tres momentos de `PERM-13`).
  assert.deepEqual(instalacao.banco.consultas, [], 'compor nao consulta');
  assert.deepEqual(instalacao.banco.escritas, [], 'compor nao escreve');

  // Uma definicao que o codigo nunca produziria: o administrador perdeu
  // `manage_options` e existe um papel de extensao. E o site de 2010 do ADR-0001.
  const comoUmPluginDeixou: DefinicaoDePapeis = [
    {
      identificador: 'administrator',
      papel: {
        nome: 'Administrator',
        capacidades: [concedida('read'), concedida('edit_posts')],
      },
    },
    {
      identificador: 'papel-de-plugin',
      papel: {
        nome: 'Papel De Plugin',
        capacidades: [concedida('manage_options')],
      },
    },
  ];
  instalacao.gravarDefinicao(comoUmPluginDeixou);

  const admin = instalacao.conta('ada');
  instalacao.atribuir(admin, concedida('administrator'));
  const deExtensao = instalacao.conta('bia');
  instalacao.atribuir(deExtensao, concedida('papel-de-plugin'));

  const escritasAntes = instalacao.banco.escritas.length;

  // O administrador e negado no que o CODIGO lhe daria, e o papel de extensao
  // concede o que o codigo nao conhece. A opcao e a verdade.
  assert.equal(
    povoarPapeis('legado-integral').some(
      (entrada) =>
        entrada.identificador === 'administrator' &&
        entrada.papel.capacidades.some(
          (concessao) => concessao.capacidade === 'manage_options',
        ),
    ),
    true,
    'o codigo concede manage_options ao administrador',
  );
  assert.equal(
    instalacao.pode(admin, 'manage_options'),
    false,
    'e ainda assim o administrador gravado nao a tem',
  );
  assert.equal(
    instalacao.pode(deExtensao, 'manage_options'),
    true,
    'o papel que so existe no dado concede',
  );

  // E perguntar nao escreveu nada: nenhuma reconciliacao silenciosa.
  assert.equal(
    instalacao.banco.escritas.length,
    escritasAntes,
    'perguntar permissao nao escreve',
  );

  // Semear e chamada explicita, e escreve **a opcao do site**, e so ela. Os tres
  // momentos — instalar, atualizar e criar site de rede — sao os unicos, e
  // nenhum deles e uma requisicao.
  const rede = criarBanco();
  const siteNovo = criarInstalacao({
    banco: rede,
    prefixoDeTabela: 'wp_2_',
    prefixoBaseDeTabela: 'wp_',
  });
  siteNovo.semear('legado-integral');
  assert.deepEqual(
    rede.escritas.map((consulta) => consulta.parametros[0]),
    ['wp_2_user_roles'],
    'criar o site da rede semeia a opcao DAQUELE site, e nada mais',
  );
  assert.equal(
    rede.opcao('wp_options', 'wp_user_roles'),
    null,
    'a opcao do site principal nao foi tocada',
  );

  /*
    ⚠️ ONDE A OUTRA LEITURA MUDARIA ESTE CASO, e por que ele nao escolhe.

    A linha abaixo fixa o que `semearMatrizDeFabrica` faz hoje: repovoar SUBSTITUI
    a definicao gravada pela de fabrica. ADR-0001 descreve o mecanismo do legado
    como `use_db = false` sobre o `$wp_roles` **corrente** — carregado da opcao —
    e `../armazenamento/papel.ts` diz, do construtor, que *"`adicionarPapel` nao
    faz nada se o papel ja existe — e por isso que repovoar nao apaga customizacao
    de papel existente"*. As duas frases descrevem PRESERVACAO, e nenhuma delas
    e afirmacao normativa sobre a entrada de `populate_roles()`: o fonte do legado
    nao esta nesta arvore.

    Se o oraculo de `ESC-ORACULO` (BR-MIGRAR-116) confirmar a preservacao, esta
    assercao passa a esperar que `papel-de-plugin` SOBREVIVA ao repovoamento e que
    `read` e `edit_posts` continuem no administrador ao lado das de fabrica; nada
    mais deste arquivo muda. Escolher aqui seria decidir no lugar de quem decide
    (**P1**).
  */
  instalacao.semear('legado-integral');
  assert.equal(
    instalacao
      .definicao()
      .some((entrada) => entrada.identificador === 'papel-de-plugin'),
    false,
    'comportamento FIXADO, nao decidido: hoje repovoar substitui a definicao gravada',
  );
});

// ---------------------------------------------------------------------------
// UT-014-7 — regra de negocio: ADR-0009 / `PERM-9` (BR-MIGRAR-095), *"em
// multisite o super admin recebe tudo, menos o negado explicitamente — e a
// verificacao acontece antes do filtro `user_has_cap`"*
//
// entrada:  a matriz de fabrica gravada, nos dois lados; uma instalacao de rede
//           cuja lista de super administradores tem o login de uma conta **sem
//           papel e sem capacidade nenhuma**
// acao:     perguntar capacidades a ela, com e sem constante, com e sem ponto de
//           extensao; e repetir fora da rede
// esperado: recebe tudo menos o negado; extensao nenhuma lhe retira poder; nao
//           consegue ter `do_not_allow`; e **fora** da rede a definicao e outra —
//           quem tem `delete_users` —, caminho em que a extensao JA retira poder
// ---------------------------------------------------------------------------

test('UT-014-7 o super administrador recebe tudo menos o negado, e a negacao vem antes da extensao (ADR-0009, PERM-9)', () => {
  for (const lado of LADOS) {
    const instalacao = instalacaoDeFabrica(lado);

    // Sem papel e sem capacidade: nenhuma linha de `{site}capabilities`. O poder
    // dele nao vem da matriz, vem de o login estar na lista da rede.
    const raiz = instalacao.conta('raiz');
    const redeAtiva: EstadoDaRedeNaAutorizacao = {
      ativa: true,
      loginsDeSuperAdmin: ['raiz'],
    };
    assert.equal(
      instalacao.banco.metadado(
        instalacao.tabelaDeMetadados,
        raiz,
        instalacao.chaveDeCapacidades,
      ),
      null,
      `${lado}: o super administrador nao tem autorizacao gravada`,
    );
    assert.equal(
      ehSuperAdmin(
        comAtor(
          instalacao.base({ rede: redeAtiva }),
          atorDeAutorizacao(raiz, instalacao.fonte),
        ),
      ),
      true,
      `${lado}: super administrador e nome de login numa lista de rede`,
    );

    // Recebe tudo — inclusive capacidade que nenhum papel declara.
    for (const capacidade of ['manage_options', 'capacidade-que-ninguem-declarou']) {
      assert.equal(
        instalacao.pode(raiz, capacidade, { rede: redeAtiva }),
        true,
        `${lado}: ${capacidade} para o super administrador`,
      );
    }

    // Menos o negado explicitamente, e a negacao chega por `map_meta_cap`.
    const semEditarArquivo: ConstantesDoServidor = { DISALLOW_FILE_EDIT: true };
    assert.deepEqual(
      [
        ...capacidadesExigidas(
          comAtor(
            instalacao.base({ rede: redeAtiva, constantes: semEditarArquivo }),
            atorDeAutorizacao(raiz, instalacao.fonte),
          ),
          'edit_plugins',
        ),
      ],
      ['do_not_allow'],
      `${lado}: a traducao devolve a negacao`,
    );
    assert.equal(
      instalacao.pode(raiz, 'edit_plugins', {
        rede: redeAtiva,
        constantes: semEditarArquivo,
      }),
      false,
      `${lado}: e ela vence o super administrador`,
    );

    // A ORDEM e a regra: o atalho roda ANTES do ponto de extensao, logo uma
    // extensao que esvazie o mapa nao lhe retira poder nenhum.
    const esvaziando: GanchosDeAutorizacao = {
      aoMontarCapacidadesDoAtor() {
        return new Map<string, boolean>();
      },
    };
    assert.equal(
      instalacao.pode(raiz, 'manage_options', { rede: redeAtiva, ganchos: esvaziando }),
      true,
      `${lado}: extensao nenhuma retira poder do super administrador`,
    );
    // E, na outra ponta, uma extensao que conceda tudo nao reabre o negado.
    assert.equal(
      instalacao.pode(raiz, 'edit_plugins', {
        rede: redeAtiva,
        constantes: semEditarArquivo,
        ganchos: {
          aoMontarCapacidadesDoAtor(capacidades) {
            const copia = new Map(capacidades);
            copia.set('edit_plugins', true);
            copia.set('do_not_allow', true);
            return copia;
          },
        },
      }),
      false,
      `${lado}: so do_not_allow dentro da traducao o detem`,
    );

    // FORA da rede a mesma funcao usa OUTRA definicao: quem tem `delete_users`.
    // A mesma conta, sem rede, nao e super administrador — e e o tipo de detalhe
    // que *"um porte unifica por engano"*.
    assert.equal(
      ehSuperAdmin(
        comAtor(instalacao.base(), atorDeAutorizacao(raiz, instalacao.fonte)),
      ),
      false,
      `${lado}: sem rede, sem capacidade, nao e super administrador`,
    );
    assert.equal(
      instalacao.pode(raiz, 'manage_options'),
      false,
      `${lado}: e nao recebe nada`,
    );

    const admin = instalacao.conta('ada');
    instalacao.atribuir(admin, concedida('administrator'));
    assert.equal(
      ehSuperAdmin(
        comAtor(instalacao.base(), atorDeAutorizacao(admin, instalacao.fonte)),
      ),
      true,
      `${lado}: fora da rede, super administrador e quem tem delete_users`,
    );

    // E a consequencia que ADR-0009 registra: num site unico o administrador
    // PASSA pelo ponto de extensao, logo uma extensao pode lhe retirar poder.
    assert.equal(
      instalacao.pode(admin, 'manage_options'),
      true,
      `${lado}: de fabrica o administrador pode`,
    );
    assert.equal(
      instalacao.pode(admin, 'manage_options', { ganchos: esvaziando }),
      false,
      `${lado}: e fora da rede a extensao lhe retira o poder`,
    );
    // Em rede, a MESMA extensao nao consegue o mesmo.
    assert.equal(
      instalacao.pode(admin, 'manage_options', {
        rede: { ativa: true, loginsDeSuperAdmin: ['ada'] },
        ganchos: esvaziando,
      }),
      true,
      `${lado}: em rede o atalho vem antes, e a extensao nao alcanca`,
    );
  }
});

// ---------------------------------------------------------------------------
// UT-014-8 — regra de negocio: "pegadinha 5" / `PERM-2` (BR-MIGRAR-088),
// *"a autorizacao mora num metadado serializado, por site … nenhuma consulta SQL
// responde 'quem e administrador aqui'"*
//
// entrada:  uma rede com dois sites sobre o MESMO `users` e o MESMO `usermeta` —
//           prefixo base `wp_`, sites `wp_` e `wp_2_` — e uma conta que e
//           administradora **so no site 2**
// acao:     perguntar permissao nos dois sites e perguntar quem e administrador
// esperado: a mesma identidade responde diferente por site, porque o site mora
//           DENTRO do nome da chave; e a unica busca possivel e `LIKE` com
//           curinga dos dois lados sobre texto serializado — nome de papel nunca
//           aparece no SQL, so no parametro e dentro do valor
// ---------------------------------------------------------------------------

test('UT-014-8 a autorizacao mora em metadado serializado por site, e nenhuma consulta SQL a alcanca (PERM-2, pegadinha 5)', () => {
  for (const lado of LADOS) {
    const rede = criarBanco();
    const site1 = criarInstalacao({
      banco: rede,
      prefixoDeTabela: 'wp_',
      prefixoBaseDeTabela: 'wp_',
    });
    const site2 = criarInstalacao({
      banco: rede,
      prefixoDeTabela: 'wp_2_',
      prefixoBaseDeTabela: 'wp_',
    });
    site1.semear(lado);
    site2.semear(lado);

    // Os dois prefixos, e a diferenca e regra: a identidade e global, a
    // autorizacao e por site.
    assert.equal(site1.tabelaDeContas, site2.tabelaDeContas, 'users e global');
    assert.equal(
      site1.tabelaDeMetadados,
      site2.tabelaDeMetadados,
      'usermeta e global',
    );
    assert.notEqual(
      site1.tabelaDeOpcoes,
      site2.tabelaDeOpcoes,
      'options e por site',
    );
    assert.equal(site1.chaveDeCapacidades, 'wp_capabilities');
    assert.equal(site2.chaveDeCapacidades, 'wp_2_capabilities');

    // Uma identidade so, administradora so no site 2.
    const ada = site2.conta('ada');
    site2.atribuir(ada, concedida('administrator'));

    assert.equal(
      site2.pode(ada, 'manage_options'),
      true,
      `${lado}: administradora no site 2`,
    );
    assert.equal(
      site1.pode(ada, 'manage_options'),
      false,
      `${lado}: e ninguem no site 1 — a chave e outra`,
    );

    // O nome do papel viaja DENTRO do texto serializado, e e por isso que
    // nenhum indice o alcanca.
    const gravado = rede.metadado('wp_usermeta', ada, 'wp_2_capabilities');
    assert.equal(
      gravado,
      'a:1:{s:13:"administrator";b:1;}',
      `${lado}: o papel esta dentro do valor serializado`,
    );

    // A unica pergunta que o armazenamento responde: `LIKE` com curinga dos dois
    // lados. Nenhuma coluna de papel, nenhum `JOIN`, nenhuma igualdade.
    const antes = rede.consultas.length;
    assert.deepEqual(
      [...quemTemCapacidade('manage_options', site2.base(), site2.fonte)],
      [ada],
      `${lado}: quem e administrador no site 2`,
    );
    const emitidas = rede.consultas.slice(antes);
    const buscas = emitidas.filter((consulta) => consulta.texto.includes('LIKE'));
    assert.ok(buscas.length > 0, `${lado}: a busca por texto deveria ter saido`);
    for (const busca of buscas) {
      assert.equal(busca.parametros[0], 'wp_2_capabilities');
    }
    // Sao DUAS buscas, e as duas procuram **nome**: primeiro o papel que concede
    // a capacidade, depois a propria capacidade — porque uma conta pode te-la
    // sem papel nenhum, e os dois moram no mesmo mapa serializado (`PERM-1`).
    // O `_` de `manage_options` aparece escapado, como o legado o escapa.
    assert.deepEqual(
      buscas.map((busca) => busca.parametros[1]),
      ['%"administrator"%', '%"manage\\_options"%'],
      `${lado}: as duas buscas por nome, com o curinga escapado`,
    );
    for (const consulta of emitidas) {
      assert.equal(
        consulta.texto.includes('JOIN'),
        false,
        `${lado}: nenhuma consulta de autorizacao faz JOIN`,
      );
      for (const nome of NOMES_DE_PAPEL_DE_FABRICA) {
        assert.equal(
          consulta.texto.includes(nome),
          false,
          `${lado}: o nome "${nome}" nunca aparece no SQL, so no parametro`,
        );
      }
    }

    // E as unicas leituras que a decisao faz: a opcao da definicao e a chave da
    // conta. Duas, e nenhuma delas indexavel pelo que se procura.
    const lidasNaDecisao = emitidas
      .filter((consulta) => consulta.texto.startsWith('SELECT'))
      .map((consulta) => consulta.texto);
    assert.equal(
      lidasNaDecisao.some((texto) =>
        texto.startsWith('SELECT option_value FROM wp_2_options'),
      ),
      true,
      `${lado}: a definicao sai da opcao do site`,
    );
    assert.equal(
      lidasNaDecisao.some((texto) =>
        texto.includes('FROM wp_usermeta WHERE user_id = ? AND meta_key = ?'),
      ),
      true,
      `${lado}: a autorizacao da conta sai da chave com o site dentro do nome`,
    );

    // Os tres caracteres que o legado escapa antes de montar o padrao: sem isso,
    // um papel cujo nome tem curinga mudaria o conjunto encontrado.
    site2.editar((construtor) => {
      construtor.adicionarPapel('papel%com_curinga', 'Papel Com Curinga');
    });
    const antesDoEscape = rede.consultas.length;
    site2.armazenamento.papeis.idsDeContasComPapel('papel%com_curinga');
    const comEscape = rede.consultas[antesDoEscape];
    assert.equal(
      comEscape?.parametros[1],
      `%${escaparParaLike('"papel%com_curinga"')}%`,
      `${lado}: curinga e barra sao escapados no trecho buscado`,
    );
  }
});
