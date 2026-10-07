/**
 * A operacao de entrada: US-1, e os cinco critérios CA-1.1 a CA-1.5.
 *
 * O fluxo e o de UC-19, passo por passo e **na ordem dele**, porque a ordem e o
 * que o cenario de paridade compara: *"as duas metades apagam a chave no mesmo
 * passo"* (`parity_tests/06-autenticacao-e-sessao.feature`).
 *
 * | passo de UC-19 | aqui | critério |
 * |---|---|---|
 * | verificacao de rede, antes do formulario | `verificarSiteDaRede` | CA-1.5 |
 * | 1. envia login e senha | `autenticar` | — |
 * | 2. percorre a cadeia e confere a senha contra o hash | `percorrerCadeiaDeAutenticacao` | CA-1.2, CA-1.3 |
 * | 3. cria um token de sessao | `abrirSessao` | CA-1.1 |
 * | 4. apaga a chave de redefinicao pendente | `apagarChaveDeAtivacao` | CA-1.4 |
 * | 5. redireciona para o destino pedido ou para o painel | `destinoDeRetorno` | CA-1.1 |
 *
 * **Autorizacao desta operacao, declarada como o P4 exige.** UC-19 e literal:
 * *"nenhuma capacidade e exigida para entrar: o papel decide o que a pessoa faz
 * depois, nao se ela entra"*, e o cenario de paridade da tela de login repete —
 * *"nenhuma checagem de capacidade neste arquivo"*. A declaracao esta aqui
 * justamente porque a ausencia e a regra: *"nenhuma das duas exige capacidade que
 * o legado nao exige"*.
 *
 * **O que esta operacao nao faz, e por que.** Nao grava cookie, nao monta nonce
 * e nao embute o fragmento de 4 caracteres do hash da senha na chave do HMAC: o
 * cookie e a validacao da sessao sao US-3 / T007, e limpar a credencial do
 * navegador e US-2 / T005. E **nao conta tentativa e nao bloqueia conta**:
 * UC-19 registra que *"nao ha defesa contra forca bruta no nucleo"*, REQ-005
 * esta em `do-not-rewrite.md` e o P6 poe limite de taxa fora do nucleo.
 */

import {
  abrirSessao,
  type SessaoAberta,
} from '../sessao/registro-de-sessoes.js';
import type { Conta } from '../conta/leitura-de-conta.js';
import {
  CADEIA_DE_AUTENTICACAO_DE_FABRICA,
  percorrerCadeiaDeAutenticacao,
  type EtapaRegistrada,
} from './cadeia-de-autenticacao.js';
import type { ContextoDeAutenticacao } from './contexto-de-autenticacao.js';
import {
  CODIGOS_QUE_NAO_ANUNCIAM_FALHA,
  ehErroDeAutenticacao,
  primeiroCodigoDeErro,
  type ErroDeAutenticacao,
} from './erro-de-autenticacao.js';
import {
  prepararSenha,
  sanitizarLogin,
} from './normalizacao-de-credencial.js';
import { expiracaoDoToken } from './prazos-de-sessao.js';

/**
 * As credenciais da entrada.
 *
 * Os nomes de campo do formulario sao contrato **externo** nesta tela —
 * `target_screens.md` poe a tela de login na familia C: *"o nome do campo e a
 * API: aplicacao externa ou tema de terceiro depende dele"*, e por isso a tela
 * esta em modo literal. A correspondencia fica registrada aqui para que quem
 * montar a borda HTTP nao a invente:
 *
 * | campo do formulario | aqui |
 * |---|---|
 * | `log` | `login` |
 * | `pwd` | `senha` |
 * | `rememberme` | `lembrar` |
 * | `redirect_to` | `destinoPedido` |
 */
export interface CredenciaisDeEntrada {
  /** Campo `log`: o login **ou** o e-mail (CA-1.2). */
  readonly login: string;
  /** Campo `pwd`. */
  readonly senha: string;
  /** Campo `rememberme`. */
  readonly lembrar?: boolean;
  /** Campo `redirect_to`. Vazio ou ausente cai no painel (CA-1.1). */
  readonly destinoPedido?: string;
}

