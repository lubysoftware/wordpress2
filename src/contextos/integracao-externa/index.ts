/**
 * Modulo de integracao externa — BC-13 de `target_architecture.md`.
 *
 * Feature `014-integracao-externa`, tarefas **T001** e **T002**. O que existe
 * aqui e o que as duas entregam: *"a porta de cliente externo e a de envio de
 * e-mail existem com uma implementacao cada, e toda chamada de saida do sistema
 * passa por elas, sem nenhuma politica de prazo ou de repeticao definida"*
 * (T001) e *"os enderecos dos servicos externos estao num registro unico e
 * inspecionavel, com o esquema de cada um explicito"* (T002, em `./catalogo/`).
 * **Nenhuma regra de negocio esta implementada**, e as duas tarefas sao
 * `satisfaz: — (infraestrutura)`: o canal cifrado entra em T003, a validacao de
 * destino em T005, a
 * precedencia de credencial em T007, a proibicao de guardar credencial em texto
 * recuperavel em T009, o prazo e o tratamento de erro em T011, o canal de
 * e-mail em T013, a consulta de versoes em T015 e a notificacao de agregadores
 * em T017 — e a leitura obrigatoria de quem pegar qualquer uma delas esta em
 * `./README.md`.
 *
 * A pasta e `contextos/integracao-externa/` porque e assim que
 * `target_architecture.md` nomeia BC-13 no esboco de arvore, com a divisao
 * escrita ao lado: *"4 (politica; o adaptador fica fora)"*. BC-13 e a fusao de
 * `cliente-http`, `ai-client`, `connectors` e `envio-de-email`, e a
 * justificativa do agrupamento e que e ali que vivem **os 5 achados de seguranca**
 * de `integrations.md`, que `ESC-HTTP` manda migrar **inteiros**: *"juntar
 * politica de integracao num contexto so e o que permite auditar os 5 de uma
 * vez"*.
 *
 * ⚠️ **Este e o contexto com mais conflito nao resolvido do pacote, e nem T001
 * nem T002 resolve nenhum deles.** Sao quatro perguntas em aberto na `spec.md`
 * (linhas 173 a 176 de `index.md`), e a primeira — REQ-149 contra a resposta
 * 12 — decide se a borda de saida recusa canal sem cifra ou o reproduz em 13
 * enderecos. A tabela *Nao negociavel* da constituicao poe os dois lados dela
 * fora do que um agente decide. O que T001 fez foi **nao fechar nenhuma das
 * duas portas**, e o que T002 faz e declarar o esquema de cada canal como
 * **fato com ancora**, em campo proprio, de modo que os dois lados continuem
 * implementaveis a partir do mesmo dado: ver o cabecalho de
 * `portas/porta-de-cliente-externo.ts`, o de `catalogo/endereco-externo.ts` e a
 * secao *O que T001 encontrou aberto* do `README.md`.
 *
 * Duas coisas que este arquivo faz de proposito, as mesmas que os esqueletos de
 * BC-03, BC-04 e BC-05 fazem:
 *
 * - **Nao guarda estado de modulo.** BR-MIGRAR-105 (`EXT-CONTEXTO`) poe
 *   identidade, consulta corrente e conexao no escopo da REQUISICAO. Aqui isso
 *   tem cenario de paridade proprio, o `@concorrencia` de `PT-017`: *"dois sites
 *   da mesma instalacao com credenciais de conector diferentes ... cada
 *   requisicao leva a credencial do seu proprio site ... e o estado de
 *   rebaixamento de canal de um nao afeta o do outro"*. Rebaixamento de canal e
 *   estado com prazo (24 h, no caminho do servico de reputacao), e estado de
 *   modulo o vazaria de um site para o outro. Por isso as portas chegam por
 *   argumento: duas composicoes nao se enxergam.
 * - **Nao resolve nada no carregamento.** Criar o modulo nao faz chamada
 *   externa, nao envia e-mail e nao le configuracao. A ordem de arranque e
 *   contrato publico (BR-MIGRAR-106, `EXT-ORDEM`, e a tabela de nao negociaveis),
 *   e trabalho feito na importacao e trabalho fora da ordem. `modulo.test.ts`
 *   afirma as duas coisas.
 */

import { CATALOGO_DE_ENDERECOS_EXTERNOS } from './catalogo/index.js';
import type { EnderecoExterno } from './catalogo/index.js';
import type { PortaDeClienteExterno, PortaDeEmail } from './portas/index.js';

export * from './portas/index.js';
export * from './borda-de-saida/index.js';
export * from './catalogo/index.js';

/** As duas portas de que este modulo depende, na forma em que ele as recebe. */
export interface PortasDeIntegracaoExterna {
  readonly clienteExterno: PortaDeClienteExterno;
  readonly email: PortaDeEmail;
}

