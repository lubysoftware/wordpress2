/**
 * Testes da entrega de **T002**, metade da operacao nomeada: *"os dois formatos
 * existem como declaracao"*.
 *
 * Nao sao os testes de nenhuma historia — os de US-6 sao T014, um por caso de
 * `backlog/tests.md`. `satisfaz: — (infraestrutura)`.
 *
 * O arquivo gemeo e `../despacho/esquema-de-rota.test.ts`, e a leitura dos dois
 * lado a lado e o ponto desta feature: **la** a rota sem declaracao de permissao
 * e atendida com um aviso, **aqui** a operacao sem declaracao de permissao nao
 * chega a existir. Duas camadas, dois defaults opostos, nenhum dos dois
 * "corrigido" na direcao do outro — e o que `PERM-11` (BR-MIGRAR-097) queria
 * tornar visivel.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import type { AvisoDeUsoIndevido } from '../../../plataforma/autorizacao/index.js';

import {
  ANOTACOES_PADRAO_DA_OPERACAO,
  MENSAGENS_DE_RECUSA_DE_CATEGORIA,
  MENSAGENS_DE_RECUSA_DE_OPERACAO_NOMEADA,
  PADRAO_DO_APELIDO_DE_CATEGORIA,
  PADRAO_DO_NOME_DE_OPERACAO,
  ehRecusaDeDeclaracao,
  prepararOperacaoNomeada,
  type DeclaracaoDeOperacaoNomeada,
} from './esquema-de-operacao-nomeada.js';
import {
  criarRegistroDeCategoriasDeOperacao,
  criarRegistroDeOperacoesNomeadas,
  type RegistroDeCategoriasDeOperacao,
  type RegistroDeOperacoesNomeadas,
} from './registro-de-operacoes-nomeadas.js';

/** Coleta os avisos de uso indevido, para afirmar texto, versao e ordem. */
function coletorDeAvisos(): {
  avisar: (aviso: AvisoDeUsoIndevido) => void;
  avisos: AvisoDeUsoIndevido[];
} {
  const avisos: AvisoDeUsoIndevido[] = [];
  return { avisar: (aviso) => void avisos.push(aviso), avisos };
}

/**
 * Tira o rotulo da declaracao **sem** deixar a chave presente e `undefined`:
 * `exactOptionalPropertyTypes` recusa o segundo, e no legado "ausente" e chave
 * ausente.
 */
function semRotulo(
  declaracao: DeclaracaoDeOperacaoNomeada,
): DeclaracaoDeOperacaoNomeada {
  const { rotulo, ...resto } = declaracao;
  void rotulo;
  return resto;
}

/** Uma declaracao completa, no molde das tres do nucleo (`abilities.php:90`). */
function declaracaoCompleta(): DeclaracaoDeOperacaoNomeada {
  return {
    rotulo: 'Get Site Information',
    descricao: 'Returns site information configured in WordPress.',
    categoria: 'site',
    esquemaDeEntrada: {
      type: 'object',
      properties: { fields: { type: 'array', items: { type: 'string' } } },
      additionalProperties: false,
      default: {},
    },
    esquemaDeSaida: { type: 'object', additionalProperties: false },
    executar: () => ({ name: 'Site' }),
    permissao: () => true,
    meta: {
      annotations: { readonly: true, destructive: false, idempotent: true },
      public: true,
    },
  };
}

/** Os dois registros compostos na ordem do legado: categorias primeiro. */
function registrosDeTeste(): {
  categorias: RegistroDeCategoriasDeOperacao;
  operacoes: RegistroDeOperacoesNomeadas;
} {
  // `class-wp-abilities-registry.php:299`: *"ensure ability category registry is
  // initialized first to allow categories to be registered before abilities
  // that depend on them"*. A ordem e contrato (`EXT-ORDEM`), e por isso o
  // registro de categorias chega por argumento.
  const categorias = criarRegistroDeCategoriasDeOperacao();
  const operacoes = criarRegistroDeOperacoesNomeadas(categorias);
  categorias.registrar('site', {
    rotulo: 'Site',
    descricao: 'Abilities that retrieve or modify site information and settings.',
  });
  return { categorias, operacoes };
}

