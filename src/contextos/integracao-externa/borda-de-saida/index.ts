/**
 * A borda de saida: as duas implementacoes que T001 entrega, uma por porta.
 *
 * O nome da pasta e o nome da tarefa — *"Preparar o esqueleto da borda de
 * saida"* —, e e tudo o que ha aqui: **nenhuma politica**. A politica de
 * integracao e o que BC-13 e (*"precedencia de credencial, registro de conector,
 * cliente de IA e o rebaixamento para canal sem cifra"*), e ela entra nas
 * tarefas dela: o catalogo de enderecos em T002, o canal cifrado em T003, a
 * validacao de destino em T005, a credencial em T007 e T009, o prazo em T011, o
 * canal de e-mail em T013, a consulta de versoes em T015 e a notificacao em
 * T017.
 */

export {
  criarClienteExternoQueRegistra,
  FALHA_SEM_RESPOSTA_PROGRAMADA,
  type ClienteExternoQueRegistra,
  type OpcoesDoClienteQueRegistra,
} from './cliente-externo-que-registra.js';

export {
  criarEmailQueRegistra,
  ENVIO_ACEITO_PELO_TRANSPORTE,
  type EmailQueRegistra,
  type OpcoesDoEmailQueRegistra,
} from './email-que-registra.js';
