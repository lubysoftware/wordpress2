/**
 * Os testes de **US-1** — a entrega de **T004**.
 *
 * > *8 testes automatizados, um por caso registrado em `../../../backlog/tests.md`
 * > (UT-001-1 … UT-001-8), com o mesmo dado de entrada, ação e resultado
 * > esperado. Os 2 testes de regra de negócio (UT-001-7, UT-001-8) entram na
 * > mesma suíte.*
 * > — `.specify/specs/001-identidade-e-acesso/tasks.md`, T004
 *
 * São **exatamente 8** `test`, um por identificador, e os nomes carregam o
 * identificador para que a conferência com o catálogo seja de olho.
 *
 * ---
 *
 * 🔴 **`backlog/tests.md` NÃO EXISTE NESTA ÁRVORE, e isto tem de ser lido antes
 * de confiar nesta suíte.**
 *
 * O catálogo de testes é entrada declarada desta tarefa e **não veio no pacote**:
 * `tasks.md` o endereça em `../../../backlog/tests.md`, que resolve para a raiz
 * do repositório, e ali não há pasta `backlog/`. Nenhum outro artefato entregue
 * transcreve os casos — a única menção aos identificadores `UT-001-*` em toda a
 * árvore é a própria linha de T004, e `.specify/README.md` só os conta
 * (*"985 testes"*, *"1 critério sem nenhum teste registrado"*).
 *
 * Logo o *"mesmo dado de entrada, ação e resultado esperado"* que T004 cobra
 * **não pôde ser copiado do catálogo**. O que esta suíte fez em lugar disso, e
 * que é verificável por quem tiver o catálogo em mão:
 *
 * | caso | o que foi tomado como fonte, na ausência do catálogo |
 * |---|---|
 * | UT-001-1 | CA-1.1 da spec |
 * | UT-001-2 | CA-1.2 da spec |
 * | UT-001-3 | CA-1.3 da spec |
 * | UT-001-4 | CA-1.4 da spec |
 * | UT-001-5 | CA-1.5 da spec |
 * | UT-001-6 | a tabela *Exceções* de UC-19 — o sexto caso não é critério, e é o único comportamento de US-1 com resultado esperado declarado que sobra |
 * | UT-001-7 | a 1ª regra de *Regras de negócio que valem aqui* de US-1: `U4` / BR-MIGRAR-024 |
 * | UT-001-8 | a 2ª regra: *"a capacidade é a unidade real de autorização; o papel é só um atalho"* |
 *
 * A aritmética que sustenta a tabela: nas outras 11 tarefas de teste deste
 * pacote a contagem fecha em `critérios + testes de regra` (T006 3+0, T008 4+1,
 * T010 5+1, T012 3+1, T016 5+3, T018 5+2, T020 4+1, T022 5+1, T024 7+1). Em
 * T004 ela dá 5+2=7 para 8 pedidos, e o sobrante foi atribuído à exceção de
 * UC-19 em vez de desdobrar um critério em dois, para que cada `test` continue
 * tendo **uma** fonte citável. T014 tem a mesma folga (6+3 para 8 pedidos), o
 * que indica folga do gerador e não erro de leitura desta tarefa.
 *
 * **Quem tiver o catálogo refaz a correspondência aqui, não reescreve a suíte.**
 *
 * ---
 *
 * **Por que esta suíte não repete `autenticar.test.ts`.** Aquela é a entrega de
 * T003 e afirma os critérios contra uma `LeituraDeConta` de mentira. Esta
 * afirma o **efeito no banco**, que é o critério de paridade desta área —
 * `parity_specs.md`, Decisão 2: *"Esquema e efeito de escrita no banco →
 * **efeito no banco**"* —, e o faz pelos meios que `armazenamento/porta-falsa.ts`
 * reservou com o nome desta tarefa: *"T003 em diante vai precisar dela: as
 * suítes das histórias (T004, T006, T008 …) afirmam efeito no banco pelos mesmos
 * meios"*. Daí a montagem ser a **composição do módulo** sobre a porta de dados
 * falsa, com `criarLeituraDeConta` e o repositório de sessões de T002 por baixo:
 * o que cada `test` afirma é qual comando sai, com quais parâmetros e com quais
 * bytes — **inclusive quando o legado não emite comando nenhum**.
 *
 * O relógio é controlado em todos eles, como o P4 da constituição cobra:
 * *"teste por atestado que fixa prazo e força, com relógio controlado"*.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
  arranjo,
  arranjoPorNome,
  inteiro,
  normalizarChaveDeTexto,
  serializarComoTexto,
} from '../../../plataforma/serializacao/index.js';
import {
  camposDeSessao,
  chaveDeCapacidades,
  CHAVE_DE_TOKENS_DE_SESSAO,
  lerCamposDeSessao,
  opcaoDeDefinicaoDePapeis,
  prefixosDe,
  type RepositorioDeSessoes,
} from '../armazenamento/index.js';
// `porta-falsa.ts` não sai pelo barril do armazenamento, e o caminho direto é
// deliberado: T004 é `[P]` e não disputa arquivo com nenhuma outra tarefa desta
// feature, logo não acrescenta reexportação a `armazenamento/index.ts`.
import {
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import {
  criarModuloDeIdentidadeEAcesso,
  type ModuloDeIdentidadeEAcesso,
} from '../index.js';
import type { LinhaDeResultado, PortaDeEmail } from '../portas/index.js';
import { criarLeituraDeConta } from '../conta/leitura-de-conta.js';
import {
  resumoDoTokenDeSessao,
  type ArmazenamentoDeSessoes,
  type Sessao,
} from '../sessao/registro-de-sessoes.js';
import type { CredenciaisDeEntrada } from './autenticar.js';
import {
  REDE_INATIVA,
  type ContextoDeAutenticacao,
  type EstadoDaRede,
} from './contexto-de-autenticacao.js';
import { primeiroCodigoDeErro } from './erro-de-autenticacao.js';
import { SEGUNDOS_POR_DIA } from './prazos-de-sessao.js';
import {
  criarVerificadorDeSenhaDoNucleo,
  preProcessarSenhaParaBcrypt,
  PREFIXO_DE_HASH_BCRYPT,
  type PrimitivaDeBcrypt,
} from './verificacao-de-senha.js';

/** O instante fixo de todos os casos: o relógio é porta, e é controlado. */
const AGORA = 1_700_000_000;

