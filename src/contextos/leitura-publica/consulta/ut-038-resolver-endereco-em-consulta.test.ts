/**
 * A entrega de **T004**: *"5 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-038-1, UT-038-2, UT-038-3, UT-038-4,
 * UT-038-5), com o mesmo dado de entrada, acao e resultado esperado."*
 *
 * ✅ **O catalogo EXISTE nesta arvore, e os cinco casos foram COPIADOS dele, nao
 * reconstruidos.** A tabela de `REQ-038` em `backlog/tests.md:596-606` —
 * *"`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite
 * cobertos"* — da os cinco casos com nome, tipo e prova, e e ela que esta
 * transcrita abaixo, em ordem de catalogo, com o nome do caso dentro do nome do
 * teste:
 *
 * | caso | tipo | nome no catalogo | prova que o catalogo cita | CA |
 * |---|---|---|---|---|
 * | `UT-038-1` | `feliz` | traduz o endereco amigavel em criterios de consulta pelas regras declaradas | *"Um endereço amigável é traduzido em critérios de consulta por um conjunto de regras declaradas"* | CA-1.1 |
 * | `UT-038-2` | `erro` | recusa inventar criterio para endereco que nao casa com nenhuma regra | a **mesma** frase de UT-038-1 | CA-1.1 |
 * | `UT-038-3` | `feliz` | produz o mesmo resultado com os criterios informados diretamente | *"Os mesmos critérios podem ser informados diretamente, sem endereço amigável, e produzem o mesmo resultado"* | CA-1.2 |
 * | `UT-038-4` | `feliz` | preserva o conteudo gravado ao trocar a forma dos enderecos amigaveis | *"Alterar a forma dos endereços amigáveis não exige alterar o conteúdo gravado"* | CA-1.3 |
 * | `UT-038-5` | `borda` | distingue na resposta o endereco de um conteudo do endereco de uma listagem | *"Endereço que resolve para um único conteúdo e endereço que resolve para uma listagem são distinguíveis pela resposta"* | CA-1.4 |
 *
 * **UT-038-2 carrega um caso que nao e do proprio card, e isso vem escrito.** O
 * achado de QA de `REQ-081` (`backlog/tests.md:1198`) e literal: *"AC3 (a
 * ausência do endereço cai na resposta de endereço inexistente, sem erro de
 * servidor) vale para todas as superfícies descartadas do backlog e é provado
 * uma vez, em REQ-038 (UT-038-2) e REQ-042"*. Logo aquele teste afirma duas
 * coisas: que nenhum criterio e inventado, e que a saida e a resposta de
 * endereco inexistente — **nao** um erro de servidor.
 *
 * ---
 *
 * # O que o catalogo NAO da, e de onde veio
 *
 * O catalogo registra nome, tipo e prova de cada caso, e **nao** o dado de
 * entrada literal — nenhum dos 985 casos o registra, porque *"nenhum deles cita
 * arquivo, classe ou framework: a stack do sistema novo ainda não foi
 * escolhida"* (`backlog/tests.md:5`). O dado de entrada daqui sai de duas
 * fontes, e de nenhuma outra:
 *
 * 1. **UC-01** (`.specify/use-cases/UC-01-consultar-conteudo-publicado.md`), que
 *    a tabela de rastreabilidade de `spec.md` liga a US-1 (*"US-1 | REQ-038 ·
 *    UC-01"*). Dele vem o gatilho — *"requisição HTTP a qualquer URL do site que
 *    não seja do painel"* —, o passo 2 do fluxo — *"Sistema resolve a URL em
 *    variáveis de consulta pelas regras de reescrita"* — e as duas
 *    pos-condicoes que sao o **resultado esperado** de UT-038-4: *"nada muda no
 *    armazenamento"* e *"o contador de visualizações não existe: o sistema não
 *    registra a leitura em lugar algum"*.
 * 2. **A tabela de regras do legado para a forma
 *    `/%year%/%monthnum%/%postname%/`**, transcrita em
 *    {@link REGRAS_DA_FORMA_POR_DATA} a partir de
 *    `wp-includes/class-wp-rewrite.php:281-334` (os tres arranjos que traduzem
 *    marca em padrao e em nome de criterio) e de `:1455`/`:1457` (a ordem em que
 *    os grupos entram na tabela). Nenhum padrao desta suite foi inventado: cada
 *    um e o que aquelas tres listas produzem.
 *
 * Nenhuma assercao daqui afirma comportamento que nao esteja na coluna *Prova*
 * do caso ou numa dessas duas fontes.
 *
 * ---
 *
 * # Nao e a suite de T003, e o nivel e outro
 *
 * `./us-1-resolver-endereco-em-consulta.test.ts` e a suite da **entrega** de
 * T003: ela afirma os quatro critarios de aceite, os tres ramos de excecao de
 * `handle_404` e os tres pontos de extensao novos, chamando tambem as operacoes
 * intermediarias — `resolverEndereco`, `consultarConteudo`, `consultarConteudo`
 * direto com criterios — e o cabecalho dela ja declara a fronteira: *"os cinco
 * casos `UT-038-1` a `UT-038-5` de `backlog/tests.md` sao de **T004**, a tarefa
 * `[P]`, e nenhum deles e afirmado aqui"*.
 *
 * Esta e a suite do **catalogo**, e ela entra por outro lugar:
 *
 * | | T003 (`us-1-…`) | T004 (este arquivo) |
 * |---|---|---|
 * | entrada | a etapa que o critario descreve, uma por uma | **so** `atender`, que e o `WP::main()` que toda visita executa (UC-01, gatilho) |
 * | a tabela de regras | uma regra sintetica por criterio | as **quatro** regras que a forma `/%year%/%monthnum%/%postname%/` gera, na ordem do legado |
 * | a porta de dados | **lanca** se for tocada | **registra comando**, e a assercao e o log vazio |
 *
 * A porta que registra em vez de lancar nao e conveniencia: e o unico jeito de
 * afirmar a pos-condicao de UC-01 como **resultado**, e nao como ausencia de
 * excecao. Uma porta que lanca prova que o modulo nao escreveu; uma porta que
 * registra prova **o que** ele pediu, e e isso que UT-038-4 cobra ao dizer
 * *"preserva o conteúdo gravado"*. E a area 3 do criterio de paridade da Decisao
 * 2 (`parity_specs.md`) — *"esquema e efeito de escrita no banco · zero
 * divergencia"* —, aqui no caso em que o efeito e **nenhum**.
 *
 * O cenario de paridade que cobre esta superficie e `PT-011`
 * (`.specify/migration/parity_tests/11-contratos-de-leitura-de-terceiro.feature`),
 * que declara `casos_de_uso: UC-01, UC-44, UC-45, UC-47`; o cenario *"A URL
 * pública é preservada, inclusive a forma do permalink"* e o par de UT-038-1 e
 * UT-038-4 no nivel de integracao.
 *
 * ---
 *
 * # Onde esta suite PARA, e por que isso nao e lacuna
 *
 * - **Nada aqui mede byte de resposta HTTP.** UT-038-5 fala da *resposta*, e o
 *   que esta arvore tem de resposta sao os tres campos de `RespostaDaLeitura`
 *   mais os predicados da consulta: a etapa 5 (`register_globals`) e T005 e a
 *   etapa 6 (envio de cabecalhos) e borda HTTP, fora desta feature. O byte e do
 *   `PT-011`, que pede o oraculo executavel (T001 da feature `015`).
 * - **O portao de `post_status` nao entra em nenhum destes cinco.** Ele e T009
 *   (US-4) e tem catalogo proprio, `UT-041-1` a `UT-041-5`. Os conteudos daqui
 *   chegam do repositorio sem estado declarado de proposito: o recorte por
 *   estado acontece **dentro** do repositorio, e inventa-lo aqui seria afirmar
 *   T009 na tarefa de T004.
 * - **Nenhum ponto de extensao e exercitado.** Os dez pontos que o fluxo
 *   atravessa estao afirmados nas suites de T002 e T003; o catalogo de `REQ-038`
 *   nao tem caso sobre eles.
 *
 * ⚠️ **Nada externo entra nestes testes.** A porta de dados, o repositorio de
 * conteudo e a fonte de regras sao duplos que **registram chamada**; nao ha
 * banco, rede, relogio nem navegador.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CONFIGURACAO_DE_FABRICA,
  consultaDeListagem,
  consultaSingular,
  criarModuloDeLeituraPublica,
  fonteFixaDeRegras,
  tabelaDeRegras,
  type ConfiguracaoDoSiteNaConsulta,
  type ConsultaDeConteudo,
  type ContextoDaConsulta,
  type ConteudoConsultado,
  type CriteriosDaConsulta,
  type FonteDeRegrasDeTraducao,
  type PortasDeLeituraPublica,
  type RegraDeTraducao,
  type TiposDeConsulta,
} from '../index.js';

// ---------------------------------------------------------------------------
// O dado de entrada, pela segunda fonte do cabecalho
// ---------------------------------------------------------------------------

/**
 * A forma de endereco do exemplo — `get_option( 'permalink_structure' )`.
 *
 * ⚠️ **Nao e o valor de fabrica**, que e texto vazio
 * (`wp-admin/includes/schema.php:443`, com `rewrite_rules` tambem vazio em
 * `:444`): numa instalacao nova de site unico nao existe regra nenhuma e todo
 * criterio vem dos parametros da requisicao. Uma forma declarada e a premissa
 * dos cinco casos — sem ela nao ha "endereco amigavel" para traduzir — e e
 * tambem o default de instalacao em rede (`schema.php:576`).
 */
