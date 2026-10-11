/**
 * Testes de **T005** — US-2, *"escolher a apresentacao do conteudo por uma
 * hierarquia declarada de modelos"*, com os quatro criterios de aceite da
 * tarefa:
 *
 * | criterio | o que afirma |
 * |---|---|
 * | CA-2.1 | para cada tipo de resultado, procura os modelos em ordem **declarada** e usa o primeiro que existe |
 * | CA-2.2 | ha sempre um modelo final de reserva |
 * | CA-2.3 | a ordem de procura e inspecionavel por quem desenvolve o tema |
 * | CA-2.4 | trocar o tema troca a apresentacao sem alterar conteudo nem consulta |
 *
 * Mais o que T005 entrega e que nao e critario de aceite proprio: as seis saidas
 * de `template-loader.php` que **nao** passam pelo laco de modelos, a etapa 5 do
 * atendimento (`WP::register_globals()`), os tres pontos de extensao novos e os
 * quirks do legado que um porte "limpo" apaga em silencio.
 *
 * **Nao sao os testes do catalogo.** Os quatro casos `UT-039-1` a `UT-039-4` de
 * `backlog/tests.md` sao de **T006**, a tarefa `[P]`, e nenhum deles e afirmado
 * aqui: aqui se afirma o critario de aceite, la se transcreve o caso.
 *
 * ⚠️ **Nada externo entra nestes testes.** O tema e um duplo que **registra**
 * qual caminho lhe foi perguntado em vez de tocar o sistema de arquivos — e e
 * assim que se afirma a ordem dos tres diretorios de `locate_template()`, que
 * nenhuma assercao sobre o modelo escolhido alcanca.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  consultarConteudo,
  criarModuloDeLeituraPublica,
  escolherApresentacao,
  HIERARQUIA_DE_MODELOS,
  modeloDaConsulta,
  publicarParaOTema,
  registroDeTipos,
  TEMA_SEM_MODELOS,
  type ConsultaDeConteudo,
  type ContextoDaApresentacao,
  type ContextoDaConsulta,
  type ConteudoConsultado,
  type CriteriosDaConsulta,
  type ObjetoConsultadoNoTema,
  type PortasDeLeituraPublica,
  type TemaAtivo,
} from '../index.js';

/** A porta de dados, que **nenhuma** destas operacoes deve tocar. */
function portasDeTeste(): PortasDeLeituraPublica {
  return {
    dados: {
      prefixoDeTabela: 'wp_',
      selecionar() {
        throw new Error('a escolha de apresentacao nao consulta o banco');
      },
      escrever() {
        throw new Error('a escolha de apresentacao nao grava');
      },
    },
  };
}

const FILHO = '/temas/filho';
const PAI = '/temas/pai';
const COMPATIBILIDADE = '/wp-includes/theme-compat';

/**
 * O duplo do tema: uma lista de caminhos que existem, e o registro de tudo que
 * lhe foi perguntado, na ordem.
 */
function temaDeTeste(
  arquivos: readonly string[],
  extras: Partial<TemaAtivo> = {},
): { readonly tema: TemaAtivo; readonly perguntas: string[] } {
  const perguntas: string[] = [];
  const existentes = new Set(arquivos);
  return {
    tema: {
      diretorioDaFolhaDeEstilo: FILHO,
      diretorioDoModelo: PAI,
      folhaDeEstilo: 'filho',
      modelo: 'pai',
      diretorioDeCompatibilidade: COMPATIBILIDADE,
      arquivoExiste: (caminho) => {
        perguntas.push(caminho);
        return existentes.has(caminho);
      },
      ...extras,
    },
    perguntas,
  };
}

/** Um tema sem tema pai: a folha de estilo e o modelo sao o mesmo diretorio. */
function temaSozinho(arquivos: readonly string[]): TemaAtivo {
  return temaDeTeste(arquivos, { diretorioDoModelo: FILHO, modelo: 'filho' })
    .tema;
}

/** Um conteudo gravado, nos cinco campos que a consulta le. */
function conteudo(
  parcial: Partial<ConteudoConsultado> & { readonly id: number },
): ConteudoConsultado {
  return {
    identificadorNaUrl: 'ola-mundo',
    tipo: 'post',
    corpo: '',
    data: '2026-10-11 09:00:00',
    ...parcial,
  };
}

/** Monta uma consulta de verdade a partir dos criterios. */
function consultaDe(
  criterios: CriteriosDaConsulta,
  contexto: ContextoDaConsulta = {},
): ConsultaDeConteudo {
  return consultarConteudo(criterios, { contexto });
}

/** Uma consulta com o objeto consultado que o repositorio devolveu. */
function consultaComObjeto(
  criterios: CriteriosDaConsulta,
  objetoConsultado: ObjetoConsultadoNoTema,
  linhas: readonly ConteudoConsultado[] = [],
): ConsultaDeConteudo {
  return consultaDe(criterios, {
    repositorio: () => ({ conteudos: linhas, objetoConsultado }),
  });
}

// ---------------------------------------------------------------------------
// CA-2.1 — a ordem e declarada, e vence o primeiro que existe
// ---------------------------------------------------------------------------

