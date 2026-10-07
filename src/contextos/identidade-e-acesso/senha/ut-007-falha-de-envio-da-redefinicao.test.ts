/**
 * **T012 — os testes de US-5.** Quatro testes, um por caso que `tasks.md`
 * registra para esta tarefa: `UT-007-1`, `UT-007-2`, `UT-007-3` e `UT-007-4`,
 * nessa ordem, com *"o mesmo dado de entrada, acao e resultado esperado"* — e o
 * caso de regra de negocio (`UT-007-4`) na mesma suite, como a entrega manda.
 *
 * US-5 — *"Informar ao titular quando o envio do e-mail de redefinicao falha"*
 * (REQ-007 · UC-20 · `domain.md §2.5` D3), criterios CA-5.1, CA-5.2 e CA-5.3. O
 * que esta suite protege e o **passo 3 de UC-20** — *"Sistema envia ao e-mail da
 * conta o link com a chave"* — e o que acontece quando esse envio **nao sai**.
 *
 * | caso | o que afirma | fonte |
 * |---|---|---|
 * | `UT-007-1` | CA-5.1 — a falha no envio devolve ao requisitante um aviso distinto do caso de sucesso | `spec.md`, US-5 · UC-20 § *Excecoes* |
 * | `UT-007-2` | CA-5.2 — a falha fica registrada com instante, destinatario e motivo informado pelo canal de envio | `spec.md`, US-5 |
 * | `UT-007-3` | CA-5.3 — pedir de novo apos a falha gera uma chave nova e uma tentativa nova de envio | `spec.md`, US-5 · UC-20, *Pedido repetido antes do prazo* |
 * | `UT-007-4` | a regra `D3` / BR-MIGRAR-040 **na leitura que vale para ESTE fluxo** | `target_business_rules.md` · `target_architecture.md` AD-06 · UC-20 § *Excecoes* |
 *
 * ---
 *
 * ## Como esta suite chama US-5
 *
 * **Pelo contrato que T011 entregou, importado estaticamente.** A operacao e
 * `enviarEmailDeRedefinicao(contexto, mensagem)`, de
 * `../recuperacao-de-senha/envio-do-email-de-redefinicao.ts`, e o contexto dela e
 * `ContextoDeEnvioDeRedefinicao`: `email`, `relogio`, `registroDeFalha` e
 * `relatoAoRequisitante`. Ela recebe a `MensagemDeEmail` **pronta** e nao a
 * monta — quem gera a chave, resume, grava e monta o e-mail e T009, em
 * `../redefinicao-de-senha/`, pelo contexto `ContextoDoPedidoDeRedefinicao`
 * (`gerador`, `hashDaChave`, `montagemDoEmail`).
 *
 * **A costura entre as duas e feita AQUI, e e declarada.** `tasks.md` poe T011
 * como o passo 3 e a operacao de T009 como quem o chama, mas o que T009
 * entregou chama a `PortaDeEmail` direto — ultima linha de
 * `solicitarRedefinicaoDeSenha` — e devolve a tentativa como valor (`envio`);
 * nenhum arquivo desta arvore liga uma na outra. Os dois casos que precisam do
 * fluxo inteiro (`UT-007-3` e `UT-007-4`, que falam de *chave nova* e de *estado
 * gravado*) montam o pedido de T009 com uma `PortaDeEmail` que **e** o passo 3:
 * ela entrega a mensagem a `enviarEmailDeRedefinicao` e devolve o
 * `ResultadoDeEnvio` que a porta declara. Com isso ha **um** envio por pedido, o
 * relato de US-5 nasce no ponto em que o legado o produz, e nenhuma das duas
 * operacoes foi alterada para o teste caber. Quando alguem costurar as duas em
 * codigo de producao, e esta montagem que deixa de ser necessaria — nao as
 * assercoes.
 *
 * ---
 *
 * ## 🔴 PARADA: a discordancia do pacote que esta suite NAO resolve
 *
 * **CA-5.1 manda avisar o requisitante; UC-20 diz que este fluxo nao avisa.** As
 * duas frases estao no pacote entregue e sao sobre o mesmo passo:
 *
 * - `spec.md` CA-5.1: *"Falha no envio devolve ao requisitante um aviso distinto
 *   do caso de sucesso"*;
 * - `use-cases/UC-20-recuperar-a-senha-de-acesso.md` § *Excecoes*, confianca 🟢
 *   `confirmado`: *"O e-mail nao saiu | o assinante **nao tem como saber**:
 *   nenhum estado registra a falha de envio neste fluxo, ao contrario do que
 *   acontece na solicitacao de dados pessoais"*;
 * - e a propria `spec.md`, na linha de regra de US-5: *"D3 — falha de envio de
 *   e-mail e estado, nao excecao (o fluxo de privacidade ja faz assim; **este
 *   fluxo nao faz**)"*.
 *
 * `discard_log.md` nao registra a divergencia e `pending_decisions.md` nao a
 * pergunta — ou seja, ninguem decidiu. A tabela *Nao negociavel* da constituicao
 * poe reconciliar duas decisoes humanas opostas fora do alcance de quem codifica,
 * e o P1 lista exatamente tres divergencias autorizadas, nenhuma delas esta.
 *
 * **T011 nao escolheu, e esta suite tambem nao.** O lado chega por
 * `relatoAoRequisitante`, argumento **obrigatorio e sem valor padrao**
 * (`LadoDoRelatoDeFalhaDeEnvio`): `'ca-5-1-aviso-distinto'` e o lado da spec,
 * `'uc-20-silencioso'` e o lado de UC-20. `UT-007-1` afirma **os dois**, cada um
 * com a fonte que o manda; os outros tres casos rodam nos dois lados e afirmam o
 * que vale em ambos. Quando a decisao vier, e `UT-007-1` que encolhe para um
 * lado so — num lugar so, e sem retrabalho nos demais.
 *
 * **CA-5.2 nao esta nessa discordancia.** UC-20 nega que o *assinante* saiba e
 * nega **estado** que registre a falha; `RegistroDeFalhaDeEnvio` nao e nenhum dos
 * dois — devolve `void`, nada do sistema o le e nenhuma ramificacao depende dele,
 * que e em letra o que o **P7** autoriza (*"Registro e diagnostico novos podem
 * ser acrescentados, mas nenhuma decisao do sistema pode passar a depender
 * deles"*). `UT-007-4` afirma essa propriedade, que e o que faz CA-5.2 e UC-20
 * caberem juntos; se a decisao humana disser que CA-5.2 queria **estado
 * persistido** — o `request-failed` do fluxo de privacidade trazido para ca —, e
 * `UT-007-4` que muda.
 *
 * ---
 *
 * ## ⚠️ `backlog/tests.md` nao existe nesta arvore: os quatro casos foram RECONSTRUIDOS
 *
 * `tasks.md` manda escrever os quatro *"com o mesmo dado de entrada, acao e
 * resultado esperado"* do caso registrado em `../../../backlog/tests.md`, e esse
 * arquivo **nao veio no pacote**: nem ele, nem a pasta `backlog/`. `UT-007-1`
 * aparece em `tasks.md` e em mais lugar nenhum; `parity_specs.md` descreve o
 * catalogo de fora (*"os **985 testes** de `../backlog/tests.md` sao
 * **especificacao, nao evidencia**"*) e e a unica mencao a ele.
 *
 * A reconstrucao e a mesma aritmetica que T008 registrou em
 * `../sessao/ut-003-expiracao-de-sessao.test.ts` e que T010 repetiu em
 * `./ut-006-redefinicao-de-senha.test.ts`, e ela fecha aqui sem sobra: US-5 tem
 * **3** criterios de aceite, **4** casos, e **1** deles e *"o teste de regra de
 * negocio (UT-007-4)"*. Sobram 3 casos para 3 criterios, na ordem — e o quarto e
 * a regra `D3`, a unica que `spec.md` lista para esta historia. Se o catalogo
 * aparecer e um `UT-007-*` tiver dado de entrada diferente do que esta aqui, **o
 * de la vale** e este arquivo muda. Cada assercao sai de `spec.md`, de UC-20, de
 * `target_business_rules.md` ou de `target_architecture.md`, e a origem esta dita
 * no caso; o que nao tem origem declarada nao e cobrado.
 *
 * ---
 *
 * ## O que esta suite nao afirma, de proposito
 *
 * - **O prazo de 24 horas, o resumo da chave e a recusa da chave vencida ou
 *   invalida.** Sao CA-4.1 a CA-4.5 (US-4), e os casos delas sao `UT-006-1` a
 *   `UT-006-6`, em `./ut-006-redefinicao-de-senha.test.ts`. Aqui a chave so
 *   aparece como **o que muda entre dois pedidos** (CA-5.3).
 * - **O texto que a tela mostra.** `target_screens.md` conta 8 mensagens
 *   literais em `SCR-002` e 3 em `SCR-006`, e **nenhuma e falha de envio** — nao
 *   ha msgid para cobrar, e inventar um quebraria o *diff* de string zero que o
 *   pacote exige dessas telas. O lado `ca-5-1-aviso-distinto` carrega **codigo,
 *   nao texto**, e e o codigo que os casos leem.
 * - **O formato do registro.** Uma linha JSON e o slot de observabilidade da
 *   stack, logo e do adaptador; o que CA-5.2 nomeia sao tres **fatos**, e sao os
 *   tres campos de `FalhaDeEnvioRegistrada` que os casos afirmam.
 * - **Limite de tentativa, espera entre pedidos e prazo de retencao do
 *   registro.** O legado nao tem nenhum: `do-not-rewrite.md` poe `REQ-005` e
 *   `REQ-160` fora do pacote e o **P6** recusa *"numero que o legado nao tem"*.
 *   `UT-007-3` pede duas vezes seguidas e espera duas tentativas, nao uma recusa.
 *
 * O relogio e controlado nos quatro casos, como o **P4** cobra.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import type {
  MensagemDeEmail,
  PortaDeEmail,
  PortaDeRelogio,
} from '../portas/index.js';
import {
  enviarEmailDeRedefinicao,
  type ContextoDeEnvioDeRedefinicao,
  type FalhaDeEnvioRegistrada,
  type LadoDoRelatoDeFalhaDeEnvio,
  type ResultadoDoEnvioDeRedefinicao,
} from '../recuperacao-de-senha/envio-do-email-de-redefinicao.js';
import {
  lerChaveGravada,
  type GeradorDeChaveDeRedefinicao,
  type HashDeChaveDeRedefinicao,
} from '../redefinicao-de-senha/chave-de-redefinicao.js';
import type {
  ContaNaRedefinicao,
  ContasParaRedefinicao,
} from '../redefinicao-de-senha/contas-para-redefinicao.js';
import type {
  ContextoDoPedidoDeRedefinicao,
  MontagemDoEmailDeRedefinicao,
} from '../redefinicao-de-senha/contexto-de-redefinicao.js';
import {
  solicitarRedefinicaoDeSenha,
  type ResultadoDoPedidoDeRedefinicao,
} from '../redefinicao-de-senha/pedido-de-redefinicao.js';

/*
  ── O DADO DE ENTRADA DOS QUATRO CASOS ──────────────────────────────────────
*/

