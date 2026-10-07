---
schemaVersion: 1
generatedAt: 2026-10-06T20:10:00-03:00
reversa:
  version: "1.0.0"
kind: risk_register
producedBy: strategist
hash: "sha256:6f40a4c4d6a455d59a00e19f4deba9ae5f1c009b6793d9bac0b9a67883f8247f"
---

# Registro de Riscos

> Registro de riscos da migração com probabilidade, impacto, mitigação e responsável.

> Gerado pelo **Strategist** (Time de Migração) em 2026-10-06 · `doc_level` **detalhado** · idioma **Português**
> `kind: risk_register`
> Sistema analisado: **wordpress 7.1.2** · Estratégia base: **A — Strangler Fig por superfície HTTP com
> banco compartilhado**, com Parallel Run obrigatório ([`migration_strategy.md`](migration_strategy.md) § 4.2)

**29 riscos.** Todos com *trigger*, mitigação, plano de contingência e *owner*. Nenhum *owner* é pessoa:
o brief não existe e não nomeia *stakeholder* algum, logo **todo responsável é papel** — é o que o SKILL
exige e o máximo que este pacote sustenta.

## Matriz de severidade usada

Declarada para ser contestável. `Severidade combinada` = probabilidade × impacto:

| | impacto **baixo** | impacto **médio** | impacto **alto** | impacto **crítico** |
|---|---|---|---|---|
| probabilidade **alta** | Média | Alta | **Crítica** | **Crítica** |
| probabilidade **média** | Baixa | Média | Alta | **Crítica** |
| probabilidade **baixa** | Baixa | Baixa | Média | Alta |

## Papéis responsáveis

| Sigla | Papel | Observação |
|---|---|---|
| `PATROC` | Patrocinador da migração | 🔴 **não nomeado** — o brief não existe |
| `PO-PORTE` | *Product Owner* do porte | decide escopo e o que é exceção ao idêntico |
| `TL-PORTE` | *Tech Lead* do porte | dono da sequência de fatias |
| `DONO-NUCLEO` | Dono do núcleo compartilhado (12 módulos) | papel único, não rotativo |
| `ARQ-CONTEXTO` | Arquiteto do contexto por requisição | `EXT-CONTEXTO` é pré-requisito, não refinamento |
| `DONO-DADOS` | Dono da camada de dados | SQL à mão, sem ORM |
| `QA-PARIDADE` | Responsável pelo oráculo e pela paridade | dono do arnês de Parallel Run |
| `SRE-IMPL` | Responsável de implantação e operação | dono do *proxy* e do ambiente de referência |
| `SEC-DPO` | Responsável de segurança e proteção de dados | dono da dívida herdada declarada |
| `JUR` | Jurídico | parecer, não opinião de engenharia |
| `DONO-BUILD` | Dono do *build* e da verificação de dependência | hoje **não existe** *pipeline* nesta árvore |
| `ANALISTA-SPEC` | Responsável pelas specs (redator) | os 15 módulos sem spec |

---

## A. Riscos da estratégia recomendada e da coexistência

### RISK-001
- **Descrição**: **A primeira fatia entregável tem 68 dos 71 módulos atrás dela.** Medido nesta etapa: os 18 candidatos naturais a fatia têm fecho transitivo de dependências de **68 de 71 (96%)**, inclusive as duas ditas "raízes" e as três pontas de consumo. Não existe entregável pequeno, logo não existe verificação executável antes de um esforço grande.
- **Categoria**: técnico
- **Probabilidade**: alta
- **Impacto**: crítico
- **Severidade combinada**: **Crítica**
- **Trigger / sinal de alerta**: a fatia 1 passar de duas revisões de prazo sem nenhuma comparação contra o oráculo ter rodado.
- **Mitigação**: Parallel Run **antes** da primeira virada, no nível de valor devolvido por hook e efeito no banco — não no nível de HTTP. É o que torna a fatia 1 verificável sem depender de uma superfície pronta. Mais: cortar primeiro os **65 ciclos de dois módulos com volta de peso 1** dentro do núcleo, o que dá marcos internos mensuráveis (`scc.py`).
- **Plano de contingência**: se a fatia 1 não produzir sinal verificável, parar de escrever domínio e fechar primeiro o arnês — escrever mais módulos sem oráculo aumenta o custo do erro linearmente com o código.
- **Owner**: `TL-PORTE`
- **Status**: aberto

### RISK-002
- **Descrição**: **O corpus de entrada do Parallel Run não existe, e nenhum dos 181 cards o cobre.** O catálogo supõe que o fluxo de entrada já exista em produção; [`questions.md`](../questions.md) P19 responde que **não há instalação em operação nem log retido**. A entrada tem de ser construída requisição a requisição, e é o maior item de custo escondido do projeto.
- **Categoria**: técnico
- **Probabilidade**: alta
- **Impacto**: alto
- **Severidade combinada**: **Crítica**
- **Trigger / sinal de alerta**: o primeiro relatório de paridade sair com cobertura declarada em "casos escritos" e não em "comportamentos cobertos".
- **Mitigação**: tratar o corpus como entregável com dono e estimativa próprios, derivado dos **804 critérios de aceite** e dos **289 passos de fluxo principal** dos 47 casos de uso — que já existem como texto. Declarar cobertura por área da Decisão 2, não no agregado.
- **Plano de contingência**: se o corpus não couber no prazo, reduzir **escopo de superfície** (§ 4.5 da estratégia) e não cobertura de paridade: paridade medida pela metade é pior que superfície entregue pela metade, porque não se sabe qual metade.
- **Owner**: `QA-PARIDADE`
- **Status**: aberto

### RISK-003
- **Descrição**: **Quinze dos 71 módulos não têm spec alguma, e 5 deles estão no núcleo compartilhado de 12** — `nucleo-utilitario-e-erro` (`fan_in` 68), `formatacao-e-escape` (65), `bootstrap-e-carregamento` (60), `camada-de-dados-wpdb` (33) e `telas-do-painel` (32). São exatamente as camadas que a P21 chama de *"aquelas em que 'idêntico' se decide"*. A autorização para fechar a lacuna **existe desde a P21 e não foi executada**.
- **Categoria**: organizacional
- **Probabilidade**: alta
- **Impacto**: crítico
- **Severidade combinada**: **Crítica**
- **Trigger / sinal de alerta**: a fatia 1 começar a ser escrita com `redator_progress.units` ainda em 74 unidades.
- **Mitigação**: executar `BR-HUMANA-004` opção **(a)** — rodar o redator para os 15 módulos, começando pelos 5 mais dependidos, **antes** da fatia 1, e reexecutar o Curator depois. Atrasa o *pipeline* em uma etapa e remove a maior lacuna estrutural da entrega.
- **Plano de contingência**: se a opção **(b)** for escolhida, tratar os 5 módulos como **fatia de descoberta** com orçamento próprio dentro da fatia 1, e marcar todo critério de aceite que dependa deles como 🟡 até a spec existir. O que **não** é contingência: construir e assumir que a spec confirmaria.
- **Owner**: `ANALISTA-SPEC`
- **Status**: aberto

