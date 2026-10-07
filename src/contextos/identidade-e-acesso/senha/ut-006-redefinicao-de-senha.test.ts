/**
 * **T010 — os testes de US-4.** Seis testes, um por caso que `tasks.md` registra
 * para esta tarefa: `UT-006-1`, `UT-006-2`, `UT-006-3`, `UT-006-4`, `UT-006-5` e
 * `UT-006-6`, nessa ordem, com *"o mesmo dado de entrada, acao e resultado
 * esperado"* — e o caso de regra de negocio (`UT-006-6`) na mesma suite, como a
 * entrega manda.
 *
 * | caso | o que afirma | fonte |
 * |---|---|---|
 * | `UT-006-1` | CA-4.1 — a chave e guardada com *hash* na conta, e o valor em claro so existe no e-mail enviado | `spec.md`, US-4 · UC-20 passos 2 e 3 |
 * | `UT-006-2` | CA-4.2 — chave com mais de 24 horas e recusada com aviso de prazo vencido | `spec.md`, US-4 · `PT-006` |
 * | `UT-006-3` | CA-4.3 — um pedido novo antes do prazo substitui a chave anterior, que deixa de valer | `spec.md`, US-4 · UC-20, *Pedido repetido antes do prazo* |
 * | `UT-006-4` | CA-4.4 — gravar a senha nova invalida a chave usada | `spec.md`, US-4 · UC-20 passo 6 e pos-condicoes |
 * | `UT-006-5` | CA-4.5 — chave invalida e recusada com erro generico | `spec.md`, US-4 · `SCR-003`, transicao `error=invalidkey` |
 * | `UT-006-6` | a regra `U4` / BR-MIGRAR-024 — 24 horas, com as duas pontas, e a chave apagada no primeiro acesso bem-sucedido | `target_business_rules.md` · `PT-006` |
 *
 * ---
 *
 * ## ⚠️ Tres coisas desta tarefa que ninguem resolveu, e que esta suite nao resolve
 *
 * **1. `backlog/tests.md` nao existe nesta arvore.** `tasks.md` manda escrever os
 * seis testes *"com o mesmo dado de entrada, acao e resultado esperado"* do caso
 * registrado em `../../../backlog/tests.md`, e esse arquivo **nao veio no
 * pacote**: nem ele, nem a pasta `backlog/` — `UT-006-1` aparece em `tasks.md` e
 * em mais lugar nenhum. `parity_specs.md` descreve o catalogo de fora (*"os **985
 * testes** de `../backlog/tests.md` sao **especificacao, nao evidencia**"*) e e a
 * unica mencao a ele no pacote. Logo o enunciado de cada `UT-006-*` **nao esta
 * disponivel**, e os seis casos abaixo foram **reconstruidos**, nao copiados.
 *
 * A reconstrucao e a mesma aritmetica que T008 registrou em
 * `../sessao/ut-003-expiracao-de-sessao.test.ts`, e ela fecha aqui sem sobra:
 * US-4 tem **5** critérios de aceite (CA-4.1 a CA-4.5), **6** casos, e **1**
 * deles e *"o teste de regra de negocio (UT-006-6)"*. Sobram 5 casos para 5
 * critérios, na ordem — e o sexto e a regra `U4`, que e a unica regra de negocio
 * que `spec.md` lista para esta historia. Se o catalogo aparecer e um `UT-006-*`
 * tiver dado de entrada diferente do que esta aqui, **o de la vale** e este
 * arquivo muda. Cada assercao sai de `spec.md`, de `UC-20`, de `plan.md`, de
 * `target_business_rules.md`, de `target_screens.md` ou de
 * `parity_tests/06-autenticacao-e-sessao.feature`, e a origem esta dita no caso;
 * o que nao tem origem declarada nao e cobrado.
 *
 * **2. T009 nao estava na arvore quando esta suite foi escrita.** `tasks.md` poe
 * *"T010 depende de T009"*, e no commit em que esta tarefa comecou a linha de
 * T009 seguia `[ ]`, nenhum arquivo de US-4 existia e a worktree de T009 estava
 * no mesmo commit que esta — as duas tarefas foram disparadas na mesma onda,
 * apesar da dependencia declarada. Entao a superficie de US-4 e resolvida **em
 * execucao** (ver {@link resolverSuperficieDeUS4}), com o contrato **declarado
 * aqui em vez de importado**, que e a mesma costura que T006 usou quando T005
 * nao estava na arvore (ver `../sessao/us-2.test.ts`). Duas consequencias, e
 * nenhuma e escolha desta tarefa:
 *
 * - **enquanto T009 nao entrar, os seis casos falham**, e falham *altos*, dizendo
 *   o nome do que falta. Isto e o estado correto de uma suite cuja implementacao
 *   nao chegou — nao e divergencia de comportamento, e nao e defeito desta
 *   suite. Com `import` estatico a arvore inteira deixaria de compilar e levaria
 *   embora tambem as suites de T002, T003, T005 e T007, que nada tem a ver com
 *   esta tarefa;
 * - a costura com T009 esta **num bloco so**, de proposito: se a forma que T009
 *   entregou for outra, muda-se aquele bloco e os seis casos ficam de pe.
 *
 * **3. O instante exato da borda das 24 horas nao esta fixado no pacote, e esta
 * suite nao o escolhe.** `PT-006` cobra as duas pontas sem nomear o meio — *"o
 * tempo avanca ate um instante antes do prazo → a chave e aceita"* e *"o tempo
 * avanca alem do prazo → a chave e recusada"* —, e nenhum documento diz o que
 * acontece no instante **exatamente** igual a emissao mais 24 horas. Os casos
 * afirmam `emissao + 24 h − 1` aceita e `emissao + 24 h + 1` recusa, que e o que
 * o pacote fixa, e **nao** afirmam o instante do meio. Fecha contra o oraculo de
 * `ESC-ORACULO` (BR-MIGRAR-116), que nesta arvore nao existe, e **nao** e decisao
 * de quem escreve teste.
 *
 * ---
 *
 * ## O que esta suite nao afirma, de proposito
 *
 * - **A tela, as mensagens literais e as transicoes.** `SCR-002` e `SCR-003` tem
 *   os 15 e os 8 literais em ingles e as transicoes
 *   `?action=lostpassword&error=expiredkey` e `&error=invalidkey`, e eles sao
 *   contrato de **borda HTTP**, que nao e desta feature. O que os casos cobram do
 *   dominio e o que a tela precisa para escolher a transicao: que a recusa por
 *   prazo seja **distinguivel** da recusa generica. A *"oferta de pedir outra"* de
 *   CA-4.2 e o `lostpassword` da mesma transicao — tela, nao dominio.
 * - **O comprimento e o alfabeto da chave.** Nenhum documento do pacote os
 *   registra, e o P6 recusa numero que o legado nao tem. A chave desta suite vem
 *   de um gerador injetado, com valor conhecido, e nenhum caso afirma tamanho.
 * - **O formato do *hash* da chave.** O pacote diz duas coisas, e sao as duas que
 *   os casos cobram: a chave e *"guardada com hash"* (UC-20) e a coluna guarda *"o
 *   instante prefixado"* (`plan.md`, Modelo de dados; `../armazenamento/conta.ts`).
 *   Qual funcao de resumo, com que separador, fecha contra o oraculo.
 * - **A falha de envio de e-mail.** E US-5 (CA-5.1 a CA-5.3), tarefas T011 e T012.
 *   A caixa de saida desta suite sempre aceita: um caso de falha aqui invadiria a
 *   historia seguinte.
 * - **O limite de tentativa de chave.** O legado nao tem nenhum
 *   (BR-MIGRAR-112: *"nenhuma superficie de entrada tem limite de taxa"*), e
 *   inventa-lo cai em [Nao negociavel] da constituicao.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import type {
  MensagemDeEmail,
  PortaDeEmail,
  PortaDeRelogio,
} from '../portas/index.js';
import type {
  CamposDeConta,
  Conta as ContaArmazenada,
  ContaNova,
  RepositorioDeContas,
} from '../armazenamento/conta.js';
import { DATA_SENTINELA } from '../armazenamento/conta.js';
import type {
  Conta as ContaDaLeitura,
  LeituraDeConta,
} from '../conta/leitura-de-conta.js';
import type { RemocaoDeAcentos } from '../autenticacao/normalizacao-de-credencial.js';
import type { EstadoDaRede } from '../autenticacao/contexto-de-autenticacao.js';
import { REDE_INATIVA } from '../autenticacao/contexto-de-autenticacao.js';
import {
  autenticar,
  type ContextoDeAutenticacao,
} from '../index.js';
import {
  SEGUNDOS_POR_HORA,
  type PrazosDoTokenDeSessao,
} from '../autenticacao/prazos-de-sessao.js';
import {
  criarVerificadorDeSenhaDoNucleo,
  preProcessarSenhaParaBcrypt,
  type PrimitivaDeBcrypt,
  type VerificadorDeSenha,
} from '../autenticacao/verificacao-de-senha.js';
import {
  abrirSessao,
  type ArmazenamentoDeSessoes,
  type MapaDeSessoes,
} from '../sessao/registro-de-sessoes.js';

/*
  ── O CONTRATO DE US-4, COMO ESTA SUITE O COBRA ─────────────────────────────

  Declarado aqui, e nao importado, pelo motivo do item 2 do cabecalho. Cada peca
  abaixo vem de um documento do pacote, e a origem esta dita no comentario.

  A tabela *Contratos* de `plan.md` declara **duas** operacoes para esta
  historia, e sao estas duas que os casos exercitam:

  | operacao | entrada | saida | erros |
  |---|---|---|---|
  | pedir redefinicao de senha | identificador | confirmacao de envio, sempre com a mesma forma | falha de envio de e-mail, que e estado reportavel e nao excecao |
  | redefinir senha | chave e senha nova | identidade com senha trocada e chave apagada | chave vencida (24 h), chave ja usada, senha recusada |

  `target_domain_model.md` nomeia os comandos de `AGG-Conta` que as sustentam —
  `solicitarResetDeSenha`, `consumirChaveDeReset` e `trocarSenha` —, e
  BR-MIGRAR-024 aponta `U4` para `VO-ChaveDeAtivacao` (24 h) mais
  `AGG-Conta`.`consumirChaveDeReset`.
*/

