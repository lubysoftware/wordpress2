/**
 * A entrega de **T008** da feature `006-biblioteca-de-midia`: *"5 testes
 * automatizados, um por caso registrado em `../../../backlog/tests.md`
 * (UT-058-1, UT-058-2, UT-058-3, UT-058-4, UT-058-5), com o mesmo dado de
 * entrada, acao e resultado esperado. O teste de regra de negocio (UT-058-5)
 * entra na mesma suite."*
 *
 * ---
 *
 * # Os cinco casos foram COPIADOS do catalogo
 *
 * O card REQ-058 e a secao que comeca em `backlog/tests.md:883`, e os cinco
 * casos sao as linhas `:889` a `:893`, com **ID, nome, tipo e prova**. O
 * catalogo nao traz tabela de dados para este card: a prova de cada caso e o
 * texto do criterio (ou da regra, no caso de UT-058-5), e o cenario e o do
 * criterio. O nome de cada `test()` abaixo e o nome do catalogo, letra por
 * letra.
 *
 * | caso | nome, como o catalogo o escreve | tipo | prova |
 * |---|---|---|---|
 * | `UT-058-1` | gera uma derivada por tamanho declarado, com as proporções daquele tamanho | `feliz` | CA-3.1 |
 * | `UT-058-2` | registra de fábrica quatro tamanhos mais os dois de tela de alta densidade | `borda` | CA-3.2 |
 * | `UT-058-3` | deixa de fora o tamanho registrado depois do envio até a ação explícita de regerar | `borda` | CA-3.3 |
 * | `UT-058-4` | guarda no anexo o nome do arquivo e as medidas reais de cada derivada | `feliz` | CA-3.4 |
 * | `UT-058-5` | inclui no conjunto de fábrica os dois tamanhos declarados em código para alta densidade | `borda` | M2 |
 *
 * Os cinco moram aqui, no contexto de midia, porque o codigo que eles exercitam
 * — `tamanhos/` de T001 e `derivadas/` de T007 — e todo deste contexto. Nenhum
 * import cruza contexto (regra de dependencia 3).
 *
 * ---
 *
 * # Nao e a suite de criterio de T007, e a diferenca esta em DUAS fixtures
 *
 * T007 tem a suite dela em `./us-3-gerar-derivadas.test.ts`: ordem de
 * prioridade, os silencios de `M4`, EXIF, HEIC, relativizacao do caminho. Esta
 * suite nao repete nada disso e cobra o catalogo pelo **resultado**:
 *
 * 1. **as medidas reais vem da biblioteca de imagem, e nao do calculo do
 *    dominio.** O duplo da porta de processamento responde por uma tabela
 *    {@link MEDIDAS_REAIS} escrita a mao para a imagem de 3000x2000 do cenario,
 *    conta por conta, a partir de `wp_constrain_dimensions()`
 *    (`wp-includes/media.php:460`) e do recorte de `image_resize_dimensions()`
 *    (`:555`). A suite de T007 deriva a resposta da porta da propria
 *    `dimensoesDeRedimensionamento()`; aqui nao, e e por isso que UT-058-1
 *    consegue afirmar que o **nome** que o dominio gera concorda com a medida
 *    que a biblioteca devolveu — que e o que o legado garante por construcao,
 *    porque `generate_filename()` e `_save()` leem o mesmo `$this->size`
 *    (`wp-includes/class-wp-image-editor-gd.php:590`);
 * 2. **a coluna `_wp_attachment_metadata` e uma tabela em memoria que
 *    sobrevive entre duas requisicoes.** O duplo do armazenamento guarda o
 *    ultimo valor gravado e o devolve na leitura seguinte, e e com isso que
 *    UT-058-3 afirma *"nao e gerado retroativamente"* como estado: a requisicao
 *    que registra o tamanho novo encontra o anexo como o envio o deixou, e so a
 *    acao de regerar muda a coluna.
 *
 * Cada afirmacao foi conferida contra o codigo do sistema analisado, legivel em
 * disco na arvore do 7.1.2, e por isso cita arquivo e linha.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  serializarComoTexto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import {
  criarArmazenamentoDeMidia,
  criarPortaDeDadosFalsa,
  lerMetadadoDeAnexo,
} from '../armazenamento/index.js';
import type {
  ImagemAberta,
  PortaDeProcessamentoDeImagem,
  PortaDeSistemaDeArquivos,
  Recorte,
  TamanhoPedido,
} from '../portas/index.js';
import {
  OPCOES_SEMEADAS_DE_TAMANHO,
  TAMANHOS_DE_IMAGEM_DE_FABRICA,
} from '../tamanhos/index.js';
import {
  criarDerivadasDeImagem,
  derivadasQueFaltam,
  regerarDerivadasQueFaltam,
  TAMANHOS_ADICIONAIS_DE_FABRICA,
  tamanhosRegistrados,
  type ContextoDeDerivadas,
  type OpcoesDeTamanhoDeImagem,
  type TamanhoAdicional,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const RAIZ_DE_ENVIOS = '/var/www/wp-content/uploads';
const CAMINHO = `${RAIZ_DE_ENVIOS}/2026/11/foto.jpg`;
const RELATIVO = '2026/11/foto.jpg';
const ID_DO_ANEXO = 58;

/** A imagem enviada: maior que os seis tamanhos de fabrica, em 3:2. */
const LARGURA_DA_IMAGEM = 3000;
const ALTURA_DA_IMAGEM = 2000;

