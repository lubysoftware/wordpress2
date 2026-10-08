/**
 * O caso de traducao da credencial de aplicacao: as **seis** capacidades que
 * resolvem todas em `edit_user` daquela conta (CA-10.4).
 *
 * Entrega de **T021** (US-10). E um dos dez atalhos de nomenclatura de `PERM-6`
 * (BR-MIGRAR-092) que T015 deixou declarados e nao construidos — *"os dez atalhos
 * de nomenclatura de `PERM-6` chegam com os casos deles"* —, e e tambem um dos
 * `case` de objeto que o `index.ts` de `plataforma/autorizacao/` lista como de
 * fora: *"os `case` de objeto que nao sao de conteudo — termo, comentario,
 * metadado, **senha de aplicacao**, rede —, cada um na feature do seu objeto"*.
 * Mora neste contexto, e nao embaixo, porque ele precisa saber se a conta alvo
 * **existe**, e conta e dado de BC-05: a regra de dependencia 2 proibe
 * `plataforma/` importar `contextos/`, e o encaixe que sobra e o
 * {@link CasoDeTraducao} que T015 publicou.
 *
 * A linha *Autorizacao* de UC-22 e a frase inteira desta tarefa: *"`edit_user`
 * daquele usuario. As seis capacidades de senha de aplicacao resolvem todas para
 * isso: quem pode editar a conta administra as credenciais dela"*. E a regra `U6`
 * (BR-MIGRAR-026) repete: *"sua administracao reusa a permissao de editar aquele
 * usuario"*.
 *
 * ---
 *
 * # A ORDEM dos dois ramos, que e a regra
 *
 * | # | situacao | devolve | de onde vem |
 * |---|---|---|---|
 * | 1 | conta alvo nao informada, ou que nao existe | `do_not_allow` | excecao de UC-22: *"Usuario inexistente — e o comentario no codigo e explicito: `not even themselves`"* |
 * | 2 | conta alvo existe | o que `edit_user` **daquela conta** exigir | linha *Autorizacao* de UC-22, `U6` |
 *
 * O ramo 1 vem primeiro, e trocar os dois de lugar nao produz defeito visivel:
 * produz um sistema em que a credencial de uma conta apagada e administravel por
 * quem administra a propria. E ele e tambem a aplicacao de `PERM-4`
 * (BR-MIGRAR-090) que `traducao-de-capacidade.ts` declara em uma linha: *"um caso
 * que nao reconhece a propria entrada devolve `CAPACIDADE_NEGADA`, nunca `[]`"* —
 * e a mesma coisa que o ramo 1 de `traducao-de-conteudo.ts` (T017) faz com o
 * objeto que nao existe.
 *
 * ---
 *
 * # 🔴 O que esta tarefa NAO construiu aqui, e a consequencia declarada
 *
 * **O `case` de `edit_user` e de T023 (US-11), e dele existe aqui apenas o primeiro
 * ramo.** No legado os dois nomes — `edit_user` e `edit_users` — compartilham um
 * unico `case`, cujo primeiro ramo e *"permitir que a conta edite a si mesma"* e o
 * resto exige `edit_users` e, **em rede**, protege o super administrador
 * (`do_not_allow`, fluxo alternativo de UC-22). O primeiro ramo esta aqui porque
 * UC-22 o lista entre as regras de negocio aplicadas — *"`edit_user` sobre si mesmo
 * devolve lista vazia, e lista vazia significa permitido"*, a pegadinha 2 de
 * `permissions.md` — e porque sem ele o **fluxo principal** de UC-22 nao existe: o
 * ator do caso de uso e o assinante no proprio perfil. O resto **nao** esta, porque
 * `tasks.md` da US-11 a T023, e porque a metade de rede dele e justamente a que
 * nao se pode construir pela metade.
 *
 * **Consequencia, declarada e nao escondida:** enquanto T023 nao registrar o `case`
 * completo, administrar a credencial de **outra** conta cai no ramo final da
 * traducao (`$caps[] = $cap`, em `traducao-de-capacidade.ts`), que devolve
 * `edit_user` — um nome que papel algum da matriz de fabrica concede. Logo a
 * resposta e **negado**: hoje este sistema e, nesse ponto, **mais fechado** que o
 * legado, onde quem tem `edit_users` administra a credencial de outrem. CA-10.4
 * continua satisfeito, porque o criterio cobra que a exigencia seja *"a mesma
 * permissao de editar aquela conta"* e e literalmente a mesma pergunta que e feita;
 * o que falta e a resposta dela, e ela chega com T023 **sem** alterar este arquivo:
 * basta a composicao passar o `case` de T023 em
 * {@link DependenciasDoCasoDeSenhaDeAplicacao.casosDeEdicaoDeConta}.
 *
 * ⚠️ **Uma diferenca da reentrada, declarada porque hoje e inalcancavel.** No
 * legado o atalho chama `map_meta_cap()` de novo, logo a reentrada atravessa o
 * mapeamento **inteiro**, incluindo o bloco das quatro constantes do dono do
 * servidor que `decisao-de-capacidade.ts` poe em primeiro lugar. Aqui a reentrada
 * atravessa **somente** os casos recebidos. A diferenca nao e alcancavel: nenhuma
 * das quatro constantes alcanca `edit_user` — ver `capacidadesAlcancadasPorConstante`
 * em `revogacao-por-constante.ts` —, e portanto nenhum ramo delas responderia.
 * Fica registrado para quem acrescentar constante.
 */

