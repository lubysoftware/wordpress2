# UC-26 · Confirmar solicitação de dados pessoais

> Grupo: **Privacidade** · Confiança: 🟢 `confirmado`
> Índice: [`use-cases.md`](use-cases.md)

## Identificação

| Campo | Valor |
|---|---|
| **Objetivo** | autorizar, como titular dos dados, que o site execute o pedido feito em meu nome |
| **Ator principal** | Titular de dados pessoais (`titular-de-dados`, `human`) |
| **Atores secundários** | Servidor de e-mail (`servidor-de-e-mail`) |
| **Gatilho** | o titular abre o link recebido por e-mail, que chega em `wp-login.php?action=confirmaction` |
| **Autorização** | a chave com hash guardada na solicitação, válida por 24 horas. Não há conta, não há capacidade: a posse do e-mail é a autorização |
| **Relações UML** | — nenhuma |

## Pré-condições

- a solicitação existe e está em estado pendente ou de falha
- a chave tem menos de 24 horas

## Fluxo principal

1. Titular abre o link de confirmação
2. Sistema localiza a solicitação pelo identificador do link
3. Sistema confere que o estado permite validação
4. Sistema compara a chave do link com o hash guardado e confere o prazo de 24 horas
5. Sistema grava o estado de confirmada e apaga a chave
6. Sistema avisa o administrador do site de que a solicitação está pronta para execução

## Sequência

O mesmo fluxo principal com remetente e destinatário explícitos. `self` é decisão interna do sistema.

| # | De | Para | Mensagem | Tipo | Condição ou regra |
|---|---|---|---|---|---|
| 1 | Titular de dados pessoais | Sistema | abre o link de confirmação | `sync` | — |
| 2 | Sistema | Sistema | localiza a solicitação pelo identificador do link | `self` | — |
| 3 | Sistema | Sistema | confere que o estado permite validação | `self` | só pendente ou falha; qualquer outro devolve "solicitação expirada" |
| 4 | Sistema | Sistema | compara a chave com o hash e confere o prazo de 24 h | `self` | — |
| 5 | Sistema | Sistema | grava o estado de confirmada e apaga a chave | `self` | — |
| 6 | Sistema | Servidor de e-mail | avisa o administrador que a solicitação está pronta | `async` | — |

```mermaid
sequenceDiagram
    autonumber
    participant Titulardedadospessoais as Titular de dados pessoais
    participant Sistema as Sistema
    participant Servidordeemail as Servidor de e-mail
    Titulardedadospessoais->>Sistema: abre o link de confirmação
    Sistema->>Sistema: localiza a solicitação pelo identificador do link
    Sistema->>Sistema: confere que o estado permite validação
    Note over Sistema: só pendente ou falha; qualquer outro devolve "solicitação expirada"
    Sistema->>Sistema: compara a chave com o hash e confere o prazo de 24 h
    Sistema->>Sistema: grava o estado de confirmada e apaga a chave
    Sistema->>Servidordeemail: avisa o administrador que a solicitação está pronta (assíncrono)
```

## Fluxos alternativos

### A solicitação estava em estado de falha

1. A validação é aceita do mesmo jeito
2. Sem isso, uma falha de envio seguida de clique no link antigo travaria o fluxo para sempre

## Exceções

| O que dá errado | Como o sistema reage |
|---|---|
| A solicitação já foi concluída | a validação é recusada: a chave só pode ser validada em estado pendente ou de falha. É isso que impede reconfirmar um pedido já executado |
| Chave com mais de 24 horas | "solicitação expirada". Na expiração por rotina, a chave é apagada no mesmo comando que muda o estado: o link antigo deixa de **existir**, em lugar de apenas vencer |
| Chave inválida | erro genérico; nenhum contador de tentativa existe |

## Pós-condições

- a solicitação está confirmada e pode ser executada pelo administrador
- a chave de confirmação não existe mais
- nada foi exportado nem apagado ainda

## Regras de negócio aplicadas

- D2 — nada acontece sem confirmação do titular; a chave vale 24 horas e é guardada com hash (domain.md §2.5)
- D3 — falha de envio é estado, e é por isso que o estado de falha aceita validação de chave (domain.md §2.5)
- A chave de confirmação é um dos cinco mecanismos de autorização que não consultam capacidade (permissions.md §9)

## Implementado em

- `wp-login.php:1240`
- `wp-includes/user.php:5083`
- `wp-includes/user.php:5097`
- `wp-includes/user.php:4245`
- `wp-includes/user.php:4252`
- `wp-includes/post.php:782`

## O que um porte precisa saber

- 🟢 **O estado de falha acumula dois significados.** "O e-mail não saiu" e "o titular não confirmou em 24 horas" são o mesmo estado, e nada no registro os distingue. A consequência prática é a mesma — pode-se reenviar — mas um relatório de conformidade não consegue separar os dois.
- 🟢 **O fluxo é à prova de execução acidental.** Nenhum caminho leva de pendente a executada sem passar por aqui, e a chave morre na confirmação. É o desenho mais defensivo do sistema.
