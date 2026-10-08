/**
 * Testes de **US-3** — *"Aplicar o termo padrao do contexto quando nenhum termo e
 * informado"* —, entrega de **T007**: *"o comportamento de US-3 existe e os
 * criterios CA-3.1, CA-3.2, CA-3.3, CA-3.4 passam contra o sistema novo"*.
 *
 * O que se afirma aqui, e por que desta forma:
 *
 * 1. **A sequencia de comandos**, porque o criterio desta area e *"efeito no
 *    banco"* (area 3 da Decisao 2 de `parity_specs.md`, que compara *"snapshot +
 *    sequencia de comandos"*). Nesta historia metade dos criterios e **ausencia**
 *    de comando: CA-3.3 e um `if` que salta as leituras, e a opcao que vale `0`
 *    desiste antes de qualquer escrita. Por isso a porta de teste **registra
 *    consulta** em vez de simular banco.
 * 2. **A `@invariante`**, que `parity_specs.md` torna obrigatoria em *"todo fluxo
 *    cujo aggregate tem invariante"* — e **CA-3.4 e uma invariante**: *"ao fim de
 *    qualquer gravacao, nenhum conteudo do tipo padrao esta sem classificacao"*.
 *    Ela e exercitada estado por estado, e pelo lado negativo (o tipo que **nao** e
 *    o padrao).
 * 3. **Que o identificador gravado na juncao e o `term_taxonomy_id`**, e nunca o
 *    `term_id` que a opcao guarda. E o erro que esta historia convida a cometer,
 *    porque `default_category` guarda um `term_id`.
 *
 * ⚠️ **Nenhum destes testes e teste de paridade.** Nao existe `.feature` de
 * classificacao em `parity_tests/`, o oraculo **executavel** do legado nao existe
 * nesta arvore (`oracleAvailable: false`; levanta-lo e T001 da feature `015`) e,
 * nesta arvore de trabalho, **a instalacao do legado tambem nao esta no disco** —
 * nao ha `wp-includes/post.php` para reconferir ancora. Cada afirmacao abaixo vem
 * do pacote (`BR-MIGRAR-003`, `UC-05`, `UC-03`, `spec.md`) ou da transcricao
 * **merged** do laco da publicacao que T003 de BC-01 deixou em
 * `../../conteudo/publicacao/termo-padrao-na-publicacao.ts`. Os dois pontos que
 * ficam para quem tiver o oraculo estao no bloco 🔴 de
 * `termo-padrao-na-gravacao.ts`, e um deles tem teste com 🔴 no nome.
 *
 * ⚠️ **E nao sao os testes de `backlog/tests.md`**: os cinco casos `UT-035-1` a
 * `UT-035-5` sao **T008**, que roda em paralelo com esta tarefa e tem suite
 * propria.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ATOR_ANONIMO,
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarPortaDeDadosFalsa,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import { criarModuloDeClassificacao, type ModuloDeClassificacao } from '../index.js';
import type { Consulta, LinhaDeResultado } from '../portas/index.js';
import type {
  ColaboracaoDoVinculo,
  ConteudoNaClassificacao,
} from '../vinculo-de-objeto/index.js';
import {
  chaveDoTermoPadrao,
  OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
  PREFIXO_DA_OPCAO_DE_TERMO_PADRAO,
  SEM_TERMO_PADRAO,
  TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
} from './chave-do-termo-padrao.js';
import type {
  ColaboracaoDoTermoPadrao,
  ColaboracaoDoTermoPadraoSemAtor,
  OpcoesNaClassificacao,
} from './escopo-de-termo-padrao.js';
import { resolverTermoPadraoNaGravacao } from './termo-padrao-na-gravacao.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const OBJETO = 42;

/** O contexto que uma extensao registra, e o unico que **declara** termo padrao. */
const CONTEXTO_DE_EXTENSAO = 'resenha';

/** O rotulo que a opcao `default_category` guarda. E um `term_id`. */
const ROTULO_PADRAO_DA_CATEGORIA = 1;
/** O `term_taxonomy_id` dele em `category` — e e este que a juncao grava. */
const ROTULO_DA_CATEGORIA_NO_CONTEXTO = 5;

