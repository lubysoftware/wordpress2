/**
 * A entrega de T013: *"o comportamento de US-6 existe e os critérios CA-6.1,
 * CA-6.2, CA-6.3, CA-6.4, CA-6.5, CA-6.6 passam contra o sistema novo"*.
 *
 * **Nao sao os testes de US-6.** Esses sao T014, que pede 8 testes, um por caso
 * registrado no catalogo de testes do backlog (UT-009-1 a UT-009-8), *"com o mesmo
 * dado de entrada, acao e resultado esperado"*. Esta suite afirma os seis critérios
 * e as regras do legado que a implementacao poderia quebrar em silencio: o
 * envelopamento do erro de criacao, o acumulo de codigos, a ordem das escritas, a
 * neutralidade da derivacao de nivel diante do conflito REQ-017, e o fato de a chave
 * em claro nunca sair do e-mail.
 *
 * **A suite corre sobre a porta de dados, nao sobre repositorio de mentira.** O
 * criterio de aceite desta area e *"efeito no banco"* (Decisao 2 de
 * `parity_specs.md`), e o que se tem de afirmar e qual comando sai, com quais
 * parametros — inclusive o caso em que **nenhum comando sai**. Um repositorio de
 * mentira esconderia justamente isso.
 *
 * O relogio e a fonte de aleatoriedade sao controlados em todo teste, como o **P4** e
 * o **P6** cobram: *"teste por atestado que fixa prazo e forca, com relogio
 * controlado"* e *"no ultimo instante aceita, um instante depois recusa"*.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { criarArmazenamento } from '../armazenamento/index.js';
import { povoarPapeis } from '../armazenamento/matriz-de-fabrica.js';
import { REDE_INATIVA } from '../autenticacao/contexto-de-autenticacao.js';
import { sanitizarLogin } from '../autenticacao/normalizacao-de-credencial.js';
import {
  criarGeradorDeHashDeSenhaDoNucleo,
  HASH_QUE_NUNCA_CONFERE,
  type PrimitivaDeBcryptDeGeracao,
} from '../autenticacao/geracao-de-hash-de-senha.js';
import {
  COMPRIMENTO_MAXIMO_DE_SENHA,
  criarVerificadorDeSenhaDoNucleo,
  preProcessarSenhaParaBcrypt,
  type PrimitivaDeBcrypt,
} from '../autenticacao/verificacao-de-senha.js';
import { SEGUNDOS_POR_HORA } from '../autenticacao/prazos-de-sessao.js';
import type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  PortaDeEmail,
  MensagemDeEmail,
  ResultadoDeEnvio,
  ValorDeColuna,
} from '../portas/index.js';

import {
  nivelDasCapacidades,
  nomesDaContaComPapel,
} from './atribuicao-de-papel.js';
import {
  cadastrar,
  cadastroDesviaParaRede,
  cadastroEstaAberto,
  destinoDeRetorno,
  type DadosDoCadastro,
  type ResultadoDoCadastro,
} from './cadastrar.js';
import {
  caminhoDeDefinicaoDeSenha,
  chaveDeRedefinicaoVencida,
  codificarParaUrlCrua,
  instanteDaChaveGravada,
  type ResumoDaChaveDeRedefinicao,
} from './chave-de-redefinicao.js';
import {
  LIMITES_DO_CADASTRO_DE_FABRICA,
  LOGINS_PROIBIDOS_DE_FABRICA,
  OPCOES_DO_CADASTRO_DE_FABRICA,
} from './configuracao-de-cadastro.js';
import type { ContextoDeCadastro, GanchosDoCadastro } from './contexto-de-cadastro.js';
import { criarConta, dataDoBanco } from './criacao-de-conta.js';
import {
  codigosDeErro,
  erroDeCadastro,
  MENSAGENS_DE_ERRO_DE_CADASTRO,
} from './erro-de-cadastro.js';
import { ALFABETO_DE_SEGREDO, gerarSegredo } from './geracao-de-segredo.js';
import {
  assuntoDaMensagemDoTitular,
  type NotificacaoDeContaNova,
} from './notificacao-de-conta-nova.js';
import { apelidoDoLogin, contarCaracteres } from './validacao-de-cadastro.js';

const AGORA = 1_700_000_000;
const TITULO = 'Sitio';
const EMAIL_DO_ADMIN = 'admin@exemplo.invalido';

/* ───────────────────────── a borda simulada ───────────────────────── */

/**
 * A remocao de acentos. No produto ela vem da tabela de equivalencia de caractere
 * de `plataforma/`, que nao existe nesta arvore e que AD-10 manda resolver no
 * momento da chamada. Aqui fica a reducao por decomposicao, que cobre o que os
 * testes exercitam.
 */
const REMOVER_ACENTOS = (texto: string): string =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * A conversao do login em identificador de URL. Mesma ressalva: no produto e de
 * `plataforma/`; aqui, o suficiente para exercitar o limite do apelido.
 */
const APELIDO_DE_TEXTO = (texto: string): string =>
  texto.toLowerCase().replace(/\s+/g, '-');

/** O resumo da chave. O algoritmo e de T009 — ver `chave-de-redefinicao.ts`. */
const RESUMO_DA_CHAVE: ResumoDaChaveDeRedefinicao = {
  resumir: (chave) => `resumo:${chave}`,
  conferir: (chave, resumo) => resumo === `resumo:${chave}`,
};

/** Um bcrypt de teste, com as duas pontas pareadas. */
const BCRYPT_DE_GERACAO: PrimitivaDeBcryptDeGeracao = {
  gerar(senhaPreProcessada) {
    const marca = Buffer.from(senhaPreProcessada, 'utf8').toString('hex');
    return `$2y$10$${marca.slice(0, 53)}`;
  },
};

const BCRYPT_DE_VERIFICACAO: PrimitivaDeBcrypt = {
  verificar(senhaPreProcessada, hash) {
    return hash === BCRYPT_DE_GERACAO.gerar(senhaPreProcessada);
  },
};

