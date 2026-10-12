/**
 * A forma de armazenamento do conjunto de alteracoes e da configuracao do tema.
 *
 * Entrega de **T002** da feature `009-apresentacao-e-personalizacao`: *"o
 * conjunto de alteracoes existe como tipo de conteudo proprio e a configuracao
 * declarada pelo tema e lida como dado, pela porta de dados, com a mesma forma do
 * legado"*. `satisfaz: — (infraestrutura)`.
 *
 * As duas estruturas da secao *Modelo de dados* do `plan.md` que esta tarefa
 * porta — **as duas em tabela compartilhada, nenhuma em tabela nova**:
 *
 * | estrutura do plano | onde | arquivos |
 * |---|---|---|
 * | *"conjunto de alteracoes de aparencia: registro de conteudo de tipo proprio, com os valores alterados serializados"* | `{site}posts`, `post_type = 'customize_changeset'` | `tipo-do-conjunto.ts`, `estado-do-conjunto.ts`, `conjunto-de-alteracoes.ts` |
 * | *"configuracao do tema"* (UC-32: *"permanece **nas opcoes**, nao apagada"*) | `{site}options`, em cinco chaves mais a de modificacoes | `configuracao-do-tema.ts`, `opcao.ts` |
 *
 * E as pecas que as atravessam:
 *
 * | peca | arquivo | por que existe |
 * |---|---|---|
 * | os nomes de tabela, tipo, opcao e modificacao | `chaves-e-tabelas.ts` | nenhum nome se monta a mao fora dali, e nome de opcao e superficie publicada (**P8**) |
 * | a leitura de coluna | `leitura-de-linha.ts` | o driver devolve texto, numero ou bytes, e `option_value` vai **em bytes** para o *codec* |
 * | o duplo que registra comando | `porta-falsa.ts` | o criterio desta area e *"snapshot + sequencia de comandos"*, e tres operacoes daqui **nao emitem comando** |
 *
 * ## As tres estruturas do plano que NAO estao aqui, e de quem sao
 *
 * - **estilos globais** (*"outro registro de conteudo de tipo proprio"*) —
 *   `wp_global_styles` (`wp-includes/post.php:496`-`:527`). E a *"declaracao do
 *   site"* de **CA-12.2**, e quem a declara e **T025** (US-12), junto com a
 *   resolucao em folha de estilo. T002 porta *"a alteracao de aparencia"*, que e o
 *   conjunto;
 * - **menu de navegacao** (*"e um contexto de classificacao, e cada item e um
 *   registro de conteudo"*) — **T011** (US-5), e o termo e `BC-02`, ja merged em
 *   `contextos/classificacao/`;
 * - **componentes de area** (*"configuracao serializada, com o mapa de area para
 *   lista de componentes"*) — a opcao `sidebars_widgets` e **T015** (US-7), e o
 *   mapa do tema anterior e **T019** (US-9). O que esta aqui e a **modificacao de
 *   tema** de mesmo nome, nomeada em `chaves-e-tabelas.ts` porque
 *   `switch_theme()` a escreve.
 *
 * E **a quarta linha do plano, *"configuracao declarada pelo tema: arquivo no
 * tema"*, continua sendo arquivo**: ela e lida pelo sistema de arquivos e
 * resolvida em folha de estilo por **T025** e **T031**, nao aqui. O cabecalho de
 * `configuracao-do-tema.ts` registra a divisao e por que ela foi feita assim.
 *
 * ## Nada resolve no carregamento, e nada guarda estado
 *
 * **`EXT-ORDEM` (BR-MIGRAR-106):** criar o armazenamento monta nome de tabela e
 * nada mais — nenhuma consulta sai, nenhuma opcao e lida, nenhum tipo se
 * registra. O registro do tipo de conteudo e **dado** (`tipo-do-conjunto.ts`), e
 * quem o registra e o arranque, cuja ordem e contrato publico.
 *
 * **`EXT-CONTEXTO` (BR-MIGRAR-105):** os repositorios nascem da porta que
 * recebem, e duas composicoes nao se enxergam. Nesta feature isso tem peso
 * proprio: a aparencia e configuracao **por site**, e numa rede o identificador
 * do site entra **dentro** do nome da tabela — um modulo com estado trocaria o
 * tema de um site pelo do outro, e **CA-8.5** poe a rede no criterio de aceite.
 *
 * ## E nenhuma regra de negocio desta feature esta aqui
 *
 * Pre-visualizar (T003), separar a permissao de salvar da de aplicar (T005),
 * relatar o estado gravado (T007), agendar (T009), montar menu (T011), sinalizar
 * item orfao (T013), organizar componentes (T015), trocar o tema (T017),
 * preservar os componentes na troca (T019) e recorrer ao tema de reserva (T021)
 * sao as tarefas delas. O que este armazenamento entrega e a linha, a chave, o
 * vocabulario de estado, a forma do valor e a sequencia de comandos.
 */

import type { PortaDeDados } from '../portas/index.js';
import {
  criarRepositorioDaConfiguracaoDoTema,
  type RepositorioDaConfiguracaoDoTema,
} from './configuracao-do-tema.js';
import {
  criarRepositorioDoConjunto,
  type RepositorioDoConjunto,
} from './conjunto-de-alteracoes.js';

