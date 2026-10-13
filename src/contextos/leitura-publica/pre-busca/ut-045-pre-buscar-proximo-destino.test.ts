/**
 * A entrega de **T016**: *"3 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-045-1, UT-045-2, UT-045-3), com o mesmo dado
 * de entrada, acao e resultado esperado."*
 *
 * ✅ **O catalogo EXISTE nesta arvore, e os tres casos foram COPIADOS dele, nao
 * reconstruidos.** A tabela de `REQ-045` em `backlog/tests.md:684-692` —
 * *"`could` · `pronto` · veredito `aprovado` · 3 de 3 critérios de aceite
 * cobertos"* — da os tres casos com nome, tipo e prova, e e ela que esta
 * transcrita abaixo, em ordem de catalogo, com o nome do caso dentro do nome do
 * teste:
 *
 * | caso | tipo | nome no catalogo | prova que o catalogo cita | CA |
 * |---|---|---|---|---|
 * | `UT-045-1` | `feliz` | declara na página os destinos pré-buscáveis e a agressividade de cada um | *"A página servida declara ao navegador quais destinos podem ser pré-buscados e com que agressividade"* | CA-7.1 |
 * | `UT-045-2` | `borda` | mantém fora da declaração os endereços de administração, de saída e de ação com efeito | *"Endereços de administração, de saída de sessão e de ação com efeito ficam fora da declaração"* | CA-7.2 |
 * | `UT-045-3` | `borda` | omite a declaração por completo quando a pré-busca está desligada | *"A declaração é desligável por configuração, e desligada ela não aparece na página"* | CA-7.3 |
 *
 * ---
 *
 * # O que o catalogo NAO da, e de onde veio
 *
 * O catalogo registra nome, tipo e prova de cada caso, e **nao** o dado de
 * entrada literal — nenhum dos 985 casos o registra, porque *"nenhum deles cita
 * arquivo, classe ou framework: a stack do sistema novo ainda não foi
 * escolhida"* (`backlog/tests.md:5`). O dado de entrada daqui sai de duas
 * fontes, e de nenhuma outra:
 *
 * 1. **UC-01** (`.specify/use-cases/UC-01-consultar-conteudo-publicado.md`), que
 *    a tabela de rastreabilidade de `spec.md` liga a US-7 (*"US-7 | REQ-045 ·
 *    UC-01"*). Dele vem o fluxo alternativo inteiro desta historia — *"Pré-busca
 *    de navegação: 1. Sistema injeta regras de `speculationrules` na página;
 *    2. O navegador do visitante pré-busca o próximo destino antes do clique"*
 *    —, o ator (*"Visitante"*, que por definicao nao tem conta), a autorizacao
 *    (*"não há verificação de capacidade"*) e as duas pos-condicoes que as tres
 *    assercoes de porta afirmam: *"nada muda no armazenamento"* e *"o contador
 *    de visualizações não existe: o sistema não registra a leitura em lugar
 *    algum"*.
 * 2. **A instalacao de fabrica de site unico mais os tres arquivos de servidor
 *    do legado**, com cada ancora conferida no oraculo:
 *    `speculative-loading.php:28` (os dois casos que ligam a pre-busca), `:125`
 *    e `:131` (os dois defaults), `:207-213` (as sete exclusoes de fabrica),
 *    `:222` e `:224` (a oitava, que a forma dos enderecos escolhe), `:241-260`
 *    (o filtro, e as tres garantias que o impedem de remover as base), `:267`
 *    (os destinos incluidos), `:278`, `:284` e `:293` (os tres seletores),
 *    `:298-308` (a regra do nucleo), `:317` (a acao), `:332-334` (o retorno sem
 *    imprimir) e `:339-341` (o que vai para a borda);
 *    `class-wp-speculation-rules.php:193` (`'immediate'` proibida **so** com
 *    `where`) e `:236-244` (o mapa de `modo => regras`);
 *    `class-wp-url-pattern-prefixer.php:112-120` (os sete contextos). Os
 *    enderecos dos tres grupos de UT-045-2 saem de onde o legado os monta:
 *    `link-template.php:3589-3590` (`/wp-admin/`) e
 *    `general-template.php:652-653` (`wp-login.php?action=logout`, com nonce).
 *    E os caminhos da instalacao saem de `functions.php:2483`
 *    (`WP_CONTENT_URL . '/uploads'`) e de `default-constants.php:437`
 *    (`WP_DEFAULT_THEME`, `'twentytwentyfive'`).
 *
 * Nenhum padrao, seletor ou caminho desta suite foi inventado: cada um e o que
 * aquela linha constroi.
 *
 * ---
 *
 * # Nao e a suite de T015, e o nivel e outro
 *
 * `./us-7-pre-buscar-proximo-destino.test.ts` e a suite da **entrega** de T015:
 * ela afirma os tres criterios de aceite um por um e chama tambem as operacoes
 * intermediarias — `prefixarPadrao`, `caminhosExcluidosDaPreBusca`,
 * `configuracaoDaPreBusca`, `criarConjuntoDeRegrasDePreBusca`. O cabecalho dela
 * ja declara a fronteira: *"os tres casos `UT-045-1` a `UT-045-3` de
 * `backlog/tests.md` sao de **T016**, a tarefa `[P]`, e nenhum deles e afirmado
 * aqui"*.
 *
 * Esta e a suite do **catalogo**, e ela entra por outro lugar:
 *
 * | | T015 (`us-7-…`) | T016 (este arquivo) |
 * |---|---|---|
 * | entrada | a etapa que o criterio descreve, uma por uma, inclusive as quatro operacoes intermediarias | **so** a superficie do modulo: `declararPreBusca`, que e o passo 1 do fluxo alternativo de UC-01 — *"Sistema injeta regras de `speculationrules` na página"* |
 * | a instalacao | subdiretorio com tema filho, a forma em que o prefixo e observavel | o site **na raiz do dominio com o tema empacotado e sem tema filho**, onde `template` e `stylesheet` dao o **mesmo** padrao e `array_unique` (`:248-260`) faz as oito exclusoes sairem **sete** |
 * | o dado | um caso por criterio exercitado | a grade inteira: os **oito** pares de modo e agressividade de UT-045-1, os **cinco** mecanismos de exclusao de UT-045-2, e as **quatro** maneiras de desligar contra os **seis** valores que nao desligam, em UT-045-3 |
 * | a porta de dados | **lanca** se for tocada | **registra comando**, e a assercao e o log vazio |
 *
 * A porta que registra em vez de lancar nao e conveniencia: e o unico jeito de
 * afirmar a pos-condicao de UC-01 como **resultado**, e nao como ausencia de
 * excecao. Uma porta que lanca prova que o modulo nao escreveu; uma porta que
 * registra prova **o que** ele pediu, e aqui ele nao pede nada.
 *
 * ---
 *
 * # Onde esta suite PARA, e por que isso nao e lacuna
 *
 * - **Nada aqui casa endereco contra padrao, e nao e descuido.** Quem avalia
 *   `href_matches` e o **navegador**, pela Speculation Rules API: os padroes
 *   saem em sintaxe de `URLPattern` (*"The `*` can be used as a wildcard"*,
 *   `:230`), e `/*\\?(.+)` tem grupo de captura, que nenhum casamento de glob
 *   resolve. O criterio diz que os enderecos *"ficam fora da declaração"*, e o
 *   que o servidor declara e o **padrao**: e a presenca, o conteudo e a posicao
 *   de cada padrao que esta afirmada abaixo. Escrever aqui um casador de
 *   padrao seria inventar mecanismo que o legado nao tem — e, pior, afirmar
 *   contra ele em vez de contra o navegador.
 * - **Nada aqui monta HTML.** A codificacao em JSON e a montagem do elemento
 *   `script[type="speculationrules"]` sao da plataforma e da borda
 *   (`:337-341`); o que esta superficie entrega e o valor, o atributo e as duas
 *   bandeiras, e e isso que UT-045-1 confere. A razao esta por extenso em
 *   `./declarar-pre-busca.ts`, § *Onde este porte para*.
 * - **A posicao na pagina entra como dado, nao como ordem executada.**
 *   `default-filters.php:367` pendura a declaracao em `wp_footer`, e
 *   `plataforma/barramento/` nao existe nesta arvore. O gancho e a prioridade
 *   estao declarados em `./declarar-pre-busca.ts` porque a ordem de disparo e
 *   contrato publico (P2), e T015 os afirma; repeti-los aqui nao e o caso do
 *   catalogo.
 * - **Nenhum destes tres casos pergunta permissao.** UC-01 e literal: *"não há
 *   verificação de capacidade"*. ⚠️ E `is_user_logged_in()` (`:28`) **nao** e
 *   uma: e a pergunta "ha alguem autenticado", que o legado usa para
 *   **desligar** a pre-busca, nunca para conceder acesso — e por isso ela
 *   aparece em UT-045-3, entre as maneiras de desligar, e nao como autorizacao.
 *
 * 🔴 **A pergunta aberta da `spec.md` sobre esta historia continua aberta, e
 * nada aqui a resolve.** Ela diz que *"metade do comportamento do módulo
 * correspondente do legado está no lado cliente, ausente desta árvore (lacuna
 * L4 de `soul.md`)"* e que *"até isso acontecer, os critérios de borda desta
 * história não são verificáveis contra o legado"*. Os dois casos de borda do
 * catalogo sao **UT-045-2** e **UT-045-3**, e e honesto dizer exatamente o que
 * eles afirmam: a **declaracao emitida pelo servidor**, que e o passo 1 do
 * fluxo alternativo de UC-01. O passo 2 — *"O navegador do visitante pré-busca
 * o próximo destino antes do clique"* — e do navegador, e o proprio legado o
 * trata como degradacao graciosa (*"For browsers that do not support
 * speculation rules yet, the `script[type="speculationrules"]` tag will be
 * ignored"*, `:325`). Resolver a pergunta nao e do agente de codificacao, e
 * `parity_specs.md` nao tem cenario de paridade para esta historia: nenhum dos
 * 20 arquivos de `parity_tests/` cita a pre-busca.
 *
 * ⚠️ **Nada externo entra nestes testes.** A instalacao, quem esta autenticado,
 * as constantes e as variaveis de ambiente sao duplos que **registram** o que
 * lhes foi perguntado, e a porta de dados registra comando; nao ha banco, rede,
 * relogio nem navegador.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AGRESSIVIDADES_DA_PRE_BUSCA,
  AGRESSIVIDADE_DE_FABRICA,
  AGRESSIVIDADE_PROIBIDA_NO_DOCUMENTO,
  BANDEIRAS_DA_CODIFICACAO,
  CONFIGURACAO_DE_FABRICA,
  criarModuloDeLeituraPublica,
  EXCLUSAO_DE_CONSULTA_SEM_ENDERECO_AMIGAVEL,
  MODOS_DA_PRE_BUSCA,
  MODO_DE_FABRICA,
  PADRAO_DO_PROPRIO_SITE,
  SELETOR_SEM_SEGUIR,
  TIPO_DO_ELEMENTO_DE_SAIDA,
  type CaminhosDaInstalacao,
  type CondicaoDeRegra,
  type ConfiguracaoDoSiteNaConsulta,
  type ContextoDaPreBusca,
  type DeclaracaoDaPreBusca,
  type ModuloDeLeituraPublica,
  type OpcoesDaPreBusca,
  type PortasDeLeituraPublica,
  type RegraDePreBusca,
} from '../index.js';

// ---------------------------------------------------------------------------
// Os duplos: todos registram o que lhes foi pedido
// ---------------------------------------------------------------------------

/**
 * A porta de dados que **registra** em vez de simular banco.
 *
 * Nenhum dos tres casos a usa, e e esse o ponto: o log vazio e a pos-condicao
 * de UC-01 — *"nada muda no armazenamento"* e *"o contador de visualizações não
 * existe"* — afirmada como resultado.
 */
