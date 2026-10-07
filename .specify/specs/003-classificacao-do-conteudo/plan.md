# Plano — Classificação do conteúdo

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


### Persistência e acesso a dados (`persistencia`)

É a segunda porta do plano de migração escolhido e a maior: `camada-de-dados-wpdb`, com 1.128 chamadas `$wpdb->` em 98 dos 1.467 arquivos PHP (6,7% da árvore) e 1.076 de peso de entrada no grafo medido. REQ-164 (`must`) exige que a camada de dados seja a única porta para o banco e que nenhuma consulta seja montada por concatenação. E o que esta porta tem de reproduzir é anômalo: 18 tabelas, 59 índices, ZERO chave estrangeira e ZERO transação — a medição desta etapa confirma nenhuma ocorrência de `START TRANSACTION` nem de `COMMIT;` em 1.467 arquivos.

| candidato | o que é | situação |
|---|---|---|
| `mysql2` | Driver MySQL em protocolo nativo | **recomendado pela pesquisa** |
| `kysely` | Construtor de consulta tipado | candidato |
| `drizzle` | ORM com esquema declarado | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A porta que o plano de migração pede é uma interface, não uma biblioteca — e com o critério de idêntico a consulta precisa poder ser a MESMA string que o legado envia, inclusive o `LIKE` com curinga nos dois lados sobre texto serializado que é como se descobre quem é administrador.

### Serialização do valor persistido (`serializacao-de-valor-persistido`)

Não é slot de infraestrutura, é slot de formato de dado, e é obrigatório porque o formato está DENTRO das colunas: `options.option_value`, `postmeta.meta_value`, `usermeta.meta_value` e `signups.meta` guardam valor serializado pelo formato nativo do PHP quando não é escalar (`erd-complete.md`, linhas 127, 276, 281 e 352), com 21 `maybe_serialize`, 17 `maybe_unserialize` e 9 `is_serialized` na árvore. `erd-complete.md` diz a consequência em uma linha: 'uma migração que normalize permissões precisa parsear PHP serializado, não SQL'. Em TypeScript esse formato não existe, e a Pergunta 2 fixa que a cascata observável não pode mudar.

| candidato | o que é | situação |
|---|---|---|
| `implementacao-propria` | Implementação própria do formato, com suíte de conformidade | **recomendado pela pesquisa** |
| `biblioteca-de-terceiro` | Biblioteca de serialização PHP para JavaScript | candidato |
| `json-no-lugar` | Trocar o formato por JSON no armazenamento | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** O formato é pequeno e fechado, a conformidade tem de ser provada byte a byte contra o oráculo da Pergunta 16 de qualquer forma, e nenhuma biblioteca escolhida sem acesso à rede dispensa essa prova.

### Cache de objeto (`cache`)

Quarta porta do plano escolhido: `object-cache`, com 27 dependentes diretos. E é um dos quatro pontos que REQ-170 (`wont`) tira do mecanismo de arquivo solto e transforma em contrato nomeado — ou seja, o `wont` do backlog e a porta da arquitetura escolhida pedem aqui a MESMA coisa. O que o slot decide: `WP_Object_Cache` por padrão não persiste nada entre requisições, e REQ-165 (`must`, `bloqueado`) registra que ninguém decidiu se o sistema novo nasce persistente.

| candidato | o que é | situação |
|---|---|---|
| `em-processo` | Cache por requisição, em memória do processo | **recomendado pela pesquisa** |
| `redis` | Backend persistente compatível com Redis | candidato |
| `memcached` | Memcached | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A Pergunta 1 já respondeu o que REQ-165 pergunta: num clone do CMS o default de fábrica é a especificação, e o default de fábrica é não persistir nada entre requisições.

## Modelo de dados

Três estruturas, e a única junção N:M real do armazenamento do legado.