/**
 * Um tamanho que uma extensao registra por `add_image_size( 'cartao', 400,
 * 300, true )` (`wp-includes/media.php:312`). Recortado, para que a proporcao
 * dele (4:3) seja outra que a da imagem (3:2).
 */
const CARTAO: TamanhoAdicional = {
  nome: 'cartao',
  largura: 400,
  altura: 300,
  recorte: true,
};

/**
 * O que a biblioteca de imagem devolve para a imagem de 3000x2000, por caixa
 * pedida (`largura x altura`). Escrito a mao, nao calculado pelo dominio:
 *
 * - **sem recorte** a imagem cabe na caixa pela menor razao e mantem 3:2
 *   (`wp_constrain_dimensions()`, `wp-includes/media.php:460`-`:500`), com
 *   `round()` em cada lado: 300/3000 = 0,1 → 300x200; 1024/3000 →
 *   2000 x 0,34133 = 682,67 → 683; 2048/3000 → 1365,33 → 1365. A altura `0`
 *   de `medium_large` nao limita (`$max_height > 0`, `:475`): 768/3000 = 0,256
 *   → 768x512;
 * - **com recorte** a derivada tem exatamente a caixa pedida
 *   (`image_resize_dimensions()`, `:555`): 150x150 e 400x300.
 */
const MEDIDAS_REAIS: Readonly<Record<string, readonly [number, number]>> = {
  '150x150': [150, 150],
  '300x300': [300, 200],
  '768x0': [768, 512],
  '1024x1024': [1024, 683],
  '1536x1536': [1536, 1024],
  '2048x2048': [2048, 1365],
  '400x300': [400, 300],
};

/** A coluna `_wp_attachment_metadata`, compartilhada entre requisicoes. */
interface ColunaDeMetadado {
  valor: ValorPhp | null;
  readonly gravacoes: ValorPhp[];
}

/** O que a porta de imagem registrou de cada pedido de derivada. */
interface PedidoDeDerivada {
  readonly caixa: string;
  readonly recorte: Recorte;
  readonly arquivo: string;
}

interface Requisicao {
  readonly contexto: ContextoDeDerivadas;
  readonly pedidos: PedidoDeDerivada[];
}

interface OpcoesDaRequisicao {
  /** `$_wp_additional_image_sizes` nesta requisicao. Omitido: o de fabrica. */
  readonly tamanhosAdicionais?: readonly TamanhoAdicional[];
  /** `get_option()` das medidas. Omitido: as nove opcoes semeadas. */
  readonly opcoesDeTamanho?: OpcoesDeTamanhoDeImagem;
}

function novaColuna(): ColunaDeMetadado {
  return { valor: null, gravacoes: [] };
}

/** `get_option()` de uma instalacao de fabrica. */
const OPCOES_DE_FABRICA: OpcoesDeTamanhoDeImagem = {
  medida: (nome) => OPCOES_SEMEADAS_DE_TAMANHO[nome] ?? 0,
  // `thumbnail_crop` e semeada em `1`; as outras tres nao existem e valem
  // `false` (`wp-admin/includes/schema.php:487`).
  recorte: (nome) => OPCOES_SEMEADAS_DE_TAMANHO[nome] ?? false,
};

