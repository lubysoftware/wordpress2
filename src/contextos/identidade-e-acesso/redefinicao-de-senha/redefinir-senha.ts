/**
 * Gravar a senha nova: os passos 4 a 7 de UC-20, e os critérios CA-4.2, CA-4.4 e
 * CA-4.5.
 *
 * | passo de UC-20 | aqui | critério |
 * |---|---|---|
 * | 4. abre o link e informa a senha nova | `redefinirSenha` | — |
 * | 5. confere a chave e o prazo de 24 horas | `conferirChaveDeRedefinicao` | CA-4.2, CA-4.5 |
 * | 6. grava a senha nova e invalida a chave | `gravarSenhaEApagarChave` | CA-4.4 |
 * | 7. devolve ao formulario de entrada | `MENSAGENS_DA_TELA_DE_REDEFINICAO` | — |
 *
 * **Autorizacao: nenhuma capacidade, e a declaracao e o ponto** — a mesma de
 * `pedido-de-redefinicao.ts`. A posse do e-mail e a autorizacao (UC-20), e esta
 * e uma das cinco portas que decidem acesso sem consultar o modelo de
 * capacidades (constituicao P4, BR-MIGRAR-098).
 *
 * **Tres coisas que este fluxo NAO faz, e cada uma e regra lida do pacote.**
 *
 * 1. **Nao encerra sessao nenhuma.** Pos-condicao de UC-20: *"as sessoes
 *    abertas antes da troca **nao** sao encerradas por este fluxo"*. E
 *    `ESC-SESSAO` / BR-MIGRAR-111 com a resposta 7 atras: REQ-008 pediria o
 *    contrario e esta **bloqueado**. O que um porte "bem escrito" conserta por
 *    acidente aqui e justamente o que o cenario `@divida-herdada` cobra. A
 *    garantia nao e uma linha de codigo: e a **ausencia** do registro de sessoes
 *    no contexto desta operacao, somada ao teste que afirma quais comandos saem.
 *    O que o legado faz e so o efeito colateral que o `plan.md` descreve — o
 *    *hash* novo muda o fragmento de 4 caracteres que entra na chave do HMAC do
 *    cookie, e o cookie antigo para de validar **sem** que nada tenha sido
 *    revogado, com o registro do token sobrevivendo e acumulando.
 * 2. **Nao conta tentativa e nao consome a chave antes de conferir.** A chave de
 *    modo de recuperacao e consumida antes de ser verificada (ADR-0007), e esta
 *    **nao** e: sao dois dos cinco atestados, com comportamentos diferentes, e
 *    `target_domain_model.md` registra as tres formas incompativeis de
 *    `VO-ChaveDeAtivacao` exatamente para que ninguem as unifique. Uma chave
 *    errada aqui **nao** queima a chave boa.
 * 3. **Nao endurece a senha.** Nenhuma exigencia de forca, comprimento minimo ou
 *    composicao: as duas unicas recusas sao as duas do legado (so espaco, e
 *    senhas diferentes), e `SCR-003` e explicito — *"nenhuma validacao desta
 *    secao pode ser endurecida no alvo sem decisao registrada"*. O campo
 *    `pw_weak` existe na tela justamente para **confirmar** uma senha fraca.
 */

import { prepararSenha } from '../autenticacao/normalizacao-de-credencial.js';
import {
  conferirChaveDeRedefinicao,
  type ConferenciaDaChave,
} from './chave-de-redefinicao.js';
import type { ContaNaRedefinicao } from './contas-para-redefinicao.js';
import type { ContextoDaRedefinicaoDeSenha } from './contexto-de-redefinicao.js';
import {
  erroDeRedefinicao,
  MENSAGEM_POR_CODIGO_DE_CHAVE,
  MENSAGENS_DA_TELA_DE_REDEFINICAO,
  type ErroDeRedefinicao,
  type ItemDeErroDeRedefinicao,
} from './erro-de-redefinicao.js';

/**
 * A entrada da gravacao, com os nomes de campo de `SCR-003`.
 *
 * `SCR-003` esta em modo **literal** e na familia C — *"o nome do campo e a API:
 * aplicacao externa ou tema de terceiro depende dele"* —, e o cenario
 * `@paridade-visual` cobra os cinco nomes um por um. A correspondencia fica
 * registrada aqui para que a borda HTTP nao a invente:
 *
 * | campo do formulario | aqui |
 * |---|---|
 * | `rp_key` | `chave` |
 * | `pass1` | `senhaNova` |
 * | `pass2` | `confirmacaoDaSenha` |
 * | `pw_weak` | — e da tela: nenhuma recusa do dominio depende dele |
 * | `wp-submit` | — |
 *
 * O `login` nao e campo do formulario: ele viaja no link do e-mail, ao lado da
 * chave, e a borda o guarda entre as duas requisicoes. **Qual** credencial de
 * navegador o legado usa para isso nao esta no pacote — nenhum documento nomeia
 * um unico cookie, lacuna que T005 ja registrou pelo lado da saida —, e por isso
 * ele chega aqui como argumento, nao como leitura de cookie.
 */
