/**
 * O registro de contextos de classificacao — o `$wp_taxonomies` do legado, e as
 * cinco funcoes publicadas que o leem e escrevem.
 *
 * | aqui | no legado |
 * |---|---|
 * | {@link RegistroDeContextos.registrar} | `register_taxonomy()`, `taxonomy.php:518` |
 * | {@link RegistroDeContextos.existe} | `taxonomy_exists()`, `taxonomy.php:376` |
 * | {@link RegistroDeContextos.obter} | `get_taxonomy()`, `taxonomy.php:350` |
 * | {@link RegistroDeContextos.listar} | `get_taxonomies()`, `taxonomy.php:282` |
 * | {@link RegistroDeContextos.remover} | `unregister_taxonomy()`, `taxonomy.php:605` |
 *
 * As cinco entram porque o **P8** e absoluto — *"nao remova funcao, constante,
 * tabela, rota, superficie nem comportamento publicado"* —, inclusive
 * {@link RegistroDeContextos.remover}, que nos oito contextos do nucleo **nunca
 * consegue remover nada**: existir e recusar e o comportamento dela.
 *
 * ---
 *
 * ## Por que o registro e uma instancia, e nao um modulo com estado
 *
 * 🔴 **E a correcao mais importante deste arquivo.** No legado `$wp_taxonomies` e
 * uma `global`, e isso funciona porque o processo morre no fim da resposta — o
 * escopo de requisicao sai de graca. `parity_specs.md` da nome a travessia:
 * **D-A, "escopo de requisicao para escopo de processo"**, a dimensao que
 * *"nenhuma linha de nenhum catalogo cobre"*, e `BR-MIGRAR-105` (`EXT-CONTEXTO`)
 * manda que nada disso vire estado de modulo.
 *
 * O registro e **mutavel por projeto**: uma extensao registra contexto em
 * execucao, e e isso que faz `register_taxonomy()` ser API publica e nao detalhe
 * de arranque. Logo nao basta congelar os oito num `const` exportado: o registro
 * precisa ser escrevivel **e** por requisicao. Uma instancia por composicao
 * entrega as duas coisas; um mapa no escopo do modulo entregaria a primeira e
 * perderia a segunda, e duas requisicoes concorrentes passariam a enxergar os
 * contextos uma da outra.
 *
 * O slot de isolamento escolhido (processo por requisicao, modelo CGI) tornaria
 * o `global` seguro de novo — mas o criterio de `AD-11` e a arvore ser
 * verificavel sem depender dele. Ver `modulo.test.ts`.
 *
 * ## O que esta funcao faz do legado, e o que ela nao faz
 *
 * `register_taxonomy()` do legado tem seis passos. Aqui ficam o 1, o 2 e o 5:
 * validar o nome, resolver os argumentos e gravar no registro. Ficam **fora**,
 * cada um com dono:
 *
 * | passo do legado | onde | por que nao aqui |
 * |---|---|---|
 * | `add_rewrite_rules()` | `taxonomy.php:533` | regra de reescrita e `plataforma/rotas` / BC-08 |
 * | `add_hooks()` | `taxonomy.php:537` | precisa do barramento, que nao existe nesta arvore |
 * | criar o rotulo padrao e gravar a opcao | `taxonomy.php:539` a `:558` | **escreve no banco e cria rotulo** — e T002 que porta a gravacao e T007 a regra do padrao. Nenhum dos oito contextos do nucleo entra nesse ramo, logo T001 nao o alcanca |
 * | as duas acoes e os dois filtros | `taxonomy.php:570`, `:588`; `class-wp-taxonomy.php:316`, `:337` | **P2**: contrato publico sem barramento para emitir. Declarado em `contexto-de-classificacao.ts` |
 * | `_doing_it_wrong()` no nome invalido | `taxonomy.php:528` | o aviso de uso indevido e da plataforma; a **recusa**, que e o observavel, esta aqui |
 */

import {
  LIMITE_DE_BYTES_DO_NOME_DO_CONTEXTO,
  resolverContexto,
  type ContextoDeClassificacao,
  type DeclaracaoDeContexto,
} from './contexto-de-classificacao.js';
import { CONTEXTOS_DO_NUCLEO } from './contextos-do-nucleo.js';
import {
  MENSAGENS_DE_ERRO_DE_REGISTRO,
  erroDeRegistro,
  type ErroDeRegistro,
} from './erro-de-registro.js';

