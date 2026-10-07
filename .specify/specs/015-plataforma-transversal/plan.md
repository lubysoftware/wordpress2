# Plano — Plataforma transversal

> Como ler este plano: a spec diz **o quê** e **por quê**; este arquivo diz **como**, e
> é o único dos três que fala de tecnologia. Nenhum requisito novo nasce aqui: o que não
> estiver na [spec](spec.md) não é requisito, é invenção.

## Stack

**O que já é decisão humana registrada**

| decisão | valor | onde foi registrada |
|---|---|---|
| Arquitetura | `hexagonal` (Portas e adaptadores) | `refactor/decision.json`, decidida em 2026-10-07 por humano (Studio) |
| Objetivo do porte | comportamento observável idêntico, partindo de instalação nova, sem dado a migrar | respostas 1 a 5 de [`questions.md`](../../../questions.md) |
| Linguagem alvo | TypeScript | a resposta 15 de [`questions.md`](../../../questions.md) a nomeia ao decidir de onde vem o lado cliente |

**O que NÃO é decisão de ninguém: os slots abaixo.** Eles vêm de
[`refactor/tech-stack.json`](../../../refactor/tech-stack.md), que é **pesquisa**: um
leque de candidatos por slot, com um `recommended` e a razão dele. Não existe, no Studio,
clique que decida stack, e quem define a tecnologia é quem vai construir, ao abrir os
agentes. Abaixo, recomendação é recomendação; nada aqui está escolhido.

Os slots listados são os que esta feature usa. O leque completo, com os 17 slots, os
riscos de cada candidato e a lista de verificação que a pesquisa deixou aberta, está em
[`refactor/tech-stack.md`](../../../refactor/tech-stack.md).


### Runtime de execução (`runtime`)

A linguagem já está decidida e esta etapa não a reabre: as respostas do `questions.md` cravam porte para TypeScript. O runtime não está decidido, e é ele que decide se o porte é possível, porque `wp-settings.php:597` carrega extensão com `include_once $plugin` — o produto executa código-fonte de terceiro instalado em tempo de execução pelo próprio painel (UC-33), e a Pergunta 3 diz que o ponto de extensão É o produto, não acidente de implementação.

| candidato | o que é | situação |
|---|---|---|
| `nodejs` | Node.js | **recomendado pela pesquisa** |
| `deno` | Deno | candidato |
| `bun` | Bun | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É o único runtime que esta árvore já declara em manifesto e o que tem contraparte mais profunda para as extensões PHP que o porte precisa substituir no caminho de requisição — e o problema que ele não resolve, executar extensão de terceiro sem etapa de build, é mecanismo novo em qualquer um dos três.

### Isolamento de estado por requisição (`isolamento-de-requisicao`)

O legado não tem isolamento: tem descarte. `architecture.md` registra que nenhuma fronteira de processo existe em todo o nível 2 do C4 — um processo PHP por requisição, montado por `wp-settings.php` e descartado no fim da resposta. É esse descarte que torna seguras as 1.121 declarações `global $x` em 230 arquivos, os 3.411 usos de superglobal e as 94 chamadas `exit`/`die`. Em processo longevo nada disso é seguro, e o vazamento de estado entre requisições não aparece em teste de unidade: aparece como uma pessoa vendo o painel de outra. É o slot em que este porte quebra, e não há candidato óbvio.

| candidato | o que é | situação |
|---|---|---|
| `processo-por-requisicao` | Processo por requisição (modelo CGI) | **recomendado pela pesquisa** |
| `contexto-assincrono` | Contexto por requisição em processo longevo (AsyncLocalStorage) | candidato |
| `worker-por-requisicao` | Worker isolado por requisição | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É o único candidato em que a equivalência observável é por construção e não por disciplina — e com 1.121 pontos de estado global, zero arquivo de teste no legado e 'idêntico' como critério de aceite, a escolha de desempenho pode ser revista depois com número medido; a de correção, não.

### Persistência e acesso a dados (`persistencia`)

