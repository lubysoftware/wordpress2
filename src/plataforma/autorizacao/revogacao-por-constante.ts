/**
 * As quatro constantes que **retiram** poder de quem ja o tem — `PERM-8`
 * (BR-MIGRAR-094).
 *
 * A regra, na letra: *"quatro constantes retiram poder de quem ja o tem,
 * inclusive administrador e super admin: `DISALLOW_UNFILTERED_HTML`,
 * `DISALLOW_FILE_EDIT`, `DISALLOW_FILE_MODS`, e a inversa
 * `ALLOW_UNFILTERED_UPLOADS` (sem ela, `unfiltered_upload` e sempre negada mesmo
 * a quem a tem concedida). **E o unico mecanismo do sistema que funciona
 * assim.**"*
 *
 * E a nota de compatibilidade da propria regra e o motivo deste arquivo existir
 * separado: *"revogacao que vence concessao exige ordem de avaliacao declarada no
 * alvo — **nao pode ser 'mais um filtro'**"*. No legado isto sao `case`s de
 * `map_meta_cap()` (`capabilities.php:587`-`:652`), logo a revogacao acontece
 * **antes** de qualquer consulta a papel: a capacidade pedida nem chega a ser
 * procurada no ator, porque o que se procura passa a ser `do_not_allow`, que
 * ninguem pode ter. ADR-0009 poe estas quatro na familia *"declaracao do dono do
 * servidor"* e cita o comentario categorico do legado: *"even admins and super
 * admins"*.
 *
 * ## Os valores de fabrica, e o unico que tem efeito de fabrica
 *
 * O **P6** da constituicao manda portar todo numero e toda chave de configuracao
 * *"com o valor de fabrica do legado e o ponto de configuracao que o altera em
 * execucao"*, e BR-MIGRAR-094 diz qual e o valor de fabrica: *"P1 manda portar
 * pelo valor de fabrica (todas indefinidas) nomeando o ponto que as altera"*.
 *
 * Tres delas, indefinidas, **nao revogam nada**. A quarta e inversa e por isso
 * tem efeito ja de fabrica: sem `ALLOW_UNFILTERED_UPLOADS`, `unfiltered_upload`
 * e negada a todos — UC-12 e literal, *"e a unica capacidade cuja concessao
 * depende de uma constante existir"*, e e a razao de a matriz de fabrica conceder
 * `unfiltered_upload` ao administrador sem que isso o autorize a nada.
 *
 * ## 🔴 O que este arquivo NAO porta dos mesmos `case`s, e por que
 *
 * No legado, os mesmos `case` que leem estas constantes carregam **tambem** o
 * recorte de rede de `PERM-10` (BR-MIGRAR-096): *"em rede, o administrador de um
 * site e um editor com configuracao: mantem conteudo, comentario e opcoes do site
 * e **perde arquivo, extensao, identidade, idioma e HTML bruto**"* — ou seja, as
 * mesmas capacidades viram `do_not_allow` para quem **nao** e super administrador
 * numa instalacao de rede (`capabilities.php:613` e `:673`; BR-MIGRAR-008 repete
 * para `unfiltered_html`: *"e a todo nao-super-admin em multisite"*).
 *
 * **Esse recorte nao esta aqui, e nao e esquecimento.** Ele e a unica regra desta
 * area com confianca 🟡 — a propria regra diz *"o recorte e inferido, migra com
 * aviso para validacao"* — e o pacote **nao enumera** quais capacidades ele
 * alcanca. Inventar a enumeracao seria inventar dado que a analise nao traz;
 * `tasks.md` nao da a nenhuma tarefa desta feature o recorte de rede, e
 * `target_domain_model.md` o atribui a `VO-Papel` **em rede**. Fica nomeado para
 * quem portar multisite, com a consequencia declarada: enquanto ele nao entrar,
 * uma instalacao de rede e, nestes nomes, **mais aberta** que o legado para o
 * administrador de site. Registrar e o que o P4 pede; decidir sozinho seria o que
 * ele proibe.
 *
 * ## A proveniencia de cada lista, nome por nome
 *
 * Nenhum nome aqui foi deduzido de habito: cada lista aponta para onde o pacote a
 * declara. Onde o pacote descreve a **familia** sem enumerar os nomes, a
 * enumeracao esta marcada como tal — e fecha contra o oraculo executavel
 * (`ESC-ORACULO`, BR-MIGRAR-116), que nesta arvore nao existe.
 */

