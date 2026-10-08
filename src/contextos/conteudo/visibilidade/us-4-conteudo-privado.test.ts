/**
 * Testes da entrega de **T009**: *"o comportamento de US-4 existe e os criterios
 * CA-4.1, CA-4.2, CA-4.3, CA-4.4 passam contra o sistema novo"*.
 *
 * **Nao sao os quatro testes de `backlog/tests.md`** — UT-022-1 a UT-022-4 sao
 * **T010**, a tarefa `[P]` que roda em paralelo com esta. Aqui se afirma o que
 * esta tarefa entrega, criterio por criterio, pelos meios que a Decisao 2 fixa:
 * **efeito no banco** (*"snapshot + sequencia de comandos"*) para o que vai a
 * coluna, e **decisao** para o que decide acesso.
 *
 * Cada afirmacao foi conferida contra o codigo do sistema analisado, legivel em
 * disco em `~/Downloads/wordpress` (WordPress 7.1.2, a mesma versao do pacote),
 * e por isso cita arquivo e linha. Quando o oraculo executavel existir (T001 da
 * feature 015), e por essas linhas que a comparacao caso a caso passa a rodar.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ATOR_ANONIMO,
  REDE_INATIVA_NA_AUTORIZACAO,
  capacidadesExigidas,
  casoDeConteudo,
  comAtor,
  perguntarPermissao,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type ConteudoNaAutorizacao,
  type EstadoDeConteudoNaAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type MatrizDePapeis,
  type TipoDeConteudoNaAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import { criarRepositorioDeConteudo } from '../armazenamento/index.js';
import {
  criarPortaDeDadosFalsa,
  textoDoParametro,
} from '../armazenamento/porta-falsa.js';
import {
  ESTADOS_EDITORIAIS,
  PROPRIEDADES_DO_ESTADO_EDITORIAL,
} from '../estado-editorial.js';
import {
  CODIGO_DE_RECUSA_DE_PUBLICACAO,
  ESTADO_PUBLICADO,
  MENSAGEM_DE_RECUSA_DE_CONTEUDO_PRIVADO,
  MENSAGEM_DE_RECUSA_DE_PUBLICACAO,
} from '../publicacao/index.js';
import {
  CAPACIDADE_DE_CONTEUDO_PRIVADO,
  CAPACIDADE_DE_LEITURA_PEDIDA,
  ESTADOS_DO_MAPA_DO_SITE,
  ESTADO_DO_REBAIXAMENTO_SEM_ESTADO_ANTERIOR,
  ESTADO_PRIVADO,
  REGISTRO_DE_FABRICA,
  SLOT_DE_LEITURA_DE_CONTEUDO_PRIVADO,
  VISIBILIDADES,
  autorizarConteudoPrivado,
  decidirLeituraDeConteudoPrivado,
  escolherVisibilidade,
  estadoEntraNoMapaDoSite,
  estadosComAPropriedade,
  recorteDaConsultaPublica,
  resolverVisibilidade,
  type ContextoDeVisibilidade,
} from './index.js';

/* ── O CENARIO ─────────────────────────────────────────────────────────────── */

const ID = 42;
const AUTOR = 7;
const OUTRA_CONTA = 9;

/**
 * A matriz de papeis do cenario, com o recorte que esta tarefa exercita.
 *
 * `read_private_posts` e `read_private_pages` sao os slots derivados de
 * `capability_type` pelo registro do tipo (`wp-includes/post.php:1884`), e
 * nenhuma capacidade de pagina chega a autor — *"a assimetria e deliberada"*
 * (US-8). `read` e a capacidade comum de leitura, concedida a todo papel
 * (`permissions.md`, matriz de fabrica).
 */
