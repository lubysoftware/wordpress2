/**
 * O atendimento de uma leitura publica, de ponta a ponta — o `WP::main()` do
 * legado (`wp-includes/class-wp.php:819`), que e o que a funcao `wp()`
 * (`wp-includes/functions.php:1349`) chama e que `wp-blog-header.php:16`
 * executa em toda visita ao site.
 *
 * **Por que este arquivo existe num esqueleto: a ordem e o contrato.**
 * BR-MIGRAR-106 (`EXT-ORDEM`) poe a ordem de carregamento no contrato publico, e
 * a tabela *Nao negociavel* da constituicao poe "mudar a ordem de carregamento
 * do arranque" entre o que o agente de codificacao **nao** decide: *"ponto de
 * extensao registrado cedo ou tarde demais simplesmente nao funciona"*. A ordem
 * do legado, com as seis etapas e onde cada uma esta neste porte:
 *
 * | # | etapa no legado | onde esta neste porte |
 * |---|---|---|
 * | 1 | `init()` — resolve a identidade corrente | feature 001, `sessaoDaRequisicao`; nao e desta feature |
 * | 2 | `parse_request()` — resolve o endereco em criterios | `resolverEndereco`, **T001** e **T002** |
 * | 3 | `query_posts()` — executa a consulta principal | `consultarConteudo`, **T003** (US-1); a paginacao em T007 e o portao de estado em T009 |
 * | 4 | `handle_404()` — decide a situacao da resposta | `situacaoDaResposta`, **T001**, com os tres ramos de excecao em **T003** |
 * | 5 | `register_globals()` — publica o resultado para o tema | `publicarParaOTema`, **T005** (US-2) |
 * | 6 | `send_headers()` — emite os cabecalhos e o codigo | borda HTTP; o 404 por criterio `error` sai daqui (`class-wp.php:455-466`) |
 *
 * ⚠️ **A hierarquia de modelos NAO e a etapa 5, e nao esta neste arquivo.**
 * `WP::main()` termina na acao `wp`; quem escolhe o modelo e
 * `wp-includes/template-loader.php`, que `wp-blog-header.php:19` carrega
 * **depois** de `wp()` retornar. T005 trouxe as duas coisas, e elas ficaram onde
 * o legado as tem: a etapa 5 aqui, em `../apresentacao/publicacao-para-o-tema.ts`,
 * e a escolha como operacao propria do modulo, em
 * `../apresentacao/escolher-apresentacao.ts`.
 *
 * Tres propriedades dessa ordem que este arquivo preserva desde o esqueleto, e
 * que sao faceis de perder depois:
 *
 * 1. **As etapas 3, 4 e 5 so acontecem se a 2 aconteceu.** No legado sao um
 *    `if ( $parsed )` (`class-wp.php:824-828`), e `$parsed` e falso quando o
 *    ponto de extensao `do_parse_request` recusa. Fora do `if`, so a etapa 6.
 * 2. **A etapa 4 vem depois da 3, e nao antes.** Decidir a situacao antes de
 *    consultar inverte a regra: e **olhando o resultado** que o legado converte
 *    uma requisicao aparentemente bem-sucedida em 404.
 * 3. **A acao `wp` dispara sempre**, resolvida ou nao a requisicao, e depois da
 *    etapa 6 (`class-wp.php:830-839`).
 *
 * ---
 *
 * ## Por que o contexto e do atendimento, e nao de cada etapa
 *
 * As etapas 2 e 3 leem os **mesmos** registros — `get_post_types()` e
 * `get_taxonomies()` —, a **mesma** forma de endereco e o **mesmo**
 * `get_page_by_path()`. No legado sao as mesmas funcoes globais na mesma
 * requisicao, e nao existe estado em que as duas etapas enxerguem registros
 * diferentes. {@link OpcoesDoAtendimento.contexto} e esse conjunto, declarado uma
 * vez e passado as duas; as opcoes por etapa continuam aceitando o proprio
 * contexto porque cada etapa tambem e operacao publica do modulo, e quem chama
 * `atender` e que nao tem como diverge-las.
 */