test('CA-2.1 um conteudo unico procura os quatro candidatos na ordem declarada e usa o primeiro que existe', () => {
  const tema = temaSozinho([`${FILHO}/single-post.php`, `${FILHO}/single.php`]);
  const consulta = consultaComObjeto(
    { name: 'ola-mundo' },
    { id: 7, tipo: 'post', identificadorNaUrl: 'ola-mundo' },
    [conteudo({ id: 7 })],
  );

  const escolhida = escolherApresentacao(consulta, { contexto: { tema } });

  // `get_single_template()` (`template.php:553-576`): o modelo declarado no
  // conteudo, a forma decodificada quando difere, o identificador, o tipo, e
  // `single.php` por ultimo.
  assert.deepEqual(escolhida.candidatos, [
    'single-post-ola-mundo.php',
    'single-post.php',
    'single.php',
  ]);
  assert.equal(escolhida.modelo, `${FILHO}/single-post.php`);
  assert.equal(escolhida.predicado, 'is_single');
  assert.equal(escolhida.tipo, 'single');
  assert.equal(escolhida.saida, 'modelo');
});

test('CA-2.1 com o candidato mais especifico ausente, vence o seguinte da MESMA lista', () => {
  const tema = temaSozinho([`${FILHO}/single.php`]);
  const consulta = consultaComObjeto(
    { name: 'ola-mundo' },
    { id: 7, tipo: 'post', identificadorNaUrl: 'ola-mundo' },
    [conteudo({ id: 7 })],
  );

  const escolhida = escolherApresentacao(consulta, { contexto: { tema } });

  assert.equal(escolhida.modelo, `${FILHO}/single.php`);
  assert.equal(escolhida.predicado, 'is_single');
});

test('CA-2.1 o modelo declarado no proprio conteudo vem ANTES de tudo, e so se `validate_file` o aceita', () => {
  const tema = temaSozinho([
    `${FILHO}/modelos/largura-total.php`,
    `${FILHO}/single-post.php`,
  ]);
  const objeto: ObjetoConsultadoNoTema = {
    id: 7,
    tipo: 'post',
    identificadorNaUrl: 'ola-mundo',
  };
  const consulta = consultaComObjeto({ name: 'ola-mundo' }, objeto, [
    conteudo({ id: 7 }),
  ]);

  const aceito = escolherApresentacao(consulta, {
    contexto: {
      tema,
      modeloDeclaradoNoConteudo: () => 'modelos/largura-total.php',
    },
  });
  assert.equal(aceito.candidatos[0], 'modelos/largura-total.php');
  assert.equal(aceito.modelo, `${FILHO}/modelos/largura-total.php`);

  // `validate_file()` devolve 1 para `../` em posicao que nao e o fim
  // (`functions.php:6393`), e o candidato NAO entra na lista.
  const recusado = escolherApresentacao(consulta, {
    contexto: {
      tema,
      modeloDeclaradoNoConteudo: () => '../fora/modelo.php/x',
    },
  });
  assert.equal(recusado.candidatos[0], 'single-post-ola-mundo.php');
  assert.equal(recusado.modelo, `${FILHO}/single-post.php`);

  // E `'default'` e tratado como ausencia pelo proprio legado
  // (`post-template.php:1913`).
  const padrao = escolherApresentacao(consulta, {
    contexto: { tema, modeloDeclaradoNoConteudo: () => 'default' },
  });
  assert.equal(padrao.candidatos[0], 'single-post-ola-mundo.php');
});

test('CA-2.1 cada tipo de resultado tem a sua lista, e o arquivo de termo chega com identificador e numero', () => {
  const tema = temaSozinho([`${FILHO}/category.php`]);
  const consulta = consultaComObjeto(
    { cat: '5' },
    { id: 5, identificadorDoTermo: 'noticias', contextoDoTermo: 'category' },
  );

  const escolhida = escolherApresentacao(consulta, { contexto: { tema } });

  // `get_category_template()` (`template.php:254-272`).
  assert.deepEqual(escolhida.candidatos, [
    'category-noticias.php',
    'category-5.php',
    'category.php',
  ]);
  assert.equal(escolhida.predicado, 'is_category');
});

test('CA-2.1 a forma decodificada do identificador antecede a literal, e so quando difere', () => {
  const tema = temaSozinho([`${FILHO}/category.php`]);

  const comAcento = escolherApresentacao(
    consultaComObjeto(
      { cat: '5' },
      {
        id: 5,
        identificadorDoTermo: 's%C3%A3o-paulo',
        contextoDoTermo: 'category',
      },
    ),
    { contexto: { tema } },
  );

  // `urldecode()` muda o valor, logo o decodificado entra na frente
  // (`template.php:261-264`).
  assert.deepEqual(comAcento.candidatos, [
    'category-são-paulo.php',
    'category-s%C3%A3o-paulo.php',
    'category-5.php',
    'category.php',
  ]);

  const semAcento = escolherApresentacao(
    consultaComObjeto(
      { cat: '5' },
      { id: 5, identificadorDoTermo: 'noticias', contextoDoTermo: 'category' },
    ),
    { contexto: { tema } },
  );
  assert.equal(semAcento.candidatos.length, 3);
});

// ---------------------------------------------------------------------------
// CA-2.2 — a reserva final
// ---------------------------------------------------------------------------

