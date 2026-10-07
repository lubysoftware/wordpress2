/**
 * O vocabulario da autorizacao: capacidade, concessao e matriz de papeis.
 *
 * `PERM-1` (BR-MIGRAR-087) diz a frase que este arquivo tem de sustentar: **a
 * capacidade e a unidade real, e o papel e um atalho**. Dai as tres escolhas de
 * tipo aqui, e nenhuma delas e estilo:
 *
 * 1. **Capacidade e `string`, e papel tambem.** Nenhuma uniao fechada, nenhum
 *    `enum`. O aviso de compatibilidade de `PERM-13` (BR-MIGRAR-099) e
 *    endereçado exatamente a um arquivo como este: *"um alvo tipado tenderia a
 *    declarar os papeis como uniao fechada de tipos — e isso congela o que o
 *    legado deixa mutavel. E o caso mais claro em que 'idiomatico' quebra a
 *    regra."* Uma extensao cria o papel e a capacidade que quiser, em execucao.
 * 2. **A concessao e uma lista ordenada, nao um mapa.** A ordem em que as
 *    concessoes entraram e a ordem em que elas saem nos bytes da opcao, e o
 *    cenario de paridade exige valor gravado identico byte a byte
 *    (`07-autorizacao-por-capacidade.feature`). E a mesma razao de
 *    `armazenamento/papel.ts` em BC-05.
 * 3. **Esta forma e declarada aqui e nao importada de BC-05.** A regra de
 *    dependencia 2 de `target_architecture.md` proibe `plataforma/` importar
 *    `contextos/`, e a decisao de capacidade mora em `plataforma/autorizacao/`
 *    porque e chamada 1.279 vezes em 224 arquivos. A forma e a MESMA que BC-05
 *    grava — de proposito, para o adaptador passar o objeto adiante sem
 *    converter.
 *
 * **As duas capacidades sinteticas.** `PERM-1`: *"duas sao sinteticas: `exist` e
 * concedida a todo mundo e `do_not_allow` e removida da lista antes da
 * comparacao, de modo que ninguem pode te-la"*. Elas nao sao nome de
 * conveniencia: `do_not_allow` e o unico mecanismo do sistema que vence o super
 * administrador (ADR-0009), e por isso vive aqui e nao numa lista de excecoes.
 */

/**
 * O nome de uma capacidade.
 *
 * Apelido de `string`, e so. Existe para a assinatura dizer o que espera; nao
 * existe para fechar o conjunto — ver o item 1 do cabecalho.
 */
export type Capacidade = string;

/** Uma concessao: o nome e se ele esta concedido ou negado. */
export interface ConcessaoDeCapacidade {
  readonly capacidade: Capacidade;
  readonly concedida: boolean;
}

/**
 * Um papel da matriz declarada: o identificador e as capacidades, na ordem.
 *
 * Sem o nome exibido de proposito: quem exibe papel e a interface de papeis, e
 * **nenhuma decisao de autorizacao olha nome** (CA-7.1). O nome exibido fica
 * onde o dado mora, em BC-05.
 */
export interface PapelDeclarado {
  readonly identificador: string;
  readonly capacidades: readonly ConcessaoDeCapacidade[];
}

/**
 * A matriz papel por capacidade **como esta gravada agora**.
 *
 * Chega por argumento em toda decisao, e isso e `PERM-13` mais ADR-0001: a
 * definicao e um retrato tirado na instalacao, e depois disso o dado gravado e a
 * verdade enquanto o codigo deixa de ser. Guardar esta matriz em estado de
 * modulo congelaria o retrato e quebraria CA-7.2 — alem de cruzar identidade
 * entre requisicoes concorrentes (`EXT-CONTEXTO`, BR-MIGRAR-105).
 */
export type MatrizDePapeis = readonly PapelDeclarado[];

/**
 * `exist` — concedida a todo mundo, inclusive a quem nao existe.
 *
 * `class-wp-user.php:827`, pelo comentario do proprio legado: *"Everyone is
 * allowed to exist."* Ela e acrescentada **depois** do ponto de extensao, logo
 * nem uma extensao consegue retira-la.
 */
export const CAPACIDADE_CONCEDIDA_A_TODOS: Capacidade = 'exist';

/**
 * `do_not_allow` — removida da lista do ator antes da comparacao, de modo que
 * **ninguem** pode te-la.
 *
 * `class-wp-user.php:829`, tambem com o comentario do legado: *"Nobody is
 * allowed to do things they are not allowed to do."* E o terceiro valor que
 * ADR-0009 manda replicar — "tem", "nao tem" e **"negado"** — e o unico
 * mecanismo que vence o super administrador.
 */
export const CAPACIDADE_NEGADA: Capacidade = 'do_not_allow';

/** As duas sinteticas, na ordem em que a decisao as aplica. */
export const CAPACIDADES_SINTETICAS: readonly Capacidade[] = [
  CAPACIDADE_CONCEDIDA_A_TODOS,
  CAPACIDADE_NEGADA,
];

/**
 * `WP_Roles::is_role()` — o identificador esta na matriz gravada?
 *
 * E com isto, e so com isto, que se separa papel de capacidade dentro da chave
 * `{site}capabilities`: o legado guarda os dois no mesmo mapa de nome para
 * booleano (BR-MIGRAR-087, `chaves-e-tabelas.ts`), e quem decide se um nome e
 * papel e a matriz — nao uma lista de nomes no codigo.
 */
export function temPapel(matriz: MatrizDePapeis, identificador: string): boolean {
  return matriz.some((papel) => papel.identificador === identificador);
}

/** As capacidades daquele papel, na ordem gravada. Papel inexistente: vazio. */
export function capacidadesDoPapel(
  matriz: MatrizDePapeis,
  identificador: string,
): readonly ConcessaoDeCapacidade[] {
  return (
    matriz.find((papel) => papel.identificador === identificador)?.capacidades ??
    []
  );
}

/**
 * Os papeis que **concedem** aquela capacidade.
 *
 * Concedem, nao mencionam: um papel que guarda a capacidade com valor `false`
 * nao a concede, e e por isso que a comparacao e com `concedida === true` e nao
 * com a presenca do nome. A diferenca aparece em CA-7.4, onde a busca no
 * armazenamento alcanca o **nome** e nao o valor.
 */
export function papeisQueConcedem(
  matriz: MatrizDePapeis,
  capacidade: Capacidade,
): readonly string[] {
  return matriz
    .filter((papel) =>
      papel.capacidades.some(
        (concessao) =>
          concessao.capacidade === capacidade && concessao.concedida,
      ),
    )
    .map((papel) => papel.identificador);
}
