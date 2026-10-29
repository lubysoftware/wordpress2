/**
 * O mapa de areas — a opcao `sidebars_widgets`, que diz que componente esta em
 * que area, e na ordem.
 *
 * Entrega de **T015** da feature `009-apresentacao-e-personalizacao` —
 * **CA-7.2**, *"A configuracao de cada componente e o mapa de areas ficam
 * gravados como configuracao do site"*, e a regra *"Componente e area vivem em
 * configuracao do site, nao em tabela propria"*.
 *
 * | funcao do legado | ancora | aqui |
 * |---|---|---|
 * | `wp_get_sidebars_widgets()` | `wp-includes/widgets.php:1021` | {@link lerMapaDeAreas} |
 * | `wp_set_sidebars_widgets()` | `wp-includes/widgets.php:1094` | {@link gravarMapaDeAreas} |
 * | `wp_get_widget_defaults()` | `wp-includes/widgets.php:1117` | {@link mapaPadrao} |
 * | `wp_get_sidebar()` | `wp-includes/widgets.php:1066` | {@link areaRegistrada} |
 * | `_get_widget_id_base()` | `wp-includes/widgets.php:1282` | {@link idBaseDoComponente} |
 * | `wp_parse_widget_id()` | `wp-includes/widgets.php:1932` | {@link decomporIdDoComponente} |
 * | `wp_find_widgets_sidebar()` | `wp-includes/widgets.php:1954` | {@link areaDoComponente} |
 * | `wp_assign_widget_to_sidebar()` | `wp-includes/widgets.php:1974` | {@link atribuirComponenteAArea} |
 *
 * ## A forma do valor, que e o que a paridade compara
 *
 * Um arranjo serializado no formato nativo do PHP (nao JSON), numa linha de
 * `options`: cada chave e o identificador de uma area, cada valor e a lista
 * dos identificadores de componente, e no fim a chave `array_version` com o
 * inteiro `3`, que `wp_set_sidebars_widgets()` acrescenta quando falta e
 * `wp_get_sidebars_widgets()` tira na leitura. A area de inativos tem
 * identificador fixo, `wp_inactive_widgets`.
 *
 * ⚠️ **Nenhuma funcao daqui confere capacidade**, e isso e o legado: quem
 * confere e a tela, o controlador da superficie programatica e a configuracao
 * da personalizacao (`permissao-dos-componentes.ts`).
 *
 * ⚠️ **O filtro `sidebars_widgets`** (`widgets.php:1053`), aplicado na leitura,
 * e ponto de extensao; o barramento (REQ-162) esta em `do-not-rewrite.md`, e o
 * nome fica declarado aqui. A leitura sai pelo ramo do **painel** — a opcao
 * relida a cada chamada (`:1039`-`:1041`); o ramo do site publico guarda a
 * leitura num global (`:1032`-`:1037`), e e cache, nao regra.
 */

