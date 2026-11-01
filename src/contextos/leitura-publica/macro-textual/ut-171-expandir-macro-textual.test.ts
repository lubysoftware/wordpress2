/**
 * A entrega de **T018**: *"6 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-171-1, UT-171-2, UT-171-3, UT-171-4, UT-171-5,
 * UT-171-6), com o mesmo dado de entrada, acao e resultado esperado. O teste de
 * regra de negocio (UT-171-6) entra na mesma suite."*
 *
 * ✅ **Os seis casos foram COPIADOS do catalogo, nao reconstruidos.** A tabela de
 * `REQ-171` em `backlog/tests.md:704-715` — *"`should` · `pronto` · veredito
 * `aprovado` · 5 de 5 critérios de aceite cobertos"* — da nome, tipo e prova de
 * cada caso, e e ela que esta transcrita abaixo, em ordem de catalogo, com o nome
 * do caso dentro do nome do teste:
 *
 * | caso | tipo | nome no catalogo | prova que o catalogo cita | CA |
 * |---|---|---|---|---|
 * | `UT-171-1` | `feliz` | substitui na renderização a marca registrada pelo resultado do seu tratador | *"Uma marca registrada no corpo do conteúdo é substituída na renderização pelo resultado que o seu tratador produz"* | CA-8.1 |
 * | `UT-171-2` | `borda` | deixa a marca não registrada no texto como foi escrita | *"Marca não registrada é deixada no texto como foi escrita, sem erro e sem desaparecer"* | CA-8.2 |
 * | `UT-171-3` | `feliz` | mantém a marca no corpo gravado, expandindo apenas na renderização | *"A expansão acontece na renderização, não na gravação: o corpo gravado continua com a marca"* | CA-8.3 |
 * | `UT-171-4` | `feliz` | trata por caminho próprio a marca que aparece dentro de atributo de elemento | *"Marca dentro de atributo de elemento é tratada por caminho próprio e declarado"* | CA-8.4 |
 * | `UT-171-5` | `feliz` | expõe a quem administra a lista de marcas registradas | *"A lista de marcas registradas é inspecionável por quem administra o site"* | CA-8.5 |
 * | `UT-171-6` | `feliz` | reconhece a marca pela delimitação declarada e a expande na renderização | *"Shortcode é macro textual em colchetes expandida na renderização"* | regra de negocio |
 *
 * ---
 *
 * # O que o catalogo NAO da, e de onde veio
 *
 * O catalogo registra nome, tipo e prova, e **nao** o dado de entrada literal —
 * *"nenhum deles cita arquivo, classe ou framework"* (`backlog/tests.md:5`); o
 * `backlog.json` que aquele cabecalho cita nao esta nesta arvore. O dado daqui
 * sai de tres fontes, e de nenhuma outra:
 *
 * 1. **UC-01** e **UC-03**, que a tabela de rastreabilidade de `spec.md:181` liga
 *    a US-8 (*"US-8 | REQ-171 · UC-01 · UC-03"*). De UC-01 vem a pos-condicao
 *    *"nada muda no armazenamento"*, que a porta que registra afirma como
 *    resultado, e a etapa *"devolve a página renderizada"*; de UC-03, que nenhum
 *    dos sete passos da publicacao expande coisa alguma — o corpo e sanitizado e
 *    gravado com a marca dentro.
 * 2. **As marcas de fabrica**, de `MARCAS_DE_FABRICA`: os nomes reais do legado,
 *    na ordem declarada, com **duplos** no lugar dos tratadores — os tratadores
 *    reais sao das features 006 e 014. O corpo de UT-171-1 e UT-171-5 e o exemplo
 *    do docblock de `get_shortcode_tags_in_content()` (`shortcodes.php:173-174`).
 * 3. **O legado**, pelas ancoras que T017 registrou nos arquivos de
 *    `macro-textual/`, e que esta suite cita sem acrescentar nenhuma:
 *
 * | o que | onde |
 * |---|---|
 * | o registro vazio devolve o corpo sem filtrar nada | `wp-includes/shortcodes.php:231-233` e `:250` |
 * | nenhuma marca registrada aparece no corpo | `shortcodes.php:258` |
 * | a expansao dentro de elemento roda **antes** da expansao no corpo | `shortcodes.php:270` e `:273` |
 * | os tres argumentos do tratador, e a saida dele entre `$m[1]` e `$m[6]` | `shortcodes.php:434` |
 * | o nome nao seguido de palavra nem hifen | `shortcodes.php:343` |
 * | o escape `[[marca]]` | `shortcodes.php:396` |
 * | o atributo sem aspas nao passa por KSES; o entre aspas passa | `shortcodes.php:530-539` e `:540-553` |
 * | KSES so roda com troca, e o que ele esvazia mantem o original | `shortcodes.php:545` e `:548` |
 * | os quatro ramos do laco de elementos | `shortcodes.php:485-493`, `:495-499`, `:503-511` e `:514-566` |
 * | `array_keys( $shortcode_tags )` e `array_key_exists` | `shortcodes.php:328` e `:135` |
 * | `add_filter( 'the_content', 'do_shortcode', 11 )` | `wp-includes/default-filters.php:209` |
 * | `wp_caption` e `caption` dividem o tratador | `wp-includes/media.php:2596-2597` |
 *
 * ⚠️ **Estas ancoras NAO foram reconferidas por T018.** Quando esta suite foi
 * escrita a arvore do legado nao estava na maquina (`~/Downloads/wordpress`
 * ausente) e o oraculo executavel nao estava no ar, logo elas valem o que valiam
 * em T017. As expectativas abaixo sao as que a transcricao de `shortcodes.php`
 * em `macro-textual/` produz; a conferencia caso a caso contra o oraculo da
 * resposta 16 continua por fazer.
 *
 * ---
 *
 * # Nao e a suite de T017, e o nivel e outro
 *
 * `./us-8-expandir-macro-textual.test.ts` e a suite da **entrega** de T017, e o
 * cabecalho dela ja declara a fronteira: *"os seis casos `UT-171-1` a `UT-171-6`
 * de `backlog/tests.md` sao de **T018**, a tarefa `[P]`, e nenhum deles e afirmado
 * aqui"*. Ela afirma cada criterio com o duplo de uma marca so e desce aos quirks
 * de `atributosDaMacro`, `textoSemBarraDeC` e `strip_shortcodes()`.
 *
 * | | T017 (`us-8-…`) | T018 (este arquivo) |
 * |---|---|---|
 * | entrada | as funcoes da expansao, importadas uma a uma | `modulo.expandirMacros`, que e a superficie composta, e `modulo.atender` em UT-171-3 |
 * | o registro | uma marca de teste | as **sete** marcas de fabrica, com duplos |
 * | o dado | um exemplo por afirmacao | a grade: nove formas de marca nao registrada contra tres estados do corpo, cinco formas de atributo, quatro ramos de elemento, oito formas reconhecidas contra doze que nao sao marca |
 * | a porta de dados | **lanca** se for tocada | **registra comando**, e a assercao e o log |
 *
 * ---
 *
 * # Onde esta suite PARA
 *
 * - **O lado da gravacao nao e exercitado em UT-171-3.** `posts` e tabela de
 *   BC-01, e a regra de dependencia 3 proibe importar `contextos/conteudo/` daqui.
 *   O corpo gravado entra como linha do duplo do repositorio — a mesma linha que
 *   UC-03 grava —, e o que o caso afirma e que **a leitura** nao a altera e que
 *   nenhuma etapa dela grava. Que a publicacao nao expande e fato de UC-03 e do
 *   contexto de conteudo.
 * - **Os tratadores das sete marcas sao duplos.** O caso e sobre *"o resultado
 *   que o seu tratador produz"*, nao sobre o HTML de uma galeria; esse e das
 *   features 006 e 014.
 * - **O saneador de atributo e duplo em UT-171-4**, e o default
 *   `SEM_LISTA_DE_PERMISSAO` entra uma vez, como o estado desta arvore. KSES e do
 *   slot `analise-de-html`, nao escolhido; ver `./contexto-da-macro.ts`.
 * - **UT-171-5 nao afirma tela nem capacidade.** O legado nao tem tela da lista
 *   e `shortcodes.php` nao pergunta capacidade (ver o cabecalho de
 *   `./registro-de-macros.ts`): a inspecao e o proprio dado, lido por nome.
 *   *"Quem administra"* e a frase do criterio, e nao uma verificacao a afirmar.
 * - **Nao ha cenario de paridade para esta historia**: nenhum arquivo de
 *   `.specify/migration/` cita `shortcode`, fora a fusao do modulo em BC-01
 *   (`target_architecture.md:193`, `topology_decision.md:441`).
 * - **A afirmacao derivada de T017 continua derivada.** `$content = $m[5] ?? null`
 *   (`:432`) entregar texto vazio esta nomeado no README como o caso que fecha no
 *   oraculo executavel, e nada aqui depende dele: UT-171-1 afirma o conteudo so
 *   da marca que envolve texto.
 *
 * ⚠️ **Nada externo entra nestes testes.** A porta de dados e o repositorio sao
 * duplos que **registram comando**, e o tratador e o saneador sao duplos que
 * registram o que receberam; nao ha banco, rede, relogio nem navegador.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LIGACAO_NA_RENDERIZACAO,
  MARCAS_DE_FABRICA,
  REGISTRO_SEM_MACROS,
  SEM_LISTA_DE_PERMISSAO,
  adicionarMacro,
  corpoTemMacro,
  criarModuloDeLeituraPublica,
  fonteDaExpressaoDeMacro,
  macroExiste,
  marcasRegistradas,
  marcasUsadasNoCorpo,
  removerMacro,
  removerTodasAsMacros,
  type AtributosDaMacro,
  type AvisoDeUsoIndevido,
  type CaminhoDoAtributo,
  type CaminhoDoElemento,
  type ConteudoConsultado,
  type ContextoDaConsulta,
  type ModuloDeLeituraPublica,
  type PortasDeLeituraPublica,
  type RegistroDeMacros,
  type TratadorDeMacro,
} from '../index.js';

// ---------------------------------------------------------------------------
// Os duplos: todos registram o que lhes foi pedido
// ---------------------------------------------------------------------------

/**
 * A porta de dados que **registra** em vez de simular banco. Nenhum dos seis
 * casos a usa, e o log sem `porta.` e a pos-condicao de UC-01 afirmada como
 * resultado: *"nada muda no armazenamento"*.
 */