/** Um sorteio determinista: percorre o alfabeto em ordem, e repete. */
function sorteioDeterminista(): (limite: number) => number {
  let passo = 0;
  return (limite) => {
    const valor = passo % limite;
    passo += 1;
    return valor;
  };
}

/** O que o sorteio determinista produz, para a suite poder prever os segredos. */
function segredosPrevistos(): { senha: string; chave: string } {
  const sorteio = sorteioDeterminista();
  return {
    senha: gerarSegredo(
      LIMITES_DO_CADASTRO_DE_FABRICA.comprimentoDaSenhaInicial,
      sorteio,
    ),
    chave: gerarSegredo(
      LIMITES_DO_CADASTRO_DE_FABRICA.comprimentoDaChaveDeRedefinicao,
      sorteio,
    ),
  };
}

/* ───────────────────── a porta de dados em memoria ───────────────────── */

interface LinhaDeConta {
  ID: number;
  user_login: string;
  user_pass: string;
  user_nicename: string;
  user_email: string;
  user_url: string;
  user_registered: string;
  user_activation_key: string;
  user_status: number;
  display_name: string;
}

interface LinhaDeMetadado {
  umeta_id: number;
  user_id: number;
  meta_key: string;
  meta_value: ValorDeColuna;
}

interface Banco {
  readonly porta: PortaDeDados;
  readonly consultas: Consulta[];
  readonly leituras: Consulta[];
  readonly escritas: Consulta[];
  readonly contas: LinhaDeConta[];
  readonly metadados: LinhaDeMetadado[];
  readonly opcoes: Map<string, ValorDeColuna>;
}

/**
 * Uma porta de dados que guarda o que foi gravado **e** registra todo comando.
 *
 * Nao e um banco: e o suficiente para que as consultas que este modulo monta tenham
 * efeito, e para que a suite afirme qual comando saiu, em que ordem e com que
 * parametros.
 */
function bancoEmMemoria(): Banco {
  const contas: LinhaDeConta[] = [];
  const metadados: LinhaDeMetadado[] = [];
  const opcoes = new Map<string, ValorDeColuna>();
  const consultas: Consulta[] = [];
  const leituras: Consulta[] = [];
  const escritas: Consulta[] = [];
  let proximaConta = 1;
  let proximoMetadado = 1;

  function texto(valor: unknown): string {
    if (valor instanceof Uint8Array) {
      return new TextDecoder().decode(valor);
    }
    return String(valor);
  }

  const porta: PortaDeDados = {
    prefixoDeTabela: 'wp_',
    prefixoBaseDeTabela: 'wp_',

    selecionar(consulta) {
      consultas.push(consulta);
      leituras.push(consulta);

      if (consulta.texto.includes('FROM wp_users')) {
        const coluna = consulta.texto.includes('WHERE user_login')
          ? 'user_login'
          : consulta.texto.includes('WHERE user_email')
            ? 'user_email'
            : 'user_nicename';
        const alvo = texto(consulta.parametros[0]);
        return contas.filter(
          (linha) => String(linha[coluna as keyof LinhaDeConta]) === alvo,
        ) as unknown as LinhaDeResultado[];
      }

      if (consulta.texto.includes('FROM wp_usermeta')) {
        const contaId = Number(consulta.parametros[0]);
        const chave = texto(consulta.parametros[1]);
        return metadados.filter(
          (linha) => linha.user_id === contaId && linha.meta_key === chave,
        ) as unknown as LinhaDeResultado[];
      }

      if (consulta.texto.includes('FROM wp_options')) {
        const valor = opcoes.get(texto(consulta.parametros[0]));
        return valor === undefined ? [] : [{ option_value: valor }];
      }

      return [];
    },

    escrever(consulta) {
      consultas.push(consulta);
      escritas.push(consulta);
      const p = consulta.parametros;

      if (consulta.texto.startsWith('INSERT INTO wp_users')) {
        const id = proximaConta;
        proximaConta += 1;
        contas.push({
          ID: id,
          user_login: texto(p[0]),
          user_pass: texto(p[1]),
          user_nicename: texto(p[2]),
          user_email: texto(p[3]),
          user_url: texto(p[4]),
          user_registered: texto(p[5]),
          user_activation_key: texto(p[6]),
          user_status: 0,
          display_name: texto(p[7]),
        });
        return { linhasAfetadas: 1, idGerado: id };
      }

      if (consulta.texto.startsWith('UPDATE wp_users')) {
        const colunas = /SET (.*) WHERE ID = \?$/.exec(consulta.texto);
        const nomes = (colunas?.[1] ?? '')
          .split(', ')
          .map((atribuicao) => atribuicao.replace(' = ?', ''));
        const id = Number(p[p.length - 1]);
        const linha = contas.find((candidata) => candidata.ID === id);
        if (linha === undefined) {
          return { linhasAfetadas: 0, idGerado: null };
        }
        nomes.forEach((nome, posicao) => {
          (linha as unknown as Record<string, ValorDeColuna>)[nome] = texto(
            p[posicao],
          );
        });
        return { linhasAfetadas: 1, idGerado: null };
      }

      if (consulta.texto.startsWith('INSERT INTO wp_usermeta')) {
        const id = proximoMetadado;
        proximoMetadado += 1;
        metadados.push({
          umeta_id: id,
          user_id: Number(p[0]),
          meta_key: texto(p[1]),
          meta_value: p[2] ?? null,
        });
        return { linhasAfetadas: 1, idGerado: id };
      }

      if (consulta.texto.startsWith('UPDATE wp_usermeta')) {
        const contaId = Number(p[1]);
        const chave = texto(p[2]);
        let afetadas = 0;
        for (const linha of metadados) {
          if (linha.user_id === contaId && linha.meta_key === chave) {
            linha.meta_value = p[0] ?? null;
            afetadas += 1;
          }
        }
        return { linhasAfetadas: afetadas, idGerado: null };
      }

      if (consulta.texto.startsWith('INSERT INTO wp_options')) {
        opcoes.set(texto(p[0]), p[1] ?? null);
        return { linhasAfetadas: 1, idGerado: null };
      }

      if (consulta.texto.startsWith('UPDATE wp_options')) {
        opcoes.set(texto(p[1]), p[0] ?? null);
        return { linhasAfetadas: 1, idGerado: null };
      }

      return { linhasAfetadas: 0, idGerado: null };
    },
  };

  return { porta, consultas, leituras, escritas, contas, metadados, opcoes };
}

