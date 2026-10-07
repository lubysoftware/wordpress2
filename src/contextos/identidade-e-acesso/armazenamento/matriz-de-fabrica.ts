/**
 * A matriz de fabrica: as oito rotinas de povoamento de papeis do legado.
 *
 * `DB-SEED` (BR-MIGRAR-084) diz por que ela existe: *"o esquema vazio nao e
 * funcional: parte da regra esta nas linhas que o instalador cria"*. E a
 * `PERM-13` diz quando ela roda — e so quando: **ao instalar, ao atualizar e ao
 * criar site de rede** (BR-MIGRAR-067). Depois disso a opcao gravada e a
 * verdade. Nada deste arquivo e chamado em carregamento, em requisicao, nem
 * "para garantir": repovoar fora desses tres momentos apaga customizacao
 * legitima da instalacao, que o ADR-0001 declara dado do produto.
 *
 * **As oito funcoes existem separadas de proposito.** Elas estao no legado uma
 * a uma, nomeadas pela versao em que nasceram, e nunca foram removidas — o P8
 * da constituicao cita exatamente isso ("oito funcoes de atualizacao de papeis
 * que nunca foram removidas continuam no codigo"). Fundi-las numa tabela
 * declarativa perderia a ordem em que as concessoes entram, que e o que decide
 * os bytes gravados na opcao, e perderia superficie publica que P8 proibe
 * remover.
 *
 * ---
 *
 * # 🔴 PARADA: esta tarefa esbarra num conflito que ela nao resolve
 *
 * **As pseudocapacidades de nivel numerico (`level_0` a `level_10`) estao em
 * disputa, e as duas partes sao decisao humana.**
 *
 * | lado | o que manda | onde esta escrito |
 * |---|---|---|
 * | manter as 11 | a matriz de fabrica E a matriz real da instalacao, e o legado semeia nivel em todos os papeis | resposta 5 de `questions.md`; P1 da constituicao; a entrega de T002 em `tasks.md`, *"com as mesmas concessoes que o legado semeia"* |
 * | remover as 11 | sao pseudocapacidades de um modelo abandonado, nao consultadas por decisao nenhuma, e inflam a matriz em 22% | card `REQ-017`, prioridade `wont`, em `spec.md` § *Fora de escopo* |
 *
 * A propria spec registra o conflito e se recusa a resolve-lo: *"as duas
 * decisoes sao humanas e ninguem as reconciliou; este pacote nao escolhe por
 * ninguem"*. A tabela **Nao negociavel** da constituicao poe "resolver um dos
 * conflitos entre card `wont` e resposta humana" fora do alcance de quem
 * codifica. E o risco 1 do `plan.md` avisa o custo: *"comecar pelo lado errado
 * joga fora a tarefa de povoamento e os testes dela"*.
 *
 * **O que foi feito aqui, entao:** o lado do conflito e um **argumento
 * obrigatorio, sem valor padrao**. Nenhuma chamada compila sem alguem escolher,
 * e a escolha fica legivel na composicao, nao escondida num default. As duas
 * matrizes estao implementadas e testadas, logo nenhum dos dois lados custa
 * retrabalho quando a decisao vier. O que **nao** foi feito: escolher.
 *
 * Duas consequencias do lado `req-017` que quem decidir precisa ter na mao,
 * porque elas nao estao no card:
 *
 * 1. a chave `{site}user_level` do metadado e **derivada** dessas capacidades
 *    (ver `chaves-e-tabelas.ts`), e o card nao diz o que acontece com ela;
 * 2. a definicao de papel e legivel pela interface de papeis do produto, logo
 *    remover as 11 muda o que um programa de terceiro le — o que e o argumento
 *    do outro lado, e esta na propria spec.
 */

import {
  criarConstrutorDeDefinicao,
  type DefinicaoDePapeis,
} from './papel.js';

/**
 * Qual lado do conflito REQ-017 esta sendo construido. **Nao ha padrao.**
 *
 * - `legado-integral`: a matriz com as 61 concessoes que o legado semeia,
 *   incluindo as 11 de nivel numerico (resposta 5, P1, entrega de T002).
 * - `req-017-sem-niveis`: a matriz com as 50 concessoes reais, sem nivel
 *   numerico nenhum (card `REQ-017`, `wont`).
 */
export type LadoDoConflitoDeNivelNumerico =
  | 'legado-integral'
  | 'req-017-sem-niveis';

/** Os cinco papeis de fabrica, com o nome exibido como o legado o grava. */
const PAPEIS = [
  ['administrator', 'Administrator'],
  ['editor', 'Editor'],
  ['author', 'Author'],
  ['contributor', 'Contributor'],
  ['subscriber', 'Subscriber'],
] as const;

/** As capacidades do administrador na primeira rotina, na ordem em que entram. */
const ADMINISTRADOR_160 = [
  'switch_themes',
  'edit_themes',
  'activate_plugins',
  'edit_plugins',
  'edit_users',
  'edit_files',
  'manage_options',
  'moderate_comments',
  'manage_categories',
  'manage_links',
  'upload_files',
  'import',
  'unfiltered_html',
  'edit_posts',
  'edit_others_posts',
  'edit_published_posts',
  'publish_posts',
  'edit_pages',
  'read',
] as const;

