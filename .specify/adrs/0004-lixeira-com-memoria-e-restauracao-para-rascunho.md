# ADR 0004 — Lixeira com memória, e restauração para rascunho

| | |
|---|---|
| **Status** | Vigente |
| **Decidido em** | 2.9.0 (a lixeira) · **5.6.0** (a mudança do destino da restauração) |
| **Área** | ciclo de vida de conteúdo |
| **Confiança** | 🟢 comportamento e mudança de default lidos no código |
| **Evidência** | `wp-includes/post.php:4084-4131`, `:4168-4242`, `:4295-4302`, `:4355-4368`, `:8762`; `wp-includes/comment.php:1691`, `:1755-1760`; `wp-includes/functions.php:6974-7013`; `wp-includes/default-constants.php:388` |

## Contexto

Apagar conteúdo publicado é irreversível e acontece por engano. A lixeira resolve isso,
mas cria uma pergunta que parece trivial e não é: **ao restaurar, o conteúdo volta para
onde estava?**

Voltar ao estado anterior é o que o usuário espera. Mas significa que restaurar um post
que estava `publish` o **republica imediatamente** — possivelmente num site que mudou de
dono, de política ou de contexto desde então, e sem que ninguém reveja o conteúdo.

## Decisão

Duas decisões, tomadas em momentos diferentes e que convivem:

**(a) A lixeira guarda memória.** Ao enviar para a lixeira, dois metadados são gravados
(`wp-includes/post.php:4128-4129`):

| Metadado | Conteúdo |
|---|---|
| `_wp_trash_meta_status` | o status que o conteúdo tinha |
| `_wp_trash_meta_time` | o instante, em *timestamp* |

O mesmo par existe para comentários, em `commentmeta` (`wp-includes/comment.php:1691`), e para os
comentários **de** um post há um terceiro: `_wp_trash_meta_comments_status`, um array do
estado de cada comentário (`wp-includes/post.php:4299`).

**(b) Restaurar devolve como rascunho, não ao estado anterior.** Desde a 5.6.0, o default
é `draft` — `inherit` no caso de anexo (`wp-includes/post.php:4209`). O docblock registra a mudança
textualmente:

> *"Prior to WordPress 5.6.0, restored posts were always assigned their original status."*
> (`wp-includes/post.php:4218`)

O estado anterior continua gravado e disponível: o filtro `wp_untrash_post_status` recebe
`$previous_status`, e o sistema **fornece a função pronta** para voltar ao comportamento
antigo — `wp_untrash_post_set_previous_status()` (`wp-includes/post.php:8762`). A memória não foi
removida; o default foi invertido.

Para comentário, a decisão é a **oposta**: a restauração volta ao estado gravado, e só cai
em `'0'` (fila de moderação) se o metadado estiver vazio (`wp-includes/comment.php:1755-1760`).

## Alternativas consideradas

| Alternativa | Por que não foi adotada | Conf. |
|---|---|---|
| **Manter o estado anterior como default** (comportamento até 5.6) | republica conteúdo sem revisão, no ato de um clique de "restaurar". Foi exatamente o que a 5.6 mudou | 🟢 a mudança está declarada no docblock |
| **Perguntar ao usuário** na restauração | custaria uma tela e uma decisão em massa impossível (restaurar 50 itens da lixeira) | 🟡 |
| **Não guardar o estado anterior** | tornaria a autorização impossível: `map_meta_cap()` decide se alguém pode apagar um item da lixeira **lendo** `_wp_trash_meta_status` (`wp-includes/capabilities.php:153-159`). Sem a memória, apagar da lixeira exigiria sempre a capacidade mais alta | 🟢 |
| **Lixeira como tabela separada** | exigiria DDL e duplicaria todo o modelo de metadados e taxonomia do conteúdo. Com `post_status` sendo campo livre, o estado resolve sem schema — é a aplicação de [`soul.md` D4](../soul.md) | 🟡 |

## Consequências

**Desejadas**

- Nada é republicado por acidente. 🟢
- A autorização sobre item da lixeira é correta: quem só pode apagar rascunho não apaga da
  lixeira um post que estava publicado. 🟢 `wp-includes/capabilities.php:153-159`
- O comportamento antigo é recuperável com uma linha, e o sistema a entrega pronta. 🟢
- A cascata post→comentários é reversível: os estados de todos os comentários são salvos
  em bloco e restaurados agrupados por estado. 🟢 `wp-includes/post.php:4355-4368`

**Indesejadas, e ainda pagas**

- **Assimetria entre post e comentário.** Restaurar um post publicado o traz como
  rascunho; restaurar um comentário aprovado o traz aprovado. As duas regras estão a 12
  mil linhas de distância, em arquivos diferentes, e nada as relaciona. 🟢
- **O estado pode ser perdido.** Se `_wp_trash_meta_status` estiver vazio, o comentário cai
  na fila e o post cai em rascunho — e os dois casos são silenciosos. Há ainda o ramo
  comentado como *"Confidence check. This shouldn't happen."*, que converte um
  `post-trashed` inesperado em `'0'` (`wp-includes/post.php:4363-4365`). 🟢
- **A coleta tolera inconsistência em vez de corrigi-la.** `wp_scheduled_delete()` encontra
  registros com `_wp_trash_meta_time` que não estão mais em `trash`, e apenas apaga o
  metadado órfão (`wp-includes/functions.php:6989-6994`). O estado divergente é normal, não anomalia. 🟢
- **`EMPTY_TRASH_DAYS = 0` desfaz a decisão inteira.** `wp_trash_post()` passa a chamar
  `wp_delete_post( force )` na primeira linha (`wp-includes/post.php:4085-4087`) — e, de tabela,
  `disallowed_keys` em comentário passa a mandar para `spam` em lugar de `trash`
  (`wp-includes/comment.php:1392`). Uma constante muda duas regras de produto distantes. 🟢
- **Anexo não participa.** `MEDIA_TRASH` é `false` por padrão, logo apagar mídia é
  definitivo (`wp-includes/default-constants.php:135`, `wp-includes/post.php:6829-6831`). A decisão vale para texto
  e não para arquivo, sem que nada na interface sinalize a diferença. 🟢

## Para um porte

- A memória do estado anterior **não é conveniência, é insumo de autorização**. Remova-a e
  a verificação de permissão sobre item da lixeira passa a estar errada.
- O destino da restauração é decisão de produto, não de implementação. Documente a escolha
  e seja **consistente** entre post e comentário — a assimetria do legado não tem razão
  defensável, só história.
- `EMPTY_TRASH_DAYS = 0` e `MEDIA_TRASH = false` são dois interruptores que mudam
  comportamento em três lugares. Num destino novo, valem como configuração explícita de
  política de retenção, não como constante de ambiente.