/* ─────────────────────────── a montagem ─────────────────────────── */

interface Montagem {
  readonly banco: Banco;
  readonly contexto: ContextoDeCadastro;
  readonly enviadas: MensagemDeEmail[];
  readonly disparos: string[];
}

interface OpcoesDaMontagem {
  readonly cadastroAberto?: boolean;
  readonly rede?: boolean;
  readonly ganchos?: GanchosDoCadastro;
  readonly envio?: ResultadoDeEnvio;
  readonly notificacao?: NotificacaoDeContaNova;
  readonly apelidoDeTexto?: (texto: string) => string;
  readonly semMatrizDePapeis?: boolean;
}

function montar(opcoes: OpcoesDaMontagem = {}): Montagem {
  const banco = bancoEmMemoria();
  const armazenamento = criarArmazenamento(banco.porta);
  const enviadas: MensagemDeEmail[] = [];
  const disparos: string[] = [];

  if (opcoes.semMatrizDePapeis !== true) {
    // A matriz de fabrica e semeada ANTES do cadastro, como no legado: povoar e
    // operacao de instalacao, nunca de requisicao (`PERM-13`, BR-MIGRAR-067).
    // O lado do conflito REQ-017 e argumento obrigatorio (ver T002); a suite usa
    // `legado-integral` e um teste proprio afirma que o cadastro nao depende disso.
    armazenamento.papeis.gravarDefinicao(povoarPapeis('legado-integral'));
  }

  // O que foi gravado pela semeadura nao conta como efeito do cadastro.
  banco.consultas.length = 0;
  banco.leituras.length = 0;
  banco.escritas.length = 0;

  const email: PortaDeEmail = {
    enviar(mensagem) {
      enviadas.push(mensagem);
      return opcoes.envio ?? { enviado: true };
    },
  };

  const ganchosDeTeste: GanchosDoCadastro = {
    ...(opcoes.ganchos ?? {}),
  };

  const contexto: ContextoDeCadastro = {
    relogio: { agoraEmSegundos: () => AGORA },
    email,
    contas: armazenamento.contas,
    papeis: armazenamento.papeis,
    opcoes: {
      ...OPCOES_DO_CADASTRO_DE_FABRICA,
      cadastroAberto: opcoes.cadastroAberto ?? true,
      tituloDoSite: TITULO,
      emailDoAdministrador: EMAIL_DO_ADMIN,
    },
    rede:
      opcoes.rede === true
        ? { ativa: true, siteArquivado: false, siteMarcadoComoSpam: false }
        : REDE_INATIVA,
    destinos: {
      cadastroEmRede: 'https://exemplo.invalido/wp-signup.php',
      cadastroDesligado:
        'https://exemplo.invalido/wp-login.php?registration=disabled',
      avisoDeCadastro: 'wp-login.php?checkemail=registered',
    },
    urlDeEntrada: 'https://exemplo.invalido/wp-login.php',
    montarUrlDaRede: (caminho) => `https://exemplo.invalido/${caminho}`,
    removerAcentos: REMOVER_ACENTOS,
    apelidoDeTexto: opcoes.apelidoDeTexto ?? APELIDO_DE_TEXTO,
    resumoDaChave: RESUMO_DA_CHAVE,
    geradorDeHashDeSenha: criarGeradorDeHashDeSenhaDoNucleo({
      bcrypt: BCRYPT_DE_GERACAO,
    }),
    aleatorio: sorteioDeterminista(),
    ...(opcoes.notificacao === undefined
      ? {}
      : { notificacao: opcoes.notificacao }),
    ganchos: {
      ...ganchosDeTeste,
      aoSubmeterCadastro: (login, emailEnviado, erro) => {
        disparos.push('register_post');
        ganchosDeTeste.aoSubmeterCadastro?.(login, emailEnviado, erro);
      },
      filtrarErrosDoCadastro: (erro, login, emailEnviado) => {
        disparos.push('registration_errors');
        return (
          ganchosDeTeste.filtrarErrosDoCadastro?.(erro, login, emailEnviado) ??
          erro
        );
      },
      aoCriarContaNoCadastro: (contaId) => {
        disparos.push('register_new_user');
        ganchosDeTeste.aoCriarContaNoCadastro?.(contaId);
      },
      ...(ganchosDeTeste.filtrarLoginsProibidos === undefined
        ? {}
        : {
            filtrarLoginsProibidos: (lista: readonly string[]) => {
              disparos.push('illegal_user_logins');
              return ganchosDeTeste.filtrarLoginsProibidos?.(lista) ?? lista;
            },
          }),
      ...(ganchosDeTeste.filtrarEmailDoCadastro === undefined
        ? {}
        : {
            filtrarEmailDoCadastro: (valor: string) => {
              disparos.push('user_registration_email');
              return ganchosDeTeste.filtrarEmailDoCadastro?.(valor) ?? valor;
            },
          }),
    },
  };

  return { banco, contexto, enviadas, disparos };
}

const DADOS: DadosDoCadastro = {
  login: 'ada',
  email: 'ada@exemplo.invalido',
};

function recusa(resultado: ResultadoDoCadastro) {
  assert.equal(resultado.cadastrado, false);
  if (resultado.cadastrado !== false || resultado.motivo !== 'dados-recusados') {
    throw new Error('o resultado nao e uma recusa de dados');
  }
  return resultado;
}

function aceite(resultado: ResultadoDoCadastro) {
  if (resultado.cadastrado !== true) {
    throw new Error('o cadastro foi recusado');
  }
  return resultado;
}

