/**
 * A entrega de T008: *"5 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-003-1, UT-003-2, UT-003-3, UT-003-4,
 * UT-003-5), com o mesmo dado de entrada, acao e resultado esperado. O teste de
 * regra de negocio (UT-003-5) entra na mesma suite."*
 *
 * ---
 *
 * ⚠️ **`backlog/tests.md` NAO EXISTE nesta arvore, e os cinco casos foram
 * RECONSTRUIDOS, nao copiados.** O caminho que `tasks.md` cita resolve para
 * `backlog/tests.md` na raiz do repositorio, e ali nao ha nada: nem a pasta
 * `backlog/`, nem o arquivo, nem copia em `_discovery/`. `parity_specs.md`
 * descreve o catalogo de fora — *"os **985 testes** de `../backlog/tests.md` sao
 * **especificacao, nao evidencia**"* — e e a unica mencao a ele no pacote
 * entregue. Logo o enunciado de cada UT-003-* nao esta disponivel para ser
 * seguido ao pe da letra, e a frase *"com o mesmo dado de entrada, acao e
 * resultado esperado"* nao tem fonte a espelhar.
 *
 * **Como os cinco foram reconstruidos, e por que esta correspondencia e a
 * defensavel.** `tasks.md` da duas informacoes aritmeticas: US-3 tem **5** casos
 * e **1** deles e *"teste de regra de negocio (UT-003-5)"*, e US-3 tem **4**
 * critérios de aceite. Sobram 4 casos para 4 critérios, na ordem. O mesmo padrao
 * fecha nas outras historias da feature — US-1 tem 5 critérios, 8 casos e **2**
 * de regra (UT-001-7, UT-001-8); US-4 tem 5 critérios, 6 casos e **1** de regra
 * (UT-006-6). A correspondencia adotada, portanto:
 *
 * | caso | o que afirma | fonte |
 * |---|---|---|
 * | `UT-003-1` | CA-3.1 — sem lembranca, credencial de sessao e token de 2 dias | `spec.md`, US-3 |
 * | `UT-003-2` | CA-3.2 — com lembranca, 14 dias | `spec.md`, US-3 |
 * | `UT-003-3` | CA-3.3 — 12 horas de carencia, durante as quais a sessao ainda e aceita | `spec.md`, US-3 |
 * | `UT-003-4` | CA-3.4 — passada a carencia, a requisicao e anonima e a autenticacao e exigida de novo | `spec.md`, US-3 |
 * | `UT-003-5` | a regra `U5` / BR-MIGRAR-025, com os tres numeros e as bordas | `target_business_rules.md` |
 *
 * **O que isto deixa devendo, declarado para nao ser descoberto depois:** se o
 * catalogo aparecer e um UT-003-* tiver dado de entrada diferente do que esta
 * aqui, o caso de la vale e este arquivo muda. A reconstrucao nao inventa
 * comportamento — cada assercao sai de `spec.md` ou de
 * `target_business_rules.md` —, mas ela nao prova que o enunciado e o mesmo.
 *
 * ---
 *
 * **Nao sao os testes de critério de T007.** T007 entrega *"o comportamento de
 * US-3 existe e os critérios CA-3.1 a CA-3.4 passam"* e tem a suite dela em
 * `expiracao-de-sessao.test.ts`, no nivel da unidade: as funcoes de prazo, de
 * situacao e de filtro, chamadas direto. Esta suite e o catalogo UT-003-*, no
 * nivel do **cenario**: cada caso entra pela operacao que o produto expoe
 * (`autenticar`) e sai pela resolucao que a requisicao seguinte faz
 * (`sessaoDaRequisicao`), com o relogio andando entre as duas. As duas suites
 * afirmam a mesma regra por caminhos diferentes de proposito — se so a unidade
 * estiver certa e a costura estiver errada, esta e a que abre.
 *
 * **T008 depende de T007** (`tasks.md`: *"depende de: T007"*), e por isso importa
 * `expiracao-de-sessao.js` e `sessao-da-requisicao.js`, que sao de T007: numa
 * arvore sem T007 esta suite nao compila, que e o que a dependencia declarada
 * significa. Nenhum arquivo fora desta suite e tocado, como o `[P]` de T008
 * exige — *"tarefa de teste, que toca so a propria suite"*.
 *
 * O relogio e controlado em todos os casos, como o P4 da constituicao cobra —
 * *"teste por atestado que fixa prazo e forca, com relogio controlado"* —, e cada
 * numero e afirmado nas duas pontas, como o P6 cobra: *"no ultimo instante
 * aceita, um instante depois recusa"*.
 *
 * ⚠️ **Um ponto do pacote fica aberto, e esta suite NAO o resolve:** a carencia
 * vale para as duas duracoes ou so para a estendida? `spec.md` CA-3.3 nao
 * qualifica (*"ha 12 horas de carencia apos **o prazo**"*), e BR-MIGRAR-025,
 * UC-19 e `target_domain_model.md` repetem a frase sem qualificar;
 * `parity_tests/06-autenticacao-e-sessao.feature` qualifica, e aponta para o
 * outro lado (*"sem a opcao de lembrar ... depois da duracao padrao ... recusam a
 * sessao"*, e a carencia aparece so *"da duracao estendida"*). T007 registrou a
 * mesma divergencia em `expiracao-de-sessao.ts` e implementou o critério como
 * esta escrito. Esta suite afirma **o critério de aceite**, que e o que T008 tem
 * de cobrir, e marca onde a outra leitura mudaria o resultado (ver UT-003-5). A
 * escolha e conferencia contra o oraculo de `ESC-ORACULO` (BR-MIGRAR-116), que
 * nesta arvore nao existe, e **nao** e decisao de quem escreve teste.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  autenticar,
  type CredenciaisDeEntrada,
} from '../autenticacao/autenticar.js';
import {
  REDE_INATIVA,
  type ContextoDeAutenticacao,
} from '../autenticacao/contexto-de-autenticacao.js';
import {
  criarVerificadorDeSenhaDoNucleo,
  preProcessarSenhaParaBcrypt,
  type PrimitivaDeBcrypt,
} from '../autenticacao/verificacao-de-senha.js';
import {
  PRAZOS_DO_TOKEN_DE_SESSAO_DE_FABRICA,
  SEGUNDOS_POR_DIA,
  SEGUNDOS_POR_HORA,
} from '../autenticacao/prazos-de-sessao.js';
import type { Conta, LeituraDeConta } from '../conta/leitura-de-conta.js';
import {
  resumoDoTokenDeSessao,
  type MapaDeSessoes,
} from './registro-de-sessoes.js';
import { CARENCIA_DE_SESSAO_DE_FABRICA } from './expiracao-de-sessao.js';
import {
  requisicaoEhAnonima,
  sessaoDaRequisicao,
} from './sessao-da-requisicao.js';

/**
 * O instante de partida de todos os casos.
 *
 * Fixo e arbitrario: o que os casos afirmam e **diferenca** de instante, e um
 * relogio real tornaria a borda do P6 irrepetivel.
 */