function portaQueRegistra(comandos: string[]): PortasDeLeituraPublica {
  return {
    dados: {
      prefixoDeTabela: 'wp_',
      selecionar(consulta) {
        comandos.push(`porta.selecionar ${consulta.texto}`);
        return [];
      },
      escrever(consulta) {
        comandos.push(`porta.escrever ${consulta.texto}`);
        return { linhasAfetadas: 0, idGerado: null };
      },
    },
  };
}

/** O modulo composto, que e a unica entrada desta suite. */
function moduloComPorta(comandos: string[]): ModuloDeLeituraPublica {
  return criarModuloDeLeituraPublica(portaQueRegistra(comandos));
}

// ---------------------------------------------------------------------------
// O dado de entrada: uma instalacao de site unico na raiz do dominio
// ---------------------------------------------------------------------------

/**
 * O tema empacotado de fabrica — `WP_DEFAULT_THEME`
 * (`wp-includes/default-constants.php:437`), reduzido ao caminho como
 * `wp_parse_url( ..., PHP_URL_PATH )` o reduz.
 */
const TEMA_EMPACOTADO = '/wp-content/themes/twentytwentyfive';

/**
 * Os sete caminhos de `get_default_contexts()`
 * (`class-wp-url-pattern-prefixer.php:112-120`) numa instalacao de site unico
 * na raiz do dominio, **sem tema filho**.
 *
 * ⚠️ `template` e `stylesheet` recebem o **mesmo** caminho, e nao e erro de
 * transcricao: sem tema filho `get_stylesheet_directory_uri()` e
 * `get_template_directory_uri()` devolvem o mesmo endereco, e e por isso que a
 * troca das duas chaves no legado (`:118-119`) e invisivel aqui. O efeito
 * observavel e outro, e e de UT-045-2: os dois produzem o mesmo padrao e
 * `array_unique` (`speculative-loading.php:248-260`) guarda um so.
 */
