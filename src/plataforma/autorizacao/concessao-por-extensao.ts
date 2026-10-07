/**
 * As quatro capacidades que **nenhum papel concede**, e o ponto de prioridade
 * `1` que as concede — `PERM-7` (BR-MIGRAR-093).
 *
 * Entrega de **T019** da feature `001-identidade-e-acesso`: *"declarar na matriz
 * as capacidades que o legado so concede por extensao"* (US-9).
 *
 * A regra, na letra de BR-MIGRAR-093: *"quatro capacidades que o codigo exige nao
 * estao em papel algum: `install_languages`, `resume_plugins`, `resume_themes` e
 * `view_site_health_checks` sao injetadas em `allcaps` por filtros registrados com
 * prioridade `1` — isto e, **antes de qualquer extensao**. A derivacao e parte do
 * modelo."* E a justificativa de migracao da propria regra e uma ordem: *"a
 * Pergunta 3 manda inclui-las explicitamente: 'quem portar lendo so a matriz de
 * papeis produz um sistema onde ninguem retoma extensao pausada'"*.
 *
 * O **P3** da constituicao repete o mesmo com a consequencia junto, e e o motivo
 * de esta tarefa existir separada: *"quatro capacidades que o codigo exige nao
 * estao em papel algum: existem so por filtro. A resposta 3 manda inclui-las
 * explicitamente, porque quem portar lendo apenas a matriz de papeis produz um
 * sistema em que ninguem retoma extensao pausada"*.
 *
 * ---
 *
 * # Por que isto nao e "mais um filtro", e onde ele roda
 *
 * No legado estas concessoes sao tres interceptadores do ponto `user_has_cap`,
 * registrados pelo **proprio nucleo** com prioridade `1`
 * (`wp-includes/default-filters.php:771`-`:773`), logo:
 *
 * 1. **de fabrica elas existem.** Nao e preciso extensao de terceiro para
 *    alguem retomar uma extensao pausada: o nucleo concede a quem ja tem a
 *    capacidade de origem. E o que CA-9.2 cobra — *"existe ao menos um ator capaz
 *    de retomar uma extensao pausada numa instalacao de fabrica"*;
 * 2. **elas rodam ANTES de qualquer interceptador de terceiro**, que entra na
 *    prioridade `10` por omissao. A nota de compatibilidade de BR-MIGRAR-093 e
 *    explicita: *"a prioridade `1` e parte da regra: o alvo precisa de um ponto de
 *    injecao que rode antes dos pontos de extensao de terceiro"*. Uma extensao
 *    **pode** retirar depois o que o nucleo concedeu aqui, e e por isso que a
 *    ordem esta declarada em `decisao-de-capacidade.ts` e afirmada por teste;
 * 3. **elas sao removiveis**, porque no legado sao registro em ponto de extensao,
 *    e `remove_filter` existe. E o estado que o cenario `@substituicao` de
 *    `parity_tests/07-autorizacao-por-capacidade.feature` descreve: *"dado
 *    nenhuma extensao registrada no ponto de concessao de capacidade (...) as duas
 *    metades negam"*. Deste lado, esse estado e passar lista vazia em
 *    `concessoesPorExtensao` — ver `contexto-de-autorizacao.ts`.
 *
 * **O barramento de pontos de extensao nao existe nesta arvore** (o
 * `plataforma/barramento/` que `contexto-de-autorizacao.ts` cita), e declarar os
 * pontos de extensao com contrato explicito e `REQ-162`, que `do-not-rewrite.md`
 * poe fora deste pacote. Logo a prioridade `1` e cumprida pela **posicao** no
 * passo 4 da decisao, e o numero fica declarado em
 * {@link PRIORIDADE_DA_CONCESSAO_POR_EXTENSAO} para quem construir o barramento
 * registrar estes tres no lugar certo. O que **nao** se fez aqui: um barramento
 * de prioridades que ninguem pediu.
 *
 * ---
 *
 * # A proveniencia de cada condicao, nome por nome
 *
 * Tres das quatro condicoes estao escritas no pacote, no caso de uso que depende
 * delas. A quarta nao esta, e isso esta marcado onde ela mora.
 *
 * | capacidade | concedida a quem tem | onde o pacote diz |
 * |---|---|---|
 * | `resume_plugins` | `activate_plugins` | UC-36, excecao *"ninguem tem `resume_plugins`"* |
 * | `resume_themes` | `switch_themes` | UC-32, fluxo alternativo *"retomar um tema pausado"* |
 * | `view_site_health_checks` | `install_plugins`, e **em rede so super administrador** | UC-37, linha *Autorizacao* |
 * | `install_languages` | ⚠️ ver {@link CAPACIDADES_QUE_HABILITAM_O_IDIOMA} | o pacote **nao** diz |
 *
 * ---
 *
 * # 🔴 Um vizinho que esta tarefa encontrou aberto, e NAO fechou
 *
 * **`install_languages` tem, no legado, um `case` de traducao que esta arvore
 * ainda nao tem** — e ele e de outra tarefa, nao desta.
 *
 * Esta tarefa concede a capacidade no mapa do ator (o `allcaps`), que e onde o
 * legado a concede. Mas o legado tambem a trata na **traducao** (`map_meta_cap`),
 * no mesmo bloco que le as constantes do dono do servidor: com
 * `DISALLOW_FILE_MODS` definida, e em rede para quem nao e super administrador,
 * `install_languages` — e `update_languages`, que nenhum documento deste pacote
 * nomeia — viram `do_not_allow`. A tabela de `revogacao-por-constante.ts`
 * (`PERM-8`, T015) **nao** alcanca estes dois nomes, e o recorte de rede daquele
 * mesmo bloco e justamente o `PERM-10` que aquele arquivo declara como nao
 * portado, por o pacote nao enumerar quais capacidades ele atinge.
 *
 * **A consequencia, declarada:** hoje, com `DISALLOW_FILE_MODS` definida, quem tem
 * `update_core` instala traducao neste sistema e nao instalaria no legado. Isto e
 * **mais aberto** que o legado, em um nome. Nao foi "consertado" aqui porque a
 * correcao e na tabela de `PERM-8` e na traducao de `PERM-10`, que sao a entrega
 * de outras tarefas com testes proprios, e porque `update_languages` nao esta em
 * documento algum desta arvore — acrescenta-lo seria inventar superficie. Fica
 * nomeado, como o recorte de rede ficou.
 */

