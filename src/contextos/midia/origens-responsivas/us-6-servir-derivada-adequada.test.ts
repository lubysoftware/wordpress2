/**
 * Testes da entrega de **T013**: *"o comportamento de US-6 existe e os
 * criterios CA-6.1, CA-6.2 e CA-6.3 passam contra o sistema novo"*.
 *
 * **Nao sao os quatro testes de `backlog/tests.md`** — UT-061-1 a UT-061-4 sao
 * **T014**, a tarefa `[P]` que roda em paralelo com esta. Aqui se afirma o que
 * esta tarefa entrega, criterio por criterio, e as cinco restricoes do legado
 * que os criterios nao dizem (cabecalho de `calcular-origens-responsivas.ts`).
 *
 * O que se compara e o **texto** do atributo, porque e o que o cenario de
 * `M3` em `parity_tests/14-ingestao-e-derivadas-de-midia.feature` compara:
 * *"a lista de origens emitida e identica byte a byte nas duas"*. Cada vetor
 * foi tirado percorrendo `wp_calculate_image_srcset()`
 * (`wp-includes/media.php:1444`-`:1645`) com o metadado do teste, e o metadado
 * e montado com os construtores de T002, na ordem de chaves que T007 grava
 * (`medium`, `large`, `thumbnail`, `medium_large`, e depois o resto).
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  comDerivada,
  lerMetadadoDeAnexo,
  metadadoInicialDeImagem,
  type MetadadoDeAnexo,
} from '../armazenamento/index.js';
import { criarModuloDeMidia } from '../index.js';
import {
  calcularOrigensResponsivas,
  comEsquemaHttps,
  dominioDoEndereco,
  nomeBase,
  pastaRelativaDoAnexo,
  TETO_DAS_ORIGENS_RESPONSIVAS,
  type ContextoDeOrigensResponsivas,
  type FiltroDoTetoDeOrigens,
  type PedidoDeOrigensResponsivas,
} from './index.js';

const BASE = 'http://exemplo.test/wp-content/uploads';
const PASTA = `${BASE}/2026/11/`;

const CONTEXTO: ContextoDeOrigensResponsivas = {
  enderecoBaseDeEnvios: BASE,
  requisicao: { cifrada: false, host: 'exemplo.test' },
};

type Derivada = readonly [
  nome: string,
  arquivo: string,
  largura: number,
  altura: number,
  tipo?: string,
];

function metadado(
  arquivo: string,
  largura: number,
  altura: number,
  derivadas: readonly Derivada[],
): MetadadoDeAnexo {
  let valor = metadadoInicialDeImagem({
    largura,
    altura,
    arquivoRelativo: arquivo,
    bytes: 1000,
  });
  for (const [nome, nomeDeArquivo, l, a, tipoMime] of derivadas) {
    valor = comDerivada(valor, nome, {
      nomeDeArquivo,
      largura: l,
      altura: a,
      tipoMime: tipoMime ?? 'image/jpeg',
    });
  }
  const lido = lerMetadadoDeAnexo(valor);
  assert.ok(lido);
  return lido;
}

/** Foto 3:2 de 1200x800: os quatro tamanhos de opcao, nenhum de alta densidade. */
const FOTO_MEDIA = metadado('2026/11/foto.jpg', 1200, 800, [
  ['medium', 'foto-300x200.jpg', 300, 200],
  ['large', 'foto-1024x683.jpg', 1024, 683],
  ['thumbnail', 'foto-150x150.jpg', 150, 150],
  ['medium_large', 'foto-768x512.jpg', 768, 512],
]);

/** Foto 3:2 de 3000x2000: os seis tamanhos de fabrica, e o inteiro acima do teto. */
const DERIVADAS_GRANDES: readonly Derivada[] = [
  ['medium', 'foto-300x200.jpg', 300, 200],
  ['large', 'foto-1024x683.jpg', 1024, 683],
  ['thumbnail', 'foto-150x150.jpg', 150, 150],
  ['medium_large', 'foto-768x512.jpg', 768, 512],
  ['1536x1536', 'foto-1536x1024.jpg', 1536, 1024],
  ['2048x2048', 'foto-2048x1365.jpg', 2048, 1365],
];
const FOTO_GRANDE = metadado('2026/11/foto.jpg', 3000, 2000, DERIVADAS_GRANDES);

