# UC-17 · Registrar notificação de link de site remoto

> Grupo: **Interação pública** · Confiança: 🟢 `confirmado`
> Índice: [`use-cases.md`](use-cases.md)

## Identificação

| Campo | Valor |
|---|---|
| **Objetivo** | informar ao site que outra página passou a apontar para um conteúdo dele |
| **Ator principal** | Site remoto (`site-remoto`, `system`) |
| **Atores secundários** | — nenhum |
| **Gatilho** | o site remoto chama `pingback.ping` em `xmlrpc.php`, ou envia um formulário a `wp-trackback.php` |
| **Autorização** | nenhuma credencial. A autorização do pingback é a **prova**: a página de origem é buscada e tem de conter o link. O trackback não traz prova nenhuma |
| **Relações UML** | — nenhuma |

## Pré-condições

- o conteúdo de destino existe e aceita ping
- a URL de origem é alcançável pelo site, no caso do pingback

## Fluxo principal

1. Site remoto declara que uma página sua aponta para um conteúdo deste site
2. Sistema resolve a URL de destino num conteúdo existente
3. Sistema recusa se já houver notificação daquela origem para aquele conteúdo
4. Sistema busca a página de origem e confere que ela contém o link
5. Sistema extrai o título e o trecho ao redor do link
6. Sistema grava a notificação como comentário do tipo correspondente
7. Sistema responde ao site remoto

## Sequência

O mesmo fluxo principal com remetente e destinatário explícitos. `self` é decisão interna do sistema.

| # | De | Para | Mensagem | Tipo | Condição ou regra |
|---|---|---|---|---|---|
| 1 | Site remoto | Sistema | declara que uma página sua aponta para um conteúdo deste site | `sync` | — |
| 2 | Sistema | Sistema | resolve a URL de destino num conteúdo existente | `self` | url_to_postid compara host, logo rejeita URL só aparentemente local |
| 3 | Sistema | Sistema | recusa notificação repetida da mesma origem | `self` | — |
| 4 | Sistema | Site remoto | busca a página de origem para conferir o link | `sync` | só no pingback: o trackback não traz prova |
| 5 | Sistema | Sistema | extrai o título e o trecho ao redor do link | `self` | — |
| 6 | Sistema | Sistema | grava a notificação como comentário | `self` | pingback do próprio site publicado é aprovado; trackback nunca |
| 7 | Sistema | Site remoto | responde a confirmação ou o erro | `return` | — |

```mermaid
sequenceDiagram
    autonumber
    participant Siteremoto as Site remoto
    participant Sistema as Sistema
    Siteremoto->>Sistema: declara que uma página sua aponta para um conteúdo deste site
    Sistema->>Sistema: resolve a URL de destino num conteúdo existente
    Note over Sistema: url_to_postid compara host, logo rejeita URL só aparentemente local
    Sistema->>Sistema: recusa notificação repetida da mesma origem
    Sistema->>Siteremoto: busca a página de origem para conferir o link
    Note over Sistema,Siteremoto: só no pingback: o trackback não traz prova
    Sistema->>Sistema: extrai o título e o trecho ao redor do link
    Sistema->>Sistema: grava a notificação como comentário
    Note over Sistema: pingback do próprio site publicado é aprovado; trackback nunca
    Sistema-->>Siteremoto: responde a confirmação ou o erro
```

## Fluxos alternativos

### Pingback vindo do próprio site

1. Sistema resolve a origem com `url_to_postid()` e confere que o conteúdo de origem está publicado
2. Nesse caso o pingback é aprovado automaticamente

### Trackback com codificação declarada

1. Sistema valida que a codificação declarada existe no servidor e converte título, resumo e nome do site
2. Rejeita `UTF-7` explicitamente

### Consulta dos pingbacks de uma URL

1. `pingback.extensions.getPingbacks` lista as notificações recebidas de uma URL
2. Não exige credencial

## Exceções

| O que dá errado | Como o sistema reage |
|---|---|
| A página de origem não contém o link | o pingback é recusado: a prova é a autorização |
| Ping já registrado daquela origem | o trackback responde "There is already a ping from that URL for this post" |
| Ping fechado no conteúdo | recusa com "trackbacks are closed for this item". Conteúdo do tipo `post` com mais de 14 dias tem ping fechado em memória se a opção estiver ligada |
| Sem identificador de conteúdo | `trackback_response( 1, 'I really need an ID for this to work.' )` |

## Pós-condições

- existe um comentário do tipo `pingback` ou `trackback` no conteúdo, aprovado ou em moderação
- no caso do pingback, o site fez uma requisição de saída para a origem declarada

## Regras de negócio aplicadas

- C8 — pingback do próprio site publicado é aprovado; trackback nunca, porque não traz prova de origem (domain.md §2.2)
- C11 — comentário e ping em conteúdo antigo fecham sozinhos, em memória (domain.md §2.2)
- Glossário — pingback é verificado, trackback é dado de requisição não verificado (domain.md §1.4)
- [ADR 0003](../adrs/0003-pingback-do-proprio-site-aprovado-trackback-nunca.md) — pingback do próprio site aprovado, trackback nunca

## Implementado em

- `wp-includes/class-wp-xmlrpc-server.php:158`
- `wp-includes/class-wp-xmlrpc-server.php:6974`
- `wp-includes/class-wp-xmlrpc-server.php:7231`
- `wp-trackback.php:33`
- `wp-trackback.php:57`
- `wp-trackback.php:99`
- `wp-trackback.php:126`
- `wp-trackback.php:148`
- `wp-includes/comment.php:168`
- `wp-includes/comment.php:3841`

## O que um porte precisa saber

- 🟢 **Dois protocolos para o mesmo objetivo, com níveis de confiança opostos.** O pingback busca a página de origem e exige o link; o trackback aceita título, resumo e nome do site como dado de requisição. O código diz isso por escrito, e o produto manteve os dois.
- 🟢 **O pingback faz o site emitir requisição por ordem de um desconhecido.** Qualquer um pode pedir que este site busque uma URL arbitrária. É a superfície de entrada que provoca saída, e nenhum limite de taxa a protege.
