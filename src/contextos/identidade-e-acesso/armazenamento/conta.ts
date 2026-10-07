/**
 * A forma de armazenamento da conta — a tabela `users` do legado, `AGG-Conta`.
 *
 * `target_data_model.md` e literal sobre o que muda aqui: **nada de forma
 * observavel**. O DDL e o mesmo, as 10 colunas da variante de site unico e as
 * 12 da variante de rede sao as mesmas, e tres coisas que um porte
 * bem-intencionado mexeria ficam exatamente como estao:
 *
 * 1. **`user_status` e coluna morta** (`DB-DEAD`, BR-MIGRAR-086): existe no
 *    esquema e o nucleo **nunca escreve nada nela**. Ela e lida — some do
 *    esquema seria mudanca de contrato (P8) — e nenhuma escrita deste arquivo a
 *    menciona. O cenario de paridade cobra isso por extenso: *"quando todo o
 *    corpus de escrita e executado nas duas, nenhuma das duas escreve valor em
 *    nenhuma das duas colunas"*.
 * 2. **A data e literal, inclusive a sentinela** (`DB-SENT`): `user_registered`
 *    e texto no formato do banco, e `'0000-00-00 00:00:00'` **carrega
 *    significado de negocio**. Converter para nulo, ou para um tipo de data
 *    deste runtime, perde o significado e muda o byte gravado. 🔴 O destino da
 *    sentinela e `BR-HUMANA-003`, **pendente**; este arquivo segue a premissa
 *    declarada por `target_data_model.md`, que e manter a cadeia literal — e nao
 *    decide nada por ninguem.
 * 3. **Nao ha validacao nenhuma na gravacao.** Os 60 caracteres do login e os 50
 *    do apelido sao `U2` (BR-MIGRAR-022) e sao **erro de cadastro**, verificado
 *    no fluxo que cadastra (T013), nao no armazenamento: aqui, escrita grande
 *    demais se degrada como no legado (`DB-DEG`). E a unicidade de login e de
 *    e-mail **nao e restricao de banco**, e conferida em codigo — REQ-010, que
 *    pediria a restricao, ficou bloqueado, e o plano desta feature e explicito
 *    em nao declara-la.
 */

import type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ValorDeParametro,
} from '../portas/index.js';
import { prefixosDe, tabelaDeContas } from './chaves-e-tabelas.js';
import { comoInteiro, comoTexto, primeiraLinha } from './leitura-de-linha.js';

/**
 * A sentinela de data: o valor de fabrica de dez colunas `datetime`.
 *
 * ⚠️ Nao e "data ausente" (`VO-DataSentinela`). Em `users` ela e o valor de
 * `user_registered` de uma linha que ninguem datou.
 */
export const DATA_SENTINELA = '0000-00-00 00:00:00';

/**
 * Qual das duas variantes de DDL de `users` esta instalada.
 *
 * O legado escolhe por `$is_multisite` no momento da instalacao, e as duas
 * variantes diferem por **duas colunas**, `spam` e `deleted`. O valor de
 * fabrica e `site-unico`: a rede so existe depois que alguem a cria, e nada no
 * caminho de instalacao padrao a liga.
 */
export type VarianteDeInstalacao = 'site-unico' | 'rede';

/** As duas colunas que so existem na variante de rede. */
export interface SupervisaoDeRede {
  readonly spam: number;
  readonly deleted: number;
}

/** Uma conta, como a linha de `users` a guarda. */
export interface Conta {
  readonly id: number;
  /** `user_login` — imutavel depois de criado. */
  readonly login: string;
  /** `user_pass` — o hash, e e dele que saem os 4 caracteres da chave do cookie. */
  readonly senhaHash: string;
  /** `user_nicename` — o identificador do autor na URL. */
  readonly apelido: string;
  readonly email: string;
  readonly url: string;
  /** `user_registered` — texto em UTC, podendo ser a sentinela. */
  readonly registradoEm: string;
  /** `user_activation_key` — guarda o instante prefixado, quando ha chave. */
  readonly chaveDeAtivacao: string;
  /** `user_status` — **coluna morta**: lida aqui, escrita em lugar nenhum. */
  readonly status: number;
  readonly nomeExibido: string;
  /** `null` na variante de site unico, onde as colunas nao existem. */
  readonly supervisaoDeRede: SupervisaoDeRede | null;
}

/** O que se informa ao criar uma conta. Sem `user_status`, de proposito. */
export interface ContaNova {
  readonly login: string;
  readonly senhaHash: string;
  readonly apelido: string;
  readonly email: string;
  readonly url: string;
  readonly registradoEm: string;
  readonly chaveDeAtivacao: string;
  readonly nomeExibido: string;
}

/** Os campos alteraveis. Omitir um campo e nao toca-lo. */
export interface CamposDeConta {
  readonly senhaHash?: string;
  readonly apelido?: string;
  readonly email?: string;
  readonly url?: string;
  readonly registradoEm?: string;
  readonly chaveDeAtivacao?: string;
  readonly nomeExibido?: string;
}

/** As colunas de supervisao, que so a variante de rede tem. */
export interface CamposDeSupervisao {
  readonly spam?: number;
  readonly deleted?: number;
}

