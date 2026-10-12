/**
 * Testes de **T017** — US-8, *"expandir macro textual no corpo do conteudo na
 * renderizacao"*, com os cinco criterios de aceite da tarefa:
 *
 * | criterio | o que afirma |
 * |---|---|
 * | CA-8.1 | a marca registrada e substituida pelo resultado do tratador dela |
 * | CA-8.2 | marca nao registrada fica no texto como foi escrita, sem erro |
 * | CA-8.3 | a expansao e na renderizacao: o corpo gravado continua com a marca |
 * | CA-8.4 | marca dentro de atributo de elemento tem caminho proprio e declarado |
 * | CA-8.5 | a lista de marcas registradas e inspecionavel |
 *
 * Mais o que T017 entrega e que nao e criterio de aceite proprio: as tres saidas
 * antecipadas de `do_shortcode()`, o escape `[[marca]]` e o escape pela metade,
 * os dois pontos de extensao de `do_shortcode_tag()`, as duas recusas de
 * `add_shortcode()`, os quirks de `shortcode_parse_atts()`, `strip_shortcodes()`
 * e a normalizacao de entidade que sobra depois do desfazer.
 *
 * **Nao sao os testes do catalogo.** Os seis casos `UT-171-1` a `UT-171-6` de
 * `backlog/tests.md` sao de **T018**, a tarefa `[P]`, e nenhum deles e afirmado
 * aqui: aqui se afirma o criterio de aceite, la se transcreve o caso.
 *
 * ⚠️ **Nada externo entra nestes testes.** Nao ha banco, rede, relogio nem
 * sistema de arquivos: a expansao e texto para texto. O tratador de marca e um
 * duplo que **registra** os tres argumentos que recebeu, e e assim que se afirma
 * o que nenhuma assercao sobre o corpo expandido alcanca — que o conteudo
 * envolvido chega como texto vazio, e nao nulo, quando a marca nao envolve
 * nada.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LIGACAO_NA_RENDERIZACAO,
  MARCAS_DE_FABRICA,
  REGISTRO_SEM_MACROS,
  SEM_LISTA_DE_PERMISSAO,
  adicionarMacro,
  aplicarMacros,
  atributosComPadrao,
  atributosDaMacro,
  corpoTemMacro,
  criarModuloDeLeituraPublica,
  expandirMacros,
  fonteDaExpressaoDeMacro,
  macroExiste,
  marcasRegistradas,
  marcasUsadasNoCorpo,
  pedacosDoElemento,
  removerMacro,
  removerMacrosDoCorpo,
  removerTodasAsMacros,
  separarHtmlDoCorpo,
  textoSemBarraDeC,
  type AtributosDaMacro,
  type AvisoDeUsoIndevido,
  type PortasDeLeituraPublica,
  type RegistroDeMacros,
  type ValorDeAtributo,
} from '../index.js';

/** A porta de dados, que **nenhuma** destas operacoes deve tocar. */
function portasDeTeste(): PortasDeLeituraPublica {
  return {
    dados: {
      prefixoDeTabela: 'wp_',
      selecionar() {
        throw new Error('a expansao de macro textual nao consulta o banco');
      },
      escrever() {
        throw new Error('a expansao de macro textual nao grava');
      },
    },
  };
}

/** Um argumento recebido por um tratador de marca, como ele o recebeu. */
interface ChamadaDoTratador {
  readonly atributos: readonly (readonly [string | number, string])[];
  readonly conteudo: string | null;
  readonly marca: string;
}

/**
 * O duplo do tratador: devolve um texto reconhecivel e **registra** os tres
 * argumentos que recebeu, na ordem das chamadas.
 */
function tratadorDeTeste(saida = 'EXPANDIDO'): {
  readonly tratador: (
    atributos: AtributosDaMacro,
    conteudo: string | null,
    marca: string,
  ) => string;
  readonly chamadas: ChamadaDoTratador[];
} {
  const chamadas: ChamadaDoTratador[] = [];
  return {
    tratador: (atributos, conteudo, marca) => {
      chamadas.push({ atributos: [...atributos], conteudo, marca });
      return saida;
    },
    chamadas,
  };
}

/** Um registro com uma marca so, que e o arranjo mais comum destes testes. */
function registroCom(
  marca: string,
  saida = 'EXPANDIDO',
): {
  readonly registro: RegistroDeMacros;
  readonly chamadas: ChamadaDoTratador[];
} {
  const { tratador, chamadas } = tratadorDeTeste(saida);
  return {
    registro: adicionarMacro(REGISTRO_SEM_MACROS, marca, tratador),
    chamadas,
  };
}

