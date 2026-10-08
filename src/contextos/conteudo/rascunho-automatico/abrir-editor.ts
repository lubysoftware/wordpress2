/**
 * **US-11**: abrir o editor reserva um registro em rascunho automatico, antes de
 * qualquer digitacao — `get_default_post_to_edit( $tipo, true )`
 * (`wp-admin/includes/post.php:758`).
 *
 * Entrega de **T023** da feature `002-autoria-e-publicacao`, e e a **terceira**
 * regra de negocio deste modulo, depois da publicacao de T003 e da gravacao de
 * T005.
 *
 * ---
 *
 * # 🔴 Esta operacao NAO esta na tabela *Contratos* de `plan.md`, e isso esta declarado
 *
 * A tabela *Contratos* lista **seis** operacoes desta feature — gravar,
 * publicar, agendar, submeter, revisar e publicar de outro autor, listar versoes
 * e restaurar — e **nenhuma delas e esta**. O `index.ts` do modulo diz, desde
 * T001, que *"cada historia acrescenta aqui a sua operacao — as seis da tabela
 * Contratos"*.
 *
 * **A entrega de T023 em `tasks.md` nao e opcional por causa disso:** *"o
 * comportamento de US-11 existe e os criterios CA-11.1, CA-11.2, CA-11.3,
 * CA-11.4 passam contra o sistema novo"*. CA-11.1 descreve um ato — *"abrir o
 * editor de um conteudo novo cria um registro"* — e ato que grava linha e
 * operacao, por qualquer leitura. A falta da linha na tabela e **lacuna de
 * `plan.md`**, nao permissao para nao entregar, e fica registrada aqui e no
 * `README.md` do modulo em vez de resolvida em silencio: quem revisar a tabela
 * acrescenta a setima linha, com a entrada e a saida que esta funcao ja tem.
 *
 * O **P4** da constituicao se aplica a ela como as outras: *"toda operacao
 * exposta nova nasce com declaracao explicita de permissao"*, e a desta sao as
 * **duas** capacidades de `permissao-do-editor.ts`.
 *
 * ---
 *
 * # Os nove passos, com o dono de cada um
 *
 * | # | passo | linha | aqui? |
 * |---|---|---|---|
 * | 0 | as duas capacidades do tipo | `wp-admin/post-new.php:58` | **sim** — `permissao-do-editor.ts`, CA-11.1 |
 * | 1 | as tres leituras de `$_REQUEST` | `:759`-`:771` | **sim**, como pedido — e **nao** vao para a linha |
 * | 2 | `wp_insert_post( [titulo, tipo, 'auto-draft'], true, false )` | `:775`-`:783` | **sim**, delegado a T005 |
 * | 3 | `wp_die()` no erro | `:785`-`:787` | **nao** — erro e valor; ver abaixo |
 * | 4 | `get_post( $post_id )` | `:789` | **sim** |
 * | 5 | o formato de conteudo | `:791`-`:793` | **nao** — BC-02 e BC-07 |
 * | 6 | `wp_after_insert_post( $post, false, null )` | `:795` | **nao emitido** — declarado, REQ-162 |
 * | 7 | agendar a coleta, se ela nao estiver na fila | `:797`-`:800` | **sim** |
 * | 8 | os tres filtros do formulario | `:831`, `:841`, `:851` | **sim** |
 *
 * ## Passo 2: por que o titulo `Auto Draft` e o que ele impede
 *
 * ```php
 * 'post_title' => post_type_supports( $post_type, 'title' ) ? __( 'Auto Draft' ) : '',
 * ```
 *
 * ⚠️ **Esse titulo nao e enfeite: ele e o que faz a linha existir.** O passo 7
 * de `wp_insert_post()` recusa a gravacao quando titulo, corpo **e** resumo estao
 * vazios **e** o tipo suporta os tres (`wp-includes/post.php:4673`-`:4701`, e
 * `../gravacao/gravar.ts`). Com `Auto Draft` no titulo a primeira condicao
 * falha e a linha entra; sem ele, um tipo que suporte os tres recursos cairia em
 * `empty_content` e **abrir o editor nao reservaria nada**.
 *
 * E o tipo que **nao** suporta titulo passa pelo outro lado da mesma condicao: o
 * titulo vai vazio, mas `post_type_supports( $tipo, 'title' )` tambem e falso, e
 * `$maybe_empty` exige os tres suportes. As duas metades do ternario levam a uma
 * linha gravada, por caminhos diferentes — e e por isso que as duas estao
 * testadas.
 *
 * ## Passo 3: `wp_die()` la, valor aqui
 *
 * O legado passa `$wp_error = true` e, se o retorno e erro, **mata a
 * requisicao**: `wp_die( $post_id->get_error_message() )`. Esta operacao devolve
 * o erro em {@link ResultadoDaAberturaDoEditor.erro}, pelo que `plan.md` manda na
 * secao *Contratos* — *"erro e devolvido como valor, nao como excecao: e assim
 * no legado e e o que permite a um ponto de extensao inspecionar a falha"* — e
 * pela mesma forma de T003 e T005. Quem monta a superficie decide entre matar a
 * requisicao e responder; o que nao muda e que **nenhum registro foi reservado**.
 *
 * ## Passo 5: o formato de conteudo, e as tres condicoes que nao se avaliam aqui
 *
 * ```php
 * if ( current_theme_supports( 'post-formats' )
 *   && post_type_supports( $post->post_type, 'post-formats' )
 *   && get_option( 'default_post_format' ) ) {
 *     set_post_format( $post, get_option( 'default_post_format' ) );
 * }
 * ```
 *
 * Tres donos em tres linhas: suporte do tema e **BC-07**, suporte do tipo e
 * `plataforma/tipos-de-conteudo/` (que nao existe nesta arvore), e
 * `set_post_format()` e taxonomia — **BC-02**. A posicao importa e esta marcada:
 * o formato e aplicado **antes** do ponto do passo 6, e e por isso que o legado
 * desliga o disparo automatico daquele ponto no passo 2.
 *
 * ⚠️ `get_option( 'default_post_format' )` e lido com a verdade de PHP: a opcao
 * de fabrica e a cadeia vazia (`wp-admin/includes/schema.php`), logo **numa
 * instalacao nova a condicao e falsa** e `set_post_format()` nao roda. O caminho
 * normal desta operacao, em instalacao de fabrica, nao toca taxonomia nenhuma.
 *
 * ## Passo 7: a guarda do agendamento, e o conflito que ela nao decide
 *
 * A guarda `! wp_next_scheduled( ... )` e **do chamador** no legado, e e do
 * chamador aqui: a razao esta no cabecalho de {@link FilaNoEditor}, junto do
 * 🔴 conflito aberto entre BR-MIGRAR-034 e CA-6.4 da feature 005 — que esta
 * tarefa **nao decide**, e ao qual ela nao toma partido por reproduzir o ponto
 * que o legado tem aqui.
 *
 * ## Passo 8: os tres filtros mudam o que a tela ve, e nao o que o banco tem
 *
 * Os tres rodam **depois** de a linha estar gravada, recebem o que veio da
 * requisicao (nao o que foi gravado) e seus retornos passam por `(string)`. O
 * resultado vai para {@link ResultadoDaAberturaDoEditor.paraOFormulario}, que e
 * separado de {@link ResultadoDaAberturaDoEditor.gravado} de proposito: a
 * confusao entre os dois e o jeito mais facil de fazer `UT-031-5` (*"cria o
 * registro ... com corpo vazio"*) passar por acidente.
 *
 * ---
 *
 * # Como se confere que esta pasta tem paridade
 *
 * O criterio desta area e **efeito no banco** (area 3 da Decisao 2) — *"snapshot
 * + sequencia de comandos"* —, somado ao **valor devolvido pelo ponto de
 * extensao** e a **ordem de emissao** deles. Em `parity_specs.md` nao ha cenario
 * dedicado a abertura do editor: `PT-002` cobre UC-03 pelo lado da publicacao e
 * `PT-004` cobre o rascunho automatico pelo lado da **expiracao** (*"Rascunho
 * automatico expira pelo prazo proprio, por comparacao de data"*).
 *
 * **Nenhum dos dois e executavel hoje:** `parity_specs.md` registra que nao ha
 * oraculo executavel nesta arvore, e levanta-lo e T001 da feature 015. O que
 * esta pasta faz, e o que o `README.md` deste modulo manda fazer, e citar
 * **arquivo e linha** do legado em cada afirmacao, em vez de descrever
 * comportamento de memoria.
 */

