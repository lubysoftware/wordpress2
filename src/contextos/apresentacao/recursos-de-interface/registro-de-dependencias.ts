/**
 * O registro de recursos de interface — `WP_Dependencies`
 * (`wp-includes/class-wp-dependencies.php:19`) e o item que ele guarda,
 * `_WP_Dependency` (`wp-includes/class-wp-dependency.php:20`).
 *
 * Entrega de **T023** (US-11): *"Declarar e enfileirar os recursos de interface
 * com dependencia e versao"*. Este arquivo e onde moram **CA-11.1** (registrar
 * com identificador, endereco, dependencias e versao), **CA-11.2** (a ordem que
 * respeita as dependencias, e a dependencia ausente reportada), **CA-11.4** (o
 * que nao foi enfileirado nao e entregue) e **CA-11.5** (o mesmo recurso, uma
 * vez so). **CA-11.3** — a versao no endereco — e `./endereco-servido.ts`.
 *
 * | metodo do legado | ancora | aqui |
 * |---|---|---|
 * | `add()` | `class-wp-dependencies.php:281` | {@link RegistroDeRecursos.registrar} |
 * | `remove()` | `:359` | {@link RegistroDeRecursos.desregistrar} |
 * | `enqueue()` | `:378` | {@link RegistroDeRecursos.enfileirar} |
 * | `dequeue()` | `:412` | {@link RegistroDeRecursos.desenfileirar} |
 * | `query()` e `recurse_deps()` | `:476`, `:438` | {@link RegistroDeRecursos.consultar} |
 * | `all_deps()` e `set_group()` | `:193`, `:511` | {@link RegistroDeRecursos.resolverDependencias} |
 * | `do_items()` e `do_item()` | `:134`, `:172` | {@link RegistroDeRecursos.processar} |
 *
 * ## O registro e por requisicao, e por isso e fabrica
 *
 * No legado o registro e o global `$wp_scripts` (`functions.wp-scripts.php:20`)
 * ou `$wp_styles` (`functions.wp-styles.php:20`), montado no arranque e
 * descartado com o processo. `EXT-CONTEXTO` (BR-MIGRAR-105) poe estado montado
 * no arranque no escopo da **requisicao**: este arquivo nao guarda instancia
 * nenhuma, e {@link criarRegistroDeRecursos} devolve um registro novo a cada
 * chamada — quem o guarda e a composicao da requisicao. Num processo longevo um
 * registro compartilhado entregaria a uma pagina o que outra enfileirou.
 *
 * ## Quatro comportamentos que um porte "arruma", todos reproduzidos
 *
 * 1. 🔴 **Ciclo de dependencia nao e detectado.** O docblock de `all_deps()` e
 *    literal — *"Does NOT catch infinite loops"* (`:180`) —, e o ramo de
 *    `set_group()` que devolveria "ja visto" so corta quando o item ja esta em
 *    `to_do`, o que um ciclo nunca alcanca. No PHP 8.3 a recursao termina em
 *    erro fatal de pilha; aqui, em `RangeError` do runtime. A tabela
 *    *Contratos* de `plan.md` lista *"ciclo de dependencia"* como erro de
 *    enfileirar, e nenhum criterio de US-11 o pede: ver `../README.md`, *O que
 *    T023 entrega*, achado 1.
 * 2. **Registrar de novo nao sobrescreve**: `add()` devolve `false` e o
 *    primeiro registro vale (`:282`-`:284`). E metade de CA-11.5.
 * 3. **Enfileirar antes de registrar e lembrado**, e o registro posterior
 *    enfileira sozinho (`:288`-`:296`, `:391`-`:396`).
 * 4. **A dependencia ausente derruba o recurso e quem depende dele**, e o aviso
 *    sai **uma vez por recurso, e so para quem declarou a dependencia
 *    diretamente** (`:217`-`:233`): o recurso que depende de um recurso
 *    quebrado some em silencio.
 *
 * ## O que este registro NAO tem, de proposito
 *
 * Dado extra (`add_data()`/`get_data()`, `:313`, `:339`) e tudo que depende
 * dele — a divisao entre cabecalho e rodape de `WP_Scripts::set_group()`
 * (`class-wp-scripts.php:693`), estrategia de carga, prioridade, comentario
 * condicional, direcao da escrita e titulo de estilo —, os scripts em linha, as
 * traducoes, a concatenacao do painel e a etiqueta de cache (`get_etag()`,
 * `:533`). Nenhum e criterio de US-11; a lista com ancora esta em
 * `../README.md`. Sem dado extra, o grupo de todo recurso e `0`, que e o que o
 * legado calcula para recurso sem `group` e sem `in_footer`.
 */