/** As duas recusas que nem chegam ao formulario: as duas levam destino. */
function recusaSemFormulario(resultado: ResultadoDoCadastro) {
  if (resultado.cadastrado !== false || resultado.motivo === 'dados-recusados') {
    throw new Error('o resultado nao e uma recusa anterior ao formulario');
  }
  return resultado;
}

/* ───────────────────────────── CA-6.1 ───────────────────────────── */

test('CA-6.1: o cadastro aberto nasce desligado (U1, BR-MIGRAR-021)', () => {
  assert.equal(OPCOES_DO_CADASTRO_DE_FABRICA.cadastroAberto, false);
  assert.equal(OPCOES_DO_CADASTRO_DE_FABRICA.papelPadrao, 'subscriber');
});

test('CA-6.1: desligado, o formulario nao e oferecido — e e uma pergunta propria', () => {
  const { contexto } = montar({ cadastroAberto: false });

  // A borda precisa decidir ANTES de montar o formulario, sem haver envio nenhum.
  assert.equal(cadastroEstaAberto(contexto), false);
  assert.equal(cadastroEstaAberto(montar().contexto), true);
});

test('CA-6.1: desligado, a acao e recusada e NENHUM comando sai (efeito no banco)', () => {
  const { contexto, banco, enviadas } = montar({ cadastroAberto: false });

  const resultado = recusaSemFormulario(cadastrar(DADOS, contexto));

  assert.equal(resultado.motivo, 'cadastro-desligado');
  assert.equal(
    resultado.destinoDeRetorno,
    'https://exemplo.invalido/wp-login.php?registration=disabled',
  );
  // Lista vazia e afirmacao, nao ausencia: o legado nao consulta nada aqui.
  assert.deepEqual(banco.consultas, []);
  assert.deepEqual(enviadas, []);
});

test('UC-21: em rede o cadastro desvia para UC-41, e tambem sem comando nenhum', () => {
  const { contexto, banco } = montar({ rede: true });

  assert.equal(cadastroDesviaParaRede(contexto), true);

  const resultado = recusaSemFormulario(cadastrar(DADOS, contexto));

  assert.equal(resultado.motivo, 'cadastro-em-rede');
  assert.equal(
    resultado.destinoDeRetorno,
    'https://exemplo.invalido/wp-signup.php',
  );
  assert.deepEqual(banco.consultas, []);
});

test('UC-21: o desvio de rede vence o cadastro desligado, porque a guarda vem antes', () => {
  const { contexto } = montar({ rede: true, cadastroAberto: false });

  assert.equal(
    recusaSemFormulario(cadastrar(DADOS, contexto)).motivo,
    'cadastro-em-rede',
  );
});

/* ───────────────────────────── CA-6.2 ───────────────────────────── */

test('CA-6.2: os limites sao 60 e 50, e sao ponto de configuracao nomeado (U2, P6)', () => {
  assert.equal(LIMITES_DO_CADASTRO_DE_FABRICA.comprimentoMaximoDeLogin, 60);
  assert.equal(LIMITES_DO_CADASTRO_DE_FABRICA.comprimentoMaximoDeApelido, 50);
});

test('CA-6.2: no limite do apelido aceita, um caractere acima recusa — e nao trunca', () => {
  const noLimite = montar();
  const aceito = aceite(
    cadastrar({ login: 'a'.repeat(50), email: DADOS.email }, noLimite.contexto),
  );
  assert.equal(contarCaracteres(aceito.apelido), 50);

  const acima = montar();
  const recusado = recusa(
    cadastrar({ login: 'a'.repeat(51), email: DADOS.email }, acima.contexto),
  );

  // O motivo real existe, e e o do apelido.
  assert.deepEqual(codigosDeErro(recusado.causa ?? erroDeCadastro()), [
    'user_nicename_too_long',
  ]);
  // E NADA foi gravado: nenhum truncamento silencioso, nenhuma conta.
  assert.deepEqual(acima.banco.contas, []);
});

test('CA-6.2: no limite do login aceita, um caractere acima recusa — e nao trunca', () => {
  // O apelido e fixado curto para que o limite do LOGIN seja o que decide: com o
  // apelido derivado do proprio login, o limite de 50 recusaria antes dos 60.
  const noLimite = montar({ apelidoDeTexto: () => 'curto' });
  aceite(
    cadastrar({ login: 'a'.repeat(60), email: DADOS.email }, noLimite.contexto),
  );
  assert.equal(contarCaracteres(noLimite.banco.contas[0]?.user_login ?? ''), 60);

  const acima = montar({ apelidoDeTexto: () => 'curto' });
  const recusado = recusa(
    cadastrar({ login: 'a'.repeat(61), email: DADOS.email }, acima.contexto),
  );

  assert.deepEqual(codigosDeErro(recusado.causa ?? erroDeCadastro()), [
    'user_login_too_long',
  ]);
  assert.deepEqual(acima.banco.contas, []);
});

test('CA-6.2: o visitante ve `registerfail`, nao o codigo do limite (P1)', () => {
  const { contexto } = montar();

  const recusado = recusa(
    cadastrar({ login: 'a'.repeat(51), email: DADOS.email }, contexto),
  );

  // O legado joga fora o motivo e poe `registerfail` no lugar. Surfacear o codigo
  // especifico produziria um sistema mais informativo que o legado.
  assert.deepEqual(codigosDeErro(recusado.erro), ['registerfail']);
  assert.equal(
    recusado.erro.itens[0]?.mensagem,
    MENSAGENS_DE_ERRO_DE_CADASTRO.registerfail.replace('%s', EMAIL_DO_ADMIN),
  );
  // E a causa continua disponivel como diagnostico (P7), sem decidir nada.
  assert.notEqual(recusado.causa, undefined);
});

test('CA-6.2: a contagem e por caractere, nao por unidade de UTF-16', () => {
  // Um par substituto conta 1 na contagem do legado e 2 em `String.length`.
  const comEmoji = `${'a'.repeat(49)}\u{1F600}`;
  assert.equal(comEmoji.length, 51);
  assert.equal(contarCaracteres(comEmoji), 50);
});

/* ───────────────────────────── CA-6.3 ───────────────────────────── */

