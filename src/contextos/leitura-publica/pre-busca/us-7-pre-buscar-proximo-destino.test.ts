/**
 * Testes de **T015** — US-7, *"pre-buscar o proximo destino de navegacao antes
 * do clique"*, com os tres criterios de aceite da tarefa:
 *
 * | criterio | o que afirma |
 * |---|---|
 * | CA-7.1 | a pagina servida declara **quais** destinos podem ser pre-buscados e **com que agressividade** |
 * | CA-7.2 | enderecos de administracao, de saida de sessao e de acao com efeito ficam fora da declaracao |
 * | CA-7.3 | a declaracao e desligavel por configuracao, e desligada ela **nao aparece** na pagina |
 *
 * Mais o que T015 entrega e que nao e criterio de aceite proprio: as dez
 * recusas de `add_rule()`, a sobreposicao do default por constante e por
 * variavel de ambiente, os tres pontos de extensao novos, e os quirks do legado
 * que um porte "limpo" apaga em silencio.
 *
 * **Nao sao os testes do catalogo.** Os tres casos `UT-045-1` a `UT-045-3` de
 * `backlog/tests.md` sao de **T016**, a tarefa `[P]`, e nenhum deles e afirmado
 * aqui: aqui se afirma o criterio de aceite, la se transcreve o caso.
 *
 * ⚠️ **Nada externo entra nestes testes.** A instalacao, quem esta autenticado,
 * as constantes e as variaveis de ambiente sao duplos que **registram** o que
 * lhes foi perguntado — e e assim que se afirma que a declaracao nao le o
 * relogio, nao toca o banco e nao consulta capacidade nenhuma.
 *
 * 🔴 **A pergunta aberta da `spec.md` sobre esta historia nao bloqueou a
 * tarefa, e vale registrar por que.** O texto diz que *"metade do comportamento
 * do modulo correspondente do legado esta no lado cliente, ausente desta
 * arvore (lacuna L4)"*. Conferido no legado: **nao ha lado cliente deste
 * modulo**. Uma busca por `speculation` em `wp-includes/js/` e `wp-admin/js/`
 * devolve **zero** arquivo, e a unica ocorrencia fora dos tres arquivos de
 * servidor e um comentario do analisador de HTML
 * (`wp-includes/html-api/class-wp-html-tag-processor.php:4324`). Quem consome a
 * declaracao e **o navegador**, pela Speculation Rules API, e o proprio legado
 * registra isso como degradacao graciosa: *"For browsers that do not support
 * speculation rules yet, the `script[type="speculationrules"]` tag will be
 * ignored"* (`speculative-loading.php:325`). Os tres criterios desta historia
 * sao sobre a declaracao **emitida pelo servidor**, e os tres sao conferiveis
 * aqui. A pergunta continua **aberta** no pacote — nada aqui a resolve, e
 * resolve-la nao e do agente de codificacao.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AGRESSIVIDADE_DE_FABRICA,
  BANDEIRAS_DA_CODIFICACAO,
  CAMINHOS_SEM_PATH,
  configuracaoDaPreBusca,
  configuracaoDeFabricaDaPreBusca,
  contextosPadraoDoPrefixador,
  criarModuloDeLeituraPublica,
  declararPreBusca,
  escaparPadrao,
  EXCLUSOES_DE_FABRICA,
  GANCHO_DA_DECLARACAO,
  identificadorDeRegraValido,
  MODO_DE_FABRICA,
  prefixarPadrao,
  PRIORIDADE_DA_DECLARACAO,
  regrasDePreBusca,
  SELETOR_SEM_SEGUIR,
  TIPO_DO_ELEMENTO_DE_SAIDA,
  type CaminhosDaInstalacao,
  type CondicaoDeRegra,
  type ConfiguracaoDoSiteNaConsulta,
  type ContextoDaPreBusca,
  type PortasDeLeituraPublica,
  type RegraDePreBusca,
} from '../index.js';

/** A porta de dados, que **nenhuma** parte desta operacao deve tocar. */
function portasDeTeste(): PortasDeLeituraPublica {
  return {
    dados: {
      prefixoDeTabela: 'wp_',
      selecionar() {
        throw new Error('a declaracao de pre-busca nao consulta o banco');
      },
      escrever() {
        throw new Error('a declaracao de pre-busca nao grava');
      },
    },
  };
}

/**
 * Uma instalacao em subdiretorio, com tema filho — a forma em que o prefixo e
 * observavel, e em que a troca de `template` por `stylesheet` tambem e.
 */
const EM_SUBDIRETORIO: CaminhosDaInstalacao = Object.freeze({
  home: '/blog',
  site: '/blog',
  uploads: '/blog/wp-content/uploads',
  content: '/blog/wp-content',
  plugins: '/blog/wp-content/plugins',
  // 🔴 `template` recebe `get_stylesheet_directory_uri()` e `stylesheet`
  // recebe `get_template_directory_uri()` (`class-wp-url-pattern-prefixer.php:118-119`).
  template: '/blog/wp-content/themes/filho',
  stylesheet: '/blog/wp-content/themes/pai',
});

/** As opcoes do site com enderecos amigaveis ligados. */
const COM_ENDERECO_AMIGAVEL: ConfiguracaoDoSiteNaConsulta = Object.freeze({
  mostrarNaFrente: 'posts',
  paginaDaFrente: 0,
  paginaDeConteudos: 0,
  paginaDePoliticaDePrivacidade: 0,
  formaDosEnderecos: '/%year%/%monthnum%/%day%/%postname%/',
});

/** O contexto de um visitante num site com enderecos amigaveis. */
const VISITANTE: ContextoDaPreBusca = Object.freeze({
  alguemAutenticado: false,
  configuracaoDoSite: COM_ENDERECO_AMIGAVEL,
  caminhosDaInstalacao: EM_SUBDIRETORIO,
});

