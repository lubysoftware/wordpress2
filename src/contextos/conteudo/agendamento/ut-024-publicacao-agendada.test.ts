/**
 * A entrega de **T014**: *"7 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-024-1, UT-024-2, UT-024-3, UT-024-4,
 * UT-024-5, UT-024-6, UT-024-7), com o mesmo dado de entrada, acao e resultado
 * esperado. Os 2 testes de regra de negocio (UT-024-6, UT-024-7) entram na mesma
 * suite."*
 *
 * **Sete `test()`, nem um a mais.** Os casos foram **copiados** do catalogo, que
 * existe nesta arvore (`backlog/tests.md`, secao *REQ-024*, linhas 391 a 398) —
 * e nao reconstruidos por aritmetica, como as suites de `UT-*` da feature `001`
 * tiveram de fazer quando o arquivo ainda nao estava aqui (ver o cabecalho de
 * `../../identidade-e-acesso/autorizacao/ut-014-autorizacao-por-capacidade.test.ts`).
 * A conta tambem fecha sozinha: **5 criterios de aceite + 2 regras de negocio =
 * 7 casos**, e a linha de T014 declara *"satisfaz: CA-6.1, CA-6.2, CA-6.3,
 * CA-6.4, CA-6.5"*, sem criterio sobrando e sem criterio faltando.
 *
 * | caso | nome, como esta no catalogo | tipo | prova, como esta no catalogo |
 * |---|---|---|---|
 * | `UT-024-1` | converte para agendado a partir de 60 segundos de diferenca, e nao antes | `borda` | *"Salvar conteudo publicado com data mais de 60 segundos a frente do instante atual resulta em estado agendado, sem comando proprio"* (CA-6.1) |
 * | `UT-024-2` | publica na hora o conteudo agendado salvo com data no passado | `feliz` | *"Salvar conteudo agendado com data no passado o publica na hora, pela mesma comparacao"* (CA-6.2) |
 * | `UT-024-3` | recusa publicar o que ja nao esta em estado agendado | `erro` | *"Na hora de publicar, o sistema recusa publicar o que nao esta mais em estado agendado"* (CA-6.3) |
 * | `UT-024-4` | reagenda em lugar de publicar quando a data ainda nao chegou | `borda` | *"Se a data ainda nao chegou quando o evento roda, o evento e reagendado em lugar de publicar"* (CA-6.4) |
 * | `UT-024-5` | limpa o evento pendente em qualquer transicao de estado do conteudo | `feliz` | *"Qualquer transicao de estado do conteudo limpa o evento pendente"* (CA-6.5) |
 * | `UT-024-6` | exige as duas verificacoes para publicar: o evento e o estado corrente | `borda` | *"P6 — agendamento e guardado por verificacao dupla"* (BR-MIGRAR-006) |
 * | `UT-024-7` | decide o estado pela comparacao de data, sem ninguem comandar a conversao | `feliz` | *"ADR 0005 — agendamento por comparacao de data, nao por transicao"* |
 *
 * **O dado de entrada e o que os casos implicam, e isso esta declarado:** o
 * catalogo da, por caso, o ID, o nome, o tipo e a prova — nao da valor de
 * coluna. A lista por extenso mora em `backlog.json`, que `backlog/tests.md`
 * cita no proprio cabecalho (*"A lista de testes mora dentro do proprio card, em
 * `backlog.json`"*) e que **nao esta nesta arvore**. Logo a entrada de cada caso
 * aqui e a que a prova exige, e os numeros vem de onde o pacote os escreve: a
 * folga de **60 segundos** de CA-6.1 e de ADR-0005 (`MINUTE_IN_SECONDS` em
 * `wp-includes/post.php:4800`), a pre-condicao *"a data informada esta mais de
 * 60 segundos a frente do instante atual"* de UC-04, e os cinco estados de
 * recusa de UT-024-3 saem do vocabulario fechado de `../estado-editorial.ts`.
 * Se o `backlog.json` aparecer com valor de coluna diferente, o caso de la vale
 * e este arquivo muda.
 *
 * ---
 *
 * # Nao e a suite de criterios de T013, e a diferenca e o nivel
 *
 * `us-6-agendar-publicacao.test.ts` (T013) afirma CA-6.1 a CA-6.5 no nivel da
 * **unidade**: porta de dados que devolve linha programada e registra comando, e
 * `resolverEstadoPelaData`, `transitarEstado` e `publicarSeAindaAgendado`
 * chamadas direto, uma por vez.
 *
 * Esta suite e o catalogo `UT-024-*`, no nivel do **cenario**: o modulo composto
 * por `criarModuloDeConteudo()` sobre uma **tabela `{site}posts` em memoria** que
 * aplica o `UPDATE` que recebe — logo o estado que uma chamada grava e o que a
 * chamada seguinte le, sem ninguem reprogramar resposta. E e por isso que ela
 * existe: *"efeito no banco"* e o criterio da area 3 da Decisao 2 de
 * `parity_specs.md`, e o corpus que ele pede e **"snapshot + sequencia de
 * comandos"** — as duas coisas que o duble deste arquivo produz, o retrato da
 * tabela coluna por coluna e a lista ordenada de comandos, de chamadas a fila e
 * de pontos de extensao disparados. Com linha programada nao ha retrato: a
 * tabela nao existe. E e o que torna `UT-024-6` honesto, porque *"o cron nao e
 * confiado"* se prova disparando o **mesmo** evento duas vezes sobre o **mesmo**
 * registro, e a segunda chamada precisa ver o que a primeira gravou.
 *
 * O cenario de paridade que esta suite tem de poder ser conferido por e o
 * `@critico @invariante` de
 * `.specify/migration/parity_tests/02-publicacao-e-agendamento-de-conteudo.feature`:
 *
 * > **Cenario:** O agendamento e guardado por verificacao dupla, e o agendador
 * > nao e confiado
 * > Dado um conteudo agendado para uma data futura
 * > Quando a tarefa de publicacao agendada e executada antes da data chegar
 * > Entao nenhuma das duas metades publica
 * > E as duas reagendam a tarefa, com o mesmo proximo horario
 * > Quando a tarefa e executada para um conteudo que nao esta em estado agendado
 * > Entao nenhuma das duas publica
 * > E nenhuma das duas registra erro
 *
 * As tres ultimas linhas sao `UT-024-3` e `UT-024-4` palavra por palavra, e
 * *"nenhuma das duas registra erro"* e afirmado como o pacote o descreve: pela
 * **ausencia** de comando, de ponto disparado e de campo de erro no resultado —
 * nenhum codigo de recusa foi inventado para esse caminho, porque
 * `check_and_publish_future_post()` nao devolve valor nenhum em ramo algum
 * (**P6**, **P8**).
 *
 * ---
 *
 * # ⚠️ O caminho de gravacao nao existe nesta arvore, e os dois primeiros casos o pedem
 *
 * `UT-024-1` e `UT-024-2` dizem **"salvar"**, e o verbo e literal: em UC-04 o
 * gatilho e *"o autor salva conteudo publicado com data no futuro — nao ha
 * comando 'agendar'"*. O caminho de gravacao unico (`wp_insert_post()`) e a
 * entrega de **T005** (*"gravar rascunho quando o estado nao e informado"*), que
 * **nao esta nesta arvore**: T014 depende de T013, e o ramo de T013 nasceu do
 * merge de T003. O que T013 entregou das duas metades do bloco de `:4797`-`:4809`
 * e `resolverEstadoPelaData` — a comparacao — e o ouvinte de `future_{tipo}`, que
 * poe o evento na fila.
 *
 * Esta suite entao **compoe as duas metades na ordem em que o legado as executa**,
 * num arranjo local chamado {@link gravar}, e a ordem nao e escolha dela: e o
 * passo 6 do fluxo principal de UC-03 (*"grava o status publicado **e** dispara a
 * transicao"*), com a comparacao de data antes da escrita, onde ADR-0005 a le
 * (`:4797`, dentro de `wp_insert_post()`, antes do `UPDATE`). Nada de novo e
 * implementado: {@link gravar} so chama o que T013 e T003 entregaram, mora neste
 * arquivo de teste e sai dele quando T005 chegar — as assercoes continuam valendo,
 * porque o que elas afirmam e o **byte gravado em `post_status`** e a **sequencia
 * de comandos**, nao a forma de chamar.
 *
 * Duas coisas que esse arranjo **nao** decide, declaradas para nao serem
 * descobertas depois:
 *
 * - **as outras 18 colunas.** O caminho real grava as 21 de `ConteudoGravavel`;
 *   {@link gravar} toca as tres de que os dois casos falam (`post_date`,
 *   `post_date_gmt`, `post_status`). O comando de 21 colunas e de T005, e nenhuma
 *   assercao daqui depende de quantas colunas ele tem.
 * - **se a transicao dispara quando o estado nao muda.** `wp_insert_post()`
 *   chama `wp_transition_post_status()` numa posicao fixa, e se ela dispara
 *   tambem com `$new_status === $previous_status` e pergunta do caminho de
 *   gravacao (T005). {@link gravar} nao a responde — nos dois unicos casos em que
 *   esta suite afirma ponto disparado, o estado **muda** — e no lado "e nao
 *   antes" de `UT-024-1` a assercao e so sobre o byte gravado.
 *
 * # 🔴 E uma divergencia que T013 registrou e esta suite NAO fecha
 *
 * A tabela *Contratos* de `plan.md` descreve uma operacao **"agendar
 * publicacao"**, com *"entrada: identificador e instante futuro"* e *"erros:
 * instante no passado"*. `spec.md` (CA-6.1, CA-6.2), UC-04 (*"nao ha comando
 * 'agendar'"*, *"a conversao e bidirecional e ninguem a comanda"*) e ADR-0005
 * (*"`future` como transicao explicita"*, alternativa descartada) dizem o
 * contrario, e T013 implementou o lado dos tres, registrando o conflito em
 * `./index.ts` sem resolve-lo. Esta suite faz o que resta a um teste: afirma
 * *"sem comando proprio"* como **comportamento** — o pedido de gravacao nunca
 * carrega `future`, e e a data que decide — e **nao** afirma nada sobre a
 * existencia ou ausencia de uma operacao na superficie do modulo. Quem revisar a
 * tabela *Contratos* decide se a linha se reescreve; nao e decisao de quem
 * escreve teste (**Nao negociavel**, linha do contrato publico).
 *
 * ---
 *
 * # Nada foi inventado
 *
 * Nenhum limite de tentativa, nenhuma janela de tolerancia, nenhuma chave de
 * desduplicacao e nenhum prazo entram aqui: **P6** poe numero que o legado nao
 * tem fora do nucleo, e o unico numero desta historia e a folga de 60 segundos,
 * que ADR-0005 le literal em `MINUTE_IN_SECONDS`. **P7** vale no reagendamento: o
 * valor que a fila devolve e afirmado como irrelevante ao fluxo — `limparGancho`
 * devolvendo `false` e `agendarEventoUnico` recusando nao mudam o desfecho, que e
 * o silencio por projeto que a resposta 10 de `questions.md` manda preservar.
 *
 * `[P]` de T014 vale: nenhum arquivo fora desta suite e tocado, e o duble de
 * tabela e local de proposito — vira helper compartilhado quando uma segunda
 * tarefa pedir, nao antes.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type MatrizDePapeis,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import {
  DATA_SENTINELA,
  ESTADOS_EDITORIAIS,
  ESTADO_AGENDADO,
  ESTADO_PUBLICADO,
  FOLGA_DE_AGENDAMENTO_EM_SEGUNDOS,
  GANCHO_DE_PUBLICACAO_AGENDADA,
  TIPO_FORA_DA_COMPARACAO_DE_DATA,
  criarModuloDeConteudo,
  instanteDaDataDoBanco,
  nomeDoPontoDeEstadoDoTipo,
  nomeDoPontoDeParaEstado,
  resolverEstadoPelaData,
  transitarEstado,
  type Consulta,
  type Conteudo,
  type ContextoDeAgendamento,
  type GanchosDaPublicacao,
  type LinhaDeResultado,
  type MensagemDeEmail,
  type ModuloDeConteudo,
  type PortaDeDados,
  type TaxonomiaNaPublicacao,
  type ValorDeColuna,
} from '../index.js';
import { textoDoParametro } from '../armazenamento/porta-falsa.js';

const ID = 24;
const AUTOR = 7;
const ENDERECO = 'https://exemplo.test/?p=24';

/** `2026-10-08 12:00:00` em segundos — o instante que o relogio do cenario devolve. */
const AGORA = Date.UTC(2026, 9, 8, 12, 0, 0) / 1000;

