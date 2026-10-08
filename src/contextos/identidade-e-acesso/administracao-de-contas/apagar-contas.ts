/**
 * Apagar contas em lote, e a **cascata** de apagar uma — a acao `dodelete` de
 * `wp-admin/users.php:178`-`:241` e o `wp_delete_user()` de
 * `wp-admin/includes/user.php:351`.
 *
 * Entrega de **T023** da feature `001-identidade-e-acesso` (US-11). E onde
 * CA-11.3 se decide, e onde o **P5** da constituicao e cobrado: *"mantenha, no
 * modelo novo, exatamente o que desaparece e o que fica orfao quando um registro
 * e apagado"*.
 *
 * ---
 *
 * # A cascata, e o que fica orfao
 *
 * | o que | sem reatribuicao | com reatribuicao |
 * |---|---|---|
 * | `posts` da conta | **apagados** (so os tipos apagaveis com o autor) | `post_author` passa ao destino, **todos** os tipos |
 * | `links` da conta | **apagados** | `link_owner` passa ao destino |
 * | `comments` da conta | **intactos — ORFAOS** | **intactos — ORFAOS** |
 * | `usermeta` da conta | **todas as linhas**, uma por `umeta_id` | idem |
 * | linha de `users` | **apagada** | idem |
 *
 * **O comentario orfao e a regra, nao a sobra.** `target_data_model.md` o poe
 * entre os tres motivos pelos quais a integridade referencial esta desativada:
 * *"comentario orfao e **estado normal**: apagar o usuario **nao** toca nos
 * comentarios, de proposito, para preservar o historico da discussao"*. O **P5**
 * fecha: *"declarar restricao no armazenamento que faca o teste mudar de
 * resultado e violacao, mesmo quando a restricao e 'mais correta'"*. A suite desta
 * tarefa afirma o conjunto exato do que sumiu **e** do que permaneceu.
 *
 * `posts` e `links` ficam atras de {@link AcervoDaConta}, que e porta: nenhuma
 * das duas tabelas e desta feature, e qual tipo de conteudo e apagado junto com o
 * autor sai do registro do tipo. Ver a nota daquela interface.
 *
 * ---
 *
 * # A ordem do lote, e uma inversao que um porte "arruma"
 *
 * | # | ramo | o que acontece | linha |
 * |---|---|---|---|
 * | 1 | instalacao em rede | recusa 400: esta tela nao apaga identidade | `:179` |
 * | 2 | lote vazio | so redireciona | `:185` |
 * | 3 | **nenhuma opcao de exclusao escolhida** | volta a tela de confirmacao com o aviso | `:192` |
 * | 4 | `delete_users` do ator | recusa 403 | `:199` |
 * | 5 | por conta: `delete_user` sobre **aquela** conta | **recusa, e o lote PARA** | `:207` |
 * | 6 | por conta: e a propria conta | **saltada**, aviso `err_admin_del` | `:211` |
 * | 7 | por conta: reatribuir sem destino | **saltada**, aviso `err_missing_reassign` | `:216` |
 * | 8 | por conta: a cascata | escrita | `:221` |
 *
 * ⚠️ **O ramo 3 vem ANTES do ramo 4, e isso e observavel.** Quem nao tem
 * `delete_users` e manda o lote sem opcao de exclusao recebe a **tela de
 * confirmacao**, nao a recusa de permissao. Um porte que agrupe as guardas de
 * permissao no topo — o que e o instinto de qualquer um — troca a resposta
 * daquela requisicao. A ordem esta afirmada por teste.
 *
 * ⚠️ **O ramo 6 e a segunda metade de CA-11.6.** O ator nunca e apagado por esta
 * acao, e o bilhete da tela diz por extenso *"You cannot delete the current
 * user"*. Somado a trava de `promover-contas.ts`, e o que mantem ao menos uma
 * conta capaz de promover ao fim de qualquer operacao — **sem nenhuma contagem**,
 * que o **P6** proibiria inventar.
 *
 * ⚠️ **Opcao desconhecida conta como apagada e nao apaga nada.** `++$delete_count`
 * esta **fora** do `switch` interno (`users.php:230`), logo uma opcao que nao e
 * `delete` nem `reassign` incrementa a contagem sem emitir escrita alguma — e a
 * tela anuncia "N usuarios apagados". Quirk do legado, reproduzido, com teste.
 *
 * ---
 *
 * # 🔴 CA-11.2 nao vale nesta acao
 *
 * O ramo 5 **para o lote** (`wp_die`), nao salta. A analise completa, com a
 * tabela das quatro acoes em lote e a citacao do **P1**, esta no cabecalho de
 * `promover-contas.ts`. O que **e** saltado aqui sao os ramos 6 e 7.
 */

