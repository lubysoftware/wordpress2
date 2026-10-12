/**
 * O formato de operacao nomeada — a *ability* do legado, e a categoria a que ela
 * pertence.
 *
 * Tarefa **T002** da feature `013-superficies-programaticas`, cuja entrega e
 * *"os dois formatos existem como declaracao..."*. Este arquivo e o segundo dos
 * dois; o de esquema de rota esta em `../despacho/esquema-de-rota.ts`.
 * `satisfaz: — (infraestrutura)`: nenhum criterio de aceite. **A execucao e
 * T013** (US-6).
 *
 * ---
 *
 * ## O que uma operacao nomeada e, e por que ela esta nesta feature
 *
 * O glossario de `domain.md` §1.8, citado pela `spec.md` de US-6: *"Ability e
 * operacao nomeada e descrita por esquema, feita para ser invocada por agente de
 * IA, com autorizacao propria"*. `ADR-0011` e a decisao que lhe da autorizacao
 * propria. Sao **cinco** registradas no legado — tres do nucleo
 * (`core/get-site-info`, `core/get-user-info`, `core/get-environment-info`,
 * `wp-includes/abilities.php:90`, `:207` e `:294`) e duas da extensao
 * empacotada, que `discard_log.md` descarta por escopo deixando escrito que *"o
 * mecanismo de registro e a camada de autorizacao migram inteiros (I4, I5,
 * I6)"*. As tres do nucleo sao de T013; o mecanismo e este arquivo e
 * `./registro-de-operacoes-nomeadas.ts`.
 *
 * | o que | ancora | aqui |
 * |---|---|---|
 * | os argumentos de uma operacao | `wp-includes/abilities-api.php:290` (`wp_register_ability`) | {@link DeclaracaoDeOperacaoNomeada} |
 * | a conferencia desses argumentos | `abilities-api/class-wp-ability.php:281` (`prepare_properties`) | {@link prepararOperacaoNomeada} |
 * | a operacao pronta | `class-wp-ability.php:68`-`:132` (os oito campos) | {@link OperacaoNomeada} |
 * | os argumentos de uma categoria | `abilities-api.php` (`wp_register_ability_category`) | {@link DeclaracaoDeCategoriaDeOperacao} |
 * | a conferencia deles | `class-wp-ability-category.php:128` | {@link prepararCategoriaDeOperacao} |
 *
 * ## 🔴 Esta camada falha FECHADA, e e a unica das tres que falha assim
 *
 * `I4` / BR-MIGRAR-071: *"toda ability exige retorno de permissao, e a falta de
 * callback e erro — nao liberacao"*. A conferencia e de duas naturezas, e as
 * duas estao aqui:
 *
 * - **no registro**, a declaracao de permissao ausente, vazia ou nao chamavel
 *   **recusa a operacao inteira** (`class-wp-ability.php:309`-`:313`), que entao
 *   nao existe no registro — e nao ha o que executar;
 * - **na execucao**, `check_permissions()` devolve erro se o que esta ali nao
 *   for chamavel (`:623`). E **T013**.
 *
 * Posta ao lado da camada de rotas — que falha **aberta** e so avisa, ver
 * `../despacho/registro-de-rota-de-api.ts` —, esta e a assimetria que
 * `target_architecture.md` quis tornar visivel ao juntar as superficies num
 * contexto so: *"hoje elas moram em pastas separadas e ninguem ve a
 * divergencia"*. As duas estao agora no mesmo modulo, cada uma com o seu
 * default, e nenhuma foi "corrigida" na direcao da outra.
 *
 * ⚠️ **E ainda assim a negacao e filtravel, inclusive para conceder** (`I5` /
 * BR-MIGRAR-072), com *"elevacao temporaria de permissao para contextos
 * confiaveis"* citada como caso de uso no proprio legado. O filtro e
 * `wp_ability_permission_result` e mora em `class-wp-ability.php:652` **nesta
 * arvore** — BR-MIGRAR-072 cita `:634`; confira a ancora antes de afirmar. E
 * decisao de execucao, logo e **T013**, e esta declarada la.
 *
 * ## 🔴 O que o formato tipado torna inalcancavel, e esta registrado
 *
 * No legado o construtor atribui propriedade por propriedade, com
 * `property_exists()` como portao (`class-wp-ability.php:185`-`:202`). Duas
 * consequencias que um formato tipado nao tem:
 *
 * 1. **Chave desconhecida avisa e e ignorada**, em vez de recusar
 *    ({@link avisoDeCampoDesconhecido}). Reproduzido, porque o slot de entrega
 *    desta stack e *"compilado para JavaScript"* e todo chamador de terceiro
 *    chega sem tipo.
 * 2. **`name` e propriedade da classe, logo passar `name` nos argumentos
 *    SOBRESCREVE o nome sob o qual a operacao foi registrada** — a chave do
 *    registro vem do primeiro argumento (`abilities-api.php:290`) e
 *    `$this->name` e atribuido antes (`class-wp-ability.php:181`), e depois
 *    sobrescrito pelo laco. Uma operacao registrada como `a/b` pode responder
 *    `get_name() === 'c/d'`. {@link DeclaracaoDeOperacaoNomeada} nao tem campo
 *    de nome, logo o caminho nao existe aqui. Nao e descarte: esta declarado
 *    aqui e em `../README.md`, para quem um dia expuser o registro a um chamador
 *    sem tipo.
 *
 * ## A regra de idioma, que e a mesma de `../despacho/esquema-de-rota.ts`
 *
 * Campo que e nosso para nomear vai em portugues, como `DeclaracaoDeContexto`
 * fez com os de `register_taxonomy()`. Campo cujo **nome sai na resposta** fica
 * como esta: as palavras-chave dentro de {@link DeclaracaoDeOperacaoNomeada.esquemaDeEntrada}
 * e de `esquemaDeSaida`, que o controlador publica ao agente com
 * `wp_prepare_json_schema_for_client()`
 * (`rest-api/endpoints/class-wp-rest-abilities-v1-list-controller.php:211`), e
 * as chaves de {@link MetaDaOperacaoNomeada}, que e **saco aberto**:
 * `get_meta()` devolve o vetor inteiro e o controlador o espalha, logo
 * `annotations`, `public` e `show_in_rest` sao nome de campo na resposta.
 */