import {
  inteiro,
  normalizarChaveDeTexto,
  texto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import type { RepositorioDeOpcoes } from '../armazenamento/index.js';
import {
  anexar,
  arranjoParaEditar,
  atribuirNaChave,
  chaveComoTexto,
  chaveIdenticaAoTexto,
  tirarChave,
  valorDoArranjo,
  valorIdenticoAoTexto,
  valorNaChave,
} from './arranjo-do-php.js';
import type { AreaRegistrada } from './contexto-dos-componentes.js';

/** A opcao do mapa de areas. */
export const OPCAO_DO_MAPA_DE_AREAS = 'sidebars_widgets';

/** O identificador fixo da area de inativos (`wp-includes/widgets.php:1075`-`:1080`). */
export const AREA_DE_INATIVOS = 'wp_inactive_widgets';

/** A chave de versao que viaja dentro do mapa gravado. */
export const CHAVE_DA_VERSAO_DO_MAPA = 'array_version';

/** O valor que `wp_set_sidebars_widgets()` poe nela (`widgets.php:1100`-`:1102`). */
export const VERSAO_DO_MAPA = 3;

/** `__( 'Inactive widgets' )` — o nome que `wp_get_sidebar()` da aos inativos (`:1078`). */
export const NOME_DA_AREA_DE_INATIVOS = 'Inactive widgets';

/**
 * `wp_get_sidebars_widgets()` (`widgets.php:1021`), no ramo do painel:
 * `get_option( 'sidebars_widgets', array() )` sem a chave de versao.
 *
 * O padrao e o arranjo vazio **so quando a linha nao existe** — um `false`
 * gravado volta `false`, que as operacoes tratam como lista vazia, como o
 * `foreach` do legado.
 */
export function lerMapaDeAreas(
  opcoes: Pick<RepositorioDeOpcoes, 'ler'>,
): ValorPhp {
  const gravado = opcoes.ler(OPCAO_DO_MAPA_DE_AREAS);
  if (gravado === null) {
    return { tipo: 'arranjo', entradas: [] };
  }
  if (gravado.tipo !== 'arranjo') {
    return gravado;
  }
  const mapa = arranjoParaEditar(gravado);
  tirarChave(mapa, normalizarChaveDeTexto(CHAVE_DA_VERSAO_DO_MAPA));
  return valorDoArranjo(mapa);
}

/**
 * `wp_set_sidebars_widgets()` (`widgets.php:1094`): acrescenta `array_version
 * => 3` **no fim** quando falta e grava com `update_option()`, sem pedido de
 * carga automatica.
 *
 * `isset()` e falso tambem para a chave com `null`, e ai ela e substituida no
 * lugar — e a regra do `$a[ $k ] = $v`.
 */
export function gravarMapaDeAreas(
  opcoes: Pick<RepositorioDeOpcoes, 'gravar'>,
  mapa: ValorPhp,
): boolean {
  const edicao = arranjoParaEditar(mapa);
  const versao = valorNaChave(edicao, CHAVE_DA_VERSAO_DO_MAPA);
  if (versao === undefined || versao.tipo === 'nulo') {
    atribuirNaChave(edicao, CHAVE_DA_VERSAO_DO_MAPA, inteiro(VERSAO_DO_MAPA));
  }
  return opcoes.gravar(OPCAO_DO_MAPA_DE_AREAS, valorDoArranjo(edicao));
}

/**
 * `wp_get_widget_defaults()` (`widgets.php:1117`): uma lista vazia para cada
 * area registrada, na ordem do registro. E o que a tela usa quando o mapa
 * gravado e vazio (`wp-admin/widgets-form.php:78`-`:80`).
 */
export function mapaPadrao(areas: readonly AreaRegistrada[]): ValorPhp {
  const mapa = arranjoParaEditar(undefined);
  for (const area of areas) {
    atribuirNaChave(mapa, area.id, { tipo: 'arranjo', entradas: [] });
  }
  return valorDoArranjo(mapa);
}

/**
 * `wp_get_sidebar()` (`widgets.php:1066`): a area registrada, a de inativos
 * mesmo sem registro, ou `null`.
 */
export function areaRegistrada(
  areas: readonly AreaRegistrada[],
  id: string,
): AreaRegistrada | null {
  const achada = areas.find((area) => area.id === id);
  if (achada !== undefined) {
    return achada;
  }
  if (id === AREA_DE_INATIVOS) {
    return { id: AREA_DE_INATIVOS, nome: NOME_DA_AREA_DE_INATIVOS };
  }
  return null;
}

/** `_get_widget_id_base()` (`widgets.php:1282`): tira o `-N` final. */
export function idBaseDoComponente(id: string): string {
  return id.replace(/-[0-9]+$/, '');
}

/** O que `wp_parse_widget_id()` devolve. */
export interface IdDoComponenteDecomposto {
  readonly idBase: string;
  /** Ausente no componente antigo, de instancia unica. */
  readonly numero?: number;
}

/**
 * `wp_parse_widget_id()` (`widgets.php:1932`): `^(.+)-(\d+)$`, guloso — em
 * `a-2-3` a base e `a-2`.
 */
export function decomporIdDoComponente(id: string): IdDoComponenteDecomposto {
  const achado = /^(.+)-(\d+)$/s.exec(id);
  if (achado === null) {
    return { idBase: id };
  }
  return { idBase: achado[1] ?? id, numero: Number(achado[2]) };
}

/**
 * `wp_find_widgets_sidebar()` (`widgets.php:1954`): a primeira area cuja lista
 * tem o componente, por identidade estrita, ou `null`. Le o mapa de novo, como
 * o legado.
 */
export function areaDoComponente(
  opcoes: Pick<RepositorioDeOpcoes, 'ler'>,
  idDoComponente: string,
): string | null {
  const mapa = lerMapaDeAreas(opcoes);
  if (mapa.tipo !== 'arranjo') {
    return null;
  }
  for (const area of mapa.entradas) {
    if (area.valor.tipo !== 'arranjo') {
      continue;
    }
    if (
      area.valor.entradas.some((entrada) =>
        valorIdenticoAoTexto(entrada.valor, idDoComponente),
      )
    ) {
      return chaveComoTexto(area.chave);
    }
  }
  return null;
}

/**
 * `wp_assign_widget_to_sidebar()` (`widgets.php:1974`).
 *
 * Tres coisas que o legado faz e que um porte "arruma":
 *
 * 1. de cada **outra** area tira so a **primeira** ocorrencia (`continue 2`,
 *    `:1979`-`:1982`);
 * 2. na area de destino **nao tira nada** — e por isso que atribuir o
 *    componente a area em que ele ja esta o **duplica** (`:1987`-`:1989`);
 * 3. area vazia (`''` ou `'0'`, o que `if ( $sidebar_id )` recusa) nao recebe
 *    nada: e assim que apagar de vez tira o componente de toda area.
 */
export function atribuirComponenteAArea(
  opcoes: Pick<RepositorioDeOpcoes, 'ler' | 'gravar'>,
  idDoComponente: string,
  idDaArea: string,
): boolean {
  const lido = lerMapaDeAreas(opcoes);
  const mapa = arranjoParaEditar(lido);

  for (let i = 0; i < mapa.entradas.length; i++) {
    const area = mapa.entradas[i];
    if (area === undefined || area.valor.tipo !== 'arranjo') {
      continue;
    }
    if (chaveIdenticaAoTexto(area.chave, idDaArea)) {
      continue;
    }
    const lista = arranjoParaEditar(area.valor);
    const ocorrencia = lista.entradas.find((entrada) =>
      valorIdenticoAoTexto(entrada.valor, idDoComponente),
    );
    if (ocorrencia === undefined) {
      continue;
    }
    tirarChave(lista, ocorrencia.chave);
    mapa.entradas[i] = { chave: area.chave, valor: valorDoArranjo(lista) };
  }

  if (idDaArea !== '' && idDaArea !== '0') {
    const lista = arranjoParaEditar(valorNaChave(mapa, idDaArea));
    anexar(lista, texto(idDoComponente));
    atribuirNaChave(mapa, idDaArea, valorDoArranjo(lista));
  }

  return gravarMapaDeAreas(opcoes, valorDoArranjo(mapa));
}
