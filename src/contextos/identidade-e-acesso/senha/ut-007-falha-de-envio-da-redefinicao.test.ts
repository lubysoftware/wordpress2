/**
 * A entrega de T012: *"4 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-007-1, UT-007-2, UT-007-3, UT-007-4), com o
 * mesmo dado de entrada, acao e resultado esperado. O teste de regra de negocio
 * (UT-007-4) entra na mesma suite."*
 *
 * US-5 — *"Informar ao titular quando o envio do e-mail de redefinicao falha"*
 * (REQ-007 · UC-20 · `domain.md §2.5` D3). Criterios CA-5.1, CA-5.2 e CA-5.3.
 *
 * ---
 *
 * ⚠️ **`backlog/tests.md` NAO EXISTE nesta arvore, e os quatro casos foram
 * RECONSTRUIDOS, nao copiados.** O caminho que `tasks.md` cita resolve para
 * `backlog/tests.md` na raiz do repositorio, e ali nao ha nada: nem a pasta
 * `backlog/`, nem o arquivo, nem copia em `_discovery/`. `parity_specs.md`
 * descreve o catalogo de fora — *"os **985 testes** de `../backlog/tests.md` sao
 * **especificacao, nao evidencia**"* — e e a unica mencao a ele no pacote
 * entregue. T008 bateu na mesma ausencia e registrou a mesma coisa em
 * `../sessao/ut-003-expiracao-de-sessao.test.ts`; esta suite segue a
 * correspondencia que ela fixou, para as duas serem lidas do mesmo jeito.
 *
 * **Como os quatro foram reconstruidos.** `tasks.md` da duas informacoes
 * aritmeticas: US-5 tem **4** casos e **1** deles e *"teste de regra de negocio
 * (UT-007-4)"*, e US-5 tem **3** criterios de aceite. Sobram 3 casos para 3
 * criterios, na ordem — o mesmo padrao que fecha em US-1 (5 criterios, 8 casos,
 * 2 de regra), US-3 (4 criterios, 5 casos, 1 de regra) e US-4 (5 criterios, 6
 * casos, 1 de regra). A correspondencia adotada:
 *
 * | caso | o que afirma | fonte |
 * |---|---|---|
 * | `UT-007-1` | CA-5.1 — a falha no envio devolve aviso distinto do sucesso | `spec.md`, US-5 |
 * | `UT-007-2` | CA-5.2 — a falha carrega instante, destinatario e motivo do canal | `spec.md`, US-5 |
 * | `UT-007-3` | CA-5.3 — pedir de novo gera chave nova e tentativa nova | `spec.md`, US-5 |
 * | `UT-007-4` | a regra `D3` / BR-MIGRAR-040 **na leitura que vale para ESTE fluxo** | `target_business_rules.md`, UC-20 |
 *
 * **O que isto deixa devendo, declarado para nao ser descoberto depois:** se o
 * catalogo aparecer e um UT-007-* tiver dado de entrada diferente do que esta
 * aqui, o caso de la vale e este arquivo muda. A reconstrucao nao inventa
 * comportamento — cada assercao sai de `spec.md`, de UC-20 ou do legado citado
 * pela tabela de rastreabilidade —, mas ela nao prova que o enunciado e o mesmo.
 *
 * ---
 *
 * ## 🔴 A DISCORDANCIA DO PACOTE QUE ESTA SUITE **NAO** RESOLVE
 *
 * **CA-5.2 pede registro da falha; UC-20 diz que neste fluxo nao existe registro
 * nenhum.** As duas frases estao no pacote entregue, e sao sobre o mesmo fluxo:
 *
 * - `spec.md` CA-5.2: *"A falha fica **registrada** com instante, destinatario e
 *   motivo informado pelo canal de envio"*.
 * - `use-cases/UC-20-recuperar-a-senha-de-acesso.md`, tabela *Excecoes*: *"O
 *   e-mail nao saiu | o assinante **nao tem como saber**: nenhum estado registra
 *   a falha de envio neste fluxo, ao contrario do que acontece na solicitacao de
 *   dados pessoais"*.
 * - e `spec.md`, na propria linha de regra de US-5: *"D3 — falha de envio de
 *   e-mail e estado, nao excecao (o fluxo de privacidade ja faz assim; **este
 *   fluxo nao faz**)"*.
 *
 * O legado confirma UC-20 e confirma CA-5.1 ao mesmo tempo, e e por isso que as
 * duas frases nao sao a mesma discordancia:
 *
 * - `retrieve_password()` (`wp-includes/user.php`, o `wp-login.php:830` da
 *   rastreabilidade) termina em `if ( ! wp_mail(...) ) { $errors->add(
 *   'retrieve_password_email_failure', ... ); return $errors; }`. Logo **o
 *   requisitante SIM e avisado**, com codigo proprio, e o sucesso e o oposto
 *   disso (`return true`, que leva a `wp-login.php?checkemail=confirm`). CA-5.1 e
 *   comportamento do legado, nao melhoria.
 * - e **nada** e persistido por causa da falha: a chave ja foi gravada no passo 2
 *   de UC-20, nenhuma coluna de estado existe para este fluxo, e nao ha linha de
 *   log. O `request-failed` de BR-MIGRAR-040 e do fluxo de **privacidade**
 *   (`wp-admin/includes/privacy-tools.php:226`), e o cenario de paridade dele
 *   esta em `parity_tests/12-solicitacao-de-dado-pessoal.feature`, nao na area
 *   desta feature.
 *
 * **A leitura que esta suite adotou, e por que ela nao e escolher um lado.** As
 * tres frases ficam coerentes se *"registrada"* em CA-5.2 for **registro**, no
 * sentido do slot de observabilidade do plano (*"Registro estruturado em linha
 * JSON"*), e nao **estado de dominio**: e exatamente a distincao que o **P7** da
 * constituicao faz — *"Acrescentar registro e permitido e desejavel; fazer o
 * fluxo depender dele troca o produto"* — e e exatamente a palavra que UC-20
 * nega (*"nenhum **estado** registra"*). Nessa leitura CA-5.2 nao cria estado
 * novo, nao cria consulta nova para o administrador e nao muda o que o
 * requisitante ve. Por isso ela e a unica das duas que passa pelo P1 e pelo P7
 * sem divergencia a autorizar.
 *
 * **O que fica aberto, e nao e desta tarefa decidir:** se CA-5.2 quis dizer
 * estado persistido e consultavel — o `request-failed` do fluxo de privacidade
 * trazido para ca —, isso e divergencia de comportamento observavel e a tabela
 * *Nao negociavel* da constituicao exige decisao humana registrada, citada no
 * codigo que divergir. **Esta suite nao a toma.** UT-007-4 afirma o lado do
 * legado (nenhuma escrita a mais por causa da falha), e se a decisao humana vier
 * no outro sentido e UT-007-4 que muda, num lugar so.
 *
 * ---
 *
 * ## A costura com T011, que NAO esta nesta arvore
 *
 * T012 *"depende de: T011"* e T011 *"depende de: T001, T002, T009"*. Nenhuma das
 * duas esta nesta arvore: o `git log` desta worktree termina no merge de T008, e
 * T009, T011 e T012 sao da **mesma onda**, em worktrees irmas. Logo o nome exato
 * da operacao de pedido e a grafia dos campos do resultado dela sao escolha de
 * T011, feita em paralelo a esta.
 *
 * Duas decisoes saem disso, e as duas estao aqui para quem fizer o merge:
 *
 * 1. **A operacao e resolvida em tempo de execucao, nao importada por caminho.**
 *    T008 importou os arquivos de T007 por caminho e aceitou que *"numa arvore
 *    sem T007 esta suite nao compila"*. Esta suite **nao** faz isso, de
 *    proposito: `npm test` e `npm run build && node --test`, logo um import que
 *    nao resolve derruba o build da arvore inteira e leva consigo as suites de
 *    T001 a T008, que nao tem nada a ver com US-5. A resolucao fica em
 *    `resolverPedidoDeRedefinicao()`, procura nos **dois** lugares que este
 *    modulo publica operacao — o modulo composto de `../index.ts` (*"cada
 *    historia acrescenta aqui a sua operacao"*) e o barril, que reexporta o
 *    arquivo de cada historia — e **falha com mensagem** quando nao acha. Sem
 *    T011 os quatro casos ficam **vermelhos**, com o texto dizendo o que falta;
 *    nenhum deles passa por ausencia, e nenhum e marcado como pulado.
 * 2. **As assercoes sao sobre FATO, nao sobre grafia de campo.** CA-5.2 nomeia
 *    tres fatos — instante, destinatario, motivo —, nao tres nomes de
 *    propriedade, e o pacote nao fixa nome nenhum. Por isso `carrega()` procura
 *    o fato no valor devolvido em vez de comparar com uma chave adivinhada. O
 *    unico texto que esta suite exige **literal** e o que o legado publica:
 *    `retrieve_password_email_failure`, que e codigo de `WP_Error` e portanto
 *    superficie que extensao de terceiro le (P8).
 *
 * **O contexto que `montar()` passa a operacao e um SUPERCONJUNTO**, pelo mesmo
 * motivo: `relogio`, `contas`, `email`, `rede`, o nome do site e as duas URLs,
 * nos nomes em que `autenticacao/contexto-de-autenticacao.ts` ja os tem. Campo
 * sobrando nao atrapalha; campo faltando faria a operacao de T011 quebrar por
 * montagem, nao por regra.
 *
 * ---
 *
 * **O que esta suite NAO cobre, de proposito, porque e de outra tarefa:**
 *
 * - o prazo de 24 horas da chave, o hash dela e a recusa da chave vencida ou
 *   invalida sao CA-4.1 a CA-4.5 (US-4), e os casos delas sao UT-006-1 a
 *   UT-006-6, de T010;
 * - o texto da mensagem que a tela pinta e as 15 mensagens literais de `SCR-003`
 *   sao `parity_tests/screens/02-recuperacao-de-senha-redefinicao.feature`
 *   (PTS-002), e ele esta **bloqueado** por `DEV-002` — golden file ausente,
 *   validacao manual. Afirmar aqui a grafia da frase que o legado mostra seria
 *   duplicar aquela conferencia num lugar que nao tem o oraculo;
 * - limite de tentativa de pedido nao existe: REQ-160 esta em
 *   `do-not-rewrite.md` e o **P6** poe limite de taxa fora do nucleo. Nenhum
 *   caso daqui conta pedidos para recusar o terceiro.
 *
 * O relogio e controlado nos quatro casos, como o **P4** cobra.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import * as barril from '../index.js';
import { REDE_INATIVA } from '../autenticacao/contexto-de-autenticacao.js';
import type { EstadoDaRede } from '../autenticacao/contexto-de-autenticacao.js';
import type { Conta, LeituraDeConta } from '../conta/leitura-de-conta.js';
import type {
  Consulta,
  LinhaDeResultado,
  MensagemDeEmail,
  PortaDeDados,
  PortaDeEmail,
  PortaDeRelogio,
} from '../portas/index.js';

// ===========================================================================
// O dado de entrada dos quatro casos
// ===========================================================================

/**
 * O instante de partida. Fixo e arbitrario, pela mesma razao de T008: o que os
 * casos afirmam e **instante**, e um relogio real tornaria UT-007-2 irrepetivel.
 */
