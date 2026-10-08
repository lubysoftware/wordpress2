/**
 * A revogacao da credencial de aplicacao: US-10, e os critérios CA-10.3 e CA-10.4.
 *
 * O fluxo e o alternativo *Revogar uma senha* de UC-22, nas duas linhas que ele
 * tem:
 *
 * | passo de UC-22 | aqui | critério |
 * |---|---|---|
 * | — (a mesma guarda do fluxo principal) | `perguntarPermissao` sobre `delete_app_password` | CA-10.4 |
 * | 1. sistema apaga o item do metadado | `contexto.credenciais.gravar` sem o item | CA-10.3 |
 * | 2. as chamadas em curso que a usavam param de autenticar na requisicao seguinte | — (e UC-23, `REQ-012`) | CA-10.3 |
 *
 * 🔴 **O passo 2 nao e verificavel neste pacote, e isso esta registrado desde a
 * `spec.md`.** Quem autentica com a credencial e `REQ-012`, que *"ficou na coluna
 * refinamento e nao entrou neste pacote"* — e a segunda *Pergunta em aberto* da
 * spec e exatamente esta: *"construir a emissao sem o consumo, ou esperar
 * REQ-012?"*. A pergunta e de uma pessoa, nao desta tarefa, e `tasks.md` mandou
 * construir: T021 existe e T022 tem os testes dela. O que esta tarefa **pode**
 * garantir de CA-10.3, e garante por teste, e a metade que o pacote lhe deu: depois
 * da revogacao **nao sobra, no que esta gravado, resumo nenhum daquela credencial**
 * — logo nao existe valor contra o qual a chamada seguinte pudesse conferir. A
 * outra metade — *"deixa de autenticar"* — fecha quando `REQ-012` existir, e e por
 * isso que o risco 2 do `plan.md` esta escrito.
 *
 * **Autorizacao, declarada como o P4 exige: `edit_user` daquela conta.** A mesma do
 * fluxo principal, e UC-22 e explicito no fluxo alternativo *"Administrador
 * gerencia a senha de outro"*: *"a capacidade exigida continua sendo `edit_user`
 * daquele usuario"*. A capacidade **pedida** e `delete_app_password`, que e a que o
 * legado pergunta para a credencial unica — a outra, a do conjunto, pertence a
 * operacao de apagar todas, que esta tarefa nao recebeu.
 */

import { perguntarPermissao } from '../../../plataforma/autorizacao/index.js';
import {
  lerCamposDeSenhaDeAplicacao,
  type CamposDeSenhaDeAplicacao,
  type RegistroDeSenhaDeAplicacao,
} from '../armazenamento/senha-de-aplicacao.js';
import type { ContextoDeSenhaDeAplicacao } from './contexto-de-senha-de-aplicacao.js';
import {
  erroDeGravacaoDaRevogacao,
  erroDeSenhaDeAplicacao,
  type ErroDeSenhaDeAplicacao,
} from './erro-de-senha-de-aplicacao.js';

/** A capacidade que a revogacao pergunta. Ver `./autorizacao-de-senha-de-aplicacao.ts`. */
export const CAPACIDADE_DE_REVOGACAO = 'delete_app_password';

export interface PedidoDeRevogacao {
  /** A conta **alvo** — ver a ressalva em `PedidoDeEmissao`. */
  readonly contaId: number;
  /** O `uuid` da credencial, que e o *"identificador da credencial"* do contrato. */
  readonly identificador: string;
}

export type ResultadoDaRevogacao =
  | {
      readonly revogada: true;
      /**
       * O item apagado, como ele estava gravado.
       *
       * Devolvido porque e o que o legado entrega ao ponto de extensao, e porque e
       * a **unica** confirmacao que a operacao tem para dar: a tabela *Contratos*
       * do `plan.md` diz *"confirmacao"* e nada mais.
       */
      readonly credencial: CamposDeSenhaDeAplicacao;
    }
  | { readonly revogada: false; readonly motivo: 'sem-permissao' }
  | {
      readonly revogada: false;
      readonly motivo: 'recusada';
      readonly erro: ErroDeSenhaDeAplicacao;
    };

/**
 * Revoga a credencial daquela conta.
 *
 * A ordem, que e a do legado:
 *
 * 1. a permissao, **antes** de procurar o item — logo quem nao pode editar a conta
 *    nao descobre, pela resposta, se aquele identificador existe;
 * 2. a busca pelo identificador, com comparacao **estrita**;
 * 3. a gravacao da lista sem o item, **sem reindexar as outras** — ver
 *    `proximaChaveDaLista` em `../armazenamento/senha-de-aplicacao.ts`, onde esta a
 *    duvida que fecha contra o oraculo;
 * 4. o ponto de extensao, depois de a credencial ja nao existir.
 */
export function revogarCredencialDeAplicacao(
  pedido: PedidoDeRevogacao,
  contexto: ContextoDeSenhaDeAplicacao,
): ResultadoDaRevogacao {
  // 1. A permissao, a mesma de editar aquela conta (CA-10.4).
  if (
    !perguntarPermissao(
      contexto.autorizacao,
      CAPACIDADE_DE_REVOGACAO,
      pedido.contaId,
    )
  ) {
    return { revogada: false, motivo: 'sem-permissao' };
  }

  const registros = contexto.credenciais.obter(pedido.contaId);

  // 2. A busca. O legado compara o identificador gravado com o pedido de forma
  //    estrita, e um item sem identificador nunca casa.
  const restantes: RegistroDeSenhaDeAplicacao[] = [];
  let apagada: CamposDeSenhaDeAplicacao | null = null;

  for (const registro of registros) {
    const campos = lerCamposDeSenhaDeAplicacao(registro.campos);
    if (apagada === null && campos.identificador === pedido.identificador) {
      apagada = campos;
      continue;
    }
    restantes.push(registro);
  }

  if (apagada === null) {
    return {
      revogada: false,
      motivo: 'recusada',
      erro: erroDeSenhaDeAplicacao('application_password_not_found'),
    };
  }

  // 3. A gravacao da lista sem o item. Lista vazia grava o arranjo vazio, e nao
  //    apaga a linha de metadado — ver a ressalva do repositorio.
  if (!contexto.credenciais.gravar(pedido.contaId, restantes)) {
    return {
      revogada: false,
      motivo: 'recusada',
      erro: erroDeGravacaoDaRevogacao(),
    };
  }

  // 4. O ponto de extensao, com o item que acabou de deixar de existir — na forma
  //    em que ele estava gravado, e nao numa forma completada.
  contexto.ganchos?.aoRevogarCredencial?.(pedido.contaId, apagada);

  return { revogada: true, credencial: apagada };
}
