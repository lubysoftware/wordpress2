/**
 * A emissao da credencial de aplicacao: US-10, e os critérios CA-10.1, CA-10.2,
 * CA-10.4 e CA-10.5.
 *
 * O fluxo e o de UC-22, passo por passo e **na ordem dele**:
 *
 * | passo de UC-22 | aqui | critério |
 * |---|---|---|
 * | 1. assinante pede uma senha de aplicacao com um nome descritivo | `emitirCredencialDeAplicacao` | — |
 * | 2. sistema verifica a capacidade de editar aquela conta | `perguntarPermissao` sobre `create_app_password` | CA-10.4 |
 * | 3. sistema gera 24 caracteres e guarda apenas o hash no metadado da conta | `gerarSenhaDeAplicacao` e `contexto.resumo` | CA-10.1, CA-10.5 |
 * | 4. sistema exibe a senha em claro **uma unica vez** | o campo `segredo` do resultado | CA-10.2 |
 * | 5. assinante guarda a senha no programa que vai usa-la | — (e UC-23, `REQ-012`) | — |
 *
 * **Autorizacao desta operacao, declarada como o P4 exige: `edit_user` daquela
 * conta — e esta e a primeira operacao deste modulo que exige capacidade.** A linha
 * *Autorizacao* de UC-22 e literal: *"`edit_user` daquele usuario. As seis
 * capacidades de senha de aplicacao resolvem todas para isso: quem pode editar a
 * conta administra as credenciais dela"*. A capacidade **pedida** e
 * `create_app_password`, e nao `edit_user`, porque e ela que o legado pergunta e e
 * ela que o interceptador de `user_has_cap` ve passar: perguntar `edit_user` direto
 * daria o mesmo resultado hoje e tiraria da extensao a informacao de **o que** esta
 * sendo autorizado. Quem traduz uma na outra e
 * `./autorizacao-de-senha-de-aplicacao.ts`.
 *
 * **O que esta operacao nao faz, e por que.**
 *
 * - **Nao exige conexao segura.** E a segunda pre-condicao de UC-22, e ela e da
 *   camada de rota — ver a PARADA no cabecalho de
 *   `./contexto-de-senha-de-aplicacao.ts`, com a consequencia declarada.
 * - **Nao renomeia, nao lista e nao revoga em lote.** `tasks.md` da a T021
 *   *"emitir e revogar"*, no singular, e a tabela *Contratos* de `plan.md` lista
 *   exatamente estas duas operacoes. Editar o nome de uma credencial, apagar
 *   **todas** de uma conta e registrar o uso continuam sendo superficie do legado
 *   que este pacote nao recebeu — nao sairam de lugar nenhum (**P8**), nao foram
 *   construidas, e o lugar delas e este arquivo e o vizinho.
 * - **Nao conta tentativa e nao limita taxa.** `REQ-160` esta em
 *   `do-not-rewrite.md` e o **P6** poe limite de taxa fora do nucleo.
 * - **Nao da escopo nem prazo a credencial.** `permissions.md` §8.2 e UC-22 dizem o
 *   que isso custa — *"um programa com a senha de aplicacao de um administrador e
 *   um administrador"* —, e a terceira *Pergunta em aberto* da `spec.md` poe a
 *   decisao de dar escopo fora do alcance de quem codifica: *"dar escopo e
 *   divergencia do identico e exige decisao humana registrada (P1)"*. A credencial
 *   nasce sem escopo e sem prazo, como no legado.
 */

import { perguntarPermissao } from '../../../plataforma/autorizacao/index.js';
import {
  camposGravaveisDeSenhaDeAplicacao,
  lerCamposDeSenhaDeAplicacao,
  proximaChaveDaLista,
  type CamposGravaveisDeSenhaDeAplicacao,
  type RegistroDeSenhaDeAplicacao,
} from '../armazenamento/senha-de-aplicacao.js';
import type { ContextoDeSenhaDeAplicacao } from './contexto-de-senha-de-aplicacao.js';
import {
  erroDeSenhaDeAplicacao,
  type ErroDeSenhaDeAplicacao,
} from './erro-de-senha-de-aplicacao.js';
import {
  gerarSenhaDeAplicacao,
  IDENTIFICADOR_DO_RUNTIME,
} from './geracao-de-credencial.js';

/** A capacidade que a emissao pergunta. Ver `./autorizacao-de-senha-de-aplicacao.ts`. */
export const CAPACIDADE_DE_EMISSAO = 'create_app_password';