/**
 * A recusa da verificacao de rede.
 *
 * `codigo` e 410 porque UC-43 fixa que *"arquivado e spam produzem a MESMA
 * resposta: HTTP 410"*, e porque esta recusa **nao e** um erro de credencial: no
 * legado ela encerra a requisicao antes de o formulario ser processado, e nao
 * volta como erro no formulario.
 */
export interface RecusaDaRede {
  readonly eixo: 'site-arquivado' | 'site-marcado-como-spam';
  readonly codigoHttp: 410;
}

export type ResultadoDeAutenticacao =
  | {
      readonly autenticado: true;
      readonly conta: Conta;
      readonly sessao: SessaoAberta;
      readonly destinoDeRetorno: string;
    }
  | {
      readonly autenticado: false;
      readonly motivo: 'credencial-invalida';
      readonly erro: ErroDeAutenticacao;
    }
  | {
      readonly autenticado: false;
      readonly motivo: 'site-suspenso-na-rede';
      readonly recusa: RecusaDaRede;
    };

/**
 * A verificacao de rede, que recusa **antes de o formulario ser processado**
 * (CA-1.5, e a excecao de UC-19 *"Site da rede marcado como spam: a verificacao
 * de rede recusa antes do formulario"*).
 *
 * Esta separada de `autenticar` de proposito: no legado ela nao e uma etapa da
 * cadeia, e sim uma guarda que roda no arranque da requisicao, e quem a chama e
 * a borda. Tendo-a como funcao propria, a borda pode chama-la antes de ler o
 * corpo da requisicao — que e o que "antes de o formulario ser processado"
 * significa. `autenticar` tambem a consulta, para que nenhum caminho entre sem
 * passar por ela.
 *
 * A ordem de teste e **arquivado antes de spam**: UC-43 registra que os dois
 * eixos dao a mesma resposta e que *"a ordem de teste decide qual mensagem
 * aparece, nao qual estado vale"* — logo a ordem e observavel e fica fixada.
 *
 * ⚠️ O eixo `deleted` do site **nao** esta aqui. Preservar o estado "criado e
 * ainda nao ativado" e REQ-134 e a supervisao por eixos e REQ-133: os dois estao
 * em `do-not-rewrite.md`, e este pacote nao registra qual resposta o legado da
 * nesse caso. Inventa-la seria inventar comportamento.
 */
export function verificarSiteDaRede(
  contexto: ContextoDeAutenticacao,
): RecusaDaRede | null {
  if (!contexto.rede.ativa) {
    return null;
  }

  if (contexto.rede.siteArquivado) {
    return { eixo: 'site-arquivado', codigoHttp: 410 };
  }

  if (contexto.rede.siteMarcadoComoSpam) {
    return { eixo: 'site-marcado-como-spam', codigoHttp: 410 };
  }

  return null;
}

/**
 * Calcula o destino de retorno (CA-1.1): o pedido, ou o painel.
 *
 * ⚠️ **Lacuna declarada, nao divergencia escolhida.** Quando o destino pedido e
 * vazio ou e o proprio painel, o legado ainda **refina** o destino por
 * capacidade — manda para o painel da conta, para o perfil ou para a home,
 * conforme a conta poder ler e poder editar conteudo. Esse refinamento pergunta
 * capacidade, e a decisao de capacidade e US-7 / T015 (que ainda nao existe) mais
 * a administracao de contas de US-11 / T023. Por isso ele entra por
 * `refinarDestino`, que chega por argumento: enquanto ninguem o passa, o destino
 * e o pedido-ou-painel que CA-1.1 cobra, e a parte que falta esta nomeada em vez
 * de perdida. Ver a nota de entrega de T003.
 */
