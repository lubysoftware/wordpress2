/**
 * A entrega de **T024**: *"8 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-013-1, UT-013-2, UT-013-3, UT-013-4,
 * UT-013-5, UT-013-6, UT-013-7, UT-013-8), com o mesmo dado de entrada, acao e
 * resultado esperado. O teste de regra de negocio (UT-013-8) entra na mesma
 * suite."*
 *
 * ---
 *
 * ⚠️ **`backlog/tests.md` NAO EXISTE nesta arvore, e os oito casos foram
 * RECONSTRUIDOS, nao copiados.** O caminho que `tasks.md` cita resolve para
 * `backlog/tests.md` na raiz do repositorio, e ali nao ha nada: nem a pasta
 * `backlog/`, nem o arquivo, nem copia em `_discovery/`. T008 e T016
 * encontraram a mesma ausencia e a registraram do mesmo modo — ver
 * `../sessao/ut-003-expiracao-de-sessao.test.ts` e
 * `./ut-014-autorizacao-por-capacidade.test.ts`.
 *
 * A aritmetica da reconstrucao e a mesma que T016 deixou escrita: `tasks.md` da
 * **8** casos para US-11 e diz que **1** deles e *"teste de regra de negocio
 * (UT-013-8)"*; sobram 7, e US-11 tem exatamente **7** critérios de aceite, na
 * ordem. A correspondencia adotada:
 *
 * | caso | o que afirma | fonte |
 * |---|---|---|
 * | `UT-013-1` | CA-11.1 — a permissao e verificada para a acao e, em seguida, novamente para cada conta alvo, uma a uma | `spec.md`, US-11; UC-24 passos 3 e 4 |
 * | `UT-013-2` | CA-11.2 — numa acao em lote, uma conta sem permissao e saltada e as demais prosseguem | `spec.md`, US-11; `wp-admin/users.php:509`-`:512` |
 * | `UT-013-3` | CA-11.3 — apagar conta com conteudo exige escolher entre reatribuir e apagar | `spec.md`, US-11; `wp-admin/users.php:192`-`:230` |
 * | `UT-013-4` | CA-11.4 — rebaixar-se e recusado se o papel novo nao puder promover outras contas | `spec.md`, US-11; `wp-admin/users.php:146`-`:157` |
 * | `UT-013-5` | CA-11.5 — remover o proprio papel e recusado com mensagem explicita | `spec.md`, US-11; `wp-admin/users.php:148`-`:150` |
 * | `UT-013-6` | CA-11.6 — ao fim de qualquer operacao continua havendo ao menos uma conta capaz de promover outras | `spec.md`, US-11; pos-condicao de UC-24 |
 * | `UT-013-7` | CA-11.7 — quem foi criado, promovido ou alterado e notificado por e-mail | `spec.md`, US-11; UC-24 passo 6 |
 * | `UT-013-8` | a regra `N6` (BR-MIGRAR-066): criar usuario na rede e permissao de rede, salvo opcao explicita | `spec.md`, US-11, 2ª regra; `wp-includes/capabilities.php:682`-`:690` |
 *
 * **Uma diferenca de contagem, declarada:** `spec.md` lista para US-11 **duas**
 * regras de negocio — *"Pegadinha 3"* (`PERM-13`, a definicao de papel e um
 * retrato da instalacao) e *"N6"* —, e `tasks.md` reserva **um** caso de regra.
 * A tabela de rastreabilidade de `spec.md` liga US-11 a `domain.md §2.8` (N6) e
 * nao a `permissions.md §10`, e `PERM-13` ja tem caso proprio em
 * `ut-014-autorizacao-por-capacidade.test.ts` (UT-013-4 aqui volta a exercita-la
 * de lado). Dai `UT-013-8` ser `N6`. Se o catalogo aparecer e disser outra coisa,
 * o caso de la vale e este arquivo muda.
 *
 * ---
 *
 * # 🔴 T023 NAO ESTA NESTA ARVORE, e isto mudou o nivel desta suite
 *
 * `tasks.md` declara *"depende de: T023"*, e a implementacao de US-11 **nao foi
 * integrada**: nao existe `../administracao-de-contas/`, nem
 * `plataforma/autorizacao/traducao-de-conta.ts`, nem os `case` de conta de
 * `map_meta_cap()`. A tarefa foi aberta em paralelo com T023, que e o que o `[P]`
 * dela permite *"uma vez satisfeita a dependencia"* — e a dependencia nao esta
 * satisfeita.
 *
 * Escrever os oito casos contra um nome de operacao **imaginado** e exatamente o
 * que custou a T010, a T012 e a T014 uma rodada inteira: as tres voltaram com
 * `REFAZER` no proprio `tasks.md` porque *"a suite monta o contexto numa forma
 * que a implementacao nao usa"*. Esta suite nao repete isso. Em vez de inventar o
 * contrato de T023, ela faz o que `ut-014-autorizacao-por-capacidade.test.ts` fez
 * para US-7: desce ao **nivel do cenario** sobre o que esta integrado — a
 * instalacao com banco, a matriz **gravada** na opcao `{site}user_roles`, a
 * autorizacao **gravada** na chave `{site}capabilities`, o codec do formato
 * serializado, o adaptador de `fonte-de-papeis.ts`, a decisao de
 * `perguntarPermissao` e a porta de e-mail — e afirma, caso por caso, o
 * comportamento de US-11 **lido do legado**, com `arquivo:linha` em cada
 * assercao.
 *
 * **Os cinco `case` de conta de `map_meta_cap()` entram como tabela de
 * referencia desta suite** ({@link casoDeContaDoLegado}), transcritos de
 * `wp-includes/capabilities.php:49`-`:80` e `:673`-`:690`. Isso e legitimo e nao
 * e duplicar producao: `plataforma/autorizacao/traducao-de-capacidade.ts` declara
 * `casosDeTraducao` um contrato **aberto** — *"os demais chegam com a feature do
 * objeto de cada um"* —, e a Decisao 2 de `parity_specs.md` poe a suite como
 * portadora do comportamento de referencia. Quem esta sob teste e a **decisao
 * integrada**: a ordem dos sete passos, a exigencia de **todas** as capacidades
 * devolvidas, a lista vazia que significa permitido, o `do_not_allow` que nao se
 * concede e o atalho de super administrador.
 *
 * E a ponte esta armada: {@link PONTE_COM_T023}, subteste de `UT-013-1`, carrega
 * `plataforma/autorizacao/traducao-de-conta.js` **por importacao dinamica** e
 * afirma, linha por linha da tabela, que o `casoDeConta` de T023 devolve a mesma
 * lista que a referencia. Numa arvore sem T023 o subteste **salta com motivo
 * declarado**; na arvore com T023 ele passa a ser a conferencia de paridade dos
 * cinco `case`. Nenhum outro arquivo e tocado, como o `[P]` de T024 exige.
 *
 * **O que esta suite NAO cobre, nomeado para nao ser descoberto depois.** Os
 * pedacos de CA-11.2, CA-11.3, CA-11.5 e CA-11.7 que sao **fluxo de tela** e nao
 * decisao — o salto no lote contra a interrupcao do lote, a escolha entre
 * reatribuir e apagar o conteudo, o texto literal da recusa e o disparo da
 * notificacao dentro da criacao por administrador — vivem nas cinco operacoes de
 * T023. Cada caso abaixo diz, no proprio comentario, o que dele fica para quando
 * T023 chegar. UC-24 avisa por que a divisao e assim: *"a regra esta na tela, nao
 * no modelo de autorizacao"*.
 *
 * ---
 *
 * # 🔴 Tres divergencias entre `spec.md` e o legado, registradas e NAO resolvidas
 *
 * O **P1** da constituicao e categorico — *"o comportamento observavel do legado
 * e a especificacao, inclusive quando ele parecer defeito"* —, logo cada assercao
 * aqui segue o legado. O que divergiu do texto do critério fica escrito:
 *
 * 1. **CA-11.2 vale para UMA das acoes em lote, nao para as tres.** So
 *    `case 'doremove'` salta a conta sem permissao e segue
 *    (`wp-admin/users.php:509`-`:512`: `$update = 'err_admin_remove'; continue;`).
 *    `case 'promote'` (`:142`-`:144`), `case 'dodelete'` (`:207`-`:209`) e
 *    `case 'resetpassword'` (`:260`-`:262`) fazem `wp_die( ..., 403 )` e
 *    **interrompem o lote inteiro**. O critério descreve o comportamento de uma
 *    acao e o generaliza para "uma acao em lote".
 * 2. **CA-11.7 notifica quem foi CRIADO, e nao quem foi promovido.** O envio esta
 *    no ramo de insercao de `edit_user()`
 *    (`wp-admin/includes/user.php:241`-`:242`: `$notify = isset(
 *    $_POST['send_user_notification'] ) ? 'both' : 'admin'`), e o `case 'promote'`
 *    de `users.php` chama `set_role()` e **nada mais** — nenhuma linha de e-mail.
 *    Sem a caixa marcada, quem recebe aviso e o administrador, nao o titular.
 * 3. **CA-11.6 nao e verificacao, e consequencia.** Nenhum ponto do legado conta
 *    quantas contas restam com `promote_users`: a pos-condicao se sustenta
 *    sozinha porque a unica forma de perder o ultimo promotor seria rebaixar-se, e
 *    e isso que a trava de `users.php:146` impede. UC-24 diz a consequencia em uma
 *    linha — *"a regra esta na tela, nao no modelo de autorizacao: outra entrada
 *    que chame a troca de papel direto nao a aplica"*.
 *
 * Nenhuma das tres e decidida aqui. A reconciliacao entre o texto do critério e o
 * legado e decisao humana pela tabela *Nao negociavel* da constituicao (*"mudar
 * regra de negocio documentada em `domain.md`"*), e a conferencia final e contra o
 * oraculo executavel (`ESC-ORACULO`, BR-MIGRAR-116), que nesta arvore nao existe.
 *
 * ---
 *
 * # 🔴 O conflito REQ-017 e exercitado nos dois lados, e nenhum e escolhido
 *
 * Mesma razao e mesma forma de T002, T015 e T016: a reconciliacao entre o card
 * `wont` REQ-017 e a resposta 5 de `questions.md` esta fora do alcance de quem
 * codifica. Todo caso que semeia a matriz de fabrica roda nos **dois** lados,
 * dentro de um unico `test()`, para que a contagem de oito continue sendo oito e
 * nenhum lado seja escolhido por omissao.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAPACIDADE_CONCEDIDA_A_TODOS,
  CAPACIDADE_NEGADA,
  REDE_INATIVA_NA_AUTORIZACAO,
  capacidadesDoPapel,
  capacidadesExigidas,
  comAtor,
  papeisQueConcedem,
  perguntarPermissao,
  quemTemCapacidade,
  type BaseDeAutorizacao,
  type Capacidade,
  type CasoDeTraducao,
  type EstadoDaRedeNaAutorizacao,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';
import { serializarComoTexto } from '../../../plataforma/serializacao/index.js';

import {
  concessoesParaValor,
  criarArmazenamento,
  criarConstrutorDeDefinicao,
  definicaoParaValor,
  povoarPapeis,
  type ConcessaoDeCapacidade,
  type DefinicaoDePapeis,
  type LadoDoConflitoDeNivelNumerico,
} from '../armazenamento/index.js';
import {
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import { criarNotificacaoDeContaNovaDoNucleo } from '../cadastro/notificacao-de-conta-nova.js';
import type { MensagemDeEmail, PortaDeEmail } from '../portas/index.js';

import { criarFonteDeAutorizacao, matrizGravada } from './fonte-de-papeis.js';

const LADOS: readonly LadoDoConflitoDeNivelNumerico[] = [
  'legado-integral',
  'req-017-sem-niveis',
];

/* ────────────────────────────────────────────────────────────────────────────
   A TABELA DE REFERENCIA: os cinco `case` de conta de `map_meta_cap()`

   Transcricao de `wp-includes/capabilities.php`, nao reimplementacao: cada ramo
   abaixo cita a linha de onde saiu, na ordem em que o `switch` os declara. Os
   cinco sao de US-11 / T023 e chegam, na arvore integrada, por
   `plataforma/autorizacao/traducao-de-conta.ts` — ver PONTE_COM_T023.
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * O que os `case` de conta consultam fora do pedido.
 *
 * Os tres sao as tres chamadas do legado dentro desses ramos:
 * `is_super_admin( $id )`, `user_can( $id, $cap )` e
 * `get_site_option( 'add_new_users' )`.
 */
