/**
 * A primitiva de opcao nomeada: o que le e grava pela porta de dados.
 *
 * Entrega de **T002** da feature `010-operacao-do-software`, metade *"sao lidos
 * e gravados pela porta de dados"*. Os tres grupos de configuracao que a tarefa
 * nomeia estao em `../configuracao/`; o que mora aqui e **como** um ponto de
 * configuracao encontra a coluna.
 *
 * ⚠️ **Isto nao e o registro de opcoes do alvo.** `target_architecture.md`
 * atribui `REG-Opcao` a `plataforma/opcoes/`, que **nao existe nesta arvore** —
 * e a feature 001 registrou a mesma ausencia ao tratar `users_can_register`
 * como entrada lida de fora. O que esta aqui e o subconjunto que **esta**
 * feature consome: as nove opcoes de `chaves-e-tabelas.ts`, com os comandos que
 * o legado emite para elas. Quando `plataforma/opcoes/` nascer, este arquivo e
 * o que desce — nenhum chamador de `../configuracao/` muda.
 *
 * ── AS TRES COISAS QUE UM PORTE DESTA PRIMITIVA PERDE ──────────────────────
 *
 * **1. Gravar valor igual NAO emite comando.** `update_option()` compara o valor
 * novo com o lido e devolve `false` **antes** de qualquer escrita
 * (`wp-includes/option.php:923`), e `update_network_option()` faz o mesmo
 * (`:2429`). Nesta feature isso e observavel duas vezes: o marcador de aviso de
 * `A10` e gravado **antes** do envio e falhar na gravacao **aborta o aviso**
 * (`class-wp-recovery-mode-email-service.php:58` a `:62`), e a limpeza diaria de
 * chaves vencidas grava sempre, logo **nao emite comando** quando nada venceu
 * (`class-wp-recovery-mode-key-service.php:125`). O duplo de `porta-falsa.ts`
 * registra comando em vez de simular banco exatamente para que a lista vazia
 * seja afirmavel.
 *
 * **2. Gravar opcao ausente vira `INSERT`, e com DUAS leituras.**
 * `update_option()` delega para `add_option()` quando o valor lido e o default
 * (`option.php:929`), e `add_option()` **le de novo** antes de inserir
 * (`:1123`). Com o cache de objeto ligado a segunda leitura e gratuita; com ele
 * **desligado** — que e o que o `Contexto:` de PT-013 exige nas duas metades —
 * sao dois `SELECT`. Reproduzir um so faria a sequencia de comandos divergir do
 * oraculo, e *"snapshot + sequencia de comandos"* e o criterio da area.
 *
 * **3. A opcao de rede troca de tabela com a instalacao.** Em site unico
 * `get_network_option()` cai em `get_option()` (`option.php:2086`) e o valor
 * vive em `{site}options`; em rede vive em `{base}sitemeta` (`:2095`). E a
 * escrita em site unico passa `false` no autocarregamento
 * (`:2189` e `:2446`), logo a mesma opcao nasce com `autoload = 'off'` em site
 * unico e **sem coluna de autocarregamento nenhuma** em rede, porque `sitemeta`
 * nao tem essa coluna. As duas coisas sao efeito no banco.
 *
 * ── O QUE NAO ESTA AQUI, DE PROPOSITO ──────────────────────────────────────
 *
 * - **Cache de objeto.** E a quinta borda de AD-08 e esta feature nao a usa: o
 *   `Contexto:` de PT-013 roda *"com o cache de objeto desligado nas duas
 *   metades"*, e `modulo.test.ts` afirma desde T001 que as portas sao quatro.
 *   Todo caminho de cache do legado (`alloptions`, `notoptions`, `site-options`)
 *   e, com ele desligado, uma ida ao banco — que e o que esta aqui.
 * - **Os pontos de extensao de opcao.** Sao oito por opcao
 *   (`pre_option`, `default_option_{$option}`, `option_{$option}`,
 *   `pre_update_option_{$option}`, `pre_update_option`, e os de rede
 *   equivalentes), eles pertencem a `REG-Opcao` e **nenhum** e desta feature:
 *   P2 os preserva no modulo que os emite, e o modulo que os emite e o registro
 *   de opcoes. Declara-los aqui criaria ponto de extensao com dois donos.
 * - **`sanitize_option()` e `wp_protect_special_option()`.** Nenhuma das nove
 *   opcoes desta feature tem caso em `sanitize_option()`, e nenhuma esta na
 *   lista protegida (`alloptions`, `notoptions`) —
 *   `wp-includes/option.php:565`. As duas sao do registro de opcoes.
 */

