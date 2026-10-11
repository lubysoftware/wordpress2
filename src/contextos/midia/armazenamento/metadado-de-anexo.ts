/**
 * O metadado do anexo pelas cinco chaves que o legado le e escreve com nome.
 *
 * Entrega de **T002** da feature `006-biblioteca-de-midia`: *"o metadado que
 * descreve as derivadas e **gravado e lido pela porta de dados** com a mesma
 * forma do legado"*. A **forma** esta em `derivadas.ts`; a **tabela** esta em
 * `metadado.ts`; aqui estao as operacoes que o legado nomeia, cada uma com a
 * cadeia de comandos que ela emite.
 *
 * | operacao daqui | funcao do legado | ancora |
 * |---|---|---|
 * | {@link RepositorioDeMetadadoDeAnexo.obterMetadado} | `wp_get_attachment_metadata()` | `wp-includes/post.php:7101` |
 * | {@link RepositorioDeMetadadoDeAnexo.gravarMetadado} | `wp_update_attachment_metadata()` | `wp-includes/post.php:7156` |
 * | {@link RepositorioDeMetadadoDeAnexo.obterCaminhoRelativo} | `get_attached_file()` | `wp-includes/post.php:845` |
 * | {@link RepositorioDeMetadadoDeAnexo.gravarCaminhoRelativo} | `update_attached_file()` | `wp-includes/post.php:885` |
 * | {@link RepositorioDeMetadadoDeAnexo.obterTamanhosDeBackup} | `get_post_meta( ..., '_wp_attachment_backup_sizes', true )` | `wp-admin/includes/image-edit.php:33` |
 * | {@link RepositorioDeMetadadoDeAnexo.outroAnexoReferenciaMiniatura} | a guarda da exclusao de arquivo | `wp-includes/post.php:6926` |
 *
 * ── AS DUAS DECISOES QUE O LEGADO TOMA COM A VERDADE DE PHP ────────────────
 *
 * Duas operacoes daqui **nao sao escrita**: sao escrita **ou** exclusao, e quem
 * decide e um `if ( $valor )` sobre um valor que pode ser arranjo vazio ou a
 * cadeia `'0'` (ver `verdade-de-php.ts`):
 *
 * - `wp_update_attachment_metadata()` **apaga** a chave quando o metadado e
 *   vazio (`wp-includes/post.php:7174`);
 * - `update_attached_file()` **apaga** a chave quando o caminho e vazio
 *   (`wp-includes/post.php:901`).
 *
 * Os dois caminhos sao comandos diferentes no banco, logo {@link
 * ResultadoDoMetadadoDeAnexo} diz qual deles rodou. Um porte que gravasse
 * sempre deixaria `a:0:{}` numa linha que o legado nao tem.
 *
 * ── OS PONTOS DE EXTENSAO DESTE CAMINHO, DECLARADOS E NAO EMITIDOS ─────────
 *
 * O P2 da constituicao poe cada ponto de extensao no contrato publico, e nao ha
 * barramento de ganchos nesta arvore: REQ-162 (*"declarar os pontos de extensao
 * com contrato explicito"*) ficou fora do pacote (`do-not-rewrite.md`), e
 * **nenhuma tarefa deste pacote o constroi**. O que esta tarefa pode fazer sem
 * decidir no lugar de ninguem e declarar, no arquivo que os emitiria, quais sao
 * e em que posicao do fluxo entram:
 *
 * | ponto | tipo | argumentos | posicao |
 * |---|---|---|---|
 * | `wp_get_attachment_metadata` | filtro | `$data`, `$attachment_id` | depois de ler, **antes** da guarda que troca `sizes` nao-arranjo por vazio (`post.php:7132`, `:7138`) |
 * | `wp_update_attachment_metadata` | filtro | `$data`, `$attachment_id` | antes de decidir entre gravar e apagar, e o valor devolvido e o que vai gravado (`post.php:7173`) |
 * | `get_attached_file` | filtro | `$file`, `$attachment_id` | depois de absolutizar, na saida (`post.php:868`) |
 * | `update_attached_file` | filtro | `$file`, `$attachment_id` | **antes** de relativizar, logo o interceptador recebe caminho absoluto (`post.php:898`) |
 * | `_wp_relative_upload_path` | filtro | `$new_path`, `$path` | na relativizacao (`post.php:936`) |
 *
 * **Nenhum deles e emitido por este repositorio**, e a razao e de fronteira: um
 * repositorio que os disparasse os faria disparar tambem onde o legado nao
 * dispara, e o ultimo cenario de `parity_tests/09-contrato-de-extensao-por-filtro.feature`
 * cobra a sequencia de chamadas. Quem os emitir e o fluxo de cada historia,
 * quando houver barramento.
 *
 * ⚠️ **A absolutizacao do caminho NAO esta aqui, e a relativizacao tambem nao.**
 * `get_attached_file()` prefixa a raiz da area de envios quando o valor gravado
 * e relativo (`wp-includes/post.php:848` a `:854`) e `update_attached_file()`
 * relativiza com `_wp_relative_upload_path()` (`:900`). As duas precisam da raiz
 * de envios, que e a **porta de sistema de arquivos**, nao a de dados — e as
 * duas tocam **endereco publico**, que e a pergunta em aberto do sufixo na
 * `spec.md`. O que este repositorio le e grava e o **valor da coluna**, que e o
 * caminho relativo; quem resolve caminho e quem tem as duas portas na mao, no
 * fluxo de T003.
 */

