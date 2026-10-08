/**
 * **CA-3.2**: *"a regra e aplicada de novo na publicacao, para todo contexto que
 * declare padrao"*.
 *
 * Entrega de **T007** da feature `003-classificacao-do-conteudo` (US-3), e e a
 * metade desta tarefa que **nao tem laco**: o laco da publicacao
 * (`wp-includes/post.php:5419`-`:5439`) foi portado por **T003 da feature
 * `002-autoria-e-publicacao`**, em
 * `../../conteudo/publicacao/termo-padrao-na-publicacao.ts`, sobre uma interface
 * que BC-01 **declarou** e que este modulo tinha de implementar. O `README.md`
 * deste modulo registrou a divida com nome e numero: *"BC-01 ja declarou a porta
 * que o faz (`ClassificacaoNaPublicacao.definirTermos`), e e esta tarefa que a
 * implementa"*.
 *
 * Este arquivo e, portanto, a **imagem espelhada** de
 * `ConteudoNaClassificacao`: la BC-02 declara tres perguntas e BC-01 as responde;
 * aqui BC-01 declara quatro e BC-02 as responde. As duas metades existem pela
 * mesma razao — AD-10 e a regra de dependencia 3 de `target_architecture.md`
 * proibem `contextos/<a>/` importar `contextos/<b>/` *"sempre, sem excecao"* e
 * mandam resolver **toda** chamada entre contextos no momento da chamada.
 *
 * ---
 *
 * # OS NOMES SAO OS DE BC-01, e isso e o contrato
 *
 * ⚠️ Este arquivo fala *"taxonomia"* e *"termo"*, e nao *"contexto"* e *"rotulo"*
 * como o resto deste modulo. **Nao e descuido e nao se conserta:** a compatibilidade
 * entre os dois lados e **estrutural**, porque nao ha `import` que a declare — o
 * compilador so a confere no ponto de composicao, que e quem tem os dois modulos
 * em maos. Traduzir `taxonomiasDoTipo` para `contextosDoTipo` produziria um objeto
 * que **nao** satisfaz a interface de BC-01, e o erro so apareceria na composicao.
 *
 * Os quatro metodos, como `../../conteudo/publicacao/contexto-de-publicacao.ts`
 * os declara, e o que cada um e deste lado:
 *
 * | metodo de BC-01 | no legado | aqui |
 * |---|---|---|
 * | `taxonomiasDoTipo( tipo )` | `get_object_taxonomies( $post->post_type, 'object' )` (`:5420`) | `contextosDoTipoDeObjeto()`, de T003, reduzido aos dois campos que o laco le |
 * | `termosDoConteudo( id, taxonomia )` | `get_the_terms( $post, $taxonomy )` (`:5427`) | a leitura inversa da juncao, de T002/T005, com a **forma de erro** preservada |
 * | `opcaoDeTermoPadrao( chave )` | `(int) get_option( $chave, 0 )` (`:5432` e `:5434`) | repassa a {@link OpcoesNaClassificacao}, que e a colaboracao de T007 |
 * | `definirTermos( id, termos, taxonomia )` | `wp_set_post_terms( ... )` (`:5438`) | a substituicao integral de T005, com o retorno **descartado** |
 *
 * # A forma de erro de `termosDoConteudo` nao e caminho raro: ela SALTA o conteudo
 *
 * BC-01 escreveu o aviso no tipo, e ele vale palavra por palavra deste lado: o
 * laco e `if ( ! empty( get_the_terms( $post, $taxonomy ) ) ) { continue; }`, e
 * `! empty()` sobre um `WP_Error` e **verdadeiro** — logo contexto invalido faz o
 * laco **pular** a atribuicao do padrao, exatamente como faz um conteudo que ja
 * tem termo. Por isso este arquivo devolve `{ erro: true, codigo:
 * 'invalid_taxonomy' }` em vez de lista vazia quando o contexto nao esta
 * registrado: *"um porte que tratasse erro como 'sem termos' atribuiria o padrao
 * onde o legado nao atribui, e isso e efeito no banco"*.
 *
 * O codigo e a mensagem sao os de `../rotulo-e-contexto/erro-de-termo.ts`, que
 * T003 transcreveu do legado — `invalid_taxonomy`, *"Invalid taxonomy."* —, e e o
 * mesmo erro que `wp_set_object_terms()` devolve pelo mesmo motivo
 * (`taxonomy.php:2856`).
 *
 * # ⚠️ Nenhum metodo deste arquivo cobra capacidade, e isso e leitura do legado
 *
 * O laco da publicacao roda **sem ator**: `wp_publish_post()` nao tem ninguem
 * autenticado quando a fila agendada o chama, e `wp_set_post_terms()` nao verifica
 * capacidade nenhuma — `../vinculo-de-objeto/substituir-vinculos.ts` registra os
 * tres chamadores sem ator, e `post.php:5438` e um deles. Cobrar `assign_terms`
 * aqui faria a publicacao agendada deixar de aplicar o termo padrao, e e
 * exatamente a assimetria que `termo-padrao-na-gravacao.ts` analisa: no caminho de
 * **gravacao** a capacidade e cobrada, no de **publicacao** nao.
 *
 * E por isso que {@link criarClassificacaoNaPublicacao} recebe
 * {@link ColaboracaoDoTermoPadraoSemAtor} e nao a colaboracao com ator.
 *
 * # O que este arquivo NAO faz
 *
 * - **Nao decide quando aplicar o padrao na publicacao.** Os cinco ramos do laco
 *   sao de BC-01 e **estao merged**; este lado so responde. Reimplementa-los aqui
 *   criaria duas copias da mesma regra, que divergiriam na primeira mudanca.
 * - **Nao conta termo.** A recontagem da transicao e outro ouvinte, declarado em
 *   `../../conteudo/publicacao/transicao-de-estado.ts`; a contagem que sai por
 *   dentro da atribuicao e de T005.
 * - **Nao le o cache de objeto.** `get_the_terms()` passa por
 *   `get_object_term_cache()` antes da consulta, e nao ha cache nesta arvore
 *   (borda 5 de `target_architecture.md`, `REQ-165` nao decidida). A consequencia
 *   e uma leitura por chamada em vez de zero, e e a mesma que T003 e T005
 *   declararam em todas as operacoes deste modulo.
 */

