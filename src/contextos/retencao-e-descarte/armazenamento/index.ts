/**
 * A forma de armazenamento dos marcadores de lixeira.
 *
 * Entrega de **T002**: *"o estado anterior e o instante do descarte sao gravados
 * e lidos como metadado do registro, para conteudo e para comentario, pela porta
 * de dados"*.
 *
 * | peca | arquivo | o que e |
 * |---|---|---|
 * | as duas tabelas e as tres chaves | `chaves-e-tabelas.ts` | o vocabulario, derivado como `_get_meta_table()` o deriva |
 * | a familia de metadado | `metadado.ts` | `add`, `get` e `delete` de `wp-includes/meta.php`, parametrizados pelo tipo |
 * | os marcadores com nome | `marcadores-de-lixeira.ts` | o estado anterior, o instante, e os estados dos comentarios agrupados |
 * | o duplo da porta | `porta-falsa.ts` | registra comando, para que "nenhum comando" seja afirmavel |
 *
 * **Nao existe `esquema.ts` aqui, e a ausencia e a decisao.** `plan.md` abre a
 * secao *Modelo de dados* com *"Esta feature nao acrescenta tabela: ela
 * acrescenta **marcadores** em metadado e um prazo em configuracao"*. O DDL de
 * `{p}postmeta` e de BC-01 e o de `{p}commentmeta` e de BC-03; emitir DDL daqui
 * criaria dois donos para a mesma tabela. E `plan.md` avisa, na secao *Migracao
 * de dados*, o que o segundo dono faria de errado: declarar restricao com
 * cascata no destino **muda o comportamento**, porque ao apagar em definitivo os
 * filhos e os anexos sao **reparentados ao avo**, nao apagados — e e esse o
 * primeiro risco do ERD e a razao de o **P5** existir.
 *
 * **Nada aqui resolve no carregamento** (`EXT-ORDEM`, BR-MIGRAR-106): criar o
 * armazenamento monta nome de tabela e nada mais — nenhuma consulta sai, nenhuma
 * opcao e lida, nenhum DDL e emitido. **E nada aqui guarda estado de modulo**
 * (`EXT-CONTEXTO`, BR-MIGRAR-105): os repositorios nascem da porta que recebem,
 * e duas composicoes de sites diferentes nao se enxergam — numa rede o
 * identificador do site entra **dentro** do nome da tabela, logo estado
 * compartilhado faria a coleta de um site apagar conteudo de outro.
 *
 * **E nenhuma regra de negocio desta feature esta aqui.** Descartar (T003),
 * suspender os comentarios (T005), restaurar (T007), avisar que apagar nao tem
 * volta (T009), coletar o que venceu (T011), expirar rascunho automatico (T013),
 * tolerar estado inconsistente (T015) e reparentar filhos (T017) sao as tarefas
 * delas. O que este armazenamento entrega e a linha, a consulta e a sequencia de
 * comandos — e e por isso que ele nao recusa estado fora do vocabulario e nao
 * exige que o registro esteja na lixeira para gravar o marcador: tolerar e o que
 * o legado faz, e `R6` faz da tolerancia o requisito de US-7.
 */

import type { PortaDeDados } from '../portas/index.js';
import {
  criarMarcadoresDeLixeiraDoComentario,
  criarMarcadoresDeLixeiraDoConteudo,
  type MarcadoresDeLixeira,
  type MarcadoresDeLixeiraDoConteudo,
} from './marcadores-de-lixeira.js';

export interface ArmazenamentoDeRetencao {
  /**
   * Os marcadores em `{site}postmeta` — os tres, porque o estado anterior dos
   * comentarios mora no conteudo (CA-2.2).
   */
  readonly marcadoresDoConteudo: MarcadoresDeLixeiraDoConteudo;
  /**
   * Os marcadores em `{site}commentmeta` — os dois, gravados quando o
   * **comentario** e descartado por si, e nao pela cascata do conteudo.
   */
  readonly marcadoresDoComentario: MarcadoresDeLixeira;
}

export function criarArmazenamentoDeRetencao(
  dados: PortaDeDados,
): ArmazenamentoDeRetencao {
  return {
    marcadoresDoConteudo: criarMarcadoresDeLixeiraDoConteudo(dados),
    marcadoresDoComentario: criarMarcadoresDeLixeiraDoComentario(dados),
  };
}

export {
  colunaDoObjeto,
  COLUNA_DA_LINHA_DE_METADADO,
  MARCADORES_DE_LIXEIRA,
  MARCADOR_DE_ESTADO_ANTERIOR,
  MARCADOR_DOS_ESTADOS_DOS_COMENTARIOS,
  MARCADOR_DO_INSTANTE_DO_DESCARTE,
  METADADO_DE_COMENTARIO,
  METADADO_DE_CONTEUDO,
  tabelaDeMetadado,
  type TipoDeMetadado,
} from './chaves-e-tabelas.js';

export {
  comoBruto,
  comoInteiro,
  comoTexto,
  primeiraLinha,
} from './leitura-de-linha.js';

export {
  criarMarcadoresDeLixeira,
  criarMarcadoresDeLixeiraDoComentario,
  criarMarcadoresDeLixeiraDoConteudo,
  type EstadoGuardadoDeComentario,
  type MarcadoresDeLixeira,
  type MarcadoresDeLixeiraDoConteudo,
} from './marcadores-de-lixeira.js';

export {
  criarRepositorioDeMetadados,
  valorDeMetadado,
  type RepositorioDeMetadados,
  type ValorDeMetadado,
} from './metadado.js';

export {
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type OpcoesDaPortaFalsa,
  type PortaDeDadosFalsa,
} from './porta-falsa.js';