import {
  processarItem,
  type ConfiguracaoDoRegistro,
  type ContextoDoRegistro,
  type EspecieDeRecurso,
  type RecursoEntregue,
} from './endereco-servido.js';

/**
 * A versao de um recurso — `$ver` de `add()` (`:272`).
 *
 * `false` (o padrao) pede a versao do produto; `null` pede nenhuma; o resto e
 * a versao. O tipo admite numero e verdadeiro porque o legado os admite e os
 * converte (`is_scalar()`, `class-wp-scripts.php:423`).
 */
export type VersaoDoRecurso = string | number | boolean | null;

/** O estado consultavel — o `$status` de `query()` (`:476`), com os sinonimos antigos. */
export type EstadoDoRecurso =
  | 'registered'
  | 'scripts'
  | 'enqueued'
  | 'queue'
  | 'to_do'
  | 'to_print'
  | 'done'
  | 'printed';

/**
 * Um recurso registrado — `_WP_Dependency` (`class-wp-dependency.php:20`).
 *
 * Os cinco campos chegam na ordem do construtor (`:99`). **CA-11.1** e isto:
 * identificador, endereco, dependencias e versao, mais o argumento livre que
 * o estilo usa para a midia.
 */
export interface RecursoRegistrado {
  /** `$handle`. */
  readonly identificador: string;
  /**
   * `$src`. `false` faz do recurso um **apelido** do conjunto de que ele
   * depende (`:32`): entra na ordem, e nao tem endereco.
   */
  readonly endereco: string | false;
  /** `$deps`, na ordem declarada. */
  readonly dependencias: readonly string[];
  /** `$ver`. */
  readonly versao: VersaoDoRecurso;
  /** `$args` — *"Custom property, such as $in_footer or $media"* (`:63`). */
  readonly argumentos: unknown;
}

/** O registro de uma especie de recurso, com o estado da requisicao dentro. */
export interface RegistroDeRecursos {
  readonly especie: EspecieDeRecurso;

  /**
   * `add( $handle, $src, $deps, $ver, $args )` (`:281`). Devolve `false`, sem
   * tocar no registro, quando o identificador ja existe.
   */
  registrar(
    identificador: string,
    endereco: string | false,
    dependencias?: readonly string[],
    versao?: VersaoDoRecurso,
    argumentos?: unknown,
  ): boolean;

  /** `remove( $handles )` (`:359`). Tira do registro; a fila nao muda. */
  desregistrar(identificadores: string | readonly string[]): void;

  /**
   * `enqueue( $handles )` (`:378`). Aceita `identificador?argumentos`, e o
   * texto depois do primeiro `?` vai para o endereco.
   */
  enfileirar(identificadores: string | readonly string[]): void;

  /** `dequeue( $handles )` (`:412`). */
  desenfileirar(identificadores: string | readonly string[]): void;

  /** `query( $handle, $status )` (`:476`). */
  consultar(
    identificador: string,
    estado?: EstadoDoRecurso,
  ): RecursoRegistrado | boolean;

  /**
   * `all_deps( $handles )` (`:193`) no nivel de cima: poe em `aFazer` cada
   * identificador depois das dependencias dele.
   */
  resolverDependencias(identificadores: string | readonly string[]): boolean;

  /**
   * `do_items( $handles )` (`:134`): resolve as dependencias da fila (ou dos
   * identificadores pedidos) e entrega cada recurso na ordem. Devolve
   * **todos** os ja processados nesta requisicao, como o legado.
   */
  processar(identificadores?: string | readonly string[] | false): readonly string[];

  /** `$registered`, na ordem de registro. */
  registrados(): ReadonlyMap<string, RecursoRegistrado>;
  /** `$queue`. */
  fila(): readonly string[];
  /** `$to_do`. */
  aFazer(): readonly string[];
  /** `$done`. */
  feitos(): readonly string[];
  /**
   * O que `do_item()` imprimiria, na ordem — a marcacao em si e da borda (ver
   * `./endereco-servido.ts`).
   */
  entregues(): readonly RecursoEntregue[];
}

/** `(array) $handles` sobre texto ou lista. */
function comoLista(identificadores: string | readonly string[]): readonly string[] {
  return typeof identificadores === 'string' ? [identificadores] : identificadores;
}

/**
 * `explode( '?', $handle )` e as duas primeiras partes: o que vem depois do
 * **segundo** `?` some, como no legado.
 */
function separarArgumentos(bruto: string): { identificador: string; argumentos: string | undefined } {
  const partes = bruto.split('?');
  return { identificador: partes[0] ?? '', argumentos: partes[1] };
}

