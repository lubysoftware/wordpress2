/**
 * Pedir a redefinicao: os passos 1 a 3 de UC-20, e os critérios CA-4.1 e CA-4.3.
 *
 * | passo de UC-20 | aqui |
 * |---|---|
 * | 1. informa o login **ou** o e-mail da conta | `solicitarRedefinicaoDeSenha` |
 * | 2. gera a chave e a guarda **com hash** na conta | `gerador` + `hashDaChave` + `gravarChaveDeAtivacao` |
 * | 3. envia ao e-mail da conta o link com a chave | `montagemDoEmail` + `PortaDeEmail` |
 *
 * **Autorizacao desta operacao, declarada como o P4 exige: nenhuma capacidade.**
 * UC-20 e literal no campo *Autorizacao*: *"uma chave de uso temporario enviada
 * ao e-mail da conta. A posse do e-mail e a autorizacao — nao ha capacidade
 * envolvida"*. O cenario de paridade de `SCR-002` repete pelo outro lado —
 * *"nenhuma checagem `current_user_can()` neste arquivo"* e *"nenhuma das duas
 * exige capacidade que o legado nao exige"*. A declaracao existe porque a
 * **ausencia** e a regra: esta e uma das cinco portas que a constituicao (P4)
 * manda nao esconder, porque *"uma matriz que ignore esses cinco descreve um
 * sistema mais fechado do que o real"*.
 *
 * **A ordem de busca e diferente da ordem da entrada, e isso e regra.** Na
 * entrada, a cadeia tenta login e e-mail em duas etapas de mesma prioridade
 * (CA-1.2). Aqui o identificador com arroba e procurado **primeiro como e-mail e
 * depois como login**, e o sem arroba e procurado **so como login**. Sao dois
 * fluxos distintos no legado, e unificar os dois mudaria qual conta um
 * identificador ambiguo alcanca.
 *
 * **O que esta operacao nao faz, e por que.**
 *
 * - **Nao conta pedido e nao limita taxa.** O P6 poe limite de taxa fora do
 *   nucleo (*"decisao de implantacao"*, REQ-160 em `do-not-rewrite.md`), e
 *   BR-MIGRAR-112 mede que *"nenhuma superficie de entrada tem limite de taxa"*.
 *   Um pedido novo a cada segundo substitui a chave a cada segundo, e isso e o
 *   produto.
 * - **Nao registra a falha de envio, e nao a transforma em aviso proprio.** Isso
 *   e US-5 / T011, que `tasks.md` poe como tarefa separada *dependente desta*, e
 *   e onde a regra `D3` entra — *"falha de envio de e-mail e estado, nao
 *   excecao (o fluxo de privacidade ja faz assim; **este fluxo nao faz**)"*. A
 *   excecao correspondente de UC-20 e igualmente explicita: *"o assinante nao tem
 *   como saber: nenhum estado registra a falha de envio neste fluxo"*. Aqui a
 *   tentativa volta como **valor** (`envio`), que e o que T011 precisa para
 *   construir o aviso e o registro sem alterar este arquivo.
 * - **Nao apaga a chave e nao encerra sessao.** Apagar no primeiro login
 *   bem-sucedido e CA-1.4 e ja esta em `../autenticacao/autenticar.ts`.
 */

import type { ResultadoDeEnvio } from '../portas/index.js';
import { valorGravadoDaChave } from './chave-de-redefinicao.js';
import type { ContaNaRedefinicao } from './contas-para-redefinicao.js';
import type { ContextoDoPedidoDeRedefinicao } from './contexto-de-redefinicao.js';
import {
  ehErroDeRedefinicao,
  erroDeRedefinicao,
  MENSAGENS_DO_PEDIDO,
  type ErroDeRedefinicao,
} from './erro-de-redefinicao.js';

/**
 * O pedido, com o nome de campo que a tela usa.
 *
 * `SCR-002` esta em modo **modernizado**, mas na familia C: o nome do campo e
 * contrato. A correspondencia fica registrada aqui para que quem montar a borda
 * HTTP nao a invente:
 *
 * | campo do formulario | aqui |
 * |---|---|
 * | `user_login` | `identificador` |
 * | `redirect_to` | — e da borda: esta operacao nao redireciona |
 */
export interface PedidoDeRedefinicao {
  /** Campo `user_login`: o login **ou** o e-mail da conta. */
  readonly identificador: string;
}

/**
 * O resultado do pedido.
 *
 * **O sucesso tem sempre a mesma forma**, que e o que a tabela *Contratos* de
 * `plan.md` cobra para esta operacao: *"confirmacao de envio, sempre com a mesma
 * forma"*. Ele nao carrega a conta, nem o destinatario, nem — sobretudo — a
 * chave em claro: CA-4.1 exige que o valor em claro *"so exista no e-mail
 * enviado"*, e a forma mais segura de garantir isso e o tipo de retorno nao ter
 * onde guarda-lo.
 *
 * A recusa, ao contrario, **distingue** os casos, e isso e divida herdada: ver
 * `ESC-ENUMERACAO` em `erro-de-redefinicao.ts`.
 */
export type ResultadoDoPedidoDeRedefinicao =
  | {
      readonly aceito: true;
      /**
       * O que o canal de envio respondeu. Falha e **valor** (D3, e a porta de
       * e-mail de T001 nao lanca), e e daqui que US-5 / T011 parte.
       */
      readonly envio: ResultadoDeEnvio;
    }
  | { readonly aceito: false; readonly erro: ErroDeRedefinicao };

