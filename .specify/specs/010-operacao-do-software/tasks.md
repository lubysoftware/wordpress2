# Tarefas — Operação do próprio software

> Ordem de dependência. `[P]` marca tarefa que não disputa arquivo com nenhuma outra desta feature e portanto pode rodar em paralelo com as demais, uma vez satisfeita a dependência dela: toda tarefa de teste, que toca só a própria suíte, e a tarefa de implementação cuja história não compartilha módulo com nenhuma outra história daqui.

- [ ] **T001** Preparar o esqueleto do módulo de operação do software
      *entrega:* o módulo carrega com as portas de sistema de arquivos, de cliente externo, de dados e de envio de e-mail declaradas, e nenhuma delas implementada além da variante local
      *satisfaz:* — (infraestrutura)
- [ ] **T002** Portar o estado de atualização e de recuperação como configuração nomeada
      *entrega:* os pontos de configuração que guardam falha de atualização automática, política de atualização e sessão de recuperação existem com os valores de fábrica do legado e são lidos e gravados pela porta de dados
      *satisfaz:* — (infraestrutura)
      *depende de:* T001
- [ ] **T003** Instalar e atualizar extensão a partir do catálogo ou de arquivo enviado (US-1)
      *entrega:* o comportamento de US-1 existe e os critérios CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5, CA-1.6, CA-1.7 passam contra o sistema novo
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5, CA-1.6, CA-1.7
      *depende de:* T001, T002
- [ ] **T004** [P] Testes de US-1
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-106-1, UT-106-2, UT-106-3, UT-106-4, UT-106-5, UT-106-6, UT-106-7, UT-106-8), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-106-8) entra na mesma suíte.
      *satisfaz:* CA-1.1, CA-1.2, CA-1.3, CA-1.4, CA-1.5, CA-1.6, CA-1.7
      *depende de:* T003
- [ ] **T005** Verificar a autenticidade do pacote antes de o aplicar (US-2)
      *entrega:* o comportamento de US-2 existe e os critérios CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5 passam contra o sistema novo
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5
      *depende de:* T001, T002, T003
- [ ] **T006** [P] Testes de US-2
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-107-1, UT-107-2, UT-107-3, UT-107-4, UT-107-5, UT-107-6, UT-107-7, UT-107-8), com o mesmo dado de entrada, ação e resultado esperado. Os 3 testes de regra de negócio (UT-107-6, UT-107-7, UT-107-8) entram na mesma suíte.
      *satisfaz:* CA-2.1, CA-2.2, CA-2.3, CA-2.4, CA-2.5
      *depende de:* T005
- [ ] **T007** Recusar atualização incompatível com o ambiente, informando o motivo (US-3)
      *entrega:* o comportamento de US-3 existe e os critérios CA-3.1, CA-3.2, CA-3.3, CA-3.4, CA-3.5 passam contra o sistema novo
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4, CA-3.5
      *depende de:* T001, T002, T003
- [ ] **T008** [P] Testes de US-3
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-108-1, UT-108-2, UT-108-3, UT-108-4, UT-108-5, UT-108-6, UT-108-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-108-6, UT-108-7) entram na mesma suíte.
      *satisfaz:* CA-3.1, CA-3.2, CA-3.3, CA-3.4, CA-3.5
      *depende de:* T007
- [ ] **T009** Pôr em manutenção apenas o escopo afetado pela atualização (US-4)
      *entrega:* o comportamento de US-4 existe e os critérios CA-4.1, CA-4.2, CA-4.3, CA-4.4 passam contra o sistema novo
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4
      *depende de:* T001, T002, T003
- [ ] **T010** [P] Testes de US-4
      *entrega:* 5 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-109-1, UT-109-2, UT-109-3, UT-109-4, UT-109-5), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-109-5) entra na mesma suíte.
      *satisfaz:* CA-4.1, CA-4.2, CA-4.3, CA-4.4
      *depende de:* T009
- [ ] **T011** Abortar a atualização sem deixar o destino quebrado (US-5)
      *entrega:* o comportamento de US-5 existe e os critérios CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5 passam contra o sistema novo
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5
      *depende de:* T001, T002, T003
