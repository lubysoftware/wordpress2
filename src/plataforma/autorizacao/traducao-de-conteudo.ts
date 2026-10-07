/**
 * Os casos de traducao de capacidade sobre **conteudo** — a resolucao por autoria
 * e por estado do objeto.
 *
 * Entrega de **T017** da feature `001-identidade-e-acesso` (US-8): *"o
 * comportamento de US-8 existe e os criterios CA-8.1, CA-8.2, CA-8.3, CA-8.4,
 * CA-8.5 passam contra o sistema novo"*. O encaixe que T015 deixou pronto e
 * {@link CasoDeTraducao}, e a ordem em que estes casos sao consultados esta
 * declarada em `decisao-de-capacidade.ts` — **depois** das quatro constantes do
 * dono do servidor, que nenhum caso de objeto reabre.
 *
 * `PERM-3` (BR-MIGRAR-089) e a frase que este arquivo existe para sustentar:
 * *"capacidade sobre objeto NAO e verificada direto: e traduzida. `edit_post` e a
 * mais verificada do sistema (104 chamadas) e **nenhuma** delas pergunta por
 * `edit_post`: todas perguntam pelo que o mapeamento devolveu. A decisao depende
 * de **quem e o autor** e de **em que estado o conteudo esta**."*
 *
 * ---
 *
 * # A ORDEM dentro de cada caso, que tambem e a regra
 *
 * Os ramos abaixo nao sao uma lista de condicoes independentes: cada um **para** o
 * caso (`break`, no legado), e por isso trocar dois de lugar muda a resposta sem
 * quebrar teste nenhum. A ordem e a de `capabilities.php:103`-`:179`.
 *
 * | # | ramo | o que devolve | por que aqui |
 * |---|---|---|---|
 * | 1 | objeto nao informado, ou que nao existe | `do_not_allow` | CA-8.3, `PERM-5`: *"o caminho de erro fecha a porta"* |
 * | 2 | o objeto e uma revisao | editar segue para o pai; apagar **nega** | `PERM-5`: *"revisao nao se apaga por capacidade"* |
 * | 3 | pagina inicial ou pagina de conteudos | `manage_options`, **em lugar** da capacidade comum | CA-8.5, `PERM-5` |
 * | 4 | tipo nao registrado | {@link CAPACIDADE_MAIS_ALTA}, com aviso | CA-8.4, `PERM-4` |
 * | 5 | o tipo dispensa a traducao | o que o registro declarou para o nome pedido | o default de um tipo de terceiro |
 * | 6 | autoria e estado | a capacidade propria, do alheio, do publicado, do privado | CA-8.1 e CA-8.2 |
 * | 7 | pagina de politica de privacidade | `manage_privacy_options` traduzida, **somada** | CA-8.5, `D5` (BR-MIGRAR-043) |
 *
 * Duas consequencias da ordem que ninguem adivinha lendo a tela, e as duas estao
 * fixadas por teste:
 *
 * - **O ramo 3 para antes do ramo 7.** Uma pagina que seja ao mesmo tempo a pagina
 *   inicial e a pagina de politica exige `manage_options` e **nao** exige
 *   `manage_privacy_options`, porque o caso ja terminou. UC-07 so registra a
 *   metade visivel disto: *"o editor nao edita a pagina inicial"*.
 * - **O ramo 5 para antes do ramo 6.** Um tipo registrado com a traducao desligada
 *   nao tem resolucao por autoria nenhuma: do proprio e do alheio resolvem no mesmo
 *   nome.
 *
 * ---
 *
 * # O que esta aqui, e o que continua nomeado e nao construido
 *
 * **Esta:** os casos de conteudo — editar, apagar e ler —, que sao os de `PERM-3`
 * sobre os quais US-8 e os quatro casos de uso dela (UC-03, UC-07, UC-09, UC-10)
 * falam, mais a traducao de `manage_privacy_options` de que o ramo 7 depende.
 *
 * **Nao esta, e nao e omissao:**
 *
 * - Os demais dos 86 `case` de `map_meta_cap()` — termo, comentario, metadado,
 *   senha de aplicacao, rede. Cada um pertence a feature do seu objeto, e
 *   `tasks.md` nao da nenhum deles a esta tarefa. O encaixe e o mesmo:
 *   {@link CasoDeTraducao}.
 * - Os dez atalhos de nomenclatura de `PERM-6` (BR-MIGRAR-092), que
 *   `traducao-de-capacidade.ts` ja registrava como chegando *"com os casos
 *   deles"*. Em particular `edit_user` sobre si mesmo — a lista vazia que
 *   significa permitido — e US-11 / T023.
 * - `export_others_personal_data` e `erase_others_personal_data`, que no legado
 *   dividem o mesmo `case` com `manage_privacy_options` (BR-MIGRAR-042). Eles
 *   pertencem a feature 008, e o que esta tarefa precisava dessa regra era so o
 *   ramo 7; {@link traducaoDePrivacidade} esta exportada exatamente para que a
 *   feature 008 acrescente os dois nomes em lugar de reimplementar a regra.
 * - O recorte de rede de `PERM-10`, com a consequencia declarada em
 *   `revogacao-por-constante.ts`.
 *
 * ---
 *
 * # 🔴 Uma divergencia entre a spec e a analise, registrada e NAO resolvida aqui
 *
 * **CA-8.4 e BR-MIGRAR-090 nao dizem a mesma coisa, e esta tarefa seguiu a
 * analise.**
 *
 * - `spec.md`, CA-8.4: *"tipo ou estado nao registrado **nega a acao** e produz
 *   aviso de uso indevido"*.
 * - BR-MIGRAR-090 (`PERM-4`, confianca 🟢): *"tres ramos tratam tipo ou status nao
 *   registrado e todos **degradam para a capacidade mais alta**,
 *   `edit_others_posts`, com aviso"*.
 *
 * Degradar para a capacidade mais alta nega a acao para quem nao a tem — que e o
 * caso de quase todo ator —, mas **nao** nega para quem tem. Lido ao pe da letra,
 * CA-8.4 pediria `do_not_allow`, e isso fecharia uma porta que o legado deixa
 * aberta a quem administra conteudo alheio.
 *
 * O **P1** da constituicao resolve o conflito sem que esta tarefa precise
 * escolher: *"reproduza o comportamento observavel do sistema analisado, inclusive
 * quando ele parecer defeito. Divergir exige uma decisao humana registrada, citada
 * no codigo que divergiu."* Nenhuma decisao humana autoriza a leitura literal de
 * CA-8.4, e a analise do legado e categorica sobre o mecanismo — a ponto de dizer
 * *"e a distincao que um porte precisa preservar"* e *"e a inversao mais facil de
 * perder: um alvo com tratamento de erro uniforme degradaria para menos garantia
 * **aqui tambem**, abrindo a porta"*. Logo: degrada, com aviso, e o relato desta
 * tarefa leva a divergencia de redacao para quem decide.
 */

