/**
 * Testes da entrega de **T007**: *"o comportamento de US-3 existe e os
 * criterios CA-3.1, CA-3.2, CA-3.3 e CA-3.4 passam contra o sistema novo"*.
 *
 * **Nao sao os cinco testes de `backlog/tests.md`** — UT-058-1 a UT-058-5 sao
 * **T008**, a tarefa `[P]` que roda em paralelo com esta. Aqui se afirma o que
 * esta tarefa entrega, criterio por criterio, pelos meios que a Decisao 2 de
 * `parity_specs.md` fixa para esta area: **efeito no banco** (*"snapshot +
 * sequencia de comandos"*) e **sequencia de operacoes na porta**, que e o que o
 * cenario `@composicao` de
 * `parity_tests/14-ingestao-e-derivadas-de-midia.feature` compara.
 *
 * E por isso que a porta de imagem daqui **registra o que foi pedido** em vez de
 * processar imagem de mentira: o que se tem de afirmar e o conjunto de arquivos
 * pedidos, com o nome exato de cada um, e o caso em que o legado **nao pede nada
 * e nao avisa ninguem** — que e metade de `M4`.
 *
 * Cada afirmacao foi conferida contra o codigo do sistema analisado, legivel em
 * disco na arvore do 7.1.2 (a mesma versao do pacote), e por isso cita arquivo e
 * linha.
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
  type PortaDeDadosFalsa,
} from '../armazenamento/index.js';
import type {
  ImagemAberta,
  PortaDeProcessamentoDeImagem,
  PortaDeSistemaDeArquivos,
  Recorte,
  TamanhoPedido,
} from '../portas/index.js';
import { OPCOES_SEMEADAS_DE_TAMANHO } from '../tamanhos/index.js';
import {
  caminhoDaDerivada,
  caminhoRelativoDeEnvio,
  criarDerivadasDeImagem,
  derivadasQueFaltam,
  dimensoesDeRedimensionamento,
  formatoDeSaidaDaDerivada,
  gerarDerivadas,
  MENSAGEM_DE_ARQUIVO_NAO_ENCONTRADO,
  regerarDerivadasQueFaltam,
  rotacionarPorOrientacaoExif,
  TAMANHOS_ADICIONAIS_DE_FABRICA,
  tamanhosRegistrados,
  type ContextoDeDerivadas,
  type DimensoesLidasDoArquivo,
  type LeituraDeArquivoDeImagem,
  type TamanhoAdicional,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const RAIZ_DE_ENVIOS = '/var/www/wp-content/uploads';
const PASTA_DO_MES = `${RAIZ_DE_ENVIOS}/2026/10`;
const CAMINHO = `${PASTA_DO_MES}/foto.jpg`;
const RELATIVO = '2026/10/foto.jpg';
const ID_DO_ANEXO = 101;

/** Uma imagem maior que todos os seis tamanhos de fabrica. */
const GRANDE: DimensoesLidasDoArquivo = {
  largura: 3000,
  altura: 2000,
  tipoMime: 'image/jpeg',
};

/** O que a porta de imagem registrou de cada pedido. */
interface PedidoRegistrado {
  readonly tamanho: TamanhoPedido;
  readonly caminho: string;
}

interface PortasDeTeste {
  readonly contexto: ContextoDeDerivadas;
  readonly dados: PortaDeDadosFalsa;
  readonly derivadasPedidas: PedidoRegistrado[];
  readonly operacoesDeImagem: string[];
  readonly metadadoGravado: ValorPhp[];
}

interface OpcoesDoCenario {
  /** O que `wp_getimagesize()` responde. `null` e *"nao e imagem"*. */
  readonly dimensoesDoArquivo?: DimensoesLidasDoArquivo | null;
  /** Tamanhos que devem falhar na porta, por nome de arquivo pedido. */
  readonly falharEm?: readonly string[];
  /** `$_wp_additional_image_sizes`. */
  readonly tamanhosAdicionais?: readonly TamanhoAdicional[];
  /** As opcoes de medida, por cima das semeadas. */
  readonly opcoes?: Readonly<Record<string, number>>;
  /** `get_option( '{tamanho}_crop' )`. */
  readonly recortes?: Readonly<Record<string, unknown>>;
  /** O valor de `_wp_attachment_metadata` que a porta de dados devolve. */
  readonly metadado?: ValorPhp | null;
  /** O valor de `_wp_attached_file`. */
  readonly arquivoAnexado?: string;
  /** `wp_read_image_metadata()`. */
  readonly exif?: ValorPhp | null;
  /** `@exif_read_data()['Orientation']`. */
  readonly orientacao?: number | null;
  /** `wp_attachment_is_image()`. */
  readonly ehImagem?: boolean;
  /** O tipo com que a imagem foi carregada pela porta. */
  readonly tipoMimeDaImagem?: string;
}

