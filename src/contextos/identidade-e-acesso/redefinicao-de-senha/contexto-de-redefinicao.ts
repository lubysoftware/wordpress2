/**
 * O contexto dos dois fluxos de US-4: tudo que eles precisam e que **nao e**
 * porta deste modulo.
 *
 * Mesma forma e mesmo motivo de `../autenticacao/contexto-de-autenticacao.ts`:
 * contexto por **argumento**, nunca estado de modulo. AD-02 e BR-MIGRAR-105
 * (`EXT-CONTEXTO`) poem identidade e conexao no escopo da requisicao, e a area 5
 * do critério de paridade — *"estado entre requisicoes concorrentes"* — tem
 * tolerancia **zero**. Um contexto que chega por argumento nao tem como vazar
 * entre requisicoes.
 *
 * E as colaboracoes chegam aqui, e nao como porta nova, por AD-08 (portas
 * somente nas 5 bordas) e AD-10 (*"toda chamada BC→BC e resolvida no momento da
 * chamada"*).
 */

import type { PortaDeEmail, PortaDeRelogio } from '../portas/index.js';
import type {
  GeradorDeChaveDeRedefinicao,
  HashDeChaveDeRedefinicao,
} from './chave-de-redefinicao.js';
import type { ContaNaRedefinicao, ContasParaRedefinicao } from './contas-para-redefinicao.js';
import type { GeracaoDeHashDeSenha } from './geracao-de-hash-de-senha.js';
import type { ItemDeErroDeRedefinicao } from './erro-de-redefinicao.js';
import type { MensagemDeEmail } from '../portas/porta-de-email.js';

/**
 * Quem monta o e-mail que leva a chave em claro.
 *
 * **Chega por argumento porque os literais nao estao no pacote.** O e-mail nao e
 * uma das 113 telas, logo nao tem tabela de mensagens em `target_screens.md`, e
 * nenhum outro documento registra o assunto, o corpo ou a forma do link. Escrever
 * esses textos aqui poria no dominio literais que **nada neste pacote pode
 * conferir**, e `parity_specs.md` exige para toda *string* *"diff de string
 * zero"* contra o oraculo. No legado a montagem e filtravel em tres pontos
 * distintos — assunto, corpo e o envelope inteiro —, logo uma montagem
 * substituivel e tambem a forma que o legado tem.
 *
 * O que **e** do dominio e esta garantido pelo fluxo, nao por esta interface:
 * a chave em claro nao e devolvida a quem pediu e nao e gravada em lugar algum
 * (CA-4.1).
 *
 * ⚠️ **O destinatario nao e imposto aqui, de proposito.** CA-4.1 diz que o valor
 * em claro *"so existe no e-mail enviado"* e UC-20 que o link vai *"ao e-mail da
 * conta"* — e no legado o envelope inteiro, destinatario incluido, passa por um
 * ponto de extensao antes do envio. Forcar o destinatario no dominio fecharia um
 * ponto que o legado deixa aberto, que e o erro que o P1 e o P4 nomeiam.
 */
export interface MontagemDoEmailDeRedefinicao {
  montar(dados: {
    readonly conta: ContaNaRedefinicao;
    readonly chaveEmClaro: string;
  }): MensagemDeEmail;
}

/**
 * Os pontos de extensao do **pedido**, na ordem em que o fluxo os atravessa.
 *
 * Estao nomeados e opcionais porque o P2 poe cada um no contrato publico — *"o
 * nome, os argumentos, a ordem de disparo e a capacidade de alterar o
 * resultado"* — e porque o barramento que os dispara nao existe nesta arvore.
 * Um ponto sem interceptador registrado e, no legado, um no-op: a ausencia
 * reproduz o legado em vez de enfraquece-lo.
 *
 * ⚠️ **O inventario que o P2 exige nao esta no pacote.** Nome, argumento e
 * posicao de cada um fecham contra o oraculo — a mesma lacuna que
 * `GanchosDaEntrada` (T003) e os dois ganchos de `saida.ts` (T005) ja
 * registram. A **ordem** esta afirmada por teste, para que mexer nela nao passe
 * calado.
 */
