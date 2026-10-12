/**
 * A politica de atualizacao do nucleo: tres opcoes, duas constantes e quatro
 * pontos de extensao.
 *
 * Entrega de **T002** da feature `010-operacao-do-software`, segundo dos tres
 * grupos que a tarefa nomeia. A secao *Modelo de dados* do plano descreve
 * exatamente o que esta aqui — *"opcoes e constantes: correcao e manutencao
 * ligadas de fabrica, versao principal nascendo sem escolha, constante vencendo
 * opcao, falso desligando tudo, e ponto de extensao podendo reverter a
 * decisao"* — e termina com a frase que fixa a forma: **"a precedencia e
 * contrato: constante, depois opcao, depois ponto de extensao"**.
 *
 * `A3` (BR-MIGRAR-047) e a regra, e a justificativa de migracao dela e literal
 * sobre o que o alvo precisa: *"O alvo precisa de uma ordem de precedencia
 * declarada, nao herdada do acidente de carregamento"*. Por isso
 * {@link resolverPoliticaDeAtualizacao} existe como funcao com nome, e nao como
 * sequencia de `if` dentro do portao que a consome.
 *
 * ── 🔴 O QUE T002 ENCONTROU, E NAO RESOLVEU ────────────────────────────────
 *
 * **O valor de fabrica de `auto_update_core_major` tem DOIS valores no legado, e
 * eles nao concordam.** Nao esta registrado em artefato nenhum do pacote — nem
 * na `spec.md`, nem em `index.md`, nem em `ambiguity_log.md`, nem em
 * `pending_decisions.md` — e foi encontrado ao ancorar esta tarefa:
 *
 * | onde | valor | ancora |
 * |---|---|---|
 * | o que o instalador **semeia** | `'enabled'` | `wp-admin/includes/schema.php:556`, com o comentario *"Default to enabled for new installs"* e o bilhete do ticket 51742 |
 * | o que a leitura assume na **ausencia** da opcao | `'unset'` | `wp-admin/includes/class-core-upgrader.php:290` e `wp-admin/update-core.php:335` |
 *
 * Os dois sao do legado e **nao se contradizem dentro dele**: numa instalacao de
 * site unico `populate_options()` grava `'enabled'` em `{site}options` e
 * `get_site_option()` o le de la, logo versao **maior atualiza sozinha**; numa
 * rede `populate_network()` nao poe nada em `sitemeta`, a leitura cai no default
 * `'unset'` e versao maior **nao** atualiza. A assimetria e real, tem ancora, e
 * **esta reproduzida aqui**: {@link POLITICA_SEMEADA_NA_INSTALACAO} e
 * {@link POLITICA_NA_AUSENCIA_DA_OPCAO} sao constantes separadas de proposito.
 *
 * O que **nao** e decidivel nesta tarefa e a consequencia:
 *
 * - **CA-8.1** diz *"mudanca de versao principal so com escolha explicita"*;
 * - **`A2`/BR-MIGRAR-046** diz *"`auto_update_core_major` nasce `'unset'`"* e
 *   chama o sentinela de regra;
 * - o cenario *"Versao menor atualiza por padrao, versao maior so com escolha
 *   explicita"* de `parity_tests/13-atualizacao-automatica-do-nucleo.feature`
 *   cobra *"Entao nenhuma das duas atualiza"* para versao maior;
 * - e o legado, numa instalacao **nova de site unico** — que e o alvo fixado
 *   pela resposta 2 —, **atualiza**.
 *
 * Os tres primeiros descrevem a leitura de rede ou uma instalacao atualizada de
 * antes da 5.6 (`wp-admin/includes/upgrade.php:2279` grava `'unset'`
 * exatamente nesse caso, com o comentario *"This overrides the same option from
 * populate_options() that is intended for new installs"*). O quarto e o
 * comportamento observavel do produto que esta sendo clonado, e o P1 o poe como
 * especificacao. **Escolher entre eles e decidir o valor de fabrica de uma
 * regra de negocio documentada em `domain.md`, que a tabela *Nao negociavel* da
 * constituicao proibe decidir sozinho.** T002 declara os dois, com ancora, e
 * **nao escolhe**: quem resolver o portao de `A2` (T017) encontra os dois aqui
 * e para, como esta registrado no `README.md` deste modulo.
 *
 * ── O QUE NAO ESTA AQUI: OS TRES PONTOS DE EXTENSAO NAO SAO APLICADOS ──────
 *
 * E a parte mais facil de errar. `allow_dev_auto_core_updates`,
 * `allow_minor_auto_core_updates` e `allow_major_auto_core_updates` sao
 * aplicados pelo legado **tarde e um por vez**, cada um no ramo de versao dele:
 * o de desenvolvimento so quando a versao instalada e de desenvolvimento
 * (`class-core-upgrader.php:357`), o menor so quando o ramo e o mesmo (`:373`),
 * o maior so quando o ramo e maior (`:386`). Numa chamada **um** deles dispara.
 *
 * Aplica-los aqui, os tres de uma vez, faria disparar ponto de extensao que o
 * legado nao dispararia — e P2 poe *"a ordem de disparo"* no contrato publico.
 * O que esta funcao devolve e o valor **que cada filtro vai receber como
 * argumento**, que no legado e o `$upgrade_dev`/`$upgrade_minor`/`$upgrade_major`
 * ao fim do bloco da constante (`:288` a `:312`). Aplicar cada um, no ramo
 * dele, e de T015 e T017.
 *
 * ⚠️ E a tela faz diferente: `wp-admin/update-core.php:383` a `:387` aplica os
 * **tres** de uma vez, porque ali ela esta desenhando caixas de selecao e nao
 * decidindo atualizacao. As duas posicoes sao do legado e as duas migram, cada
 * uma na tarefa dela — a tela e BC-10.
 *
 * O quarto ponto de extensao, `automatic_updater_disabled`, desliga a automacao
 * inteira e e consultado antes de tudo (`class-wp-automatic-updater.php:58`).
 * Ele tambem nao e aplicado aqui: o portao de `is_disabled()` e de T017, e ele
 * olha mais duas coisas que nao sao configuracao desta feature —
 * `wp_is_file_mod_allowed( 'automatic_updater' )` e `wp_installing()`
 * (`:35` e `:39`).
 */

