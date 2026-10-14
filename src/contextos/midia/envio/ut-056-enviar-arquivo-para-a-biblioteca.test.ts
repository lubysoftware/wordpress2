/**
 * A entrega de **T004** da feature `006-biblioteca-de-midia`: *"6 testes
 * automatizados, um por caso registrado em `../../../backlog/tests.md`
 * (UT-056-1, UT-056-2, UT-056-3, UT-056-4, UT-056-5, UT-056-6), com o mesmo
 * dado de entrada, acao e resultado esperado."*
 *
 * ---
 *
 * # Os seis casos foram COPIADOS do catalogo, nao reconstruidos
 *
 * O card REQ-056 e a secao que comeca em `backlog/tests.md:851`, e os seis casos
 * sao as linhas `:856` a `:861`, com **ID, nome, tipo e prova**. Esta suite copia
 * os quatro campos de cada um, na ordem do catalogo, e cada `test()` leva o ID e
 * o nome do caso no titulo, com a entrada, a acao e o resultado marcados no
 * corpo.
 *
 * | caso | nome, como o catalogo o escreve | tipo | o que a prova e |
 * |---|---|---|---|
 * | `UT-056-1` | recusa o envio de quem nao pode enviar ou nao pode editar o conteudo de destino | `erro` | CA-1.1 |
 * | `UT-056-2` | decide o tipo pelo conteudo do arquivo, ignorando a extensao informada | `erro` | CA-1.2 |
 * | `UT-056-3` | recusa o tipo fora da lista informando o motivo ao ator | `erro` | CA-1.3 |
 * | `UT-056-4` | renomeia o arquivo na colisao de nome em lugar de sobrescrever | `borda` | CA-1.4 |
 * | `UT-056-5` | devolve o erro do sistema de arquivos sem criar registro quando o destino nao e gravavel | `erro` | CA-1.5 |
 * | `UT-056-6` | aplica as mesmas duas verificacoes de capacidade na tela e no envio assincrono | `feliz` | CA-1.6 |
 *
 * **Nao ha caso de regra de negocio neste card**, e isso nao e omissao: as
 * quatro regras de midia de `target_business_rules.md` (`M1` a `M4`,
 * BR-MIGRAR-057 a 060) e a `P2` (BR-MIGRAR-002) pertencem a US-2, US-3, US-4,
 * US-5 e US-6 — a `spec.md` desta feature nao lista *"Regras de negocio que
 * valem aqui"* em US-1, e por isso a entrega de T004 pede seis testes e nao
 * seis mais N, ao contrario de T006 em diante.
 *
 * ---
 *
 * # Nao e a suite de criterio de T003, e a diferenca esta em QUATRO fixtures
 *
 * T003 entrega *"os criterios CA-1.1 a CA-1.6 passam"* e tem a suite dela em
 * `./us-1-enviar-arquivo.test.ts`, com uma matriz de quatro capacidades escolhida
 * a mao, um mapa de capacidade do tipo escrito slot por slot, uma deteccao de
 * tipo **programada** (a resposta chega pronta no duplo) e uma porta de sistema
 * de arquivos que **registra operacao e nao guarda nada**. E o certo para
 * afirmar criterio: uma matriz de fabrica faria alguns ramos passarem por
 * acidente, e um disco que guarda estado esconderia a operacao que o legado
 * **nao** executa.
 *
 * Esta suite troca quatro fixtures, e e so com elas que os casos do catalogo
 * podem ser afirmados pelo **estado resultante**, que e o que o catalogo
 * descreve (*"em lugar de sobrescrever"*, *"sem criar registro"*):
 *
 * 1. **a matriz de papeis e a de fabrica**, transcrita de
 *    `wp-admin/includes/schema.php:791`-`:829` e `:872`-`:882` com a linha de
 *    cada concessao em comentario. E ela que da sentido literal a UT-056-1: o
 *    *"quem nao pode enviar"* do catalogo e o **colaborador de fabrica**, que e
 *    o que UC-12 registra na autorizacao (*"`upload_files`, que o colaborador
 *    nao tem"*), e nao um ator montado para falhar. E e ela que permite a
 *    segunda metade do caso: o **editor de fabrica** tem `edit_others_posts` e
 *    envia para o mesmo destino alheio que o autor nao alcanca, o que mostra que
 *    a recusa e da capacidade e nao do destino;
 * 2. **o mapa de capacidade do tipo e derivado de `capability_type`**, pelas
 *    mesmas linhas do legado ({@link capacidadesDerivadas},
 *    `wp-includes/post.php:2042`-`:2072`), e nao escrito slot por slot;
 * 3. **a porta de sistema de arquivos e um disco em memoria**: ela guarda os
 *    bytes de cada caminho, `mover` move mesmo e `listar` deriva da pasta. E com
 *    isso que UT-056-4 afirma *"em lugar de sobrescrever"* como **estado** — o
 *    arquivo que ja estava na pasta continua com os bytes dele depois do envio —
 *    e nao apenas como um `mover` que nao saiu. E e o que o cenario
 *    `@concorrencia` de `PT-014` cobra: *"dois arquivos distintos existem em
 *    disco"*, *"cada anexo aponta para o seu proprio arquivo"*. O disco continua
 *    **registrando toda operacao**, e cada caso afirma tambem a lista, porque e
 *    a sequencia que o cenario `@composicao` compara com o oraculo;
 * 4. **a deteccao de tipo real le os BYTES do arquivo**, por uma tabela de
 *    assinaturas ({@link ASSINATURAS}), em vez de receber a resposta pronta. E o
 *    que UT-056-2 diz: *"decide o tipo pelo conteudo do arquivo, ignorando a
 *    extensao informada"*. Com a resposta programada, o teste afirma o ramo da
 *    implementacao; com os bytes, afirma o caso do catalogo — o mesmo arquivo
 *    muda de desfecho quando so o **nome** muda, e nada mais.
 *
 * ⚠️ **A tabela de assinaturas nao e do legado, e nao finge ser.** No legado quem
 * le os bytes e `exif_imagetype()`/`getimagesize()` para imagem
 * (`wp_get_image_mime()`, `wp-includes/functions.php:3368`) e `finfo_file()`
 * para o resto (`:3207`), as duas extensoes do PHP; qual delas respondeu nao
 * atravessa a borda {@link DeteccaoDeTipoReal}, por decisao de T003. O que esta
 * aqui e o **duplo** dessas duas extensoes, com os numeros magicos dos formatos,
 * e o que se afirma e o comportamento do legado **sobre** o que elas devolvem.
 *
 * ⚠️ **E as duas deteccoes leem o disco por fora da porta**, de proposito: no
 * legado elas nao passam pelo sistema de arquivos do nucleo, sao chamadas de
 * extensao sobre um caminho. Se o duplo lesse pela porta, a sequencia de
 * operacoes registrada ganharia um `ler` que o oraculo nao tem, e o cenario
 * `@composicao` de `PT-014` (*"nenhuma operacao a mais e executada"*) passaria a
 * comparar coisas diferentes.
 *
 * ---
 *
 * # O que esta suite NAO decide
 *
 * 🔴 **A consequencia da segunda verificacao de capacidade e diferente em cada
 * superficie, e T003 registrou o conflito sem resolve-lo.** Na tela
 * (`wp-admin/media-new.php:24`-`:25`) e no envio assincrono
 * (`wp-admin/async-upload.php:108`-`:109`) o legado faz `$post_id = 0` e **o
 * envio segue sem o vinculo**; no envio assincrono do editor
 * (`wp-admin/includes/ajax-actions.php:2635`-`:2646`) ele recusa com texto
 * proprio. CA-1.1 lido como *"toda superficie recusa"* divergiria do legado em
 * duas das tres, e P1 exige decisao humana registrada para divergir — nao existe
 * nenhuma. A analise esta em `permissao-de-envio.ts`. **Esta suite reproduz as
 * duas consequencias e nao escolhe lado**, igual a T003: o caso do catalogo
 * (UT-056-6) fala das *"mesmas duas verificacoes"*, e e a **verificacao** que e
 * afirmada igual nas tres, nao o desfecho.
 *
 * ---
 *
 * # Como se confere
 *
 * Cada afirmacao cita arquivo e linha do sistema analisado, e **todas as ancoras
 * citadas aqui foram abertas nesta tarefa** na arvore 7.1.2 legivel em disco
 * (`db_version` 61833, a versao do pacote):
 * `media-new.php:15`, `:21`, `:24`-`:25` e `:33`; `async-upload.php:34`, `:103`,
 * `:105`, `:108`-`:109` e `:113`; `ajax-actions.php:2618` e `:2635`;
 * `file.php:959`-`:976`, `:984`-`:986`, `:991`, `:1021` e `:1040`;
 * `functions.php:2440`-`:2448`, `:3124`, `:3312`-`:3317`, `:3322`-`:3329`,
 * `:3693`, `:3696` e `:3703`; `schema.php:791`-`:829` e `:872`-`:882`;
 * `post.php:2042`-`:2072`.
 *
 * A spec de paridade que cobre este card e
 * `.specify/migration/parity_tests/14-ingestao-e-derivadas-de-midia.feature`
 * (`PT-014`), e os tres cenarios desta suite sao *"O nome de arquivo em conflito
 * recebe o mesmo sufixo nas duas metades"*, *"Dois envios simultaneos do mesmo
 * nome nao se sobrescrevem"* e *"A ingestao e equivalente com a porta de sistema
 * de arquivos substituida por duplo"*. A conferencia caso a caso contra o
 * oraculo executavel (resposta 16, `scripts/oraculo/`) continua sendo o passo de
 * paridade: aqui o que se afirma e o sistema novo.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  casoDeConteudo,
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type EstadoDeConteudoNaAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type MatrizDePapeis,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarArmazenamentoDeMidia,
  criarPortaDeDadosFalsa,
  SEM_CONTEUDO_DE_DESTINO,
  type PedidoDeAnexo,
  type PortaDeDadosFalsa,
} from '../armazenamento/index.js';
import type {
  LeituraDeArquivo,
  OperacaoDeArquivo,
  PortaDeSistemaDeArquivos,
} from '../portas/index.js';
import {
  CODIGO_DE_ERRO_DE_ENVIO,
  enviarArquivo,
  MENSAGEM_DE_ANEXO_NAO_PERMITIDO_NO_CONTEUDO,
  MENSAGEM_DE_ARQUIVO_NAO_MOVIDO,
  MENSAGEM_DE_ENVIO_NAO_PERMITIDO,
  MENSAGEM_DE_PASTA_NAO_CRIADA,
  MENSAGEM_DE_TIPO_NAO_PERMITIDO,
  tiposPermitidos,
  TIPOS_DE_ARQUIVO_DE_FABRICA,
  type ContextoDeEnvio,
  type DeteccaoDeTipoReal,
  type ResultadoDoEnvio,
  type SuperficieDeEnvio,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const RAIZ_DA_INSTALACAO = '/var/www/';
const RAIZ_DE_ENVIOS = '/var/www/wp-content/uploads';
const ENDERECO_BASE = 'https://exemplo.test/wp-content/uploads';

/** `current_time( 'mysql' )` congelado: a pasta do envio sem destino e `/2026/10`. */
const AGORA = '2026-10-11 14:30:00';
const PASTA_DO_MES = `${RAIZ_DE_ENVIOS}/2026/10`;

