/**
 * O casamento do endereco pedido contra a tabela de regras — o bloco
 * `if ( ! empty( $rewrite ) )` de `WP::parse_request()`,
 * `wp-includes/class-wp.php:165-298`.
 *
 * E a segunda metade da entrega de T002: a tabela e dado
 * (`./tabela-de-regras.ts`), e aqui esta o que **le** esse dado. O bloco faz
 * cinco coisas, nesta ordem, e nenhuma delas e opcional:
 *
 * | # | o que | legado |
 * |---|---|---|
 * | 1 | marca a requisicao como erro ate prova em contrario, e liga `did_permalink` | `:167-168` |
 * | 2 | recorta o caminho pedido de tres entradas do servidor | `:170-217` |
 * | 3 | procura a primeira regra que casa | `:219-266` |
 * | 4 | traduz a cadeia de consulta da regra em criterios | `:268-284` |
 * | 5 | desfaz o erro e o `did_permalink` em tres casos | `:287-297` |
 *
 * ---
 *
 * ## O primeiro dos dois caminhos de 404 do legado nasce aqui
 *
 * `requisicao/situacao-da-resposta.ts` ja registra que o legado tem **dois**
 * caminhos de 404 e que eles nao sao o mesmo. Este arquivo e o primeiro: havendo
 * tabela de regras, o erro comeca valendo `'404'` (`:167`) e so cai se uma regra
 * casar (`:281-283`) ou se o pedido for para a propria instalacao (`:287-296`).
 * O valor sobrevive como o criterio `error` (`:398-400`), a consulta se marca
 * sozinha a partir dele (`class-wp-query.php:1148-1150`) e quem emite o codigo e
 * o envio de cabecalhos (`class-wp.php:455-466`) — **nao** o `handle_404`, que
 * desiste no comeco quando a consulta ja esta marcada.
 *
 * Consequencia pratica para quem fecha T003 e T011: um endereco que nao casa
 * regra nenhuma **nao passa** pelos tres ramos de excecao de `handle_404`. Os
 * dois 404 chegam no mesmo codigo HTTP por caminhos diferentes, e a diferenca e
 * observavel.
 *
 * ## O `empty()` do legado nao e "texto vazio", e isso muda enderecos reais
 *
 * `empty( '0' )` e **verdadeiro** no interpretador do legado, e o bloco testa
 * `empty()` em quatro pontos — `:204` (caminho de `PATH_INFO`), `:221` (caminho
 * pedido), `:231` (arquivo pedido) e `:268` (regra casada). Logo o endereco
 * `/0/`, cujo caminho recortado e o texto `0`, e tratado como **caminho vazio**:
 * ele nao percorre a tabela, tenta so a regra de raiz, e sai do bloco com o erro
 * desfeito. {@link vazioNoLegado} existe para que isso nao se perca numa
 * comparacao com texto vazio.
 *
 * ## Tres quirks de implementacao que um porte "limpo" apaga
 *
 * 1. **`$request_match` nao reinicia a cada volta do laco** (`:220` e `:235`):
 *    quando uma regra se ancora no arquivo pedido, o alvo do casamento muda **e
 *    continua mudado** para as regras seguintes. Reiniciar a variavel dentro do
 *    laco e a correcao obvia, e troca o resultado para a tabela em que uma regra
 *    de arquivo vem antes de uma regra de caminho.
 * 2. **O padrao e a cadeia de consulta nao sao escapados** na montagem. O teste
 *    de `PATH_INFO` monta `'|^.*' . $wp_rewrite->index . '$|'` (`:204`) com o
 *    `index.php` cru, logo o ponto e um metacaractere e `indexXphp` tambem casa.
 *    Escapar aqui seria consertar o legado.
 * 3. **O casamento e tentado duas vezes**, com o alvo como veio e com o alvo
 *    decodificado (`:238-239`), e o **primeiro** que casar vale — inclusive para
 *    os grupos que alimentam `$matches[N]`.
 *
 * ⚠️ **Dialeto de expressao regular.** O legado compila os padroes com PCRE;
 * aqui eles sao compilados pelo runtime. Padrao que este runtime nao compila
 * conta como **nao casou**, que e o que `preg_match` devolve quando o padrao nao
 * compila. Nenhuma regra do nucleo usa construcao fora do subconjunto comum, e
 * uma regra de terceiro que use e caso para o oraculo executavel (`ESC-ORACULO`).
 */

import type { CriteriosDeConsulta, EnderecoPedido } from '../requisicao/endereco-pedido.js';
import {
  adicionarBarras,
  analisarCadeiaDeConsulta,
  aplicarCasamentos,
  decodificarUrl,
} from './cadeia-de-consulta.js';
import {
  INDICE_DO_SITE,
  PADRAO_DA_RAIZ,
  type CriteriosDaRegra,
  type TabelaDeRegras,
} from './tabela-de-regras.js';

/**
 * O que o bloco de casamento produz.
 *
 * Os quatro primeiros campos sao propriedades publicas de `WP` que extensao de
 * terceiro le (P8); os tres ultimos sao estado local do bloco que a coleta
 * consome: `$perma_query_vars`, `$error` e o arranjo de parametros da consulta —
 * que sai daqui **modificado**, porque o legado tira `error` dele junto com a
 * variavel local (`:282` e `:290`).
 */
