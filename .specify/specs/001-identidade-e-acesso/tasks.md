# Tarefas — Identidade e acesso

> Ordem de dependência. `[P]` marca tarefa que não disputa arquivo com nenhuma outra desta feature e portanto pode rodar em paralelo com as demais, uma vez satisfeita a dependência dela: toda tarefa de teste, que toca só a própria suíte, e a tarefa de implementação cuja história não compartilha módulo com nenhuma outra história daqui.

- [x] **T001** Preparar o esqueleto do módulo de identidade e autorização
      *entrega:* o módulo carrega com as portas de dados, de envio de e-mail e de relógio declaradas, e nenhuma regra de negócio implementada
      *satisfaz:* — (infraestrutura)
- [x] **T002** Portar a forma de armazenamento de conta, perfil, sessão e definição de papel
      *entrega:* as estruturas da seção Modelo de dados do plano existem, são lidas e gravadas pela porta de dados, e a matriz de fábrica é carregada com as mesmas concessões que o legado semeia
      *satisfaz:* — (infraestrutura)
      *depende de:* T001
- [x] **T003** Autenticar conta com login ou e-mail e senha (US-1)
      *entrega:* o comportamento de US-1 existe e os critérios CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5 passam contra o sistema novo
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5
      *depende de:* T001, T002
- [x] **T004** [P] Testes de US-1
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-001-1, UT-001-2, UT-001-3, UT-001-4, UT-001-5, UT-001-6, UT-001-7, UT-001-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-001-7, UT-001-8) entram na mesma suíte.
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5
      *depende de:* T003
- [x] **T005** Encerrar a sessão corrente sem afetar as outras sessões da conta (US-2)
      *entrega:* o comportamento de US-2 existe e os critérios CA-2.1, CA-2.2, CA-2.3 passam contra o sistema novo
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3
      *depende de:* T001, T002, T003
- [x] **T006** [P] Testes de US-2
      *entrega:* 3 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-002-1, UT-002-2, UT-002-3), com o mesmo dado de entrada, ação e resultado esperado.
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3
      *depende de:* T005
- [x] **T007** Expirar a sessão em 2 dias, ou em 14 quando o acesso é lembrado (US-3)
      *entrega:* o comportamento de US-3 existe e os critérios CA-3.1, CA-3.2, CA-3.3, CA-3.4 passam contra o sistema novo
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T001, T002, T003
- [x] **T008** [P] Testes de US-3
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-003-1, UT-003-2, UT-003-3, UT-003-4, UT-003-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-003-5) entra na mesma suíte.
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T007
- [x] **T009** Redefinir a senha por chave enviada ao e-mail da conta, válida por 24 horas (US-4)
      *entrega:* o comportamento de US-4 existe e os critérios CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5 passam contra o sistema novo
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5
      *depende de:* T001, T002
- [x] **T010** [P] Testes de US-4
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-006-1, UT-006-2, UT-006-3, UT-006-4, UT-006-5, UT-006-6), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-006-6) entra na mesma suíte.
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5
      *depende de:* T009
- [x] **T011** Informar ao titular quando o envio do e-mail de redefinição falha (US-5)
      *entrega:* o comportamento de US-5 existe e os critérios CA-5.1, CA-5.2, CA-5.3 passam contra o sistema novo
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3
      *depende de:* T001, T002, T009
- [x] **T012** [P] Testes de US-5
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-007-1, UT-007-2, UT-007-3, UT-007-4), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-007-4) entra na mesma suíte.
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3
      *depende de:* T011
- [ ] **T013** Permitir que o visitante crie a própria conta quando o cadastro aberto está ligado (US-6)
      *entrega:* o comportamento de US-6 existe e os critérios CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5, CA-6.6 passam contra o sistema novo
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5, CA-6.6
      *depende de:* T001, T002, T009
- [ ] **T014** [P] Testes de US-6
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-009-1, UT-009-2, UT-009-3, UT-009-4, UT-009-5, UT-009-6, UT-009-7, UT-009-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-009-7, UT-009-8) entram na mesma suíte.
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5, CA-6.6
      *depende de:* T013