const FORMA_POR_DATA = '/%year%/%monthnum%/%postname%/';

/** A mesma forma, movida para baixo de um prefixo — o dado de UT-038-4. */
const FORMA_SOB_ARQUIVO = '/arquivo/%year%/%monthnum%/%postname%/';

/**
 * A regra de arquivo do dia.
 *
 * `%year%` vira `([0-9]{4})`, `%monthnum%` e `%day%` viram `([0-9]{1,2})` e os
 * tres viram `year=`, `monthnum=` e `day=`
 * (`class-wp-rewrite.php:281-293` e `:322-334`). A cadeia de consulta sai na
 * forma `tagname=$matches[i]`, que o proprio legado comenta em `:920-922`.
 */
const REGRA_DO_DIA: RegraDeTraducao = {
  padrao: '([0-9]{4})/([0-9]{1,2})/([0-9]{1,2})/?$',
  consulta: 'index.php?year=$matches[1]&monthnum=$matches[2]&day=$matches[3]',
};

/** A regra de arquivo do mes. */
const REGRA_DO_MES: RegraDeTraducao = {
  padrao: '([0-9]{4})/([0-9]{1,2})/?$',
  consulta: 'index.php?year=$matches[1]&monthnum=$matches[2]',
};

/** A regra de arquivo do ano. */
const REGRA_DO_ANO: RegraDeTraducao = {
  padrao: '([0-9]{4})/?$',
  consulta: 'index.php?year=$matches[1]',
};