function portaQueRegistra(comandos: string[]): PortasDeLeituraPublica {
  return {
    dados: {
      prefixoDeTabela: 'wp_',
      selecionar(consulta) {
        comandos.push(`porta.selecionar ${consulta.texto}`);
        return [];
      },
      escrever(consulta) {
        comandos.push(`porta.escrever ${consulta.texto}`);
        return { linhasAfetadas: 0, idGerado: null };
      },
    },
  };
}

/** O modulo composto, que e a entrada desta suite. */
function moduloComPorta(comandos: string[]): ModuloDeLeituraPublica {
  return criarModuloDeLeituraPublica(portaQueRegistra(comandos));
}

/** Uma chamada recebida pelo duplo do tratador, como ele a recebeu. */
interface ChamadaDoTratador {
  readonly marca: string;
  readonly atributos: readonly (readonly [string | number, string])[];
  readonly conteudo: string | null;
}

/** O que o duplo devolve por marca: reconhecivel, e diferente entre marcas. */
function saidaDe(marca: string): string {
  return `saida-de-${marca}`;
}

/** O duplo do tratador: registra os tres argumentos, na ordem das chamadas. */
function tratadorQueRegistra(chamadas: ChamadaDoTratador[]): TratadorDeMacro {
  return (atributos, conteudo, marca) => {
    chamadas.push({ marca, atributos: [...atributos], conteudo });
    return saidaDe(marca);
  };
}

