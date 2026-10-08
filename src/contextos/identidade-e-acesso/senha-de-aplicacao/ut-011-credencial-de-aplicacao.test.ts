/**
 * A entrega de **T022**: *"6 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-011-1, UT-011-2, UT-011-3, UT-011-4, UT-011-5,
 * UT-011-6), com o mesmo dado de entrada, acao e resultado esperado. O teste de
 * regra de negocio (UT-011-6) entra na mesma suite."*
 *
 * ✅ **O catalogo EXISTE nesta arvore, e os seis casos foram COPIADOS dele, nao
 * reconstruidos.** Isto e a diferenca com T008, T016 e T020, que acharam
 * `backlog/tests.md` ausente e reconstruiram os casos declarando a lacuna — ver o
 * cabecalho de `../autorizacao/ut-016-capacidades-por-extensao.test.ts`. O arquivo
 * chegou depois, e a tabela de `REQ-011` — *"`should` · `pronto` · veredito
 * `aprovado` · 5 de 5 critérios de aceite cobertos"* — da os seis casos com nome,
 * tipo e prova:
 *
 * | caso | tipo | nome no catalogo | prova que o catalogo cita |
 * |---|---|---|---|
 * | `UT-011-1` | `feliz` | gera credencial de 24 caracteres guardando apenas o hash | CA-10.1 |
 * | `UT-011-2` | `borda` | devolve o segredo em claro uma unica vez e nao o recupera depois | CA-10.2 |
 * | `UT-011-3` | `erro` | faz a chamada seguinte deixar de autenticar quando a credencial e revogada | CA-10.3 |
 * | `UT-011-4` | `erro` | recusa administrar a credencial de outra conta sem a permissao de editá-la | CA-10.4 |
 * | `UT-011-5` | `feliz` | guarda nome descritivo, instante de criacao e instante do ultimo uso | CA-10.5 |
 * | `UT-011-6` | `feliz` | gera o segredo pelo sistema em lugar de aceitar o escolhido pelo ator | `U6` (BR-MIGRAR-026) |
 *
 * **O que o catalogo NAO da, e de onde veio:** ele registra o nome, o tipo e a
 * prova de cada caso, e nao o dado de entrada literal — nenhum dos 985 casos o
 * registra, porque *"nenhum deles cita arquivo, classe ou framework: a stack do
 * sistema novo ainda nao foi escolhida"*. O dado de entrada de cada teste daqui sai
 * do fluxo de **UC-22** (assinante, no proprio perfil, com um nome descritivo), dos
 * criterios de `spec.md` e da regra `U6`. Nenhuma assercao inventa comportamento:
 * cada uma afirma a frase da coluna *Prova*.
 *
 * ---
 *
 * # Nao e a suite de T021
 *
 * `./us-10-credencial-de-aplicacao.test.ts` e a suite da **entrega** de T021: ela
 * afirma os cinco criterios, a ordem dos passos de cada operacao, a ordem dos dois
 * pontos de extensao e os **bytes** gravados em `usermeta`. O cabecalho dela ja
 * declara a fronteira: *"os seis casos registrados em `backlog/tests.md` (UT-011-1
 * a UT-011-6) sao de T022, e nao estao aqui"*. Esta suite e a do **catalogo**: seis
 * testes, um por caso, com a frase do caso no nome.
 *
 * # 🔴 A fronteira com REQ-012, que UT-011-3 encosta e esta tarefa NAO atravessa
 *
 * `UT-011-3` diz *"faz a chamada seguinte deixar de autenticar"*, e **quem
 * autentica com a credencial e REQ-012**, que ficou na coluna `refinamento` e nao
 * entrou neste pacote — e a segunda *Pergunta em aberto* de `spec.md`: *"Construir
 * a emissao sem o consumo, ou esperar REQ-012?"*. A pergunta segue aberta; T021
 * construiu a emissao e a revogacao, e nada nesta arvore autentica.
 *
 * Logo o teste prova o que e observavel **deste lado**: depois da revogacao, nao
 * sobra, no que esta gravado, resumo contra o qual a chamada seguinte pudesse
 * conferir o segredo. A conferencia em si entra como {@link conferenciaDaChamada},
 * que e **duble desta suite e nao e REQ-012**: ela faz uma coisa so — a comparacao
 * que `UT-012-1` descreve, *"compara a credencial informada com cada credencial
 * ativa da conta"* —, mora no arquivo de teste, e nao acrescenta superficie nenhuma
 * ao sistema. Quando REQ-012 chegar, o teste de autenticacao e dele; este continua
 * sendo o da revogacao.
 *
 * # ⚠️ Duas discordancias entre documentos, registradas e NAO resolvidas aqui
 *
 * 1. **`parity_tests/06-autenticacao-e-sessao.feature`, cenario *"A senha de
 *    aplicacao e credencial de segunda classe, por desenho"*, termina com *"E esse
 *    conjunto e menor que o da sessao nas duas"*.** Isso contradiz
 *    `target_business_rules.md` BR-MIGRAR-026 (*"Autenticar com ela **nao** reduz as
 *    capacidades do usuario"*), UC-22 (*"nao reduz capacidade alguma... um programa
 *    com a senha de aplicacao de um administrador e um administrador"*) e o proprio
 *    catalogo, em `UT-012-3` e `UT-012-7`. **A contradicao e sobre REQ-012, nao
 *    sobre US-10**: ela decide o que acontece em quem **usa** a credencial, e nao em
 *    quem a emite ou revoga. Nenhum teste desta suite depende de qual dos dois lados
 *    vale, e esta suite **nao escolhe**: escolher seria decidir no lugar de quem
 *    decide (**P1**, e a linha *"Mudar regra de negocio documentada"* de *Nao
 *    negociavel*). Fica escrito aqui para que quem construir REQ-012 encontre a
 *    divergencia antes de escrever o primeiro teste dela.
 * 2. **O algoritmo do resumo continua sem nome.** `ResumoDaSenhaDeAplicacao` e
 *    *"obrigatorio e sem valor padrao"* de proposito — *"o pacote nao nomeia o
 *    algoritmo"* —, e por isso {@link resumoDesteTeste} e escolha **desta suite**,
 *    nao do porte. Ela e so o que UT-011-1 e UT-011-3 exigem de uma funcao de
 *    resumo: que o segredo nao apareca nela, e que o mesmo segredo produza o mesmo
 *    resumo. Trocar o algoritmo do porte nao muda nenhuma assercao daqui.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  casoDeConta,
  comAtor,
  perguntarPermissao,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type CasoDeTraducao,
  type FonteDeContaNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  arranjo,
  serializarComoTexto,
} from '../../../plataforma/serializacao/index.js';
import { matrizDeAutorizacao } from '../autorizacao/fonte-de-papeis.js';
import {
  CHAVE_DE_SENHAS_DE_APLICACAO,
  camposGravaveisDeSenhaDeAplicacao,
  criarRepositorioDeSenhasDeAplicacao,
  lerCamposDeSenhaDeAplicacao,
  povoarPapeis,
  type MetadadoDeConta,
  type RegistroDeSenhaDeAplicacao,
  type RepositorioDeMetadadosDeConta,
} from '../armazenamento/index.js';
import {
  ALFABETO_DE_SEGREDO,
  type FonteDeAleatoriedade,
} from '../cadastro/geracao-de-segredo.js';
import type { ValorDeColuna } from '../portas/index.js';
import {
  CAPACIDADE_DE_EDICAO_DE_CONTA,
  casoDeSenhaDeAplicacao,
} from './autorizacao-de-senha-de-aplicacao.js';
import type { ContextoDeSenhaDeAplicacao } from './contexto-de-senha-de-aplicacao.js';
import {
  CAPACIDADE_DE_EMISSAO,
  emitirCredencialDeAplicacao,
} from './emitir-credencial.js';
import { COMPRIMENTO_DA_SENHA_DE_APLICACAO } from './geracao-de-credencial.js';
import {
  CAPACIDADE_DE_REVOGACAO,
  revogarCredencialDeAplicacao,
} from './revogar-credencial.js';

/** O assinante do fluxo principal de UC-22, no proprio perfil. */
const TITULAR = 7;
/** A conta do fluxo alternativo *"Administrador gerencia a senha de outro"*. */
const OUTRA_CONTA = 9;
/** O administrador do mesmo fluxo alternativo. */
const ADMINISTRADOR = 1;
/** O relogio de partida: fixo, porque CA-10.5 fala de instante gravado. */
const AGORA = 1_700_000_000;

