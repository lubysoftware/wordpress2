/**
 * A linha de `{site}options` — as primitivas que a configuracao do tema usa, com
 * a **sequencia de comandos** do legado.
 *
 * Segunda metade da entrega de **T002** da feature
 * `009-apresentacao-e-personalizacao`: *"a configuracao declarada pelo tema e
 * lida como dado, **pela porta de dados**, com a mesma forma do legado"*. Este
 * arquivo e o nivel da **linha**; `configuracao-do-tema.ts` e o nivel do
 * **tema**, e e la que as chaves aparecem.
 *
 * ## 🔴 Isto NAO e o registro de opcoes, e a fronteira esta escrita
 *
 * `target_architecture.md` atribui `options` e as quatro familias de metadado a
 * `plataforma/opcoes/` (*"53 de 71 dependentes"*), e `target_domain_model.md`
 * registra `REG-Opcao` como registro **sem invariante propria**. Aquele modulo
 * **nao existe nesta arvore e nenhuma tarefa dos 15 `tasks.md` o constroi** — a
 * mesma situacao que
 * `contextos/classificacao/termo-padrao/escopo-de-termo-padrao.ts` registrou por
 * escrito, em T007 de BC-02, ao recusar transformar opcao em porta.
 *
 * **Por que, ainda assim, a leitura e a escrita de opcao estao aqui, e nao por
 * ligacao tardia como em BC-02:** porque nesta feature a linha de `options` **e
 * o armazenamento do aggregate deste contexto**, e nao dado de outro dono.
 * `target_domain_model.md` poe `AGG-Tema` como **fundido** de
 * `class-wp-theme.php` + `class-wp-theme-json.php` + **`options`**, e
 * `AGG-AreaDeWidget` como **dividido de `options`**. Em BC-02 a opcao lida era
 * `default_category`, que BC-01 tambem le — dado de terceiro, logo colaboracao.
 * Aqui e o oposto: ninguem fora de BC-07 le `theme_mods_{folha}`. Somam-se duas
 * decisoes do pacote que apontam para o mesmo lugar:
 *
 * - `tasks.md` desta tarefa diz *"pela porta de dados"*, com essas palavras;
 * - **T001 desta feature**, merged, ja pos as opcoes na tabela *"o que as tres
 *   areas do ciclo leem e gravam"* de `portas/porta-de-dados.ts`, e deixou a
 *   nota: *"o marcador de carga automatica da opcao e efeito no banco... T001
 *   nao declara o campo porque nao grava opcao nenhuma; **T002 precisa dele**"*.
 *
 * E e a mesma forma que BC-03 e BC-04 usaram para `commentmeta` e `postmeta`,
 * que tambem sao nominalmente de `plataforma/opcoes/`: a familia de par
 * chave/valor foi portada no `armazenamento/` do contexto que a consome, pela
 * porta de dados dele, com a duplicacao declarada como regra.
 *
 * **O que, deste arquivo, pertence aquele modulo e NAO esta aqui** — cada item
 * com o motivo pelo qual omiti-lo nao muda o efeito no banco destas operacoes:
 *
 * | o que | onde esta no legado | por que fica fora |
 * |---|---|---|
 * | o cache de objeto (`alloptions`, `notoptions`, grupo `options`) | `option.php:166`-`:215`, `:966`-`:1006` | e porta de AD-08 que esta feature **nao** declarou (T025 a traz, `plan.md` slot `cache`), e o cenario de paridade roda *"com o cache de objeto desligado nas duas metades"* |
 * | os 9 pontos de extensao (`pre_option`, `option_{$o}`, `default_option_{$o}`, `pre_update_option`, `update_option`, `updated_option`, `add_option`, `added_option`, `delete_option`) | `option.php` inteiro | REQ-162 (barramento de *hooks*) esta em `do-not-rewrite.md`: declara-se onde seriam emitidos, nao se constroi o barramento |
 * | `sanitize_option()` | `wp-includes/formatting.php` | **nao tem ramo** para `stylesheet`, `template`, `current_theme` nem `theme_mods_*`: para estas chaves ela e so o filtro `sanitize_option_{$option}`, que cai no item acima |
 * | o redirecionamento de chave obsoleta (`blacklist_keys`, `comment_whitelist`) | `option.php:93`-`:109` | as duas chaves sao de moderacao (BC-03), nenhuma e desta feature |
 * | `wp_protect_special_option()` | `option.php:565` | protege `alloptions` e `notoptions`, que sao **nomes de cache** e nunca chaves desta feature |
 * | `maybe_serialize()` / `maybe_unserialize()` | `functions.php:628`, `:653` | ja existem, merged, em `plataforma/serializacao` — a regra de dependencia 1 permite o `import` |
 *
 * ⚠️ **Consequencia declarada da primeira linha dessa tabela:** sem cache de
 * objeto, toda leitura que o legado atende da memoria sai daqui como consulta.
 * O que a area 3 compara e *"snapshot + sequencia de comandos"*, e a sequencia
 * de **escrita** e identica; a contagem de `SELECT` depende de um cache que esta
 * feature nao declarou ainda, e o proprio cenario de paridade o desliga nas duas
 * metades. Por isso, e so por isso, a delegacao de dentro de
 * {@link RepositorioDeOpcoes.gravar} para o `INSERT` **nao** repete a leitura que
 * `add_option()` faz na propria guarda (`option.php:1121`-`:1125`): no legado ela
 * e acerto de cache, o resultado dela ja e conhecido naquele ponto e repeti-la
 * aqui inventaria um comando que o legado nao manda ao banco. Chamada **de
 * fora**, `acrescentar` faz a leitura — porque ali a guarda **decide se escreve**,
 * e isso e efeito no banco, nao desempenho.
 *
 * ## A sequencia de comandos, que e o que a area 3 compara
 *
 * `parity_specs.md`, Decisao 2, area 3: *"efeito no banco... **zero**
 * divergencia... *snapshot* + sequencia de comandos"*, e `LACUNA-IN-12` aponta
 * para ca com o dedo: *"trocar o tema ativo **escreve opcao** — e area 3"*.
 *
 * | operacao | cadeia | ancora |
 * |---|---|---|
 * | ler valor | `SELECT option_value FROM {site}options WHERE option_name = ? LIMIT 1` | `option.php:206` |
 * | ler carga automatica | `SELECT autoload FROM {site}options WHERE option_name = ? LIMIT 1` | `option.php:953` |
 * | ler carga automatica para apagar | a mesma, **sem `LIMIT`** | `option.php:1215` |
 * | atualizar | `UPDATE {site}options SET option_value = ? WHERE option_name = ?`, com `, autoload = ?` quando ha o que reavaliar | `option.php:963` |
 * | acrescentar | `INSERT INTO ... ON DUPLICATE KEY UPDATE ...` | `option.php:1142` |
 * | apagar | `DELETE FROM {site}options WHERE option_name = ?` | `option.php:1229` |
 * | definir carga automatica em lote | um `SELECT option_name` e **no maximo dois** `UPDATE ... SET autoload = ?` | `option.php:444`, `:463` |
 *
 * As crases nos nomes de coluna seguem o legado **onde ele as escreve**: a
 * cadeia do `INSERT` e escrita a mao com crases (`:1142`), e as de `UPDATE` e
 * `DELETE` sao montadas por `$wpdb->update()` e `$wpdb->delete()`, que e o mesmo
 * caminho que BC-01, BC-03 e BC-04 ja transcreveram sem elas.
 *
 * ⚠️ E **tres** operacoes nao emitem comando nenhum, o que e tao observavel
 * quanto as que emitem: gravar o valor que ja esta gravado (`:923`), apagar
 * opcao que nao existe (`:1216`) e pedir carga automatica que todas as linhas ja
 * tem (`:445`). `porta-falsa.ts` existe para que isso seja afirmavel.
 */