test('CA-6.3: login ja em uso devolve erro no formulario, e nada e gravado', () => {
  const { contexto, banco } = montar();
  aceite(cadastrar(DADOS, contexto));
  const contasAntes = banco.contas.length;

  const recusado = recusa(
    cadastrar({ login: 'ada', email: 'outra@exemplo.invalido' }, contexto),
  );

  assert.deepEqual(codigosDeErro(recusado.erro), ['username_exists']);
  assert.equal(
    recusado.erro.itens[0]?.mensagem,
    MENSAGENS_DE_ERRO_DE_CADASTRO.username_exists,
  );
  // O login volta para o formulario: este caso NAO o apaga.
  assert.equal(recusado.valoresParaOFormulario.login, 'ada');
  assert.equal(banco.contas.length, contasAntes);
});

test('CA-6.3: e-mail ja em uso devolve erro, com a URL de entrada na mensagem', () => {
  const { contexto } = montar();
  aceite(cadastrar(DADOS, contexto));

  const recusado = recusa(
    cadastrar({ login: 'grace', email: DADOS.email }, contexto),
  );

  assert.deepEqual(codigosDeErro(recusado.erro), ['email_exists']);
  assert.equal(
    recusado.erro.itens[0]?.mensagem,
    MENSAGENS_DE_ERRO_DE_CADASTRO.email_exists.replace(
      '%s',
      'https://exemplo.invalido/wp-login.php',
    ),
  );
});

test('CA-6.3: a unicidade e conferida EM CODIGO, nao no armazenamento (U2, REQ-010)', () => {
  const { contexto, banco } = montar();
  aceite(cadastrar(DADOS, contexto));

  cadastrar({ login: 'ada', email: 'outra@exemplo.invalido' }, contexto);

  // A recusa veio de uma LEITURA, nao de uma restricao: o comando que recusou e
  // um SELECT, e o INSERT nunca foi tentado. REQ-010 esta bloqueado e `plan.md` e
  // explicito em nao declarar a restricao.
  const selecoesDeLogin = banco.leituras.filter((consulta) =>
    consulta.texto.includes('WHERE user_login'),
  );
  assert.ok(selecoesDeLogin.length > 0);
  assert.equal(banco.contas.length, 1);
});

test('o formulario em branco soma DOIS codigos, como o legado soma', () => {
  const { contexto } = montar();

  const recusado = recusa(cadastrar({ login: '', email: '' }, contexto));

  assert.deepEqual(codigosDeErro(recusado.erro), [
    'empty_username',
    'empty_email',
  ]);
});

test('login invalido e e-mail invalido APAGAM o valor que o formulario reexibe', () => {
  const { contexto } = montar();

  const recusado = recusa(
    cadastrar({ login: 'a<b>c', email: 'nao-e-endereco' }, contexto),
  );

  assert.deepEqual(codigosDeErro(recusado.erro), [
    'invalid_username',
    'invalid_email',
  ]);
  assert.deepEqual(recusado.valoresParaOFormulario, { login: '', email: '' });
});

/* ───────────────────────────── CA-6.4 ───────────────────────────── */

test('CA-6.4: a conta criada recebe o papel padrao de menor poder', () => {
  const { contexto, banco } = montar();

  const resultado = aceite(cadastrar(DADOS, contexto));

  assert.equal(resultado.papel.papel, 'subscriber');
  const capacidades = banco.metadados.find(
    (linha) => linha.meta_key === 'wp_capabilities',
  );
  assert.notEqual(capacidades, undefined);
  assert.equal(
    new TextDecoder().decode(capacidades?.meta_value as Uint8Array),
    'a:1:{s:10:"subscriber";b:1;}',
  );
});

test('CA-6.4: as duas chaves sao gravadas, e `user_level` DEPOIS de `capabilities`', () => {
  const { contexto, banco } = montar();

  aceite(cadastrar(DADOS, contexto));

  const chaves = banco.escritas
    .filter((consulta) => consulta.texto.includes('wp_usermeta'))
    .map((consulta) => String(consulta.parametros[1]));
  assert.deepEqual(chaves, ['wp_capabilities', 'wp_user_level']);

  const nivel = banco.metadados.find(
    (linha) => linha.meta_key === 'wp_user_level',
  );
  assert.equal(String(nivel?.meta_value), '0');
});

test('CA-6.4: o nivel e DERIVADO da matriz, logo nao escolhe lado no conflito REQ-017', () => {
  const comNiveis = montar();
  const semNiveis = montar({ semMatrizDePapeis: true });
  semNiveis.contexto.papeis.gravarDefinicao(povoarPapeis('req-017-sem-niveis'));

  aceite(cadastrar(DADOS, comNiveis.contexto));
  aceite(cadastrar(DADOS, semNiveis.contexto));

  const nivelDe = (banco: Banco) =>
    String(
      banco.metadados.find((linha) => linha.meta_key === 'wp_user_level')
        ?.meta_value,
    );

  // Para o papel de fabrica do cadastro os dois lados dao o MESMO valor.
  assert.equal(nivelDe(comNiveis.banco), '0');
  assert.equal(nivelDe(semNiveis.banco), '0');

  // E a derivacao continua sendo derivacao: para outro papel os lados divergem,
  // o que prova que nenhum numero esta tabelado aqui.
  assert.equal(
    nivelDasCapacidades(
      nomesDaContaComPapel(comNiveis.contexto.papeis, 'administrator'),
    ),
    10,
  );
  assert.equal(
    nivelDasCapacidades(
      nomesDaContaComPapel(semNiveis.contexto.papeis, 'administrator'),
    ),
    0,
  );
});

test('o nivel sobe por NOME de capacidade presente, mesmo negada (ADR-0009)', () => {
  assert.equal(nivelDasCapacidades(['read', 'level_7']), 7);
  assert.equal(nivelDasCapacidades(['level_10', 'level_2']), 10);
  assert.equal(nivelDasCapacidades(['level_11']), 0);
  assert.equal(nivelDasCapacidades(['LEVEL_3']), 3);
  assert.equal(nivelDasCapacidades([]), 0);
});