import { texto, type ValorPhp } from '../../../plataforma/serializacao/index.js';
import {
  OPCAO_DE_ATUALIZACAO_DE_DESENVOLVIMENTO,
  OPCAO_DE_ATUALIZACAO_MAIOR,
  OPCAO_DE_ATUALIZACAO_MENOR,
  type EscopoDeRede,
  type RepositorioDeOpcoesDeRede,
} from '../armazenamento/index.js';

/** `'enabled'` — o unico valor que as tres opcoes comparam como ligado. */
export const POLITICA_LIGADA = 'enabled';

/**
 * `'disabled'` — o valor que a tela grava ao desligar
 * (`wp-admin/update-core.php:1314`).
 *
 * Qualquer valor diferente de `'enabled'` tem o mesmo efeito na leitura, porque
 * a comparacao e `=== 'enabled'`. Este nome existe porque e o valor que o
 * produto **grava**, e nao porque a leitura o distinga.
 */
export const POLITICA_DESLIGADA = 'disabled';

/**
 * `'unset'` — o sentinela de *"ninguem escolheu"*.
 *
 * BR-MIGRAR-046 o chama de regra: *"O sentinela `'unset'` (diferente de
 * `true`/`false`) e a regra"*, e e *"tres estados numa opcao que o DDL nao
 * distingue"*. Na leitura ele e indistinguivel de `'disabled'`; a diferenca
 * aparece na **tela**, que oferece a escolha quando o valor e `'unset'` e nao a
 * oferece quando alguem ja escolheu.
 */
export const POLITICA_SEM_ESCOLHA = 'unset';

/** O valor das tres opcoes, como texto, porque e texto que a coluna guarda. */
export interface OpcoesDaPoliticaDeAtualizacao {
  /** `auto_update_core_dev`. */
  readonly desenvolvimento: string;
  /** `auto_update_core_minor` — a correcao e a manutencao de `A2`. */
  readonly menor: string;
  /** `auto_update_core_major` — a versao principal de `A2`. */
  readonly maior: string;
}

