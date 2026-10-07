---
schemaVersion: 1
generatedAt: 2026-10-06T18:30:00-03:00
reversa:
  version: "1.0.0"
kind: discard_log
producedBy: curator
hash: "sha256:7c4cd11b5f84d5c8e314b3de0f4689a1131edeb661ec7c0e76e34463fce74767"
---

# Discard Log

> Registro completo do que foi descartado da migração e por quê. Cada item tem rastreabilidade para a
> origem no legado.

> Gerado pelo **Curator** (Time de Migração) em 2026-10-06 · `doc_level` **detalhado** · idioma **Português**
> Resumo e contexto em [`target_business_rules.md`](target_business_rules.md).

## Resumo

- Itens descartados: **10**
- Vinculados a paradigma: **3**
- Por escopo declarado (extensão empacotada, Pergunta 13): **3**
- Por restrição técnica do alvo (instalação nova, Pergunta 2): **2**
- Por exceção autorizada ao idêntico (defeito conhecido, não regra): **2**

> **Leitura obrigatória antes de usar esta lista:** os 3 itens vinculados a paradigma descartam
> **mecanismo, não regra**. Em todos os três, a função que o mecanismo exercia migra em
> [`target_business_rules.md`](target_business_rules.md) com outro nome, e o campo *Reposição no
> sistema novo* diz qual item. Quem ler só esta lista conclui que o alvo perde extensibilidade,
> escopo de requisição e ordem de arranque — e as três migram.

---

## Itens descartados

### BR-DESCARTAR-001
- **Origem**: [`domain.md`](../domain.md) §2.2 regra **C13** · unit [`comentarios/moderacao-de-comentario`](../comentarios/moderacao-de-comentario/design.md) · [`questions.md`](../questions.md) Pergunta 13
- **Descrição**: **Prazo de 15 dias para spam e apagamento em lotes de até 10.000**, com reconsulta do comentário cuja consulta ao serviço falhou até ele completar 15 dias, e então desistência.
- **Justificativa**: Fora do escopo declarado. A Pergunta 13 é explícita: *"Akismet é extensão empacotada, não núcleo… a reimplementação do Akismet em si não faz parte do clone do CMS"*. A regra vive em `wp-content/plugins/akismet/class.akismet.php`, fora do núcleo que está sendo clonado.
- **Vinculado a paradigma**: não
- **Reposição no sistema novo**: substituído pelo que o núcleo preserva: a cascata de moderação por palavra, link e autor conhecido (C4 a C9) e o **ponto de extensão** que permite a um classificador externo entrar (C9). O conector do Akismet continua **registrado** no núcleo (I3) — o que sai é o classificador, não o encaixe.
- **Risco de descartar**: **baixo** — Nenhuma regra do núcleo depende desta. O único efeito é que, sem classificador instalado, nenhum comentário é marcado como spam por serviço externo — exatamente o que acontece numa instalação limpa do legado sem chave de API.
- **Âncora no legado**: `wp-content/plugins/akismet/class.akismet.php:866` · `wp-content/plugins/akismet/class.akismet.php:1451`

### BR-DESCARTAR-002
- **Origem**: [`integrations/integrations.md`](../integrations/integrations.md) achado de segurança **akismet-em-http-puro-por-24h** · [`questions.md`](../questions.md) Pergunta 13
- **Descrição**: **O envio integral ao classificador externo:** cada comentário submetido faz enviar a `rest.akismet.com` **todo campo string de `$_POST` e todo cabeçalho de `$_SERVER` exceto o cookie** — e, depois de uma falha de TLS, isso trafega por 24 h em HTTP puro junto com a chave de API. É a maior exportação de dado pessoal do sistema, e sai de um formulário anônimo.
- **Justificativa**: Fora do escopo declarado (plugin, não núcleo) **e** com exceção condicional já autorizada por escrito: a Pergunta 13 manda que, *se e quando* o Akismet for portado, ele seja portado **com minimização**, porque reproduzir o envio integral *"seria recriar transferência internacional de dado pessoal de terceiro sem base legal, o que é defeito conhecido e não regra do produto"*.
- **Vinculado a paradigma**: não
- **Reposição no sistema novo**: substituído, se e quando o classificador for portado, por envio minimizado — somente os campos necessários à classificação. A exceção é **condicional e fora do núcleo**, e o `paradigm_decision.md` § *Notas* item 6 pede que fique registrada como exceção **para não virar precedente**.
- **Risco de descartar**: **baixo** — Risco de descartar: nenhum para o núcleo. Risco de **não** descartar, se alguém portar o plugin literalmente: transferência internacional de dado pessoal de terceiro sem base legal.
- **Âncora no legado**: `wp-content/plugins/akismet/class.akismet.php:492`