test('CA-6.4: a conta nasce com senha que o titular nao definiu, e so o hash e gravado', () => {
  const { contexto, banco } = montar();
  const previstos = segredosPrevistos();

  const resultado = aceite(cadastrar(DADOS, contexto));

  const linha = banco.contas[0];
  assert.notEqual(linha, undefined);
  assert.equal(linha?.user_login, 'ada');
  assert.equal(linha?.display_name, 'ada');
  assert.equal(linha?.user_url, '');

  // O hash e o do formato corrente, e confere com a senha gerada.
  const verificador = criarVerificadorDeSenhaDoNucleo({
    bcrypt: BCRYPT_DE_VERIFICACAO,
  });
  assert.ok((linha?.user_pass ?? '').startsWith('$wp'));
  assert.equal(verificador.verificar(previstos.senha, linha?.user_pass ?? ''), true);

  // A senha em claro NAO e gravada e NAO e devolvida (CA-1.3 valendo na criacao).
  const tudoQueFoiGravado = JSON.stringify(banco.escritas.map(String));
  assert.ok(!tudoQueFoiGravado.includes(previstos.senha));
  assert.ok(!JSON.stringify(resultado).includes(previstos.senha));
});

test('a senha gerada tem o comprimento declarado e vem do alfabeto do legado', () => {
  const senha = gerarSegredo(
    LIMITES_DO_CADASTRO_DE_FABRICA.comprimentoDaSenhaInicial,
    sorteioDeterminista(),
  );
  assert.equal(senha.length, 12);
  assert.ok([...senha].every((caractere) => ALFABETO_DE_SEGREDO.includes(caractere)));
  // Comprimento zero nao sorteia nada.
  let sorteios = 0;
  assert.equal(
    gerarSegredo(0, () => {
      sorteios += 1;
      return 0;
    }),
    '',
  );
  assert.equal(sorteios, 0);
});

test('`user_registered` e texto literal em UTC, com os 19 caracteres do banco', () => {
  assert.equal(dataDoBanco(AGORA), '2023-11-14 22:13:20');
  assert.equal(dataDoBanco(0), '1970-01-01 00:00:00');
});

/* ───────────────────────────── CA-6.5 ───────────────────────────── */

test('CA-6.5: o titular recebe um caminho para definir a senha', () => {
  const { contexto, enviadas, banco } = montar();
  const previstos = segredosPrevistos();

  const resultado = aceite(cadastrar(DADOS, contexto));

  assert.equal(resultado.chaveEmitida, true);
  assert.deepEqual(resultado.envios, [{ enviado: true }]);
  assert.equal(enviadas.length, 1);

  const mensagem = enviadas[0];
  assert.deepEqual(mensagem?.destinatarios, ['ada@exemplo.invalido']);
  assert.equal(mensagem?.assunto, assuntoDaMensagemDoTitular(TITULO));
  assert.equal(mensagem?.assunto, '[Sitio] Login Details');
  assert.deepEqual(mensagem?.cabecalhos, []);
  assert.deepEqual(mensagem?.anexos, []);

  const caminho = caminhoDeDefinicaoDeSenha('ada', previstos.chave);
  assert.ok(mensagem?.corpo.includes(`https://exemplo.invalido/${caminho}`));
  assert.ok(mensagem?.corpo.includes('Username: ada'));
  assert.ok(mensagem?.corpo.includes('\r\n'));

  // A chave em claro so existe no e-mail: nao volta no resultado.
  assert.ok(!JSON.stringify(resultado).includes(previstos.chave));
  // E so o resumo dela e gravado, com o instante prefixado.
  assert.equal(
    banco.contas[0]?.user_activation_key,
    `${AGORA}:resumo:${previstos.chave}`,
  );
});

test('CA-6.5: a chave vale 24 horas — no ultimo instante aceita, um depois recusa (P6)', () => {
  assert.equal(
    LIMITES_DO_CADASTRO_DE_FABRICA.prazoDaChaveDeRedefinicaoEmSegundos,
    24 * SEGUNDOS_POR_HORA,
  );

  const { contexto, banco } = montar();
  aceite(cadastrar(DADOS, contexto));
  const gravada = banco.contas[0]?.user_activation_key ?? '';
  const prazo = LIMITES_DO_CADASTRO_DE_FABRICA.prazoDaChaveDeRedefinicaoEmSegundos;

  assert.equal(instanteDaChaveGravada(gravada), AGORA);
  assert.equal(chaveDeRedefinicaoVencida(gravada, AGORA + prazo, prazo), false);
  assert.equal(chaveDeRedefinicaoVencida(gravada, AGORA + prazo + 1, prazo), true);
});

test('chave sem instante prefixado nao ganha prazo nenhum', () => {
  assert.equal(instanteDaChaveGravada('sem-prefixo'), null);
  assert.equal(instanteDaChaveGravada(':resumo'), null);
  assert.equal(instanteDaChaveGravada('abc:resumo'), null);
  assert.equal(chaveDeRedefinicaoVencida('sem-prefixo', AGORA, 10), true);
});

test('o caminho de definicao de senha preserva os nomes de parametro da tela', () => {
  assert.equal(
    caminhoDeDefinicaoDeSenha('ada lovelace', 'CHAVE'),
    'wp-login.php?action=rp&key=CHAVE&login=ada%20lovelace',
  );
  // A codificacao e a crua do legado, nao a do runtime: cinco caracteres a mais.
  assert.equal(codificarParaUrlCrua("a!'()*"), 'a%21%27%28%29%2A');
});

test('CA-6.5: falha de envio NAO desfaz o cadastro, e volta como valor (P7)', () => {
  const { contexto, banco } = montar({
    envio: { enviado: false, motivo: 'transporte indisponivel' },
  });

  const resultado = aceite(cadastrar(DADOS, contexto));

  assert.deepEqual(resultado.envios, [
    { enviado: false, motivo: 'transporte indisponivel' },
  ]);
  // A conta existe e a chave foi gravada antes do envio.
  assert.equal(banco.contas.length, 1);
  assert.ok((banco.contas[0]?.user_activation_key ?? '').startsWith(`${AGORA}:`));
});