import type { Capacidade } from './capacidade.js';
import type { AtorDeAutorizacao } from './contexto-de-autorizacao.js';

/**
 * A prioridade com que o legado registra as tres concessoes no ponto
 * `user_has_cap` (`default-filters.php:771`-`:773`).
 *
 * Esta aqui porque e **parte da regra** (BR-MIGRAR-093) e porque o barramento que
 * a consumiria nao existe nesta arvore: quem o construir registra estes tres
 * nesta prioridade, e nao na de omissao. Enquanto ele nao existir, quem cumpre o
 * numero e a posicao do passo 4 de `decisao-de-capacidade.ts`.
 */
export const PRIORIDADE_DA_CONCESSAO_POR_EXTENSAO = 1;

/**
 * O que uma concessao recebe — os mesmos quatro argumentos que o legado entrega
 * ao ponto `user_has_cap`, mais o que `is_multisite()` e `is_super_admin()`
 * respondem.
 *
 * As duas ultimas chegam separadas, e **`ehSuperAdmin` e funcao de proposito**:
 * ver a nota de curto-circuito em {@link CONCESSOES_POR_EXTENSAO_DE_FABRICA}.
 */
export interface PedidoDeConcessao {
  /** `$caps` — a lista que a traducao devolveu para a pergunta corrente. */
  readonly exigidas: readonly Capacidade[];
  /** `$args` — os argumentos da pergunta, na ordem em que o chamador os passou. */
  readonly argumentos: readonly unknown[];
  /** `$user` — quem pergunta. */
  readonly ator: AtorDeAutorizacao;
  /** `is_multisite()`. */
  readonly redeAtiva: boolean;
  /** `is_super_admin( $user->ID )`, avaliada **so se** for preciso. */
  readonly ehSuperAdmin: () => boolean;
}

/** Uma capacidade concedida por regra, e a condicao que a concede. */
export interface ConcessaoDeclarada {
  readonly capacidade: Capacidade;
  /**
   * Recebe o mapa **como esta ate aqui** e o pedido; devolve se a capacidade
   * entra.
   *
   * O mapa e o da vez porque no legado e um filtro em cadeia: o segundo
   * interceptador ve o que o primeiro acrescentou.
   */
  readonly quando: (
    capacidades: ReadonlyMap<string, boolean>,
    pedido: PedidoDeConcessao,
  ) => boolean;
}

