/**
 * A entrega de **T008**: *"5 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-035-1, UT-035-2, UT-035-3, UT-035-4,
 * UT-035-5), com o mesmo dado de entrada, acao e resultado esperado. O teste de
 * regra de negocio (UT-035-5) entra na mesma suite."*
 *
 * ---
 *
 * # Os cinco casos sao TRANSCRITOS, nao reconstruidos
 *
 * O catalogo esta no disco: o caminho `../../../backlog/tests.md` que
 * `tasks.md` cita resolve para `backlog/tests.md` na raiz do repositorio, e a
 * secao `REQ-035` tem os cinco casos com nome, tipo e prova. Esta suite **copia**
 * os cinco, um `test()` por caso, na ordem do catalogo, com o nome do caso no
 * nome do teste — o mesmo arranjo de
 * `../rotulo-e-contexto/ut-033-separacao-entre-rotulo-e-contexto.test.ts`, que
 * registrou por que isso vale ser dito (as suites de `identidade-e-acesso`
 * precisaram *reconstruir* os casos, porque o catalogo ainda nao existia quando
 * elas foram escritas).
 *
 * | caso | nome no catalogo | tipo | prova (coluna `Prova`) |
 * |---|---|---|---|
 * | `UT-035-1` | *"aplica o termo padrão quando nenhum termo é informado"* | `feliz` | CA-3.1 — *"Conteúdo gravado sem termo informado num contexto que declara termo padrão recebe o padrão"* |
 * | `UT-035-2` | *"reaplica a regra na publicação para todo contexto com padrão declarado"* | `feliz` | CA-3.2 — *"A regra é aplicada de novo na publicação, para todo contexto que declare padrão"* |
 * | `UT-035-3` | *"deixa o rascunho automático sem termo padrão"* | `borda` | CA-3.3 — *"Conteúdo em rascunho automático não recebe o padrão: ainda não é conteúdo"* |
 * | `UT-035-4` | *"deixa todo conteúdo do tipo padrão com classificação ao fim de qualquer gravação"* | `borda` | CA-3.4 — *"Ao fim de qualquer gravação, nenhum conteúdo do tipo padrão está sem classificação"* |
 * | `UT-035-5` | *"atribui a categoria padrão ao conteúdo do tipo padrão fora de rascunho automático"* | `borda` | regra — *"P3 — conteúdo do tipo padrão sempre tem categoria; sem categoria informada e fora de rascunho automático, recebe a categoria padrão"* |
 *
 * Nenhum caso foi acrescentado e nenhum foi desdobrado em dois: sao **cinco**
 * `test()`, e o que cada um afirma e o que a coluna `Prova` do caso diz. O
 * achado de QA que acompanha `REQ-035` explica a ausencia de caso de erro, e esta
 * suite nao inventa um: *"os criterios descrevem uma invariante de preenchimento
 * e nao ha entrada invalida nem permissao ausente propria deste card. A recusa de
 * quem nao pode criar termo esta em REQ-034 (UT-034-2) e a de contexto nao
 * declarado em REQ-033 (UT-033-4)"*.
 *
 * # Nao sao os testes de criterio de T007
 *
 * T007 entrega *"o comportamento de US-3 existe e os criterios CA-3.1, CA-3.2,
 * CA-3.3, CA-3.4 passam contra o sistema novo"*, e tem a suite dela ao lado, em
 * `./us-3-termo-padrao.test.ts`: 19 testes que percorrem os dois caminhos da
 * gravacao, os quatro metodos da colaboracao da publicacao, a assimetria de
 * capacidade entre as duas portas e o `0` que faz a regra desistir. Esta suite e
 * o **catalogo**: cinco casos, um por linha de `REQ-035`, cada um com o dado de
 * entrada e o resultado que o caso descreve, e nada mais. As duas afirmam a mesma
 * regra por recortes diferentes de proposito.
 *
 * **T008 depende de T007** (`tasks.md`: *"depende de: T007"*), e por isso esta
 * suite chama a operacao de `./` e o armazenamento de T002: numa arvore sem T007
 * ela nao compila, que e o que a dependencia declarada significa. O `[P]` de T008
 * — *"tarefa de teste, que toca so a propria suite"* — e honrado ao pe da letra:
 * **este arquivo e o unico tocado por esta tarefa**, nem `./index.ts` nem
 * `../index.ts` nem `../README.md` mudaram.
 *
 * # O que estes cinco testes afirmam, e por que desta forma
 *
 * O criterio de aceite desta area e **efeito no banco** (area 3 da Decisao 2 de
 * `parity_specs.md`, que compara *"snapshot + sequencia de comandos"*), e por
 * isso a porta de teste **registra consulta** em vez de simular banco
 * (`../armazenamento/porta-falsa.ts`). Cada caso afirma, quando o caso tem
 * escrita, **qual comando sai, com quais parametros e em que ordem** — e tambem,
 * onde isso e a regra, que **nenhum comando sai**: `UT-035-3` e inteiro uma
 * ausencia de comando.
 *
 * O caso `UT-035-4` leva `@invariante` no nome, que e a marca que
 * `parity_specs.md` torna obrigatoria em *"todo fluxo cujo aggregate tem
 * invariante"* — e CA-3.4 e uma invariante. O cenario de `PT-002` que cobre esta
 * regra e literal: *"Dado um conteudo do tipo padrao sem nenhum termo de
 * categoria, fora de rascunho automatico / Quando ele e gravado / Entao as duas
 * metades vinculam a categoria padrao / E na publicacao a regra se repete para
 * toda taxonomia que tenha termo padrao / E o vinculo gravado e o mesmo nas
 * duas"*
 * (`.specify/migration/parity_tests/02-publicacao-e-agendamento-de-conteudo.feature`).
 *
 * # 🔴 E ESSE CENARIO NAO E COMPARAVEL HOJE: nenhum teste aqui e de paridade
 *
 * Nao existe `.feature` de classificacao em `.specify/migration/parity_tests/`,
 * o oraculo **executavel** do legado nao existe nesta arvore
 * (`oracleAvailable: false`; levanta-lo e T001 da feature `015`) e, nesta arvore
 * de trabalho, **a instalacao do legado tambem nao esta no disco** — nao ha
 * `wp-includes/post.php` para reconferir ancora. Cada `arquivo:linha` citado
 * abaixo vem do pacote (`BR-MIGRAR-003`, `UC-05`, `UC-03`, `spec.md`,
 * `backlog/tests.md`) ou da transcricao **merged** do laco da publicacao que T003
 * de BC-01 deixou em `../../conteudo/publicacao/termo-padrao-na-publicacao.ts` —
 * **nenhum vem de memoria, e nenhum foi reconferido**. Os dois pontos que ficam
 * para quem tiver o oraculo estao no bloco 🔴 de `./termo-padrao-na-gravacao.ts`,
 * e o de `UT-035-1` tem comentario proprio no corpo.
 *
 * # ⚠️ UT-035-2 CAI DO OUTRO LADO DA FRONTEIRA, e o laco entra transcrito
 *
 * O caso pede *"reaplica a regra na publicacao para todo contexto com padrao
 * declarado"*, e **o laco da publicacao nao e deste contexto**: ele e de BC-01,
 * esta merged em `../../conteudo/publicacao/termo-padrao-na-publicacao.ts`, e o
 * que T007 entrega sao os quatro metodos que ele chama
 * ({@link ClassificacaoNaPublicacao}). A regra de dependencia 3 de
 * `target_architecture.md` proibe `contextos/<a>/` importar `contextos/<b>/`
 * *"sempre, sem excecao"*, e nenhum arquivo desta arvore — de fonte ou de teste —
 * o faz hoje. Logo o laco entra aqui **transcrito**, em
 * {@link lacoDaPublicacaoDeBC01}, com os cinco ramos e as linhas que a copia
 * merged declara, e o que o teste afirma e o que **este** lado faz quando aquele
 * laco roda: as taxonomias que ele percorre, os termos que ele le, a opcao que
 * ele consulta e os vinculos que ele grava. Transcrever o laco nao e decidir
 * nada; importa-lo seria furar a regra 3, e reconstruir o caso em cima so dos
 * quatro metodos deixaria *"para todo contexto com padrao declarado"* — que e um
 * laco — sem afirmacao.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarPortaDeDadosFalsa,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import {
  criarModuloDeClassificacao,
  type ModuloDeClassificacao,
} from '../index.js';
import type { Consulta } from '../portas/index.js';
import type {
  ColaboracaoDoVinculo,
  ConteudoNaClassificacao,
} from '../vinculo-de-objeto/index.js';
import {
  chaveDoTermoPadrao,
  ESTADO_DE_RASCUNHO_AUTOMATICO,
  OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
  PREFIXO_DA_OPCAO_DE_TERMO_PADRAO,
  SEM_TERMO_PADRAO,
  TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
} from './chave-do-termo-padrao.js';
import type { ClassificacaoNaPublicacao } from './classificacao-na-publicacao.js';
import type {
  ColaboracaoDoTermoPadrao,
  ColaboracaoDoTermoPadraoSemAtor,
  OpcoesNaClassificacao,
} from './escopo-de-termo-padrao.js';
import {
  resolverTermoPadraoNaGravacao,
  type ListaInformada,
} from './termo-padrao-na-gravacao.js';

/* ── O DADO DE ENTRADA DOS CINCO CASOS ─────────────────────────────────────── */

