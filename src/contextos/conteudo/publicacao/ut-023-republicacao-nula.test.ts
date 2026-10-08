/**
 * A entrega de **T012**: *"4 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-023-1, UT-023-2, UT-023-3, UT-023-4), com o
 * mesmo dado de entrada, acao e resultado esperado. O teste de regra de negocio
 * (UT-023-4) entra na mesma suite."*
 *
 * **Quatro `test()`, nem um a mais.** Os casos foram **copiados** do catalogo,
 * que existe nesta arvore (`backlog/tests.md`, secao *REQ-023*, linhas 381 a
 * 384) — e nao reconstruidos por aritmetica, como as suites de UT-* da feature
 * `001` tiveram de fazer quando o arquivo ainda nao estava aqui (ver o cabecalho
 * de `../../identidade-e-acesso/autorizacao/ut-016-capacidades-por-extensao.test.ts`).
 * A conta tambem fecha sozinha: **3 criterios de aceite + 1 regra de negocio = 4
 * casos**, e a linha de T012 declara *"satisfaz: CA-5.1, CA-5.2, CA-5.3"*, sem
 * criterio sobrando e sem criterio faltando. Nada aqui e escolha entre dois
 * documentos.
 *
 * | caso | nome, como esta no catalogo | tipo | prova, como esta no catalogo |
 * |---|---|---|---|
 * | `UT-023-1` | retorna sucesso sem alterar o registro ao republicar o ja publicado | `borda` | *"Pedir a publicacao de conteudo ja publicado retorna sucesso sem alterar o registro"* (CA-5.1) |
 * | `UT-023-2` | nao dispara transicao de estado nesse caminho | `borda` | *"Nenhuma transicao de estado e disparada nesse caminho"* (CA-5.2) |
 * | `UT-023-3` | nao aciona notificacao, agendamento nem automacao ligada a publicacao | `feliz` | *"Nenhuma notificacao, nenhum agendamento e nenhuma automacao ligada a publicacao e acionada"* (CA-5.3) |
 * | `UT-023-4` | mantem efeito unico quando a publicacao e pedida muitas vezes seguidas | `borda` | *"P7 — republicar e operacao nula: nenhum gancho de transicao dispara"* (BR-MIGRAR-007) |
 *
 * **O dado de entrada e o que os casos implicam, e isso esta declarado:** o
 * catalogo da, por caso, o ID, o nome, o tipo e a prova — nao da valor de
 * coluna. A lista por extenso mora em `backlog.json`, que `backlog/tests.md`
 * cita no proprio cabecalho (*"A lista de testes mora dentro do proprio card, em
 * `backlog.json`"*) e que **nao esta nesta arvore**: so o `tests.md` esta. Logo a
 * entrada de cada caso aqui e a que a prova exige — um conteudo **em `publish`**
 * para os tres primeiros, um **em `draft`** para o quarto, que e o unico cuja
 * frase pede um "antes" com efeito. Se o `backlog.json` aparecer com valor de
 * coluna diferente, o caso de la vale e este arquivo muda.
 *
 * ---
 *
 * # Nao e a suite de criterios de T011, e a diferenca e o nivel
 *
 * `us-5-republicacao-nula.test.ts` (T011) afirma CA-5.1, CA-5.2 e CA-5.3 no
 * nivel da **unidade**: porta de dados que devolve linha programada e registra
 * comando, e as funcoes `publicar`/`transitarParaPublicado` chamadas direto.
 *
 * Esta suite e o catalogo UT-023-*, no nivel do **cenario**: o modulo composto
 * por `criarModuloDeConteudo()` sobre uma **tabela `posts` em memoria** que
 * aplica o `UPDATE` que recebe — logo o estado gravado por uma chamada e o que a
 * chamada seguinte le, sem ninguem reprogramar resposta. E e por isso que ela
 * mora aqui: *"efeito no banco"* e o criterio da area 3 da Decisao 2 de
 * `parity_specs.md`, e o corpus que ele pede e **"snapshot + sequencia de
 * comandos"** — as duas coisas que o duble deste arquivo produz, o retrato da
 * tabela coluna por coluna e a lista de comandos na ordem. Com linha programada
 * nao ha retrato: a tabela nao existe.
 *
 * `[P]` de T012 vale: nenhum arquivo fora desta suite e tocado, e o duble de
 * tabela e local de proposito — vira helper compartilhado quando uma segunda
 * tarefa pedir, nao antes.
 *
 * ---
 *
 * # De onde sai cada afirmacao
 *
 * A regra e **BR-MIGRAR-007** (`P7`, *"republicar e operacao nula ... nenhum
 * gancho de transicao dispara"*), ancorada em `wp-includes/post.php:5413`, que e
 * a mesma linha que a rastreabilidade de `spec.md` da a US-5. O fluxo
 * alternativo *"Conteudo ja estava publicado"* de UC-03 — o unico caso de uso
 * que a rastreabilidade liga a esta historia — diz as duas metades:
 * *"`wp_publish_post()` retorna sem efeito"* e *"nenhum gancho de transicao
 * dispara"*. E o cenario `@idempotencia` de
 * `.specify/migration/parity_tests/02-publicacao-e-agendamento-de-conteudo.feature`
 * e o que esta suite tem de poder ser conferido por:
 *
 * > Dado um conteudo ja publicado
 * > Quando a publicacao e pedida de novo
 * > Entao nenhuma das duas metades altera qualquer campo
 * > E nenhum gancho de transicao de estado dispara em nenhuma das duas
 * > E uma extensao que escute transicao de estado nao e chamada em nenhuma das duas
 *
 * **Lista vazia e afirmacao, nao descuido.** `escritas`, `pontos`,
 * `termosDefinidos`, `limpezasDaFila`, `opcoesLidas` e `emailsEnviados` sao
 * contadores, e o que tres destes quatro casos cobram deles e o zero — o
 * contraste que prova que o cenario **tinha** o que acontecer esta no quarto
 * caso, que publica de verdade antes de repetir a chamada.
 *
 * **Nada foi inventado.** Republicar nao devolve codigo de erro, aviso nem
 * numero de HTTP novo, porque `wp_publish_post()` nao devolve valor nenhum em
 * nenhum dos dois caminhos (`:5502`): "sucesso" e ausencia de recusa somada a
 * ausencia de efeito, e criar superficie para ele seria criar o que o legado nao
 * tem (**P8**). Nenhum limite de tentativa, nenhuma janela e nenhuma chave de
 * desduplicacao entram aqui: **P6** poe numero que o legado nao tem fora do
 * nucleo, e a nota de compatibilidade de BR-MIGRAR-007 e literal —
 * *"idempotencia por guarda de estado, nao por chave de evento"*.
 *
 * O oraculo executavel da resposta 16 nao existe nesta arvore e nao ha PHP nesta
 * maquina (`parity_specs.md`, `LACUNA-IN-03`): as citacoes `arquivo:linha` saem
 * da leitura do codigo analisado, legivel em disco em `~/Downloads/wordpress`
 * (WordPress 7.1.2, a mesma versao do pacote), e e por essas linhas que a
 * comparacao caso a caso vai rodar quando o ambiente de referencia existir.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type MatrizDePapeis,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  DATA_SENTINELA,
  ESTADO_PUBLICADO,
  GANCHO_DE_PUBLICACAO_AGENDADA,
  OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
  PONTO_DEPRECIADO_DE_ENTRADA_EM_PUBLICADO,
  TAXONOMIA_DE_CATEGORIA,
  criarModuloDeConteudo,
  nomeDoPontoDeEstadoDoTipo,
  nomeDoPontoDeParaEstado,
  type Consulta,
  type ContextoDePublicacao,
  type GanchosDaPublicacao,
  type LinhaDeResultado,
  type MensagemDeEmail,
  type ModuloDeConteudo,
  type PortaDeDados,
  type TaxonomiaNaPublicacao,
  type ValorDeColuna,
} from '../index.js';

/* ── A TABELA `posts` EM MEMORIA ───────────────────────────────────────────── */

