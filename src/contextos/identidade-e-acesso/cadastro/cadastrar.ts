/**
 * A operacao de cadastro aberto: US-6, e os seis critérios CA-6.1 a CA-6.6.
 *
 * O fluxo e o de UC-21, passo por passo e **na ordem dele**, somado as duas guardas
 * que a tela faz antes de o formulario ser processado:
 *
 * | passo de UC-21 | aqui | critério |
 * |---|---|---|
 * | — (guarda da tela, `wp-login.php:1104`) | desvio da instalacao em rede | — |
 * | 2. confere que o registro aberto esta ligado | `cadastroEstaAberto` | CA-6.1 |
 * | 1. visitante informa o login desejado e o e-mail | `cadastrar` | — |
 * | 3. valida o tamanho do login e a unicidade | `conferirLogin` e `conferirEmail`, mais `criarConta` | CA-6.2, CA-6.3, CA-6.6 |
 * | 4. cria a conta com o papel padrao | `criarConta` | CA-6.4 |
 * | 5. envia ao e-mail informado o link para definir a senha | `notificacao.notificar` | CA-6.5 |
 * | 6. informa ao visitante que a conta foi criada | `destinoDeRetorno` | — |
 *
 * **Autorizacao desta operacao, declarada como o P4 exige: nenhuma capacidade, e a
 * declaracao e o ponto.** A autorizacao de UC-21 nao e capacidade nenhuma — o caso de
 * uso registra, na propria linha de autorizacao, *"a opcao `users_can_register`, que
 * nasce desligada. Sem ela, este caso de uso nao existe na instalacao"* —, e
 * `target_screens.md` repete para a tela: *"capacidade exigida: nenhuma checagem
 * `current_user_can()` neste arquivo"*. O ator e o **visitante**, que por definicao nao
 * tem papel. Acrescentar verificacao de capacidade aqui tornaria o cadastro aberto
 * impossivel, que e o avesso da historia.
 *
 * O que guarda a superficie e, em lugar da capacidade, **a opcao**: desligada, a acao e
 * recusada. E a quarta camada que o **P4** descreve — *"cinco atestados decidem acesso
 * sem consultar capacidade alguma"* — com uma diferenca que importa: esta **falha
 * fechada** por padrao, e e a unica porta deste pacote que nasce fechada.
 *
 * **O que esta operacao nao faz, e por que.**
 *
 * - **Nao autentica a conta criada.** O legado nao abre sessao no cadastro: quem se
 *   cadastra e mandado para o aviso de e-mail enviado e entra depois, pela tela de
 *   entrada. Abrir sessao aqui daria acesso a quem ainda nao provou o e-mail.
 * - **Nao conta tentativa e nao limita taxa.** `REQ-160` esta em `do-not-rewrite.md` e
 *   o **P6** poe limite de taxa fora do nucleo, *"como decisao de implantacao, para nao
 *   inventar numero que o produto nunca teve"*.
 * - **Nao cria cadastro pendente nem reserva nome.** Isso e `U7`/UC-41, em `BC-12`, e
 *   esta fora deste pacote.
 * - **Nao monta HTML e nao escolhe mensagem de tela.** As 8 cadeias literais de
 *   `SCR-005` sao da borda; daqui saem os codigos, as mensagens de erro e os valores
 *   que o formulario tem de reexibir.
 */

import type { ResultadoDeEnvio } from '../portas/index.js';
import type { ResultadoDaAtribuicaoDePapel } from './atribuicao-de-papel.js';
import {
  LIMITES_DO_CADASTRO_DE_FABRICA,
  LOGINS_PROIBIDOS_DE_FABRICA,
} from './configuracao-de-cadastro.js';
import type { ContextoDeCadastro } from './contexto-de-cadastro.js';
import { criarConta } from './criacao-de-conta.js';
import {
  erroDeCadastro,
  erroQueOVisitanteVe,
  MENSAGENS_DE_ERRO_DE_CADASTRO,
  temAlgumErro,
  type ErroDeCadastro,
  type ItemDeErroDeCadastro,
} from './erro-de-cadastro.js';
import {
  ALEATORIEDADE_DO_RUNTIME,
  gerarSegredo,
} from './geracao-de-segredo.js';
import { criarNotificacaoDeContaNovaDoNucleo } from './notificacao-de-conta-nova.js';
import {
  loginEnviadoEhValido,
  loginEstaProibido,
  sanitizarLoginDoCadastro,
} from './validacao-de-cadastro.js';
import { ehEmail } from '../autenticacao/normalizacao-de-credencial.js';