// ---------------------------------------------------------------------------
// CA-8.1 — a marca registrada e substituida pelo resultado do tratador
// ---------------------------------------------------------------------------

test('CA-8.1: a marca registrada e trocada pelo que o tratador devolve', () => {
  const { registro, chamadas } = registroCom('marca', '<p>oi</p>');

  const expansao = expandirMacros('antes [marca] depois', {
    contexto: { registro },
  });

  assert.equal(expansao.texto, 'antes <p>oi</p> depois');
  assert.equal(expansao.saida, 'expandiu');
  assert.equal(chamadas.length, 1);
});

test('CA-8.1: o tratador recebe os tres argumentos de `:434`, nesta ordem', () => {
  const { registro, chamadas } = registroCom('marca');

  expandirMacros('[marca id="4" 3 largura=10]corpo[/marca]', {
    contexto: { registro },
  });

  assert.deepEqual(chamadas, [
    {
      atributos: [
        ['id', '4'],
        [0, '3'],
        ['largura', '10'],
      ],
      conteudo: 'corpo',
      marca: 'marca',
    },
  ]);
});

test('CA-8.1: a marca sem conteudo envolvido chega ao tratador com texto VAZIO', () => {
  // ⚠️ Derivado, nao conferido no oraculo: `$content = $m[5] ?? null` (`:432`)
  // nunca ve nulo, porque o grupo 6 da expressao sempre participa e o
  // interpretador preenche o grupo 5 com texto vazio. Ver `achadoComoNoPhp`.
  // O caso que encerra a questao esta nomeado la, e e do oraculo executavel.
  const { registro, chamadas } = registroCom('marca');

  expandirMacros('[marca] [marca /]', { contexto: { registro } });

  assert.deepEqual(
    chamadas.map((chamada) => chamada.conteudo),
    ['', ''],
  );
});

test('CA-8.1: duas ocorrencias da mesma marca sao expandidas as duas', () => {
  const { registro, chamadas } = registroCom('marca', 'X');

  const expansao = expandirMacros('[marca]a[/marca] e [marca]b[/marca]', {
    contexto: { registro },
  });

  assert.equal(expansao.texto, 'X e X');
  assert.deepEqual(
    chamadas.map((chamada) => chamada.conteudo),
    ['a', 'b'],
  );
});

test('CA-8.1: `apply_shortcodes` e apelido e nao outra operacao', () => {
  const { registro } = registroCom('marca', 'X');
  const opcoes = { contexto: { registro } };

  assert.deepEqual(
    { ...aplicarMacros('[marca]', opcoes) },
    { ...expandirMacros('[marca]', opcoes) },
  );
});

// ---------------------------------------------------------------------------
// CA-8.2 — marca nao registrada fica no texto como foi escrita
// ---------------------------------------------------------------------------

test('CA-8.2: a marca nao registrada sobrevive literal, e o corpo sai identico', () => {
  const { registro } = registroCom('marca');
  const corpo = 'um [outra id="1"] e um [outra]com corpo[/outra]';

  const expansao = expandirMacros(corpo, { contexto: { registro } });

  assert.equal(expansao.texto, corpo);
  assert.equal(expansao.saida, 'nenhuma-marca-no-corpo');
});

test('CA-8.2: registro vazio deixa toda marca literal, sem erro', () => {
  const corpo = '[marca] e [outra]';

  const expansao = expandirMacros(corpo);

  assert.equal(expansao.texto, corpo);
  assert.equal(expansao.saida, 'sem-marca-registrada');
  assert.deepEqual(expansao.marcas, []);
});

test('CA-8.2: a marca registrada com tratador que nao e chamavel fica literal, com aviso', () => {
  // `! is_callable( $shortcode_tags[ $tag ] )` (`:403-410`): o legado avisa e
  // devolve `$m[0]`, a ocorrencia INTEIRA. `shortcode_exists()` continua
  // respondendo verdadeiro para ela, porque o teste de `:135` e
  // `array_key_exists`.
  const registro = adicionarMacro(
    REGISTRO_SEM_MACROS,
    'marca',
    'funcao_que_nao_existe',
  );
  const avisos: AvisoDeUsoIndevido[] = [];

  const expansao = expandirMacros('a [marca x="1"]b[/marca] c', {
    contexto: { registro, avisar: (aviso) => avisos.push(aviso) },
  });

  assert.equal(expansao.texto, 'a [marca x="1"]b[/marca] c');
  assert.equal(expansao.saida, 'expandiu');
  assert.ok(macroExiste(registro, 'marca'));
  assert.deepEqual(avisos, [
    {
      funcao: 'do_shortcode_tag',
      mensagem:
        'Attempting to parse a shortcode without a valid callback: marca',
      versao: '4.3.0',
    },
  ]);
});

