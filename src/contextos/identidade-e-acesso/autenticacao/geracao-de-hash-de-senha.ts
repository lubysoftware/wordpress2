/**
 * A geracao do hash da senha — o gemeo de `verificacao-de-senha.ts`, e o **42º**
 * tipo de ponto de substituicao que BR-MIGRAR-103 (`EXT-SUBST`) manda portar.
 *
 * No legado sao **duas** funcoes substituiveis vizinhas, uma que confere e outra
 * que gera, cada uma com a sua guarda de existencia. Por isso este arquivo existe
 * ao lado daquele em vez de dentro dele: quem troca a conferencia nao
 * necessariamente troca a geracao, e fundir as duas num unico registro tiraria
 * metade da superficie que `EXT-SUBST` conta.
 *
 * **Por que T013 precisa disto, e porque nao foi T003 que o escreveu.** T003
 * (US-1) so **confere** senha; a primeira tarefa que **grava** uma e T013, porque
 * CA-6.4 fixa que a conta nasce com senha que o titular nao definiu. T003 deixou o
 * pre-processamento exportado justamente para isto — *"exportado porque T002
 * precisa dele para gravar o hash, e as duas pontas tem de usar a mesma funcao. Um
 * byte diferente aqui muda todo hash, e com ele toda sessao"* — e e esta funcao que
 * o usa.
 *
 * **As quatro pecas do hash, e de onde cada uma vem.** `plan.md`, slot
 * `hash-de-senha`: *"e o unico caminho em que cada peca do hash do legado tem
 * contraparte exata — HMAC-SHA384, base64, bcrypt e o prefixo `$wp`"*. Tres
 * saem do runtime, por `preProcessarSenhaParaBcrypt` e por
 * {@link PREFIXO_DE_HASH_BCRYPT}; **bcrypt nao existe no runtime** e chega por
 * {@link PrimitivaDeBcryptDeGeracao}, que e adaptador (AD-04 poe a fronteira em
 * `adaptadores/`).
 *
 * ⚠️ **O risco 3 de `plan.md` mora aqui tanto quanto na conferencia:** *"e o tipo
 * de detalhe que um porte perde sem o teste notar, porque o login continua
 * funcionando"*. Se esta funcao gerar um hash que a conferencia aceita mas que
 * divergir do legado em um byte, o fragmento de 4 caracteres que entra na chave do
 * HMAC do cookie divergira junto, e **toda sessao** daquela conta divergira do
 * oraculo sem que nenhuma tela mude.
 */

import {
  COMPRIMENTO_MAXIMO_DE_SENHA,
  PREFIXO_DE_HASH_BCRYPT,
  preProcessarSenhaParaBcrypt,
} from './verificacao-de-senha.js';
import { prepararSenha } from './normalizacao-de-credencial.js';

/**
 * O hash que o legado grava quando a senha passa do teto de comprimento.
 *
 * Nao e erro e nao e excecao: e um valor gravavel que **nenhuma senha confere**.
 * A conferencia de `verificacao-de-senha.ts` o trata pelo ramo do resumo antigo —
 * um caractere cabe no teto de 32 —, compara com um resumo de 32 caracteres e
 * recusa sempre. Preservar isto importa porque o legado **grava** a conta: ela
 * passa a existir com uma senha que nunca autentica, em vez de a criacao falhar.
 */
export const HASH_QUE_NUNCA_CONFERE = '*';

/**
 * A primitiva de bcrypt do lado da geracao, que o runtime nao tem.
 *
 * Sincrona por AD-04. O retorno e o hash de bcrypt **sem** o prefixo `$wp`,
 * porque o prefixo e marcacao do legado e nao faz parte do hash — a mesma
 * fronteira que `PrimitivaDeBcrypt.verificar` ja respeita do outro lado.
 */
export interface PrimitivaDeBcryptDeGeracao {
  gerar(senhaPreProcessada: string): string;
}

/** O ponto de substituicao: quem transforma senha em hash gravavel. */
export interface GeradorDeHashDeSenha {
  gerar(senha: string): string;
}

/** O que `criarGeradorDeHashDeSenhaDoNucleo` precisa receber. */
export interface DependenciasDoGeradorDeHashDeSenha {
  readonly bcrypt: PrimitivaDeBcryptDeGeracao;
}

/**
 * O gerador do nucleo: o teto, o corte de espaco, o pre-processamento, bcrypt e o
 * prefixo — nesta ordem, que e a do legado.
 *
 * **O corte de espaco das pontas esta dentro da geracao, nao antes dela.** No
 * legado o corte e parte do pre-processamento — `tech-stack.json` escreve a peca
 * inteira, *"`base64(hmac_sha384(trim(senha), 'wp-sha384'))`"* —, logo
 * `" segredo "` e `"segredo"` produzem o **mesmo** hash. Aqui ele chega pela funcao
 * nomeada que ja existe, `prepararSenha`, em vez de um `.trim()` solto.
 *
 * ⚠️ **Lacuna declarada, do outro lado da mesma regra:**
 * `preProcessarSenhaParaBcrypt` de `verificacao-de-senha.ts` **nao** corta espaco,
 * e quem corta, na conferencia, e a entrada — `autenticar` chama `prepararSenha`
 * antes da cadeia. Pelo caminho do produto as duas pontas coincidem e esta geracao
 * e conferivel por aquela conferencia; **chamar o verificador direto com senha
 * cercada de espaco recusaria uma senha que o legado aceita.** T013 nao mexeu no
 * arquivo de T003 por isso: a correcao e de uma linha, muda um ponto de
 * substituicao publicado e nao e entrega desta tarefa. Fica registrado aqui e na
 * nota de entrega de T013 do `README.md`.
 */
export function criarGeradorDeHashDeSenhaDoNucleo(
  dependencias: DependenciasDoGeradorDeHashDeSenha,
): GeradorDeHashDeSenha {
  return {
    gerar(senha) {
      // Teto de comprimento: grava o hash que nunca confere, sem gerar nada.
      // A medida e sobre a senha COMO CHEGOU, antes do corte de espaco, como no
      // legado — logo uma senha de 4.097 espacos passa do teto.
      if (senha.length > COMPRIMENTO_MAXIMO_DE_SENHA) {
        return HASH_QUE_NUNCA_CONFERE;
      }

      return (
        PREFIXO_DE_HASH_BCRYPT +
        dependencias.bcrypt.gerar(
          preProcessarSenhaParaBcrypt(prepararSenha(senha)),
        )
      );
    },
  };
}