/**
 * O que o visitante envia.
 *
 * Os nomes de campo do formulario sao contrato **externo** nesta tela:
 * `target_screens.md` poe `SCR-005` na familia C — *"o nome do campo e a API: aplicacao
 * externa ou tema de terceiro depende dele"* — e o cenario de paridade da tela cobra
 * *"o nome de cada campo e identico nas duas… nenhum e renomeado"*. A correspondencia
 * fica registrada aqui para que quem montar a borda HTTP nao a invente:
 *
 * | campo do formulario | aqui |
 * |---|---|
 * | `user_login` | `login` |
 * | `user_email` | `email` |
 * | `redirect_to` | `destinoPedido` |
 *
 * ⚠️ **Nenhum dos campos e obrigatorio no HTML do legado**, e `target_screens.md`
 * avisa o porque de isso importar: *"um alvo que acrescenta `required` muda o
 * comportamento observavel da tela sem que ninguem tenha decidido"*. Por isso os dois
 * campos aqui sao `string` e nao `string` nao-vazia: campo em branco e **entrada
 * valida** que produz erro de servidor, nao entrada impossivel.
 */
export interface DadosDoCadastro {
  /** Campo `user_login`. */
  readonly login: string;
  /** Campo `user_email`. */
  readonly email: string;
  /** Campo `redirect_to`. Vazio ou ausente cai no aviso de cadastro. */
  readonly destinoPedido?: string;
}

export type ResultadoDoCadastro =
  | {
      readonly cadastrado: true;
      readonly contaId: number;
      /** O login **como foi gravado**, que pode diferir do enviado. */
      readonly login: string;
      readonly apelido: string;
      readonly papel: ResultadoDaAtribuicaoDePapel;
      /** A chave foi emitida e gravada? Nunca o valor dela (CA-4.1). */
      readonly chaveEmitida: boolean;
      /** Uma tentativa de envio por mensagem emitida, na ordem. */
      readonly envios: readonly ResultadoDeEnvio[];
      readonly destinoDeRetorno: string;
    }
  | {
      readonly cadastrado: false;
      readonly motivo: 'cadastro-em-rede';
      readonly destinoDeRetorno: string;
    }
  | {
      readonly cadastrado: false;
      readonly motivo: 'cadastro-desligado';
      readonly destinoDeRetorno: string;
    }
  | {
      readonly cadastrado: false;
      readonly motivo: 'dados-recusados';
      readonly erro: ErroDeCadastro;
      /**
       * O que o formulario tem de reexibir — os pontos de interpolacao `{{user_login}}`
       * e `{{user_email}}` de `SCR-005`.
       *
       * ⚠️ **Eles sao apagados em dois casos, e isso e do legado:** login com caractere
       * ilegal volta **vazio**, e e-mail que nao e endereco volta **vazio**. Reexibir o
       * que foi digitado nesses dois casos mudaria a tela.
       */
      readonly valoresParaOFormulario: {
        readonly login: string;
        readonly email: string;
      };
      /**
       * O motivo original, quando o erro visivel e `registerfail`.
       *
       * ⚠️ **Observabilidade, nao fluxo.** O legado descarta este erro; o **P7**
       * autoriza acrescentar registro e diagnostico *"desde que nenhuma decisao do
       * sistema passe a depender deles"*, e **nenhuma ramificacao deste modulo o le**.
       * Uma borda que o mostrasse ao visitante produziria um sistema mais informativo
       * que o legado, que o **P1** trata como divergencia. Ver
       * `erro-de-cadastro.ts`.
       */
      readonly causa?: ErroDeCadastro;
    };