test('CA-8.2: sem relator de uso indevido a decisao e a mesma (P7)', () => {
  const registro = adicionarMacro(REGISTRO_SEM_MACROS, 'marca', null);

  assert.equal(
    expandirMacros('[marca]', { contexto: { registro } }).texto,
    '[marca]',
  );
});

test('CA-8.2: `add_shortcode` recusa nome vazio e nome com caractere reservado', () => {
  const avisos: AvisoDeUsoIndevido[] = [];
  const avisar = (aviso: AvisoDeUsoIndevido): void => {
    avisos.push(aviso);
  };
  const { tratador } = tratadorDeTeste();

  // `'' === trim( $tag )` (`:66`): o conjunto de `trim()` do interpretador.
  const semNome = adicionarMacro(REGISTRO_SEM_MACROS, '  \t\n', tratador, {
    avisar,
  });
  // `@[<>&/\[\]\x00-\x20=]@` (`:75`) — e o espaco esta entre os controles.
  const comReservado = adicionarMacro(semNome, 'ma rca', tratador, { avisar });
  const comIgual = adicionarMacro(comReservado, 'ma=rca', tratador, { avisar });

  assert.deepEqual(marcasRegistradas(comIgual), []);
  assert.deepEqual(
    avisos.map((aviso) => aviso.mensagem),
    [
      'Invalid shortcode name: Empty name given.',
      'Invalid shortcode name: ma rca. Do not use spaces or reserved characters: & / < > [ ] =',
      'Invalid shortcode name: ma=rca. Do not use spaces or reserved characters: & / < > [ ] =',
    ],
  );
});

test('CA-8.2: o corpo sem colchete nenhum sai intocado, pela primeira guarda', () => {
  const { registro } = registroCom('marca');

  const expansao = expandirMacros('texto sem marca nenhuma', {
    contexto: { registro },
  });

  assert.equal(expansao.texto, 'texto sem marca nenhuma');
  assert.equal(expansao.saida, 'sem-colchete');
});

// ---------------------------------------------------------------------------
// CA-8.3 — a expansao e na renderizacao, nao na gravacao
// ---------------------------------------------------------------------------

test('CA-8.3: expandir nao muda o corpo recebido — a operacao e texto para texto', () => {
  const { registro } = registroCom('marca', 'X');
  const gravado = 'o corpo [marca] gravado';

  const expansao = expandirMacros(gravado, { contexto: { registro } });

  assert.equal(gravado, 'o corpo [marca] gravado');
  assert.equal(expansao.texto, 'o corpo X gravado');
  // Expandir duas vezes o MESMO corpo gravado da o mesmo resultado: nao ha
  // estado acumulado entre chamadas (BR-MIGRAR-105).
  assert.equal(
    expandirMacros(gravado, { contexto: { registro } }).texto,
    'o corpo X gravado',
  );
});

test('CA-8.3: a operacao do modulo nao toca na porta de dados', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());
  const { registro } = registroCom('marca', 'X');

  // Qualquer toque na porta lanca; chegar ao fim e a assercao.
  assert.equal(
    modulo.expandirMacros('[marca]', { contexto: { registro } }).texto,
    'X',
  );
});

test('CA-8.3: a ligacao do legado e na renderizacao, com a prioridade declarada', () => {
  // `add_filter( 'the_content', 'do_shortcode', 11 ); // AFTER wpautop().`
  // (`default-filters.php:209`). A prioridade e contrato publico (P2), e e ela
  // que poe a expansao depois de `wpautop` (10) e antes de
  // `wp_filter_content_tags` (12).
  const noCorpo = LIGACAO_NA_RENDERIZACAO.find(
    (ligacao) => ligacao.ponto === 'the_content',
  );

  assert.deepEqual(noCorpo, {
    ponto: 'the_content',
    prioridade: 11,
    legado: 'wp-includes/default-filters.php:209',
    nota: 'AFTER wpautop().',
  });
  // Nenhuma das ligacoes e de gravacao: as quatro sao de leitura do corpo.
  assert.deepEqual(
    LIGACAO_NA_RENDERIZACAO.map((ligacao) => ligacao.ponto),
    [
      'the_content',
      'widget_text_content',
      'widget_block_content',
      'WP_Embed::run_shortcode',
    ],
  );
});

