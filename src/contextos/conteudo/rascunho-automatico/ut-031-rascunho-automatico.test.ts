/**
 * A entrega de **T024**: *"6 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-031-1, UT-031-2, UT-031-3, UT-031-4,
 * UT-031-5, UT-031-6), com o mesmo dado de entrada, acao e resultado esperado.
 * Os 2 testes de regra de negocio (UT-031-5, UT-031-6) entram na mesma suite."*
 *
 * ---
 *
 * # ✅ `backlog/tests.md` EXISTE nesta arvore, e os seis casos foram COPIADOS
 *
 * As suites de teste das ondas anteriores — `../../identidade-e-acesso/sessao/ut-003-expiracao-de-sessao.test.ts`,
 * `../../identidade-e-acesso/autorizacao/ut-014-autorizacao-por-capacidade.test.ts`
 * e `../../identidade-e-acesso/autorizacao/ut-016-capacidades-por-extensao.test.ts`
 * — registraram que o catalogo **nao estava** no repositorio e **reconstruiram**
 * os casos a partir de `spec.md`. Isso mudou: `backlog/tests.md` esta em
 * `backlog/tests.md` na raiz, a secao *REQ-031* abre na linha 485 e a tabela de
 * casos vai da linha 490 a 496, e os seis casos abaixo sao **transcricao** dela,
 * nao inferencia.
 *
 * O cabecalho da secao tambem veio do catalogo: REQ-031 e `could` · `pronto` ·
 * veredito `aprovado` · *"4 de 4 criterios de aceite cobertos"*. Nenhum achado
 * do QA foi registrado para este card.
 *
 * ## A aritmetica de `tasks.md` FECHA aqui, e a correspondencia e 1 para 1
 *
 * US-11 tem **4** criterios de aceite e **2** regras de negocio em `spec.md`, e
 * o catalogo tem **6** casos — e a coluna *Prova* de cada caso cita, palavra por
 * palavra, exatamente um deles. Esta e a situacao oposta a de US-9, onde
 * `ut-016-capacidades-por-extensao.test.ts` teve de declarar que a conta nao
 * fechava: aqui nao ha criterio desdobrado, nem criterio sobrando, nem escolha
 * a fazer.
 *
 * | caso | tipo | o que a coluna *Prova* do catalogo cita | de `spec.md` |
 * |---|---|---|---|
 * | `UT-031-1` | `feliz` | *"Abrir o editor de um conteudo novo cria um registro em estado de rascunho automatico"* | **CA-11.1** |
 * | `UT-031-2` | `feliz` | *"O rascunho automatico nao aparece em listagem alguma, publica ou do painel"* | **CA-11.2** |
 * | `UT-031-3` | `erro` | *"O estado de rascunho automatico nao pode ser pedido por quem chama a API: e criado so por este caminho"* | **CA-11.3** |
 * | `UT-031-4` | `feliz` | *"O salvamento automatico escreve nesse registro no intervalo configurado"* | **CA-11.4** |
 * | `UT-031-5` | `feliz` | *"Auto-draft e rascunho criado pelo ato de abrir o editor, antes de qualquer digitacao"* | regra 1 |
 * | `UT-031-6` | `borda` | *"`AUTOSAVE_INTERVAL` define de quanto em quanto tempo o editor salva sozinho"* | regra 2 |
 *
 * ---
 *
 * # Nao sao os testes de criterio de T023
 *
 * T023 entregou `./us-11-rascunho-automatico.test.ts`, que afirma os quatro
 * criterios **pelo mecanismo**: a coluna que o `INSERT` leva, a ordem de emissao
 * dos pontos de extensao, a guarda do agendamento, a coercao de `(string)` dos
 * tres filtros, as duas capacidades de `wp-admin/post-new.php:58` e os dois
 * desfechos de falha.
 *
 * Esta suite e o catalogo UT-031-*, no nivel do **caso**: cada teste entra pela
 * **acao** que a coluna *Nome* descreve — abrir o editor, listar, pedir o estado
 * pela API, salvar automaticamente — e afirma **a frase da coluna *Prova***, sem
 * desdobrar o mecanismo. Um caso, um teste, na ordem do catalogo. Por isso os
 * quatro primeiros partem todos do mesmo `abrirEditor()`: o catalogo descreve o
 * ciclo de um registro, e e esse ciclo que se percorre aqui.
 *
 * ---
 *
 * # As ancoras, conferidas no legado em disco
 *
 * O sistema analisado esta legivel em `~/Downloads/wordpress` (WordPress 7.1.2,
 * a mesma versao do pacote) e cada linha citada aqui foi lida la. A tabela de
 * rastreabilidade de `spec.md` da a US-11 duas evidencias, e as duas estao
 * conferidas:
 *
 * | ancora | o que esta na linha | caso |
 * |---|---|---|
 * | `wp-admin/includes/post.php:758` | `get_default_post_to_edit( $post_type, $create_in_db )` | 1, 2, 5 |
 * | `wp-admin/includes/post.php:777` | `post_type_supports( $post_type, 'title' ) ? __( 'Auto Draft' ) : ''` | 1, 5 |
 * | `wp-admin/includes/post.php:779` | `'post_status' => 'auto-draft'` | 1, 5 |
 * | `wp-admin/includes/post.php:789` | `$post = get_post( $post_id );` | 1 |
 * | `wp-includes/post.php:8373` | `function wp_delete_auto_drafts()`, da rastreabilidade de `spec.md` | — ver a nota de BR-MIGRAR-033 |
 * | `wp-includes/default-constants.php:381` | `define( 'AUTOSAVE_INTERVAL', MINUTE_IN_SECONDS )`, da rastreabilidade de `spec.md` | 4, 6 |
 * | `wp-includes/rest-api/endpoints/class-wp-rest-posts-controller.php:2485` | `'enum' => array_keys( get_post_stati( array( 'internal' => false ) ) )` | 3 |
 * | `wp-admin/includes/post.php:2172` | `if ( 'auto-draft' === $post->post_status ) { $post_data['post_status'] = 'draft'; }` | 4 |
 * | `wp-admin/includes/post.php:2180`–`:2190` | o `if` que sobrescreve o proprio rascunho e o `else` que cria versao por conta | 4 |
 * | `wp-includes/script-loader.php:1962` | `'autosaveInterval' => AUTOSAVE_INTERVAL` — o servidor publica o numero ao cliente | 4, 6 |
 * | `wp-includes/js/autosave.js:752` | `if ( ( new Date() ).getTime() < nextRun )` — a borda | 6 |
 * | `wp-includes/js/autosave.js:791` | `nextRun = ( new Date() ).getTime() + ( autosaveL10n.autosaveInterval * 1000 ) \|\| 60000` | 6 |
 *
 * ## ⚠️ O que esta suite NAO prova, declarado para nao ser descoberto depois
 *
 * 1. **O relogio do intervalo e do cliente, e o cliente nao esta nesta arvore.**
 *    Quem conta o intervalo e `autosave.js:752`/`:791`; o servidor so publica o
 *    valor (`script-loader.php:1962`). UT-031-4 e UT-031-6 afirmam o **numero
 *    publicado** e a **aritmetica da borda** portados em
 *    `./salvamento-automatico.ts`, com relogio controlado — nao um navegador. A
 *    ausencia do lado cliente e a mesma que deixou REQ-032 `bloqueado`, e esta
 *    registrada na segunda *Pergunta em aberto* de `spec.md`. Esta tarefa **nao**
 *    a resolve.
 * 2. **A expiracao de 7 dias nao e desta feature.** `wp-includes/post.php:8373`
 *    aparece na rastreabilidade de US-11, mas o prazo e BR-MIGRAR-033 e o
 *    cenario de paridade dele e `PT-004`
 *    (`04-retencao-e-coleta-da-lixeira.feature`, *"Rascunho automatico expira
 *    pelo prazo proprio, por comparacao de data"*), do contexto de retencao e
 *    descarte. Nenhum criterio de US-11 fala do prazo, e inventar teste de
 *    prazo aqui seria afirmar numero fora do escopo desta tarefa (P6).
 * 3. **O conflito de BR-MIGRAR-034 segue aberto.** O agendamento da coleta ao
 *    abrir o editor (`:797`-`:799`) e afirmado por T023; o conflito entre
 *    BR-MIGRAR-034 e CA-6.4 da feature 005 esta declarado em `./index.ts` e
 *    continua **sem decisao**. Nenhum caso do catalogo o cita, e esta suite nao
 *    escolhe lado.
 *
 * ## Como isto fecha pela paridade
 *
 * `parity_specs.md` e literal: *"os 985 testes de `../backlog/tests.md` sao
 * especificacao, nao evidencia"*. Logo estes seis testes sao a especificacao
 * executavel do card, e a evidencia vem do oraculo da resposta 16 — o ambiente
 * executavel do legado, que e T001 da feature 015 e **nao existe ainda**. Toda
 * assercao daqui cita arquivo e linha justamente para que, quando ele subir, a
 * comparacao caso a caso tenha por onde passar. `PT-002`
 * (`02-publicacao-e-agendamento-de-conteudo.feature`) e o cenario de fluxo que
 * cobre UC-03, o unico caso de uso que a rastreabilidade liga a US-11.
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
  criarRepositorioDeConteudo,
  DATA_SENTINELA,
} from '../armazenamento/index.js';
import {
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import { ESTADO_PADRAO_DA_APLICACAO } from '../estado-editorial.js';
import type { ContextoDeGravacao } from '../gravacao/index.js';
import type { Consulta, LinhaDeResultado, PortaDeRelogio } from '../portas/index.js';
import {
  CODIGO_DE_ESTADO_FORA_DA_ENUMERACAO,
  CODIGO_DE_PARAMETRO_INVALIDO,
  CODIGO_HTTP_DE_PARAMETRO_INVALIDO,
  ESTADO_COM_QUE_O_EDITOR_RESERVA,
  ESTADO_DE_RASCUNHO_AUTOMATICO,
  EXCLUSOES_LITERAIS_DE_LISTAGEM,
  INTERVALO_DE_SALVAMENTO_AUTOMATICO_DE_FABRICA,
  MINUTO_EM_SEGUNDOS,
  TITULO_DO_RASCUNHO_AUTOMATICO,
  abrirEditor,
  destinoDoSalvamentoAutomatico,
  estadoApareceEmConsultaPublica,
  estadoApareceEmListagemDoPainel,
  estadosPedveisPelaApi,
  intervaloDeSalvamentoAutomatico,
  intervaloPublicadoAoCliente,
  podeSalvarAutomaticamente,
  proximoSalvamentoAutomatico,
  recusaDeEstadoPedidoPelaApi,
  reescreverEstadoPedidoNoPainel,
  type ContextoDoEditor,
} from './index.js';

/* ── O CENARIO DO CATALOGO ─────────────────────────────────────────────────── */