const UMA_HORA = 3600;

const TABELA = 'wp_posts';

const LEITURA_DA_LINHA = `SELECT * FROM ${TABELA} WHERE ID = ? LIMIT 1`;

/** A data no formato do banco, que e o unico formato que `post_date_gmt` tem. */
function dataDoBanco(instanteEmSegundos: number): string {
  return new Date(instanteEmSegundos * 1000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
}

// ── A tabela em memoria ──────────────────────────────────────────────────────
//
// Aplica o comando que recebe em vez de devolver linha programada, para que o
// "snapshot" da area 3 da Decisao 2 exista: `retrato()` e a tabela coluna por
// coluna, e comparar dois retratos e a forma de afirmar "nao alterou o registro".

interface TabelaEmMemoria {
  readonly porta: PortaDeDados;
  /** Toda leitura pedida, na ordem. */
  readonly leituras: Consulta[];
  /** Toda escrita pedida, na ordem. Lista vazia e afirmacao, nao ausencia. */
  readonly escritas: Consulta[];
  /** O valor gravado numa coluna, como esta na tabela. */
  coluna(id: number, coluna: string): ValorDeColuna | undefined;
  /** A tabela inteira, para comparar "antes" com "depois". */
  retrato(): string;
}

function criarTabelaEmMemoria(
  linhas: readonly LinhaDeResultado[],
): TabelaEmMemoria {
  const linhasPorId = new Map<
    number,
    Record<string, ValorDeColuna | undefined>
  >();
  for (const linha of linhas) {
    linhasPorId.set(Number(linha['ID']), { ...linha });
  }

  const leituras: Consulta[] = [];
  const escritas: Consulta[] = [];

  return {
    porta: {
      prefixoDeTabela: 'wp_',
      selecionar(consulta) {
        leituras.push(consulta);
        if (consulta.texto !== LEITURA_DA_LINHA) {
          return [];
        }
        const linha = linhasPorId.get(Number(consulta.parametros[0]));
        return linha === undefined ? [] : [{ ...linha }];
      },
      escrever(consulta) {
        escritas.push(consulta);

        const alvo = new RegExp(`^UPDATE ${TABELA} SET (.+) WHERE ID = \\?$`).exec(
          consulta.texto,
        );
        if (alvo === null) {
          return { linhasAfetadas: 0, idGerado: null };
        }

        const colunas = (alvo[1] ?? '')
          .split(', ')
          .map((atribuicao) => atribuicao.replace(' = ?', ''));
        const linha = linhasPorId.get(Number(consulta.parametros[colunas.length]));
        if (linha === undefined) {
          return { linhasAfetadas: 0, idGerado: null };
        }

        colunas.forEach((coluna, indice) => {
          linha[coluna] = consulta.parametros[indice] ?? null;
        });
        return { linhasAfetadas: 1, idGerado: null };
      },
    },
    leituras,
    escritas,
    coluna(id, coluna) {
      return linhasPorId.get(id)?.[coluna];
    },
    retrato() {
      return JSON.stringify([...linhasPorId.entries()]);
    },
  };
}

// ── O cenario ────────────────────────────────────────────────────────────────

const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'author',
    capacidades: [
      { capacidade: 'edit_posts', concedida: true },
      { capacidade: 'publish_posts', concedida: true },
    ],
  },
];