function requisicao(
  coluna: ColunaDeMetadado,
  opcoes: OpcoesDaRequisicao = {},
): Requisicao {
  const pedidos: PedidoDeDerivada[] = [];
  const dados = criarPortaDeDadosFalsa();
  const armazenamentoReal = criarArmazenamentoDeMidia(dados.porta);

  const imagem: ImagemAberta = {
    dimensoes: () => ({ largura: LARGURA_DA_IMAGEM, altura: ALTURA_DA_IMAGEM }),
    tipoMime: () => 'image/jpeg',
    redimensionar: () => ({ concluido: true }),
    girar: () => ({ concluido: true }),
    inverter: () => ({ concluido: true }),
    gravar: () => {
      throw new Error('gerar derivada nao grava o arquivo principal');
    },
    derivar: (tamanho: TamanhoPedido, caminho: string) => {
      const caixa = `${String(tamanho.largura)}x${String(tamanho.altura)}`;
      const reais = MEDIDAS_REAIS[caixa];
      assert.ok(reais !== undefined, `caixa fora do cenario: ${caixa}`);
      pedidos.push({ caixa, recorte: tamanho.recorte, arquivo: nomeDe(caminho) });
      return {
        concluido: true,
        valor: {
          nomeDeArquivo: nomeDe(caminho),
          largura: reais[0],
          altura: reais[1],
          tipoMime: 'image/jpeg',
          bytes: reais[0] * 10,
        },
      };
    },
  };

  const processamentoDeImagem: PortaDeProcessamentoDeImagem = {
    implementacao: 'duplo-de-teste',
    disponivel: () => true,
    suporta: (tipoMime) => tipoMime.startsWith('image/'),
    abrir: () => ({ concluido: true, valor: imagem }),
  };

  const sistemaDeArquivos: PortaDeSistemaDeArquivos = {
    raizDeEnvios: RAIZ_DE_ENVIOS,
    existe: () => naoTocaODisco(),
    ehPasta: () => naoTocaODisco(),
    gravavel: () => naoTocaODisco(),
    criarPasta: () => naoTocaODisco(),
    escrever: () => naoTocaODisco(),
    ler: () => naoTocaODisco(),
    mover: () => naoTocaODisco(),
    copiar: () => naoTocaODisco(),
    apagar: () => naoTocaODisco(),
    listar: () => naoTocaODisco(),
  };

  const contexto: ContextoDeDerivadas = {
    processamentoDeImagem,
    sistemaDeArquivos,
    armazenamento: {
      metadadoDeAnexo: {
        ...armazenamentoReal.metadadoDeAnexo,
        obterMetadado: () =>
          coluna.valor === null ? null : lerMetadadoDeAnexo(coluna.valor),
        obterCaminhoRelativo: () => RELATIVO,
        gravarMetadado: (_anexoId, valor) => {
          coluna.valor = valor;
          coluna.gravacoes.push(valor);
          return {
            caminho: 'gravado',
            resultado: { gravou: true, acrescentadoComId: null },
          };
        },
      },
    },
    conteudo: { ehAnexoDeImagem: () => true },
    leituraDoArquivo: {
      dimensoes: () => ({
        largura: LARGURA_DA_IMAGEM,
        altura: ALTURA_DA_IMAGEM,
        tipoMime: 'image/jpeg',
      }),
      bytes: () => 4096,
    },
    opcoesDeTamanho: opcoes.opcoesDeTamanho ?? OPCOES_DE_FABRICA,
    ...(opcoes.tamanhosAdicionais === undefined
      ? {}
      : { tamanhosAdicionais: opcoes.tamanhosAdicionais }),
  };

  return { contexto, pedidos };
}

function nomeDe(caminho: string): string {
  return caminho.slice(caminho.lastIndexOf('/') + 1);
}

function naoTocaODisco(): never {
  throw new Error('a geracao de derivadas nao toca o disco pela porta de arquivos');
}

/** `wp_create_image_subsizes()` sobre a imagem do cenario. */
function enviar(req: Requisicao): ValorPhp {
  return criarDerivadasDeImagem(req.contexto, {
    anexoId: ID_DO_ANEXO,
    caminho: CAMINHO,
  });
}

/** As derivadas de um metadado, pela projecao de T002. */
function derivadasDe(
  valor: ValorPhp | null,
): { nome: string; arquivo: string; largura: number; altura: number }[] {
  assert.ok(valor !== null, 'nenhum metadado na coluna');
  const lido = lerMetadadoDeAnexo(valor);
  assert.ok(lido !== null);
  return lido.derivadas.map((derivada) => ({
    nome: derivada.nome,
    arquivo: derivada.nomeDeArquivo,
    largura: derivada.largura,
    altura: derivada.altura,
  }));
}