function cenario(opcoes: OpcoesDoCenario = {}): PortasDeTeste {
  const derivadasPedidas: PedidoRegistrado[] = [];
  const operacoesDeImagem: string[] = [];
  const metadadoGravado: ValorPhp[] = [];

  const dados = criarPortaDeDadosFalsa();
  const armazenamentoReal = criarArmazenamentoDeMidia(dados.porta);

  const falharEm = opcoes.falharEm ?? [];
  const tipoMimeDaImagem = opcoes.tipoMimeDaImagem ?? 'image/jpeg';
  const dimensoesDoArquivo =
    opcoes.dimensoesDoArquivo === undefined ? GRANDE : opcoes.dimensoesDoArquivo;

  const imagemAberta: ImagemAberta = {
    dimensoes: () => ({
      largura: dimensoesDoArquivo?.largura ?? 0,
      altura: dimensoesDoArquivo?.altura ?? 0,
    }),
    tipoMime: () => tipoMimeDaImagem,
    redimensionar: () => {
      operacoesDeImagem.push('redimensionar');
      return { concluido: true };
    },
    girar: (graus) => {
      operacoesDeImagem.push(`girar ${graus}`);
      return { concluido: true };
    },
    inverter: (horizontal, vertical) => {
      operacoesDeImagem.push(`inverter ${horizontal} ${vertical}`);
      return { concluido: true };
    },
    gravar: (caminho) => ({
      concluido: true,
      valor: {
        caminho,
        nomeDeArquivo: nomeDe(caminho),
        largura: 0,
        altura: 0,
        tipoMime: tipoMimeDaImagem,
        bytes: 0,
      },
    }),
    derivar: (tamanho, caminho) => {
      derivadasPedidas.push({ tamanho, caminho });
      operacoesDeImagem.push(`derivar ${nomeDe(caminho)}`);

      if (falharEm.includes(nomeDe(caminho))) {
        return { concluido: false, motivo: 'Image resize failed.' };
      }

      /*
        A porta devolve as medidas REAIS. Aqui elas saem do mesmo calculo que
        gera o nome, que e o que o legado faz — `_resize()` e
        `generate_filename()` leem o mesmo `$this->size`
        (`wp-includes/class-wp-image-editor-gd.php:242` e
        `class-wp-image-editor.php:475`).
      */
      const medidas = dimensoesDeRedimensionamento(
        dimensoesDoArquivo?.largura ?? 0,
        dimensoesDoArquivo?.altura ?? 0,
        tamanho.largura,
        tamanho.altura,
        tamanho.recorte,
      );

      return {
        concluido: true,
        valor: {
          nomeDeArquivo: nomeDe(caminho),
          largura: medidas?.larguraDeDestino ?? 0,
          altura: medidas?.alturaDeDestino ?? 0,
          tipoMime: tipoMimeDaImagem,
          bytes: 1024,
        },
      };
    },
  };

  const processamentoDeImagem: PortaDeProcessamentoDeImagem = {
    implementacao: 'duplo-de-teste',
    disponivel: () => true,
    suporta: (tipoMime) => tipoMime.startsWith('image/'),
    abrir: (caminho) => {
      operacoesDeImagem.push(`abrir ${caminho}`);
      return { concluido: true, valor: imagemAberta };
    },
  };

  /* So `raizDeEnvios` e lido; qualquer operacao de disco daqui e erro. */
  const sistemaDeArquivos: PortaDeSistemaDeArquivos = {
    raizDeEnvios: RAIZ_DE_ENVIOS,
    existe: () => naoDeveriaTocarODisco('existe'),
    ehPasta: () => naoDeveriaTocarODisco('ehPasta'),
    gravavel: () => naoDeveriaTocarODisco('gravavel'),
    criarPasta: () => naoDeveriaTocarODisco('criarPasta'),
    escrever: () => naoDeveriaTocarODisco('escrever'),
    ler: () => naoDeveriaTocarODisco('ler'),
    mover: () => naoDeveriaTocarODisco('mover'),
    copiar: () => naoDeveriaTocarODisco('copiar'),
    apagar: () => naoDeveriaTocarODisco('apagar'),
    listar: () => naoDeveriaTocarODisco('listar'),
  };

  const leituraDoArquivo: LeituraDeArquivoDeImagem = {
    dimensoes: () => dimensoesDoArquivo,
    bytes: () => 2048,
    ...(opcoes.exif === undefined
      ? {}
      : { metadadoDeImagem: () => opcoes.exif ?? null }),
    ...(opcoes.orientacao === undefined
      ? {}
      : { orientacaoExif: () => opcoes.orientacao ?? null }),
  };

  const contexto: ContextoDeDerivadas = {
    processamentoDeImagem,
    sistemaDeArquivos,
    armazenamento: {
      metadadoDeAnexo: {
        ...armazenamentoReal.metadadoDeAnexo,
        obterMetadado: () =>
          opcoes.metadado === undefined || opcoes.metadado === null
            ? null
            : lerMetadadoDeAnexo(opcoes.metadado),
        obterCaminhoRelativo: () => opcoes.arquivoAnexado ?? RELATIVO,
        gravarMetadado: (_anexoId, valor) => {
          metadadoGravado.push(valor);
          return { caminho: 'gravado', resultado: { gravou: true, acrescentadoComId: null } };
        },
      },
    },
    conteudo: { ehAnexoDeImagem: () => opcoes.ehImagem ?? true },
    leituraDoArquivo,
    opcoesDeTamanho: {
      medida: (nome) =>
        opcoes.opcoes?.[nome] ?? OPCOES_SEMEADAS_DE_TAMANHO[nome] ?? 0,
      recorte: (nome) => {
        const declarado = opcoes.recortes?.[nome];
        if (declarado !== undefined) {
          return declarado as Recorte;
        }
        // `thumbnail_crop` e semeada em `1`; as outras tres nao sao semeadas.
        return nome === 'thumbnail_crop' ? 1 : null;
      },
    },
    ...(opcoes.tamanhosAdicionais === undefined
      ? {}
      : { tamanhosAdicionais: opcoes.tamanhosAdicionais }),
  };

  return { contexto, dados, derivadasPedidas, operacoesDeImagem, metadadoGravado };
}

