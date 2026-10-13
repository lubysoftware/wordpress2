/**
 * O hash do atestado de senha de conteudo — a classe `PasswordHash` de
 * `wp-includes/class-phpass.php`, no **unico** arranjo que o atestado usa:
 * `new PasswordHash( 8, true )`, com `portable_hashes` em verdadeiro
 * (`wp-login.php:769` ao gravar, `wp-includes/post-template.php:896` ao
 * conferir).
 *
 * Entrega de **T013** (US-6, CA-6.2 e CA-6.3).
 *
 * ---
 *
 * ## Por que esta funcao esta aqui, e nao numa porta
 *
 * Mesma razao de `contextos/identidade-e-acesso/autenticacao/verificacao-de-senha.ts`:
 * AD-08 de `target_architecture.md` fixa porta somente nas cinco bordas — dados,
 * HTTP, sistema de arquivos, cache de objeto e e-mail — e conferir hash nao e
 * nenhuma delas. BR-MIGRAR-103 (`EXT-SUBST`) resolve sem porta: **registro
 * explicito**, resolvido antes do primeiro uso, e e o que {@link HashDoAtestado}
 * declara.
 *
 * ⚠️ **E este formato nao e o do slot `hash-de-senha` do `plan.md`.** O slot
 * recomenda *"bcrypt por biblioteca nativa, com HMAC do runtime"*, e e disso
 * que a senha de **conta** e feita (`$wp` + bcrypt, feature 001). O atestado de
 * senha de **conteudo** nao passa por ali: `wp-login.php:769` instancia o
 * hasheador com `portable_hashes = true`, o que desliga o ramo de bcrypt de
 * `HashPassword` (`class-phpass.php:222`) e forca o formato portavel — MD5
 * iterado, que o runtime tem em `node:crypto`. Trocar por bcrypt mudaria o valor
 * do cookie e faria o portao de `post-template.php:899` recusar **todo** atestado,
 * porque ele exige o prefixo `$P$B` literal.
 *
 * ## O que NAO esta portado aqui, e por que
 *
 * | o que | legado | motivo |
 * |---|---|---|
 * | o ramo de `bcrypt` de `HashPassword` | `class-phpass.php:222-228` | inalcancavel com `portable_hashes = true`, que e como as duas pontas do atestado o instanciam |
 * | `gensalt_blowfish` | `:170-209` | idem: so o ramo de bcrypt a chama |
 * | o recuo de `CheckPassword` para `crypt()` do interpretador | `:253` | inalcancavel pelo atestado: `post-template.php:899` ja recusou tudo que nao comeca em `$P$B` antes de chegar a conferencia |
 * | o recuo de `get_random_bytes` para `md5( microtime() )` | `:80-88` | e o caminho de quando `/dev/urandom` nao abre; aqui a fonte e a do runtime, injetavel por {@link OpcoesDoHashDoAtestado.bytesAleatorios} |
 *
 * Nenhum dos quatro e remocao de superficie (P8): sao ramos de uma biblioteca
 * empacotada que este atestado nao percorre. Quem portar `wp_check_password` por
 * inteiro — a feature 015, no slot de hash — recebe os quatro, e e la que este
 * arquivo deve ser consolidado com o `hashPortavel` que a feature 001 declarou e
 * deixou ausente. As duas pontas tem de usar a **mesma** funcao: um byte
 * diferente aqui invalida todo atestado gravado.
 */

import { createHash, randomBytes } from 'node:crypto';

/**
 * O alfabeto de 64 caracteres do phpass (`class-phpass.php:52`).
 *
 * ⚠️ **Nao e base64 e nao e o alfabeto do bcrypt.** Comeca em `./` e poe os
 * digitos antes das letras; `gensalt_blowfish` usa uma ordem diferente, e o
 * proprio comentario do legado explica por que (`:177-182`). Reordenar um
 * caractere muda todo hash.
 */
export const ALFABETO_DO_PHPASS =
  './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * O teto de comprimento da senha, em **bytes** (`class-phpass.php:216` e `:249`).
 *
 * E numero do legado, com o valor de fabrica, como o P6 exige — e o mesmo 4096
 * que `COMPRIMENTO_MAXIMO_DE_SENHA` de `contextos/identidade-e-acesso` declara,
 * porque sai da mesma biblioteca. Acima dele `HashPassword` devolve `'*'` e
 * `CheckPassword` devolve falso **sem conferir**.
 *
 * ⚠️ `strlen()` conta bytes, nao caracteres: uma senha de 2.049 caracteres
 * acentuados passa de 4096 bytes em UTF-8. E por isso que a contagem aqui e de
 * bytes.
 */