const TABELA = 'wp_posts';

/** O unico `SELECT` deste caminho (`wp-includes/class-wp-post.php:289`). */
const LEITURA_DA_LINHA = `SELECT * FROM ${TABELA} WHERE ID = ? LIMIT 1`;

interface TabelaEmMemoria {
  readonly porta: PortaDeDados;
  /** Toda leitura pedida, na ordem. */
  readonly leituras: Consulta[];
  /** Toda escrita pedida, na ordem. */
  readonly escritas: Consulta[];
  /** A linha como ela esta **agora**, para afirmar o estado gravado. */
  linha(id: number): Readonly<Record<string, ValorDeColuna | undefined>> | null;
  /** O retrato da tabela, coluna por coluna — a metade "snapshot" da area 3. */
  retrato(): string;
}

/**
 * Um duble que **aplica** o `UPDATE` que recebe, em vez de devolver linha
 * programada.
 *
 * E o que o quarto caso precisa para ser honesto: a guarda de `:5413` compara o
 * estado **gravado**, logo repetir a chamada so e nulo se a primeira chamada
 * tiver mesmo mudado a coluna. Nenhum banco, nenhuma rede e nenhum relogio real
 * — o que `backlog/tests.md` exige de todo caso do catalogo.
 *
 * Comando que ele nao reconhece nao lanca: entra na lista e devolve vazio ou
 * zero linha afetada, porque e a **lista** que estes casos afirmam. Com `throw`
 * a assercao sobre a sequencia de comandos nunca chegaria a rodar.
 */
