/**
 * **CA-3.1** e **CA-3.4**: gerar uma derivada para cada tamanho declarado, e
 * guardar no registro do anexo o nome do arquivo e as medidas **reais** de cada
 * uma.
 *
 * Entrega de **T007** da feature `006-biblioteca-de-midia` (US-3). E
 * `_wp_make_subsizes( $new_sizes, $file, $image_meta, $attachment_id )`
 * (`wp-admin/includes/image.php:430`), que e o laco que todos os caminhos de
 * geracao atravessam: a ingestao (`:412`), a regeracao do que falta (`:181`) e a
 * previa de PDF (`:725`).
 *
 * ---
 *
 * # Os passos, na ordem do legado
 *
 * | # | passo | ancora | por que a ordem importa |
 * |---|---|---|---|
 * | 1 | metadado vazio ou que nao e arranjo devolve `array()` | `:431` | *"Not an image attachment"* — e **nao** devolve o metadado recebido |
 * | 2 | salta tamanho cujo **nome** ja esta em `sizes` | `:436`-`:449` | so o nome, nunca as medidas — ver abaixo |
 * | 3 | nada a fazer devolve o metadado **com `sizes` presente** | `:453` | o `else` do passo 2 acrescenta `sizes` vazio, e isso vai para a coluna |
 * | 4 | reordena por prioridade | `:458`-`:469` | decide a **ordem das chaves** em `sizes`, que e byte |
 * | 5 | abre a imagem; falha devolve o metadado | `:470`-`:475` | *"The image cannot be edited"* (`:474`), em silencio |
 * | 6 | rotaciona pela orientacao do EXIF, se houver EXIF | `:478`-`:485` | muda as medidas de **todas** as derivadas |
 * | 7 | uma derivada por tamanho, gravando o metadado **a cada uma** | `:487`-`:500` | e o que torna `M4` observavel: o anexo fica com as derivadas que deram |
 *
 * ---
 *
 * # Tres coisas que um porte perde aqui, e as tres sao observaveis
 *
 * 1. **A comparacao do passo 2 e por NOME, e o legado explica por que:** *"Only
 *    checks 'size name' so we don't override existing images even if the
 *    dimensions don't match the currently defined size with the same name. ...
 *    However we keep the old sub-sizes with the previous dimensions as the image
 *    may have been used in an older post"* (`:440` e `:131`). Trocar a medida de
 *    `medium` na tela de configuracao **nao** regera a derivada antiga: ela fica,
 *    com as medidas velhas, e o nome do arquivo dela continua sendo o endereco
 *    publicado em conteudo antigo.
 * 2. **A ordem do passo 4 nao e a ordem em que os tamanhos sao registrados**, e
 *    o comentario do legado diz para que ela serve: *"This ensures there is an
 *    appropriate sub-size the user can access immediately even when there was an
 *    error and not all sub-sizes were created"* (`:459`). Como o metadado e
 *    gravado **a cada** derivada, essa e a ordem das chaves de `sizes` na coluna
 *    — e a ordem das chaves e byte a byte observavel, porque o valor e
 *    serializado no formato do PHP (`DB-SER`, BR-MIGRAR-082).
 * 3. **A gravacao do passo 7 e uma por derivada, nao uma no fim.** Sao N
 *    escritas, e elas existem exatamente para que um tempo limite no meio do
 *    laco deixe o anexo com as derivadas que couberam — que e o estado que
 *    `wp_get_missing_image_subsizes()` depois conserta (CA-3.3). Gravar uma vez
 *    no fim produziria o mesmo metadado final e um sistema que perde tudo na
 *    interrupcao, e a area 3 da Decisao 2 de `parity_specs.md` compara
 *    *"snapshot + sequencia de comandos"*.
 *
 * ---
 *
 * # ⚠️ `M4`: as duas falhas silenciosas desta tarefa
 *
 * Dos cinco `// TODO: Log errors.` de `M4` (BR-MIGRAR-060), **dois estao neste
 * laco**: `image.php:483` (a rotacao por EXIF falhou) e `:492` (a derivada
 * falhou). Os dois sao reproduzidos aqui como estao — sem registro, sem aviso e
 * **sem desviar o fluxo**: o laco continua no proximo tamanho, e o tamanho que
 * falhou simplesmente **nao entra** no metadado. E o que o cenario
 * `@divida-herdada` de `parity_tests/14-ingestao-e-derivadas-de-midia.feature`
 * cobra: *"nenhuma das duas avisa o ator"*, *"nenhuma das duas registra erro em
 * arquivo de log"* e *"o metadado gravado omite o tamanho que falhou"*.
 *
 * O P7 da constituicao permite **acrescentar** registro, e proibe o fluxo passar
 * a depender dele. Informar o ator (CA-5.2) e a **pergunta em aberto** de US-5,
 * e nao se decide aqui — ver a secao *O que T001 encontrou aberto* de
 * `../README.md`.
 */