export interface CasamentoDeEndereco {
  /** `WP::$request` (`:217`). */
  readonly caminhoDaRequisicao: string;
  /** `WP::$matched_rule` (`:224` e `:262`). */
  readonly regraCasada: string;
  /** `WP::$matched_query` (`:275`), depois do recorte e da substituicao. */
  readonly consultaCasada: string;
  /** `WP::$did_permalink` (`:168`, desfeito em `:296`). */
  readonly permalinkResolvido: boolean;
  /** `$perma_query_vars` (`:278`), ausente quando nenhuma regra casou. */
  readonly criteriosDaRegra: CriteriosDaRegra | undefined;
  /** `$error` (`:167`), ausente quando foi desfeito. */
  readonly erro: string | undefined;
  /** O arranjo da consulta da requisicao, sem o `error` que o legado tirou. */
  readonly parametrosDeConsulta: CriteriosDeConsulta;
}

/**
 * O `empty()` do legado para texto: vazio **ou** o digito zero.
 *
 * Ver a segunda secao do cabecalho deste arquivo.
 */
export function vazioNoLegado(texto: string): boolean {
  return texto === '' || texto === '0';
}

/** `trim( $x, '/' )`: tira todas as barras das duas pontas. */
function recortarBarras(texto: string): string {
  return texto.replace(/^\/+/, '').replace(/\/+$/, '');
}

/** O que `preg_quote` protege, no subconjunto que este runtime reconhece. */
function escaparParaExpressao(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
}

/**
 * `preg_match( "#^$match#", $alvo, $matches )`, com o padrao como o legado o
 * guarda (`:238`).
 *
 * Devolve os grupos do casamento, ou ausencia quando nao casou — e tambem quando
 * o padrao nao compila (ver a ressalva de dialeto no cabecalho).
 */
function casarPadrao(
  padrao: string,
  alvo: string,
): readonly (string | undefined)[] | undefined {
  let expressao: RegExp;
  try {
    expressao = new RegExp(`^${padrao}`);
  } catch {
    return undefined;
  }
  return expressao.exec(alvo) ?? undefined;
}

/** Remove o criterio `error`, o que o legado faz com `unset( $_GET['error'] )`. */
function semErro(parametros: CriteriosDeConsulta): CriteriosDeConsulta {
  if (parametros['error'] === undefined) {
    return parametros;
  }
  const restante: Record<string, CriteriosDeConsulta[string]> = {
    ...parametros,
  };
  delete restante['error'];
  return restante;
}

/** O recorte do caminho pedido — `:170-217`. */
function recortarCaminhoPedido(pedido: EnderecoPedido): {
  readonly caminhoPedido: string;
  readonly arquivoPedido: string;
  readonly scriptRecortado: string;
} {
  // `:170-172` — a parte de consulta sai, e o por cento viaja escapado.
  const infoBruta = (pedido.caminhoDeInfo ?? '').split('?')[0] ?? '';
  const info = infoBruta.replaceAll('%', '%25');

  // `:174-175`.
  const uriBruta = pedido.uriPedida.split('?')[0] ?? '';
  const script = pedido.scriptPedido ?? '';

  // `:189-192` — o recorte usa o caminho de informacao AINDA NAO recortado, e
  // `str_replace` tira todas as ocorrencias. Com ele vazio, nao tira nada.
  let uri = info === '' ? uriBruta : uriBruta.split(info).join('');
  uri = recortarBarras(uri);
  let caminhoDeInfo = recortarBarras(info);
  let scriptRecortado = recortarBarras(script);

  // `:177-201` — o caminho da instalacao sai da frente das tres, sem diferenciar
  // maiuscula de minuscula. Instalacao na raiz (`/`) recorta para texto vazio e a
  // substituicao nao tem efeito, igual ao `|^|i` que o legado monta.
  const base = recortarBarras(pedido.caminhoDaInstalacao ?? '');
  if (base !== '') {
    const inicio = new RegExp(`^${escaparParaExpressao(base)}`, 'i');
    uri = recortarBarras(uri.replace(inicio, ''));
    caminhoDeInfo = recortarBarras(caminhoDeInfo.replace(inicio, ''));
    scriptRecortado = recortarBarras(scriptRecortado.replace(inicio, ''));
  }

  // `:204-213` — o caminho pedido mora no caminho de informacao quando ele existe
  // e nao termina no ponto de entrada; senao mora na URI, que e zerada quando e o
  // proprio ponto de entrada.
  let caminhoPedido: string;
  if (
    !vazioNoLegado(caminhoDeInfo) &&
    !new RegExp(`^.*${INDICE_DO_SITE}$`).test(caminhoDeInfo)
  ) {
    caminhoPedido = caminhoDeInfo;
  } else {
    if (uri === INDICE_DO_SITE) {
      uri = '';
    }
    caminhoPedido = uri;
  }

  // `:215` — depois da zeragem, e nao antes.
  return { caminhoPedido, arquivoPedido: uri, scriptRecortado };
}