interface FonteDeContaDaReferencia {
  /**
   * `is_super_admin( $user_id )`.
   *
   * 🔴 **`0` nao e "conta inexistente", e isso e quirk do legado.** A assinatura e
   * `is_super_admin( $user_id = false )` e o primeiro ramo e `if ( ! $user_id )`,
   * falsidade de PHP — logo `is_super_admin( 0 )` responde **pelo usuario
   * corrente**. O ramo e alcancavel: o `case` de `edit_user` avalia
   * `is_super_admin( $args[0] )` com o argumento ausente. Quem monta a fonte
   * decide o que `0` significa; esta suite o entrega como "o ator da pergunta", e
   * a conferencia e do oraculo.
   */
  ehSuperAdmin(contaId: number): boolean;
  /** `user_can( $user_id, $capacidade )` — a decisao rodando com outro ator. */
  temCapacidade(contaId: number, capacidade: Capacidade): boolean;
  /** `get_site_option( 'add_new_users' )`, por verdade e nao pelo valor gravado. */
  criacaoDeContaLiberadaNaRede(): boolean;
}

function casoDeContaDoLegado(fonte: FonteDeContaDaReferencia): CasoDeTraducao {
  return (pedido) => {
    const primeiro = pedido.argumentos[0];
    const alvoId = typeof primeiro === 'number' ? primeiro : null;

    switch (pedido.capacidade) {
      // `capabilities.php:49`-`:56`. "In multisite the user must be a super admin
      // to remove themselves."
      case 'remove_user':
        if (
          alvoId !== null &&
          pedido.contaId === alvoId &&
          !fonte.ehSuperAdmin(pedido.contaId)
        ) {
          return [CAPACIDADE_NEGADA];
        }
        return ['remove_users'];

      // `capabilities.php:57`-`:60`.
      case 'promote_user':
      case 'add_users':
        return ['promote_users'];

      // `capabilities.php:61`-`:79`.
      case 'edit_user':
      case 'edit_users': {
        // ":63"-":67" — "Non-existent users can't edit users, not even themselves."
        //
        // ⚠️ **A ORDEM deste ramo e regra, e omiti-lo abre a porta.** Ele vem
        // ANTES do ramo do proprio perfil, logo o ator anonimo (`contaId` 0)
        // pedindo `edit_user` sobre a conta 0 e NEGADO. Uma traducao que comece
        // pelo proprio perfil devolve `[]` para esse mesmo pedido — e `[]`
        // significa PERMITIDO (`decisao-de-capacidade.ts`, passo 7: `exigidas`
        // vazia passa). A linha da tabela com `contaId: 0` existe por isso, e e
        // ela que a ponte com T023 confere.
        if (pedido.contaId < 1) {
          return [CAPACIDADE_NEGADA];
        }
        // ":69"-":72" — "Allow user to edit themselves." Sai do `switch` sem
        // acrescentar nada, e lista vazia significa PERMITIDO (pegadinha 2 de
        // `permissions.md`, BR-MIGRAR-092). E o fluxo alternativo "editar o
        // proprio perfil" de UC-24: *"qualquer conta edita o proprio perfil,
        // inclusive um assinante"*.
        if (
          pedido.capacidade === 'edit_user' &&
          alvoId !== null &&
          pedido.contaId === alvoId
        ) {
          return [];
        }
        // ":74"-":78" — os dois ramos de rede, na ordem do legado.
        if (
          pedido.emRede &&
          ((!fonte.ehSuperAdmin(pedido.contaId) &&
            pedido.capacidade === 'edit_user' &&
            fonte.ehSuperAdmin(alvoId ?? 0)) ||
            !fonte.temCapacidade(pedido.contaId, 'manage_network_users'))
        ) {
          return [CAPACIDADE_NEGADA];
        }
        return ['edit_users'];
      }

      // `capabilities.php:673`-`:680`. "If multisite only super admins can delete
      // users." A pre-condicao de UC-24 diz o outro lado: *"fora de multisite,
      // `delete_users` e tambem o que define super admin"*.
      case 'delete_user':
      case 'delete_users':
        if (pedido.emRede && !fonte.ehSuperAdmin(pedido.contaId)) {
          return [CAPACIDADE_NEGADA];
        }
        return ['delete_users'];

      // `capabilities.php:682`-`:690` — `N6` (BR-MIGRAR-066).
      case 'create_users':
        if (!pedido.emRede) {
          return ['create_users'];
        }
        if (
          fonte.ehSuperAdmin(pedido.contaId) ||
          fonte.criacaoDeContaLiberadaNaRede()
        ) {
          return ['create_users'];
        }
        return [CAPACIDADE_NEGADA];

      default:
        return null;
    }
  };
}