// ---------------------------------------------------------------------------
// CA-8.4 — marca dentro de atributo tem caminho proprio e declarado
// ---------------------------------------------------------------------------

test('CA-8.4: o atributo SEM aspas expande, e nao passa pelo saneador', () => {
  // `$attr like '[shortcode]' or 'name = [shortcode]' implies unfiltered_html`
  // (`:531-536`): o legado NAO chama KSES neste ramo.
  const { registro } = registroCom('marca', 'arquivo.png');
  const saneados: string[] = [];

  const expansao = expandirMacros('<img alt="a" src=[marca]>', {
    contexto: {
      registro,
      sanearAtributo: (atributo) => {
        saneados.push(atributo);
        return atributo;
      },
    },
  });

  assert.equal(expansao.texto, '<img alt="a" src=arquivo.png>');
  assert.deepEqual(saneados, []);
  assert.deepEqual(expansao.passosNoHtml, [
    {
      elemento: '<img alt="a" src=[marca]>',
      caminho: 'atributo',
      atributos: [
        {
          atributo: 'alt="a" ',
          caminho: 'sem-colchete',
          trocas: 0,
          mantidoPeloSaneador: false,
        },
        {
          atributo: 'src=[marca]',
          caminho: 'sem-aspas',
          trocas: 1,
          mantidoPeloSaneador: false,
        },
      ],
    },
  ]);
});

test('CA-8.4: o atributo ENTRE aspas expande e passa pelo saneador', () => {
  const { registro } = registroCom('marca', 'arquivo.png');
  const saneados: readonly [string, string][] = [];
  const vistos: [string, string][] = [...saneados];

  const expansao = expandirMacros('<img src="[marca]">', {
    contexto: {
      registro,
      sanearAtributo: (atributo, elemento) => {
        vistos.push([atributo, elemento]);
        return atributo;
      },
    },
  });

  assert.equal(expansao.texto, '<img src="arquivo.png">');
  // O saneador recebe o atributo JA expandido e o nome do elemento (`:547`).
  assert.deepEqual(vistos, [['src="arquivo.png"', 'img']]);
  assert.equal(expansao.passosNoHtml[0]?.atributos[0]?.caminho, 'entre-aspas');
});

test('CA-8.4: saneador que esvazia mantem o atributo ORIGINAL, nao o expandido', () => {
  // `if ( '' !== trim( $new_attr ) )` (`:548`) — e o default declarado
  // `SEM_LISTA_DE_PERMISSAO` cai exatamente neste ramo.
  const { registro } = registroCom('marca', 'arquivo.png');

  const expansao = expandirMacros('<img src="[marca]">', {
    contexto: { registro, sanearAtributo: SEM_LISTA_DE_PERMISSAO },
  });

  assert.equal(expansao.texto, '<img src="[marca]">');
  assert.deepEqual(expansao.passosNoHtml[0]?.atributos, [
    {
      atributo: 'src="[marca]"',
      caminho: 'entre-aspas',
      trocas: 1,
      mantidoPeloSaneador: true,
    },
  ]);
});

test('CA-8.4: sem marca trocada o saneador NAO roda, ainda que o atributo tenha colchete', () => {
  // `if ( $count > 0 )` (`:545`): o atributo entre aspas com marca **nao
  // registrada** nao e saneado, e o colchete volta literal pelo desfazer.
  const { registro } = registroCom('marca', 'X');
  let chamadas = 0;

  const expansao = expandirMacros('<img src="[outra]">', {
    contexto: {
      registro,
      sanearAtributo: (atributo) => {
        chamadas += 1;
        return atributo;
      },
    },
  });

  assert.equal(expansao.saida, 'nenhuma-marca-no-corpo');
  assert.equal(expansao.texto, '<img src="[outra]">');
  assert.equal(chamadas, 0);
});

test('CA-8.4: o comentario condicional tem caminho proprio e o colchete volta', () => {
  // `str_starts_with( $element, '<!--' )` (`:495`) esconde TODO colchete, e
  // `unescape_invalid_shortcodes()` o devolve — *"Always restore square braces
  // so we don't break things like <!--[if IE ]>"* (`:275`).
  const { registro } = registroCom('marca', 'X');
  const corpo = '<!--[if IE]><b>[marca]</b><![endif]--> [marca]';

  const expansao = expandirMacros(corpo, { contexto: { registro } });

  assert.equal(expansao.texto, '<!--[if IE]><b>[marca]</b><![endif]--> X');
  // ⚠️ O comentario inteiro e **um** pedaco so: o ramo de comentario de
  // `get_html_split_regex()` consome tudo ate `-->`, logo o `<b>` de dentro nao
  // e elemento para este laco. E e isso que protege o comentario condicional.
  assert.deepEqual(
    expansao.passosNoHtml.map((passo) => passo.caminho),
    ['colchete-escapado'],
  );
  assert.deepEqual(separarHtmlDoCorpo('<!--[if IE]><b>x</b><![endif]--> t'), [
    '',
    '<!--[if IE]><b>x</b><![endif]-->',
    ' t',
  ]);
});

