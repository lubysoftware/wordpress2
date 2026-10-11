/**
 * **CA-5.1**: *"Apagar o termo declarado como padrao de um contexto e recusado,
 * **para qualquer ator**"*.
 *
 * Entrega de **T011** da feature `003-classificacao-do-conteudo` (US-5). E o
 * **passo 2** de `wp_delete_term()` — `wp-includes/taxonomy.php:2073` a `:2087`,
 * com os dois `return 0` em `:2077` e `:2086` —, o passo que T003 inventariou com
 * dono em `../rotulo-e-contexto/remover-rotulo-do-contexto.ts` e que T009 deixou
 * escrito como o unico que faltava da cascata:
 *
 * > | 2 | `default_category` / `default_term_{nome}`: `return 0` | `:2073`-`:2087` |
 * > 🔴 **T011** — ver o bloco acima
 *
 * A regra de negocio e `BR-MIGRAR-091` (`PERM-5`), que a poe entre as **onze
 * negacoes absolutas** do sistema: *"o **termo padrao da taxonomia e
 * indestrutivel**"*. UC-08 a repete na tabela de *Excecoes* — *"Apagar o termo
 * padrao da taxonomia | `do_not_allow`: o termo padrao e indestrutivel, e a
 * negacao vence ate o super administrador"* — e poe nas *Pos-condicoes* a forma
 * observavel dela: *"o termo padrao da taxonomia **continua existindo**"*.
 *
 * ---
 *
 * # SAO DUAS RECUSAS, E ESTA E A QUE NAO TEM ATOR
 *
 * O legado recusa apagar o termo padrao em **dois** lugares, com **dois**
 * mecanismos, e e por isso que esta pasta tem dois arquivos de regra:
 *
 * | # | onde | mecanismo | criterio |
 * |---|---|---|---|
 * | 1 | dentro de `wp_delete_term()` (`:2073`-`:2087`) | `return 0`, **sem consultar capacidade nenhuma** | **CA-5.1** — *"para qualquer ator"* |
 * | 2 | no `case` de `map_meta_cap()` sobre o termo (`capabilities.php:738`-`:744`) | `do_not_allow`, que vence o atalho do super administrador | **CA-5.2** — ver `./caso-de-capacidade-sobre-rotulo.ts` |
 *
 * **Este arquivo e o 1, e e ele que faz `CA-5.1` valer na letra.** A recusa aqui
 * nao pergunta quem esta chamando — nao ha ator em
 * `ColaboracaoDaExclusaoDeRotulo`, e T009 escreveu por que (*"`wp_delete_term()`
 * nao tem `current_user_can` no corpo"*) —, logo ela alcanca **todo** chamador:
 * a tela, a API REST, o XML-RPC, a fila agendada e qualquer extensao que chame a
 * funcao. E e dela que sai a metade de `UT-037-4` que fala da *"superficie
 * programatica"*.
 *
 * ⚠️ **A recusa do mecanismo 2 nao substitui a deste**, e inverter isso e o erro
 * facil da historia: a acao em lote da tela cobra `$tax->cap->delete_terms`, no
 * **plural** e **sem o termo em maos** (UC-08, *Excecoes*: *"Ator sem
 * `delete_terms`"*), logo ela **nao** passa pelo `case` de objeto — o que
 * protege o termo padrao de um lote e so este `return 0`. Ver a tabela de
 * `./permissao-sobre-rotulo.ts`.
 *
 * # OS DOIS `if` DO LEGADO, e por que aqui eles sao um
 *
 * O legado escreve o passo como dois blocos, nesta ordem:
 *
 * ```php
 * if ( 'category' === $taxonomy ) {
 *     $defaults['default'] = (int) get_option( 'default_category' );   // :2075
 *     if ( $defaults['default'] === $term ) { return 0; }               // :2077
 * }
 * // Don't delete the default custom taxonomy term.
 * $taxonomy_object = get_taxonomy( $taxonomy );
 * if ( ! empty( $taxonomy_object->default_term ) ) {
 *     $defaults['default'] = (int) get_option( 'default_term_' . $taxonomy ); // :2084
 *     if ( $defaults['default'] === $term ) { return 0; }               // :2086
 * }
 * ```
 *
 * Os dois blocos sao **a mesma pergunta com a chave de opcao de cada contexto**,
 * e essa escolha de chave ja tem dono nesta arvore: {@link chaveDoTermoPadrao},
 * de T007, que `../registro/contexto-de-classificacao.ts` ancorou **nestas duas
 * linhas** em T001 — *"`default_category` para `category`,
 * `default_term_{nome}` para os demais (`taxonomy.php:2075` e `:2084`...)"*. Por
 * isso aqui o passo e **uma** leitura, com a condicao que e a uniao das duas do
 * legado: `category` **sempre**, e qualquer outro contexto **se ele declarou
 * `default_term` no registro** (o `! empty( $taxonomy_object->default_term )` de
 * `:2083`, que e {@link ContextoDeClassificacao.rotuloPadrao}).
 *
 * Fundir os dois `if` muda **uma** coisa, e ela e inalcancavel: um contexto que
 * se chamasse `category` **e** declarasse `default_term` leria, no legado, as
 * **duas** chaves, e a segunda venceria. `category` e `_builtin`, nao se remove
 * (`../registro/contexto-de-classificacao.ts`) e **nao** declara `default_term`
 * — *"nenhum dos oito contextos do nucleo o declara"* —, logo nenhuma instalacao
 * alcanca o caso. Fica declarado aqui em vez de virar um ramo que nada exercita.
 *
 * ⚠️ **A gravacao da opcao nao esta aqui, e e CA-5.3.** *"Trocar qual termo e o
 * padrao e permitido, e so entao o anterior pode ser apagado"*: a troca e uma
 * **escrita em `options`**, que nenhuma funcao de termo do legado faz — ver a
 * tabela de ausencias de `./escopo-de-protecao-do-termo-padrao.ts`. O que esta
 * funcao garante, e e o que o criterio cobra, e que ela le a opcao **a cada
 * chamada**: assim que o padrao aponta para outro rotulo, o anterior passa a ser
 * apagavel, e o novo passa a ser indestrutivel.
 *
 * # O VALOR DEVOLVIDO E `0`, e `0` nao e `false`
 *
 * T003 e T009 declararam a ausencia dele nos dois resultados que escreveram
 * (*"o `0` do legado nao esta aqui (...) Quem fechar T011 acrescenta esse
 * desfecho"*), e esta tarefa o acrescenta **como valor proprio**, nao como outro
 * `false`. No legado os tres desfechos sao distintos e um chamador os distingue:
 *
 * | valor | o que significa | onde |
 * |---|---|---|
 * | `false` | o par `(rotulo, contexto)` nao existe | `:2063` |
 * | `0` | **o rotulo e o termo padrao do contexto** | `:2077` e `:2086` |
 * | `true` | apagou | `:2258` |
 *
 * Em PHP os dois primeiros sao falsos, e e por isso que a tela nao distingue os
 * dois casos na interface — mas o valor devolvido e **diferente**, e e superficie
 * publicada (P8). Colapsar `0` em `false` aqui apagaria a distincao para quem
 * chama a funcao, que e exatamente o que o **P8** proibe.
 */

