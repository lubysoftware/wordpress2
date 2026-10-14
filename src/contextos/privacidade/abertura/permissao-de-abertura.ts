/**
 * **CA-1.1**: *"a solicitacao exige a capacidade de privacidade correspondente a
 * acao pedida, verificada antes de a tela abrir"*.
 *
 * Entrega de **T003** (US-1). E a declaracao de permissao que o **P4** da
 * constituicao cobra de *"toda operacao exposta"*, e UC-25 a nomeia por extenso
 * no campo *Autorizacao*: *"`export_others_personal_data` para exportar e
 * `erase_others_personal_data` mais `delete_users` para apagar. As duas mapeiam
 * para `manage_network` em rede e `manage_options` fora dela: e poder de rede,
 * nao de site"*.
 *
 * ---
 *
 * # O portao e a PRIMEIRA LINHA da tela, e nao da funcao
 *
 * `wp_create_user_request()` **nao verifica capacidade nenhuma**
 * (`wp-includes/user.php:4804`-`:4856`), e nem
 * `_wp_personal_data_handle_actions()`, que confere **nonce** e nada mais
 * (`wp-admin/includes/privacy-tools.php:101`). Quem cobra sao as duas telas, e a
 * tabela de excecoes de UC-25 e literal sobre isso — *"a tela nem abre: a
 * verificacao e a primeira linha de `export-personal-data.php` e de
 * `erase-personal-data.php`"*:
 *
 * | tela | o que ela pergunta | ancora |
 * |---|---|---|
 * | exportar | `export_others_personal_data` | `wp-admin/export-personal-data.php:12` |
 * | apagar | `erase_others_personal_data` **E** `delete_users` | `wp-admin/erase-personal-data.php:12` |
 *
 * E a mesma assimetria que BC-04 encontrou no envio e que BC-01 encontrou na
 * publicacao: a funcao da API nao tem portao, a superficie tem. Por isso
 * {@link autorizarAbertura} existe separada de `abrirSolicitacao` e e chamada
 * por `./tela-de-abertura.ts`, que e a superficie — quem chamar a funcao da API
 * direto reproduz o legado, inclusive a ausencia do portao, e **P4 obriga a
 * superficie nova a declarar o seu**.
 *
 * ## 🔴 O portao e da TELA, nao da acao pedida — e CA-1.1 diz "da acao pedida"
 *
 * CA-1.1: *"a solicitacao exige a capacidade de privacidade correspondente **a
 * acao pedida**"*. No legado a capacidade conferida e a do **arquivo de tela que
 * foi aberto**, e a acao vem de um campo oculto do formulario
 * (`type_of_action`, `wp-admin/export-personal-data.php:143`) que o tratador le
 * **sem** reconferir nada: `_wp_personal_data_handle_actions()` nao recebe a
 * tela, e o `switch` dela aceita os **dois** valores de `action`
 * (`wp-admin/includes/privacy-tools.php:99` e `:100`) em qualquer uma das duas
 * telas.
 *
 * A consequencia e observavel: quem tem `export_others_personal_data` e abre a
 * tela de exportacao passa o portao de `:12` e pode enviar
 * `type_of_action = remove_personal_data`; a solicitacao de **apagamento** e
 * criada sem que `erase_others_personal_data` nem `delete_users` sejam
 * perguntadas em lugar nenhum.
 *
 * **Esta tarefa reproduz o legado e nao fecha a brecha**, e as duas metades
 * disso sao deliberadas:
 *
 * 1. {@link autorizarAbertura} recebe a **superficie** — qual das duas telas —,
 *    e nao a acao, porque e isso que as linhas `:12` conferem. O mapa esta em
 *    {@link ACAO_DA_SUPERFICIE}, e `./tela-de-abertura.ts` passa a superficie no
 *    portao e a acao do formulario na criacao, que e a ordem do legado.
 * 2. **A divergencia de redacao fica registrada e nao resolvida.** O P1 e
 *    literal: *"divergir exige uma decisao humana registrada, citada no codigo
 *    que divergiu"*, e as tres divergencias autorizadas sao outras. Fechar a
 *    brecha seria mudar o que uma conta com `export_others_personal_data` pode
 *    fazer — mudanca de permissao observavel, sem decisao humana. Mesmo
 *    precedente e mesma postura de
 *    `contextos/midia/envio/permissao-de-envio.ts`, onde CA-1.1 pedia *"recusa
 *    explicita"* e duas das tres superficies do legado nao recusavam.
 *
 * ⚠️ Quem expor esta operacao fora das duas telas do legado declara a permissao
 * dela (P4) e pode perguntar pela acao, com {@link CAPACIDADES_POR_ACAO}: o mapa
 * esta pronto para as duas leituras, e e a leitura por superficie que reproduz o
 * legado.
 *
 * ## ⚠️ A acao de apagar exige DUAS capacidades, e a segunda nao e de privacidade
 *
 * `delete_users` e capacidade de **conta**, nao de dado pessoal, e ela nao
 * aparece em `D4` (BR-MIGRAR-042) nem na tabela de capacidades de privacidade:
 * ela entra porque apagar dado pessoal de alguem com conta no site apaga a conta
 * dele. Omiti-la abriria a tela de apagamento para quem o legado nao abre.
 *
 * ## ⚠️ O mapeamento para o poder de rede NAO esta aqui, e e de T017
 *
 * `BR-MIGRAR-042` poe os dois nomes no mesmo `case` de `map_meta_cap()` que
 * `manage_privacy_options` (`wp-includes/capabilities.php:795`), e
 * `plataforma/autorizacao/traducao-de-conteudo.ts` ja deixou a regra pronta e
 * **exportada** para esta feature, com todas as palavras:
 * *"`traducaoDePrivacidade` esta exportada exatamente para que a feature 008
 * acrescente os dois nomes em lugar de reimplementar a regra"*.
 *
 * Esta tarefa **nao** acrescenta os dois nomes: CA-8.1 e CA-8.2 sao de **T017**
 * (US-8), e a tabela de `tasks.md` nao da nenhum criterio de rede a T003. O que
 * esta pasta faz e **perguntar** pelos nomes que as telas perguntam, pela unica
 * porta de decisao que existe — `perguntarPermissao()` —, e a traducao chega
 * pelo campo `casosDeTraducao` da {@link BaseDeAutorizacao} que **quem compoe a
 * requisicao** monta. Fora de rede, e numa instalacao em que ninguem acrescentou
 * o caso, a pergunta e comparada direto contra o mapa de capacidades do ator, que
 * e como `perguntarPermissao` trata toda capacidade sem caso de traducao (passo
 * 7: *"lista vazia significa permitido"* nao se aplica; a lista e o proprio nome).
 *
 * ⚠️ **Consequencia declarada, nao resolvida:** numa instalacao **em rede** sem o
 * caso de T017 montado, a pergunta nao resolve para `manage_network` e um
 * administrador de site com a capacidade concedida por filtro passaria onde o
 * legado nega. Isso **nao** e divergencia desta tarefa — e a ausencia de T017,
 * declarada aqui para que ninguem a leia como decisao. O teste desta pasta monta
 * a base das duas formas para que a diferenca fique visivel.
 */