test('o formato aceita a declaracao completa, e resolve os defaults de metadado', () => {
  const pronta = prepararOperacaoNomeada('core/get-site-info', declaracaoCompleta());

  assert.ok(!ehRecusaDeDeclaracao(pronta));
  if (ehRecusaDeDeclaracao(pronta)) {
    return;
  }

  assert.equal(pronta.nome, 'core/get-site-info');
  assert.equal(pronta.rotulo, 'Get Site Information');
  assert.equal(pronta.categoria, 'site');
  assert.equal(pronta.esquemaDeEntrada.type, 'object');
  // `:370` — `show_in_rest` resolve do mais especifico para o menos: sem valor
  // explicito, `public: true` o semeia.
  assert.equal(pronta.meta.public, true);
  assert.equal(pronta.meta.show_in_rest, true);
  assert.deepEqual(pronta.meta.annotations, {
    readonly: true,
    destructive: false,
    idempotent: true,
  });
});

test('🔴 declaracao de permissao ausente RECUSA, e nao libera (I4 / BR-MIGRAR-071)', () => {
  // `class-wp-ability.php:309`-`:313`. E o oposto da camada de rotas, e e a
  // unica das tres camadas de autorizacao que falha fechada.
  const { permissao, ...semPermissao } = declaracaoCompleta();
  void permissao;

  const recusa = prepararOperacaoNomeada('core/get-site-info', semPermissao);

  assert.ok(ehRecusaDeDeclaracao(recusa));
  assert.equal(
    ehRecusaDeDeclaracao(recusa) ? recusa.mensagem : '',
    MENSAGENS_DE_RECUSA_DE_OPERACAO_NOMEADA.permissao,
  );
  // ⚠️ O verbo desta mensagem e *provide*, e o das outras quatro exigidas e
  // *contain*. Nao e descuido do teste: e o texto do legado.
  assert.match(
    MENSAGENS_DE_RECUSA_DE_OPERACAO_NOMEADA.permissao,
    /must provide a valid `permission_callback` function\.$/,
  );
});

test('🔴 a operacao recusada NAO EXISTE no registro, e o aviso carrega a mensagem da recusa', () => {
  // `class-wp-abilities-registry.php:172`-`:182`: a excecao do legado nunca
  // escapa — ela vira aviso de uso indevido e `null`.
  const { operacoes } = registrosDeTeste();
  const { avisar, avisos } = coletorDeAvisos();
  const { permissao, ...semPermissao } = declaracaoCompleta();
  void permissao;

  const registrada = operacoes.registrar(
    'core/get-site-info',
    semPermissao,
    avisar,
  );

  assert.equal(registrada, null);
  assert.equal(operacoes.estaRegistrada('core/get-site-info'), false);
  assert.deepEqual(operacoes.registradas(), []);
  assert.equal(avisos.length, 1);
  assert.equal(
    avisos[0]?.mensagem,
    MENSAGENS_DE_RECUSA_DE_OPERACAO_NOMEADA.permissao,
  );
  assert.equal(avisos[0]?.funcao, 'WP_Abilities_Registry::register');
  assert.equal(avisos[0]?.versao, '6.9.0');
});

