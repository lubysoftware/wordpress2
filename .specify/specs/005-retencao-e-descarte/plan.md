# Plano — Retenção e descarte

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

### Cache de objeto (`cache`)

Quarta porta do plano escolhido: `object-cache`, com 27 dependentes diretos. E é um dos quatro pontos que REQ-170 (`wont`) tira do mecanismo de arquivo solto e transforma em contrato nomeado — ou seja, o `wont` do backlog e a porta da arquitetura escolhida pedem aqui a MESMA coisa. O que o slot decide: `WP_Object_Cache` por padrão não persiste nada entre requisições, e REQ-165 (`must`, `bloqueado`) registra que ninguém decidiu se o sistema novo nasce persistente.

| candidato | o que é | situação |
|---|---|---|
| `em-processo` | Cache por requisição, em memória do processo | **recomendado pela pesquisa** |
| `redis` | Backend persistente compatível com Redis | candidato |
| `memcached` | Memcached | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A Pergunta 1 já respondeu o que REQ-165 pergunta: num clone do CMS o default de fábrica é a especificação, e o default de fábrica é não persistir nada entre requisições.

### Serialização do valor persistido (`serializacao-de-valor-persistido`)

Não é slot de infraestrutura, é slot de formato de dado, e é obrigatório porque o formato está DENTRO das colunas: `options.option_value`, `postmeta.meta_value`, `usermeta.meta_value` e `signups.meta` guardam valor serializado pelo formato nativo do PHP quando não é escalar (`erd-complete.md`, linhas 127, 276, 281 e 352), com 21 `maybe_serialize`, 17 `maybe_unserialize` e 9 `is_serialized` na árvore. `erd-complete.md` diz a consequência em uma linha: 'uma migração que normalize permissões precisa parsear PHP serializado, não SQL'. Em TypeScript esse formato não existe, e a Pergunta 2 fixa que a cascata observável não pode mudar.

| candidato | o que é | situação |
|---|---|---|
| `implementacao-propria` | Implementação própria do formato, com suíte de conformidade | **recomendado pela pesquisa** |
| `biblioteca-de-terceiro` | Biblioteca de serialização PHP para JavaScript | candidato |
| `json-no-lugar` | Trocar o formato por JSON no armazenamento | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** O formato é pequeno e fechado, a conformidade tem de ser provada byte a byte contra o oráculo da Pergunta 16 de qualquer forma, e nenhuma biblioteca escolhida sem acesso à rede dispensa essa prova.

## Modelo de dados

Esta feature não acrescenta tabela: ela acrescenta **marcadores** em metadado e um prazo
em configuração.

| estrutura do legado | o que guarda | o que muda no modelo novo |
|---|---|---|
| estado de lixeira do conteúdo | o estado `trash` na coluna de estado, com o estado anterior e o instante do descarte em metadado | sem mudança. A restauração devolve como rascunho, não ao estado anterior, por mudança deliberada do legado: o estado anterior fica gravado e disponível por ponto de extensão |
| estado de lixeira do comentário | o valor de lixeira na coluna de aprovação, com o estado anterior em metadado próprio | idem, por comentário, para que suspender os comentários de um conteúdo descartado seja reversível um a um |
| prazo de retenção | constante de configuração, 30 dias de fábrica | continua configurável, e o valor zero continua tornando o apagamento irreversível na primeira linha da operação |
| expiração de rascunho automático | consulta direta por data, 7 dias | sem mudança |

A tolerância a estado inconsistente é regra, não defeito: se o marcador de "na lixeira
desde" existe mas o registro não está mais na lixeira, a rotina apaga só o marcador e
segue, sem apagar o registro.

## Contratos

| operação | entrada | saída | erros |
|---|---|---|---|
| descartar para a lixeira | identificador | registro em estado de lixeira, com estado anterior e instante gravados, e comentários suspensos | lixeira desligada, caso em que a operação é apagamento definitivo e o ator precisa ter sido avisado antes |
| restaurar | identificador | registro em rascunho, com os comentários devolvidos ao estado de cada um | marcador ausente, que é estado tolerado |
| apagar em definitivo | identificador | registro apagado, filhos e anexos **reparentados para o avô** | sem permissão |
| coletar o que venceu | nenhuma (gatilho agendado) | contagem do que foi apagado | nenhum: estado inconsistente é tolerado e não interrompe a coleta |

O reparentamento é a parte que mais se perde num porte: a semântica do legado ao apagar
é reparentar filhos e anexos, não apagá-los em cascata.

## Migração de dados

**Nada vem do sistema velho** (resposta 2): a lixeira nasce vazia.

Uma advertência para migração futura, que vale como aviso de modelagem agora: declarar
restrição de integridade com apagamento em cascata no destino **muda o comportamento do
legado**, porque anexos e páginas filhas são reparentados, não apagados. É o primeiro
risco do ERD para quem migra, e o princípio P5 da constituição existe por causa dele.

## Sequência

Depende de 001 (autorização), de 002 (o estado editorial e o reparentamento são do
conteúdo) e de 011 (a coleta é trabalho agendado).

A dependência de 011 é o ponto sensível desta feature: o conflito aberto daquela feature
decide se a coleta roda sozinha ou só depois de alguém entrar no painel, e é exatamente o
que CA-5.1 afirma. Ordem interna: descarte (REQ-047) e suspensão dos comentários
(REQ-048) antes da restauração (REQ-049); o aviso de irreversibilidade (REQ-050) junto do
descarte; a coleta (REQ-052), a expiração de rascunho automático (REQ-053) e a tolerância
a inconsistência (REQ-054) depois.

## Riscos

1. **O conflito de REQ-052 com a resposta 10** é o risco principal, e ele não é técnico:
   construir qualquer um dos dois lados joga fora o trabalho do outro.
2. **Desligar a lixeira muda o destino do comentário proibido**, que vai para spam em vez
   de para a lixeira. É a mesma constante decidindo duas coisas.
3. **O reparentamento ao apagar** é fácil de trocar por cascata, e a troca é invisível até
   alguém apagar uma página com filhas.
4. **A restauração como rascunho** parece defeito e é decisão. Um porte "melhorado" que
   devolva ao estado anterior rompe a paridade de um comportamento que a pessoa que usa
   conhece.
5. **A coleta sem registro.** CA-5.5 exige contagem registrada, o legado não registra
   nada, e a resposta 20 proíbe inventar prazo de retenção para o registro novo.
