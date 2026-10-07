# Tarefas — Superfícies programáticas

> Ordem de dependência. `[P]` marca tarefa que não disputa arquivo com nenhuma outra desta feature e portanto pode rodar em paralelo com as demais, uma vez satisfeita a dependência dela: toda tarefa de teste, que toca só a própria suíte, e a tarefa de implementação cuja história não compartilha módulo com nenhuma outra história daqui.

- [ ] **T001** Preparar o esqueleto do módulo de superfícies programáticas
      *entrega:* o despachante de rotas carrega com o registro de rotas vazio e inspecionável, e a porta de dados declarada
      *satisfaz:* — (infraestrutura)
- [ ] **T002** Declarar o formato de esquema de rota e o de operação nomeada
      *entrega:* os dois formatos existem como declaração, com validação de parâmetro ainda vazia, e o registro de uma rota sem declaração de permissão reproduz o aviso de uso indevido do legado
      *satisfaz:* — (infraestrutura)
      *depende de:* T001
- [ ] **T003** Despachar requisição de programa por rota registrada com esquema declarado (US-1)
      *entrega:* o comportamento de US-1 existe e os critérios CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5 passam contra o sistema novo
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5
      *depende de:* T001, T002
- [ ] **T004** [P] Testes de US-1
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-137-1, UT-137-2, UT-137-3, UT-137-4, UT-137-5, UT-137-6), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-137-6) entra na mesma suíte.
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5
      *depende de:* T003
- [ ] **T005** Validar e sanitizar cada parâmetro contra o esquema declarado da rota (US-2)
      *entrega:* o comportamento de US-2 existe e os critérios CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5 passam contra o sistema novo
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5
      *depende de:* T001, T002, T003
- [ ] **T006** [P] Testes de US-2
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-139-1, UT-139-2, UT-139-3, UT-139-4, UT-139-5), com o mesmo dado de entrada, ação e resultado esperado.
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5
      *depende de:* T005
- [ ] **T007** Publicar o mapa da superfície programática (US-3)
      *entrega:* o comportamento de US-3 existe e os critérios CA-3.1, CA-3.2, CA-3.3, CA-3.4 passam contra o sistema novo
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T001, T002, T003
- [ ] **T008** [P] Testes de US-3
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-140-1, UT-140-2, UT-140-3, UT-140-4, UT-140-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-140-5) entra na mesma suíte.
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T007
- [ ] **T009** Registrar o acesso à superfície programática (US-4)
      *entrega:* o comportamento de US-4 existe e os critérios CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5 passam contra o sistema novo
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5
      *depende de:* T001, T002, T003
- [ ] **T010** [P] Testes de US-4
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-141-1, UT-141-2, UT-141-3, UT-141-4, UT-141-5, UT-141-6, UT-141-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-141-6, UT-141-7) entram na mesma suíte.
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5
      *depende de:* T009
- [ ] **T011** Exigir token adicional quando a identidade da chamada vem de sessão de navegador (US-5)
      *entrega:* o comportamento de US-5 existe e os critérios CA-5.1, CA-5.2, CA-5.3, CA-5.4 passam contra o sistema novo
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4
      *depende de:* T001, T002, T003
- [ ] **T012** [P] Testes de US-5
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-142-1, UT-142-2, UT-142-3, UT-142-4, UT-142-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-142-5) entra na mesma suíte.
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4
      *depende de:* T011
- [ ] **T013** Executar operação nomeada e descrita por esquema, pedida por agente (US-6)
      *entrega:* o comportamento de US-6 existe e os critérios CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5, CA-6.6 passam contra o sistema novo
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5, CA-6.6
      *depende de:* T001, T002, T003, T005
- [ ] **T014** [P] Testes de US-6
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-143-1, UT-143-2, UT-143-3, UT-143-4, UT-143-5, UT-143-6, UT-143-7, UT-143-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-143-7, UT-143-8) entram na mesma suíte.
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5, CA-6.6
      *depende de:* T013
- [ ] **T015** Servir o índice de sitemap conforme a opção de indexação (US-7)
      *entrega:* o comportamento de US-7 existe e os critérios CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5, CA-7.6 passam contra o sistema novo
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5, CA-7.6
      *depende de:* T001, T002
- [ ] **T016** [P] Testes de US-7
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-145-1, UT-145-2, UT-145-3, UT-145-4, UT-145-5, UT-145-6, UT-145-7, UT-145-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-145-7, UT-145-8) entram na mesma suíte.
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5, CA-7.6
      *depende de:* T015
- [ ] **T017** Servir feeds de conteúdo e de comentários a partir da mesma consulta pública (US-8)
      *entrega:* o comportamento de US-8 existe e os critérios CA-8.1, CA-8.2, CA-8.3, CA-8.4 passam contra o sistema novo
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4
      *depende de:* T001, T002
- [ ] **T018** [P] Testes de US-8
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-146-1, UT-146-2, UT-146-3, UT-146-4), com o mesmo dado de entrada, ação e resultado esperado.
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4
      *depende de:* T017
- [ ] **T019** Servir a representação embutível de um endereço do site a outro site (US-9)
      *entrega:* o comportamento de US-9 existe e os critérios CA-9.1, CA-9.2, CA-9.3, CA-9.4 passam contra o sistema novo
      *satisfaz:* CA-9.1, CA-9.2, CA-9.3, CA-9.4
      *depende de:* T001, T002, T003
- [ ] **T020** [P] Testes de US-9
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-147-1, UT-147-2, UT-147-3, UT-147-4, UT-147-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-147-5) entra na mesma suíte.
      *satisfaz:* CA-9.1, CA-9.2, CA-9.3, CA-9.4
      *depende de:* T019

## Sem tarefa

- **REQ-148** os 4 critérios deste card afirmam a ausência de um comportamento no sistema novo, e não há o que construir para satisfazê-los. São conferidos na revisão de superfície, com o conflito registrado na spec.
- **REQ-179** os 4 critérios deste card afirmam a ausência de um comportamento no sistema novo, e não há o que construir para satisfazê-los. São conferidos na revisão de superfície, com o conflito registrado na spec.
