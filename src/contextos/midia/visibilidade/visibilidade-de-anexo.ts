/**
 * **US-2**: a visibilidade do arquivo enviado e a do conteudo de destino.
 *
 * Entrega de **T005** da feature `006-biblioteca-de-midia`: *"o comportamento de
 * US-2 existe e os criterios CA-2.1, CA-2.2, CA-2.3 e CA-2.4 passam contra o
 * sistema novo"*. A regra e **BR-MIGRAR-002** (`P2`, confianca 🟢), e o catalogo
 * a escreve assim:
 *
 * > **Anexo nunca e "publicado".** Status fora de `inherit`, `private`, `trash`,
 * > `auto-draft` e reescrito para `inherit`: a visibilidade do arquivo e a do
 * > post pai.
 * > — `target_business_rules.md`, BR-MIGRAR-002
 *
 * No legado a regra tem **duas metades, em dois arquivos e dois momentos**, e
 * esta tarefa e a segunda:
 *
 * | metade | o que faz | ancora | de quem e |
 * |---|---|---|---|
 * | **gravacao** | reescreve o estado pedido para `inherit` | `wp-includes/post.php:4705`-`:4707` | **BC-01**, e ja existe: `contextos/conteudo/gravacao/estado-na-gravacao.ts` |
 * | **leitura** | resolve o `inherit` gravado na visibilidade do pai | `wp-includes/post.php:1290`-`:1348` (`get_post_status()`) | **este arquivo** |
 *
 * **Sem a segunda metade, tres dos quatro criterios nao fecham.** `inherit` na
 * coluna nao e uma visibilidade: e a instrucao de ir buscar uma. Quem grava
 * `inherit` e para ali tem um anexo cuja visibilidade e a cadeia `inherit`, que
 * nenhum estado registrado conhece — e CA-2.1 (*"tem a visibilidade do destino"*),
 * CA-2.3 (*"sem destino passa a ter visibilidade propria"*) e CA-2.4 (*"mudar a
 * do destino muda a do anexo junto"*) sao exatamente sobre o valor **resolvido**.
 *
 * ---
 *
 * # Por que `get_post_status()` inteira mora em BC-04
 *
 * Ela nao e funcao de anexo: ela e a leitura de estado de **qualquer** conteudo.
 * Mas de `:1300` a `:1336` **tudo** o que ela faz alem de devolver a coluna e a
 * regra do anexo, e a fronteira foi nomeada por outra feature antes desta
 * existir. `plataforma/autorizacao/conteudo-na-autorizacao.ts`, em
 * `ConteudoNaAutorizacao.estadoParaLeitura` (T017 da feature 001):
 *
 * > ⚠️ Para tudo o que nao e anexo, este campo e igual a `estado` ... A
 * > diferenca existe porque `get_post_status()` resolve o estado de um anexo
 * > pelo conteudo pai (`inherit`, anexo solto, pai na lixeira), e essa resolucao
 * > e da **biblioteca de midia — feature 006, nao esta**.
 *
 * E a recursao obriga a aceitar conteudo de qualquer tipo: `:1322` chama a
 * propria funcao para o **pai**, que quase sempre e um `post` ou uma `page`.
 *
 * ---
 *
 * # Os quatro desfechos da coluna `inherit`, na ordem em que o legado os testa
 *
 * | # | condicao | resultado | ancora |
 * |---|---|---|---|
 * | 1 | sem pai (`0`), **ou** pai que nao existe, **ou** pai igual a si mesmo | `publish` | `:1306`-`:1312` |
 * | 2 | pai **na lixeira** | o estado anterior do pai, guardado no marcador da lixeira | `:1313`-`:1316` |
 * | 2b | pai na lixeira **sem** marcador | `publish` | `:1317`-`:1320` |
 * | 3 | qualquer outro pai | a visibilidade **resolvida** do pai, recursivamente | `:1321`-`:1323` |
 *
 * E o quinto desfecho, que e o ramo de fora do `inherit` (`:1324`-`:1336`):
 * anexo cujo estado **nao** e `inherit` e **nao** e um dos tres proprios vira
 * `publish`. O comentario do legado diz para que serve: *"Ensure uninherited
 * attachments have a permitted status either 'private', 'trash', 'auto-draft'.
 * **This is to match the logic in wp_insert_post()**"* — e e por ele que a
 * leitura **nunca** relata para um anexo um estado que a gravacao nao deixaria
 * passar. E a metade de CA-2.2 que cabe nesta feature.
 *
 * ---
 *
 * # ⚠️ Duas coisas que a leitura NAO faz, e que um porte "arruma" sem querer
 *
 * 1. **Nao corrige a coluna.** Nenhum dos cinco desfechos escreve: a linha
 *    continua `inherit` (ou `publish`, ou o que nela estiver) e o valor
 *    resolvido vive so na resposta. E por isso que **CA-2.4 acontece sem
 *    escrita nenhuma no anexo** — mudar o estado do pai muda a resposta na
 *    leitura seguinte, e o teste desta tarefa afirma que nenhum comando sai pela
 *    porta de dados. Um porte que gravasse o estado resolvido no anexo
 *    acrescentaria escrita que o legado nao emite **e** congelaria a heranca na
 *    primeira leitura.
 * 2. **Nao recusa estado nao registrado.** `publish` so entra como presuncao; o
 *    estado proprio (`private`, `trash`, `auto-draft`) e devolvido como esta, e
 *    o estado herdado do pai pode ser qualquer cadeia que esteja na coluna do
 *    pai — `register_post_status()` e ponto de extensao publico (P2) e a coluna
 *    e `varchar(20)` sem `ENUM` (`DB-ENUM`). Quem fechar o retorno numa uniao de
 *    nomes deixa de representar estado de terceiro, que o legado representa.
 *
 * ---
 *
 * # De onde vem cada nome de estado deste arquivo
 *
 * `inherit`, os quatro aceitos e o `0` do vinculo ausente vem do vocabulario
 * desta feature (`../armazenamento/anexo.ts`, T002). **`trash` vem de
 * `plataforma/autorizacao/`**, e isso nao e import de contexto: a regra de
 * dependencia 1 permite `contextos/` para `plataforma/`, e e la que
 * `ESTADO_DE_LIXEIRA` ja esta declarado — pela mesma leitura e com a mesma
 * companhia, porque `map_meta_cap()` tambem consulta o marcador
 * `_wp_trash_meta_status` quando o estado e `trash` (UC-10, passo 2). Uma quarta
 * copia da cadeia `'trash'` nesta arvore permitiria mudar uma sem a outra.
 *
 * ---
 *
 * # A contagem de leituras do pai, que e observavel
 *
 * O `Contexto` de `PT-014` fixa *"o cache de objeto desligado nas duas
 * metades"*, logo cada `get_post()` do legado e uma consulta e a **sequencia**
 * entra na area 3 da Decisao 2. O legado le o mesmo pai mais de uma vez, e isto
 * nao e descuido de leitura minha: esta escrito na forma do `if`.
 *
 * | caso | leituras do pai, na ordem |
 * |---|---|
 * | anexo `inherit` sem pai | **nenhuma** — `0 === $post->post_parent` curto-circuita (`:1307`) |
 * | anexo `inherit` com pai comum | `get_post` (`:1308`) · `get_post_status` (`:1313`, que le de novo) · `get_post_status` (`:1322`, que le a terceira vez) |
 * | anexo `inherit` com pai na lixeira | `get_post` (`:1308`) · `get_post_status` (`:1313`) · `get_post_meta` (`:1315`) |
 * | anexo `inherit` apontando para si | `get_post` (`:1308`) e nada mais — o terceiro termo de `:1309` so e testado depois |
 *
 * O caso do pai comum le o pai **tres** vezes porque `:1313` resolve o estado do
 * pai para compara-lo com `trash` e **descarta o resultado**, e `:1322` resolve
 * de novo. Reproduzir isso e barato; nao reproduzir e divergir em sequencia de
 * comandos e, com pai tambem anexo, em numero de disparos do ponto de extensao
 * {@link PONTO_DE_EXTENSAO_DO_ESTADO}.
 *
 * ---
 *
 * # 🔴 O que esta tarefa encontrou, e NAO resolveu
 *
 * ## CA-2.3 diz "declarada no registro", e o legado presume `publish`
 *
 * Nao e conflito entre duas afirmacoes opostas: e a spec dizendo **menos** do
 * que a arvore, que e o caso que o P1 resolve a favor da arvore. Fica registrado
 * porque e onde um porte guiado so pela spec perde paridade.
 *
 * - **CA-2.3, literal:** *"anexo sem conteudo de destino passa a ter
 *   visibilidade propria, declarada no registro"*. O fluxo alternativo *Arquivo
 *   sem conteudo de destino* de **UC-12** repete: *"sua visibilidade deixa de
 *   ser herdada e passa a ser a do proprio registro"*.
 * - **A arvore presume.** O registro de um anexo solto recem-criado diz
 *   `inherit`, e `inherit` nao e visibilidade: `:1311`-`:1312` e literal —
 *   *"Unattached attachments with inherit status are assumed to be published"*,
 *   `$post_status = 'publish'`. O que vem **do registro** nesse caso e so a
 *   decisao de nao herdar; o valor e presumido.
 *
 * A metade de CA-2.3 que o registro de fato declara e a dos tres estados
 * proprios: `private`, `trash` e `auto-draft` atravessam a resolucao intactos,
 * com ou sem pai. Esta tarefa **implementa a arvore** (P1) e nao reescreve o
 * criterio; a frase fica aqui e em `../README.md` para quem a revisar.
 */