test('a funcao de execucao ausente tambem recusa, e vem DEPOIS dos tres textos', () => {
  // A ordem de `prepare_properties()` e observavel, porque a primeira recusa e
  // a que sai: rotulo, descricao, categoria, execucao, permissao.
  const { executar, ...semExecucao } = declaracaoCompleta();
  void executar;

  const recusa = prepararOperacaoNomeada('core/get-site-info', semExecucao);
  assert.equal(
    ehRecusaDeDeclaracao(recusa) ? recusa.mensagem : '',
    MENSAGENS_DE_RECUSA_DE_OPERACAO_NOMEADA.execucao,
  );

  // Sem rotulo E sem execucao, a mensagem que sai e a do rotulo.
  const semOsDois = prepararOperacaoNomeada(
    'core/get-site-info',
    semRotulo(semExecucao),
  );
  assert.equal(
    ehRecusaDeDeclaracao(semOsDois) ? semOsDois.mensagem : '',
    MENSAGENS_DE_RECUSA_DE_OPERACAO_NOMEADA.rotulo,
  );
});

test('os tres textos exigidos usam `empty()`, logo `0` nao vale como texto', () => {
  // `:283`, `:289` e `:295`. Mesmo caso do registro de rota: `empty( '0' )` e
  // verdadeiro no legado.
  for (const campo of ['rotulo', 'descricao', 'categoria'] as const) {
    const recusa = prepararOperacaoNomeada('core/x', {
      ...declaracaoCompleta(),
      [campo]: '0',
    });
    assert.ok(ehRecusaDeDeclaracao(recusa), `${campo}: '0' tem de recusar`);
    assert.equal(
      ehRecusaDeDeclaracao(recusa) ? recusa.mensagem : '',
      MENSAGENS_DE_RECUSA_DE_OPERACAO_NOMEADA[campo],
    );
  }
});

test('as tres anotacoes nascem `null`, e nao `false`', () => {
  // `class-wp-ability.php:46`-`:59`. A diferenca e observavel: `null` e
  // "ninguem disse" e `false` e "disse que nao", e as duas saem na resposta.
  assert.deepEqual({ ...ANOTACOES_PADRAO_DA_OPERACAO }, {
    readonly: null,
    destructive: null,
    idempotent: null,
  });

  const { meta, ...semMeta } = declaracaoCompleta();
  void meta;
  const pronta = prepararOperacaoNomeada('core/x', semMeta);

  assert.ok(!ehRecusaDeDeclaracao(pronta));
  if (ehRecusaDeDeclaracao(pronta)) {
    return;
  }
  assert.deepEqual(pronta.meta.annotations, {
    readonly: null,
    destructive: null,
    idempotent: null,
  });
  assert.equal(pronta.meta.public, false);
  assert.equal(pronta.meta.show_in_rest, false);
});

test('`show_in_rest` explicito vence `public`, e publica fora da API REST e declaracao valida', () => {
  // `:366`-`:371`, *"from most specific to least specific"*.
  const pronta = prepararOperacaoNomeada('core/x', {
    ...declaracaoCompleta(),
    meta: { public: true, show_in_rest: false },
  });

  assert.ok(!ehRecusaDeDeclaracao(pronta));
  if (ehRecusaDeDeclaracao(pronta)) {
    return;
  }
  assert.equal(pronta.meta.public, true);
  assert.equal(pronta.meta.show_in_rest, false);
});

test('a anotacao declarada se soma aos defaults em vez de substitui-los', () => {
  // `:360`-`:363`: `wp_parse_args` sobre as tres anotacoes padrao.
  const pronta = prepararOperacaoNomeada('core/x', {
    ...declaracaoCompleta(),
    meta: { annotations: { readonly: true } },
  });

  assert.ok(!ehRecusaDeDeclaracao(pronta));
  if (ehRecusaDeDeclaracao(pronta)) {
    return;
  }
  assert.deepEqual(pronta.meta.annotations, {
    readonly: true,
    destructive: null,
    idempotent: null,
  });
});

