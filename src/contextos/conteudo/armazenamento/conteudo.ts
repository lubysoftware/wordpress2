/**
 * A forma de armazenamento do conteudo — a tabela `posts`, `AGG-Conteudo`.
 *
 * `target_data_model.md` diz o que muda nesta tabela em uma palavra:
 * **nenhuma** (*"Origem no legado: `{p}posts` → `{p}posts`, transformacao
 * nenhuma — DDL identico"*). Logo o trabalho aqui nao e desenhar: e nao
 * melhorar. Quatro coisas que um porte bem-intencionado mexeria ficam exatamente
 * como estao, e cada uma tem o seu motivo medido:
 *
 * 1. **A escrita tem 21 colunas, nao 23, e a ordem delas e a do legado.**
 *    `wp_insert_post()` monta `$data` com `compact()`
 *    (`wp-includes/post.php:4912` a `:4933`) e nem `ID` nem `comment_count`
 *    entram. `ID` e gerado pelo banco (ou vem de `import_id`, ver
 *    {@link RepositorioDeConteudo.inserir}); `comment_count` e contador
 *    desnormalizado mantido por outro caminho — `DB-TRG1` (BR-MIGRAR-077) mede
 *    que ele e recalculado em PHP, **pode ser suspenso durante lote** e
 *    *"entre o inicio e o fim do lote, `comment_count` esta errado no banco"*.
 *    Nenhuma escrita deste arquivo o menciona, e isso e afirmavel por teste.
 * 2. **A leitura e `SELECT *`.** E a cadeia que o legado envia
 *    (`wp-includes/class-wp-post.php:289`), e nao e so fidelidade de forma:
 *    `DB-MIG` (BR-MIGRAR-085) registra que *"coluna criada por extensao
 *    permanece e nao aparece em `wp_get_db_schema()` — o DDL e o piso, nao o
 *    retrato"*. Uma lista explicita de colunas deixaria de fora a coluna que uma
 *    extensao acrescentou, que o legado devolve.
 * 3. **A data e literal, inclusive a sentinela.** As quatro colunas `datetime`
 *    sao texto no formato do banco, e `'0000-00-00 00:00:00'` **carrega
 *    significado de negocio** (`DB-SENT`): em `posts` marca o conteudo cujo
 *    estado declara data flutuante — `draft`, `pending` e `auto-draft`
 *    (`wp-includes/post.php:4780`, e as propriedades estao em
 *    `../estado-editorial.ts`). 🔴 O destino da sentinela e `BR-HUMANA-003`,
 *    **pendente**; este arquivo segue a premissa declarada por
 *    `target_data_model.md` e **nao decide nada por ninguem**.
 * 4. **Nao ha validacao nenhuma na gravacao.** Nem tamanho de coluna, nem
 *    dominio de `post_status`, nem existencia do pai, nem unicidade do
 *    identificador na URL. `DB-DEG` (BR-MIGRAR-083): escrita grande demais se
 *    degrada em silencio; `DB-UNIQ` (BR-MIGRAR-076) registra que a unicidade do
 *    identificador *"e verificacao de codigo, sujeita a corrida"* — e e corrida
 *    de T007 (US-3), nao restricao daqui.
 *
 * ── OS PONTOS DE EXTENSAO DESTE CAMINHO, DECLARADOS E NAO EMITIDOS ─────────
 *
 * O P2 da constituicao poe cada ponto de extensao no contrato publico, e nao ha
 * barramento de ganchos nesta arvore: REQ-162 (*"declarar os pontos de extensao
 * com contrato explicito"*) ficou fora do pacote (`do-not-rewrite.md`), e
 * **nenhuma tarefa deste pacote o constroi**. O que esta tarefa pode fazer sem
 * decidir no lugar de ninguem e declarar, no arquivo que os emitiria, quais sao
 * e em que posicao do fluxo entram. Os quatro do caminho de escrita, na ordem do
 * legado:
 *
 * | ponto | tipo | argumentos | posicao |
 * |---|---|---|---|
 * | `wp_insert_post_empty_content` | filtro | `$maybe_empty`, `$postarr` | antes de qualquer resolucao de estado (`:4695`) |
 * | `wp_insert_post_parent` | filtro | `$post_parent`, `$post_id`, `$new_postarr`, `$postarr` | depois de montar os campos, antes do identificador na URL (`:4868`) |
 * | `wp_insert_post_data` | filtro | `$data`, `$postarr`, `$unsanitized_postarr`, `$update` | **imediatamente antes** do comando, e o valor devolvido e o que vai gravado (`:4978`) |
 * | `pre_post_update` / `pre_post_insert` | acao | `$post_id`, `$data` / `$data` | entre o filtro e o comando (`:4993`, `:5025`) |
 *
 * **Nenhum deles e emitido por este repositorio**, e a razao e de fronteira:
 * quem os emite e `wp_insert_post()`, que e a operacao de gravar — T005 (US-2) e
 * T003 (US-1). Um repositorio que os disparasse os faria disparar tambem na
 * gravacao de versao e na de anexo, que no legado passam por `wp_insert_post()`
 * e portanto **ja** os disparam uma vez. O ultimo cenario de
 * `02-publicacao-e-agendamento-de-conteudo.feature` cobra exatamente isto: *"a
 * sequencia de chamadas registrada e identica nas duas metades"*.
 */