- [ ] **T012** [P] Testes de US-5
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-110-1, UT-110-2, UT-110-3, UT-110-4, UT-110-5, UT-110-6, UT-110-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-110-6, UT-110-7) entram na mesma suíte.
      *satisfaz:* CA-5.1, CA-5.2, CA-5.3, CA-5.4, CA-5.5
      *depende de:* T011
- [ ] **T013** Migrar o esquema de dados com histórico das migrações aplicadas (US-6)
      *entrega:* o comportamento de US-6 existe e os critérios CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5 passam contra o sistema novo
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5
      *depende de:* T001, T002
- [ ] **T014** [P] Testes de US-6
      *entrega:* 6 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-112-1, UT-112-2, UT-112-3, UT-112-4, UT-112-5, UT-112-6), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-112-6) entra na mesma suíte.
      *satisfaz:* CA-6.1, CA-6.2, CA-6.3, CA-6.4, CA-6.5
      *depende de:* T013
- [ ] **T015** Atualizar o núcleo do sistema por decisão explícita (US-7)
      *entrega:* o comportamento de US-7 existe e os critérios CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5, CA-7.6 passam contra o sistema novo
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5, CA-7.6
      *depende de:* T001, T002, T005, T011, T013
- [ ] **T016** [P] Testes de US-7
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-111-1, UT-111-2, UT-111-3, UT-111-4, UT-111-5, UT-111-6, UT-111-7, UT-111-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-111-7, UT-111-8) entram na mesma suíte.
      *satisfaz:* CA-7.1, CA-7.2, CA-7.3, CA-7.4, CA-7.5, CA-7.6
      *depende de:* T015
- [ ] **T017** Atualizar o núcleo automaticamente conforme política declarada (US-8)
      *entrega:* o comportamento de US-8 existe e os critérios CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5, CA-8.6 passam contra o sistema novo
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5, CA-8.6
      *depende de:* T001, T002, T015
- [ ] **T018** [P] Testes de US-8
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-113-1, UT-113-2, UT-113-3, UT-113-4, UT-113-5, UT-113-6, UT-113-7, UT-113-8), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-113-7, UT-113-8) entram na mesma suíte.
      *satisfaz:* CA-8.1, CA-8.2, CA-8.3, CA-8.4, CA-8.5, CA-8.6
      *depende de:* T017
- [ ] **T019** Dar uma segunda chance à falha transitória e congelar a automação em falha crítica (US-9)
      *entrega:* o comportamento de US-9 existe e os critérios CA-9.1, CA-9.2, CA-9.3, CA-9.4, CA-9.5 passam contra o sistema novo
      *satisfaz:* CA-9.1, CA-9.2, CA-9.3, CA-9.4, CA-9.5
      *depende de:* T001, T002, T017
- [ ] **T020** [P] Testes de US-9
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-114-1, UT-114-2, UT-114-3, UT-114-4, UT-114-5, UT-114-6, UT-114-7, UT-114-8), com o mesmo dado de entrada, ação e resultado esperado. Os 3 testes de regra de negócio (UT-114-6, UT-114-7, UT-114-8) entram na mesma suíte.
      *satisfaz:* CA-9.1, CA-9.2, CA-9.3, CA-9.4, CA-9.5
      *depende de:* T019
- [ ] **T021** Avisar o responsável em todo cancelamento de atualização, sem repetir o mesmo aviso (US-10)
      *entrega:* o comportamento de US-10 existe e os critérios CA-10.1, CA-10.2, CA-10.3, CA-10.4, CA-10.5 passam contra o sistema novo
      *satisfaz:* CA-10.1, CA-10.2, CA-10.3, CA-10.4, CA-10.5
      *depende de:* T001, T002, T017, T019
- [ ] **T022** [P] Testes de US-10
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-115-1, UT-115-2, UT-115-3, UT-115-4, UT-115-5, UT-115-6, UT-115-7, UT-115-8), com o mesmo dado de entrada, ação e resultado esperado. Os 3 testes de regra de negócio (UT-115-6, UT-115-7, UT-115-8) entram na mesma suíte.
      *satisfaz:* CA-10.1, CA-10.2, CA-10.3, CA-10.4, CA-10.5
      *depende de:* T021
