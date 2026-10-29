/**
 * Abrir a personalizacao: o portao, o identificador do conjunto e o conjunto
 * carregado — **sem gravar nada**.
 *
 * Entrega de **T003** da feature `009-apresentacao-e-personalizacao`, US-1:
 * **CA-1.1** (*"Abrir a personalizacao cria um conjunto de alteracoes que nao
 * afeta o que o visitante ve"*) e a metade de **CA-1.3** que e retomar
 * (*"O conjunto pode ser salvo e retomado depois"*).
 *
 * E o que acontece no legado entre o arranque e a primeira linha de HTML do
 * Customizer, em quatro lugares:
 *
 * | passo | ancora |
 * |---|---|
 * | decidir se o Customizer existe nesta requisicao, e com que identificador | `_wp_customize_include()`, `wp-includes/theme.php:3536`-`:3589` |
 * | o portao, o formato do identificador e o identificador inexistente | `setup_theme()`, `wp-includes/class-wp-customize-manager.php:516`-`:562` |
 * | escolher o identificador quando nenhum foi pedido | `establish_loaded_changeset()`, `:625`-`:654` |
 * | conferir a edicao do conjunto existente | `wp-admin/customize.php:15`-`:37` |
 *
 * ## 🔴 "Cria um conjunto" e um IDENTIFICADOR, nao uma linha
 *
 * Abrir **nao grava** em `posts`. O que nasce e o UUID (`wp_generate_uuid4()`,
 * `:650`); a linha so aparece na primeira gravacao, e nasce como rascunho
 * automatico (`$post_array['post_status'] = 'auto-draft'`, `:2931`) — ver
 * `gravar-o-conjunto.ts`. E e por isso que o visitante nao e afetado: nada que o
 * site publico le mudou, e a previa so existe na requisicao que carrega o
 * identificador (`valores-da-previa.ts`).
 *
 * ## Retomar e o modo linear, que e o default
 *
 * `_wp_customize_include()` passa `branching => false` (`theme.php:3583`), e
 * nesse modo, quando a tela abre sem identificador, o legado **reabre o
 * conjunto guardado mais recente, de qualquer autor** — estados registrados
 * menos `auto-draft`, `publish`, `trash`, `inherit` e `private` (`:634`). O
 * comentario do ponto de extensao diz o modelo: *"only one saved changeset will
 * exist at a time (with a 'draft' or 'future' status). This makes the Customizer
 * operate in a way that is similar to going to 'edit' to one existing post"*
 * (`:790`-`:793`). UC-29: *"o Customizer opera linearmente: so um conjunto salvo
 * existe por vez"*.
 *
 * ## O que esta operacao NAO faz, e de quem e
 *
 * | o que | ancora | de quem |
 * |---|---|---|
 * | pre-visualizar **outro** tema (`customize_theme`) | `setup_theme()`, `:574`-`:595` | **T017** (US-8): exige `switch_themes`, e o tema pedido nao e o ativo. Aqui o tema e sempre o ativo |
 * | publicar o agendamento vencido ao abrir (`$missed_schedule`) | `wp-admin/customize.php:39`-`:75` | **T009** (US-4) |
 * | marcar a trava de edicao (`_edit_lock`) | `establish_loaded_changeset()`, `:656`-`:658`; `set_changeset_lock()`, `:3255` | nenhuma tarefa desta feature a nomeia; ⚠️ registrado em `../README.md` |
 * | importar o conteudo inicial do tema numa instalacao nova | `setup_theme()`, `:605`-`:607` | a forma do anexo esta em `anexo-na-personalizacao.ts` (CA-1.5); o fluxo inteiro, nao |
 * | carregar a revisao de salvamento automatico (`customize_autosaved`) | `changeset_data()`, `:1165`-`:1173` | salvamento automatico nao e criterio de US-1 |
 */