const NA_RAIZ: CaminhosDaInstalacao = Object.freeze({
  // `home_url( '/' )` e `site_url( '/' )`: o caminho e a propria raiz.
  home: '/',
  site: '/',
  // `wp_upload_dir( null, false )['baseurl']` — `WP_CONTENT_URL . '/uploads'`
  // (`functions.php:2483`).
  uploads: '/wp-content/uploads',
  content: '/wp-content',
  plugins: '/wp-content/plugins',
  template: TEMA_EMPACOTADO,
  stylesheet: TEMA_EMPACOTADO,
});

/**
 * As opcoes do site com enderecos amigaveis ligados — isto e, **fora** do valor
 * de fabrica.
 *
 * 🔴 E preciso dizer isto em voz alta, porque e o achado de T015: numa
 * instalacao nova de site unico `permalink_structure` nasce em **texto vazio**
 * (`wp-admin/includes/schema.php:443`), e com ele a pre-busca nasce desligada.
 * UT-045-1 e UT-045-2 descrevem *"a página servida"* com a declaracao presente,
 * logo o dado de entrada dos dois e um site onde alguem ligou os enderecos
 * amigaveis. O valor de fabrica e o primeiro caso de UT-045-3.
 */
const COM_ENDERECO_AMIGAVEL: ConfiguracaoDoSiteNaConsulta = Object.freeze({
  ...CONFIGURACAO_DE_FABRICA,
  formaDosEnderecos: '/%year%/%monthnum%/%day%/%postname%/',
});

/** O visitante de UC-01: ninguem autenticado, num site com endereco amigavel. */
const VISITANTE: ContextoDaPreBusca = Object.freeze({
  alguemAutenticado: false,
  configuracaoDoSite: COM_ENDERECO_AMIGAVEL,
  caminhosDaInstalacao: NA_RAIZ,
});