import type { AvisoDeUsoIndevido } from '../../../plataforma/autorizacao/index.js';
import type { EsquemaDeValor } from '../despacho/esquema-de-rota.js';

/**
 * O padrao do nome de uma operacao
 * (`abilities-api/class-wp-abilities-registry.php:86`).
 *
 * *"Deve conter prefixo de espaco de nome, i.e. `my-plugin/my-ability`. So pode
 * conter alfanumerico minusculo, hifen e a barra"* — e **exatamente um** nivel
 * de cada lado da barra.
 */
export const PADRAO_DO_NOME_DE_OPERACAO = /^[a-z0-9-]+\/[a-z0-9-]+$/;

/**
 * O padrao do apelido de uma categoria
 * (`class-wp-ability-categories-registry.php:68`).
 *
 * ⚠️ **Nao e o mesmo padrao do nome da operacao.** Aqui o hifen nao pode abrir
 * nem fechar o apelido, nem aparecer dobrado: `-site` e `a--b` sao recusados, e
 * seriam aceitos pelo padrao da operacao. Dois padroes, duas regras, no mesmo
 * mecanismo.
 */
export const PADRAO_DO_APELIDO_DE_CATEGORIA = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * As tres anotacoes semanticas, com o default de cada uma
 * (`class-wp-ability.php:46`-`:59`).
 *
 * ⚠️ **O default e `null`, e nao `false`**, nos tres. A diferenca e observavel:
 * `null` significa *"ninguem disse"* e `false` significa *"disse que nao"*, e as
 * tres saem na resposta ao agente com o valor que tiverem. O proprio legado
 * avisa, no comentario de `:41`, que elas *"nao garantem descricao fiel do
 * comportamento da operacao"*: sao dica para ferramenta, nao contrato.
 */