import {
  FORMA_DO_IDENTIFICADOR_DO_CONJUNTO,
  identificadorDoConjuntoValido,
  type ConjuntoDeAlteracoes,
} from '../armazenamento/index.js';
import {
  vazioNoPhp,
  type ContextoDaPersonalizacao,
  type PedidoDaPersonalizacao,
} from './contexto-da-personalizacao.js';
import {
  PERMISSOES_DA_PERSONALIZACAO,
  perguntarNaPersonalizacao,
} from './permissao-da-personalizacao.js';

/** O titulo do `wp_die()` de permissao (`class-wp-customize-manager.php:525`). */
export const TITULO_SEM_PERMISSAO = 'You need a higher level of permission.';

/** `customize.php:18` e `class-wp-customize-manager.php:526`. */
export const MENSAGEM_SEM_PERMISSAO_DE_PERSONALIZAR =
  'Sorry, you are not allowed to customize this site.';

/** `wp-admin/customize.php:35`. */
export const MENSAGEM_SEM_PERMISSAO_DE_EDITAR_O_CONJUNTO =
  'Sorry, you are not allowed to edit this changeset.';

/** `class-wp-customize-manager.php:535`. */
export const MENSAGEM_DE_IDENTIFICADOR_INVALIDO = 'Invalid changeset UUID';

/** `class-wp-customize-manager.php:562`. */
export const MENSAGEM_DE_IDENTIFICADOR_INEXISTENTE = 'Non-existent changeset UUID.';

/**
 * Os estados que `establish_loaded_changeset()` **tira** da lista registrada
 * para achar o conjunto a retomar, na ordem do legado (`:634`).
 */
export const ESTADOS_QUE_NAO_SE_RETOMAM = [
  'auto-draft',
  'publish',
  'trash',
  'inherit',
  'private',
] as const;

/** Por que a abertura nao aconteceu. Tela entra como dado: a borda monta. */
export type RecusaDaAbertura =
  /** `auth_redirect()` — sem sessao, na tela (`:521`-`:522`). */
  | { readonly tipo: 'autenticar' }
  /** `wp_die( '<h1>titulo</h1><p>mensagem</p>', 403 )`. */
  | {
      readonly tipo: 'proibida';
      readonly status: 403;
      readonly titulo: string;
      readonly mensagem: string;
    }
  /**
   * `$this->wp_die( $resposta_ajax, $mensagem )` (`:452`): em requisicao
   * assincrona o legado morre com {@link respostaAjax}; fora dela, com a
   * mensagem — e, havendo canal de mensagens, com o roteiro que avisa o quadro.
   */
  | {
      readonly tipo: 'interrompida';
      readonly respostaAjax: -1 | 0;
      readonly mensagem: string;
    };

/** A personalizacao aberta: o identificador e o conjunto, se ja existe linha. */
export interface AberturaDaPersonalizacao {
  readonly situacao: 'aberta';
  /** O UUID — pedido, retomado ou recem-gerado. */
  readonly identificador: string;
  /** A linha de `posts`, ou `null` quando o conjunto ainda nao foi gravado. */
  readonly conjunto: ConjuntoDeAlteracoes | null;
  /** `sanitize_key( customize_messenger_channel )`, ou `null`. */
  readonly canalDeMensagens: string | null;
}

export type ResultadoDaAbertura =
  /** O Customizer nao e instanciado nesta requisicao (`theme.php:3547`-`:3549`). */
  | { readonly situacao: 'fora-da-personalizacao' }
  | { readonly situacao: 'recusada'; readonly recusa: RecusaDaAbertura }
  | AberturaDaPersonalizacao;

/**
 * `$should_include` de `_wp_customize_include()`
 * (`wp-includes/theme.php:3538`-`:3545`): a tela, ou `wp_customize=on`, ou um
 * identificador nao vazio na consulta **ou** no corpo.
 *
 * E esta funcao que separa o visitante de quem personaliza: requisicao sem
 * nenhuma das tres nao instancia o Customizer, e portanto nao sobrepoe valor
 * nenhum.
 */
