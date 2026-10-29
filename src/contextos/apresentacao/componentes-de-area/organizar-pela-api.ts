/**
 * Organizar os componentes pela superficie programatica — os controladores de
 * areas (`/wp/v2/sidebars`) e de componentes (`/wp/v2/widgets`).
 *
 * Entrega de **T015** da feature `009-apresentacao-e-personalizacao` —
 * **CA-7.1** e **CA-7.3** (a segunda das tres superficies). UC-31, *"Pela API
 * REST"*: *"os controladores de widgets e de areas expoem a mesma estrutura;
 * cada rota tem seu `permission_callback`"*.
 *
 * | rota | metodo do legado | ancora | aqui |
 * |---|---|---|---|
 * | `POST/PUT /wp/v2/sidebars/{id}` | `WP_REST_Sidebars_Controller::update_item()` | `class-wp-rest-sidebars-controller.php:221` | {@link atualizarAreaPelaApi} |
 * | `POST /wp/v2/widgets` | `WP_REST_Widgets_Controller::create_item()` | `class-wp-rest-widgets-controller.php:250` | {@link criarComponentePelaApi} |
 * | `POST/PUT /wp/v2/widgets/{id}` | `WP_REST_Widgets_Controller::update_item()` | `class-wp-rest-widgets-controller.php:296` | {@link atualizarComponentePelaApi} |
 * | `DELETE /wp/v2/widgets/{id}` | `WP_REST_Widgets_Controller::delete_item()` | `class-wp-rest-widgets-controller.php:371` | {@link apagarComponentePelaApi} |
 *
 * O que estas operacoes devolvem e o **dado** da resposta — os identificadores
 * e o estado HTTP. O corpo desenhado (`prepare_item_for_response()`, com o
 * componente renderizado e o formulario) e da borda: a arvore nao monta HTML.
 * Os parametros chegam ja validados pelo esquema da rota, que e da borda
 * tambem; o unico padrao que muda comportamento aqui — `sidebar` vale
 * `wp_inactive_widgets` ao criar (`class-wp-rest-widgets-controller.php:831`)
 * — esta escrito em {@link criarComponentePelaApi}.
 *
 * 🔴 **`retrieve_widgets()` nao esta aqui, e e de T019** — como na tela. Atualizar
 * e apagar componente a chamam antes de procurar a area (`:309`-`:310`,
 * `:384`-`:385`); atualizar area **nao** a chama. Fora da tela a area de
 * inativos nao esta registrada, e por isso ela toma o ramo que remapeia
 * (`wp-includes/widgets.php:1351`-`:1381`), que so grava quando o mapa nao
 * esta na forma que ele produz: inativos primeiro, depois as areas na ordem do
 * registro, e nenhuma instancia registrada fora do mapa. E nessa forma que esta
 * tarefa se confere; o resto e de T019, com o achado em `../README.md`.
 *
 * ⚠️ **So tipo de classe.** O legado tambem aceita componente registrado por
 * funcao (`wp_register_widget_control()`), que tem `update_callback` sem objeto
 * de tipo; no nucleo nenhum e registrado assim — vem de extensao. Aqui o tipo e
 * sempre o objeto, e o erro que so o componente sem objeto alcanca —
 * *"Cannot set instance on a widget that does not extend WP_Widget"*
 * (`:563`-`:569`) — fica inalcancavel e nao foi escrito.
 */

import {
  arranjo,
  desserializar,
  lista,
  normalizarChaveDeTexto,
  texto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
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
  type ArranjoDoPhp,
} from './arranjo-do-php.js';
import { atualizarConfiguracao } from './configuracao-do-componente.js';
import type {
  AreaRegistrada,
  ContextoDosComponentes,
  FormularioDoComponente,
} from './contexto-dos-componentes.js';
import {
  AREA_DE_INATIVOS,
  areaDoComponente,
  areaRegistrada,
  atribuirComponenteAArea,
  decomporIdDoComponente,
  gravarMapaDeAreas,
  lerMapaDeAreas,
} from './mapa-de-areas.js';
import {
  permissaoDaApiDeComponentes,
  type ErroDaApiDeComponentes,
} from './permissao-dos-componentes.js';