function nomeDe(caminho: string): string {
  const barra = caminho.lastIndexOf('/');
  return barra === -1 ? caminho : caminho.slice(barra + 1);
}

function naoDeveriaTocarODisco(operacao: string): never {
  throw new Error(
    `a geracao de derivadas nao toca o disco pela porta de arquivos: ${operacao}`,
  );
}

/** O ultimo valor de uma lista de gravacoes. */
function ultimoDe(gravados: readonly ValorPhp[]): ValorPhp {
  const ultimo = gravados[gravados.length - 1];
  assert.ok(ultimo !== undefined, 'nenhum metadado foi gravado');
  return ultimo;
}

/** O ultimo metadado gravado, lido pela projecao de T002. */
function derivadasDoUltimoGravado(
  metadadoGravado: readonly ValorPhp[],
): readonly { nome: string; nomeDeArquivo: string; largura: number; altura: number }[] {
  const ultimo = metadadoGravado[metadadoGravado.length - 1];
  assert.ok(ultimo !== undefined, 'nenhum metadado foi gravado');
  const lido = lerMetadadoDeAnexo(ultimo);
  assert.ok(lido !== null);
  return lido.derivadas.map((derivada) => ({
    nome: derivada.nome,
    nomeDeArquivo: derivada.nomeDeArquivo,
    largura: derivada.largura,
    altura: derivada.altura,
  }));
}

/* ── CA-3.2 e M2: OS SEIS TAMANHOS, RESOLVIDOS EM EXECUCAO ─────────────────── */

test('os seis tamanhos de fabrica sao resolvidos da opcao e do codigo, na ordem do legado (CA-3.2, M2)', () => {
  const { contexto } = cenario();

  const tamanhos = tamanhosRegistrados(
    contexto.opcoesDeTamanho,
    TAMANHOS_ADICIONAIS_DE_FABRICA,
  );

  // A ordem e a de `get_intermediate_image_sizes()` (`wp-includes/media.php:896`):
  // os quatro fixos, e depois os adicionais na ordem do registro.
  assert.deepEqual([...tamanhos.keys()], [
    'thumbnail',
    'medium',
    'medium_large',
    'large',
    '1536x1536',
    '2048x2048',
  ]);

  assert.deepEqual(tamanhos.get('thumbnail'), {
    largura: 150,
    altura: 150,
    // A UNICA de fabrica recortada, e e `thumbnail_crop` semeada em `1` que a
    // torna assim (`wp-admin/includes/schema.php:487`).
    recorte: true,
  });
  assert.deepEqual(tamanhos.get('medium'), {
    largura: 300,
    altura: 300,
    recorte: false,
  });
  // `medium_large` nasce `768x0` e NAO e saltado: a regra pede as DUAS medidas
  // vazias (`media.php:955`).
  assert.deepEqual(tamanhos.get('medium_large'), {
    largura: 768,
    altura: 0,
    recorte: false,
  });
  assert.deepEqual(tamanhos.get('large'), {
    largura: 1024,
    altura: 1024,
    recorte: false,
  });
  assert.deepEqual(tamanhos.get('1536x1536'), {
    largura: 1536,
    altura: 1536,
    recorte: false,
  });
  assert.deepEqual(tamanhos.get('2048x2048'), {
    largura: 2048,
    altura: 2048,
    recorte: false,
  });
});

test('tamanho com as duas medidas em zero e saltado, e com uma so nao (media.php:955)', () => {
  const { contexto } = cenario({
    opcoes: { large_size_w: 0, large_size_h: 0, medium_size_h: 0 },
  });

  const tamanhos = tamanhosRegistrados(
    contexto.opcoesDeTamanho,
    TAMANHOS_ADICIONAIS_DE_FABRICA,
  );

  assert.equal(tamanhos.has('large'), false);
  assert.deepEqual(tamanhos.get('medium'), {
    largura: 300,
    altura: 0,
    recorte: false,
  });
});