import type { Conta } from '../armazenamento/conta.js';
import { perguntarPermissao } from '../../../plataforma/autorizacao/index.js';
import type { ContextoDaAdministracaoDeContas } from './contexto-de-administracao.js';
import {
  AVISOS_DA_ADMINISTRACAO,
  RECUSAS_DA_ADMINISTRACAO,
  type AvisoDaAdministracao,
  type RecusaDaAdministracao,
} from './mensagens-da-administracao.js';
import { removerContaDoSite } from './remover-contas-do-site.js';
import { autorizacaoDoAtor, podeSobreConta } from './permissao-sobre-conta.js';

/** `delete_users` — a capacidade da **acao** (`users.php:199`). */
const CAPACIDADE_DA_ACAO = 'delete_users';

/** `delete_user` — a meta-capacidade sobre **aquela** conta (`users.php:207`). */
const CAPACIDADE_SOBRE_A_CONTA = 'delete_user';

/**
 * As duas opcoes que a tela de confirmacao oferece por conta (CA-11.3).
 *
 * Os nomes sao os do legado (`delete_option[ $id ]`, valores `delete` e
 * `reassign`) porque viajam no formulario: renomea-los mudaria o que a tela
 * envia, e o **P8** poe superficie publicada fora do alcance de quem codifica.
 */
export type OpcaoDeExclusaoDeConta = 'delete' | 'reassign';

/** A escolha feita para uma conta. */
export interface EscolhaDeExclusao {
  /**
   * A opcao, como a tela a enviou.
   *
   * Em `string` e nao na uniao fechada de proposito: o legado nao valida este
   * campo, e uma opcao desconhecida tem comportamento proprio — ver a terceira
   * ressalva do cabecalho. Fechar o tipo tornaria o quirk inalcancavel.
   */
  readonly opcao: string;
  /**
   * A conta que recebe o conteudo, quando a opcao e `reassign`.
   *
   * `0` e **ausente** para o legado: a conferencia e `empty( $_REQUEST[
   * 'reassign_user' ][ $id ] )`, e zero e vazio em PHP.
   */
  readonly destinoId?: number;
}

/** O que se pede: as contas e a escolha de cada uma. */
export interface PedidoDeExclusaoDeContas {
  /** Os identificadores, na ordem em que a tela os enviou. A ordem decide. */
  readonly contas: readonly number[];
  /**
   * A escolha por conta.
   *
   * Mapa **vazio** e o ramo 3: o legado testa `empty( $_REQUEST['delete_option'] )`
   * sobre o conjunto inteiro, nao por conta. Conta sem escolha dentro de um mapa
   * nao vazio cai no ramo 8 com opcao desconhecida.
   */
  readonly escolhas: Readonly<Record<number, EscolhaDeExclusao>>;
}

/** O que a cascata de uma conta fez. */
export interface ContaApagada {
  readonly contaId: number;
  /** `null` quando nao houve reatribuicao. */
  readonly destinoId: number | null;
  /**
   * `false` quando a conta nao existia — o `if ( ! $user->exists() ) return
   * false;` de `wp_delete_user()`. Nenhuma escrita sai, e o lote continua.
   */
  readonly apagada: boolean;
  /** Linhas de `usermeta` apagadas, uma por `umeta_id`. */
  readonly metadadosApagados: number;
  /** Linhas de `users` apagadas. Zero em instalacao de rede: ver o cabecalho. */
  readonly linhasDeConta: number;
}

/** Por que uma conta foi saltada. */
export type MotivoDeSaltoNaExclusao =
  /** E a conta do ator (ramo 6, CA-11.6). */
  | 'propria-conta'
  /** Reatribuicao escolhida sem conta de destino (ramo 7, CA-11.3). */
  | 'reatribuicao-sem-destino';

/** Uma conta saltada, com o motivo. */
export interface ContaSaltadaNaExclusao {
  readonly contaId: number;
  readonly motivo: MotivoDeSaltoNaExclusao;
}

