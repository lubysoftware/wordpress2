/**
 * US-5 / T011: o passo 3 de UC-20 — *"Sistema envia ao e-mail da conta o link
 * com a chave"* — e o que acontece quando esse envio **nao** sai.
 *
 * | criterio | aqui |
 * |---|---|
 * | CA-5.1 — falha devolve ao requisitante um aviso distinto do sucesso | `avisoAoRequisitante`, **e o conflito** (ver a PARADA abaixo) |
 * | CA-5.2 — a falha fica registrada com instante, destinatario e motivo | `RegistroDeFalhaDeEnvio`, so escrita |
 * | CA-5.3 — pedir de novo apos a falha gera chave nova e tentativa nova | nada fica latchado: ver *O que esta operacao nao guarda* |
 *
 * **Falha de envio e valor, nunca excecao**, e isso ja estava decidido antes
 * desta tarefa: `portas/porta-de-email.ts` devolve `ResultadoDeEnvio`, a tabela
 * *Contratos* de `plan.md` chama a falha de *"estado reportavel e nao
 * excecao"*, e `wp_mail()` devolve booleano no legado. Esta operacao so le esse
 * valor; ela nao o produz e nao o transforma.
 *
 * ---
 *
 * # 🔴 PARADA: CA-5.1 e o ponto em que a spec e a analise do legado dizem o contrario uma da outra
 *
 * **A spec manda avisar o requisitante. A analise do legado diz que o legado
 * nao avisa — e diz isso em tres lugares independentes.**
 *
 * | lado | o que manda | onde esta escrito |
 * |---|---|---|
 * | avisar | *"Falha no envio devolve ao requisitante um aviso distinto do caso de sucesso"* | `spec.md` CA-5.1; `plan.md` § *Contratos*, linha *"pedir redefinicao de senha"* |
 * | nao avisar | *"O e-mail nao saiu \| o assinante **nao tem como saber**: nenhum estado registra a falha de envio neste fluxo, ao contrario do que acontece na solicitacao de dados pessoais"* | `use-cases/UC-20-recuperar-a-senha-de-acesso.md` § *Excecoes*, confianca 🟢 `confirmado` |
 *
 * Tres evidencias somam ao lado "nao avisar", e nenhuma delas e leitura desta
 * tarefa — todas estao escritas no pacote:
 *
 * 1. **A regra que a spec cita nao e deste fluxo.** US-5 declara valer por
 *    `D3` — *"falha de envio de e-mail e estado, nao excecao"* —, e
 *    `target_business_rules.md` BR-MIGRAR-040 ancora `D3` em
 *    `wp-admin/includes/privacy-tools.php:226` e `wp-includes/user.php:5097`:
 *    e a **solicitacao de dado pessoal**, que vai para `request-failed` e pode
 *    ser reenviada. A propria `spec.md` poe a ressalva entre parenteses, ao
 *    listar a regra de US-5: *"(o fluxo de privacidade ja faz assim; **este
 *    fluxo nao faz**)"*. A tabela de rastreabilidade de US-5 mostra a costura:
 *    as duas evidencias dela sao `wp-login.php:830` (a tela de pedido) **e**
 *    `wp-admin/includes/privacy-tools.php:226` (a ancora da regra de
 *    privacidade).
 * 2. **Nao existe string para o aviso.** `target_screens.md` conta **8**
 *    mensagens literais em `SCR-002` (`recuperacao-de-senha-pedido`,
 *    `wp-login.php` faixa 830–931) e as lista uma a uma: as duas de chave
 *    invalida e vencida, *"Lost Password"*, o texto de instrucao,
 *    *"Username or Email Address"*, *"Get New Password"*, *"Log in"* e
 *    *"Register"*. **Nenhuma e falha de envio.** E `SCR-006`
 *    (`aviso-de-e-mail-enviado`, a tela de confirmacao) tem 3, nenhuma delas
 *    tampouco. O pacote manda `diff` de string **zero** nessas telas, logo nao
 *    ha msgid para inventar.
 * 3. **Nao existe cenario de paridade para isso.**
 *    `parity_tests/06-autenticacao-e-sessao.feature` cobre UC-20 e tem cenario
 *    para o prazo da chave e para o apagamento no primeiro acesso; **nenhum**
 *    para falha de envio. A falha de envio aparece no pacote so em
 *    `12-solicitacao-de-dado-pessoal.feature`, que e o outro fluxo.
 *
 * **Por que esta tarefa nao escolhe.** O P1 da constituicao e literal:
 * *"reproduza o comportamento observavel do sistema analisado, inclusive quando
 * ele parecer defeito. Divergir exige uma decisao humana registrada, citada no
 * codigo que divergiu"* — e enumera **exatamente tres** divergencias
 * autorizadas (o tempo limite do adaptador de IA, a minimizacao do servico de
 * reputacao e o oraculo executavel). Esta nao e nenhuma das tres: nao ha
 * resposta de `questions.md` nem ADR que a autorize, `discard_log.md` nao a
 * registra e `pending_decisions.md` nao a pergunta. Ao mesmo tempo, CA-5.1 e
 * decisao de quem escreveu a spec, e REQ-007 esta na coluna `pronto` — nao em
 * `do-not-rewrite.md`, nao em `wont`. Sao duas decisoes humanas em sentidos
 * opostos, e a tabela *Nao negociavel* poe reconciliar isso fora do alcance de
 * quem codifica.
 *
 * **O que foi feito aqui, entao** — o mesmo que T002 fez com REQ-017 em
 * `armazenamento/matriz-de-fabrica.ts`: o lado e **argumento obrigatorio, sem
 * valor padrao**. Nenhuma composicao compila sem alguem escolher, a escolha fica
 * legivel onde foi feita, os dois lados estao implementados e cobertos por
 * teste, e nenhum dos dois custa retrabalho quando a decisao vier. O que **nao**
 * foi feito: escolher.
 *
 * **Duas coisas que quem decidir precisa ter na mao, e que nao estao na spec:**
 *
 * 1. o lado `ca-5-1-aviso-distinto` carrega **codigo, nao texto** — nao existe
 *    msgid registrado (evidencia 2 acima), e inventar um quebraria o `diff`
 *    zero de `SCR-002`. Quem decidir por avisar tem de registrar tambem a
 *    string, e ela e tela nova, nao paridade;
 * 2. o lado `uc-20-silencioso` faz a falha e o sucesso serem **indistinguiveis
 *    para o requisitante** — que e exatamente o que UC-20 descreve. O efeito
 *    colateral que o card REQ-007 nao menciona: avisar "o e-mail nao saiu" e um
 *    canal novo de informacao sobre a conta, e `ESC-ENUMERACAO`
 *    (BR-MIGRAR-110) ja registra que este produto enumera conta **de
 *    proposito**, por decisao humana. Logo o efeito nao e argumento contra
 *    avisar; e um ponto a decidir junto, e nao foi decidido aqui.
 *
 * ---
 *
 * # CA-5.2 entra nos DOIS lados, e nao esta em conflito
 *
 * UC-20 nega que *o assinante* possa saber, e nega **estado** que registre a
 * falha. O registro desta operacao nao e nenhum dos dois: e **so escrita**, nada
 * do sistema o le e nenhuma ramificacao depende dele. E e o que o P7 da
 * constituicao autoriza em letra: *"Registro e diagnostico novos podem ser
 * acrescentados, mas nenhuma decisao do sistema pode passar a depender deles"*,
 * com a conferencia *"nenhuma ramificacao do codigo testa o resultado de
 * escrever log"*.
 *
 * Por isso `registroDeFalha` e **obrigatorio** no contexto — CA-5.2 diz *"a
 * falha fica registrada"*, sem condicao, e um colaborador opcional deixaria a
 * composicao escolher nao cumprir o criterio — e devolve `void`, para que
 * cumprir o P7 nao dependa da disciplina de quem chama.
 *
 * O que ele registra sao os tres campos que CA-5.2 nomeia, e nenhum a mais.
 * Nada de contagem, prazo de retencao ou janela: o P6 recusa numero que o
 * legado nao tem, e a analise e explicita de que *"nenhum prazo de retencao e
 * declarado para registro editorial interno"*. O formato de uma linha JSON e o
 * slot de observabilidade da stack, e e do adaptador, nao deste contrato.
 *
 * ---
 *
 * # O que esta operacao nao guarda, e e assim que CA-5.3 passa
 *
 * **Nada.** Sem contador de tentativa, sem marca de "ja falhou", sem espera
 * entre pedidos e sem estado de modulo. Um pedido novo e um envio novo, sempre,
 * quantas vezes vier — que e o que CA-5.3 cobra e o que o fluxo alternativo
 * *"Pedido repetido antes do prazo"* de UC-20 descreve (*"uma chave nova e
 * gerada e substitui a anterior"*).
 *
 * As tres ausencias sao regra, nao economia: `do-not-rewrite.md` poe `REQ-005`
 * (suspender acesso por tentativas falhas) e `REQ-160` (limite de taxa) fora do
 * pacote, e o P6 fecha — *"Onde o legado nao tem numero, o sistema novo tambem
 * nao tem"*, com limite de taxa como decisao de implantacao, fora do nucleo.
 * Acrescentar aqui um "espere 60 segundos" seria inventar numero e fechar
 * superficie que ninguem mandou fechar.
 *
 * ---
 *
 * # O que T011 nao faz, de proposito
 *
 * **Gerar, resumir, gravar e vencer a chave e T009 (US-4), e nada disso esta
 * aqui.** `tasks.md` poe T011 *depende de: T001, T002, T009* e a linha de T009
 * seguia `[ ]`: nao existe nesta arvore a operacao de *pedir redefinicao de
 * senha* que a tabela *Contratos* de `plan.md` nomeia. Por isso esta operacao
 * recebe a `MensagemDeEmail` **pronta** e nao a monta: o corpo carrega a chave
 * em claro, e CA-4.1 — *"o valor em claro so existe no e-mail enviado"* — e
 * criterio de T009. A parte de CA-5.3 que diz *"gera uma chave nova"* tambem e
 * de T009 (CA-4.3, *"um pedido novo antes do prazo substitui a chave
 * anterior"*); a parte que e desta tarefa e a de cima: a falha nao impede o
 * pedido seguinte, e cada pedido produz um envio.
 *
 * O mesmo precedente que T003 usou com T002 aberta vale aqui: esta e a fatia
 * que US-5 descreve, escrita contra as portas, e quem pegar T009 a compoe sem
 * desdecidir nada — `enviarEmailDeRedefinicao` e o passo 3 de UC-20, e a
 * operacao de T009 e quem o chama.
 *
 * **Nao ha ponto de extensao declarado nesta operacao, e a ausencia e lida, nao
 * escolhida.** Os ganchos que o legado tem em volta deste passo sao de
 * composicao da mensagem — titulo, corpo e destinatario do aviso —, logo sao de
 * T009, que monta a mensagem. O ponto de substituicao do envio em si **e a
 * porta**: `wp_mail()` e uma das 38 funcoes substituiveis, e BR-MIGRAR-103
 * (`EXT-SUBST`) poe no lugar o registro explicito, que aqui e trocar a
 * implementacao de `PortaDeEmail` na composicao. O inventario de pontos de
 * extensao que o P2 exige **nao esta nesta arvore**, e nome, argumento e posicao
 * fecham contra o oraculo (`ESC-ORACULO`, BR-MIGRAR-116,
 * `oracleAvailable: false` aqui) — a mesma lacuna que `GanchosDaSaida` e
 * `GanchosDaEntrada` ja registram.
 */