function criarTabelaEmMemoria(
  linhas: readonly LinhaDeResultado[],
): TabelaEmMemoria {
  const linhasPorId = new Map<
    number,
    Record<string, ValorDeColuna | undefined>
  >();
  for (const linha of linhas) {
    linhasPorId.set(Number(linha['ID']), { ...linha });
  }

  const leituras: Consulta[] = [];
  const escritas: Consulta[] = [];

  return {
    porta: {
      prefixoDeTabela: 'wp_',
      selecionar(consulta) {
        leituras.push(consulta);
        if (consulta.texto !== LEITURA_DA_LINHA) {
          return [];
        }
        const linha = linhasPorId.get(Number(consulta.parametros[0]));
        return linha === undefined ? [] : [{ ...linha }];
      },
      escrever(consulta) {
        escritas.push(consulta);

        const alvo = new RegExp(
          `^UPDATE ${TABELA} SET (.+) WHERE ID = \\?$`,
        ).exec(consulta.texto);
        if (alvo === null) {
          return { linhasAfetadas: 0, idGerado: null };
        }

        const colunas = (alvo[1] ?? '')
          .split(', ')
          .map((atribuicao) => atribuicao.replace(' = ?', ''));
        const linha = linhasPorId.get(
          Number(consulta.parametros[colunas.length]),
        );
        if (linha === undefined) {
          return { linhasAfetadas: 0, idGerado: null };
        }

        colunas.forEach((coluna, indice) => {
          linha[coluna] = consulta.parametros[indice] ?? null;
        });
        return { linhasAfetadas: 1, idGerado: null };
      },
    },
    leituras,
    escritas,
    linha(id) {
      return linhasPorId.get(id) ?? null;
    },
    retrato() {
      return JSON.stringify([...linhasPorId.entries()]);
    },
  };
}

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const ID = 11;
const AUTOR = 3;
const ENDERECO = 'https://exemplo.test/?p=11';
const MODIFICADO_EM = '2026-10-08 12:00:00';

/** O identificador do termo que a opcao `default_category` guarda. */
const TERMO_PADRAO = 1;

const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'author',
    capacidades: [
      { capacidade: 'edit_posts', concedida: true },
      { capacidade: 'publish_posts', concedida: true },
    ],
  },
];

const BASE: BaseDeAutorizacao = {
  matriz: MATRIZ,
  rede: REDE_INATIVA_NA_AUTORIZACAO,
};

/** A autora do conteudo, com a capacidade que CA-1.1 cobra antes da guarda. */
const ATOR: AtorDeAutorizacao = {
  contaId: AUTOR,
  login: 'autora',
  existe: true,
  concessoes: [{ capacidade: 'author', concedida: true }],
};

const TIPO_POST: TipoDeConteudoNaAutorizacao = {
  nome: 'post',
  traduzMetaCapacidade: true,
  capacidades: {
    edit_posts: 'edit_posts',
    publish_posts: 'publish_posts',
  },
};

