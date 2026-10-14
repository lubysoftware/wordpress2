/**
 * A entrega de **T006**: *"4 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-039-1, UT-039-2, UT-039-3, UT-039-4), com o
 * mesmo dado de entrada, acao e resultado esperado."*
 *
 * ✅ **O catalogo EXISTE nesta arvore, e os quatro casos foram COPIADOS dele, nao
 * reconstruidos.** A tabela de `REQ-039` em `backlog/tests.md:608-617` —
 * *"`must` · `pronto` · veredito `aprovado` · 4 de 4 critérios de aceite
 * cobertos"* — da os quatro casos com nome, tipo e prova, e e ela que esta
 * transcrita abaixo, em ordem de catalogo, com o nome do caso dentro do nome do
 * teste:
 *
 * | caso | tipo | nome no catalogo | prova que o catalogo cita | CA |
 * |---|---|---|---|---|
 * | `UT-039-1` | `feliz` | usa o primeiro modelo existente na ordem declarada para aquele resultado | *"Para cada tipo de resultado de consulta, o sistema procura os modelos em ordem declarada e usa o primeiro que existe"* | CA-2.1 |
 * | `UT-039-2` | `erro` | cai no modelo final de reserva quando nenhum modelo específico existe | *"Há sempre um modelo final de reserva, de modo que nenhuma requisição fica sem apresentação"* | CA-2.2 |
 * | `UT-039-3` | `feliz` | expoe a ordem de procura a quem desenvolve o tema | *"A ordem de procura é inspecionável por quem desenvolve o tema"* | CA-2.3 |
 * | `UT-039-4` | `feliz` | troca a apresentacao ao trocar o tema sem alterar conteudo nem consulta | *"Trocar o tema troca a apresentação sem alterar conteúdo nem consulta"* | CA-2.4 |
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
 *    a tabela de rastreabilidade de `spec.md` liga a US-2 (*"US-2 | REQ-039 ·
 *    UC-01"*). Dele vem o passo 4 do fluxo principal — *"Sistema escolhe o
 *    template pela hierarquia do tema"* —, a pre-condicao que UT-039-2 cobra —
 *    *"o tema ativo resolve ao menos um template, ou o sistema cai no
 *    `index.php` do tema"* — e as duas pos-condicoes que UT-039-4 afirma:
 *    *"nada muda no armazenamento"* e *"o contador de visualizações não existe:
 *    o sistema não registra a leitura em lugar algum"*.
 * 2. **As dezessete regras da hierarquia do legado**, uma por linha da tabela de
 *    `wp-includes/template-loader.php:67-85`, com a lista de candidatos de cada
 *    uma lida na funcao que aquela linha nomeia. A tabela {@link RESULTADOS}
 *    abaixo e essa transcricao, com a ancora de cada regra conferida no oraculo:
 *    `get_embed_template` em `template.php:602`, `get_404_template` em `:134`,
 *    `get_search_template` em `:518`, `get_front_page_template` em `:417`,
 *    `get_home_template` em `:399`, `get_privacy_policy_template` em `:435`,
 *    `get_post_type_archive_template` em `:176`, `get_taxonomy_template` em
 *    `:349`, `get_attachment_template` em `:663`, `get_single_template` em
 *    `:553`, `get_page_template` em `:471`, `get_singular_template` em `:632`,
 *    `get_category_template` em `:254`, `get_tag_template` em `:300`,
 *    `get_author_template` em `:214`, `get_date_template` em `:383` e
 *    `get_archive_template` em `:150`. A reserva final e
 *    `get_index_template()`, em `:118`, chamada de
 *    `template-loader.php:103-105`.
 *
 * Nenhuma lista de candidatos desta suite foi inventada: cada uma e o que a
 * funcao daquela linha monta.
 *
 * ---
 *
 * # Nao e a suite de T005, e o nivel e outro
 *
 * `./us-2-escolher-apresentacao.test.ts` e a suite da **entrega** de T005: ela
 * afirma os quatro critarios de aceite um por um, as seis saidas de
 * `template-loader.php` que nao passam pelo laco, a etapa 5 do atendimento e os
 * quirks do legado, chamando tambem as operacoes intermediarias —
 * `modeloDaConsulta`, `escolherApresentacao` direto. O cabecalho dela ja declara
 * a fronteira: *"os quatro casos `UT-039-1` a `UT-039-4` de `backlog/tests.md`
 * sao de **T006**, a tarefa `[P]`, e nenhum deles e afirmado aqui"*.
 *
 * Esta e a suite do **catalogo**, e ela entra por outro lugar:
 *
 * | | T005 (`us-2-…`) | T006 (este arquivo) |
 * |---|---|---|
 * | entrada | a etapa que o critario descreve, uma por uma | **so** a superficie do modulo: `consultarConteudo` e depois `escolherApresentacao`, que e o passo 3 seguido do passo 4 de UC-01 |
 * | o tipo de resultado | um caso por criterio exercitado | as **dezessete** regras da tabela do legado, uma por linha, com a lista de candidatos de cada uma |
 * | a cobertura de ordem | o candidato mais especifico e o seguinte | **cada posicao** da lista: o tema tem o candidato da posicao e todos os que vem depois dele, e o declarado primeiro vence |
 * | a porta de dados | **lanca** se for tocada | **registra comando**, e a assercao e o log vazio |
 *
 * A porta que registra em vez de lancar nao e conveniencia: e o unico jeito de
 * afirmar a pos-condicao de UC-01 como **resultado**, e nao como ausencia de
 * excecao. Uma porta que lanca prova que o modulo nao escreveu; uma porta que
 * registra prova **o que** ele pediu, e e isso que UT-039-4 cobra ao dizer
 * *"sem alterar conteúdo nem consulta"*.
 *
 * ---
 *
 * # Onde esta suite PARA, e por que isso nao e lacuna
 *
 * - **Nada aqui monta HTML, e nenhum arquivo de tema e lido.** O que esta
 *   superficie decide e o **caminho** do modelo, ate `template_include`
 *   (`template-loader.php:114`); a inclusao, o `load_template()` e o HTML sao da
 *   feature `009-apresentacao-e-personalizacao`. A pergunta aberta da `spec.md`
 *   desta feature — *"Qual tema serve de oráculo para o teste de paridade desta
 *   história?"* — segue **aberta**, e nada aqui a responde: `parity_specs.md`
 *   Decisao 2 poe HTML de tema na area 4, *"comportamento de caso de uso (os 47
 *   UCs)"*, explicitamente **nao** byte a byte, e `pending_decisions.md:159`
 *   registra o motivo. Nao ha `.feature` de paridade para a hierarquia: o nivel
 *   acima destes quatro casos e um percurso de UC-01 com tema real, e ele
 *   depende daquela resposta.
 * - **Nenhum destes quatro casos pergunta permissao.** UC-01 e literal: *"não há
 *   verificação de capacidade. O portão é o `post_status`"* — e o portao e T009
 *   (US-4), com catalogo proprio (`UT-041-1` a `UT-041-5`).
 * - **A paginacao nao entra.** `is_paged` nao esta na tabela de
 *   `template-loader.php`, e `paged_template_hierarchy` esta na lista de nomes de
 *   ponto de extensao do legado **sem funcao que o dispare**. E T007 (US-3), e a
 *   lacuna e do legado.
 *
 * ⚠️ **Nada externo entra nestes testes.** O tema e um duplo que **registra**
 * qual caminho lhe foi perguntado, a porta de dados registra comando e o
 * repositorio conta leitura; nao ha banco, rede, relogio nem navegador.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CONFIGURACAO_DE_FABRICA,
  criarModuloDeLeituraPublica,
  HIERARQUIA_DE_MODELOS,
  registroDeTaxonomias,
  registroDeTipos,
  TEMA_SEM_MODELOS,
  type ConsultaDeConteudo,
  type ContextoDaApresentacao,
  type ContextoDaConsulta,
  type ConteudoConsultado,
  type CriteriosDaConsulta,
  type ModuloDeLeituraPublica,
  type ObjetoConsultadoNoTema,
  type PassoDaProcura,
  type PortasDeLeituraPublica,
  type RegistroDeTaxonomias,
  type RegistroDeTiposDeConteudo,
  type TemaAtivo,
} from '../index.js';

// ---------------------------------------------------------------------------
// Os duplos: todos registram o que lhes foi pedido
// ---------------------------------------------------------------------------

/** O diretorio da folha de estilo — `$wp_stylesheet_path` (`template.php:697`). */
const FILHO = '/temas/filho';
/** O diretorio do tema pai — `$wp_template_path` (`:698`). */
const PAI = '/temas/pai';
/** `ABSPATH . WPINC . '/theme-compat'` — o terceiro diretorio (`:802`). */
const COMPATIBILIDADE = '/wp-includes/theme-compat';