const AGORA = 1_700_000_000;

const ID_DA_CONTA = 7;
const LOGIN = 'ada';
const EMAIL = 'ada@exemplo.invalido';

/**
 * O motivo que o canal informa, e que CA-5.2 manda a falha carregar.
 *
 * E um texto de transporte de proposito: `porta-de-email.ts` declara
 * `motivo: string` justamente porque *"o motivo tem de atravessar a porta"*, e
 * o que atravessa e o que o canal disse, nao uma traducao do dominio.
 */
const MOTIVO_DO_CANAL = 'SMTP connect() failed';

/**
 * O codigo que o legado publica quando o envio falha.
 *
 * `retrieve_password()`: `$errors->add( 'retrieve_password_email_failure', ... )`.
 * E codigo de `WP_Error`, logo e lido por extensao de terceiro e por `wp-login.php`
 * — superficie publicada, que o **P8** nao deixa renomear.
 */
const CODIGO_DE_FALHA_DE_ENVIO = 'retrieve_password_email_failure';

function conta(parcial: Partial<Conta> = {}): Conta {
  return {
    id: ID_DA_CONTA,
    login: LOGIN,
    // Nenhum caso de US-5 e sobre senha: o hash existe porque a linha de
    // `users` tem a coluna, e nada daqui a confere.
    senhaHash: '$wp$2y$10$.............................................',
    email: EMAIL,
    apelido: LOGIN,
    nomeExibido: 'Ada',
    // Nenhuma chave pendente no inicio de cada caso: o DDL usa `default ''` e
    // nao `NULL` (`DB-SENT`).
    chaveDeAtivacao: '',
    ...parcial,
  };
}