/**
 * O que o instalador **grava** numa instalacao nova
 * (`wp-admin/includes/schema.php:550`, `:551` e `:556`).
 *
 * 🔴 As tres com `'enabled'`, **inclusive a de versao maior** — ver o conflito
 * no cabecalho deste arquivo.
 */
export const POLITICA_SEMEADA_NA_INSTALACAO: OpcoesDaPoliticaDeAtualizacao = {
  desenvolvimento: POLITICA_LIGADA,
  menor: POLITICA_LIGADA,
  maior: POLITICA_LIGADA,
};

/**
 * O que a **leitura** assume quando a opcao nao esta na tabela
 * (`wp-admin/includes/class-core-upgrader.php:288` a `:290`, e o mesmo trio em
 * `wp-admin/update-core.php:333` a `:335`).
 *
 * 🔴 A de versao maior e `'unset'` aqui e `'enabled'` em
 * {@link POLITICA_SEMEADA_NA_INSTALACAO} — ver o conflito no cabecalho.
 */
export const POLITICA_NA_AUSENCIA_DA_OPCAO: OpcoesDaPoliticaDeAtualizacao = {
  desenvolvimento: POLITICA_LIGADA,
  menor: POLITICA_LIGADA,
  maior: POLITICA_SEM_ESCOLHA,
};

/**
 * `'on'`: o autocarregamento com que o instalador semeia as tres.
 *
 * `populate_options()` grava `'off'` so para as opcoes da lista `$fat_options`,
 * e nenhuma das tres esta nela (`wp-admin/includes/schema.php:582` para a lista,
 * `:600` para o teste).
 * Esta declarado porque e **efeito no banco** — a coluna `autoload` entra no
 * snapshot que a area da Decisao 2 compara —, e porque em site unico a escrita
 * posterior pela tela grava `'off'`, pelo caminho de opcao de rede: a mesma
 * opcao muda de autocarregamento depois da primeira escolha explicita.
 */
export const AUTOCARREGAMENTO_DA_POLITICA_SEMEADA = 'on';

/**
 * A declaracao da instalacao, isto e, a constante `WP_AUTO_UPDATE_CORE`.
 *
 * Nao e lida do banco e nao chega pela porta de dados: e **entrada lida de
 * fora**, como `EstadoDaRede` em BC-01. `declarada: false` e o caso de fabrica,
 * porque `wp-config-sample.php` nao a define.
 */
export type DeclaracaoDeAtualizacaoDoNucleo =
  | { readonly declarada: false }
  | { readonly declarada: true; readonly valor: boolean | string };

/** O caso de fabrica: a constante nao esta definida. */
export const POLITICA_NAO_DECLARADA: DeclaracaoDeAtualizacaoDoNucleo = {
  declarada: false,
};

/**
 * Os quatro canais de pre-lancamento que a constante aceita, e que ligam
 * **tudo** (`wp-admin/includes/class-core-upgrader.php:300`).
 *
 * Os mesmos quatro viajam para o servico de versoes como `channel` quando a
 * constante tem um deles (`wp-includes/update.php:220` a `:223`) — o que e de
 * T015, nao desta tarefa.
 */
export const CANAIS_DE_PRE_LANCAMENTO: readonly string[] = [
  'beta',
  'rc',
  'development',
  'branch-development',
];

/**
 * `'minor'`: o unico valor da constante que liga so a atualizacao menor
 * (`wp-admin/includes/class-core-upgrader.php:306`).
 */
export const CANAL_SO_DE_VERSAO_MENOR = 'minor';

/** `AUTOMATIC_UPDATER_DISABLED` (`class-wp-automatic-updater.php:44`). */
export const CONSTANTE_QUE_DESLIGA_A_AUTOMACAO = 'AUTOMATIC_UPDATER_DISABLED';

/** `WP_AUTO_UPDATE_CORE` (`class-core-upgrader.php:293`). */
export const CONSTANTE_DA_POLITICA_DO_NUCLEO = 'WP_AUTO_UPDATE_CORE';