/**
 * A pasta do envio **com** destino.
 *
 * `media_handle_upload()` retrodata a area de envios para a data do conteudo de
 * destino quando ele e `post` (`wp-admin/includes/media.php:300`-`:303`), e a
 * data do destino deste cenario e de marco. Nao e detalhe de fixture: o endereco
 * publico do arquivo sai desta pasta.
 */
const PASTA_DO_DESTINO = `${RAIZ_DE_ENVIOS}/2026/03`;

/** `$_FILES[...]['tmp_name']` — o arquivo recebido nesta requisicao. */
const CAMINHO_TEMPORARIO = '/tmp/phpA1b2c3';

const CONTA_DO_AUTOR = 7;
const CONTA_DO_EDITOR = 3;
const CONTA_ALHEIA = 9;
const ID_DO_DESTINO = 42;
const ID_DO_ANEXO = 101;

/** A mensagem que o sistema de arquivos daria, e que o legado **nao** mostra. */
const MENSAGEM_DO_SISTEMA_DE_ARQUIVOS = 'mkdir(): Permission denied';

/** As tres superficies do legado, na ordem em que `permissao-de-envio.ts` as declara. */
const SUPERFICIES: readonly SuperficieDeEnvio[] = [
  'tela-de-midia',
  'envio-assincrono',
  'envio-assincrono-do-editor',
];

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
 * A matriz como as rotinas de povoamento a deixam numa instalacao nova.
 *
 * Transcrita, **nao** importada: a regra de dependencia 3 de
 * `target_architecture.md` proibe `contextos/<a>/` importar `contextos/<b>/`
 * *"sempre, sem excecao"*, e a copia executavel vive em
 * `contextos/identidade-e-acesso/armazenamento/matriz-de-fabrica.ts`. A copia de
 * referencia e `schema.php`, e e dela que estas listas saem, linha por linha; a
 * conferencia da matriz transcrita contra a matriz gravada e `ut-013`/`ut-014`
 * da feature 001.
 *
 * ⚠️ As capacidades `level_*` entram porque elas **estao** na matriz de fabrica,
 * e uma matriz sem elas nao e a de fabrica. Nenhuma decisao desta feature as le.
 */
const MATRIZ_DE_FABRICA: MatrizDePapeis = [
  // `populate_roles_160()`, "Add caps for Editor role" (`schema.php:791`-`:811`),
  // mais "Add caps for Editor role" de `populate_roles_210()` (`:851`-`:865`).
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
    'edit_others_pages', // :851
    'edit_published_pages', // :852
    'publish_pages', // :853
    'delete_pages', // :854
    'delete_others_pages', // :855
    'delete_published_pages', // :856
    'delete_posts', // :857
    'delete_others_posts', // :858
    'delete_published_posts', // :859
    'delete_private_posts', // :860
    'edit_private_posts', // :861
    'read_private_posts', // :862
    'delete_private_pages', // :863
    'edit_private_pages', // :864
    'read_private_pages', // :865
  ]),
  // "Add caps for Author role" (`schema.php:813`-`:822` e `:872`-`:875`).
  papelDeFabrica('author', [
    'upload_files', // :815
    'edit_posts', // :816
    'edit_published_posts', // :817
    'publish_posts', // :818
    'read', // :819
    'level_2', // :820
    'level_1', // :821
    'level_0', // :822
    'delete_posts', // :874
    'delete_published_posts', // :875
  ]),
  /*
    "Add caps for Contributor role" (`schema.php:824`-`:829` e `:879`-`:882`).

    ⚠️ **Sem `upload_files`**, e e esta ausencia que UC-12 registra na
    autorizacao: *"`upload_files`, que o colaborador nao tem"*. O colaborador tem
    `edit_posts`, logo ele passaria na SEGUNDA verificacao do envio — a recusa de
    UT-056-1 e da primeira, e isso e observavel pelo que nao acontece.
  */
  papelDeFabrica('contributor', [
    'edit_posts', // :826
    'read', // :827
    'level_1', // :828
    'level_0', // :829
    'delete_posts', // :881
  ]),
];