const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'author',
    capacidades: [{ capacidade: 'edit_posts', concedida: true }],
  },
  {
    identificador: 'subscriber',
    capacidades: [{ capacidade: 'read', concedida: true }],
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
 * A leitura de opcao por ligacao tardia, que **registra as chaves lidas**.
 *
 * E o que permite afirmar o que esta tarefa mais precisa afirmar: que a opcao
 * **nao e consultada** nos ramos em que o legado nao a consulta — em rascunho
 * automatico, e em contexto que nao declara padrao.
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

function montar(): {
  falsa: PortaDeDadosFalsa;
  modulo: ModuloDeClassificacao;
} {
  const falsa = criarPortaDeDadosFalsa();
  return { falsa, modulo: criarModuloDeClassificacao({ dados: falsa.porta }) };
}

/** O cenario completo de uma gravacao, com os tres dubles ligados. */
function cenario(
  opcoes: {
    readonly papel?: string;
    readonly atorAnonimo?: boolean;
    readonly opcoes?: Readonly<Record<string, number>>;
    readonly comContextoDeExtensao?: boolean;
  } = {},
): {
  falsa: PortaDeDadosFalsa;
  modulo: ModuloDeClassificacao;
  colaboracao: ColaboracaoDoTermoPadrao;
  chavesLidas: string[];
} {
  const { falsa, modulo } = montar();
  const leitura = opcoesDeTeste(opcoes.opcoes ?? {});

  if (opcoes.comContextoDeExtensao === true) {
    // `register_taxonomy( 'resenha', 'post', array( 'default_term' => ... ) )`:
    // o UNICO caminho por onde o laco dos demais contextos pode agir, porque
    // nenhum dos oito do nucleo declara `default_term`.
    modulo.contextos.registrar(CONTEXTO_DE_EXTENSAO, {
      tiposDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
      rotuloPadrao: 'Sem resenha',
    });
  }

  return {
    falsa,
    modulo,
    colaboracao: {
      ...conteudoDeTeste(),
      base: BASE,
      ator:
        opcoes.atorAnonimo === true ? ATOR_ANONIMO : ator(opcoes.papel ?? 'author'),
      opcoes: leitura.opcoes,
    },
    chavesLidas: leitura.chavesLidas,
  };
}

/** Uma linha da leitura fundida `SELECT t.*, tt.*` (`class-wp-term.php:132`). */
function linhaDeTermo(campos: {
  readonly term_id: number;
  readonly term_taxonomy_id: number;
  readonly taxonomy: string;
}): LinhaDeResultado {
  return {
    term_id: campos.term_id,
    term_taxonomy_id: campos.term_taxonomy_id,
    name: 'Sem categoria',
    slug: 'sem-categoria',
    taxonomy: campos.taxonomy,
    description: '',
    parent: 0,
    count: 0,
    term_group: 0,
  };
}

/** Um vinculo que o objeto ja tem, do jeito que a leitura inversa o devolve. */
interface VinculoExistente {
  readonly rotuloId: number;
  readonly rotuloNoContextoId: number;
  readonly contexto: string;
}

/**
 * Programa a leitura inversa **com os dois passos do legado**: um comando com os
 * `term_id` e, depois, a leitura fundida de cada rotulo — que e o
 * `populate_terms()` que `../vinculo-de-objeto/substituir-vinculos.ts` descreve.
 */
function programarConjunto(
  falsa: PortaDeDadosFalsa,
  vinculos: readonly VinculoExistente[],
): void {
  falsa.responder(vinculos.map((vinculo) => ({ term_id: vinculo.rotuloId })));
  for (const vinculo of vinculos) {
    falsa.responder([
      linhaDeTermo({
        term_id: vinculo.rotuloId,
        term_taxonomy_id: vinculo.rotuloNoContextoId,
        taxonomy: vinculo.contexto,
      }),
    ]);
  }
}

/** Programa **so** os `term_id` — a leitura de `fields => ids` do laco. */
function programarIdsDoObjeto(
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
    rotuloNoContextoId === null ? [] : [{ term_taxonomy_id: rotuloNoContextoId }],
  );
}

/** A resposta de `vinculos.existe`. */
function programarVinculoJaGravado(
  falsa: PortaDeDadosFalsa,
  rotuloNoContextoId: number | null,
): void {
  falsa.responder(
    rotuloNoContextoId === null ? [] : [{ term_taxonomy_id: rotuloNoContextoId }],
  );
}

/** So o texto dos comandos, para afirmar a sequencia sem repetir parametros. */
function textos(consultas: readonly Consulta[]): readonly string[] {
  return consultas.map((consulta) => consulta.texto);
}

/**
 * Programa o caminho feliz da categoria padrao: nenhum vinculo anterior, o par
 * existe, e o vinculo ainda nao esta gravado.
 */