import { ESTADO_DE_LIXEIRA } from '../../../plataforma/autorizacao/index.js';
import { texto } from '../../../plataforma/serializacao/index.js';
import {
  ESTADO_HERDADO,
  SEM_CONTEUDO_DE_DESTINO,
  TIPO_DE_ANEXO,
  verdadeiroComoNoPhp,
} from '../armazenamento/index.js';
import type {
  ContextoDeVisibilidade,
  RegistroNaVisibilidade,
} from './contexto-de-visibilidade.js';

/**
 * `publish` — o estado que a resolucao **presume** nos dois pontos em que nao ha
 * de onde herdar (`:1312` e `:1335`), mais o terceiro que repete o segundo
 * (`:1319`).
 *
 * ⚠️ **Nao contradiz `P2`, e e importante nao confundir os dois lados.** `P2`
 * proibe `publish` na **gravacao** do anexo, e nenhum caminho o grava: o pedido
 * do legado nao traz `post_status` e `wp_insert_post()` reescreve o que vier
 * (`:4705`). Aqui ele e **resposta de leitura**, e nunca vai para coluna
 * nenhuma. A assimetria e do produto: a linha continua `inherit` no banco e
 * responde `publish` a quem pergunta.
 *
 * E e o mesmo valor que o DDL poe como default da coluna
 * (`wp-admin/includes/schema.php:167`), o que fecha o circulo da anomalia que
 * `../armazenamento/chaves-e-tabelas.ts` registra: um anexo inserido direto na
 * tabela nasce `publish` e **tambem** responde `publish`, agora pelo ramo de
 * `:1335`.
 */
