# Plano — Rede multisite

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

## Modelo de dados

> **Esta feature não tem história nesta seleção.** O modelo abaixo descreve o que o legado
> tem, porque a resposta 4 de `questions.md` manda manter a rede no escopo do porte, e
> porque sem esse registro o pacote pareceria dizer que a rede não existe. Nada aqui é
> requisito: requisito está em [`spec.md`](spec.md), e lá a feature está vazia por falta
> de card na seleção.

O vocabulário das tabelas do legado está **invertido** em relação ao da interface: a
tabela chamada de site guarda **redes**, e a tabela chamada de blogs guarda **sites**.

| estrutura do legado | o que guarda |
|---|---|
| rede e metadado de rede | a rede que contém os sites |
| site e metadado de site | cada site da rede, com **quatro** campos de supervisão independentes, cada um com gancho de entrada e de saída, comparados campo a campo na atualização |
| cadastro pendente | o cadastro que reserva nome por **2 dias**; passado o prazo, o anterior é apagado e o novo prossegue |
| registro de cadastro | acumula endereço de origem e e-mail **sem política de retenção**, e apagar o site não o toca |
| conjunto de tabelas por site | 10 tabelas por site, escolhidas por prefixo no nome; numa rede de N sites o banco tem 2 mais 6 mais 10 vezes N tabelas |
| vínculo conta e site | dentro do **nome da chave** do metadado de autorização, não numa coluna |

Dois fatos que mudam conclusão e que o dicionário de dados não registra: o campo que
marca site encerrado tem **três** valores, e o terceiro significa "criado e ainda não
ativado"; e criar o conjunto de tabelas de um site novo **repovoa os papéis** a partir do
código, que é o único momento, fora da instalação e da atualização, em que a definição de
papel é reescrita.

## Contratos

**Não há contrato a especificar nesta feature**, e isso não é omissão: é a consequência de
nenhum card de EP-12 ter entrado na seleção com comportamento a construir. Especificar
operação aqui seria inventar requisito que a spec não sustenta, o que a regra absoluta
deste pacote proíbe.

Os 12 cards que especificariam estas operações estão listados no
[README do pacote](../../README.md), com a coluna em que ficaram. Quando eles entrarem,
esta seção deixa de estar vazia.

## Migração de dados

**Nada vem do sistema velho** (resposta 2), e nada nasce: a instalação é simples por
padrão, e a rede é capacidade do produto que a instalação liga por declaração.

A resposta 4 fixa duas coisas para quando esta feature existir: o modo de subdiretório é o
padrão de instalação e o de subdomínio é suportado; e o vínculo entre conta e site, que
hoje mora dentro do nome da chave de metadado, é regra observável cujo comportamento
precisa ser preservado ainda que o armazenamento seja normalizado por baixo.

## Sequência

Esta feature não depende de nenhuma outra e nenhuma depende dela, o que é consequência de
ela estar vazia. Se os 12 cards voltarem, ela passa a depender de 001 (a identidade é
global à rede e as capacidades são por site) e de 010 (criar site de rede repovoa papéis,
que é operação de instalação).

Não há ordem interna a declarar: [`tasks.md`](tasks.md) não tem tarefa.

## Riscos

1. **O risco principal é o pacote parecer completo sem esta feature.** A resposta 4 diz
   que um porte sem os arquivos de rede e as seis tabelas **não é idêntico**, e este
   pacote não especifica nenhum dos dois.
2. **O terceiro valor do campo de encerramento.** Quem portar lendo o dicionário de dados
   produz um estado a menos, e a falha aparece só quando um site novo é criado.
3. **O vínculo conta e site dentro do nome da chave.** Nenhum índice e nenhuma junção
   alcançam essa relação, e normalizá-la exige interpretar prefixo de chave, não SQL.
4. **O registro de cadastro acumula dado pessoal sem prazo.** A resposta 20 manda manter
   o comportamento e registrar como obrigação que a implantação assume, com rotina de
   descarte configurável e não embutida.
5. **A rede não tem modo de recuperação** no legado, e o modo de recuperação (feature
   010) declara explicitamente que erro causado por extensão de rede está fora de escopo.