/**
 * O instante de partida de todos os casos.
 *
 * Fixo e arbitrario, como nas suites de T008 e T010: o que `UT-007-2` afirma e
 * **instante**, e um relogio real o tornaria irrepetivel.
 */
const AGORA = 1_700_000_000;

/**
 * O quanto o relogio anda entre os dois pedidos de `UT-007-3`.
 *
 * Nao e numero de produto, e por isso nao tem ponto de configuracao: e so o que
 * separa dois instantes para a chave gravada do segundo pedido ser distinguivel
 * da do primeiro. O unico prazo desta area sao as 24 horas da chave, e elas sao
 * de US-4 (`UT-006-2` e `UT-006-6`).
 */
const UM_MINUTO = 60;

const ID_DA_CONTA = 7;
const LOGIN = 'ada';
const EMAIL = 'ada@exemplo.invalido';

/**
 * O motivo que o canal informa, e que CA-5.2 manda a falha carregar.
 *
 * E um texto de transporte de proposito: `porta-de-email.ts` declara
 * `motivo: string` justamente porque *"o motivo tem de atravessar a porta"*, e o
 * que atravessa e o que o canal disse, nao uma traducao do dominio.
 */
const MOTIVO_DO_CANAL = 'SMTP connect() failed';

/**
 * As chaves em claro que o gerador desta suite entrega, na ordem.
 *
 * So letras, pela mesma razao de T010: o pacote nao registra alfabeto nem
 * comprimento da chave, e uma chave de teste com pontuacao poderia ser mutilada
 * por uma sanitizacao legitima e fazer o caso falhar por um motivo que nao e o
 * dele. Nenhum caso daqui afirma tamanho.
 */