/** A conta destes casos, e a senha dela em claro. */
const ID_DA_CONTA = 7;
const LOGIN = 'ada';
const EMAIL = 'ada@exemplo.invalido';
const SENHA = 'segredo';

/**
 * O corpo de 60 caracteres que um *hash* de bcrypt tem.
 *
 * O comprimento é regra, não enfeite: o verificador escolhe o ramo **pelo
 * comprimento do hash**, e um simulado curto cairia no ramo do resumo antigo e
 * passaria verde pelo caminho errado.
 *
 * E ele é derivado da senha **já pré-processada**, sem a senha em claro dentro:
 * é o que faz UT-001-3 afirmar uma ausência de verdade em vez de afirmar que
 * não encontrou o que nunca esteve lá.
 */
function corpoDoHashDeBcrypt(senhaPreProcessada: string): string {
  const marca = createHash('sha256')
    .update(senhaPreProcessada, 'utf8')
    .digest('hex');
  return `$2y$10$${marca.slice(0, 53)}`;
}

/** O hash como a coluna `user_pass` o guarda: o prefixo do legado, e o corpo. */
function hashGuardadoDe(senha: string): string {
  return (
    PREFIXO_DE_HASH_BCRYPT +
    corpoDoHashDeBcrypt(preProcessarSenhaParaBcrypt(senha))
  );
}

/**
 * O bcrypt destes casos.
 *
 * A primitiva real é adaptador — `plan.md` escolhe bcrypt por biblioteca
 * nativa e AD-04 põe essa borda em `adaptadores/`. Aceitar só o que confere
 * com `corpoDoHashDeBcrypt` obriga o caminho inteiro do núcleo a estar certo: o
 * pré-processamento em HMAC-SHA384 base64 e a remoção do prefixo `$wp` antes de
 * o hash chegar aqui.
 */