test('campo desconhecido AVISA e e ignorado, e a operacao e registrada', () => {
  // `:185`-`:202`: o laco de atribuicao do construtor tem `property_exists()`
  // como portao e `continue` como consequencia — nao recusa.
  const { operacoes } = registrosDeTeste();
  const { avisar, avisos } = coletorDeAvisos();

  const registrada = operacoes.registrar(
    'core/get-site-info',
    { ...declaracaoCompleta(), inventado: 'x' } as DeclaracaoDeOperacaoNomeada,
    avisar,
  );

  assert.ok(registrada !== null);
  assert.equal(operacoes.estaRegistrada('core/get-site-info'), true);
  assert.equal(avisos.length, 1);
  assert.equal(avisos[0]?.funcao, 'WP_Ability::__construct');
  assert.match(avisos[0]?.mensagem ?? '', /"<code>inventado<\/code>"/);
  // ⚠️ `__CLASS__`, e nao `static::`: o aviso nomeia sempre `WP_Ability`.
  assert.match(avisos[0]?.mensagem ?? '', /<code>WP_Ability<\/code> class/);
});

test('a classe propria dispensa as duas funcoes exigidas, e so elas', () => {
  // `:302` e `:309`: as duas conferencias estao atras de
  // `get_class( $this ) === self::class`, porque uma classe propria pode trazer
  // as suas. Os tres textos continuam exigidos.
  const { executar, permissao, ...semFuncoes } = declaracaoCompleta();
  void executar;
  void permissao;

  const pronta = prepararOperacaoNomeada('core/x', {
    ...semFuncoes,
    classeDaOperacao: 'Minha_Ability',
  });
  assert.ok(!ehRecusaDeDeclaracao(pronta));
  if (ehRecusaDeDeclaracao(pronta)) {
    return;
  }
  assert.equal(pronta.executar, undefined);
  assert.equal(pronta.permissao, undefined);

  const faltandoRotulo = prepararOperacaoNomeada(
    'core/x',
    semRotulo({ ...semFuncoes, classeDaOperacao: 'Minha_Ability' }),
  );
  assert.ok(ehRecusaDeDeclaracao(faltandoRotulo));
});

test('o padrao do nome da operacao e o do apelido da categoria NAO sao o mesmo', () => {
  // `class-wp-abilities-registry.php:86` contra
  // `class-wp-ability-categories-registry.php:68`: no apelido o hifen nao abre,
  // nao fecha e nao dobra; no nome, pode.
  assert.ok(PADRAO_DO_NOME_DE_OPERACAO.test('core/get-site-info'));
  assert.ok(PADRAO_DO_NOME_DE_OPERACAO.test('a--b/-c-'));
  assert.ok(!PADRAO_DO_NOME_DE_OPERACAO.test('core'));
  assert.ok(!PADRAO_DO_NOME_DE_OPERACAO.test('core/a/b'));
  assert.ok(!PADRAO_DO_NOME_DE_OPERACAO.test('Core/Get-Site-Info'));

  assert.ok(PADRAO_DO_APELIDO_DE_CATEGORIA.test('site'));
  assert.ok(PADRAO_DO_APELIDO_DE_CATEGORIA.test('user-data'));
  assert.ok(!PADRAO_DO_APELIDO_DE_CATEGORIA.test('-site'));
  assert.ok(!PADRAO_DO_APELIDO_DE_CATEGORIA.test('a--b'));
  assert.ok(!PADRAO_DO_APELIDO_DE_CATEGORIA.test(''));
});

test('nome fora do padrao recusa, e vem ANTES da conferencia de ja registrada', () => {
  // `:86` antes de `:97`.
  const { operacoes } = registrosDeTeste();
  const { avisar, avisos } = coletorDeAvisos();

  assert.equal(operacoes.registrar('core', declaracaoCompleta(), avisar), null);
  assert.match(avisos[0]?.mensagem ?? '', /^Ability name must be a string/);
  assert.equal(avisos[0]?.funcao, 'WP_Abilities_Registry::register');
});