/*
  Um cenario so, e o mesmo para os quatro primeiros casos, porque o catalogo
  descreve o ciclo de UM registro: ele e criado (caso 1), nao aparece em lugar
  nenhum (caso 2), nao pode ser pedido de fora (caso 3) e e onde o salvamento
  automatico escreve (caso 4). O ator e um autor com as duas capacidades de
  `wp-admin/post-new.php:58`, que e a pre-condicao de UC-03 (*"o registro
  existe, ainda que como auto-draft criado pelo ato de abrir o editor"*).
*/

/** O `ID` que o `INSERT` devolve — `wpdb::$insert_id`. */
const ID_RESERVADO = 41;
const CONTA_DO_AUTOR = 3;
const ENDERECO = `https://exemplo.test/?p=${String(ID_RESERVADO)}`;

/** `current_time( 'mysql' )` e `current_time( 'mysql', true )` do cenario. */
const AGORA_LOCAL = '2026-10-08 09:30:00';
const AGORA_UTC = '2026-10-08 12:30:00';
/** `time()` do cenario, em segundos inteiros UTC. */
const AGORA_EM_SEGUNDOS = 1_791_203_400;

const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'author',
    capacidades: [{ capacidade: 'edit_posts', concedida: true }],
  },
];

const BASE: BaseDeAutorizacao = {
  matriz: MATRIZ,
  rede: REDE_INATIVA_NA_AUTORIZACAO,
};