/** O mesmo visitante na instalacao de fabrica, com os cinco valores do schema. */
const NA_FABRICA: ContextoDaPreBusca = Object.freeze({
  alguemAutenticado: false,
  configuracaoDoSite: CONFIGURACAO_DE_FABRICA,
  caminhosDaInstalacao: NA_RAIZ,
});

/**
 * Os caminhos excluidos que `VISITANTE` produz, na ordem de `:207-222`.
 *
 * ⚠️ **Sao sete, e o legado monta oito.** `template` e `stylesheet` dao o mesmo
 * padrao num tema sem filho, e `array_unique` (`:248-260`) preserva a primeira
 * ocorrencia. Esperar oito aqui seria esperar o que o legado nao emite.
 */
const EXCLUSOES_NA_RAIZ: readonly string[] = Object.freeze([
  '/wp-*.php',
  '/wp-admin/*',
  '/wp-content/uploads/*',
  '/wp-content/*',
  '/wp-content/plugins/*',
  `${TEMA_EMPACOTADO}/*`,
  '/*\\?(.+)',
]);

// ---------------------------------------------------------------------------
// A leitura da declaracao, que e tudo que o servidor emite
// ---------------------------------------------------------------------------

/** A unica regra da declaracao sob o modo informado. */
function regraUnicaDe(
  declaracao: DeclaracaoDaPreBusca,
  modo: string,
  onde = modo,
): RegraDePreBusca {
  const doModo = declaracao.conteudo?.[modo];
  assert.ok(doModo !== undefined, `nenhuma regra sob o modo ${modo}: ${onde}`);
  assert.equal(doModo.length, 1, onde);
  const regra = doModo[0];
  assert.ok(regra !== undefined, onde);
  return regra;
}

/** As condicoes da regra, que o legado combina por `and` (`:304-306`). */
function condicoesDa(
  regra: RegraDePreBusca,
  onde = 'a regra',
): readonly CondicaoDeRegra[] {
  const where = regra.where;
  assert.ok(where !== undefined && 'and' in where, `${onde}: sem 'where.and'`);
  return where.and;
}

/** A condicao de dentro de uma negacao — `array( 'not' => ... )`. */
function negacaoDe(
  condicao: CondicaoDeRegra | undefined,
  onde = 'a condicao',
): CondicaoDeRegra {
  assert.ok(
    condicao !== undefined && 'not' in condicao,
    `${onde}: nao e uma negacao`,
  );
  return condicao.not;
}

/** Os enderecos de um `href_matches`, que e texto ou lista de texto. */
function enderecosDe(
  condicao: CondicaoDeRegra | undefined,
  onde = 'a condicao',
): readonly string[] {
  assert.ok(
    condicao !== undefined && 'href_matches' in condicao,
    `${onde}: nao casa endereco`,
  );
  const casa = condicao.href_matches;
  return typeof casa === 'string' ? [casa] : casa;
}

/** Os destinos que a regra **inclui** — a primeira condicao (`:266-268`). */
function destinosDe(regra: RegraDePreBusca, onde = 'a regra'): readonly string[] {
  return enderecosDe(condicoesDa(regra, onde)[0], `${onde}: os destinos`);
}

/** Os caminhos que a regra **exclui** — a segunda condicao (`:270-274`). */
function excluidosDe(regra: RegraDePreBusca, onde = 'a regra'): readonly string[] {
  return enderecosDe(
    negacaoDe(condicoesDa(regra, onde)[1], `${onde}: a exclusao`),
    `${onde}: a exclusao`,
  );
}

/** Os seletores que a regra exclui por marcacao (`:276-296`), na ordem. */
function seletoresDe(regra: RegraDePreBusca, onde = 'a regra'): readonly string[] {
  const seletores: string[] = [];
  for (const condicao of condicoesDa(regra, onde)) {
    if (!('not' in condicao)) {
      continue;
    }
    const negada = condicao.not;
    if ('selector_matches' in negada) {
      seletores.push(negada.selector_matches);
    }
  }
  return seletores;
}

// ---------------------------------------------------------------------------
// UT-045-1 · `feliz`
// ---------------------------------------------------------------------------