/**
 * A porta de dados que **registra** em vez de simular banco.
 *
 * Nenhum dos quatro casos a usa, e e esse o ponto: o log vazio e a pos-condicao
 * de UC-01 — *"nada muda no armazenamento"* — afirmada como resultado.
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

/** Um tema em disco, e o registro de tudo que lhe foi perguntado, na ordem. */
interface TemaDeTeste {
  readonly tema: TemaAtivo;
  readonly perguntas: string[];
}

/**
 * O duplo do tema: uma lista de caminhos que existem, e o registro das
 * perguntas.
 *
 * `arquivoExiste` e o `file_exists()` de `locate_template()` (`template.php:798`,
 * `:800` e `:802`), e e a unica coisa que esta etapa pergunta ao sistema de
 * arquivos nos candidatos que o nucleo monta — nenhum deles tem segmento `..`,
 * logo `realpath()` nao e chamado (`:717-719`).
 */
function temaEmDisco(
  caminhos: readonly string[],
  diretorioDoModelo: string,
): TemaDeTeste {
  const perguntas: string[] = [];
  const existentes = new Set(caminhos);
  return {
    tema: {
      diretorioDaFolhaDeEstilo: FILHO,
      diretorioDoModelo,
      folhaDeEstilo: 'filho',
      modelo: diretorioDoModelo === FILHO ? 'filho' : 'pai',
      diretorioDeCompatibilidade: COMPATIBILIDADE,
      arquivoExiste: (caminho) => {
        perguntas.push(caminho);
        return existentes.has(caminho);
      },
    },
    perguntas,
  };
}

/** Um tema sem tema pai, com os modelos declarados por nome de arquivo. */
function temaSozinho(nomes: readonly string[]): TemaDeTeste {
  return temaEmDisco(
    nomes.map((nome) => `${FILHO}/${nome}`),
    FILHO,
  );
}

/** Um tema filho com tema pai, com os caminhos declarados inteiros. */
function temaComPai(caminhos: readonly string[]): TemaDeTeste {
  return temaEmDisco(caminhos, PAI);
}