import type { EstadoEditorial } from '../estado-editorial.js';
import {
  gravarConteudo,
  verdadeiroComoNoPhp,
  type ErroDaGravacao,
  type PedidoDeGravacao,
} from '../gravacao/index.js';
import type { Conteudo } from '../armazenamento/index.js';
import {
  GANCHO_DE_COLETA_DE_RASCUNHO_AUTOMATICO,
  RECORRENCIA_DA_COLETA_DE_RASCUNHO_AUTOMATICO,
  type ContextoDoEditor,
  type PedidoDeAberturaDoEditor,
} from './contexto-de-rascunho-automatico.js';
import {
  autorizarAberturaDoEditor,
  type RecusaDoEditor,
} from './permissao-do-editor.js';
import { ESTADO_DE_RASCUNHO_AUTOMATICO } from './visibilidade-do-rascunho-automatico.js';

/**
 * `__( 'Auto Draft' )` — o titulo com que a linha nasce
 * (`wp-admin/includes/post.php:777`).
 *
 * Fica em ingles porque o `msgid` **e** a chave do catalogo (`EC-05`), e a
 * traducao e de `plataforma/traducao/` — mesma postura, com a mesma ancora, de
 * `permissao-do-editor.ts` e de
 * `contextos/identidade-e-acesso/administracao-de-contas/mensagens-da-administracao.ts`.
 *
 * ⚠️ **Este valor vai para a coluna `post_title`, e isso e observavel.** Nao e
 * texto de tela: a tela o esconde (`wp-admin/includes/meta-boxes.php:159`, e o
 * rascunho rapido o esvazia em memoria,
 * `wp-admin/includes/dashboard.php:569`), mas o banco o tem — e o `guid` e o
 * identificador na URL derivados dele nao, porque `auto-draft` dispensa o
 * identificador (BR-MIGRAR-005). Traduzir aqui faria uma instalacao em pt-BR
 * gravar bytes diferentes dos do oraculo na mesma coluna.
 */