test('UT-045-1 declara na pagina os destinos pre-buscaveis e a agressividade de cada um', () => {
  const comandos: string[] = [];
  const modulo = moduloComPorta(comandos);

  // 1. A pagina servida declara. E a declaracao e o passo 1 do fluxo
  //    alternativo de UC-01 — *"Sistema injeta regras de `speculationrules` na
  //    página"* —, com o que a borda precisa para emiti-la (`:337-341`).
  const declaracao = modulo.declararPreBusca({ contexto: VISITANTE });
  assert.equal(declaracao.emitida, true);
  assert.deepEqual(declaracao.atributos, { type: TIPO_DO_ELEMENTO_DE_SAIDA });
  assert.equal(TIPO_DO_ELEMENTO_DE_SAIDA, 'speculationrules');
  assert.deepEqual(declaracao.bandeirasDaCodificacao, BANDEIRAS_DA_CODIFICACAO);
  assert.deepEqual(declaracao.recusas, []);

  // 2. **Quais destinos**: tudo dentro do mesmo site (`:267`), menos os
  //    caminhos excluidos (`:272`) — e e `source: 'document'` (`:302`), isto e
  //    a declaracao e sobre os links da pagina, nao sobre uma lista fechada de
  //    enderecos.
  const daFabrica = regraUnicaDe(declaracao, MODO_DE_FABRICA);
  assert.equal(daFabrica.source, 'document');
  assert.deepEqual(destinosDe(daFabrica), [PADRAO_DO_PROPRIO_SITE]);
  assert.equal(PADRAO_DO_PROPRIO_SITE, '/*');
  assert.deepEqual(excluidosDe(daFabrica), EXCLUSOES_NA_RAIZ);

  // 3. **E com que agressividade**: o campo `eagerness` (`:306`). O modo e a
  //    CHAVE do mapa (`class-wp-speculation-rules.php:236-244`), e os dois
  //    valores de fabrica sao os mais conservadores possiveis (`:125` e `:131`).
  assert.deepEqual(Object.keys(declaracao.conteudo ?? {}), [MODO_DE_FABRICA]);
  assert.equal(MODO_DE_FABRICA, 'prefetch');
  assert.equal(daFabrica.eagerness, AGRESSIVIDADE_DE_FABRICA);
  assert.equal(AGRESSIVIDADE_DE_FABRICA, 'conservative');

  // 4. A grade inteira: os dois modos por as quatro agressividades. Cada par
  //    declarado chega a declaracao, e os destinos nao mudam com ele.
  for (const modo of MODOS_DA_PRE_BUSCA) {
    for (const agressividade of AGRESSIVIDADES_DA_PRE_BUSCA) {
      const onde = `${modo}/${agressividade}`;
      const forcada = modulo.declararPreBusca({
        contexto: VISITANTE,
        pontosDeExtensao: {
          sobreAConfiguracao: [
            () => ({ mode: modo, eagerness: agressividade }),
          ],
        },
      });

      assert.deepEqual(Object.keys(forcada.conteudo ?? {}), [modo], onde);
      const regra = regraUnicaDe(forcada, modo, onde);
      assert.deepEqual(destinosDe(regra, onde), [PADRAO_DO_PROPRIO_SITE], onde);
      assert.deepEqual(excluidosDe(regra, onde), EXCLUSOES_NA_RAIZ, onde);

      // ⚠️ `'immediate'` e agressividade **valida** e o nucleo a recusa em
      // regra de documento (`:91` e `:135`, com a mesma frase nas duas: *"for
      // safety WordPress does not allow it for document-level rules"*). Quem a
      // pede pela configuracao recebe o default, nao um erro e nao a ausencia
      // da declaracao.
      assert.equal(
        regra.eagerness,
        agressividade === AGRESSIVIDADE_PROIBIDA_NO_DOCUMENTO
          ? AGRESSIVIDADE_DE_FABRICA
          : agressividade,
        onde,
      );
    }
  }

  // 5. *"a agressividade de **cada um**"*: duas regras, em dois modos, cada uma
  //    com os destinos dela e a agressividade dela. A segunda entra pela acao
  //    `wp_load_speculation_rules` (`:317`), que e como o legado declara que se
  //    acrescenta regra.
  const comDuas = modulo.declararPreBusca({
    contexto: VISITANTE,
    pontosDeExtensao: {
      aoCarregarAsRegras: [
        (regras) => {
          // A regra do nucleo ja esta dentro quando a acao dispara.
          assert.equal(regras.temRegra('prefetch', 'main'), true);
          assert.equal(
            regras.adicionarRegra('prerender', 'em-destaque', {
              source: 'list',
              urls: ['/em-destaque/', '/mais-lidos/'],
              eagerness: AGRESSIVIDADE_PROIBIDA_NO_DOCUMENTO,
            }),
            true,
          );
        },
      ],
    },
  });

  assert.deepEqual(Object.keys(comDuas.conteudo ?? {}), ['prefetch', 'prerender']);
  assert.deepEqual(comDuas.recusas, []);

  // A do nucleo continua com os destinos e a agressividade dela.
  const doNucleo = regraUnicaDe(comDuas, 'prefetch');
  assert.deepEqual(destinosDe(doNucleo), [PADRAO_DO_PROPRIO_SITE]);
  assert.equal(doNucleo.eagerness, AGRESSIVIDADE_DE_FABRICA);

  // E a de terceiro traz as DELA: outra fonte, outros destinos, outra
  // agressividade. ⚠️ `'immediate'` entra aqui porque a proibicao de
  // `class-wp-speculation-rules.php:193` e `isset( $rule['where'] ) &&
  // 'immediate' === $rule['eagerness']`: numa regra de lista, sem `where`, ela
  // e aceita.
  const deTerceiro = regraUnicaDe(comDuas, 'prerender');
  assert.equal(deTerceiro.source, 'list');
  assert.deepEqual(deTerceiro.urls, ['/em-destaque/', '/mais-lidos/']);
  assert.equal(deTerceiro.eagerness, 'immediate');
  assert.equal(deTerceiro.where, undefined);

  // A porta de dados nao recebeu comando nenhum: a declaracao nao consulta e
  // nao grava (UC-01, *"nada muda no armazenamento"*).
  assert.deepEqual(comandos, []);
});