/**
 * A categoria, que entra no laco do termo padrao **por nome** mesmo sem
 * `default_term` declarado (`wp-includes/post.php:5422`). Esta em todos os
 * cenarios de proposito: com ela, e com a opcao em `1`, o caminho completo
 * **escreve** — logo o zero dos tres primeiros casos e consequencia da guarda, e
 * nao de um cenario montado sem nada para acontecer.
 */
const TAXONOMIA_DA_CATEGORIA: TaxonomiaNaPublicacao = {
  nome: TAXONOMIA_DE_CATEGORIA,
  declaraTermoPadrao: false,
};

/** As 23 colunas de `posts`. `guid` vazio: ver o comentario de UT-023-2. */
function linhaDeConteudo(estado: string): LinhaDeResultado {
  return {
    ID,
    post_author: AUTOR,
    post_date: MODIFICADO_EM,
    post_date_gmt: DATA_SENTINELA,
    post_content: 'corpo',
    post_title: 'titulo',
    post_excerpt: '',
    post_status: estado,
    comment_status: 'open',
    ping_status: 'open',
    post_password: '',
    post_name: 'titulo',
    to_ping: '',
    pinged: '',
    post_modified: MODIFICADO_EM,
    post_modified_gmt: '2026-10-08 15:00:00',
    post_content_filtered: '',
    post_parent: 0,
    guid: '',
    menu_order: 0,
    post_type: 'post',
    post_mime_type: '',
    comment_count: 3,
  };
}

interface Cenario {
  readonly modulo: ModuloDeConteudo;
  readonly contexto: ContextoDePublicacao;
  readonly tabela: TabelaEmMemoria;
  /** Os pontos de extensao disparados, na ordem — a "extensao que escuta". */
  readonly pontos: string[];
  /** As chamadas a `wp_set_post_terms()`, na ordem. */
  readonly termosDefinidos: { taxonomia: string; termos: readonly number[] }[];
  /** As chamadas a `wp_clear_scheduled_hook()`, na ordem. */
  readonly limpezasDaFila: { gancho: string; argumentos: readonly unknown[] }[];
  /** As opcoes de termo padrao consultadas, na ordem. */
  readonly opcoesLidas: string[];
  /** As mensagens que sairam pela porta de e-mail. */
  readonly emailsEnviados: MensagemDeEmail[];
  /** Quantas vezes `get_object_taxonomies()` foi chamada. */
  readonly leiturasDeTaxonomia: () => number;
  /** Quantas vezes a porta de relogio foi lida. */
  readonly leiturasDoRelogio: () => number;
  /** Quantos enderecos foram resolvidos (`get_permalink()`). */
  readonly enderecosResolvidos: () => number;
}