function programarCategoriaPadraoInedita(falsa: PortaDeDadosFalsa): void {
  programarConjunto(falsa, []);
  programarPar(falsa, ROTULO_DA_CATEGORIA_NO_CONTEXTO);
  programarVinculoJaGravado(falsa, null);
}

/* ══════════════════════════════════════════════════════════════════════════
   CA-3.1 — "Conteudo gravado sem termo informado num contexto que declara
   termo padrao recebe o padrao"
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-3.1 o conteudo do tipo padrao gravado sem categoria recebe a categoria padrao', () => {
  const { falsa, modulo, colaboracao, chavesLidas } = cenario({
    opcoes: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA },
  });
  programarCategoriaPadraoInedita(falsa);

  const aplicadas = modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
    objetoId: OBJETO,
    tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
    estado: 'draft',
  });

  // `P3` / `BR-MIGRAR-003`: *"sem categoria e fora de `auto-draft`, recebe
  // `default_category`"*. A origem e a porta viajam porque cada uma corresponde a
  // um ramo diferente do legado.
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

  // Uma chave de opcao, e so uma: `category` e excecao **por nome**, e nenhum dos
  // oito contextos do nucleo declara `default_term`.
  assert.deepEqual(chavesLidas, [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]);
});

test('CA-3.1 ⚠️ a juncao grava o term_taxonomy_id, e nao o term_id que a opcao guarda (@invariante)', () => {
  const { falsa, modulo, colaboracao } = cenario({
    opcoes: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA },
  });
  programarCategoriaPadraoInedita(falsa);

  modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
    objetoId: OBJETO,
    tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
    estado: 'publish',
  });

  // E o erro que esta historia convida a cometer: `default_category` guarda um
  // `term_id` (`1`, semeado pelo instalador) e `term_relationships` referencia o
  // `term_taxonomy_id` (`5`, resolvido pela leitura do par).
  assert.deepEqual(textos(falsa.escritas), [
    'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id) VALUES (?, ?)',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
  ]);
  assert.deepEqual(falsa.escritas[0]?.parametros, [
    OBJETO,
    ROTULO_DA_CATEGORIA_NO_CONTEXTO,
  ]);
});

test('CA-3.1 a lista informada vence: nenhuma opcao e lida e nenhum comando sai', () => {
  const { falsa, modulo, colaboracao, chavesLidas } = cenario({
    opcoes: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA },
  });

  const aplicadas = modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
    objetoId: OBJETO,
    tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
    estado: 'draft',
    categorias: [12],
  });

  // O ramo e `if ( empty( $post_category ) ... )`: com lista, o laco nao age — e
  // **gravar a lista informada e de T005**, nao desta tarefa.
  assert.deepEqual(aplicadas, []);
  assert.deepEqual(chavesLidas, []);
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('CA-3.1 ⚠️ a lista informada so com vazios conta como vazia, e o padrao entra', () => {
  const { falsa, modulo, colaboracao } = cenario({
    opcoes: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA },
  });
  programarCategoriaPadraoInedita(falsa);

  // *"Filter out empty terms"*: `array_filter()` derruba `0` e a cadeia `'0'`,
  // porque `empty( '0' )` e verdadeiro em PHP. E o caminho normal da caixa de
  // categoria da tela, que envia um campo oculto com valor `0`
  // (`wp-admin/includes/meta-boxes.php:661`).
  const aplicadas = modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
    objetoId: OBJETO,
    tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
    estado: 'draft',
    categorias: [0, '0', ''],
  });

  assert.equal(aplicadas.length, 1);
  assert.deepEqual(aplicadas[0]?.rotulos, [ROTULO_PADRAO_DA_CATEGORIA]);
});

test('CA-3.1 o contexto que DECLARA termo padrao recebe o dele, pelo mapa de contextos', () => {
  const { falsa, modulo, colaboracao, chavesLidas } = cenario({
    comContextoDeExtensao: true,
    opcoes: {
      // A categoria desiste, para isolar o laco dos demais contextos.
      [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: SEM_TERMO_PADRAO,
      [`${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}${CONTEXTO_DE_EXTENSAO}`]: 9,
    },
  });

  programarIdsDoObjeto(falsa, []); // o laco: o objeto nao tem termo em `resenha`
  programarConjunto(falsa, []); // a escrita: conjunto anterior vazio
  programarPar(falsa, 21);
  programarVinculoJaGravado(falsa, null);

  const aplicadas = modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
    objetoId: OBJETO,
    tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
    estado: 'draft',
  });

  assert.deepEqual(aplicadas, [
    {
      contexto: CONTEXTO_DE_EXTENSAO,
      rotulos: [9],
      origem: 'termo-padrao',
      porta: 'mapa-de-contextos',
      resultado: { aplicado: true, rotulosNoContextoIds: [21] },
    },
  ]);

  // A ordem das chaves e a do legado: a categoria (`:4719`) antes do laco
  // (`:5062`), e dentro do laco a ordem de registro dos contextos.
  assert.deepEqual(chavesLidas, [
    OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
    `${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}${CONTEXTO_DE_EXTENSAO}`,
  ]);
});

test('CA-3.1 o contexto que NAO declara termo padrao nao e consultado', () => {
  const { falsa, modulo, colaboracao, chavesLidas } = cenario({
    opcoes: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: SEM_TERMO_PADRAO },
  });

  const aplicadas = modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
    objetoId: OBJETO,
    tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
    estado: 'draft',
  });

  // `if ( ! empty( $tax_object->default_term ) )` salta `post_tag` e
  // `post_format` **antes** de ler a juncao: nenhuma leitura sai por eles, e
  // nenhuma chave `default_term_post_tag` e consultada.
  assert.deepEqual(aplicadas, []);
  assert.deepEqual(chavesLidas, [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]);
  assert.deepEqual(falsa.selecoes, []);
});

test('CA-3.1 o conteudo que JA tem termo no contexto nao perde a classificacao, e a opcao nao e lida', () => {
  const { falsa, modulo, colaboracao, chavesLidas } = cenario({
    comContextoDeExtensao: true,
    opcoes: {
      [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: SEM_TERMO_PADRAO,
      [`${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}${CONTEXTO_DE_EXTENSAO}`]: 9,
    },
  });

  programarIdsDoObjeto(falsa, [13]); // o laco ve um termo ja atribuido
  programarConjunto(falsa, [
    { rotuloId: 13, rotuloNoContextoId: 21, contexto: CONTEXTO_DE_EXTENSAO },
  ]);
  programarPar(falsa, 21);
  programarVinculoJaGravado(falsa, 21); // ja vinculado: nao insere de novo

  const aplicadas = modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
    objetoId: OBJETO,
    tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
    estado: 'draft',
  });

  // *"Passed custom taxonomy list overwrites the existing list if not empty"*: com
  // a lista informada vazia e vinculo existente, e o conjunto existente que vale —
  // o gemeo do ramo 2 do laco da publicacao (*"Do not modify previously set
  // terms"*). A opcao **nao** e consultada.
  assert.deepEqual(aplicadas, [
    {
      contexto: CONTEXTO_DE_EXTENSAO,
      rotulos: [13],
      origem: 'vinculos-existentes',
      porta: 'mapa-de-contextos',
      resultado: { aplicado: true, rotulosNoContextoIds: [21] },
    },
  ]);
  assert.deepEqual(chavesLidas, [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]);

  // ⚠️ E **nenhum comando escreve**: o conjunto reafirmado e o mesmo, logo nao ha
  // insercao, nao ha remocao e nao ha recontagem. Trocar este ramo por "aplica o
  // padrao" apagaria o termo 13 da juncao.
  assert.deepEqual(falsa.escritas, []);
});

/* ══════════════════════════════════════════════════════════════════════════
   CA-3.2 — "A regra e aplicada de novo na publicacao, para todo contexto que
   declare padrao"
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * O laco da publicacao e de BC-01 e **esta merged**
 * (`../../conteudo/publicacao/termo-padrao-na-publicacao.ts`). O que T007 entrega
 * sao os quatro metodos que ele chama, e e isso que estes testes afirmam — a
 * forma e o comportamento de cada um, pelo contrato que BC-01 declarou em
 * `../../conteudo/publicacao/contexto-de-publicacao.ts`.
 */