/** `term_relationships.object_id` — o conteudo que **ja existe** na gravacao. */
const OBJETO = 42;

/**
 * O `term_id` que a opcao `default_category` guarda.
 *
 * `1` e o valor de fabrica, semeado pelo instalador (`BR-MIGRAR-084`, `DB-SEED`),
 * e e o numero que `UT-035-5` cita pela boca de UC-05: *"para o tipo `post` isso
 * significa `default_category`, que nasce com o identificador 1"*.
 */
const ROTULO_PADRAO_DA_CATEGORIA = 1;

/** O `term_taxonomy_id` dele em `category` — e e **este** que a juncao grava. */
const ROTULO_DA_CATEGORIA_NO_CONTEXTO = 5;

/**
 * O contexto que uma extensao registra **declarando** `default_term`, e o unico
 * caminho por onde o laco dos demais contextos pode agir: `rotuloPadrao` e nulo
 * nos oito contextos do nucleo (`../registro/contextos-do-nucleo.ts`).
 */
const CONTEXTO_DE_EXTENSAO = 'resenha';
const ROTULO_PADRAO_DA_EXTENSAO = 9;
const ROTULO_DA_EXTENSAO_NO_CONTEXTO = 21;

/**
 * Um segundo contexto que declara padrao e cuja **opcao vale `0`**: e com ele que
 * *"todo contexto com padrao declarado"* deixa de ser um contexto so, e e ele que
 * exercita o ramo 4 do laco da publicacao (*"a opcao vale `0` | salta a
 * taxonomia"*).
 */