test('substituir a notificacao tira a emissao da chave junto, como no legado (EXT-SUBST)', () => {
  const { contexto, banco, enviadas } = montar({
    notificacao: { notificar: () => ({ envios: [], chaveEmitida: false }) },
  });

  const resultado = aceite(cadastrar(DADOS, contexto));

  assert.equal(resultado.chaveEmitida, false);
  assert.deepEqual(enviadas, []);
  // Nenhuma chave gravada: a coluna fica na sentinela vazia do DDL.
  assert.equal(banco.contas[0]?.user_activation_key, '');
});

/* ───────────────────────────── CA-6.6 ───────────────────────────── */

test('CA-6.6: a lista de logins proibidos nasce vazia (U3, BR-MIGRAR-023)', () => {
  assert.deepEqual(LOGINS_PROIBIDOS_DE_FABRICA, []);
});

test('CA-6.6: sem extensao registrada, qualquer login valido e aceito', () => {
  const { contexto, disparos } = montar();

  aceite(cadastrar({ login: 'admin', email: DADOS.email }, contexto));

  // Nenhum ponto de logins proibidos disparou, porque nenhum foi registrado.
  assert.ok(!disparos.includes('illegal_user_logins'));
});

test('CA-6.6: com a lista preenchida, o login e recusado — e a caixa nao salva', () => {
  const { contexto, banco } = montar({
    ganchos: { filtrarLoginsProibidos: () => ['Admin'] },
  });

  const recusado = recusa(
    cadastrar({ login: 'admin', email: DADOS.email }, contexto),
  );

  assert.deepEqual(codigosDeErro(recusado.erro), ['invalid_username']);
  assert.equal(
    recusado.erro.itens[0]?.mensagem,
    MENSAGENS_DE_ERRO_DE_CADASTRO.invalid_username_nao_permitido,
  );
  assert.deepEqual(banco.contas, []);
});

/* ─────────────────── pontos de extensao e ordem ─────────────────── */

test('P2: os pontos de extensao disparam na ordem do legado', () => {
  const { contexto, disparos } = montar({
    ganchos: {
      filtrarLoginsProibidos: (lista) => lista,
      filtrarEmailDoCadastro: (valor) => valor,
    },
  });

  aceite(cadastrar(DADOS, contexto));

  // `illegal_user_logins` aparece DUAS vezes porque o legado o consulta em dois
  // lugares: no fluxo de registro e, de novo, na criacao da conta. Sao duas
  // conferencias do mesmo fato, e o P8 nao deixa remover uma delas — ver
  // `criacao-de-conta.ts`.
  assert.deepEqual(disparos, [
    'user_registration_email',
    'illegal_user_logins',
    'register_post',
    'registration_errors',
    'illegal_user_logins',
    'register_new_user',
  ]);
});

test('P2: o filtro de erros pode recusar um cadastro que passou em tudo', () => {
  const { contexto, banco } = montar({
    ganchos: {
      filtrarErrosDoCadastro: () =>
        erroDeCadastro({
          codigo: 'invalid_username',
          mensagem: 'recusado por extensao',
        }),
    },
  });

  const recusado = recusa(cadastrar(DADOS, contexto));

  assert.deepEqual(codigosDeErro(recusado.erro), ['invalid_username']);
  assert.deepEqual(banco.contas, []);
});

test('P2: o filtro de erros pode liberar um cadastro que as conferencias recusaram', () => {
  const semFiltro = montar();
  assert.deepEqual(
    codigosDeErro(recusa(cadastrar({ login: '', email: '' }, semFiltro.contexto)).erro),
    ['empty_username', 'empty_email'],
  );

  const comFiltro = montar({
    ganchos: { filtrarErrosDoCadastro: () => erroDeCadastro() },
  });
  const recusado = recusa(cadastrar({ login: '', email: '' }, comFiltro.contexto));

  // O filtro apagou os dois codigos e o fluxo ATRAVESSOU o portao: o erro que
  // sobra ja e o da criacao, nao o das conferencias. E o legado — o filtro pode
  // liberar, e a criacao continua guardando por conta propria.
  assert.deepEqual(codigosDeErro(recusado.erro), ['registerfail']);
  assert.deepEqual(codigosDeErro(recusado.causa ?? erroDeCadastro()), [
    'empty_user_login',
  ]);
  assert.deepEqual(comFiltro.banco.contas, []);
});

test('P2: o filtro do e-mail roda antes de qualquer conferencia dele', () => {
  const { contexto, banco } = montar({
    ganchos: { filtrarEmailDoCadastro: () => 'trocado@exemplo.invalido' },
  });

  aceite(cadastrar({ login: 'ada', email: 'nao-e-endereco' }, contexto));

  assert.equal(banco.contas[0]?.user_email, 'trocado@exemplo.invalido');
});

/* ───────────────── autorizacao, sanitizacao e destino ───────────────── */

test('P4: o cadastro nao consulta capacidade de ninguem antes de criar a conta', () => {
  const { contexto, banco } = montar();

  aceite(cadastrar(DADOS, contexto));

  const posicaoDaInsercao = banco.consultas.findIndex((consulta) =>
    consulta.texto.startsWith('INSERT INTO wp_users'),
  );
  const leiturasDeCapacidade = banco.consultas
    .slice(0, posicaoDaInsercao)
    .filter((consulta) => consulta.texto.includes('wp_usermeta'));

  // O visitante nao tem papel: nao ha capacidade a consultar, e o legado nao
  // consulta nenhuma. O unico toque em `capabilities` e a GRAVACAO do papel novo.
  assert.deepEqual(leiturasDeCapacidade, []);
});

