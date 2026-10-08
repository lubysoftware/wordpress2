/**
 * Testes da metade declarativa de T001: *"os oito contextos de classificacao do
 * nucleo registrados"*.
 *
 * O que se afirma aqui, e por que cada coisa:
 *
 * 1. **Os oito, e a ordem.** A contagem e da spec e do legado; a ordem e
 *    observavel por `get_taxonomies()` e entra no contrato do **P2**.
 * 2. **As propriedades declaradas, contexto por contexto**, lidas de
 *    `wp-includes/taxonomy.php:63` a `:263`. Sao as que US-1 a US-5 consultam:
 *    tipos de objeto, hierarquia, as quatro capacidades e o marcador de nucleo.
 * 3. **Os defaults de `set_props()`**, na ordem em que o legado os deriva. O
 *    teste existe porque derivar numa ordem diferente muda o resultado, e porque
 *    `mostrarNoMenu` tem uma condicao que descarta o valor declarado.
 * 4. **A borda do nome**, que o **P6** exige de todo numero: *"no ultimo
 *    instante aceita, um instante depois recusa"* — aqui em **bytes**, porque
 *    `strlen` do PHP conta bytes.
 * 5. **As duas recusas de remocao**, com o mesmo codigo e mensagens diferentes,
 *    como no legado.
 *
 * ⚠️ Nenhum destes testes e teste de paridade. `parity_specs.md` fixa criterio
 * por area e o oraculo executavel do legado nao existe nesta arvore
 * (`oracleAvailable: false`): levanta-lo e T001 da feature
 * `015-plataforma-transversal`. O que estes testes conferem e a leitura estatica
 * das ancoras citadas acima.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAPACIDADES_PADRAO_DO_CONTEXTO,
  LIMITE_DE_BYTES_DO_NOME_DO_CONTEXTO,
  criarRegistroComOsContextosDoNucleo,
  criarRegistroDeContextos,
  ehErroDeRegistro,
  resolverContexto,
  type ContextoDeClassificacao,
} from './index.js';

/** Obtem o contexto, ou falha o teste em vez de propagar `null`. */
function contextoRegistrado(nome: string): ContextoDeClassificacao {
  const contexto = criarRegistroComOsContextosDoNucleo().obter(nome);
  assert.notEqual(contexto, null, `contexto ${nome} nao registrado`);
  return contexto as ContextoDeClassificacao;
}

test('os oito contextos do nucleo, na ordem de create_initial_taxonomies()', () => {
  const registro = criarRegistroComOsContextosDoNucleo();

  assert.deepEqual(
    registro.listar().map((contexto) => contexto.nome),
    [
      'category',
      'post_tag',
      'nav_menu',
      'link_category',
      'post_format',
      'wp_theme',
      'wp_template_part_area',
      'wp_pattern_category',
    ],
  );
});

test('cada um dos oito declara a que tipos de objeto se aplica (CA-1.4)', () => {
  const registro = criarRegistroComOsContextosDoNucleo();

  assert.deepEqual(
    registro.listar().map((contexto) => [contexto.nome, contexto.tiposDeObjeto]),
    [
      ['category', ['post']],
      ['post_tag', ['post']],
      // O item do menu e conteudo, e o menu e o contexto.
      ['nav_menu', ['nav_menu_item']],
      // NAO e conteudo: e o que da dono a coluna polimorfica em BC-02.
      ['link_category', ['link']],
      ['post_format', ['post']],
      ['wp_theme', ['wp_template', 'wp_template_part', 'wp_global_styles']],
      ['wp_template_part_area', ['wp_template_part']],
      ['wp_pattern_category', ['wp_block']],
    ],
  );
});

test('so `category` e hierarquico entre os oito (CA-4.2)', () => {
  const registro = criarRegistroComOsContextosDoNucleo();

  assert.deepEqual(
    registro
      .listar()
      .filter((contexto) => contexto.hierarquico)
      .map((contexto) => contexto.nome),
    ['category'],
  );
});

