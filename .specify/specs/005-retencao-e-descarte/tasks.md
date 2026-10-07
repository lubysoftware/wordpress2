# Tarefas — Retenção e descarte

> Ordem de dependência. `[P]` marca tarefa que não disputa arquivo com nenhuma outra desta feature e portanto pode rodar em paralelo com as demais, uma vez satisfeita a dependência dela: toda tarefa de teste, que toca só a própria suíte, e a tarefa de implementação cuja história não compartilha módulo com nenhuma outra história daqui.

- [ ] **T001** Preparar o esqueleto do módulo de retenção
      *entrega:* o módulo carrega com as portas de dados, de relógio e de fila agendada declaradas, e o prazo de retenção lido de um ponto de configuração nomeado com o valor de fábrica do legado
      *satisfaz:* — (infraestrutura)
- [ ] **T002** Portar os marcadores de lixeira como metadado
      *entrega:* o estado anterior e o instante do descarte são gravados e lidos como metadado do registro, para conteúdo e para comentário, pela porta de dados
      *satisfaz:* — (infraestrutura)
      *depende de:* T001
- [ ] **T003** Descartar conteúdo para a lixeira guardando o estado anterior e o instante (US-1)
      *entrega:* o comportamento de US-1 existe e os critérios CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5 passam contra o sistema novo
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5
      *depende de:* T001, T002
- [ ] **T004** [P] Testes de US-1
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-047-1, UT-047-2, UT-047-3, UT-047-4, UT-047-5, UT-047-6, UT-047-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-047-6, UT-047-7) entram na mesma suíte.
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5
      *depende de:* T003
- [ ] **T005** Suspender os comentários do conteúdo descartado, guardando o estado de cada um (US-2)
      *entrega:* o comportamento de US-2 existe e os critérios CA-2.1, CA-2.2, CA-2.3, CA-2.4 passam contra o sistema novo
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4
      *depende de:* T001, T002, T003
- [ ] **T006** [P] Testes de US-2
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-048-1, UT-048-2, UT-048-3, UT-048-4, UT-048-5, UT-048-6), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-048-5, UT-048-6) entram na mesma suíte.
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4
      *depende de:* T005
- [ ] **T007** Restaurar conteúdo da lixeira como rascunho (US-3)
      *entrega:* o comportamento de US-3 existe e os critérios CA-3.1, CA-3.2, CA-3.3, CA-3.4, CA-3.5 passam contra o sistema novo
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4, CA-3.5
      *depende de:* T001, T002, T003, T005
- [ ] **T008** [P] Testes de US-3
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-049-1, UT-049-2, UT-049-3, UT-049-4, UT-049-5, UT-049-6, UT-049-7, UT-049-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-049-7, UT-049-8) entram na mesma suíte.
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4, CA-3.5
      *depende de:* T007
- [ ] **T009** Avisar que apagar é irreversível quando a lixeira está desligada (US-4)
      *entrega:* o comportamento de US-4 existe e os critérios CA-4.1, CA-4.2, CA-4.3, CA-4.4 passam contra o sistema novo
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4
      *depende de:* T001, T002, T003
- [ ] **T010** [P] Testes de US-4
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-050-1, UT-050-2, UT-050-3, UT-050-4, UT-050-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-050-5) entra na mesma suíte.
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4
      *depende de:* T009
- [ ] **T011** Apagar conteúdo vencido da lixeira por rotina que não depende de visita ao painel (US-5)
      *entrega:* o comportamento de US-5 existe e os critérios CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5 passam contra o sistema novo
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5
      *depende de:* T001, T002, T003
- [ ] **T012** [P] Testes de US-5
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-052-1, UT-052-2, UT-052-3, UT-052-4, UT-052-5, UT-052-6, UT-052-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-052-6, UT-052-7) entram na mesma suíte.
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5
      *depende de:* T011
- [ ] **T013** Expirar rascunho automático não aproveitado em sete dias (US-6)
      *entrega:* o comportamento de US-6 existe e os critérios CA-6.1, CA-6.2, CA-6.3, CA-6.4 passam contra o sistema novo
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4
      *depende de:* T001, T002, T011
- [ ] **T014** [P] Testes de US-6
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-053-1, UT-053-2, UT-053-3, UT-053-4, UT-053-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-053-5) entra na mesma suíte.
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4
      *depende de:* T013
- [ ] **T015** Tolerar estado inconsistente na coleta, sem apagar o que não deve (US-7)
      *entrega:* o comportamento de US-7 existe e os critérios CA-7.1, CA-7.2, CA-7.3 passam contra o sistema novo
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3
      *depende de:* T001, T002, T011
- [ ] **T016** [P] Testes de US-7
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-054-1, UT-054-2, UT-054-3, UT-054-4), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-054-4) entra na mesma suíte.
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3
      *depende de:* T015
- [ ] **T017** Reparentar filhos e anexos quando um conteúdo é apagado em definitivo (US-8)
      *entrega:* o comportamento de US-8 existe e os critérios CA-8.1, CA-8.2, CA-8.3, CA-8.4 passam contra o sistema novo
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4
      *depende de:* T001, T002, T003
- [ ] **T018** [P] Testes de US-8
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-055-1, UT-055-2, UT-055-3, UT-055-4), com o mesmo dado de entrada, ação e resultado esperado.
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4
      *depende de:* T017
