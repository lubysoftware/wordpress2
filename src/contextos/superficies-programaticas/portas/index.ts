/**
 * A unica porta que o modulo de superficies programaticas declara em **T001**.
 *
 * Ela pertence ao modulo que a consome, nao ao adaptador que a implementa: e o
 * que a regra de dependencia 4 de `target_architecture.md` exige — *"`contextos/`
 * ou `plataforma/` para adaptador concreto: proibido. So pela porta"*.
 *
 * **Por que uma so, sendo cinco as bordas de AD-08.** A entrega de T001 nomeia
 * uma: *"a porta de dados declarada"*. As outras quatro de AD-08 — HTTP,
 * sistema de arquivos, cache de objeto e e-mail — nao tem, hoje, historia nesta
 * feature que as use, e as razoes estao em `../README.md`, secao *Por que uma
 * porta so*. Em especial: **a borda HTTP desta feature e de ENTRADA, e borda de
 * entrada nao e porta deste modulo** — e o roteador, que
 * `target_architecture.md` poe em `entradas/`, e que esta arvore ainda nao tem.
 *
 * Quando uma tarefa adiante precisar de outra borda, ela declara a porta na
 * tarefa dela, como T002 de BC-05 fez com o prefixo base.
 */

export type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ResultadoDeEscrita,
  ValorDeColuna,
  ValorDeParametro,
} from './porta-de-dados.js';