const BCRYPT_DE_TESTE: PrimitivaDeBcrypt = {
  verificar(senhaPreProcessada, hash) {
    return hash === corpoDoHashDeBcrypt(senhaPreProcessada);
  },
};

/** Porta de e-mail que recusa qualquer envio: US-1 não envia e-mail nenhum. */
const EMAIL_QUE_NAO_DEVE_SER_USADO: PortaDeEmail = {
  enviar() {
    assert.fail('a entrada de US-1 não envia e-mail');
  },
};

/** A linha de `users` como as consultas de `criarLeituraDeConta` a pedem. */
function linhaDaConta(
  parcial: { readonly chaveDeAtivacao?: string; readonly spam?: string } = {},
): LinhaDeResultado {
  return {
    ID: ID_DA_CONTA,
    user_login: LOGIN,
    user_pass: hashGuardadoDe(SENHA),
    user_email: EMAIL,
    user_nicename: LOGIN,
    user_activation_key: parcial.chaveDeAtivacao ?? '',
    display_name: 'Ada',
    ...(parcial.spam === undefined ? {} : { spam: parcial.spam }),
  };
}

/**
 * A ponte entre as duas formas de sessão que T002 e T003 escreveram.
 *
 * ⚠️ **É andaime de teste, e é também um achado registrado.** T002 entregou
 * `RepositorioDeSessoes` (`obter`/`gravar` sobre registros serializados) e T003
 * entregou `ArmazenamentoDeSessoes` (`ler`/`gravar` sobre `MapaDeSessoes`), as
 * duas modelando `AGG-Sessao`. É o mesmo trabalho duplicado que `index.ts` já
 * registra para `Conta` — *"não é conflito de merge: é trabalho duplicado"* —, e
 * pela mesma razão: a worktree de T003 nasceu antes de T002 existir. Qual das
 * duas formas fica é decisão de produto e **não é desta tarefa**; T004 não
 * escolhe e não escreve adaptador em código de produção, que seria sair da
 * própria suíte.
 *
 * A correspondência é 1-para-1 com os nomes que o legado grava, e é o que
 * permite a esta suíte afirmar os bytes reais: `expiration` ↔ `expiraEm`,
 * `login` ↔ `abertaEm`, `ip` ↔ `endereco`, `ua` ↔ `agente`.
 */
function sessoesSobreORepositorio(
  repositorio: RepositorioDeSessoes,
): ArmazenamentoDeSessoes {
  return {
    ler(idDaConta) {
      const mapa: Record<string, Sessao> = {};
      for (const registro of repositorio.obter(idDaConta)) {
        const campos = lerCamposDeSessao(registro.campos);
        mapa[registro.resumoDoToken] = {
          expiraEm: campos.expiracao ?? 0,
          abertaEm: campos.entradaEm ?? 0,
          ...(campos.ip === null ? {} : { endereco: campos.ip }),
          ...(campos.agente === null ? {} : { agente: campos.agente }),
        };
      }
      return mapa;
    },

    gravar(idDaConta, sessoes) {
      repositorio.gravar(
        idDaConta,
        Object.entries(sessoes).map(([resumoDoToken, sessao]) => ({
          resumoDoToken,
          campos: camposDeSessao({
            expiracao: sessao.expiraEm,
            ip: sessao.endereco ?? null,
            agente: sessao.agente ?? null,
            entradaEm: sessao.abertaEm,
          }),
        })),
      );
    },
  };
}

interface Montagem {
  readonly modulo: ModuloDeIdentidadeEAcesso;
  readonly contexto: ContextoDeAutenticacao;
  readonly porta: PortaDeDadosFalsa;
  /** Os nomes de chave e de opção que **não** devem ser consultados na entrada. */
  readonly chaveDeAutorizacao: string;
  readonly opcaoDePapeis: string;
}

/**
 * Compõe o módulo sobre a porta de dados falsa.
 *
 * `linhas` programa as respostas de leitura **na ordem em que a entrada as
 * pede**, e essa ordem é parte do que se afirma: pelo login vem primeiro
 * `WHERE user_login = ?`, e só depois, se não houver linha, `WHERE user_email = ?`.
 */