/** A mesma foto com um tamanho de extensao acima do teto. */
const FOTO_GRANDE_COM_EXTRA = metadado('2026/11/foto.jpg', 3000, 2000, [
  ...DERIVADAS_GRANDES,
  ['extra', 'foto-2560x1707.jpg', 2560, 1707],
]);

function pedido(
  meta: MetadadoDeAnexo | null,
  arquivoDoSrc: string,
  largura: number,
  altura: number,
): PedidoDeOrigensResponsivas {
  return {
    dimensoes: [largura, altura],
    enderecoDaImagem: PASTA + arquivoDoSrc,
    metadado: meta,
  };
}

function lista(...origens: readonly (readonly [string, number])[]): string {
  return origens
    .map(([arquivo, largura]) => `${PASTA}${arquivo} ${largura}w`)
    .join(', ');
}

// --- CA-6.1 ----------------------------------------------------------------

test('CA-6.1: a lista oferece as derivadas existentes, com o src primeiro e o inteiro no fim', () => {
  const srcset = calcularOrigensResponsivas(
    CONTEXTO,
    pedido(FOTO_MEDIA, 'foto-300x200.jpg', 300, 200),
  );

  // A miniatura 150x150 nao entra: a proporcao dela nao e a da foto (`:1589`).
  assert.equal(
    srcset,
    lista(
      ['foto-300x200.jpg', 300],
      ['foto-1024x683.jpg', 1024],
      ['foto-768x512.jpg', 768],
      ['foto.jpg', 1200],
    ),
  );
});

test('CA-6.1: a largura oferecida e a real do arquivo gravado, nao a nominal do tamanho', () => {
  // Retrato 800x1200: `medium` nasce 200x300 e `large` 683x1024.
  const retrato = metadado('2026/11/retrato.jpg', 800, 1200, [
    ['medium', 'retrato-200x300.jpg', 200, 300],
    ['large', 'retrato-683x1024.jpg', 683, 1024],
    ['medium_large', 'retrato-768x1152.jpg', 768, 1152],
  ]);

  assert.equal(
    calcularOrigensResponsivas(
      CONTEXTO,
      pedido(retrato, 'retrato-200x300.jpg', 200, 300),
    ),
    lista(
      ['retrato-200x300.jpg', 200],
      ['retrato-683x1024.jpg', 683],
      ['retrato-768x1152.jpg', 768],
      ['retrato.jpg', 800],
    ),
  );
});

test('CA-6.1: o src vai na frente mesmo quando nao e a primeira derivada gravada (#35030)', () => {
  assert.equal(
    calcularOrigensResponsivas(
      CONTEXTO,
      pedido(FOTO_MEDIA, 'foto-1024x683.jpg', 1024, 683),
    ),
    lista(
      ['foto-1024x683.jpg', 1024],
      ['foto-300x200.jpg', 300],
      ['foto-768x512.jpg', 768],
      ['foto.jpg', 1200],
    ),
  );
});

test('CA-6.1: duas derivadas da mesma largura viram uma, a ultima vence e a posicao e a da primeira', () => {
  const comCartao = metadado('2026/11/foto.jpg', 1200, 800, [
    ['medium', 'foto-300x200.jpg', 300, 200],
    ['large', 'foto-1024x683.jpg', 1024, 683],
    ['medium_large', 'foto-768x512.jpg', 768, 512],
    ['cartao', 'foto-cartao-768x512.jpg', 768, 512],
  ]);

  assert.equal(
    calcularOrigensResponsivas(
      CONTEXTO,
      pedido(comCartao, 'foto-300x200.jpg', 300, 200),
    ),
    lista(
      ['foto-300x200.jpg', 300],
      ['foto-1024x683.jpg', 1024],
      ['foto-cartao-768x512.jpg', 768],
      ['foto.jpg', 1200],
    ),
  );
});

test('CA-6.1: espaco no nome do arquivo vira %20 (`:1642`)', () => {
  const comEspaco = metadado('2026/11/minha foto.jpg', 1200, 800, [
    ['medium', 'minha foto-300x200.jpg', 300, 200],
  ]);

  assert.equal(
    calcularOrigensResponsivas(
      CONTEXTO,
      pedido(comEspaco, 'minha foto-300x200.jpg', 300, 200),
    ),
    `${PASTA}minha%20foto-300x200.jpg 300w, ${PASTA}minha%20foto.jpg 1200w`,
  );
});