/**
 * Procura a conta do identificador, na ordem do legado.
 *
 * ⚠️ **A arroba na primeira posicao nao conta**, e isso nao e descuido: a
 * verificacao do legado e uma busca de posicao usada como booleano, e posicao
 * zero e falsa. Logo `"@algo"` e tratado como **login**, nao como e-mail. E
 * exatamente o mesmo cuidado que `ehEmail` de T003 tomou ao procurar a arroba a
 * partir da segunda posicao — por um motivo diferente e com o mesmo efeito.
 *
 * Exportada porque e o passo 1 de UC-20 e porque o codigo de erro que ela
 * escolhe (`invalid_email` contra `invalidcombo`) e observavel.
 */
export function procurarContaDoPedido(
  identificador: string,
  contexto: ContextoDoPedidoDeRedefinicao,
): ContaNaRedefinicao | ErroDeRedefinicao {
  const temArroba = identificador.indexOf('@', 1) !== -1;

  if (temArroba) {
    const porEmail = contexto.contas.porEmail(identificador);
    if (porEmail !== null) {
      return porEmail;
    }
    // O legado tenta o login tambem, e e por isso que um login que contem
    // arroba continua funcionando no formulario de senha perdida.
    const porLogin = contexto.contas.porLogin(identificador);
    if (porLogin !== null) {
      return porLogin;
    }
    return erroDeRedefinicao({
      codigo: 'invalid_email',
      mensagem: MENSAGENS_DO_PEDIDO.invalid_email,
    });
  }

  const porLogin = contexto.contas.porLogin(identificador);
  if (porLogin !== null) {
    return porLogin;
  }
  // Mesma mensagem, codigo diferente — ver `erro-de-redefinicao.ts`.
  return erroDeRedefinicao({
    codigo: 'invalidcombo',
    mensagem: MENSAGENS_DO_PEDIDO.invalidcombo,
  });
}

/**
 * Gera a chave, grava o resumo dela na conta e devolve a chave **em claro** a
 * quem vai monta-la no e-mail (passo 2 de UC-20, CA-4.1 e CA-4.3).
 *
 * A ordem e a do legado e e observavel por quem registra extensao: o ponto de
 * extensao recebe a chave **antes** de ela ser gravada.
 *
 * Exportada porque e um passo nomeado de UC-20, e **nao** porque algum fluxo do
 * produto a chame sozinha: quem a chamar assume o cuidado de CA-4.1 com o valor
 * devolvido.
 */
export function gerarEGravarChaveDeRedefinicao(
  conta: ContaNaRedefinicao,
  contexto: ContextoDoPedidoDeRedefinicao,
  agoraEmSegundos: number,
): string {
  const chaveEmClaro = contexto.gerador.gerar();

  contexto.ganchos?.aoGerarChave?.(conta.login, chaveEmClaro);

  // Gravar **substitui**: a chave anterior deixa de valer sem que nada precise
  // revoga-la (CA-4.3, e o fluxo alternativo "Pedido repetido antes do prazo").
  contexto.contas.gravarChaveDeAtivacao(
    conta.id,
    valorGravadoDaChave(
      agoraEmSegundos,
      contexto.hashDaChave.gerar(chaveEmClaro),
    ),
  );

  return chaveEmClaro;
}

/**
 * Pede a redefinicao de senha.
 *
 * Nao lanca: toda recusa volta como **valor**, porque e assim que o legado a
 * devolve e porque os contratos de `plan.md` chamam a falha desta operacao de
 * *"estado reportavel e nao excecao"*.
 */
export function solicitarRedefinicaoDeSenha(
  pedido: PedidoDeRedefinicao,
  contexto: ContextoDoPedidoDeRedefinicao,
): ResultadoDoPedidoDeRedefinicao {
  // O legado remove o espaco das pontas do identificador antes de qualquer
  // coisa, e **nao** o sanitiza como a entrada sanitiza o login: sao dois
  // preambulos diferentes, e trocar um pelo outro mudaria qual conta um
  // identificador com marcacao alcanca.
  const identificador = pedido.identificador.trim();

  if (identificador === '') {
    return {
      aceito: false,
      erro: erroDeRedefinicao({
        codigo: 'empty_username',
        mensagem: MENSAGENS_DO_PEDIDO.empty_username,
      }),
    };
  }

  const encontrada = procurarContaDoPedido(identificador, contexto);
  if (ehErroDeRedefinicao(encontrada)) {
    return { aceito: false, erro: encontrada };
  }
  const conta = encontrada;

  contexto.ganchos?.aoPedirRedefinicao?.(conta.login);

  // O default de fabrica e permitir. Ver a nota de `permitirRedefinicao`.
  const permitido = contexto.ganchos?.permitirRedefinicao?.(conta) ?? true;
  if (!permitido) {
    return {
      aceito: false,
      erro: erroDeRedefinicao({
        codigo: 'no_password_reset',
        mensagem: MENSAGENS_DO_PEDIDO.no_password_reset,
      }),
    };
  }

  const agora = contexto.relogio.agoraEmSegundos();
  const chaveEmClaro = gerarEGravarChaveDeRedefinicao(conta, contexto, agora);

  const mensagem = contexto.montagemDoEmail.montar({ conta, chaveEmClaro });
  const envio = contexto.email.enviar(mensagem);

  return { aceito: true, envio };
}
