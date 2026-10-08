/**
 * Testes da entrega de T001: "o modulo carrega com as portas de dados, de
 * sistema de arquivos e de processamento de imagem declaradas, e os tamanhos de
 * fabrica do legado registrados como dado".
 *
 * Nao sao os testes de nenhuma historia — esses sao T004, T006, T008 e os demais
 * `[P]` de `tasks.md`, um por caso de `backlog/tests.md`. Aqui se afirma so o
 * que T001 entrega, mais tres invariantes que um esqueleto pode quebrar em
 * silencio: estado de modulo (`EXT-CONTEXTO`), trabalho no carregamento
 * (`EXT-ORDEM`) e falha que atravessa a porta como **valor**, que e o que torna
 * o silencio de `M4` reproduzivel.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarModuloDeMidia,
  NOMES_DE_TAMANHO_DE_FABRICA,
  OPCOES_SEMEADAS_DE_TAMANHO,
  TAMANHOS_DE_IMAGEM_DE_FABRICA,
  type Consulta,
  type ImagemAberta,
  type PortaDeDados,
  type PortaDeProcessamentoDeImagem,
  type PortaDeSistemaDeArquivos,
  type PortasDeMidia,
  type ResultadoDeEscrita,
} from './index.js';

/** Conta os toques em cada porta, para afirmar que o modulo nao as usa ainda. */
interface Toques {
  selecionar: Consulta[];
  escrever: Consulta[];
  arquivo: string[];
  imagem: string[];
}

interface Duplos {
  portas: PortasDeMidia;
  toques: Toques;
}

function portasDeTeste(
  prefixoDeTabela = 'wp_',
  raizDeEnvios = '/var/www/wp-content/uploads',
  falhaDeArquivo: string | null = null,
  bibliotecaDeImagemDisponivel = true,
): Duplos {
  const toques: Toques = {
    selecionar: [],
    escrever: [],
    arquivo: [],
    imagem: [],
  };

  const dados: PortaDeDados = {
    prefixoDeTabela,
    selecionar(consulta) {
      toques.selecionar.push(consulta);
      return [];
    },
    escrever(consulta): ResultadoDeEscrita {
      toques.escrever.push(consulta);
      return { linhasAfetadas: 0, idGerado: null };
    },
  };

  /*
    O duplo registra cada operacao na ordem em que a recebe, que e o que o
    cenario `@composicao` de `parity_tests/14-ingestao-e-derivadas-de-midia.feature`
    exige: "a porta de sistema de arquivos substituida por duplo que registra
    cada operacao ... a sequencia de operacoes registrada e identica a do
    oraculo". T001 nao tem sequencia para comparar; o que ele afirma e que a
    porta e substituivel sem tocar nenhum arquivo do modulo.
  */
  const sistemaDeArquivos: PortaDeSistemaDeArquivos = {
    raizDeEnvios,
    existe(caminho) {
      toques.arquivo.push(`existe ${caminho}`);
      return false;
    },
    ehPasta(caminho) {
      toques.arquivo.push(`ehPasta ${caminho}`);
      return false;
    },
    gravavel(caminho) {
      toques.arquivo.push(`gravavel ${caminho}`);
      return falhaDeArquivo === null;
    },
    criarPasta(caminho) {
      toques.arquivo.push(`criarPasta ${caminho}`);
      return falhaDeArquivo === null
        ? { concluido: true }
        : { concluido: false, mensagem: falhaDeArquivo };
    },
    escrever(caminho) {
      toques.arquivo.push(`escrever ${caminho}`);
      return falhaDeArquivo === null
        ? { concluido: true }
        : { concluido: false, mensagem: falhaDeArquivo };
    },
    ler(caminho) {
      toques.arquivo.push(`ler ${caminho}`);
      return falhaDeArquivo === null
        ? { concluido: true, valor: new Uint8Array() }
        : { concluido: false, mensagem: falhaDeArquivo };
    },
    mover(origem, destino) {
      toques.arquivo.push(`mover ${origem} ${destino}`);
      return falhaDeArquivo === null
        ? { concluido: true }
        : { concluido: false, mensagem: falhaDeArquivo };
    },
    copiar(origem, destino) {
      toques.arquivo.push(`copiar ${origem} ${destino}`);
      return falhaDeArquivo === null
        ? { concluido: true }
        : { concluido: false, mensagem: falhaDeArquivo };
    },
    apagar(caminho) {
      toques.arquivo.push(`apagar ${caminho}`);
      return falhaDeArquivo === null
        ? { concluido: true }
        : { concluido: false, mensagem: falhaDeArquivo };
    },
    listar(pasta) {
      toques.arquivo.push(`listar ${pasta}`);
      return falhaDeArquivo === null
        ? { concluido: true, valor: [] }
        : { concluido: false, mensagem: falhaDeArquivo };
    },
  };

  const imagemAberta: ImagemAberta = {
    dimensoes: () => ({ largura: 0, altura: 0 }),
    tipoMime: () => 'image/jpeg',
    redimensionar: () => ({ concluido: true }),
    girar: () => ({ concluido: true }),
    inverter: () => ({ concluido: true }),
    gravar: (caminho) => ({
      concluido: true,
      valor: {
        caminho,
        nomeDeArquivo: caminho,
        largura: 0,
        altura: 0,
        tipoMime: 'image/jpeg',
        bytes: 0,
      },
    }),
    derivar: (_tamanho, caminho) => ({
      concluido: true,
      valor: {
        nomeDeArquivo: caminho,
        largura: 0,
        altura: 0,
        tipoMime: 'image/jpeg',
        bytes: 0,
      },
    }),
  };

  const processamentoDeImagem: PortaDeProcessamentoDeImagem = {
    implementacao: 'duplo-de-teste',
    disponivel() {
      toques.imagem.push('disponivel');
      return bibliotecaDeImagemDisponivel;
    },
    suporta(tipoMime) {
      toques.imagem.push(`suporta ${tipoMime}`);
      return bibliotecaDeImagemDisponivel;
    },
    abrir(caminho) {
      toques.imagem.push(`abrir ${caminho}`);
      return bibliotecaDeImagemDisponivel
        ? { concluido: true, valor: imagemAberta }
        : { concluido: false, motivo: 'sem biblioteca de imagem' };
    },
  };

  return {
    portas: { dados, sistemaDeArquivos, processamentoDeImagem },
    toques,
  };
}

