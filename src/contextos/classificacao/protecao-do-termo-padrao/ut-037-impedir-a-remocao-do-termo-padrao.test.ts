/**
 * A entrega de **T012**: *"5 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-037-1, UT-037-2, UT-037-3, UT-037-4,
 * UT-037-5), com o mesmo dado de entrada, acao e resultado esperado. Os 2 testes
 * de regra de negocio (UT-037-4, UT-037-5) entram na mesma suite."*
 *
 * ---
 *
 * # Os cinco casos sao TRANSCRITOS, nao reconstruidos
 *
 * O catalogo esta no disco: o caminho `../../../backlog/tests.md` que `tasks.md`
 * cita resolve para `backlog/tests.md` na raiz do repositorio, e a secao `REQ-037`
 * (`:576`-`:586`) tem os cinco casos com nome, tipo e prova. Esta suite **copia**
 * os cinco, um `test()` por caso, na ordem do catalogo, com o nome do caso no nome
 * do teste — o mesmo arranjo de
 * `../manutencao-da-lista/ut-036-manutencao-da-lista-de-termos.test.ts`, de
 * `../termo-padrao/ut-035-termo-padrao-do-contexto.test.ts` e de
 * `../rotulo-e-contexto/ut-033-separacao-entre-rotulo-e-contexto.test.ts`.
 *
 * | caso | nome no catalogo | tipo | prova (coluna `Prova`) |
 * |---|---|---|---|
 * | `UT-037-1` | *"recusa apagar o termo declarado como padrão do contexto"* | `erro` | CA-5.1 — *"Apagar o termo declarado como padrão de um contexto é recusado, para qualquer ator"* |
 * | `UT-037-2` | *"mantém a recusa diante do ator de maior poder da instalação"* | `erro` | CA-5.2 — *"A recusa vence inclusive o ator de maior poder da instalação"* |
 * | `UT-037-3` | *"libera a remoção do termo anterior depois da troca do padrão"* | `feliz` | CA-5.3 — *"Trocar qual termo é o padrão é permitido, e só então o anterior pode ser apagado"* |
 * | `UT-037-4` | *"recusa a remoção do termo padrão também na ação em lote e pela superfície programática"* | `erro` | regra — *"O termo padrão do contexto é indestrutível, e a negação vence até o ator de maior poder"* |
 * | `UT-037-5` | *"mantém a negação quando um ponto de extensão tenta conceder a remoção"* | `erro` | regra — *"ADR 0009 — negação explícita que vence o super admin"* |
 *
 * Nenhum caso foi acrescentado e nenhum foi desdobrado em dois: sao **cinco**
 * `test()`, e o que cada um afirma e o que a coluna `Prova` do caso diz. As duas
 * ultimas linhas sao as **duas regras de negocio** que `spec.md` lista em US-5,
 * palavra por palavra, e UC-08 repete a primeira em *Regras de negocio aplicadas*
 * com a secao de origem (*"O termo padrao da taxonomia e indestrutivel
 * (permissions.md §5.2)"*).
 *
 * # Nao sao os testes de criterio de T011
 *
 * T011 entrega *"o comportamento de US-5 existe e os criterios CA-5.1, CA-5.2,
 * CA-5.3 passam contra o sistema novo"*, e tem a suite dela ao lado, em
 * `./us-5-protecao-do-termo-padrao.test.ts`: 24 testes que percorrem os **dois**
 * mecanismos da recusa, os tres portoes de item com os `msgid` byte a byte, os
 * quatro caminhos de erro do `case`, a recursao do ramo 4 e os tres pontos 🔴 que
 * o pacote nao especifica. Esta suite e o **catalogo**: cinco casos, um por linha
 * de `REQ-037`, cada um com o dado de entrada e o resultado que o caso descreve, e
 * nada mais. As duas afirmam a mesma regra por recortes diferentes de proposito, e
 * a suite de T011 diz isso por escrito — *"os cinco casos `UT-037-1` a `UT-037-5`
 * sao **T012**, que roda em paralelo com esta tarefa e tem suite propria"*.
 *
 * **T012 depende de T011** (`tasks.md`: *"depende de: T011"*), e por isso esta
 * suite chama as operacoes de `../index.js` e de `./`: numa arvore sem T011 ela
 * nao compila, que e o que a dependencia declarada significa. O `[P]` de T012 —
 * *"tarefa de teste, que toca so a propria suite"* — e honrado ao pe da letra:
 * **este arquivo e o unico tocado por esta tarefa**, nem `./index.ts` nem
 * `../index.ts` nem `../README.md` mudaram.
 *
 * # Como estes cinco testes se conferem por `parity_specs.md`
 *
 * O criterio de aceite desta area e **efeito no banco** (area 3 da Decisao 2, que
 * compara *"snapshot + sequencia de comandos"*, com *"zero divergencia"*), e por
 * isso a porta de teste **registra consulta** em vez de simular banco
 * (`../armazenamento/porta-falsa.ts`): nesta historia o efeito e **nao escrever**,
 * e um banco de mentira esconderia justamente o comando que nao sai. Cada caso
 * afirma, onde isso e a regra, que **nenhum comando sai** — `UT-037-1`,
 * `UT-037-2` e `UT-037-5` sao inteiros uma ausencia de comando — e, onde a
 * exclusao **acontece**, qual comando sai e em que ordem (`UT-037-3` e a metade
 * feliz de `UT-037-4`).
 *
 * E ha cenario de paridade para estes casos, em dois arquivos que nao levam o nome
 * desta feature:
 *
 * | caso | cenario de paridade | arquivo e linha |
 * |---|---|---|
 * | `UT-037-2`, `UT-037-5` | *"A negação explícita vence o super administrador"*: *"Dado um super administrador em instalação de rede / Quando uma capacidade negada explicitamente é verificada / Então as duas metades negam"*, e *"E a ordem entre a verificação de negação e a concessão geral é a mesma nas duas"* — `@paridade @critico @invariante` | `parity_tests/07-autorizacao-por-capacidade.feature:134` |
 * | `UT-037-3`, `UT-037-4` | *"Apagar um termo devolve o objeto ao termo padrão, se aquele era o único"* — `@paridade @critico @invariante @cascata` — e o `@composicao` que descreve o metodo desta suite: *"a sequência de comandos registrada é idêntica à do oráculo"* | `parity_tests/03-exclusao-de-conteudo-em-sete-etapas.feature:80` e `:113` |
 * | `UT-037-1` | nenhum cenario de fluxo proprio: a recusa e a **ausencia** da cascata, e a tela e `SCR-044 lista-de-termos`, **tela critica** em modo modernizado, que cai em `@paridade-contrato-de-tela` | `target_screens.md`, `SCR-044` |
 *
 * A `@cascata` e **obrigatoria** em *"exclusao de conteudo e de termo"* e a
 * `@invariante` em *"todo fluxo cujo aggregate tem invariante"*; a desta historia e
 * a pos-condicao de UC-08 — *"o termo padrao da taxonomia **continua existindo**"*.
 *
 * # 🔴 E NENHUM TESTE AQUI E DE PARIDADE, porque falta a outra metade
 *
 * Os cenarios acima comparam **duas metades**, e a segunda nao existe nesta
 * arvore: o oraculo executavel do legado nao esta de pe (`oracleAvailable: false`
 * em `../screens/golden/manifest.yaml`; levanta-lo e T001 da feature
 * `015-plataforma-transversal`) e, nesta arvore de trabalho, **a instalacao do
 * legado tambem nao esta no disco** — nao ha `wp-includes/capabilities.php`,
 * `wp-includes/taxonomy.php` nem `wp-admin/edit-tags.php` para abrir. Logo cada
 * `arquivo:linha` citado abaixo vem do pacote (`backlog/tests.md`, `spec.md`,
 * `UC-08`, ADR 0009, `BR-MIGRAR-091`, `BR-MIGRAR-092`, `target_screens.md`,
 * `parity_tests/`) ou da transcricao **merged** de T002, T003, T005, T007, T009 e
 * T011 — **nenhum vem de memoria, e nenhum foi reconferido**. O que estes cinco
 * testes afirmam e *"identico ao que o pacote descreve"*, e nao *"identico ao que
 * o legado executa"*; a segunda afirmacao e de quem tiver o oraculo.
 *
 * # ⚠️ UT-037-4 DIZ "NA ACAO EM LOTE", E QUEM RECUSA NO LOTE NAO E O PORTAO
 *
 * O caso se chama *"recusa a remocao do termo padrao **tambem na acao em lote** e
 * pela superficie programatica"*, e a recusa **acontece** nos dois caminhos — mas
 * nao pelo mesmo mecanismo, e este teste afirma o mecanismo de cada um porque a
 * diferenca e observavel:
 *
 * | caminho | quem recusa | tem ator? |
 * |---|---|---|
 * | a **superficie programatica** (`wp_delete_term()` chamada direto) | o `return 0` do passo 2 (`taxonomy.php:2077` e `:2086`) | **nao** |
 * | a **acao em lote** da tela | o **mesmo** `return 0`, item por item: o lote e um `foreach` de `wp_delete_term()` | **nao** |
 * | o portao de item da tela (`:114`) | o `do_not_allow` do `case` de `map_meta_cap()` (`capabilities.php:738`-`:744`) | sim |
 *
 * **O portao do lote (`:137`) nao protege o termo padrao**, e responde *"pode"*
 * para um lote que o inclua: ele cobra `$tax->cap->delete_terms`, no **plural** e
 * **sem o termo em maos**, logo nao passa pelo `case` de objeto. E a correcao de
 * leitura que T011 registrou com duas fontes do pacote — UC-08, *Excecoes*
 * (*"Ator sem **`delete_terms`**"*, no plural) e `SCR-044` § 6 (*"**3** checagens
 * `current_user_can()`, 3 capacidades distintas"*, que com a do lote sendo
 * `delete_term` seriam quatro) — e esta no cabecalho de
 * `./permissao-sobre-rotulo.ts`.
 *
 * **A consequencia e o que este caso afirma:** os **outros** termos do lote sao
 * apagados, e so o padrao sobrevive. Endurecer o portao para negar o lote inteiro
 * recusaria o que o legado aceita, e o **P1** decide o lado sem que esta tarefa
 * escolha — *"reproduza o comportamento observavel do sistema analisado"*, e
 * nenhuma decisao humana autoriza divergir.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ATOR_ANONIMO,
  CAPACIDADE_NEGADA,
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
import type { ColaboracaoDaExclusaoDeRotulo } from '../manutencao-da-lista/index.js';
import type { Consulta, LinhaDeResultado } from '../portas/index.js';
import { CONTEXTO_DE_CATEGORIA } from '../registro/index.js';
import {
  OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
  SEM_TERMO_PADRAO,
  type OpcoesNaClassificacao,
} from '../termo-padrao/index.js';
import type {
  ColaboracaoDoVinculo,
  ConteudoNaClassificacao,
} from '../vinculo-de-objeto/index.js';
import {
  MENSAGENS_DOS_PORTOES_DE_ITEM,
  RECUSA_DO_TERMO_PADRAO,
  type ColaboracaoDaProtecaoDoTermoPadrao,
} from './index.js';

/* ── O DADO DE ENTRADA DOS CINCO CASOS ──────────────────────────────────────
   Os identificadores sao os papeis que o catalogo descreve em prosa: o rotulo
   que a opcao guarda como padrao, um rotulo qualquer do mesmo contexto, e um
   terceiro para o lote de `UT-037-4`. Cada um aparece em `terms.term_id` **ou**
   em `term_taxonomy.term_taxonomy_id`, e a diferenca entre as duas e a propria
   pegadinha desta feature — por isso elas tem nomes diferentes. */

