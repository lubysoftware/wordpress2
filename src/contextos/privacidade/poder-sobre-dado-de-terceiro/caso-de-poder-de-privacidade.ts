/**
 * O `case` que poe exportar e apagar dado de terceiro no **nivel mais alto da
 * instalacao** — `CA-8.1` e `CA-8.2`.
 *
 * Entrega de **T017** da feature `008-privacidade-e-dados-pessoais` (US-8,
 * `REQ-095`). E um `case` so no legado, com **tres rotulos**, e o corpo cabe numa
 * linha:
 *
 * ```php
 * case 'export_others_personal_data':   // wp-includes/capabilities.php:795
 * case 'erase_others_personal_data':    // :796
 * case 'manage_privacy_options':        // :797
 *     $caps[] = is_multisite() ? 'manage_network' : 'manage_options';  // :798
 *     break;                                                          // :799
 * ```
 *
 * `BR-MIGRAR-042` (`D4`) transcreve a mesma coisa em prosa — *"exportar ou apagar
 * dados de terceiro e poder de rede. `export_others_personal_data`,
 * `erase_others_personal_data` e `manage_privacy_options` mapeiam para
 * `manage_network` em multisite e `manage_options` fora dela"* — com a nota de
 * paradigma que `PedidoDeTraducao.emRede` existe para cumprir: *"o alvo precisa
 * resolver `MULTISITE` **antes** de autorizar"*. UC-25 repete na linha de
 * *Autorizacao*: *"e poder de rede, nao de site"*.
 *
 * ---
 *
 * # A regra nao e reimplementada aqui, e isso foi combinado por escrito
 *
 * A metade de rede desta regra ja existe em
 * `plataforma/autorizacao/traducao-de-conteudo.ts`, posta la por **T017 da
 * feature `001`** porque o ramo da pagina de politica precisava dela. Aquele
 * arquivo nomeou esta tarefa:
 *
 * > *"Quem portar a feature 008 acrescenta os dois nomes de dados pessoais a
 * > `traducaoDePrivacidade` em lugar de reimplementar a regra."*
 *
 * E e o que este arquivo faz: `capacidadesDePrivacidade( emRede )` continua sendo
 * a **unica** copia do `is_multisite() ? ... : ...`, e o que T017 acrescenta sao
 * os dois rotulos que faltavam. O caso mora **aqui** e nao la por dependencia:
 * `plataforma/` nao pode importar `contextos/` (regra 2) e os nomes de dado
 * pessoal sao vocabulario de BC-06 — e o mesmo recorte que
 * `plataforma/autorizacao/index.ts` declarou em T015, *"os dez atalhos de
 * nomenclatura de `PERM-6` (chegam com os casos deles)"*, e que
 * `contextos/classificacao/manutencao-da-lista/caso-de-gestao-de-rotulo.ts`
 * seguiu antes desta.
 *
 * ⚠️ **Este caso reconhece os tres rotulos, inclusive `manage_privacy_options`,
 * que `traducaoDePrivacidade` tambem reconhece.** A sobreposicao e deliberada e
 * **nao** e ambiguidade: as duas devolvem a mesma lista, pela mesma funcao, logo
 * a ordem entre elas nao muda decisao nenhuma, e um chamador pode declarar uma,
 * a outra ou as duas. Partir o `case` de tres rotulos do legado em dois casos que
 * so juntos o reproduzem seria pior: quem compusesse so um deles teria **meio**
 * `case`, e `BR-MIGRAR-094` manda a ordem ser declarada no alvo justamente para
 * que isso seja conferivel.
 *
 * # O que este caso NAO faz
 *
 * Ele **nao** concede nada e **nao** conhece papel: devolve o nome da capacidade
 * primitiva que a pergunta passa a exigir, e quem compara e
 * `decisao-de-capacidade.ts`. A consequencia e `CA-8.3`, e ela e consequencia e
 * nao codigo — ver {@link papeisQueConcedemPoderDePrivacidade}.
 *
 * E ele **nao** trata a pagina de politica de privacidade (`CA-8.4`): aquele ramo
 * nao **pergunta** por `manage_privacy_options`, ele **soma** o que a traducao
 * dela devolveu (`array_merge( $caps, map_meta_cap( 'manage_privacy_options',
 * $user_id ) )`, `capabilities.php:180` ao apagar e `:283` ao editar), e ja esta
 * no ramo 7 de `casoDeConteudo()`. Ver o `index.ts` desta pasta.
 */