### BR-DESCARTAR-003
- **Origem**: [`use-cases/UC-46-executar-ability.md`](../use-cases/UC-46-executar-ability.md) · [`questions.md`](../questions.md) Pergunta 13
- **Descrição**: **As duas *abilities* do Akismet** — `akismet/comment-check` e `akismet/get-stats` —, com os respectivos `permission_callback`.
- **Justificativa**: Fora do escopo declarado, pela mesma Pergunta 13. São registradas por extensão empacotada, não pelo núcleo.
- **Vinculado a paradigma**: não
- **Reposição no sistema novo**: substituído pelas **3 *abilities* do núcleo** (`core/get-site-info`, `core/get-user-info`, `core/get-environment-info`), que migram (PERM-11). O mecanismo de registro e a camada de autorização migram inteiros (I4, I5, I6).
- **Risco de descartar**: **baixo** — Nenhuma regra do núcleo as referencia. Registrado porque a correção que **descobriu** as cinco *abilities* é recente — `permissions.md` §8.1 e a lacuna P7 ainda afirmam que nenhuma está registrada.
- **Âncora no legado**: `wp-content/plugins/akismet/abilities/class-akismet-ability-comment-check.php:16` · `wp-content/plugins/akismet/abilities/class-akismet-ability-get-stats.php:16`

### BR-DESCARTAR-004
- **Origem**: [`questions.md`](../questions.md) Pergunta 18 · unit [`ai-client`](../ai-client/design.md) · [`refactor/architectures.md`](../refactor/architectures.md) §6
- **Descrição**: **O tempo limite herdado do cliente HTTP no caminho de geração de IA.** O adaptador PSR-18 do núcleo roteia por `wp_remote_request` sem definir *timeout*, logo valeria o default de 5 s — curto demais para geração de texto.
- **Justificativa**: Exceção ao idêntico **autorizada por escrito e incondicional**: a Pergunta 18 manda *"definir o tempo limite no adaptador PSR-18 em vez de herdar o default de 5 s de `wp_remote_request`"*, porque *"isso é defeito conhecido do legado, não regra a reproduzir"*. `refactor/architectures.md` §6 chama este de *"o único ponto em que a resposta humana manda corrigir"* e pede que seja registrado **como exceção, para não virar precedente**.
- **Vinculado a paradigma**: não
- **Reposição no sistema novo**: substituído por tempo limite **declarado no adaptador**, dimensionado para geração de texto.
- **Risco de descartar**: **médio** — ⚠️ **Correção de premissa que muda o tamanho do conserto, não a decisão.** O `questions.options.json` apurou no código que o tempo limite do cliente de IA é de **30 s por padrão**, definido pelo construtor de prompt (`class-wp-ai-client-prompt-builder.php:193`), e **não** os 5 s do cliente HTTP — os 5 s só valem para quem chamar o adaptador **sem** opções de requisição. Logo o descarte é mais estreito do que a pergunta supôs: o que se descarta é o caminho sem opções, não o caminho normal. Conferir qual dos dois o porte exercita antes de dimensionar o conserto.
- **Âncora no legado**: `wp-includes/ai-client/class-wp-ai-client-prompt-builder.php:193`