| estrutura do legado | o que guarda | o que muda no modelo novo |
|---|---|---|
| `terms` | o rótulo: nome, identificador na URL (sem restrição de unicidade: a colisão é resolvida em código) e agrupamento de sinônimos | pode ser fundido com a tabela de contexto. A fusão é segura por causa da restrição de unicidade que liga rótulo e contexto, e simplifica a hierarquia |
| `term_taxonomy` | o rótulo **dentro de um contexto**: o nome do contexto, a descrição, o pai e a contagem de uso | a hierarquia do legado atravessa a tabela errada: o pai referencia o rótulo, não o rótulo no contexto, o que obriga a voltar de um para o outro a cada nível da árvore. Corrigir isso é interno e invisível, e é a parte que mais simplifica |
| `term_relationships` | a junção que classifica, com chave primária composta de objeto e rótulo no contexto, mais uma ordem usada só por menu | o objeto é **polimórfico sem discriminador**: recebe conteúdo ou link, e nada na linha diz qual. O modelo novo precisa de discriminador; mantê-lo como está reproduz a ambiguidade |
| `termmeta` | metadado do rótulo, não da atribuição | sem mudança |

A contagem de uso tem **duas** definições na mesma coluna: em contexto de conteúdo conta
só o que está publicado, nos outros conta tudo. Uma reimplementação precisa dos dois
cálculos, e a diferença é observável na interface.

## Contratos

| operação | entrada | saída | erros |
|---|---|---|---|
| criar ou renomear rótulo | contexto, nome, pai opcional | rótulo no contexto | sem a capacidade que o contexto declara, hierarquia em contexto plano, nome vazio |
| classificar conteúdo | identificador do conteúdo, contexto, lista de rótulos | vínculos daquele conteúdo naquele contexto **substituídos integralmente** | contexto não declarado para aquele tipo de conteúdo, rótulo desconhecido sem permissão de criar (ignorado, sem criar nada) |
| remover vínculo | identificador do conteúdo, contexto, rótulo | vínculo removido, contagens atualizadas | nenhum |
| apagar rótulo | contexto, rótulo | rótulo apagado, vínculos removidos, conteúdo preservado | rótulo é o padrão do contexto, e a recusa vence inclusive o ator de maior poder |
| listar rótulos | contexto, filtros | lista com hierarquia e contagem | nenhum |

A substituição integral da lista é contrato, não detalhe: enviar lista parcial remove o
que não veio.

## Migração de dados

**Nada vem do sistema velho** (resposta 2). A instalação nova cria o rótulo padrão do
contexto de categoria, como o instalador do legado faz, porque a regra do termo padrão
depende dele existir.

Se houver migração futura: as contagens desnormalizadas podem divergir na origem e
precisam ser recalculadas com os dois critérios, e o objeto da junção precisa receber
discriminador, o que exige resolver o contexto do outro lado de cada linha para descobrir
se o objeto é conteúdo ou link.

## Sequência

Depende de 001, por autorização. É dependência de 002 (a regra do termo padrão é aplicada
na gravação e na publicação do conteúdo) e de 009 (um menu de navegação é um contexto de
classificação).

Ordem interna: a separação entre rótulo e contexto (REQ-033) antes de tudo; depois a
classificação (REQ-034), o termo padrão (REQ-035), a manutenção da lista (REQ-036) e a
proibição de apagar o padrão (REQ-037).

## Riscos

1. **O discriminador do objeto classificado** é decisão de modelo que a spec deixa em
   aberto, e a resposta 2 proíbe que ela recuse hoje o que o legado aceita.
2. **A contagem com dois critérios** é fácil de implementar com um só, e a diferença só
   aparece em contexto que não é de conteúdo.
3. **A fusão das duas tabelas** é segura e simplifica, mas muda o identificador que a
   junção referencia. Se alguma extensão do ecossistema usa esse identificador, e a
   decisão fundadora de retrocompatibilidade sugere que usa, a fusão é observável.
4. **Não existe índice isolado no objeto da junção**: a chave composta serve para "quais
   rótulos tem este objeto" e não para o caminho inverso. O modelo novo precisa do
   segundo índice, ou herda uma consulta lenta que o legado também tem.