export const TITULO_DO_RASCUNHO_AUTOMATICO = 'Auto Draft';

/**
 * `title` — o recurso de tipo que decide se o titulo acima e usado
 * (`wp-admin/includes/post.php:777`).
 *
 * E a mesma cadeia que `RECURSOS_DO_CORPO_VAZIO` de T005 carrega, e **nao** e
 * importada dela: la ela e um dos tres suportes que decidem se a gravacao
 * acontece; aqui e o unico que decide o valor de uma coluna. Sao duas perguntas
 * independentes no legado, nas linhas `:4676` e `:777`, e amarra-las faria uma
 * mudar com a outra.
 */
export const RECURSO_DE_TITULO = 'title';

/** Por que a abertura do editor nao reservou registro, ou que ela reservou. */
export type DesfechoDaAberturaDoEditor =
  /** A linha foi gravada em `auto-draft`. */
  | 'rascunho-automatico-criado'
  /** As duas capacidades do tipo: `wp-admin/post-new.php:58`. */
  | 'sem-permissao'
  /**
   * `wp_insert_post()` devolveu erro, e o legado morre em `wp_die()`
   * (`:785`-`:787`).
   *
   * Os tres erros possiveis sao os de `ERROS_DA_GRAVACAO`, e o alcancavel neste
   * caminho e `empty_content` — para o tipo que suporta os tres recursos **e**
   * cujo interceptador de `wp_insert_post_empty_content` disse que sim. Data
   * invalida nao ocorre (este pedido nao informa data) e `invalid_post` nao
   * ocorre (nao informa `ID`).
   */
  | 'gravacao-recusada';