/** Os oito caminhos excluidos que `VISITANTE` produz, na ordem do legado. */
const OITO_EXCLUSOES: readonly string[] = Object.freeze([
  '/blog/wp-*.php',
  '/blog/wp-admin/*',
  '/blog/wp-content/uploads/*',
  '/blog/wp-content/*',
  '/blog/wp-content/plugins/*',
  '/blog/wp-content/themes/filho/*',
  '/blog/wp-content/themes/pai/*',
  '/blog/*\\?(.+)',
]);

/** A unica regra da declaracao, sob o modo informado. */
function regraUnica(
  contexto: ContextoDaPreBusca,
  modo = 'prefetch',
): RegraDePreBusca {
  const declaracao = declararPreBusca({ contexto });
  assert.equal(declaracao.emitida, true);
  const doModo = declaracao.conteudo?.[modo];
  assert.ok(doModo !== undefined, `nenhuma regra sob o modo ${modo}`);
  const regra = doModo[0];
  assert.ok(regra !== undefined, `o modo ${modo} saiu sem regra`);
  return regra;
}

/** As condicoes da regra, que o legado monta sob `where.and`. */
function condicoesDa(regra: RegraDePreBusca): readonly CondicaoDeRegra[] {
  const onde = regra.where;
  assert.ok(onde !== undefined && 'and' in onde, 'a regra saiu sem `where.and`');
  return onde.and;
}

// ---------------------------------------------------------------------------
// CA-7.1 — a pagina declara quais destinos e com que agressividade
// ---------------------------------------------------------------------------

test('CA-7.1: a declaracao nomeia os destinos do proprio site e a agressividade', () => {
  const regra = regraUnica(VISITANTE);

  // `href_matches` prefixado pelo contexto `home` (`:267`) — "qualquer endereco
  // dentro do mesmo site".
  assert.deepEqual(condicoesDa(regra)[0], { href_matches: '/blog/*' });
  // `eagerness` (`:306`), que e a segunda metade do criterio.
  assert.equal(regra.eagerness, AGRESSIVIDADE_DE_FABRICA);
  // `source: 'document'` (`:302`): a declaracao e sobre os links da pagina, nao
  // sobre uma lista de enderecos.
  assert.equal(regra.source, 'document');
});

test('CA-7.1: a declaracao sai sob o modo, e o modo de fabrica e o mais conservador', () => {
  const declaracao = declararPreBusca({ contexto: VISITANTE });

  // `jsonSerialize()` devolve um mapa de `modo => regras` (`:238-243`), logo o
  // modo e a CHAVE e nao um campo. Os dois defaults do nucleo sao `prefetch` e
  // `conservative` (`:125` e `:131`).
  assert.deepEqual(Object.keys(declaracao.conteudo ?? {}), [MODO_DE_FABRICA]);
  assert.equal(MODO_DE_FABRICA, 'prefetch');
  assert.equal(AGRESSIVIDADE_DE_FABRICA, 'conservative');
});

test('CA-7.1: o que vai para a borda e o valor, o atributo e as duas bandeiras', () => {
  const declaracao = declararPreBusca({ contexto: VISITANTE });

  // `wp_print_inline_script_tag( ..., array( 'type' => 'speculationrules' ) )`
  // (`:341`) e `JSON_HEX_TAG | JSON_UNESCAPED_SLASHES` (`:339`). A codificacao e
  // a montagem do elemento sao da plataforma e da borda; as bandeiras e o
  // atributo nao, e sem eles o mesmo valor produziria outro texto.
  assert.deepEqual(declaracao.atributos, { type: TIPO_DO_ELEMENTO_DE_SAIDA });
  assert.equal(TIPO_DO_ELEMENTO_DE_SAIDA, 'speculationrules');
  assert.deepEqual(declaracao.bandeirasDaCodificacao, [
    'JSON_HEX_TAG',
    'JSON_UNESCAPED_SLASHES',
  ]);
  assert.equal(BANDEIRAS_DA_CODIFICACAO.length, 2);
});

test('CA-7.1: a posicao da declaracao na pagina e o rodape, com prioridade 10', () => {
  // `add_action( 'wp_footer', 'wp_print_speculation_rules' )`
  // (`wp-includes/default-filters.php:367`). Declarado como dado porque
  // `plataforma/barramento/` nao existe nesta arvore e a ordem de disparo e
  // contrato publico (P2) — e a posicao e observavel: no rodape, a declaracao
  // vem depois de todo link do corpo.
  assert.equal(GANCHO_DA_DECLARACAO, 'wp_footer');
  assert.equal(PRIORIDADE_DA_DECLARACAO, 10);
});

test('CA-7.1: a agressividade e o modo sao configuraveis pelo ponto de extensao', () => {
  const forcada = declararPreBusca({
    contexto: VISITANTE,
    pontosDeExtensao: {
      sobreAConfiguracao: [() => ({ mode: 'prerender', eagerness: 'eager' })],
    },
  });

  // `apply_filters( 'wp_speculation_rules_configuration', $config )` (`:62`):
  // o interceptador altera o resultado, que e o que o P2 cobra.
  assert.deepEqual(Object.keys(forcada.conteudo ?? {}), ['prerender']);
  assert.equal(forcada.conteudo?.['prerender']?.[0]?.eagerness, 'eager');

  // E o mesmo contexto sem o interceptador continua em `prefetch`/`conservative`:
  // o filtro nao deixa estado para tras (BR-MIGRAR-105).
  assert.equal(regraUnica(VISITANTE).eagerness, 'conservative');
});