/** A regra do conteudo: `%postname%` vira `([^/]+)` e `name=`. */
const REGRA_DO_CONTEUDO: RegraDeTraducao = {
  padrao: '([0-9]{4})/([0-9]{1,2})/([^/]+)/?$',
  consulta: 'index.php?year=$matches[1]&monthnum=$matches[2]&name=$matches[3]',
};

/**
 * As quatro regras da forma `/%year%/%monthnum%/%postname%/`, **na ordem em que
 * o legado as monta**.
 *
 * `rewrite_rules()` concatena os grupos numa unica chamada, e nas duas
 * montagens o grupo de **data** vem antes do grupo de **conteudo**
 * (`class-wp-rewrite.php:1455` e `:1457`: `…, $author_rewrite, $date_rewrite,
 * $page_rewrite, $post_rewrite, …` e `…, $date_rewrite, $post_rewrite,
 * $page_rewrite, …`). A unica diferenca entre as duas e a posicao relativa de
 * pagina e conteudo, que esta forma nao exercita.
 *
 * ⚠️ **A ordem decide o significado do endereco**, e e por isso que ela e dado
 * e nao detalhe: `/2026/10/11/` casa a regra do dia **e** a do conteudo, e quem
 * desempata e quem foi declarado primeiro (`class-wp.php:261-263`, *"Got a
 * match"* seguido de `break`). UT-038-1 afirma as duas leituras.
 */
const REGRAS_DA_FORMA_POR_DATA: readonly RegraDeTraducao[] = [
  REGRA_DO_DIA,
  REGRA_DO_MES,
  REGRA_DO_ANO,
  REGRA_DO_CONTEUDO,
];

/** As mesmas quatro regras sob um prefixo de caminho — o dado de UT-038-4. */
function regrasComPrefixo(prefixo: string): readonly RegraDeTraducao[] {
  return REGRAS_DA_FORMA_POR_DATA.map((regra) => ({
    ...regra,
    padrao: `${prefixo}${regra.padrao}`,
  }));
}

/** A configuracao de fabrica com a forma dos enderecos trocada. */
function configuracaoCom(forma: string): ConfiguracaoDoSiteNaConsulta {
  return { ...CONFIGURACAO_DE_FABRICA, formaDosEnderecos: forma };
}

// ---------------------------------------------------------------------------
// Os duplos: todos registram comando
// ---------------------------------------------------------------------------

/**
 * A porta de dados que **registra** em vez de simular banco.
 *
 * Nenhum dos cinco casos a usa, e e esse o ponto: o log vazio e a pos-condicao
 * de UC-01 — *"nada muda no armazenamento"* — afirmada como resultado.
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

/** Um conteudo gravado, nos cinco campos que a leitura publica le. */
function conteudo(
  parcial: Partial<ConteudoConsultado> & { readonly id: number },
): ConteudoConsultado {
  return {
    identificadorNaUrl: 'ola-mundo',
    tipo: 'post',
    corpo: 'o corpo gravado',
    data: '2026-10-11 09:00:00',
    ...parcial,
  };
}

/** O que um duplo de repositorio devolve a quem o declarou. */
interface RepositorioDeTeste {
  readonly repositorio: NonNullable<ContextoDaConsulta['repositorio']>;
  readonly pedidos: {
    criterios: CriteriosDaConsulta;
    tipos: TiposDeConsulta;
  }[];
}

/**
 * O duplo do repositorio: registra o comando que recebeu e devolve as linhas
 * **na ordem em que as recebeu**.
 *
 * Nao reordena, nao filtra e nao copia: `WP_Query::$posts` e *"a ordem em que o
 * repositorio os devolveu"* (`./conteudo-consultado.ts`), e e essa identidade
 * que UT-038-3 compara e UT-038-4 preserva.
 */