export const COMPRIMENTO_MAXIMO_DA_SENHA = 4096;

/**
 * O `iteration_count_log2` com que as duas pontas do atestado instanciam o
 * hasheador: **8** (`wp-login.php:769`, `post-template.php:896`).
 *
 * Ele nao e o expoente da iteracao: `gensalt_private` grava no hash o caractere
 * de `min( 8 + 5, 30 ) = 13` (`class-phpass.php:123-124`), e `crypt_private` le
 * esse caractere de volta como expoente (`:140`). O numero de voltas de MD5 e
 * portanto **2^13 = 8192**, e nao 2^8.
 */
export const EXPOENTE_DECLARADO_DO_ATESTADO = 8;

/** O deslocamento de `gensalt_private` (`class-phpass.php:123`). */
export const DESLOCAMENTO_DO_EXPOENTE = 5;

/** O teto do expoente em `gensalt_private` (`class-phpass.php:123-124`). */
export const EXPOENTE_MAXIMO = 30;

/** O piso que `crypt_private` exige do expoente lido (`class-phpass.php:141`). */
export const EXPOENTE_MINIMO_ACEITO = 7;

/** O prefixo do formato portavel do phpass (`class-phpass.php:138`). */
export const PREFIXO_PORTAVEL = '$P$';

/** O prefixo que o phpBB3 usa para a mesma coisa (`class-phpass.php:137-138`). */
export const PREFIXO_PORTAVEL_DE_PHPBB = '$H$';

/**
 * O prefixo exato que o atestado tem, e que o portao exige
 * (`post-template.php:899`).
 *
 * E `PREFIXO_PORTAVEL` mais o caractere do expoente 13 — `ALFABETO_DO_PHPASS[13]`,
 * que e `'B'`. Esta declarado como constante porque o portao o compara **literal**:
 * um atestado com outro expoente, ainda que valido para o phpass, e recusado sem
 * conferencia.
 */
export const PREFIXO_DO_ATESTADO = '$P$B';

/** O comprimento do hash portavel: 12 de semeadura mais 22 de resumo. */
export const COMPRIMENTO_DO_HASH_PORTAVEL = 34;

/** O comprimento da semeadura, em caracteres (`class-phpass.php:147-150`). */
export const COMPRIMENTO_DA_SEMEADURA = 8;

/** Os bytes aleatorios que `gensalt_private` consome (`class-phpass.php:235`). */
export const BYTES_DA_SEMEADURA = 6;

/**
 * O que `HashPassword` devolve quando nao consegue produzir hash
 * (`class-phpass.php:214-217` e `:233-235`).
 *
 * ⚠️ Gravado no cookie, este valor nao comeca em `$P$B`, logo o portao o recusa
 * e o corpo continua oculto — que e o caminho de uma senha acima do teto.
 */
export const HASH_AUSENTE = '*';

/** O que `crypt_private` devolve quando a semeadura nao serve (`:133-135`). */
export const CIFRA_RECUSADA = '*0';

/** O que ela devolve quando a propria semeadura ja era a recusa (`:133-135`). */
export const CIFRA_RECUSADA_DE_RECUSA = '*1';

/**
 * A fonte de bytes aleatorios — `get_random_bytes()` (`class-phpass.php:71`).
 *
 * Chega por argumento para que o teste possa fixar a semeadura e afirmar o hash
 * inteiro; sem ela, a unica afirmacao possivel seria a forma. O default le o
 * gerador do runtime, que e a contraparte de `/dev/urandom` do legado (`:73-78`).
 */
export type FonteDeBytesAleatorios = (quantidade: number) => Uint8Array;

/**
 * O ponto de substituicao do hash do atestado (BR-MIGRAR-103, `EXT-SUBST`).
 *
 * Os dois metodos sao os dois que o legado chama, com a mesma assinatura e a
 * mesma ordem de argumento — e a ordem **surpreende**: em
 * `CheckPassword( $senha, $hashGuardado )` quem vem primeiro e a senha, e no
 * atestado a "senha" e o `post_password` da linha, enquanto o "hash guardado" e
 * o valor do cookie (`post-template.php:902`). Invertida, a conferencia passa a
 * dar sempre falso.
 */
export interface HashDoAtestado {
  /** `HashPassword( $senha )` (`class-phpass.php:214`). */
  gerar(senha: string): string;
  /** `CheckPassword( $senha, $hashGuardado )` (`class-phpass.php:247`). */
  conferir(senha: string, hashGuardado: string): boolean;
}