import { CAPACIDADE_NEGADA, type Capacidade } from './capacidade.js';
import {
  ESTADOS_PUBLICADOS,
  ESTADO_DE_LIXEIRA,
  ESTADO_PRIVADO,
  TIPO_DE_REVISAO,
  type ConteudoNaAutorizacao,
  type FonteDeConteudoNaAutorizacao,
  type RelatorDeUsoIndevido,
  type TipoDeConteudoNaAutorizacao,
} from './conteudo-na-autorizacao.js';
import type { CasoDeTraducao, PedidoDeTraducao } from './traducao-de-capacidade.js';

/**
 * A capacidade para a qual todo ramo de erro degrada — `edit_others_posts`.
 *
 * **Esta constante e literal no legado, e nao sai do registro do tipo**, pelo
 * motivo obvio: o ramo so existe quando o tipo **nao** esta registrado, logo nao
 * ha de onde tirar o nome daquele tipo. Ver a nota 🔴 do cabecalho sobre a
 * redacao de CA-8.4.
 */
export const CAPACIDADE_MAIS_ALTA: Capacidade = 'edit_others_posts';

/**
 * A capacidade que a pagina inicial e a pagina de conteudos exigem **em lugar** da
 * capacidade de conteudo.
 *
 * `PERM-5` (BR-MIGRAR-091): *"pagina inicial e pagina de posts exigem
 * `manage_options`"*. UC-07 registra a consequencia na tabela de excecoes — *"exige
 * `manage_options`, que o editor nao tem: o editor nao consegue editar a pagina
 * inicial"* — e chama isso de *"a excecao que mais surpreende quem desenha o papel
 * de editor a partir da tabela"*.
 */