test('as quatro capacidades que cada contexto declara', () => {
  const registro = criarRegistroComOsContextosDoNucleo();

  assert.deepEqual(
    registro.listar().map((contexto) => [contexto.nome, contexto.capacidades]),
    [
      [
        'category',
        {
          gerenciarRotulos: 'manage_categories',
          editarRotulos: 'edit_categories',
          apagarRotulos: 'delete_categories',
          atribuirRotulos: 'assign_categories',
        },
      ],
      [
        'post_tag',
        {
          gerenciarRotulos: 'manage_post_tags',
          editarRotulos: 'edit_post_tags',
          apagarRotulos: 'delete_post_tags',
          atribuirRotulos: 'assign_post_tags',
        },
      ],
      [
        'nav_menu',
        {
          gerenciarRotulos: 'edit_theme_options',
          editarRotulos: 'edit_theme_options',
          apagarRotulos: 'edit_theme_options',
          atribuirRotulos: 'edit_theme_options',
        },
      ],
      [
        'link_category',
        {
          gerenciarRotulos: 'manage_links',
          editarRotulos: 'manage_links',
          apagarRotulos: 'manage_links',
          atribuirRotulos: 'manage_links',
        },
      ],
      // Os quatro de baixo nao declaram capacidade: recebem as de fabrica.
      ['post_format', CAPACIDADES_PADRAO_DO_CONTEXTO],
      ['wp_theme', CAPACIDADES_PADRAO_DO_CONTEXTO],
      ['wp_template_part_area', CAPACIDADES_PADRAO_DO_CONTEXTO],
      ['wp_pattern_category', CAPACIDADES_PADRAO_DO_CONTEXTO],
    ],
  );
});

test('o default de `assign_terms` NAO acompanha os outros tres: cai em edit_posts', () => {
  // UC-05: "atribuir termo e poder de conteudo, nao de classificacao". Um
  // default uniforme trancaria o autor fora da propria tela de edicao.
  assert.equal(CAPACIDADES_PADRAO_DO_CONTEXTO.gerenciarRotulos, 'manage_categories');
  assert.equal(CAPACIDADES_PADRAO_DO_CONTEXTO.editarRotulos, 'manage_categories');
  assert.equal(CAPACIDADES_PADRAO_DO_CONTEXTO.apagarRotulos, 'manage_categories');
  assert.equal(CAPACIDADES_PADRAO_DO_CONTEXTO.atribuirRotulos, 'edit_posts');
});

test('os oito sao do nucleo, e nenhum declara rotulo padrao nem calculo proprio de contador', () => {
  const registro = criarRegistroComOsContextosDoNucleo();

  for (const contexto of registro.listar()) {
    assert.equal(contexto.integradoAoNucleo, true, contexto.nome);
    // O `default_term` de registro e nulo nos oito: a categoria padrao chega
    // pela opcao gravada, e e T007 que a le.
    assert.equal(contexto.rotuloPadrao, null, contexto.nome);
    // O terceiro caminho de BR-MIGRAR-078 nao e usado por nenhum dos oito.
    assert.equal(contexto.callbackDeContagem, '', contexto.nome);
    assert.equal(contexto.ordenar, null, contexto.nome);
  }
});

test('a visibilidade dos oito, com os defaults derivados na ordem do legado', () => {
  const registro = criarRegistroComOsContextosDoNucleo();

  assert.deepEqual(
    registro.listar().map((contexto) => ({
      nome: contexto.nome,
      publico: contexto.publico,
      consultavelPublicamente: contexto.consultavelPublicamente,
      mostrarNaInterface: contexto.mostrarNaInterface,
      mostrarNoMenu: contexto.mostrarNoMenu,
    })),
    [
      {
        nome: 'category',
        publico: true,
        consultavelPublicamente: true,
        mostrarNaInterface: true,
        mostrarNoMenu: true,
      },
      {
        nome: 'post_tag',
        publico: true,
        consultavelPublicamente: true,
        mostrarNaInterface: true,
        mostrarNoMenu: true,
      },
      {
        nome: 'nav_menu',
        publico: false,
        consultavelPublicamente: false,
        mostrarNaInterface: false,
        mostrarNoMenu: false,
      },
      {
        // Invisivel ao publico e VISIVEL no painel: o legado declara os dois.
        nome: 'link_category',
        publico: false,
        consultavelPublicamente: false,
        mostrarNaInterface: true,
        mostrarNoMenu: true,
      },
      {
        // O inverso: consultavel pelo publico e SEM tela no painel.
        nome: 'post_format',
        publico: true,
        consultavelPublicamente: true,
        mostrarNaInterface: false,
        mostrarNoMenu: false,
      },
      {
        nome: 'wp_theme',
        publico: false,
        consultavelPublicamente: false,
        mostrarNaInterface: false,
        mostrarNoMenu: false,
      },
      {
        nome: 'wp_template_part_area',
        publico: false,
        consultavelPublicamente: false,
        mostrarNaInterface: false,
        mostrarNoMenu: false,
      },
      {
        nome: 'wp_pattern_category',
        publico: false,
        consultavelPublicamente: false,
        mostrarNaInterface: true,
        mostrarNoMenu: true,
      },
    ],
  );
});

