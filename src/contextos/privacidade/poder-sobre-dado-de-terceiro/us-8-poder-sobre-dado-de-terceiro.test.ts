/**
 * Os criterios de aceite de **US-8** — *"tratar exportar e apagar dado de
 * terceiro como poder do nivel mais alto da instalacao"* (`REQ-095`, **T017** da
 * feature `008-privacidade-e-dados-pessoais`).
 *
 * | criterio | o que se afirma |
 * |---|---|
 * | `CA-8.1` | as tres capacidades resolvem para o poder de **rede** quando a instalacao e em rede |
 * | `CA-8.2` | fora de rede, resolvem para o poder de **administrar a instalacao** |
 * | `CA-8.3` | nenhum papel abaixo desse nivel recebe essas capacidades por padrao |
 * | `CA-8.4` | apagar a pagina de politica exige a capacidade de privacidade **somada** as capacidades normais de apagar |
 *
 * Esta e a suite de **implementacao**. A suite `[P]` do catalogo e **T018**, com
 * os seis casos `UT-095-1` a `UT-095-6` de `backlog/tests.md`, transcritos de la
 * e nao reconstruidos daqui.
 *
 * ⚠️ **A matriz de papeis e transcrita, nao importada.** A regra de dependencia 3
 * de `target_architecture.md` proibe `contextos/<a>/` importar `contextos/<b>/`
 * *"sempre, sem excecao"*, e a copia executavel vive em
 * `contextos/identidade-e-acesso/armazenamento/matriz-de-fabrica.ts`. A copia de
 * referencia e `wp-admin/includes/schema.php`, e e dela que estas listas saem,
 * linha por linha — o mesmo que `contextos/midia` fez em `ut-056`. A conferencia
 * da matriz transcrita contra a matriz gravada e `ut-013`/`ut-014` da feature
 * `001`, e nao desta tarefa.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAPACIDADE_DE_PRIVACIDADE_EM_REDE,
  CAPACIDADE_DE_PRIVACIDADE_FORA_DA_REDE,
  CONSTANTES_DE_FABRICA,
  OPCAO_DA_PAGINA_DE_POLITICA,
  REDE_INATIVA_NA_AUTORIZACAO,
  capacidadesExigidas,
  casoDeConteudo,
  papeisQueConcedem,
  perguntarPermissao,
  traducaoDePrivacidade,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type Capacidade,
  type ContextoDeAutorizacao,
  type ConteudoNaAutorizacao,
  type EstadoDaRedeNaAutorizacao,
  type EstadoDeConteudoNaAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type MatrizDePapeis,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  CAPACIDADES_DO_PODER_DE_PRIVACIDADE,
  CAPACIDADE_DE_ADMINISTRAR_PRIVACIDADE,
  CAPACIDADE_DE_APAGAR_CONTAS,
  CAPACIDADE_DE_APAGAR_DADO_DE_TERCEIRO,
  CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO,
  MENSAGENS_DAS_TELAS_DE_DADO_PESSOAL,
  casoDePoderDePrivacidade,
  papeisQueConcedemPoderDePrivacidade,
  permissaoDeAdministrarPrivacidade,
  permissaoDeApagarDadoDeTerceiro,
  permissaoDeExportarDadoDeTerceiro,
} from './index.js';

// ---------------------------------------------------------------------------
// A instalacao de fabrica, transcrita
// ---------------------------------------------------------------------------

function papelDeFabrica(
  identificador: string,
  capacidades: readonly string[],
): MatrizDePapeis[number] {
  return {
    identificador,
    capacidades: capacidades.map((capacidade) => ({
      capacidade,
      concedida: true,
    })),
  };
}

/**
 * A matriz como as oito rotinas de povoamento a deixam numa instalacao nova
 * (`populate_roles()`, `wp-admin/includes/schema.php:719`).
 *
 * ⚠️ As capacidades `level_*` entram porque elas **estao** na matriz de fabrica,
 * e uma matriz sem elas nao e a de fabrica. Nenhuma decisao de US-8 as le.
 *
 * ⚠️ **`manage_network` nao esta em papel nenhum**, e a ausencia e a metade de
 * `CA-8.1` que a matriz prova: em rede o poder nao vem de papel, vem do nome de
 * login na lista de super administradores (`PERM-9`).
 */