import type { ValorPhp } from '../../../plataforma/serializacao/index.js';
import type { PortaDeDados } from '../portas/index.js';
import {
  CHAVE_DO_ARQUIVO_ANEXADO,
  CHAVE_DO_CONTEXTO_DO_ANEXO,
  CHAVE_DO_METADADO_DE_ANEXO,
  CHAVE_DO_TEXTO_ALTERNATIVO,
  CHAVE_DOS_TAMANHOS_DE_BACKUP,
  tabelaDeMetadadosDeConteudo,
} from './chaves-e-tabelas.js';
import {
  lerMetadadoDeAnexo,
  lerTamanhosDeBackup,
  type MetadadoDeAnexo,
  type TamanhoDeBackup,
} from './derivadas.js';
import {
  criarRepositorioDeMetadados,
  type RepositorioDeMetadados,
  type ResultadoDaGravacaoDeMetadado,
} from './metadado.js';
import { verdadeiroComoNoPhp } from './verdade-de-php.js';

/**
 * Qual dos dois caminhos do legado rodou — e os dois sao comandos diferentes.
 *
 * Ver a secao *As duas decisoes que o legado toma com a verdade de PHP* no
 * cabecalho deste arquivo.
 */
export type ResultadoDoMetadadoDeAnexo =
  | {
      readonly caminho: 'gravado';
      readonly resultado: ResultadoDaGravacaoDeMetadado;
    }
  | { readonly caminho: 'apagado'; readonly linhasApagadas: number };