/**
 * O modulo carregado.
 *
 * Cada historia acrescenta aqui a sua operacao, com a declaracao explicita de
 * permissao que o P4 da constituicao exige, e **nenhuma antes da propria
 * tarefa**. Hoje ha duas coisas, e nenhuma delas e operacao: as portas, de
 * T001, e o catalogo de enderecos, de T002.
 *
 * A tabela abaixo e a secao *Contratos* de `plan.md` com a permissao que o
 * pacote declara em cada operacao. Ela esta aqui como **pauta**, nao como
 * promessa de forma — quem fechar cada tarefa escreve a operacao dela e declara
 * a permissao na interface:
 *
 * | operacao | historia | tarefa | permissao, como o pacote a declara |
 * |---|---|---|---|
 * | chamar servico externo | US-1 | T003 | nenhuma: e o sistema falando com terceiro, sem ator humano. 🔴 e e aqui que mora o conflito REQ-149 x resposta 12 |
 * | validar destino | US-2 | T005 | nenhuma, e o default do legado e **nao validar** (`wp-includes/http.php:53` forca o contrario nas quatro funcoes seguras) |
 * | resolver credencial | US-3 | T007 | nenhuma para resolver; CA-3.5 poe a tela de integracoes, e quem a expuser declara a dela |
 * | guardar credencial | US-4 | T009 | a mesma da tela acima. 🔴 conflito com REQ-157 registrado na `spec.md` |
 * | declarar prazo e tratar erro | US-5 | T011 | nenhuma. 🔴 e por esta historia que passa a **unica divergencia autorizada** desta feature (resposta 18), que tem de ser citada no codigo |
 * | enviar e-mail do sistema | US-6 | T013 | nenhuma: o envio e do sistema. CA-6.4 lista as seis operacoes que dependem dele |
 * | consultar versoes e pacotes | US-7 | T015 | UC-37 nomeia `view_site_health_checks`, que **nao esta em papel algum** e e concedida por filtro a quem tem `install_plugins`; UC-33 nomeia `install_plugins`, `update_plugins`, `install_themes` ou `update_themes`, *"conforme a acao, cada uma com seu nonce"* |
 * | notificar agregadores | US-8 | T017 | nenhuma: dispara na publicacao (UC-03), e CA-8.5 proibe disparar para conteudo nao publico |
 */
export interface ModuloDeIntegracaoExterna {
  readonly nome: 'integracao-externa';
  readonly portas: PortasDeIntegracaoExterna;

  /**
   * O catalogo de enderecos externos, e a entrega de **T002**: *"os enderecos
   * dos servicos externos estao num registro unico e inspecionavel"*.
   *
   * **E o primeiro dado deste modulo**, e e dado e nao operacao: nenhuma
   * permissao e declarada aqui porque nada aqui e operacao exposta — o P4 cobra
   * declaracao explicita de permissao *"em toda operacao exposta"*, e um
   * catalogo lido nao e uma. Quem expuser este catalogo numa tela (CA-7.5
   * pede a lista *"inspecionavel por quem administra o site"*, e e T015)
   * declara a permissao da tela dela.
   *
   * As consultas ficam em `./catalogo/consultas.ts` e recebem o catalogo por
   * argumento: e por isso que elas nao estao nesta interface. Ver o cabecalho
   * daquele arquivo.
   */
  readonly catalogo: readonly EnderecoExterno[];
}

/**
 * Compoe o modulo sobre as portas recebidas.
 *
 * Substitui, no alvo, o que no legado era ausencia de codigo: BR-MIGRAR-103
 * (`EXT-SUBST`) poe o registro explicito, resolvido antes do primeiro uso, no
 * lugar da redefinicao de funcao global — e neste contexto o exemplo e literal,
 * porque `wp_mail()` **e** uma dessas funcoes
 * (`if ( ! function_exists( 'wp_mail' ) ) :`, `wp-includes/pluggable.php:146`).
 * Trocar o transporte de e-mail ou o cliente HTTP e passar outra implementacao
 * aqui, sem alterar arquivo deste modulo: e o criterio de "substituivel" de
 * BR-MIGRAR-103, e e o que o `Contexto` de `PT-017` exercita ao exigir *"a porta
 * de cliente HTTP substituida por duplo que registra cada requisicao nas duas
 * metades"*.
 *
 * O registro e escrito a mao de proposito: a Lacuna 1 de `pending_decisions.md`
 * fixou *"nenhum framework opinativo... sem container de DI, sem ORM, sem ciclo
 * de vida de framework"*, porque a ordem de arranque do legado e contrato
 * publico e framework com ciclo de vida proprio disputa com ela.
 */
export function criarModuloDeIntegracaoExterna(
  portas: PortasDeIntegracaoExterna,
): ModuloDeIntegracaoExterna {
  return {
    nome: 'integracao-externa',
    portas,
    // T002. Constante congelada, e nao copia: o catalogo e o mesmo objeto para
    // toda composicao porque e dado do LEGADO, nao estado do modulo — duas
    // composicoes nao conseguem divergir nele, e nenhuma consegue alterar a
    // outra. O que `EXT-CONTEXTO` e o cenario `@concorrencia` de `PT-017`
    // proibem compartilhar e o estado de rebaixamento de canal, que e por site
    // e com prazo, e que nao esta aqui nem vai estar: nenhum campo deste
    // catalogo diz o que aconteceu numa chamada.
    catalogo: CATALOGO_DE_ENDERECOS_EXTERNOS,
  };
}