/**
 * O que a tela mostra, depois dos tres filtros do passo 8.
 *
 * **Nao e o que foi gravado**, e os nomes dizem isso. Os tres campos sao
 * `$post->post_content`, `$post->post_title` e `$post->post_excerpt` **depois**
 * de `apply_filters()`, com o `(string)` do legado aplicado.
 */
export interface ConteudoParaOFormulario {
  readonly corpo: string;
  readonly titulo: string;
  readonly resumo: string;
}

/** O que a operacao devolve. */
export interface ResultadoDaAberturaDoEditor {
  readonly desfecho: DesfechoDaAberturaDoEditor;
  /**
   * O identificador reservado, ou **`0`** quando nada foi gravado.
   *
   * `0` e o mesmo valor que `wp_insert_post()` devolve nos desfechos de falha
   * (ver `../gravacao/gravar.ts`), e e tambem o `ID` do objeto do ramo que nao
   * grava (`ID_DO_EDITOR_SEM_REGISTRO`). As duas coincidencias sao do legado.
   */
  readonly conteudoId: number;
  /** A linha como ficou gravada — o `get_post()` do passo 4 —, ou `null`. */
  readonly gravado: Conteudo | null;
  /** O que a tela mostra, depois dos tres filtros. `null` quando nada foi gravado. */
  readonly paraOFormulario: ConteudoParaOFormulario | null;
  /** A recusa de capacidade, ou `null`. */
  readonly recusa: RecusaDoEditor | null;
  /** O erro de `wp_insert_post()`, ou `null`. */
  readonly erro: ErroDaGravacao | null;
  /**
   * Se o evento de coleta foi posto na fila **nesta** abertura.
   *
   * `false` tanto quando ele ja estava agendado quanto quando nada foi gravado.
   * Nao e consumido por ramo nenhum: existe para que o passo 7 seja afirmavel
   * por teste — o legado descarta o retorno, e o **P7** proibe que o fluxo passe
   * a depender dele.
   */
  readonly coletaAgendadaAgora: boolean;
}

/** O que os tres desfechos sem gravacao tem em comum. */
const SEM_REGISTRO = {
  conteudoId: 0,
  gravado: null,
  paraOFormulario: null,
  coletaAgendadaAgora: false,
} as const;

/**
 * **A operacao de US-11.** Reserva o registro em rascunho automatico que o
 * salvamento automatico vai usar desde o primeiro caractere.
 *
 * **Permissao exigida: as duas capacidades do tipo** — o slot de editar **e** o
 * slot de criar (`wp-admin/post-new.php:58`), CA-11.1. A analise completa, com o
 * `&&` entre as duas e a razao pela qual de fabrica elas sao a mesma, esta em
 * `permissao-do-editor.ts`.
 *
 * A ordem dos passos e a do legado, e ela esta numerada na tabela do cabecalho.
 * Os passos que **nao** sao desta tarefa aparecem como comentario na posicao
 * exata em que o legado os tem: ausencia marcada e conferivel, ausencia
 * silenciosa e divergencia.
 */
