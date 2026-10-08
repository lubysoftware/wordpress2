# Tarefas — Interação pública e moderação

> Ordem de dependência. `[P]` marca tarefa que não disputa arquivo com nenhuma outra desta feature e portanto pode rodar em paralelo com as demais, uma vez satisfeita a dependência dela: toda tarefa de teste, que toca só a própria suíte, e a tarefa de implementação cuja história não compartilha módulo com nenhuma outra história daqui.

- [x] **T001** Preparar o esqueleto do módulo de interação pública
      *entrega:* o módulo carrega com as portas de dados, de relógio, de envio de e-mail e de cliente externo declaradas, e os pontos de configuração de moderação criados com os valores de fábrica do legado
      *satisfaz:* — (infraestrutura)
- [ ] **T002** Portar a forma de armazenamento de comentário e do seu metadado
      *entrega:* a estrutura de comentário existe com o vocabulário de estado e de tipo do legado, a auto-referência que encadeia respostas e o vínculo opcional com conta, e é lida e gravada pela porta de dados
      *satisfaz:* — (infraestrutura)
      *depende de:* T001
- [ ] **T003** Declarar a cascata de moderação como sequência nomeada e ordenada
      *entrega:* as etapas da cascata existem como lista ordenada e inspecionável, cada uma podendo encerrar a decisão, com as etapas ainda sem implementação
      *satisfaz:* — (infraestrutura)
      *depende de:* T001
- [ ] **T004** Receber comentário de leitor com ou sem conta (US-1)
      *entrega:* o comportamento de US-1 existe e os critérios CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5 passam contra o sistema novo
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5
      *depende de:* T001, T002, T003
- [ ] **T005** [P] Testes de US-1
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-065-1, UT-065-2, UT-065-3, UT-065-4, UT-065-5, UT-065-6), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-065-6) entra na mesma suíte.
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5
      *depende de:* T004
- [ ] **T006** Recusar comentário duplicado em lugar de o moderar (US-2)
      *entrega:* o comportamento de US-2 existe e os critérios CA-2.1, CA-2.2, CA-2.3 passam contra o sistema novo
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3
      *depende de:* T001, T002, T003, T004
- [ ] **T007** [P] Testes de US-2
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-066-1, UT-066-2, UT-066-3, UT-066-4), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-066-4) entra na mesma suíte.
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3
      *depende de:* T006
- [ ] **T008** Limitar a vazão de comentários por hora, exceto para quem modera (US-3)
      *entrega:* o comportamento de US-3 existe e os critérios CA-3.1, CA-3.2, CA-3.3, CA-3.4 passam contra o sistema novo
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T001, T002, T003, T004
- [ ] **T009** [P] Testes de US-3
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-067-1, UT-067-2, UT-067-3, UT-067-4, UT-067-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-067-5) entra na mesma suíte.
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T008
- [ ] **T010** Decidir o estado inicial do comentário percorrendo as regras de moderação em ordem declarada (US-4)
      *entrega:* o comportamento de US-4 existe e os critérios CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5, CA-4.6, CA-4.7 passam contra o sistema novo
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5, CA-4.6, CA-4.7
      *depende de:* T001, T002, T003, T004
- [ ] **T011** [P] Testes de US-4
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-068-1, UT-068-2, UT-068-3, UT-068-4, UT-068-5, UT-068-6, UT-068-7, UT-068-8), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-068-8) entra na mesma suíte.
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5, CA-4.6, CA-4.7
      *depende de:* T010
- [ ] **T012** Recusar campo mais longo que o seu limite, em lugar de truncar em silêncio (US-5)
      *entrega:* o comportamento de US-5 existe e os critérios CA-5.1, CA-5.2, CA-5.3 passam contra o sistema novo
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3
      *depende de:* T001, T002, T003, T004
- [ ] **T013** [P] Testes de US-5
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-070-1, UT-070-2, UT-070-3, UT-070-4), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-070-4) entra na mesma suíte.
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3
      *depende de:* T012
- [ ] **T014** Fechar a interação em conteúdo antigo sem alterar o registro (US-6)
      *entrega:* o comportamento de US-6 existe e os critérios CA-6.1, CA-6.2, CA-6.3, CA-6.4 passam contra o sistema novo
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4
      *depende de:* T001, T002, T003, T004
- [ ] **T015** [P] Testes de US-6
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-071-1, UT-071-2, UT-071-3, UT-071-4, UT-071-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-071-5) entra na mesma suíte.
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4
      *depende de:* T014