import {
  CAPACIDADE_DE_PRIVACIDADE,
  capacidadesDePrivacidade,
  papeisQueConcedem,
  type Capacidade,
  type CasoDeTraducao,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';

/**
 * `export_others_personal_data` — exportar o dado pessoal **de outra pessoa**.
 *
 * E o portao da tela de exportacao (`wp-admin/export-personal-data.php:12`), do
 * item de menu que leva a ela (`wp-admin/menu.php:396`) e da operacao nomeada que
 * a tela chama por requisicao assincrona
 * (`wp-admin/includes/ajax-actions.php:4996`).
 */
export const CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO: Capacidade =
  'export_others_personal_data';

/**
 * `erase_others_personal_data` — apagar o dado pessoal **de outra pessoa**.
 *
 * ⚠️ Nos dois portoes que a pedem ela **nao vem sozinha**: vem somada a
 * `delete_users` (`wp-admin/erase-personal-data.php:12` e
 * `wp-admin/includes/ajax-actions.php:5187`). A soma e das telas e nao deste
 * `case`, e por isso ela esta em `permissao-nas-telas-de-dado-pessoal.ts`.
 */
export const CAPACIDADE_DE_APAGAR_DADO_DE_TERCEIRO: Capacidade =
  'erase_others_personal_data';

/**
 * `manage_privacy_options` — administrar a configuracao de privacidade.
 *
 * **Reexportada**, nao redeclarada: a cadeia vive em
 * `plataforma/autorizacao/traducao-de-conteudo.ts` desde T017 da feature `001`,
 * porque o ramo da pagina de politica precisa dela. Duas declaracoes do mesmo
 * nome sao duas chances de ele divergir.
 */
export const CAPACIDADE_DE_ADMINISTRAR_PRIVACIDADE: Capacidade =
  CAPACIDADE_DE_PRIVACIDADE;

/**
 * As **duas** capacidades sobre dado pessoal de terceiro, na ordem do legado.
 *
 * Separadas das tres porque sao estas duas que `D4` nomeia no titulo —
 * *"exportar ou apagar dados de terceiro"* — e sao elas, e nao a terceira, que a
 * historia US-8 poe lado a lado com a de administrar a configuracao.
 */
export const CAPACIDADES_DE_DADO_PESSOAL_DE_TERCEIRO: readonly Capacidade[] =
  Object.freeze([
    CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO,
    CAPACIDADE_DE_APAGAR_DADO_DE_TERCEIRO,
  ]);

/**
 * Os **tres** rotulos do `case`, na ordem em que o legado os escreve
 * (`capabilities.php:795` a `:797`).
 *
 * A ordem nao decide nada — o corpo e um so —, e esta preservada porque e a
 * ordem em que `CA-8.1` as lista e em que o catalogo (`UT-095-1`) as percorre.
 */
export const CAPACIDADES_DO_PODER_DE_PRIVACIDADE: readonly Capacidade[] =
  Object.freeze([
    ...CAPACIDADES_DE_DADO_PESSOAL_DE_TERCEIRO,
    CAPACIDADE_DE_ADMINISTRAR_PRIVACIDADE,
  ]);

/**
 * O caso de traducao: os tres rotulos caem no poder do nivel mais alto da
 * instalacao; todo o resto devolve `null`.
 *
 * `null` e *"nao e meu caso"*, `[]` e *"permitido"* e `['do_not_allow']` e
 * *"negado"* — os tres sao diferentes
 * (`plataforma/autorizacao/traducao-de-capacidade.ts`). Devolver `[]` aqui
 * abriria a exportacao de dado pessoal de terceiro para **qualquer** ator, que e
 * o oposto exato de `D4`.
 *
 * Sem este caso o `default:` da traducao devolveria o proprio nome pedido, e
 * **ninguem** passaria: os tres nomes nao estao em papel algum da matriz de
 * fabrica (ver {@link papeisQueConcedemPoderDePrivacidade}). Seria um sistema
 * mais fechado do que o legado, em que nem o administrador exporta dado pessoal.
 */
export const casoDePoderDePrivacidade: CasoDeTraducao = (pedido) => {
  if (!CAPACIDADES_DO_PODER_DE_PRIVACIDADE.includes(pedido.capacidade)) {
    return null;
  }
  // `$caps[] = is_multisite() ? 'manage_network' : 'manage_options';` (`:798`),
  // na unica copia que o alvo tem dessa linha.
  return capacidadesDePrivacidade(pedido.emRede);
};

/**
 * Os papeis da matriz **gravada** que concedem algum dos tres nomes — `CA-8.3`.
 *
 * Numa instalacao de fabrica a resposta e a lista vazia, e isso e verificavel no
 * legado por ausencia: as rotinas de povoamento de `wp-admin/includes/schema.php`
 * (`populate_roles_160()` a `populate_roles_300()`) nao concedem nenhum dos tres
 * a papel algum, e o censo do nome inteiro na arvore so o encontra em portao de
 * tela, item de menu e no `case` deste arquivo — nunca num `add_cap()`.
 *
 * **Por que isto e funcao e nao constante `false`.** `PERM-13` e o ADR-0001 poem
 * a matriz como **dado gravado**: *"a definicao de papel e um retrato tirado na
 * instalacao, e depois disso o dado gravado e a verdade enquanto o codigo deixa
 * de ser"*. Uma extensao que chame `add_cap()` com um destes nomes passa a
 * conceder — e, no legado, isso **nao** muda a decisao, porque a traducao troca o
 * nome pedido antes da comparacao e o nome concedido nunca e consultado.
 * Afirmar `CA-8.3` como constante no codigo congelaria o retrato; afirma-lo como
 * pergunta sobre a matriz recebida reproduz o legado e deixa o teste conferir a
 * matriz de fabrica, que e o que `CA-8.3` diz com as palavras *"por padrao"*.
 */
export function papeisQueConcedemPoderDePrivacidade(
  matriz: MatrizDePapeis,
): readonly string[] {
  const encontrados: string[] = [];
  for (const capacidade of CAPACIDADES_DO_PODER_DE_PRIVACIDADE) {
    for (const papel of papeisQueConcedem(matriz, capacidade)) {
      if (!encontrados.includes(papel)) {
        encontrados.push(papel);
      }
    }
  }
  return encontrados;
}
