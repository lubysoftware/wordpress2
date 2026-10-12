/**
 * A forma de armazenamento da solicitacao — `AGG-SolicitacaoDeDadoPessoal`, que
 * e uma linha de `posts` mais duas de `postmeta`.
 *
 * Entrega de **T002** da feature `008-privacidade-e-dados-pessoais`:
 * *"a solicitacao existe como tipo de conteudo proprio... lida e gravada pela
 * porta de dados"*. `satisfaz: — (infraestrutura)`: nenhum criterio de aceite
 * fecha aqui, e **nenhuma regra de negocio desta feature esta neste arquivo**.
 *
 * ── SEIS COLUNAS DE `posts` QUEREM DIZER OUTRA COISA NA SOLICITACAO ────────
 *
 * E a lista que faz `D1` ser escolha de modelagem com efeito observavel, e nao
 * detalhe. O mapa inteiro sai de um lugar so: o construtor de
 * `WP_User_Request` (`wp-includes/class-wp-user-request.php:109` a `:121`), com
 * os comentarios do proprio legado em `wp-includes/user.php:4827` e `:4828` —
 * *"Action name stored in post_name column"* e *"Email address stored in
 * post_title column"*.
 *
 * | coluna | no conteudo | na solicitacao | ancora |
 * |---|---|---|---|
 * | `post_title` | o titulo | o **endereco de e-mail do titular** | `:112` |
 * | `post_name` | o identificador na URL | a **acao pedida** | `:113` |
 * | `post_content` | o corpo | **JSON** com o dado auxiliar do pedido | `:119` |
 * | `post_password` | a senha de conteudo, em texto claro | a **chave de confirmacao com resumo** | `:120` |
 * | `post_author` | a conta que consta no registro | a conta do titular, **`0` quando ele nao tem conta** | `:111` |
 * | `post_modified_gmt` | o instante da ultima alteracao | o instante de que o **prazo de 24 h** e contado | `:116` |
 *
 * `plan.md` resume a consequencia em uma frase, e ela e a razao de a solicitacao
 * nao ter tabela: *"quem a modelar como tabela propria perde de graca autor,
 * data, metadado e endpoint, e precisa reescrever a lixeira, a listagem e a
 * paginacao"*. O cenario `@invariante` de `PT-012` cobra o mesmo pelo avesso —
 * *"o campo que guarda o endereco do titular e o mesmo nas duas"* e *"nenhuma
 * das duas cria tabela propria para a solicitacao"*.
 *
 * ⚠️ **O que a solicitacao nao usa de `posts` tambem e observavel:** `post_excerpt`, `post_content_filtered` e
 * `post_mime_type` ficam vazias, `post_parent` e `menu_order` ficam `0`, e
 * `comment_status` e `ping_status` recebem o default do tipo. A solicitacao
 * **nao** tem `comment_count` proprio nem versao: `supports => array()` no
 * registro do tipo (`wp-includes/post.php:298`) desliga tudo.
 *
 * ── A GRAVACAO DA LINHA NAO ESTA AQUI, E A RAZAO E DE FRONTEIRA ────────────
 *
 * 🔴 **Este repositorio le a linha e nao a escreve.** Nao e esquecimento, e e a
 * decisao mais consequente de T002 — a mesma que BC-04 registrou em
 * `contextos/midia/armazenamento/anexo.ts` pelo mesmo motivo.
 *
 * **O caminho da privacidade nao emite comando proprio sobre `posts`.** Uma
 * busca por `$wpdb` em `wp-admin/includes/privacy-tools.php` devolve **zero**
 * ocorrencias, e a regiao de privacidade de `wp-includes/user.php` (`:3950` a
 * `:5150`) devolve **zero**. As quatro escritas da maquina de estado passam
 * todas por `wp_update_post()`, e a abertura, que e a quinta, por
 * `wp_insert_post()`:
 *
 * | o que | cadeia do legado | ancora | tarefa |
 * |---|---|---|---|
 * | abrir | `wp_insert_post` com 8 chaves | `user.php:4841` a `:4853` | T003 |
 * | gerar a chave no envio | `wp_update_post` com `post_status` e `post_password` | `user.php:5063` a `:5069` | T005, T007 |
 * | confirmar | `wp_update_post` com `post_status` | `user.php:4257` a `:4262` | T005 |
 * | concluir | `wp_update_post` com `post_status` | `privacy-tools.php:57` a `:62` | T011, T013 |
 * | expirar | `wp_update_post` com `post_status` e `post_password` | `privacy-tools.php:223` a `:229` | T009 |
 *
 * **E um `UPDATE` nascido aqui nao seria o comando do legado**, por tres razoes
 * medidas, nenhuma delas de estilo:
 *
 * 1. **O comando do legado tem 21 colunas, nao duas.** `wp_update_post()` le a
 *    linha inteira e faz `array_merge( $post, $postarr )`
 *    (`wp-includes/post.php:5335` e `:5367`); `wp_insert_post()` monta `$data`
 *    com `compact()` das 21 colunas (`:4912` a `:4933`) e chama
 *    `$wpdb->update( $wpdb->posts, $data, $where )` (`:4995`). A area 3 da
 *    Decisao 2 de `parity_specs.md` compara *"snapshot + sequencia de
 *    comandos"* com **zero** tolerancia.
 * 2. **O comando do legado reescreve `post_modified`, e esta feature depende
 *    disso.** `if ( $update || '0000-00-00 00:00:00' === $post_date ) {
 *    $post_modified = current_time( 'mysql' ); ... }`
 *    (`wp-includes/post.php:4789` a `:4791`). E dai que sai o relogio do prazo:
 *    `modified_timestamp` e o que `wp_validate_user_request_key` soma a 24 horas
 *    (`user.php:5091` e `:5113`). Um `UPDATE` de duas colunas deixaria o prazo
 *    correndo do envio anterior — e o reenvio de CA-3.3 nasceria com menos de 24
 *    horas de vida, em silencio.
 * 3. **O comando do legado dispara cinco pontos de extensao publicos**:
 *    `wp_insert_post_data` (`:4978`), `pre_post_update` (`:4993`),
 *    `post_updated`, `save_post` e `wp_after_insert_post`. O **P2** da
 *    constituicao poe cada um no contrato publico e a tabela *Nao negociavel*
 *    recusa saltar qualquer um deles.
 *
 * Como a chamada de BC-06 para BC-01 e **ligacao tardia** (AD-10: *"toda chamada
 * BC para BC e resolvida no momento da chamada, por porta injetada"*, e a regra
 * de dependencia 3 proibe o `import`), **quem declara essa ligacao e a tarefa
 * que grava** — T003 para a abertura, T005 para a chave e a confirmacao, T009
 * para a expiracao —, do mesmo jeito que `ClassificacaoNaPublicacao` e
 * declarada no contexto da operacao em BC-01 e que BC-04 deixou a dele para
 * T003.
 *
 * O que **e** gravado por esta tarefa, e e gravado aqui pela porta de dados, sao
 * as duas linhas de `postmeta`: os instantes de confirmacao e de conclusao
 * (`./metadado.ts`), que o caminho da privacidade escreve por conta propria com
 * `update_post_meta()` (`user.php:4256` e `privacy-tools.php:55`).
 */