test('o tamanho que uma extensao registra entra com o recorte do registro, nao da opcao', () => {
  const { contexto } = cenario({
    tamanhosAdicionais: [
      ...TAMANHOS_ADICIONAIS_DE_FABRICA,
      { nome: 'capa', largura: 800, altura: 600, recorte: ['left', 'top'] },
    ],
  });

  const tamanhos = tamanhosRegistrados(
    contexto.opcoesDeTamanho,
    contexto.tamanhosAdicionais,
  );

  assert.deepEqual([...tamanhos.keys()].slice(4), [
    '1536x1536',
    '2048x2048',
    'capa',
  ]);
  assert.deepEqual(tamanhos.get('capa'), {
    largura: 800,
    altura: 600,
    recorte: ['left', 'top'],
  });
});

/* ── CA-3.1: UMA DERIVADA POR TAMANHO, COM AS PROPORCOES DECLARADAS ───────── */

test('receber uma imagem gera uma derivada por tamanho declarado (CA-3.1)', () => {
  const { contexto, derivadasPedidas } = cenario();

  criarDerivadasDeImagem(contexto, { anexoId: ID_DO_ANEXO, caminho: CAMINHO });

  /*
    A ORDEM e a de `_wp_make_subsizes()` (`wp-admin/includes/image.php:462`):
    `medium`, `large`, `thumbnail`, `medium_large`, e depois o resto — e nao a
    ordem em que os tamanhos estao registrados. O comentario do legado diz por
    que: para haver um tamanho utilizavel "immediately even when there was an
    error and not all sub-sizes were created".
  */
  assert.deepEqual(
    derivadasPedidas.map((pedido) => nomeDe(pedido.caminho)),
    [
      'foto-300x200.jpg',
      'foto-1024x683.jpg',
      'foto-150x150.jpg',
      'foto-768x512.jpg',
      'foto-1536x1024.jpg',
      'foto-2048x1365.jpg',
    ],
  );
});

test('a miniatura e recortada quadrada e as outras sao proporcionais (CA-3.1)', () => {
  const { contexto, derivadasPedidas } = cenario();

  criarDerivadasDeImagem(contexto, { anexoId: ID_DO_ANEXO, caminho: CAMINHO });

  const miniatura = derivadasPedidas.find(
    (pedido) => nomeDe(pedido.caminho) === 'foto-150x150.jpg',
  );
  assert.deepEqual(miniatura?.tamanho, {
    largura: 150,
    altura: 150,
    recorte: true,
  });

  /*
    `medium_large` vai com altura `0`, e NAO com `null`: `make_subsize()`
    converte para `null` so a chave AUSENTE
    (`wp-includes/class-wp-image-editor-gd.php:315`), e tamanho registrado
    sempre tem a chave.
  */
  const mediaGrande = derivadasPedidas.find(
    (pedido) => nomeDe(pedido.caminho) === 'foto-768x512.jpg',
  );
  assert.deepEqual(mediaGrande?.tamanho, {
    largura: 768,
    altura: 0,
    recorte: false,
  });
});

test('imagem menor que um tamanho nao ganha a derivada daquele tamanho (media.php:587)', () => {
  const { contexto, derivadasPedidas } = cenario({
    dimensoesDoArquivo: { largura: 400, altura: 300, tipoMime: 'image/jpeg' },
  });

  criarDerivadasDeImagem(contexto, { anexoId: ID_DO_ANEXO, caminho: CAMINHO });

  // So `medium` e `thumbnail` cabem; `large`, `medium_large`, `1536x1536` e
  // `2048x2048` sao maiores que a imagem nas duas medidas.
  assert.deepEqual(
    derivadasPedidas.map((pedido) => nomeDe(pedido.caminho)),
    ['foto-300x225.jpg', 'foto-150x150.jpg'],
  );
});

test('a guarda da imagem pequena compara as DUAS medidas quando as duas sao declaradas', () => {
  // 2000x500: a altura e menor que 1024, a largura nao. `large` E gerado.
  assert.notEqual(
    dimensoesDeRedimensionamento(2000, 500, 1024, 1024, false),
    null,
  );
  // 800x500: as duas sao menores que 1024. `large` NAO e gerado.
  assert.equal(dimensoesDeRedimensionamento(800, 500, 1024, 1024, false), null);
  // `medium_large` tem altura `0`: so a largura decide (`media.php:588`).
  assert.equal(dimensoesDeRedimensionamento(700, 5000, 768, 0, false), null);
  assert.notEqual(dimensoesDeRedimensionamento(800, 10, 768, 0, false), null);
});

test('o arquivo que nao e imagem nao gera derivada nenhuma e nao grava metadado (image.php:241)', () => {
  const { contexto, derivadasPedidas, metadadoGravado, operacoesDeImagem } =
    cenario({ dimensoesDoArquivo: null });

  const metadado = criarDerivadasDeImagem(contexto, {
    anexoId: ID_DO_ANEXO,
    caminho: `${PASTA_DO_MES}/planilha.ods`,
  });

  assert.deepEqual(metadado, { tipo: 'arranjo', entradas: [] });
  assert.deepEqual(derivadasPedidas, []);
  assert.deepEqual(operacoesDeImagem, []);
  assert.deepEqual(metadadoGravado, []);
});

/* ── CA-3.4: O QUE FICA GRAVADO NO REGISTRO DO ANEXO ──────────────────────── */

