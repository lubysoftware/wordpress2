/**
 * Testes da entrega de T001: "o modulo carrega com as portas de dados, de
 * relogio e de envio de e-mail declaradas, e o vocabulario de estado editorial
 * do legado declarado como enumeracao fechada".
 *
 * Nao sao os testes de nenhuma historia — esses sao T004, T006, T008 e os demais
 * `[P]` de `tasks.md`, um por caso de `backlog/tests.md`. Aqui se afirma so o
 * que T001 entrega, mais as duas invariantes de arquitetura que um esqueleto
 * pode quebrar em silencio: estado de modulo (`EXT-CONTEXTO`) e trabalho no
 * carregamento (`EXT-ORDEM`).
 *
 * As afirmacoes sobre o vocabulario sao conferiveis contra o legado linha por
 * linha (`wp-includes/post.php:660` a `:825`), e e por ali que elas passam a ser
 * conferiveis contra o oraculo executavel quando ele existir — a feature 015
 * (T001) e que o levanta.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criarModuloDeConteudo,
  ESTADO_PADRAO_DA_APLICACAO,
  ESTADO_PADRAO_DO_ARMAZENAMENTO,
  ESTADOS_EDITORIAIS,
  PROPRIEDADES_DO_ESTADO_EDITORIAL,
  type Consulta,
  type EstadoEditorial,
  type MensagemDeEmail,
  type PortaDeDados,
  type PortaDeEmail,
  type PortaDeRelogio,
  type PortasDeConteudo,
  type ResultadoDeEnvio,
  type ResultadoDeEscrita,
} from './index.js';

/** Conta os toques em cada porta, para afirmar que o modulo nao as usa ainda. */
interface Toques {
  selecionar: Consulta[];
  escrever: Consulta[];
  enviar: MensagemDeEmail[];
  relogio: number;
}

function portasDeTeste(
  prefixoDeTabela = 'wp_',
  resultadoDeEnvio: ResultadoDeEnvio = { enviado: true },
): { portas: PortasDeConteudo; toques: Toques } {
  const toques: Toques = {
    selecionar: [],
    escrever: [],
    enviar: [],
    relogio: 0,
  };

  const dados: PortaDeDados = {
    prefixoDeTabela,
    selecionar(consulta) {
      toques.selecionar.push(consulta);
      return [];
    },
    escrever(consulta): ResultadoDeEscrita {
      toques.escrever.push(consulta);
      return { linhasAfetadas: 0, idGerado: null };
    },
  };

  const email: PortaDeEmail = {
    enviar(mensagem) {
      toques.enviar.push(mensagem);
      return resultadoDeEnvio;
    },
  };

  const relogio: PortaDeRelogio = {
    agoraEmSegundos() {
      toques.relogio += 1;
      return 0;
    },
  };

  return { portas: { dados, email, relogio }, toques };
}

test('o modulo carrega com as tres portas declaradas', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeConteudo(portas);

  assert.equal(modulo.nome, 'conteudo');
  assert.equal(modulo.portas.dados, portas.dados);
  assert.equal(modulo.portas.email, portas.email);
  assert.equal(modulo.portas.relogio, portas.relogio);
});

test('a superficie do modulo e so o que T001, T002, T003 e T013 entregam', () => {
  const { portas } = portasDeTeste();

  const modulo = criarModuloDeConteudo(portas);

  // A lista cresceu em T002, que acrescentou `armazenamento`; em T003, que
  // acrescentou `publicar` — a primeira operacao da tabela *Contratos* de
  // `plan.md` a entrar aqui, e a primeira a declarar capacidade (CA-1.1) —; e em
  // T013, que acrescentou `publicarSeAindaAgendado`, a operacao que a fila
  // aciona e cuja permissao exigida e **nenhuma**, porque no legado nao ha ator
  // no disparo (`wp-includes/default-filters.php:357`). As outras crescem NA
  // TAREFA DELAS. Esta afirmacao esta aqui para que nenhuma operacao chegue
  // antes da propria tarefa, que e o que o P4 da constituicao cobra: "toda
  // operacao exposta nova nasce com declaracao explicita de permissao" — e
  // declarar "nenhuma", com a ancora, e declaracao.
  assert.deepEqual(Object.keys(modulo).sort(), [
    'armazenamento',
    'nome',
    'portas',
    'publicar',
    'publicarSeAindaAgendado',
  ]);
});