import {
  contextosDoTipoDeObjeto,
  type CodigoDeErroDeTermo,
} from '../rotulo-e-contexto/index.js';
import {
  normalizarRotulosDoConteudo,
  substituirVinculosDoObjeto,
  type EscopoDeVinculoDeObjeto,
} from '../vinculo-de-objeto/index.js';
import type { ColaboracaoDoTermoPadraoSemAtor } from './escopo-de-termo-padrao.js';

/**
 * `invalid_taxonomy` — o codigo que `termosDoConteudo()` devolve para contexto nao
 * registrado.
 *
 * Declarado com o tipo de T003 (`CodigoDeErroDeTermo`) para que o compilador o
 * amarre a enumeracao transcrita do legado em
 * `../rotulo-e-contexto/erro-de-termo.ts`, e nao a uma cadeia solta: um erro de
 * digitacao aqui faria o laco de BC-01 tratar o caso como "ja tem termo" pelo
 * motivo errado.
 */
const CODIGO_DE_CONTEXTO_NAO_REGISTRADO: CodigoDeErroDeTermo =
  'invalid_taxonomy';

/**
 * Uma taxonomia como `get_object_taxonomies( $tipo, 'object' )` a devolve, nos
 * **dois** campos que o laco de BC-01 le.
 *
 * Os nomes dos campos sao os de `TaxonomiaNaPublicacao`, em
 * `../../conteudo/publicacao/contexto-de-publicacao.ts`. Ver *OS NOMES SAO OS DE
 * BC-01* no cabecalho.
 */
export interface TaxonomiaNaPublicacao {
  /** `$tax_object->name` — e e por **nome** que a categoria e excecao no ramo 1. */
  readonly nome: string;
  /**
   * `! empty( $tax_object->default_term )` — se o **registro** declarou termo
   * padrao.
   *
   * ⚠️ E so a verdade do campo, e nao o objeto: o conteudo de `default_term`
   * (nome, apelido, descricao) e consumido por `register_taxonomy()`, que cria o
   * termo e grava o identificador dele na opcao. Logo quem publica le a **opcao**,
   * nao o registro — a separacao esta inteira em
   * `../registro/contexto-de-classificacao.ts` e em `chave-do-termo-padrao.ts`.
   *
   * **E `false` nos oito contextos do nucleo**, inclusive em `category`: e por
   * isso que o ramo 1 do laco trata a categoria por nome.
   */
  readonly declaraTermoPadrao: boolean;
}

/**
 * O que `get_the_terms()` devolve, nas duas formas que o laco distingue.
 *
 * A forma de erro e a que **salta** o conteudo — ver o cabecalho. Os nomes dos
 * campos sao os de `TermosDoConteudoNaPublicacao`, em BC-01.
 */
export type TermosDoConteudoNaPublicacao =
  | {
      readonly erro: false;
      /** Os identificadores dos termos; lista vazia e ausencia. */
      readonly termos: readonly number[];
    }
  | {
      readonly erro: true;
      /** O codigo do `WP_Error`, como `invalid_taxonomy`. */
      readonly codigo: string;
    };

/**
 * As quatro chamadas que `wp_publish_post()` faz a este modulo.
 *
 * **E sincrona**, como todo `contextos/`: AD-04 fixa a fronteira de `await` em
 * `adaptadores/`.
 */