test('o metadado inicial e gravado com `sizes` vazio ANTES de qualquer derivada (image.php:395, CA-3.4)', () => {
  const { contexto, metadadoGravado } = cenario();

  criarDerivadasDeImagem(contexto, { anexoId: ID_DO_ANEXO, caminho: CAMINHO });

  /*
    Sao 1 + 6 gravacoes: a inicial e uma por derivada (`:496`). O estado inicial
    com `sizes` vazio e observavel, e e dele que vive o anexo cujo processamento
    foi interrompido.
  */
  assert.equal(metadadoGravado.length, 7);
  assert.equal(
    serializarComoTexto(metadadoGravado[0] as ValorPhp),
    'a:5:{s:5:"width";i:3000;s:6:"height";i:2000;s:4:"file";s:16:"2026/10/foto.jpg";s:8:"filesize";i:2048;s:5:"sizes";a:0:{}}',
  );
});

test('cada derivada guarda o nome do arquivo e as medidas reais (CA-3.4)', () => {
  const { contexto, metadadoGravado } = cenario();

  criarDerivadasDeImagem(contexto, { anexoId: ID_DO_ANEXO, caminho: CAMINHO });

  assert.deepEqual(derivadasDoUltimoGravado(metadadoGravado), [
    { nome: 'medium', nomeDeArquivo: 'foto-300x200.jpg', largura: 300, altura: 200 },
    { nome: 'large', nomeDeArquivo: 'foto-1024x683.jpg', largura: 1024, altura: 683 },
    { nome: 'thumbnail', nomeDeArquivo: 'foto-150x150.jpg', largura: 150, altura: 150 },
    { nome: 'medium_large', nomeDeArquivo: 'foto-768x512.jpg', largura: 768, altura: 512 },
    { nome: '1536x1536', nomeDeArquivo: 'foto-1536x1024.jpg', largura: 1536, altura: 1024 },
    { nome: '2048x2048', nomeDeArquivo: 'foto-2048x1365.jpg', largura: 2048, altura: 1365 },
  ]);
});

test('a ordem das chaves de `sizes` e a ordem da geracao, e ela e byte na coluna (DB-SER)', () => {
  const { contexto, metadadoGravado } = cenario();

  criarDerivadasDeImagem(contexto, { anexoId: ID_DO_ANEXO, caminho: CAMINHO });

  const bytes = serializarComoTexto(
    metadadoGravado[metadadoGravado.length - 1] as ValorPhp,
  );

  // `medium` antes de `large`, e `thumbnail` antes de `medium_large`: a ordem de
  // prioridade de `image.php:462`, e nao a dos tamanhos registrados.
  assert.ok(bytes.indexOf('"medium"') < bytes.indexOf('"large"'));
  assert.ok(bytes.indexOf('"large"') < bytes.indexOf('"thumbnail"'));
  assert.ok(bytes.indexOf('"thumbnail"') < bytes.indexOf('"medium_large"'));
  // E a ordem dos campos de cada entrada e a do literal do legado.
  assert.ok(
    bytes.includes(
      's:9:"thumbnail";a:5:{s:4:"file";s:16:"foto-150x150.jpg";s:5:"width";i:150;s:6:"height";i:150;s:9:"mime-type";s:10:"image/jpeg";s:8:"filesize";i:1024;}',
    ),
  );
});

test('o caminho gravado em `file` e relativo a area de envios (post.php:919)', () => {
  assert.equal(
    caminhoRelativoDeEnvio(CAMINHO, RAIZ_DE_ENVIOS),
    '2026/10/foto.jpg',
  );
  // Fora da area de envios o caminho atravessa inteiro, absoluto (`:923`).
  assert.equal(
    caminhoRelativoDeEnvio('/outro/lugar/foto.jpg', RAIZ_DE_ENVIOS),
    '/outro/lugar/foto.jpg',
  );
  /*
    ⚠️ `str_replace()` tira TODAS as ocorrencias, nao o prefixo (`:924`): com a
    raiz repetida dentro do caminho, o legado corta as duas.
  */
  assert.equal(
    caminhoRelativoDeEnvio(`${RAIZ_DE_ENVIOS}${RAIZ_DE_ENVIOS}/foto.jpg`, RAIZ_DE_ENVIOS),
    'foto.jpg',
  );
});

/* ── M4: AS DUAS FALHAS SILENCIOSAS DESTA TAREFA ──────────────────────────── */

test('derivada que falha nao entra no metadado, e nada mais muda (M4, image.php:492)', () => {
  const { contexto, metadadoGravado } = cenario({
    falharEm: ['foto-1024x683.jpg'],
  });

  const metadado = criarDerivadasDeImagem(contexto, {
    anexoId: ID_DO_ANEXO,
    caminho: CAMINHO,
  });

  // 1 inicial + 5 derivadas que deram: a que falhou NAO emite escrita, porque
  // no legado a gravacao esta dentro do `else` do erro (`:496`).
  assert.equal(metadadoGravado.length, 6);

  const lido = lerMetadadoDeAnexo(metadado);
  assert.deepEqual(
    lido?.derivadas.map((derivada) => derivada.nome),
    ['medium', 'thumbnail', 'medium_large', '1536x1536', '2048x2048'],
  );
  // E o resultado continua sendo um metadado valido: o envio vale como
  // bem-sucedido, que e o que o cenario `@divida-herdada` cobra.
  assert.equal(lido?.largura, 3000);
});

