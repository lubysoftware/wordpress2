/**
 * Os dois registros de operacao nomeada: o das operacoes e o das categorias
 * delas — `WP_Abilities_Registry` e `WP_Ability_Categories_Registry`.
 *
 * Tarefa **T002** da feature `013-superficies-programaticas`.
 * `satisfaz: — (infraestrutura)`. O formato esta em
 * `./esquema-de-operacao-nomeada.ts`; **a execucao e T013** (US-6), e as tres
 * operacoes do nucleo entram la.
 *
 * ---
 *
 * ## Por que o registro entra nesta tarefa, e nao em T013
 *
 * Porque e nele que o default desta camada acontece. `discard_log.md`, ao
 * descartar as duas operacoes da extensao empacotada, deixa escrito que *"o
 * mecanismo de registro e a camada de autorizacao migram inteiros (I4, I5,
 * I6)"*, e `../despacho/despachante-de-rotas.ts` ja aponta para ca: *"o
 * registro dessas operacoes e T002, e a execucao e T013"*.
 *
 * ## 🔴 Os dois registros falham FECHADOS, e sao oito avisos
 *
 * Nenhum dos oito avisos deste arquivo e seguido de registro: **todos recusam**.
 * E o oposto exato de `../despacho/registro-de-rota-de-api.ts`, onde o aviso da
 * permissao ausente e seguido de registro. As duas camadas estao neste modulo
 * com os defaults opostos preservados, que e o que `PERM-11` (BR-MIGRAR-097)
 * queria tornar visivel.
 *
 * | # | quando | ancora | recusa? |
 * |---|---|---|---|
 * | 1 | nome fora do padrao | `class-wp-abilities-registry.php:87` | sim |
 * | 2 | operacao ja registrada | `:98` | sim |
 * | 3 | categoria nao registrada | `:144` | sim |
 * | 4 | classe propria invalida | `:160` | 🔴 declarado, nao conferido |
 * | 5 | declaracao recusada pelo formato | `:176` | sim |
 * | 6 | tirar operacao que nao existe | `:202` | sim |
 * | 7 | pedir operacao que nao existe | `:262` | sim, devolve nulo |
 * | 8 | os mesmos de 1, 2, 6 e 7 para categoria | `class-wp-ability-categories-registry.php:59`, `:69`, `:123`, `:183` | sim |
 *
 * ## A ordem das conferencias e observavel, e tem dois casos que surpreendem
 *
 * 1. **A categoria e conferida ANTES do formato** (`:142` contra `:174`). Uma
 *    declaracao sem rotulo **e** com categoria inexistente sai com a mensagem da
 *    **categoria**, nao com a do rotulo.
 * 2. **Categoria vazia cai na conferencia de "nao registrada", nao na de
 *    formato**, porque o portao e `isset( $args['category'] )` e `isset('')` e
 *    verdadeiro — logo `categoria: ''` produz *"Ability category "" is not
 *    registered"* e nao *"must contain a `category` string"*. Os dois casos tem
 *    teste.
 *
 * E a ordem **entre** os dois registros tambem e contrato: o legado garante que
 * o registro de categorias e inicializado primeiro, *"para permitir que
 * categorias sejam registradas antes das operacoes que dependem delas"*
 * (`class-wp-abilities-registry.php:299`). `EXT-ORDEM` (BR-MIGRAR-106) e a
 * tabela *Nao negociavel* poem essa ordem fora do que este agente muda:
 * {@link criarRegistroDeOperacoesNomeadas} recebe o registro de categorias por
 * argumento e nao o cria, para que a ordem seja de quem compoe.
 *
 * ## O que esta declarado e nao emitido
 *
 * - **Os dois ganchos de inicializacao.** `wp_register_ability()` recusa o
 *   registro fora de `wp_abilities_api_init` (`abilities-api.php:291`), e
 *   `wp_register_ability_category()` fora de
 *   `wp_abilities_api_categories_init` — e `get_instance()` avisa se a API for
 *   tocada antes de `init` (`:283`). Os tres dependem de `did_action()`, e o
 *   barramento de ganchos nao tem tarefa neste pacote (REQ-162 esta em
 *   `do-not-rewrite.md`). Ficam em
 *   {@link MENSAGENS_DE_AVISO_DE_GANCHO_DE_OPERACAO}, no arquivo que os
 *   emitiria, como T001 fez com `rest_endpoints`.
 * - **Os dois filtros de argumentos**, `wp_register_ability_args` (`:139`) e
 *   `wp_register_ability_category_args`
 *   (`class-wp-ability-categories-registry.php:91`), que recebem a declaracao
 *   **antes** da conferencia e podem devolver outra. Sao pontos de extensao,
 *   logo sao produto (P2), e a posicao deles esta marcada em comentario no corpo
 *   de cada `registrar`.
 * - **O escape de `esc_html()`** nas mensagens que interpolam o nome. O legado
 *   escapa (`:101`, `:149`, `:205`, `:265`); aqui o nome entra cru, porque
 *   `esc_html()` e de `plataforma/formatacao/`, feature `015` — o mesmo
 *   tratamento e a mesma frase que `contextos/conteudo` registrou para as tres
 *   entradas de requisicao dele. Para nome que casa com
 *   {@link PADRAO_DO_NOME_DE_OPERACAO} nao ha diferenca; para o nome recusado
 *   pelo padrao, ha, e esta declarada.
 *
 * ## Por que nao e um singleton, como no legado
 *
 * `WP_Abilities_Registry::get_instance()` guarda a instancia num campo estatico
 * (`:27`), igual ao `global $wp_rest_server` do registro de rotas. Vale a mesma
 * nota de `../despacho/registro-de-rotas.ts`: `EXT-CONTEXTO` (BR-MIGRAR-105) poe
 * isso no escopo da **requisicao**, e num processo longo-vivo um estatico faria
 * a operacao registrada numa requisicao aparecer na seguinte. Cada chamada de
 * {@link criarRegistroDeOperacoesNomeadas} devolve um registro novo.
 */