function repositorioQueRegistra(
  linhas: readonly ConteudoConsultado[],
  comandos: string[],
): RepositorioDeTeste {
  const pedidos: RepositorioDeTeste['pedidos'] = [];
  return {
    repositorio: (criterios, tipos) => {
      comandos.push('repositorio.ler');
      pedidos.push({ criterios, tipos });
      return { conteudos: linhas };
    },
    pedidos,
  };
}

/** A fonte de regras que conta quantas vezes foi chamada (`class-wp.php:163`). */
function fonteQueConta(
  regras: readonly RegraDeTraducao[],
  chamadas: { total: number },
): FonteDeRegrasDeTraducao {
  const fonte = fonteFixaDeRegras(tabelaDeRegras(regras));
  return () => {
    chamadas.total += 1;
    return fonte();
  };
}

// ---------------------------------------------------------------------------
// UT-038-1 · `feliz`
// ---------------------------------------------------------------------------

test('UT-038-1 traduz o endereco amigavel em criterios de consulta pelas regras declaradas', () => {
  const comandos: string[] = [];
  const modulo = criarModuloDeLeituraPublica(portaQueRegistra(comandos));
  const { repositorio, pedidos } = repositorioQueRegistra(
    [conteudo({ id: 7, identificadorNaUrl: 'ola-mundo' })],
    comandos,
  );
  const chamadas = { total: 0 };

  // Dado: a forma `/%year%/%monthnum%/%postname%/` declarada, com as quatro
  // regras que ela gera. Quando: o visitante pede a URL (UC-01, gatilho).
  const atendimento = modulo.atender(
    { uriPedida: '/2026/10/ola-mundo/' },
    {
      resolucao: {
        fonteDeRegras: fonteQueConta(REGRAS_DA_FORMA_POR_DATA, chamadas),
      },
      contexto: { repositorio, configuracao: configuracaoCom(FORMA_POR_DATA) },
    },
  );

  // Entao: os criterios sao os que a regra declara, e **so** eles.
  assert.deepEqual({ ...atendimento.resolucao.criterios }, {
    year: '2026',
    monthnum: '10',
    name: 'ola-mundo',
  });

  // E a regra que os produziu e nomeavel: nao e o codigo que sabe ler
  // `/2026/10/ola-mundo/`, e a tabela.
  assert.equal(atendimento.resolucao.regraCasada, REGRA_DO_CONTEUDO.padrao);
  assert.equal(
    atendimento.resolucao.consultaCasada,
    'year=2026&monthnum=10&name=ola-mundo',
  );
  assert.equal(atendimento.resolucao.caminhoDaRequisicao, '2026/10/ola-mundo');
  assert.equal(atendimento.resolucao.permalinkResolvido, true);

  // E a consulta recebeu esses criterios, ja moldados por `parse_query`: `year`
  // e `monthnum` chegam como numero (`absint`), `name` como texto.
  assert.equal(pedidos.length, 1);
  assert.equal(pedidos[0]?.criterios['year'], 2026);
  assert.equal(pedidos[0]?.criterios['monthnum'], 10);
  assert.equal(pedidos[0]?.criterios['name'], 'ola-mundo');
  assert.equal(atendimento.consulta?.contagem, 1);
  assert.equal(atendimento.consulta?.conteudo?.id, 7);
  assert.equal(atendimento.resposta.codigoHttp, 200);

  // A tabela foi lida uma vez, nesta requisicao e nesta posicao
  // (`class-wp.php:163`), e a porta de dados nao recebeu comando nenhum.
  assert.equal(chamadas.total, 1);
  assert.deepEqual(comandos, ['repositorio.ler']);

  // ---------------------------------------------------------------------
  // A segunda metade do caso: sao as regras **declaradas** que traduzem, e a
  // ordem da declaracao faz parte delas.
  // ---------------------------------------------------------------------

  // `/2026/10/11/` casa a regra do dia e a do conteudo. Na ordem do legado
  // (data antes de conteudo, `class-wp-rewrite.php:1455` e `:1457`) ganha a do
  // dia, e o endereco e um arquivo de data.
  const comoData = modulo.atender(
    { uriPedida: '/2026/10/11/' },
    {
      resolucao: {
        fonteDeRegras: fonteFixaDeRegras(
          tabelaDeRegras(REGRAS_DA_FORMA_POR_DATA),
        ),
      },
      contexto: {
        repositorio: repositorioQueRegistra([conteudo({ id: 9 })], comandos)
          .repositorio,
        configuracao: configuracaoCom(FORMA_POR_DATA),
      },
    },
  );

  assert.deepEqual({ ...comoData.resolucao.criterios }, {
    year: '2026',
    monthnum: '10',
    day: '11',
  });
  assert.equal(comoData.resolucao.regraCasada, REGRA_DO_DIA.padrao);
  assert.equal(comoData.consulta?.tipos.dia, true);
  assert.equal(comoData.consulta?.tipos.unico, false);

  // Invertida a declaracao, o MESMO endereco produz OUTROS criterios: `name`
  // em lugar de `day`. Nada no modulo sabe o que `/2026/10/11/` significa.
  const comoConteudo = modulo.atender(
    { uriPedida: '/2026/10/11/' },
    {
      resolucao: {
        fonteDeRegras: fonteFixaDeRegras(
          tabelaDeRegras([REGRA_DO_CONTEUDO, ...REGRAS_DA_FORMA_POR_DATA]),
        ),
      },
      contexto: {
        repositorio: repositorioQueRegistra([conteudo({ id: 9 })], comandos)
          .repositorio,
        configuracao: configuracaoCom(FORMA_POR_DATA),
      },
    },
  );

  assert.deepEqual({ ...comoConteudo.resolucao.criterios }, {
    year: '2026',
    monthnum: '10',
    name: '11',
  });
  assert.equal(comoConteudo.resolucao.regraCasada, REGRA_DO_CONTEUDO.padrao);
  assert.equal(comoConteudo.consulta?.tipos.unico, true);
  assert.equal(comoConteudo.consulta?.tipos.dia, false);

  // ⚠️ A colisao das duas leituras e conhecida do legado e tem funcao propria —
  // `wp_resolve_numeric_slug_conflicts()` (`wp-includes/rewrite.php:381-475`),
  // chamada em `class-wp.php:390`. Aqui ela sai sem efeito pela quarta saida
  // (`rewrite.php:419-422`): nao existe conteudo com o identificador `11`,
  // porque nenhum destes contextos declarou `conteudoPorCaminho`. Quem afirma a
  // resolucao dela e a suite de T003, nao este caso do catalogo.
});

