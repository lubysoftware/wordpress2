/**
 * A entrega de **T010**: *"4 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-022-1, UT-022-2, UT-022-3, UT-022-4), com o
 * mesmo dado de entrada, acao e resultado esperado."*
 *
 * ✅ **O catalogo EXISTE nesta arvore e os quatro casos foram COPIADOS dele, nao
 * reconstruidos.** As suites `ut-011-*`, `ut-014-*`, `ut-015-*` e `ut-016-*` de
 * BC-05 registram, no cabecalho de cada uma, que `backlog/tests.md` estava
 * ausente quando foram escritas e que os casos delas foram inferidos de
 * `spec.md`. Isso mudou: `backlog/tests.md` esta no repositorio e a secao
 * **REQ-022** dele da os quatro casos com nome, tipo e prova. Esta suite nao
 * infere nada — ela transcreve.
 *
 * | caso | tipo | nome, como o catalogo o escreve | prova (= criterio) |
 * |---|---|---|---|
 * | `UT-022-1` | `feliz` | grava estado distinto de publicado quando a visibilidade escolhida e privada | **CA-4.1** |
 * | `UT-022-2` | `erro` | recusa a leitura de conteudo privado a quem nao pode ler privado | **CA-4.2** |
 * | `UT-022-3` | `erro` | devolve ao anonimo a mesma resposta que daria para conteudo inexistente | **CA-4.3** |
 * | `UT-022-4` | `feliz` | mantem o conteudo privado fora de listagem, feed e sitemap | **CA-4.4** |
 *
 * REQ-022 esta `pronto`, com veredito `aprovado` e *"4 de 4 criterios de aceite
 * cobertos"*: a correspondencia e **um caso por criterio**, sem caso de regra de
 * negocio sobrando — e a linha de T010 em `tasks.md` confirma, porque ela nao
 * tem a frase *"o teste de regra de negocio entra na mesma suite"* que T004,
 * T006, T008, T012, T014, T016, T018, T022 e T024 tem. Sao **quatro** `test()`
 * neste arquivo, nem um a mais.
 *
 * ---
 *
 * # Isto NAO e a suite de T009, e a diferenca nao e cerimonia
 *
 * T009 entregou `./us-4-conteudo-privado.test.ts`, com 26 casos no nivel da
 * **unidade**: um por ramo do `switch` de visibilidade, um por slot de
 * capacidade, um por propriedade do registro de estados. Ela prova que cada peca
 * de `visibilidade/` faz o que o legado faz naquela linha.
 *
 * Esta suite e o catalogo UT-022-*, no nivel do **caso**: quatro cenarios, cada
 * um atravessando o circuito inteiro que o caso descreve, do pedido ao efeito
 * observavel. Onde o caso diz *"grava"*, o cenario grava — pela porta de dados
 * de T001 e pelo repositorio de T002 —, e a afirmacao e sobre os **bytes do
 * parametro** que chegam ao `INSERT`, nao sobre o valor devolvido em memoria.
 * Onde o caso diz *"devolve ao anonimo a mesma resposta"*, as duas respostas sao
 * produzidas na mesma execucao e comparadas uma com a outra, em vez de cada uma
 * ser comparada com um literal escrito a mao: um literal igual nos dois lugares
 * deixaria passar um porte que distinguisse os dois casos e mudasse os dois
 * literais junto.
 *
 * **T010 depende de T009** (`tasks.md`: *"depende de: T009"*), e por isso tudo o
 * que esta suite importa de `./index.js` e de T009: numa arvore sem T009 ela nao
 * compila, que e o que a dependencia declarada significa. Nenhum arquivo fora
 * desta suite e tocado, como o `[P]` de T010 exige — *"tarefa de teste, que toca
 * so a propria suite"*. Nem `./index.ts`, nem o README do modulo: os dois ja
 * declaram, desde T009, que os quatro casos do catalogo sao de T010.
 *
 * ---
 *
 * # Por que o criterio de paridade destes quatro casos e o de T009
 *
 * `parity_specs.md`, *Metrica primaria*, da a area **3** — *"esquema e efeito de
 * escrita no banco"*, tolerancia **zero** — a UT-022-1, e a area **1** —
 * *"contrato de terceiro: REST, XML-RPC, feeds, sitemaps"*, tolerancia **zero** —
 * a UT-022-2, UT-022-3 e UT-022-4, porque feed, mapa do site e API REST sao
 * contrato de terceiro e `PT-011` os compara byte a byte.
 *
 * ⚠️ **A lacuna que T009 declarou continua aberta, e T010 nao a fecha.**
 * Nenhuma das 20 specs de paridade deste pacote menciona conteudo privado: uma
 * busca por `private` e por `privad` em `.specify/migration/parity_tests/`
 * devolve zero ocorrencias, `PT-002` tem os cenarios da publicacao e do
 * agendamento e nenhum do privado, e `PT-011` alcanca a invariante so de lado,
 * no cenario `@concorrencia` (*"a resposta anonima nao contem nada que so a
 * autenticada veria"*) — que e, por acaso, exatamente UT-022-3. Escrever cenario
 * de paridade nao e tarefa de T010 e `parity_specs.md` e artefato do Inspector;
 * o que esta suite faz, como `README.md` do modulo manda, e citar **arquivo e
 * linha** do legado em cada caso, para que a comparacao caso a caso contra o
 * oraculo da resposta 16 possa rodar por elas quando o oraculo existir (T001 da
 * feature 015).
 *
 * ---
 *
 * # O que estes quatro casos NAO afirmam, e por que
 *
 * | nao afirma | de quem e |
 * |---|---|
 * | o `UPDATE` de 21 colunas que `wp_insert_post()` emite | **T005** em diante. UT-022-1 grava pelo `inserir` de T002 porque o caso diz *"grava"*, e e a unica escrita que esta arvore tem; a sequencia de comandos do legado e da tarefa da gravacao |
 * | o rebaixamento do painel para quem nao pode publicar | **T005** e **T015**, declarado e nao aplicado em `./permissao-de-conteudo-privado.ts`. UT-022-1 e `feliz`: o ator dele TEM a capacidade, e o caminho da recusa nao e caso deste catalogo |
 * | o 404, o modelo de erro do tema e a clausula SQL da consulta publica | feature **004**, `contextos/leitura-publica/`. UT-022-3 afirma a igualdade dos dois **desfechos**; quem os traduz em resposta HTTP e de la |
 * | o feed e o mapa do site como **saida** | BC-08, feature **013**. UT-022-4 afirma quais estados entram em cada um, que e a regra que esta arvore tem |
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ATOR_ANONIMO,
  REDE_INATIVA_NA_AUTORIZACAO,
  capacidadesExigidas,
  casoDeConteudo,
  comAtor,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type ConteudoNaAutorizacao,
  type EstadoDeConteudoNaAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type MatrizDePapeis,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarRepositorioDeConteudo,
  type ConteudoGravavel,
} from '../armazenamento/index.js';
import {
  criarPortaDeDadosFalsa,
  textoDoParametro,
} from '../armazenamento/porta-falsa.js';
import { ESTADOS_EDITORIAIS } from '../estado-editorial.js';
import { ESTADO_PUBLICADO } from '../publicacao/index.js';
import {
  CAPACIDADE_DE_LEITURA_PEDIDA,
  ESTADOS_DO_MAPA_DO_SITE,
  ESTADO_PRIVADO,
  REGISTRO_DE_FABRICA,
  SLOT_DE_LEITURA_DE_CONTEUDO_PRIVADO,
  decidirLeituraDeConteudoPrivado,
  escolherVisibilidade,
  estadoEntraNoMapaDoSite,
  recorteDaConsultaPublica,
  type ContextoDeVisibilidade,
} from './index.js';

/* ── O DADO DE ENTRADA DOS QUATRO CASOS ────────────────────────────────────── */