test('operacao ja registrada recusa a segunda, e a primeira continua valendo', () => {
  const { operacoes } = registrosDeTeste();
  const { avisar, avisos } = coletorDeAvisos();

  const primeira = operacoes.registrar(
    'core/get-site-info',
    declaracaoCompleta(),
    avisar,
  );
  const segunda = operacoes.registrar(
    'core/get-site-info',
    { ...declaracaoCompleta(), rotulo: 'Outro' },
    avisar,
  );

  assert.ok(primeira !== null);
  assert.equal(segunda, null);
  assert.equal(avisos.length, 1);
  assert.equal(
    avisos[0]?.mensagem,
    'Ability "core/get-site-info" is already registered.',
  );
  assert.equal(operacoes.obter('core/get-site-info')?.rotulo, 'Get Site Information');
});

test('🔴 a categoria tem de estar registrada ANTES, e a conferencia vem antes do formato', () => {
  // `:142`-`:156`, e o texto do aviso ENSINA a ordem. Caso 1 do cabecalho do
  // registro: com categoria inexistente E sem rotulo, a mensagem que sai e a da
  // categoria.
  const { operacoes } = registrosDeTeste();
  const { avisar, avisos } = coletorDeAvisos();

  const semCategoriaRegistrada = operacoes.registrar(
    'core/get-user-info',
    semRotulo({ ...declaracaoCompleta(), categoria: 'user' }),
    avisar,
  );

  assert.equal(semCategoriaRegistrada, null);
  assert.equal(avisos.length, 1);
  assert.equal(
    avisos[0]?.mensagem,
    'Ability category "user" is not registered. Please register the ability ' +
      'category before assigning it to ability "core/get-user-info".',
  );
});

test('🔴 categoria vazia cai na mensagem de "nao registrada", e nao na do formato', () => {
  // Caso 2 do cabecalho: o portao e `isset( $args['category'] )`, e `isset('')`
  // e verdadeiro. Um porte que trocasse `isset` por "nao vazio" daria a outra
  // mensagem.
  const { operacoes } = registrosDeTeste();
  const { avisar, avisos } = coletorDeAvisos();

  assert.equal(
    operacoes.registrar(
      'core/x',
      { ...declaracaoCompleta(), categoria: '' },
      avisar,
    ),
    null,
  );
  assert.match(avisos[0]?.mensagem ?? '', /^Ability category "" is not registered/);
  assert.notEqual(
    avisos[0]?.mensagem,
    MENSAGENS_DE_RECUSA_DE_OPERACAO_NOMEADA.categoria,
  );
});

test('pedir e tirar operacao que nao existe AVISA, com o metodo de cada caminho', () => {
  // `:205` e `:265`: o texto e o mesmo, e o nome do metodo no aviso e diferente.
  // E o caso de `UC-46`, *"ability inexistente"*, que CA-6.5 manda distinguir de
  // operacao sem permissao.
  const { operacoes } = registrosDeTeste();
  const { avisar, avisos } = coletorDeAvisos();

  assert.equal(operacoes.obter('core/ausente', avisar), null);
  assert.equal(operacoes.tirar('core/ausente', avisar), null);

  assert.deepEqual(
    avisos.map((aviso) => aviso.funcao),
    ['WP_Abilities_Registry::get_registered', 'WP_Abilities_Registry::unregister'],
  );
  assert.equal(avisos[0]?.mensagem, 'Ability "core/ausente" not found.');
  assert.equal(avisos[1]?.mensagem, avisos[0]?.mensagem);

  // ⚠️ `is_registered()` (`:244`) NAO avisa: e o portao silencioso, e e o que
  // `wp_has_ability()` usa.
  assert.equal(operacoes.estaRegistrada('core/ausente'), false);
  assert.equal(avisos.length, 2);
});