export const CAPACIDADE_DA_PAGINA_ESPECIAL: Capacidade = 'manage_options';

/**
 * `manage_privacy_options` — a capacidade que a pagina de politica **soma** as
 * capacidades normais.
 *
 * `D5` (BR-MIGRAR-043): *"a pagina de politica de privacidade e protegida pela
 * propria capacidade de privacidade: apaga-la exige `manage_privacy_options`
 * somada as capacidades normais de apagar post"*. UC-03 e UC-09 repetem a frase
 * nas tabelas de excecao, cada uma para o seu verbo.
 */
export const CAPACIDADE_DE_PRIVACIDADE: Capacidade = 'manage_privacy_options';

/**
 * A capacidade em que `manage_privacy_options` resolve **em rede**.
 *
 * BR-MIGRAR-042 (`D4`): *"exportar ou apagar dados de terceiro e poder de rede.
 * `export_others_personal_data`, `erase_others_personal_data` e
 * `manage_privacy_options` mapeiam para `manage_network` em multisite e
 * `manage_options` fora dela"*, com a nota de paradigma *"o alvo precisa resolver
 * `MULTISITE` antes de autorizar"* — e e por isso que {@link PedidoDeTraducao}
 * carrega o modo de instalacao.
 */
export const CAPACIDADE_DE_PRIVACIDADE_EM_REDE: Capacidade = 'manage_network';

/** A capacidade em que `manage_privacy_options` resolve fora da rede. */
export const CAPACIDADE_DE_PRIVACIDADE_FORA_DA_REDE: Capacidade = 'manage_options';

/**
 * O nome de capacidade que um registro de tipo **incompleto** produz.
 *
 * ⚠️ **Reproducao de um comportamento de borda do legado, nao regra documentada no
 * pacote.** Quando o registro do tipo nao declara o nome pedido, o legado avalia
 * `$post_type->cap->$cap` para nulo e acrescenta nulo a lista; na comparacao
 * final, `empty( $capabilities[ null ] )` e verdadeiro e a pergunta e **negada**.
 * Uma cadeia vazia reproduz as duas metades disso: ninguem a tem concedida, logo a
 * pergunta e negada — e ela **nao** e `do_not_allow`, logo o atalho do super
 * administrador em rede continua passando, como no legado. Trocar por
 * {@link CAPACIDADE_NEGADA} fecharia uma porta a mais. Fecha contra o oraculo
 * (`ESC-ORACULO`, BR-MIGRAR-116).
 */
const CAPACIDADE_SEM_NOME: Capacidade = '';

/** `edit_post` — o nome que o caso de ler usa ao cair na resolucao de edicao. */
const CAPACIDADE_DE_EDICAO: Capacidade = 'edit_post';

/** Os dois nomes pedidos que caem no caso de editar. */
const CAPACIDADES_DE_EDICAO: readonly Capacidade[] = [
  CAPACIDADE_DE_EDICAO,
  'edit_page',
];

/** Os dois nomes pedidos que caem no caso de apagar. */
const CAPACIDADES_DE_EXCLUSAO: readonly Capacidade[] = [
  'delete_post',
  'delete_page',
];

/** Os dois nomes pedidos que caem no caso de ler. */
const CAPACIDADES_DE_LEITURA: readonly Capacidade[] = ['read_post', 'read_page'];

/**
 * Os quatro **slots** que a resolucao por autoria e estado consulta no registro do
 * tipo.
 *
 * Slot, e nao capacidade: o valor que sai de `capacidades[slot]` e o nome daquele
 * tipo — `edit_posts` para um, `edit_pages` para outro. E e so por isto que a
 * familia de capacidade de pagina existe sem nenhum `if` sobre o nome `page`.
 */