// ===========================================================================
// A costura com T011
// ===========================================================================

/**
 * O contexto do pedido, no superconjunto que esta suite passa.
 *
 * Os nomes sao os que `autenticacao/contexto-de-autenticacao.ts` ja usa, porque
 * e a unica convencao que este modulo tem. O que nao esta la — o nome do site e
 * a URL de login — vem dos passos 2 e 3 de UC-20, que montam a mensagem.
 */
interface ContextoDoPedidoDeRedefinicao {
  readonly relogio: PortaDeRelogio;
  readonly contas: ContasDoPedido;
  readonly email: PortaDeEmail;
  readonly rede: EstadoDaRede;
  readonly nomeDoSite: string;
  readonly urlDeLogin: string;
  readonly urlDeSenhaPerdida: string;
}

/**
 * A leitura de conta de T003 mais a gravacao que o passo 2 de UC-20 exige.
 *
 * `LeituraDeConta` sabe apagar a chave de ativacao (CA-1.4) e nao sabe grava-la:
 * gravar e do pedido de redefinicao, que e T009. A gravacao entra aqui para a
 * montagem nao faltar; se T011 gravar pela propria porta de dados, o efeito
 * aparece do mesmo jeito em `escritas`, que e onde UT-007-3 e UT-007-4 olham.
 */
interface ContasDoPedido extends LeituraDeConta {
  gravarChaveDeAtivacao(idDaConta: number, valor: string): void;
}

/** A operacao que T011 entrega, na forma mais fraca que da para chamar. */
type PedidoDeRedefinicao = (
  identificador: string,
  contexto: ContextoDoPedidoDeRedefinicao,
) => unknown;

/**
 * Os nomes em que a operacao e procurada.
 *
 * Os tres vem do pacote, nao de gosto: `plan.md`, tabela *Contratos*, chama a
 * operacao de *"pedir redefinicao de senha"*; UC-20 se chama *"recuperar a senha
 * de acesso"* e o legado se chama `retrieve_password`. **No merge isto colapsa
 * para o nome que T011 escolheu, e a lista deixa de existir.**
 */
