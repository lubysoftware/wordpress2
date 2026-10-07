/**
 * A fatia de `AGG-Conta` que US-4 le e grava, e **nenhuma representacao nova de
 * conta**.
 *
 * > 🔴 **Esta arvore tem DUAS `Conta`, e esta tarefa nao escolhe entre elas.** O
 * > `index.ts` do modulo registra o conflito por extenso: T002 escreveu
 * > `armazenamento/conta.ts` e T003 escreveu `conta/leitura-de-conta.ts`,
 * > modelando a mesma linha de `users`, e *"qual das duas representacoes fica, e
 * > o que acontece com os consumidores da outra, e decisao de produto"*.
 * > Acrescentar uma terceira seria resolver o problema para o lado errado.
 * >
 * > O que este arquivo faz: declara os **quatro campos** que o fluxo de
 * > redefinicao usa, e os declara de forma que as duas `Conta` existentes os
 * > satisfazem sem conversao nenhuma. Qualquer das duas entra aqui; nenhuma e
 * > preferida.
 *
 * E as escritas vem do repositorio de **T002**, que e o dono da forma de
 * armazenamento: nenhuma consulta e montada neste arquivo. O que esta aqui e a
 * reducao da interface — o fluxo de dominio ve quatro operacoes, nao dez.
 */

import type {
  CamposDeConta,
  Conta as ContaDoArmazenamento,
  RepositorioDeContas,
} from '../armazenamento/conta.js';

/**
 * A conta, na fatia que a redefinicao usa.
 *
 * Os quatro campos sao os que os dois fluxos de US-4 tocam: o `id` localiza a
 * linha na escrita, o `login` e o que a chave do e-mail carrega e o que a
 * conferencia usa para achar a conta, o `email` e **o unico destino possivel da
 * chave em claro** (CA-4.1), e `chaveDeAtivacao` e o estado que a conferencia le.
 *
 * `senhaHash` **nao** esta aqui de proposito: este fluxo nao confere senha
 * nenhuma — a posse do e-mail e a autorizacao (UC-20) — e um fluxo que nao le o
 * *hash* nao tem como vaza-lo.
 */
export interface ContaNaRedefinicao {
  readonly id: number;
  readonly login: string;
  readonly email: string;
  /** `users.user_activation_key`: vazia quando nao ha chave pendente. */
  readonly chaveDeAtivacao: string;
}

/**
 * As quatro operacoes de dados de US-4.
 *
 * Sincronas por AD-04, como todas as deste contexto.
 */
export interface ContasParaRedefinicao {
  /** `get_user_by( 'login', … )` — o passo 1 do pedido, e a conferencia da chave. */
  porLogin(login: string): ContaNaRedefinicao | null;
  /** `get_user_by( 'email', … )` — o caminho por e-mail do passo 1. */
  porEmail(email: string): ContaNaRedefinicao | null;
  /**
   * Grava a chave nova (passo 2 de UC-20).
   *
   * **Gravar substitui**, e e isso que faz CA-4.3 valer: a coluna e uma so, logo
   * um pedido novo antes do prazo apaga a chave anterior sem que nada precise
   * revoga-la. O fluxo alternativo de UC-20 diz a mesma coisa pelo avesso —
   * *"uma chave nova e gerada e substitui a anterior; o link antigo deixa de
   * valer"*.
   */
  gravarChaveDeAtivacao(idDaConta: number, valorGravado: string): void;
  /**
   * Grava a senha nova **e** apaga a chave, no mesmo comando (CA-4.4).
   *
   * As duas colunas num `UPDATE` so nao e economia: e o que o legado faz, e o
   * criterio de paridade desta area e *"efeito no banco"* com tolerancia zero
   * (Decisao 2 de `parity_specs.md`). Separar em dois comandos criaria um
   * instante em que a senha ja e a nova e a chave antiga ainda vale.
   *
   * A sentinela gravada e a **vazia**, nao `NULL`: `DB-SENT` registra que o
   * esquema evita `NULL`, e o DDL desta coluna e `NOT NULL default ''`.
   */
  gravarSenhaEApagarChave(idDaConta: number, senhaHash: string): void;
}

/**
 * Liga as quatro operacoes ao repositorio de T002.
 *
 * ⚠️ **Uma diferenca de clausula fica registrada e nao resolvida aqui.** O
 * repositorio de T002 localiza a linha por `ID`; a ancora de BR-MIGRAR-024 e
 * `wp-includes/user.php:3204`, e o pacote **nao registra por qual coluna o
 * legado localiza a linha ao gravar a chave**. A diferenca so e observavel numa
 * instalacao com **login duplicado** — que o banco aceita, porque
 * `user_login_key` nao e `UNIQUE` e a unicidade e conferida em codigo
 * (BR-MIGRAR-022, e REQ-010 ficou `bloqueado`). Acrescentar um metodo "por
 * login" ao repositorio de T002 seria escolher a clausula por conta propria;
 * fica para a conferencia contra o oraculo (`ESC-ORACULO`).
 *
 * ⚠️ **E um erro do legado nao e expressavel por esta porta.** Quando a gravacao
 * da chave falha, o legado devolve um erro proprio
 * (*"Could not save password reset key to database."*) distinguindo **falha** de
 * **zero linhas afetadas**. `PortaDeDados.escrever` so informa quantas linhas
 * mudaram, e inventar um canal de erro aqui mudaria a porta de T001 por causa de
 * um caminho que o pacote nao descreve. Registrado, nao implementado.
 */
export function contasParaRedefinicaoDoRepositorio(
  repositorio: RepositorioDeContas,
): ContasParaRedefinicao {
  function fatia(conta: ContaDoArmazenamento | null): ContaNaRedefinicao | null {
    return conta;
  }

  return {
    porLogin(login) {
      return fatia(repositorio.obterPorLogin(login));
    },

    porEmail(email) {
      return fatia(repositorio.obterPorEmail(email));
    },

    gravarChaveDeAtivacao(idDaConta, valorGravado) {
      const campos: CamposDeConta = { chaveDeAtivacao: valorGravado };
      repositorio.atualizar(idDaConta, campos);
    },

    gravarSenhaEApagarChave(idDaConta, senhaHash) {
      // Os dois campos na mesma chamada: um `UPDATE`, duas colunas.
      const campos: CamposDeConta = { senhaHash, chaveDeAtivacao: '' };
      repositorio.atualizar(idDaConta, campos);
    },
  };
}
