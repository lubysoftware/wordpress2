/**
 * **CA-1.5**: destino nao gravavel devolve erro **com a mensagem do sistema de
 * arquivos**, e nenhum registro de anexo e criado.
 *
 * Entrega de **T003** (US-1). E `wp_upload_dir( $time )`
 * (`wp-includes/functions.php:2404`) — a parte dela que e **regra**, porque a
 * parte que e **fato da borda** T001 ja pos na porta:
 * `PortaDeSistemaDeArquivos.raizDeEnvios` e o `basedir`.
 *
 * ── A DIVISAO ENTRE O QUE E PORTA E O QUE E REGRA, E POR QUE ELA CAI AQUI ──
 *
 * A porta de T001 declara, por escrito, o que ela **nao** faz: *"nao organiza a
 * area de envios por ano e mes. A organizacao e regra dirigida pela opcao
 * `uploads_use_yearmonth_folders` (semeada em `1`,
 * `wp-admin/includes/schema.php:470`), e opcao se le pela porta de dados. Daqui
 * sai so a raiz, que e fato da borda"*. Este arquivo e o outro lado dessa frase:
 *
 * | o que | de onde vem | por que |
 * |---|---|---|
 * | a raiz (`basedir`) | `PortaDeSistemaDeArquivos.raizDeEnvios` | e o caminho que o adaptador conhece, e resolve-lo envolve quatro constantes e o recorte de rede (`_wp_upload_dir()`, `:2467`) |
 * | o endereco base (`baseurl`) | {@link ContextoDaAreaDeEnvios.enderecoBaseDeEnvios} | **nao e fato de sistema de arquivos**: e URL, e por isso nao entrou na porta |
 * | a subpasta de ano e mes | esta funcao | e regra, e e dirigida por opcao |
 * | a mensagem de falha | esta funcao | e texto do legado, e CA-1.5 a poe no contrato |
 *
 * ⚠️ **A area de envios nao existe na arvore analisada** (lacuna L5 de
 * `soul.md`), e `plan.md` conclui que ela *"nasce vazia"*. Logo nenhuma
 * afirmacao sobre arquivo real desta instalacao foi possivel em etapa alguma, e
 * tudo aqui vem da leitura do codigo que a cria.
 *
 * ── O QUE ESTA FUNCAO NAO REPRODUZ, DE PROPOSITO ───────────────────────────
 *
 * `wp_upload_dir()` tem duas memorias `static` — `$cache` por site e tempo, e
 * `$tested_paths` por caminho (`:2405`). As duas sao **escopo de requisicao** no
 * legado, porque o processo e montado e descartado a cada resposta
 * (`EXT-CONTEXTO`, BR-MIGRAR-105), e nenhuma delas e observavel: a de caminho so
 * evita uma segunda tentativa de criar a mesma pasta na **mesma** requisicao, e
 * um envio chama isto uma vez. Guardar memoria aqui seria estado de modulo, que
 * `modulo.test.ts` afirma nao existir.
 */

import type { PortaDeSistemaDeArquivos } from '../portas/index.js';

/**
 * O que a area de envios precisa saber e que nao e a porta de arquivos.
 *
 * Esta separado do contexto inteiro do envio (`contexto-de-envio.ts`) porque e
 * exatamente o recorte que esta funcao le — mesma razao do recorte de
 * `plataforma/autorizacao/` em `contextos/conteudo/gravacao/`.
 */