/** Um conteudo gravado, nos cinco campos que a leitura publica le. */
function conteudoGravado(
  parcial: Partial<ConteudoConsultado> & { readonly id: number },
): ConteudoConsultado {
  return {
    identificadorNaUrl: 'ola-mundo',
    tipo: 'post',
    corpo: 'o corpo gravado',
    data: '2026-10-11 09:00:00',
    senha: '',
    ...parcial,
  };
}

/**
 * `get_post_types( array(), 'objects' )` — o registro de tipos de conteudo,
 * que chega por ligacao tardia (`plataforma/tipos-de-conteudo`).
 *
 * `livro` tem pagina de arquivo e `bilhete` nao existe aqui: o caso de
 * `is_post_type_archive` precisa de um tipo com `has_archive`, que e o que
 * `get_post_type_archive_template()` consulta em `template.php:182-185`.
 */
const TIPOS_REGISTRADOS: RegistroDeTiposDeConteudo = registroDeTipos([
  {
    nome: 'post',
    criterioProprio: 'p',
    consultavelPublicamente: true,
    interno: false,
    publico: true,
    temArquivo: false,
  },
  {
    nome: 'page',
    criterioProprio: 'page_id',
    consultavelPublicamente: true,
    interno: false,
    publico: true,
    temArquivo: false,
  },
  {
    nome: 'livro',
    criterioProprio: 'livro',
    consultavelPublicamente: true,
    interno: false,
    publico: true,
    temArquivo: true,
  },
]);

/** `get_taxonomies( array(), 'objects' )` — o registro de taxonomias (BC-02). */
const TAXONOMIAS_REGISTRADAS: RegistroDeTaxonomias = registroDeTaxonomias([
  {
    nome: 'category',
    criterioProprio: 'category_name',
    consultavelPublicamente: true,
    hierarquicaNoEndereco: true,
  },
  {
    nome: 'post_tag',
    criterioProprio: 'tag',
    consultavelPublicamente: true,
    hierarquicaNoEndereco: false,
  },
  {
    nome: 'genero',
    criterioProprio: 'genero',
    consultavelPublicamente: true,
    hierarquicaNoEndereco: false,
  },
]);

/** A pagina declarada como politica de privacidade, achada por caminho. */
const PAGINA_DE_POLITICA = conteudoGravado({
  id: 12,
  identificadorNaUrl: 'politica-de-privacidade',
  tipo: 'page',
});

// ---------------------------------------------------------------------------
// O dado de entrada: as dezessete regras de `template-loader.php:67-85`
// ---------------------------------------------------------------------------

/**
 * Um tipo de resultado de consulta, com a lista de candidatos que o legado monta
 * para ele.
 *
 * E a unidade de *"para cada tipo de resultado de consulta"* de UT-039-1.
 */
interface TipoDeResultado {
  /** O predicado da tabela de `template-loader.php:68-84`. */
  readonly predicado: string;
  /** O `$type` que a regra passa a `get_query_template()` (`template.php:23`). */
  readonly tipo: string;
  /** A funcao do legado que monta a lista, com a linha conferida no oraculo. */
  readonly ancora: string;
  /** Os criterios que levam a consulta a este resultado. */
  readonly criterios: CriteriosDaConsulta;
  /** `get_queried_object()`, quando a regra o le. */
  readonly objetoConsultado?: ObjetoConsultadoNoTema;
  /** A lista de candidatos, em ordem decrescente de prioridade. */
  readonly candidatos: readonly string[];
  /**
   * Quem serve `index.php` quando o tema **so** tem `index.php` — o dado de
   * UT-039-2.
   *
   * ⚠️ Nao e sempre a reserva final: `get_home_template()` declara
   * `array( 'home.php', 'index.php' )` (`template.php:400`), logo a listagem
   * inicial chega em `index.php` **dentro** do laco e com o predicado dela.
   */
  readonly naFaltaDeTudo: { readonly predicado: string; readonly tipo: string };
  /** O que a consulta precisa de fora, nos dois casos que precisam. */
  readonly contextoDaConsulta?: ContextoDaConsulta;
}

/** A reserva final, `get_index_template()` (`template.php:118`). */
const RESERVA_FINAL = { predicado: '', tipo: 'index' } as const;

/** A reserva da listagem inicial, que esta dentro da lista da regra (`:400`). */
const RESERVA_DO_INICIO = { predicado: 'is_home', tipo: 'home' } as const;

/** Um conteudo simples como objeto consultado. */
const CONTEUDO_CONSULTADO: ObjetoConsultadoNoTema = {
  id: 7,
  tipo: 'post',
  identificadorNaUrl: 'ola-mundo',
};

/**
 * As **dezessete** regras da tabela de `wp-includes/template-loader.php:67-85`,
 * nesta ordem, com a lista de candidatos que a funcao de cada linha monta.
 *
 * ⚠️ **A ordem nao e a ordem de especificidade**, e e contrato publico: `is_single`
 * vem antes de `is_singular`, `is_post_type_archive` antes de `is_archive` e
 * `is_front_page` antes de `is_home`. A assercao de ordem de UT-039-3 compara
 * esta tabela com {@link HIERARQUIA_DE_MODELOS} entrada por entrada.
 *
 * As duas ultimas linhas sao as regras que **vencem depois** de outra ter
 * falhado, e e assim que elas sao alcancaveis: `is_singular` ganha quando
 * nenhum `single-*.php` existe, e `is_archive` ganha quando nenhum
 * `author-*.php` existe. O tema de cada posicao tem **so** os candidatos da
 * propria regra, logo as regras anteriores nao localizam nada.
 */
