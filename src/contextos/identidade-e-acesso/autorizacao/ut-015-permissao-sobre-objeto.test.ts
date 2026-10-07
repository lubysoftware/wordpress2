/**
 * A entrega de **T018**: *"7 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-015-1, UT-015-2, UT-015-3, UT-015-4,
 * UT-015-5, UT-015-6, UT-015-7), com o mesmo dado de entrada, acao e resultado
 * esperado. Os 2 testes de regra de negocio (UT-015-6, UT-015-7) entram na
 * mesma suite."*
 *
 * ---
 *
 * ⚠️ **`backlog/tests.md` NAO EXISTE nesta arvore, e os sete casos foram
 * RECONSTRUIDOS, nao copiados.** O caminho que `tasks.md` cita resolve para
 * `backlog/tests.md` na raiz do repositorio, e ali nao ha nada: nem a pasta
 * `backlog/`, nem o arquivo, nem copia em `_discovery/`. As unicas mencoes ao
 * catalogo no pacote entregue o descrevem **de fora** — `parity_specs.md`
 * (*"os **985 testes** de `../backlog/tests.md` sao especificacao, nao
 * evidencia"*) e a primeira *Pergunta em aberto* de `spec.md`. T008 e T016
 * encontraram a mesma ausencia e a registraram do mesmo modo, em
 * `../sessao/ut-003-expiracao-de-sessao.test.ts` e em
 * `./ut-014-autorizacao-por-capacidade.test.ts`.
 *
 * **Como os sete foram reconstruidos.** A aritmetica e a mesma que T016 ja
 * registrou e conferiu nas onze historias da feature: `tasks.md` diz que US-8
 * tem **7** casos e que **2** deles sao *"testes de regra de negocio (UT-015-6,
 * UT-015-7)"*; sobram 5, e US-8 tem exatamente **5** criterios de aceite, na
 * ordem; e `spec.md` lista para US-8 exatamente **2** regras de negocio. A
 * correspondencia adotada:
 *
 * | caso | o que afirma | fonte |
 * |---|---|---|
 * | `UT-015-1` | CA-8.1 — editar ou apagar resolve em capacidades distintas conforme o ator ser ou nao o autor | `spec.md`, US-8 |
 * | `UT-015-2` | CA-8.2 — para conteudo descartado, a permissao e decidida pelo estado anterior ao descarte | `spec.md`, US-8; UC-09 passo 3, UC-10 passo 2 |
 * | `UT-015-3` | CA-8.3 — conteudo que nao existe mais nega a acao, em lugar de permitir por omissao | `spec.md`, US-8; `PERM-5` (BR-MIGRAR-091) |
 * | `UT-015-4` | CA-8.4 — tipo ou estado nao registrado, e o aviso de uso indevido | `spec.md`, US-8; `PERM-4` (BR-MIGRAR-090) — ver a nota 🔴 abaixo |
 * | `UT-015-5` | CA-8.5 — conteudo com funcao especial declarada exige a capacidade dessa funcao | `spec.md`, US-8; `PERM-5`, UC-07 |
 * | `UT-015-6` | a 1ª regra de US-8: *"a resolucao de edicao depende de quem e o autor e de em que estado o conteudo esta"* (`PERM-3` / BR-MIGRAR-089, `permissions.md §5.1`) | `spec.md`, US-8, 1ª regra |
 * | `UT-015-7` | a 2ª regra de US-8: `D5` — *"a pagina de politica de privacidade e protegida pela propria capacidade de privacidade"* (BR-MIGRAR-043, `domain.md §2.5`) | `spec.md`, US-8, 2ª regra |
 *
 * **O que isto deixa devendo, declarado para nao ser descoberto depois:** se o
 * catalogo aparecer e um UT-015-* tiver dado de entrada diferente do que esta
 * aqui, o caso de la vale e este arquivo muda. A reconstrucao nao inventa
 * comportamento — cada assercao sai de `spec.md`, de `target_business_rules.md`
 * (`PERM-3`, `PERM-4`, `PERM-5`, `D4`, `D5`) ou de UC-03, UC-07, UC-09 e UC-10,
 * que sao os casos de uso que a tabela de rastreabilidade de `spec.md` liga a
 * US-8.
 *
 * ---
 *
 * # Nao sao os testes de criterio de T017, e a diferenca e o nivel
 *
 * T017 entrega *"o comportamento de US-8 existe e os criterios CA-8.1 a CA-8.5
 * passam"* e tem a suite dela em
 * `../../../plataforma/autorizacao/us-8-permissao-sobre-objeto.test.ts`, no nivel
 * da **unidade**: matriz escrita a mao, papeis de nome inventado e tipos de
 * conteudo de nome inventado — de proposito, porque *"nenhum ramo da traducao
 * olha o nome do tipo"* e um teste com os nomes de fabrica passaria por acidente.
 *
 * Esta suite e o catalogo UT-015-*, no nivel do **cenario**: cada caso parte de
 * uma instalacao com banco, atravessa a matriz **gravada** na opcao
 * `{site}user_roles` pelas oito rotinas de povoamento, a autorizacao da conta
 * **gravada** na chave `{site}capabilities`, o codec do formato serializado e o
 * adaptador de `fonte-de-papeis.ts`, e so entao chega a `perguntarPermissao`
 * sobre os tipos de conteudo **de fabrica**. E por isso que ela afirma as frases
 * que os casos de uso dizem do produto e a suite de unidade nao podia dizer:
 * *"o editor nao edita a pagina inicial"*, *"nenhuma capacidade de pagina chega a
 * autor ou colaborador"*, e o colaborador que **nao** mexe no proprio conteudo
 * depois de publicado. As duas suites afirmam a mesma regra por caminhos
 * diferentes: se so a politica estiver certa e a costura com o dado estiver
 * errada, esta e a que abre.
 *
 * E e por isso que ela mora aqui, em `contextos/`, e nao ao lado da politica: a
 * regra de dependencia 2 de `target_architecture.md` proibe `plataforma/`
 * importar `contextos/`, e um caso de ponta a ponta precisa dos dois lados.
 *
 * **T018 depende de T017** (`tasks.md`: *"depende de: T017"*), e por isso importa
 * `plataforma/autorizacao/` e `./fonte-de-papeis.js`: numa arvore sem T015 e sem
 * T017 esta suite nao compila, que e o que a dependencia declarada significa.
 * Nenhum arquivo fora desta suite e tocado, como o `[P]` de T018 exige.
 *
 * ---
 *
 * # ⚠️ O lado do conteudo e FIXTURE desta suite, e a razao esta no recorte
 *
 * Tres coisas que `map_meta_cap()` le do conteudo **nao tem dono nesta arvore**:
 * o registro de conteudo (`{site}posts`), o metadado de conteudo
 * (`{site}postmeta`) e as opcoes das tres paginas de funcao especial. Conteudo e
 * BC-01 e as opcoes sao a plataforma transversal; `tasks.md` nao da nenhum dos
 * dois a esta feature, e T017 resolveu isso declarando
 * {@link FonteDeConteudoNaAutorizacao} como **porta** — *"a interface e declarada
 * embaixo e implementada em cima"*.
 *
 * Logo o que atravessa o armazenamento real aqui e o lado da **autorizacao** —
 * a matriz de papeis e a autorizacao da conta, que e o lado que esta feature
 * porta —, e o lado do **conteudo** e montado por esta suite. O registro dos
 * tipos de fabrica tambem: {@link capacidadesDerivadas} reproduz a derivacao que
 * o legado faz de `capability_type` (`post`/`posts`, `page`/`pages`), que e o que
 * UC-07 descreve em uma linha — *"a capacidade muda de familia:
 * `edit_others_pages`"*. Quando BC-01 existir, o que troca e de onde o registro
 * vem, nao o que estes sete casos afirmam.
 *
 * ---
 *
 * # 🔴 Duas divergencias entre a spec e a analise, registradas e NAO resolvidas
 *
 * **1. CA-8.4 e BR-MIGRAR-090 nao dizem a mesma coisa.** `spec.md` pede *"tipo ou
 * estado nao registrado **nega a acao** e produz aviso de uso indevido"*;
 * `PERM-4` (confianca 🟢) diz que os tres ramos *"degradam para a capacidade mais
 * alta, `edit_others_posts`, com aviso"* — o que nega a quem nao a tem e **nao**
 * nega a quem a tem. T017 seguiu a analise, pelo **P1** (*"reproduza o
 * comportamento observavel do sistema analisado"*, e divergir exige decisao
 * humana registrada, que nao existe). UT-015-4 fixa o comportamento implementado
 * e afirma os **dois lados** do efeito, com os nomes dos papeis de fabrica: o
 * autor e o colaborador sao negados, o editor e a administradora **passam**. Se a
 * leitura literal de CA-8.4 for a que vale, e a linha do editor que muda.
 *
 * **2. O fluxo alternativo da lixeira de UC-07 descreve uma leitura que a
 * implementacao nao faz para conteudo alheio.** UC-07 diz, no fluxo *"O conteudo
 * esta na lixeira"*: *"a autorizacao passa a depender do **estado anterior**, lido
 * de `_wp_trash_meta_status`"* e *"um conteudo que estava publicado continua
 * exigindo `delete_published_posts` enquanto esta na lixeira"* — e UC-07 e o caso
 * de uso de conteudo **de outro autor**. A implementacao de T017 le a memoria da
 * lixeira **so** no ramo do proprio (*"para o conteudo de outra pessoa o legado
 * nao le `_wp_trash_meta_status`"*), o que concorda com a linha de autorizacao de
 * UC-09 (*"do proprio e publicado exige `delete_published_posts`; de outro,
 * `delete_others_posts`"*) e com UC-10, cujo ator e o autor. UT-015-2 fixa o
 * comportamento implementado, **afirma que a memoria nao e consultada** no ramo
 * do alheio e nomeia aqui a linha de UC-07 que diria o contrario. Escolher entre
 * as duas leituras e conferencia contra o oraculo executavel (`ESC-ORACULO`,
 * BR-MIGRAR-116), que nesta arvore nao existe — e nao e decisao de quem escreve
 * teste.
 *
 * ---
 *
 * # 🔴 O conflito REQ-017 e exercitado nos dois lados, e nenhum e escolhido
 *
 * As pseudocapacidades de nivel numerico estao em disputa entre o card `REQ-017`
 * (prioridade `wont`) e a resposta 5 de `questions.md`, e a tabela **Nao
 * negociavel** da constituicao poe a reconciliacao fora do alcance de quem
 * codifica. Como em T016, **todo caso roda nos dois lados**, com a mesma
 * expectativa, dentro de um unico `test()`: a contagem de sete casos continua
 * sendo sete e nenhum lado e escolhido por omissao.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAPACIDADE_DA_PAGINA_ESPECIAL,
  CAPACIDADE_DE_PRIVACIDADE,
  CAPACIDADE_DE_PRIVACIDADE_EM_REDE,
  CAPACIDADE_MAIS_ALTA,
  CAPACIDADE_NEGADA,
  CHAVE_DO_ESTADO_ANTERIOR_NA_LIXEIRA,
  ESTADOS_PUBLICADOS,
  ESTADO_DE_LIXEIRA,
  ESTADO_PRIVADO,
  OPCAO_DA_PAGINA_DE_CONTEUDOS,
  OPCAO_DA_PAGINA_DE_POLITICA,
  OPCAO_DA_PAGINA_INICIAL,
  REDE_INATIVA_NA_AUTORIZACAO,
  TIPO_DE_REVISAO,
  atorDeAutorizacao,
  capacidadesExigidas,
  casoDeConteudo,
  comAtor,
  perguntarPermissao,
  traducaoDePrivacidade,
  type AvisoDeUsoIndevido,
  type BaseDeAutorizacao,
  type Capacidade,
  type ConteudoNaAutorizacao,
  type EstadoDaRedeNaAutorizacao,
  type EstadoDeConteudoNaAutorizacao,
  type FonteDeAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  criarArmazenamento,
  type ConcessaoDeCapacidade,
  type LadoDoConflitoDeNivelNumerico,
} from '../armazenamento/index.js';
import type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ValorDeColuna,
} from '../portas/index.js';
import { criarFonteDeAutorizacao, matrizGravada } from './fonte-de-papeis.js';

// ===========================================================================
// O lado da AUTORIZACAO: uma instalacao com banco, nos dois lados de REQ-017
// ===========================================================================

/** Os dois lados do conflito REQ-017, percorridos por todos os sete casos. */
const LADOS: readonly LadoDoConflitoDeNivelNumerico[] = [
  'legado-integral',
  'req-017-sem-niveis',
];