function cenario(estado: string): Cenario {
  const tabela = criarTabelaEmMemoria([linhaDeConteudo(estado)]);

  const pontos: string[] = [];
  const termosDefinidos: Cenario['termosDefinidos'] = [];
  const limpezasDaFila: Cenario['limpezasDaFila'] = [];
  const opcoesLidas: string[] = [];
  const emailsEnviados: MensagemDeEmail[] = [];
  let leiturasDeTaxonomia = 0;
  let leiturasDoRelogio = 0;
  let enderecosResolvidos = 0;

  // A extensao de terceiro do cenario `@idempotencia`: registrada nos onze
  // pontos do caminho, cada um anotando o proprio nome. Numa republicacao esta
  // lista tem de terminar vazia — e a ausencia do ponto que uma extensao
  // observa, e e ela que BR-MIGRAR-007 poe no comportamento.
  const ganchos: GanchosDaPublicacao = {
    filtrarGuid(guid) {
      pontos.push('get_the_guid');
      return guid;
    },
    aoEntrarEmPublicadoPeloPontoDepreciado(gancho) {
      pontos.push(gancho);
    },
    aoTransitarEstado() {
      pontos.push('transition_post_status');
    },
    aoTransitarDeParaEstado(gancho) {
      pontos.push(gancho);
    },
    aoEntrarNoEstadoDoTipo(gancho) {
      pontos.push(gancho);
    },
    aoEditarConteudoDoTipo(gancho) {
      pontos.push(gancho);
    },
    aoEditarConteudo() {
      pontos.push('edit_post');
    },
    aoGravarConteudoDoTipo(gancho) {
      pontos.push(gancho);
    },
    aoGravarConteudo() {
      pontos.push('save_post');
    },
    aoInserirConteudo() {
      pontos.push('wp_insert_post');
    },
    depoisDeInserirConteudo() {
      pontos.push('wp_after_insert_post');
    },
  };

  const modulo = criarModuloDeConteudo({
    dados: tabela.porta,
    email: {
      enviar(mensagem) {
        emailsEnviados.push(mensagem);
        return { enviado: true };
      },
    },
    relogio: {
      agoraEmSegundos() {
        leiturasDoRelogio += 1;
        return 0;
      },
    },
  });

  const contexto: ContextoDePublicacao = {
    base: BASE,
    ator: ATOR,
    // O armazenamento do modulo composto, e nao um repositorio montado aqui: o
    // que este nivel afirma e o caminho que a composicao entrega.
    armazenamento: modulo.armazenamento,
    classificacao: {
      taxonomiasDoTipo() {
        leiturasDeTaxonomia += 1;
        return [TAXONOMIA_DA_CATEGORIA];
      },
      termosDoConteudo() {
        return { erro: false, termos: [] };
      },
      opcaoDeTermoPadrao(chave) {
        opcoesLidas.push(chave);
        return chave === OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA ? TERMO_PADRAO : 0;
      },
      definirTermos(_conteudoId, termos, taxonomia) {
        termosDefinidos.push({ taxonomia, termos });
      },
    },
    fila: {
      /*
        `agendarEventoUnico` entrou em `FilaNaPublicacao` com T013, e este dublê
        nasceu antes, numa árvore que não o tinha — o merge das duas só acusou
        no `tsc`. Devolve `true` porque esta suíte não agenda nada: ela existe
        para o contexto estar completo, não para ser exercitada. Quem agenda
        tem suíte própria (US-6).
      */
      agendarEventoUnico() {
        return true;
      },
      limparGancho(gancho, argumentos) {
        limpezasDaFila.push({ gancho, argumentos });
        return 1;
      },
    },
    tipoDeConteudo(nome) {
      return nome === 'post' ? TIPO_POST : null;
    },
    // `dataGmtDeDataLocal` entrou em `ContextoDePublicacao` com T013, e este
    // dublê nasceu antes. Identidade, porque nenhuma afirmação desta suíte
    // passa por conversão de fuso — quem converte tem suíte própria (US-6).
    dataGmtDeDataLocal: (dataLocal: string) => dataLocal,
    enderecoDoConteudo() {
      enderecosResolvidos += 1;
      return ENDERECO;
    },
    ganchos,
  };

  return {
    modulo,
    contexto,
    tabela,
    pontos,
    termosDefinidos,
    limpezasDaFila,
    opcoesLidas,
    emailsEnviados,
    leiturasDeTaxonomia: () => leiturasDeTaxonomia,
    leiturasDoRelogio: () => leiturasDoRelogio,
    enderecosResolvidos: () => enderecosResolvidos,
  };
}

/* ── OS QUATRO CASOS DO CATALOGO ───────────────────────────────────────────── */

test('UT-023-1 retorna sucesso sem alterar o registro ao republicar o ja publicado (CA-5.1)', () => {
  const { modulo, contexto, tabela, enderecosResolvidos } =
    cenario(ESTADO_PUBLICADO);

  const antes = tabela.retrato();
  const resultado = modulo.publicar(contexto, { conteudoId: ID });

  // "Sucesso": nenhuma recusa e nenhum erro. `wp_publish_post()` nao devolve
  // valor nenhum em nenhum dos dois caminhos (`:5502`), logo e isto que ha para
  // observar — o desfecho `ja-publicado` e diagnostico acrescentado, e nenhuma
  // decisao do sistema depende dele (**P7**).
  assert.equal(resultado.desfecho, 'ja-publicado');
  assert.equal(resultado.recusa, null);

  // "Sem alterar o registro": o retrato da tabela, as 23 colunas, byte a byte —
  // e zero comando de escrita. Nem o `UPDATE` do estado (`:5446`), nem o do
  // `guid` (`:8160`).
  assert.equal(tabela.retrato(), antes);
  assert.deepEqual(tabela.escritas, []);

  // A sequencia de comandos e UMA leitura: a guarda e a terceira linha de
  // `wp_publish_post()`, logo a leitura que traz o estado (`:5407`) acontece e
  // as outras duas — `$post_before` (`:5417`) e o `guid` dentro do ouvinte
  // (`:8159`) — ficam para depois dela, e nao saem.
  assert.deepEqual(
    tabela.leituras.map((consulta) => consulta.texto),
    [LEITURA_DA_LINHA],
  );
  assert.deepEqual(tabela.leituras[0]?.parametros, [ID]);

  // E o que o chamador tem em maos e a linha como ela esta: o legado reescreve o
  // objeto em memoria (`$post->post_status = 'publish'`, `:5451`) **depois** da
  // guarda, logo aqui nada foi reescrito nem resolvido.
  assert.equal(resultado.conteudo?.estado, ESTADO_PUBLICADO);
  assert.equal(resultado.conteudo?.guid, '');
  assert.equal(resultado.conteudo?.modificadoEm, MODIFICADO_EM);
  assert.equal(resultado.endereco, false);
  assert.equal(enderecosResolvidos(), 0);
});

