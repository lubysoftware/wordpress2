# UC-03 · Publicar conteúdo

> Grupo: **Conteúdo** · Confiança: 🟢 `confirmado`
> Índice: [`use-cases.md`](use-cases.md)

## Identificação

| Campo | Valor |
|---|---|
| **Objetivo** | tornar o próprio conteúdo visível ao público do site |
| **Ator principal** | Autor (`autor`, `human`) |
| **Atores secundários** | — nenhum |
| **Gatilho** | o autor salva o conteúdo com status publicado na tela de edição |
| **Autorização** | `publish_posts` do tipo de conteúdo, resolvida por `map_meta_cap()` a partir de `edit_post` do registro; `unfiltered_html` decide se o corpo passa por kses |
| **Relações UML** | inclui [UC-05 — Classificar conteúdo com termos](UC-05-classificar-conteudo-com-termos.md) · estendido por [UC-04 — Agendar publicação de conteúdo](UC-04-agendar-publicacao-de-conteudo.md) |

## Pré-condições

- o registro existe, ainda que como `auto-draft` criado pelo ato de abrir o editor
- o ator tem `publish_posts` — o que exclui o colaborador, que percorre UC-06

## Fluxo principal

1. Autor salva o conteúdo pedindo que seja publicado
2. Sistema verifica a capacidade de publicar aquele tipo de conteúdo
3. Sistema sanitiza o corpo com kses, salvo se o ator tem HTML bruto liberado
4. Sistema cobra unicidade do identificador na URL, que em rascunho era dispensada
5. Sistema aplica o termo padrão de toda taxonomia que declare um
6. Sistema grava o status publicado e dispara a transição
7. Sistema devolve o conteúdo publicado com o endereço definitivo

## Sequência

O mesmo fluxo principal com remetente e destinatário explícitos. `self` é decisão interna do sistema.

| # | De | Para | Mensagem | Tipo | Condição ou regra |
|---|---|---|---|---|---|
| 1 | Autor | Sistema | salva o conteúdo pedindo que seja publicado | `sync` | — |
| 2 | Sistema | Sistema | verifica a capacidade de publicar aquele tipo | `self` | map_meta_cap resolve edit_post em capacidades primitivas |
| 3 | Sistema | Sistema | sanitiza o corpo com kses | `self` | pulado para quem tem unfiltered_html; editor tem |
| 4 | Sistema | Sistema | cobra unicidade do identificador na URL | `self` | dispensada em draft e pending, logo o slug muda sozinho ao publicar |
| 5 | Sistema | Sistema | aplica o termo padrão de cada taxonomia | `self` | regra P3; default_category nasce em 1 |
| 6 | Sistema | Sistema | grava o status publicado e dispara a transição | `self` | — |
| 7 | Sistema | Autor | devolve o conteúdo publicado com o endereço definitivo | `return` | — |

```mermaid
sequenceDiagram
    autonumber
    participant Autor as Autor
    participant Sistema as Sistema
    Autor->>Sistema: salva o conteúdo pedindo que seja publicado
    Sistema->>Sistema: verifica a capacidade de publicar aquele tipo
    Note over Sistema: map_meta_cap resolve edit_post em capacidades primitivas
    Sistema->>Sistema: sanitiza o corpo com kses
    Note over Sistema: pulado para quem tem unfiltered_html; editor tem
    Sistema->>Sistema: cobra unicidade do identificador na URL
    Note over Sistema: dispensada em draft e pending, logo o slug muda sozinho ao publicar
    Sistema->>Sistema: aplica o termo padrão de cada taxonomia
    Note over Sistema: regra P3; default_category nasce em 1
    Sistema->>Sistema: grava o status publicado e dispara a transição
    Sistema-->>Autor: devolve o conteúdo publicado com o endereço definitivo
```

## Fluxos alternativos

### Publicar como privado

1. Autor escolhe visibilidade privada
2. Sistema grava `private` em lugar de `publish`
3. O conteúdo passa a exigir `read_private_posts` de quem o lê

### Data futura informada

1. Sistema compara a data com o instante atual
2. Com mais de 60 segundos de diferença, o status vira agendado — ver UC-04

### Conteúdo já estava publicado

1. `wp_publish_post()` retorna sem efeito
2. Nenhum gancho de transição dispara: republicar é operação nula

## Exceções

| O que dá errado | Como o sistema reage |
|---|---|
| Ator sem capacidade de publicar | o painel recusa com "Você não tem permissão"; pela API REST a resposta é HTTP 403 |
| Conteúdo é a página inicial ou a página de posts | a autorização deixa de ser de conteúdo e passa a exigir `manage_options` |
| Conteúdo é a página de política de privacidade | `manage_privacy_options` é somada às capacidades normais |
| Tipo ou status não registrado | o mapeamento degrada para `edit_others_posts`, a capacidade mais alta, com aviso de uso indevido — todo caminho de erro da autorização fecha a porta |

## Pós-condições

- o registro está em `publish` e aparece na consulta pública
- o identificador na URL está fixado e é único entre os publicados
- toda taxonomia com termo padrão tem ao menos um termo atribuído
- o evento `publish_future_post` pendente, se havia, foi limpo

## Regras de negócio aplicadas

- P1 — publicar é ato explícito: `wp_insert_post()` grava `draft` quando o status não é informado, enquanto o default do DDL é `publish` (domain.md §2.1)
- P3 — post do tipo `post` sempre tem categoria (domain.md §2.1)
- P5 — rascunho pode ter slug duplicado; publicado, não. O slug do rascunho muda sozinho ao publicar (domain.md §2.1)
- P7 — republicar é operação nula (domain.md §2.1)
- P8 — HTML bruto é privilégio, e revogável por constante (domain.md §2.1)

## Implementado em

- `wp-admin/post.php:236`
- `wp-includes/post.php:4598`
- `wp-includes/post.php:4703`
- `wp-includes/post.php:5404`
- `wp-includes/post.php:5419`
- `wp-includes/post.php:5561`
- `wp-includes/kses.php:2609`
- `wp-includes/capabilities.php:149`
- `wp-includes/post.php:8188`

## O que um porte precisa saber

- 🟢 **Duas regras para a mesma coluna.** O DDL manda `publish` como default; `wp_insert_post()` manda `draft`. Quem chega pelo banco e quem chega pela aplicação produzem conteúdos diferentes a partir da mesma omissão.
- 🟢 **O identificador na URL muda sozinho.** A unicidade do slug é dispensada em rascunho e cobrada na publicação, logo o endereço que o autor viu enquanto escrevia pode não ser o endereço final. Num porte, isso é uma quebra de link silenciosa.
- 🟢 **`editor` tem `unfiltered_html`.** Postar `<script>` não é privilégio exclusivo de administrador — é a concessão mais consequente da matriz de papéis.