import {
  arranjoPorNome,
  nomeDaChave,
  type EntradaDeArranjo,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import {
  atribuirChave,
  CHAVE_DAS_DERIVADAS,
  comDerivada,
  verdadeiroComoNoPhp,
  type DerivadaDeImagem,
} from '../armazenamento/index.js';
import type { ImagemAberta } from '../portas/index.js';
import type { TamanhoDeImagem } from '../tamanhos/index.js';
import type { ContextoDeDerivadas } from './contexto-de-derivadas.js';
import { dimensoesDeRedimensionamento } from './dimensoes-de-redimensionamento.js';
import {
  caminhoDaDerivada,
  formatoDeSaidaDaDerivada,
} from './nome-da-derivada.js';
import { rotacionarPorOrientacaoExif } from './orientacao-exif.js';

/**
 * `$priority` — a ordem em que as derivadas sao criadas
 * (`wp-admin/includes/image.php:462`).
 *
 * Quatro nomes, nesta ordem, e **so** estes quatro: todo tamanho que nao esta
 * aqui e criado depois, na ordem em que foi registrado.
 */
export const TAMANHOS_PRIORITARIOS = [
  'medium',
  'large',
  'thumbnail',
  'medium_large',
] as const;

/** O que a geracao de derivadas precisa saber. */
export interface PedidoDeDerivadas {
  /** `$attachment_id` — o anexo cujo metadado e gravado a cada derivada. */
  readonly anexoId: number;
  /**
   * `$file` — o caminho **absoluto** do arquivo de onde as derivadas saem.
   *
   * 🔴 **Qual arquivo e este quando houve reducao na ingestao e conflito
   * aberto**, e esta funcao **nao o resolve**: a `spec.md` (CA-4.3) e o fluxo
   * alternativo de UC-12 dizem que as derivadas saem da copia reduzida, e a
   * arvore analisada passa o caminho do **original**
   * (`wp-admin/includes/image.php:412`), com o comentario de `:337` dizendo que
   * e de proposito. Nao ha decisao humana registrada, e o P1 exige uma. A
   * decisao cabe inteira em quem chama — ver a secao *O que T001 encontrou
   * aberto* de `../README.md`, e `criar-derivadas-na-ingestao.ts`.
   */
  readonly caminho: string;
  /** `$new_sizes` — os tamanhos a criar, de `tamanhos-registrados.ts`. */
  readonly tamanhos: ReadonlyMap<string, TamanhoDeImagem>;
  /** `$image_meta` — o metadado como esta na coluna, a verdade (T002). */
  readonly metadado: ValorPhp;
}

/**
 * `_wp_make_subsizes()` (`wp-admin/includes/image.php:430`).
 *
 * Devolve o metadado com `sizes` atualizado. **Nao lanca**: toda falha e
 * silencio, por `M4` (ver o cabecalho).
 */
export function gerarDerivadas(
  contexto: ContextoDeDerivadas,
  pedido: PedidoDeDerivadas,
): ValorPhp {
  // ── 1. "Not an image attachment." (`:431`) ───────────────────────────────
  if (pedido.metadado.tipo !== 'arranjo' || !verdadeiroComoNoPhp(pedido.metadado)) {
    return arranjoPorNome([]);
  }

  let metadado: ValorPhp = pedido.metadado;
  const aCriar = new Map(pedido.tamanhos);

  // ── 2. "Check if any of the new sizes already exist." (`:436`) ───────────
  const derivadasAtuais = valorDaChave(metadado, CHAVE_DAS_DERIVADAS);
  if (derivadasAtuais !== null && derivadasAtuais.tipo === 'arranjo') {
    for (const entrada of derivadasAtuais.entradas) {
      aCriar.delete(nomeDaChave(entrada.chave));
    }
  } else {
    /*
      `$image_meta['sizes'] = array();` (`:449`). Entra como chave nova, no fim,
      pela regra de posicao de `atribuirChave()` — e vai para a coluna assim no
      passo 3, se nao houver nada a criar.
    */
    metadado = atribuirChave(metadado, CHAVE_DAS_DERIVADAS, arranjoPorNome([]));
  }

  // ── 3. "Nothing to do..." (`:453`) ───────────────────────────────────────
  if (aCriar.size === 0) {
    return metadado;
  }

  // ── 4. A reordenacao por prioridade (`:458`) ─────────────────────────────
  const ordenados = ordenarPorPrioridade(aCriar);

  // ── 5. "The image cannot be edited." (`:470`) ────────────────────────────
  const aberta = contexto.processamentoDeImagem.abrir(pedido.caminho);
  if (!aberta.concluido) {
    return metadado;
  }
  const imagem = aberta.valor;

  // ── 6. "If stored EXIF data exists, rotate the source image before
  //       creating sub-sizes." (`:478`) ──────────────────────────────────────
  const metadadoDeImagem = valorDaChave(metadado, 'image_meta');
  if (metadadoDeImagem !== null && verdadeiroComoNoPhp(metadadoDeImagem)) {
    const rotacao = rotacionarPorOrientacaoExif(
      imagem,
      contexto.leituraDoArquivo.orientacaoExif?.(pedido.caminho) ?? null,
    );
    if (!rotacao.concluido) {
      /*
        `// TODO: Log errors.` (`:483`) — o primeiro dos dois pontos de `M4`
        deste laco. Nada e registrado, nada e avisado, e o fluxo **segue**: as
        derivadas sao geradas da imagem nao rotacionada, que e o que o legado
        faz. Ver o cabecalho.
      */
    }
  }

  /*
    `if ( method_exists( $editor, 'make_subsize' ) )` (`:487`). O `else` cai em
    `multi_resize()` (`:501`), que **grava o metadado uma vez so, no fim**
    (`:505`) em vez de uma vez por derivada. Ele existe para implementacao de
    terceiro anterior a 5.3, e nao e alcancavel aqui: a porta de T001 declara
    `derivar` como obrigatoria, logo toda implementacao a tem. Fica nomeado
    porque a diferenca entre os dois ramos e **efeito no banco**.
  */

  // ── 7. Uma derivada por tamanho, gravando a cada uma (`:488`) ────────────
  for (const [nome, tamanho] of ordenados) {
    const derivada = gerarUma(contexto, pedido.caminho, imagem, tamanho);

    if (derivada === null) {
      /*
        `// TODO: Log errors.` (`:492`) — o segundo ponto de `M4` deste laco. O
        tamanho **nao entra** no metadado e o laco continua. Nenhuma escrita sai
        daqui: no legado a gravacao esta dentro do `else` do erro (`:496`).
      */
      continue;
    }

    metadado = comDerivada(metadado, nome, derivada);
    contexto.armazenamento.metadadoDeAnexo.gravarMetadado(
      pedido.anexoId,
      metadado,
    );
  }

  return metadado;
}

/**
 * `array_filter( array_merge( $priority, $new_sizes ) )`
 * (`wp-admin/includes/image.php:469`).
 *
 * `array_merge` com chave de texto **preserva a posicao da primeira
 * ocorrencia** e substitui o valor, logo os quatro prioritarios ficam na frente
 * na ordem de `$priority` e o resto segue na ordem de `$new_sizes`. O
 * `array_filter` sem callback retira os prioritarios que nao estavam em
 * `$new_sizes`, porque o valor deles e `null` — e nao retira nenhum tamanho
 * real, porque o arranjo de medidas e sempre verdadeiro no PHP.
 */
function ordenarPorPrioridade(
  aCriar: ReadonlyMap<string, TamanhoDeImagem>,
): ReadonlyMap<string, TamanhoDeImagem> {
  const ordenados = new Map<string, TamanhoDeImagem>();

  for (const nome of TAMANHOS_PRIORITARIOS) {
    const tamanho = aCriar.get(nome);
    if (tamanho !== undefined) {
      ordenados.set(nome, tamanho);
    }
  }

  for (const [nome, tamanho] of aCriar) {
    if (!ordenados.has(nome)) {
      ordenados.set(nome, tamanho);
    }
  }

  return ordenados;
}

/**
 * `WP_Image_Editor::make_subsize( $size_data )`
 * (`wp-includes/class-wp-image-editor-gd.php:308`), do lado de quem chama.
 *
 * `null` e o `WP_Error` do legado: a derivada **nao** entra no metadado e nada e
 * registrado.
 *
 * Tres coisas acontecem aqui e nao na porta, e as tres pela mesma razao — nome
 * de arquivo e endereco publico:
 *
 * 1. **as medidas reais** sao calculadas por
 *    `dimensoes-de-redimensionamento.ts`, porque e delas que sai o sufixo
 *    `-{largura}x{altura}`;
 * 2. **o formato de saida** e resolvido por `nome-da-derivada.ts`, porque ele
 *    decide a extensao;
 * 3. **o caminho** e montado e entregue pronto a porta, que declara no cabecalho
 *    dela que nao gera nome.
 *
 * ⚠️ **A derivada que o calculo recusa nao chega a porta.** No legado ela
 * chega: `_resize()` chama o mesmo calculo e devolve
 * `error_getting_dimensions` — *"Could not calculate resized image
 * dimensions"* (`class-wp-image-editor-gd.php:225`) —, que `make_subsize()`
 * devolve como erro e o laco descarta em silencio. O observavel e identico
 * (nenhum arquivo, nenhuma entrada no metadado, nenhum aviso); o que muda e
 * **uma chamada a menos na porta de imagem**, e ela nao pode ser feita porque
 * sem as medidas nao ha nome de arquivo para passar.
 *
 * ⚠️ **A medida `0` e passada como `0`, nao como `null`.** `make_subsize()`
 * converte para `null` so a chave **ausente** (`:315`-`:323`), e tamanho
 * registrado nunca tem chave ausente: `medium_large` chega `768x0`
 * (`wp-admin/includes/schema.php:533`). Os dois valores decidem o mesmo nas
 * guardas do calculo, e trocar um pelo outro aqui mudaria o que a porta
 * recebe.
 */
function gerarUma(
  contexto: ContextoDeDerivadas,
  caminhoDaOrigem: string,
  imagem: ImagemAberta,
  tamanho: TamanhoDeImagem,
): DerivadaDeImagem | null {
  const origem = imagem.dimensoes();

  const medidas = dimensoesDeRedimensionamento(
    origem.largura,
    origem.altura,
    tamanho.largura,
    tamanho.altura,
    tamanho.recorte,
  );

  if (medidas === null) {
    return null;
  }

  const formato = formatoDeSaidaDaDerivada({
    caminhoDaOrigem,
    tipoMimeDaOrigem: imagem.tipoMime(),
    suporta: (tipoMime) =>
      contexto.processamentoDeImagem.suporta(tipoMime),
    ...(contexto.conversaoDeFormatoDoEditor === undefined
      ? {}
      : { conversaoDeFormato: contexto.conversaoDeFormatoDoEditor }),
    ...(contexto.tiposDeArquivo === undefined
      ? {}
      : { tiposDeArquivo: contexto.tiposDeArquivo }),
  });

  const caminho = caminhoDaDerivada(
    caminhoDaOrigem,
    medidas.larguraDeDestino,
    medidas.alturaDeDestino,
    formato.extensao,
  );

  const gravada = imagem.derivar(
    {
      largura: tamanho.largura,
      altura: tamanho.altura,
      recorte: tamanho.recorte,
    },
    caminho,
  );

  if (!gravada.concluido) {
    return null;
  }

  /*
    As medidas que vao para o metadado sao as que a porta DEVOLVEU, nao as
    calculadas — CA-3.4 cobra *"as medidas reais"*, e no legado as duas saem do
    mesmo calculo e portanto nunca divergem (ver
    `dimensoes-de-redimensionamento.ts`). `filesize` entra sempre porque
    `_save()` sempre o devolve desde a versao 6.0
    (`class-wp-image-editor-gd.php:593`); a opcionalidade do campo em
    `DerivadaDeImagem` e para o metadado **lido**, gravado por versao anterior.
  */
  return {
    nomeDeArquivo: gravada.valor.nomeDeArquivo,
    largura: gravada.valor.largura,
    altura: gravada.valor.altura,
    tipoMime: gravada.valor.tipoMime,
    bytes: gravada.valor.bytes,
  };
}

/**
 * O valor de uma chave nomeada do arranjo, ou `null`.
 *
 * ⚠️ **E a gemea da funcao privada de `../armazenamento/derivadas.ts`**, e a
 * repeticao e deliberada: la ela e privada, e exporta-la mudaria um arquivo de
 * **T002** — que e contrato merged e disputado pelas ondas de T005 e T009. A
 * comparacao e a mesma, pelo nome normalizado, porque `$a['5']` e `$a[5]` sao a
 * mesma chave na origem. Quando `plataforma/utilitarios/` existir, as duas
 * descem juntas.
 */
function valorDaChave(arranjo: ValorPhp, nome: string): ValorPhp | null {
  if (arranjo.tipo !== 'arranjo') {
    return null;
  }
  const entradas: readonly EntradaDeArranjo[] = arranjo.entradas;
  for (const entrada of entradas) {
    if (nomeDaChave(entrada.chave) === nome) {
      return entrada.valor;
    }
  }
  return null;
}