import type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ValorDeParametro,
} from '../portas/index.js';
import { tabelaDeConteudo } from './chaves-e-tabelas.js';
import { comoInteiro, comoTexto, primeiraLinha } from './leitura-de-linha.js';
import {
  colunaDoVinculo,
  vinculoDaLinha,
  type VinculoComOPai,
} from './vinculo-com-o-pai.js';

/**
 * A sentinela de data: o valor de fabrica das quatro colunas `datetime` desta
 * tabela, e de dez no esquema todo.
 *
 * ⚠️ Nao e "data ausente": e o valor que o legado **deduz** de um conteudo cujo
 * estado tem data flutuante. `BR-HUMANA-003` decide o destino dela e esta
 * pendente.
 */
export const DATA_SENTINELA = '0000-00-00 00:00:00';

/**
 * Uma linha de `posts`, com as 23 colunas.
 *
 * `estado` e `tipo` sao `string` e **nao** os tipos fechados do vocabulario, e
 * isso e regra lida e nao preguica: `posts.post_status` e `posts.post_type` sao
 * `varchar(20)` sem `ENUM` e sem `CHECK` (`DB-ENUM`), `register_post_status()` e
 * `register_post_type()` sao pontos de extensao publicos, e o legado **tolera**
 * estado nao registrado em vez de recusar (UC-03, *Excecoes*: o mapeamento de
 * capacidade degrada com aviso de uso indevido). `EstadoEditorial`, de
 * `../estado-editorial.ts`, descreve o **vocabulario de fabrica** — nao o
 * dominio da coluna.
 */
export interface Conteudo {
  readonly id: number;
  /** `post_author` — a conta que consta no registro. Orfao e estado normal (P5). */
  readonly autorId: number;
  /** `post_date` — texto no formato do banco, podendo ser a sentinela. */
  readonly data: string;
  /** `post_date_gmt` — idem, e e **esta** que o agendamento compara (T013). */
  readonly dataGmt: string;
  /** `post_content` — o corpo. 🔴 O formato dele e REQ-032, fora do pacote. */
  readonly corpo: string;
  readonly titulo: string;
  readonly resumo: string;
  /** `post_status` — um dos 12 de fabrica, ou o que uma extensao registrou. */
  readonly estado: string;
  readonly estadoDeComentario: string;
  /** `ping_status` — o par do de cima para notificacao de link remoto. */
  readonly estadoDeNotificacao: string;
  /**
   * `post_password` — **texto claro, com comparacao literal**.
   *
   * BR-MIGRAR-044 (`D6`) poe isso como regra do produto, nao defeito: *"e senha
   * de acesso a conteudo, nao de conta"*. 🔴 Trocar por resumo e
   * `BR-HUMANA-009`, pendente, e *"invalida toda senha de conteudo existente"*.
   */
  readonly senha: string;
  /** `post_name` — o identificador na URL. Vazio e ausencia (`DB-SENT`). */
  readonly identificadorNaUrl: string;
  readonly aPingar: string;
  readonly pingados: string;
  readonly modificadoEm: string;
  readonly modificadoEmGmt: string;
  readonly corpoFiltrado: string;
  /** `post_parent`, nas tres semanticas que ele tem. Ver `vinculo-com-o-pai.ts`. */
  readonly vinculo: VinculoComOPai;
  readonly guid: string;
  readonly ordemNoMenu: number;
  /** `post_type` — o discriminador de seis entidades de dominio. */
  readonly tipo: string;
  readonly tipoMime: string;
  /**
   * `comment_count` — **contador desnormalizado**, lido aqui e escrito em lugar
   * nenhum deste modulo (`DB-TRG1`, e item 1 do cabecalho).
   */
  readonly contagemDeComentarios: number;
}