export interface EntradaDaRedefinicao {
  /** O login da conta, como o link do e-mail o carrega. */
  readonly login: string;
  /** Campo `rp_key`: a chave em claro. */
  readonly chave: string;
  /** Campo `pass1`. */
  readonly senhaNova: string;
  /**
   * Campo `pass2`.
   *
   * ⚠️ **Ausente conta como vazio**, e e o que o legado faz: com `pass1`
   * preenchido e `pass2` ausente, ele soma a recusa de senhas diferentes.
   * Tratar a ausencia como *"formulario sem confirmacao"* aceitaria um envio que
   * o legado recusa — e o cenario de familia C de `SCR-003` cobra o contrario:
   * *"o cliente externo envia o formulario contra as duas metades ... as duas
   * aceitam o envio e produzem o mesmo efeito observavel"*.
   */
  readonly confirmacaoDaSenha?: string;
}

export type ResultadoDaRedefinicao =
  | {
      readonly redefinida: true;
      readonly idDaConta: number;
      /**
       * A mensagem do passo 7, literal de `wp-login.php:1000` com o texto do
       * link ao lado. Vem no resultado porque e o **estado de sucesso** da tela
       * em modo literal, e quem a monta e a borda.
       */
      readonly mensagem: typeof MENSAGENS_DA_TELA_DE_REDEFINICAO.senhaRedefinida;
    }
  | {
      /**
       * A chave nao foi aceita. `DESTINO_POR_CODIGO_DE_CHAVE` diz para qual das
       * duas telas o legado manda cada codigo, e as mensagens que o titular le
       * estao em `MENSAGENS_DA_TELA_DE_PEDIDO`.
       */
      readonly redefinida: false;
      readonly motivo: 'chave-recusada';
      readonly codigo: 'invalid_key' | 'expired_key';
      readonly erro: ErroDeRedefinicao;
    }
  | {
      readonly redefinida: false;
      readonly motivo: 'senha-recusada';
      readonly erro: ErroDeRedefinicao;
    }
  | {
      /**
       * Chave boa e campo de senha vazio: o legado **nao** produz erro e **nao**
       * grava nada — ele reapresenta o formulario, que e o estado `idle` da
       * tela. Um porte que tratasse isso como erro acrescentaria uma recusa que
       * o legado nao tem.
       */
      readonly redefinida: false;
      readonly motivo: 'senha-nao-informada';
    };

/**
 * A recusa da chave, com o codigo e a mensagem que o titular efetivamente le.
 *
 * A mensagem vem da tela de **pedido**, para onde o legado redireciona. Ver
 * `MENSAGEM_POR_CODIGO_DE_CHAVE` e `DESTINO_POR_CODIGO_DE_CHAVE`.
 */
function recusaDaChave(
  codigo: 'invalid_key' | 'expired_key',
): ResultadoDaRedefinicao {
  return {
    redefinida: false,
    motivo: 'chave-recusada',
    codigo,
    erro: erroDeRedefinicao({
      codigo,
      mensagem: MENSAGEM_POR_CODIGO_DE_CHAVE[codigo],
    }),
  };
}

/** Confere a chave contra a conta daquele login (passo 5 de UC-20). */
export function conferirChaveDaConta(
  entrada: Pick<EntradaDaRedefinicao, 'login' | 'chave'>,
  contexto: ContextoDaRedefinicaoDeSenha,
): {
  readonly conta: ContaNaRedefinicao | null;
  readonly conferencia: ConferenciaDaChave;
} {
  // Login vazio e conta inexistente caem no mesmo codigo generico do legado, e
  // e o que CA-4.5 cobra: a recusa nao diz **qual** das duas coisas aconteceu.
  if (entrada.login === '') {
    return { conta: null, conferencia: { valida: false, codigo: 'invalid_key' } };
  }

  const conta = contexto.contas.porLogin(entrada.login);
  if (conta === null) {
    return { conta: null, conferencia: { valida: false, codigo: 'invalid_key' } };
  }

  const prazo = contexto.prazoDaChave;
  return {
    conta,
    conferencia: conferirChaveDeRedefinicao({
      chaveEmClaro: entrada.chave,
      valorGravado: conta.chaveDeAtivacao,
      agoraEmSegundos: contexto.relogio.agoraEmSegundos(),
      hash: contexto.hashDaChave,
      ...(prazo === undefined ? {} : { prazo }),
    }),
  };
}