- [ ] **T016** Encadear respostas até a profundidade declarada, e só sob comentário aprovado (US-7)
      *entrega:* o comportamento de US-7 existe e os critérios CA-7.1, CA-7.2, CA-7.3, CA-7.4 passam contra o sistema novo
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4
      *depende de:* T001, T002, T003, T004
- [ ] **T017** [P] Testes de US-7
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-072-1, UT-072-2, UT-072-3, UT-072-4, UT-072-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-072-5) entra na mesma suíte.
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4
      *depende de:* T016
- [ ] **T018** Recusar o comentário com motivo próprio para cada causa de fechamento (US-8)
      *entrega:* o comportamento de US-8 existe e os critérios CA-8.1, CA-8.2, CA-8.3 passam contra o sistema novo
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3
      *depende de:* T001, T002, T003, T004
- [ ] **T019** [P] Testes de US-8
      *entrega:* 3 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-073-1, UT-073-2, UT-073-3), com o mesmo dado de entrada, ação e resultado esperado.
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3
      *depende de:* T018
- [ ] **T020** Avisar quem precisa saber do comentário novo (US-9)
      *entrega:* o comportamento de US-9 existe e os critérios CA-9.1, CA-9.2, CA-9.3, CA-9.4 passam contra o sistema novo
      *satisfaz:* CA-9.1, CA-9.2, CA-9.3, CA-9.4
      *depende de:* T001, T002, T003, T010
- [ ] **T021** [P] Testes de US-9
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-074-1, UT-074-2, UT-074-3, UT-074-4), com o mesmo dado de entrada, ação e resultado esperado.
      *satisfaz:* CA-9.1, CA-9.2, CA-9.3, CA-9.4
      *depende de:* T020
- [ ] **T022** Moderar a fila de comentários como transição de estado (US-10)
      *entrega:* o comportamento de US-10 existe e os critérios CA-10.1, CA-10.2, CA-10.3, CA-10.4, CA-10.5, CA-10.6 passam contra o sistema novo
      *satisfaz:* CA-10.1, CA-10.2, CA-10.3, CA-10.4, CA-10.5, CA-10.6
      *depende de:* T001, T002, T003, T010
- [ ] **T023** [P] Testes de US-10
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-075-1, UT-075-2, UT-075-3, UT-075-4, UT-075-5, UT-075-6, UT-075-7, UT-075-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-075-7, UT-075-8) entram na mesma suíte.
      *satisfaz:* CA-10.1, CA-10.2, CA-10.3, CA-10.4, CA-10.5, CA-10.6
      *depende de:* T022
- [ ] **T024** Descartar comentário para a lixeira guardando o estado anterior (US-11)
      *entrega:* o comportamento de US-11 existe e os critérios CA-11.1, CA-11.2, CA-11.3, CA-11.4 passam contra o sistema novo
      *satisfaz:* CA-11.1, CA-11.2, CA-11.3, CA-11.4
      *depende de:* T001, T002, T003, T022
- [ ] **T025** [P] Testes de US-11
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-076-1, UT-076-2, UT-076-3, UT-076-4, UT-076-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-076-5) entra na mesma suíte.
      *satisfaz:* CA-11.1, CA-11.2, CA-11.3, CA-11.4
      *depende de:* T024
- [ ] **T026** Manter o contador de comentários do conteúdo coerente com o que conta (US-12)
      *entrega:* o comportamento de US-12 existe e os critérios CA-12.1, CA-12.2, CA-12.3, CA-12.4 passam contra o sistema novo
      *satisfaz:* CA-12.1, CA-12.2, CA-12.3, CA-12.4
      *depende de:* T001, T002, T003, T022
- [ ] **T027** [P] Testes de US-12
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-077-1, UT-077-2, UT-077-3, UT-077-4, UT-077-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-077-5) entra na mesma suíte.
      *satisfaz:* CA-12.1, CA-12.2, CA-12.3, CA-12.4
      *depende de:* T026
- [ ] **T028** Dar prazo próprio e declarado ao link de ação enviado por e-mail (US-13)
      *entrega:* o comportamento de US-13 existe e os critérios CA-13.1, CA-13.2, CA-13.3 passam contra o sistema novo
      *satisfaz:* CA-13.1, CA-13.2, CA-13.3
      *depende de:* T001, T002, T003, T020, T022
- [ ] **T029** [P] Testes de US-13
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-078-1, UT-078-2, UT-078-3, UT-078-4), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-078-4) entra na mesma suíte.
      *satisfaz:* CA-13.1, CA-13.2, CA-13.3
      *depende de:* T028
