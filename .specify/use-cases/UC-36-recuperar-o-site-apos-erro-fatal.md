# UC-36 · Recuperar o site após erro fatal

> Grupo: **Operação do software** · Confiança: 🟢 `confirmado`
> Índice: [`use-cases.md`](use-cases.md)

## Identificação

| Campo | Valor |
|---|---|
| **Objetivo** | voltar a administrar um site derrubado por plugin ou tema defeituoso, sem que o visitante veja a obra |
| **Ator principal** | Administrador (`administrador`, `human`) |
| **Atores secundários** | Servidor de e-mail (`servidor-de-e-mail`) · Agendador (`agendador`) |
| **Gatilho** | um erro fatal atribuível a plugin ou tema acontece num endpoint protegido |
| **Autorização** | a chave de recuperação enviada ao e-mail do administrador do site. A chave é **consumida antes de ser verificada**. Retomar as extensões exige `resume_plugins` ou `resume_themes`, que não estão em papel algum |
| **Relações UML** | — nenhuma |

## Pré-condições

- o erro aconteceu em endpoint protegido
- a extensão culpada não é um plugin de rede
- o site consegue enviar e-mail

## Fluxo principal

1. Sistema captura o erro fatal e identifica a extensão culpada
2. Sistema gera uma chave de recuperação e a guarda
3. Sistema envia ao administrador do site o link de recuperação
4. Administrador abre o link
5. Sistema remove a chave e só então a verifica
6. Sistema grava o cookie de sessão de recuperação, válido por uma semana
7. Administrador administra o site com a extensão pausada **só para ele**, e sai da recuperação ao terminar

## Sequência

O mesmo fluxo principal com remetente e destinatário explícitos. `self` é decisão interna do sistema.

| # | De | Para | Mensagem | Tipo | Condição ou regra |
|---|---|---|---|---|---|
| 1 | Sistema | Sistema | captura o erro fatal e identifica a extensão culpada | `self` | só em endpoint protegido; plugin de rede é fora de escopo |
| 2 | Sistema | Sistema | gera a chave de recuperação e a guarda | `self` | — |
| 3 | Sistema | Servidor de e-mail | envia o link de recuperação | `async` | um e-mail por dia por sessão; o marcador é gravado ANTES do envio |
| 4 | Administrador | Sistema | abre o link de recuperação | `sync` | — |
| 5 | Sistema | Sistema | remove a chave e só então a verifica | `self` | um clique duplo falha; força bruta fica impossível sem contador |
| 6 | Sistema | Administrador | grava o cookie de sessão de recuperação | `async` | vale uma semana |
| 7 | Administrador | Sistema | conserta e sai da recuperação | `sync` | sair retoma TODAS as extensões pausadas de uma vez |

```mermaid
sequenceDiagram
    autonumber
    participant Sistema as Sistema
    participant Servidordeemail as Servidor de e-mail
    participant Administrador as Administrador
    Sistema->>Sistema: captura o erro fatal e identifica a extensão culpada
    Note over Sistema: só em endpoint protegido; plugin de rede é fora de escopo
    Sistema->>Sistema: gera a chave de recuperação e a guarda
    Sistema->>Servidordeemail: envia o link de recuperação (assíncrono)
    Note over Sistema,Servidordeemail: um e-mail por dia por sessão; o marcador é gravado ANTES do envio
    Administrador->>Sistema: abre o link de recuperação
    Sistema->>Sistema: remove a chave e só então a verifica
    Note over Sistema: um clique duplo falha; força bruta fica impossível sem contador
    Sistema->>Administrador: grava o cookie de sessão de recuperação (assíncrono)
    Note over Sistema,Administrador: vale uma semana
    Administrador->>Sistema: conserta e sai da recuperação
    Note over Administrador,Sistema: sair retoma TODAS as extensões pausadas de uma vez
```

## Fluxos alternativos

### Outro erro fatal durante a sessão

1. O erro é armazenado e a requisição redireciona, para capturar vários erros numa passagem
2. A sessão continua ativa

### A chave vence antes de ser usada

1. O evento diário de limpeza de chaves vencidas a remove
2. O estado volta a inativo e um erro novo gera chave nova

### Um arquivo substituto assume o tratamento de erro

1. Um arquivo em `wp-content/` pode substituir o tratador de erro fatal inteiro
2. Nesse caso nada deste fluxo acontece

## Exceções

| O que dá errado | Como o sistema reage |
|---|---|
| O erro aconteceu em endpoint público | a recuperação não é acionada: só endpoint protegido a dispara |
| A culpa é de um plugin de rede | explicitamente fora de escopo |
| O marcador de e-mail não pôde ser gravado | o aviso é abortado. A gravação vem antes do envio, logo falhar em gravar significa não avisar |
| Ninguém tem `resume_plugins` | a capacidade não está em papel algum: entra por filtro de prioridade 1 para quem tem `activate_plugins`. Quem migrar pela matriz produz um sistema em que **ninguém** retoma |

## Pós-condições

- a extensão defeituosa está pausada apenas para a sessão de recuperação
- o visitante continua vendo o site como estava
- ao sair, todas as extensões pausadas foram retomadas e o limite de e-mail foi zerado

## Regras de negócio aplicadas

- A10 — modo de recuperação dura uma semana e avisa uma vez por dia; o marcador é gravado antes do envio (domain.md §2.6)
- A11 — erro em endpoint público não aciona recuperação, e plugin de rede é fora de escopo (domain.md §2.6)
- A12 — sair do modo de recuperação retoma todas as extensões pausadas de uma vez (domain.md §2.6)
- O escopo da pausa é a sessão, não o site: é isso que torna o modo usável em produção (state-machines.md §9)
- [ADR 0007](../adrs/0007-chave-consumida-antes-de-validar.md) — chave consumida antes de validar

## Implementado em

- `wp-includes/class-wp-recovery-mode.php:92`
- `wp-includes/class-wp-recovery-mode.php:128`
- `wp-includes/class-wp-recovery-mode.php:168`
- `wp-includes/class-wp-recovery-mode.php:206`
- `wp-includes/class-wp-recovery-mode.php:261`
- `wp-includes/class-wp-recovery-mode.php:307`
- `wp-includes/class-wp-recovery-mode-key-service.php:91`
- `wp-includes/class-wp-recovery-mode-cookie-service.php:46`
- `wp-includes/class-wp-recovery-mode-email-service.php:53`
- `wp-includes/class-wp-paused-extensions-storage.php:215`
- `wp-includes/capabilities.php:1325`
- `wp-login.php:78`

## O que um porte precisa saber

- 🟢 **A pausa vale para a sessão, não para o site.** O nome da opção que guarda as extensões pausadas carrega o identificador da sessão. É o que permite consertar um site em produção sem que o visitante veja a diferença — e o detalhe que mais facilmente se perde num porte.
- 🟢 **A chave é consumida antes de ser verificada.** Força bruta fica impossível sem contador de tentativas, ao custo de um clique duplo invalidar o link. Decisão deliberada, registrada no [ADR 0007](../adrs/0007-chave-consumida-antes-de-validar.md).
- 🔴 **Não foi possível determinar quem retoma a extensão pausada.** `resume_plugins` e `resume_themes` não estão em papel algum: entram por filtro. Uma migração pela matriz de papéis produz um sistema em que ninguém sai do modo de recuperação.