import {
  CAPACIDADE_NEGADA,
  traduzirCapacidade,
  type Capacidade,
  type CasoDeTraducao,
  type PedidoDeTraducao,
} from '../../../plataforma/autorizacao/index.js';

/**
 * As seis capacidades da credencial de aplicacao.
 *
 * ⚠️ **Enumeracao desta tarefa, nao do pacote.** UC-22 e BR-MIGRAR-092 falam em
 * *"as seis capacidades de senha de aplicacao"* **sem nomear nenhuma**, nas tres
 * vezes em que as citam. Os seis nomes foram lidos do legado na ancora que
 * BR-MIGRAR-026 e a rastreabilidade de US-10 citam para esta regra
 * (`wp-includes/capabilities.php:800`), e a enumeracao fecha contra o oraculo
 * (`ESC-ORACULO`, BR-MIGRAR-116) — que nesta arvore nao existe
 * (`oracleAvailable: false`). **Se o oraculo discordar, a correcao e nesta lista e
 * em nenhum outro lugar:** nada neste modulo compara nome de capacidade fora dela.
 *
 * Que sejam **seis** para **cinco** operacoes de rota (listar, criar, ler, editar e
 * apagar, no fluxo alternativo *Gerenciar pela API REST* de UC-22) tambem e do
 * legado: apagar tem duas, uma para a credencial e outra para o conjunto.
 */
export const CAPACIDADES_DE_SENHA_DE_APLICACAO: readonly Capacidade[] = [
  'create_app_password',
  'list_app_passwords',
  'read_app_password',
  'edit_app_password',
  'delete_app_passwords',
  'delete_app_password',
];

/** A capacidade em que as seis resolvem, e que decide por todas elas. */
export const CAPACIDADE_DE_EDICAO_DE_CONTA: Capacidade = 'edit_user';

/**
 * Se a conta alvo existe.
 *
 * Funcao, e nao repositorio, pelo mesmo motivo que `FonteDeConteudoNaAutorizacao`
 * (T017) e uma porta estreita: a traducao nao precisa da conta, precisa de **uma**
 * resposta sobre ela. Quem compoe liga isto a `RepositorioDeContas.obterPorId`.
 */
export type ExistenciaDeConta = (contaId: number) => boolean;

export interface DependenciasDoCasoDeSenhaDeAplicacao {
  readonly contaExiste: ExistenciaDeConta;
  /**
   * Os casos que decidem `edit_user`.
   *
   * Omitido, vale {@link CASOS_DE_EDICAO_DE_CONTA_DESTA_TAREFA} — o primeiro ramo
   * do `case` do legado, e so ele. Ver a consequencia declarada no cabecalho.
   */
  readonly casosDeEdicaoDeConta?: readonly CasoDeTraducao[];
}

/**
 * A conta alvo, lida de `$args[0]`.
 *
 * **A comparacao do legado e solta**, e isso aparece aqui: ele compara o
 * identificador de quem pergunta com o argumento usando igualdade nao estrita,
 * logo o texto `'7'` e o numero `7` sao a mesma conta. Reproduzir a comparacao
 * estrita faria uma borda que entrega o identificador como texto — o que uma borda
 * HTTP faz por natureza — deixar de reconhecer o proprio titular.
 */
