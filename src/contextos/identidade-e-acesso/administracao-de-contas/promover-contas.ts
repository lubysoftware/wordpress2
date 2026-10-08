/**
 * Promover e rebaixar contas em lote — a acao `promote` de
 * `wp-admin/users.php:110`-`:176`.
 *
 * Entrega de **T023** da feature `001-identidade-e-acesso` (US-11). E a acao em
 * que CA-11.1, CA-11.2, CA-11.4, CA-11.5 e CA-11.6 se decidem, e as cinco se
 * decidem **no mesmo laco**, em cinco ramos que param uns antes dos outros.
 *
 * ---
 *
 * # A ordem, que e a regra
 *
 * | # | ramo | o que acontece | linha |
 * |---|---|---|---|
 * | 1 | `promote_users` do ator | recusa, e nenhuma conta e tocada | `:113` |
 * | 2 | lote vazio | so redireciona: sem recusa e sem aviso | `:117` |
 * | 3 | papel ausente, falso ou nao editavel | recusa | `:130` |
 * | 4 | por conta: `promote_user` sobre **aquela** conta | **recusa, e o lote PARA** | `:142` |
 * | 5 | por conta: e a propria conta, e o papel pedido e vazio | recusa | `:148` |
 * | 6 | por conta: e a propria conta | **saltada**, com ou sem aviso de erro | `:152`-`:157` |
 * | 7 | por conta, em rede: nao e membro deste site | **recusa, e o lote PARA** | `:161` |
 * | 8 | por conta: o papel e definido | escrita | `:172` |
 *
 * O ramo 3 roda **antes** do laco, logo um papel invalido nao chega a perguntar
 * permissao sobre conta nenhuma; e os ramos 4 e 7 param no meio, deixando
 * gravadas as contas que vieram antes delas na lista. Isso nao e descuido de
 * porte, e BR-MIGRAR-104: **nao existe transacao**, e
 * `../portas/porta-de-dados.ts` ja registra que *"o estado parcial e a regra, nao
 * o defeito"*. Por isso o resultado desta operacao devolve as contas ja alteradas
 * **mesmo quando ha recusa**: esconde-las faria o porte parecer transacional.
 *
 * ---
 *
 * # 🔴 CA-11.2 e verdadeira para **remover**, e falsa para **promover** e **apagar**
 *
 * CA-11.2 diz: *"numa acao em lote, uma conta sem permissao e saltada e as demais
 * prosseguem"*. No legado isso vale **em uma** das tres acoes em lote:
 *
 * | acao | conta sem permissao | linha |
 * |---|---|---|
 * | `doremove` | `$update = 'err_admin_remove'; continue;` — **saltada** | `users.php:509` |
 * | `promote` | `wp_die( …, 403 )` — **o lote inteiro para** | `users.php:142` |
 * | `dodelete` | `wp_die( …, 403 )` — **o lote inteiro para** | `users.php:207` |
 * | `resetpassword` | `wp_die( … )` — **o lote inteiro para** | `users.php:260` |
 *
 * O que **e** saltado em `promote` e em `dodelete` e a **propria conta do ator**
 * (ramo 6 aqui, e `users.php:211` la), e os bilhetes da tela confirmam a leitura:
 * *"Your role was not changed"* e *"Other user roles have been changed"*.
 *
 * O **P1** resolve sem esta tarefa escolher: *"reproduza o comportamento
 * observavel do sistema analisado, inclusive quando ele parecer defeito. Divergir
 * exige uma decisao humana registrada, citada no codigo que divergiu."* Nenhuma
 * existe, e saltar aqui tornaria o sistema **mais aberto** que o legado — faria
 * um lote parcialmente autorizado ser parcialmente aplicado onde o legado nao
 * aplica nada do ponto da recusa em diante. Logo: reproduz-se o legado, acao por
 * acao, e a redacao de CA-11.2 vai para quem decide. Mesmo precedente de T017 com
 * CA-8.4 contra BR-MIGRAR-090.
 *
 * ---
 *
 * # 🔴 O ator NUNCA tem o proprio papel trocado por esta acao
 *
 * Os dois ramos do bloco de si mesmo terminam em `continue`
 * (`users.php:153` e `:157`), e `$user->set_role()` esta **depois** deles. Logo:
 *
 * - papel novo **com** `promote_users`: salta em silencio, aviso fica `promote`;
 * - papel novo **sem** `promote_users`: salta, e o aviso vira `err_admin_role`.
 *
 * Nos dois casos o papel do ator fica como estava — e e o proprio bilhete da tela
 * que confirma, por extenso: *"Your role was not changed."* E assim que CA-11.6
 * se cumpre nesta acao, e e o unico mecanismo que a cumpre: **nao existe, no
 * legado, nenhuma contagem global de quem pode promover**. A unica trava e esta,
 * e UC-24 chama isso de *"a unica trava contra travar o site e um comentario de
 * uma linha"*.
 *
 * ⚠️ **Nao foi acrescentada contagem nenhuma.** Verificar "ainda ha alguem que
 * promove" ao fim da operacao seria introduzir uma regra que o legado nao tem, e o
 * **P6** proibe: *"onde o legado nao tem numero, o sistema novo tambem nao tem"*.
 * A invariante de CA-11.6 e **consequencia** da trava, e esta afirmada por teste
 * como consequencia, nao como verificacao.
 *
 * ⚠️ E note o que a trava **nao** protege: nada impede o ator de rebaixar **outro**
 * administrador ao papel mais fraco. UC-24 nomeia o limite — *"a regra esta na
 * tela, nao no modelo de autorizacao: outra entrada que chame a troca de papel
 * direto nao a aplica"* — e `papel-da-conta.ts`, que e essa outra entrada, nao a
 * aplica mesmo.
 */