const PREFIXO = 'wp_';

interface LinhaDeMetadado {
  readonly umeta_id: number;
  readonly user_id: number;
  readonly meta_key: string;
  readonly meta_value: ValorDeColuna;
}

interface Banco {
  /** Toda consulta pedida, na ordem — o criterio desta area e efeito no banco. */
  readonly consultas: Consulta[];
  readonly porta: PortaDeDados;
  inserirLinhaDeConta(id: number, login: string): void;
}

/**
 * O banco desta suite: registra toda consulta e responde a partir do que foi
 * escrito.
 *
 * `../armazenamento/porta-falsa.ts` responde em fila, e nao serve aqui pela mesma
 * razao que nao serviu em T016: **um caso de US-8 atravessa varias leituras
 * encadeadas** — semear a opcao, reler a opcao, ler a autorizacao da conta, ler o
 * login — e com fila a ordem dela passaria a ser o objeto do teste. Toda consulta
 * nao prevista **lanca**, para o caso dizer qual mudou de forma em vez de
 * responder vazio e falhar tres passos adiante.
 */
function criarBanco(): Banco {
  const opcoes = new Map<string, ValorDeColuna>();
  const metadados: LinhaDeMetadado[] = [];
  const contas = new Map<number, string>();
  const consultas: Consulta[] = [];
  let proximoMetaId = 1;

  function responderLeitura(consulta: Consulta): readonly LinhaDeResultado[] {
    const { texto, parametros } = consulta;

    if (texto.startsWith('SELECT option_value FROM ')) {
      const valor = opcoes.get(comoCadeia(parametros[0]));
      return valor === undefined ? [] : [{ option_value: valor }];
    }

    if (texto.startsWith('SELECT umeta_id, user_id, meta_key, meta_value FROM ')) {
      const contaId = Number(parametros[0]);
      const chave = texto.includes('AND meta_key = ?')
        ? comoCadeia(parametros[1])
        : null;
      return metadados
        .filter(
          (linha) =>
            linha.user_id === contaId &&
            (chave === null || linha.meta_key === chave),
        )
        .map((linha) => ({ ...linha }));
    }

    if (texto.startsWith('SELECT ID, user_login')) {
      const id = Number(parametros[0]);
      const login = contas.get(id);
      return login === undefined ? [] : [{ ID: id, user_login: login }];
    }

    throw new Error(`leitura nao prevista por esta montagem: ${texto}`);
  }

  function responderEscrita(consulta: Consulta): void {
    const { texto, parametros } = consulta;

    if (texto.includes('(option_name, option_value) VALUES')) {
      opcoes.set(comoCadeia(parametros[0]), parametros[1] ?? null);
      return;
    }

    if (texto.includes('SET option_value = ?')) {
      opcoes.set(comoCadeia(parametros[1]), parametros[0] ?? null);
      return;
    }

    if (texto.includes('(user_id, meta_key, meta_value) VALUES')) {
      metadados.push({
        umeta_id: proximoMetaId,
        user_id: Number(parametros[0]),
        meta_key: comoCadeia(parametros[1]),
        meta_value: parametros[2] ?? null,
      });
      proximoMetaId += 1;
      return;
    }

    if (texto.includes('SET meta_value = ?')) {
      const contaId = Number(parametros[1]);
      const chave = comoCadeia(parametros[2]);
      for (let indice = 0; indice < metadados.length; indice += 1) {
        const linha = metadados[indice] as LinhaDeMetadado;
        if (linha.user_id === contaId && linha.meta_key === chave) {
          metadados[indice] = { ...linha, meta_value: parametros[0] ?? null };
        }
      }
      return;
    }

    throw new Error(`escrita nao prevista por esta montagem: ${texto}`);
  }

  return {
    consultas,

    porta: {
      prefixoDeTabela: PREFIXO,
      prefixoBaseDeTabela: PREFIXO,
      selecionar(consulta) {
        consultas.push(consulta);
        return responderLeitura(consulta);
      },
      escrever(consulta) {
        consultas.push(consulta);
        responderEscrita(consulta);
        return { linhasAfetadas: 1, idGerado: proximoMetaId };
      },
    },

    inserirLinhaDeConta(id, login) {
      contas.set(id, login);
    },
  };
}

/** O valor de uma coluna ou de um parametro como texto. */
function comoCadeia(valor: ValorDeColuna | undefined): string {
  if (valor === null || valor === undefined) {
    return '';
  }
  if (valor instanceof Uint8Array) {
    return new TextDecoder().decode(valor);
  }
  return String(valor);
}

/** Uma concessao concedida, no formato em que `{site}capabilities` a guarda. */
function concedida(capacidade: string): ConcessaoDeCapacidade {
  return { capacidade, concedida: true };
}

// ===========================================================================
// O lado do CONTEUDO: fixture desta suite. Ver a nota ⚠️ do cabecalho.
// ===========================================================================

/**
 * A derivacao de `capability_type` que o legado faz ao registrar um tipo.
 *
 * As **chaves** sao os slots, sempre no vocabulario de `post`/`posts`, porque e
 * por eles que `traducao-de-conteudo.ts` consulta o registro; os **valores** sao
 * os nomes daquele tipo. E so por esta tabela que a familia de capacidade de
 * pagina existe, sem nenhum `if` sobre o nome `page` na decisao — o que UC-07
 * registra como *"a capacidade muda de familia: `edit_others_pages`"*.
 */