export const ANOTACOES_PADRAO_DA_OPERACAO = Object.freeze({
  /** `true` se a operacao nao altera o ambiente dela. */
  readonly: null,
  /** `true` se pode destruir; `false` se so acrescenta. */
  destructive: null,
  /** `true` se repetir a chamada com o mesmo insumo nao muda mais nada. */
  idempotent: null,
} as { readonly [chave: string]: boolean | null });

/** `DEFAULT_PUBLIC` — `class-wp-ability.php:37`, `@since 7.1.0`. */
export const PUBLICO_PADRAO_DA_OPERACAO = false;

/** `DEFAULT_SHOW_IN_REST` — `class-wp-ability.php:29`. */
export const MOSTRAR_NO_REST_PADRAO_DA_OPERACAO = false;

/**
 * O insumo de uma operacao — `mixed` no legado, e e mesmo qualquer coisa: o
 * esquema de entrada e que diz o que vale.
 */
export type InsumoDaOperacao = unknown;

/**
 * A funcao que executa a operacao — `execute_callback`.
 *
 * ⚠️ **Recebe o insumo so quando ha esquema de entrada declarado**:
 * `invoke_callback()` monta a lista de argumentos vazia e so acrescenta o insumo
 * se `get_input_schema()` nao estiver vazio (`class-wp-ability.php:585`-`:589`).
 * Operacao sem esquema de entrada e chamada **sem argumento nenhum**, e e por
 * isso que o insumo e opcional aqui. Quem executa e T013.
 */
export type ExecucaoDaOperacao = (insumo?: InsumoDaOperacao) => unknown;

/**
 * A declaracao de permissao da operacao — `permission_callback`.
 *
 * Recebe o mesmo insumo da execucao e devolve booleano ou erro. Devolve
 * `unknown` aqui porque e **T013** que fixa a coacao: *"retorno que nao seja
 * booleano nem erro e coagido a negacao"* (`I5`, e `UC-46`, *Excecoes*).
 */
export type PermissaoDaOperacao = (insumo?: InsumoDaOperacao) => unknown;

/**
 * O metadado da operacao — saco aberto, com tres chaves que o nucleo le.
 *
 * As chaves ficam em ingles: `get_meta()` devolve o vetor inteiro e o
 * controlador o publica ao agente. Ver a regra de idioma no cabecalho.
 */
export interface MetaDaOperacaoNomeada {
  /** As tres de {@link ANOTACOES_PADRAO_DA_OPERACAO}, e o que mais vier. */
  readonly annotations?: { readonly [chave: string]: boolean | null };
  /**
   * *"Se a operacao e feita para estar disponivel a clientes como a API REST,
   * MCP ou agentes de IA"*. Default `false`.
   *
   * ⚠️ **Semeia o default dos sinalizadores por canal**, e e so isso que ela
   * faz: `show_in_rest` resolve *"do mais especifico para o menos"* —
   * `show_in_rest` explicito vence, depois `public`, depois o default embutido
   * (`class-wp-ability.php:370`). Logo `public: true` com
   * `show_in_rest: false` e declaracao valida e significa *"publica, mas fora
   * da API REST"*.
   */
  readonly public?: boolean;
  /** Se a operacao pode ser invocada por HTTP. Default: o valor de `public`. */
  readonly show_in_rest?: boolean;
  /** Qualquer outra chave que quem registra queira carregar. */
  readonly [chave: string]: unknown;
}

/**
 * **O formato de operacao nomeada**: os argumentos que o registro recebe
 * (`abilities-api.php:239`-`:287`).
 *
 * Cinco campos sao exigidos e tres sao opcionais, e a exigencia e conferida em
 * {@link prepararOperacaoNomeada}, nao pelo tipo: declarar os cinco como
 * obrigatorios no tipo tornaria **inalcancavel** a recusa que `I4` descreve, e e
 * a recusa que e a regra. Ver a ressalva de BR-MIGRAR-091 em
 * `plataforma/autorizacao/conteudo-na-autorizacao.ts`.
 */