/**
 * As 21 colunas que a gravacao escreve, todas obrigatorias.
 *
 * Sao obrigatorias porque `wp_insert_post()` resolve default para todas antes de
 * montar o comando (`wp-includes/post.php:4606` a `:4625`): o que chega ao banco
 * pelo caminho de aplicacao nunca omite coluna. A **omissao** — o caminho em que
 * o default do DDL vale — e a insercao direta na tabela, que nao e metodo deste
 * repositorio: e o DDL, declarado em `esquema.ts`. Os dois caminhos sao o
 * primeiro cenario de `PT-002`, e sao dois de proposito (BR-MIGRAR-001).
 */
export interface ConteudoGravavel {
  readonly autorId: number;
  readonly data: string;
  readonly dataGmt: string;
  readonly corpo: string;
  readonly corpoFiltrado: string;
  readonly titulo: string;
  readonly resumo: string;
  readonly estado: string;
  readonly tipo: string;
  readonly estadoDeComentario: string;
  readonly estadoDeNotificacao: string;
  readonly senha: string;
  readonly identificadorNaUrl: string;
  readonly aPingar: string;
  readonly pingados: string;
  readonly modificadoEm: string;
  readonly modificadoEmGmt: string;
  readonly vinculo: VinculoComOPai;
  readonly ordemNoMenu: number;
  readonly tipoMime: string;
  readonly guid: string;
}

/** Os mesmos campos, um a um opcionais: omitir e nao tocar na coluna. */
export type CamposDeConteudo = {
  readonly [Campo in keyof ConteudoGravavel]?: ConteudoGravavel[Campo];
};

export interface RepositorioDeConteudo {
  /**
   * `SELECT * FROM {site}posts WHERE ID = ? LIMIT 1`
   * (`wp-includes/class-wp-post.php:289`).
   */
  obterPorId(id: number): Conteudo | null;
  /**
   * Se o identificador ja esta ocupado.
   *
   * E a pergunta que o legado faz antes de honrar um identificador sugerido:
   * `SELECT ID FROM $wpdb->posts WHERE ID = %d` (`wp-includes/post.php:5013`).
   * Ver {@link RepositorioDeConteudo.inserir}.
   */
  existeId(id: number): boolean;
  /**
   * Os filhos de um registro, **por tipo** — a leitura das tres semanticas da
   * auto-referencia, que se distinguem so pelo tipo pedido
   * (`wp-includes/post.php:3899`).
   */
  listarFilhosDoTipo(paiId: number, tipo: string): readonly Conteudo[];
  /**
   * Os identificadores dos filhos de um tipo, sem carregar a linha.
   *
   * E a consulta crua que o legado faz para as versoes antes de apagar o pai —
   * *"Do raw query. `wp_get_post_revisions()` is filtered"*,
   * `wp-includes/post.php:3912` a `:3914`. O comentario importa: ali o legado
   * **recusa** passar pelo caminho filtravel, de proposito.
   */
  idsDeFilhosDoTipo(paiId: number, tipo: string): readonly number[];
  /**
   * Insere a linha e devolve o identificador gerado.
   *
   * `idSugerido` reproduz o `import_id` de `wp_insert_post()`
   * (`wp-includes/post.php:5009` a `:5015`): quando ele e informado **e o
   * identificador nao esta ocupado**, o legado o grava na coluna `ID` em vez de
   * deixar o banco gerar. Quem decide usa-lo chama {@link existeId} primeiro,
   * como o legado faz — a verificacao e do caminho de gravacao, nao da linha.
   */
  inserir(campos: ConteudoGravavel, idSugerido?: number): number;
  /** `UPDATE {site}posts SET ... WHERE ID = ?`. Devolve as linhas afetadas. */
  atualizar(id: number, campos: CamposDeConteudo): number;
  /**
   * `DELETE FROM {site}posts WHERE ID = ?` (`wp-includes/post.php:3969`).
   *
   * **E so a linha.** A exclusao do legado tem **sete etapas** atravessando
   * quatro tabelas, com reparenteamento de pagina filha e de anexo e exclusao
   * recursiva de versao, e `EXT-EXCLUSAO` (BR-MIGRAR-104) poe a sequencia
   * inteira no comportamento observavel. Ela e da feature 005 (`PT-003`), e um
   * `apagarEmCascata` nascido aqui esconderia justamente o que o P5 manda
   * afirmar por teste — *"o conjunto exato do que sumiu e do que permaneceu,
   * inclusive o que permaneceu orfao"*.
   */
  apagar(id: number): number;
}