const CHAVES_EMITIDAS: readonly string[] = [
  'chaveEmClaroPrimeira',
  'chaveEmClaroSegunda',
  'chaveEmClaroTerceira',
];

/**
 * Os dois lados do conflito de CA-5.1 — ver a PARADA no cabecalho.
 *
 * Os casos que nao sao sobre o conflito rodam nos **dois**, e isso e a
 * afirmacao: o que eles cobram vale qualquer que seja a decisao humana.
 */
const OS_DOIS_LADOS: readonly LadoDoRelatoDeFalhaDeEnvio[] = [
  'uc-20-silencioso',
  'ca-5-1-aviso-distinto',
];

/*
  ── AS DUAS COLABORACOES QUE O PACOTE NAO REGISTRA ──────────────────────────

  O resumo da chave e um dos 42 pontos de substituicao de BR-MIGRAR-103 e o
  pacote **nao nomeia o algoritmo**; os literais do e-mail nao estao em
  `target_screens.md`, porque o e-mail nao e uma das 113 telas. As duas chegam
  por argumento nos contratos de T009, e o que esta suite monta e a **propriedade**
  de que os casos dependem, nunca os bytes.
*/

/**
 * O resumo da chave.
 *
 * Resume de verdade — um simulado que devolvesse a chave decorada esconderia o
 * que `UT-007-3` cobra — e nao contem o separador `:`, que `lerChaveGravada`
 * leria como instante prefixado.
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

/**
 * A montagem do e-mail, de teste.
 *
 * O destinatario e o e-mail **da conta**, porque e o que UC-20 passo 3 manda — e
 * nao porque o dominio o imponha: no legado o envelope inteiro passa por um
 * ponto de extensao antes do envio, e `MontagemDoEmailDeRedefinicao` registra por
 * que forcar isso no dominio fecharia um ponto que o legado deixa aberto. O
 * corpo carrega a chave em claro porque e o unico lugar onde ela existe
 * (CA-4.1), e e por ele que `UT-007-3` ve que a chave do segundo pedido e outra.
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

/**
 * Uma escrita de conta, na forma em que os casos a comparam.
 *
 * O criterio de paridade desta area e *"efeito no banco ... snapshot +
 * sequencia de comandos"* (Decisao 2 de `parity_specs.md`), e e a **sequencia**
 * que `UT-007-4` compara entre o caminho da falha e o do sucesso.
 */