const AGORA = 1_700_000_000;

/** Os dois prazos e a carencia, nos nomes em que os casos os citam. */
const DOIS_DIAS = 2 * SEGUNDOS_POR_DIA;
const QUATORZE_DIAS = 14 * SEGUNDOS_POR_DIA;
const DOZE_HORAS = 12 * SEGUNDOS_POR_HORA;

/** A conta e a senha que todos os casos usam como dado de entrada. */
const LOGIN = 'ada';
const SENHA = 'segredo';
const ID_DA_CONTA = 7;

/**
 * Um hash com os 60 caracteres que um bcrypt tem, atras do prefixo do legado.
 *
 * O comprimento importa e nao e detalhe de simulado: e por ele que o verificador
 * escolhe o ramo de bcrypt em vez do ramo de resumo antigo, e um hash curto
 * passaria esta suite pelo caminho errado.
 */
function corpoDoHash(senha: string): string {
  const marca = Buffer.from(senha, 'utf8').toString('hex');
  return `$2y$10$${marca}${'.'.repeat(60 - 7 - marca.length)}`;
}

function hashDeFabrica(senha: string): string {
  return `$wp${corpoDoHash(senha)}`;
}

/**
 * O bcrypt desta suite.
 *
 * A primitiva real e adaptador — `plan.md` escolhe bcrypt por biblioteca nativa
 * e AD-04 poe essa borda em `adaptadores/`. Nenhum caso de US-3 e sobre senha:
 * ela existe aqui porque entrar e a acao que abre a sessao cujo **prazo** os
 * casos afirmam.
 */