const CONTEXTO_SEM_OPCAO = 'colecao';

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

/**
 * O autor da gravacao.
 *
 * `edit_posts` e o que o contexto declara em `atribuirRotulos` por default
 * (`class-wp-taxonomy.php:430`), e e o que UC-05 resume: *"atribuir termo e poder
 * de conteudo, nao de classificacao"*.
 */
function autor(): AtorDeAutorizacao {
  return {
    contaId: 7,
    login: 'author',
    existe: true,
    concessoes: [{ capacidade: 'author', concedida: true }],
  };
}

/** A colaboracao com BC-01, que no alvo e `posts` e aqui e um duble. */
function conteudoDeTeste(): ColaboracaoDoVinculo {
  const conteudo: ConteudoNaClassificacao = {
    tipoDeConteudoEhRegistrado: (tipo) =>
      ['post', 'page', 'attachment'].includes(tipo),
    contarConteudoPublicado: () => 0,
    contarAnexosPublicados: () => 0,
  };
  return { conteudo };
}

/**
 * A leitura da opcao por ligacao tardia, que **registra as chaves lidas**.
 *
 * E o que permite afirmar o que estes casos mais precisam afirmar: que a opcao
 * **nao e consultada** nos ramos em que o legado nao a consulta — em rascunho
 * automatico (`UT-035-3`) e em contexto que nao declara padrao.
 */
function opcoesDeTeste(valores: Readonly<Record<string, number>> = {}): {
  opcoes: OpcoesNaClassificacao;
  chavesLidas: string[];
} {
  const chavesLidas: string[] = [];
  return {
    opcoes: {
      identificadorDoTermoPadrao(chave) {
        chavesLidas.push(chave);
        return valores[chave] ?? SEM_TERMO_PADRAO;
      },
    },
    chavesLidas,
  };
}

/**
 * Uma composicao do modulo sobre a porta que registra consulta.
 *
 * O registro de contextos nasce **dentro** da composicao (`EXT-CONTEXTO`,
 * `BR-MIGRAR-105`, dimensao D-A de `parity_specs.md`), logo cada teste tem os
 * oito contextos do nucleo e nenhum vizinho.
 */
function montar(): {
  falsa: PortaDeDadosFalsa;
  modulo: ModuloDeClassificacao;
} {
  const falsa = criarPortaDeDadosFalsa();
  return { falsa, modulo: criarModuloDeClassificacao({ dados: falsa.porta }) };
}

/** `register_taxonomy( $nome, 'post', array( 'default_term' => ... ) )`. */
function registrarContextoQueDeclaraPadrao(
  modulo: ModuloDeClassificacao,
  nome: string,
): void {
  modulo.contextos.registrar(nome, {
    tiposDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
    rotuloPadrao: 'Sem rotulo',
  });
}

/** O cenario de uma **gravacao**: os tres dubles ligados, e o ator. */
function cenarioDeGravacao(
  entrada: {
    readonly opcoes?: Readonly<Record<string, number>>;
    readonly contextosQueDeclaramPadrao?: readonly string[];
  } = {},
): {
  falsa: PortaDeDadosFalsa;
  modulo: ModuloDeClassificacao;
  colaboracao: ColaboracaoDoTermoPadrao;
  chavesLidas: string[];
} {
  const { falsa, modulo } = montar();
  const leitura = opcoesDeTeste(entrada.opcoes ?? {});

  for (const nome of entrada.contextosQueDeclaramPadrao ?? []) {
    registrarContextoQueDeclaraPadrao(modulo, nome);
  }

  return {
    falsa,
    modulo,
    colaboracao: {
      ...conteudoDeTeste(),
      base: BASE,
      ator: autor(),
      opcoes: leitura.opcoes,
    },
    chavesLidas: leitura.chavesLidas,
  };
}

/**
 * O cenario de uma **publicacao**, e ele **nao tem ator**.
 *
 * `wp_publish_post()` roda sem ninguem autenticado — a fila agendada o chama
 * assim — e `wp_set_post_terms()` nao verifica capacidade nenhuma
 * (`post.php:5438`). E por isso que a colaboracao da publicacao e
 * {@link ColaboracaoDoTermoPadraoSemAtor} e nao a de cima.
 */
function cenarioDePublicacao(
  entrada: {
    readonly opcoes?: Readonly<Record<string, number>>;
    readonly contextosQueDeclaramPadrao?: readonly string[];
  } = {},
): {
  falsa: PortaDeDadosFalsa;
  modulo: ModuloDeClassificacao;
  classificacao: ClassificacaoNaPublicacao;
  chavesLidas: string[];
} {
  const { falsa, modulo } = montar();
  const leitura = opcoesDeTeste(entrada.opcoes ?? {});

  for (const nome of entrada.contextosQueDeclaramPadrao ?? []) {
    registrarContextoQueDeclaraPadrao(modulo, nome);
  }

  const colaboracao: ColaboracaoDoTermoPadraoSemAtor = {
    ...conteudoDeTeste(),
    opcoes: leitura.opcoes,
  };

  return {
    falsa,
    modulo,
    classificacao: modulo.classificacaoNaPublicacao(colaboracao),
    chavesLidas: leitura.chavesLidas,
  };
}

