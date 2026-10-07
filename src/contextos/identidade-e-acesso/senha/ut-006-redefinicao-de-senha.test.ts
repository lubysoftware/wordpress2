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
 * | `UT-006-2` | CA-4.2 — chave com mais de 24 horas e recusada com aviso de prazo vencido e oferta de pedir outra | `spec.md`, US-4 · `PT-006` |
 * | `UT-006-3` | CA-4.3 — um pedido novo antes do prazo substitui a chave anterior, que deixa de valer | `spec.md`, US-4 · UC-20, *Pedido repetido antes do prazo* |
 * | `UT-006-4` | CA-4.4 — gravar a senha nova invalida a chave usada | `spec.md`, US-4 · UC-20 passo 6 e pos-condicoes |
 * | `UT-006-5` | CA-4.5 — chave invalida e recusada com erro generico | `spec.md`, US-4 · `SCR-003`, transicao `error=invalidkey` |
 * | `UT-006-6` | a regra `U4` / BR-MIGRAR-024 — 24 horas, com as duas pontas, e a chave apagada no primeiro acesso bem-sucedido | `target_business_rules.md` · `PT-006` |
 *
 * ---
 *
 * ## Como esta suite chama US-4
 *
 * Pelo contrato que **T009 entregou**, importado estaticamente. As duas
 * operacoes sao `solicitarRedefinicaoDeSenha` (passos 1 a 3 de UC-20) e
 * `redefinirSenha` (passos 4 a 7), cada uma com o contexto proprio dela —
 * `ContextoDoPedidoDeRedefinicao` e `ContextoDaRedefinicaoDeSenha`. As quatro
 * operacoes de dados chegam pela reducao `ContasParaRedefinicao`, e a geracao da
 * chave (`gerador`), o resumo dela (`hashDaChave`) e a montagem do e-mail
 * (`montagemDoEmail`) chegam por argumento porque o pacote **nao registra** nem
 * o alfabeto da chave, nem o algoritmo do resumo, nem um literal do e-mail — ver
 * os cabecalhos de `../redefinicao-de-senha/chave-de-redefinicao.ts` e de
 * `../redefinicao-de-senha/contexto-de-redefinicao.ts`.
 *
 * **O que os casos leem do resultado e o codigo do erro, nao vocabulario.**
 * `invalid_key` e `expired_key` levam a telas diferentes
 * (`DESTINO_POR_CODIGO_DE_CHAVE`), e e **so** por ele que o legado as distingue
 * (`$user->get_error_code() === 'expired_key'`). E e por isso que "generico"
 * (CA-4.5) e afirmavel pelo avesso: as recusas genericas tem de ser **iguais
 * entre si**.
 *
 * ---
 *
 * ## Duas coisas desta tarefa que ninguem resolveu, e que esta suite nao resolve
 *
 * **1. ⚠️ `backlog/tests.md` nao existe nesta arvore.** `tasks.md` manda escrever
 * os seis testes *"com o mesmo dado de entrada, acao e resultado esperado"* do
 * caso registrado em `../../../backlog/tests.md`, e esse arquivo **nao veio no
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
 * **2. ⚠️ O instante exato da borda das 24 horas nao esta fixado no pacote, e
 * esta suite nao o escolhe.** `PT-006` cobra as duas pontas sem nomear o meio —
 * *"o tempo avanca ate um instante antes do prazo → a chave e aceita"* e *"o
 * tempo avanca alem do prazo → a chave e recusada"* —, e nenhum documento diz o
 * que acontece no instante **exatamente** igual a emissao mais 24 horas. Os
 * casos afirmam `emissao + 24 h − 1` aceita e `emissao + 24 h + 1` recusa, que e
 * o que o pacote fixa, e **nao** afirmam o instante do meio.
 * `chave-de-redefinicao.ts` registra pelo lado da implementacao que o ramo
 * escrito e o estrito e que a borda da sessao compara pelo outro lado; o
 * desempate fecha contra o oraculo de `ESC-ORACULO` (BR-MIGRAR-116), que nesta
 * arvore nao existe, e **nao** e decisao de quem escreve teste.
 *
 * ---
 *
 * ## O que esta suite nao afirma, de proposito
 *
 * - **A tela, as transicoes e a borda HTTP.** `SCR-002` e `SCR-003` tem os
 *   literais e as transicoes `?action=lostpassword&error=expiredkey` e
 *   `&error=invalidkey`, e montar a URL absoluta e da borda. O que os casos
 *   cobram do dominio e o codigo e a mensagem que a borda recebe.
 * - **O comprimento e o alfabeto da chave.** Nenhum documento do pacote os
 *   registra, e o P6 recusa numero que o legado nao tem. A chave desta suite vem
 *   do gerador injetado, com valor conhecido, e nenhum caso afirma tamanho.
 * - **Os bytes do resumo da chave e do *hash* da senha.** O pacote fixa que a
 *   chave e *"guardada com hash"* (UC-20) e que a coluna guarda *"o instante
 *   prefixado"* (`plan.md`, Modelo de dados), e e so isso que os casos cobram;
 *   os bytes fecham contra o oraculo.
 * - **As duas recusas de senha.** "So espaco" e "senhas diferentes" sao do fluxo
 *   de gravacao e estao afirmadas na suite de T009; nenhum dos seis casos daqui
 *   e sobre elas, e por isso todos enviam `pass2` igual a `pass1`.
 * - **A falha de envio de e-mail.** E US-5 (CA-5.1 a CA-5.3), tarefas T011 e
 *   T012. A caixa de saida desta suite sempre aceita: um caso de falha aqui
 *   invadiria a historia seguinte.
 * - **O limite de tentativa de chave.** O legado nao tem nenhum
 *   (BR-MIGRAR-112: *"nenhuma superficie de entrada tem limite de taxa"*), e
 *   inventa-lo cai em *Nao negociavel* da constituicao.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import type { MensagemDeEmail, PortaDeEmail } from '../portas/index.js';