const RESULTADOS: readonly TipoDeResultado[] = [
  {
    predicado: 'is_embed',
    tipo: 'embed',
    ancora: 'template.php:602-618',
    criterios: { name: 'ola-mundo', embed: '1' },
    objetoConsultado: CONTEUDO_CONSULTADO,
    // Sem formato declarado, `if ( $post_format )` (`:609`) nao acrescenta o
    // candidato de formato.
    candidatos: ['embed-post.php', 'embed.php'],
    naFaltaDeTudo: RESERVA_FINAL,
  },
  {
    predicado: 'is_404',
    tipo: '404',
    ancora: 'template.php:134-136',
    criterios: { error: '404' },
    // Lista vazia na regra: `get_query_template( '404' )` sem candidatos, e e
    // `template.php:26-28` que a transforma em `['404.php']`.
    candidatos: ['404.php'],
    naFaltaDeTudo: RESERVA_FINAL,
  },
  {
    predicado: 'is_search',
    tipo: 'search',
    ancora: 'template.php:518-520',
    criterios: { s: 'palavra' },
    candidatos: ['search.php'],
    naFaltaDeTudo: RESERVA_FINAL,
  },
  {
    predicado: 'is_front_page',
    tipo: 'frontpage',
    ancora: 'template.php:417-421',
    // Nenhum criterio: numa instalacao nova `show_on_front` nasce em `'posts'`
    // (`schema.php:476`), logo a frente e a listagem inicial e `is_front_page()`
    // vale pelo primeiro ramo de `class-wp-query.php:4498-4500`.
    criterios: {},
    candidatos: ['front-page.php'],
    naFaltaDeTudo: RESERVA_DO_INICIO,
  },
  {
    predicado: 'is_home',
    tipo: 'home',
    ancora: 'template.php:399-403',
    criterios: {},
    candidatos: ['home.php', 'index.php'],
    naFaltaDeTudo: RESERVA_DO_INICIO,
  },
  {
    predicado: 'is_privacy_policy',
    tipo: 'privacypolicy',
    ancora: 'template.php:435-439',
    criterios: { pagename: 'politica-de-privacidade' },
    objetoConsultado: {
      id: 12,
      tipo: 'page',
      identificadorNaUrl: 'politica-de-privacidade',
      titulo: 'Politica de privacidade',
    },
    candidatos: ['privacy-policy.php'],
    naFaltaDeTudo: RESERVA_FINAL,
    // `is_privacy_policy` liga em `class-wp-query.php:1106-1108`, pela opcao
    // `wp_page_for_privacy_policy` — que nasce em zero (`schema.php:536`) e aqui
    // esta declarada, que e o estado de quem publicou a politica.
    contextoDaConsulta: {
      conteudoPorCaminho: (caminho, tipo) =>
        caminho === 'politica-de-privacidade' && tipo === 'page'
          ? PAGINA_DE_POLITICA
          : undefined,
      configuracao: {
        ...CONFIGURACAO_DE_FABRICA,
        paginaDePoliticaDePrivacidade: 12,
      },
    },
  },
  {
    predicado: 'is_post_type_archive',
    tipo: 'archive',
    ancora: 'template.php:176-188',
    criterios: { post_type: 'livro' },
    // `get_post_type_archive_template()` delega a `get_archive_template()`
    // (`:187`), e e por isso que o `$type` e `archive` e nao um proprio.
    candidatos: ['archive-livro.php', 'archive.php'],
    naFaltaDeTudo: RESERVA_FINAL,
  },
  {
    predicado: 'is_tax',
    tipo: 'taxonomy',
    ancora: 'template.php:349-369',
    criterios: { taxonomy: 'genero', term: 'ficcao' },
    objetoConsultado: {
      id: 31,
      identificadorDoTermo: 'ficcao',
      contextoDoTermo: 'genero',
    },
    candidatos: [
      'taxonomy-genero-ficcao.php',
      'taxonomy-genero-31.php',
      'taxonomy-genero.php',
      'taxonomy.php',
    ],
    naFaltaDeTudo: RESERVA_FINAL,
  },
  {
    predicado: 'is_attachment',
    tipo: 'attachment',
    ancora: 'template.php:663-684',
    criterios: { attachment: 'foto' },
    objetoConsultado: {
      id: 9,
      tipo: 'attachment',
      identificadorNaUrl: 'foto',
      tipoDeMidia: 'image/jpeg',
    },
    // `list( $type, $subtype ) = explode( '/', ... )` (`:670`): o par, depois o
    // subtipo sozinho, depois o tipo, e `attachment.php` por ultimo.
    candidatos: ['image-jpeg.php', 'jpeg.php', 'image.php', 'attachment.php'],
    naFaltaDeTudo: RESERVA_FINAL,
  },
  {
    predicado: 'is_single',
    tipo: 'single',
    ancora: 'template.php:553-576',
    criterios: { name: 'ola-mundo' },
    objetoConsultado: CONTEUDO_CONSULTADO,
    candidatos: [
      'single-post-ola-mundo.php',
      'single-post.php',
      'single.php',
    ],
    naFaltaDeTudo: RESERVA_FINAL,
  },
  {
    predicado: 'is_page',
    tipo: 'page',
    ancora: 'template.php:471-504',
    criterios: { pagename: 'sobre' },
    objetoConsultado: {
      id: 12,
      tipo: 'page',
      identificadorNaUrl: 'sobre',
      titulo: 'Sobre',
    },
    candidatos: ['page-sobre.php', 'page-12.php', 'page.php'],
    naFaltaDeTudo: RESERVA_FINAL,
  },
  {
    predicado: 'is_singular',
    tipo: 'singular',
    ancora: 'template.php:632-634',
    criterios: { name: 'ola-mundo' },
    objetoConsultado: CONTEUDO_CONSULTADO,
    candidatos: ['singular.php'],
    naFaltaDeTudo: RESERVA_FINAL,
  },
  {
    predicado: 'is_category',
    tipo: 'category',
    ancora: 'template.php:254-272',
    criterios: { cat: '5' },
    objetoConsultado: {
      id: 5,
      identificadorDoTermo: 'noticias',
      contextoDoTermo: 'category',
    },
    candidatos: ['category-noticias.php', 'category-5.php', 'category.php'],
    naFaltaDeTudo: RESERVA_FINAL,
  },
  {
    predicado: 'is_tag',
    tipo: 'tag',
    ancora: 'template.php:300-318',
    criterios: { tag: 'php' },
    objetoConsultado: {
      id: 8,
      identificadorDoTermo: 'php',
      contextoDoTermo: 'post_tag',
    },
    candidatos: ['tag-php.php', 'tag-8.php', 'tag.php'],
    naFaltaDeTudo: RESERVA_FINAL,
  },
  {
    predicado: 'is_author',
    tipo: 'author',
    ancora: 'template.php:214-226',
    criterios: { author_name: 'ana' },
    // `$author instanceof WP_User` (`:219`): aqui a discriminacao e pela
    // presenca dos dois campos que o ramo le.
    objetoConsultado: { id: 3, apelidoNaUrl: 'ana' },
    candidatos: ['author-ana.php', 'author-3.php', 'author.php'],
    naFaltaDeTudo: RESERVA_FINAL,
  },
  {
    predicado: 'is_date',
    tipo: 'date',
    ancora: 'template.php:383-385',
    criterios: { year: '2026' },
    candidatos: ['date.php'],
    naFaltaDeTudo: RESERVA_FINAL,
  },
  {
    predicado: 'is_archive',
    tipo: 'archive',
    ancora: 'template.php:150-162',
    criterios: { author_name: 'ana' },
    objetoConsultado: { id: 3, apelidoNaUrl: 'ana' },
    // `array_filter( (array) get_query_var( 'post_type' ) )` (`:151`) sai vazio,
    // logo o candidato por tipo nao entra e sobra `archive.php`.
    candidatos: ['archive.php'],
    naFaltaDeTudo: RESERVA_FINAL,
  },
];