/** Como a operacao terminou. */
export type DesfechoDaExclusao =
  | 'concluido'
  | 'nenhuma-conta-escolhida'
  /** Ramo 3: a tela volta pedindo a escolha de CA-11.3. */
  | 'opcao-de-exclusao-ausente'
  | 'exclusao_em_rede'
  | 'apagar_acao'
  | 'apagar_alvo';

/** O que a exclusao informa de volta. Nao lanca. */
export interface ResultadoDaExclusaoDeContas {
  readonly desfecho: DesfechoDaExclusao;
  readonly recusa: RecusaDaAdministracao | null;
  readonly aviso: AvisoDaAdministracao | null;
  /**
   * O `delete_count` do legado — e ele **nao** e `apagadas.length`.
   *
   * Ver a terceira ressalva do cabecalho: opcao desconhecida incrementa a
   * contagem sem apagar nada.
   */
  readonly quantidade: number;
  readonly apagadas: readonly ContaApagada[];
  readonly saltadas: readonly ContaSaltadaNaExclusao[];
}

/**
 * Apaga as contas escolhidas, com a cascata de cada uma (US-11).
 *
 * **Permissao exigida: `delete_users` para a acao e `delete_user` para cada
 * conta alvo** (CA-11.1), nessa ordem — e, antes das duas, a escolha de CA-11.3.
 * O nonce `delete-users` nao e deste pacote; ver `permissao-sobre-conta.ts`.
 */
export function apagarContas(
  pedido: PedidoDeExclusaoDeContas,
  contexto: ContextoDaAdministracaoDeContas,
): ResultadoDaExclusaoDeContas {
  const apagadas: ContaApagada[] = [];
  const saltadas: ContaSaltadaNaExclusao[] = [];
  let quantidade = 0;

  function parar(
    desfecho: DesfechoDaExclusao,
    recusa: RecusaDaAdministracao | null,
    aviso: AvisoDaAdministracao | null,
  ): ResultadoDaExclusaoDeContas {
    return { desfecho, recusa, aviso, quantidade, apagadas, saltadas };
  }

  // Ramo 1: em rede, apagar identidade e poder de rede e nao desta tela.
  if (contexto.base.rede.ativa) {
    return parar(
      'exclusao_em_rede',
      RECUSAS_DA_ADMINISTRACAO.exclusao_em_rede,
      null,
    );
  }

  // Ramo 2: lista vazia.
  if (pedido.contas.length === 0) {
    return parar('nenhuma-conta-escolhida', null, null);
  }

  // Ramo 3: CA-11.3, e vem ANTES da permissao. Ver a primeira ressalva.
  if (Object.keys(pedido.escolhas).length === 0) {
    return parar('opcao-de-exclusao-ausente', null, null);
  }

  // Ramo 4: a capacidade da ACAO.
  const autorizacao = autorizacaoDoAtor(contexto);
  if (!perguntarPermissao(autorizacao, CAPACIDADE_DA_ACAO)) {
    return parar('apagar_acao', RECUSAS_DA_ADMINISTRACAO.apagar_acao, null);
  }

  let aviso: AvisoDaAdministracao = AVISOS_DA_ADMINISTRACAO.exclusao;

  for (const contaId of pedido.contas) {
    // Ramo 5: a capacidade sobre AQUELA conta. Falha PARA o lote.
    if (!podeSobreConta(autorizacao, CAPACIDADE_SOBRE_A_CONTA, contaId)) {
      return parar(
        'apagar_alvo',
        RECUSAS_DA_ADMINISTRACAO.apagar_alvo,
        aviso,
      );
    }

    // Ramo 6: o ator nunca e apagado (CA-11.6).
    if (contaId === contexto.ator.contaId) {
      aviso = AVISOS_DA_ADMINISTRACAO.exclusao_do_proprio_ator;
      saltadas.push({ contaId, motivo: 'propria-conta' });
      continue;
    }

    const escolha = pedido.escolhas[contaId];

    // Ramo 7: reatribuir sem destino (CA-11.3). Zero conta como ausente.
    if (
      escolha?.opcao === 'reassign' &&
      (escolha.destinoId === undefined || escolha.destinoId === 0)
    ) {
      aviso = AVISOS_DA_ADMINISTRACAO.reatribuicao_sem_destino;
      saltadas.push({ contaId, motivo: 'reatribuicao-sem-destino' });
      continue;
    }

    // Ramo 8: a cascata. O `switch` interno reconhece duas opcoes; qualquer
    // outra nao escreve nada — e a contagem incrementa de todo jeito.
    if (escolha?.opcao === 'delete') {
      apagadas.push(apagarConta(contexto, contaId, null));
    } else if (escolha?.opcao === 'reassign') {
      apagadas.push(
        apagarConta(contexto, contaId, escolha.destinoId as number),
      );
    }

    quantidade += 1;
  }

  return parar('concluido', null, aviso);
}