/* ── UT-058-1 (CA-3.1) ─────────────────────────────────────────────────────── */

test('UT-058-1 (CA-3.1) gera uma derivada por tamanho declarado, com as proporções daquele tamanho', () => {
  const coluna = novaColuna();
  const req = requisicao(coluna, {
    tamanhosAdicionais: [...TAMANHOS_ADICIONAIS_DE_FABRICA, CARTAO],
  });

  enviar(req);

  /*
    Sete tamanhos declarados — os seis de fabrica e o da extensao —, sete
    pedidos a biblioteca, um por tamanho, cada um com a caixa e o recorte
    DAQUELE tamanho. A ordem e a de prioridade de `_wp_make_subsizes()`
    (`wp-admin/includes/image.php:462`-`:469`) e depois a do registro.
  */
  assert.deepEqual(req.pedidos, [
    { caixa: '300x300', recorte: false, arquivo: 'foto-300x200.jpg' },
    { caixa: '1024x1024', recorte: false, arquivo: 'foto-1024x683.jpg' },
    { caixa: '150x150', recorte: true, arquivo: 'foto-150x150.jpg' },
    { caixa: '768x0', recorte: false, arquivo: 'foto-768x512.jpg' },
    { caixa: '1536x1536', recorte: false, arquivo: 'foto-1536x1024.jpg' },
    { caixa: '2048x2048', recorte: false, arquivo: 'foto-2048x1365.jpg' },
    { caixa: '400x300', recorte: true, arquivo: 'foto-400x300.jpg' },
  ]);

  const derivadas = derivadasDe(coluna.valor);
  assert.deepEqual(
    derivadas.map((derivada) => derivada.nome),
    ['medium', 'large', 'thumbnail', 'medium_large', '1536x1536', '2048x2048', 'cartao'],
  );

  /*
    As proporcoes: o tamanho recortado sai na proporcao DA CAIXA (1:1 e 4:3), e
    o proporcional sai na proporcao DA IMAGEM (3:2), dentro da caixa. A
    tolerancia e o arredondamento de um pixel que `round()` introduz.
  */
  const porNome = new Map(derivadas.map((derivada) => [derivada.nome, derivada]));
  assert.deepEqual(
    [porNome.get('thumbnail')?.largura, porNome.get('thumbnail')?.altura],
    [150, 150],
  );
  assert.deepEqual(
    [porNome.get('cartao')?.largura, porNome.get('cartao')?.altura],
    [400, 300],
  );
  for (const nome of ['medium', 'medium_large', 'large', '1536x1536', '2048x2048']) {
    const derivada = porNome.get(nome);
    assert.ok(derivada !== undefined, nome);
    assert.ok(
      Math.abs(derivada.largura * ALTURA_DA_IMAGEM - derivada.altura * LARGURA_DA_IMAGEM) <=
        LARGURA_DA_IMAGEM,
      `${nome} perdeu a proporcao 3:2: ${derivada.largura}x${derivada.altura}`,
    );
  }
});

/* ── UT-058-2 (CA-3.2) ─────────────────────────────────────────────────────── */