test('o modulo carrega com as tres portas declaradas', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeMidia(portas);

  assert.equal(modulo.nome, 'midia');
  assert.equal(modulo.portas.dados, portas.dados);
  assert.equal(modulo.portas.sistemaDeArquivos, portas.sistemaDeArquivos);
  assert.equal(
    modulo.portas.processamentoDeImagem,
    portas.processamentoDeImagem,
  );
});

test('a superficie do modulo tem exatamente o que as tarefas fechadas entregaram', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeMidia(portas);

  // Esta lista cresce NA TAREFA DE CADA HISTORIA, nunca antes: e o que o P4 da
  // constituicao cobra, "toda operacao exposta nova nasce com declaracao
  // explicita de permissao". T001: nenhuma operacao, so as portas e o dado dos
  // tamanhos de fabrica. A pauta do que entra em cada tarefa esta na tabela do
  // `index.ts`.
  assert.deepEqual(Object.keys(modulo).sort(), [
    'nome',
    'portas',
    'tamanhosDeFabrica',
  ]);
});

test('criar o modulo nao toca em porta nenhuma (EXT-ORDEM: nada se resolve no carregamento)', () => {
  const { portas, toques } = portasDeTeste();

  criarModuloDeMidia(portas);

  assert.deepEqual(toques.selecionar, []);
  assert.deepEqual(toques.escrever, []);
  assert.deepEqual(toques.arquivo, []);
  assert.deepEqual(toques.imagem, []);
});

