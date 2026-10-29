/**
 * Organizar os componentes pela tela dedicada — o formulario sem JavaScript e
 * as duas acoes Ajax que gravam o mapa de areas.
 *
 * Entrega de **T015** da feature `009-apresentacao-e-personalizacao` —
 * **CA-7.1** (a capacidade e o token), **CA-7.2** (o mapa e a configuracao em
 * opcao), **CA-7.3** (a primeira das tres superficies) e **CA-7.4** (*"Existe
 * acao para limpar de uma vez os componentes que ficaram sem area"*).
 *
 * | operacao | ancora | aqui |
 * |---|---|---|
 * | colocar, configurar ou retirar sem JavaScript | `wp-admin/widgets-form.php:124`-`:202` | {@link gravarComponentePelaTela} |
 * | limpar os inativos sem JavaScript | `wp-admin/widgets-form.php:205`-`:224` | {@link limparInativosPelaTela} |
 * | reordenar as areas (arrastar e soltar) | `wp-admin/includes/ajax-actions.php:2349` | {@link ordenarPeloAjax} |
 * | limpar os inativos com JavaScript | `wp-admin/includes/ajax-actions.php:2512` | {@link limparInativosPeloAjax} |
 *
 * ## O preparo do mapa que a tela faz antes de qualquer acao
 *
 * `widgets-form.php` roda no escopo global, e o mapa que ele grava e o
 * `$sidebars_widgets` que ele mesmo preparou (`:76`-`:121`): mapa vazio vira o
 * padrao das areas registradas (`:78`-`:80`), e area que o tema nao registra
 * **sai do mapa quando esta vazia** (`:87`-`:104`) — a nao vazia so ganha
 * registro de area orfa, que e montagem de tela. E por isso que salvar um
 * componente pela tela apaga do valor gravado a area vazia de um tema antigo.
 *
 * 🔴 **`retrieve_widgets()` (`:121`) nao esta aqui, e e de T019.** E a funcao
 * que remapeia para os inativos o que ficou sem area depois de trocar o tema
 * (`wp-includes/widgets.php:1327`), e e o coracao de US-9. No estado de
 * regime da tela — sem o mapa do tema anterior guardado, as chaves do mapa
 * iguais as areas registradas (a de inativos inclusa, que a tela registra em
 * `:108`) e todo componente do mapa registrado — ela **nao altera o mapa nem
 * grava** (`:1333`-`:1348`), e e nesse estado que esta tarefa se confere. Quem pegar
 * T019 a insere no ponto marcado em {@link mapaPreparadoPelaTela}; o achado que
 * T019 precisa ler antes esta em `../README.md`.
 *
 * ⚠️ **Nao portado aqui: o Ajax `save-widget`** (`ajax-actions.php:2395`), que
 * a tela com JavaScript usa para configurar um componente. Ele chama o mesmo
 * `update_callback()` deste arquivo, mas grava o mapa **so ao apagar**,
 * acrescenta o componente novo na area sem tira-lo das outras (`:2458`) e
 * termina desenhando o formulario do componente — montagem de tela. O caminho
 * sem JavaScript cobre os tres verbos de CA-7.1 pela mesma tela.
 *
 * ⚠️ **A area de inativos nao tem prazo, e a limpeza e so acao.** UC-31:
 * *"guarda o que sobrou de todo tema ja usado, indefinidamente, e so uma acao
 * manual a limpa"*; o **P6** proibe inventar retencao. As duas limpezas daqui
 * sao as unicas, e as duas sao pedidas pelo ator.
 */

