/**
 * O estado de falha da atualizacao automatica, e o registro de aviso enviado.
 *
 * Entrega de **T002** da feature `010-operacao-do-software`, primeiro dos tres
 * grupos que a tarefa nomeia: *"os pontos de configuracao que guardam falha de
 * atualizacao automatica ... existem com os valores de fabrica do legado e sao
 * lidos e gravados pela porta de dados"*.
 *
 * 🔴 **As duas opcoes daqui sao a unica memoria de operacao deste sistema.** A
 * secao *Modelo de dados* do plano desta feature e literal sobre
 * `auto_core_update_failed`: *"continua sendo o **unico** historico persistente
 * de falha do sistema inteiro"*. UC-35 repete: *"Nao ha log, nao ha tabela"*. E
 * o P7 explica por que isso nao se conserta: *"a arvore tem zero arquivo de log
 * ... e o unico historico persistente de falha e a opcao que marca atualizacao
 * automatica falhada"*. Acrescentar registro e permitido; fazer o fluxo
 * depender dele troca o produto.
 *
 * ── O VALOR DE FABRICA DOS DOIS E "NAO EXISTE" ─────────────────────────────
 *
 * E e uma afirmacao, nao uma lacuna: `populate_options()` **nao semeia** nenhuma
 * das duas — a lista de `$defaults` tem as tres da politica
 * (`wp-admin/includes/schema.php:550` a `:556`) e nenhuma das duas daqui —, e
 * `populate_network()` tambem nao as poe em `sitemeta`. Numa
 * instalacao de fabrica a leitura cai no default do chamador, que e `false` nos
 * cinco pontos onde o legado as le — nenhum deles passa segundo argumento para
 * `get_site_option()`. {@link SEM_FALHA_REGISTRADA} e {@link SEM_AVISO_ENVIADO}
 * nomeiam esse estado para que ninguem o confunda com um registro vazio: os
 * dois sao `null`, e a diferenca entre *"nunca falhou"* e *"falhou e o registro
 * esta vazio"* nao existe no legado.
 *
 * ── AS DUAS FORMAS DO REGISTRO DE FALHA, E POR QUE SAO DUAS ────────────────
 *
 * O legado grava `auto_core_update_failed` em **dois lugares, com chaves
 * diferentes**, e a diferenca e o que `A5` e `A6` leem depois:
 *
 * | | critica (`:826`) | comum (`:874`) |
 * |---|---|---|
 * | `attempted`, `current`, `error_code`, `error_data`, `timestamp` | sim | sim |
 * | `critical` | `true` | **ausente** |
 * | `retry` | **ausente** | `true` ou `false` |
 * | `rollback_code`, `rollback_data` | so quando a reversao tambem falhou (`:834`) | nunca |
 *
 * A ausencia e a regra: `! empty( $failure_data['critical'] )` congela a
 * automacao (`class-core-upgrader.php:327`) e `empty( $failure_data['retry'] )`
 * decide se o mesmo par de versoes pode ser tentado outra vez (`:341`).
 * Gravar as duas chaves sempre — uma delas com `false` — **mudaria a condicao
 * de congelamento**, porque `! empty( false )` e o mesmo que a ausencia mas
 * `isset()` nao e, e a tela de aviso usa `isset( $failed['attempted'] )`
 * (`wp-admin/includes/update.php:869`). Por isso ha **dois construtores** aqui,
 * e nao um com campos opcionais.
 *
 * E a **ordem das chaves** e a do legado, chave por chave, porque a ordem de
 * insercao e observavel nos bytes gravados (`plataforma/serializacao/valor-php.ts`:
 * *"a ordem de insercao e observavel"*).
 *
 * ── O QUE NAO ESTA AQUI ────────────────────────────────────────────────────
 *
 * - **A classificacao da falha.** Quais codigos de erro sao criticos
 *   (`disk_full`, `__copy_dir`, `do_rollback`, reversao que falhou) e quais sao
 *   transitorios (`incompatible_archive`, `download_failed`, `insane_distro`,
 *   `locked`) e **T019**, e CA-9.4 exige que ela seja *"declarada em um lugar
 *   so"* — declarar metade aqui seria o oposto.
 * - **Quem decide gravar, apagar e avisar.** Gravar e de T019, apagar e de T015
 *   e de T023 (`wp-admin/includes/update-core.php:1922`, dentro de
 *   `update_core()`, logo depois de `do_action( '_core_updated_successfully' )`),
 *   e o aviso e de T021. 🔴 **A condicao exata do apagamento e pergunta em
 *   aberto registrada** — a invariante de US-11 *"nao esta escrita em nenhum
 *   artefato desta analise"* (`spec.md`, *Perguntas em aberto*). Esta tarefa nao
 *   a decide: ela declara a opcao, o apagamento como operacao, e nada sobre
 *   quando chamar.
 * - **O numero de e-mails.** E o criterio de aceite declarado de PT-013 e
 *   depende de `A6` e `A7`, que sao T019 e T021.
 */