// --- CA-6.2 ----------------------------------------------------------------

test('CA-6.2: o teto declarado e 2048, e o filtro o recebe igual qualquer que seja o metadado', () => {
  assert.equal(TETO_DAS_ORIGENS_RESPONSIVAS, 2048);

  const recebidos: (readonly [number | false, readonly [number, number]])[] = [];
  const observador: FiltroDoTetoDeOrigens = (teto, dimensoes) => {
    recebidos.push([teto, dimensoes]);
    return teto;
  };
  const contexto = { ...CONTEXTO, filtrosDoTeto: [observador] };

  calcularOrigensResponsivas(
    contexto,
    pedido(FOTO_MEDIA, 'foto-1024x683.jpg', 1024, 683),
  );
  calcularOrigensResponsivas(
    contexto,
    pedido(FOTO_GRANDE_COM_EXTRA, 'foto-1024x683.jpg', 1024, 683),
  );

  // `apply_filters( 'max_srcset_image_width', 2048, $size_array )`: nada do
  // metadado entra no calculo do teto.
  assert.deepEqual(recebidos, [
    [2048, [1024, 683]],
    [2048, [1024, 683]],
  ]);
});

test('CA-6.2: o teto e configuravel pelo interceptador, e o novo valor corta o que passa dele', () => {
  const contexto: ContextoDeOrigensResponsivas = {
    ...CONTEXTO,
    filtrosDoTeto: [() => 1536],
  };

  assert.equal(
    calcularOrigensResponsivas(
      contexto,
      pedido(FOTO_GRANDE, 'foto-1024x683.jpg', 1024, 683),
    ),
    lista(
      ['foto-1024x683.jpg', 1024],
      ['foto-300x200.jpg', 300],
      ['foto-768x512.jpg', 768],
      ['foto-1536x1024.jpg', 1536],
    ),
  );
});

test('CA-6.2: teto falso ou zero desliga o corte (`$max_srcset_image_width && ...`)', () => {
  const semCorte = lista(
    ['foto-1024x683.jpg', 1024],
    ['foto-300x200.jpg', 300],
    ['foto-768x512.jpg', 768],
    ['foto-1536x1024.jpg', 1536],
    ['foto-2048x1365.jpg', 2048],
    ['foto.jpg', 3000],
  );

  for (const desligado of [false, 0] as const) {
    assert.equal(
      calcularOrigensResponsivas(
        { ...CONTEXTO, filtrosDoTeto: [() => desligado] },
        pedido(FOTO_GRANDE, 'foto-1024x683.jpg', 1024, 683),
      ),
      semCorte,
    );
  }
});

test('CA-6.2: os interceptadores encadeiam, cada um sobre o que o anterior devolveu', () => {
  const vistos: (number | false)[] = [];
  calcularOrigensResponsivas(
    {
      ...CONTEXTO,
      filtrosDoTeto: [
        () => 1000,
        (teto) => {
          vistos.push(teto);
          return teto;
        },
      ],
    },
    pedido(FOTO_MEDIA, 'foto-300x200.jpg', 300, 200),
  );

  assert.deepEqual(vistos, [1000]);
});

// --- CA-6.3 ----------------------------------------------------------------

test('CA-6.3: anexo sem derivada alguma nao tem lista de alternativas', () => {
  const semDerivadas = lerMetadadoDeAnexo(
    metadadoInicialDeImagem({
      largura: 1200,
      altura: 800,
      arquivoRelativo: '2026/11/foto.jpg',
      bytes: 1000,
    }),
  );

  assert.equal(
    calcularOrigensResponsivas(
      CONTEXTO,
      pedido(semDerivadas, 'foto.jpg', 1200, 800),
    ),
    null,
  );
});

test('CA-6.3: sem metadado (o `false` de wp_get_attachment_metadata) tambem nao ha lista', () => {
  assert.equal(
    calcularOrigensResponsivas(CONTEXTO, pedido(null, 'foto.jpg', 1200, 800)),
    null,
  );
});

