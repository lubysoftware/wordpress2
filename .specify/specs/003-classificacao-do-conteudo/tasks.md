# Tarefas — Classificação do conteúdo

> Ordem de dependência. `[P]` marca tarefa que não disputa arquivo com nenhuma outra desta feature e portanto pode rodar em paralelo com as demais, uma vez satisfeita a dependência dela: toda tarefa de teste, que toca só a própria suíte, e a tarefa de implementação cuja história não compartilha módulo com nenhuma outra história daqui.

- [x] **T001** Preparar o esqueleto do módulo de classificação
      *entrega:* o módulo carrega com a porta de dados declarada e os oito contextos de classificação do núcleo registrados, sem regra implementada
      *satisfaz:* — (infraestrutura)
- [x] **T002** Portar a forma de armazenamento de rótulo, contexto e junção
      *entrega:* as três estruturas da seção Modelo de dados do plano existem, com a chave composta da junção e a unicidade de rótulo por contexto, e são lidas e gravadas pela porta de dados
      *satisfaz:* — (infraestrutura)
      *depende de:* T001
- [x] **T003** Separar o rótulo de classificação do contexto em que ele classifica (US-1)
      *entrega:* o comportamento de US-1 existe e os critérios CA-1.1, CA-1.2, CA-1.3, CA-1.4 passam contra o sistema novo
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4
      *depende de:* T001, T002
- [x] **T004** [P] Testes de US-1
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-033-1, UT-033-2, UT-033-3, UT-033-4, UT-033-5, UT-033-6), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-033-5, UT-033-6) entram na mesma suíte.
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4
      *depende de:* T003
- [x] **T005** Classificar conteúdo com os termos dos contextos declarados para o seu tipo (US-2)
      *entrega:* o comportamento de US-2 existe e os critérios CA-2.1, CA-2.2, CA-2.3, CA-2.4 passam contra o sistema novo
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4
      *depende de:* T001, T002, T003
- [ ] **T006** [P] Testes de US-2
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-034-1, UT-034-2, UT-034-3, UT-034-4), com o mesmo dado de entrada, ação e resultado esperado.
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4
      *depende de:* T005
- [x] **T007** Aplicar o termo padrão do contexto quando nenhum termo é informado (US-3)
      *entrega:* o comportamento de US-3 existe e os critérios CA-3.1, CA-3.2, CA-3.3, CA-3.4 passam contra o sistema novo
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T001, T002, T005
- [x] **T008** [P] Testes de US-3
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-035-1, UT-035-2, UT-035-3, UT-035-4, UT-035-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-035-5) entra na mesma suíte.
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T007
- [ ] **T009** Manter a lista de termos de cada contexto, com hierarquia e contagem de uso (US-4)
      *entrega:* o comportamento de US-4 existe e os critérios CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5 passam contra o sistema novo
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5
      *depende de:* T001, T002, T003, T007
- [ ] **T010** [P] Testes de US-4
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-036-1, UT-036-2, UT-036-3, UT-036-4, UT-036-5, UT-036-6, UT-036-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-036-6, UT-036-7) entram na mesma suíte.
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5
      *depende de:* T009
- [ ] **T011** Impedir a remoção do termo padrão de um contexto (US-5)
      *entrega:* o comportamento de US-5 existe e os critérios CA-5.1, CA-5.2, CA-5.3 passam contra o sistema novo
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3
      *depende de:* T001, T002, T009
- [ ] **T012** [P] Testes de US-5
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-037-1, UT-037-2, UT-037-3, UT-037-4, UT-037-5), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-037-4, UT-037-5) entram na mesma suíte.
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3
      *depende de:* T011