// ---------------------------------------------------------------------------
// A acao: o passo 3 de UC-01 seguido do passo 4, pela superficie do modulo
// ---------------------------------------------------------------------------

/** O modulo composto com a porta que registra. */
function moduloComPorta(comandos: string[]): ModuloDeLeituraPublica {
  return criarModuloDeLeituraPublica(portaQueRegistra(comandos));
}

/**
 * O passo 3 de UC-01 — *"Sistema executa a consulta principal e carrega os
 * registros"*.
 *
 * O repositorio devolve **zero** registro e o objeto consultado do caso: a
 * hierarquia le `get_queried_object()`, e nenhuma das dezessete regras conta
 * registro. A excecao e `get_page_template()`, que le o modelo declarado do
 * global `$post` (`template.php:473`) — e sem registro ele e ausencia, que e o
 * estado de fabrica de todo conteudo.
 */
function consultaDoResultado(
  modulo: ModuloDeLeituraPublica,
  caso: TipoDeResultado,
): ConsultaDeConteudo {
  return modulo.consultarConteudo(caso.criterios, {
    contexto: {
      tiposDeConteudo: TIPOS_REGISTRADOS,
      taxonomias: TAXONOMIAS_REGISTRADAS,
      repositorio: () => ({
        conteudos: [],
        ...(caso.objetoConsultado === undefined
          ? {}
          : { objetoConsultado: caso.objetoConsultado }),
      }),
      ...caso.contextoDaConsulta,
    },
  });
}

/** O contexto do passo 4, com o tema do cenario. */
function contextoCom(tema: TemaAtivo): ContextoDaApresentacao {
  return { tema, tiposDeConteudo: TIPOS_REGISTRADOS };
}

/** O passo da procura em que a regra de um caso falou. */
function passoDoCaso(
  procura: readonly PassoDaProcura[],
  caso: TipoDeResultado,
): PassoDaProcura | undefined {
  return procura.find((passo) => passo.predicado === caso.predicado);
}

/**
 * Os diretorios que `locate_template()` percorre por candidato, na ordem de
 * `template.php:798-806`.
 *
 * ⚠️ **O do tema pai so e perguntado quando ha tema pai**: o ramo do meio e
 * `$is_child_theme && file_exists( $wp_template_path . ... )` (`:800`), e
 * `is_child_theme()` e a comparacao dos dois caminhos (`theme.php:163-167`).
 */
const DIRETORIOS_COM_PAI = [FILHO, PAI, COMPATIBILIDADE];
const DIRETORIOS_SEM_PAI = [FILHO, COMPATIBILIDADE];

/**
 * O que `locate_template()` pergunta ao sistema de arquivos num passo da
 * procura: cada candidato nos diretorios do tema, nessa ordem, ate o que existe.
 */