const BASE: BaseDeAutorizacao = {
  matriz: MATRIZ,
  rede: REDE_INATIVA_NA_AUTORIZACAO,
};

const ATOR: AtorDeAutorizacao = {
  contaId: AUTOR,
  login: 'autora',
  existe: true,
  concessoes: [{ capacidade: 'author', concedida: true }],
};

function tipoRegistrado(nome: string): TipoDeConteudoNaAutorizacao {
  return {
    nome,
    traduzMetaCapacidade: true,
    capacidades: {
      edit_posts: 'edit_posts',
      publish_posts: 'publish_posts',
    },
  };
}

const TIPOS: Readonly<Record<string, TipoDeConteudoNaAutorizacao>> = {
  post: tipoRegistrado('post'),
  [TIPO_FORA_DA_COMPARACAO_DE_DATA]: tipoRegistrado(
    TIPO_FORA_DA_COMPARACAO_DE_DATA,
  ),
};

/**
 * A linha como o caminho de gravacao a deixou: **`guid` ja preenchido**, porque
 * quem agenda passou antes por uma gravacao que o escreveu. Deixa-lo vazio faria
 * a entrada em publicado emitir um `UPDATE` a mais, que e CA-1.3 de T003 e nao
 * tem caso neste catalogo.
 */
function linhaDeConteudo(
  campos: Partial<Record<string, string | number>> = {},
): LinhaDeResultado {
  return {
    ID,
    post_author: AUTOR,
    post_date: dataDoBanco(AGORA + UMA_HORA),
    post_date_gmt: dataDoBanco(AGORA + UMA_HORA),
    post_content: 'corpo',
    post_title: 'titulo',
    post_excerpt: '',
    post_status: ESTADO_AGENDADO,
    comment_status: 'open',
    ping_status: 'open',
    post_password: '',
    post_name: 'titulo',
    to_ping: '',
    pinged: '',
    post_modified: dataDoBanco(AGORA),
    post_modified_gmt: dataDoBanco(AGORA),
    post_content_filtered: '',
    post_parent: 0,
    guid: ENDERECO,
    menu_order: 0,
    post_type: 'post',
    post_mime_type: '',
    comment_count: 0,
    ...campos,
  };
}