- [ ] **T015** Decidir toda autorização por capacidade, com papel como agrupamento de dados (US-7)
      *entrega:* o comportamento de US-7 existe e os critérios CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5 passam contra o sistema novo
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5
      *depende de:* T001, T002
- [ ] **T016** [P] Testes de US-7
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-014-1, UT-014-2, UT-014-3, UT-014-4, UT-014-5, UT-014-6, UT-014-7, UT-014-8), com o mesmo dado de entrada, ação e resultado esperado. Os 3 testes de regra de negócio (UT-014-6, UT-014-7, UT-014-8) entram na mesma suíte.
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5
      *depende de:* T015
- [ ] **T017** Resolver permissão sobre um objeto conforme autoria e estado do objeto (US-8)
      *entrega:* o comportamento de US-8 existe e os critérios CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5 passam contra o sistema novo
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5
      *depende de:* T001, T002, T015
- [ ] **T018** [P] Testes de US-8
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-015-1, UT-015-2, UT-015-3, UT-015-4, UT-015-5, UT-015-6, UT-015-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-015-6, UT-015-7) entram na mesma suíte.
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5
      *depende de:* T017
- [ ] **T019** Declarar na matriz as capacidades que o legado só concede por extensão (US-9)
      *entrega:* o comportamento de US-9 existe e os critérios CA-9.1, CA-9.2, CA-9.3, CA-9.4 passam contra o sistema novo
      *satisfaz:* CA-9.1, CA-9.2, CA-9.3, CA-9.4
      *depende de:* T001, T002, T015
- [ ] **T020** [P] Testes de US-9
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-016-1, UT-016-2, UT-016-3, UT-016-4, UT-016-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-016-5) entra na mesma suíte.
      *satisfaz:* CA-9.1, CA-9.2, CA-9.3
      *depende de:* T019
- [ ] **T021** Emitir e revogar credencial de aplicação, exibindo o segredo uma única vez (US-10)
      *entrega:* o comportamento de US-10 existe e os critérios CA-10.1, CA-10.2, CA-10.3, CA-10.4, CA-10.5 passam contra o sistema novo
      *satisfaz:* CA-10.1, CA-10.2, CA-10.3, CA-10.4, CA-10.5
      *depende de:* T001, T002, T019
- [ ] **T022** [P] Testes de US-10
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-011-1, UT-011-2, UT-011-3, UT-011-4, UT-011-5, UT-011-6), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-011-6) entra na mesma suíte.
      *satisfaz:* CA-10.1, CA-10.2, CA-10.3, CA-10.4, CA-10.5
      *depende de:* T021
- [ ] **T023** Administrar contas verificando a permissão sobre cada conta alvo (US-11)
      *entrega:* o comportamento de US-11 existe e os critérios CA-11.1, CA-11.2, CA-11.3, CA-11.4, CA-11.5, CA-11.6, CA-11.7 passam contra o sistema novo
      *satisfaz:* CA-11.1, CA-11.2, CA-11.3, CA-11.4, CA-11.5, CA-11.6, CA-11.7
      *depende de:* T001, T002, T015, T019
- [ ] **T024** [P] Testes de US-11
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-013-1, UT-013-2, UT-013-3, UT-013-4, UT-013-5, UT-013-6, UT-013-7, UT-013-8), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-013-8) entra na mesma suíte.
      *satisfaz:* CA-11.1, CA-11.2, CA-11.3, CA-11.4, CA-11.5, CA-11.6, CA-11.7
      *depende de:* T023

## Sem tarefa

- **REQ-017** os 3 critérios deste card afirmam a ausência de um comportamento no sistema novo, e não há o que construir para satisfazê-los. São conferidos na revisão de superfície, com o conflito registrado na spec.
- **REQ-018** os 3 critérios deste card afirmam a ausência de um comportamento no sistema novo, e não há o que construir para satisfazê-los. São conferidos na revisão de superfície, com o conflito registrado na spec.
