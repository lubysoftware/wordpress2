/**
 * As tres portas que o modulo de integracao externa declara, e so elas.
 *
 * Elas pertencem ao modulo que as consome, nao ao adaptador que as implementa, e
 * nao ao contexto vizinho que declara portas parecidas: AD-08 de
 * `target_architecture.md` poe a porta na borda — *"cinco portas: dados, HTTP,
 * sistema de arquivos, cache de objeto e e-mail"* — e AD-10 proibe um contexto
 * importar outro no topo do modulo. E por isso que uma porta de cliente externo
 * e uma de e-mail reaparecem aqui com a forma que BC-13 precisa, e com as
 * diferencas registradas no cabecalho de cada arquivo: a ligacao horizontal
 * entre contextos e justamente o que a regra de dependencia 3 recusa.
 *
 T001 nomeou duas — cliente externo e e-mail. A terceira, a de **dados**, entrou
 * em **T007** (US-3), para o ultimo degrau da precedencia de credencial (I1) e
 * o valor guardado no banco; ver `./porta-de-dados.ts`. A que ainda vai
 * aparecer:
 *
 * | porta | quando | para que |
 * |---|---|---|
 * | relogio | quando alguma tarefa precisar de instante | CA-6.2 pede o instante no registro da falha de envio |
 *
 * Nenhuma entra antes da tarefa dela: declarar porta sem uso e declarar
 * superficie que o modulo nao exercita, e o precedente desta arvore e o inverso
 * — BC-04 registrou a ausencia da porta de relogio com o motivo, e BC-05
 * declarou o prefixo base quando T002 precisou dele.
 */

export type {
  PedidoExterno,
  PortaDeClienteExterno,
  RespostaExterna,
  ResultadoExterno,
} from './porta-de-cliente-externo.js';

export type {
  MensagemDeEmail,
  PortaDeEmail,
  ResultadoDeEnvio,
} from './porta-de-email.js';

export type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ValorDeColuna,
  ValorDeParametro,
} from './porta-de-dados.js';