const BCRYPT_DE_TESTE: PrimitivaDeBcrypt = {
  verificar(senhaPreProcessada, hash) {
    return (
      corpoDoHash(SENHA) === hash &&
      preProcessarSenhaParaBcrypt(SENHA) === senhaPreProcessada
    );
  },
};

interface Montagem {
  readonly contexto: ContextoDeAutenticacao;
  /** Move o relogio para um instante absoluto. */
  readonly relogioEm: (instante: number) => void;
  /** O mapa gravado de uma conta, como o armazenamento o devolveria. */
  readonly gravadas: (idDaConta: number) => MapaDeSessoes;
}

function conta(parcial: Partial<Conta> = {}): Conta {
  return {
    id: ID_DA_CONTA,
    login: LOGIN,
    senhaHash: hashDeFabrica(SENHA),
    email: 'ada@exemplo.invalido',
    apelido: LOGIN,
    nomeExibido: 'Ada',
    chaveDeAtivacao: '',
    ...parcial,
  };
}

/**
 * O contexto de uma requisicao, com relogio movel.
 *
 * O armazenamento de sessoes e um mapa em memoria **sem filtro de prazo**, que e
 * exatamente o contrato que `armazenamento/sessao.ts` declara — *"aqui devolve-se
 * o que esta gravado"*. Se esta suite filtrasse por conta propria, ela provaria o
 * proprio simulado em vez do codigo.
 */
function montar(contas: readonly Conta[] = [conta()]): Montagem {
  let agora = AGORA;
  const gravadas = new Map<number, MapaDeSessoes>();
  const registro = new Map(contas.map((c) => [c.id, c]));

  const leitura: LeituraDeConta = {
    porLogin(login) {
      return [...registro.values()].find((c) => c.login === login) ?? null;
    },
    porEmail(email) {
      return [...registro.values()].find((c) => c.email === email) ?? null;
    },
    apagarChaveDeAtivacao(id) {
      const achada = registro.get(id);
      if (achada !== undefined) {
        registro.set(id, { ...achada, chaveDeAtivacao: '' });
      }
    },
  };

  const contexto: ContextoDeAutenticacao = {
    relogio: { agoraEmSegundos: () => agora },
    contas: leitura,
    sessoes: {
      ler(id) {
        return gravadas.get(id) ?? {};
      },
      gravar(id, sessoes) {
        gravadas.set(id, sessoes);
      },
    },
    verificadorDeSenha: criarVerificadorDeSenhaDoNucleo({
      bcrypt: BCRYPT_DE_TESTE,
    }),
    // A remocao de acentos e identidade nesta suite, e isso esta declarado: a
    // tabela de caractere e de `plataforma/`, nao deste modulo.
    removerAcentos: (texto) => texto,
    rede: REDE_INATIVA,
    urlDeSenhaPerdida: 'https://exemplo.invalido/wp-login.php?action=lostpassword',
    urlDoPainel: 'https://exemplo.invalido/wp-admin/',
  };

  return {
    contexto,
    relogioEm: (instante) => {
      agora = instante;
    },
    gravadas: (id) => gravadas.get(id) ?? {},
  };
}