/**
 * Casa o endereco pedido contra a tabela de regras.
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4). UC-01 e
 * literal — *"nao ha verificacao de capacidade. O portao e o `post_status`"* —, e
 * o portao de `post_status` e T009.
 *
 * Com a tabela vazia, o bloco **nao roda**: e o `! empty( $rewrite )` de `:165`,
 * e e o estado de fabrica de uma instalacao nova de site unico (ver
 * `./tabela-de-regras.ts`). Nesse caso nada e derivado do texto do endereco,
 * nenhum erro e marcado, e os parametros da requisicao saem como entraram.
 */
export function casarEndereco(
  pedido: EnderecoPedido,
  tabela: TabelaDeRegras,
): CasamentoDeEndereco {
  const parametros = pedido.parametrosDeConsulta ?? {};

  if (tabela.regras.length === 0) {
    return Object.freeze({
      caminhoDaRequisicao: '',
      regraCasada: '',
      consultaCasada: '',
      permalinkResolvido: false,
      criteriosDaRegra: undefined,
      erro: undefined,
      parametrosDeConsulta: parametros,
    });
  }

  const { caminhoPedido, arquivoPedido, scriptRecortado } =
    recortarCaminhoPedido(pedido);

  // `:219-266` — a procura. `alvo` e o `$request_match`, e e declarado FORA do
  // laco de proposito (quirk 1 do cabecalho).
  let regraCasada = '';
  let consultaDaRegra = '';
  let casamentos: readonly (string | undefined)[] = [];
  let alvo = caminhoPedido;

  if (vazioNoLegado(alvo)) {
    // `:221-227` — caminho vazio procura a regra de raiz pela chave, sem laco.
    const raiz = tabela.regras.find((regra) => regra.padrao === PADRAO_DA_RAIZ);
    if (raiz !== undefined) {
      regraCasada = PADRAO_DA_RAIZ;
      consultaDaRegra = raiz.consulta;
      casamentos = [''];
    }
  } else {
    for (const regra of tabela.regras) {
      // `:231-236`.
      if (
        !vazioNoLegado(arquivoPedido) &&
        regra.padrao.startsWith(arquivoPedido) &&
        arquivoPedido !== caminhoPedido
      ) {
        alvo = `${arquivoPedido}/${caminhoPedido}`;
      }

      // `:238-239` — como veio, e depois decodificado.
      const achado =
        casarPadrao(regra.padrao, alvo) ??
        casarPadrao(regra.padrao, decodificarUrl(alvo));
      if (achado === undefined) {
        continue;
      }

      // `:242-259` — a conferencia da regra verbosa de pagina.
      if (tabela.usarRegrasVerbosasDePagina === true) {
        const indice = /pagename=\$matches\[([0-9]+)\]/.exec(regra.consulta);
        if (indice !== null) {
          const caminhoDaPagina = achado[Number(indice[1])];
          const confirmar = tabela.paginaNoCaminho;
          if (
            caminhoDaPagina === undefined ||
            confirmar === undefined ||
            !confirmar(caminhoDaPagina)
          ) {
            continue;
          }
        }
      }

      // `:261-263` — a primeira que casa, e para.
      regraCasada = regra.padrao;
      consultaDaRegra = regra.consulta;
      casamentos = achado;
      break;
    }
  }

  // `:167-168`.
  let erro: string | undefined = '404';
  let permalinkResolvido = true;
  let consultaCasada = '';
  let criteriosDaRegra: CriteriosDaRegra | undefined;
  let parametrosDeConsulta = parametros;

  if (!vazioNoLegado(regraCasada)) {
    // `:270` — fora tudo ate o ultimo `?`, inclusive. O `.+` e guloso.
    const recortada = consultaDaRegra.replace(/^.+\?/, '');
    // `:273`.
    consultaCasada = adicionarBarras(aplicarCasamentos(recortada, casamentos));
    // `:278`.
    criteriosDaRegra = analisarCadeiaDeConsulta(consultaCasada);
    // `:281-283` — casou, logo nao e erro; e o `error` sai tambem do arranjo da
    // consulta, senao a coleta o traria de volta.
    if (erro === '404') {
      erro = undefined;
      parametrosDeConsulta = semErro(parametrosDeConsulta);
    }
  }

  // `:287-297` — pedido vazio, pedido para o proprio arquivo, ou pedido do
  // painel. O teste do painel usa o script **como veio**, nao o recortado.
  const noPainel = (pedido.scriptPedido ?? '').includes('wp-admin/');
  if (
    vazioNoLegado(caminhoPedido) ||
    arquivoPedido === scriptRecortado ||
    noPainel
  ) {
    erro = undefined;
    parametrosDeConsulta = semErro(parametrosDeConsulta);
    if (criteriosDaRegra !== undefined && noPainel) {
      criteriosDaRegra = undefined;
    }
    permalinkResolvido = false;
  }

  return Object.freeze({
    caminhoDaRequisicao: caminhoPedido,
    regraCasada,
    consultaCasada,
    permalinkResolvido,
    criteriosDaRegra,
    erro,
    parametrosDeConsulta,
  });
}