function colaboracaoSemAtor(
  valores: Readonly<Record<string, number>> = {},
): { colaboracao: ColaboracaoDoTermoPadraoSemAtor; chavesLidas: string[] } {
  const leitura = opcoesDeTeste(valores);
  return {
    colaboracao: { ...conteudoDeTeste(), opcoes: leitura.opcoes },
    chavesLidas: leitura.chavesLidas,
  };
}

test('CA-3.2 a colaboracao tem exatamente os quatro metodos que BC-01 declarou', () => {
  const { modulo } = montar();
  const { colaboracao } = colaboracaoSemAtor();

  // A compatibilidade com `ClassificacaoNaPublicacao` de BC-01 e **estrutural**:
  // nao ha `import` que a declare, porque a regra de dependencia 3 o proibe
  // *"sempre, sem excecao"*. Logo os nomes sao o contrato, e este teste e o que
  // impede que uma onda futura os traduza para o vocabulario deste modulo.
  assert.deepEqual(
    Object.keys(modulo.classificacaoNaPublicacao(colaboracao)).sort(),
    ['definirTermos', 'opcaoDeTermoPadrao', 'taxonomiasDoTipo', 'termosDoConteudo'],
  );
});

test('CA-3.2 taxonomiasDoTipo devolve nome e declaraTermoPadrao na ordem de registro', () => {
  const { modulo } = montar();
  const { colaboracao } = colaboracaoSemAtor();
  modulo.contextos.registrar(CONTEXTO_DE_EXTENSAO, {
    tiposDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
    rotuloPadrao: 'Sem resenha',
  });

  const taxonomias = modulo
    .classificacaoNaPublicacao(colaboracao)
    .taxonomiasDoTipo(TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO);

  // ⚠️ `declaraTermoPadrao` e `false` em `category`, e e por isso que o ramo 1 do
  // laco de BC-01 a trata **por nome**: o padrao dela vive na opcao, nao no
  // registro. A ordem e a de insercao, e ela fixa a ordem dos comandos.
  assert.deepEqual(taxonomias, [
    { nome: 'category', declaraTermoPadrao: false },
    { nome: 'post_tag', declaraTermoPadrao: false },
    { nome: 'post_format', declaraTermoPadrao: false },
    { nome: CONTEXTO_DE_EXTENSAO, declaraTermoPadrao: true },
  ]);
});

