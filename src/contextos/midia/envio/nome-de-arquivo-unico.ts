/**
 * **CA-1.4**: colisao de nome no destino e resolvida **renomeando**, sem
 * sobrescrever arquivo existente.
 *
 * Entrega de **T003** (US-1). Sao duas funcoes do legado, nesta ordem:
 * `sanitize_file_name()` (`wp-includes/formatting.php:2035`) e
 * `wp_unique_filename()` (`wp-includes/functions.php:2589`), a segunda chamando a
 * primeira na primeira linha.
 *
 * ── POR QUE ESTE ARQUIVO E O MAIS LITERAL DESTA TAREFA ─────────────────────
 *
 * O nome de arquivo e **endereco publico**: ele entra no `guid` do anexo e na
 * URL que o visitante baixa. O cenario de colisao de `PT-014` nao compara so o
 * resultado, compara o **processo**: *"as duas gravam com o mesmo nome final"*,
 * *"o sufixo aplicado e identico nas duas"* e — a linha que decide a forma deste
 * porte — *"quando o envio e repetido tres vezes, a sequencia de nomes gerada e
 * identica nas duas"*. Sequencia identica significa que o contador, a ordem dos
 * tres lacos e o limite de cada um tem de ser os do legado, nao um equivalente.
 *
 * Por isso aqui nao ha simplificacao: `str_replace` com arranjo de busca e
 * aplicado **sequencialmente** como em PHP, `$number` comeca como **cadeia
 * vazia** e nao como zero (e e disso que sai o primeiro sufixo), e os tres lacos
 * tem os limites que o legado lhes deu.
 *
 * ── OS TRES LACOS, E POR QUE SAO TRES ─────────────────────────────────────
 *
 * | laco | contra o que compara | limite | ancora |
 * |---|---|---|---|
 * | 1 | o arquivo com **este** nome existe em disco (e a variante em minusculas) | nenhum — e `while` sobre `file_exists()` | `functions.php:2653` |
 * | 2 | o nome colidiria com nome de **derivada** de um arquivo que ja esta na pasta | a **contagem de arquivos da pasta**, ou `10.000` | `:2719` |
 * | 3 | o nome colidiria depois da **conversao de formato** do editor de imagem | a mesma contagem | `:2789` |
 *
 * Os lacos 2 e 3 nao existem por paranoia: o comentario do legado os justifica —
 * *"Prevent collisions with existing file names that contain dimension-like
 * strings (whether they are subsizes or originals uploaded prior to #42437)"*.
 * Sem eles, enviar `foto.jpg` numa pasta que ja tem `foto-150x150.jpg` produz um
 * anexo cuja derivada **sobrescreve** a derivada do outro.
 *
 * ⚠️ **O que NAO esta portado, e por que:** o `unique_filename_callback` dos
 * `overrides` (`:2612`). Ele e um ponto de extensao publico (P2) e substitui o
 * laco inteiro, mas o caminho do envio de midia **nunca** o passa —
 * `media_handle_upload()` envia `array( 'test_form' => false )` e nada mais
 * (`wp-admin/includes/media.php:296`) — e portar um ponto de extensao sem o
 * barramento que o dispara (`REQ-162`, em `do-not-rewrite.md`) seria declarar
 * contrato sem forma de exercita-lo. Fica **nomeado** aqui, que e o que P2 cobra
 * de quem nao o implementa.
 */

import type { PortaDeSistemaDeArquivos } from '../portas/index.js';
import {
  extensaoPadraoDoTipo,
  tipoPelaExtensao,
  type ListaDeTiposDeArquivo,
} from './tipos-de-arquivo-permitidos.js';

/**
 * As quatro funcoes de `wp-includes/formatting.php` que o nome de arquivo usa.
 *
 * Chegam por argumento e **nao** sao implementadas aqui, pelo mesmo motivo e com
 * o mesmo aviso de `sanitize_title()` em
 * `contextos/conteudo/gravacao/identificador-na-url.ts` e de `sanitize_key()` em
 * `contextos/conteudo/revisao/contexto-de-revisao.ts`: elas sao de
 * `plataforma/formatacao/` (feature 015) e **nenhuma tarefa deste pacote as
 * constroi**. Uma versao aproximada de {@link removerAcentos} produziria nome de
 * arquivo diferente para toda entrada fora do ASCII — e nome de arquivo e
 * endereco publico.
 */