### BR-DESCARTAR-005
- **Origem**: [`domain.md`](../domain.md) §3 e §4 · [`permissions.md`](../permissions.md) §10 pegadinha 4 · [`questions.md`](../questions.md) Pergunta 2
- **Descrição**: **`RESET_CAPS`** — a constante que, numa atualização, **repõe papéis e capacidades de todos os usuários** a partir do antigo `user_level`. Marcada `// FIXME: RESET_CAPS is temporary code…` — temporária desde 2005.
- **Justificativa**: Fora do escopo por restrição técnica do alvo: a Pergunta 2 declara que *"o porte parte de instalação nova, sem dado a migrar"*, e `user_level` só existe em instalação anterior à versão 2.0. O caso de uso que a constante serve **não pode ocorrer** no alvo.
- **Vinculado a paradigma**: não
- **Reposição no sistema novo**: none. A mutabilidade do papel migra (PERM-13, ADR-0001) e os três gatilhos de `populate_roles()` migram (N7) — o que sai é só o caminho de reposição a partir do nível numérico.
- **Risco de descartar**: **baixo** — Baixo **enquanto** a premissa da Pergunta 2 valer. Se o alvo algum dia tiver de aceitar um banco legado com `user_level`, este item volta junto com os 38 portões históricos.
- **Âncora no legado**: `wp-admin/includes/upgrade.php:1203`

### BR-DESCARTAR-006
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §8.2 · [`questions.md`](../questions.md) Pergunta 2
- **Descrição**: **Os 38 portões históricos de `upgrade_all()`**, cobrindo `db_version` de **2541 a 61644** — da versão 1.0 à 7.0. Inclui `upgrade_230()`, a maior do histórico, que migra `categories`/`post2cat`/`link2cat` para `terms`/`term_taxonomy`/`term_relationships`, e `upgrade_230_old_tables()`, que descarta as tabelas antigas.
- **Justificativa**: Fora do escopo por restrição técnica do alvo (Pergunta 2: instalação nova, sem dado a migrar). As tabelas que `upgrade_230()` transforma **não existem** neste schema de 18 tabelas, e nenhuma instalação do alvo nasce com `db_version` menor que o corrente.
- **Vinculado a paradigma**: não
- **Reposição no sistema novo**: substituído pelo **mecanismo** de evolução, que migra inteiro (DB-MIG): comparação de estrutura, a opção `db_version` como único marcador de posição, ausência de rollback, e um portão novo por versão futura. O que sai é o **histórico**, não a arquitetura.
- **Risco de descartar**: **médio** — ⚠️ Dois efeitos a declarar. (1) `maybe_disable_link_manager()` roda em **toda** atualização e desliga a interface do gerenciador de links quando a tabela `links` está vazia — é decisão de produto tomada a partir do estado do banco, e **não** é portão histórico: migra. (2) `database/business-rules.md` §8.3 registra que a faixa 61645–61833 **não tem rotina de dados** e a hipótese de que seja só estrutural **não foi confirmada** — item referido à codificação no `ambiguity_log.md`.
- **Âncora no legado**: `wp-admin/includes/upgrade.php:736` · `wp-admin/includes/upgrade.php:893`

### BR-DESCARTAR-007
- **Origem**: unit [`importacao-e-exportacao`](../importacao-e-exportacao/design.md) §*Riscos e Lacunas* · [`gaps.md`](../gaps.md) §2.4, causa **limite conhecido do legado**
- **Descrição**: **O laço infinito da exportação em hierarquia com ciclo.** A fila de hierarquia de termos não detecta ciclo: com um ciclo de pais, `while ( $cat = array_shift( $categories ) )` gira indefinidamente — e os cabeçalhos de download **já foram enviados**, de modo que o resultado é um arquivo truncado **sem mensagem de erro**.
- **Justificativa**: `gaps.md` classifica esta lacuna na causa *"limite conhecido do legado"*, cuja definição é literal: *"não é lacuna: é defeito já entendido, a **não** reproduzir"*. Passa o mesmo teste que autorizou as exceções de P18 e P13 — *é defeito conhecido do legado, não regra do produto*.
- **Vinculado a paradigma**: não
- **Reposição no sistema novo**: substituído por detecção de ciclo na fila de hierarquia, com erro reportado **antes** de os cabeçalhos de download serem emitidos.
- **Risco de descartar**: **baixo** — Risco de descartar: baixo — nenhum consumidor depende de um arquivo truncado. **Registrado como exceção para não virar precedente**, pela mesma razão que o `paradigm_decision.md` pede em P18: a lista de defeitos a não reproduzir é fechada e tem 3 itens (P18, P13 e este).
- **Âncora no legado**: `wp-admin/includes/export.php:217` · `wp-admin/includes/export.php:245`