const AUTOR: AtorDeAutorizacao = {
  contaId: CONTA_DO_AUTOR,
  login: 'autora',
  existe: true,
  concessoes: [{ capacidade: 'author', concedida: true }],
};

/**
 * `get_post_type_object( 'post' )` de fabrica: os dois slots caem na mesma
 * cadeia, como `get_post_type_capabilities()` os deriva
 * (`wp-includes/post.php:2070`).
 */
const TIPO_POST: TipoDeConteudoNaAutorizacao = {
  nome: 'post',
  traduzMetaCapacidade: true,
  capacidades: {
    edit_posts: 'edit_posts',
    create_posts: 'edit_posts',
  },
};

/**
 * A linha que o banco devolve depois do `INSERT` — as 23 colunas de `posts` com
 * o que `wp-admin/includes/post.php:777`-`:779` gravou.
 */
function linhaDoRascunhoAutomatico(
  campos: Partial<Record<string, string | number>> = {},
): LinhaDeResultado {
  return {
    ID: ID_RESERVADO,
    post_author: CONTA_DO_AUTOR,
    post_date: AGORA_LOCAL,
    post_date_gmt: DATA_SENTINELA,
    post_content: '',
    post_title: TITULO_DO_RASCUNHO_AUTOMATICO,
    post_excerpt: '',
    post_status: ESTADO_DE_RASCUNHO_AUTOMATICO,
    comment_status: 'open',
    ping_status: 'open',
    post_password: '',
    post_name: '',
    to_ping: '',
    pinged: '',
    post_modified: AGORA_LOCAL,
    post_modified_gmt: AGORA_UTC,
    post_content_filtered: '',
    post_parent: 0,
    guid: '',
    menu_order: 0,
    post_type: 'post',
    post_mime_type: '',
    comment_count: 0,
    ...campos,
  };
}

