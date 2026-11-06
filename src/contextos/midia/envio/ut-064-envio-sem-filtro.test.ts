/**
 * A entrega de **T020** da feature `006-biblioteca-de-midia`: *"5 testes
 * automatizados, um por caso registrado em `../../../backlog/tests.md`
 * (UT-064-1, UT-064-2, UT-064-3, UT-064-4, UT-064-5), com o mesmo dado de
 * entrada, acao e resultado esperado. O teste de regra de negocio (UT-064-5)
 * entra na mesma suite."*
 *
 * ---
 *
 * # Os cinco casos foram COPIADOS do catalogo, nao reconstruidos
 *
 * O card REQ-064 e a secao que comeca em `backlog/tests.md:962`, e os cinco
 * casos sao as linhas `:968` a `:972`, com **ID, nome, tipo e prova**. O
 * catalogo nao traz tabela de dados para este card: a prova de cada caso e o
 * texto do criterio (ou da regra), e o cenario e o do criterio.
 *
 * | caso | nome, como o catalogo o escreve | tipo | prova |
 * |---|---|---|---|
 * | `UT-064-1` | nega a toda conta a capacidade de enviar sem filtro, inclusive à de maior poder | `erro` | CA-9.1 |
 * | `UT-064-2` | faz a capacidade passar a existir quando a instalação a declara | `feliz` | CA-9.2 |
 * | `UT-064-3` | mantém a recusa a quem não tem a capacidade declarada, mesmo com a permissão liberada | `erro` | CA-9.3 |
 * | `UT-064-4` | registra cada envio feito por esse caminho com conta, arquivo e instante | `feliz` | CA-9.4 |
 * | `UT-064-5` | inverte o padrão das demais capacidades: sem declaração da instalação, nega sempre | `erro` | regra de US-9 (BR-MIGRAR-094) |
 *
 * ---
 *
 * # Nao e a suite de criterio de T019, e a diferenca esta em DUAS fixtures
 *
 * T019 entrega *"os criterios CA-9.1 a CA-9.4 passam"* e tem a suite dela em
 * `./us-9-envio-sem-filtro.test.ts`, com uma matriz de tres papeis escolhida a
 * mao — so `upload_files` e `unfiltered_upload` — e um ator por teste. E o certo
 * para afirmar criterio. O catalogo, porem, fala de **toda conta** e de **cada
 * envio**, e esta suite troca duas fixtures para poder afirmar isso:
 *
 * 1. **a matriz de papeis e a de fabrica, com os cinco papeis**, transcrita de
 *    `wp-admin/includes/schema.php:759`-`:967` com a linha de cada concessao em
 *    comentario. E ela que da sentido literal a *"toda conta"* e a *"a de maior
 *    poder"*: o administrador de fabrica **tem** `unfiltered_upload` gravado
 *    (`populate_roles_230()`, `:894`) e mais nenhum papel tem; o editor de
 *    fabrica tem `upload_files` e `unfiltered_html` e nao tem
 *    `unfiltered_upload`, e e por isso que ele e quem UT-064-3 recusa. E e ela
 *    que torna UT-064-5 afirmavel contra **o padrao das demais**: as
 *    capacidades que as outras tres constantes alcancam (`edit_themes`,
 *    `update_core`, `unfiltered_html`...) estao em papeis de fabrica, e o que
 *    decide elas numa instalacao de fabrica e a matriz;
 * 2. **o relogio do evento anda.** Cada leitura de `agoraEmMilissegundos()`
 *    devolve o instante seguinte, e e com isso que UT-064-4 afirma *"cada envio
 *    ... com ... instante"* como **um instante por envio**, e nao como um valor
 *    fixo repetido.
 *
 * Os casos perguntam pela capacidade **e** pelo envio. A pergunta de capacidade
 * (`perguntarPermissao`, de `plataforma/autorizacao/`) e o que o catalogo nomeia
 * (*"a capacidade de enviar sem filtro"*); o envio (`enviarArquivo`, de T003 e
 * T019) e onde o legado usa a resposta — o `if` de
 * `wp-admin/includes/file.php:971`, unica porta do contorno neste caminho.
 *
 * ---
 *
 * # O que esta suite NAO afirma
 *
 * 🔴 **O terceiro termo do legado nao esta no porte, e nenhum caso aqui o
 * exercita.** `capabilities.php:588` exige
 * `( ! is_multisite() || is_super_admin( $user_id ) )` alem da constante, e o
 * caso de revogacao da plataforma (`revogacao-por-constante.ts`) nao tem esse
 * termo: numa rede, com a constante declarada, um administrador que nao e super
 * administrador teria a capacidade no porte e nao a teria no legado. T019
 * registrou a lacuna no `README.md` do modulo e em
 * `registro-de-envio-sem-filtro.ts`. Esta suite usa a rede **so** com o super
 * administrador — em que porte e legado concordam nos dois sentidos — e nao
 * escreve um teste que afirmaria o comportamento divergente.
 *
 * 🔴 **Nem a traducao de `upload_plugins` e `upload_themes`.** As duas estao
 * entre as capacidades que as constantes alcancam, e o legado as resolve para
 * `install_plugins` e `install_themes` (`capabilities.php:636`-`:639`) — logo o
 * administrador de fabrica as tem. A plataforma nao porta essa traducao: sem
 * caso para elas, a pergunta cai na matriz, onde nenhum papel as concede, e a
 * resposta e `false`. A lacuna e de `plataforma/autorizacao/` (feature 001), nao
 * desta historia, e UT-064-5 contrasta a inversa so com as capacidades
 * concedidas por papel, sem afirmar nenhum dos dois lados dela.
 *
 * ⚠️ **O evento de UT-064-4 nao existe no legado.** O legado nao registra envio
 * nenhum; o canal e a adicao que P7 permite, feita por T019 e opcional (sem
 * canal, o envio e o do legado — afirmado em `us-9-envio-sem-filtro.test.ts`).
 * O caso do catalogo afirma o que a historia pede sobre o canal, e nada do que
 * o envio grava muda por causa dele.
 *
 * ---
 *
 * # Como se confere
 *
 * A spec de paridade e
 * `.specify/migration/parity_tests/07-autorizacao-por-capacidade.feature`,
 * esquema *"Uma constante retira poder de quem ja o tem, inclusive do super
 * administrador"* (`:104`-`:115`), cuja tabela traz `ALLOW_UNFILTERED_UPLOADS`
 * junto das outras tres — e UT-064-5 e a mesma tabela lida pelo lado da
 * inversa. As ancoras foram abertas nesta tarefa na arvore 7.1.2 legivel em
 * disco (`db_version` 61833): `capabilities.php:587`-`:592`,
 * `file.php:971`-`:976`, `schema.php:719`-`:734` (a ordem de povoamento) e
 * `:759`-`:967` (as concessoes). A conferencia caso a caso contra o oraculo
 * executavel (resposta 16, `scripts/oraculo/`) continua sendo o passo de
 * paridade: aqui o que se afirma e o sistema novo.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  capacidadesAlcancadasPorConstante,
  comAtor,
  CONSTANTES_DE_FABRICA,
  papeisQueConcedem,
  perguntarPermissao,
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type ConstantesDoServidor,
  type EstadoDaRedeNaAutorizacao,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarCanalQueRegistra,
  type CanalQueRegistra,
} from '../../../plataforma/registro-de-operacao/index.js';
import {
  criarArmazenamentoDeMidia,
  criarPortaDeDadosFalsa,
  type PedidoDeAnexo,
} from '../armazenamento/index.js';
import type {
  LeituraDeArquivo,
  OperacaoDeArquivo,
  PortaDeSistemaDeArquivos,
} from '../portas/index.js';
import {
  enviarArquivo,
  MENSAGEM_DE_ENVIO_NAO_PERMITIDO,
  MENSAGEM_DE_TIPO_NAO_PERMITIDO,
  ORIGEM_DO_ENVIO_SEM_FILTRO,
  type ContextoDeEnvio,
  type ResultadoDoEnvio,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const RAIZ_DA_INSTALACAO = '/var/www/';
const RAIZ_DE_ENVIOS = '/var/www/wp-content/uploads';
const ENDERECO_BASE = 'https://exemplo.test/wp-content/uploads';
/** `current_time( 'mysql' )` congelado: a pasta e `/2026/10`. */
const AGORA_NO_BANCO = '2026-10-11 14:30:00';
const PASTA_DO_MES = `${RAIZ_DE_ENVIOS}/2026/10`;
const CAMINHO_TEMPORARIO = '/tmp/phpA1b2c3';

