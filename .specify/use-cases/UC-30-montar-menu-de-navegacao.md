# UC-30 · Montar menu de navegação

> Grupo: **Apresentação** · Confiança: 🟢 `confirmado`
> Índice: [`use-cases.md`](use-cases.md)

## Identificação

| Campo | Valor |
|---|---|
| **Objetivo** | definir os caminhos que o visitante vê para se mover pelo site |
| **Ator principal** | Administrador (`administrador`, `human`) |
| **Atores secundários** | — nenhum |
| **Gatilho** | o administrador abre a tela de menus do painel |
| **Autorização** | `edit_theme_options` — a mesma do Customizer. Não há capacidade própria de menu |
| **Relações UML** | — nenhuma |

## Pré-condições

- o ator tem `edit_theme_options`
- o tema declara ao menos uma posição de menu, ou o menu é usado por bloco

## Fluxo principal

1. Administrador cria o menu ou abre um existente
2. Sistema verifica `edit_theme_options`
3. Administrador acrescenta itens apontando para conteúdos, termos ou URLs externas
4. Sistema confere o nonce de cada operação
5. Sistema grava cada item como um conteúdo de tipo próprio, dentro da taxonomia do menu
6. Administrador associa o menu a uma posição do tema
7. Sistema grava a associação de posições como opção do tema

## Sequência

O mesmo fluxo principal com remetente e destinatário explícitos. `self` é decisão interna do sistema.

| # | De | Para | Mensagem | Tipo | Condição ou regra |
|---|---|---|---|---|---|
| 1 | Administrador | Sistema | cria o menu ou abre um existente | `sync` | — |
| 2 | Sistema | Sistema | verifica edit_theme_options | `self` | — |
| 3 | Administrador | Sistema | acrescenta itens ao menu | `sync` | — |
| 4 | Sistema | Sistema | confere o nonce da operação | `self` | — |
| 5 | Sistema | Sistema | grava cada item como conteúdo dentro da taxonomia do menu | `self` | o menu é uma taxonomia; cada item é um Post |
| 6 | Administrador | Sistema | associa o menu a uma posição do tema | `sync` | — |
| 7 | Sistema | Sistema | grava a associação de posições como opção do tema | `self` | — |

```mermaid
sequenceDiagram
    autonumber
    participant Administrador as Administrador
    participant Sistema as Sistema
    Administrador->>Sistema: cria o menu ou abre um existente
    Sistema->>Sistema: verifica edit_theme_options
    Administrador->>Sistema: acrescenta itens ao menu
    Sistema->>Sistema: confere o nonce da operação
    Sistema->>Sistema: grava cada item como conteúdo dentro da taxonomia do menu
    Note over Sistema: o menu é uma taxonomia; cada item é um Post
    Administrador->>Sistema: associa o menu a uma posição do tema
    Sistema->>Sistema: grava a associação de posições como opção do tema
```

## Fluxos alternativos

### Montar o menu pelo Customizer

1. A mesma estrutura é editada dentro do conjunto de alterações
2. A tela de menus oferece o atalho quando o ator tem `customize`

### Menu como bloco de navegação

1. O bloco de navegação renderiza a mesma taxonomia
2. O lado cliente do editor não está nesta árvore

## Exceções

| O que dá errado | Como o sistema reage |
|---|---|
| Item aponta para conteúdo apagado | o item permanece no menu e aponta para o nada. Nenhuma rotina limpa itens órfãos |
| Nonce vencido | a operação é recusada e a tela recarrega |

## Pós-condições

- o menu existe como termo e seus itens como conteúdos
- a associação entre menus e posições do tema está gravada em opção

## Regras de negócio aplicadas

- Glossário — um menu de navegação é uma taxonomia e cada item do menu é um Post (domain.md §1.2)
- `edit_theme_options` libera menus, widgets e Customizer, e é exclusiva de administrador (permissions.md §3.4)

## Implementado em

- `wp-admin/nav-menus.php:23`
- `wp-admin/nav-menus.php:65`
- `wp-admin/nav-menus.php:370`
- `wp-admin/nav-menus.php:527`
- `wp-includes/nav-menu.php:418`

## O que um porte precisa saber

- 🟢 **O menu é a estrutura mais contraintuitiva do domínio.** O menu é um termo de taxonomia, cada item é um registro de conteúdo, e a ligação com o tema é uma opção. Três mecanismos diferentes para uma coisa que parece uma lista. Quem migrar modelando uma tabela de menu precisa reconstruir as três.
- 🟡 **Itens órfãos acumulam em silêncio.** Apagar o conteúdo apontado não apaga o item do menu, e nada avisa que o caminho não leva a lugar algum.
