/**
 * Testes da entrega de **T011**: *"o comportamento de US-5 existe e os criterios
 * CA-5.1, CA-5.2, CA-5.3 passam contra o sistema novo"*.
 *
 * **Nao sao os quatro testes de `backlog/tests.md`** — UT-023-1 a UT-023-4 sao
 * **T012**, a tarefa `[P]` que roda em paralelo com esta. Aqui se afirma o que
 * esta tarefa entrega, criterio por criterio.
 *
 * **O meio de prova desta historia e a AUSENCIA**, e e por isso que a porta de
 * dados daqui registra comando em vez de simular banco: o criterio de aceite
 * desta area e *"efeito no banco"* (Decisao 2 de `parity_specs.md`, area 3), e
 * `parity_specs.md` manda comparar *"snapshot + sequencia de comandos"*. O
 * cenario `@idempotencia` de
 * `.specify/migration/parity_tests/02-publicacao-e-agendamento-de-conteudo.feature`
 * pede as tres coisas que este arquivo afirma:
 *
 * > Dado um conteudo ja publicado
 * > Quando a publicacao e pedida de novo
 * > Entao nenhuma das duas metades altera qualquer campo
 * > E nenhum gancho de transicao de estado dispara em nenhuma das duas
 * > E uma extensao que escute transicao de estado nao e chamada em nenhuma das duas
 *
 * Lista vazia, portanto, e **afirmacao** e nao descuido: `escritas`, `selecoes`,
 * `pontos`, `termosDefinidos` e `limpezasDaFila` sao contadores, e o que esta
 * suite cobra deles e o zero.
 *
 * Cada afirmacao foi conferida contra o codigo do sistema analisado, legivel em
 * disco em `~/Downloads/wordpress` (WordPress 7.1.2, a mesma versao do pacote),
 * e por isso cita arquivo e linha. Quando o oraculo executavel existir (T001 da
 * feature 015), e por essas linhas que a comparacao caso a caso passa a rodar —
 * `parity_specs.md` registra que nao ha oraculo executavel nesta arvore.
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
import { criarRepositorioDeConteudo, DATA_SENTINELA } from '../armazenamento/index.js';
import {
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import { ESTADOS_EDITORIAIS } from '../estado-editorial.js';
import { criarModuloDeConteudo } from '../index.js';
import type {
  LinhaDeResultado,
  MensagemDeEmail,
  PortaDeEmail,
  PortaDeRelogio,
} from '../portas/index.js';
import {
  CODIGO_DE_RECUSA_DE_PUBLICACAO,
  ESTADO_PUBLICADO,
  OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
  TAXONOMIA_DE_CATEGORIA,
  ehRepublicacaoNula,
  publicar,
  transitarParaPublicado,
  type ContextoDePublicacao,
  type GanchosDaPublicacao,
  type TaxonomiaNaPublicacao,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const ID = 42;
const ENDERECO = 'https://exemplo.test/?p=42';

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
  {
    identificador: 'contributor',
    capacidades: [{ capacidade: 'edit_posts', concedida: true }],
  },
];

const BASE: BaseDeAutorizacao = {
  matriz: MATRIZ,
  rede: REDE_INATIVA_NA_AUTORIZACAO,
};

function ator(papel: string): AtorDeAutorizacao {
  return {
    contaId: 7,
    login: papel,
    existe: true,
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

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
 * `default_term` declarado (`wp-includes/post.php:5422`).
 *
 * Ela esta em todos os cenarios deste arquivo de proposito: com ela e com a
 * opcao em `1`, o caminho completo **escreve** — logo o zero que os testes
 * afirmam e consequencia da guarda, e nao de um cenario montado sem nada para
 * acontecer.
 */
const TAXONOMIA_DA_CATEGORIA: TaxonomiaNaPublicacao = {
  nome: TAXONOMIA_DE_CATEGORIA,
  declaraTermoPadrao: false,
};

/** As 23 colunas de `posts`, com os defaults do cenario. */
function linhaDeConteudo(
  campos: Partial<Record<string, string | number>> = {},
): LinhaDeResultado {
  return {
    ID,
    post_author: 7,
    post_date: '2026-10-08 12:00:00',
    post_date_gmt: DATA_SENTINELA,
    post_content: 'corpo',
    post_title: 'titulo',
    post_excerpt: '',
    post_status: ESTADO_PUBLICADO,
    comment_status: 'open',
    ping_status: 'open',
    post_password: '',
    post_name: 'titulo',
    to_ping: '',
    pinged: '',
    post_modified: '2026-10-08 12:00:00',
    post_modified_gmt: '2026-10-08 15:00:00',
    post_content_filtered: '',
    post_parent: 0,
    guid: '',
    menu_order: 0,
    post_type: 'post',
    post_mime_type: '',
    comment_count: 3,
    ...campos,
  };
}

