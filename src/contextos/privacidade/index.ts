/**
 * Modulo de privacidade — BC-06 de `target_architecture.md`.
 *
 * Esqueleto da feature `008-privacidade-e-dados-pessoais`, tarefa **T001**. O que
 * existe aqui e o que T001 entrega: *"o modulo carrega com as portas de dados, de
 * relogio, de envio de e-mail e de sistema de arquivos declaradas, e o registro
 * de provedores de dado pessoal vazio e inspecionavel"*. A solicitacao como
 * registro de conteudo com os quatro estados entrou em T002, e **T017** trouxe a
 * primeira historia: US-8, o poder do nivel mais alto sobre dado pessoal de
 * terceiro, em `poder-sobre-dado-de-terceiro/`. As demais historias chegam cada
 * uma na tarefa dela (T003 em diante).
 * A leitura obrigatoria de quem pegar a tarefa seguinte esta em `./README.md` —
 * ela tem tres divergencias registradas e nao resolvidas.
 *
 * **Por que este contexto existe separado, sendo 1-para-1 com um tipo de
 * registro.** `target_architecture.md` exige justificativa para contexto que nao
 * funde nada, e a desta e por **regime, nao por tamanho**: e dominio regulado
 * (LGPD/GDPR), e dispara o caso de borda regulatorio da estrategia — **Parallel
 * Run permanente** e **nunca Big Bang**. `D1` diz literalmente *"a solicitacao e
 * um Post"* e ainda assim ela fica fora de `BC-01`, porque o ciclo de vida
 * `request-pending` → `request-confirmed` → `request-completed` /
 * `request-failed` *"nao tem intersecao com a maquina de `post_status`"*, e
 * tratar a forma de armazenamento como fronteira juntaria dois dominios com
 * reguladores diferentes.
 *
 * Duas coisas que este arquivo faz de proposito:
 *
 * - **Nao guarda estado de modulo.** BR-MIGRAR-105 (`EXT-CONTEXTO`) poe
 *   identidade, consulta corrente e conexao no escopo da REQUISICAO. Aqui isso
 *   tem um cenario de paridade proprio, `@concorrencia`: *"duas solicitacoes
 *   confirmadas, de titulares diferentes... nenhum arquivo de exportacao contem
 *   dado do outro titular"*. Por isso as portas chegam por argumento e o
 *   registro de provedores e uma **instancia nova por composicao**: duas
 *   composicoes nao se enxergam.
 * - **Nao resolve nada no carregamento.** O modulo nao le relogio, nao consulta
 *   dados, nao envia e-mail e nao toca disco ao ser criado. A ordem de arranque e
 *   contrato publico (BR-MIGRAR-106, `EXT-ORDEM`), e trabalho feito na
 *   importacao e trabalho fora da ordem. Nesta feature isso tem consequencia
 *   direta: os dois agendamentos sao registrados em `init`
 *   (`wp-includes/default-filters.php:459` e `:461`), e e **so** por isso que
 *   CA-4.4 e CA-7.3 valem — *"o agendamento existe num site que ninguem
 *   administra"*.
 */

import {
  criarArmazenamentoDePrivacidade,
  type ArmazenamentoDePrivacidade,
} from './armazenamento/index.js';
import type {
  PortaDeDados,
  PortaDeEmail,
  PortaDeRelogio,
  PortaDeSistemaDeArquivos,
} from './portas/index.js';
import {
  criarRegistroDeProvedores,
  type RegistroDeProvedores,
} from './registro/index.js';

export * from './armazenamento/index.js';
export * from './poder-sobre-dado-de-terceiro/index.js';
export * from './portas/index.js';
export * from './registro/index.js';

/** As quatro portas de que este modulo depende, na forma em que ele as recebe. */
export interface PortasDePrivacidade {
  readonly dados: PortaDeDados;
  readonly relogio: PortaDeRelogio;
  readonly email: PortaDeEmail;
  readonly sistemaDeArquivos: PortaDeSistemaDeArquivos;
}