// ---------------------------------------------------------------------------
// UT-045-2 · `borda`
// ---------------------------------------------------------------------------

/**
 * Um dos tres grupos que o criterio nomeia, com o mecanismo pelo qual o legado
 * o tira da declaracao.
 *
 * ⚠️ **Sao tres grupos e cinco mecanismos, nao tres.** O criterio pede
 * *"administração, saída de sessão e ação com efeito"*, e o legado cobre o
 * terceiro por **endereco e tambem por marcacao** — o comentario de `:275` diz
 * por que: *"certain plugins use that on their links that perform an action"*.
 */
interface MecanismoDeExclusao {
  /** O grupo do criterio. */
  readonly grupo: string;
  /** `caminho` sai em `href_exclude_paths`; `marcacao`, em `selector_matches`. */
  readonly tipo: 'caminho' | 'marcacao';
  /** O padrao, ou o seletor, como o legado o escreve. */
  readonly valor: string;
  /** A posicao em que ele sai, que chega ao navegador. */
  readonly posicao: number;
  /** A linha de `speculative-loading.php` que o constroi. */
  readonly ancora: string;
}

/**
 * Os cinco mecanismos, e o endereco que cada grupo tem no legado:
 *
 * | grupo | o endereco que o legado monta | onde |
 * |---|---|---|
 * | administracao | `/wp-admin/`, e tudo abaixo dele | `link-template.php:3589-3590` |
 * | saida de sessao | `wp-login.php?action=logout`, com `_wpnonce` | `general-template.php:652-653` |
 * | acao com efeito | qualquer endereco com consulta, mais o link marcado | `:222`, `:278`, `:284` |
 *
 * ⚠️ **A saida de sessao e excluida duas vezes, e isso nao e redundancia
 * inventada aqui:** `wp_logout_url()` e `wp-login.php` **com** consulta e
 * **com** nonce, logo ela casa `/wp-*.php` (`:207`) e tambem a exclusao de
 * consulta (`:222`). Um porte que tirasse a primeira continuaria excluindo a
 * saida num site com endereco amigavel, e deixaria de exclui-la num site sem.
 */
const CINCO_MECANISMOS: readonly MecanismoDeExclusao[] = Object.freeze([
  Object.freeze({
    grupo: 'saida de sessao',
    tipo: 'caminho' as const,
    valor: '/wp-*.php',
    posicao: 0,
    ancora: 'speculative-loading.php:207',
  }),
  Object.freeze({
    grupo: 'administracao',
    tipo: 'caminho' as const,
    valor: '/wp-admin/*',
    posicao: 1,
    ancora: 'speculative-loading.php:208',
  }),
  Object.freeze({
    grupo: 'acao com efeito',
    tipo: 'caminho' as const,
    valor: '/*\\?(.+)',
    posicao: 6,
    ancora: 'speculative-loading.php:222',
  }),
  Object.freeze({
    grupo: 'acao com efeito',
    tipo: 'marcacao' as const,
    valor: SELETOR_SEM_SEGUIR,
    posicao: 0,
    ancora: 'speculative-loading.php:278',
  }),
  Object.freeze({
    grupo: 'acao com efeito',
    tipo: 'marcacao' as const,
    valor: '.no-prefetch, .no-prefetch a',
    posicao: 1,
    ancora: 'speculative-loading.php:284',
  }),
]);