/** O primeiro instante do relogio do evento; cada leitura anda um segundo. */
const PRIMEIRO_INSTANTE = 1_792_000_000_000;

const CAPACIDADE_SEM_FILTRO = 'unfiltered_upload';

/**
 * O arquivo cujo tipo a lista de fabrica **nao** reconhece: `bin` nao esta em
 * `wp_get_mime_types()`, logo `$ext` e `$type` caem juntos e o `if` de
 * `file.php:971` e alcancado.
 */
const ARQUIVO_SEM_TIPO = 'instalador.bin';
/** `$_FILES[...]['type']` — o que o navegador afirmou, e nada mais. */
const TIPO_AFIRMADO_PELO_CLIENTE = 'application/octet-stream';

/** `define( 'ALLOW_UNFILTERED_UPLOADS', true )` no arquivo de configuracao. */
const INSTALACAO_QUE_DECLAROU: ConstantesDoServidor = {
  ALLOW_UNFILTERED_UPLOADS: true,
};

/** A rede, para o unico ator de rede desta suite: o super administrador. */
const LOGIN_DO_SUPER_ADMIN = 'dona-da-rede';
const REDE_COM_SUPER_ADMIN: EstadoDaRedeNaAutorizacao = {
  ativa: true,
  loginsDeSuperAdmin: [LOGIN_DO_SUPER_ADMIN],
};