/**
 * O modulo carregado.
 *
 * Cada historia acrescenta aqui a sua operacao, com a declaracao explicita de
 * permissao que o **P4** da constituicao exige, e **nenhuma antes da propria
 * tarefa**. Hoje ha tres coisas e nenhuma operacao: as portas e o registro, de
 * T001, e o armazenamento, de T002 — que nao decide nada.
 *
 * As operacoes que vao entrar sao as da tabela *Contratos* do `plan.md`, e a
 * permissao de cada uma ja esta lida dos casos de uso — fica registrada aqui
 * para que nenhuma delas nasca sem declaracao, e para que a tarefa que a
 * escrever nao precise redescobri-la:
 *
 * | operacao | historia | tarefa | permissao exigida |
 * |---|---|---|---|
 * | abrir solicitacao | US-1 | T003 | **`export_others_personal_data`** para exportar (`wp-admin/export-personal-data.php:12`) e **`erase_others_personal_data` E `delete_users`** para apagar (`wp-admin/erase-personal-data.php:12`). As duas primeiras resolvem para `manage_network` em rede e `manage_options` fora (`wp-includes/capabilities.php:795`) |
 * | confirmar | US-2 | T005 | **nenhuma capacidade.** UC-26: *"nao ha conta, nao ha capacidade: a posse do e-mail e a autorizacao"*. E um dos **cinco atestados** do P4, com prazo de 24 h e chave guardada com resumo |
 * | reenviar | US-3 | T007 | a mesma de abrir: o reenvio e acao da tela, sob o mesmo nonce `bulk-privacy_requests` (`wp-admin/includes/privacy-tools.php:75`) |
 * | expirar nao confirmadas | US-4 | T009 | **nenhuma.** UC-28 e literal: *"a rotina roda sem usuario e sem verificacao de capacidade: o prazo e a autorizacao"* |
 * | exportar | US-5 | T011 | a de abrir, **somada ao estado confirmado** (UC-27, CA-5.1) |
 * | apagar | US-6 | T013 | a de abrir, somada ao estado confirmado; `D4` poe as duas no nivel de rede |
 * | apagar o arquivo de exportacao | US-7 | T015 | **nenhuma.** Varredura horaria registrada no arranque (`R7`), sem usuario |
 * | apagar a pagina de politica de privacidade | US-8 | T017 | **`manage_privacy_options` somada as capacidades normais de apagar conteudo** (`D5`, `wp-includes/capabilities.php:179`) |
 *
 * ✅ **A coluna "permissao exigida" desta tabela deixou de ser promessa em T017.**
 * Os tres nomes que ela cita resolvem, agora, pelo caso de
 * `poder-sobre-dado-de-terceiro/`, e os portoes que os consomem estao escritos
 * la com o `msgid` de cada recusa. A linha de US-8 nao acrescentou operacao
 * nenhuma a {@link ModuloDePrivacidade}, e isso e a propria entrega: US-8 nao e
 * um verbo, e a resolucao de capacidade de que os outros sete verbos dependem.
 *
 * Tres linhas declaram *"nenhuma capacidade"* e isso **e** a declaracao que o P4
 * pede: as duas rotinas agendadas e a confirmacao do titular decidem acesso sem
 * consultar capacidade alguma, e *"uma matriz que ignore esses cinco atestados
 * descreve um sistema mais fechado do que o real"*.
 */
export interface ModuloDePrivacidade {
  readonly nome: 'privacidade';
  readonly portas: PortasDePrivacidade;
  /**
   * O registro de provedores desta composicao. Nasce **vazio**, que e o estado
   * inicial do legado — ver `registro/registro-de-provedores.ts`.
   */
  readonly provedores: RegistroDeProvedores;
  /**
   * A forma de armazenamento da solicitacao (T002). A linha de `user_request` e
   * **lida** aqui; os dois instantes em `postmeta` sao lidos e gravados aqui; e
   * a escrita da linha e ligacao tardia com BC-01, declarada pela tarefa que
   * grava — a razao, com as ancoras, esta em
   * `armazenamento/solicitacao.ts`.
   */
  readonly armazenamento: ArmazenamentoDePrivacidade;
}

/**
 * Compoe o modulo sobre as portas recebidas.
 *
 * Substitui, no alvo, o que no legado era ausencia de codigo: BR-MIGRAR-103
 * (`EXT-SUBST`) poe no lugar das 176 guardas `function_exists` o registro
 * explicito, resolvido antes do primeiro uso. Trocar uma porta e passar outra
 * implementacao aqui — sem alterar arquivo deste modulo, que e o criterio de
 * "substituivel" que aquela regra propoe.
 *
 * O registro de provedores e **argumento opcional**, e omiti-lo da um registro
 * vazio **novo**: nunca um compartilhado. E ele que recebe, por ligacao tardia,
 * os provedores que no legado vem dos outros contextos — e a regra de
 * dependencia 3 proibe que eles cheguem por `import`.
 *
 * A composicao e escrita a mao de proposito: a Lacuna 1 de
 * `pending_decisions.md` fixou *"nenhum framework opinativo... sem container de
 * DI, sem ORM, sem ciclo de vida de framework"*, porque a ordem de arranque do
 * legado e contrato publico e framework com ciclo de vida proprio disputa com
 * ela.
 */
export function criarModuloDePrivacidade(
  portas: PortasDePrivacidade,
  provedores: RegistroDeProvedores = criarRegistroDeProvedores(),
): ModuloDePrivacidade {
  return {
    nome: 'privacidade',
    portas,
    provedores,
    // Compor o armazenamento monta nome de tabela e nada mais: nenhuma consulta
    // sai daqui (`EXT-ORDEM`, BR-MIGRAR-106).
    armazenamento: criarArmazenamentoDePrivacidade(portas.dados),
  };
}