/** Programa a leitura inversa `fields => ids` — so os `term_id` do objeto. */
function programarRotulosDoObjeto(
  falsa: PortaDeDadosFalsa,
  rotuloIds: readonly number[],
): void {
  falsa.responder(rotuloIds.map((rotuloId) => ({ term_id: rotuloId })));
}

/** A resposta de `idDoRotuloNoContexto`: o par existe, ou nao. */
function programarPar(
  falsa: PortaDeDadosFalsa,
  rotuloNoContextoId: number | null,
): void {
  falsa.responder(
    rotuloNoContextoId === null
      ? []
      : [{ term_taxonomy_id: rotuloNoContextoId }],
  );
}

/** A resposta de `vinculos.existe`. */
function programarVinculoJaGravado(
  falsa: PortaDeDadosFalsa,
  rotuloNoContextoId: number | null,
): void {
  falsa.responder(
    rotuloNoContextoId === null
      ? []
      : [{ term_taxonomy_id: rotuloNoContextoId }],
  );
}

/**
 * Os tres passos que `wp_set_object_terms()` le antes de inserir um vinculo
 * **inedito**: o conjunto anterior (vazio), o par `term_id`/`term_taxonomy_id` e
 * a pergunta se aquele vinculo ja esta gravado.
 */
function programarVinculoInedito(
  falsa: PortaDeDadosFalsa,
  rotuloNoContextoId: number,
): void {
  programarRotulosDoObjeto(falsa, []);
  programarPar(falsa, rotuloNoContextoId);
  programarVinculoJaGravado(falsa, null);
}

/** So o texto dos comandos, para afirmar a sequencia sem repetir parametros. */
function textos(consultas: readonly Consulta[]): readonly string[] {
  return consultas.map((consulta) => consulta.texto);
}

/** Os dois comandos que um vinculo inedito emite, na ordem (`:2922` e `:4253`). */
const ESCRITAS_DE_UM_VINCULO_INEDITO: readonly string[] = [
  'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id) VALUES (?, ?)',
  'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
];

/* ══════════════════════════════════════════════════════════════════════════
   UT-035-1 `feliz` — "aplica o termo padrao quando nenhum termo e informado"
   Prova: CA-3.1 — "Conteudo gravado sem termo informado num contexto que
   declara termo padrao recebe o padrao"
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-035-1 aplica o termo padrao quando nenhum termo e informado (CA-3.1)', () => {
  // Dado de entrada: conteudo do tipo padrao, fora de rascunho automatico, e a
  // opcao `default_category` com o `term_id` que o instalador semeou.
  const { falsa, modulo, colaboracao, chavesLidas } = cenarioDeGravacao({
    opcoes: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA },
  });
  programarVinculoInedito(falsa, ROTULO_DA_CATEGORIA_NO_CONTEXTO);

  // Acao: a gravacao, **sem termo informado** — nem `$post_category` nem
  // `tax_input`. Ausente e lista vazia sao a mesma coisa no legado
  // (`empty( $post_category ) || 0 === count( ... ) || ! is_array( ... )`).
  const aplicadas = modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
    objetoId: OBJETO,
    tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
    estado: 'draft',
  });

  // Resultado esperado, primeira metade — **recebe o padrao**: uma lista
  // decidida, no contexto de categoria, com o identificador que a opcao guarda, e
  // ela foi gravada (`post.php:4719`, e a escrita em `:5053`).
  assert.deepEqual(aplicadas, [
    {
      contexto: 'category',
      rotulos: [ROTULO_PADRAO_DA_CATEGORIA],
      origem: 'termo-padrao',
      porta: 'categoria',
      resultado: {
        aplicado: true,
        rotulosNoContextoIds: [ROTULO_DA_CATEGORIA_NO_CONTEXTO],
      },
    },
  ]);

  // Resultado esperado, segunda metade — o **efeito no banco**: o vinculo e um
  // `INSERT` com duas colunas, e a recontagem vem atras dele. ⚠️ O identificador
  // gravado e o `term_taxonomy_id` (`5`), e **nao** o `term_id` que a opcao
  // guarda (`1`): e o erro que esta historia convida a cometer.
  assert.deepEqual(textos(falsa.escritas), ESCRITAS_DE_UM_VINCULO_INEDITO);
  assert.deepEqual(falsa.escritas[0]?.parametros, [
    OBJETO,
    ROTULO_DA_CATEGORIA_NO_CONTEXTO,
  ]);
  assert.deepEqual(falsa.escritas[1]?.parametros, [
    0,
    ROTULO_DA_CATEGORIA_NO_CONTEXTO,
  ]);

  // Uma chave de opcao, e so uma: `category` e excecao **por nome**, e nenhum dos
  // oito contextos do nucleo declara `default_term` — logo `post_tag` e
  // `post_format` sao saltados antes de qualquer leitura.
  assert.deepEqual(chavesLidas, [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]);
  assert.equal(chaveDoTermoPadrao('category'), 'default_category');

  /*
   * 🔴 Este caso passa pelo ponto (a) do bloco de limites de
   * `./termo-padrao-na-gravacao.ts`: a arvore **testa** a opcao antes de usa-la,
   * como o ramo 4 do laco da publicacao testa (`:5436`-`:5437`, transcrito por
   * T003 de BC-01), e a linha da gravacao (`:4719`) nao e legivel nesta arvore.
   * Com a opcao em `1` as duas leituras coincidem; o caso em que elas divergiriam
   * — opcao `0` — tem teste proprio na suite de T007.
   */
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-035-2 `feliz` — "reaplica a regra na publicacao para todo contexto com
   padrao declarado"
   Prova: CA-3.2 — "A regra e aplicada de novo na publicacao, para todo contexto
   que declare padrao"
   ⚠️ O laco e de BC-01 e entra transcrito. Ver o cabecalho.
   ══════════════════════════════════════════════════════════════════════════ */