interface Cenario {
  readonly contexto: ContextoDePublicacao;
  readonly dados: PortaDeDadosFalsa;
  /** Os pontos de extensao disparados, na ordem. */
  readonly pontos: string[];
  /** As chamadas a `wp_set_post_terms()`, na ordem. */
  readonly termosDefinidos: { taxonomia: string; termos: readonly number[] }[];
  /** As chamadas a `wp_clear_scheduled_hook()`, na ordem. */
  readonly limpezasDaFila: { gancho: string; argumentos: readonly unknown[] }[];
  /** As opcoes de termo padrao consultadas, na ordem. */
  readonly opcoesLidas: string[];
  /** Quantas vezes `get_object_taxonomies()` foi chamada. */
  readonly leiturasDeTaxonomia: () => number;
  /** Quantos enderecos foram resolvidos (`get_permalink()`). */
  readonly enderecosResolvidos: () => number;
}

interface OpcoesDoCenario {
  readonly papel?: string;
  readonly estado?: string;
  readonly linha?: LinhaDeResultado;
  /**
   * Quantas linhas a porta responde. **O caminho nulo faz UMA leitura**, e o
   * caminho completo faz tres (`:5407`, `:5417` e o `guid` em `:8159`).
   */
  readonly leituras?: number;
}

function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const dados = criarPortaDeDadosFalsa();
  const linha =
    opcoes.linha ??
    linhaDeConteudo(
      opcoes.estado === undefined ? {} : { post_status: opcoes.estado },
    );
  for (let i = 0; i < (opcoes.leituras ?? 3); i += 1) {
    dados.responder([linha]);
  }

  const pontos: string[] = [];
  const termosDefinidos: Cenario['termosDefinidos'] = [];
  const limpezasDaFila: Cenario['limpezasDaFila'] = [];
  const opcoesLidas: string[] = [];
  let leiturasDeTaxonomia = 0;
  let enderecosResolvidos = 0;

  // Os dez pontos de extensao do caminho, cada um anotando o proprio nome. Numa
  // republicacao esta lista tem de terminar vazia: e a ausencia do ponto que uma
  // extensao observa, e e ela que BR-MIGRAR-007 poe no comportamento.
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

  const contexto: ContextoDePublicacao = {
    base: BASE,
    ator: ator(opcoes.papel ?? 'author'),
    armazenamento: { conteudo: criarRepositorioDeConteudo(dados.porta) },
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
      limparGancho(gancho, argumentos) {
        limpezasDaFila.push({ gancho, argumentos });
        return 1;
      },
    },
    tipoDeConteudo(nome) {
      return nome === 'post' ? TIPO_POST : null;
    },
    enderecoDoConteudo() {
      enderecosResolvidos += 1;
      return ENDERECO;
    },
    ganchos,
  };

  return {
    contexto,
    dados,
    pontos,
    termosDefinidos,
    limpezasDaFila,
    opcoesLidas,
    leiturasDeTaxonomia: () => leiturasDeTaxonomia,
    enderecosResolvidos: () => enderecosResolvidos,
  };
}

/* ── CA-5.1: SUCESSO, SEM ALTERAR O REGISTRO ───────────────────────────────── */

test('CA-5.1 pedir a publicacao do que ja esta publicado nao altera campo nenhum', () => {
  const { contexto, dados } = cenario();

  const resultado = publicar(contexto, { conteudoId: ID });

  assert.equal(resultado.desfecho, 'ja-publicado');

  // *"Entao nenhuma das duas metades altera qualquer campo"*: zero comandos de
  // escrita. Nem o `UPDATE` do estado (`:5446`), nem o do `guid` que o ouvinte
  // da transicao faria com o `guid` vazio deste cenario (`:8160`).
  assert.deepEqual(dados.escritas, []);
});

test('CA-5.1 o registro devolvido e a linha como ela esta, sem o estado reescrito em memoria', () => {
  const { contexto } = cenario();

  const resultado = publicar(contexto, { conteudoId: ID });

  // No caminho completo o legado reescreve o objeto em memoria antes dos pontos
  // (`$post->post_status = 'publish'`, `:5451`). Aqui ele devolve **antes** de
  // qualquer atribuicao, logo o que o chamador tem em maos e a linha lida.
  assert.equal(resultado.conteudo?.estado, ESTADO_PUBLICADO);
  assert.equal(resultado.conteudo?.id, ID);
  assert.equal(resultado.conteudo?.guid, '');
  assert.equal(resultado.conteudo?.modificadoEm, '2026-10-08 12:00:00');
  assert.equal(resultado.conteudo?.identificadorNaUrl, 'titulo');
  assert.equal(resultado.conteudo?.contagemDeComentarios, 3);
});