import type { ValorPhp } from '../../../plataforma/serializacao/index.js';
import type { LinhaDeResultado, PortaDeDados } from '../portas/index.js';
import {
  CHAVE_DO_INSTANTE_DE_CONCLUSAO,
  CHAVE_DO_INSTANTE_DE_CONFIRMACAO,
  tabelaDeConteudo,
  TIPO_DE_SOLICITACAO,
} from './chaves-e-tabelas.js';
import {
  comoInteiro,
  comoTexto,
  instanteDaColunaDeData,
  primeiraLinha,
} from './leitura-de-linha.js';
import {
  criarRepositorioDeMetadados,
  type RepositorioDeMetadados,
  type ValorDeMetadado,
} from './metadado.js';

/**
 * As **duas** acoes que uma solicitacao pode pedir, na ordem em que o legado as
 * lista.
 *
 * `_wp_privacy_action_request_types()` (`wp-includes/user.php:4010` a `:4015`), e
 * a lista e `@access private` no legado — o que **nao** a torna privada no
 * sentido do contrato: ela e lida em tres lugares (`user.php:4764`, `:4812` e
 * `wp-admin/includes/privacy-tools.php:120`) e o valor de cada entrada e
 * gravado na coluna `post_name`, logo e dado observavel.
 *
 * ⚠️ **`remove_personal_data`, e nao `erase_personal_data`.** O nome da acao, o
 * nome da capacidade (`erase_others_personal_data`) e o nome do arquivo de tela
 * (`erase-personal-data.php`) usam **verbos diferentes** para a mesma coisa, e a
 * descricao humana da acao e *"Erase Personal Data"* (`user.php:4872`). Portar
 * pelo nome que faz sentido quebraria a coluna.
 *
 * A **validacao** contra esta lista — `in_array( $action_name, ..., true )`, que
 * devolve `invalid_action` e grava nada (`user.php:4812`) — e de **T003**.
 */