const NOMES_DA_OPERACAO = [
  'pedirRedefinicaoDeSenha',
  'solicitarRedefinicaoDeSenha',
  'recuperarSenha',
] as const;

const ONDE_A_OPERACAO_APARECE =
  'no modulo composto de `index.ts` ou no barril do modulo';

/**
 * Resolve a operacao de T011, ou falha dizendo o que falta.
 *
 * Nao lanca `assert` e nao pula: o caso que chama isto tem de ficar **vermelho**
 * numa arvore sem T011, que e o que *"depende de T011"* significa.
 */
function resolverPedidoDeRedefinicao(): PedidoDeRedefinicao {
  const composto = barril.criarModuloDeIdentidadeEAcesso({
    dados: criarBanco([]).porta,
    email: criarCanal().porta,
    relogio: { agoraEmSegundos: () => AGORA },
  });

  const lugares: Record<string, unknown>[] = [
    composto as unknown as Record<string, unknown>,
    barril as unknown as Record<string, unknown>,
  ];

  for (const lugar of lugares) {
    for (const nome of NOMES_DA_OPERACAO) {
      const achada = lugar[nome];
      if (typeof achada === 'function') {
        return achada as PedidoDeRedefinicao;
      }
    }
  }

  throw new Error(
    `US-5 (T012) nao encontrou a operacao de pedido de redefinicao de senha ${ONDE_A_OPERACAO_APARECE}. ` +
      `Procurou por ${NOMES_DA_OPERACAO.join(', ')}. ` +
      'Ela e a entrega de T011 (US-5), que depende de T009 (US-4), e nenhuma das duas esta nesta arvore. ' +
      'Quem fizer o merge: aponte NOMES_DA_OPERACAO para o nome que T011 escolheu e, se o contexto dela ' +
      'tiver outros nomes de campo, ajuste ContextoDoPedidoDeRedefinicao em um lugar so.',
  );
}

// ===========================================================================
// A montagem: as tres portas, de mentira, e nada mais
// ===========================================================================

interface BancoDeTeste {
  readonly porta: PortaDeDados;
  /** Toda leitura pedida, na ordem. */
  readonly selecoes: Consulta[];
  /** Toda escrita pedida, na ordem. Lista vazia e afirmacao, nao ausencia. */
  readonly escritas: Consulta[];
}

/** A linha de `users`, com os nomes de coluna que o legado tem. */
function linhaDaConta(c: Conta): LinhaDeResultado {
  return {
    ID: c.id,
    user_login: c.login,
    user_pass: c.senhaHash,
    user_email: c.email,
    user_nicename: c.apelido,
    user_activation_key: c.chaveDeAtivacao,
    display_name: c.nomeExibido,
  };
}

/**
 * Porta de dados que responde a leitura de conta e registra toda escrita.
 *
 * Nao e `criarPortaDeDadosFalsa` de `armazenamento/porta-falsa.ts` por um motivo
 * so: aquela devolve resposta **programada e consumida uma por uma**, e esta
 * suite nao sabe quantas leituras a operacao de T011 faz. Aqui a leitura de
 * `users` e respondida por **comparacao de parametro**, logo a contagem de
 * leituras e livre e o que continua afirmado e a escrita, que e o criterio de
 * paridade desta area (*"efeito no banco"*, Decisao 2 de `parity_specs.md`).
 */
function criarBanco(contas: readonly Conta[]): BancoDeTeste {
  const selecoes: Consulta[] = [];
  const escritas: Consulta[] = [];

  return {
    porta: {
      prefixoDeTabela: 'wp_',
      prefixoBaseDeTabela: 'wp_',
      selecionar(consulta) {
        selecoes.push(consulta);
        const procurado = consulta.parametros[0];
        if (typeof procurado !== 'string') {
          return [];
        }
        const achada = contas.find(
          (c) => c.login === procurado || c.email === procurado,
        );
        return achada === undefined ? [] : [linhaDaConta(achada)];
      },
      escrever(consulta) {
        escritas.push(consulta);
        return { linhasAfetadas: 1, idGerado: null };
      },
    },
    selecoes,
    escritas,
  };
}

interface CanalDeTeste {
  readonly porta: PortaDeEmail;
  /** Toda mensagem entregue a porta, na ordem — inclusive as que falharam. */
  readonly mensagens: MensagemDeEmail[];
  /** Passa a falhar com este motivo. `null` volta a funcionar. */
  falharCom(motivo: string | null): void;
}

/**
 * Porta de e-mail que registra a tentativa e falha quando mandado.
 *
 * **Registra antes de decidir**, de proposito: UT-007-4 afirma que a falha nao
 * vira retry, e para isso a tentativa que falhou tem de ser contada.
 */
