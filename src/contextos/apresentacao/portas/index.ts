/**
 * As duas portas que o modulo de apresentacao declara — dados e cliente externo
 * —, pedidas pelo nome por **T001** de
 * `.specify/specs/009-apresentacao-e-personalizacao/tasks.md`.
 *
 * Elas pertencem ao modulo que as consome, nao ao adaptador que as implementa: e
 * o que a regra de dependencia 4 de `target_architecture.md` exige — *"`contextos/`
 * ou `plataforma/` para adaptador concreto: proibido. So pela porta"*.
 *
 * **Por que duas, e nao cinco.** AD-08 declara cinco bordas com porta — dados,
 * HTTP, sistema de arquivos, cache de objeto e e-mail. T001 pede **duas**, e a
 * conta fecha: esta feature nao envia e-mail em nenhuma das 15 historias, e as
 * outras duas bordas aparecem em tarefas que ainda nao comecaram. Ficam nomeadas
 * aqui para que quem as precisar as declare **na tarefa dela**, e nao antes:
 *
 * | borda de AD-08 | onde esta feature a usaria | tarefa |
 * |---|---|---|
 * | sistema de arquivos | ler a configuracao declarada pelo tema, que e arquivo no tema (`plan.md`, *Modelo de dados*); servir fonte vinda de arquivo (CA-13.2) | T002, T027 |
 * | cache de objeto | a aparencia e lida em toda requisicao (UC-31), e a folha gerada e cacheavel (CA-12.4) | T025 |
 * | e-mail | **nenhuma.** Nenhuma historia desta feature notifica ninguem por e-mail | — |
 *
 * **As portas sao sincronas** (AD-04): `adaptadores/` e assincrono, `contextos/` e
 * `plataforma/` sao sincronos, e a I/O e resolvida antes de entrar no dominio ou
 * exposta por fachada sincrona. `await` no dominio contamina o chamador e muda a
 * ordem de emissao, que AD-03 poe no contrato observavel — e o que este contexto
 * emite e HTML de tema.
 */

export type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  ResultadoDeEscrita,
  ValorDeColuna,
  ValorDeParametro,
} from './porta-de-dados.js';

export type {
  PedidoExterno,
  PortaDeClienteExterno,
  RespostaExterna,
  ResultadoExterno,
} from './porta-de-cliente-externo.js';
