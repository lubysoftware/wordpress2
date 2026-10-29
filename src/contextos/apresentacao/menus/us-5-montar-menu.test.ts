/**
 * Testes de **T011** (US-5): *"Montar menu de navegacao com itens que apontam
 * para conteudo, classificacao ou endereco externo"* — CA-5.1 a CA-5.5.
 *
 * Afirma os criterios de aceite contra o comportamento lido do legado
 * (`wp-admin/nav-menus.php`, `wp-includes/nav-menu.php`,
 * `wp-admin/includes/nav-menu.php`). Os sete casos do catalogo (`UT-100-1` a
 * `UT-100-7`) sao **T012**, em suite propria.
 *
 * O termo (`BC-02`) e o item (`BC-01`) sao duplos em memoria que **registram
 * cada chamada**: e assim que se afirma o que a operacao grava, em que ordem, e
 * o caso em que ela nao grava nada. A associacao de posicoes e afirmada tambem
 * sobre o armazenamento de verdade de T002, ate o byte serializado.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  REDE_INATIVA_NA_AUTORIZACAO,
  type AtorDeAutorizacao,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';
import {
  arranjoPorNome,
  booleano,
  inteiro,
  serializarComoTexto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import {
  criarPortaDeDadosFalsa,
  criarRepositorioDaConfiguracaoDoTema,
  textoDoParametro,
} from '../armazenamento/index.js';
import { criarModuloDeApresentacao } from '../index.js';
import {
  ENDERECO_DA_TELA_DE_MENUS,
  MENSAGEM_DE_MENU_INVALIDO,
  MENSAGEM_DE_POSICOES_ATUALIZADAS,
  MENSAGEM_DE_TEMA_SEM_MENUS,
  MENSAGEM_DE_TOKEN_VENCIDO,
  MENSAGEM_SEM_PERMISSAO_NOS_MENUS,
  METADADOS_DO_ITEM,
  OPCAO_DAS_OPCOES_DE_MENU,
  PERMISSOES_DOS_MENUS,
  TOKEN_DE_GRAVAR_MENU,
  TOKEN_DE_GRAVAR_POSICOES,
  gravarItemDeMenu,
  type ContextoDosMenus,
  type OperacoesDosMenus,
  type PedidoDoItemDeMenu,
  type TermoNosMenus,
  type ValorDeMetadadoDoItem,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const FOLHA = 'twentytwentyfive';
const TOKEN_VALIDO = 'n-valido';

const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'administrator',
    capacidades: [{ capacidade: 'edit_theme_options', concedida: true }],
  },
  {
    identificador: 'editor',
    capacidades: [{ capacidade: 'edit_others_posts', concedida: true }],
  },
];

function ator(papel: string): AtorDeAutorizacao {
  return {
    contaId: 3,
    login: papel,
    existe: true,
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

interface TermoGuardado {
  readonly termoId: number;
  contextoDeClassificacao: string;
  nome: string;
  slug: string;
  pai: number;
}

interface ConteudoGuardado {
  tipo: string;
  titulo: string;
  paiId: number;
  ordem: number;
  estado: string;
}

/** O mundo dos dois duplos, e o registro de tudo que a operacao pediu. */
interface Mundo {
  readonly termos: Map<number, TermoGuardado>;
  readonly conteudos: Map<number, ConteudoGuardado>;
  readonly metadados: Map<number, Map<string, ValorDeMetadadoDoItem>>;
  readonly relacoes: Map<number, number[]>;
  readonly modificacoes: Map<string, ValorPhp>;
  readonly opcoes: Map<string, ValorPhp>;
  /** Toda chamada que **grava**, na ordem. */
  readonly gravacoes: string[];
  readonly inseridos: PedidoDoItemDeMenu[];
  readonly atualizados: PedidoDoItemDeMenu[];
  proximoTermo: number;
  proximoConteudo: number;
}

function mundoVazio(): Mundo {
  return {
    termos: new Map(),
    conteudos: new Map(),
    metadados: new Map(),
    relacoes: new Map(),
    modificacoes: new Map(),
    opcoes: new Map(),
    gravacoes: [],
    inseridos: [],
    atualizados: [],
    proximoTermo: 40,
    proximoConteudo: 100,
  };
}

/**
 * O termo como `BC-02` o devolve. A contagem e a de `_update_post_term_count()`
 * (`wp-includes/taxonomy.php:4193`): so objeto **publicado** conta (`:4214`).
 */
function lerTermo(mundo: Mundo, guardado: TermoGuardado): TermoNosMenus {
  let contagem = 0;
  for (const [objetoId, termos] of mundo.relacoes) {
    if (
      termos.includes(guardado.termoId) &&
      mundo.conteudos.get(objetoId)?.estado === 'publish'
    ) {
      contagem += 1;
    }
  }
  return {
    termoId: guardado.termoId,
    termoTaxonomiaId: guardado.termoId + 1000,
    contextoDeClassificacao: guardado.contextoDeClassificacao,
    nome: guardado.nome,
    slug: guardado.slug,
    descricao: '',
    pai: guardado.pai,
    contagem,
  };
}

