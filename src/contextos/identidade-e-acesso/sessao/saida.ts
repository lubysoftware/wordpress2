/**
 * A saida do sistema: US-2, e os tres critérios CA-2.1, CA-2.2 e CA-2.3.
 *
 * O fluxo e o alternativo *"Sair do sistema"* de UC-19, com os dois passos que
 * ele lista — *"1. Sistema destroi o token da sessao e limpa os cookies. 2. As
 * demais sessoes da mesma conta continuam validas"* — e os anexos de
 * `wp-includes/pluggable.php:1088` e `wp-login.php:794` que a tabela de
 * rastreabilidade de `spec.md` da a esta historia.
 *
 * | passo | aqui | criterio |
 * |---|---|---|
 * | destroi o token da sessao corrente, e nenhum outro | `encerrarSessao` | CA-2.1, CA-2.2 |
 * | limpa a credencial guardada no navegador | `credenciaisDoNavegador.limpar` | CA-2.1 |
 * | a identidade corrente passa a anonima, ainda nesta requisicao | `identidade.tornarAnonima` | CA-2.3 |
 * | o ponto de extensao de saida dispara, por ultimo | `ganchos.aoSair` | — |
 *
 * **Autorizacao desta operacao, declarada como o P4 exige: nenhuma capacidade.**
 * Sair nao pergunta capacidade no legado — quem esta saindo e a propria conta,
 * e o default desta superficie e aberto. O que guarda a **rota** de saida nao e
 * capacidade, e sim um **atestado**: a conferencia de nonce, e `SCR-004`
 * (`confirmacao-de-saida-do-sistema`, *"You are attempting to log out of %s"*,
 * `wp-includes/functions.php:3727`) e exatamente a tela que aparece quando essa
 * conferencia falha. O nonce e os 12 a 24 horas dele (P4) **nao sao deste
 * pacote**: nenhuma tarefa de `tasks.md` os entrega, e inventa-los aqui seria
 * fechar uma superficie que este pacote nao mandou fechar. Fica declarado: quem
 * montar a rota de saida monta a conferencia de nonce antes de chamar `sair`.
 *
 * **O que esta operacao nao faz, e por que.** Nao encerra as outras sessoes da
 * conta — e o oposto do que CA-2.2 cobra, e as duas operacoes que fazem isso
 * nascem **sem chamador** por BR-MIGRAR-111 (ver `encerramento-de-sessao.ts`).
 * Nao redireciona e nao pinta mensagem: *"You are now logged out."* e string
 * literal da tela de login (`SCR-001`, `wp-login.php:1440`), e o `case 'logout'`
 * do legado *"nao pinta: `wp_logout()` + `wp_safe_redirect`"*
 * (`screen_modernization_decision.md`). E nao escreve cookie nenhum: emitir a
 * credencial e US-3 / T007, e aqui so se **limpa** o que foi emitido.
 */

import { encerrarSessao } from './encerramento-de-sessao.js';
import type { ArmazenamentoDeSessoes } from './registro-de-sessoes.js';

/**
 * A credencial guardada no navegador, do ponto de vista deste contexto.
 *
 * **Por que colaborador, e nao porta.** AD-08 conta cinco portas no sistema, e
 * HTTP e uma delas: cookie e cabecalho de resposta vivem na borda, nao no
 * dominio. AD-04 mantem `contextos/` sincrono e proibe que o dominio alcance
 * adaptador concreto. Logo a limpeza chega por argumento, e quem a implementa e
 * a borda — a mesma borda que, em T007, vai emitir a credencial.
 *
 * ⚠️ **Lacuna declarada, nao divergencia escolhida.** Quais cookies exatamente a
 * limpeza cobre — nome, caminho e dominio de cada um, e se ela alcanca credencial
 * de formato antigo alem da corrente — **nao esta registrado em nenhum documento
 * deste pacote**: nem `target_screens.md`, nem `target_architecture.md`, nem o
 * catalogo de regras nomeiam um unico cookie. CA-2.1 fala no plural — *"limpa as
 * credenciais guardadas no navegador"* — e e esse plural que este contrato
 * preserva, sem inventar a lista. A lista e da borda, e fecha contra o oraculo
 * (`ESC-ORACULO`, BR-MIGRAR-116).
 */