test('duas composicoes nao compartilham estado (EXT-CONTEXTO, BR-MIGRAR-105)', () => {
  const primeira = portasDeTeste('wp_', '/sites/1/uploads');
  const segunda = portasDeTeste('wp_2_', '/sites/2/uploads');

  const moduloA = criarModuloDeMidia(primeira.portas);
  const moduloB = criarModuloDeMidia(segunda.portas);

  assert.notEqual(moduloA, moduloB);
  assert.equal(moduloA.portas.dados.prefixoDeTabela, 'wp_');
  assert.equal(moduloB.portas.dados.prefixoDeTabela, 'wp_2_');

  // O prefixo carrega o identificador do site, e a raiz de envios tambem: numa
  // rede cada site tem a sua area. Se o modulo guardasse a porta em estado de
  // modulo, um site escreveria arquivo na area do outro.
  assert.equal(moduloA.portas.sistemaDeArquivos.raizDeEnvios, '/sites/1/uploads');
  assert.equal(moduloB.portas.sistemaDeArquivos.raizDeEnvios, '/sites/2/uploads');

  moduloA.portas.sistemaDeArquivos.existe('/sites/1/uploads/a.jpg');
  assert.deepEqual(primeira.toques.arquivo, ['existe /sites/1/uploads/a.jpg']);
  assert.deepEqual(segunda.toques.arquivo, []);
});

test('os seis tamanhos de fabrica sao os de M2, com os valores e a ordem do legado (CA-3.2)', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeMidia(portas);

  // BR-MIGRAR-058: "quatro tamanhos nascem com o site: thumbnail 150x150,
  // medium 300, medium_large 768, large 1024 - mais 1536x1536 e 2048x2048
  // registrados em codigo para telas de alta densidade". A ordem e a de
  // `get_intermediate_image_sizes()`: os quatro fixos, depois os adicionais na
  // ordem de registro.
  assert.deepEqual(
    modulo.tamanhosDeFabrica.map((tamanho) => tamanho.nome),
    [
      'thumbnail',
      'medium',
      'medium_large',
      'large',
      '1536x1536',
      '2048x2048',
    ],
  );

  assert.deepEqual(
    modulo.tamanhosDeFabrica.map((tamanho) => [
      tamanho.nome,
      tamanho.largura,
      tamanho.altura,
      tamanho.recorte,
      tamanho.origem,
    ]),
    [
      // O unico recortado, e so porque `thumbnail_crop` e semeada em 1.
      ['thumbnail', 150, 150, true, 'opcao-semeada'],
      ['medium', 300, 300, false, 'opcao-semeada'],
      // O zero e a altura, e e valor valido: a largura manda.
      ['medium_large', 768, 0, false, 'opcao-semeada'],
      ['large', 1024, 1024, false, 'opcao-semeada'],
      // Os dois de alta densidade nao vem de opcao: vem de codigo.
      ['1536x1536', 1536, 1536, false, 'codigo'],
      ['2048x2048', 2048, 2048, false, 'codigo'],
    ],
  );

  // Metade vem de opcao e metade de codigo, e "as duas fontes sao a regra".
  assert.equal(
    modulo.tamanhosDeFabrica.filter((t) => t.origem === 'opcao-semeada').length,
    4,
  );
  assert.equal(
    modulo.tamanhosDeFabrica.filter((t) => t.origem === 'codigo').length,
    2,
  );

  // A lista de nomes e a mesma coisa que a ordem das entradas: quem acrescentar
  // tamanho a uma e nao a outra quebra aqui.
  assert.deepEqual(
    [...NOMES_DE_TAMANHO_DE_FABRICA],
    modulo.tamanhosDeFabrica.map((tamanho) => tamanho.nome),
  );
});