import type { AvisoDeUsoIndevido } from '../../../plataforma/autorizacao/index.js';

import {
  PADRAO_DO_APELIDO_DE_CATEGORIA,
  PADRAO_DO_NOME_DE_OPERACAO,
  ehRecusaDeDeclaracao,
  prepararCategoriaDeOperacao,
  prepararOperacaoNomeada,
  type CategoriaDeOperacao,
  type DeclaracaoDeCategoriaDeOperacao,
  type DeclaracaoDeOperacaoNomeada,
  type OperacaoNomeada,
} from './esquema-de-operacao-nomeada.js';

/** Os nomes que o legado poe nos avisos — `__METHOD__` em cada ponto. */
export const METODOS_DOS_REGISTROS_DE_OPERACAO = Object.freeze({
  registrarOperacao: 'WP_Abilities_Registry::register',
  tirarOperacao: 'WP_Abilities_Registry::unregister',
  obterOperacao: 'WP_Abilities_Registry::get_registered',
  registrarCategoria: 'WP_Ability_Categories_Registry::register',
  tirarCategoria: 'WP_Ability_Categories_Registry::unregister',
  obterCategoria: 'WP_Ability_Categories_Registry::get_registered',
});

/**
 * As tres mensagens de gancho — **declaradas e nao emitidas**. Ver o cabecalho.
 *
 * As duas primeiras **recusam** o registro no legado, e nao so avisam: quem
 * ligar o barramento liga tambem a recusa.
 */
export const MENSAGENS_DE_AVISO_DE_GANCHO_DE_OPERACAO = Object.freeze({
  /** `abilities-api.php:296` — recusa, e devolve nulo. */
  foraDoGanchoDeOperacao:
    'Abilities must be registered on the <code>wp_abilities_api_init</code> ' +
    'action. The ability <code>%s</code> was not registered.',
  /** `wp_register_ability_category()` — recusa, e devolve nulo. */
  foraDoGanchoDeCategoria:
    'Ability categories must be registered on the ' +
    '<code>wp_abilities_api_categories_init</code> action. The ability ' +
    'category <code>%s</code> was not registered.',
  /** `class-wp-abilities-registry.php:288` e o gemeo das categorias. */
  antesDoArranque:
    'Ability API should not be initialized before the <code>init</code> action has fired.',
});