const EDITOR_160 = [
  'moderate_comments',
  'manage_categories',
  'manage_links',
  'upload_files',
  'unfiltered_html',
  'edit_posts',
  'edit_others_posts',
  'edit_published_posts',
  'publish_posts',
  'edit_pages',
  'read',
] as const;

const AUTOR_160 = [
  'upload_files',
  'edit_posts',
  'edit_published_posts',
  'publish_posts',
  'read',
] as const;

const COLABORADOR_160 = ['edit_posts', 'read'] as const;

const ASSINANTE_160 = ['read'] as const;

/** As quinze capacidades de pagina e de conteudo privado da segunda rotina. */
const PAGINA_E_PRIVADO_210 = [
  'edit_others_pages',
  'edit_published_pages',
  'publish_pages',
  'delete_pages',
  'delete_others_pages',
  'delete_published_pages',
  'delete_posts',
  'delete_others_posts',
  'delete_published_posts',
  'delete_private_posts',
  'edit_private_posts',
  'read_private_posts',
  'delete_private_pages',
  'edit_private_pages',
  'read_private_pages',
] as const;

/**
 * Os niveis numericos de cada papel, do maior para o menor — a ordem do legado.
 *
 * 🔴 Esta tabela e **o objeto do conflito**. Ver o cabecalho do arquivo.
 */
const NIVEIS_160: readonly (readonly [string, number])[] = [
  ['administrator', 10],
  ['editor', 7],
  ['author', 2],
  ['contributor', 1],
  ['subscriber', 0],
];

/**
 * A matriz de fabrica inteira: as oito rotinas, na ordem em que o legado as
 * chama.
 *
 * O lado do conflito e obrigatorio e nao tem padrao — ver o cabecalho.
 */
export function povoarPapeis(
  lado: LadoDoConflitoDeNivelNumerico,
): DefinicaoDePapeis {
  const construtor = criarConstrutorDeDefinicao();
  povoarPapeis160(construtor, lado);
  povoarPapeis210(construtor);
  povoarPapeis230(construtor);
  povoarPapeis250(construtor);
  povoarPapeis260(construtor);
  povoarPapeis270(construtor);
  povoarPapeis280(construtor);
  povoarPapeis300(construtor);
  return construtor.resultado();
}

type Construtor = ReturnType<typeof criarConstrutorDeDefinicao>;

/** Cria os cinco papeis e concede o que a versao 1.6 do legado concedia. */
export function povoarPapeis160(
  construtor: Construtor,
  lado: LadoDoConflitoDeNivelNumerico,
): void {
  for (const [identificador, nome] of PAPEIS) {
    construtor.adicionarPapel(identificador, nome);
  }

  conceder(construtor, 'administrator', ADMINISTRADOR_160);
  concederNiveis(construtor, 'administrator', lado);

  conceder(construtor, 'editor', EDITOR_160);
  concederNiveis(construtor, 'editor', lado);

  conceder(construtor, 'author', AUTOR_160);
  concederNiveis(construtor, 'author', lado);

  conceder(construtor, 'contributor', COLABORADOR_160);
  concederNiveis(construtor, 'contributor', lado);

  conceder(construtor, 'subscriber', ASSINANTE_160);
  concederNiveis(construtor, 'subscriber', lado);
}

/** Pagina e conteudo privado, para administrador e editor; e apagar, abaixo. */
export function povoarPapeis210(construtor: Construtor): void {
  for (const identificador of ['administrator', 'editor']) {
    conceder(construtor, identificador, PAGINA_E_PRIVADO_210);
  }
  conceder(construtor, 'administrator', ['delete_users', 'create_users']);
  conceder(construtor, 'author', ['delete_posts', 'delete_published_posts']);
  conceder(construtor, 'contributor', ['delete_posts']);
}

export function povoarPapeis230(construtor: Construtor): void {
  conceder(construtor, 'administrator', ['unfiltered_upload']);
}

export function povoarPapeis250(construtor: Construtor): void {
  conceder(construtor, 'administrator', ['edit_dashboard']);
}

export function povoarPapeis260(construtor: Construtor): void {
  conceder(construtor, 'administrator', ['update_plugins', 'delete_plugins']);
}

export function povoarPapeis270(construtor: Construtor): void {
  conceder(construtor, 'administrator', ['install_plugins', 'update_themes']);
}

export function povoarPapeis280(construtor: Construtor): void {
  conceder(construtor, 'administrator', ['install_themes']);
}

export function povoarPapeis300(construtor: Construtor): void {
  conceder(construtor, 'administrator', [
    'update_core',
    'list_users',
    'remove_users',
    'promote_users',
    'edit_theme_options',
    'delete_themes',
    'export',
  ]);
}

function conceder(
  construtor: Construtor,
  identificador: string,
  capacidades: readonly string[],
): void {
  for (const capacidade of capacidades) {
    construtor.adicionarCapacidade(identificador, capacidade);
  }
}

function concederNiveis(
  construtor: Construtor,
  identificador: string,
  lado: LadoDoConflitoDeNivelNumerico,
): void {
  if (lado === 'req-017-sem-niveis') {
    return;
  }
  const entrada = NIVEIS_160.find(([papel]) => papel === identificador);
  if (entrada === undefined) {
    return;
  }
  // Do maior para o menor, como o legado concede.
  for (let nivel = entrada[1]; nivel >= 0; nivel -= 1) {
    construtor.adicionarCapacidade(identificador, `level_${String(nivel)}`);
  }
}