function capacidadesDerivadas(
  singular: string,
  plural: string,
): Readonly<Record<string, Capacidade>> {
  return {
    edit_post: `edit_${singular}`,
    read_post: `read_${singular}`,
    delete_post: `delete_${singular}`,
    edit_posts: `edit_${plural}`,
    edit_others_posts: `edit_others_${plural}`,
    edit_published_posts: `edit_published_${plural}`,
    edit_private_posts: `edit_private_${plural}`,
    publish_posts: `publish_${plural}`,
    delete_posts: `delete_${plural}`,
    delete_others_posts: `delete_others_${plural}`,
    delete_published_posts: `delete_published_${plural}`,
    delete_private_posts: `delete_private_${plural}`,
    read: 'read',
    read_private_posts: `read_private_${plural}`,
    create_posts: `edit_${plural}`,
  };
}

function tipoDeFabrica(
  nome: string,
  singular: string,
  plural: string,
): TipoDeConteudoNaAutorizacao {
  return {
    nome,
    traduzMetaCapacidade: true,
    capacidades: capacidadesDerivadas(singular, plural),
  };
}

/** Os tipos de fabrica que os quatro casos de uso de US-8 alcancam. */
const TIPOS_DE_FABRICA = new Map<string, TipoDeConteudoNaAutorizacao>([
  ['post', tipoDeFabrica('post', 'post', 'posts')],
  ['page', tipoDeFabrica('page', 'page', 'pages')],
  [TIPO_DE_REVISAO, tipoDeFabrica(TIPO_DE_REVISAO, 'post', 'posts')],
]);

/**
 * Os estados de fabrica, com os dois sinalizadores que o caso de ler consulta.
 *
 * `future` entra como **nao publico**, e e isso que o faz cair na resolucao de
 * edicao ao ser lido — ainda que ele conte como *"ja esta publicado"* na
 * resolucao por estado ({@link ESTADOS_PUBLICADOS}).
 */
const ESTADOS_DE_FABRICA = new Map<string, EstadoDeConteudoNaAutorizacao>(
  (
    [
      ['publish', true, false],
      ['future', false, false],
      ['draft', false, false],
      ['pending', false, false],
      [ESTADO_PRIVADO, false, true],
      [ESTADO_DE_LIXEIRA, false, false],
      ['auto-draft', false, false],
      ['inherit', false, false],
    ] as const
  ).map(([nome, publico, privado]) => [nome, { nome, publico, privado }]),
);

/** Um registro de conteudo, com os valores de omissao do legado. */
function conteudo(campos: {
  readonly id: number;
  readonly tipo?: string;
  readonly estado?: string;
  readonly estadoParaLeitura?: string;
  readonly autorId?: number;
  readonly paiId?: number;
}): ConteudoNaAutorizacao {
  const estado = campos.estado ?? 'draft';
  return {
    id: campos.id,
    tipo: campos.tipo ?? 'post',
    estado,
    estadoParaLeitura: campos.estadoParaLeitura ?? estado,
    autorId: campos.autorId ?? 0,
    paiId: campos.paiId ?? 0,
  };
}

/** As tres opcoes de funcao especial, como dado mutavel do caso. */
interface PaginasDeFuncaoEspecial {
  inicial: number;
  conteudos: number;
  politica: number;
}

interface MundoDeConteudo {
  readonly fonte: FonteDeConteudoNaAutorizacao;
  /** Os avisos de uso indevido que a traducao emitiu, na ordem. */
  readonly avisos: AvisoDeUsoIndevido[];
  /** Os identificadores cuja memoria de lixeira foi **consultada**. */
  readonly memoriaConsultada: number[];
  readonly paginas: PaginasDeFuncaoEspecial;
  /** Poe o registro no mundo. */
  por(registro: ConteudoNaAutorizacao): void;
  /** Grava a memoria da lixeira daquele registro — `_wp_trash_meta_status`. */
  lembrarEstadoAnterior(conteudoId: number, estado: string): void;
}

function criarMundoDeConteudo(): MundoDeConteudo {
  const registros = new Map<number, ConteudoNaAutorizacao>();
  const memoria = new Map<number, string>();
  const avisos: AvisoDeUsoIndevido[] = [];
  const memoriaConsultada: number[] = [];
  const paginas: PaginasDeFuncaoEspecial = {
    inicial: 0,
    conteudos: 0,
    politica: 0,
  };

  const fonte: FonteDeConteudoNaAutorizacao = {
    conteudo(referencia) {
      // As duas formas que o legado aceita: o identificador e o proprio
      // registro. Quem resolve as duas e a porta, como o contrato declara.
      if (typeof referencia === 'number') {
        return registros.get(referencia) ?? null;
      }
      if (typeof referencia === 'object' && referencia !== null) {
        const id = (referencia as { readonly id?: unknown }).id;
        return typeof id === 'number' ? registros.get(id) ?? null : null;
      }
      return null;
    },

    tipoDeConteudo(nome) {
      return TIPOS_DE_FABRICA.get(nome) ?? null;
    },

    estadoDeConteudo(nome) {
      return ESTADOS_DE_FABRICA.get(nome) ?? null;
    },

    estadoAnteriorNaLixeira(conteudoId) {
      memoriaConsultada.push(conteudoId);
      // Cadeia vazia e o que `get_post_meta( ..., true )` devolve para metadado
      // ausente, e e legitimo: UC-10 registra o caso.
      return memoria.get(conteudoId) ?? '';
    },

    paginaInicial() {
      return paginas.inicial;
    },

    paginaDeConteudos() {
      return paginas.conteudos;
    },

    paginaDePoliticaDePrivacidade() {
      return paginas.politica;
    },
  };

  return {
    fonte,
    avisos,
    memoriaConsultada,
    paginas,

    por(registro) {
      registros.set(registro.id, registro);
    },

    lembrarEstadoAnterior(conteudoId, estado) {
      memoria.set(conteudoId, estado);
    },
  };
}

// ===========================================================================
// A montagem: os dois lados juntos
// ===========================================================================

interface Instalacao {
  readonly banco: Banco;
  readonly mundo: MundoDeConteudo;
  readonly fonte: FonteDeAutorizacao;
  /** O estado de rede desta instalacao; de fabrica, site unico. */
  rede: EstadoDaRedeNaAutorizacao;
  /**
   * A base da pergunta, com a matriz **relida do armazenamento a cada
   * chamada** — e nao guardada, porque CA-7.2 e o risco 4 do `plan.md` cobram
   * que uma alteracao de papel em execucao passe a valer.
   */
  base(): BaseDeAutorizacao;
  /** A lista exigida — o que `PERM-3` descreve. */
  exigidas(
    contaId: number,
    capacidade: Capacidade,
    ...argumentos: readonly unknown[]
  ): readonly Capacidade[];
  /** A decisao — o que o ator vive. */
  pode(
    contaId: number,
    capacidade: Capacidade,
    ...argumentos: readonly unknown[]
  ): boolean;
  /** Cria a linha de `users` e grava `{site}capabilities` daquela conta. */
  conta(login: string, ...concessoes: readonly ConcessaoDeCapacidade[]): number;
}

function criarInstalacao(lado: LadoDoConflitoDeNivelNumerico): Instalacao {
  const banco = criarBanco();
  const mundo = criarMundoDeConteudo();
  const armazenamento = criarArmazenamento(banco.porta);
  const fonte = criarFonteDeAutorizacao(armazenamento);
  let proximaConta = 1;

  // Os tres momentos em que o legado semeia, e este e o primeiro: instalar.
  armazenamento.papeis.semearMatrizDeFabrica(lado);

  const instalacao: Instalacao = {
    banco,
    mundo,
    fonte,
    rede: REDE_INATIVA_NA_AUTORIZACAO,

    base() {
      return {
        matriz: matrizGravada(armazenamento),
        rede: instalacao.rede,
        // A ordem: o caso de conteudo de T017, e depois a traducao de
        // privacidade, para quem pergunta por ela direto. A revogacao pelas
        // quatro constantes nao entra por aqui — ela e a primeira da ordem
        // declarada em `decisao-de-capacidade.ts`, e nao e substituivel.
        casosDeTraducao: [
          casoDeConteudo(mundo.fonte, (aviso) => {
            mundo.avisos.push(aviso);
          }),
          traducaoDePrivacidade,
        ],
      };
    },

    exigidas(contaId, capacidade, ...argumentos) {
      return capacidadesExigidas(
        comAtor(instalacao.base(), atorDeAutorizacao(contaId, fonte)),
        capacidade,
        ...argumentos,
      );
    },

    pode(contaId, capacidade, ...argumentos) {
      return perguntarPermissao(
        comAtor(instalacao.base(), atorDeAutorizacao(contaId, fonte)),
        capacidade,
        ...argumentos,
      );
    },

    conta(login, ...concessoes) {
      const id = proximaConta;
      proximaConta += 1;
      banco.inserirLinhaDeConta(id, login);
      armazenamento.papeis.gravarCapacidadesDaConta(id, concessoes);
      return id;
    },
  };

  return instalacao;
}