/**
 * O que *pedir redefinicao de senha* recebe.
 *
 * Um campo, porque a entrada declarada em `plan.md` e um: o **identificador**.
 * `SCR-002` o chama `user_login` e `UC-20` passo 1 e literal sobre ele aceitar os
 * dois caminhos — *"informa o login **ou** o e-mail da conta"*.
 */
interface PedidoDeRedefinicao {
  readonly identificador: string;
}

/**
 * O que *redefinir senha* recebe.
 *
 * `plan.md` declara *"chave e senha nova"*; o `login` entra porque a chave nao
 * viaja sozinha em lugar nenhum do fluxo — `SCR-003` tem os dois pontos de
 * interpolacao, `{{rp_key}}` e `{{rp_login}}`, e os campos `rp_key` e `pass1`. Os
 * nomes de campo daquela tela sao contrato **externo** (familia C, modo literal),
 * e a correspondencia fica registrada para que ninguem a invente:
 *
 * | campo de `SCR-003` | aqui |
 * |---|---|
 * | `rp_key` | `chave` |
 * | `rp_login` | `login` |
 * | `pass1` | `senhaNova` |
 */
interface DadosDaRedefinicao {
  readonly chave: string;
  readonly login: string;
  readonly senhaNova: string;
}

/**
 * O contexto das duas operacoes: o que elas tocam, e nada mais.
 *
 * A forma espelha `ContextoDeAutenticacao` (T003), que e o contexto que esta
 * arvore ja tem para a mesma historia de identidade — relogio, contas, sessoes,
 * verificador de senha, remocao de acentos, estado de rede e as URLs da tela —
 * mais as tres coisas que **so** US-4 precisa: a porta de e-mail, o gerador da
 * chave e o lado de **escrita** do *hash* de senha.
 *
 * Campo que a implementacao de T009 nao conheca e simplesmente ignorado; campo
 * que ela exija e esta suite nao ofereca aparece como falha com nome. Os tres
 * ultimos sao o motivo de este contexto nao ser o de T003:
 *
 * - `email`: AD-08 poe o envio entre as 5 bordas com porta, e `plan.md` registra
 *   que *"o e-mail carrega UC-20 (recuperar senha)"*. Falha de envio e **valor**,
 *   nunca excecao (`../portas/porta-de-email.ts`).
 * - `gerarChave`: o legado gera a chave por funcao propria, e o manifest de
 *   paridade fixa `seedRandom: 42` justamente porque valor sorteado nao se
 *   compara. Injetar o gerador e o que torna CA-4.1 conferivel: sem conhecer a
 *   chave em claro, nenhum teste pode afirmar que ela **nao** esta no banco.
 * - `hashDeSenha`: `PrimitivaDeBcrypt`, como T003 a declarou, tem **so**
 *   `verificar` — T003 nunca gravou senha. US-4 grava, e por isso o lado de
 *   escrita entra aqui. A lacuna e de T003 e esta registrada, nao resolvida.
 */
interface ContextoDeRedefinicao {
  readonly relogio: PortaDeRelogio;
  readonly contas: ContasDeUS4;
  readonly email: PortaDeEmail;
  readonly sessoes: ArmazenamentoDeSessoes;
  readonly verificadorDeSenha: VerificadorDeSenha;
  /** O lado de escrita do *hash*: senha em claro para o valor gravavel. */
  readonly hashDeSenha: (senha: string) => string;
  /** A chave em claro de um pedido. Ponto de substituicao, nao sorteio solto. */
  readonly gerarChave: () => string;
  readonly removerAcentos: RemocaoDeAcentos;
  readonly rede: EstadoDaRede;
  /** A URL do pedido de senha perdida (`SCR-002`), que e da tela. */
  readonly urlDeSenhaPerdida: string;
  /** A URL da tela de redefinicao (`SCR-003`), onde o link do e-mail aponta. */
  readonly urlDeRedefinicao: string;
  readonly urlDoPainel: string;
  readonly prazosDoToken?: PrazosDoTokenDeSessao;
}

/**
 * A conta, atras dos **dois** contratos de conta que esta arvore ja tem.
 *
 * `LeituraDeConta` e de T003 (ler por login, ler por e-mail, apagar a chave de
 * ativacao) e `RepositorioDeContas` e de T002 (as leituras e o `atualizar` por
 * campos). Os dois existem, os dois sao documentados, e **nenhum nome colide**:
 * o bloco de merge de `../index.ts` registra que as duas representacoes de conta
 * convivem nesta arvore sem que ninguem tenha decidido qual fica, e decidir isso
 * nao e tarefa de uma suite de teste.
 *
 * Servir os dois e o que torna esta suite independente da escolha de T009: a
 * conta e **uma** linha em memoria, e o efeito e o mesmo caminho por onde ele
 * tenha escrito — `atualizar(id, { chaveDeAtivacao })`,
 * `atualizar(id, { senhaHash })` ou `apagarChaveDeAtivacao(id)` cobrem as tres
 * escritas que `UC-20` tem.
 */