export function deveCarregarAPersonalizacao(
  pedido: PedidoDaPersonalizacao,
): boolean {
  const wpCustomize = Object.prototype.hasOwnProperty.call(
    pedido.corpo,
    'wp_customize',
  )
    ? pedido.corpo['wp_customize']
    : pedido.consulta['wp_customize'];
  return (
    pedido.naTelaDaPersonalizacao ||
    wpCustomize === 'on' ||
    !vazioNoPhp(pedido.consulta['customize_changeset_uuid']) ||
    !vazioNoPhp(pedido.corpo['customize_changeset_uuid'])
  );
}

/** `array_merge( wp_array_slice_assoc( $_GET, $keys ), wp_array_slice_assoc( $_POST, $keys ) )`. */
function variavelDeEntrada(
  pedido: PedidoDaPersonalizacao,
  chave: string,
): string | undefined {
  return pedido.corpo[chave] ?? pedido.consulta[chave];
}

/**
 * O identificador pedido, ou `false` — *"Value false indicates UUID should be
 * determined after_setup_theme"* (`wp-includes/theme.php:3573`-`:3589`).
 *
 * Na tela, `changeset_uuid` vale com `isset()` (inclusive vazio); fora dela,
 * `customize_changeset_uuid` vale com `! empty()`. Os dois passam por
 * `sanitize_key()`, que abaixa a caixa e descarta o que nao e `[a-z0-9_-]` — e
 * por isso um UUID em maiusculas **e aceito**, minusculo.
 */
export function identificadorDoPedido(
  contexto: ContextoDaPersonalizacao,
  pedido: PedidoDaPersonalizacao,
): string | false {
  const daTela = variavelDeEntrada(pedido, 'changeset_uuid');
  if (pedido.naTelaDaPersonalizacao && daTela !== undefined) {
    return contexto.sanitizarChave(daTela);
  }
  const daPrevia = variavelDeEntrada(pedido, 'customize_changeset_uuid');
  if (!vazioNoPhp(daPrevia)) {
    return contexto.sanitizarChave(daPrevia as string);
  }
  return false;
}

/**
 * `establish_loaded_changeset()` (`class-wp-customize-manager.php:625`-`:654`)
 * para o tema ativo.
 *
 * Sem ramificacao, o conjunto guardado mais recente e retomado se o
 * `post_name` dele **tiver a forma** de UUID (`wp_is_uuid()`, `:644`); senao, ou
 * com ramificacao, nasce um identificador novo (`:648`-`:651`).
 */
export function estabelecerIdentificador(
  contexto: ContextoDaPersonalizacao,
): string {
  if (!contexto.ramificacao) {
    const estados = contexto.estadosRegistrados.filter(
      (estado) =>
        !(ESTADOS_QUE_NAO_SE_RETOMAM as readonly string[]).includes(estado),
    );
    const guardado = contexto.conjuntos.maisRecente(estados);
    if (
      guardado !== null &&
      identificadorDoConjuntoValido(guardado.identificador)
    ) {
      return guardado.identificador;
    }
  }
  return contexto.gerarIdentificador();
}

/**
 * Abre a personalizacao — na tela (`customize.php`) ou na requisicao de previa
 * do site, conforme {@link PedidoDaPersonalizacao.naTelaDaPersonalizacao}.
 *
 * A ordem das recusas e a do legado, e cada uma tem o seu modo de morrer:
 *
 * 1. **na tela, sem `customize`**: sem sessao, `auth_redirect()`; com sessao,
 *    `wp_die( ..., 403 )` (`:519`-`:531`);
 * 2. **identificador pedido sem a forma de UUID**: `Invalid changeset UUID`
 *    (`:534`-`:536`) — e `''` conta, porque `isset( '' )` e verdadeiro;
 * 3. **sem `customize` e sem linha para o identificador**: `Non-existent
 *    changeset UUID.`, com `0` em vez de `-1` quando ha canal de mensagens
 *    (`:561`-`:563`). E a unica porta da previa para quem nao tem a capacidade:
 *    *"the UUID serves as a secret key"* (`:556`-`:560`);
 * 4. **na tela, conjunto existente que o ator nao pode editar**: `wp_die( ...,
 *    403 )` (`customize.php:29`-`:37`).
 *
 * **Nenhum comando de escrita sai daqui** — o resultado de CA-1.1 e afirmado
 * por isso.
 */