interface EscritaDeConta {
  readonly operacao: 'gravarChaveDeAtivacao' | 'gravarSenhaEApagarChave';
  readonly idDaConta: number;
  readonly valor: string;
}

interface Montagem {
  /** Pede a redefinicao pelo identificador (passos 1 a 3 de UC-20). */
  readonly pedir: (identificador?: string) => ResultadoDoPedidoDeRedefinicao;
  /** Toda mensagem que chegou ao canal, na ordem — inclusive as que falharam. */
  readonly tentativas: readonly MensagemDeEmail[];
  /** O relato do passo 3 de cada pedido, na ordem. CA-5.1. */
  readonly relatos: readonly ResultadoDoEnvioDeRedefinicao[];
  /** Tudo que foi registrado, na ordem. CA-5.2. */
  readonly registradas: readonly FalhaDeEnvioRegistrada[];
  /** Toda escrita de conta, na ordem. */
  readonly escritas: readonly EscritaDeConta[];
  /** As chaves em claro que o gerador entregou, na ordem. */
  readonly chavesGeradas: readonly string[];
  /** A linha gravada, que e onde os casos leem o efeito. */
  linha(idDaConta?: number): ContaNaRedefinicao;
  /** Passa a falhar com este motivo. `null` volta a funcionar. */
  falharCom(motivo: string | null): void;
  /** Move o relogio para um instante absoluto (P4). */
  relogioEm(instante: number): void;
}

function contaInicial(parcial: Partial<ContaNaRedefinicao> = {}): ContaNaRedefinicao {
  return {
    id: ID_DA_CONTA,
    login: LOGIN,
    email: EMAIL,
    // Sem chave pendente: o DDL e `NOT NULL default ''`, e `DB-SENT` registra
    // que o esquema evita `NULL` e usa sentinela.
    chaveDeAtivacao: '',
    ...parcial,
  };
}

/**
 * Monta o pedido de T009 com o passo 3 de T011 costurado na porta de e-mail.
 *
 * `aoRegistrar` existe so para `UT-007-4`: e com ele que se ve que o registro de
 * CA-5.2 e **so escrita** (P7), comparando o relato de uma montagem cujo
 * registro trabalha com o de outra cujo registro nao faz nada.
 */