/**
 * Um interceptador de concessao, com o **nome publicado** do legado.
 *
 * O nome nao e enfeite e nao e traduzido: o **P8** poe funcao publicada no
 * contrato publico, e uma extensao que hoje faz `remove_filter` escreve
 * exatamente esta cadeia de caracteres. Um por interceptador registrado, e nao um
 * por capacidade, porque um deles concede **duas** e o **P2** manda preservar
 * *"o nome, os argumentos, a ordem de disparo"* de cada ponto.
 */
export interface ConcessaoPorExtensao {
  readonly nome: string;
  readonly concessoes: readonly ConcessaoDeclarada[];
}

/**
 * `! empty( $allcaps['x'] )` — presente **e** verdadeira.
 *
 * Capacidade gravada com valor falso nao habilita nada, pela mesma razao que a
 * comparacao final do legado e sobre `array_filter`.
 */
function temNoMapa(
  capacidades: ReadonlyMap<string, boolean>,
  capacidade: Capacidade,
): boolean {
  return capacidades.get(capacidade) === true;
}

/**
 * As capacidades que habilitam `install_languages`.
 *
 * ⚠️ **Esta condicao nao esta no pacote.** Nenhum documento desta arvore diz a
 * quem `install_languages` e concedida: `permissions.md` §4, que a contaria, nao
 * esta aqui, e as telas que a exigem (`target_screens.md`, as telas de idioma e de
 * atualizacao) listam a capacidade sem dizer de onde ela vem. O que o pacote da e
 * a **ancora**: BR-MIGRAR-093 aponta `wp-includes/capabilities.php:1309`, e o que
 * esta nessa linha e a condicao reproduzida aqui, com o criterio escrito no
 * comentario do proprio legado — *"a user must have at least one out of the
 * `update_core`, `install_plugins`, and `install_themes` capabilities to qualify
 * for `install_languages`"*.
 *
 * Ela fecha contra o oraculo executavel (`ESC-ORACULO`, BR-MIGRAR-116), que nesta
 * arvore nao existe, como a enumeracao das capacidades de editar arquivo em
 * `revogacao-por-constante.ts`. O **P1** manda reproduzir o legado, e e o que esta
 * feito; o que **nao** se fez foi inventar uma condicao mais arrumada — conceder
 * por `manage_options`, por exemplo, abriria a capacidade a quem o legado nao
 * abre.
 *
 * **Se o oraculo discordar:** a condicao e "qualquer uma destas", logo a correcao
 * e nesta lista e em nenhum outro lugar.
 */
export const CAPACIDADES_QUE_HABILITAM_O_IDIOMA: readonly Capacidade[] = [
  'update_core',
  'install_plugins',
  'install_themes',
];

/**
 * As tres concessoes do nucleo, **na ordem em que o legado as registra**
 * (`default-filters.php:771`-`:773`).
 *
 * A ordem esta reproduzida porque e a ordem de disparo de um ponto de extensao
 * (**P2**), e porque a cadeia e observavel: a primeira concessao ja esta no mapa
 * quando a terceira pergunta.
 *
 * **O curto-circuito da terceira e regra, nao estilo.** O legado escreve
 * `! is_multisite() || is_super_admin( $user->ID )`, e em site unico — o valor de
 * fabrica da instalacao — a segunda metade **nunca** e avaliada. Reproduzir isso
 * nao e zelo: fora da rede, "super administrador" e definido como *quem tem
 * `delete_users`* (`PERM-9`), o que e outra pergunta de permissao — e avaliar as
 * duas metades sempre poria a decisao a chamar a si mesma. Por isso
 * {@link PedidoDeConcessao.ehSuperAdmin} e funcao e nao booleano, e por isso a
 * condicao abaixo mantem a ordem dos dois lados do `||`.
 */
