# ADR 0003 — Pingback do próprio site aprovado; trackback, nunca

| | |
|---|---|
| **Status** | Vigente |
| **Decidido em** | não determinável por `@since`; o bloco está dentro de `check_comment()` (`@since 1.5.0`) e o comentário explicativo é desta geração |
| **Área** | moderação |
| **Confiança** | 🟢 comportamento e justificativa lidos no código |
| **Evidência** | `wp-includes/comment.php:134`, `:168-196` |

## Contexto

Pingback e trackback são notificações automáticas de que outro conteúdo linkou este. Para
quem administra, são indistinguíveis de comentário na fila — e o caso mais comum de todos
é o **auto-pingback**: um post do próprio site linkando outro post do mesmo site, que gera
uma notificação que quem escreveu os dois vai ter de aprovar.

A opção `comment_previously_approved` (ligada por padrão) resolve isso para pessoas:
quem já teve um comentário aprovado passa direto. Mas pingback e trackback **não têm
autor com histórico** — o campo de autor é o título da página de origem.

Até esta geração, o ramo da opção simplesmente excluía os dois tipos
(`'trackback' !== $comment_type && 'pingback' !== $comment_type`, `:134`), o que os jogava
na fila sempre.

## Decisão

Tratar os dois tipos de forma **assimétrica**, com base em quanto cada protocolo prova:

- **Pingback cuja origem é um post publicado do próprio site é aprovado** sem moderação.
- **Trackback nunca é considerado**, qualquer que seja a origem declarada.

```php
// comment.php:178-181
$source_id        = url_to_postid( wp_unslash( $url ) );
$approve_pingback = $source_id > 0 && 'publish' === get_post_status( $source_id );
```

A justificativa está escrita no código, em comentário de nove linhas (`:169-174`):

> *"A pingback is verified before it reaches this point: the source page is fetched, it
> must link to the target, and the comment is built from that fetched page. A trackback
> carries no such proof. Its source URL, title, and excerpt are unverified request data,
> so a forged trackback naming a local post as its source would be approved."*

Duas salvaguardas acompanham a decisão:

1. `url_to_postid()` **compara nomes de host**, logo devolve `0` para qualquer URL que
   apenas pareça local. O comentário no código registra isso explicitamente (`:177`).
2. A origem precisa estar em `publish` — um rascunho não gera pingback aprovado.

O resultado é filtrável por `approve_pingback` (`:183-196`), com default `true` para
pingback local publicado e `false` para todo o resto.

## Alternativas consideradas

| Alternativa | Por que não foi adotada | Conf. |
|---|---|---|
| **Aprovar os dois tipos quando a origem é local** | é exatamente o que o comentário no código recusa: um trackback forjado declarando um post local como origem seria aprovado, e não há como desmentir a declaração. É a alternativa que a decisão existe para evitar | 🟢 — está escrito |
| **Manter os dois na fila** (comportamento anterior) | deixa o caso mais comum — auto-pingback — custando uma aprovação manual a cada link interno | 🟡 |
| **Desligar o auto-pingback na origem** | resolveria o incômodo sem mexer em moderação, mas mudaria o que o produto publica para fora, não o que ele aceita. E não cobre pingback legítimo de outro site do mesmo dono | 🟡 |
| **Verificar o trackback como se verifica o pingback** (buscar a origem e conferir o link) | tecnicamente possível, e tornaria o trackback confiável. Não foi feito — e a razão provável é que trackback é protocolo legado, e investir em verificação nele contraria a direção do produto | 🟡 |
| **Remover o suporte a trackback** | impedido por [`soul.md` D6](../soul.md): nada sai | 🟢 |

## Consequências

**Desejadas**

- O caso mais frequente de notificação deixa de exigir intervenção. 🟢
- A assimetria entre os dois protocolos passa a estar **registrada em código**, e não
  apenas no conhecimento de quem mantém o sistema. 🟢

**Indesejadas**

- **A regra depende de `url_to_postid()`**, que compara host. Uma instalação atrás de
  proxy, com domínio alternativo, ou em multisite com mapeamento de domínio pode ter a
  própria URL não reconhecida como local — e o auto-pingback volta para a fila sem que
  nada indique por quê. 🟡
- **Trackback continua existindo e continua sem prova.** A decisão o mantém na fila, o que
  é seguro, mas não fecha a superfície: o campo de autor de um trackback é texto arbitrário
  que chega a quem modera. 🟢
- **O status da origem é consultado a cada notificação** (`get_post_status`), uma consulta
  a mais no caminho de escrita de comentário. 🟡 Irrelevante em volume normal.

## Para um porte

Esta é a decisão mais fácil de perder, porque parece detalhe: a diferença entre pingback e
trackback **não é de formato, é de confiabilidade**. Um porte que trate os dois como "o
mesmo tipo de notificação automática" ou abre a porta que esta decisão fechou, ou volta a
cobrar aprovação manual do caso mais comum.

Se o protocolo trackback não for necessário no destino, removê-lo é a simplificação mais
limpa — e é a única coisa que o legado **não** podia fazer.