test('o registro de categorias confere ja registrada ANTES do padrao do apelido', () => {
  // `class-wp-ability-categories-registry.php:58` antes de `:68` — a ordem
  // inversa da do registro de operacoes. Reproduzida como esta.
  const categorias = criarRegistroDeCategoriasDeOperacao();
  const { avisar, avisos } = coletorDeAvisos();

  assert.ok(
    categorias.registrar(
      'site',
      { rotulo: 'Site', descricao: 'Abilities about the site.' },
      avisar,
    ) !== null,
  );
  assert.equal(
    categorias.registrar(
      'site',
      { rotulo: 'Site', descricao: 'Outra.' },
      avisar,
    ),
    null,
  );
  assert.equal(
    avisos[0]?.mensagem,
    'Ability category "site" is already registered.',
  );
  assert.equal(avisos[0]?.funcao, 'WP_Ability_Categories_Registry::register');

  assert.equal(
    categorias.registrar(
      '-invalido',
      { rotulo: 'X', descricao: 'Y' },
      avisar,
    ),
    null,
  );
  assert.match(
    avisos[1]?.mensagem ?? '',
    /^Ability category slug must contain only lowercase/,
  );
});

test('a categoria exige rotulo e descricao, com a mensagem propria dela', () => {
  // `class-wp-ability-category.php:130`-`:140`. ⚠️ O texto NAO e o da operacao:
  // diz *"ability category properties"*.
  const categorias = criarRegistroDeCategoriasDeOperacao();
  const { avisar, avisos } = coletorDeAvisos();

  assert.equal(categorias.registrar('site', { descricao: 'Y' }, avisar), null);
  assert.equal(avisos[0]?.mensagem, MENSAGENS_DE_RECUSA_DE_CATEGORIA.rotulo);
  assert.match(
    MENSAGENS_DE_RECUSA_DE_CATEGORIA.rotulo,
    /^The ability category properties/,
  );

  assert.equal(categorias.registrar('site', { rotulo: 'X' }, avisar), null);
  assert.equal(avisos[1]?.mensagem, MENSAGENS_DE_RECUSA_DE_CATEGORIA.descricao);
});

test('as operacoes e as categorias saem na ordem de registro', () => {
  // `get_all_registered()` (`:228` e `:149`) devolve o vetor na ordem em que as
  // chaves entraram, e e essa ordem que CA-6.6 publica.
  const { categorias, operacoes } = registrosDeTeste();
  categorias.registrar('user', {
    rotulo: 'User',
    descricao: 'Abilities that retrieve or modify user information.',
  });

  operacoes.registrar('core/get-site-info', declaracaoCompleta());
  operacoes.registrar('core/get-user-info', {
    ...declaracaoCompleta(),
    categoria: 'user',
  });

  assert.deepEqual(
    operacoes.registradas().map((operacao) => operacao.nome),
    ['core/get-site-info', 'core/get-user-info'],
  );
  assert.deepEqual(
    categorias.registradas().map((categoria) => categoria.apelido),
    ['site', 'user'],
  );
});

test('duas composicoes de registro nao se enxergam (EXT-CONTEXTO)', () => {
  // No legado os dois registros sao singleton (`:27`), como o registro de rotas
  // e global. Mesma nota: num processo longo-vivo um estatico faria a operacao
  // de uma requisicao aparecer na seguinte.
  const primeira = registrosDeTeste();
  const segunda = registrosDeTeste();

  primeira.operacoes.registrar('core/get-site-info', declaracaoCompleta());

  assert.equal(primeira.operacoes.estaRegistrada('core/get-site-info'), true);
  assert.equal(segunda.operacoes.estaRegistrada('core/get-site-info'), false);
  assert.deepEqual(segunda.operacoes.registradas(), []);
});

test('o aviso e opcional, e o registro decide igual sem ele (P7)', () => {
  const { operacoes } = registrosDeTeste();
  const { permissao, ...semPermissao } = declaracaoCompleta();
  void permissao;

  assert.equal(operacoes.registrar('core/x', semPermissao), null);
  assert.ok(operacoes.registrar('core/y', declaracaoCompleta()) !== null);
});