export const ESTADO_PRESUMIDO_DO_ANEXO = 'publish';

/**
 * Os **tres** estados que o anexo tem por conta propria, na ordem em que o
 * legado os lista (`:1326`).
 *
 * E a lista de `ESTADOS_DE_ANEXO_ACEITOS` **menos `inherit`**, e a razao esta no
 * comentario do proprio legado: *"Note: 'inherit' is excluded from this check as
 * it is resolved to the parent post's status in the logic block above"*
 * (`:1332`-`:1333`). Esta transcrita como lista de tres, e nao derivada da de
 * quatro, porque e assim que o legado a escreve — e o teste desta tarefa afirma
 * a relacao entre as duas, que e a invariante que o comentario declara.
 *
 * A comparacao do legado e estrita (`in_array( ..., true )`): nenhuma coercao de
 * tipo entra aqui.
 */
export const ESTADOS_PROPRIOS_DO_ANEXO: readonly string[] = Object.freeze([
  'private',
  'trash',
  'auto-draft',
]);

/**
 * `get_post_status` — o ponto de extensao que fecha a funcao (`:1338`-`:1347`).
 *
 * ```php
 * return apply_filters( 'get_post_status', $post_status, $post );
 * ```
 *
 * **Declarado e nao disparado**, pela razao que esta feature ja registrou em
 * `../envio/enviar-arquivo.ts` para os cinco pontos do caminho de envio: o
 * barramento que os dispara e `REQ-162`, que esta em `do-not-rewrite.md` —
 * escopo **recusado**, nao trabalho pendente. O P2 da constituicao cobra que o
 * ponto exista com *"o nome, os argumentos, a ordem de disparo e a capacidade de
 * alterar o resultado"*, e e isso que esta linha registra, no arquivo que o
 * emitiria.
 *
 * Tres coisas que quem ligar o barramento precisa saber deste ponto:
 *
 * 1. **a posicao e o fim da funcao**, depois dos cinco desfechos: um
 *    interceptador ve o estado **resolvido**, nao o da coluna;
 * 2. **ele altera o resultado** — e o retorno direto do `apply_filters()`;
 * 3. **ele dispara uma vez por chamada, inclusive nas recursivas** (`:1313`,
 *    `:1322`). Um anexo pendurado em outro anexo dispara o ponto quatro vezes, e
 *    `@since 5.7.0` da anotacao registra que foi uma mudanca deliberada passar o
 *    tipo `attachment` por ele.
 */
export const PONTO_DE_EXTENSAO_DO_ESTADO = 'get_post_status';