/** O ator: a conta com o papel gravado, e nada por cima dele. */
function atorDeFabrica(papel: string, contaId: number): AtorDeAutorizacao {
  return {
    contaId,
    login: `conta-${contaId}`,
    existe: true,
    // `{site}capabilities` de uma conta de papel unico: a chave e o papel.
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

/**
 * Os 15 slots que `get_post_type_capabilities()` deriva de `capability_type`
 * (`wp-includes/post.php:2042`-`:2072`).
 *
 * Derivado e nao escrito slot por slot porque e assim que o legado o monta: o
 * singular e a base das meta capacidades, o plural a das primitivas (`:2040`), e
 * `create_posts` cai em `edit_posts` quando nao foi declarado (`:2071`). E por
 * isso que nao existe um `if` sobre o nome `page` em decisao nenhuma.
 */
function capacidadesDerivadas(
  singular: string,
  plural: string,
): Readonly<Record<string, string>> {
  return {
    // Meta capabilities (`:2044`-`:2046`).
    edit_post: `edit_${singular}`,
    read_post: `read_${singular}`,
    delete_post: `delete_${singular}`,
    // Primitive capabilities used outside of map_meta_cap() (`:2048`-`:2052`).
    edit_posts: `edit_${plural}`,
    edit_others_posts: `edit_others_${plural}`,
    delete_posts: `delete_${plural}`,
    publish_posts: `publish_${plural}`,
    read_private_posts: `read_private_${plural}`,
    // Primitive capabilities used within map_meta_cap() (`:2058`-`:2063`).
    read: 'read',
    delete_private_posts: `delete_private_${plural}`,
    delete_published_posts: `delete_published_${plural}`,
    delete_others_posts: `delete_others_${plural}`,
    edit_private_posts: `edit_private_${plural}`,
    edit_published_posts: `edit_published_${plural}`,
    // `create_posts` simply maps to `edit_posts` by default (`:2071`).
    create_posts: `edit_${plural}`,
  };
}

/** Os dois tipos de fabrica que o cenario registra, com `map_meta_cap` ligado. */
const TIPOS_REGISTRADOS: readonly TipoDeConteudoNaAutorizacao[] = [
  {
    nome: 'post',
    traduzMetaCapacidade: true,
    capacidades: capacidadesDerivadas('post', 'posts'),
  },
  {
    nome: 'page',
    traduzMetaCapacidade: true,
    capacidades: capacidadesDerivadas('page', 'pages'),
  },
];

/**
 * O registro de estado, no recorte que `map_meta_cap()` le
 * (`get_post_status_object()`).
 *
 * Declarado aqui e nao importado de BC-01, pela regra de dependencia 3.
 */
const ESTADOS: Record<string, EstadoDeConteudoNaAutorizacao> = {
  draft: { nome: 'draft', publico: false, privado: false },
  publish: { nome: 'publish', publico: true, privado: false },
};

interface DestinoDeTeste {
  readonly autorId: number;
  readonly tipo: string;
  readonly estado: string;
  readonly data: string;
}

/** O rascunho do proprio autor. */
const DESTINO_PROPRIO: DestinoDeTeste = {
  autorId: CONTA_DO_AUTOR,
  tipo: 'post',
  estado: 'draft',
  data: '2026-03-04 08:00:00',
};

/** O mesmo rascunho, de outra conta. */
const DESTINO_ALHEIO: DestinoDeTeste = {
  ...DESTINO_PROPRIO,
  autorId: CONTA_ALHEIA,
};

interface FonteRegistrada {
  readonly fonte: FonteDeConteudoNaAutorizacao;
  /** Toda referencia que a traducao de `edit_post` pediu a `get_post()`. */
  readonly perguntas: unknown[];
}

function fonteDeConteudo(destino: DestinoDeTeste): FonteRegistrada {
  const perguntas: unknown[] = [];

  return {
    perguntas,
    fonte: {
      conteudo(referencia) {
        perguntas.push(referencia);
        if (referencia !== ID_DO_DESTINO) {
          return null;
        }
        return {
          id: ID_DO_DESTINO,
          tipo: destino.tipo,
          estado: destino.estado,
          estadoParaLeitura: destino.estado,
          autorId: destino.autorId,
          paiId: 0,
        };
      },
      tipoDeConteudo: (nome) =>
        TIPOS_REGISTRADOS.find((tipo) => tipo.nome === nome) ?? null,
      estadoDeConteudo: (nome) => ESTADOS[nome] ?? null,
      estadoAnteriorNaLixeira: () => '',
      paginaInicial: () => 0,
      paginaDeConteudos: () => 0,
      paginaDePoliticaDePrivacidade: () => 0,
    },
  };
}

/* ── O DISCO EM MEMORIA ─────────────────────────────────────────────────────── */

/** A pasta de um caminho — `dirname()`. */
function pastaDe(caminho: string): string {
  return caminho.slice(0, caminho.lastIndexOf('/'));
}

/** O ultimo segmento de um caminho — `basename()`. */
function nomeBaseDe(caminho: string): string {
  return caminho.slice(caminho.lastIndexOf('/') + 1);
}

interface OpcoesDoDisco {
  /** O que ja esta em disco, caminho por caminho, com os bytes de cada um. */
  readonly arquivos?: readonly (readonly [string, Uint8Array])[];
  /** As pastas que ja existem. A pasta de cada arquivo entra sozinha. */
  readonly pastas?: readonly string[];
  /** As pastas que nao podem ser criadas. */
  readonly naoCriaveis?: readonly string[];
  /** O arquivo nao pode ser movido para a pasta de destino. */
  readonly falhaAoMover?: boolean;
}

interface DiscoEmMemoria {
  readonly porta: PortaDeSistemaDeArquivos;
  /** Cada operacao pedida, na ordem — o que `@composicao` de `PT-014` compara. */
  readonly operacoes: string[];
  /** Os bytes de um caminho, ou `undefined` quando ele nao existe. */
  conteudoDe(caminho: string): Uint8Array | undefined;
  /** Os caminhos de uma pasta, em ordem, para afirmar o conjunto em disco. */
  caminhosEm(pasta: string): readonly string[];
  /** Poe um arquivo em disco — o `$_FILES` de uma requisicao nova. */
  por(caminho: string, bytes: Uint8Array): void;
}

/**
 * A porta de sistema de arquivos como um disco que **guarda os bytes**.
 *
 * E a fixture 3 do cabecalho. `mover` move mesmo, `listar` deriva da pasta e
 * `criarPasta` devolve verdadeiro para pasta que ja existe, que e o que
 * `wp_mkdir_p()` faz e o caminho normal a partir do segundo envio do mes.
 */
function discoEmMemoria(opcoes: OpcoesDoDisco = {}): DiscoEmMemoria {
  const operacoes: string[] = [];
  const arquivos = new Map<string, Uint8Array>(opcoes.arquivos ?? []);
  const pastas = new Set<string>(opcoes.pastas ?? []);
  const naoCriaveis = new Set<string>(opcoes.naoCriaveis ?? []);

  for (const caminho of arquivos.keys()) {
    pastas.add(pastaDe(caminho));
  }

  const falha = (): OperacaoDeArquivo => ({
    concluido: false,
    mensagem: MENSAGEM_DO_SISTEMA_DE_ARQUIVOS,
  });

  const caminhosEm = (pasta: string): readonly string[] =>
    [...arquivos.keys()].filter((caminho) => pastaDe(caminho) === pasta).sort();

  const porta: PortaDeSistemaDeArquivos = {
    raizDeEnvios: RAIZ_DE_ENVIOS,
    existe(caminho) {
      operacoes.push(`existe ${caminho}`);
      return arquivos.has(caminho) || pastas.has(caminho);
    },
    ehPasta(caminho) {
      operacoes.push(`ehPasta ${caminho}`);
      return pastas.has(caminho);
    },
    gravavel(caminho) {
      operacoes.push(`gravavel ${caminho}`);
      return pastas.has(caminho) && !naoCriaveis.has(caminho);
    },
    criarPasta(caminho) {
      operacoes.push(`criarPasta ${caminho}`);
      if (pastas.has(caminho)) {
        return { concluido: true };
      }
      if (naoCriaveis.has(caminho)) {
        return falha();
      }
      pastas.add(caminho);
      return { concluido: true };
    },
    escrever(caminho, conteudo) {
      operacoes.push(`escrever ${caminho}`);
      if (!pastas.has(pastaDe(caminho))) {
        return falha();
      }
      arquivos.set(caminho, conteudo);
      return { concluido: true };
    },
    ler(caminho): LeituraDeArquivo<Uint8Array> {
      operacoes.push(`ler ${caminho}`);
      const bytes = arquivos.get(caminho);
      return bytes === undefined
        ? { concluido: false, mensagem: MENSAGEM_DO_SISTEMA_DE_ARQUIVOS }
        : { concluido: true, valor: bytes };
    },
    mover(origem, destino) {
      operacoes.push(`mover ${origem} ${destino}`);
      const bytes = arquivos.get(origem);
      if (
        opcoes.falhaAoMover === true ||
        bytes === undefined ||
        !pastas.has(pastaDe(destino))
      ) {
        return falha();
      }
      arquivos.set(destino, bytes);
      arquivos.delete(origem);
      return { concluido: true };
    },
    copiar(origem, destino) {
      operacoes.push(`copiar ${origem} ${destino}`);
      const bytes = arquivos.get(origem);
      if (bytes === undefined || !pastas.has(pastaDe(destino))) {
        return falha();
      }
      arquivos.set(destino, bytes);
      return { concluido: true };
    },
    apagar(caminho) {
      operacoes.push(`apagar ${caminho}`);
      return arquivos.delete(caminho) ? { concluido: true } : falha();
    },
    listar(pasta): LeituraDeArquivo<readonly string[]> {
      operacoes.push(`listar ${pasta}`);
      if (!pastas.has(pasta)) {
        return { concluido: false, mensagem: MENSAGEM_DO_SISTEMA_DE_ARQUIVOS };
      }
      return { concluido: true, valor: caminhosEm(pasta).map(nomeBaseDe) };
    },
  };

  return {
    porta,
    operacoes,
    conteudoDe: (caminho) => arquivos.get(caminho),
    caminhosEm,
    por(caminho, bytes) {
      arquivos.set(caminho, bytes);
      pastas.add(pastaDe(caminho));
    },
  };
}

/* ── OS BYTES, E A DETECCAO QUE OS LE ──────────────────────────────────────── */

/** Um arquivo: a assinatura do formato, e um recheio que o torna distinguivel. */
function arquivoCom(
  assinatura: readonly number[],
  recheio: string,
): Uint8Array {
  return new Uint8Array([...assinatura, ...new TextEncoder().encode(recheio)]);
}

const ASSINATURA_JPEG = [0xff, 0xd8, 0xff];
const ASSINATURA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const ASSINATURA_EXECUTAVEL = [0x4d, 0x5a];
const ASSINATURA_HTML = [...new TextEncoder().encode('<!DOCTYPE html>')];

/**
 * A tabela do **duplo** das duas extensoes do PHP que leem bytes — ver a
 * ressalva do cabecalho. `imagem` diz se `wp_get_image_mime()` responderia por
 * aquele conteudo; `finfo_file()` responde por todos.
 */
const ASSINATURAS: readonly {
  readonly bytes: readonly number[];
  readonly tipo: string;
  readonly imagem: boolean;
}[] = [
  { bytes: ASSINATURA_JPEG, tipo: 'image/jpeg', imagem: true },
  { bytes: ASSINATURA_PNG, tipo: 'image/png', imagem: true },
  { bytes: ASSINATURA_EXECUTAVEL, tipo: 'application/x-msdownload', imagem: false },
  { bytes: ASSINATURA_HTML, tipo: 'text/html', imagem: false },
];

const FOTO_ANTIGA = arquivoCom(ASSINATURA_JPEG, 'a foto que ja estava na pasta');
const FOTO_NOVA = arquivoCom(ASSINATURA_JPEG, 'a foto deste envio');
const CONTEUDO_PNG = arquivoCom(ASSINATURA_PNG, 'um desenho');
const CONTEUDO_EXECUTAVEL = arquivoCom(ASSINATURA_EXECUTAVEL, 'um programa');
const CONTEUDO_HTML = arquivoCom(ASSINATURA_HTML, '<p>uma pagina</p>');

function assinaturaDe(
  disco: DiscoEmMemoria,
  caminho: string,
): (typeof ASSINATURAS)[number] | undefined {
  // Le o disco por fora da porta, pela razao do cabecalho.
  const bytes = disco.conteudoDe(caminho);
  if (bytes === undefined) {
    return undefined;
  }
  return ASSINATURAS.find((assinatura) =>
    assinatura.bytes.every((byte, posicao) => bytes[posicao] === byte),
  );
}

/** A deteccao de tipo real que **le o conteudo** — a fixture 4 do cabecalho. */
function deteccaoPorConteudo(disco: DiscoEmMemoria): DeteccaoDeTipoReal {
  return {
    tipoDeImagem(caminho) {
      const assinatura = assinaturaDe(disco, caminho);
      return assinatura !== undefined && assinatura.imagem
        ? assinatura.tipo
        : null;
    },
    fileinfoDisponivel: () => true,
    tipoPorConteudo(caminho) {
      return assinaturaDe(disco, caminho)?.tipo ?? null;
    },
  };
}

/* ── O CONTEXTO DA OPERACAO ────────────────────────────────────────────────── */

interface Cenario {
  readonly contexto: ContextoDeEnvio;
  readonly disco: DiscoEmMemoria;
  readonly dados: PortaDeDadosFalsa;
  /** Todo `wp_insert_attachment()` pedido, na ordem. Lista vazia e afirmacao. */
  readonly insercoes: PedidoDeAnexo[];
  /** Todo `get_post()` que o fluxo (nao a autorizacao) fez. */
  readonly leiturasDeDestino: number[];
  /** Toda leitura que a traducao de `edit_post` fez. */
  readonly perguntas: unknown[];
}

interface OpcoesDoCenario {
  readonly papel?: string;
  readonly destino?: DestinoDeTeste;
  /** Os bytes do arquivo recebido. */
  readonly bytes?: Uint8Array;
  /** Um disco ja montado, para os casos que precisam de varios envios nele. */
  readonly disco?: DiscoEmMemoria;
  readonly pastaNaoCriavel?: boolean;
  readonly falhaAoMover?: boolean;
}

const CONTA_DO_PAPEL: Record<string, number> = {
  author: CONTA_DO_AUTOR,
  editor: CONTA_DO_EDITOR,
  contributor: CONTA_DO_AUTOR,
};

function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const papel = opcoes.papel ?? 'author';
  const destino = opcoes.destino ?? DESTINO_PROPRIO;
  const autorizacao = fonteDeConteudo(destino);
  const dados = criarPortaDeDadosFalsa();

  const disco =
    opcoes.disco ??
    discoEmMemoria({
      arquivos: [[CAMINHO_TEMPORARIO, opcoes.bytes ?? FOTO_NOVA]],
      pastas: [RAIZ_DE_ENVIOS],
      ...(opcoes.pastaNaoCriavel === true
        ? { naoCriaveis: [PASTA_DO_MES, PASTA_DO_DESTINO] }
        : {}),
      ...(opcoes.falhaAoMover === true ? { falhaAoMover: true } : {}),
    });

  const insercoes: PedidoDeAnexo[] = [];
  const leiturasDeDestino: number[] = [];

  const base: BaseDeAutorizacao = {
    matriz: MATRIZ_DE_FABRICA,
    rede: REDE_INATIVA_NA_AUTORIZACAO,
    casosDeTraducao: [casoDeConteudo(autorizacao.fonte)],
  };

  const contexto: ContextoDeEnvio = {
    base,
    ator: atorDeFabrica(papel, CONTA_DO_PAPEL[papel] ?? CONTA_DO_AUTOR),
    sistemaDeArquivos: disco.porta,
    armazenamento: criarArmazenamentoDeMidia(dados.porta),
    conteudo: {
      obterDestino(conteudoId) {
        leiturasDeDestino.push(conteudoId);
        if (conteudoId !== ID_DO_DESTINO) {
          return null;
        }
        return { tipo: destino.tipo, data: destino.data };
      },
      inserirAnexo(pedido) {
        insercoes.push(pedido);
        return { inserido: true, anexoId: ID_DO_ANEXO };
      },
    },
    relogio: { agoraNoFormatoDoBanco: () => AGORA },
    texto: {
      // Identidade: o dado deste cenario e ASCII, e o que `remove_accents()` faz
      // fora do ASCII e da plataforma (feature 015), nao desta tarefa.
      removerAcentos: (valor) => valor,
      ehUtf8Valido: () => true,
      sanitizarTituloComTracos: (valor) =>
        valor.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sanitizarCampoDeTexto: (valor) => valor.trim(),
    },
    escaparHtml: (valor) =>
      valor
        .split('&')
        .join('&amp;')
        .split('<')
        .join('&lt;')
        .split('>')
        .join('&gt;'),
    deteccao: deteccaoPorConteudo(disco),
    /*
      Sem `metadadoDoArquivo`: um arquivo sem EXIF/IPTC e um estado normal do
      legado (`wp_read_image_metadata()` devolve `false` e o titulo sai do nome
      do arquivo), e nenhum caso deste card fala de metadado embutido.
    */
    enderecoBaseDeEnvios: ENDERECO_BASE,
    raizDaInstalacao: RAIZ_DA_INSTALACAO,
    organizarPorAnoEMes: true,
  };

  return {
    contexto,
    disco,
    dados,
    insercoes,
    leiturasDeDestino,
    perguntas: autorizacao.perguntas,
  };
}

interface PedidoDeTeste {
  readonly nome: string;
  readonly superficie?: SuperficieDeEnvio;
  readonly destino?: number;
  readonly tipoInformado?: string;
  readonly caminhoTemporario?: string;
}

function enviar(cen: Cenario, pedido: PedidoDeTeste): ResultadoDoEnvio {
  return enviarArquivo(cen.contexto, {
    superficie: pedido.superficie ?? 'tela-de-midia',
    conteudoDeDestino: pedido.destino ?? ID_DO_DESTINO,
    arquivo: {
      nome: pedido.nome,
      tipoInformado: pedido.tipoInformado ?? 'image/jpeg',
      caminhoTemporario: pedido.caminhoTemporario ?? CAMINHO_TEMPORARIO,
      bytes: 2048,
      erro: 0,
      recebidoNaRequisicao: true,
    },
  });
}

/* ── O RESULTADO, SEM O RUIDO DA UNIAO ─────────────────────────────────────── */

function mensagem(resultado: ResultadoDoEnvio): string {
  return resultado.enviado ? '(enviou)' : resultado.mensagem;
}

function motivo(resultado: ResultadoDoEnvio): string {
  return resultado.enviado ? '(enviou)' : resultado.motivo;
}

function codigo(resultado: ResultadoDoEnvio): string {
  if (resultado.enviado || resultado.motivo === 'sem-permissao') {
    return '';
  }
  return resultado.codigo;
}

function nomeFinal(resultado: ResultadoDoEnvio): string {
  return resultado.enviado ? resultado.nomeDeArquivo : '(recusou)';
}

function tipoGravado(resultado: ResultadoDoEnvio): string {
  return resultado.enviado ? resultado.tipoMime : '(recusou)';
}

function destinoDescartado(resultado: ResultadoDoEnvio): boolean | string {
  return resultado.enviado ? resultado.destinoDescartado : '(recusou)';
}

/* ── UT-056-1 ───────────────────────────────────────────────────────────────
   `erro` · "recusa o envio de quem nao pode enviar ou nao pode editar o
   conteudo de destino"
   Prova: "O envio exige a capacidade de enviar arquivo e, quando ha conteudo de
   destino, a de editar aquele conteudo" */

test('UT-056-1 recusa o envio de quem nao pode enviar ou nao pode editar o conteudo de destino', () => {
  /* ── a primeira capacidade ──
     Entrada: o COLABORADOR de fabrica (sem `upload_files`, com `edit_posts`),
     uma foto JPEG e um rascunho proprio como conteudo de destino. */
  const semEnvio = cenario({ papel: 'contributor' });

  // Acao: enviar pela tela de midia.
  const recusaDoColaborador = enviar(semEnvio, { nome: 'foto.jpg' });

  // Resultado: recusado com o texto do legado (`media-new.php:16`).
  assert.equal(recusaDoColaborador.enviado, false);
  assert.equal(motivo(recusaDoColaborador), 'sem-permissao');
  assert.equal(
    mensagem(recusaDoColaborador),
    MENSAGEM_DE_ENVIO_NAO_PERMITIDO,
  );
  /*
    E a recusa e da PRIMEIRA pergunta: `upload_files` vem antes de `get_post()`
    (`media-new.php:15` antes de `:24`), logo nada foi lido e nada foi tocado.
    O colaborador tem `edit_posts` e passaria na segunda — e por isso que o
    conjunto vazio aqui e afirmacao sobre a ORDEM, nao sobre a capacidade.
  */
  assert.deepEqual(semEnvio.perguntas, []);
  assert.deepEqual(semEnvio.leiturasDeDestino, []);
  assert.deepEqual(semEnvio.disco.operacoes, []);
  assert.deepEqual(semEnvio.insercoes, []);
  assert.deepEqual(semEnvio.dados.escritas, []);
  assert.deepEqual(semEnvio.disco.caminhosEm(PASTA_DO_DESTINO), []);

  /* ── a segunda capacidade ──
     Entrada: o AUTOR de fabrica (com `upload_files`, sem `edit_others_posts`) e
     o mesmo rascunho, agora de outra conta. */
  const destinoAlheio = cenario({ destino: DESTINO_ALHEIO });

  // Acao: enviar pelo envio assincrono do editor, a superficie que RECUSA.
  const recusaDoAutor = enviar(destinoAlheio, {
    nome: 'foto.jpg',
    superficie: 'envio-assincrono-do-editor',
  });

  // Resultado: recusado com o texto proprio dessa superficie
  // (`ajax-actions.php:2640`), sem registro e sem disco.
  assert.equal(recusaDoAutor.enviado, false);
  assert.equal(motivo(recusaDoAutor), 'sem-permissao');
  assert.equal(
    mensagem(recusaDoAutor),
    MENSAGEM_DE_ANEXO_NAO_PERMITIDO_NO_CONTEUDO,
  );
  // A segunda pergunta FOI feita: a traducao de `edit_post` leu o destino.
  assert.ok(destinoAlheio.perguntas.includes(ID_DO_DESTINO));
  assert.deepEqual(destinoAlheio.insercoes, []);
  assert.deepEqual(destinoAlheio.dados.escritas, []);
  assert.deepEqual(destinoAlheio.disco.operacoes, []);
  assert.deepEqual(destinoAlheio.disco.caminhosEm(PASTA_DO_DESTINO), []);

  /*
    E a recusa e da CAPACIDADE, nao do destino ser alheio: o editor de fabrica
    tem `edit_others_posts` (`schema.php:799`) e o mesmo envio, para o mesmo
    conteudo, passa.
  */
  const comEditor = cenario({ papel: 'editor', destino: DESTINO_ALHEIO });
  const aceito = enviar(comEditor, {
    nome: 'foto.jpg',
    superficie: 'envio-assincrono-do-editor',
  });

  assert.equal(aceito.enviado, true);
  assert.equal(destinoDescartado(aceito), false);
  assert.equal(comEditor.insercoes[0]?.conteudoDeDestino, ID_DO_DESTINO);
  assert.deepEqual(comEditor.disco.caminhosEm(PASTA_DO_DESTINO), [
    `${PASTA_DO_DESTINO}/foto.jpg`,
  ]);
});

/* ── UT-056-2 ───────────────────────────────────────────────────────────────
   `erro` · "decide o tipo pelo conteudo do arquivo, ignorando a extensao
   informada"
   Prova: "O tipo e decidido pelo conteudo do arquivo, nao pela extensao
   informada, e confrontado com a lista de tipos permitidos" */

test('UT-056-2 decide o tipo pelo conteudo do arquivo, ignorando a extensao informada', () => {
  /* Entrada: um arquivo chamado `relatorio.pdf`, anunciado pelo navegador como
     `application/pdf`, cujos BYTES sao de um PNG. Nada no pedido denuncia o
     conteudo: so o disco sabe. */
  const disfarcado = cenario({ bytes: CONTEUDO_PNG });

  // Acao: enviar, sem conteudo de destino.
  const recusado = enviar(disfarcado, {
    nome: 'relatorio.pdf',
    destino: SEM_CONTEUDO_DE_DESTINO,
    tipoInformado: 'application/pdf',
  });

  /*
    Resultado: recusado. E o `else` final de `wp_check_filetype_and_ext()` —
    *"Everything else including image/* and application/*: If the real content
    type doesn't match the file extension, assume it's dangerous"*
    (`wp-includes/functions.php:3312`-`:3317`).
  */
  assert.equal(recusado.enviado, false);
  assert.equal(mensagem(recusado), MENSAGEM_DE_TIPO_NAO_PERMITIDO);
  assert.deepEqual(disfarcado.insercoes, []);
  assert.deepEqual(disfarcado.dados.escritas, []);
  assert.deepEqual(disfarcado.disco.caminhosEm(PASTA_DO_MES), []);
  // A validacao de tipo e o passo 6; a pasta (7) e o move (9) vem depois, logo a
  // unica operacao e o `file_exists( $file )` da propria validacao (`:3131`).
  assert.deepEqual(disfarcado.disco.operacoes, [
    `existe ${CAMINHO_TEMPORARIO}`,
  ]);

  /* E o mesmo arquivo com outro NOME tem outro desfecho: `foto.png` com bytes
     de JPEG nao e recusado — o legado CORRIGE o nome e refaz o mapeamento
     (`functions.php:3182`-`:3193`). */
  const extensaoErrada = cenario({ bytes: FOTO_NOVA });
  const corrigido = enviar(extensaoErrada, {
    nome: 'foto.png',
    destino: SEM_CONTEUDO_DE_DESTINO,
    tipoInformado: 'image/png',
  });

  assert.equal(corrigido.enviado, true);
  assert.equal(nomeFinal(corrigido), 'foto.jpg');
  assert.equal(tipoGravado(corrigido), 'image/jpeg');
  // O tipo que vai para `post_mime_type` e o do CONTEUDO, e nao o que o
  // navegador afirmou nem o que a extensao dizia.
  assert.equal(extensaoErrada.insercoes[0]?.tipoMime, 'image/jpeg');
  assert.notEqual(extensaoErrada.insercoes[0]?.tipoMime, 'image/png');
  // E o nome em disco tambem e o do conteudo, com os bytes enviados.
  assert.deepEqual(extensaoErrada.disco.caminhosEm(PASTA_DO_MES), [
    `${PASTA_DO_MES}/foto.jpg`,
  ]);
  assert.deepEqual(
    extensaoErrada.disco.conteudoDe(`${PASTA_DO_MES}/foto.jpg`),
    FOTO_NOVA,
  );
});

/* ── UT-056-3 ───────────────────────────────────────────────────────────────
   `erro` · "recusa o tipo fora da lista informando o motivo ao ator"
   Prova: "Tipo fora da lista e recusado com motivo informado ao ator" */

test('UT-056-3 recusa o tipo fora da lista informando o motivo ao ator', () => {
  /* Entrada: `instalador.exe`, bytes `MZ`, enviado pelo autor de fabrica.
     `exe` ESTA no vocabulario de `wp_get_mime_types()` e
     `get_allowed_mime_types()` o retira SEMPRE (`functions.php:3696`). */
  const executavel = cenario({ bytes: CONTEUDO_EXECUTAVEL });

  // Acao: enviar, sem conteudo de destino.
  const recusado = enviar(executavel, {
    nome: 'instalador.exe',
    destino: SEM_CONTEUDO_DE_DESTINO,
    tipoInformado: 'application/x-msdownload',
  });

  // Resultado: recusado, com o motivo informado ao ator (`file.php:972`).
  assert.equal(recusado.enviado, false);
  assert.equal(motivo(recusado), 'erro-de-envio');
  assert.equal(codigo(recusado), CODIGO_DE_ERRO_DE_ENVIO);
  assert.equal(mensagem(recusado), MENSAGEM_DE_TIPO_NAO_PERMITIDO);
  assert.deepEqual(executavel.insercoes, []);
  assert.deepEqual(executavel.dados.escritas, []);
  assert.deepEqual(executavel.disco.caminhosEm(PASTA_DO_MES), []);

  // E o dado da recusa: a lista de fabrica conserva `exe`; quem o retira e a
  // lista permitida, para qualquer ator.
  assert.ok(
    TIPOS_DE_ARQUIVO_DE_FABRICA.some(
      (entrada) => entrada.padraoDeExtensao === 'exe',
    ),
  );
  assert.ok(
    !tiposPermitidos(false).some((entrada) => entrada.padraoDeExtensao === 'exe'),
  );
  assert.ok(
    !tiposPermitidos(true).some((entrada) => entrada.padraoDeExtensao === 'exe'),
  );

  /* E a lista depende de QUEM pergunta (`functions.php:3703`): o mesmo
     `pagina.html`, com os mesmos bytes, e recusado ao autor de fabrica e aceito
     ao editor de fabrica, que tem `unfiltered_html` (`schema.php:797`). */
  const autor = cenario({ bytes: CONTEUDO_HTML });
  const recusaDoAutor = enviar(autor, {
    nome: 'pagina.html',
    destino: SEM_CONTEUDO_DE_DESTINO,
    tipoInformado: 'text/html',
  });

  assert.equal(recusaDoAutor.enviado, false);
  // ⚠️ O MESMO texto das outras causas de recusa de tipo: o legado tem um unico
  // texto para extensao nao reconhecida, tipo real divergente e tipo fora da
  // lista permitida (`file.php:972`). Um porte com tres textos inventa contrato.
  assert.equal(mensagem(recusaDoAutor), MENSAGEM_DE_TIPO_NAO_PERMITIDO);
  assert.deepEqual(autor.disco.caminhosEm(PASTA_DO_MES), []);

  const editor = cenario({ papel: 'editor', bytes: CONTEUDO_HTML });
  const aceito = enviar(editor, {
    nome: 'pagina.html',
    destino: SEM_CONTEUDO_DE_DESTINO,
    tipoInformado: 'text/html',
  });

  assert.equal(aceito.enviado, true);
  assert.equal(tipoGravado(aceito), 'text/html');
  assert.deepEqual(editor.disco.caminhosEm(PASTA_DO_MES), [
    `${PASTA_DO_MES}/pagina.html`,
  ]);
  assert.ok(
    tiposPermitidos(true).some(
      (entrada) => entrada.padraoDeExtensao === 'htm|html',
    ),
  );
  assert.ok(
    !tiposPermitidos(false).some(
      (entrada) => entrada.padraoDeExtensao === 'htm|html',
    ),
  );
});

/* ── UT-056-4 ───────────────────────────────────────────────────────────────
   `borda` · "renomeia o arquivo na colisao de nome em lugar de sobrescrever"
   Prova: "Colisao de nome no destino e resolvida renomeando, sem sobrescrever
   arquivo existente" */

test('UT-056-4 renomeia o arquivo na colisao de nome em lugar de sobrescrever', () => {
  /* Entrada: a pasta do mes ja tem um `foto.jpg`, com bytes proprios, e o
     arquivo recebido tem o MESMO nome e outros bytes. */
  const disco = discoEmMemoria({
    arquivos: [
      [`${PASTA_DO_MES}/foto.jpg`, FOTO_ANTIGA],
      [CAMINHO_TEMPORARIO, FOTO_NOVA],
    ],
    pastas: [RAIZ_DE_ENVIOS],
  });
  const cen = cenario({ disco });

  // Acao: enviar `foto.jpg`.
  const resultado = enviar(cen, {
    nome: 'foto.jpg',
    destino: SEM_CONTEUDO_DE_DESTINO,
  });

  // Resultado: o nome recebeu sufixo (`wp_unique_filename()`, `file.php:991`).
  assert.equal(resultado.enviado, true);
  assert.equal(nomeFinal(resultado), 'foto-1.jpg');

  /*
    E "em lugar de sobrescrever" como ESTADO, que e o que o catalogo descreve:
    os dois arquivos existem, cada um com os bytes dele. E o que o cenario
    `@concorrencia` de `PT-014` cobra — *"dois arquivos distintos existem em
    disco"*.
  */
  assert.deepEqual(disco.conteudoDe(`${PASTA_DO_MES}/foto.jpg`), FOTO_ANTIGA);
  assert.deepEqual(disco.conteudoDe(`${PASTA_DO_MES}/foto-1.jpg`), FOTO_NOVA);
  assert.deepEqual(disco.caminhosEm(PASTA_DO_MES), [
    `${PASTA_DO_MES}/foto-1.jpg`,
    `${PASTA_DO_MES}/foto.jpg`,
  ]);
  /*
    E nenhuma operacao de ESCRITA apontou para o nome existente: o `foto.jpg` da
    pasta aparece na sequencia so como a pergunta `existe` do laco 1 de
    `wp_unique_filename()` (`functions.php:2589`), que e justamente o que faz o
    nome mudar.
  */
  assert.deepEqual(
    disco.operacoes.filter((operacao) =>
      operacao.endsWith(`${PASTA_DO_MES}/foto.jpg`),
    ),
    [`existe ${PASTA_DO_MES}/foto.jpg`],
  );
  assert.ok(
    disco.operacoes.includes(
      `mover ${CAMINHO_TEMPORARIO} ${PASTA_DO_MES}/foto-1.jpg`,
    ),
  );
  // *"cada anexo aponta para o seu proprio arquivo"* (`PT-014`).
  assert.equal(cen.insercoes[0]?.arquivo, `${PASTA_DO_MES}/foto-1.jpg`);

  /* E a sequencia de nomes de tres envios seguidos do mesmo nome, no MESMO
     disco: *"quando o envio e repetido tres vezes, a sequencia de nomes gerada
     e identica nas duas"* (`PT-014`). Cada volta traz o proprio arquivo
     temporario, como uma requisicao nova traz o seu. */
  const nomes: string[] = [];
  const caminhos: string[] = [];

  for (const temporario of ['/tmp/phpD4e5f6', '/tmp/phpG7h8i9', '/tmp/phpJ0k1l2']) {
    disco.por(temporario, arquivoCom(ASSINATURA_JPEG, temporario));
    const volta = cenario({ disco });

    const enviado = enviar(volta, {
      nome: 'foto.jpg',
      destino: SEM_CONTEUDO_DE_DESTINO,
      caminhoTemporario: temporario,
    });

    nomes.push(nomeFinal(enviado));
    caminhos.push(volta.insercoes[0]?.arquivo ?? '(sem anexo)');
  }

  assert.deepEqual(nomes, ['foto-2.jpg', 'foto-3.jpg', 'foto-4.jpg']);
  assert.deepEqual(caminhos, [
    `${PASTA_DO_MES}/foto-2.jpg`,
    `${PASTA_DO_MES}/foto-3.jpg`,
    `${PASTA_DO_MES}/foto-4.jpg`,
  ]);
  // Os cinco arquivos convivem, e nenhum perdeu os bytes dele.
  assert.deepEqual(disco.caminhosEm(PASTA_DO_MES), [
    `${PASTA_DO_MES}/foto-1.jpg`,
    `${PASTA_DO_MES}/foto-2.jpg`,
    `${PASTA_DO_MES}/foto-3.jpg`,
    `${PASTA_DO_MES}/foto-4.jpg`,
    `${PASTA_DO_MES}/foto.jpg`,
  ]);
  assert.deepEqual(disco.conteudoDe(`${PASTA_DO_MES}/foto.jpg`), FOTO_ANTIGA);
  assert.deepEqual(disco.conteudoDe(`${PASTA_DO_MES}/foto-1.jpg`), FOTO_NOVA);
  assert.deepEqual(
    disco.conteudoDe(`${PASTA_DO_MES}/foto-2.jpg`),
    arquivoCom(ASSINATURA_JPEG, '/tmp/phpD4e5f6'),
  );
  assert.deepEqual(
    disco.conteudoDe(`${PASTA_DO_MES}/foto-4.jpg`),
    arquivoCom(ASSINATURA_JPEG, '/tmp/phpJ0k1l2'),
  );
});

/* ── UT-056-5 ───────────────────────────────────────────────────────────────
   `erro` · "devolve o erro do sistema de arquivos sem criar registro quando o
   destino nao e gravavel"
   Prova: "Destino nao gravavel devolve erro com a mensagem do sistema de
   arquivos, e nenhum registro de anexo e criado" */

test('UT-056-5 devolve o erro do sistema de arquivos sem criar registro quando o destino nao e gravavel', () => {
  /* Entrada: a area de envios existe, mas a pasta do mes nao pode ser criada —
     o sistema de arquivos recusa. */
  const cen = cenario({ pastaNaoCriavel: true });

  // Acao: enviar `foto.jpg`, sem conteudo de destino.
  const resultado = enviar(cen, {
    nome: 'foto.jpg',
    destino: SEM_CONTEUDO_DE_DESTINO,
  });

  /*
    Resultado: o erro que `wp_upload_dir()` monta e `_wp_handle_upload()`
    devolve ao ator (`functions.php:2440`-`:2448`, `file.php:984`-`:986`), com o
    caminho encurtado pela raiz da instalacao.
  */
  assert.equal(resultado.enviado, false);
  assert.equal(motivo(resultado), 'erro-de-envio');
  assert.equal(
    mensagem(resultado),
    MENSAGEM_DE_PASTA_NAO_CRIADA.replace('%s', 'wp-content/uploads/2026/10'),
  );
  /*
    ⚠️ **E NAO a mensagem do errno.** "A mensagem do sistema de arquivos" que
    CA-1.5 pede e a que a camada de arquivos do legado devolve em
    `$uploads['error']`: `wp_mkdir_p()` responde so verdadeiro ou falso, e o
    texto do `mkdir()` do sistema operacional nunca chega a superficie. Um porte
    que repassasse o errno mostraria ao ator um texto que o legado nao mostra.
  */
  assert.ok(!mensagem(resultado).includes(MENSAGEM_DO_SISTEMA_DE_ARQUIVOS));

  // E "nenhum registro de anexo e criado": nem linha, nem metadado, nem arquivo.
  assert.deepEqual(cen.insercoes, []);
  assert.deepEqual(cen.dados.escritas, []);
  assert.deepEqual(cen.disco.caminhosEm(PASTA_DO_MES), []);
  // O arquivo recebido continua onde estava: o `mover` (passo 9) vem depois da
  // pasta (passo 7), e nao chegou a ser pedido.
  assert.deepEqual(cen.disco.conteudoDe(CAMINHO_TEMPORARIO), FOTO_NOVA);
  assert.ok(
    !cen.disco.operacoes.some((operacao) => operacao.startsWith('mover ')),
  );

  /* A outra metade de CA-1.5, que e outra falha e outro texto: a pasta existe e
     a escrita e que falha (`file.php:1021`, mensagem em `:1040`). */
  const semMover = cenario({ falhaAoMover: true });
  const recusa = enviar(semMover, {
    nome: 'foto.jpg',
    destino: SEM_CONTEUDO_DE_DESTINO,
  });

  assert.equal(recusa.enviado, false);
  assert.equal(
    mensagem(recusa),
    MENSAGEM_DE_ARQUIVO_NAO_MOVIDO.replace('%s', 'wp-content/uploads/2026/10'),
  );
  assert.deepEqual(semMover.insercoes, []);
  assert.deepEqual(semMover.dados.escritas, []);
  assert.deepEqual(semMover.disco.caminhosEm(PASTA_DO_MES), []);
  assert.deepEqual(semMover.disco.conteudoDe(CAMINHO_TEMPORARIO), FOTO_NOVA);
});

/* ── UT-056-6 ───────────────────────────────────────────────────────────────
   `feliz` · "aplica as mesmas duas verificacoes de capacidade na tela e no
   envio assincrono"
   Prova: "O envio pela tela e o envio assincrono do editor aplicam as mesmas
   duas verificacoes de capacidade" */

test('UT-056-6 aplica as mesmas duas verificacoes de capacidade na tela e no envio assincrono', () => {
  /* Entrada: o autor de fabrica, uma foto JPEG e um rascunho PROPRIO como
     conteudo de destino — o caminho feliz das duas verificacoes.
     Acao: o mesmo envio por cada uma das tres superficies. */
  for (const superficie of SUPERFICIES) {
    const cen = cenario();

    const resultado = enviar(cen, { nome: 'foto.jpg', superficie });

    // Resultado: as tres enviam, e as tres vinculam o anexo ao destino.
    assert.equal(resultado.enviado, true, superficie);
    assert.equal(destinoDescartado(resultado), false, superficie);
    assert.equal(
      cen.insercoes[0]?.conteudoDeDestino,
      ID_DO_DESTINO,
      superficie,
    );
    assert.deepEqual(
      cen.disco.caminhosEm(PASTA_DO_DESTINO),
      [`${PASTA_DO_DESTINO}/foto.jpg`],
      superficie,
    );
    /*
      E as DUAS verificacoes aconteceram nas tres: a primeira porque o envio
      passou, a segunda porque a traducao de `edit_post` leu o conteudo de
      destino pela fonte de `map_meta_cap()` — `media-new.php:24`,
      `async-upload.php:108` e `ajax-actions.php:2635`.
    */
    assert.ok(cen.perguntas.includes(ID_DO_DESTINO), superficie);
  }

  // E sem a primeira capacidade as tres recusam com o MESMO texto, antes de
  // qualquer leitura de destino e de qualquer operacao em disco.
  for (const superficie of SUPERFICIES) {
    const cen = cenario({ papel: 'contributor' });

    const resultado = enviar(cen, { nome: 'foto.jpg', superficie });

    assert.equal(mensagem(resultado), MENSAGEM_DE_ENVIO_NAO_PERMITIDO, superficie);
    assert.deepEqual(cen.perguntas, [], superficie);
    assert.deepEqual(cen.leiturasDeDestino, [], superficie);
    assert.deepEqual(cen.disco.operacoes, [], superficie);
    assert.deepEqual(cen.insercoes, [], superficie);
  }

  /*
    🔴 A VERIFICACAO e a mesma nas tres; a CONSEQUENCIA nao, e esta suite nao
    escolhe lado — ver "O que esta suite NAO decide", no cabecalho. Com destino
    alheio, a tela e o envio assincrono descartam o vinculo e seguem
    (`media-new.php:25`, `async-upload.php:109`), e o envio do editor recusa
    (`ajax-actions.php:2646`).
  */
  const desfechos = SUPERFICIES.map((superficie) => {
    const cen = cenario({ destino: DESTINO_ALHEIO });
    const resultado = enviar(cen, { nome: 'foto.jpg', superficie });
    return [resultado.enviado, destinoDescartado(resultado)];
  });

  assert.deepEqual(desfechos, [
    [true, true],
    [true, true],
    [false, '(recusou)'],
  ]);
});