import {
  comAtor,
  perguntarPermissao,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type Capacidade,
} from '../../../plataforma/autorizacao/index.js';

/**
 * `export_others_personal_data` — a capacidade da tela de exportacao
 * (`wp-admin/export-personal-data.php:12`).
 *
 * E cadeia literal, e **nao** slot de registro de tipo: o legado compara o nome
 * direto, e o nome nao esta entre os 15 slots que
 * `get_post_type_capabilities()` deriva — nem poderia, porque a solicitacao
 * registra `capabilities` nenhuma (`wp-includes/post.php:291`-`:298`).
 */
export const CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO: Capacidade =
  'export_others_personal_data';

/**
 * `erase_others_personal_data` — a primeira capacidade da tela de apagamento
 * (`wp-admin/erase-personal-data.php:12`).
 */
export const CAPACIDADE_DE_APAGAR_DADO_DE_TERCEIRO: Capacidade =
  'erase_others_personal_data';

/**
 * `delete_users` — a **segunda** capacidade da tela de apagamento, somada a
 * primeira com `||` sobre a negacao (`wp-admin/erase-personal-data.php:12`).
 *
 * Ver o cabecalho: ela e capacidade de conta, e nao de privacidade.
 */
export const CAPACIDADE_DE_APAGAR_CONTAS: Capacidade = 'delete_users';

