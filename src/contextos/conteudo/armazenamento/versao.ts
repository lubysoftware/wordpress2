/**
 * A forma de armazenamento da versao anterior — e ela **nao tem tabela**.
 *
 * A secao *Modelo de dados* do plano e de uma linha so, e e a linha inteira:
 * versoes anteriores sao *"linhas de `posts` do tipo `revision`, com
 * `post_parent` apontando para o original"*, e *"continuam sendo conteudo, nao
 * tabela propria"*. `target_data_model.md` registra `Revisao` como
 * `AGG-Revisao` sobre `{p}posts (post_type='revision')`, com `ID` de chave.
 *
 * Por isso este arquivo nao tem repositorio proprio de escrita: gravar uma
 * versao e gravar **conteudo**, pelo mesmo caminho e com os mesmos pontos de
 * extensao — no legado, `_wp_put_post_revision()` chama `wp_insert_post()`
 * (`wp-includes/revision.php:372`). O que existe aqui e o que a versao tem de
 * **proprio**: os campos que o legado copia, os que ele se recusa a copiar, a
 * convencao do identificador na URL e as leituras pela auto-referencia.
 *
 * ── A ARMADILHA: O QUE O LEGADO *NAO* COPIA ────────────────────────────────
 *
 * `_wp_post_revision_fields()` (`wp-includes/revision.php:22`) declara **tres**
 * campos versionaveis, aplica o filtro `_wp_post_revision_fields` — ponto de
 * extensao publico, logo terceiro acrescenta campo — e **depois** remove nove
 * nomes da lista, com o comentario *"WP uses these internally either in
 * versioning or elsewhere - they cannot be versioned"* (`:57`). A ordem importa:
 * o filtro nao consegue versionar nenhum dos nove, mesmo que os declare.
 *
 * E entre os nove esta `post_author`. A consequencia e observavel e surpreende:
 * como o autor nao e copiado do original, `wp_insert_post()` aplica o default
 * dele — `get_current_user_id()` (`wp-includes/post.php:4603` e `:4607`) —, logo
 * **a versao fica com o autor de quem a gravou, nao com o autor do conteudo**.
 * E assim que a tela de versoes mostra quem fez cada alteracao, e e por isso que
 * {@link camposDaVersao} nao devolve autor nenhum: o autor e de quem compoe a
 * gravacao (T021), e nao deste arquivo. Isto nao contradiz CA-8.2 — *"a
 * publicacao mantem o autor original gravado no registro"* —, porque o registro
 * de CA-8.2 e o conteudo, nao a versao dele.
 *
 * ── O QUE NAO ESTA AQUI, POR SER DE OUTRA TAREFA ───────────────────────────
 *
 * - **Quantas versoes se guardam.** `WP_POST_REVISIONS` e
 *   `wp_revisions_to_keep()` sao CA-10.2 e entram em **T021**, cada numero num
 *   ponto de configuracao nomeado com o valor de fabrica, como o **P6** exige.
 *   Nenhum numero aparece neste arquivo.
 * - **Se as versoes estao ligadas.** `wp_get_post_revisions()` devolve lista
 *   vazia **sem consultar o banco** quando `wp_revisions_enabled()` e falso
 *   (`wp-includes/revision.php:680`). A guarda e da operacao, nao da leitura:
 *   {@link RepositorioDeVersoes.listar} consulta sempre, e quem decide se
 *   pergunta e T021.
 * - **O intervalo do salvamento automatico.** `AUTOSAVE_INTERVAL` e CA-11.4, de
 *   T023.
 * - **A exclusao recursiva da versao junto do pai.** `EXT-EXCLUSAO`
 *   (BR-MIGRAR-104) e a feature 005, e o cenario de `PT-002` que a menciona
 *   afirma o que fica depois: *"as duas metades apagam as revisoes pelo mesmo
 *   caminho de exclusao"*.
 */

import type { PortaDeDados } from '../portas/index.js';
import { tabelaDeConteudo } from './chaves-e-tabelas.js';
import { primeiraLinha } from './leitura-de-linha.js';
import { lerConteudo, type Conteudo } from './conteudo.js';
import { TIPO_DE_VERSAO, type VinculoComOPai } from './vinculo-com-o-pai.js';

/**
 * `inherit` — o estado de toda versao (`wp-includes/revision.php:89`).
 *
 * E o estado que a spec chama de herdado: a visibilidade da versao e a do
 * conteudo que ela versiona, e `inherit` e um dos 12 do vocabulario de fabrica
 * (`../estado-editorial.ts`), com a excecao registrada ali — interno **e** na
 * busca.
 */
export const ESTADO_DE_VERSAO = 'inherit';

