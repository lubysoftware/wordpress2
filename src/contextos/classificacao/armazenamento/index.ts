/**
 * A forma de armazenamento de rotulo, contexto e juncao.
 *
 * Entrega de **T002** da feature `003-classificacao-do-conteudo`: *"as tres
 * estruturas da secao Modelo de dados do plano existem, com a chave composta da
 * juncao e a unicidade de rotulo por contexto, e sao lidas e gravadas pela porta
 * de dados"*.
 *
 * As tres estruturas, e onde cada uma mora:
 *
 * | estrutura do plano | onde | arquivo |
 * |---|---|---|
 * | `terms` — o rotulo | `{site}terms`, 4 colunas, 3 indices | `rotulo.ts` |
 * | `term_taxonomy` — o rotulo no contexto | `{site}term_taxonomy`, 6 colunas, 3 indices, **1 das 3 garantias de unicidade do banco** | `rotulo-no-contexto.ts` |
 * | `term_relationships` — a juncao | `{site}term_relationships`, 3 colunas, 2 indices, **a unica PK composta do esquema** | `vinculo.ts` |
 *
 * E as tres pecas que atravessam as tres:
 *
 * | peca | arquivo | por que existe |
 * |---|---|---|
 * | a leitura **fundida** das duas primeiras | `termo.ts` | `AGG-Termo` e a fusao de `terms` com `term_taxonomy`, e a fusao e *"do aggregate, nao das tabelas"* — a consulta existe, as tabelas continuam duas |
 * | o DDL das tres, byte a byte | `esquema.ts` | e o contrato que `DB-MIG` compara, e e ele que declara as duas garantias |
 * | a leitura de coluna | `leitura-de-linha.ts` | o driver devolve a mesma coluna como texto, numero ou bytes |
 *
 * **O que esta pasta nao tem, e de proposito:** `termmeta` (quarta linha da
 * tabela *Modelo de dados*, e nao uma das tres estruturas do titulo de T002) e
 * `links` — as duas em `chaves-e-tabelas.ts`, com o que elas cobram de quem as
 * portar.
 *
 * **Nada aqui resolve no carregamento** (`EXT-ORDEM`, BR-MIGRAR-106): criar o
 * armazenamento monta nome de tabela e nada mais — nenhuma consulta sai, nenhuma
 * opcao e lida, nenhum DDL e emitido. **E nada aqui guarda estado de modulo**
 * (`EXT-CONTEXTO`, BR-MIGRAR-105): os repositorios nascem da porta que recebem, e
 * duas composicoes de sites diferentes nao se enxergam — que e a dimensao **D-A**
 * de `parity_specs.md`.
 *
 * **E nenhuma regra de negocio desta feature esta aqui.** Separar rotulo de
 * contexto (T003), classificar conteudo substituindo a lista inteira (T005),
 * aplicar o termo padrao (T007), manter a lista com hierarquia e contagem (T009) e
 * impedir a remocao do padrao (T011) sao as tarefas delas. O que este
 * armazenamento entrega e a linha, a consulta e a sequencia de comandos — e e por
 * isso que ele nao recusa contexto nao registrado, nao cobra hierarquia em
 * contexto plano, nao resolve colisao de identificador na URL, nao recalcula
 * contagem e nao apaga em cascata: tolerar e o que o legado faz, e cada motivo
 * esta no arquivo da estrutura.
 */

import type { PortaDeDados } from '../portas/index.js';
import {
  criarRepositorioDeRotulos,
  type RepositorioDeRotulos,
} from './rotulo.js';
import {
  criarRepositorioDeRotulosNoContexto,
  type RepositorioDeRotulosNoContexto,
} from './rotulo-no-contexto.js';
import { criarLeituraDeTermos, type LeituraDeTermos } from './termo.js';
import {
  criarRepositorioDeVinculos,
  type RepositorioDeVinculos,
} from './vinculo.js';

export interface ArmazenamentoDeClassificacao {
  /** `{site}terms` — o rotulo, ignorante do contexto em que serve. */
  readonly rotulos: RepositorioDeRotulos;
  /** `{site}term_taxonomy` — o rotulo dentro de um contexto, com a contagem. */
  readonly rotulosNoContexto: RepositorioDeRotulosNoContexto;
  /** `{site}term_relationships` — a juncao, por chave composta. */
  readonly vinculos: RepositorioDeVinculos;
  /**
   * A leitura fundida das duas primeiras. Nao e uma quarta estrutura: e a forma
   * em que o legado devolve um rotulo, e em que `AGG-Termo` existe.
   */
  readonly termos: LeituraDeTermos;
}

export function criarArmazenamentoDeClassificacao(
  dados: PortaDeDados,
): ArmazenamentoDeClassificacao {
  return {
    rotulos: criarRepositorioDeRotulos(dados),
    rotulosNoContexto: criarRepositorioDeRotulosNoContexto(dados),
    vinculos: criarRepositorioDeVinculos(dados),
    termos: criarLeituraDeTermos(dados),
  };
}

export {
  tabelaDeRotulos,
  tabelaDeRotulosNoContexto,
  tabelaDeVinculos,
} from './chaves-e-tabelas.js';

export {
  ddlDeRotulos,
  ddlDeRotulosNoContexto,
  ddlDeVinculos,
  ddlDoArmazenamentoDeClassificacao,
  TAMANHO_MAXIMO_DE_INDICE,
  type OpcoesDoEsquema,
} from './esquema.js';

export {
  criarRepositorioDeRotulos,
  lerRotulo,
  SEM_GRUPO_DE_SINONIMOS,
  type CamposDoRotulo,
  type RepositorioDeRotulos,
  type Rotulo,
  type RotuloGravavel,
} from './rotulo.js';

export {
  CONTAGEM_INICIAL_DE_USO,
  criarRepositorioDeRotulosNoContexto,
  lerRotuloNoContexto,
  SEM_ROTULO_PAI,
  type CamposDoRotuloNoContexto,
  type FilhoNaHierarquia,
  type RepositorioDeRotulosNoContexto,
  type RotuloNoContexto,
  type RotuloNoContextoGravavel,
} from './rotulo-no-contexto.js';

export {
  criarRepositorioDeVinculos,
  lerVinculo,
  SEM_ORDEM,
  type ChaveDoVinculo,
  type RepositorioDeVinculos,
  type Vinculo,
  type VinculoOrdenado,
} from './vinculo.js';

export {
  criarLeituraDeTermos,
  lerTermo,
  type LeituraDeTermos,
  type Termo,
} from './termo.js';