### RISK-004
- **Descrição**: **A resposta (a) de `BR-HUMANA-003` derruba o enabler da estratégia recomendada.** O sentinela `'0000-00-00 00:00:00'` é o *default* de 10 colunas `datetime` e carrega significado de negócio. Manter a string literal (opção **c**) preserva o esquema, e com ele o banco compartilhado e o **zero de migração de dados**. Trocar por coluna anulável (opção **a**) muda o esquema: as duas metades deixam de poder compartilhar o banco.
- **Categoria**: técnico
- **Probabilidade**: média
- **Impacto**: crítico
- **Severidade combinada**: **Crítica**
- **Trigger / sinal de alerta**: qualquer proposta de DDL do alvo que declare `NULL` onde o legado declara o sentinela.
- **Mitigação**: responder `BR-HUMANA-003` **antes** da fatia 0. O banco alvo já está decidido como MySQL/MariaDB, o que torna (c) viável, e é o que o Curator recomenda nesse caso.
- **Plano de contingência**: se vier (a), **reavaliar a estratégia, não ajustá-la**: a recomendação volta para Parallel Run com corte único ao final, reaparece ETL e cada instalação adotante passa a precisar de janela. É mudança de plano, não de parâmetro.
- **Owner**: `DONO-DADOS`
- **Status**: aberto

### RISK-005
- **Descrição**: **A metade TypeScript escreve estrutura que a metade PHP não lê.** `DB-SER`: quatro famílias de coluna `longtext` guardam estrutura **PHP serializada** — opções e as quatro tabelas de metadados. E `PERM-2`: a autorização mora num metadado serializado por site, com o nome do papel dentro da própria `meta_key` ([`architecture.md`](../architecture.md) §9 risco 3). Qualquer divergência de um byte no codec quebra a coexistência.
- **Categoria**: técnico
- **Probabilidade**: média
- **Impacto**: crítico
- **Severidade combinada**: **Crítica**
- **Trigger / sinal de alerta**: o primeiro papel ou opção escrito pela metade nova aparecer vazio, truncado ou com tipo trocado na metade antiga.
- **Mitigação**: codec de `serialize()`/`unserialize()` do PHP como item da **fatia 0**, com teste de ida e volta sobre amostra extraída do oráculo, incluindo os casos que o formato tem e JSON não: inteiro contra string numérica, `float`, booleano, `null`, aninhamento e referência.
- **Plano de contingência**: se a paridade byte a byte do codec não for alcançável, a coexistência de **escrita** cai e o estrangulamento fica restrito às fatias **somente leitura** (2, 3 e 4) — o que ainda entrega valor de verificação, mas não a sequência completa.
- **Owner**: `DONO-DADOS`
- **Status**: aberto

### RISK-006
- **Descrição**: **Administrador que atravessa a fronteira do *proxy* é deslogado.** A chave do HMAC do cookie embute um fragmento de **4 caracteres** do hash da senha (`wp-includes/pluggable.php:855-867`, [`gaps.md`](../gaps.md) A-05); o *nonce* amarra tick, ação, usuário e token de sessão; e o token de sessão vive em `usermeta`. A unit de autenticação já registra a consequência em `TM-04`: *"transportar as chaves e sais, ou aceitar que todo cookie e todo nonce existente deixa de valer na virada"*.
- **Categoria**: técnico
- **Probabilidade**: alta
- **Impacto**: alto
- **Severidade combinada**: **Crítica**
- **Trigger / sinal de alerta**: sessão que se perde ao navegar entre uma tela servida pela metade antiga e outra pela metade nova.
- **Mitigação**: compatibilidade de cookie, *nonce* e sessão como item da **fatia 0**, com as duas metades lendo os mesmos sais e o mesmo armazenamento de token. Caso de teste explícito: entrar numa metade, navegar para a outra, e um formulário aberto antes da virada ainda validar.
- **Plano de contingência**: se a compatibilidade não for alcançada, agrupar as superfícies autenticadas numa virada **única** (fatias 6 e 9 juntas) e aceitar derrubar as sessões nessa virada — com aviso prévio no ambiente de referência, que não tem usuário real.
- **Owner**: `ARQ-CONTEXTO`
- **Status**: aberto

### RISK-007
- **Descrição**: **As duas metades disputam a evolução do esquema.** `DB-MIG` registra que o sistema é sua própria ferramenta de migração **por comparação de estrutura**, com `db_version` `61833` (`wp-includes/version.php:26`). `BR-DESCARTAR-006` descartou os 38 portões históricos de `upgrade_all()` sob a justificativa *"instalação nova: o caso não ocorre"* — e numa coexistência sobre banco compartilhado **o caso volta a ocorrer**.
- **Categoria**: técnico
- **Probabilidade**: média
- **Impacto**: crítico
- **Severidade combinada**: **Crítica**
- **Trigger / sinal de alerta**: qualquer `ALTER TABLE` originado da metade nova, ou a metade antiga oferecendo "atualizar banco de dados" após uma virada.
- **Mitigação**: **dono único declarado do esquema durante toda a coexistência** — a instalação de referência. A metade nova roda com a rotina de comparação de estrutura **desligada** e falha ruidosamente se detectar divergência, em vez de corrigi-la.
- **Plano de contingência**: *snapshot* do banco de referência antes de cada virada, com restauração testada. O oráculo não pode ser corrompido: ele é a única fonte de verdade de comportamento que o projeto tem.
- **Owner**: `DONO-DADOS`
- **Status**: aberto

