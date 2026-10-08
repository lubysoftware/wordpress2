/**
 * A entrega de **T010**: *"7 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-036-1, UT-036-2, UT-036-3, UT-036-4, UT-036-5,
 * UT-036-6, UT-036-7), com o mesmo dado de entrada, acao e resultado esperado. Os
 * 2 testes de regra de negocio (UT-036-6, UT-036-7) entram na mesma suite."*
 *
 * ---
 *
 * # Os sete casos sao TRANSCRITOS, nao reconstruidos
 *
 * O catalogo esta no disco: o caminho `../../../backlog/tests.md` que `tasks.md`
 * cita resolve para `backlog/tests.md` na raiz do repositorio, e a secao `REQ-036`
 * tem os sete casos com nome, tipo e prova. Esta suite **copia** os sete, um
 * `test()` por caso, na ordem do catalogo, com o nome do caso no nome do teste —
 * o mesmo arranjo de `../termo-padrao/ut-035-termo-padrao-do-contexto.test.ts` e
 * de `../rotulo-e-contexto/ut-033-separacao-entre-rotulo-e-contexto.test.ts`.
 *
 * | caso | nome no catalogo | tipo | prova (coluna `Prova`) |
 * |---|---|---|---|
 * | `UT-036-1` | *"recusa a gestão do contexto a quem não tem a capacidade declarada por ele"* | `erro` | CA-4.1 — *"A tela exige a capacidade que o contexto declara para gerenciá-lo"* |
 * | `UT-036-2` | *"aceita termo pai em contexto hierárquico e recusa hierarquia em contexto plano"* | `erro` | CA-4.2 — *"Contexto hierárquico aceita termo pai e mantém a árvore; contexto plano recusa hierarquia"* |
 * | `UT-036-3` | *"remove o vínculo e preserva o conteúdo ao apagar termo em uso"* | `feliz` | CA-4.3 — *"Apagar um termo em uso remove o vínculo e não apaga o conteúdo"* |
 * | `UT-036-4` | *"atribui o padrão ao conteúdo que ficou sem termo algum no contexto"* | `feliz` | CA-4.4 — *"Conteúdo que fica sem termo algum num contexto com padrão recebe o padrão"* |
 * | `UT-036-5` | *"deixa a contagem de uso correta nos termos afetados pela operação"* | `feliz` | CA-4.5 — *"A contagem de uso dos termos afetados fica correta ao fim da operação"* |
 * | `UT-036-6` | *"trata o desaparecimento do termo como o seu único estado possível"* | `borda` | regra — *"`terms` não tem coluna de estado: o estado de um termo é a existência dele"* |
 * | `UT-036-7` | *"resolve os cinco nomes de capacidade de taxonomia na mesma capacidade real"* | `feliz` | regra — *"Cinco nomes de capacidade de taxonomia resolvem todos para a mesma capacidade real"* |
 *
 * Nenhum caso foi acrescentado e nenhum foi desdobrado em dois: sao **sete**
 * `test()`, e o que cada um afirma e o que a coluna `Prova` do caso diz. As duas
 * regras de negocio sao as duas que `spec.md` lista em US-4, palavra por palavra,
 * e UC-08 as repete em *Regras de negocio aplicadas* com a secao de origem de cada
 * uma (`state-machines.md` §10 e `permissions.md` §5.4).
 *
 * # Nao sao os testes de criterio de T009
 *
 * T009 entrega *"o comportamento de US-4 existe e os criterios CA-4.1, CA-4.2,
 * CA-4.3, CA-4.4, CA-4.5 passam contra o sistema novo"*, e tem a suite dela ao
 * lado, em `./us-4-manutencao-da-lista.test.ts`: 20 testes que percorrem os tres
 * portoes da tela na ordem do legado, a sequencia que **insere antes de
 * perguntar** e o desfazimento dela, os dez passos da cascata, `DB-TRG3` nos dois
 * sentidos e os tres pontos 🔴 que o pacote nao especifica. Esta suite e o
 * **catalogo**: sete casos, um por linha de `REQ-036`, cada um com o dado de
 * entrada e o resultado que o caso descreve, e nada mais. As duas afirmam a mesma
 * regra por recortes diferentes de proposito, e a suite de T009 diz isso por
 * escrito — *"os sete casos `UT-036-1` a `UT-036-7` sao **T010**, que roda em
 * paralelo com esta tarefa e tem suite propria"*.
 *
 * **T010 depende de T009** (`tasks.md`: *"depende de: T009"*), e por isso esta
 * suite chama as operacoes de `./`: numa arvore sem T009 ela nao compila, que e o
 * que a dependencia declarada significa. O `[P]` de T010 — *"tarefa de teste, que
 * toca so a propria suite"* — e honrado ao pe da letra: **este arquivo e o unico
 * tocado por esta tarefa**, nem `./index.ts` nem `../index.ts` nem `../README.md`
 * mudaram.
 *
 * # Por que a exclusao entra por `apagarRotuloDoContexto` e nao pelo modulo
 *
 * Porque ela **nao esta na superficie do modulo**, e a ausencia e de proposito:
 * `./apagar-rotulo-do-contexto.ts` faz a cascata de US-4 e **nao** cobra a
 * protecao do termo padrao, que e `CA-5.1` e `CA-5.2` de **T011**. Publica-la
 * antes de T011 publicaria um caminho que apaga a categoria padrao de um
 * contexto, e a tabela *Nao negociavel* da constituicao poe *"apagar dado"* fora
 * do alcance do agente. Esta suite chama a funcao exportada, como a de T009 faz,
 * e **nao** altera essa decisao.
 *
 * # Como estes sete testes se conferem por `parity_specs.md`
 *
 * O criterio de aceite desta area e **efeito no banco** (area 3 da Decisao 2, que
 * compara *"snapshot + sequencia de comandos"*, com *"zero divergencia"*), e por
 * isso a porta de teste **registra consulta** em vez de simular banco
 * (`../armazenamento/porta-falsa.ts`). Cada caso afirma, quando o caso tem
 * escrita, **qual comando sai, com quais parametros e em que ordem** — e tambem,
 * onde isso e a regra, que **nenhum comando sai**: `UT-036-1` e inteiro uma
 * ausencia de comando.
 *
 * ⚠️ **E ha cenario de paridade para estes casos, o que os arquivos de T009 nao
 * disseram.** Eles registraram que *"nao existe `.feature` de classificacao em
 * `parity_tests/`"*, e isso continua verdade — nenhum arquivo daquela pasta leva o
 * nome desta feature. Mas **dois arquivos de la tem cenario de termo**, e e por
 * eles que este trabalho se confere:
 *
 * | caso | cenario de paridade | arquivo e linha |
 * |---|---|---|
 * | `UT-036-3`, `UT-036-4` | *"Apagar um termo devolve o objeto ao termo padrão, se aquele era o único"*, com a clausula *"Mas um conteúdo vinculado a dois termos da mesma taxonomia não recebe o padrão"* — `@paridade @critico @invariante @cascata` | `parity_tests/03-exclusao-de-conteudo-em-sete-etapas.feature:80` |
 * | `UT-036-5` | *"Os três contadores desnormalizados chegam ao mesmo valor, e um deles tem dois critérios"* — `@paridade @critico @cascata` | idem, `:71` |
 * | `UT-036-6` | *"As quatro entidades sem máquina de estado continuam sem nenhuma"*: *"Quando o modelo de contas, de **termos**, de opções e de links é inspecionado / Então nenhuma das quatro tem coluna de estado com conjunto fechado de valores"* — `@paridade @invariante` | `parity_tests/19-maquinas-de-estado-e-changeset.feature:81` |
 * | `UT-036-1` | nenhum cenario de fluxo: a tela e `SCR-044 lista-de-termos`, **tela critica** em modo modernizado, e cai em `@paridade-contrato-de-tela` | `target_screens.md:4227` |
 * | `UT-036-2`, `UT-036-7` | nenhum cenario proprio. `DB-TRG3` em `PT-003` e o reparenteamento **no apagar**, nao a coluna escrita na criacao; `PERM-6` e regra de autorizacao e `PT-003` nao a cobre | — |
 *
 * `PT-003` e o arquivo que cobre esta historia sem levar o nome dela: o cabecalho
 * dele declara `casos_de_uso: UC-09, UC-10, UC-11, **UC-08**`,
 * `aggregate: AGG-Conteudo · **AGG-Termo**` e
 * `target_architecture: BC-01 Conteúdo · **BC-02 Classificação**`. E ele tem
 * ainda o cenario `@composicao` que descreve **o metodo desta suite**: *"A
 * sequência é equivalente com a porta de dados substituída por duplo / Dado a
 * cascata exercitada com a porta de dados substituída por duplo que registra cada
 * comando / Então a sequência de comandos registrada é idêntica à do oráculo"*
 * (`:113`).
 *
 * # 🔴 E NENHUM TESTE AQUI E DE PARIDADE, porque falta a outra metade
 *
 * Os cenarios acima comparam **duas metades**, e a segunda nao existe nesta
 * arvore: o oraculo executavel do legado nao esta de pe (`oracleAvailable: false`
 * em `.specify/migration/.state.json`; levanta-lo e T001 da feature
 * `015-plataforma-transversal`) e, nesta arvore de trabalho, **a instalacao do
 * legado tambem nao esta no disco** — nao ha `wp-admin/edit-tags.php` nem
 * `wp-includes/taxonomy.php` para abrir. Logo cada `arquivo:linha` citado abaixo
 * vem do pacote (`backlog/tests.md`, `spec.md`, `UC-08`, `BR-MIGRAR-079`,
 * `BR-MIGRAR-080`, `BR-MIGRAR-092`, `target_screens.md`, `parity_tests/`) ou da
 * transcricao **merged** de T002, T003, T005, T007 e T009 — **nenhum vem de
 * memoria, e nenhum foi reconferido**. O que estes sete testes afirmam e
 * *"identico ao que o pacote descreve"*, e nao *"identico ao que o legado
 * executa"*; a segunda afirmacao e de quem tiver o oraculo.
 *
 * Os cinco `msgid` que `UT-036-1` compara byte a byte **foram** reconferidos
 * contra o pacote: a tabela *Mensagens literais* de `SCR-044` em
 * `target_screens.md:4300`-`:4305` lista os cinco com a linha de cada um, e
 * `EC-05` fixa que *"o `msgid` em ingles **E** a chave do catalogo"*.
 *
 * # ⚠️ UT-036-2 E DO TIPO `erro` E A OPERACAO NAO DEVOLVE ERRO, e isso nao e
 * conflito
 *
 * O catalogo classifica `UT-036-2` como `erro`, e a secao 1.1 define o tipo como
 * *"entrada invalida, permissao ausente, dependencia indisponivel"* — informar pai
 * num contexto plano e entrada invalida, e a classificacao e dessa natureza. O que
 * o tipo **nao** diz e qual a reacao do sistema, e ha precedente no proprio
 * catalogo: `UT-034-2` tambem e `erro` e o comportamento dele e
 * *"**ignora** o rotulo desconhecido ... sem criar nada"*, uma recusa silenciosa
 * que `../vinculo-de-objeto/ut-034-classificar-conteudo-com-termos.test.ts`
 * afirma como ausencia de comando.
 *
 * 🔴 **E a pergunta de verdade ja esta aberta e registrada, por T009**: as quatro
 * fontes do pacote (`spec.md` CA-4.2, a coluna de erros de `plan.md`, UC-08
 * *Fluxos alternativos* e `../armazenamento/rotulo-no-contexto.ts`) concordam no
 * **efeito no banco** — toda linha de contexto plano tem `parent = 0` — e
 * **nenhuma diz se o chamador recebe erro ou se o pai e descartado**. T009
 * descartou o pai, com tres razoes escritas no bloco 🔴 de
 * `./hierarquia-do-rotulo.ts`, e deixou teste com 🔴 no nome para que a troca nao
 * passe em silencio. **Esta tarefa nao reabre nem fecha essa pergunta**: ela
 * transcreve o caso afirmando o que as quatro fontes afirmam — o efeito no banco —
 * e marca o que continua aberto.
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
import { ddlDoArmazenamentoDeClassificacao } from '../armazenamento/index.js';
import {
  criarPortaDeDadosFalsa,
  type PortaDeDadosFalsa,
} from '../armazenamento/porta-falsa.js';
import {
  criarModuloDeClassificacao,
  type ModuloDeClassificacao,
} from '../index.js';
import type { Consulta, LinhaDeResultado } from '../portas/index.js';
import {
  CONTEXTO_DE_CATEGORIA,
  CONTEXTO_DE_CATEGORIA_DE_LINK,
  CONTEXTO_DE_ETIQUETA,
} from '../registro/index.js';
import {
  OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
  SEM_TERMO_PADRAO,
  type OpcoesNaClassificacao,
} from '../termo-padrao/index.js';
import type {
  ColaboracaoDoVinculo,
  ConteudoNaClassificacao,
} from '../vinculo-de-objeto/index.js';
import { apagarRotuloDoContexto } from './apagar-rotulo-do-contexto.js';
import {
  CAPACIDADES_DE_GESTAO_DE_ROTULO,
  CAPACIDADE_DE_APAGAR_CATEGORIAS,
  CAPACIDADE_DE_APAGAR_ETIQUETAS,
  CAPACIDADE_DE_EDITAR_CATEGORIAS,
  CAPACIDADE_DE_EDITAR_ETIQUETAS,
  CAPACIDADE_DE_GERENCIAR_CLASSIFICACAO,
  CAPACIDADE_DE_GERENCIAR_ETIQUETAS,
  casoDeGestaoDeRotulo,
} from './caso-de-gestao-de-rotulo.js';
import type {
  ColaboracaoDaExclusaoDeRotulo,
  ColaboracaoDaGestaoDaLista,
} from './escopo-de-manutencao-da-lista.js';
import { MENSAGENS_DA_TELA_DE_ROTULOS } from './permissao-na-gestao-de-rotulos.js';

/* ── O DADO DE ENTRADA DOS SETE CASOS ───────────────────────────────────────
   Os identificadores sao os mesmos papeis que o catalogo descreve em prosa: um
   rotulo em uso, um objeto que o usa, um segundo rotulo do mesmo objeto, o
   rotulo que a opcao guarda como padrao e um pai. Cada constante aparece em
   `terms.term_id` **ou** em `term_taxonomy.term_taxonomy_id`, e a diferenca
   entre as duas e a propria pegadinha desta historia — por isso elas tem nomes
   diferentes. */