function perguntasDoPasso(
  passo: PassoDaProcura,
  diretorios: readonly string[],
): readonly string[] {
  const perguntas: string[] = [];
  for (const candidato of passo.candidatos) {
    for (const diretorio of diretorios) {
      perguntas.push(`${diretorio}/${candidato}`);
      if (passo.modelo === `${diretorio}/${candidato}`) {
        return perguntas;
      }
    }
  }
  return perguntas;
}

/** A procura inteira traduzida em perguntas ao sistema de arquivos. */
function perguntasDaProcura(
  procura: readonly PassoDaProcura[],
  diretorios: readonly string[],
): readonly string[] {
  return procura
    .filter((passo) => passo.consultouOTema)
    .flatMap((passo) => perguntasDoPasso(passo, diretorios));
}

// ---------------------------------------------------------------------------
// UT-039-1 · `feliz`
// ---------------------------------------------------------------------------

test('UT-039-1 usa o primeiro modelo existente na ordem declarada para aquele resultado', () => {
  const comandos: string[] = [];
  const modulo = moduloComPorta(comandos);

  // Para **cada** tipo de resultado de consulta — as dezessete linhas da tabela
  // de `template-loader.php:67-85`.
  for (const caso of RESULTADOS) {
    const consulta = consultaDoResultado(modulo, caso);
    const onde = `${caso.predicado} (${caso.ancora})`;

    // Dado: um tema sem modelo nenhum. Entao: a regra consultou o tema com a
    // lista declarada, inteira e na ordem do legado.
    const semNada = modulo.escolherApresentacao(consulta, {
      contexto: contextoCom(temaSozinho([]).tema),
    });
    const passo = passoDoCaso(semNada.procura, caso);
    assert.equal(passo?.valeu, true, onde);
    assert.equal(passo?.consultouOTema, true, onde);
    assert.equal(passo?.tipo, caso.tipo, onde);
    assert.deepEqual(passo?.candidatos, caso.candidatos, onde);

    // Quando: o tema tem o candidato de uma posicao e **todos os que vem depois
    // dele**. Entao: vence o declarado primeiro — nao o mais especifico, nao o
    // ultimo, nao o unico. E o `break` de `template.php:810-812`.
    for (const [posicao, esperado] of caso.candidatos.entries()) {
      const tema = temaSozinho(caso.candidatos.slice(posicao));
      const escolhida = modulo.escolherApresentacao(consulta, {
        contexto: contextoCom(tema.tema),
      });

      assert.equal(
        escolhida.modelo,
        `${FILHO}/${esperado}`,
        `${onde} na posicao ${posicao}`,
      );
      assert.equal(escolhida.predicado, caso.predicado, onde);
      assert.equal(escolhida.tipo, caso.tipo, onde);
      assert.equal(escolhida.saida, 'modelo', onde);

      // E o tema nao foi perguntado por nada depois do que venceu: a procura
      // para no primeiro que existe.
      assert.equal(
        tema.perguntas.at(-1),
        `${FILHO}/${esperado}`,
        `${onde} na posicao ${posicao}`,
      );
    }
  }

  // A porta de dados nao recebeu comando nenhum: a escolha de apresentacao nao
  // consulta e nao grava (UC-01, *"nada muda no armazenamento"*).
  assert.deepEqual(comandos, []);
});

// ---------------------------------------------------------------------------
// UT-039-2 · `erro`
// ---------------------------------------------------------------------------

test('UT-039-2 cai no modelo final de reserva quando nenhum modelo especifico existe', () => {
  const comandos: string[] = [];
  const modulo = moduloComPorta(comandos);

  for (const caso of RESULTADOS) {
    const consulta = consultaDoResultado(modulo, caso);
    const onde = `${caso.predicado} (${caso.ancora})`;

    // Dado: um tema com **so** `index.php`, que e a pre-condicao de UC-01 —
    // *"o tema ativo resolve ao menos um template, ou o sistema cai no
    // `index.php` do tema"*.
    const tema = temaSozinho(['index.php']);
    const escolhida = modulo.escolherApresentacao(consulta, {
      contexto: contextoCom(tema.tema),
    });

    // Entao: nenhuma requisicao fica sem apresentacao.
    assert.equal(escolhida.modelo, `${FILHO}/index.php`, onde);
    assert.equal(escolhida.saida, 'modelo', onde);
    assert.equal(escolhida.predicado, caso.naFaltaDeTudo.predicado, onde);
    assert.equal(escolhida.tipo, caso.naFaltaDeTudo.tipo, onde);

    // E a regra do caso correu, consultou o tema e — fora da listagem inicial —
    // nao localizou nada: a variavel `$template` atravessa o laco e vazio nao
    // encerra (`template-loader.php:94-100`).
    const passo = passoDoCaso(escolhida.procura, caso);
    assert.equal(passo?.consultouOTema, true, onde);
    assert.equal(
      passo?.modelo,
      caso.candidatos.includes('index.php') ? `${FILHO}/index.php` : '',
      onde,
    );

    if (caso.naFaltaDeTudo.predicado === '') {
      // A reserva final e o ultimo passo, ela roda **fora** do laco
      // (`template-loader.php:103-105`) e por isso nao tem predicado, e os
      // dezessete predicados foram percorridos antes dela.
      const reserva = escolhida.procura.at(-1);
      assert.equal(reserva?.predicado, '', onde);
      assert.equal(reserva?.tipo, 'index', onde);
      assert.deepEqual(reserva?.candidatos, ['index.php'], onde);
      assert.deepEqual(
        escolhida.procura.slice(0, -1).map((cada) => cada.predicado),
        HIERARQUIA_DE_MODELOS.map((regra) => regra.predicado),
        onde,
      );
    } else {
      // ⚠️ A listagem inicial declara `index.php` **dentro** da lista
      // (`template.php:400`): ali a reserva chega pela propria regra, o laco
      // encerra nela e a reserva final nunca roda. E o caso de `is_front_page`
      // tambem cai aqui — `front-page.php` nao existe, e quem serve a frente de
      // um site novo e `is_home`, a regra seguinte.
      assert.equal(escolhida.procura.at(-1)?.predicado, 'is_home', onde);
      assert.equal(escolhida.procura.at(-1)?.modelo, `${FILHO}/index.php`, onde);
    }
  }

  // A segunda metade da prova — *"nenhuma requisição fica sem apresentação"* —
  // vale sob aquela pre-condicao, e nao acima dela: sem nem `index.php`, o
  // legado sai de `template-loader.php` com `$template` vazio, nao inclui nada e
  // so avisa quem pode trocar tema (`:133-137`). Inventar aqui uma apresentacao
  // sintetica para "garantir" a frase seria inventar comportamento (P1).
  const semTemaNenhum = modulo.escolherApresentacao(
    consultaDoResultado(modulo, RESULTADOS[9] as TipoDeResultado),
    { contexto: contextoCom(TEMA_SEM_MODELOS) },
  );
  assert.equal(semTemaNenhum.saida, 'modelo');
  assert.equal(semTemaNenhum.modelo, '');
  assert.equal(semTemaNenhum.tipo, 'index');

  assert.deepEqual(comandos, []);
});