const MATRIZ: MatrizDePapeis = [
  {
    identificador: 'author',
    capacidades: [
      { capacidade: 'read', concedida: true },
      { capacidade: 'edit_posts', concedida: true },
      { capacidade: 'publish_posts', concedida: true },
    ],
  },
  {
    identificador: 'contributor',
    capacidades: [
      { capacidade: 'read', concedida: true },
      { capacidade: 'edit_posts', concedida: true },
    ],
  },
  {
    identificador: 'subscriber',
    capacidades: [{ capacidade: 'read', concedida: true }],
  },
  {
    identificador: 'editor',
    capacidades: [
      { capacidade: 'read', concedida: true },
      { capacidade: 'edit_posts', concedida: true },
      { capacidade: 'edit_others_posts', concedida: true },
      { capacidade: 'publish_posts', concedida: true },
      { capacidade: 'read_private_posts', concedida: true },
      { capacidade: 'edit_pages', concedida: true },
      { capacidade: 'publish_pages', concedida: true },
      { capacidade: 'read_private_pages', concedida: true },
    ],
  },
];

/** `get_post_type_object( 'post' )`, com os campos que decidem. */
const TIPO_POST: TipoDeConteudoNaAutorizacao = {
  nome: 'post',
  traduzMetaCapacidade: true,
  capacidades: {
    read: 'read',
    read_post: 'read_post',
    edit_posts: 'edit_posts',
    edit_others_posts: 'edit_others_posts',
    publish_posts: 'publish_posts',
    read_private_posts: 'read_private_posts',
  },
};

/** `get_post_type_object( 'page' )` — os slots valem outros nomes. */
const TIPO_PAGINA: TipoDeConteudoNaAutorizacao = {
  nome: 'page',
  traduzMetaCapacidade: true,
  capacidades: {
    read: 'read',
    read_post: 'read_page',
    edit_posts: 'edit_pages',
    edit_others_posts: 'edit_others_pages',
    publish_posts: 'publish_pages',
    read_private_posts: 'read_private_pages',
  },
};

const TIPOS: Readonly<Record<string, TipoDeConteudoNaAutorizacao>> = {
  post: TIPO_POST,
  page: TIPO_PAGINA,
};

/** `get_post_status_object()`, com os dois sinalizadores que o caso de ler le. */
const ESTADOS_REGISTRADOS: Readonly<
  Record<string, EstadoDeConteudoNaAutorizacao>
> = {
  publish: { nome: 'publish', publico: true, privado: false },
  private: { nome: 'private', publico: false, privado: true },
  draft: { nome: 'draft', publico: false, privado: false },
};

function ator(papel: string, contaId = AUTOR): AtorDeAutorizacao {
  return {
    contaId,
    login: papel,
    existe: true,
    concessoes: [{ capacidade: papel, concedida: true }],
  };
}

interface OpcoesDoCenario {
  readonly papel?: string;
  readonly atorDaRequisicao?: AtorDeAutorizacao;
  readonly conteudo?: Partial<ConteudoNaAutorizacao>;
  /** `get_post()` devolve `null`: o conteudo nao existe. */
  readonly conteudoInexistente?: boolean;
  readonly tipos?: Readonly<Record<string, TipoDeConteudoNaAutorizacao>>;
}

/** A linha de conteudo como `map_meta_cap()` a le. */
function conteudoNaAutorizacao(
  campos: Partial<ConteudoNaAutorizacao> = {},
): ConteudoNaAutorizacao {
  return {
    id: ID,
    tipo: 'post',
    estado: ESTADO_PRIVADO,
    estadoParaLeitura: ESTADO_PRIVADO,
    autorId: AUTOR,
    paiId: 0,
    ...campos,
  };
}

/**
 * O contexto da requisicao, com o caso de conteudo registrado em
 * `casosDeTraducao` — que e o que `contexto-de-visibilidade.ts` exige e o que o
 * arranque do sistema faz uma vez.
 */