function montar(
  linhas: readonly (readonly LinhaDeResultado[])[],
  opcoes: { readonly rede?: EstadoDaRede } = {},
): Montagem {
  const porta = criarPortaDeDadosFalsa();
  for (const resposta of linhas) {
    porta.responder(resposta);
  }

  const modulo = criarModuloDeIdentidadeEAcesso({
    dados: porta.porta,
    email: EMAIL_QUE_NAO_DEVE_SER_USADO,
    relogio: { agoraEmSegundos: () => AGORA },
  });

  const prefixos = prefixosDe(porta.porta);

  const contexto: ContextoDeAutenticacao = {
    relogio: modulo.portas.relogio,
    contas: criarLeituraDeConta(porta.porta),
    sessoes: sessoesSobreORepositorio(modulo.armazenamento.sessoes),
    verificadorDeSenha: criarVerificadorDeSenhaDoNucleo({
      bcrypt: BCRYPT_DE_TESTE,
    }),
    // Identidade nesta suíte: a tabela de equivalência de caractere é de
    // `plataforma/`, e passá-la é ligação tardia (AD-10). Declarado, não omitido.
    removerAcentos: (texto) => texto,
    rede: opcoes.rede ?? REDE_INATIVA,
    urlDeSenhaPerdida:
      'https://exemplo.invalido/wp-login.php?action=lostpassword',
    urlDoPainel: 'https://exemplo.invalido/wp-admin/',
  };

  return {
    modulo,
    contexto,
    porta,
    chaveDeAutorizacao: chaveDeCapacidades(prefixos),
    opcaoDePapeis: opcaoDeDefinicaoDePapeis(prefixos),
  };
}

function credenciais(
  parcial: Partial<CredenciaisDeEntrada> = {},
): CredenciaisDeEntrada {
  return { login: LOGIN, senha: SENHA, ...parcial };
}

/** Toda consulta emitida — leitura e escrita —, achatada em texto. */
function tudoQueSaiu(porta: PortaDeDadosFalsa): string {
  return [...porta.selecoes, ...porta.escritas]
    .map(
      (consulta) =>
        consulta.texto +
        ' :: ' +
        consulta.parametros.map(textoDoParametro).join(' | '),
    )
    .join('\n');
}

// ---------------------------------------------------------------------------
// UT-001-1 · CA-1.1 — credencial correta cria um token de sessão e redireciona
//                     para o destino pedido ou para o painel
// ---------------------------------------------------------------------------

test('UT-001-1 (CA-1.1) credencial correta cria token de sessão e redireciona', () => {
  const { modulo, contexto, porta } = montar([[linhaDaConta()]]);

  const resultado = modulo.autenticar(credenciais(), contexto);

  assert.equal(resultado.autenticado, true);
  if (!resultado.autenticado) return;

  // O destino, sem nenhum pedido, é o painel.
  assert.equal(resultado.destinoDeRetorno, 'https://exemplo.invalido/wp-admin/');

  // O token de sessão existe, e o que foi GRAVADO é o resumo dele. A chave de
  // metadado não leva prefixo: a sessão é da conta, não do site.
  const insercao = porta.escritas.find((consulta) =>
    consulta.texto.startsWith('INSERT INTO wp_usermeta'),
  );
  assert.ok(insercao !== undefined, 'a sessão nova tem de ser gravada');
  assert.deepEqual(
    insercao.parametros.slice(0, 2).map(textoDoParametro),
    [String(ID_DA_CONTA), CHAVE_DE_TOKENS_DE_SESSAO],
  );

  // Os bytes, montados aqui de forma independente: um registro, com
  // `expiration` e `login` nessa ordem, e sem `ip` nem `ua`, que o legado não
  // escreve quando a requisição não os informa.
  assert.equal(
    textoDoParametro(insercao.parametros[2]),
    serializarComoTexto(
      arranjo([
        {
          chave: normalizarChaveDeTexto(
            resumoDoTokenDeSessao(resultado.sessao.token),
          ),
          valor: arranjoPorNome([
            ['expiration', inteiro(AGORA + 2 * SEGUNDOS_POR_DIA)],
            ['login', inteiro(AGORA)],
          ]),
        },
      ]),
    ),
  );
  // O token em claro não chega ao banco em nenhum parâmetro.
  assert.ok(!tudoQueSaiu(porta).includes(resultado.sessao.token));

  // E o destino pedido vence o painel, quando há um.
  const comDestino = montar([[linhaDaConta()]]);
  const pedido = comDestino.modulo.autenticar(
    credenciais({ destinoPedido: 'https://exemplo.invalido/wp-admin/edit.php' }),
    comDestino.contexto,
  );
  assert.equal(pedido.autenticado, true);
  if (!pedido.autenticado) return;
  assert.equal(
    pedido.destinoDeRetorno,
    'https://exemplo.invalido/wp-admin/edit.php',
  );
});