test('UT-045-2 mantem fora da declaracao os enderecos de administracao, de saida e de acao com efeito', () => {
  const comandos: string[] = [];
  const modulo = moduloComPorta(comandos);

  const regra = regraUnicaDe(
    modulo.declararPreBusca({ contexto: VISITANTE }),
    MODO_DE_FABRICA,
  );
  const excluidos = excluidosDe(regra);
  const seletores = seletoresDe(regra);

  // 1. Os destinos incluidos sao o site inteiro, e e **por isso** que o que
  //    fica fora tem de estar nomeado: a declaracao nao enumera o que entra.
  assert.deepEqual(destinosDe(regra), [PADRAO_DO_PROPRIO_SITE]);

  // 2. Cada um dos cinco mecanismos sai onde o legado o constroi, e na posicao
  //    em que o constroi — a ordem chega ao navegador, porque nada a reordena
  //    entre `:248-260` e a codificacao.
  for (const mecanismo of CINCO_MECANISMOS) {
    const onde = `${mecanismo.grupo} por ${mecanismo.tipo} (${mecanismo.ancora})`;
    const lista = mecanismo.tipo === 'caminho' ? excluidos : seletores;
    assert.ok(lista.includes(mecanismo.valor), onde);
    assert.equal(lista[mecanismo.posicao], mecanismo.valor, onde);
  }

  // 3. A lista inteira, na ordem. ⚠️ Sete, e nao oito: `template` e
  //    `stylesheet` dao o mesmo padrao num tema sem filho e `array_unique`
  //    (`:248-260`) guarda a primeira ocorrencia — ver `EXCLUSOES_NA_RAIZ`.
  assert.deepEqual(excluidos, EXCLUSOES_NA_RAIZ);
  assert.equal(excluidos.length, 7);
  assert.equal(
    excluidos.filter((cada) => cada === `${TEMA_EMPACOTADO}/*`).length,
    1,
  );
  assert.deepEqual(seletores, [
    SELETOR_SEM_SEGUIR,
    `.no-${MODO_DE_FABRICA}, .no-${MODO_DE_FABRICA} a`,
  ]);

  // 4. A borda deste caso: **o filtro nao consegue remove-los**. O docblock de
  //    `:233-234` e literal — *"WordPress always excludes certain path patterns
  //    such as `/wp-login.php` and `/wp-admin/*`, and those cannot be modified
  //    using the filter"* —, e as tres garantias estao nos comentarios
  //    numerados de `:244-247`: `array_merge` poe as base primeiro,
  //    `array_unique` nao deixa duplicar e `array_values` reindexa.
  const tentativas: readonly (readonly [string, unknown])[] = [
    ['lista vazia', []],
    ['so outro caminho', ['/promocao/*']],
    ['o padrao da administracao de novo', ['/wp-admin/*']],
    ['os sete de volta, fora de ordem', [...EXCLUSOES_NA_RAIZ].reverse()],
    ['nao e lista', 'tirem tudo'],
    ['nulo', null],
  ];
  for (const [caso, devolvido] of tentativas) {
    const comFiltro = regraUnicaDe(
      modulo.declararPreBusca({
        contexto: VISITANTE,
        pontosDeExtensao: {
          sobreOsCaminhosExcluidos: [() => devolvido],
        },
      }),
      MODO_DE_FABRICA,
      caso,
    );
    const depois = excluidosDe(comFiltro, caso);

    // Os sete continuam la, nas sete primeiras posicoes e na mesma ordem.
    assert.deepEqual(depois.slice(0, 7), EXCLUSOES_NA_RAIZ, caso);
    for (const mecanismo of CINCO_MECANISMOS) {
      if (mecanismo.tipo === 'caminho') {
        assert.ok(depois.includes(mecanismo.valor), `${caso}: ${mecanismo.grupo}`);
      }
    }
    // E os seletores nao passam nem perto deste filtro: ele recebe caminho.
    assert.deepEqual(seletoresDe(comFiltro, caso), [
      SELETOR_SEM_SEGUIR,
      `.no-${MODO_DE_FABRICA}, .no-${MODO_DE_FABRICA} a`,
    ]);
  }

  // 5. A segunda borda: **em `prerender` o opt-out de `prefetch` TAMBEM
  //    exclui** (`:290-296`, *"because it's part of 'prerender'"*). Pre-renderizar
  //    implica pre-buscar, logo quem marcou `.no-prefetch` nao e pre-renderizado
  //    — e sao tres seletores, nao dois.
  const emPrerender = regraUnicaDe(
    modulo.declararPreBusca({
      contexto: VISITANTE,
      pontosDeExtensao: {
        sobreAConfiguracao: [() => ({ mode: 'prerender', eagerness: 'auto' })],
      },
    }),
    'prerender',
  );
  assert.deepEqual(seletoresDe(emPrerender), [
    SELETOR_SEM_SEGUIR,
    '.no-prerender, .no-prerender a',
    '.no-prefetch, .no-prefetch a',
  ]);
  // E os caminhos excluidos nao mudam com o modo.
  assert.deepEqual(excluidosDe(emPrerender), EXCLUSOES_NA_RAIZ);

  // 6. A terceira borda: **sem endereco amigavel a exclusao de consulta muda**
  //    (`:224`), e passa a casar so o que tem a palavra `nonce` — que e o
  //    `_wpnonce` da saida de sessao (`general-template.php:653`) e o de toda
  //    acao com efeito. O comentario de `:218-219` diz por que: ali **todo**
  //    endereco tem consulta, e excluir toda consulta desligaria a pre-busca.
  //    🔴 Este ramo nao e alcancavel na instalacao de fabrica — sem endereco
  //    amigavel a configuracao e ausente —, logo a configuracao e forcada, que
  //    e o unico caminho que o legado deixa.
  const semEnderecoAmigavel = regraUnicaDe(
    modulo.declararPreBusca({
      contexto: NA_FABRICA,
      pontosDeExtensao: {
        sobreAConfiguracao: [() => ({ mode: 'auto', eagerness: 'auto' })],
      },
    }),
    MODO_DE_FABRICA,
  );
  const outraLista = excluidosDe(semEnderecoAmigavel);
  assert.deepEqual(outraLista, [
    ...EXCLUSOES_NA_RAIZ.slice(0, 6),
    EXCLUSAO_DE_CONSULTA_SEM_ENDERECO_AMIGAVEL,
  ]);
  assert.equal(EXCLUSAO_DE_CONSULTA_SEM_ENDERECO_AMIGAVEL, '/*\\?*(^|&)*nonce*=*');
  // Administracao e saida de sessao continuam fora pelos dois primeiros
  // padroes, que nao dependem da forma dos enderecos.
  assert.equal(outraLista[0], '/wp-*.php');
  assert.equal(outraLista[1], '/wp-admin/*');

  assert.deepEqual(comandos, []);
});

// ---------------------------------------------------------------------------
// UT-045-3 · `borda`
// ---------------------------------------------------------------------------

/** Uma configuracao que desliga a pre-busca, com a linha que a desliga. */
interface CasoDesligado {
  readonly caso: string;
  readonly opcoes: OpcoesDaPreBusca;
}