interface FamiliaDeCapacidade {
  /** O conteudo e do proprio ator, e nao esta publicado. */
  readonly proprias: string;
  /** O conteudo e de outra pessoa. */
  readonly deOutros: string;
  /** O conteudo esta publicado ou agendado — ou estava, antes da lixeira. */
  readonly publicadas: string;
  /** O conteudo de outra pessoa esta privado. */
  readonly privadas: string;
}

/** Os slots de editar. UC-07 passo 2 nomeia os tres primeiros. */
const FAMILIA_DE_EDICAO: FamiliaDeCapacidade = {
  proprias: 'edit_posts',
  deOutros: 'edit_others_posts',
  publicadas: 'edit_published_posts',
  privadas: 'edit_private_posts',
};

/** Os slots de apagar. UC-09 nomeia os dois primeiros na linha de autorizacao. */
const FAMILIA_DE_EXCLUSAO: FamiliaDeCapacidade = {
  proprias: 'delete_posts',
  deOutros: 'delete_others_posts',
  publicadas: 'delete_published_posts',
  privadas: 'delete_private_posts',
};

/** O slot de ler, e o de ler o que esta privado. */
const SLOT_DE_LEITURA = 'read';
const SLOT_DE_LEITURA_PRIVADA = 'read_private_posts';

/** `__FUNCTION__` do legado, preservado porque o aviso o publica. */
const FUNCAO_QUE_AVISA = 'map_meta_cap';

/**
 * As duas versoes que o legado declara nos avisos deste mapeamento.
 *
 * ⚠️ **Leitura desta tarefa, nao enumeracao do pacote.** BR-MIGRAR-090 nomeia os
 * tres ramos e o que eles devolvem, mas nao transcreve o aviso. A versao entra no
 * texto que o legado escreve, logo e observavel; fecha contra o oraculo.
 */
const VERSAO_DO_AVISO_DE_TIPO = '4.4.0';
const VERSAO_DO_AVISO_DE_ESTADO = '5.1.0';

/**
 * O nome daquele tipo para o slot pedido, ou {@link CAPACIDADE_SEM_NOME}.
 *
 * Ver {@link CAPACIDADE_SEM_NOME} para o que a ausencia reproduz.
 */
function nomeDoSlot(
  tipo: TipoDeConteudoNaAutorizacao,
  slot: string,
): Capacidade {
  return tipo.capacidades[slot] ?? CAPACIDADE_SEM_NOME;
}

/** O ator e o autor? Ver {@link ConteudoNaAutorizacao.autorId} para o `0`. */
function ehDeQuemPergunta(
  pedido: PedidoDeTraducao,
  conteudo: ConteudoNaAutorizacao,
): boolean {
  return conteudo.autorId !== 0 && pedido.contaId === conteudo.autorId;
}

/** O conteudo esta publicado ou agendado? */
function estaPublicado(estado: string): boolean {
  return ESTADOS_PUBLICADOS.includes(estado);
}

/**
 * A pagina inicial ou a pagina de conteudos — o ramo 3, que **para** o caso.
 *
 * As duas opcoes sao consultadas na ordem do legado, e a de conteudos vem
 * primeiro.
 */
function temFuncaoDePaginaEspecial(
  fonte: FonteDeConteudoNaAutorizacao,
  conteudo: ConteudoNaAutorizacao,
): boolean {
  return (
    fonte.paginaDeConteudos() === conteudo.id ||
    fonte.paginaInicial() === conteudo.id
  );
}

function avisarTipoNaoRegistrado(
  avisar: RelatorDeUsoIndevido | undefined,
  tipo: string,
  capacidade: Capacidade,
): void {
  avisar?.({
    funcao: FUNCAO_QUE_AVISA,
    mensagem: `The post type ${tipo} is not registered, so it may not be reliable to check the capability "${capacidade}" against a post of that type.`,
    versao: VERSAO_DO_AVISO_DE_TIPO,
  });
}