// ---------------------------------------------------------------------------
// UT-001-2 · CA-1.2 — o mesmo par funciona informando o login ou o e-mail, e
//                     os dois caminhos chegam ao mesmo registro
// ---------------------------------------------------------------------------

test('UT-001-2 (CA-1.2) login e e-mail chegam ao mesmo registro', () => {
  // Pelo login: a primeira consulta já encontra.
  const porLogin = montar([[linhaDaConta()]]);
  const umA = porLogin.modulo.autenticar(
    credenciais({ login: LOGIN }),
    porLogin.contexto,
  );

  // Pelo e-mail: a consulta por login não encontra, e a por e-mail encontra.
  const porEmail = montar([[], [linhaDaConta()]]);
  const umB = porEmail.modulo.autenticar(
    credenciais({ login: EMAIL }),
    porEmail.contexto,
  );

  assert.equal(umA.autenticado, true);
  assert.equal(umB.autenticado, true);
  if (!umA.autenticado || !umB.autenticado) return;

  // O MESMO registro: a identidade resolvida é a mesma pelos dois caminhos.
  assert.equal(umA.conta.id, umB.conta.id);
  assert.equal(umA.conta.login, umB.conta.login);
  assert.equal(umA.conta.email, umB.conta.email);

  // E as colunas consultadas são as duas do legado, na ordem da cadeia: o
  // login primeiro, o e-mail só depois de o login não achar.
  assert.deepEqual(
    porLogin.porta.selecoes
      .filter((c) => c.texto.includes('FROM wp_users'))
      .map((c) => [c.texto.includes('user_login = ?'), c.parametros[0]]),
    [[true, LOGIN]],
  );
  assert.deepEqual(
    porEmail.porta.selecoes
      .filter((c) => c.texto.includes('FROM wp_users'))
      .map((c) => [
        c.texto.includes('user_login = ?') ? 'login' : 'email',
        c.parametros[0],
      ]),
    [
      ['login', EMAIL],
      ['email', EMAIL],
    ],
  );
});

// ---------------------------------------------------------------------------
// UT-001-3 · CA-1.3 — a senha é conferida contra o hash guardado; a senha em
//                     texto não é gravada em lugar algum
// ---------------------------------------------------------------------------