/**
 * O que o titular — ou quem administra a conta dele — envia.
 *
 * `contaId` e a conta **alvo**, e nao quem pergunta: quem pergunta esta no contexto
 * de autorizacao. Os dois sao o mesmo no fluxo principal de UC-22, e sao diferentes
 * no fluxo alternativo *"Administrador gerencia a senha de outro"* — e e essa
 * diferenca que CA-10.4 cobra.
 */
export interface PedidoDeEmissao {
  readonly contaId: number;
  /** O nome descritivo (CA-10.5). Obrigatorio no legado, e vazio e recusa. */
  readonly nome: string;
  /**
   * O identificador que a aplicacao informa de si.
   *
   * Omitido, vale o texto vazio, que e o valor de fabrica do legado — e o campo e
   * gravado de todo jeito, com o vazio dentro. Ver a ressalva sobre os sete campos
   * em `../armazenamento/senha-de-aplicacao.ts`.
   */
  readonly aplicacaoId?: string;
}

export type ResultadoDaEmissao =
  | {
      readonly emitida: true;
      /**
       * O segredo em claro, **a unica vez em que ele existe** (CA-10.2).
       *
       * Nao esta gravado, nao e recuperavel e nao volta de nenhuma leitura: o que
       * o metadado guarda e o resumo. A excecao de UC-22 e a consequencia disto —
       * *"senha perdida depois da exibicao: nao ha recuperacao. A unica saida e
       * revogar e emitir outra"*. Quem exibe decide se agrupa o segredo, com
       * `agruparSenhaDeAplicacao`.
       */
      readonly segredo: string;
      /** O item gravado, sem o segredo. */
      readonly credencial: CamposGravaveisDeSenhaDeAplicacao;
    }
  | {
      /**
       * Sem permissao de editar aquela conta (CA-10.4).
       *
       * Volta como **motivo**, e nao como codigo de erro, porque no legado quem
       * recusa e a camada de rota e e dela o codigo. Ver o cabecalho de
       * `./erro-de-senha-de-aplicacao.ts`.
       */
      readonly emitida: false;
      readonly motivo: 'sem-permissao';
    }
  | {
      readonly emitida: false;
      readonly motivo: 'recusada';
      readonly erro: ErroDeSenhaDeAplicacao;
    };

/**
 * O vazio do legado, que nao e o vazio deste runtime.
 *
 * A conferencia de nome usa o operador de vazio do PHP, e ele considera vazio
 * tambem o texto `'0'`. A consequencia e observavel: uma credencial chamada `0` e
 * recusada com `application_password_empty_name`, e uma chamada `00` e aceita.
 *
 * ⚠️ **O pacote nao registra isto** — nem CA-10.5, nem UC-22, nem `U6` falam do
 * nome vazio. Esta aqui porque o **P1** manda reproduzir o comportamento
 * observavel *"inclusive quando ele parecer defeito"*, e isolado numa funcao
 * nomeada para que a conferencia contra o oraculo (`ESC-ORACULO`) tenha **um**
 * lugar para corrigir.
 */
export function vazioComoNoLegado(texto: string): boolean {
  return texto === '' || texto === '0';
}

/**
 * A comparacao de nome do legado: **somente** as 26 letras, e nao a dobra de caixa
 * do Unicode.
 *
 * O legado compara os nomes em caixa baixa com a funcao de caixa do PHP, que e
 * independente de idioma e **so** alcança `A` a `Z`. A funcao equivalente deste
 * runtime alcança o Unicode inteiro, logo `MAÇÃ` e `maçã` seriam o mesmo nome aqui
 * e sao nomes diferentes la. Reproduzir a comparacao estreita e preservar quais
 * nomes a instalacao aceita como distintos.
 */
export function caixaBaixaComoNoLegado(texto: string): string {
  return texto.replace(/[A-Z]/g, (letra) => letra.toLowerCase());
}

/**
 * Ja existe credencial com aquele nome naquela conta?
 *
 * Compara contra **o que esta gravado**, item por item, como o legado faz — e nao
 * contra um indice, porque indice nenhum alcança o interior do valor serializado
 * (`PERM-2`, e a nota 1 do `plan.md`).
 */