const TAXONOMIA_SEM_TERMO_PADRAO: TaxonomiaNaPublicacao = {
  nome: 'category',
  declaraTermoPadrao: false,
};

interface Cenario {
  readonly modulo: ModuloDeConteudo;
  readonly contexto: ContextoDeAgendamento;
  readonly tabela: TabelaEmMemoria;
  /** Chamada a fila e ponto de extensao disparado, **na ordem**, num so registro. */
  readonly registro: string[];
  /** So as chamadas a fila, na ordem. */
  readonly chamadasDaFila: () => string[];
  /** So os pontos de extensao disparados, na ordem. */
  readonly pontos: () => string[];
  readonly emailsEnviados: MensagemDeEmail[];
  readonly leiturasDoRelogio: () => number;
}

interface OpcoesDoCenario {
  readonly linha?: LinhaDeResultado;
  readonly agora?: number;
  /** O que `wp_clear_scheduled_hook()` devolve. `false` e o caso de P7. */
  readonly eventosRemovidos?: number | false;
  /** O que `wp_schedule_single_event()` devolve. `false` e o caso de P7. */
  readonly agendamentoAceito?: boolean;
}

const LIMPAR = `fila:limpar ${GANCHO_DE_PUBLICACAO_AGENDADA} [${ID}]`;

function agendarEm(instanteEmSegundos: number): string {
  return `fila:agendar ${GANCHO_DE_PUBLICACAO_AGENDADA} [${ID}] em ${instanteEmSegundos}`;
}

function ponto(nome: string): string {
  return `ponto:${nome}`;
}

function cenario(opcoes: OpcoesDoCenario = {}): Cenario {
  const tabela = criarTabelaEmMemoria([opcoes.linha ?? linhaDeConteudo()]);

  const registro: string[] = [];
  const emailsEnviados: MensagemDeEmail[] = [];
  let leiturasDoRelogio = 0;

  const ganchos: GanchosDaPublicacao = {
    filtrarGuid(guid) {
      registro.push(ponto('get_the_guid'));
      return guid;
    },
    aoEntrarEmPublicadoPeloPontoDepreciado(gancho) {
      registro.push(ponto(gancho));
    },
    aoTransitarEstado() {
      registro.push(ponto('transition_post_status'));
    },
    aoTransitarDeParaEstado(gancho) {
      registro.push(ponto(gancho));
    },
    aoEntrarNoEstadoDoTipo(gancho) {
      registro.push(ponto(gancho));
    },
    aoEditarConteudoDoTipo(gancho) {
      registro.push(ponto(gancho));
    },
    aoEditarConteudo() {
      registro.push(ponto('edit_post'));
    },
    aoGravarConteudoDoTipo(gancho) {
      registro.push(ponto(gancho));
    },
    aoGravarConteudo() {
      registro.push(ponto('save_post'));
    },
    aoInserirConteudo() {
      registro.push(ponto('wp_insert_post'));
    },
    depoisDeInserirConteudo() {
      registro.push(ponto('wp_after_insert_post'));
    },
  };

  const modulo = criarModuloDeConteudo({
    dados: tabela.porta,
    email: {
      enviar(mensagem) {
        emailsEnviados.push(mensagem);
        return { enviado: true };
      },
    },
    relogio: {
      agoraEmSegundos() {
        leiturasDoRelogio += 1;
        return opcoes.agora ?? AGORA;
      },
    },
  });

  const contexto: ContextoDeAgendamento = {
    base: BASE,
    ator: ATOR,
    armazenamento: modulo.armazenamento,
    relogio: modulo.portas.relogio,
    classificacao: {
      taxonomiasDoTipo() {
        return [TAXONOMIA_SEM_TERMO_PADRAO];
      },
      termosDoConteudo() {
        return { erro: false, termos: [] };
      },
      opcaoDeTermoPadrao() {
        return 0;
      },
      definirTermos() {},
    },
    fila: {
      limparGancho(gancho, argumentos) {
        registro.push(`fila:limpar ${gancho} ${JSON.stringify(argumentos)}`);
        return opcoes.eventosRemovidos ?? 1;
      },
      agendarEventoUnico(instanteEmSegundos, gancho, argumentos) {
        registro.push(
          `fila:agendar ${gancho} ${JSON.stringify(argumentos)} em ${instanteEmSegundos}`,
        );
        return opcoes.agendamentoAceito ?? true;
      },
    },
    tipoDeConteudo(nome) {
      return TIPOS[nome] ?? null;
    },
    enderecoDoConteudo() {
      return ENDERECO;
    },
    dataGmtDeDataLocal(dataLocal) {
      // O cenario roda em UTC: `get_gmt_from_date()` e identidade aqui, e o
      // deslocamento de fuso e caso de T013, nao deste catalogo.
      return dataLocal;
    },
    ganchos,
  };

  return {
    modulo,
    contexto,
    tabela,
    registro,
    chamadasDaFila: () => registro.filter((linha) => linha.startsWith('fila:')),
    pontos: () => registro.filter((linha) => linha.startsWith('ponto:')),
    emailsEnviados,
    leiturasDoRelogio: () => leiturasDoRelogio,
  };
}

// ── O arranjo que faz o papel do caminho de gravacao (ver o cabecalho) ───────

interface PedidoDeGravacao {
  /** O estado que o cliente pede. **Nunca** `future`: ninguem comanda a conversao. */
  readonly estadoPedido: string;
  /** `post_date`, no fuso do site. */
  readonly data: string;
  /** `post_date_gmt`, que e a que a comparacao le. */
  readonly dataGmt: string;
}

interface Gravacao {
  /** O byte que foi para `post_status`. */
  readonly estadoGravado: string;
  /** O estado que estava na linha antes desta gravacao. */
  readonly estadoAnterior: string;
}

/**
 * Salvar o conteudo, na ordem do passo 6 de UC-03 — *"grava o status publicado
 * **e** dispara a transicao"* —, com a comparacao de data antes da escrita, onde
 * ADR-0005 a le (`wp-includes/post.php:4797`-`:4809`, dentro de
 * `wp_insert_post()`).
 *
 * Nao implementa nada: chama `resolverEstadoPelaData` (T013), o repositorio (T002)
 * e `transitarEstado` (T003). Ver a secao do cabecalho sobre as duas perguntas que
 * ele **nao** responde.
 */