/**
 * As quatro maneiras de a pre-busca estar desligada.
 *
 * Todas as quatro passam por `:28` ou por `:65`, e nenhuma delas e uma
 * permissao: UC-01 nao verifica capacidade nenhuma.
 */
const DESLIGADAS: readonly CasoDesligado[] = Object.freeze([
  Object.freeze({
    caso: 'a instalacao de fabrica, com `permalink_structure` em texto vazio (`schema.php:443`)',
    opcoes: Object.freeze({ contexto: NA_FABRICA }),
  }),
  Object.freeze({
    caso: 'o texto `\'0\'` em `permalink_structure`, que e falso no interpretador',
    opcoes: Object.freeze({
      contexto: Object.freeze({
        ...VISITANTE,
        configuracaoDoSite: Object.freeze({
          ...CONFIGURACAO_DE_FABRICA,
          formaDosEnderecos: '0',
        }),
      }),
    }),
  }),
  Object.freeze({
    caso: 'alguem autenticado, mesmo com endereco amigavel (`:28`)',
    opcoes: Object.freeze({
      contexto: Object.freeze({ ...VISITANTE, alguemAutenticado: true }),
    }),
  }),
  Object.freeze({
    caso: 'o ponto de extensao devolveu `null` (`:62` e `:65`)',
    opcoes: Object.freeze({
      contexto: VISITANTE,
      pontosDeExtensao: Object.freeze({
        sobreAConfiguracao: Object.freeze([() => null]),
      }),
    }),
  }),
]);

test('UT-045-3 omite a declaracao por completo quando a pre-busca esta desligada', () => {
  const comandos: string[] = [];
  const modulo = moduloComPorta(comandos);

  // 1. *"desligada ela **não aparece** na página"*: as quatro maneiras de
  //    desligar omitem a declaracao INTEIRA. `wp_print_speculation_rules()`
  //    retorna em `:333` antes de imprimir qualquer coisa — a declaracao nao
  //    aparece **vazia**, nao aparece.
  for (const { caso, opcoes } of DESLIGADAS) {
    const declaracao = modulo.declararPreBusca(opcoes);

    assert.equal(declaracao.emitida, false, caso);
    assert.equal(declaracao.conteudo, undefined, caso);
    assert.deepEqual(declaracao.atributos, {}, caso);
    assert.deepEqual(declaracao.recusas, [], caso);
    // ⚠️ As bandeiras de codificacao continuam declaradas, e nao sao a
    // declaracao: elas descrevem COMO a borda codificaria, e sem `conteudo`
    // nao ha o que codificar.
    assert.deepEqual(declaracao.bandeirasDaCodificacao, BANDEIRAS_DA_CODIFICACAO, caso);
  }

  // 2. O primeiro passo alem da borda, do lado de desligar: **so `null`
  //    desliga**. O teste de `:65` e de identidade — `null === $config` —, logo
  //    o que e falso no interpretador mas nao e nulo **nao** desliga: cai no
  //    ramo de `:74-79` e produz o default INTEIRO.
  const naoDesligam: readonly (readonly [string, unknown])[] = [
    ['falso', false],
    ['zero', 0],
    ['texto vazio', ''],
    ['o texto `\'0\'`', '0'],
    ['lista vazia', []],
    ['estrutura vazia', {}],
  ];
  for (const [caso, devolvido] of naoDesligam) {
    const declaracao = modulo.declararPreBusca({
      contexto: VISITANTE,
      pontosDeExtensao: { sobreAConfiguracao: [() => devolvido] },
    });

    assert.equal(declaracao.emitida, true, caso);
    assert.deepEqual(Object.keys(declaracao.conteudo ?? {}), [MODO_DE_FABRICA], caso);
    const regra = regraUnicaDe(declaracao, MODO_DE_FABRICA, caso);
    assert.equal(regra.eagerness, AGRESSIVIDADE_DE_FABRICA, caso);
    assert.deepEqual(destinosDe(regra, caso), [PADRAO_DO_PROPRIO_SITE], caso);
  }

  // 3. O outro lado da mesma borda: o mesmo contexto, com a mesma instalacao,
  //    declara quando os enderecos amigaveis estao ligados. A diferenca entre
  //    aparecer e nao aparecer e **uma opcao**, que e o que o criterio chama de
  //    *"desligável por configuração"*.
  const ligada = modulo.declararPreBusca({ contexto: VISITANTE });
  assert.equal(ligada.emitida, true);
  assert.deepEqual(excluidosDe(regraUnicaDe(ligada, MODO_DE_FABRICA)), EXCLUSOES_NA_RAIZ);

  // 4. E religar nao traz rastro de quem desligou: as declaracoes nao se
  //    enxergam, porque o modulo nao guarda estado (BR-MIGRAR-105,
  //    `EXT-CONTEXTO`) — numa feature publica o vazamento apareceria como um
  //    visitante recebendo a declaracao resolvida para outro.
  for (const { caso, opcoes } of DESLIGADAS) {
    assert.equal(modulo.declararPreBusca(opcoes).emitida, false, caso);
    assert.equal(modulo.declararPreBusca({ contexto: VISITANTE }).emitida, true, caso);
  }

  assert.deepEqual(comandos, []);
});