/* ────────────────────────────────────────────────────────────────────────────
   O DUBLE DE `usermeta`, e as regras de `perfil.ts` que ele reproduz
   ──────────────────────────────────────────────────────────────────────────── */

interface BancoDeMetadados {
  readonly perfil: RepositorioDeMetadadosDeConta;
  /** O valor da linha de credenciais daquela conta, como texto. */
  valorGravado(contaId: number): string | null;
  /** Quantas linhas de credenciais existem para aquela conta. */
  linhas(contaId: number): number;
  /** Cada escrita que chegou ao `usermeta`, na ordem. */
  readonly gravacoes: string[];
  /** Poe no banco uma linha que o legado ja tinha gravado antes desta arvore. */
  semear(contaId: number, valor: string): void;
}

/**
 * `usermeta` em memoria: o repositorio de T021 roda de verdade sobre ele.
 *
 * O armazenamento nao e simulado porque os seis casos falam do que **fica
 * guardado** — *"guardando apenas o hash"*, *"nao o recupera depois"*, *"guarda
 * nome descritivo"* —, e a area 3 do critério de paridade compara **efeito no
 * banco**, com tolerancia zero.
 */
function usermetaEmMemoria(): BancoDeMetadados {
  const tabela: MetadadoDeConta[] = [];
  const gravacoes: string[] = [];
  let proximoId = 1;

  function selecionar(contaId: number, chave: string): MetadadoDeConta[] {
    return tabela.filter(
      (linha) => linha.contaId === contaId && linha.chave === chave,
    );
  }

  const perfil: RepositorioDeMetadadosDeConta = {
    listar(contaId) {
      return tabela.filter((linha) => linha.contaId === contaId);
    },
    obter(contaId, chave) {
      return selecionar(contaId, chave);
    },
    // `add_user_meta`: sempre insere, inclusive com a chave repetida.
    acrescentar(contaId, chave, valor) {
      const id = proximoId;
      proximoId += 1;
      tabela.push({ id, contaId, chave, valor });
      return id;
    },
    gravar(contaId, chave, valor) {
      const existentes = selecionar(contaId, chave);
      // A regra 2 de `perfil.ts`: uma linha com valor identico nao escreve nada,
      // e e esse `false` que as duas operacoes transformam em `db_error`.
      if (
        existentes.length === 1 &&
        textoDe(existentes[0]!.valor) === textoDe(valor)
      ) {
        return false;
      }
      gravacoes.push(textoDe(valor));
      if (existentes.length === 0) {
        tabela.push({ id: proximoId, contaId, chave, valor });
        proximoId += 1;
        return true;
      }
      for (const linha of existentes) {
        tabela[tabela.indexOf(linha)] = { ...linha, valor };
      }
      return true;
    },
    apagar(contaId, chave) {
      const alvos = selecionar(contaId, chave);
      for (const linha of alvos) {
        tabela.splice(tabela.indexOf(linha), 1);
      }
      return alvos.length;
    },
    apagarPorId(metadadoId) {
      const alvo = tabela.find((linha) => linha.id === metadadoId);
      if (alvo === undefined) {
        return 0;
      }
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
    valorGravado(contaId) {
      const linha = selecionar(contaId, CHAVE_DE_SENHAS_DE_APLICACAO)[0];
      return linha === undefined ? null : textoDe(linha.valor);
    },
    linhas(contaId) {
      return selecionar(contaId, CHAVE_DE_SENHAS_DE_APLICACAO).length;
    },
    gravacoes,
    semear(contaId, valor) {
      const id = proximoId;
      proximoId += 1;
      tabela.push({ id, contaId, chave: CHAVE_DE_SENHAS_DE_APLICACAO, valor });
    },
  };
}

function textoDe(valor: ValorDeColuna): string {
  if (valor instanceof Uint8Array) {
    return new TextDecoder().decode(valor);
  }
  return valor === null ? '' : String(valor);
}

/* ────────────────────────────────────────────────────────────────────────────
   OS DOIS DUBLES QUE PRECISAM DE RESSALVA: o resumo e a conferencia
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * O resumo desta suite. **Escolha do teste, nao do porte** — ver a ressalva 2 do
 * cabecalho.
 *
 * Duas propriedades, e sao as unicas de que os casos precisam: o segredo nao
 * aparece no resultado, e o mesmo segredo produz o mesmo resumo.
 */
function resumoDesteTeste(segredo: string): string {
  return createHash('sha256').update(segredo).digest('hex');
}

/**
 * A comparacao que a **chamada seguinte** faria. **Duble desta suite, e nao
 * REQ-012** — ver a fronteira no cabecalho.
 *
 * Faz uma coisa so, a de `UT-012-1`: resume o segredo apresentado e procura por
 * ele entre as credenciais **ativas** da conta. Devolve o identificador da que
 * casou, ou `null` — que e o estado em que a chamada *"deixa de autenticar"*.
 */
function conferenciaDaChamada(
  registros: readonly RegistroDeSenhaDeAplicacao[],
  segredoApresentado: string,
): string | null {
  const procurado = resumoDesteTeste(segredoApresentado);
  for (const registro of registros) {
    const campos = lerCamposDeSenhaDeAplicacao(registro.campos);
    if (campos.resumo === procurado) {
      return campos.identificador;
    }
  }
  return null;
}

/* ────────────────────────────────────────────────────────────────────────────
   O CENARIO
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Um sorteio determinista que **avanca**: o segredo da segunda emissao e
 * diferente do da primeira, que e o que `UT-011-2` precisa observar.
 */
function sorteioEmSequencia(): FonteDeAleatoriedade {
  let proximo = 0;
  return (limiteExclusivo) => {
    const valor = proximo % limiteExclusivo;
    proximo += 1;
    return valor;
  };
}

/** O segredo que {@link sorteioEmSequencia} produz na n-esima emissao. */
function segredoEsperado(ordem: number): string {
  let esperado = '';
  for (
    let posicao = 0;
    posicao < COMPRIMENTO_DA_SENHA_DE_APLICACAO;
    posicao += 1
  ) {
    const indice =
      (ordem * COMPRIMENTO_DA_SENHA_DE_APLICACAO + posicao) %
      ALFABETO_DE_SEGREDO.length;
    esperado += ALFABETO_DE_SEGREDO.charAt(indice);
  }
  return esperado;
}

function assinante(contaId: number): AtorDeAutorizacao {
  return {
    contaId,
    login: 'ada',
    existe: true,
    concessoes: [{ capacidade: 'subscriber', concedida: true }],
  };
}

function administrador(): AtorDeAutorizacao {
  return {
    contaId: ADMINISTRADOR,
    login: 'root',
    existe: true,
    concessoes: [{ capacidade: 'administrator', concedida: true }],
  };
}

/**
 * As tres leituras dos `case` de conta.
 *
 * Fora da rede nenhuma delas e avaliada — o curto-circuito e o do legado —, e
 * por isso as tres lançam: se alguma for lida num cenario de site unico, o teste
 * acusa em vez de passar por engano.
 */
const FONTE_DE_CONTA_FORA_DA_REDE: FonteDeContaNaAutorizacao = {
  ehSuperAdmin() {
    throw new Error('fora da rede nao existe super administrador (PERM-9)');
  },
  temCapacidade() {
    throw new Error('o ramo de rede do `case` de conta nao deveria ser lido');
  },
  adicaoDeContaLiberadaNaRede() {
    throw new Error('a opcao de rede nao e lida fora da rede (N6)');
  },
};

interface Cenario {
  readonly contexto: ContextoDeSenhaDeAplicacao;
  readonly banco: BancoDeMetadados;
  avancarRelogio(segundos: number): void;
}

interface OpcoesDoCenario {
  readonly ator?: AtorDeAutorizacao;
  /** Para dois atores sobre o MESMO banco, como em `UT-011-4`. */
  readonly banco?: BancoDeMetadados;
}

/**
 * A composicao de uma requisicao.
 *
 * Os casos de `edit_user` entram **duas vezes**, e e assim que
 * `casoDeSenhaDeAplicacao` manda compor: na cadeia do contexto, porque
 * `edit_user` tambem e perguntado direto, e na reentrada do caso de credencial,
 * porque e por ela que o atalho de `PERM-6` passa. Quem decide `edit_user` e o
 * `casoDeConta` de T023, que e o `case` do legado — e nao um duble: `UT-011-4`
 * afirma *"a mesma permissao de editá-la"*, logo tem de ser a mesma funcao.
 */
function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const banco = opcoes.banco ?? usermetaEmMemoria();
  const contasExistentes = new Set([TITULAR, OUTRA_CONTA, ADMINISTRADOR]);
  const casosDeConta: readonly CasoDeTraducao[] = [
    casoDeConta(FONTE_DE_CONTA_FORA_DA_REDE),
  ];

  const base: BaseDeAutorizacao = {
    matriz: matrizDeAutorizacao(povoarPapeis('legado-integral')),
    rede: REDE_INATIVA_NA_AUTORIZACAO,
    casosDeTraducao: [
      casoDeSenhaDeAplicacao({
        contaExiste: (contaId) => contasExistentes.has(contaId),
        casosDeEdicaoDeConta: casosDeConta,
      }),
      ...casosDeConta,
    ],
  };

  let agora = AGORA;
  let identificadores = 0;

  const contexto: ContextoDeSenhaDeAplicacao = {
    relogio: { agoraEmSegundos: () => agora },
    credenciais: criarRepositorioDeSenhasDeAplicacao(banco.perfil),
    autorizacao: comAtor(base, opcoes.ator ?? assinante(TITULAR)),
    resumo: { gerar: resumoDesteTeste },
    // O saneamento de `plataforma/` nao existe nesta arvore: aqui vale o que
    // corta as pontas, o bastante para os casos deste catalogo.
    sanitizarTexto: (texto) => texto.trim(),
    aleatorio: sorteioEmSequencia(),
    gerarIdentificador: () => {
      identificadores += 1;
      return `uuid-${identificadores}`;
    },
  };

  return {
    contexto,
    banco,
    avancarRelogio(segundos) {
      agora += segundos;
    },
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   UT-011-1 · feliz
   "gera credencial de 24 caracteres guardando apenas o hash"
   Prova: "A credencial e gerada pelo sistema com 24 caracteres e apenas o hash
   e guardado" (CA-10.1)
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-011-1 gera credencial de 24 caracteres guardando apenas o hash (CA-10.1)', () => {
  const { contexto, banco } = cenario();

  // Entrada: o passo 1 de UC-22 — o assinante pede, no proprio perfil, com um
  // nome descritivo.
  const resultado = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Leitor de feed' },
    contexto,
  );

  assert.ok(resultado.emitida);

  // 1. Os 24 caracteres, no numero de fabrica do legado e no alfabeto sem
  //    caractere especial.
  assert.equal(resultado.segredo.length, 24);
  assert.equal(resultado.segredo.length, COMPRIMENTO_DA_SENHA_DE_APLICACAO);
  assert.match(resultado.segredo, /^[A-Za-z0-9]{24}$/);

  // 2. "apenas o hash e guardado": o que esta no banco e o resumo, e o segredo
  //    nao aparece em byte nenhum da linha.
  const guardado = banco.valorGravado(TITULAR);
  assert.ok(guardado !== null);
  assert.ok(guardado.includes(resumoDesteTeste(resultado.segredo)));
  assert.equal(
    guardado.includes(resultado.segredo),
    false,
    'o segredo nao pode estar nos bytes gravados',
  );

  // 3. E nao esta em campo nenhum do item lido de volta.
  const guardados = contexto.credenciais.obter(TITULAR);
  assert.equal(guardados.length, 1);
  const campos = lerCamposDeSenhaDeAplicacao(guardados[0]!.campos);
  assert.equal(campos.resumo, resumoDesteTeste(resultado.segredo));
  assert.equal(
    JSON.stringify(campos).includes(resultado.segredo),
    false,
    'nenhum campo do item guarda o segredo',
  );
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-011-2 · borda
   "devolve o segredo em claro uma unica vez e nao o recupera depois"
   Prova: "O segredo em claro e exibido uma unica vez e nao e recuperavel
   depois" (CA-10.2)
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-011-2 devolve o segredo em claro uma unica vez e nao o recupera depois (CA-10.2)', () => {
  const { contexto, banco } = cenario();

  // A unica vez: o retorno da emissao.
  const emissao = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Agenda' },
    contexto,
  );
  assert.ok(emissao.emitida);
  const segredo = emissao.segredo;
  const identificador = emissao.credencial.identificador;

  // 1. Pedir de novo com o mesmo nome nao e um segundo "exibir": e recusa por
  //    nome repetido, e nada e devolvido.
  const repetida = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Agenda' },
    contexto,
  );
  assert.ok(!repetida.emitida);
  assert.ok(repetida.motivo === 'recusada');
  assert.equal(repetida.erro.codigo, 'application_password_duplicate_name');

  // 2. Nenhuma leitura o devolve: nem o repositorio, nem os bytes do banco.
  assert.equal(
    JSON.stringify(contexto.credenciais.obter(TITULAR)).includes(segredo),
    false,
  );
  assert.equal(banco.valorGravado(TITULAR)?.includes(segredo), false);

  // 3. Nem a revogacao, que e a operacao que devolve o item **inteiro** como ele
  //    estava gravado — e e o ultimo lugar de onde um segredo poderia sair.
  const revogacao = revogarCredencialDeAplicacao(
    { contaId: TITULAR, identificador },
    contexto,
  );
  assert.ok(revogacao.revogada);
  assert.equal(
    JSON.stringify(revogacao.credencial).includes(segredo),
    false,
    'o item apagado nao carrega o segredo de volta',
  );

  // 4. A excecao de UC-22, que e a consequencia de tudo isto: *"senha perdida
  //    depois da exibicao: nao ha recuperacao. A unica saida e revogar e emitir
  //    outra"* — e a outra e OUTRO segredo, nao o mesmo.
  const outra = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Agenda' },
    contexto,
  );
  assert.ok(outra.emitida);
  assert.notEqual(outra.segredo, segredo);
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-011-3 · erro
   "faz a chamada seguinte deixar de autenticar quando a credencial e revogada"
   Prova: "Revogar a credencial faz a chamada seguinte que a use deixar de
   autenticar" (CA-10.3)
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-011-3 faz a chamada seguinte deixar de autenticar quando a credencial e revogada (CA-10.3)', () => {
  const { contexto, banco } = cenario();

  // Duas credenciais na mesma conta: uma e revogada, a outra nao — e o teste
  // afirma as duas, porque "deixar de autenticar" nao pode valer para todas.
  const doPrograma = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Leitor de feed' },
    contexto,
  );
  const daAgenda = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Agenda' },
    contexto,
  );
  assert.ok(doPrograma.emitida);
  assert.ok(daAgenda.emitida);

  // Antes: a chamada que apresenta o segredo encontra a credencial dele.
  assert.equal(
    conferenciaDaChamada(
      contexto.credenciais.obter(TITULAR),
      doPrograma.segredo,
    ),
    doPrograma.credencial.identificador,
  );

  // A acao: revogar aquela credencial.
  const revogacao = revogarCredencialDeAplicacao(
    { contaId: TITULAR, identificador: doPrograma.credencial.identificador },
    contexto,
  );
  assert.ok(revogacao.revogada);
  assert.equal(revogacao.credencial.nome, 'Leitor de feed');

  // Depois: a chamada seguinte nao encontra mais nada contra o que conferir — e
  // o passo 2 do fluxo alternativo *Revogar uma senha* de UC-22, *"as chamadas
  // em curso que a usavam param de autenticar na requisicao seguinte"*.
  assert.equal(
    conferenciaDaChamada(
      contexto.credenciais.obter(TITULAR),
      doPrograma.segredo,
    ),
    null,
    'o segredo revogado nao autentica a chamada seguinte',
  );

  // E a outra credencial da mesma conta continua valendo: a revogacao e por
  // item, e nao por conta.
  assert.equal(
    conferenciaDaChamada(contexto.credenciais.obter(TITULAR), daAgenda.segredo),
    daAgenda.credencial.identificador,
  );

  // O efeito no banco: o resumo revogado nao esta mais na linha, o outro esta.
  const guardado = banco.valorGravado(TITULAR);
  assert.ok(guardado !== null);
  assert.equal(guardado.includes(resumoDesteTeste(doPrograma.segredo)), false);
  assert.ok(guardado.includes(resumoDesteTeste(daAgenda.segredo)));
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-011-4 · erro
   "recusa administrar a credencial de outra conta sem a permissao de editá-la"
   Prova: "Administrar a credencial de outra conta exige a mesma permissao de
   editar aquela conta" (CA-10.4)
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-011-4 recusa administrar a credencial de outra conta sem a permissao de editá-la (CA-10.4)', () => {
  const banco = usermetaEmMemoria();

  // O administrador semeia uma credencial na conta alvo: a recusa do assinante
  // tem de vir ANTES da busca, e sem item gravado nao se distingue "sem
  // permissao" de "nao encontrou".
  const comoAdministrador = cenario({ banco, ator: administrador() });
  const semeada = emitirCredencialDeAplicacao(
    { contaId: OUTRA_CONTA, nome: 'Agenda de outro' },
    comoAdministrador.contexto,
  );
  assert.ok(semeada.emitida, 'quem pode editar a conta administra a credencial');

  const comoAssinante = cenario({ banco, ator: assinante(TITULAR) });
  const escritasAntes = banco.gravacoes.length;

  // 1. Emitir na conta de outro: recusado, e o motivo e a permissao.
  const emissao = emitirCredencialDeAplicacao(
    { contaId: OUTRA_CONTA, nome: 'Credencial alheia' },
    comoAssinante.contexto,
  );
  assert.ok(!emissao.emitida);
  assert.equal(emissao.motivo, 'sem-permissao');

  // 2. Revogar a de outro: idem — e o identificador existe, logo a recusa nao
  //    e "nao encontrei".
  const revogacao = revogarCredencialDeAplicacao(
    { contaId: OUTRA_CONTA, identificador: semeada.credencial.identificador },
    comoAssinante.contexto,
  );
  assert.ok(!revogacao.revogada);
  assert.equal(revogacao.motivo, 'sem-permissao');

  // 3. Nada foi escrito, e a credencial do outro continua la.
  assert.equal(banco.gravacoes.length, escritasAntes);
  assert.equal(comoAssinante.contexto.credenciais.obter(OUTRA_CONTA).length, 1);

  // 4. "a mesma permissao de editar aquela conta": para os dois atores, a
  //    resposta das duas capacidades de credencial e a MESMA de `edit_user`
  //    daquela conta — negada para o assinante, concedida para quem administra.
  for (const [quem, contexto] of [
    ['assinante', comoAssinante.contexto] as const,
    ['administrador', comoAdministrador.contexto] as const,
  ]) {
    const podeEditar = perguntarPermissao(
      contexto.autorizacao,
      CAPACIDADE_DE_EDICAO_DE_CONTA,
      OUTRA_CONTA,
    );
    assert.equal(
      perguntarPermissao(
        contexto.autorizacao,
        CAPACIDADE_DE_EMISSAO,
        OUTRA_CONTA,
      ),
      podeEditar,
      `emitir na conta alheia segue editar aquela conta (${quem})`,
    );
    assert.equal(
      perguntarPermissao(
        contexto.autorizacao,
        CAPACIDADE_DE_REVOGACAO,
        OUTRA_CONTA,
      ),
      podeEditar,
      `revogar na conta alheia segue editar aquela conta (${quem})`,
    );
  }

  // 5. E no proprio perfil o assinante administra: a recusa e sobre a conta de
  //    outro, e nao sobre o papel de quem pede.
  assert.ok(
    emitirCredencialDeAplicacao(
      { contaId: TITULAR, nome: 'Agenda' },
      comoAssinante.contexto,
    ).emitida,
  );
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-011-5 · feliz
   "guarda nome descritivo, instante de criacao e instante do ultimo uso"
   Prova: "Cada credencial guarda nome descritivo, instante de criacao e
   instante do ultimo uso" (CA-10.5)
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-011-5 guarda nome descritivo, instante de criacao e instante do ultimo uso (CA-10.5)', () => {
  const { contexto, banco, avancarRelogio } = cenario();

  const primeira = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Leitor de feed' },
    contexto,
  );
  assert.ok(primeira.emitida);

  // 1. O nome descritivo e o instante de criacao, no item lido de volta.
  const camposDaPrimeira = lerCamposDeSenhaDeAplicacao(
    contexto.credenciais.obter(TITULAR)[0]!.campos,
  );
  assert.equal(camposDaPrimeira.nome, 'Leitor de feed');
  assert.equal(camposDaPrimeira.criadoEm, AGORA);

  // 2. O instante de criacao e o da emissao, e nao uma constante: a segunda
  //    credencial nasce com o relogio onde ele estava quando ela nasceu.
  avancarRelogio(3_600);
  const segunda = emitirCredencialDeAplicacao(
    { contaId: TITULAR, nome: 'Agenda' },
    contexto,
  );
  assert.ok(segunda.emitida);
  assert.equal(segunda.credencial.criadoEm, AGORA + 3_600);

  // 3. O campo do ultimo uso existe no que e gravado e nasce **sem uso**: nada
  //    nesta arvore o escreve, porque quem usa a credencial e REQ-012 — ver a
  //    fronteira no cabecalho. O que esta tarefa guarda e o campo.
  assert.equal(camposDaPrimeira.ultimoUsoEm, null);
  assert.ok(banco.valorGravado(TITULAR)?.includes('"last_used";N;'));

  // 4. E o instante do ultimo uso, quando ele existe no que esta gravado, e
  //    lido de volta como ele esta — nao e perdido nem reposto por vazio. A
  //    linha semeada abaixo e uma credencial que o legado ja usou.
  const outroBanco = usermetaEmMemoria();
  outroBanco.semear(
    OUTRA_CONTA,
    serializarComoTexto(
      arranjo([
        {
          chave: { tipo: 'inteiro', valor: 0 },
          valor: camposGravaveisDeSenhaDeAplicacao({
            identificador: 'uuid-usado',
            aplicacaoId: '',
            nome: 'Programa antigo',
            resumo: resumoDesteTeste('segredo-de-antes'),
            criadoEm: AGORA - 86_400,
            ultimoUsoEm: AGORA - 60,
            ultimoIp: '203.0.113.7',
          }),
        },
      ]),
    ),
  );

  const comOutraConta = cenario({
    banco: outroBanco,
    ator: assinante(OUTRA_CONTA),
  });
  const usada = lerCamposDeSenhaDeAplicacao(
    comOutraConta.contexto.credenciais.obter(OUTRA_CONTA)[0]!.campos,
  );
  assert.equal(usada.nome, 'Programa antigo');
  assert.equal(usada.criadoEm, AGORA - 86_400);
  assert.equal(usada.ultimoUsoEm, AGORA - 60);
});