export function abrirPersonalizacao(
  contexto: ContextoDaPersonalizacao,
  pedido: PedidoDaPersonalizacao,
): ResultadoDaAbertura {
  if (!deveCarregarAPersonalizacao(pedido)) {
    return { situacao: 'fora-da-personalizacao' };
  }

  const podePersonalizar = (): boolean =>
    perguntarNaPersonalizacao(
      contexto.autorizacao,
      PERMISSOES_DA_PERSONALIZACAO.abrir,
    );

  const canal = variavelDeEntrada(pedido, 'customize_messenger_channel');
  const canalDeMensagens =
    canal === undefined ? null : contexto.sanitizarChave(canal);

  // 1. O portao da tela (`setup_theme()`, `:519`-`:531`).
  if (pedido.naTelaDaPersonalizacao && !podePersonalizar()) {
    return {
      situacao: 'recusada',
      recusa: contexto.autorizacao.ator.existe
        ? {
            tipo: 'proibida',
            status: 403,
            titulo: TITULO_SEM_PERMISSAO,
            mensagem: MENSAGEM_SEM_PERMISSAO_DE_PERSONALIZAR,
          }
        : { tipo: 'autenticar' },
    };
  }

  // 2. A forma do identificador pedido (`:534`-`:536`).
  let identificador = identificadorDoPedido(contexto, pedido);
  if (
    identificador !== false &&
    !FORMA_DO_IDENTIFICADOR_DO_CONJUNTO.test(identificador)
  ) {
    return {
      situacao: 'recusada',
      recusa: {
        tipo: 'interrompida',
        respostaAjax: -1,
        mensagem: MENSAGEM_DE_IDENTIFICADOR_INVALIDO,
      },
    };
  }

  // `changeset_post_id()` resolve o identificador na primeira chamada
  // (`changeset_uuid()`, `:826`-`:830`) e guarda a linha (`:1101`-`:1111`).
  let conjunto: ConjuntoDeAlteracoes | null | undefined;
  const conjuntoCarregado = (): ConjuntoDeAlteracoes | null => {
    if (identificador === false) {
      identificador = estabelecerIdentificador(contexto);
    }
    if (conjunto === undefined) {
      conjunto = contexto.conjuntos.porIdentificador(identificador);
    }
    return conjunto;
  };

  // 3. Sem a capacidade, so a linha existente abre a previa (`:556`-`:563`).
  if (!podePersonalizar() && conjuntoCarregado() === null) {
    return {
      situacao: 'recusada',
      recusa: {
        tipo: 'interrompida',
        // `$this->messenger_channel ? 0 : -1` — e `'0'` e falso no PHP.
        respostaAjax: vazioNoPhp(canalDeMensagens ?? undefined) ? -1 : 0,
        mensagem: MENSAGEM_DE_IDENTIFICADOR_INEXISTENTE,
      },
    };
  }

  // `after_setup_theme`, prioridade 5 (`:598`): o identificador fica decidido.
  const carregado = conjuntoCarregado();

  // 4. A edicao do conjunto existente, so na tela (`customize.php:29`-`:37`).
  if (
    pedido.naTelaDaPersonalizacao &&
    carregado !== null &&
    !perguntarNaPersonalizacao(
      contexto.autorizacao,
      PERMISSOES_DA_PERSONALIZACAO.editarConjunto,
      carregado.id,
    )
  ) {
    return {
      situacao: 'recusada',
      recusa: {
        tipo: 'proibida',
        status: 403,
        titulo: TITULO_SEM_PERMISSAO,
        mensagem: MENSAGEM_SEM_PERMISSAO_DE_EDITAR_O_CONJUNTO,
      },
    };
  }

  return {
    situacao: 'aberta',
    identificador: identificador as string,
    conjunto: carregado,
    canalDeMensagens,
  };
}
