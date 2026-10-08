/**
 * Testes da entrega de **T003**: *"o comportamento de US-1 existe e os criterios
 * CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5 passam contra o sistema novo"*.
 *
 * **Nao sao os oito testes de `backlog/tests.md`** — UT-019-1 a UT-019-8 sao
 * **T004**, a tarefa `[P]` que roda em paralelo com esta. Aqui se afirma o que
 * esta tarefa entrega, criterio por criterio, pelos meios que a Decisao 2 fixa
 * para esta area: **efeito no banco** (*"snapshot + sequencia de comandos"*),
 * **valor devolvido pelo ponto de extensao** e **ordem de emissao** deles.
 *
 * E por isso que a porta de dados daqui **registra comando** em vez de simular
 * banco: e o que `armazenamento/porta-falsa.ts` existe para permitir, e e a
 * unica forma de afirmar o caso em que o legado **nao emite comando nenhum** —
 * a operacao nula de P7.
 *
 * Cada afirmacao foi conferida contra o codigo do sistema analisado, legivel em
 * disco em `~/Downloads/wordpress` (WordPress 7.1.2, a mesma versao do pacote),
 * e por isso cita arquivo e linha. Quando o oraculo executavel existir (T001 da
 * feature 015), e por essas linhas que a comparacao caso a caso passa a rodar.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ATOR_ANONIMO,
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type MatrizDePapeis,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarRepositorioDeConteudo,
  DATA_SENTINELA,
  type Conteudo,
} from '../armazenamento/index.js';
import {
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import type { LinhaDeResultado } from '../portas/index.js';
import { PROPRIEDADES_DO_ESTADO_EDITORIAL } from '../estado-editorial.js';
import {
  CODIGO_DE_RECUSA_DE_PUBLICACAO,
  ESTADO_PUBLICADO,
  GANCHO_DE_PUBLICACAO_AGENDADA,
  MENSAGEM_DE_RECUSA_DE_PUBLICACAO,
  OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
  PONTO_DEPRECIADO_DE_ENTRADA_EM_PUBLICADO,
  PREFIXO_DA_OPCAO_DE_TERMO_PADRAO,
  PRIORIDADE_DO_OUVINTE_DO_NUCLEO,
  chaveDoTermoPadrao,
  publicar,
  transitarParaPublicado,
  type ContextoDePublicacao,
  type GanchosDaPublicacao,
  type TaxonomiaNaPublicacao,
  type TermosDoConteudoNaPublicacao,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const ID = 42;
const ENDERECO = 'https://exemplo.test/?p=42';

/**
 * A matriz de papeis do cenario, com o recorte que esta tarefa exercita.
 *
 * Os nomes de capacidade sao os do legado: `publish_posts` e `publish_pages`
 * sao slots derivados de `capability_type` pelo registro do tipo
 * (`wp-includes/post.php:1884`), e nenhuma capacidade de pagina chega a autor —
 * *"a assimetria e deliberada"* (US-8).
 */
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
  {
    identificador: 'editor',
    capacidades: [
      { capacidade: 'edit_posts', concedida: true },
      { capacidade: 'publish_posts', concedida: true },
      { capacidade: 'edit_pages', concedida: true },
      { capacidade: 'publish_pages', concedida: true },
    ],
  },
];

const BASE: BaseDeAutorizacao = {
  matriz: MATRIZ,
  rede: REDE_INATIVA_NA_AUTORIZACAO,
};