import {
  perguntarPermissao,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';
import type { ContextoDaAdministracaoDeContas } from './contexto-de-administracao.js';
import {
  AVISOS_DA_ADMINISTRACAO,
  RECUSAS_DA_ADMINISTRACAO,
  type AvisoDaAdministracao,
  type RecusaDaAdministracao,
} from './mensagens-da-administracao.js';
import {
  CAPACIDADE_QUE_O_PROPRIO_PAPEL_PRECISA_CONSERVAR,
  contaEhMembroDoSite,
  definirPapel,
  type ResultadoDaDefinicaoDePapel,
} from './papel-da-conta.js';
import {
  PAPEL_DE_NENHUM_PAPEL,
  papeisEditaveis,
  papelConcede,
  papelEhFalsoNoLegado,
} from './papeis-editaveis.js';
import { autorizacaoDoAtor, podeSobreConta } from './permissao-sobre-conta.js';

/** `promote_users` — a capacidade da **acao** (`users.php:113`). */
const CAPACIDADE_DA_ACAO = 'promote_users';

/** `promote_user` — a meta-capacidade sobre **aquela** conta (`users.php:142`). */
const CAPACIDADE_SOBRE_A_CONTA = 'promote_user';

/**
 * `manage_network_users` — a segunda metade da trava de CA-11.4, em rede.
 *
 * `users.php:152`: `$wp_roles->role_objects[ $role ]->has_cap( 'promote_users' )
 * || ( is_multisite() && current_user_can( 'manage_network_users' ) )`. Quem
 * administra contas da rede pode se rebaixar a qualquer papel — porque o poder
 * dele nao vem do papel do site.
 */
const CAPACIDADE_DE_REDE_QUE_DISPENSA_A_TRAVA = 'manage_network_users';

/** O que se pede: as contas e o papel novo. */
export interface PedidoDePromocaoDeContas {
  /** Os identificadores, na ordem em que a tela os enviou. A ordem decide. */
  readonly contas: readonly number[];
  /**
   * O papel pedido, como a tela o enviou.
   *
   * {@link PAPEL_DE_NENHUM_PAPEL} e aceito e traduzido para cadeia vazia, como
   * em `users.php:134`. Cadeia vazia **direta** e recusada no ramo 3, porque
   * `! $role` e verdadeiro antes da traducao.
   */
  readonly papel: string;
}

/** Uma conta que teve o papel definido. */
export interface ContaComPapelDefinido {
  readonly contaId: number;
  readonly definicao: ResultadoDaDefinicaoDePapel;
}

/** Por que uma conta foi saltada no lote. */
export type MotivoDeSaltoNaPromocao =
  /** E a conta do ator, e o papel novo conserva `promote_users`. */
  | 'propria-conta'
  /** E a conta do ator, e o papel novo **nao** conserva `promote_users` (CA-11.4). */
  | 'propria-conta-sem-promocao';

/** Uma conta saltada, com o motivo. */
export interface ContaSaltadaNaPromocao {
  readonly contaId: number;
  readonly motivo: MotivoDeSaltoNaPromocao;
}

/** Como a operacao terminou. */
export type DesfechoDaPromocao =
  /** O lote percorreu a lista inteira. */
  | 'concluido'
  /** Lista vazia: o legado so redireciona (ramo 2). */
  | 'nenhuma-conta-escolhida'
  | 'promover_acao'
  | 'papel_nao_editavel'
  | 'promover_alvo'
  | 'remocao_do_proprio_papel'
  | 'conta_fora_do_site';

/**
 * O que a promocao informa de volta.
 *
 * **Nao lanca.** A recusa volta como valor pelo mesmo motivo de `autenticar` e de
 * `cadastrar`: os contratos de `plan.md` chamam a falha desta familia de *"estado
 * reportavel e nao excecao"*. Quem transforma {@link recusa} em resposta HTTP e a
 * borda, que e onde o `wp_die` do legado vive.
 */
export interface ResultadoDaPromocaoDeContas {
  readonly desfecho: DesfechoDaPromocao;
  /** A recusa que parou a requisicao, ou `null` quando nao houve. */
  readonly recusa: RecusaDaAdministracao | null;
  /** O papel efetivamente pedido, ja com `none` traduzido para cadeia vazia. */
  readonly papel: string;
  /** O `$update` do redirecionamento, ou `null` quando a requisicao parou antes. */
  readonly aviso: AvisoDaAdministracao | null;
  /**
   * As contas gravadas **ate aqui**, inclusive quando houve recusa no meio.
   *
   * Ver o paragrafo sobre BR-MIGRAR-104 no cabecalho: o estado parcial e a regra.
   */
  readonly alteradas: readonly ContaComPapelDefinido[];
  readonly saltadas: readonly ContaSaltadaNaPromocao[];
}

/**
 * Promove, rebaixa ou tira o papel das contas escolhidas (US-11).
 *
 * **Permissao exigida: `promote_users` para a acao e `promote_user` para cada
 * conta alvo**, nessa ordem, e a declaracao e o ponto (**P4**). As duas sao do
 * legado: a primeira em `users.php:113`, a segunda em `:142`, e UC-24 as separa
 * nos passos 3 e 4. O nonce `bulk-users` do passo 3 nao e deste pacote — ver
 * `permissao-sobre-conta.ts`.
 */
export function promoverContas(
  pedido: PedidoDePromocaoDeContas,
  contexto: ContextoDaAdministracaoDeContas,
): ResultadoDaPromocaoDeContas {
  const autorizacao = autorizacaoDoAtor(contexto);
  const matriz: MatrizDePapeis = contexto.base.matriz;
  const alteradas: ContaComPapelDefinido[] = [];
  const saltadas: ContaSaltadaNaPromocao[] = [];

  function parar(
    desfecho: DesfechoDaPromocao,
    recusa: RecusaDaAdministracao | null,
    papel: string,
    aviso: AvisoDaAdministracao | null,
  ): ResultadoDaPromocaoDeContas {
    return { desfecho, recusa, papel, aviso, alteradas, saltadas };
  }

  // Ramo 1: a capacidade da ACAO, e ela NAO leva objeto — e o que a separa da
  // pergunta do ramo 4.
  if (!perguntarPermissao(autorizacao, CAPACIDADE_DA_ACAO)) {
    return parar(
      'promover_acao',
      RECUSAS_DA_ADMINISTRACAO.promover_acao,
      pedido.papel,
      null,
    );
  }

  // Ramo 2: lista vazia. O legado redireciona sem `update`, logo sem aviso.
  if (pedido.contas.length === 0) {
    return parar('nenhuma-conta-escolhida', null, pedido.papel, null);
  }

  // Ramo 3: o papel pedido. `none` entra na lista DEPOIS do ponto de extensao.
  const editaveis = [
    ...papeisEditaveis(matriz, contexto.ganchos),
    PAPEL_DE_NENHUM_PAPEL,
  ];
  if (
    papelEhFalsoNoLegado(pedido.papel) ||
    !editaveis.includes(pedido.papel)
  ) {
    return parar(
      'papel_nao_editavel',
      RECUSAS_DA_ADMINISTRACAO.papel_nao_editavel,
      pedido.papel,
      null,
    );
  }

  const papel = pedido.papel === PAPEL_DE_NENHUM_PAPEL ? '' : pedido.papel;
  let aviso: AvisoDaAdministracao = AVISOS_DA_ADMINISTRACAO.promocao;

  for (const contaId of pedido.contas) {
    // Ramo 4: a capacidade sobre AQUELA conta (CA-11.1). Falha PARA o lote.
    if (!podeSobreConta(autorizacao, CAPACIDADE_SOBRE_A_CONTA, contaId)) {
      return parar(
        'promover_alvo',
        RECUSAS_DA_ADMINISTRACAO.promover_alvo,
        papel,
        aviso,
      );
    }

    if (contaId === contexto.ator.contaId) {
      // Ramo 5: CA-11.5, a recusa explicita de tirar o proprio papel.
      if (papel === '') {
        return parar(
          'remocao_do_proprio_papel',
          RECUSAS_DA_ADMINISTRACAO.remocao_do_proprio_papel,
          papel,
          aviso,
        );
      }

      // Ramo 6: CA-11.4 e CA-11.6. Os dois lados saltam; muda so o aviso.
      if (
        papelConcede(
          matriz,
          papel,
          CAPACIDADE_QUE_O_PROPRIO_PAPEL_PRECISA_CONSERVAR,
          contexto.ganchos,
        ) ||
        (contexto.base.rede.ativa &&
          perguntarPermissao(
            autorizacao,
            CAPACIDADE_DE_REDE_QUE_DISPENSA_A_TRAVA,
          ))
      ) {
        saltadas.push({ contaId, motivo: 'propria-conta' });
        continue;
      }

      aviso = AVISOS_DA_ADMINISTRACAO.papel_proprio_recusado;
      saltadas.push({ contaId, motivo: 'propria-conta-sem-promocao' });
      continue;
    }

    // Ramo 7: em rede, a conta precisa pertencer a este site. Falha PARA o lote.
    if (
      contexto.base.rede.ativa &&
      !contaEhMembroDoSite(
        { perfil: contexto.armazenamento.perfil, chaves: contexto.chaves },
        contaId,
      )
    ) {
      return parar(
        'conta_fora_do_site',
        RECUSAS_DA_ADMINISTRACAO.conta_fora_do_site,
        papel,
        aviso,
      );
    }

    // Ramo 8: a escrita. Papel vazio tira todos os papeis sem por nenhum.
    alteradas.push({
      contaId,
      definicao: definirPapel(
        {
          papeis: contexto.armazenamento.papeis,
          perfil: contexto.armazenamento.perfil,
          chaves: contexto.chaves,
        },
        matriz,
        contaId,
        papel,
        contexto.ganchos,
      ),
    });
  }

  return parar('concluido', null, papel, aviso);
}