test('CA-2.2 sem nenhum modelo especifico, a procura termina em `index.php`', () => {
  const tema = temaSozinho([`${FILHO}/index.php`]);
  const consulta = consultaComObjeto(
    { name: 'ola-mundo' },
    { id: 7, tipo: 'post', identificadorNaUrl: 'ola-mundo' },
    [conteudo({ id: 7 })],
  );

  const escolhida = escolherApresentacao(consulta, { contexto: { tema } });

  // `if ( ! $template ) { $template = get_index_template(); }`
  // (`template-loader.php:103-105`), FORA do laco — e por isso o passo da
  // reserva nao tem predicado.
  assert.equal(escolhida.modelo, `${FILHO}/index.php`);
  assert.equal(escolhida.tipo, 'index');
  assert.equal(escolhida.predicado, '');
  assert.deepEqual(escolhida.candidatos, ['index.php']);

  const ultimo = escolhida.procura[escolhida.procura.length - 1];
  assert.equal(ultimo?.tipo, 'index');
  assert.equal(ultimo?.consultouOTema, true);
});

test('CA-2.2 a reserva final tambem vale para a listagem inicial, e ali `index.php` esta DENTRO da lista', () => {
  const tema = temaSozinho([`${FILHO}/index.php`]);

  const escolhida = escolherApresentacao(consultaDe({}), { contexto: { tema } });

  // `get_home_template()` declara `array( 'home.php', 'index.php' )`
  // (`template.php:400`): a listagem inicial cai no modelo de reserva **sem**
  // passar pela reserva final, e por isso o predicado continua sendo `is_home`.
  assert.equal(escolhida.predicado, 'is_home');
  assert.deepEqual(escolhida.candidatos, ['home.php', 'index.php']);
  assert.equal(escolhida.modelo, `${FILHO}/index.php`);
});

test('CA-2.2 a reserva final NAO inventa apresentacao quando nem `index.php` existe', () => {
  const escolhida = escolherApresentacao(consultaDe({}), {
    contexto: { tema: TEMA_SEM_MODELOS },
  });

  // O legado sai de `template-loader.php` com `$template` vazio, nao inclui
  // nada, e so avisa quem pode trocar tema (`:133-137`). Inventar um modelo
  // sintetico aqui seria inventar comportamento (P1).
  assert.equal(escolhida.saida, 'modelo');
  assert.equal(escolhida.modelo, '');
  assert.equal(escolhida.tipo, 'index');
});

test('CA-2.2 lista vazia na regra vira `{tipo}.php`, que e o que o ponto de extensao recebe', () => {
  const tema = temaSozinho([`${FILHO}/404.php`]);
  const vistos: readonly string[][] = [];
  const recebidos: string[][] = [];

  const entrada = modeloDaConsulta('404', [], tema, {
    sobreOsCandidatos: [
      (_tipo, candidatos) => {
        recebidos.push([...candidatos]);
        return candidatos;
      },
    ],
  });

  // `if ( empty( $templates ) ) { $templates = array( "{$type}.php" ); }`
  // (`template.php:26-28`) roda ANTES do filtro.
  assert.deepEqual(recebidos, [['404.php']]);
  assert.deepEqual(entrada.candidatos, ['404.php']);
  assert.equal(entrada.modelo, `${FILHO}/404.php`);
  assert.deepEqual(vistos, []);
});

// ---------------------------------------------------------------------------
// CA-2.3 — a ordem e inspecionavel
// ---------------------------------------------------------------------------

test('CA-2.3 a hierarquia e dado: dezessete regras, com o nome do predicado do legado e na ordem do legado', () => {
  assert.equal(HIERARQUIA_DE_MODELOS.length, 17);

  // `template-loader.php:67-85`, linha por linha.
  assert.deepEqual(
    HIERARQUIA_DE_MODELOS.map((regra) => regra.predicado),
    [
      'is_embed',
      'is_404',
      'is_search',
      'is_front_page',
      'is_home',
      'is_privacy_policy',
      'is_post_type_archive',
      'is_tax',
      'is_attachment',
      'is_single',
      'is_page',
      'is_singular',
      'is_category',
      'is_tag',
      'is_author',
      'is_date',
      'is_archive',
    ],
  );

  // O `$type` decide o nome dos dois pontos de extensao, e duas regras
  // compartilham `archive` de proposito (`template.php:161` e `:187`).
  assert.deepEqual(
    HIERARQUIA_DE_MODELOS.map((regra) => regra.tipo),
    [
      'embed',
      '404',
      'search',
      'frontpage',
      'home',
      'privacypolicy',
      'archive',
      'taxonomy',
      'attachment',
      'single',
      'page',
      'singular',
      'category',
      'tag',
      'author',
      'date',
      'archive',
    ],
  );
});