test('o namespace REST nasce `wp/v2` so em quem esta no REST', () => {
  const registro = criarRegistroComOsContextosDoNucleo();

  assert.deepEqual(
    registro.listar().map((contexto) => [
      contexto.nome,
      contexto.mostrarNoRest,
      contexto.namespaceRest,
      contexto.baseRest,
    ]),
    [
      ['category', true, 'wp/v2', 'categories'],
      ['post_tag', true, 'wp/v2', 'tags'],
      ['nav_menu', true, 'wp/v2', 'menus'],
      ['link_category', false, false, false],
      ['post_format', false, false, false],
      ['wp_theme', false, false, false],
      ['wp_template_part_area', false, false, false],
      // No REST sem base propria: o legado declara um e nao o outro.
      ['wp_pattern_category', true, 'wp/v2', false],
    ],
  );
});

test('`wp_pattern_category` recusa a nuvem de rotulos que herdaria da interface', () => {
  const contexto = contextoRegistrado('wp_pattern_category');

  assert.equal(contexto.mostrarNaInterface, true);
  // Herdaria `true` de `mostrarNaInterface`; o legado declara `false`.
  assert.equal(contexto.mostrarNuvemDeRotulos, false);
  // E esta, que nao e declarada, herda mesmo.
  assert.equal(contexto.mostrarNaEdicaoRapida, true);
  assert.equal(contexto.mostrarColunaNoPainel, true);
});

//
// Os defaults de set_props(), fora dos oito.
//

test('sem nada declarado, o contexto nasce publico e visivel (class-wp-taxonomy.php:339)', () => {
  const contexto = resolverContexto('resenha', { tiposDeObjeto: 'post' });

  assert.equal(contexto.publico, true);
  assert.equal(contexto.consultavelPublicamente, true);
  assert.equal(contexto.mostrarNaInterface, true);
  assert.equal(contexto.mostrarNoMenu, true);
  assert.equal(contexto.mostrarNuvemDeRotulos, true);
  assert.equal(contexto.mostrarNaEdicaoRapida, true);
  // Estes tres sao os defaults que NAO seguem `publico`.
  assert.equal(contexto.hierarquico, false);
  assert.equal(contexto.mostrarColunaNoPainel, false);
  assert.equal(contexto.integradoAoNucleo, false);
});

test('`publico: false` propaga para as cinco derivadas, nesta ordem', () => {
  const contexto = resolverContexto('resenha', {
    tiposDeObjeto: 'post',
    publico: false,
  });

  assert.equal(contexto.consultavelPublicamente, false);
  assert.equal(contexto.mostrarNaInterface, false);
  assert.equal(contexto.mostrarNoMenu, false);
  assert.equal(contexto.mostrarNuvemDeRotulos, false);
  assert.equal(contexto.mostrarNaEdicaoRapida, false);
});

test('com a interface desligada, um `mostrarNoMenu: true` declarado e DESCARTADO', () => {
  // `if ( null === $args['show_in_menu'] || ! $args['show_ui'] )`:
  // class-wp-taxonomy.php:406. A declaracao nao vence, e um porte que a
  // respeitasse poria no menu um contexto que o legado esconde.
  const contexto = resolverContexto('resenha', {
    tiposDeObjeto: 'post',
    mostrarNaInterface: false,
    mostrarNoMenu: true,
  });

  assert.equal(contexto.mostrarNaInterface, false);
  assert.equal(contexto.mostrarNoMenu, false);
});

test('com a interface ligada, um `mostrarNoMenu: false` declarado vence', () => {
  const contexto = resolverContexto('resenha', {
    tiposDeObjeto: 'post',
    mostrarNaInterface: true,
    mostrarNoMenu: false,
  });

  assert.equal(contexto.mostrarNoMenu, false);
});

test('tipo de objeto repetido e deduplicado, e a ordem da declaracao fica', () => {
  // `array_unique( (array) $object_type )`: class-wp-taxonomy.php:440.
  const contexto = resolverContexto('resenha', {
    tiposDeObjeto: ['page', 'post', 'page'],
  });

  assert.deepEqual(contexto.tiposDeObjeto, ['page', 'post']);
});

test('o rotulo padrao declarado so pelo nome recebe slug e descricao vazios', () => {
  const porNome = resolverContexto('resenha', {
    tiposDeObjeto: 'post',
    rotuloPadrao: 'Sem resenha',
  });
  assert.deepEqual(porNome.rotuloPadrao, {
    nome: 'Sem resenha',
    slug: '',
    descricao: '',
  });

  // `! empty()` do legado: string vazia nao conta como declaracao.
  const vazio = resolverContexto('resenha', {
    tiposDeObjeto: 'post',
    rotuloPadrao: '',
  });
  assert.equal(vazio.rotuloPadrao, null);
});