export interface TextoNoEnvio {
  /**
   * `remove_accents( $filename )` (`wp-includes/formatting.php:2037`).
   *
   * E uma tabela de mais de 300 substituicoes mais a transliteracao dependente
   * de `locale`. Transcrever a tabela aqui criaria uma segunda copia dela no
   * repositorio.
   */
  removerAcentos(texto: string): string;

  /**
   * `wp_is_valid_utf8( $filename )` (`wp-includes/formatting.php:2040`).
   *
   * No legado a pergunta e sobre **bytes**, e e por isso que ela chega da borda:
   * no runtime alvo a cadeia ja esta decodificada quando o dominio a recebe, e
   * quem viu os bytes crus do pedido foi o adaptador.
   */
  ehUtf8Valido(texto: string): boolean;

  /**
   * `sanitize_title_with_dashes( $_name )` (`wp-includes/formatting.php:2043`).
   *
   * Consumida **so** no ramo de nome que nao e UTF-8 valido.
   */
  sanitizarTituloComTracos(texto: string): string;

  /**
   * `sanitize_text_field( $name )` (`wp-admin/includes/media.php:316`).
   *
   * Nao e do nome de arquivo: e do **titulo do anexo**, que sai do mesmo nome.
   * Esta nesta interface porque e da mesma pasta do legado e da mesma lacuna.
   */
  sanitizarCampoDeTexto(texto: string): string;
}

/**
 * `$special_chars` — os caracteres que `sanitize_file_name()` **remove**
 * (`wp-includes/formatting.php:2039`, ponto de extensao
 * `sanitize_file_name_chars`).
 *
 * A ordem e a do legado. Ela nao e significativa em `str_replace()` com arranjo
 * de busca e substituicao vazia, e esta transcrita porque a lista esta
 * transcrita. O ultimo elemento e `chr( 0 )`.
 *
 * ⚠️ **Os cinco caracteres fora do ASCII sao dado, nao prosa**: sao o apostrofo
 * tipografico e as quatro aspas que o legado lista literalmente, e eles estao
 * aqui como caractere porque e o caractere que e removido.
 *
 * ⚠️ E `%` e `+` estao nesta lista, o que torna **inalcancavel** a troca de
 * `array( '%20', '+' )` por traco da linha seguinte de `sanitize_file_name()`
 * (`wp-includes/formatting.php:2074`): quando ela roda, os dois ja sairam. Nao e
 * codigo morto no geral — esta lista e ponto de extensao
 * (`sanitize_file_name_chars`, P2) e uma extensao pode retirar `%` dela —, mas e
 * o comportamento de fabrica, e ha teste fixando os dois nomes que ele produz.
 */
export const CARACTERES_REMOVIDOS_DO_NOME: readonly string[] = [
  '?',
  '[',
  ']',
  '/',
  '\\',
  '=',
  '<',
  '>',
  ':',
  ';',
  ',',
  "'",
  '"',
  '&',
  '$',
  '#',
  '*',
  '(',
  ')',
  '|',
  '~',
  '`',
  '!',
  '{',
  '}',
  '%',
  '+',
  '’',
  '«',
  '»',
  '”',
  '“',
  '\u0000',
];

/**
 * `'unnamed-file.'` — o prefixo do nome que o legado inventa quando o nome
 * inteiro e, ele proprio, uma extensao conhecida
 * (`wp-includes/formatting.php:2078`).
 *
 * Caso real: um arquivo chamado `pdf`, sem ponto. O legado testa `test.pdf`,
 * descobre que `pdf` e extensao, e devolve `unnamed-file.pdf` — para que o nome
 * nao fique sem extensao em disco.
 */
export const NOME_SEM_NOME = 'unnamed-file.';

/**
 * `/-(?:\d+x\d+|scaled|rotated)$/` — os sufixos que o legado **reserva** para si
 * (`wp-includes/functions.php:2616` e `:2869`).
 *
 * Um nome enviado que termine em `-800x600`, `-scaled` ou `-rotated` recebe
 * numero **sempre**, mesmo sem colisao nenhuma, porque senao ele seria
 * indistinguivel de uma derivada. E o mesmo padrao que
 * {@link colideComNomeDeDerivada} usa do outro lado.
 */