import type { ContextoDaApresentacao } from '../apresentacao/contexto-da-apresentacao.js';
import {
  publicarParaOTema,
  type PublicacaoParaOTema,
} from '../apresentacao/publicacao-para-o-tema.js';
import {
  consultaMarcadaComoNaoEncontrada,
  consultarConteudo,
  type ConsultaDeConteudo,
  type OpcoesDaConsultaDeConteudo,
} from '../consulta/consultar-conteudo.js';
import type { ContextoDaConsulta } from '../consulta/contexto-da-consulta.js';
import type { EnderecoPedido } from './endereco-pedido.js';
import {
  resolverEndereco,
  type OpcoesDaResolucao,
  type ResolucaoDeEndereco,
} from './resolver-endereco.js';
import {
  situacaoDaResposta,
  SITUACAO_NAO_DECIDIDA,
  type OpcoesDaSituacao,
  type RespostaDaLeitura,
} from './situacao-da-resposta.js';

/**
 * O ponto de acao `wp` (`wp-includes/class-wp.php:839`).
 *
 * Dispara uma vez por requisicao, no fim do atendimento, e **sempre** — e um
 * dos ganchos mais usados por extensao de terceiro justamente porque e o
 * primeiro momento em que a consulta corrente ja esta decidida. Nao devolve
 * valor.
 */
export type ObservadorDoAtendimento = (
  atendimento: AtendimentoDaLeitura,
) => void;

/** O que o atendimento recebe, por etapa. */
export interface OpcoesDoAtendimento {
  /**
   * Os colaboradores que as etapas 2 e 3 compartilham — ver a ultima secao do
   * cabecalho. Informado aqui, ele vence o contexto das opcoes por etapa.
   */
  readonly contexto?: ContextoDaConsulta;
  /** Repassado a etapa 2. */
  readonly resolucao?: OpcoesDaResolucao;
  /** Repassado a etapa 3. */
  readonly consulta?: OpcoesDaConsultaDeConteudo;
  /** Repassado a etapa 4. */
  readonly situacao?: OpcoesDaSituacao;
  /**
   * Repassado a etapa 5.
   *
   * ⚠️ So **um** campo deste contexto e lido aqui, `dadosDaConta`, e so no ramo
   * de arquivo de autor (`class-wp.php:680-682`). Os outros sao da escolha de
   * apresentacao, que roda depois do atendimento — ver o cabecalho deste
   * arquivo. O contexto e o mesmo tipo porque no legado sao as mesmas funcoes
   * globais na mesma requisicao, e porque quem chama `atender` nao tem como
   * diverge-los.
   */
  readonly apresentacao?: ContextoDaApresentacao;
  /** `wp`, no fim, sempre. */
  readonly aoFimDoAtendimento?: readonly ObservadorDoAtendimento[];
}

/** O que uma leitura publica produz: a resolucao, a consulta e a situacao. */
export interface AtendimentoDaLeitura {
  readonly resolucao: ResolucaoDeEndereco;
  /**
   * `$wp_the_query` — a consulta principal da requisicao.
   *
   * Ausente quando `do_parse_request` recusou a resolucao: ali o legado pula as
   * etapas 3, 4 e 5 inteiras (`class-wp.php:824-828`), e a consulta nao e uma
   * consulta vazia, e **nenhuma** consulta. O tema que perguntasse por
   * `is_home()` nesse caminho ouviria o valor de declaracao de uma instancia que
   * nunca foi analisada.
   */
  readonly consulta?: ConsultaDeConteudo;
  readonly resposta: RespostaDaLeitura;
  /**
   * O que a etapa 5 publicou para o tema (`WP::register_globals()`).
   *
   * Ausente pela mesma razao de {@link AtendimentoDaLeitura.consulta}: quando
   * `do_parse_request` recusa, o legado pula as etapas 3, 4 **e 5** inteiras
   * (`class-wp.php:824-828`), e nenhum global e publicado. O tema que lesse
   * `$posts` nesse caminho encontraria o que a requisicao anterior deixou — no
   * legado, porque o processo morre a cada resposta, isso e ausencia.
   */
  readonly publicacao?: PublicacaoParaOTema;
}

