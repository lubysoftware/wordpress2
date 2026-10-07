/**
 * Os pontos de configuracao nomeados do cadastro aberto, com os valores de
 * fabrica do legado.
 *
 * O **P6** da constituicao cobra exatamente esta forma: *"cada numero vive num
 * ponto de configuracao nomeado, com o valor de fabrica do legado, e existe teste
 * que afirma o valor e o efeito da borda (no ultimo instante aceita, um instante
 * depois recusa)"*. Por isso nada deste modulo le `60`, `50` ou `false` de dentro
 * de uma expressao: tudo passa por aqui, e a suite desta tarefa afirma o valor e
 * a borda de cada um.
 *
 * As duas familias estao separadas porque **vem de lugares diferentes do legado**,
 * e confundi-las e o jeito mais rapido de dar valor de fabrica a dado de
 * instalacao:
 *
 * - {@link LimitesDoCadastro} e o que o **codigo** do legado impoe. Esta no
 *   codigo, e o valor de fabrica e o unico valor: `U2` (BR-MIGRAR-022) poe os 60
 *   e os 50 em `wp-includes/user.php:2318` e `:2347`.
 * - {@link OpcoesDoCadastro} e o que a **instalacao** grava. O valor de fabrica e
 *   a linha que o instalador semeia (`DB-SEED`, BR-MIGRAR-084: *"o esquema vazio
 *   nao e funcional: parte da regra esta nas linhas que o instalador cria…
 *   `default_role = 'subscriber'`"*), e depois disso o dado gravado e a verdade.
 *
 * ⚠️ **O que nao esta aqui, e nao e esquecimento:** a lista de logins proibidos.
 * `U3` (BR-MIGRAR-023) e literal — *"a lista de logins proibidos e vazia por
 * padrao e existe so como filtro (`illegal_user_logins`), **sem interface**"* —,
 * e UC-21 repete no fluxo alternativo: *"a lista e vazia por padrao e existe so
 * como filtro, sem interface"*. Opcao tem interface; filtro nao. Por isso a
 * lista entra pelo ponto de extensao de `contexto-de-cadastro.ts` e so o valor
 * de fabrica dela — {@link LOGINS_PROIBIDOS_DE_FABRICA}, vazio — mora aqui.
 *
 * **Nada deste arquivo le a opcao.** Ler `users_can_register` e `default_role` do
 * armazenamento e trabalho do registro de opcoes (`REG-Opcao`), que nao existe
 * nesta arvore: a feature 001 declara, no seu *Modelo de dados*, uma unica chave
 * de `options` — `{prefixo}user_roles`. Aqui, como em `EstadoDaRede` de
 * `../autenticacao/contexto-de-autenticacao.ts`, a opcao e **entrada lida de
 * fora**, e o valor de fabrica e o que vale quando ninguem informa nada.
 */

import { SEGUNDOS_POR_HORA } from '../autenticacao/prazos-de-sessao.js';