/**
 * **A regra de US-2**: a visibilidade com que o anexo e visto.
 *
 * E `get_post_status()` (`wp-includes/post.php:1290`), passo a passo, com as
 * ancoras em cada ramo. Aceita o identificador ou o registro ja lido, como o
 * legado aceita `int|WP_Post`.
 *
 * **Permissao exigida: nenhuma, e isso e declaracao e nao omissao** (P4). A
 * funcao do legado nao pergunta capacidade alguma, e nao poderia: e ela que
 * **alimenta** a decisao de capacidade — `map_meta_cap()` resolve `read_post`
 * com `get_post_status_object( get_post_status( $post ) )`
 * (`wp-includes/capabilities.php:350`), e `is_post_publicly_viewable()` decide o
 * acesso do visitante com o mesmo valor (`wp-includes/post.php:2550`). Exigir
 * capacidade aqui inverteria a ordem das duas e tornaria a traducao de
 * `read_post` impossivel de resolver.
 *
 * Devolve `null` onde o legado devolve `false` — identificador que nao existe
 * (`:1296`-`:1298`) — e a mesma convencao vale para o valor **herdado**: se o
 * pai desaparecer entre a leitura de `:1308` e a recursao de `:1322`, o legado
 * atribui `false` ao estado e o devolve. E alcancavel com o cache desligado, e
 * esta reproduzido.
 */
export function visibilidadeDoAnexo(
  contexto: ContextoDeVisibilidade,
  conteudo: number | RegistroNaVisibilidade,
): string | null {
  /*
    `:1291`-`:1294` — a normalizacao. O legado a salta quando o objeto vem de
    `get_sample_permalink()` (`! isset( $post->filter ) || 'sample' !== ...`);
    aqui o registro ja normalizado chega como registro, que e a mesma coisa sem
    o campo de controle.
  */
  const registro =
    typeof conteudo === 'number'
      ? contexto.conteudo.obterConteudo(conteudo)
      : conteudo;

  // `:1296`-`:1298` — `! is_object( $post )` devolve `false`.
  if (registro === null) {
    return null;
  }

  // `:1300` — o ponto de partida e sempre a coluna, crua.
  let estado: string | null = registro.estado;

  if (registro.tipo === TIPO_DE_ANEXO && estado === ESTADO_HERDADO) {
    /*
      `:1306`-`:1310`. A ordem dos tres termos e observavel: o `0` curto-circuita
      e nenhuma leitura sai; a existencia do pai e perguntada ANTES da
      auto-referencia, logo o anexo que aponta para si mesmo ainda emite a
      leitura do pai — que e ele proprio.
    */
    if (
      registro.conteudoDeDestino === SEM_CONTEUDO_DE_DESTINO ||
      contexto.conteudo.obterConteudo(registro.conteudoDeDestino) === null ||
      registro.id === registro.conteudoDeDestino
    ) {
      // `:1311`-`:1312` — "Unattached attachments ... are assumed to be published".
      estado = ESTADO_PRESUMIDO_DO_ANEXO;
    } else if (
      visibilidadeDoAnexo(contexto, registro.conteudoDeDestino) ===
      ESTADO_DE_LIXEIRA
    ) {
      /*
        `:1313`-`:1315`. A comparacao e com o estado RESOLVIDO do pai, nao com a
        coluna dele: um pai que e anexo de um pai na lixeira tambem cai aqui. E o
        resultado desta resolucao e DESCARTADO — o ramo de `:1322` resolve de
        novo. Ver a contagem de leituras no cabecalho.
      */
      estado = contexto.conteudo.estadoAnteriorNaLixeira(
        registro.conteudoDeDestino,
      );

      /*
        `:1317`-`:1320` — `if ( ! $post_status )`. E a verdade do PHP sobre o que
        a leitura unica devolveu: `''` (chave ausente) e tambem a cadeia `'0'`
        sao falsos, e os dois caem na mesma presuncao. Ver
        `../armazenamento/verdade-de-php.ts`.
      */
      if (!verdadeiroComoNoPhp(texto(estado))) {
        // `:1318`-`:1319` — "Assume publish as above".
        estado = ESTADO_PRESUMIDO_DO_ANEXO;
      }
    } else {
      // `:1321`-`:1322` — a heranca, recursiva. E o que faz CA-2.1 e CA-2.4.
      estado = visibilidadeDoAnexo(contexto, registro.conteudoDeDestino);
    }
  } else if (
    registro.tipo === TIPO_DE_ANEXO &&
    !ESTADOS_PROPRIOS_DO_ANEXO.includes(estado)
  ) {
    /*
      `:1324`-`:1336`. O ramo que espelha a gravacao: "This is to match the logic
      in wp_insert_post()". E a metade de CA-2.2 que cabe nesta feature — a
      leitura nunca relata, para um anexo, estado que a gravacao nao deixaria
      passar.
    */
    estado = ESTADO_PRESUMIDO_DO_ANEXO;
  }

  /*
    `:1338`-`:1347` — aqui o legado dispara `get_post_status` com o estado
    resolvido e o registro. Ver `PONTO_DE_EXTENSAO_DO_ESTADO`: o ponto esta
    declarado e nao disparado, porque o barramento e `REQ-162`, recusado em
    `do-not-rewrite.md`.
  */
  return estado;
}