// ---------------------------------------------------------------------------
// UT-038-2 · `erro`
// ---------------------------------------------------------------------------

test('UT-038-2 recusa inventar criterio para endereco que nao casa com nenhuma regra', () => {
  const comandos: string[] = [];
  const modulo = criarModuloDeLeituraPublica(portaQueRegistra(comandos));
  const { repositorio, pedidos } = repositorioQueRegistra([], comandos);

  // Dado: a mesma tabela declarada. Quando: um endereco que nenhuma das quatro
  // regras casa — tres segmentos, e o primeiro nao e um ano.
  const atender = (): ReturnType<typeof modulo.atender> =>
    modulo.atender(
      { uriPedida: '/isto/nao/existe/' },
      {
        resolucao: {
          fonteDeRegras: fonteFixaDeRegras(
            tabelaDeRegras(REGRAS_DA_FORMA_POR_DATA),
          ),
        },
        contexto: {
          repositorio,
          configuracao: configuracaoCom(FORMA_POR_DATA),
        },
      },
    );

  // Entao, primeira metade do achado de QA de REQ-081: *"sem erro de
  // servidor"*. A leitura publica e a superficie mais executada do produto, e a
  // resposta a um endereco sem correspondencia e uma resposta, nao uma excecao.
  let atendimento: ReturnType<typeof modulo.atender> | undefined;
  assert.doesNotThrow(() => {
    atendimento = atender();
  });
  assert.ok(atendimento);

  // E nenhum criterio foi inventado: so a marca de erro que `parse_request`
  // declara em `class-wp.php:167` e grava em `:398-400`. Nada do caminho
  // pedido virou criterio — nem `name`, nem `pagename`, nem os nomes das
  // regras declaradas.
  assert.deepEqual({ ...atendimento.resolucao.criterios }, { error: '404' });
  assert.equal(atendimento.resolucao.criterios['name'], undefined);
  assert.equal(atendimento.resolucao.criterios['pagename'], undefined);
  assert.equal(atendimento.resolucao.criterios['year'], undefined);

  // E nenhuma regra foi dada como casada.
  assert.equal(atendimento.resolucao.regraCasada, '');
  assert.equal(atendimento.resolucao.consultaCasada, '');
  assert.equal(atendimento.resolucao.resolvida, true);

  // Segunda metade do achado: *"a ausência do endereço cai na resposta de
  // endereço inexistente"*. A consulta le o criterio `error` e se marca
  // sozinha, e `set_404()` zera os predicados (`class-wp-query.php:1843-1849`).
  assert.equal(atendimento.consulta?.tipos.naoEncontrado, true);
  assert.equal(atendimento.consulta?.tipos.inicio, false);
  assert.equal(atendimento.consulta?.tipos.singular, false);
  assert.equal(atendimento.resposta.naoEncontrado, true);

  // ⚠️ E o codigo **nao** e 5xx — nem e declarado aqui. `handle_404` desiste no
  // comeco quando a consulta ja esta marcada (`class-wp.php:742-745`), e quem
  // emite o 404 deste caminho e o envio de cabecalhos, a partir do criterio
  // `error`. `null` e ausencia de decisao nesta etapa, nao ausencia de resposta.
  assert.equal(atendimento.resposta.codigoHttp, null);
  assert.notEqual(atendimento.resposta.codigoHttp, 500);

  // E a porta de dados segue sem comando: o repositorio foi consultado — a
  // consulta principal nao olha `is_404` —, e o banco nao.
  assert.equal(pedidos.length, 1);
  assert.deepEqual(
    comandos.filter((comando) => comando.startsWith('porta.')),
    [],
  );
});