function credenciais(
  parcial: Partial<CredenciaisDeEntrada> = {},
): CredenciaisDeEntrada {
  return { login: LOGIN, senha: SENHA, ...parcial };
}

/**
 * Entra e devolve o token em claro e o prazo, ou falha o caso.
 *
 * Os cinco casos comecam pela mesma acao e nenhum deles e sobre credencial: um
 * erro de entrada aqui e defeito da montagem, e tem de aparecer como tal em vez
 * de virar uma sessao ausente tres assercoes depois.
 */
function entrar(
  montagem: Montagem,
  lembrar?: boolean,
): { readonly token: string; readonly expiraEm: number } {
  const resultado = autenticar(
    lembrar === undefined ? credenciais() : credenciais({ lembrar }),
    montagem.contexto,
  );
  assert.equal(
    resultado.autenticado,
    true,
    'a montagem desta suite deve autenticar',
  );
  if (!resultado.autenticado) throw new Error('inalcancavel');
  return { token: resultado.sessao.token, expiraEm: resultado.sessao.expiraEm };
}

// ---------------------------------------------------------------------------
// UT-003-1 — CA-3.1 *"Sem pedir para ser lembrado, a credencial do navegador e
// de sessao e o token vale 2 dias"*
//
// entrada:  a conta `ada` com a senha correta, SEM a opcao de lembranca, com o
//           relogio em AGORA
// acao:     entrar
// esperado: a credencial do navegador e de sessao; o token vence em AGORA + 2
//           dias; e no ultimo instante desse prazo a requisicao seguinte ainda e
//           reconhecida — *"fechar o navegador nao encerra a sessao do lado do
//           servidor"* (UC-19)
// ---------------------------------------------------------------------------

test('UT-003-1 sem lembranca: credencial de sessao, e o token do servidor vale 2 dias (CA-3.1)', () => {
  const montagem = montar();

  const resultado = autenticar(credenciais(), montagem.contexto);

  assert.equal(resultado.autenticado, true);
  if (!resultado.autenticado) return;

  // A credencial do navegador: de sessao, logo o navegador a descarta ao fechar.
  assert.deepEqual(resultado.credencialDoNavegador, { tipo: 'de-sessao' });

  // O token do servidor: 2 dias, contados do relogio da entrada.
  assert.equal(resultado.sessao.expiraEm, AGORA + DOIS_DIAS);

  // E e o mesmo prazo que foi GRAVADO: o que vale na requisicao seguinte e o
  // registro, nao o retorno da entrada.
  const gravada =
    montagem.gravadas(ID_DA_CONTA)[resumoDoTokenDeSessao(resultado.sessao.token)];
  assert.notEqual(gravada, undefined);
  assert.equal(gravada?.expiraEm, AGORA + DOIS_DIAS);

  // Os dois prazos sao DIFERENTES, e e isso que UC-19 manda um porte nao perder:
  // a credencial morre ao fechar o navegador e o token continua valendo.
  montagem.relogioEm(AGORA + DOIS_DIAS);
  const noUltimoInstante = sessaoDaRequisicao(
    montagem.contexto.sessoes,
    { idDaConta: ID_DA_CONTA, token: resultado.sessao.token },
    AGORA + DOIS_DIAS,
  );
  assert.equal(noUltimoInstante.reconhecida, true);
  if (!noUltimoInstante.reconhecida) return;
  assert.equal(noUltimoInstante.naCarencia, false);
});