import { CAPACIDADE_NEGADA, type Capacidade } from './capacidade.js';
import type { CasoDeTraducao, PedidoDeTraducao } from './traducao-de-capacidade.js';

/**
 * As quatro constantes, com o nome do legado preservado.
 *
 * **Os nomes nao sao traduzidos de proposito.** O **P8** poe constante publicada
 * no contrato publico — *"nao remova funcao, constante, tabela, rota, superficie
 * nem comportamento publicado"* —, e quem define estas quatro escreve o nome
 * delas no arquivo de configuracao da instalacao. Traduzir o nome aqui tornaria
 * ineficaz toda instrucao de instalacao que existe hoje.
 *
 * Ausente e o valor de fabrica. O legado testa `defined(X) && X`, logo `false`
 * tambem **nao** revoga: e isso que {@link constanteLigada} reproduz.
 */
export interface ConstantesDoServidor {
  readonly DISALLOW_UNFILTERED_HTML?: boolean;
  readonly DISALLOW_FILE_EDIT?: boolean;
  readonly DISALLOW_FILE_MODS?: boolean;
  readonly ALLOW_UNFILTERED_UPLOADS?: boolean;
}

/** O valor de fabrica: as quatro indefinidas. */
export const CONSTANTES_DE_FABRICA: ConstantesDoServidor = {};

/** `defined( X ) && X` — ausente e `false` dao no mesmo. */
function constanteLigada(valor: boolean | undefined): boolean {
  return valor === true;
}

/**
 * `unfiltered_html` — BR-MIGRAR-008 (`P8`), nome dado pela propria regra:
 * *"a capacidade e negada a todos (inclusive super admin) se
 * `DISALLOW_UNFILTERED_HTML` estiver definida"*.
 */
const CAPACIDADE_DE_HTML_BRUTO: Capacidade = 'unfiltered_html';

/**
 * `unfiltered_upload` — UC-12, exceção *"tipo de arquivo nao permitido"*:
 * *"`unfiltered_upload` contorna o filtro, mas e sempre `do_not_allow` a menos
 * que `ALLOW_UNFILTERED_UPLOADS` esteja definida"*.
 */
const CAPACIDADE_DE_ENVIO_SEM_FILTRO: Capacidade = 'unfiltered_upload';

/**
 * As capacidades de **editar arquivo** da instalacao.
 *
 * ⚠️ **Enumeracao desta tarefa, nao do pacote.** ADR-0009 nomeia a constante e a
 * familia (*"declaracao do dono do servidor"*, `capabilities.php:588`-`:652`) e
 * `target_screens.md` confirma `edit_plugins` e `edit_themes` como capacidade
 * exigida de tela; `edit_files` esta na matriz de fabrica desde a primeira rotina
 * de povoamento. Nenhum documento deste pacote lista os tres juntos como o
 * alcance de `DISALLOW_FILE_EDIT`. Fecha contra o oraculo.
 */
const CAPACIDADES_DE_EDICAO_DE_ARQUIVO: readonly Capacidade[] = [
  'edit_files',
  'edit_plugins',
  'edit_themes',
];

/**
 * As capacidades de **criar, atualizar e apagar** extensao, tema e nucleo.
 *
 * Esta lista vem do pacote: UC-33 (*"`DISALLOW_FILE_MODS` definida | todas as
 * capacidades de instalar, atualizar e apagar extensao **e nucleo** viram
 * `do_not_allow`, para todos"*) e UC-32 (a mesma frase para tema). Os nomes sao
 * os que UC-33 e `target_screens.md` exigem nas telas correspondentes —
 * inclusive `upload_plugins` e `upload_themes`, que UC-33 declara resolverem para
 * as de instalar.
 */