export interface ClassificacaoNaPublicacao {
  /**
   * `get_object_taxonomies( $post->post_type, 'object' )` (`post.php:5420`).
   *
   * **A ordem e a do registro, e ela e dado:** e ela que fixa a ordem dos comandos
   * que saem do laco, e a area 3 da Decisao 2 de `parity_specs.md` compara
   * *"snapshot + sequencia de comandos"*.
   */
  taxonomiasDoTipo(tipo: string): readonly TaxonomiaNaPublicacao[];

  /** `get_the_terms( $post, $taxonomy )` (`:5427`). */
  termosDoConteudo(
    conteudoId: number,
    taxonomia: string,
  ): TermosDoConteudoNaPublicacao;

  /** `(int) get_option( $chave, 0 )` (`:5432` e `:5434`). */
  opcaoDeTermoPadrao(chave: string): number;

  /**
   * `wp_set_post_terms( $post->ID, array( $default_term_id ), $taxonomy )`
   * (`:5438`).
   *
   * **Nao devolve nada, e e de proposito** (P7): no legado a funcao devolve
   * `array|false|WP_Error` e `wp_publish_post()` **ignora** o retorno — falha de
   * atribuicao de termo nao interrompe a publicacao e nao e registrada.
   */
  definirTermos(
    conteudoId: number,
    termos: readonly number[],
    taxonomia: string,
  ): void;
}

/**
 * Monta a implementacao que BC-01 consome, fechada sobre **esta** composicao e
 * **esta** colaboracao.
 *
 * **Nao e operacao e nao declara permissao**, pelo mesmo motivo que o
 * `armazenamento` do modulo nao declara: ela nao decide nada. Quem decide e o
 * laco de BC-01, e o que cada metodo cobra (nada) esta no cabecalho.
 *
 * Fechar sobre a composicao, e nao sobre o modulo, e o mesmo `EXT-CONTEXTO`
 * (`BR-MIGRAR-105`, dimensao **D-A** de `parity_specs.md`) que faz o registro de
 * contextos nascer dentro de `criarModuloDeClassificacao()`: duas publicacoes
 * concorrentes recebem dois objetos, e nenhuma enxerga o contexto que uma extensao
 * registrou na outra.
 */
export function criarClassificacaoNaPublicacao(
  escopo: EscopoDeVinculoDeObjeto,
  colaboracao: ColaboracaoDoTermoPadraoSemAtor,
): ClassificacaoNaPublicacao {
  return {
    taxonomiasDoTipo(tipo) {
      return contextosDoTipoDeObjeto(escopo, tipo).map((contexto) => ({
        nome: contexto.nome,
        declaraTermoPadrao: contexto.rotuloPadrao !== null,
      }));
    },

    termosDoConteudo(conteudoId, taxonomia) {
      // `wp_get_object_terms()` devolve `WP_Error( 'invalid_taxonomy' )` quando o
      // contexto nao esta registrado (`taxonomy.php:2856` e a guarda gemea de
      // `wp_set_object_terms()`), e e esse erro que o laco trata como "ja tem
      // termo". Ver *A forma de erro* no cabecalho.
      if (!escopo.contextos.existe(taxonomia)) {
        return { erro: true, codigo: CODIGO_DE_CONTEXTO_NAO_REGISTRADO };
      }

      return {
        erro: false,
        termos: escopo.armazenamento.vinculos.listarRotulosDoObjeto(
          conteudoId,
          taxonomia,
        ),
      };
    },

    opcaoDeTermoPadrao(chave) {
      // A chave chega **montada por BC-01** (`chaveDoTermoPadrao()`, que existe
      // dos dois lados — ver `chave-do-termo-padrao.ts`). Este lado nao a
      // remonta: remonta-la aqui faria a escolha da opcao acontecer duas vezes,
      // e a divergencia entre as duas copias deixaria de ser visivel.
      return colaboracao.opcoes.identificadorDoTermoPadrao(chave);
    },

    definirTermos(conteudoId, termos, taxonomia) {
      // `wp_set_post_terms()` normaliza por hierarquia antes de chamar
      // `wp_set_object_terms()` (`post.php:5190` e `:5212`), e a normalizacao
      // **nao e no-op** nem para uma lista de inteiros: em contexto hierarquico
      // ela deduplica. Ver `../vinculo-de-objeto/rotulos-informados.ts`.
      const hierarquico = escopo.contextos.obter(taxonomia)?.hierarquico ?? false;

      // O retorno e **descartado**, como `wp_publish_post()` o descarta (P7).
      substituirVinculosDoObjeto(escopo, colaboracao, {
        objetoId: conteudoId,
        contexto: taxonomia,
        rotulos: normalizarRotulosDoConteudo(hierarquico, termos),
        acrescentar: false,
      });
    },
  };
}