/** O que {@link criarHashDoAtestado} aceita. */
export interface OpcoesDoHashDoAtestado {
  readonly bytesAleatorios?: FonteDeBytesAleatorios;
  /**
   * O `iteration_count_log2` do construtor (`class-phpass.php:50`).
   *
   * Fora de 4 a 31 o legado o troca por 8 (`:54-56`), e e esse o default aqui
   * porque e o valor com que as duas pontas do atestado instanciam a classe.
   */
  readonly expoente?: number;
}

/** `ord()` de um byte, com a borda de indice que `noUncheckedIndexedAccess` cobra. */
function byteEm(entrada: Uint8Array, indice: number): number {
  return entrada[indice] ?? 0;
}

/** Um caractere do alfabeto, pelo indice de 6 bits. */
function caractere(indice: number): string {
  return ALFABETO_DO_PHPASS[indice] ?? '';
}

/**
 * `encode64( $entrada, $quantidade )` (`class-phpass.php:94-116`).
 *
 * Empacota tres bytes em quatro caracteres de 6 bits, **em ordem de byte
 * invertida** em relacao ao base64 do runtime, e para no meio do grupo quando a
 * quantidade nao e multipla de tres: 6 bytes dao 8 caracteres e 16 dao 22. Os
 * dois `$i++` de dentro do `if` sao do legado, e com eles o laco avanca por
 * efeito colateral de comparacao — transcrito como esta para que a conta de
 * caracteres bata nos dois tamanhos que o atestado usa.
 */
export function codificarComoPhpass(
  entrada: Uint8Array,
  quantidade: number,
): string {
  let saida = '';
  let i = 0;
  do {
    let valor = byteEm(entrada, i);
    i += 1;
    saida += caractere(valor & 0x3f);
    if (i < quantidade) {
      valor |= byteEm(entrada, i) << 8;
    }
    saida += caractere((valor >> 6) & 0x3f);
    if (i >= quantidade) {
      break;
    }
    i += 1;
    if (i < quantidade) {
      valor |= byteEm(entrada, i) << 16;
    }
    saida += caractere((valor >> 12) & 0x3f);
    if (i >= quantidade) {
      break;
    }
    i += 1;
    saida += caractere((valor >> 18) & 0x3f);
  } while (i < quantidade);
  return saida;
}

/**
 * `gensalt_private( $entrada )` (`class-phpass.php:121-128`).
 *
 * Devolve os 12 caracteres que abrem o hash: `$P$`, o caractere do expoente
 * **deslocado em 5 e limitado a 30**, e 8 caracteres de semeadura.
 */
export function semeaduraDoPhpass(
  bytes: Uint8Array,
  expoente: number = EXPOENTE_DECLARADO_DO_ATESTADO,
): string {
  const indice = Math.min(expoente + DESLOCAMENTO_DO_EXPOENTE, EXPOENTE_MAXIMO);
  return (
    PREFIXO_PORTAVEL + caractere(indice) + codificarComoPhpass(bytes, BYTES_DA_SEMEADURA)
  );
}

/**
 * `crypt_private( $senha, $semeadura )` (`class-phpass.php:131-167`).
 *
 * MD5 **binario** da semeadura mais a senha, depois `2^expoente` voltas de MD5
 * do resumo anterior mais a senha, e a saida e a semeadura de 12 caracteres mais
 * os 22 do resumo. O comentario do proprio legado explica a escolha do MD5
 * (`:155-160`), e ele nao se troca: trocar muda todo atestado gravado.
 *
 * As quatro recusas sao do legado, na ordem dele:
 *
 * 1. prefixo que nao e `$P$` nem `$H$` (`:137-140`);
 * 2. expoente que nao esta no alfabeto, ou esta fora de 7 a 30 (`:141-144`) —
 *    ⚠️ no legado `strpos()` devolve `false` para caractere ausente, e
 *    `false < 7` e verdadeiro, logo o caractere desconhecido cai nesta recusa;
 * 3. semeadura que nao tem 8 caracteres (`:147-150`);
 * 4. e a senha acima do teto, que nem chega aqui — {@link criarHashDoAtestado}
 *    a recusa antes, como o legado (`:215-217` e `:248-250`).
 */