test('CA-2.3 a procura registra cada passo, e distingue os tres estados de um passo', () => {
  const tema = temaSozinho([`${FILHO}/index.php`]);
  const consulta = consultaComObjeto(
    { name: 'ola-mundo' },
    { id: 7, tipo: 'post', identificadorNaUrl: 'ola-mundo' },
    [conteudo({ id: 7 })],
  );

  const { procura } = escolherApresentacao(consulta, { contexto: { tema } });

  // ⚠️ Nada foi localizado, logo o laco **nao para**: ele percorre as dezessete
  // regras e so entao cai na reserva final. E o `break` de
  // `template-loader.php:99`, que depende do modelo achado e nao do predicado.
  assert.deepEqual(
    procura.map((passo) => passo.predicado),
    [...HIERARQUIA_DE_MODELOS.map((regra) => regra.predicado), ''],
  );

  // E o laco consultou o tema em TRES regras, porque tres predicados valem para
  // um conteudo unico: `is_single`, `is_singular` e nada mais.
  assert.deepEqual(
    procura.filter((passo) => passo.valeu).map((passo) => passo.predicado),
    ['is_single', 'is_singular', ''],
  );

  // Predicado que nao valeu: nada foi consultado.
  const semValer = procura[0];
  assert.equal(semValer?.valeu, false);
  assert.equal(semValer?.consultouOTema, false);
  assert.deepEqual(semValer?.candidatos, []);

  // Predicado que valeu e o tema foi consultado, sem achar nada.
  const consultado = procura[9];
  assert.equal(consultado?.predicado, 'is_single');
  assert.equal(consultado?.valeu, true);
  assert.equal(consultado?.consultouOTema, true);
  assert.equal(consultado?.modelo, '');
  assert.deepEqual(consultado?.candidatos, [
    'single-post-ola-mundo.php',
    'single-post.php',
    'single.php',
  ]);
});

test('CA-2.3 um predicado pode valer e a regra sair SEM consultar o tema, e isso aparece na procura', () => {
  const tema = temaSozinho([`${FILHO}/archive.php`]);
  const tipos = registroDeTipos([
    {
      nome: 'livro',
      criterioProprio: 'livro',
      consultavelPublicamente: true,
      interno: false,
      publico: true,
      temArquivo: true,
    },
    {
      nome: 'bilhete',
      criterioProprio: 'bilhete',
      consultavelPublicamente: true,
      interno: false,
      publico: true,
      temArquivo: false,
    },
  ]);

  // `pre_get_posts` dispara DEPOIS de `parse_query` e o legado nao reanalisa
  // (`class-wp-query.php:1916`): `is_post_type_archive` fica ligado pelo tipo
  // ANTIGO, e a hierarquia le o tipo NOVO, que nao tem pagina de arquivo. Logo
  // `get_post_type_archive_template()` sai com texto vazio sem consultar o tema
  // (`template.php:183-185`) e a procura cai em `is_archive`.
  const consulta = consultarConteudo(
    { post_type: 'livro' },
    {
      contexto: { tiposDeConteudo: tipos },
      pontosDeExtensao: {
        antesDeConsultar: [
          (criterios) => ({ ...criterios, post_type: 'bilhete' }),
        ],
      },
    },
  );
  assert.equal(consulta.tipos.arquivoDeTipoDeConteudo, true);

  const escolhida = escolherApresentacao(consulta, {
    contexto: { tema, tiposDeConteudo: tipos },
  });

  const semConsultar = escolhida.procura.find(
    (passo) => passo.predicado === 'is_post_type_archive',
  );
  assert.equal(semConsultar?.valeu, true);
  assert.equal(semConsultar?.consultouOTema, false);

  assert.equal(escolhida.predicado, 'is_archive');
  assert.deepEqual(escolhida.candidatos, ['archive-bilhete.php', 'archive.php']);
  assert.equal(escolhida.modelo, `${FILHO}/archive.php`);
});

// ---------------------------------------------------------------------------
// CA-2.4 — trocar o tema troca a apresentacao, e nada mais
// ---------------------------------------------------------------------------

test('CA-2.4 a mesma consulta, dois temas, duas apresentacoes — e a consulta nao muda', () => {
  const consulta = consultaComObjeto(
    { name: 'ola-mundo' },
    { id: 7, tipo: 'post', identificadorNaUrl: 'ola-mundo' },
    [conteudo({ id: 7 })],
  );
  const antes = {
    criterios: { ...consulta.criterios },
    tipos: { ...consulta.tipos },
    conteudos: [...consulta.conteudos],
  };

  const comEspecifico = escolherApresentacao(consulta, {
    contexto: { tema: temaSozinho([`${FILHO}/single-post.php`]) },
  });
  const comGenerico = escolherApresentacao(consulta, {
    contexto: { tema: temaSozinho([`${FILHO}/index.php`]) },
  });

  assert.equal(comEspecifico.modelo, `${FILHO}/single-post.php`);
  assert.equal(comGenerico.modelo, `${FILHO}/index.php`);

  // Nem o conteudo nem a consulta foram tocados: a troca de tema e a troca de
  // um argumento.
  assert.deepEqual({ ...consulta.criterios }, antes.criterios);
  assert.deepEqual({ ...consulta.tipos }, antes.tipos);
  assert.deepEqual([...consulta.conteudos], antes.conteudos);
  assert.equal(consulta.conteudo?.id, 7);
});