export function contaAlvoDaCredencial(
  argumentos: readonly unknown[],
): number | null {
  const bruto = argumentos[0];
  if (typeof bruto === 'number') {
    return Number.isInteger(bruto) ? bruto : null;
  }
  if (typeof bruto === 'string' && /^-?[0-9]+$/.test(bruto)) {
    return Number(bruto);
  }
  return null;
}

/**
 * O primeiro ramo do `case` de `edit_user` do legado: a conta edita a si mesma, e
 * a lista exigida e **vazia**.
 *
 * Lista vazia significa **permitido**, e nao negado — BR-MIGRAR-092, a pegadinha 2
 * de `permissions.md`: *"um alvo que trate lista vazia como negacao tranca todo
 * mundo fora do proprio perfil"*. Quem a interpreta e o passo 7 de
 * `decisao-de-capacidade.ts`; aqui o que importa e devolver `[]` e nao `null`.
 *
 * O nome do argumento tem de estar presente: no legado o ramo e guardado por
 * *"existe `$args[0]`"*, e sem argumento o `case` segue para a exigencia de
 * `edit_users`. Aqui, sem argumento, este caso devolve `null` — *"nao e meu
 * caso"* — e quem fecha a porta e o ramo 1 de {@link casoDeSenhaDeAplicacao}.
 */
export const casoDeEdicaoDaPropriaConta: CasoDeTraducao = (pedido) => {
  if (pedido.capacidade !== CAPACIDADE_DE_EDICAO_DE_CONTA) {
    return null;
  }
  const alvo = contaAlvoDaCredencial(pedido.argumentos);
  if (alvo === null || alvo !== pedido.contaId) {
    return null;
  }
  return [];
};

/** Os casos de `edit_user` que esta tarefa tem. Ver o cabecalho. */
export const CASOS_DE_EDICAO_DE_CONTA_DESTA_TAREFA: readonly CasoDeTraducao[] = [
  casoDeEdicaoDaPropriaConta,
];

/**
 * O caso de traducao das seis capacidades.
 *
 * Fabrica, e nao constante, porque ele depende de dado da instalacao — a
 * existencia da conta alvo —, e AD-10 manda resolver chamada entre contextos **no
 * momento da chamada**. Quem compoe o passa em
 * `BaseDeAutorizacao.casosDeTraducao`.
 *
 * ⚠️ **Os casos de `edit_user` entram duas vezes na composicao**, e isso nao e
 * descuido: uma na cadeia do contexto, porque `edit_user` tambem e perguntado
 * direto, e outra aqui, porque e por aqui que o atalho de `PERM-6` reentra. No
 * legado sao a mesma coisa — um `switch` que chama a si mesmo —, e passar o mesmo
 * arranjo nos dois lugares e o que reproduz isso sem dar a este caso acesso a
 * cadeia inteira:
 *
 * ```ts
 * const casosDeConta = [ /* o `case` de `edit_user` de T023 *\/ ];
 * const base = {
 *   matriz,
 *   rede,
 *   casosDeTraducao: [
 *     casoDeSenhaDeAplicacao({ contaExiste, casosDeEdicaoDeConta: casosDeConta }),
 *     ...casosDeConta,
 *   ],
 * };
 * ```
 */
export function casoDeSenhaDeAplicacao(
  dependencias: DependenciasDoCasoDeSenhaDeAplicacao,
): CasoDeTraducao {
  const casosDeEdicao =
    dependencias.casosDeEdicaoDeConta ?? CASOS_DE_EDICAO_DE_CONTA_DESTA_TAREFA;

  return (pedido) => {
    if (!CAPACIDADES_DE_SENHA_DE_APLICACAO.includes(pedido.capacidade)) {
      return null;
    }

    // 1. Sem conta alvo, ou com conta que nao existe: negado, e UC-22 e literal
    //    sobre quem isso alcanca — "not even themselves".
    const alvo = contaAlvoDaCredencial(pedido.argumentos);
    if (alvo === null || !dependencias.contaExiste(alvo)) {
      return [CAPACIDADE_NEGADA];
    }

    // 2. A mesma pergunta que editar aquela conta, com o alvo no mesmo lugar em
    //    que o legado o repassa.
    const reentrada: PedidoDeTraducao = {
      ...pedido,
      capacidade: CAPACIDADE_DE_EDICAO_DE_CONTA,
      argumentos: [alvo],
    };
    return traduzirCapacidade(reentrada, casosDeEdicao);
  };
}