import {
  serializar,
  talvezDesserializar,
  talvezSerializar,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import type {
  PortaDeDados,
  ValorDeColuna,
  ValorDeParametro,
} from '../portas/index.js';
import {
  tabelaDeOpcoesDeRede,
  tabelaDeOpcoesDoSite,
} from './chaves-e-tabelas.js';
import { comoBruto, comoTexto, primeiraLinha } from './leitura-de-linha.js';

/**
 * O resultado de uma leitura de opcao.
 *
 * `existe` e **a linha ter voltado**, e nao o valor ser util: e a razao pela
 * qual `get_option()` usa `get_row()` e nao `get_var()`, com o comentario no
 * proprio codigo (`wp-includes/option.php:208`). Opcao gravada com cadeia vazia
 * **existe**, e a diferenca decide entre `INSERT` e `UPDATE`.
 *
 * No legado a ausencia volta como o valor default do chamador — quase sempre
 * `false`, que e indistinguivel de uma opcao gravada com valor falso. Aqui a
 * ausencia e um estado proprio, e cada ponto de configuracao de
 * `../configuracao/` aplica **o default do chamador dele**, que e o que o P6
 * cobra: *"cada numero vive num ponto de configuracao nomeado, com o valor de
 * fabrica do legado"*.
 */
export type LeituraDeOpcao =
  | { readonly existe: true; readonly valor: ValorPhp }
  | { readonly existe: false };

/** A leitura de uma opcao que nao esta na tabela. */
export const OPCAO_AUSENTE: LeituraDeOpcao = { existe: false };

/**
 * O que um chamador pode pedir na coluna `autoload`, nas formas que
 * `wp_determine_option_autoload_value()` aceita (`option.php:1306`).
 *
 * `null` e "nao pedi nada", que e um terceiro caso e nao um default: ele faz o
 * legado **reavaliar** o valor gravado, com um `SELECT` a mais.
 */
export type AutocarregamentoPedido =
  | boolean
  | 'on'
  | 'yes'
  | 'off'
  | 'no'
  | null;

/** O que vai para a coluna `autoload`, nas cinco formas que o legado grava. */
export type AutocarregamentoGravado =
  | 'on'
  | 'off'
  | 'auto-on'
  | 'auto-off'
  | 'auto';

/**
 * Os quatro valores de `autoload` que fazem a opcao ser carregada em bloco
 * (`wp_autoload_values_to_autoload()`, `option.php:3260`).
 *
 * `'yes'` esta na lista porque e o default do DDL
 * (`wp-admin/includes/schema.php:145`), e nao porque alguma escrita o produza:
 * desde a 6.6 as escritas gravam `'on'`. Os dois convivem na mesma coluna.
 */
export const VALORES_QUE_AUTOCARREGAM: readonly string[] = [
  'yes',
  'on',
  'auto-on',
  'auto',
];

/**
 * Os tres valores que o legado **reavalia** quando a gravacao nao pede
 * autocarregamento (`$allow_values`, `option.php:954`).
 *
 * Valor explicito — `'on'`, `'off'` ou o `'yes'` do DDL — **nao** e reavaliado:
 * quem escolheu continua valendo.
 */
export const VALORES_REAVALIAVEIS: readonly string[] = [
  'auto-on',
  'auto-off',
  'auto',
];

/**
 * `150000` bytes: acima disso o valor nasce **sem** autocarregamento
 * (`wp_filter_default_autoload_value_via_option_size()`, `option.php:1362`,
 * registrado em `default-filters.php:299`).
 *
 * E numero do legado, com ponto de extensao proprio
 * (`wp_max_autoloaded_option_size`), e por isso vive numa constante nomeada
 * (P6). Nenhuma das nove opcoes desta feature o alcanca — as duas que poderiam
 * crescer, `recovery_keys` e `{sessao}_paused_extensions`, gravam com
 * autocarregamento **explicitamente desligado** e nao chegam a este ramo.
 */
export const TAMANHO_MAXIMO_DE_OPCAO_AUTOCARREGADA = 150000;

/**
 * O valor que vai para a coluna `autoload`, pela regra do legado.
 *
 * ⚠️ O ramo de `null` passa pelo ponto de extensao
 * `wp_default_autoload_value`, que o nucleo ja ocupa com o filtro de tamanho
 * acima. Interceptador de terceiro nesse ponto e do registro de opcoes, nao
 * desta feature: ver o cabecalho.
 */
export function determinarAutocarregamento(
  pedido: AutocarregamentoPedido,
  bytesDoValor: number,
): AutocarregamentoGravado {
  if (pedido === true) {
    return 'on';
  }
  if (pedido === false) {
    return 'off';
  }
  if (pedido === 'on' || pedido === 'yes') {
    return 'on';
  }
  if (pedido === 'off' || pedido === 'no') {
    return 'off';
  }
  return bytesDoValor > TAMANHO_MAXIMO_DE_OPCAO_AUTOCARREGADA
    ? 'auto-off'
    : 'auto';
}

/**
 * O valor lido da coluna, depois de `maybe_unserialize()`.
 *
 * Coluna `NULL` vira {@link ValorPhp} nulo e **nao** cadeia vazia: `meta_value`
 * de `sitemeta` e anulavel (`wp-admin/includes/schema.php:294`) e `option_value`
 * nao e, logo so a tabela de rede produz este caso.
 */
export function valorDaOpcao(valor: ValorDeColuna): ValorPhp {
  if (valor === null) {
    return { tipo: 'nulo' };
  }
  if (typeof valor === 'number') {
    // Coluna `longtext` nao chega como numero em driver nenhum, mas a porta
    // admite o tipo: o legado trataria o valor como a cadeia decimal dele.
    return talvezDesserializar(String(valor));
  }
  return talvezDesserializar(valor);
}

/**
 * O valor como parametro de coluna, depois de `maybe_serialize()`.
 *
 * As coercoes de escalar sao as do legado no ponto em que o valor encontra a
 * coluna, pelo `%s` que `process_fields()` escolhe para `longtext`
 * (`wp-includes/class-wpdb.php`): booleano vira `'1'` e `''`, que e a cadeia
 * que o `(string)` do PHP produz. Nenhuma das nove opcoes desta feature e
 * gravada com valor nulo — o ramo existe porque o codec o tem, nao porque algum
 * caminho o alcance.
 */
export function parametroDaOpcao(valor: ValorPhp): ValorDeParametro {
  const resolvido = talvezSerializar(valor);

  switch (resolvido.tipo) {
    case 'nulo':
      return null;
    case 'booleano':
      return resolvido.valor ? '1' : '';
    case 'inteiro':
    case 'decimal':
      return resolvido.valor;
    case 'texto':
      return resolvido.valor;
    case 'arranjo':
      return null;
  }
}

/**
 * A igualdade que decide se a gravacao emite comando: o `===` do PHP entre o
 * valor **desserializado** da coluna e o valor novo, antes de serializar
 * (`option.php:923` e `:2429`).
 *
 * O segundo termo da condicao do legado —
 * `maybe_serialize( $value ) === maybe_serialize( $old_value )` — nao muda o
 * resultado para escalar, porque `maybe_serialize()` so toca arranjo e objeto:
 * para escalar os dois termos sao o mesmo `===`, **com o tipo contando**. E o
 * tipo conta de verdade aqui: a coluna devolve sempre texto, logo gravar o
 * inteiro `1760000000` sobre o texto `'1760000000'` **emite comando**, que e o
 * caminho do marcador de aviso de `A10`.
 */
export function mesmoValorDeOpcao(gravado: ValorPhp, novo: ValorPhp): boolean {
  if (gravado.tipo !== novo.tipo) {
    return false;
  }
  switch (gravado.tipo) {
    case 'nulo':
      return true;
    case 'booleano':
      return gravado.valor === (novo as typeof gravado).valor;
    case 'inteiro':
    case 'decimal':
      return gravado.valor === (novo as typeof gravado).valor;
    case 'texto':
      return mesmosBytes(gravado.valor, (novo as typeof gravado).valor);
    case 'arranjo': {
      const outras = (novo as typeof gravado).entradas;
      if (gravado.entradas.length !== outras.length) {
        return false;
      }
      return gravado.entradas.every((entrada, indice) => {
        const outra = outras[indice];
        if (outra === undefined) {
          return false;
        }
        if (entrada.chave.tipo !== outra.chave.tipo) {
          return false;
        }
        const mesmaChave =
          entrada.chave.tipo === 'inteiro'
            ? entrada.chave.valor === outra.chave.valor
            : mesmosBytes(
                entrada.chave.valor as string | Uint8Array,
                outra.chave.valor as string | Uint8Array,
              );
        return mesmaChave && mesmoValorDeOpcao(entrada.valor, outra.valor);
      });
    }
  }
}

const CODIFICADOR = new TextEncoder();

function bytesDe(valor: string | Uint8Array): Uint8Array {
  return typeof valor === 'string' ? CODIFICADOR.encode(valor) : valor;
}

function mesmosBytes(
  a: string | Uint8Array,
  b: string | Uint8Array,
): boolean {
  if (typeof a === 'string' && typeof b === 'string') {
    return a === b;
  }
  const bytesA = bytesDe(a);
  const bytesB = bytesDe(b);
  return (
    bytesA.length === bytesB.length &&
    bytesA.every((byte, indice) => byte === bytesB[indice])
  );
}

/** Quantos bytes o valor ocupa na coluna, que e o que o filtro de tamanho mede. */
function bytesNaColuna(valor: ValorPhp): number {
  const resolvido = talvezSerializar(valor);
  if (resolvido.tipo === 'arranjo') {
    return serializar(resolvido).length;
  }
  const parametro = parametroDaOpcao(resolvido);
  if (parametro === null) {
    return 0;
  }
  if (typeof parametro === 'number') {
    return String(parametro).length;
  }
  return bytesDe(parametro).length;
}

/** As opcoes de `{site}options`, com a coluna de autocarregamento. */
export interface RepositorioDeOpcoesDoSite {
  /** `get_option()`: um `SELECT`, e a linha decide se a opcao existe. */
  ler(nome: string): LeituraDeOpcao;
  /**
   * `add_option()`: le primeiro e **nao insere** se a opcao existir, devolvendo
   * `false` sem emitir escrita nenhuma (`option.php:1123`).
   */
  acrescentar(
    nome: string,
    valor: ValorPhp,
    autocarregamento?: AutocarregamentoPedido,
  ): boolean;
  /**
   * `update_option()`: nao escreve se o valor for igual, delega para
   * {@link acrescentar} se a opcao nao existir, e `UPDATE` no resto.
   */
  gravar(
    nome: string,
    valor: ValorPhp,
    autocarregamento?: AutocarregamentoPedido,
  ): boolean;
  /**
   * `delete_option()`: le o autocarregamento para saber se a linha existe —
   * **sem `LIMIT 1`**, diferente das outras leituras (`option.php:1215`) — e so
   * emite o `DELETE` se ela existir.
   */
  apagar(nome: string): boolean;
}

export function criarRepositorioDeOpcoesDoSite(
  dados: PortaDeDados,
): RepositorioDeOpcoesDoSite {
  const tabela = tabelaDeOpcoesDoSite(dados);

  function ler(nome: string): LeituraDeOpcao {
    const linha = primeiraLinha(
      dados.selecionar({
        texto: `SELECT option_value FROM ${tabela} WHERE option_name = ? LIMIT 1`,
        parametros: [nome],
      }),
    );
    if (linha === null) {
      return OPCAO_AUSENTE;
    }
    return { existe: true, valor: valorDaOpcao(comoBruto(linha['option_value'])) };
  }

  function acrescentar(
    nome: string,
    valor: ValorPhp,
    autocarregamento: AutocarregamentoPedido = null,
  ): boolean {
    if (ler(nome).existe) {
      return false;
    }
    const resultado = dados.escrever({
      texto:
        `INSERT INTO \`${tabela}\` (\`option_name\`, \`option_value\`, \`autoload\`) ` +
        'VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ' +
        '`option_name` = VALUES(`option_name`), ' +
        '`option_value` = VALUES(`option_value`), ' +
        '`autoload` = VALUES(`autoload`)',
      parametros: [
        nome,
        parametroDaOpcao(valor),
        determinarAutocarregamento(autocarregamento, bytesNaColuna(valor)),
      ],
    });
    return resultado.linhasAfetadas > 0;
  }

  return {
    ler,
    acrescentar,

    gravar(nome, valor, autocarregamento = null) {
      const anterior = ler(nome);

      if (anterior.existe && mesmoValorDeOpcao(anterior.valor, valor)) {
        return false;
      }
      if (!anterior.existe) {
        return acrescentar(nome, valor, autocarregamento);
      }

      const campos = ['`option_value` = ?'];
      const parametros: ValorDeParametro[] = [parametroDaOpcao(valor)];

      if (autocarregamento !== null) {
        campos.push('`autoload` = ?');
        parametros.push(
          determinarAutocarregamento(autocarregamento, bytesNaColuna(valor)),
        );
      } else {
        // O ramo em que o legado REAVALIA: um `SELECT` a mais, e a coluna so
        // muda se o valor gravado for um dos tres automaticos E o novo for
        // diferente dele (`option.php:953` a `:961`).
        const gravado = comoTexto(
          primeiraLinha(
            dados.selecionar({
              texto: `SELECT autoload FROM ${tabela} WHERE option_name = ? LIMIT 1`,
              parametros: [nome],
            }),
          )?.['autoload'],
        );
        if (VALORES_REAVALIAVEIS.includes(gravado)) {
          const novo = determinarAutocarregamento(null, bytesNaColuna(valor));
          if (novo !== gravado) {
            campos.push('`autoload` = ?');
            parametros.push(novo);
          }
        }
      }

      parametros.push(nome);

      const resultado = dados.escrever({
        texto: `UPDATE \`${tabela}\` SET ${campos.join(', ')} WHERE \`option_name\` = ?`,
        parametros,
      });
      return resultado.linhasAfetadas > 0;
    },

    apagar(nome) {
      const linha = primeiraLinha(
        dados.selecionar({
          texto: `SELECT autoload FROM ${tabela} WHERE option_name = ?`,
          parametros: [nome],
        }),
      );
      if (linha === null) {
        return false;
      }
      const resultado = dados.escrever({
        texto: `DELETE FROM \`${tabela}\` WHERE \`option_name\` = ?`,
        parametros: [nome],
      });
      return resultado.linhasAfetadas > 0;
    },
  };
}

/**
 * A instalacao, do ponto de vista de uma opcao de rede.
 *
 * Chega **por argumento em cada chamada**, e nao por campo do repositorio, pela
 * mesma razao que as portas chegam por argumento no modulo: BR-MIGRAR-105
 * (`EXT-CONTEXTO`) poe identidade e conexao no escopo da **requisicao**, e em
 * rede o site corrente muda dentro da mesma requisicao
 * (`switch_to_blog()`). Um repositorio que guardasse o escopo decidiria por uma
 * requisicao com o dado de outra.
 */
export interface EscopoDeRede {
  /** `is_multisite()`: e ele que escolhe a tabela. */
  readonly emRede: boolean;
  /**
   * `get_current_network_id()`. Em site unico o legado devolve **1**, sempre
   * (`wp-includes/load.php`, `get_current_network_id()`), e o valor nao e usado
   * porque o caminho de site unico nem toca `sitemeta`.
   */
  readonly redeId: number;
}

/**
 * O escopo de uma instalacao de site unico, que e a instalacao de fabrica
 * (resposta 2: *instalacao nova, sem dado a migrar*).
 */
export const SITE_UNICO: EscopoDeRede = { emRede: false, redeId: 1 };

/** As opcoes de rede: `{base}sitemeta` em rede, `{site}options` em site unico. */
export interface RepositorioDeOpcoesDeRede {
  /** `get_site_option()` / `get_network_option()`. */
  ler(escopo: EscopoDeRede, nome: string): LeituraDeOpcao;
  /** `add_site_option()` / `add_network_option()`. */
  acrescentar(escopo: EscopoDeRede, nome: string, valor: ValorPhp): boolean;
  /** `update_site_option()` / `update_network_option()`. */
  gravar(escopo: EscopoDeRede, nome: string, valor: ValorPhp): boolean;
  /** `delete_site_option()` / `delete_network_option()`. */
  apagar(escopo: EscopoDeRede, nome: string): boolean;
}

export function criarRepositorioDeOpcoesDeRede(
  dados: PortaDeDados,
  opcoesDoSite: RepositorioDeOpcoesDoSite,
): RepositorioDeOpcoesDeRede {
  const tabela = tabelaDeOpcoesDeRede(dados);

  function ler(escopo: EscopoDeRede, nome: string): LeituraDeOpcao {
    if (!escopo.emRede) {
      return opcoesDoSite.ler(nome);
    }
    const linha = primeiraLinha(
      dados.selecionar({
        texto: `SELECT meta_value FROM ${tabela} WHERE meta_key = ? AND site_id = ?`,
        parametros: [nome, escopo.redeId],
      }),
    );
    if (linha === null) {
      return OPCAO_AUSENTE;
    }
    return { existe: true, valor: valorDaOpcao(comoBruto(linha['meta_value'])) };
  }

  function acrescentar(
    escopo: EscopoDeRede,
    nome: string,
    valor: ValorPhp,
  ): boolean {
    if (!escopo.emRede) {
      // `add_option( $option, $value, '', false )` (`option.php:2189`): opcao de
      // rede em site unico nasce com autocarregamento DESLIGADO.
      return opcoesDoSite.acrescentar(nome, valor, false);
    }
    if (ler(escopo, nome).existe) {
      return false;
    }
    const resultado = dados.escrever({
      texto:
        `INSERT INTO \`${tabela}\` (\`site_id\`, \`meta_key\`, \`meta_value\`) ` +
        'VALUES (?, ?, ?)',
      parametros: [escopo.redeId, nome, parametroDaOpcao(valor)],
    });
    return resultado.linhasAfetadas > 0;
  }

  return {
    ler,
    acrescentar,

    gravar(escopo, nome, valor) {
      const anterior = ler(escopo, nome);

      if (anterior.existe && mesmoValorDeOpcao(anterior.valor, valor)) {
        return false;
      }
      if (!anterior.existe) {
        return acrescentar(escopo, nome, valor);
      }
      if (!escopo.emRede) {
        // `update_option( $option, $value, false )` (`option.php:2446`): a
        // segunda leitura e a do caminho de site, e o autocarregamento e
        // explicito, logo NAO ha o `SELECT autoload` de reavaliacao.
        return opcoesDoSite.gravar(nome, valor, false);
      }
      const resultado = dados.escrever({
        texto:
          `UPDATE \`${tabela}\` SET \`meta_value\` = ? ` +
          'WHERE `site_id` = ? AND `meta_key` = ?',
        parametros: [parametroDaOpcao(valor), escopo.redeId, nome],
      });
      return resultado.linhasAfetadas > 0;
    },

    apagar(escopo, nome) {
      if (!escopo.emRede) {
        return opcoesDoSite.apagar(nome);
      }
      // `SELECT meta_id` e nao `SELECT meta_value`: o legado confere a
      // EXISTENCIA da linha, e o teste dele e `is_null( $row ) || ! $row->meta_id`
      // (`option.php:2312`).
      const linha = primeiraLinha(
        dados.selecionar({
          texto: `SELECT meta_id FROM ${tabela} WHERE meta_key = ? AND site_id = ?`,
          parametros: [nome, escopo.redeId],
        }),
      );
      if (linha === null) {
        return false;
      }
      const resultado = dados.escrever({
        texto:
          `DELETE FROM \`${tabela}\` WHERE \`meta_key\` = ? AND \`site_id\` = ?`,
        parametros: [nome, escopo.redeId],
      });
      return resultado.linhasAfetadas > 0;
    },
  };
}