import type {
  Conta as ContaDaLeitura,
  LeituraDeConta,
} from '../conta/leitura-de-conta.js';
import {
  REDE_INATIVA,
  type ContextoDeAutenticacao,
} from '../autenticacao/contexto-de-autenticacao.js';
import { autenticar } from '../autenticacao/autenticar.js';
import { SEGUNDOS_POR_HORA } from '../autenticacao/prazos-de-sessao.js';
import {
  criarVerificadorDeSenhaDoNucleo,
  type VerificadorDeSenha,
} from '../autenticacao/verificacao-de-senha.js';
import {
  abrirSessao,
  type ArmazenamentoDeSessoes,
  type MapaDeSessoes,
} from '../sessao/registro-de-sessoes.js';
import {
  lerChaveGravada,
  PRAZO_DA_CHAVE_DE_REDEFINICAO_DE_FABRICA,
  SEPARADOR_DO_INSTANTE,
  type GeradorDeChaveDeRedefinicao,
  type HashDeChaveDeRedefinicao,
} from '../redefinicao-de-senha/chave-de-redefinicao.js';
import type { ContasParaRedefinicao } from '../redefinicao-de-senha/contas-para-redefinicao.js';
import type {
  ContextoDaRedefinicaoDeSenha,
  ContextoDoPedidoDeRedefinicao,
  MontagemDoEmailDeRedefinicao,
} from '../redefinicao-de-senha/contexto-de-redefinicao.js';
import {
  DESTINO_POR_CODIGO_DE_CHAVE,
  MENSAGENS_DA_TELA_DE_PEDIDO,
  MENSAGENS_DA_TELA_DE_REDEFINICAO,
  primeiroCodigoDeErroDeRedefinicao,
  type ErroDeRedefinicao,
} from '../redefinicao-de-senha/erro-de-redefinicao.js';
import { criarGeracaoDeHashDeSenhaDoNucleo } from '../redefinicao-de-senha/geracao-de-hash-de-senha.js';
import {
  solicitarRedefinicaoDeSenha,
  type ResultadoDoPedidoDeRedefinicao,
} from '../redefinicao-de-senha/pedido-de-redefinicao.js';
import {
  redefinirSenha,
  type ResultadoDaRedefinicao,
} from '../redefinicao-de-senha/redefinir-senha.js';

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

/*
  ── AS DUAS PRIMITIVAS DE RESUMO, E POR QUE ELAS RESUMEM DE VERDADE ─────────

  As duas sao borda — `chave-de-redefinicao.ts` poe o resumo da chave entre os 42
  pontos de substituicao de BR-MIGRAR-103, e `plan.md` poe o bcrypt em
  `adaptadores/` por AD-04 —, e o pacote **nao nomeia o algoritmo de nenhuma das
  duas**. O que esta suite monta e a **propriedade** de que os casos dependem, e
  nao os bytes: um resumo que nao devolve a entrada, e que confere so contra ela.

  Por isso o resumo da chave **resume de verdade**: um simulado que devolvesse a
  chave decorada passaria no teste de formato e esconderia justamente o que
  CA-4.1 cobra.
*/

/**
 * O resumo da chave.
 *
 * Sem o separador do instante no resultado, de proposito: o separador e `:`, e um
 * resumo que o contivesse seria lido por `lerChaveGravada` como se trouxesse
 * instante prefixado.
 */
function resumoDe(chave: string): string {
  return `resumo-${createHash('sha256').update(chave, 'utf8').digest('hex')}`;
}

const HASH_DA_CHAVE: HashDeChaveDeRedefinicao = {
  gerar(chave) {
    return resumoDe(chave);
  },
  conferir(chave, resumo) {
    return resumo === resumoDe(chave);
  },
};

/** O bcrypt desta suite, nas duas pontas: gravar e conferir. */
const BCRYPT_DE_TESTE = {
  gerar(senhaPreProcessada: string): string {
    return `bcrypt(${senhaPreProcessada})`;
  },
  verificar(senhaPreProcessada: string, hash: string): boolean {
    return hash === `bcrypt(${senhaPreProcessada})`;
  },
};

/** A gravacao do *hash* de senha, montada sobre a primitiva acima. */
const HASH_DE_SENHA = criarGeracaoDeHashDeSenhaDoNucleo(BCRYPT_DE_TESTE);

/**
 * O verificador de T003, e **nao** uma comparacao desta suite.
 *
 * O que os casos afirmam e que a senha gravada por US-4 autentica pela mesma
 * operacao que o produto usa para entrar: o risco 3 de `plan.md` avisa que um
 * byte diferente no *hash* e *"o tipo de detalhe que um porte perde sem o teste
 * notar, porque o login continua funcionando"*, e comparar texto com texto aqui
 * nao notaria.
 */
