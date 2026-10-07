/**
 * A chave de definicao de senha que acompanha a conta nova — `VO-ChaveDeAtivacao`
 * na forma de 24 horas, e so a **emissao** dela.
 *
 * > ⚠️ **US-4 / T009 e a dona deste assunto, e T009 nao fechou quando T013 foi
 * > escrita** (`tasks.md` poe *"depende de: T001, T002, T009"* e a linha de T009
 * > segue `[ ]`). Este arquivo e a **fatia minima** que CA-6.5 exige — emitir a
 * > chave, gravar o valor com o instante prefixado e montar o caminho que vai no
 * > e-mail — e e o mesmo movimento que T003 fez com `conta/leitura-de-conta.ts`
 * > enquanto T002 estava aberta. Quando T009 entrar, ela absorve este arquivo: a
 * > emissao e a mesma funcao que o pedido de redefinicao de senha usa, e **o
 * > consumo — recusar depois de 24 horas, apagar no uso, substituir a anterior —
 * > e dela, nao daqui.**
 *
 * Tres coisas que este arquivo faz porque o legado faz:
 *
 * 1. **O valor gravado e `{instante}:{resumo}`.** O instante vem **prefixado**, em
 *    segundos inteiros UTC — `../portas/porta-de-relogio.ts` registra a ancora
 *    (*"a chave de redefinicao leva o instante prefixado,
 *    `wp-includes/user.php:3204`"*) e `../armazenamento/conta.ts` descreve a coluna
 *    como *"`user_activation_key` — guarda o instante prefixado, quando ha chave"*.
 *    O prazo nao e gravado: ele e **lido do instante** na hora de consumir, o que
 *    significa que mudar o prazo muda a validade de toda chave ja emitida.
 * 2. **So o resumo e gravado; a chave em claro so existe no e-mail.** E CA-4.1 por
 *    extenso: *"a chave e guardada com hash na conta e o valor em claro so existe
 *    no e-mail enviado"*. Por isso {@link emitirChaveDeRedefinicao} devolve os dois
 *    valores e **nada deste modulo devolve a chave em claro ao chamador** — ver
 *    `cadastrar.ts`.
 * 3. **A gravacao e um `UPDATE` na conta**, nao uma tabela de chave. A coluna e
 *    `NOT NULL default ''` (`DB-SENT`), logo "sem chave" e a cadeia vazia e nao
 *    `NULL`.
 *
 * ## 🔴 O que este arquivo NAO decide: com que algoritmo a chave e resumida
 *
 * O pacote registra **que** a chave e guardada com hash (CA-4.1) e **que** o
 * instante vem prefixado. Ele **nao registra o algoritmo** — nem em
 * `target_business_rules.md`, nem em `tech-stack.json` (que detalha o hash de
 * `user_pass` peca por peca e nao fala desta coluna), nem em `target_data_model.md`.
 * E o algoritmo do legado nesta coluna **nao e o de `user_pass`**: sao duas
 * primitivas diferentes no mesmo sistema.
 *
 * Por isso o resumo entra por {@link ResumoDaChaveDeRedefinicao}, um ponto de
 * substituicao registrado, e nao por uma escolha feita aqui. Escolher um algoritmo
 * seria inventar a forma de um byte gravado, que a Decisao 2 de `parity_specs.md`
 * poe no criterio desta area (*"efeito no banco"*). A escolha e de T009 e fecha
 * contra o oraculo (`ESC-ORACULO`, BR-MIGRAR-116).
 */

import type { RepositorioDeContas } from '../armazenamento/conta.js';

/** O separador entre o instante e o resumo, dentro de `user_activation_key`. */
export const SEPARADOR_DA_CHAVE_DE_REDEFINICAO = ':';

/**
 * O ponto de substituicao do resumo da chave.
 *
 * Tem as duas operacoes porque o legado tem as duas, e porque separa-las
 * convidaria T009 a conferir com um algoritmo diferente do que emitiu.
 * {@link ResumoDaChaveDeRedefinicao.conferir} nao e usado por T013 — nada no
 * cadastro consome chave — e esta declarado para que o contrato esteja inteiro.
 */
export interface ResumoDaChaveDeRedefinicao {
  resumir(chaveEmClaro: string): string;
  conferir(chaveEmClaro: string, resumo: string): boolean;
}

/** O que a emissao produz: o que vai no e-mail e o que vai na coluna. */
export interface ChaveDeRedefinicaoEmitida {
  /** O valor em claro. **So** o e-mail o recebe (CA-4.1). */
  readonly chaveEmClaro: string;
  /** `{instante}:{resumo}`, pronto para `user_activation_key`. */
  readonly valorGravado: string;
  /** O instante prefixado, em segundos inteiros UTC. */
  readonly emitidaEm: number;
}

/**
 * Emite a chave: sorteia, resume e prefixa o instante. **Nao grava.**
 *
 * A separacao entre emitir e gravar nao e gosto: ela deixa a montagem do valor
 * afirmavel por teste sem porta nenhuma, que e o que o **P6** pede para a borda do
 * prazo.
 */