export function destinoDeRetorno(
  credenciais: CredenciaisDeEntrada,
  contexto: ContextoDeAutenticacao,
  conta: Conta,
  refinarDestino?: (destino: string, conta: Conta) => string,
): string {
  const pedido = credenciais.destinoPedido ?? '';
  const destino = pedido === '' ? contexto.urlDoPainel : pedido;

  if (destino === contexto.urlDoPainel && refinarDestino !== undefined) {
    return refinarDestino(destino, conta);
  }

  return destino;
}

/** O que `autenticar` aceita trocar sem alterar arquivo deste modulo. */
export interface OpcoesDeAutenticacao {
  /** A cadeia. Omitida, vale a de fabrica. */
  readonly cadeia?: readonly EtapaRegistrada[];
  /** O refinamento do destino por capacidade. Ver `destinoDeRetorno`. */
  readonly refinarDestino?: (destino: string, conta: Conta) => string;
}

/**
 * Autentica a conta e abre a sessao.
 *
 * Nao lanca: credencial invalida e site suspenso voltam como **valor**, porque e
 * assim que o legado os devolve e porque os contratos de `plan.md` chamam a falha
 * de *"estado reportavel e nao excecao"*.
 */
export function autenticar(
  credenciais: CredenciaisDeEntrada,
  contexto: ContextoDeAutenticacao,
  opcoes: OpcoesDeAutenticacao = {},
): ResultadoDeAutenticacao {
  // CA-1.5: antes de qualquer processamento do formulario.
  const recusa = verificarSiteDaRede(contexto);
  if (recusa !== null) {
    return { autenticado: false, motivo: 'site-suspenso-na-rede', recusa };
  }

  // O preambulo da entrada. A ordem e a do legado: o identificador e
  // sanitizado, a senha perde o espaco das pontas, e so depois a cadeia roda.
  const identificador = sanitizarLogin(
    credenciais.login,
    contexto.removerAcentos,
  );
  const senha = prepararSenha(credenciais.senha);

  const resultado = percorrerCadeiaDeAutenticacao(
    identificador,
    senha,
    contexto,
    opcoes.cadeia ?? CADEIA_DE_AUTENTICACAO_DE_FABRICA,
  );

  if (ehErroDeAutenticacao(resultado)) {
    const codigo = primeiroCodigoDeErro(resultado);
    // O ponto de extensao de falha de entrada NAO dispara para campo vazio.
    if (codigo !== null && !CODIGOS_QUE_NAO_ANUNCIAM_FALHA.includes(codigo)) {
      contexto.ganchos?.aoFalharEntrada?.(identificador, resultado);
    }
    return { autenticado: false, motivo: 'credencial-invalida', erro: resultado };
  }

  const conta = resultado;
  const agora = contexto.relogio.agoraEmSegundos();

  // Passo 3 de UC-19: cria o token de sessao.
  const sessao = abrirSessao(
    contexto.sessoes,
    conta.id,
    expiracaoDoToken(
      agora,
      credenciais.lembrar === true,
      contexto.prazosDoToken,
    ),
    agora,
    contexto.origem ?? {},
  );

  // Passo 4 de UC-19, e CA-1.4: a chave de redefinicao pendente deixa de valer.
  // BR-MIGRAR-024 (`U4`): *"a chave de reset vale 24 horas e e apagada no
  // primeiro login bem-sucedido"*. So escreve quando havia uma — o legado nao
  // grava sem necessidade, e o criterio de paridade desta area e efeito no banco.
  if (conta.chaveDeAtivacao !== '') {
    contexto.contas.apagarChaveDeAtivacao(conta.id);
  }

  contexto.ganchos?.aoEntrar?.(conta.login, conta);

  return {
    autenticado: true,
    // A conta devolvida ja nao tem chave pendente: quem leu o registro antes do
    // passo 4 nao pode continuar vendo a chave como valida.
    conta: conta.chaveDeAtivacao === '' ? conta : { ...conta, chaveDeAtivacao: '' },
    sessao,
    destinoDeRetorno: destinoDeRetorno(
      credenciais,
      contexto,
      conta,
      opcoes.refinarDestino,
    ),
  };
}
