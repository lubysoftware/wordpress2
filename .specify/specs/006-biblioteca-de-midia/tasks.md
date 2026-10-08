# Tarefas — Biblioteca de mídia

> Ordem de dependência. `[P]` marca tarefa que não disputa arquivo com nenhuma outra desta feature e portanto pode rodar em paralelo com as demais, uma vez satisfeita a dependência dela: toda tarefa de teste, que toca só a própria suíte, e a tarefa de implementação cuja história não compartilha módulo com nenhuma outra história daqui.

- [x] **T001** Preparar o esqueleto do módulo de mídia
      *entrega:* o módulo carrega com as portas de dados, de sistema de arquivos e de processamento de imagem declaradas, e os tamanhos de fábrica do legado registrados como dado
      *satisfaz:* — (infraestrutura)
- [ ] **T002** Portar a forma de armazenamento de anexo e das derivadas
      *entrega:* o anexo existe como registro de conteúdo com estado herdado, e o metadado que descreve as derivadas é gravado e lido pela porta de dados com a mesma forma do legado
      *satisfaz:* — (infraestrutura)
      *depende de:* T001
- [ ] **T003** Enviar arquivo para a biblioteca validando o tipo real do arquivo (US-1)
      *entrega:* o comportamento de US-1 existe e os critérios CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5, CA-1.6 passam contra o sistema novo
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5, CA-1.6
      *depende de:* T001, T002
- [ ] **T004** [P] Testes de US-1
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-056-1, UT-056-2, UT-056-3, UT-056-4, UT-056-5, UT-056-6), com o mesmo dado de entrada, ação e resultado esperado.
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5, CA-1.6
      *depende de:* T003
- [ ] **T005** Herdar do conteúdo de destino a visibilidade do arquivo enviado (US-2)
      *entrega:* o comportamento de US-2 existe e os critérios CA-2.1, CA-2.2, CA-2.3, CA-2.4 passam contra o sistema novo
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4
      *depende de:* T001, T002, T003
- [ ] **T006** [P] Testes de US-2
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-057-1, UT-057-2, UT-057-3, UT-057-4, UT-057-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-057-5) entra na mesma suíte.
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4
      *depende de:* T005
- [ ] **T007** Gerar as derivadas de cada tamanho registrado ao receber uma imagem (US-3)
      *entrega:* o comportamento de US-3 existe e os critérios CA-3.1, CA-3.2, CA-3.3, CA-3.4 passam contra o sistema novo
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T001, T002, T003
- [ ] **T008** [P] Testes de US-3
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-058-1, UT-058-2, UT-058-3, UT-058-4, UT-058-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-058-5) entra na mesma suíte.
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4
      *depende de:* T007
- [ ] **T009** Reduzir imagem acima do limite na ingestão, guardando o original (US-4)
      *entrega:* o comportamento de US-4 existe e os critérios CA-4.1, CA-4.2, CA-4.3, CA-4.4 passam contra o sistema novo
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4
      *depende de:* T001, T002, T007
- [ ] **T010** [P] Testes de US-4
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-059-1, UT-059-2, UT-059-3, UT-059-4, UT-059-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-059-5) entra na mesma suíte.
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4
      *depende de:* T009
- [ ] **T011** Informar e registrar a falha ao processar imagem (US-5)
      *entrega:* o comportamento de US-5 existe e os critérios CA-5.1, CA-5.2, CA-5.3, CA-5.4 passam contra o sistema novo
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4
      *depende de:* T001, T002, T007
- [ ] **T012** [P] Testes de US-5
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-060-1, UT-060-2, UT-060-3, UT-060-4, UT-060-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-060-5) entra na mesma suíte.
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4
      *depende de:* T011
- [ ] **T013** Servir a derivada adequada ao espaço em que a imagem aparece (US-6)
      *entrega:* o comportamento de US-6 existe e os critérios CA-6.1, CA-6.2, CA-6.3 passam contra o sistema novo
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3
      *depende de:* T001, T002, T007
- [ ] **T014** [P] Testes de US-6
      *entrega:* 4 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-061-1, UT-061-2, UT-061-3, UT-061-4), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-061-4) entra na mesma suíte.
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3
      *depende de:* T013
- [ ] **T015** Transformar imagem já enviada, podendo voltar ao original (US-7)
      *entrega:* o comportamento de US-7 existe e os critérios CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5, CA-7.6 passam contra o sistema novo
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5, CA-7.6
      *depende de:* T001, T002, T007, T011
- [ ] **T016** [P] Testes de US-7
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-062-1, UT-062-2, UT-062-3, UT-062-4, UT-062-5, UT-062-6, UT-062-7, UT-062-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-062-7, UT-062-8) entram na mesma suíte.
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5, CA-7.6
      *depende de:* T015
- [ ] **T017** Apagar o arquivo que deixou de ser referenciado (US-8)
      *entrega:* o comportamento de US-8 existe e os critérios CA-8.1, CA-8.2, CA-8.3, CA-8.4 passam contra o sistema novo
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4
      *depende de:* T001, T002, T015
- [ ] **T018** [P] Testes de US-8
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-063-1, UT-063-2, UT-063-3, UT-063-4, UT-063-5, UT-063-6), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-063-5, UT-063-6) entram na mesma suíte.
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4
      *depende de:* T017
- [ ] **T019** Contornar o filtro de tipo de arquivo só por decisão declarada da instalação (US-9)
      *entrega:* o comportamento de US-9 existe e os critérios CA-9.1, CA-9.2, CA-9.3, CA-9.4 passam contra o sistema novo
      *satisfaz:* CA-9.1, CA-9.2, CA-9.3, CA-9.4
      *depende de:* T001, T002, T003
- [ ] **T020** [P] Testes de US-9
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-064-1, UT-064-2, UT-064-3, UT-064-4, UT-064-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-064-5) entra na mesma suíte.
      *satisfaz:* CA-9.1, CA-9.2, CA-9.3, CA-9.4
      *depende de:* T019
