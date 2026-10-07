# Tarefas — Trabalho agendado

> Ordem de dependência. `[P]` marca tarefa que não disputa arquivo com nenhuma outra desta feature e portanto pode rodar em paralelo com as demais, uma vez satisfeita a dependência dela: toda tarefa de teste, que toca só a própria suíte, e a tarefa de implementação cuja história não compartilha módulo com nenhuma outra história daqui.

> **Antes de começar:** três das histórias desta feature (REQ-122, REQ-124 e REQ-125) estão em conflito aberto com a resposta 10 de `questions.md`, registrado na seção Perguntas em aberto da spec. Enquanto o conflito não for decidido por uma pessoa, as tarefas delas não começam: construir qualquer um dos dois lados cria trabalho que o outro lado joga fora.

- [ ] **T001** Preparar o esqueleto do módulo de fila agendada
      *entrega:* o módulo carrega com as portas de dados, de relógio, de cache e de cliente externo declaradas, e a fila existe como dado inspecionável e vazio
      *satisfaz:* — (infraestrutura)
- [ ] **T002** Portar a fila como lista em configuração nomeada, com a trava de tempo do legado
      *entrega:* a fila é gravada e lida no mesmo ponto de configuração do legado, e a trava de 60 segundos com descarte depois de 10 minutos existe e é verificável com relógio controlado
      *satisfaz:* — (infraestrutura)
      *depende de:* T001
- [ ] **T003** Executar trabalho agendado por gatilho independente de visita ao site (US-1)
      *entrega:* o comportamento de US-1 existe e os critérios CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5 passam contra o sistema novo
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5
      *depende de:* T001, T002
- [ ] **T004** [P] Testes de US-1
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-122-1, UT-122-2, UT-122-3, UT-122-4, UT-122-5, UT-122-6, UT-122-7, UT-122-8), com o mesmo dado de entrada, ação e resultado esperado. Os 3 testes de regra de negócio (UT-122-6, UT-122-7, UT-122-8) entram na mesma suíte.
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5
      *depende de:* T003
- [ ] **T005** Garantir que um evento agendado não seja executado por dois processos ao mesmo tempo (US-2)
      *entrega:* o comportamento de US-2 existe e os critérios CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5 passam contra o sistema novo
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5
      *depende de:* T001, T002, T003
- [ ] **T006** [P] Testes de US-2
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-123-1, UT-123-2, UT-123-3, UT-123-4, UT-123-5, UT-123-6, UT-123-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-123-6, UT-123-7) entram na mesma suíte.
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5
      *depende de:* T005
- [ ] **T007** Registrar o que a fila executou, quando e com que resultado (US-3)
      *entrega:* o comportamento de US-3 existe e os critérios CA-3.1, CA-3.2, CA-3.3, CA-3.4 passam contra o sistema novo
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T001, T002, T003
- [ ] **T008** [P] Testes de US-3
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-124-1, UT-124-2, UT-124-3, UT-124-4, UT-124-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-124-5) entra na mesma suíte.
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T007
- [ ] **T009** Tornar visível a falha do gatilho do trabalho agendado (US-4)
      *entrega:* o comportamento de US-4 existe e os critérios CA-4.1, CA-4.2, CA-4.3, CA-4.4 passam contra o sistema novo
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4
      *depende de:* T001, T002, T003, T007
- [ ] **T010** [P] Testes de US-4
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-125-1, UT-125-2, UT-125-3, UT-125-4, UT-125-5, UT-125-6), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-125-5, UT-125-6) entram na mesma suíte.
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4
      *depende de:* T009
- [ ] **T011** Reagendar o evento recorrente retirando-o da fila antes de o executar (US-5)
      *entrega:* o comportamento de US-5 existe e os critérios CA-5.1, CA-5.2, CA-5.3, CA-5.4 passam contra o sistema novo
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4
      *depende de:* T001, T002, T003, T005
- [ ] **T012** [P] Testes de US-5
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-126-1, UT-126-2, UT-126-3, UT-126-4), com o mesmo dado de entrada, ação e resultado esperado.
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4
      *depende de:* T011
- [ ] **T013** Declarar que desligar o gatilho não desliga a fila (US-6)
      *entrega:* o comportamento de US-6 existe e os critérios CA-6.1, CA-6.2, CA-6.3, CA-6.4 passam contra o sistema novo
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4
      *depende de:* T001, T002, T003, T009
- [ ] **T014** [P] Testes de US-6
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-127-1, UT-127-2, UT-127-3, UT-127-4, UT-127-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-127-5) entra na mesma suíte.
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4
      *depende de:* T013

## Sem tarefa

- **REQ-128** os 3 critérios deste card afirmam a ausência de um comportamento no sistema novo, e não há o que construir para satisfazê-los. São conferidos na revisão de superfície, com o conflito registrado na spec.