test('CA-2.4 duas apresentacoes concorrentes nao compartilham estado (EXT-CONTEXTO, BR-MIGRAR-105)', () => {
  const consulta = consultaDe({});
  const primeiro = temaDeTeste([`${FILHO}/home.php`]);
  const segundo = temaDeTeste([`${FILHO}/index.php`]);

  const a = escolherApresentacao(consulta, {
    contexto: { tema: primeiro.tema },
  });
  const b = escolherApresentacao(consulta, {
    contexto: { tema: segundo.tema },
  });

  assert.equal(a.modelo, `${FILHO}/home.php`);
  assert.equal(b.modelo, `${FILHO}/index.php`);

  // Cada tema foi perguntado so pela propria leitura, e a sequencia e a da
  // hierarquia: `front-page.php` nos tres diretorios, e depois `home.php`.
  assert.deepEqual(primeiro.perguntas, [
    `${FILHO}/front-page.php`,
    `${PAI}/front-page.php`,
    `${COMPATIBILIDADE}/front-page.php`,
    `${FILHO}/home.php`,
  ]);
  assert.deepEqual(segundo.perguntas, [
    `${FILHO}/front-page.php`,
    `${PAI}/front-page.php`,
    `${COMPATIBILIDADE}/front-page.php`,
    `${FILHO}/home.php`,
    `${PAI}/home.php`,
    `${COMPATIBILIDADE}/home.php`,
    `${FILHO}/index.php`,
  ]);
});

// ---------------------------------------------------------------------------
// `locate_template()` — a ordem dos tres diretorios, e o laco por candidato
// ---------------------------------------------------------------------------

test('a procura e por candidato e nao por diretorio: o tema pai vence o filho com o candidato mais especifico', () => {
  const { tema, perguntas } = temaDeTeste([
    `${PAI}/single-post.php`,
    `${FILHO}/single.php`,
  ]);
  const consulta = consultaComObjeto(
    { name: 'ola-mundo' },
    { id: 7, tipo: 'post', identificadorNaUrl: 'ola-mundo' },
    [conteudo({ id: 7 })],
  );

  const escolhida = escolherApresentacao(consulta, { contexto: { tema } });

  // `single-post.php` e consultado antes de `single.php`, nos tres diretorios,
  // e e achado no PAI — logo o pai vence o filho. Trocar a ordem dos dois lacos
  // inverteria a hierarquia inteira.
  assert.equal(escolhida.modelo, `${PAI}/single-post.php`);
  assert.deepEqual(perguntas, [
    `${FILHO}/single-post-ola-mundo.php`,
    `${PAI}/single-post-ola-mundo.php`,
    `${COMPATIBILIDADE}/single-post-ola-mundo.php`,
    `${FILHO}/single-post.php`,
    `${PAI}/single-post.php`,
  ]);
});

test('o diretorio do tema pai so e consultado quando ha tema pai', () => {
  const { tema, perguntas } = temaDeTeste([`${PAI}/index.php`], {
    diretorioDoModelo: FILHO,
    modelo: 'filho',
  });

  const escolhida = escolherApresentacao(consultaDe({}), { contexto: { tema } });

  // `$is_child_theme && file_exists( $wp_template_path . ... )`
  // (`template.php:800`): sem tema pai o segundo diretorio nao e perguntado, e
  // o arquivo que existe la nao e encontrado.
  assert.equal(escolhida.modelo, '');
  assert.ok(perguntas.length > 0);
  assert.deepEqual(
    perguntas.filter((caminho) => caminho.startsWith(PAI)),
    [],
  );
  assert.ok(perguntas.includes(`${FILHO}/index.php`));
  assert.ok(perguntas.includes(`${COMPATIBILIDADE}/index.php`));
});

test('o diretorio de compatibilidade e o terceiro, e ele serve de modelo quando nenhum tema tem o arquivo', () => {
  const { tema } = temaDeTeste([`${COMPATIBILIDADE}/index.php`]);

  const escolhida = escolherApresentacao(consultaDe({}), { contexto: { tema } });

  assert.equal(escolhida.modelo, `${COMPATIBILIDADE}/index.php`);
});

test('candidato com segmento `..` so e localizado se o caminho verdadeiro cai dentro do tema', () => {
  const consulta = consultaDe({ s: 'teste' });
  const candidato = 'parcial/../modelo.php';
  const caminho = `${FILHO}/${candidato}`;
  const arquivos = [caminho, `${FILHO}/search.php`];

  // ⚠️ O candidato com `..` **nao** pode vir do modelo declarado no conteudo:
  // `validate_file()` devolve 1 para `../` em posicao que nao e o fim
  // (`functions.php:6393`) e o candidato nem entra na lista. Ele vem do ponto de
  // extensao `{$type}_template_hierarchy` — e e para esse caso que
  // `_wp_is_template_path_allowed()` existe desde a versao 7.1.2 do legado.
  function modeloCom(real?: (caminho: string) => string | undefined): string {
    const extras: Partial<TemaAtivo> = {
      diretorioDoModelo: FILHO,
      modelo: 'filho',
      ...(real === undefined ? {} : { caminhoReal: real }),
    };
    return escolherApresentacao(consulta, {
      contexto: { tema: temaDeTeste(arquivos, extras).tema },
      pontosDeExtensao: {
        hierarquia: {
          sobreOsCandidatos: [
            (_tipo, candidatos) => [candidato, ...candidatos],
          ],
        },
      },
    }).modelo;
  }

  // Sem `realpath`, o legado recusa (`template.php:724-726`), e a procura segue
  // para o candidato **seguinte** — nao para o diretorio seguinte.
  assert.equal(modeloCom(), `${FILHO}/search.php`);

  // Com o caminho verdadeiro dentro do tema, o candidato vale.
  assert.equal(
    modeloCom((pedido) =>
      pedido === caminho ? `${FILHO}/modelo.php` : pedido,
    ),
    caminho,
  );

  // Com o caminho verdadeiro FORA do tema, continua recusado.
  assert.equal(
    modeloCom((pedido) => (pedido === caminho ? '/fora/modelo.php' : pedido)),
    `${FILHO}/search.php`,
  );
});

