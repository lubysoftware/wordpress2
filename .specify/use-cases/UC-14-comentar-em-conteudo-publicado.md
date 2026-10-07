# UC-14 · Comentar em conteúdo publicado

> Grupo: **Interação pública** · Confiança: 🟢 `confirmado`
> Índice: [`use-cases.md`](use-cases.md)

## Identificação

| Campo | Valor |
|---|---|
| **Objetivo** | deixar uma opinião num conteúdo do site, com ou sem conta |
| **Ator principal** | Visitante (`visitante`, `human`) |
| **Atores secundários** | Serviço Akismet (`akismet`) · Servidor de e-mail (`servidor-de-e-mail`) |
| **Gatilho** | o visitante envia o formulário de comentário para `wp-comments-post.php` |
| **Autorização** | não é capacidade. Os portões são a opção de exigir conta, a de exigir nome e e-mail, o estado do conteúdo e a senha de post. Quem tem `moderate_comments` ganha tratamento diferente, mas não é condição de entrada |
| **Relações UML** | estendido por [UC-15 — Classificar comentário por serviço externo](UC-15-classificar-comentario-por-servico-externo.md) |

## Pré-condições

- o conteúdo existe, está publicado e aceita comentário
- se `comment_registration` estiver ligada, o visitante tem conta e está autenticado

## Fluxo principal

1. Visitante envia o formulário de comentário
2. Sistema confere se o conteúdo aceita comentário e se o visitante atende às exigências de identificação
3. Sistema recusa duplicata exata e aplica o limite de vazão por hora
4. Sistema consulta o serviço externo de spam, se houver um ativo
5. Sistema decide o estado inicial do comentário percorrendo as regras de moderação em ordem
6. Sistema grava o comentário e atualiza o contador do conteúdo
7. Sistema avisa por e-mail quem precisa saber
8. Sistema devolve o visitante ao conteúdo

## Sequência

O mesmo fluxo principal com remetente e destinatário explícitos. `self` é decisão interna do sistema.

| # | De | Para | Mensagem | Tipo | Condição ou regra |
|---|---|---|---|---|---|
| 1 | Visitante | Sistema | envia o formulário de comentário | `sync` | — |
| 2 | Sistema | Sistema | confere se o conteúdo aceita comentário e a identificação do visitante | `self` | comment_registration e require_name_email; require_name_email nasce em 1 |
| 3 | Sistema | Sistema | recusa duplicata e aplica o limite de vazão | `self` | duplicata ⇒ 409; enxurrada ⇒ 429; quem modera não é limitado |
| 4 | Sistema | Serviço Akismet | pede o julgamento de spam do comentário | `sync` | todo campo string do POST e todo cabeçalho exceto o cookie são enviados |
| 5 | Sistema | Sistema | decide o estado inicial percorrendo as regras de moderação | `self` | autor do post e moderador entram aprovados sem nenhuma verificação |
| 6 | Sistema | Sistema | grava o comentário e atualiza o contador | `self` | nota editorial não entra no contador |
| 7 | Sistema | Servidor de e-mail | envia o aviso de comentário ou de moderação | `async` | — |
| 8 | Sistema | Visitante | devolve o visitante ao conteúdo | `return` | — |

```mermaid
sequenceDiagram
    autonumber
    participant Visitante as Visitante
    participant Sistema as Sistema
    participant ServioAkismet as Serviço Akismet
    participant Servidordeemail as Servidor de e-mail
    Visitante->>Sistema: envia o formulário de comentário
    Sistema->>Sistema: confere se o conteúdo aceita comentário e a identificação do visitante
    Note over Sistema: comment_registration e require_name_email; require_name_email nasce em 1
    Sistema->>Sistema: recusa duplicata e aplica o limite de vazão
    Note over Sistema: duplicata ⇒ 409; enxurrada ⇒ 429; quem modera não é limitado
    Sistema->>ServioAkismet: pede o julgamento de spam do comentário
    Note over Sistema,ServioAkismet: todo campo string do POST e todo cabeçalho exceto o cookie são enviados
    Sistema->>Sistema: decide o estado inicial percorrendo as regras de moderação
    Note over Sistema: autor do post e moderador entram aprovados sem nenhuma verificação
    Sistema->>Sistema: grava o comentário e atualiza o contador
    Note over Sistema: nota editorial não entra no contador
    Sistema->>Servidordeemail: envia o aviso de comentário ou de moderação (assíncrono)
    Sistema-->>Visitante: devolve o visitante ao conteúdo
```