/**
 * As cinco contas de fabrica, uma por papel semeado.
 *
 * Os nomes de papel entram aqui como **dado gravado**, e nao como decisao: o
 * **P3** proibe nome de papel dentro de decisao de autorizacao, e UT-014-1 ja
 * afirma essa busca sobre o fonte. O que esta suite precisa dos cinco e que eles
 * sao os conjuntos de capacidade que os casos de uso nomeiam.
 */
interface ContasDeFabrica {
  readonly administradora: number;
  readonly editora: number;
  readonly autora: number;
  readonly colaboradora: number;
  readonly assinante: number;
}

function contasDeFabrica(instalacao: Instalacao): ContasDeFabrica {
  return {
    administradora: instalacao.conta('ada', concedida('administrator')),
    editora: instalacao.conta('bia', concedida('editor')),
    autora: instalacao.conta('cleo', concedida('author')),
    colaboradora: instalacao.conta('dora', concedida('contributor')),
    assinante: instalacao.conta('eva', concedida('subscriber')),
  };
}

/** A mesma familia, no vocabulario do tipo `page`. Ver {@link capacidadesDerivadas}. */
function familiaDePagina(nomes: readonly string[]): readonly string[] {
  return nomes.map((nome) => nome.replace(/posts$/, 'pages'));
}

// ---------------------------------------------------------------------------
// UT-015-1 — CA-8.1 *"Editar ou apagar um conteudo resolve em capacidades
// distintas conforme o ator ser ou nao o autor"*
//
// entrada:  instalacao de fabrica, nos dois lados do conflito REQ-017; as cinco
//           contas de fabrica; e quatro conteudos do tipo `post` que diferem so
//           em autoria e estado — rascunho da autora, publicado da autora,
//           publicado da editora e privado da editora
// acao:     pedir a lista exigida e a decisao de `edit_post` e de `delete_post`
//           sobre os quatro, para a autora e para a editora
// esperado: o mesmo conteudo resolve em listas diferentes conforme a autoria, a
//           familia de apagar resolve na propria familia, e sao exigidas TODAS
//           as capacidades da lista devolvida e nao qualquer uma
// ---------------------------------------------------------------------------

test('UT-015-1 a autoria decide a lista exigida, e a lista e exigida por inteiro (CA-8.1)', () => {
  for (const lado of LADOS) {
    const instalacao = criarInstalacao(lado);
    const contas = contasDeFabrica(instalacao);

    const rascunhoDaAutora = 10;
    const publicadoDaAutora = 11;
    const publicadoDaEditora = 12;
    const privadoDaEditora = 13;

    instalacao.mundo.por(
      conteudo({ id: rascunhoDaAutora, autorId: contas.autora, estado: 'draft' }),
    );
    instalacao.mundo.por(
      conteudo({ id: publicadoDaAutora, autorId: contas.autora, estado: 'publish' }),
    );
    instalacao.mundo.por(
      conteudo({ id: publicadoDaEditora, autorId: contas.editora, estado: 'publish' }),
    );
    instalacao.mundo.por(
      conteudo({
        id: privadoDaEditora,
        autorId: contas.editora,
        estado: ESTADO_PRIVADO,
      }),
    );

    // O proprio: a capacidade comum, e a de publicado quando ja esta no ar.
    assert.deepEqual(
      [...instalacao.exigidas(contas.autora, 'edit_post', rascunhoDaAutora)],
      ['edit_posts'],
      `${lado}: o proprio rascunho`,
    );
    assert.deepEqual(
      [...instalacao.exigidas(contas.autora, 'edit_post', publicadoDaAutora)],
      ['edit_published_posts'],
      `${lado}: o proprio publicado`,
    );

    // O alheio: a capacidade do alheio, e o estado SOMA uma segunda (UC-07
    // passo 2: *"edit_others_posts + edit_published_posts se publish ou future"*).
    assert.deepEqual(
      [...instalacao.exigidas(contas.editora, 'edit_post', rascunhoDaAutora)],
      ['edit_others_posts'],
      `${lado}: o rascunho alheio`,
    );
    assert.deepEqual(
      [...instalacao.exigidas(contas.autora, 'edit_post', publicadoDaEditora)],
      ['edit_others_posts', 'edit_published_posts'],
      `${lado}: o publicado alheio`,
    );
    assert.deepEqual(
      [...instalacao.exigidas(contas.autora, 'edit_post', privadoDaEditora)],
      ['edit_others_posts', 'edit_private_posts'],
      `${lado}: o privado alheio`,
    );

    // A mesma resolucao, na familia de apagar — a unica diferenca sao os slots.
    assert.deepEqual(
      [...instalacao.exigidas(contas.autora, 'delete_post', rascunhoDaAutora)],
      ['delete_posts'],
      `${lado}: apagar o proprio rascunho`,
    );
    assert.deepEqual(
      [...instalacao.exigidas(contas.autora, 'delete_post', publicadoDaAutora)],
      ['delete_published_posts'],
      `${lado}: apagar o proprio publicado`,
    );
    assert.deepEqual(
      [...instalacao.exigidas(contas.editora, 'delete_post', publicadoDaAutora)],
      ['delete_others_posts', 'delete_published_posts'],
      `${lado}: apagar o publicado alheio`,
    );

    // E a decisao acompanha: *"o mesmo papel mexe no proprio rascunho e nao no
    // publicado de outro"* (US-8).
    assert.equal(
      instalacao.pode(contas.autora, 'edit_post', rascunhoDaAutora),
      true,
      `${lado}: a autora edita o proprio rascunho`,
    );
    assert.equal(
      instalacao.pode(contas.autora, 'edit_post', publicadoDaEditora),
      false,
      `${lado}: a autora nao edita o publicado de outro`,
    );
    assert.equal(
      instalacao.pode(contas.editora, 'edit_post', publicadoDaAutora),
      true,
      `${lado}: a editora edita o publicado de outro`,
    );
    assert.equal(
      instalacao.pode(contas.editora, 'edit_post', privadoDaEditora),
      true,
      `${lado}: a editora edita o proprio privado`,
    );

    // E a decisao atravessou o ARMAZENAMENTO, que e o que distingue esta suite
    // da de unidade de T017: a matriz saiu da opcao `{site}user_roles` e a
    // autorizacao da conta saiu da chave `{site}capabilities`, com o prefixo do
    // site dentro do nome (`PERM-2`, BR-MIGRAR-088).
    instalacao.banco.consultas.length = 0;
    instalacao.pode(contas.editora, 'edit_post', publicadoDaAutora);
    const lidas = instalacao.banco.consultas.map((consulta) => ({
      texto: consulta.texto,
      parametros: consulta.parametros.map((valor) => comoCadeia(valor)),
    }));
    assert.ok(
      lidas.some(
        ({ texto, parametros }) =>
          texto === `SELECT option_value FROM ${PREFIXO}options WHERE option_name = ?` &&
          parametros[0] === `${PREFIXO}user_roles`,
      ),
      `${lado}: a matriz foi relida da opcao gravada`,
    );
    assert.ok(
      lidas.some(
        ({ texto, parametros }) =>
          texto.startsWith(`SELECT umeta_id, user_id, meta_key, meta_value FROM ${PREFIXO}usermeta`) &&
          parametros[1] === `${PREFIXO}capabilities`,
      ),
      `${lado}: a autorizacao da conta foi lida da chave com o prefixo do site`,
    );

    // `PERM-1`: e preciso ter TODAS as devolvidas, nao qualquer uma. Uma conta
    // com `edit_others_posts` individual e SEM papel nenhum mexe no rascunho
    // alheio e para no publicado alheio, que exige as duas.
    const soAlheio = instalacao.conta('fran', concedida('edit_others_posts'));
    assert.equal(
      instalacao.pode(soAlheio, 'edit_post', rascunhoDaAutora),
      true,
      `${lado}: uma capacidade basta onde a lista tem uma`,
    );
    assert.equal(
      instalacao.pode(soAlheio, 'edit_post', publicadoDaEditora),
      false,
      `${lado}: a lista de duas exige as duas`,
    );
  }
});

// ---------------------------------------------------------------------------
// UT-015-2 — CA-8.2 *"Para conteudo descartado, a permissao e decidida pelo
// estado que ele tinha antes do descarte"*
//
// entrada:  instalacao de fabrica, nos dois lados; tres conteudos da
//           colaboradora em `trash`, com a memoria da lixeira em `publish`, em
//           `draft` e **ausente**; e um conteudo alheio em `trash`
// acao:     pedir a lista exigida e a decisao de `delete_post` sobre os quatro
// esperado: o descartado proprio resolve pelo estado anterior — publicado exige
//           a capacidade de publicado e a colaboradora e negada, rascunho e
//           memoria ausente caem na comum e ela passa —, restaurar usa a MESMA
//           capacidade de descartar, e o descartado alheio NAO consulta a
//           memoria
// ---------------------------------------------------------------------------

