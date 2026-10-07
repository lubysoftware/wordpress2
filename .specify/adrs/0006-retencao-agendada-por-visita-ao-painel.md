# ADR 0006 — Retenção agendada por visita ao painel

| | |
|---|---|
| **Status** | Vigente |
| **Decidido em** | 2.9.0 (`wp_scheduled_delete`, com a lixeira) · a coleta de auto-draft é posterior |
| **Área** | retenção de dados |
| **Confiança** | 🟢 comportamento lido no código |
| **Evidência** | `wp-admin/admin.php:104-114`; `wp-admin/includes/post.php:798-799`; `wp-includes/functions.php:6974-7013`, `:8556-8574`; `wp-includes/post.php:8373-8377`; `wp-includes/cron.php:915-924`, `:1051` |

## Contexto

Quatro coisas precisam ser apagadas com o tempo: conteúdo na lixeira (30 dias),
auto-drafts (7 dias), transientes vencidos, e arquivos de exportação de dados pessoais
(3 dias). O sistema roda em hospedagem compartilhada, sem processo persistente e, em
muitos casos, **sem acesso ao cron do sistema operacional** — a premissa que
[`soul.md` D7](../soul.md) registra como fundadora.

O agendador do produto resolve isso disparando a fila a partir de requisições HTTP. Resta
decidir **onde o evento recorrente é registrado**.

## Decisão

Cada rotina de retenção é registrada no **ponto do código que a torna relevante**, não
num lugar central de inicialização:

| Evento | Registrado em | Alcançado quando |
|---|---|---|
| `wp_scheduled_delete` (lixeira) | `wp-admin/admin.php:107-109` | alguém **autenticado** abre o painel |
| `delete_expired_transients` | `wp-admin/admin.php:112-114` | idem |
| `wp_scheduled_auto_draft_delete` | `wp-admin/includes/post.php:798-799` | alguém abre a tela de **novo conteúdo** |
| `wp_privacy_delete_old_export_files` | `wp-includes/functions.php:8550-8558` | **sempre**: `wp_schedule_delete_old_privacy_export_files()` está ligada a `init` (`wp-includes/default-filters.php:459`) |
| `wp_privacy_personal_data_cleanup_requests` | `wp-includes/functions.php:8568-8576` | **sempre**, ligada a `init` (`wp-includes/default-filters.php:461`) — e isto é novo: `@since 7.1.0` |
| `wp_version_check`, `wp_update_plugins`, `wp_update_themes` | `wp-includes/update.php:1089-1101` | sempre, via `wp_schedule_update_checks()` |

O ponto decisivo é que as duas primeiras ficam em `wp-admin/admin.php` **depois** de
`auth_redirect()` (`:104`). Não basta o site receber tráfego: é preciso que alguém **faça
login e abra o painel** ao menos uma vez para que a coleta da lixeira passe a existir.

A execução, quando existe, é direta e tolerante: 🟢 `wp-includes/functions.php:6974-7013`

```sql
SELECT post_id FROM wp_postmeta
 WHERE meta_key = '_wp_trash_meta_time' AND meta_value < <agora - 30 dias>
```

— e, se o registro encontrado não estiver mais em `trash`, a rotina apaga só o metadado
órfão e segue (`:6989-6994`).

## Alternativas consideradas

| Alternativa | Por que não foi adotada | Conf. |
|---|---|---|
| **Registrar tudo na inicialização** (`wp-settings.php`) | custaria, em **toda** requisição pública, uma verificação `wp_next_scheduled()` por evento. É consulta ao array de cron, que é uma opção — barato, mas não grátis, e o sistema é obsessivo com o custo do caminho público | 🟡 |
| **Depender do cron do sistema operacional** | contraria frontalmente o objetivo declarado do produto: funcionar numa hospedagem onde o dono não administra o servidor ([`soul.md` §1](../soul.md)) | 🟢 |
| **Apagar na leitura** (quem lê um item vencido o apaga) | não funciona para o que ninguém lê, que é justamente o caso da lixeira e do auto-draft | 🟡 |
| **Rotina de instalação registra tudo** | é o que faria sentido, e explicaria por que ninguém notou o problema: num site que **foi instalado pelo navegador**, o instalador termina no painel, e o painel registra os eventos. O caso descoberto é o de instalações que nunca passam por lá | 🟡 |