test('CA-8.4: a marca na POSICAO DO NOME do elemento tem o quarto caminho', () => {
  // `// Some plugins are doing things like [name] <[email]>.` (`:504-507`):
  // `wp_kses_attr_parse()` devolve `false` e o legado expande o elemento inteiro
  // quando ele comeca com marca.
  const { registro } = registroCom('marca', 'texto@exemplo');

  const expansao = expandirMacros('<[marca]>', { contexto: { registro } });

  assert.equal(expansao.texto, '<texto@exemplo>');
  assert.deepEqual(
    expansao.passosNoHtml.map((passo) => passo.caminho),
    ['html-inesperado'],
  );
  assert.equal(pedacosDoElemento('<[marca]>'), false);
});

test('CA-8.4: `ignorarHtml` desliga o caminho de atributo inteiro', () => {
  const { registro } = registroCom('marca', 'X');

  const expansao = expandirMacros('<img src=[marca]> [marca]', {
    contexto: { registro },
    ignorarHtml: true,
  });

  assert.equal(expansao.texto, '<img src=[marca]> X');
  assert.equal(expansao.passosNoHtml[0]?.caminho, 'colchete-escapado');
});

test('CA-8.4: a separacao de HTML remonta o corpo por concatenacao', () => {
  // Invariante de `wp_html_split()` de que o laco de `:566` depende.
  for (const corpo of [
    'a<b>c',
    '<b>',
    'x<!-- c --> y',
    '<![CDATA[ a ]]> t',
    '<a href="[x]">t</a>',
    'a < b',
    '<naoFechado',
    'texto puro',
  ]) {
    assert.equal(separarHtmlDoCorpo(corpo).join(''), corpo, corpo);
  }
});

// ---------------------------------------------------------------------------
// CA-8.5 — a lista de marcas registradas e inspecionavel
// ---------------------------------------------------------------------------

test('CA-8.5: a lista sai na ordem de registro, e e a ordem da alternancia', () => {
  const { tratador } = tratadorDeTeste();
  let registro = REGISTRO_SEM_MACROS;
  for (const marca of ['gamma', 'alpha', 'beta']) {
    registro = adicionarMacro(registro, marca, tratador);
  }

  // `array_keys( $shortcode_tags )` (`:328`): ordem de insercao, nao alfabetica.
  assert.deepEqual(marcasRegistradas(registro), ['gamma', 'alpha', 'beta']);
  // E a ordem chega a expressao, porque a alternancia de PCRE e ordenada.
  assert.ok(
    fonteDaExpressaoDeMacro(marcasRegistradas(registro)).includes(
      '(gamma|alpha|beta)',
    ),
  );
});

test('CA-8.5: marca repetida mantem a POSICAO original e troca o tratador', () => {
  // *"In the event of a duplicated tag, the tag loaded last will take
  // precedence"* (`:48-49`), e `$shortcode_tags[ $tag ] = $callback` nao
  // reordena a chave.
  const primeiro = tratadorDeTeste('PRIMEIRO');
  const segundo = tratadorDeTeste('SEGUNDO');
  let registro = adicionarMacro(REGISTRO_SEM_MACROS, 'a', primeiro.tratador);
  registro = adicionarMacro(registro, 'b', primeiro.tratador);
  registro = adicionarMacro(registro, 'a', segundo.tratador);

  assert.deepEqual(marcasRegistradas(registro), ['a', 'b']);
  assert.equal(expandirMacros('[a]', { contexto: { registro } }).texto, 'SEGUNDO');
});

test('CA-8.5: `shortcode_exists`, remover uma e remover todas', () => {
  const { registro } = registroCom('marca');

  assert.ok(macroExiste(registro, 'marca'));
  assert.ok(!macroExiste(registro, 'outra'));
  assert.deepEqual(marcasRegistradas(removerMacro(registro, 'marca')), []);
  // `unset()` de chave ausente e silencioso (`:103`).
  assert.deepEqual(marcasRegistradas(removerMacro(registro, 'outra')), ['marca']);
  assert.deepEqual(marcasRegistradas(removerTodasAsMacros()), []);
});