test('o ponto de configuracao de cada tamanho e o nome da opcao do legado (P6)', () => {
  // "Cada numero vive num ponto de configuracao nomeado, com o valor de fabrica
  // do legado." Para os quatro de opcao o ponto e a opcao, e o nome dela e
  // contrato de tela: "o nome do campo e contrato: nao renomear".
  assert.deepEqual(
    TAMANHOS_DE_IMAGEM_DE_FABRICA.map((tamanho) => [
      tamanho.nome,
      tamanho.opcoes === null ? null : tamanho.opcoes.largura,
      tamanho.opcoes === null ? null : tamanho.opcoes.altura,
      tamanho.opcoes === null ? null : tamanho.opcoes.recorte,
    ]),
    [
      ['thumbnail', 'thumbnail_size_w', 'thumbnail_size_h', 'thumbnail_crop'],
      ['medium', 'medium_size_w', 'medium_size_h', 'medium_crop'],
      [
        'medium_large',
        'medium_large_size_w',
        'medium_large_size_h',
        'medium_large_crop',
      ],
      ['large', 'large_size_w', 'large_size_h', 'large_crop'],
      // Registrado em codigo: nao ha opcao que o altere.
      ['1536x1536', null, null, null],
      ['2048x2048', null, null, null],
    ],
  );

  // Sao NOVE linhas semeadas, e a ausencia das outras tres opcoes de recorte e
  // o ponto: so `thumbnail_crop` e semeada, e as outras tres sao consultadas e
  // devolvem false. `parity_specs.md` poe a tabela de opcoes na area "efeito no
  // banco", logo semear as quatro seria divergencia.
  assert.deepEqual(Object.keys(OPCOES_SEMEADAS_DE_TAMANHO).sort(), [
    'large_size_h',
    'large_size_w',
    'medium_large_size_h',
    'medium_large_size_w',
    'medium_size_h',
    'medium_size_w',
    'thumbnail_crop',
    'thumbnail_size_h',
    'thumbnail_size_w',
  ]);
  assert.equal(OPCOES_SEMEADAS_DE_TAMANHO['thumbnail_crop'], 1);
  assert.equal(OPCOES_SEMEADAS_DE_TAMANHO['medium_large_size_h'], 0);
  assert.equal(OPCOES_SEMEADAS_DE_TAMANHO['medium_crop'], undefined);
  assert.equal(OPCOES_SEMEADAS_DE_TAMANHO['large_crop'], undefined);
});

test('o dado dos tamanhos e congelado, porque e compartilhado (EXT-CONTEXTO)', () => {
  const moduloA = criarModuloDeMidia(portasDeTeste().portas);
  const moduloB = criarModuloDeMidia(portasDeTeste().portas);

  // Duas composicoes recebem a MESMA lista, e e por isso que ela nao pode ser
  // mutavel: dado imutavel pode ser compartilhado, dado mutavel faria um site
  // enxergar o tamanho registrado do outro.
  assert.equal(moduloA.tamanhosDeFabrica, moduloB.tamanhosDeFabrica);
  assert.ok(Object.isFrozen(moduloA.tamanhosDeFabrica));
  for (const tamanho of moduloA.tamanhosDeFabrica) {
    assert.ok(Object.isFrozen(tamanho));
  }
  assert.ok(Object.isFrozen(OPCOES_SEMEADAS_DE_TAMANHO));
});

test('a falha do sistema de arquivos atravessa a porta como valor, com a mensagem (CA-1.5, D3)', () => {
  const { portas } = portasDeTeste(
    'wp_',
    '/var/www/wp-content/uploads',
    'Unable to create directory wp-content/uploads/2026/10. Is its parent directory writable by the server?',
  );

  const modulo = criarModuloDeMidia(portas);

  // O modulo entrega a porta sem envolve-la: nada entre o chamador e o disco
  // pode transformar este estado em excecao. CA-1.5 exige a mensagem do sistema
  // de arquivos no erro, logo ela tem de atravessar a porta.
  const resultado = modulo.portas.sistemaDeArquivos.criarPasta(
    '/var/www/wp-content/uploads/2026/10',
  );

  assert.equal(resultado.concluido, false);
  assert.equal(
    resultado.concluido === false ? resultado.mensagem : null,
    'Unable to create directory wp-content/uploads/2026/10. Is its parent directory writable by the server?',
  );
});

test('a ausencia de biblioteca de imagem e valor, nao excecao (M4, CA-7.6)', () => {
  const { portas } = portasDeTeste('wp_', '/uploads', null, false);

  const modulo = criarModuloDeMidia(portas);

  // "Falha ao gerar derivada de imagem e silenciosa" (M4, BR-MIGRAR-060): o
  // chamador precisa poder IGNORAR a falha, e isso e impossivel se a porta
  // lancar. UC-12 registra o caminho do legado: `return` silencioso com o
  // comentario "This image cannot be edited".
  assert.equal(modulo.portas.processamentoDeImagem.disponivel(), false);

  const aberta = modulo.portas.processamentoDeImagem.abrir('/uploads/foto.jpg');
  assert.equal(aberta.concluido, false);
  assert.equal(
    aberta.concluido === false ? aberta.motivo : null,
    'sem biblioteca de imagem',
  );
});