/**
 * As linhas que a ponte com T023 confere, e que os casos abaixo exercitam.
 *
 * Cada linha e um pedido de traducao com o desfecho do legado. A tabela esta aqui,
 * e nao dentro de um caso, porque ela e o contrato dos cinco `case`: e o que
 * `casoDeConta` de T023 tem de devolver, nome por nome.
 */
const TABELA_DOS_CASOS_DE_CONTA: readonly {
  readonly capacidade: Capacidade;
  readonly contaId: number;
  readonly alvo: readonly unknown[];
  readonly emRede: boolean;
  readonly exigidas: readonly Capacidade[];
  readonly ancora: string;
}[] = [
  {
    capacidade: 'promote_user',
    contaId: 1,
    alvo: [2],
    emRede: false,
    exigidas: ['promote_users'],
    ancora: 'capabilities.php:57',
  },
  {
    capacidade: 'add_users',
    contaId: 1,
    alvo: [],
    emRede: false,
    exigidas: ['promote_users'],
    ancora: 'capabilities.php:58',
  },
  {
    capacidade: 'remove_user',
    contaId: 1,
    alvo: [2],
    emRede: true,
    exigidas: ['remove_users'],
    ancora: 'capabilities.php:54',
  },
  {
    capacidade: 'remove_user',
    contaId: 1,
    alvo: [1],
    emRede: true,
    exigidas: [CAPACIDADE_NEGADA],
    ancora: 'capabilities.php:51',
  },
  {
    capacidade: 'edit_user',
    contaId: 1,
    alvo: [1],
    emRede: false,
    exigidas: [],
    ancora: 'capabilities.php:70',
  },
  {
    capacidade: 'edit_user',
    contaId: 0,
    alvo: [0],
    emRede: false,
    exigidas: [CAPACIDADE_NEGADA],
    ancora: 'capabilities.php:64',
  },
  {
    capacidade: 'edit_user',
    contaId: 1,
    alvo: [2],
    emRede: false,
    exigidas: ['edit_users'],
    ancora: 'capabilities.php:78',
  },
  {
    capacidade: 'delete_user',
    contaId: 1,
    alvo: [2],
    emRede: false,
    exigidas: ['delete_users'],
    ancora: 'capabilities.php:679',
  },
  {
    capacidade: 'delete_user',
    contaId: 1,
    alvo: [2],
    emRede: true,
    exigidas: [CAPACIDADE_NEGADA],
    ancora: 'capabilities.php:677',
  },
  {
    capacidade: 'create_users',
    contaId: 1,
    alvo: [],
    emRede: false,
    exigidas: ['create_users'],
    ancora: 'capabilities.php:683',
  },
  {
    capacidade: 'create_users',
    contaId: 1,
    alvo: [],
    emRede: true,
    exigidas: [CAPACIDADE_NEGADA],
    ancora: 'capabilities.php:688',
  },
];

/**
 * O caminho do modulo de T023 que esta suite confere quando ele existir.
 *
 * Montado como variavel de proposito: um especificador literal faria o compilador
 * exigir o arquivo numa arvore em que T023 ainda nao entrou, e o que se quer e o
 * subteste **saltar com motivo**, nao a suite deixar de compilar.
 */
const PONTE_COM_T023 = '../../../plataforma/autorizacao/traducao-de-conta.js';

/* ────────────────────────────────────────────────────────────────────────────
   A INSTALACAO: banco, opcao gravada, codec, adaptador
   ──────────────────────────────────────────────────────────────────────────── */

interface Instalacao {
  readonly falsa: PortaDeDadosFalsa;
  readonly armazenamento: ReturnType<typeof criarArmazenamento>;
  /** A matriz como a opcao `{site}user_roles` a devolveu, nao como o codigo a monta. */
  readonly matriz: MatrizDePapeis;
}

/** O valor da opcao `{site}user_roles`, como a coluna o guarda. */
function opcaoGravada(definicao: DefinicaoDePapeis): string {
  return serializarComoTexto(definicaoParaValor(definicao));
}

/** O valor da chave `{site}capabilities`, como a coluna o guarda. */
function capacidadesGravadas(
  concessoes: readonly ConcessaoDeCapacidade[],
): string {
  return serializarComoTexto(concessoesParaValor(concessoes));
}

function papel(identificador: string): ConcessaoDeCapacidade[] {
  return [{ capacidade: identificador, concedida: true }];
}

/**
 * Semeia a matriz de fabrica, grava-a na opcao e le de volta pela porta.
 *
 * O caminho inteiro de propósito: e o que distingue esta suite dos testes de
 * unidade de `plataforma/autorizacao/`. Se a politica estiver certa e a costura
 * com o dado estiver errada, e aqui que abre.
 */