### RISK-008
- **Descrição**: **Plugin PHP não roda na metade virada — e extensão ativa na referência contamina toda a paridade.** `ESC-FILTRAVEL` declara que **toda** regra do catálogo é um *default* filtrável; [`architecture.md`](../architecture.md) §9 risco 6 diz que *"ler o núcleo não basta"*; e A-8 registra que a lista de extensões ativas é desconhecida. Numa superfície já virada, todo filtro registrado por extensão PHP deixa de correr.
- **Categoria**: técnico
- **Probabilidade**: alta
- **Impacto**: alto
- **Severidade combinada**: **Crítica**
- **Trigger / sinal de alerta**: divergência de paridade que desaparece ao desativar uma extensão — ou que ninguém consegue reproduzir.
- **Mitigação**: **lista de extensões congelada e declarada** na instalação de referência, idealmente nenhuma além das empacotadas, e registrada junto de cada relatório de paridade. O Akismet já está fora de escopo por `BR-DESCARTAR-001/002/003`, o que ajuda: pode ficar desativado.
- **Plano de contingência**: se a referência precisar rodar com extensão ativa, declarar **duas** referências — uma limpa, para paridade, e outra com extensões, para exploração — e nunca comparar contra a segunda.
- **Owner**: `QA-PARIDADE`
- **Status**: aberto

### RISK-009
- **Descrição**: **Cada metade serve dado obsoleto escrito pela outra.** `object-cache` tem **27 dependentes** e é *drop-in* **por presença de arquivo** ([`domain.md`](../domain.md) §1.6). Com banco compartilhado e dois processos, um cache persistente em qualquer dos lados produz divergência intermitente.
- **Categoria**: técnico
- **Probabilidade**: média
- **Impacto**: médio
- **Severidade combinada**: **Média**
- **Trigger / sinal de alerta**: falha de paridade que não se reproduz na segunda execução.
- **Mitigação**: cache de objeto **persistente desligado nas duas metades** durante toda a coexistência, declarado como condição do ambiente de referência. Cache por requisição é permitido, porque morre com a requisição nas duas.
- **Plano de contingência**: se desempenho exigir cache, compartilhar **uma** instância entre as metades com o mesmo esquema de chave — e tratar o esquema de chave como contrato, igual ao esquema do banco.
- **Owner**: `SRE-IMPL`
- **Status**: aberto

### RISK-010
- **Descrição**: **Falso verde de paridade**: declarar equivalência comparando pelo critério errado para a área. O critério da Decisão 2 é **combinação por área** — byte a byte em contrato de terceiro e em valor devolvido por hook, efeito no banco no esquema e nas escritas, comportamento de caso de uso no HTML, e **teste próprio** para estado entre requisições concorrentes. Aplicar o critério mais permissivo numa área que exige o mais estrito passa divergência adiante.
- **Categoria**: técnico
- **Probabilidade**: média
- **Impacto**: alto
- **Severidade combinada**: **Alta**
- **Trigger / sinal de alerta**: relatório de paridade que reporta um número único, sem quebra por área.
- **Mitigação**: o arnês reporta **por área da Decisão 2**, e o relatório é inválido sem as cinco linhas. `BR-MIGRAR-116` já grava o critério como regra.
- **Plano de contingência**: reexecutar a comparação da área suspeita com o critério mais estrito e aceitar o retrabalho — é mais barato que descobrir no contrato de terceiro.
- **Owner**: `QA-PARIDADE`
- **Status**: aberto

---

## B. Riscos derivados da mudança de paradigma

> Subseção dedicada: há mudança de paradigma de severidade **alta**
> ([`paradigm_decision.md`](paradigm_decision.md) § *Gap identificado*). Listados apenas riscos cuja origem
> direta é o gap registrado ali. **Dois deles são operacionais** — `RISK-012` e `RISK-013` — porque a regra
> absoluta do SKILL manda que mudança grande de paradigma dispare registro explícito de risco operacional,
> e neste sistema a consequência operacional da travessia não é a mesma coisa que a consequência técnica.

### RISK-011
- **Descrição**: **Duas requisições concorrentes trocam de identidade entre si.** É a implicação 2, a mais grave da travessia. No legado o estado global é, **de fato**, estado de requisição, porque o processo é montado por `wp-settings.php` e descartado no fim da resposta: 1.121 declarações `global $` e 3.410 usos de superglobal em 216 arquivos. Numa runtime longo-viva, o mesmo módulo atende N requisições e esse estado passa a ser **compartilhado** — e `current_user_can` aparece **1.279 vezes em 224 arquivos**, com **três camadas paralelas de autorização, uma delas falhando ABERTA**. `BR-DESCARTAR-008` classifica o risco como **de ordem**: se o mecanismo sair antes de o substituto entrar, o sistema vaza sessão entre usuários.
- **Categoria**: técnico
- **Probabilidade**: alta
- **Impacto**: crítico
- **Severidade combinada**: **Crítica**
- **Trigger / sinal de alerta**: **não há** sinal natural — é exatamente o problema. **Nenhum dos 985 testes exercita duas requisições concorrentes** e nenhum dos 47 casos de uso descreve concorrência. O primeiro sinal real seria um usuário vendo dado de outro.
- **Mitigação**: `EXT-CONTEXTO` na **fatia 0**, antes de qualquer módulo de domínio — contexto por requisição explícito, `AsyncLocalStorage` ou parâmetro. E o **teste de concorrência que a Decisão 2 exige e que não existe em nenhum dos 181 cards**: duas requisições simultâneas com identidades diferentes atravessando os mesmos 1.279 pontos de verificação.
- **Plano de contingência**: se o teste de concorrência não existir no momento da fatia 6, **não virar** nenhuma superfície autenticada. Vazamento de sessão não é defeito a corrigir depois: é incidente.
- **Owner**: `ARQ-CONTEXTO`
- **Status**: aberto

### RISK-012
- **Descrição**: **O alvo perde o reinício por requisição como válvula de operação.** No legado, todo estado morre com a resposta: vazamento de memória, estado envenenado por extensão e conexão presa têm vida máxima de uma requisição. Num processo longo-vivo, os três **persistem até alguém reiniciar**. É consequência direta do gap, e nenhum artefato anterior a registrou como risco de **operação** — somando-se ao fato de que a decisão de infraestrutura foi **adiada de propósito** (sem container na primeira fase).
- **Categoria**: operacional
- **Probabilidade**: média
- **Impacto**: alto
- **Severidade combinada**: **Alta**
- **Trigger / sinal de alerta**: degradação que melhora com reinício — o sintoma clássico, e o que o legado nunca produziu.
- **Mitigação**: declarar, junto da fatia 0, o que no alvo é **escopo de processo** e o que é **escopo de requisição** — e que nada de domínio vive no primeiro. Reinício programado e verificação de saúde entram como requisito de implantação, não como melhoria.
- **Plano de contingência**: reinício automático por limite de memória e por tempo de vida, até a causa ser achada. É remendo, e fica registrado como tal.
- **Owner**: `SRE-IMPL`
- **Status**: aberto