/* ── A MATRIZ DE PAPEIS DE FABRICA ─────────────────────────────────────────── */

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
 * A matriz como `populate_roles()` a deixa numa instalacao nova
 * (`wp-admin/includes/schema.php:719`-`:734`: `_160`, `_210`, `_230`, `_250`,
 * `_260`, `_270`, `_280` e `_300`, nessa ordem).
 *
 * Transcrita, **nao** importada: a regra de dependencia 3 de
 * `target_architecture.md` proibe `contextos/<a>/` importar `contextos/<b>/`, e
 * a copia executavel vive em
 * `contextos/identidade-e-acesso/armazenamento/matriz-de-fabrica.ts`. A copia de
 * referencia e `schema.php`, e e dela que estas listas saem, linha por linha.
 */
const MATRIZ_DE_FABRICA: MatrizDePapeis = [
  papelDeFabrica('administrator', [
    // `populate_roles_160()` (`:759`-`:789`).
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
    // `populate_roles_210()`, o laco sobre administrador e editor (`:843`-`:864`).
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
    // `populate_roles_230()` — e SO o administrador.
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
  papelDeFabrica('editor', [
    // `populate_roles_160()` (`:792`-`:811`).
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
    // `populate_roles_210()` (`:850`-`:864`).
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
  // Sem `upload_files`: o colaborador e o assinante nao chegam ao filtro de
  // tipo, sao recusados antes, pela capacidade de enviar.
  papelDeFabrica('contributor', [
    'edit_posts', // :826
    'read', // :827
    'level_1', // :828
    'level_0', // :829
    'delete_posts', // :881
  ]),
  papelDeFabrica('subscriber', [
    'read', // :833
    'level_0', // :834
  ]),
];

/** Os cinco papeis de fabrica, do de maior poder ao de menor. */
const PAPEIS_DE_FABRICA = [
  'administrator',
  'editor',
  'author',
  'contributor',
  'subscriber',
] as const;

/** Cada papel com uma conta propria: o numero e o da posicao, mais um. */
function contaDoPapel(papel: string): number {
  return PAPEIS_DE_FABRICA.indexOf(papel as (typeof PAPEIS_DE_FABRICA)[number]) + 1;
}

function atorDeFabrica(papel: string, login = `conta-${contaDoPapel(papel)}`): AtorDeAutorizacao {
  return {
    contaId: contaDoPapel(papel),
    login,
    existe: true,
    // `{site}capabilities` de uma conta de papel unico: a chave e o papel.
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

function baseDe(
  constantes: ConstantesDoServidor,
  rede: EstadoDaRedeNaAutorizacao = REDE_INATIVA_NA_AUTORIZACAO,
): BaseDeAutorizacao {
  return { matriz: MATRIZ_DE_FABRICA, rede, constantes };
}

/* ── OS DUPLOS DAS BORDAS ───────────────────────────────────────────────────── */

/** O disco que registra operacao e responde como a pasta do mes existente. */
function discoQueRegistra(): PortaDeSistemaDeArquivos {
  const sucesso: OperacaoDeArquivo = { concluido: true };
  return {
    raizDeEnvios: RAIZ_DE_ENVIOS,
    existe: (caminho) => caminho === CAMINHO_TEMPORARIO,
    ehPasta: (caminho) => caminho === PASTA_DO_MES,
    gravavel: () => true,
    criarPasta: () => sucesso,
    escrever: () => sucesso,
    ler: (): LeituraDeArquivo<Uint8Array> => ({ concluido: true, valor: new Uint8Array() }),
    mover: () => sucesso,
    copiar: () => sucesso,
    apagar: () => sucesso,
    listar: (): LeituraDeArquivo<readonly string[]> => ({ concluido: true, valor: [] }),
  };
}

interface Cenario {
  readonly contexto: ContextoDeEnvio;
  /** Todo `wp_insert_attachment()` pedido, na ordem. Lista vazia e afirmacao. */
  readonly insercoes: PedidoDeAnexo[];
  readonly canal: CanalQueRegistra;
}

function cenario(ator: AtorDeAutorizacao, base: BaseDeAutorizacao): Cenario {
  const insercoes: PedidoDeAnexo[] = [];
  const canal = criarCanalQueRegistra();
  let proximoInstante = PRIMEIRO_INSTANTE;

  const contexto: ContextoDeEnvio = {
    base,
    ator,
    sistemaDeArquivos: discoQueRegistra(),
    armazenamento: criarArmazenamentoDeMidia(criarPortaDeDadosFalsa().porta),
    conteudo: {
      // Sem conteudo de destino (`$post_id = 0`): a segunda pergunta de
      // capacidade do envio nao e feita, e o anexo nasce sem pai.
      obterDestino: () => null,
      inserirAnexo(pedido) {
        insercoes.push(pedido);
        return { inserido: true, anexoId: 100 + insercoes.length };
      },
    },
    relogio: { agoraNoFormatoDoBanco: () => AGORA_NO_BANCO },
    texto: {
      removerAcentos: (valor) => valor,
      ehUtf8Valido: () => true,
      sanitizarTituloComTracos: (valor) =>
        valor.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sanitizarCampoDeTexto: (valor) => valor.trim(),
    },
    escaparHtml: (valor) => valor.split('&').join('&amp;'),
    // O contorno nao consulta a deteccao: sem tipo esperado nao ha o que
    // confrontar (`wp-includes/functions.php:3134`). O duplo devolve nada.
    deteccao: {
      tipoDeImagem: () => null,
      fileinfoDisponivel: () => true,
      tipoPorConteudo: () => null,
    },
    enderecoBaseDeEnvios: ENDERECO_BASE,
    raizDaInstalacao: RAIZ_DA_INSTALACAO,
    organizarPorAnoEMes: true,
    registroDeEnvioSemFiltro: {
      canal: canal.porta,
      agoraEmMilissegundos: () => {
        const instante = proximoInstante;
        proximoInstante += 1_000;
        return instante;
      },
    },
  };

  return { contexto, insercoes, canal };
}

function enviar(cen: Cenario, nome = ARQUIVO_SEM_TIPO): ResultadoDoEnvio {
  return enviarArquivo(cen.contexto, {
    superficie: 'tela-de-midia',
    conteudoDeDestino: 0,
    arquivo: {
      nome,
      tipoInformado: TIPO_AFIRMADO_PELO_CLIENTE,
      caminhoTemporario: CAMINHO_TEMPORARIO,
      bytes: 2048,
      erro: 0,
      recebidoNaRequisicao: true,
    },
  });
}

function mensagemDaRecusa(resultado: ResultadoDoEnvio): string | null {
  return resultado.enviado === false ? resultado.mensagem : null;
}

/* ── OS CINCO CASOS ─────────────────────────────────────────────────────────── */

test('UT-064-1 nega a toda conta a capacidade de enviar sem filtro, inclusive a de maior poder', () => {
  // Entrada: instalacao de fabrica (nenhuma das quatro constantes definida), os
  // cinco papeis de fabrica e o super administrador de uma rede.
  const base = baseDe(CONSTANTES_DE_FABRICA);
  // A capacidade ESTA na matriz do administrador (`schema.php:894`), e so na
  // dele: a negacao nao vem da falta de concessao.
  assert.deepEqual(papeisQueConcedem(MATRIZ_DE_FABRICA, CAPACIDADE_SEM_FILTRO), [
    'administrator',
  ]);

  for (const papel of PAPEIS_DE_FABRICA) {
    // Acao: a pergunta de capacidade, e o envio do arquivo de tipo desconhecido.
    const pode = perguntarPermissao(
      comAtor(base, atorDeFabrica(papel)),
      CAPACIDADE_SEM_FILTRO,
    );
    const cen = cenario(atorDeFabrica(papel), base);
    const resultado = enviar(cen);

    // Resultado: negada a todos, e nada entra na biblioteca. Quem tem
    // `upload_files` cai no `if` de `file.php:971`; quem nao tem nem chega la.
    assert.equal(pode, false, `${papel} nao pode ter ${CAPACIDADE_SEM_FILTRO}`);
    assert.equal(resultado.enviado, false, `o envio de ${papel} passou`);
    assert.equal(
      mensagemDaRecusa(resultado),
      papeisQueConcedem(MATRIZ_DE_FABRICA, 'upload_files').includes(papel)
        ? MENSAGEM_DE_TIPO_NAO_PERMITIDO
        : MENSAGEM_DE_ENVIO_NAO_PERMITIDO,
      papel,
    );
    assert.deepEqual(cen.insercoes, [], papel);
  }

  // O de maior poder de todos: em rede o super administrador recebe tudo menos
  // a negacao explicita (ADR-0009), e `do_not_allow` e a negacao explicita
  // (`capabilities.php:591`).
  const baseDaRede = baseDe(CONSTANTES_DE_FABRICA, REDE_COM_SUPER_ADMIN);
  const superAdmin = atorDeFabrica('administrator', LOGIN_DO_SUPER_ADMIN);
  const naRede = cenario(superAdmin, baseDaRede);
  assert.equal(
    perguntarPermissao(comAtor(baseDaRede, superAdmin), CAPACIDADE_SEM_FILTRO),
    false,
  );
  assert.equal(mensagemDaRecusa(enviar(naRede)), MENSAGEM_DE_TIPO_NAO_PERMITIDO);
  assert.deepEqual(naRede.insercoes, []);
});

test('UT-064-2 faz a capacidade passar a existir quando a instalacao a declara', () => {
  // Entrada: o MESMO administrador de fabrica, e a unica diferenca e
  // `define( 'ALLOW_UNFILTERED_UPLOADS', true )`.
  const base = baseDe(INSTALACAO_QUE_DECLAROU);
  const administradora = atorDeFabrica('administrator');

  // Acao.
  const pode = perguntarPermissao(comAtor(base, administradora), CAPACIDADE_SEM_FILTRO);
  const cen = cenario(administradora, base);
  const resultado = enviar(cen);

  // Resultado: a capacidade existe, o envio passa e o anexo e criado com o tipo
  // que o cliente afirmou (`if ( ! $type ) { $type = $file['type']; }`,
  // `file.php:974`-`:976`).
  assert.equal(pode, true);
  assert.equal(resultado.enviado, true);
  assert.equal(cen.insercoes.length, 1);
  assert.equal(cen.insercoes[0]?.tipoMime, TIPO_AFIRMADO_PELO_CLIENTE);

  // O super administrador da rede tambem: com a constante, `is_super_admin()`
  // satisfaz o terceiro termo de `capabilities.php:588`.
  const baseDaRede = baseDe(INSTALACAO_QUE_DECLAROU, REDE_COM_SUPER_ADMIN);
  const superAdmin = atorDeFabrica('administrator', LOGIN_DO_SUPER_ADMIN);
  assert.equal(
    perguntarPermissao(comAtor(baseDaRede, superAdmin), CAPACIDADE_SEM_FILTRO),
    true,
  );
  assert.equal(enviar(cenario(superAdmin, baseDaRede)).enviado, true);

  // E a declaracao FALSA nao declara nada: `defined( X ) && X`.
  const baseFalsa = baseDe({ ALLOW_UNFILTERED_UPLOADS: false });
  assert.equal(
    perguntarPermissao(comAtor(baseFalsa, administradora), CAPACIDADE_SEM_FILTRO),
    false,
  );
});

test('UT-064-3 mantem a recusa a quem nao tem a capacidade declarada, mesmo com a permissao liberada', () => {
  // Entrada: a instalacao declarou, e os quatro papeis de fabrica que nao tem
  // `unfiltered_upload` gravado — inclusive o editor, que tem `upload_files` e
  // `unfiltered_html` e e o mais alto abaixo do administrador.
  const base = baseDe(INSTALACAO_QUE_DECLAROU);

  for (const papel of PAPEIS_DE_FABRICA.filter((p) => p !== 'administrator')) {
    // Acao.
    const pode = perguntarPermissao(
      comAtor(base, atorDeFabrica(papel)),
      CAPACIDADE_SEM_FILTRO,
    );
    const cen = cenario(atorDeFabrica(papel), base);
    const resultado = enviar(cen);

    // Resultado: a constante libera a capacidade, nao a concede. A traducao
    // devolve `unfiltered_upload` (`capabilities.php:589`), e quem nao a tem na
    // matriz continua sem ela.
    assert.equal(pode, false, `${papel} ganhou ${CAPACIDADE_SEM_FILTRO} da constante`);
    assert.equal(resultado.enviado, false, papel);
    assert.equal(
      mensagemDaRecusa(resultado),
      papeisQueConcedem(MATRIZ_DE_FABRICA, 'upload_files').includes(papel)
        ? MENSAGEM_DE_TIPO_NAO_PERMITIDO
        : MENSAGEM_DE_ENVIO_NAO_PERMITIDO,
      papel,
    );
    assert.deepEqual(cen.insercoes, [], papel);
    // Recusado, nao e envio feito por esse caminho: nao ha o que registrar.
    assert.deepEqual(cen.canal.eventos, [], papel);
  }
});

test('UT-064-4 registra cada envio feito por esse caminho com conta, arquivo e instante', () => {
  // Entrada: a instalacao declarou, e a administradora de fabrica envia dois
  // arquivos de tipo desconhecido, um depois do outro.
  const administradora = atorDeFabrica('administrator');
  const cen = cenario(administradora, baseDe(INSTALACAO_QUE_DECLAROU));

  // Acao.
  const primeiro = enviar(cen, 'primeiro.bin');
  const segundo = enviar(cen, 'segundo.bin');

  // Resultado: os dois entraram, e cada um deixou UM evento, na ordem, com a
  // conta que enviou, o arquivo e o instante do proprio envio.
  assert.equal(primeiro.enviado, true);
  assert.equal(segundo.enviado, true);
  assert.equal(cen.canal.eventos.length, 2);

  const [eventoDoPrimeiro, eventoDoSegundo] = cen.canal.eventos;
  assert.equal(eventoDoPrimeiro?.origem, ORIGEM_DO_ENVIO_SEM_FILTRO);
  assert.equal(eventoDoPrimeiro?.contexto['contaId'], administradora.contaId);
  assert.equal(eventoDoPrimeiro?.contexto['arquivo'], 'primeiro.bin');
  assert.equal(eventoDoPrimeiro?.instante, PRIMEIRO_INSTANTE);

  assert.equal(eventoDoSegundo?.origem, ORIGEM_DO_ENVIO_SEM_FILTRO);
  assert.equal(eventoDoSegundo?.contexto['contaId'], administradora.contaId);
  assert.equal(eventoDoSegundo?.contexto['arquivo'], 'segundo.bin');
  assert.equal(eventoDoSegundo?.instante, PRIMEIRO_INSTANTE + 1_000);

  // E so os envios por esse caminho: um tipo reconhecido, na mesma instalacao e
  // pela mesma conta, nao acrescenta evento.
  assert.equal(enviar(cen, 'foto.jpg').enviado, true);
  assert.equal(cen.canal.eventos.length, 2);
});

test('UT-064-5 inverte o padrao das demais capacidades: sem declaracao da instalacao, nega sempre', () => {
  // Entrada: a instalacao de fabrica, os cinco papeis de fabrica e todas as
  // capacidades que as quatro constantes alcancam (BR-MIGRAR-094).
  const base = baseDe(CONSTANTES_DE_FABRICA);
  // ⚠️ So as concedidas por papel. `upload_plugins` e `upload_themes` tambem
  // sao alcancadas, mas o legado as TRADUZ para `install_plugins` e
  // `install_themes` (`capabilities.php:636`-`:639`): quem decide nelas nao e a
  // linha delas na matriz, que nao existe, e sim a da capacidade de instalar. A
  // plataforma nao tem essa traducao hoje (`revogacao-por-constante.ts` so as
  // lista), e afirma-las aqui pela matriz afirmaria a lacuna, nao o legado.
  const demais = capacidadesAlcancadasPorConstante().filter(
    (capacidade) =>
      capacidade !== CAPACIDADE_SEM_FILTRO &&
      papeisQueConcedem(MATRIZ_DE_FABRICA, capacidade).length > 0,
  );
  // As demais existem, e alguma delas esta em papel de fabrica: sem isso o
  // contraste abaixo seria vazio.
  assert.ok(demais.includes('unfiltered_html'));
  assert.ok(demais.includes('edit_themes'));

  for (const papel of PAPEIS_DE_FABRICA) {
    const contexto = comAtor(base, atorDeFabrica(papel));

    // Acao e resultado, o padrao das demais: sem constante definida, quem decide
    // e a matriz — a constante delas, ausente, nao retira nada.
    for (const capacidade of demais) {
      assert.equal(
        perguntarPermissao(contexto, capacidade),
        papeisQueConcedem(MATRIZ_DE_FABRICA, capacidade).includes(papel),
        `${papel} / ${capacidade}`,
      );
    }

    // A inversa: sem constante definida, a matriz NAO decide. Negada sempre,
    // inclusive ao papel que a tem gravada.
    assert.equal(perguntarPermissao(contexto, CAPACIDADE_SEM_FILTRO), false, papel);
  }

  // E o sentido da declaracao tambem e o inverso: definir as outras tres retira
  // do administrador o que ele tinha; definir esta e o que lhe da o que nao
  // tinha. O mesmo ator, as quatro constantes ligadas de uma vez.
  const administradora = atorDeFabrica('administrator');
  const todasDeclaradas = comAtor(
    baseDe({
      DISALLOW_UNFILTERED_HTML: true,
      DISALLOW_FILE_EDIT: true,
      DISALLOW_FILE_MODS: true,
      ALLOW_UNFILTERED_UPLOADS: true,
    }),
    administradora,
  );
  for (const capacidade of demais) {
    assert.equal(perguntarPermissao(todasDeclaradas, capacidade), false, capacidade);
  }
  assert.equal(perguntarPermissao(todasDeclaradas, CAPACIDADE_SEM_FILTRO), true);
});