/**
 * As capacidades de cada acao, na ordem em que a tela as pergunta.
 *
 * Esta como **dado** e nao como `if` pelo mesmo motivo de
 * `SUPERFICIES_QUE_DESCARTAM_O_DESTINO` em BC-04: e isto que o teste de CA-1.1
 * compara, acao por acao, sem reconstruir o encadeamento.
 *
 * As chaves sao as duas acoes de `ACOES_DE_SOLICITACAO`
 * (`../armazenamento/solicitacao.ts`), com os nomes do legado
 * — `remove_personal_data`, e nao `erase_personal_data`, apesar de a capacidade,
 * o arquivo de tela e a descricao humana usarem *erase* (ver
 * `../armazenamento/solicitacao.ts`).
 */
export const CAPACIDADES_POR_ACAO: Readonly<
  Record<string, readonly Capacidade[]>
> = Object.freeze({
  export_personal_data: Object.freeze([
    CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO,
  ]),
  remove_personal_data: Object.freeze([
    CAPACIDADE_DE_APAGAR_DADO_DE_TERCEIRO,
    CAPACIDADE_DE_APAGAR_CONTAS,
  ]),
});

/**
 * As duas telas do legado, e nao ha uma terceira.
 *
 * Nao e configuracao: e **qual arquivo foi aberto**, e e isso que decide a
 * pergunta de `:12`. Mesmo desenho de `SuperficieDeEnvio` em BC-04, e pela mesma
 * razao: a superficie e dado da chamada, nao invencao.
 */
export type SuperficieDeAbertura =
  /** `wp-admin/export-personal-data.php`. */
  | 'tela-de-exportacao'
  /** `wp-admin/erase-personal-data.php`. */
  | 'tela-de-apagamento';

/**
 * A acao que **cada tela** publica no campo oculto `type_of_action`
 * (`wp-admin/export-personal-data.php:143` e
 * `wp-admin/erase-personal-data.php:143`), e portanto a acao cuja capacidade a
 * linha `:12` daquela tela confere.
 *
 * ⚠️ O formulario pode trazer a **outra** acao, e o legado nao o impede — ver o
 * cabecalho. Este mapa diz o que a tela pergunta, nao o que ela recebe.
 */
export const ACAO_DA_SUPERFICIE: Readonly<Record<SuperficieDeAbertura, string>> =
  Object.freeze({
    'tela-de-exportacao': 'export_personal_data',
    'tela-de-apagamento': 'remove_personal_data',
  });

/** O texto da recusa da tela de exportacao (`wp-admin/export-personal-data.php:13`). */
export const MENSAGEM_DE_EXPORTACAO_NAO_PERMITIDA =
  'Sorry, you are not allowed to export personal data on this site.';

/** O texto da recusa da tela de apagamento (`wp-admin/erase-personal-data.php:13`). */
export const MENSAGEM_DE_APAGAMENTO_NAO_PERMITIDO =
  'Sorry, you are not allowed to erase personal data on this site.';