## Consequências

**Desejadas**

- Nenhum custo no caminho público para eventos que só interessam a quem administra. 🟡
- Nenhuma dependência de infraestrutura fora do produto. 🟢
- A coleta é idempotente e tolerante a estado inconsistente: pode rodar a qualquer hora,
  quantas vezes for. 🟢

**Indesejadas, e ainda pagas**

- **Um site que ninguém administra nunca agenda a própria limpeza.** 🟢 É a consequência
  central, e ela é verificável: sem uma visita autenticada ao painel, `wp_scheduled_delete`
  e `delete_expired_transients` nunca entram na fila. Conteúdo na lixeira e transientes
  vencidos **acumulam indefinidamente** — e transientes vencidos são linhas em
  `wp_options`, a tabela lida em toda requisição.
- **A coleta de auto-draft depende de alguém abrir a tela de novo conteúdo.** Um site onde
  todo o conteúdo entra por API ou importação nunca a agenda. 🟢
- **A retenção é "no mínimo", nunca "no máximo".** 30 dias é o piso: o item fica até a
  primeira execução depois disso. Para um compromisso de retenção — LGPD, política de
  dados — isso **não é uma garantia**. 🟢
- **A hora real é imprevisível.** O evento é diário a partir do instante em que foi
  registrado, e só avança quando chega requisição; a trava é um transiente de 60 segundos
  (`wp-includes/cron.php:922`), descartada se passar de 10 minutos (`:917`). 🟢
- **`DISABLE_WP_CRON` desliga o disparo sem desligar a fila.** Os eventos continuam sendo
  registrados e se acumulam como pendentes; quem define a constante assume a obrigação de
  disparar `wp-cron.php` por fora, e nada verifica se o fez (`wp-includes/cron.php:1051`). 🟢

## Sinal de que a decisão está sendo revista

🟢 As duas rotinas de privacidade são as **únicas** registradas em `init`, e a mais recente
delas é `@since 7.1.0` — desta geração. `wp_privacy_personal_data_cleanup_requests`, que
expira solicitações não confirmadas, antes rodava apenas ao abrir a tela de exportação ou
de apagamento (`wp-admin/export-personal-data.php:73`,
`wp-admin/erase-personal-data.php:73`): exatamente o padrão que este ADR descreve. A 7.1.0
a promoveu a evento agendado no caminho público.

A leitura mais provável é que o problema **foi reconhecido onde há obrigação legal** —
dado pessoal — e corrigido ali, sem que a mesma correção fosse aplicada à lixeira, aos
transientes e aos auto-drafts. 🟡 É o precedente que torna a recomendação abaixo menos
hipotética: o caminho já está trilhado para dois eventos, e replicá-lo para os outros três
é mudança de uma linha cada.

## Para um porte

- **Separe registro de execução.** O registro dos eventos recorrentes pertence à
  inicialização, não a uma tela. O custo de verificar a existência do agendamento é
  trivial comparado à classe de bug que a dispersão cria.
- **Decida se a retenção é compromisso ou tentativa.** Se for compromisso — e para dado
  pessoal, é —, ela não pode depender de tráfego. `registration_log`, que não tem política
  alguma ([`database/business-rules.md`](../database/business-rules.md) §9), é o lugar
  onde essa decisão já deveria ter sido tomada.
- **Mantenha a tolerância da execução.** `wp_scheduled_delete()` encontrar estado
  inconsistente e apenas limpar o metadado órfão é o comportamento certo para uma rotina
  que não controla quem mais escreve no banco.

## Como verificar num ambiente real

```sql
SELECT option_value FROM wp_options WHERE option_name = 'cron';
```

Desserialize e confira se `wp_scheduled_delete`, `delete_expired_transients` e
`wp_scheduled_auto_draft_delete` estão lá. **A ausência de qualquer um deles é o sintoma
descrito neste ADR**, e a contagem de linhas em `wp_options` com `option_name LIKE
'_transient_timeout_%'` vencidas mede o estrago.