// ---------------------------------------------------------------------------
// CA-7.2 — o que fica fora da declaracao
// ---------------------------------------------------------------------------

test('CA-7.2: os oito caminhos excluidos saem na ordem do legado, com o prefixo da instalacao', () => {
  const regra = regraUnica(VISITANTE);
  const excluidos = condicoesDa(regra)[1];

  // `array( 'not' => array( 'href_matches' => $href_exclude_paths ) )`
  // (`:270-274`). A ordem chega ao navegador: nada reordena a lista.
  assert.deepEqual(excluidos, { not: { href_matches: OITO_EXCLUSOES } });
});

test('CA-7.2: administracao e saida de sessao saem pelos dois primeiros padroes', () => {
  const regra = regraUnica(VISITANTE);
  const excluidos = condicoesDa(regra)[1];
  assert.ok(excluidos !== undefined && 'not' in excluidos);
  const padroes = excluidos.not;
  assert.ok('href_matches' in padroes);
  const lista = padroes.href_matches;
  assert.ok(Array.isArray(lista));

  // `/wp-admin/*` e administracao (`:208`). `/wp-*.php` pega `wp-login.php`
  // (`:207`), e a saida de sessao do legado e `wp-login.php?action=logout` —
  // logo o criterio de "endereco de saida de sessao" e satisfeito por este
  // padrao, e nao por um padrao proprio. Os dois sao prefixados pelo contexto
  // `site`, que num subdiretorio nao e o mesmo que `home`.
  assert.ok(lista.includes('/blog/wp-admin/*'));
  assert.ok(lista.includes('/blog/wp-*.php'));
  assert.deepEqual(
    EXCLUSOES_DE_FABRICA.slice(0, 2).map((e) => e.contexto),
    ['site', 'site'],
  );
});

test('CA-7.2: acao com efeito sai por endereco (toda consulta) e por marcacao', () => {
  const regra = regraUnica(VISITANTE);
  const condicoes = condicoesDa(regra);

  // Por endereco: com enderecos amigaveis, QUALQUER endereco com consulta esta
  // fora (`:222`), e o comentario do legado diz por que (`:217`).
  assert.equal(OITO_EXCLUSOES[7], '/blog/*\\?(.+)');

  // Por marcacao: `rel=nofollow` (`:278`) e o opt-out por classe, inclusive via
  // elemento pai (`:284`).
  assert.deepEqual(condicoes[2], {
    not: { selector_matches: SELETOR_SEM_SEGUIR },
  });
  assert.equal(SELETOR_SEM_SEGUIR, 'a[rel~="nofollow"]');
  assert.deepEqual(condicoes[3], {
    not: { selector_matches: '.no-prefetch, .no-prefetch a' },
  });
  // Quatro condicoes em `prefetch`, combinadas por `and` (`:264-287`).
  assert.equal(condicoes.length, 4);
});

test('CA-7.2: em `prerender` a classe `.no-prefetch` TAMBEM exclui', () => {
  const declaracao = declararPreBusca({
    contexto: VISITANTE,
    pontosDeExtensao: {
      sobreAConfiguracao: [() => ({ mode: 'prerender', eagerness: 'auto' })],
    },
  });
  const regra = declaracao.conteudo?.['prerender']?.[0];
  assert.ok(regra !== undefined);
  const condicoes = condicoesDa(regra);

  // `:290-296`: *"because it's part of 'prerender'"*. Pre-renderizar implica
  // pre-buscar, logo quem optou por nao ser pre-buscado nao e pre-renderizado.
  // Um porte que montasse so as quatro condicoes especularia links que o legado
  // nao especula.
  assert.equal(condicoes.length, 5);
  assert.deepEqual(condicoes[3], {
    not: { selector_matches: '.no-prerender, .no-prerender a' },
  });
  assert.deepEqual(condicoes[4], {
    not: { selector_matches: '.no-prefetch, .no-prefetch a' },
  });
});

test('CA-7.2: o ponto de extensao acrescenta exclusao e NAO consegue remover as oito', () => {
  const contextos = contextosPadraoDoPrefixador(EM_SUBDIRETORIO);

  // Um interceptador que devolve lista vazia: as oito sobrevivem, porque
  // `array_merge` poe as base primeiro (`:248-260`) e o docblock de `:233-234`
  // declara que elas *"cannot be modified using the filter"*.
  const zerado = declararPreBusca({
    contexto: VISITANTE,
    pontosDeExtensao: { sobreOsCaminhosExcluidos: [() => []] },
  });
  const condicoesZeradas = condicoesDa(
    zerado.conteudo?.['prefetch']?.[0] as RegraDePreBusca,
  );
  assert.deepEqual(condicoesZeradas[1], {
    not: { href_matches: OITO_EXCLUSOES },
  });

  // Um interceptador que acrescenta: o caminho novo entra no fim, prefixado
  // pelo contexto DEFAULT (`home`, `:254`) e nao pelo contexto que o chamador
  // quisesse.
  const comNovo = declararPreBusca({
    contexto: VISITANTE,
    pontosDeExtensao: {
      sobreOsCaminhosExcluidos: [() => ['/carrinho/*', '/checkout/*']],
    },
  });
  const condicoesNovas = condicoesDa(
    comNovo.conteudo?.['prefetch']?.[0] as RegraDePreBusca,
  );
  assert.deepEqual(condicoesNovas[1], {
    not: {
      href_matches: [
        ...OITO_EXCLUSOES,
        '/blog/carrinho/*',
        '/blog/checkout/*',
      ],
    },
  });
  assert.equal(prefixarPadrao(contextos, '/carrinho/*'), '/blog/carrinho/*');
});

