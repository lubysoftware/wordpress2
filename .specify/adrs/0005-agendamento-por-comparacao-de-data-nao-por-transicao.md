# ADR 0005 — Agendamento por comparação de data, não por transição

| | |
|---|---|
| **Status** | Vigente |
| **Decidido em** | 2.3.0 (`_future_post_hook()`, `_transition_post_status()`) · 2.5.0 (`check_and_publish_future_post()`) |
| **Área** | ciclo de vida de conteúdo |
| **Confiança** | 🟢 comportamento lido no código |
| **Evidência** | `wp-includes/post.php:4797-4809`, `:5482-5504`, `:8188-8189`, `:8205-8208` |

## Contexto

Publicar com data futura é requisito básico de uma plataforma de publicação. A
implementação precisa responder a três perguntas: **quem decide** que um post está
agendado, **quem o publica** na hora, e **o que acontece** se o agendador falhar.

O contexto é hostil: o agendador do sistema só avança quando chega uma requisição HTTP
(ver [ADR 0006](0006-retencao-agendada-por-visita-ao-painel.md)), logo um evento marcado
para 3h da manhã pode rodar às 7h — ou nunca, se ninguém visitar o site.

## Decisão

**O status `future` não é escolhido: é calculado.** Em toda gravação de post que não seja
anexo, a data é comparada com o instante atual e o status é reescrito, nos dois sentidos:

```php
// post.php:4797-4809
if ( 'attachment' !== $post_type ) {
    $now = gmdate( 'Y-m-d H:i:s' );
    if ( 'publish' === $post_status ) {
        if ( strtotime( $post_date_gmt ) - strtotime( $now ) >= MINUTE_IN_SECONDS ) {
            $post_status = 'future';
        }
    } elseif ( 'future' === $post_status ) {
        if ( strtotime( $post_date_gmt ) - strtotime( $now ) < MINUTE_IN_SECONDS ) {
            $post_status = 'publish';
        }
    }
}
```

A folga é de **60 segundos**: menos de um minuto no futuro conta como agora.

Sobre esse cálculo, três mecanismos de guarda:

| Mecanismo | O que faz | Linha |
|---|---|---|
| `_future_post_hook()` | ao entrar em `future`, **limpa** o evento pendente e agenda um novo na data | `:8205-8208` |
| `_transition_post_status()` | em **qualquer** transição, limpa o evento — com o comentário *"Always clears the hook in case the post status bounced from future to draft."* | `:8188-8189` |
| `check_and_publish_future_post()` | ao ser chamada pelo cron, **reconfere**: se o status não é mais `future`, não faz nada; se a data ainda não chegou, **reagenda** em vez de publicar | `:5482-5504` |

O docblock de `check_and_publish_future_post()` declara a intenção: *"This safeguard
prevents cron from publishing drafts, etc."* (`:5475-5476`). E o código tem o comentário
*"Uh oh, someone jumped the gun!"* no ramo de reagendamento (`:5495`).

## Alternativas consideradas

| Alternativa | Por que não foi adotada | Conf. |
|---|---|---|
| **`future` como transição explícita** (o usuário escolhe "agendar") | exigiria que a interface e toda a API distinguissem "publicar" de "agendar", e que cada cliente — XML-RPC, REST, importador, plugin — fizesse a escolha certa. Calcular a partir da data faz **um só** caminho de código servir aos dois casos | 🟡 |
| **Confiar no cron sem reconferir** | o agendador é disparado por requisição e a trava expira; um evento pode rodar com o post já alterado. A reconferência é a resposta a um agendador que não é confiável | 🟢 a intenção está no docblock |
| **Publicar na leitura** (post com data passada aparece publicado, sem gravar) | tornaria `post_status` inconsistente com a realidade, e toda consulta do sistema filtra por `post_status`. Quebraria contagem, feed, sitemap e cache | 🟡 |
| **Sem folga de 60 segundos** | publicar "agora" com um relógio ligeiramente adiantado agendaria o post por alguns segundos, e o evento dependeria de uma requisição para disparar. A folga é o que faz "publicar agora" significar agora | 🟡 |
| **Fila com garantia de entrega** | fora de escopo para um produto que roda em hospedagem compartilhada sem processo persistente ([`soul.md` D7](../soul.md)) | 🟢 |

## Consequências

**Desejadas**

- Um só caminho de gravação atende publicação imediata e agendada, em todos os clientes. 🟢
- O estado nunca fica preso: alterar a data de um post agendado para o passado o publica na
  própria gravação, sem esperar cron. 🟢
- O cron não pode publicar o que não devia. Três guardas independentes garantem isso. 🟢
- Um post agendado cuja data passou enquanto o site estava sem tráfego é publicado na
  **primeira** gravação subsequente, mesmo que o evento nunca tenha disparado. 🟡

**Indesejadas, e ainda pagas**

- **A publicação atrasa.** Se nenhuma requisição chega na hora marcada, o post sai quando
  chegar a primeira. Num site de pouco tráfego, "publicado às 8h" pode significar 11h. 🟢
- **O comportamento surpreende quem automatiza.** Gravar um post publicado com
  `post_date` no futuro — por importação, por sincronização, por script — **agenda** o
  post em vez de publicá-lo, sem erro e sem aviso. É a causa clássica de "importei e o
  conteúdo não apareceu". 🟡
- **Anexo é exceção silenciosa.** O bloco inteiro é contornado para `post_type =
  'attachment'` (`:4797`), porque o status do anexo tem outro ciclo
  ([`state-machines.md`](../state-machines.md) §3). Quem generalizar a regra para todos os
  tipos muda o comportamento da mídia. 🟢
- **A folga de 60 segundos é mágica não configurável.** `MINUTE_IN_SECONDS` aparece
  literal, sem filtro e sem constante própria. 🟢

## Para um porte

- **Não reimplemente `future` como transição.** Parece mais limpo e muda o comportamento
  do produto em todos os clientes de escrita.
- Mantenha as três guardas. Elas existem porque o agendador falha, e nenhum agendador
  deixa de falhar só por ser melhor.
- Se o destino tiver agendador confiável — fila, *cron* de sistema, serviço gerenciado —
  o atraso desaparece e a reconferência deixa de ser necessária para corretude. Ela
  continua valendo como defesa: é barata e cobre edição concorrente.
- A folga de 60 segundos é a única parte que vale explicitar como configuração.