const SUFIXO_RESERVADO = /-(?:\d+x\d+|scaled|rotated)$/;

/**
 * `wp_get_image_editor_output_format()` de fabrica
 * (`wp-includes/media.php:6542`, ponto de extensao
 * `image_editor_output_format`).
 *
 * ⚠️ **Nao e um mapa vazio, e nao era assim antes.** O proprio legado registra a
 * mudanca: *"@since 6.7.0 The default was changed from an empty array to an
 * array containing the HEIC/HEIF images mime types"*. A consequencia aparece no
 * laco 3: como todo valor do mapa e `image/jpeg`, **enviar um `.jpg` faz o
 * legado conferir tambem `foto.heic`, `foto.heif`, `foto.heics` e
 * `foto.heifs`** — porque qualquer um deles, se existir e for regenerado,
 * produziria derivadas com o nome das deste. Um porte que supusesse mapa vazio
 * geraria outro nome nesse caso.
 */
export const CONVERSAO_DE_FORMATO_DO_EDITOR_DE_FABRICA: ReadonlyMap<
  string,
  string
> = new Map([
  ['image/heic', 'image/jpeg'],
  ['image/heif', 'image/jpeg'],
  ['image/heic-sequence', 'image/jpeg'],
  ['image/heif-sequence', 'image/jpeg'],
]);

/**
 * `$count = 10000` — o limite dos lacos 2 e 3 quando a pasta nao pode ser lida
 * (`wp-includes/functions.php:2684`).
 *
 * E numero do legado, nao escolha deste porte (P6): ele vem do comentario
 * *"Ensure this never goes into infinite loop as it uses pathinfo() and regex in
 * the check, but string replacement for the changes"*. Quando a pasta **pode**
 * ser lida e nao esta vazia, o limite passa a ser a contagem de arquivos dela.
 */
export const LIMITE_DE_TENTATIVAS_SEM_LISTAGEM = 10000;

/**
 * `sanitize_file_name( $filename )` (`wp-includes/formatting.php:2035`).
 *
 * A ordem das transformacoes e observavel: `remove_accents` antes da remocao de
 * caracteres, a remocao antes da troca de `%20` e `+` por traco, e o `trim` de
 * `.-_` por ultimo. Trocar duas delas muda o nome de entradas reais — por
 * exemplo, `trim` antes da colapsacao de tracos deixaria traco no fim.
 *
 * `listaPermitida` e `get_allowed_mime_types()` (`:2096`), consultada **so** no
 * laco das extensoes intermediarias; `lista` e `wp_get_mime_types()` (`:2076`),
 * consultada **so** no caso do nome sem ponto. Sao duas listas diferentes no
 * legado, na mesma funcao.
 */
export function sanitizarNomeDeArquivo(
  nomeCru: string,
  texto: TextoNoEnvio,
  lista: ListaDeTiposDeArquivo,
  listaPermitida: ListaDeTiposDeArquivo,
): string {
  let nome = texto.removerAcentos(nomeCru);

  if (!texto.ehUtf8Valido(nome)) {
    const extensao = extensaoDeNome(nome);
    const semExtensao = nomeSemExtensao(nome);
    nome = `${texto.sanitizarTituloComTracos(semExtensao)}.${extensao}`;
  }

  /*
    `preg_replace( '#\p{Zs}#siu', ' ', $filename )` (`:2057`), dentro de
    `_wp_can_use_pcre_u()`. A categoria `Zs` do Unicode e o que o legado chama de
    "space characters", e trocar por `\s` mudaria o resultado: `\s` pega `\t`,
    `\n` e `\r`, que NAO sao `Zs` e que a linha de baixo trata com outro
    caractere de substituicao.
  */
  nome = nome.replace(/\p{Zs}/gu, ' ');

  for (const caractere of CARACTERES_REMOVIDOS_DO_NOME) {
    nome = nome.split(caractere).join('');
  }
  nome = nome.split('%20').join('-').split('+').join('-');
  nome = nome.replace(/\.{2,}/g, '.');
  nome = nome.replace(/[\r\n\t -]+/g, '-');
  nome = aparar(nome, '.-_');

  if (!nome.includes('.')) {
    const tipo = tipoPelaExtensao(`test.${nome}`, lista);
    if (tipo.reconhecido && tipo.extensao === nome) {
      nome = NOME_SEM_NOME + tipo.extensao;
    }
  }

  const partes = nome.split('.');
  if (partes.length <= 2) {
    return nome;
  }

  /*
    "Loop over any intermediate extensions. Postfix them with a trailing
    underscore if they are a 2 - 5 character long alpha string not in the allowed
    extension list." (`:2099`) — e e isso que faz `exploit.php.jpg` virar
    `exploit.php_.jpg`.
  */
  let montado = partes.shift() ?? '';
  const extensaoFinal = partes.pop() ?? '';

  for (const parte of partes) {
    montado += `.${parte}`;

    if (/^[a-zA-Z]{2,5}\d?$/.test(parte)) {
      const permitida = listaPermitida.some((entrada) =>
        new RegExp(`^(${entrada.padraoDeExtensao})$`, 'i').test(parte),
      );
      if (!permitida) {
        montado += '_';
      }
    }
  }

  return `${montado}.${extensaoFinal}`;
}