test('criar o modulo nao toca em porta nenhuma (EXT-ORDEM: nada se resolve no carregamento)', () => {
  const { portas, toques } = portasDeTeste();

  criarModuloDeConteudo(portas);

  assert.deepEqual(toques.selecionar, []);
  assert.deepEqual(toques.escrever, []);
  assert.deepEqual(toques.enviar, []);
  assert.equal(toques.relogio, 0);
});

test('duas composicoes nao compartilham estado (EXT-CONTEXTO, BR-MIGRAR-105)', () => {
  const primeira = portasDeTeste('wp_');
  const segunda = portasDeTeste('wp_2_');

  const moduloA = criarModuloDeConteudo(primeira.portas);
  const moduloB = criarModuloDeConteudo(segunda.portas);

  assert.notEqual(moduloA, moduloB);
  assert.equal(moduloA.portas.dados.prefixoDeTabela, 'wp_');
  assert.equal(moduloB.portas.dados.prefixoDeTabela, 'wp_2_');

  // `posts` e `postmeta` sao tabelas de ESCOPO POR SITE
  // (`target_data_model.md`): se o modulo guardasse a porta em estado de
  // modulo, duas requisicoes de sites diferentes gravariam conteudo uma na
  // tabela da outra.
  moduloA.portas.dados.selecionar({ texto: 'SELECT 1', parametros: [] });
  assert.equal(primeira.toques.selecionar.length, 1);
  assert.equal(segunda.toques.selecionar.length, 0);
});

test('a porta de e-mail devolve a falha como valor, sem lancar (CA-9.4, P7)', () => {
  const { portas } = portasDeTeste('wp_', {
    enviado: false,
    motivo: 'transporte indisponivel',
  });

  const modulo = criarModuloDeConteudo(portas);

  // O modulo entrega a porta sem envolve-la: nada entre o chamador e o
  // transporte pode transformar este estado em excecao. E o que CA-9.4 exige,
  // se US-9 vier a ser construida — ver a PARADA no cabecalho de
  // `portas/porta-de-email.ts` antes de usa-la.
  const resultado = modulo.portas.email.enviar({
    destinatarios: ['autor@exemplo.invalido'],
    assunto: '',
    corpo: '',
    cabecalhos: [],
    anexos: [],
    incorporados: [],
  });

  assert.equal(resultado.enviado, false);
  assert.equal(
    resultado.enviado === false ? resultado.motivo : null,
    'transporte indisponivel',
  );
});

test('o vocabulario tem os 12 estados de fabrica, na ordem em que o legado os registra', () => {
  // `wp-includes/post.php:661` a `:813`, uma chamada de `register_post_status()`
  // por estado, nesta ordem. A ordem e observavel: o registro e alimentado por
  // insercao (`:1535`) e devolvido na ordem de insercao.
  assert.deepEqual(ESTADOS_EDITORIAIS, [
    'publish',
    'future',
    'draft',
    'pending',
    'private',
    'trash',
    'auto-draft',
    'inherit',
    'request-pending',
    'request-confirmed',
    'request-failed',
    'request-completed',
  ]);
});

test('a enumeracao e fechada: nao se acrescenta nem se remove estado dela em execucao', () => {
  assert.ok(Object.isFrozen(ESTADOS_EDITORIAIS));
  assert.ok(Object.isFrozen(PROPRIEDADES_DO_ESTADO_EDITORIAL));

  // Todo estado da lista tem propriedades declaradas, e nao ha propriedade sem
  // estado: as duas exportacoes nao podem divergir.
  assert.deepEqual(
    Object.keys(PROPRIEDADES_DO_ESTADO_EDITORIAL).sort(),
    [...ESTADOS_EDITORIAIS].sort(),
  );
});

test('os dois defaults divergem, e e isso que o alvo tem de reproduzir (BR-MIGRAR-001)', () => {
  // `wp-includes/post.php:4703` grava `draft` quando o status nao e informado;
  // `wp-admin/includes/schema.php:167` declara `publish` como default da coluna.
  // Duas regras para a mesma coluna, dependendo de quem escreve — e
  // BR-MIGRAR-001 e literal em que o alvo "nao pode unificar os dois defaults".
  assert.equal(ESTADO_PADRAO_DA_APLICACAO, 'draft');
  assert.equal(ESTADO_PADRAO_DO_ARMAZENAMENTO, 'publish');
  assert.notEqual(ESTADO_PADRAO_DA_APLICACAO, ESTADO_PADRAO_DO_ARMAZENAMENTO);
});