import type {
  MensagemDeEmail,
  PortaDeEmail,
  PortaDeRelogio,
} from '../portas/index.js';

/**
 * Qual lado do conflito de CA-5.1 esta sendo construido. **Nao ha padrao.**
 *
 * - `uc-20-silencioso`: a falha devolve ao requisitante o **mesmo** aviso do
 *   sucesso, e o assinante nao tem como saber (UC-20 § *Excecoes*, 🟢; P1).
 * - `ca-5-1-aviso-distinto`: a falha devolve um aviso **distinto** do sucesso
 *   (`spec.md` CA-5.1; `plan.md` § *Contratos*).
 *
 * Ver a PARADA no cabecalho deste arquivo antes de escolher.
 */
export type LadoDoRelatoDeFalhaDeEnvio =
  | 'uc-20-silencioso'
  | 'ca-5-1-aviso-distinto';

/**
 * A falha, na forma em que CA-5.2 manda registra-la: *"instante, destinatario e
 * motivo informado pelo canal de envio"*. Tres campos, e nenhum a mais.
 */
export interface FalhaDeEnvioRegistrada {
  /**
   * Quando. Segundos inteiros em UTC, a unidade da porta de relogio e de
   * `time()` — expor milissegundo seria inventar precisao que o produto nao tem
   * (P6).
   */
  readonly instanteEmSegundos: number;
  /**
   * A quem. **Plural** porque e o que a porta carrega: `MensagemDeEmail` tem os
   * cinco argumentos de `wp_mail()`, e o primeiro deles e lista. CA-5.2 diz
   * "destinatario" no singular porque neste fluxo ha um; preservar a lista nao
   * perde esse caso e nao perde os outros.
   */
  readonly destinatarios: readonly string[];
  /** Por que, **como o canal informou** — o texto vem de `ResultadoDeEnvio`. */
  readonly motivo: string;
}