function gravar(cen: Cenario, pedido: PedidoDeGravacao): Gravacao {
  const antes = cen.contexto.armazenamento.conteudo.obterPorId(ID);
  assert.ok(antes !== null, 'o cenario precisa da linha gravada');
  assert.notEqual(
    pedido.estadoPedido,
    ESTADO_AGENDADO,
    'nenhum pedido de gravacao comanda a conversao: e a data que decide',
  );

  const estadoGravado = resolverEstadoPelaData(
    { tipo: antes.tipo, estado: pedido.estadoPedido, dataGmt: pedido.dataGmt },
    cen.contexto.relogio.agoraEmSegundos(),
  );

  cen.contexto.armazenamento.conteudo.atualizar(ID, {
    data: pedido.data,
    dataGmt: pedido.dataGmt,
    estado: estadoGravado,
  });

  if (estadoGravado !== antes.estado) {
    const conteudo: Conteudo = {
      ...antes,
      data: pedido.data,
      dataGmt: pedido.dataGmt,
      estado: estadoGravado,
    };
    transitarEstado(cen.contexto, {
      estadoNovo: estadoGravado,
      estadoAnterior: antes.estado,
      conteudo,
    });
  }

  return { estadoGravado, estadoAnterior: antes.estado };
}

const COMANDO_DA_GRAVACAO = `UPDATE ${TABELA} SET post_date = ?, post_date_gmt = ?, post_status = ? WHERE ID = ?`;

// ── Os sete casos do catalogo ────────────────────────────────────────────────

test('UT-024-1 converte para agendado a partir de 60 segundos de diferenca, e nao antes (CA-6.1)', () => {
  // A entrada de UC-04: um conteudo publicado, e o autor salva com data a frente.
  const instante = AGORA + UMA_HORA;
  const cen = cenario({
    linha: linhaDeConteudo({
      post_status: ESTADO_PUBLICADO,
      post_date: dataDoBanco(AGORA),
      post_date_gmt: dataDoBanco(AGORA),
    }),
  });

  const gravacao = gravar(cen, {
    estadoPedido: ESTADO_PUBLICADO,
    data: dataDoBanco(instante),
    dataGmt: dataDoBanco(instante),
  });

  // O resultado: estado agendado, sem comando proprio — o pedido dizia publicado.
  assert.equal(gravacao.estadoAnterior, ESTADO_PUBLICADO);
  assert.equal(gravacao.estadoGravado, ESTADO_AGENDADO);
  assert.equal(cen.tabela.coluna(ID, 'post_status'), ESTADO_AGENDADO);

  // O comando que saiu, com os bytes que foram para as tres colunas.
  assert.deepEqual(
    cen.tabela.escritas.map((consulta) => consulta.texto),
    [COMANDO_DA_GRAVACAO],
  );
  assert.deepEqual(cen.tabela.escritas[0]?.parametros.map(textoDoParametro), [
    dataDoBanco(instante),
    dataDoBanco(instante),
    ESTADO_AGENDADO,
    String(ID),
  ]);

  // E o efeito que a entrada em agendado tem na fila (UC-04, passo 3): o evento
  // pendente e limpo duas vezes — uma por ser transicao, uma por `_future_post_hook()`
  // — e um evento unico e marcado para a data, nesta ordem.
  assert.deepEqual(cen.registro, [
    LIMPAR,
    ponto('transition_post_status'),
    ponto(nomeDoPontoDeParaEstado(ESTADO_PUBLICADO, ESTADO_AGENDADO)),
    LIMPAR,
    agendarEm(instante),
    ponto(nomeDoPontoDeEstadoDoTipo(ESTADO_AGENDADO, 'post')),
  ]);

  // A borda, nos dois lados: 60 segundos convertem, 59 nao. E o bloco de
  // `:4800`, com `MINUTE_IN_SECONDS` literal e sem filtro (ADR-0005).
  assert.equal(FOLGA_DE_AGENDAMENTO_EM_SEGUNDOS, 60);
  for (const [deslocamento, esperado] of [
    [59, ESTADO_PUBLICADO],
    [60, ESTADO_AGENDADO],
    [61, ESTADO_AGENDADO],
    [0, ESTADO_PUBLICADO],
    [-UMA_HORA, ESTADO_PUBLICADO],
  ] as const) {
    assert.equal(
      resolverEstadoPelaData(
        {
          tipo: 'post',
          estado: ESTADO_PUBLICADO,
          dataGmt: dataDoBanco(AGORA + deslocamento),
        },
        AGORA,
      ),
      esperado,
      `${deslocamento} segundos a frente`,
    );
  }

  // E a borda tambem no byte gravado: salvar com 59 segundos a frente mantem
  // publicado na tabela, e salvar com 60 grava agendado.
  for (const [deslocamento, esperado] of [
    [59, ESTADO_PUBLICADO],
    [60, ESTADO_AGENDADO],
  ] as const) {
    const naBorda = cenario({
      linha: linhaDeConteudo({ post_status: ESTADO_PUBLICADO }),
    });
    const instanteDaBorda = AGORA + deslocamento;

    gravar(naBorda, {
      estadoPedido: ESTADO_PUBLICADO,
      data: dataDoBanco(instanteDaBorda),
      dataGmt: dataDoBanco(instanteDaBorda),
    });

    assert.equal(
      naBorda.tabela.coluna(ID, 'post_status'),
      esperado,
      `${deslocamento} segundos a frente`,
    );
  }
});