test('CA-3.2 termosDoConteudo devolve a forma de ERRO para contexto nao registrado, e nao lista vazia', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = colaboracaoSemAtor();

  const termos = modulo
    .classificacaoNaPublicacao(colaboracao)
    .termosDoConteudo(OBJETO, 'contexto-que-ninguem-registrou');

  // `! empty( WP_Error )` e **verdadeiro** no legado, logo o laco de BC-01 trata
  // este caso como "ja tem termo" e **salta** a atribuicao. Tratar erro como "sem
  // termos" atribuiria o padrao onde o legado nao atribui, e isso e efeito no
  // banco.
  assert.deepEqual(termos, { erro: true, codigo: 'invalid_taxonomy' });
  assert.deepEqual(falsa.selecoes, []);
});

test('CA-3.2 termosDoConteudo devolve os identificadores de rotulo do objeto', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = colaboracaoSemAtor();
  programarIdsDoObjeto(falsa, [12, 13]);

  const termos = modulo
    .classificacaoNaPublicacao(colaboracao)
    .termosDoConteudo(OBJETO, 'category');

  assert.deepEqual(termos, { erro: false, termos: [12, 13] });
  assert.equal(falsa.selecoes.length, 1);
});

test('CA-3.2 opcaoDeTermoPadrao repassa a chave que BC-01 montou, sem remonta-la', () => {
  const { modulo } = montar();
  const chave = `${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}${CONTEXTO_DE_EXTENSAO}`;
  const { colaboracao, chavesLidas } = colaboracaoSemAtor({ [chave]: 9 });

  const lido = modulo.classificacaoNaPublicacao(colaboracao).opcaoDeTermoPadrao(chave);

  // A escolha entre `default_category` e `default_term_{nome}` e **regra do
  // caminho**, e quem a faz na publicacao e BC-01. Remonta-la aqui faria a escolha
  // acontecer duas vezes.
  assert.equal(lido, 9);
  assert.deepEqual(chavesLidas, [chave]);
});

test('CA-3.2 definirTermos grava a substituicao integral e descarta o retorno', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = colaboracaoSemAtor();
  programarConjunto(falsa, []);
  programarPar(falsa, ROTULO_DA_CATEGORIA_NO_CONTEXTO);
  programarVinculoJaGravado(falsa, null);

  const devolvido = modulo
    .classificacaoNaPublicacao(colaboracao)
    .definirTermos(OBJETO, [ROTULO_PADRAO_DA_CATEGORIA], 'category');

  // `wp_publish_post()` **ignora** o retorno de `wp_set_post_terms()` (`:5438`):
  // falha de atribuicao de termo nao interrompe a publicacao e nao e registrada
  // (P7). Por isso o metodo nao devolve nada.
  assert.equal(devolvido, undefined);
  assert.deepEqual(textos(falsa.escritas), [
    'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id) VALUES (?, ?)',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
  ]);
});