import {
  booleano,
  serializar,
  talvezDesserializar,
  talvezSerializar,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import type {
  LinhaDeResultado,
  PortaDeDados,
  ValorDeParametro,
} from '../portas/index.js';
import { tabelaDeOpcoes } from './chaves-e-tabelas.js';
import { comoBruto, comoTexto, primeiroValor } from './leitura-de-linha.js';

/** `on` — carga automatica pedida por quem gravou (`option.php:1310`). */
export const CARGA_AUTOMATICA_LIGADA = 'on';

/** `off` — carga automatica recusada por quem gravou (`option.php:1310`). */
export const CARGA_AUTOMATICA_DESLIGADA = 'off';

/** `auto-on` — ligada por heuristica, nao por pedido (`option.php:1335`). */
export const CARGA_AUTOMATICA_DECIDIDA_LIGADA = 'auto-on';

/** `auto-off` — desligada por heuristica (`option.php:1335`). */
export const CARGA_AUTOMATICA_DECIDIDA_DESLIGADA = 'auto-off';

/** `auto` — nenhuma heuristica decidiu, e e o default (`option.php:1338`). */
export const CARGA_AUTOMATICA_INDECISA = 'auto';

/**
 * Os quatro valores da coluna que **fazem** a opcao ser carregada em massa
 * (`wp_autoload_values_to_autoload()`, `wp-includes/option.php:3260`).
 *
 * `yes` esta na lista e **nao** e escrito por nenhum caminho novo: ele e o
 * default do DDL (`autoload varchar(20) NOT NULL default 'yes'`,
 * `target_data_model.md`) e o valor que uma instalacao mais antiga deixou
 * gravado. Tira-lo da lista faria o sistema novo deixar de carregar opcao que o
 * legado carrega, e o **P8** nao permite (*"nao remova... comportamento
 * publicado"*).
 *
 * ⚠️ A ordem e a do legado e nao e significativa no `in_array()`; o conjunto e.
 */
export const VALORES_DE_CARGA_AUTOMATICA_QUE_CARREGAM = [
  'yes',
  'on',
  'auto-on',
  'auto',
] as const;

/**
 * `150000` — o teto de bytes acima do qual a heuristica **desliga** a carga
 * automatica (`wp-includes/option.php:1362`, filtro
 * `wp_max_autoloaded_option_size`).
 *
 * E numero do legado, no ponto de configuracao nomeado que o **P6** exige, e nao
 * numero inventado: o filtro esta registrado por default em
 * `wp-includes/default-filters.php:299`
 * (`wp_filter_default_autoload_value_via_option_size`, prioridade 5), logo vale
 * em toda instalacao de fabrica. A comparacao e `>` estrito sobre o tamanho do
 * valor **serializado** (`:1362`-`:1367`): no teto exato ainda carrega, um byte
 * acima nao — e e essa a borda que o P6 manda afirmar por teste.
 *
 * Nesta feature o numero tem consequencia pratica: `theme_mods_{folha}` guarda o
 * mapa de componentes por area e as posicoes de menu num valor so, e e um dos
 * candidatos reais a passar de 150 kB.
 */
export const TETO_DE_BYTES_DA_CARGA_AUTOMATICA = 150000;

/**
 * O que um chamador pode pedir de carga automatica.
 *
 * `null` **nao** e "desligada": e *"deixe a heuristica decidir"*, que e o default
 * de `update_option()` e de `add_option()` (`option.php:846`, `:1069`). `'yes'`
 * e `'no'` sao aceitos *"for backward compatibility"* e estao marcados como
 * obsoletos no proprio legado — e sao exatamente os que `switch_theme()` passa
 * (`theme.php:857`-`:860`), o que impede remove-los.
 */
export type PedidoDeCargaAutomatica =
  | boolean
  | 'on'
  | 'off'
  | 'yes'
  | 'no'
  | null;

/**
 * `wp_determine_option_autoload_value()` (`wp-includes/option.php:1306`), com o
 * filtro de fabrica aplicado.
 *
 * Booleano vira `on`/`off`; as quatro cadeias viram `on`/`off`; e **sem pedido**
 * o resultado depende do tamanho: acima de
 * {@link TETO_DE_BYTES_DA_CARGA_AUTOMATICA} vira `auto-off`, e no resto vira
 * `auto`. A quinta saida possivel — `auto-on` — **nao** e alcancavel em
 * instalacao de fabrica: ela exige um filtro de terceiro que devolva `true`, e o
 * unico registrado de fabrica so sabe devolver `false` ou deixar passar
 * (`:1353`-`:1368`). A constante existe porque a **coluna** pode ter o valor, e
 * {@link VALORES_DE_CARGA_AUTOMATICA_QUE_CARREGAM} o le.
 *
 * `bytesDoValorGravado` e o tamanho do valor **ja serializado** (`strlen` sobre
 * `$serialized_value`, `:1363`), nao o do objeto em memoria.
 */
export function determinarCargaAutomatica(
  pedido: PedidoDeCargaAutomatica,
  bytesDoValorGravado: number,
): string {
  if (typeof pedido === 'boolean') {
    return pedido ? CARGA_AUTOMATICA_LIGADA : CARGA_AUTOMATICA_DESLIGADA;
  }
  if (pedido === 'on' || pedido === 'yes') {
    return CARGA_AUTOMATICA_LIGADA;
  }
  if (pedido === 'off' || pedido === 'no') {
    return CARGA_AUTOMATICA_DESLIGADA;
  }
  return bytesDoValorGravado > TETO_DE_BYTES_DA_CARGA_AUTOMATICA
    ? CARGA_AUTOMATICA_DECIDIDA_DESLIGADA
    : CARGA_AUTOMATICA_INDECISA;
}

/** O resultado de {@link RepositorioDeOpcoes.definirCargaAutomatica}, por chave. */
export interface CargaAutomaticaDefinida {
  readonly nome: string;
  /** `true` quando **esta** linha foi atualizada (`option.php:477`-`:479`). */
  readonly atualizada: boolean;
}

export interface RepositorioDeOpcoes {
  /**
   * `get_option( $nome )` sem default, com a distincao que o legado faz no
   * comentario de `option.php:208`: **`null` e linha ausente**, e nao valor
   * vazio.
   *
   * O valor passa por `maybe_unserialize()`
   * (`plataforma/serializacao.talvezDesserializar`), logo o arranjo volta como
   * arranjo e o texto que **parece** serializado e que nao desserializa volta
   * como `false` — que e o que `@unserialize()` devolve e o que o legado nao
   * distingue de um `false` gravado.
   */
  ler(nome: string): ValorPhp | null;

  /**
   * O mesmo que {@link RepositorioDeOpcoes.ler}, com a **ausencia escrita como
   * `false`** — o valor que `get_option()` devolve quando a linha nao existe,
   * porque `$default_value` vale `false`.
   *
   * Esta forma existe porque e dela que duas regras do legado dependem:
   * `get_theme_mods()` testa `false === $mods` (`theme.php:1030`) e
   * `update_option()` compara o valor novo com ela antes de decidir se escreve
   * (`option.php:923`). Quem precisa saber se a **linha** existe usa
   * {@link RepositorioDeOpcoes.ler}.
   */
  lerComoNoLegado(nome: string): ValorPhp;

  /** A coluna `autoload` da linha, ou `null` quando a linha nao existe. */
  cargaAutomaticaDe(nome: string): string | null;

  /**
   * `update_option()` (`wp-includes/option.php:846`), na sequencia do legado e
   * sem os pontos de extensao.
   *
   * Devolve `false` **sem emitir escrita** quando o valor gravado seria o mesmo
   * que ja esta la (`:923`) — o caso de `set_theme_mod()` com o valor corrente.
   * Quando o valor atual e `false` (linha ausente **ou** `false` gravado, que o
   * legado nao distingue), a escrita vai pelo caminho de
   * {@link RepositorioDeOpcoes.acrescentar} (`:928`-`:930`): o comando que sai e
   * o `INSERT ... ON DUPLICATE KEY UPDATE`, nao o `UPDATE`.
   */
  gravar(
    nome: string,
    valor: ValorPhp,
    cargaAutomatica?: PedidoDeCargaAutomatica,
  ): boolean;

  /**
   * `add_option()` (`wp-includes/option.php:1069`) — o `INSERT` idempotente, com
   * a guarda que o legado poe antes dele.
   *
   * ⚠️ **Opcao que ja existe nao e sobrescrita: a funcao devolve `false` e
   * nenhum comando sai** (`:1121`-`:1125` — *"Make sure the option doesn't
   * already exist"*). Isso e observavel, e e o que separa esta operacao de
   * {@link RepositorioDeOpcoes.gravar}: `switch_theme()` usa as duas, e usa
   * `add_option()` justamente onde **nao** quer sobrescrever
   * (`theme.php:818`-`:823`, dentro de `if ( ... false === get_option(
   * 'theme_mods_' . $stylesheet ) )`).
   *
   * Como no legado, *"existe"* quer dizer *"tem valor diferente do default"*, e o
   * default sem filtro e `false`: linha ausente **e** linha com `false` gravado
   * passam a guarda, porque `get_option()` devolve `false` nas duas.
   */
  acrescentar(
    nome: string,
    valor: ValorPhp,
    cargaAutomatica?: PedidoDeCargaAutomatica,
  ): boolean;

  /**
   * `delete_option()` (`wp-includes/option.php:1201`).
   *
   * Le a carga automatica **antes** (sem `LIMIT`, `:1215`) e devolve `false` sem
   * emitir `DELETE` quando a linha nao existe — o caso normal das raizes de tema
   * numa instalacao com um diretorio de temas so (`theme.php:809`-`:810`).
   */
  apagar(nome: string): boolean;

  /**
   * `wp_set_option_autoload_values()` (`wp-includes/option.php:397`) — o lote de
   * **duas** escritas no maximo, mais a leitura que decide se alguma sai.
   *
   * E o ultimo passo de `switch_theme()` (`theme.php:857`-`:861`): liga a carga
   * do `theme_mods_` do tema que entra e desliga a do tema que sai, numa chamada
   * so. T001 chamou isso de *"area 3 do criterio de paridade (efeito de
   * escrita), nao detalhe de desempenho"*.
   *
   * ⚠️ **Os valores gravados sao `on` e `off`**, mesmo quando o chamador pede
   * `yes` e `no`: o legado agrupa por balde e grava o **nome do balde**
   * (`:409`-`:422`, `:463`). Reproduzir `yes`/`no` na coluna seria divergir no
   * byte.
   */
  definirCargaAutomatica(
    pedidos: readonly (readonly [string, PedidoDeCargaAutomatica])[],
  ): readonly CargaAutomaticaDefinida[];
}

export function criarRepositorioDeOpcoes(
  dados: PortaDeDados,
): RepositorioDeOpcoes {
  const tabela = tabelaDeOpcoes(dados);

  /**
   * O `INSERT` de `add_option()` (`wp-includes/option.php:1142`), **sem** a
   * guarda de existencia.
   *
   * Existe separado porque os dois caminhos do legado chegam nele com a guarda
   * **ja satisfeita por quem chamou**: `update_option()` so delega quando o
   * valor atual e `false` (`:928`), e `switch_theme()` so chama `add_option()`
   * dentro de um `if` que acabou de conferir o mesmo (`theme.php:818`).
   */
  const inserir = (
    nome: string,
    valor: ValorPhp,
    cargaAutomatica: PedidoDeCargaAutomatica,
  ): boolean => {
    const gravado = talvezSerializar(valor);
    return (
      dados.escrever({
        texto:
          `INSERT INTO \`${tabela}\` ` +
          '(`option_name`, `option_value`, `autoload`) VALUES (?, ?, ?) ' +
          'ON DUPLICATE KEY UPDATE `option_name` = VALUES(`option_name`), ' +
          '`option_value` = VALUES(`option_value`), ' +
          '`autoload` = VALUES(`autoload`)',
        parametros: [
          nome,
          parametroDoValor(gravado),
          determinarCargaAutomatica(
            cargaAutomatica,
            bytesDoValorGravado(gravado),
          ),
        ],
      }).linhasAfetadas > 0
    );
  };

  const repositorio: RepositorioDeOpcoes = {
    ler(nome) {
      const linhas = dados.selecionar({
        texto: `SELECT option_value FROM ${tabela} WHERE option_name = ? LIMIT 1`,
        parametros: [nome],
      });
      const linha = linhas[0];
      if (linha === undefined) {
        return null;
      }
      // `is_object( $row )` (`option.php:209`): a linha existe, e o valor dela e
      // lido como esta. `option_value` e `longtext NOT NULL`, logo coluna nula
      // nao e estado do legado — e se o driver a devolver assim, o texto vazio e
      // o que `maybe_unserialize('')` recebe.
      return talvezDesserializar(paraOCodec(linha, 'option_value'));
    },

    lerComoNoLegado(nome) {
      return repositorio.ler(nome) ?? booleano(false);
    },

    cargaAutomaticaDe(nome) {
      const linhas = dados.selecionar({
        texto: `SELECT autoload FROM ${tabela} WHERE option_name = ? LIMIT 1`,
        parametros: [nome],
      });
      return linhas.length === 0 ? null : comoTexto(primeiroValor(linhas));
    },

    gravar(nome, valor, cargaAutomatica = null) {
      const valorAtual = repositorio.lerComoNoLegado(nome);
      const gravadoNovo = talvezSerializar(valor);

      // `if ( $value === $old_value || maybe_serialize( $value ) ===
      // maybe_serialize( $old_value ) ) { return false; }` (`option.php:923`).
      if (mesmoValorGravado(gravadoNovo, talvezSerializar(valorAtual))) {
        return false;
      }

      // `if ( apply_filters( "default_option_{$option}", false, ... ) ===
      // $old_value ) { return add_option( ... ); }` (`option.php:928`). Sem
      // filtro registrado o default e `false`, logo: valor atual igual a `false`
      // — linha ausente ou `false` gravado — vai pelo INSERT.
      //
      // Entra pela porta de dentro de proposito: a guarda de `add_option()` e
      // uma releitura da MESMA linha que acabou de ser lida acima, e no legado
      // ela e acerto de cache (ver o cabecalho). Repeti-la aqui acrescentaria uma
      // consulta que o legado nao manda ao banco, e o resultado dela ja e
      // conhecido: o valor e `false`.
      if (valorAtual.tipo === 'booleano' && !valorAtual.valor) {
        return inserir(nome, valor, cargaAutomatica);
      }

      const parametros: ValorDeParametro[] = [parametroDoValor(gravadoNovo)];
      let colunas = 'option_value = ?';
      const cargaReavaliada = cargaAutomaticaDaAtualizacao(
        repositorio,
        nome,
        cargaAutomatica,
        bytesDoValorGravado(gravadoNovo),
      );
      if (cargaReavaliada !== null) {
        colunas += ', autoload = ?';
        parametros.push(cargaReavaliada);
      }
      parametros.push(nome);

      return (
        dados.escrever({
          texto: `UPDATE ${tabela} SET ${colunas} WHERE option_name = ?`,
          parametros,
        }).linhasAfetadas > 0
      );
    },

    acrescentar(nome, valor, cargaAutomatica = null) {
      // `if ( apply_filters( "default_option_{$option}", false, ... ) !==
      // get_option( $option ) ) { return false; }` (`option.php:1121`-`:1125`):
      // opcao que ja existe nao e sobrescrita, e nenhum comando sai.
      const valorAtual = repositorio.lerComoNoLegado(nome);
      if (!(valorAtual.tipo === 'booleano' && !valorAtual.valor)) {
        return false;
      }
      return inserir(nome, valor, cargaAutomatica);
    },

    apagar(nome) {
      const linhas = dados.selecionar({
        texto: `SELECT autoload FROM ${tabela} WHERE option_name = ?`,
        parametros: [nome],
      });
      if (linhas.length === 0) {
        return false;
      }
      return (
        dados.escrever({
          texto: `DELETE FROM ${tabela} WHERE option_name = ?`,
          parametros: [nome],
        }).linhasAfetadas > 0
      );
    },

    definirCargaAutomatica(pedidos) {
      // `if ( ! $options ) { return array(); }` (`option.php:400`).
      if (pedidos.length === 0) {
        return [];
      }

      // Os dois baldes, na ordem em que o legado os declara (`:405`-`:408`): e
      // ela que decide qual UPDATE sai primeiro.
      const ligadas: string[] = [];
      const desligadas: string[] = [];
      for (const [nome, pedido] of pedidos) {
        if (pedido === false || pedido === 'off' || pedido === 'no') {
          desligadas.push(nome);
        } else {
          ligadas.push(nome);
        }
      }
      const baldes: readonly (readonly [string, readonly string[]])[] = [
        [CARGA_AUTOMATICA_LIGADA, ligadas],
        [CARGA_AUTOMATICA_DESLIGADA, desligadas],
      ];

      const condicoes: string[] = [];
      const parametrosDaLeitura: ValorDeParametro[] = [];
      for (const [valorDaColuna, nomes] of baldes) {
        if (nomes.length === 0) {
          continue;
        }
        condicoes.push(
          `autoload != ? AND option_name IN (${nomes.map(() => '?').join(',')})`,
        );
        parametrosDaLeitura.push(valorDaColuna, ...nomes);
      }

      const aAtualizar = new Set(
        dados
          .selecionar({
            texto:
              `SELECT option_name FROM ${tabela} ` +
              `WHERE ${condicoes.join(' OR ')}`,
            parametros: parametrosDaLeitura,
          })
          .map((linha) => comoTexto(linha['option_name'])),
      );

      // `if ( ! $options_to_update ) { return $results; }` (`option.php:445`):
      // nenhum UPDATE sai, e as duas linhas ficam como estao.
      const atualizadas = new Set<string>();
      if (aAtualizar.size > 0) {
        for (const [valorDaColuna, nomes] of baldes) {
          const alvos = nomes.filter((nome) => aAtualizar.has(nome));
          if (alvos.length === 0) {
            continue;
          }
          const escrita = dados.escrever({
            texto:
              `UPDATE ${tabela} SET autoload = ? ` +
              `WHERE option_name IN (${alvos.map(() => '?').join(',')})`,
            parametros: [valorDaColuna, ...alvos],
          });
          // `if ( ! $success ) { ...; continue; }` (`option.php:470`-`:474`): o
          // balde inteiro conta como nao atualizado, mesmo que parte tenha ido.
          if (escrita.linhasAfetadas <= 0) {
            continue;
          }
          for (const alvo of alvos) {
            atualizadas.add(alvo);
          }
        }
      }

      return pedidos.map(([nome]) => ({
        nome,
        atualizada: atualizadas.has(nome),
      }));
    },
  };

  return repositorio;
}

/**
 * O ramo de carga automatica do `UPDATE` (`wp-includes/option.php:949`-`:958`).
 *
 * Com pedido explicito, a coluna entra sempre. **Sem** pedido, o legado rele a
 * coluna para reavaliar o que foi decidido por heuristica, e so a inclui se o
 * valor mudar: linha com `on`, `off` ou `yes` nao e reavaliada, e nesse caso o
 * `UPDATE` toca uma coluna so. Devolve `null` quando a coluna nao entra.
 */
function cargaAutomaticaDaAtualizacao(
  repositorio: RepositorioDeOpcoes,
  nome: string,
  pedido: PedidoDeCargaAutomatica,
  bytes: number,
): string | null {
  if (pedido !== null) {
    return determinarCargaAutomatica(pedido, bytes);
  }
  const atual = repositorio.cargaAutomaticaDe(nome);
  const reavaliavel =
    atual === CARGA_AUTOMATICA_DECIDIDA_LIGADA ||
    atual === CARGA_AUTOMATICA_DECIDIDA_DESLIGADA ||
    atual === CARGA_AUTOMATICA_INDECISA;
  if (!reavaliavel) {
    return null;
  }
  const reavaliada = determinarCargaAutomatica(null, bytes);
  return reavaliada === atual ? null : reavaliada;
}

/**
 * `maybe_serialize( $a ) === maybe_serialize( $b )` — a comparacao que decide se
 * a escrita sai (`wp-includes/option.php:923`).
 *
 * O `===` da origem compara **tipo e valor**, logo inteiro `5` e texto `"5"` nao
 * sao o mesmo valor gravado. E por isso que a comparacao e feita sobre o
 * {@link ValorPhp} e nao sobre bytes: depois de `maybe_serialize` o arranjo ja e
 * texto, e so os escalares chegam com o tipo de origem preservado.
 */
function mesmoValorGravado(a: ValorPhp, b: ValorPhp): boolean {
  if (a.tipo !== b.tipo) {
    return false;
  }
  switch (a.tipo) {
    case 'nulo':
      return true;
    case 'texto': {
      const outro = b as typeof a;
      return comoCadeia(a.valor) === comoCadeia(outro.valor);
    }
    case 'booleano':
    case 'inteiro':
    case 'decimal': {
      const outro = b as typeof a;
      return a.valor === outro.valor;
    }
    case 'arranjo':
      // `talvezSerializar` nunca devolve arranjo (`talvez-serializar.ts`), logo
      // este ramo e inalcancavel pelos chamadores daqui; devolver `false` o
      // mantem conservador: na duvida, escreve.
      return false;
  }
}

/** O parametro que vai para a coluna: texto ou escalar, como o legado o passa. */
function parametroDoValor(gravado: ValorPhp): ValorDeParametro {
  switch (gravado.tipo) {
    case 'texto':
      return gravado.valor;
    case 'inteiro':
    case 'decimal':
      return gravado.valor;
    case 'booleano':
      // Conversao de PHP para cadeia na hora de gravar: `true` vira `'1'` e
      // `false` vira `''`. Nao e decisao nossa, e a coluna e `NOT NULL`.
      return gravado.valor ? '1' : '';
    case 'nulo':
      return '';
    case 'arranjo':
      // Inalcancavel por quem chama daqui, porque todos passam por
      // `talvezSerializar` antes — e e ela que converte arranjo em texto
      // (`maybe_serialize()`, `functions.php:628`). O ramo existe para que a
      // funcao seja total: serializar e o que o legado faria, e **nunca** deixar
      // o valor cair.
      return serializar(gravado);
  }
}

/** `strlen( $serialized_value )` (`wp-includes/option.php:1363`) — em BYTES. */
function bytesDoValorGravado(gravado: ValorPhp): number {
  const parametro = parametroDoValor(gravado);
  if (parametro === null) {
    return 0;
  }
  if (typeof parametro === 'number') {
    return String(parametro).length;
  }
  return typeof parametro === 'string'
    ? CODIFICADOR.encode(parametro).length
    : parametro.length;
}

const CODIFICADOR = new TextEncoder();
const DECODIFICADOR = new TextDecoder();

function comoCadeia(valor: string | Uint8Array): string {
  return typeof valor === 'string' ? valor : DECODIFICADOR.decode(valor);
}

function paraOCodec(
  linha: LinhaDeResultado,
  coluna: string,
): string | Uint8Array {
  const bruto = comoBruto(linha[coluna]);
  if (bruto === null) {
    return '';
  }
  return typeof bruto === 'number' ? String(bruto) : bruto;
}