import type { ContextoDeClassificacao } from '../registro/index.js';
import { CONTEXTO_DE_CATEGORIA } from '../registro/index.js';
import {
  chaveDoTermoPadrao,
  SEM_TERMO_PADRAO,
  type OpcoesNaClassificacao,
} from '../termo-padrao/index.js';

/**
 * O `return 0` de `wp_delete_term()` (`:2077` e `:2086`) — *"Don't delete the
 * default category"*.
 *
 * E **valor de retorno**, nao codigo de erro: nao ha `WP_Error` neste caminho, e
 * nao ha mensagem. A recusa do legado e **silenciosa** aqui, e o **P7** poe o
 * silencio no contrato — quem chama recebe `0` e segue sem aviso, sem registro e
 * sem excecao. O `msgid` que a tela mostra quando **ela** recusa e outro, e esta
 * em `./permissao-sobre-rotulo.ts`.
 */
export const RECUSA_DO_TERMO_PADRAO = 0;

/** O desfecho do passo 2: a recusa, e o `$defaults['default']` que ele resolve. */
export interface ProtecaoDoTermoPadrao {
  /**
   * `true` quando o rotulo **e** o termo padrao daquele contexto, e a exclusao
   * para com {@link RECUSA_DO_TERMO_PADRAO}.
   */
  readonly indestrutivel: boolean;
  /**
   * `$defaults['default']` — o termo padrao do contexto, como a opcao o guarda,
   * ou {@link SEM_TERMO_PADRAO} quando o contexto nao tem padrao algum.
   *
   * ⚠️ **Ele viaja no desfecho porque o legado o reusa**: o valor lido aqui no
   * passo 2 e o `$defaults` de `wp_parse_args( $args, $defaults )` no passo 3
   * (`:2100`), e e o que recebe os objetos orfanados em `DB-TRG4` quando ninguem
   * informou `$args['default']`. Ler a opcao **de novo** no passo 3 emitiria uma
   * leitura que o legado nao emite — e e por isso que
   * `../manutencao-da-lista/apagar-rotulo-do-contexto.ts` recebe este campo em
   * vez de perguntar a opcao outra vez.
   */
  readonly padraoDoContexto: number;
}