test('CA-6.3: so com derivada de outra proporcao sobra uma origem, e uma origem nao e lista', () => {
  const soMiniatura = metadado('2026/11/foto.jpg', 1200, 800, [
    ['thumbnail', 'foto-150x150.jpg', 150, 150],
  ]);

  assert.equal(
    calcularOrigensResponsivas(
      CONTEXTO,
      pedido(soMiniatura, 'foto.jpg', 1200, 800),
    ),
    null,
  );
});

test('o src fora do metadado nao tem lista (#35045), nem largura pedida abaixo de 1', () => {
  assert.equal(
    calcularOrigensResponsivas(
      CONTEXTO,
      pedido(FOTO_MEDIA, 'outra-300x200.jpg', 300, 200),
    ),
    null,
  );
  assert.equal(
    calcularOrigensResponsivas(
      CONTEXTO,
      pedido(FOTO_MEDIA, 'foto-300x200.jpg', 0, 200),
    ),
    null,
  );
});

test('arquivo do metadado com menos de 4 bytes nao tem lista (`:1462`)', () => {
  const comArquivo = (arquivo: string): string | null =>
    calcularOrigensResponsivas(CONTEXTO, {
      dimensoes: [300, 200],
      enderecoDaImagem: `${BASE}/x-300x200.j`,
      metadado: metadado(arquivo, 1200, 800, [
        ['medium', 'x-300x200.j', 300, 200],
      ]),
    });

  assert.equal(comArquivo('x.j'), null);
  assert.equal(comArquivo('xy.j'), `${BASE}/x-300x200.j 300w, ${BASE}/xy.j 1200w`);
});

// --- M3 --------------------------------------------------------------------

test('M3: a lista para em 2048 px mesmo havendo derivada e inteiro maiores', () => {
  assert.equal(
    calcularOrigensResponsivas(
      CONTEXTO,
      pedido(FOTO_GRANDE_COM_EXTRA, 'foto-1024x683.jpg', 1024, 683),
    ),
    lista(
      ['foto-1024x683.jpg', 1024],
      ['foto-300x200.jpg', 300],
      ['foto-768x512.jpg', 768],
      ['foto-1536x1024.jpg', 1536],
      ['foto-2048x1365.jpg', 2048],
    ),
  );
});

test('M3: o teto nao vale para o proprio src (`! $is_src`, `:1584`)', () => {
  assert.equal(
    calcularOrigensResponsivas(
      CONTEXTO,
      pedido(FOTO_GRANDE_COM_EXTRA, 'foto-2560x1707.jpg', 2560, 1707),
    ),
    lista(
      ['foto-2560x1707.jpg', 2560],
      ['foto-300x200.jpg', 300],
      ['foto-1024x683.jpg', 1024],
      ['foto-768x512.jpg', 768],
      ['foto-1536x1024.jpg', 1536],
      ['foto-2048x1365.jpg', 2048],
    ),
  );
});

// --- GIF e edicao ----------------------------------------------------------

const GIF = metadado('2026/11/anim.gif', 1200, 800, [
  ['medium', 'anim-300x200.gif', 300, 200, 'image/gif'],
  ['large', 'anim-1024x683.gif', 1024, 683, 'image/gif'],
  ['thumbnail', 'anim-150x150.gif', 150, 150, 'image/gif'],
  ['medium_large', 'anim-768x512.gif', 768, 512, 'image/gif'],
]);

test('GIF servido inteiro nao tem lista, para nao esconder a animacao (`:1490`)', () => {
  assert.equal(
    calcularOrigensResponsivas(CONTEXTO, pedido(GIF, 'anim.gif', 1200, 800)),
    null,
  );
});

test('GIF servido numa derivada oferece so as derivadas, sem o inteiro animado', () => {
  assert.equal(
    calcularOrigensResponsivas(
      CONTEXTO,
      pedido(GIF, 'anim-300x200.gif', 300, 200),
    ),
    lista(
      ['anim-300x200.gif', 300],
      ['anim-1024x683.gif', 1024],
      ['anim-768x512.gif', 768],
    ),
  );
});

test('imagem editada oferece so os arquivos da mesma edicao (`:1576`)', () => {
  const editada = metadado('2026/11/foto-e1730000000123.jpg', 1200, 800, [
    ['medium', 'foto-e1730000000123-300x200.jpg', 300, 200],
    ['large', 'foto-1024x683.jpg', 1024, 683],
  ]);

  assert.equal(
    calcularOrigensResponsivas(
      CONTEXTO,
      pedido(editada, 'foto-e1730000000123-300x200.jpg', 300, 200),
    ),
    lista(
      ['foto-e1730000000123-300x200.jpg', 300],
      ['foto-e1730000000123.jpg', 1200],
    ),
  );
});