test('CA-7.2: o ponto de extensao recebe a lista VAZIA e o modo, e os dois importam', () => {
  const vistos: { caminhos: unknown; modo: string }[] = [];

  declararPreBusca({
    contexto: VISITANTE,
    pontosDeExtensao: {
      sobreOsCaminhosExcluidos: [
        (caminhos, modo) => {
          vistos.push({ caminhos, modo });
          return ['/um/*'];
        },
        (caminhos, modo) => {
          vistos.push({ caminhos, modo });
          return [...(caminhos as readonly string[]), '/dois/*'];
        },
      ],
    },
  });

  // `apply_filters( ..., array(), $mode )` (`:241`): comeca VAZIA — quem
  // estende NAO ve as oito base, e e por isso que nao consegue remove-las —, e
  // cada interceptador recebe o que o anterior devolveu.
  assert.deepEqual(vistos[0], { caminhos: [], modo: 'prefetch' });
  assert.deepEqual(vistos[1], { caminhos: ['/um/*'], modo: 'prefetch' });
});

test('CA-7.2: o que o ponto de extensao devolve e nao e texto desaparece em silencio', () => {
  const declaracao = declararPreBusca({
    contexto: VISITANTE,
    pontosDeExtensao: {
      sobreOsCaminhosExcluidos: [
        () => ['/valido/*', 42, null, undefined, ['/aninhado/*'], '/outro/*'],
      ],
    },
  });
  const condicoes = condicoesDa(
    declaracao.conteudo?.['prefetch']?.[0] as RegraDePreBusca,
  );

  // `array_filter( $href_exclude_paths, 'is_string' )` (`:242`): o que nao e
  // texto sai sem aviso e sem erro — P7, *"preserve o modo de falha, inclusive
  // o silencio"*.
  assert.deepEqual(condicoes[1], {
    not: { href_matches: [...OITO_EXCLUSOES, '/blog/valido/*', '/blog/outro/*'] },
  });
});

test('CA-7.2: caminho repetido entra uma vez so, e a primeira ocorrencia e a que fica', () => {
  const declaracao = declararPreBusca({
    contexto: VISITANTE,
    pontosDeExtensao: {
      // O primeiro repete uma das base; o segundo e novo e duplicado.
      sobreOsCaminhosExcluidos: [
        () => ['/blog/wp-admin/*', '/novo/*', '/novo/*'],
      ],
    },
  });
  const condicoes = condicoesDa(
    declaracao.conteudo?.['prefetch']?.[0] as RegraDePreBusca,
  );

  // `array_unique` (`:249`) — garantia 1 dos tres comentarios numerados de
  // `:244-247`. O `/blog/wp-admin/*` repetido nao reaparece no fim: ele ja
  // estava na posicao 2.
  assert.deepEqual(condicoes[1], {
    not: { href_matches: [...OITO_EXCLUSOES, '/blog/novo/*'] },
  });
});

test('CA-7.2: sem endereco amigavel a exclusao de consulta muda, e so esse ramo muda', () => {
  // 🔴 Este ramo (`:224`) **nao** e alcancavel na instalacao de fabrica: sem
  // enderecos amigaveis a configuracao e ausente e a montagem nem comeca. Ele
  // so roda quando um interceptador forca a configuracao, que e o que este
  // teste faz — e e por isso que ele existe: sem o filtro, o padrao de `nonce`
  // seria codigo que nenhum teste alcanca.
  const semAmigavel: ContextoDaPreBusca = {
    ...VISITANTE,
    configuracaoDoSite: { ...COM_ENDERECO_AMIGAVEL, formaDosEnderecos: '' },
  };
  const declaracao = declararPreBusca({
    contexto: semAmigavel,
    pontosDeExtensao: { sobreAConfiguracao: [() => ({ mode: 'auto' })] },
  });
  const condicoes = condicoesDa(
    declaracao.conteudo?.['prefetch']?.[0] as RegraDePreBusca,
  );
  const excluidos = condicoes[1];
  assert.ok(excluidos !== undefined && 'not' in excluidos);
  assert.ok('href_matches' in excluidos.not);
  const lista = excluidos.not.href_matches;
  assert.ok(Array.isArray(lista));

  // Os sete primeiros sao os mesmos; so o oitavo troca.
  assert.deepEqual(lista.slice(0, 7), OITO_EXCLUSOES.slice(0, 7));
  assert.equal(lista[7], '/blog/*\\?*(^|&)*nonce*=*');
  // ⚠️ Casa por subcadeia: um parametro `announce` tambem casaria. Exclui a
  // mais, nunca a menos — e e comportamento, nao defeito a corrigir (P1).
  assert.ok((lista[7] as string).includes('nonce'));
});

// ---------------------------------------------------------------------------
// CA-7.3 — desligavel, e desligada nao aparece
// ---------------------------------------------------------------------------

test('CA-7.3: na instalacao de fabrica a declaracao nao aparece na pagina', () => {
  // 🔴 O achado de T015. `permalink_structure` nasce em texto vazio
  // (`wp-admin/includes/schema.php:443`), e `:28` o testa pela verdade do
  // interpretador: texto vazio e falso. Logo a configuracao e `null` e
  // `wp_print_speculation_rules()` retorna em `:333` sem imprimir NADA.
  const declaracao = declararPreBusca();

  assert.equal(declaracao.emitida, false);
  assert.equal(declaracao.conteudo, undefined);
  // ⚠️ A declaracao nao aparece **vazia**: nao aparece. Um porte que emitisse
  // `<script type="speculationrules">[]</script>` mudaria o HTML servido por
  // toda instalacao nova.
  assert.deepEqual(declaracao.atributos, {});
  assert.equal(regrasDePreBusca(), undefined);
});