test('UT-023-2 nao dispara transicao de estado nesse caminho (CA-5.2)', () => {
  const { modulo, contexto, tabela, pontos } = cenario(ESTADO_PUBLICADO);

  modulo.publicar(contexto, { conteudoId: ID });

  // Os tres pontos de `wp_transition_post_status()` nomeados um a um, porque e
  // por nome que uma extensao de terceiro se registra: `transition_post_status`
  // (`:5922`), `publish_to_publish` (`:5940`) e `publish_post` (`:5980`). E o
  // ponto depreciado do ouvinte do nucleo (`:8171`), que apesar do nome dispara
  // em toda entrada em publicado.
  for (const ponto of [
    'transition_post_status',
    nomeDoPontoDeParaEstado(ESTADO_PUBLICADO, ESTADO_PUBLICADO),
    nomeDoPontoDeEstadoDoTipo(ESTADO_PUBLICADO, 'post'),
    PONTO_DEPRECIADO_DE_ENTRADA_EM_PUBLICADO,
  ]) {
    assert.ok(!pontos.includes(ponto), ponto);
  }

  // *"E uma extensao que escute transicao de estado nao e chamada em nenhuma
  // das duas"*: a extensao do cenario esta registrada nos onze pontos do
  // caminho, e a lista vazia e a afirmacao.
  assert.deepEqual(pontos, []);

  // O ouvinte do nucleo (`_transition_post_status()`, `:8154`) e quem repoe o
  // `guid` vazio — e o `guid` deste cenario esta vazio justamente para que a
  // omissao seja visivel: no caminho completo, a coluna seria reescrita.
  assert.deepEqual(tabela.escritas, []);
  assert.equal(tabela.linha(ID)?.['guid'], '');
});

test('UT-023-3 nao aciona notificacao, agendamento nem automacao ligada a publicacao (CA-5.3)', () => {
  const {
    modulo,
    contexto,
    tabela,
    termosDefinidos,
    opcoesLidas,
    limpezasDaFila,
    emailsEnviados,
    leiturasDeTaxonomia,
    leiturasDoRelogio,
  } = cenario(ESTADO_PUBLICADO);

  const resultado = modulo.publicar(contexto, { conteudoId: ID });
  assert.equal(resultado.desfecho, 'ja-publicado');

  // Notificacao: o aviso ao autor de US-9 (T019) pende da transicao, e a
  // transicao nao aconteceu — que e o que a historia pede, *"repetir a chamada
  // sem disparar notificacao ou automacao duas vezes"*. O relogio tambem nao e
  // lido, porque esta operacao nao carimba `post_modified` em nenhum dos dois
  // caminhos.
  assert.deepEqual(emailsEnviados, []);
  assert.equal(leiturasDoRelogio(), 0);

  // Agendamento: `wp_clear_scheduled_hook( 'publish_future_post', ... )`
  // (`:8189`) nao e chamado.
  assert.equal(
    limpezasDaFila.some(
      (limpeza) => limpeza.gancho === GANCHO_DE_PUBLICACAO_AGENDADA,
    ),
    false,
  );
  assert.deepEqual(limpezasDaFila, []);

  // Automacao do termo padrao: o laco de `:5420`-`:5443` fica inteiro atras da
  // guarda, logo as taxonomias do tipo nao sao lidas, a opcao nao e consultada e
  // nada e atribuido.
  assert.equal(leiturasDeTaxonomia(), 0);
  assert.deepEqual(opcoesLidas, []);
  assert.deepEqual(termosDefinidos, []);
  assert.deepEqual(resultado.termosPadraoAtribuidos, []);
  assert.equal(resultado.efeitosDaTransicao, null);

  // E `_publish_post_hook()` — ouvinte de `publish_post` com prioridade 5
  // (`wp-includes/default-filters.php:447`) — nao roda, logo `_pingme` e
  // `_encloseme` nao sao gravados em `postmeta` (`:8236`-`:8248`).
  for (const consulta of [...tabela.leituras, ...tabela.escritas]) {
    assert.ok(!consulta.texto.includes('postmeta'), consulta.texto);
  }
});