function instalacaoDeFabrica(
  lado: LadoDoConflitoDeNivelNumerico,
  definicao: DefinicaoDePapeis = povoarPapeis(lado),
): Instalacao {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  falsa.responder([{ option_value: opcaoGravada(definicao) }]);
  return { falsa, armazenamento, matriz: matrizGravada(armazenamento) };
}

/** Site unico: a instalacao de fabrica, sem rede e sem lista de super admin. */
function base(
  instalacao: Instalacao,
  fonte: FonteDeContaDaReferencia,
  rede: EstadoDaRedeNaAutorizacao = REDE_INATIVA_NA_AUTORIZACAO,
): BaseDeAutorizacao {
  return {
    matriz: instalacao.matriz,
    rede,
    casosDeTraducao: [casoDeContaDoLegado(fonte)],
  };
}

/**
 * A fonte dos `case` de conta montada sobre a propria decisao.
 *
 * `ehSuperAdmin` fora da rede e *"quem tem `delete_users`"* e em rede e *"login na
 * lista"* — as duas definicoes de `PERM-9`, que `decisao-de-capacidade.ts` ja
 * resolve. `temCapacidade` e a decisao rodando com **outro** ator, que e o que o
 * `case` de `edit_user` faz com `manage_network_users`.
 */
function fonteSobreContas(
  obterBase: () => BaseDeAutorizacao,
  contas: ReadonlyMap<number, { login: string; concessoes: readonly ConcessaoDeCapacidade[] }>,
  criacaoLiberada = false,
  atorCorrente = 0,
): FonteDeContaDaReferencia {
  function ator(contaId: number) {
    const conta = contas.get(contaId);
    if (conta === undefined) {
      return { contaId, login: '', existe: false, concessoes: [] };
    }
    return {
      contaId,
      login: conta.login,
      existe: true,
      concessoes: conta.concessoes,
    };
  }

  return {
    ehSuperAdmin(contaId) {
      // O quirk de `is_super_admin( false )`: `0` responde pelo ator corrente.
      const id = contaId === 0 ? atorCorrente : contaId;
      const contexto = comAtor(obterBase(), ator(id));
      if (!contexto.ator.existe) {
        return false;
      }
      return contexto.rede.ativa
        ? contexto.rede.loginsDeSuperAdmin.includes(contexto.ator.login)
        : perguntarPermissao(contexto, 'delete_users');
    },
    temCapacidade(contaId, capacidade) {
      return perguntarPermissao(comAtor(obterBase(), ator(contaId)), capacidade);
    },
    criacaoDeContaLiberadaNaRede() {
      return criacaoLiberada;
    },
  };
}