/** O que `wp_unique_filename()` devolve, com o que o ponto de extensao recebe. */
export interface NomeDeArquivoResolvido {
  /** O nome final, ja sanitizado e ja unico na pasta. */
  readonly nome: string;
  /**
   * `$ext` — a extensao **com ponto**, na caixa em que ela chegou, ou cadeia
   * vazia. Quarto argumento do ponto de extensao `wp_unique_filename`
   * (`wp-includes/functions.php:2832`).
   */
  readonly extensao: string;
  /**
   * `$number` — o maior numero usado, ou cadeia vazia quando nenhum foi
   * (`:2832`). `''` e `0` nao sao a mesma coisa aqui: `''` significa *"nao houve
   * colisao"*, e e dele que sai o **primeiro** sufixo `-1`.
   */
  readonly numero: number | '';
  /**
   * `$alt_filenames` — os nomes alternativos conferidos no laco 3, por extensao.
   *
   * Existe porque o ponto de extensao os recebe (P2), e porque e por eles que se
   * confere, em teste, que o laco 3 rodou com o conjunto certo.
   */
  readonly nomesAlternativos: ReadonlyMap<string, string>;
}

/** O que o calculo do nome unico precisa saber. */
export interface PedidoDeNomeUnico {
  /** `$dir` — a pasta de destino, caminho absoluto. */
  readonly pasta: string;
  /** `$filename` — o nome como chegou, ainda sem sanitizar. */
  readonly nomeDeArquivo: string;
  /** `wp_get_mime_types()`. */
  readonly lista: ListaDeTiposDeArquivo;
  /** `get_allowed_mime_types()`. */
  readonly listaPermitida: ListaDeTiposDeArquivo;
  /** `wp_get_image_editor_output_format()`, para o laco 3. */
  readonly conversaoDeFormato?: ReadonlyMap<string, string>;
}

/**
 * `wp_unique_filename( $dir, $filename )` (`wp-includes/functions.php:2589`).
 *
 * **Nao grava nada e nao reserva nada**, e e por isso que o cenario
 * `@concorrencia` de `PT-014` — *"dois envios simultaneos do mesmo nome nao se
 * sobrescrevem"* — nao fecha aqui: no legado tambem nao fecha, porque entre o
 * calculo do nome e o `move_uploaded_file()` nao ha trava nenhuma. Introduzir
 * uma seria introduzir comportamento que o legado nao tem.
 */