/**
 * Atende uma leitura publica.
 *
 * **Permissao exigida: nenhuma, e a declaracao e o ponto** (P4). E a cara
 * publica do produto: UC-01 registra que *"nao ha verificacao de capacidade. O
 * portao e o `post_status`"*, e o ator e o visitante, que por definicao nao tem
 * papel. O portao de `post_status` entra em T009 (US-4), dentro da consulta —
 * **nao** aqui, na porta de entrada.
 *
 * Com T003 as etapas 2, 3 e 4 existem, e T005 acrescentou a 5 **na posicao
 * marcada**, dentro do `if ( $parsed )` e depois do zeramento de predicados. A
 * etapa 6 continua fora desta arvore: ela e borda HTTP.
 */
export function atenderLeituraPublica(
  pedido: EnderecoPedido,
  opcoes: OpcoesDoAtendimento = {},
): AtendimentoDaLeitura {
  const doAtendimento =
    opcoes.contexto === undefined ? {} : { contexto: opcoes.contexto };

  // Etapa 2.
  const resolucao = resolverEndereco(pedido, {
    ...(opcoes.resolucao ?? {}),
    ...doAtendimento,
  });

  // Etapas 3, 4 e 5 — todas dentro do `if ( $parsed )` do legado.
  let consulta: ConsultaDeConteudo | undefined;
  let publicacao: PublicacaoParaOTema | undefined;
  let resposta = SITUACAO_NAO_DECIDIDA;
  if (resolucao.resolvida) {
    // Etapa 3 — a consulta principal, antes da situacao: e o resultado dela que
    // alimenta os tres ramos de excecao da etapa 4.
    consulta = consultarConteudo(resolucao.criterios, {
      ...(opcoes.consulta ?? {}),
      ...doAtendimento,
    });

    // Etapa 4.
    const membro =
      opcoes.situacao?.contaMembroDoSite ?? opcoes.contexto?.contaMembroDoSite;
    resposta = situacaoDaResposta(resolucao, {
      ...(opcoes.situacao ?? {}),
      consulta,
      ...(membro === undefined ? {} : { contaMembroDoSite: membro }),
    });

    // ⚠️ `handle_404` chama `$wp_query->set_404()` (`class-wp.php:800`), que
    // **zera os 29 predicados** da consulta. Isso acontece depois da decisao e
    // antes da etapa 5, e e por isso que esta linha esta exatamente aqui: e o
    // estado zerado que `register_globals()` publica para o tema. Nao se aplica
    // quando a consulta ja estava marcada — ali `handle_404` desistiu no comeco
    // e `set_404()` nao foi chamado uma segunda vez.
    if (resposta.naoEncontrado && !consulta.tipos.naoEncontrado) {
      consulta = consultaMarcadaComoNaoEncontrada(consulta);
    }

    // Etapa 5 (`class-wp.php:827`) — publica o resultado para o tema. Le a
    // consulta **ja zerada** pelo `set_404()` da linha acima, que e o estado que
    // o legado publica.
    publicacao = publicarParaOTema(consulta, opcoes.apresentacao ?? {});
  }

  const atendimento: AtendimentoDaLeitura = Object.freeze({
    resolucao,
    ...(consulta === undefined ? {} : { consulta }),
    resposta,
    ...(publicacao === undefined ? {} : { publicacao }),
  });

  // Etapa 6 (borda HTTP) acontece aqui, fora do `if`.

  // A acao `wp`, sempre e por ultimo.
  for (const observador of opcoes.aoFimDoAtendimento ?? []) {
    observador(atendimento);
  }

  return atendimento;
}