/** O registro, com a superficie das cinco funcoes publicadas do legado. */
export interface RegistroDeContextos {
  /**
   * `register_taxonomy()`. Devolve o contexto resolvido, ou o erro — **nunca
   * lanca**, ver `erro-de-registro.ts`.
   *
   * Registrar com um nome que ja existe **substitui** o anterior, como o legado
   * faz (`$wp_taxonomies[ $taxonomy ] = $taxonomy_object`): nao ha recusa por
   * duplicidade, e e assim que uma extensao redeclara `category`.
   */
  registrar(
    nome: string,
    declaracao: DeclaracaoDeContexto,
  ): ContextoDeClassificacao | ErroDeRegistro;

  /** `taxonomy_exists()`. */
  existe(nome: string): boolean;

  /** `get_taxonomy()`. Contexto inexistente devolve `null`, o `false` do legado. */
  obter(nome: string): ContextoDeClassificacao | null;

  /** `get_taxonomies()`, com `output = 'objects'`: **na ordem de insercao**. */
  listar(): readonly ContextoDeClassificacao[];

  /**
   * `unregister_taxonomy()`. Devolve `true`, ou o erro.
   *
   * Dois caminhos de recusa, **com o mesmo codigo e mensagens diferentes**, como
   * no legado: contexto inexistente e contexto do nucleo.
   */
  remover(nome: string): true | ErroDeRegistro;
}

/** `empty( $taxonomy ) || strlen( $taxonomy ) > 32`, com `strlen` em bytes. */
function nomeInvalido(nome: string): boolean {
  if (nome === '') {
    return true;
  }
  // `strlen` do PHP conta bytes. Ver LIMITE_DE_BYTES_DO_NOME_DO_CONTEXTO.
  const bytes = new TextEncoder().encode(nome).length;
  return bytes > LIMITE_DE_BYTES_DO_NOME_DO_CONTEXTO;
}

/**
 * Cria um registro vazio.
 *
 * Existe separado de {@link criarRegistroComOsContextosDoNucleo} porque o teste
 * da resolucao de argumentos precisa de um registro sem os oito dentro, e
 * porque o legado tambem tem os dois momentos: a `global` nasce vazia e
 * `create_initial_taxonomies()` a povoa.
 */
export function criarRegistroDeContextos(): RegistroDeContextos {
  // Fechado sobre esta chamada, nao sobre o modulo: e o ponto todo de D-A.
  const contextos = new Map<string, ContextoDeClassificacao>();

  return {
    registrar(nome, declaracao) {
      if (nomeInvalido(nome)) {
        return erroDeRegistro(
          'taxonomy_length_invalid',
          MENSAGENS_DE_ERRO_DE_REGISTRO.taxonomy_length_invalid,
        );
      }

      const contexto = resolverContexto(nome, declaracao);
      contextos.set(nome, contexto);
      return contexto;
    },

    existe(nome) {
      return contextos.has(nome);
    },

    obter(nome) {
      return contextos.get(nome) ?? null;
    },

    listar() {
      return [...contextos.values()];
    },

    remover(nome) {
      const contexto = contextos.get(nome);

      if (contexto === undefined) {
        return erroDeRegistro(
          'invalid_taxonomy',
          MENSAGENS_DE_ERRO_DE_REGISTRO.invalid_taxonomy,
        );
      }

      if (contexto.integradoAoNucleo) {
        return erroDeRegistro(
          'invalid_taxonomy',
          MENSAGENS_DE_ERRO_DE_REGISTRO.invalid_taxonomy_do_nucleo,
        );
      }

      contextos.delete(nome);
      return true;
    },
  };
}

/**
 * `create_initial_taxonomies()`: um registro novo com os oito do nucleo dentro,
 * na ordem do legado.
 *
 * ⚠️ **O legado chama isto duas vezes por requisicao** — uma em
 * `wp-settings.php`, antes de carregar as extensoes, *"por razoes de
 * retrocompatibilidade"*, e outra na acao `init` (`taxonomy.php:16` a `:18`) —, e
 * a segunda chamada e que resolve as regras de reescrita. O que **muda** entre as
 * duas e exatamente o que este modulo nao porta (`rewrite`, `query_var` e os
 * rotulos traduzidos), logo aqui a repeticao seria idempotente e nao ha o que
 * reproduzir. Quem porta a ordem de arranque e o dono dessa decisao, e ela esta
 * na tabela *Nao negociavel* da constituicao.
 */
export function criarRegistroComOsContextosDoNucleo(): RegistroDeContextos {
  const registro = criarRegistroDeContextos();

  for (const contexto of CONTEXTOS_DO_NUCLEO) {
    registro.registrar(contexto.nome, contexto.declaracao);
  }

  return registro;
}