/**
 * O registro de uma instalacao nova: as sete marcas de `MARCAS_DE_FABRICA`, na
 * ordem declarada, cada uma com o duplo.
 */
function registroDeFabrica(chamadas: ChamadaDoTratador[]): RegistroDeMacros {
  const tratador = tratadorQueRegistra(chamadas);
  return MARCAS_DE_FABRICA.reduce<RegistroDeMacros>(
    (registro, { marca }) => adicionarMacro(registro, marca, tratador),
    REGISTRO_SEM_MACROS,
  );
}

// ---------------------------------------------------------------------------
// UT-171-1 · `feliz`
// ---------------------------------------------------------------------------

test('UT-171-1 substitui na renderizacao a marca registrada pelo resultado do seu tratador', () => {
  const comandos: string[] = [];
  const modulo = moduloComPorta(comandos);
  const chamadas: ChamadaDoTratador[] = [];
  const contexto = { registro: registroDeFabrica(chamadas) };

  // 1. Dado: uma marca registrada no meio do corpo. Entao: ela, e so ela, da
  //    lugar ao que o tratador produziu.
  const expansao = modulo.expandirMacros('antes [gallery ids="1,2,3"] depois', {
    contexto,
  });
  assert.equal(expansao.texto, 'antes saida-de-gallery depois');
  assert.equal(expansao.saida, 'expandiu');
  assert.deepEqual(expansao.marcas, ['gallery']);
  assert.deepEqual(
    chamadas.map(({ marca, atributos }) => ({ marca, atributos })),
    [{ marca: 'gallery', atributos: [['ids', '1,2,3']] }],
  );

  // 2. A marca que envolve texto: o conteudo chega ao tratador, e a marca de
  //    abertura, o texto e a de fechamento saem juntos.
  chamadas.length = 0;
  assert.equal(
    modulo.expandirMacros('[caption]legenda[/caption] fim', { contexto }).texto,
    'saida-de-caption fim',
  );
  assert.equal(chamadas[0]?.conteudo, 'legenda');

  // 3. As sete marcas de fabrica no mesmo corpo: cada uma com a saida DELA, e o
  //    tratador chamado na ordem do corpo — a ordem de registro decide a
  //    alternancia da expressao, nao a ordem das trocas.
  chamadas.length = 0;
  const invertidas = [...MARCAS_DE_FABRICA].reverse().map(({ marca }) => marca);
  const todas = modulo.expandirMacros(
    invertidas.map((marca) => `[${marca}]`).join(' | '),
    { contexto },
  );
  assert.equal(todas.texto, invertidas.map(saidaDe).join(' | '));
  assert.deepEqual(
    chamadas.map(({ marca }) => marca),
    invertidas,
  );
  assert.deepEqual(
    todas.marcas,
    MARCAS_DE_FABRICA.map(({ marca }) => marca),
  );

  // 4. Duas marcas com o MESMO tratador, que e o caso de fabrica de `wp_caption`
  //    e `caption` (`media.php:2596-2597`): o terceiro argumento (`:434`) e o
  //    que as distingue, e o resultado e o do tratador em cada uma.
  chamadas.length = 0;
  assert.equal(
    modulo.expandirMacros('[wp_caption] [caption]', { contexto }).texto,
    'saida-de-wp_caption saida-de-caption',
  );
  assert.deepEqual(
    chamadas.map(({ marca }) => marca),
    ['wp_caption', 'caption'],
  );

  // 5. O resultado e o do tratador, **qualquer** que seja: calculado dos
  //    atributos e do conteudo, ou vazio — e vazio a marca some do texto, porque
  //    foi isso que o tratador produziu.
  const saudar: TratadorDeMacro = (atributos: AtributosDaMacro, conteudo) =>
    `ola ${atributos.get('nome') ?? ''}, ${conteudo ?? ''}`;
  const calar: TratadorDeMacro = () => '';
  let proprio = adicionarMacro(REGISTRO_SEM_MACROS, 'saudar', saudar);
  proprio = adicionarMacro(proprio, 'calar', calar);
  assert.equal(
    modulo.expandirMacros('[saudar nome="Ana"]bem-vinda[/saudar]', {
      contexto: { registro: proprio },
    }).texto,
    'ola Ana, bem-vinda',
  );
  assert.equal(
    modulo.expandirMacros('a [calar] b', { contexto: { registro: proprio } })
      .texto,
    'a  b',
  );

  assert.deepEqual(comandos, []);
});