export interface GanchosDoPedido {
  /**
   * Dispara depois de a conta ter sido resolvida e **antes** de qualquer coisa
   * ser gerada ou gravada. Recebe o login. Nao altera o resultado.
   */
  readonly aoPedirRedefinicao?: (login: string) => void;
  /**
   * Decide se aquela conta pode redefinir a senha. `false` recusa o pedido com
   * o codigo `no_password_reset`.
   *
   * ⚠️ **O default de fabrica e permitir, e e so isso que esta implementado.** O
   * legado nega por conta propria num caso de rede — conta marcada como spam —,
   * e **esse caso nao esta registrado no pacote**: as excecoes de UC-20 listam
   * tres, e nenhuma e essa. A etapa equivalente da entrada existe porque UC-19 a
   * registra na pre-condicao (*"a conta existe e nao esta marcada como spam na
   * rede"*); aqui nao ha registro, e implementar a negacao por simetria seria
   * fechar o sistema mais que o legado sem ninguem ter decidido (P1, P4). O
   * ponto de extensao e onde essa negacao se liga quando alguem a registrar.
   */
  readonly permitirRedefinicao?: (conta: ContaNaRedefinicao) => boolean;
  /**
   * Dispara com a chave **em claro**, depois de gerada e **antes** de gravada —
   * e e nessa ordem no legado.
   *
   * ⚠️ E um ponto de extensao que recebe a credencial em claro. Nao e defeito a
   * corrigir: e o que permite a uma extensao mandar a chave por outro canal, e
   * CA-4.1 fala do que o **sistema** guarda e devolve, nao do que uma extensao
   * registrada faz com o argumento que o legado lhe entrega.
   */
  readonly aoGerarChave?: (login: string, chaveEmClaro: string) => void;
}

/** Os pontos de extensao da **gravacao da senha**, na ordem do fluxo. */
export interface GanchosDaRedefinicao {
  /**
   * Recebe os erros acumulados pelas duas validacoes de senha e devolve a lista
   * — podendo somar os seus. E ponto de **filtro**: devolve valor, como 69,7%
   * dos pontos do legado (AD-03).
   *
   * Dispara **depois** das duas validacoes e **antes** da decisao de gravar, que
   * e a posicao em que ele consegue impedir a gravacao.
   */
  readonly validarRedefinicao?: (
    erros: readonly ItemDeErroDeRedefinicao[],
    conta: ContaNaRedefinicao,
  ) => readonly ItemDeErroDeRedefinicao[];
  /** Dispara imediatamente antes de a senha ser gravada. Nao altera o resultado. */
  readonly antesDeRedefinir?: (
    conta: ContaNaRedefinicao,
    senhaNova: string,
  ) => void;
  /**
   * Dispara entre a gravacao e o fim do fluxo — no legado e o ponto de dentro da
   * escrita da senha, que e disparado antes do ponto de fim de fluxo.
   */
  readonly aoGravarSenha?: (
    conta: ContaNaRedefinicao,
    senhaNova: string,
  ) => void;
  /** Dispara no fim do fluxo, depois de a senha estar gravada. */
  readonly aposRedefinir?: (
    conta: ContaNaRedefinicao,
    senhaNova: string,
  ) => void;
}

/** O contexto do pedido de redefinicao (passos 1 a 3 de UC-20). */
export interface ContextoDoPedidoDeRedefinicao {
  readonly relogio: PortaDeRelogio;
  readonly contas: ContasParaRedefinicao;
  /** A porta de e-mail de T001: falha e **valor**, nunca excecao. */
  readonly email: PortaDeEmail;
  readonly gerador: GeradorDeChaveDeRedefinicao;
  readonly hashDaChave: HashDeChaveDeRedefinicao;
  readonly montagemDoEmail: MontagemDoEmailDeRedefinicao;
  /** O prazo da chave. Omitido, vale o de fabrica: 24 horas. */
  readonly prazoDaChave?: number;
  readonly ganchos?: GanchosDoPedido;
}

/** O contexto da gravacao da senha nova (passos 4 a 7 de UC-20). */
export interface ContextoDaRedefinicaoDeSenha {
  readonly relogio: PortaDeRelogio;
  readonly contas: ContasParaRedefinicao;
  readonly hashDaChave: HashDeChaveDeRedefinicao;
  readonly hashDeSenha: GeracaoDeHashDeSenha;
  /** O prazo da chave. Omitido, vale o de fabrica: 24 horas. */
  readonly prazoDaChave?: number;
  readonly ganchos?: GanchosDaRedefinicao;
}