test('CA-3.2 a publicacao aplica o padrao SEM ator, e e por isso que a colaboracao nao tem um', () => {
  const { falsa, modulo } = montar();
  const { colaboracao } = colaboracaoSemAtor();
  programarConjunto(falsa, []);
  programarPar(falsa, ROTULO_DA_CATEGORIA_NO_CONTEXTO);
  programarVinculoJaGravado(falsa, null);

  // `wp_set_post_terms()` nao verifica capacidade nenhuma, e o nucleo a chama sem
  // ninguem autenticado — da fila agendada, inclusive. Cobrar `assign_terms` aqui
  // faria a publicacao agendada deixar de aplicar o termo padrao.
  modulo
    .classificacaoNaPublicacao(colaboracao)
    .definirTermos(OBJETO, [ROTULO_PADRAO_DA_CATEGORIA], 'category');

  assert.equal(falsa.escritas.length, 2);
});

test('CA-3.2 a chave do termo padrao concorda com a que BC-01 monta', () => {
  // As duas copias montam a chave da **mesma** linha de `options`, e a regra de
  // dependencia 3 impede que uma importe a outra. Este teste e o que mantem as
  // duas honestas: os valores estao por extenso, como em
  // `../../conteudo/publicacao/termo-padrao-na-publicacao.ts`.
  assert.equal(chaveDoTermoPadrao('category'), 'default_category');
  assert.equal(chaveDoTermoPadrao('post_tag'), 'default_term_post_tag');
  assert.equal(chaveDoTermoPadrao('resenha'), 'default_term_resenha');
  assert.equal(OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA, 'default_category');
  assert.equal(PREFIXO_DA_OPCAO_DE_TERMO_PADRAO, 'default_term_');
});

/* ══════════════════════════════════════════════════════════════════════════
   CA-3.3 — "Conteudo em rascunho automatico nao recebe o padrao: ainda nao e
   conteudo"
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-3.3 rascunho automatico nao recebe o padrao, e NENHUM comando sai', () => {
  const { falsa, modulo, colaboracao, chavesLidas } = cenario({
    comContextoDeExtensao: true,
    opcoes: {
      [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA,
      [`${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}${CONTEXTO_DE_EXTENSAO}`]: 9,
    },
  });

  const aplicadas = modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
    objetoId: OBJETO,
    tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
    estado: 'auto-draft',
  });

  // UC-05, tabela de excecoes: *"Conteudo e `auto-draft` | o termo padrao nao e
  // aplicado: o registro ainda nao e conteudo"*. No legado o `if` envolve o laco
  // **inteiro**, logo nem a juncao nem a opcao sao lidas — e e isso que distingue
  // "nao aplicou" de "aplicou e nao achou".
  assert.deepEqual(aplicadas, []);
  assert.deepEqual(chavesLidas, []);
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('CA-3.3 o estado e comparado por valor, e so `auto-draft` salta a regra', () => {
  for (const estado of ['auto-drafts', 'Auto-Draft', 'autodraft', '']) {
    const { falsa, modulo, colaboracao } = cenario({
      opcoes: {
        [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA,
      },
    });
    programarCategoriaPadraoInedita(falsa);

    const aplicadas = modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
      objetoId: OBJETO,
      tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
      estado,
    });

    // `'auto-draft' !== $post_status` e comparacao estrita de cadeia: qualquer
    // outro valor entra na regra. Um porte que normalizasse o estado (minusculas,
    // aparar, remover hifen) deixaria de aplicar o padrao onde o legado aplica.
    assert.deepEqual(
      aplicadas.map((aplicada) => aplicada.contexto),
      ['category'],
      `estado ${JSON.stringify(estado)}`,
    );
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   CA-3.4 — "Ao fim de qualquer gravacao, nenhum conteudo do tipo padrao esta
   sem classificacao"
   ══════════════════════════════════════════════════════════════════════════ */