const MATRIZ_DE_FABRICA: MatrizDePapeis = [
  // `populate_roles_160()` (`schema.php:760`-`:789`), mais o laco de
  // `populate_roles_210()` (`:850`-`:864`) e `:869`-`:870`, e as rotinas 230 a
  // 300 (`:894`, `:907`, `:920`-`:921`, `:934`-`:935`, `:948`, `:961`-`:967`).
  papelDeFabrica('administrator', [
    'switch_themes', // :760
    'edit_themes', // :761
    'activate_plugins', // :762
    'edit_plugins', // :763
    'edit_users', // :764
    'edit_files', // :765
    'manage_options', // :766
    'moderate_comments', // :767
    'manage_categories', // :768
    'manage_links', // :769
    'upload_files', // :770
    'import', // :771
    'unfiltered_html', // :772
    'edit_posts', // :773
    'edit_others_posts', // :774
    'edit_published_posts', // :775
    'publish_posts', // :776
    'edit_pages', // :777
    'read', // :778
    'level_10', // :779
    'level_9', // :780
    'level_8', // :781
    'level_7', // :782
    'level_6', // :783
    'level_5', // :784
    'level_4', // :785
    'level_3', // :786
    'level_2', // :787
    'level_1', // :788
    'level_0', // :789
    'edit_others_pages', // :850
    'edit_published_pages', // :851
    'publish_pages', // :852
    'delete_pages', // :853
    'delete_others_pages', // :854
    'delete_published_pages', // :855
    'delete_posts', // :856
    'delete_others_posts', // :857
    'delete_published_posts', // :858
    'delete_private_posts', // :859
    'edit_private_posts', // :860
    'read_private_posts', // :861
    'delete_private_pages', // :862
    'edit_private_pages', // :863
    'read_private_pages', // :864
    'delete_users', // :869
    'create_users', // :870
    'unfiltered_upload', // :894
    'edit_dashboard', // :907
    'update_plugins', // :920
    'delete_plugins', // :921
    'install_plugins', // :934
    'update_themes', // :935
    'install_themes', // :948
    'update_core', // :961
    'list_users', // :962
    'remove_users', // :963
    'promote_users', // :964
    'edit_theme_options', // :965
    'delete_themes', // :966
    'export', // :967
  ]),
  // `populate_roles_160()` (`:793`-`:811`) mais o laco de `populate_roles_210()`
  // (`:850`-`:864`).
  papelDeFabrica('editor', [
    'moderate_comments', // :793
    'manage_categories', // :794
    'manage_links', // :795
    'upload_files', // :796
    'unfiltered_html', // :797
    'edit_posts', // :798
    'edit_others_posts', // :799
    'edit_published_posts', // :800
    'publish_posts', // :801
    'edit_pages', // :802
    'read', // :803
    'level_7', // :804
    'level_6', // :805
    'level_5', // :806
    'level_4', // :807
    'level_3', // :808
    'level_2', // :809
    'level_1', // :810
    'level_0', // :811
    'edit_others_pages', // :850
    'edit_published_pages', // :851
    'publish_pages', // :852
    'delete_pages', // :853
    'delete_others_pages', // :854
    'delete_published_pages', // :855
    'delete_posts', // :856
    'delete_others_posts', // :857
    'delete_published_posts', // :858
    'delete_private_posts', // :859
    'edit_private_posts', // :860
    'read_private_posts', // :861
    'delete_private_pages', // :862
    'edit_private_pages', // :863
    'read_private_pages', // :864
  ]),
  // `:815`-`:822` e `:875`-`:876`.
  papelDeFabrica('author', [
    'upload_files', // :815
    'edit_posts', // :816
    'edit_published_posts', // :817
    'publish_posts', // :818
    'read', // :819
    'level_2', // :820
    'level_1', // :821
    'level_0', // :822
    'delete_posts', // :875
    'delete_published_posts', // :876
  ]),
  // `:826`-`:829` e `:881`.
  papelDeFabrica('contributor', [
    'edit_posts', // :826
    'read', // :827
    'level_1', // :828
    'level_0', // :829
    'delete_posts', // :881
  ]),
  // `:833`-`:834`.
  papelDeFabrica('subscriber', [
    'read', // :833
    'level_0', // :834
  ]),
];