/**
 * Os **tres** campos que o legado versiona, na ordem em que os declara
 * (`wp-includes/revision.php:32` a `:34`).
 *
 * ⚠️ E lista **filtravel**, nao fechada: `_wp_post_revision_fields` e ponto de
 * extensao publico (P2), e este valor e o default de fabrica. Nenhuma funcao
 * deste arquivo recusa campo fora da lista — recusar seria estreitar o ponto de
 * extensao, que cai na tabela *Nao negociavel* da constituicao.
 */
export const CAMPOS_VERSIONAVEIS: readonly (keyof CamposVersionados)[] =
  Object.freeze(['titulo', 'corpo', 'resumo'] as const);

/**
 * Os **nove** nomes que o legado remove da lista **depois** do filtro
 * (`wp-includes/revision.php:57`), com os nomes das colunas do legado porque e
 * assim que a extensao os declara.
 *
 * Estao aqui como dado para quem for implementar o filtro: sao a parte do
 * contrato que diz o que o ponto de extensao **nao** pode fazer.
 */
export const COLUNAS_NAO_VERSIONAVEIS: readonly string[] = Object.freeze([
  'ID',
  'post_name',
  'post_parent',
  'post_date',
  'post_date_gmt',
  'post_status',
  'post_type',
  'comment_count',
  'post_author',
] as const);

/** Os campos que a versao copia do original. */
export interface CamposVersionados {
  readonly titulo: string;
  readonly corpo: string;
  readonly resumo: string;
}

/**
 * A linha de versao como `_wp_post_revision_data()` a monta
 * (`wp-includes/revision.php:75` a `:95`): os tres campos copiados mais os seis
 * que ela fixa.
 *
 * **Sao nove de 21.** Os outros doze — `post_author` entre eles, ver o cabecalho
 * — vem dos defaults de `wp_insert_post()`, e resolver default e da tarefa que
 * grava. Devolver aqui uma linha completa obrigaria este arquivo a decidir autor
 * e data de modificacao, que o legado decide depois.
 */
export interface CamposDaVersao extends CamposVersionados {
  readonly vinculo: VinculoComOPai;
  readonly estado: string;
  readonly tipo: string;
  readonly identificadorNaUrl: string;
  /** `post_date` = o `post_modified` do original, e nao a hora corrente. */
  readonly data: string;
  /** `post_date_gmt` = o `post_modified_gmt` do original. */
  readonly dataGmt: string;
}

/**
 * O identificador na URL de uma versao: `{id do original}-revision-v1`, ou
 * `-autosave-v1` quando e salvamento automatico
 * (`wp-includes/revision.php:91`).
 *
 * O `v1` e, nas palavras do legado, a versao do **sistema de versionamento** —
 * *"'1' is the revisioning system version"* —, nao o numero da versao do
 * conteudo. Nao ha `-v2` em lugar nenhum desta arvore, e inventar um mudaria o
 * que {@link versaoDoNome} le.
 *
 * Este nome **nao** passa pela cobranca de unicidade: BR-MIGRAR-005 dispensa a
 * unicidade do identificador em revisao, e e por isso que todas as versoes de um
 * conteudo tem o mesmo `post_name`. Um porte que tornasse o identificador unico
 * renomearia a segunda versao e quebraria as duas leituras deste arquivo.
 */
export function nomeDaVersao(
  idDoOriginal: number,
  autosave: boolean,
): string {
  return autosave
    ? `${String(idDoOriginal)}-autosave-v1`
    : `${String(idDoOriginal)}-revision-v1`;
}

/** O que o nome de uma versao carrega. */
export interface NomeDeVersao {
  readonly idDoOriginal: number;
  readonly autosave: boolean;
  /** O numero do sistema de versionamento (o `1` de `-v1`). */
  readonly sistemaDeVersionamento: number;
}

/**
 * A leitura do nome, pela mesma expressao do legado:
 * `/^\d+-(?:autosave|revision)-v(\d+)$/` (`wp-includes/revision.php:996`).
 *
 * Devolve `null` quando o nome nao e de versao — e o `0` que
 * `_wp_get_post_revision_version()` devolve nesse caso e decisao de quem chama,
 * nao desta leitura.
 */
export function versaoDoNome(nome: string): NomeDeVersao | null {
  const achado = /^(\d+)-(autosave|revision)-v(\d+)$/.exec(nome);
  if (achado === null) {
    return null;
  }
  return {
    idDoOriginal: Number.parseInt(achado[1] as string, 10),
    autosave: achado[2] === 'autosave',
    sistemaDeVersionamento: Number.parseInt(achado[3] as string, 10),
  };
}