// ---------------------------------------------------------------------------
// UT-039-3 · `feliz`
// ---------------------------------------------------------------------------

test('UT-039-3 expoe a ordem de procura a quem desenvolve o tema', () => {
  const comandos: string[] = [];
  const modulo = moduloComPorta(comandos);

  // 1. A hierarquia e **dado**: dezessete regras, com o nome do predicado do
  //    legado e o `$type` que cada uma passa adiante, na ordem da tabela de
  //    `template-loader.php:68-84`. E a tabela desta suite, entrada por entrada.
  assert.equal(HIERARQUIA_DE_MODELOS.length, 17);
  assert.deepEqual(
    HIERARQUIA_DE_MODELOS.map((regra) => [regra.predicado, regra.tipo]),
    RESULTADOS.map((caso) => [caso.predicado, caso.tipo]),
  );

  // E inspecionar nao altera: no legado `$tag_templates` e um arranjo local sem
  // ponto de extensao nenhum, e o que uma extensao troca e a **lista de
  // candidatos** de um tipo, nao a ordem das regras.
  assert.ok(Object.isFrozen(HIERARQUIA_DE_MODELOS));

  // 2. A procura de uma requisicao e registrada passo a passo. Dado: um tema
  //    filho com tema pai e so `index.php` no filho; quando: a leitura de um
  //    conteudo unico.
  const caso = RESULTADOS[9] as TipoDeResultado;
  assert.equal(caso.predicado, 'is_single');
  const consulta = consultaDoResultado(modulo, caso);
  const tema = temaComPai([`${FILHO}/index.php`]);

  const vistosNoPonto: [string, readonly string[]][] = [];
  const escolhida = modulo.escolherApresentacao(consulta, {
    contexto: contextoCom(tema.tema),
    pontosDeExtensao: {
      hierarquia: {
        sobreOsCandidatos: [
          (tipo, candidatos) => {
            vistosNoPonto.push([tipo, [...candidatos]]);
            return candidatos;
          },
        ],
      },
    },
  });

  // Entao: os dezessete predicados mais a reserva final, na ordem em que
  // aconteceram.
  assert.deepEqual(
    escolhida.procura.map((passo) => passo.predicado),
    [...HIERARQUIA_DE_MODELOS.map((regra) => regra.predicado), ''],
  );

  // E os tres estados de um passo sao distinguiveis, que e o que torna o
  // registro util a quem desenvolve o tema: o predicado que nao valeu, o que
  // valeu e consultou, e — em outro cenario — o que valeu e saiu sem consultar.
  const naoValeu = escolhida.procura[0];
  assert.equal(naoValeu?.predicado, 'is_embed');
  assert.equal(naoValeu?.valeu, false);
  assert.equal(naoValeu?.consultouOTema, false);
  assert.deepEqual(naoValeu?.candidatos, []);

  assert.deepEqual(
    escolhida.procura
      .filter((passo) => passo.consultouOTema)
      .map((passo) => [passo.predicado, passo.tipo, passo.candidatos]),
    [
      ['is_single', 'single', caso.candidatos],
      ['is_singular', 'singular', ['singular.php']],
      ['', 'index', ['index.php']],
    ],
  );

  // 3. O registro **e** o que aconteceu, e nao uma descricao dele: a sequencia
  //    de perguntas ao sistema de arquivos e cada candidato nos tres
  //    diretorios, na ordem de `locate_template()` (`template.php:798-806`), e
  //    ela se reconstroi do proprio registro.
  assert.deepEqual(
    tema.perguntas,
    perguntasDaProcura(escolhida.procura, DIRETORIOS_COM_PAI),
  );
  assert.deepEqual(tema.perguntas, [
    `${FILHO}/single-post-ola-mundo.php`,
    `${PAI}/single-post-ola-mundo.php`,
    `${COMPATIBILIDADE}/single-post-ola-mundo.php`,
    `${FILHO}/single-post.php`,
    `${PAI}/single-post.php`,
    `${COMPATIBILIDADE}/single-post.php`,
    `${FILHO}/single.php`,
    `${PAI}/single.php`,
    `${COMPATIBILIDADE}/single.php`,
    `${FILHO}/singular.php`,
    `${PAI}/singular.php`,
    `${COMPATIBILIDADE}/singular.php`,
    `${FILHO}/index.php`,
  ]);

  // 4. E a ordem chega tambem a quem olha de fora, pelo ponto de extensao que o
  //    legado publica para isso — `{$type}_template_hierarchy`
  //    (`template.php:62`), que recebe a lista **antes** da procura: o nome do
  //    tipo e a lista declarada, na mesma ordem do registro.
  assert.deepEqual(
    vistosNoPonto,
    escolhida.procura
      .filter((passo) => passo.consultouOTema)
      .map((passo) => [passo.tipo, passo.candidatos]),
  );

  assert.deepEqual(comandos, []);
});