/* ────────────────────────────────────────────────────────────────────────────
   UT-011-6 · feliz · REGRA DE NEGOCIO
   "gera o segredo pelo sistema em lugar de aceitar o escolhido pelo ator"
   Prova: U6 — "senha de aplicacao e credencial de segunda classe por desenho:
   24 caracteres, hash em metadado, e sua administracao reusa a permissao de
   editar aquele usuario" (BR-MIGRAR-026)
   ──────────────────────────────────────────────────────────────────────────── */

test('UT-011-6 gera o segredo pelo sistema em lugar de aceitar o escolhido pelo ator (U6)', () => {
  const { contexto, banco } = cenario();

  // Entrada: um pedido que TENTA trazer o segredo escolhido. O contrato nao tem
  // campo para ele — e por isso o valor chega por fora do tipo, que e a unica
  // forma de uma borda conseguir enviá-lo.
  const escolhido = 'senha-escolhida-pelo-ator';
  const pedido = {
    contaId: TITULAR,
    nome: 'Leitor de feed',
    senha: escolhido,
    password: escolhido,
  };

  const resultado = emitirCredencialDeAplicacao(pedido, contexto);
  assert.ok(resultado.emitida);

  // 1. O segredo e o que o sorteio do sistema produziu, caractere por caractere
  //    — e nao o que o ator mandou.
  assert.equal(resultado.segredo, segredoEsperado(0));
  assert.notEqual(resultado.segredo, escolhido);

  // 2. Nem o escolhido, nem o resumo dele, chegam ao banco: o que o ator mandou
  //    nao entra no que fica guardado.
  const guardado = banco.valorGravado(TITULAR);
  assert.ok(guardado !== null);
  assert.equal(guardado.includes(escolhido), false);
  assert.equal(guardado.includes(resumoDesteTeste(escolhido)), false);
  assert.ok(guardado.includes(resumoDesteTeste(resultado.segredo)));

  // 3. As outras duas metades de `U6`: 24 caracteres, e hash em metadado — uma
  //    linha so, na chave `_application_passwords` da conta. O 24 vem literal da
  //    regra, e nao do ponto de configuracao: e a regra que o fixa.
  assert.equal(resultado.segredo.length, 24);
  assert.equal(resultado.segredo.length, COMPRIMENTO_DA_SENHA_DE_APLICACAO);
  assert.equal(banco.linhas(TITULAR), 1);
  assert.equal(resultado.credencial.resumo, resumoDesteTeste(resultado.segredo));

  // 4. A terceira metade — *"sua administracao reusa a permissao de editar
  //    aquele usuario"* — e `UT-011-4`. Aqui fica o que fecha o par: no proprio
  //    perfil a pergunta de `edit_user` devolve lista vazia, que significa
  //    PERMITIDO, e e por isso que um assinante emite para si.
  assert.ok(
    perguntarPermissao(
      contexto.autorizacao,
      CAPACIDADE_DE_EDICAO_DE_CONTA,
      TITULAR,
    ),
  );
});