### RISK-013
- **Descrição**: **Reproduzir "nenhum limite de taxa" tem raio de alcance diferente no alvo.** `ESC-LIMITE-TAXA` manda portar a ausência de limite, e os únicos dois freios são travas de tempo — 60 s no `wp-cron.php` e 5 min no `wp-mail.php`, os dois números no código. Em PHP, uma enxurrada custa um processo por requisição, que morre. **Numa runtime de laço de eventos único, ela bloqueia o atendimento de todas as outras requisições.** A regra é idêntica; a consequência operacional não é.
- **Categoria**: operacional
- **Probabilidade**: média
- **Impacto**: alto
- **Severidade combinada**: **Alta**
- **Trigger / sinal de alerta**: latência de todas as superfícies subindo junto, em vez de só a superfície atacada.
- **Mitigação**: o rumo já está decidido pela P19 — **limite de taxa é decisão de implantação, fora do núcleo**, para não inventar número que o produto nunca teve. A estratégia acrescenta: a ausência de limite no núcleo tem de vir acompanhada de recomendação de implantação **escrita**, porque no alvo ela deixa de ser inócua.
- **Plano de contingência**: limite no *proxy*, que já existe por causa do estrangulamento — é o lugar certo, e não altera o núcleo nem o critério de idêntico.
- **Owner**: `SRE-IMPL`
- **Status**: aberto

### RISK-014
- **Descrição**: **A fronteira de `await` muda a ordem de emissão do HTML.** Implicações 1 e 6: toda I/O do legado é bloqueante e vive no meio do fluxo — 949 chamadas `$wpdb->` em 86 arquivos, 15 `fsockopen` em 10 arquivos — e há **1.463 `echo`/`print`** intercalados. Em TypeScript cada I/O vira `Promise` e a assincronia contamina o chamador; um `await` no meio da emissão reordena a saída.
- **Categoria**: técnico
- **Probabilidade**: média
- **Impacto**: médio
- **Severidade combinada**: **Média**
- **Trigger / sinal de alerta**: divergência de ordem em HTML que nenhum critério de caso de uso reprova.
- **Mitigação**: a Decisão 2 já **desarma** a maior parte deste risco de propósito: HTML de tema e painel é aceito por **comportamento de caso de uso**, não byte a byte, *"porque a ordem de emissão varia no próprio legado conforme o tema"*. O que sobra é onde o critério **é** byte a byte: contrato de terceiro (fatias 2, 4 e 10) e valor devolvido por hook. Ali a fronteira de `await` é declarada por fatia e o domínio permanece síncrono.
- **Plano de contingência**: bufferizar a resposta inteira antes de emitir, nas superfícies de contrato de terceiro, e comparar o buffer. Custa memória e remove a classe de erro.
- **Owner**: `TL-PORTE`
- **Status**: aberto

### RISK-015
- **Descrição**: **O disparo que precisa falhar passa a completar.** Implicação 6: o *loopback* e o `wp-cron` são disparos **deliberadamente** não bloqueantes — *timeout* 0,01 s, `blocking` falso, `sslverify` falso. Em PHP isso **aborta** a requisição de saída. Numa runtime assíncrona o laço de eventos continua vivo depois da resposta e a requisição pode **completar** — e aí o comportamento que a P10 manda preservar (`R5`, ADR-0006: *um site que ninguém administra nunca executa a própria limpeza*) **desaparece**, sem que nada acuse.
- **Categoria**: técnico
- **Probabilidade**: alta
- **Impacto**: alto
- **Severidade combinada**: **Crítica**
- **Trigger / sinal de alerta**: a lixeira do ambiente de referência esvaziar sem visita autenticada ao painel. É sinal **positivo** de defeito: o alvo acertou demais.
- **Mitigação**: **fatia própria** (fatia 5), com critério de aceite que verifica **a falha do disparo e não a latência** — é mandato explícito do `paradigm_decision.md` a este agente, cumprido na § 5.2 da estratégia. E `BR-HUMANA-005` como pré-requisito: conferir a equivalência das **4 implementações independentes** do protocolo de *loopback* contra o oráculo **antes** de unificar.
- **Plano de contingência**: se a falha não for reproduzível na runtime alvo, registrar como **exceção ao idêntico** — com decisão humana, pelo mesmo teste das três exceções já autorizadas — e nunca como efeito colateral de implementação.
- **Owner**: `TL-PORTE`
- **Status**: aberto

### RISK-016
- **Descrição**: **Dependência circular deixa de ser dívida de estilo e passa a ser erro de inicialização.** Implicação 5: **68 dos 71 módulos num único componente fortemente conexo**, com **254 ciclos de dois módulos**. No legado isso não dói, porque o carregamento é por `require`/`include` — 1.342 em 282 arquivos — com 176 guardas `function_exists`. Em módulo ESM, importação circular lida na avaliação do módulo é **erro**, não aviso.
- **Categoria**: técnico
- **Probabilidade**: média
- **Impacto**: alto
- **Severidade combinada**: **Alta**
- **Trigger / sinal de alerta**: `undefined` em tempo de importação, ou ordem de importação que precisa ser "a certa" para o processo subir — que é exatamente o que o legado já tem como contrato público, e o que o alvo não deve herdar.
- **Mitigação**: os 5 passos declarados na § 5.1 da estratégia — núcleo de 12 módulos declarado antes do domínio, regra de dependência no *build* **começando vermelha** nas 175 violações conhecidas, os 65 ciclos de volta de peso 1 cortados primeiro, `bootstrap-e-carregamento ↔ hooks-e-plugin-api` (515 contra 60) colocado inteiro no núcleo, e injeção tardia onde o ciclo sobrar.
- **Plano de contingência**: núcleo compartilhado como **um** módulo de compilação enquanto o ciclo não for resolvido — perde verificação de fronteira interna e mantém o processo subindo.
- **Owner**: `DONO-NUCLEO`
- **Status**: aberto

