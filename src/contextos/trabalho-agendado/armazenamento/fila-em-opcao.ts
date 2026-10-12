/**
 * A fila **gravada e lida no mesmo ponto de configuracao do legado**: a linha
 * `cron` da tabela de opcoes. E a entrega de **T002**, pelas palavras de
 * `tasks.md`. *satisfaz:* — (infraestrutura).
 *
 * `_get_cron_array()` (`wp-includes/cron.php:1261`) e `_set_cron_array()`
 * (`:1297`), com a conversao de versao que a leitura dispara
 * (`_upgrade_cron_array()`, `:1331`). A estrutura, a chave de cada ocorrencia, a
 * ordem e as duas operacoes sobre ela estao em `../fila/estrutura-gravada.ts`;
 * aqui esta a **morada**: a consulta que le a linha e os comandos que a escrevem.
 *
 * ## O que esta leitura faz, na ordem do legado
 *
 * ```php
 * function _get_cron_array() {
 *     $cron = get_option( 'cron' );
 *     if ( ! is_array( $cron ) ) {
 *         return array();
 *     }
 *     if ( ! isset( $cron['version'] ) ) {
 *         $cron = _upgrade_cron_array( $cron );   // e ISTO GRAVA
 *     }
 *     unset( $cron['version'] );
 *     return $cron;
 * }
 * ```
 *
 * Tres consequencias que esta porta reproduz, e que um porte "limpo" perde:
 *
 * 1. **valor gravado que nao e arranjo vira fila vazia**, sem erro e sem apagar a
 *    linha (`:1263`-`1265`). Opcao ausente, texto solto, numero: todos dao
 *    `FILA_VAZIA`;
 * 2. **ler uma fila de versao 1 ESCREVE no banco** (`:1348`). E a unica leitura
 *    desta feature que emite comando de escrita, e ela acontece **antes** de
 *    qualquer agendamento;
 * 3. **o marcador de versao sai na leitura e volta na gravacao** (`:1275`,
 *    `:1302`), logo a fila em memoria nunca o tem e a gravada sempre o tem, no
 *    fim da estrutura.
 *
 * ## 🔴 O que esta porta NAO reproduz, e e de `015`
 *
 * No legado nenhuma dessas duas linhas e lida por consulta propria: as duas tem
 * carregamento automatico ligado, logo chegam **juntas**, numa consulta so, no
 * comeco da requisicao — `SELECT option_name, option_value FROM {site}options
 * WHERE autoload IN ( 'on', 'auto-on', 'auto' )`
 * (`wp-includes/option.php:627`) — e `get_option()` as serve do cache de objeto
 * dali em diante (`:163`-`:175`). A excecao e a trava, que tem uma consulta
 * escrita a mao de proposito (ver `trava-em-transiente.ts`).
 *
 * Esta porta emite, no lugar, uma leitura por linha — com o mesmo texto que
 * `get_option()` usa quando o cache nao tem a opcao
 * (`SELECT option_value FROM {site}options WHERE option_name = ? LIMIT 1`,
 * `wp-includes/option.php:206` e `:223`). **A diferenca e de
 * sequencia de comandos, nao de efeito**, e ela existe porque o registro de
 * opcoes e o cache de objeto sao a feature `015` (REQ-170 / `plataforma/opcoes`,
 * que `target_architecture.md` nomeia como dona *"das opcoes e das 4 familias de
 * metadado, com o codec de `serialize()`"*). E o mesmo caminho que
 * `contextos/identidade-e-acesso/armazenamento/repositorio-de-papeis.ts` tomou
 * para `{site}user_roles`, pela mesma razao e com a mesma nota. Quando `015`
 * existir, as leituras daqui passam por ela e a sequencia volta a ser a do
 * legado; o **efeito no banco** — que e o que a area 3 da Decisao 2 compara — ja
 * e o mesmo hoje.
 *
 * Tres comandos que `update_option()` emite e que **nao** saem daqui, cada um
 * porque pertence aquele registro e nao a esta feature: a releitura de
 * `autoload` quando o chamador nao o declara (`:953` — nao se aplica, porque
 * nesta feature ele e declarado), a manutencao de `notoptions` (`:968`-`:973`) e
 * a do cache `alloptions` (`:975`-`:1005`).
 */