/**
 * `wp_delete_user( $id, $reassign )` — a cascata de **uma** conta.
 *
 * Exportada porque no legado ela e funcao global alcancavel por qualquer
 * extensao, e porque e ela, e nao o lote, que o **P5** cobra por teste. Chamar
 * direto pula as sete guardas da tela — inclusive a trava que impede apagar o
 * proprio ator —, e no legado e exatamente assim: UC-24 avisa que *"a regra esta
 * na tela, nao no modelo de autorizacao"*.
 *
 * Os passos, na ordem do legado, e a ordem e observavel por nao haver transacao:
 *
 * 1. conta inexistente devolve "nao apagou" sem emitir nada;
 * 2. ponto de extensao `delete_user`, **antes** de qualquer escrita — e e por
 *    isso que ele e o ultimo momento em que a conta ainda existe;
 * 3. o acervo: apagado ou reatribuido;
 * 4. em rede, desvia para desvincular do site e a linha de `users` **fica**;
 *    fora dela, `usermeta` linha por linha e depois a linha de `users`;
 * 5. ponto de extensao `deleted_user`.
 */
export function apagarConta(
  contexto: ContextoDaAdministracaoDeContas,
  contaId: number,
  destinoId: number | null,
): ContaApagada {
  const conta: Conta | null = contexto.armazenamento.contas.obterPorId(contaId);

  // Passo 1.
  if (conta === null) {
    return {
      contaId,
      destinoId,
      apagada: false,
      metadadosApagados: 0,
      linhasDeConta: 0,
    };
  }

  // Passo 2.
  contexto.ganchos?.aoApagarConta?.(contaId, destinoId);

  // Passo 3.
  if (destinoId === null) {
    contexto.acervo.apagarConteudoDaConta(contaId);
  } else {
    contexto.acervo.reatribuirConteudoDaConta(contaId, destinoId);
  }

  // Passo 4.
  let metadadosApagados = 0;
  let linhasDeConta = 0;
  if (contexto.base.rede.ativa) {
    // Em rede a identidade e global: `wp_delete_user()` so desvincula do site.
    // Este ramo e inalcancavel pelo lote — o ramo 1 de `apagarContas` ja recusou
    // —, e existe porque a funcao e chamavel direto, como no legado.
    removerContaDoSite(contexto, contaId, 0);
  } else {
    // Uma linha por `umeta_id`, como `delete_metadata_by_mid` no legado.
    for (const metadado of contexto.armazenamento.perfil.listar(contaId)) {
      metadadosApagados += contexto.armazenamento.perfil.apagarPorId(
        metadado.id,
      );
    }
    linhasDeConta = contexto.armazenamento.contas.apagar(contaId);
  }

  // Passo 5.
  contexto.ganchos?.contaApagada?.(contaId, destinoId);

  return { contaId, destinoId, apagada: true, metadadosApagados, linhasDeConta };
}

/**
 * A conta tem conteudo? — a pergunta que decide se a tela oferece a escolha de
 * CA-11.3.
 *
 * Duas camadas, na ordem do legado: o ponto de extensao
 * `users_have_additional_content` primeiro — **pode abrir a escolha para uma
 * conta sem conteudo nenhum** — e so depois as consultas, que estao atras de
 * {@link AcervoDaConta}.
 */
export function contaTemConteudo(
  contexto: ContextoDaAdministracaoDeContas,
  contaId: number,
): boolean {
  const filtrar = contexto.ganchos?.filtrarContaTemConteudo;
  if (filtrar !== undefined && filtrar(false, contaId)) {
    return true;
  }
  return contexto.acervo.contaTemConteudo(contaId);
}