test('CA-3.4 a invariante vale em todo estado que nao e rascunho automatico (@invariante)', () => {
  for (const estado of [
    'draft',
    'pending',
    'publish',
    'private',
    'future',
    'trash',
    'inherit',
  ]) {
    const { falsa, modulo, colaboracao } = cenario({
      opcoes: {
        [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA,
      },
    });
    programarCategoriaPadraoInedita(falsa);

    const aplicadas = modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
      objetoId: OBJETO,
      tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
      estado,
    });

    // A pos-condicao de UC-03 e literal: *"toda taxonomia com termo padrao tem ao
    // menos um termo atribuido"*, e a de UC-05: *"nenhum conteudo do tipo `post`
    // ficou sem categoria"*. O ramo do legado **nao** olha o estado alem do
    // `auto-draft`: lixeira e rascunho recebem a categoria padrao igual.
    assert.equal(aplicadas.length, 1, `estado ${estado}`);
    assert.equal(falsa.escritas.length, 2, `estado ${estado}`);
  }
});

test('CA-3.4 so o TIPO padrao: `page` e `attachment` nao recebem categoria padrao', () => {
  for (const tipo of ['page', 'attachment', 'nav_menu_item', 'link']) {
    const { falsa, modulo, colaboracao, chavesLidas } = cenario({
      opcoes: {
        [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA,
      },
    });

    const aplicadas = modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
      objetoId: OBJETO,
      tipoDeObjeto: tipo,
      estado: 'publish',
    });

    // O legado compara `'post' === $post_type`, e **nao** pergunta ao registro de
    // tipos de conteudo. Trocar a igualdade por uma consulta ao registro
    // aplicaria a categoria padrao a `page`, que o legado nao alcanca — e
    // `attachment` e o caso em que isso seria mais visivel, porque ele herda o
    // estado do pai.
    assert.deepEqual(aplicadas, [], `tipo ${tipo}`);
    assert.deepEqual(chavesLidas, [], `tipo ${tipo}`);
    assert.deepEqual(falsa.selecoes, [], `tipo ${tipo}`);
  }
});

test('CA-3.4 🔴 a opcao que vale 0 faz a regra DESISTIR, e nao apagar a classificacao', () => {
  const { falsa, modulo, colaboracao, chavesLidas } = cenario({
    opcoes: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: SEM_TERMO_PADRAO },
  });

  const aplicadas = modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
    objetoId: OBJETO,
    tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
    estado: 'publish',
  });

  /*
   * 🔴 **Este e o ponto (a) do bloco de limites de `termo-padrao-na-gravacao.ts`,
   * e o teste existe para que ele nao passe em silencio.** O ramo 4 do laco da
   * publicacao desiste quando a opcao vale `0` (`post.php:5436`-`:5437`,
   * transcrito por T003 de BC-01), e esta tarefa aplica a mesma leitura ao
   * caminho de gravacao — cuja linha (`:4719`) **nao e legivel nesta arvore**.
   *
   * A alternativa — aplicar `[0]` sem testar — faria a substituicao integral
   * resolver `0` como identificador inexistente e **remover todos** os vinculos de
   * `category` daquele conteudo, que e o oposto de CA-3.4. A tabela *Nao
   * negociavel* da constituicao poe *"apagar dado, ou declarar restricao no
   * armazenamento que mude a cascata observavel"* fora do alcance do agente.
   *
   * Quem tiver o oraculo confere `wp-includes/post.php:4719` e, se o legado nao
   * testar a opcao, troca este teste pelo oposto — com a referencia da decisao no
   * codigo, como o **P1** exige.
   */
  assert.deepEqual(aplicadas, []);
  assert.deepEqual(chavesLidas, [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]);
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

/* ══════════════════════════════════════════════════════════════════════════
   A ASSIMETRIA DE CAPACIDADE ENTRE AS DUAS PORTAS, que e o que explica
   por que CA-3.2 existe
   ══════════════════════════════════════════════════════════════════════════ */

test('a categoria padrao e aplicada sem capacidade nenhuma, inclusive ao ator anonimo', () => {
  const { falsa, modulo, colaboracao } = cenario({
    atorAnonimo: true,
    opcoes: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA },
  });
  programarCategoriaPadraoInedita(falsa);

  const aplicadas = modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
    objetoId: OBJETO,
    tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
    estado: 'publish',
  });

  // `wp_set_post_categories()` nao tem `current_user_can` no corpo
  // (`post.php:5053`), e e por ela que a categoria padrao passa. Pedir capacidade
  // aqui recusaria o que o legado aceita (P1).
  assert.deepEqual(aplicadas[0]?.resultado, {
    aplicado: true,
    rotulosNoContextoIds: [ROTULO_DA_CATEGORIA_NO_CONTEXTO],
  });
});

