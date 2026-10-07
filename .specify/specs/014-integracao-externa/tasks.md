# Tarefas — Integração externa

> Ordem de dependência. `[P]` marca tarefa que não disputa arquivo com nenhuma outra desta feature e portanto pode rodar em paralelo com as demais, uma vez satisfeita a dependência dela: toda tarefa de teste, que toca só a própria suíte, e a tarefa de implementação cuja história não compartilha módulo com nenhuma outra história daqui.

- [ ] **T001** Preparar o esqueleto da borda de saída
      *entrega:* a porta de cliente externo e a de envio de e-mail existem com uma implementação cada, e toda chamada de saída do sistema passa por elas, sem nenhuma política de prazo ou de repetição definida
      *satisfaz:* — (infraestrutura)
- [ ] **T002** Portar o catálogo de endereços externos como dado declarado
      *entrega:* os endereços dos serviços externos estão num registro único e inspecionável, com o esquema de cada um explícito, de modo que a pergunta "quantos canais nascem sem cifra" tenha resposta por consulta e não por varredura de código
      *satisfaz:* — (infraestrutura)
      *depende de:* T001
- [ ] **T003** Falar com serviço externo sempre por canal cifrado (US-1)
      *entrega:* o comportamento de US-1 existe e os critérios CA-1.1, CA-1.2, CA-1.3, CA-1.4 passam contra o sistema novo
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4
      *depende de:* T001, T002
- [ ] **T004** [P] Testes de US-1
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-149-1, UT-149-2, UT-149-3, UT-149-4, UT-149-5, UT-149-6), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-149-5, UT-149-6) entram na mesma suíte.
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4
      *depende de:* T003
- [ ] **T005** Validar o destino de toda requisição de saída cuja URL vem de dado (US-2)
      *entrega:* o comportamento de US-2 existe e os critérios CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5 passam contra o sistema novo
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5
      *depende de:* T001, T002
- [ ] **T006** [P] Testes de US-2
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-151-1, UT-151-2, UT-151-3, UT-151-4, UT-151-5, UT-151-6, UT-151-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-151-6, UT-151-7) entram na mesma suíte.
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5
      *depende de:* T005
- [ ] **T007** Resolver a credencial de integração por precedência declarada (US-3)
      *entrega:* o comportamento de US-3 existe e os critérios CA-3.1, CA-3.2, CA-3.3, CA-3.4, CA-3.5 passam contra o sistema novo
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4, CA-3.5
      *depende de:* T001, T002
- [ ] **T008** [P] Testes de US-3
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-152-1, UT-152-2, UT-152-3, UT-152-4, UT-152-5, UT-152-6, UT-152-7, UT-152-8), com o mesmo dado de entrada, ação e resultado esperado. Os 3 testes de regra de negócio (UT-152-6, UT-152-7, UT-152-8) entram na mesma suíte.
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4, CA-3.5
      *depende de:* T007
- [ ] **T009** Nunca guardar credencial de integração em texto recuperável (US-4)
      *entrega:* o comportamento de US-4 existe e os critérios CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5 passam contra o sistema novo
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5
      *depende de:* T001, T002, T007
- [ ] **T010** [P] Testes de US-4
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-153-1, UT-153-2, UT-153-3, UT-153-4, UT-153-5, UT-153-6, UT-153-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-153-6, UT-153-7) entram na mesma suíte.
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5
      *depende de:* T009
- [ ] **T011** Declarar prazo de espera e tratamento de erro em toda chamada de saída (US-5)
      *entrega:* o comportamento de US-5 existe e os critérios CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5 passam contra o sistema novo
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5
      *depende de:* T001, T002
- [ ] **T012** [P] Testes de US-5
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-154-1, UT-154-2, UT-154-3, UT-154-4, UT-154-5, UT-154-6, UT-154-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-154-6, UT-154-7) entram na mesma suíte.
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5
      *depende de:* T011
- [ ] **T013** Enviar o e-mail do sistema por canal declarado, com falha visível (US-6)
      *entrega:* o comportamento de US-6 existe e os critérios CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5 passam contra o sistema novo
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5
      *depende de:* T001, T002, T007
- [ ] **T014** [P] Testes de US-6
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-155-1, UT-155-2, UT-155-3, UT-155-4, UT-155-5, UT-155-6, UT-155-7, UT-155-8), com o mesmo dado de entrada, ação e resultado esperado. Os 3 testes de regra de negócio (UT-155-6, UT-155-7, UT-155-8) entram na mesma suíte.
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5
      *depende de:* T013
- [ ] **T015** Consultar o serviço de versões e de distribuição de pacotes (US-7)
      *entrega:* o comportamento de US-7 existe e os critérios CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5 passam contra o sistema novo
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5
      *depende de:* T001, T002, T003, T011
- [ ] **T016** [P] Testes de US-7
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-156-1, UT-156-2, UT-156-3, UT-156-4, UT-156-5, UT-156-6, UT-156-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-156-6, UT-156-7) entram na mesma suíte.
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5
      *depende de:* T015
- [ ] **T017** Notificar serviços externos de atualização do site apenas por lista declarada (US-8)
      *entrega:* o comportamento de US-8 existe e os critérios CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5 passam contra o sistema novo
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5
      *depende de:* T001, T002, T003, T011
- [ ] **T018** [P] Testes de US-8
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-181-1, UT-181-2, UT-181-3, UT-181-4, UT-181-5, UT-181-6, UT-181-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-181-6, UT-181-7) entram na mesma suíte.
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5
      *depende de:* T017

## Sem tarefa

- **REQ-150** os 4 critérios deste card afirmam a ausência de um comportamento no sistema novo, e não há o que construir para satisfazê-los. São conferidos na revisão de superfície, com o conflito registrado na spec.
- **REQ-157** os 4 critérios deste card afirmam a ausência de um comportamento no sistema novo, e não há o que construir para satisfazê-los. São conferidos na revisão de superfície, com o conflito registrado na spec.
- **REQ-158** os 3 critérios deste card afirmam a ausência de um comportamento no sistema novo, e não há o que construir para satisfazê-los. São conferidos na revisão de superfície, com o conflito registrado na spec.