/** O objeto classificado. "Objeto", nao "conteudo": a coluna e polimorfica. */
const OBJETO = 42;

/** O rotulo que esta sendo apagado, e o `term_taxonomy_id` dele em `category`. */
const ROTULO = 12;
const ROTULO_NO_CONTEXTO = 30;

/** Um segundo rotulo do mesmo objeto, para o ramo *"perde so aquele termo"*. */
const OUTRO_ROTULO = 99;
const OUTRO_ROTULO_NO_CONTEXTO = 31;

/** O rotulo que a opcao `default_category` guarda. E um `term_id`. */
const ROTULO_PADRAO = 1;
/** O `term_taxonomy_id` dele em `category` — e e este que a juncao grava. */
const ROTULO_PADRAO_NO_CONTEXTO = 5;

/**
 * O pai informado em `UT-036-2`, e o **avo** dos filhos em `DB-TRG3`.
 *
 * E diferente do `idGerado` que a porta falsa devolve (`7`) de proposito: na
 * criacao o rotulo novo recebe `7`, e um pai `7` esconderia qual dos dois valores
 * foi gravado na coluna `parent`.
 */
const ROTULO_PAI = 3;

/**
 * A matriz de papeis, com os tres atores que esta historia distingue.
 *
 * ⚠️ **E fixture, nao a matriz de fabrica.** Ela existe para separar tres
 * respostas, e so as capacidades que os casos precisam estao nela:
 * `manage_categories` so no primeiro papel, `manage_links` so no segundo, e
 * **nenhum papel tem `manage_post_tags`** — que e o fato de que `PERM-6` depende,
 * porque esse nome nao e primitivo e nao esta em papel algum. Quem afirma a
 * matriz de fabrica e a feature `001` (P3); aqui ela e dado de entrada.
 */