interface ContasDeUS4 extends LeituraDeConta, RepositorioDeContas {}

/**
 * O que as duas operacoes devolvem.
 *
 * `unknown` **de proposito**: esta suite nao cobra a forma do relato, porque
 * nenhum documento do pacote a fixa. O que ela cobra e o **efeito observavel** —
 * o que ficou gravado na conta, o que saiu pela porta de e-mail, o que
 * continuou valendo — que e o critério de paridade desta area (*"efeito no
 * banco"*, Decisao 2 de `parity_specs.md`). A unica coisa que os casos leem do
 * relato e se ele **nomeia** o vencimento, porque CA-4.2 exige que a recusa por
 * prazo seja distinguivel da generica de CA-4.5; e isso e lido por vocabulario,
 * nao por campo (ver {@link NOMEIA_VENCIMENTO}).
 */
type RelatoDeUS4 = unknown;

/** As duas operacoes de US-4 que estes seis testes exercitam. */
interface SuperficieDeUS4 {
  pedirRedefinicao(
    pedido: PedidoDeRedefinicao,
    contexto: ContextoDeRedefinicao,
  ): RelatoDeUS4;
  redefinirSenha(
    dados: DadosDaRedefinicao,
    contexto: ContextoDeRedefinicao,
  ): RelatoDeUS4;
}

/*
  ── ONDE A IMPLEMENTACAO DE US-4 E PROCURADA ────────────────────────────────

  Os caminhos sao **variaveis**, e nao literais num `import`, exatamente para que
  a ausencia de T009 seja uma falha de teste com nome em vez de uma falha de
  compilacao da arvore inteira (item 2 do cabecalho).

  O barril vem primeiro porque e por ele que cada tarefa publicou a sua operacao
  ate aqui — T003, T005 e T007 todas acrescentaram `export *` a `../index.ts`.
  Os outros caminhos cobrem a hipotese de T009 ter publicado so no arquivo dela.
*/
const MODULOS_DE_US4: readonly string[] = [
  '../index.js',
  './redefinicao-de-senha.js',
  '../senha/redefinicao-de-senha.js',
  '../conta/redefinicao-de-senha.js',
  '../autenticacao/redefinicao-de-senha.js',
];

/**
 * Os nomes aceitos para *pedir redefinicao de senha*.
 *
 * O primeiro e o nome da operacao na tabela *Contratos* de `plan.md`; os outros
 * sao os nomes que o **mesmo pacote** usa para ela em outro documento —
 * `solicitarResetDeSenha` e o comando de `AGG-Conta` em
 * `target_domain_model.md`. A lista existe porque o pacote nomeia a operacao
 * duas vezes, de dois jeitos, e nao porque esta suite tolere qualquer nome: a
 * exigencia dos casos esta nas assercoes, nao no simbolo.
 */
const NOMES_DO_PEDIDO = [
  'pedirRedefinicaoDeSenha',
  'solicitarRedefinicaoDeSenha',
  'solicitarResetDeSenha',
  'pedirRedefinicao',
] as const;

/**
 * Os nomes aceitos para *redefinir senha*.
 *
 * ⚠️ `consumirChaveDeReset` **nao** esta na lista, e a ausencia e deliberada: em
 * `target_domain_model.md` ele e o comando que **consome a chave**, e `trocarSenha`
 * e o que **grava a senha** — dois comandos, nao um. Se T009 entregou o par em vez
 * da operacao inteira que `plan.md` declara, e **neste bloco** que os dois se
 * compoem, na ordem dos passos 5 e 6 de `UC-20` (conferir a chave e o prazo;
 * depois gravar a senha e invalidar a chave). Compor por conta propria aqui seria
 * esta suite implementando a ordem que `UC-20` poe no sistema.
 */
const NOMES_DA_REDEFINICAO = [
  'redefinirSenha',
  'redefinirSenhaComChave',
] as const;

/**
 * Os nomes aceitos para o ponto de configuracao nomeado do prazo da chave.
 *
 * ⚠️ **Nenhum documento do pacote nomeia esta constante** — o pacote da o valor
 * (*"a chave de reset de senha vale 24 horas"*, BR-MIGRAR-024) e o P6 da
 * constituicao exige que ele more *"num ponto de configuracao nomeado, com o
 * valor de fabrica do legado"*. Por isso `UT-006-6` afirma o valor **se** o ponto
 * existir com um destes nomes, e afirma o efeito da borda de qualquer jeito.
 */
const NOMES_DO_PRAZO = [
  'PRAZO_DA_CHAVE_DE_REDEFINICAO_DE_FABRICA',
  'PRAZO_DE_FABRICA_DA_CHAVE_DE_REDEFINICAO',
  'PRAZO_DA_CHAVE_DE_REDEFINICAO',
  'PRAZO_DA_CHAVE_DE_RESET_DE_FABRICA',
  'PRAZO_DA_CHAVE_DE_RESET',
] as const;

type Resolucao =
  | {
      readonly disponivel: true;
      readonly us4: SuperficieDeUS4;
      readonly prazoDeclarado: number | null;
    }
  | { readonly disponivel: false; readonly faltando: readonly string[] };

/**
 * Resolve a superficie de US-4 e **confere a forma dela** antes de devolver.
 *
 * A conferencia por `typeof` e o que autoriza a conversao do fim: o que chega de
 * um `import` dinamico e `any`, e so depois de as duas operacoes estarem la, e
 * serem funcao, a conversao deixa de ser aposta. Operacao que falta volta em
 * `faltando` com **todos** os nomes que foram procurados, que e o que o teste
 * imprime — quem for reconciliar precisa saber o que foi pedido, nao so que
 * faltou algo.
 */
async function resolverSuperficieDeUS4(): Promise<Resolucao> {
  const encontrado: Record<string, unknown> = {};

  for (const caminho of MODULOS_DE_US4) {
    let modulo: Record<string, unknown>;
    try {
      modulo = (await import(caminho)) as Record<string, unknown>;
    } catch {
      continue;
    }
    for (const [nome, valor] of Object.entries(modulo)) {
      if (!(nome in encontrado)) {
        encontrado[nome] = valor;
      }
    }
  }

  function funcao(nomes: readonly string[]): unknown {
    return nomes.map((nome) => encontrado[nome]).find((valor) => typeof valor === 'function');
  }

  const pedido = funcao(NOMES_DO_PEDIDO);
  const redefinicao = funcao(NOMES_DA_REDEFINICAO);

  const faltando: string[] = [];
  if (pedido === undefined) {
    faltando.push(`pedir redefinicao de senha (procurado como: ${NOMES_DO_PEDIDO.join(', ')})`);
  }
  if (redefinicao === undefined) {
    faltando.push(`redefinir senha (procurado como: ${NOMES_DA_REDEFINICAO.join(', ')})`);
  }
  if (faltando.length > 0) {
    return { disponivel: false, faltando };
  }

  const prazo = NOMES_DO_PRAZO.map((nome) => encontrado[nome]).find(
    (valor) => typeof valor === 'number',
  );

  return {
    disponivel: true,
    us4: {
      pedirRedefinicao: pedido as SuperficieDeUS4['pedirRedefinicao'],
      redefinirSenha: redefinicao as SuperficieDeUS4['redefinirSenha'],
    },
    prazoDeclarado: typeof prazo === 'number' ? prazo : null,
  };
}

const RESOLUCAO = await resolverSuperficieDeUS4();

