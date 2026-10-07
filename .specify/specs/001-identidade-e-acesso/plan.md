# Plano — Identidade e acesso

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


### Hash e verificação de senha (`hash-de-senha`)

Não existe slot de 'autenticação' aqui, e isso é decisão: cookie, nonce e senha de aplicação são lógica de núcleo, e o núcleo fica fora desta arquitetura por decisão registrada. O que é escolha de tecnologia é o hash — e ele não pode ser aproximado, porque a chave do HMAC do cookie embute um fragmento de 4 caracteres do hash da senha (`wp-includes/pluggable.php:855-867`, confirmado na Pergunta 7). Se o hash divergir em um byte, toda sessão divergente, e a Pergunta 7 manda preservar exatamente esse efeito, inclusive o fato de nada ser revogado.

| candidato | o que é | situação |
|---|---|---|
| `bcrypt-nativo` | bcrypt por biblioteca nativa, com HMAC do runtime | **recomendado pela pesquisa** |
| `bcrypt-puro` | bcrypt em JavaScript puro | candidato |
| `argon2` | Argon2 | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É o único caminho em que cada peça do hash do legado tem contraparte exata — HMAC-SHA384, base64, bcrypt e o prefixo `$wp` —, e o hash entra na chave do cookie, onde aproximação não existe.

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

### Envio de e-mail (`envio-de-email`)

Quinta porta do plano escolhido, e o slot com o achado mais incômodo do documento: o transporte de fábrica do legado é `$phpmailer->isMail()`, que usa a função `mail()` do PHP (`integrations.json`, `wp-includes/pluggable.php:505`), sem credencial nenhuma. Em runtime de JavaScript essa função não existe. É o único slot em que 'idêntico' é impossível por AUSÊNCIA DE PRIMITIVA, não por decisão — e o e-mail carrega UC-20 (recuperar senha), UC-26 (confirmar solicitação de dado pessoal) e UC-36 (recuperar o site após erro fatal).

| candidato | o que é | situação |
|---|---|---|
| `biblioteca-com-transporte-selecionavel` | Biblioteca de envio com transporte selecionável | **recomendado pela pesquisa** |
| `entrega-local` | Binário local de entrega (sendmail) | candidato |
| `smtp-proprio` | SMTP implementado na própria porta | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** É a única que reproduz a FORMA do legado — transporte selecionável atrás de uma função substituível — sem reescrever protocolo à mão, e o transporte de fábrica não tem contraparte em nenhuma das três opções.

### Cache de objeto (`cache`)

Quarta porta do plano escolhido: `object-cache`, com 27 dependentes diretos. E é um dos quatro pontos que REQ-170 (`wont`) tira do mecanismo de arquivo solto e transforma em contrato nomeado — ou seja, o `wont` do backlog e a porta da arquitetura escolhida pedem aqui a MESMA coisa. O que o slot decide: `WP_Object_Cache` por padrão não persiste nada entre requisições, e REQ-165 (`must`, `bloqueado`) registra que ninguém decidiu se o sistema novo nasce persistente.

| candidato | o que é | situação |
|---|---|---|
| `em-processo` | Cache por requisição, em memória do processo | **recomendado pela pesquisa** |
| `redis` | Backend persistente compatível com Redis | candidato |
| `memcached` | Memcached | candidato |

**Razão da recomendação, como registrada em `tech-stack.json`:** A Pergunta 1 já respondeu o que REQ-165 pergunta: num clone do CMS o default de fábrica é a especificação, e o default de fábrica é não persistir nada entre requisições.

## Modelo de dados

Quatro estruturas do legado sustentam esta feature, e duas delas não existem como tabela.

| estrutura do legado | o que guarda | o que muda no modelo novo |
|---|---|---|
| `users` | identidade: `user_login` imutável, `user_pass` com o hash, `user_email`, `user_nicename` (que é o identificador do autor na URL), `user_registered` em UTC, `user_activation_key` com o instante prefixado, `display_name` | nada de forma observável. Em rede, o DDL do legado acrescenta `spam` e `deleted` na mesma tabela: são duas variantes escolhidas na instalação, e o modelo novo precisa das duas |
| `usermeta` | perfil **e autorização**: a chave `<prefixo>capabilities` guarda um arranjo serializado de papéis, e o identificador do site entra **dentro do nome da chave** | a autorização continua por capacidade, e o vínculo conta por site continua observável. A resposta 4 autoriza normalizar o armazenamento por baixo, desde que o comportamento não mude |
| `options`, chave `<prefixo>user_roles` | a definição dos papéis, serializada | continua sendo dado gravado e mutável, não código (ADR 0001). Povoar é operação de instalação, de atualização e de criação de site de rede, e só nesses três momentos |
| sessão | arranjo de tokens em `usermeta`, com expiração por token | continua acumulando: a resposta 7 decidiu que trocar a senha não revoga nada, e que o registro do token sobrevive |

Três consequências que o modelo novo não pode apagar:

1. **Nenhum índice alcança a permissão.** A pergunta "quem são os administradores deste
   site" exige, no legado, busca por texto com curinga à esquerda sobre valor
   serializado. Normalizar isso é permitido; mudar o que a interface de papéis devolve,
   não.