test('CA-7.3: quem esta autenticado nao recebe a declaracao, mesmo com endereco amigavel', () => {
  const declaracao = declararPreBusca({
    contexto: { ...VISITANTE, alguemAutenticado: true },
  });

  // `! is_user_logged_in() && get_option( 'permalink_structure' )` (`:28`): sao
  // dois casos, e o comentario de `:27` declara os dois. Quem esta autenticado
  // ve pagina personalizada e link de acao.
  assert.equal(declaracao.emitida, false);
  assert.equal(declaracao.conteudo, undefined);
});

test('CA-7.3: o ponto de extensao desliga a declaracao com `null`, e so com `null`', () => {
  const desligada = declararPreBusca({
    contexto: VISITANTE,
    pontosDeExtensao: { sobreAConfiguracao: [() => null] },
  });
  assert.equal(desligada.emitida, false);

  // ⚠️ `if ( null === $config )` (`:65`) e teste de IDENTIDADE: `false`, zero e
  // texto vazio NAO desligam — eles caem no ramo de `:74-79`, que devolve o
  // default inteiro. Um porte que testasse a verdade do valor desligaria a
  // pre-busca em quatro casos em que o legado a mantem.
  for (const valor of [false, 0, '', 'auto']) {
    const mantida = declararPreBusca({
      contexto: VISITANTE,
      pontosDeExtensao: { sobreAConfiguracao: [() => valor] },
    });
    assert.equal(
      mantida.emitida,
      true,
      `o valor ${JSON.stringify(valor)} desligou a declaracao`,
    );
    assert.equal(mantida.conteudo?.['prefetch']?.[0]?.eagerness, 'conservative');
  }
});

test('CA-7.3: desligar e religar nao deixa rastro entre duas declaracoes', () => {
  const primeira = declararPreBusca({ contexto: VISITANTE });
  const desligada = declararPreBusca({
    contexto: VISITANTE,
    pontosDeExtensao: { sobreAConfiguracao: [() => null] },
  });
  const segunda = declararPreBusca({ contexto: VISITANTE });

  assert.equal(primeira.emitida, true);
  assert.equal(desligada.emitida, false);
  assert.deepEqual(segunda.conteudo, primeira.conteudo);
});

// ---------------------------------------------------------------------------
// A configuracao: `'auto'` como sentinela e a sobreposicao do hospedeiro
// ---------------------------------------------------------------------------

test("o ponto de extensao recebe `'auto'` nos dois campos, e o `'auto'` e resolvido DEPOIS", () => {
  const vistos: unknown[] = [];

  const declaracao = declararPreBusca({
    contexto: VISITANTE,
    pontosDeExtensao: {
      sobreAConfiguracao: [
        (configuracao) => {
          vistos.push(configuracao);
          return configuracao;
        },
      ],
    },
  });

  // `:29-32` e `:62`: o filtro ve o sentinela, nao o valor resolvido. O docblock
  // de `:106-110` declara o que essa ordem compra — quem estende tem
  // precedencia sobre quem hospeda. Resolver o `'auto'` antes do filtro, que e
  // o arranjo que parece mais simples, inverteria a precedencia.
  assert.deepEqual(vistos, [{ mode: 'auto', eagerness: 'auto' }]);
  assert.equal(declaracao.conteudo?.['prefetch']?.[0]?.eagerness, 'conservative');
});

test('o hospedeiro muda o default por variavel de ambiente, e a constante vence o ambiente', () => {
  const soAmbiente = configuracaoDeFabricaDaPreBusca(
    (nome) =>
      nome === 'WP_SPECULATIVE_LOADING_DEFAULT_MODE' ? 'prerender' : undefined,
    () => undefined,
  );
  assert.deepEqual(soAmbiente, { modo: 'prerender', agressividade: 'conservative' });

  const comConstante = configuracaoDeFabricaDaPreBusca(
    () => 'prerender',
    (nome) =>
      nome === 'WP_SPECULATIVE_LOADING_DEFAULT_MODE' ? 'prefetch' : undefined,
  );
  // `:150`: *"The constant takes precedence over the environment variable,
  // consistent with `wp_get_environment_type()`"*.
  assert.equal(comConstante.modo, 'prefetch');
});

test('constante que nao e texto NAO sobrepoe o ambiente: ela e ignorada', () => {
  const configuracao = configuracaoDeFabricaDaPreBusca(
    () => 'prerender',
    () => 123,
  );

  // `if ( is_string( $has_constant ) )` (`:172`): a constante com numero nao
  // substitui o valor, e o do ambiente SOBREVIVE. Um porte que escrevesse
  // "constante definida vence" perderia `prerender` aqui.
  assert.equal(configuracao.modo, 'prerender');
});

test('valor sobreposto invalido cai no default do nucleo, sem erro', () => {
  const configuracao = configuracaoDeFabricaDaPreBusca(
    () => 'turbo',
    () => undefined,
  );

  // `if ( WP_Speculation_Rules::is_valid_mode( $mode ) )` (`:127`): invalido nao
  // e rejeitado com erro, e simplesmente nao aplicado.
  assert.deepEqual(configuracao, {
    modo: 'prefetch',
    agressividade: 'conservative',
  });
});