function montar(
  lado: LadoDoRelatoDeFalhaDeEnvio,
  aoRegistrar: (falha: FalhaDeEnvioRegistrada) => void = () => {},
): Montagem {
  let agora = AGORA;
  let motivoDoCanal: string | null = null;

  const tentativas: MensagemDeEmail[] = [];
  const relatos: ResultadoDoEnvioDeRedefinicao[] = [];
  const registradas: FalhaDeEnvioRegistrada[] = [];
  const escritas: EscritaDeConta[] = [];
  const chavesGeradas: string[] = [];

  const linhas = new Map<number, ContaNaRedefinicao>([
    [ID_DA_CONTA, contaInicial()],
  ]);

  const relogio: PortaDeRelogio = {
    agoraEmSegundos: () => agora,
  };

  /** O canal de verdade: conta a tentativa e falha quando mandado. */
  const canal: PortaDeEmail = {
    enviar(mensagem) {
      tentativas.push(mensagem);
      return motivoDoCanal === null
        ? { enviado: true }
        : { enviado: false, motivo: motivoDoCanal };
    },
  };

  const contextoDoEnvio: ContextoDeEnvioDeRedefinicao = {
    email: canal,
    relogio,
    registroDeFalha: {
      registrar(falha) {
        registradas.push(falha);
        aoRegistrar(falha);
      },
    },
    // 🔴 Obrigatorio e sem padrao: o conflito de CA-5.1. Ver a PARADA.
    relatoAoRequisitante: lado,
  };

  /**
   * A costura declarada no cabecalho: a porta que o pedido de T009 chama **e**
   * o passo 3 de UC-20, que e `enviarEmailDeRedefinicao`. Um envio por pedido.
   */
  const passoTres: PortaDeEmail = {
    enviar(mensagem) {
      const relato = enviarEmailDeRedefinicao(contextoDoEnvio, mensagem);
      relatos.push(relato);
      return relato.enviado
        ? { enviado: true }
        : { enviado: false, motivo: relato.motivo };
    },
  };

  function aplicar(
    idDaConta: number,
    campos: Readonly<Partial<ContaNaRedefinicao>>,
  ): void {
    const linha = linhas.get(idDaConta);
    if (linha === undefined) {
      return;
    }
    linhas.set(idDaConta, { ...linha, ...campos });
  }

  const contas: ContasParaRedefinicao = {
    porLogin(login) {
      return [...linhas.values()].find((l) => l.login === login) ?? null;
    },

    porEmail(email) {
      return [...linhas.values()].find((l) => l.email === email) ?? null;
    },

    // Gravar **substitui**: a coluna e uma so, e e isso que faz um pedido novo
    // valer sobre o anterior (CA-4.3, e a metade de CA-5.3 que e de T009).
    gravarChaveDeAtivacao(idDaConta, valorGravado) {
      escritas.push({
        operacao: 'gravarChaveDeAtivacao',
        idDaConta,
        valor: valorGravado,
      });
      aplicar(idDaConta, { chaveDeAtivacao: valorGravado });
    },

    // Nenhum caso de US-5 a chama — gravar a senha e US-4 (CA-4.4). Esta aqui
    // porque o contrato a declara, e e por isso que ela entra na sequencia de
    // escritas que `UT-007-4` compara: se a falha a chamasse, apareceria.
    gravarSenhaEApagarChave(idDaConta, senhaHash) {
      escritas.push({
        operacao: 'gravarSenhaEApagarChave',
        idDaConta,
        valor: senhaHash,
      });
      aplicar(idDaConta, { chaveDeAtivacao: '' });
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

  // Sem `prazoDaChave` e sem `ganchos`: o que os quatro casos exercitam e o
  // default de fabrica, que e o que o P6 manda afirmar.
  const contextoDoPedido: ContextoDoPedidoDeRedefinicao = {
    relogio,
    contas,
    email: passoTres,
    gerador,
    hashDaChave: HASH_DA_CHAVE,
    montagemDoEmail: MONTAGEM_DO_EMAIL,
  };

  return {
    pedir: (identificador = LOGIN) =>
      solicitarRedefinicaoDeSenha({ identificador }, contextoDoPedido),
    tentativas,
    relatos,
    registradas,
    escritas,
    chavesGeradas,
    linha(idDaConta = ID_DA_CONTA) {
      const linha = linhas.get(idDaConta);
      assert.ok(linha !== undefined, `a montagem nao tem a conta ${idDaConta}`);
      return linha;
    },
    falharCom(motivo) {
      motivoDoCanal = motivo;
    },
    relogioEm(instante) {
      agora = instante;
    },
  };
}

/** O unico relato de passo 3 que aquela montagem produziu. */
function relatoUnico(montagem: Montagem): ResultadoDoEnvioDeRedefinicao {
  assert.equal(
    montagem.relatos.length,
    1,
    'o pedido tem de atravessar o passo 3 de UC-20 exatamente uma vez',
  );
  const relato = montagem.relatos[0];
  assert.ok(relato !== undefined);
  return relato;
}

/** O que o pedido devolveu, quando ele foi aceito. */
function envioDoPedido(
  resultado: ResultadoDoPedidoDeRedefinicao,
): { readonly enviado: boolean } {
  assert.equal(
    resultado.aceito,
    true,
    'o pedido foi recusado antes do passo 3: nenhum caso de US-5 e sobre recusa de pedido',
  );
  assert.ok(resultado.aceito);
  return resultado.envio;
}

/*
  ── UT-007-1 ────────────────────────────────────────────────────────────────

  CA-5.1 — *"Falha no envio devolve ao requisitante um aviso distinto do caso de
  sucesso"*.

  entrada:  a conta `ada`, o relogio em AGORA, e duas montagens por lado do
            conflito: numa o canal FALHA com `SMTP connect() failed`, na outra
            ele entrega
  acao:     pedir a redefinicao pelo login, uma vez em cada montagem
  esperado: a tentativa aconteceu nas duas; e o aviso ao requisitante e
            - no lado da spec (`ca-5-1-aviso-distinto`): `falha-de-envio` contra
              `confirmacao-de-envio` — **distinto**, que e o que CA-5.1 pede;
            - no lado de UC-20 (`uc-20-silencioso`): `confirmacao-de-envio` nos
              dois — **igual**, que e *"o assinante nao tem como saber"*.

  🔴 Este caso e o unico lugar da suite em que os dois lados divergem, e e de
  proposito: a PARADA do cabecalho nao e decidida aqui. O que vale nos DOIS e o
  fato — o relato do passo 3 sabe que o envio nao saiu (`enviado: false`) e
  carrega o motivo do canal —, e isso tambem esta afirmado abaixo.
*/

test('UT-007-1 a falha no envio devolve aviso distinto do sucesso (CA-5.1)', () => {
  for (const lado of OS_DOIS_LADOS) {
    const comFalha = montar(lado);
    comFalha.falharCom(MOTIVO_DO_CANAL);
    envioDoPedido(comFalha.pedir());

    const comSucesso = montar(lado);
    envioDoPedido(comSucesso.pedir());

    // A tentativa aconteceu nas duas: sem ela nao ha falha de envio, ha outra
    // coisa.
    assert.equal(
      comFalha.tentativas.length,
      1,
      'o pedido tem de tentar enviar uma vez',
    );
    assert.equal(comSucesso.tentativas.length, 1);

    const falhou = relatoUnico(comFalha);
    const saiu = relatoUnico(comSucesso);

    // O fato, igual nos dois lados: o passo 3 sabe que o envio nao saiu e
    // carrega o motivo que o canal informou.
    assert.equal(falhou.enviado, false);
    assert.equal(falhou.enviado === false ? falhou.motivo : null, MOTIVO_DO_CANAL);
    assert.equal(saiu.enviado, true);
    assert.equal(saiu.avisoAoRequisitante, 'confirmacao-de-envio');

    if (lado === 'ca-5-1-aviso-distinto') {
      // `spec.md` CA-5.1 e `plan.md` § *Contratos*.
      assert.equal(falhou.avisoAoRequisitante, 'falha-de-envio');
      assert.notEqual(falhou.avisoAoRequisitante, saiu.avisoAoRequisitante);
    } else {
      // UC-20 § *Excecoes*, 🟢 confirmado: *"o assinante nao tem como saber"*.
      assert.equal(falhou.avisoAoRequisitante, 'confirmacao-de-envio');
      assert.equal(falhou.avisoAoRequisitante, saiu.avisoAoRequisitante);
    }
  }
});

/*
  ── UT-007-2 ────────────────────────────────────────────────────────────────

  CA-5.2 — *"A falha fica registrada com instante, destinatario e motivo
  informado pelo canal de envio"*.

  entrada:  a mesma conta, o canal FALHANDO com `SMTP connect() failed`, e o
            relogio movido para um instante DISTINTO do de partida da montagem
  acao:     pedir a redefinicao pelo login
  esperado: exatamente um registro, com os tres fatos e nenhum a mais — o
            instante do relogio controlado em segundos inteiros, o e-mail DA
            CONTA como destinatario, e o motivo do canal byte a byte; e nada
            registrado quando o envio sai

  Os tres fatos, e **nenhum a mais**, porque o P6 recusa numero que o legado nao
  tem: nada de contagem de tentativa, de prazo de retencao ou de janela. O
  instante vem da porta de relogio e nao de `Date.now()`, ou o P4 — *"teste por
  atestado que fixa prazo e forca, com relogio controlado"* — nao seria
  conferivel. E o destinatario e o e-mail da conta, nao o identificador que o
  requisitante digitou: o pedido foi feito pelo **login**, e UC-20 passo 3 envia
  *"ao e-mail da conta"*.

  CA-5.2 nao esta no conflito de CA-5.1, e e por isso que este caso roda igual
  nos dois lados.
*/

test('UT-007-2 a falha registra instante, destinatario e motivo do canal (CA-5.2)', () => {
  const instanteDaFalha = AGORA + 4 * 60 * 60;

  for (const lado of OS_DOIS_LADOS) {
    const montagem = montar(lado);
    montagem.relogioEm(instanteDaFalha);
    montagem.falharCom(MOTIVO_DO_CANAL);

    montagem.pedir();

    assert.deepEqual(montagem.registradas, [
      {
        instanteEmSegundos: instanteDaFalha,
        destinatarios: [EMAIL],
        motivo: MOTIVO_DO_CANAL,
      },
    ]);

    // E e o instante do pedido, nao o de partida da montagem: um registro que
    // carregasse AGORA estaria lendo outro relogio.
    assert.notEqual(montagem.registradas[0]?.instanteEmSegundos, AGORA);

    // O destinatario registrado e o mesmo a quem o canal foi mandado enviar.
    assert.deepEqual(montagem.tentativas[0]?.destinatarios, [EMAIL]);

    // O caminho de sucesso nao registra nada: CA-5.2 e sobre a falha.
    const comSucesso = montar(lado);
    comSucesso.relogioEm(instanteDaFalha);
    comSucesso.pedir();
    assert.deepEqual(comSucesso.registradas, []);
  }
});

/*
  ── UT-007-3 ────────────────────────────────────────────────────────────────

  CA-5.3 — *"Pedir de novo apos a falha gera uma chave nova e uma tentativa nova
  de envio"*.

  entrada:  a mesma conta; o primeiro pedido com o canal FALHANDO, o segundo um
            minuto depois com o canal funcionando
  acao:     pedir a redefinicao duas vezes, pelo mesmo login
  esperado: duas tentativas, as duas para o e-mail da conta; a chave em claro da
            segunda mensagem e OUTRA; a conta passa a guardar o resumo da chave
            nova, com o instante do segundo pedido — a anterior deixou de valer;
            e o segundo relato e o de sucesso, sem registro novo de falha

  A chave e lida do CORPO DA MENSAGEM porque CA-4.1 fixa que o valor em claro
  *"so existe no e-mail enviado"* — na conta ela vive com hash. E o fluxo
  alternativo de UC-20, *"Pedido repetido antes do prazo"*, e exatamente sobre
  isto: *"uma chave nova e gerada e substitui a anterior; o link antigo deixa de
  valer"*.

  Nada fica latchado pela falha, e e isso que faz CA-5.3 passar: nenhum contador,
  nenhuma marca de "ja falhou", nenhuma espera. `do-not-rewrite.md` poe `REQ-005`
  e `REQ-160` fora do pacote e o P6 poe limite de taxa fora do nucleo.
*/

test('UT-007-3 pedir de novo apos a falha gera chave nova e tentativa nova (CA-5.3)', () => {
  for (const lado of OS_DOIS_LADOS) {
    const montagem = montar(lado);

    // Primeiro pedido: o canal falha.
    montagem.falharCom(MOTIVO_DO_CANAL);
    const primeiro = envioDoPedido(montagem.pedir());
    assert.equal(
      primeiro.enviado,
      false,
      'o primeiro pedido tinha de falhar no envio para este caso fazer sentido',
    );

    // Segundo pedido, um minuto depois, com o canal funcionando.
    const instanteDoSegundo = AGORA + UM_MINUTO;
    montagem.relogioEm(instanteDoSegundo);
    montagem.falharCom(null);
    const segundo = envioDoPedido(montagem.pedir());

    // Tentativa nova: sao duas, nao uma reaproveitada, e as duas para o e-mail
    // da conta.
    assert.equal(montagem.tentativas.length, 2);
    assert.deepEqual(montagem.tentativas[0]?.destinatarios, [EMAIL]);
    assert.deepEqual(montagem.tentativas[1]?.destinatarios, [EMAIL]);

    // Chave nova: duas chaves em claro foram emitidas, sao diferentes, e cada
    // mensagem leva a sua.
    assert.equal(montagem.chavesGeradas.length, 2);
    const [chaveUm, chaveDois] = montagem.chavesGeradas;
    assert.ok(chaveUm !== undefined && chaveDois !== undefined);
    assert.notEqual(chaveUm, chaveDois);
    assert.ok(montagem.tentativas[0]?.corpo.includes(chaveUm));
    assert.ok(montagem.tentativas[1]?.corpo.includes(chaveDois));

    // E a chave nova SUBSTITUIU a anterior na conta: a coluna e uma so, e o que
    // sobrou e o resumo da segunda, com o instante do segundo pedido.
    assert.deepEqual(
      montagem.escritas.map((e) => e.operacao),
      ['gravarChaveDeAtivacao', 'gravarChaveDeAtivacao'],
    );
    const gravada = lerChaveGravada(montagem.linha().chaveDeAtivacao);
    assert.ok(gravada !== null, 'a conta ficou sem chave pendente nenhuma');
    assert.equal(gravada.instanteDoPedido, instanteDoSegundo);
    assert.equal(gravada.resumo, HASH_DA_CHAVE.gerar(chaveDois));
    assert.notEqual(gravada.resumo, HASH_DA_CHAVE.gerar(chaveUm));

    // E o segundo relato e o de sucesso: a falha anterior nao o contaminou, e
    // nenhum registro novo saiu.
    assert.equal(segundo.enviado, true);
    assert.equal(montagem.relatos[1]?.avisoAoRequisitante, 'confirmacao-de-envio');
    assert.equal(montagem.registradas.length, 1);
  }
});

/*
  ── UT-007-4 — a regra de negocio ───────────────────────────────────────────

  `D3` / BR-MIGRAR-040 — *"Falha de envio de e-mail e estado, nao excecao"* — na
  leitura que vale para ESTE fluxo. `spec.md` qualifica a regra na propria linha
  em que a lista para US-5: *"o fluxo de privacidade ja faz assim; **este fluxo
  nao faz**"*. Logo ela tem tres partes, e as tres sao afirmaveis:

  1. **nao e excecao** — a falha volta como valor e o fluxo chega ao fim
     (`AD-06`: *"falha de negocio e VALOR DE RETORNO, nao excecao"*);
  2. **nao e retry** — `AD-06` declara *"zero broker, zero DLQ, zero retry
     generico"*: uma tentativa por pedido, nem duas. A politica de nova tentativa
     do legado e pedir de novo, que e CA-5.3 e esta em `UT-007-3`;
  3. **nao e estado, NESTE fluxo** — UC-20 § *Excecoes*: *"nenhum estado registra
     a falha de envio neste fluxo"*. O `request-failed` de BR-MIGRAR-040 e do
     fluxo de **privacidade** (`wp-admin/includes/privacy-tools.php:226`), e o
     cenario de paridade dele esta em
     `parity_tests/12-solicitacao-de-dado-pessoal.feature`, nao na area desta
     feature (`parity_tests/06-autenticacao-e-sessao.feature`, `PT-006`, que
     cobre UC-20 e **nao** tem cenario de falha de envio).

  entrada:  duas montagens iguais, mesma conta e relogio no mesmo instante: numa
            o canal falha, na outra ele entrega; mais uma terceira, igual a da
            falha, cujo registro de CA-5.2 faz trabalho de verdade
  acao:     pedir a redefinicao uma vez em cada
  esperado: nenhuma lanca; uma tentativa de envio em cada; a SEQUENCIA DE
            ESCRITAS de conta e a MESMA nos dois caminhos — a falha nao
            acrescenta nem desfaz nada —; e o relato nao muda conforme o registro
            trabalhe ou nao

  A ultima parte e o **P7** em letra: *"nenhuma ramificacao do codigo testa o
  resultado de escrever log"*. E ela que faz CA-5.2 (*"a falha fica registrada"*)
  e UC-20 (*"nenhum estado registra a falha"*) caberem juntos — o registro e so
  escrita, nao estado de dominio. Se a decisao humana disser que CA-5.2 queria
  estado persistido e consultavel, e ESTE caso que muda; ver a PARADA.
*/

test('UT-007-4 a falha de envio e valor, nao excecao, nao vira retry e nao cria estado neste fluxo (D3 / BR-MIGRAR-040)', () => {
  for (const lado of OS_DOIS_LADOS) {
    const comFalha = montar(lado);
    comFalha.falharCom(MOTIVO_DO_CANAL);

    const comSucesso = montar(lado);

    // Parte 1 — nao e excecao. O fluxo chega ao fim e devolve valor.
    let resultadoDaFalha: ResultadoDoPedidoDeRedefinicao | undefined;
    assert.doesNotThrow(() => {
      resultadoDaFalha = comFalha.pedir();
    }, 'a falha de envio lancou excecao: D3 a poe como valor devolvido, e AD-06 recusa transformar isso em fluxo de erro');
    assert.ok(resultadoDaFalha !== undefined);
    assert.equal(envioDoPedido(resultadoDaFalha).enviado, false);
    assert.equal(envioDoPedido(comSucesso.pedir()).enviado, true);

    // Parte 2 — nao e retry. Uma tentativa por pedido, nos dois caminhos.
    assert.equal(
      comFalha.tentativas.length,
      1,
      'o pedido tentou enviar mais de uma vez: AD-06 recusa retry de infraestrutura, ' +
        'e a politica de nova tentativa do legado e pedir de novo (CA-5.3)',
    );
    assert.equal(comSucesso.tentativas.length, 1);

    // Parte 3 — nao e estado. A unica escrita do fluxo e a chave do passo 2 de
    // UC-20, que acontece ANTES do envio e portanto sai igual nos dois
    // caminhos: a falha nao acrescenta comando nenhum, e tambem nao desfaz o
    // que o passo 2 gravou — e por isso que o fluxo alternativo de UC-20 fala em
    // SUBSTITUIR a chave anterior em vez de criar a primeira.
    assert.deepEqual(
      comFalha.escritas,
      comSucesso.escritas,
      'o caminho da falha emitiu escrita que o caminho do sucesso nao emite. ' +
        'UC-20 e literal: "nenhum estado registra a falha de envio neste fluxo, ao contrario do que ' +
        'acontece na solicitacao de dados pessoais". Levar este fluxo a um estado de falha persistido e ' +
        'divergencia de comportamento observavel e exige decisao humana registrada (P1) — ver a PARADA ' +
        'no cabecalho desta suite.',
    );
    assert.equal(comFalha.escritas.length, 1);
    assert.notEqual(comFalha.linha().chaveDeAtivacao, '');

    // Parte 3, corolario (P7): o registro de CA-5.2 e so escrita. O relato nao
    // muda conforme ele trabalhe ou nao, logo nenhuma ramificacao depende dele.
    const linhasDeRegistro: string[] = [];
    const comRegistroAtivo = montar(lado, (falha) => {
      linhasDeRegistro.push(JSON.stringify(falha));
    });
    comRegistroAtivo.falharCom(MOTIVO_DO_CANAL);
    comRegistroAtivo.pedir();

    assert.deepEqual(relatoUnico(comRegistroAtivo), relatoUnico(comFalha));
    assert.equal(linhasDeRegistro.length, 1);
  }
});