import {
  serializar,
  talvezDesserializar,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import {
  ESTRUTURA_VAZIA,
  converterEstruturaDaVersao1,
  estruturaSemVersao,
  filaDaEstrutura,
  valorDaEstruturaGravada,
  versaoNaEstrutura,
  type EstruturaDaFila,
} from '../fila/estrutura-gravada.js';
import { FILA_VAZIA, type FilaAgendada } from '../fila/fila-agendada.js';
import type { PortaDeDados } from '../portas/index.js';
import {
  CARREGAMENTO_AUTOMATICO_LIGADO,
  OPCAO_DA_FILA,
  tabelaDeOpcoes,
} from './chaves-e-tabelas.js';
import {
  comoTextoOuBytes,
  mesmosBytes,
  primeiraLinha,
} from './leitura-de-linha.js';

/**
 * O que uma leitura da fila informa.
 *
 * Os quatro campos juntos de proposito: {@link LeituraDaFila.estrutura} e o que
 * sera regravado — **byte a byte**, inclusive o que a projecao nao soube ler —, e
 * {@link LeituraDaFila.fila} e a leitura tipada dela. E o mesmo desenho de
 * `ValorGravado<T>` em
 * `contextos/identidade-e-acesso/armazenamento/repositorio-de-papeis.ts`: nada e
 * normalizado em silencio.
 */
export interface LeituraDaFila {
  /** A estrutura gravada, sem o marcador de versao, na ordem dos bytes. */
  readonly estrutura: EstruturaDaFila;
  /** A projecao tipada — ver {@link filaDaEstrutura}. */
  readonly fila: FilaAgendada;
  /**
   * O marcador de versao como estava gravado, ou `null` quando ele nao contava
   * (ausente, ou presente com valor nulo — `isset`, `:1271`).
   */
  readonly versaoGravada: ValorPhp | null;
  /**
   * Se esta leitura **converteu** uma fila de versao 1 e, com isso, gravou a
   * opcao (`:1272` e `:1348`).
   */
  readonly convertida: boolean;
}

export interface RepositorioDaFila {
  /** `_get_cron_array()`. Pode emitir escrita: ver {@link LeituraDaFila.convertida}. */
  obter(): LeituraDaFila;
  /**
   * `_set_cron_array()`. Devolve se chegou a escrever — **falso quando os bytes
   * nao mudaram**, que e o caso em que o legado nao emite comando nenhum
   * (`wp-includes/option.php:923`).
   */
  gravar(estrutura: EstruturaDaFila): boolean;
}

export function criarRepositorioDaFila(dados: PortaDeDados): RepositorioDaFila {
  const tabela = tabelaDeOpcoes(dados);

  function lerOpcao(): string | Uint8Array | null {
    const linha = primeiraLinha(
      dados.selecionar({
        texto: `SELECT option_value FROM ${tabela} WHERE option_name = ? LIMIT 1`,
        parametros: [OPCAO_DA_FILA],
      }),
    );
    return linha === null ? null : comoTextoOuBytes(linha['option_value']);
  }

  function gravarBytes(bytes: Uint8Array): boolean {
    const gravado = lerOpcao();

    // `update_option()` recusa escrever valor igual, e isso E efeito no banco: a
    // requisicao que "regrava a mesma fila" nao emite comando nenhum.
    if (gravado !== null && mesmosBytes(gravado, bytes)) {
      return false;
    }

    if (gravado === null) {
      // `update_option()` cai em `add_option()` quando a opcao nao existe
      // (`:928`-`:930`), e `add_option()` emite esta forma, com o carregamento
      // automatico explicito (`:1142`).
      const resultado = dados.escrever({
        texto:
          `INSERT INTO ${tabela} (option_name, option_value, autoload) VALUES (?, ?, ?)` +
          ' ON DUPLICATE KEY UPDATE option_name = VALUES(option_name),' +
          ' option_value = VALUES(option_value), autoload = VALUES(autoload)',
        parametros: [
          OPCAO_DA_FILA,
          bytes,
          CARREGAMENTO_AUTOMATICO_LIGADO,
        ],
      });
      return resultado.linhasAfetadas > 0;
    }

    const resultado = dados.escrever({
      texto: `UPDATE ${tabela} SET option_value = ? WHERE option_name = ?`,
      parametros: [bytes, OPCAO_DA_FILA],
    });
    return resultado.linhasAfetadas > 0;
  }

  return {
    obter() {
      const bruto = lerOpcao();
      if (bruto === null) {
        return leituraVazia();
      }

      // `maybe_unserialize()`, que e por onde `get_option()` devolve o valor
      // (`wp-includes/option.php:256`): valor que nao parece serializado volta
      // como texto, e valor serializado quebrado volta como falso.
      const lido = talvezDesserializar(bruto);

      // `! is_array( $cron )` (`:1263`): valor ilegivel e valor que nao e arranjo
      // dao os dois a fila vazia, sem erro e sem apagar a linha estranha.
      if (lido.tipo !== 'arranjo') {
        return leituraVazia();
      }

      const versaoGravada = versaoNaEstrutura(lido.entradas);
      if (versaoGravada === null) {
        const convertida = converterEstruturaDaVersao1(lido.entradas);
        // A conversao GRAVA, no meio da leitura (`:1348`). Nao e otimizacao de
        // leitura: e o que o legado faz, e e por isso que `convertida` sai daqui.
        gravarBytes(serializar(valorDaEstruturaGravada(convertida)));
        return {
          estrutura: convertida,
          fila: filaDaEstrutura(convertida),
          versaoGravada: null,
          convertida: true,
        };
      }

      const estrutura = estruturaSemVersao(lido.entradas);
      return {
        estrutura,
        fila: filaDaEstrutura(estrutura),
        versaoGravada,
        convertida: false,
      };
    },

    gravar(estrutura) {
      return gravarBytes(serializar(valorDaEstruturaGravada(estrutura)));
    },
  };
}

function leituraVazia(): LeituraDaFila {
  return {
    estrutura: ESTRUTURA_VAZIA,
    fila: FILA_VAZIA,
    versaoGravada: null,
    convertida: false,
  };
}