export interface ContextoDaAreaDeEnvios {
  /**
   * `$uploads['baseurl']` — o endereco publico da raiz da area de envios.
   *
   * ⚠️ **Entra no `guid` do anexo**, que e *"o endereco do arquivo"*
   * (`armazenamento/anexo.ts`, e a secao *Modelo de dados* do `plan.md`). Logo
   * e contrato observavel por qualquer cliente, e e por isso que ele chega de
   * fora: montar URL aqui exigiria `siteurl`, `WP_CONTENT_URL`, a opcao
   * `upload_url_path` e o recorte de rede de `_wp_upload_dir()` — quatro
   * decisoes de instalacao que nao sao desta feature.
   */
  readonly enderecoBaseDeEnvios: string;
  /**
   * `ABSPATH` — a raiz da instalacao, usada **so** para encurtar o caminho que
   * aparece na mensagem de erro (`wp-includes/functions.php:2439`).
   *
   * Nao e usada para resolver caminho nenhum. Esta aqui porque sem ela a
   * mensagem de CA-1.5 sai com outro texto.
   */
  readonly raizDaInstalacao: string;
  /**
   * `get_option( 'uploads_use_yearmonth_folders' )`
   * (`wp-includes/functions.php:2549`).
   *
   * Semeada em `1` pelo instalador (`wp-admin/includes/schema.php:470`), logo o
   * valor de fabrica e **ligada**. Chega como booleano porque o legado a testa
   * com `if ( get_option( ... ) )` e porque quem le opcao e a feature que
   * declara a tabela de opcoes.
   */
  readonly organizarPorAnoEMes: boolean;
  /**
   * `esc_html()` (`wp-includes/functions.php:2446`).
   *
   * Chega por argumento e **nao** e implementada aqui. AD-08 recusa **porta**
   * para o escape — *"3.416 pontos de entrada, o custo de indirecao nao tem
   * contrapartida nenhuma nessa escala"* —, e `plataforma/escape/` nao existe
   * nesta arvore: a situacao e a mesma de `sanitize_key()` em
   * `contextos/conteudo/revisao/contexto-de-revisao.ts`, e a solucao e a mesma —
   * funcao injetada, com a lacuna declarada. Ela entra na mensagem de CA-1.5, e
   * e por isso que nao pode ser omitida: um caminho com `&` sai diferente.
   */
  escaparHtml(texto: string): string;
}

/**
 * `$uploads` — o que `wp_upload_dir()` devolve, com `error` como uniao.
 *
 * No legado `error` e `false` ou cadeia: a uniao existe porque
 * `_wp_handle_upload()` testa `false === $uploads['error']` com identidade
 * (`wp-admin/includes/file.php:948`), e cadeia vazia **nao** passa nesse teste.
 */
export type AreaDeEnvios =
  | {
      readonly disponivel: true;
      /** `$uploads['path']` — a raiz mais a subpasta. */
      readonly caminho: string;
      /** `$uploads['url']` — o endereco base mais a subpasta. */
      readonly endereco: string;
      /** `$uploads['subdir']` — `/AAAA/MM`, ou cadeia vazia. */
      readonly subpasta: string;
    }
  | {
      readonly disponivel: false;
      /** `$uploads['error']` — a mensagem, que CA-1.5 poe no contrato. */
      readonly mensagem: string;
      readonly subpasta: string;
    };

/**
 * A mensagem de `wp_upload_dir()` quando a pasta nao pode ser criada
 * (`wp-includes/functions.php:2446`).
 *
 * O texto e o do legado, em ingles, pelo mesmo motivo registrado em
 * `contextos/conteudo/publicacao/permissao-de-publicacao.ts` e em
 * `administracao-de-contas/mensagens-da-administracao.ts`: `EC-05` fixa que *"o
 * `msgid` em ingles E a chave do catalogo"*, logo traduzir aqui trocaria a
 * chave. `%s` e o caminho encurtado.
 */
export const MENSAGEM_DE_PASTA_NAO_CRIADA =
  'Unable to create directory %s. Is its parent directory writable by the server?';

/**
 * A mensagem de `_wp_handle_upload()` quando o arquivo nao pode ser movido para
 * a pasta (`wp-admin/includes/file.php:1035`).
 *
 * ⚠️ **E outra falha e outra mensagem**, e as duas sao de CA-1.5: a de cima e
 * *"a pasta nao pode ser criada"*, esta e *"a pasta existe e a escrita falhou"*.
 * Um porte com uma mensagem so perde metade do criterio.
 */
