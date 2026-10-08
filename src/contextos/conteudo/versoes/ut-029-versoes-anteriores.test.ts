/**
 * A entrega de **T022**: *"6 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-029-1, UT-029-2, UT-029-3, UT-029-4, UT-029-5,
 * UT-029-6), com o mesmo dado de entrada, acao e resultado esperado. Os 2 testes
 * de regra de negocio (UT-029-5, UT-029-6) entram na mesma suite."*
 *
 * ✅ **O catalogo EXISTE nesta arvore, e os seis casos foram COPIADOS dele, nao
 * reconstruidos.** E a diferenca com T008, T016 e T020 da feature 001, que
 * acharam `backlog/tests.md` ausente e reconstruiram os casos declarando a
 * lacuna. A tabela de `REQ-029` — *"`should` · `pronto` · veredito `aprovado` ·
 * 4 de 4 critérios de aceite cobertos"* — da os seis com nome, tipo e prova:
 *
 * | caso | tipo | nome no catalogo | prova que o catalogo cita |
 * |---|---|---|---|
 * | `UT-029-1` | `feliz` | guarda a versão anterior a cada gravação de conteúdo já existente | CA-10.1 |
 * | `UT-029-2` | `borda` | descarta a versão mais antiga ao passar do número configurado e guarda todas quando o limite é ilimitado | CA-10.2 |
 * | `UT-029-3` | `erro` | recusa editar ou apagar uma versão pela permissão de conteúdo | CA-10.3 |
 * | `UT-029-4` | `feliz` | substitui o corpo corrente ao restaurar e guarda o corrente como versão nova | CA-10.4 |
 * | `UT-029-5` | `feliz` | cria a versão como conteúdo filho com o estado herdado do original | regra *"Revision é conteúdo filho do conteúdo editado, com estado herdado, e não se apaga por capacidade própria"* |
 * | `UT-029-6` | `borda` | desliga o versionamento quando o número configurado é zero | regra *"`WP_POST_REVISIONS` define quantas versões de um conteúdo se guardam"* |
 *
 * **O que o catalogo NAO da, e de onde veio.** Ele registra nome, tipo e prova,
 * e **nao** o dado de entrada literal — nenhum dos 985 casos o registra, porque
 * *"nenhum deles cita arquivo, classe ou framework: a stack do sistema novo
 * ainda nao foi escolhida"*. O dado de entrada de cada teste daqui sai do fluxo
 * de [UC-03](../../../../.specify/use-cases/UC-03-publicar-conteudo.md) e da
 * tabela de excecoes de
 * [UC-07](../../../../.specify/use-cases/UC-07-revisar-e-publicar-conteudo-de-outro-autor.md)
 * — os dois casos de uso que a rastreabilidade de `spec.md` liga a US-10 —, dos
 * criterios CA-10.1 a CA-10.4 e das duas regras de negocio anotadas na historia.
 * Nenhuma assercao inventa comportamento: cada uma afirma a frase da coluna
 * *Prova*, pela linha do legado que a produz.
 *
 * ---
 *
 * # Nao e a suite de T021, e as duas nao se substituem
 *
 * `./us-10-versoes-anteriores.test.ts` e a suite da **entrega** de T021: ela
 * afirma os quatro criterios no nivel da unidade — cada funcao chamada direto, a
 * ordem dos onze passos de `wp_save_post_revision()`, a sequencia **crua** dos
 * dez pontos de extensao e os bytes de cada consulta. O cabecalho dela ja
 * declara a fronteira: *"nao sao os seis testes de `backlog/tests.md` — UT-029-1
 * a UT-029-6 sao T022"*.
 *
 * Esta e a suite do **catalogo**: seis testes, um por caso, com a frase do caso
 * no nome, e cada um entra pelo caminho que o produto expoe — a gravacao que
 * versiona (`guardarVersaoNaInsercao`, o ouvinte de fabrica de
 * `wp_after_insert_post`), a listagem com portao (`listarVersoesDoConteudo`), a
 * restauracao com portao (`restaurarVersao`) e a autorizacao
 * (`perguntarPermissao`, de `plataforma/autorizacao/`). Se so a unidade estiver
 * certa e a costura estiver errada, esta e a que abre.
 *
 * **T022 depende de T021** (`tasks.md`: *"depende de: T021"*), logo esta suite
 * importa `./index.js`: numa arvore sem T021 ela nao compila, que e o que a
 * dependencia declarada significa. E, como o `[P]` de T022 exige — *"tarefa de
 * teste, que toca so a propria suite"* —, **nenhum arquivo fora deste e
 * tocado**: nem o barril da pasta, nem o do modulo, nem o README.
 *
 * ---
 *
 * # Como se confere que esta suite prova paridade
 *
 * O criterio desta area e o **efeito no banco** (area 3 da Decisao 2 de
 * `parity_specs.md`: *"snapshot + sequencia de comandos"*, tolerancia **zero**),
 * e e por isso que a porta de dados **registra comando** em vez de simular
 * banco: e a unica forma de afirmar o caso em que o legado **nao emite comando
 * nenhum** — a poda que desiste antes de consultar com `WP_POST_REVISIONS` de
 * fabrica (UT-029-2) e a listagem que devolve vazio sem consultar com o
 * versionamento desligado (UT-029-6).
 *
 * Os cenarios de `parity_tests/02-publicacao-e-agendamento-de-conteudo.feature`
 * que esta suite encosta sao *"A revisao e um conteudo filho e a exclusao do pai
 * recorre sobre ela"* — na metade do **filho**, porque a exclusao recursiva e a
 * feature 005 — e a linha do cenario do slug *"a dispensa de unicidade vale
 * tambem para pendente, rascunho automatico, **revisao** e solicitacao de dado
 * pessoal"*. **Nenhum deles e executavel hoje**: `parity_specs.md` registra que
 * nao ha oraculo executavel nesta arvore, e levanta-lo e T001 da feature 015.
 * Cada afirmacao daqui cita **arquivo e linha** do legado, lido em
 * `~/Downloads/wordpress` (WordPress 7.1.2, a mesma versao do pacote), para que
 * a comparacao caso a caso saiba onde olhar quando o oraculo existir.
 *
 * ---
 *
 * # 🔴 Tres divergencias de redacao, REGISTRADAS e nao resolvidas aqui
 *
 * As tres foram encontradas e registradas por T021 — nos cabecalhos de
 * `contexto-de-versao.ts`, `permissao-de-versao.ts` e `restaurar-versao.ts`, e
 * na secao *"O que T021 encontrou aberto, e NAO fechou"* do README do modulo. O
 * **P1** manda reproduzir o legado e exige *"decisao humana registrada"* para
 * divergir, e nenhuma existe: `pending_decisions.md` nao tem pergunta sobre
 * versao, e `target_business_rules.md` so tem a cascata de exclusao
 * (BR-MIGRAR-104) e a negacao de capacidade (BR-MIGRAR-091). **Esta suite afirma
 * o legado e nomeia a divergencia no teste em que ela aparece** — escolher um
 * dos dois lados cai na linha *"Mudar regra de negocio documentada"* de *Nao
 * negociavel*.
 *
 * 1. **UT-029-1 e CA-10.1 dizem *"a versao anterior"*; o legado guarda o texto
 *    que acabou de ser gravado.** `wp_save_post_revision()` corre **depois** da
 *    escrita e versiona o registro ja atualizado (`wp-includes/revision.php:140`
 *    e `:217`), e o docblock e literal: *"the most recent revision always matches
 *    the current post"* (`:122`). O que o criterio cobra de verificavel — uma
 *    versao por gravacao de conteudo que ja existia, ligada ao conteudo, e texto
 *    anterior recuperavel — **vale nas duas leituras**, e e isso que UT-029-1
 *    afirma.
 * 2. **UT-029-3 e CA-10.3 dizem *"nao e editavel"*; a capacidade nao nega
 *    editar.** `edit_post` de uma versao **segue para o conteudo pai** e resolve
 *    nele (`wp-includes/capabilities.php:215`); so `delete_post` e `do_not_allow`
 *    (`:108`). *"Nao e editavel"* e verdade por **outro** caminho, e sao tres
 *    recusas independentes — ver UT-029-3.
 * 3. **UT-029-4 e CA-10.4 dizem *"guarda o corrente como versao nova"*; a versao
 *    que nasce da restauracao carrega o texto RESTAURADO.** Ela nao e criada pela
 *    restauracao: e criada pela **gravacao** que a restauracao dispara
 *    (`wp_update_post()` → `wp_insert_post()` → ponto `wp_after_insert_post` →
 *    `wp_save_post_revision_on_insert()`, prioridade 9,
 *    `default-filters.php:445`), e essa gravacao le o conteudo **ja atualizado**.
 *    O texto sobrescrito nao se perde porque ele **ja era** a versao mais recente
 *    antes da restauracao. Ver {@link gravacaoQueVersiona}.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAPACIDADE_NEGADA,
  REDE_INATIVA_NA_AUTORIZACAO,
  casoDeConteudo,
  comAtor,
  perguntarPermissao,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type ConteudoNaAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type MatrizDePapeis,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  COLUNAS_NAO_VERSIONAVEIS,
  ESTADO_DE_VERSAO,
  TIPO_DE_VERSAO,
  criarArmazenamentoDeConteudo,
  nomeDaVersao,
  type CamposDeConteudo,
} from '../armazenamento/index.js';
import {
  criarPortaDeDadosFalsa,
  textoDoParametro,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import type { LinhaDeResultado } from '../portas/index.js';
import {
  CAPACIDADE_DE_APAGAR_CONTEUDO,
  CAPACIDADE_DE_EDITAR_CONTEUDO,
  CHAVE_DE_ULTIMA_EDICAO,
  CODIGO_DE_RECUSA_DE_EXCLUSAO_DE_VERSAO,
  CODIGO_DE_VERSAO_DE_VERSAO,
  MENSAGEM_DE_RECUSA_DE_EXCLUSAO_DA_VERSAO,
  MENSAGEM_DE_VERSAO_DE_VERSAO,
  QUANTAS_VERSOES_GUARDAR_DE_FABRICA,
  VERSIONAMENTO_DESLIGADO,
  VERSOES_ILIMITADAS,
  apagarVersao,
  autorizarExclusaoDeVersao,
  gravarVersaoDoConteudo,
  guardarVersao,
  guardarVersaoNaInsercao,
  limiteDaConstante,
  listarVersoes,
  listarVersoesDoConteudo,
  restaurarVersao,
  versionamentoLigado,
  type ContextoDeVersao,
} from './index.js';

/* ── O CENARIO: O FLUXO PRINCIPAL DE UC-03 ─────────────────────────────────── */