/**
 * Onde a falha fica registrada (CA-5.2).
 *
 * **So escrita, e e isso que o P7 cobra.** Devolve `void` de proposito: sem
 * valor de retorno nao ha o que ramificar, e a conferencia do P7 — *"nenhuma
 * ramificacao do codigo testa o resultado de escrever log"* — passa por
 * construcao e nao por disciplina. Nao ha `try`/`catch` em volta da chamada
 * pelo mesmo motivo: tratar o erro de escrever log **seria** a ramificacao que o
 * P7 proibe.
 */
export interface RegistroDeFalhaDeEnvio {
  registrar(falha: FalhaDeEnvioRegistrada): void;
}

/**
 * O que o requisitante ve. **E aqui que o conflito de CA-5.1 aparece**, e so
 * aqui.
 *
 * - `confirmacao-de-envio`: o aviso do caminho de sucesso. No legado e `SCR-006`
 *   (`aviso-de-e-mail-enviado`, `wp-login.php:1207`), e a tabela *Contratos* de
 *   `plan.md` o descreve como *"confirmacao de envio, sempre com a mesma
 *   forma"*.
 * - `falha-de-envio`: o aviso distinto que CA-5.1 pede. **Codigo, nao texto:**
 *   nenhum msgid registrado no pacote corresponde a ele (ver a PARADA, evidencia
 *   2), e nomear um texto aqui inventaria chave de catalogo. O precedente e o
 *   `motivo: 'token-inexistente'` de `sessao/saida.ts`: `plan.md` nomeia o erro,
 *   o legado nao tem string, e o codigo relata sem inventar.
 */