const VERIFICADOR_DE_SENHA: VerificadorDeSenha = criarVerificadorDeSenhaDoNucleo(
  { bcrypt: BCRYPT_DE_TESTE },
);

/*
  ── A CONTA EM MEMORIA, ATRAS DOS DOIS CONTRATOS QUE OS CASOS USAM ──────────

  `ContasParaRedefinicao` e a reducao de T009 — as quatro operacoes de dados de
  US-4 — e `LeituraDeConta` e a de T003, que `UT-006-6` precisa porque metade da
  regra `U4` e a entrada apagando a chave pendente. Nenhum nome colide, e a linha
  por tras e **uma**: o efeito e o mesmo por onde cada fluxo escreva.

  Uma linha em memoria, e nao a porta falsa de T002, porque os seis casos sao
  percursos de varios passos — pedir, redefinir, reusar, entrar — e o que eles
  afirmam e o **estado que sobrou** a cada passo. Qual comando SQL sai de cada
  escrita e afirmado pela suite de T009, contra `criarPortaDeDadosFalsa`; aqui se
  afirma o efeito, que e a outra metade do criterio *"efeito no banco"* (Decisao
  2 de `parity_specs.md`).
*/

/** A linha de `users` nas colunas que os dois contratos leem. */
type LinhaDeConta = ContaDaLeitura;

/** Os dois contratos sobre a mesma linha. */
type ContasDeUS4 = LeituraDeConta & ContasParaRedefinicao;

interface BancoDeContas {
  readonly contas: ContasDeUS4;
  /** A linha gravada, que e onde cada caso le o efeito. */
  linha(id: number): LinhaDeConta;
  /** Toda escrita de conta, na ordem: e por aqui que se ve o que saiu. */
  readonly escritas: readonly {
    readonly id: number;
    readonly campos: Readonly<Partial<LinhaDeConta>>;
  }[];
}

function contaInicial(parcial: Partial<LinhaDeConta> = {}): LinhaDeConta {
  return {
    id: ID_DA_CONTA,
    login: LOGIN,
    senhaHash: HASH_DE_SENHA.gerar(SENHA),
    email: EMAIL,
    apelido: LOGIN,
    nomeExibido: 'Ada',
    // Sem chave pendente: o DDL e `NOT NULL default ''`, e `DB-SENT` registra
    // que o esquema evita `NULL` e usa sentinela.
    chaveDeAtivacao: '',
    ...parcial,
  };
}