/** A superficie, ou uma falha que diz o que falta e de quem e a tarefa. */
function us4(): SuperficieDeUS4 {
  if (!RESOLUCAO.disponivel) {
    assert.fail(
      `US-4 nao esta nesta arvore: faltam ${RESOLUCAO.faltando.join(' · ')}. ` +
        'Estes seis testes sao T010, e `tasks.md` poe "T010 depende de T009" — ' +
        'o comportamento de US-4 e entrega de T009. Esta falha e a dependencia ' +
        'declarada, nao divergencia de comportamento: ver o item 2 do cabecalho ' +
        'deste arquivo.',
    );
  }
  return RESOLUCAO.us4;
}

/**
 * Chama uma operacao de US-4 e cobra que a falha venha como **valor**.
 *
 * Os contratos de `plan.md` chamam a falha desta feature de *"estado reportavel
 * e nao excecao"*, e `../portas/porta-de-email.ts` repete o motivo observavel:
 * quem chama decide o que fazer. Uma excecao aqui nao e so inconveniente para o
 * teste — e o contrato trocado.
 *
 * Falha de assercao passa direto: ela e desta suite, nao da operacao, e
 * reetiqueta-la esconderia o que de fato quebrou.
 */
function chamar(acao: () => RelatoDeUS4): RelatoDeUS4 {
  try {
    return acao();
  } catch (erro) {
    if (erro instanceof assert.AssertionError) {
      throw erro;
    }
    assert.fail(
      'US-4 lancou em vez de devolver estado: ' +
        `${erro instanceof Error ? `${erro.name}: ${erro.message}` : String(erro)}. ` +
        'Os contratos de `plan.md` chamam a falha desta feature de "estado ' +
        'reportavel e nao excecao".',
    );
  }
}

/*
  ── O DADO DE ENTRADA DOS SEIS CASOS ────────────────────────────────────────
*/

/**
 * O instante de partida de todos os casos.
 *
 * Fixo e arbitrario, como na suite de T008: o que os casos afirmam e
 * **diferenca** de instante, e um relogio real tornaria a borda do P6
 * irrepetivel.
 */
const AGORA = 1_700_000_000;

/** As 24 horas de BR-MIGRAR-024, no nome em que os casos as citam. */
const VINTE_E_QUATRO_HORAS = 24 * SEGUNDOS_POR_HORA;

/** A conta que esquece a senha, e uma segunda que nenhum caso pode tocar. */
const ID_DA_CONTA = 7;
const LOGIN = 'ada';
const EMAIL = 'ada@exemplo.invalido';
const SENHA = 'segredo';
const SENHA_NOVA = 'outroSegredo';

const ID_DA_OUTRA = 99;
const LOGIN_DA_OUTRA = 'grace';
const EMAIL_DA_OUTRA = 'grace@exemplo.invalido';

/**
 * As chaves em claro que o gerador desta suite entrega, na ordem.
 *
 * **So letras, de proposito.** O pacote nao registra alfabeto nem comprimento da
 * chave (ver *O que esta suite nao afirma*), e a tela do legado filtra a chave
 * recebida; uma chave de teste com pontuacao poderia ser mutilada por uma
 * sanitizacao legitima e fazer o caso falhar por um motivo que nao e o dele.
 */
const CHAVES_EMITIDAS: readonly string[] = [
  'chaveEmClaroPrimeira',
  'chaveEmClaroSegunda',
  'chaveEmClaroTerceira',
  'chaveEmClaroQuarta',
];

/** Uma chave que nunca foi emitida por pedido nenhum (CA-4.5). */
const CHAVE_NUNCA_EMITIDA = 'chaveQueNinguemEmitiu';

/**
 * O vocabulario pelo qual um relato de recusa **nomeia o vencimento**.
 *
 * Vem do pacote, nao de gosto: `SCR-003` tem a transicao
 * `?action=lostpassword&error=expiredkey` e `SCR-002` tem o literal *"Your
 * password reset link **has expired**"*, contra `error=invalidkey` e *"appears to
 * be **invalid**"*. CA-4.2 e CA-4.5 exigem que as duas recusas sejam
 * distinguiveis, e e essa distincao — e so ela — que os casos leem do relato.
 *
 * ⚠️ O contrario **nao** e cobrado: a recusa por prazo pode nomear tambem a
 * invalidez (no legado o codigo distingue e a mensagem do erro, nessa camada, nao
 * distingue), e um caso que exigisse o contrario afirmaria mais do que o pacote
 * registra.
 */
const NOMEIA_VENCIMENTO = /expir|vencid/i;

/** Como o relato chega a uma assercao de vocabulario. */
function marcadoresDe(relato: RelatoDeUS4): string {
  if (relato instanceof Error) {
    return `${relato.name}: ${relato.message}`;
  }
  try {
    return JSON.stringify(relato) ?? String(relato);
  } catch {
    return String(relato);
  }
}

/*
  ── O HASH DE SENHA DESTA SUITE ─────────────────────────────────────────────

  A primitiva real e adaptador: `plan.md` escolhe bcrypt por biblioteca nativa e
  AD-04 poe essa borda em `adaptadores/`. O que esta suite monta e a **forma** do
  hash do legado — prefixo `$wp`, pre-processamento HMAC-SHA384 em base64,
  bcrypt —, com as duas pontas, porque US-4 **grava** senha e nao so a confere.

  O corpo embute o valor pre-processado em hexadecimal, e isso nao e decoracao:
  e o que permite a mesma primitiva gerar e verificar o hash de **qualquer**
  senha, o que um simulado com senha fixa nao faria. O comprimento resultante
  passa do teto de 32 caracteres do ramo de resumo antigo, que e o que garante que
  o verificador do nucleo escolha o ramo de bcrypt, como numa instalacao nova.
*/

function corpoDoHash(valorPreProcessado: string): string {
  return `$2y$10$${Buffer.from(valorPreProcessado, 'utf8').toString('hex')}`;
}

function valorPreProcessadoDe(hash: string): string | null {
  const marca = /^\$2y\$10\$([0-9a-f]*)$/.exec(hash);
  if (marca === null) {
    return null;
  }
  return Buffer.from(marca[1] ?? '', 'hex').toString('utf8');
}

/** O bcrypt desta suite, com o lado de escrita que `PrimitivaDeBcrypt` nao tem. */
const BCRYPT_DE_TESTE: PrimitivaDeBcrypt & {
  gerar(valorPreProcessado: string): string;
} = {
  verificar(senhaPreProcessada, hash) {
    return valorPreProcessadoDe(hash) === senhaPreProcessada;
  },
  gerar(valorPreProcessado) {
    return corpoDoHash(valorPreProcessado);
  },
};

const VERIFICADOR_DE_SENHA = criarVerificadorDeSenhaDoNucleo({
  bcrypt: BCRYPT_DE_TESTE,
});

/** A senha em claro no valor que vai para `users.user_pass`. */
function hashDeSenha(senha: string): string {
  return `$wp${BCRYPT_DE_TESTE.gerar(preProcessarSenhaParaBcrypt(senha))}`;
}

/*
  ── A CONTA EM MEMORIA, ATRAS DOS DOIS CONTRATOS DE CONTA ───────────────────
*/

interface BancoDeContas {
  readonly contas: ContasDeUS4;
  /** A linha gravada, que e onde cada caso le o efeito. */
  linha(id: number): ContaArmazenada;
  /** Toda escrita de conta, na ordem: e por aqui que se ve o que saiu. */
  readonly escritas: readonly {
    readonly id: number;
    readonly campos: CamposDeConta;
  }[];
}

