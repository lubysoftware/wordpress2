/**
 * CA-7.5 — *"toda capacidade exigida em alguma verificacao do sistema consta da
 * matriz declarada"*.
 *
 * O criterio pede uma **conferencia**, e e so isso que este arquivo entrega: a
 * lista do que esta declarado, e a diferenca entre ela e uma lista de exigidas que
 * o chamador traz. Ele nao declara capacidade nenhuma por conta propria, e a razao
 * esta logo abaixo.
 *
 * ## De onde vem "declarada", e por que nao de uma lista escrita aqui
 *
 * `VO-Capacidade` de `target_domain_model.md` conta **93** nomes verificados no
 * codigo do legado, e ADR-0001 mais `PERM-7` dizem que **quatro** deles nao estao
 * em papel algum. O pacote **nao enumera os 93**: `permissions.md`, que os
 * contaria, nao esta nesta arvore. Escrever aqui uma lista de 93 nomes seria
 * inventar dado de analise, e e exatamente o que a primeira *Pergunta em aberto* da
 * `spec.md` poe para uma pessoa decidir:
 *
 * > *"CA-9.4 exige que nenhuma das 93 capacidades verificadas no codigo fique fora
 * > da matriz declarada, mas a matriz de fabrica tem 50 concessoes reais e
 * > `permissions.md` identifica apenas quatro ausentes que entram por ponto de
 * > extensao. Quais sao as demais, e a matriz deve crescer ate cobrir as 93 ou o
 * > criterio deve ser reescrito para as que tem responsavel? E o unico criterio
 * > deste pacote sem nenhum teste registrado em `backlog/tests.md`."*
 *
 * Logo o que esta declarado e **derivado de dado**, nunca de uma constante:
 *
 * | origem | de onde sai | regra |
 * |---|---|---|
 * | a matriz gravada | todo nome que algum papel menciona, concedido **ou** negado | ADR-0001, `PERM-13` |
 * | as duas sinteticas | `exist` e `do_not_allow` | `PERM-1` |
 * | as quatro constantes | todo nome que elas alcancam, inclusive os que nao estao em papel algum | `PERM-8` |
 * | o que o chamador declarar | os nomes com traducao declarada que a tarefa dele trouxer | `PERM-6`, `PERM-7` |
 *
 * A quarta linha e o encaixe de **T019** (US-9): e por ali que as quatro
 * capacidades concedidas so por ponto de extensao — `install_languages`,
 * `resume_plugins`, `resume_themes` e `view_site_health_checks` — entram na
 * conferencia, e e ali que vive a verificacao automatizada de CA-9.3. Esta tarefa
 * entrega o **mecanismo** e nao fecha a conta: fechar a conta exige a lista que
 * ninguem publicou.
 */

import {
  CAPACIDADES_SINTETICAS,
  type Capacidade,
  type MatrizDePapeis,
} from './capacidade.js';
import { capacidadesAlcancadasPorConstante } from './revogacao-por-constante.js';

/**
 * Todo nome que a matriz gravada menciona, concedido ou negado.
 *
 * Negado conta como **declarado**: um papel que guarda `unfiltered_html: false`
 * declara que conhece a capacidade e que aquele papel nao a tem. Tratar isso como
 * ausencia faria uma negacao explicita parecer um nome desconhecido.
 */
export function capacidadesDaMatriz(
  matriz: MatrizDePapeis,
): readonly Capacidade[] {
  const nomes = new Set<Capacidade>();
  for (const papel of matriz) {
    for (const concessao of papel.capacidades) {
      nomes.add(concessao.capacidade);
    }
  }
  return [...nomes];
}

/**
 * As capacidades declaradas por **regra**, e nao por papel: as duas sinteticas e
 * as que as quatro constantes alcancam.
 *
 * `upload_plugins` e `upload_themes` sao o caso que mostra por que esta lista
 * existe: nenhum papel as concede — UC-33 diz que elas *"resolvem para as de
 * instalar"* — e ainda assim o sistema as exige em tela.
 */
export function capacidadesDeclaradasPorRegra(): readonly Capacidade[] {
  return [...CAPACIDADES_SINTETICAS, ...capacidadesAlcancadasPorConstante()];
}

/**
 * A matriz declarada, para fins de conferencia: o que a matriz menciona, mais o
 * que regra declarada nomeia, mais o que o chamador acrescentar.
 *
 * O terceiro argumento e o encaixe de T019 e de qualquer tarefa que declare
 * capacidade por regra em vez de por papel.
 */
export function capacidadesDeclaradas(
  matriz: MatrizDePapeis,
  declaradasPeloChamador: readonly Capacidade[] = [],
): ReadonlySet<Capacidade> {
  return new Set<Capacidade>([
    ...capacidadesDaMatriz(matriz),
    ...capacidadesDeclaradasPorRegra(),
    ...declaradasPeloChamador,
  ]);
}

/**
 * A conferencia de CA-7.5: das capacidades exigidas, quais nao tem declaracao.
 *
 * Devolve lista, nao lanca e nao avisa. A decisao de autorizacao **nao** consulta
 * esta conferencia: no legado, perguntar por uma capacidade que ninguem declarou
 * simplesmente responde "nao", e transformar isso em erro de execucao mudaria o
 * comportamento observavel (**P1**). Isto e ferramenta de conferencia, do tamanho
 * que CA-9.3 vai precisar.
 *
 * A ordem de saida e a da lista de entrada, sem reordenar, para o relato apontar
 * para onde quem chamou olha.
 */
export function capacidadesExigidasSemDeclaracao(
  exigidas: readonly Capacidade[],
  declaradas: ReadonlySet<Capacidade>,
): readonly Capacidade[] {
  const faltantes: Capacidade[] = [];
  for (const capacidade of exigidas) {
    if (!declaradas.has(capacidade) && !faltantes.includes(capacidade)) {
      faltantes.push(capacidade);
    }
  }
  return faltantes;
}