/** Um termo padrao atribuido pelo laco da publicacao. */
interface TermoPadraoAtribuido {
  readonly taxonomia: string;
  readonly termoId: number;
}

/**
 * O laco de `wp_publish_post()` (`wp-includes/post.php:5419`-`:5439`),
 * **transcrito** da copia merged de BC-01
 * (`../../conteudo/publicacao/termo-padrao-na-publicacao.ts`), com o comentario
 * do proprio legado por cima dele: *"Ensure at least one term is applied for
 * taxonomies with a default term."*
 *
 * ⚠️ **Nao e uma segunda implementacao da regra, e nao pode se tornar uma.** Ele
 * existe aqui porque a regra de dependencia 3 proibe importar BC-01 — ver o
 * cabecalho desta suite — e porque `UT-035-2` fala de *"todo contexto com padrao
 * declarado"*, que e o laco. Os cinco ramos, com as linhas que a copia merged
 * declara, sao os unicos que este driver tem; qualquer ramo a mais seria regra
 * inventada deste lado.
 *
 * | # | ramo | linha | efeito |
 * |---|---|---|---|
 * | 1 | nao e `category` **e** o registro nao declara termo padrao | `:5422`-`:5425` | salta a taxonomia |
 * | 2 | o conteudo **ja** tem termo naquela taxonomia | `:5427`-`:5429` | salta — *"Do not modify previously set terms"* |
 * | 3 | `category` le `default_category`; o resto le `default_term_{taxonomia}` | `:5431`-`:5435` | escolhe a chave |
 * | 4 | a opcao vale `0` | `:5436`-`:5437` | salta a taxonomia |
 * | 5 | atribui o termo | `:5438` | **escreve**, e o retorno e ignorado (P7) |
 */
function lacoDaPublicacaoDeBC01(
  classificacao: ClassificacaoNaPublicacao,
  conteudoId: number,
  tipoDoConteudo: string,
): readonly TermoPadraoAtribuido[] {
  const atribuidos: TermoPadraoAtribuido[] = [];

  for (const taxonomia of classificacao.taxonomiasDoTipo(tipoDoConteudo)) {
    // Ramo 1: a categoria entra mesmo sem `default_term` declarado, porque o
    // padrao dela vive na opcao e nao no registro.
    if (taxonomia.nome !== 'category' && !taxonomia.declaraTermoPadrao) {
      continue;
    }

    // Ramo 2: e o **erro** de `get_the_terms()` cai aqui junto, porque
    // `! empty( WP_Error )` e verdadeiro no legado.
    const termos = classificacao.termosDoConteudo(conteudoId, taxonomia.nome);
    if (termos.erro || termos.termos.length > 0) {
      continue;
    }

    // Ramos 3 e 4: a chave, e o `0` que desiste.
    const termoId = classificacao.opcaoDeTermoPadrao(
      chaveDoTermoPadrao(taxonomia.nome),
    );
    if (termoId === SEM_TERMO_PADRAO) {
      continue;
    }

    // Ramo 5: escreve.
    classificacao.definirTermos(conteudoId, [termoId], taxonomia.nome);
    atribuidos.push({ taxonomia: taxonomia.nome, termoId });
  }

  return atribuidos;
}