// ---------------------------------------------------------------------------
// UT-039-4 · `feliz`
// ---------------------------------------------------------------------------

test('UT-039-4 troca a apresentacao ao trocar o tema sem alterar conteudo nem consulta', () => {
  const comandos: string[] = [];
  const modulo = moduloComPorta(comandos);

  // Dado: um conteudo gravado e uma consulta que o encontrou, uma vez.
  const linha = conteudoGravado({ id: 7, identificadorNaUrl: 'ola-mundo' });
  const linhaAntes = { ...linha };
  let leituras = 0;
  const consulta = modulo.consultarConteudo(
    { name: 'ola-mundo' },
    {
      contexto: {
        repositorio: () => {
          leituras += 1;
          return { conteudos: [linha], objetoConsultado: CONTEUDO_CONSULTADO };
        },
      },
    },
  );
  const consultaAntes = {
    criterios: { ...consulta.criterios },
    tipos: { ...consulta.tipos },
    conteudos: [...consulta.conteudos],
    contagem: consulta.contagem,
  };

  // Quando: a mesma consulta e apresentada por quatro temas diferentes.
  const generico = temaSozinho(['index.php']);
  const especifico = temaSozinho(['single-post.php', 'index.php']);
  const soNoPai = temaComPai([`${PAI}/single.php`]);
  const sobrescritoNoFilho = temaComPai([
    `${FILHO}/single.php`,
    `${PAI}/single.php`,
  ]);

  const comGenerico = modulo.escolherApresentacao(consulta, {
    contexto: contextoCom(generico.tema),
  });
  const comEspecifico = modulo.escolherApresentacao(consulta, {
    contexto: contextoCom(especifico.tema),
  });
  const comPai = modulo.escolherApresentacao(consulta, {
    contexto: contextoCom(soNoPai.tema),
  });
  const comFilho = modulo.escolherApresentacao(consulta, {
    contexto: contextoCom(sobrescritoNoFilho.tema),
  });

  // Entao: quatro apresentacoes diferentes. A terceira e a quarta sao a razao
  // pela qual o legado procura na folha de estilo antes do modelo — *"so that
  // themes which inherit from a parent theme can just overload one file"*
  // (`template.php:765-767`).
  assert.equal(comGenerico.modelo, `${FILHO}/index.php`);
  assert.equal(comGenerico.predicado, '');
  assert.equal(comEspecifico.modelo, `${FILHO}/single-post.php`);
  assert.equal(comEspecifico.predicado, 'is_single');
  assert.equal(comPai.modelo, `${PAI}/single.php`);
  assert.equal(comFilho.modelo, `${FILHO}/single.php`);

  // E a consulta nao mudou: nem os criterios, nem os predicados, nem os
  // registros, nem a contagem. Trocar o tema e trocar um argumento.
  assert.deepEqual({ ...consulta.criterios }, consultaAntes.criterios);
  assert.deepEqual({ ...consulta.tipos }, consultaAntes.tipos);
  assert.deepEqual([...consulta.conteudos], consultaAntes.conteudos);
  assert.equal(consulta.contagem, consultaAntes.contagem);

  // E a consulta nao foi **refeita**: as quatro apresentacoes correram sobre o
  // resultado de uma leitura so, e o repositorio nao foi procurado de novo.
  assert.equal(leituras, 1);

  // E o conteudo e o mesmo registro, campo por campo e por identidade: a
  // pos-condicao de UC-01 e *"nada muda no armazenamento"*, e a porta de dados
  // nao recebeu comando nenhum.
  assert.deepEqual({ ...linha }, linhaAntes);
  assert.equal(consulta.conteudo, linha);
  assert.deepEqual(comandos, []);

  // E cada tema foi perguntado so pela propria leitura: duas apresentacoes
  // concorrentes nao compartilham estado (BR-MIGRAR-105, `EXT-CONTEXTO`).
  assert.deepEqual(especifico.perguntas, [
    `${FILHO}/single-post-ola-mundo.php`,
    `${COMPATIBILIDADE}/single-post-ola-mundo.php`,
    `${FILHO}/single-post.php`,
  ]);
  assert.deepEqual(
    generico.perguntas,
    perguntasDaProcura(comGenerico.procura, DIRETORIOS_SEM_PAI),
  );
  assert.deepEqual(
    comPai.procura
      .filter((passo) => passo.consultouOTema)
      .map((passo) => passo.predicado),
    ['is_single'],
  );
  assert.deepEqual(
    soNoPai.perguntas,
    perguntasDaProcura(comPai.procura, DIRETORIOS_COM_PAI),
  );
});