test('CA-8.5: a inspecao cruzada com o corpo diz que marcas o conteudo usa', () => {
  const { tratador } = tratadorDeTeste();
  let registro = adicionarMacro(REGISTRO_SEM_MACROS, 'audio', tratador);
  registro = adicionarMacro(registro, 'gallery', tratador);
  const corpo = '[audio src="f.mp3"][/audio] [foo] [gallery ids="1,2,3"]';

  // O exemplo do docblock de `get_shortcode_tags_in_content()` (`:173-174`):
  // `foo` fica de fora porque nao esta registrada.
  assert.deepEqual(marcasUsadasNoCorpo(registro, corpo), ['audio', 'gallery']);
  assert.ok(corpoTemMacro(registro, corpo, 'audio'));
  assert.ok(!corpoTemMacro(registro, corpo, 'foo'));
  // Desce na marca aninhada pelo conteudo envolvido (`:160` e `:197`).
  assert.ok(corpoTemMacro(registro, '[audio][gallery][/audio]', 'gallery'));
  assert.deepEqual(marcasUsadasNoCorpo(registro, '[audio][gallery][/audio]'), [
    'audio',
    'gallery',
  ]);
  // Nao remove repeticao: a ordem e a do corpo.
  assert.deepEqual(marcasUsadasNoCorpo(registro, '[gallery][audio][gallery]'), [
    'gallery',
    'audio',
    'gallery',
  ]);
});

test('CA-8.5: as 7 marcas de fabrica estao DECLARADAS e nao registradas', () => {
  // A razao esta no cabecalho de `registro-de-macros.ts`: registrar a marca sem
  // o tratador cairia no ramo de `! is_callable()` e devolveria a marca literal
  // com aviso, que e outro comportamento que o de expandir (P1).
  assert.deepEqual(
    MARCAS_DE_FABRICA.map((entrada) => entrada.marca),
    ['wp_caption', 'caption', 'gallery', 'playlist', 'audio', 'video', 'embed'],
  );
  assert.deepEqual(marcasRegistradas(REGISTRO_SEM_MACROS), []);
  for (const entrada of MARCAS_DE_FABRICA) {
    assert.ok(!macroExiste(REGISTRO_SEM_MACROS, entrada.marca), entrada.marca);
    assert.match(entrada.legado, /^wp-includes\/.+:\d+$/);
  }
});

// ---------------------------------------------------------------------------
// O que T017 entrega e que nao e criterio de aceite proprio
// ---------------------------------------------------------------------------

test('o escape `[[marca]]` sobrevive sem chamar o tratador', () => {
  // `'[' === $m[1] && ']' === $m[6]` (`:396`): devolve `substr( $m[0], 1, -1 )`.
  const { registro, chamadas } = registroCom('marca', 'X');

  const expansao = expandirMacros('[[marca]] e [[marca id="1"]]', {
    contexto: { registro },
  });

  assert.equal(expansao.texto, '[marca] e [marca id="1"]');
  assert.deepEqual(chamadas, []);
});

test('o escape PELA METADE expande, e o colchete extra sobrevive', () => {
  // ⚠️ O teste de `:396` exige OS DOIS colchetes. Com um so, a expansao roda e
  // `:434` concatena `$m[1]` e `$m[6]` em torno da saida.
  const { registro } = registroCom('marca', 'X');
  const opcoes = { contexto: { registro } };

  assert.equal(expandirMacros('[[marca]', opcoes).texto, '[X');
  assert.equal(expandirMacros('[marca]]', opcoes).texto, 'X]');
});

test('`pre_do_shortcode_tag` curto-circuita, inclusive com texto vazio', () => {
  // `false !== $return` (`:428`): texto vazio curto-circuita e a marca
  // desaparece. O tratador nao e chamado e o segundo filtro nao dispara.
  const { registro, chamadas } = registroCom('marca', 'X');
  const depois: string[] = [];

  const vazio = expandirMacros('a [marca] b', {
    contexto: { registro },
    pontosDeExtensao: {
      antesDaMarca: [() => ''],
      sobreAMarcaExpandida: [
        (saida) => {
          depois.push(saida);
          return saida;
        },
      ],
    },
  });

  assert.equal(vazio.texto, 'a  b');
  assert.deepEqual(chamadas, []);
  assert.deepEqual(depois, []);
});

