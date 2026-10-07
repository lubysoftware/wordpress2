# Tarefas — Apresentação e personalização

> Ordem de dependência. `[P]` marca tarefa que não disputa arquivo com nenhuma outra desta feature e portanto pode rodar em paralelo com as demais, uma vez satisfeita a dependência dela: toda tarefa de teste, que toca só a própria suíte, e a tarefa de implementação cuja história não compartilha módulo com nenhuma outra história daqui.

- [ ] **T001** Preparar o esqueleto dos três módulos de apresentação, juntos
      *entrega:* personalização, menus e componentes de área carregam no mesmo passo, com as portas de dados e de cliente externo declaradas, porque o ciclo de dependência entre eles não permite ordem interna
      *satisfaz:* — (infraestrutura)
- [ ] **T002** Portar a alteração de aparência como registro de conteúdo e a configuração do tema como dado
      *entrega:* o conjunto de alterações existe como tipo de conteúdo próprio e a configuração declarada pelo tema é lida como dado, pela porta de dados, com a mesma forma do legado
      *satisfaz:* — (infraestrutura)
      *depende de:* T001
- [ ] **T003** Pré-visualizar alterações de aparência antes de elas chegarem ao visitante (US-1)
      *entrega:* o comportamento de US-1 existe e os critérios CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5, CA-1.6 passam contra o sistema novo
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5, CA-1.6
      *depende de:* T001, T002
- [ ] **T004** [P] Testes de US-1
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-096-1, UT-096-2, UT-096-3, UT-096-4, UT-096-5, UT-096-6, UT-096-7, UT-096-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-096-7, UT-096-8) entram na mesma suíte.
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5, CA-1.6
      *depende de:* T003
- [ ] **T005** Separar a permissão de salvar a alteração de aparência da de aplicá-la (US-2)
      *entrega:* o comportamento de US-2 existe e os critérios CA-2.1, CA-2.2, CA-2.3, CA-2.4 passam contra o sistema novo
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4
      *depende de:* T001, T002, T003
- [ ] **T006** [P] Testes de US-2
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-097-1, UT-097-2, UT-097-3, UT-097-4, UT-097-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-097-5) entra na mesma suíte.
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4
      *depende de:* T005
- [ ] **T007** Informar ao ator o estado que de fato foi gravado (US-3)
      *entrega:* o comportamento de US-3 existe e os critérios CA-3.1, CA-3.2, CA-3.3 passam contra o sistema novo
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3
      *depende de:* T001, T002, T005
- [ ] **T008** [P] Testes de US-3
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-098-1, UT-098-2, UT-098-3, UT-098-4), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-098-4) entra na mesma suíte.
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3
      *depende de:* T007
- [ ] **T009** Agendar a aplicação de uma alteração de aparência (US-4)
      *entrega:* o comportamento de US-4 existe e os critérios CA-4.1, CA-4.2, CA-4.3, CA-4.4 passam contra o sistema novo
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4
      *depende de:* T001, T002, T003
- [ ] **T010** [P] Testes de US-4
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-099-1, UT-099-2, UT-099-3, UT-099-4, UT-099-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-099-5) entra na mesma suíte.
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4
      *depende de:* T009
- [ ] **T011** Montar menu de navegação com itens que apontam para conteúdo, classificação ou endereço externo (US-5)
      *entrega:* o comportamento de US-5 existe e os critérios CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5 passam contra o sistema novo
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5
      *depende de:* T001, T002
- [ ] **T012** [P] Testes de US-5
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-100-1, UT-100-2, UT-100-3, UT-100-4, UT-100-5, UT-100-6, UT-100-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-100-6, UT-100-7) entram na mesma suíte.
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5
      *depende de:* T011
- [ ] **T013** Sinalizar e limpar item de menu que aponta para conteúdo que não existe mais (US-6)
      *entrega:* o comportamento de US-6 existe e os critérios CA-6.1, CA-6.2, CA-6.3, CA-6.4 passam contra o sistema novo
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4
      *depende de:* T001, T002, T011
- [ ] **T014** [P] Testes de US-6
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-101-1, UT-101-2, UT-101-3, UT-101-4, UT-101-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-101-5) entra na mesma suíte.
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4
      *depende de:* T013
- [ ] **T015** Organizar componentes nas áreas que o tema oferece (US-7)
      *entrega:* o comportamento de US-7 existe e os critérios CA-7.1, CA-7.2, CA-7.3, CA-7.4 passam contra o sistema novo
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4
      *depende de:* T001, T002
- [ ] **T016** [P] Testes de US-7
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-102-1, UT-102-2, UT-102-3, UT-102-4, UT-102-5, UT-102-6), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-102-5, UT-102-6) entram na mesma suíte.
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4
      *depende de:* T015
- [ ] **T017** Trocar o tema ativo (US-8)
      *entrega:* o comportamento de US-8 existe e os critérios CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5, CA-8.6 passam contra o sistema novo
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5, CA-8.6
      *depende de:* T001, T002