interface Cenario {
  readonly contexto: ContextoDoEditor;
  readonly dados: PortaDeDadosFalsa;
}

/**
 * A fila responde `false` (aqui, `null`) a `wp_next_scheduled()`, que e o estado
 * de uma instalacao que ainda nao agendou a coleta. O agendamento em si e
 * afirmado por T023.
 */
function cenario(leituras = 2): Cenario {
  const dados = criarPortaDeDadosFalsa({
    resultadoDeEscrita: { linhasAfetadas: 1, idGerado: ID_RESERVADO },
  });
  for (let i = 0; i < leituras; i += 1) {
    dados.responder([linhaDoRascunhoAutomatico()]);
  }

  const gravacao: ContextoDeGravacao = {
    ator: AUTOR,
    armazenamento: { conteudo: criarRepositorioDeConteudo(dados.porta) },
    datas: {
      agoraNoFusoDoSite: () => AGORA_LOCAL,
      agoraEmUtc: () => AGORA_UTC,
      deUtcParaOFusoDoSite: () => AGORA_LOCAL,
      doFusoDoSiteParaUtc: () => AGORA_UTC,
    },
    suportaRecurso: () => true,
    estadoPadraoDeComentario: () => 'open',
    enderecoDoConteudo: () => ENDERECO,
  };

  const relogio: PortaDeRelogio = {
    agoraEmSegundos: () => AGORA_EM_SEGUNDOS,
  };

  const contexto: ContextoDoEditor = {
    base: BASE,
    gravacao,
    tipoDeConteudo: (nome) => (nome === 'post' ? TIPO_POST : null),
    relogio,
    fila: {
      proximaOcorrencia: () => null,
      agendarRecorrente: () => undefined,
    },
  };

  return { contexto, dados };
}

/**
 * O valor que uma coluna nomeada recebeu no comando, lido do proprio SQL.
 *
 * Mesmo helper, com as mesmas palavras, de `./us-11-rascunho-automatico.test.ts`
 * e de `../gravacao/us-2-gravar-rascunho.test.ts`: por nome, e nao por posicao,
 * porque o que se afirma aqui e o valor da coluna.
 */
function colunaEscrita(
  cenarioDoTeste: Cenario,
  indice: number,
  coluna: string,
): string {
  const consulta = cenarioDoTeste.dados.escritas[indice];
  assert.ok(
    consulta !== undefined,
    `nao houve escrita no indice ${String(indice)}`,
  );

  const colunas = consulta.texto.startsWith('INSERT')
    ? (consulta.texto.match(/\(([^)]*)\)/)?.[1] ?? '').split(', ')
    : (consulta.texto.match(/SET (.*) WHERE/)?.[1] ?? '')
        .split(', ')
        .map((atribuicao) => atribuicao.replace(' = ?', ''));

  const posicao = colunas.indexOf(coluna);
  assert.ok(
    posicao >= 0,
    `a coluna ${coluna} nao esta no comando: ${consulta.texto}`,
  );
  return textoDoParametro(consulta.parametros[posicao]);
}