## Fluxos alternativos

### O comentário é do autor do conteúdo ou de quem modera

1. Entra aprovado **sem passar por nenhuma verificação**
2. Se o ator tem `unfiltered_html` — e `editor` tem — o HTML do comentário não é sanitizado

### Moderação manual ligada

1. `check_comment()` retorna falso na primeira linha
2. Nenhuma outra regra é consultada: a moderação manual vence tudo

### Autor já aprovado antes

1. Com `comment_previously_approved` ligada, exige-se um comentário anterior aprovado do mesmo usuário, ou do mesmo par nome e e-mail
2. E exige-se que o e-mail não contenha palavra de moderação

### Casou com a lista de proibição

1. O comentário vai para a lixeira se a lixeira estiver ligada, e para spam se não
2. A distinção existe para que o conteúdo seja recuperável

### Resposta encadeada

1. Sistema recusa resposta a comentário não aprovado, com HTTP 403
2. A profundidade é limitada por `thread_comments_depth`, que nasce em 5

## Exceções

| O que dá errado | Como o sistema reage |
|---|---|
| Comentário duplicado | HTTP 409. Mesmo conteúdo, mesmo pai, mesmo autor, mesmo e-mail e mesmo texto; comentário na lixeira não conta como duplicata |
| Muitos comentários na última hora | HTTP 429. Quem tem `manage_options` ou `moderate_comments` não é limitado: a capacidade virou política de desempenho |
| Campo mais longo que a coluna | devolve erro ao visitante, em lugar de truncar em silêncio como o resto do sistema |
| Comentário fechado, conteúdo na lixeira, rascunho ou protegido por senha | quatro recusas distintas, cada uma com seu gancho: `comment_closed`, `comment_on_trash`, `comment_on_draft`, `comment_on_password_protected` |
| A consulta ao serviço de spam falhou | o comentário é reconsultado nas rodadas seguintes até completar 15 dias, e então é desistido |

## Pós-condições

- existe um comentário em estado aprovado, em moderação, em spam ou na lixeira
- o contador do conteúdo reflete apenas os comentários aprovados que contam
- todo campo do formulário e quase todo cabeçalho da requisição saíram do site para o serviço de spam

## Regras de negócio aplicadas

- C1 a C13 — a área de maior densidade de regra de negócio do sistema, e a ordem de avaliação importa: cada etapa pode encerrar a decisão (domain.md §2.2)
- C3 — autor do post e moderador têm aprovação automática, sem nenhuma verificação (domain.md §2.2)
- C4 — moderação manual vence tudo (domain.md §2.2)
- C9 — lista de proibição vai para a lixeira, não para spam (domain.md §2.2)
- C10 — texto longo demais é erro de usuário, não truncamento (domain.md §2.2)
- C11 — comentário em post antigo fecha sozinho, em memória: o banco não muda (domain.md §2.2)
- [ADR 0002](../adrs/0002-moderacao-de-comentario-em-cascata-com-atalho-de-confianca.md) — moderação de comentário em cascata com atalho de confiança

## Implementado em

- `wp-comments-post.php:25`
- `wp-includes/comment.php:3936`
- `wp-includes/comment.php:4022`
- `wp-includes/comment.php:4035`
- `wp-includes/comment.php:4053`
- `wp-includes/comment.php:4100`
- `wp-includes/comment.php:4107`
- `wp-includes/comment.php:752`
- `wp-includes/comment.php:909`
- `wp-includes/comment.php:918`
- `wp-includes/comment.php:1365`
- `wp-includes/comment.php:1384`
- `wp-includes/comment.php:2372`
- `wp-includes/comment.php:3071`
- `wp-includes/comment.php:46`

## O que um porte precisa saber

- 🟢 **A regra que mais surpreende é C3.** O comentário de quem é autor do conteúdo entra aprovado sem passar por verificação alguma — e se esse autor tem `unfiltered_html`, o que inclui todo `editor`, o HTML do comentário vai ao ar sem sanitização.
- 🟢 **O limite de vazão tem exceção por capacidade.** Quem modera não é limitado. Uma capacidade de moderação virou política de desempenho, e num porte isso significa que o limitador precisa consultar a autorização.
- 🟢 **A maior exportação de dado pessoal do sistema sai deste formulário anônimo.** Cada comentário submetido faz o serviço de spam receber todo campo string do POST e todo cabeçalho da requisição exceto o cookie.