export interface RepositorioDeContas {
  inserir(conta: ContaNova): number;
  obterPorId(id: number): Conta | null;
  obterPorLogin(login: string): Conta | null;
  obterPorEmail(email: string): Conta | null;
  obterPorApelido(apelido: string): Conta | null;
  atualizar(id: number, campos: CamposDeConta): number;
  /**
   * As duas colunas de supervisao da variante de rede.
   *
   * Lanca na variante de site unico, onde as colunas **nao existem**: escrever
   * ali nao e degradacao, e consulta a coluna inexistente.
   */
  atualizarSupervisaoDeRede(id: number, campos: CamposDeSupervisao): number;
}

const COLUNAS_COMUNS = [
  'ID',
  'user_login',
  'user_pass',
  'user_nicename',
  'user_email',
  'user_url',
  'user_registered',
  'user_activation_key',
  'user_status',
  'display_name',
] as const;

const COLUNAS_DE_REDE = ['spam', 'deleted'] as const;

export function criarRepositorioDeContas(
  dados: PortaDeDados,
  variante: VarianteDeInstalacao,
): RepositorioDeContas {
  const prefixos = prefixosDe(dados);
  const tabela = tabelaDeContas(prefixos);
  const colunas =
    variante === 'rede'
      ? [...COLUNAS_COMUNS, ...COLUNAS_DE_REDE]
      : [...COLUNAS_COMUNS];

  function selecionarPor(coluna: string, valor: ValorDeParametro): Conta | null {
    const consulta: Consulta = {
      texto: `SELECT ${colunas.join(', ')} FROM ${tabela} WHERE ${coluna} = ?`,
      parametros: [valor],
    };
    const linha = primeiraLinha(dados.selecionar(consulta));
    return linha === null ? null : lerConta(linha, variante);
  }

  return {
    inserir(conta) {
      // `user_status` fica de fora: e a coluna morta, e o valor dela vem do
      // padrao do esquema. `spam` e `deleted` tambem — o legado nao os escreve
      // ao criar a conta, so ao supervisionar o site.
      const consulta: Consulta = {
        texto:
          `INSERT INTO ${tabela} ` +
          '(user_login, user_pass, user_nicename, user_email, user_url, ' +
          'user_registered, user_activation_key, display_name) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        parametros: [
          conta.login,
          conta.senhaHash,
          conta.apelido,
          conta.email,
          conta.url,
          conta.registradoEm,
          conta.chaveDeAtivacao,
          conta.nomeExibido,
        ],
      };
      const resultado = dados.escrever(consulta);
      return resultado.idGerado ?? 0;
    },

    obterPorId(id) {
      return selecionarPor('ID', id);
    },

    obterPorLogin(login) {
      return selecionarPor('user_login', login);
    },

    obterPorEmail(email) {
      return selecionarPor('user_email', email);
    },

    obterPorApelido(apelido) {
      return selecionarPor('user_nicename', apelido);
    },

    atualizar(id, campos) {
      const atribuicoes = montarAtribuicoes([
        ['user_pass', campos.senhaHash],
        ['user_nicename', campos.apelido],
        ['user_email', campos.email],
        ['user_url', campos.url],
        ['user_registered', campos.registradoEm],
        ['user_activation_key', campos.chaveDeAtivacao],
        ['display_name', campos.nomeExibido],
      ]);
      if (atribuicoes === null) {
        return 0;
      }
      return dados.escrever({
        texto: `UPDATE ${tabela} SET ${atribuicoes.texto} WHERE ID = ?`,
        parametros: [...atribuicoes.parametros, id],
      }).linhasAfetadas;
    },

    atualizarSupervisaoDeRede(id, campos) {
      if (variante !== 'rede') {
        throw new Error(
          'spam e deleted so existem na variante de rede de users',
        );
      }
      const atribuicoes = montarAtribuicoes([
        ['spam', campos.spam],
        ['deleted', campos.deleted],
      ]);
      if (atribuicoes === null) {
        return 0;
      }
      return dados.escrever({
        texto: `UPDATE ${tabela} SET ${atribuicoes.texto} WHERE ID = ?`,
        parametros: [...atribuicoes.parametros, id],
      }).linhasAfetadas;
    },
  };
}

/** A linha de `users` como `Conta`, sem interpretar nada alem do tipo da coluna. */
export function lerConta(
  linha: LinhaDeResultado,
  variante: VarianteDeInstalacao,
): Conta {
  return {
    id: comoInteiro(linha['ID']),
    login: comoTexto(linha['user_login']),
    senhaHash: comoTexto(linha['user_pass']),
    apelido: comoTexto(linha['user_nicename']),
    email: comoTexto(linha['user_email']),
    url: comoTexto(linha['user_url']),
    registradoEm: comoTexto(linha['user_registered']),
    chaveDeAtivacao: comoTexto(linha['user_activation_key']),
    status: comoInteiro(linha['user_status']),
    nomeExibido: comoTexto(linha['display_name']),
    supervisaoDeRede:
      variante === 'rede'
        ? {
            spam: comoInteiro(linha['spam']),
            deleted: comoInteiro(linha['deleted']),
          }
        : null,
  };
}

function montarAtribuicoes(
  campos: readonly (readonly [string, ValorDeParametro | undefined])[],
): { texto: string; parametros: ValorDeParametro[] } | null {
  const nomes: string[] = [];
  const parametros: ValorDeParametro[] = [];
  for (const [coluna, valor] of campos) {
    if (valor === undefined) {
      continue;
    }
    nomes.push(`${coluna} = ?`);
    parametros.push(valor);
  }
  return nomes.length === 0 ? null : { texto: nomes.join(', '), parametros };
}