export interface DeclaracaoDeOperacaoNomeada {
  /** `label`. Exigido: texto nao vazio. */
  readonly rotulo?: string;
  /**
   * `description`. Exigido: texto nao vazio.
   *
   * *"Descricao detalhada do que a operacao faz e de quando deve ser usada"* —
   * e o que o agente le para decidir chamar.
   */
  readonly descricao?: string;
  /**
   * `category`. Exigido: texto nao vazio, **e a categoria tem de estar
   * registrada antes** — ver `./registro-de-operacoes-nomeadas.ts`.
   */
  readonly categoria?: string;
  /** `input_schema`. Opcional. Ver a regra de idioma no cabecalho. */
  readonly esquemaDeEntrada?: EsquemaDeValor;
  /** `output_schema`. Opcional. */
  readonly esquemaDeSaida?: EsquemaDeValor;
  /** `execute_callback`. Exigido, e tem de ser chamavel. */
  readonly executar?: ExecucaoDaOperacao;
  /**
   * `permission_callback`. **Exigido, e tem de ser chamavel** — e o ponto em que
   * esta camada falha fechada (`I4`). Ver o cabecalho.
   */
  readonly permissao?: PermissaoDaOperacao;
  /** `meta`. Opcional. */
  readonly meta?: MetaDaOperacaoNomeada;
  /**
   * `ability_class` — a classe propria que o legado instancia no lugar de
   * `WP_Ability` (`abilities-api.php:283`-`:286`).
   *
   * ⚠️ **Nao e propriedade da operacao**: o legado a retira dos argumentos antes
   * de construir, com o comentario *"the class is only used to instantiate the
   * ability, and is not a property of the ability itself"*
   * (`class-wp-abilities-registry.php:158`-`:170`).
   *
   * 🔴 **Ela muda a conferencia, e esse efeito esta reproduzido**: as duas
   * funcoes exigidas deixam de ser exigidas, porque o legado so as confere
   * quando `get_class( $this ) === self::class`
   * (`class-wp-ability.php:302` e `:309`) — uma classe propria pode trazer as
   * suas. Ver {@link prepararOperacaoNomeada}.
   *
   * 🔴 **O que NAO esta reproduzido e a conferencia do valor dela.** O legado
   * recusa o registro quando a classe nao estende `WP_Ability`
   * (`class-wp-abilities-registry.php:159`), e isso exige resolver um nome de
   * classe de PHP, que esta arvore nao tem. A mensagem fica em
   * {@link MENSAGENS_DE_RECUSA_DE_OPERACAO_NOMEADA.classeInvalida} para que
   * ninguem a reescreva, e **como uma classe propria chega num alvo sem classes
   * nomeadas por texto e pergunta de T013** — esta registrada em
   * `../README.md`, nao decidida aqui.
   */
  readonly classeDaOperacao?: string;
}

/**
 * Os oito campos que o laco de atribuicao do legado aceita — as propriedades da
 * classe menos `name` (`class-wp-ability.php:68`-`:132`).
 *
 * Chave fora desta lista avisa e e ignorada, nao recusa. Ver
 * {@link avisoDeCampoDesconhecido} e o achado 1 do cabecalho.
 */
export const CAMPOS_DA_OPERACAO_NOMEADA = Object.freeze([
  'rotulo',
  'descricao',
  'categoria',
  'esquemaDeEntrada',
  'esquemaDeSaida',
  'executar',
  'permissao',
  'meta',
] as const);

/**
 * A operacao **pronta**: a declaracao conferida, com o nome e os defaults de
 * metadado resolvidos.
 *
 * E o que o registro guarda e o que T013 executa. Os getters do legado
 * (`get_label()`, `get_input_schema()`, ...) sao leitura destes campos.
 */
export interface OperacaoNomeada {
  /** `$name` — a chave sob a qual a operacao foi registrada. */
  readonly nome: string;
  readonly rotulo: string;
  readonly descricao: string;
  readonly categoria: string;
  /** `{}` quando nao declarado, e **vazio tem efeito**: ver {@link ExecucaoDaOperacao}. */
  readonly esquemaDeEntrada: EsquemaDeValor;
  /** `{}` quando nao declarado. */
  readonly esquemaDeSaida: EsquemaDeValor;
  /** Pode faltar: a classe propria dispensa as duas funcoes. */
  readonly executar?: ExecucaoDaOperacao;
  /** Pode faltar, pelo mesmo motivo. Falta **nao** vale liberacao (`I4`). */
  readonly permissao?: PermissaoDaOperacao;
  /** Com `annotations`, `public` e `show_in_rest` resolvidos. */
  readonly meta: MetaDaOperacaoNomeada;
}

