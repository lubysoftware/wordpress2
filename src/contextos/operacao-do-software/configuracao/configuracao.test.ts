/**
 * Testes da metade de **T002** que diz *"existem com os valores de fabrica do
 * legado"*: os tres grupos de configuracao nomeada.
 *
 * O **P6** da constituicao define o que esta suite tem de fazer: *"cada numero
 * vive num ponto de configuracao nomeado, com o valor de fabrica do legado, e
 * existe teste que afirma o valor e o efeito da borda (no ultimo instante
 * aceita, um instante depois recusa)"*. Por isso ha afirmacao de **valor** e
 * afirmacao de **borda**, e nao so de valor.
 *
 * Nao sao os testes de nenhuma historia. A ordem das chaves do registro
 * gravado, que e metade do que se afirma aqui, e **efeito no banco**: a ordem de
 * insercao do arranjo e observavel nos bytes, e o cenario de paridade do codec
 * e literal — *"nenhuma das duas normaliza, reordena nem reindexa a
 * estrutura"*.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  arranjoPorNome,
  booleano,
  inteiro,
  serializarComoTexto,
  texto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import {
  criarArmazenamentoDeOperacaoDoSoftware,
  criarPortaDeDadosFalsa,
  SITE_UNICO,
  type EscopoDeRede,
  type PortaDeDadosFalsa,
} from '../armazenamento/index.js';
import {
  ACAO_DE_SAIR_DA_RECUPERACAO,
  CANAIS_DE_PRE_LANCAMENTO,
  CANAL_SO_DE_VERSAO_MENOR,
  COMPRIMENTO_DA_CHAVE_DE_RECUPERACAO,
  COMPRIMENTO_DO_ALEATORIO_DO_COOKIE,
  COMPRIMENTO_DO_SEGREDO_DE_ASSINATURA,
  COMPRIMENTO_DO_TOKEN_DE_RECUPERACAO,
  CONSTANTE_DA_POLITICA_DO_NUCLEO,
  CONSTANTE_DA_SESSAO_DE_RECUPERACAO,
  CONSTANTE_QUE_DESLIGA_A_AUTOMACAO,
  criarConfiguracaoDeOperacaoDoSoftware,
  EVENTO_DE_LIMPEZA_DE_CHAVES_DE_RECUPERACAO,
  LIMITE_ENTRE_AVISOS_DE_RECUPERACAO_EM_SEGUNDOS,
  POLITICA_DESLIGADA,
  POLITICA_LIGADA,
  POLITICA_NA_AUSENCIA_DA_OPCAO,
  POLITICA_NAO_DECLARADA,
  POLITICA_SEM_ESCOLHA,
  POLITICA_SEMEADA_NA_INSTALACAO,
  PONTO_DE_EXTENSAO_QUE_DESLIGA_A_AUTOMACAO,
  PONTOS_DE_EXTENSAO_DA_POLITICA,
  prazoDoLinkDeRecuperacao,
  PRAZO_DO_COOKIE_DE_RECUPERACAO_EM_SEGUNDOS,
  registroDeAvisoDaAtualizacao,
  registroDeChavesDeRecuperacao,
  registroDeExtensoesPausadas,
  registroDeFalhaComum,
  registroDeFalhaCritica,
  resolverPoliticaDeAtualizacao,
  SEGUNDOS_POR_DIA,
  SEGUNDOS_POR_HORA,
  SEGUNDOS_POR_SEMANA,
  SEM_CHAVES_DE_RECUPERACAO,
  TIPOS_DE_AVISO_DA_ATUALIZACAO,
} from './index.js';

const EM_REDE: EscopoDeRede = { emRede: true, redeId: 1 };

function comPorta(): {
  falsa: PortaDeDadosFalsa;
  configuracao: ReturnType<typeof criarConfiguracaoDeOperacaoDoSoftware>;
} {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeOperacaoDoSoftware(falsa.porta);
  return {
    falsa,
    configuracao: criarConfiguracaoDeOperacaoDoSoftware(
      armazenamento.opcoesDoSite,
      armazenamento.opcoesDeRede,
    ),
  };
}

function bytes(valor: ValorPhp): string {
  return serializarComoTexto(valor);
}

// ── As unidades de tempo ───────────────────────────────────────────────────

test('as unidades de tempo sao as do legado, por multiplicacao', () => {
  // `wp-includes/default-constants.php:158` a `:161`.
  assert.equal(SEGUNDOS_POR_HORA, 3600);
  assert.equal(SEGUNDOS_POR_DIA, 86400);
  assert.equal(SEGUNDOS_POR_SEMANA, 604800);
});

// ── Grupo 1: o estado de falha da atualizacao automatica ───────────────────

test('o valor de fabrica das duas opcoes de falha e "nao existe"', () => {
  const { falsa, configuracao } = comPorta();
  const estado = configuracao.estadoDeAtualizacao;

  falsa.responderSemLinha();
  assert.equal(estado.lerFalha(SITE_UNICO), null);

  falsa.responderSemLinha();
  assert.equal(estado.lerAviso(SITE_UNICO), null);

  falsa.responderSemLinha();
  assert.equal(estado.temFalhaRegistrada(SITE_UNICO), false);

  // Tres leituras, nenhuma escrita: ler estado de fabrica nao semeia nada. O
  // instalador tambem nao as cria.
  assert.equal(falsa.escritas.length, 0);
});

test('o registro de falha critica tem as seis chaves do legado, nesta ordem', () => {
  const registro = registroDeFalhaCritica({
    tentada: '7.1.3',
    corrente: '7.1.2',
    codigoDeErro: 'disk_full',
    dadoDoErro: texto('sem espaco'),
    instante: 1760000000,
  });

  // `class-wp-automatic-updater.php:826` a `:833`. `critical` e BOOLEANO, e os
  // bytes mostram: `b:1;` e nao `i:1;`.
  assert.equal(
    bytes(registro),
    'a:6:{s:9:"attempted";s:5:"7.1.3";s:7:"current";s:5:"7.1.2";' +
      's:10:"error_code";s:9:"disk_full";s:10:"error_data";s:10:"sem espaco";' +
      's:9:"timestamp";i:1760000000;s:8:"critical";b:1;}',
  );
});

test('as duas chaves de reversao entram SO quando a reversao tambem falhou', () => {
  const semReversao = registroDeFalhaCritica({
    tentada: '7.1.3',
    corrente: '7.1.2',
    codigoDeErro: 'do_rollback',
    dadoDoErro: { tipo: 'nulo' },
    instante: 1,
  });
  const comReversao = registroDeFalhaCritica({
    tentada: '7.1.3',
    corrente: '7.1.2',
    codigoDeErro: 'rollback_was_required',
    dadoDoErro: { tipo: 'nulo' },
    instante: 1,
    reversao: { codigo: 'do_rollback', dado: texto('falhou') },
  });

  // `if ( isset( $rollback_result ) )` (`class-wp-automatic-updater.php:834`):
  // "A rollback is only critical if it failed too".
  assert.equal(semReversao.tipo === 'arranjo' && semReversao.entradas.length, 6);
  assert.equal(comReversao.tipo === 'arranjo' && comReversao.entradas.length, 8);
  assert.equal(bytes(comReversao).includes('s:13:"rollback_code"'), true);
  assert.equal(bytes(semReversao).includes('s:13:"rollback_code"'), false);
});

test('o registro de falha comum NAO tem a chave critical, e tem retry', () => {
  const registro = registroDeFalhaComum({
    tentada: '7.1.3',
    corrente: '7.1.2',
    codigoDeErro: 'download_failed',
    dadoDoErro: { tipo: 'nulo' },
    instante: 1760000000,
    repetivel: true,
  });

  // E a diferenca que decide o congelamento de `A5`: `! empty( ['critical'] )`
  // e falso por AUSENCIA (`class-core-upgrader.php:327`).
  assert.equal(bytes(registro).includes('critical'), false);
  assert.equal(bytes(registro).includes('s:5:"retry";b:1;'), true);
});

test('a visao tipada le as duas formas, e a ausencia de chave e falsa', () => {
  const { falsa, configuracao } = comPorta();
  const estado = configuracao.estadoDeAtualizacao;

  const critica = registroDeFalhaCritica({
    tentada: '7.1.3',
    corrente: '7.1.2',
    codigoDeErro: 'disk_full',
    dadoDoErro: texto('cheio'),
    instante: 1760000000,
  });
  falsa.responder([{ meta_value: bytes(critica) }]);
  const lidaCritica = estado.lerFalha(EM_REDE);

  assert.equal(lidaCritica?.critica, true);
  // `retry` nao esta no registro critico: a ausencia e falsa.
  assert.equal(lidaCritica?.repetivel, false);
  assert.equal(lidaCritica?.tentada, '7.1.3');
  assert.equal(lidaCritica?.codigoDeErro, 'disk_full');
  assert.equal(lidaCritica?.instante, 1760000000);
  assert.equal(lidaCritica?.codigoDaReversao, null);

  const comum = registroDeFalhaComum({
    tentada: '7.1.3',
    corrente: '7.1.2',
    codigoDeErro: 'download_failed',
    dadoDoErro: { tipo: 'nulo' },
    instante: 2,
    repetivel: true,
  });
  falsa.responder([{ meta_value: bytes(comum) }]);
  const lidaComum = estado.lerFalha(EM_REDE);

  assert.equal(lidaComum?.critica, false);
  assert.equal(lidaComum?.repetivel, true);
});

test('registro gravado como arranjo vazio: ha opcao, e nao ha falha', () => {
  const { falsa, configuracao } = comPorta();
  const estado = configuracao.estadoDeAtualizacao;

  falsa.responder([{ option_value: 'a:0:{}' }]);
  const lida = estado.lerFalha(SITE_UNICO);

  falsa.responder([{ option_value: 'a:0:{}' }]);
  const tem = estado.temFalhaRegistrada(SITE_UNICO);

  // `lerFalha` devolve a visao (ha arranjo), mas `if ( $failure_data )` do
  // legado e **falso** para arranjo vazio (`class-core-upgrader.php:325`) — e e
  // essa a pergunta que o portao de `A6` faz
  // (`class-wp-automatic-updater.php:856`).
  assert.notEqual(lida, null);
  assert.equal(tem, false);
});

test('apagar o registro de falha e um comando, e nao um efeito colateral', () => {
  const { falsa, configuracao } = comPorta();

  falsa.responder([{ autoload: 'off' }]);
  const apagou = configuracao.estadoDeAtualizacao.apagarFalha(SITE_UNICO);

  assert.equal(apagou, true);
  assert.equal(falsa.escritas.length, 1);
  assert.equal(
    falsa.escritas[0]?.texto,
    'DELETE FROM `wp_options` WHERE `option_name` = ?',
  );
});

test('o registro de aviso tem as quatro chaves de A7, nesta ordem', () => {
  const registro = registroDeAvisoDaAtualizacao({
    tipo: 'fail',
    email: 'admin@exemplo.invalido',
    versao: '7.1.3',
    instante: 1760000000,
  });

  // `class-wp-automatic-updater.php:901` a `:906`. A dupla
  // destinatario-e-versao e a chave de negocio de `A7`, e o tipo e o terceiro
  // campo que `:865` compara.
  assert.equal(
    bytes(registro),
    'a:4:{s:4:"type";s:4:"fail";s:5:"email";s:22:"admin@exemplo.invalido";' +
      's:7:"version";s:5:"7.1.3";s:9:"timestamp";i:1760000000;}',
  );
  assert.deepEqual(TIPOS_DE_AVISO_DA_ATUALIZACAO, [
    'success',
    'fail',
    'manual',
    'critical',
  ]);
});

test('a visao tipada do aviso devolve a dupla que A7 compara', () => {
  const { falsa, configuracao } = comPorta();

  falsa.responder([
    {
      meta_value: bytes(
        registroDeAvisoDaAtualizacao({
          tipo: 'fail',
          email: 'admin@exemplo.invalido',
          versao: '7.1.3',
          instante: 7,
        }),
      ),
    },
  ]);
  const aviso = configuracao.estadoDeAtualizacao.lerAviso(EM_REDE);

  assert.equal(aviso?.tipo, 'fail');
  assert.equal(aviso?.email, 'admin@exemplo.invalido');
  assert.equal(aviso?.versao, '7.1.3');
  assert.equal(aviso?.instante, 7);
});

// ── Grupo 2: a politica de atualizacao ────────────────────────────────────

test('🔴 o valor de fabrica da politica tem DUAS respostas no legado, e as duas estao aqui', () => {
  // O que o instalador SEMEIA (`wp-admin/includes/schema.php:550`, `:551`,
  // `:556`, com o comentario "Default to enabled for new installs"):
  assert.deepEqual(POLITICA_SEMEADA_NA_INSTALACAO, {
    desenvolvimento: 'enabled',
    menor: 'enabled',
    maior: 'enabled',
  });

  // O que a LEITURA assume na ausencia da opcao
  // (`wp-admin/includes/class-core-upgrader.php:288` a `:290`):
  assert.deepEqual(POLITICA_NA_AUSENCIA_DA_OPCAO, {
    desenvolvimento: 'enabled',
    menor: 'enabled',
    maior: 'unset',
  });

  // A diferenca e so na versao maior, e e o conflito que T002 registrou e NAO
  // resolveu — ver o cabecalho de `politica-de-atualizacao.ts`.
  assert.notEqual(
    POLITICA_SEMEADA_NA_INSTALACAO.maior,
    POLITICA_NA_AUSENCIA_DA_OPCAO.maior,
  );
  assert.equal(POLITICA_LIGADA, 'enabled');
  assert.equal(POLITICA_DESLIGADA, 'disabled');
  assert.equal(POLITICA_SEM_ESCOLHA, 'unset');
});

test('ler a politica emite tres SELECT e aplica o default de cada opcao', () => {
  const { falsa, configuracao } = comPorta();

  falsa.responder([{ meta_value: 'enabled' }]);
  falsa.responderSemLinha();
  falsa.responderSemLinha();
  const opcoes = configuracao.politicaDeAtualizacao.lerOpcoes(EM_REDE);

  assert.equal(falsa.selecoes.length, 3);
  assert.deepEqual(opcoes, {
    desenvolvimento: 'enabled',
    menor: 'enabled',
    maior: 'unset',
  });
  assert.deepEqual(falsa.selecoes.map((consulta) => consulta.parametros[0]), [
    'auto_update_core_dev',
    'auto_update_core_minor',
    'auto_update_core_major',
  ]);
});

test('`unset` e indistinguivel de `disabled` na leitura: so `enabled` liga', () => {
  const comUnset = resolverPoliticaDeAtualizacao(
    POLITICA_NA_AUSENCIA_DA_OPCAO,
    POLITICA_NAO_DECLARADA,
  );
  const comDisabled = resolverPoliticaDeAtualizacao(
    { desenvolvimento: 'enabled', menor: 'enabled', maior: 'disabled' },
    POLITICA_NAO_DECLARADA,
  );

  // A comparacao do legado e `=== 'enabled'`; a diferenca entre os tres estados
  // aparece na TELA, nao aqui (BR-MIGRAR-046).
  assert.deepEqual(comUnset, {
    desenvolvimento: true,
    menor: true,
    maior: false,
  });
  assert.deepEqual(comDisabled, comUnset);
});

test('a constante vence a opcao, nos quatro ramos do legado', () => {
  const ligadas = {
    desenvolvimento: POLITICA_LIGADA,
    menor: POLITICA_LIGADA,
    maior: POLITICA_LIGADA,
  };
  const desligadas = {
    desenvolvimento: POLITICA_DESLIGADA,
    menor: POLITICA_DESLIGADA,
    maior: POLITICA_DESLIGADA,
  };

  // `false` desliga TUDO, mesmo com as tres opcoes ligadas (`A3`).
  assert.deepEqual(
    resolverPoliticaDeAtualizacao(ligadas, { declarada: true, valor: false }),
    { desenvolvimento: false, menor: false, maior: false },
  );

  // `true` liga tudo, mesmo com as tres desligadas.
  assert.deepEqual(
    resolverPoliticaDeAtualizacao(desligadas, { declarada: true, valor: true }),
    { desenvolvimento: true, menor: true, maior: true },
  );

  // Os quatro canais de pre-lancamento tambem ligam tudo
  // (`class-core-upgrader.php:300`).
  for (const canal of CANAIS_DE_PRE_LANCAMENTO) {
    assert.deepEqual(
      resolverPoliticaDeAtualizacao(desligadas, {
        declarada: true,
        valor: canal,
      }),
      { desenvolvimento: true, menor: true, maior: true },
      canal,
    );
  }

  // `'minor'` e o ramo ASSIMETRICO: liga o menor e desliga os outros dois, sem
  // olhar a opcao de nenhum dos tres (`:306`).
  assert.deepEqual(
    resolverPoliticaDeAtualizacao(ligadas, {
      declarada: true,
      valor: CANAL_SO_DE_VERSAO_MENOR,
    }),
    { desenvolvimento: false, menor: true, maior: false },
  );
});

test('⚠️ constante com valor desconhecido NAO desliga nada: a opcao continua valendo', () => {
  const ligadas = {
    desenvolvimento: POLITICA_LIGADA,
    menor: POLITICA_LIGADA,
    maior: POLITICA_LIGADA,
  };

  // A cadeia de `if`/`elseif` do legado nao tem `else`
  // (`class-core-upgrader.php:293` a `:312`). Um porte que normalizasse valor
  // desconhecido para falso desligaria a automacao de uma instalacao que o
  // legado deixa LIGADA.
  for (const valor of ['major', 'yes', '1', 'minor-only']) {
    assert.deepEqual(
      resolverPoliticaDeAtualizacao(ligadas, { declarada: true, valor }),
      { desenvolvimento: true, menor: true, maior: true },
      valor,
    );
  }
});

test('gravar a escolha de versao maior e a unica escrita da politica', () => {
  const { falsa, configuracao } = comPorta();

  falsa.responder([{ meta_value: 'unset' }]);
  const gravou = configuracao.politicaDeAtualizacao.gravarEscolhaDeVersaoMaior(
    EM_REDE,
    POLITICA_LIGADA,
  );

  // `wp-admin/update-core.php:1311`. A capacidade `update_core` e o nonce
  // `core-major-auto-updates-nonce` sao de T015; o comando e daqui.
  assert.equal(gravou, true);
  assert.deepEqual(falsa.escritas, [
    {
      texto:
        'UPDATE `wp_sitemeta` SET `meta_value` = ? ' +
        'WHERE `site_id` = ? AND `meta_key` = ?',
      parametros: ['enabled', 1, 'auto_update_core_major'],
    },
  ]);
});

test('os quatro pontos de extensao e as duas constantes estao declarados, e nao aplicados', () => {
  assert.equal(CONSTANTE_QUE_DESLIGA_A_AUTOMACAO, 'AUTOMATIC_UPDATER_DISABLED');
  assert.equal(CONSTANTE_DA_POLITICA_DO_NUCLEO, 'WP_AUTO_UPDATE_CORE');
  assert.equal(
    PONTO_DE_EXTENSAO_QUE_DESLIGA_A_AUTOMACAO,
    'automatic_updater_disabled',
  );
  assert.deepEqual(PONTOS_DE_EXTENSAO_DA_POLITICA, {
    desenvolvimento: 'allow_dev_auto_core_updates',
    menor: 'allow_minor_auto_core_updates',
    maior: 'allow_major_auto_core_updates',
  });

  // ⚠️ `resolverPoliticaDeAtualizacao` NAO recebe interceptador, e e proposito:
  // o legado aplica os tres TARDE e UM POR VEZ, cada um no ramo de versao dele
  // (`class-core-upgrader.php:357`, `:373`, `:386`). Aplicar os tres aqui faria
  // disparar ponto de extensao que o legado nao dispara, e P2 poe "a ordem de
  // disparo" no contrato publico.
  assert.equal(resolverPoliticaDeAtualizacao.length, 2);
});

// ── Grupo 3: a sessao de recuperacao ──────────────────────────────────────

test('os dois prazos de A10 sao o dia e a semana do legado', () => {
  // `class-wp-recovery-mode.php:307` e
  // `class-wp-recovery-mode-cookie-service.php:46`.
  assert.equal(LIMITE_ENTRE_AVISOS_DE_RECUPERACAO_EM_SEGUNDOS, 86400);
  assert.equal(PRAZO_DO_COOKIE_DE_RECUPERACAO_EM_SEGUNDOS, 604800);
});

test('o prazo do link e um `max`, e um interceptador nao consegue encurta-lo', () => {
  const limite = LIMITE_ENTRE_AVISOS_DE_RECUPERACAO_EM_SEGUNDOS;

  // "The ttl must be at least as long as the email rate limit"
  // (`class-wp-recovery-mode.php:325` a `:333`).
  assert.equal(prazoDoLinkDeRecuperacao(limite, limite), limite);
  assert.equal(prazoDoLinkDeRecuperacao(1, limite), limite);
  assert.equal(prazoDoLinkDeRecuperacao(limite - 1, limite), limite);
  // A borda: um segundo acima do limite JA alonga.
  assert.equal(prazoDoLinkDeRecuperacao(limite + 1, limite), limite + 1);
  // E dobrar o limite dobra o prazo do link, sem tocar no segundo filtro.
  assert.equal(prazoDoLinkDeRecuperacao(2 * limite, 2 * limite), 2 * limite);
});

test('os quatro comprimentos e os tres nomes publicados da recuperacao', () => {
  assert.equal(COMPRIMENTO_DO_TOKEN_DE_RECUPERACAO, 22);
  assert.equal(COMPRIMENTO_DA_CHAVE_DE_RECUPERACAO, 22);
  assert.equal(COMPRIMENTO_DO_ALEATORIO_DO_COOKIE, 20);
  assert.equal(COMPRIMENTO_DO_SEGREDO_DE_ASSINATURA, 64);

  assert.equal(ACAO_DE_SAIR_DA_RECUPERACAO, 'exit_recovery_mode');
  assert.equal(
    CONSTANTE_DA_SESSAO_DE_RECUPERACAO,
    'WP_RECOVERY_MODE_SESSION_ID',
  );
  assert.equal(
    EVENTO_DE_LIMPEZA_DE_CHAVES_DE_RECUPERACAO,
    'recovery_mode_clean_expired_keys',
  );
});

test('o valor de fabrica de recovery_keys e arranjo vazio, e nao opcao ausente', () => {
  const { falsa, configuracao } = comPorta();

  falsa.responderSemLinha();
  const chaves = configuracao.sessaoDeRecuperacao.lerChaves();

  assert.deepEqual(chaves, SEM_CHAVES_DE_RECUPERACAO);
  assert.equal(chaves.length, 0);
  assert.equal(falsa.escritas.length, 0);
});

test('a chave de recuperacao e gravada com token como chave, resumo e instante', () => {
  const registro = registroDeChavesDeRecuperacao([
    { token: 'abc', resumo: '$wp$resumo', criadaEm: 1760000000 },
  ]);

  // `class-wp-recovery-mode-key-service.php:50` a `:53`: duas chaves, nesta
  // ordem, dentro de uma entrada cuja chave e o token.
  assert.equal(
    bytes(registro),
    'a:1:{s:3:"abc";a:2:{s:10:"hashed_key";s:10:"$wp$resumo";' +
      's:10:"created_at";i:1760000000;}}',
  );
});

test('gravar as chaves desliga o autocarregamento, sempre', () => {
  const { falsa, configuracao } = comPorta();

  falsa.responder([{ option_value: 'a:0:{}' }]);
  configuracao.sessaoDeRecuperacao.gravarChaves(
    registroDeChavesDeRecuperacao([
      { token: 'abc', resumo: 'r', criadaEm: 1 },
    ]),
  );

  // `update_option( $this->option_name, $keys, false )` (`:191`).
  assert.equal(falsa.escritas[0]?.parametros[1], 'off');
});

test('gravar o mesmo conjunto de chaves NAO emite comando: e a limpeza diaria', () => {
  const { falsa, configuracao } = comPorta();

  const mesmo = registroDeChavesDeRecuperacao([
    { token: 'abc', resumo: 'r', criadaEm: 1 },
  ]);
  falsa.responder([{ option_value: bytes(mesmo) }]);
  const gravou = configuracao.sessaoDeRecuperacao.gravarChaves(mesmo);

  // `clean_expired_keys()` grava SEMPRE (`:125`): quando nada venceu, o valor e
  // o mesmo e nenhuma escrita sai. E o quarto caminho de "nenhum comando" desta
  // feature.
  assert.equal(gravou, false);
  assert.equal(falsa.escritas.length, 0);
});

test('as chaves lidas voltam na ordem gravada, e entrada sem as duas chaves e ignorada', () => {
  const { falsa, configuracao } = comPorta();

  const comLixo = arranjoPorNome([
    [
      'primeira',
      arranjoPorNome([
        ['hashed_key', texto('r1')],
        ['created_at', inteiro(10)],
      ]),
    ],
    ['truncada', arranjoPorNome([['hashed_key', texto('r2')]])],
    ['nem-arranjo', texto('x')],
    [
      'segunda',
      arranjoPorNome([
        ['hashed_key', texto('r3')],
        ['created_at', inteiro(20)],
      ]),
    ],
  ]);
  falsa.responder([{ option_value: bytes(comLixo) }]);
  const chaves = configuracao.sessaoDeRecuperacao.lerChaves();

  // A ordem e a de insercao do arranjo, e e observavel nos bytes. As duas
  // entradas malformadas nao viram chave aqui: o legado so as recusa no momento
  // da verificacao (`:93`), e **depois de ja as ter removido** (ADR 0007).
  assert.deepEqual(chaves, [
    { token: 'primeira', resumo: 'r1', criadaEm: 10 },
    { token: 'segunda', resumo: 'r3', criadaEm: 20 },
  ]);
});

test('o marcador de aviso: ausente e `0` dao o mesmo resultado', () => {
  const { falsa, configuracao } = comPorta();
  const sessao = configuracao.sessaoDeRecuperacao;

  falsa.responderSemLinha();
  assert.equal(sessao.lerUltimoAviso(), null);

  falsa.responder([{ option_value: '0' }]);
  assert.equal(sessao.lerUltimoAviso(), null);

  falsa.responder([{ option_value: '1760000000' }]);
  assert.equal(sessao.lerUltimoAviso(), 1760000000);

  // `if ( ! $last_sent || ... )` (`class-wp-recovery-mode-email-service.php:57`):
  // marcador gravado com `0` nao limita nada, e o aviso sai como se nunca
  // tivesse saido.
});

test('🔴 gravar o marcador devolve se gravou, porque o retorno ABORTA o aviso', () => {
  const falhou = criarPortaDeDadosFalsa({
    resultadoDeEscrita: { linhasAfetadas: 0, idGerado: null },
  });
  const armazenamento = criarArmazenamentoDeOperacaoDoSoftware(falhou.porta);
  const sessao = criarConfiguracaoDeOperacaoDoSoftware(
    armazenamento.opcoesDoSite,
    armazenamento.opcoesDeRede,
  ).sessaoDeRecuperacao;

  falhou.responder([{ option_value: '1' }]);
  falhou.responder([{ autoload: 'auto' }]);
  const gravou = sessao.gravarUltimoAviso(1760000000);

  // `if ( ! update_option( self::RATE_LIMIT_OPTION, time() ) ) { return
  // new WP_Error( 'storage_error', ... ); }`
  // (`class-wp-recovery-mode-email-service.php:58` a `:60`). `A10` registra que
  // a ordem "escolhe perder o aviso em vez de arriscar repeti-lo": quem chamar
  // e descartar este retorno troca a regra.
  assert.equal(gravou, false);
});

test('sair da recuperacao apaga o marcador, e o apagamento e um DELETE', () => {
  const { falsa, configuracao } = comPorta();

  falsa.responder([{ autoload: 'auto' }]);
  const apagou = configuracao.sessaoDeRecuperacao.apagarUltimoAviso();

  // `clear_rate_limit()` (`class-wp-recovery-mode-email-service.php:96`),
  // chamado por `exit_recovery_mode()` (`class-wp-recovery-mode.php:211`): e a
  // metade de `A12` que "zera o limite de aviso".
  assert.equal(apagou, true);
  assert.deepEqual(falsa.escritas, [
    {
      texto: 'DELETE FROM `wp_options` WHERE `option_name` = ?',
      parametros: ['recovery_mode_email_last_sent'],
    },
  ]);
});

test('o segredo de assinatura e opcao de REDE, e vazio conta como ausente', () => {
  const { falsa, configuracao } = comPorta();
  const sessao = configuracao.sessaoDeRecuperacao;

  falsa.responderSemLinha();
  assert.equal(sessao.lerChaveDeAssinatura(EM_REDE), null);

  falsa.responder([{ meta_value: '' }]);
  assert.equal(sessao.lerSalDeAssinatura(EM_REDE), null);

  falsa.responder([{ meta_value: 'segredo' }]);
  assert.equal(sessao.lerChaveDeAssinatura(EM_REDE), 'segredo');

  // `if ( ! $auth_key )` (`class-wp-recovery-mode-cookie-service.php:216`): o
  // legado gera outro quando o gravado e vazio.
  assert.deepEqual(
    falsa.selecoes.map((consulta) => consulta.parametros[0]),
    [
      'recovery_mode_auth_key',
      'recovery_mode_auth_salt',
      'recovery_mode_auth_key',
    ],
  );
  assert.equal(
    falsa.selecoes[0]?.texto,
    'SELECT meta_value FROM wp_sitemeta WHERE meta_key = ? AND site_id = ?',
  );
});

test('🔴 a opcao de extensoes pausadas carrega o identificador da sessao no NOME', () => {
  const { falsa, configuracao } = comPorta();

  falsa.responderSemLinha();
  configuracao.sessaoDeRecuperacao.lerExtensoesPausadas('a1b2c3');

  // UC-36: "o nome da opcao que guarda as extensoes pausadas carrega o
  // identificador da sessao. E o que permite consertar um site em producao sem
  // que o visitante veja a diferenca" — CA-12.3
  // (`class-wp-paused-extensions-storage.php:224`). Duas sessoes nao se
  // enxergam porque o NOME e outro.
  assert.deepEqual(falsa.selecoes[0]?.parametros, ['a1b2c3_paused_extensions']);
});

test('o registro de pausa tem dois niveis, e tipo vazio nao entra nele', () => {
  const soPlugin = registroDeExtensoesPausadas(
    [{ slug: 'defeituoso', erro: texto('erro fatal') }],
    [],
  );
  const osDois = registroDeExtensoesPausadas(
    [{ slug: 'defeituoso', erro: texto('p') }],
    [{ slug: 'tema-ruim', erro: texto('t') }],
  );

  // O legado nunca grava `array( 'plugin' => array() )`: `unset()` tira o tipo
  // vazio (`class-wp-paused-extensions-storage.php:107` e `:187`), e se o
  // arranjo inteiro ficar vazio a opcao e APAGADA (`:112` e `:190`).
  assert.equal(
    bytes(soPlugin),
    'a:1:{s:6:"plugin";a:1:{s:10:"defeituoso";s:10:"erro fatal";}}',
  );
  assert.equal(bytes(osDois).startsWith('a:2:{s:6:"plugin";'), true);
  assert.equal(bytes(osDois).includes('s:5:"theme";'), true);
  assert.equal(bytes(registroDeExtensoesPausadas([], [])), 'a:0:{}');
});

test('a visao tipada da pausa separa os dois tipos e guarda o erro como esta', () => {
  const { falsa, configuracao } = comPorta();

  const erroDoPlugin = arranjoPorNome([
    ['type', inteiro(1)],
    ['message', texto('Fatal error')],
  ]);
  falsa.responder([
    {
      option_value: bytes(
        registroDeExtensoesPausadas(
          [{ slug: 'defeituoso', erro: erroDoPlugin }],
          [{ slug: 'tema-ruim', erro: booleano(true) }],
        ),
      ),
    },
  ]);
  const pausadas = configuracao.sessaoDeRecuperacao.lerExtensoesPausadas('s1');

  // O erro fica opaco: a forma vem de `error_get_last()`, e o runtime do alvo
  // nao e o do legado (`class-wp-paused-extensions-storage.php:45` a `:52`).
  assert.deepEqual(pausadas.plugins, [
    { slug: 'defeituoso', erro: erroDoPlugin },
  ]);
  assert.deepEqual(pausadas.temas, [{ slug: 'tema-ruim', erro: booleano(true) }]);
});

test('gravar e apagar a pausa usam o nome da sessao, e a gravacao desliga o autoload', () => {
  const { falsa, configuracao } = comPorta();
  const sessao = configuracao.sessaoDeRecuperacao;

  falsa.responder([{ option_value: 'a:0:{}' }]);
  sessao.gravarExtensoesPausadas(
    's1',
    registroDeExtensoesPausadas([{ slug: 'x', erro: texto('e') }], []),
  );

  assert.equal(
    falsa.escritas[0]?.texto,
    'UPDATE `wp_options` SET `option_value` = ?, `autoload` = ? ' +
      'WHERE `option_name` = ?',
  );
  assert.deepEqual(falsa.escritas[0]?.parametros[1], 'off');
  assert.deepEqual(
    falsa.escritas[0]?.parametros[2],
    's1_paused_extensions',
  );

  falsa.responder([{ autoload: 'off' }]);
  assert.equal(sessao.apagarExtensoesPausadas('s1'), true);
  assert.deepEqual(falsa.escritas[1]?.parametros, ['s1_paused_extensions']);
});

// ── A composicao ──────────────────────────────────────────────────────────

test('compor a configuracao nao emite consulta nenhuma (EXT-ORDEM)', () => {
  const falsa = criarPortaDeDadosFalsa();
  const armazenamento = criarArmazenamentoDeOperacaoDoSoftware(falsa.porta);

  const configuracao = criarConfiguracaoDeOperacaoDoSoftware(
    armazenamento.opcoesDoSite,
    armazenamento.opcoesDeRede,
  );

  // A ordem de arranque e contrato publico (BR-MIGRAR-106, e a tabela "Nao
  // negociavel" da constituicao). Nenhum valor de fabrica e lido, semeado ou
  // conferido no carregamento.
  assert.equal(falsa.selecoes.length, 0);
  assert.equal(falsa.escritas.length, 0);
  assert.deepEqual(Object.keys(configuracao).sort(), [
    'estadoDeAtualizacao',
    'politicaDeAtualizacao',
    'sessaoDeRecuperacao',
  ]);
});