- [ ] **T023** Destravar a atualização congelada por caminho declarado e descoberto pelo ator (US-11)
      *entrega:* o comportamento de US-11 existe e os critérios CA-11.1, CA-11.2, CA-11.3, CA-11.4 passam contra o sistema novo
      *satisfaz:* CA-11.1, CA-11.2, CA-11.3, CA-11.4
      *depende de:* T001, T002, T015, T019
- [ ] **T024** [P] Testes de US-11
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-116-1, UT-116-2, UT-116-3, UT-116-4, UT-116-5, UT-116-6, UT-116-7), com o mesmo dado de entrada, ação e resultado esperado. Os 3 testes de regra de negócio (UT-116-5, UT-116-6, UT-116-7) entram na mesma suíte.
      *satisfaz:* CA-11.1, CA-11.2, CA-11.3, CA-11.4
      *depende de:* T023
- [ ] **T025** Entrar em modo de recuperação quando um erro fatal derruba a área protegida (US-12)
      *entrega:* o comportamento de US-12 existe e os critérios CA-12.1, CA-12.2, CA-12.3, CA-12.4, CA-12.5, CA-12.6, CA-12.7 passam contra o sistema novo
      *satisfaz:* CA-12.1, CA-12.2, CA-12.3, CA-12.4, CA-12.5, CA-12.6, CA-12.7
      *depende de:* T001, T002
- [ ] **T026** [P] Testes de US-12
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-117-1, UT-117-2, UT-117-3, UT-117-4, UT-117-5, UT-117-6, UT-117-7, UT-117-8), com o mesmo dado de entrada, ação e resultado esperado. O teste de regra de negócio (UT-117-8) entra na mesma suíte.
      *satisfaz:* CA-12.1, CA-12.2, CA-12.3, CA-12.4, CA-12.5, CA-12.6, CA-12.7
      *depende de:* T025
- [ ] **T027** Verificar a chave de recuperação antes de a consumir (US-13)
      *entrega:* o comportamento de US-13 existe e os critérios CA-13.1, CA-13.2, CA-13.3, CA-13.4, CA-13.5 passam contra o sistema novo
      *satisfaz:* CA-13.1, CA-13.2, CA-13.3, CA-13.4, CA-13.5
      *depende de:* T001, T002, T025
- [ ] **T028** [P] Testes de US-13
      *entrega:* 7 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-118-1, UT-118-2, UT-118-3, UT-118-4, UT-118-5, UT-118-6, UT-118-7), com o mesmo dado de entrada, ação e resultado esperado. Os 2 testes de regra de negócio (UT-118-6, UT-118-7) entram na mesma suíte.
      *satisfaz:* CA-13.1, CA-13.2, CA-13.3, CA-13.4, CA-13.5
      *depende de:* T027
- [ ] **T029** Diagnosticar a saúde do ambiente, com o teste de requisição de volta em destaque (US-14)
      *entrega:* o comportamento de US-14 existe e os critérios CA-14.1, CA-14.2, CA-14.3, CA-14.4, CA-14.5 passam contra o sistema novo
      *satisfaz:* CA-14.1, CA-14.2, CA-14.3, CA-14.4, CA-14.5
      *depende de:* T001, T002
- [ ] **T030** [P] Testes de US-14
      *entrega:* 8 testes automatizados, um por caso registrado em `../../../backlog/tests.md` (UT-119-1, UT-119-2, UT-119-3, UT-119-4, UT-119-5, UT-119-6, UT-119-7, UT-119-8), com o mesmo dado de entrada, ação e resultado esperado. Os 3 testes de regra de negócio (UT-119-6, UT-119-7, UT-119-8) entram na mesma suíte.
      *satisfaz:* CA-14.1, CA-14.2, CA-14.3, CA-14.4, CA-14.5
      *depende de:* T029

## Sem tarefa

- **REQ-121** os 3 critérios deste card afirmam a ausência de um comportamento no sistema novo, e não há o que construir para satisfazê-los. São conferidos na revisão de superfície, com o conflito registrado na spec.