/**
 * As mensagens de recusa, como o legado as lanca em `prepare_properties()`.
 *
 * **Ficam em ingles** pela razao de `EC-05` registrada em
 * `contextos/classificacao/registro/erro-de-registro.ts`: *"o `msgid` em ingles
 * E a chave do catalogo"*.
 *
 * ⚠️ **No legado estas mensagens viajam numa excecao, e a excecao nunca escapa
 * do registro**: `register()` a captura e a transforma em aviso de uso indevido
 * mais `null` (`class-wp-abilities-registry.php:172`-`:182`). O observavel e,
 * portanto, o **aviso com este texto** e a operacao **nao registrada** — e e
 * assim que esta porte as devolve, como valor, pelo mesmo motivo que
 * `erro-de-registro.ts` registra: quem registra esta no arranque, e nao num
 * `try`.
 */
export const MENSAGENS_DE_RECUSA_DE_OPERACAO_NOMEADA = Object.freeze({
  /** `class-wp-ability.php:285`. */
  rotulo: 'The ability properties must contain a `label` string.',
  /** `:291`. */
  descricao: 'The ability properties must contain a `description` string.',
  /** `:297`. */
  categoria: 'The ability properties must contain a `category` string.',
  /** `:304`. */
  execucao:
    'The ability properties must contain a valid `execute_callback` function.',
  /** `:311` — note o verbo diferente: *provide*, nao *contain*. */
  permissao:
    'The ability properties must provide a valid `permission_callback` function.',
  /** `:318`. */
  esquemaDeEntrada:
    'The ability properties should provide a valid `input_schema` definition.',
  /** `:324`. */
  esquemaDeSaida:
    'The ability properties should provide a valid `output_schema` definition.',
  /** `:330`. */
  meta: 'The ability properties should provide a valid `meta` array.',
  /** `:336`. */
  anotacoes: 'The ability meta should provide a valid `annotations` array.',
  /** `:342`. */
  mostrarNoRest:
    'The ability meta should provide a valid `show_in_rest` boolean.',
  /** `:348`. */
  publico: 'The ability meta should provide a valid `public` boolean.',
  /**
   * `class-wp-abilities-registry.php:162`. 🔴 Declarada e **nao usada** — ver
   * {@link DeclaracaoDeOperacaoNomeada.classeDaOperacao}.
   */
  classeInvalida:
    'The ability args should provide a valid `ability_class` that extends WP_Ability.',
});

/** As mensagens de recusa de uma categoria (`class-wp-ability-category.php`). */
export const MENSAGENS_DE_RECUSA_DE_CATEGORIA = Object.freeze({
  /** `:79`. So alcancavel por construcao direta: o padrao do registro ja recusa vazio. */
  apelido: 'The ability category slug cannot be empty.',
  /** `:132`. */
  rotulo: 'The ability category properties must contain a `label` string.',
  /** `:138`. */
  descricao:
    'The ability category properties must contain a `description` string.',
  /** `:145`. */
  meta:
    'The ability category properties should provide a valid `meta` array.',
});

/** A recusa de uma declaracao: o texto que vira aviso de uso indevido. */
export interface RecusaDeDeclaracao {
  readonly recusaDeDeclaracao: true;
  readonly mensagem: string;
}

/** Monta a recusa. */
export function recusaDeDeclaracao(mensagem: string): RecusaDeDeclaracao {
  return { recusaDeDeclaracao: true, mensagem };
}

/** Reconhece a recusa no meio de um valor devolvido. */
export function ehRecusaDeDeclaracao(
  valor: unknown,
): valor is RecusaDeDeclaracao {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    (valor as { recusaDeDeclaracao?: unknown }).recusaDeDeclaracao === true
  );
}