/** Aviso 1 — nome fora do padrao (`class-wp-abilities-registry.php:87`). */
export function avisoDeNomeDeOperacaoInvalido(): AvisoDeUsoIndevido {
  return {
    funcao: METODOS_DOS_REGISTROS_DE_OPERACAO.registrarOperacao,
    mensagem:
      'Ability name must be a string containing a namespace prefix, i.e. ' +
      '"my-plugin/my-ability". It can only contain lowercase alphanumeric ' +
      'characters, dashes and the forward slash.',
    versao: '6.9.0',
  };
}

/** Aviso 2 — operacao ja registrada (`:98`). */
export function avisoDeOperacaoJaRegistrada(nome: string): AvisoDeUsoIndevido {
  return {
    funcao: METODOS_DOS_REGISTROS_DE_OPERACAO.registrarOperacao,
    mensagem: `Ability "${nome}" is already registered.`,
    versao: '6.9.0',
  };
}

/**
 * Aviso 3 — categoria nao registrada (`:144`).
 *
 * ⚠️ O texto **ensina a ordem**: *"registre a categoria antes de atribui-la"*.
 * E contrato documentado para quem estende, como o aviso de `I7` o e do outro
 * lado.
 */
export function avisoDeCategoriaNaoRegistrada(
  categoria: string,
  nome: string,
): AvisoDeUsoIndevido {
  return {
    funcao: METODOS_DOS_REGISTROS_DE_OPERACAO.registrarOperacao,
    mensagem:
      `Ability category "${categoria}" is not registered. Please register the ` +
      `ability category before assigning it to ability "${nome}".`,
    versao: '6.9.0',
  };
}

/** Aviso 5 — a declaracao foi recusada pelo formato (`:176`-`:182`). */
export function avisoDeDeclaracaoRecusada(
  mensagem: string,
): AvisoDeUsoIndevido {
  return {
    funcao: METODOS_DOS_REGISTROS_DE_OPERACAO.registrarOperacao,
    mensagem,
    versao: '6.9.0',
  };
}

/** Avisos 6 e 7 — operacao que nao existe (`:205` e `:265`, mesmo texto). */
export function avisoDeOperacaoNaoEncontrada(
  nome: string,
  metodo: string,
): AvisoDeUsoIndevido {
  return { funcao: metodo, mensagem: `Ability "${nome}" not found.`, versao: '6.9.0' };
}

/** Aviso 8a — categoria ja registrada (`class-wp-ability-categories-registry.php:59`). */
export function avisoDeCategoriaJaRegistrada(
  apelido: string,
): AvisoDeUsoIndevido {
  return {
    funcao: METODOS_DOS_REGISTROS_DE_OPERACAO.registrarCategoria,
    mensagem: `Ability category "${apelido}" is already registered.`,
    versao: '6.9.0',
  };
}

/** Aviso 8b — apelido de categoria fora do padrao (`:69`). */
export function avisoDeApelidoDeCategoriaInvalido(): AvisoDeUsoIndevido {
  return {
    funcao: METODOS_DOS_REGISTROS_DE_OPERACAO.registrarCategoria,
    mensagem:
      'Ability category slug must contain only lowercase alphanumeric ' +
      'characters and dashes.',
    versao: '6.9.0',
  };
}

/** Aviso 8c — a declaracao de categoria foi recusada pelo formato (`:97`). */
export function avisoDeDeclaracaoDeCategoriaRecusada(
  mensagem: string,
): AvisoDeUsoIndevido {
  return {
    funcao: METODOS_DOS_REGISTROS_DE_OPERACAO.registrarCategoria,
    mensagem,
    versao: '6.9.0',
  };
}

/** Avisos 8d e 8e — categoria que nao existe (`:126` e `:186`, mesmo texto). */
export function avisoDeCategoriaNaoEncontrada(
  apelido: string,
  metodo: string,
): AvisoDeUsoIndevido {
  return {
    funcao: metodo,
    mensagem: `Ability category "${apelido}" not found.`,
    versao: '6.9.0',
  };
}

