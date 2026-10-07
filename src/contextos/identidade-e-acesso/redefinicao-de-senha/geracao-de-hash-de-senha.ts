/**
 * A **gravacao** do *hash* da senha — a contraparte de
 * `../autenticacao/verificacao-de-senha.ts`, que faz a leitura.
 *
 * Este arquivo existe porque T003 o deixou marcado para ca. A nota esta no
 * ramo de resumo antigo do verificador, com o endereco: *"a regravacao nao esta
 * aqui: ela e escrita na conta, e a escrita de senha e de
 * `AGG-Conta`.trocarSenha, que e de T009"*. US-4 e o primeiro fluxo que grava
 * senha, e por isso a contraparte nasce aqui.
 *
 * **O formato e a mesma peca de tres partes do verificador, e isso e o ponto.**
 * `plan.md`, slot `hash-de-senha`, registra a razao da recomendacao em uma
 * frase: *"e o unico caminho em que cada peca do hash do legado tem contraparte
 * exata — HMAC-SHA384, base64, bcrypt e o prefixo `$wp` —, e o hash entra na
 * chave do cookie, onde aproximacao nao existe"*. O risco 3 do mesmo documento
 * explica o custo de errar um byte: *"um byte diferente no hash muda toda
 * sessao... e o tipo de detalhe que um porte perde sem o teste notar, porque o
 * login continua funcionando"*. Por isso a geracao reusa, literalmente, o
 * prefixo e o pre-processamento que o verificador exporta: duas copias da mesma
 * constante seriam duas chances de divergir.
 *
 * **O que fica fora, e por que.** O bcrypt em si nao existe neste runtime e
 * chega por `PrimitivaDeBcryptParaGravar`, que e adaptador (AD-04 poe a
 * fronteira de `await` e a borda em `adaptadores/`). A interface de leitura de
 * T003 (`PrimitivaDeBcrypt`) **nao** foi alterada para ganhar um metodo de
 * geracao: mudar uma interface de tarefa fechada quebraria os simulados das
 * suites dela por um motivo que nao e de US-4.
 *
 * **E trocar a senha nao revoga sessao nenhuma** (`ESC-SESSAO`,
 * BR-MIGRAR-111). Nada neste arquivo nem no fluxo que o usa toca no registro de
 * tokens, e isso e divida herdada **de proposito**: REQ-008 pediria o contrario
 * e esta bloqueado, a resposta 7 decidiu preservar, o cenario
 * `@divida-herdada` de `parity_tests/06-autenticacao-e-sessao.feature` cobra
 * *"as duas sessoes continuam validas nas duas metades"*, e a pos-condicao de
 * UC-20 repete: *"as sessoes abertas antes da troca **nao** sao encerradas por
 * este fluxo"*. A suite desta tarefa afirma isso pelo efeito no banco.
 */

import {
  COMPRIMENTO_MAXIMO_DE_SENHA,
  PREFIXO_DE_HASH_BCRYPT,
  preProcessarSenhaParaBcrypt,
} from '../autenticacao/verificacao-de-senha.js';

/**
 * O lado de gravacao da primitiva de bcrypt.
 *
 * Recebe a senha **ja pre-processada** e devolve o *hash* **sem** o prefixo
 * `$wp`, exatamente a simetria do lado de leitura: o prefixo e marcacao do
 * legado e nao faz parte do bcrypt.
 */
export interface PrimitivaDeBcryptParaGravar {
  gerar(senhaPreProcessada: string): string;
}

/**
 * Quem produz o valor a gravar em `users.user_pass`.
 *
 * E ponto de substituicao pelo mesmo motivo que o verificador: no legado a
 * funcao que gera o *hash* e substituivel inteira, e BR-MIGRAR-103
 * (`EXT-SUBST`) poe os 42 pontos como requisito funcional.
 */
export interface GeracaoDeHashDeSenha {
  gerar(senha: string): string;
}

/**
 * O valor gravado quando a senha passa do teto de comprimento.
 *
 * **A unica propriedade de que o dominio depende e que ele nao confere com senha
 * nenhuma**, e a suite desta tarefa afirma essa propriedade contra o verificador
 * de T003 — nao o byte. O teto e `COMPRIMENTO_MAXIMO_DE_SENHA`, que T003 ja
 * declarou como ponto de configuracao com o valor de fabrica, e ele **recusa sem
 * conferir** na leitura; sem a recusa simetrica na gravacao, uma senha acima do
 * teto seria gravada com *hash* valido e nunca mais autenticaria — o sistema
 * novo trancaria a conta num caminho em que o legado nao a tranca.
 *
 * ⚠️ O byte desta sentinela nao esta registrado no pacote. Ele fecha contra o
 * oraculo (`ESC-ORACULO`), e so ele: a propriedade acima e o que o fluxo usa.
 */
export const HASH_DE_SENHA_RECUSADA = '*';

/**
 * Monta a geracao do nucleo sobre a primitiva de bcrypt.
 *
 * As tres partes, na ordem do legado: teto de comprimento, pre-processamento
 * HMAC-SHA384 em base64, bcrypt — e o prefixo na frente do resultado.
 */
export function criarGeracaoDeHashDeSenhaDoNucleo(
  bcrypt: PrimitivaDeBcryptParaGravar,
): GeracaoDeHashDeSenha {
  return {
    gerar(senha) {
      if (senha.length > COMPRIMENTO_MAXIMO_DE_SENHA) {
        return HASH_DE_SENHA_RECUSADA;
      }
      return (
        PREFIXO_DE_HASH_BCRYPT + bcrypt.gerar(preProcessarSenhaParaBcrypt(senha))
      );
    },
  };
}