function avisarEstadoNaoRegistrado(
  avisar: RelatorDeUsoIndevido | undefined,
  estado: string,
  capacidade: Capacidade,
): void {
  avisar?.({
    funcao: FUNCAO_QUE_AVISA,
    mensagem: `The post status ${estado} is not registered, so it may not be reliable to check the capability "${capacidade}" against a post with that status.`,
    versao: VERSAO_DO_AVISO_DE_ESTADO,
  });
}

/**
 * `manage_privacy_options` — BR-MIGRAR-042, e a metade dela que o ramo 7 precisa.
 *
 * Exportada porque o ramo 7 nao **pergunta** por `manage_privacy_options`: ele
 * soma o que a traducao dela devolveu, como no legado (`array_merge( $caps,
 * map_meta_cap( 'manage_privacy_options', $user_id ) )`). Quem portar a feature 008
 * acrescenta os dois nomes de dados pessoais a {@link traducaoDePrivacidade} em
 * lugar de reimplementar a regra.
 */
export function capacidadesDePrivacidade(
  emRede: boolean,
): readonly Capacidade[] {
  return [
    emRede
      ? CAPACIDADE_DE_PRIVACIDADE_EM_REDE
      : CAPACIDADE_DE_PRIVACIDADE_FORA_DA_REDE,
  ];
}

/**
 * O caso de traducao de `manage_privacy_options`, para quem pergunta por ela
 * direto.
 *
 * Os outros dois nomes do mesmo `case` do legado pertencem a feature 008 — ver o
 * cabecalho.
 */
export const traducaoDePrivacidade: CasoDeTraducao = (pedido) =>
  pedido.capacidade === CAPACIDADE_DE_PRIVACIDADE
    ? capacidadesDePrivacidade(pedido.emRede)
    : null;

/**
 * Os ramos 1 e 2: o objeto da pergunta, ja resolvido de revisao para o pai.
 *
 * Devolve uma lista de capacidades quando a porta tem de fechar, e o conteudo
 * quando ela nao tem.
 *
 * `revisaoFechaAPorta` e a assimetria de `PERM-5`, e e a unica diferenca entre os
 * tres casos aqui: editar e ler atravessam a revisao para o conteudo pai, apagar
 * nega sem olhar o pai.
 */
function conteudoDoPedido(
  pedido: PedidoDeTraducao,
  fonte: FonteDeConteudoNaAutorizacao,
  revisaoFechaAPorta: boolean,
): ConteudoNaAutorizacao | readonly Capacidade[] {
  // Ramo 1, primeira metade: perguntar sem informar o objeto NEGA. Ver a nota
  // de legado em `FonteDeConteudoNaAutorizacao.conteudo`.
  const referencia = pedido.argumentos[0];
  if (referencia === undefined || referencia === null) {
    return [CAPACIDADE_NEGADA];
  }

  // Ramo 1, segunda metade: o objeto informado nao existe mais (CA-8.3).
  const alvo = fonte.conteudo(referencia);
  if (alvo === null) {
    return [CAPACIDADE_NEGADA];
  }

  if (alvo.tipo === TIPO_DE_REVISAO) {
    // Ramo 2 de apagar: revisao nao se apaga por capacidade, e nao ha caminho
    // para o pai.
    if (revisaoFechaAPorta) {
      return [CAPACIDADE_NEGADA];
    }
    // Ramo 2 de editar e de ler: a revisao e transparente, e a revisao orfa
    // fecha a porta.
    const pai = fonte.conteudo(alvo.paiId);
    return pai ?? [CAPACIDADE_NEGADA];
  }

  return alvo;
}

/** O que {@link conteudoDoPedido} devolveu e uma lista de capacidades? */
function ehDecisao(
  resultado: ConteudoNaAutorizacao | readonly Capacidade[],
): resultado is readonly Capacidade[] {
  return Array.isArray(resultado);
}

/**
 * Os casos de **editar** e de **apagar**: os ramos 1 a 7, na ordem do cabecalho.
 *
 * Os dois casos sao o mesmo codigo com duas diferencas, e as duas vem do legado:
 * a familia de slots, e o que uma revisao produz.
 */