/**
 * O rotulo que `default_category` guarda, e o `term_taxonomy_id` dele.
 *
 * `1` e o valor semeado pela instalacao (`BR-MIGRAR-084`), e e por isso que ele e
 * o `term_id` deste cenario: no legado a categoria padrao de uma instalacao nova
 * e literalmente o termo `1`, "Uncategorized".
 */
const ROTULO_PADRAO = 1;
const ROTULO_PADRAO_NO_CONTEXTO = 5;

/** Um rotulo do mesmo contexto que **nao** e o padrao. */
const ROTULO = 12;
const ROTULO_NO_CONTEXTO = 30;

/** Um terceiro rotulo, que entra no lote de `UT-037-4` junto com o padrao. */
const OUTRO_ROTULO = 99;
const OUTRO_ROTULO_NO_CONTEXTO = 31;

/**
 * A matriz de papeis, com os dois atores que os casos distinguem.
 *
 * ⚠️ **E fixture, nao a matriz de fabrica.** Ela existe para separar duas
 * respostas: `manage_categories` so no primeiro papel, e **nenhum papel tem
 * `delete_categories`** — e o atalho de `PERM-6` que leva um ao outro, e sem ele
 * o editor nao apagaria categoria nenhuma. Quem afirma a matriz de fabrica e a
 * feature `001` (P3); aqui ela e dado de entrada.
 */