### RISK-017
- **Descrição**: **A cascata de moderação perde a ordem e o curto-circuito, que são a regra.** Implicação 3: [`domain.md`](../domain.md) §2.2 é a área de maior densidade de regra do sistema, com **13 regras em que a ordem importa e cada etapa pode encerrar a decisão** — `C4` retorna falso na primeira linha e *"nenhuma outra regra é consultada"*; `C3` entra aprovado *"sem passar por nenhuma verificação"*; `C1` devolve **409** e `C2` **429** na mesma resposta ao visitante. Desenhada como *pipeline* de eventos, perde as duas propriedades e o 409/429 vira 202.
- **Categoria**: técnico
- **Probabilidade**: baixa
- **Impacto**: crítico
- **Severidade combinada**: **Alta**
- **Trigger / sinal de alerta**: qualquer desenho de moderação em que uma etapa publique evento em vez de devolver decisão; ou um 202 onde o oráculo devolve 409.
- **Mitigação**: a Decisão 1 (Opção 3) **já proíbe** — por isso a probabilidade é baixa, não porque o erro seja difícil. Reforçado em `BR-MIGRAR-009` a `BR-MIGRAR-020` e endereçado ao Designer: cadeia síncrona de curto-circuito com ordem declarada. A fatia 7 tem as 12 regras como critério de aceite por efeito no banco **e** por código HTTP.
- **Plano de contingência**: se a cascata for implementada como *pipeline*, reverter o desenho — não compensar com casos especiais. A regra **é** a ordem.
- **Owner**: `TL-PORTE`
- **Status**: aberto

---

## C. Riscos de dados

### RISK-018
- **Descrição**: **O esquema legado é contrato, e três de suas propriedades parecem defeito.** `DB-SENT`: o esquema evita `NULL` e usa **sentinelas que nenhuma constraint distingue de valor legítimo**. `DB-TRG1` a `DB-TRG4`: **3 contadores desnormalizados** costuram os domínios, um deles com **dois critérios de cálculo diferentes**, e apagar **reparenteia** filhos em vez de apagá-los. `erd-complete.md` e [`architecture.md`](../architecture.md) §9 risco 9: declarar FK com `ON DELETE CASCADE` no destino **muda** o comportamento observável. E `N2`: `blogs.deleted` tem **três** valores, não dois — o valor `2` significa "não ativado" e o dicionário de dados descrevia 0/1.
- **Categoria**: técnico
- **Probabilidade**: média
- **Impacto**: alto
- **Severidade combinada**: **Alta**
- **Trigger / sinal de alerta**: qualquer DDL do alvo que acrescente FK, `NOT NULL`, `CHECK` ou `ENUM` onde o legado tem `varchar(20)` solto — ou um comentário órfão tratado como erro.
- **Mitigação**: `efeito no banco` é critério de aceite da Decisão 2 para esquema e escritas, **incluindo a cascata de 7 etapas e os órfãos que o legado deixa de propósito**. O DDL do alvo é derivado do oráculo, não desenhado: 18 tabelas, 135 colunas, 59 índices, **zero** chaves estrangeiras.
- **Plano de contingência**: onde um conserto de integridade for desejado, ele é **decisão separada e registrada** — nunca efeito colateral de reescrita. É a mesma regra que a Decisão 1 fixou para as 5 bordas.
- **Owner**: `DONO-DADOS`
- **Status**: aberto

### RISK-019
- **Descrição**: **Volumetria desconhecida** ([`architecture.md`](../architecture.md) §10 **A-7**): nenhuma instância do banco foi acessada, não há contagem de linha nem tamanho de `uploads/`. Não há como dimensionar instância, índice, volume ou janela — e os 183 passos de migração de dados que o redator gravou em **68 das 74 units** descrevem *o que* transformar, nunca *quanto*.
- **Categoria**: técnico
- **Probabilidade**: alta
- **Impacto**: médio
- **Severidade combinada**: **Alta**
- **Trigger / sinal de alerta**: a primeira estimativa de janela de instalação adotante que cite horas sem citar linhas.
- **Mitigação**: a estratégia recomendada **remove a necessidade** no escopo deste projeto: mesmo esquema, zero migração de dados, e nenhuma instalação em operação (P19). O risco fica confinado ao [`cutover_plan.md`](cutover_plan.md) § *Anexo*, que é **parametrizado** e declara a dependência em vez de inventar número.
- **Plano de contingência**: nenhuma janela de instalação adotante é comprometida antes de `SELECT COUNT(*)` por tabela e do tamanho de `uploads/`. Compromisso sem esse dado é adivinhação com data.
- **Owner**: `PO-PORTE`
- **Status**: aberto

### RISK-020
- **Descrição**: **A migração de dados não é um passo prévio: é parte do caminho de leitura** ([`architecture.md`](../architecture.md) §9 risco 8). O banco contém, ao mesmo tempo, dados de **todas as gerações do formato**, e é a leitura que normaliza. Remover um ramo antigo é decisão de produto, não limpeza. Some-se `DB-SEED`: o esquema vazio **não é funcional** — parte da regra está nas linhas que o instalador cria.
- **Categoria**: técnico
- **Probabilidade**: média
- **Impacto**: alto
- **Severidade combinada**: **Alta**
- **Trigger / sinal de alerta**: código do alvo que trata um formato antigo como inválido em vez de como ramo de leitura.
- **Mitigação**: `BR-DESCARTAR-005` e `BR-DESCARTAR-006` descartaram `RESET_CAPS` e os 38 portões históricos sob a justificativa **"instalação nova: o caso não ocorre"** — e isso só vale enquanto o alvo não ler banco de instalação antiga. A estratégia declara: **ler banco legado é capacidade do produto**, e a decisão de quais gerações de formato suportar é de `PO-PORTE`, registrada, não deduzida.
- **Plano de contingência**: declarar a versão mínima de esquema aceita pelo alvo e falhar ruidosamente abaixo dela — melhor que ler errado em silêncio.
- **Owner**: `PO-PORTE`
- **Status**: aberto

---

## D. Riscos operacionais

### RISK-021
- **Descrição**: **A referência deriva.** O legado **não** está em *decommission*: é o WordPress *upstream*, que segue lançando versão. A referência está cravada em `7.1.2` (`wp-includes/version.php:19`) e o pacote não é cruzável com release pública (A-5: sem tag, changelog nem metadado de VCS, não se sabe quais correções de segurança já estão aplicadas). Agrava: `ESC-CLIENTE` adota o lado cliente do editor como **dependência externa de versão cravada**, e atualizá-lo passa a exigir conferir o contrato servidor **da mesma versão** — o próprio `pending_decisions.md` chama isso de *"preço, nomeado"*.
- **Categoria**: operacional
- **Probabilidade**: alta
- **Impacto**: médio
- **Severidade combinada**: **Alta**
- **Trigger / sinal de alerta**: a primeira atualização do pacote `@wordpress/*` do editor, ou a primeira correção de segurança publicada pelo *upstream* para a linha 7.1.
- **Mitigação**: cravar a versão de referência **por escrito** e tratar "acompanhar o *upstream*" como decisão de produto com cadência própria, posterior à versão 1. O oráculo é a instalação de **7.1.2** e não muda durante o projeto.
- **Plano de contingência**: se o *upstream* publicar correção de segurança que afete o escopo, avaliá-la como **mudança de escopo** com sua própria entrada no registro — não como atualização de rotina.
- **Owner**: `PO-PORTE`
- **Status**: aberto

