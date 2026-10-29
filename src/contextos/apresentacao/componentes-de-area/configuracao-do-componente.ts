/**
 * A configuracao de cada componente — a opcao `widget_{id_base}`, uma por tipo,
 * com as instancias por numero.
 *
 * Entrega de **T015** da feature `009-apresentacao-e-personalizacao` —
 * **CA-7.2**, *"A configuracao de cada componente e o mapa de areas ficam
 * gravados como configuracao do site"*.
 *
 * | metodo do legado | ancora | aqui |
 * |---|---|---|
 * | `WP_Widget::get_settings()` | `wp-includes/class-wp-widget.php:611` | {@link lerConfiguracoes} |
 * | `WP_Widget::save_settings()` | `wp-includes/class-wp-widget.php:599` | {@link gravarConfiguracoes} |
 * | `WP_Widget::update_callback()` | `wp-includes/class-wp-widget.php:411` | {@link atualizarConfiguracao} |
 *
 * ## A forma do valor
 *
 * Arranjo no formato nativo do PHP, chave = numero da instancia, valor = a
 * instancia que o `update()` do tipo devolveu, e **no fim** a chave
 * `_multiwidget` com o inteiro `1`. A posicao de `_multiwidget` e consequencia
 * da leitura: `get_settings()` a tira (`:637`), e `save_settings()` a poe de
 * novo depois de tudo (`:600`) — logo instancia nova entra **antes** dela.
 *
 * ⚠️ **Ler pode gravar.** Quando a opcao do tipo nao existe, `get_settings()`
 * grava `array( '_multiwidget' => 1 )` na hora (`:615`-`:626`), *"so it can be
 * autoloaded next time"*. No legado isso acontece no arranque, quando cada tipo
 * se registra; aqui acontece na primeira leitura, e o comando e o mesmo.
 *
 * ⚠️ **Nao portado: `wp_convert_widget_settings()`** (`wp-includes/widgets.php:1141`),
 * que `get_settings()` chama quando a opcao tem instancias **sem**
 * `_multiwidget` (`:632`-`:635`) — o formato de antes da versao 2.8. Em
 * instalacao nova (resposta 2: nada a migrar) o estado nao e alcancavel pelo
 * nucleo: toda escrita de `widget_*` passa por `save_settings()`, que grava a
 * chave. A leitura aqui devolve as instancias como estao. Quem precisar do
 * formato antigo porta a funcao inteira — os dois ramos, painel e site
 * publico, que escrevem coisas diferentes.
 */