/**
 * O cadastro aberto esta ligado? (CA-6.1)
 *
 * Existe como funcao propria porque a borda precisa dela **antes** de montar o
 * formulario: CA-6.1 cobra duas coisas — *"o formulario nao e oferecido"* **e** *"a
 * acao e recusada"* —, e a primeira e decidida sem haver envio nenhum. `cadastrar`
 * tambem a consulta, para que nenhum caminho entre sem passar por ela.
 */
export function cadastroEstaAberto(contexto: ContextoDeCadastro): boolean {
  return contexto.opcoes.cadastroAberto;
}

/**
 * A instalacao em rede desvia o cadastro para outro caso de uso? (UC-21, fluxo
 * alternativo *"Instalacao em rede"*)
 *
 * Separada de `cadastrar` pelo mesmo motivo de `verificarSiteDaRede` em
 * `../autenticacao/autenticar.ts`: no legado ela nao e validacao, e guarda da tela, e
 * quem a chama e a borda — antes de ler o corpo da requisicao.
 *
 * ⚠️ Decide **somente** pela rede estar ativa. Os eixos de supervisao do site
 * (arquivado, spam) nao entram: eles recusam a **entrada** (CA-1.5) e nenhum documento
 * deste pacote diz o que o cadastro faz com eles. `REQ-133` esta em
 * `do-not-rewrite.md`.
 */
export function cadastroDesviaParaRede(contexto: ContextoDeCadastro): boolean {
  return contexto.rede.ativa;
}

/**
 * O destino do cadastro aceito (passo 6 de UC-21): o pedido, ou o aviso de cadastro.
 *
 * O legado usa o destino pedido **somente quando ele nao esta vazio**, e nao refina
 * nada por capacidade — ao contrario da entrada, em que `destinoDeRetorno` tem o
 * refinamento que `../autenticacao/autenticar.ts` deixou nomeado. Aqui nao ha
 * identidade autenticada para refinar por.
 */
export function destinoDeRetorno(
  dados: DadosDoCadastro,
  contexto: ContextoDeCadastro,
): string {
  const pedido = dados.destinoPedido ?? '';
  return pedido === '' ? contexto.destinos.avisoDeCadastro : pedido;
}

/**
 * As conferencias do login, na ordem e com a semantica do legado.
 *
 * **E uma cadeia de `senao`, nao uma lista de validacoes**: no maximo **um** erro de
 * login e somado, e o primeiro que casa encerra a conferencia. Somar todos daria ao
 * visitante mais informacao do que o legado da.
 *
 * ⚠️ A conferencia de validade pergunta sobre o texto **cru**, nao sobre o sanitizado —
 * ver `validacao-de-cadastro.ts`. E e esse caso, e so esse, que **apaga** o login do
 * formulario.
 */
function conferirLogin(
  loginEnviado: string,
  loginSanitizado: string,
  contexto: ContextoDeCadastro,
): { readonly item: ItemDeErroDeCadastro | null; readonly loginParaOFormulario: string } {
  if (loginSanitizado === '') {
    return {
      item: {
        codigo: 'empty_username',
        mensagem: MENSAGENS_DE_ERRO_DE_CADASTRO.empty_username,
      },
      loginParaOFormulario: loginSanitizado,
    };
  }

  if (!loginEnviadoEhValido(loginEnviado, contexto.removerAcentos)) {
    return {
      item: {
        codigo: 'invalid_username',
        mensagem: MENSAGENS_DE_ERRO_DE_CADASTRO.invalid_username,
      },
      // O legado apaga o login neste caso, e so neste.
      loginParaOFormulario: '',
    };
  }

  if (contexto.contas.obterPorLogin(loginSanitizado) !== null) {
    return {
      item: {
        codigo: 'username_exists',
        mensagem: MENSAGENS_DE_ERRO_DE_CADASTRO.username_exists,
      },
      loginParaOFormulario: loginSanitizado,
    };
  }

  // `U3` (CA-6.6): a lista nasce vazia e so um ponto de extensao a preenche.
  if (loginEstaProibido(loginSanitizado, loginsProibidosDe(contexto))) {
    return {
      item: {
        codigo: 'invalid_username',
        mensagem: MENSAGENS_DE_ERRO_DE_CADASTRO.invalid_username_nao_permitido,
      },
      loginParaOFormulario: loginSanitizado,
    };
  }

  return { item: null, loginParaOFormulario: loginSanitizado };
}