test('UT-023-4 mantem efeito unico quando a publicacao e pedida muitas vezes seguidas (BR-MIGRAR-007)', () => {
  const cen = cenario('draft');

  // A primeira chamada publica de verdade: duas escritas (o estado e o `guid`
  // vazio), um termo atribuido, um evento limpo e os pontos na ordem. E dela que
  // sai o "efeito unico" que as seguintes nao podem acrescentar.
  const primeira = cen.modulo.publicar(cen.contexto, { conteudoId: ID });
  assert.equal(primeira.desfecho, 'publicado');
  assert.equal(primeira.estadoAnterior, 'draft');
  assert.ok(
    cen.pontos.includes(nomeDoPontoDeParaEstado('draft', ESTADO_PUBLICADO)),
  );

  const retratoDepoisDaPrimeira = cen.tabela.retrato();
  const escritasDaPrimeira = cen.tabela.escritas.map(
    (consulta) => consulta.texto,
  );
  const pontosDaPrimeira = [...cen.pontos];
  assert.equal(escritasDaPrimeira.length, 2);
  assert.equal(cen.limpezasDaFila.length, 1);
  assert.deepEqual(cen.termosDefinidos, [
    { taxonomia: TAXONOMIA_DE_CATEGORIA, termos: [TERMO_PADRAO] },
  ]);
  assert.equal(cen.tabela.linha(ID)?.['guid'], ENDERECO);

  // Dali em diante a linha esta publicada na tabela, e e ela que cada chamada
  // nova le. Quatro pedidos seguidos, e nenhum deles e falha.
  for (let tentativa = 1; tentativa <= 4; tentativa += 1) {
    const repetida = cen.modulo.publicar(cen.contexto, { conteudoId: ID });
    assert.equal(repetida.desfecho, 'ja-publicado', `tentativa ${tentativa}`);
    assert.equal(repetida.recusa, null, `tentativa ${tentativa}`);
  }

  // O efeito continua sendo o da primeira: mesmo retrato da tabela, mesma
  // sequencia de escritas, mesma sequencia de pontos, um termo, um evento limpo,
  // nenhum e-mail.
  assert.equal(cen.tabela.retrato(), retratoDepoisDaPrimeira);
  assert.deepEqual(
    cen.tabela.escritas.map((consulta) => consulta.texto),
    escritasDaPrimeira,
  );
  assert.deepEqual(cen.pontos, pontosDaPrimeira);
  assert.equal(cen.limpezasDaFila.length, 1);
  assert.equal(cen.termosDefinidos.length, 1);
  assert.deepEqual(cen.emailsEnviados, []);

  // O que cada uma das quatro chamadas seguintes fez foi **uma leitura**, a da
  // guarda: tres na primeira (`:5407`, `:5417` e o `guid` em `:8159`) e uma por
  // repeticao.
  assert.equal(cen.tabela.leituras.length, 3 + 4);

  // *"Idempotencia por guarda de estado, nao por chave de evento"*
  // (BR-MIGRAR-007): nada foi desduplicado por identificador de pedido ou de
  // evento — e o estado **gravado** que faz as quatro chamadas seguintes nao
  // produzirem efeito, e e por isso que este caso precisa de uma tabela que
  // guarde o que a primeira escreveu.
  assert.equal(cen.tabela.linha(ID)?.['post_status'], ESTADO_PUBLICADO);
});