function semIndefinidos(campos: CamposDeConta): Partial<ContaArmazenada> {
  const limpos: Record<string, unknown> = {};
  for (const [nome, valor] of Object.entries(campos)) {
    if (valor !== undefined) {
      limpos[nome] = valor;
    }
  }
  return limpos as Partial<ContaArmazenada>;
}

function contaInicial(parcial: Partial<ContaArmazenada> = {}): ContaArmazenada {
  return {
    id: ID_DA_CONTA,
    login: LOGIN,
    senhaHash: hashDeSenha(SENHA),
    apelido: LOGIN,
    email: EMAIL,
    url: '',
    registradoEm: DATA_SENTINELA,
    // Sem chave pendente: o DDL e `NOT NULL default ''`, e `DB-SENT` registra que
    // o esquema evita `NULL` e usa sentinela.
    chaveDeAtivacao: '',
    // Coluna morta (`DB-DEAD`): lida, escrita em lugar nenhum.
    status: 0,
    nomeExibido: 'Ada',
    // `site-unico` e a variante de fabrica: a rede so existe depois que alguem a
    // cria, e nenhum caso de US-4 e sobre rede.
    supervisaoDeRede: null,
    ...parcial,
  };
}

function bancoDeContas(iniciais: readonly ContaArmazenada[]): BancoDeContas {
  const linhas = new Map<number, ContaArmazenada>(
    iniciais.map((linha) => [linha.id, linha]),
  );
  const escritas: { readonly id: number; readonly campos: CamposDeConta }[] = [];
  let proximoId = Math.max(...iniciais.map((linha) => linha.id)) + 1;

  function achar(
    predicado: (linha: ContaArmazenada) => boolean,
  ): ContaArmazenada | null {
    return [...linhas.values()].find(predicado) ?? null;
  }

  /** A mesma linha, na fatia que `LeituraDeConta` (T003) devolve. */
  function daLeitura(linha: ContaArmazenada | null): ContaDaLeitura | null {
    if (linha === null) {
      return null;
    }
    return {
      id: linha.id,
      login: linha.login,
      senhaHash: linha.senhaHash,
      email: linha.email,
      apelido: linha.apelido,
      nomeExibido: linha.nomeExibido,
      chaveDeAtivacao: linha.chaveDeAtivacao,
      ...(linha.supervisaoDeRede === null
        ? {}
        : {
            marcadaComoSpam: linha.supervisaoDeRede.spam === 1,
            marcadaComoApagada: linha.supervisaoDeRede.deleted === 1,
          }),
    };
  }

  function aplicar(id: number, campos: CamposDeConta): number {
    const linha = linhas.get(id);
    if (linha === undefined) {
      return 0;
    }
    escritas.push({ id, campos });
    linhas.set(id, { ...linha, ...semIndefinidos(campos) });
    return 1;
  }

  const contas: ContasDeUS4 = {
    // ── LeituraDeConta, de T003 ──
    porLogin(login) {
      return daLeitura(achar((linha) => linha.login === login));
    },
    porEmail(email) {
      return daLeitura(achar((linha) => linha.email === email));
    },
    apagarChaveDeAtivacao(id) {
      aplicar(id, { chaveDeAtivacao: '' });
    },

    // ── RepositorioDeContas, de T002 ──
    inserir(nova: ContaNova) {
      const id = proximoId;
      proximoId += 1;
      linhas.set(id, contaInicial({ ...nova, id, status: 0, supervisaoDeRede: null }));
      return id;
    },
    obterPorId(id) {
      return linhas.get(id) ?? null;
    },
    obterPorLogin(login) {
      return achar((linha) => linha.login === login);
    },
    obterPorEmail(email) {
      return achar((linha) => linha.email === email);
    },
    obterPorApelido(apelido) {
      return achar((linha) => linha.apelido === apelido);
    },
    atualizar(id, campos) {
      return aplicar(id, campos);
    },
    atualizarSupervisaoDeRede() {
      // O mesmo que a implementacao de T002 faz: na variante de site unico as
      // colunas nao existem, e escrever ali e consulta a coluna inexistente.
      throw new Error('spam e deleted so existem na variante de rede de users');
    },
  };

  return {
    contas,
    linha(id) {
      const linha = linhas.get(id);
      assert.ok(linha !== undefined, `a montagem nao tem a conta ${id}`);
      return linha;
    },
    escritas,
  };
}

/*
  ── A CAIXA DE SAIDA ────────────────────────────────────────────────────────
*/

interface CaixaDeSaida {
  readonly porta: PortaDeEmail;
  readonly mensagens: readonly MensagemDeEmail[];
}

/**
 * A caixa que **sempre aceita**.
 *
 * A falha de envio e US-5 (T011 e T012), e um caso de falha aqui invadiria a
 * historia seguinte. O que esta suite usa da caixa e o conteudo: CA-4.1 so e
 * conferivel contra a mensagem que saiu.
 */
function caixaDeSaida(): CaixaDeSaida {
  const mensagens: MensagemDeEmail[] = [];
  return {
    porta: {
      enviar(mensagem) {
        mensagens.push(mensagem);
        return { enviado: true };
      },
    },
    mensagens,
  };
}

/*
  ── A MONTAGEM ──────────────────────────────────────────────────────────────
*/

interface Montagem {
  readonly contexto: ContextoDeRedefinicao;
  readonly banco: BancoDeContas;
  readonly caixa: CaixaDeSaida;
  readonly sessoes: ArmazenamentoDeSessoes;
  mapaDeSessoes(id: number): MapaDeSessoes;
  /** Move o relogio para um instante absoluto. */
  relogioEm(instante: number): void;
  /** As chaves que o gerador desta suite entregou, na ordem. */
  readonly chavesGeradas: readonly string[];
}

function montar(iniciais: readonly ContaArmazenada[] = [contaInicial()]): Montagem {
  let agora = AGORA;
  const banco = bancoDeContas(iniciais);
  const caixa = caixaDeSaida();
  const mapas = new Map<number, MapaDeSessoes>();
  const chavesGeradas: string[] = [];

  const sessoes: ArmazenamentoDeSessoes = {
    ler: (id) => mapas.get(id) ?? {},
    gravar: (id, mapa) => {
      mapas.set(id, mapa);
    },
  };

  const contexto: ContextoDeRedefinicao = {
    relogio: { agoraEmSegundos: () => agora },
    contas: banco.contas,
    email: caixa.porta,
    sessoes,
    verificadorDeSenha: VERIFICADOR_DE_SENHA,
    hashDeSenha,
    gerarChave: () => {
      const chave = CHAVES_EMITIDAS[chavesGeradas.length];
      assert.ok(
        chave !== undefined,
        'a montagem desta suite nao tem mais chave em claro para entregar',
      );
      chavesGeradas.push(chave);
      return chave;
    },
    // A remocao de acentos e identidade nesta suite, e isso esta declarado: a
    // tabela de caractere e de `plataforma/`, nao deste modulo.
    removerAcentos: (texto) => texto,
    rede: REDE_INATIVA,
    urlDeSenhaPerdida:
      'https://exemplo.invalido/wp-login.php?action=lostpassword',
    urlDeRedefinicao: 'https://exemplo.invalido/wp-login.php?action=rp',
    urlDoPainel: 'https://exemplo.invalido/wp-admin/',
  };

  return {
    contexto,
    banco,
    caixa,
    sessoes,
    mapaDeSessoes: (id) => mapas.get(id) ?? {},
    relogioEm: (instante) => {
      agora = instante;
    },
    chavesGeradas,
  };
}