### BR-DESCARTAR-008
- **Origem**: [`paradigm_decision.md`](paradigm_decision.md) § *Gap identificado*, implicação 2 · [`refactor/architectures.md`](../refactor/architectures.md) §2 · [`architecture.md`](../architecture.md) §1 e §2.2
- **Descrição**: **O estado global como mecanismo de escopo de requisição**: 1.121 declarações `global $`, 3.410 usos de superglobal em 216 arquivos, e nenhuma injeção de dependência nem container — as dependências são globais (`$wpdb`, `$wp_query`, `$wp_filter`, `$current_user`) e o escopo vem de o processo ser montado por `wp-settings.php` e **descartado no fim da resposta**.
- **Justificativa**: Mecanismo do paradigma legado (procedural com estado global), e o paradigma mudou na dimensão que importa: o alvo é uma runtime **assíncrona e longo-viva**. A `pending_decisions.md` Decisão 1 escolheu a **Opção 3**, cuja fronteira é *comportamento observável conservador, estrutura interna idiomática* — e estado global é estrutura interna.
- **Vinculado a paradigma**: **sim**
  - Legado: procedural síncrono com estado global, escopado pela morte do processo. Alvo: contexto por requisição **explícito**.
  - **Como o paradigma alvo absorve o caso**: contexto por requisição explícito — `AsyncLocalStorage` ou parâmetro — resolvido **antes** de qualquer módulo de domínio
- **Reposição no sistema novo**: substituído por contexto por requisição explícito. **A regra não é descartada**: EXT-CONTEXTO migra a invariante de que identidade, consulta, conexão e requisição corrente são escopo de requisição. O que sai é o mecanismo.
- **Risco de descartar**: **alto** — ⚠️ **O risco mais alto deste catálogo, e ele é de ordem.** Se o mecanismo sair antes de o substituto entrar, duas requisições concorrentes trocam de identidade entre si — e `current_user_can` aparece 1.279 vezes em 224 arquivos, com três camadas paralelas de autorização, uma delas falhando **aberta**. **Nenhum dos 985 testes apanha isso**: todos descrevem uma requisição por vez. O `paradigm_decision.md` endereça ao Designer: *"é pré-requisito, não refinamento"*.
- **Âncora no legado**: `wp-settings.php:66` · `wp-includes/capabilities.php:913` · `wp-includes/query.php:28`

### BR-DESCARTAR-009
- **Origem**: [`paradigm_decision.md`](paradigm_decision.md) § *Gap identificado*, implicação 7 · [`refactor/architectures.md`](../refactor/architectures.md) §4 · [`domain.md`](../domain.md) §1.6
- **Descrição**: **A substituição por ausência de código**: redefinir uma função do núcleo antes de ele a declarar (38 funções em `pluggable.php`), as 176 guardas `function_exists` em 67 arquivos que a viabilizam, e os 4 *drop-ins* que trocam um componente inteiro **pela simples presença de um arquivo**.
- **Justificativa**: Mecanismo do paradigma legado (despacho por tabela global de funções) absorvido por construção no alvo: `refactor/architectures.md` §4 já apurou que *"TypeScript não permite redefinir função importada, então o que hoje é ausência de código vira registro explícito"*. A linguagem do alvo torna o mecanismo **inexprimível**, não indesejável.
- **Vinculado a paradigma**: **sim**
  - Legado: despacho por tabela global de funções, com a ausência de código como ponto de extensão. Alvo: registro explícito resolvido antes do primeiro uso.
  - **Como o paradigma alvo absorve o caso**: registro explícito (container de injeção de dependência), verificável em tempo de *build*