/**
 * Cria o registro de uma especie, vazio.
 *
 * Vazio de verdade: o construtor de `WP_Scripts` dispara `wp_default_scripts`
 * (`class-wp-scripts.php:170`) e o de `WP_Styles` dispara `wp_default_styles`
 * (`class-wp-styles.php:121`), e e por esses pontos de extensao que os
 * recursos de fabrica do nucleo chegam (`wp-includes/default-filters.php:610`,
 * `:658`). O barramento de pontos de extensao (REQ-162) esta em
 * `do-not-rewrite.md`; os nomes estao em `PONTOS_DE_EXTENSAO_DOS_RECURSOS`, e
 * quem registra os recursos de fabrica e o arranque.
 */
export function criarRegistroDeRecursos(
  especie: EspecieDeRecurso,
  configuracao: ConfiguracaoDoRegistro,
  contexto: ContextoDoRegistro,
): RegistroDeRecursos {
  const registrados = new Map<string, RecursoRegistrado>();
  let fila: string[] = [];
  let aFazer: string[] = [];
  const feitos: string[] = [];
  const argumentosDaFila = new Map<string, string>();
  const grupos = new Map<string, number>();
  let todasAsDependenciasDaFila: Set<string> | null = null;
  const enfileiradosAntesDoRegistro = new Map<string, string | null>();
  const comDependenciaAusente: string[] = [];
  const entregues: RecursoEntregue[] = [];

  // `set_group()` (`:511`). `(int) false` e 0.
  const definirGrupo = (identificador: string, grupo: number | false): boolean => {
    const nivel = grupo === false ? 0 : grupo;
    const atual = grupos.get(identificador);
    if (atual !== undefined && atual <= nivel) {
      return false;
    }
    grupos.set(identificador, nivel);
    return true;
  };

  // `all_deps()` (`:193`-`:256`), linha a linha.
  const todasAsDependencias = (
    identificadores: readonly string[],
    recursao: boolean,
    grupo: number | false,
  ): boolean => {
    if (identificadores.length === 0) {
      return false;
    }

    for (const bruto of identificadores) {
      const { identificador, argumentos } = separarArgumentos(bruto);
      const naFila = aFazer.includes(identificador);

      if (feitos.includes(identificador)) {
        continue;
      }

      const movido = definirGrupo(identificador, grupo);
      const novoGrupo = grupos.get(identificador) ?? 0;

      if (naFila && !movido) {
        continue;
      }

      let seguir = true;
      const recurso = registrados.get(identificador);
      let ausentes: string[] = [];
      if (recurso !== undefined && recurso.dependencias.length > 0) {
        // `array_diff()`: preserva a ordem e a repeticao das declaradas.
        ausentes = recurso.dependencias.filter((dependencia) => !registrados.has(dependencia));
      }
      if (recurso === undefined) {
        seguir = false;
      } else if (ausentes.length > 0) {
        if (!comDependenciaAusente.includes(identificador)) {
          contexto.avisar?.(avisoDeDependenciaAusente(especie, identificador, ausentes));
          comDependenciaAusente.push(identificador);
        }
        seguir = false;
      } else if (
        recurso.dependencias.length > 0 &&
        !todasAsDependencias(recurso.dependencias, true, novoGrupo)
      ) {
        seguir = false;
      }

      if (!seguir) {
        if (recursao) {
          return false;
        }
        continue;
      }

      if (naFila) {
        continue;
      }

      if (argumentos !== undefined) {
        argumentosDaFila.set(identificador, argumentos);
      }

      aFazer.push(identificador);
    }

    return true;
  };

  const enfileirar = (identificadores: string | readonly string[]): void => {
    for (const bruto of comoLista(identificadores)) {
      const { identificador, argumentos } = separarArgumentos(bruto);
      if (!fila.includes(identificador) && registrados.has(identificador)) {
        fila.push(identificador);
        todasAsDependenciasDaFila = null;
        if (argumentos !== undefined) {
          argumentosDaFila.set(identificador, argumentos);
        }
      } else if (!registrados.has(identificador)) {
        enfileiradosAntesDoRegistro.set(identificador, argumentos ?? null);
      }
    }
  };

  // `recurse_deps()` (`:438`): o fecho da fila, guardado ate a fila mudar. Ele
  // NAO e refeito quando o registro muda — so `enqueue()` e `dequeue()` o
  // anulam (`:386`, `:419`).
  const dependeDaFila = (identificador: string): boolean => {
    if (todasAsDependenciasDaFila !== null) {
      return todasAsDependenciasDaFila.has(identificador);
    }
    const todas = new Set<string>(fila);
    const pilha: (readonly string[])[] = [];
    const vistos = new Set<string>();
    let atual: readonly string[] | undefined = fila;
    while (atual !== undefined && atual.length > 0) {
      for (const enfileirado of atual) {
        const recurso = registrados.get(enfileirado);
        if (!vistos.has(enfileirado) && recurso !== undefined) {
          if (recurso.dependencias.length > 0) {
            for (const dependencia of recurso.dependencias) {
              todas.add(dependencia);
            }
            pilha.push(recurso.dependencias);
          }
          vistos.add(enfileirado);
        }
      }
      atual = pilha.pop();
    }
    todasAsDependenciasDaFila = todas;
    return todas.has(identificador);
  };

  return {
    especie,

    registrar(identificador, endereco, dependencias = [], versao = false, argumentos = null) {
      if (registrados.has(identificador)) {
        return false;
      }
      registrados.set(identificador, {
        identificador,
        endereco,
        dependencias: [...dependencias],
        versao,
        argumentos,
      });

      if (enfileiradosAntesDoRegistro.has(identificador)) {
        const lembrado = enfileiradosAntesDoRegistro.get(identificador);
        enfileirar(
          lembrado !== null && lembrado !== undefined
            ? `${identificador}?${lembrado}`
            : identificador,
        );
        enfileiradosAntesDoRegistro.delete(identificador);
      }

      return true;
    },

    desregistrar(identificadores) {
      for (const identificador of comoLista(identificadores)) {
        registrados.delete(identificador);
      }
    },

    enfileirar,

    desenfileirar(identificadores) {
      for (const bruto of comoLista(identificadores)) {
        const { identificador } = separarArgumentos(bruto);
        if (fila.includes(identificador)) {
          todasAsDependenciasDaFila = null;
          fila = fila.filter((enfileirado) => enfileirado !== identificador);
          argumentosDaFila.delete(identificador);
        } else if (enfileiradosAntesDoRegistro.has(identificador)) {
          enfileiradosAntesDoRegistro.delete(identificador);
        }
      }
    },

    consultar(identificador, estado = 'registered') {
      switch (estado) {
        case 'registered':
        case 'scripts':
          return registrados.get(identificador) ?? false;
        case 'enqueued':
        case 'queue':
          if (fila.includes(identificador)) {
            return true;
          }
          return dependeDaFila(identificador);
        case 'to_do':
        case 'to_print':
          return aFazer.includes(identificador);
        case 'done':
        case 'printed':
          return feitos.includes(identificador);
      }
    },

    resolverDependencias(identificadores) {
      return todasAsDependencias(comoLista(identificadores), false, false);
    },

    processar(identificadores = false) {
      const pedidos = identificadores === false ? [...fila] : comoLista(identificadores);
      todasAsDependencias(pedidos, false, false);

      // O `foreach` do PHP percorre uma copia de `$to_do`; o que nao foi
      // processado (ja feito, ou fora do registro) continua la (`:142`-`:156`).
      const restantes: string[] = [];
      for (const identificador of aFazer) {
        if (!feitos.includes(identificador) && registrados.has(identificador)) {
          if (processarItem(especie, identificador, {
            registrados,
            argumentosDaFila,
            configuracao,
            contexto,
            entregues,
          })) {
            feitos.push(identificador);
          }
          continue;
        }
        restantes.push(identificador);
      }
      aFazer = restantes;

      return [...feitos];
    },

    registrados: () => registrados,
    fila: () => [...fila],
    aFazer: () => [...aFazer],
    feitos: () => [...feitos],
    entregues: () => [...entregues],
  };
}