/** Uma porta de e-mail que guarda o que saiu, na ordem. */
function criarPortaDeEmailFalsa(): {
  readonly porta: PortaDeEmail;
  readonly enviadas: MensagemDeEmail[];
} {
  const enviadas: MensagemDeEmail[] = [];
  return {
    porta: {
      enviar(mensagem) {
        enviadas.push(mensagem);
        return { enviado: true };
      },
    },
    enviadas,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   UT-013-1 — CA-11.1
   ══════════════════════════════════════════════════════════════════════════ */

for (const lado of LADOS) {
  test(`${lado}: UT-013-1 (CA-11.1) a permissao e verificada para a acao e, de novo, para cada conta alvo`, async (t) => {
    const instalacao = instalacaoDeFabrica(lado);

    const contas = new Map([
      [1, { login: 'quem-administra', concessoes: papel('administrator') }],
      [2, { login: 'quem-assina', concessoes: papel('subscriber') }],
      [3, { login: 'outra-que-administra', concessoes: papel('administrator') }],
      [4, { login: 'quem-edita', concessoes: papel('editor') }],
    ]);

    let atual: BaseDeAutorizacao;
    const fonte = fonteSobreContas(() => atual, contas, false, 1);
    atual = base(instalacao, fonte);

    const administracao = comAtor(atual, {
      contaId: 1,
      login: 'quem-administra',
      existe: true,
      concessoes: papel('administrator'),
    });

    // Passo 3 de UC-24, a capacidade DA ACAO: `promote_users`
    // (`wp-admin/users.php:113`-`:115`).
    assert.equal(perguntarPermissao(administracao, 'promote_users'), true);

    // Passo 4 de UC-24, a capacidade SOBRE AQUELA CONTA, uma a uma
    // (`wp-admin/users.php:141`-`:144`, dentro do `foreach`).
    for (const alvo of [2, 3, 4]) {
      assert.equal(perguntarPermissao(administracao, 'promote_user', alvo), true);
    }

    // E a pergunta por alvo e OUTRA pergunta: `promote_user` nunca e comparada
    // direto — a traducao a resolve em `promote_users` (`PERM-3`,
    // `capabilities.php:57`-`:60`). Um porte que verificasse `promote_user` na
    // matriz negaria tudo, porque `promote_user` nao esta em papel algum.
    assert.deepEqual(capacidadesExigidas(administracao, 'promote_user', 2), [
      'promote_users',
    ]);
    assert.deepEqual(
      capacidadesDoPapel(instalacao.matriz, 'administrator').filter(
        (concessao) => concessao.capacidade === 'promote_user',
      ),
      [],
    );

    // Quem nao tem a capacidade da acao tambem nao passa por conta alguma: as
    // duas perguntas caem na mesma primitiva.
    const edicao = comAtor(atual, {
      contaId: 4,
      login: 'quem-edita',
      existe: true,
      concessoes: papel('editor'),
    });
    assert.equal(perguntarPermissao(edicao, 'promote_users'), false);
    assert.equal(perguntarPermissao(edicao, 'promote_user', 2), false);

    // ── O caso que prova POR QUE a segunda pergunta existe ─────────────────
    // Em rede, com `manage_network_users` concedida individualmente (`PERM-1`:
    // capacidade sem papel), a acao `edit_users` PASSA e o alvo que e super
    // administrador e NEGADO — `capabilities.php:74`-`:78`. Sao duas respostas
    // diferentes para a mesma conta que pergunta, e e isso que CA-11.1 cobra.
    const emRede: EstadoDaRedeNaAutorizacao = {
      ativa: true,
      loginsDeSuperAdmin: ['outra-que-administra'],
    };
    const contasEmRede = new Map([
      [
        1,
        {
          login: 'quem-administra',
          concessoes: [
            ...papel('administrator'),
            { capacidade: 'manage_network_users', concedida: true },
          ],
        },
      ],
      [3, { login: 'outra-que-administra', concessoes: papel('administrator') }],
    ]);
    const fonteEmRede = fonteSobreContas(() => atual, contasEmRede, false, 1);
    atual = base(instalacao, fonteEmRede, emRede);

    const administracaoEmRede = comAtor(atual, {
      contaId: 1,
      login: 'quem-administra',
      existe: true,
      concessoes: [
        ...papel('administrator'),
        { capacidade: 'manage_network_users', concedida: true },
      ],
    });

    assert.deepEqual(capacidadesExigidas(administracaoEmRede, 'edit_users'), [
      'edit_users',
    ]);
    assert.equal(perguntarPermissao(administracaoEmRede, 'edit_users'), true);

    assert.deepEqual(
      capacidadesExigidas(administracaoEmRede, 'edit_user', 3),
      [CAPACIDADE_NEGADA],
    );
    assert.equal(perguntarPermissao(administracaoEmRede, 'edit_user', 3), false);

    // ── A ponte com T023 ──────────────────────────────────────────────────
    // Quando `traducao-de-conta.ts` existir, os cinco `case` dele respondem o
    // mesmo que a tabela de referencia, linha por linha. Sem ele, o subteste
    // salta DIZENDO que saltou: nao e verde emprestado.
    let modulo: { casoDeConta?: unknown } | null = null;
    let motivo = '';
    try {
      modulo = (await import(PONTE_COM_T023)) as { casoDeConta?: unknown };
    } catch (erro) {
      motivo = `T023 nao esta nesta arvore (${PONTE_COM_T023}): ${
        erro instanceof Error ? erro.message : String(erro)
      }`;
    }

    const casoDeConta = modulo?.casoDeConta;
    await t.test(
      'os cinco `case` de conta de T023 respondem o mesmo que a referencia do legado',
      {
        skip:
          typeof casoDeConta === 'function'
            ? false
            : motivo ||
              '`casoDeConta` nao foi exportado por `plataforma/autorizacao/traducao-de-conta.js`',
      },
      () => {
        assert.equal(typeof casoDeConta, 'function');
        const fonteDaPonte = {
          ehSuperAdmin: (contaId: number) => fonte.ehSuperAdmin(contaId),
          temCapacidade: (contaId: number, capacidade: Capacidade) =>
            fonte.temCapacidade(contaId, capacidade),
          // O mesmo valor sob os dois nomes de `N6` que o pacote admite: a
          // interface e estrutural, e um nome a mais nao muda o que o `case` le.
          criacaoDeContaLiberadaNaRede: () => false,
          adicaoDeContaLiberadaNaRede: () => false,
        };
        const deT023 = (casoDeConta as (f: unknown) => CasoDeTraducao)(
          fonteDaPonte,
        );
        const referencia = casoDeContaDoLegado(fonte);

        for (const linha of TABELA_DOS_CASOS_DE_CONTA) {
          const pedido = {
            capacidade: linha.capacidade,
            contaId: linha.contaId,
            argumentos: linha.alvo,
            constantes: {
              desabilitarHtmlSemFiltro: false,
              desabilitarEdicaoDeArquivo: false,
              desabilitarAlteracaoDeArquivo: false,
              permitirEnvioSemFiltro: false,
            },
            emRede: linha.emRede,
          };
          assert.deepEqual(
            deT023(pedido as Parameters<CasoDeTraducao>[0]),
            linha.exigidas,
            `${linha.capacidade} (${linha.ancora})`,
          );
          assert.deepEqual(
            referencia(pedido as Parameters<CasoDeTraducao>[0]),
            linha.exigidas,
            `referencia: ${linha.capacidade} (${linha.ancora})`,
          );
        }
      },
    );
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   UT-013-2 — CA-11.2
   ══════════════════════════════════════════════════════════════════════════ */

for (const lado of LADOS) {
  test(`${lado}: UT-013-2 (CA-11.2) no lote, a conta sem permissao e saltada e as demais prosseguem`, () => {
    const instalacao = instalacaoDeFabrica(lado);

    // `case 'doremove'` e o UNICO lote que salta e segue
    // (`wp-admin/users.php:509`-`:512`). O cenario dele: rede ativa, ator com
    // `remove_users` e **sem** ser super administrador, e o proprio ator no lote.
    const emRede: EstadoDaRedeNaAutorizacao = {
      ativa: true,
      loginsDeSuperAdmin: ['quem-supervisiona-a-rede'],
    };
    const contas = new Map([
      [1, { login: 'quem-administra', concessoes: papel('administrator') }],
      [2, { login: 'quem-assina', concessoes: papel('subscriber') }],
      [5, { login: 'quem-colabora', concessoes: papel('contributor') }],
    ]);

    let atual: BaseDeAutorizacao;
    const fonte = fonteSobreContas(() => atual, contas, false, 1);
    atual = base(instalacao, fonte, emRede);

    const administracao = comAtor(atual, {
      contaId: 1,
      login: 'quem-administra',
      existe: true,
      concessoes: papel('administrator'),
    });

    // O lote tal como a tela o monta, com o proprio ator no meio.
    const lote = [2, 1, 5];
    const desfecho = lote.map((alvo) => ({
      alvo,
      permitido: perguntarPermissao(administracao, 'remove_user', alvo),
    }));

    // A conta 1 e o ator: `capabilities.php:51` lhe devolve `do_not_allow`
    // porque ele nao e super administrador. As outras duas seguem.
    assert.deepEqual(desfecho, [
      { alvo: 2, permitido: true },
      { alvo: 1, permitido: false },
      { alvo: 5, permitido: true },
    ]);

    // A negacao de um alvo nao contamina os outros: a ordem das perguntas nao
    // muda nenhuma resposta, e repetir a pergunta na mesma requisicao tambem nao
    // (o cenario `@concorrencia` de `07-autorizacao-por-capacidade.feature`).
    for (const alvo of [...lote].reverse()) {
      assert.equal(
        perguntarPermissao(administracao, 'remove_user', alvo),
        alvo !== 1,
      );
      assert.equal(
        perguntarPermissao(administracao, 'remove_user', alvo),
        alvo !== 1,
      );
    }

    // E a mesma conta 1, quando ESTA na lista de super administradores, deixa de
    // ser saltada — `capabilities.php:51`, a excecao do proprio ramo.
    const comoSuperAdmin: EstadoDaRedeNaAutorizacao = {
      ativa: true,
      loginsDeSuperAdmin: ['quem-administra'],
    };
    atual = base(instalacao, fonte, comoSuperAdmin);
    assert.equal(
      perguntarPermissao(
        comAtor(atual, {
          contaId: 1,
          login: 'quem-administra',
          existe: true,
          concessoes: papel('administrator'),
        }),
        'remove_user',
        1,
      ),
      true,
    );

    // 🔴 O que fica para T023, e e a divergencia 1 do cabecalho: **saltar** e
    // comportamento de `doremove` so. `promote` (`users.php:142`-`:144`),
    // `dodelete` (`:207`-`:209`) e `resetpassword` (`:260`-`:262`) fazem
    // `wp_die( ..., 403 )` e interrompem o lote. A decisao de capacidade nao tem
    // como expressar isso — ela devolve booleano por alvo, e e a tela que escolhe
    // entre `continue` e `wp_die`. UC-24: *"a regra esta na tela, nao no modelo de
    // autorizacao"*.
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   UT-013-3 — CA-11.3
   ══════════════════════════════════════════════════════════════════════════ */

for (const lado of LADOS) {
  test(`${lado}: UT-013-3 (CA-11.3) a escolha entre reatribuir e apagar o conteudo nao e autorizacao`, () => {
    const instalacao = instalacaoDeFabrica(lado);

    const contas = new Map([
      [1, { login: 'quem-administra', concessoes: papel('administrator') }],
      [2, { login: 'quem-escreve', concessoes: papel('author') }],
    ]);

    let atual: BaseDeAutorizacao;
    const fonte = fonteSobreContas(() => atual, contas, false, 1);
    atual = base(instalacao, fonte);

    const administracao = comAtor(atual, {
      contaId: 1,
      login: 'quem-administra',
      existe: true,
      concessoes: papel('administrator'),
    });

    // A traducao de `delete_user` NAO olha conteudo: `capabilities.php:673`-`:680`
    // tem um ramo so, e ele e sobre rede. Com ou sem argumento extra descrevendo o
    // destino do conteudo, a lista exigida e a mesma.
    const semDestino = capacidadesExigidas(administracao, 'delete_user', 2);
    const comDestino = capacidadesExigidas(
      administracao,
      'delete_user',
      2,
      'reassign',
      1,
    );
    assert.deepEqual(semDestino, ['delete_users']);
    assert.deepEqual(comDestino, semDestino);
    assert.equal(perguntarPermissao(administracao, 'delete_user', 2), true);

    // E a acao e o alvo caem na MESMA primitiva fora da rede
    // (`:679`: "delete_user maps to delete_users"), logo em site unico a segunda
    // pergunta de `dodelete` nunca pode negar o que a primeira concedeu. A unica
    // instalacao em que elas divergem e a de rede — e ali as duas negam, porque
    // *"apagar identidade e poder de rede"* (UC-24, excecoes).
    assert.deepEqual(capacidadesExigidas(administracao, 'delete_users'), [
      'delete_users',
    ]);

    const emRede: EstadoDaRedeNaAutorizacao = {
      ativa: true,
      loginsDeSuperAdmin: ['quem-supervisiona-a-rede'],
    };
    atual = base(instalacao, fonte, emRede);
    const emRedeComoAdmin = comAtor(atual, {
      contaId: 1,
      login: 'quem-administra',
      existe: true,
      concessoes: papel('administrator'),
    });
    assert.deepEqual(capacidadesExigidas(emRedeComoAdmin, 'delete_user', 2), [
      CAPACIDADE_NEGADA,
    ]);
    assert.equal(perguntarPermissao(emRedeComoAdmin, 'delete_user', 2), false);

    // 🔴 O que fica para T023: a escolha em si. No legado ela e um portao de tela
    // que roda **antes** da capacidade — `users.php:192`-`:197` devolve a tela com
    // `error=true` ("Please select an option.") quando `delete_option` esta vazia,
    // e so em `:199` e que `current_user_can( 'delete_users' )` e consultada; por
    // conta, `:216`-`:218` marca `err_missing_reassign` e **salta** quando a opcao
    // e `reassign` sem destino. A inversao de ordem e observavel e e de T023; o que
    // esta suite fixa e que a autorizacao nao participa dela.
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   UT-013-4 — CA-11.4
   ══════════════════════════════════════════════════════════════════════════ */

for (const lado of LADOS) {
  test(`${lado}: UT-013-4 (CA-11.4) rebaixar-se depende de o papel novo conservar promote_users, lido do dado gravado`, () => {
    const deFabrica = instalacaoDeFabrica(lado);

    // A trava de `wp-admin/users.php:146`-`:157`, em uma linha de comentario do
    // legado: *"The new role of the current user must also have the promote_users
    // cap"*. O predicado e `$wp_roles->role_objects[ $role ]->has_cap(
    // 'promote_users' )`, e `$wp_roles` foi carregado da OPCAO — nao do codigo.
    function papelConservaPromocao(
      matriz: MatrizDePapeis,
      identificador: string,
    ): boolean {
      return capacidadesDoPapel(matriz, identificador).some(
        (concessao) =>
          concessao.capacidade === 'promote_users' && concessao.concedida,
      );
    }

    assert.equal(papelConservaPromocao(deFabrica.matriz, 'administrator'), true);
    assert.equal(papelConservaPromocao(deFabrica.matriz, 'editor'), false);
    assert.equal(papelConservaPromocao(deFabrica.matriz, 'author'), false);
    assert.equal(papelConservaPromocao(deFabrica.matriz, 'contributor'), false);
    assert.equal(papelConservaPromocao(deFabrica.matriz, 'subscriber'), false);

    // O papel inexistente nao conserva nada, e e por isso que `'none'` precisa do
    // ramo proprio de `users.php:148`-`:150` em vez de cair aqui: a tela o injeta
    // como papel editavel de mentira (`:126`-`:129`) e depois o converte em cadeia
    // vazia (`:134`-`:136`).
    assert.equal(papelConservaPromocao(deFabrica.matriz, 'none'), false);
    assert.equal(papelConservaPromocao(deFabrica.matriz, ''), false);

    // ── E o predicado segue o DADO, nao o codigo ──────────────────────────
    // `PERM-13` e ADR-0001: depois da instalacao a opcao `{site}user_roles` e a
    // verdade. Uma instalacao que concedeu `promote_users` ao editor passa a
    // permitir o rebaixamento a editor, sem que uma linha de codigo mude.
    const construtor = criarConstrutorDeDefinicao(povoarPapeis(lado));
    construtor.adicionarCapacidade('editor', 'promote_users');
    const customizada = instalacaoDeFabrica(lado, construtor.resultado());

    assert.equal(papelConservaPromocao(customizada.matriz, 'editor'), true);
    assert.equal(
      papelConservaPromocao(customizada.matriz, 'administrator'),
      true,
    );

    // A leitura foi a da opcao por site, e nenhuma outra consulta saiu.
    for (const instalacao of [deFabrica, customizada]) {
      assert.equal(instalacao.falsa.selecoes.length, 1);
      const selecao = instalacao.falsa.selecoes[0];
      assert.ok(selecao !== undefined);
      assert.match(selecao.texto, /FROM wp_options WHERE option_name = \?/);
      assert.deepEqual(selecao.parametros, ['wp_user_roles']);
      assert.deepEqual(instalacao.falsa.escritas, []);
    }

    // 🔴 O que fica para T023: o desfecho da trava. No legado ela nao recusa a
    // acao — ela **salta aquela conta** e marca `$update = 'err_admin_role'`
    // (`users.php:156`-`:157`), e o resto do lote prossegue. E ha a excecao de
    // rede: quem tem `manage_network_users` troca de papel livremente
    // (`:152`, e `wp-admin/includes/user.php:70`-`:78` repete a regra no
    // `edit_user()`).
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   UT-013-5 — CA-11.5
   ══════════════════════════════════════════════════════════════════════════ */

for (const lado of LADOS) {
  test(`${lado}: UT-013-5 (CA-11.5) a conta sem papel nenhum perde a administracao, e e por isso que remover o proprio papel e recusado`, () => {
    const instalacao = instalacaoDeFabrica(lado);

    // `wp-admin/users.php:148`-`:150`: com `'' === $role` para o proprio ator, o
    // legado faz `wp_die( __( 'Sorry, you cannot remove your own role.' ), 403 )`.
    // O texto e a tela de T023; o que esta suite fixa e a CONSEQUENCIA que a
    // recusa evita, e ela e observavel no dado: um `{site}capabilities` sem papel.
    const semPapel: readonly ConcessaoDeCapacidade[] = [];
    instalacao.falsa.responder([{ ID: 1, user_login: 'quem-administra' }]);
    instalacao.falsa.responder([
      {
        umeta_id: 1,
        user_id: 1,
        meta_key: 'wp_capabilities',
        meta_value: capacidadesGravadas(semPapel),
      },
    ]);

    const fonteDePapeis = criarFonteDeAutorizacao(instalacao.armazenamento);
    const concessoes = fonteDePapeis.concessoesDaConta(1);
    assert.deepEqual(concessoes, []);

    let atual: BaseDeAutorizacao;
    const fonte = fonteSobreContas(
      () => atual,
      new Map([[1, { login: 'quem-administra', concessoes }]]),
      false,
      1,
    );
    atual = base(instalacao, fonte);

    const semNada = comAtor(atual, {
      contaId: 1,
      login: 'quem-administra',
      existe: true,
      concessoes,
    });

    // As seis capacidades que UC-24 nomeia somem todas de uma vez.
    for (const capacidade of [
      'list_users',
      'create_users',
      'edit_users',
      'promote_users',
      'delete_users',
      'remove_users',
    ]) {
      assert.equal(perguntarPermissao(semNada, capacidade), false);
    }
    // E as metacapacidades sobre conta tambem, porque a traducao as resolve nas
    // primitivas que acabaram de sumir.
    assert.equal(perguntarPermissao(semNada, 'promote_user', 2), false);
    assert.equal(perguntarPermissao(semNada, 'delete_user', 2), false);
    assert.equal(perguntarPermissao(semNada, 'remove_user', 2), false);

    // Duas coisas NAO somem, e as duas sao do legado:
    // 1. a sintetica concedida a todo mundo (`capabilities.php`, `'exist'`);
    assert.equal(perguntarPermissao(semNada, CAPACIDADE_CONCEDIDA_A_TODOS), true);
    // 2. editar o proprio perfil, porque a lista exigida e VAZIA e lista vazia
    //    significa permitido (`capabilities.php:69`-`:72`, pegadinha 2). E o fluxo
    //    alternativo de UC-24: *"qualquer conta edita o proprio perfil, inclusive
    //    um assinante"*.
    assert.deepEqual(capacidadesExigidas(semNada, 'edit_user', 1), []);
    assert.equal(perguntarPermissao(semNada, 'edit_user', 1), true);

    // 🔴 O que fica para T023: o literal da recusa — *"Sorry, you cannot remove
    // your own role."* com 403 — e o fato de ela ser `wp_die` e nao salto, ao
    // contrario da trava de UT-013-4, que salta. As duas recusas estao a sete
    // linhas de distancia no legado e tem desfechos diferentes.
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   UT-013-6 — CA-11.6
   ══════════════════════════════════════════════════════════════════════════ */

for (const lado of LADOS) {
  test(`${lado}: UT-013-6 (CA-11.6) quem resta capaz de promover sai do LIKE sobre texto serializado, e de nenhum outro lugar`, () => {
    const instalacao = instalacaoDeFabrica(lado);
    const fonteDePapeis = criarFonteDeAutorizacao(instalacao.armazenamento);
    const baseDaBusca: BaseDeAutorizacao = {
      matriz: instalacao.matriz,
      rede: REDE_INATIVA_NA_AUTORIZACAO,
    };

    // Na matriz de fabrica, so o administrador concede `promote_users`
    // (`matriz-de-fabrica.ts`, rotina 3.0.0 — `wp-admin/includes/schema.php`).
    assert.deepEqual(papeisQueConcedem(instalacao.matriz, 'promote_users'), [
      'administrator',
    ]);

    // 1: a busca pelo papel que concede encontra as contas 1 e 3;
    instalacao.falsa.responder([{ user_id: 1 }, { user_id: 3 }]);
    // 2: a busca pela propria capacidade nao encontra ninguem;
    instalacao.falsa.responder([]);
    // 3 e 4: o ator da conta 1;
    instalacao.falsa.responder([{ ID: 1, user_login: 'quem-administra' }]);
    instalacao.falsa.responder([
      {
        umeta_id: 1,
        user_id: 1,
        meta_key: 'wp_capabilities',
        meta_value: capacidadesGravadas(papel('administrator')),
      },
    ]);
    // 5 e 6: o ator da conta 3, que foi rebaixada a editor.
    instalacao.falsa.responder([{ ID: 3, user_login: 'outra-que-administrava' }]);
    instalacao.falsa.responder([
      {
        umeta_id: 2,
        user_id: 3,
        meta_key: 'wp_capabilities',
        meta_value: capacidadesGravadas(papel('editor')),
      },
    ]);

    // A pos-condicao de UC-24 se sustenta: depois do rebaixamento da conta 3,
    // continua havendo uma conta capaz de promover.
    assert.deepEqual(
      quemTemCapacidade('promote_users', baseDaBusca, fonteDePapeis),
      [1],
    );

    // E o efeito no banco e o que a pegadinha 5 de `permissions.md` descreve:
    // **nenhuma consulta SQL responde "quem administra"**. Sao duas buscas por
    // texto, com curinga dos dois lados, sobre a chave de autorizacao do site — e
    // nenhum indice as alcanca. Risco 4 do `plan.md`.
    const buscas = instalacao.falsa.selecoes.slice(1, 3);
    assert.equal(buscas.length, 2);
    for (const busca of buscas) {
      assert.match(
        busca.texto,
        /SELECT user_id FROM wp_usermeta WHERE meta_key = \? AND meta_value LIKE \?/,
      );
      assert.equal(busca.parametros[0], 'wp_capabilities');
    }
    assert.deepEqual(
      buscas.map((busca) => busca.parametros[1]),
      ['%"administrator"%', '%"promote\\_users"%'],
    );

    // A conta 3 foi ENCONTRADA pela busca e descartada pela decisao: o texto
    // serializado alcanca o nome, nunca o valor. E por isso que a resposta e dois
    // passos (CA-7.4) e nao uma consulta.
    assert.deepEqual(
      [...new Set(instalacao.falsa.selecoes.map((selecao) => selecao.texto))]
        .length > 1,
      true,
    );
    assert.deepEqual(instalacao.falsa.escritas, []);

    // 🔴 O que fica para T023, e e a divergencia 3 do cabecalho: a pos-condicao
    // nao e verificada em lugar nenhum do legado. A unica trava e a de
    // `users.php:146`, sobre o PROPRIO ator — e UC-24 avisa: *"outra entrada que
    // chame a troca de papel direto nao a aplica"*. Um porte que acrescentasse a
    // verificacao global inventaria regra, e isso cai na tabela *Nao negociavel*.
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   UT-013-7 — CA-11.7
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-013-7 (CA-11.7) a conta criada e notificada pelo MESMO ponto substituivel do cadastro aberto, e a promocao nao notifica nada', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamento(falsa.porta);
  const email = criarPortaDeEmailFalsa();

  // `wp-admin/user-new.php:201` chama `edit_user()`, e o ramo de insercao dela
  // (`wp-admin/includes/user.php:241`-`:242`) e o que notifica. A funcao chamada
  // e a MESMA do cadastro aberto — `wp_new_user_notification` —, e e por isso que
  // CA-11.7 se prova sobre `notificacao-de-conta-nova.ts`, de T013, sem
  // reimplementar nada.
  const notificacao = criarNotificacaoDeContaNovaDoNucleo({
    email: email.porta,
    contas: armazenamento.contas,
    resumoDaChave: {
      resumir: (chaveEmClaro) => `resumo-de-${chaveEmClaro}`,
      conferir: (chaveEmClaro, resumo) => resumo === `resumo-de-${chaveEmClaro}`,
    },
  });

  const resultado = notificacao.notificar({
    contaId: 9,
    login: 'conta-criada-pela-tela',
    email: 'titular@exemplo.test',
    agoraEmSegundos: 1_700_000_000,
    tituloDoSite: 'Sitio de Teste',
    chaveEmClaro: 'CHAVEEMCLARO',
    urlDeEntrada: 'https://exemplo.test/wp-login.php',
    montarUrlDaRede: (caminho) => `https://exemplo.test/${caminho}`,
  });

  // Uma mensagem, para o titular, com o assunto e o corpo do legado.
  assert.equal(resultado.chaveEmitida, true);
  assert.deepEqual(resultado.envios, [{ enviado: true }]);
  assert.equal(email.enviadas.length, 1);
  const mensagem = email.enviadas[0];
  assert.ok(mensagem !== undefined);
  assert.deepEqual(mensagem.destinatarios, ['titular@exemplo.test']);
  assert.equal(mensagem.assunto, '[Sitio de Teste] Login Details');
  assert.equal(
    mensagem.corpo,
    'Username: conta-criada-pela-tela\r\n\r\n' +
      'To set your password, visit the following address:\r\n\r\n' +
      'https://exemplo.test/wp-login.php?action=rp&key=CHAVEEMCLARO&login=conta-criada-pela-tela\r\n\r\n' +
      'https://exemplo.test/wp-login.php\r\n',
  );
  assert.deepEqual(mensagem.cabecalhos, []);
  assert.deepEqual(mensagem.anexos, []);

  // A ordem e observavel: a chave e GRAVADA antes de a mensagem sair, logo uma
  // falha de transporte deixa a chave valida e o titular sem o e-mail.
  assert.equal(falsa.escritas.length, 1);
  const escrita = falsa.escritas[0];
  assert.ok(escrita !== undefined);
  assert.match(escrita.texto, /UPDATE wp_users SET/);
  assert.match(escrita.texto, /user_activation_key/);
  assert.match(
    textoDoParametro(escrita.parametros[0]),
    /^1700000000:resumo-de-CHAVEEMCLARO$/,
  );

  // 🔴 A divergencia 2 do cabecalho: **promover nao notifica**. `case 'promote'`
  // de `wp-admin/users.php:172` chama `set_role()` e nada mais — nenhuma
  // linha de e-mail no ramo. Aqui isso se afirma pelo caminho do dado: alterar a
  // definicao de papel gravada nao faz mensagem alguma sair.
  const construtor = criarConstrutorDeDefinicao(povoarPapeis('legado-integral'));
  construtor.adicionarCapacidade('editor', 'promote_users');
  falsa.responder([]);
  armazenamento.papeis.gravarDefinicao(construtor.resultado());
  assert.equal(email.enviadas.length, 1);

  // 🔴 O que fica para T023: o `$notify` de dois valores
  // (`wp-admin/includes/user.php:242`) — com a caixa *"Send User Notification"*
  // marcada o legado manda `'both'` e sem ela manda `'admin'`, e nesse segundo
  // caso **o titular nao recebe nada**. A mensagem do administrador nao existe
  // nesta arvore: `notificacao-de-conta-nova.ts` entrega a do titular so, e
  // CA-6.x de T013 e quem a declara. Tambem fica de fora o aviso de troca de
  // e-mail e de senha, que `wp_update_user()` dispara no caminho de ALTERACAO.
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-013-8 — a regra de negocio: N6 (BR-MIGRAR-066)
   ══════════════════════════════════════════════════════════════════════════ */

for (const lado of LADOS) {
  test(`${lado}: UT-013-8 (N6) criar conta na rede e permissao de rede, salvo a opcao add_new_users`, () => {
    const instalacao = instalacaoDeFabrica(lado);

    const contas = new Map([
      [1, { login: 'quem-administra', concessoes: papel('administrator') }],
    ]);

    function montar(
      rede: EstadoDaRedeNaAutorizacao,
      criacaoLiberada: boolean,
    ): BaseDeAutorizacao {
      let atual: BaseDeAutorizacao;
      const fonte = fonteSobreContas(() => atual, contas, criacaoLiberada, 1);
      atual = base(instalacao, fonte, rede);
      return atual;
    }

    const ator = {
      contaId: 1,
      login: 'quem-administra',
      existe: true,
      concessoes: papel('administrator'),
    };

    // 1. Fora da rede o `case` devolve a propria capacidade — `capabilities.php:683`-`:684`
    //    (`if ( ! is_multisite() ) { $caps[] = $cap; }`). O administrador a tem na
    //    matriz de fabrica (rotina 2.1.0), logo passa.
    const siteUnico = comAtor(
      montar(REDE_INATIVA_NA_AUTORIZACAO, false),
      ator,
    );
    assert.deepEqual(capacidadesExigidas(siteUnico, 'create_users'), [
      'create_users',
    ]);
    assert.equal(perguntarPermissao(siteUnico, 'create_users'), true);

    // 2. Em rede, com a opcao DESLIGADA — que e o valor de fabrica, e o que `N6`
    //    chama de *"salvo opcao explicita"* —, quem nao e super administrador e
    //    negado: `capabilities.php:688` (`$caps[] = 'do_not_allow'`).
    const redeSemSuper: EstadoDaRedeNaAutorizacao = {
      ativa: true,
      loginsDeSuperAdmin: ['quem-supervisiona-a-rede'],
    };
    const emRedeFechada = comAtor(montar(redeSemSuper, false), ator);
    assert.deepEqual(capacidadesExigidas(emRedeFechada, 'create_users'), [
      CAPACIDADE_NEGADA,
    ]);
    assert.equal(perguntarPermissao(emRedeFechada, 'create_users'), false);

    // 3. A MESMA conta, com a opcao de rede ligada, passa — `capabilities.php:685`
    //    (`elseif ( is_super_admin( $user_id ) || get_site_option( 'add_new_users' ) )`).
    //    Nada mudou na matriz nem na conta: mudou uma opcao DA REDE, e e isso que
    //    faz de `create_users` uma permissao de rede.
    const emRedeLiberada = comAtor(montar(redeSemSuper, true), ator);
    assert.deepEqual(capacidadesExigidas(emRedeLiberada, 'create_users'), [
      'create_users',
    ]);
    assert.equal(perguntarPermissao(emRedeLiberada, 'create_users'), true);

    // 4. E o super administrador passa com a opcao desligada, pelo primeiro termo
    //    do mesmo `elseif`.
    const redeComSuper: EstadoDaRedeNaAutorizacao = {
      ativa: true,
      loginsDeSuperAdmin: ['quem-administra'],
    };
    const comoSuperAdmin = comAtor(montar(redeComSuper, false), ator);
    assert.deepEqual(capacidadesExigidas(comoSuperAdmin, 'create_users'), [
      'create_users',
    ]);
    assert.equal(perguntarPermissao(comoSuperAdmin, 'create_users'), true);

    // A matriz nao participou de nenhuma das quatro decisoes de `N6`: `create_users`
    // esta nela nos quatro casos, e o que mudou foi so o `case` da traducao. E a
    // forma do legado, e e por isso que `N6` e regra de NEGOCIO e nao de papel.
    assert.deepEqual(
      capacidadesDoPapel(instalacao.matriz, 'administrator')
        .filter((concessao) => concessao.capacidade === 'create_users')
        .map((concessao) => concessao.concedida),
      [true],
    );

    // 🔴 O que fica para T023: o segundo portao da tela de criacao em rede.
    // `wp-admin/user-new.php:13` e `:20` aceitam `create_users` **ou**
    // `promote_users` para abrir a tela, e `:54`-`:60` exige `promote_user`
    // sobre a conta que ja existe na rede — o fluxo alternativo de UC-24
    // (*"a identidade e global: a conta nao e criada, e vinculada a este site"*).
  });
}