/**
 * O aviso de campo desconhecido na declaracao
 * (`class-wp-ability.php:187`-`:197`).
 *
 * A terceira lacuna do texto e `__CLASS__`, que ali e sempre `WP_Ability` —
 * nao `static::`, logo uma classe propria **tambem** nomeia `WP_Ability` no
 * aviso. Reproduzido como esta.
 */
export function avisoDeCampoDesconhecido(
  campo: string,
  nomeDaOperacao: string,
): AvisoDeUsoIndevido {
  return {
    funcao: 'WP_Ability::__construct',
    mensagem:
      `Property "<code>${campo}</code>" is not a valid property for ability ` +
      `"<code>${nomeDaOperacao}</code>". Please check the <code>WP_Ability</code> ` +
      'class for allowed properties.',
    versao: '6.9.0',
  };
}

/**
 * `empty()` para um texto: verdadeiro para vazio **e para `'0'`**.
 *
 * Gemeo de `vazioComoNoLegado` em `../despacho/registro-de-rota-de-api.ts`, e
 * esta duplicado porque as duas areas nao compartilham arquivo de utilidade e
 * `utilitarios/` nao tem tarefa neste pacote. A consequencia aqui e concreta: um
 * rotulo `'0'` e recusado, porque `empty( '0' )` e verdadeiro no legado.
 */
function vazioComoNoLegado(texto: string): boolean {
  return texto === '' || texto === '0';
}

/** `is_array()` para o que chega como objeto ou vetor. `null` nao e vetor. */
function ehVetorComoNoLegado(valor: unknown): boolean {
  return typeof valor === 'object' && valor !== null;
}

/**
 * Confere e prepara a declaracao de uma operacao nomeada —
 * `WP_Ability::prepare_properties()` mais o laco de atribuicao do construtor
 * (`class-wp-ability.php:180`-`:374`).
 *
 * A ordem e a do legado, e ela e observavel, porque a primeira recusa e a que
 * sai:
 *
 * 1. os tres textos exigidos, nesta ordem: rotulo, descricao, categoria;
 * 2. as duas funcoes exigidas — **e so quando nao ha classe propria**
 *    (`:302` e `:309`);
 * 3. os tipos dos cinco campos opcionais: esquema de entrada, esquema de saida,
 *    meta, anotacoes, `show_in_rest`, `public`;
 * 4. os defaults de metadado, com `show_in_rest` resolvido *"do mais especifico
 *    para o menos"* (`:370`);
 * 5. so entao os campos desconhecidos, que **avisam e sao ignorados** — logo
 *    uma declaracao com campo desconhecido **e** registrada (`:185`-`:202`).
 *
 * @param avisar Quem recebe o aviso do passo 5. Opcional e so escrita (**P7**).
 * @returns A operacao pronta, ou {@link RecusaDeDeclaracao} com o texto que o
 *   registro transforma em aviso de uso indevido.
 */