// ---------------------------------------------------------------------------
// UT-038-3 · `feliz`
// ---------------------------------------------------------------------------

test('UT-038-3 produz o mesmo resultado com os criterios informados diretamente', () => {
  const comandos: string[] = [];
  const modulo = criarModuloDeLeituraPublica(portaQueRegistra(comandos));
  // Dois registros, para que *"o mesmo resultado"* inclua a ordem.
  const linhas = [
    conteudo({ id: 7, identificadorNaUrl: 'ola-mundo' }),
    conteudo({ id: 9, identificadorNaUrl: 'segundo' }),
  ];

  // Caminho A: o endereco amigavel, com a tabela declarada.
  const porEndereco = modulo.atender(
    { uriPedida: '/2026/10/ola-mundo/' },
    {
      resolucao: {
        fonteDeRegras: fonteFixaDeRegras(
          tabelaDeRegras(REGRAS_DA_FORMA_POR_DATA),
        ),
      },
      contexto: {
        repositorio: repositorioQueRegistra(linhas, comandos).repositorio,
        configuracao: configuracaoCom(FORMA_POR_DATA),
      },
    },
  );

  // Caminho B: os MESMOS criterios informados direto, sem tabela de regras —
  // que e o estado de fabrica de uma instalacao nova de site unico
  // (`schema.php:443`).
  const porCriterios = modulo.atender(
    {
      uriPedida: '/?year=2026&monthnum=10&name=ola-mundo',
      parametrosDeConsulta: {
        year: '2026',
        monthnum: '10',
        name: 'ola-mundo',
      },
    },
    {
      contexto: {
        repositorio: repositorioQueRegistra(linhas, comandos).repositorio,
      },
    },
  );

  // Entao: os mesmos criterios, inclusive na ordem de insercao — que e
  // observavel, porque e dela que sai o `query_vars_hash` de
  // `class-wp-query.php:1154`.
  assert.deepEqual(
    Object.entries(porEndereco.resolucao.criterios),
    Object.entries(porCriterios.resolucao.criterios),
  );
  assert.deepEqual(
    Object.entries(porEndereco.consulta?.criterios ?? {}),
    Object.entries(porCriterios.consulta?.criterios ?? {}),
  );

  // Os mesmos predicados.
  assert.deepEqual(porEndereco.consulta?.tipos, porCriterios.consulta?.tipos);

  // O mesmo conjunto de registros, na mesma ordem, e o mesmo primeiro registro.
  assert.deepEqual(
    porEndereco.consulta?.conteudos,
    porCriterios.consulta?.conteudos,
  );
  assert.deepEqual(
    porEndereco.consulta?.conteudos.map((linha) => linha.id),
    [7, 9],
  );
  assert.equal(porEndereco.consulta?.conteudo?.id, 7);
  assert.deepEqual(porEndereco.consulta?.conteudo, porCriterios.consulta?.conteudo);
  assert.equal(porEndereco.consulta?.contagem, porCriterios.consulta?.contagem);

  // E a mesma resposta, nos tres campos que ela tem.
  assert.deepEqual(porEndereco.resposta, porCriterios.resposta);

  // ⚠️ O que difere e so a escrituracao do endereco, e e por isso que os dois
  // caminhos sao de fato dois: sem tabela de regras o legado nao entra no bloco
  // de casamento (`class-wp.php:165`), logo nao ha regra casada, nao ha caminho
  // recortado e `did_permalink` fica falso (`:168` e `:296`). Nada disso chega
  // a consulta — e essa e a equivalencia que CA-1.2 cobra.
  assert.equal(porEndereco.resolucao.permalinkResolvido, true);
  assert.equal(porCriterios.resolucao.permalinkResolvido, false);
  assert.notEqual(
    porEndereco.resolucao.regraCasada,
    porCriterios.resolucao.regraCasada,
  );
  assert.equal(porCriterios.resolucao.regraCasada, '');
  assert.equal(porCriterios.resolucao.caminhoDaRequisicao, '');

  // E nenhum dos dois caminhos tocou o banco.
  assert.deepEqual(comandos, ['repositorio.ler', 'repositorio.ler']);
});

// ---------------------------------------------------------------------------
// UT-038-4 · `feliz`
// ---------------------------------------------------------------------------