/** O conteudo do cenario, do tipo que o legado registra com suporte a versao. */
const CONTEUDO = 42;
const TIPO = 'post';

/** A autora de UC-03 — *"ator principal: Autor (`autor`, `human`)"*. */
const AUTORA = 7;

/**
 * A matriz de papeis do cenario, com as capacidades primitivas que
 * `casoDeConteudo()` cobra para `edit_post` e `delete_post` de conteudo
 * **publicado e proprio** (`permissions.md §5.1`).
 *
 * O assinante existe porque UT-029-3 e UT-029-5 precisam de um ator sem poder
 * nenhum sobre o conteudo.
 */
const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'author',
    capacidades: [
      { capacidade: 'edit_posts', concedida: true },
      { capacidade: 'edit_published_posts', concedida: true },
      { capacidade: 'delete_posts', concedida: true },
      { capacidade: 'delete_published_posts', concedida: true },
    ],
  },
  {
    identificador: 'subscriber',
    capacidades: [{ capacidade: 'read', concedida: true }],
  },
];

/** `get_post_type_object( 'post' )`, com os dois campos que decidem. */
const TIPO_POST: TipoDeConteudoNaAutorizacao = {
  nome: TIPO,
  traduzMetaCapacidade: true,
  capacidades: {
    edit_posts: 'edit_posts',
    edit_published_posts: 'edit_published_posts',
    edit_others_posts: 'edit_others_posts',
    edit_private_posts: 'edit_private_posts',
    delete_posts: 'delete_posts',
    delete_published_posts: 'delete_published_posts',
    delete_others_posts: 'delete_others_posts',
    delete_private_posts: 'delete_private_posts',
  },
};

/** `get_post_type_object( 'revision' )` — o registro do legado (`post.php:129`). */
const TIPO_VERSAO: TipoDeConteudoNaAutorizacao = {
  ...TIPO_POST,
  nome: TIPO_DE_VERSAO,
};

