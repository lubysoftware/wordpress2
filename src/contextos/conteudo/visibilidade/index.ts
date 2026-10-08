/**
 * `visibilidade/` — o conteudo privado, visivel so a quem tem a permissao
 * declarada.
 *
 * Entrega de **T009** da feature `002-autoria-e-publicacao` (US-4). O caso de
 * uso e [UC-03](../../../../.specify/use-cases/UC-03-publicar-conteudo.md),
 * fluxo alternativo *"Publicar como privado"*, somado a
 * [UC-01](../../../../.specify/use-cases/UC-01-consultar-conteudo-publicado.md),
 * fluxo alternativo *"Conteudo privado"* — os dois que a tabela de
 * rastreabilidade de `spec.md` liga a US-4.
 *
 * | arquivo | o que e |
 * |---|---|
 * | `contexto-de-visibilidade.ts` | o contexto, e as duas ausencias (porta de dados e relogio) com motivo |
 * | `visibilidade-do-conteudo.ts` | **CA-4.1**: o `switch` de visibilidade, os tres ramos e os dois efeitos colaterais |
 * | `permissao-de-conteudo-privado.ts` | **CA-4.1**: a capacidade, que e a de publicar, e o rebaixamento proprio do painel |
 * | `leitura-de-conteudo-privado.ts` | **CA-4.2** e **CA-4.3**: o portao de duas alturas, e a resposta indistinguivel |
 * | `presenca-em-consulta-publica.ts` | **CA-4.4**: listagem e feed por registro de estados, sitemap por literal |
 * | `escolher-visibilidade.ts` | a operacao de US-4, e a razao de ela nao gravar |
 * | `us-4-conteudo-privado.test.ts` | os quatro criterios, por efeito no banco e por decisao |
 *
 * ---
 *
 * # O achado desta pasta, em uma frase
 *
 * **`private` nao e um atributo de `publish`: e um valor da mesma coluna, e os
 * tres criterios de leitura saem das propriedades com que o legado o registra.**
 * A propriedade `privado` e o que faz a leitura exigir `read_private_posts`; a
 * ausencia de `publico` e o que o tira da consulta publica. Um porte que
 * gravasse `publish` com uma marca ao lado passaria no primeiro criterio e
 * falharia nos tres outros **sem erro nenhum**.
 *
 * ---
 *
 * # As tres superficies de CA-4.4 sao DOIS mecanismos
 *
 * Listagem e feed sao a mesma consulta e **mostram** o privado a quem tem a
 * capacidade; o sitemap pede `publish` por nome e nao o mostra a ninguem, nem ao
 * super administrador. A analise esta em `presenca-em-consulta-publica.ts`, e e
 * a distincao que decide se o mapa do site entrega endereco privado a buscador.
 *
 * ---
 *
 * # Como se confere que esta pasta tem paridade
 *
 * O criterio desta feature e **efeito no banco** (area 3 da Decisao 2), e para
 * CA-4.2, CA-4.3 e CA-4.4 vale tambem a area 1 — *saida byte a byte* — porque
 * feed, sitemap e API REST sao contrato de terceiro: e `PT-011`
 * (`parity_tests/11-contratos-de-leitura-de-terceiro.feature`), cujo cenario
 * `@concorrencia` cobra exatamente a invariante de US-4, *"a resposta anonima
 * nao contem nada que so a autenticada veria"*.
 *
 * ⚠️ **`PT-002` nao tem cenario de conteudo privado**, e nenhuma das 20 specs de
 * paridade deste pacote menciona `private`: uma busca por `privad` e por
 * `private` em `.specify/migration/parity_tests/` devolve zero ocorrencias. A
 * lacuna esta declarada aqui e **nao** foi preenchida por conta propria —
 * escrever cenario de paridade nao e tarefa de T009, e `parity_specs.md` e
 * artefato do Inspector. O que esta pasta faz, e o que o README deste modulo
 * manda fazer, e citar **arquivo e linha** do legado em cada afirmacao, de modo
 * que a comparacao caso a caso contra o oraculo da resposta 16 possa rodar por
 * elas quando o oraculo existir (T001 da feature 015).
 *
 * ---
 *
 * # O que esta pasta nao tem, e de quem e
 *
 * | o que | de quem |
 * |---|---|
 * | o `UPDATE` que leva `private` a coluna | **T005** (US-2) em diante: e `wp_insert_post()`, e e um comando de 21 colunas |
 * | o rebaixamento do painel para quem nao pode publicar | **T005** e **T015**: e `_wp_translate_postdata()`, declarado em `permissao-de-conteudo-privado.ts` |
 * | a clausula SQL da consulta publica, o 404 e o modelo de erro do tema | feature **004**, `contextos/leitura-publica/` — a regra de dependencia 3 proibe aquele contexto importar este |
 * | o portao dos estados **protegidos** (rascunho, pendente, agendado) e o modo de pre-visualizacao | feature **004**, US-4 CA-4.2 de lá |
 * | a senha de conteudo, que o ramo privado apaga | feature **004**, US-6 — REQ-044 esta em `do-not-rewrite.md` |
 * | a fixacao no topo, que o ramo privado retira | BC-07: e a opcao `sticky_posts` |
 * | o mapa do site e o feed como saida | BC-08, feature **013** — aqui ha so a regra de quais estados entram |
 * | a comparacao de data que produz o agendado, e que **nao** alcanca `private` | **T013** (US-6), com a nota em `contexto-de-visibilidade.ts` |
 */

export {
  type ContextoDeLeituraDeConteudo,
  type ContextoDeVisibilidade,
} from './contexto-de-visibilidade.js';

export {
  ESTADO_PRIVADO,
  VISIBILIDADES,
  resolverVisibilidade,
  type CamposDaVisibilidade,
  type Visibilidade,
} from './visibilidade-do-conteudo.js';

export {
  CAPACIDADE_DE_CONTEUDO_PRIVADO,
  ESTADO_DO_REBAIXAMENTO_SEM_ESTADO_ANTERIOR,
  autorizarConteudoPrivado,
} from './permissao-de-conteudo-privado.js';

export {
  CAPACIDADE_DE_LEITURA_PEDIDA,
  SLOT_DE_LEITURA_DE_CONTEUDO_PRIVADO,
  decidirLeituraDeConteudoPrivado,
  type DesfechoDaLeituraDeConteudo,
} from './leitura-de-conteudo-privado.js';

export {
  ESTADOS_DO_MAPA_DO_SITE,
  REGISTRO_DE_FABRICA,
  estadoEntraNoMapaDoSite,
  estadosComAPropriedade,
  recorteDaConsultaPublica,
  type AtorNaConsultaPublica,
  type RecorteDaConsultaPublica,
  type RegistroDeEstados,
} from './presenca-em-consulta-publica.js';

export {
  escolherVisibilidade,
  type DesfechoDaVisibilidade,
  type PedidoDeVisibilidade,
  type ResultadoDaVisibilidade,
} from './escolher-visibilidade.js';