// ---------------------------------------------------------------------------
// UT-171-2 · `borda`
// ---------------------------------------------------------------------------

/**
 * Nove formas de marca que nenhum registro de fabrica tem.
 *
 * ⚠️ As tres ultimas sao as que um reconhecimento por prefixo ou sem distincao
 * de caixa estragaria: `[gallery-extra]` e `[galleryx]` comecam com uma marca
 * registrada, e `(?![\w-])` (`:343`) e o que as mantem de fora.
 */
const NAO_REGISTRADAS: readonly (readonly [string, string])[] = Object.freeze([
  ['sozinha', '[foo]'],
  ['com atributo', '[foo id="1"]'],
  ['envolvendo texto', '[foo]corpo[/foo]'],
  ['auto-fechada', '[foo /]'],
  ['dentro de atributo entre aspas', '<img src="[foo]">'],
  ['dentro de atributo sem aspas', '<img src=[foo]>'],
  ['com hifen depois de uma registrada', '[gallery-extra]'],
  ['com letra depois de uma registrada', '[galleryx]'],
  ['com outra caixa', '[GALLERY]'],
]);

test('UT-171-2 deixa a marca nao registrada no texto como foi escrita', () => {
  const comandos: string[] = [];
  const modulo = moduloComPorta(comandos);
  const chamadas: ChamadaDoTratador[] = [];
  const avisos: AvisoDeUsoIndevido[] = [];
  const registro = registroDeFabrica(chamadas);
  const avisar = (aviso: AvisoDeUsoIndevido): void => {
    avisos.push(aviso);
  };

  for (const [forma, corpo] of NAO_REGISTRADAS) {
    // 1. Registro vazio: `:250`, o ramo que o docblock documenta (`:231-233`).
    const semRegistro = modulo.expandirMacros(`a ${corpo} b`, {
      contexto: { avisar },
    });
    assert.equal(semRegistro.texto, `a ${corpo} b`, forma);
    assert.equal(semRegistro.saida, 'sem-marca-registrada', forma);

    // 2. Registro de fabrica sem nenhuma delas no corpo: `:258`.
    const semMarcaNoCorpo = modulo.expandirMacros(`a ${corpo} b`, {
      contexto: { registro, avisar },
    });
    assert.equal(semMarcaNoCorpo.texto, `a ${corpo} b`, forma);
    assert.equal(semMarcaNoCorpo.saida, 'nenhuma-marca-no-corpo', forma);

    // 3. O caminho inteiro: uma registrada ao lado faz o corpo atravessar a
    //    expansao, com o esconderijo de colchete e o desfazer, e a nao registrada
    //    sai igual. E a borda do caso: a vizinha expande, ela nao some.
    chamadas.length = 0;
    const aoLado = modulo.expandirMacros(`[gallery] ${corpo} [gallery]`, {
      contexto: { registro, avisar },
    });
    assert.equal(
      aoLado.texto,
      `saida-de-gallery ${corpo} saida-de-gallery`,
      forma,
    );
    assert.equal(aoLado.saida, 'expandiu', forma);
    assert.deepEqual(
      chamadas.map(({ marca }) => marca),
      ['gallery', 'gallery'],
      forma,
    );
  }

  // 4. A marca que ja foi registrada e deixou de ser — a extensao desligada do
  //    docblock de `:231-233`: *"the shortcode will still show up in the post or
  //    content"*.
  assert.equal(
    modulo.expandirMacros('[gallery]', {
      contexto: { registro: removerMacro(registro, 'gallery') },
    }).texto,
    '[gallery]',
  );
  assert.equal(
    modulo.expandirMacros('[gallery]', {
      contexto: { registro: removerTodasAsMacros() },
    }).texto,
    '[gallery]',
  );

  // *"sem erro"*: chegar aqui ja e nao ter lancado, e nem aviso de uso indevido
  // houve — esse e so da marca registrada com tratador quebrado (`:403`).
  assert.deepEqual(avisos, []);
  assert.deepEqual(comandos, []);
});

