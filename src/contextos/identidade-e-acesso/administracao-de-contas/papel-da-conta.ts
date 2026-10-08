/**
 * Trocar o papel de uma conta, e tirar dela toda a autorizacao deste site — o
 * `WP_User::set_role()` e o `WP_User::remove_all_caps()` do legado.
 *
 * Entrega de **T023** da feature `001-identidade-e-acesso` (US-11), e e o caso
 * **geral** que `../cadastro/atribuicao-de-papel.ts` declarou como desta tarefa:
 * *"substitui o conjunto em vez de somar... para uma conta recem-criada nao ha o
 * que remover, e e por isso que esta fatia serve ao cadastro sem resolver o caso
 * geral — promover e rebaixar e T023"*.
 *
 * ---
 *
 * # `set_role` — os quatro detalhes que decidem o efeito no banco
 *
 * `class-wp-user.php:620`-`:670`. A area desta feature e avaliada por **efeito no
 * banco** (Decisao 2 de `parity_specs.md`), e cada item abaixo muda esse efeito:
 *
 * 1. **O curto-circuito nao escreve NADA.** `if ( 1 === count( $this->roles ) &&
 *    current( $this->roles ) === $role ) return;` — dar a uma conta o papel que
 *    ela ja tem, e **so** ele, nao emite comando nenhum: nem
 *    `{site}capabilities`, nem `{site}user_level`, nem ponto de extensao. Um
 *    porte que sempre gravasse mudaria o efeito de toda promocao em lote em que
 *    alguma conta ja estava no papel pedido. A condicao e **exatamente um** papel:
 *    uma conta com dois papeis, um deles o pedido, **nao** curto-circuita.
 * 2. **As capacidades individuais sobrevivem.** O legado remove do mapa so as
 *    chaves que sao **papel** (`unset( $this->caps[ $oldrole ] )`); tudo o que
 *    nao e papel fica, na posicao em que estava. Reescrever o mapa inteiro — como
 *    a fatia do cadastro faz, porque la nao ha nada a preservar — apagaria
 *    concessao individual e, em particular, apagaria a **negacao explicita** que o
 *    ADR-0009 poe acima de tudo.
 * 3. **O papel novo entra no FIM do mapa.** `$this->caps[ $role ] = true;` sobre
 *    um mapa de onde o antigo acabou de sair poe a chave na ultima posicao. A
 *    ordem e byte gravado (`papel.ts`: *"a ordem em que as concessoes entraram e a
 *    ordem em que elas saem nos bytes"*), e o cenario de paridade exige valor
 *    identico byte a byte.
 * 4. **O nivel e derivado do `allcaps`, nao do papel.** `update_user_level_from_caps()`
 *    reduz as **chaves** do mapa fundido — capacidades do papel novo **mais** as
 *    individuais que sobraram. Derivar so do papel daria nivel menor para toda
 *    conta com capacidade individual de nivel.
 *
 * E a **ordem das duas escritas** e contrato, pela mesma razao que
 * `../cadastro/atribuicao-de-papel.ts` ja registra: nao ha transacao
 * (BR-MIGRAR-104), logo quem falhar no meio fica com papel e sem nivel, e nunca o
 * contrario.
 *
 * ---
 *
 * # `remove_all_caps` — duas chaves apagadas, e so elas
 *
 * `class-wp-user.php`, chamado por `remove_user_from_blog()`
 * (`ms-functions.php:288`): apaga `{site}capabilities` e `{site}user_level` da
 * conta, e **nada mais**. A linha de `users` fica, o resto do perfil fica, a
 * sessao fica. E o que faz de "desvincular do site" uma operacao diferente de
 * "apagar a conta": a identidade e global (UC-24, tabela de excecoes).
 *
 * ---
 *
 * # 🟢 Por que isto NAO decide o conflito REQ-017
 *
 * Mesma razao de `../cadastro/atribuicao-de-papel.ts`: o nivel e **derivado** da
 * matriz gravada, nao tabelado aqui. Nos dois lados do conflito o resultado sai do
 * dado que a instalacao tem, e nenhuma linha deste arquivo menciona `level_`.
 * Quem reconhece o padrao e {@link nivelDasCapacidades}, que ja existe e e
 * reusada.
 */