test('a imagem que nao abre devolve o metadado inicial, em silencio (image.php:470)', () => {
  const { contexto, metadadoGravado, derivadasPedidas } = cenario();
  const semBiblioteca: ContextoDeDerivadas = {
    ...contexto,
    processamentoDeImagem: {
      ...contexto.processamentoDeImagem,
      abrir: () => ({ concluido: false, motivo: 'This image cannot be edited.' }),
    },
  };

  const metadado = criarDerivadasDeImagem(semBiblioteca, {
    anexoId: ID_DO_ANEXO,
    caminho: CAMINHO,
  });

  assert.deepEqual(derivadasPedidas, []);
  // So a gravacao inicial saiu: o metadado existe, sem derivada nenhuma.
  assert.equal(metadadoGravado.length, 1);
  assert.deepEqual(lerMetadadoDeAnexo(metadado)?.derivadas, []);
});

/* ── A ROTACAO POR ORIENTACAO DO EXIF, QUE RODA ANTES DO LACO ─────────────── */

test('o EXIF no metadado faz a imagem ser rotacionada antes das derivadas (image.php:478)', () => {
  const { contexto, operacoesDeImagem } = cenario({
    exif: { tipo: 'arranjo', entradas: [] },
    orientacao: 6,
  });

  // Com `image_meta` VAZIO a chave nao entra (verdade de PHP), logo nao ha
  // rotacao: `! empty( $image_meta['image_meta'] )` e falso.
  criarDerivadasDeImagem(contexto, { anexoId: ID_DO_ANEXO, caminho: CAMINHO });
  assert.deepEqual(
    operacoesDeImagem.filter((operacao) => operacao.startsWith('girar')),
    [],
  );
});

test('com EXIF presente, a orientacao 6 gira 270 graus antes do laco (class-wp-image-editor.php:537)', () => {
  const { contexto, operacoesDeImagem } = cenario({
    exif: {
      tipo: 'arranjo',
      entradas: [
        { chave: { tipo: 'texto', valor: 'orientation' }, valor: { tipo: 'inteiro', valor: 6 } },
      ],
    },
    orientacao: 6,
  });

  criarDerivadasDeImagem(contexto, { anexoId: ID_DO_ANEXO, caminho: CAMINHO });

  assert.equal(operacoesDeImagem[0], `abrir ${CAMINHO}`);
  assert.equal(operacoesDeImagem[1], 'girar 270');
});

test('os sete casos de orientacao chamam os dois eixos na posicao do legado', () => {
  const chamadas: string[] = [];
  const imagem = {
    dimensoes: () => ({ largura: 10, altura: 10 }),
    tipoMime: () => 'image/jpeg',
    redimensionar: () => ({ concluido: true }) as const,
    girar: (graus: number) => {
      chamadas.push(`girar ${graus}`);
      return { concluido: true } as const;
    },
    inverter: (horizontal: boolean, vertical: boolean) => {
      chamadas.push(`inverter ${horizontal} ${vertical}`);
      return { concluido: true } as const;
    },
    gravar: () => {
      throw new Error('nao usado');
    },
    derivar: () => {
      throw new Error('nao usado');
    },
  } as unknown as ImagemAberta;

  for (const orientacao of [1, 2, 3, 4, 5, 6, 7, 8]) {
    rotacionarPorOrientacaoExif(imagem, orientacao);
  }

  /*
    ⚠️ `flip( $horz, $vert )` do legado e o EIXO, nao o sentido: o caso 2 diz
    "Flip horizontally" e chama `flip( false, true )`
    (`wp-includes/class-wp-image-editor.php:513`). A porta recebe os dois na
    mesma posicao.
  */
  assert.deepEqual(chamadas, [
    'inverter false true',
    'inverter true true',
    'inverter true false',
    'girar 90',
    'inverter true false',
    'girar 270',
    'girar 90',
    'inverter false true',
    'girar 90',
  ]);
});

test('a orientacao so e lida em JPEG, e so quando a borda responde (class-wp-image-editor.php:489)', () => {
  const imagemPng = {
    tipoMime: () => 'image/png',
    girar: () => {
      throw new Error('PNG nao rotaciona no legado');
    },
    inverter: () => {
      throw new Error('PNG nao rotaciona no legado');
    },
  } as unknown as ImagemAberta;

  assert.deepEqual(rotacionarPorOrientacaoExif(imagemPng, 6), {
    concluido: true,
    rotacionou: false,
  });
});

/* ── CA-3.3: NAO E RETROATIVO, E HA ACAO EXPLICITA ────────────────────────── */

test('tamanho registrado depois do envio nao esta no metadado do anexo (CA-3.3)', () => {
  const { contexto, metadadoGravado } = cenario();

  criarDerivadasDeImagem(contexto, { anexoId: ID_DO_ANEXO, caminho: CAMINHO });
  const antes = derivadasDoUltimoGravado(metadadoGravado).map((um) => um.nome);

  // Uma extensao registra `capa` DEPOIS. Nada acontece com o anexo: nenhum
  // caminho do legado reprocessa anexo existente por conta propria.
  assert.equal(antes.includes('capa'), false);
});

