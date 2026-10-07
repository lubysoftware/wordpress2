/**
 * A chave de redefinicao: o `VO-ChaveDeAtivacao` na forma que o *reset* de senha
 * usa, com o prazo de **24 horas** e a conferencia dele.
 *
 * `target_domain_model.md` avisa que o nome do value object esconde tres coisas
 * incompativeis no mesmo sistema: *"reset de senha com **24 h**, confirmacao de
 * privacidade com hash e 24 h, ativacao de cadastro em rede **sem prazo**"*.
 * Este arquivo e **so** a primeira, e por isso ele mora no modulo de identidade
 * e nao numa abstracao de chave: unificar as tres apagaria a diferenca que o
 * documento registra.
 *
 * **A chave e um dos cinco atestados que decidem acesso sem consultar
 * capacidade** (constituicao P4, `permissions.md` §9, BR-MIGRAR-098). UC-20 e
 * literal: *"a posse do e-mail e a autorizacao — nao ha capacidade envolvida"*.
 * O P4 manda declarar isso explicitamente, e e por isso que a declaracao aparece
 * aqui, na operacao e na interface do modulo: uma matriz que ignore os cinco
 * *"descreve um sistema mais fechado do que o real"*.
 *
 * ---
 *
 * **Duas coisas chegam por argumento porque o pacote nao as registra, e inventa-
 * las seria inventar comportamento (P1, P6).**
 *
 * 1. **Como a chave em claro e gerada** — comprimento e alfabeto. O pacote fixa
 *    o comprimento de **uma** credencial desta feature, a senha de aplicacao
 *    (24 caracteres, `U6`/BR-MIGRAR-026), e **nao** fixa o desta. O P6 recusa
 *    *"numero que o legado nao tem"*, e T007 ja registrou a outra metade da
 *    mesma regra: numero que o **pacote** nao registra tambem nao entra.
 * 2. **Com qual funcao a chave e resumida.** CA-4.1 fixa que ela e *"guardada
 *    com hash na conta"* e o modelo de dados fixa o formato gravado — o instante
 *    prefixado —, mas nenhum documento nomeia o algoritmo. No legado ele e um
 *    objeto de *hash* **registrado globalmente**, logo e um dos 42 pontos de
 *    substituicao de BR-MIGRAR-103 (`EXT-SUBST`), e nao a mesma funcao que
 *    confere a senha da conta: `plan.md` escolhe o slot `hash-de-senha` para
 *    aquela, e `parity_specs.md` poe essa borda entre as cinco que *"sao
 *    trocadas de qualquer forma"*.
 *
 * O que **e** deste arquivo, e esta aqui inteiro: o formato gravado, o prazo, a
 * ordem dos ramos de conferencia e qual codigo sai de cada um.
 */

import { SEGUNDOS_POR_HORA } from '../autenticacao/prazos-de-sessao.js';

/**
 * O prazo da chave, no valor de fabrica do legado: 24 horas.
 *
 * Ponto de configuracao nomeado, como o P6 exige — *"cada numero vive num ponto
 * de configuracao nomeado, com o valor de fabrica do legado, e existe teste que
 * afirma o valor e o efeito da borda (no ultimo instante aceita, um instante
 * depois recusa)"*. O teste de borda esta na suite desta tarefa.
 *
 * **E filtravel**, e por isso `conferirChaveDeRedefinicao` o recebe por
 * argumento em vez de ler a constante direto: BR-MIGRAR-108 (`ESC-FILTRAVEL`)
 * poe no contrato que *"toda regra deste catalogo e um default FILTRAVEL, e
 * preservar isso e o porte"*, e no legado o prazo passa por um ponto de extensao
 * proprio antes de ser comparado.
 *
 * Esta escrito `24 * hora` porque e assim que a spec o declara — *"valida por 24
 * horas"*, CA-4.2, BR-MIGRAR-024. O legado chega ao mesmo numero pela constante
 * de dia; o valor e o mesmo e a redacao segue o pacote.
 */
export const PRAZO_DA_CHAVE_DE_REDEFINICAO_DE_FABRICA = 24 * SEGUNDOS_POR_HORA;

/**
 * O separador entre o instante do pedido e o resumo, dentro de
 * `users.user_activation_key`.
 *
 * 🟢 O formato esta registrado em dois lugares do pacote: `plan.md`, secao
 * *Modelo de dados*, descreve a coluna como *"`user_activation_key` com o
 * instante prefixado"*, e `target_data_model.md` a declara `varchar(255) NOT
 * NULL default ''` — logo **a ausencia de chave e a sentinela vazia, nao `NULL`**
 * (`DB-SENT`).
 */