function cenario(opcoes: OpcoesDoCenario = {}): ContextoDeVisibilidade {
  const tipos = opcoes.tipos ?? TIPOS;
  const conteudo = opcoes.conteudoInexistente
    ? null
    : conteudoNaAutorizacao(opcoes.conteudo);

  const fonte: FonteDeConteudoNaAutorizacao = {
    conteudo() {
      return conteudo;
    },
    tipoDeConteudo(nome) {
      return tipos[nome] ?? null;
    },
    estadoDeConteudo(nome) {
      return ESTADOS_REGISTRADOS[nome] ?? null;
    },
    estadoAnteriorNaLixeira() {
      return '';
    },
    paginaInicial() {
      return 0;
    },
    paginaDeConteudos() {
      return 0;
    },
    paginaDePoliticaDePrivacidade() {
      return 0;
    },
  };

  const base: BaseDeAutorizacao = {
    matriz: MATRIZ,
    rede: REDE_INATIVA_NA_AUTORIZACAO,
    casosDeTraducao: [casoDeConteudo(fonte)],
  };

  return {
    base,
    ator: opcoes.atorDaRequisicao ?? ator(opcoes.papel ?? 'author'),
    tipoDeConteudo(nome) {
      return tipos[nome] ?? null;
    },
  };
}

/* ── CA-4.1: UM ESTADO DISTINTO DE PUBLICADO ───────────────────────────────── */

test('CA-4.1 a visibilidade privada resolve no estado `private`, que nao e `publish`', () => {
  // `wp-admin/includes/post.php:326`-`:330`.
  const resolvida = resolverVisibilidade('private');

  assert.equal(resolvida.estado, ESTADO_PRIVADO);
  assert.equal(resolvida.estado, 'private');
  assert.notEqual(resolvida.estado, ESTADO_PUBLICADO);
});

test('CA-4.1 `private` e um dos 12 estados do vocabulario, e nao e publico', () => {
  // `wp-includes/post.php:718`-`:730`: registrado com 'private' => true e SEM
  // 'public'. E o que faz os outros tres criterios desta historia valerem.
  assert.ok(ESTADOS_EDITORIAIS.includes('private'));
  assert.equal(PROPRIEDADES_DO_ESTADO_EDITORIAL.private.privado, true);
  assert.equal(PROPRIEDADES_DO_ESTADO_EDITORIAL.private.publico, false);
  // E `publish` e o oposto exato, na mesma coluna (`:661`).
  assert.equal(PROPRIEDADES_DO_ESTADO_EDITORIAL.publish.publico, true);
  assert.equal(PROPRIEDADES_DO_ESTADO_EDITORIAL.publish.privado, false);
});

test('CA-4.1 o ramo privado apaga a senha de conteudo e retira a fixacao no topo', () => {
  // `:327`-`:329`: os tres efeitos do mesmo `case`.
  const resolvida = resolverVisibilidade('private');

  assert.equal(resolvida.senha, '');
  assert.equal(resolvida.mantemAFixacaoNoTopo, false);
});

test('CA-4.1 os outros dois ramos do `switch` nao tocam no estado', () => {
  // `:320`-`:325`: `public` so apaga a senha; `password` so retira a fixacao.
  // Voltar de privado para publico NAO poe `publish` na coluna.
  const publico = resolverVisibilidade('public');
  assert.equal(publico.estado, null);
  assert.equal(publico.senha, '');
  assert.equal(publico.mantemAFixacaoNoTopo, true);

  const comSenha = resolverVisibilidade('password');
  assert.equal(comSenha.estado, null);
  assert.equal(comSenha.senha, null);
  assert.equal(comSenha.mantemAFixacaoNoTopo, false);
});

test('CA-4.1 valor fora dos tres nao faz nada: o `switch` do legado nao tem `default`', () => {
  const nenhum = resolverVisibilidade('visibilidade-de-extensao');

  assert.equal(nenhum.estado, null);
  assert.equal(nenhum.senha, null);
  assert.equal(nenhum.mantemAFixacaoNoTopo, true);
  // E as tres do legado continuam sendo tres, na ordem dos `case`.
  assert.deepEqual([...VISIBILIDADES], ['public', 'password', 'private']);
});