import {
  normalizarChaveDeTexto,
  texto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import type { RepositorioDeOpcoes } from '../armazenamento/index.js';
import {
  arranjoParaEditar,
  atribuirNaChave,
  atribuirNaChaveExata,
  chaveComoTexto,
  inserirNaPosicao,
  inteiroNoPhp,
  mesmaChave,
  semOValor,
  textoNoPhp,
  tirarChave,
  valorDoArranjo,
  valorIdenticoAoTexto,
  valorNaChave,
  verdadeiroNoPhp,
  type ArranjoDoPhp,
} from './arranjo-do-php.js';
import {
  atualizarConfiguracao,
  opcaoDoComponente,
} from './configuracao-do-componente.js';
import type {
  ContextoDosComponentes,
  FormularioDoComponente,
} from './contexto-dos-componentes.js';
import {
  AREA_DE_INATIVOS,
  gravarMapaDeAreas,
  lerMapaDeAreas,
  mapaPadrao,
} from './mapa-de-areas.js';
import {
  TOKEN_DE_LIMPAR_INATIVOS_PELA_TELA,
  TOKEN_DE_LIMPAR_INATIVOS_PELO_AJAX,
  TOKEN_DE_ORDENAR_PELO_AJAX,
  conferirTokenDaTela,
  portaoDaTelaDeComponentes,
  portaoDoAjaxDeComponentes,
  tokenDeGravarComponente,
  type RecusaDaTelaDeComponentes,
  type RespostaDoAjaxDeComponentes,
} from './permissao-dos-componentes.js';

/** O endereco da tela, para onde os redirecionamentos vao. */
export const ENDERECO_DA_TELA_DE_COMPONENTES = 'widgets.php';

/** `admin_url( 'widgets.php?message=0' )` — a gravacao terminou (`widgets-form.php:200`, `:222`). */
export const ENDERECO_DE_COMPONENTES_GRAVADOS = 'widgets.php?message=0';

/**
 * `admin_url( 'widgets.php?error=0' )` — retirar um componente que nao esta na
 * area informada (`widgets-form.php:147`-`:149`). Nada e gravado.
 */
export const ENDERECO_DE_COMPONENTE_FORA_DA_AREA = 'widgets.php?error=0';

/** O que a tela fez. */
export type DesfechoDaTelaDeComponentes =
  | { readonly desfecho: 'recusada'; readonly recusa: RecusaDaTelaDeComponentes }
  | { readonly desfecho: 'redirecionar'; readonly endereco: string }
  /** O pedido nao trazia a acao: a tela so seria desenhada. */
  | { readonly desfecho: 'tela' };

/** Um campo de texto do `$_POST`, para o token. */
function textoDoCampo(
  corpo: FormularioDoComponente,
  campo: string,
): string | undefined {
  const valor = corpo[campo];
  return valor === undefined || valor.tipo === 'arranjo'
    ? undefined
    : textoNoPhp(valor);
}

/**
 * O mapa como a tela o deixa antes de qualquer acao (`widgets-form.php:76`-`:121`).
 *
 * `is_registered_sidebar()` compara pela chave do arranjo de registro, e a
 * area de inativos ainda **nao** esta registrada quando o laco roda — ela e
 * pulada pelo nome (`:83`-`:85`).
 */
export function mapaPreparadoPelaTela(
  contexto: Pick<ContextoDosComponentes, 'opcoes' | 'areasRegistradas'>,
): ArranjoDoPhp {
  let lido = lerMapaDeAreas(contexto.opcoes);
  if (!verdadeiroNoPhp(lido)) {
    lido = mapaPadrao(contexto.areasRegistradas);
  }
  const mapa = arranjoParaEditar(lido);
  const registradas = contexto.areasRegistradas.map((area) =>
    normalizarChaveDeTexto(area.id),
  );

  for (const area of [...mapa.entradas]) {
    if (chaveComoTexto(area.chave) === AREA_DE_INATIVOS) {
      continue;
    }
    const registrada = registradas.some((chave) => mesmaChave(chave, area.chave));
    if (!registrada && !verdadeiroNoPhp(area.valor)) {
      tirarChave(mapa, area.chave);
    }
  }

  // 🔴 `retrieve_widgets()` (`widgets-form.php:121`) entra aqui, em T019.
  return mapa;
}

/**
 * Colocar, configurar ou retirar um componente pelo formulario sem
 * JavaScript (`wp-admin/widgets-form.php:124`-`:202`).
 *
 * | passo | linha | o que faz |
 * |---|---|---|
 * | 1 | `:126` | o token `save-delete-widget-{componente}` |
 * | 2 | `:128`-`:136` | com `multi_number`, o primeiro campo-arranjo cuja primeira chave tem `__i__` ou `%i%` passa a ter so a primeira entrada, no numero novo |
 * | 3 | `:138`-`:142` | a area, a posicao (`{area}_position` menos um, ou `0`) e a lista atual da area |
 * | 4 | `:145`-`:170` | retirar: componente fora da area volta com `error=0` **sem gravar nada**; dentro, sai da lista e o `$_POST` vira o pedido de apagar |
 * | 5 | `:174`-`:184` | o `update_callback()` do tipo, se o tipo existe |
 * | 6 | `:186`-`:197` | a area recebe a lista; sem apagar, o componente sai de **toda** area (`array_diff()`, buraco na chave) e entra na posicao (`array_splice()`, chave renumerada) |
 * | 7 | `:199`-`:200` | `wp_set_sidebars_widgets()` e `message=0` |
 */
export function gravarComponentePelaTela(
  contexto: ContextoDosComponentes,
  corpo: FormularioDoComponente,
): DesfechoDaTelaDeComponentes {
  const recusa = portaoDaTelaDeComponentes(contexto);
  if (recusa !== null) {
    return { desfecho: 'recusada', recusa };
  }
  const mapa = mapaPreparadoPelaTela(contexto);

  if (corpo['savewidget'] === undefined && corpo['removewidget'] === undefined) {
    return { desfecho: 'tela' };
  }

  const idDoComponente = textoNoPhp(corpo['widget-id'] ?? texto(''));
  const recusaDoToken = conferirTokenDaTela(
    contexto,
    tokenDeGravarComponente(idDoComponente),
    textoDoCampo(corpo, '_wpnonce'),
  );
  if (recusaDoToken !== null) {
    return { desfecho: 'recusada', recusa: recusaDoToken };
  }

  let formulario: Record<string, ValorPhp> = { ...corpo };
  const numero =
    corpo['multi_number'] !== undefined ? inteiroNoPhp(corpo['multi_number']) : 0;
  if (numero !== 0) {
    for (const [campo, valor] of Object.entries(formulario)) {
      const primeira = valor.tipo === 'arranjo' ? valor.entradas[0] : undefined;
      if (
        primeira !== undefined &&
        /__i__|%i%/.test(chaveComoTexto(primeira.chave))
      ) {
        formulario[campo] = {
          tipo: 'arranjo',
          entradas: [{ chave: { tipo: 'inteiro', valor: numero }, valor: primeira.valor }],
        };
        break;
      }
    }
  }

  const idDaArea = textoNoPhp(corpo['sidebar'] ?? texto(''));
  const campoDaPosicao = corpo[`${idDaArea}_position`];
  const posicao = campoDaPosicao !== undefined ? inteiroNoPhp(campoDaPosicao) - 1 : 0;
  const idBase = textoNoPhp(corpo['id_base'] ?? texto(''));
  let lista: ValorPhp = valorNaChave(mapa, idDaArea) ?? {
    tipo: 'arranjo',
    entradas: [],
  };

  if (verdadeiroNoPhp(corpo['removewidget'])) {
    const estaNaArea =
      lista.tipo === 'arranjo' &&
      lista.entradas.some((entrada) =>
        valorIdenticoAoTexto(entrada.valor, idDoComponente),
      );
    if (!estaNaArea) {
      return { desfecho: 'redirecionar', endereco: ENDERECO_DE_COMPONENTE_FORA_DA_AREA };
    }
    lista = semOValor(lista, idDoComponente);
    formulario = {
      sidebar: texto(idDaArea),
      [`widget-${idBase}`]: { tipo: 'arranjo', entradas: [] },
      'the-widget-id': texto(idDoComponente),
      delete_widget: texto('1'),
    };
    // `do_action( 'delete_widget', ... )` (`:169`) — ver
    // `PONTOS_DE_EXTENSAO_DA_CONFIGURACAO`.
  }
  formulario['widget-id'] = lista;

  const tipo = contexto.tipoDeComponente(idBase);
  if (tipo !== undefined) {
    atualizarConfiguracao(
      contexto.opcoes,
      tipo,
      contexto.componentesRegistrados,
      formulario,
    );
  }

  atribuirNaChave(mapa, idDaArea, lista);

  if (formulario['delete_widget'] === undefined) {
    for (let i = 0; i < mapa.entradas.length; i++) {
      const area = mapa.entradas[i];
      if (area !== undefined && area.valor.tipo === 'arranjo') {
        mapa.entradas[i] = {
          chave: area.chave,
          valor: semOValor(area.valor, idDoComponente),
        };
      }
    }
    atribuirNaChave(
      mapa,
      idDaArea,
      inserirNaPosicao(valorNaChave(mapa, idDaArea), posicao, texto(idDoComponente)),
    );
  }

  gravarMapaDeAreas(contexto.opcoes, valorDoArranjo(mapa));
  return { desfecho: 'redirecionar', endereco: ENDERECO_DE_COMPONENTES_GRAVADOS };
}

/**
 * O laco das duas limpezas (`widgets-form.php:209`-`:217`,
 * `ajax-actions.php:2529`-`:2537`): para cada componente da area de inativos,
 * tira a instancia da opcao do tipo e tira o componente da area.
 *
 * O tipo sai do proprio identificador — `explode( '-' )`, o ultimo pedaco e o
 * numero, o resto e a base — e a opcao e lida e gravada **direto**, sem passar
 * pelo tipo: `_multiwidget` fica onde estava. Opcao que nao existe volta
 * `false`, o `unset()` nao faz nada e `update_option()` nao escreve, porque o
 * valor e o mesmo.
 *
 * A area fica no mapa, **vazia**: `unset()` tira as entradas, nao a chave.
 */
function limparAreaDeInativos(
  opcoes: Pick<RepositorioDeOpcoes, 'lerComoNoLegado' | 'gravar'>,
  mapa: ArranjoDoPhp,
): void {
  const inativos = valorNaChave(mapa, AREA_DE_INATIVOS);
  if (inativos === undefined || inativos.tipo !== 'arranjo') {
    return;
  }
  const lista = arranjoParaEditar(inativos);
  for (const entrada of inativos.entradas) {
    const pedacos = textoNoPhp(entrada.valor).split('-');
    const numero = pedacos.pop() ?? '';
    const nome = opcaoDoComponente(pedacos.join('-'));

    let configuracoes = opcoes.lerComoNoLegado(nome);
    if (configuracoes.tipo === 'arranjo') {
      const edicao = arranjoParaEditar(configuracoes);
      tirarChave(edicao, normalizarChaveDeTexto(numero));
      configuracoes = valorDoArranjo(edicao);
    }
    opcoes.gravar(nome, configuracoes);
    tirarChave(lista, entrada.chave);
  }
  atribuirNaChave(mapa, AREA_DE_INATIVOS, valorDoArranjo(lista));
}

/**
 * Limpar de uma vez os componentes inativos pelo formulario sem JavaScript
 * (`wp-admin/widgets-form.php:205`-`:224`) — **CA-7.4**.
 *
 * O botao *"Clear Inactive Widgets"* (`:501`) manda `removeinactivewidgets`.
 * Com o campo presente e falso, o token e conferido e nada e gravado: a tela
 * so volta com `message=0`.
 */
export function limparInativosPelaTela(
  contexto: ContextoDosComponentes,
  corpo: FormularioDoComponente,
): DesfechoDaTelaDeComponentes {
  const recusa = portaoDaTelaDeComponentes(contexto);
  if (recusa !== null) {
    return { desfecho: 'recusada', recusa };
  }
  const mapa = mapaPreparadoPelaTela(contexto);

  if (corpo['removeinactivewidgets'] === undefined) {
    return { desfecho: 'tela' };
  }
  const recusaDoToken = conferirTokenDaTela(
    contexto,
    TOKEN_DE_LIMPAR_INATIVOS_PELA_TELA,
    textoDoCampo(corpo, TOKEN_DE_LIMPAR_INATIVOS_PELA_TELA.campo),
  );
  if (recusaDoToken !== null) {
    return { desfecho: 'recusada', recusa: recusaDoToken };
  }

  if (verdadeiroNoPhp(corpo['removeinactivewidgets'])) {
    limparAreaDeInativos(contexto.opcoes, mapa);
    gravarMapaDeAreas(contexto.opcoes, valorDoArranjo(mapa));
  }
  return { desfecho: 'redirecionar', endereco: ENDERECO_DE_COMPONENTES_GRAVADOS };
}

/**
 * Limpar os inativos pelo Ajax da tela (`ajax-actions.php:2512`) — **CA-7.4**,
 * o caminho que o botao usa com JavaScript.
 *
 * Diferente do formulario: le o mapa **sem** o preparo da tela, e grava
 * sempre. Responde `wp_die()` vazio, 200.
 */
export function limparInativosPeloAjax(
  contexto: ContextoDosComponentes,
  corpo: FormularioDoComponente,
): RespostaDoAjaxDeComponentes {
  const recusa = portaoDoAjaxDeComponentes(
    contexto,
    TOKEN_DE_LIMPAR_INATIVOS_PELO_AJAX,
    textoDoCampo(corpo, TOKEN_DE_LIMPAR_INATIVOS_PELO_AJAX.campo),
  );
  if (recusa !== null) {
    return recusa;
  }
  const mapa = arranjoParaEditar(lerMapaDeAreas(contexto.opcoes));
  limparAreaDeInativos(contexto.opcoes, mapa);
  gravarMapaDeAreas(contexto.opcoes, valorDoArranjo(mapa));
  return { status: 200, corpo: '' };
}

/**
 * Gravar a ordem de todas as areas pelo Ajax da tela — o arrastar e soltar
 * (`ajax-actions.php:2349`).
 *
 * ⚠️ **O mapa gravado e SO o que o cliente mandou**: cada area vem como texto
 * separado por virgula, e a area que nao veio no pedido **some** do valor
 * gravado. De cada pedaco so fica o que contem `widget-`, e dele o que vem
 * depois do primeiro `_` (`:2369`-`:2373`); a chave e a **posicao do pedaco**,
 * logo o pedaco descartado deixa buraco.
 *
 * Responde `1` quando grava e `-1` quando `sidebars` nao e arranjo.
 */
export function ordenarPeloAjax(
  contexto: ContextoDosComponentes,
  corpo: FormularioDoComponente,
): RespostaDoAjaxDeComponentes {
  const recusa = portaoDoAjaxDeComponentes(
    contexto,
    TOKEN_DE_ORDENAR_PELO_AJAX,
    textoDoCampo(corpo, TOKEN_DE_ORDENAR_PELO_AJAX.campo),
  );
  if (recusa !== null) {
    return recusa;
  }

  const areas = corpo['sidebars'];
  if (areas === undefined || areas.tipo !== 'arranjo') {
    return { status: 200, corpo: '-1' };
  }

  const mapa = arranjoParaEditar(undefined);
  for (const area of areas.entradas) {
    const lista = arranjoParaEditar(undefined);
    if (verdadeiroNoPhp(area.valor)) {
      textoNoPhp(area.valor)
        .split(',')
        .forEach((pedaco, posicao) => {
          if (!pedaco.includes('widget-')) {
            return;
          }
          // `strpos()` sem `_` devolve `false`, e `false + 1` e `1`.
          const sublinhado = pedaco.indexOf('_');
          atribuirNaChaveExata(
            lista,
            { tipo: 'inteiro', valor: posicao },
            texto(pedaco.substring(sublinhado === -1 ? 1 : sublinhado + 1)),
          );
        });
    }
    atribuirNaChaveExata(mapa, area.chave, valorDoArranjo(lista));
  }

  gravarMapaDeAreas(contexto.opcoes, valorDoArranjo(mapa));
  return { status: 200, corpo: '1' };
}