// ---------------------------------------------------------------------------
// As seis saidas que nao passam pelo laco de modelos
// ---------------------------------------------------------------------------

test('robots, favicon, feed e notificacao de link encerram antes do laco, e nessa ordem', () => {
  const { tema, perguntas } = temaDeTeste([`${FILHO}/index.php`]);
  const disparos: string[] = [];

  const robots = escolherApresentacao(consultaDe({ robots: '1' }), {
    contexto: { tema },
    pontosDeExtensao: { aoServirRobots: [() => disparos.push('do_robots')] },
  });
  assert.equal(robots.saida, 'robots');
  assert.equal(robots.modelo, '');
  assert.deepEqual(robots.procura, []);

  const favicon = escolherApresentacao(consultaDe({ favicon: '1' }), {
    contexto: { tema },
    pontosDeExtensao: { aoServirFavicon: [() => disparos.push('do_favicon')] },
  });
  assert.equal(favicon.saida, 'favicon');

  assert.equal(
    escolherApresentacao(consultaDe({ feed: 'rss2' }), { contexto: { tema } })
      .saida,
    'feed',
  );
  assert.equal(
    escolherApresentacao(consultaDe({ tb: '1' }), { contexto: { tema } }).saida,
    'notificacao-de-link',
  );

  assert.deepEqual(disparos, ['do_robots', 'do_favicon']);
  // Nenhuma das quatro perguntou nada ao tema.
  assert.deepEqual(perguntas, []);
});

test('as quatro superficies rodam tambem com o tema fora de uso, e o laco nao', () => {
  const { tema } = temaDeTeste([`${FILHO}/index.php`]);

  // *"Process feeds and trackbacks even if not using themes"*
  // (`template-loader.php:40`).
  assert.equal(
    escolherApresentacao(consultaDe({ feed: 'rss2' }), {
      contexto: { tema, usandoTemas: false },
    }).saida,
    'feed',
  );

  // Fora das quatro, o arquivo do legado simplesmente termina (`:65`, sem
  // `else`): nenhum modelo, e nenhum laco.
  const semTema = escolherApresentacao(consultaDe({}), {
    contexto: { tema, usandoTemas: false },
  });
  assert.equal(semTema.saida, 'sem-tema');
  assert.equal(semTema.modelo, '');
  assert.deepEqual(semTema.procura, []);
});

test('`template_redirect` nao dispara com o tema fora de uso, e dispara com ele em uso', () => {
  const disparos: string[] = [];
  const pontosDeExtensao = {
    aoDecidirApresentacao: [() => disparos.push('template_redirect')],
  };

  escolherApresentacao(consultaDe({}), {
    contexto: { usandoTemas: false },
    pontosDeExtensao,
  });
  assert.deepEqual(disparos, []);

  escolherApresentacao(consultaDe({}), { pontosDeExtensao });
  assert.deepEqual(disparos, ['template_redirect']);
});

test('requisicao `HEAD` sai antes de tudo, e o filtro `exit_on_http_head` pode deixa-la seguir', () => {
  const tema = temaSozinho([`${FILHO}/index.php`]);

  const saiu = escolherApresentacao(consultaDe({ feed: 'rss2' }), {
    contexto: { tema, metodoHttp: 'HEAD' },
  });
  // ⚠️ A decisao vem ANTES das quatro superficies: um `HEAD` em `/feed/` nao
  // serve feed.
  assert.equal(saiu.saida, 'cabecalho-apenas');

  const seguiu = escolherApresentacao(consultaDe({}), {
    contexto: { tema, metodoHttp: 'HEAD' },
    pontosDeExtensao: { sobreSairNoCabecalho: [() => false] },
  });
  assert.equal(seguiu.saida, 'modelo');
  assert.equal(seguiu.modelo, `${FILHO}/index.php`);
});

// ---------------------------------------------------------------------------
// Os quirks do legado, e os pontos de extensao
// ---------------------------------------------------------------------------

test('o modelo de anexo que vence REMOVE o ponto de extensao que prefixa o anexo ao corpo', () => {
  const tema = temaSozinho([`${FILHO}/image-jpeg.php`]);
  const consulta = consultaComObjeto(
    { attachment: 'foto' },
    { id: 9, tipo: 'attachment', tipoDeMidia: 'image/jpeg' },
    [conteudo({ id: 9, tipo: 'attachment' })],
  );

  const escolhida = escolherApresentacao(consulta, { contexto: { tema } });

  // `get_attachment_template()` (`template.php:663-684`): tipo-subtipo,
  // subtipo, tipo, e `attachment.php`.
  assert.deepEqual(escolhida.candidatos, [
    'image-jpeg.php',
    'jpeg.php',
    'image.php',
    'attachment.php',
  ]);
  assert.equal(escolhida.predicado, 'is_attachment');
  // `remove_filter( 'the_content', 'prepend_attachment' )`
  // (`template-loader.php:96`), e so quando o modelo de anexo VENCE.
  assert.deepEqual(escolhida.filtrosRemovidos, ['prepend_attachment']);

  const semModeloDeAnexo = escolherApresentacao(consulta, {
    contexto: { tema: temaSozinho([`${FILHO}/index.php`]) },
  });
  assert.deepEqual(semModeloDeAnexo.filtrosRemovidos, []);
});