// ---------------------------------------------------------------------------
// UT-171-3 · `feliz`
// ---------------------------------------------------------------------------

test('UT-171-3 mantem a marca no corpo gravado, expandindo apenas na renderizacao', () => {
  const comandos: string[] = [];
  const modulo = moduloComPorta(comandos);
  const chamadas: ChamadaDoTratador[] = [];
  const registro = registroDeFabrica(chamadas);

  // Dado: o conteudo como UC-03 o deixa gravado, com a marca dentro do corpo.
  const CORPO_GRAVADO = 'veja [gallery ids="1,2,3"] e fim';
  const linhaGravada: ConteudoConsultado = Object.freeze({
    id: 7,
    identificadorNaUrl: 'com-galeria',
    tipo: 'post',
    corpo: CORPO_GRAVADO,
    data: '2026-10-01 00:00:00',
    senha: '',
  });
  const repositorio: NonNullable<ContextoDaConsulta['repositorio']> = () => {
    comandos.push('repositorio.ler');
    return { conteudos: [linhaGravada] };
  };
  const endereco = { uriPedida: '/?p=7', parametrosDeConsulta: { p: '7' } };

  // 1. Quando: o visitante pede o endereco. Entao: a consulta entrega o corpo
  //    como esta gravado — a expansao nao e etapa do atendimento, e sim
  //    interceptador de `the_content` (`default-filters.php:209`) — e nenhum
  //    tratador rodou.
  const atendimento = modulo.atender(endereco, { contexto: { repositorio } });
  assert.equal(atendimento.resposta.codigoHttp, 200);
  assert.equal(atendimento.consulta?.conteudo?.corpo, CORPO_GRAVADO);
  assert.deepEqual(chamadas, []);

  // 2. Quando: o tema renderiza esse corpo. Entao: quem le ve a saida do
  //    tratador, e a linha gravada continua com a marca.
  const corpoLido = atendimento.consulta?.conteudo?.corpo ?? '';
  const renderizado = modulo.expandirMacros(corpoLido, {
    contexto: { registro },
  });
  assert.equal(renderizado.texto, 'veja saida-de-gallery e fim');
  assert.equal(linhaGravada.corpo, CORPO_GRAVADO);
  assert.equal(corpoLido, CORPO_GRAVADO);

  // 3. A prova de que a marca continua la e o que muda sem regravar nada: a
  //    mesma linha, renderizada de novo, reflete o registro **daquela** visita.
  //    Tratador trocado muda a pagina; marca removida volta a aparecer literal.
  //    Nada disso seria possivel se a expansao tivesse sido gravada.
  assert.equal(
    modulo.expandirMacros(linhaGravada.corpo, { contexto: { registro } }).texto,
    renderizado.texto,
  );
  assert.equal(
    modulo.expandirMacros(linhaGravada.corpo, {
      contexto: { registro: adicionarMacro(registro, 'gallery', () => 'outra') },
    }).texto,
    'veja outra e fim',
  );
  assert.equal(
    modulo.expandirMacros(linhaGravada.corpo, {
      contexto: { registro: removerMacro(registro, 'gallery') },
    }).texto,
    CORPO_GRAVADO,
  );

  // 4. A segunda visita le o que a primeira leu.
  assert.equal(
    modulo.atender(endereco, { contexto: { repositorio } }).consulta?.conteudo
      ?.corpo,
    CORPO_GRAVADO,
  );

  // 5. A posicao declarada: leitura do corpo, depois de `wpautop` (10) e antes
  //    de `wp_filter_content_tags` (12).
  assert.equal(
    LIGACAO_NA_RENDERIZACAO.find(({ ponto }) => ponto === 'the_content')
      ?.prioridade,
    11,
  );

  // A pos-condicao de UC-01: as duas leituras do repositorio e nada na porta.
  assert.deepEqual(comandos, ['repositorio.ler', 'repositorio.ler']);
});

// ---------------------------------------------------------------------------
// UT-171-4 · `feliz`
// ---------------------------------------------------------------------------

/** Uma forma de atributo, com o caminho que ela toma e o que o saneador ve. */
interface FormaDeAtributo {
  readonly forma: string;
  readonly corpo: string;
  readonly esperado: string;
  readonly caminho: CaminhoDoAtributo;
  /** O par `[atributo, elemento]` que o saneador recebe; nulo, nao roda. */
  readonly saneado: readonly [string, string] | null;
}