function criarCanal(): CanalDeTeste {
  const mensagens: MensagemDeEmail[] = [];
  let motivo: string | null = null;

  return {
    porta: {
      enviar(mensagem) {
        mensagens.push(mensagem);
        return motivo === null
          ? { enviado: true }
          : { enviado: false, motivo };
      },
    },
    mensagens,
    falharCom(novo) {
      motivo = novo;
    },
  };
}

interface Montagem {
  /** Pede a redefinicao pelo identificador, e devolve o que a operacao devolveu. */
  readonly pedir: (identificador?: string) => unknown;
  readonly banco: BancoDeTeste;
  readonly canal: CanalDeTeste;
  /** Move o relogio para um instante absoluto. */
  readonly relogioEm: (instante: number) => void;
}

function montar(contas: readonly Conta[] = [conta()]): Montagem {
  let agora = AGORA;
  const banco = criarBanco(contas);
  const canal = criarCanal();
  const operacao = resolverPedidoDeRedefinicao();

  const guardadas = new Map<number, string>();

  const contasDoPedido: ContasDoPedido = {
    porLogin(login) {
      return contas.find((c) => c.login === login) ?? null;
    },
    porEmail(email) {
      return contas.find((c) => c.email === email) ?? null;
    },
    apagarChaveDeAtivacao(idDaConta) {
      guardadas.delete(idDaConta);
      banco.porta.escrever({
        texto: 'UPDATE wp_users SET user_activation_key = ? WHERE ID = ?',
        parametros: ['', idDaConta],
      });
    },
    gravarChaveDeAtivacao(idDaConta, valor) {
      guardadas.set(idDaConta, valor);
      banco.porta.escrever({
        texto: 'UPDATE wp_users SET user_activation_key = ? WHERE ID = ?',
        parametros: [valor, idDaConta],
      });
    },
  };

  const contexto: ContextoDoPedidoDeRedefinicao = {
    relogio: { agoraEmSegundos: () => agora },
    contas: contasDoPedido,
    email: canal.porta,
    rede: REDE_INATIVA,
    nomeDoSite: 'Sitio de teste',
    urlDeLogin: 'https://exemplo.invalido/wp-login.php',
    urlDeSenhaPerdida:
      'https://exemplo.invalido/wp-login.php?action=lostpassword',
  };

  return {
    pedir: (identificador = LOGIN) => operacao(identificador, contexto),
    banco,
    canal,
    relogioEm: (instante) => {
      agora = instante;
    },
  };
}

// ===========================================================================
// Ler FATO, e nao grafia de campo
// ===========================================================================

/**
 * Os valores primitivos que o resultado carrega, ate um nivel de aninhamento.
 *
 * Um nivel, e nao recursao total, porque e ate onde a forma declarada de
 * `ResultadoDeEnvio` chega e porque recursao total acharia fato dentro de
 * qualquer coisa que a operacao resolvesse carregar por acaso.
 */
function fatosDe(valor: unknown): string[] {
  const colhidos: string[] = [];

  function primitivo(v: unknown): void {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      colhidos.push(String(v));
    }
  }

  primitivo(valor);
  if (typeof valor === 'object' && valor !== null) {
    for (const nivel1 of Object.values(valor as Record<string, unknown>)) {
      primitivo(nivel1);
      if (typeof nivel1 === 'object' && nivel1 !== null) {
        for (const nivel2 of Object.values(nivel1 as Record<string, unknown>)) {
          primitivo(nivel2);
        }
      }
    }
  }

  return colhidos;
}

/**
 * O resultado carrega este fato, em algum campo, com algum nome.
 *
 * Igualdade **ou** continencia: o destinatario pode viajar sozinho num campo e o
 * motivo pode vir dentro de um texto maior. A continencia e o que torna a
 * assercao sobre o fato, que e o que CA-5.2 nomeia, e nao sobre a grafia do
 * campo, que o pacote nao fixa.
 */
function carrega(resultado: unknown, fato: string): boolean {
  return fatosDe(resultado).some(
    (achado) => achado === fato || achado.includes(fato),
  );
}

/**
 * As formas em que o instante de `AGORA` pode estar escrito.
 *
 * `porta-de-relogio.ts` fixa **segundo inteiro em UTC**, que e a unidade de
 * `time()`, e e a primeira da lista. As outras duas existem porque o slot de
 * observabilidade do plano e *"registro estruturado em linha JSON"*, onde
 * instante costuma sair em milissegundo ou em ISO-8601 — e o fato que CA-5.2
 * pede e o instante, nao a unidade dele.
 */
function formasDoInstante(segundos: number): string[] {
  return [
    String(segundos),
    String(segundos * 1000),
    new Date(segundos * 1000).toISOString(),
  ];
}

function carregaOInstante(resultado: unknown, segundos: number): boolean {
  return formasDoInstante(segundos).some((forma) => carrega(resultado, forma));
}

/** A chave em claro que o link da mensagem leva, quando da para extrai-la. */
function chaveDoCorpo(mensagem: MensagemDeEmail): string | null {
  const achada = /[?&]key=([A-Za-z0-9]+)/.exec(mensagem.corpo);
  return achada?.[1] ?? null;
}