test('o ponto `{tipo}_template_hierarchy` substitui a lista de candidatos (P2: o interceptador muda o resultado)', () => {
  const tema = temaSozinho([`${FILHO}/meu-modelo.php`, `${FILHO}/index.php`]);
  const tiposVistos: string[] = [];

  const escolhida = escolherApresentacao(consultaDe({}), {
    contexto: { tema },
    pontosDeExtensao: {
      hierarquia: {
        sobreOsCandidatos: [
          (tipo, candidatos) => {
            tiposVistos.push(tipo);
            return tipo === 'home' ? ['meu-modelo.php', ...candidatos] : candidatos;
          },
        ],
      },
    },
  });

  // O nome do ponto carrega o tipo, e e por isso que o interceptador o recebe:
  // ele dispara uma vez por regra consultada, e `is_front_page` vem antes de
  // `is_home`.
  assert.deepEqual(tiposVistos, ['frontpage', 'home']);
  assert.equal(escolhida.modelo, `${FILHO}/meu-modelo.php`);
  assert.deepEqual(escolhida.candidatos, [
    'meu-modelo.php',
    'home.php',
    'index.php',
  ]);
});

test('o ponto `{tipo}_template` substitui o caminho, e `template_include` e o ultimo a falar', () => {
  const tema = temaSozinho([`${FILHO}/index.php`]);

  const escolhida = escolherApresentacao(consultaDe({}), {
    contexto: { tema },
    pontosDeExtensao: {
      hierarquia: {
        sobreOModelo: [
          (modelo, tipo, candidatos) => {
            if (tipo !== 'home') {
              return modelo;
            }
            assert.deepEqual(candidatos, ['home.php', 'index.php']);
            return `${modelo}:filtrado`;
          },
        ],
      },
      sobreOModeloIncluido: [(modelo) => `${modelo}:incluido`],
    },
  });

  assert.equal(escolhida.modelo, `${FILHO}/index.php:filtrado:incluido`);
  // O passo registrado guarda o que a hierarquia decidiu, antes de
  // `template_include`.
  const ultimo = escolhida.procura[escolhida.procura.length - 1];
  assert.equal(ultimo?.modelo, `${FILHO}/index.php:filtrado`);
});

test('o modelo em blocos corre entre a procura e o ponto `{tipo}_template`', () => {
  const ordem: string[] = [];
  const tema = temaDeTeste([`${FILHO}/search.php`], {
    diretorioDoModelo: FILHO,
    modelo: 'filho',
    modeloEmBlocos: (modelo, tipo, candidatos) => {
      ordem.push(`blocos:${tipo}:${candidatos.length}:${modelo}`);
      return 'modelo-em-blocos';
    },
  }).tema;

  const escolhida = escolherApresentacao(consultaDe({ s: 'teste' }), {
    contexto: { tema },
    pontosDeExtensao: {
      hierarquia: {
        sobreOModelo: [
          (modelo) => {
            ordem.push(`filtro:${modelo}`);
            return modelo;
          },
        ],
      },
    },
  });

  // `locate_block_template()` esta em `template.php:66`, entre a procura
  // (`:64`) e o filtro (`:103`) — a posicao e o contrato. E ele recebe o modelo
  // classico ja localizado, que o legado chama de *"fallback candidate"*.
  assert.deepEqual(ordem, [
    `blocos:search:1:${FILHO}/search.php`,
    'filtro:modelo-em-blocos',
  ]);
  assert.equal(escolhida.predicado, 'is_search');
  assert.equal(escolhida.modelo, 'modelo-em-blocos');
});

test('a pagina da frente de uma instalacao nova e `is_home`, e procura `front-page.php` antes', () => {
  const tema = temaSozinho([`${FILHO}/front-page.php`, `${FILHO}/index.php`]);

  const escolhida = escolherApresentacao(consultaDe({}), { contexto: { tema } });

  // `is_front_page()` e `'posts' === show_on_front && is_home()`
  // (`class-wp-query.php:4498`), e `show_on_front` nasce em `'posts'`
  // (`schema.php:476`).
  assert.equal(escolhida.predicado, 'is_front_page');
  assert.deepEqual(escolhida.candidatos, ['front-page.php']);
  assert.equal(escolhida.modelo, `${FILHO}/front-page.php`);
});