test('UT-038-4 preserva o conteudo gravado ao trocar a forma dos enderecos amigaveis', () => {
  const comandos: string[] = [];
  const modulo = criarModuloDeLeituraPublica(portaQueRegistra(comandos));

  // Dado: um conteudo gravado, e o retrato dele antes de qualquer leitura.
  const gravadas: readonly ConteudoConsultado[] = [
    conteudo({ id: 7, identificadorNaUrl: 'ola-mundo' }),
  ];
  const retrato = gravadas.map((linha) => ({ ...linha }));

  const antes = { total: 0 };
  const depois = { total: 0 };

  // Quando: a MESMA leitura, sob a forma `/%year%/%monthnum%/%postname%/`…
  const comFormaAntiga = modulo.atender(
    { uriPedida: '/2026/10/ola-mundo/' },
    {
      resolucao: { fonteDeRegras: fonteQueConta(REGRAS_DA_FORMA_POR_DATA, antes) },
      contexto: {
        repositorio: repositorioQueRegistra(gravadas, comandos).repositorio,
        configuracao: configuracaoCom(FORMA_POR_DATA),
      },
    },
  );

  // …e sob a forma `/arquivo/%year%/%monthnum%/%postname%/`, que e a mesma
  // forma movida para baixo de um prefixo: muda a tabela, muda o endereco.
  const comFormaNova = modulo.atender(
    { uriPedida: '/arquivo/2026/10/ola-mundo/' },
    {
      resolucao: {
        fonteDeRegras: fonteQueConta(regrasComPrefixo('arquivo/'), depois),
      },
      contexto: {
        repositorio: repositorioQueRegistra(gravadas, comandos).repositorio,
        configuracao: configuracaoCom(FORMA_SOB_ARQUIVO),
      },
    },
  );

  // Entao: os dois enderecos resolvem nos MESMOS criterios e no MESMO conteudo.
  assert.deepEqual(
    Object.entries(comFormaAntiga.resolucao.criterios),
    Object.entries(comFormaNova.resolucao.criterios),
  );
  assert.equal(comFormaAntiga.consulta?.conteudo?.id, 7);
  assert.equal(comFormaNova.consulta?.conteudo?.id, 7);
  assert.equal(comFormaAntiga.resposta.codigoHttp, 200);
  assert.equal(comFormaNova.resposta.codigoHttp, 200);

  // E o que mudou foi so o padrao casado: a tabela, que no legado e dado
  // gravado na configuracao do site, e nao linha de `posts`.
  assert.equal(comFormaAntiga.resolucao.regraCasada, REGRA_DO_CONTEUDO.padrao);
  assert.equal(
    comFormaNova.resolucao.regraCasada,
    `arquivo/${REGRA_DO_CONTEUDO.padrao}`,
  );
  assert.equal(comFormaAntiga.resolucao.caminhoDaRequisicao, '2026/10/ola-mundo');
  assert.equal(
    comFormaNova.resolucao.caminhoDaRequisicao,
    'arquivo/2026/10/ola-mundo',
  );

  // E o conteudo gravado esta identico ao retrato: nem o identificador na URL,
  // que e a parte do registro que o endereco usa, precisou ser reescrito.
  assert.deepEqual(gravadas, retrato);
  assert.equal(gravadas[0]?.identificadorNaUrl, 'ola-mundo');
  assert.deepEqual(comFormaAntiga.consulta?.conteudo, comFormaNova.consulta?.conteudo);

  // ⚠️ E a prova de que isso e resultado, e nao ausencia de excecao: o log de
  // comandos tem DUAS leituras de conteudo e nada mais. Nenhuma escrita, em
  // lugar nenhum — as duas pos-condicoes de UC-01, *"nada muda no
  // armazenamento"* e *"o contador de visualizações não existe"*.
  assert.deepEqual(comandos, ['repositorio.ler', 'repositorio.ler']);

  // E cada requisicao leu a tabela uma vez, na posicao de `class-wp.php:163` —
  // que e onde o legado reconstroi e **grava** o cache de regras quando a opcao
  // esta vazia (`class-wp-rewrite.php:1493-1523`). Essa escrita e da fonte, e
  // nao desta feature: nenhuma das duas fontes daqui grava.
  assert.equal(antes.total, 1);
  assert.equal(depois.total, 1);
});

// ---------------------------------------------------------------------------
// UT-038-5 · `borda`
// ---------------------------------------------------------------------------