export function prepararOperacaoNomeada(
  nome: string,
  declaracao: DeclaracaoDeOperacaoNomeada,
  avisar?: (aviso: AvisoDeUsoIndevido) => void,
): OperacaoNomeada | RecusaDeDeclaracao {
  const mensagens = MENSAGENS_DE_RECUSA_DE_OPERACAO_NOMEADA;

  const rotulo = declaracao.rotulo;
  if (
    rotulo === undefined ||
    typeof rotulo !== 'string' ||
    vazioComoNoLegado(rotulo)
  ) {
    return recusaDeDeclaracao(mensagens.rotulo);
  }

  const descricao = declaracao.descricao;
  if (
    descricao === undefined ||
    typeof descricao !== 'string' ||
    vazioComoNoLegado(descricao)
  ) {
    return recusaDeDeclaracao(mensagens.descricao);
  }

  const categoria = declaracao.categoria;
  if (
    categoria === undefined ||
    typeof categoria !== 'string' ||
    vazioComoNoLegado(categoria)
  ) {
    return recusaDeDeclaracao(mensagens.categoria);
  }

  // `:302` e `:309` — a classe propria dispensa as duas conferencias, porque
  // ela pode trazer as suas proprias funcoes.
  const comClassePropria = declaracao.classeDaOperacao !== undefined;

  if (!comClassePropria && typeof declaracao.executar !== 'function') {
    return recusaDeDeclaracao(mensagens.execucao);
  }

  if (!comClassePropria && typeof declaracao.permissao !== 'function') {
    // 🔴 `I4`: a falta de declaracao de permissao e ERRO, e nao liberacao. A
    // operacao nao chega a existir no registro.
    return recusaDeDeclaracao(mensagens.permissao);
  }

  // `:315`-`:332` — *"os opcionais so precisam ser do tipo certo quando
  // presentes"*. `isset()` e falso para nulo, logo nulo passa como ausente.
  if (
    declaracao.esquemaDeEntrada !== undefined &&
    declaracao.esquemaDeEntrada !== null &&
    !ehVetorComoNoLegado(declaracao.esquemaDeEntrada)
  ) {
    return recusaDeDeclaracao(mensagens.esquemaDeEntrada);
  }

  if (
    declaracao.esquemaDeSaida !== undefined &&
    declaracao.esquemaDeSaida !== null &&
    !ehVetorComoNoLegado(declaracao.esquemaDeSaida)
  ) {
    return recusaDeDeclaracao(mensagens.esquemaDeSaida);
  }

  const meta = declaracao.meta;

  if (meta !== undefined && meta !== null && !ehVetorComoNoLegado(meta)) {
    return recusaDeDeclaracao(mensagens.meta);
  }

  const anotacoesDeclaradas = meta?.annotations;
  if (
    anotacoesDeclaradas !== undefined &&
    anotacoesDeclaradas !== null &&
    !ehVetorComoNoLegado(anotacoesDeclaradas)
  ) {
    return recusaDeDeclaracao(mensagens.anotacoes);
  }

  const mostrarNoRestDeclarado = meta?.show_in_rest;
  if (
    mostrarNoRestDeclarado !== undefined &&
    mostrarNoRestDeclarado !== null &&
    typeof mostrarNoRestDeclarado !== 'boolean'
  ) {
    return recusaDeDeclaracao(mensagens.mostrarNoRest);
  }

  const publicoDeclarado = meta?.public;
  if (
    publicoDeclarado !== undefined &&
    publicoDeclarado !== null &&
    typeof publicoDeclarado !== 'boolean'
  ) {
    return recusaDeDeclaracao(mensagens.publico);
  }

  // `:353`-`:371` — os defaults, e a resolucao de `show_in_rest` do mais
  // especifico para o menos: explicito, depois `public`, depois o embutido.
  const metaResolvido: MetaDaOperacaoNomeada = {
    ...meta,
    annotations: {
      ...ANOTACOES_PADRAO_DA_OPERACAO,
      ...anotacoesDeclaradas,
    },
    show_in_rest:
      mostrarNoRestDeclarado ??
      publicoDeclarado ??
      MOSTRAR_NO_REST_PADRAO_DA_OPERACAO,
    public: publicoDeclarado ?? PUBLICO_PADRAO_DA_OPERACAO,
  };

  // `:185`-`:202` — o laco de atribuicao: campo desconhecido avisa e e
  // ignorado, e a operacao e registrada do mesmo jeito.
  if (avisar !== undefined) {
    const conhecidos = new Set<string>(CAMPOS_DA_OPERACAO_NOMEADA);
    for (const campo of Object.keys(declaracao)) {
      if (campo !== 'classeDaOperacao' && !conhecidos.has(campo)) {
        avisar(avisoDeCampoDesconhecido(campo, nome));
      }
    }
  }

  const operacao: OperacaoNomeada = {
    nome,
    rotulo,
    descricao,
    categoria,
    esquemaDeEntrada: declaracao.esquemaDeEntrada ?? {},
    esquemaDeSaida: declaracao.esquemaDeSaida ?? {},
    meta: metaResolvido,
    ...(declaracao.executar === undefined
      ? {}
      : { executar: declaracao.executar }),
    ...(declaracao.permissao === undefined
      ? {}
      : { permissao: declaracao.permissao }),
  };

  return operacao;
}