test('UT-015-2 o descartado e decidido pelo estado anterior, e so no ramo do proprio (CA-8.2)', () => {
  // A chave e superficie publicada, e o **P8** a poe no contrato publico: UC-09
  // passo 3 a nomeia, e extensao de terceiro a le.
  assert.equal(
    CHAVE_DO_ESTADO_ANTERIOR_NA_LIXEIRA,
    '_wp_trash_meta_status',
    'o nome da chave da memoria da lixeira e do legado e nao se traduz',
  );

  for (const lado of LADOS) {
    const instalacao = criarInstalacao(lado);
    const contas = contasDeFabrica(instalacao);

    const eraPublicado = 20;
    const eraRascunho = 21;
    const semMemoria = 22;
    const alheio = 23;

    for (const id of [eraPublicado, eraRascunho, semMemoria]) {
      instalacao.mundo.por(
        conteudo({ id, autorId: contas.colaboradora, estado: ESTADO_DE_LIXEIRA }),
      );
    }
    instalacao.mundo.por(
      conteudo({ id: alheio, autorId: contas.autora, estado: ESTADO_DE_LIXEIRA }),
    );
    instalacao.mundo.lembrarEstadoAnterior(eraPublicado, 'publish');
    instalacao.mundo.lembrarEstadoAnterior(eraRascunho, 'draft');

    // *"Um conteudo que estava publicado continua exigindo
    // `delete_published_posts` enquanto esta na lixeira"* — e a colaboradora, que
    // nao tem essa capacidade na matriz de fabrica, nao alcanca o proprio
    // conteudo depois de ele ter sido publicado.
    assert.deepEqual(
      [...instalacao.exigidas(contas.colaboradora, 'delete_post', eraPublicado)],
      ['delete_published_posts'],
      `${lado}: o descartado que estava publicado`,
    );
    assert.equal(
      instalacao.pode(contas.colaboradora, 'delete_post', eraPublicado),
      false,
      `${lado}: a colaboradora nao apaga o proprio depois de publicado`,
    );

    // Estado anterior nao publicado cai na capacidade comum, e ela passa.
    assert.deepEqual(
      [...instalacao.exigidas(contas.colaboradora, 'delete_post', eraRascunho)],
      ['delete_posts'],
      `${lado}: o descartado que era rascunho`,
    );
    assert.equal(
      instalacao.pode(contas.colaboradora, 'delete_post', eraRascunho),
      true,
      `${lado}: a colaboradora apaga o proprio rascunho descartado`,
    );

    // UC-10 registra a memoria ausente, com o comentario do proprio legado
    // (*"Confidence check. This shouldn't happen."*): nao esta publicado, logo
    // cai na comum.
    assert.deepEqual(
      [...instalacao.exigidas(contas.colaboradora, 'delete_post', semMemoria)],
      ['delete_posts'],
      `${lado}: a memoria ausente nao e "publicado"`,
    );

    // UC-10, campo Autorizacao: *"restaurar usa a mesma capacidade de descartar,
    // resolvida pelo estado anterior"*. Logo quem nao pode descartar tambem nao
    // pode restaurar, e e a mesma pergunta que responde as duas.
    assert.equal(
      instalacao.pode(contas.autora, 'delete_post', eraPublicado),
      false,
      `${lado}: restaurar e descartar perguntam o mesmo, e aqui o alheio nega`,
    );

    // 🔴 O ramo do alheio NAO le a memoria da lixeira. Ver a nota 2 do
    // cabecalho: e aqui que a linha da lixeira de UC-07 diria outra coisa.
    instalacao.mundo.memoriaConsultada.length = 0;
    assert.deepEqual(
      [...instalacao.exigidas(contas.colaboradora, 'delete_post', alheio)],
      ['delete_others_posts'],
      `${lado}: o descartado alheio exige so a capacidade do alheio`,
    );
    assert.deepEqual(
      [...instalacao.mundo.memoriaConsultada],
      [],
      `${lado}: a memoria da lixeira nao foi consultada no ramo do alheio`,
    );

    // E a memoria FOI consultada no ramo do proprio, para o registro
    // perguntado — a assercao oposta, para a de cima nao passar por acidente.
    instalacao.mundo.memoriaConsultada.length = 0;
    instalacao.exigidas(contas.colaboradora, 'delete_post', eraPublicado);
    assert.deepEqual(
      [...instalacao.mundo.memoriaConsultada],
      [eraPublicado],
      `${lado}: a memoria e consultada no ramo do proprio`,
    );
  }
});

// ---------------------------------------------------------------------------
// UT-015-3 — CA-8.3 *"Conteudo que nao existe mais nega a acao, em lugar de
// permitir por omissao"*
//
// entrada:  instalacao de fabrica, nos dois lados; a administradora, que tem
//           toda a familia de conteudo; um identificador que nao existe; uma
//           revisao de um rascunho alheio; e uma revisao orfa
// acao:     perguntar sem informar o objeto, sobre o objeto inexistente, sobre a
//           revisao (editar e apagar) e sobre a revisao orfa — em site unico e
//           com a administradora como super administradora de rede
// esperado: os quatro negam, a lista devolvida e `do_not_allow` e nao vazia, e a
//           negacao vence tambem o super administrador (ADR-0009); editar a
//           revisao atravessa para o conteudo pai
// ---------------------------------------------------------------------------

test('UT-015-3 objeto ausente, inexistente e revisao fecham a porta, e nao concedem por omissao (CA-8.3)', () => {
  for (const lado of LADOS) {
    const instalacao = criarInstalacao(lado);
    const contas = contasDeFabrica(instalacao);

    const rascunhoAlheio = 30;
    const revisao = 31;
    const revisaoOrfa = 32;
    const inexistente = 999;

    instalacao.mundo.por(
      conteudo({ id: rascunhoAlheio, autorId: contas.autora, estado: 'draft' }),
    );
    instalacao.mundo.por(
      conteudo({
        id: revisao,
        tipo: TIPO_DE_REVISAO,
        autorId: contas.autora,
        estado: 'inherit',
        paiId: rascunhoAlheio,
      }),
    );
    instalacao.mundo.por(
      conteudo({ id: revisaoOrfa, tipo: TIPO_DE_REVISAO, estado: 'inherit' }),
    );

    // Perguntar sem informar o objeto NEGA — `PERM-5`, e o cenario @critico de
    // `07-autorizacao-por-capacidade.feature`: *"quando a mesma capacidade e
    // verificada sem informar o objeto, as duas metades negam"*.
    assert.deepEqual(
      [...instalacao.exigidas(contas.administradora, 'edit_post')],
      [CAPACIDADE_NEGADA],
      `${lado}: sem objeto`,
    );
    assert.equal(
      instalacao.pode(contas.administradora, 'edit_post'),
      false,
      `${lado}: sem objeto, nega inclusive a administradora`,
    );

    // O objeto informado nao existe mais: idem, e *"nenhuma das duas concede por
    // ausencia de informacao"*.
    for (const capacidade of ['edit_post', 'delete_post', 'read_post']) {
      assert.deepEqual(
        [...instalacao.exigidas(contas.administradora, capacidade, inexistente)],
        [CAPACIDADE_NEGADA],
        `${lado}: ${capacidade} sobre o inexistente`,
      );
      assert.equal(
        instalacao.pode(contas.administradora, capacidade, inexistente),
        false,
        `${lado}: ${capacidade} sobre o inexistente nega`,
      );
    }

    // *"Revisao nao se apaga por capacidade"* (`PERM-5`; UC-07 e UC-09 repetem a
    // frase na tabela de excecoes).
    assert.deepEqual(
      [...instalacao.exigidas(contas.administradora, 'delete_post', revisao)],
      [CAPACIDADE_NEGADA],
      `${lado}: apagar a revisao`,
    );
    assert.equal(
      instalacao.pode(contas.administradora, 'delete_post', revisao),
      false,
      `${lado}: nem a administradora apaga revisao`,
    );

    // E editar a revisao e transparente: segue para o conteudo pai, e a
    // resolucao e a do pai.
    assert.deepEqual(
      [...instalacao.exigidas(contas.editora, 'edit_post', revisao)],
      ['edit_others_posts'],
      `${lado}: editar a revisao resolve pelo pai`,
    );
    assert.equal(
      instalacao.pode(contas.editora, 'edit_post', revisao),
      true,
      `${lado}: a editora edita a revisao de rascunho alheio`,
    );
    assert.equal(
      instalacao.pode(contas.colaboradora, 'edit_post', revisao),
      false,
      `${lado}: a colaboradora nao, pelo mesmo motivo do pai`,
    );

    // A revisao sem pai fecha a porta, em lugar de resolver em lista vazia.
    assert.deepEqual(
      [...instalacao.exigidas(contas.administradora, 'edit_post', revisaoOrfa)],
      [CAPACIDADE_NEGADA],
      `${lado}: a revisao orfa`,
    );

    // ADR-0009: a negacao explicita e o unico mecanismo que vence o ator de
    // maior poder da instalacao. Em rede, com a administradora na lista de super
    // administradores, apagar revisao continua negado.
    instalacao.rede = { ativa: true, loginsDeSuperAdmin: ['ada'] };
    assert.equal(
      instalacao.pode(contas.administradora, 'delete_post', revisao),
      false,
      `${lado}: do_not_allow vence o super administrador`,
    );
    assert.equal(
      instalacao.pode(contas.administradora, 'edit_post', inexistente),
      false,
      `${lado}: e vence tambem no objeto inexistente`,
    );
    // E o atalho do super administrador funciona no que NAO esta negado — sem
    // isto, a assercao de cima passaria por o atalho estar quebrado.
    assert.equal(
      instalacao.pode(contas.administradora, 'edit_post', rascunhoAlheio),
      true,
      `${lado}: o atalho do super administrador continua valendo`,
    );
  }
});

