# Tarefas — Privacidade e dados pessoais

> Ordem de dependência. `[P]` marca tarefa que não disputa arquivo com nenhuma outra desta feature e portanto pode rodar em paralelo com as demais, uma vez satisfeita a dependência dela: toda tarefa de teste, que toca só a própria suíte, e a tarefa de implementação cuja história não compartilha módulo com nenhuma outra história daqui.

- [ ] **T001** Preparar o esqueleto do módulo de privacidade
      *entrega:* o módulo carrega com as portas de dados, de relógio, de envio de e-mail e de sistema de arquivos declaradas, e o registro de provedores de dado pessoal vazio e inspecionável
      *satisfaz:* — (infraestrutura)
- [ ] **T002** Portar a solicitação como registro de conteúdo com os seus quatro estados
      *entrega:* a solicitação existe como tipo de conteúdo próprio, com os quatro estados do legado e a chave de confirmação guardada com resumo criptográfico, lida e gravada pela porta de dados
      *satisfaz:* — (infraestrutura)
      *depende de:* T001
- [ ] **T003** Abrir solicitação de dados pessoais identificada pelo endereço de e-mail (US-1)
      *entrega:* o comportamento de US-1 existe e os critérios CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5 passam contra o sistema novo
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5
      *depende de:* T001, T002
- [ ] **T004** [P] Testes de US-1
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-086-1, UT-086-2, UT-086-3, UT-086-4, UT-086-5, UT-086-6, UT-086-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-086-6, UT-086-7) entram na mesma suíte.
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5
      *depende de:* T003
- [ ] **T005** Exigir confirmação do titular por chave com prazo declarado (US-2)
      *entrega:* o comportamento de US-2 existe e os critérios CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5, CA-2.6 passam contra o sistema novo
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5, CA-2.6
      *depende de:* T001, T002, T003
- [ ] **T006** [P] Testes de US-2
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-087-1, UT-087-2, UT-087-3, UT-087-4, UT-087-5, UT-087-6, UT-087-7, UT-087-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-087-7, UT-087-8) entram na mesma suíte.
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5, CA-2.6
      *depende de:* T005
- [ ] **T007** Tratar a falha de envio como estado reenviável, não como erro perdido (US-3)
      *entrega:* o comportamento de US-3 existe e os critérios CA-3.1, CA-3.2, CA-3.3, CA-3.4 passam contra o sistema novo
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T001, T002, T005
- [ ] **T008** [P] Testes de US-3
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-088-1, UT-088-2, UT-088-3, UT-088-4, UT-088-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-088-5) entra na mesma suíte.
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T007
- [ ] **T009** Expirar solicitação não confirmada, apagando a chave no mesmo comando (US-4)
      *entrega:* o comportamento de US-4 existe e os critérios CA-4.1, CA-4.2, CA-4.3, CA-4.4 passam contra o sistema novo
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4
      *depende de:* T001, T002, T005
- [ ] **T010** [P] Testes de US-4
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-089-1, UT-089-2, UT-089-3, UT-089-4, UT-089-5, UT-089-6, UT-089-7), com o mesmo dado de entrada, ação e resultado esperado. Os 3 testes de regra de negócio (UT-089-5, UT-089-6, UT-089-7) entram na mesma suíte.
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4
      *depende de:* T009
- [ ] **T011** Exportar os dados percorrendo os provedores registrados, página por página (US-5)
      *entrega:* o comportamento de US-5 existe e os critérios CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5, CA-5.6 passam contra o sistema novo
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5, CA-5.6
      *depende de:* T001, T002, T005
- [ ] **T012** [P] Testes de US-5
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-090-1, UT-090-2, UT-090-3, UT-090-4, UT-090-5, UT-090-6, UT-090-7), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-090-7) entra na mesma suíte.
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5, CA-5.6
      *depende de:* T011
- [ ] **T013** Apagar os dados informando o que não pôde ser removido (US-6)
      *entrega:* o comportamento de US-6 existe e os critérios CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5 passam contra o sistema novo
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5
      *depende de:* T001, T002, T005
- [ ] **T014** [P] Testes de US-6
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-091-1, UT-091-2, UT-091-3, UT-091-4, UT-091-5, UT-091-6), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-091-6) entra na mesma suíte.
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5
      *depende de:* T013
- [ ] **T015** Apagar o arquivo de exportação no prazo declarado (US-7)
      *entrega:* o comportamento de US-7 existe e os critérios CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5 passam contra o sistema novo
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5
      *depende de:* T001, T002, T011
- [ ] **T016** [P] Testes de US-7
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-093-1, UT-093-2, UT-093-3, UT-093-4, UT-093-5, UT-093-6), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-093-6) entra na mesma suíte.
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5
      *depende de:* T015
- [ ] **T017** Tratar exportar e apagar dado de terceiro como poder do nível mais alto da instalação (US-8)
      *entrega:* o comportamento de US-8 existe e os critérios CA-8.1, CA-8.2, CA-8.3, CA-8.4 passam contra o sistema novo
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4
      *depende de:* T001, T002
- [ ] **T018** [P] Testes de US-8
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-095-1, UT-095-2, UT-095-3, UT-095-4, UT-095-5, UT-095-6), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-095-5, UT-095-6) entram na mesma suíte.
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4
      *depende de:* T017