/**
 * **O formato de categoria de operacao**: os argumentos que
 * `wp_register_ability_category()` recebe.
 *
 * Tres campos, dois exigidos. A categoria existe porque `category` e exigido na
 * operacao e tem de estar registrado **antes** dela — e `CA-6.6` pede rota
 * propria para lista-las, que e T013.
 */
export interface DeclaracaoDeCategoriaDeOperacao {
  /** `label`. Exigido: texto nao vazio. */
  readonly rotulo?: string;
  /** `description`. Exigido: texto nao vazio. */
  readonly descricao?: string;
  /** `meta`. Opcional, saco aberto. */
  readonly meta?: Readonly<Record<string, unknown>>;
}

/** Os tres campos que o laco de atribuicao da categoria aceita. */
export const CAMPOS_DA_CATEGORIA_DE_OPERACAO = Object.freeze([
  'rotulo',
  'descricao',
  'meta',
] as const);

/** A categoria pronta. */
export interface CategoriaDeOperacao {
  /** `$slug`. */
  readonly apelido: string;
  readonly rotulo: string;
  readonly descricao: string;
  /** `{}` quando nao declarado — e o default do campo no legado (`:53`). */
  readonly meta: Readonly<Record<string, unknown>>;
}

/**
 * O aviso de campo desconhecido na declaracao de categoria
 * (`class-wp-ability-category.php:89`-`:99`).
 *
 * ⚠️ O texto **nao** e o mesmo da operacao: diz *"for ability category"* e
 * nomeia `WP_Ability_Category`. Duas mensagens, nao uma.
 */
export function avisoDeCampoDesconhecidoNaCategoria(
  campo: string,
  apelido: string,
): AvisoDeUsoIndevido {
  return {
    funcao: 'WP_Ability_Category::__construct',
    mensagem:
      `Property "<code>${campo}</code>" is not a valid property for ability ` +
      `category "<code>${apelido}</code>". Please check the ` +
      '<code>WP_Ability_Category</code> class for allowed properties.',
    versao: '6.9.0',
  };
}

/**
 * Confere e prepara a declaracao de uma categoria —
 * `WP_Ability_Category::__construct()` mais `prepare_properties()`
 * (`class-wp-ability-category.php:76`-`:150`).
 *
 * A ordem e a do legado: o apelido vazio primeiro (`:77`), depois rotulo,
 * descricao e o tipo de `meta`, e por fim o laco que avisa sobre campo
 * desconhecido.
 */
export function prepararCategoriaDeOperacao(
  apelido: string,
  declaracao: DeclaracaoDeCategoriaDeOperacao,
  avisar?: (aviso: AvisoDeUsoIndevido) => void,
): CategoriaDeOperacao | RecusaDeDeclaracao {
  const mensagens = MENSAGENS_DE_RECUSA_DE_CATEGORIA;

  if (vazioComoNoLegado(apelido)) {
    return recusaDeDeclaracao(mensagens.apelido);
  }

  const rotulo = declaracao.rotulo;
  if (
    rotulo === undefined ||
    typeof rotulo !== 'string' ||
    vazioComoNoLegado(rotulo)
  ) {
    return recusaDeDeclaracao(mensagens.rotulo);
  }

  const descricao = declaracao.descricao;
  if (
    descricao === undefined ||
    typeof descricao !== 'string' ||
    vazioComoNoLegado(descricao)
  ) {
    return recusaDeDeclaracao(mensagens.descricao);
  }

  const meta = declaracao.meta;
  if (meta !== undefined && meta !== null && !ehVetorComoNoLegado(meta)) {
    return recusaDeDeclaracao(mensagens.meta);
  }

  if (avisar !== undefined) {
    const conhecidos = new Set<string>(CAMPOS_DA_CATEGORIA_DE_OPERACAO);
    for (const campo of Object.keys(declaracao)) {
      if (!conhecidos.has(campo)) {
        avisar(avisoDeCampoDesconhecidoNaCategoria(campo, apelido));
      }
    }
  }

  return { apelido, rotulo, descricao, meta: meta ?? {} };
}
