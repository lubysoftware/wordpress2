# UC-41 · Cadastrar-se na rede

> Grupo: **Rede** · Confiança: 🟢 `confirmado`
> Índice: [`use-cases.md`](use-cases.md)

## Identificação

| Campo | Valor |
|---|---|
| **Objetivo** | pedir uma conta, ou um site próprio, numa instalação em rede |
| **Ator principal** | Visitante (`visitante`, `human`) |
| **Atores secundários** | Servidor de e-mail (`servidor-de-e-mail`) |
| **Gatilho** | o visitante envia o formulário de `wp-signup.php` |
| **Autorização** | a opção de rede que diz que tipo de cadastro está aberto — conta, site, os dois ou nada. Nenhuma capacidade é verificada |
| **Relações UML** | — nenhuma |

## Pré-condições

- a instalação é multisite
- a opção de rede permite o tipo de cadastro pedido

## Fluxo principal

1. Visitante informa o nome de usuário e o e-mail
2. Sistema valida o nome entre 4 e 60 caracteres e fora da lista de nomes proibidos
3. Sistema valida o domínio do e-mail contra as listas de permitidos e banidos da rede
4. Sistema apaga o cadastro pendente anterior do mesmo nome ou e-mail, se ele tiver mais de dois dias
5. Sistema grava o cadastro **pendente** numa tabela própria, com uma chave de ativação
6. Sistema envia ao e-mail informado o link de ativação
7. Sistema informa que falta ativar

## Sequência

O mesmo fluxo principal com remetente e destinatário explícitos. `self` é decisão interna do sistema.

| # | De | Para | Mensagem | Tipo | Condição ou regra |
|---|---|---|---|---|---|
| 1 | Visitante | Sistema | informa o nome de usuário e o e-mail | `sync` | — |
| 2 | Sistema | Sistema | valida o nome entre 4 e 60 caracteres e a lista de proibidos | `self` | www, web, root, admin, main, invite, administrator |
| 3 | Sistema | Sistema | valida o domínio do e-mail contra as listas da rede | `self` | — |
| 4 | Sistema | Sistema | apaga o cadastro pendente anterior com mais de dois dias | `self` | o cadastro reserva o nome por 2 dias; depois, perde para quem pedir |
| 5 | Sistema | Sistema | grava o cadastro pendente com a chave de ativação | `self` | tabela própria: ainda não é usuário |
| 6 | Sistema | Servidor de e-mail | envia o link de ativação | `async` | — |
| 7 | Sistema | Visitante | informa que falta ativar | `return` | — |

```mermaid
sequenceDiagram
    autonumber
    participant Visitante as Visitante
    participant Sistema as Sistema
    participant Servidordeemail as Servidor de e-mail
    Visitante->>Sistema: informa o nome de usuário e o e-mail
    Sistema->>Sistema: valida o nome entre 4 e 60 caracteres e a lista de proibidos
    Note over Sistema: www, web, root, admin, main, invite, administrator
    Sistema->>Sistema: valida o domínio do e-mail contra as listas da rede
    Sistema->>Sistema: apaga o cadastro pendente anterior com mais de dois dias
    Note over Sistema: o cadastro reserva o nome por 2 dias; depois, perde para quem pedir
    Sistema->>Sistema: grava o cadastro pendente com a chave de ativação
    Note over Sistema: tabela própria: ainda não é usuário
    Sistema->>Servidordeemail: envia o link de ativação (assíncrono)
    Sistema-->>Visitante: informa que falta ativar
```

## Fluxos alternativos

### Cadastro de site junto com a conta

1. Sistema valida também o nome do site, com mínimo de 4 caracteres e a mesma lista de proibidos, somada aos nomes reservados de subdiretório
2. Um cadastro de site pendente é gravado com o mesmo mecanismo de chave

### Quem já tem conta pede um site

1. O formulário passa direto para a parte de site
2. A identidade já existe: `wp_users` é global à rede

## Exceções

| O que dá errado | Como o sistema reage |
|---|---|
| A opção de rede não permite cadastro | o formulário informa que o registro está fechado |
| Nome ou e-mail já em uso por cadastro pendente com menos de dois dias | recusado: o cadastro anterior reserva o nome |
| Domínio de e-mail banido na rede | recusado antes de gravar |

## Pós-condições

- existe uma linha de cadastro pendente com o e-mail do interessado e a chave de ativação
- nenhuma conta foi criada
- o nome está reservado por dois dias

## Regras de negócio aplicadas

- U7 — em multisite, cadastro pendente reserva o nome por 2 dias; passado o prazo, o cadastro anterior é apagado e o novo prossegue (domain.md §2.3)
- U8 — o domínio do e-mail pode ser restringido ou banido na rede (domain.md §2.3)
- N5 — nome de site exige no mínimo 4 caracteres e herda a lista de nomes proibidos (domain.md §2.8)
- Glossário — Signup é cadastro pendente numa tabela própria, que só se torna usuário ao ser ativado por chave (domain.md §1.7)

## Implementado em

- `wp-signup.php:260`
- `wp-signup.php:332`
- `wp-signup.php:451`
- `wp-signup.php:679`
- `wp-signup.php:695`
- `wp-signup.php:849`
- `wp-signup.php:936`
- `wp-includes/ms-functions.php:488`
- `wp-includes/ms-functions.php:513`
- `wp-includes/ms-functions.php:525`
- `wp-includes/ms-functions.php:560`
- `wp-includes/ms-functions.php:648`
- `wp-includes/ms-functions.php:868`

## O que um porte precisa saber

- 🟢 **"Expirar" não é estado: é efeito colateral.** Um cadastro pendente de dois dias não muda de estado nem é removido por rotina. Ele é apagado no instante em que **outra pessoa** tenta usar o mesmo nome ou e-mail. Um cadastro que ninguém disputa permanece para sempre — e, com ele, o e-mail do interessado.
- 🟢 **A tabela de cadastro não tem política de retenção.** Guarda e-mail e instante indefinidamente, inclusive depois da ativação, e apagar o site não a toca.
- 🔴 **Não foi possível determinar se este caso de uso existe nesta instalação.** Depende de a instalação ser multisite, o que não é determinável sem `wp-config.php`.