/**
 * Se a linha e salvamento automatico, pela pergunta que o legado faz:
 * `str_contains( $post->post_name, "{$post->post_parent}-autosave" )`
 * (`wp-includes/revision.php:336`).
 *
 * E **conter**, nao **ser** — e a diferenca e observavel: o legado tambem aceita
 * o nome historico `{id}-autosave` sem o `-v1`, que
 * `_wp_upgrade_revisions_of_post()` renomeia (`wp-includes/revision.php:1071`).
 * Trocar por igualdade com {@link nomeDaVersao} recusaria a linha antiga.
 */
export function eSalvamentoAutomatico(
  identificadorNaUrl: string,
  idDoOriginal: number,
): boolean {
  return identificadorNaUrl.includes(`${String(idDoOriginal)}-autosave`);
}

/**
 * Os nove campos de uma versao do conteudo dado.
 *
 * `data` e `dataGmt` saem do **`post_modified`** do original, e isso tem efeito
 * na leitura: a lista de versoes e ordenada por `post_date`, logo a ordem das
 * versoes e a ordem das modificacoes do conteudo.
 */
export function camposDaVersao(
  original: Conteudo,
  autosave = false,
): CamposDaVersao {
  return {
    titulo: original.titulo,
    corpo: original.corpo,
    resumo: original.resumo,
    vinculo: { tipo: 'original-da-versao', id: original.id },
    estado: ESTADO_DE_VERSAO,
    tipo: TIPO_DE_VERSAO,
    identificadorNaUrl: nomeDaVersao(original.id, autosave),
    data: original.modificadoEm,
    dataGmt: original.modificadoEmGmt,
  };
}

export interface RepositorioDeVersoes {
  /**
   * As versoes de um conteudo, da mais recente para a mais antiga.
   *
   * Os tres criterios de busca e os dois de ordem sao os de
   * `wp_get_post_revisions()` (`wp-includes/revision.php:666` a `:700`):
   * `post_parent` o conteudo, `post_type` a versao, `post_status` o herdado, e
   * `order => DESC` com `orderby => 'date ID'`.
   *
   * ⚠️ A **cadeia** nao e a mesma: no legado quem a monta e `WP_Query`, por
   * fragmento e com um ponto de filtro entre cada um — e e por isso que o
   * legado, quando quer a lista crua, diz no comentario que esta fugindo dela
   * (*"Do raw query. `wp_get_post_revisions()` is filtered"*,
   * `wp-includes/post.php:3912`). Portar `WP_Query` e da feature 004 e da 015;
   * o que esta leitura garante e o conjunto de linhas e a ordem delas.
   */
  listar(conteudoId: number): readonly Conteudo[];
  /**
   * ⚠️ A lista **crua** de identificadores, que a exclusao do pai usa
   * (`wp-includes/post.php:3912` a `:3914`), nao esta aqui: ela e
   * `conteudo.idsDeFilhosDoTipo(paiId, TIPO_DE_VERSAO)`, no repositorio de
   * conteudo, porque e a mesma consulta das outras duas semanticas da
   * auto-referencia. Duplica-la aqui daria dois lugares para a mesma cadeia.
   */
  /**
   * A versao mais recente, pela mesma ordem, com uma linha so — e o
   * `posts_per_page => 1` de `wp_get_latest_revision_id_and_total_count()`
   * (`wp-includes/revision.php:727` a `:736`).
   */
  maisRecente(conteudoId: number): Conteudo | null;
}

export function criarRepositorioDeVersoes(
  dados: PortaDeDados,
): RepositorioDeVersoes {
  const tabela = tabelaDeConteudo(dados);
  const condicao =
    'WHERE post_parent = ? AND post_type = ? AND post_status = ? ' +
    'ORDER BY post_date DESC, ID DESC';

  function parametros(conteudoId: number): readonly (string | number)[] {
    return [conteudoId, TIPO_DE_VERSAO, ESTADO_DE_VERSAO];
  }

  return {
    listar(conteudoId) {
      return dados
        .selecionar({
          texto: `SELECT * FROM ${tabela} ${condicao}`,
          parametros: parametros(conteudoId),
        })
        .map(lerConteudo);
    },

    maisRecente(conteudoId) {
      const linha = primeiraLinha(
        dados.selecionar({
          texto: `SELECT * FROM ${tabela} ${condicao} LIMIT 1`,
          parametros: parametros(conteudoId),
        }),
      );
      return linha === null ? null : lerConteudo(linha);
    },
  };
}

/** Util de leitura: o identificador do original guardado no vinculo da versao. */
export function idDoOriginal(versao: Conteudo): number {
  return versao.vinculo.tipo === 'original-da-versao' ? versao.vinculo.id : 0;
}