test('a acao explicita gera so o que falta, e grava uma vez no fim (CA-3.3, image.php:159)', () => {
  const metadadoExistente: ValorPhp = {
    tipo: 'arranjo',
    entradas: [
      { chave: { tipo: 'texto', valor: 'width' }, valor: { tipo: 'inteiro', valor: 3000 } },
      { chave: { tipo: 'texto', valor: 'height' }, valor: { tipo: 'inteiro', valor: 2000 } },
      { chave: { tipo: 'texto', valor: 'file' }, valor: { tipo: 'texto', valor: RELATIVO } },
      {
        chave: { tipo: 'texto', valor: 'sizes' },
        valor: {
          tipo: 'arranjo',
          entradas: [
            {
              chave: { tipo: 'texto', valor: 'thumbnail' },
              valor: {
                tipo: 'arranjo',
                entradas: [
                  { chave: { tipo: 'texto', valor: 'file' }, valor: { tipo: 'texto', valor: 'foto-150x150.jpg' } },
                  { chave: { tipo: 'texto', valor: 'width' }, valor: { tipo: 'inteiro', valor: 150 } },
                  { chave: { tipo: 'texto', valor: 'height' }, valor: { tipo: 'inteiro', valor: 150 } },
                  { chave: { tipo: 'texto', valor: 'mime-type' }, valor: { tipo: 'texto', valor: 'image/jpeg' } },
                ],
              },
            },
          ],
        },
      },
    ],
  };

  const { contexto, derivadasPedidas, metadadoGravado } = cenario({
    metadado: metadadoExistente,
    tamanhosAdicionais: [
      ...TAMANHOS_ADICIONAIS_DE_FABRICA,
      { nome: 'capa', largura: 800, altura: 600, recorte: false },
    ],
  });

  const resultado = regerarDerivadasQueFaltam(contexto, ID_DO_ANEXO);

  assert.equal(resultado.regerado, true);
  // `thumbnail` ja existe e e saltado **pelo nome** (`image.php:134` e `:440`);
  // os outros cinco mais `capa` sao gerados.
  assert.deepEqual(
    derivadasPedidas.map((pedido) => nomeDe(pedido.caminho)),
    [
      'foto-300x200.jpg',
      'foto-1024x683.jpg',
      'foto-768x512.jpg',
      'foto-1536x1024.jpg',
      'foto-2048x1365.jpg',
      'foto-800x533.jpg',
    ],
  );
  // 6 do laco mais a gravacao final de `:188`, que a ingestao NAO emite.
  assert.equal(metadadoGravado.length, 7);
});

test('a acao explicita nao emite escrita nenhuma quando nada falta (image.php:177)', () => {
  const primeira = cenario();
  criarDerivadasDeImagem(primeira.contexto, {
    anexoId: ID_DO_ANEXO,
    caminho: CAMINHO,
  });

  const { contexto, metadadoGravado, derivadasPedidas } = cenario({
    metadado: ultimoDe(primeira.metadadoGravado),
  });

  const resultado = regerarDerivadasQueFaltam(contexto, ID_DO_ANEXO);

  assert.equal(resultado.regerado, true);
  assert.deepEqual(derivadasPedidas, []);
  assert.deepEqual(metadadoGravado, []);
});

test('a acao explicita refaz a ingestao inteira quando nao ha metadado (image.php:169)', () => {
  const { contexto, metadadoGravado, derivadasPedidas } = cenario({
    metadado: null,
  });

  const resultado = regerarDerivadasQueFaltam(contexto, ID_DO_ANEXO);

  assert.equal(resultado.regerado, true);
  assert.equal(derivadasPedidas.length, 6);
  // 1 inicial + 6 do laco + a final de `:188`.
  assert.equal(metadadoGravado.length, 8);
});

test('a acao explicita devolve o erro do legado quando nao ha arquivo (image.php:171)', () => {
  const { contexto, metadadoGravado } = cenario({
    metadado: null,
    arquivoAnexado: '',
  });

  const resultado = regerarDerivadasQueFaltam(contexto, ID_DO_ANEXO);

  assert.deepEqual(resultado, {
    regerado: false,
    codigo: 'invalid_attachment',
    mensagem: MENSAGEM_DE_ARQUIVO_NAO_ENCONTRADO,
  });
  assert.deepEqual(metadadoGravado, []);
});

test('o que falta e vazio para anexo que nao e imagem (image.php:88)', () => {
  const { contexto } = cenario({ ehImagem: false });

  assert.equal(derivadasQueFaltam(contexto, ID_DO_ANEXO).size, 0);
});