export interface RepositorioDeMetadadoDeAnexo {
  /**
   * O metadado de derivadas, ou `null` quando nao ha
   * (`wp_get_attachment_metadata()`, `wp-includes/post.php:7101`).
   *
   * `null` cobre os tres casos que o legado devolve como `false`: chave
   * ausente, valor que nao e arranjo e arranjo **vazio** — ver
   * {@link lerMetadadoDeAnexo}.
   */
  obterMetadado(anexoId: number): MetadadoDeAnexo | null;
  /**
   * Grava o metadado de derivadas, **ou apaga a chave quando ele e vazio**
   * (`wp_update_attachment_metadata()`, `wp-includes/post.php:7156`, e a
   * decisao em `:7174`).
   *
   * Recebe {@link ValorPhp}, e **nao** a projecao tipada: a projecao e leitura,
   * e gravar a partir dela perderia chave de extensao, ordem e tipo de escalar.
   * Os construtores da forma estao em `derivadas.ts`.
   */
  gravarMetadado(anexoId: number, valor: ValorPhp): ResultadoDoMetadadoDeAnexo;
  /**
   * O caminho do arquivo **como esta na coluna** — relativo a area de envios, ou
   * cadeia vazia quando a chave nao existe (`_wp_attached_file`,
   * `wp-includes/post.php:846`).
   *
   * Nao absolutiza. Ver o aviso no fim do cabecalho deste arquivo.
   */
  obterCaminhoRelativo(anexoId: number): string;
  /**
   * Grava o caminho relativo, **ou apaga a chave quando ele e vazio**
   * (`update_attached_file()`, `wp-includes/post.php:885`, e a decisao em
   * `:901`).
   *
   * Recebe o caminho **ja relativo**: nao relativiza, pelo mesmo motivo que
   * {@link obterCaminhoRelativo} nao absolutiza.
   */
  gravarCaminhoRelativo(
    anexoId: number,
    caminhoRelativo: string,
  ): ResultadoDoMetadadoDeAnexo;
  /**
   * Os arquivos guardados pela edicao de imagem
   * (`_wp_attachment_backup_sizes`). Lista vazia quando a chave nao existe ou
   * nao e arranjo, que e a tolerancia das duas leituras do legado
   * (`wp-includes/post.php:7023`, `wp-admin/includes/image-edit.php:834`).
   */
  obterTamanhosDeBackup(anexoId: number): readonly TamanhoDeBackup[];
  /**
   * Grava os tamanhos de backup (`wp-admin/includes/image-edit.php:892` e
   * `:1143`).
   *
   * ⚠️ **Aqui nao ha o ramo de exclusao** das duas operacoes de cima, e a
   * diferenca e do legado: o editor de imagem chama `update_post_meta()` direto,
   * sem perguntar se o valor e vazio, e apaga a chave por uma chamada **separada**
   * — {@link apagarTamanhosDeBackup}.
   */
  gravarTamanhosDeBackup(
    anexoId: number,
    valor: ValorPhp,
  ): ResultadoDaGravacaoDeMetadado;
  /**
   * Apaga a chave dos tamanhos de backup — o `delete_post_meta()` que a
   * restauracao do original faz (`wp-admin/includes/image-edit.php:904`).
   */
  apagarTamanhosDeBackup(anexoId: number): number;
  /**
   * O texto alternativo da imagem, ou cadeia vazia quando a chave nao existe
   * (`_wp_attachment_image_alt`).
   */
  obterTextoAlternativo(anexoId: number): string;
  /**
   * Grava o texto alternativo (`wp-admin/includes/media.php:431`).
   *
   * ⚠️ No legado esta escrita acontece **so quando ha texto**: ela esta dentro
   * de `if ( trim( $alt ) )`, logo o anexo sem texto alternativo **nao tem a
   * chave**. A condicao e de quem envia (T003); o que nao pode e a escrita
   * acontecer sempre, porque a chave ausente e observavel.
   */
  gravarTextoAlternativo(
    anexoId: number,
    texto: string,
  ): ResultadoDaGravacaoDeMetadado;
  /**
   * Declara de que tela o anexo nasceu (`_wp_attachment_context`).
   *
   * E `add_post_meta( ..., true )` — **unica** —, nao `update`
   * (`wp-includes/post.php:5130`): com a chave ja presente, o legado emite a
   * contagem e **nao** insere. Devolve o identificador da linha, ou `0` quando
   * nao inseriu.
   */
  declararContexto(anexoId: number, contexto: string): number;
  /**
   * Outro anexo referencia este nome de arquivo no metadado dele?
   *
   * `SELECT meta_id FROM {site}postmeta WHERE meta_key = '_wp_attachment_metadata'
   * AND meta_value LIKE ? AND post_id <> ?` (`wp-includes/post.php:6926`).
   *
   * E a unica consulta do legado que **procura dentro do valor serializado**
   * nesta feature, e ela existe para uma guarda so: nao apagar do disco a
   * miniatura antiga (`thumb`) que outro anexo tambem aponta. `DB-SER`
   * (BR-MIGRAR-082) registra a consequencia disso em geral — *"nenhuma consulta
   * SQL filtra o conteudo de forma confiavel, nenhum indice ajuda"* —, e o
   * `LIKE` com curinga nos dois lados sobre texto serializado e citado pelo
   * `plan.md` como o criterio de *"a MESMA string que o legado envia"*.
   *
   * ⚠️ O nome chega **escapado para `LIKE`** no parametro, com os curingas em
   * volta, como `$wpdb->esc_like()` o entrega
   * (`wp-includes/class-wpdb.php:1786`): ver {@link escaparParaLike}. Sem o
   * escape, um nome de arquivo com `_` casaria com arquivo de outro anexo — o
   * `_` e curinga de um caractere no `LIKE`.
   */
  outroAnexoReferenciaMiniatura(nomeDeArquivo: string, anexoId: number): boolean;
  /** As primitivas da tabela, para quem precisa da linha e nao da chave (T017). */
  readonly metadados: RepositorioDeMetadados;
}

