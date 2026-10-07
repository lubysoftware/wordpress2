# UC-19 · Entrar no sistema

> Grupo: **Identidade e acesso** · Confiança: 🟢 `confirmado`
> Índice: [`use-cases.md`](use-cases.md)

## Identificação

| Campo | Valor |
|---|---|
| **Objetivo** | provar quem sou e passar a agir no site como essa pessoa |
| **Ator principal** | Assinante (`assinante`, `human`) |
| **Atores secundários** | — nenhum |
| **Gatilho** | o formulário de `wp-login.php` é enviado |
| **Autorização** | login e senha conferidos contra o hash guardado. Nenhuma capacidade é exigida para entrar: o papel decide o que a pessoa faz depois, não se ela entra |
| **Relações UML** | — nenhuma |

## Pré-condições

- a conta existe e não está marcada como spam na rede
- os cookies do navegador funcionam

## Fluxo principal

1. Assinante envia login e senha
2. Sistema percorre a cadeia de autenticação e confere a senha contra o hash guardado
3. Sistema cria um token de sessão e grava os cookies de autenticação
4. Sistema apaga a chave de redefinição de senha, se havia uma pendente
5. Sistema redireciona para o destino pedido ou para o painel

## Sequência

O mesmo fluxo principal com remetente e destinatário explícitos. `self` é decisão interna do sistema.

| # | De | Para | Mensagem | Tipo | Condição ou regra |
|---|---|---|---|---|---|
| 1 | Assinante | Sistema | envia login e senha | `sync` | — |
| 2 | Sistema | Sistema | percorre a cadeia de autenticação e confere a senha | `self` | a cadeia é filtrável: um plugin pode trocar o critério inteiro |
| 3 | Sistema | Assinante | grava os cookies de autenticação | `async` | sessão de 2 dias; com lembrar de mim, 14, e 12 h de carência |
| 4 | Sistema | Sistema | apaga a chave de redefinição pendente | `self` | — |
| 5 | Sistema | Assinante | redireciona para o painel ou para o destino pedido | `return` | — |

```mermaid
sequenceDiagram
    autonumber
    participant Assinante as Assinante
    participant Sistema as Sistema
    Assinante->>Sistema: envia login e senha
    Sistema->>Sistema: percorre a cadeia de autenticação e confere a senha
    Note over Sistema: a cadeia é filtrável: um plugin pode trocar o critério inteiro
    Sistema->>Assinante: grava os cookies de autenticação (assíncrono)
    Note over Sistema,Assinante: sessão de 2 dias; com lembrar de mim, 14, e 12 h de carência
    Sistema->>Sistema: apaga a chave de redefinição pendente
    Sistema-->>Assinante: redireciona para o painel ou para o destino pedido
```

## Fluxos alternativos

### "Lembrar de mim" marcado

1. O cookie passa a valer 14 dias em lugar de ser de sessão
2. O token ainda expira: sem "lembrar", o cookie é de sessão mas o token dura 2 dias

### Sair do sistema

1. Sistema destrói o token da sessão e limpa os cookies
2. As demais sessões da mesma conta continuam válidas

### Login por e-mail em lugar do login

1. A cadeia de autenticação inclui a tentativa por endereço de e-mail
2. Os dois caminhos chegam ao mesmo registro

## Exceções

| O que dá errado | Como o sistema reage |
|---|---|
| Senha errada | mensagem de erro no formulário. Não há contador de tentativas nem bloqueio de conta no núcleo: a proteção contra força bruta é de plugin |
| Conta inexistente | mensagem de erro distinta da de senha errada, o que confirma a existência do login |
| Site da rede marcado como spam | a verificação de rede recusa antes do formulário |

## Pós-condições

- há um token de sessão novo gravado no metadado da conta
- os cookies de autenticação estão no navegador
- nenhuma chave de redefinição de senha continua válida

## Regras de negócio aplicadas

- U4 — a chave de reset de senha vale 24 horas e é apagada no primeiro login bem-sucedido (domain.md §2.3)
- U5 — sessão dura 2 dias; "lembrar de mim", 14 — com 12 horas de carência (domain.md §2.3)
- A capacidade é a unidade real de autorização; o papel é só um atalho (permissions.md §1)

## Implementado em

- `wp-login.php:476`
- `wp-login.php:1278`
- `wp-login.php:794`
- `wp-includes/user.php:41`
- `wp-includes/user.php:153`
- `wp-includes/user.php:117`
- `wp-includes/pluggable.php:1082`
- `wp-includes/pluggable.php:1088`
- `wp-includes/pluggable.php:1091`

## O que um porte precisa saber

- 🟢 **Não há defesa contra força bruta no núcleo.** Nenhum contador de tentativa, nenhum atraso progressivo, nenhum bloqueio. Num porte, isso é requisito a acrescentar, não comportamento a preservar.
- 🟢 **O prazo do cookie e o prazo do token são coisas diferentes.** Sem "lembrar de mim" o cookie é de sessão, mas o token no servidor ainda vale 2 dias: fechar o navegador não encerra a sessão do lado do servidor.
- 🟡 **A cadeia de autenticação é inteiramente filtrável.** Qualquer plugin pode substituir o critério de quem entra. Toda garantia deste caso vale para a árvore sem plugins.
