# Tarefas — Autoria e publicação

> Ordem de dependência. `[P]` marca tarefa que não disputa arquivo com nenhuma outra desta feature e portanto pode rodar em paralelo com as demais, uma vez satisfeita a dependência dela: toda tarefa de teste, que toca só a própria suíte, e a tarefa de implementação cuja história não compartilha módulo com nenhuma outra história daqui.

- [x] **T001** Preparar o esqueleto do módulo de conteúdo
      *entrega:* o módulo carrega com as portas de dados, de relógio e de envio de e-mail declaradas, e o vocabulário de estado editorial do legado declarado como enumeração fechada
      *satisfaz:* — (infraestrutura)
- [x] **T002** Portar a forma de armazenamento de conteúdo, metadado e versão anterior
      *entrega:* as estruturas da seção Modelo de dados do plano existem e são lidas e gravadas pela porta de dados, incluindo a auto-referência que liga filho, anexo e versão ao registro pai
      *satisfaz:* — (infraestrutura)
      *depende de:* T001
- [x] **T003** Publicar conteúdo próprio por ato explícito (US-1)
      *entrega:* o comportamento de US-1 existe e os critérios CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5 passam contra o sistema novo
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5
      *depende de:* T001, T002
- [ ] **T004** [P] Testes de US-1
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-019-1, UT-019-2, UT-019-3, UT-019-4, UT-019-5, UT-019-6, UT-019-7, UT-019-8), com o mesmo dado de entrada, ação e resultado esperado. Os 3 testes de regra de negócio (UT-019-6, UT-019-7, UT-019-8) entram na mesma suíte.
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5
      *depende de:* T003
- [x] **T005** Gravar rascunho quando o estado não é informado (US-2)
      *entrega:* o comportamento de US-2 existe e os critérios CA-2.1, CA-2.2, CA-2.3 passam contra o sistema novo
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3
      *depende de:* T001, T002
- [ ] **T006** [P] Testes de US-2
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-020-1, UT-020-2, UT-020-3, UT-020-4), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-020-4) entra na mesma suíte.
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3
      *depende de:* T005
- [x] **T007** Exigir identificador único na URL só a partir da publicação (US-3)
      *entrega:* o comportamento de US-3 existe e os critérios CA-3.1, CA-3.2, CA-3.3, CA-3.4 passam contra o sistema novo
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T001, T002, T005
- [ ] **T008** [P] Testes de US-3
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-021-1, UT-021-2, UT-021-3, UT-021-4, UT-021-5, UT-021-6), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-021-5, UT-021-6) entram na mesma suíte.
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T007
- [ ] **T009** Publicar conteúdo como privado, visível só a quem tem a permissão declarada (US-4)
      *entrega:* o comportamento de US-4 existe e os critérios CA-4.1, CA-4.2, CA-4.3, CA-4.4 passam contra o sistema novo
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4
      *depende de:* T001, T002, T003
- [ ] **T010** [P] Testes de US-4
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-022-1, UT-022-2, UT-022-3, UT-022-4), com o mesmo dado de entrada, ação e resultado esperado.
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4
      *depende de:* T009
- [ ] **T011** Tratar a republicação do que já está publicado como operação sem efeito (US-5)
      *entrega:* o comportamento de US-5 existe e os critérios CA-5.1, CA-5.2, CA-5.3 passam contra o sistema novo
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3
      *depende de:* T001, T002, T003
- [ ] **T012** [P] Testes de US-5
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-023-1, UT-023-2, UT-023-3, UT-023-4), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-023-4) entra na mesma suíte.
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3
      *depende de:* T011
- [ ] **T013** Agendar a publicação para data futura, com verificação dupla na hora de publicar (US-6)
      *entrega:* o comportamento de US-6 existe e os critérios CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5 passam contra o sistema novo
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5
      *depende de:* T001, T002, T003
- [ ] **T014** [P] Testes de US-6
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-024-1, UT-024-2, UT-024-3, UT-024-4, UT-024-5, UT-024-6, UT-024-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-024-6, UT-024-7) entram na mesma suíte.
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5
      *depende de:* T013
- [ ] **T015** Submeter conteúdo próprio para revisão de quem pode publicar (US-7)
      *entrega:* o comportamento de US-7 existe e os critérios CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5, CA-7.6 passam contra o sistema novo
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5, CA-7.6
      *depende de:* T001, T002, T007
- [ ] **T016** [P] Testes de US-7
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-025-1, UT-025-2, UT-025-3, UT-025-4, UT-025-5, UT-025-6, UT-025-7, UT-025-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-025-7, UT-025-8) entram na mesma suíte.
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5, CA-7.6
      *depende de:* T015
- [ ] **T017** Revisar e publicar conteúdo de outro autor preservando a autoria original (US-8)
      *entrega:* o comportamento de US-8 existe e os critérios CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5, CA-8.6 passam contra o sistema novo
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5, CA-8.6
      *depende de:* T001, T002, T015
- [ ] **T018** [P] Testes de US-8
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-026-1, UT-026-2, UT-026-3, UT-026-4, UT-026-5, UT-026-6, UT-026-7, UT-026-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-026-7, UT-026-8) entram na mesma suíte.
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5, CA-8.6
      *depende de:* T017
- [ ] **T019** Notificar o autor quando o conteúdo é devolvido ou publicado por outra pessoa (US-9)
      *entrega:* o comportamento de US-9 existe e os critérios CA-9.1, CA-9.2, CA-9.3, CA-9.4 passam contra o sistema novo
      *satisfaz:* CA-9.1, CA-9.2, CA-9.3, CA-9.4
      *depende de:* T001, T002, T017
- [ ] **T020** [P] Testes de US-9
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-027-1, UT-027-2, UT-027-3, UT-027-4), com o mesmo dado de entrada, ação e resultado esperado.
      *satisfaz:* CA-9.1, CA-9.2, CA-9.3, CA-9.4
      *depende de:* T019
- [ ] **T021** Guardar versões anteriores do conteúdo editado (US-10)
      *entrega:* o comportamento de US-10 existe e os critérios CA-10.1, CA-10.2, CA-10.3, CA-10.4 passam contra o sistema novo
      *satisfaz:* CA-10.1, CA-10.2, CA-10.3, CA-10.4
      *depende de:* T001, T002, T003
- [ ] **T022** [P] Testes de US-10
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-029-1, UT-029-2, UT-029-3, UT-029-4, UT-029-5, UT-029-6), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-029-5, UT-029-6) entram na mesma suíte.
      *satisfaz:* CA-10.1, CA-10.2, CA-10.3, CA-10.4
      *depende de:* T021
- [ ] **T023** Criar rascunho automático ao abrir o editor, antes de qualquer digitação (US-11)
      *entrega:* o comportamento de US-11 existe e os critérios CA-11.1, CA-11.2, CA-11.3, CA-11.4 passam contra o sistema novo
      *satisfaz:* CA-11.1, CA-11.2, CA-11.3, CA-11.4
      *depende de:* T001, T002, T005
- [ ] **T024** [P] Testes de US-11
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-031-1, UT-031-2, UT-031-3, UT-031-4, UT-031-5, UT-031-6), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-031-5, UT-031-6) entram na mesma suíte.
      *satisfaz:* CA-11.1, CA-11.2, CA-11.3, CA-11.4
      *depende de:* T023
