# UC-44 · Consumir a API REST

> Grupo: **Integração** · Confiança: 🟢 `confirmado`
> Índice: [`use-cases.md`](use-cases.md)

## Identificação

| Campo | Valor |
|---|---|
| **Objetivo** | ler e escrever os dados do site por programa, pela superfície HTTP moderna |
| **Ator principal** | Cliente não interativo (`cliente-rest`, `system`) |
| **Atores secundários** | — nenhum |
| **Gatilho** | uma requisição chega à raiz da API |
| **Autorização** | o `permission_callback` de cada rota. O default é perigoso: rota sem callback **funciona** e só emite aviso de uso indevido. O filtro de autenticação da API antecede tudo |
| **Relações UML** | inclui [UC-23 — Autenticar chamada não interativa](UC-23-autenticar-chamada-nao-interativa.md) |

## Pré-condições

- a rota pedida está registrada
- o permalink está ligado, ou o cliente usa a forma de consulta alternativa

## Fluxo principal

1. Cliente envia a requisição à rota
2. Sistema aplica o filtro de autenticação da API, que antecede todo o despacho
3. Sistema casa o caminho e o método com uma rota registrada
4. Sistema executa o `permission_callback` da rota
5. Sistema valida e sanitiza cada parâmetro contra o esquema declarado
6. Sistema executa a função da rota
7. Sistema devolve a resposta em JSON com os campos pedidos

## Sequência

O mesmo fluxo principal com remetente e destinatário explícitos. `self` é decisão interna do sistema.

| # | De | Para | Mensagem | Tipo | Condição ou regra |
|---|---|---|---|---|---|
| 1 | Cliente não interativo | Sistema | envia a requisição à rota | `sync` | — |
| 2 | Sistema | Sistema | aplica o filtro de autenticação da API | `self` | antecede todo o despacho; um plugin pode fechar ou abrir a API inteira |
| 3 | Sistema | Sistema | casa o caminho e o método com uma rota registrada | `self` | — |
| 4 | Sistema | Sistema | executa o permission_callback da rota | `self` | rota sem callback FUNCIONA e só emite aviso |
| 5 | Sistema | Sistema | valida e sanitiza cada parâmetro contra o esquema | `self` | — |
| 6 | Sistema | Sistema | executa a função da rota | `self` | — |
| 7 | Sistema | Cliente não interativo | devolve a resposta em JSON | `return` | — |

```mermaid
sequenceDiagram
    autonumber
    participant Clientenointerativo as Cliente não interativo
    participant Sistema as Sistema
    Clientenointerativo->>Sistema: envia a requisição à rota
    Sistema->>Sistema: aplica o filtro de autenticação da API
    Note over Sistema: antecede todo o despacho; um plugin pode fechar ou abrir a API inteira
    Sistema->>Sistema: casa o caminho e o método com uma rota registrada
    Sistema->>Sistema: executa o permission_callback da rota
    Note over Sistema: rota sem callback FUNCIONA e só emite aviso
    Sistema->>Sistema: valida e sanitiza cada parâmetro contra o esquema
    Sistema->>Sistema: executa a função da rota
    Sistema-->>Clientenointerativo: devolve a resposta em JSON
```

## Fluxos alternativos

### Requisição autenticada por senha de aplicação

1. A identidade é resolvida por UC-23 antes do despacho
2. O cliente passa a ter todas as capacidades do titular

### Requisição autenticada por cookie

1. O nonce da API passa a ser exigido, porque a requisição é falsificável
2. É o caminho que o painel usa

### Descoberta da API

1. A raiz da API lista as rotas e os esquemas
2. Não exige credencial: o mapa da superfície é público

### Pedido de representação embutível

1. A rota de oEmbed devolve a representação de uma URL do site para outro site a embutir
2. É uma rota pública por desenho

## Exceções

| O que dá errado | Como o sistema reage |
|---|---|
| Rota inexistente | HTTP 404 em JSON, com a lista de rotas próximas no corpo |
| `permission_callback` recusa | HTTP 401 se não há identidade, HTTP 403 se há |
| Rota registrada sem `permission_callback` | **funciona**. Desde a 5.5.0 emite aviso de uso indevido, e o texto do aviso ensina a declarar liberação explícita para rota pública |
| Parâmetro fora do esquema | HTTP 400 com o campo e o motivo |

## Pós-condições

- o efeito da rota foi aplicado, se houver
- nenhum registro da chamada foi guardado: não há log de acesso à API
- nenhum limite de taxa foi aplicado: nenhuma superfície de entrada o tem

## Regras de negócio aplicadas

- I7 — toda rota REST deve declarar permissão explícita; a ausência emite aviso e o texto ensina a liberação explícita (domain.md §2.9)
- A camada REST falha **aberta**: rota sem callback funciona (permissions.md §8)
- O filtro de autenticação da API antecede todo o despacho (permissions.md §8)
- Nenhuma superfície de entrada tem limite de taxa (integrations.md)

## Implementado em

- `wp-includes/rest-api/class-wp-rest-server.php:285`
- `wp-includes/rest-api/class-wp-rest-server.php:1063`
- `wp-includes/rest-api/class-wp-rest-server.php:197`
- `wp-includes/rest-api.php:122`
- `wp-includes/class-wp-oembed-controller.php:35`
- `wp-includes/embed.php:325`
- `wp-includes/embed.php:561`

## O que um porte precisa saber

- 🟢 **A camada REST é a única das três camadas de autorização que falha aberta.** Capacidades sempre perguntam; a Abilities API nega sem callback; a REST **permite** sem callback, e só avisa. Num porte, essa é a inversão mais importante a não copiar.
- 🟢 **O mapa da superfície é público.** A raiz da API lista rotas e esquemas sem credencial. Para quem audita, é a melhor fonte; para quem ataca, também.
- 🟡 **Nada registra o uso da API.** Nem acesso, nem erro, nem volume. Combinado com a ausência de limite de taxa, isso significa que abuso da API é invisível neste sistema.