/** Os limites que o codigo do legado impoe ao cadastro. */
export interface LimitesDoCadastro {
  /** `U2`: 60 caracteres de login — e **erro**, nao truncamento. */
  readonly comprimentoMaximoDeLogin: number;
  /** `U2`: 50 caracteres de apelido — e **erro**, nao truncamento. */
  readonly comprimentoMaximoDeApelido: number;
  /**
   * O comprimento da senha que o sistema gera para a conta nova.
   *
   * ⚠️ **Este numero nao esta registrado neste pacote para ESTE caminho.** O
   * pacote registra comprimento gerado em dois outros lugares — 24 caracteres da
   * credencial de aplicacao (`U6`, BR-MIGRAR-026) e 12 da ativacao de cadastro
   * em rede (`U9`, BR-MIGRAR-029, que e `BC-12` e esta fora deste pacote) — e
   * **nao** para o cadastro aberto de UC-21. O valor abaixo reproduz o legado e
   * fecha contra o oraculo (`ESC-ORACULO`, BR-MIGRAR-116), como a contagem de
   * codigos de erro de entrada em `../autenticacao/erro-de-autenticacao.ts`.
   *
   * Ele **nao e observavel** por quem se cadastra: CA-6.4 fixa que a conta nasce
   * *"sem senha definida pelo titular"* e CA-6.5 que o titular recebe **um
   * caminho para definir a senha**, nunca a senha gerada. Por isso errar este
   * numero nao muda nenhuma resposta do sistema, e por isso ele chega por
   * configuracao em vez de constante solta.
   */
  readonly comprimentoDaSenhaInicial: number;
  /**
   * O comprimento da chave de redefinicao que acompanha o e-mail.
   *
   * ⚠️ Mesma ressalva do campo acima: o pacote nao registra este comprimento.
   */
  readonly comprimentoDaChaveDeRedefinicao: number;
  /**
   * `U4` (BR-MIGRAR-024): **a chave de redefinicao vale 24 horas.** CA-6.5 cobra
   * o prazo nesta tarefa; **consumir** a chave e US-4 / T009, e e la que o prazo
   * recusa. Ver `chave-de-redefinicao.ts`.
   */
  readonly prazoDaChaveDeRedefinicaoEmSegundos: number;
}

export const LIMITES_DO_CADASTRO_DE_FABRICA: LimitesDoCadastro = {
  comprimentoMaximoDeLogin: 60,
  comprimentoMaximoDeApelido: 50,
  comprimentoDaSenhaInicial: 12,
  comprimentoDaChaveDeRedefinicao: 20,
  prazoDaChaveDeRedefinicaoEmSegundos: 24 * SEGUNDOS_POR_HORA,
};

/** O que a instalacao gravou, e que o cadastro le. */
export interface OpcoesDoCadastro {
  /**
   * `users_can_register`. `U1` (BR-MIGRAR-021): **nasce desligado**, e CA-6.1
   * repete — *"o cadastro aberto nasce desligado; desligado, o formulario nao e
   * oferecido e a acao e recusada"*.
   *
   * UC-21 poe isto na linha de **autorizacao** do caso de uso, nao numa
   * validacao: *"a opcao `users_can_register`, que nasce desligada. Sem ela,
   * **este caso de uso nao existe na instalacao**"*.
   */
  readonly cadastroAberto: boolean;
  /**
   * `default_role`. `U1`: **`subscriber`**, o papel de menor poder — e UC-21
   * registra o que ele significa: *"o assinante criado aqui nao produz nada. Tem
   * apenas `read`"*.
   *
   * E `string`, nao uniao fechada, pelo mesmo motivo que `../armazenamento/papel.ts`
   * da: o ADR-0001 poe a definicao de papel como **dado mutavel**, e uma uniao
   * fechada congelaria o que o legado deixa mutavel.
   */
  readonly papelPadrao: string;
  /**
   * `blogname`, que entra no assunto da mensagem. Vem da instalacao: o valor de
   * fabrica aqui e o vazio, porque o titulo e informado em quem instala.
   */
  readonly tituloDoSite: string;
  /**
   * `admin_email`, que entra na mensagem de falha de criacao. Mesma ressalva do
   * titulo.
   */
  readonly emailDoAdministrador: string;
}

export const OPCOES_DO_CADASTRO_DE_FABRICA: OpcoesDoCadastro = {
  cadastroAberto: false,
  papelPadrao: 'subscriber',
  tituloDoSite: '',
  emailDoAdministrador: '',
};

/**
 * `U3` (BR-MIGRAR-023): a lista de logins proibidos **nasce vazia**, e CA-6.6
 * cobra as duas metades — *"login constante da lista de proibidos e recusado, e a
 * lista nasce vazia"*.
 *
 * E o cenario de paridade da area cobra a consequencia: *"Dado nenhuma extensao
 * registrada no ponto de logins proibidos / Quando qualquer login valido e
 * registrado / Entao as duas metades **aceitam**"*
 * (`parity_tests/06-autenticacao-e-sessao.feature`).
 */
export const LOGINS_PROIBIDOS_DE_FABRICA: readonly string[] = [];