test('UT-024-2 publica na hora o conteudo agendado salvo com data no passado (CA-6.2)', () => {
  // A entrada do fluxo alternativo de UC-04: "Autor salva conteudo agendado com
  // data no passado". O pedido carrega o estado corrente, nao um comando.
  const instante = AGORA - UMA_HORA;
  const cen = cenario({ linha: linhaDeConteudo() });

  assert.equal(cen.tabela.coluna(ID, 'post_status'), ESTADO_AGENDADO);

  const gravacao = gravar(cen, {
    estadoPedido: ESTADO_PUBLICADO,
    data: dataDoBanco(instante),
    dataGmt: dataDoBanco(instante),
  });

  // Publicado na propria gravacao, pela mesma comparacao: o `elseif` de `:4804`.
  assert.equal(gravacao.estadoAnterior, ESTADO_AGENDADO);
  assert.equal(gravacao.estadoGravado, ESTADO_PUBLICADO);
  assert.equal(cen.tabela.coluna(ID, 'post_status'), ESTADO_PUBLICADO);
  assert.equal(cen.tabela.coluna(ID, 'post_date_gmt'), dataDoBanco(instante));

  assert.deepEqual(
    cen.tabela.escritas.map((consulta) => consulta.texto),
    [COMANDO_DA_GRAVACAO],
  );
  assert.deepEqual(cen.tabela.escritas[0]?.parametros.map(textoDoParametro), [
    dataDoBanco(instante),
    dataDoBanco(instante),
    ESTADO_PUBLICADO,
    String(ID),
  ]);

  // "Na hora" e a assercao central: a fila nao recebe evento nenhum — so a
  // limpeza que toda transicao faz — e ninguem espera o agendador.
  assert.deepEqual(cen.chamadasDaFila(), [LIMPAR]);
  assert.equal(cen.leiturasDoRelogio(), 1);

  // A transicao de agendado para publicado dispara os tres pontos, na ordem, com
  // o ponto depreciado antes deles e a limpeza da fila entre o primeiro e o segundo.
  assert.deepEqual(cen.registro, [
    ponto('get_the_guid'),
    ponto('private_to_published'),
    LIMPAR,
    ponto('transition_post_status'),
    ponto(nomeDoPontoDeParaEstado(ESTADO_AGENDADO, ESTADO_PUBLICADO)),
    ponto(nomeDoPontoDeEstadoDoTipo(ESTADO_PUBLICADO, 'post')),
  ]);
});

test('UT-024-3 recusa publicar o que ja nao esta em estado agendado (CA-6.3)', () => {
  // A excecao de UC-04: "O registro saiu de agendado — `check_and_publish_future_post()`
  // recusa publicar o que nao esta mais em `future`". A data JA PASSOU em todos
  // eles, logo a recusa e do estado, e so dele.
  for (const estado of ESTADOS_EDITORIAIS.filter(
    (candidato) => candidato !== ESTADO_AGENDADO,
  )) {
    const cen = cenario({
      linha: linhaDeConteudo({
        post_status: estado,
        post_date: dataDoBanco(AGORA - UMA_HORA),
        post_date_gmt: dataDoBanco(AGORA - UMA_HORA),
      }),
    });
    const antes = cen.tabela.retrato();

    const resultado = cen.modulo.publicarSeAindaAgendado(cen.contexto, ID);

    assert.equal(resultado.desfecho, 'nao-esta-agendado', estado);
    assert.equal(resultado.conteudo?.estado, estado);
    assert.equal(resultado.publicacao, null, estado);
    assert.equal(resultado.reagendamento, null, estado);

    // Nenhum efeito: nem comando, nem ponto de extensao, nem chamada a fila.
    assert.equal(cen.tabela.retrato(), antes, estado);
    assert.deepEqual(cen.tabela.escritas, [], estado);
    assert.deepEqual(cen.registro, [], estado);
    assert.deepEqual(cen.emailsEnviados, [], estado);

    // "Nenhuma das duas registra erro" (PT-002): o resultado nao tem campo de
    // erro algum, e nenhum codigo de recusa foi inventado para este caminho.
    assert.deepEqual(Object.keys(resultado).sort(), [
      'conteudo',
      'desfecho',
      'publicacao',
      'reagendamento',
    ]);
  }

  // E a recusa nao depende do registro estar la: o inexistente tambem e silencio.
  const semLinha = cenario({ linha: linhaDeConteudo({ ID: 999 }) });
  const resultado = semLinha.modulo.publicarSeAindaAgendado(
    semLinha.contexto,
    ID,
  );

  assert.equal(resultado.desfecho, 'inexistente');
  assert.equal(resultado.conteudo, null);
  assert.deepEqual(semLinha.tabela.escritas, []);
  assert.deepEqual(semLinha.registro, []);
});

test('UT-024-4 reagenda em lugar de publicar quando a data ainda nao chegou (CA-6.4)', () => {
  // O fluxo alternativo de UC-04: "A data ainda nao chegou quando o evento rodou
  // — o sistema reagenda o evento em lugar de publicar". E o "Uh oh, someone
  // jumped the gun!" de `:5495`.
  const instante = AGORA + UMA_HORA;
  const cen = cenario({
    linha: linhaDeConteudo({
      post_date: dataDoBanco(instante),
      post_date_gmt: dataDoBanco(instante),
    }),
  });
  const antes = cen.tabela.retrato();

  const resultado = cen.modulo.publicarSeAindaAgendado(cen.contexto, ID);

  assert.equal(resultado.desfecho, 'reagendado');
  assert.equal(resultado.publicacao, null);

  // "Nenhuma publicacao acontece fora de hora": nada gravado, nada disparado.
  assert.equal(cen.tabela.retrato(), antes);
  assert.deepEqual(cen.tabela.escritas, []);
  assert.deepEqual(cen.pontos(), []);
  assert.deepEqual(cen.emailsEnviados, []);
  assert.equal(cen.tabela.coluna(ID, 'post_status'), ESTADO_AGENDADO);

  // "As duas reagendam a tarefa, com o mesmo proximo horario" (PT-002): o
  // instante e o da propria data, sem adiar, sem folga e sem intervalo novo.
  assert.deepEqual(cen.chamadasDaFila(), [LIMPAR, agendarEm(instante)]);
  assert.equal(resultado.reagendamento?.instanteEmSegundos, instante);
  assert.equal(instanteDaDataDoBanco(dataDoBanco(instante)), instante);
  assert.equal(cen.leiturasDoRelogio(), 1);

  // A borda e `>`: a data igual ao instante corrente ja chegou, e publica.
  for (const [deslocamento, desfecho] of [
    [0, 'publicado'],
    [1, 'reagendado'],
  ] as const) {
    const naBorda = cenario({
      linha: linhaDeConteudo({
        post_date: dataDoBanco(AGORA + deslocamento),
        post_date_gmt: dataDoBanco(AGORA + deslocamento),
      }),
    });

    assert.equal(
      naBorda.modulo.publicarSeAindaAgendado(naBorda.contexto, ID).desfecho,
      desfecho,
      `${deslocamento} segundos a frente`,
    );
  }

  // P7: o que a fila devolve nao muda o fluxo. Limpeza que nao removeu nada e
  // agendamento recusado continuam produzindo o mesmo reagendamento, em silencio.
  const filaMuda = cenario({
    linha: linhaDeConteudo({
      post_date: dataDoBanco(instante),
      post_date_gmt: dataDoBanco(instante),
    }),
    eventosRemovidos: false,
    agendamentoAceito: false,
  });

  const comFilaMuda = filaMuda.modulo.publicarSeAindaAgendado(
    filaMuda.contexto,
    ID,
  );

  assert.equal(comFilaMuda.desfecho, 'reagendado');
  assert.equal(comFilaMuda.reagendamento?.eventosRemovidos, false);
  assert.equal(comFilaMuda.reagendamento?.agendado, false);
  assert.deepEqual(filaMuda.chamadasDaFila(), [LIMPAR, agendarEm(instante)]);
  assert.deepEqual(filaMuda.tabela.escritas, []);
});