// --- Endereco --------------------------------------------------------------

test('em requisicao cifrada, o endereco vira https so quando o Host e o do endereco base', () => {
  const p = pedido(FOTO_MEDIA, 'foto-1024x683.jpg', 1024, 683);
  const cifrada = (host?: string): ContextoDeOrigensResponsivas => ({
    enderecoBaseDeEnvios: BASE,
    requisicao: host === undefined ? { cifrada: true } : { cifrada: true, host },
  });

  const comHttps = calcularOrigensResponsivas(cifrada('exemplo.test'), p);
  assert.ok(comHttps?.startsWith('https://exemplo.test/wp-content/uploads/2026/11/foto-1024x683.jpg 1024w, https://'));

  assert.equal(calcularOrigensResponsivas(cifrada('cdn.test'), p), lista(
    ['foto-1024x683.jpg', 1024],
    ['foto-300x200.jpg', 300],
    ['foto-768x512.jpg', 768],
    ['foto.jpg', 1200],
  ));
  assert.equal(
    calcularOrigensResponsivas(cifrada(), p),
    calcularOrigensResponsivas(CONTEXTO, p),
  );
});

test('a porta do endereco base entra na comparacao com o Host (`:1516`)', () => {
  const p = {
    ...pedido(FOTO_MEDIA, 'foto-1024x683.jpg', 1024, 683),
    enderecoDaImagem:
      'http://exemplo.test:8080/wp-content/uploads/2026/11/foto-1024x683.jpg',
  };
  const contexto = (host: string): ContextoDeOrigensResponsivas => ({
    enderecoBaseDeEnvios: 'http://exemplo.test:8080/wp-content/uploads/',
    requisicao: { cifrada: true, host },
  });

  assert.ok(
    calcularOrigensResponsivas(contexto('exemplo.test:8080'), p)?.startsWith(
      'https://exemplo.test:8080/wp-content/uploads/2026/11/',
    ),
  );
  assert.ok(
    calcularOrigensResponsivas(contexto('exemplo.test'), p)?.startsWith(
      'http://exemplo.test:8080/wp-content/uploads/2026/11/',
    ),
  );
});

test('as funcoes de endereco reproduzem o recorte que o legado exercita', () => {
  assert.equal(pastaRelativaDoAnexo('2026/11/foto.jpg'), '2026/11');
  assert.equal(pastaRelativaDoAnexo('foto.jpg'), '');
  assert.equal(
    pastaRelativaDoAnexo('/var/www/wp-content/uploads/2026/11/foto.jpg'),
    '2026/11',
  );
  assert.equal(nomeBase('2026/11/foto.jpg'), 'foto.jpg');
  assert.equal(nomeBase('pasta\\foto.jpg'), 'foto.jpg');
  assert.equal(dominioDoEndereco('http://u:s@exemplo.test:0080/x'), 'exemplo.test:80');
  assert.equal(dominioDoEndereco('//exemplo.test/x'), 'exemplo.test');
  assert.equal(dominioDoEndereco('/sem/host'), '');
  assert.equal(comEsquemaHttps(' //exemplo.test/x '), 'https://exemplo.test/x');
});

// --- Composicao ------------------------------------------------------------

test('o modulo expoe a operacao, e ela nao toca porta nenhuma', () => {
  const toques: string[] = [];
  const registrar = (porta: string): never =>
    new Proxy(
      {},
      {
        get: (_alvo, nome) => {
          toques.push(`${porta}.${String(nome)}`);
          return undefined;
        },
      },
    ) as never;
  const modulo = criarModuloDeMidia({
    dados: registrar('dados'),
    sistemaDeArquivos: registrar('sistemaDeArquivos'),
    processamentoDeImagem: registrar('processamentoDeImagem'),
  });
  toques.length = 0;

  const p = pedido(FOTO_MEDIA, 'foto-300x200.jpg', 300, 200);
  assert.equal(
    modulo.calcularOrigensResponsivas(CONTEXTO, p),
    calcularOrigensResponsivas(CONTEXTO, p),
  );
  assert.deepEqual(toques, []);
});
