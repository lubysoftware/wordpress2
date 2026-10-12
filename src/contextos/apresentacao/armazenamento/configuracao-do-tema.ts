/**
 * **A configuracao do tema como dado** — `AGG-Tema` pelo lado do armazenamento.
 *
 * Segunda metade da entrega de **T002** da feature
 * `009-apresentacao-e-personalizacao`: *"a configuracao declarada pelo tema e
 * lida como dado, pela porta de dados, com a mesma forma do legado"*.
 * `opcao.ts` e o nivel da linha; este arquivo e o nivel do tema, e e aqui que as
 * chaves de `chaves-e-tabelas.ts` sao usadas.
 *
 * ## Onde o pacote diz que essa configuracao mora
 *
 * Em `options`, e com essas palavras. UC-32, pos-condicoes: *"a configuracao do
 * tema anterior permanece **nas opcoes**, nao apagada"*, e *O que um porte precisa
 * saber*: *"Trocar o tema nao apaga nada. A configuracao do tema anterior fica
 * nas opcoes"*. Dessa frase saem **CA-9.2** (*"a configuracao do tema anterior
 * permanece guardada e nao e apagada"*), **CA-10.3** (*"a configuracao do tema
 * ativo nao e reescrita pela substituicao"*) e os dois casos do catalogo
 * `backlog/tests.md` que a nomeiam (`UT-103-2` e `UT-105-3`). `AGG-Tema` e
 * **fundido** de `class-wp-theme.php` + `class-wp-theme-json.php` + `options`
 * (`target_domain_model.md`), e o que esta tarefa porta e a terceira parte.
 *
 * ⚠️ **A outra linha do *Modelo de dados* de `plan.md` — *"configuracao
 * declarada pelo tema | arquivo no tema, lido como dado"* — NAO esta aqui, e a
 * divisao e deliberada.** O arquivo do tema (`style.css` e o contrato
 * declarativo de estilos) e lido pelo sistema de arquivos e resolvido em folha de
 * estilo, que e **US-12 / T025** (*"o contrato declarativo do tema e resolvido
 * numa folha de estilo"*), com a lista de temas entregues em **US-15 / T031**.
 * T001 havia anotado, no cabecalho de `portas/index.ts`, que a porta de sistema
 * de arquivos entraria em *"T002, T027"*; ela **nao** entra aqui, porque a
 * entrega desta tarefa nomeia a **porta de dados** e porque, no vocabulario do
 * pacote, *"configuracao do tema"* e o que esta gravado em opcao — e nenhuma
 * tarefa desta feature resolve `theme.json` antes de T025. Declarar a porta
 * agora seria superficie que nenhuma linha usa.
 *
 * ## As cinco leituras e as quatro escritas, todas pela porta de dados
 *
 * | o que | funcao do legado | ancora |
 * |---|---|---|
 * | o tema ativo (folha de estilo, modelo, Nome) | `get_option( 'stylesheet' )`, `'template'`, `'current_theme'` | `theme.php:1027`, `:802`-`:815` |
 * | as modificacoes do tema | `get_theme_mods()` | `theme.php:1026`-`:1046` |
 * | uma modificacao | `get_theme_mod()` | `theme.php:1064` |
 * | gravar uma modificacao | `set_theme_mod()` | `theme.php:1105`-`:1126` |
 * | remover uma modificacao | `remove_theme_mod()` | `theme.php:1138`-`:1155` |
 * | remover todas | `remove_theme_mods()` | `theme.php:1162`-`:1172` |
 * | mover a carga automatica na troca | `wp_set_option_autoload_values()` | `theme.php:857`-`:861` |
 *
 * ## 🔴 O valor e um arranjo no formato nativo do PHP, e por isso ele e `ValorPhp`
 *
 * `theme_mods_{folha}` guarda **um arranjo serializado numa linha**, e e por isso
 * que `plan.md` declara o slot `serializacao-de-valor-persistido` como
 * obrigatorio: *"o formato esta DENTRO das colunas"*. O *codec* ja existe, merged,
 * em `plataforma/serializacao` (a regra de dependencia 1 permite o `import`), e a
 * regra de aceite dele *"nao e negociavel e nao e de estilo: **os bytes gravados
 * sao os mesmos**"*.
 *
 * Por isso o tipo que atravessa este arquivo e {@link ValorPhp} e **nao** um
 * objeto de TypeScript: o arranjo e a verdade. Tres razoes, todas do legado:
 *
 * - **a estrutura e aberta.** Tema e extensao gravam modificacao propria por
 *   `set_theme_mod()`, que e funcao publica; um tipo fechado apagaria, na
 *   primeira gravacao, a modificacao de um tema que este porte nao conhece (P8);
 * - **os valores sao heterogeneos.** `nav_menu_locations` e mapa de posicao para
 *   identificador de termo, `sidebars_widgets` e `{ time, data }`
 *   (`theme.php:777`-`:781`) e `header_textcolor` e texto;
 * - **a ordem das chaves e byte-observavel**, porque o formato a emite.
 */