test('UT-001-3 (CA-1.3) a senha é conferida contra o hash, e nunca é gravada', () => {
  // O hash guardado é o único critério: a senha certa entra…
  const certa = montar([[linhaDaConta()]]);
  assert.equal(
    certa.modulo.autenticar(credenciais(), certa.contexto).autenticado,
    true,
  );

  // …e a errada não, contra a MESMA linha.
  const errada = montar([[linhaDaConta()]]);
  const recusada = errada.modulo.autenticar(
    credenciais({ senha: 'nao-e-a-senha' }),
    errada.contexto,
  );
  assert.equal(recusada.autenticado, false);
  if (recusada.autenticado || recusada.motivo !== 'credencial-invalida') {
    assert.fail('senha errada tem de ser recusada como credencial inválida');
  }
  assert.equal(primeiroCodigoDeErro(recusada.erro), 'incorrect_password');

  // A senha em claro não aparece em NENHUMA consulta emitida — nem como
  // parâmetro de leitura, nem como valor gravado. Com o hash derivado da senha
  // já pré-processada, a ausência é afirmação e não coincidência.
  const comChave = montar([[linhaDaConta({ chaveDeAtivacao: `${AGORA}:k` })]]);
  assert.equal(
    comChave.modulo.autenticar(credenciais(), comChave.contexto).autenticado,
    true,
  );
  const emitido = tudoQueSaiu(comChave.porta);
  assert.ok(!emitido.includes(SENHA), 'a senha em claro chegou ao banco');
  assert.ok(
    !emitido.includes(preProcessarSenhaParaBcrypt(SENHA)),
    'o pré-processamento da senha chegou ao banco',
  );
  // A coluna do hash é LIDA, e em nenhum momento escrita por este fluxo.
  assert.ok(comChave.porta.selecoes.some((c) => c.texto.includes('user_pass')));
  assert.ok(!comChave.porta.escritas.some((c) => c.texto.includes('user_pass')));
});

// ---------------------------------------------------------------------------
// UT-001-4 · CA-1.4 — uma chave de redefinição de senha pendente deixa de
//                     valer no primeiro acesso bem-sucedido
// ---------------------------------------------------------------------------

test('UT-001-4 (CA-1.4) a chave de redefinição pendente deixa de valer no primeiro acesso', () => {
  const { modulo, contexto, porta } = montar([
    [linhaDaConta({ chaveDeAtivacao: `${AGORA}:chave-em-claro` })],
  ]);

  const resultado = modulo.autenticar(credenciais(), contexto);

  assert.equal(resultado.autenticado, true);
  if (!resultado.autenticado) return;

  // O efeito no banco: a sentinela vazia, NÃO `NULL` — o DDL desta coluna é
  // `NOT NULL default ''` (`DB-SENT`).
  const escrita = porta.escritas.filter((c) =>
    c.texto.includes('user_activation_key'),
  );
  assert.equal(escrita.length, 1);
  assert.equal(
    escrita[0]?.texto,
    'UPDATE wp_users SET user_activation_key = ? WHERE ID = ?',
  );
  assert.deepEqual(escrita[0]?.parametros, ['', ID_DA_CONTA]);

  // E quem recebe o resultado não continua vendo a chave como válida.
  assert.equal(resultado.conta.chaveDeAtivacao, '');
});

// ---------------------------------------------------------------------------
// UT-001-5 · CA-1.5 — conta de site marcado como suspenso na rede é recusada
//                     antes de o formulário ser processado
// ---------------------------------------------------------------------------

test('UT-001-5 (CA-1.5) site suspenso na rede recusa antes de o formulário ser processado', () => {
  const rede: EstadoDaRede = {
    ativa: true,
    siteArquivado: false,
    siteMarcadoComoSpam: true,
  };
  const { modulo, contexto, porta } = montar([[linhaDaConta()]], { rede });

  // Credencial CORRETA, e ainda assim recusada.
  const resultado = modulo.autenticar(credenciais(), contexto);

  assert.equal(resultado.autenticado, false);
  if (resultado.autenticado || resultado.motivo !== 'site-suspenso-na-rede') {
    assert.fail('a recusa de rede tem de vir antes da credencial');
  }
  assert.equal(resultado.recusa.eixo, 'site-marcado-como-spam');
  // UC-43: arquivado e spam produzem a MESMA resposta — HTTP 410.
  assert.equal(resultado.recusa.codigoHttp, 410);

  // *"Antes de o formulário ser processado"*, medido no banco: a porta de dados
  // não foi tocada nenhuma vez. Lista vazia aqui é afirmação, não ausência.
  assert.deepEqual(porta.selecoes, []);
  assert.deepEqual(porta.escritas, []);
});

// ---------------------------------------------------------------------------
// UT-001-6 · UC-19, tabela *Exceções* — senha errada e conta inexistente, com
//            a mensagem de cada uma e sem nada gravado
// ---------------------------------------------------------------------------