test('CA-5.1 e sucesso, e nao recusa: nenhum erro, nenhuma mensagem e nenhum efeito', () => {
  const { contexto, enderecosResolvidos } = cenario();

  const resultado = publicar(contexto, { conteudoId: ID });

  // `wp_publish_post()` nao devolve valor nenhum em nenhum dos dois caminhos —
  // *"wp_publish_post() returns no meaningful value"* (`:5502`). Logo "sucesso"
  // e observavel como ausencia de recusa somada a ausencia de efeito, e e isso
  // que se afirma aqui: inventar codigo de erro, aviso ou numero de HTTP para
  // esta porta seria inventar superficie que o legado nao tem (P8).
  assert.equal(resultado.recusa, null);
  assert.equal(resultado.estadoAnterior, null);
  assert.deepEqual(resultado.termosPadraoAtribuidos, []);
  assert.equal(resultado.efeitosDaTransicao, null);

  // E o endereco nao e resolvido: o passo 7 de UC-03 (*"devolve o conteudo
  // publicado com o endereco definitivo"*) e do desfecho `publicado`, e aqui
  // nao houve publicacao nenhuma para ter endereco novo.
  assert.equal(resultado.endereco, false);
  assert.equal(enderecosResolvidos(), 0);
});

test('CA-5.1 sai UMA leitura, e nao as tres do caminho completo', () => {
  const { contexto, dados } = cenario();

  publicar(contexto, { conteudoId: ID });

  // A guarda e a terceira linha da funcao: a leitura 1 (`:5407`) aconteceu
  // porque e ela que traz o estado, e as outras duas — `$post_before` (`:5417`)
  // e o `guid` dentro do ouvinte (`:8159`) — ficam para depois dela. A
  // sequencia de comandos e parte do que a area 3 da Decisao 2 compara.
  assert.equal(dados.selecoes.length, 1);
  assert.equal(
    dados.selecoes[0]?.texto,
    'SELECT * FROM wp_posts WHERE ID = ? LIMIT 1',
  );
  assert.deepEqual(
    dados.selecoes[0]?.parametros.map(textoDoParametro),
    ['42'],
  );
});

test('CA-5.1 a nulidade nao e porta de servico: a capacidade continua sendo cobrada antes', () => {
  const { contexto, dados, pontos } = cenario({ papel: 'contributor' });

  const resultado = publicar(contexto, { conteudoId: ID });

  // A ordem e a da superficie do legado: `handle_status_param()` recusa durante
  // a validacao do pedido, **antes** de qualquer escrita e sem olhar o estado
  // corrente (`class-wp-rest-posts-controller.php:1586`). Logo quem nao pode
  // publicar recebe a recusa de CA-1.1, e nao o sucesso vazio de CA-5.1 — o
  // resultado observavel (nada acontece) e o mesmo, a resposta nao.
  assert.equal(resultado.desfecho, 'recusado');
  assert.equal(resultado.recusa?.codigo, CODIGO_DE_RECUSA_DE_PUBLICACAO);
  assert.deepEqual(dados.escritas, []);
  assert.deepEqual(pontos, []);
});

/* ── CA-5.2: NENHUMA TRANSICAO DE ESTADO ───────────────────────────────────── */

test('CA-5.2 nenhum dos tres pontos da transicao dispara, e nenhum outro do caminho', () => {
  const { contexto, pontos } = cenario();

  publicar(contexto, { conteudoId: ID });

  // Nomeados um a um, porque e por nome que uma extensao de terceiro se
  // registra: `transition_post_status` (`:5922`), `publish_to_publish`
  // (`:5940`) e `publish_post` (`:5980`).
  for (const ponto of [
    'transition_post_status',
    'publish_to_publish',
    'publish_post',
  ]) {
    assert.ok(!pontos.includes(ponto), ponto);
  }

  // *"E nenhum gancho de transicao de estado dispara em nenhuma das duas. E uma
  // extensao que escute transicao de estado nao e chamada em nenhuma das duas"*.
  // Os dez pontos do caminho estao registrados neste cenario; a lista vazia e a
  // afirmacao.
  assert.deepEqual(pontos, []);
});