test('o nome de criterio que chega como arranjo e interpolado como `Array`, e nao derruba a requisicao', () => {
  const tema = temaSozinho([`${FILHO}/page.php`]);

  // ⚠️ `parse_query` ja normaliza `pagename` de arranjo para texto vazio
  // (`class-wp-query.php:848-850`), logo o arranjo so alcanca a hierarquia por
  // `pre_get_posts`, que dispara DEPOIS da normalizacao (`:1916`).
  const consulta = consultarConteudo(
    { page_id: '4' },
    {
      contexto: {
        repositorio: () => ({ conteudos: [], objetoConsultado: { id: 4 } }),
      },
      pontosDeExtensao: {
        antesDeConsultar: [
          (criterios) => ({ ...criterios, pagename: ['sobre'] }),
        ],
      },
    },
  );
  assert.equal(consulta.tipos.pagina, true);

  const escolhida = escolherApresentacao(consulta, { contexto: { tema } });

  // `"page-{$pagename}.php"` com arranjo da `page-Array.php` no interpretador,
  // com aviso e sem erro (`template.php:496`). Um porte que lancasse ali
  // derrubaria a requisicao onde o legado serve `page.php`.
  assert.ok(escolhida.candidatos.includes('page-Array.php'));
  assert.deepEqual(escolhida.candidatos, [
    'page-Array.php',
    'page-4.php',
    'page.php',
  ]);
  assert.equal(escolhida.modelo, `${FILHO}/page.php`);
});

// ---------------------------------------------------------------------------
// A etapa 5 do atendimento — `WP::register_globals()`
// ---------------------------------------------------------------------------

test('a etapa 5 publica o resultado para o tema, na posicao do legado', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());
  const linha = conteudo({ id: 7 });

  const atendimento = modulo.atender(
    { uriPedida: '/', parametrosDeConsulta: { name: 'ola-mundo' } },
    { contexto: { repositorio: () => ({ conteudos: [linha] }) } },
  );

  const publicacao = atendimento.publicacao;
  assert.equal(publicacao?.conteudo, linha);
  assert.deepEqual(publicacao?.conteudos, [linha]);
  assert.equal(publicacao?.criterios, atendimento.consulta?.criterios);
  // `$more` e `$single` valem 1 quando `is_single()` ou `is_page()`
  // (`class-wp.php:675-678`).
  assert.equal(publicacao?.corpoInteiro, true);
  assert.equal(publicacao?.conteudoUnico, true);
  // `$authordata` nao e definido fora do arquivo de autor (`:680`).
  assert.ok(!('dadosDoAutor' in (publicacao ?? {})));
  // As duas lacunas declaradas nascem vazias e EXISTEM.
  assert.equal(publicacao?.cadeiaDeConsulta, '');
  assert.equal(publicacao?.consultaEnviada, '');
});

test('a etapa 5 publica `$post` como NULO quando a consulta nao encontrou nada', () => {
  const publicacao = publicarParaOTema(consultaDe({}));

  // `$GLOBALS['post'] = $wp_query->post ?? null` (`class-wp.php:672`): o global
  // existe valendo nulo, enquanto a propriedade da consulta nao existe.
  assert.equal(publicacao.conteudo, null);
  assert.equal(publicacao.corpoInteiro, false);
  assert.equal(publicacao.conteudoUnico, false);
});

test('a etapa 5 publica os dados do autor so no arquivo de autor, e publica a ausencia', () => {
  const pedidos: number[] = [];
  const contexto: ContextoDaApresentacao = {
    dadosDaConta: (id) => {
      pedidos.push(id);
      return id === 3 ? { apelido: 'maria' } : undefined;
    },
  };

  const comAutor = publicarParaOTema(
    consultaDe(
      { author: '3' },
      { repositorio: () => ({ conteudos: [], objetoConsultado: { id: 3 } }) },
    ),
    contexto,
  );
  assert.deepEqual(comAutor.dadosDoAutor, { apelido: 'maria' });
  assert.deepEqual(pedidos, [3]);

  // Conta inexistente: o legado publica o retorno sem testar.
  const semConta = publicarParaOTema(
    consultaDe(
      { author: '99' },
      { repositorio: () => ({ conteudos: [], objetoConsultado: { id: 99 } }) },
    ),
    contexto,
  );
  assert.ok('dadosDoAutor' in semConta);
  assert.equal(semConta.dadosDoAutor, undefined);
  assert.deepEqual(pedidos, [3, 99]);

  // Fora do arquivo de autor o colaborador nao e chamado.
  publicarParaOTema(consultaDe({}), contexto);
  assert.deepEqual(pedidos, [3, 99]);
});

test('a etapa 5 le a consulta JA zerada pelo `set_404()`', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());

  const atendimento = modulo.atender(
    { uriPedida: '/', parametrosDeConsulta: { name: 'ola-mundo' } },
    { contexto: { repositorio: () => ({ conteudos: [] }) } },
  );

  // O endereco era `is_single` e virou 404: `handle_404` chamou `set_404()`
  // antes de `register_globals()` (`class-wp.php:800` e `:827`), logo `$more` e
  // `$single` NAO sao publicados.
  assert.equal(atendimento.resposta.naoEncontrado, true);
  assert.equal(atendimento.consulta?.tipos.unico, false);
  assert.equal(atendimento.publicacao?.corpoInteiro, false);
  assert.equal(atendimento.publicacao?.conteudoUnico, false);
});

test('a etapa 5 nao acontece quando `do_parse_request` recusa a resolucao', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());

  const atendimento = modulo.atender(
    { uriPedida: '/' },
    { resolucao: { pontosDeExtensao: { antesDeResolver: [() => false] } } },
  );

  // As etapas 3, 4 e 5 ficam todas dentro do `if ( $parsed )`
  // (`class-wp.php:824-828`).
  assert.equal(atendimento.consulta, undefined);
  assert.equal(atendimento.publicacao, undefined);
});