import {
  arranjoPorNome,
  booleano,
  inteiro,
  nomeDaChave,
  texto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import {
  OPCAO_DE_AVISO_DA_ATUALIZACAO,
  OPCAO_DE_FALHA_DA_ATUALIZACAO,
  verdadeiroComoNoPhp,
  type EscopoDeRede,
  type RepositorioDeOpcoesDeRede,
} from '../armazenamento/index.js';

/**
 * O estado de fabrica das duas opcoes: **nao existem**.
 *
 * Nenhuma das duas e semeada pelo instalador, e nenhum dos cinco pontos que as
 * leem passa default proprio para `get_site_option()`.
 */
export const SEM_FALHA_REGISTRADA = null;

/** O mesmo, para `auto_core_update_notified`. */
export const SEM_AVISO_ENVIADO = null;

/** A visao tipada do registro de falha. A **verdade e o arranjo** em {@link FalhaDeAtualizacao.bruta}. */
export interface FalhaDeAtualizacao {
  /** `attempted` — a versao que o sistema tentou aplicar. */
  readonly tentada: string;
  /** `current` — a versao em que o sistema estava quando tentou. */
  readonly corrente: string;
  /** `error_code` — o codigo que `A5` e `A6` classificam (T019). */
  readonly codigoDeErro: string;
  /** `error_data` — o dado do erro, como o legado o guarda: estrutura livre. */
  readonly dadoDoErro: ValorPhp;
  /** `timestamp` — o instante em segundos. */
  readonly instante: number;
  /**
   * `critical`: `! empty( $failure_data['critical'] )`
   * (`class-core-upgrader.php:327`). Registro comum **nao tem** a chave, e a
   * ausencia e falsa.
   */
  readonly critica: boolean;
  /**
   * `retry`: lido por `empty( $failure_data['retry'] )`
   * (`class-core-upgrader.php:341`). Registro critico **nao tem** a chave.
   */
  readonly repetivel: boolean;
  /** `rollback_code` — so existe quando a reversao tambem falhou (`:834`). */
  readonly codigoDaReversao: string | null;
  /** `rollback_data` — idem. */
  readonly dadoDaReversao: ValorPhp | null;
  /**
   * O arranjo como esta na coluna.
   *
   * Esta aqui porque a visao tipada e **somente leitura e incompleta de
   * proposito**: `error_data` do legado e o que `WP_Error::get_error_data()`
   * devolver, e isso e estrutura aberta. Reescrever o registro a partir da
   * visao tipada perderia chave que uma extensao tenha posto ali — e e por
   * `bruta` que se regrava sem perder nada.
   */
  readonly bruta: ValorPhp;
}

/** Os dados de um registro de falha **critica** (`class-wp-automatic-updater.php:826`). */
export interface PedidoDeFalhaCritica {
  readonly tentada: string;
  readonly corrente: string;
  readonly codigoDeErro: string;
  readonly dadoDoErro: ValorPhp;
  readonly instante: number;
  /**
   * As duas chaves extra, **so quando a reversao tambem falhou** — que e o
   * unico caso em que o legado as grava (`:834` a `:836`).
   */
  readonly reversao?: {
    readonly codigo: string;
    readonly dado: ValorPhp;
  };
}

/**
 * O registro de falha critica, na ordem de chaves do legado
 * (`class-wp-automatic-updater.php:826` a `:833`).
 *
 * `critical` e gravada com booleano `true`, e nao com `1`: o legado escreve
 * `'critical' => true`, e `maybe_serialize()` de um arranjo preserva o tipo
 * dentro dos bytes (`b:1;` e nao `i:1;`).
 */
export function registroDeFalhaCritica(pedido: PedidoDeFalhaCritica): ValorPhp {
  const pares: [string, ValorPhp][] = [
    ['attempted', texto(pedido.tentada)],
    ['current', texto(pedido.corrente)],
    ['error_code', texto(pedido.codigoDeErro)],
    ['error_data', pedido.dadoDoErro],
    ['timestamp', inteiro(pedido.instante)],
    ['critical', booleano(true)],
  ];
  if (pedido.reversao !== undefined) {
    pares.push(['rollback_code', texto(pedido.reversao.codigo)]);
    pares.push(['rollback_data', pedido.reversao.dado]);
  }
  return arranjoPorNome(pares);
}

/** Os dados de um registro de falha **comum** (`class-wp-automatic-updater.php:874`). */
export interface PedidoDeFalhaComum {
  readonly tentada: string;
  readonly corrente: string;
  readonly codigoDeErro: string;
  readonly dadoDoErro: ValorPhp;
  readonly instante: number;
  /**
   * `retry`: no legado e `in_array( $error_code, $transient_failures, true )`
   * (`:880`). Chega **decidido**, porque a lista de transitorios e de T019 —
   * CA-9.4 quer a classificacao em um lugar so.
   */
  readonly repetivel: boolean;
}

/**
 * O registro de falha comum, na ordem de chaves do legado
 * (`class-wp-automatic-updater.php:874` a `:881`).
 *
 * ⚠️ Ele **nao tem** a chave `critical`, e e por isso que a automacao nao
 * congela com ele. Acrescenta-la com `false` nao mudaria `! empty()`, mas
 * mudaria `isset()` — e a tela de aviso usa `isset()`
 * (`wp-admin/includes/update.php:869`).
 */
export function registroDeFalhaComum(pedido: PedidoDeFalhaComum): ValorPhp {
  return arranjoPorNome([
    ['attempted', texto(pedido.tentada)],
    ['current', texto(pedido.corrente)],
    ['error_code', texto(pedido.codigoDeErro)],
    ['error_data', pedido.dadoDoErro],
    ['timestamp', inteiro(pedido.instante)],
    ['retry', booleano(pedido.repetivel)],
  ]);
}

/**
 * Os quatro tipos de aviso que o legado grava em `auto_core_update_notified`,
 * declarados no proprio `@param` de `send_email()`
 * (`class-wp-automatic-updater.php:894`): *"Can be one of 'success', 'fail',
 * 'manual', 'critical'"*.
 *
 * A lista e **aberta** no tipo de propriedade de {@link AvisoDaAtualizacao}, e
 * nao fechada, porque o valor gravado e o argumento que chegou: o legado nao o
 * valida, e `DB-DEG` (BR-MIGRAR-083) manda reproduzir a degradacao em vez de
 * recusar.
 */
export const TIPOS_DE_AVISO_DA_ATUALIZACAO: readonly string[] = [
  'success',
  'fail',
  'manual',
  'critical',
];

/** A visao tipada do registro de aviso enviado. */
export interface AvisoDaAtualizacao {
  /** `type` — um de {@link TIPOS_DE_AVISO_DA_ATUALIZACAO}, sem validacao. */
  readonly tipo: string;
  /**
   * `email` — o `admin_email` **no instante do envio**, e nao o destinatario
   * resolvido depois: e com ele que `A7` compara (`:317` e `:866`).
   */
  readonly email: string;
  /** `version` — a versao oferecida, que e a outra metade da chave de `A7`. */
  readonly versao: string;
  /** `timestamp` — o instante do envio. */
  readonly instante: number;
  /** O arranjo como esta na coluna. */
  readonly bruto: ValorPhp;
}

/** Os dados de um registro de aviso (`class-wp-automatic-updater.php:901`). */
export interface PedidoDeAviso {
  readonly tipo: string;
  readonly email: string;
  readonly versao: string;
  readonly instante: number;
}

/**
 * O registro de aviso, na ordem de chaves do legado
 * (`class-wp-automatic-updater.php:901` a `:906`).
 */
export function registroDeAvisoDaAtualizacao(pedido: PedidoDeAviso): ValorPhp {
  return arranjoPorNome([
    ['type', texto(pedido.tipo)],
    ['email', texto(pedido.email)],
    ['version', texto(pedido.versao)],
    ['timestamp', inteiro(pedido.instante)],
  ]);
}

/**
 * As duas opcoes de rede do estado de atualizacao, lidas e gravadas pela porta
 * de dados.
 *
 * Todo metodo recebe o {@link EscopoDeRede} porque as duas sao opcao **de
 * rede** e a tabela muda com a instalacao — ver `../armazenamento/opcao.ts`.
 */
export interface EstadoDeAtualizacao {
  /**
   * `get_site_option( 'auto_core_update_failed' )`, com a visao tipada.
   *
   * Devolve {@link SEM_FALHA_REGISTRADA} quando a opcao nao existe **e** quando
   * o valor gravado nao e arranjo — nos dois casos o legado nao tem registro
   * para ler, e nenhum dos cinco pontos de leitura valida a forma.
   */
  lerFalha(escopo: EscopoDeRede): FalhaDeAtualizacao | null;
  /**
   * `! get_site_option( 'auto_core_update_failed' )` invertido: a verdade de
   * PHP do valor gravado (`class-wp-automatic-updater.php:856`).
   *
   * E metodo proprio e nao `lerFalha() !== null` porque as duas perguntas tem
   * respostas diferentes: um registro gravado como arranjo **vazio** e
   * `false` aqui e um registro ilegivel tambem — e e este metodo, e nao
   * {@link lerFalha}, que o portao de `A6` consulta.
   */
  temFalhaRegistrada(escopo: EscopoDeRede): boolean;
  /** `update_site_option( 'auto_core_update_failed', ... )` (`:838` e `:872`). */
  gravarFalha(escopo: EscopoDeRede, registro: ValorPhp): boolean;
  /**
   * `delete_site_option( 'auto_core_update_failed' )`
   * (`wp-admin/includes/update-core.php:1922`).
   *
   * 🔴 Quem chama, e sob que condicao, e **pergunta em aberto registrada** de
   * US-11. Ver o cabecalho.
   */
  apagarFalha(escopo: EscopoDeRede): boolean;
  /** `get_site_option( 'auto_core_update_notified' )` (`:313` e `:861`). */
  lerAviso(escopo: EscopoDeRede): AvisoDaAtualizacao | null;
  /** `update_site_option( 'auto_core_update_notified', ... )` (`:899`). */
  gravarAviso(escopo: EscopoDeRede, registro: ValorPhp): boolean;
}

export function criarEstadoDeAtualizacao(
  opcoesDeRede: RepositorioDeOpcoesDeRede,
): EstadoDeAtualizacao {
  return {
    lerFalha(escopo) {
      const leitura = opcoesDeRede.ler(escopo, OPCAO_DE_FALHA_DA_ATUALIZACAO);
      if (!leitura.existe || leitura.valor.tipo !== 'arranjo') {
        return SEM_FALHA_REGISTRADA;
      }
      const registro = leitura.valor;
      const reversao = valorDaChave(registro, 'rollback_code');
      return {
        tentada: comoCadeia(valorDaChave(registro, 'attempted')),
        corrente: comoCadeia(valorDaChave(registro, 'current')),
        codigoDeErro: comoCadeia(valorDaChave(registro, 'error_code')),
        dadoDoErro: valorDaChave(registro, 'error_data') ?? { tipo: 'nulo' },
        instante: comoNumero(valorDaChave(registro, 'timestamp')),
        critica: verdadeDaChave(registro, 'critical'),
        repetivel: verdadeDaChave(registro, 'retry'),
        codigoDaReversao: reversao === null ? null : comoCadeia(reversao),
        dadoDaReversao: valorDaChave(registro, 'rollback_data'),
        bruta: registro,
      };
    },

    temFalhaRegistrada(escopo) {
      const leitura = opcoesDeRede.ler(escopo, OPCAO_DE_FALHA_DA_ATUALIZACAO);
      return leitura.existe && verdadeiroComoNoPhp(leitura.valor);
    },

    gravarFalha(escopo, registro) {
      return opcoesDeRede.gravar(
        escopo,
        OPCAO_DE_FALHA_DA_ATUALIZACAO,
        registro,
      );
    },

    apagarFalha(escopo) {
      return opcoesDeRede.apagar(escopo, OPCAO_DE_FALHA_DA_ATUALIZACAO);
    },

    lerAviso(escopo) {
      const leitura = opcoesDeRede.ler(escopo, OPCAO_DE_AVISO_DA_ATUALIZACAO);
      if (!leitura.existe || leitura.valor.tipo !== 'arranjo') {
        return SEM_AVISO_ENVIADO;
      }
      const registro = leitura.valor;
      return {
        tipo: comoCadeia(valorDaChave(registro, 'type')),
        email: comoCadeia(valorDaChave(registro, 'email')),
        versao: comoCadeia(valorDaChave(registro, 'version')),
        instante: comoNumero(valorDaChave(registro, 'timestamp')),
        bruto: registro,
      };
    },

    gravarAviso(escopo, registro) {
      return opcoesDeRede.gravar(
        escopo,
        OPCAO_DE_AVISO_DA_ATUALIZACAO,
        registro,
      );
    },
  };
}

/**
 * O valor de uma chave nomeada do arranjo, ou `null` quando a chave nao esta.
 *
 * A ausencia e um resultado de primeira classe, e nao um erro: as duas formas
 * do registro de falha diferem **por chave ausente**, e e isso que `! empty()`
 * e `isset()` leem no legado.
 */
function valorDaChave(registro: ValorPhp, nome: string): ValorPhp | null {
  if (registro.tipo !== 'arranjo') {
    return null;
  }
  const entrada = registro.entradas.find(
    (candidata) => nomeDaChave(candidata.chave) === nome,
  );
  return entrada === undefined ? null : entrada.valor;
}

/** `! empty( $registro[ $nome ] )`: ausencia e falsa, e o resto e a verdade de PHP. */
function verdadeDaChave(registro: ValorPhp, nome: string): boolean {
  const valor = valorDaChave(registro, nome);
  return valor !== null && verdadeiroComoNoPhp(valor);
}

/** O `(string)` do PHP para os valores que estas chaves podem ter. */
function comoCadeia(valor: ValorPhp | null): string {
  if (valor === null) {
    return '';
  }
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
      // `(string) array()` do PHP e `'Array'`, com aviso. A chave nunca e
      // arranjo nestes dois registros; o ramo existe para nao lancar.
      return 'Array';
  }
}

/** O `(int)` do PHP, que e o que `timestamp` carrega. */
function comoNumero(valor: ValorPhp | null): number {
  if (valor === null) {
    return 0;
  }
  switch (valor.tipo) {
    case 'inteiro':
    case 'decimal':
      return Math.trunc(valor.valor);
    case 'booleano':
      return valor.valor ? 1 : 0;
    case 'texto': {
      const numero = Number.parseInt(comoCadeia(valor), 10);
      return Number.isNaN(numero) ? 0 : numero;
    }
    case 'nulo':
    case 'arranjo':
      return 0;
  }
}
