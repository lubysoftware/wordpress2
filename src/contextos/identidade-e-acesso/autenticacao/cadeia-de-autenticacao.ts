/**
 * A cadeia de autenticacao: o ponto de extensao em que o legado decide quem
 * entra.
 *
 * **E ponto de extensao antes de ser codigo.** UC-19 poe a observacao em
 * 🟡 no que um porte precisa saber: *"a cadeia de autenticacao e inteiramente
 * filtravel. Qualquer plugin pode substituir o critério de quem entra. Toda
 * garantia deste caso vale para a arvore sem plugins"*. E a sequencia de UC-19
 * repete no passo 2: *"a cadeia e filtravel: um plugin pode trocar o critério
 * inteiro"*. Logo o formato da cadeia e produto (P2), e tres propriedades dela
 * que AD-03 declara nao afrouxar entram aqui:
 *
 * 1. **devolve valor** — cada etapa recebe o que a anterior devolveu e o
 *    chamador usa o retorno na mesma pilha;
 * 2. **ordem por prioridade inteira** — e, dentro da mesma prioridade, a ordem
 *    de registro;
 * 3. **sincrona e reentrante** — AD-04 poe a fronteira de `await` em
 *    `adaptadores/`.
 *
 * **Nao ha curto-circuito nesta cadeia, e isso e diferente da cascata de
 * moderacao.** Toda etapa roda; o que cada etapa faz e **desistir** quando o
 * valor que chegou ja e uma conta. Parecem a mesma coisa e nao sao: uma extensao
 * registrada depois do fim pode inspecionar o resultado, e uma cadeia com
 * curto-circuito nao a chamaria. A verificacao de conta marcada como spam
 * depende exatamente disso — ela roda **depois** de a conta ter sido resolvida.
 *
 * ⚠️ **As prioridades vem do legado e nao estao registradas neste pacote.** O
 * inventario de pontos de extensao que o P2 exige — *"com nome, argumentos e
 * ordem"* — ainda nao existe nesta arvore. Elas ficam nomeadas abaixo, uma
 * constante cada, para serem conferidas contra o oraculo (`ESC-ORACULO`) e para
 * que a ordem seja afirmavel por teste em vez de implicita na ordem do arranjo.
 */

import type { Conta } from '../conta/leitura-de-conta.js';
import type { ContextoDeAutenticacao } from './contexto-de-autenticacao.js';
import {
  ehErroDeAutenticacao,
  erroDeAutenticacao,
  MENSAGENS_DE_ERRO_DE_AUTENTICACAO,
  type ErroDeAutenticacao,
  type ItemDeErroDeAutenticacao,
} from './erro-de-autenticacao.js';
import { ehEmail } from './normalizacao-de-credencial.js';

/** O valor que atravessa a cadeia: nada ainda, uma conta, ou um erro. */
export type ValorDaCadeia = Conta | ErroDeAutenticacao | null;

/**
 * Uma etapa da cadeia.
 *
 * A assinatura e a do ponto de extensao do legado: o valor corrente, o
 * identificador e a senha. O contexto vem junto porque, no legado, estas funcoes
 * leem estado global de requisicao — e BR-MIGRAR-105 proibe guardar esse estado
 * em modulo.
 */
export type EtapaDaCadeia = (
  valor: ValorDaCadeia,
  identificador: string,
  senha: string,
  contexto: ContextoDeAutenticacao,
) => ValorDaCadeia;

/** Uma etapa registrada, com a prioridade e o nome que ela tem no legado. */
export interface EtapaRegistrada {
  readonly nome: string;
  readonly prioridade: number;
  readonly etapa: EtapaDaCadeia;
}

/** Reconhece uma conta no meio do valor que atravessa a cadeia. */
function ehConta(valor: ValorDaCadeia): valor is Conta {
  return valor !== null && !ehErroDeAutenticacao(valor);
}

export const PRIORIDADE_POR_LOGIN_E_SENHA = 20;
export const PRIORIDADE_POR_EMAIL_E_SENHA = 20;
export const PRIORIDADE_DA_VERIFICACAO_DE_SPAM = 99;

/**
 * Autentica pelo login. E a primeira etapa de prioridade 20.
 *
 * O caminho de campo vazio tem uma particularidade que um porte perde: quando o
 * valor que chegou **ja e um erro**, a etapa devolve esse erro em vez de somar
 * os seus. E por isso que, com os dois campos vazios, o erro final tem dois
 * codigos somados por **esta** etapa, e a etapa de e-mail nao os duplica.
 */