/** O texto de cada escrita, que e o que afirma QUAL comando saiu. */
function textosDasEscritas(banco: BancoDeTeste): string[] {
  return banco.escritas.map((e) => e.texto);
}

// ---------------------------------------------------------------------------
// UT-007-1 — CA-5.1 *"Falha no envio devolve ao requisitante um aviso distinto
// do caso de sucesso"*
//
// entrada:  a conta `ada`, com o canal de envio FALHANDO com o motivo
//           `SMTP connect() failed`, e o relogio em AGORA
// acao:     pedir a redefinicao pelo login
// esperado: a porta de e-mail foi chamada (a tentativa aconteceu); o valor
//           devolvido NAO e o valor do caminho de sucesso; e ele carrega o
//           codigo que o legado publica, `retrieve_password_email_failure`
//
// Por que o codigo literal e a parte forte da assercao: `retrieve_password()`
// devolve `true` no sucesso e um `WP_Error` com ESSE codigo na falha. O codigo e
// lido por `wp-login.php` e por extensao de terceiro, logo e superficie
// publicada (P8) — e e a unica coisa desta area que o pacote fixa ao pe da
// letra. A GRAFIA DA FRASE que a tela mostra nao e afirmada aqui: ela e das 15
// mensagens literais de `SCR-003`, em PTS-002, que esta bloqueado por `DEV-002`.
// ---------------------------------------------------------------------------

test('UT-007-1 a falha no envio devolve aviso distinto do sucesso (CA-5.1)', () => {
  // O caminho de sucesso, no mesmo arnes: e dele que a falha tem de ser
  // distinta, e compara-la com um valor escrito a mao aqui seria comparar com
  // uma invencao desta suite.
  const comEnvioBom = montar();
  const sucesso = comEnvioBom.pedir();

  const comEnvioRuim = montar();
  comEnvioRuim.canal.falharCom(MOTIVO_DO_CANAL);
  const falha = comEnvioRuim.pedir();

  // A tentativa aconteceu: sem ela nao ha falha de envio, ha outra coisa.
  assert.equal(
    comEnvioRuim.canal.mensagens.length,
    1,
    'o pedido tem de tentar enviar uma vez',
  );

  // CA-5.1: o aviso e distinto do caso de sucesso.
  assert.notDeepEqual(
    falha,
    sucesso,
    `a falha de envio devolveu o mesmo valor do sucesso: ${JSON.stringify(falha)}`,
  );

  // E e distinto PELO CODIGO do legado, nao por um detalhe qualquer.
  assert.ok(
    carrega(falha, CODIGO_DE_FALHA_DE_ENVIO),
    `o resultado da falha nao carrega o codigo ${CODIGO_DE_FALHA_DE_ENVIO} ` +
      `publicado por retrieve_password(): ${JSON.stringify(falha)}`,
  );

  // O sucesso nao carrega o codigo de falha: se carregasse, "distinto" seria
  // acidente de serializacao.
  assert.ok(
    !carrega(sucesso, CODIGO_DE_FALHA_DE_ENVIO),
    `o resultado do sucesso carrega o codigo de falha: ${JSON.stringify(sucesso)}`,
  );
});

// ---------------------------------------------------------------------------
// UT-007-2 — CA-5.2 *"A falha fica registrada com instante, destinatario e
// motivo informado pelo canal de envio"*
//
// entrada:  a mesma conta, o canal FALHANDO com `SMTP connect() failed`, e o
//           relogio movido para um instante distinto do de partida
// acao:     pedir a redefinicao pelo login
// esperado: o registro da falha carrega os TRES fatos — o instante do relogio
//           controlado, o e-mail da conta como destinatario, e o motivo do canal
//           byte a byte como o canal o informou
//
// ⚠️ Este caso e o que toca a discordancia do cabecalho. Ele afirma **os tres
// fatos**, que e o que CA-5.2 nomeia, e NAO afirma que eles viraram estado
// consultavel — UC-20 diz que *"nenhum estado registra a falha de envio neste
// fluxo"*, e UT-007-4 afirma esse lado. Se a decisao humana disser que CA-5.2
// quis dizer estado persistido, e UT-007-4 que muda, nao este.
// ---------------------------------------------------------------------------