- [ ] **T018** [P] Testes de US-8
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-104-1, UT-104-2, UT-104-3, UT-104-4, UT-104-5, UT-104-6, UT-104-7, UT-104-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-104-7, UT-104-8) entram na mesma suíte.
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5, CA-8.6
      *depende de:* T017
- [ ] **T019** Preservar a configuração dos componentes quando o tema muda (US-9)
      *entrega:* o comportamento de US-9 existe e os critérios CA-9.1, CA-9.2, CA-9.3, CA-9.4 passam contra o sistema novo
      *satisfaz:* CA-9.1, CA-9.2, CA-9.3, CA-9.4
      *depende de:* T001, T002, T015, T017
- [ ] **T020** [P] Testes de US-9
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-103-1, UT-103-2, UT-103-3, UT-103-4, UT-103-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-103-5) entra na mesma suíte.
      *satisfaz:* CA-9.1, CA-9.2, CA-9.3, CA-9.4
      *depende de:* T019
- [ ] **T021** Recorrer a um tema de reserva quando o tema ativo não pode ser carregado (US-10)
      *entrega:* o comportamento de US-10 existe e os critérios CA-10.1, CA-10.2, CA-10.3, CA-10.4 passam contra o sistema novo
      *satisfaz:* CA-10.1, CA-10.2, CA-10.3, CA-10.4
      *depende de:* T001, T002, T017
- [ ] **T022** [P] Testes de US-10
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-105-1, UT-105-2, UT-105-3, UT-105-4, UT-105-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-105-5) entra na mesma suíte.
      *satisfaz:* CA-10.1, CA-10.2, CA-10.3, CA-10.4
      *depende de:* T021
- [ ] **T023** Declarar e enfileirar os recursos de interface com dependência e versão (US-11)
      *entrega:* o comportamento de US-11 existe e os critérios CA-11.1, CA-11.2, CA-11.3, CA-11.4, CA-11.5 passam contra o sistema novo
      *satisfaz:* CA-11.1, CA-11.2, CA-11.3, CA-11.4, CA-11.5
      *depende de:* T001, T002
- [ ] **T024** [P] Testes de US-11
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-172-1, UT-172-2, UT-172-3, UT-172-4, UT-172-5), com o mesmo dado de entrada, ação e resultado esperado.
      *satisfaz:* CA-11.1, CA-11.2, CA-11.3, CA-11.4, CA-11.5
      *depende de:* T023
- [ ] **T025** Resolver em folha de estilo os estilos que o tema declara (US-12)
      *entrega:* o comportamento de US-12 existe e os critérios CA-12.1, CA-12.2, CA-12.3, CA-12.4 passam contra o sistema novo
      *satisfaz:* CA-12.1, CA-12.2, CA-12.3, CA-12.4
      *depende de:* T001, T002, T017, T023
- [ ] **T026** [P] Testes de US-12
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-173-1, UT-173-2, UT-173-3, UT-173-4, UT-173-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-173-5) entra na mesma suíte.
      *satisfaz:* CA-12.1, CA-12.2, CA-12.3, CA-12.4
      *depende de:* T025
- [ ] **T027** Gerenciar a biblioteca de fontes do site (US-13)
      *entrega:* o comportamento de US-13 existe e os critérios CA-13.1, CA-13.2, CA-13.3, CA-13.4, CA-13.5 passam contra o sistema novo
      *satisfaz:* CA-13.1, CA-13.2, CA-13.3, CA-13.4, CA-13.5
      *depende de:* T001, T002, T025
- [ ] **T028** [P] Testes de US-13
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-174-1, UT-174-2, UT-174-3, UT-174-4, UT-174-5, UT-174-6), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-174-6) entra na mesma suíte.
      *satisfaz:* CA-13.1, CA-13.2, CA-13.3, CA-13.4, CA-13.5
      *depende de:* T027
- [ ] **T029** Oferecer o conjunto de ícones da interface por registro declarado (US-14)
      *entrega:* o comportamento de US-14 existe e os critérios CA-14.1, CA-14.2, CA-14.3, CA-14.4 passam contra o sistema novo
      *satisfaz:* CA-14.1, CA-14.2, CA-14.3, CA-14.4
      *depende de:* T001, T002, T023
- [ ] **T030** [P] Testes de US-14
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-175-1, UT-175-2, UT-175-3, UT-175-4), com o mesmo dado de entrada, ação e resultado esperado.
      *satisfaz:* CA-14.1, CA-14.2, CA-14.3, CA-14.4
      *depende de:* T029
- [ ] **T031** Entregar ao menos um tema completo junto com o produto (US-15)
      *entrega:* o comportamento de US-15 existe e os critérios CA-15.1, CA-15.2, CA-15.3, CA-15.4 passam contra o sistema novo
      *satisfaz:* CA-15.1, CA-15.2, CA-15.3, CA-15.4
      *depende de:* T001, T002, T017, T021, T025
- [ ] **T032** [P] Testes de US-15
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-176-1, UT-176-2, UT-176-3, UT-176-4, UT-176-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-176-5) entra na mesma suíte.
      *satisfaz:* CA-15.1, CA-15.2, CA-15.3, CA-15.4
      *depende de:* T031