test('UT-035-2 reaplica a regra na publicacao para todo contexto com padrao declarado (CA-3.2)', () => {
  // Dado de entrada: **tres** contextos com padrao a reaplicar — a categoria, que
  // e padrao por nome, e dois registrados por extensao, que o sao por declaracao
  // — mais os dois contextos do nucleo que nao declaram nada. E o `0` de
  // `colecao`, que e o ramo 4.
  const { falsa, classificacao, chavesLidas } = cenarioDePublicacao({
    contextosQueDeclaramPadrao: [CONTEXTO_DE_EXTENSAO, CONTEXTO_SEM_OPCAO],
    opcoes: {
      [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA,
      [`${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}${CONTEXTO_DE_EXTENSAO}`]:
        ROTULO_PADRAO_DA_EXTENSAO,
      [`${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}${CONTEXTO_SEM_OPCAO}`]:
        SEM_TERMO_PADRAO,
    },
  });

  // O conteudo nao tem termo em nenhum dos tres, e e por isso que a regra se
  // reaplica: ramo 2 nao salta ninguem.
  programarRotulosDoObjeto(falsa, []); // `category`, ramo 2
  programarVinculoInedito(falsa, ROTULO_DA_CATEGORIA_NO_CONTEXTO); // ramo 5
  programarRotulosDoObjeto(falsa, []); // `resenha`, ramo 2
  programarVinculoInedito(falsa, ROTULO_DA_EXTENSAO_NO_CONTEXTO); // ramo 5
  programarRotulosDoObjeto(falsa, []); // `colecao`, ramo 2

  // Acao: a publicacao do conteudo do tipo padrao.
  const atribuidos = lacoDaPublicacaoDeBC01(
    classificacao,
    OBJETO,
    TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
  );

  // Resultado esperado — **para todo contexto com padrao declarado**: a categoria
  // e a extensao recebem o deles, na ordem de registro, que e a ordem dos
  // comandos (area 3 da Decisao 2 compara *"snapshot + sequencia de comandos"*).
  assert.deepEqual(atribuidos, [
    { taxonomia: 'category', termoId: ROTULO_PADRAO_DA_CATEGORIA },
    { taxonomia: CONTEXTO_DE_EXTENSAO, termoId: ROTULO_PADRAO_DA_EXTENSAO },
  ]);

  // E o que **nao** recebe: `post_tag` e `post_format` nao declaram padrao e sao
  // saltados pelo ramo 1 **antes** de qualquer leitura — nenhuma chave
  // `default_term_post_tag` e consultada —, e `colecao` declara mas tem opcao
  // `0`, logo o ramo 4 desiste depois de ler a chave.
  assert.deepEqual(chavesLidas, [
    OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
    `${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}${CONTEXTO_DE_EXTENSAO}`,
    `${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}${CONTEXTO_SEM_OPCAO}`,
  ]);
  // ⚠️ E `declaraTermoPadrao` e `false` em `category`: o padrao dela vive na
  // opcao, nao no registro, e e por isso que o ramo 1 a trata **por nome**. A
  // ordem e a de registro, e ela fixa a ordem dos comandos acima.
  assert.deepEqual(
    classificacao.taxonomiasDoTipo(TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO),
    [
      { nome: 'category', declaraTermoPadrao: false },
      { nome: 'post_tag', declaraTermoPadrao: false },
      { nome: 'post_format', declaraTermoPadrao: false },
      { nome: CONTEXTO_DE_EXTENSAO, declaraTermoPadrao: true },
      { nome: CONTEXTO_SEM_OPCAO, declaraTermoPadrao: true },
    ],
  );

  // O efeito no banco: **dois** vinculos gravados, um por contexto que recebeu o
  // padrao, cada um com a recontagem atras — e os identificadores sao os
  // `term_taxonomy_id`, nao os `term_id` das opcoes.
  assert.deepEqual(textos(falsa.escritas), [
    ...ESCRITAS_DE_UM_VINCULO_INEDITO,
    ...ESCRITAS_DE_UM_VINCULO_INEDITO,
  ]);
  assert.deepEqual(falsa.escritas[0]?.parametros, [
    OBJETO,
    ROTULO_DA_CATEGORIA_NO_CONTEXTO,
  ]);
  assert.deepEqual(falsa.escritas[2]?.parametros, [
    OBJETO,
    ROTULO_DA_EXTENSAO_NO_CONTEXTO,
  ]);

  // ⚠️ E a reaplicacao acontece **sem ator**: `cenarioDePublicacao` nao tem um, e
  // nenhum dos quatro metodos cobra capacidade. E essa assimetria que faz CA-3.2
  // existir como criterio separado de CA-3.1 — o padrao que a gravacao recusou
  // por falta de `assign_terms` entra aqui.
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-035-3 `borda` — "deixa o rascunho automatico sem termo padrao"
   Prova: CA-3.3 — "Conteudo em rascunho automatico nao recebe o padrao: ainda
   nao e conteudo"
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-035-3 deixa o rascunho automatico sem termo padrao (CA-3.3)', () => {
  // Dado de entrada: o mesmo conteudo do tipo padrao, as mesmas opcoes com padrao
  // gravado, e um contexto de extensao que declara padrao — tudo pronto para a
  // regra agir. O que muda e **so o estado**.
  const { falsa, modulo, colaboracao, chavesLidas } = cenarioDeGravacao({
    contextosQueDeclaramPadrao: [CONTEXTO_DE_EXTENSAO],
    opcoes: {
      [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA,
      [`${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}${CONTEXTO_DE_EXTENSAO}`]:
        ROTULO_PADRAO_DA_EXTENSAO,
    },
  });

  const aplicadas = modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
    objetoId: OBJETO,
    tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
    estado: ESTADO_DE_RASCUNHO_AUTOMATICO,
  });

  // Resultado esperado: **nenhum termo padrao**, nos dois caminhos. UC-05 poe o
  // caso na tabela de excecoes com esta frase: *"Conteudo e `auto-draft` | o termo
  // padrao nao e aplicado: o registro ainda nao e conteudo"*.
  assert.deepEqual(aplicadas, []);

  // E a borda e mais estreita do que "nao aplicou": no legado o `if` envolve o
  // laco **inteiro**, logo nem a juncao nem a opcao sao consultadas. E a diferenca
  // entre *"nao aplicou"* e *"aplicou e nao achou"*, e ela e observavel na
  // sequencia de comandos.
  assert.deepEqual(chavesLidas, []);
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);

  // A cadeia e comparada por valor (`'auto-draft' !== $post_status`): o estado
  // vizinho entra na regra. Um porte que normalizasse o estado deixaria de aplicar
  // o padrao onde o legado aplica.
  assert.equal(ESTADO_DE_RASCUNHO_AUTOMATICO, 'auto-draft');
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-035-4 `borda` — "deixa todo conteudo do tipo padrao com classificacao ao
   fim de qualquer gravacao"
   Prova: CA-3.4 — "Ao fim de qualquer gravacao, nenhum conteudo do tipo padrao
   esta sem classificacao"
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * As categorias com que o conteudo **fica** ao fim da gravacao: a lista informada
 * quando ela vence, e o que o laco decidiu quando ela vem vazia.
 *
 * As duas metades estao aqui porque as duas sao a gravacao: no legado o laco
 * reescreve `$post_category` e quem grava e `wp_set_post_categories()`
 * (`post.php:5053`) — e e por isso que a invariante se le na uniao das duas, e
 * nao so no que o laco devolve.
 */
function categoriasAoFimDaGravacao(
  modulo: ModuloDeClassificacao,
  colaboracao: ColaboracaoDoTermoPadrao,
  pedido: {
    readonly estado: string;
    readonly tipoDeObjeto: string;
    readonly categorias?: ListaInformada;
  },
): readonly number[] {
  const decididas = resolverTermoPadraoNaGravacao(
    { contextos: modulo.contextos, armazenamento: modulo.armazenamento },
    colaboracao,
    {
      objetoId: OBJETO,
      tipoDeObjeto: pedido.tipoDeObjeto,
      estado: pedido.estado,
      ...(pedido.categorias === undefined
        ? {}
        : { categorias: pedido.categorias }),
    },
  );

  const doLaco = decididas.find((lista) => lista.contexto === 'category');
  if (doLaco !== undefined) {
    return doLaco.rotulos;
  }

  // A lista informada, que o laco deixou passar intacta — e e ela que
  // `wp_set_post_categories()` grava (T005).
  const informada = pedido.categorias ?? [];
  return (Array.isArray(informada) ? informada : [informada])
    .filter((item) => item !== 0 && item !== '0' && item !== '')
    .map((item) => (typeof item === 'number' ? item : Number(item)));
}

test('UT-035-4 deixa todo conteudo do tipo padrao com classificacao ao fim de qualquer gravacao (CA-3.4, @invariante)', () => {
  // "Qualquer gravacao" e, no legado, todo estado que nao e rascunho automatico:
  // o ramo de `:4719` nao olha o estado alem desse. Lixeira e rascunho recebem a
  // categoria padrao igual, e e isso que faz da regra uma invariante e nao uma
  // etapa da publicacao.
  const estados = [
    'draft',
    'pending',
    'publish',
    'private',
    'future',
    'trash',
    'inherit',
  ];

  // As tres entradas que uma gravacao do tipo padrao pode ter: sem categoria,
  // com categoria, e com a lista que a tela envia quando o autor desmarca todas
  // — um campo oculto com valor `0`, *"to allow for an empty term set to be
  // sent"* (`wp-admin/includes/meta-boxes.php:661`).
  const entradas: readonly {
    readonly nome: string;
    readonly categorias?: ListaInformada;
    /** Com que categorias o conteudo fica, em qualquer um dos estados acima. */
    readonly esperado: readonly number[];
  }[] = [
    { nome: 'sem categoria informada', esperado: [ROTULO_PADRAO_DA_CATEGORIA] },
    { nome: 'com categoria informada', categorias: [12], esperado: [12] },
    {
      nome: 'com a lista so de vazios da tela',
      categorias: [0, '0', ''],
      esperado: [ROTULO_PADRAO_DA_CATEGORIA],
    },
  ];

  for (const estado of estados) {
    for (const entrada of entradas) {
      const { modulo, colaboracao } = cenarioDeGravacao({
        opcoes: {
          [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA,
        },
      });

      const categorias = categoriasAoFimDaGravacao(modulo, colaboracao, {
        estado,
        tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
        ...(entrada.categorias === undefined
          ? {}
          : { categorias: entrada.categorias }),
      });

      // Resultado esperado: a lista **nunca** fica vazia. E a pos-condicao de
      // UC-05 (*"nenhum conteudo do tipo `post` ficou sem categoria"*) e a de
      // UC-03 (*"toda taxonomia com termo padrao tem ao menos um termo
      // atribuido"*).
      assert.equal(
        categorias.length > 0,
        true,
        `estado ${estado}, ${entrada.nome}`,
      );

      // E a classificacao e a do legado em cada caso: a informada quando ha uma,
      // o padrao quando nao ha — inclusive quando a lista informada era so de
      // valores que o `array_filter()` do legado derruba.
      assert.deepEqual(
        categorias,
        entrada.esperado,
        `estado ${estado}, ${entrada.nome}`,
      );
    }
  }

  // O **efeito no banco** da metade que esta tarefa alcanca, uma vez, por extenso:
  // o vinculo da categoria padrao sai como `INSERT` e a recontagem atras dele.
  const { falsa, modulo, colaboracao } = cenarioDeGravacao({
    opcoes: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA },
  });
  programarVinculoInedito(falsa, ROTULO_DA_CATEGORIA_NO_CONTEXTO);
  modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
    objetoId: OBJETO,
    tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
    estado: 'trash',
  });
  assert.deepEqual(textos(falsa.escritas), ESCRITAS_DE_UM_VINCULO_INEDITO);

  // ⚠️ **A fronteira da invariante e o rascunho automatico, e ela e CA-3.3.** Um
  // `auto-draft` termina a gravacao sem classificacao e isso nao viola CA-3.4:
  // *"ainda nao e conteudo"*. As duas afirmacoes convivem porque o legado as
  // escreve no mesmo `if`.
  const emRascunhoAutomatico = cenarioDeGravacao({
    opcoes: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA },
  });
  assert.deepEqual(
    categoriasAoFimDaGravacao(
      emRascunhoAutomatico.modulo,
      emRascunhoAutomatico.colaboracao,
      {
        estado: ESTADO_DE_RASCUNHO_AUTOMATICO,
        tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
      },
    ),
    [],
  );
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-035-5 `borda` — "atribui a categoria padrao ao conteudo do tipo padrao
   fora de rascunho automatico"
   Prova: a regra de negocio — "P3 — conteudo do tipo padrao sempre tem
   categoria; sem categoria informada e fora de rascunho automatico, recebe a
   categoria padrao" (`domain.md §2.1`, `BR-MIGRAR-003`)
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-035-5 atribui a categoria padrao ao conteudo do tipo padrao fora de rascunho automatico (regra: P3)', () => {
  // A regra tem **tres** condicoes, e o teste percorre as tres e as negativas
  // delas, porque e a conjuncao que e a regra: `if ( 'post' === $post_type &&
  // 'auto-draft' !== $post_status )` sobre uma lista de categorias vazia, com o
  // comentario do legado por cima — *"'post' requires at least one category"*.
  const casos: readonly {
    readonly nome: string;
    readonly tipoDeObjeto: string;
    readonly estado: string;
    readonly categorias?: ListaInformada;
    readonly recebeOPadrao: boolean;
  }[] = [
    // ⚠️ As cadeias entram **por extenso** nesta tabela, e nao pelas constantes
    // do modulo: a regra e a comparacao de bytes que o legado faz, e um caso
    // escrito sobre a constante continuaria passando se a constante mudasse. As
    // duas constantes sao conferidas contra estes mesmos bytes no fim do teste.
    {
      nome: 'tipo padrao, fora de rascunho automatico, sem categoria',
      tipoDeObjeto: 'post',
      estado: 'publish',
      recebeOPadrao: true,
    },
    {
      nome: 'tipo que nao e o padrao',
      tipoDeObjeto: 'page',
      estado: 'publish',
      recebeOPadrao: false,
    },
    {
      nome: 'em rascunho automatico',
      tipoDeObjeto: 'post',
      estado: 'auto-draft',
      recebeOPadrao: false,
    },
    {
      nome: 'com categoria informada',
      tipoDeObjeto: 'post',
      estado: 'publish',
      categorias: [12],
      recebeOPadrao: false,
    },
  ];

  for (const caso of casos) {
    const { falsa, modulo, colaboracao } = cenarioDeGravacao({
      opcoes: {
        [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA,
      },
    });
    if (caso.recebeOPadrao) {
      programarVinculoInedito(falsa, ROTULO_DA_CATEGORIA_NO_CONTEXTO);
    }

    const aplicadas = modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
      objetoId: OBJETO,
      tipoDeObjeto: caso.tipoDeObjeto,
      estado: caso.estado,
      ...(caso.categorias === undefined
        ? {}
        : { categorias: caso.categorias }),
    });

    if (!caso.recebeOPadrao) {
      // ⚠️ `page` e `attachment` nao recebem categoria padrao, e a comparacao do
      // legado e igualdade de cadeia (`'post' === $post_type`) e **nao** uma
      // consulta a `post_type_exists()`. Trocar uma pela outra alcancaria tipos
      // que o legado nao alcanca.
      assert.deepEqual(aplicadas, [], caso.nome);
      assert.deepEqual(falsa.escritas, [], caso.nome);
      continue;
    }

    // A categoria padrao, pela porta da categoria — `wp_set_post_categories()`,
    // que **nao cobra capacidade nenhuma** (`post.php:5053`), e nao pelo bloco de
    // `tax_input`, que cobra `assign_terms` (`:5105`).
    assert.deepEqual(
      aplicadas,
      [
        {
          contexto: 'category',
          rotulos: [ROTULO_PADRAO_DA_CATEGORIA],
          origem: 'termo-padrao',
          porta: 'categoria',
          resultado: {
            aplicado: true,
            rotulosNoContextoIds: [ROTULO_DA_CATEGORIA_NO_CONTEXTO],
          },
        },
      ],
      caso.nome,
    );
    assert.deepEqual(
      textos(falsa.escritas),
      ESCRITAS_DE_UM_VINCULO_INEDITO,
      caso.nome,
    );
  }

  // E a parte da regra que e um nome, nao um numero: a opcao se chama
  // `default_category`, e o `1` nao mora no codigo — ele e **dado gravado**, que
  // o instalador semeia (`BR-MIGRAR-084`). O **P6** cobra o ponto de configuracao
  // nomeado; inventar `1` como default de codigo faria o sistema novo classificar
  // em `1` numa instalacao que gravou outro identificador.
  assert.equal(OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA, 'default_category');
  assert.equal(TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO, 'post');
});