interface Opcoes {
  readonly ator?: AtorDeAutorizacao;
  readonly posicoesDeclaradas?: readonly (readonly [string, string])[];
  readonly suportes?: readonly string[];
  readonly mundo?: Mundo;
  readonly configuracaoDoTema?: ContextoDosMenus['configuracaoDoTema'];
}

function cenario(opcoes: Opcoes = {}): {
  contexto: ContextoDosMenus;
  mundo: Mundo;
  menus: OperacoesDosMenus;
} {
  const mundo = opcoes.mundo ?? mundoVazio();
  const posicoesDeclaradas = opcoes.posicoesDeclaradas ?? [
    ['primary', 'Primary menu'],
    ['footer', 'Footer menu'],
  ];
  const suportes =
    opcoes.suportes ?? (posicoesDeclaradas.length > 0 ? ['menus'] : []);

  const contexto: ContextoDosMenus = {
    autorizacao: {
      matriz: MATRIZ,
      rede: REDE_INATIVA_NA_AUTORIZACAO,
      ator: opcoes.ator ?? ator('administrator'),
    },
    folhaDeEstilo: FOLHA,
    configuracaoDoTema: opcoes.configuracaoDoTema ?? {
      modificacao: (_folha, nome) => mundo.modificacoes.get(nome),
      definirModificacao(_folha, nome, valor) {
        mundo.gravacoes.push(`set_theme_mod ${nome}`);
        mundo.modificacoes.set(nome, valor);
        return true;
      },
      opcoes: {
        lerComoNoLegado: (nome) => mundo.opcoes.get(nome) ?? booleano(false),
        gravar(nome, valor) {
          mundo.gravacoes.push(`update_option ${nome}`);
          mundo.opcoes.set(nome, valor);
          return true;
        },
      },
    },
    classificacao: {
      termo(id, contexto) {
        const guardado = mundo.termos.get(id);
        if (
          guardado === undefined ||
          (contexto !== '' && guardado.contextoDeClassificacao !== contexto)
        ) {
          return null;
        }
        return lerTermo(mundo, guardado);
      },
      termoPor(campo, valor, contexto) {
        if (valor === '') {
          return null;
        }
        for (const guardado of mundo.termos.values()) {
          if (
            guardado.contextoDeClassificacao === contexto &&
            (campo === 'slug' ? guardado.slug : guardado.nome) === valor
          ) {
            return lerTermo(mundo, guardado);
          }
        }
        return null;
      },
      inserirTermo(nome, contexto, argumentos) {
        const termoId = mundo.proximoTermo++;
        mundo.gravacoes.push(`wp_insert_term ${contexto} ${nome}`);
        mundo.termos.set(termoId, {
          termoId,
          contextoDeClassificacao: contexto,
          nome,
          slug: nome.toLowerCase().replace(/\s+/g, '-'),
          pai: argumentos.pai,
        });
        return { ok: true, termoId, termoTaxonomiaId: termoId + 1000 };
      },
      atualizarTermo(id, contexto, argumentos) {
        mundo.gravacoes.push(`wp_update_term ${contexto} ${id} ${argumentos.nome}`);
        const guardado = mundo.termos.get(id);
        if (guardado !== undefined) {
          guardado.nome = argumentos.nome;
        }
        return { ok: true, termoId: id, termoTaxonomiaId: id + 1000 };
      },
      objetoNoTermo: (objetoId, _contexto, termoId) =>
        (mundo.relacoes.get(objetoId) ?? []).includes(termoId),
      definirTermosDoObjeto(objetoId, termoIds, contexto) {
        mundo.gravacoes.push(`wp_set_object_terms ${objetoId} ${contexto}`);
        mundo.relacoes.set(objetoId, [...termoIds]);
        return { ok: true };
      },
      idsDosMenus: () =>
        [...mundo.termos.values()]
          .filter((termo) => termo.contextoDeClassificacao === 'nav_menu')
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .map((termo) => termo.termoId),
      adiarContagem(adiar) {
        mundo.gravacoes.push(`wp_defer_term_counting ${String(adiar)}`);
      },
    },
    conteudo: {
      tipoDoConteudo: (id) => mundo.conteudos.get(id)?.tipo ?? null,
      conteudo(id) {
        const guardado = mundo.conteudos.get(id);
        return guardado === undefined
          ? null
          : { id, tipo: guardado.tipo, titulo: guardado.titulo, paiId: guardado.paiId };
      },
      rotuloDeArquivoDoTipo: (nome) => (nome === 'livro' ? 'Arquivo de livros' : null),
      itensDoMenu(termoTaxonomiaId, estados, ordenarPor) {
        const termoId = termoTaxonomiaId - 1000;
        return [...mundo.conteudos.entries()]
          .filter(
            ([id, conteudo]) =>
              conteudo.tipo === 'nav_menu_item' &&
              estados.includes(conteudo.estado) &&
              (mundo.relacoes.get(id) ?? []).includes(termoId),
          )
          .map(([id, conteudo]) => ({ id, ordemNoMenu: conteudo.ordem }))
          .sort((a, b) =>
            ordenarPor === 'ID' ? a.id - b.id : a.ordemNoMenu - b.ordemNoMenu,
          );
      },
      resolverData: () => '2026-10-29 10:00:00',
      inserir(pedido) {
        const id = mundo.proximoConteudo++;
        mundo.gravacoes.push(`wp_insert_post ${id}`);
        mundo.inseridos.push(pedido);
        mundo.conteudos.set(id, {
          tipo: pedido.post_type,
          titulo: pedido.post_title,
          paiId: pedido.post_parent,
          ordem: pedido.menu_order,
          estado: pedido.post_status,
        });
        return { ok: true, id };
      },
      atualizar(pedido) {
        mundo.gravacoes.push(`wp_update_post ${pedido.ID}`);
        mundo.atualizados.push(pedido);
        const guardado = mundo.conteudos.get(pedido.ID);
        if (guardado !== undefined) {
          guardado.titulo = pedido.post_title;
          guardado.paiId = pedido.post_parent;
          guardado.ordem = pedido.menu_order;
          guardado.estado = pedido.post_status;
        }
        return { ok: true, id: pedido.ID };
      },
      apagar(id) {
        mundo.gravacoes.push(`wp_delete_post ${id}`);
        mundo.conteudos.delete(id);
        mundo.relacoes.delete(id);
      },
      definirMetadado(id, chave, valor) {
        mundo.gravacoes.push(`update_post_meta ${id} ${chave}`);
        const metadados = mundo.metadados.get(id) ?? new Map();
        metadados.set(chave, valor);
        mundo.metadados.set(id, metadados);
      },
      temMetadado: (id, chave) => mundo.metadados.get(id)?.has(chave) ?? false,
      apagarMetadado(id, chave) {
        mundo.gravacoes.push(`delete_post_meta ${id} ${chave}`);
        mundo.metadados.get(id)?.delete(chave);
      },
    },
    posicoesDeclaradas,
    temaSuporta: (recurso) => suportes.includes(recurso),
    verificarNonce: (acao, valor) =>
      (acao === TOKEN_DE_GRAVAR_MENU.acao || acao === TOKEN_DE_GRAVAR_POSICOES.acao) &&
      valor === TOKEN_VALIDO,
    sanitizarChave: (valor) => valor.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
    sanitizarClasseHtml: (valor) => valor.replace(/[^A-Za-z0-9_-]/g, ''),
    sanitizarEndereco: (valor) => valor,
    escaparHtml: (valor) =>
      valor
        // `esc_html()` nao escapa de novo a entidade que ja esta escapada.
        .replace(/&(?!(?:amp|lt|gt|quot|#0?39);)/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;'),
    agora: () => 1793872800,
  };

  const modulo = criarModuloDeApresentacao({
    dados: {
      prefixoDeTabela: 'wp_',
      selecionar: () => [],
      escrever: () => ({ linhasAfetadas: 0, idGerado: null }),
    },
    clienteExterno: {
      chamar: () => ({ completou: false, motivo: 'nao chamado' }),
    },
  });
  return { contexto, mundo, menus: modulo.menus };
}

/** Um menu ja gravado, com o nome e o slug dados. */
function comMenu(mundo: Mundo, termoId: number, nome: string, slug: string): void {
  mundo.termos.set(termoId, {
    termoId,
    contextoDeClassificacao: 'nav_menu',
    nome,
    slug,
    pai: 0,
  });
}

/** Um item de menu ja gravado e ligado ao menu. */
function comItem(
  mundo: Mundo,
  id: number,
  menuId: number,
  ordem: number,
  estado = 'publish',
): void {
  mundo.conteudos.set(id, {
    tipo: 'nav_menu_item',
    titulo: `Item ${id}`,
    paiId: 0,
    ordem,
    estado,
  });
  mundo.relacoes.set(id, [menuId]);
}

function metadado(mundo: Mundo, id: number, chave: string): ValorDeMetadadoDoItem | undefined {
  return mundo.metadados.get(id)?.get(chave);
}

/* ── CA-5.1 — criar e editar exige administrar a aparencia ─────────────────── */

test('CA-5.1 sem edit_theme_options a tela de menus recusa com 403, e nada e gravado', () => {
  const { contexto, mundo, menus } = cenario({ ator: ator('editor') });

  assert.deepEqual(menus.abrirTela(contexto), {
    tipo: 'proibida',
    status: 403,
    titulo: 'You need a higher level of permission.',
    mensagem: MENSAGEM_SEM_PERMISSAO_NOS_MENUS,
  });

  const desfecho = menus.gravarMenu(contexto, {
    menu: 0,
    token: TOKEN_VALIDO,
    nomeDoMenu: 'Principal',
    posicoes: [['primary', '1']],
  });
  assert.equal(desfecho.desfecho, 'recusada');
  assert.equal(
    desfecho.desfecho === 'recusada' ? desfecho.recusa.tipo : null,
    'proibida',
  );
  assert.deepEqual(mundo.gravacoes, []);

  // A capacidade e a primitiva, sem meta-capacidade de menu (UC-30).
  assert.equal(PERMISSOES_DOS_MENUS.abrirATela, 'edit_theme_options');
  assert.equal(PERMISSOES_DOS_MENUS.gravarMenu, 'edit_theme_options');
});

test('CA-5.1 com edit_theme_options a tela abre; token vencido recusa a gravacao sem escrever', () => {
  const { contexto, mundo, menus } = cenario();

  assert.equal(menus.abrirTela(contexto), null);

  const desfecho = menus.gravarMenu(contexto, {
    menu: 0,
    token: 'vencido',
    nomeDoMenu: 'Principal',
  });
  assert.deepEqual(desfecho, {
    desfecho: 'recusada',
    recusa: {
      tipo: 'token-vencido',
      status: 403,
      titulo: 'An error occurred.',
      mensagem: MENSAGEM_DE_TOKEN_VENCIDO,
    },
  });
  assert.deepEqual(mundo.gravacoes, []);
});

test('CA-5.1 o tema sem menus e sem widgets e conferido antes da capacidade (nav-menus.php:18)', () => {
  const { contexto, menus } = cenario({
    ator: ator('editor'),
    posicoesDeclaradas: [],
    suportes: [],
  });

  assert.deepEqual(menus.abrirTela(contexto), {
    tipo: 'tema-sem-suporte',
    status: 500,
    mensagem: MENSAGEM_DE_TEMA_SEM_MENUS,
  });
});

/* ── CA-5.2 — o item aponta para conteudo, classificacao ou endereco ───────── */

test('CA-5.2 criar o menu grava um termo de nav_menu e redireciona para editar o menu novo', () => {
  const { contexto, mundo, menus } = cenario();

  const desfecho = menus.gravarMenu(contexto, {
    menu: 0,
    token: TOKEN_VALIDO,
    nomeDoMenu: '  Principal  ',
  });

  assert.deepEqual(desfecho, {
    desfecho: 'redirecionar',
    endereco: `${ENDERECO_DA_TELA_DE_MENUS}?menu=40`,
  });
  // `trim( esc_html() )` antes de gravar; nenhum item, nenhuma posicao.
  assert.deepEqual(mundo.gravacoes, ['wp_insert_term nav_menu Principal']);
  assert.equal(mundo.termos.get(40)?.contextoDeClassificacao, 'nav_menu');
});

test('CA-5.2 nome de menu repetido e recusado com a mensagem do legado, escapada', () => {
  const mundo = mundoVazio();
  // O nome gravado pela tela ja passou por `esc_html()`.
  comMenu(mundo, 7, 'Topo &amp; Rodape', 'topo-rodape');
  const { contexto, menus } = cenario({ mundo });

  const desfecho = menus.gravarMenu(contexto, {
    menu: 0,
    token: TOKEN_VALIDO,
    nomeDoMenu: 'Topo & Rodape',
  });

  // A tela escapa o nome antes de procurar (`nav-menus.php:381`), e e com o
  // nome escapado que o homonimo e achado.
  assert.equal(desfecho.desfecho, 'tela');
  assert.deepEqual(desfecho.desfecho === 'tela' ? desfecho.avisos : null, [
    {
      tipo: 'erro',
      texto:
        'The menu name <strong>Topo &amp; Rodape</strong> conflicts with another menu name. Please try another.',
      dispensavel: true,
    },
  ]);
  assert.deepEqual(mundo.gravacoes, []);
});

test('CA-5.2 o item aponta para um conteudo, uma classificacao ou um endereco externo', () => {
  const mundo = mundoVazio();
  comMenu(mundo, 7, 'Principal', 'principal');
  mundo.conteudos.set(12, { tipo: 'page', titulo: 'Sobre', paiId: 4, ordem: 0, estado: 'publish' });
  mundo.termos.set(5, {
    termoId: 5,
    contextoDeClassificacao: 'category',
    nome: 'Noticias',
    slug: 'noticias',
    pai: 2,
  });
  const { contexto } = cenario({ mundo });

  const conteudo = gravarItemDeMenu(contexto, {
    menuId: 7,
    itemId: 0,
    dados: {
      'menu-item-type': 'post_type',
      'menu-item-object': 'page',
      'menu-item-object-id': '12',
      'menu-item-title': 'Sobre',
      'menu-item-url': 'https://ignorado.example/',
      'menu-item-status': 'publish',
    },
  });
  const classificacao = gravarItemDeMenu(contexto, {
    menuId: 7,
    itemId: 0,
    dados: {
      'menu-item-type': 'taxonomy',
      'menu-item-object': 'category',
      'menu-item-object-id': '5',
      'menu-item-title': 'Ultimas noticias',
      'menu-item-status': 'publish',
    },
  });
  const externo = gravarItemDeMenu(contexto, {
    menuId: 7,
    itemId: 0,
    dados: {
      'menu-item-type': 'custom',
      'menu-item-url': '  https://exemplo.org/  ',
      'menu-item-title': 'Exemplo',
      'menu-item-status': 'publish',
    },
  });

  assert.deepEqual([conteudo, classificacao, externo], [
    { ok: true, itemId: 100 },
    { ok: true, itemId: 101 },
    { ok: true, itemId: 102 },
  ]);

  // Os tres sao conteudo do tipo do item, ligados ao termo do menu.
  for (const id of [100, 101, 102]) {
    assert.equal(mundo.conteudos.get(id)?.tipo, 'nav_menu_item');
    assert.deepEqual(mundo.relacoes.get(id), [7]);
  }

  // Conteudo: destino gravado, endereco vazio, titulo igual ao original vira ''
  // e a descricao vira ' ' (o "Hack" de `:518`-`:521`).
  assert.equal(metadado(mundo, 100, METADADOS_DO_ITEM.tipo), 'post_type');
  assert.equal(metadado(mundo, 100, METADADOS_DO_ITEM.destino), 'page');
  assert.equal(metadado(mundo, 100, METADADOS_DO_ITEM.destinoId), '12');
  assert.equal(metadado(mundo, 100, METADADOS_DO_ITEM.endereco), '');
  assert.equal(mundo.inseridos[0]?.post_title, '');
  assert.equal(mundo.inseridos[0]?.post_content, ' ');

  // Classificacao: titulo proprio fica; o `post_parent` do item e o pai do
  // TERMO apontado, nao o item pai.
  assert.equal(metadado(mundo, 101, METADADOS_DO_ITEM.tipo), 'taxonomy');
  assert.equal(metadado(mundo, 101, METADADOS_DO_ITEM.destino), 'category');
  assert.equal(metadado(mundo, 101, METADADOS_DO_ITEM.destinoId), '5');
  assert.equal(mundo.inseridos[1]?.post_title, 'Ultimas noticias');
  assert.equal(mundo.inseridos[1]?.post_parent, 2);
  assert.equal(mundo.inseridos[0]?.post_parent, 4);

  // Endereco externo: aparado, e o destino e o proprio item.
  assert.equal(metadado(mundo, 102, METADADOS_DO_ITEM.tipo), 'custom');
  assert.equal(metadado(mundo, 102, METADADOS_DO_ITEM.endereco), 'https://exemplo.org/');
  assert.equal(metadado(mundo, 102, METADADOS_DO_ITEM.destino), 'custom');
  assert.equal(metadado(mundo, 102, METADADOS_DO_ITEM.destinoId), '102');
});

test('CA-5.2 os metadados saem na ordem do legado, e item novo sem estado pedido e rascunho', () => {
  const mundo = mundoVazio();
  comMenu(mundo, 7, 'Principal', 'principal');
  const { contexto } = cenario({ mundo });

  gravarItemDeMenu(contexto, {
    menuId: 7,
    itemId: 0,
    dados: {
      'menu-item-type': 'custom',
      'menu-item-url': 'https://exemplo.org/',
      'menu-item-title': 'Exemplo',
      'menu-item-classes': 'destaque  botao!',
      'menu-item-xfn': 'me friend',
    },
  });

  assert.deepEqual(mundo.gravacoes, [
    'wp_insert_post 100',
    'wp_set_object_terms 100 nav_menu',
    'update_post_meta 100 _menu_item_type',
    'update_post_meta 100 _menu_item_menu_item_parent',
    'update_post_meta 100 _menu_item_object_id',
    'update_post_meta 100 _menu_item_object',
    'update_post_meta 100 _menu_item_target',
    'update_post_meta 100 _menu_item_classes',
    'update_post_meta 100 _menu_item_xfn',
    'update_post_meta 100 _menu_item_url',
  ]);
  assert.equal(mundo.inseridos[0]?.post_status, 'draft');
  // `explode( ' ' )` mantem a parte vazia entre os dois espacos.
  assert.deepEqual(metadado(mundo, 100, METADADOS_DO_ITEM.classes), [
    'destaque',
    '',
    'botao',
  ]);
  assert.equal(metadado(mundo, 100, METADADOS_DO_ITEM.xfn), 'me friend');
});

test('CA-5.2 destino inexistente nao e recusado; menu inexistente e', () => {
  const mundo = mundoVazio();
  comMenu(mundo, 7, 'Principal', 'principal');
  const { contexto } = cenario({ mundo });

  // O conteudo 999 nao existe: o item e gravado assim mesmo (o orfao e US-6).
  assert.deepEqual(
    gravarItemDeMenu(contexto, {
      menuId: 7,
      itemId: 0,
      dados: { 'menu-item-type': 'post_type', 'menu-item-object': 'page', 'menu-item-object-id': '999' },
    }),
    { ok: true, itemId: 100 },
  );

  assert.deepEqual(
    gravarItemDeMenu(contexto, { menuId: 55, itemId: 0, dados: {} }),
    { ok: false, codigo: 'invalid_menu_id', mensagem: MENSAGEM_DE_MENU_INVALIDO },
  );
});

/* ── CA-5.3 — ordem e hierarquia preservadas e editaveis ───────────────────── */

test('CA-5.3 a posicao pedida 0 vem da lista renumerada: 0, depois 2, depois 3', () => {
  const mundo = mundoVazio();
  comMenu(mundo, 7, 'Principal', 'principal');
  const { contexto } = cenario({ mundo });

  for (const titulo of ['A', 'B', 'C']) {
    gravarItemDeMenu(contexto, {
      menuId: 7,
      itemId: 0,
      dados: {
        'menu-item-type': 'custom',
        'menu-item-title': titulo,
        'menu-item-status': 'publish',
      },
    });
  }

  assert.deepEqual(
    mundo.inseridos.map((pedido) => pedido.menu_order),
    [0, 2, 3],
  );
});

test('CA-5.3 com o menu so de rascunhos a contagem e zero, e a lista nem e consultada', () => {
  const mundo = mundoVazio();
  comMenu(mundo, 7, 'Principal', 'principal');
  comItem(mundo, 90, 7, 1, 'draft');
  const { contexto } = cenario({ mundo });

  gravarItemDeMenu(contexto, {
    menuId: 7,
    itemId: 0,
    dados: { 'menu-item-type': 'custom', 'menu-item-title': 'Novo' },
  });

  // `$menu->count > 0` (`nav-menu.php:741`) — a contagem do termo so conta
  // publicado, logo o rascunho existente nao empurra a posicao.
  assert.equal(mundo.inseridos[0]?.menu_order, 0);
});

test('CA-5.3 a hierarquia vai para _menu_item_menu_item_parent, e item nao e pai de si mesmo', () => {
  const mundo = mundoVazio();
  comMenu(mundo, 7, 'Principal', 'principal');
  comItem(mundo, 90, 7, 1);
  const { contexto } = cenario({ mundo });

  gravarItemDeMenu(contexto, {
    menuId: 7,
    itemId: 0,
    dados: {
      'menu-item-type': 'custom',
      'menu-item-title': 'Filho',
      'menu-item-parent-id': '90',
      'menu-item-position': '2',
    },
  });
  assert.equal(metadado(mundo, 100, METADADOS_DO_ITEM.pai), '90');
  // A coluna de pai do conteudo NAO guarda o item pai.
  assert.equal(mundo.inseridos[0]?.post_parent, 0);
  assert.equal(mundo.inseridos[0]?.menu_order, 2);

  gravarItemDeMenu(contexto, {
    menuId: 7,
    itemId: 100,
    dados: { 'menu-item-type': 'custom', 'menu-item-title': 'Filho', 'menu-item-parent-id': '100' },
  });
  assert.equal(metadado(mundo, 100, METADADOS_DO_ITEM.pai), '0');
  // Item existente sai publicado, salvo pedido de rascunho.
  assert.equal(mundo.atualizados[0]?.post_status, 'publish');
});

test('CA-5.3 gravar o menu pela tela regrava ordem e pai de cada item, e apaga o que nao veio', () => {
  const mundo = mundoVazio();
  comMenu(mundo, 7, 'Principal', 'principal');
  comItem(mundo, 100, 7, 1);
  comItem(mundo, 101, 7, 2);
  comItem(mundo, 102, 7, 3);
  comItem(mundo, 103, 7, 4);
  const { contexto, menus } = cenario({ mundo });

  const desfecho = menus.gravarMenu(contexto, {
    menu: 7,
    token: TOKEN_VALIDO,
    nomeDoMenu: 'Principal',
    itens: [
      {
        chave: '101',
        campos: {
          'menu-item-db-id': '101',
          'menu-item-type': 'custom',
          'menu-item-title': 'Segundo vira primeiro',
          'menu-item-position': '1',
          'menu-item-parent-id': '0',
        },
      },
      {
        chave: '100',
        campos: {
          'menu-item-db-id': '100',
          'menu-item-type': 'custom',
          'menu-item-title': 'Primeiro vira filho',
          'menu-item-position': '2',
          'menu-item-parent-id': '101',
        },
      },
      {
        // Titulo vazio: pulado, e por isso apagado no fim.
        chave: '102',
        campos: { 'menu-item-db-id': '102', 'menu-item-title': '' },
      },
    ],
  });

  assert.equal(desfecho.desfecho, 'tela');
  assert.equal(mundo.conteudos.get(101)?.ordem, 1);
  assert.equal(mundo.conteudos.get(100)?.ordem, 2);
  assert.equal(metadado(mundo, 100, METADADOS_DO_ITEM.pai), '101');
  assert.equal(metadado(mundo, 101, METADADOS_DO_ITEM.pai), '0');
  assert.equal(mundo.conteudos.has(102), false);
  assert.equal(mundo.conteudos.has(103), false);
  assert.deepEqual(
    desfecho.desfecho === 'tela' ? desfecho.avisos : null,
    [
      {
        tipo: 'atualizado',
        texto: '<strong>Principal</strong> has been updated.',
        dispensavel: true,
      },
    ],
  );

  // A contagem de termos e adiada em volta do lote.
  const adiamentos = mundo.gravacoes.filter((linha) =>
    linha.startsWith('wp_defer_term_counting'),
  );
  assert.deepEqual(adiamentos, [
    'wp_defer_term_counting true',
    'wp_defer_term_counting false',
  ]);
});

test('CA-5.3 nav_menu_options nasce com 0 => false na primeira gravacao (P1)', () => {
  const mundo = mundoVazio();
  comMenu(mundo, 7, 'Principal', 'principal');
  const { contexto, menus } = cenario({ mundo });

  menus.gravarMenu(contexto, { menu: 7, token: TOKEN_VALIDO, nomeDoMenu: 'Principal' });

  const gravada = mundo.opcoes.get(OPCAO_DAS_OPCOES_DE_MENU);
  assert.ok(gravada !== undefined);
  assert.equal(serializarComoTexto(gravada), 'a:2:{i:0;b:0;s:8:"auto_add";a:0:{}}');
});

/* ── CA-5.4 — a associacao a posicao do tema e configuracao do site ────────── */

test('CA-5.4 a posicao marcada e gravada em nav_menu_locations dentro de theme_mods_{folha}', () => {
  const porta = criarPortaDeDadosFalsa();
  const mundo = mundoVazio();
  comMenu(mundo, 7, 'Principal', 'principal');
  const { contexto, menus } = cenario({
    mundo,
    configuracaoDoTema: criarRepositorioDaConfiguracaoDoTema(porta.porta),
  });

  menus.gravarMenu(contexto, {
    menu: 7,
    token: TOKEN_VALIDO,
    nomeDoMenu: 'Principal',
    posicoes: [['primary', '7']],
  });

  // A primeira escrita da operacao e a associacao, antes do nome e dos itens
  // (`nav-menus.php:467`), e ela vai para a opcao de modificacoes do tema.
  const escrita = porta.escritas[0];
  assert.ok(escrita !== undefined);
  const parametros = escrita.parametros.map(textoDoParametro);
  assert.ok(parametros.includes(`theme_mods_${FOLHA}`));
  assert.ok(
    parametros.includes(
      'a:1:{s:18:"nav_menu_locations";a:1:{s:7:"primary";i:7;}}',
    ),
  );
});

test('CA-5.4 desmarcar a posicao a retira so se ela era deste menu', () => {
  const mundo = mundoVazio();
  comMenu(mundo, 7, 'Principal', 'principal');
  comMenu(mundo, 8, 'Rodape', 'rodape');
  mundo.modificacoes.set(
    'nav_menu_locations',
    arranjoPorNome([
      ['primary', inteiro(7)],
      ['footer', inteiro(8)],
    ]),
  );
  const { contexto, menus } = cenario({ mundo });

  menus.gravarMenu(contexto, { menu: 7, token: TOKEN_VALIDO, nomeDoMenu: 'Principal' });

  assert.deepEqual(
    mundo.modificacoes.get('nav_menu_locations'),
    arranjoPorNome([['footer', inteiro(8)]]),
  );
});

test('CA-5.4 a tela de posicoes mescla o mapa, e has_nav_menu so ve posicao declarada', () => {
  const mundo = mundoVazio();
  comMenu(mundo, 7, 'Principal', 'principal');
  mundo.modificacoes.set(
    'nav_menu_locations',
    arranjoPorNome([['antiga', inteiro(7)]]),
  );
  const { contexto, menus } = cenario({ mundo });

  const desfecho = menus.gravarPosicoes(contexto, {
    token: TOKEN_VALIDO,
    posicoes: [
      ['primary', '7'],
      ['footer', '0'],
    ],
  });

  assert.deepEqual(desfecho, {
    desfecho: 'tela',
    menuSelecionado: 0,
    tituloSelecionado: '',
    avisos: [
      { tipo: 'atualizado', texto: MENSAGEM_DE_POSICOES_ATUALIZADAS, dispensavel: true },
    ],
  });
  assert.deepEqual(
    mundo.modificacoes.get('nav_menu_locations'),
    arranjoPorNome([
      ['antiga', inteiro(7)],
      ['primary', inteiro(7)],
      ['footer', inteiro(0)],
    ]),
  );

  assert.equal(menus.temMenuNaPosicao(contexto, 'primary'), true);
  assert.equal(menus.temMenuNaPosicao(contexto, 'footer'), false);
  // Associada, mas o tema nao a declara.
  assert.equal(menus.temMenuNaPosicao(contexto, 'antiga'), false);
});

test('CA-5.4 menu novo com posicoes marcadas recebe todas elas', () => {
  const { contexto, mundo, menus } = cenario();

  menus.gravarMenu(contexto, {
    menu: 0,
    token: TOKEN_VALIDO,
    nomeDoMenu: 'Principal',
    posicoes: [
      ['primary', '0'],
      ['footer', '0'],
    ],
  });

  assert.deepEqual(
    mundo.modificacoes.get('nav_menu_locations'),
    arranjoPorNome([
      ['primary', inteiro(40)],
      ['footer', inteiro(40)],
    ]),
  );
});

/* ── CA-5.5 — sem posicao declarada, o menu ainda se usa ───────────────────── */

test('CA-5.5 tema so com widgets: a tela abre, o menu e criado e exibido pelo identificador', () => {
  const { contexto, mundo, menus } = cenario({
    posicoesDeclaradas: [],
    suportes: ['widgets'],
  });

  assert.equal(menus.abrirTela(contexto), null);

  const criado = menus.gravarMenu(contexto, {
    menu: 0,
    token: TOKEN_VALIDO,
    nomeDoMenu: 'Principal',
  });
  assert.equal(criado.desfecho, 'redirecionar');
  assert.equal(mundo.modificacoes.has('nav_menu_locations'), false);

  // O componente de menu pede o menu escolhido, sem posicao.
  const termoIdDe = (menu: number | string): number | null => {
    const achado = menus.menuParaExibir(contexto, { menu });
    return achado === false ? null : achado.termoId;
  };
  assert.equal(termoIdDe(40), 40);
  assert.equal(termoIdDe('principal'), 40);

  // Pela posicao, nao ha o que achar.
  assert.equal(menus.menuParaExibir(contexto, { posicao: 'primary' }), false);
  assert.equal(menus.temMenuNaPosicao(contexto, 'primary'), false);

  // A tela de posicoes nao existe para este tema: volta para a de menus.
  assert.deepEqual(
    menus.gravarPosicoes(contexto, { token: TOKEN_VALIDO, posicoes: [['primary', '40']] }),
    { desfecho: 'redirecionar', endereco: ENDERECO_DA_TELA_DE_MENUS },
  );
  assert.equal(mundo.modificacoes.has('nav_menu_locations'), false);
});

test('CA-5.5 o menu pedido vence a posicao, e sem ele a posicao associada e usada', () => {
  const mundo = mundoVazio();
  comMenu(mundo, 7, 'Principal', 'principal');
  comMenu(mundo, 8, 'Rodape', 'rodape');
  mundo.modificacoes.set('nav_menu_locations', arranjoPorNome([['primary', inteiro(8)]]));
  const { contexto, menus } = cenario({ mundo });

  const pedido = menus.menuParaExibir(contexto, { menu: 'principal', posicao: 'primary' });
  assert.equal(pedido === false ? null : pedido.termoId, 7);

  const pelaPosicao = menus.menuParaExibir(contexto, { posicao: 'primary' });
  assert.equal(pelaPosicao === false ? null : pelaPosicao.termoId, 8);
});

test('item gravado sem menu e rascunho orfao, na posicao 1, com o instante', () => {
  const { contexto, mundo } = cenario();

  gravarItemDeMenu(contexto, {
    menuId: 0,
    itemId: 0,
    dados: { 'menu-item-type': 'custom', 'menu-item-title': 'Solto', 'menu-item-position': '9' },
  });

  assert.equal(mundo.inseridos[0]?.menu_order, 1);
  assert.equal(mundo.inseridos[0]?.post_status, 'draft');
  assert.equal(metadado(mundo, 100, METADADOS_DO_ITEM.orfao), '1793872800');
  assert.equal(mundo.relacoes.has(100), false);

  // Ao entrar num menu, o marcador de orfao sai.
  comMenu(mundo, 7, 'Principal', 'principal');
  gravarItemDeMenu(contexto, {
    menuId: 7,
    itemId: 100,
    dados: { 'menu-item-type': 'custom', 'menu-item-title': 'Solto', 'menu-item-position': '1' },
  });
  assert.equal(metadado(mundo, 100, METADADOS_DO_ITEM.orfao), undefined);
  assert.deepEqual(mundo.relacoes.get(100), [7]);
});