/** O registro de categorias de operacao de **uma** requisicao. */
export interface RegistroDeCategoriasDeOperacao {
  /**
   * `register()` (`class-wp-ability-categories-registry.php:57`-`:107`).
   *
   * Devolve a categoria registrada, ou `null` em qualquer das tres recusas. A
   * ordem e a do legado: **ja registrada primeiro, padrao do apelido depois** —
   * o inverso da ordem do registro de operacoes, e esta reproduzido.
   */
  registrar(
    apelido: string,
    declaracao: DeclaracaoDeCategoriaDeOperacao,
    avisar?: (aviso: AvisoDeUsoIndevido) => void,
  ): CategoriaDeOperacao | null;

  /** `unregister()` (`:121`). Avisa e devolve `null` quando nao existe. */
  tirar(
    apelido: string,
    avisar?: (aviso: AvisoDeUsoIndevido) => void,
  ): CategoriaDeOperacao | null;

  /** `is_registered()` (`:165`). **Nao avisa nada** — e o portao silencioso. */
  estaRegistrada(apelido: string): boolean;

  /** `get_registered()` (`:181`). ⚠️ **Avisa** quando nao existe, e devolve `null`. */
  obter(
    apelido: string,
    avisar?: (aviso: AvisoDeUsoIndevido) => void,
  ): CategoriaDeOperacao | null;

  /** `get_all_registered()` (`:149`), na ordem de registro. */
  registradas(): readonly CategoriaDeOperacao[];
}

/** Cria o registro de categorias vazio. */
export function criarRegistroDeCategoriasDeOperacao(): RegistroDeCategoriasDeOperacao {
  const porApelido = new Map<string, CategoriaDeOperacao>();

  return {
    registrar(apelido, declaracao, avisar) {
      // `:58` — ja registrada vem ANTES do padrao do apelido.
      if (porApelido.has(apelido)) {
        avisar?.(avisoDeCategoriaJaRegistrada(apelido));
        return null;
      }

      if (!PADRAO_DO_APELIDO_DE_CATEGORIA.test(apelido)) {
        avisar?.(avisoDeApelidoDeCategoriaInvalido());
        return null;
      }

      // O ponto de extensao `wp_register_ability_category_args` (`:91`) entra
      // AQUI, com a declaracao e o apelido, antes da conferencia. Declarado e
      // nao implementado: ver o cabecalho.

      const preparada = prepararCategoriaDeOperacao(
        apelido,
        declaracao,
        avisar,
      );

      if (ehRecusaDeDeclaracao(preparada)) {
        avisar?.(avisoDeDeclaracaoDeCategoriaRecusada(preparada.mensagem));
        return null;
      }

      porApelido.set(apelido, preparada);
      return preparada;
    },

    tirar(apelido, avisar) {
      const categoria = porApelido.get(apelido);
      if (categoria === undefined) {
        avisar?.(
          avisoDeCategoriaNaoEncontrada(
            apelido,
            METODOS_DOS_REGISTROS_DE_OPERACAO.tirarCategoria,
          ),
        );
        return null;
      }
      porApelido.delete(apelido);
      return categoria;
    },

    estaRegistrada(apelido) {
      return porApelido.has(apelido);
    },

    obter(apelido, avisar) {
      const categoria = porApelido.get(apelido);
      if (categoria === undefined) {
        avisar?.(
          avisoDeCategoriaNaoEncontrada(
            apelido,
            METODOS_DOS_REGISTROS_DE_OPERACAO.obterCategoria,
          ),
        );
        return null;
      }
      return categoria;
    },

    registradas() {
      return [...porApelido.values()];
    },
  };
}

/** O registro de operacoes nomeadas de **uma** requisicao. */
export interface RegistroDeOperacoesNomeadas {
  /**
   * `register()` (`class-wp-abilities-registry.php:85`-`:186`).
   *
   * Devolve a operacao registrada, ou `null` em **qualquer** recusa — a camada
   * falha fechada, e a operacao recusada simplesmente nao existe. A ordem das
   * conferencias e a do legado; ver os dois casos que surpreendem, no cabecalho.
   */
  registrar(
    nome: string,
    declaracao: DeclaracaoDeOperacaoNomeada,
    avisar?: (aviso: AvisoDeUsoIndevido) => void,
  ): OperacaoNomeada | null;