/** Pede a redefinicao naquele instante e devolve a chave em claro emitida. */
function pedir(
  montagem: Montagem,
  instante: number,
  identificador: string = LOGIN,
): { readonly chave: string; readonly relato: RelatoDeUS4 } {
  // A superficie e resolvida **antes** do `chamar`: a ausencia de T009 e falha
  // desta suite, nao excecao da operacao.
  const operacoes = us4();
  montagem.relogioEm(instante);
  const relato = chamar(() =>
    operacoes.pedirRedefinicao({ identificador }, montagem.contexto),
  );
  return { chave: chaveEmClaroDe(montagem, relato), relato };
}

/**
 * De onde sai a chave em claro de um pedido.
 *
 * Primeiro o gerador injetado, que e o caminho normal e o unico que torna CA-4.1
 * conferivel. Se T009 nao aceitar gerador, o relato e a outra fonte possivel — e
 * se nenhuma das duas existir, a suite para e diz por que: o pacote **nao fixa o
 * formato da mensagem**, logo extrair a chave do corpo do e-mail seria inventar
 * um formato.
 */
function chaveEmClaroDe(montagem: Montagem, relato: RelatoDeUS4): string {
  const gerada = montagem.chavesGeradas.at(-1);
  if (gerada !== undefined) {
    return gerada;
  }
  if (typeof relato === 'object' && relato !== null) {
    for (const nome of ['chave', 'chaveEmClaro', 'chaveDeRedefinicao']) {
      const valor = (relato as Record<string, unknown>)[nome];
      if (typeof valor === 'string' && valor !== '') {
        return valor;
      }
    }
  }
  return assert.fail(
    'esta suite nao tem como saber a chave em claro emitida: o gerador ' +
      '`gerarChave` do contexto nao foi chamado e o relato do pedido nao traz ' +
      'a chave. Sem ela, CA-4.1 ("o valor em claro so existe no e-mail ' +
      'enviado") nao e conferivel. Ver o contrato declarado no topo deste ' +
      'arquivo.',
  );
}

/** Redefine a senha naquele instante, com aquela chave. */
function redefinir(
  montagem: Montagem,
  instante: number,
  dados: Partial<DadosDaRedefinicao> & { readonly chave: string },
): RelatoDeUS4 {
  const operacoes = us4();
  montagem.relogioEm(instante);
  return chamar(() =>
    operacoes.redefinirSenha(
      {
        chave: dados.chave,
        login: dados.login ?? LOGIN,
        senhaNova: dados.senhaNova ?? SENHA_NOVA,
      },
      montagem.contexto,
    ),
  );
}

/** A senha que a linha gravada aceita hoje. */
function senhaGravadaAceita(montagem: Montagem, senha: string): boolean {
  return VERIFICADOR_DE_SENHA.verificar(
    senha,
    montagem.banco.linha(ID_DA_CONTA).senhaHash,
  );
}

/**
 * Afirma que a conta continua com a senha antiga e sem escrita de senha.
 *
 * E a assercao central de toda recusa: o pacote nao fixa a forma do relato, mas
 * fixa o efeito — chave recusada nao troca senha.
 */
function senhaIntacta(montagem: Montagem): void {
  assert.equal(
    senhaGravadaAceita(montagem, SENHA),
    true,
    'a senha gravada deixou de ser a antiga depois de uma chave recusada',
  );
  assert.equal(
    senhaGravadaAceita(montagem, SENHA_NOVA),
    false,
    'a senha nova passou a valer depois de uma chave recusada',
  );
}

// ---------------------------------------------------------------------------
// UT-006-1 — CA-4.1 *"A chave e guardada com hash na conta e o valor em claro so
// existe no e-mail enviado"*
//
// entrada:  a conta `ada` (login `ada`, e-mail `ada@exemplo.invalido`, sem chave
//           pendente) e o relogio em AGORA; o pedido informa o login
// acao:     pedir a redefinicao de senha
// esperado: sai **uma** mensagem, para o e-mail da conta, e o corpo dela carrega
//           a chave em claro (UC-20 passo 3); a coluna `user_activation_key`
//           deixa de estar vazia, e o valor gravado **nao contem** a chave em
//           claro e e **prefixado pelo instante** do pedido (`plan.md`, Modelo de
//           dados); nenhuma escrita desta operacao carrega a chave em claro; e a
//           senha gravada nao e tocada. E o mesmo pedido pelo **e-mail** chega a
//           mesma conta (UC-20 passo 1)
// ---------------------------------------------------------------------------

test('UT-006-1 (CA-4.1) a chave e guardada com hash na conta, e o valor em claro so existe no e-mail', () => {
  const montagem = montar();

  const { chave } = pedir(montagem, AGORA);

  // O e-mail: um, para o endereco da conta, com a chave em claro dentro.
  assert.equal(montagem.caixa.mensagens.length, 1);
  const mensagem = montagem.caixa.mensagens[0];
  assert.ok(mensagem !== undefined);
  assert.deepEqual([...mensagem.destinatarios], [EMAIL]);
  assert.equal(
    mensagem.corpo.includes(chave),
    true,
    'o corpo do e-mail nao carrega a chave em claro, e UC-20 passo 3 manda enviar o link com a chave',
  );

  // A conta: chave gravada, com hash e com o instante prefixado.
  const gravado = montagem.banco.linha(ID_DA_CONTA).chaveDeAtivacao;
  assert.notEqual(gravado, '', 'nenhuma chave foi gravada na conta');
  assert.equal(
    gravado.includes(chave),
    false,
    'o valor em claro da chave foi gravado na conta, e CA-4.1 manda guardar com hash',
  );
  assert.equal(
    gravado.startsWith(String(AGORA)),
    true,
    'o valor gravado nao e prefixado pelo instante do pedido, e e dele que sai a janela de 24 horas',
  );

  // E a chave em claro nao saiu em escrita nenhuma — nem em outra coluna.
  assert.equal(
    JSON.stringify(montagem.banco.escritas).includes(chave),
    false,
    'a chave em claro aparece em uma escrita de conta',
  );

  // A senha nao foi tocada: pedir redefinicao nao redefine nada.
  assert.equal(senhaGravadaAceita(montagem, SENHA), true);

  // UC-20 passo 1: *"informa o login ou o e-mail da conta"* — os dois caminhos
  // chegam a mesma conta. O segundo pedido substitui a chave, que e CA-4.3.
  const porEmail = montar();
  pedir(porEmail, AGORA, EMAIL);
  assert.equal(porEmail.caixa.mensagens.length, 1);
  assert.notEqual(porEmail.banco.linha(ID_DA_CONTA).chaveDeAtivacao, '');
});

// ---------------------------------------------------------------------------
// UT-006-2 — CA-4.2 *"Chave com mais de 24 horas e recusada com aviso de prazo
// vencido e oferta de pedir outra"*
//
// entrada:  uma chave emitida em AGORA, em duas montagens iguais
// acao:     redefinir a senha com ela em AGORA + 24 h − 1, e na outra montagem em
//           AGORA + 24 h + 1
// esperado: dentro do prazo a senha e trocada; alem do prazo a chave e recusada,
//           o relato **nomeia o vencimento** — que e o que a tela precisa para
//           escolher a transicao `?action=lostpassword&error=expiredkey` de
//           `SCR-003` — e a senha continua sendo a antiga
//
// ⚠️ O instante exatamente igual a AGORA + 24 h **nao** e afirmado: o pacote nao
//    o fixa (item 3 do cabecalho).
// ---------------------------------------------------------------------------