/** `class-wp-rest-widgets-controller.php:549`. */
export const MENSAGEM_DE_TIPO_EXIGIDO = 'Widget type (id_base) is required.';

/** `class-wp-rest-widgets-controller.php:557`. */
export const MENSAGEM_DE_TIPO_QUE_NAO_GRAVA =
  'The provided widget type (id_base) cannot be updated.';

/** `class-wp-rest-widgets-controller.php:575`. */
export const MENSAGEM_DE_INSTANCIA_CRUA_RECUSADA =
  'Widget type does not support raw instances.';

/** `class-wp-rest-widgets-controller.php:585`. */
export const MENSAGEM_DE_INSTANCIA_MALFORMADA = 'The provided instance is malformed.';

/** `class-wp-rest-widgets-controller.php:593`. */
export const MENSAGEM_DE_INSTANCIA_INVALIDA =
  'The provided instance is invalid. Must contain raw OR encoded and hash.';

/** `class-wp-rest-widgets-controller.php:321`, `:393`. */
export const MENSAGEM_DE_COMPONENTE_NAO_ENCONTRADO = 'No widget was found with that id.';

/** O `instance` do pedido: crua, ou codificada com o resumo. */
export interface InstanciaNoPedido {
  /** `instance.raw` — o arranjo como o esquema da rota o entregou. */
  readonly crua?: ValorPhp;
  /** `instance.encoded` — a instancia serializada, em base64. */
  readonly codificada?: string;
  /** `instance.hash` — `wp_hash()` da instancia serializada. */
  readonly resumo?: string;
}

/** O pedido de gravar um componente — o que `save_widget()` le. */
export interface PedidoDeComponenteNaApi {
  /** `id` — o componente existente. */
  readonly id?: string;
  /** `id_base` — o tipo do componente novo. */
  readonly idBase?: string;
  /** `instance`. `null` e o parametro enviado vazio: conta como enviado e nao como definido. */
  readonly instancia?: InstanciaNoPedido | null;
  /** `form_data`, ja decomposto por `wp_parse_str()` no esquema da rota. */
  readonly dadosDoFormulario?: FormularioDoComponente;
  /** `sidebar`. */
  readonly area?: string;
}

/** O resultado de uma gravacao de componente: o dado da resposta. */
export type ResultadoDoComponenteNaApi =
  | {
      readonly ok: true;
      readonly status: 200 | 201;
      readonly id: string;
      /** A area em que o componente ficou; `null` quando nao esta em nenhuma. */
      readonly area: string | null;
      /** So ao apagar de vez: `deleted => true`. */
      readonly apagado?: true;
    }
  | { readonly ok: false; readonly erro: ErroDaApiDeComponentes };

/** O resultado de atualizar uma area. */
export type ResultadoDaAreaNaApi =
  | {
      readonly ok: true;
      /** `wp_get_sidebar()` — `null` quando a area nao esta registrada. */
      readonly area: AreaRegistrada | null;
    }
  | { readonly ok: false; readonly erro: ErroDaApiDeComponentes };

function erroInvalido(mensagem: string): ErroDaApiDeComponentes {
  return { codigo: 'rest_invalid_widget', mensagem, status: 400 };
}

function naoEncontrado(): ErroDaApiDeComponentes {
  return {
    codigo: 'rest_widget_not_found',
    mensagem: MENSAGEM_DE_COMPONENTE_NAO_ENCONTRADO,
    status: 404,
  };
}

/**
 * `WP_REST_Sidebars_Controller::update_item()`
 * (`class-wp-rest-sidebars-controller.php:221`-`:258`).
 *
 * Com `widgets` no pedido, a area passa a ter **exatamente** aquela lista; o
 * componente da lista sai de qualquer outra area, e o que estava na area e nao
 * veio na lista vai para os inativos — *"automatically removes omitted widget
 * IDs to the inactive sidebar"* (`:232`). As duas regras percorrem o mapa
 * **como estava** (o `foreach` do PHP itera a copia), e a chave anexada aos
 * inativos segue a proxima livre, que tirar uma entrada nao devolve.
 *
 * ⚠️ **A area nao precisa estar registrada.** Nada no metodo confere o
 * identificador: a lista e gravada, e a resposta vem com area `null`.
 */