export function nomeDeArquivoUnico(
  pedido: PedidoDeNomeUnico,
  sistemaDeArquivos: PortaDeSistemaDeArquivos,
  texto: TextoNoEnvio,
): NomeDeArquivoResolvido {
  let nome = sanitizarNomeDeArquivo(
    pedido.nomeDeArquivo,
    texto,
    pedido.lista,
    pedido.listaPermitida,
  );

  let numero: number | '' = '';
  const nomesAlternativos = new Map<string, string>();

  const extensaoCrua = extensaoDeNome(nome);
  const extensao = extensaoCrua === '' ? '' : `.${extensaoCrua}`;
  // "Edge case: if file is named '.ext', treat as an empty name." (`:2604`)
  const base = nome === extensao ? '' : nome;

  const semExtensao = nomeSemExtensao(nome);

  // "Always append a number to file names that can potentially match image
  // sub-size file names." (`:2616`)
  if (semExtensao !== '' && SUFIXO_RESERVADO.test(semExtensao)) {
    numero = 1;
    nome = substituirPhp(
      nome,
      [`${semExtensao}${extensao}`],
      `${semExtensao}-${numero}${extensao}`,
    );
  }

  const tipo = tipoPelaExtensao(nome, pedido.listaPermitida);
  const tipoMime = tipo.reconhecido ? tipo.tipoMime : '';
  const ehImagem = tipoMime !== '' && tipoMime.startsWith('image/');

  const extensaoMinuscula = extensao.toLowerCase();
  const pastaComBarra = comBarraNoFim(pedido.pasta);

  /*
    "If the extension is uppercase add an alternate file name with lowercase
    extension. Both need to be tested for uniqueness as the extension will be
    changed to lowercase for better compatibility with different filesystems."
    (`:2641`)
  */
  let nomeEmMinusculas: string | null =
    extensao !== '' && extensaoMinuscula !== extensao
      ? trocarSufixo(nome, extensao, extensaoMinuscula)
      : null;

  // ── Laco 1: o arquivo com este nome existe? (`:2653`) ────────────────────
  while (
    sistemaDeArquivos.existe(pastaComBarra + nome) ||
    (nomeEmMinusculas !== null &&
      sistemaDeArquivos.existe(pastaComBarra + nomeEmMinusculas))
  ) {
    const novoNumero = inteiroDoNumero(numero) + 1;

    if (nomeEmMinusculas !== null) {
      nomeEmMinusculas = substituirPhp(
        nomeEmMinusculas,
        [`-${numero}${extensaoMinuscula}`, `${numero}${extensaoMinuscula}`],
        `-${novoNumero}${extensaoMinuscula}`,
      );
    }

    if (`${numero}${extensao}` === '') {
      nome = `${nome}-${novoNumero}`;
    } else {
      nome = substituirPhp(
        nome,
        [`-${numero}${extensao}`, `${numero}${extensao}`],
        `-${novoNumero}${extensao}`,
      );
    }

    numero = novoNumero;
  }

  // "Change the extension to lowercase if needed." (`:2676`)
  if (nomeEmMinusculas !== null) {
    nome = nomeEmMinusculas;
  }

  // ── Laco 2: colisao com nome de derivada de arquivo que ja esta la ───────
  let arquivosDaPasta: readonly string[] = [];
  let limite = LIMITE_DE_TENTATIVAS_SEM_LISTAGEM;

  /*
    A condicao inteira do legado (`:2687`), com as quatro perguntas: nome,
    extensao, a pasta existe, e a pasta esta DENTRO da area de envios. A ultima e
    `str_contains( $dir, $upload_dir['basedir'] )`: fora da area de envios o
    legado nao lista nada, e o limite fica em 10.000 — o que importa para o
    laco 3, que usa o mesmo limite.
  */
  if (
    base !== '' &&
    extensao !== '' &&
    sistemaDeArquivos.ehPasta(pedido.pasta) &&
    pedido.pasta.includes(sistemaDeArquivos.raizDeEnvios)
  ) {
    const listagem = sistemaDeArquivos.listar(pedido.pasta);
    // A falha de listagem e o `@scandir()` que devolve `false`: lista vazia, e
    // o limite permanece o de fabrica (P7 — a falha e silenciosa e nao desvia).
    arquivosDaPasta = listagem.concluido ? listagem.valor : [];

    if (arquivosDaPasta.length > 0) {
      limite = arquivosDaPasta.length;

      let tentativa = 0;
      while (
        tentativa <= limite &&
        colideComNomeDeDerivada(nome, arquivosDaPasta)
      ) {
        const novoNumero = inteiroDoNumero(numero) + 1;
        // "If $ext is uppercase it was replaced with the lowercase version after
        // the previous loop." (`:2727`)
        nome = substituirPhp(
          nome,
          [`-${numero}${extensaoMinuscula}`, `${numero}${extensaoMinuscula}`],
          `-${novoNumero}${extensaoMinuscula}`,
        );
        numero = novoNumero;
        tentativa += 1;
      }
    }
  }

  // ── Laco 3: colisao depois da conversao de formato do editor ─────────────
  if (ehImagem) {
    const conversao =
      pedido.conversaoDeFormato ?? CONVERSAO_DE_FORMATO_DO_EDITOR_DE_FABRICA;
    const tiposAlternativos = tiposDeConversaoACondiderar(conversao, tipoMime);

    for (const tipoAlternativo of tiposAlternativos) {
      const extensaoAlternativa = extensaoPadraoDoTipo(
        tipoAlternativo,
        pedido.lista,
      );
      if (extensaoAlternativa === null) {
        continue;
      }
      const comPonto = `.${extensaoAlternativa}`;
      nomesAlternativos.set(
        comPonto,
        trocarSufixo(nome, extensaoMinuscula, comPonto),
      );
    }

    if (nomesAlternativos.size > 0) {
      // "Add the original filename. It needs to be checked again together with
      // the alternate filenames when $number is incremented." (`:2782`)
      nomesAlternativos.set(extensaoMinuscula, nome);

      let tentativa = 0;
      while (
        tentativa <= limite &&
        algumNomeAlternativoColide(
          nomesAlternativos,
          pastaComBarra,
          arquivosDaPasta,
          sistemaDeArquivos,
        )
      ) {
        const novoNumero = inteiroDoNumero(numero) + 1;

        for (const [extensaoAlternativa, nomeAlternativo] of [
          ...nomesAlternativos,
        ]) {
          nomesAlternativos.set(
            extensaoAlternativa,
            substituirPhp(
              nomeAlternativo,
              [
                `-${numero}${extensaoAlternativa}`,
                `${numero}${extensaoAlternativa}`,
              ],
              `-${novoNumero}${extensaoAlternativa}`,
            ),
          );
        }

        nome = substituirPhp(
          nome,
          [`-${numero}${extensaoMinuscula}`, `${numero}${extensaoMinuscula}`],
          `-${novoNumero}${extensaoMinuscula}`,
        );

        numero = novoNumero;
        tentativa += 1;
      }
    }
  }

  return { nome, extensao, numero, nomesAlternativos };
}