/** As conferencias do e-mail, na mesma forma de cadeia de `senao`. */
function conferirEmail(
  email: string,
  contexto: ContextoDeCadastro,
): { readonly item: ItemDeErroDeCadastro | null; readonly emailParaOFormulario: string } {
  if (email === '') {
    return {
      item: {
        codigo: 'empty_email',
        mensagem: MENSAGENS_DE_ERRO_DE_CADASTRO.empty_email,
      },
      emailParaOFormulario: email,
    };
  }

  if (!ehEmail(email)) {
    return {
      item: {
        codigo: 'invalid_email',
        mensagem: MENSAGENS_DE_ERRO_DE_CADASTRO.invalid_email,
      },
      // O legado apaga o e-mail neste caso, e so neste.
      emailParaOFormulario: '',
    };
  }

  if (contexto.contas.obterPorEmail(email) !== null) {
    return {
      item: {
        codigo: 'email_exists',
        mensagem: MENSAGENS_DE_ERRO_DE_CADASTRO.email_exists.replace(
          '%s',
          contexto.urlDeEntrada,
        ),
      },
      emailParaOFormulario: email,
    };
  }

  return { item: null, emailParaOFormulario: email };
}

/** A lista efetiva de logins proibidos: a de fabrica, passada pelo ponto de extensao. */
function loginsProibidosDe(contexto: ContextoDeCadastro): readonly string[] {
  const filtrar = contexto.ganchos?.filtrarLoginsProibidos;
  return filtrar === undefined
    ? LOGINS_PROIBIDOS_DE_FABRICA
    : filtrar(LOGINS_PROIBIDOS_DE_FABRICA);
}

/**
 * Cadastra o visitante.
 *
 * Nao lanca: as tres recusas voltam como **valor**, porque e assim que o legado as
 * devolve e porque os contratos de `plan.md` chamam esta familia de falha de *"estado
 * reportavel e nao excecao"*.
 */