/**
 * As duas recusas de senha do legado, na ordem do legado.
 *
 * A ordem e observavel: as duas somam no mesmo erro, e quem le o primeiro codigo
 * ve a recusa de espaco antes da de senhas diferentes.
 *
 * **A senha comparada e a sem espaco nas pontas, nas duas pontas**, e isso e
 * regra e nao conveniencia: o legado remove o espaco de `pass1`, compara `pass2`
 * **tambem sem espaco** contra ela, e e a versao sem espaco que acaba gravada.
 * Reusa `prepararSenha` de T003 por isso — e a mesma remocao que decide que
 * `" segredo "` autentica.
 */
export function recusasDaSenhaNova(
  entrada: EntradaDaRedefinicao,
): readonly ItemDeErroDeRedefinicao[] {
  const itens: ItemDeErroDeRedefinicao[] = [];

  if (entrada.senhaNova === '') {
    return itens;
  }

  const senha = prepararSenha(entrada.senhaNova);

  if (senha === '') {
    itens.push({
      codigo: 'password_reset_empty_space',
      mensagem: MENSAGENS_DA_TELA_DE_REDEFINICAO.password_reset_empty_space,
    });
  }

  if (prepararSenha(entrada.confirmacaoDaSenha ?? '') !== senha) {
    itens.push({
      codigo: 'password_reset_mismatch',
      mensagem: MENSAGENS_DA_TELA_DE_REDEFINICAO.password_reset_mismatch,
    });
  }

  return itens;
}

/**
 * Redefine a senha pela chave.
 *
 * Nao lanca: toda recusa volta como valor. A ordem dos passos e contrato (P2) e
 * esta afirmada por teste — conferir a chave vem **antes** de olhar a senha, e e
 * por isso que uma chave vencida nao revela nada sobre a senha enviada.
 */
export function redefinirSenha(
  entrada: EntradaDaRedefinicao,
  contexto: ContextoDaRedefinicaoDeSenha,
): ResultadoDaRedefinicao {
  const { conta, conferencia } = conferirChaveDaConta(entrada, contexto);

  if (!conferencia.valida) {
    return recusaDaChave(conferencia.codigo);
  }

  // `conferencia.valida` so e verdadeira com conta resolvida: os dois caminhos
  // sem conta devolvem recusa acima. O ramo existe para o tipo, nao para o
  // fluxo — e e por isso que ele devolve o **mesmo** codigo generico.
  if (conta === null) {
    return recusaDaChave('invalid_key');
  }

  const recusas = recusasDaSenhaNova(entrada);
  const comGancho =
    contexto.ganchos?.validarRedefinicao?.(recusas, conta) ?? recusas;

  if (comGancho.length > 0) {
    return {
      redefinida: false,
      motivo: 'senha-recusada',
      erro: erroDeRedefinicao(...comGancho),
    };
  }

  const senha = prepararSenha(entrada.senhaNova);
  if (entrada.senhaNova === '' || senha === '') {
    // Formulario reapresentado, sem erro e sem escrita. Ver o tipo do resultado.
    //
    // A segunda metade da condicao nao e redundante: ela e a **segunda guarda**
    // do legado, que exige senha nao vazia *depois* de os erros terem sido
    // filtrados. Sem ela, uma extensao que limpasse a recusa de "so espaco" no
    // ponto de validacao faria gravar uma senha vazia — e o legado, nesse mesmo
    // caminho, nao grava nada.
    return { redefinida: false, motivo: 'senha-nao-informada' };
  }

  contexto.ganchos?.antesDeRedefinir?.(conta, senha);

  // Passo 6: a senha nova e a chave apagada **no mesmo comando** (CA-4.4).
  contexto.contas.gravarSenhaEApagarChave(
    conta.id,
    contexto.hashDeSenha.gerar(senha),
  );

  contexto.ganchos?.aoGravarSenha?.(conta, senha);
  contexto.ganchos?.aposRedefinir?.(conta, senha);

  return {
    redefinida: true,
    idDaConta: conta.id,
    mensagem: MENSAGENS_DA_TELA_DE_REDEFINICAO.senhaRedefinida,
  };
}