/** O conteudo privado dos quatro casos. */
const ID = 42;
/** Quem o escreveu. */
const AUTOR = 7;
/** Quem o le, nos casos de leitura: nao e o autor, de proposito. */
const LEITOR = 9;
/** O identificador que UT-022-3 pede a leitura e que nao existe em lugar nenhum. */
const ID_INEXISTENTE = 404;

/**
 * Os quatro papeis que os casos usam, com as concessoes que a matriz de fabrica
 * lhes da (`wp-admin/includes/schema.php:570`-`:700`). Cada um entra por um
 * motivo:
 *
 * - `author` tem `publish_posts` e e o ator de UT-022-1;
 * - `subscriber` tem so `read` e e o leitor negado de UT-022-2;
 * - `editor` tem `read_private_posts` e e o leitor servido de UT-022-2 e o
 *   contraste do mapa do site em UT-022-4.
 */
const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'author',
    capacidades: [
      { capacidade: 'read', concedida: true },
      { capacidade: 'edit_posts', concedida: true },
      { capacidade: 'publish_posts', concedida: true },
    ],
  },
  {
    identificador: 'subscriber',
    capacidades: [{ capacidade: 'read', concedida: true }],
  },
  {
    identificador: 'editor',
    capacidades: [
      { capacidade: 'read', concedida: true },
      { capacidade: 'edit_posts', concedida: true },
      { capacidade: 'edit_others_posts', concedida: true },
      { capacidade: 'publish_posts', concedida: true },
      { capacidade: 'read_private_posts', concedida: true },
    ],
  },
];