É a segunda porta do plano de migração escolhido e a maior: `camada-de-dados-wpdb`, com 1.128 chamadas `$wpdb->` em 98 dos 1.467 arquivos PHP (6,7% da árvore) e 1.076 de peso de entrada no grafo medido. REQ-164 (`must`) exige que a camada de dados seja a única porta para o banco e que nenhuma consulta seja montada por concatenação. E o que esta porta tem de reproduzir é anômalo: 18 tabelas, 59 índices, ZERO chave estrangeira e ZERO transação — a medição desta etapa confirma nenhuma ocorrência de `START TRANSACTION` nem de `COMMIT;` em 1.467 arquivos.

| candidato | o que é | situação |
|---|---|---|
| `mysql2` | Driver MySQL em protocolo nativo | **recomendado pela pesquisa** |
| `kysely` | Construtor de consulta tipado | candidato |
| `drizzle` | ORM com esquema declarado | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A porta que o plano de migração pede é uma interface, não uma biblioteca — e com o critério de idêntico a consulta precisa poder ser a MESMA string que o legado envia, inclusive o `LIKE` com curinga nos dois lados sobre texto serializado que é como se descobre quem é administrador.

### Tradução e catálogo gettext (`traducao`)

É a aresta mais pesada da árvore: `l10n-e-traducoes` recebe 13.335 pontos de entrada de 68 dos 71 módulos (`architecture-graph.json`), e a contagem direta desta etapa dá 13.705 chamadas de função de tradução em 1.467 arquivos. A biblioteca é própria (`wp-includes/pomo/`, 6 arquivos, gettext em PHP) e `technologies.json` registra que ela está em DOIS lugares, `pomo/` e `l10n/`, com as duas gerações ativas. REQ-166 (`should`) pede catálogo externo e forma plural declarada; REQ-161 (`must`, GG, `bloqueado`) pede o oposto do que o código faz: nenhum módulo de domínio chamando tradução.

| candidato | o que é | situação |
|---|---|---|
| `leitor-proprio` | Leitor de .mo e .po próprio, com avaliador de plural restrito | **recomendado pela pesquisa** |
| `leitor-de-terceiro` | Biblioteca de leitura de catálogo gettext | candidato |
| `icu-messageformat` | Formato de mensagem ICU | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A metade que importa neste slot não é ler o arquivo, é avaliar a expressão de plural — e nenhuma biblioteca a entrega junto, enquanto o formato `.mo` é compatibilidade obrigatória com o catálogo do ecossistema que este produto clona.

### Análise e sanitização de HTML (`analise-de-html`)

`html-api` é uma das DUAS raízes do grafo de dependência de todo o sistema (`architecture-graph.json`), e `kses-e-sanitizacao` está no núcleo crítico, com 11 ou mais dependentes diretos. São 16.590 linhas em 14 arquivos de `wp-includes/html-api/` mais 3.159 de `wp-includes/kses.php`, e as duas fazem trabalhos diferentes que um projeto novo confundiria: a primeira é um tokenizador que persegue a especificação do HTML5 e EDITA a string no lugar; a segunda é a lista de permissão que decide o que cada papel pode publicar — `permissions.md` registra que `editor` tem `unfiltered_html`.

| candidato | o que é | situação |
|---|---|---|
| `porte-a-mao` | Porte à mão das duas, com a tabela de referências de caracteres | **recomendado pela pesquisa** |
| `tokenizador-de-terceiro` | Tokenizador de terceiro conforme a especificação | candidato |
| `sanitizador-de-terceiro` | Sanitizador de terceiro por lista de permissão | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A metade que parece substituível, o tokenizador, é um editor de string que nenhum analisador de árvore reproduz sem reescrever o `post_content`; e a outra metade, KSES, é fronteira de autorização, não higiene de HTML.

### Observabilidade (`observabilidade`)

REQ-159 é `must` e está `pronto`: todo erro tratado e toda falha de integração produzem registro com instante, origem, severidade e contexto, estruturado e consultável, sem depender de modo de depuração, com verificação automatizada que falha ao encontrar tratamento de erro silencioso. A linha de base é 0 arquivos de log na árvore, 49 chamadas `error_log` e um único histórico persistente de falha: a opção `auto_core_update_failed`. E é pré-requisito da arquitetura escolhida pelo mesmo motivo do slot anterior — adaptador troca modo de falha, e sem registro a troca é invisível.