const CAPACIDADES_DE_MODIFICACAO_DE_ARQUIVO: readonly Capacidade[] = [
  'install_plugins',
  'update_plugins',
  'delete_plugins',
  'upload_plugins',
  'install_themes',
  'update_themes',
  'delete_themes',
  'upload_themes',
  'update_core',
];

/**
 * A tabela declarada: qual constante alcanca quais capacidades.
 *
 * Declarada como **dado** e nao como cadeia de `if` porque e ela que
 * {@link capacidadesAlcancadasPorConstante} devolve ao catalogo de CA-7.5: uma
 * capacidade que so existe para ser revogada tambem precisa estar declarada em
 * algum lugar, ou o catalogo a daria por desconhecida.
 *
 * `ALLOW_UNFILTERED_UPLOADS` nao entra nesta tabela: ela e a **inversa** — nao
 * revoga quando esta ligada, autoriza —, e o caso dela esta em
 * {@link revogacaoPorConstante}.
 */
const REVOGACOES: readonly {
  readonly constante: keyof ConstantesDoServidor;
  readonly capacidades: readonly Capacidade[];
}[] = [
  {
    constante: 'DISALLOW_UNFILTERED_HTML',
    capacidades: [CAPACIDADE_DE_HTML_BRUTO],
  },
  {
    constante: 'DISALLOW_FILE_EDIT',
    capacidades: CAPACIDADES_DE_EDICAO_DE_ARQUIVO,
  },
  {
    constante: 'DISALLOW_FILE_MODS',
    // A edicao de arquivo entra aqui tambem: no legado os `case` de editar caem
    // por `fall through` no bloco de modificar, logo `DISALLOW_FILE_MODS` nega
    // as duas familias e `DISALLOW_FILE_EDIT` nega so a primeira.
    capacidades: [
      ...CAPACIDADES_DE_EDICAO_DE_ARQUIVO,
      ...CAPACIDADES_DE_MODIFICACAO_DE_ARQUIVO,
    ],
  },
];

/**
 * Todo nome de capacidade que alguma destas quatro constantes alcanca.
 *
 * Serve ao catalogo de CA-7.5: estes nomes tem **origem declarada** mesmo quando
 * nao estao em papel algum — `upload_plugins` e `upload_themes` sao o caso.
 */
export function capacidadesAlcancadasPorConstante(): readonly Capacidade[] {
  const nomes = new Set<Capacidade>([CAPACIDADE_DE_ENVIO_SEM_FILTRO]);
  for (const revogacao of REVOGACOES) {
    for (const capacidade of revogacao.capacidades) {
      nomes.add(capacidade);
    }
  }
  return [...nomes];
}

/**
 * O caso de traducao das quatro constantes.
 *
 * Devolve `null` para toda capacidade que elas nao alcancam — e nesse caso a
 * consulta segue para os casos seguintes, exatamente como o `switch` do legado
 * segue para o `case` seguinte.
 */
export const revogacaoPorConstante: CasoDeTraducao = (
  pedido: PedidoDeTraducao,
) => {
  if (pedido.capacidade === CAPACIDADE_DE_ENVIO_SEM_FILTRO) {
    // A inversa: a concessao depende de a constante existir.
    return constanteLigada(pedido.constantes.ALLOW_UNFILTERED_UPLOADS)
      ? [CAPACIDADE_DE_ENVIO_SEM_FILTRO]
      : [CAPACIDADE_NEGADA];
  }

  for (const revogacao of REVOGACOES) {
    if (
      constanteLigada(pedido.constantes[revogacao.constante]) &&
      revogacao.capacidades.includes(pedido.capacidade)
    ) {
      return [CAPACIDADE_NEGADA];
    }
  }

  return null;
};
