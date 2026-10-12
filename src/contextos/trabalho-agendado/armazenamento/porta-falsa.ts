/**
 * Portas de teste desta feature: registram o que foi pedido e devolvem o que foi
 * programado. Entrega de **T002**. *satisfaz:* — (infraestrutura).
 *
 * Por que portas que **registram comando** em vez de um banco de mentira: o
 * criterio de aceite desta area e *"efeito no banco"* (area 3 da Decisao 2 de
 * `parity_specs.md`), e o que `parity_specs.md` manda comparar e *"snapshot +
 * sequencia de comandos"*. O que se tem de afirmar e exatamente **qual comando
 * sai, com quais parametros e com quais bytes** — inclusive o caso em que o
 * legado **nao emite comando nenhum**, e nesta feature esse caso e regra escrita
 * em tres lugares:
 *
 * - regravar a fila com os mesmos bytes **nao emite comando**, porque
 *   `update_option()` recusa valor igual (`wp-includes/option.php:923`) — e e o
 *   caso de desagendar o que nao esta na fila;
 * - liberar a trava que **nao existe** nao emite `DELETE`, porque `delete_option()`
 *   desiste depois de ler o `autoload` (`wp-includes/option.php:1215`-`1218`);
 * - compor o modulo nao emite comando nenhum (`EXT-ORDEM`).
 *
 * Um banco de mentira esconderia os tres.
 *
 * Fica em arquivo de fonte, e nao de teste, porque T003 em diante vai precisar
 * dela: as suites das historias (T004, T006, T008 ...) afirmam efeito no banco
 * pelos mesmos meios. E a gemea das de BC-01 e BC-05, com **uma** diferenca — ha
 * tambem uma porta de cache falsa, porque nesta feature a trava mora no cache
 * **ou** no banco, conforme `wp_using_ext_object_cache()`
 * (`wp-includes/option.php:1455`).
 *
 * **Nao ha relogio falso aqui**, de proposito: o relogio nao e porta de
 * armazenamento, e as funcoes que dependem dele recebem o instante **por
 * argumento** (ver `../configuracao/trava-da-fila.ts`) — e isso que torna a borda
 * conferivel com relogio controlado, como a entrega de T002 exige.
 */

import type {
  Consulta,
  LinhaDeResultado,
  PortaDeCache,
  PortaDeDados,
  ResultadoDeCache,
  ResultadoDeEscrita,
  ValorDeCache,
} from '../portas/index.js';

export interface PortaDeDadosFalsa {
  readonly porta: PortaDeDados;
  /** Toda leitura pedida, na ordem. */
  readonly selecoes: Consulta[];
  /** Toda escrita pedida, na ordem. Lista vazia e afirmacao, nao ausencia. */
  readonly escritas: Consulta[];
  /** Programa a proxima resposta de leitura. */
  responder(linhas: readonly LinhaDeResultado[]): void;
}

export interface OpcoesDaPortaDeDadosFalsa {
  readonly prefixoDeTabela?: string;
  readonly resultadoDeEscrita?: ResultadoDeEscrita;
}

export function criarPortaDeDadosFalsa(
  opcoes: OpcoesDaPortaDeDadosFalsa = {},
): PortaDeDadosFalsa {
  const prefixoDeTabela = opcoes.prefixoDeTabela ?? 'wp_';
  const resultadoDeEscrita = opcoes.resultadoDeEscrita ?? {
    linhasAfetadas: 1,
    idGerado: null,
  };

  const selecoes: Consulta[] = [];
  const escritas: Consulta[] = [];
  const respostas: (readonly LinhaDeResultado[])[] = [];

  return {
    porta: {
      prefixoDeTabela,
      selecionar(consulta) {
        selecoes.push(consulta);
        return respostas.shift() ?? [];
      },
      escrever(consulta) {
        escritas.push(consulta);
        return resultadoDeEscrita;
      },
    },
    selecoes,
    escritas,
    responder(linhas) {
      respostas.push(linhas);
    },
  };
}

/** Um toque no cache, com os argumentos que o legado passa. */
export interface ToqueDeCache {
  readonly chave: string;
  readonly grupo: string;
  readonly forcar?: boolean;
  readonly valor?: ValorDeCache;
  readonly expiracaoEmSegundos?: number;
}

export interface PortaDeCacheFalsa {
  readonly porta: PortaDeCache;
  readonly leituras: ToqueDeCache[];
  readonly escritas: ToqueDeCache[];
  readonly remocoes: ToqueDeCache[];
  /** Programa o que a proxima leitura encontra. */
  guardar(chave: string, grupo: string, valor: ValorDeCache): void;
}

export interface OpcoesDaPortaDeCacheFalsa {
  /**
   * O `wp_using_ext_object_cache()` desta composicao
   * (`wp-includes/load.php:810`). De fabrica **falso**, que e o default do
   * produto: `plan.md` registra que *"o default de fabrica e nao persistir nada
   * entre requisicoes"*.
   */
  readonly externo?: boolean;
}

export function criarPortaDeCacheFalsa(
  opcoes: OpcoesDaPortaDeCacheFalsa = {},
): PortaDeCacheFalsa {
  const externo = opcoes.externo ?? false;
  const leituras: ToqueDeCache[] = [];
  const escritas: ToqueDeCache[] = [];
  const remocoes: ToqueDeCache[] = [];
  const guardado = new Map<string, ValorDeCache>();

  function endereco(chave: string, grupo: string): string {
    return `${grupo}:${chave}`;
  }

  return {
    porta: {
      externo,
      obter(chave, grupo, forcar): ResultadoDeCache {
        leituras.push({ chave, grupo, forcar });
        const valor = guardado.get(endereco(chave, grupo));
        return valor === undefined
          ? { encontrado: false }
          : { encontrado: true, valor };
      },
      gravar(chave, valor, grupo, expiracaoEmSegundos) {
        escritas.push({ chave, grupo, valor, expiracaoEmSegundos });
        guardado.set(endereco(chave, grupo), valor);
      },
      remover(chave, grupo) {
        remocoes.push({ chave, grupo });
        guardado.delete(endereco(chave, grupo));
      },
    },
    leituras,
    escritas,
    remocoes,
    guardar(chave, grupo, valor) {
      guardado.set(endereco(chave, grupo), valor);
    },
  };
}

/** O valor de um parametro de escrita como texto, para afirmar bytes. */
export function textoDoParametro(valor: unknown): string {
  if (valor instanceof Uint8Array) {
    return new TextDecoder().decode(valor);
  }
  return String(valor);
}