export function abrirEditor(
  contexto: ContextoDoEditor,
  tipoDoConteudo: string,
  pedido: PedidoDeAberturaDoEditor = {},
): ResultadoDaAberturaDoEditor {
  // Passo 0 (`wp-admin/post-new.php:58`): as duas capacidades do tipo. No legado
  // esta guarda esta no chamador, e nao em `get_default_post_to_edit()` — que,
  // como `wp_insert_post()`, nao tem portao. Ela entra **nesta** funcao, e nao
  // no modulo, pela mesma razao que CA-1.1 entrou em `publicar`: o **P4** cobra
  // que a operacao exposta declare a permissao, e esta operacao e a exposta.
  const recusa = autorizarAberturaDoEditor(contexto, tipoDoConteudo);
  if (recusa !== null) {
    return {
      desfecho: 'sem-permissao',
      ...SEM_REGISTRO,
      recusa,
      erro: null,
    };
  }

  // Passo 1 (`:759`-`:771`): as tres leituras de `$_REQUEST`, com `esc_html( wp_unslash( ... ) )`.
  // Chegam no pedido, ja escapadas (ver `PedidoDeAberturaDoEditor`), e **nao**
  // entram no pedido de gravacao do passo 2. A coercao `?? ''` e o `$x = ''`
  // que precede cada `if` no legado.
  const tituloSugerido = pedido.tituloSugerido ?? '';
  const corpoSugerido = pedido.corpoSugerido ?? '';
  const resumoSugerido = pedido.resumoSugerido ?? '';

  // Passo 2 (`:775`-`:783`): `wp_insert_post()` com **tres** chaves, e so tres.
  // Tudo o mais e default daquela funcao — autor pelo ator, datas pelo relogio
  // do site, `comment_status` pelo default do tipo, `post_name` vazio porque
  // `auto-draft` dispensa unicidade (BR-MIGRAR-005). Montar aqui um pedido
  // maior produziria colunas que o legado nao escreve nesta abertura.
  const pedidoDeGravacao: PedidoDeGravacao = {
    titulo: contexto.gravacao.suportaRecurso(tipoDoConteudo, RECURSO_DE_TITULO)
      ? TITULO_DO_RASCUNHO_AUTOMATICO
      : '',
    tipo: tipoDoConteudo,
    estado: ESTADO_DE_RASCUNHO_AUTOMATICO,
  };
  const gravacao = gravarConteudo(contexto.gravacao, pedidoDeGravacao);

  // Passo 3 (`:785`-`:787`): `wp_die( $post_id->get_error_message() )`. Aqui o
  // erro e valor — ver a secao do cabecalho.
  if (gravacao.erro !== null) {
    return {
      desfecho: 'gravacao-recusada',
      ...SEM_REGISTRO,
      recusa: null,
      erro: gravacao.erro,
    };
  }

  const conteudoId = gravacao.conteudoId;

  // Passo 4 (`:789`): `get_post( $post_id )`. Passa pelo banco porque no legado
  // ela passa por `get_post()` com o cache daquela linha recem-invalidado —
  // mesma nota de leituras de `../gravacao/gravar.ts`.
  const gravado = contexto.gravacao.armazenamento.conteudo.obterPorId(conteudoId);

  // Passo 5 (`:791`-`:793`): o formato de conteudo. BC-07 (suporte do tema),
  // `plataforma/tipos-de-conteudo/` (suporte do tipo) e BC-02
  // (`set_post_format()`), e em instalacao de fabrica a condicao e falsa porque
  // `default_post_format` nasce vazia.

  // Passo 6 (`:795`): `wp_after_insert_post( $post, false, null )`, disparado a
  // mao porque o passo 2 passou `$fire_after_hooks = false`. **Nao e emitido**
  // (REQ-162 esta em `do-not-rewrite.md`): o gancho esta declarado em
  // `GanchosDoEditor`, com nome, argumentos e posicao — e a posicao e esta,
  // depois do formato de conteudo.
  contexto.ganchos?.depoisDeInserirConteudo?.(conteudoId, false, null);

  // Passo 7 (`:797`-`:800`): agendar a coleta, com a guarda do chamador.
  //
  // A guarda do legado e `! wp_next_scheduled( ... )`, e `wp_next_scheduled()`
  // devolve **`false` ou um instante** — logo a pergunta e a falsidade de PHP, e
  // nao a comparacao com `false`. A diferenca e estreita e real: um evento
  // agendado para o instante `0` e falso la, e a guarda agendaria **outro** por
  // cima. `verdadeiroComoNoPhp` e a mesma funcao que T005 usa nos dois filtros
  // que curto-circuitam a gravacao, e esta aqui pela mesma razao — ver
  // `../gravacao/verdade-de-php.ts`.
  const coletaAgendadaAgora = !verdadeiroComoNoPhp(
    contexto.fila.proximaOcorrencia(GANCHO_DE_COLETA_DE_RASCUNHO_AUTOMATICO),
  );
  if (coletaAgendadaAgora) {
    contexto.fila.agendarRecorrente({
      gancho: GANCHO_DE_COLETA_DE_RASCUNHO_AUTOMATICO,
      // `time()` (`:799`): o instante da propria abertura do editor.
      primeiroDisparoEmSegundos: contexto.relogio.agoraEmSegundos(),
      recorrencia: RECORRENCIA_DA_COLETA_DE_RASCUNHO_AUTOMATICO,
    });
  }

  // Passo 8 (`:831`, `:841`, `:851`): os tres filtros do formulario, na ordem do
  // legado — corpo, titulo, resumo. **Nao e a ordem dos campos na tela**, e a
  // ordem em que o legado os aplica, e e ela que a Decisao 2 compara.
  const paraOFormulario: ConteudoParaOFormulario = {
    corpo: comoCadeiaComoNoPhp(
      contexto.ganchos?.filtrarCorpoPadrao?.(corpoSugerido, conteudoId) ??
        corpoSugerido,
    ),
    titulo: comoCadeiaComoNoPhp(
      contexto.ganchos?.filtrarTituloPadrao?.(tituloSugerido, conteudoId) ??
        tituloSugerido,
    ),
    resumo: comoCadeiaComoNoPhp(
      contexto.ganchos?.filtrarResumoPadrao?.(resumoSugerido, conteudoId) ??
        resumoSugerido,
    ),
  };

  return {
    desfecho: 'rascunho-automatico-criado',
    conteudoId,
    gravado,
    paraOFormulario,
    recusa: null,
    erro: null,
    coletaAgendadaAgora,
  };
}