export function atualizarAreaPelaApi(
  contexto: ContextoDosComponentes,
  pedido: { readonly id: string; readonly componentes?: readonly string[] },
): ResultadoDaAreaNaApi {
  const erro = permissaoDaApiDeComponentes(contexto);
  if (erro !== null) {
    return { ok: false, erro };
  }

  if (pedido.componentes !== undefined) {
    const pedidos = pedido.componentes;
    const mapa = arranjoParaEditar(lerMapaDeAreas(contexto.opcoes));
    const listas = new Map<string, ArranjoDoPhp>();
    const listaEmEdicao = (nome: string): ArranjoDoPhp => {
      let emEdicao = listas.get(nome);
      if (emEdicao === undefined) {
        emEdicao = arranjoParaEditar(valorNaChave(mapa, nome));
        listas.set(nome, emEdicao);
      }
      return emEdicao;
    };

    for (const area of [...mapa.entradas]) {
      if (area.valor.tipo !== 'arranjo') {
        continue;
      }
      const ehAPedida = chaveIdenticaAoTexto(area.chave, pedido.id);
      for (const entrada of area.valor.entradas) {
        const estaNoPedido = pedidos.some((id) =>
          valorIdenticoAoTexto(entrada.valor, id),
        );
        if (!ehAPedida && estaNoPedido) {
          tirarChave(listaEmEdicao(chaveComoTexto(area.chave)), entrada.chave);
        }
        if (ehAPedida && !estaNoPedido) {
          anexar(listaEmEdicao(AREA_DE_INATIVOS), entrada.valor);
        }
      }
    }

    for (const [nome, emEdicao] of listas) {
      atribuirNaChave(mapa, nome, valorDoArranjo(emEdicao));
    }
    atribuirNaChave(mapa, pedido.id, lista(pedidos.map((id) => texto(id))));
    gravarMapaDeAreas(contexto.opcoes, valorDoArranjo(mapa));
  }

  // `do_action( 'rest_save_sidebar', ... )` (`:256`) — ponto de extensao.
  return { ok: true, area: areaRegistrada(contexto.areasRegistradas, pedido.id) };
}