export interface CredenciaisDoNavegador {
  /**
   * Limpa a credencial guardada no navegador.
   *
   * Recebe o id da conta que esta saindo porque a limpeza acontece **antes** de a
   * identidade corrente virar anonima: se alguma das credenciais limpas embutir
   * o id — e no legado ha credencial de preferencia do painel nessa forma —, uma
   * ordem invertida limparia o id errado. A ordem esta fixada em `sair` e
   * afirmada por teste; o conteudo da lista e da borda (ver acima).
   */
  limpar(idDaConta: number): void;
}

/**
 * A identidade desta requisicao, e o unico lugar em que `sair` a toca.
 *
 * Escopo de **REQUISICAO** (AD-02, BR-MIGRAR-105 `EXT-CONTEXTO`): chega por
 * argumento, nunca por estado de modulo. A area 5 do critério de paridade tem
 * tolerancia zero aqui — *"duas sessoes concorrentes nao trocam de identidade
 * entre si"* —, e identidade guardada no modulo e exatamente como esse cenario
 * quebra.
 */
export interface IdentidadeCorrente {
  /**
   * A conta autenticada nesta requisicao, ou **0** quando anonima. O zero e do
   * legado, e nao sentinela inventada: e o valor que a identidade anonima tem la.
   */
  readonly idDaConta: number;
  /**
   * O token da sessao corrente, lido da credencial do navegador pela borda.
   * Vazio quando a requisicao nao traz nenhum.
   */
  readonly tokenDaSessao: string;
  /**
   * Torna a identidade corrente anonima, **ainda nesta requisicao** (CA-2.3).
   *
   * No legado isto acontece dentro da saida, e o resto da mesma requisicao ja ve
   * a identidade anonima: o efeito e observavel, e nao arrumacao de memoria.
   */
  tornarAnonima(): void;
}

/**
 * Os pontos de extensao que a saida atravessa.
 *
 * Estao **nomeados, opcionais e com a ordem fixada** porque o P2 poe cada um no
 * contrato publico, com *"o nome, os argumentos, a ordem de disparo e a
 * capacidade de alterar o resultado"*. Nenhum dos dois altera o resultado no
 * legado. Ponto sem interceptador registrado e no-op, logo a ausencia aqui
 * reproduz o legado em vez de enfraquece-lo.
 *
 * ⚠️ **O inventario de pontos de extensao que o P2 exige nao esta nesta arvore.**
 * Os 3.373 pontos sao contados em `soul.md` e na constituicao, mas nenhum
 * documento deste pacote lista nome e argumento de um unico ponto do fluxo de
 * saida. Os dois abaixo sao os que a leitura desta tarefa reconhece no fluxo, na
 * ordem em que ela os reconhece; nome, argumento e posicao fecham contra o
 * oraculo (`ESC-ORACULO`). E a mesma lacuna que `GanchosDaEntrada` registra em
 * `autenticacao/contexto-de-autenticacao.ts`.
 */
export interface GanchosDaSaida {
  /**
   * Dispara **antes** de a credencial do navegador ser limpa, e depois de a
   * sessao corrente ser encerrada. Sem argumento.
   */
  readonly aoLimparCredencialDoNavegador?: () => void;
  /**
   * Dispara **por ultimo**, depois de a identidade corrente ja estar anonima.
   * Recebe o id da conta que saiu — que naquele ponto nao e mais a identidade
   * corrente, e por isso ele e argumento e nao consulta.
   */
  readonly aoSair?: (idDaConta: number) => void;
}