  /** `unregister()` (`:200`). Avisa e devolve `null` quando nao existe. */
  tirar(
    nome: string,
    avisar?: (aviso: AvisoDeUsoIndevido) => void,
  ): OperacaoNomeada | null;

  /** `is_registered()` (`:244`). **Nao avisa nada.** */
  estaRegistrada(nome: string): boolean;

  /**
   * `get_registered()` (`:260`). ⚠️ **Avisa** quando nao existe, e devolve
   * `null` — e o caso de `UC-46`, *"ability inexistente"*, que CA-6.5 manda
   * distinguir de operacao sem permissao.
   */
  obter(
    nome: string,
    avisar?: (aviso: AvisoDeUsoIndevido) => void,
  ): OperacaoNomeada | null;

  /** `get_all_registered()` (`:228`), na ordem de registro. */
  registradas(): readonly OperacaoNomeada[];
}

/**
 * Cria o registro de operacoes nomeadas vazio, sobre um registro de categorias.
 *
 * @param categorias O registro de categorias, que **ja tem de existir** — ver a
 *   nota de ordem no cabecalho. Chega por argumento, e nao e criado aqui, para
 *   que a ordem de arranque continue sendo de quem compoe (`EXT-ORDEM`).
 */
export function criarRegistroDeOperacoesNomeadas(
  categorias: RegistroDeCategoriasDeOperacao,
): RegistroDeOperacoesNomeadas {
  const porNome = new Map<string, OperacaoNomeada>();

  return {
    registrar(nome, declaracao, avisar) {
      // `:86` — o padrao do nome vem ANTES de ja registrada, o inverso da
      // ordem das categorias.
      if (!PADRAO_DO_NOME_DE_OPERACAO.test(nome)) {
        avisar?.(avisoDeNomeDeOperacaoInvalido());
        return null;
      }

      if (porNome.has(nome)) {
        avisar?.(avisoDeOperacaoJaRegistrada(nome));
        return null;
      }

      // O ponto de extensao `wp_register_ability_args` (`:139`) entra AQUI,
      // antes de qualquer conferencia de categoria ou de formato. Declarado e
      // nao implementado: ver o cabecalho.

      // `:142` — o portao e `isset( $args['category'] )`, logo categoria vazia
      // chega aqui e sai pela mensagem de "nao registrada". Ver o caso 2 do
      // cabecalho.
      if (declaracao.categoria !== undefined) {
        if (!categorias.estaRegistrada(declaracao.categoria)) {
          avisar?.(avisoDeCategoriaNaoRegistrada(declaracao.categoria, nome));
          return null;
        }
      }

      // `:159` — a conferencia da classe propria entra AQUI, e e a que esta
      // declarada e nao conferida: ver
      // `DeclaracaoDeOperacaoNomeada.classeDaOperacao`.

      const preparada = prepararOperacaoNomeada(nome, declaracao, avisar);

      if (ehRecusaDeDeclaracao(preparada)) {
        // `:175`-`:182` — a excecao do legado nunca escapa: ela vira aviso de
        // uso indevido com a mensagem dela, e o registro devolve nulo.
        avisar?.(avisoDeDeclaracaoRecusada(preparada.mensagem));
        return null;
      }

      porNome.set(nome, preparada);
      return preparada;
    },

    tirar(nome, avisar) {
      const operacao = porNome.get(nome);
      if (operacao === undefined) {
        avisar?.(
          avisoDeOperacaoNaoEncontrada(
            nome,
            METODOS_DOS_REGISTROS_DE_OPERACAO.tirarOperacao,
          ),
        );
        return null;
      }
      porNome.delete(nome);
      return operacao;
    },

    estaRegistrada(nome) {
      return porNome.has(nome);
    },

    obter(nome, avisar) {
      const operacao = porNome.get(nome);
      if (operacao === undefined) {
        avisar?.(
          avisoDeOperacaoNaoEncontrada(
            nome,
            METODOS_DOS_REGISTROS_DE_OPERACAO.obterOperacao,
          ),
        );
        return null;
      }
      return operacao;
    },

    registradas() {
      return [...porNome.values()];
    },
  };
}