export const MENSAGEM_DE_ARQUIVO_NAO_MOVIDO =
  'The uploaded file could not be moved to %s.';

/**
 * `/$y/$m` — a subpasta de ano e mes (`wp-includes/functions.php:2549`).
 *
 * O recorte e por **posicao** na cadeia, nao por analise de data:
 * `substr( $time, 0, 4 )` e `substr( $time, 5, 2 )` sobre o formato do banco
 * (`AAAA-MM-DD HH:MM:SS`). Esta portado assim de proposito — o valor pode ser
 * `0000-00-00 00:00:00` (a sentinela de `armazenamento/anexo.ts`), e nesse caso
 * o legado produz a pasta `/0000/00`, que um porte com analise de data recusaria
 * ou corrigiria.
 */
export function subpastaDeAnoEMes(instante: string): string {
  const ano = instante.slice(0, 4);
  const mes = instante.slice(5, 7);
  return `/${ano}/${mes}`;
}

/**
 * `wp_upload_dir( $time )` — a pasta de destino, criada se preciso
 * (`wp-includes/functions.php:2404`).
 *
 * A ordem das operacoes na porta e a do legado, e ela e o que o cenario
 * `@composicao` de `PT-014` compara: **monta o caminho, e so entao tenta criar a
 * pasta**. Nao ha `gravavel()` antes: o legado nao pergunta, ele tenta
 * `wp_mkdir_p()` e le a falha — e `wp_mkdir_p()` devolve **verdadeiro quando a
 * pasta ja existe** (`:2076`), que e o caminho normal a partir do segundo envio
 * do mes.
 */
export function abrirAreaDeEnvios(
  instante: string,
  contexto: ContextoDaAreaDeEnvios,
  sistemaDeArquivos: PortaDeSistemaDeArquivos,
): AreaDeEnvios {
  const raizDeEnvios = sistemaDeArquivos.raizDeEnvios;
  const subpasta = contexto.organizarPorAnoEMes
    ? subpastaDeAnoEMes(instante)
    : '';
  const caminho = raizDeEnvios + subpasta;

  if (!sistemaDeArquivos.criarPasta(caminho).concluido) {
    return {
      disponivel: false,
      subpasta,
      mensagem: MENSAGEM_DE_PASTA_NAO_CRIADA.replace(
        '%s',
        contexto.escaparHtml(
          caminhoEncurtado(raizDeEnvios, subpasta, contexto.raizDaInstalacao),
        ),
      ),
    };
  }

  return {
    disponivel: true,
    caminho,
    endereco: contexto.enderecoBaseDeEnvios + subpasta,
    subpasta,
  };
}

/**
 * O caminho que aparece nas duas mensagens (`wp-includes/functions.php:2439` e
 * `wp-admin/includes/file.php:1029`).
 *
 * Os dois trechos do legado fazem a mesma conta com uma diferenca que esta
 * preservada: `wp_upload_dir()` usa `wp_basename()` e **escapa** o resultado;
 * `_wp_handle_upload()` usa `basename()` e **nao** escapa. A diferenca entre as
 * duas funcoes de nome base e o tratamento de multibyte, e nenhuma das duas e
 * desta feature — por isso esta funcao devolve o caminho **cru** e o escape fica
 * com quem monta a mensagem.
 */
export function caminhoEncurtado(
  raizDeEnvios: string,
  subpasta: string,
  raizDaInstalacao: string,
): string {
  if (raizDeEnvios.startsWith(raizDaInstalacao)) {
    return raizDeEnvios.slice(raizDaInstalacao.length) + subpasta;
  }
  return nomeBase(raizDeEnvios) + subpasta;
}

/** `basename()` — o ultimo segmento do caminho. */
function nomeBase(caminho: string): string {
  const segmentos = caminho.replace(/\/+$/, '').split('/');
  return segmentos[segmentos.length - 1] ?? '';
}