import {
  arranjoPorNome,
  nomeDaChave,
  normalizarChaveDeTexto,
  type EntradaDeArranjo,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import type { PortaDeDados } from '../portas/index.js';
import {
  OPCAO_DA_FOLHA_DE_ESTILO,
  OPCAO_DO_MODELO,
  OPCAO_DO_NOME_DO_TEMA,
  opcaoDeModificacoesAntiga,
  opcaoDeModificacoesDoTema,
} from './chaves-e-tabelas.js';
import {
  criarRepositorioDeOpcoes,
  type RepositorioDeOpcoes,
} from './opcao.js';

/**
 * O tema ativo como as tres opcoes o descrevem.
 *
 * `null` em qualquer dos tres campos e **linha de opcao ausente**, que e o estado
 * de uma instalacao antes de o instalador ativar o tema — e e distinto de texto
 * vazio. Quem decide o que fazer com a ausencia e quem le: `get_theme_mods()`
 * monta `theme_mods_` com a folha de estilo **vazia** nesse caso
 * (`theme.php:1027`-`:1028`, sem guarda), e a recuperacao por tema de reserva e
 * **US-10 / T021**.
 */
export interface TemaAtivoGravado {
  /** `stylesheet` — o diretorio do tema ativo. */
  readonly folhaDeEstilo: string | null;
  /** `template` — o diretorio do tema pai, igual ao de cima quando nao e filho. */
  readonly modelo: string | null;
  /** `current_theme` — o **Nome** do cabecalho de `style.css`. */
  readonly nome: string | null;
}

/** As modificacoes do tema, mais o que a leitura precisou saber para as achar. */
export interface ModificacoesDoTema {
  /**
   * O arranjo, **sempre arranjo**: `if ( ! is_array( $mods ) ) { $mods =
   * array(); }` (`theme.php:1043`-`:1045`) e a ultima guarda de
   * `get_theme_mods()`, e ela apaga a diferenca entre *"opcao ausente"*,
   * *"opcao com `false`"* e *"opcao com um escalar qualquer"*.
   */
  readonly valores: ValorPhp;
  /**
   * O que a opcao devolveu, **antes** daquela guarda — `false` incluido.
   *
   * Existe porque a migracao do legado grava o valor **cru**, nao o normalizado:
   * `update_option( "theme_mods_$theme_slug", $mods )` (`theme.php:1038`) recebe
   * o `$mods` que acabou de sair de `get_option( "mods_$theme_name" )`, e so
   * **depois** a guarda de arranjo roda (`:1043`). Um escalar gravado na
   * localizacao antiga e migrado como escalar, e e so na leitura que ele vira
   * arranjo vazio.
   */
  readonly valorGravado: ValorPhp;
  /**
   * `true` quando o valor veio da localizacao **antiga** (`mods_{Nome}`).
   *
   * E o segundo operando de `if ( is_admin() && false !== $mods )`
   * (`theme.php:1037`), isto e: o que decide se a migracao de `get_theme_mods()`
   * tem o que migrar — ver
   * {@link RepositorioDaConfiguracaoDoTema.migrarModificacoesAntigas}.
   */
  readonly daLocalizacaoAntiga: boolean;
}

export interface RepositorioDaConfiguracaoDoTema {
  /** A porta de opcoes sobre a qual esta configuracao mora. */
  readonly opcoes: RepositorioDeOpcoes;

  /** As tres opcoes do tema ativo, lidas numa consulta cada. */
  temaAtivo(): TemaAtivoGravado;

  /**
   * `get_theme_mods()` (`wp-includes/theme.php:1026`-`:1046`), com a cadeia de
   * recurso inteira.
   *
   * A sequencia do legado, e cada passo e observavel:
   *
   * 1. le `theme_mods_{folha}`;
   * 2. **se o valor e `false`** — linha ausente **ou** `false` gravado, que
   *    `get_option()` nao distingue — le `current_theme` para saber o Nome;
   * 3. com o Nome, le `mods_{Nome}`, a localizacao obsoleta;
   * 4. o que nao for arranjo vira arranjo vazio.
   *
   * ⚠️ **O passo 2 e `false === $mods`, nao `empty()`**: modificacoes gravadas
   * como arranjo vazio **nao** disparam a cadeia de recurso, e um `0` ou texto
   * vazio gravado tambem nao. Trocar por `empty()` faria o sistema ler a opcao
   * obsoleta onde o legado nao le.
   *
   * ⚠️ **E o Nome tem uma terceira fonte que NAO esta aqui:** quando
   * `current_theme` tambem nao existe, o legado chama
   * `wp_get_theme()->get( 'Name' )` (`theme.php:1033`), que **le o cabecalho de
   * `style.css` no disco** — o arquivo do tema, que e T025/T031 e a porta de
   * sistema de arquivos (ver o cabecalho deste arquivo). Por isso o Nome chega
   * como argumento **opcional**: quem o tiver, passa; quem nao tiver, nao inventa
   * leitura de disco neste modulo.
   */
  modificacoes(folhaDeEstilo: string, nomeDoTema?: string): ModificacoesDoTema;

  /**
   * `get_theme_mod( $nome )` (`wp-includes/theme.php:1064`), **sem** o default.
   *
   * Devolve `undefined` quando a chave nao esta no arranjo, que e o `isset(
   * $mods[ $name ] )` do legado (`:1067`). O valor default **nao** e desta
   * camada, e a razao esta no proprio legado: ele e processado por `sprintf()`
   * com os dois diretorios do tema quando e texto com marcador (`:1077`-`:1086`),
   * o que depende do caminho em disco — e o filtro `theme_mod_{$name}` roda nos
   * dois ramos. Quem precisar do default o resolve na tarefa dela.
   */
  modificacao(folhaDeEstilo: string, nome: string, nomeDoTema?: string):
    | ValorPhp
    | undefined;

  /**
   * `set_theme_mod( $nome, $valor )` (`wp-includes/theme.php:1105`-`:1126`).
   *
   * Le as modificacoes, atribui a chave e grava a opcao inteira — logo **o
   * arranjo todo vai para a coluna a cada modificacao**, e e isso que a area 3
   * compara. Devolve o que `update_option()` devolveu: `false` quando nada foi
   * gravado porque o valor ja era aquele.
   *
   * ⚠️ O filtro `pre_set_theme_mod_{$name}` (`:1121`) fica **entre** o valor
   * pedido e a atribuicao. Nao ha barramento de *hooks* nesta arvore (REQ-162,
   * `do-not-rewrite.md`); o ponto esta declarado aqui, no arquivo que o emitiria.
   */
  definirModificacao(
    folhaDeEstilo: string,
    nome: string,
    valor: ValorPhp,
    nomeDoTema?: string,
  ): boolean;

  /**
   * `remove_theme_mod( $nome )` (`wp-includes/theme.php:1138`-`:1155`).
   *
   * Tres saidas, e as tres sao efeito no banco diferente:
   *
   * - a chave nao existe: **nenhum comando** sai (`:1141`-`:1143`);
   * - a chave existe e era a ultima: cai em
   *   {@link RepositorioDaConfiguracaoDoTema.removerModificacoes}, que **apaga as
   *   duas opcoes** (`:1147`-`:1150`);
   * - a chave existe e sobra alguma: `UPDATE` com o arranjo sem ela.
   *
   * O segundo caso e o que surpreende: remover a ultima modificacao **apaga a
   * linha**, e com ela a localizacao obsoleta de outro tema (ver
   * `removerModificacoes`).
   */
  removerModificacao(
    folhaDeEstilo: string,
    nome: string,
    nomeDoTema?: string,
  ): void;

  /**
   * `remove_theme_mods()` (`wp-includes/theme.php:1162`-`:1172`) — apaga
   * `theme_mods_{folha}` **e** `mods_{Nome}`.
   *
   * ⚠️ As duas chaves sao montadas com **dado diferente**: a primeira com a folha
   * de estilo, a segunda com o Nome. Sem o Nome, o legado grava `mods_` com o
   * Nome vazio — porque o recurso dele e `wp_get_theme()->get( 'Name' )`, leitura
   * de disco que este modulo nao faz (ver {@link modificacoes}). Quem chamar sem
   * o Nome emite `DELETE` so quando existir uma linha chamada `mods_`.
   */
  removerModificacoes(folhaDeEstilo: string, nomeDoTema?: string): void;

  /**
   * Os dois comandos de migracao que `get_theme_mods()` emite **so no painel**
   * (`wp-includes/theme.php:1037`-`:1040`): grava a localizacao nova e apaga a
   * antiga.
   *
   * ⚠️ **A guarda e `is_admin()`, que e fato da requisicao e nao do
   * armazenamento**, e por isso ela nao esta aqui: quem sabe se a requisicao e de
   * painel e a borda. O que esta aqui sao os dois comandos, na ordem, para que
   * quem decidir chame um metodo e nao monte consulta.
   *
   * Numa instalacao nova isto nunca roda: *"nada vem do sistema velho"*
   * (resposta 2, `plan.md` § *Migracao de dados*). Existe porque o **P8** e a
   * resposta 14 mandam portar o que o legado tem — *"o descarte vale como nao
   * mudar, nunca como nao portar"*.
   */
  migrarModificacoesAntigas(
    folhaDeEstilo: string,
    nomeDoTema: string,
    valores: ValorPhp,
  ): void;

  /**
   * O ultimo passo de `switch_theme()` (`wp-includes/theme.php:857`-`:861`):
   * **liga** a carga automatica das modificacoes do tema que entra e **desliga**
   * a do tema que sai, numa chamada so.
   *
   * O legado monta `array( 'theme_mods_' . $stylesheet => 'yes', 'theme_mods_' .
   * $old_theme->get_stylesheet() => 'no' )`, nessa ordem, e passa a
   * `wp_set_option_autoload_values()`. Os valores **gravados** sao `on` e `off`
   * (ver `opcao.ts`), e a ordem do arranjo decide qual `UPDATE` sai primeiro.
   *
   * T001 pediu este metodo pelo nome: *"T001 nao declara o campo porque nao grava
   * opcao nenhuma; T002 precisa dele"*. **Quando** chama-lo e de **T017** (US-8).
   */
  moverCargaAutomaticaDasModificacoes(
    folhaDeEstiloQueEntra: string,
    folhaDeEstiloQueSai: string,
  ): void;
}

export function criarRepositorioDaConfiguracaoDoTema(
  dados: PortaDeDados,
): RepositorioDaConfiguracaoDoTema {
  const opcoes = criarRepositorioDeOpcoes(dados);

  const repositorio: RepositorioDaConfiguracaoDoTema = {
    opcoes,

    temaAtivo() {
      return {
        folhaDeEstilo: textoDaOpcao(opcoes.ler(OPCAO_DA_FOLHA_DE_ESTILO)),
        modelo: textoDaOpcao(opcoes.ler(OPCAO_DO_MODELO)),
        nome: textoDaOpcao(opcoes.ler(OPCAO_DO_NOME_DO_TEMA)),
      };
    },

    modificacoes(folhaDeEstilo, nomeDoTema) {
      const gravadas = opcoes.lerComoNoLegado(
        opcaoDeModificacoesDoTema(folhaDeEstilo),
      );

      // `if ( false === $mods )` (`theme.php:1030`): comparacao com `false`, e
      // **nao** `empty()` — arranjo vazio gravado nao dispara a cadeia.
      if (!(gravadas.tipo === 'booleano' && !gravadas.valor)) {
        return {
          valores: comoArranjo(gravadas),
          valorGravado: gravadas,
          daLocalizacaoAntiga: false,
        };
      }

      // `$theme_name = get_option( 'current_theme' );` e, na ausencia,
      // `wp_get_theme()->get( 'Name' )` — leitura de disco que este modulo nao
      // faz (`theme.php:1031`-`:1034`).
      const nome =
        nomeDoTema ?? textoDaOpcao(opcoes.ler(OPCAO_DO_NOME_DO_TEMA)) ?? '';

      const antigas = opcoes.lerComoNoLegado(opcaoDeModificacoesAntiga(nome));
      return {
        valores: comoArranjo(antigas),
        valorGravado: antigas,
        // `false !== $mods` (`:1037`): o primeiro operando daquele `&&` e fato da
        // requisicao e nao esta aqui.
        daLocalizacaoAntiga: !(antigas.tipo === 'booleano' && !antigas.valor),
      };
    },

    modificacao(folhaDeEstilo, nome, nomeDoTema) {
      const { valores } = repositorio.modificacoes(folhaDeEstilo, nomeDoTema);
      return valorDaChave(valores, nome);
    },

    definirModificacao(folhaDeEstilo, nome, valor, nomeDoTema) {
      const { valores } = repositorio.modificacoes(folhaDeEstilo, nomeDoTema);
      return opcoes.gravar(
        opcaoDeModificacoesDoTema(folhaDeEstilo),
        atribuirChave(valores, nome, valor),
      );
    },

    removerModificacao(folhaDeEstilo, nome, nomeDoTema) {
      const { valores } = repositorio.modificacoes(folhaDeEstilo, nomeDoTema);
      // `if ( ! isset( $mods[ $name ] ) ) { return; }` (`theme.php:1141`).
      if (valorDaChave(valores, nome) === undefined) {
        return;
      }

      const restantes = semChave(valores, nome);
      // `if ( empty( $mods ) ) { remove_theme_mods(); return; }` (`:1147`).
      if (restantes.tipo === 'arranjo' && restantes.entradas.length === 0) {
        repositorio.removerModificacoes(folhaDeEstilo, nomeDoTema);
        return;
      }

      opcoes.gravar(opcaoDeModificacoesDoTema(folhaDeEstilo), restantes);
    },

    removerModificacoes(folhaDeEstilo, nomeDoTema) {
      opcoes.apagar(opcaoDeModificacoesDoTema(folhaDeEstilo));
      const nome =
        nomeDoTema ?? textoDaOpcao(opcoes.ler(OPCAO_DO_NOME_DO_TEMA)) ?? '';
      opcoes.apagar(opcaoDeModificacoesAntiga(nome));
    },

    migrarModificacoesAntigas(folhaDeEstilo, nomeDoTema, valores) {
      opcoes.gravar(opcaoDeModificacoesDoTema(folhaDeEstilo), valores);
      opcoes.apagar(opcaoDeModificacoesAntiga(nomeDoTema));
    },

    moverCargaAutomaticaDasModificacoes(
      folhaDeEstiloQueEntra,
      folhaDeEstiloQueSai,
    ) {
      opcoes.definirCargaAutomatica([
        [opcaoDeModificacoesDoTema(folhaDeEstiloQueEntra), 'yes'],
        [opcaoDeModificacoesDoTema(folhaDeEstiloQueSai), 'no'],
      ]);
    },
  };

  return repositorio;
}

/**
 * O valor de uma chave nomeada, ou `undefined` quando ela nao esta no arranjo.
 *
 * E o `isset( $mods[ $name ] )` do legado, e a comparacao e pelo **nome** da
 * chave: a chave de texto que seja a representacao decimal de um inteiro foi
 * normalizada para chave inteira pelo formato, e `nomeDaChave` a traz de volta
 * para texto (ver `plataforma/serializacao.normalizarChaveDeTexto`).
 */
export function valorDaChave(
  arranjo: ValorPhp,
  nome: string,
): ValorPhp | undefined {
  if (arranjo.tipo !== 'arranjo') {
    return undefined;
  }
  const entrada = arranjo.entradas.find(
    (candidata) => nomeDaChave(candidata.chave) === nome,
  );
  return entrada?.valor;
}

/**
 * `$mods[ $name ] = $valor` — a atribuicao com a semantica do arranjo de origem:
 * chave que ja existe e substituida **no lugar**, chave nova entra **no fim**.
 *
 * E a gemea de `atribuirChave` de BC-04 (`midia/armazenamento/derivadas.ts`), e a
 * repeticao e a mesma regra de dependencia 3 de sempre. A posicao importa porque
 * a ordem das entradas e byte-observavel no valor gravado.
 */
export function atribuirChave(
  arranjo: ValorPhp,
  nome: string,
  valor: ValorPhp,
): ValorPhp {
  const entradas: readonly EntradaDeArranjo[] =
    arranjo.tipo === 'arranjo' ? arranjo.entradas : [];
  const nova: EntradaDeArranjo = {
    chave: normalizarChaveDeTexto(nome),
    valor,
  };

  let substituiu = false;
  const resultado = entradas.map((entrada) => {
    if (nomeDaChave(entrada.chave) !== nome) {
      return entrada;
    }
    substituiu = true;
    return nova;
  });
  if (!substituiu) {
    resultado.push(nova);
  }
  return { tipo: 'arranjo', entradas: resultado };
}

/**
 * `unset( $mods[ $name ] )` — sem reindexar, porque as chaves sao de texto.
 *
 * O que sobra mantem a ordem relativa, que e o que o formato emite.
 */
export function semChave(arranjo: ValorPhp, nome: string): ValorPhp {
  if (arranjo.tipo !== 'arranjo') {
    return arranjoPorNome([]);
  }
  return {
    tipo: 'arranjo',
    entradas: arranjo.entradas.filter(
      (entrada) => nomeDaChave(entrada.chave) !== nome,
    ),
  };
}

/** `if ( ! is_array( $mods ) ) { $mods = array(); }` (`theme.php:1043`). */
function comoArranjo(valor: ValorPhp): ValorPhp {
  return valor.tipo === 'arranjo' ? valor : arranjoPorNome([]);
}

/**
 * O texto de uma opcao que guarda cadeia, ou `null` quando a linha nao existe.
 *
 * As tres opcoes do tema ativo guardam texto, logo o `maybe_unserialize()` as
 * devolve como texto. Um valor de outro tipo na coluna — o que o legado tolera,
 * porque a coluna e `longtext` sem validacao (`DB-DEG`, BR-MIGRAR-083) — e
 * convertido como PHP o converteria ao interpolar no nome da opcao de
 * modificacoes.
 */
function textoDaOpcao(valor: ValorPhp | null): string | null {
  if (valor === null) {
    return null;
  }
  switch (valor.tipo) {
    case 'texto':
      return typeof valor.valor === 'string'
        ? valor.valor
        : new TextDecoder().decode(valor.valor);
    case 'inteiro':
    case 'decimal':
      return String(valor.valor);
    case 'booleano':
      return valor.valor ? '1' : '';
    case 'nulo':
      return '';
    case 'arranjo':
      // PHP emitiria `Array` com aviso; o que importa aqui e nao fingir que a
      // coluna tinha texto. Quem le decide, e nenhum caminho desta feature grava
      // arranjo nestas tres chaves.
      return null;
  }
}