test("`'immediate'` e recusada nos dois pontos: no filtro e no default do hospedeiro", () => {
  // Ponto 1 — o saneamento da configuracao (`:92`).
  const pedidaPeloFiltro = configuracaoDaPreBusca(
    {
      alguemAutenticado: false,
      formaDosEnderecos: '/%postname%/',
      variavelDeAmbiente: () => undefined,
      constante: () => undefined,
    },
    [() => ({ mode: 'prefetch', eagerness: 'immediate' })],
  );
  assert.equal(pedidaPeloFiltro?.agressividade, 'conservative');

  // Ponto 2 — o default do hospedeiro (`:136`). A regra vale nos DOIS pontos,
  // nao em um so, e os dois comentarios do legado sao iguais: *"'immediate' is
  // a valid eagerness, but for safety WordPress does not allow it for
  // document-level rules."*
  const pedidaPeloHospedeiro = configuracaoDeFabricaDaPreBusca(
    (nome) =>
      nome === 'WP_SPECULATIVE_LOADING_DEFAULT_EAGERNESS'
        ? 'immediate'
        : undefined,
    () => undefined,
  );
  assert.equal(pedidaPeloHospedeiro.agressividade, 'conservative');

  // E `'eager'`, que e valida e nao proibida, passa pelos dois.
  const permitida = configuracaoDeFabricaDaPreBusca(
    () => 'eager',
    () => undefined,
  );
  assert.equal(permitida.agressividade, 'eager');
});

test('configuracao que nao e estrutura vira o default INTEIRO, campo a campo', () => {
  for (const valor of ['prerender', 7, true]) {
    const configuracao = configuracaoDaPreBusca(
      {
        alguemAutenticado: false,
        formaDosEnderecos: '/%postname%/',
        variavelDeAmbiente: () => undefined,
        constante: () => undefined,
      },
      [() => valor],
    );

    // `if ( ! is_array( $config ) ) { return <defaults>; }` (`:74-79`). A
    // analise marca o caso 🟡: *"um filtro que devolva uma string nao gera erro
    // — o modulo segue com `prefetch`/`conservative`"*.
    assert.deepEqual(configuracao, {
      modo: 'prefetch',
      agressividade: 'conservative',
    });
  }
});

test('campo nulo e campo ausente valem o mesmo, e os dois caem no default', () => {
  const leitura = {
    alguemAutenticado: false,
    formaDosEnderecos: '/%postname%/',
    variavelDeAmbiente: () => 'prerender',
    constante: () => undefined,
  };

  // `isset( $config['mode'] )` (`:81`) e falso para chave ausente E para valor
  // nulo: os dois caem no default, que aqui o ambiente mudou para `prerender`.
  assert.equal(
    configuracaoDaPreBusca(leitura, [() => ({ eagerness: 'moderate' })])?.modo,
    'prerender',
  );
  assert.equal(
    configuracaoDaPreBusca(leitura, [() => ({ mode: null })])?.modo,
    'prerender',
  );
  // E um valor explicito vence o default do hospedeiro, que e a promessa do
  // docblock de `:106-110`.
  assert.equal(
    configuracaoDaPreBusca(leitura, [() => ({ mode: 'prefetch' })])?.modo,
    'prefetch',
  );
});

// ---------------------------------------------------------------------------
// `WP_Speculation_Rules`: o coletor e as dez recusas
// ---------------------------------------------------------------------------

test('o ponto `wp_load_speculation_rules` recebe a regra do nucleo ja dentro e acrescenta a sua (P2)', () => {
  const declaracao = declararPreBusca({
    contexto: VISITANTE,
    pontosDeExtensao: {
      aoCarregarAsRegras: [
        (regras) => {
          // `:317` dispara DEPOIS de `add_rule` (`:298-308`): quem estende
          // encontra `main` ja registrada.
          assert.equal(regras.temRegra('prefetch', 'main'), true);
          assert.equal(
            regras.adicionarRegra('prerender', 'loja', {
              source: 'list',
              urls: ['/blog/loja/'],
              eagerness: 'immediate',
            }),
            true,
          );
        },
      ],
    },
  });

  // O interceptador alterou o resultado, que e o que o P2 cobra. E a
  // agressividade `'immediate'` foi ACEITA, porque a proibicao e so para regra
  // de documento (`:193-204`, `isset( $rule['where'] )`).
  assert.deepEqual(Object.keys(declaracao.conteudo ?? {}), [
    'prefetch',
    'prerender',
  ]);
  assert.deepEqual(declaracao.conteudo?.['prerender'], [
    { source: 'list', urls: ['/blog/loja/'], eagerness: 'immediate' },
  ]);
  assert.deepEqual(declaracao.recusas, []);
});

test('as dez recusas de `adicionarRegra` devolvem falso e nao lancam', () => {
  const recusadas: { readonly resultado: boolean }[] = [];

  const declaracao = declararPreBusca({
    contexto: VISITANTE,
    pontosDeExtensao: {
      aoCarregarAsRegras: [
        (regras) => {
          for (const tentativa of [
            // `:74-85` — modo fora da lista.
            () => regras.adicionarRegra('preload', 'x1', { urls: ['/a'] }),
            // `:87-98` — um caractere so nao passa pelo `+` da expressao.
            () => regras.adicionarRegra('prefetch', 'a', { urls: ['/a'] }),
            // `:100-111` — `main` ja existe.
            () =>
              regras.adicionarRegra('prefetch', 'main', { urls: ['/a'] }),
            // `:119-134` — nenhum dos dois campos.
            () => regras.adicionarRegra('prefetch', 'x2', {}),
            // `:119-134` — os dois campos juntos, mesma mensagem.
            () =>
              regras.adicionarRegra('prefetch', 'x3', {
                where: { href_matches: '/a' },
                urls: ['/a'],
              }),
            // `:136-147` — fonte fora da lista.
            () =>
              regras.adicionarRegra('prefetch', 'x4', {
                source: 'tabela',
                urls: ['/a'],
              }),
            // `:149-161` — fonte `list` com `where`.
            () =>
              regras.adicionarRegra('prefetch', 'x5', {
                source: 'list',
                where: { href_matches: '/a' },
              }),
            // `:163-175` — fonte `document` com `urls`.
            () =>
              regras.adicionarRegra('prefetch', 'x6', {
                source: 'document',
                urls: ['/a'],
              }),
            // `:180-191` — agressividade fora da lista.
            () =>
              regras.adicionarRegra('prefetch', 'x7', {
                urls: ['/a'],
                eagerness: 'turbo',
              }),
            // `:193-204` — `'immediate'` em regra de documento.
            () =>
              regras.adicionarRegra('prefetch', 'x8', {
                where: { href_matches: '/a' },
                eagerness: 'immediate',
              }),
          ]) {
            recusadas.push({ resultado: tentativa() });
          }
        },
      ],
    },
  });

  // `add_rule()` **nunca lanca**: toda recusa e `false` mais um
  // `_doing_it_wrong()`. O aviso e da plataforma; a recusa, que e o observavel,
  // esta aqui.
  assert.deepEqual(
    recusadas.map((r) => r.resultado),
    Array.from({ length: 10 }, () => false),
  );
  assert.deepEqual(
    declaracao.recusas.map((recusa) => recusa.motivo),
    [
      'modo-invalido',
      'identificador-invalido',
      'identificador-repetido',
      'where-ou-urls',
      'where-ou-urls',
      'fonte-invalida',
      'lista-com-where',
      'documento-com-urls',
      'agressividade-invalida',
      'imediato-no-documento',
    ],
  );
  // E nenhuma delas entrou: a declaracao continua com a regra do nucleo so.
  assert.deepEqual(Object.keys(declaracao.conteudo ?? {}), ['prefetch']);
  assert.equal(declaracao.conteudo?.['prefetch']?.length, 1);
});

