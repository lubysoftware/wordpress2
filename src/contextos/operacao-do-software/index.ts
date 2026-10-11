/**
 * Modulo de operacao do software — BC-11 de `target_architecture.md`.
 *
 * Esqueleto da feature `010-operacao-do-software`, tarefa **T001**. O que existe
 * aqui e o que T001 entrega: *"o modulo carrega com as portas de sistema de
 * arquivos, de cliente externo, de dados e de envio de e-mail declaradas, e
 * nenhuma delas implementada alem da variante local"*. `satisfaz: —
 * (infraestrutura)`: T001 **nao fecha criterio de aceite de nenhuma historia e
 * nao implementa regra de negocio nenhuma.**
 *
 * A configuracao nomeada — o estado de falha da atualizacao automatica, a
 * politica de atualizacao e a sessao de recuperacao — e **T002**, e cada historia
 * entra na tarefa dela (T003 em diante). A leitura obrigatoria de quem pegar a
 * tarefa seguinte esta em `./README.md`, e ela comeca por tres conflitos
 * registrados e nao resolvidos.
 *
 * A pasta e `contextos/operacao-do-software/` porque e assim que
 * `target_architecture.md` nomeia BC-11 no esboco de arvore; a feature se chama
 * `010-operacao-do-software` no pacote de specs, e sao a mesma coisa.
 *
 * **Por que este contexto funde sete modulos.** A justificativa esta em BC-11 e e
 * uma invariante, nao conveniencia: *"`A5`, `A6`, `A7` e `A9` sao uma so
 * invariante: a atualizacao e agendada pelo cron, o modo de recuperacao e o
 * tratador de falha da atualizacao, e os tres escrevem pelo sistema de
 * arquivos"*. Separa-los poria a classificacao de falha num modulo e o
 * congelamento noutro, e CA-9.4 exige o oposto — *"a classificacao de cada tipo
 * de falha e declarada em um lugar so"*.
 *
 * Duas coisas que este arquivo faz de proposito, as mesmas que os esqueletos de
 * BC-03, BC-04 e BC-05 fazem:
 *
 * - **Nao guarda estado de modulo.** BR-MIGRAR-105 (`EXT-CONTEXTO`) poe
 *   identidade, consulta corrente e conexao no escopo da REQUISICAO. Nesta
 *   feature isso tem um caso com nome: `A10` poe a extensao pausada no escopo da
 *   **sessao de recuperacao**, nao do site — *"o nome da opcao que guarda as
 *   extensoes pausadas carrega o identificador da sessao"* (UC-36), e e isso que
 *   permite consertar um site em producao *"sem que o visitante veja a
 *   diferenca"* (CA-12.3). Estado de modulo entregaria a pausa ao visitante. Por
 *   isso as portas chegam por argumento: duas composicoes nao se enxergam.
 * - **Nao resolve nada no carregamento.** O modulo nao consulta dados, nao toca
 *   disco, nao faz chamada externa e nao envia e-mail ao ser criado. A ordem de
 *   arranque e contrato publico (BR-MIGRAR-106, `EXT-ORDEM`, e a tabela *Nao
 *   negociavel* da constituicao), e trabalho feito na importacao e trabalho fora
 *   da ordem. `modulo.test.ts` afirma as duas coisas.
 */

import type {
  PortaDeClienteExterno,
  PortaDeDados,
  PortaDeEmail,
  PortaDeSistemaDeArquivos,
} from './portas/index.js';

export * from './portas/index.js';

/**
 * As quatro portas de que este modulo depende, na forma em que ele as recebe.
 *
 * ⚠️ **Nenhuma esta implementada aqui, e nao e omissao.** A regra de dependencia
 * 4 de `target_architecture.md` proibe `contextos/` apontar para adaptador
 * concreto, e AD-04 poe a fronteira de `await` em `adaptadores/` — pasta que
 * ainda nao existe nesta arvore. A "variante local" da entrega de T001 e o
 * transporte `direct` de {@link TransporteDeArquivo} (`TRANSPORTE_LOCAL`), que a
 * porta **nomeia** porque `update-core.php:1598` ramifica nele; os tres
 * transportes remotos nao tem implementacao em commit nenhum deste repositorio, e
 * os quatro sao construidos em `adaptadores/`. O duplo que `modulo.test.ts`
 * compoe registra comando em vez de tocar disco ou rede, que e o que o cenario
 * `@composicao` de paridade exercita e o que CLAUDE.md cobra: nada de banco,
 * rede ou relogio real em teste.
 */
export interface PortasDeOperacaoDoSoftware {
  readonly sistemaDeArquivos: PortaDeSistemaDeArquivos;
  readonly clienteExterno: PortaDeClienteExterno;
  readonly dados: PortaDeDados;
  readonly email: PortaDeEmail;
}