export const SEPARADOR_DO_INSTANTE = ':';

/**
 * Como a chave em claro e gerada.
 *
 * Nao tem valor de fabrica de proposito — ver o item 1 do cabecalho. E tambem
 * uma primitiva de borda: a aleatoriedade do legado tem semeadura propria, e
 * AD-04 poe borda em `adaptadores/`.
 */
export interface GeradorDeChaveDeRedefinicao {
  /** Devolve a chave em claro, que **so** pode acabar no e-mail (CA-4.1). */
  gerar(): string;
}

/**
 * Com que funcao a chave e resumida para ser gravada, e conferida na volta.
 *
 * Um dos 42 pontos de substituicao de BR-MIGRAR-103: no legado e um objeto
 * registrado que qualquer extensao substitui antes do primeiro uso. Sincrono por
 * AD-04.
 */
export interface HashDeChaveDeRedefinicao {
  /** O resumo a gravar. A chave em claro nao e devolvida a lugar nenhum. */
  gerar(chaveEmClaro: string): string;
  /** Confere a chave apresentada contra o resumo gravado. */
  conferir(chaveEmClaro: string, resumoGravado: string): boolean;
}

/**
 * O valor a gravar em `users.user_activation_key`: o instante do pedido, o
 * separador, e o resumo.
 *
 * O instante e em **segundos inteiros UTC**, que e a unidade da
 * `PortaDeRelogio` e a unidade em que o legado faz esta aritmetica — expor
 * milissegundo seria inventar precisao que o produto nao tem.
 */
export function valorGravadoDaChave(
  instanteDoPedidoEmSegundos: number,
  resumo: string,
): string {
  return `${instanteDoPedidoEmSegundos}${SEPARADOR_DO_INSTANTE}${resumo}`;
}

/** O que a coluna guarda, depois de separada. */
export interface ChaveGravada {
  /**
   * O instante do pedido, ou `null` quando o valor gravado **nao** tem instante
   * prefixado.
   *
   * O ramo sem instante nao e hipotese: ele existe no legado e tem codigo
   * proprio de recusa (ver `conferirChaveDeRedefinicao`). Numa instalacao nova
   * ele nao e alcancavel — `plan.md` fixa que *"nada vem do sistema velho"* —,
   * e e exatamente o mesmo caso do verificador de *hash* portavel antigo que
   * T003 deixou declarado e sem caminho.
   */
  readonly instanteDoPedido: number | null;
  readonly resumo: string;
}

/**
 * Separa o valor gravado. Devolve `null` para a sentinela vazia, que e o que a
 * coluna guarda quando **nao ha chave pendente** — inclusive depois de a chave
 * ter sido usada (CA-4.4) e depois do primeiro login bem-sucedido
 * (BR-MIGRAR-024, CA-1.4, que T003 implementa).
 */
export function lerChaveGravada(valorGravado: string): ChaveGravada | null {
  if (valorGravado === '') {
    return null;
  }

  const posicao = valorGravado.indexOf(SEPARADOR_DO_INSTANTE);
  if (posicao === -1) {
    return { instanteDoPedido: null, resumo: valorGravado };
  }

  const prefixo = valorGravado.slice(0, posicao);
  const resumo = valorGravado.slice(posicao + SEPARADOR_DO_INSTANTE.length);
  const instante = Number(prefixo);

  return {
    // Prefixo que nao e numero conta como instante zero, e portanto vence: e o
    // que a aritmetica do legado produz sobre um prefixo nao numerico. Nao e
    // caminho de produto — e so a recusa de um valor corrompido.
    instanteDoPedido: Number.isFinite(instante) ? instante : 0,
    resumo,
  };
}

/** O resultado da conferencia. Recusa e **valor**, nunca excecao. */
export type ConferenciaDaChave =
  | { readonly valida: true; readonly instanteDoPedido: number }
  | { readonly valida: false; readonly codigo: 'invalid_key' | 'expired_key' };

/** O que `conferirChaveDeRedefinicao` precisa para decidir. */
export interface ConferenciaPedida {
  /** A chave em claro que o titular apresentou (campo `rp_key` de `SCR-003`). */
  readonly chaveEmClaro: string;
  /** O conteudo de `users.user_activation_key` daquela conta. */
  readonly valorGravado: string;
  readonly agoraEmSegundos: number;
  readonly hash: HashDeChaveDeRedefinicao;
  /** O prazo. Omitido, vale o de fabrica: 24 horas. */
  readonly prazo?: number;
}