test('CA-5.2 o ouvinte do nucleo nao roda: nem o guid, nem o ponto depreciado, nem a fila', () => {
  const { contexto, dados, limpezasDaFila, pontos } = cenario();

  publicar(contexto, { conteudoId: ID });

  // `_transition_post_status()` (`:8154`) e quem repoe o `guid` vazio (`:8160`),
  // dispara `private_to_published` (`:8171`) e limpa `publish_future_post`
  // (`:8189`) — os tres sao efeito da transicao, e sem transicao nenhum deles
  // acontece. O `guid` deste cenario esta vazio justamente para que a omissao
  // seja visivel: no caminho completo, ele seria reescrito.
  assert.deepEqual(dados.escritas, []);
  assert.deepEqual(limpezasDaFila, []);
  assert.ok(!pontos.includes('get_the_guid'));
  assert.ok(!pontos.includes('private_to_published'));
});

test('CA-5.2 a nulidade e da funcao do legado, nao da superficie', () => {
  // O registro vem de fora, como `get_post()` o devolveria.
  const origem = criarPortaDeDadosFalsa();
  origem.responder([linhaDeConteudo()]);
  const registro = criarRepositorioDeConteudo(origem.porta).obterPorId(ID);
  assert.ok(registro !== null);

  const { contexto, dados, pontos } = cenario({ leituras: 0 });

  // `wp_publish_post()` sem portao de capacidade, com o registro em maos — e e
  // esta a forma que `check_and_publish_future_post()` (`:5503`) e qualquer
  // extensao alcancam. Com o registro em maos o legado nao consulta, logo aqui
  // nem a leitura 1 sai: a guarda decide sobre o estado que ja veio.
  const resultado = transitarParaPublicado(contexto, registro);

  assert.equal(resultado.desfecho, 'ja-publicado');
  assert.deepEqual(dados.selecoes, []);
  assert.deepEqual(dados.escritas, []);
  assert.deepEqual(pontos, []);
});

test('CA-5.2 a guarda e literal sobre `publish`: os outros 11 estados transitam', () => {
  // BR-MIGRAR-007 e uma guarda de ESTADO, com o `===` do legado (`:5413`).
  // `private` (US-4) e `future` (US-6) **nao** sao alcancados por ela, e tratar
  // qualquer um dos dois como "ja publicado" romperia aquelas historias em
  // silencio — a diferenca seria um gancho que deixa de disparar.
  const nulos = ESTADOS_EDITORIAIS.filter((estado) => ehRepublicacaoNula(estado));
  assert.deepEqual(nulos, [ESTADO_PUBLICADO]);

  for (const estado of ESTADOS_EDITORIAIS) {
    const { contexto, pontos } = cenario({ estado });
    const resultado = publicar(contexto, { conteudoId: ID });

    if (estado === ESTADO_PUBLICADO) {
      assert.equal(resultado.desfecho, 'ja-publicado', estado);
      assert.deepEqual(pontos, [], estado);
      continue;
    }

    assert.equal(resultado.desfecho, 'publicado', estado);
    assert.equal(resultado.estadoAnterior, estado);
    assert.ok(pontos.includes(`${estado}_to_publish`), estado);
  }

  // E o vocabulario fechado nao e a fronteira: a coluna e `varchar(20)` sem
  // `ENUM` e sem `CHECK` (`DB-ENUM`), e estado de extensao tambem transita.
  assert.equal(ehRepublicacaoNula('estado-de-extensao'), false);
  assert.equal(ehRepublicacaoNula(''), false);
});

/* ── CA-5.3: NENHUMA NOTIFICACAO, AGENDAMENTO NEM AUTOMACAO ────────────────── */

test('CA-5.3 a automacao do termo padrao nao e nem consultada', () => {
  const { contexto, termosDefinidos, opcoesLidas, leiturasDeTaxonomia } =
    cenario();

  publicar(contexto, { conteudoId: ID });

  // O laco de `:5420`-`:5443` fica inteiro atras da guarda: as taxonomias do
  // tipo nao sao lidas, a opcao do termo padrao nao e consultada e nada e
  // atribuido.
  assert.equal(leiturasDeTaxonomia(), 0);
  assert.deepEqual(opcoesLidas, []);
  assert.deepEqual(termosDefinidos, []);
});