/**
 * O modulo carregado.
 *
 * Cada historia acrescenta aqui a sua operacao, com a declaracao explicita de
 * permissao que o P4 da constituicao exige, e **nenhuma antes da propria
 * tarefa**. Hoje ha uma coisa so, e e de T001: as portas.
 *
 * As operacoes que vao entrar sao as da tabela *Contratos* do `plan.md`, e a
 * permissao de cada uma ja esta lida dos casos de uso e da `spec.md`. Fica
 * registrada aqui como **pauta**, para que nenhuma nasca sem declaracao e para
 * que a tarefa que a escrever nao precise redescobri-la:
 *
 * | operacao | historia | tarefa | permissao, como o pacote a declara |
 * |---|---|---|---|
 * | instalar ou atualizar extensao | US-1 | T003 | `install_plugins`, `update_plugins`, `install_themes` ou `update_themes` conforme a acao, **cada uma com o seu nonce**; `upload_plugins` e `upload_themes` resolvem para as de instalar (UC-33, CA-1.1, CA-1.3). Ativar depois exige `activate_plugins`, que e outra (CA-1.4) |
 * | verificar autenticidade do pacote | US-2 | T005 | 🔴 nenhuma: o veredito nao e autorizado por capacidade. E o **conflito registrado** da `spec.md`, nao resolvido |
 * | recusar atualizacao incompativel | US-3 | T007 | nenhuma para recusar; a tela oferece atualizar o ambiente *"a quem tem a capacidade declarada para isso"* (CA-3.5), que o pacote nao nomeia |
 * | por em manutencao | US-4 | T009 | nenhuma: e passo interno de UC-33 (passo 5), sem ator |
 * | abortar sem quebrar o destino | US-5 | T011 | nenhuma; CA-5.5 pede credencial de **sistema de arquivos**, que nao e capacidade |
 * | migrar esquema | US-6 | T013 | nenhuma: roda no arranque, sem ator (UC-34) |
 * | atualizar o nucleo | US-7 | T015 | `update_core` e o nonce da tela (CA-7.1); em rede e poder de rede (CA-7.5) |
 * | atualizar automaticamente | US-8 | T017 | **nenhuma capacidade: nao ha usuario.** UC-35: *"os portoes sao a politica (constante, opcoes e filtros), a escrita no webroot e a compatibilidade do ambiente"* |
 * | classificar e reagendar a falha | US-9 | T019 | a mesma: nenhuma, e sem ator |
 * | avisar o responsavel | US-10 | T021 | nenhuma; o destinatario e `admin_email`, nao uma conta com capacidade |
 * | destravar a automacao congelada | US-11 | T023 | 🔴 a `spec.md` nao a nomeia, e a condicao de destravar e **invariante nao declarada** entre dois arquivos (pergunta em aberto 4) |
 * | entrar em modo de recuperacao | US-12 | T025 | **a chave enviada por e-mail, nao capacidade** (UC-36). Retomar extensao exige `resume_plugins`/`resume_themes`, que **nao estao em papel algum** e entram por filtro (CA-12.7, `A12`) |
 * | verificar a chave de recuperacao | US-13 | T027 | nenhuma: e um dos cinco casos de uso que o P4 registra como **nao autorizados por capacidade** |
 * | diagnosticar o ambiente | US-14 | T029 | `view_site_health_checks` (CA-14.1), concedida **por filtro** a quem pode instalar plugin, e em rede so a quem administra a rede |
 *
 * As oito que declaram *"nenhuma capacidade"* — e **nao e descuido** — sao a
 * declaracao que o P4 pede: o default destas superficies e aberto por regra lida
 * do legado, e acrescentar verificacao fecharia o sistema mais que o original.
 * `DISALLOW_FILE_MODS`, quando declarada, nega **todas** as capacidades desta
 * tabela a toda conta, inclusive a de maior poder (CA-1.6, UC-33).
 */
export interface ModuloDeOperacaoDoSoftware {
  readonly nome: 'operacao-do-software';
  readonly portas: PortasDeOperacaoDoSoftware;
}

/**
 * Compoe o modulo sobre as portas recebidas.
 *
 * Substitui, no alvo, o que no legado era ausencia de codigo: BR-MIGRAR-103
 * (`EXT-SUBST`) poe o registro explicito, resolvido antes do primeiro uso, no
 * lugar da redefinicao de funcao global e das 176 guardas `function_exists`.
 * Trocar uma porta e passar outra implementacao aqui — sem alterar arquivo deste
 * modulo, que e o criterio de "substituivel" que aquela regra propoe.
 *
 * O registro e escrito a mao de proposito: a Lacuna 1 de `pending_decisions.md`
 * fixou *"nenhum framework opinativo... sem container de DI, sem ORM, sem ciclo
 * de vida de framework"*, porque *"a ordem de arranque do legado e contrato
 * publico e framework com ciclo de vida proprio disputa com ela"*.
 */
export function criarModuloDeOperacaoDoSoftware(
  portas: PortasDeOperacaoDoSoftware,
): ModuloDeOperacaoDoSoftware {
  return {
    nome: 'operacao-do-software',
    portas,
  };
}