// ---------------------------------------------------------------------------
// UT-015-4 — CA-8.4 *"Tipo ou estado nao registrado nega a acao e produz aviso
// de uso indevido"*
//
// entrada:  instalacao de fabrica, nos dois lados; um conteudo de um tipo que
//           nao esta registrado, e um conteudo de tipo registrado com estado que
//           nao esta registrado
// acao:     pedir a lista exigida e a decisao das cinco contas de fabrica, com
//           relator de aviso e sem relator
// esperado: os dois ramos degradam para `edit_others_posts` com aviso — logo a
//           assinante, a colaboradora e a autora sao negadas e a editora e a
//           administradora passam —, o aviso e emitido com a funcao, o nome nao
//           registrado e a capacidade pedida, e sem relator a lista e a mesma
// ---------------------------------------------------------------------------

test('UT-015-4 tipo e estado nao registrados degradam para a capacidade mais alta, com aviso (CA-8.4)', () => {
  for (const lado of LADOS) {
    const instalacao = criarInstalacao(lado);
    const contas = contasDeFabrica(instalacao);

    const TIPO_NAO_REGISTRADO = 'tipo-de-extensao-desativada';
    const ESTADO_NAO_REGISTRADO = 'estado-de-extensao-desativada';
    const deTipoSolto = 40;
    const deEstadoSolto = 41;

    instalacao.mundo.por(
      conteudo({
        id: deTipoSolto,
        tipo: TIPO_NAO_REGISTRADO,
        autorId: contas.autora,
        estado: 'publish',
      }),
    );
    instalacao.mundo.por(
      conteudo({
        id: deEstadoSolto,
        autorId: contas.autora,
        estado: ESTADO_NAO_REGISTRADO,
      }),
    );

    // Ramo de tipo: degrada para a capacidade mais alta. Note que a autoria e o
    // estado deixam de decidir — a autora e o alvo mais claro disso, porque ela
    // E a autora e ainda assim e negada.
    assert.deepEqual(
      [...instalacao.exigidas(contas.autora, 'edit_post', deTipoSolto)],
      [CAPACIDADE_MAIS_ALTA],
      `${lado}: tipo nao registrado`,
    );
    assert.deepEqual(
      [...instalacao.exigidas(contas.autora, 'delete_post', deTipoSolto)],
      [CAPACIDADE_MAIS_ALTA],
      `${lado}: tipo nao registrado, familia de apagar`,
    );

    // Ramo de estado: e o unico que so o caso de LER alcanca, porque e o unico
    // que consulta o registro de estado.
    assert.deepEqual(
      [...instalacao.exigidas(contas.autora, 'read_post', deEstadoSolto)],
      [CAPACIDADE_MAIS_ALTA],
      `${lado}: estado nao registrado`,
    );

    // 🔴 Os DOIS lados do efeito. Ver a nota 1 do cabecalho: degradar nega a
    // quem nao tem a capacidade mais alta e NAO nega a quem a tem, e a leitura
    // literal de CA-8.4 mudaria as duas ultimas linhas.
    for (const [quem, conta, esperado] of [
      ['a assinante', contas.assinante, false],
      ['a colaboradora', contas.colaboradora, false],
      ['a autora', contas.autora, false],
      ['a editora', contas.editora, true],
      ['a administradora', contas.administradora, true],
    ] as const) {
      assert.equal(
        instalacao.pode(conta, 'edit_post', deTipoSolto),
        esperado,
        `${lado}: tipo nao registrado — ${quem}`,
      );
      assert.equal(
        instalacao.pode(conta, 'read_post', deEstadoSolto),
        esperado,
        `${lado}: estado nao registrado — ${quem}`,
      );
    }

    // O aviso e observavel (BR-MIGRAR-091), e o que ele publica e a funcao, o
    // nome nao registrado e a capacidade pedida.
    instalacao.mundo.avisos.length = 0;
    instalacao.exigidas(contas.autora, 'edit_post', deTipoSolto);
    instalacao.exigidas(contas.autora, 'read_post', deEstadoSolto);
    assert.equal(
      instalacao.mundo.avisos.length,
      2,
      `${lado}: um aviso por ramo de erro`,
    );
    const [avisoDeTipo, avisoDeEstado] = instalacao.mundo.avisos as [
      AvisoDeUsoIndevido,
      AvisoDeUsoIndevido,
    ];
    assert.equal(avisoDeTipo.funcao, 'map_meta_cap', `${lado}: a funcao que avisa`);
    assert.equal(avisoDeEstado.funcao, 'map_meta_cap', `${lado}: a funcao que avisa`);
    assert.ok(
      avisoDeTipo.mensagem.includes(TIPO_NAO_REGISTRADO) &&
        avisoDeTipo.mensagem.includes('edit_post'),
      `${lado}: o aviso de tipo nomeia o tipo e a capacidade pedida`,
    );
    assert.ok(
      avisoDeEstado.mensagem.includes(ESTADO_NAO_REGISTRADO) &&
        avisoDeEstado.mensagem.includes('read_post'),
      `${lado}: o aviso de estado nomeia o estado e a capacidade pedida`,
    );

    // **P7**: *"registro e diagnostico novos podem ser acrescentados, mas nenhuma
    // decisao do sistema pode passar a depender deles"*. Sem relator, a mesma
    // lista.
    const semRelator: BaseDeAutorizacao = {
      ...instalacao.base(),
      casosDeTraducao: [casoDeConteudo(instalacao.mundo.fonte)],
    };
    assert.deepEqual(
      [
        ...capacidadesExigidas(
          comAtor(semRelator, atorDeAutorizacao(contas.autora, instalacao.fonte)),
          'edit_post',
          deTipoSolto,
        ),
      ],
      [CAPACIDADE_MAIS_ALTA],
      `${lado}: sem relator, a traducao decide igual`,
    );
  }
});

// ---------------------------------------------------------------------------
// UT-015-5 — CA-8.5 *"Conteudo com funcao especial declarada (pagina inicial,
// pagina de conteudos, pagina de politica) exige a capacidade declarada para
// essa funcao, somada ou em lugar da capacidade comum"*
//
// entrada:  instalacao de fabrica, nos dois lados; quatro paginas publicadas da
//           editora, uma apontada por `page_on_front`, uma por `page_for_posts`,
//           uma por `wp_page_for_privacy_policy` e uma sem funcao nenhuma
// acao:     pedir a lista exigida e a decisao de `edit_post`, `delete_post` e
//           `read_post` sobre as quatro, em site unico e em rede
// esperado: a pagina inicial e a de conteudos exigem `manage_options` EM LUGAR
//           da familia de pagina — logo a editora, que tem toda a familia, e
//           negada e a administradora passa —, a de politica SOMA a capacidade
//           de privacidade, ler nao tem nenhum dos dois ramos, e a funcao de
//           pagina inicial PARA o caso antes do ramo de politica
// ---------------------------------------------------------------------------

