/**
 * A forma de armazenamento do anexo e das derivadas.
 *
 * Entrega de **T002** da feature `006-biblioteca-de-midia`: *"o anexo existe
 * como registro de conteudo com estado herdado, e o metadado que descreve as
 * derivadas e gravado e lido pela porta de dados com a mesma forma do legado"*.
 *
 * As duas estruturas da secao *Modelo de dados* do plano que sao banco, e onde
 * cada uma mora — **as duas sao tabela compartilhada, nenhuma e tabela nova**:
 *
 * | estrutura do plano | onde | arquivo |
 * |---|---|---|
 * | anexo como registro de conteudo | `{site}posts` com `post_type = 'attachment'` | `anexo.ts` |
 * | metadado do anexo | `{site}postmeta`, nas cinco chaves nomeadas | `metadado-de-anexo.ts` |
 *
 * E as pecas que as atravessam:
 *
 * | peca | arquivo | por que existe |
 * |---|---|---|
 * | a forma do valor serializado das derivadas | `derivadas.ts` | e a metade da entrega que a tarefa nomeia, e e onde a ordem das chaves fica declarada |
 * | as primitivas de par chave e valor | `metadado.ts` | `wp_update_attachment_metadata()` **e** `update_post_meta()`, com os cinco comportamentos de efeito no banco |
 * | a verdade de PHP de um valor | `verdade-de-php.ts` | duas operacoes do legado decidem entre gravar e **apagar** com `if ( $valor )` |
 * | os nomes de tabela e de chave | `chaves-e-tabelas.ts` | nenhum nome se monta a mao fora dali |
 * | o duplo que registra comando | `porta-falsa.ts` | o criterio desta area e *"snapshot + sequencia de comandos"* |
 *
 * **As outras duas estruturas do plano nao sao banco**, e por isso nao estao
 * aqui: *"original preservado"* e um arquivo em disco mais a chave
 * `original_image` do metadado (que esta em `derivadas.ts`), e *"area de
 * envios"* e a porta de sistema de arquivos.
 *
 * **Nada aqui resolve no carregamento** (`EXT-ORDEM`, BR-MIGRAR-106): criar o
 * armazenamento monta nome de tabela e nada mais — nenhuma consulta sai, nenhuma
 * opcao e lida, nenhum arquivo e tocado. **E nada aqui guarda estado de modulo**
 * (`EXT-CONTEXTO`, BR-MIGRAR-105): os repositorios nascem da porta que recebem,
 * e duas composicoes de sites diferentes nao se enxergam — que e o que o cenario
 * `@concorrencia` de `PT-014` cobra, *"dois envios simultaneos do mesmo nome nao
 * se sobrescrevem"* e *"cada anexo aponta para o seu proprio arquivo"*.
 *
 * **E nenhuma regra de negocio desta feature esta aqui.** Validar o tipo real do
 * arquivo (T003), reescrever o estado para herdado (T005), gerar as derivadas e
 * em que ordem (T007), reduzir na ingestao (T009), relatar a falha (T011),
 * escolher a derivada servida (T013), transformar e restaurar (T015), apagar o
 * arquivo (T017) e contornar o filtro de tipo (T019) sao as tarefas delas. O que
 * este armazenamento entrega e a linha, a chave, a forma do valor e a sequencia
 * de comandos.
 */

import type { PortaDeDados } from '../portas/index.js';
import { criarRepositorioDeAnexos, type RepositorioDeAnexos } from './anexo.js';
import {
  criarRepositorioDeMetadadoDeAnexo,
  type RepositorioDeMetadadoDeAnexo,
} from './metadado-de-anexo.js';

export interface ArmazenamentoDeMidia {
  /** `{site}posts` — a linha de `attachment`, lida e apagada. */
  readonly anexos: RepositorioDeAnexos;
  /** `{site}postmeta` — as cinco chaves nomeadas do anexo. */
  readonly metadadoDeAnexo: RepositorioDeMetadadoDeAnexo;
}

export function criarArmazenamentoDeMidia(
  dados: PortaDeDados,
): ArmazenamentoDeMidia {
  return {
    anexos: criarRepositorioDeAnexos(dados),
    metadadoDeAnexo: criarRepositorioDeMetadadoDeAnexo(dados),
  };
}

export {
  CHAVE_DO_ARQUIVO_ANEXADO,
  CHAVE_DO_CONTEXTO_DO_ANEXO,
  CHAVE_DO_METADADO_DE_ANEXO,
  CHAVE_DO_TEXTO_ALTERNATIVO,
  CHAVE_DOS_TAMANHOS_DE_BACKUP,
  tabelaDeConteudo,
  tabelaDeMetadadosDeConteudo,
  TIPO_DE_ANEXO,
} from './chaves-e-tabelas.js';

export {
  criarRepositorioDeAnexos,
  DATA_SENTINELA,
  ESTADO_HERDADO,
  ESTADOS_DE_ANEXO_ACEITOS,
  lerAnexo,
  SEM_CONTEUDO_DE_DESTINO,
  type Anexo,
  type EstadoDeAnexoAceito,
  type PedidoDeAnexo,
  type RepositorioDeAnexos,
} from './anexo.js';

export {
  atribuirChave,
  CHAVE_DAS_DERIVADAS,
  comDerivada,
  derivadaChamada,
  derivadaComoValor,
  lerDerivadas,
  lerMetadadoDeAnexo,
  lerTamanhosDeBackup,
  metadadoInicialDeImagem,
  ORDEM_DAS_CHAVES_DE_IMAGEM,
  tamanhoDeBackupComoValor,
  type DerivadaDeImagem,
  type DerivadaNomeada,
  type ImagemRecebida,
  type MetadadoDeAnexo,
  type TamanhoDeBackup,
} from './derivadas.js';

export {
  AUSENTE_NA_LEITURA_UNICA,
  criarRepositorioDeMetadados,
  valorDeMetadado,
  type MetadadoDeConteudo,
  type RepositorioDeMetadados,
  type ResultadoDaGravacaoDeMetadado,
  type ValorDeMetadado,
} from './metadado.js';

export {
  criarRepositorioDeMetadadoDeAnexo,
  escaparParaLike,
  type RepositorioDeMetadadoDeAnexo,
  type ResultadoDoMetadadoDeAnexo,
} from './metadado-de-anexo.js';

export { verdadeiroComoNoPhp } from './verdade-de-php.js';

export {
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type OpcoesDaPortaFalsa,
  type PortaDeDadosFalsa,
} from './porta-falsa.js';

export {
  comoBruto,
  comoInteiro,
  comoTexto,
  primeiraLinha,
  primeiroValor,
} from './leitura-de-linha.js';