/**
 * Confere a chave e o prazo — o passo 5 de UC-20, e os critérios CA-4.2, CA-4.4
 * e CA-4.5.
 *
 * **A ordem dos ramos e o que decide qual codigo sai**, e os dois codigos levam
 * a telas diferentes (`DESTINO_POR_CODIGO_DE_CHAVE`). Na ordem do legado:
 *
 * | # | situacao | codigo |
 * |---|---|---|
 * | 1 | chave apresentada vazia | `invalid_key` |
 * | 2 | nada gravado, ou resumo gravado vazio — inclusive **chave ja usada** | `invalid_key` |
 * | 3 | resumo confere, ha instante, e o prazo nao esgotou | **valida** |
 * | 4 | resumo confere, ha instante, e o prazo esgotou | `expired_key` |
 * | 5 | valor gravado igual a chave apresentada, ou resumo confere **sem** instante | `expired_key` |
 * | 6 | qualquer outro caso | `invalid_key` |
 *
 * **O ramo 2 e o que faz CA-4.4 valer na volta.** Gravar a senha nova apaga a
 * coluna no mesmo comando; a chave usada cai aqui e sai como `invalid_key`, que
 * e o **erro generico** de CA-4.5. `plan.md` lista *"chave ja usada"* como erro
 * proprio desta operacao, e o legado **nao lhe da codigo proprio**: ele nao tem
 * como distinguir "usada" de "nunca existiu", porque o que sobrou da chave usada
 * e a sentinela vazia. Dar-lhe codigo proprio diria ao visitante algo que o
 * legado nao diz, e o P1 poe isso fora do alcance desta tarefa; a divergencia de
 * contagem fica registrada aqui, como a dos codigos de erro da entrada ficou em
 * `erro-de-autenticacao.ts`.
 *
 * ⚠️ **O ultimo instante, e o unico ponto deste arquivo que o oraculo fecha.** A
 * comparacao e **estrita**: aceita enquanto `agora < instante + prazo`, logo o
 * ultimo instante aceito e `instante + prazo - 1`. CA-4.2 cobra o lado que
 * importa — *"chave com **mais de** 24 horas e recusada"* — e nao se pronuncia
 * sobre o instante exato do prazo; e a borda da sessao, em
 * `../sessao/expiracao-de-sessao.ts`, usa a comparacao do **outro** lado, porque
 * lá o legado compara o prazo gravado com `agora` na ordem inversa. Sao dois
 * numeros iguais com uma unidade de diferenca na borda, e o pacote registra um
 * so deles. Aqui esta implementado o ramo estrito, com teste nas duas pontas,
 * para que a eventual diferenca apareca no teste em vez de desaparecer no
 * codigo.
 */
export function conferirChaveDeRedefinicao(
  pedida: ConferenciaPedida,
): ConferenciaDaChave {
  const prazo = pedida.prazo ?? PRAZO_DA_CHAVE_DE_REDEFINICAO_DE_FABRICA;

  // 1. Chave vazia. A chave chega como o titular a apresentou: qual
  //    canonicalizacao ela sofre antes da conferencia **nao esta registrada no
  //    pacote**, e supor uma amarraria o alfabeto do gerador, que tambem nao
  //    esta registrado (ver o cabecalho). Fica para o oraculo.
  if (pedida.chaveEmClaro === '') {
    return { valida: false, codigo: 'invalid_key' };
  }

  // 2. Nada gravado, ou resumo vazio: e o caso da chave ja usada.
  const gravada = lerChaveGravada(pedida.valorGravado);
  if (gravada === null || gravada.resumo === '') {
    return { valida: false, codigo: 'invalid_key' };
  }

  const resumoConfere = pedida.hash.conferir(
    pedida.chaveEmClaro,
    gravada.resumo,
  );

  if (gravada.instanteDoPedido !== null) {
    // 3 e 4: com instante, o prazo decide.
    if (resumoConfere) {
      const vencimento = gravada.instanteDoPedido + prazo;
      if (pedida.agoraEmSegundos < vencimento) {
        return { valida: true, instanteDoPedido: gravada.instanteDoPedido };
      }
      return { valida: false, codigo: 'expired_key' };
    }
  } else if (resumoConfere) {
    // 5, segunda metade: resumo confere e nao ha instante — a chave e de um
    // formato que o legado trata como vencido por nao ter prazo nenhum.
    return { valida: false, codigo: 'expired_key' };
  }

  // 5, primeira metade: valor gravado em claro, igual a chave apresentada. Nao e
  // caminho de instalacao nova (nada vem do sistema velho), e esta aqui porque
  // o P8 nao deixa nada sair da superficie por conta propria.
  if (pedida.valorGravado === pedida.chaveEmClaro) {
    return { valida: false, codigo: 'expired_key' };
  }

  // 6.
  return { valida: false, codigo: 'invalid_key' };
}
