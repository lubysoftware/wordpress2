/**
 * A forma de armazenamento de conta, perfil, sessao e definicao de papel.
 *
 * Entrega de **T002** da feature `001-identidade-e-acesso`: *"as estruturas da
 * secao Modelo de dados do plano existem, sao lidas e gravadas pela porta de
 * dados, e a matriz de fabrica e carregada com as mesmas concessoes que o
 * legado semeia"*.
 *
 * As quatro estruturas, e onde cada uma mora — duas delas **nao sao tabela**:
 *
 * | estrutura | onde | arquivo |
 * |---|---|---|
 * | conta | `{base}users`, nas duas variantes de DDL | `conta.ts` |
 * | perfil **e autorizacao** | `{base}usermeta` | `perfil.ts`, `repositorio-de-papeis.ts` |
 * | sessao | arranjo serializado em `usermeta` | `sessao.ts` |
 * | definicao de papel | opcao `{site}user_roles` | `papel.ts`, `matriz-de-fabrica.ts` |
 *
 * **T021** acrescentou a quinta, que tambem nao e tabela e tambem vive dentro de
 * `usermeta`: a lista de credenciais de aplicacao, em `senha-de-aplicacao.ts`.
 *
 * **Nada aqui resolve no carregamento** (`EXT-ORDEM`, BR-MIGRAR-106): criar o
 * armazenamento monta nome de tabela e nada mais — nenhuma consulta sai, nenhuma
 * opcao e lida. **E nada aqui guarda estado de modulo** (`EXT-CONTEXTO`,
 * BR-MIGRAR-105): os repositorios nascem da porta que recebem, e duas
 * composicoes de sites diferentes nao se enxergam.
 *
 * 🔴 **Um ponto desta entrega esta travado por decisao humana**, e nao foi
 * decidido aqui: o lado do conflito entre `REQ-017` e a resposta 5 sobre as
 * pseudocapacidades de nivel numerico. Ele e argumento obrigatorio de
 * {@link RepositorioDePapeis.semearMatrizDeFabrica}. A explicacao inteira esta
 * em `matriz-de-fabrica.ts`.
 */

import type { PortaDeDados } from '../portas/index.js';
import {
  criarRepositorioDeContas,
  type RepositorioDeContas,
  type VarianteDeInstalacao,
} from './conta.js';
import {
  criarRepositorioDePapeis,
  type RepositorioDePapeis,
} from './repositorio-de-papeis.js';
import {
  criarRepositorioDeMetadadosDeConta,
  type RepositorioDeMetadadosDeConta,
} from './perfil.js';
import {
  criarRepositorioDeSenhasDeAplicacao,
  type RepositorioDeSenhasDeAplicacao,
} from './senha-de-aplicacao.js';
import {
  criarRepositorioDeSessoes,
  type RepositorioDeSessoes,
} from './sessao.js';

export interface OpcoesDeArmazenamento {
  /**
   * Qual variante de DDL de `users` esta instalada.
   *
   * O valor de fabrica e `site-unico`, que e o que o legado tem antes de alguem
   * criar a rede: a variante de 12 colunas e escolhida por `$is_multisite` no
   * momento da instalacao.
   */
  readonly variante?: VarianteDeInstalacao;
}

export interface Armazenamento {
  readonly contas: RepositorioDeContas;
  /** `usermeta` cru: perfil, e tambem o que as outras estruturas usam por baixo. */
  readonly perfil: RepositorioDeMetadadosDeConta;
  readonly sessoes: RepositorioDeSessoes;
  readonly papeis: RepositorioDePapeis;
  /**
   * A lista de credenciais de aplicacao, tambem dentro de `usermeta` (**T021**,
   * US-10).
   *
   * E a **quinta** estrutura desta pasta, e a secao *Modelo de dados* do
   * `plan.md` conta quatro — porque la ela esta dentro de `usermeta`, que e uma
   * das quatro, e nao como estrutura propria. O que a torna um repositorio e o
   * mesmo motivo de `sessoes`: o arranjo tem forma propria, e dar significado a
   * cada chave de `usermeta` nao e trabalho de `perfil.ts`.
   */
  readonly senhasDeAplicacao: RepositorioDeSenhasDeAplicacao;
}

export function criarArmazenamento(
  dados: PortaDeDados,
  opcoes: OpcoesDeArmazenamento = {},
): Armazenamento {
  const variante = opcoes.variante ?? 'site-unico';
  const perfil = criarRepositorioDeMetadadosDeConta(dados);

  return {
    contas: criarRepositorioDeContas(dados, variante),
    perfil,
    sessoes: criarRepositorioDeSessoes(perfil),
    papeis: criarRepositorioDePapeis(dados, perfil),
    senhasDeAplicacao: criarRepositorioDeSenhasDeAplicacao(perfil),
  };
}

export {
  CHAVE_DE_SENHAS_DE_APLICACAO,
  CHAVE_DE_TOKENS_DE_SESSAO,
  chaveDeCapacidades,
  chaveDeNivel,
  opcaoDeDefinicaoDePapeis,
  prefixosDe,
  tabelaDeContas,
  tabelaDeMetadadosDeConta,
  tabelaDeOpcoes,
  type Prefixos,
} from './chaves-e-tabelas.js';

export {
  DATA_SENTINELA,
  lerConta,
  type CamposDeConta,
  type CamposDeSupervisao,
  type Conta,
  type ContaNova,
  type RepositorioDeContas,
  type SupervisaoDeRede,
  type VarianteDeInstalacao,
} from './conta.js';

export {
  escaparParaLike,
  type MetadadoDeConta,
  type RepositorioDeMetadadosDeConta,
} from './perfil.js';

export {
  camposGravaveisDeSenhaDeAplicacao,
  criarRepositorioDeSenhasDeAplicacao,
  lerCamposDeSenhaDeAplicacao,
  proximaChaveDaLista,
  type CamposDeSenhaDeAplicacao,
  type CamposGravaveisDeSenhaDeAplicacao,
  type RegistroDeSenhaDeAplicacao,
  type RepositorioDeSenhasDeAplicacao,
} from './senha-de-aplicacao.js';

export {
  camposDeSessao,
  lerCamposDeSessao,
  resumoDeToken,
  type CamposDeSessao,
  type RegistroDeSessao,
  type RepositorioDeSessoes,
} from './sessao.js';

export {
  concessoesDeValor,
  concessoesParaValor,
  criarConstrutorDeDefinicao,
  definicaoDeValor,
  definicaoParaValor,
  type ConcessaoDeCapacidade,
  type ConstrutorDeDefinicao,
  type DefinicaoDePapeis,
  type EntradaDeDefinicao,
  type Papel,
} from './papel.js';

export {
  povoarPapeis,
  povoarPapeis160,
  povoarPapeis210,
  povoarPapeis230,
  povoarPapeis250,
  povoarPapeis260,
  povoarPapeis270,
  povoarPapeis280,
  povoarPapeis300,
  type LadoDoConflitoDeNivelNumerico,
} from './matriz-de-fabrica.js';

export {
  type RepositorioDePapeis,
  type ValorGravado,
} from './repositorio-de-papeis.js';
