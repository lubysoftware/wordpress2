/**
 * A conferencia da senha contra o hash guardado (CA-1.3).
 *
 * **Este e um dos 42 pontos de substituicao de BR-MIGRAR-103 (`EXT-SUBST`).** No
 * legado a conferencia e uma funcao substituivel inteira, protegida por guarda
 * de existencia, e o mecanismo tem ainda um segundo nivel: um objeto de hash
 * registrado que, quando presente, **assume a conferencia toda**. As duas formas
 * migram como requisito funcional, e o critério que BR-MIGRAR-103 propoe e o que
 * esta implementado aqui: *"um ponto e substituivel no alvo se um pacote de
 * terceiro puder trocar a implementacao sem alterar arquivo do nucleo, com a
 * resolucao acontecendo antes do primeiro uso"*.
 *
 * **Nao e porta, e registro.** AD-08 fixa portas somente nas 5 bordas — dados,
 * HTTP, sistema de arquivos, cache de objeto e e-mail — e a conferencia de senha
 * nao e nenhuma delas. `pending_decisions.md` lista a biblioteca de hash do
 * legado entre as bordas que *"sao trocadas de qualquer forma"*, e e dali que
 * vem a tentacao de criar uma sexta porta. BR-MIGRAR-103 resolve sem porta:
 * registro explicito, resolvido antes do primeiro uso.
 *
 * **O que o slot de tecnologia compra, e o que ele nao compra.** `plan.md`
 * recomenda, para `hash-de-senha`, *"bcrypt por biblioteca nativa, com HMAC do
 * runtime"*, e a razao registrada e literal: *"e o unico caminho em que cada
 * peca do hash do legado tem contraparte exata — HMAC-SHA384, base64, bcrypt e o
 * prefixo `$wp` —, e o hash entra na chave do cookie, onde aproximacao nao
 * existe"*. Deste arquivo saem as tres primeiras pecas, que o runtime tem. A
 * quarta, bcrypt, **nao existe no runtime** e chega por `PrimitivaDeBcrypt`,
 * que e adaptador — AD-04 poe a borda em `adaptadores/`, e o risco 3 de
 * `plan.md` avisa que este e *"o tipo de detalhe que um porte perde sem o teste
 * notar, porque o login continua funcionando"*.
 */

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * O teto de comprimento da senha, do legado.
 *
 * E ponto de configuracao nomeado com o valor de fabrica, como o P6 exige, e o
 * teste de borda dele esta na suite desta tarefa: no limite confere, um
 * caractere acima recusa **sem conferir**. Nao e defesa contra forca bruta —
 * BR-MIGRAR-112 registra que o nucleo nao tem limite de taxa nenhum, e UC-19
 * repete que *"nao ha defesa contra forca bruta no nucleo"*. E so o teto que
 * impede uma entrada enorme de virar trabalho de hash.
 */
export const COMPRIMENTO_MAXIMO_DE_SENHA = 4096;

/** O prefixo que marca o hash de bcrypt do legado. */
export const PREFIXO_DE_HASH_BCRYPT = '$wp';

/**
 * A chave do HMAC que pre-processa a senha antes do bcrypt.
 *
 * E constante do legado, nao segredo da instalacao: bcrypt trunca a entrada em
 * 72 bytes, e o pre-processamento existe para que uma senha longa nao seja
 * truncada. Trocar este valor invalida **todo** hash gravado.
 */
export const CHAVE_DO_HMAC_DE_SENHA = 'wp-sha384';

/** O comprimento maximo do hash que ainda e tratado como resumo antigo. */
export const COMPRIMENTO_MAXIMO_DE_HASH_ANTIGO = 32;

/**
 * A primitiva de bcrypt, que o runtime nao tem.
 *
 * Sincrona por AD-04: `contextos/` e sincrono, e a fronteira de `await` fica em
 * `adaptadores/`. O argumento `hash` chega **sem** o prefixo `$wp`, porque o
 * prefixo e marcacao do legado e nao faz parte do hash de bcrypt.
 */
export interface PrimitivaDeBcrypt {
  verificar(senhaPreProcessada: string, hash: string): boolean;
}

/**
 * O ponto de substituicao: quem confere senha contra hash.
 *
 * Um terceiro que registre outra implementacao assume a conferencia inteira, e e
 * assim no legado — por isso a interface recebe a senha em claro, e nao um
 * resumo. CA-1.3 cobra o outro lado: a senha em texto **nao e gravada em lugar
 * algum**, e nenhum caminho deste arquivo escreve.
 */