/**
 * `automatic_updater_disabled` — o ponto de extensao que desliga a automacao
 * inteira, e que *"parallels the AUTOMATIC_UPDATER_DISABLED constant in name"*
 * (`class-wp-automatic-updater.php:58`).
 *
 * ⚠️ O proprio comentario do legado registra o efeito colateral: *"This also
 * disables update notification emails. That may change in the future"*
 * (`:52`). Desligar a automacao desliga **tambem os avisos**, e isso e o numero
 * de e-mails de PT-013.
 */
export const PONTO_DE_EXTENSAO_QUE_DESLIGA_A_AUTOMACAO =
  'automatic_updater_disabled';

/**
 * Os tres pontos de extensao por ramo de versao, com o nome do legado.
 *
 * ⚠️ **Nenhum e aplicado neste arquivo** — ver o cabecalho. Estao declarados
 * porque P2 poe o ponto de extensao como produto e manda preservar *"o nome, os
 * argumentos, a ordem de disparo e a capacidade de alterar o resultado"*: quem
 * os aplicar (T015, T017) parte daqui e nao os redescobre.
 */
export const PONTOS_DE_EXTENSAO_DA_POLITICA = {
  /** `allow_dev_auto_core_updates` (`class-core-upgrader.php:357`). */
  desenvolvimento: 'allow_dev_auto_core_updates',
  /** `allow_minor_auto_core_updates` (`class-core-upgrader.php:373`). */
  menor: 'allow_minor_auto_core_updates',
  /** `allow_major_auto_core_updates` (`class-core-upgrader.php:386`). */
  maior: 'allow_major_auto_core_updates',
} as const;

/**
 * A politica depois de a constante vencer a opcao: os tres valores que os tres
 * pontos de extensao vao receber como argumento.
 */
export interface PoliticaDeAtualizacaoResolvida {
  readonly desenvolvimento: boolean;
  readonly menor: boolean;
  readonly maior: boolean;
}

/**
 * Os dois primeiros niveis da precedencia de `A3`: a opcao, e a constante
 * vencendo a opcao.
 *
 * E a transcricao do bloco `class-core-upgrader.php:288` a `:312`, com os
 * quatro ramos da constante:
 *
 * | constante | desenvolvimento | menor | maior |
 * |---|---|---|---|
 * | nao declarada | da opcao | da opcao | da opcao |
 * | `false` | falso | falso | falso |
 * | `true` ou um dos quatro canais | verdadeiro | verdadeiro | verdadeiro |
 * | `'minor'` | falso | **verdadeiro** | falso |
 * | qualquer outro valor | da opcao | da opcao | da opcao |
 *
 * ⚠️ **A ultima linha e do legado e e facil de perder.** O bloco e uma cadeia
 * de `if`/`elseif` sem `else`: uma constante com valor que o legado nao
 * reconhece — `'major'`, `'1'`, `1` — **nao desliga nada e nao liga nada**, e a
 * opcao continua valendo. Um porte que normalizasse valor desconhecido para
 * falso desligaria a automacao de uma instalacao que o legado deixa ligada.
 *
 * E `'minor'` e o unico ramo **assimetrico**: ele desliga desenvolvimento e
 * maior e liga menor, sem olhar a opcao de nenhum dos tres.
 */
export function resolverPoliticaDeAtualizacao(
  opcoes: OpcoesDaPoliticaDeAtualizacao,
  declaracao: DeclaracaoDeAtualizacaoDoNucleo,
): PoliticaDeAtualizacaoResolvida {
  const daOpcao: PoliticaDeAtualizacaoResolvida = {
    desenvolvimento: opcoes.desenvolvimento === POLITICA_LIGADA,
    menor: opcoes.menor === POLITICA_LIGADA,
    maior: opcoes.maior === POLITICA_LIGADA,
  };

  if (!declaracao.declarada) {
    return daOpcao;
  }

  const valor = declaracao.valor;

  if (valor === false) {
    return { desenvolvimento: false, menor: false, maior: false };
  }
  if (
    valor === true ||
    (typeof valor === 'string' && CANAIS_DE_PRE_LANCAMENTO.includes(valor))
  ) {
    return { desenvolvimento: true, menor: true, maior: true };
  }
  if (valor === CANAL_SO_DE_VERSAO_MENOR) {
    return { desenvolvimento: false, menor: true, maior: false };
  }
  return daOpcao;
}