/**
 * O registro do tipo `post`, com os slots que `map_meta_cap()` consulta
 * (`wp-includes/post.php:2050`-`:2090`). Os nomes sao os de fabrica, e a
 * traducao de `read_post` sai daqui e nao de um `if` sobre o nome do tipo.
 */
const TIPO_POST: TipoDeConteudoNaAutorizacao = {
  nome: 'post',
  traduzMetaCapacidade: true,
  capacidades: {
    read: 'read',
    read_post: 'read_post',
    edit_posts: 'edit_posts',
    edit_others_posts: 'edit_others_posts',
    publish_posts: 'publish_posts',
    read_private_posts: 'read_private_posts',
  },
};

/**
 * O registro de estados que a traducao consulta: `private` com `privado` e sem
 * `publico`, que e como `wp-includes/post.php:718`-`:730` o registra.
 */
const ESTADOS_REGISTRADOS: Readonly<
  Record<string, EstadoDeConteudoNaAutorizacao>
> = {
  publish: { nome: 'publish', publico: true, privado: false },
  private: { nome: 'private', publico: false, privado: true },
};

function ator(papel: string, contaId: number): AtorDeAutorizacao {
  return {
    contaId,
    login: papel,
    existe: true,
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

interface Cenario {
  /** O ator da requisicao, e a decisao e so dele (AD-02, `EXT-CONTEXTO`). */
  readonly ator: AtorDeAutorizacao;
  /** `true` quando a linha pedida nao existe — o dado de entrada de UT-022-3. */
  readonly conteudoAusente?: boolean;
}

/**
 * Monta o contexto dos casos: uma linha de `posts` em `private`, de autoria de
 * {@link AUTOR}, do tipo `post`, servida pela fonte que o **caso de traducao**
 * de conteudo carrega. Nao ha porta de dados neste contexto, e a ausencia e a
 * regra — ver `./contexto-de-visibilidade.ts`.
 */
function cenario({ ator: atorDaRequisicao, conteudoAusente }: Cenario): ContextoDeVisibilidade {
  const conteudo: ConteudoNaAutorizacao | null = conteudoAusente
    ? null
    : {
        id: ID,
        tipo: 'post',
        estado: ESTADO_PRIVADO,
        estadoParaLeitura: ESTADO_PRIVADO,
        autorId: AUTOR,
        paiId: 0,
      };

  const fonte: FonteDeConteudoNaAutorizacao = {
    conteudo() {
      return conteudo;
    },
    tipoDeConteudo(nome) {
      return nome === TIPO_POST.nome ? TIPO_POST : null;
    },
    estadoDeConteudo(nome) {
      return ESTADOS_REGISTRADOS[nome] ?? null;
    },
    estadoAnteriorNaLixeira() {
      return '';
    },
    paginaInicial() {
      return 0;
    },
    paginaDeConteudos() {
      return 0;
    },
    paginaDePoliticaDePrivacidade() {
      return 0;
    },
  };

  const base: BaseDeAutorizacao = {
    matriz: MATRIZ,
    rede: REDE_INATIVA_NA_AUTORIZACAO,
    casosDeTraducao: [casoDeConteudo(fonte)],
  };

  return {
    base,
    ator: atorDaRequisicao,
    tipoDeConteudo(nome) {
      return nome === TIPO_POST.nome ? TIPO_POST : null;
    },
  };
}

/**
 * A linha que UT-022-1 grava, com as 21 colunas gravaveis preenchidas como a
 * tela de edicao as manda. O estado nasce **publicado** de proposito: e sobre
 * ele que os campos resolvidos pela visibilidade privada passam, e e isso que o
 * caso chama de *"estado distinto de publicado"*.
 */
function linhaPublicada(): ConteudoGravavel {
  return {
    autorId: AUTOR,
    data: '2026-10-08 12:00:00',
    dataGmt: '2026-10-08 15:00:00',
    corpo: 'O comunicado interno.',
    corpoFiltrado: '',
    titulo: 'Comunicado interno',
    resumo: '',
    estado: ESTADO_PUBLICADO,
    tipo: 'post',
    estadoDeComentario: 'open',
    estadoDeNotificacao: 'open',
    senha: 'segredo-anterior',
    identificadorNaUrl: 'comunicado-interno',
    aPingar: '',
    pingados: '',
    modificadoEm: '2026-10-08 12:00:00',
    modificadoEmGmt: '2026-10-08 15:00:00',
    vinculo: { tipo: 'sem-pai' },
    ordemNoMenu: 0,
    tipoMime: '',
    guid: 'http://exemplo.test/?p=42',
  };
}

/* ── UT-022-1 ──────────────────────────────────────────────────────────────── */

test('UT-022-1 grava estado distinto de publicado quando a visibilidade escolhida e privada (CA-4.1)', () => {
  // DADO um autor que pode publicar `post` e um conteudo cujo estado seria
  // `publish` — o default do esquema (`post_status varchar(20) NOT NULL default
  // 'publish'`, `wp-admin/includes/schema.php:159`).
  const contexto = cenario({ ator: ator('author', AUTOR) });

  // QUANDO a visibilidade escolhida e privada. O `switch` e o de
  // `wp-admin/includes/post.php:318`-`:331`, `case 'private'` em `:326`-`:330`.
  const resolvida = escolherVisibilidade(contexto, {
    tipoDeConteudo: 'post',
    visibilidade: 'private',
  });

  assert.equal(resolvida.desfecho, 'resolvida');
  assert.equal(resolvida.recusa, null);

  // ENTAO o estado gravado e distinto de publicado. A afirmacao e sobre os
  // BYTES do parametro que chegam ao comando, e nao sobre o valor em memoria:
  // o circuito passa pela porta de dados de T001 e pelo `inserir` de T002.
  const dados = criarPortaDeDadosFalsa();
  const repositorio = criarRepositorioDeConteudo(dados.porta);
  repositorio.inserir({ ...linhaPublicada(), ...resolvida.campos }, ID);

  const escrita = dados.escritas[0];
  assert.ok(escrita !== undefined, 'nao houve escrita');
  assert.equal(dados.escritas.length, 1, 'o legado grava com UM comando');

  const colunas = escrita.texto
    .replace(/^INSERT INTO \w+ \(/, '')
    .replace(/\) VALUES .*$/, '')
    .split(', ');
  const bytes = escrita.parametros.map(textoDoParametro);
  const valorDaColuna = (nome: string): string | undefined => {
    const posicao = colunas.indexOf(nome);
    return posicao === -1 ? undefined : bytes[posicao];
  };

  assert.equal(valorDaColuna('post_status'), ESTADO_PRIVADO);
  assert.equal(valorDaColuna('post_status'), 'private');
  assert.notEqual(valorDaColuna('post_status'), ESTADO_PUBLICADO);
  assert.notEqual(valorDaColuna('post_status'), 'publish');

  // E o estado gravado e um dos 12 do vocabulario de fabrica: `private` e um
  // VALOR da mesma coluna, nao um atributo ao lado de `publish`. Um porte que
  // gravasse `publish` com uma marca ao lado passaria neste caso e falharia nos
  // tres seguintes sem erro nenhum.
  assert.ok(ESTADOS_EDITORIAIS.includes(ESTADO_PRIVADO));

  // E os outros dois efeitos do mesmo `case` chegam ao mesmo comando: a senha
  // de conteudo e apagada (`:328`), porque esconder a existencia e esconder o
  // corpo sao mecanismos exclusivos por construcao.
  assert.equal(valorDaColuna('post_password'), '');
});

/* ── UT-022-2 ──────────────────────────────────────────────────────────────── */

test('UT-022-2 recusa a leitura de conteudo privado a quem nao pode ler privado (CA-4.2)', () => {
  // DADO o conteudo privado de {@link AUTOR} e dois leitores autenticados que
  // NAO sao o autor: um sem `read_private_posts` e um com.
  const semACapacidade = cenario({ ator: ator('subscriber', LEITOR) });
  const comACapacidade = cenario({ ator: ator('editor', LEITOR) });

  // QUANDO a leitura e pedida. O pedido e por `read_post`, e e `map_meta_cap()`
  // que o traduz (`wp-includes/capabilities.php:369`-`:380`): perguntar direto
  // pela capacidade privada perderia o ramo do autor e os dois de degradacao.
  // ENTAO a capacidade exigida para ESTA linha e a de ler conteudo privado do
  // tipo, e e ela que decide os dois desfechos.
  assert.deepEqual(
    [
      ...capacidadesExigidas(
        comAtor(semACapacidade.base, semACapacidade.ator),
        CAPACIDADE_DE_LEITURA_PEDIDA,
        ID,
      ),
    ],
    [SLOT_DE_LEITURA_DE_CONTEUDO_PRIVADO],
  );
  assert.equal(SLOT_DE_LEITURA_DE_CONTEUDO_PRIVADO, 'read_private_posts');

  // E a leitura e recusada a quem nao a tem...
  assert.equal(
    decidirLeituraDeConteudoPrivado(semACapacidade, ID),
    'indistinguivel-de-inexistente',
  );
  // ... e servida a quem a tem. Sem este segundo lado, um porte que recusasse
  // todo mundo passaria no caso.
  assert.equal(decidirLeituraDeConteudoPrivado(comACapacidade, ID), 'servido');
});

/* ── UT-022-3 ──────────────────────────────────────────────────────────────── */

test('UT-022-3 devolve ao anonimo a mesma resposta que daria para conteudo inexistente (CA-4.3)', () => {
  // DADO um visitante anonimo, o conteudo privado que EXISTE e um identificador
  // que nao existe em lugar nenhum. O ator anonimo existe como objeto, com
  // conta 0 e `exists()` falso — e e isso que `is_user_logged_in()` le
  // (`class-wp-query.php:3539`-`:3541`).
  assert.equal(ATOR_ANONIMO.existe, false);
  const privadoQueExiste = cenario({ ator: ATOR_ANONIMO });
  const queNaoExiste = cenario({ ator: ATOR_ANONIMO, conteudoAusente: true });

  // QUANDO o anonimo pede os dois na mesma execucao.
  const respostaDoPrivado = decidirLeituraDeConteudoPrivado(
    privadoQueExiste,
    ID,
  );
  const respostaDoInexistente = decidirLeituraDeConteudoPrivado(
    queNaoExiste,
    ID_INEXISTENTE,
  );

  // ENTAO as duas respostas sao a MESMA. A comparacao e de uma com a outra, e
  // nao de cada uma com um literal: dois literais iguais escritos a mao
  // deixariam passar um porte que distinguisse os dois casos e mudasse os dois
  // junto. Nada no caminho distingue "nao existe" de "existe e voce nao pode".
  assert.equal(respostaDoPrivado, respostaDoInexistente);
  assert.equal(respostaDoPrivado, 'indistinguivel-de-inexistente');
});

/* ── UT-022-4 ──────────────────────────────────────────────────────────────── */

test('UT-022-4 mantem o conteudo privado fora de listagem, feed e sitemap (CA-4.4)', () => {
  // DADO o registro de estados de fabrica, com `private` registrado como
  // privado e sem a propriedade de publico (`wp-includes/post.php:718`-`:730`).
  const registro = REGISTRO_DE_FABRICA;

  // QUANDO a consulta publica e montada para o visitante anonimo. Listagem e
  // feed sao a MESMA consulta: o feed nao tem clausula propria, ele roda sobre
  // a consulta principal (`wp-includes/functions.php:1612`, `do_feed()`), e o
  // ramo dos privados e inteiro condicionado a sessao
  // (`class-wp-query.php:2760`-`:2766`).
  const listagemAnonima = recorteDaConsultaPublica(registro, {
    autenticado: false,
    podeLerConteudoPrivado: false,
  });

  // ENTAO nem a listagem nem o feed admitem `private`, para ninguem sem sessao.
  assert.deepEqual([...listagemAnonima.estados], [ESTADO_PUBLICADO]);
  assert.deepEqual([...listagemAnonima.estadosDoProprioAutor], []);
  assert.ok(!listagemAnonima.estados.includes(ESTADO_PRIVADO));

  // E o mapa do site tambem nao o admite — mas por OUTRO mecanismo, e e isso
  // que fecha o criterio nas tres superficies. Ele pede `publish` por nome
  // (`class-wp-sitemaps-posts.php:244` e `:123`), em lugar de consultar o
  // registro, logo nao mostra `private` nem a quem a listagem o mostra.
  assert.deepEqual([...ESTADOS_DO_MAPA_DO_SITE], [ESTADO_PUBLICADO]);
  assert.equal(estadoEntraNoMapaDoSite(ESTADO_PUBLICADO), true);
  assert.equal(estadoEntraNoMapaDoSite(ESTADO_PRIVADO), false);

  const listagemDeQuemPodeLerPrivado = recorteDaConsultaPublica(registro, {
    autenticado: true,
    podeLerConteudoPrivado: true,
  });
  assert.ok(listagemDeQuemPodeLerPrivado.estados.includes(ESTADO_PRIVADO));
  assert.ok(!estadoEntraNoMapaDoSite(ESTADO_PRIVADO));

  // Unificar os dois mecanismos ou poe endereco privado no mapa do site, ou
  // esconde o privado da propria listagem de quem o pode ler. As duas
  // afirmacoes acima sao o que impede cada uma das duas.
});
