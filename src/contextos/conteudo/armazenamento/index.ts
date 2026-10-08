/**
 * A forma de armazenamento de conteudo, metadado e versao anterior.
 *
 * Entrega de **T002** da feature `002-autoria-e-publicacao`: *"as estruturas da
 * secao Modelo de dados do plano existem e sao lidas e gravadas pela porta de
 * dados, incluindo a auto-referencia que liga filho, anexo e versao ao registro
 * pai"*.
 *
 * As tres estruturas da secao *Modelo de dados* do plano, e onde cada uma mora
 * — **duas delas sao a mesma tabela**:
 *
 * | estrutura do plano | onde | arquivo |
 * |---|---|---|
 * | `posts` | `{site}posts`, 23 colunas | `conteudo.ts` |
 * | `postmeta` | `{site}postmeta`, 4 colunas | `metadado.ts` |
 * | versoes anteriores | `{site}posts` com `post_type = 'revision'` | `versao.ts` |
 *
 * E as duas pecas que atravessam as tres:
 *
 * | peca | arquivo | por que existe |
 * |---|---|---|
 * | a auto-referencia nas **tres** semanticas | `vinculo-com-o-pai.ts` | o plano manda: *"`post_parent` precisa virar tres relacionamentos"* |
 * | o DDL das duas tabelas, byte a byte | `esquema.ts` | e o contrato que `DB-MIG` compara, e e ele que carrega o default `publish` da coluna de estado |
 *
 * **Nada aqui resolve no carregamento** (`EXT-ORDEM`, BR-MIGRAR-106): criar o
 * armazenamento monta nome de tabela e nada mais — nenhuma consulta sai, nenhuma
 * opcao e lida, nenhum DDL e emitido. **E nada aqui guarda estado de modulo**
 * (`EXT-CONTEXTO`, BR-MIGRAR-105): os repositorios nascem da porta que recebem,
 * e duas composicoes de sites diferentes nao se enxergam — que e o que o cenario
 * de concorrencia de `PT-002` cobra, *"duas gravacoes simultaneas de autores
 * diferentes nao trocam de autoria"*.
 *
 * **E nenhuma regra de negocio desta feature esta aqui.** Resolver o estado na
 * gravacao (T005), publicar (T003), cobrar a unicidade do identificador na URL
 * (T007), comparar data para agendar (T013), submeter (T015), guardar versao
 * (T021) e abrir o editor (T023) sao as tarefas delas. O que este armazenamento
 * entrega e a linha, a consulta e a sequencia de comandos — e e por isso que ele
 * nao recusa estado fora do vocabulario, nao exige pai existente e nao cobra
 * unicidade nenhuma: tolerar e o que o legado faz, e os tres motivos estao em
 * `conteudo.ts`.
 */

import type { PortaDeDados } from '../portas/index.js';
import {
  criarRepositorioDeConteudo,
  type RepositorioDeConteudo,
} from './conteudo.js';
import {
  criarRepositorioDeMetadadosDeConteudo,
  type RepositorioDeMetadadosDeConteudo,
} from './metadado.js';
import {
  criarRepositorioDeVersoes,
  type RepositorioDeVersoes,
} from './versao.js';

export interface ArmazenamentoDeConteudo {
  /** `{site}posts` — o registro universal, inclusive as linhas de versao. */
  readonly conteudo: RepositorioDeConteudo;
  /** `{site}postmeta` — a extensao aberta em par chave e valor. */
  readonly metadados: RepositorioDeMetadadosDeConteudo;
  /**
   * As leituras que **a versao** tem de proprio, sobre a mesma tabela de
   * `conteudo`. Nao e uma quarta estrutura: e a terceira semantica da
   * auto-referencia, com nome.
   */
  readonly versoes: RepositorioDeVersoes;
}

export function criarArmazenamentoDeConteudo(
  dados: PortaDeDados,
): ArmazenamentoDeConteudo {
  return {
    conteudo: criarRepositorioDeConteudo(dados),
    metadados: criarRepositorioDeMetadadosDeConteudo(dados),
    versoes: criarRepositorioDeVersoes(dados),
  };
}

export {
  tabelaDeConteudo,
  tabelaDeMetadadosDeConteudo,
} from './chaves-e-tabelas.js';

export {
  criarRepositorioDeConteudo,
  DATA_SENTINELA,
  lerConteudo,
  type CamposDeConteudo,
  type Conteudo,
  type ConteudoGravavel,
  type RepositorioDeConteudo,
} from './conteudo.js';

export {
  ddlDeConteudo,
  ddlDeMetadadosDeConteudo,
  ddlDoArmazenamentoDeConteudo,
  TAMANHO_MAXIMO_DE_INDICE,
  type OpcoesDoEsquema,
} from './esquema.js';

export {
  criarRepositorioDeMetadadosDeConteudo,
  valorDeMetadado,
  type MetadadoDeConteudo,
  type RepositorioDeMetadadosDeConteudo,
  type ResultadoDaGravacaoDeMetadado,
  type ValorDeMetadado,
} from './metadado.js';

export {
  camposDaVersao,
  CAMPOS_VERSIONAVEIS,
  COLUNAS_NAO_VERSIONAVEIS,
  criarRepositorioDeVersoes,
  eSalvamentoAutomatico,
  ESTADO_DE_VERSAO,
  idDoOriginal,
  nomeDaVersao,
  versaoDoNome,
  type CamposDaVersao,
  type CamposVersionados,
  type NomeDeVersao,
  type RepositorioDeVersoes,
} from './versao.js';

export {
  colunaDoVinculo,
  SEM_PAI,
  TIPO_DE_ANEXO,
  TIPO_DE_VERSAO,
  vinculoDaLinha,
  type VinculoComOPai,
} from './vinculo-com-o-pai.js';