export const ACOES_DE_SOLICITACAO: readonly string[] = Object.freeze([
  'export_personal_data',
  'remove_personal_data',
] as const);

/** `post_author = 0`: titular **sem conta** no site, e nao conta ausente. */
export const SEM_CONTA = 0;

/**
 * Um valor que `json_decode( ..., true )` pode devolver.
 *
 * E JSON, e **nao** o formato serializado do PHP: a coluna `post_content` da
 * solicitacao e escrita com `wp_json_encode( $request_data )`
 * (`wp-includes/user.php:4846`) e lida com `json_decode( $post->post_content,
 * true )` (`class-wp-user-request.php:119`). Confundir os dois trocaria os bytes
 * da coluna, e `DB-SER` (BR-MIGRAR-082) poe os bytes no contrato.
 */
export type ValorJson =
  | null
  | boolean
  | number
  | string
  | readonly ValorJson[]
  | { readonly [chave: string]: ValorJson };

/**
 * A solicitacao como o legado a monta: os onze campos de `WP_User_Request`,
 * nesta ordem (`wp-includes/class-wp-user-request.php:110` a `:120`).
 *
 * `estado` e `acao` sao `string` e **nao** os tipos fechados do vocabulario, e
 * isso e regra lida e nao preguica: `posts.post_status` e `posts.post_name` nao
 * tem `ENUM` nem `CHECK` (`DB-ENUM`), `register_post_status()` e ponto de
 * extensao publico, e o filtro `user_request_action_description`
 * (`user.php:4888`) existe justamente para dar nome a acao que uma extensao
 * registrou. `EstadoDaSolicitacao` e {@link ACOES_DE_SOLICITACAO} descrevem o
 * **vocabulario de fabrica** — nao o dominio da coluna.
 */
export interface SolicitacaoDeDadoPessoal {
  /** `ID`. */
  readonly id: number;
  /**
   * `post_author` — a conta do titular, {@link SEM_CONTA} quando ele nao tem
   * conta no site. E o que faz CA-1.3 valer.
   *
   * ⚠️ No legado o campo e **cadeia numerica**, nao inteiro: `WP_User_Request`
   * o declara `@var string` com `@phpstan-var numeric-string` e o inicializa
   * como `'0'` (`class-wp-user-request.php:23` a `:26`), porque a coluna chega
   * do driver como texto. A distincao nao e observavel: as tres leituras do
   * campo usam `! empty( $request->user_id )`
   * (`user.php:4501`, `:4910`, `privacy-tools.php:603`), e `empty()` e
   * verdadeiro tanto para `0` quanto para `'0'`. Inteiro aqui e o que BC-01 e
   * BC-05 fazem com a mesma coluna.
   */
  readonly contaDoTitular: number;
  /** `post_title` — o endereco de e-mail do titular. */
  readonly enderecoDeEmail: string;
  /** `post_name` — a acao pedida. Ver {@link ACOES_DE_SOLICITACAO}. */
  readonly acao: string;
  /** `post_status` — um dos quatro de `./estados-da-solicitacao.ts`. */
  readonly estado: string;
  /**
   * `strtotime( post_date_gmt )` — o instante da abertura, em segundos UTC.
   *
   * `null` e o `false` do PHP; ver {@link instanteDaColunaDeData}.
   */
  readonly criadaEm: number | null;
  /**
   * `strtotime( post_modified_gmt )` — o instante da ultima alteracao, e **o
   * relogio do prazo de 24 horas** (`user.php:5091` e `:5113`).
   *
   * `null` e o `false` do PHP, e `! $key_request_time` trata `null` e `0` do
   * mesmo jeito; o ramo e de T005.
   */
  readonly modificadaEm: number | null;
  /**
   * `(int) get_post_meta( ..., '_wp_user_request_confirmed_timestamp', true )`.
   *
   * ⚠️ **`0` significa duas coisas**: metadado ausente — `(int) ''` e `0` — e
   * instante zero. O legado nao as distingue, e nao e por acidente: nenhuma
   * decisao do sistema le este campo. Quem decide se a solicitacao foi
   * confirmada le o **estado** (`user.php:4278`), nao o instante. Ele e dado de
   * prova, exibido na lista.
   */
  readonly confirmadaEm: number;
  /**
   * `(int) get_post_meta( ..., '_wp_user_request_completed_timestamp', true )`.
   * Mesma leitura, mesmo `0` ambiguo que {@link confirmadaEm}.
   */
  readonly concluidaEm: number;
  /**
   * `json_decode( post_content, true )` — o dado auxiliar do pedido.
   *
   * ⚠️ **`null` significa tres coisas**: a coluna guardava o JSON `null`, a
   * coluna estava vazia, ou o JSON e invalido — `json_decode` devolve `null`
   * nos tres casos e o legado **nao** confere. O campo nasce `array()` na
   * declaracao da classe (`class-wp-user-request.php:90`) e e sobrescrito pelo
   * construtor de qualquer forma, logo o default nunca sobrevive.
   *
   * ⚠️ Duas diferencas entre `json_decode` e o leitor do runtime ficam
   * **declaradas e nao resolvidas**, porque nenhuma historia desta feature
   * grava dado auxiliar: `json_decode` tem profundidade maxima de 512 e devolve
   * `null` acima dela, e converte inteiro grande em `float` em vez de recusar.
   * Quem gravar dado auxiliar (T003) decide o que fazer com as duas.
   */
  readonly dadosDoPedido: ValorJson;
  /**
   * `post_password` — a chave de confirmacao **com resumo**, ou
   * `SEM_CHAVE` quando nao ha. Ver `./chave-de-confirmacao.ts`.
   */
  readonly chaveDeConfirmacao: string;
}