test('UT-001-6 (UC-19, exceções) conta inexistente e senha errada são recusadas, e as mensagens diferem', () => {
  // *"Conta inexistente: mensagem de erro distinta da de senha errada, o que
  // confirma a existência do login"* — UC-19. É `ESC-ENUMERACAO`
  // (BR-MIGRAR-110), dívida herdada DE PROPÓSITO: REQ-004 pediria o contrário e
  // está em `do-not-rewrite.md`.
  const inexistente = montar([[]]);
  const semConta = inexistente.modulo.autenticar(
    credenciais({ login: 'ninguem' }),
    inexistente.contexto,
  );

  const existente = montar([[linhaDaConta()]]);
  const senhaErrada = existente.modulo.autenticar(
    credenciais({ senha: 'nao-e-a-senha' }),
    existente.contexto,
  );

  assert.equal(semConta.autenticado, false);
  assert.equal(senhaErrada.autenticado, false);
  if (
    semConta.autenticado ||
    senhaErrada.autenticado ||
    semConta.motivo !== 'credencial-invalida' ||
    senhaErrada.motivo !== 'credencial-invalida'
  ) {
    assert.fail('as duas tentativas têm de falhar como credencial inválida');
  }

  assert.equal(primeiroCodigoDeErro(semConta.erro), 'invalid_username');
  assert.equal(primeiroCodigoDeErro(senhaErrada.erro), 'incorrect_password');

  const mensagemSemConta = String(semConta.erro.itens[0]?.mensagem);
  const mensagemSenhaErrada = String(senhaErrada.erro.itens[0]?.mensagem);
  // *"as duas mensagens são diferentes entre si, nas duas metades"* — PT-006.
  assert.notEqual(mensagemSemConta, mensagemSenhaErrada);
  // E cada uma NOMEIA o identificador tentado, que é o que permite enumerar.
  assert.match(mensagemSemConta, /ninguem/);
  assert.match(mensagemSenhaErrada, /ada/);

  // *"Não há contador de tentativas nem bloqueio de conta no núcleo"* — UC-19,
  // REQ-005 em `do-not-rewrite.md`, e o P6 põe limite de taxa fora do núcleo.
  // Medido no banco: a recusa não grava nada, em nenhum dos dois caminhos.
  assert.deepEqual(inexistente.porta.escritas, []);
  assert.deepEqual(existente.porta.escritas, []);
});

// ---------------------------------------------------------------------------
// UT-001-7 · regra `U4` (BR-MIGRAR-024) — a chave de reset é apagada no
//            primeiro login BEM-SUCEDIDO
// ---------------------------------------------------------------------------

test('UT-001-7 (U4 · BR-MIGRAR-024) a chave de reset é apagada no primeiro login bem-sucedido, e só nele', () => {
  // 1. Entrada recusada NÃO apaga a chave pendente: o "bem-sucedido" da regra
  //    é condição, não enfeite.
  const recusada = montar([
    [linhaDaConta({ chaveDeAtivacao: `${AGORA}:chave-em-claro` })],
  ]);
  recusada.modulo.autenticar(
    credenciais({ senha: 'nao-e-a-senha' }),
    recusada.contexto,
  );
  assert.deepEqual(recusada.porta.escritas, []);

  // 2. Sem chave pendente, NENHUM comando sai — o legado não grava sem
  //    necessidade, e o critério desta área é efeito no banco.
  const semChave = montar([[linhaDaConta()]]);
  assert.equal(
    semChave.modulo.autenticar(credenciais(), semChave.contexto).autenticado,
    true,
  );
  assert.deepEqual(
    semChave.porta.escritas.filter((c) =>
      c.texto.includes('user_activation_key'),
    ),
    [],
  );

  // 3. Com chave pendente, é apagada — e **uma vez só**: na segunda entrada já
  //    não há o que apagar, que é o "primeiro" da regra.
  const primeira = montar([
    [linhaDaConta({ chaveDeAtivacao: `${AGORA}:chave-em-claro` })],
  ]);
  assert.equal(
    primeira.modulo.autenticar(credenciais(), primeira.contexto).autenticado,
    true,
  );
  assert.equal(
    primeira.porta.escritas.filter((c) =>
      c.texto.includes('user_activation_key'),
    ).length,
    1,
  );

  const segunda = montar([[linhaDaConta()]]);
  assert.equal(
    segunda.modulo.autenticar(credenciais(), segunda.contexto).autenticado,
    true,
  );
  assert.deepEqual(
    segunda.porta.escritas.filter((c) =>
      c.texto.includes('user_activation_key'),
    ),
    [],
  );

  // 4. A outra metade da regra — *"vale 24 horas"* — NÃO é aplicada pela
  //    entrada, e isto é o legado e não lacuna desta suíte: a chave vencida é
  //    apagada igual, porque a entrada não confere a idade dela. Quem confere o
  //    prazo é a redefinição de senha (US-4 / T009), e o cenário de paridade
  //    separa os dois passos — *"a chave é recusada pelas duas"* (prazo) e *"as
  //    duas metades apagam a chave no mesmo passo"* (entrada).
  const vencida = montar([
    [
      linhaDaConta({
        chaveDeAtivacao: `${AGORA - 48 * 3600}:chave-vencida-ha-um-dia`,
      }),
    ],
  ]);
  const comVencida = vencida.modulo.autenticar(
    credenciais(),
    vencida.contexto,
  );
  assert.equal(comVencida.autenticado, true);
  assert.deepEqual(
    vencida.porta.escritas
      .filter((c) => c.texto.includes('user_activation_key'))
      .map((c) => c.parametros),
    [['', ID_DA_CONTA]],
  );
});