test('UT-024-5 limpa o evento pendente em qualquer transicao de estado do conteudo (CA-6.5)', () => {
  // O outro fluxo alternativo de UC-04: "Qualquer transicao de status limpa o
  // evento pendente", com o motivo no comentario do legado — "Always clears the
  // hook in case the post status bounced from future to draft" (`:8189`).
  const pares: readonly (readonly [string, string])[] = [
    [ESTADO_AGENDADO, 'draft'],
    [ESTADO_AGENDADO, 'trash'],
    [ESTADO_AGENDADO, 'pending'],
    [ESTADO_AGENDADO, 'private'],
    ['draft', 'pending'],
    ['pending', 'private'],
    [ESTADO_PUBLICADO, 'draft'],
    ['auto-draft', 'draft'],
    ['trash', 'draft'],
  ];

  for (const [estadoAnterior, estadoNovo] of pares) {
    const cen = cenario({
      linha: linhaDeConteudo({ post_status: estadoAnterior }),
    });
    const conteudo = cen.contexto.armazenamento.conteudo.obterPorId(ID);
    assert.ok(conteudo !== null);

    transitarEstado(cen.contexto, {
      estadoNovo,
      estadoAnterior,
      conteudo: { ...conteudo, estado: estadoNovo },
    });

    const transicao = `${estadoAnterior} -> ${estadoNovo}`;

    // A limpeza acontece, com o gancho e o argumento do legado...
    assert.ok(cen.chamadasDaFila().includes(LIMPAR), transicao);
    assert.equal(
      cen.chamadasDaFila()[0],
      `fila:limpar ${GANCHO_DE_PUBLICACAO_AGENDADA} ${JSON.stringify([ID])}`,
      transicao,
    );

    // ...e acontece ANTES de qualquer interceptador de terceiro, que e o que a
    // prioridade 5 do ouvinte do nucleo compra.
    assert.equal(cen.registro[0], LIMPAR, transicao);

    // Nenhuma destas transicoes agenda: so a entrada em agendado o faz.
    assert.ok(
      !cen.chamadasDaFila().some((chamada) => chamada.startsWith('fila:agendar')),
      transicao,
    );
    assert.deepEqual(cen.tabela.escritas, [], transicao);
  }
});

test('UT-024-6 exige as duas verificacoes para publicar: o evento e o estado corrente (BR-MIGRAR-006)', () => {
  // "`check_and_publish_future_post()` recusa publicar o que nao esta em
  // `future` e, se a data ainda nao chegou, REAGENDA em vez de publicar. O cron
  // nao e confiado." As duas guardas sao independentes, e a prova e a matriz.
  const matriz: readonly {
    readonly estado: string;
    readonly deslocamento: number;
    readonly desfecho: string;
  }[] = [
    { estado: ESTADO_AGENDADO, deslocamento: -1, desfecho: 'publicado' },
    { estado: 'draft', deslocamento: -1, desfecho: 'nao-esta-agendado' },
    { estado: ESTADO_AGENDADO, deslocamento: 1, desfecho: 'reagendado' },
    { estado: 'draft', deslocamento: 1, desfecho: 'nao-esta-agendado' },
  ];

  for (const caso of matriz) {
    const cen = cenario({
      linha: linhaDeConteudo({
        post_status: caso.estado,
        post_date: dataDoBanco(AGORA + caso.deslocamento),
        post_date_gmt: dataDoBanco(AGORA + caso.deslocamento),
      }),
    });

    const resultado = cen.modulo.publicarSeAindaAgendado(cen.contexto, ID);
    const nome = `${caso.estado} com data ${caso.deslocamento}s`;

    assert.equal(resultado.desfecho, caso.desfecho, nome);
    assert.equal(
      cen.tabela.coluna(ID, 'post_status'),
      caso.desfecho === 'publicado' ? ESTADO_PUBLICADO : caso.estado,
      nome,
    );

    // A guarda de estado vem primeiro, e por isso o rascunho nem chega a ler o
    // relogio: nao ha como reagendar o que nao esta agendado.
    assert.equal(
      cen.leiturasDoRelogio(),
      caso.desfecho === 'nao-esta-agendado' ? 0 : 1,
      nome,
    );
  }

  // E a outra metade de "o cron nao e confiado": o agendador pode disparar o
  // MESMO evento mais de uma vez, e a segunda vez encontra o registro ja
  // publicado — logo recai na guarda de estado, sem segundo efeito.
  const cen = cenario({
    linha: linhaDeConteudo({
      post_date: dataDoBanco(AGORA - 1),
      post_date_gmt: dataDoBanco(AGORA - 1),
    }),
  });

  const primeira = cen.modulo.publicarSeAindaAgendado(cen.contexto, ID);
  assert.equal(primeira.desfecho, 'publicado');
  assert.equal(primeira.publicacao?.estadoAnterior, ESTADO_AGENDADO);
  assert.equal(cen.tabela.coluna(ID, 'post_status'), ESTADO_PUBLICADO);

  const retratoDepoisDaPrimeira = cen.tabela.retrato();
  const escritasDaPrimeira = cen.tabela.escritas.map(
    (consulta) => consulta.texto,
  );
  const registroDaPrimeira = [...cen.registro];
  assert.deepEqual(escritasDaPrimeira, [
    `UPDATE ${TABELA} SET post_status = ? WHERE ID = ?`,
  ]);
  assert.ok(
    cen.registro.includes(
      ponto(nomeDoPontoDeParaEstado(ESTADO_AGENDADO, ESTADO_PUBLICADO)),
    ),
  );

  for (let disparo = 2; disparo <= 5; disparo += 1) {
    const repetida = cen.modulo.publicarSeAindaAgendado(cen.contexto, ID);
    assert.equal(repetida.desfecho, 'nao-esta-agendado', `disparo ${disparo}`);
    assert.equal(repetida.publicacao, null, `disparo ${disparo}`);
    assert.equal(repetida.reagendamento, null, `disparo ${disparo}`);
  }

  assert.equal(cen.tabela.retrato(), retratoDepoisDaPrimeira);
  assert.deepEqual(
    cen.tabela.escritas.map((consulta) => consulta.texto),
    escritasDaPrimeira,
  );
  assert.deepEqual(cen.registro, registroDaPrimeira);
});