test('CA-5.3 e e a guarda que para a automacao: o MESMO cenario em rascunho escreve', () => {
  const { contexto, termosDefinidos, opcoesLidas, limpezasDaFila } = cenario({
    estado: 'draft',
  });

  publicar(contexto, { conteudoId: ID });

  // O contraste e a prova: nada foi omitido do cenario para que o zero
  // aparecesse. Com a categoria no laco e a opcao em 1, o caminho completo
  // atribui o termo (CA-1.4) e limpa o evento agendado (CA-1.5).
  assert.deepEqual(opcoesLidas, [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]);
  assert.deepEqual(termosDefinidos, [
    { taxonomia: TAXONOMIA_DE_CATEGORIA, termos: [TERMO_PADRAO] },
  ]);
  assert.equal(limpezasDaFila.length, 1);
});

test('CA-5.3 nenhum agendamento e tocado, e `_publish_post_hook` nao chega a rodar', () => {
  const { contexto, limpezasDaFila, pontos, dados } = cenario();

  publicar(contexto, { conteudoId: ID });

  // Duas coisas, e as duas sao agendamento: `wp_clear_scheduled_hook(
  // 'publish_future_post', ... )` (`:8189`) nao e chamado, e `_publish_post_hook()`
  // — ouvinte de `publish_post` com prioridade 5
  // (`wp-includes/default-filters.php:447`) — nao roda, logo `_pingme` e
  // `_encloseme` nao sao gravados em `postmeta` e `do_pings` nao e agendado
  // (`:8236`-`:8248`).
  assert.deepEqual(limpezasDaFila, []);
  assert.ok(!pontos.includes('publish_post'));
  for (const consulta of dados.escritas) {
    assert.ok(!consulta.texto.includes('postmeta'), consulta.texto);
  }
});

test('CA-5.3 nenhuma notificacao sai: as portas de e-mail e de relogio nao sao tocadas', () => {
  const enviadas: MensagemDeEmail[] = [];
  let leiturasDoRelogio = 0;

  const email: PortaDeEmail = {
    enviar(mensagem) {
      enviadas.push(mensagem);
      return { enviado: true };
    },
  };
  const relogio: PortaDeRelogio = {
    agoraEmSegundos() {
      leiturasDoRelogio += 1;
      return 0;
    },
  };

  const { contexto, dados } = cenario();
  const modulo = criarModuloDeConteudo({
    dados: dados.porta,
    email,
    relogio,
  });

  const resultado = modulo.publicar(contexto, { conteudoId: ID });

  // O aviso ao autor de US-9 (T019) pende da transicao, e a transicao nao
  // aconteceu — que e exatamente o que a historia pede, *"repetir a chamada sem
  // disparar notificacao ou automacao duas vezes"*. E o relogio nao e lido
  // porque `wp_publish_post()` nao carimba `post_modified` em nenhum dos dois
  // caminhos.
  assert.equal(resultado.desfecho, 'ja-publicado');
  assert.deepEqual(enviadas, []);
  assert.equal(leiturasDoRelogio, 0);
});

test('CA-5.3 repetir a chamada N vezes nao acrescenta efeito ao da primeira', () => {
  // A primeira chamada publica um rascunho: tres leituras, duas escritas (o
  // estado e o `guid` vazio) e os onze pontos na ordem. Dali em diante a linha
  // esta publicada, e a porta responde `publish` a cada nova leitura.
  const { contexto, dados, pontos, termosDefinidos, limpezasDaFila } = cenario({
    estado: 'draft',
  });

  const primeira = publicar(contexto, { conteudoId: ID });
  assert.equal(primeira.desfecho, 'publicado');

  const escritasDepoisDaPrimeira = dados.escritas.length;
  const pontosDepoisDaPrimeira = [...pontos];
  assert.equal(escritasDepoisDaPrimeira, 2);
  assert.equal(limpezasDaFila.length, 1);
  assert.deepEqual(termosDefinidos, [
    { taxonomia: TAXONOMIA_DE_CATEGORIA, termos: [TERMO_PADRAO] },
  ]);

  for (let tentativa = 0; tentativa < 4; tentativa += 1) {
    dados.responder([linhaDeConteudo()]);
    const repetida = publicar(contexto, { conteudoId: ID });

    assert.equal(repetida.desfecho, 'ja-publicado');
    assert.equal(repetida.recusa, null);
  }

  // *"Idempotencia por guarda de estado, nao por chave de evento"*
  // (BR-MIGRAR-007): nada foi desduplicado por identificador de evento — o
  // estado gravado e que faz as quatro chamadas seguintes nao produzirem efeito.
  assert.equal(dados.escritas.length, escritasDepoisDaPrimeira);
  assert.deepEqual(pontos, pontosDepoisDaPrimeira);
  assert.equal(limpezasDaFila.length, 1);
  assert.equal(termosDefinidos.length, 1);
});
