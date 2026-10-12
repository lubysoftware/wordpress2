/**
 * `plataforma/sanitizacao/` — a analise e a sanitizacao de marcacao, carregadas
 * vazias.
 *
 * Entrega de **T002** da feature `015-plataforma-transversal`: *"registro de
 * operacao, traducao, sanitizacao e camada de dados carregam como modulos
 * proprios, com as portas declaradas e nenhuma regra implementada"*.
 * `satisfaz: — (infraestrutura)`. **Nenhum criterio de aceite esta satisfeito
 * aqui**: US-5 e **T011**, e os cinco testes do catalogo (UT-167-1 a UT-167-5)
 * sao **T012**. Leitura obrigatoria de quem pegar T011: `./README.md`.
 *
 * ---
 *
 * ## ⚠️ Sao DUAS coisas nesta pasta, e um projeto novo as confunde
 *
 * O slot `analise-de-html` do `plan.md` ja avisa: *"as duas fazem trabalhos
 * diferentes que um projeto novo confundiria"*.
 *
 * | metade | o que e | arquivo daqui | tamanho no legado |
 * |---|---|---|---|
 * | **analise** | tokenizador que persegue a especificacao do HTML5 e **edita a string no lugar** | `./condicao-de-erro-de-analise.ts` | 16.590 linhas em 14 arquivos de `wp-includes/html-api/` |
 * | **sanitizacao** | lista de permissao que decide **o que cada papel pode publicar** | `./lista-de-permissao.ts` | 3.159 linhas de `wp-includes/kses.php` |
 *
 * A primeira e uma das **duas raizes** do grafo de dependencia de todo o sistema
 * (`architecture-graph.json`, citado no slot); a segunda e **fronteira de
 * autorizacao**. Fundi-las produz um sanitizador que reescreve `post_content` ou
 * uma lista de permissao que muda de significado por papel — os dois sao
 * comportamento observavel.
 *
 * ---
 *
 * ## Por que este modulo nao tem porta nenhuma
 *
 * Porque nenhuma das cinco bordas de AD-08 aparece aqui: analisar marcacao e
 * filtrar marcacao nao tocam banco, HTTP, disco, cache de objeto nem e-mail.
 * Entra texto, sai texto. E a razao de o desenho poder listar *"parser de HTML"*
 * e *"saneamento"* entre os **6 modulos puros, sem regra de negocio** de
 * `utilitarios/` — ver `./README.md` sobre a pasta escolhida.
 *
 * ⚠️ **CA-5.4 pede registro, e o registro NAO entra como porta deste modulo.** O
 * criterio: *"uma condicao de erro e registrada, com conteudo e posicao, para que
 * o volume seja mensuravel"*, e `tasks.md` poe T011 dependendo de T003. O canal
 * e `plataforma/registro-de-operacao/`, e ele chega a T011 **por argumento**, na
 * chamada — do mesmo jeito que `ClassificacaoNaPublicacao` chega a
 * `contextos/conteudo/publicacao/`. Guardar o canal como campo deste modulo
 * faria a analise depender de observabilidade, e o P7 proibe o inverso disso:
 * *"nenhuma decisao do sistema pode passar a depender"* do registro.
 *
 * Duas coisas que este arquivo faz de proposito, como os esqueletos anteriores:
 * nao guarda estado de modulo (`EXT-CONTEXTO`, BR-MIGRAR-105 — e aqui e facil:
 * nao ha nada a guardar) e nao resolve nada no carregamento (`EXT-ORDEM`,
 * BR-MIGRAR-106). `./modulo.test.ts` afirma as duas.
 */

export {
  type CodigoDeCondicao,
  type CondicaoDeErroDeAnalise,
  type PosicaoNaMarcacao,
  type ResultadoDeAnalise,
} from './condicao-de-erro-de-analise.js';

export {
  type AtributosAdmitidos,
  type ContextoDeSanitizacao,
  type ListaDePermissao,
} from './lista-de-permissao.js';

/**
 * O modulo carregado.
 *
 * Nenhuma porta e nenhuma operacao. A tabela abaixo e a pauta de T011, com o que
 * cada criterio de US-5 exige:
 *
 * | criterio | o que ele exige | onde isso esta no legado |
 * |---|---|---|
 * | CA-5.1 | a analise devolve, **junto do resultado**, a lista de condicoes com posicao | nao devolve: 29 marcadores `@todo Indicate a parse error once it's possible` em `wp-includes/html-api/class-wp-html-processor.php`, um deles em `:2018` |
 * | CA-5.2 | a tela de edicao mostra as condicoes ao autor | nao existe. E tela: contrato de SCR-*, que entra como dado, nao como HTML montado aqui |
 * | CA-5.3 | o conteudo com erro **continua sendo servido, sem ser reescrito** | e o que o legado ja faz, e e por isso que o tokenizador **nao** pode virar analisador de arvore (slot `analise-de-html`) |
 * | CA-5.4 | a condicao e registrada, com conteudo e posicao | depende de T003, e o canal chega por argumento — ver o aviso acima |
 *
 * E o que **nao** muda: a lista de permissao de fabrica, o privilegio de
 * `unfiltered_html` e a constante que o revoga (`DISALLOW_UNFILTERED_HTML`,
 * `wp-includes/capabilities.php:597`). US-5 acrescenta relato; nao mexe no que e
 * publicavel.
 */
export interface ModuloDeSanitizacao {
  readonly nome: 'sanitizacao';
}

/**
 * Compoe o modulo.
 *
 * Sem argumento, porque sem porta — e isso e declaracao, nao esquecimento:
 * AD-08 tem cinco bordas e nenhuma delas e esta.
 */
export function criarModuloDeSanitizacao(): ModuloDeSanitizacao {
  return { nome: 'sanitizacao' };
}
