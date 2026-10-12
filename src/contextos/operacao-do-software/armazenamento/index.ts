/**
 * A forma de armazenamento da configuracao desta feature.
 *
 * Entrega de **T002** da feature `010-operacao-do-software`, metade *"sao lidos
 * e gravados pela porta de dados"*. A outra metade — *"os pontos de
 * configuracao ... existem com os valores de fabrica do legado"* — esta em
 * `../configuracao/`.
 *
 * O plano desta feature abre a secao *Modelo de dados* dizendo o que ela e:
 * *"Esta feature guarda pouco e escreve muito: o que ela modela e **estado de
 * operacao**, quase todo em configuracao nomeada"*. Daqui sai, literalmente,
 * **nenhuma tabela nova**: as duas tabelas sao compartilhadas, e AD-11 proibe
 * mudanca de esquema nesta fase.
 *
 * | peca | arquivo | por que existe |
 * |---|---|---|
 * | os nomes de tabela e de opcao | `chaves-e-tabelas.ts` | nenhum nome se monta a mao fora dali, e os dois prefixos sao usados |
 * | a primitiva de opcao, por site e de rede | `opcao.ts` | e o `get_option`/`update_site_option` do legado, com os casos em que nenhum comando sai |
 * | a verdade de PHP de um valor | `verdade-de-php.ts` | quatro decisoes desta feature sao tomadas com `if ( $valor )` sobre opcao |
 * | leitura de coluna | `leitura-de-linha.ts` | o driver devolve a mesma coluna em tres formas |
 * | o duplo que registra comando | `porta-falsa.ts` | o criterio desta area e *"snapshot + sequencia de comandos"* |
 *
 * **Nada aqui resolve no carregamento** (`EXT-ORDEM`, BR-MIGRAR-106): criar o
 * armazenamento monta nome de tabela e nada mais — nenhuma consulta sai,
 * nenhuma opcao e lida. **E nada aqui guarda estado de modulo**
 * (`EXT-CONTEXTO`, BR-MIGRAR-105): os repositorios nascem da porta que recebem,
 * e o escopo de rede chega **por argumento em cada chamada**, porque em rede o
 * site corrente muda dentro da mesma requisicao.
 *
 * **E nenhuma regra de negocio desta feature esta aqui.** Classificar a falha
 * (T019), congelar a automacao (T019), destravar (T023), decidir se atualiza
 * (T015, T017), enviar ou nao o aviso (T021), emitir e consumir a chave de
 * recuperacao (T025, T027) e diagnosticar (T029) sao as tarefas delas. O que
 * este armazenamento entrega e a linha, a chave, a forma do valor e a sequencia
 * de comandos.
 */

import type { PortaDeDados } from '../portas/index.js';
import {
  criarRepositorioDeOpcoesDeRede,
  criarRepositorioDeOpcoesDoSite,
  type RepositorioDeOpcoesDeRede,
  type RepositorioDeOpcoesDoSite,
} from './opcao.js';

export interface ArmazenamentoDeOperacaoDoSoftware {
  /** `{site}options` — a politica, o estado da recuperacao e a pausa da sessao. */
  readonly opcoesDoSite: RepositorioDeOpcoesDoSite;
  /**
   * `{base}sitemeta` em rede, `{site}options` em site unico — o estado de falha
   * e o segredo de assinatura do cookie de recuperacao.
   */
  readonly opcoesDeRede: RepositorioDeOpcoesDeRede;
}

export function criarArmazenamentoDeOperacaoDoSoftware(
  dados: PortaDeDados,
): ArmazenamentoDeOperacaoDoSoftware {
  const opcoesDoSite = criarRepositorioDeOpcoesDoSite(dados);
  return {
    opcoesDoSite,
    // A de rede recebe a de site porque o legado faz a mesma coisa: em site
    // unico `get_network_option()` CHAMA `get_option()` (`option.php:2086`), e
    // nao duplica a consulta.
    opcoesDeRede: criarRepositorioDeOpcoesDeRede(dados, opcoesDoSite),
  };
}

export {
  nomeDaOpcaoDeExtensoesPausadas,
  OPCAO_DA_CHAVE_DE_ASSINATURA_DE_RECUPERACAO,
  OPCAO_DE_ATUALIZACAO_DE_DESENVOLVIMENTO,
  OPCAO_DE_ATUALIZACAO_MAIOR,
  OPCAO_DE_ATUALIZACAO_MENOR,
  OPCAO_DE_AVISO_DA_ATUALIZACAO,
  OPCAO_DE_CHAVES_DE_RECUPERACAO,
  OPCAO_DE_FALHA_DA_ATUALIZACAO,
  OPCAO_DO_SAL_DE_ASSINATURA_DE_RECUPERACAO,
  OPCAO_DO_ULTIMO_AVISO_DE_RECUPERACAO,
  SUFIXO_DA_OPCAO_DE_EXTENSOES_PAUSADAS,
  tabelaDeOpcoesDeRede,
  tabelaDeOpcoesDoSite,
} from './chaves-e-tabelas.js';

export {
  criarRepositorioDeOpcoesDeRede,
  criarRepositorioDeOpcoesDoSite,
  determinarAutocarregamento,
  mesmoValorDeOpcao,
  OPCAO_AUSENTE,
  parametroDaOpcao,
  SITE_UNICO,
  TAMANHO_MAXIMO_DE_OPCAO_AUTOCARREGADA,
  valorDaOpcao,
  VALORES_QUE_AUTOCARREGAM,
  VALORES_REAVALIAVEIS,
  type AutocarregamentoGravado,
  type AutocarregamentoPedido,
  type EscopoDeRede,
  type LeituraDeOpcao,
  type RepositorioDeOpcoesDeRede,
  type RepositorioDeOpcoesDoSite,
} from './opcao.js';

export { verdadeiroComoNoPhp } from './verdade-de-php.js';

export { comoBruto, comoTexto, primeiraLinha } from './leitura-de-linha.js';

export {
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type OpcoesDaPortaFalsa,
  type PortaDeDadosFalsa,
} from './porta-falsa.js';