export function emitirChaveDeRedefinicao(
  chaveEmClaro: string,
  agoraEmSegundos: number,
  resumo: ResumoDaChaveDeRedefinicao,
): ChaveDeRedefinicaoEmitida {
  return {
    chaveEmClaro,
    valorGravado: `${agoraEmSegundos}${SEPARADOR_DA_CHAVE_DE_REDEFINICAO}${resumo.resumir(
      chaveEmClaro,
    )}`,
    emitidaEm: agoraEmSegundos,
  };
}

/**
 * Grava o valor emitido na conta, e devolve quantas linhas mudaram.
 *
 * Um pedido novo **substitui** a chave anterior, que deixa de valer — e CA-4.3, e
 * sai de graca de a coluna ser uma so. Nada aqui apaga: apagar e CA-1.4 (primeiro
 * acesso bem-sucedido, ja em `../autenticacao/autenticar.ts`) e CA-4.4 (gravar a
 * senha nova, que e T009).
 */
export function gravarChaveDeRedefinicao(
  contas: RepositorioDeContas,
  contaId: number,
  emitida: ChaveDeRedefinicaoEmitida,
): number {
  return contas.atualizar(contaId, { chaveDeAtivacao: emitida.valorGravado });
}

/**
 * O instante prefixado de um valor gravado, ou `null` quando ele nao tem a forma
 * que o legado escreve.
 *
 * `null` nao e erro: e **recusa de interpretar**, a mesma postura de
 * `../armazenamento/papel.ts` diante de uma estrutura estranha. Uma chave sem
 * prefixo de instante existe no legado — a de ativacao de cadastro em rede, que
 * `target_domain_model.md` descreve como a terceira forma incompativel de
 * `VO-ChaveDeAtivacao`, **sem prazo** — e adivinhar um instante para ela daria
 * prazo a quem nao tem.
 */
export function instanteDaChaveGravada(valorGravado: string): number | null {
  const posicao = valorGravado.indexOf(SEPARADOR_DA_CHAVE_DE_REDEFINICAO);
  if (posicao <= 0) {
    return null;
  }
  const prefixo = valorGravado.slice(0, posicao);
  if (!/^[0-9]+$/.test(prefixo)) {
    return null;
  }
  return Number.parseInt(prefixo, 10);
}

/**
 * A chave gravada ja venceu? (`U4`, as 24 horas de CA-6.5)
 *
 * A comparacao e `agora - instante > prazo`, **nao** `>=`: no legado o instante
 * exato do limite ainda vale, e e isso que o teste de borda do **P6** afirma — *"no
 * ultimo instante aceita, um instante depois recusa"*.
 *
 * Valor sem instante interpretavel conta como vencido: nao da prazo a quem o
 * pacote nao da. **Quem recusa o acesso por causa disto e T009**; aqui o predicado
 * existe para que o prazo que CA-6.5 promete seja afirmavel nesta tarefa.
 */
export function chaveDeRedefinicaoVencida(
  valorGravado: string,
  agoraEmSegundos: number,
  prazoEmSegundos: number,
): boolean {
  const instante = instanteDaChaveGravada(valorGravado);
  if (instante === null) {
    return true;
  }
  return agoraEmSegundos - instante > prazoEmSegundos;
}

/**
 * Codifica como a codificacao de URL **crua** do legado, e nao como a do runtime.
 *
 * A diferenca e de cinco caracteres — `!`, `'`, `(`, `)` e `*` —, que a codificacao
 * do runtime deixa passar e a do legado escapa. Nenhum login que o cadastro aceita
 * os contem, porque a sanitizacao estrita de
 * `../autenticacao/normalizacao-de-credencial.ts` os remove; mas o caminho e
 * montado tambem para conta criada por outro meio, e o criterio desta area e byte a
 * byte.
 */
export function codificarParaUrlCrua(texto: string): string {
  return encodeURIComponent(texto).replace(
    /[!'()*]/g,
    (caractere) =>
      `%${caractere.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/**
 * O caminho de definicao de senha que vai no e-mail (CA-6.5).
 *
 * **Os dois nomes de parametro sao contrato externo.** `target_screens.md` poe a
 * tela de redefinicao (`SCR-003`) em modo **literal**, com a rota preservada
 * `/wp-login.php?action=rp (alias: resetpass)` e os pontos de interpolacao
 * `{{rp_key}}` e `{{rp_login}}`, na familia C — *"o nome do campo e a API"*.
 * Renomear `key` ou `login` aqui quebra o link que chegou no e-mail de alguem.
 *
 * E **caminho**, nao URL: montar o endereco absoluto da rede e da borda, como
 * `urlDoPainel` e `urlDeSenhaPerdida` em
 * `../autenticacao/contexto-de-autenticacao.ts`.
 */
export function caminhoDeDefinicaoDeSenha(
  login: string,
  chaveEmClaro: string,
): string {
  return `wp-login.php?action=rp&key=${chaveEmClaro}&login=${codificarParaUrlCrua(
    login,
  )}`;
}
