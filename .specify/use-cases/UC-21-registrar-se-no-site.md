# UC-21 · Registrar-se no site

> Grupo: **Identidade e acesso** · Confiança: 🟢 `confirmado`
> Índice: [`use-cases.md`](use-cases.md)

## Identificação

| Campo | Valor |
|---|---|
| **Objetivo** | criar uma conta própria no site sem pedir a ninguém |
| **Ator principal** | Visitante (`visitante`, `human`) |
| **Atores secundários** | Servidor de e-mail (`servidor-de-e-mail`) |
| **Gatilho** | o visitante envia o formulário de `wp-login.php?action=register` |
| **Autorização** | a opção `users_can_register`, que nasce **desligada**. Sem ela, este caso de uso não existe na instalação |
| **Relações UML** | — nenhuma |

## Pré-condições

- `users_can_register` está ligada
- o site consegue enviar e-mail

## Fluxo principal

1. Visitante informa o login desejado e o e-mail
2. Sistema confere que o registro aberto está ligado
3. Sistema valida o tamanho do login e a unicidade de login e e-mail
4. Sistema cria a conta com o papel padrão e gera a senha
5. Sistema envia ao e-mail informado o link para definir a senha
6. Sistema informa ao visitante que a conta foi criada

## Sequência

O mesmo fluxo principal com remetente e destinatário explícitos. `self` é decisão interna do sistema.

| # | De | Para | Mensagem | Tipo | Condição ou regra |
|---|---|---|---|---|---|
| 1 | Visitante | Sistema | informa o login desejado e o e-mail | `sync` | — |
| 2 | Sistema | Sistema | confere que o registro aberto está ligado | `self` | users_can_register nasce em 0 |
| 3 | Sistema | Sistema | valida o tamanho do login e a unicidade | `self` | login até 60 caracteres; a unicidade é cobrada em código, não no banco |
| 4 | Sistema | Sistema | cria a conta com o papel padrão | `self` | default_role nasce em subscriber |
| 5 | Sistema | Servidor de e-mail | envia o link para definir a senha | `async` | — |
| 6 | Sistema | Visitante | informa que a conta foi criada | `return` | — |

```mermaid
sequenceDiagram
    autonumber
    participant Visitante as Visitante
    participant Sistema as Sistema
    participant Servidordeemail as Servidor de e-mail
    Visitante->>Sistema: informa o login desejado e o e-mail
    Sistema->>Sistema: confere que o registro aberto está ligado
    Note over Sistema: users_can_register nasce em 0
    Sistema->>Sistema: valida o tamanho do login e a unicidade
    Note over Sistema: login até 60 caracteres; a unicidade é cobrada em código, não no banco
    Sistema->>Sistema: cria a conta com o papel padrão
    Note over Sistema: default_role nasce em subscriber
    Sistema->>Servidordeemail: envia o link para definir a senha (assíncrono)
    Sistema-->>Visitante: informa que a conta foi criada
```

## Fluxos alternativos

### Instalação em rede

1. O registro não passa por aqui: percorre UC-41, que cria um cadastro **pendente** numa tabela própria
2. A conta só existe depois da ativação por chave

### Login na lista de proibidos

1. A lista é vazia por padrão e existe só como filtro, sem interface
2. Com a lista preenchida, o login é recusado

## Exceções

| O que dá errado | Como o sistema reage |
|---|---|
| Registro aberto desligado | o formulário não é oferecido e a ação é recusada |
| Login ou e-mail já em uso | erro no formulário. A verificação é feita em código: o banco permite duplicata |
| Login acima de 60 caracteres ou apelido acima de 50 | erro, não truncamento — ao contrário do resto do sistema |

## Pós-condições

- existe uma conta com o papel padrão e sem senha definida pelo titular
- há uma chave de definição de senha válida por 24 horas

## Regras de negócio aplicadas

- U1 — registro aberto é desligado por padrão e o papel de quem se registra é `subscriber` (domain.md §2.3)
- U2 — login até 60 caracteres, apelido até 50; ambos são erro, não truncamento; a unicidade é verificada em código (domain.md §2.3)
- U3 — a lista de logins proibidos é vazia por padrão e existe só como filtro, sem interface (domain.md §2.3)

## Implementado em

- `wp-login.php:1095`
- `wp-includes/user.php:3549`
- `wp-includes/user.php:2318`
- `wp-includes/user.php:2336`
- `wp-includes/user.php:2347`
- `wp-admin/includes/schema.php:416`
- `wp-admin/includes/schema.php:466`

## O que um porte precisa saber

- 🟢 **A unicidade de login e de e-mail não é do banco.** É verificada em código, e o banco aceita duplicata. Uma gravação por outro caminho — importação, SQL direto, plugin — cria duas contas com o mesmo e-mail sem que nada reclame.
- 🟢 **O assinante criado aqui não produz nada.** Tem apenas `read`. O registro aberto existe para dar identidade, e o que essa identidade faz depende de o site conceder mais capacidades por outro meio.