test('UT-038-5 distingue na resposta o endereco de um conteudo do endereco de uma listagem', () => {
  const comandos: string[] = [];
  const modulo = criarModuloDeLeituraPublica(portaQueRegistra(comandos));
  const fonte = fonteFixaDeRegras(tabelaDeRegras(REGRAS_DA_FORMA_POR_DATA));

  /** A mesma tabela, o mesmo site: muda so o endereco e o que o site tem. */
  function ler(
    uriPedida: string,
    linhas: readonly ConteudoConsultado[],
  ): ReturnType<typeof modulo.atender> {
    return modulo.atender(
      { uriPedida },
      {
        resolucao: { fonteDeRegras: fonte },
        contexto: {
          repositorio: repositorioQueRegistra(linhas, comandos).repositorio,
          configuracao: configuracaoCom(FORMA_POR_DATA),
        },
      },
    );
  }

  // Dado: a mesma tabela declarada, e dois enderecos dela — um que resolve para
  // um conteudo e um que resolve para uma listagem.
  const umConteudo = ler('/2026/10/ola-mundo/', [conteudo({ id: 7 })]);
  const umaListagem = ler('/2026/10/', [conteudo({ id: 7 })]);

  const tiposDoConteudo = (umConteudo.consulta as ConsultaDeConteudo).tipos;
  const tiposDaListagem = (umaListagem.consulta as ConsultaDeConteudo).tipos;

  // Entao: a resposta distingue os dois, e a distincao e legivel sem olhar o
  // endereco de novo.
  assert.equal(consultaSingular(tiposDoConteudo), true);
  assert.equal(consultaDeListagem(tiposDoConteudo), false);
  assert.equal(tiposDoConteudo.unico, true);

  assert.equal(consultaDeListagem(tiposDaListagem), true);
  assert.equal(consultaSingular(tiposDaListagem), false);
  assert.equal(tiposDaListagem.mes, true);
  assert.equal(tiposDaListagem.arquivo, true);

  // E os dois respondem 200: a distincao nao e "um achou e o outro nao".
  assert.equal(umConteudo.resposta.codigoHttp, 200);
  assert.equal(umaListagem.resposta.codigoHttp, 200);

  // ---------------------------------------------------------------------
  // O limite: a distincao nao vem da CONTAGEM devolvida.
  // ---------------------------------------------------------------------

  // Uma listagem com um registro so continua listagem — e esse e o caso acima,
  // com a mesma linha que o endereco de conteudo devolveu. Com dois registros,
  // nada muda: os mesmos predicados, so a contagem cresce.
  const listagemDeDois = ler('/2026/10/', [
    conteudo({ id: 7 }),
    conteudo({ id: 9 }),
  ]);

  assert.ok(listagemDeDois.consulta);
  assert.equal(umaListagem.consulta?.contagem, 1);
  assert.equal(listagemDeDois.consulta.contagem, 2);
  assert.deepEqual(listagemDeDois.consulta.tipos, tiposDaListagem);
  assert.equal(consultaDeListagem(listagemDeDois.consulta.tipos), true);

  // ---------------------------------------------------------------------
  // O primeiro passo alem do limite: o conjunto vazio.
  // ---------------------------------------------------------------------

  // ⚠️ Com zero registros os dois enderecos 404am — o arquivo de data vazio
  // tambem, porque ele nao e nenhum dos cinco casos que o terceiro ramo de
  // `handle_404` perdoa (`class-wp.php:784-793`) — e `set_404()` **zera os
  // predicados** (`class-wp-query.php:1843-1849`). Depois disso a resposta
  // deixa de distinguir: os dois lados de CA-1.4 ficam falsos nas duas.
  const conteudoVazio = ler('/2026/10/ola-mundo/', []);
  const listagemVazia = ler('/2026/10/', []);

  for (const vazio of [conteudoVazio, listagemVazia]) {
    assert.ok(vazio.consulta);
    assert.equal(vazio.resposta.codigoHttp, 404);
    assert.equal(vazio.resposta.naoEncontrado, true);
    assert.equal(vazio.consulta.tipos.naoEncontrado, true);
    assert.equal(consultaSingular(vazio.consulta.tipos), false);
    assert.equal(consultaDeListagem(vazio.consulta.tipos), false);
  }

  // E e por isso que a distincao se le na etapa 3, e nao depois dela: pedida a
  // consulta sozinha, sem a decisao de situacao, os dois enderecos vazios
  // continuam distinguiveis — um singular que nao achou nada e singular, e uma
  // listagem que nao achou nada e listagem.
  const criteriosDoConteudo = modulo.resolverEndereco(
    { uriPedida: '/2026/10/ola-mundo/' },
    { fonteDeRegras: fonte },
  ).criterios;
  const criteriosDaListagem = modulo.resolverEndereco(
    { uriPedida: '/2026/10/' },
    { fonteDeRegras: fonte },
  ).criterios;

  const singularVazio = modulo.consultarConteudo(criteriosDoConteudo, {
    contexto: { configuracao: configuracaoCom(FORMA_POR_DATA) },
  });
  const listagemSemLinha = modulo.consultarConteudo(criteriosDaListagem, {
    contexto: { configuracao: configuracaoCom(FORMA_POR_DATA) },
  });

  assert.equal(singularVazio.contagem, 0);
  assert.equal(consultaSingular(singularVazio.tipos), true);
  assert.equal(consultaDeListagem(singularVazio.tipos), false);

  assert.equal(listagemSemLinha.contagem, 0);
  assert.equal(consultaDeListagem(listagemSemLinha.tipos), true);
  assert.equal(consultaSingular(listagemSemLinha.tipos), false);

  // E nada disso tocou o banco: cinco leituras de repositorio, nenhum comando
  // de porta. As duas ultimas consultas rodaram sem repositorio declarado, que
  // e *"o estado de `posts` sem linha que casa"* (`./contexto-da-consulta.ts`).
  assert.deepEqual(
    comandos,
    ['repositorio.ler', 'repositorio.ler', 'repositorio.ler', 'repositorio.ler', 'repositorio.ler'],
  );
});