test('o termo padrao do mapa de contextos e recusado EM SILENCIO sem assign_terms', () => {
  const { falsa, modulo, colaboracao } = cenario({
    papel: 'subscriber',
    comContextoDeExtensao: true,
    opcoes: {
      [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: SEM_TERMO_PADRAO,
      [`${PREFIXO_DA_OPCAO_DE_TERMO_PADRAO}${CONTEXTO_DE_EXTENSAO}`]: 9,
    },
  });
  programarIdsDoObjeto(falsa, []);

  const aplicadas = modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
    objetoId: OBJETO,
    tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
    estado: 'draft',
  });

  // O bloco de `tax_input` cobra `$tax->cap->assign_terms` (`post.php:5105`) e,
  // sem ela, **nao chama a atribuicao** — sem mensagem, sem excecao e sem registro
  // (P7). O motivo viaja no resultado so para que o caso seja afirmavel, e nenhum
  // ramo do fluxo o consulta.
  assert.deepEqual(aplicadas, [
    {
      contexto: CONTEXTO_DE_EXTENSAO,
      rotulos: [9],
      origem: 'termo-padrao',
      porta: 'mapa-de-contextos',
      resultado: { aplicado: false, motivo: 'sem-capacidade-de-atribuir' },
    },
  ]);
  assert.deepEqual(falsa.escritas, []);

  // ⚠️ E e **este** caso que o laco da publicacao apanha depois: ele roda sem
  // ator, logo o padrao que a gravacao recusou entra na publicacao. E a razao de
  // CA-3.2 existir como criterio separado de CA-3.1.
});

test('a categoria padrao passa pelo portao do TIPO DE OBJETO, e a recusa e silenciosa (CA-2.4)', () => {
  const { falsa, modulo, colaboracao } = cenario({
    opcoes: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA },
  });

  // Uma extensao redeclara `category` sem `post` entre os tipos de objeto —
  // `register_taxonomy()` **substitui** o anterior, como o legado faz.
  modulo.contextos.registrar('category', { tiposDeObjeto: 'page' });

  const aplicadas = modulo.aplicarTermoPadraoNaGravacao(colaboracao, {
    objetoId: OBJETO,
    tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
    estado: 'publish',
  });

  // O legado resolve `$post_category` em `:4719` e so cobra
  // `is_object_in_taxonomy( $post_type, 'category' )` em `:5053`, na hora de
  // gravar. As duas consequencias sao visiveis aqui: **a opcao e lida mesmo
  // assim**, e **nenhum comando sai**.
  assert.deepEqual(aplicadas, [
    {
      contexto: 'category',
      rotulos: [ROTULO_PADRAO_DA_CATEGORIA],
      origem: 'termo-padrao',
      porta: 'categoria',
      resultado: { aplicado: false, motivo: 'tipo-de-objeto-nao-declarado' },
    },
  ]);
  assert.deepEqual(falsa.selecoes, []);
  assert.deepEqual(falsa.escritas, []);
});

test('o laco decide a lista e NAO grava: e por isso que T007 entrega duas funcoes', () => {
  const { falsa, modulo, colaboracao } = cenario({
    opcoes: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO_DA_CATEGORIA },
  });

  // No legado o laco **nao grava**: ele reescreve `$post_category` e
  // `$postarr['tax_input']`, e a escrita acontece nos dois blocos que T005 portou
  // (`post.php:5053` e `:5089`). `resolverTermoPadraoNaGravacao` e esse laco, e e
  // o que um chamador que monte a propria gravacao usa — como `wp_insert_post()`
  // faz. O escopo e o de US-2, de proposito: ver `escopo-de-termo-padrao.ts`.
  const decididas = resolverTermoPadraoNaGravacao(
    { contextos: modulo.contextos, armazenamento: modulo.armazenamento },
    colaboracao,
    {
      objetoId: OBJETO,
      tipoDeObjeto: TIPO_DE_OBJETO_DO_CONTEUDO_PADRAO,
      estado: 'publish',
    },
  );

  assert.deepEqual(decididas, [
    {
      contexto: 'category',
      rotulos: [ROTULO_PADRAO_DA_CATEGORIA],
      origem: 'termo-padrao',
      porta: 'categoria',
    },
  ]);
  assert.deepEqual(falsa.escritas, []);
  assert.deepEqual(falsa.selecoes, []);
});