test('UT-006-2 (CA-4.2) chave com mais de 24 horas e recusada nomeando o prazo vencido', () => {
  // Um instante antes do prazo: aceita.
  const dentro = montar();
  const chaveDentro = pedir(dentro, AGORA).chave;

  redefinir(dentro, AGORA + VINTE_E_QUATRO_HORAS - 1, { chave: chaveDentro });

  assert.equal(
    senhaGravadaAceita(dentro, SENHA_NOVA),
    true,
    'a chave foi recusada um instante antes do prazo, e PT-006 manda aceita-la ali',
  );

  // Alem do prazo: recusa, e a recusa nomeia o vencimento.
  const alem = montar();
  const chaveAlem = pedir(alem, AGORA).chave;

  const relato = redefinir(alem, AGORA + VINTE_E_QUATRO_HORAS + 1, {
    chave: chaveAlem,
  });

  senhaIntacta(alem);
  assert.match(
    marcadoresDe(relato),
    NOMEIA_VENCIMENTO,
    'a recusa alem do prazo nao nomeia o vencimento, e CA-4.2 exige o aviso de prazo vencido — ' +
      'e dele que sai a transicao `error=expiredkey` de SCR-003',
  );
});

// ---------------------------------------------------------------------------
// UT-006-3 — CA-4.3 *"Um pedido novo antes do prazo substitui a chave anterior,
// que deixa de valer"*
//
// entrada:  uma chave emitida em AGORA e outra emitida em AGORA + 1 h, para a
//           mesma conta — o fluxo alternativo *"Pedido repetido antes do prazo"*
//           de UC-20
// acao:     tentar redefinir com a primeira chave, e depois com a segunda
// esperado: o valor gravado muda entre os dois pedidos; a primeira chave e
//           recusada **sem** nomear vencimento, porque ela nao venceu — ela foi
//           substituida (UC-20: *"o link antigo deixa de valer"*); a senha segue
//           intacta; e a segunda chave troca a senha
// ---------------------------------------------------------------------------

test('UT-006-3 (CA-4.3) o pedido novo substitui a chave anterior, que deixa de valer', () => {
  const montagem = montar();

  const primeira = pedir(montagem, AGORA).chave;
  const gravadoDoPrimeiro = montagem.banco.linha(ID_DA_CONTA).chaveDeAtivacao;

  const segunda = pedir(montagem, AGORA + SEGUNDOS_POR_HORA).chave;
  const gravadoDoSegundo = montagem.banco.linha(ID_DA_CONTA).chaveDeAtivacao;

  assert.notEqual(primeira, segunda, 'a montagem emitiu a mesma chave duas vezes');
  assert.notEqual(
    gravadoDoSegundo,
    gravadoDoPrimeiro,
    'o pedido novo nao substituiu o valor gravado da chave anterior',
  );
  assert.equal(montagem.caixa.mensagens.length, 2);

  // A chave anterior nao vale mais, e nao e por prazo: ela foi substituida.
  const relato = redefinir(montagem, AGORA + SEGUNDOS_POR_HORA, {
    chave: primeira,
  });

  senhaIntacta(montagem);
  assert.doesNotMatch(
    marcadoresDe(relato),
    NOMEIA_VENCIMENTO,
    'a chave substituida foi recusada como vencida, e ela nao venceu — ' +
      'dentro das 24 horas a recusa e a generica de CA-4.5',
  );

  // E a chave nova vale.
  redefinir(montagem, AGORA + SEGUNDOS_POR_HORA, { chave: segunda });

  assert.equal(
    senhaGravadaAceita(montagem, SENHA_NOVA),
    true,
    'a chave do pedido novo nao trocou a senha',
  );
});

// ---------------------------------------------------------------------------
// UT-006-4 — CA-4.4 *"Gravar a senha nova invalida a chave usada"*
//
// entrada:  uma chave emitida em AGORA, e uma sessao aberta antes da troca
// acao:     redefinir a senha em AGORA + 1 h, e tentar reusar a mesma chave
// esperado: a senha gravada passa a ser a nova e o texto claro dela nao esta em
//           lugar nenhum da linha; `user_activation_key` volta a sentinela vazia
//           — `''`, nao nulo (`DB-SENT`) —; a mesma chave usada de novo e recusada
//           e nao troca nada; e a sessao aberta antes **continua gravada**
//           (pos-condicao de UC-20: *"as sessoes abertas antes da troca nao sao
//           encerradas por este fluxo"*; BR-MIGRAR-111)
// ---------------------------------------------------------------------------

test('UT-006-4 (CA-4.4) gravar a senha nova invalida a chave usada, e nao derruba sessao', () => {
  const montagem = montar();

  // Uma sessao aberta antes da troca, com o prazo que a entrada daria.
  const sessao = abrirSessao(
    montagem.sessoes,
    ID_DA_CONTA,
    AGORA + 2 * 24 * SEGUNDOS_POR_HORA,
    AGORA,
  );
  const mapaAntes = montagem.mapaDeSessoes(ID_DA_CONTA);

  const chave = pedir(montagem, AGORA).chave;

  redefinir(montagem, AGORA + SEGUNDOS_POR_HORA, { chave });

  const linha = montagem.banco.linha(ID_DA_CONTA);

  // A senha e a nova, e a antiga nao vale mais.
  assert.equal(VERIFICADOR_DE_SENHA.verificar(SENHA_NOVA, linha.senhaHash), true);
  assert.equal(VERIFICADOR_DE_SENHA.verificar(SENHA, linha.senhaHash), false);

  // E a senha em texto nao foi gravada em lugar algum da linha.
  assert.equal(
    JSON.stringify(linha).includes(SENHA_NOVA),
    false,
    'a senha nova em texto claro aparece na linha gravada',
  );

  // A chave usada foi invalidada, e o valor e a sentinela vazia do DDL.
  assert.equal(linha.chaveDeAtivacao, '');

  // Reusar a mesma chave nao faz nada: `plan.md` declara "chave ja usada" entre
  // os erros desta operacao.
  const reuso = redefinir(montagem, AGORA + 2 * SEGUNDOS_POR_HORA, {
    chave,
    senhaNova: 'terceiraSenha',
  });

  assert.equal(
    VERIFICADOR_DE_SENHA.verificar(
      'terceiraSenha',
      montagem.banco.linha(ID_DA_CONTA).senhaHash,
    ),
    false,
    'a chave ja usada trocou a senha de novo',
  );
  assert.equal(
    VERIFICADOR_DE_SENHA.verificar(
      SENHA_NOVA,
      montagem.banco.linha(ID_DA_CONTA).senhaHash,
    ),
    true,
  );
  assert.doesNotMatch(marcadoresDe(reuso), NOMEIA_VENCIMENTO);

  // A sessao aberta antes da troca sobreviveu, inteira.
  //
  // E a pos-condicao de UC-20 e a divida herdada de BR-MIGRAR-111 (`ESC-SESSAO`),
  // que a resposta 7 mandou preservar: *"trocar a senha nao revoga sessao"*, e
  // *"o criterio de aceite tem de verificar o acumulo, nao a limpeza"*. REQ-008
  // pede o contrario e esta **bloqueado** (`do-not-rewrite.md`): um porte que
  // revogasse aqui estaria resolvendo decisao humana por conta propria.
  assert.deepEqual(montagem.mapaDeSessoes(ID_DA_CONTA), mapaAntes);
  assert.equal(Object.keys(montagem.mapaDeSessoes(ID_DA_CONTA)).length, 1);
  assert.notEqual(sessao.token, '');
});