function edicaoOuExclusao(
  pedido: PedidoDeTraducao,
  fonte: FonteDeConteudoNaAutorizacao,
  avisar: RelatorDeUsoIndevido | undefined,
  familia: FamiliaDeCapacidade,
  revisaoFechaAPorta: boolean,
): readonly Capacidade[] {
  const resolvido = conteudoDoPedido(pedido, fonte, revisaoFechaAPorta);
  if (ehDecisao(resolvido)) {
    return resolvido;
  }
  return resolverPorAutoriaEEstado(pedido, fonte, avisar, familia, resolvido);
}

/** Os ramos 3 a 7, comuns a editar e a apagar. */
function resolverPorAutoriaEEstado(
  pedido: PedidoDeTraducao,
  fonte: FonteDeConteudoNaAutorizacao,
  avisar: RelatorDeUsoIndevido | undefined,
  familia: FamiliaDeCapacidade,
  conteudo: ConteudoNaAutorizacao,
): readonly Capacidade[] {
  // Ramo 3: a funcao especial troca a familia de capacidade, e PARA — logo o
  // ramo 7 nao acontece para a pagina inicial nem para a de conteudos.
  if (temFuncaoDePaginaEspecial(fonte, conteudo)) {
    return [CAPACIDADE_DA_PAGINA_ESPECIAL];
  }

  // Ramo 4: tipo nao registrado degrada para a capacidade mais alta, com aviso.
  const tipo = fonte.tipoDeConteudo(conteudo.tipo);
  if (tipo === null) {
    avisarTipoNaoRegistrado(avisar, conteudo.tipo, pedido.capacidade);
    return [CAPACIDADE_MAIS_ALTA];
  }

  // Ramo 5: o tipo que dispensa a traducao nao tem resolucao por autoria.
  if (!tipo.traduzMetaCapacidade) {
    return [nomeDoSlot(tipo, pedido.capacidade)];
  }

  // Ramo 6: autoria e estado (CA-8.1), com a lixeira decidida pelo estado
  // anterior (CA-8.2).
  const exigidas: Capacidade[] = [];

  if (ehDeQuemPergunta(pedido, conteudo)) {
    if (estaPublicado(conteudo.estado)) {
      exigidas.push(nomeDoSlot(tipo, familia.publicadas));
    } else if (conteudo.estado === ESTADO_DE_LIXEIRA) {
      // UC-10 passo 2: a permissao sobre o descartado e a do estado que ele
      // tinha. Estado anterior ausente nao esta publicado, logo cai na comum.
      const anterior = fonte.estadoAnteriorNaLixeira(conteudo.id);
      exigidas.push(
        nomeDoSlot(
          tipo,
          estaPublicado(anterior) ? familia.publicadas : familia.proprias,
        ),
      );
    } else {
      exigidas.push(nomeDoSlot(tipo, familia.proprias));
    }
  } else {
    // Mexer no alheio e a capacidade de base, e o estado SOMA uma segunda.
    exigidas.push(nomeDoSlot(tipo, familia.deOutros));
    if (estaPublicado(conteudo.estado)) {
      exigidas.push(nomeDoSlot(tipo, familia.publicadas));
    } else if (conteudo.estado === ESTADO_PRIVADO) {
      exigidas.push(nomeDoSlot(tipo, familia.privadas));
    }
    // ⚠️ A lixeira NAO tem ramo aqui: para o conteudo de outra pessoa o legado
    // nao le `_wp_trash_meta_status`, e o descartado alheio exige so a
    // capacidade do alheio. A assimetria com o ramo de cima e do legado, e
    // preserva-la e o P1.
  }

  // Ramo 7: a pagina de politica SOMA a capacidade de privacidade, traduzida.
  if (fonte.paginaDePoliticaDePrivacidade() === conteudo.id) {
    exigidas.push(...capacidadesDePrivacidade(pedido.emRede));
  }

  return exigidas;
}