/**
 * O `(string)` que o legado aplica ao retorno dos tres filtros (`:831`, `:841`,
 * `:851`).
 *
 * Tres coercoes do PHP que este runtime nao faz igual, e as tres importam porque
 * o valor vai para um campo de formulario:
 *
 * | o filtro devolveu | PHP grava | JavaScript faria |
 * |---|---|---|
 * | `null` | `''` | `'null'` |
 * | `false` | `''` | `'false'` |
 * | `true` | `'1'` | `'true'` |
 *
 * As demais (numero, cadeia) coincidem. Objeto sem `__toString()` e erro fatal
 * no legado, e aqui cai no `String()` — e essa divergencia esta declarada porque
 * um interceptador que devolva objeto e, no legado, uma requisicao morta.
 *
 * Fica nesta pasta, e nao em `../gravacao/verdade-de-php.ts`, porque aquele
 * arquivo e sobre `empty()` e sobre a **verdade** de PHP: esta e a **conversao**
 * para cadeia, que e outra tabela do mesmo manual. Quando `plataforma/` tiver a
 * sua, esta vem de la.
 */
function comoCadeiaComoNoPhp(valor: unknown): string {
  if (valor === null || valor === undefined || valor === false) {
    return '';
  }
  if (valor === true) {
    return '1';
  }
  return String(valor);
}

/**
 * O estado em que a linha nasce — exposto para que o teste o afirme sem
 * reescrever a cadeia.
 *
 * **Nao e `ESTADO_PADRAO_DA_APLICACAO`** de `../estado-editorial.ts`. Este caminho informa o estado
 * explicitamente, logo a primeira barreira de US-2 (o `draft` dos defaults) nao
 * se aplica e a segunda (o `empty()`) tambem nao — `'auto-draft'` nao e vazio. E
 * exatamente por isso que esta operacao e a **unica** porta que cria conteudo
 * nesse estado, que e a segunda metade de CA-11.3.
 */
export const ESTADO_COM_QUE_O_EDITOR_RESERVA: EstadoEditorial =
  ESTADO_DE_RASCUNHO_AUTOMATICO;