| candidato | o que é | situação |
|---|---|---|
| `registro-estruturado` | Registro estruturado em linha JSON | **recomendado pela pesquisa** |
| `escritor-proprio` | Escritor próprio sobre a saída de erro do runtime | candidato |
| `opentelemetry` | OpenTelemetry | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** REQ-159 AC2 e AC3 juntos pedem registro estruturado COM redação de campo sensível, e redação embutida é a diferença entre cumprir o critério e abrir o vazamento que `integrations.json` já documenta em outro canal.

### Testes e paridade com o legado (`testes`)

É pré-requisito DECLARADO da arquitetura escolhida, não melhoria: 'teste de caracterização das 5 bordas contra a instalação de referência', porque adaptador troca modo de falha e não há um único arquivo de log nesta árvore para comparar depois. A linha de base é zero: 0 arquivos de teste em 3.381, e os 985 testes de `backlog/tests.md` são especificação e não evidência (Pergunta 16). REQ-163 (`must`, GG, `pronto`) é o card que fecha isso, e a Pergunta 16 autoriza o oráculo: levantar o legado na MESMA versão e comparar caso a caso.

| candidato | o que é | situação |
|---|---|---|
| `vitest` | Executor com captura de saída de referência | **recomendado pela pesquisa** |
| `executor-do-runtime` | Executor de teste do próprio runtime | candidato |
| `jest` | Executor consolidado com ecossistema de relatório | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** O trabalho deste slot é comparar saída contra uma instalação de referência caso a caso, e captura de saída de referência de primeira classe com execução paralela é o que faz 985 testes mais caracterização caberem num portão de integração (REQ-163 AC5).

### Entrega, empacotamento e autoatualização (`entrega`)

`deployment.md` §1 registra o achado: não existe Dockerfile, docker-compose nem configuração de nuvem nesta árvore, e a AUSÊNCIA é o achado, porque o pipeline de implantação deste produto É o painel administrativo — UC-33 instala extensão e UC-34 atualiza o núcleo, descompactando pacote e escrevendo no disco por `WP_Filesystem`, com `downloads.wordpress.org` como integração de criticidade alta. Num porte para TypeScript isso vira uma pergunta que o legado nunca teve de responder: o que é entregue, fonte ou compilado? É a decisão que amarra os slots `runtime` e `isolamento-de-requisicao`.

| candidato | o que é | situação |
|---|---|---|
| `javascript-compilado` | Compilado para JavaScript, um arquivo por módulo | **recomendado pela pesquisa** |
| `fonte-typescript` | Fonte TypeScript executado pelo runtime | candidato |
| `pacote-unico` | Pacote único por empacotador | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É a única forma de entrega que não aposta a distribuição do produto num recurso de runtime ainda em movimento, e o que ela custa — mapa de origem no produto e extensão de terceiro possivelmente pré-compilada — é divergência nomeável, não risco de execução.

## Modelo de dados

Esta é a feature com mais slots do pacote, porque é a que decide como as outras catorze
são construídas.

| estrutura do legado | o que guarda | o que muda no modelo novo |
|---|---|---|
| registro de operação | **não existe**: zero arquivo de log na árvore, 49 chamadas de registro de erro em 12 arquivos, e o único histórico persistente de falha é a opção de falha de atualização automática | REQ-159 o cria. É acréscimo permitido por P7 enquanto nenhuma decisão do sistema passar a depender dele |
| catálogo de tradução | arquivos de catálogo lidos como dado, com forma plural própria | continua sendo dado. A medição mostra que a tradução é chamada de **68 dos 71 módulos**, com 13.335 pontos de entrada: é a aresta mais pesada da árvore |
| camada de dados | acesso por SQL direto montado à mão, com 1.128 chamadas em 98 arquivos, 18 tabelas, 59 índices, zero chave estrangeira e zero transação | REQ-164 exige que ela seja a única porta e que nenhuma consulta seja montada por concatenação. A ausência de transação é comportamento, não defeito |
| sanitização de marcação | lista de permissão de elementos e atributos, aplicada na escrita, e revogável por privilégio | a lista é parte do produto: mudar o que ela permite muda o que é possível publicar |
| validação de instalação | o instalador recusa entrada que ele mesmo declara inválida, e em alguns pontos não recusa | REQ-168 fecha a diferença |