/** O contexto da saida: so o que a saida toca, e nada mais. */
export interface ContextoDeSaida {
  readonly sessoes: ArmazenamentoDeSessoes;
  readonly identidade: IdentidadeCorrente;
  readonly credenciaisDoNavegador: CredenciaisDoNavegador;
  readonly ganchos?: GanchosDaSaida;
}

/**
 * O relato da saida.
 *
 * `motivo` existe porque a tabela *Contratos* de `plan.md` declara, para
 * *"encerrar sessao corrente"*, o erro **token inexistente** — e porque o legado
 * **nao** interrompe nada nesse caso: ele apenas nao tem token para destruir, e
 * segue limpando a credencial e tornando a identidade anonima. Entao a falta de
 * token volta como **valor**, do mesmo jeito que a credencial invalida da entrada
 * volta como valor, e nao como excecao: os contratos de `plan.md` chamam a falha
 * de *"estado reportavel e nao excecao"*.
 *
 * ⚠️ **Ponto para a conferencia contra o oraculo.** `plan.md` nomeia o erro;
 * nenhum documento deste pacote diz o que o legado faz quando a saida acontece
 * sem token corrente. Esta tarefa nao escolheu entre interromper e seguir: ela
 * reproduz o fluxo que UC-19 descreve — destruir o token **e** limpar a
 * credencial — e **relata** a ausencia, para que a divergencia, se houver, apareca
 * no relato em vez de desaparecer no codigo.
 */
export interface ResultadoDeSaida {
  /**
   * A conta que saiu. **0** quando a requisicao ja era anonima, que e o valor do
   * legado para identidade ausente.
   */
  readonly idDaConta: number;
  /** Havia sessao corrente, e ela foi encerrada. */
  readonly sessaoEncerrada: boolean;
  /** A credencial do navegador foi limpa — o que a saida faz sempre. */
  readonly credencialLimpa: true;
  /** Preenchido quando nao havia token corrente a encerrar. */
  readonly motivo?: 'token-inexistente';
}

/**
 * Sai do sistema: encerra **a** sessao corrente, limpa a credencial do navegador
 * e torna a identidade anonima.
 *
 * Nao lanca, e a ordem dos quatro passos e contrato: ela decide o que cada ponto
 * de extensao ve e com qual identidade a credencial e limpa.
 */
export function sair(contexto: ContextoDeSaida): ResultadoDeSaida {
  const { idDaConta, tokenDaSessao } = contexto.identidade;

  // 1. Encerra a sessao corrente, e nenhuma outra (CA-2.1, CA-2.2).
  //
  // Token vazio **nao toca o armazenamento**: no legado a destruicao e guardada
  // por "se houver token", e sem token nenhum comando sai. Token presente mas
  // desconhecido segue o caminho normal — le o mapa e grava de volta —, e e a
  // gravacao que decide que nada chega ao banco. A diferenca entre os dois casos
  // e efeito no banco, que e o critério de paridade desta area.
  const sessaoEncerrada =
    tokenDaSessao === ''
      ? false
      : encerrarSessao(contexto.sessoes, idDaConta, tokenDaSessao);

  // 2. Limpa a credencial guardada no navegador (CA-2.1), com o ponto de
  //    extensao disparando antes da limpeza e a identidade ainda sendo a de quem
  //    sai — ver `CredenciaisDoNavegador.limpar`.
  contexto.ganchos?.aoLimparCredencialDoNavegador?.();
  contexto.credenciaisDoNavegador.limpar(idDaConta);

  // 3. A identidade corrente passa a anonima, ainda nesta requisicao (CA-2.3).
  contexto.identidade.tornarAnonima();

  // 4. O ponto de extensao de saida, por ultimo, com o id de quem saiu.
  contexto.ganchos?.aoSair?.(idDaConta);

  return {
    idDaConta,
    sessaoEncerrada,
    credencialLimpa: true,
    ...(sessaoEncerrada ? {} : { motivo: 'token-inexistente' as const }),
  };
}