export function cifrarComoPhpass(senha: string, semeadura: string): string {
  const recusa =
    semeadura.slice(0, 2) === CIFRA_RECUSADA ? CIFRA_RECUSADA_DE_RECUSA : CIFRA_RECUSADA;

  const prefixo = semeadura.slice(0, 3);
  if (prefixo !== PREFIXO_PORTAVEL && prefixo !== PREFIXO_PORTAVEL_DE_PHPBB) {
    return recusa;
  }

  const expoente = ALFABETO_DO_PHPASS.indexOf(semeadura.charAt(3));
  if (expoente < EXPOENTE_MINIMO_ACEITO || expoente > EXPOENTE_MAXIMO) {
    return recusa;
  }

  const salgado = semeadura.slice(4, 4 + COMPRIMENTO_DA_SEMEADURA);
  if (salgado.length !== COMPRIMENTO_DA_SEMEADURA) {
    return recusa;
  }

  // ⚠️ A semeadura vai em `latin1`, e nao em `utf8`, porque no legado o que se
  // concatena sao **bytes**: `$salt . $password` e byte a byte. Os 8 caracteres
  // da semeadura de um atestado valido sao do {@link ALFABETO_DO_PHPASS}, que e
  // ASCII, e nele as duas codificacoes coincidem; `latin1` e a que continua
  // coincidindo quando o cookie chega deformado.
  const senhaEmBytes = Buffer.from(senha, 'utf8');
  let resumo = createHash('md5')
    .update(Buffer.concat([Buffer.from(salgado, 'latin1'), senhaEmBytes]))
    .digest();
  for (let volta = 1 << expoente; volta > 0; volta -= 1) {
    resumo = createHash('md5')
      .update(Buffer.concat([resumo, senhaEmBytes]))
      .digest();
  }

  return semeadura.slice(0, 12) + codificarComoPhpass(resumo, 16);
}

/** O comprimento em bytes, que e o que `strlen()` conta. */
function bytesDe(senha: string): number {
  return Buffer.byteLength(senha, 'utf8');
}

/**
 * Compoe o hash do atestado.
 *
 * Nao resolve nada no carregamento e nao guarda estado: a fonte de bytes chega
 * por argumento, e cada chamada a consome na hora (BR-MIGRAR-105, `EXT-CONTEXTO`).
 */
export function criarHashDoAtestado(
  opcoes: OpcoesDoHashDoAtestado = {},
): HashDoAtestado {
  const expoente = opcoes.expoente ?? EXPOENTE_DECLARADO_DO_ATESTADO;
  const fonte =
    opcoes.bytesAleatorios ?? ((quantidade: number) => randomBytes(quantidade));

  return Object.freeze({
    gerar(senha: string): string {
      // `:215-217` — o teto vem antes de qualquer trabalho.
      if (bytesDe(senha) > COMPRIMENTO_MAXIMO_DA_SENHA) {
        return HASH_AUSENTE;
      }
      const hash = cifrarComoPhpass(
        senha,
        semeaduraDoPhpass(fonte(BYTES_DA_SEMEADURA), expoente),
      );
      // `:230-232` — so o hash de 34 caracteres volta; o resto e `'*'`.
      return hash.length === COMPRIMENTO_DO_HASH_PORTAVEL ? hash : HASH_AUSENTE;
    },

    conferir(senha: string, hashGuardado: string): boolean {
      // `:248-250` — acima do teto recusa **sem conferir**.
      if (bytesDe(senha) > COMPRIMENTO_MAXIMO_DA_SENHA) {
        return false;
      }
      const hash = cifrarComoPhpass(senha, hashGuardado);
      // ⚠️ `:252-254` tem, aqui, o recuo para `crypt()` do interpretador. Ele
      // esta declarado no cabecalho deste arquivo como nao portado, e e
      // inalcancavel pelo atestado: `post-template.php:899` recusa tudo que nao
      // comeca em `$P$B` antes de a conferencia acontecer.
      //
      // ⚠️ E a comparacao e `===`, nao comparacao em tempo constante. O
      // comentario do legado diz, com todas as letras, que **nao e** de tempo
      // constante (`:256-258`): a seguranca vem da semeadura imprevisivel.
      // Trocar por comparacao segura muda uma propriedade do produto.
      return hash === hashGuardado;
    },
  });
}

/**
 * O hash do atestado como as duas pontas do legado o instanciam.
 *
 * Nao e estado de modulo: e funcao pura mais a fonte de bytes do runtime, e
 * nenhum trabalho acontece no carregamento.
 */
export const HASH_DO_ATESTADO_DO_NUCLEO: HashDoAtestado = criarHashDoAtestado();