/**
 * `_wp_check_existing_file_names( $filename, $files )`
 * (`wp-includes/functions.php:2870`).
 *
 * *"Helper function to check if a file name could match an existing image
 * sub-size file name."* O nome vazio devolve falso (`:2875`), e a comparacao e
 * **insensivel a caixa**, como o `i` do legado.
 */
export function colideComNomeDeDerivada(
  nomeDeArquivo: string,
  arquivos: readonly string[],
): boolean {
  const semExtensao = nomeSemExtensao(nomeDeArquivo);
  const extensaoCrua = extensaoDeNome(nomeDeArquivo);

  if (semExtensao === '') {
    return false;
  }

  const extensao = extensaoCrua === '' ? '' : `.${extensaoCrua}`;
  const padrao = new RegExp(
    `^${escaparParaRegex(semExtensao)}-(?:\\d+x\\d+|scaled|rotated)${escaparParaRegex(extensao)}$`,
    'i',
  );

  return arquivos.some((arquivo) => padrao.test(arquivo));
}

/**
 * `_wp_check_alternate_file_names( $filenames, $dir, $files )`
 * (`wp-includes/functions.php:2843`).
 *
 * As duas perguntas por nome, na ordem do legado: existe em disco, e colide com
 * nome de derivada da listagem.
 */