// ---------------------------------------------------------------------------
// UT-003-2 — CA-3.2 *"Pedindo para ser lembrado, o acesso vale 14 dias"*
//
// entrada:  a mesma conta, COM a opcao de lembranca, com o relogio em AGORA
// acao:     entrar
// esperado: o token vence em AGORA + 14 dias; a credencial do navegador deixa de
//           ser de sessao e passa a ter prazo; e no ultimo instante dos 14 dias a
//           requisicao seguinte e reconhecida fora da carencia
// ---------------------------------------------------------------------------

test('UT-003-2 com lembranca: o acesso vale 14 dias (CA-3.2)', () => {
  const montagem = montar();

  const resultado = autenticar(
    credenciais({ lembrar: true }),
    montagem.contexto,
  );

  assert.equal(resultado.autenticado, true);
  if (!resultado.autenticado) return;

  assert.equal(resultado.sessao.expiraEm, AGORA + QUATORZE_DIAS);

  // A credencial do navegador deixa de ser de sessao: e a lembranca que decide
  // os dois prazos no mesmo passo, como no legado.
  assert.equal(resultado.credencialDoNavegador.tipo, 'com-prazo');

  const gravada =
    montagem.gravadas(ID_DA_CONTA)[resumoDoTokenDeSessao(resultado.sessao.token)];
  assert.equal(gravada?.expiraEm, AGORA + QUATORZE_DIAS);

  montagem.relogioEm(AGORA + QUATORZE_DIAS);
  const noUltimoInstante = sessaoDaRequisicao(
    montagem.contexto.sessoes,
    { idDaConta: ID_DA_CONTA, token: resultado.sessao.token },
    AGORA + QUATORZE_DIAS,
  );
  assert.equal(noUltimoInstante.reconhecida, true);
  if (!noUltimoInstante.reconhecida) return;
  assert.equal(noUltimoInstante.naCarencia, false);

  // E os 14 dias sao MAIS que os 2 da entrada sem lembranca: o caso afirma a
  // diferenca, nao so o numero, porque e a diferenca que o ator percebe.
  const semLembranca = montar();
  const outra = entrar(semLembranca);
  assert.ok(resultado.sessao.expiraEm > outra.expiraEm);
});

// ---------------------------------------------------------------------------
// UT-003-3 — CA-3.3 *"Ha 12 horas de carencia apos o prazo, durante as quais a
// sessao ainda e aceita"*
//
// entrada:  uma sessao aberta sem lembranca, cujo prazo vence em AGORA + 2 dias
// acao:     o relogio avanca para um segundo depois do prazo, e depois para o
//           ultimo instante das 12 horas, e a requisicao apresenta o token
// esperado: a sessao e aceita nos dois instantes, e vem marcada como estando na
//           carencia — aceita, e nao silenciosamente valida
// ---------------------------------------------------------------------------

test('UT-003-3 dentro das 12 horas de carencia a sessao ainda e aceita (CA-3.3)', () => {
  const montagem = montar();
  const { token, expiraEm } = entrar(montagem);
  const credencial = { idDaConta: ID_DA_CONTA, token };

  assert.equal(expiraEm, AGORA + DOIS_DIAS);

  // Um segundo depois do prazo: ja nao e valida, e ainda e aceita.
  const primeiroSegundoDaCarencia = expiraEm + 1;
  montagem.relogioEm(primeiroSegundoDaCarencia);
  const naEntrada = sessaoDaRequisicao(
    montagem.contexto.sessoes,
    credencial,
    primeiroSegundoDaCarencia,
  );
  assert.equal(naEntrada.reconhecida, true);
  assert.equal(requisicaoEhAnonima(naEntrada), false);
  if (!naEntrada.reconhecida) return;
  assert.equal(naEntrada.naCarencia, true);
  // A conta reconhecida continua sendo a mesma: a carencia aceita a sessao, nao
  // troca de identidade.
  assert.equal(naEntrada.idDaConta, ID_DA_CONTA);
  assert.equal(naEntrada.resumoDoToken, resumoDoTokenDeSessao(token));

  // No ULTIMO instante das 12 horas: ainda aceita. E a ponta da borda que o P6
  // cobra em "no ultimo instante aceita".
  const ultimoInstante = expiraEm + DOZE_HORAS;
  montagem.relogioEm(ultimoInstante);
  const noFim = sessaoDaRequisicao(
    montagem.contexto.sessoes,
    credencial,
    ultimoInstante,
  );
  assert.equal(noFim.reconhecida, true);
  if (!noFim.reconhecida) return;
  assert.equal(noFim.naCarencia, true);

  // A carencia nao reescreve o prazo gravado: a sessao continua vencendo quando
  // vencia. Um porte que a somasse ao registro daria 12 horas a cada requisicao.
  assert.equal(noFim.sessao.expiraEm, AGORA + DOIS_DIAS);
});