test('CA-4.1 EFEITO NO BANCO: os campos resolvidos levam `private` a coluna', () => {
  // O circuito que `escolher-visibilidade.ts` descreve: a operacao resolve, o
  // repositorio de T002 escreve. O `UPDATE` e o de `armazenamento/conteudo.ts`,
  // e o que se afirma aqui sao os BYTES do parametro.
  const contexto = cenario({ papel: 'author' });
  const resultado = escolherVisibilidade(contexto, {
    tipoDeConteudo: 'post',
    visibilidade: 'private',
  });

  assert.equal(resultado.desfecho, 'resolvida');
  assert.deepEqual({ ...resultado.campos }, { estado: 'private', senha: '' });

  const dados = criarPortaDeDadosFalsa();
  criarRepositorioDeConteudo(dados.porta).atualizar(ID, resultado.campos);

  const escrita = dados.escritas[0];
  assert.ok(escrita !== undefined, 'nao houve escrita');
  assert.equal(
    escrita.texto,
    'UPDATE wp_posts SET post_status = ?, post_password = ? WHERE ID = ?',
  );
  assert.deepEqual(escrita.parametros.map(textoDoParametro), [
    'private',
    '',
    String(ID),
  ]);
});

test('CA-4.1 a capacidade exigida e a de PUBLICAR daquele tipo, com o texto do `case private`', () => {
  // `class-wp-rest-posts-controller.php:1575`-`:1583`: mesmo slot da
  // publicacao, mesmo codigo de erro, texto proprio.
  assert.equal(CAPACIDADE_DE_CONTEUDO_PRIVADO, 'publish_posts');

  const semPermissao = cenario({ papel: 'contributor' });
  const recusa = autorizarConteudoPrivado(semPermissao, 'post');

  assert.ok(recusa !== null);
  assert.equal(recusa.codigo, CODIGO_DE_RECUSA_DE_PUBLICACAO);
  assert.equal(recusa.mensagem, MENSAGEM_DE_RECUSA_DE_CONTEUDO_PRIVADO);
  assert.equal(recusa.codigoHttp, 403);
  // E o texto NAO e o da publicacao: os dois `case` tem textos diferentes.
  assert.notEqual(recusa.mensagem, MENSAGEM_DE_RECUSA_DE_PUBLICACAO);

  assert.equal(autorizarConteudoPrivado(cenario({ papel: 'author' }), 'post'), null);
});

test('CA-4.1 recusado, NENHUM campo e resolvido: o estado pedido nao chega a coluna', () => {
  const contexto = cenario({ papel: 'contributor' });
  const resultado = escolherVisibilidade(contexto, {
    tipoDeConteudo: 'post',
    visibilidade: 'private',
  });

  assert.equal(resultado.desfecho, 'recusada');
  assert.deepEqual({ ...resultado.campos }, {});

  // Efeito no banco: NENHUM comando sai, porque nao ha campo a escrever.
  const dados = criarPortaDeDadosFalsa();
  criarRepositorioDeConteudo(dados.porta).atualizar(ID, resultado.campos);
  assert.deepEqual(dados.escritas, []);
});

test('CA-4.1 o nome da capacidade vem do registro do tipo: pagina exige `publish_pages`', () => {
  // Sem um unico `if` sobre o nome `page`: e o slot do registro.
  const editor = ator('editor', OUTRA_CONTA);
  const autorComum = ator('author');

  assert.equal(
    autorizarConteudoPrivado({ ...cenario(), ator: editor }, 'page'),
    null,
  );
  assert.ok(
    autorizarConteudoPrivado({ ...cenario(), ator: autorComum }, 'page') !==
      null,
  );
});

test('CA-4.1 tipo nao registrado fecha a porta, com a mesma recusa', () => {
  // `PERM-4` (BR-MIGRAR-090): *"todo caminho de erro fecha a porta"*.
  const contexto = cenario({ papel: 'editor', tipos: {} });
  const recusa = autorizarConteudoPrivado(contexto, 'post');

  assert.ok(recusa !== null);
  assert.equal(recusa.mensagem, MENSAGEM_DE_RECUSA_DE_CONTEUDO_PRIVADO);
});