export const CONCESSOES_POR_EXTENSAO_DE_FABRICA: readonly ConcessaoPorExtensao[] =
  [
    {
      nome: 'wp_maybe_grant_install_languages_cap',
      concessoes: [
        {
          capacidade: 'install_languages',
          quando: (capacidades) =>
            CAPACIDADES_QUE_HABILITAM_O_IDIOMA.some((capacidade) =>
              temNoMapa(capacidades, capacidade),
            ),
        },
      ],
    },
    {
      nome: 'wp_maybe_grant_resume_extensions_caps',
      concessoes: [
        // UC-36: "entra por filtro de prioridade 1 para quem tem
        // `activate_plugins`". O legado comenta a razao de nao haver recorte de
        // rede aqui: "even in a multisite, regular administrators should be able
        // to resume plugins" (`capabilities.php:1326`).
        {
          capacidade: 'resume_plugins',
          quando: (capacidades) => temNoMapa(capacidades, 'activate_plugins'),
        },
        // UC-32: "e concedida por filtro a quem tem `switch_themes`", com o mesmo
        // comentario para tema (`capabilities.php:1331`).
        {
          capacidade: 'resume_themes',
          quando: (capacidades) => temNoMapa(capacidades, 'switch_themes'),
        },
      ],
    },
    {
      nome: 'wp_maybe_grant_site_health_caps',
      concessoes: [
        // UC-37, linha *Autorizacao*: "concedida por filtro a quem tem
        // `install_plugins`, e em multisite so a super administrador". A excecao
        // do caso de uso diz a consequencia: "em multisite, administrador de site
        // nao a abre nunca".
        {
          capacidade: 'view_site_health_checks',
          quando: (capacidades, pedido) =>
            temNoMapa(capacidades, 'install_plugins') &&
            (!pedido.redeAtiva || pedido.ehSuperAdmin()),
        },
      ],
    },
  ];

/**
 * Os nomes que estas concessoes declaram, na ordem em que sao declarados.
 *
 * E por aqui que as quatro entram na conferencia de CA-9.1 e CA-9.3: elas **nao**
 * estao na matriz gravada e nao sao alcancadas por constante nenhuma, logo o
 * catalogo as daria por desconhecidas se ninguem as declarasse. Ver
 * `catalogo-de-capacidades.ts`.
 *
 * Deriva da lista, e nao e uma segunda lista escrita a mao: duas listas
 * divergiriam no dia em que alguem acrescentasse uma concessao.
 */
export function capacidadesConcedidasPorExtensao(
  concessoes: readonly ConcessaoPorExtensao[] = CONCESSOES_POR_EXTENSAO_DE_FABRICA,
): readonly Capacidade[] {
  return concessoes.flatMap((entrada) =>
    entrada.concessoes.map((concessao) => concessao.capacidade),
  );
}

/**
 * Aplica as concessoes ao mapa do ator, na ordem declarada.
 *
 * Duas coisas que o legado faz e que um porte perde sem o teste notar:
 *
 * 1. **a concessao SOBREPOE o valor que estava no mapa.** O legado escreve
 *    `$allcaps['resume_plugins'] = true;` sem olhar o que havia antes, logo um
 *    papel que **negue** `resume_plugins` a quem tem `activate_plugins` nao
 *    impede nada. Preencher so o que falta produziria um sistema mais fechado que
 *    o legado, que e o erro que esta feature existe para nao cometer;
 * 2. **a posicao da chave nova e o fim do mapa**, como o `$array['nova'] = ...`
 *    do PHP, e uma chave que ja existia **mantem a posicao**. A posicao importa
 *    porque o mapa e percorrido no ponto de extensao seguinte
 *    (`capacidades-do-ator.ts`), e `Map.set` tem exatamente essa semantica.
 *
 * Lista vazia devolve o mapa recebido sem copia: e o estado *"nenhuma extensao
 * registrada no ponto de concessao"* do cenario de paridade, e nele nada acontece.
 */
export function aplicarConcessoesPorExtensao(
  capacidades: ReadonlyMap<string, boolean>,
  pedido: PedidoDeConcessao,
  concessoes: readonly ConcessaoPorExtensao[] = CONCESSOES_POR_EXTENSAO_DE_FABRICA,
): ReadonlyMap<string, boolean> {
  if (concessoes.length === 0) {
    return capacidades;
  }

  const resultado = new Map(capacidades);
  for (const entrada of concessoes) {
    for (const concessao of entrada.concessoes) {
      // `resultado`, e nao `capacidades`: a cadeia de filtros do legado entrega
      // ao interceptador seguinte o que o anterior devolveu.
      if (concessao.quando(resultado, pedido)) {
        resultado.set(concessao.capacidade, true);
      }
    }
  }
  return resultado;
}