/** As cinco formas: duas que nao passam por KSES e tres que passam. */
const FORMAS_DE_ATRIBUTO: readonly FormaDeAtributo[] = Object.freeze([
  {
    forma: 'valor sem aspas',
    corpo: '<img src=[gallery]>',
    esperado: '<img src=saida-de-gallery>',
    caminho: 'sem-aspas',
    saneado: null,
  },
  {
    forma: 'a marca na posicao do nome do atributo',
    corpo: '<img [gallery]>',
    esperado: '<img saida-de-gallery>',
    caminho: 'sem-aspas',
    saneado: null,
  },
  {
    forma: 'entre aspas duplas',
    corpo: '<img src="[gallery]">',
    esperado: '<img src="saida-de-gallery">',
    caminho: 'entre-aspas',
    saneado: ['src="saida-de-gallery"', 'img'],
  },
  {
    forma: 'entre aspas simples',
    corpo: "<a href='[gallery]'>",
    esperado: "<a href='saida-de-gallery'>",
    caminho: 'entre-aspas',
    saneado: ["href='saida-de-gallery'", 'a'],
  },
  {
    forma: 'entre aspas, com marca nao registrada',
    corpo: '<img src="[gallery] [foo]">',
    esperado: '<img src="saida-de-gallery [foo]">',
    caminho: 'entre-aspas',
    saneado: ['src="saida-de-gallery [foo]"', 'img'],
  },
]);

/** Os quatro ramos do laco de elementos, com o corpo que cai em cada um. */
const RAMOS_DE_ELEMENTO: readonly (readonly [
  CaminhoDoElemento,
  string,
  string,
])[] = Object.freeze([
  // `:485-493`: so um dos colchetes no elemento, e ele volta literal.
  ['sem-par-de-colchetes', '<img alt="[" src="a"> [gallery]', '<img alt="[" src="a"> saida-de-gallery'],
  // `:495-499`: comentario e CDATA escondem tudo, inclusive a marca registrada.
  ['colchete-escapado', '<!-- [gallery] --> [gallery]', '<!-- [gallery] --> saida-de-gallery'],
  // `:503-511`: o elemento que nao se analisa, com a marca no lugar do nome.
  ['html-inesperado', '<[gallery]>', '<saida-de-gallery>'],
  // `:514-566`: o laco de atributo.
  ['atributo', '<img src=[gallery]>', '<img src=saida-de-gallery>'],
]);

test('UT-171-4 trata por caminho proprio a marca que aparece dentro de atributo de elemento', () => {
  const comandos: string[] = [];
  const modulo = moduloComPorta(comandos);
  const chamadas: ChamadaDoTratador[] = [];
  const registro = registroDeFabrica(chamadas);
  const saneados: (readonly [string, string])[] = [];
  const contexto = {
    registro,
    sanearAtributo: (atributo: string, elemento: string): string => {
      saneados.push([atributo, elemento]);
      return atributo;
    },
  };

  // 1. O caminho e **declarado**: cada forma diz por qual regra passou, e so as
  //    formas entre aspas chegam ao saneador (`:530-539` contra `:540-553`).
  for (const forma of FORMAS_DE_ATRIBUTO) {
    saneados.length = 0;

    const expansao = modulo.expandirMacros(forma.corpo, { contexto });

    assert.equal(expansao.texto, forma.esperado, forma.forma);
    const passo = expansao.passosNoHtml[0];
    assert.equal(passo?.elemento, forma.corpo, forma.forma);
    assert.equal(passo?.caminho, 'atributo', forma.forma);
    const comMarca = passo?.atributos.find(({ trocas }) => trocas > 0);
    assert.equal(comMarca?.caminho, forma.caminho, forma.forma);
    assert.deepEqual(
      saneados,
      forma.saneado === null ? [] : [forma.saneado],
      forma.forma,
    );
  }

  // 2. O caminho e **proprio**: a mesma marca, no texto, nao tem passo nenhum e
  //    nao passa pelo saneador. Os dois caminhos no mesmo corpo, lado a lado.
  saneados.length = 0;
  const noTexto = modulo.expandirMacros('[gallery]', { contexto });
  assert.equal(noTexto.texto, 'saida-de-gallery');
  assert.deepEqual(noTexto.passosNoHtml, []);
  assert.deepEqual(saneados, []);

  const lado = modulo.expandirMacros('[gallery] <img src="[gallery]">', {
    contexto,
  });
  assert.equal(lado.texto, 'saida-de-gallery <img src="saida-de-gallery">');
  assert.deepEqual(saneados, [['src="saida-de-gallery"', 'img']]);

  // 3. E roda **antes** do corpo (`:270` contra `:273`): o tratador da marca de
  //    atributo e chamado primeiro, ainda que ela venha depois no texto.
  chamadas.length = 0;
  modulo.expandirMacros('[caption] <img src=[gallery]>', { contexto });
  assert.deepEqual(
    chamadas.map(({ marca }) => marca),
    ['gallery', 'caption'],
  );

  // 4. O que o saneador decide e o que sai: o atributo trocado, ou, quando ele
  //    esvazia, o atributo ORIGINAL (`:548`). O default desta arvore,
  //    `SEM_LISTA_DE_PERMISSAO`, cai nesse segundo ramo, e `trocas` continua a
  //    dizer que a marca foi expandida antes de o resultado ser descartado.
  assert.equal(
    modulo.expandirMacros('<img src="[gallery]">', {
      contexto: { registro, sanearAtributo: () => 'src="limpo"' },
    }).texto,
    '<img src="limpo">',
  );
  const semLista = modulo.expandirMacros('<img src="[gallery]">', {
    contexto: { registro, sanearAtributo: SEM_LISTA_DE_PERMISSAO },
  });
  assert.equal(semLista.texto, '<img src="[gallery]">');
  assert.deepEqual(semLista.passosNoHtml[0]?.atributos, [
    {
      atributo: 'src="[gallery]"',
      caminho: 'entre-aspas',
      trocas: 1,
      mantidoPeloSaneador: true,
    },
  ]);

  // 5. Sem marca trocada o saneador nao roda (`:545`).
  saneados.length = 0;
  modulo.expandirMacros('<img src="[foo]"> [gallery]', { contexto });
  assert.deepEqual(saneados, []);

  // 6. O laco de atributo e um de quatro ramos, e cada elemento declara o seu.
  for (const [caminho, corpo, esperado] of RAMOS_DE_ELEMENTO) {
    const expansao = modulo.expandirMacros(corpo, { contexto });

    assert.equal(expansao.texto, esperado, caminho);
    assert.deepEqual(
      expansao.passosNoHtml.map((passo) => passo.caminho),
      [caminho],
      caminho,
    );
  }

  // 7. A saida do tratador dentro de atributo nao e marca de novo: ela e
  //    escondida com o resto do elemento e devolvida literal no fim.
  const encadeada = adicionarMacro(registro, 'gallery', () => '[caption]');
  chamadas.length = 0;
  assert.equal(
    modulo.expandirMacros('<img src=[gallery]>', {
      contexto: { registro: encadeada },
    }).texto,
    '<img src=[caption]>',
  );
  assert.deepEqual(chamadas, []);

  assert.deepEqual(comandos, []);
});