- [ ] **T030** Registrar nota editorial interna sobre um conteúdo (US-14)
      *entrega:* o comportamento de US-14 existe e os critérios CA-14.1, CA-14.2, CA-14.3, CA-14.4, CA-14.5 passam contra o sistema novo
      *satisfaz:* CA-14.1, CA-14.2, CA-14.3, CA-14.4, CA-14.5
      *depende de:* T001, T002, T003, T022
- [ ] **T031** [P] Testes de US-14
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-079-1, UT-079-2, UT-079-3, UT-079-4, UT-079-5, UT-079-6, UT-079-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-079-6, UT-079-7) entram na mesma suíte.
      *satisfaz:* CA-14.1, CA-14.2, CA-14.3, CA-14.4, CA-14.5
      *depende de:* T030
- [ ] **T032** Registrar notificação de link vinda de site remoto, com prova de origem (US-15)
      *entrega:* o comportamento de US-15 existe e os critérios CA-15.1, CA-15.2, CA-15.3, CA-15.4, CA-15.5, CA-15.6 passam contra o sistema novo
      *satisfaz:* CA-15.1, CA-15.2, CA-15.3, CA-15.4, CA-15.5, CA-15.6
      *depende de:* T001, T002, T003, T004, T014
- [ ] **T033** [P] Testes de US-15
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-080-1, UT-080-2, UT-080-3, UT-080-4, UT-080-5, UT-080-6, UT-080-7, UT-080-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-080-7, UT-080-8) entram na mesma suíte.
      *satisfaz:* CA-15.1, CA-15.2, CA-15.3, CA-15.4, CA-15.5, CA-15.6
      *depende de:* T032
- [ ] **T034** Classificar comentário por serviço externo de reputação (US-16)
      *entrega:* o comportamento de US-16 existe e os critérios CA-16.1, CA-16.2, CA-16.3, CA-16.4, CA-16.5, CA-16.6 passam contra o sistema novo
      *satisfaz:* CA-16.1, CA-16.2, CA-16.3, CA-16.4, CA-16.5, CA-16.6
      *depende de:* T001, T002, T003, T010
- [ ] **T035** [P] Testes de US-16
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-082-1, UT-082-2, UT-082-3, UT-082-4, UT-082-5, UT-082-6, UT-082-7, UT-082-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-082-7, UT-082-8) entram na mesma suíte.
      *satisfaz:* CA-16.1, CA-16.2, CA-16.3, CA-16.4, CA-16.5, CA-16.6
      *depende de:* T034
- [ ] **T036** Apagar em lote o spam vencido (US-17)
      *entrega:* o comportamento de US-17 existe e os critérios CA-17.1, CA-17.2, CA-17.3, CA-17.4 passam contra o sistema novo
      *satisfaz:* CA-17.1, CA-17.2, CA-17.3, CA-17.4
      *depende de:* T001, T002, T003, T034
- [ ] **T037** [P] Testes de US-17
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-083-1, UT-083-2, UT-083-3, UT-083-4, UT-083-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-083-5) entra na mesma suíte.
      *satisfaz:* CA-17.1, CA-17.2, CA-17.3, CA-17.4
      *depende de:* T036
- [ ] **T038** Servir a imagem de quem comenta sem enviar o dado dele a terceiro (US-18)
      *entrega:* o comportamento de US-18 existe e os critérios CA-18.1, CA-18.2, CA-18.3, CA-18.4 passam contra o sistema novo
      *satisfaz:* CA-18.1, CA-18.2, CA-18.3, CA-18.4
      *depende de:* T001, T002, T003, T004
- [ ] **T039** [P] Testes de US-18
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-180-1, UT-180-2, UT-180-3, UT-180-4, UT-180-5, UT-180-6), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-180-5, UT-180-6) entram na mesma suíte.
      *satisfaz:* CA-18.1, CA-18.2, CA-18.3, CA-18.4
      *depende de:* T038

## Sem tarefa

- **REQ-081** os 3 critérios deste card afirmam a ausência de um comportamento no sistema novo, e não há o que construir para satisfazê-los. São conferidos na revisão de superfície, com o conflito registrado na spec.
- **REQ-085** os 4 critérios deste card afirmam a ausência de um comportamento no sistema novo, e não há o que construir para satisfazê-los. São conferidos na revisão de superfície, com o conflito registrado na spec.