test('CA-4.1 o anonimo recebe 401 e nao 403, como o legado', () => {
  // `rest_authorization_required_code()`, `wp-includes/rest-api.php:1438`.
  const contexto = { ...cenario(), ator: ATOR_ANONIMO };
  const recusa = autorizarConteudoPrivado(contexto, 'post');

  assert.ok(recusa !== null);
  assert.equal(recusa.codigoHttp, 401);
});

/* ── CA-4.2: A LEITURA EXIGE A CAPACIDADE DE LER PRIVADO ───────────────────── */

test('CA-4.2 `read_post` sobre conteudo privado resolve em `read_private_posts` do tipo', () => {
  // `wp-includes/capabilities.php:376`-`:377`. A traducao e da plataforma, e e
  // ela que esta afirmacao fixa — nao uma pergunta direta pela capacidade.
  const contexto = cenario({
    atorDaRequisicao: ator('subscriber', OUTRA_CONTA),
  });

  assert.deepEqual(
    [
      ...capacidadesExigidas(
        comAtor(contexto.base, contexto.ator),
        CAPACIDADE_DE_LEITURA_PEDIDA,
        ID,
      ),
    ],
    [SLOT_DE_LEITURA_DE_CONTEUDO_PRIVADO],
  );
  assert.equal(SLOT_DE_LEITURA_DE_CONTEUDO_PRIVADO, 'read_private_posts');
});

test('CA-4.2 quem tem a capacidade le, quem nao tem nao le', () => {
  const comCapacidade = cenario({
    atorDaRequisicao: ator('editor', OUTRA_CONTA),
  });
  const semCapacidade = cenario({
    atorDaRequisicao: ator('subscriber', OUTRA_CONTA),
  });

  assert.equal(
    decidirLeituraDeConteudoPrivado(comCapacidade, ID),
    'servido',
  );
  assert.equal(
    decidirLeituraDeConteudoPrivado(semCapacidade, ID),
    'indistinguivel-de-inexistente',
  );
});

test('CA-4.2 o autor le o PROPRIO conteudo privado sem ter `read_private_posts`', () => {
  // `wp-includes/capabilities.php:374`-`:375`: para o autor o caso devolve
  // `read`, e nao a capacidade privada. Perguntar direto por
  // `read_private_posts` perderia este ramo.
  const contexto = cenario({ atorDaRequisicao: ator('author', AUTOR) });

  assert.deepEqual(
    [
      ...capacidadesExigidas(
        comAtor(contexto.base, contexto.ator),
        CAPACIDADE_DE_LEITURA_PEDIDA,
        ID,
      ),
    ],
    ['read'],
  );
  assert.equal(decidirLeituraDeConteudoPrivado(contexto, ID), 'servido');
});

test('CA-4.2 a capacidade e a do tipo: pagina privada exige `read_private_pages`', () => {
  const contexto = cenario({
    atorDaRequisicao: ator('subscriber', OUTRA_CONTA),
    conteudo: { tipo: 'page' },
  });

  assert.deepEqual(
    [
      ...capacidadesExigidas(
        comAtor(contexto.base, contexto.ator),
        CAPACIDADE_DE_LEITURA_PEDIDA,
        ID,
      ),
    ],
    ['read_private_pages'],
  );
});

/* ── CA-4.3: A MESMA RESPOSTA DE CONTEUDO INEXISTENTE ──────────────────────── */

test('CA-4.3 o visitante anonimo recebe o desfecho de conteudo inexistente', () => {
  // `class-wp-query.php:3539`-`:3541`: *"User must be logged in to view
  // unpublished posts."* O conjunto fica vazio, e quem decide a resposta a
  // partir disso e `handle_404()` (`class-wp.php:724`).
  const contexto = { ...cenario(), ator: ATOR_ANONIMO };

  assert.equal(
    decidirLeituraDeConteudoPrivado(contexto, ID),
    'indistinguivel-de-inexistente',
  );
});