/**
 * O passo 2 de `wp_delete_term()`: o termo padrao do contexto nao se apaga.
 *
 * **Permissao exigida: nenhuma, e a ausencia E o criterio.** CA-5.1 diz *"para
 * qualquer ator"*, e o legado cumpre isso nao consultando ator nenhum: o `return
 * 0` esta **antes** de qualquer decisao de capacidade, e `wp_delete_term()` nao
 * tem `current_user_can` no corpo (T003, T009). Uma versao desta funcao que
 * recebesse ator convidaria a abrir excecao para alguem, e e justamente o que
 * ADR 0009 recusa.
 *
 * **Nao toca o banco**: le o registro desta requisicao e a opcao por ligacao
 * tardia. A posicao no legado e **depois** da resolucao do par — logo um rotulo
 * que nao existe devolve `false` antes de a opcao ser lida, e a opcao **nao** e
 * lida nesse caso.
 */
export function protecaoDoTermoPadrao(
  contexto: ContextoDeClassificacao,
  opcoes: OpcoesNaClassificacao,
  rotuloId: number,
): ProtecaoDoTermoPadrao {
  // A uniao dos dois `if` do legado: `'category' === $taxonomy` (`:2074`) ou
  // `! empty( $taxonomy_object->default_term )` (`:2083`). Ver o cabecalho sobre
  // o unico caso que a fusao nao distingue, e por que ele e inalcancavel.
  const temPadraoDeclarado =
    contexto.nome === CONTEXTO_DE_CATEGORIA || contexto.rotuloPadrao !== null;

  if (!temPadraoDeclarado) {
    // `$defaults` fica vazio, e o passo 3 so tem o que o chamador informar.
    return { indestrutivel: false, padraoDoContexto: SEM_TERMO_PADRAO };
  }

  // `$defaults['default'] = (int) get_option( ... )` (`:2075` e `:2084`).
  const padraoDoContexto = opcoes.identificadorDoTermoPadrao(
    chaveDoTermoPadrao(contexto.nome),
  );

  // `if ( $defaults['default'] === $term ) { return 0; }` (`:2077` e `:2086`).
  // A comparacao e entre inteiros nos dois lados, e e por isso que a opcao
  // ausente (que vale `0`) nunca casa: `rotuloId` **zero** nao chega aqui —
  // `get_term( 0 )` ja devolveu erro no passo 1.
  return {
    indestrutivel: padraoDoContexto === rotuloId,
    padraoDoContexto,
  };
}