// ---------------------------------------------------------------------------
// UT-171-5 · `feliz`
// ---------------------------------------------------------------------------

test('UT-171-5 expoe a quem administra a lista de marcas registradas', () => {
  const comandos: string[] = [];
  const modulo = moduloComPorta(comandos);
  const nomes = MARCAS_DE_FABRICA.map(({ marca }) => marca);
  const registro = registroDeFabrica([]);

  // 1. A lista inteira, na ordem de registro: `array_keys( $shortcode_tags )`
  //    (`:328`). As sete de fabrica e nenhuma outra.
  assert.deepEqual(marcasRegistradas(registro), nomes);
  assert.equal(marcasRegistradas(registro).length, 7);

  // 2. Marca a marca, cada nome responde por si (`:133`).
  for (const nome of nomes) {
    assert.ok(macroExiste(registro, nome), nome);
  }
  assert.ok(!macroExiste(registro, 'foo'));

  // 3. A lista acompanha o registro: entra a extensao, sai a extensao. E
  //    inspecionar nao mexe em nada — a lista de antes continua a de antes.
  const comExtensao = adicionarMacro(registro, 'formulario', () => '');
  assert.deepEqual(marcasRegistradas(comExtensao), [...nomes, 'formulario']);
  assert.deepEqual(
    marcasRegistradas(removerMacro(comExtensao, 'gallery')),
    [...nomes, 'formulario'].filter((nome) => nome !== 'gallery'),
  );
  assert.deepEqual(marcasRegistradas(registro), nomes);
  assert.deepEqual(marcasRegistradas(removerTodasAsMacros()), []);

  // 4. A lista diz o que esta **registrado**, nao o que funciona: a marca com
  //    tratador que nao e chamavel aparece nela (`:135` e `array_key_exists`), e
  //    e assim que quem administra a enxerga. O nome recusado nao aparece.
  const comQuebrada = adicionarMacro(registro, 'quebrada', 'funcao_ausente');
  assert.deepEqual(marcasRegistradas(comQuebrada), [...nomes, 'quebrada']);
  assert.deepEqual(
    marcasRegistradas(adicionarMacro(registro, 'ma rca', () => '')),
    nomes,
  );

  // 5. A lista devolvida e leitura: alterar a copia nao altera o registro.
  assert.throws(() => {
    (marcasRegistradas(registro) as string[]).push('intrusa');
  }, TypeError);
  assert.deepEqual(marcasRegistradas(registro), nomes);

  // 6. Cruzada com um corpo, a inspecao diz o que aquele conteudo usa — o
  //    exemplo do docblock (`:173-174`), com a marca `foo` de fora.
  const corpo = '[audio src="file.mp3"][/audio] [foo] [gallery ids="1,2,3"]';
  assert.deepEqual(marcasUsadasNoCorpo(registro, corpo), ['audio', 'gallery']);
  assert.ok(corpoTemMacro(registro, corpo, 'gallery'));
  assert.ok(!corpoTemMacro(registro, corpo, 'foo'));
  assert.ok(!corpoTemMacro(registro, corpo, 'video'));

  // 7. E o que a inspecao mostra e o que a expansao usa: as marcas da lista
  //    expandem, a que esta fora dela fica literal.
  assert.equal(
    modulo.expandirMacros(corpo, { contexto: { registro } }).texto,
    'saida-de-audio [foo] saida-de-gallery',
  );

  assert.deepEqual(comandos, []);
});