test('⚠️ identificador de um caractere e invalido, e quebra de linha no fim e valida', () => {
  // `/^[a-z][a-z0-9_-]+$/` (`class-wp-speculation-rules.php:255`), com `+` e
  // nao `*`: dois caracteres no minimo.
  assert.equal(identificadorDeRegraValido('main'), true);
  assert.equal(identificadorDeRegraValido('a'), false);
  assert.equal(identificadorDeRegraValido('A1'), false);
  assert.equal(identificadorDeRegraValido('1a'), false);
  assert.equal(identificadorDeRegraValido('a_b-c9'), true);

  // ⚠️ O `$` do dialeto do legado casa no fim do texto OU imediatamente antes
  // de uma quebra de linha final: `"main\n"` e identificador valido e entra na
  // estrutura com a quebra dentro. Duas quebras nao passam.
  assert.equal(identificadorDeRegraValido('main\n'), true);
  assert.equal(identificadorDeRegraValido('main\n\n'), false);
  assert.equal(identificadorDeRegraValido('ma\nin'), false);
});

test('a regra de terceiro atravessa com os campos que o nucleo nao conhece', () => {
  const declaracao = declararPreBusca({
    contexto: VISITANTE,
    pontosDeExtensao: {
      aoCarregarAsRegras: [
        (regras) => {
          regras.adicionarRegra('prefetch', 'extra', {
            source: 'list',
            urls: ['/blog/promo/'],
            relative_to: 'document',
          });
        },
      ],
    },
  });

  // `add_rule()` olha quatro campos e **nada mais** (`:119-205`): campo que o
  // nucleo nao conhece entra intacto e chega ao navegador. E os identificadores
  // saem na serializacao (`:237-240`), logo `'extra'` nao aparece no valor.
  assert.deepEqual(declaracao.conteudo?.['prefetch']?.[1], {
    source: 'list',
    urls: ['/blog/promo/'],
    relative_to: 'document',
  });
});

// ---------------------------------------------------------------------------
// `WP_URL_Pattern_Prefixer`: o prefixo, o escape e a troca de nomes
// ---------------------------------------------------------------------------

test('🔴 `template` e `stylesheet` estao trocados no legado, e o porte os mantem trocados', () => {
  const contextos = contextosPadraoDoPrefixador(EM_SUBDIRETORIO);

  // `get_default_contexts()` mapeia `'template'` para
  // `get_stylesheet_directory_uri()` e `'stylesheet'` para
  // `get_template_directory_uri()` (`class-wp-url-pattern-prefixer.php:118-119`)
  // — ao contrario do que cada nome diz. Num tema filho isso e observavel, e o
  // P1 manda reproduzir "inclusive quando ele parecer defeito". Os dois nomes
  // sao argumento de funcao publicada, e trocar o mapeamento cai na tabela *Nao
  // negociavel*.
  assert.equal(
    prefixarPadrao(contextos, '/*', 'template'),
    '/blog/wp-content/themes/filho/*',
  );
  assert.equal(
    prefixarPadrao(contextos, '/*', 'stylesheet'),
    '/blog/wp-content/themes/pai/*',
  );
  // ⚠️ A lista final de exclusao nao muda por causa da troca: os dois entram
  // lado a lado em `:212-213`. A troca so aparece para quem chame com um dos
  // dois nomes.
  assert.ok(OITO_EXCLUSOES.includes('/blog/wp-content/themes/filho/*'));
  assert.ok(OITO_EXCLUSOES.includes('/blog/wp-content/themes/pai/*'));
});

test('contexto que nao existe devolve o padrao INTACTO, sem prefixo e sem erro', () => {
  const contextos = contextosPadraoDoPrefixador(EM_SUBDIRETORIO);

  // `:66-79`: aviso de uso indevido e `return $path_pattern`. ⚠️ A consequencia
  // e silenciosa e grave num subdiretorio — o padrao sem prefixo casa o caminho
  // errado —, e e comportamento (P7).
  assert.equal(prefixarPadrao(contextos, '/*', 'tema'), '/*');
  assert.equal(prefixarPadrao(contextos, '/wp-admin/*', ''), '/wp-admin/*');
});