const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'editor',
    capacidades: [
      { capacidade: CAPACIDADE_DE_GERENCIAR_CLASSIFICACAO, concedida: true },
      { capacidade: 'edit_posts', concedida: true },
    ],
  },
  {
    identificador: 'gestor-de-links',
    capacidades: [{ capacidade: 'manage_links', concedida: true }],
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

/**
 * Um ator com um papel.
 *
 * O papel chega como **concessao individual com o nome do papel**, que e a forma
 * do legado: `{site}capabilities` guarda o nome do papel como chave, e a fusao
 * acontece na leitura das capacidades do ator.
 */
function ator(papel: string, contaId = 7): AtorDeAutorizacao {
  return {
    contaId,
    login: papel,
    existe: true,
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

/** A colaboracao com BC-01, que no alvo e `posts` e aqui registra as chamadas. */
function conteudoDeTeste(): {
  colaboracao: ColaboracaoDoVinculo;
  contagensPedidas: number[];
} {
  const contagensPedidas: number[] = [];
  const conteudo: ConteudoNaClassificacao = {
    tipoDeConteudoEhRegistrado: (tipo) =>
      ['post', 'page', 'attachment'].includes(tipo),
    contarConteudoPublicado: (rotuloNoContextoId) => {
      contagensPedidas.push(rotuloNoContextoId);
      return 0;
    },
    contarAnexosPublicados: () => 0,
  };
  return { colaboracao: { conteudo }, contagensPedidas };
}

/** A leitura de opcao por ligacao tardia, que **registra as chaves lidas**. */
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

/** O cenario da cascata, com os dois dubles de fora do contexto ligados. */
function cenarioDeExclusao(opcoes: Readonly<Record<string, number>> = {}): {
  falsa: PortaDeDadosFalsa;
  modulo: ModuloDeClassificacao;
  colaboracao: ColaboracaoDaExclusaoDeRotulo;
  chavesLidas: string[];
  contagensPedidas: number[];
} {
  const { falsa, modulo } = montar();
  const leitura = opcoesDeTeste(opcoes);
  const conteudo = conteudoDeTeste();

  return {
    falsa,
    modulo,
    colaboracao: { ...conteudo.colaboracao, opcoes: leitura.opcoes },
    chavesLidas: leitura.chavesLidas,
    contagensPedidas: conteudo.contagensPedidas,
  };
}

/** A colaboracao de CA-4.1: so a base e o ator, sem `conteudo` e sem `opcoes`. */
function cenarioDeTela(papel?: string): {
  falsa: PortaDeDadosFalsa;
  modulo: ModuloDeClassificacao;
  colaboracao: ColaboracaoDaGestaoDaLista;
} {
  const { falsa, modulo } = montar();
  return {
    falsa,
    modulo,
    colaboracao: {
      base: BASE,
      ator: papel === undefined ? ATOR_ANONIMO : ator(papel),
    },
  };
}

/**
 * Uma linha da leitura fundida `SELECT t.*, tt.*`, com as nove colunas que o
 * nucleo conhece.
 */
function linhaDeTermo(campos: {
  readonly term_id: number;
  readonly term_taxonomy_id: number;
  readonly taxonomy: string;
  readonly name?: string;
  readonly parent?: number;
}): LinhaDeResultado {
  return {
    term_id: campos.term_id,
    term_taxonomy_id: campos.term_taxonomy_id,
    name: campos.name ?? 'Noticias',
    slug: 'noticias',
    taxonomy: campos.taxonomy,
    description: '',
    parent: campos.parent ?? 0,
    count: 0,
    term_group: 0,
  };
}

/** A resposta de `idDoRotuloNoContexto` e de `vinculos.existe`: o par, ou nada. */
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

/** A resposta de qualquer leitura que devolve uma coluna de `term_id`. */
function programarRotulos(
  falsa: PortaDeDadosFalsa,
  rotuloIds: readonly number[],
): void {
  falsa.responder(rotuloIds.map((term_id) => ({ term_id })));
}

/** So o texto dos comandos, para afirmar a sequencia sem repetir parametros. */
function textos(consultas: readonly Consulta[]): readonly string[] {
  return consultas.map((consulta) => consulta.texto);
}

/**
 * Programa a cascata de exclusao de {@link ROTULO} em `category`, do inicio ao
 * fim, para um objeto so.
 *
 * A ordem das respostas e a ordem das leituras, e ela **e** a sequencia que o
 * legado emite — por isso este helper e um por um, e nao um mapa: trocar duas
 * linhas aqui muda o que se esta afirmando.
 */
function programarCascata(
  falsa: PortaDeDadosFalsa,
  cenario: {
    /** Os rotulos que o objeto tem naquele contexto, em `term_id`. */
    readonly rotulosDoObjeto: readonly number[];
    /** O par que a substituicao resolve para o rotulo informado, se houver. */
    readonly rotuloInformadoNoContexto?: number;
    /** Se o vinculo informado ja estava gravado. */
    readonly vinculoJaGravado?: boolean;
    /** Os filhos que a leitura de `:2121` devolve. */
    readonly filhos?: readonly LinhaDeResultado[];
  },
): void {
  const linhaDoRotulo = linhaDeTermo({
    term_id: ROTULO,
    term_taxonomy_id: ROTULO_NO_CONTEXTO,
    taxonomy: CONTEXTO_DE_CATEGORIA,
    parent: ROTULO_PAI,
  });

  // 1. `get_term()` — a resolucao do par (passo 1 da cascata).
  falsa.responder([linhaDoRotulo]);
  // 2. os filhos (`:2121`), que **nao** filtram por contexto.
  falsa.responder(cenario.filhos ?? []);
  // 3. os objetos vinculados (`:2152`).
  falsa.responder([{ object_id: OBJETO }]);
  // 4. os rotulos que o objeto tem naquele contexto.
  programarRotulos(falsa, cenario.rotulosDoObjeto);

  // 5. dentro de `wp_set_object_terms()`: o conjunto anterior, em dois passos.
  programarRotulos(falsa, cenario.rotulosDoObjeto);
  for (const rotuloId of cenario.rotulosDoObjeto) {
    falsa.responder([
      linhaDeTermo({
        term_id: rotuloId,
        term_taxonomy_id:
          rotuloId === ROTULO ? ROTULO_NO_CONTEXTO : OUTRO_ROTULO_NO_CONTEXTO,
        taxonomy: CONTEXTO_DE_CATEGORIA,
        parent: ROTULO_PAI,
      }),
    ]);
  }

  // 6. a resolucao do rotulo informado, e a leitura do vinculo existente.
  if (cenario.rotuloInformadoNoContexto !== undefined) {
    programarPar(falsa, cenario.rotuloInformadoNoContexto);
    programarPar(
      falsa,
      cenario.vinculoJaGravado === true
        ? cenario.rotuloInformadoNoContexto
        : null,
    );
  }

  // 7. a volta de `term_taxonomy_id` para `term_id` da remocao (`:2954`), e a
  //    resolucao do par de cada um dentro de `wp_remove_object_terms()`.
  programarRotulos(falsa, [ROTULO]);
  programarPar(falsa, ROTULO_NO_CONTEXTO);

  // 8. o trecho final de T003: a leitura do par, e a contagem de contextos.
  falsa.responder([linhaDoRotulo]);
  falsa.responder([{ 'COUNT(*)': 0 }]);
}

/* ══════════════════════════════════════════════════════════════════════════
   UT-036-1 `erro` — "recusa a gestao do contexto a quem nao tem a capacidade
   declarada por ele"

   Prova (CA-4.1): "A tela exige a capacidade que o contexto declara para
   gerencia-lo"
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-036-1 recusa a gestao do contexto a quem nao tem a capacidade declarada por ele (CA-4.1)', () => {
  const semPoder = cenarioDeTela('subscriber');

  const recusado = semPoder.modulo.permissaoDeGerenciarRotulos(
    semPoder.colaboracao,
    CONTEXTO_DE_CATEGORIA,
  );

  // Os dois `msgid` que o legado emite juntos, byte a byte da tabela
  // *Mensagens literais* de `SCR-044` (`target_screens.md:4302` e `:4303`,
  // `wp-admin/edit-tags.php:28` e `:29`).
  assert.deepEqual(recusado, {
    permitido: false,
    recusa: {
      motivo: 'sem-capacidade-de-gerenciar',
      mensagem: 'Sorry, you are not allowed to manage terms in this taxonomy.',
      titulo: 'You need a higher level of permission.',
    },
  });

  // UC-08, *Excecoes*: a recusa e *"antes de tocar qualquer registro"*.
  assert.deepEqual(semPoder.falsa.selecoes, []);
  assert.deepEqual(semPoder.falsa.escritas, []);

  // E o anonimo e recusado como qualquer outro: nao ha caminho sem capacidade.
  const anonimo = cenarioDeTela();
  assert.equal(
    anonimo.modulo.permissaoDeGerenciarRotulos(
      anonimo.colaboracao,
      CONTEXTO_DE_CATEGORIA,
    ).permitido,
    false,
  );

  // ⚠️ **"a capacidade declarada por ele"**: o portao pergunta o nome que o
  // contexto declara em `manage_terms`, e os oito do nucleo nao declaram o mesmo.
  // `category` pede `manage_categories` e `link_category` pede `manage_links`,
  // as duas primitivas e as duas em papeis diferentes desta matriz — logo o
  // **mesmo** ator e aceito num e recusado no outro, nos dois sentidos.
  const comCategorias = cenarioDeTela('editor');
  const comLinks = cenarioDeTela('gestor-de-links');

  assert.equal(
    comCategorias.modulo.contextos.obter(CONTEXTO_DE_CATEGORIA)?.capacidades
      .gerenciarRotulos,
    'manage_categories',
  );
  assert.equal(
    comCategorias.modulo.contextos.obter(CONTEXTO_DE_CATEGORIA_DE_LINK)
      ?.capacidades.gerenciarRotulos,
    'manage_links',
  );

  assert.equal(
    comCategorias.modulo.permissaoDeGerenciarRotulos(
      comCategorias.colaboracao,
      CONTEXTO_DE_CATEGORIA,
    ).permitido,
    true,
  );
  assert.deepEqual(
    comCategorias.modulo.permissaoDeGerenciarRotulos(
      comCategorias.colaboracao,
      CONTEXTO_DE_CATEGORIA_DE_LINK,
    ),
    {
      permitido: false,
      recusa: {
        motivo: 'sem-capacidade-de-gerenciar',
        mensagem: MENSAGENS_DA_TELA_DE_ROTULOS.semCapacidadeDeGerenciar,
        titulo: MENSAGENS_DA_TELA_DE_ROTULOS.tituloDaRecusaDeCapacidade,
      },
    },
  );

  assert.equal(
    comLinks.modulo.permissaoDeGerenciarRotulos(
      comLinks.colaboracao,
      CONTEXTO_DE_CATEGORIA_DE_LINK,
    ).permitido,
    true,
  );
  assert.equal(
    comLinks.modulo.permissaoDeGerenciarRotulos(
      comLinks.colaboracao,
      CONTEXTO_DE_CATEGORIA,
    ).permitido,
    false,
  );

  // E nenhuma das seis perguntas tocou o banco.
  for (const cenario of [comCategorias, comLinks]) {
    assert.deepEqual(cenario.falsa.selecoes, []);
    assert.deepEqual(cenario.falsa.escritas, []);
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-036-2 `erro` — "aceita termo pai em contexto hierarquico e recusa
   hierarquia em contexto plano"

   Prova (CA-4.2): "Contexto hierarquico aceita termo pai e mantem a arvore;
   contexto plano recusa hierarquia"
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-036-2 aceita termo pai em contexto hierarquico e recusa hierarquia em contexto plano (CA-4.2)', () => {
  // Dos oito contextos do nucleo **so `category` e hierarquico**
  // (`../registro/contextos-do-nucleo.ts`), e UC-08 fecha a outra metade:
  // *"Tags nao tem hierarquia e nao tem termo padrao"*.
  const registro = montar().modulo.contextos;
  assert.equal(registro.obter(CONTEXTO_DE_CATEGORIA)?.hierarquico, true);
  assert.equal(registro.obter(CONTEXTO_DE_ETIQUETA)?.hierarquico, false);

  /* 1. O contexto hierarquico **aceita** o pai, na criacao, e a arvore e
        `term_taxonomy.parent` — UC-08, *Taxonomia hierarquica*: *"Sistema aceita
        o termo pai e mantem a arvore em `term_taxonomy.parent`"*. */
  const criacaoHierarquica = montar();
  programarPar(criacaoHierarquica.falsa, null);
  criacaoHierarquica.falsa.responder([]);

  criacaoHierarquica.modulo.criarRotuloNoContexto({
    contexto: CONTEXTO_DE_CATEGORIA,
    nome: 'Resenhas',
    slug: 'resenhas',
    rotuloPaiId: ROTULO_PAI,
  });

  assert.deepEqual(criacaoHierarquica.falsa.escritas[1], {
    texto:
      'INSERT INTO wp_term_taxonomy (term_id, taxonomy, description, parent, count) ' +
      'VALUES (?, ?, ?, ?, ?)',
    parametros: [7, CONTEXTO_DE_CATEGORIA, '', ROTULO_PAI, 0],
  });

  /* 2. E **mantem** a arvore quando o rotulo ja existe e muda de pai: o segundo
        `UPDATE` de `wp_update_term()` (`:3446`) leva o pai novo. */
  const arvore = montar();
  arvore.falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: ROTULO_NO_CONTEXTO,
      taxonomy: CONTEXTO_DE_CATEGORIA,
      parent: 0,
    }),
  ]);
  programarPar(arvore.falsa, ROTULO_NO_CONTEXTO);

  arvore.modulo.reposicionarRotuloNaHierarquia({
    rotuloId: ROTULO,
    contexto: CONTEXTO_DE_CATEGORIA,
    rotuloPaiId: ROTULO_PAI,
  });

  assert.deepEqual(arvore.falsa.escritas[1], {
    texto:
      'UPDATE wp_term_taxonomy SET term_id = ?, taxonomy = ?, description = ?, parent = ? ' +
      'WHERE term_taxonomy_id = ?',
    parametros: [
      ROTULO,
      CONTEXTO_DE_CATEGORIA,
      '',
      ROTULO_PAI,
      ROTULO_NO_CONTEXTO,
    ],
  });

  /* 3. O contexto plano **recusa** a hierarquia: o pai informado nao chega a
        coluna, nas duas operacoes que a escrevem. */
  const criacaoPlana = montar();
  programarPar(criacaoPlana.falsa, null);
  criacaoPlana.falsa.responder([]);

  criacaoPlana.modulo.criarRotuloNoContexto({
    contexto: CONTEXTO_DE_ETIQUETA,
    nome: 'Resenhas',
    slug: 'resenhas',
    rotuloPaiId: ROTULO_PAI,
  });

  assert.deepEqual(criacaoPlana.falsa.escritas[1]?.parametros, [
    7,
    CONTEXTO_DE_ETIQUETA,
    '',
    0,
    0,
  ]);

  const reposicionamentoPlano = montar();
  reposicionamentoPlano.falsa.responder([
    linhaDeTermo({
      term_id: ROTULO,
      term_taxonomy_id: OUTRO_ROTULO_NO_CONTEXTO,
      taxonomy: CONTEXTO_DE_ETIQUETA,
    }),
  ]);
  programarPar(reposicionamentoPlano.falsa, OUTRO_ROTULO_NO_CONTEXTO);

  reposicionamentoPlano.modulo.reposicionarRotuloNaHierarquia({
    rotuloId: ROTULO,
    contexto: CONTEXTO_DE_ETIQUETA,
    rotuloPaiId: ROTULO_PAI,
  });

  assert.deepEqual(reposicionamentoPlano.falsa.escritas[1]?.parametros, [
    ROTULO,
    CONTEXTO_DE_ETIQUETA,
    '',
    0,
    OUTRO_ROTULO_NO_CONTEXTO,
  ]);

  // 🔴 **O que este caso NAO afirma, e por que.** O catalogo tipa `UT-036-2`
  // como `erro`, e as quatro fontes do pacote concordam so no efeito no banco —
  // `parent = 0` — e **nao dizem** se o chamador recebe `WP_Error`. T009
  // descartou o pai, e as tres razoes estao no bloco 🔴 de
  // `./hierarquia-do-rotulo.ts`; esta suite registra o estado de hoje para que a
  // troca nao passe em silencio, e **nao** decide a pergunta. Ver o bloco ⚠️ do
  // cabecalho sobre `UT-034-2`, que e `erro` com recusa silenciosa.
  assert.equal(criacaoPlana.falsa.escritas.length, 2);
  assert.equal(reposicionamentoPlano.falsa.escritas.length, 2);
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-036-3 `feliz` — "remove o vinculo e preserva o conteudo ao apagar termo
   em uso"

   Prova (CA-4.3): "Apagar um termo em uso remove o vinculo e nao apaga o
   conteudo"                                                        @cascata
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-036-3 remove o vinculo e preserva o conteudo ao apagar termo em uso (CA-4.3, @cascata)', () => {
  // O dado de entrada: o rotulo esta **em uso** por {@link OBJETO}, que tem
  // tambem um segundo rotulo — assim o que o caso afirma e a remocao do vinculo,
  // e nao a atribuicao do padrao, que e `UT-036-4`.
  const { falsa, modulo, colaboracao } = cenarioDeExclusao();
  programarCascata(falsa, {
    rotulosDoObjeto: [ROTULO, OUTRO_ROTULO],
    rotuloInformadoNoContexto: OUTRO_ROTULO_NO_CONTEXTO,
    vinculoJaGravado: true,
  });

  const resultado = apagarRotuloDoContexto(modulo, colaboracao, {
    rotuloId: ROTULO,
    contexto: CONTEXTO_DE_CATEGORIA,
  });

  assert.equal(resultado, true);

  // UC-08, *Apagar um termo que tem conteudo*: *"O conteudo nao e apagado: perde
  // a relacao"*. O **P5** manda afirmar *"o conjunto exato do que sumiu e do que
  // permaneceu"*, e sao tres linhas: o vinculo do objeto com o rotulo apagado, a
  // linha de contexto e a linha de rotulo.
  assert.deepEqual(
    textos(falsa.escritas).filter((texto) => texto.startsWith('DELETE')),
    [
      'DELETE FROM wp_term_relationships WHERE object_id = ? AND term_taxonomy_id IN (?)',
      'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
      'DELETE FROM wp_terms WHERE term_id = ?',
    ],
  );

  // O vinculo removido e o do rotulo apagado, e **so** ele: o do outro rotulo
  // fica, e por isso nenhum `DELETE` carrega o par dele.
  assert.deepEqual(falsa.escritas[1]?.parametros, [OBJETO, ROTULO_NO_CONTEXTO]);
  for (const escrita of falsa.escritas) {
    assert.equal(escrita.parametros.includes(OUTRO_ROTULO_NO_CONTEXTO), false);
  }

  // ⚠️ **"nao apaga o conteudo"**, afirmado por duas vias. A primeira: nenhum
  // comando desta cascata nomeia a tabela de conteudo — nem poderia, porque
  // `posts` e BC-01 e a regra de dependencia 3 proibe a travessia por `import`.
  // A leitura que abre a cascata entra no laco como controle: sem ela a varredura
  // passaria por vacuidade.
  assert.equal(
    falsa.selecoes[0]?.texto.startsWith('SELECT t.*, tt.* FROM wp_terms'),
    true,
  );
  for (const consulta of [...falsa.selecoes, ...falsa.escritas]) {
    assert.equal(consulta.texto.includes('wp_posts'), false);
  }

  // A segunda, e e ela que torna a ausencia **estrutural**: a porta pela qual
  // este contexto fala com BC-01 tem tres metodos, e os tres **leem**. Nao ha
  // metodo que apague conteudo para a cascata chamar.
  assert.deepEqual(Object.keys(colaboracao.conteudo).sort(), [
    'contarAnexosPublicados',
    'contarConteudoPublicado',
    'tipoDeConteudoEhRegistrado',
  ]);
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-036-4 `feliz` — "atribui o padrao ao conteudo que ficou sem termo algum
   no contexto"

   Prova (CA-4.4): "Conteudo que fica sem termo algum num contexto com padrao
   recebe o padrao"                                     @cascata @invariante
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-036-4 atribui o padrao ao conteudo que ficou sem termo algum no contexto (CA-4.4, @invariante)', () => {
  /* 1. *"Dado um conteudo vinculado a exatamente um termo da taxonomia que tem
        termo padrao / Quando esse termo e apagado / Entao as duas metades
        vinculam o conteudo ao termo padrao"*
        (`parity_tests/03-exclusao-de-conteudo-em-sete-etapas.feature:80`). */
  const unico = cenarioDeExclusao({
    [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO,
  });
  programarCascata(unico.falsa, {
    rotulosDoObjeto: [ROTULO],
    rotuloInformadoNoContexto: ROTULO_PADRAO_NO_CONTEXTO,
  });

  apagarRotuloDoContexto(unico.modulo, unico.colaboracao, {
    rotuloId: ROTULO,
    contexto: CONTEXTO_DE_CATEGORIA,
  });

  // `BR-MIGRAR-080` (`DB-TRG4`, `wp-includes/taxonomy.php:2152`), que
  // `target_domain_model.md` poe entre as quatro invariantes de `AGG-Termo`: o
  // vinculo com o padrao entra, e o vinculo com o termo apagado sai.
  assert.deepEqual(unico.falsa.escritas[1], {
    texto:
      'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id) VALUES (?, ?)',
    parametros: [OBJETO, ROTULO_PADRAO_NO_CONTEXTO],
  });
  assert.deepEqual(
    textos(unico.falsa.escritas).filter((texto) =>
      texto.startsWith('DELETE FROM wp_term_relationships'),
    ),
    [
      'DELETE FROM wp_term_relationships WHERE object_id = ? AND term_taxonomy_id IN (?)',
    ],
  );

  // ⚠️ **O identificador gravado e o `term_taxonomy_id` do padrao, e nao o
  // `term_id` que a opcao guarda** — a troca que esta historia convida a fazer.
  // A opcao devolveu `ROTULO_PADRAO`, e o que entra na juncao e
  // `ROTULO_PADRAO_NO_CONTEXTO`.
  assert.notEqual(ROTULO_PADRAO, ROTULO_PADRAO_NO_CONTEXTO);
  assert.equal(
    unico.falsa.escritas[1]?.parametros.includes(ROTULO_PADRAO),
    false,
  );

  // E o padrao vem da opcao que `chaveDoTermoPadrao()` monta para `category`,
  // lida **uma** vez — `default_category`, e nao `default_term_category`.
  assert.deepEqual(unico.chavesLidas, [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]);

  /* 2. *"Mas um conteudo vinculado a dois termos da mesma taxonomia nao recebe o
        padrao / Quando um dos dois termos e apagado / Entao nenhuma das duas
        metades vincula o termo padrao / E o conteudo fica com o termo restante"*
        — a segunda metade do mesmo cenario, e a segunda metade de `DB-TRG4`:
        *"senao perde so aquele termo"*. */
  const comOutro = cenarioDeExclusao({
    [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO,
  });
  programarCascata(comOutro.falsa, {
    rotulosDoObjeto: [ROTULO, OUTRO_ROTULO],
    rotuloInformadoNoContexto: OUTRO_ROTULO_NO_CONTEXTO,
    vinculoJaGravado: true,
  });

  apagarRotuloDoContexto(comOutro.modulo, comOutro.colaboracao, {
    rotuloId: ROTULO,
    contexto: CONTEXTO_DE_CATEGORIA,
  });

  // Nenhum `INSERT` sai — o vinculo que sobra ja estava gravado —, e o par do
  // padrao nao aparece em comando nenhum.
  assert.deepEqual(
    textos(comOutro.falsa.escritas).filter((texto) =>
      texto.startsWith('INSERT'),
    ),
    [],
  );
  for (const escrita of comOutro.falsa.escritas) {
    assert.equal(escrita.parametros.includes(ROTULO_PADRAO_NO_CONTEXTO), false);
    assert.equal(escrita.parametros.includes(ROTULO_PADRAO), false);
  }

  /* 3. E o contexto **sem** padrao deixa o objeto sem termo algum: a opcao vale
        `0`, que e tambem o valor de opcao ausente — o legado nao distingue os
        dois ({@link SEM_TERMO_PADRAO}). */
  const semPadrao = cenarioDeExclusao();
  programarCascata(semPadrao.falsa, { rotulosDoObjeto: [ROTULO] });

  apagarRotuloDoContexto(semPadrao.modulo, semPadrao.colaboracao, {
    rotuloId: ROTULO,
    contexto: CONTEXTO_DE_CATEGORIA,
  });

  assert.deepEqual(textos(semPadrao.falsa.escritas), [
    'UPDATE wp_term_taxonomy SET parent = ? WHERE parent = ? AND taxonomy = ?',
    'DELETE FROM wp_term_relationships WHERE object_id = ? AND term_taxonomy_id IN (?)',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_terms WHERE term_id = ?',
  ]);
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-036-5 `feliz` — "deixa a contagem de uso correta nos termos afetados pela
   operacao"

   Prova (CA-4.5): "A contagem de uso dos termos afetados fica correta ao fim
   da operacao"                                                     @cascata
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-036-5 deixa a contagem de uso correta nos termos afetados pela operacao (CA-4.5)', () => {
  /* 1. A contagem no instante zero: a linha de contexto nasce com `count = 0`,
        **explicito** na insercao (`:2652`), e nao herdado do default do DDL. Um
        rotulo novo nao classifica nada. */
  const criacao = montar();
  programarPar(criacao.falsa, null);
  criacao.falsa.responder([]);

  criacao.modulo.criarRotuloNoContexto({
    contexto: CONTEXTO_DE_CATEGORIA,
    nome: 'Resenhas',
    slug: 'resenhas',
  });

  const insercao = criacao.falsa.escritas[1];
  assert.match(String(insercao?.texto), /parent, count\) VALUES/);
  assert.equal(insercao?.parametros.at(-1), 0);

  /* 2. A contagem ao fim da cascata: UC-08 passo 5 — *"Sistema recalcula a
        contagem de uso dos termos afetados"*. Sao **dois** afetados quando o
        padrao entra: o que recebeu o vinculo e o que o perdeu. */
  const { falsa, modulo, colaboracao, contagensPedidas } = cenarioDeExclusao({
    [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO,
  });
  programarCascata(falsa, {
    rotulosDoObjeto: [ROTULO],
    rotuloInformadoNoContexto: ROTULO_PADRAO_NO_CONTEXTO,
  });

  apagarRotuloDoContexto(modulo, colaboracao, {
    rotuloId: ROTULO,
    contexto: CONTEXTO_DE_CATEGORIA,
  });

  const contagens = falsa.escritas.filter((escrita) =>
    escrita.texto.startsWith('UPDATE wp_term_taxonomy SET count'),
  );
  assert.deepEqual(
    contagens.map((escrita) => escrita.parametros.at(-1)),
    [ROTULO_PADRAO_NO_CONTEXTO, ROTULO_NO_CONTEXTO],
  );

  // ⚠️ A recontagem sai **por dentro** da substituicao e da remocao de US-2,
  // como no legado, e nao por uma chamada da cascata: recontar de fora emitiria
  // comando que o legado nao emite. Cada `UPDATE` de contagem vem logo depois da
  // escrita que o provocou — o `INSERT` do padrao e o `DELETE` do apagado.
  assert.deepEqual(textos(falsa.escritas), [
    'UPDATE wp_term_taxonomy SET parent = ? WHERE parent = ? AND taxonomy = ?',
    'INSERT INTO wp_term_relationships (object_id, term_taxonomy_id) VALUES (?, ?)',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_term_relationships WHERE object_id = ? AND term_taxonomy_id IN (?)',
    'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
    'DELETE FROM wp_terms WHERE term_id = ?',
  ]);

  // ⚠️ E o **criterio** de calculo e o de conteudo, nao o generico: o cenario de
  // paridade dos contadores e literal — *"o critério de cálculo usado para a
  // taxonomia de conteúdo difere do usado para as demais, igualmente nas duas"*
  // (`:71`). `category` declara `post`, que e tipo de conteudo registrado, logo a
  // contagem atravessa `posts` e sai por BC-01 (`DB-TRG2`, `BR-MIGRAR-078`). O
  // duble registra as duas chamadas, e nenhuma leitura generica da juncao sai.
  assert.deepEqual(contagensPedidas, [
    ROTULO_PADRAO_NO_CONTEXTO,
    ROTULO_NO_CONTEXTO,
  ]);
  for (const consulta of falsa.selecoes) {
    assert.equal(
      consulta.texto.includes('COUNT(*) FROM wp_term_relationships'),
      false,
    );
  }
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-036-6 `borda` — "trata o desaparecimento do termo como o seu unico estado
   possivel"

   Prova (regra de negocio de US-4): "`terms` nao tem coluna de estado: o estado
   de um termo e a existencia dele" (UC-08, de `state-machines.md` §10)
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-036-6 trata o desaparecimento do termo como o seu unico estado possivel (regra: `terms` nao tem coluna de estado)', () => {
  /* 1. A coluna nao existe, e o DDL afirma isso: as tres tabelas de T002 tem
        `name`, `slug`, `term_group`, `taxonomy`, `description`, `parent`,
        `count`, `object_id` e `term_order` — e nenhuma coluna de estado.
        `clausulaDeCharset` fica vazia de proposito: ela e a lacuna 🔴 `ERD-5` e
        nao tem default neste modulo, e nenhuma coluna depende dela. */
  const { falsa, modulo } = montar();
  const ddl = ddlDoArmazenamentoDeClassificacao(falsa.porta, {
    clausulaDeCharset: '',
  });

  // O controle: e o DDL das tres tabelas que esta sendo varrido, com as colunas
  // que elas **tem**. Sem isto a varredura de ausencia passaria por vacuidade.
  for (const coluna of [
    'CREATE TABLE wp_terms',
    'CREATE TABLE wp_term_taxonomy',
    'CREATE TABLE wp_term_relationships',
    "name varchar(200) NOT NULL default ''",
    'parent bigint(20) unsigned NOT NULL default 0',
    'count bigint(20) NOT NULL default 0',
  ]) {
    assert.equal(ddl.includes(coluna), true);
  }

  for (const estado of [
    'status',
    'state',
    'estado',
    'active',
    'enabled',
    'deleted',
    'trash',
    'visibility',
  ]) {
    assert.equal(ddl.includes(estado), false);
  }

  /* 2. Logo as duas transicoes do termo sao `INSERT` e `DELETE`, e nada mais: a
        criacao **e** a transicao de entrada e nao ha campo a ligar; a exclusao
        **e** a transicao de saida e nao ha campo a desligar. */
  programarPar(falsa, null);
  falsa.responder([]);
  modulo.criarRotuloNoContexto({
    contexto: CONTEXTO_DE_CATEGORIA,
    nome: 'Resenhas',
    slug: 'resenhas',
  });

  const exclusao = cenarioDeExclusao();
  programarCascata(exclusao.falsa, { rotulosDoObjeto: [ROTULO] });
  apagarRotuloDoContexto(exclusao.modulo, exclusao.colaboracao, {
    rotuloId: ROTULO,
    contexto: CONTEXTO_DE_CATEGORIA,
  });

  const comandos = [...falsa.escritas, ...exclusao.falsa.escritas].map(
    (escrita) => escrita.texto,
  );

  // Nenhum comando escreve coluna de estado, porque nenhuma existe. As unicas
  // colunas que um `UPDATE` desta historia toca sao `parent` e `count`, e as duas
  // sao dado, nao estado.
  for (const estado of ['status', 'state', 'estado', 'active', 'deleted']) {
    assert.equal(comandos.join(' ').includes(estado), false);
  }
  assert.deepEqual(
    comandos.filter((texto) => texto.startsWith('UPDATE')),
    [
      'UPDATE wp_term_taxonomy SET parent = ? WHERE parent = ? AND taxonomy = ?',
      'UPDATE wp_term_taxonomy SET count = ? WHERE term_taxonomy_id = ?',
    ],
  );

  // A entrada: duas linhas nascem, uma em cada tabela de `AGG-Termo`.
  assert.deepEqual(
    comandos.filter((texto) => texto.startsWith('INSERT INTO wp_term')),
    [
      'INSERT INTO wp_terms (name, slug, term_group) VALUES (?, ?, ?)',
      'INSERT INTO wp_term_taxonomy (term_id, taxonomy, description, parent, count) ' +
        'VALUES (?, ?, ?, ?, ?)',
    ],
  );

  // A saida: as duas linhas desaparecem, e e **so** por isso que o termo deixa
  // de existir. Nao sobra linha marcada.
  assert.deepEqual(
    comandos.filter(
      (texto) =>
        texto === 'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?' ||
        texto === 'DELETE FROM wp_terms WHERE term_id = ?',
    ),
    [
      'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
      'DELETE FROM wp_terms WHERE term_id = ?',
    ],
  );

  /* 3. E e por isso que perguntar *"qual o estado deste termo"* e perguntar
        *"ele existe?"*: depois do `DELETE` a leitura fundida nao devolve linha,
        e o modulo responde `null` — nao ha linha com bandeira para encontrar. */
  exclusao.falsa.responder([]);
  assert.equal(
    exclusao.modulo.obterTermo(ROTULO, CONTEXTO_DE_CATEGORIA),
    null,
  );

  // E o cenario de paridade e literal:
  // *"Quando o modelo de contas, de termos, de opções e de links é inspecionado
  // / Então nenhuma das quatro tem coluna de estado com conjunto fechado de
  // valores / E nenhuma das quatro tem transição proibida declarada / E nenhuma
  // das quatro ganhou máquina de estado que o legado não tem"*
  // (`parity_tests/19-maquinas-de-estado-e-changeset.feature:81`).
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-036-7 `feliz` — "resolve os cinco nomes de capacidade de taxonomia na
   mesma capacidade real"

   Prova (regra de negocio de US-4): "Cinco nomes de capacidade de taxonomia
   resolvem todos para a mesma capacidade real" — `BR-MIGRAR-092` (`PERM-6`),
   `wp-includes/capabilities.php:751`, e a primeira linha de *Regras de negocio
   aplicadas* de UC-08
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-036-7 resolve os cinco nomes de capacidade de taxonomia na mesma capacidade real (regra: PERM-6)', () => {
  // Os cinco nomes, na ordem em que UC-08 os lista: *"`manage_post_tags`,
  // `edit_categories`, `edit_post_tags`, `delete_categories` e
  // `delete_post_tags` resolvem todas para `manage_categories`"*.
  assert.deepEqual(CAPACIDADES_DE_GESTAO_DE_ROTULO, [
    CAPACIDADE_DE_GERENCIAR_ETIQUETAS,
    CAPACIDADE_DE_EDITAR_CATEGORIAS,
    CAPACIDADE_DE_EDITAR_ETIQUETAS,
    CAPACIDADE_DE_APAGAR_CATEGORIAS,
    CAPACIDADE_DE_APAGAR_ETIQUETAS,
  ]);
  assert.deepEqual(CAPACIDADES_DE_GESTAO_DE_ROTULO, [
    'manage_post_tags',
    'edit_categories',
    'edit_post_tags',
    'delete_categories',
    'delete_post_tags',
  ]);

  // **A mesma** capacidade real para os cinco, e nao cinco resultados parecidos.
  const resolucoes = CAPACIDADES_DE_GESTAO_DE_ROTULO.map((capacidade) =>
    casoDeGestaoDeRotulo({
      capacidade,
      contaId: 7,
      argumentos: [],
      constantes: {},
      emRede: false,
    }),
  );
  for (const resolvida of resolucoes) {
    assert.deepEqual(resolvida, [CAPACIDADE_DE_GERENCIAR_CLASSIFICACAO]);
  }
  assert.equal(CAPACIDADE_DE_GERENCIAR_CLASSIFICACAO, 'manage_categories');

  // ⚠️ `manage_categories` **nao** esta entre os cinco: ela e a capacidade real,
  // e primitiva e esta na matriz de papeis, e atravessa a traducao pelo
  // `default:`. E `assign_categories` / `assign_post_tags` tampouco: as duas
  // resolvem para `edit_posts` e sao o caso de T005 — *"atribuir termo e poder de
  // conteudo, nao de classificacao"* (UC-05). `null` e *"nao e meu caso"*, e e
  // diferente de `[]`, que e *"permitido"*.
  for (const fora of [
    'manage_categories',
    'assign_categories',
    'assign_post_tags',
    'edit_posts',
    'manage_links',
  ]) {
    assert.equal(
      casoDeGestaoDeRotulo({
        capacidade: fora,
        contaId: 7,
        argumentos: [],
        constantes: {},
        emRede: false,
      }),
      null,
    );
  }

  // E a consequencia de a resolucao existir, que e o motivo pelo qual este caso
  // e `feliz` e nao cosmetico: `post_tag` declara `manage_post_tags` em
  // `manage_terms`, **nenhum papel desta matriz o concede**, e sem o atalho de
  // `capabilities.php:751` o portao recusaria **todo mundo** da lista de
  // etiquetas, inclusive quem tem `manage_categories`.
  const { modulo, colaboracao } = cenarioDeTela('editor');

  assert.equal(
    modulo.contextos.obter(CONTEXTO_DE_ETIQUETA)?.capacidades.gerenciarRotulos,
    CAPACIDADE_DE_GERENCIAR_ETIQUETAS,
  );
  assert.equal(
    MATRIZ.some((papel) =>
      papel.capacidades.some(
        (concessao) =>
          concessao.capacidade === CAPACIDADE_DE_GERENCIAR_ETIQUETAS,
      ),
    ),
    false,
  );
  assert.equal(
    modulo.permissaoDeGerenciarRotulos(colaboracao, CONTEXTO_DE_ETIQUETA)
      .permitido,
    true,
  );
});