export function criarRepositorioDeMetadadoDeAnexo(
  dados: PortaDeDados,
): RepositorioDeMetadadoDeAnexo {
  const metadados = criarRepositorioDeMetadados(dados);
  const tabela = tabelaDeMetadadosDeConteudo(dados);

  /** O `if ( $valor )` que decide entre gravar e apagar, nas duas operacoes. */
  function gravarOuApagar(
    anexoId: number,
    chave: string,
    valor: ValorPhp,
  ): ResultadoDoMetadadoDeAnexo {
    if (verdadeiroComoNoPhp(valor)) {
      return { caminho: 'gravado', resultado: metadados.gravar(anexoId, chave, valor) };
    }
    return {
      caminho: 'apagado',
      linhasApagadas: metadados.apagar(anexoId, chave),
    };
  }

  function textoDaChave(anexoId: number, chave: string): string {
    const valor = metadados.valorUnico(anexoId, chave);
    if (valor.tipo === 'texto') {
      return typeof valor.valor === 'string'
        ? valor.valor
        : new TextDecoder().decode(valor.valor);
    }
    if (valor.tipo === 'inteiro' || valor.tipo === 'decimal') {
      return String(valor.valor);
    }
    return '';
  }

  return {
    metadados,

    obterMetadado(anexoId) {
      return lerMetadadoDeAnexo(
        metadados.valorUnico(anexoId, CHAVE_DO_METADADO_DE_ANEXO),
      );
    },

    gravarMetadado(anexoId, valor) {
      return gravarOuApagar(anexoId, CHAVE_DO_METADADO_DE_ANEXO, valor);
    },

    obterCaminhoRelativo(anexoId) {
      return textoDaChave(anexoId, CHAVE_DO_ARQUIVO_ANEXADO);
    },

    gravarCaminhoRelativo(anexoId, caminhoRelativo) {
      return gravarOuApagar(anexoId, CHAVE_DO_ARQUIVO_ANEXADO, {
        tipo: 'texto',
        valor: caminhoRelativo,
      });
    },

    obterTamanhosDeBackup(anexoId) {
      return lerTamanhosDeBackup(
        metadados.valorUnico(anexoId, CHAVE_DOS_TAMANHOS_DE_BACKUP),
      );
    },

    gravarTamanhosDeBackup(anexoId, valor) {
      return metadados.gravar(anexoId, CHAVE_DOS_TAMANHOS_DE_BACKUP, valor);
    },

    apagarTamanhosDeBackup(anexoId) {
      return metadados.apagar(anexoId, CHAVE_DOS_TAMANHOS_DE_BACKUP);
    },

    obterTextoAlternativo(anexoId) {
      return textoDaChave(anexoId, CHAVE_DO_TEXTO_ALTERNATIVO);
    },

    gravarTextoAlternativo(anexoId, texto) {
      return metadados.gravar(anexoId, CHAVE_DO_TEXTO_ALTERNATIVO, {
        tipo: 'texto',
        valor: texto,
      });
    },

    declararContexto(anexoId, contexto) {
      return metadados.acrescentar(
        anexoId,
        CHAVE_DO_CONTEXTO_DO_ANEXO,
        { tipo: 'texto', valor: contexto },
        true,
      );
    },

    outroAnexoReferenciaMiniatura(nomeDeArquivo, anexoId) {
      return (
        dados.selecionar({
          texto:
            `SELECT meta_id FROM ${tabela} ` +
            `WHERE meta_key = '${CHAVE_DO_METADADO_DE_ANEXO}' ` +
            'AND meta_value LIKE ? AND post_id <> ?',
          parametros: [`%${escaparParaLike(nomeDeArquivo)}%`, anexoId],
        }).length > 0
      );
    },
  };
}

/**
 * `$wpdb->esc_like()` — `addcslashes( $text, '_%\\' )`
 * (`wp-includes/class-wpdb.php:1786`).
 *
 * Escapa os dois curingas do `LIKE` e a propria barra invertida, e **nada mais**:
 * nao e escape de SQL (isso e do marcador de parametro), e sim escape de
 * **padrao**. O valor sai no parametro, nao na cadeia do comando.
 */
export function escaparParaLike(texto: string): string {
  let escapado = '';
  for (const caractere of texto) {
    if (caractere === '_' || caractere === '%' || caractere === '\\') {
      escapado += '\\';
    }
    escapado += caractere;
  }
  return escapado;
}