// ---------------------------------------------------------------------------
// UT-001-8 · regra *"a capacidade é a unidade real de autorização; o papel é
//            só um atalho"* — e na entrada ela se prova pela AUSÊNCIA
// ---------------------------------------------------------------------------

test('UT-001-8 (capacidade é a unidade de autorização) nenhuma capacidade é exigida para entrar, e a entrada não lê papel', () => {
  // UC-19 é literal: *"nenhuma capacidade é exigida para entrar: o papel decide
  // o que a pessoa faz depois, não se ela entra"*. O P4 manda declarar o
  // default de cada camada *"inclusive quando o default é permissivo"*, e o
  // cenário de paridade da tela de login cobra o mesmo pelo outro lado —
  // *"nenhuma das duas exige capacidade que o legado não exige"*.
  const { modulo, contexto, porta, chaveDeAutorizacao, opcaoDePapeis } = montar(
    [[linhaDaConta()]],
  );

  // A conta destes casos não tem papel nem capacidade alguma gravada: a linha
  // de `users` não carrega autorização, que mora em `usermeta`. Ela entra.
  const resultado = modulo.autenticar(credenciais(), contexto);
  assert.equal(resultado.autenticado, true);

  // E a prova de que nada foi consultado: a entrada não toca a chave de
  // capacidades nem a opção de definição de papéis. Se tocasse, uma conta sem
  // papel poderia ser recusada — e o sistema ficaria mais fechado que o legado,
  // que é o erro que esta feature existe para não cometer.
  const emitido = tudoQueSaiu(porta);
  assert.equal(chaveDeAutorizacao, 'wp_capabilities');
  assert.equal(opcaoDePapeis, 'wp_user_roles');
  assert.ok(!emitido.includes(chaveDeAutorizacao));
  assert.ok(!emitido.includes(opcaoDePapeis));
  assert.ok(!emitido.includes('wp_options'));

  // As únicas tabelas tocadas são `users`, de onde sai a credencial, e
  // `usermeta`, onde a sessão é gravada. A definição de papel é dado mutável
  // (ADR-0001) e vive em `options`: a entrada não a lê, e por isso nenhuma
  // decisão da entrada pode depender dela.
  const tabelas = [
    ...new Set(
      [...porta.selecoes, ...porta.escritas]
        .map((c) => /\b(?:FROM|INTO|UPDATE)\s+(\w+)/.exec(c.texto)?.[1])
        .filter((nome): nome is string => nome !== undefined),
    ),
  ].sort();
  assert.deepEqual(tabelas, ['wp_usermeta', 'wp_users']);
});