- **Reposição no sistema novo**: substituído por registro explícito. **A capacidade não é descartada**: EXT-SUBST migra os 42 pontos (38 + 4) como **requisito funcional**, com critério declarado de o que conta como substituível. P3: o ponto de extensão **é** o produto.
- **Risco de descartar**: **alto** — ⚠️ Alto porque o mecanismo sai **todo de uma vez** (a linguagem não o admite) enquanto o substituto tem de cobrir 42 pontos um por um. Cobertura parcial produz um núcleo que parece extensível e não é — e `architecture.md` §2.2 registra que o legado **não tem** container, logo isto é desenho novo tocando 216 arquivos.
- **Âncora no legado**: `wp-includes/pluggable.php:146` · `wp-includes/load.php:825` · `wp-settings.php:98`

### BR-DESCARTAR-010
- **Origem**: [`paradigm_decision.md`](paradigm_decision.md) § *Gap identificado*, implicação 5 · [`architecture/architecture-graph.md`](../architecture/architecture-graph.md) · [`refactor/architectures.md`](../refactor/architectures.md) §2 e §2.1
- **Descrição**: **A tolerância a dependência circular por carregamento em `require`**: 1.342 `require`/`include` em 282 arquivos, com 176 guardas `function_exists`, sustentando **68 dos 71 módulos num único componente fortemente conexo (95,8%)** e **254 ciclos de dois módulos**.
- **Justificativa**: Mecanismo do paradigma legado absorvido por construção — e aqui o alvo não apenas absorve, ele **recusa**: num sistema de módulos real, importação circular lida na avaliação do módulo é **erro de inicialização**, não aviso. O ciclo deixa de ser dívida de estilo e passa a ser bloqueio de execução (`architecture.md` §9 risco 2: *"nenhum pedaço compila sozinho"*).
- **Vinculado a paradigma**: **sim**
  - Legado: ordem de carregamento em `require` com guardas, que tolera ciclo. Alvo: módulos ESM, que não toleram.
  - **Como o paradigma alvo absorve o caso**: núcleo compartilhado declarado de **12 módulos** (acoplamento par-a-par cai de 35,0% para 8,4%, com 175 arestas núcleo→domínio como dívida explícita) e injeção tardia onde o ciclo persistir
- **Reposição no sistema novo**: substituído pelo núcleo compartilhado de 12 módulos medido em `refactor/architectures.md` §2.1 — ganho de **efeito observável zero**, que é exatamente o que a Opção 3 autoriza. **O contrato de ordem de arranque não é descartado**: EXT-ORDEM migra.
- **Risco de descartar**: **alto** — ⚠️ O preço está declarado na fonte: admitir que `posts-e-tipos-de-conteudo` e `telas-do-painel` são **núcleo, não domínio** (um núcleo puro de infraestrutura, com 6 módulos, deixa 44,5% do peso par-a-par e não resolve nada). E o `paradigm_decision.md` endereça ao Strategist: **não existe ordem de migração dentro do ciclo** — a sequência viável é as 2 raízes (`hooks-e-plugin-api`, `html-api`), o ciclo inteiro como unidade e as 3 pontas de consumo.
- **Âncora no legado**: `wp-settings.php:52` · `wp-includes/plugin.php:174`

---

## Itens descartados por mudança de paradigma (subseção dedicada)

> Lista apenas dos itens cujo `Vinculado a paradigma = sim`. Auditoria explícita para o agente de
> codificação: cada linha diz o que sai, o que entra no lugar e **onde a regra correspondente migra**.