test('CA-4.3 o desfecho do privado negado e o MESMO do conteudo que nao existe', () => {
  // E a invariante do criterio: nada no caminho distingue "nao existe" de
  // "existe e voce nao pode". As duas chamadas devolvem o mesmo valor.
  const privadoNegado = cenario({
    atorDaRequisicao: ator('subscriber', OUTRA_CONTA),
  });
  const inexistente = cenario({
    atorDaRequisicao: ator('subscriber', OUTRA_CONTA),
    conteudoInexistente: true,
  });

  assert.equal(
    decidirLeituraDeConteudoPrivado(privadoNegado, ID),
    decidirLeituraDeConteudoPrivado(inexistente, ID),
  );
  assert.equal(
    decidirLeituraDeConteudoPrivado(inexistente, ID),
    'indistinguivel-de-inexistente',
  );
});

test('CA-4.3 o anonimo e negado ANTES da capacidade, e nao por ela', () => {
  // A dupla negacao do legado: conceder `read_private_posts` ao ator anonimo
  // pelo ponto `user_has_cap` NAO abre o conteudo privado, porque
  // `is_user_logged_in()` vem antes (`class-wp-query.php:3539`).
  const contexto = cenario();
  const anonimoComCapacidade: ContextoDeVisibilidade = {
    ...contexto,
    ator: ATOR_ANONIMO,
    base: {
      ...contexto.base,
      ganchos: {
        aoMontarCapacidadesDoAtor: (capacidades) =>
          new Map(capacidades).set(SLOT_DE_LEITURA_DE_CONTEUDO_PRIVADO, true),
      },
    },
  };

  // A capacidade esta de fato concedida ao anonimo pelo ponto de extensao: a
  // pergunta primitiva passa ...
  assert.equal(
    perguntarPermissao(
      comAtor(anonimoComCapacidade.base, ATOR_ANONIMO),
      SLOT_DE_LEITURA_DE_CONTEUDO_PRIVADO,
    ),
    true,
  );
  // ... e o desfecho continua sendo o de conteudo inexistente.
  assert.equal(
    decidirLeituraDeConteudoPrivado(anonimoComCapacidade, ID),
    'indistinguivel-de-inexistente',
  );
});

/* ── CA-4.4: FORA DE LISTAGEM, FEED E SITEMAP ──────────────────────────────── */

test('CA-4.4 o registro de fabrica tem UM estado publico e UM privado', () => {
  // `get_post_stati( array( 'public' => true ) )`, `wp-includes/post.php:1579`.
  assert.deepEqual([...estadosComAPropriedade(REGISTRO_DE_FABRICA, 'publico')], [
    'publish',
  ]);
  assert.deepEqual([...estadosComAPropriedade(REGISTRO_DE_FABRICA, 'privado')], [
    'private',
  ]);
});

test('CA-4.4 a listagem publica do visitante anonimo nao admite `private`', () => {
  // `class-wp-query.php:2760`: o ramo dos privados e inteiro condicionado a
  // `is_user_logged_in()`. O feed herda esta clausula (`functions.php:1612`).
  const recorte = recorteDaConsultaPublica(REGISTRO_DE_FABRICA, {
    autenticado: false,
    podeLerConteudoPrivado: false,
  });

  assert.deepEqual([...recorte.estados], ['publish']);
  assert.deepEqual([...recorte.estadosDoProprioAutor], []);
  assert.ok(!recorte.estados.includes(ESTADO_PRIVADO));
});

test('CA-4.4 quem tem a capacidade ve `private` na listagem, sem recorte de autoria', () => {
  const recorte = recorteDaConsultaPublica(REGISTRO_DE_FABRICA, {
    autenticado: true,
    podeLerConteudoPrivado: true,
  });

  // A ordem e a do registro: os publicos antes dos privados, como o legado
  // concatena os `OR`.
  assert.deepEqual([...recorte.estados], ['publish', 'private']);
  assert.deepEqual([...recorte.estadosDoProprioAutor], []);
});