/** `preg_quote( $texto, '/' )`, para montar a expressao de `next_widget_id_number()`. */
function citadoParaExpressao(valor: string): string {
  return valor.replace(/[.\\+*?[^\]$(){}=!<>|:\-#/]/g, '\\$&');
}

/**
 * `next_widget_id_number()` (`wp-admin/includes/widgets.php:162`): o maior
 * numero registrado do tipo mais um, partindo de `1` — logo o primeiro
 * componente de um tipo e o `2`.
 *
 * ⚠️ A expressao nao e ancorada no inicio: `{base}-N$` tambem casa com o fim
 * de outro identificador (`outra-{base}-N`), e o numero dele conta.
 */
export function proximoNumeroDoComponente(
  contexto: Pick<ContextoDosComponentes, 'componentesRegistrados'>,
  idBase: string,
): number {
  const expressao = new RegExp(`${citadoParaExpressao(idBase)}-([0-9]+)$`);
  let numero = 1;
  for (const componente of contexto.componentesRegistrados) {
    const achado = expressao.exec(componente.id);
    if (achado !== null) {
      numero = Math.max(numero, Number(achado[1]));
    }
  }
  return numero + 1;
}

/**
 * `base64_decode()` sem o modo estrito: o que nao e do alfabeto e pulado.
 * O modo estrito, da personalizacao, esta em `organizar-pela-personalizacao.ts`.
 */
function decodificadoDeBase64(valor: string): Uint8Array {
  const limpo = valor.replace(/[^A-Za-z0-9+/]/g, '');
  return new Uint8Array(Buffer.from(limpo, 'base64'));
}

/**
 * `WP_REST_Widgets_Controller::save_widget()`
 * (`class-wp-rest-widgets-controller.php:526`-`:663`): o identificador gravado,
 * ou o erro.
 */
function gravarComponente(
  contexto: ContextoDosComponentes,
  pedido: PedidoDeComponenteNaApi,
  idDaArea: string | null,
): { readonly ok: true; readonly id: string } | { readonly ok: false; readonly erro: ErroDaApiDeComponentes } {
  let id: string;
  let idBase: string;
  let numero: number | undefined;

  if (pedido.id !== undefined) {
    const decomposto = decomporIdDoComponente(pedido.id);
    id = pedido.id;
    idBase = decomposto.idBase;
    numero = decomposto.numero;
  } else if (pedido.idBase !== undefined && pedido.idBase !== '' && pedido.idBase !== '0') {
    idBase = pedido.idBase;
    const doTipo = contexto.tipoDeComponente(idBase);
    numero = doTipo !== undefined ? proximoNumeroDoComponente(contexto, idBase) : undefined;
    id = numero !== undefined ? `${idBase}-${String(numero)}` : idBase;
  } else {
    return { ok: false, erro: erroInvalido(MENSAGEM_DE_TIPO_EXIGIDO) };
  }

  const tipo = contexto.tipoDeComponente(idBase);
  if (tipo === undefined) {
    return { ok: false, erro: erroInvalido(MENSAGEM_DE_TIPO_QUE_NAO_GRAVA) };
  }

  let formulario: FormularioDoComponente;
  if (pedido.instancia !== undefined && pedido.instancia !== null) {
    let instancia: ValorPhp;
    if (pedido.instancia.crua !== undefined) {
      if (!tipo.instanciaCruaPermitida) {
        return { ok: false, erro: erroInvalido(MENSAGEM_DE_INSTANCIA_CRUA_RECUSADA) };
      }
      instancia = pedido.instancia.crua;
    } else if (
      pedido.instancia.codificada !== undefined &&
      pedido.instancia.resumo !== undefined
    ) {
      const serializada = decodificadoDeBase64(pedido.instancia.codificada);
      if (contexto.resumir(serializada) !== pedido.instancia.resumo) {
        return { ok: false, erro: erroInvalido(MENSAGEM_DE_INSTANCIA_MALFORMADA) };
      }
      const lida = desserializar(serializada);
      // `unserialize()` que falha devolve `false`, e o legado segue com ele.
      instancia = lida.ok ? lida.valor : { tipo: 'booleano', valor: false };
    } else {
      return { ok: false, erro: erroInvalido(MENSAGEM_DE_INSTANCIA_INVALIDA) };
    }

    formulario = {
      [`widget-${idBase}`]: arranjo([
        {
          // `array( $number => $instance )`: sem numero, a chave `null` vira `''`.
          chave:
            numero !== undefined
              ? { tipo: 'inteiro', valor: numero }
              : normalizarChaveDeTexto(''),
          valor: instancia,
        },
      ]),
      sidebar: idDaArea === null ? { tipo: 'nulo' } : texto(idDaArea),
    };
  } else if (pedido.dadosDoFormulario !== undefined) {
    formulario = pedido.dadosDoFormulario;
  } else {
    formulario = {};
  }

  atualizarConfiguracao(contexto.opcoes, tipo, contexto.componentesRegistrados, formulario);
  // `do_action( 'rest_after_save_widget', ... )` (`:654`) — ponto de extensao.
  return { ok: true, id };
}

/**
 * `WP_REST_Widgets_Controller::create_item()`
 * (`class-wp-rest-widgets-controller.php:250`): grava o componente e o
 * **atribui** a area pedida (`wp_assign_widget_to_sidebar()`), que por padrao
 * e a de inativos. Responde **201**.
 */
export function criarComponentePelaApi(
  contexto: ContextoDosComponentes,
  pedido: PedidoDeComponenteNaApi,
): ResultadoDoComponenteNaApi {
  const erro = permissaoDaApiDeComponentes(contexto);
  if (erro !== null) {
    return { ok: false, erro };
  }
  const idDaArea = pedido.area ?? AREA_DE_INATIVOS;
  const gravado = gravarComponente(contexto, pedido, idDaArea);
  if (!gravado.ok) {
    return gravado;
  }
  atribuirComponenteAArea(contexto.opcoes, gravado.id, idDaArea);
  return { ok: true, status: 201, id: gravado.id, area: idDaArea };
}

/**
 * `WP_REST_Widgets_Controller::update_item()`
 * (`class-wp-rest-widgets-controller.php:296`): o componente de tipo que nao
 * esta em area nenhuma e **404**; a configuracao so e gravada com `instance`
 * ou `form_data` no pedido; e a area so muda quando a pedida e outra.
 */
export function atualizarComponentePelaApi(
  contexto: ContextoDosComponentes,
  pedido: PedidoDeComponenteNaApi & { readonly id: string },
): ResultadoDoComponenteNaApi {
  const erro = permissaoDaApiDeComponentes(contexto);
  if (erro !== null) {
    return { ok: false, erro };
  }

  let idDaArea = areaDoComponente(contexto.opcoes, pedido.id);
  const decomposto = decomporIdDoComponente(pedido.id);
  if (idDaArea === null && contexto.tipoDeComponente(decomposto.idBase) !== undefined) {
    return { ok: false, erro: naoEncontrado() };
  }

  if (pedido.instancia !== undefined || pedido.dadosDoFormulario !== undefined) {
    const gravado = gravarComponente(contexto, pedido, idDaArea);
    if (!gravado.ok) {
      return gravado;
    }
  }

  if (pedido.area !== undefined && idDaArea !== pedido.area) {
    idDaArea = pedido.area;
    atribuirComponenteAArea(contexto.opcoes, pedido.id, idDaArea);
  }

  return { ok: true, status: 200, id: pedido.id, area: idDaArea };
}

/**
 * `WP_REST_Widgets_Controller::delete_item()`
 * (`class-wp-rest-widgets-controller.php:371`).
 *
 * | `force` | o que acontece |
 * |---|---|
 * | falso (o padrao) | o componente vai para os **inativos**, com a configuracao intacta — e "retirar" |
 * | verdadeiro | a instancia sai da opcao do tipo pelo mesmo `update_callback()` da tela, e o componente sai de **toda** area (`wp_assign_widget_to_sidebar( $id, '' )`) |
 */
export function apagarComponentePelaApi(
  contexto: ContextoDosComponentes,
  pedido: { readonly id: string; readonly forcar?: boolean },
): ResultadoDoComponenteNaApi {
  const erro = permissaoDaApiDeComponentes(contexto);
  if (erro !== null) {
    return { ok: false, erro };
  }

  const idDaArea = areaDoComponente(contexto.opcoes, pedido.id);
  if (idDaArea === null) {
    return { ok: false, erro: naoEncontrado() };
  }

  if (pedido.forcar === true) {
    const { idBase } = decomporIdDoComponente(pedido.id);
    // `do_action( 'delete_widget', ... )` (`:418`) — ponto de extensao.
    const tipo = contexto.tipoDeComponente(idBase);
    if (tipo !== undefined) {
      atualizarConfiguracao(contexto.opcoes, tipo, contexto.componentesRegistrados, {
        sidebar: texto(idDaArea),
        [`widget-${idBase}`]: arranjo([]),
        'the-widget-id': texto(pedido.id),
        delete_widget: texto('1'),
      });
    }
    atribuirComponenteAArea(contexto.opcoes, pedido.id, '');
    return { ok: true, status: 200, id: pedido.id, area: idDaArea, apagado: true };
  }

  atribuirComponenteAArea(contexto.opcoes, pedido.id, AREA_DE_INATIVOS);
  return { ok: true, status: 200, id: pedido.id, area: AREA_DE_INATIVOS };
}