/**
 * O titulo e o codigo que `wp_die( $message )` resolve quando quem chama nao
 * informa nem um nem outro — que e o caso das duas telas.
 *
 * `_wp_die_process_input()` (`wp-includes/functions.php:4354`): `code` vazio vira
 * `'wp_die'` (`:4407`), `response` zero vira **500** (`:4410`) e titulo vazio
 * vira *"WordPress &rsaquo; Error"* (`:4413`).
 *
 * ⚠️ **500, e nao 403.** A tela de listagem de conteudo de BC-01 devolve 403
 * porque `wp-admin/edit.php:48` **passa** o numero; estas duas nao passam nada,
 * e o default do legado e 500. Trocar por 403 seria melhorar a resposta e mudar
 * o que um cliente externo ve.
 */
export const RECUSA_PADRAO_DE_TELA = Object.freeze({
  titulo: 'WordPress &rsaquo; Error',
  codigo: 'wp_die',
  codigoHttp: 500,
} as const);

/** A recusa da tela, na forma em que `wp_die()` a produz. */
export interface RecusaDaAbertura {
  /** O `<h1>`, que nestas duas telas e o default (`functions.php:4413`). */
  readonly titulo: string;
  /** O texto que a tela passou. */
  readonly mensagem: string;
  /** `$args['code']`, que nestas duas e o default (`:4407`). */
  readonly codigo: string;
  /** `$args['response']`, que nestas duas e o default (`:4410`). */
  readonly codigoHttp: number;
}

/** O que a decisao de permissao da abertura devolve. */
export type DecisaoDaAbertura =
  /** Todas as capacidades da acao passaram. */
  | { readonly desfecho: 'autorizado' }
  /** Uma delas negou, ou a acao nao e nenhuma das duas. */
  | { readonly desfecho: 'recusado'; readonly recusa: RecusaDaAbertura };

/** O recorte de `plataforma/autorizacao/` que esta decisao usa. */
export interface AutorizacaoNaAbertura {
  readonly base: BaseDeAutorizacao;
  readonly ator: AtorDeAutorizacao;
}

/** O texto que cada tela passa ao `wp_die()` dela. */
export const MENSAGEM_DE_RECUSA_DA_SUPERFICIE: Readonly<
  Record<SuperficieDeAbertura, string>
> = Object.freeze({
  'tela-de-exportacao': MENSAGEM_DE_EXPORTACAO_NAO_PERMITIDA,
  'tela-de-apagamento': MENSAGEM_DE_APAGAMENTO_NAO_PERMITIDO,
});

/**
 * **CA-1.1.** As capacidades que a tela aberta pergunta, na ordem do legado,
 * antes de qualquer outra coisa.
 *
 * A ordem e observavel: na tela de apagamento, quem nao tem
 * `erase_others_personal_data` **nem chega** a pergunta por `delete_users`,
 * porque o legado usa `||` sobre as negacoes e o PHP curto-circuita. `every`
 * sobre a lista preserva o curto-circuito.
 *
 * ⚠️ **Nao e a validacao de `invalid_action`** de `abrirSolicitacao`
 * (`user.php:4812`): sao dois portoes diferentes, em dois momentos diferentes,
 * com dois desfechos diferentes — a tela que nao abre, contra a funcao que nao
 * grava. Os dois existem no legado e esta tarefa porta os dois.
 */
export function autorizarAbertura(
  autorizacao: AutorizacaoNaAbertura,
  superficie: SuperficieDeAbertura,
): DecisaoDaAbertura {
  const acaoDaTela = ACAO_DA_SUPERFICIE[superficie];
  const exigidas = CAPACIDADES_POR_ACAO[acaoDaTela] ?? [];
  const contexto = comAtor(autorizacao.base, autorizacao.ator);

  const tudoConcedido = exigidas.every((capacidade) =>
    perguntarPermissao(contexto, capacidade),
  );

  if (tudoConcedido) {
    return { desfecho: 'autorizado' };
  }

  return {
    desfecho: 'recusado',
    recusa: {
      ...RECUSA_PADRAO_DE_TELA,
      mensagem: MENSAGEM_DE_RECUSA_DA_SUPERFICIE[superficie],
    },
  };
}