test('`pre_do_shortcode_tag` recebe os quatro argumentos e encadeia', () => {
  const { registro } = registroCom('marca', 'X');
  const vistos: (string | false)[] = [];

  const expansao = expandirMacros('[marca id="7"]', {
    contexto: { registro },
    pontosDeExtensao: {
      antesDaMarca: [
        (saida, marca, atributos, achado) => {
          vistos.push(saida);
          assert.equal(marca, 'marca');
          assert.equal(atributos.get('id'), '7');
          assert.equal(achado[0], '[marca id="7"]');
          return false;
        },
        (saida) => {
          vistos.push(saida);
          return 'DO FILTRO';
        },
      ],
    },
  });

  assert.equal(expansao.texto, 'DO FILTRO');
  assert.deepEqual(vistos, [false, false]);
});

test('`do_shortcode_tag` ve a saida JA com os colchetes do escape pela metade', () => {
  // `:434` concatena antes de `:447`, e e detalhe observavel por quem estende.
  const { registro } = registroCom('marca', 'X');
  const vistos: string[] = [];

  const expansao = expandirMacros('[[marca]', {
    contexto: { registro },
    pontosDeExtensao: {
      sobreAMarcaExpandida: [
        (saida) => {
          vistos.push(saida);
          return `<${saida}>`;
        },
      ],
    },
  });

  assert.deepEqual(vistos, ['[X']);
  assert.equal(expansao.texto, '<[X>');
});

test('o filtro de contexto de imagem e registrado uma vez, e so por quem o registrou', () => {
  // `// Ensure this context is only added once if shortcodes are nested.`
  // (`:262-268`) e `// Only remove the filter if it was added in this scope.`
  // (`:277`).
  const { registro } = registroCom('marca', 'X');

  assert.equal(
    expandirMacros('[marca]', { contexto: { registro } })
      .registrouContextoDeImagem,
    true,
  );
  assert.equal(
    expandirMacros('[marca]', {
      contexto: { registro },
      contextoDeImagem: { jaRegistrado: true },
    }).registrouContextoDeImagem,
    false,
  );
  // Quem sai por uma das tres portas antecipadas nao registra nada.
  assert.equal(
    expandirMacros('sem colchete', { contexto: { registro } })
      .registrouContextoDeImagem,
    false,
  );
});

test('a normalizacao de entidade sobra depois do desfazer, e so no caminho completo', () => {
  // ⚠️ `&#91;` vira `&#091;` no corpo inteiro (`:466-471`) e o desfazer de
  // `:576` nao o alcanca. Logo o mesmo corpo sai diferente conforme alguma marca
  // registrada apareca nele ou nao.
  const { registro } = registroCom('marca', 'X');

  assert.equal(
    expandirMacros('a &#91;b [marca]', { contexto: { registro } }).texto,
    'a &#091;b X',
  );
  assert.equal(
    expandirMacros('a &#91;b [outra]', { contexto: { registro } }).texto,
    'a &#91;b [outra]',
  );
});

test('os quirks de `shortcode_parse_atts` que um porte limpo apaga', () => {
  // `! empty( $m[1] )` e nao `isset()`: o nome `0` escorrega, e como os ramos
  // posicionais nao estao fixados naquele achado, nada e gravado.
  assert.deepEqual([...atributosDaMacro(' 0=x')], []);
  // `strlen( $m[7] )`: o valor entre aspas vazio nao grava nada.
  assert.deepEqual([...atributosDaMacro(' ""')], []);
  // O nome vai para minuscula; o valor, nao.
  assert.deepEqual([...atributosDaMacro(' ID="A"')], [['id', 'A']]);
  // Posicional e nomeado no mesmo arranjo, na ordem de insercao.
  assert.deepEqual(
    [...atributosDaMacro(" a='b' 3 c=d")],
    [
      ['a', 'b'],
      [0, '3'],
      ['c', 'd'],
    ],
  );
  // Nome repetido mantem a posicao e troca o valor.
  assert.deepEqual(
    [...atributosDaMacro(' a=1 b=2 a=3')],
    [
      ['a', '3'],
      ['b', '2'],
    ],
  );
  // `// Reject any unclosed HTML elements.` (`:634-641`).
  assert.deepEqual([...atributosDaMacro(' x="<b"')], [['x', '']]);
  assert.deepEqual([...atributosDaMacro(' x="<b>ok</b>"')], [['x', '<b>ok</b>']]);
  // Sempre arranjo, nunca nulo (6.5.0).
  assert.deepEqual([...atributosDaMacro('')], []);
});