// ---------------------------------------------------------------------------
// UT-003-4 — CA-3.4 *"Passada a carencia, a requisicao e tratada como anonima e
// a autenticacao e exigida de novo"*
//
// entrada:  a mesma sessao, com o relogio um segundo depois do fim da carencia
// acao:     a requisicao apresenta o token; em seguida a conta entra de novo
// esperado: a requisicao e anonima, sem conta a reaproveitar; e entrar de novo
//           abre uma sessao nova, com a vencida fora do registro gravado
// ---------------------------------------------------------------------------

test('UT-003-4 passada a carencia a requisicao e anonima, e a entrada e exigida de novo (CA-3.4)', () => {
  const montagem = montar();
  const { token, expiraEm } = entrar(montagem);
  const credencial = { idDaConta: ID_DA_CONTA, token };

  // Um segundo depois do fim da carencia: a outra ponta da borda do P6.
  const depoisDaCarencia = expiraEm + DOZE_HORAS + 1;
  montagem.relogioEm(depoisDaCarencia);

  const resolucao = sessaoDaRequisicao(
    montagem.contexto.sessoes,
    credencial,
    depoisDaCarencia,
  );

  assert.equal(resolucao.reconhecida, false);
  assert.equal(requisicaoEhAnonima(resolucao), true);
  if (resolucao.reconhecida) return;
  // Vencida, e nao desconhecida: o registro ainda tem o token, e o que o recusou
  // foi o relogio. Os dois motivos sao distintos no legado.
  assert.equal(resolucao.motivo, 'sessao-vencida');
  // Anonima nao devolve conta nenhuma: nao ha identidade a reaproveitar.
  assert.ok(!Object.hasOwn(resolucao, 'idDaConta'));

  // *"a autenticacao e exigida de novo"*: entrar de novo funciona e abre uma
  // sessao NOVA, com prazo contado do relogio de agora.
  const nova = entrar(montagem);
  assert.notEqual(nova.token, token);
  assert.equal(nova.expiraEm, depoisDaCarencia + DOIS_DIAS);

  // E a sessao que deixou de ser aceita saiu do registro gravado, pelo relogio e
  // por mais nada — nenhuma outra sessao da conta foi tocada (`ESC-SESSAO`).
  const gravadas = montagem.gravadas(ID_DA_CONTA);
  assert.deepEqual(Object.keys(gravadas), [resumoDoTokenDeSessao(nova.token)]);
  assert.equal(gravadas[resumoDoTokenDeSessao(token)], undefined);
});

// ---------------------------------------------------------------------------
// UT-003-5 — teste de regra de negocio: `U5` / BR-MIGRAR-025, *"sessao dura 2
// dias; 'lembrar de mim', 14 — com 12 horas de carencia. Sem 'lembrar', o cookie
// e de sessao, mas o token ainda expira em 2 dias"*
//
// entrada:  os tres pontos de configuracao nomeados, e uma entrada de cada tipo
// acao:     afirmar os tres valores de fabrica, e as duas pontas da borda de cada
//           uma das duas duracoes
// esperado: 2 dias, 14 dias e 12 horas; e, para as duas duracoes, aceita no
//           ultimo instante da carencia e recusa um segundo depois
// ---------------------------------------------------------------------------

