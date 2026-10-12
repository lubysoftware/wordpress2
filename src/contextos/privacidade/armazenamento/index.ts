/**
 * A forma de armazenamento da solicitacao de dado pessoal.
 *
 * Entrega de **T002** da feature `008-privacidade-e-dados-pessoais`: *"a
 * solicitacao existe como tipo de conteudo proprio, com os quatro estados do
 * legado e a chave de confirmacao guardada com resumo criptografico, lida e
 * gravada pela porta de dados"*.
 *
 * As duas estruturas da secao *Modelo de dados* do plano que sao banco, e onde
 * cada uma mora — **as duas sao tabela compartilhada, nenhuma e tabela nova**:
 *
 * | estrutura do plano | onde | arquivo |
 * |---|---|---|
 * | solicitacao como registro de conteudo | `{site}posts` com `post_type = 'user_request'` | `solicitacao.ts` |
 * | chave de confirmacao com resumo | `{site}posts`, coluna `post_password` | `chave-de-confirmacao.ts` |
 *
 * E as pecas que as atravessam:
 *
 * | peca | arquivo | por que existe |
 * |---|---|---|
 * | os quatro estados, com as propriedades efetivas do registro | `estados-da-solicitacao.ts` | e a outra metade do titulo da tarefa, e e vocabulario, nao regra |
 * | as primitivas de par chave e valor | `metadado.ts` | os dois instantes da solicitacao sao `postmeta`, e e o unico comando de escrita que este contexto emite |
 * | a leitura de coluna, com a aritmetica de data | `leitura-de-linha.ts` | o prazo de 24 h sai de uma coluna `datetime` lida como numero |
 * | os nomes de tabela, o tipo e as duas chaves | `chaves-e-tabelas.ts` | nenhum nome se monta a mao fora dali |
 * | o duplo que registra comando | `porta-falsa.ts` | o criterio desta area e *"snapshot + sequencia de comandos"* |
 *
 * **As outras duas estruturas do plano nao sao banco**, e por isso nao estao
 * aqui: *"registro de provedores de dado pessoal"* e memoria e esta em
 * `../registro/`, e *"arquivo de exportacao"* e a porta de sistema de arquivos.
 *
 * **Nada aqui resolve no carregamento** (`EXT-ORDEM`, BR-MIGRAR-106): criar o
 * armazenamento monta nome de tabela e nada mais — nenhuma consulta sai, nenhuma
 * opcao e lida, nenhum relogio e tocado. **E nada aqui guarda estado de modulo**
 * (`EXT-CONTEXTO`, BR-MIGRAR-105): os repositorios nascem da porta que recebem,
 * e duas composicoes de sites diferentes nao se enxergam — que e a primeira
 * metade do cenario `@concorrencia` de `PT-012`, *"nenhum arquivo de exportacao
 * contem dado do outro titular"*.
 *
 * 🔴 **E nenhuma regra de negocio desta feature esta aqui.** Abrir a solicitacao
 * (T003), exigir a confirmacao com prazo (T005), tratar a falha de envio como
 * estado (T007), expirar a nao confirmada (T009), exportar (T011), apagar
 * (T013), descartar o arquivo (T015) e resolver a capacidade de rede (T017) sao
 * as tarefas delas. O que este armazenamento entrega e a linha, as chaves, o
 * vocabulario de estado e a sequencia de comandos.
 *
 * ⚠️ **A gravacao da linha de `posts` nao esta aqui, de proposito.** A razao
 * esta inteira no cabecalho de `solicitacao.ts`, com as ancoras: o caminho da
 * privacidade do legado nao emite comando proprio sobre `posts` — zero `$wpdb`
 * em `privacy-tools.php` e zero na regiao de privacidade de `user.php` —, e as
 * cinco escritas passam por `wp_insert_post()` / `wp_update_post()`, que
 * reescrevem 21 colunas, reescrevem `post_modified` (de onde sai o prazo de 24
 * horas) e disparam cinco pontos de extensao publicos. A ligacao com BC-01 e
 * tardia (AD-10) e **quem a declara e a tarefa que grava**.
 */

import type { PortaDeDados } from '../portas/index.js';
import {
  criarRepositorioDeSolicitacoes,
  type RepositorioDeSolicitacoes,
} from './solicitacao.js';

export interface ArmazenamentoDePrivacidade {
  /**
   * `{site}posts` — a linha de `user_request`, **lida**; e `{site}postmeta`, por
   * `solicitacoes.metadados`, lido e gravado.
   */
  readonly solicitacoes: RepositorioDeSolicitacoes;
}

export function criarArmazenamentoDePrivacidade(
  dados: PortaDeDados,
): ArmazenamentoDePrivacidade {
  return {
    solicitacoes: criarRepositorioDeSolicitacoes(dados),
  };
}

export {
  CHAVE_DO_INSTANTE_DE_CONCLUSAO,
  CHAVE_DO_INSTANTE_DE_CONFIRMACAO,
  tabelaDeConteudo,
  tabelaDeMetadadosDeConteudo,
  TIPO_DE_SOLICITACAO,
} from './chaves-e-tabelas.js';

export {
  ALFABETO_DA_CHAVE_DE_CONFIRMACAO,
  COMPRIMENTO_DA_CHAVE_DE_CONFIRMACAO,
  MARCADOR_DE_RESUMO_GENERICO,
  SEM_CHAVE,
  type GeradorDaChaveDeConfirmacao,
  type HashDaChaveDeConfirmacao,
} from './chave-de-confirmacao.js';

export {
  ESTADO_CONCLUIDO,
  ESTADO_CONFIRMADO,
  ESTADO_DE_FALHA,
  ESTADO_PENDENTE,
  ESTADOS_ACEITOS_NA_ABERTURA,
  ESTADOS_DA_SOLICITACAO,
  ESTADOS_QUE_ACEITAM_VALIDACAO_DE_CHAVE,
  PREFIXO_DO_ESTADO,
  PROPRIEDADES_DO_ESTADO_DA_SOLICITACAO,
  type EstadoDaSolicitacao,
  type PropriedadesDeEstadoDaSolicitacao,
} from './estados-da-solicitacao.js';

export {
  comoBruto,
  comoInteiro,
  comoTexto,
  instanteDaColunaDeData,
  primeiraLinha,
  primeiroValor,
} from './leitura-de-linha.js';

export {
  AUSENTE_NA_LEITURA_UNICA,
  criarRepositorioDeMetadados,
  valorDeMetadado,
  type RepositorioDeMetadados,
  type ResultadoDaGravacaoDeMetadado,
  type ValorDeMetadado,
} from './metadado.js';

export {
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type OpcoesDaPortaFalsa,
  type PortaDeDadosFalsa,
} from './porta-falsa.js';

export {
  ACOES_DE_SOLICITACAO,
  criarRepositorioDeSolicitacoes,
  lerSolicitacao,
  SEM_CONTA,
  type RepositorioDeSolicitacoes,
  type SolicitacaoDeDadoPessoal,
  type ValorJson,
} from './solicitacao.js';