export interface ArmazenamentoDaApresentacao {
  /** `{site}posts` — a linha de `customize_changeset`. */
  readonly conjuntoDeAlteracoes: RepositorioDoConjunto;
  /** `{site}options` — o tema ativo e as modificacoes dele. */
  readonly configuracaoDoTema: RepositorioDaConfiguracaoDoTema;
}

export function criarArmazenamentoDaApresentacao(
  dados: PortaDeDados,
): ArmazenamentoDaApresentacao {
  return {
    conjuntoDeAlteracoes: criarRepositorioDoConjunto(dados),
    configuracaoDoTema: criarRepositorioDaConfiguracaoDoTema(dados),
  };
}

export {
  CHAVE_DO_DESCARTE_DO_CONJUNTO,
  MODIFICACAO_DE_AREAS_CLASSICAS,
  MODIFICACAO_DE_COMPONENTES_POR_AREA,
  MODIFICACAO_DE_POSICOES_DE_MENU,
  OPCAO_DAS_POSICOES_DE_MENU_NA_TROCA,
  OPCAO_DA_FOLHA_DE_ESTILO,
  OPCAO_DA_RAIZ_DA_FOLHA_DE_ESTILO,
  OPCAO_DA_RAIZ_DO_MODELO,
  OPCAO_DE_TROCA_PELA_PERSONALIZACAO,
  OPCAO_DO_MODELO,
  OPCAO_DO_NOME_DO_TEMA,
  OPCAO_DO_TEMA_ANTERIOR,
  PREFIXO_DA_OPCAO_DE_MODIFICACOES,
  PREFIXO_DA_OPCAO_DE_MODIFICACOES_ANTIGA,
  TIPO_DO_CONJUNTO_DE_ALTERACOES,
  opcaoDeModificacoesAntiga,
  opcaoDeModificacoesDoTema,
  tabelaDeConteudo,
  tabelaDeOpcoes,
} from './chaves-e-tabelas.js';

export {
  ESTADOS_ACEITOS_NA_ESCRITA,
  ESTADOS_DO_CONJUNTO,
  ESTADO_AGENDADO,
  ESTADO_AGUARDANDO_REVISAO,
  ESTADO_APLICADO,
  ESTADO_DE_RASCUNHO_AUTOMATICO,
  ESTADO_GUARDADO,
  ESTADO_NA_LIXEIRA,
  TRANSICOES_DO_CONJUNTO,
  estadoAceitoNaEscrita,
  transicaoPermitida,
  type EstadoAceitoNaEscrita,
  type EstadoDoConjunto,
  type TransicaoDoConjunto,
} from './estado-do-conjunto.js';

export {
  TIPO_DECLARADO_DO_CONJUNTO,
  capacidadesResolvidas,
  capacidadesResolvidasDoConjunto,
  type RotuloDeclarado,
  type TipoDeConteudoDeclarado,
} from './tipo-do-conjunto.js';

export {
  DATA_SENTINELA,
  FORMA_DO_IDENTIFICADOR_DO_CONJUNTO,
  SEPARADOR_DA_CHAVE_PREFIXADA,
  TIPO_DE_CONFIGURACAO_DE_MODIFICACAO,
  chaveDaConfiguracaoNoConjunto,
  conteudoDoConjunto,
  criarRepositorioDoConjunto,
  escaparForaDeAscii,
  identificadorDoConjuntoValido,
  lerConjuntoDeAlteracoes,
  lerDadosDoConjunto,
  lerParametrosDaConfiguracao,
  type ConjuntoDeAlteracoes,
  type DadosDoConjunto,
  type ErroDeLeituraDoConjunto,
  type LeituraDosDadosDoConjunto,
  type ParametrosDaConfiguracao,
  type PedidoDoConjunto,
  type RepositorioDoConjunto,
  type ValorDeJson,
} from './conjunto-de-alteracoes.js';

export {
  CARGA_AUTOMATICA_DECIDIDA_DESLIGADA,
  CARGA_AUTOMATICA_DECIDIDA_LIGADA,
  CARGA_AUTOMATICA_DESLIGADA,
  CARGA_AUTOMATICA_INDECISA,
  CARGA_AUTOMATICA_LIGADA,
  TETO_DE_BYTES_DA_CARGA_AUTOMATICA,
  VALORES_DE_CARGA_AUTOMATICA_QUE_CARREGAM,
  criarRepositorioDeOpcoes,
  determinarCargaAutomatica,
  type CargaAutomaticaDefinida,
  type PedidoDeCargaAutomatica,
  type RepositorioDeOpcoes,
} from './opcao.js';

export {
  atribuirChave,
  criarRepositorioDaConfiguracaoDoTema,
  semChave,
  valorDaChave,
  type ModificacoesDoTema,
  type RepositorioDaConfiguracaoDoTema,
  type TemaAtivoGravado,
} from './configuracao-do-tema.js';

export {
  comoBruto,
  comoInteiro,
  comoTexto,
  primeiraLinha,
  primeiroValor,
} from './leitura-de-linha.js';

export {
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type OpcoesDaPortaFalsa,
  type PortaDeDadosFalsa,
} from './porta-falsa.js';