import {
  inteiro,
  normalizarChaveDeTexto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import type { RepositorioDeOpcoes } from '../armazenamento/index.js';
import {
  arranjoParaEditar,
  atribuirNaChave,
  atribuirNaChaveExata,
  inteiroNoPhp,
  textoNoPhp,
  tirarChave,
  valorDoArranjo,
  valorNaChaveExata,
  verdadeiroNoPhp,
} from './arranjo-do-php.js';
import type {
  ComponenteRegistrado,
  FormularioDoComponente,
  TipoDeComponente,
} from './contexto-dos-componentes.js';

/** O prefixo da opcao de cada tipo (`class-wp-widget.php:172`). */
export const PREFIXO_DA_OPCAO_DO_COMPONENTE = 'widget_';

/** `widget_{id_base}`. */
export function opcaoDoComponente(idBase: string): string {
  return `${PREFIXO_DA_OPCAO_DO_COMPONENTE}${idBase}`;
}

/** A marca do formato de varias instancias. */
export const CHAVE_DE_VARIAS_INSTANCIAS = '_multiwidget';

/** O numero-modelo do formulario de componente novo, que a leitura descarta. */
export const CHAVE_DO_MODELO_DE_INSTANCIA = '__i__';

/**
 * Os pontos de extensao desta area, declarados no arquivo que os emitiria. O
 * barramento (REQ-162) esta em `do-not-rewrite.md`.
 */
export const PONTOS_DE_EXTENSAO_DA_CONFIGURACAO = {
  /** `class-wp-widget.php:476` — pode devolver `false` e impedir a gravacao. */
  aoAtualizar: 'widget_update_callback',
  /** `wp-admin/widgets-form.php:169` e `class-wp-rest-widgets-controller.php:418`. */
  aoApagar: 'delete_widget',
} as const;

/**
 * `WP_Widget::save_settings()` (`class-wp-widget.php:599`): poe
 * `_multiwidget => 1` e grava com `update_option()`.
 */
export function gravarConfiguracoes(
  opcoes: Pick<RepositorioDeOpcoes, 'gravar'>,
  idBase: string,
  configuracoes: ValorPhp,
): boolean {
  const edicao = arranjoParaEditar(configuracoes);
  atribuirNaChave(edicao, CHAVE_DE_VARIAS_INSTANCIAS, inteiro(1));
  return opcoes.gravar(opcaoDoComponente(idBase), valorDoArranjo(edicao));
}

/**
 * `WP_Widget::get_settings()` (`class-wp-widget.php:611`): as instancias do
 * tipo, sem `_multiwidget` e sem `__i__`.
 *
 * Opcao ausente e gravada na hora com o que houver na opcao alternativa
 * (`get_option( $alt, array() )`, que depois e apagada) — ou vazia.
 */
export function lerConfiguracoes(
  opcoes: Pick<RepositorioDeOpcoes, 'ler' | 'lerComoNoLegado' | 'gravar' | 'apagar'>,
  tipo: Pick<TipoDeComponente, 'idBase' | 'opcaoAlternativa'>,
): ValorPhp {
  let configuracoes = opcoes.lerComoNoLegado(opcaoDoComponente(tipo.idBase));

  if (configuracoes.tipo === 'booleano' && !configuracoes.valor) {
    configuracoes = { tipo: 'arranjo', entradas: [] };
    if (tipo.opcaoAlternativa !== undefined) {
      configuracoes = opcoes.ler(tipo.opcaoAlternativa) ?? {
        tipo: 'arranjo',
        entradas: [],
      };
      opcoes.apagar(tipo.opcaoAlternativa);
    }
    gravarConfiguracoes(opcoes, tipo.idBase, configuracoes);
  }

  const edicao = arranjoParaEditar(configuracoes);
  tirarChave(edicao, normalizarChaveDeTexto(CHAVE_DE_VARIAS_INSTANCIAS));
  tirarChave(edicao, normalizarChaveDeTexto(CHAVE_DO_MODELO_DE_INSTANCIA));
  return valorDoArranjo(edicao);
}

/** O que `update_callback()` fez. */
export type DesfechoDaAtualizacao =
  /** Gravou as instancias (`save_settings()` rodou). */
  | 'gravou'
  /** Saiu antes de gravar: o formulario nao era deste tipo (`:426`, `:443`). */
  | 'ignorou';

/**
 * `WP_Widget::update_callback()` (`class-wp-widget.php:411`), sobre o
 * formulario que a superficie montou.
 *
 * | ramo | quando | o que faz |
 * |---|---|---|
 * | apagar | `delete_widget` verdadeiro | tira a instancia **so** se `the-widget-id` esta registrado com um numero cujo `{id_base}-{numero}` e ele mesmo (`:421`-`:435`); sem `the-widget-id`, sai sem gravar |
 * | configurar | `widget-{id_base}` e arranjo | roda o `update()` do tipo sobre a **primeira** entrada e so nela (`break`, `:482`) |
 * | componente novo sem campos | `id_base` igual ao do tipo | o mesmo, com instancia vazia no numero `multi_number` ou `widget_number` (`:439`-`:441`) |
 * | nenhum dos tres | — | sai sem gravar |
 *
 * ⚠️ **Apagar grava mesmo quando nao tirou nada**, porque `save_settings()`
 * roda no fim do metodo; e `update_option()` so nao escreve quando o valor e
 * identico ao gravado.
 *
 * ⚠️ **A trava `$this->updated`** (`:417`-`:419`, `:487`), que impede o mesmo
 * tipo de gravar duas vezes na mesma requisicao, nao e reproduzida: cada
 * operacao desta tarefa e uma requisicao, e a superficie programatica a
 * desliga de proposito depois de cada gravacao
 * (`class-wp-rest-widgets-controller.php:641`).
 */
export function atualizarConfiguracao(
  opcoes: Pick<RepositorioDeOpcoes, 'ler' | 'lerComoNoLegado' | 'gravar' | 'apagar'>,
  tipo: TipoDeComponente,
  componentesRegistrados: readonly ComponenteRegistrado[],
  formulario: FormularioDoComponente,
): DesfechoDaAtualizacao {
  const instancias = arranjoParaEditar(lerConfiguracoes(opcoes, tipo));

  if (verdadeiroNoPhp(formulario['delete_widget'])) {
    const campo = formulario['the-widget-id'];
    if (campo === undefined) {
      return 'ignorou';
    }
    const idApagado = textoNoPhp(campo);
    const registrado = componentesRegistrados.find(
      (componente) => componente.id === idApagado,
    );
    if (
      registrado !== undefined &&
      `${tipo.idBase}-${String(registrado.numero)}` === idApagado
    ) {
      tirarChave(instancias, { tipo: 'inteiro', valor: registrado.numero });
    }
  } else {
    const doTipo = formulario[`widget-${tipo.idBase}`];
    let configuracoes: ValorPhp;
    if (doTipo !== undefined && doTipo.tipo === 'arranjo') {
      configuracoes = doTipo;
    } else if (
      formulario['id_base'] !== undefined &&
      formulario['id_base'].tipo === 'texto' &&
      textoNoPhp(formulario['id_base']) === tipo.idBase
    ) {
      const numero = verdadeiroNoPhp(formulario['multi_number'])
        ? inteiroNoPhp(formulario['multi_number'])
        : inteiroNoPhp(formulario['widget_number']);
      configuracoes = {
        tipo: 'arranjo',
        entradas: [
          {
            chave: { tipo: 'inteiro', valor: numero },
            valor: { tipo: 'arranjo', entradas: [] },
          },
        ],
      };
    } else {
      return 'ignorou';
    }

    const primeira =
      configuracoes.tipo === 'arranjo' ? configuracoes.entradas[0] : undefined;
    if (primeira !== undefined) {
      // `$all_instances[ $number ] ?? array()`: `??` trata `null` como ausente.
      const gravada = valorNaChaveExata(instancias, primeira.chave);
      const antiga: ValorPhp =
        gravada === undefined || gravada.tipo === 'nulo'
          ? { tipo: 'arranjo', entradas: [] }
          : gravada;
      const instancia = tipo.atualizar(primeira.valor, antiga);
      // `if ( false !== $instance )` (`:478`): o `update()` que devolve `false`
      // cancela a gravacao desta instancia — e so dela; o resto e regravado.
      if (!(instancia.tipo === 'booleano' && !instancia.valor)) {
        atribuirNaChaveExata(instancias, primeira.chave, instancia);
      }
    }
  }

  gravarConfiguracoes(opcoes, tipo.idBase, valorDoArranjo(instancias));
  return 'gravou';
}

