/**
 * O atendimento de uma leitura publica, de ponta a ponta — o `WP::main()` do
 * legado (`wp-includes/class-wp.php:819`), que e o que a funcao `wp()`
 * (`wp-includes/functions.php:1349`) chama e que `wp-blog-header.php:16`
 * executa em toda visita ao site.
 *
 * **Por que este arquivo existe num esqueleto: a ordem e o contrato.**
 * BR-MIGRAR-106 (`EXT-ORDEM`) poe a ordem de carregamento no contrato publico, e
 * a tabela *Nao negociavel* da constituicao poe "mudar a ordem de carregamento
 * do arranque" entre o que o agente de codificacao **nao** decide: *"ponto de
 * extensao registrado cedo ou tarde demais simplesmente nao funciona"*. A ordem
 * do legado, com as seis etapas e onde cada uma esta neste porte:
 *
 * | # | etapa no legado | onde esta neste porte |
 * |---|---|---|
 * | 1 | `init()` — resolve a identidade corrente | feature 001, `sessaoDaRequisicao`; nao e desta feature |
 * | 2 | `parse_request()` — resolve o endereco em criterios | `resolverEndereco`, **T001** |
 * | 3 | `query_posts()` — executa a consulta principal | **T003** (US-1), e a paginacao em T007 |
 * | 4 | `handle_404()` — decide a situacao da resposta | `situacaoDaResposta`, **T001**, com os tres ramos de excecao em T003 |
 * | 5 | `register_globals()` — publica o resultado para o tema | **T005** (US-2), com a hierarquia de modelos |
 * | 6 | `send_headers()` — emite os cabecalhos e o codigo | borda HTTP; o 404 por criterio `error` sai daqui (`class-wp.php:455-466`) |
 *
 * Tres propriedades dessa ordem que este arquivo preserva desde o esqueleto, e
 * que sao faceis de perder depois:
 *
 * 1. **As etapas 3, 4 e 5 so acontecem se a 2 aconteceu.** No legado sao um
 *    `if ( $parsed )` (`class-wp.php:824-828`), e `$parsed` e falso quando o
 *    ponto de extensao `do_parse_request` recusa. Fora do `if`, so a etapa 6.
 * 2. **A etapa 4 vem depois da 3, e nao antes.** Decidir a situacao antes de
 *    consultar inverte a regra: e **olhando o resultado** que o legado converte
 *    uma requisicao aparentemente bem-sucedida em 404.
 * 3. **A acao `wp` dispara sempre**, resolvida ou nao a requisicao, e depois da
 *    etapa 6 (`class-wp.php:830-839`).
 */

import type { EnderecoPedido } from './endereco-pedido.js';
import {
  resolverEndereco,
  type OpcoesDaResolucao,
  type ResolucaoDeEndereco,
} from './resolver-endereco.js';
import {
  situacaoDaResposta,
  SITUACAO_NAO_DECIDIDA,
  type OpcoesDaSituacao,
  type RespostaDaLeitura,
} from './situacao-da-resposta.js';

/**
 * O ponto de acao `wp` (`wp-includes/class-wp.php:839`).
 *
 * Dispara uma vez por requisicao, no fim do atendimento, e **sempre** — e um
 * dos ganchos mais usados por extensao de terceiro justamente porque e o
 * primeiro momento em que a consulta corrente ja esta decidida. Nao devolve
 * valor.
 */
export type ObservadorDoAtendimento = (
  atendimento: AtendimentoDaLeitura,
) => void;

/** O que o atendimento recebe, por etapa. */
export interface OpcoesDoAtendimento {
  /** Repassado a etapa 2. */
  readonly resolucao?: OpcoesDaResolucao;
  /** Repassado a etapa 4. */
  readonly situacao?: OpcoesDaSituacao;
  /** `wp`, no fim, sempre. */
  readonly aoFimDoAtendimento?: readonly ObservadorDoAtendimento[];
}

/** O que uma leitura publica produz hoje: a resolucao e a situacao. */
export interface AtendimentoDaLeitura {
  readonly resolucao: ResolucaoDeEndereco;
  readonly resposta: RespostaDaLeitura;
}

/**
 * Atende uma leitura publica.
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4). E a cara
 * publica do produto: UC-01 registra que *"nao ha verificacao de capacidade. O
 * portao e o `post_status`"*, e o ator e o visitante, que por definicao nao tem
 * papel. O portao de `post_status` entra em T009 (US-4), dentro da consulta —
 * **nao** aqui, na porta de entrada.
 *
 * Hoje a entrega e a de T001: resolve para o conjunto vazio de criterios e
 * devolve a resposta de endereco inexistente. As etapas 3 e 5 nao estao no
 * corpo desta funcao porque nao existem nesta arvore — e quem as acrescentar tem
 * de faze-lo **nas posicoes marcadas**, nao no fim.
 */
export function atenderLeituraPublica(
  pedido: EnderecoPedido,
  opcoes: OpcoesDoAtendimento = {},
): AtendimentoDaLeitura {
  // Etapa 2.
  const resolucao = resolverEndereco(pedido, opcoes.resolucao ?? {});

  // Etapas 3, 4 e 5 — todas dentro do `if ( $parsed )` do legado.
  let resposta = SITUACAO_NAO_DECIDIDA;
  if (resolucao.resolvida) {
    // Etapa 3 (T003): a consulta principal entra AQUI, antes da situacao, e e o
    // resultado dela que alimenta os tres ramos de excecao da etapa 4.
    resposta = situacaoDaResposta(resolucao, opcoes.situacao ?? {});
    // Etapa 5 (T005): o registro do resultado para o tema entra AQUI.
  }

  const atendimento: AtendimentoDaLeitura = Object.freeze({
    resolucao,
    resposta,
  });

  // Etapa 6 (borda HTTP) acontece aqui, fora do `if`.

  // A acao `wp`, sempre e por ultimo.
  for (const observador of opcoes.aoFimDoAtendimento ?? []) {
    observador(atendimento);
  }

  return atendimento;
}