const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'editor',
    capacidades: [
      { capacidade: 'manage_categories', concedida: true },
      { capacidade: 'edit_posts', concedida: true },
    ],
  },
  {
    identificador: 'author',
    capacidades: [{ capacidade: 'edit_posts', concedida: true }],
  },
];

const BASE: BaseDeAutorizacao = {
  matriz: MATRIZ,
  rede: REDE_INATIVA_NA_AUTORIZACAO,
};

/** O login do super administrador da rede, em `EstadoDaRedeNaAutorizacao`. */
const LOGIN_DO_SUPER_ADMIN = 'dona-da-rede';

/**
 * A base de uma instalacao **em rede**, com o super administrador na lista.
 *
 * ⚠️ A matriz continua a mesma, e ele **nao tem papel nenhum**: `PERM-9` e
 * literal — *"super admin nao e capacidade: e nome de login numa lista de
 * rede"* —, e o atalho de *"tem tudo"* so existe em rede (ADR 0009, a assimetria
 * de `is_super_admin()`).
 */
const BASE_EM_REDE: BaseDeAutorizacao = {
  matriz: MATRIZ,
  rede: { ativa: true, loginsDeSuperAdmin: [LOGIN_DO_SUPER_ADMIN] },
};

/** Um ator com um papel, na forma do legado (o nome do papel como concessao). */
function ator(papel: string, contaId = 7): AtorDeAutorizacao {
  return {
    contaId,
    login: papel,
    existe: true,
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

/** O *"ator de maior poder da instalacao"*: so o login da lista de rede. */
const SUPER_ADMIN: AtorDeAutorizacao = {
  contaId: 1,
  login: LOGIN_DO_SUPER_ADMIN,
  existe: true,
  concessoes: [],
};

/** A colaboracao com BC-01, que no alvo e `posts` e aqui registra as chamadas. */
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
 * A leitura de opcao por ligacao tardia, que **registra as chaves lidas** e deixa
 * o valor trocar entre duas chamadas.
 *
 * A troca e o dado de entrada de `UT-037-3`: *"trocar qual termo e o padrao"* e
 * uma escrita em `options`, que **nao mora neste contexto** — ver a tabela de
 * ausencias de `./escopo-de-protecao-do-termo-padrao.ts` —, e o que o caso
 * exercita e o **efeito** dela, com a mesma opcao devolvendo outro valor.
 */
function opcoesDeTeste(valores: Record<string, number> = {}): {
  opcoes: OpcoesNaClassificacao;
  chavesLidas: string[];
  gravar: (chave: string, rotuloId: number) => void;
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
    gravar: (chave, rotuloId) => {
      valores[chave] = rotuloId;
    },
  };
}

/**
 * O cenario inteiro: o modulo, a porta falsa, e as duas colaboracoes.
 *
 * As duas chegam separadas porque o legado as separa: a da exclusao **nao tem
 * ator** (`wp_delete_term()` nao consulta capacidade no corpo) e a dos portoes
 * tem. E e essa separacao que faz *"para qualquer ator"* de `UT-037-1` valer na
 * letra — nao ha a quem abrir excecao.
 */
function cenario(
  opcoes: {
    readonly valoresDeOpcao?: Record<string, number>;
    readonly base?: BaseDeAutorizacao;
    readonly ator?: AtorDeAutorizacao;
  } = {},
): {
  falsa: PortaDeDadosFalsa;
  modulo: ModuloDeClassificacao;
  exclusao: ColaboracaoDaExclusaoDeRotulo;
  portao: ColaboracaoDaProtecaoDoTermoPadrao;
  chavesLidas: string[];
  gravarOpcao: (chave: string, rotuloId: number) => void;
} {
  const falsa = criarPortaDeDadosFalsa({ prefixoDeTabela: 'wp_' });
  const modulo = criarModuloDeClassificacao({ dados: falsa.porta });
  const leitura = opcoesDeTeste(opcoes.valoresDeOpcao ?? {});

  return {
    falsa,
    modulo,
    exclusao: { ...conteudoDeTeste(), opcoes: leitura.opcoes },
    portao: {
      base: opcoes.base ?? BASE,
      ator: opcoes.ator ?? ator('editor'),
      opcoes: leitura.opcoes,
    },
    chavesLidas: leitura.chavesLidas,
    gravarOpcao: leitura.gravar,
  };
}

/** Uma linha da leitura fundida `SELECT t.*, tt.*`, com as nove colunas. */
function linhaDeTermo(campos: {
  readonly term_id: number;
  readonly term_taxonomy_id: number;
  readonly taxonomy?: string;
  readonly name?: string;
}): LinhaDeResultado {
  return {
    term_id: campos.term_id,
    term_taxonomy_id: campos.term_taxonomy_id,
    name: campos.name ?? 'Noticias',
    slug: 'noticias',
    taxonomy: campos.taxonomy ?? CONTEXTO_DE_CATEGORIA,
    description: '',
    parent: 0,
    count: 0,
    term_group: 0,
  };
}

/** A linha do termo padrao de `category` — "Uncategorized", o termo `1`. */
function linhaDoPadrao(): LinhaDeResultado {
  return linhaDeTermo({
    term_id: ROTULO_PADRAO,
    term_taxonomy_id: ROTULO_PADRAO_NO_CONTEXTO,
    name: 'Uncategorized',
  });
}

/**
 * Programa a exclusao de um rotulo **sem objeto vinculado**, do inicio ao fim.
 *
 * A ordem das respostas e a ordem das leituras, e ela **e** a sequencia que o
 * legado emite — por isso este helper e um por um, e nao um mapa: trocar duas
 * linhas aqui muda o que se esta afirmando. Sem objeto vinculado o passo 7 nao
 * itera, e o que resta e o caminho mais curto da cascata: exatamente o que
 * `UT-037-3` e a metade feliz de `UT-037-4` precisam afirmar — que a exclusao
 * **acontece** quando o rotulo nao e o padrao.
 */
function programarExclusaoSemObjetos(
  falsa: PortaDeDadosFalsa,
  linha: LinhaDeResultado,
): void {
  // 1. `get_term()` — a resolucao do par (passo 1).
  falsa.responder([linha]);
  // 2. os filhos (`:2121`) — `category` e hierarquico, logo a leitura sai (passo 5).
  falsa.responder([]);
  // 3. os objetos vinculados (`:2152`) — nenhum (passo 7).
  falsa.responder([]);
  // 4. o trecho final de T003: a leitura do par, e a contagem de contextos.
  falsa.responder([linha]);
  falsa.responder([{ 'COUNT(*)': 0 }]);
}

/**
 * Os tres comandos que a exclusao de um rotulo de `category` sem objeto emite.
 *
 * O `UPDATE` e o passo 5 (`DB-TRG3`), e ele sai **mesmo sem filho**: no legado
 * ele nao esta dentro de `if ( $children )`. Os dois `DELETE` sao o trecho final
 * (passo 9), que e a entrega de T003.
 */
const COMANDOS_DA_EXCLUSAO: readonly string[] = [
  'UPDATE wp_term_taxonomy SET parent = ? WHERE parent = ? AND taxonomy = ?',
  'DELETE FROM wp_term_taxonomy WHERE term_taxonomy_id = ?',
  'DELETE FROM wp_terms WHERE term_id = ?',
];

/** So o texto dos comandos, para afirmar a sequencia sem repetir parametros. */
function textos(consultas: readonly Consulta[]): readonly string[] {
  return consultas.map((consulta) => consulta.texto);
}

/** A recusa que os dois portoes de item de apagar emitem, com o `msgid` de `:117`. */
const RECUSA_DO_PORTAO_DE_APAGAR = {
  permitido: false,
  recusa: {
    motivo: 'sem-capacidade-de-apagar-o-item',
    mensagem: MENSAGENS_DOS_PORTOES_DE_ITEM.semCapacidadeDeApagarOItem,
  },
} as const;

/* ══════════════════════════════════════════════════════════════════════════
   UT-037-1 `erro` — "recusa apagar o termo declarado como padrao do contexto"

   Prova (CA-5.1): "Apagar o termo declarado como padrao de um contexto e
   recusado, para qualquer ator"                        @cascata @invariante
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-037-1 recusa apagar o termo declarado como padrao do contexto (CA-5.1)', () => {
  const { falsa, modulo, exclusao, chavesLidas } = cenario({
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });

  // Entrada: `category` com `default_category` apontando para o rotulo `1`, que
  // existe no contexto. So a leitura do passo 1 e programada — o legado resolve o
  // par **antes** de olhar a opcao, e e por isso que um rotulo inexistente
  // devolve `false` sem ler opcao alguma.
  falsa.responder([linhaDoPadrao()]);

  const resultado = modulo.apagarRotuloDoContexto(exclusao, {
    rotuloId: ROTULO_PADRAO,
    contexto: CONTEXTO_DE_CATEGORIA,
  });

  // `return 0` (`taxonomy.php:2077`) — *"Don't delete the default category"*. E o
  // desfecho **proprio**, e nao outro `false`: em PHP os dois sao falsos, mas o
  // valor devolvido e diferente e e superficie publicada (P8).
  assert.equal(resultado, RECUSA_DO_TERMO_PADRAO);

  // ⚠️ **A invariante de UC-08**: *"o termo padrao da taxonomia continua
  // existindo"*. O **P5** manda afirmar o conjunto exato do que sumiu, e aqui o
  // conjunto e **vazio**: nenhuma escrita, em tabela nenhuma. E a cascata nao
  // comecou — a unica leitura e a do passo 1.
  assert.deepEqual(falsa.escritas, []);
  assert.equal(falsa.selecoes.length, 1);
  assert.deepEqual(chavesLidas, [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]);

  /* **"para qualquer ator"**, que e a metade do criterio que este caso carrega no
     nome. Ela vale por duas razoes somadas, e as duas sao afirmadas aqui. */

  // 1. a funcao **nao tem ator**: `ColaboracaoDaExclusaoDeRotulo` e `conteudo` +
  //    `opcoes`, e nada mais. A ausencia e verificavel, e nao so uma frase de
  //    cabecalho — nao ha a quem abrir excecao.
  assert.deepEqual(Object.keys(exclusao).sort(), ['conteudo', 'opcoes']);

  // 2. e o portao de item da tela recusa **todo** ator que o alcance, com o mesmo
  //    `msgid`: o legado nao distingue na interface "nao pode" de "e
  //    indestrutivel", e os dois terminam no mesmo `wp_die` de `:117`.
  for (const quem of [ator('editor'), ator('author'), ATOR_ANONIMO]) {
    const daVez = cenario({
      ator: quem,
      valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
    });
    daVez.falsa.responder([linhaDoPadrao()]);

    assert.deepEqual(
      daVez.modulo.permissaoDeApagarRotulo(daVez.portao, ROTULO_PADRAO),
      RECUSA_DO_PORTAO_DE_APAGAR,
    );
    assert.deepEqual(daVez.falsa.escritas, []);
  }

  // E a recusa do editor **nao** e falta de capacidade: ele tem
  // `manage_categories`, e o mesmo portao o aprova no rotulo que nao e o padrao.
  // Sem esta asercao o laco acima passaria por acidente para dois dos tres.
  const comPoder = cenario({
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });
  comPoder.falsa.responder([
    linhaDeTermo({ term_id: ROTULO, term_taxonomy_id: ROTULO_NO_CONTEXTO }),
  ]);
  assert.deepEqual(
    comPoder.modulo.permissaoDeApagarRotulo(comPoder.portao, ROTULO),
    { permitido: true },
  );
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-037-2 `erro` — "mantem a recusa diante do ator de maior poder da
   instalacao"

   Prova (CA-5.2): "A recusa vence inclusive o ator de maior poder da
   instalacao"
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-037-2 mantem a recusa diante do ator de maior poder da instalacao (CA-5.2)', () => {
  const { falsa, modulo, exclusao, portao } = cenario({
    base: BASE_EM_REDE,
    ator: SUPER_ADMIN,
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });

  // Entrada: instalacao **em rede**, e o super administrador — sem papel e sem
  // capacidade nenhuma na matriz. Fora da rede o atalho de *"tem tudo"* nao
  // existe, e e por isso que esta base e outra (ADR 0009, a assimetria de
  // `is_super_admin()`).
  falsa.responder([linhaDoPadrao()]);

  // 1. pelo portao de item: `do_not_allow` e verificado **dentro** do atalho do
  //    super administrador, e e a unica coisa que o detem (`capabilities.php:738`-
  //    `:744`, ADR 0009).
  assert.deepEqual(
    modulo.permissaoDeApagarRotulo(portao, ROTULO_PADRAO),
    RECUSA_DO_PORTAO_DE_APAGAR,
  );

  // 2. e pela funcao, que o alcanca pelo mesmo caminho dos outros: nao ha ator
  //    dentro de `wp_delete_term()`, logo nao ha como ser super administrador ali.
  falsa.responder([linhaDoPadrao()]);
  assert.equal(
    modulo.apagarRotuloDoContexto(exclusao, {
      rotuloId: ROTULO_PADRAO,
      contexto: CONTEXTO_DE_CATEGORIA,
    }),
    RECUSA_DO_TERMO_PADRAO,
  );

  // A invariante, nos dois caminhos: nada foi escrito.
  assert.deepEqual(falsa.escritas, []);

  // ⚠️ **E a negacao e so a do padrao.** O mesmo super administrador passa no
  // rotulo que nao e o padrao, **sem ter capacidade nenhuma na matriz** — e o
  // *"recebe tudo, menos o negado explicitamente"* de `PERM-9`. Sem esta metade o
  // teste passaria tambem para um porte que negasse tudo ao super admin.
  falsa.responder([
    linhaDeTermo({ term_id: ROTULO, term_taxonomy_id: ROTULO_NO_CONTEXTO }),
  ]);
  assert.deepEqual(modulo.permissaoDeApagarRotulo(portao, ROTULO), {
    permitido: true,
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-037-3 `feliz` — "libera a remocao do termo anterior depois da troca do
   padrao"

   Prova (CA-5.3): "Trocar qual termo e o padrao e permitido, e so entao o
   anterior pode ser apagado"                           @cascata @invariante
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-037-3 libera a remocao do termo anterior depois da troca do padrao (CA-5.3)', () => {
  const { falsa, modulo, exclusao, portao, gravarOpcao, chavesLidas } = cenario({
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });

  // Entrada, primeiro momento: a opcao aponta para o rotulo `1`, e ele e
  // indestrutivel — e o estado de `UT-037-1`, e o caso comeca dele porque o
  // *"so entao"* do criterio e uma **ordem**, e nao duas afirmacoes soltas.
  falsa.responder([linhaDoPadrao()]);
  assert.equal(
    modulo.apagarRotuloDoContexto(exclusao, {
      rotuloId: ROTULO_PADRAO,
      contexto: CONTEXTO_DE_CATEGORIA,
    }),
    RECUSA_DO_TERMO_PADRAO,
  );
  assert.deepEqual(falsa.escritas, []);

  /* Acao: **a troca do padrao**, que e uma escrita em `options` e nao mora neste
     contexto — nenhuma funcao de termo do legado grava a opcao do termo padrao
     (`plataforma/opcoes/` e a tela de escrita das opcoes). O que esta suite
     exercita e o **efeito** dela: a mesma opcao, lida por ligacao tardia a cada
     chamada, passa a devolver outro valor. */
  gravarOpcao(OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA, ROTULO);

  // Resultado: o **mesmo** rotulo que a primeira metade recusou apagar e apagado
  // agora, com a cascata inteira e os tres comandos na ordem do legado.
  programarExclusaoSemObjetos(falsa, linhaDoPadrao());
  assert.equal(
    modulo.apagarRotuloDoContexto(exclusao, {
      rotuloId: ROTULO_PADRAO,
      contexto: CONTEXTO_DE_CATEGORIA,
    }),
    true,
  );
  assert.deepEqual(textos(falsa.escritas), COMANDOS_DA_EXCLUSAO);

  // E a outra metade do *"so entao"*: o **novo** padrao passou a ser o
  // indestrutivel, pelos dois caminhos. A regra nao aponta para o nada em nenhum
  // dos dois momentos, que e o objetivo da historia.
  falsa.responder([
    linhaDeTermo({ term_id: ROTULO, term_taxonomy_id: ROTULO_NO_CONTEXTO }),
  ]);
  assert.equal(
    modulo.apagarRotuloDoContexto(exclusao, {
      rotuloId: ROTULO,
      contexto: CONTEXTO_DE_CATEGORIA,
    }),
    RECUSA_DO_TERMO_PADRAO,
  );

  falsa.responder([
    linhaDeTermo({ term_id: ROTULO, term_taxonomy_id: ROTULO_NO_CONTEXTO }),
  ]);
  assert.deepEqual(
    modulo.permissaoDeApagarRotulo(portao, ROTULO),
    RECUSA_DO_PORTAO_DE_APAGAR,
  );

  // ⚠️ **Nada foi resolvido no carregamento**: a opcao e lida **a cada** chamada,
  // e sao quatro chamadas com a mesma chave. Um modulo que a resolvesse uma vez
  // responderia a terceira pergunta com o padrao antigo, e e exatamente o que o
  // criterio proibe (`EXT-CONTEXTO`, dimensao D-A de `parity_specs.md`).
  assert.deepEqual(chavesLidas, [
    OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
    OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
    OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
    OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA,
  ]);
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-037-4 `erro` — "recusa a remocao do termo padrao tambem na acao em lote e
   pela superficie programatica"

   Prova (regra de negocio): "O termo padrao do contexto e indestrutivel, e a
   negacao vence ate o ator de maior poder"                         @cascata
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-037-4 recusa a remocao do termo padrao tambem na acao em lote e pela superficie programatica (regra)', () => {
  const { falsa, modulo, exclusao, portao, chavesLidas } = cenario({
    base: BASE_EM_REDE,
    ator: SUPER_ADMIN,
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });

  /* 1. **A superficie programatica**: `wp_delete_term()` chamada direto, sem tela
        e sem ator. E o caminho que a API REST, o XML-RPC, a fila agendada e uma
        extensao percorrem, e o `return 0` do passo 2 alcanca os quatro. */
  falsa.responder([linhaDoPadrao()]);
  assert.equal(
    modulo.apagarRotuloDoContexto(exclusao, {
      rotuloId: ROTULO_PADRAO,
      contexto: CONTEXTO_DE_CATEGORIA,
    }),
    RECUSA_DO_TERMO_PADRAO,
  );
  assert.deepEqual(textos(falsa.escritas), []);

  /* 2. **A acao em lote.** O portao dela responde *"pode"*, e isso **nao** e um
        descuido deste teste: ele cobra `$tax->cap->delete_terms`, no plural e sem
        o termo em maos, logo nao passa pelo `case` de objeto e nao le a opcao. Ver
        a correcao de leitura no cabecalho desta suite e no de
        `./permissao-sobre-rotulo.ts`. */
  const chavesAntesDoLote = chavesLidas.length;
  assert.deepEqual(
    modulo.permissaoDeApagarRotulosEmLote(
      { base: BASE_EM_REDE, ator: SUPER_ADMIN },
      CONTEXTO_DE_CATEGORIA,
    ),
    { permitido: true },
  );
  // *"antes de tocar qualquer registro"* (UC-08, *Excecoes*): nem leitura, nem
  // opcao — a ausencia e literal.
  assert.equal(chavesLidas.length, chavesAntesDoLote);

  /* E o lote e um `foreach` de `wp_delete_term()`: quem recusa **dentro** dele e o
     mesmo `return 0`, item por item. O resultado observavel e que o padrao
     sobrevive e os **outros** termos do lote sao apagados — endurecer o portao
     para negar o lote inteiro recusaria o que o legado aceita (P1). */
  const escritasAntesDoLote = falsa.escritas.length;

  for (const rotuloId of [ROTULO_PADRAO, ROTULO, OUTRO_ROTULO]) {
    if (rotuloId === ROTULO_PADRAO) {
      falsa.responder([linhaDoPadrao()]);
      assert.equal(
        modulo.apagarRotuloDoContexto(exclusao, {
          rotuloId,
          contexto: CONTEXTO_DE_CATEGORIA,
        }),
        RECUSA_DO_TERMO_PADRAO,
      );
      continue;
    }

    programarExclusaoSemObjetos(
      falsa,
      linhaDeTermo({
        term_id: rotuloId,
        term_taxonomy_id:
          rotuloId === ROTULO ? ROTULO_NO_CONTEXTO : OUTRO_ROTULO_NO_CONTEXTO,
      }),
    );
    assert.equal(
      modulo.apagarRotuloDoContexto(exclusao, {
        rotuloId,
        contexto: CONTEXTO_DE_CATEGORIA,
      }),
      true,
    );
  }

  // Os dois rotulos que nao sao o padrao emitiram a cascata inteira; o padrao nao
  // emitiu comando nenhum. O conjunto exato do que sumiu e do que ficou, que e o
  // que o **P5** cobra.
  assert.deepEqual(textos(falsa.escritas.slice(escritasAntesDoLote)), [
    ...COMANDOS_DA_EXCLUSAO,
    ...COMANDOS_DA_EXCLUSAO,
  ]);
  for (const escrita of falsa.escritas) {
    assert.notDeepEqual(escrita.parametros, [ROTULO_PADRAO]);
    assert.notDeepEqual(escrita.parametros, [ROTULO_PADRAO_NO_CONTEXTO]);
  }

  /* 3. **"e a negacao vence ate o ator de maior poder"**, que e a segunda metade
        da regra. Os tres caminhos acima correram com o super administrador da rede
        na colaboracao, e o portao de item — o unico dos tres que tem ator — o nega
        tambem. */
  falsa.responder([linhaDoPadrao()]);
  assert.deepEqual(
    modulo.permissaoDeApagarRotulo(portao, ROTULO_PADRAO),
    RECUSA_DO_PORTAO_DE_APAGAR,
  );
});

/* ══════════════════════════════════════════════════════════════════════════
   UT-037-5 `erro` — "mantem a negacao quando um ponto de extensao tenta
   conceder a remocao"

   Prova (regra de negocio): "ADR 0009 — negacao explicita que vence o super
   admin"                                                        @invariante
   ══════════════════════════════════════════════════════════════════════════ */

test('UT-037-5 mantem a negacao quando um ponto de extensao tenta conceder a remocao (ADR 0009)', () => {
  /** O que o ponto de extensao recebeu em `$caps`, uma entrada por chamada. */
  const registroDeChamadas: string[][] = [];

  /* Entrada: um interceptador no ponto de extensao `user_has_cap` que tenta
     **conceder** a propria negacao, mais a capacidade real por cima. O ator e o
     `author`, que nao tem `manage_categories` — logo, se o interceptador valesse,
     ele passaria. */
  const comInterceptador = cenario({
    base: {
      ...BASE,
      ganchos: {
        aoMontarCapacidadesDoAtor: (capacidades, exigidas) => {
          registroDeChamadas.push([...exigidas]);
          return new Map([
            ...capacidades,
            [CAPACIDADE_NEGADA, true],
            ['manage_categories', true],
          ]);
        },
      },
    },
    ator: ator('author'),
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });

  comInterceptador.falsa.responder([linhaDoPadrao()]);

  // Resultado: negado. ADR 0009, garantia 1 — *"ninguem pode ter a capacidade"*:
  // ela e removida do mapa **depois** do ponto de extensao, com o comentario
  // *"Nobody is allowed to do things they are not allowed to do."*, logo *"um
  // plugin que a conceda por filtro nao consegue nada"*.
  assert.deepEqual(
    comInterceptador.modulo.permissaoDeApagarRotulo(
      comInterceptador.portao,
      ROTULO_PADRAO,
    ),
    RECUSA_DO_PORTAO_DE_APAGAR,
  );

  // E o interceptador **rodou**, e recebeu a negacao na lista exigida: sem esta
  // asercao o teste passaria tambem para um porte que simplesmente nao chamasse o
  // ponto de extensao — o que seria quebrar o **P2**, nao cumprir a regra.
  assert.deepEqual(registroDeChamadas, [[CAPACIDADE_NEGADA]]);
  assert.deepEqual(comInterceptador.falsa.escritas, []);

  // O **mesmo** interceptador funciona para o que nao esta negado: e assim que se
  // sabe que a asercao acima nao passou por acidente. `user_has_cap` *"pode
  // conceder e pode retirar"*, e aqui ele concede de verdade.
  comInterceptador.falsa.responder([
    linhaDeTermo({ term_id: ROTULO, term_taxonomy_id: ROTULO_NO_CONTEXTO }),
  ]);
  assert.deepEqual(
    comInterceptador.modulo.permissaoDeApagarRotulo(
      comInterceptador.portao,
      ROTULO,
    ),
    { permitido: true },
  );

  /* ⚠️ **E a ORDEM, que e a garantia 2 e e a outra metade do nome do ADR.** Com o
     super administrador o atalho roda **antes** do ponto de extensao, logo o
     interceptador nem e consultado — *"nenhum plugin consegue retirar poder do
     super admin por ali, so `map_meta_cap()` o detem"*. A negacao continua
     vencendo, e por dentro do atalho. */
  const chamadasEmRede: string[][] = [];
  const emRede = cenario({
    base: {
      ...BASE_EM_REDE,
      ganchos: {
        aoMontarCapacidadesDoAtor: (capacidades, exigidas) => {
          chamadasEmRede.push([...exigidas]);
          return new Map([...capacidades, [CAPACIDADE_NEGADA, true]]);
        },
      },
    },
    ator: SUPER_ADMIN,
    valoresDeOpcao: { [OPCAO_DO_TERMO_PADRAO_DA_CATEGORIA]: ROTULO_PADRAO },
  });

  emRede.falsa.responder([linhaDoPadrao()]);
  assert.deepEqual(
    emRede.modulo.permissaoDeApagarRotulo(emRede.portao, ROTULO_PADRAO),
    RECUSA_DO_PORTAO_DE_APAGAR,
  );
  assert.deepEqual(chamadasEmRede, []);
  assert.deepEqual(emRede.falsa.escritas, []);
});