export function autenticarPorLoginESenha(
  valor: ValorDaCadeia,
  identificador: string,
  senha: string,
  contexto: ContextoDeAutenticacao,
): ValorDaCadeia {
  if (ehConta(valor)) {
    return valor;
  }

  if (identificador === '' || senha === '') {
    if (ehErroDeAutenticacao(valor)) {
      return valor;
    }

    const itens: ItemDeErroDeAutenticacao[] = [];
    if (identificador === '') {
      itens.push({
        codigo: 'empty_username',
        mensagem: MENSAGENS_DE_ERRO_DE_AUTENTICACAO.empty_username,
      });
    }
    if (senha === '') {
      itens.push({
        codigo: 'empty_password',
        mensagem: MENSAGENS_DE_ERRO_DE_AUTENTICACAO.empty_password,
      });
    }
    return erroDeAutenticacao(...itens);
  }

  const conta = contexto.contas.porLogin(identificador);

  if (conta === null) {
    // ESC-ENUMERACAO: a mensagem NOMEIA o login tentado e diz que ele nao esta
    // registrado. E o que permite enumerar conta, e e o que a resposta 6 manda
    // preservar. Ver `erro-de-autenticacao.ts`.
    return erroDeAutenticacao({
      codigo: 'invalid_username',
      mensagem: MENSAGENS_DE_ERRO_DE_AUTENTICACAO.invalid_username.replace(
        '%s',
        identificador,
      ),
    });
  }

  if (!contexto.verificadorDeSenha.verificar(senha, conta.senhaHash)) {
    // ESC-ENUMERACAO de novo, e pelo outro lado: aqui a mensagem diz que a
    // SENHA esta errada, o que confirma que a conta existe.
    return erroDeAutenticacao({
      codigo: 'incorrect_password',
      mensagem:
        MENSAGENS_DE_ERRO_DE_AUTENTICACAO.incorrect_password.replace(
          '%s',
          `<strong>${identificador}</strong>`,
        ) + linkDeSenhaPerdida(contexto),
    });
  }

  return conta;
}

/**
 * Autentica pelo e-mail. E a segunda etapa de prioridade 20, e e ela que faz
 * CA-1.2 valer: *"os dois caminhos chegam ao mesmo registro"*.
 *
 * O desvio que importa: quando o identificador **nao** e um e-mail, esta etapa
 * devolve o valor que chegou **sem tocar nele**. Sem isso, o erro de login
 * inexistente seria sobrescrito pelo erro de e-mail, e as duas mensagens que
 * `ESC-ENUMERACAO` manda distinguir trocariam de lugar.
 */
export function autenticarPorEmailESenha(
  valor: ValorDaCadeia,
  identificador: string,
  senha: string,
  contexto: ContextoDeAutenticacao,
): ValorDaCadeia {
  if (ehConta(valor)) {
    return valor;
  }

  if (identificador === '' || senha === '') {
    if (ehErroDeAutenticacao(valor)) {
      return valor;
    }

    const itens: ItemDeErroDeAutenticacao[] = [];
    if (identificador === '') {
      // O legado reusa `empty_username` aqui, por retrocompatibilidade com a
      // operacao de entrada, e troca so o texto.
      itens.push({
        codigo: 'empty_username',
        mensagem: MENSAGENS_DE_ERRO_DE_AUTENTICACAO.empty_username_email,
      });
    }
    if (senha === '') {
      itens.push({
        codigo: 'empty_password',
        mensagem: MENSAGENS_DE_ERRO_DE_AUTENTICACAO.empty_password,
      });
    }
    return erroDeAutenticacao(...itens);
  }

  if (!ehEmail(identificador)) {
    return valor;
  }

  const conta = contexto.contas.porEmail(identificador);

  if (conta === null) {
    return erroDeAutenticacao({
      codigo: 'invalid_email',
      mensagem: MENSAGENS_DE_ERRO_DE_AUTENTICACAO.invalid_email,
    });
  }

  if (!contexto.verificadorDeSenha.verificar(senha, conta.senhaHash)) {
    return erroDeAutenticacao({
      codigo: 'incorrect_password',
      mensagem:
        MENSAGENS_DE_ERRO_DE_AUTENTICACAO.incorrect_password_email.replace(
          '%s',
          `<strong>${identificador}</strong>`,
        ) + linkDeSenhaPerdida(contexto),
    });
  }

  return conta;
}