test('UT-058-2 (CA-3.2) registra de fábrica quatro tamanhos mais os dois de tela de alta densidade', () => {
  // O dado de T001: seis tamanhos, quatro de opcao semeada e dois de codigo.
  assert.deepEqual(
    TAMANHOS_DE_IMAGEM_DE_FABRICA.map(({ nome, largura, altura, recorte, origem }) => ({
      nome,
      largura,
      altura,
      recorte,
      origem,
    })),
    [
      { nome: 'thumbnail', largura: 150, altura: 150, recorte: true, origem: 'opcao-semeada' },
      { nome: 'medium', largura: 300, altura: 300, recorte: false, origem: 'opcao-semeada' },
      { nome: 'medium_large', largura: 768, altura: 0, recorte: false, origem: 'opcao-semeada' },
      { nome: 'large', largura: 1024, altura: 1024, recorte: false, origem: 'opcao-semeada' },
      { nome: '1536x1536', largura: 1536, altura: 1536, recorte: false, origem: 'codigo' },
      { nome: '2048x2048', largura: 2048, altura: 2048, recorte: false, origem: 'codigo' },
    ],
  );

  // As medidas declaradas dos quatro sao as opcoes que o instalador semeia
  // (`wp-admin/includes/schema.php:485`-`:496`, `:532`-`:533`).
  assert.deepEqual(
    { ...OPCOES_SEMEADAS_DE_TAMANHO },
    {
      thumbnail_size_w: 150,
      thumbnail_size_h: 150,
      thumbnail_crop: 1,
      medium_size_w: 300,
      medium_size_h: 300,
      medium_large_size_w: 768,
      medium_large_size_h: 0,
      large_size_w: 1024,
      large_size_h: 1024,
    },
  );

  /*
    E o que uma instalacao de fabrica resolve em execucao
    (`wp_get_registered_image_subsizes()`, `wp-includes/media.php:930`): os
    quatro das opcoes e os dois do arranque, nesta ordem, e nenhum outro.
  */
  const resolvidos = tamanhosRegistrados(OPCOES_DE_FABRICA);
  assert.deepEqual([...resolvidos], [
    ['thumbnail', { largura: 150, altura: 150, recorte: true }],
    ['medium', { largura: 300, altura: 300, recorte: false }],
    ['medium_large', { largura: 768, altura: 0, recorte: false }],
    ['large', { largura: 1024, altura: 1024, recorte: false }],
    ['1536x1536', { largura: 1536, altura: 1536, recorte: false }],
    ['2048x2048', { largura: 2048, altura: 2048, recorte: false }],
  ]);
});

/* ── UT-058-3 (CA-3.3) ─────────────────────────────────────────────────────── */

test('UT-058-3 (CA-3.3) deixa de fora o tamanho registrado depois do envio até a ação explícita de regerar', () => {
  const coluna = novaColuna();

  // Requisicao 1: o envio, numa instalacao de fabrica.
  enviar(requisicao(coluna));
  const depoisDoEnvio = coluna.valor;
  const gravacoesDoEnvio = coluna.gravacoes.length;
  assert.equal(derivadasDe(depoisDoEnvio).length, 6);

  /*
    Requisicao 2: uma extensao passou a registrar `cartao`. Registrar nao gera
    nada — o legado nao tem gancho que regere no registro — e a coluna continua
    como o envio a deixou.
  */
  const depois = requisicao(coluna, {
    tamanhosAdicionais: [...TAMANHOS_ADICIONAIS_DE_FABRICA, CARTAO],
  });
  assert.equal(coluna.valor, depoisDoEnvio);
  assert.ok(!derivadasDe(coluna.valor).some((derivada) => derivada.nome === 'cartao'));

  /*
    O que falta e so o tamanho novo, comparado POR NOME
    (`wp-admin/includes/image.php:128`-`:134`), e perguntar nao pede derivada
    nenhuma a biblioteca nem grava nada.
  */
  assert.deepEqual([...derivadasQueFaltam(depois.contexto, ID_DO_ANEXO)], [
    ['cartao', { largura: 400, altura: 300, recorte: true }],
  ]);
  assert.deepEqual(depois.pedidos, []);
  assert.equal(coluna.gravacoes.length, gravacoesDoEnvio);

  // A acao explicita: `wp_update_image_subsizes()` (`image.php:159`).
  const resultado = regerarDerivadasQueFaltam(depois.contexto, ID_DO_ANEXO);
  assert.equal(resultado.regerado, true);

  // So o tamanho novo e pedido, e as seis derivadas do envio ficam intactas.
  assert.deepEqual(depois.pedidos, [
    { caixa: '400x300', recorte: true, arquivo: 'foto-400x300.jpg' },
  ]);
  assert.deepEqual(derivadasDe(coluna.valor), [
    ...derivadasDe(depoisDoEnvio),
    { nome: 'cartao', arquivo: 'foto-400x300.jpg', largura: 400, altura: 300 },
  ]);
  // Uma gravacao pela derivada (`image.php:496`) e a final (`:188`).
  assert.equal(coluna.gravacoes.length, gravacoesDoEnvio + 2);
});

/* ── UT-058-4 (CA-3.4) ─────────────────────────────────────────────────────── */