### RISK-022
- **Descrição**: **A decisão de infraestrutura foi adiada de propósito, e o motivo é um conflito real.** Não há container na primeira fase porque **o atualizador embutido sobrescreve o próprio código em execução** ([`deployment.md`](../deployment.md) §8, com 7 pontos de colisão; [`architecture.md`](../architecture.md) §9 risco 11). Containerizar muda o comportamento observável do caso de uso de atualização (UC-33, UC-34, UC-35). Enquanto isso, o ambiente de referência e a metade nova sobem sem receita reproduzível: `surface.json.docker` e `surface.json.ci_cd` estão **vazios**.
- **Categoria**: operacional
- **Probabilidade**: média
- **Impacto**: alto
- **Severidade combinada**: **Alta**
- **Trigger / sinal de alerta**: o ambiente de referência precisar ser recriado e ninguém conseguir reproduzi-lo igual — momento em que o oráculo deixa de ser oráculo.
- **Mitigação**: receita reproduzível do **ambiente de referência** antes da fatia 0, mesmo sem container: versão de PHP, de MySQL, `wp-config.php` com os valores declarados, lista de extensões congelada (RISK-008) e sais fixos (RISK-006). O adiamento do container vale para o **produto**, não para o oráculo.
- **Plano de contingência**: *snapshot* de máquina do ambiente de referência, versionado, como substituto da receita.
- **Owner**: `SRE-IMPL`
- **Status**: aberto

### RISK-023
- **Descrição**: **Observabilidade zero nos dois lados.** **0 arquivos de log** nesta árvore; 49 chamadas a `error_log` em 12 arquivos; o único histórico persistente de falha é a opção `auto_core_update_failed`; e [`integrations/integrations.md`](../integrations/integrations.md) registra que a integração mais crítica do sistema — o *loopback*, sem o qual nada agendado roda — **falha silenciosamente por projeto**. Divergência de paridade em 5 bordas tem de ser diagnosticada sem nenhum registro de nenhum dos dois lados.
- **Categoria**: operacional
- **Probabilidade**: alta
- **Impacto**: alto
- **Severidade combinada**: **Crítica**
- **Trigger / sinal de alerta**: a primeira divergência de paridade cuja causa ninguém consegue localizar.
- **Mitigação**: instrumentar **o arnês**, não o produto — o arnês de Parallel Run registra requisição, resposta, consulta SQL e valor devolvido por hook nos dois lados, e isso **não** altera o núcleo nem o critério de idêntico. É a única observabilidade que o projeto pode comprar sem mudar o produto.
- **Plano de contingência**: onde o arnês não alcançar, reproduzir a divergência num caso mínimo escrito à mão. Caro, e é o preço de zero log.
- **Owner**: `QA-PARIDADE`
- **Status**: aberto

### RISK-024
- **Descrição**: **A regra de dependência não tem onde falhar.** O núcleo de 12 módulos só se sustenta por verificação no *build*, e esta árvore **não tem *pipeline* algum**: `surface.json.ci_cd` vazio, nenhum `Dockerfile`, nenhum `composer.lock`. [`refactor/architectures.md`](../refactor/architectures.md) §5 é explícito: *"sem a regra ligada e falhando, em dois anos o resultado é o mesmo componente de 68 módulos com nomes de pasta melhores: custo pago, benefício nenhum"*.
- **Categoria**: operacional
- **Probabilidade**: alta
- **Impacto**: médio
- **Severidade combinada**: **Alta**
- **Trigger / sinal de alerta**: a lista de exceções da regra de camada crescer entre duas semanas sem nenhuma ter sido removida.
- **Mitigação**: *pipeline* com a regra de dependência **começando vermelha** nas 175 violações conhecidas (peso 990, 2,2% do total), com lista de exceções **datada**. Regra que começa verde não pega nada e não é regra.
- **Plano de contingência**: se o *pipeline* não existir no início da fatia 1, a regra de camada é **declarada como intenção**, não como garantia — e o número de violações é publicado a cada fatia, para que a dívida seja visível.
- **Owner**: `DONO-BUILD`
- **Status**: aberto

---

## E. Riscos organizacionais

### RISK-025
- **Descrição**: **A capacidade que a stack alvo exige é maior do que "saber TypeScript".** A decisão de **nenhum framework opinativo** (🟢 `pending_decisions.md` § *Lacuna 1*) significa que o time escreve o próprio servidor HTTP mínimo, o próprio registro para as **42 substituições** (38 funções de `pluggable.php` + 4 *drop-ins*), a própria camada de dados com **SQL à mão** reproduzindo 9 classes que montam SQL por fragmento **com um filtro entre cada fragmento**, e o próprio contexto por requisição. [`refactor/architectures.md`](../refactor/architectures.md) estima **2 a 4 times** para o monólito modular, com **dono único** para os 12 módulos do núcleo. Nada disso é trabalho de framework.
- **Categoria**: organizacional
- **Probabilidade**: média
- **Impacto**: alto
- **Severidade combinada**: **Alta**
- **Trigger / sinal de alerta**: a primeira proposta de adotar um ORM, um container de DI ou um framework com ciclo de vida próprio "para ir mais rápido" — cada uma desfaz uma decisão já tomada e muda o paradigma natural.
- **Mitigação**: as decisões de stack estão registradas **com o motivo** em `pending_decisions.md`, e o motivo é de contrato, não de gosto: ORM esconde o fragmento de SQL e com ele o ponto de extensão que a P3 declarou ser o produto; framework com ciclo de vida disputa com a ordem de arranque, que é contrato público. Reabrir qualquer uma é decisão registrada, não atalho de implementação.
- **Plano de contingência**: se a capacidade não existir, reduzir **escopo de superfície** antes de reduzir rigor de stack — a segunda opção desfaz o critério de aceite.
- **Owner**: `PATROC` (🔴 não nomeado)
- **Status**: aberto