/**
 * Recusa a conta marcada como spam na rede. Prioridade 99: roda **depois** de a
 * conta ter sido resolvida, e por isso a cadeia nao pode ter curto-circuito.
 *
 * E a pre-condicao de UC-19 — *"a conta existe e nao esta marcada como spam na
 * rede"* — e so vale em rede: a coluna `spam` de `users` existe **somente na
 * variante multisite** (`target_data_model.md`). Fora da rede, a etapa nao
 * decide nada.
 */
export function verificarContaMarcadaComoSpam(
  valor: ValorDaCadeia,
  _identificador: string,
  _senha: string,
  contexto: ContextoDeAutenticacao,
): ValorDaCadeia {
  if (!ehConta(valor) || !contexto.rede.ativa) {
    return valor;
  }

  if (valor.marcadaComoSpam !== true) {
    return valor;
  }

  return erroDeAutenticacao({
    codigo: 'spammer_account',
    mensagem: MENSAGENS_DE_ERRO_DE_AUTENTICACAO.spammer_account,
  });
}

function linkDeSenhaPerdida(contexto: ContextoDeAutenticacao): string {
  return ` <a href="${contexto.urlDeSenhaPerdida}">${MENSAGENS_DE_ERRO_DE_AUTENTICACAO.senha_perdida}</a>`;
}

/**
 * A cadeia de fabrica, na ordem em que o legado a registra.
 *
 * ⚠️ A etapa de credencial de aplicacao, que no legado tambem tem prioridade 20
 * e entra entre as duas de senha, **nao** esta aqui: autenticar chamada nao
 * interativa e REQ-012, que ficou em `refinamento` e esta em
 * `do-not-rewrite.md`. A ausencia e escopo recusado, nao lacuna — e a posicao
 * dela na ordem fica registrada nesta nota para quando REQ-012 voltar.
 */
export const CADEIA_DE_AUTENTICACAO_DE_FABRICA: readonly EtapaRegistrada[] = [
  {
    nome: 'autenticar-por-login-e-senha',
    prioridade: PRIORIDADE_POR_LOGIN_E_SENHA,
    etapa: autenticarPorLoginESenha,
  },
  {
    nome: 'autenticar-por-email-e-senha',
    prioridade: PRIORIDADE_POR_EMAIL_E_SENHA,
    etapa: autenticarPorEmailESenha,
  },
  {
    nome: 'verificar-conta-marcada-como-spam',
    prioridade: PRIORIDADE_DA_VERIFICACAO_DE_SPAM,
    etapa: verificarContaMarcadaComoSpam,
  },
];

/**
 * Ordena a cadeia por prioridade inteira, **estavel** dentro da mesma
 * prioridade.
 *
 * A estabilidade e a regra: duas etapas de prioridade 20 rodam na ordem em que
 * foram registradas, e e dessa ordem que depende qual mensagem de erro o
 * visitante ve quando o identificador e um e-mail que nao existe.
 */
export function ordenarCadeia(
  etapas: readonly EtapaRegistrada[],
): readonly EtapaRegistrada[] {
  return etapas
    .map((etapa, indice) => ({ etapa, indice }))
    .sort(
      (a, b) =>
        a.etapa.prioridade - b.etapa.prioridade || a.indice - b.indice,
    )
    .map(({ etapa }) => etapa);
}

/**
 * Percorre a cadeia e devolve a conta ou o erro, como o legado.
 *
 * O ultimo passo e o unico que a cadeia nao faz: quando ela termina sem conta e
 * sem erro — porque alguma extensao devolveu nada —, o legado troca isso pelo
 * **erro generico**, que e o unico codigo que nao distingue nada. Sem este
 * passo, uma cadeia substituida por extensao deixaria passar `null` como se
 * fosse sucesso.
 */
export function percorrerCadeiaDeAutenticacao(
  identificador: string,
  senha: string,
  contexto: ContextoDeAutenticacao,
  etapas: readonly EtapaRegistrada[] = CADEIA_DE_AUTENTICACAO_DE_FABRICA,
): Conta | ErroDeAutenticacao {
  let valor: ValorDaCadeia = null;

  for (const registrada of ordenarCadeia(etapas)) {
    valor = registrada.etapa(valor, identificador, senha, contexto);
  }

  if (valor === null) {
    return erroDeAutenticacao({
      codigo: 'authentication_failed',
      mensagem: MENSAGENS_DE_ERRO_DE_AUTENTICACAO.authentication_failed,
    });
  }

  return valor;
}