// ---------------------------------------------------------------------------
// UT-006-5 — CA-4.5 *"Chave invalida e recusada com erro generico"*
//
// entrada:  duas situacoes, nas duas montagens: (a) a conta sem chave pendente
//           nenhuma; (b) a conta com uma chave valida pendente, e uma chave
//           inventada na mao
// acao:     redefinir a senha com uma chave que nunca foi emitida
// esperado: as duas recusam; nenhuma das duas nomeia vencimento — a recusa e a
//           generica, que e a que da a transicao `?action=lostpassword&error=
//           invalidkey` de `SCR-003`; a senha segue intacta nas duas; e a conta
//           que tinha chave pendente **continua** com ela, porque recusar uma
//           chave inventada nao e consumir a pendente
// ---------------------------------------------------------------------------

test('UT-006-5 (CA-4.5) chave invalida e recusada com erro generico', () => {
  // (a) sem chave pendente nenhuma.
  const semChave = montar();

  const relatoSemChave = redefinir(semChave, AGORA, {
    chave: CHAVE_NUNCA_EMITIDA,
  });

  senhaIntacta(semChave);
  assert.equal(semChave.banco.linha(ID_DA_CONTA).chaveDeAtivacao, '');
  assert.doesNotMatch(marcadoresDe(relatoSemChave), NOMEIA_VENCIMENTO);

  // (b) com uma chave valida pendente, mas apresentando outra.
  const comChave = montar();
  pedir(comChave, AGORA);
  const pendente = comChave.banco.linha(ID_DA_CONTA).chaveDeAtivacao;

  const relatoComChave = redefinir(comChave, AGORA + SEGUNDOS_POR_HORA, {
    chave: CHAVE_NUNCA_EMITIDA,
  });

  senhaIntacta(comChave);
  assert.doesNotMatch(marcadoresDe(relatoComChave), NOMEIA_VENCIMENTO);
  assert.equal(
    comChave.banco.linha(ID_DA_CONTA).chaveDeAtivacao,
    pendente,
    'a chave pendente foi mexida por uma tentativa com chave invalida',
  );

  // As duas recusas tem a mesma forma: e isso que "generico" quer dizer, e e o
  // contrario do que a entrada faz — ali a mensagem distingue, de proposito
  // (`ESC-ENUMERACAO`), e aqui ela nao distingue.
  assert.equal(marcadoresDe(relatoSemChave), marcadoresDe(relatoComChave));
});

// ---------------------------------------------------------------------------
// UT-006-6 — a regra `U4` / BR-MIGRAR-024: *"a chave de reset de senha vale 24
// horas e e apagada no primeiro login bem-sucedido"*
//
// E o cenario `@paridade @critico @invariante` de
// `parity_tests/06-autenticacao-e-sessao.feature`, passo por passo:
//
//   Dado uma chave de redefinicao emitida
//   Quando o tempo avanca ate um instante antes do prazo
//   Entao a chave e aceita
//   Quando o tempo avanca alem do prazo
//   Entao a chave e recusada
//   Quando uma entrada bem-sucedida acontece com a chave ainda valida
//   Entao a chave e apagada no mesmo passo
//
// entrada:  a conta `ada` com a senha `segredo`, e uma chave emitida em AGORA
// acao:     as tres do cenario, cada uma na sua montagem
// esperado: o prazo de fabrica e 24 horas — afirmado no ponto de configuracao
//           nomeado, quando ele existe (P6) —, as duas pontas da borda sao as de
//           PT-006, e a entrada bem-sucedida apaga a chave pendente, depois do
//           que o link do e-mail nao funciona mais: *"um link interceptado morre
//           no instante em que o dono entra"* (UC-20)
// ---------------------------------------------------------------------------

test('UT-006-6 (U4 · BR-MIGRAR-024) a chave vale 24 horas, nas duas pontas, e morre no primeiro acesso', () => {
  // O numero, no ponto de configuracao nomeado, quando T009 o publicou. A
  // ausencia do nome nao falha o caso: nenhum documento do pacote nomeia a
  // constante, e o valor e o efeito da borda sao afirmados logo abaixo.
  if (RESOLUCAO.disponivel && RESOLUCAO.prazoDeclarado !== null) {
    assert.equal(
      RESOLUCAO.prazoDeclarado,
      VINTE_E_QUATRO_HORAS,
      'o prazo de fabrica da chave de redefinicao nao e o de BR-MIGRAR-024',
    );
  }

  // Um instante antes do prazo: aceita.
  const dentro = montar();
  const chaveDentro = pedir(dentro, AGORA).chave;

  redefinir(dentro, AGORA + VINTE_E_QUATRO_HORAS - 1, { chave: chaveDentro });

  assert.equal(senhaGravadaAceita(dentro, SENHA_NOVA), true);
  assert.equal(dentro.banco.linha(ID_DA_CONTA).chaveDeAtivacao, '');

  // Alem do prazo: recusa, e nada e gravado.
  const alem = montar();
  const chaveAlem = pedir(alem, AGORA).chave;

  const relato = redefinir(alem, AGORA + VINTE_E_QUATRO_HORAS + 1, {
    chave: chaveAlem,
  });

  senhaIntacta(alem);
  assert.match(marcadoresDe(relato), NOMEIA_VENCIMENTO);

  // A outra metade da regra: a entrada bem-sucedida apaga a chave pendente, e o
  // link do e-mail morre ali. A entrada e a de T003 — a mesma operacao do
  // produto, nao uma imitacao —, porque o que esta regra amarra e justamente a
  // costura entre as duas historias.
  const comEntrada = montar();
  const chaveViva = pedir(comEntrada, AGORA).chave;

  const contextoDeEntrada: ContextoDeAutenticacao = {
    relogio: comEntrada.contexto.relogio,
    contas: comEntrada.contexto.contas,
    sessoes: comEntrada.sessoes,
    verificadorDeSenha: VERIFICADOR_DE_SENHA,
    removerAcentos: comEntrada.contexto.removerAcentos,
    rede: REDE_INATIVA,
    urlDeSenhaPerdida: comEntrada.contexto.urlDeSenhaPerdida,
    urlDoPainel: comEntrada.contexto.urlDoPainel,
  };

  comEntrada.relogioEm(AGORA + SEGUNDOS_POR_HORA);
  const entrada = autenticar(
    { login: LOGIN, senha: SENHA },
    contextoDeEntrada,
  );

  assert.equal(entrada.autenticado, true);
  assert.equal(
    comEntrada.banco.linha(ID_DA_CONTA).chaveDeAtivacao,
    '',
    'a entrada bem-sucedida nao apagou a chave de redefinicao pendente (CA-1.4, U4)',
  );

  // E o link do e-mail, que ainda estava dentro das 24 horas, deixou de valer.
  const depoisDaEntrada = redefinir(comEntrada, AGORA + 2 * SEGUNDOS_POR_HORA, {
    chave: chaveViva,
  });

  senhaIntacta(comEntrada);
  assert.doesNotMatch(marcadoresDe(depoisDaEntrada), NOMEIA_VENCIMENTO);

  // A conta vizinha nao foi tocada por nada disto.
  const vizinhos = montar([
    contaInicial(),
    contaInicial({
      id: ID_DA_OUTRA,
      login: LOGIN_DA_OUTRA,
      email: EMAIL_DA_OUTRA,
      apelido: LOGIN_DA_OUTRA,
      nomeExibido: 'Grace',
    }),
  ]);
  pedir(vizinhos, AGORA);

  assert.equal(vizinhos.banco.linha(ID_DA_OUTRA).chaveDeAtivacao, '');
  assert.deepEqual(
    vizinhos.caixa.mensagens.flatMap((mensagem) => [...mensagem.destinatarios]),
    [EMAIL],
  );
});