function ator(papel: string, contaId = 7): AtorDeAutorizacao {
  return {
    contaId,
    login: papel,
    existe: true,
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

/** `get_post_type_object( 'post' )`, com os dois campos que decidem. */
const TIPO_POST: TipoDeConteudoNaAutorizacao = {
  nome: 'post',
  traduzMetaCapacidade: true,
  capacidades: {
    edit_posts: 'edit_posts',
    publish_posts: 'publish_posts',
  },
};

/** `get_post_type_object( 'page' )` — os slots valem outros nomes. */
const TIPO_PAGINA: TipoDeConteudoNaAutorizacao = {
  nome: 'page',
  traduzMetaCapacidade: true,
  capacidades: {
    edit_posts: 'edit_pages',
    publish_posts: 'publish_pages',
  },
};

/** As 23 colunas de `posts`, com os defaults do cenario. */
function linhaDeConteudo(campos: Partial<Record<string, string | number>> = {}): LinhaDeResultado {
  return {
    ID,
    post_author: 7,
    post_date: '2026-10-08 12:00:00',
    post_date_gmt: DATA_SENTINELA,
    post_content: 'corpo',
    post_title: 'titulo',
    post_excerpt: '',
    post_status: 'draft',
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
  /** Os ganchos registrados, para quem precisar substituir um deles. */
  readonly ganchos: GanchosDaPublicacao;
}

interface OpcoesDoCenario {
  readonly papel?: string;
  readonly atorDaRequisicao?: AtorDeAutorizacao;
  readonly linha?: LinhaDeResultado;
  readonly tipos?: Readonly<Record<string, TipoDeConteudoNaAutorizacao>>;
  readonly taxonomias?: readonly TaxonomiaNaPublicacao[];
  readonly termosDoConteudo?: Readonly<Record<string, TermosDoConteudoNaPublicacao>>;
  readonly opcoes?: Readonly<Record<string, number>>;
  readonly endereco?: string | false;
  readonly eventosRemovidos?: number | false;
  readonly filtrarGuid?: (guid: string, conteudoId: number) => string;
  /** Quantas linhas a porta responde. O caminho completo faz **tres** leituras. */
  readonly leituras?: number;
}

function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const dados = criarPortaDeDadosFalsa();
  const linha = opcoes.linha ?? linhaDeConteudo();
  for (let i = 0; i < (opcoes.leituras ?? 3); i += 1) {
    dados.responder([linha]);
  }

  const pontos: string[] = [];
  const termosDefinidos: Cenario['termosDefinidos'] = [];
  const limpezasDaFila: Cenario['limpezasDaFila'] = [];
  const opcoesLidas: string[] = [];

  const tipos = opcoes.tipos ?? { post: TIPO_POST, page: TIPO_PAGINA };
  const termosDoConteudo = opcoes.termosDoConteudo ?? {};
  const valoresDeOpcao = opcoes.opcoes ?? {};

  // Todos os dez pontos sao registrados, e cada um anota o proprio nome: e a
  // sequencia que a Decisao 2 compara (*"a ordem de emissao deles"*).
  const ganchos: GanchosDaPublicacao = {
    filtrarGuid(guid, conteudoId) {
      pontos.push('get_the_guid');
      return opcoes.filtrarGuid === undefined
        ? guid
        : opcoes.filtrarGuid(guid, conteudoId);
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
    ator: opcoes.atorDaRequisicao ?? ator(opcoes.papel ?? 'author'),
    armazenamento: { conteudo: criarRepositorioDeConteudo(dados.porta) },
    classificacao: {
      taxonomiasDoTipo() {
        return opcoes.taxonomias ?? [];
      },
      termosDoConteudo(_conteudoId, taxonomia) {
        return termosDoConteudo[taxonomia] ?? { erro: false, termos: [] };
      },
      opcaoDeTermoPadrao(chave) {
        opcoesLidas.push(chave);
        return valoresDeOpcao[chave] ?? 0;
      },
      definirTermos(_conteudoId, termos, taxonomia) {
        termosDefinidos.push({ taxonomia, termos });
      },
    },
    fila: {
      limparGancho(gancho, argumentos) {
        limpezasDaFila.push({ gancho, argumentos });
        return opcoes.eventosRemovidos ?? 1;
      },
    },
    tipoDeConteudo(nome) {
      return tipos[nome] ?? null;
    },
    enderecoDoConteudo() {
      return opcoes.endereco === undefined ? ENDERECO : opcoes.endereco;
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
    ganchos,
  };
}

/** O texto de uma escrita com os parametros ao lado, para afirmar bytes. */
function escrita(
  dados: PortaDeDadosFalsa,
  indice: number,
): { texto: string; parametros: string[] } {
  const consulta = dados.escritas[indice];
  assert.ok(consulta !== undefined, `nao houve escrita no indice ${indice}`);
  return {
    texto: consulta.texto,
    parametros: consulta.parametros.map(textoDoParametro),
  };
}

/* ── CA-1.1: A CAPACIDADE DE PUBLICAR AQUELE TIPO ──────────────────────────── */

test('CA-1.1 quem nao tem a capacidade de publicar e recusado, e nada e escrito', () => {
  const { contexto, dados, pontos, termosDefinidos, limpezasDaFila } = cenario({
    papel: 'contributor',
  });

  const resultado = publicar(contexto, { conteudoId: ID });

  assert.equal(resultado.desfecho, 'recusado');
  // `class-wp-rest-posts-controller.php:1586`-`:1590`: o codigo, o texto e o
  // numero sao os do legado, byte a byte.
  assert.equal(resultado.recusa?.codigo, CODIGO_DE_RECUSA_DE_PUBLICACAO);
  assert.equal(resultado.recusa?.mensagem, MENSAGEM_DE_RECUSA_DE_PUBLICACAO);
  assert.equal(resultado.recusa?.codigoHttp, 403);

  // Efeito no banco: NENHUM. E nenhum ponto de extensao, nenhum termo e nenhuma
  // limpeza de fila — a recusa acontece antes de tudo.
  assert.deepEqual(dados.escritas, []);
  assert.deepEqual(pontos, []);
  assert.deepEqual(termosDefinidos, []);
  assert.deepEqual(limpezasDaFila, []);
});

test('CA-1.1 o ator anonimo recebe 401, e nao 403 (rest_authorization_required_code)', () => {
  const { contexto } = cenario({ atorDaRequisicao: ATOR_ANONIMO });

  const resultado = publicar(contexto, { conteudoId: ID });

  // `wp-includes/rest-api.php:1438`: `is_user_logged_in() ? 403 : 401`. CA-1.1
  // fala de 403 porque quem publica em US-1 esta autenticado; o 401 e a mesma
  // regra na outra ponta, e e observavel por qualquer cliente da API.
  assert.equal(resultado.desfecho, 'recusado');
  assert.equal(resultado.recusa?.codigoHttp, 401);
});

test('CA-1.1 a capacidade e a do TIPO: publicar pagina exige a capacidade de pagina', () => {
  // O mesmo ator, o mesmo papel, o mesmo conteudo — so o tipo muda.
  const comoPost = cenario({ papel: 'author', linha: linhaDeConteudo() });
  const comoPagina = cenario({
    papel: 'author',
    linha: linhaDeConteudo({ post_type: 'page' }),
  });

  assert.equal(publicar(comoPost.contexto, { conteudoId: ID }).desfecho, 'publicado');
  assert.equal(
    publicar(comoPagina.contexto, { conteudoId: ID }).desfecho,
    'recusado',
  );

  // E quem tem a capacidade de pagina publica a pagina — sem nenhum `if` sobre
  // o nome `page` no caminho: o que muda e o slot do registro do tipo.
  const editor = cenario({
    papel: 'editor',
    linha: linhaDeConteudo({ post_type: 'page' }),
  });
  assert.equal(publicar(editor.contexto, { conteudoId: ID }).desfecho, 'publicado');
});

test('CA-1.1 tipo nao registrado fecha a porta, e nao abre (PERM-4)', () => {
  const { contexto, dados } = cenario({
    papel: 'editor',
    linha: linhaDeConteudo({ post_type: 'tipo-de-terceiro' }),
    tipos: {},
  });

  const resultado = publicar(contexto, { conteudoId: ID });

  // UC-03, tabela de excecoes: *"todo caminho de erro da autorizacao fecha a
  // porta"*. No PHP 8 do legado ler `->cap` de `false` e fatal — a acao tambem
  // nao acontece.
  assert.equal(resultado.desfecho, 'recusado');
  assert.deepEqual(dados.escritas, []);
});

test('CA-1.1 conteudo inexistente e silencio, nao recusa (wp_publish_post nao devolve erro)', () => {
  const { contexto, dados, pontos } = cenario({ leituras: 0 });

  const resultado = publicar(contexto, { conteudoId: ID });

  // `wp-includes/post.php:5417`: `if ( ! $post ) { return; }`. O P7 manda
  // preservar o modo de falha, *"inclusive o silencio"*.
  assert.equal(resultado.desfecho, 'inexistente');
  assert.equal(resultado.recusa, null);
  assert.equal(resultado.conteudo, null);
  assert.deepEqual(dados.escritas, []);
  assert.deepEqual(pontos, []);
});

test('CA-1.1 dois atores concorrentes decidem cada um com a sua capacidade (EXT-CONTEXTO)', () => {
  // A MESMA base, dois atores. Nada e guardado em estado de modulo, logo a
  // ordem das duas chamadas nao muda nenhuma das duas.
  const colaborador = cenario({ papel: 'contributor' });
  const autor = cenario({ papel: 'author' });

  const primeira = publicar(colaborador.contexto, { conteudoId: ID });
  const segunda = publicar(autor.contexto, { conteudoId: ID });
  const terceira = publicar(
    cenario({ papel: 'contributor' }).contexto,
    { conteudoId: ID },
  );

  assert.equal(primeira.desfecho, 'recusado');
  assert.equal(segunda.desfecho, 'publicado');
  assert.equal(terceira.desfecho, 'recusado');
});

/* ── CA-1.2: O ESTADO PUBLICADO, E A TRANSICAO UMA UNICA VEZ ───────────────── */

test('CA-1.2 grava o estado publicado com UM comando, e so a coluna de estado', () => {
  const { contexto, dados } = cenario();

  const resultado = publicar(contexto, { conteudoId: ID });

  assert.equal(resultado.desfecho, 'publicado');
  assert.equal(resultado.estadoAnterior, 'draft');
  assert.equal(resultado.conteudo?.estado, ESTADO_PUBLICADO);

  // `wp-includes/post.php:5448`: `$wpdb->update( $wpdb->posts, array(
  // 'post_status' => 'publish' ), array( 'ID' => $post->ID ) )`. UMA coluna.
  const estado = escrita(dados, 0);
  assert.equal(estado.texto, 'UPDATE wp_posts SET post_status = ? WHERE ID = ?');
  assert.deepEqual(estado.parametros, ['publish', '42']);

  // E nenhuma outra coluna e tocada em nenhuma escrita: nem `post_modified`
  // (wp_publish_post nao le relogio), nem `post_name` (a unicidade do slug e
  // `wp_insert_post()`, T007), nem `comment_count` (DB-TRG1).
  for (const consulta of dados.escritas) {
    assert.ok(!consulta.texto.includes('post_modified'), consulta.texto);
    assert.ok(!consulta.texto.includes('post_name'), consulta.texto);
    assert.ok(!consulta.texto.includes('comment_count'), consulta.texto);
  }
});

test('CA-1.2 a transicao dispara uma unica vez, e os dez pontos saem na ordem do legado', () => {
  const { contexto, pontos } = cenario();

  publicar(contexto, { conteudoId: ID });

  // A ordem e a de `wp_publish_post()` (`:5452`-`:5468`) com a cadeia do ponto
  // `transition_post_status` ordenada por prioridade: o ouvinte do nucleo em 5
  // (que le o guid e limpa a fila) **antes** do interceptador em 10.
  assert.deepEqual(pontos, [
    'get_the_guid',
    PONTO_DEPRECIADO_DE_ENTRADA_EM_PUBLICADO,
    'transition_post_status',
    'draft_to_publish',
    'publish_post',
    'edit_post_post',
    'edit_post',
    'save_post_post',
    'save_post',
    'wp_insert_post',
    'wp_after_insert_post',
  ]);

  // Uma unica vez cada: nenhum ponto repetido.
  assert.equal(new Set(pontos).size, pontos.length);
  assert.equal(
    pontos.filter((ponto) => ponto === 'transition_post_status').length,
    1,
  );
});

test('CA-1.2 o ouvinte do nucleo roda ANTES do interceptador de terceiro (prioridade 5)', () => {
  const { contexto, ganchos, limpezasDaFila } = cenario();
  const ordem: string[] = [];

  const comObservador: ContextoDePublicacao = {
    ...contexto,
    fila: {
      limparGancho(gancho, argumentos) {
        ordem.push('nucleo');
        return contexto.fila.limparGancho(gancho, argumentos);
      },
    },
    ganchos: {
      ...ganchos,
      aoTransitarEstado() {
        ordem.push('terceiro');
      },
    },
  };

  publicar(comObservador, { conteudoId: ID });

  // O nucleo registra `_transition_post_status` em 5
  // (`wp-includes/default-filters.php:448`) e `add_action` sem prioridade entra
  // em 10: um interceptador que rodasse primeiro veria o guid ainda vazio e o
  // evento agendado ainda na fila.
  assert.deepEqual(ordem, ['nucleo', 'terceiro']);
  assert.equal(limpezasDaFila.length, 1);
  assert.equal(PRIORIDADE_DO_OUVINTE_DO_NUCLEO, 5);
});

test('CA-1.2 republicar o que ja esta publicado nao escreve e nao dispara ponto nenhum (P7)', () => {
  const { contexto, dados, pontos, termosDefinidos, limpezasDaFila } = cenario({
    linha: linhaDeConteudo({ post_status: 'publish' }),
  });

  const resultado = publicar(contexto, { conteudoId: ID });

  // `wp-includes/post.php:5412`, BR-MIGRAR-007. Os criterios de US-5 (CA-5.1 a
  // CA-5.3) sao de T011; a guarda e a terceira linha de `wp_publish_post()` e
  // por isso esta aqui — sem ela, a transicao dispararia uma segunda vez e
  // CA-1.2 cairia.
  assert.equal(resultado.desfecho, 'ja-publicado');
  assert.equal(resultado.recusa, null);
  assert.deepEqual(dados.escritas, []);
  assert.deepEqual(pontos, []);
  assert.deepEqual(termosDefinidos, []);
  assert.deepEqual(limpezasDaFila, []);
});

test('CA-1.2 as tres leituras saem nos pontos do legado, e nao em outros', () => {
  const { contexto, dados } = cenario();

  publicar(contexto, { conteudoId: ID });

  // `:5415` (o conteudo), `:5417` (o conteudo anterior) e `:8159` (o guid,
  // dentro do ouvinte). Com o cache do legado ligado a segunda acerta o cache;
  // sem cache, que e o estado desta arvore, saem tres. A divergencia e a que
  // T002 declarou e nao e desta tarefa resolver.
  assert.equal(dados.selecoes.length, 3);
  for (const consulta of dados.selecoes) {
    assert.equal(consulta.texto, 'SELECT * FROM wp_posts WHERE ID = ? LIMIT 1');
    assert.deepEqual(consulta.parametros.map(textoDoParametro), ['42']);
  }
});

/* ── CA-1.3: CONSULTA PUBLICA E ENDERECO DEFINITIVO ────────────────────────── */

test('CA-1.3 o estado gravado e o unico publico e consultavel pelo publico', () => {
  const { contexto } = cenario();

  const resultado = publicar(contexto, { conteudoId: ID });

  // A consulta publica e BC-08 (feature 004). O que esta tarefa entrega e a
  // linha em condicao de ser encontrada por ela: o estado gravado e `publish`,
  // e `publish` e o unico dos 12 cujo registro declara `public` e
  // `publicly_queryable` (`wp-includes/post.php:661`).
  assert.equal(resultado.conteudo?.estado, ESTADO_PUBLICADO);
  assert.equal(PROPRIEDADES_DO_ESTADO_EDITORIAL.publish.publico, true);
  assert.equal(
    PROPRIEDADES_DO_ESTADO_EDITORIAL.publish.consultavelPeloPublico,
    true,
  );
});

test('CA-1.3 o guid vazio recebe o endereco ao entrar em publicado', () => {
  const { contexto, dados } = cenario();

  const resultado = publicar(contexto, { conteudoId: ID });

  // `wp-includes/post.php:8159`-`:8160`.
  const guid = escrita(dados, 1);
  assert.equal(guid.texto, 'UPDATE wp_posts SET guid = ? WHERE ID = ?');
  assert.deepEqual(guid.parametros, [ENDERECO, '42']);
  assert.equal(resultado.efeitosDaTransicao?.enderecoGravadoNoGuid, ENDERECO);

  // E a operacao devolve o endereco definitivo — passo 7 de UC-03.
  assert.equal(resultado.endereco, ENDERECO);

  // ⚠️ O registro devolvido guarda o guid ANTIGO: o legado grava a coluna e nao
  // repassa ao objeto em memoria. E observavel por extensao, e esta reproduzido.
  assert.equal(resultado.conteudo?.guid, '');
});

test('CA-1.3 o guid que ja tem valor nao e tocado', () => {
  const { contexto, dados } = cenario({
    linha: linhaDeConteudo({ guid: 'https://exemplo.test/?p=42' }),
  });

  const resultado = publicar(contexto, { conteudoId: ID });

  // So o UPDATE do estado sai. E o caminho normal de tudo que passou por
  // `wp_insert_post()`, que ja repoe o guid na insercao (`:5120`-`:5121`).
  assert.equal(dados.escritas.length, 1);
  assert.equal(escrita(dados, 0).texto, 'UPDATE wp_posts SET post_status = ? WHERE ID = ?');
  assert.equal(resultado.efeitosDaTransicao?.enderecoGravadoNoGuid, null);
});

test('CA-1.3 o filtro get_the_guid decide se o UPDATE do endereco sai', () => {
  // Coluna vazia, filtro que devolve valor: o legado compara o valor FILTRADO
  // com a cadeia vazia (`:8159` chama `get_the_guid()`, nao a coluna).
  const comFiltro = cenario({ filtrarGuid: () => 'ja-tem-guid' });
  publicar(comFiltro.contexto, { conteudoId: ID });
  assert.equal(comFiltro.dados.escritas.length, 1);

  // E o contrario: coluna preenchida, filtro que a esvazia — o UPDATE sai.
  const esvaziando = cenario({
    linha: linhaDeConteudo({ guid: 'https://exemplo.test/antigo' }),
    filtrarGuid: () => '',
  });
  publicar(esvaziando.contexto, { conteudoId: ID });
  assert.equal(esvaziando.dados.escritas.length, 2);
  assert.deepEqual(escrita(esvaziando.dados, 1).parametros, [ENDERECO, '42']);
});

test('CA-1.3 endereco `false` e gravado como cadeia vazia, como o legado coage', () => {
  const { contexto, dados } = cenario({ endereco: false });

  const resultado = publicar(contexto, { conteudoId: ID });

  // `$wpdb->update()` coage `false` para cadeia vazia no formato `%s`. A coercao
  // esta reproduzida em vez de escondida.
  assert.deepEqual(escrita(dados, 1).parametros, ['', '42']);
  assert.equal(resultado.endereco, false);
});

/* ── CA-1.4: O TERMO PADRAO DE TODA TAXONOMIA QUE DECLARE UM ──────────────── */

test('CA-1.4 a categoria recebe o padrao mesmo sem `default_term` declarado', () => {
  const { contexto, termosDefinidos, opcoesLidas } = cenario({
    taxonomias: [{ nome: 'category', declaraTermoPadrao: false }],
    opcoes: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: 1 },
  });

  const resultado = publicar(contexto, { conteudoId: ID });

  // `wp-includes/post.php:5422`: `if ( 'category' !== $taxonomy && empty(
  // $tax_object->default_term ) )`. A categoria entra por NOME, e o padrao dela
  // vive na opcao `default_category`, semeada em 1 pelo instalador (regra P3).
  assert.deepEqual(opcoesLidas, [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]);
  assert.deepEqual(termosDefinidos, [{ taxonomia: 'category', termos: [1] }]);
  assert.deepEqual(resultado.termosPadraoAtribuidos, [
    { taxonomia: 'category', termoId: 1 },
  ]);
});

test('CA-1.4 outra taxonomia so entra se o registro declarar termo padrao, e le `default_term_`', () => {
  const { contexto, termosDefinidos, opcoesLidas } = cenario({
    taxonomias: [
      { nome: 'genero', declaraTermoPadrao: true },
      { nome: 'post_tag', declaraTermoPadrao: false },
    ],
    opcoes: { [`${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}genero`]: 9 },
  });

  publicar(contexto, { conteudoId: ID });

  assert.deepEqual(opcoesLidas, ['default_term_genero']);
  assert.deepEqual(termosDefinidos, [{ taxonomia: 'genero', termos: [9] }]);
  assert.equal(chaveDoTermoPadrao('genero'), 'default_term_genero');
  assert.equal(chaveDoTermoPadrao('category'), 'default_category');
});

test('CA-1.4 conteudo que ja tem termo naquela taxonomia nao e tocado', () => {
  const { contexto, termosDefinidos, opcoesLidas } = cenario({
    taxonomias: [{ nome: 'category', declaraTermoPadrao: true }],
    termosDoConteudo: { category: { erro: false, termos: [5] } },
    opcoes: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: 1 },
  });

  publicar(contexto, { conteudoId: ID });

  // `:5427`, com o comentario do legado: *"Do not modify previously set
  // terms."* E a opcao nao chega a ser lida.
  assert.deepEqual(termosDefinidos, []);
  assert.deepEqual(opcoesLidas, []);
});

test('CA-1.4 taxonomia que devolve erro e tratada como taxonomia que JA TEM termo', () => {
  const { contexto, termosDefinidos } = cenario({
    taxonomias: [{ nome: 'category', declaraTermoPadrao: true }],
    termosDoConteudo: { category: { erro: true, codigo: 'invalid_taxonomy' } },
    opcoes: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: 1 },
  });

  publicar(contexto, { conteudoId: ID });

  // `! empty( WP_Error )` e verdadeiro no PHP, logo o legado salta. Tratar erro
  // como "sem termos" atribuiria termo onde o legado nao atribui.
  assert.deepEqual(termosDefinidos, []);
});

test('CA-1.4 opcao em zero desiste da taxonomia, sem escrever nada', () => {
  const { contexto, termosDefinidos, opcoesLidas } = cenario({
    taxonomias: [{ nome: 'genero', declaraTermoPadrao: true }],
    opcoes: {},
  });

  const resultado = publicar(contexto, { conteudoId: ID });

  // `:5436`: `if ( ! $default_term_id ) { continue; }`.
  assert.deepEqual(opcoesLidas, ['default_term_genero']);
  assert.deepEqual(termosDefinidos, []);
  assert.deepEqual(resultado.termosPadraoAtribuidos, []);
});

test('CA-1.4 o termo e atribuido ANTES do UPDATE do estado, e na ordem das taxonomias', () => {
  const ordem: string[] = [];
  const base = cenario({
    taxonomias: [
      { nome: 'category', declaraTermoPadrao: false },
      { nome: 'genero', declaraTermoPadrao: true },
    ],
    opcoes: {
      [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: 1,
      [`${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}genero`]: 9,
    },
  });

  const contexto: ContextoDePublicacao = {
    ...base.contexto,
    classificacao: {
      ...base.contexto.classificacao,
      definirTermos(conteudoId, termos, taxonomia) {
        ordem.push(`termo:${taxonomia}`);
        base.contexto.classificacao.definirTermos(conteudoId, termos, taxonomia);
      },
    },
    armazenamento: {
      conteudo: {
        ...base.contexto.armazenamento.conteudo,
        atualizar(id, campos) {
          ordem.push(`update:${Object.keys(campos).join(',')}`);
          return base.contexto.armazenamento.conteudo.atualizar(id, campos);
        },
      },
    },
  };

  publicar(contexto, { conteudoId: ID });

  // `:5419` (o laco) vem antes de `:5448` (o UPDATE), e a ordem das taxonomias
  // e a de registro. Inverter mudaria a contagem de termo que o ouvinte de
  // prioridade 10 recalcula depois.
  assert.deepEqual(ordem, [
    'termo:category',
    'termo:genero',
    'update:estado',
    'update:guid',
  ]);
});

/* ── CA-1.5: O EVENTO DE PUBLICACAO AGENDADA PENDENTE E REMOVIDO ───────────── */

test('CA-1.5 o evento agendado daquele conteudo e removido, com o gancho e o identificador', () => {
  const { contexto, limpezasDaFila } = cenario();

  const resultado = publicar(contexto, { conteudoId: ID });

  // `wp-includes/post.php:8189`: `wp_clear_scheduled_hook( 'publish_future_post',
  // array( $post->ID ) )`. O argumento viaja porque e parte da identidade do
  // evento: limpar sem ele apagaria o evento de todo conteudo agendado do site.
  assert.deepEqual(limpezasDaFila, [
    { gancho: GANCHO_DE_PUBLICACAO_AGENDADA, argumentos: [ID] },
  ]);
  assert.equal(GANCHO_DE_PUBLICACAO_AGENDADA, 'publish_future_post');
  assert.equal(resultado.efeitosDaTransicao?.eventosAgendadosRemovidos, 1);
});

test('CA-1.5 a limpeza e incondicional: acontece tambem quando nao havia evento', () => {
  const { contexto, limpezasDaFila } = cenario({ eventosRemovidos: false });

  const resultado = publicar(contexto, { conteudoId: ID });

  // O comentario do legado na propria linha: *"Always clears the hook in case
  // the post status bounced from future to draft."* E o retorno falso nao muda
  // nada do fluxo (P7).
  assert.equal(limpezasDaFila.length, 1);
  assert.equal(resultado.desfecho, 'publicado');
  assert.equal(resultado.efeitosDaTransicao?.eventosAgendadosRemovidos, false);
});

test('CA-1.5 publicar o que estava agendado limpa o evento e dispara future_to_publish', () => {
  const { contexto, pontos, limpezasDaFila } = cenario({
    linha: linhaDeConteudo({ post_status: 'future' }),
  });

  const resultado = publicar(contexto, { conteudoId: ID });

  assert.equal(resultado.estadoAnterior, 'future');
  assert.ok(pontos.includes('future_to_publish'));
  assert.deepEqual(limpezasDaFila, [
    { gancho: GANCHO_DE_PUBLICACAO_AGENDADA, argumentos: [ID] },
  ]);
});

/* ── `wp_publish_post()` SEM PORTAO, QUE E SUPERFICIE PUBLICADA (P8) ───────── */

test('wp_publish_post() nao verifica capacidade, e e por isso que a fila pode publicar', () => {
  const { contexto, dados } = cenario({ atorDaRequisicao: ATOR_ANONIMO });

  // `check_and_publish_future_post()` (`:5503`) chama `wp_publish_post()` sem
  // ator nenhum: o disparo vem da fila. Dar um portao de capacidade a esta
  // funcao fecharia o sistema mais que o legado e quebraria T013.
  const resultado = transitarParaPublicado(contexto, ID);

  assert.equal(resultado.desfecho, 'publicado');
  assert.equal(escrita(dados, 0).texto, 'UPDATE wp_posts SET post_status = ? WHERE ID = ?');
  // E ela nao resolve endereco: quem o devolve e a operacao.
  assert.equal(resultado.endereco, false);
});

test('wp_publish_post() com o registro em maos nao reconsulta a linha (get_post aceita int|WP_Post)', () => {
  const { contexto, dados } = cenario({ leituras: 2 });
  const conteudo: Conteudo = {
    id: ID,
    autorId: 7,
    data: '2026-10-08 12:00:00',
    dataGmt: DATA_SENTINELA,
    corpo: 'corpo',
    titulo: 'titulo',
    resumo: '',
    estado: 'draft',
    estadoDeComentario: 'open',
    estadoDeNotificacao: 'open',
    senha: '',
    identificadorNaUrl: 'titulo',
    aPingar: '',
    pingados: '',
    modificadoEm: '2026-10-08 12:00:00',
    modificadoEmGmt: '2026-10-08 15:00:00',
    corpoFiltrado: '',
    vinculo: { tipo: 'sem-pai' },
    guid: '',
    ordemNoMenu: 0,
    tipo: 'post',
    tipoMime: '',
    contagemDeComentarios: 3,
  };

  const resultado = transitarParaPublicado(contexto, conteudo);

  // Duas leituras, nao tres: a primeira do legado nao consulta quando recebe o
  // registro (`wp-includes/post.php:5415`, via `get_post()`).
  assert.equal(resultado.desfecho, 'publicado');
  assert.equal(dados.selecoes.length, 2);
});