function algumNomeAlternativoColide(
  nomesAlternativos: ReadonlyMap<string, string>,
  pastaComBarra: string,
  arquivosDaPasta: readonly string[],
  sistemaDeArquivos: PortaDeSistemaDeArquivos,
): boolean {
  for (const nomeAlternativo of nomesAlternativos.values()) {
    if (sistemaDeArquivos.existe(pastaComBarra + nomeAlternativo)) {
      return true;
    }
    if (
      arquivosDaPasta.length > 0 &&
      colideComNomeDeDerivada(nomeAlternativo, arquivosDaPasta)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Os tipos cuja conversao faria o nome colidir (`wp-includes/functions.php:2745`
 * a `:2765`).
 *
 * Os dois ramos do legado, na ordem, mais o `array_unique( array_diff( ... ) )`
 * que retira o proprio tipo. `array_intersect` compara **valor** e preserva a
 * chave, logo o que sai sao tipos **de origem** da conversao.
 */
function tiposDeConversaoACondiderar(
  conversao: ReadonlyMap<string, string>,
  tipoMime: string,
): readonly string[] {
  const destino = conversao.get(tipoMime);
  const tipos: string[] = [];

  if (destino !== undefined && destino !== '') {
    // "The image will be converted to this format/mime type." (`:2749`)
    for (const [origem, alvo] of conversao) {
      if (alvo === tipoMime || alvo === destino) {
        tipos.push(origem);
      }
    }
    tipos.push(destino);
  } else if (conversao.size > 0) {
    for (const [origem, alvo] of conversao) {
      if (alvo === tipoMime) {
        tipos.push(origem);
      }
    }
  }

  // "Remove duplicates and the original mime type. It will be added later if
  // needed." (`:2764`)
  const vistos = new Set<string>();
  return tipos.filter((candidato) => {
    if (candidato === tipoMime || vistos.has(candidato)) {
      return false;
    }
    vistos.add(candidato);
    return true;
  });
}

/* ── AS PRIMITIVAS DE PHP QUE ESTE ARQUIVO PRECISA ───────────────────────────
   Estao aqui, e nao em `plataforma/`, porque cada uma e consumida so por este
   caminho e porque o que elas reproduzem e a SEMANTICA do PHP, nao uma regra do
   produto. Quando `plataforma/formatacao/` existir (feature 015), e la que elas
   passam a morar — e a troca nao muda comportamento nenhum. */

/**
 * `str_replace()` com arranjo de busca e substituicao unica.
 *
 * ⚠️ **E sequencial, e isso e observavel.** PHP aplica a primeira busca sobre o
 * texto, a segunda sobre o **resultado** da primeira, e assim por diante. Os
 * dois lacos de numeracao dependem disso: a busca e
 * `array( "-{$number}{$ext}", "{$number}{$ext}" )`, e com `$number` vazio a
 * primeira (`-.jpg`) raramente casa e a segunda (`.jpg`) casa — mas quando a
 * primeira casa, a segunda **ainda roda** sobre o resultado. Um `replace` unico
 * com alternativa produziria outro nome.
 */
function substituirPhp(
  texto: string,
  buscas: readonly string[],
  substituicao: string,
): string {
  let resultado = texto;
  for (const busca of buscas) {
    if (busca === '') {
      continue;
    }
    resultado = resultado.split(busca).join(substituicao);
  }
  return resultado;
}

/** `(int) $number` — cadeia vazia vale `0` em PHP. */
function inteiroDoNumero(numero: number | ''): number {
  return numero === '' ? 0 : numero;
}

/** `pathinfo( $nome, PATHINFO_EXTENSION )` — sem o ponto, ou cadeia vazia. */
function extensaoDeNome(nome: string): string {
  const ponto = nome.lastIndexOf('.');
  return ponto === -1 ? '' : nome.slice(ponto + 1);
}

/** `pathinfo( $nome, PATHINFO_FILENAME )` — tudo antes do ultimo ponto. */
function nomeSemExtensao(nome: string): string {
  const ponto = nome.lastIndexOf('.');
  return ponto === -1 ? nome : nome.slice(0, ponto);
}

/** `trim( $texto, $caracteres )` — nas duas pontas. */
function aparar(texto: string, caracteres: string): string {
  let inicio = 0;
  let fim = texto.length;
  while (inicio < fim && caracteres.includes(texto.charAt(inicio))) {
    inicio += 1;
  }
  while (fim > inicio && caracteres.includes(texto.charAt(fim - 1))) {
    fim -= 1;
  }
  return texto.slice(inicio, fim);
}

/** `trailingslashit()` — uma barra no fim, nunca duas. */
function comBarraNoFim(caminho: string): string {
  return caminho.endsWith('/') ? caminho : `${caminho}/`;
}

/**
 * `preg_replace( '|' . preg_quote( $sufixo ) . '$|', $novo, $texto )` — troca o
 * sufixo, e so no fim (`wp-includes/functions.php:2648` e `:2776`).
 */
function trocarSufixo(texto: string, sufixo: string, novo: string): string {
  if (sufixo === '' || !texto.endsWith(sufixo)) {
    return texto;
  }
  return texto.slice(0, texto.length - sufixo.length) + novo;
}

/** `preg_quote()`, para os dois padroes que este arquivo monta. */
function escaparParaRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\\-#&!<>:=/]/g, '\\$&');
}