test('UT-007-2 a falha registra instante, destinatario e motivo do canal (CA-5.2)', () => {
  const montagem = montar();
  const instanteDaFalha = AGORA + 4 * 60 * 60;
  montagem.relogioEm(instanteDaFalha);
  montagem.canal.falharCom(MOTIVO_DO_CANAL);

  const falha = montagem.pedir();

  // Fato 1 — o instante. Vem do relogio controlado (P4), e nao do relogio do
  // sistema: um instante lido de `Date.now()` passaria este caso por acidente.
  assert.ok(
    carregaOInstante(falha, instanteDaFalha),
    `o registro da falha nao carrega o instante ${instanteDaFalha} em nenhuma das formas ` +
      `${formasDoInstante(instanteDaFalha).join(' | ')}: ${JSON.stringify(falha)}`,
  );

  // E e o instante do relogio, nao o de partida da montagem.
  assert.ok(
    !carregaOInstante(falha, AGORA),
    'o registro da falha carrega o instante de partida da montagem em vez do instante do pedido: ' +
      JSON.stringify(falha),
  );

  // Fato 2 — o destinatario. E o e-mail DA CONTA, nao o identificador que o
  // requisitante digitou: o pedido foi feito pelo login, e UC-20 passo 3 envia
  // *"ao e-mail da conta"*.
  assert.ok(
    carrega(falha, EMAIL),
    `o registro da falha nao carrega o destinatario ${EMAIL}: ${JSON.stringify(falha)}`,
  );

  // E o destinatario e o mesmo a quem a porta de e-mail foi mandada enviar.
  assert.deepEqual(montagem.canal.mensagens[0]?.destinatarios, [EMAIL]);

  // Fato 3 — o motivo, como o canal o informou. `porta-de-email.ts` existe com
  // `motivo: string` para isso: *"o motivo tem de atravessar a porta"*.
  assert.ok(
    carrega(falha, MOTIVO_DO_CANAL),
    `o registro da falha nao carrega o motivo informado pelo canal ` +
      `(${MOTIVO_DO_CANAL}): ${JSON.stringify(falha)}`,
  );
});

// ---------------------------------------------------------------------------
// UT-007-3 — CA-5.3 *"Pedir de novo apos a falha gera uma chave nova e uma
// tentativa nova de envio"*
//
// entrada:  a mesma conta; primeiro pedido com o canal FALHANDO, segundo pedido
//           com o canal funcionando, com o relogio andando entre os dois
// acao:     pedir a redefinicao duas vezes, pelo mesmo login
// esperado: duas tentativas de envio, para o mesmo destinatario; a chave do
//           segundo pedido e diferente da do primeiro; a chave nova foi gravada
//           (o pedido antigo nao continua valendo ao lado do novo); e o segundo
//           resultado e o de sucesso, nao o de falha
//
// Por que a chave e lida do CORPO DA MENSAGEM: CA-4.1 fixa que *"o valor em claro
// so existe no e-mail enviado"* — na conta ela vive com hash. Logo a mensagem e o
// unico lugar onde duas chaves podem ser comparadas, e o fluxo alternativo de
// UC-20 (*"Pedido repetido antes do prazo"*) e sobre exatamente isso: *"uma chave
// nova e gerada e substitui a anterior; o link antigo deixa de valer"*.
// ---------------------------------------------------------------------------

test('UT-007-3 pedir de novo apos a falha gera chave nova e tentativa nova (CA-5.3)', () => {
  const montagem = montar();

  // Primeiro pedido: o canal falha.
  montagem.canal.falharCom(MOTIVO_DO_CANAL);
  const primeiro = montagem.pedir();
  assert.ok(
    carrega(primeiro, CODIGO_DE_FALHA_DE_ENVIO),
    'o primeiro pedido tinha de falhar no envio para este caso fazer sentido',
  );

  const escritasDoPrimeiro = textosDasEscritas(montagem.banco).length;

  // Segundo pedido, com o canal funcionando e o relogio adiante.
  montagem.relogioEm(AGORA + 60);
  montagem.canal.falharCom(null);
  const segundo = montagem.pedir();

  // Tentativa nova: sao duas, nao uma reaproveitada.
  assert.equal(
    montagem.canal.mensagens.length,
    2,
    'o segundo pedido tem de produzir uma tentativa nova de envio',
  );
  const [uma, outra] = montagem.canal.mensagens;
  assert.notEqual(uma, undefined);
  assert.notEqual(outra, undefined);
  if (uma === undefined || outra === undefined) return;

  // Mesmo destinatario nas duas: o que mudou foi a chave, nao a conta.
  assert.deepEqual(uma.destinatarios, [EMAIL]);
  assert.deepEqual(outra.destinatarios, [EMAIL]);

  // Chave nova: as duas mensagens nao levam o mesmo link.
  assert.notEqual(
    uma.corpo,
    outra.corpo,
    'as duas mensagens levam o mesmo corpo, logo o segundo pedido nao gerou chave nova',
  );

  // E, quando a chave da para ser extraida do link, as duas sao diferentes —
  // que e a forma afiada da mesma afirmacao.
  const chave1 = chaveDoCorpo(uma);
  const chave2 = chaveDoCorpo(outra);
  if (chave1 !== null && chave2 !== null) {
    assert.notEqual(
      chave1,
      chave2,
      'o link do segundo pedido leva a MESMA chave do primeiro',
    );
  }

  // A chave nova foi GRAVADA: o criterio de paridade desta area e efeito no
  // banco, e sem gravacao o link novo nao valeria.
  assert.ok(
    textosDasEscritas(montagem.banco).length > escritasDoPrimeiro,
    'o segundo pedido nao gravou nada, logo a chave nova nao substituiu a anterior',
  );

  // E o segundo resultado e o do sucesso, nao o da falha.
  assert.ok(
    !carrega(segundo, CODIGO_DE_FALHA_DE_ENVIO),
    `o segundo pedido, com o canal funcionando, devolveu falha de envio: ${JSON.stringify(segundo)}`,
  );
  assert.notDeepEqual(segundo, primeiro);
});