test('UT-058-4 (CA-3.4) guarda no anexo o nome do arquivo e as medidas reais de cada derivada', () => {
  const coluna = novaColuna();
  enviar(requisicao(coluna));

  /*
    Para cada derivada: o NOME do arquivo (`wp_basename()`, sem pasta) e as
    medidas que a biblioteca devolveu — nao as declaradas. `medium` e declarado
    300x300 e guarda 300x200; `medium_large` e declarado 768x0 e guarda 768x512.
  */
  assert.deepEqual(derivadasDe(coluna.valor), [
    { nome: 'medium', arquivo: 'foto-300x200.jpg', largura: 300, altura: 200 },
    { nome: 'large', arquivo: 'foto-1024x683.jpg', largura: 1024, altura: 683 },
    { nome: 'thumbnail', arquivo: 'foto-150x150.jpg', largura: 150, altura: 150 },
    { nome: 'medium_large', arquivo: 'foto-768x512.jpg', largura: 768, altura: 512 },
    { nome: '1536x1536', arquivo: 'foto-1536x1024.jpg', largura: 1536, altura: 1024 },
    { nome: '2048x2048', arquivo: 'foto-2048x1365.jpg', largura: 2048, altura: 1365 },
  ]);

  /*
    E na coluna, em bytes: a entrada de cada derivada e o literal de `_save()`
    menos `path` (`wp-includes/class-wp-image-editor-gd.php:589`-`:593`) —
    `file`, `width`, `height`, `mime-type`, `filesize`, nesta ordem.
  */
  assert.ok(coluna.valor !== null);
  const bytes = serializarComoTexto(coluna.valor);
  assert.ok(
    bytes.includes(
      's:6:"medium";a:5:{s:4:"file";s:16:"foto-300x200.jpg";s:5:"width";i:300;' +
        's:6:"height";i:200;s:9:"mime-type";s:10:"image/jpeg";s:8:"filesize";i:3000;}',
    ),
    bytes,
  );
  assert.ok(
    bytes.includes(
      's:12:"medium_large";a:5:{s:4:"file";s:16:"foto-768x512.jpg";s:5:"width";i:768;' +
        's:6:"height";i:512;s:9:"mime-type";s:10:"image/jpeg";s:8:"filesize";i:7680;}',
    ),
    bytes,
  );
});

/* ── UT-058-5 (M2) ─────────────────────────────────────────────────────────── */

test('UT-058-5 (M2) inclui no conjunto de fábrica os dois tamanhos declarados em código para alta densidade', () => {
  /*
    Os dois sao registrados em codigo no arranque, por
    `_wp_add_additional_image_sizes()` (`wp-includes/media.php:5862`-`:5866`),
    pendurada em `plugins_loaded` com prioridade `0`
    (`wp-includes/default-filters.php:693`) — sem `crop`, que vale `false`
    (`media.php:312`), e sem opcao nenhuma por tras.
  */
  assert.deepEqual(
    TAMANHOS_ADICIONAIS_DE_FABRICA.map((tamanho) => ({ ...tamanho })),
    [
      { nome: '1536x1536', largura: 1536, altura: 1536, recorte: false },
      { nome: '2048x2048', largura: 2048, altura: 2048, recorte: false },
    ],
  );
  for (const tamanho of TAMANHOS_DE_IMAGEM_DE_FABRICA.filter((t) => t.origem === 'codigo')) {
    assert.equal(tamanho.opcoes, null);
    assert.ok(
      !Object.keys(OPCOES_SEMEADAS_DE_TAMANHO).some((opcao) => opcao.startsWith(tamanho.nome)),
    );
  }

  /*
    Por virem de codigo, eles nascem mesmo quando as quatro opcoes de medida
    estao zeradas — o caso em que `wp_get_registered_image_subsizes()` salta os
    quatro de opcao (*"This size isn't set"*, `media.php:955`-`:957`). O
    contexto da requisicao NAO informa os adicionais: e o conjunto de fabrica
    que o arranque produz.
  */
  const coluna = novaColuna();
  const req = requisicao(coluna, {
    opcoesDeTamanho: { medida: () => 0, recorte: () => false },
  });
  enviar(req);

  assert.deepEqual(req.pedidos, [
    { caixa: '1536x1536', recorte: false, arquivo: 'foto-1536x1024.jpg' },
    { caixa: '2048x2048', recorte: false, arquivo: 'foto-2048x1365.jpg' },
  ]);
  assert.deepEqual(derivadasDe(coluna.valor), [
    { nome: '1536x1536', arquivo: 'foto-1536x1024.jpg', largura: 1536, altura: 1024 },
    { nome: '2048x2048', arquivo: 'foto-2048x1365.jpg', largura: 2048, altura: 1365 },
  ]);
});