test('so `publish` e publico, e `private` e estado proprio e nao atributo de publicado (CA-4.1)', () => {
  const publicos = ESTADOS_EDITORIAIS.filter(
    (estado) => PROPRIEDADES_DO_ESTADO_EDITORIAL[estado].publico,
  );

  assert.deepEqual(publicos, ['publish']);
  assert.equal(PROPRIEDADES_DO_ESTADO_EDITORIAL.private.privado, true);
  assert.equal(PROPRIEDADES_DO_ESTADO_EDITORIAL.private.publico, false);
});

test('a data flutuante vale em `draft`, `pending` e `auto-draft`, e em mais nenhum', () => {
  // E a lista que `wp_insert_post()` consulta para decidir se grava a sentinela
  // '0000-00-00 00:00:00' em `post_date_gmt` (`wp-includes/post.php:4780`).
  const comDataFlutuante = ESTADOS_EDITORIAIS.filter(
    (estado) => PROPRIEDADES_DO_ESTADO_EDITORIAL[estado].dataFlutuante,
  );

  assert.deepEqual(comDataFlutuante, ['draft', 'pending', 'auto-draft']);
});

test('`inherit` e os quatro `request-*` sao internos e ainda assim entram na busca', () => {
  // A excecao esta no codigo: os cinco declaram `exclude_from_search => false`
  // explicito contra o default, que para estado interno seria `true`
  // (`wp-includes/post.php:763`, `:778`, `:793`, `:808`, `:823` contra `:1511`).
  // Um porte que derive "interno logo fora da busca" apaga isto em silencio.
  const internosNaBusca = ESTADOS_EDITORIAIS.filter(
    (estado) =>
      PROPRIEDADES_DO_ESTADO_EDITORIAL[estado].interno &&
      !PROPRIEDADES_DO_ESTADO_EDITORIAL[estado].excluidoDaBusca,
  );

  assert.deepEqual(internosNaBusca, [
    'inherit',
    'request-pending',
    'request-confirmed',
    'request-failed',
    'request-completed',
  ]);

  // `trash` e `auto-draft` sao o outro lado da mesma derivacao: internos, e
  // fora da busca.
  assert.equal(PROPRIEDADES_DO_ESTADO_EDITORIAL.trash.excluidoDaBusca, true);
  assert.equal(
    PROPRIEDADES_DO_ESTADO_EDITORIAL['auto-draft'].excluidoDaBusca,
    true,
  );
});

test('o painel nao lista `auto-draft`, e ele e o unico desta feature ali (CA-11.2)', () => {
  const invisiveisNoPainel = ESTADOS_EDITORIAIS.filter(
    (estado) =>
      !PROPRIEDADES_DO_ESTADO_EDITORIAL[estado].visivelNaListaDeTodos &&
      !PROPRIEDADES_DO_ESTADO_EDITORIAL[estado].visivelNaListaDeEstados,
  );

  // `auto-draft` e os de solicitacao de dado pessoal: nenhum deles e conteudo
  // que o painel liste. `trash` NAO esta aqui, porque a lixeira conta na barra
  // de estados (`show_in_admin_status_list => true` explicito, `:743`).
  assert.deepEqual(invisiveisNoPainel, [
    'auto-draft',
    'inherit',
    'request-pending',
    'request-confirmed',
    'request-failed',
    'request-completed',
  ]);
  assert.equal(
    PROPRIEDADES_DO_ESTADO_EDITORIAL.trash.visivelNaListaDeEstados,
    true,
  );
  assert.equal(
    PROPRIEDADES_DO_ESTADO_EDITORIAL.trash.visivelNaListaDeTodos,
    false,
  );
});

test('o vocabulario nao valida a coluna: nenhum guarda de estado sai deste modulo', () => {
  // `posts.post_status` e `varchar(20)` sem `ENUM` e sem `CHECK`
  // (`target_data_model.md`, `DB-ENUM`), e `register_post_status()` e ponto de
  // extensao publico (P2). Um estado registrado por terceiro — aqui simulado
  // como string qualquer — nao e desta lista e nao e invalido: nao existe, neste
  // modulo, quem o recuse.
  const estadoDeExtensao = 'em-revisao-editorial';

  assert.ok(!(estadoDeExtensao in PROPRIEDADES_DO_ESTADO_EDITORIAL));
  assert.ok(
    !(ESTADOS_EDITORIAIS as readonly string[]).includes(estadoDeExtensao),
  );

  // E o tipo so descreve o vocabulario de fabrica: a coluna continua aceitando
  // o que o legado aceita, e e T002 que escreve a coluna.
  const deFabrica: EstadoEditorial = 'draft';
  assert.ok((ESTADOS_EDITORIAIS as readonly string[]).includes(deFabrica));
});