// ---------------------------------------------------------------------------
// UT-007-4 — a regra de negocio: `D3` / BR-MIGRAR-040, **na leitura que vale
// para este fluxo**
//
// `spec.md` poe `D3` em US-5 e qualifica na mesma linha: *"falha de envio de
// e-mail e estado, nao excecao (o fluxo de privacidade ja faz assim; **este
// fluxo nao faz**)"*. Logo a regra, aqui, tem tres partes, e as tres sao
// afirmaveis:
//
// 1. **nao e excecao** — a falha volta como valor, e o fluxo nao e interrompido
//    (`AD-06`, `target_architecture.md`; `paradigm_decision.md` implicacao 4);
// 2. **nao e retry** — *"nao ha broker, DLQ nem retry generico"* (`AD-06`): uma
//    tentativa por pedido, nem duas;
// 3. **nao e estado, NESTE fluxo** — UC-20: *"nenhum estado registra a falha de
//    envio neste fluxo"*. O `request-failed` de BR-MIGRAR-040 e do fluxo de
//    privacidade, e o cenario dele e de
//    `parity_tests/12-solicitacao-de-dado-pessoal.feature`.
//
// entrada:  duas montagens iguais, com a mesma conta e o relogio no mesmo
//           instante: numa o canal falha, na outra funciona
// acao:     pedir a redefinicao uma vez em cada
// esperado: nenhuma das duas lanca; uma tentativa de envio em cada; e a
//           SEQUENCIA DE COMANDOS que chega ao banco e a MESMA nas duas — a
//           falha nao acrescenta escrita nenhuma
//
// A comparacao e por TEXTO de cada escrita, e nao por parametro, porque a chave
// gravada e aleatoria por construcao: o que se afirma e *qual comando saiu*, que
// e o criterio *"efeito no banco"* da Decisao 2 de `parity_specs.md`.
// ---------------------------------------------------------------------------

test('UT-007-4 a falha de envio e valor, nao excecao, nao vira retry e nao cria estado neste fluxo (D3 / BR-MIGRAR-040)', () => {
  const comFalha = montar();
  comFalha.canal.falharCom(MOTIVO_DO_CANAL);

  const comSucesso = montar();

  // Parte 1 — nao e excecao. O fluxo chega ao fim e devolve valor.
  let falha: unknown;
  assert.doesNotThrow(() => {
    falha = comFalha.pedir();
  }, 'a falha de envio lancou excecao: D3 a poe como valor devolvido, e AD-06 recusa transformar isso em fluxo de erro');
  assert.notEqual(
    falha,
    undefined,
    'o pedido com o canal falhando nao devolveu valor nenhum',
  );

  const sucesso = comSucesso.pedir();

  // Parte 2 — nao e retry. Uma tentativa por pedido, nos dois caminhos.
  assert.equal(
    comFalha.canal.mensagens.length,
    1,
    'o pedido tentou enviar mais de uma vez: AD-06 recusa retry de infraestrutura, ' +
      'e a politica de nova tentativa do legado e pedir de novo (CA-5.3)',
  );
  assert.equal(comSucesso.canal.mensagens.length, 1);

  // Parte 3 — nao e estado. A falha nao acrescenta nem muda comando nenhum: a
  // unica escrita do fluxo e a chave do passo 2 de UC-20, que acontece ANTES do
  // envio e portanto acontece igual nos dois caminhos.
  assert.deepEqual(
    textosDasEscritas(comFalha.banco),
    textosDasEscritas(comSucesso.banco),
    'o caminho da falha emitiu comando que o caminho do sucesso nao emite. ' +
      'UC-20 e literal: "nenhum estado registra a falha de envio neste fluxo, ao contrario do que ' +
      'acontece na solicitacao de dados pessoais". Levar este fluxo a um estado de falha persistido e ' +
      'divergencia de comportamento observavel e exige decisao humana registrada (P1) — ver o cabecalho ' +
      'desta suite.',
  );

  // E a chave que o passo 2 gravou continua gravada depois da falha: o legado
  // nao a desfaz, e e por isso que o fluxo alternativo de UC-20 fala em
  // SUBSTITUIR a chave anterior em vez de criar a primeira.
  assert.ok(
    textosDasEscritas(comFalha.banco).length > 0,
    'o pedido nao gravou chave nenhuma, logo nao ha o que a falha pudesse desfazer',
  );

  // Por fim, o que a Parte 1 nao diria sozinha: o valor devolvido na falha e
  // reportavel, e nao um sucesso silencioso.
  assert.ok(carrega(falha, CODIGO_DE_FALHA_DE_ENVIO));
  assert.notDeepEqual(falha, sucesso);
});