export function nomeDeCredencialJaExiste(
  registros: readonly RegistroDeSenhaDeAplicacao[],
  nome: string,
): boolean {
  const procurado = caixaBaixaComoNoLegado(nome);
  for (const registro of registros) {
    const campos = lerCamposDeSenhaDeAplicacao(registro.campos);
    if (
      campos.nome !== null &&
      caixaBaixaComoNoLegado(campos.nome) === procurado
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Emite uma credencial de aplicacao para a conta alvo.
 *
 * A ordem dos passos e a do legado, e ela decide **qual** recusa o titular recebe
 * quando mais de uma vale:
 *
 * 1. a permissao, **antes** de qualquer conferencia do nome — logo quem nao pode
 *    editar a conta nao descobre, pela mensagem, se o nome que tentou ja existe;
 * 2. o saneamento do nome, aplicado **somente quando o nome nao esta vazio**;
 * 3. o nome vazio — inclusive o que ficou vazio no passo 2;
 * 4. o nome repetido;
 * 5. a geracao do segredo e o resumo dele;
 * 6. a gravacao, e **a falha de gravacao e recusa**, nao excecao;
 * 7. a marca de uso na instalacao, se houver colaborador;
 * 8. o ponto de extensao, **depois** de tudo e sem poder alterar nada.
 *
 * Trocar 2 e 3 de lugar mudaria a recusa de um nome que sanea para vazio; trocar 1
 * e 4 transformaria a operacao num oraculo de nomes para quem nao tem permissao.
 */
export function emitirCredencialDeAplicacao(
  pedido: PedidoDeEmissao,
  contexto: ContextoDeSenhaDeAplicacao,
): ResultadoDaEmissao {
  // 1. A permissao, e ela e a mesma de editar aquela conta (CA-10.4).
  if (
    !perguntarPermissao(
      contexto.autorizacao,
      CAPACIDADE_DE_EMISSAO,
      pedido.contaId,
    )
  ) {
    return { emitida: false, motivo: 'sem-permissao' };
  }

  // 2. O saneamento, e a guarda de vazio que o legado poe antes dele.
  const nome = vazioComoNoLegado(pedido.nome)
    ? pedido.nome
    : contexto.sanitizarTexto(pedido.nome);

  // 3. Nome vazio, inclusive o que ficou vazio no passo anterior.
  if (vazioComoNoLegado(nome)) {
    return {
      emitida: false,
      motivo: 'recusada',
      erro: erroDeSenhaDeAplicacao('application_password_empty_name'),
    };
  }

  const registros = contexto.credenciais.obter(pedido.contaId);

  // 4. Nome repetido na mesma conta.
  if (nomeDeCredencialJaExiste(registros, nome)) {
    return {
      emitida: false,
      motivo: 'recusada',
      erro: erroDeSenhaDeAplicacao('application_password_duplicate_name'),
    };
  }

  // 5. Os 24 caracteres, e so o resumo deles sobrevive a esta funcao (CA-10.1).
  const segredo = gerarSenhaDeAplicacao(contexto.aleatorio);
  const gerarIdentificador =
    contexto.gerarIdentificador ?? IDENTIFICADOR_DO_RUNTIME;

  const credencial: CamposGravaveisDeSenhaDeAplicacao = {
    identificador: gerarIdentificador(),
    aplicacaoId: pedido.aplicacaoId ?? '',
    nome,
    resumo: contexto.resumo.gerar(segredo),
    criadoEm: contexto.relogio.agoraEmSegundos(),
    // Nasce sem uso, e quem o escreve e `REQ-012`, que nao esta neste pacote
    // (CA-10.5, e o risco 2 de `plan.md`).
    ultimoUsoEm: null,
    ultimoIp: null,
  };

  // 6. A gravacao. A lista nova e a gravada mais o item, na chave seguinte — e
  //    nenhum item existente e reindexado nem reordenado.
  const gravou = contexto.credenciais.gravar(pedido.contaId, [
    ...registros,
    {
      chave: proximaChaveDaLista(registros),
      campos: camposGravaveisDeSenhaDeAplicacao(credencial),
    },
  ]);

  if (!gravou) {
    return {
      emitida: false,
      motivo: 'recusada',
      erro: erroDeSenhaDeAplicacao('db_error'),
    };
  }

  // 7. A marca de uso da instalacao: ler primeiro, gravar so se ainda nao estiver
  //    marcada. Omitido o colaborador, nada e escrito — ver a ressalva dele.
  const uso = contexto.usoNaInstalacao;
  if (uso !== undefined && !uso.estaEmUso()) {
    uso.marcarEmUso();
  }

  // 8. O ponto de extensao, com o segredo — e e o legado que o passa. Ver a
  //    ressalva em `GanchosDeSenhaDeAplicacao.aoEmitirCredencial`.
  contexto.ganchos?.aoEmitirCredencial?.(
    pedido.contaId,
    credencial,
    segredo,
    pedido,
  );

  return { emitida: true, segredo, credencial };
}