/**
 * As 21 colunas na **ordem do `compact()`** de `wp_insert_post()`
 * (`wp-includes/post.php:4912` a `:4933`).
 *
 * A ordem e observavel: ela e a ordem dos campos no comando que sai, e a area 3
 * da Decisao 2 compara *"snapshot + sequencia de comandos"*. Reordenar por
 * gosto — alfabetico, por tipo — produziria um comando diferente do do legado
 * para o mesmo efeito.
 */
const COLUNAS_GRAVAVEIS: readonly (readonly [keyof ConteudoGravavel, string])[] =
  [
    ['autorId', 'post_author'],
    ['data', 'post_date'],
    ['dataGmt', 'post_date_gmt'],
    ['corpo', 'post_content'],
    ['corpoFiltrado', 'post_content_filtered'],
    ['titulo', 'post_title'],
    ['resumo', 'post_excerpt'],
    ['estado', 'post_status'],
    ['tipo', 'post_type'],
    ['estadoDeComentario', 'comment_status'],
    ['estadoDeNotificacao', 'ping_status'],
    ['senha', 'post_password'],
    ['identificadorNaUrl', 'post_name'],
    ['aPingar', 'to_ping'],
    ['pingados', 'pinged'],
    ['modificadoEm', 'post_modified'],
    ['modificadoEmGmt', 'post_modified_gmt'],
    ['vinculo', 'post_parent'],
    ['ordemNoMenu', 'menu_order'],
    ['tipoMime', 'post_mime_type'],
    ['guid', 'guid'],
  ];

/**
 * O nome de coluna do legado como campo gravavel, ou `null` quando a coluna nao
 * e escrita pelo caminho de aplicacao.
 *
 * ⚠️ **Acrescentado por T021, e nao por gosto de simetria.** O ponto de extensao
 * `_wp_post_revision_fields` (`wp-includes/revision.php:53`) e **filtro
 * publico**: uma extensao declara ali, pelo **nome de coluna do legado**, qual
 * campo do conteudo entra na versao, e `_wp_post_revision_data()` copia
 * `array_intersect( array_keys( $post ), array_keys( $fields ) )` —
 * isto e, qualquer coluna de `posts` que a lista nomeie, nao so as tres de
 * fabrica. Sem esta traducao, o ponto de extensao existiria sem *"a capacidade
 * de alterar o resultado que ele tem hoje"*, que e o que o **P2** poe na tabela
 * *Nao negociavel*.
 *
 * Mora aqui, e nao em `../versoes/`, porque {@link COLUNAS_GRAVAVEIS} e o unico
 * lugar deste modulo em que o par coluna-campo existe: uma segunda copia dele em
 * outra pasta seria a duplicacao que o cabecalho de `versao.ts` recusa — *"daria
 * dois lugares para a mesma cadeia"*.
 *
 * `ID` e `comment_count` devolvem `null` porque nao sao gravaveis (item 1 do
 * cabecalho), e as duas estao entre os nove nomes que o legado remove da lista
 * de campos versionaveis de qualquer forma (`COLUNAS_NAO_VERSIONAVEIS`, em
 * `versao.ts`).
 */
export function campoDaColuna(coluna: string): keyof ConteudoGravavel | null {
  for (const [campo, nome] of COLUNAS_GRAVAVEIS) {
    if (nome === coluna) {
      return campo;
    }
  }
  return null;
}

