/**
 * Desvincular contas deste site — a acao `doremove` de
 * `wp-admin/users.php:489`-`:519` e o `remove_user_from_blog()` de
 * `wp-includes/ms-functions.php:240`.
 *
 * Entrega de **T023** da feature `001-identidade-e-acesso` (US-11). E a **unica**
 * das tres acoes em lote em que CA-11.2 e literalmente verdadeira: aqui a conta
 * sem permissao e saltada e as demais prosseguem.
 *
 * ---
 *
 * # A ordem
 *
 * | # | ramo | o que acontece | linha |
 * |---|---|---|---|
 * | 1 | instalacao **fora** de rede | recusa 400: nao existe desvincular | `:492` |
 * | 2 | lote vazio | so redireciona | `:496` |
 * | 3 | `remove_users` do ator | recusa 403 | `:501` |
 * | 4 | por conta: `remove_user` sobre **aquela** conta | **saltada**, aviso `err_admin_remove` | `:509` |
 * | 5 | por conta: desvincula | escrita | `:514` |
 *
 * **O ramo 4 e CA-11.2.** `$update = 'err_admin_remove'; continue;` — e o bilhete
 * da tela diz qual e o caso que o alcanca na pratica: *"You cannot remove the
 * current user."* Faz sentido, porque o `case 'remove_user'` de
 * `map_meta_cap()` nega exatamente isto: a propria conta, a quem nao e super
 * administrador (ver `plataforma/autorizacao/traducao-de-conta.ts`).
 *
 * ---
 *
 * # Desvincular NAO e apagar, e a diferenca e a identidade
 *
 * `remove_all_caps()` apaga `{site}capabilities` e `{site}user_level` **deste
 * site**. A linha de `users` fica, o perfil fica, a sessao fica, e as capacidades
 * nos **outros** sites da rede ficam. UC-24 diz por que na tabela de excecoes:
 * *"apagar identidade e poder de rede, porque a identidade e global"*. E o texto
 * de ajuda da propria tela repete: *"Remove allows you to remove a user from your
 * site. **It does not delete their content.**"*
 *
 * ---
 *
 * # 🔴 Tres escritas de `remove_user_from_blog` NAO foram portadas, e a razao e o
 * escopo
 *
 * O legado, alem de tirar as capacidades, mexe em `primary_blog` e
 * `source_domain` da conta (`ms-functions.php:264`-`:280` e `:290`-`:294`), e
 * para isso precisa de `get_blogs_of_user()` — a lista de sites da rede em que
 * aquela conta tem capacidade.
 *
 * **Nada disso e desta feature.** Os cards de rede estao em
 * `do-not-rewrite.md` — `REQ-129` a `REQ-135`, inclusive *"supervisionar o site da
 * rede"* e *"preservar o estado criado e ainda nao ativado"* —, nenhuma tarefa de
 * `tasks.md` entrega a tabela de sites, e `../cadastro/cadastrar.ts` ja registrou
 * a mesma fronteira para UC-41. Inventar aqui a varredura de `usermeta` por
 * prefixo de site seria reescrever meia rede dentro do modulo de identidade.
 *
 * **Consequencia declarada**, para nao ser descoberta depois: numa instalacao de
 * rede, desvincular a conta do site que era o site primario dela **nao** move o
 * `primary_blog` para outro site. A conta fica com `primary_blog` apontando para
 * um site em que nao tem mais capacidade — que e, aliás, um estado que o proprio
 * legado produz quando a conta nao esta em mais nenhum site. Fecha contra o
 * oraculo (`ESC-ORACULO`, BR-MIGRAR-116) junto com o resto do recorte de rede que
 * `plataforma/autorizacao/revogacao-por-constante.ts` ja declara.
 */

import { perguntarPermissao } from '../../../plataforma/autorizacao/index.js';
import type { ContextoDaAdministracaoDeContas } from './contexto-de-administracao.js';
import {
  AVISOS_DA_ADMINISTRACAO,
  RECUSAS_DA_ADMINISTRACAO,
  type AvisoDaAdministracao,
  type RecusaDaAdministracao,
} from './mensagens-da-administracao.js';
import {
  removerTodasAsCapacidades,
  type ResultadoDaRemocaoDeCapacidades,
} from './papel-da-conta.js';
import { autorizacaoDoAtor, podeSobreConta } from './permissao-sobre-conta.js';

/** `remove_users` — a capacidade da **acao** (`users.php:501`). */
const CAPACIDADE_DA_ACAO = 'remove_users';

/** `remove_user` — a meta-capacidade sobre **aquela** conta (`users.php:509`). */
const CAPACIDADE_SOBRE_A_CONTA = 'remove_user';

/**
 * `'That user does not exist.'` — o erro de `remove_user_from_blog()`
 * (`ms-functions.php:285`).
 *
 * E erro **devolvido**, nao recusa de tela: a funcao volta um `WP_Error` e quem
 * chamou nao o olha (`users.php:514` ignora o retorno). Por isso ele e valor no
 * resultado e nenhuma ramificacao deste arquivo o le — mesma postura de
 * `../cadastro/notificacao-de-conta-nova.ts` com a falha de envio (**P7**).
 */
export const MENSAGEM_DE_CONTA_INEXISTENTE = 'That user does not exist.';

/** O que se pede. */
export interface PedidoDeRemocaoDeContas {
  /** Os identificadores, na ordem em que a tela os enviou. */
  readonly contas: readonly number[];
}

/** O que desvincular uma conta fez. */
export interface ContaRemovidaDoSite {
  readonly contaId: number;
  readonly siteId: number;
  /** `false` quando a conta nao existe; nenhuma capacidade foi tocada. */
  readonly removida: boolean;
  /** O erro devolvido, quando houve. Ver {@link MENSAGEM_DE_CONTA_INEXISTENTE}. */
  readonly erro: string | null;
  /** `null` quando a conta nao existia. */
  readonly capacidades: ResultadoDaRemocaoDeCapacidades | null;
}