test('mudar a medida de um tamanho na tela NAO regera a derivada antiga (image.php:131)', () => {
  const original = cenario();
  criarDerivadasDeImagem(original.contexto, {
    anexoId: ID_DO_ANEXO,
    caminho: CAMINHO,
  });

  // A tela de configuracao troca `medium` de 300 para 500.
  const { contexto, derivadasPedidas } = cenario({
    metadado: ultimoDe(original.metadadoGravado),
    opcoes: { medium_size_w: 500, medium_size_h: 500 },
  });

  regerarDerivadasQueFaltam(contexto, ID_DO_ANEXO);

  /*
    Nada e gerado: a comparacao e por NOME, e `medium` ja esta la com as medidas
    velhas. O legado diz por que: "we keep the old sub-sizes with the previous
    dimensions as the image may have been used in an older post".
  */
  assert.deepEqual(derivadasPedidas, []);
});

/* ── O NOME DA DERIVADA, QUE E ENDERECO PUBLICO ───────────────────────────── */

test('o nome da derivada e `{nome}-{largura}x{altura}.{extensao}` (class-wp-image-editor.php:435)', () => {
  assert.equal(
    caminhoDaDerivada(`${PASTA_DO_MES}/ferias no mar.jpg`, 300, 200, 'jpg'),
    `${PASTA_DO_MES}/ferias no mar-300x200.jpg`,
  );
  // A extensao do nome final e sempre em minusculas (`:447`), e o resto do nome
  // conserva a caixa.
  assert.equal(
    caminhoDaDerivada(`${PASTA_DO_MES}/Foto.JPG`, 150, 150, 'JPG'),
    `${PASTA_DO_MES}/Foto-150x150.jpg`,
  );
});

test('a derivada de um HEIC sai em JPEG, porque o mapa de conversao nao e vazio desde 6.7', () => {
  const formato = formatoDeSaidaDaDerivada({
    caminhoDaOrigem: `${PASTA_DO_MES}/foto.heic`,
    tipoMimeDaOrigem: 'image/heic',
    suporta: () => true,
  });

  assert.deepEqual(formato, { tipoMime: 'image/jpeg', extensao: 'jpg' });
  assert.equal(
    caminhoDaDerivada(
      `${PASTA_DO_MES}/foto.heic`,
      150,
      150,
      formato.extensao,
    ),
    `${PASTA_DO_MES}/foto-150x150.jpg`,
  );
});

test('tipo que a implementacao nao suporta cai no padrao do editor (class-wp-image-editor.php:383)', () => {
  const formato = formatoDeSaidaDaDerivada({
    caminhoDaOrigem: `${PASTA_DO_MES}/animacao.avif`,
    tipoMimeDaOrigem: 'image/avif',
    suporta: (tipoMime) => tipoMime === 'image/jpeg',
  });

  assert.deepEqual(formato, { tipoMime: 'image/jpeg', extensao: 'jpg' });
});

test('a conversao que a implementacao nao suporta nao acontece (class-wp-image-editor.php:372)', () => {
  const formato = formatoDeSaidaDaDerivada({
    caminhoDaOrigem: `${PASTA_DO_MES}/foto.heic`,
    tipoMimeDaOrigem: 'image/heic',
    // Suporta HEIC e nao suporta JPEG: a conversao declarada nao vale.
    suporta: (tipoMime) => tipoMime === 'image/heic',
  });

  assert.deepEqual(formato, { tipoMime: 'image/heic', extensao: 'heic' });
});

/* ── A COMPOSICAO: NENHUMA OPERACAO A MAIS ────────────────────────────────── */

test('a geracao abre a imagem UMA vez e nao toca a porta de sistema de arquivos (@composicao)', () => {
  const { contexto, operacoesDeImagem, dados } = cenario();

  criarDerivadasDeImagem(contexto, { anexoId: ID_DO_ANEXO, caminho: CAMINHO });

  assert.deepEqual(
    operacoesDeImagem.filter((operacao) => operacao.startsWith('abrir')),
    [`abrir ${CAMINHO}`],
  );
  // A porta de arquivos lanca em qualquer operacao (ver `cenario()`): o legado
  // tambem nao a usa aqui — quem grava arquivo e a biblioteca de imagem.
  // E nenhuma leitura de dados sai desta operacao: o metadado e gravado, nao
  // lido, porque a ingestao recebe o metadado que ela mesma montou.
  assert.deepEqual(dados.selecoes, []);
});

test('o metadado gravado a cada derivada e cumulativo, nao so a ultima (image.php:496)', () => {
  const { contexto, metadadoGravado } = cenario();

  gerarDerivadas(contexto, {
    anexoId: ID_DO_ANEXO,
    caminho: CAMINHO,
    tamanhos: tamanhosRegistrados(
      contexto.opcoesDeTamanho,
      TAMANHOS_ADICIONAIS_DE_FABRICA,
    ),
    metadado: {
      tipo: 'arranjo',
      entradas: [
        { chave: { tipo: 'texto', valor: 'width' }, valor: { tipo: 'inteiro', valor: 3000 } },
        { chave: { tipo: 'texto', valor: 'height' }, valor: { tipo: 'inteiro', valor: 2000 } },
      ],
    },
  });

  const contagens = metadadoGravado.map(
    (valor) => lerMetadadoDeAnexo(valor)?.derivadas.length,
  );
  assert.deepEqual(contagens, [1, 2, 3, 4, 5, 6]);
});