//
// A borda do nome (P6).
//

test('o nome aceita 32 bytes e recusa 33 (P6: a borda, nos dois lados)', () => {
  const registro = criarRegistroDeContextos();

  assert.equal(LIMITE_DE_BYTES_DO_NOME_DO_CONTEXTO, 32);

  const noLimite = 'a'.repeat(32);
  const resultadoNoLimite = registro.registrar(noLimite, {
    tiposDeObjeto: 'post',
  });
  assert.equal(ehErroDeRegistro(resultadoNoLimite), false);
  assert.equal(registro.existe(noLimite), true);

  const umAMais = 'a'.repeat(33);
  const resultadoUmAMais = registro.registrar(umAMais, {
    tiposDeObjeto: 'post',
  });
  assert.equal(ehErroDeRegistro(resultadoUmAMais), true);
  assert.equal(registro.existe(umAMais), false);
});

test('o limite e em BYTES, nao em caracteres (`strlen` do PHP)', () => {
  const registro = criarRegistroDeContextos();

  // 31 letras mais um "a" com til: 32 caracteres, 33 bytes em UTF-8. O legado
  // recusa; contar unidades de UTF-16 aceitaria.
  const nome = `${'a'.repeat(31)}ã`;
  assert.equal(nome.length, 32);

  const resultado = registro.registrar(nome, { tiposDeObjeto: 'post' });

  assert.equal(ehErroDeRegistro(resultado), true);
  assert.equal(registro.existe(nome), false);
});

test('nome vazio e recusado com o codigo e a mensagem do legado', () => {
  const registro = criarRegistroDeContextos();

  const resultado = registro.registrar('', { tiposDeObjeto: 'post' });

  assert.equal(ehErroDeRegistro(resultado), true);
  assert.deepEqual(ehErroDeRegistro(resultado) ? resultado : null, {
    erroDeRegistro: true,
    codigo: 'taxonomy_length_invalid',
    mensagem: 'Taxonomy names must be between 1 and 32 characters in length.',
  });
});

test('registrar com nome que ja existe SUBSTITUI o anterior, sem recusar', () => {
  const registro = criarRegistroComOsContextosDoNucleo();

  // E assim que uma extensao redeclara `category` no legado.
  registro.registrar('category', {
    tiposDeObjeto: 'post',
    hierarquico: false,
  });

  assert.equal(contextoRegistrado('category').hierarquico, true);
  assert.equal(registro.obter('category')?.hierarquico, false);
  // Substituiu, nao somou.
  assert.equal(registro.listar().length, 8);
  // E manteve a POSICAO: atribuir a uma chave que ja existe nao a move para o
  // fim, nem no array do PHP nem aqui. A ordem entra no contrato pelo P2.
  assert.equal(registro.listar()[0]?.nome, 'category');
});

//
// As duas recusas de remocao.
//

test('nenhum dos oito contextos do nucleo pode ser removido', () => {
  const registro = criarRegistroComOsContextosDoNucleo();

  for (const contexto of registro.listar()) {
    const resultado = registro.remover(contexto.nome);

    assert.equal(ehErroDeRegistro(resultado), true, contexto.nome);
    assert.deepEqual(ehErroDeRegistro(resultado) ? resultado : null, {
      erroDeRegistro: true,
      codigo: 'invalid_taxonomy',
      mensagem: 'Unregistering a built-in taxonomy is not allowed.',
    });
  }

  assert.equal(registro.listar().length, 8);
});

test('remover contexto que nao existe usa o MESMO codigo com outra mensagem', () => {
  const registro = criarRegistroComOsContextosDoNucleo();

  const resultado = registro.remover('resenha');

  // O legado reusa `invalid_taxonomy` nos dois casos: taxonomy.php:609 e :616.
  assert.deepEqual(ehErroDeRegistro(resultado) ? resultado : null, {
    erroDeRegistro: true,
    codigo: 'invalid_taxonomy',
    mensagem: 'Invalid taxonomy.',
  });
});

test('contexto que nao e do nucleo e removido', () => {
  const registro = criarRegistroComOsContextosDoNucleo();
  registro.registrar('resenha', { tiposDeObjeto: 'post' });

  assert.equal(registro.remover('resenha'), true);
  assert.equal(registro.existe('resenha'), false);
  assert.equal(registro.listar().length, 8);
});

test('o registro vazio nasce vazio, e `obter` devolve nulo em vez de lancar', () => {
  const registro = criarRegistroDeContextos();

  assert.deepEqual(registro.listar(), []);
  assert.equal(registro.existe('category'), false);
  // O `false` de `get_taxonomy()`, como valor e nao como excecao.
  assert.equal(registro.obter('category'), null);
});