/** O `ID` do `WHERE` de um `UPDATE`: o ultimo parametro, como `atualizar()` o monta. */
function idDoUpdate(consulta: Consulta | undefined): string {
  assert.ok(consulta !== undefined, 'nao houve a escrita esperada');
  assert.match(consulta.texto, /WHERE ID = \?$/);
  return textoDoParametro(consulta.parametros[consulta.parametros.length - 1]);
}

/* ── UT-031-1 ─────────────────────────────────────────────────────────────── */

test('UT-031-1 cria registro em rascunho automatico ao abrir o editor de conteudo novo (CA-11.1)', () => {
  // Entrada: um autor com as duas capacidades do tipo, nenhum conteudo aberto, e
  // nada pedido pela requisicao. Acao: abrir o editor de um `post` novo —
  // `get_default_post_to_edit( 'post', true )` (`wp-admin/includes/post.php:758`).
  const c = cenario();

  const resultado = abrirEditor(c.contexto, 'post');

  // Resultado esperado, palavra por palavra do catalogo: "cria um registro em
  // estado de rascunho automatico".
  assert.equal(resultado.desfecho, 'rascunho-automatico-criado');
  assert.equal(resultado.conteudoId, ID_RESERVADO);
  assert.equal(resultado.recusa, null);
  assert.equal(resultado.erro, null);

  // O registro existe no banco, e a coluna de estado dele leva `auto-draft`
  // (`:779`). A linha devolvida e a lida de volta por `get_post()` (`:789`), e
  // nao o pedido.
  assert.match(c.dados.escritas[0]?.texto ?? '', /^INSERT INTO/);
  assert.equal(
    colunaEscrita(c, 0, 'post_status'),
    ESTADO_DE_RASCUNHO_AUTOMATICO,
  );
  assert.equal(resultado.gravado?.id, ID_RESERVADO);
  assert.equal(resultado.gravado?.estado, ESTADO_DE_RASCUNHO_AUTOMATICO);
  assert.equal(ESTADO_COM_QUE_O_EDITOR_RESERVA, 'auto-draft');
});

/* ── UT-031-2 ─────────────────────────────────────────────────────────────── */

test('UT-031-2 mantem o rascunho automatico fora de toda listagem, publica ou do painel (CA-11.2)', () => {
  // Entrada: o registro que o caso 1 criou. Acao: perguntar por ele as duas
  // listagens do painel e a consulta publica.
  const c = cenario();
  const resultado = abrirEditor(c.contexto, 'post');
  const estadoDoRegistro = resultado.gravado?.estado;

  assert.equal(estadoDoRegistro, ESTADO_DE_RASCUNHO_AUTOMATICO);

  // Resultado esperado: "nao aparece em listagem alguma, publica ou do painel".
  // `register_post_status( 'auto-draft', array( 'internal' => true ) )`
  // (`wp-includes/post.php:748`) nao declara `show_in_admin_all_list` nem
  // `show_in_admin_status_list`, e os dois nascem `false` para estado interno —
  // ao contrario de `trash`, que declara o segundo explicitamente.
  assert.equal(estadoApareceEmListagemDoPainel('auto-draft'), false);
  assert.equal(estadoApareceEmConsultaPublica('auto-draft'), false);

  // E as seis linhas em que o legado exclui o estado por literal, inventariadas
  // porque sao o outro meio pelo qual a invisibilidade acontece: a listagem do
  // painel, a barra de estados, as duas pontas da exportacao e as regras de
  // reescrita de URL.
  assert.equal(EXCLUSOES_LITERAIS_DE_LISTAGEM.length, 6);
  assert.ok(
    EXCLUSOES_LITERAIS_DE_LISTAGEM.includes(
      'wp-admin/includes/class-wp-posts-list-table.php:122',
    ),
  );
});

/* ── UT-031-3 ─────────────────────────────────────────────────────────────── */