Nenhum slot de limite de taxa existe neste plano, e isso é decisão registrada: a resposta
19 põe o limite fora do núcleo, como escolha de implantação, para não inventar número que
o produto nunca teve.

## Contratos

| operação | entrada | saída | erros |
|---|---|---|---|
| registrar evento de operação | instante, origem, severidade, contexto | evento gravado em canal estruturado e consultável | nenhum: falha de registro **não** pode alterar o fluxo (P7) |
| consultar o registro | período, severidade, origem | eventos | nenhum |
| traduzir | identificador da mensagem, contagem para plural, domínio | mensagem traduzida, ou a original quando não há catálogo | nenhum: ausência de tradução devolve o original |
| consultar dados | consulta declarada e parâmetros | resultado | consulta montada por concatenação, que é recusada pela própria camada |
| sanitizar marcação | corpo e contexto de permissão | corpo sanitizado | nenhum: sanitizar é sempre possível, e o privilégio declarado o dispensa |
| analisar marcação | corpo | árvore, **ou erro de análise reportado** | erro de análise, que no legado é reconhecido e não tem como ser reportado |
| validar entrada de instalação | campos do instalador | instalação aceita | campo que o próprio instalador declara inválido |

A suíte de paridade (REQ-163) não é operação: é condição. Ela exige que cada regra de
negócio catalogada tenha teste, que a cascata de moderação tenha teste por etapa **e pela
ordem**, que a resolução de permissão sobre objeto tenha teste por combinação de autoria e
estado, e que nenhuma alteração entre com teste vermelho.

## Migração de dados

**Nada vem do sistema velho** (resposta 2).

Duas observações de insumo, não de dado: os catálogos de tradução não estão na árvore
analisada (lacuna L5 de `soul.md`), e a instalação executável do legado que serve de
oráculo de paridade precisa ser levantada, o que é a tarefa T001 de
[`tasks.md`](tasks.md) e a resposta 16 de `questions.md`. Sem esse oráculo, os 816 testes
que os cards desta seleção carregam continuam sendo especificação em vez de evidência.

## Sequência

Depende de 001 (autorização, porque a camada de dados e o registro precisam saber quem
age). É dependência de 006, 011, 013 e 014, e na prática de todas: a tradução, a
sanitização, o registro e a camada de dados atravessam as quinze features.

Ordem interna: o oráculo (T001) e o esqueleto (T002) antes de tudo; a camada de dados
(REQ-164) antes do registro de operação (REQ-159), porque o registro é consultável e
precisa de porta; a suíte de paridade (REQ-163) acompanha todas as outras features e não
termina nesta; tradução (REQ-166), relato de erro de análise (REQ-167) e validação de
instalação (REQ-168) depois.

## Riscos

1. **A tradução é chamada de 68 dos 71 módulos.** Num porte, isso é o sinal medido de que
   não existe separação entre domínio e apresentação, e o card que faria a separação
   (REQ-161) ficou `bloqueado`. Começar sem decidir isso espalha a tradução pelo domínio
   novo também.
2. **Não existe rede de segurança executável** (zero arquivo de teste em 3.381). Até a
   suíte de paridade existir, nenhuma afirmação de equivalência é verificável.
3. **O oráculo depende de levantar o legado.** Sem ele, a paridade é afirmada e não
   verificada, e é exatamente o que a resposta 16 recusa.
4. **Zero transação no legado.** Uma camada de dados que abra transação por operação
   muda o que acontece quando uma escrita falha no meio, e isso é observável.
5. **Quatro dos cinco módulos mais dependidos não têm história própria** em nenhuma
   feature (arranque, formatação e escape, núcleo utilitário e telas do painel). A
   resposta 21 autorizou gerar spec para eles, e este pacote não os tem.