### RISK-026
- **Descrição**: **Nove decisões humanas pendentes travam quatro fatias.** `BR-HUMANA-001` a `BR-HUMANA-009` estão **todas** com status PENDENTE ([`ambiguity_log.md`](ambiguity_log.md)), e quatro delas são pré-requisito de fatia: `BR-HUMANA-003` da fatia 0 (e da estratégia inteira, RISK-004), `BR-HUMANA-004` da fatia 1 (RISK-003), `BR-HUMANA-005` da fatia 5 e `BR-HUMANA-008` da fatia 6. Somam-se os **23 cards bloqueados** do backlog, de **duas naturezas que não devem ser confundidas**: 13 fecham com acesso a instalação real, 10 exigem decisão humana.
- **Categoria**: organizacional
- **Probabilidade**: alta
- **Impacto**: alto
- **Severidade combinada**: **Crítica**
- **Trigger / sinal de alerta**: uma fatia começar com a sua decisão pendente ainda em PENDENTE.
- **Mitigação**: cada fatia da § 4.4 da estratégia declara a sua trava. A ordem de resposta que destrava mais com menos: `BR-HUMANA-003` (estratégia), `BR-HUMANA-004` (fatia 1), `BR-HUMANA-001` (*framework*), depois as de fatia.
- **Plano de contingência**: onde a decisão não chegar, a fatia **não começa**; começa a seguinte cuja trava esteja respondida. O que não é contingência: decidir no lugar de quem decide — nenhuma das 9 foi decidida em nome de ninguém, e esta etapa manteve isso.
- **Owner**: `PO-PORTE`
- **Status**: aberto

### RISK-027
- **Descrição**: **As 175 violações de camada são a primeira coisa cortada quando o prazo aperta.** [`refactor/architectures.md`](../refactor/architectures.md) §5 nomeia o mecanismo: *"cada uma é um conserto que muda código sem mudar comportamento, logo invisível para quem valida por critério de aceite — e por isso a primeira coisa a ser cortada quando o prazo aperta"*. O mesmo vale para o arnês de paridade, que também não aparece no critério de aceite de nenhuma fatia por si só. E o prazo é 🔴 **indefinido**, o que torna o aperto imprevisível em vez de improvável.
- **Categoria**: organizacional
- **Probabilidade**: alta
- **Impacto**: médio
- **Severidade combinada**: **Alta**
- **Trigger / sinal de alerta**: uma fatia entregue com critério de aceite verde e contagem de violações de camada **maior** que na anterior.
- **Mitigação**: publicar a contagem de violações e a cobertura de paridade **por área** a cada fatia, lado a lado com o critério de aceite — o que é invisível não é cortado por maldade, é cortado por ser invisível.
- **Plano de contingência**: se o corte acontecer, registrá-lo como dívida **datada** com dono, e não como decisão técnica silenciosa. A estratégia já declara as 175 como dívida explícita, e não como defeito.
- **Owner**: `DONO-NUCLEO`
- **Status**: aberto

---

## F. Riscos regulatórios e legais

### RISK-028
- **Descrição**: **Clonar um produto GPL é risco de estratégia, e nenhuma etapa do pacote o registrou.** [`inventory.md`](../inventory.md) §1 registra a licença como **GPL v2 ou posterior** (`license.txt` da raiz — há outros 10 arquivos de mesmo nome em bibliotecas vendorizadas — e `readme.html:95`). Um clone em TypeScript derivado da leitura desse código, distribuído, levanta duas questões independentes: a obrigação de licenciamento da obra derivada, e o uso de marca — o nome do produto e as suas marcas não acompanham a licença do código. `ESC-CLIENTE` acrescenta uma terceira: o lado cliente entra como **dependência externa de versão cravada**, logo a distribuição carrega pacotes de terceiro com as suas próprias licenças.
- **Categoria**: regulatório
- **Probabilidade**: média
- **Impacto**: crítico
- **Severidade combinada**: **Crítica**
- **Trigger / sinal de alerta**: a primeira decisão sobre nome, marca ou licença do artefato distribuído sendo tomada por engenharia.
- **Mitigação**: **parecer jurídico antes da versão 1**, cobrindo licença da obra derivada, licenças dos pacotes adotados e uso de marca. Este registro declara o fato (GPL v2+, 🟢) e **não** emite opinião legal — não é competência desta etapa.
- **Plano de contingência**: nenhuma distribuição externa antes do parecer. Uso interno e ambiente de referência não distribuem, logo não antecipam a questão.
- **Owner**: `JUR`
- **Status**: aberto

### RISK-029
- **Descrição**: **O produto nasce com dívida de segurança reproduzida de propósito, e com obrigação de LGPD/GDPR herdada.** São **5 achados de segurança** registrados em [`integrations/integrations.md`](../integrations/integrations.md), e as respostas humanas mandam **preservar** os modos de falha: `A8` (a assinatura do pacote não é verificada — `wp_trusted_keys()` devolve lista vazia desde 2021-04-01, com `wp_signature_softfail` em `true`), `ESC-HTTP` (**13 canais nascem em `http://` e 7 repetem a requisição em claro quando o TLS falha, inclusive o de *checksums***), `ESC-ENUMERACAO` (a mensagem de login distingue conta inexistente de senha incorreta), `ESC-SESSAO` (trocar a senha não revoga sessão) e `BR-HUMANA-008` (rota REST sem `permission_callback` **funciona** — a única das três camadas de autorização que falha **aberta**). No lado de dados pessoais, a P20 declara: `registration_log` acumula IP e e-mail **sem prazo**, e apagar o site não o toca — obrigação que **a implantação assume**.
- **Categoria**: regulatório
- **Probabilidade**: alta
- **Impacto**: alto
- **Severidade combinada**: **Crítica**
- **Trigger / sinal de alerta**: a dívida ser descoberta por quem adota o produto, em vez de ser lida num documento entregue com ele.
- **Mitigação**: **entregar a dívida declarada junto do produto**, item por item, cada um com a fórmula que as respostas já usam — *dívida herdada reproduzida de propósito, fechável pela implantação sem alterar o núcleo*. Para os dados pessoais: rotina de descarte **configurável, não embutida**, como a P20 determina, e o prazo declarado pela implantação.
- **Plano de contingência**: onde o conserto for desejado, ele é **decisão separada e registrada** — nunca efeito colateral de reescrita, porque um adaptador bem escrito conserta por acidente e quebra o critério de idêntico. E `BR-HUMANA-008` é a que mais urge: é a de **maior alcance** das quatro da mesma classe, vale para toda rota de toda extensão, e **ninguém a perguntou**.
- **Owner**: `SEC-DPO`
- **Status**: aberto

---

## Resumo por severidade