/**
 * O aviso de dependencia ausente (`:224`-`:228`), com o texto da especie:
 * `WP_Scripts::get_dependency_warning_message()` (`class-wp-scripts.php:1242`)
 * e `WP_Styles::get_dependency_warning_message()` (`class-wp-styles.php:502`).
 *
 * **CA-11.2, segunda metade**: e assim que o legado *"reporta"* — a quem
 * desenvolve, pelo `_doing_it_wrong()`, e nunca ao visitante. O separador e o
 * de `wp_get_list_item_separator()` no idioma de origem, `', '`
 * (`wp-includes/l10n.php:2046`); o texto traduzido e de `plataforma/traducao`.
 */
export function avisoDeDependenciaAusente(
  especie: EspecieDeRecurso,
  identificador: string,
  ausentes: readonly string[],
): { readonly funcao: string; readonly mensagem: string; readonly versao: string } {
  const lista = ausentes.join(', ');
  return especie === 'script'
    ? {
        funcao: 'WP_Scripts::add',
        mensagem: `The script with the handle "${identificador}" was enqueued with dependencies that are not registered: ${lista}.`,
        versao: '6.9.1',
      }
    : {
        funcao: 'WP_Styles::add',
        mensagem: `The style with the handle "${identificador}" was enqueued with dependencies that are not registered: ${lista}.`,
        versao: '6.9.1',
      };
}