export interface RepositorioDeSolicitacoes {
  /**
   * A solicitacao de um identificador, ou `null`.
   *
   * E `wp_get_user_request()` inteira (`wp-includes/user.php:5134` a `:5143`),
   * com os quatro comportamentos dela, e os quatro sao observaveis:
   *
   * 1. **`absint` antes de tudo** (`:5135`): um identificador negativo vira o
   *    positivo dele, e a consulta sai para `5` quando se pediu `-5`. Nao e
   *    defesa, e coercao, e e a de `abs( (int) $v )`.
   * 2. **Identificador nao positivo nao emite comando**: `get_post()` desiste em
   *    `if ( $post_id <= 0 ) { return false; }`
   *    (`wp-includes/class-wp-post.php:282`), antes da consulta. Lista de
   *    comandos vazia e afirmacao, nao ausencia.
   * 3. **Tipo errado devolve `null`, e nao erro** (`:5138`): a guarda e
   *    `'user_request' !== $post->post_type`, feita **em codigo** e nao na
   *    consulta, logo a leitura de `posts` sai igual para um conteudo comum — e
   *    a consulta de metadado **nao** sai. "Nao existe" e "existe e e outra
   *    coisa" sao indistinguiveis para quem chama, porque sao indistinguiveis
   *    la.
   * 4. **A linha vem por `SELECT *`** (`wp-includes/class-wp-post.php:289`), e
   *    nao por lista de colunas: `DB-MIG` (BR-MIGRAR-085) registra que *"coluna
   *    criada por extensao permanece e nao aparece em `wp_get_db_schema()`"*, e
   *    uma lista explicita deixaria de fora a coluna que uma extensao
   *    acrescentou.
   *
   * ⚠️ **Sao duas consultas, nunca tres**, e a conta e do legado: uma em
   * `posts` e **uma** em `postmeta`, porque o construtor chama `get_post_meta`
   * duas vezes sobre o mesmo cache de objeto. Ver `./metadado.ts`.
   */
  obterPorId(id: number): SolicitacaoDeDadoPessoal | null;
  /** As primitivas de `{site}postmeta` desta solicitacao. */
  readonly metadados: RepositorioDeMetadados;
}

