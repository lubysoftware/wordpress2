/**
 * A implementacao de {@link PortaDeCatalogo} que **T002** entrega: **registra
 * cada leitura pedida e devolve o que foi programado.**
 *
 * E o duplo que os testes usam, na forma desta arvore — *registra comando* em
 * vez de simular disco. O padrao e **`null`**, e aqui o padrao e a regra mais
 * importante do modulo: ausencia de catalogo e o caso de fabrica (instalacao
 * nova em `en_US` nao tem catalogo nenhum), e CA-4.3 manda que ela caia no
 * idioma de origem *"sem erro e sem espaco vazio"*. Um duplo que devolvesse
 * catalogo vazio em vez de `null` apagaria a diferenca entre *"nao ha catalogo"*
 * e *"ha catalogo e ele nao tem esta entrada"* — que sao dois caminhos
 * diferentes no legado, o `NOOP_Translations` de
 * `wp-includes/l10n.php:1486` e a busca que nao encontra.
 */

import type { BytesDeCatalogo, Dominio, Idioma, PortaDeCatalogo } from './portas/index.js';

/** Uma leitura pedida, como a borda a recebeu. */
export interface LeituraDeCatalogo {
  readonly dominio: Dominio;
  readonly idioma: Idioma;
}

export interface CatalogoQueRegistra {
  /** A porta, para passar a `criarModuloDeTraducao`. */
  readonly porta: PortaDeCatalogo;
  /** Toda leitura pedida, na ordem. */
  readonly leituras: LeituraDeCatalogo[];
  /**
   * Programa o conteudo de um par dominio/idioma. Sem programacao, a porta
   * devolve `null` — que e o caso de fabrica, nao uma falha.
   */
  programar(
    dominio: Dominio,
    idioma: Idioma,
    bytes: BytesDeCatalogo,
  ): void;
}

/**
 * Cria a implementacao. Cada chamada devolve uma nova: **sem estado de modulo**
 * (BR-MIGRAR-105, `EXT-CONTEXTO`). Aqui a razao e visivel a olho nu — o idioma e
 * **por conta** (`get_user_locale()`, `wp-includes/l10n.php:94`), logo duas
 * requisicoes concorrentes pedem catalogos diferentes, e um catalogo guardado em
 * estado de modulo entrega a uma pessoa o idioma da outra.
 */
export function criarCatalogoQueRegistra(): CatalogoQueRegistra {
  const leituras: LeituraDeCatalogo[] = [];
  const programados = new Map<string, BytesDeCatalogo>();
  const chave = (dominio: Dominio, idioma: Idioma): string =>
    `${dominio}\u0000${idioma}`;

  return {
    porta: {
      ler(dominio, idioma) {
        leituras.push({ dominio, idioma });
        return programados.get(chave(dominio, idioma)) ?? null;
      },
    },
    leituras,
    programar(dominio, idioma, bytes) {
      programados.set(chave(dominio, idioma), bytes);
    },
  };
}