test('CA-4.4 autenticado sem a capacidade ve `private` SO do proprio autor', () => {
  // `class-wp-query.php:2764`, o ramo `: " OR ( post_author = $user_id AND ... )"`.
  const recorte = recorteDaConsultaPublica(REGISTRO_DE_FABRICA, {
    autenticado: true,
    podeLerConteudoPrivado: false,
  });

  assert.deepEqual([...recorte.estados], ['publish']);
  assert.deepEqual([...recorte.estadosDoProprioAutor], ['private']);
});

test('CA-4.4 o estado publico registrado por EXTENSAO entra na listagem', () => {
  // O P2 poe `register_post_status()` no contrato publico, e e por isso que a
  // lista sai do registro e nao de um literal.
  const comEstadoDeExtensao = {
    ...REGISTRO_DE_FABRICA,
    arquivado: {
      ...PROPRIEDADES_DO_ESTADO_EDITORIAL.publish,
    },
  };

  assert.deepEqual(
    [...estadosComAPropriedade(comEstadoDeExtensao, 'publico')],
    ['publish', 'arquivado'],
  );
});

test('CA-4.4 o mapa do site pede `publish` por nome, e nao mostra `private` a ninguem', () => {
  // `class-wp-sitemaps-posts.php:244` e `:123`: literal, nao consulta ao
  // registro — logo nem o super administrador ve privado no mapa do site.
  assert.deepEqual([...ESTADOS_DO_MAPA_DO_SITE], ['publish']);
  assert.equal(estadoEntraNoMapaDoSite(ESTADO_PUBLICADO), true);
  assert.equal(estadoEntraNoMapaDoSite(ESTADO_PRIVADO), false);
});

/* ── O QUE ESTA TAREFA DECLARA E NAO APLICA ────────────────────────────────── */

test('o rebaixamento do painel esta declarado com o valor do legado, e nao aplicado', () => {
  // `wp-admin/includes/post.php:142`-`:143`: pedir privado sem poder publicar
  // grava o estado ANTERIOR, ou `pending` quando nao ha. E diferente do
  // rebaixamento de `publish`, que vai sempre para `pending` — a analise esta
  // em `permissao-de-conteudo-privado.ts`, e quem o aplica e T005 / T015.
  assert.equal(ESTADO_DO_REBAIXAMENTO_SEM_ESTADO_ANTERIOR, 'pending');

  // A operacao desta tarefa RECUSA em lugar de rebaixar, e nao grava estado
  // nenhum nesse caminho.
  const resultado = escolherVisibilidade(cenario({ papel: 'contributor' }), {
    tipoDeConteudo: 'post',
    visibilidade: 'private',
  });
  assert.equal(resultado.desfecho, 'recusada');
  assert.equal(resultado.campos.estado, undefined);
});

test('o valor de `private` e o mesmo nos dois lados da fronteira', () => {
  // Divergir `ESTADO_PRIVADO` deste contexto do da plataforma quebraria CA-4.2
  // sem quebrar teste nenhum de nenhum dos dois lados. A plataforma o declara
  // em `conteudo-na-autorizacao.ts`, e a afirmacao aqui e pelo comportamento:
  // uma linha com ESTE valor resolve na capacidade privada.
  const contexto = cenario({
    atorDaRequisicao: ator('subscriber', OUTRA_CONTA),
    conteudo: { estado: ESTADO_PRIVADO, estadoParaLeitura: ESTADO_PRIVADO },
  });

  assert.deepEqual(
    [
      ...capacidadesExigidas(
        comAtor(contexto.base, contexto.ator),
        CAPACIDADE_DE_LEITURA_PEDIDA,
        ID,
      ),
    ],
    ['read_private_posts'],
  );
});