function bancoDeContas(iniciais: readonly LinhaDeConta[]): BancoDeContas {
  const linhas = new Map<number, LinhaDeConta>(
    iniciais.map((linha) => [linha.id, linha]),
  );
  const escritas: {
    readonly id: number;
    readonly campos: Readonly<Partial<LinhaDeConta>>;
  }[] = [];

  function achar(
    predicado: (linha: LinhaDeConta) => boolean,
  ): LinhaDeConta | null {
    // A **primeira** linha, como o legado: `users.user_login` nao e `UNIQUE` no
    // banco e a unicidade e conferida em codigo (BR-MIGRAR-022).
    return [...linhas.values()].find(predicado) ?? null;
  }

  function aplicar(id: number, campos: Readonly<Partial<LinhaDeConta>>): void {
    const linha = linhas.get(id);
    if (linha === undefined) {
      return;
    }
    escritas.push({ id, campos });
    linhas.set(id, { ...linha, ...campos });
  }

  const contas: ContasDeUS4 = {
    porLogin(login: string) {
      return achar((linha) => linha.login === login);
    },

    porEmail(email: string) {
      return achar((linha) => linha.email === email);
    },

    // `LeituraDeConta`, de T003: a chave pendente morre no primeiro login
    // bem-sucedido (CA-1.4, `U4`).
    apagarChaveDeAtivacao(id: number) {
      aplicar(id, { chaveDeAtivacao: '' });
    },

    // `ContasParaRedefinicao`, de T009: gravar **substitui**, e e isso que faz
    // CA-4.3 valer — a coluna e uma so.
    gravarChaveDeAtivacao(id: number, valorGravado: string) {
      aplicar(id, { chaveDeAtivacao: valorGravado });
    },

    // As duas colunas no mesmo comando (CA-4.4). A sentinela e a vazia, nao
    // `NULL` (`DB-SENT`).
    gravarSenhaEApagarChave(id: number, senhaHash: string) {
      aplicar(id, { senhaHash, chaveDeAtivacao: '' });
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

/**
 * A montagem do e-mail, de teste.
 *
 * Os literais do e-mail **nao estao no pacote** — o e-mail nao e uma das 113
 * telas de `target_screens.md`, e `MontagemDoEmailDeRedefinicao` registra por que
 * ela chega por argumento. O que esta suite afirma e a unica coisa que e do
 * dominio: que a chave em claro chega ate aqui, e **so** aqui.
 *
 * O destinatario e o e-mail da conta porque e o que UC-20 passo 3 manda — e nao
 * porque o dominio o imponha: no legado o envelope inteiro passa por um ponto de
 * extensao antes do envio, e forcar o destinatario no dominio fecharia um ponto
 * que o legado deixa aberto.
 */
const MONTAGEM_DO_EMAIL: MontagemDoEmailDeRedefinicao = {
  montar({ conta, chaveEmClaro }) {
    return {
      destinatarios: [conta.email],
      assunto: 'assunto de teste',
      corpo: `link de redefinicao com a chave ${chaveEmClaro}`,
      cabecalhos: [],
      anexos: [],
    };
  },
};

/*
  ── A MONTAGEM ──────────────────────────────────────────────────────────────
*/

interface Montagem {
  readonly banco: BancoDeContas;
  /** O que saiu pela porta de e-mail, na ordem. */
  readonly enviadas: readonly MensagemDeEmail[];
  readonly sessoes: ArmazenamentoDeSessoes;
  mapaDeSessoes(id: number): MapaDeSessoes;
  /** Move o relogio para um instante absoluto. */
  relogioEm(instante: number): void;
  /** As chaves que o gerador desta suite entregou, na ordem. */
  readonly chavesGeradas: readonly string[];
  readonly pedido: ContextoDoPedidoDeRedefinicao;
  readonly redefinicao: ContextoDaRedefinicaoDeSenha;
  readonly entrada: ContextoDeAutenticacao;
}

function montar(iniciais: readonly LinhaDeConta[] = [contaInicial()]): Montagem {
  let agora = AGORA;
  const banco = bancoDeContas(iniciais);
  const enviadas: MensagemDeEmail[] = [];
  const mapas = new Map<number, MapaDeSessoes>();
  const chavesGeradas: string[] = [];

  const relogio = { agoraEmSegundos: () => agora };

  const sessoes: ArmazenamentoDeSessoes = {
    ler: (id) => mapas.get(id) ?? {},
    gravar: (id, mapa) => {
      mapas.set(id, mapa);
    },
  };

  /**
   * A caixa que **sempre aceita**.
   *
   * A falha de envio e US-5 (T011 e T012), e um caso de falha aqui invadiria a
   * historia seguinte. O que esta suite usa da caixa e o conteudo: CA-4.1 so e
   * conferivel contra a mensagem que saiu.
   */
  const email: PortaDeEmail = {
    enviar(mensagem) {
      enviadas.push(mensagem);
      return { enviado: true };
    },
  };

  const gerador: GeradorDeChaveDeRedefinicao = {
    gerar() {
      const chave = CHAVES_EMITIDAS[chavesGeradas.length];
      assert.ok(
        chave !== undefined,
        'a montagem desta suite nao tem mais chave em claro para entregar',
      );
      chavesGeradas.push(chave);
      return chave;
    },
  };

  return {
    banco,
    enviadas,
    sessoes,
    mapaDeSessoes: (id) => mapas.get(id) ?? {},
    relogioEm: (instante) => {
      agora = instante;
    },
    chavesGeradas,

    // Sem `prazoDaChave` e sem `ganchos` nos dois contextos: o que os seis casos
    // exercitam e o **default de fabrica**, que e o que o P6 manda afirmar.
    pedido: {
      relogio,
      contas: banco.contas,
      email,
      gerador,
      hashDaChave: HASH_DA_CHAVE,
      montagemDoEmail: MONTAGEM_DO_EMAIL,
    },

    redefinicao: {
      relogio,
      contas: banco.contas,
      hashDaChave: HASH_DA_CHAVE,
      hashDeSenha: HASH_DE_SENHA,
    },

    entrada: {
      relogio,
      contas: banco.contas,
      sessoes,
      verificadorDeSenha: VERIFICADOR_DE_SENHA,
      // A remocao de acentos e identidade nesta suite, e isso esta declarado: a
      // tabela de caractere e de `plataforma/`, nao deste modulo.
      removerAcentos: (texto) => texto,
      rede: REDE_INATIVA,
      urlDeSenhaPerdida:
        'https://exemplo.invalido/wp-login.php?action=lostpassword',
      urlDoPainel: 'https://exemplo.invalido/wp-admin/',
    },
  };
}

/** Pede a redefinicao naquele instante e devolve a chave em claro emitida. */
function pedir(
  montagem: Montagem,
  instante: number,
  identificador: string = LOGIN,
): {
  readonly chave: string;
  readonly resultado: ResultadoDoPedidoDeRedefinicao;
} {
  montagem.relogioEm(instante);
  const resultado = solicitarRedefinicaoDeSenha(
    { identificador },
    montagem.pedido,
  );
  const chave = montagem.chavesGeradas.at(-1);
  assert.ok(
    chave !== undefined,
    'o pedido nao chamou o gerador, e sem a chave em claro CA-4.1 nao e conferivel',
  );
  return { chave, resultado };
}

/** Redefine a senha naquele instante, com aquela chave. */
function redefinir(
  montagem: Montagem,
  instante: number,
  dados: {
    readonly chave: string;
    readonly login?: string;
    readonly senhaNova?: string;
  },
): ResultadoDaRedefinicao {
  montagem.relogioEm(instante);
  const senhaNova = dados.senhaNova ?? SENHA_NOVA;
  return redefinirSenha(
    {
      login: dados.login ?? LOGIN,
      chave: dados.chave,
      senhaNova,
      // `pass2` igual a `pass1`: as duas recusas de senha do legado sao assunto
      // da suite de T009, e nenhum dos seis casos daqui e sobre elas.
      confirmacaoDaSenha: senhaNova,
    },
    montagem.redefinicao,
  );
}

/** A recusa de chave, com o codigo e o erro, cobrando a forma do resultado. */
function recusaDeChave(resultado: ResultadoDaRedefinicao): {
  readonly codigo: 'invalid_key' | 'expired_key';
  readonly erro: ErroDeRedefinicao;
} {
  assert.equal(
    resultado.redefinida,
    false,
    'a chave foi aceita onde o caso espera recusa',
  );
  assert.ok(resultado.redefinida === false);
  assert.equal(resultado.motivo, 'chave-recusada');
  assert.ok(resultado.motivo === 'chave-recusada');
  return { codigo: resultado.codigo, erro: resultado.erro };
}

/** A senha que a linha gravada aceita hoje, pela operacao do produto. */
function senhaGravadaAceita(montagem: Montagem, senha: string): boolean {
  return VERIFICADOR_DE_SENHA.verificar(
    senha,
    montagem.banco.linha(ID_DA_CONTA).senhaHash,
  );
}

/**
 * Afirma que a conta continua com a senha antiga.
 *
 * E a assercao central de toda recusa: chave recusada nao troca senha, e o que o
 * criterio de paridade desta area cobra e o **efeito**, nao o relato.
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
// esperado: o pedido e aceito e o envio volta como **valor**; sai **uma**
//           mensagem, para o e-mail da conta, e o corpo dela carrega a chave em
//           claro (UC-20 passo 3); a coluna `user_activation_key` deixa de estar
//           vazia, e o valor gravado **nao contem** a chave em claro, e
//           **prefixado pelo instante** do pedido (`plan.md`, Modelo de dados) e
//           traz o resumo depois do separador; nenhuma escrita desta operacao
//           carrega a chave em claro, e o resultado devolvido a quem pediu
//           tambem nao; e a senha gravada nao e tocada. E o mesmo pedido pelo
//           **e-mail** chega a mesma conta (UC-20 passo 1)
// ---------------------------------------------------------------------------

test('UT-006-1 (CA-4.1) a chave e guardada com hash na conta, e o valor em claro so existe no e-mail', () => {
  const montagem = montar();

  const { chave, resultado } = pedir(montagem, AGORA);

  // O sucesso tem sempre a mesma forma, e o envio volta como valor (D3).
  assert.equal(resultado.aceito, true);
  assert.ok(resultado.aceito === true);
  assert.equal(resultado.envio.enviado, true);

  // O e-mail: um, para o endereco da conta, com a chave em claro dentro.
  assert.equal(montagem.enviadas.length, 1);
  const mensagem = montagem.enviadas[0];
  assert.ok(mensagem !== undefined);
  assert.deepEqual([...mensagem.destinatarios], [EMAIL]);
  assert.equal(
    mensagem.corpo.includes(chave),
    true,
    'o corpo do e-mail nao carrega a chave em claro, e UC-20 passo 3 manda enviar o link com a chave',
  );

  // A conta: chave gravada, com o instante prefixado e o resumo depois dele.
  const gravado = montagem.banco.linha(ID_DA_CONTA).chaveDeAtivacao;
  assert.notEqual(gravado, '', 'nenhuma chave foi gravada na conta');
  assert.equal(
    gravado.includes(chave),
    false,
    'o valor em claro da chave foi gravado na conta, e CA-4.1 manda guardar com hash',
  );
  assert.equal(
    gravado,
    `${AGORA}${SEPARADOR_DO_INSTANTE}${resumoDe(chave)}`,
    'o valor gravado nao e o instante do pedido, o separador e o resumo da chave',
  );
  assert.equal(
    lerChaveGravada(gravado)?.instanteDoPedido,
    AGORA,
    'o instante prefixado nao e o do relogio do contexto, e e dele que sai a janela de 24 horas',
  );

  // E a chave em claro nao saiu em escrita nenhuma — nem em outra coluna — nem
  // no resultado devolvido a quem pediu.
  assert.equal(montagem.banco.escritas.length, 1);
  assert.equal(
    JSON.stringify(montagem.banco.escritas).includes(chave),
    false,
    'a chave em claro aparece em uma escrita de conta',
  );
  assert.equal(
    JSON.stringify(resultado).includes(chave),
    false,
    'a chave em claro voltou no resultado do pedido, e CA-4.1 manda que ela so exista no e-mail',
  );

  // A senha nao foi tocada: pedir redefinicao nao redefine nada.
  assert.equal(senhaGravadaAceita(montagem, SENHA), true);

  // UC-20 passo 1: *"informa o login ou o e-mail da conta"* — os dois caminhos
  // chegam a mesma conta.
  const porEmail = montar();
  const peloEmail = pedir(porEmail, AGORA, EMAIL);

  assert.equal(peloEmail.resultado.aceito, true);
  assert.equal(porEmail.enviadas.length, 1);
  assert.deepEqual([...(porEmail.enviadas[0]?.destinatarios ?? [])], [EMAIL]);
  assert.equal(
    porEmail.banco.linha(ID_DA_CONTA).chaveDeAtivacao,
    `${AGORA}${SEPARADOR_DO_INSTANTE}${resumoDe(peloEmail.chave)}`,
  );
});

// ---------------------------------------------------------------------------
// UT-006-2 — CA-4.2 *"Chave com mais de 24 horas e recusada com aviso de prazo
// vencido e oferta de pedir outra"*
//
// entrada:  uma chave emitida em AGORA, em duas montagens iguais
// acao:     redefinir a senha com ela em AGORA + 24 h − 1, e na outra montagem em
//           AGORA + 24 h + 1
// esperado: dentro do prazo a senha e trocada; alem do prazo a chave e recusada
//           com o codigo `expired_key` — que e o unico eixo pelo qual o legado
//           distingue esta recusa da generica —, a mensagem e a de prazo vencido
//           de `wp-login.php:846`, que traz a **oferta de pedir outra** na mesma
//           frase, o destino e o formulario de pedido, a senha continua sendo a
//           antiga e **nada e gravado**
//
// ⚠️ O instante exatamente igual a AGORA + 24 h **nao** e afirmado: o pacote nao
//    o fixa (item 2 do cabecalho).
// ---------------------------------------------------------------------------

test('UT-006-2 (CA-4.2) chave com mais de 24 horas e recusada nomeando o prazo vencido', () => {
  // Um instante antes do prazo: aceita.
  const dentro = montar();
  const chaveDentro = pedir(dentro, AGORA).chave;

  const aceita = redefinir(dentro, AGORA + VINTE_E_QUATRO_HORAS - 1, {
    chave: chaveDentro,
  });

  assert.equal(
    aceita.redefinida,
    true,
    'a chave foi recusada um instante antes do prazo, e PT-006 manda aceita-la ali',
  );
  assert.equal(senhaGravadaAceita(dentro, SENHA_NOVA), true);

  // Alem do prazo: recusa, e a recusa e a de prazo vencido.
  const alem = montar();
  const chaveAlem = pedir(alem, AGORA).chave;
  const escritasAntes = alem.banco.escritas.length;

  const recusa = recusaDeChave(
    redefinir(alem, AGORA + VINTE_E_QUATRO_HORAS + 1, { chave: chaveAlem }),
  );

  assert.equal(
    recusa.codigo,
    'expired_key',
    'a recusa alem do prazo nao veio com o codigo de prazo vencido, e e so por ele que o legado a distingue da generica',
  );
  assert.equal(primeiroCodigoDeErroDeRedefinicao(recusa.erro), 'expired_key');
  assert.equal(
    recusa.erro.itens[0]?.mensagem,
    MENSAGENS_DA_TELA_DE_PEDIDO.chaveVencida,
  );
  // A "oferta de pedir outra" de CA-4.2 esta na propria mensagem, e o destino e
  // o formulario de pedido (`SCR-003`, *Eventos e transicoes*).
  assert.match(
    MENSAGENS_DA_TELA_DE_PEDIDO.chaveVencida,
    /Please request a new link below\.$/,
  );
  assert.equal(
    DESTINO_POR_CODIGO_DE_CHAVE[recusa.codigo],
    'wp-login.php?action=lostpassword&error=expiredkey',
  );

  // Recusada a chave, a senha segue a antiga e nada e gravado.
  senhaIntacta(alem);
  assert.equal(
    alem.banco.escritas.length,
    escritasAntes,
    'uma chave vencida produziu escrita, e o legado nao grava nada neste caminho',
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
// esperado: o valor gravado muda entre os dois pedidos e passa a ser o da segunda
//           chave; a primeira chave e recusada com o codigo **generico**
//           `invalid_key`, e nao com `expired_key`, porque ela nao venceu — ela
//           foi substituida (UC-20: *"o link antigo deixa de valer"*); a senha
//           segue intacta e a chave pendente nao e mexida; e a segunda chave
//           troca a senha
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
  assert.equal(
    gravadoDoSegundo,
    `${AGORA + SEGUNDOS_POR_HORA}${SEPARADOR_DO_INSTANTE}${resumoDe(segunda)}`,
    'a coluna nao ficou com a chave do pedido novo, e ela e uma so',
  );
  assert.equal(montagem.enviadas.length, 2);

  // A chave anterior nao vale mais, e nao e por prazo: ela foi substituida, e
  // dentro das 24 horas a recusa e a generica de CA-4.5.
  const recusa = recusaDeChave(
    redefinir(montagem, AGORA + SEGUNDOS_POR_HORA, { chave: primeira }),
  );

  assert.equal(
    recusa.codigo,
    'invalid_key',
    'a chave substituida foi recusada como vencida, e ela nao venceu — dentro das 24 horas a recusa e a generica',
  );
  assert.equal(
    recusa.erro.itens[0]?.mensagem,
    MENSAGENS_DA_TELA_DE_PEDIDO.chaveInvalida,
  );
  senhaIntacta(montagem);
  assert.equal(
    montagem.banco.linha(ID_DA_CONTA).chaveDeAtivacao,
    gravadoDoSegundo,
    'a tentativa com a chave substituida mexeu na chave pendente',
  );

  // E a chave nova vale.
  const aceita = redefinir(montagem, AGORA + SEGUNDOS_POR_HORA, {
    chave: segunda,
  });

  assert.equal(aceita.redefinida, true);
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
// esperado: a senha gravada passa a ser a nova, a antiga deixa de valer e o texto
//           claro dela nao esta em lugar nenhum da linha; `user_activation_key`
//           volta a sentinela vazia — `''`, nao nulo (`DB-SENT`) — na **mesma**
//           escrita da senha; a mensagem de sucesso e a do passo 7 de UC-20; a
//           mesma chave usada de novo e recusada com o codigo generico, nao troca
//           nada e nao grava nada; e a sessao aberta antes **continua gravada**
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
  const escritasAntes = montagem.banco.escritas.length;

  const resultado = redefinir(montagem, AGORA + SEGUNDOS_POR_HORA, { chave });

  assert.equal(resultado.redefinida, true);
  assert.ok(resultado.redefinida === true);
  assert.equal(resultado.idDaConta, ID_DA_CONTA);
  assert.equal(
    resultado.mensagem,
    MENSAGENS_DA_TELA_DE_REDEFINICAO.senhaRedefinida,
    'o passo 7 de UC-20 nao devolveu a mensagem de senha redefinida',
  );

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

  // A chave usada foi invalidada, e o valor e a sentinela vazia do DDL — na
  // **mesma** escrita da senha, que e o que `gravarSenhaEApagarChave` existe
  // para garantir: separar em dois comandos criaria um instante em que a senha
  // ja e a nova e a chave antiga ainda vale.
  assert.equal(linha.chaveDeAtivacao, '');
  assert.equal(montagem.banco.escritas.length, escritasAntes + 1);
  assert.deepEqual(montagem.banco.escritas.at(-1), {
    id: ID_DA_CONTA,
    campos: { senhaHash: linha.senhaHash, chaveDeAtivacao: '' },
  });

  // Reusar a mesma chave nao faz nada: `plan.md` declara "chave ja usada" entre
  // os erros desta operacao, e o legado **nao lhe da codigo proprio** — o que
  // sobrou da chave usada e a sentinela vazia, logo "usada" e "nunca existiu"
  // saem iguais (ver `chave-de-redefinicao.ts`, ramo 2).
  const reuso = recusaDeChave(
    redefinir(montagem, AGORA + 2 * SEGUNDOS_POR_HORA, {
      chave,
      senhaNova: 'terceiraSenha',
    }),
  );

  assert.equal(reuso.codigo, 'invalid_key');
  assert.equal(
    senhaGravadaAceita(montagem, 'terceiraSenha'),
    false,
    'a chave ja usada trocou a senha de novo',
  );
  assert.equal(senhaGravadaAceita(montagem, SENHA_NOVA), true);
  assert.equal(
    montagem.banco.escritas.length,
    escritasAntes + 1,
    'o reuso da chave produziu escrita',
  );

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
// entrada:  tres situacoes, em tres montagens: (a) a conta sem chave pendente
//           nenhuma; (b) a conta com uma chave valida pendente, e uma chave
//           inventada na mao; (c) um login que nao existe
// acao:     redefinir a senha com uma chave que nunca foi emitida
// esperado: as tres recusam com `invalid_key` e com a mensagem generica de
//           `wp-login.php:844`, que nao diz se a conta existe, se a chave foi
//           usada ou se nunca existiu; as tres recusas sao **iguais entre si**,
//           que e o que "generico" quer dizer; a senha segue intacta; nada e
//           gravado; e a conta que tinha chave pendente **continua** com ela,
//           porque recusar uma chave inventada nao e consumir a pendente
// ---------------------------------------------------------------------------

test('UT-006-5 (CA-4.5) chave invalida e recusada com erro generico', () => {
  // (a) sem chave pendente nenhuma.
  const semChave = montar();

  const recusaSemChave = recusaDeChave(
    redefinir(semChave, AGORA, { chave: CHAVE_NUNCA_EMITIDA }),
  );

  assert.equal(recusaSemChave.codigo, 'invalid_key');
  assert.equal(
    recusaSemChave.erro.itens[0]?.mensagem,
    MENSAGENS_DA_TELA_DE_PEDIDO.chaveInvalida,
  );
  assert.equal(
    DESTINO_POR_CODIGO_DE_CHAVE[recusaSemChave.codigo],
    'wp-login.php?action=lostpassword&error=invalidkey',
  );
  senhaIntacta(semChave);
  assert.equal(semChave.banco.linha(ID_DA_CONTA).chaveDeAtivacao, '');
  assert.deepEqual(semChave.banco.escritas, []);

  // (b) com uma chave valida pendente, mas apresentando outra.
  const comChave = montar();
  pedir(comChave, AGORA);
  const pendente = comChave.banco.linha(ID_DA_CONTA).chaveDeAtivacao;
  const escritasAntes = comChave.banco.escritas.length;

  const recusaComChave = recusaDeChave(
    redefinir(comChave, AGORA + SEGUNDOS_POR_HORA, {
      chave: CHAVE_NUNCA_EMITIDA,
    }),
  );

  senhaIntacta(comChave);
  assert.equal(
    comChave.banco.linha(ID_DA_CONTA).chaveDeAtivacao,
    pendente,
    'a chave pendente foi mexida por uma tentativa com chave invalida',
  );
  assert.equal(comChave.banco.escritas.length, escritasAntes);

  // (c) login inexistente: a mesma recusa, e e isso que CA-4.5 cobra — ela nao
  // diz **qual** das coisas aconteceu.
  const semConta = montar();
  const recusaSemConta = recusaDeChave(
    redefinir(semConta, AGORA, {
      login: 'ninguem',
      chave: CHAVE_NUNCA_EMITIDA,
    }),
  );

  assert.deepEqual(semConta.banco.escritas, []);

  // As tres recusas sao a mesma: e isso que "generico" quer dizer, e e o
  // contrario do que o **pedido** faz — ali `invalid_email` e `invalidcombo`
  // distinguem, de proposito (`ESC-ENUMERACAO`), e aqui nada distingue.
  assert.deepEqual(recusaComChave, recusaSemChave);
  assert.deepEqual(recusaSemConta, recusaSemChave);
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
//   Entao a chave e recusada, com a mesma mensagem
//   Quando uma entrada bem-sucedida acontece com a chave ainda valida
//   Entao a chave e apagada no mesmo passo
//
// entrada:  a conta `ada` com a senha `segredo`, e uma chave emitida em AGORA
// acao:     as tres do cenario, cada uma na sua montagem
// esperado: o prazo de fabrica e 24 horas, afirmado no ponto de configuracao
//           nomeado (P6); as duas pontas da borda sao as de PT-006; e a entrada
//           bem-sucedida apaga a chave pendente, depois do que o link do e-mail
//           nao funciona mais: *"um link interceptado morre no instante em que o
//           dono entra"* (UC-20)
// ---------------------------------------------------------------------------

test('UT-006-6 (U4 · BR-MIGRAR-024) a chave vale 24 horas, nas duas pontas, e morre no primeiro acesso', () => {
  // O numero, no ponto de configuracao nomeado que o P6 exige — *"cada numero
  // vive num ponto de configuracao nomeado, com o valor de fabrica do legado"*.
  assert.equal(
    PRAZO_DA_CHAVE_DE_REDEFINICAO_DE_FABRICA,
    VINTE_E_QUATRO_HORAS,
    'o prazo de fabrica da chave de redefinicao nao e o de BR-MIGRAR-024',
  );
  assert.equal(PRAZO_DA_CHAVE_DE_REDEFINICAO_DE_FABRICA, 86_400);

  // Um instante antes do prazo: aceita, e a chave morre na mesma escrita.
  const dentro = montar();
  const chaveDentro = pedir(dentro, AGORA).chave;

  const aceita = redefinir(dentro, AGORA + VINTE_E_QUATRO_HORAS - 1, {
    chave: chaveDentro,
  });

  assert.equal(aceita.redefinida, true);
  assert.equal(senhaGravadaAceita(dentro, SENHA_NOVA), true);
  assert.equal(dentro.banco.linha(ID_DA_CONTA).chaveDeAtivacao, '');

  // Alem do prazo: recusa, e nada e gravado.
  const alem = montar();
  const chaveAlem = pedir(alem, AGORA).chave;
  const escritasAntes = alem.banco.escritas.length;

  const recusa = recusaDeChave(
    redefinir(alem, AGORA + VINTE_E_QUATRO_HORAS + 1, { chave: chaveAlem }),
  );

  assert.equal(recusa.codigo, 'expired_key');
  senhaIntacta(alem);
  assert.equal(alem.banco.escritas.length, escritasAntes);

  // A outra metade da regra: a entrada bem-sucedida apaga a chave pendente, e o
  // link do e-mail morre ali. A entrada e a de T003 — a mesma operacao do
  // produto, nao uma imitacao —, porque o que esta regra amarra e justamente a
  // costura entre as duas historias.
  const comEntrada = montar();
  const chaveViva = pedir(comEntrada, AGORA).chave;

  assert.notEqual(
    comEntrada.banco.linha(ID_DA_CONTA).chaveDeAtivacao,
    '',
    'a montagem chegou na entrada sem chave pendente, e o caso e sobre apagar uma',
  );

  comEntrada.relogioEm(AGORA + SEGUNDOS_POR_HORA);
  const entrada = autenticar({ login: LOGIN, senha: SENHA }, comEntrada.entrada);

  assert.equal(entrada.autenticado, true);
  assert.equal(
    comEntrada.banco.linha(ID_DA_CONTA).chaveDeAtivacao,
    '',
    'a entrada bem-sucedida nao apagou a chave de redefinicao pendente (CA-1.4, U4)',
  );

  // E o link do e-mail, que ainda estava dentro das 24 horas, deixou de valer —
  // com a recusa generica, porque o que sobrou da chave e a sentinela vazia.
  const depoisDaEntrada = recusaDeChave(
    redefinir(comEntrada, AGORA + 2 * SEGUNDOS_POR_HORA, { chave: chaveViva }),
  );

  assert.equal(depoisDaEntrada.codigo, 'invalid_key');
  senhaIntacta(comEntrada);

  // A conta vizinha nao foi tocada por nada disto: um pedido alcanca **uma**
  // conta, e o e-mail vai so para o endereco dela.
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
    vizinhos.enviadas.flatMap((mensagem) => [...mensagem.destinatarios]),
    [EMAIL],
  );
  assert.deepEqual(
    vizinhos.banco.escritas.map((escrita) => escrita.id),
    [ID_DA_CONTA],
  );
});