test('UT-003-5 os tres numeros de U5 sao os de fabrica, e cada um tem as duas pontas da borda (BR-MIGRAR-025)', () => {
  // Os valores, cada um no seu ponto de configuracao nomeado, como o P6 exige.
  assert.equal(PRAZOS_DO_TOKEN_DE_SESSAO_DE_FABRICA.semLembrar, DOIS_DIAS);
  assert.equal(PRAZOS_DO_TOKEN_DE_SESSAO_DE_FABRICA.comLembrar, QUATORZE_DIAS);
  assert.equal(CARENCIA_DE_SESSAO_DE_FABRICA, DOZE_HORAS);

  // E o efeito da borda, nas duas duracoes: no ultimo instante aceita, um
  // instante depois recusa.
  for (const [nome, lembrar, prazo] of [
    ['sem lembranca', false, DOIS_DIAS],
    ['com lembranca', true, QUATORZE_DIAS],
  ] as const) {
    const montagem = montar();
    const { token, expiraEm } = entrar(montagem, lembrar);
    const credencial = { idDaConta: ID_DA_CONTA, token };

    assert.equal(expiraEm, AGORA + prazo, `${nome}: o prazo do token`);

    const limite = expiraEm + CARENCIA_DE_SESSAO_DE_FABRICA;

    montagem.relogioEm(limite);
    assert.equal(
      sessaoDaRequisicao(montagem.contexto.sessoes, credencial, limite)
        .reconhecida,
      true,
      `${nome}: no ultimo instante da carencia a sessao e aceita`,
    );

    montagem.relogioEm(limite + 1);
    assert.equal(
      sessaoDaRequisicao(montagem.contexto.sessoes, credencial, limite + 1)
        .reconhecida,
      false,
      `${nome}: um segundo depois a sessao e recusada`,
    );
  }

  // *"Sem 'lembrar', o cookie e de sessao, mas o token ainda expira em 2 dias"*:
  // a frase da regra tem duas metades e as duas estao afirmadas aqui, porque e a
  // segunda que um porte perde — o cookie de sessao sugere que nada sobrevive.
  const montagem = montar();
  const resultado = autenticar(credenciais(), montagem.contexto);
  assert.equal(resultado.autenticado, true);
  if (!resultado.autenticado) return;
  assert.equal(resultado.credencialDoNavegador.tipo, 'de-sessao');
  assert.equal(resultado.sessao.expiraEm, AGORA + DOIS_DIAS);

  /*
    ⚠️ ONDE A LEITURA ABERTA DO PACOTE MUDARIA ESTE CASO, e por que ele nao
    escolhe.

    O laco acima da a MESMA carencia as duas duracoes, que e o que CA-3.3 diz sem
    qualificar e o que BR-MIGRAR-025, UC-19 e `target_domain_model.md` repetem.
    `parity_tests/06-autenticacao-e-sessao.feature` qualifica a carencia como
    sendo "da duracao estendida" e, no ramo sem lembranca, manda recusar "depois
    da duracao padrao". Se o oraculo de `ESC-ORACULO` (BR-MIGRAR-116) confirmar a
    leitura do cenario de paridade, a linha de `sem lembranca` deste laco passa a
    esperar recusa em `expiraEm + 1`, e so ela: os tres numeros, a borda da
    duracao estendida e os quatro casos anteriores nao mudam.

    Nao ha como decidir isto por teste, porque nenhuma das duas leituras esta
    errada de forma legivel no pacote — uma nao qualifica e a outra qualifica — e
    o oraculo nao existe nesta arvore. O P1 e explicito sobre de quem e a palavra:
    *"toda divergencia de comportamento observavel tem, no codigo, uma referencia
    a resposta de `questions.md` ou ao ADR que a autorizou"*.
  */
});
