# UC-35 · Atualizar o núcleo automaticamente

> Grupo: **Operação do software** · Confiança: 🟢 `confirmado`
> Índice: [`use-cases.md`](use-cases.md)

## Identificação

| Campo | Valor |
|---|---|
| **Objetivo** | manter o sistema na versão corrente sem ninguém precisar decidir |
| **Ator principal** | Agendador (`agendador`, `time`) |
| **Atores secundários** | API do WordPress.org (`api-wordpress-org`) · Servidor de e-mail (`servidor-de-e-mail`) · Administrador (`administrador`) |
| **Gatilho** | o evento de atualização automática vence e alguma requisição HTTP faz a fila avançar |
| **Autorização** | nenhuma capacidade: não há usuário. Os portões são a política (constante, opções e filtros), a escrita no webroot e a compatibilidade do ambiente |
| **Relações UML** | estende [UC-39 — Processar a fila agendada](UC-39-processar-a-fila-agendada.md) |

## Pré-condições

- não há registro de falha crítica
- há credenciais de escrita e o diretório não é um checkout de controle de versão
- PHP e banco atendem ao mínimo da versão oferecida

## Fluxo principal

1. Agendador aciona o evento de atualização automática
2. Sistema consulta o serviço de versões
3. Sistema aplica a política: constante vence opção, e `false` desliga tudo
4. Sistema confere escrita no webroot e ausência de controle de versão
5. Sistema confere a compatibilidade de PHP e banco
6. Sistema consulta o registro de falha e decide se tenta esta versão
7. Sistema executa a atualização e apaga o registro de falha

## Sequência

O mesmo fluxo principal com remetente e destinatário explícitos. `self` é decisão interna do sistema.

| # | De | Para | Mensagem | Tipo | Condição ou regra |
|---|---|---|---|---|---|
| 1 | Agendador | Sistema | aciona o evento de atualização automática | `async` | — |
| 2 | Sistema | API do WordPress.org | consulta as versões disponíveis | `sync` | — |
| 3 | Sistema | Sistema | aplica a política de atualização | `self` | minor e desenvolvimento por padrão; major só com escolha explícita |
| 4 | Sistema | Sistema | confere escrita no webroot e ausência de controle de versão | `self` | falha aqui gera e-mail |
| 5 | Sistema | Sistema | confere a compatibilidade de PHP e banco | `self` | falha aqui cancela EM SILÊNCIO |
| 6 | Sistema | Sistema | consulta o registro de falha e decide se tenta | `self` | — |
| 7 | Sistema | Sistema | executa a atualização e apaga o registro de falha | `self` | — |

```mermaid
sequenceDiagram
    autonumber
    participant Agendador as Agendador
    participant Sistema as Sistema
    participant APIdoWordPressorg as API do WordPress.org
    Agendador->>Sistema: aciona o evento de atualização automática (assíncrono)
    Sistema->>APIdoWordPressorg: consulta as versões disponíveis
    Sistema->>Sistema: aplica a política de atualização
    Note over Sistema: minor e desenvolvimento por padrão; major só com escolha explícita
    Sistema->>Sistema: confere escrita no webroot e ausência de controle de versão
    Note over Sistema: falha aqui gera e-mail
    Sistema->>Sistema: confere a compatibilidade de PHP e banco
    Note over Sistema: falha aqui cancela EM SILÊNCIO
    Sistema->>Sistema: consulta o registro de falha e decide se tenta
    Sistema->>Sistema: executa a atualização e apaga o registro de falha
```

## Fluxos alternativos

### Falha transitória

1. Erro de download, de arquivo ou de trava reagenda **uma** tentativa em uma hora
2. Não notifica ninguém: só a segunda falha manda e-mail

### Falha gravosa

1. O mesmo par versão-origem não é repetido
2. O sistema volta a tentar quando outra versão for oferecida

### Falha crítica

1. Disco cheio, erro de cópia ou reversão que também falhou gravam o registro como crítico
2. A partir daí a atualização automática recusa tudo até uma atualização manual bem-sucedida — ver UC-34

## Exceções

| O que dá errado | Como o sistema reage |
|---|---|
| Ambiente incompatível | cancela **em silêncio**. Um site parado numa versão antiga por PHP velho não avisa ninguém |
| Política não permite | cancela e avisa por e-mail |
| Sem credencial de escrita ou diretório sob controle de versão | cancela e, no caso do núcleo, avisa por e-mail |
| O mesmo aviso já foi enviado | o envio é cancelado: o registro guarda e-mail, versão e tipo, e a dupla repetida não se repete |

## Pós-condições

- o sistema está na versão nova, ou há um registro de falha com severidade
- um e-mail foi enviado, ou não — e a diferença depende de qual portão barrou
- nenhuma verificação de autenticidade do pacote foi feita

## Regras de negócio aplicadas

- A1 — atualização automática exige escrita no webroot e ausência de controle de versão (domain.md §2.6)
- A2 — minor e desenvolvimento por padrão; major só com escolha explícita (domain.md §2.6)
- A3 — a constante vence a opção, e `false` desliga tudo, mas a decisão ainda pode ser revertida por filtro (domain.md §2.6)
- A5 — falha crítica congela a atualização automática até intervenção humana (domain.md §2.6)
- A6 — falha transitória tem exatamente uma segunda chance, em uma hora, e não notifica (domain.md §2.6)
- A7 — o mesmo aviso não é repetido (domain.md §2.6)
- [ADR 0008](../adrs/0008-falha-critica-de-atualizacao-exige-intervencao-humana.md) — falha crítica de atualização exige intervenção humana

## Implementado em

- `wp-admin/includes/class-wp-automatic-updater.php:195`
- `wp-admin/includes/class-wp-automatic-updater.php:210`
- `wp-admin/includes/class-wp-automatic-updater.php:235`
- `wp-admin/includes/class-wp-automatic-updater.php:268`
- `wp-admin/includes/class-wp-automatic-updater.php:278`
- `wp-admin/includes/class-wp-automatic-updater.php:815`
- `wp-admin/includes/class-wp-automatic-updater.php:854`
- `wp-admin/includes/class-wp-automatic-updater.php:861`
- `wp-admin/includes/class-core-upgrader.php:288`
- `wp-admin/includes/class-core-upgrader.php:293`
- `wp-admin/includes/class-core-upgrader.php:326`
- `wp-admin/includes/class-core-upgrader.php:341`

## O que um porte precisa saber

- 🟢 **A assimetria dos avisos é o achado.** Falha de permissão e de política geram e-mail; incompatibilidade de ambiente não gera nada. O site que mais precisa de atenção — parado numa versão antiga por PHP velho — é justamente o que fica calado.
- 🟢 **O único histórico persistente de falha do sistema é uma opção.** `auto_core_update_failed` guarda tentativa, versão, código e instante. Não há log, não há tabela: é a única memória de operação que este sistema tem.
- 🟢 **Este é o caso de uso mais consequente do sistema** — decide se o site se atualiza sozinho — e é o que roda sem usuário, sem log e sem teste.