export function criarRepositorioDeConteudo(
  dados: PortaDeDados,
): RepositorioDeConteudo {
  const tabela = tabelaDeConteudo(dados);

  return {
    obterPorId(id) {
      const linha = primeiraLinha(
        dados.selecionar({
          texto: `SELECT * FROM ${tabela} WHERE ID = ? LIMIT 1`,
          parametros: [id],
        }),
      );
      return linha === null ? null : lerConteudo(linha);
    },

    existeId(id) {
      return (
        dados.selecionar({
          texto: `SELECT ID FROM ${tabela} WHERE ID = ?`,
          parametros: [id],
        }).length > 0
      );
    },

    listarFilhosDoTipo(paiId, tipo) {
      return dados
        .selecionar({
          texto: `SELECT * FROM ${tabela} WHERE post_parent = ? AND post_type = ?`,
          parametros: [paiId, tipo],
        })
        .map(lerConteudo);
    },

    idsDeFilhosDoTipo(paiId, tipo) {
      return dados
        .selecionar({
          texto: `SELECT ID FROM ${tabela} WHERE post_parent = ? AND post_type = ?`,
          parametros: [paiId, tipo],
        })
        .map((linha) => comoInteiro(linha['ID']));
    },

    inserir(campos, idSugerido) {
      const colunas: string[] = [];
      const parametros: ValorDeParametro[] = [];

      if (idSugerido !== undefined) {
        colunas.push('ID');
        parametros.push(idSugerido);
      }
      for (const [campo, coluna] of COLUNAS_GRAVAVEIS) {
        colunas.push(coluna);
        parametros.push(valorDaColuna(campo, campos[campo]));
      }

      const consulta: Consulta = {
        texto:
          `INSERT INTO ${tabela} (${colunas.join(', ')}) ` +
          `VALUES (${colunas.map(() => '?').join(', ')})`,
        parametros,
      };
      const resultado = dados.escrever(consulta);
      return idSugerido ?? resultado.idGerado ?? 0;
    },

    atualizar(id, campos) {
      const nomes: string[] = [];
      const parametros: ValorDeParametro[] = [];

      for (const [campo, coluna] of COLUNAS_GRAVAVEIS) {
        const valor = campos[campo];
        if (valor === undefined) {
          continue;
        }
        nomes.push(`${coluna} = ?`);
        parametros.push(valorDaColuna(campo, valor));
      }
      if (nomes.length === 0) {
        return 0;
      }

      return dados.escrever({
        texto: `UPDATE ${tabela} SET ${nomes.join(', ')} WHERE ID = ?`,
        parametros: [...parametros, id],
      }).linhasAfetadas;
    },

    apagar(id) {
      return dados.escrever({
        texto: `DELETE FROM ${tabela} WHERE ID = ?`,
        parametros: [id],
      }).linhasAfetadas;
    },
  };
}

/**
 * A linha como `Conteudo`, sem interpretar nada alem do tipo da coluna.
 *
 * A unica traducao e a da coluna do pai, que vira {@link VinculoComOPai} — e ela
 * precisa do tipo da **propria linha** para saber qual das tres semanticas esta
 * ali, que e exatamente como o legado a le.
 */
export function lerConteudo(linha: LinhaDeResultado): Conteudo {
  const tipo = comoTexto(linha['post_type']);

  return {
    id: comoInteiro(linha['ID']),
    autorId: comoInteiro(linha['post_author']),
    data: comoTexto(linha['post_date']),
    dataGmt: comoTexto(linha['post_date_gmt']),
    corpo: comoTexto(linha['post_content']),
    titulo: comoTexto(linha['post_title']),
    resumo: comoTexto(linha['post_excerpt']),
    estado: comoTexto(linha['post_status']),
    estadoDeComentario: comoTexto(linha['comment_status']),
    estadoDeNotificacao: comoTexto(linha['ping_status']),
    senha: comoTexto(linha['post_password']),
    identificadorNaUrl: comoTexto(linha['post_name']),
    aPingar: comoTexto(linha['to_ping']),
    pingados: comoTexto(linha['pinged']),
    modificadoEm: comoTexto(linha['post_modified']),
    modificadoEmGmt: comoTexto(linha['post_modified_gmt']),
    corpoFiltrado: comoTexto(linha['post_content_filtered']),
    vinculo: vinculoDaLinha(tipo, comoInteiro(linha['post_parent'])),
    guid: comoTexto(linha['guid']),
    ordemNoMenu: comoInteiro(linha['menu_order']),
    tipo,
    tipoMime: comoTexto(linha['post_mime_type']),
    contagemDeComentarios: comoInteiro(linha['comment_count']),
  };
}

/**
 * O valor de um campo como parametro de coluna.
 *
 * So o vinculo precisa de conversao — para o inteiro da coluna, com `0` na
 * ausencia. O resto vai como esta: a coercao de formato por coluna (`%d` para
 * `post_author`, `post_parent` e `menu_order`, `%s` para o resto) e da camada de
 * dados, e `DB-DEG` (BR-MIGRAR-083) manda que ela **coaja em silencio** em vez
 * de recusar.
 */
function valorDaColuna(
  campo: keyof ConteudoGravavel,
  valor: ConteudoGravavel[keyof ConteudoGravavel],
): ValorDeParametro {
  if (campo === 'vinculo') {
    return colunaDoVinculo(valor as VinculoComOPai);
  }
  return valor as string | number;
}