test('UT-015-5 a funcao especial da pagina troca ou soma a capacidade exigida (CA-8.5)', () => {
  // Os tres nomes de opcao sao superficie publicada, e o **P8** os poe no
  // contrato publico.
  assert.equal(OPCAO_DA_PAGINA_INICIAL, 'page_on_front');
  assert.equal(OPCAO_DA_PAGINA_DE_CONTEUDOS, 'page_for_posts');
  assert.equal(OPCAO_DA_PAGINA_DE_POLITICA, 'wp_page_for_privacy_policy');

  for (const lado of LADOS) {
    const instalacao = criarInstalacao(lado);
    const contas = contasDeFabrica(instalacao);

    const paginaInicial = 50;
    const paginaDeConteudos = 51;
    const paginaDePolitica = 52;
    const paginaComum = 53;

    for (const id of [
      paginaInicial,
      paginaDeConteudos,
      paginaDePolitica,
      paginaComum,
    ]) {
      instalacao.mundo.por(
        conteudo({ id, tipo: 'page', autorId: contas.editora, estado: 'publish' }),
      );
    }
    instalacao.mundo.paginas.inicial = paginaInicial;
    instalacao.mundo.paginas.conteudos = paginaDeConteudos;
    instalacao.mundo.paginas.politica = paginaDePolitica;

    // EM LUGAR da capacidade comum: a lista tem um nome so, e ele nao e da
    // familia de pagina.
    for (const id of [paginaInicial, paginaDeConteudos]) {
      for (const capacidade of ['edit_post', 'delete_post']) {
        assert.deepEqual(
          [...instalacao.exigidas(contas.editora, capacidade, id)],
          [CAPACIDADE_DA_PAGINA_ESPECIAL],
          `${lado}: ${capacidade} sobre a pagina de funcao especial`,
        );
      }
    }

    // A consequencia que UC-07 chama de *"a excecao que mais surpreende quem
    // desenha o papel de editor a partir da tabela"*: a editora tem toda a
    // familia de pagina e ainda assim nao edita a pagina inicial.
    assert.equal(
      instalacao.pode(contas.editora, 'edit_post', paginaComum),
      true,
      `${lado}: a editora edita a propria pagina publicada`,
    );
    assert.equal(
      instalacao.pode(contas.editora, 'edit_post', paginaInicial),
      false,
      `${lado}: o editor nao edita a pagina inicial`,
    );
    assert.equal(
      instalacao.pode(contas.editora, 'edit_post', paginaDeConteudos),
      false,
      `${lado}: nem a pagina de conteudos`,
    );
    assert.equal(
      instalacao.pode(contas.administradora, 'edit_post', paginaInicial),
      true,
      `${lado}: a administradora, que tem manage_options, edita`,
    );

    // SOMADA a capacidade comum: a de politica acrescenta, e nao substitui.
    assert.deepEqual(
      [...instalacao.exigidas(contas.editora, 'edit_post', paginaDePolitica)],
      ['edit_published_pages', CAPACIDADE_DA_PAGINA_ESPECIAL],
      `${lado}: a pagina de politica soma a capacidade de privacidade`,
    );

    // Ler nao tem nenhum dos dois ramos: ler a pagina inicial nao exige
    // `manage_options`, e e assim no legado.
    assert.deepEqual(
      [...instalacao.exigidas(contas.assinante, 'read_post', paginaInicial)],
      ['read'],
      `${lado}: ler a pagina inicial pede so a capacidade de ler`,
    );
    assert.equal(
      instalacao.pode(contas.assinante, 'read_post', paginaInicial),
      true,
      `${lado}: a assinante le a pagina inicial`,
    );

    // A ORDEM dos ramos e regra: a funcao de pagina inicial PARA o caso, logo o
    // ramo de politica nao acontece. Fora de rede as duas capacidades teriam o
    // mesmo nome e a diferenca seria invisivel; em rede,
    // `manage_privacy_options` resolve em `manage_network` (BR-MIGRAR-042) e a
    // diferenca aparece.
    instalacao.rede = { ativa: true, loginsDeSuperAdmin: [] };
    instalacao.mundo.paginas.politica = paginaInicial;
    assert.deepEqual(
      [...instalacao.exigidas(contas.editora, 'delete_post', paginaInicial)],
      [CAPACIDADE_DA_PAGINA_ESPECIAL],
      `${lado}: a pagina inicial que tambem e a de politica para no ramo 3`,
    );
    instalacao.mundo.paginas.politica = paginaDePolitica;
    assert.deepEqual(
      [...instalacao.exigidas(contas.editora, 'delete_post', paginaDePolitica)],
      ['delete_published_pages', CAPACIDADE_DE_PRIVACIDADE_EM_REDE],
      `${lado}: e a de politica que nao e a inicial chega ao ramo 7`,
    );
  }
});

// ---------------------------------------------------------------------------
// UT-015-6 — a 1ª regra de negocio de US-8: *"a resolucao de edicao depende de
// quem e o autor e de em que estado o conteudo esta"* (`PERM-3`,
// BR-MIGRAR-089; `permissions.md §5.1`)
//
// entrada:  instalacao de fabrica, nos dois lados; a matriz de autoria por
//           estado percorrida inteira, para o tipo `post` e para o tipo `page`;
//           um conteudo sem autoria; e uma conta com `edit_post` gravada
// acao:     pedir a lista exigida em cada cruzamento, e as decisoes que os casos
//           de uso nomeiam
// esperado: nenhuma pergunta e respondida por `edit_post` — ele nunca aparece na
//           lista e te-lo gravado nao concede nada —, a familia de pagina sai do
//           registro do tipo e nao de nenhum `if` sobre o nome, nenhuma
//           capacidade de pagina chega a autora ou a colaboradora, e autoria
//           ausente cai no ramo do alheio inclusive para quem nao esta
//           autenticado
// ---------------------------------------------------------------------------

/** O cruzamento de autoria por estado, para a familia de editar do tipo `post`. */
interface CruzamentoDeEdicao {
  readonly estado: string;
  /** Exigidas quando o ator e o autor. */
  readonly propria: readonly string[];
  /** Exigidas quando o conteudo e de outra pessoa. */
  readonly alheia: readonly string[];
}

const CRUZAMENTOS_DE_EDICAO: readonly CruzamentoDeEdicao[] = [
  { estado: 'draft', propria: ['edit_posts'], alheia: ['edit_others_posts'] },
  { estado: 'pending', propria: ['edit_posts'], alheia: ['edit_others_posts'] },
  { estado: 'auto-draft', propria: ['edit_posts'], alheia: ['edit_others_posts'] },
  {
    estado: 'publish',
    propria: ['edit_published_posts'],
    alheia: ['edit_others_posts', 'edit_published_posts'],
  },
  {
    estado: 'future',
    propria: ['edit_published_posts'],
    alheia: ['edit_others_posts', 'edit_published_posts'],
  },
  {
    estado: ESTADO_PRIVADO,
    propria: ['edit_posts'],
    alheia: ['edit_others_posts', 'edit_private_posts'],
  },
  // Sem memoria de lixeira gravada; a memoria e UT-015-2.
  {
    estado: ESTADO_DE_LIXEIRA,
    propria: ['edit_posts'],
    alheia: ['edit_others_posts'],
  },
];