function ator(papel = 'author', contaId = AUTORA): AtorDeAutorizacao {
  return {
    contaId,
    login: papel,
    existe: true,
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

/** As 23 colunas de `posts`, com os defaults do cenario de UC-03. */
function linha(campos: Record<string, string | number> = {}): LinhaDeResultado {
  return {
    ID: CONTEUDO,
    post_author: AUTORA,
    post_date: '2026-10-08 12:00:00',
    post_date_gmt: '2026-10-08 15:00:00',
    post_content: 'corpo',
    post_title: 'titulo',
    post_excerpt: '',
    post_status: 'publish',
    comment_status: 'open',
    ping_status: 'open',
    post_password: '',
    post_name: 'titulo',
    to_ping: '',
    pinged: '',
    post_modified: '2026-10-09 09:00:00',
    post_modified_gmt: '2026-10-09 12:00:00',
    post_content_filtered: '',
    post_parent: 0,
    guid: '',
    menu_order: 0,
    post_type: TIPO,
    post_mime_type: '',
    comment_count: 3,
    ...campos,
  };
}

/**
 * Uma linha de versao do conteudo do cenario: filha, herdada, do tipo da versao
 * e com o **mesmo** `post_name` de todas as outras (BR-MIGRAR-005 dispensa a
 * unicidade do identificador em revisao).
 */
function linhaDeVersao(
  id: number,
  campos: Record<string, string | number> = {},
): LinhaDeResultado {
  return linha({
    ID: id,
    post_type: TIPO_DE_VERSAO,
    post_status: ESTADO_DE_VERSAO,
    post_parent: CONTEUDO,
    post_name: nomeDaVersao(CONTEUDO, false),
    ...campos,
  });
}

function conteudoNaAutorizacao(
  id: number,
  campos: Partial<ConteudoNaAutorizacao> = {},
): ConteudoNaAutorizacao {
  return {
    id,
    tipo: TIPO,
    estado: 'publish',
    estadoParaLeitura: 'publish',
    autorId: AUTORA,
    paiId: 0,
    ...campos,
  };
}

interface Cenario {
  readonly contexto: ContextoDeVersao;
  readonly dados: PortaDeDadosFalsa;
  /** As chamadas a `wp_insert_post()` da versao, na ordem. */
  readonly insercoes: CamposDeConteudo[];
  /** As chamadas a `wp_update_post()` da restauracao, na ordem. */
  readonly atualizacoes: { id: number; campos: CamposDeConteudo }[];
  /** As chamadas a `wp_delete_post()` da poda, na ordem. */
  readonly exclusoes: number[];
}

interface OpcoesDoCenario {
  readonly papel?: string;
  readonly atorDaRequisicao?: AtorDeAutorizacao;
  /** Os logins de super administrador, quando a rede esta ativa. */
  readonly loginsDeSuperAdmin?: readonly string[];
  /** As linhas que a porta responde, em ordem de consulta. */
  readonly respostas?: readonly (readonly LinhaDeResultado[])[];
  /** `WP_POST_REVISIONS`. Omitida, vale o valor de fabrica. */
  readonly constante?: boolean | number | string;
  readonly idDaVersaoInserida?: number;
  /** As linhas do catalogo que a autorizacao de objeto le. */
  readonly conteudosNaAutorizacao?: readonly ConteudoNaAutorizacao[];
  /** Ver {@link gravacaoQueVersiona} — a cadeia de gravacao de UT-029-4. */
  readonly gravacaoVersiona?: boolean;
}

/**
 * 🔴 **O duble que faz a segunda metade de CA-10.4 existir, e por que ele e
 * duble e nao producao.**
 *
 * No legado, `wp_restore_post_revision()` chama `wp_update_post()` (`:500`), que
 * chama `wp_insert_post()`, que emite o ponto `wp_after_insert_post`, onde
 * `wp_save_post_revision_on_insert()` esta registrado em **prioridade 9**
 * (`default-filters.php:445`) — e e **esse ouvinte** que grava a versao nova.
 * `wp_insert_post()` e `wp_update_post()` sao **T005** (US-2) e nao existem
 * nesta arvore: T021 as recebe por `GravacaoNaVersao`, de ligacao tardia, e o
 * cabecalho de `restaurar-versao.ts` avisa a consequencia — *"quem compuser
 * `GravacaoNaVersao.atualizar` com uma funcao que so escreve a linha produz uma
 * restauracao que nao versiona"*.
 *
 * Ligar este `atualizar` a `guardarVersaoNaInsercao( …, true )` e exatamente o
 * registro que o legado tem de fabrica, e **nada mais**: nao ha regra de negocio
 * aqui, nao ha superficie nova, e o duble mora no arquivo de teste. Quando T005
 * chegar, a cadeia de verdade substitui este duble e a assercao de UT-029-4 nao
 * muda.
 */
function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const dados = criarPortaDeDadosFalsa();
  for (const resposta of opcoes.respostas ?? []) {
    dados.responder(resposta);
  }

  const insercoes: CamposDeConteudo[] = [];
  const atualizacoes: Cenario['atualizacoes'] = [];
  const exclusoes: number[] = [];

  const catalogo =
    opcoes.conteudosNaAutorizacao ?? [conteudoNaAutorizacao(CONTEUDO)];
  const fonte: FonteDeConteudoNaAutorizacao = {
    conteudo(id) {
      return catalogo.find((registro) => registro.id === id) ?? null;
    },
    tipoDeConteudo(nome) {
      return nome === TIPO_DE_VERSAO ? TIPO_VERSAO : TIPO_POST;
    },
    estadoDeConteudo() {
      return { nome: 'publish', publico: true, privado: false };
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
    rede:
      opcoes.loginsDeSuperAdmin === undefined
        ? REDE_INATIVA_NA_AUTORIZACAO
        : { ativa: true, loginsDeSuperAdmin: opcoes.loginsDeSuperAdmin },
    casosDeTraducao: [casoDeConteudo(fonte)],
  };

  // A cadeia de gravacao de UT-029-4 precisa do contexto que ela mesma compoe:
  // no legado, o ouvinte do ponto le a linha do banco com o mesmo `$wpdb` da
  // requisicao. A ligacao e feita depois de o contexto existir, e nao antes.
  let contextoDaGravacao: ContextoDeVersao | null = null;

  const contexto: ContextoDeVersao = {
    base,
    ator: opcoes.atorDaRequisicao ?? ator(opcoes.papel ?? 'author'),
    armazenamento: criarArmazenamentoDeConteudo(dados.porta),
    gravacao: {
      inserir(campos) {
        insercoes.push(campos);
        return { ok: true, id: opcoes.idDaVersaoInserida ?? 99 };
      },
      atualizar(id, campos) {
        atualizacoes.push({ id, campos });
        if (opcoes.gravacaoVersiona === true) {
          // O ponto `wp_after_insert_post`, com o ouvinte de fabrica em
          // prioridade 9. O retorno e descartado porque o legado o descarta.
          assert.ok(contextoDaGravacao !== null);
          guardarVersaoNaInsercao(contextoDaGravacao, id, true);
        }
        return id;
      },
      apagar(id) {
        exclusoes.push(id);
        return true;
      },
    },
    suportaVersao() {
      return true;
    },
    ...(opcoes.constante === undefined
      ? {}
      : { constantes: { quantasVersoesGuardar: opcoes.constante } }),
  };
  contextoDaGravacao = contexto;

  return { contexto, dados, insercoes, atualizacoes, exclusoes };
}

/** O texto de uma consulta com os parametros ao lado, para afirmar bytes. */
function consulta(
  dados: PortaDeDadosFalsa,
  indice: number,
): { texto: string; parametros: string[] } {
  const pedida = dados.selecoes[indice];
  assert.ok(pedida !== undefined, `nao houve consulta no indice ${String(indice)}`);
  return {
    texto: pedida.texto,
    parametros: pedida.parametros.map(textoDoParametro),
  };
}

/** A unica insercao de versao de um cenario, afirmada como unica. */
function versaoInserida(insercoes: readonly CamposDeConteudo[]): CamposDeConteudo {
  assert.equal(insercoes.length, 1);
  const campos = insercoes[0];
  assert.ok(campos !== undefined);
  return campos;
}

/* ── UT-029-1 ─────────────────────────────────────────────────────────────── */

test('UT-029-1 guarda a versão anterior a cada gravação de conteúdo já existente (CA-10.1)', () => {
  // ── Ato 1: CRIAR o conteudo com o corpo `A`. Nao cria versao, e nao emite
  // comando nenhum: o `! $update` e a PRIMEIRA guarda do ouvinte
  // (`wp-includes/revision.php:108`), antes de qualquer leitura. E e esta linha
  // que faz o criterio valer so para *"conteudo ja existente"*.
  const criacao = cenario();
  const naCriacao = guardarVersaoNaInsercao(criacao.contexto, CONTEUDO, false);

  assert.equal(naCriacao.desfecho, 'insercao-nao-versiona');
  assert.equal(naCriacao.versaoId, null);
  assert.deepEqual(criacao.insercoes, []);
  assert.deepEqual(criacao.dados.selecoes, []);
  assert.deepEqual(criacao.dados.escritas, []);

  // ── Ato 2: GRAVAR o conteudo que ja existia, agora com o corpo `B`. Uma
  // versao, vinculada ao conteudo pela auto-referencia.
  const primeiraGravacao = cenario({
    idDaVersaoInserida: 90,
    respostas: [
      [linha({ post_content: 'B' })], // `:140` — `get_post( $post_id )`
      [linha({ post_content: 'B' })], // `:667` — o `get_post()` da listagem
      [], // `:693` — nenhuma versao ainda
      [linha({ post_content: 'B' })], // `:403` — o ouvinte do metadado
    ],
  });
  const naPrimeira = guardarVersaoNaInsercao(
    primeiraGravacao.contexto,
    CONTEUDO,
    true,
  );

  assert.equal(naPrimeira.desfecho, 'guardada');
  assert.equal(naPrimeira.versaoId, 90);
  const deB = versaoInserida(primeiraGravacao.insercoes);
  // *"vinculada ao conteudo"*: a auto-referencia de T002, na terceira semantica.
  assert.deepEqual(deB.vinculo, { tipo: 'original-da-versao', id: CONTEUDO });
  assert.equal(deB.corpo, 'B');

  // Nenhuma linha e escrita por esta pasta: gravar versao e gravar CONTEUDO, e o
  // caminho de gravacao e T005 — chega por `GravacaoNaVersao.inserir`.
  assert.deepEqual(primeiraGravacao.dados.escritas, []);
  // Sem versao anterior, *"If no previous revisions, save one"* (`:161`): nao ha
  // comparacao, e a poda desiste antes de consultar porque o limite de fabrica e
  // `-1`. Quatro leituras, e so.
  assert.equal(primeiraGravacao.dados.selecoes.length, 4);

  // ── Ato 3: GRAVAR de novo, com o corpo `C`. Mais uma versao, e a de `B`
  // continua la — e e dela que o texto anterior se recupera.
  const segundaGravacao = cenario({
    idDaVersaoInserida: 91,
    respostas: [
      [linha({ post_content: 'C' })], // `:140`
      [linha({ post_content: 'C' })], // `:667`
      [linhaDeVersao(90, { post_content: 'B' })], // `:693` DESC
      [linha({ post_content: 'C' })], // `:403`
    ],
  });
  const naSegunda = guardarVersaoNaInsercao(
    segundaGravacao.contexto,
    CONTEUDO,
    true,
  );

  assert.equal(naSegunda.desfecho, 'guardada');
  assert.equal(naSegunda.versaoId, 91);
  const deC = versaoInserida(segundaGravacao.insercoes);
  assert.deepEqual(deC.vinculo, { tipo: 'original-da-versao', id: CONTEUDO });

  // ⚠️ **A divergencia 1 do cabecalho, afirmada e nao resolvida.** A versao que
  // esta gravacao cria carrega `C`, o texto que acabou de ser gravado — e nao o
  // `B` que ela substituiu: `wp_save_post_revision()` le `get_post( $post_id )`
  // depois da escrita (`:140`), e *"the most recent revision always matches the
  // current post"* (`:122`). Afirmar `B` aqui seria corrigir o legado sem
  // decisao humana, que o P1 proibe.
  assert.equal(deC.corpo, 'C');

  // ── E o texto anterior E recuperavel, vinculado ao conteudo: a versao de `B`,
  // criada pela gravacao anterior, segue na lista do conteudo. E o que o
  // criterio cobra de verificavel, e vale nas duas leituras da divergencia 1.
  const historico = cenario({
    respostas: [
      [linha({ post_content: 'C' })], // `:152` — o conteudo tem de existir
      [linha({ post_content: 'C' })], // `:667`
      [
        linhaDeVersao(91, { post_content: 'C' }),
        linhaDeVersao(90, { post_content: 'B' }),
      ], // `:693` DESC
    ],
  });

  const lista = listarVersoesDoConteudo(historico.contexto, {
    conteudoId: CONTEUDO,
  });

  assert.equal(lista.desfecho, 'listado');
  assert.deepEqual(
    lista.versoes.map((versao) => versao.id),
    [91, 90],
  );
  // O corpo substituido esta guardado, e e o da versao mais antiga das duas.
  assert.deepEqual(
    lista.versoes.map((versao) => versao.corpo),
    ['C', 'B'],
  );
  for (const versao of lista.versoes) {
    assert.deepEqual(versao.vinculo, {
      tipo: 'original-da-versao',
      id: CONTEUDO,
    });
  }
});

/* ── UT-029-2 ─────────────────────────────────────────────────────────────── */

test('UT-029-2 descarta a versão mais antiga ao passar do número configurado e guarda todas quando o limite é ilimitado (CA-10.2)', () => {
  // ── Metade 1: o numero configurado. `WP_POST_REVISIONS = 2`, quatro versoes
  // depois da recem-criada, e saem as DUAS MAIS ANTIGAS.
  const comLimite = cenario({
    constante: 2,
    respostas: [
      [linha()], // `:140`
      [linha()], // `:667`
      // `:693` DESC — o corpo da mais recente difere do do conteudo, ou a
      // comparacao de `:189` desistiria antes de chegar a poda.
      [
        linhaDeVersao(92, { post_content: 'corpo antigo' }),
        linhaDeVersao(91),
        linhaDeVersao(90),
      ],
      [linha()], // `:403`
      [linha()], // `:667` da segunda listagem
      // `:693` com `ASC`: a recem-criada conta no total, porque a poda corre
      // DEPOIS da gravacao (`:223`).
      [linhaDeVersao(90), linhaDeVersao(91), linhaDeVersao(92), linhaDeVersao(99)],
      [linhaDeVersao(90)], // `:632` — a releitura de `wp_get_post_revision()`
      [linhaDeVersao(91)],
    ],
  });

  const comPoda = guardarVersao(comLimite.contexto, CONTEUDO);

  assert.equal(comPoda.desfecho, 'guardada');
  // Quatro linhas, limite 2 → `$delete` e 2, e o `array_slice( $revisions, 0,
  // $delete )` de `:251` tira as duas da FRENTE da lista crescente.
  assert.deepEqual(comLimite.exclusoes, [90, 91]);
  assert.deepEqual(comPoda.versoesApagadas, [90, 91]);
  // Ficam as duas mais novas, que e o numero configurado.
  assert.equal(comPoda.versoesApagadas.length, 4 - 2);

  // ⚠️ A ordem da segunda listagem e **crescente**, e e ela que decide QUAIS
  // somem: com `DESC` aqui, a poda apagaria as mais novas (`:229`).
  assert.deepEqual(consulta(comLimite.dados, 5), {
    texto:
      'SELECT * FROM wp_posts WHERE post_parent = ? AND post_type = ? ' +
      'AND post_status = ? ORDER BY post_date ASC, ID ASC',
    parametros: [String(CONTEUDO), TIPO_DE_VERSAO, ESTADO_DE_VERSAO],
  });
  // E a exclusao da linha nao sai desta pasta: `wp_delete_post_revision()` chama
  // `wp_delete_post()` (`:638`), que sao as sete etapas da feature 005
  // (`EXT-EXCLUSAO`, BR-MIGRAR-104).
  assert.deepEqual(comLimite.dados.escritas, []);

  // ── Metade 2: *"guarda todas quando o limite e ilimitado"* — e no legado isso
  // e **o default**, nao uma opcao. `WP_POST_REVISIONS` e `true`
  // (`default-constants.php:392`), e `wp_revisions_to_keep()` o traduz em `-1`
  // pela comparacao IDENTICA de `:813`.
  assert.equal(QUANTAS_VERSOES_GUARDAR_DE_FABRICA, true);
  assert.equal(limiteDaConstante(), VERSOES_ILIMITADAS);
  assert.equal(VERSOES_ILIMITADAS, -1);

  const ilimitado = cenario({
    respostas: [
      [linha()], // `:140`
      [linha()], // `:667`
      [
        linhaDeVersao(92, { post_content: 'corpo antigo' }),
        linhaDeVersao(91),
        linhaDeVersao(90),
      ], // `:693` DESC
      [linha()], // `:403`
    ],
  });

  const semPoda = guardarVersao(ilimitado.contexto, CONTEUDO);

  assert.equal(semPoda.desfecho, 'guardada');
  assert.deepEqual(semPoda.versoesApagadas, []);
  assert.deepEqual(ilimitado.exclusoes, []);
  // ⚠️ E o que torna `-1` **literalmente** ilimitado em vez de muito grande: com
  // limite negativo a poda desiste ANTES de consultar (`:225`), logo a segunda
  // listagem nao sai. Quatro leituras, as mesmas do caminho sem poda.
  assert.equal(ilimitado.dados.selecoes.length, 4);
});

/* ── UT-029-3 ─────────────────────────────────────────────────────────────── */

test('UT-029-3 recusa editar ou apagar uma versão pela permissão de conteúdo (CA-10.3)', () => {
  const VERSAO = 90;
  const catalogo = [
    conteudoNaAutorizacao(CONTEUDO),
    conteudoNaAutorizacao(VERSAO, { tipo: TIPO_DE_VERSAO, paiId: CONTEUDO }),
  ];

  // ── APAGAR: negado pela capacidade, e e a autorizacao que nega — nao esta
  // pasta. `capabilities.php:108` devolve `do_not_allow` (`PERM-5`,
  // BR-MIGRAR-091), e UC-07 repete na tabela de excecoes: *"O conteudo e uma
  // revisao → `do_not_allow` para apagar"*.
  const comAutora = cenario({ conteudosNaAutorizacao: catalogo });

  // A autora PODE apagar o conteudo dela...
  assert.equal(
    perguntarPermissao(
      comAtor(comAutora.contexto.base, comAutora.contexto.ator),
      CAPACIDADE_DE_APAGAR_CONTEUDO,
      CONTEUDO,
    ),
    true,
  );
  // ...e NAO pode apagar a versao dele.
  assert.equal(
    perguntarPermissao(
      comAtor(comAutora.contexto.base, comAutora.contexto.ator),
      CAPACIDADE_DE_APAGAR_CONTEUDO,
      VERSAO,
    ),
    false,
  );
  // E a superficie recusa com o texto e o numero do legado — a terceira das tres
  // perguntas de `delete_item_permissions_check()`
  // (`class-wp-rest-revisions-controller.php:484`).
  assert.deepEqual(
    autorizarExclusaoDeVersao(comAutora.contexto, CONTEUDO, VERSAO),
    {
      codigo: CODIGO_DE_RECUSA_DE_EXCLUSAO_DE_VERSAO,
      mensagem: MENSAGEM_DE_RECUSA_DE_EXCLUSAO_DA_VERSAO,
      codigoHttp: 403,
    },
  );

  // ⚠️ E a negacao vence o atalho do super administrador, porque `do_not_allow` e
  // o unico nome que ele nao vence (`PERM-9`, ADR-0009). O endpoint de exclusao
  // de versao do legado recusa **sempre**, por mais poder que o ator tenha.
  const daRede: AtorDeAutorizacao = {
    contaId: 1,
    login: 'dona-da-rede',
    existe: true,
    concessoes: [],
  };
  const emRede = cenario({
    atorDaRequisicao: daRede,
    loginsDeSuperAdmin: ['dona-da-rede'],
    conteudosNaAutorizacao: catalogo,
  });

  assert.equal(CAPACIDADE_NEGADA, 'do_not_allow');
  assert.equal(
    perguntarPermissao(
      comAtor(emRede.contexto.base, emRede.contexto.ator),
      CAPACIDADE_DE_APAGAR_CONTEUDO,
      CONTEUDO,
    ),
    true,
  );
  assert.equal(
    perguntarPermissao(
      comAtor(emRede.contexto.base, emRede.contexto.ator),
      CAPACIDADE_DE_APAGAR_CONTEUDO,
      VERSAO,
    ),
    false,
  );
  assert.notEqual(
    autorizarExclusaoDeVersao(emRede.contexto, CONTEUDO, VERSAO),
    null,
  );

  // ── EDITAR: ⚠️ a divergencia 2 do cabecalho. `edit_post` de uma versao **nao**
  // e negado pela capacidade — a pergunta segue para o conteudo pai e resolve
  // nele (`capabilities.php:215`). Negar aqui fecharia o sistema mais que o
  // legado, e nada no pacote diz que editar e negado: BR-MIGRAR-091 e UC-07
  // registram **so** a metade de apagar.
  assert.equal(
    perguntarPermissao(
      comAtor(comAutora.contexto.base, comAutora.contexto.ator),
      CAPACIDADE_DE_EDITAR_CONTEUDO,
      VERSAO,
    ),
    true,
  );

  // *"Nao e editavel"* e verdade por OUTRO caminho, e das tres recusas
  // independentes do legado duas sao codigo desta pasta:
  //
  // 1. a API REST de versoes nao registra rota de escrita — e da rota, e nao
  //    existe nesta arvore (`class-wp-rest-revisions-controller.php:83`-`:140`);
  // 2. `_wp_put_post_revision()` recusa versionar uma versao, COM TEXTO;
  // 3. a restauracao escreve no pai, nunca na versao — afirmado em UT-029-4.
  const versaoDeVersao = cenario({ respostas: [[linhaDeVersao(VERSAO)]] });
  const aVersao =
    versaoDeVersao.contexto.armazenamento.conteudo.obterPorId(VERSAO);
  assert.ok(aVersao !== null);

  const recusa = gravarVersaoDoConteudo(versaoDeVersao.contexto, aVersao);

  assert.deepEqual(recusa, {
    ok: false,
    codigo: CODIGO_DE_VERSAO_DE_VERSAO,
    mensagem: MENSAGEM_DE_VERSAO_DE_VERSAO,
  });
  // ⚠️ Sem ponto final, como no legado (`revision.php:366`): o `msgid` E a chave
  // do catalogo de traducao (`EC-05`), logo acrescentar o ponto perderia a
  // traducao.
  assert.equal(MENSAGEM_DE_VERSAO_DE_VERSAO.endsWith('.'), false);
  assert.deepEqual(versaoDeVersao.insercoes, []);
});

/* ── UT-029-4 ─────────────────────────────────────────────────────────────── */

test('UT-029-4 substitui o corpo corrente ao restaurar e guarda o corrente como versão nova (CA-10.4)', () => {
  const VERSAO = 90;
  const CORRENTE = 'corpo corrente';
  const ANTIGO = 'corpo antigo';

  // ── Metade 1: *"substitui o corpo corrente"*. O alvo e o PAI (`:496`), e so os
  // campos versionaveis voltam.
  const restauracao = cenario({
    respostas: [
      [linhaDeVersao(VERSAO, { post_content: ANTIGO, post_title: 'titulo antigo' })], // `:37`
      [linha({ post_content: CORRENTE })], // `wp-admin/revision.php:46` — o pai
      // ⚠️ `:71` passa `$revision->ID`, e nao o registro, logo
      // `wp_get_post_revision()` torna a ler a linha da versao.
      [linhaDeVersao(VERSAO, { post_content: ANTIGO, post_title: 'titulo antigo' })], // `:477`
      [], // `:507` — o `valoresDe` de `update_post_meta( '_edit_last' )`
      [], // `:507` — o `idsDe` dele
      [linha({ post_content: ANTIGO })], // `:519` — o ouvinte do metadado
    ],
  });

  const restaurado = restaurarVersao(restauracao.contexto, { versaoId: VERSAO });

  assert.equal(restaurado.desfecho, 'restaurado');
  assert.equal(restaurado.conteudoId, CONTEUDO);

  assert.equal(restauracao.atualizacoes.length, 1);
  const escritaNoPai = restauracao.atualizacoes[0];
  assert.ok(escritaNoPai !== undefined);
  // O alvo e o pai, e nunca a versao — a terceira das tres recusas de UT-029-3.
  assert.equal(escritaNoPai.id, CONTEUDO);
  assert.equal(escritaNoPai.campos.corpo, ANTIGO);
  // ⚠️ So os tres campos versionaveis voltam. Nenhuma das seis chaves fixas da
  // versao chega ao conteudo: um porte que devolvesse a linha inteira poria o
  // conteudo em `inherit` com tipo `revision`, e o tiraria do ar.
  assert.deepEqual(Object.keys(escritaNoPai.campos).sort(), [
    'corpo',
    'resumo',
    'titulo',
  ]);

  // A unica escrita desta pasta e `_edit_last`, com quem restaurou (`:507`).
  assert.equal(restauracao.dados.escritas.length, 1);
  const edicao = restauracao.dados.escritas[0];
  assert.ok(edicao !== undefined);
  assert.ok(edicao.texto.startsWith('INSERT INTO wp_postmeta'));
  assert.deepEqual(edicao.parametros.map(textoDoParametro), [
    String(CONTEUDO),
    CHAVE_DE_ULTIMA_EDICAO,
    String(AUTORA),
  ]);

  // ── Metade 2: *"e guarda o corrente como versao nova"*. A versao nova nasce da
  // CADEIA DE GRAVACAO que a restauracao dispara, e nao da restauracao — ver
  // {@link cenario} e a divergencia 3 do cabecalho.
  const comCadeia = cenario({
    gravacaoVersiona: true,
    idDaVersaoInserida: 99,
    respostas: [
      [linhaDeVersao(VERSAO, { post_content: ANTIGO })], // `:37`
      [linha({ post_content: CORRENTE })], // o pai, ainda com o corpo corrente
      [linhaDeVersao(VERSAO, { post_content: ANTIGO })], // `:477`
      // Daqui em diante e a cadeia de gravacao, dentro de `wp_update_post()`:
      [linha({ post_content: ANTIGO })], // `:140` — o conteudo JA restaurado
      [linha({ post_content: ANTIGO })], // `:667`
      // A versao mais recente ANTES da restauracao carrega o corpo corrente — e
      // a invariante de `:122`, e e por ela que o texto sobrescrito nao se perde.
      [
        linhaDeVersao(91, { post_content: CORRENTE }),
        linhaDeVersao(VERSAO, { post_content: ANTIGO }),
      ], // `:693` DESC
      [linha({ post_content: ANTIGO })], // `:403` — o ouvinte do metadado
      [], // `:507` — o `valoresDe` de `_edit_last`
      [], // `:507` — o `idsDe`
      [linha({ post_content: ANTIGO })], // `:519`
    ],
  });

  const comVersaoNova = restaurarVersao(comCadeia.contexto, { versaoId: VERSAO });

  assert.equal(comVersaoNova.desfecho, 'restaurado');
  // A gravacao da restauracao versionou: UMA linha de versao nova, filha do
  // mesmo conteudo.
  const nova = versaoInserida(comCadeia.insercoes);
  assert.deepEqual(nova.vinculo, { tipo: 'original-da-versao', id: CONTEUDO });
  assert.equal(nova.estado, ESTADO_DE_VERSAO);

  // ⚠️ **A divergencia 3, afirmada e nao resolvida.** A versao nova carrega o
  // texto RESTAURADO, e nao o corpo corrente que a restauracao sobrescreveu: o
  // ouvinte corre depois da escrita e le o conteudo ja atualizado (`:140`). O
  // corpo corrente nao se perde — ele **ja era** a versao 91, a mais recente
  // antes da restauracao.
  assert.equal(nova.corpo, ANTIGO);
  assert.notEqual(nova.corpo, CORRENTE);
});

/* ── UT-029-5 (regra de negocio) ──────────────────────────────────────────── */

test('UT-029-5 cria a versão como conteúdo filho com o estado herdado do original (regra: revision é conteúdo filho, com estado herdado, e não se apaga por capacidade própria)', () => {
  const comGravacao = cenario({
    respostas: [
      [linha()], // `:140`
      [linha()], // `:667`
      [], // `:693`
      [linha()], // `:403`
    ],
  });

  assert.equal(guardarVersao(comGravacao.contexto, CONTEUDO).desfecho, 'guardada');
  const campos = versaoInserida(comGravacao.insercoes);

  // ── *"conteudo filho do conteudo editado"*: a auto-referencia, na terceira
  // semantica de `post_parent` (`_wp_post_revision_data()`, `:88`). E a metade de
  // `PT-002` que esta pasta cumpre — *"a revisao e um conteudo filho"*; a outra,
  // a exclusao recursiva do pai, e a feature 005 (`PT-003`).
  assert.deepEqual(campos.vinculo, { tipo: 'original-da-versao', id: CONTEUDO });

  // ── *"com estado herdado"*: `inherit`, literal (`:89`). A visibilidade da
  // versao e a do conteudo que ela versiona.
  assert.equal(campos.estado, ESTADO_DE_VERSAO);
  assert.equal(ESTADO_DE_VERSAO, 'inherit');
  assert.equal(campos.tipo, TIPO_DE_VERSAO);
  assert.equal(TIPO_DE_VERSAO, 'revision');
  // Todas as versoes de um conteudo tem o MESMO identificador na URL: a
  // unicidade e dispensada em revisao (BR-MIGRAR-005), e e por isso que o
  // cenario do slug de `PT-002` a nomeia.
  assert.equal(campos.identificadorNaUrl, nomeDaVersao(CONTEUDO, false));
  assert.equal(campos.identificadorNaUrl, '42-revision-v1');

  // ⚠️ E `post_author` **nao** e copiado: ele e um dos nove nomes que o legado se
  // recusa a versionar (`:57`), logo a versao fica com o autor de **quem a
  // gravou**, resolvido por `wp_insert_post()`.
  assert.equal(campos.autorId, undefined);
  assert.ok(COLUNAS_NAO_VERSIONAVEIS.includes('post_author'));

  // ── A leitura confirma o vinculo pelos tres criterios do legado, e a ordem:
  // `post_parent` o conteudo, `post_type` a versao, `post_status` o herdado
  // (`:693`, com `orderby => 'date ID'`).
  assert.deepEqual(consulta(comGravacao.dados, 2), {
    texto:
      'SELECT * FROM wp_posts WHERE post_parent = ? AND post_type = ? ' +
      'AND post_status = ? ORDER BY post_date DESC, ID DESC',
    parametros: [String(CONTEUDO), TIPO_DE_VERSAO, ESTADO_DE_VERSAO],
  });

  // ── *"e nao se apaga por capacidade propria"*: a versao nao tem capacidade de
  // exclusao que lhe pertenca — `delete_post` dela e `do_not_allow`
  // (`capabilities.php:108`), enquanto a do conteudo pai resolve normalmente. E
  // a assimetria: quem apaga versao e a PODA DO NUCLEO, que nao pergunta nada a
  // ninguem (`revision.php:631`), porque pela capacidade ninguem conseguiria.
  const VERSAO = 90;
  const assinante = cenario({
    atorDaRequisicao: ator('subscriber', 999),
    respostas: [[linhaDeVersao(VERSAO)]],
    conteudosNaAutorizacao: [
      conteudoNaAutorizacao(CONTEUDO),
      conteudoNaAutorizacao(VERSAO, { tipo: TIPO_DE_VERSAO, paiId: CONTEUDO }),
    ],
  });

  // O assinante nao pode apagar nem o conteudo nem a versao...
  assert.equal(
    perguntarPermissao(
      comAtor(assinante.contexto.base, assinante.contexto.ator),
      CAPACIDADE_DE_APAGAR_CONTEUDO,
      CONTEUDO,
    ),
    false,
  );
  assert.equal(
    perguntarPermissao(
      comAtor(assinante.contexto.base, assinante.contexto.ator),
      CAPACIDADE_DE_APAGAR_CONTEUDO,
      VERSAO,
    ),
    false,
  );
  // ...e `wp_delete_post_revision()` apaga de qualquer forma, porque ela nao e
  // superficie: e o nucleo arrumando a propria casa.
  assert.equal(apagarVersao(assinante.contexto, VERSAO), true);
  assert.deepEqual(assinante.exclusoes, [VERSAO]);
  // E nem ali a linha e apagada por esta pasta: o `DELETE` e das sete etapas da
  // feature 005, e um `DELETE` emitido aqui esconderia o que o P5 manda afirmar.
  assert.deepEqual(assinante.dados.escritas, []);
});

/* ── UT-029-6 (regra de negocio) ──────────────────────────────────────────── */

test('UT-029-6 desliga o versionamento quando o número configurado é zero (regra: `WP_POST_REVISIONS` define quantas versões de um conteúdo se guardam)', () => {
  // ── O numero e a constante, e o zero desliga. `wp_revisions_enabled()` e uma
  // linha so, e compara com ZERO e nao com *"maior que zero"*:
  // `return wp_revisions_to_keep( $post ) !== 0` (`revision.php:796`).
  assert.equal(limiteDaConstante(0), VERSIONAMENTO_DESLIGADO);
  assert.equal(VERSIONAMENTO_DESLIGADO, 0);

  const desligado = cenario({ constante: 0, respostas: [[linha()]] });
  const conteudo =
    desligado.contexto.armazenamento.conteudo.obterPorId(CONTEUDO);
  assert.ok(conteudo !== null);
  assert.equal(versionamentoLigado(desligado.contexto, conteudo), false);

  // A gravacao desiste no passo 6 (`:154`), e nenhuma versao e criada.
  const semVersionar = cenario({ constante: 0, respostas: [[linha()]] });
  const recusada = guardarVersao(semVersionar.contexto, CONTEUDO);

  assert.equal(recusada.desfecho, 'versionamento-desligado');
  assert.equal(recusada.versaoId, null);
  assert.deepEqual(semVersionar.insercoes, []);
  // ⚠️ A guarda e DEPOIS da leitura do conteudo (`:140`) e ANTES da listagem:
  // uma leitura so, e nenhuma consulta a versoes.
  assert.equal(semVersionar.dados.selecoes.length, 1);
  assert.deepEqual(consulta(semVersionar.dados, 0), {
    texto: 'SELECT * FROM wp_posts WHERE ID = ? LIMIT 1',
    parametros: [String(CONTEUDO)],
  });

  // E a leitura tambem devolve vazio **sem consultar a tabela de versoes**, pelo
  // `check_enabled` de fabrica (`:680`). Tres chamadores do legado o pedem
  // `false` de proposito, e nenhum deles e desta feature.
  const listagem = cenario({ constante: 0, respostas: [[linha()]] });
  assert.deepEqual(listarVersoes(listagem.contexto, CONTEUDO), []);
  assert.equal(listagem.dados.selecoes.length, 1);

  // ── As duas pontas da borda, que o P6 cobra: *"no ultimo instante aceita, um
  // instante depois recusa"*. Com UM, versiona; com zero, nao.
  const comUm = cenario({
    constante: 1,
    respostas: [
      [linha()], // `:140`
      [linha()], // `:667`
      [], // `:693`
      [linha()], // `:403`
      [linha()], // `:667` da segunda listagem
      [linhaDeVersao(99)], // `:693` ASC — uma linha, limite 1, nada a podar
    ],
  });
  const comUmResultado = guardarVersao(comUm.contexto, CONTEUDO);
  assert.equal(comUmResultado.desfecho, 'guardada');
  assert.deepEqual(comUmResultado.versoesApagadas, []);
  assert.equal(comUm.insercoes.length, 1);

  // ── Os outros valores que a constante aceita, e o que cada um faz. ⚠️ A
  // comparacao de `:813` e IDENTICA, logo a cadeia `'true'` — que uma
  // configuracao mal escrita produz — cai no `(int)` do PHP, vale `0` e
  // **desliga** o versionamento, em vez de ligar.
  assert.equal(limiteDaConstante(true), VERSOES_ILIMITADAS);
  assert.equal(limiteDaConstante(false), VERSIONAMENTO_DESLIGADO);
  assert.equal(limiteDaConstante('0'), VERSIONAMENTO_DESLIGADO);
  assert.equal(limiteDaConstante('true'), VERSIONAMENTO_DESLIGADO);
  assert.equal(limiteDaConstante(3), 3);

  // ⚠️ **E "desligado" nao quer dizer "nada se restaura".** A disjuncao de
  // `wp-admin/revision.php:52` tem duas metades — `! wp_revisions_enabled( $post )
  // && ! wp_is_post_autosave( $revision )` —, e a segunda deixa passar o
  // salvamento automatico, que US-11 cria mesmo com a constante em zero. A versao
  // comum e recusada; o salvamento automatico, nao.
  const VERSAO = 90;
  const catalogo = [
    conteudoNaAutorizacao(CONTEUDO),
    conteudoNaAutorizacao(VERSAO, { tipo: TIPO_DE_VERSAO, paiId: CONTEUDO }),
  ];

  const versaoComum = cenario({
    constante: 0,
    conteudosNaAutorizacao: catalogo,
    respostas: [[linhaDeVersao(VERSAO)], [linha()], [linhaDeVersao(VERSAO)]],
  });
  assert.equal(
    restaurarVersao(versaoComum.contexto, { versaoId: VERSAO }).desfecho,
    'versionamento-desligado',
  );

  const salvamentoAutomatico = cenario({
    constante: 0,
    conteudosNaAutorizacao: catalogo,
    respostas: [
      [linhaDeVersao(VERSAO, { post_name: nomeDaVersao(CONTEUDO, true) })],
      [linha()],
      [linhaDeVersao(VERSAO, { post_name: nomeDaVersao(CONTEUDO, true) })],
      [], // `:507` — o `valoresDe` de `_edit_last`
      [], // `:507` — o `idsDe`
      [linha()], // `:519`
    ],
  });
  assert.equal(
    restaurarVersao(salvamentoAutomatico.contexto, { versaoId: VERSAO }).desfecho,
    'restaurado',
  );
});