export interface VerificadorDeSenha {
  verificar(senha: string, hash: string): boolean;
}

/** O que `criarVerificadorDeSenhaDoNucleo` precisa receber. */
export interface DependenciasDoVerificadorDeSenha {
  readonly bcrypt: PrimitivaDeBcrypt;
  /**
   * O verificador do formato portavel antigo, quando a instalacao tiver hash
   * nesse formato.
   *
   * **Nasce ausente de proposito, e isso nao e preguica.** `plan.md` secao
   * *Migracao de dados* fixa que *"nada vem do sistema velho"* e que o porte
   * parte de instalacao nova: numa arvore sem dado migrado nao existe hash no
   * formato portavel, logo este ramo nao tem como ser alcancado. Se um dia
   * existir migracao, e aqui que ela se liga — ver a nota de entrega de T003.
   */
  readonly hashPortavel?: PrimitivaDeBcrypt;
}

/**
 * Compara dois textos em tempo constante.
 *
 * O legado usa a comparacao segura do runtime no ramo de resumo antigo, e
 * trocar por `===` muda uma propriedade do produto, mesmo sem mudar nenhuma
 * resposta.
 */
function iguaisEmTempoConstante(a: string, b: string): boolean {
  const primeiro = Buffer.from(a, 'utf8');
  const segundo = Buffer.from(b, 'utf8');
  if (primeiro.length !== segundo.length) {
    return false;
  }
  return timingSafeEqual(primeiro, segundo);
}

/**
 * O pre-processamento da senha antes do bcrypt: HMAC-SHA384 em base64.
 *
 * Exportado porque T002 precisa dele para **gravar** o hash, e as duas pontas
 * tem de usar a mesma funcao. Um byte diferente aqui muda todo hash, e com ele
 * toda sessao: o risco 3 de `plan.md` e exatamente este.
 */
export function preProcessarSenhaParaBcrypt(senha: string): string {
  return createHmac('sha384', CHAVE_DO_HMAC_DE_SENHA)
    .update(senha, 'utf8')
    .digest('base64');
}

/**
 * O verificador do nucleo: os ramos do legado, na ordem do legado.
 *
 * A ordem e o que decide, e ela nao e arbitraria — o ramo do resumo antigo vem
 * antes do ramo de bcrypt porque a decisao e pelo **comprimento** do hash, e um
 * hash de bcrypt nunca cabe no teto do resumo antigo.
 */
export function criarVerificadorDeSenhaDoNucleo(
  dependencias: DependenciasDoVerificadorDeSenha,
): VerificadorDeSenha {
  return {
    verificar(senha, hash) {
      // Teto de comprimento: recusa sem conferir.
      if (senha.length > COMPRIMENTO_MAXIMO_DE_SENHA) {
        return false;
      }

      // Resumo antigo, de antes do formato com prefixo.
      if (hash.length <= COMPRIMENTO_MAXIMO_DE_HASH_ANTIGO) {
        const resumo = createHash('md5').update(senha, 'utf8').digest('hex');
        // ⚠️ O legado, quando este ramo confere E conhece a conta, **regrava** o
        // hash no formato novo. A regravacao nao esta aqui: ela e escrita na
        // conta, e a escrita de senha e de `AGG-Conta`.trocarSenha, que e de
        // T009. Numa instalacao nova este ramo nao e alcancavel (ver
        // `hashPortavel`), e por isso a ausencia e lacuna declarada e nao
        // divergencia silenciosa. Ver a nota de entrega de T003.
        return iguaisEmTempoConstante(hash, resumo);
      }

      // Formato corrente: prefixo, pre-processamento e bcrypt.
      if (hash.startsWith(PREFIXO_DE_HASH_BCRYPT)) {
        return dependencias.bcrypt.verificar(
          preProcessarSenhaParaBcrypt(senha),
          hash.slice(PREFIXO_DE_HASH_BCRYPT.length),
        );
      }

      // Formato portavel antigo. Sem verificador registrado, recusa — nao
      // deixa passar. Instalacao nova nao produz hash nesta forma.
      return dependencias.hashPortavel?.verificar(senha, hash) ?? false;
    },
  };
}