test('UT-015-6 a resolucao de edicao depende de quem e o autor e de em que estado o conteudo esta (PERM-3)', () => {
  // Agendado conta como *"ja esta publicado"* na resolucao por estado, e isso e
  // do legado — UC-07 passo 2 diz a mesma coisa. Quem le so a tela supoe que
  // agendado ainda e rascunho.
  assert.deepEqual(
    [...ESTADOS_PUBLICADOS],
    ['publish', 'future'],
    'os dois estados que contam como publicado',
  );

  for (const lado of LADOS) {
    const instalacao = criarInstalacao(lado);
    const contas = contasDeFabrica(instalacao);

    let proximoId = 60;
    for (const cruzamento of CRUZAMENTOS_DE_EDICAO) {
      for (const tipo of ['post', 'page'] as const) {
        const doProprio = proximoId;
        const doAlheio = proximoId + 1;
        proximoId += 2;

        instalacao.mundo.por(
          conteudo({
            id: doProprio,
            tipo,
            autorId: contas.editora,
            estado: cruzamento.estado,
          }),
        );
        instalacao.mundo.por(
          conteudo({
            id: doAlheio,
            tipo,
            autorId: contas.autora,
            estado: cruzamento.estado,
          }),
        );

        const esperadoProprio =
          tipo === 'page'
            ? familiaDePagina(cruzamento.propria)
            : cruzamento.propria;
        const esperadoAlheio =
          tipo === 'page' ? familiaDePagina(cruzamento.alheia) : cruzamento.alheia;

        assert.deepEqual(
          [...instalacao.exigidas(contas.editora, 'edit_post', doProprio)],
          [...esperadoProprio],
          `${lado}: ${tipo} em ${cruzamento.estado}, do proprio`,
        );
        assert.deepEqual(
          [...instalacao.exigidas(contas.editora, 'edit_post', doAlheio)],
          [...esperadoAlheio],
          `${lado}: ${tipo} em ${cruzamento.estado}, do alheio`,
        );

        // `PERM-3`: *"nenhuma das 104 chamadas pergunta por `edit_post`: todas
        // perguntam pelo que o mapeamento devolveu"*.
        for (const exigida of [...esperadoProprio, ...esperadoAlheio]) {
          assert.notEqual(
            exigida,
            'edit_post',
            `${lado}: a meta-capacidade nunca e a resposta`,
          );
        }
      }
    }

    // A familia de pagina sai do REGISTRO do tipo. A consequencia e a regra de
    // negocio de UC-07: *"nenhuma capacidade de pagina chega a autor ou
    // colaborador — paginas sao territorio editorial"*.
    const rascunhoDePaginaDaAutora = 200;
    const rascunhoDePostDaAutora = 201;
    instalacao.mundo.por(
      conteudo({
        id: rascunhoDePaginaDaAutora,
        tipo: 'page',
        autorId: contas.autora,
        estado: 'draft',
      }),
    );
    instalacao.mundo.por(
      conteudo({ id: rascunhoDePostDaAutora, autorId: contas.autora, estado: 'draft' }),
    );
    assert.deepEqual(
      [...instalacao.exigidas(contas.autora, 'edit_post', rascunhoDePaginaDaAutora)],
      ['edit_pages'],
      `${lado}: o slot do proprio, no vocabulario do tipo page`,
    );
    assert.equal(
      instalacao.pode(contas.autora, 'edit_post', rascunhoDePostDaAutora),
      true,
      `${lado}: a autora mexe no proprio post`,
    );
    assert.equal(
      instalacao.pode(contas.autora, 'edit_post', rascunhoDePaginaDaAutora),
      false,
      `${lado}: e nao mexe na propria pagina — nenhuma capacidade de pagina chega a ela`,
    );
    assert.equal(
      instalacao.pode(contas.colaboradora, 'edit_post', rascunhoDePaginaDaAutora),
      false,
      `${lado}: nem a colaboradora`,
    );

    // A colaboradora **perde** o proprio conteudo ao ele ser publicado: a matriz
    // de fabrica nao lhe da `edit_published_posts`. E a resolucao por estado
    // vista do lado de quem a vive.
    const rascunhoDaColaboradora = 202;
    const publicadoDaColaboradora = 203;
    instalacao.mundo.por(
      conteudo({
        id: rascunhoDaColaboradora,
        autorId: contas.colaboradora,
        estado: 'draft',
      }),
    );
    instalacao.mundo.por(
      conteudo({
        id: publicadoDaColaboradora,
        autorId: contas.colaboradora,
        estado: 'publish',
      }),
    );
    assert.equal(
      instalacao.pode(contas.colaboradora, 'edit_post', rascunhoDaColaboradora),
      true,
      `${lado}: a colaboradora edita o proprio rascunho`,
    );
    assert.equal(
      instalacao.pode(contas.colaboradora, 'edit_post', publicadoDaColaboradora),
      false,
      `${lado}: e nao edita o proprio depois de publicado`,
    );

    // Ter a meta-capacidade gravada nao concede nada, porque ninguem pergunta
    // por ela: e a metade de `PERM-3` que um porte perde ao verificar direto.
    const comMetaCapacidade = instalacao.conta('gal', concedida('edit_post'));
    assert.equal(
      instalacao.pode(comMetaCapacidade, 'edit_post', rascunhoDePostDaAutora),
      false,
      `${lado}: edit_post gravada na conta nao abre nada`,
    );

    // Autoria ausente cai no ramo do ALHEIO, inclusive para quem nao esta
    // autenticado — que tambem tem identificador 0. Sem esse curto-circuito o
    // ator anonimo seria autor de todo conteudo sem autor.
    const semAutor = 204;
    instalacao.mundo.por(conteudo({ id: semAutor, autorId: 0, estado: 'draft' }));
    assert.deepEqual(
      [...instalacao.exigidas(0, 'edit_post', semAutor)],
      ['edit_others_posts'],
      `${lado}: autoria ausente nao faz do anonimo o autor`,
    );
    assert.equal(
      instalacao.pode(0, 'edit_post', semAutor),
      false,
      `${lado}: e o anonimo e negado`,
    );
    assert.deepEqual(
      [...instalacao.exigidas(contas.autora, 'edit_post', semAutor)],
      ['edit_others_posts'],
      `${lado}: e nem a autora o herda`,
    );
  }
});

// ---------------------------------------------------------------------------
// UT-015-7 — a 2ª regra de negocio de US-8: `D5` — *"a pagina de politica de
// privacidade e protegida pela propria capacidade de privacidade: apaga-la exige
// `manage_privacy_options` somada as capacidades normais de apagar post"*
// (BR-MIGRAR-043, `domain.md §2.5`)
//
// entrada:  instalacao de fabrica, nos dois lados; a pagina de politica, que e
//           um rascunho da editora; a mesma pagina antes de a opcao apontar para
//           ela; uma conta com `manage_options` individual e sem papel nenhum; e
//           a mesma instalacao em rede, com uma super administradora
// acao:     pedir a lista exigida e a decisao de `delete_post` e de
//           `manage_privacy_options`
// esperado: a capacidade de privacidade e SOMADA e nao substitui — a editora,
//           que tem toda a familia de pagina, e negada, a administradora passa, e
//           quem tem so `manage_options` tambem e negado —, e em rede ela resolve
//           em `manage_network`, que papel de fabrica nenhum concede
// ---------------------------------------------------------------------------

test('UT-015-7 a pagina de politica e protegida pela propria capacidade de privacidade (D5)', () => {
  for (const lado of LADOS) {
    const instalacao = criarInstalacao(lado);
    const contas = contasDeFabrica(instalacao);

    const paginaDePolitica = 70;
    instalacao.mundo.por(
      conteudo({
        id: paginaDePolitica,
        tipo: 'page',
        autorId: contas.editora,
        estado: 'draft',
      }),
    );

    // Antes de a opcao apontar para ela, e uma pagina como outra qualquer.
    assert.deepEqual(
      [...instalacao.exigidas(contas.editora, 'delete_post', paginaDePolitica)],
      ['delete_pages'],
      `${lado}: sem a funcao de politica, so a capacidade comum`,
    );
    assert.equal(
      instalacao.pode(contas.editora, 'delete_post', paginaDePolitica),
      true,
      `${lado}: e a editora a apaga`,
    );

    // Com a opcao apontando para ela, a capacidade de privacidade e SOMADA — a
    // comum continua na lista, na frente.
    instalacao.mundo.paginas.politica = paginaDePolitica;
    assert.deepEqual(
      [...instalacao.exigidas(contas.editora, 'delete_post', paginaDePolitica)],
      ['delete_pages', CAPACIDADE_DA_PAGINA_ESPECIAL],
      `${lado}: somada as capacidades normais de apagar`,
    );

    // E a soma e o que nega a editora: ela tem `delete_pages` e nao tem
    // `manage_options`, que e onde `manage_privacy_options` resolve fora de rede.
    assert.equal(
      instalacao.pode(contas.editora, 'delete_post', paginaDePolitica),
      false,
      `${lado}: a editora deixa de apagar a pagina de politica`,
    );
    assert.equal(
      instalacao.pode(contas.administradora, 'delete_post', paginaDePolitica),
      true,
      `${lado}: a administradora apaga`,
    );

    // Somada, e nao substituida, tambem do outro lado: quem tem so a capacidade
    // de privacidade e nao tem a comum continua negado.
    const soPrivacidade = instalacao.conta(
      'hilda',
      concedida(CAPACIDADE_DA_PAGINA_ESPECIAL),
    );
    assert.equal(
      instalacao.pode(soPrivacidade, 'delete_post', paginaDePolitica),
      false,
      `${lado}: manage_options sozinha nao apaga a pagina de politica`,
    );

    // Perguntar pela capacidade de privacidade direto resolve pelo modo de
    // instalacao (BR-MIGRAR-042), e e essa traducao que o ramo soma.
    assert.deepEqual(
      [...instalacao.exigidas(contas.administradora, CAPACIDADE_DE_PRIVACIDADE)],
      [CAPACIDADE_DA_PAGINA_ESPECIAL],
      `${lado}: fora de rede, manage_privacy_options e manage_options`,
    );

    // Em rede ela resolve em `manage_network`, que papel de fabrica nenhum
    // concede (`PERM-10`): nem a administradora do site apaga a pagina de
    // politica, e so o atalho do super administrador passa.
    instalacao.rede = { ativa: true, loginsDeSuperAdmin: ['raiz'] };
    assert.deepEqual(
      [...instalacao.exigidas(contas.administradora, CAPACIDADE_DE_PRIVACIDADE)],
      [CAPACIDADE_DE_PRIVACIDADE_EM_REDE],
      `${lado}: em rede, manage_privacy_options e manage_network`,
    );
    // A pagina e da editora, logo para a administradora vale o ramo do alheio: a
    // soma e com a capacidade que a autoria resolveu, e nao com uma fixa.
    assert.deepEqual(
      [...instalacao.exigidas(contas.administradora, 'delete_post', paginaDePolitica)],
      ['delete_others_pages', CAPACIDADE_DE_PRIVACIDADE_EM_REDE],
      `${lado}: em rede a soma troca de nome, sobre o que a autoria resolveu`,
    );
    assert.equal(
      instalacao.pode(contas.administradora, 'delete_post', paginaDePolitica),
      false,
      `${lado}: em rede a administradora do site nao apaga a pagina de politica`,
    );

    const superAdministradora = instalacao.conta('raiz');
    assert.equal(
      instalacao.pode(superAdministradora, 'delete_post', paginaDePolitica),
      true,
      `${lado}: a super administradora apaga, pelo atalho de PERM-9`,
    );
  }
});