/**
 * O caso de **ler**: o unico que consulta o registro de **estado**, e por isso o
 * unico com o terceiro ramo de erro de `PERM-4`.
 *
 * Ele tambem e o unico que **nao** tem os ramos de pagina especial nem de pagina
 * de politica: ler a pagina inicial nao exige `manage_options`, e e assim no
 * legado.
 *
 * O ultimo ramo e a recursao que UC-03 descreve do lado de quem le — *"o conteudo
 * passa a exigir `read_private_posts` de quem o le"* — e, quando o estado nem e
 * publico nem privado, a leitura cai inteira na resolucao de **edicao**: quem pode
 * editar um rascunho pode ve-lo, e ninguem mais.
 */
function leitura(
  pedido: PedidoDeTraducao,
  fonte: FonteDeConteudoNaAutorizacao,
  avisar: RelatorDeUsoIndevido | undefined,
): readonly Capacidade[] {
  const resolvido = conteudoDoPedido(pedido, fonte, false);
  if (ehDecisao(resolvido)) {
    return resolvido;
  }
  const conteudo = resolvido;

  const tipo = fonte.tipoDeConteudo(conteudo.tipo);
  if (tipo === null) {
    avisarTipoNaoRegistrado(avisar, conteudo.tipo, pedido.capacidade);
    return [CAPACIDADE_MAIS_ALTA];
  }

  if (!tipo.traduzMetaCapacidade) {
    return [nomeDoSlot(tipo, pedido.capacidade)];
  }

  // O terceiro ramo de erro de PERM-4: estado nao registrado (CA-8.4).
  const estado = fonte.estadoDeConteudo(conteudo.estadoParaLeitura);
  if (estado === null) {
    avisarEstadoNaoRegistrado(
      avisar,
      conteudo.estadoParaLeitura,
      pedido.capacidade,
    );
    return [CAPACIDADE_MAIS_ALTA];
  }

  // Estado publico: basta a capacidade de ler do tipo, para qualquer ator.
  if (estado.publico) {
    return [nomeDoSlot(tipo, SLOT_DE_LEITURA)];
  }

  // Quem escreveu le o proprio, em qualquer estado.
  if (ehDeQuemPergunta(pedido, conteudo)) {
    return [nomeDoSlot(tipo, SLOT_DE_LEITURA)];
  }

  if (estado.privado) {
    return [nomeDoSlot(tipo, SLOT_DE_LEITURA_PRIVADA)];
  }

  // Nem publico nem privado: a leitura e decidida pela EDICAO, e a lista
  // devolvida SUBSTITUI a desta chamada, como `$caps = map_meta_cap( ... )` no
  // legado.
  return edicaoOuExclusao(
    {
      ...pedido,
      capacidade: CAPACIDADE_DE_EDICAO,
      argumentos: [conteudo.id],
    },
    fonte,
    avisar,
    FAMILIA_DE_EDICAO,
    false,
  );
}

/**
 * O caso de traducao de capacidade sobre conteudo, ligado a uma fonte.
 *
 * Devolve `null` para toda capacidade que nao e de conteudo — e nesse caso a
 * consulta segue para os casos seguintes, exatamente como o `switch` do legado
 * segue para o `case` seguinte.
 *
 * `avisar` e opcional e nenhuma decisao depende dele (**P7**): ausente, os ramos de
 * erro devolvem a mesma lista. Ver {@link AvisoDeUsoIndevido}.
 */
export function casoDeConteudo(
  fonte: FonteDeConteudoNaAutorizacao,
  avisar?: RelatorDeUsoIndevido,
): CasoDeTraducao {
  return (pedido) => {
    if (CAPACIDADES_DE_EDICAO.includes(pedido.capacidade)) {
      return edicaoOuExclusao(pedido, fonte, avisar, FAMILIA_DE_EDICAO, false);
    }
    if (CAPACIDADES_DE_EXCLUSAO.includes(pedido.capacidade)) {
      return edicaoOuExclusao(pedido, fonte, avisar, FAMILIA_DE_EXCLUSAO, true);
    }
    if (CAPACIDADES_DE_LEITURA.includes(pedido.capacidade)) {
      return leitura(pedido, fonte, avisar);
    }
    return null;
  };
}