test('os nove caracteres com significado no padrao recebem barra invertida', () => {
  // `addcslashes( $str, '+*?:{}()\\' )` (`:133`).
  assert.equal(escaparPadrao('a+b*c?d:e{f}g(h)i'), 'a\\+b\\*c\\?d\\:e\\{f\\}g\\(h\\)i');
  assert.equal(escaparPadrao('a\\b'), 'a\\\\b');
  assert.equal(escaparPadrao('/wp-content/'), '/wp-content/');

  const comParenteses = contextosPadraoDoPrefixador({
    ...CAMINHOS_SEM_PATH,
    home: '/x(y)',
  });
  assert.equal(prefixarPadrao(comParenteses, '/*'), '/x\\(y\\)/*');
});

test("caminho de contexto com `:`, `?` ou `#` entra entre chaves, sem a barra final", () => {
  const comDoisPontos = contextosPadraoDoPrefixador({
    ...CAMINHOS_SEM_PATH,
    home: '/a:b',
  });

  // `:87-91`: o caminho vai para `{...}/`, com `substr( ..., 0, -1 )` tirando a
  // barra do fim antes das chaves — *"The final forward slash ... affects the
  // meaning of the * wildcard, so is left outside the braces"* (`:84-85`).
  // ⚠️ E o teste corre no caminho JA escapado, logo o `:` continua ali atras da
  // barra invertida e continua acusando.
  assert.equal(prefixarPadrao(comDoisPontos, '/*'), '{/a\\:b}/*');
});

test('⚠️ o padrao que ja comeca pelo caminho do contexto nao e prefixado duas vezes — se estiver escapado', () => {
  const contextos = contextosPadraoDoPrefixador({
    ...CAMINHOS_SEM_PATH,
    home: '/x(y)',
  });

  // `str_starts_with( $path_pattern, $context_path )` (`:97`) compara contra o
  // caminho **ja escapado**. Com o padrao escapado, o prefixo e removido e
  // recolocado:
  assert.equal(prefixarPadrao(contextos, '/x\\(y\\)/*'), '/x\\(y\\)/*');
  // Com o padrao CRU, a comparacao falha e o prefixo entra de novo. E o quirk,
  // e esta reproduzido.
  assert.equal(prefixarPadrao(contextos, '/x(y)/*'), '/x\\(y\\)/x(y)/*');
});

test('enderecos sem caminho dao o site na raiz, e o padrao sai sem prefixo', () => {
  const contextos = contextosPadraoDoPrefixador(CAMINHOS_SEM_PATH);

  // `(string) wp_parse_url( ..., PHP_URL_PATH )` de endereco sem caminho e
  // texto vazio, e `trailingslashit( '' )` e `'/'`. Nao e "o valor de fabrica":
  // e o estado total do codigo.
  assert.equal(prefixarPadrao(contextos, '/wp-admin/*', 'site'), '/wp-admin/*');
  assert.equal(prefixarPadrao(contextos, '/*'), '/*');
});

// ---------------------------------------------------------------------------
// As invariantes do modulo
// ---------------------------------------------------------------------------

test('a declaracao nao toca a porta de dados, nem ao compor nem ao declarar', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());

  // A porta lanca se for tocada. `speculative-loading.php` consulta opcao e
  // identidade, e as duas chegam no contexto: o banco e do repositorio, que nao
  // entra aqui.
  const declaracao = modulo.declararPreBusca({ contexto: VISITANTE });

  assert.equal(declaracao.emitida, true);
});

test('duas declaracoes concorrentes nao se enxergam (EXT-CONTEXTO, BR-MIGRAR-105)', () => {
  const moduloA = criarModuloDeLeituraPublica(portasDeTeste());
  const moduloB = criarModuloDeLeituraPublica(portasDeTeste());

  const naRaiz: ContextoDaPreBusca = {
    alguemAutenticado: false,
    configuracaoDoSite: COM_ENDERECO_AMIGAVEL,
    caminhosDaInstalacao: CAMINHOS_SEM_PATH,
  };

  const deA = moduloA.declararPreBusca({ contexto: VISITANTE });
  const deB = moduloB.declararPreBusca({ contexto: naRaiz });

  // Numa rede o prefixo de cada site e diferente, e a declaracao e o que o
  // navegador vai buscar sozinho: um vazamento aqui faria o visitante de um
  // site pre-buscar enderecos do outro.
  const excluidosDeA = condicoesDa(
    deA.conteudo?.['prefetch']?.[0] as RegraDePreBusca,
  )[1];
  const excluidosDeB = condicoesDa(
    deB.conteudo?.['prefetch']?.[0] as RegraDePreBusca,
  )[1];
  assert.deepEqual(excluidosDeA, { not: { href_matches: OITO_EXCLUSOES } });
  assert.notDeepEqual(excluidosDeB, excluidosDeA);
  assert.deepEqual(excluidosDeB, {
    not: {
      href_matches: [
        '/wp-*.php',
        '/wp-admin/*',
        '/*',
        '/*\\?(.+)',
      ],
    },
  });
});

test('a declaracao nao le o relogio e nao declara prazo nenhum (P6)', () => {
  const declaracao = declararPreBusca({ contexto: VISITANTE });
  const regra = declaracao.conteudo?.['prefetch']?.[0];
  assert.ok(regra !== undefined);

  // `speculative-loading.php` nao le o tempo em nenhuma das suas 343 linhas, e
  // a pos-condicao de UC-01 e "nada muda no armazenamento". Nenhum campo da
  // regra e prazo, contagem ou limite: a tabela *Nao negociavel* poe
  // "introduzir limite de taxa, prazo de retencao ou qualquer numero que o
  // legado nao tem" entre o que exige humano.
  assert.deepEqual(Object.keys(regra).sort(), [
    'eagerness',
    'source',
    'where',
  ]);
});