// ---------------------------------------------------------------------------
// UT-171-6 · `feliz` — a regra de negocio
// ---------------------------------------------------------------------------

/** Oito formas que a delimitacao reconhece, com o que o tratador recebe. */
const RECONHECIDAS: readonly (readonly [
  string,
  readonly (readonly [string | number, string])[],
  string | null,
])[] = Object.freeze([
  ['[marca /]', [], null],
  ['[marca/]', [], null],
  ['[marca]', [], null],
  ['[marca id="1"]', [['id', '1']], null],
  ['[marca url="http://a/b"]', [['url', 'http://a/b']], null],
  ['[marca]dentro[/marca]', [], 'dentro'],
  ['[marca]\nlinha um\nlinha dois\n[/marca]', [], '\nlinha um\nlinha dois\n'],
  ['[marca\nid="1"\n]', [['id', '1']], null],
]);

/** Doze textos que tem o nome, e nao tem a delimitacao. */
const NAO_SAO_MARCA: readonly string[] = Object.freeze([
  'marca',
  '(marca)',
  '{marca}',
  '<marca>',
  'marca]',
  '[marca',
  '[ marca]',
  '[/marca]',
  '[marca-x]',
  '[marcax]',
  '[marca_x]',
  '[MARCA]',
]);

test('UT-171-6 reconhece a marca pela delimitacao declarada e a expande na renderizacao', () => {
  const comandos: string[] = [];
  const modulo = moduloComPorta(comandos);
  const chamadas: ChamadaDoTratador[] = [];
  const registro = adicionarMacro(
    REGISTRO_SEM_MACROS,
    'marca',
    tratadorQueRegistra(chamadas),
  );
  const contexto = { registro };

  // 1. A delimitacao esta declarada num lugar so, e e em colchetes: abre em
  //    `[`, nomeia a marca, tem o fechamento `[/marca]` pela referencia ao grupo
  //    do nome e fecha no grupo do segundo `]`. Seis grupos, numerados, porque
  //    `do_shortcode_tag()` os le por numero.
  const fonte = fonteDaExpressaoDeMacro(['marca']);
  assert.ok(fonte.startsWith('\\[(\\[?)(marca)(?![\\w-])'), fonte);
  assert.ok(fonte.includes('\\[\\/\\2\\]'), fonte);
  assert.ok(fonte.endsWith('(\\]?)'), fonte);
  assert.equal(new RegExp(`${fonte}|`).exec('')?.length, 7);

  // 2. Toda forma reconhecida vira a saida do tratador, inteira, com o texto em
  //    volta intacto — o `[/marca]` de fechamento vai junto.
  for (const [corpo, atributos, envolvido] of RECONHECIDAS) {
    chamadas.length = 0;

    const expansao = modulo.expandirMacros(`a ${corpo} b`, { contexto });

    assert.equal(expansao.texto, 'a saida-de-marca b', corpo);
    assert.equal(chamadas.length, 1, corpo);
    assert.deepEqual(chamadas[0]?.atributos, atributos, corpo);
    if (envolvido !== null) {
      assert.equal(chamadas[0]?.conteudo, envolvido, corpo);
    }
  }

  // 3. O nome sem a delimitacao nao e marca: o texto sai como foi escrito e o
  //    tratador nao ve nada dele.
  chamadas.length = 0;
  for (const corpo of NAO_SAO_MARCA) {
    assert.equal(
      modulo.expandirMacros(corpo, { contexto }).texto,
      corpo,
      corpo,
    );
  }
  assert.deepEqual(chamadas, []);

  // 4. O escape da propria delimitacao (`:396`): `[[marca]]` e a forma de
  //    escrever a marca como texto, e exige os dois colchetes.
  assert.equal(
    modulo.expandirMacros('[[marca]]', { contexto }).texto,
    '[marca]',
  );
  assert.deepEqual(chamadas, []);

  // 5. *"Expandida na renderização"*: o ponto de `the_content`, e a operacao
  //    recebe e devolve texto. O corpo de entrada continua o mesmo.
  const corpo = 'o [marca] gravado';
  assert.equal(
    modulo.expandirMacros(corpo, { contexto }).texto,
    'o saida-de-marca gravado',
  );
  assert.equal(corpo, 'o [marca] gravado');
  assert.ok(
    LIGACAO_NA_RENDERIZACAO.some(({ ponto }) => ponto === 'the_content'),
  );

  assert.deepEqual(comandos, []);
});