/** Os cinco papeis de fabrica, na ordem em que `add_role()` os cria (`:752`-`:756`). */
const PAPEIS_DE_FABRICA: readonly string[] = [
  'administrator',
  'editor',
  'author',
  'contributor',
  'subscriber',
];

/** Os quatro papeis **abaixo** do administrador — os de `CA-8.3`. */
const PAPEIS_ABAIXO_DO_NIVEL_MAIS_ALTO: readonly string[] =
  PAPEIS_DE_FABRICA.filter((papel) => papel !== 'administrator');

const CONTA_POR_PAPEL: Readonly<Record<string, number>> = {
  administrator: 1,
  editor: 2,
  author: 3,
  contributor: 4,
  subscriber: 5,
};

const LOGIN_DO_SUPER_ADMIN = 'super';

/** A conta com o papel gravado em `{site}capabilities`, e nada por cima. */
function atorDeFabrica(papel: string): AtorDeAutorizacao {
  return {
    contaId: CONTA_POR_PAPEL[papel] ?? 99,
    login: `conta-${papel}`,
    existe: true,
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

/** O super administrador: nome de login na lista da rede, e nenhum papel. */
const SUPER_ADMIN: AtorDeAutorizacao = {
  contaId: 9,
  login: LOGIN_DO_SUPER_ADMIN,
  existe: true,
  concessoes: [],
};

/** `is_multisite() === true`, com um super administrador declarado. */
const REDE_ATIVA: EstadoDaRedeNaAutorizacao = {
  ativa: true,
  loginsDeSuperAdmin: [LOGIN_DO_SUPER_ADMIN],
};

function base(
  rede: EstadoDaRedeNaAutorizacao,
  fonte?: FonteDeConteudoNaAutorizacao,
): BaseDeAutorizacao {
  return {
    matriz: MATRIZ_DE_FABRICA,
    rede,
    // O caso de conteudo entra so quando a pergunta e sobre um objeto (CA-8.4);
    // o caso desta pasta e acrescentado pelos proprios portoes.
    casosDeTraducao: fonte === undefined ? [] : [casoDeConteudo(fonte)],
  };
}

function contexto(
  papel: string,
  rede: EstadoDaRedeNaAutorizacao = REDE_INATIVA_NA_AUTORIZACAO,
  fonte?: FonteDeConteudoNaAutorizacao,
): ContextoDeAutorizacao {
  return { ...base(rede, fonte), ator: atorDeFabrica(papel) };
}

/** O pedido de traducao cru, para afirmar a lista exigida sem decidir nada. */
function traduzir(
  capacidade: Capacidade,
  emRede: boolean,
): readonly Capacidade[] | null {
  return casoDePoderDePrivacidade({
    capacidade,
    contaId: 1,
    argumentos: [],
    constantes: CONSTANTES_DE_FABRICA,
    emRede,
  });
}

// ---------------------------------------------------------------------------
// CA-8.1 e CA-8.2 — a resolucao, nas duas instalacoes
// ---------------------------------------------------------------------------

test('CA-8.1: as tres capacidades resolvem para o poder de rede em instalacao em rede', () => {
  for (const capacidade of CAPACIDADES_DO_PODER_DE_PRIVACIDADE) {
    assert.deepEqual(
      traduzir(capacidade, true),
      [CAPACIDADE_DE_PRIVACIDADE_EM_REDE],
      `${capacidade} deveria exigir manage_network em rede`,
    );
  }

  // E sao exatamente tres: os dois nomes de dado pessoal e o de configuracao.
  assert.deepEqual(CAPACIDADES_DO_PODER_DE_PRIVACIDADE, [
    'export_others_personal_data',
    'erase_others_personal_data',
    'manage_privacy_options',
  ]);
});

test('CA-8.2: fora de rede, as tres resolvem para o poder de administrar a instalacao', () => {
  for (const capacidade of CAPACIDADES_DO_PODER_DE_PRIVACIDADE) {
    assert.deepEqual(
      traduzir(capacidade, false),
      [CAPACIDADE_DE_PRIVACIDADE_FORA_DA_REDE],
      `${capacidade} deveria exigir manage_options fora de rede`,
    );
  }
});

test('CA-8.1/CA-8.2: a traducao depende da instalacao, e nao do ator', () => {
  // A mesma conta, as duas instalacoes: o que muda e a lista exigida.
  for (const papel of PAPEIS_DE_FABRICA) {
    assert.deepEqual(
      capacidadesExigidas(
        { ...contexto(papel, REDE_ATIVA) },
        CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO,
      ),
      [CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO],
      'sem o caso declarado, o default: devolve o proprio nome pedido',
    );
  }

  // Com o caso declarado — que e o que os portoes deste modulo fazem — a lista
  // passa a ser a do nivel mais alto, igual para todo ator.
  const comOCaso = (rede: EstadoDaRedeNaAutorizacao, papel: string) =>
    capacidadesExigidas(
      {
        ...contexto(papel, rede),
        casosDeTraducao: [casoDePoderDePrivacidade],
      },
      CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO,
    );

  assert.deepEqual(comOCaso(REDE_ATIVA, 'subscriber'), ['manage_network']);
  assert.deepEqual(comOCaso(REDE_ATIVA, 'administrator'), ['manage_network']);
  assert.deepEqual(comOCaso(REDE_INATIVA_NA_AUTORIZACAO, 'subscriber'), [
    'manage_options',
  ]);
  assert.deepEqual(comOCaso(REDE_INATIVA_NA_AUTORIZACAO, 'administrator'), [
    'manage_options',
  ]);
});

test('CA-8.1/CA-8.2: o caso devolve null para capacidade que nao e dele', () => {
  // `null` e "nao e meu caso" e e diferente de `[]`, que seria "permitido".
  for (const capacidade of [
    'manage_options',
    'manage_network',
    'delete_users',
    'edit_posts',
    'export_personal_data',
    'remove_personal_data',
    'export_personal_data_others',
  ]) {
    assert.equal(traduzir(capacidade, true), null, capacidade);
    assert.equal(traduzir(capacidade, false), null, capacidade);
  }
});

test('CA-8.2: fora de rede, o administrador passa nos tres portoes e o editor nao', () => {
  const administrador = contexto('administrator');
  assert.equal(permissaoDeExportarDadoDeTerceiro(administrador), null);
  assert.equal(permissaoDeApagarDadoDeTerceiro(administrador), null);
  assert.equal(permissaoDeAdministrarPrivacidade(administrador), null);

  const editor = contexto('editor');
  assert.deepEqual(permissaoDeExportarDadoDeTerceiro(editor), {
    motivo: 'sem-poder-de-exportar',
    mensagem: MENSAGENS_DAS_TELAS_DE_DADO_PESSOAL.semPoderDeExportar,
  });
  assert.deepEqual(permissaoDeApagarDadoDeTerceiro(editor), {
    motivo: 'sem-poder-de-apagar',
    mensagem: MENSAGENS_DAS_TELAS_DE_DADO_PESSOAL.semPoderDeApagar,
  });
  assert.deepEqual(permissaoDeAdministrarPrivacidade(editor), {
    motivo: 'sem-poder-de-administrar-privacidade',
    mensagem:
      MENSAGENS_DAS_TELAS_DE_DADO_PESSOAL.semPoderDeAdministrarPrivacidade,
  });
});

test('CA-8.1: em rede, o administrador do site e recusado e o super administrador passa', () => {
  // O cenario @regulatorio de PT-012, com estas palavras: "um administrador de
  // site em instalacao de rede tenta executar uma solicitacao de outro titular".
  const administradorDoSite = contexto('administrator', REDE_ATIVA);
  assert.deepEqual(permissaoDeExportarDadoDeTerceiro(administradorDoSite), {
    motivo: 'sem-poder-de-exportar',
    mensagem: MENSAGENS_DAS_TELAS_DE_DADO_PESSOAL.semPoderDeExportar,
  });
  assert.deepEqual(permissaoDeApagarDadoDeTerceiro(administradorDoSite), {
    motivo: 'sem-poder-de-apagar',
    mensagem: MENSAGENS_DAS_TELAS_DE_DADO_PESSOAL.semPoderDeApagar,
  });
  assert.deepEqual(permissaoDeAdministrarPrivacidade(administradorDoSite), {
    motivo: 'sem-poder-de-administrar-privacidade',
    mensagem:
      MENSAGENS_DAS_TELAS_DE_DADO_PESSOAL.semPoderDeAdministrarPrivacidade,
  });

  const administradorDeRede: ContextoDeAutorizacao = {
    ...base(REDE_ATIVA),
    ator: SUPER_ADMIN,
  };
  assert.equal(permissaoDeExportarDadoDeTerceiro(administradorDeRede), null);
  assert.equal(permissaoDeApagarDadoDeTerceiro(administradorDeRede), null);
  assert.equal(permissaoDeAdministrarPrivacidade(administradorDeRede), null);
});

test('CA-8.1: a mesma conta decide diferente so por a instalacao ser em rede', () => {
  // A diferenca entre as duas decisoes e exatamente a instalacao: o ator, a
  // matriz e a pergunta sao os mesmos.
  assert.equal(permissaoDeExportarDadoDeTerceiro(contexto('administrator')), null);
  assert.notEqual(
    permissaoDeExportarDadoDeTerceiro(contexto('administrator', REDE_ATIVA)),
    null,
  );
});

test('CA-8.1/CA-8.2: o portao de apagar faz DUAS perguntas, e para na primeira recusa', () => {
  // `! current_user_can( 'erase_others_personal_data' ) || ! current_user_can(
  // 'delete_users' )` (`wp-admin/erase-personal-data.php:12`). O ator abaixo tem
  // a de privacidade por concessao individual e NAO tem `delete_users`: e o unico
  // jeito de alcancar a segunda recusa, e e o que prova que ela existe.
  const comPrivacidadeSemApagarContas: ContextoDeAutorizacao = {
    ...base(REDE_INATIVA_NA_AUTORIZACAO),
    ator: {
      contaId: 7,
      login: 'conta-privacidade',
      existe: true,
      concessoes: [
        { capacidade: 'editor', concedida: true },
        // `manage_options` e o que as tres resolvem fora de rede.
        { capacidade: 'manage_options', concedida: true },
      ],
    },
  };

  assert.equal(
    permissaoDeExportarDadoDeTerceiro(comPrivacidadeSemApagarContas),
    null,
    'exportar pede uma capacidade so, e ela esta concedida',
  );
  assert.deepEqual(
    permissaoDeApagarDadoDeTerceiro(comPrivacidadeSemApagarContas),
    {
      motivo: 'sem-poder-de-apagar-contas',
      mensagem: MENSAGENS_DAS_TELAS_DE_DADO_PESSOAL.semPoderDeApagar,
    },
    'a segunda pergunta e `delete_users`, e a mensagem da recusa e a mesma',
  );

  // E `delete_users` sozinha nao abre a tela: a primeira pergunta recusa antes.
  const soApagarContas: ContextoDeAutorizacao = {
    ...base(REDE_INATIVA_NA_AUTORIZACAO),
    ator: {
      contaId: 8,
      login: 'conta-apagadora',
      existe: true,
      concessoes: [{ capacidade: CAPACIDADE_DE_APAGAR_CONTAS, concedida: true }],
    },
  };
  assert.deepEqual(permissaoDeApagarDadoDeTerceiro(soApagarContas), {
    motivo: 'sem-poder-de-apagar',
    mensagem: MENSAGENS_DAS_TELAS_DE_DADO_PESSOAL.semPoderDeApagar,
  });
});

// ---------------------------------------------------------------------------
// CA-8.3 — nenhum papel abaixo do nivel mais alto
// ---------------------------------------------------------------------------

test('CA-8.3: nenhum papel de fabrica concede as tres capacidades de privacidade', () => {
  assert.deepEqual(papeisQueConcedemPoderDePrivacidade(MATRIZ_DE_FABRICA), []);

  // E a ausencia e individual, nao agregada.
  for (const capacidade of CAPACIDADES_DO_PODER_DE_PRIVACIDADE) {
    assert.deepEqual(
      papeisQueConcedem(MATRIZ_DE_FABRICA, capacidade),
      [],
      capacidade,
    );
  }
});

test('CA-8.3: o poder em que elas resolvem so existe no nivel mais alto', () => {
  // Fora de rede: `manage_options` esta em UM papel, o administrador.
  assert.deepEqual(
    papeisQueConcedem(MATRIZ_DE_FABRICA, CAPACIDADE_DE_PRIVACIDADE_FORA_DA_REDE),
    ['administrator'],
  );

  // Em rede: `manage_network` nao esta em papel nenhum — e lista de login.
  assert.deepEqual(
    papeisQueConcedem(MATRIZ_DE_FABRICA, CAPACIDADE_DE_PRIVACIDADE_EM_REDE),
    [],
  );
});

test('CA-8.3: os quatro papeis abaixo sao recusados nos tres portoes, nas duas instalacoes', () => {
  for (const papel of PAPEIS_ABAIXO_DO_NIVEL_MAIS_ALTO) {
    for (const rede of [REDE_INATIVA_NA_AUTORIZACAO, REDE_ATIVA]) {
      const ator = contexto(papel, rede);
      assert.notEqual(
        permissaoDeExportarDadoDeTerceiro(ator),
        null,
        `${papel} nao deveria exportar dado de terceiro`,
      );
      assert.notEqual(
        permissaoDeApagarDadoDeTerceiro(ator),
        null,
        `${papel} nao deveria apagar dado de terceiro`,
      );
      assert.notEqual(
        permissaoDeAdministrarPrivacidade(ator),
        null,
        `${papel} nao deveria administrar a privacidade`,
      );
    }
  }
});

test('CA-8.3: conceder o NOME da capacidade a um papel nao abre o portao', () => {
  // PERM-3: "nenhuma das 104 chamadas pergunta por `edit_post`: todas perguntam
  // pelo que o mapeamento devolveu". O mesmo vale aqui — o nome concedido nunca
  // e consultado, porque a traducao o troca antes da comparacao. Um papel que
  // guarda `export_others_personal_data` continua sem poder exportar.
  const matrizAdulterada: MatrizDePapeis = [
    ...MATRIZ_DE_FABRICA,
    papelDeFabrica('privacidade-falsa', [
      ...CAPACIDADES_DO_PODER_DE_PRIVACIDADE,
      'read',
    ]),
  ];

  const ator: ContextoDeAutorizacao = {
    matriz: matrizAdulterada,
    rede: REDE_INATIVA_NA_AUTORIZACAO,
    casosDeTraducao: [],
    ator: {
      contaId: 6,
      login: 'conta-falsa',
      existe: true,
      concessoes: [{ capacidade: 'privacidade-falsa', concedida: true }],
    },
  };

  assert.deepEqual(papeisQueConcedemPoderDePrivacidade(matrizAdulterada), [
    'privacidade-falsa',
  ]);
  assert.notEqual(permissaoDeExportarDadoDeTerceiro(ator), null);
  assert.notEqual(permissaoDeAdministrarPrivacidade(ator), null);
});

// ---------------------------------------------------------------------------
// CA-8.4 — a pagina de politica de privacidade
// ---------------------------------------------------------------------------

const ID_DA_PAGINA_DE_POLITICA = 42;
const ID_DE_OUTRA_PAGINA = 43;
const CONTA_DO_AUTOR_DA_PAGINA = 77;

/** Os 15 slots que `get_post_type_capabilities()` deriva (`post.php:2042`-`:2072`). */
function capacidadesDerivadas(
  singular: string,
  plural: string,
): Readonly<Record<string, string>> {
  return {
    edit_post: `edit_${singular}`,
    read_post: `read_${singular}`,
    delete_post: `delete_${singular}`,
    edit_posts: `edit_${plural}`,
    edit_others_posts: `edit_others_${plural}`,
    delete_posts: `delete_${plural}`,
    publish_posts: `publish_${plural}`,
    read_private_posts: `read_private_${plural}`,
    read: 'read',
    delete_private_posts: `delete_private_${plural}`,
    delete_published_posts: `delete_published_${plural}`,
    delete_others_posts: `delete_others_${plural}`,
    edit_private_posts: `edit_private_${plural}`,
    edit_published_posts: `edit_published_${plural}`,
    create_posts: `edit_${plural}`,
  };
}

const TIPO_PAGINA: TipoDeConteudoNaAutorizacao = {
  nome: 'page',
  traduzMetaCapacidade: true,
  capacidades: capacidadesDerivadas('page', 'pages'),
};

const ESTADOS: Readonly<Record<string, EstadoDeConteudoNaAutorizacao>> = {
  publish: { nome: 'publish', publico: true, privado: false },
};

function paginaPublicada(id: number): ConteudoNaAutorizacao {
  return {
    id,
    tipo: 'page',
    estado: 'publish',
    estadoParaLeitura: 'publish',
    autorId: CONTA_DO_AUTOR_DA_PAGINA,
    paiId: 0,
  };
}

/**
 * A porta de conteudo da autorizacao, com `wp_page_for_privacy_policy` apontando
 * para {@link ID_DA_PAGINA_DE_POLITICA}.
 */
const FONTE_COM_POLITICA: FonteDeConteudoNaAutorizacao = {
  conteudo(referencia) {
    return typeof referencia === 'number' ? paginaPublicada(referencia) : null;
  },
  tipoDeConteudo(nome) {
    return nome === 'page' ? TIPO_PAGINA : null;
  },
  estadoDeConteudo(nome) {
    return ESTADOS[nome] ?? null;
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
    return ID_DA_PAGINA_DE_POLITICA;
  },
};

/** A opcao que guarda o identificador da pagina, como o legado a nomeia. */
test('CA-8.4: a pagina de politica e a que a opcao do legado aponta', () => {
  assert.equal(OPCAO_DA_PAGINA_DE_POLITICA, 'wp_page_for_privacy_policy');
});

test('CA-8.4: apagar a pagina de politica SOMA a capacidade de privacidade as normais', () => {
  // `$caps = array_merge( $caps, map_meta_cap( 'manage_privacy_options',
  // $user_id ) );` (`wp-includes/capabilities.php:180`), sob o `if` de `:179`.
  const comOCasoDeConteudo: BaseDeAutorizacao = {
    matriz: MATRIZ_DE_FABRICA,
    rede: REDE_INATIVA_NA_AUTORIZACAO,
    casosDeTraducao: [casoDeConteudo(FONTE_COM_POLITICA), traducaoDePrivacidade],
  };

  const exigidasNaPolitica = capacidadesExigidas(
    { ...comOCasoDeConteudo, ator: atorDeFabrica('editor') },
    'delete_post',
    ID_DA_PAGINA_DE_POLITICA,
  );

  // Pagina publicada de outra pessoa: as duas capacidades normais, e so entao a
  // de privacidade resolvida — nesta ordem, que e a do `array_merge`.
  assert.deepEqual(exigidasNaPolitica, [
    'delete_others_pages',
    'delete_published_pages',
    CAPACIDADE_DE_PRIVACIDADE_FORA_DA_REDE,
  ]);

  // A MESMA pagina, quando nao e a de politica, exige so as duas normais.
  const exigidasEmOutraPagina = capacidadesExigidas(
    { ...comOCasoDeConteudo, ator: atorDeFabrica('editor') },
    'delete_post',
    ID_DE_OUTRA_PAGINA,
  );
  assert.deepEqual(exigidasEmOutraPagina, [
    'delete_others_pages',
    'delete_published_pages',
  ]);
});

test('CA-8.4: o editor apaga a pagina comum e NAO apaga a de politica', () => {
  const editor = contexto('editor', REDE_INATIVA_NA_AUTORIZACAO, FONTE_COM_POLITICA);

  assert.equal(
    perguntarPermissao(editor, 'delete_post', ID_DE_OUTRA_PAGINA),
    true,
    'o editor de fabrica apaga pagina publicada de outra pessoa',
  );
  assert.equal(
    perguntarPermissao(editor, 'delete_post', ID_DA_PAGINA_DE_POLITICA),
    false,
    'a mesma pagina, sendo a de politica, exige manage_options, que o editor nao tem',
  );
});

test('CA-8.4: a capacidade de privacidade sozinha nao apaga a pagina de politica', () => {
  // A soma e soma: `PERM-1` exige TODAS as devolvidas, nao qualquer uma. Um ator
  // com `manage_options` e sem as capacidades de pagina continua recusado.
  const soPrivacidade: ContextoDeAutorizacao = {
    matriz: MATRIZ_DE_FABRICA,
    rede: REDE_INATIVA_NA_AUTORIZACAO,
    casosDeTraducao: [casoDeConteudo(FONTE_COM_POLITICA), traducaoDePrivacidade],
    ator: {
      contaId: 10,
      login: 'conta-so-privacidade',
      existe: true,
      concessoes: [
        { capacidade: CAPACIDADE_DE_PRIVACIDADE_FORA_DA_REDE, concedida: true },
      ],
    },
  };

  assert.equal(
    perguntarPermissao(soPrivacidade, 'delete_post', ID_DA_PAGINA_DE_POLITICA),
    false,
  );

  // O administrador tem as duas metades, e passa.
  const administrador = contexto(
    'administrator',
    REDE_INATIVA_NA_AUTORIZACAO,
    FONTE_COM_POLITICA,
  );
  assert.equal(
    perguntarPermissao(administrador, 'delete_post', ID_DA_PAGINA_DE_POLITICA),
    true,
  );
});

test('CA-8.4: em rede, apagar a pagina de politica passa a exigir o poder de rede', () => {
  // O ramo 7 soma `capacidadesDePrivacidade( emRede )`, logo a soma acompanha a
  // instalacao — e o administrador do site deixa de poder apagar a pagina.
  const administradorDoSite = contexto(
    'administrator',
    REDE_ATIVA,
    FONTE_COM_POLITICA,
  );

  assert.deepEqual(
    capacidadesExigidas(
      administradorDoSite,
      'delete_post',
      ID_DA_PAGINA_DE_POLITICA,
    ),
    [
      'delete_others_pages',
      'delete_published_pages',
      CAPACIDADE_DE_PRIVACIDADE_EM_REDE,
    ],
  );
  assert.equal(
    perguntarPermissao(
      administradorDoSite,
      'delete_post',
      ID_DA_PAGINA_DE_POLITICA,
    ),
    false,
  );
});

test('CA-8.4: editar a pagina de politica tambem soma, e e o mesmo ramo', () => {
  // `wp-includes/capabilities.php:283`, o gemeo de `:180` no `case` de editar.
  // Nao e criterio de US-8, que fala de apagar; esta afirmado porque `D5` diz
  // "a pagina e protegida pela propria capacidade de privacidade" e a protecao
  // de editar e a metade que um porte esquece.
  const editor = contexto('editor', REDE_INATIVA_NA_AUTORIZACAO, FONTE_COM_POLITICA);

  assert.deepEqual(
    capacidadesExigidas(editor, 'edit_post', ID_DA_PAGINA_DE_POLITICA),
    [
      'edit_others_pages',
      'edit_published_pages',
      CAPACIDADE_DE_PRIVACIDADE_FORA_DA_REDE,
    ],
  );
  assert.equal(
    perguntarPermissao(editor, 'edit_post', ID_DA_PAGINA_DE_POLITICA),
    false,
  );
});

// ---------------------------------------------------------------------------
// A sobreposicao declarada com `traducaoDePrivacidade`
// ---------------------------------------------------------------------------

test('o caso desta pasta e o da plataforma devolvem a mesma lista para o nome comum', () => {
  // `caso-de-poder-de-privacidade.ts` declara a sobreposicao em
  // `manage_privacy_options`: as duas devolvem a mesma lista, pela mesma funcao,
  // logo a ordem entre elas nao muda decisao nenhuma.
  for (const emRede of [true, false]) {
    const pedido = {
      capacidade: CAPACIDADE_DE_ADMINISTRAR_PRIVACIDADE,
      contaId: 1,
      argumentos: [] as readonly unknown[],
      constantes: CONSTANTES_DE_FABRICA,
      emRede,
    };
    assert.deepEqual(
      casoDePoderDePrivacidade(pedido),
      traducaoDePrivacidade(pedido),
    );
  }

  // E a plataforma NAO reconhece os dois nomes de dado pessoal: eles sao o que
  // esta tarefa acrescentou.
  for (const capacidade of [
    CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO,
    CAPACIDADE_DE_APAGAR_DADO_DE_TERCEIRO,
  ]) {
    assert.equal(
      traducaoDePrivacidade({
        capacidade,
        contaId: 1,
        argumentos: [],
        constantes: CONSTANTES_DE_FABRICA,
        emRede: false,
      }),
      null,
    );
    assert.notEqual(traduzir(capacidade, false), null);
  }
});