export function cadastrar(
  dados: DadosDoCadastro,
  contexto: ContextoDeCadastro,
): ResultadoDoCadastro {
  // Guarda da tela: em rede, o cadastro percorre UC-41 e nao este caso de uso.
  if (cadastroDesviaParaRede(contexto)) {
    return {
      cadastrado: false,
      motivo: 'cadastro-em-rede',
      destinoDeRetorno: contexto.destinos.cadastroEmRede,
    };
  }

  // CA-6.1: desligado, a acao e recusada antes de o formulario ser processado.
  if (!cadastroEstaAberto(contexto)) {
    return {
      cadastrado: false,
      motivo: 'cadastro-desligado',
      destinoDeRetorno: contexto.destinos.cadastroDesligado,
    };
  }

  const limites = contexto.limites ?? LIMITES_DO_CADASTRO_DE_FABRICA;

  const loginSanitizado = sanitizarLoginDoCadastro(
    dados.login,
    contexto.removerAcentos,
  );
  // O filtro do e-mail roda ANTES de qualquer conferencia dele, e roda sempre —
  // inclusive com o campo vazio.
  const filtrarEmail = contexto.ganchos?.filtrarEmailDoCadastro;
  const email = filtrarEmail === undefined ? dados.email : filtrarEmail(dados.email);

  const login = conferirLogin(dados.login, loginSanitizado, contexto);
  const emailConferido = conferirEmail(email, contexto);

  const itens: ItemDeErroDeCadastro[] = [];
  if (login.item !== null) {
    itens.push(login.item);
  }
  if (emailConferido.item !== null) {
    itens.push(emailConferido.item);
  }

  const valoresParaOFormulario = {
    login: login.loginParaOFormulario,
    email: emailConferido.emailParaOFormulario,
  };

  let erro = erroDeCadastro(...itens);

  // `register_post`: acao, com os erros acumulados ate aqui. Nao altera nada.
  contexto.ganchos?.aoSubmeterCadastro?.(loginSanitizado, email, erro);

  // `registration_errors`: filtro, o ultimo portao. PODE alterar o resultado.
  const filtrarErros = contexto.ganchos?.filtrarErrosDoCadastro;
  if (filtrarErros !== undefined) {
    erro = filtrarErros(erro, loginSanitizado, email);
  }

  if (temAlgumErro(erro)) {
    return {
      cadastrado: false,
      motivo: 'dados-recusados',
      erro,
      valoresParaOFormulario,
    };
  }

  const aleatorio = contexto.aleatorio ?? ALEATORIEDADE_DO_RUNTIME;
  const agora = contexto.relogio.agoraEmSegundos();

  // Passo 4 de UC-21, e CA-6.4: a conta nasce com senha que o titular nao definiu.
  const criacao = criarConta(
    {
      login: loginSanitizado,
      email,
      senhaEmClaro: gerarSegredo(limites.comprimentoDaSenhaInicial, aleatorio),
    },
    {
      contas: contexto.contas,
      papeis: contexto.papeis,
      limites,
      papelPadrao: contexto.opcoes.papelPadrao,
      loginsProibidos: loginsProibidosDe(contexto),
      removerAcentos: contexto.removerAcentos,
      apelidoDeTexto: contexto.apelidoDeTexto,
      geradorDeHashDeSenha: contexto.geradorDeHashDeSenha,
      agoraEmSegundos: agora,
    },
  );

  if (!criacao.criada) {
    // 🔴 O legado joga fora o motivo e poe `registerfail` no lugar. Ver
    // `erroQueOVisitanteVe` em `erro-de-cadastro.ts`. `causa` e observabilidade
    // (P7) e nenhuma ramificacao a le.
    return {
      cadastrado: false,
      motivo: 'dados-recusados',
      erro: erroQueOVisitanteVe(contexto.opcoes.emailDoAdministrador),
      valoresParaOFormulario,
      causa: criacao.erro,
    };
  }

  // `register_new_user`: acao, depois de a conta existir e antes da notificacao.
  contexto.ganchos?.aoCriarContaNoCadastro?.(criacao.contaId);

  // Passo 5 de UC-21, e CA-6.5. A emissao da chave mora DENTRO da notificacao,
  // como no legado: quem substitui a notificacao tira a chave junto.
  const notificacao =
    contexto.notificacao ??
    criarNotificacaoDeContaNovaDoNucleo({
      email: contexto.email,
      contas: contexto.contas,
      resumoDaChave: contexto.resumoDaChave,
    });

  const aviso = notificacao.notificar({
    contaId: criacao.contaId,
    login: criacao.login,
    email,
    agoraEmSegundos: agora,
    tituloDoSite: contexto.opcoes.tituloDoSite,
    chaveEmClaro: gerarSegredo(limites.comprimentoDaChaveDeRedefinicao, aleatorio),
    urlDeEntrada: contexto.urlDeEntrada,
    montarUrlDaRede: contexto.montarUrlDaRede,
  });

  return {
    cadastrado: true,
    contaId: criacao.contaId,
    login: criacao.login,
    apelido: criacao.apelido,
    papel: criacao.papel,
    chaveEmitida: aviso.chaveEmitida,
    envios: aviso.envios,
    destinoDeRetorno: destinoDeRetorno(dados, contexto),
  };
}