| Severidade | Quantidade | IDs |
|---|---:|---|
| Crítica | **14** | RISK-001, RISK-002, RISK-003, RISK-004, RISK-005, RISK-006, RISK-007, RISK-008, RISK-011, RISK-015, RISK-023, RISK-026, RISK-028, RISK-029 |
| Alta | **13** | RISK-010, RISK-012, RISK-013, RISK-016, RISK-017, RISK-018, RISK-019, RISK-020, RISK-021, RISK-022, RISK-024, RISK-025, RISK-027 |
| Média | **2** | RISK-009, RISK-014 |
| Baixa | **0** | — |
| **Total** | **29** | |

### Por categoria

| Categoria | Quantidade | IDs |
|---|---:|---|
| técnico | **17** | RISK-001, RISK-002, RISK-004, RISK-005, RISK-006, RISK-007, RISK-008, RISK-009, RISK-010, RISK-011, RISK-014, RISK-015, RISK-016, RISK-017, RISK-018, RISK-019, RISK-020 |
| operacional | **6** | RISK-012, RISK-013, RISK-021, RISK-022, RISK-023, RISK-024 |
| organizacional | **4** | RISK-003, RISK-025, RISK-026, RISK-027 |
| regulatório | **2** | RISK-028, RISK-029 |
| financeiro | **0** | — 🔴 **não é ausência de risco: é ausência de brief.** Sem orçamento declarado, nenhum risco financeiro é dimensionável, e inventar um seria pior que registrar a lacuna |
| **Total** | **29** | |

> **Os três riscos de dados contam como `técnico`** (RISK-018, RISK-019 e RISK-020), porque o vocabulário
> de categoria do template tem cinco valores e `dados` não é um deles. Eles estão agrupados na § C para
> leitura, e classificados em `técnico` no campo do item.

---

## Riscos relacionados ao paradigma alvo

> Subseção dedicada, porque há mudança de paradigma de severidade **alta**. Listados **apenas** os riscos
> cuja origem direta é o gap registrado em [`paradigm_decision.md`](paradigm_decision.md) § *Gap
> identificado*, com a implicação de origem.

| Risco | Implicação de origem | Severidade |
|---|---|---|
| **RISK-011** — duas requisições concorrentes trocam de identidade | **2** — estado de requisição vira estado de processo | **Crítica** |
| **RISK-012** — o alvo perde o reinício por requisição como válvula (**operacional**) | **2** — processo longo-vivo | **Alta** |
| **RISK-013** — ausência de limite de taxa num laço de eventos único (**operacional**) | **2** e **6** — runtime longo-viva | **Alta** |
| **RISK-014** — a fronteira de `await` muda a ordem de emissão do HTML | **1** e **6** — a assincronia contamina o chamador | **Média** |
| **RISK-015** — o disparo que precisa falhar passa a completar | **6** — não bloqueante depende de **falhar** | **Crítica** |
| **RISK-016** — ciclo de módulo vira erro de inicialização | **5** — 254 ciclos, SCC de 68 | **Alta** |
| **RISK-017** — a cascata perde ordem e curto-circuito | **3** — 13 regras com encerramento | **Alta** |

**Cobertura das 8 implicações, declarada:**

| Implicação | Risco correspondente | Observação |
|---|---|---|
| 1 — o barramento devolve valor em 69,7% dos casos | RISK-014 | o resto é mandato do Curator, já cumprido em `EXT-FILTROS` |
| 2 — estado global vira estado de processo | RISK-011, RISK-012, RISK-013 | a mais grave; três riscos, um deles de ordem (`BR-DESCARTAR-008`) |
| 3 — cascata com curto-circuito | RISK-017 | probabilidade baixa **porque a Decisão 1 já proíbe**, não porque o erro seja difícil |
| 4 — política de *retry* escrita à mão | **sem risco próprio** | 🟢 **neutralizado por decisão já tomada**: a stack alvo **não tem mensageria** (P10), logo não há `retry` de infraestrutura a adotar. O mandato está cumprido na § 5.3 da estratégia |
| 5 — 254 ciclos de dois módulos | RISK-016 | mandato cumprido na § 5.1 da estratégia |
| 6 — o disparo depende de falhar | RISK-015, RISK-013, RISK-014 | mandato cumprido na § 5.2 da estratégia (fatia própria) |
| 7 — 38 funções substituíveis e 4 *drop-ins* | RISK-025 | vira risco **organizacional**: o alvo compra o container por necessidade, e quem o escreve é o time |
| 8 — 7 passos sem transação viram saga sem compensação | **sem risco próprio** | 🟢 **neutralizado pela mesma decisão**: sem mensageria e sem evento, a sequência continua sequência. Reaparece se alguém introduzir fila depois — e aí é risco novo, não este |

---

## Notas

1. **Nenhum *owner* é pessoa, e isso não é desleixo.** O brief não existe e não nomeia *stakeholder*
   algum; o SKILL exige *owner* identificável, *"papel, mesmo que não nomeado pessoalmente"*. O patrocinador
   (`PATROC`) fica marcado 🔴 porque é o único papel que **ninguém** pode assumir por conta própria.

2. **Há uma categoria vazia e ela é informativa.** Zero riscos **financeiros** não significa que não
   existam: significa que, sem orçamento declarado, nenhum é dimensionável. Registrar "risco de estouro de
   orçamento" sem orçamento seria ruído com aparência de rigor.

3. **Dois riscos foram neutralizados por decisões já tomadas, e isso vale registrar.** As implicações 4 e 8
   do paradigma — *retry*/DLQ e saga sem compensação — **não** geram risco neste projeto porque a stack
   alvo não tem mensageria (P10) e a Decisão 1 manteve o fluxo síncrono. São os dois únicos pontos em que o
   gap `procedural → event-driven` do catálogo **não** se materializa. Se alguém introduzir fila depois, os
   dois voltam, e como riscos novos.

4. **O risco de maior severidade não tem sinal de alerta.** `RISK-011` é o único cujo campo *trigger* diz
   que não há sinal natural: **nenhum dos 985 testes exercita concorrência** e nenhum dos 47 casos de uso a
   descreve. A Decisão 2 criou uma área de critério própria para isso e **o teste correspondente não existe
   em nenhum dos 181 cards**. É trabalho novo, e é pré-requisito da fatia 6.

5. **Nada fora de `_reversa_sdd/migration/` foi modificado.** Os três arquivos desta etapa são
   [`migration_strategy.md`](migration_strategy.md), este registro e [`cutover_plan.md`](cutover_plan.md).
   O rascunho de trabalho está em `.reversa/work/reversa-strategist/`.