| ID | Origem | Paradigma legado | Substituto no paradigma alvo | Regra que migra no lugar |
|---|---|---|---|---|
| [BR-DESCARTAR-008](#br-descartar-008) | [`paradigm_decision.md`](paradigm_decision.md) § *Gap identificado*, implicação 2 | estado global escopado pela morte do processo (um processo PHP por requisição) | contexto por requisição explícito — `AsyncLocalStorage` ou parâmetro — resolvido **antes** de qualquer módulo de domínio | `EXT-CONTEXTO` — identidade, consulta e conexão são escopo de requisição |
| [BR-DESCARTAR-009](#br-descartar-009) | [`paradigm_decision.md`](paradigm_decision.md) § *Gap identificado*, implicação 7 | redefinição de função global + guarda `function_exists` + *drop-in* por presença de arquivo | registro explícito (container de injeção de dependência), verificável em tempo de *build* | `EXT-SUBST` — os 42 pontos de substituição como requisito funcional |
| [BR-DESCARTAR-010](#br-descartar-010) | [`paradigm_decision.md`](paradigm_decision.md) § *Gap identificado*, implicação 5 | ciclo tolerado por `require`/`include` + guarda `function_exists` | núcleo compartilhado declarado de **12 módulos** (acoplamento par-a-par cai de 35,0% para 8,4%, com 175 arestas núcleo→domínio como dívida explícita) e injeção tardia onde o ciclo persistir | `EXT-ORDEM` — a ordem de arranque como contrato público |

---

## Notas

1. **O conjunto descartado é pequeno, e isso é consequência de decisão humana, não de preguiça de
   curadoria.** As 23 respostas do [`questions.md`](../questions.md) mandam preservar comportamento
   item por item — inclusive quatro pontos em que o legado faz o **contrário** do que o backlog pedia
   (P6, P7, P8, P9) e três defeitos de segurança conhecidos (P11, P12, e o que ninguém perguntou,
   em `BR-HUMANA-008`). A Decisão 1 escolheu a **Opção 3**, cuja fronteira é *comportamento
   observável conservador*. Com essa fronteira, só sobra descartar o que está **fora de escopo**, o
   que **não pode ocorrer** no alvo, o que já foi **autorizado como exceção**, e **mecanismo** que a
   linguagem alvo não admite.

2. **Dois descartes dependem de uma premissa que pode mudar, e ela está nomeada.**
   `BR-DESCARTAR-005` (`RESET_CAPS`) e `BR-DESCARTAR-006` (os 38 portões históricos de `db_version`)
   valem **enquanto** a Pergunta 2 valer — *"o porte parte de instalação nova, sem dado a migrar"*.
   Se algum dia o alvo tiver de aceitar um banco legado, os dois voltam juntos, porque o caminho de
   `RESET_CAPS` parte do `user_level` que só os portões antigos conhecem.

3. **O que NÃO foi descartado, e por quê — porque a ausência também precisa de registro.** Quatro
   candidatos óbvios ficaram em MIGRAR por evidência direta:

   - **A dupla serialização de `maybe_serialize()`** parece hack de compatibilidade descartável, e
     **é observável**: gravar uma string que *pareça* serializada e lê-la de volta devolve a string,
     não o array. Um alvo que não reproduza isso muda o valor devolvido ao chamador. Migra em
     `DB-SER`.
   - **O rebaixamento para HTTP nos 13 canais** é achado de segurança em dois pontos independentes,
     e a Pergunta 12 manda preservá-lo como dívida herdada. Migra em `ESC-HTTP`.
   - **O pacote instalado sem assinatura verificada** é o achado nº 1 da análise, e a Pergunta 11
     manda preservar **inclusive o modo de falha**. Migra em `A8`.
   - **As duas funções de encerramento de sessão sem nenhum chamador** migram por precedente
     explícito da Pergunta 7: *"existir sem ser chamada é parte do que se clona"*. Migram em
     `ESC-SESSAO` — e é esse mesmo precedente que abre a ambiguidade de `BR-HUMANA-006`.

4. **Nenhum item descartado por mudança de paradigma deixa de apontar como o alvo absorve o caso**,
   como a regra absoluta do SKILL exige: a tabela da subseção dedicada tem as cinco colunas
   preenchidas nas 3 linhas.