export function criarRepositorioDeSolicitacoes(
  dados: PortaDeDados,
): RepositorioDeSolicitacoes {
  const tabela = tabelaDeConteudo(dados);
  const metadados = criarRepositorioDeMetadados(dados);

  return {
    metadados,

    obterPorId(id) {
      // `absint( $request_id )` — `abs( (int) $v )`.
      const identificador = Math.abs(Math.trunc(id));
      if (!Number.isFinite(identificador) || identificador <= 0) {
        return null;
      }

      const linha = primeiraLinha(
        dados.selecionar({
          texto: `SELECT * FROM ${tabela} WHERE ID = ? LIMIT 1`,
          parametros: [identificador],
        }),
      );
      if (linha === null) {
        return null;
      }
      if (comoTexto(linha['post_type']) !== TIPO_DE_SOLICITACAO) {
        return null;
      }

      return lerSolicitacao(linha, metadados.listar(identificador), metadados);
    },
  };
}

/**
 * A linha e o metadado dela como `SolicitacaoDeDadoPessoal` — o construtor de
 * `WP_User_Request` (`wp-includes/class-wp-user-request.php:109` a `:121`).
 *
 * Esta separada do repositorio porque no legado ela tambem esta: a classe aceita
 * `WP_Post|object`, e e por isso que o caminho da lista consegue construir o
 * objeto a partir de uma linha que ja tem na mao
 * (`wp-admin/includes/class-wp-privacy-requests-table.php:401`).
 *
 * **Nao valida nada.** Nem o tipo da linha — a guarda e de quem chama, como no
 * legado —, nem o estado, nem o formato do e-mail, nem a acao. `DB-DEG`
 * (BR-MIGRAR-083) manda reproduzir a degradacao em vez da recusa.
 */
export function lerSolicitacao(
  linha: LinhaDeResultado,
  linhasDeMetadado: readonly ValorDeMetadado[],
  metadados: RepositorioDeMetadados,
): SolicitacaoDeDadoPessoal {
  return {
    id: comoInteiro(linha['ID']),
    contaDoTitular: comoInteiro(linha['post_author']),
    enderecoDeEmail: comoTexto(linha['post_title']),
    acao: comoTexto(linha['post_name']),
    estado: comoTexto(linha['post_status']),
    criadaEm: instanteDaColunaDeData(linha['post_date_gmt']),
    modificadaEm: instanteDaColunaDeData(linha['post_modified_gmt']),
    confirmadaEm: inteiroDoMetadado(
      metadados.valorUnico(linhasDeMetadado, CHAVE_DO_INSTANTE_DE_CONFIRMACAO),
    ),
    concluidaEm: inteiroDoMetadado(
      metadados.valorUnico(linhasDeMetadado, CHAVE_DO_INSTANTE_DE_CONCLUSAO),
    ),
    dadosDoPedido: lerDadosDoPedido(comoTexto(linha['post_content'])),
    chaveDeConfirmacao: comoTexto(linha['post_password']),
  };
}

/**
 * O `(int)` que o construtor aplica ao valor unico do metadado
 * (`class-wp-user-request.php:117` e `:118`).
 *
 * E a coercao do PHP, nao uma conversao cuidadosa: `(int) ''` e `0`, `(int)
 * 'abc'` e `0`, `(int) '12abc'` e `12`, e `(int) true` e `1`. A ausencia do
 * metadado chega aqui como a cadeia vazia de `AUSENTE_NA_LEITURA_UNICA`, logo
 * **vira `0`** — ver {@link SolicitacaoDeDadoPessoal.confirmadaEm}.
 */
function inteiroDoMetadado(valor: ValorPhp): number {
  switch (valor.tipo) {
    case 'nulo':
      return 0;
    case 'booleano':
      return valor.valor ? 1 : 0;
    case 'inteiro':
      return valor.valor;
    case 'decimal':
      return Math.trunc(valor.valor);
    case 'texto': {
      const texto =
        typeof valor.valor === 'string'
          ? valor.valor
          : new TextDecoder().decode(valor.valor);
      const inicio = /^[ \t\n\r\v\f]*[+-]?\d+/.exec(texto);
      return inicio === null ? 0 : Number.parseInt(inicio[0], 10);
    }
    case 'arranjo':
      // `(int)` de arranjo e `1` quando ele tem entrada e `0` quando vazio.
      return valor.entradas.length === 0 ? 0 : 1;
  }
}

/**
 * `json_decode( $post->post_content, true )` — e `null` em tudo o que ele
 * recusa, sem distinguir o erro do valor.
 *
 * Ver as duas diferencas declaradas em
 * {@link SolicitacaoDeDadoPessoal.dadosDoPedido}.
 */
function lerDadosDoPedido(corpo: string): ValorJson {
  try {
    return JSON.parse(corpo) as ValorJson;
  } catch {
    return null;
  }
}