/** Como a operacao terminou. */
export type DesfechoDaRemocao =
  | 'concluido'
  | 'nenhuma-conta-escolhida'
  | 'remocao_fora_da_rede'
  | 'remover_acao';

/** O que a remocao informa de volta. Nao lanca. */
export interface ResultadoDaRemocaoDeContas {
  readonly desfecho: DesfechoDaRemocao;
  readonly recusa: RecusaDaAdministracao | null;
  readonly aviso: AvisoDaAdministracao | null;
  readonly removidas: readonly ContaRemovidaDoSite[];
  /** As contas saltadas por falta de permissao sobre elas — CA-11.2. */
  readonly saltadas: readonly number[];
}

/**
 * Desvincula as contas escolhidas deste site (US-11).
 *
 * **Permissao exigida: `remove_users` para a acao e `remove_user` para cada
 * conta alvo** (CA-11.1). A segunda, aqui, **salta** em vez de parar — e e a
 * unica das tres acoes em lote em que isso acontece (CA-11.2). O nonce
 * `remove-users` nao e deste pacote; ver `permissao-sobre-conta.ts`.
 */
export function removerContasDoSite(
  pedido: PedidoDeRemocaoDeContas,
  contexto: ContextoDaAdministracaoDeContas,
): ResultadoDaRemocaoDeContas {
  const removidas: ContaRemovidaDoSite[] = [];
  const saltadas: number[] = [];

  function parar(
    desfecho: DesfechoDaRemocao,
    recusa: RecusaDaAdministracao | null,
    aviso: AvisoDaAdministracao | null,
  ): ResultadoDaRemocaoDeContas {
    return { desfecho, recusa, aviso, removidas, saltadas };
  }

  // Ramo 1: fora de rede nao existe desvincular — so apagar.
  if (!contexto.base.rede.ativa) {
    return parar(
      'remocao_fora_da_rede',
      RECUSAS_DA_ADMINISTRACAO.remocao_fora_da_rede,
      null,
    );
  }

  // Ramo 2: lista vazia.
  if (pedido.contas.length === 0) {
    return parar('nenhuma-conta-escolhida', null, null);
  }

  // Ramo 3: a capacidade da ACAO.
  const autorizacao = autorizacaoDoAtor(contexto);
  if (!perguntarPermissao(autorizacao, CAPACIDADE_DA_ACAO)) {
    return parar('remover_acao', RECUSAS_DA_ADMINISTRACAO.remover_acao, null);
  }

  let aviso: AvisoDaAdministracao = AVISOS_DA_ADMINISTRACAO.remocao;

  for (const contaId of pedido.contas) {
    // Ramo 4: CA-11.2 — salta, e o lote continua.
    if (!podeSobreConta(autorizacao, CAPACIDADE_SOBRE_A_CONTA, contaId)) {
      aviso = AVISOS_DA_ADMINISTRACAO.remocao_do_proprio_ator;
      saltadas.push(contaId);
      continue;
    }

    // Ramo 5. O terceiro argumento do legado e `0`: esta tela nao reatribui.
    removidas.push(removerContaDoSite(contexto, contaId, 0));
  }

  return parar('concluido', null, aviso);
}

/**
 * `remove_user_from_blog( $conta, $site, $reassign )` — desvincula **uma** conta.
 *
 * Exportada porque no legado e funcao global alcancavel por qualquer extensao, e
 * porque `wp_delete_user()` a chama no ramo de rede. Chamar direto pula as
 * guardas da tela, como no legado.
 *
 * Os passos, na ordem do legado:
 *
 * 1. ponto de extensao `remove_user_from_blog` — dispara **antes** de a conta ser
 *    procurada, logo dispara tambem para conta inexistente;
 * 2. conta inexistente devolve o erro e **nada** e escrito;
 * 3. `remove_all_caps()`: as duas chaves de autorizacao deste site;
 * 4. com reatribuicao, `post_author` e `link_owner` passam ao destino.
 *
 * ⚠️ O passo 4 do legado tem uma assimetria em relacao a `wp_delete_user()`: aqui
 * a reatribuicao e **opcional e so acontece quando o destino e verdadeiro**
 * (`if ( $reassign )`), e nao ha ramo de apagar conteudo. Desvincular nunca apaga
 * nada — ver o texto de ajuda citado no cabecalho.
 */
export function removerContaDoSite(
  contexto: ContextoDaAdministracaoDeContas,
  contaId: number,
  destinoId: number,
): ContaRemovidaDoSite {
  // Passo 1.
  contexto.ganchos?.aoRemoverContaDoSite?.(contaId, contexto.siteId, destinoId);

  // Passo 2.
  if (contexto.armazenamento.contas.obterPorId(contaId) === null) {
    return {
      contaId,
      siteId: contexto.siteId,
      removida: false,
      erro: MENSAGEM_DE_CONTA_INEXISTENTE,
      capacidades: null,
    };
  }

  // Passo 3.
  const capacidades = removerTodasAsCapacidades(
    {
      papeis: contexto.armazenamento.papeis,
      perfil: contexto.armazenamento.perfil,
      chaves: contexto.chaves,
    },
    contaId,
  );

  // Passo 4. Zero e falso para o legado, logo nao reatribui.
  if (destinoId !== 0) {
    contexto.acervo.reatribuirConteudoDaConta(contaId, destinoId);
  }

  return {
    contaId,
    siteId: contexto.siteId,
    removida: true,
    erro: null,
    capacidades,
  };
}