test('a sanitizacao estrita reduz ao conjunto portavel; a nao estrita nao', () => {
  assert.equal(sanitizarLogin('ada+lovelace', REMOVER_ACENTOS), 'ada+lovelace');
  assert.equal(sanitizarLogin('ada+lovelace', REMOVER_ACENTOS, true), 'adalovelace');
  assert.equal(sanitizarLogin('ada.lovelace-1_@x', REMOVER_ACENTOS, true), 'ada.lovelace-1_@x');
  // Acento, etiqueta, octeto e referencia de caractere saem nos dois modos.
  assert.equal(sanitizarLogin('ád<b>a</b>%41&amp;', REMOVER_ACENTOS), 'ada');
  // Espaco das pontas sai DEPOIS da reducao estrita, e o interno e consolidado.
  assert.equal(sanitizarLogin('  ada   lovelace  ', REMOVER_ACENTOS, true), 'ada lovelace');
});

test('o apelido e derivado do login e NAO e truncado (U2)', () => {
  assert.equal(apelidoDoLogin('Ada Lovelace', APELIDO_DE_TEXTO, REMOVER_ACENTOS), 'ada-lovelace');
  assert.equal(
    contarCaracteres(apelidoDoLogin('a'.repeat(80), APELIDO_DE_TEXTO, REMOVER_ACENTOS)),
    80,
  );
});

test('o destino aceito e o pedido, ou o aviso de cadastro', () => {
  const { contexto } = montar();

  assert.equal(destinoDeRetorno(DADOS, contexto), 'wp-login.php?checkemail=registered');
  assert.equal(
    destinoDeRetorno({ ...DADOS, destinoPedido: '' }, contexto),
    'wp-login.php?checkemail=registered',
  );
  assert.equal(
    destinoDeRetorno({ ...DADOS, destinoPedido: '/bem-vinda' }, contexto),
    '/bem-vinda',
  );
  assert.equal(
    aceite(cadastrar({ ...DADOS, destinoPedido: '/bem-vinda' }, contexto))
      .destinoDeRetorno,
    '/bem-vinda',
  );
});

/* ─────────────────── a criacao de conta, por ela mesma ─────────────────── */

test('a criacao confere na ordem das linhas do legado, e devolve na primeira', () => {
  const { contexto, banco } = montar();
  const colaboradores = {
    contas: contexto.contas,
    papeis: contexto.papeis,
    limites: LIMITES_DO_CADASTRO_DE_FABRICA,
    papelPadrao: 'subscriber',
    loginsProibidos: [] as readonly string[],
    removerAcentos: REMOVER_ACENTOS,
    apelidoDeTexto: APELIDO_DE_TEXTO,
    geradorDeHashDeSenha: criarGeradorDeHashDeSenhaDoNucleo({
      bcrypt: BCRYPT_DE_GERACAO,
    }),
    agoraEmSegundos: AGORA,
  };

  const vazio = criarConta(
    { login: '', email: DADOS.email, senhaEmClaro: 'x' },
    colaboradores,
  );
  assert.equal(vazio.criada, false);
  // Login vazio nao chega a consultar o banco: a conferencia devolve antes.
  assert.deepEqual(banco.consultas, []);

  const longo = criarConta(
    { login: 'a'.repeat(61), email: DADOS.email, senhaEmClaro: 'x' },
    colaboradores,
  );
  assert.equal(longo.criada, false);
  assert.deepEqual(banco.consultas, []);
});

test('a criacao recusa o login da lista de proibidos, com o texto dela', () => {
  const { contexto } = montar();
  const resultado = criarConta(
    { login: 'raiz', email: DADOS.email, senhaEmClaro: 'x' },
    {
      contas: contexto.contas,
      papeis: contexto.papeis,
      limites: LIMITES_DO_CADASTRO_DE_FABRICA,
      papelPadrao: 'subscriber',
      loginsProibidos: ['RAIZ'],
      removerAcentos: REMOVER_ACENTOS,
      apelidoDeTexto: APELIDO_DE_TEXTO,
      geradorDeHashDeSenha: criarGeradorDeHashDeSenhaDoNucleo({
        bcrypt: BCRYPT_DE_GERACAO,
      }),
      agoraEmSegundos: AGORA,
    },
  );

  assert.equal(resultado.criada, false);
  if (resultado.criada === false) {
    assert.deepEqual(codigosDeErro(resultado.erro), ['invalid_username']);
    assert.equal(
      resultado.erro.itens[0]?.mensagem,
      MENSAGENS_DE_ERRO_DE_CADASTRO.invalid_username_na_criacao,
    );
  }
});

/* ───────────────────── a geracao do hash da senha ───────────────────── */

test('o hash gerado e conferido pelo verificador do nucleo, pelo mesmo caminho', () => {
  const gerador = criarGeradorDeHashDeSenhaDoNucleo({ bcrypt: BCRYPT_DE_GERACAO });
  const verificador = criarVerificadorDeSenhaDoNucleo({
    bcrypt: BCRYPT_DE_VERIFICACAO,
  });

  const hash = gerador.gerar('segredo');

  assert.ok(hash.startsWith('$wp'));
  assert.equal(hash.slice(3).length, 60);
  assert.equal(verificador.verificar('segredo', hash), true);
  assert.equal(verificador.verificar('outra', hash), false);
  // O pre-processamento e o mesmo das duas pontas.
  assert.equal(hash, `$wp${BCRYPT_DE_GERACAO.gerar(preProcessarSenhaParaBcrypt('segredo'))}`);
});

test('senha acima do teto grava o hash que nunca confere, e a conta existe', () => {
  const gerador = criarGeradorDeHashDeSenhaDoNucleo({ bcrypt: BCRYPT_DE_GERACAO });
  const verificador = criarVerificadorDeSenhaDoNucleo({
    bcrypt: BCRYPT_DE_VERIFICACAO,
  });

  const enorme = 'a'.repeat(COMPRIMENTO_MAXIMO_DE_SENHA + 1);
  const hash = gerador.gerar(enorme);

  assert.equal(hash, HASH_QUE_NUNCA_CONFERE);
  assert.equal(verificador.verificar(enorme, hash), false);
  // No limite ainda gera hash de verdade.
  assert.ok(gerador.gerar('a'.repeat(COMPRIMENTO_MAXIMO_DE_SENHA)).startsWith('$wp'));
});