test('UT-024-7 decide o estado pela comparacao de data, sem ninguem comandar a conversao (ADR-0005)', () => {
  // "O status `future` nao e escolhido: e calculado." A conversao e bidirecional
  // e nenhum dos dois pedidos abaixo nomeia o estado de destino: os dois pedem
  // publicado, e o que muda entre eles e so a data.
  const ida = cenario({ linha: linhaDeConteudo({ post_status: ESTADO_PUBLICADO }) });
  assert.equal(
    gravar(ida, {
      estadoPedido: ESTADO_PUBLICADO,
      data: dataDoBanco(AGORA + UMA_HORA),
      dataGmt: dataDoBanco(AGORA + UMA_HORA),
    }).estadoGravado,
    ESTADO_AGENDADO,
  );

  const volta = cenario({ linha: linhaDeConteudo() });
  assert.equal(
    gravar(volta, {
      estadoPedido: ESTADO_PUBLICADO,
      data: dataDoBanco(AGORA - UMA_HORA),
      dataGmt: dataDoBanco(AGORA - UMA_HORA),
    }).estadoGravado,
    ESTADO_PUBLICADO,
  );

  // A mesma data, dois relogios: a decisao e da comparacao, e de nada mais. O
  // pedido e identico nos dois, e o byte gravado diverge.
  const dataPedida = dataDoBanco(AGORA + 60);
  for (const [agora, esperado] of [
    [AGORA, ESTADO_AGENDADO],
    [AGORA + 1, ESTADO_PUBLICADO],
  ] as const) {
    const cen = cenario({
      agora,
      linha: linhaDeConteudo({ post_status: ESTADO_PUBLICADO }),
    });

    gravar(cen, {
      estadoPedido: ESTADO_PUBLICADO,
      data: dataPedida,
      dataGmt: dataPedida,
    });

    assert.equal(cen.tabela.coluna(ID, 'post_status'), esperado, `agora=${agora}`);
  }

  // O anexo contorna o bloco inteiro, nos dois sentidos — "Anexo e excecao
  // silenciosa" (ADR-0005), e e o UNICO tipo que o faz.
  const anexo = cenario({
    linha: linhaDeConteudo({
      post_status: ESTADO_PUBLICADO,
      post_type: TIPO_FORA_DA_COMPARACAO_DE_DATA,
    }),
  });

  gravar(anexo, {
    estadoPedido: ESTADO_PUBLICADO,
    data: dataDoBanco(AGORA + UMA_HORA),
    dataGmt: dataDoBanco(AGORA + UMA_HORA),
  });

  assert.equal(anexo.tabela.coluna(ID, 'post_status'), ESTADO_PUBLICADO);
  assert.deepEqual(anexo.chamadasDaFila(), []);
  assert.equal(
    resolverEstadoPelaData(
      {
        tipo: TIPO_FORA_DA_COMPARACAO_DE_DATA,
        estado: ESTADO_AGENDADO,
        dataGmt: dataDoBanco(AGORA - UMA_HORA),
      },
      AGORA,
    ),
    ESTADO_AGENDADO,
  );

  // E a conversao e so do par publicado/agendado: nenhum dos outros dez estados
  // do vocabulario e tocado pela comparacao, em data alguma.
  const intocados = ESTADOS_EDITORIAIS.filter(
    (estado) => estado !== ESTADO_PUBLICADO && estado !== ESTADO_AGENDADO,
  );
  assert.equal(intocados.length, 10);

  for (const estado of intocados) {
    for (const deslocamento of [-UMA_HORA, 0, 59, 60, UMA_HORA]) {
      assert.equal(
        resolverEstadoPelaData(
          {
            tipo: 'post',
            estado,
            dataGmt: dataDoBanco(AGORA + deslocamento),
          },
          AGORA,
        ),
        estado,
        `${estado} com ${deslocamento}s`,
      );
    }
  }

  // A data que o legado nao consegue ler nao reagenda nem agenda: `strtotime()`
  // devolve `false`, a subtracao o trata como zero, e a diferenca fica negativa.
  assert.equal(instanteDaDataDoBanco(DATA_SENTINELA), null);
  assert.equal(
    resolverEstadoPelaData(
      { tipo: 'post', estado: ESTADO_AGENDADO, dataGmt: DATA_SENTINELA },
      AGORA,
    ),
    ESTADO_PUBLICADO,
  );
});
