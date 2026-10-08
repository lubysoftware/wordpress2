# Tarefas — Leitura pública

> Ordem de dependência. `[P]` marca tarefa que não disputa arquivo com nenhuma outra desta feature e portanto pode rodar em paralelo com as demais, uma vez satisfeita a dependência dela: toda tarefa de teste, que toca só a própria suíte, e a tarefa de implementação cuja história não compartilha módulo com nenhuma outra história daqui.

- [x] **T001** Preparar o esqueleto do módulo de leitura pública
      *entrega:* o módulo carrega com a porta de dados declarada, resolve o endereço pedido para um conjunto vazio de critérios e devolve a resposta de endereço inexistente
      *satisfaz:* — (infraestrutura)
- [ ] **T002** Portar a tabela de regras de tradução de endereço em critérios de consulta
      *entrega:* as regras de tradução do legado estão declaradas como dado, não como código, e a mesma consulta pode ser montada pelo endereço amigável ou pelos critérios diretos
      *satisfaz:* — (infraestrutura)
      *depende de:* T001
- [ ] **T003** Resolver o endereço pedido numa consulta de conteúdo (US-1)
      *entrega:* o comportamento de US-1 existe e os critérios CA-1.1, CA-1.2, CA-1.3, CA-1.4 passam contra o sistema novo
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4
      *depende de:* T001, T002
- [ ] **T004** [P] Testes de US-1
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-038-1, UT-038-2, UT-038-3, UT-038-4, UT-038-5), com o mesmo dado de entrada, ação e resultado esperado.
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4
      *depende de:* T003
- [ ] **T005** Escolher a apresentação do conteúdo por uma hierarquia declarada de modelos (US-2)
      *entrega:* o comportamento de US-2 existe e os critérios CA-2.1, CA-2.2, CA-2.3, CA-2.4 passam contra o sistema novo
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4
      *depende de:* T001, T002, T003
- [ ] **T006** [P] Testes de US-2
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-039-1, UT-039-2, UT-039-3, UT-039-4), com o mesmo dado de entrada, ação e resultado esperado.
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4
      *depende de:* T005
- [ ] **T007** Paginar a listagem pública com tamanho de página configurável (US-3)
      *entrega:* o comportamento de US-3 existe e os critérios CA-3.1, CA-3.2, CA-3.3, CA-3.4 passam contra o sistema novo
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T001, T002, T003
- [ ] **T008** [P] Testes de US-3
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-040-1, UT-040-2, UT-040-3, UT-040-4, UT-040-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-040-5) entra na mesma suíte.
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T007
- [ ] **T009** Restringir a leitura de conteúdo que não está público (US-4)
      *entrega:* o comportamento de US-4 existe e os critérios CA-4.1, CA-4.2, CA-4.3, CA-4.4 passam contra o sistema novo
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4
      *depende de:* T001, T002, T003
- [ ] **T010** [P] Testes de US-4
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-041-1, UT-041-2, UT-041-3, UT-041-4, UT-041-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-041-5) entra na mesma suíte.
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4
      *depende de:* T009
- [ ] **T011** Responder a endereço sem correspondência com a apresentação de erro do tema (US-5)
      *entrega:* o comportamento de US-5 existe e os critérios CA-5.1, CA-5.2, CA-5.3 passam contra o sistema novo
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3
      *depende de:* T001, T002, T005, T009
- [ ] **T012** [P] Testes de US-5
      *entrega:* 3 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-042-1, UT-042-2, UT-042-3), com o mesmo dado de entrada, ação e resultado esperado.
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3
      *depende de:* T011
- [ ] **T013** Liberar o corpo de conteúdo protegido por senha a quem informa a senha (US-6)
      *entrega:* o comportamento de US-6 existe e os critérios CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5, CA-6.6 passam contra o sistema novo
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5, CA-6.6
      *depende de:* T001, T002, T003
- [ ] **T014** [P] Testes de US-6
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-043-1, UT-043-2, UT-043-3, UT-043-4, UT-043-5, UT-043-6, UT-043-7, UT-043-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-043-7, UT-043-8) entram na mesma suíte.
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5, CA-6.6
      *depende de:* T013
- [ ] **T015** Pré-buscar o próximo destino de navegação antes do clique (US-7)
      *entrega:* o comportamento de US-7 existe e os critérios CA-7.1, CA-7.2, CA-7.3 passam contra o sistema novo
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3
      *depende de:* T001, T002, T005
- [ ] **T016** [P] Testes de US-7
      *entrega:* 3 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-045-1, UT-045-2, UT-045-3), com o mesmo dado de entrada, ação e resultado esperado.
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3
      *depende de:* T015
- [ ] **T017** Expandir macro textual no corpo do conteúdo na renderização (US-8)
      *entrega:* o comportamento de US-8 existe e os critérios CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5 passam contra o sistema novo
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5
      *depende de:* T001, T002, T005
- [ ] **T018** [P] Testes de US-8
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-171-1, UT-171-2, UT-171-3, UT-171-4, UT-171-5, UT-171-6), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-171-6) entra na mesma suíte.
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5
      *depende de:* T017

## Sem tarefa

- **REQ-046** os 3 critérios deste card afirmam a ausência de um comportamento no sistema novo, e não há o que construir para satisfazê-los. São conferidos na revisão de superfície, com o conflito registrado na spec.
