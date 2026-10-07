# Tarefas — Plataforma transversal

> Ordem de dependência. `[P]` marca tarefa que não disputa arquivo com nenhuma outra desta feature e portanto pode rodar em paralelo com as demais, uma vez satisfeita a dependência dela: toda tarefa de teste, que toca só a própria suíte, e a tarefa de implementação cuja história não compartilha módulo com nenhuma outra história daqui.

- [ ] **T001** Levantar a instalação executável do legado como oráculo de paridade
      *entrega:* o legado, na mesma versão, roda em ambiente isolado e responde às consultas que os testes de paridade comparam, conforme a resposta 16 de `questions.md`
      *satisfaz:* — (infraestrutura)
- [ ] **T002** Preparar o esqueleto da camada transversal
      *entrega:* registro de operação, tradução, sanitização e camada de dados carregam como módulos próprios, com as portas declaradas e nenhuma regra implementada
      *satisfaz:* — (infraestrutura)
      *depende de:* T001
- [ ] **T003** Registrar o evento de operação em canal estruturado e consultável (US-1)
      *entrega:* o comportamento de US-1 existe e os critérios CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5, CA-1.6 passam contra o sistema novo
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5, CA-1.6
      *depende de:* T001, T002
- [ ] **T004** [P] Testes de US-1
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-159-1, UT-159-2, UT-159-3, UT-159-4, UT-159-5, UT-159-6, UT-159-7, UT-159-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-159-7, UT-159-8) entram na mesma suíte.
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5, CA-1.6
      *depende de:* T003
- [ ] **T005** Garantir a paridade de comportamento por suíte de teste executável (US-2)
      *entrega:* o comportamento de US-2 existe e os critérios CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5 passam contra o sistema novo
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5
      *depende de:* T001, T002
- [ ] **T006** [P] Testes de US-2
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-163-1, UT-163-2, UT-163-3, UT-163-4, UT-163-5, UT-163-6, UT-163-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-163-6, UT-163-7) entram na mesma suíte.
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5
      *depende de:* T005
- [ ] **T007** Acessar os dados por uma camada que não aceite consulta montada por concatenação (US-3)
      *entrega:* o comportamento de US-3 existe e os critérios CA-3.1, CA-3.2, CA-3.3, CA-3.4, CA-3.5 passam contra o sistema novo
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4, CA-3.5
      *depende de:* T001, T002
- [ ] **T008** [P] Testes de US-3
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-164-1, UT-164-2, UT-164-3, UT-164-4, UT-164-5, UT-164-6, UT-164-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-164-6, UT-164-7) entram na mesma suíte.
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4, CA-3.5
      *depende de:* T007
- [ ] **T009** Traduzir a interface a partir de catálogo declarado e atualizável (US-4)
      *entrega:* o comportamento de US-4 existe e os critérios CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5 passam contra o sistema novo
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5
      *depende de:* T001, T002
- [ ] **T010** [P] Testes de US-4
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-166-1, UT-166-2, UT-166-3, UT-166-4, UT-166-5, UT-166-6), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-166-6) entra na mesma suíte.
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4, CA-4.5
      *depende de:* T009
- [ ] **T011** Reportar o erro de análise de marcação em lugar de o reconhecer em silêncio (US-5)
      *entrega:* o comportamento de US-5 existe e os critérios CA-5.1, CA-5.2, CA-5.3, CA-5.4 passam contra o sistema novo
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4
      *depende de:* T001, T002, T003
- [ ] **T012** [P] Testes de US-5
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-167-1, UT-167-2, UT-167-3, UT-167-4, UT-167-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-167-5) entra na mesma suíte.
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4
      *depende de:* T011
- [ ] **T013** Impedir na instalação a entrada que o próprio instalador sabe que não deveria aceitar (US-6)
      *entrega:* o comportamento de US-6 existe e os critérios CA-6.1, CA-6.2, CA-6.3, CA-6.4 passam contra o sistema novo
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4
      *depende de:* T001, T002
- [ ] **T014** [P] Testes de US-6
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-168-1, UT-168-2, UT-168-3, UT-168-4, UT-168-5, UT-168-6), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-168-5, UT-168-6) entram na mesma suíte.
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4
      *depende de:* T013

## Sem tarefa

- **REQ-170** os 4 critérios deste card afirmam a ausência de um comportamento no sistema novo, e não há o que construir para satisfazê-los. São conferidos na revisão de superfície, com o conflito registrado na spec.
- **REQ-178** os 3 critérios deste card afirmam a ausência de um comportamento no sistema novo, e não há o que construir para satisfazê-los. São conferidos na revisão de superfície, com o conflito registrado na spec.