export type AvisoAoRequisitante = 'confirmacao-de-envio' | 'falha-de-envio';

/** O contexto do envio: so o que este passo toca. */
export interface ContextoDeEnvioDeRedefinicao {
  readonly email: PortaDeEmail;
  /**
   * Lido **so** quando ha falha a registrar. Ver `enviarEmailDeRedefinicao`.
   */
  readonly relogio: PortaDeRelogio;
  /** Obrigatorio: CA-5.2 nao tem condicao. Ver `RegistroDeFalhaDeEnvio`. */
  readonly registroDeFalha: RegistroDeFalhaDeEnvio;
  /** 🔴 Obrigatorio e sem padrao: o conflito de CA-5.1. Ver a PARADA. */
  readonly relatoAoRequisitante: LadoDoRelatoDeFalhaDeEnvio;
}

/**
 * O relato do envio.
 *
 * A forma do tipo diz onde esta o conflito: no sucesso o aviso e **exatamente**
 * `confirmacao-de-envio`, e so no ramo de falha ele pode ser um dos dois. Um
 * tipo que admitisse `falha-de-envio` no sucesso perderia essa leitura.
 */
export type ResultadoDoEnvioDeRedefinicao =
  | {
      readonly enviado: true;
      readonly avisoAoRequisitante: 'confirmacao-de-envio';
    }
  | {
      readonly enviado: false;
      /** O motivo que o canal informou, o mesmo que foi registrado. */
      readonly motivo: string;
      readonly avisoAoRequisitante: AvisoAoRequisitante;
    };

/**
 * Envia o e-mail de redefinicao e relata o que aconteceu — o passo 3 de UC-20.
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4). UC-20 e
 * literal: *"uma chave de uso temporario enviada ao e-mail da conta. A posse do
 * e-mail e a autorizacao — nao ha capacidade envolvida"*, e `SCR-002` registra
 * *"nenhuma checagem `current_user_can()` neste arquivo"*. A chave de
 * redefinicao e um dos cinco atestados que o P4 lista como decidindo acesso
 * **sem consultar capacidade alguma**. Exigir capacidade aqui fecharia a
 * superficie que mais precisa estar aberta: quem perdeu a senha nao esta
 * autenticado.
 *
 * Nao lanca. Nao guarda estado. Nao conta tentativa.
 */
export function enviarEmailDeRedefinicao(
  contexto: ContextoDeEnvioDeRedefinicao,
  mensagem: MensagemDeEmail,
): ResultadoDoEnvioDeRedefinicao {
  // 1. A tentativa. A falha volta como valor da porta, nunca como excecao.
  const envio = contexto.email.enviar(mensagem);

  if (envio.enviado) {
    return { enviado: true, avisoAoRequisitante: 'confirmacao-de-envio' };
  }

  // 2. CA-5.2 — os tres campos, e so escrita (P7). O relogio e lido **aqui** e
  //    nao antes: no caminho de sucesso o legado nao olha a hora, e ler o
  //    relogio sem precisar dele faria um teste de porta tocada acusar trabalho
  //    que o fluxo nao faz.
  contexto.registroDeFalha.registrar({
    instanteEmSegundos: contexto.relogio.agoraEmSegundos(),
    destinatarios: mensagem.destinatarios,
    motivo: envio.motivo,
  });

  // 3. CA-5.1 — 🔴 o conflito, e o unico lugar em que os dois lados diferem.
  return {
    enviado: false,
    motivo: envio.motivo,
    avisoAoRequisitante:
      contexto.relatoAoRequisitante === 'ca-5-1-aviso-distinto'
        ? 'falha-de-envio'
        : 'confirmacao-de-envio',
  };
}