test('`stripcslashes` em todo valor de atributo, com os sete casos do interpretador', () => {
  assert.equal(textoSemBarraDeC('a\\nb'), 'a\nb');
  assert.equal(textoSemBarraDeC('\\t\\r\\v\\b\\f\\a'), '\t\r\u000b\b\f\u0007');
  assert.equal(textoSemBarraDeC('\\\\'), '\\');
  assert.equal(textoSemBarraDeC('\\x41'), 'A');
  // `\x` sem digito hexadecimal cai no default e devolve o proprio caractere.
  assert.equal(textoSemBarraDeC('\\xz'), 'xz');
  // O default e a varredura OCTAL, de ate tres digitos, cortada em um byte.
  assert.equal(textoSemBarraDeC('\\101'), 'A');
  assert.equal(textoSemBarraDeC('\\777'), '\u00ff');
  // Qualquer outro escapado perde so a barra; a barra final sobrevive.
  assert.equal(textoSemBarraDeC('\\q'), 'q');
  assert.equal(textoSemBarraDeC('fim\\'), 'fim\\');
  // E e o que chega ao tratador.
  assert.deepEqual([...atributosDaMacro(' id="a\\nb"')], [['id', 'a\nb']]);
});

test('`shortcode_atts` combina com o padrao e descarta o que nao e suportado', () => {
  const atributos = atributosDaMacro(' id="7" extra="x" vazio=""');

  const saida = atributosComPadrao(
    new Map<string, ValorDeAtributo>([
      ['id', '0'],
      ['vazio', 'padrao'],
      ['ausente', 3],
    ]),
    atributos,
  );

  // `array_key_exists` e nao `isset` (`:669`): texto vazio VENCE o default.
  assert.deepEqual(
    [...saida],
    [
      ['id', '7'],
      ['vazio', ''],
      ['ausente', 3],
    ],
  );
});

test('`shortcode_atts_{marca}` so dispara com a marca informada', () => {
  const padroes = new Map<string, ValorDeAtributo>([['id', '0']]);
  const vazio = atributosDaMacro('');
  let disparos = 0;
  const pontos = [
    (saida: ReadonlyMap<string, ValorDeAtributo>) => {
      disparos += 1;
      return saida;
    },
  ];

  atributosComPadrao(padroes, vazio, '', pontos);
  // `if ( $shortcode )` (`:677`) e verdade do interpretador: `'0'` nao dispara.
  atributosComPadrao(padroes, vazio, '0', pontos);
  atributosComPadrao(padroes, vazio, 'marca', pontos);

  assert.equal(disparos, 1);
});

test('`strip_shortcodes` remove a marca E o conteudo que ela envolve', () => {
  const { registro, chamadas } = registroCom('marca', 'X');

  const remocao = removerMacrosDoCorpo('a [marca id="1"]texto[/marca] b', {
    contexto: { registro },
  });

  assert.equal(remocao.texto, 'a  b');
  // Nenhum tratador e chamado, logo nenhuma imagem de anexo e montada.
  assert.deepEqual(chamadas, []);
  assert.equal(remocao.registrouContextoDeImagem, false);
  // O escape `[[marca]]` sobrevive, pela mesma linha de `do_shortcode_tag()`.
  assert.equal(
    removerMacrosDoCorpo('[[marca]]', { contexto: { registro } }).texto,
    '[marca]',
  );
});

test('`strip_shortcodes_tagnames` filtra ANTES do recorte contra o corpo', () => {
  // `:726` roda sobre `array_keys( $shortcode_tags )` e so depois o
  // `array_intersect` de `:728` recorta — logo um interceptador pode acrescentar
  // marca que nao esta registrada.
  const { registro } = registroCom('marca', 'X');

  const remocao = removerMacrosDoCorpo('[marca] [outra]', {
    contexto: { registro },
    pontosDeExtensao: {
      sobreAsMarcasRemovidas: [(marcas) => [...marcas, 'outra']],
    },
  });

  assert.equal(remocao.texto, ' ');
  assert.deepEqual(remocao.marcas, ['marca', 'outra']);
});

test('a marca aninhada NAO e expandida por dentro, e o docblock do legado o diz', () => {
  // *"does not entirely support inline shortcodes in other shortcodes. You will
  // have to call the shortcode parser in your function to account for that"*
  // (`:13-15`). O conteudo envolvido chega CRU ao tratador.
  const { registro, chamadas } = registroCom('marca', 'X');

  const expansao = expandirMacros('[marca]a [marca] b[/marca]', {
    contexto: { registro },
  });

  assert.equal(expansao.texto, 'X');
  assert.deepEqual(
    chamadas.map((chamada) => chamada.conteudo),
    ['a [marca] b'],
  );
});