2. **A unicidade de `user_login` e de `user_email` é verificada em código**, não no
   armazenamento: o banco aceita duplicata. Declarar a restrição é exatamente o que
   REQ-010 pede, e REQ-010 ficou `bloqueado`, logo esta feature **não** a declara.
3. **O hash entra na chave do HMAC do cookie**, por um fragmento de 4 caracteres extraído
   de dois jeitos conforme o formato do hash. Um byte diferente no hash muda toda sessão,
   e a resposta 7 manda preservar esse efeito.

## Contratos

As operações desta feature, com entrada, saída e erro. O protocolo fica aberto enquanto
os slots `framework-http` e `isolamento-de-requisicao` não estiverem definidos: o que está
fixo é a forma da operação, não o transporte.

| operação | entrada | saída | erros |
|---|---|---|---|
| autenticar | identificador (login ou e-mail) e senha | identidade autenticada e token de sessão, com destino de retorno | credencial inválida, em **quatro** códigos distintos que nomeiam o login ou o e-mail tentado (resposta 6 manda preservar), conta de site suspenso |
| encerrar sessão corrente | token corrente | confirmação, com as outras sessões intactas | token inexistente |
| pedir redefinição de senha | identificador | confirmação de envio, sempre com a mesma forma | falha de envio de e-mail, que é estado reportável e não exceção |
| redefinir senha | chave e senha nova | identidade com senha trocada e chave apagada | chave vencida (24 h), chave já usada, senha recusada |
| cadastrar-se | login e e-mail | conta criada com o papel de cadastro aberto | cadastro aberto desligado, login ou e-mail já em uso, login na lista de proibidos (vazia por padrão) |
| emitir credencial de aplicação | identificador da conta e nome da credencial | segredo gerado, exibido **uma única vez**, e o registro com resumo criptográfico | sem permissão de editar aquela conta |
| revogar credencial de aplicação | identificador da credencial | confirmação | idem |
| perguntar permissão | identidade, capacidade pedida, objeto opcional | sim ou não | nenhum: a resposta é sempre booleana, e a lista vazia de mapeamento significa permitido |
| administrar conta | identidade alvo e alterações | conta alterada | sem permissão sobre aquela conta, em particular sobre conta de maior poder |

A operação de perguntar permissão é a mais chamada do sistema e precisa de contrato
estável: ela recebe a capacidade pedida, traduz em lista de capacidades primitivas e
exige **todas** as devolvidas.

## Migração de dados

**Nada vem do sistema velho.** A resposta 2 fixa que o porte parte de instalação nova,
sem banco de produção e sem dump, logo não há conta, sessão nem credencial a migrar, e
não há órfão herdado.

O que nasce populado é a matriz de papéis: a resposta 5 manda assumir a matriz de fábrica
como a matriz real, reproduzindo as oito funções de povoamento do legado, inclusive as
que existem só por retrocompatibilidade. O que nasce vazio é todo o resto: nenhuma conta,
nenhuma sessão, nenhuma credencial de aplicação.

Se algum dia existir migração de instalação real, duas coisas desta feature exigem
trabalho que não é SQL: as capacidades estão serializadas em texto e precisam ser
interpretadas fora do banco, e o identificador de site mora dentro do nome da chave de
metadado.

## Sequência

Esta feature não depende de nenhuma outra, e é a única nessa situação junto com a 012:
nove das quinze features dependem dela. Ela deve ser a primeira a ser construída.

Ordem interna, pelos `depends_on` dos cards: a decisão de autorização por capacidade
(REQ-014) vem antes da resolução de permissão sobre objeto (REQ-015), que vem antes da
administração de contas (REQ-013); a autenticação (REQ-001) vem antes do encerramento de
sessão (REQ-002) e da expiração (REQ-003); a redefinição de senha (REQ-006) vem antes do
relato de falha de envio (REQ-007). A ordem completa, com as tarefas, está em
[`tasks.md`](tasks.md).

O que ela exige de fora: nada. O que depende dela: as features 002, 003, 004, 005, 006,
007, 008, 009, 010, 013 e 015.

## Riscos

1. **O conflito de REQ-017 e REQ-018** (seção Fora de escopo da spec) decide se a matriz
   de fábrica é portada com 61 concessões ou com 50. Começar pelo lado errado joga fora a
   tarefa de povoamento e os testes dela.
2. **A credencial de aplicação sem consumidor.** REQ-012 ficou fora do pacote, logo esta
   feature emite uma credencial que nada autentica. As features 013 e 015 esperam por
   esse consumo.
3. **O fragmento do hash na chave do cookie** tem dois ramos conforme o formato do hash,
   repetidos em dois lugares do legado. É o tipo de detalhe que um porte perde sem o
   teste notar, porque o login continua funcionando.
4. **A pergunta de permissão é performance.** No legado ela lê metadado serializado e o
   deserializa a cada requisição, e o slot `cache` existe por causa disso. Resolver com
   cache persistente muda o momento em que uma alteração de papel passa a valer, o que é
   observável.
5. **Quatro capacidades só existem por ponto de extensão**, e o critério que manda
   declará-las (REQ-016) tem um item sem teste e sem número fechado. Ver a primeira
   pergunta em aberto da spec.