/** As tres opcoes da politica, lidas e gravadas pela porta de dados. */
export interface PoliticaDeAtualizacao {
  /**
   * As tres opcoes como texto, com {@link POLITICA_NA_AUSENCIA_DA_OPCAO} onde a
   * opcao nao existe. Tres `SELECT`, que e o que o legado emite com o cache de
   * objeto desligado.
   */
  lerOpcoes(escopo: EscopoDeRede): OpcoesDaPoliticaDeAtualizacao;
  /**
   * {@link lerOpcoes} seguido de {@link resolverPoliticaDeAtualizacao}: a
   * precedencia de `A3` sem os pontos de extensao, que sao aplicados tarde e um
   * por vez pelo ramo de versao (ver o cabecalho).
   */
  ler(
    escopo: EscopoDeRede,
    declaracao: DeclaracaoDeAtualizacaoDoNucleo,
  ): PoliticaDeAtualizacaoResolvida;
  /**
   * `update_site_option( 'auto_update_core_major', ... )` — a escolha explicita
   * de versao maior (`wp-admin/update-core.php:1311` e `:1314`).
   *
   * E a **unica** das tres opcoes que o produto escreve em execucao: as outras
   * duas so existem como linha semeada pelo instalador e como filtro. Quem
   * chama, com que capacidade e com que token de tela e de T015 — a tela exige
   * `update_core` e o nonce `core-major-auto-updates-nonce` (`:1301` e `:1308`).
   */
  gravarEscolhaDeVersaoMaior(escopo: EscopoDeRede, valor: string): boolean;
}

export function criarPoliticaDeAtualizacao(
  opcoesDeRede: RepositorioDeOpcoesDeRede,
): PoliticaDeAtualizacao {
  function lerTexto(
    escopo: EscopoDeRede,
    nome: string,
    naAusencia: string,
  ): string {
    const leitura = opcoesDeRede.ler(escopo, nome);
    if (!leitura.existe) {
      return naAusencia;
    }
    return cadeiaDoValor(leitura.valor);
  }

  function lerOpcoes(escopo: EscopoDeRede): OpcoesDaPoliticaDeAtualizacao {
    return {
      desenvolvimento: lerTexto(
        escopo,
        OPCAO_DE_ATUALIZACAO_DE_DESENVOLVIMENTO,
        POLITICA_NA_AUSENCIA_DA_OPCAO.desenvolvimento,
      ),
      menor: lerTexto(
        escopo,
        OPCAO_DE_ATUALIZACAO_MENOR,
        POLITICA_NA_AUSENCIA_DA_OPCAO.menor,
      ),
      maior: lerTexto(
        escopo,
        OPCAO_DE_ATUALIZACAO_MAIOR,
        POLITICA_NA_AUSENCIA_DA_OPCAO.maior,
      ),
    };
  }

  return {
    lerOpcoes,

    ler(escopo, declaracao) {
      return resolverPoliticaDeAtualizacao(lerOpcoes(escopo), declaracao);
    },

    gravarEscolhaDeVersaoMaior(escopo, valor) {
      return opcoesDeRede.gravar(
        escopo,
        OPCAO_DE_ATUALIZACAO_MAIOR,
        texto(valor),
      );
    },
  };
}

/**
 * O `(string)` do PHP para o valor lido, porque a comparacao do legado e
 * `=== 'enabled'` sobre o que a coluna devolveu.
 *
 * Valor que nao e texto nunca chega nestas tres opcoes pelo caminho do produto;
 * o ramo existe para nao lancar diante de dado degradado, que `DB-DEG`
 * (BR-MIGRAR-083) manda tolerar em vez de recusar.
 */
function cadeiaDoValor(valor: ValorPhp): string {
  switch (valor.tipo) {
    case 'nulo':
      return '';
    case 'booleano':
      return valor.valor ? '1' : '';
    case 'inteiro':
    case 'decimal':
      return String(valor.valor);
    case 'texto':
      return typeof valor.valor === 'string'
        ? valor.valor
        : new TextDecoder().decode(valor.valor);
    case 'arranjo':
      return 'Array';
  }
}
