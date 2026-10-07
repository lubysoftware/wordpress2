/**
 * A forma de armazenamento do perfil — a tabela `usermeta`.
 *
 * `usermeta` nao guarda so perfil: guarda **perfil e autorizacao**, e tambem a
 * sessao e a senha de aplicacao. Por isso este arquivo e deliberadamente burro —
 * ele conhece linha, chave e valor **bruto**, e nao conhece papel, capacidade
 * nem sessao. Quem da significado a cada chave sao `papel.ts` e `sessao.ts`, e
 * e la que o valor passa pelo codec.
 *
 * Tres comportamentos do legado que estao aqui porque sao **efeito no banco**, a
 * area da Decisao 2 que esta feature precisa reproduzir:
 *
 * 1. **A chave aceita repeticao.** Nada no esquema impede duas linhas com o
 *    mesmo `user_id` e a mesma `meta_key` — as tres unicas garantias de
 *    unicidade do banco estao em outras tabelas (`DB-UNIQ`). Por isso a leitura
 *    devolve **lista**, e nao valor.
 * 2. **Gravar valor identico nao escreve nada.** Quando existe exatamente uma
 *    linha com aquela chave e o valor e o mesmo, o legado devolve "nao gravou" e
 *    **nenhum comando sai**. Um porte que sempre escrevesse mudaria o efeito no
 *    banco de toda requisicao que "salva sem mudar nada".
 * 3. **Nao ha transacao** (BR-MIGRAR-104). Uma sequencia de escritas daqui pode
 *    falhar no meio e deixar estado parcial — e o estado parcial e a regra, nao
 *    o defeito.
 *
 * O que **nao** esta aqui: apagar a conta. A cascata de apagamento e codigo e e
 * observavel (P5), e o que some e o que fica orfao quando uma conta e apagada e
 * decisao da tarefa que administra contas (T023), com teste proprio. Um metodo
 * `apagarTudoDaConta` nascido aqui seria uma primitiva que convida a inventar
 * cascata.
 */

import type {
  LinhaDeResultado,
  PortaDeDados,
  ValorDeColuna,
  ValorDeParametro,
} from '../portas/index.js';
import { prefixosDe, tabelaDeMetadadosDeConta } from './chaves-e-tabelas.js';
import { comoBruto, comoInteiro, comoTexto } from './leitura-de-linha.js';

/** Uma linha de `usermeta`, com o valor como esta na coluna. */
export interface MetadadoDeConta {
  /** `umeta_id` — o nome irregular do legado, preservado. */
  readonly id: number;
  readonly contaId: number;
  readonly chave: string;
  readonly valor: ValorDeColuna;
}

export interface RepositorioDeMetadadosDeConta {
  listar(contaId: number): readonly MetadadoDeConta[];
  obter(contaId: number, chave: string): readonly MetadadoDeConta[];
  /** `add_user_meta`: sempre insere, inclusive quando a chave ja existe. */
  acrescentar(contaId: number, chave: string, valor: ValorDeParametro): number;
  /**
   * `update_user_meta`: insere se nao houver linha, atualiza **todas** as linhas
   * daquela chave se houver, e **nao escreve** se houver exatamente uma linha
   * com o mesmo valor. Devolve se chegou a escrever.
   */
  gravar(contaId: number, chave: string, valor: ValorDeParametro): boolean;
  /** `delete_user_meta`: apaga todas as linhas daquela chave. */
  apagar(contaId: number, chave: string): number;
  /**
   * As contas cuja chave guarda um trecho de texto.
   *
   * E assim, e so assim, que se pergunta "quem e administrador deste site": a
   * autorizacao mora num valor serializado, e **nenhum indice alcanca a
   * permissao** (`PERM-2`, pegadinha 5 de `permissions.md`). A busca e por
   * curinga dos dois lados sobre texto serializado, e e lenta de proposito —
   * e o que o legado faz.
   */
  idsDeContasComValorContendo(chave: string, trecho: string): readonly number[];
}

export function criarRepositorioDeMetadadosDeConta(
  dados: PortaDeDados,
): RepositorioDeMetadadosDeConta {
  const tabela = tabelaDeMetadadosDeConta(prefixosDe(dados));

  function selecionar(contaId: number, chave: string): MetadadoDeConta[] {
    return dados
      .selecionar({
        texto:
          `SELECT umeta_id, user_id, meta_key, meta_value FROM ${tabela} ` +
          'WHERE user_id = ? AND meta_key = ?',
        parametros: [contaId, chave],
      })
      .map(lerMetadado);
  }

  return {
    listar(contaId) {
      return dados
        .selecionar({
          texto:
            `SELECT umeta_id, user_id, meta_key, meta_value FROM ${tabela} ` +
            'WHERE user_id = ?',
          parametros: [contaId],
        })
        .map(lerMetadado);
    },

    obter(contaId, chave) {
      return selecionar(contaId, chave);
    },

    acrescentar(contaId, chave, valor) {
      const resultado = dados.escrever({
        texto:
          `INSERT INTO ${tabela} (user_id, meta_key, meta_value) VALUES (?, ?, ?)`,
        parametros: [contaId, chave, valor],
      });
      return resultado.idGerado ?? 0;
    },

    gravar(contaId, chave, valor) {
      const existentes = selecionar(contaId, chave);

      // O legado nao escreve quando ha exatamente uma linha com o mesmo valor.
      if (existentes.length === 1) {
        const atual = existentes[0] as MetadadoDeConta;
        if (mesmoValor(atual.valor, valor)) {
          return false;
        }
      }

      if (existentes.length === 0) {
        dados.escrever({
          texto:
            `INSERT INTO ${tabela} (user_id, meta_key, meta_value) VALUES (?, ?, ?)`,
          parametros: [contaId, chave, valor],
        });
        return true;
      }

      const resultado = dados.escrever({
        texto: `UPDATE ${tabela} SET meta_value = ? WHERE user_id = ? AND meta_key = ?`,
        parametros: [valor, contaId, chave],
      });
      return resultado.linhasAfetadas > 0;
    },

    apagar(contaId, chave) {
      return dados.escrever({
        texto: `DELETE FROM ${tabela} WHERE user_id = ? AND meta_key = ?`,
        parametros: [contaId, chave],
      }).linhasAfetadas;
    },

    idsDeContasComValorContendo(chave, trecho) {
      return dados
        .selecionar({
          texto:
            `SELECT user_id FROM ${tabela} ` +
            'WHERE meta_key = ? AND meta_value LIKE ?',
          parametros: [chave, `%${escaparParaLike(trecho)}%`],
        })
        .map((linha) => comoInteiro(linha['user_id']));
    },
  };
}

function lerMetadado(linha: LinhaDeResultado): MetadadoDeConta {
  return {
    id: comoInteiro(linha['umeta_id']),
    contaId: comoInteiro(linha['user_id']),
    chave: comoTexto(linha['meta_key']),
    valor: comoBruto(linha['meta_value']),
  };
}

/**
 * Os tres caracteres que o legado escapa antes de montar o padrao de busca:
 * a barra invertida e os dois curingas.
 */
export function escaparParaLike(trecho: string): string {
  return trecho.replace(/[\\%_]/g, (caractere) => `\\${caractere}`);
}

function mesmoValor(
  gravado: ValorDeColuna,
  novo: ValorDeParametro,
): boolean {
  if (gravado instanceof Uint8Array || novo instanceof Uint8Array) {
    const aqui = comoTexto(gravado);
    const ali = typeof novo === 'string' ? novo : comoTexto(novo);
    return aqui === ali;
  }
  return gravado === novo;
}