test('UT-031-3 recusa o estado de rascunho automatico pedido por quem chama a API (CA-11.3)', () => {
  // Entrada: uma chamada de criacao pela API REST pedindo `status: auto-draft`.
  // Acao: validar o parametro — `check_status()` contra o `enum` de
  // `class-wp-rest-posts-controller.php:2485`, que e
  // `get_post_stati( array( 'internal' => false ) )`.
  const recusa = recusaDeEstadoPedidoPelaApi(ESTADO_DE_RASCUNHO_AUTOMATICO);

  // Resultado esperado: "nao pode ser pedido por quem chama a API".
  assert.notEqual(recusa, null);
  assert.equal(recusa?.codigo, CODIGO_DE_PARAMETRO_INVALIDO);
  assert.equal(recusa?.codigoHttp, CODIGO_HTTP_DE_PARAMETRO_INVALIDO);
  assert.equal(recusa?.detalhe.codigo, CODIGO_DE_ESTADO_FORA_DA_ENUMERACAO);
  assert.ok(
    !estadosPedveisPelaApi().includes(ESTADO_DE_RASCUNHO_AUTOMATICO),
    'o estado nao pode estar na enumeracao publicada do parametro',
  );

  // E a segunda metade da mesma frase: "e criado so por este caminho". O caminho
  // e o de UT-031-1, e ele cria. O painel, que e a outra superficie de escrita,
  // tambem nao aceita o estado: ele o reescreve para o default da aplicacao
  // (`wp-admin/includes/post.php:111` e `:2172`).
  const c = cenario();
  assert.equal(
    abrirEditor(c.contexto, 'post').gravado?.estado,
    ESTADO_DE_RASCUNHO_AUTOMATICO,
  );
  assert.equal(
    reescreverEstadoPedidoNoPainel(
      ESTADO_DE_RASCUNHO_AUTOMATICO,
      ESTADO_PADRAO_DA_APLICACAO,
    ),
    'draft',
  );
});

/* ── UT-031-4 ─────────────────────────────────────────────────────────────── */

test('UT-031-4 escreve no mesmo registro a cada intervalo configurado de salvamento (CA-11.4)', () => {
  // Entrada: o registro que o caso 1 criou, o proprio autor na requisicao, sem
  // trava de edicao de outra pessoa. Acao: tres salvamentos automaticos, um por
  // intervalo configurado — `wp_autosave()` em `wp-admin/includes/post.php:2152`.
  const c = cenario();
  const resultado = abrirEditor(c.contexto, 'post');
  const registro = resultado.conteudoId;
  const escritasAntes = c.dados.escritas.length;

  const intervalo = intervaloDeSalvamentoAutomatico();
  // O primeiro salvamento ve `auto-draft`; depois dele o estado do registro e
  // `draft` (`:2172`-`:2173`), e `draft` tambem e sobrescrito no lugar (`:2181`).
  const estados = [ESTADO_DE_RASCUNHO_AUTOMATICO, 'draft', 'draft'];
  let instante = AGORA_EM_SEGUNDOS * 1000;

  for (const [volta, estado] of estados.entries()) {
    const proximo = proximoSalvamentoAutomatico(instante, intervalo);

    // Entre uma escrita e a seguinte passa o intervalo inteiro: antes dele nao
    // se escreve, e por isso o `instante` so avanca para `proximo` depois.
    assert.equal(
      podeSalvarAutomaticamente(instante, proximo),
      false,
      `a volta ${String(volta)} escreveu antes de o intervalo fechar`,
    );
    instante = proximo;
    assert.equal(
      podeSalvarAutomaticamente(instante, proximo),
      true,
      `a volta ${String(volta)} tinha de cair no instante do intervalo`,
    );
    assert.equal(
      destinoDoSalvamentoAutomatico({
        estadoDoConteudo: estado,
        autorDoConteudo: CONTA_DO_AUTOR,
        atorId: CONTA_DO_AUTOR,
        travadoPorOutraPessoa: false,
      }),
      'no-proprio-registro',
    );

    c.contexto.gravacao.armazenamento.conteudo.atualizar(registro, {
      corpo: `rascunho da volta ${String(volta)}`,
    });
  }

  // Resultado esperado: "escreve nesse registro". Tres `UPDATE`, e os tres com o
  // mesmo `ID` no `WHERE` — nenhuma linha nova, nenhuma versao por conta.
  const escritasDoSalvamento = c.dados.escritas.slice(escritasAntes);
  assert.equal(escritasDoSalvamento.length, 3);
  for (const escrita of escritasDoSalvamento) {
    assert.equal(idDoUpdate(escrita), String(registro));
  }

  // E o numero que o servidor publica ao cliente e o do intervalo configurado —
  // `'autosaveInterval' => AUTOSAVE_INTERVAL` (`wp-includes/script-loader.php:1962`).
  assert.equal(intervaloPublicadoAoCliente(), intervalo);
});