import {
  capacidadesDoAtor,
  temPapel,
  type Capacidade,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';
import {
  chaveDeCapacidades,
  chaveDeNivel,
  prefixosDe,
} from '../armazenamento/chaves-e-tabelas.js';
import type { ConcessaoDeCapacidade } from '../armazenamento/papel.js';
import type { RepositorioDeMetadadosDeConta } from '../armazenamento/perfil.js';
import type { RepositorioDePapeis } from '../armazenamento/repositorio-de-papeis.js';
import type { PortaDeDados } from '../portas/index.js';
import { nivelDasCapacidades } from '../cadastro/atribuicao-de-papel.js';

/** Os nomes das duas chaves de autorizacao desta instalacao. */
export interface ChavesDaAutorizacaoDaConta {
  /** `{site}capabilities`. */
  readonly capacidades: string;
  /** `{site}user_level`. */
  readonly nivel: string;
}

/**
 * Os nomes das duas chaves, lidos da porta.
 *
 * Existe porque `remove_all_caps` **apaga** metadado, e apagar e a unica operacao
 * desta familia que o `RepositorioDePapeis` nao expoe: ele le e grava as duas
 * chaves por nome, mas nao as apaga. Pedir os nomes aqui e o que evita montar
 * `'{prefixo}capabilities'` a mao, que e o defeito contra o qual
 * `../armazenamento/chaves-e-tabelas.ts` existe.
 */
export function chavesDaAutorizacaoDaConta(
  dados: PortaDeDados,
): ChavesDaAutorizacaoDaConta {
  const prefixos = prefixosDe(dados);
  return {
    capacidades: chaveDeCapacidades(prefixos),
    nivel: chaveDeNivel(prefixos),
  };
}

/** O que trocar e tirar papel precisam do armazenamento, e nada mais. */
export interface ArmazenamentoDoPapelDaConta {
  readonly papeis: Pick<
    RepositorioDePapeis,
    'obterCapacidadesDaConta' | 'gravarCapacidadesDaConta' | 'gravarNivelDaConta'
  >;
  readonly perfil: Pick<RepositorioDeMetadadosDeConta, 'obter' | 'apagar'>;
  readonly chaves: ChavesDaAutorizacaoDaConta;
}

/**
 * `is_user_member_of_blog( $conta, $site )` — a conta pertence a **este** site?
 *
 * `wp-includes/user.php` responde por `get_blogs_of_user()`, que varre `usermeta`
 * procurando chave que contenha `capabilities` e o prefixo base, e devolve os
 * sites cujas chaves existem. Para o site **corrente** isso se reduz ao que esta
 * escrito abaixo: existe linha de `{site}capabilities` para aquela conta.
 *
 * ⚠️ **E a existencia da LINHA, nao o conteudo dela.** Uma conta com a chave
 * gravada e o mapa vazio — que e exatamente o que
 * {@link definirPapel} deixa quando o papel pedido e vazio — continua **membro**
 * do site, sem papel nenhum. E o que faz da opcao *"nenhum papel neste site"*
 * uma coisa diferente de desvincular, e e por isso que a tela de lote oferece as
 * duas.
 */
export function contaEhMembroDoSite(
  armazenamento: Pick<ArmazenamentoDoPapelDaConta, 'perfil' | 'chaves'>,
  contaId: number,
): boolean {
  return (
    armazenamento.perfil.obter(contaId, armazenamento.chaves.capacidades)
      .length > 0
  );
}

/**
 * Os tres pontos de extensao de `set_role`, na ordem em que o legado os dispara.
 *
 * Nomeados e opcionais pela razao de sempre: o **P2** poe nome, argumentos e
 * posicao no contrato publico, e o barramento que os dispara nao existe nesta
 * arvore. A ordem esta afirmada por teste, e nao implicita na ordem do codigo.
 */
export interface GanchosDoPapelDaConta {
  /** `remove_user_role`: **acao**, uma por papel antigo que saiu. */
  readonly aoRemoverPapel?: (contaId: number, papel: string) => void;
  /** `add_user_role`: **acao**, so quando o papel novo nao estava entre os antigos. */
  readonly aoAcrescentarPapel?: (contaId: number, papel: string) => void;
  /** `set_user_role`: **acao**, a ultima, com os papeis antigos. */
  readonly aoDefinirPapel?: (
    contaId: number,
    papel: string,
    papeisAnteriores: readonly string[],
  ) => void;
}

/** O que trocar o papel informa de volta. */
export interface ResultadoDaDefinicaoDePapel {
  readonly papel: string;
  /** Os papeis que a conta tinha, na ordem gravada. */
  readonly papeisAnteriores: readonly string[];
  /**
   * `false` quando o curto-circuito do legado impediu **toda** escrita.
   *
   * Nao e "falhou": e o item 1 do cabecalho. Com `false`, nenhum comando saiu e
   * nenhum ponto de extensao disparou.
   */
  readonly aplicado: boolean;
  /** O nivel derivado e gravado; `0` quando nada foi aplicado. */
  readonly nivel: number;
  readonly capacidadesGravadas: boolean;
  readonly nivelGravado: boolean;
}

/**
 * `WP_User::set_role( $papel )` — da a conta **exatamente** aquele papel.
 *
 * Papel vazio tira todos os papeis e **nao** grava nome nenhum no lugar, que e o
 * ramo `else` de `class-wp-user.php:634`: e assim que a tela de lote implementa a
 * opcao *"nenhum papel neste site"*.
 *
 * Nao lanca. A conta sem metadado de autorizacao e tratada como mapa vazio, que e
 * o que `WP_User` faz (`if ( ! is_array( $caps ) ) $caps = array();`).
 */
export function definirPapel(
  armazenamento: ArmazenamentoDoPapelDaConta,
  matriz: MatrizDePapeis,
  contaId: number,
  papel: string,
  ganchos?: GanchosDoPapelDaConta,
): ResultadoDaDefinicaoDePapel {
  const gravadas =
    armazenamento.papeis.obterCapacidadesDaConta(contaId)?.interpretado ?? [];
  const papeisAnteriores = gravadas
    .filter((concessao) => temPapel(matriz, concessao.capacidade))
    .map((concessao) => concessao.capacidade);

  // Item 1 do cabecalho: exatamente um papel, e ele e o pedido. Nada sai.
  if (papeisAnteriores.length === 1 && papeisAnteriores[0] === papel) {
    return {
      papel,
      papeisAnteriores,
      aplicado: false,
      nivel: 0,
      capacidadesGravadas: false,
      nivelGravado: false,
    };
  }

  // Item 2: so as chaves que sao papel saem; as individuais ficam na posicao.
  const individuais = gravadas.filter(
    (concessao) => !papeisAnteriores.includes(concessao.capacidade),
  );

  // Item 3: o papel novo entra no fim.
  const concessoes: readonly ConcessaoDeCapacidade[] =
    papel === ''
      ? individuais
      : [...individuais, { capacidade: papel, concedida: true }];

  const capacidadesGravadas = armazenamento.papeis.gravarCapacidadesDaConta(
    contaId,
    concessoes,
  );

  // Item 4: o nivel sai do mapa FUNDIDO, nao do papel.
  const nivel = nivelDasCapacidades([
    ...capacidadesDoAtor(
      { contaId, login: '', existe: true, concessoes },
      matriz,
    ).keys(),
  ]);
  const nivelGravado = armazenamento.papeis.gravarNivelDaConta(contaId, nivel);

  // Os pontos de extensao, na ordem do legado: um `remove_user_role` por papel
  // antigo que saiu de fato, depois `add_user_role` se o novo e novo, depois
  // `set_user_role`. Os dois filtros do primeiro sao do legado: papel vazio e o
  // proprio papel pedido nao disparam.
  for (const anterior of papeisAnteriores) {
    if (anterior === '' || anterior === papel) {
      continue;
    }
    ganchos?.aoRemoverPapel?.(contaId, anterior);
  }
  if (papel !== '' && !papeisAnteriores.includes(papel)) {
    ganchos?.aoAcrescentarPapel?.(contaId, papel);
  }
  ganchos?.aoDefinirPapel?.(contaId, papel, papeisAnteriores);

  return {
    papel,
    papeisAnteriores,
    aplicado: true,
    nivel,
    capacidadesGravadas,
    nivelGravado,
  };
}

/** O que tirar toda a autorizacao informa de volta. */
export interface ResultadoDaRemocaoDeCapacidades {
  /** Linhas de `{site}capabilities` apagadas. */
  readonly linhasDeCapacidades: number;
  /** Linhas de `{site}user_level` apagadas. */
  readonly linhasDeNivel: number;
}

/**
 * `WP_User::remove_all_caps()` — apaga as duas chaves de autorizacao **deste
 * site**, e so elas.
 *
 * A ordem e a do legado: capacidades, depois nivel. Vale a mesma observacao de
 * `set_role`: sem transacao, falhar no meio deixa a conta sem papel e com nivel.
 */
export function removerTodasAsCapacidades(
  armazenamento: ArmazenamentoDoPapelDaConta,
  contaId: number,
): ResultadoDaRemocaoDeCapacidades {
  return {
    linhasDeCapacidades: armazenamento.perfil.apagar(
      contaId,
      armazenamento.chaves.capacidades,
    ),
    linhasDeNivel: armazenamento.perfil.apagar(
      contaId,
      armazenamento.chaves.nivel,
    ),
  };
}

/**
 * Os papeis que aquela conta tem, pela matriz gravada.
 *
 * Exportada porque a trava de CA-11.4 precisa saber se o ator **tem** papel, e
 * porque `promover-contas.ts` compara o papel pedido com o que a conta ja tem.
 * E o mesmo filtro de `get_role_caps()`: olha a **chave**, nao o valor.
 */
export function papeisDaConta(
  armazenamento: Pick<ArmazenamentoDoPapelDaConta, 'papeis'>,
  matriz: MatrizDePapeis,
  contaId: number,
): readonly string[] {
  const gravadas =
    armazenamento.papeis.obterCapacidadesDaConta(contaId)?.interpretado ?? [];
  return gravadas
    .filter((concessao) => temPapel(matriz, concessao.capacidade))
    .map((concessao) => concessao.capacidade);
}

/**
 * A capacidade que a trava de CA-11.4 e CA-11.6 protege.
 *
 * Declarada aqui, com nome, porque ela aparece em **tres** lugares do legado com
 * o mesmo proposito — `users.php:152`, `includes/user.php:76` e o comentario de
 * `users.php:146` — e porque o **P6** manda cada numero e cada nome do legado
 * viver num ponto nomeado.
 */
export const CAPACIDADE_QUE_O_PROPRIO_PAPEL_PRECISA_CONSERVAR: Capacidade =
  'promote_users';