/* ── UT-031-5 — a primeira regra de negocio ───────────────────────────────── */

test('UT-031-5 cria o registro antes de qualquer digitacao, com corpo vazio (regra de US-11)', () => {
  // Entrada: um autor que acabou de abrir a tela e **nao digitou nada**. Acao:
  // a mesma abertura do caso 1.
  const c = cenario();

  const resultado = abrirEditor(c.contexto, 'post');

  // Resultado esperado: "rascunho criado pelo ato de abrir o editor, antes de
  // qualquer digitacao". O array de `wp_insert_post()` em `:776`-`:780` tem tres
  // chaves — titulo, tipo e estado — e nenhuma delas e corpo ou resumo.
  assert.equal(resultado.desfecho, 'rascunho-automatico-criado');
  assert.equal(colunaEscrita(c, 0, 'post_content'), '');
  assert.equal(colunaEscrita(c, 0, 'post_excerpt'), '');
  assert.equal(resultado.gravado?.corpo, '');
  assert.equal(resultado.gravado?.resumo, '');

  // O titulo e a excecao, e e por ela que a linha entra: `'Auto Draft'`
  // (`:777`) e o que faz `$maybe_empty` falhar em `wp-includes/post.php:4673`,
  // onde conteudo vazio seria recusado. Sem esse titulo nao haveria registro
  // antes da digitacao.
  assert.equal(colunaEscrita(c, 0, 'post_title'), TITULO_DO_RASCUNHO_AUTOMATICO);
  assert.equal(TITULO_DO_RASCUNHO_AUTOMATICO, 'Auto Draft');
});

/* ── UT-031-6 — a segunda regra de negocio, no limite ─────────────────────── */

test('UT-031-6 BORDA: respeita o intervalo configurado entre dois salvamentos automaticos (regra de US-11)', () => {
  // Entrada: `AUTOSAVE_INTERVAL` de fabrica — `MINUTE_IN_SECONDS`, 60 segundos
  // (`wp-includes/default-constants.php:381`).
  assert.equal(INTERVALO_DE_SALVAMENTO_AUTOMATICO_DE_FABRICA, MINUTO_EM_SEGUNDOS);
  assert.equal(intervaloDeSalvamentoAutomatico(), 60);

  const inicio = AGORA_EM_SEGUNDOS * 1000;
  const proximo = proximoSalvamentoAutomatico(inicio, intervaloDeSalvamentoAutomatico());

  // Acao e resultado esperado, nas duas pontas da borda: `autosave.js:752` e
  // `if ( ( new Date() ).getTime() < nextRun ) { return false; }`, logo um
  // milissegundo antes do fechamento recusa e no instante exato salva.
  assert.equal(proximo, inicio + 60_000);
  assert.equal(podeSalvarAutomaticamente(proximo - 1, proximo), false);
  assert.equal(podeSalvarAutomaticamente(proximo, proximo), true);
  assert.equal(podeSalvarAutomaticamente(proximo + 1, proximo), true);

  // "define de quanto em quanto tempo": a constante do dono do servidor move a
  // borda, porque `:380` so define o valor de fabrica quando ninguem definiu.
  const intervaloDoDono = intervaloDeSalvamentoAutomatico({
    AUTOSAVE_INTERVAL: 300,
  });
  assert.equal(intervaloDoDono, 300);
  const proximoDoDono = proximoSalvamentoAutomatico(inicio, intervaloDoDono);
  assert.equal(proximoDoDono, inicio + 300_000);
  assert.equal(podeSalvarAutomaticamente(proximo, proximoDoDono), false);
  assert.equal(podeSalvarAutomaticamente(proximoDoDono, proximoDoDono), true);
});
