# ADR 0008 — Falha crítica de atualização exige intervenção humana

| | |
|---|---|
| **Status** | Vigente |
| **Decidido em** | 3.7.0 (`WP_Automatic_Updater`, `Core_Upgrader::should_update_to_version()`) |
| **Área** | operação |
| **Confiança** | 🟢 comportamento lido no código, incluindo a transição de volta |
| **Evidência** | `wp-admin/includes/class-wp-automatic-updater.php:797-886`; `wp-admin/includes/class-core-upgrader.php:279-344`; `wp-admin/includes/update-core.php:1920-1923` |

## Contexto

O sistema atualiza a si mesmo sobrescrevendo arquivos no próprio webroot, sem supervisão —
é a decisão fundadora [`soul.md` D7](../soul.md). Isso significa que uma atualização
automática pode falhar **no meio da cópia**, deixando a instalação com arquivos de duas
versões. Nesse estado, repetir a tentativa é o pior comportamento possível: pode piorar a
inconsistência, e não há como saber se o que falhou foi transitório.

Mas o mecanismo é automático por desenho. Se ele parar de tentar diante de qualquer falha,
sites param de receber correção de segurança por um problema de rede.

## Decisão

**Classificar a falha pelo momento em que ocorreu, e só travar permanentemente o que
aconteceu depois do ponto de não retorno.**

Três classes, com três políticas: 🟢 `wp-admin/includes/class-wp-automatic-updater.php:810-886`

| Classe | Códigos de erro | Política |
|---|---|---|
| **Crítica** — a cópia já havia começado | `disk_full`, qualquer código contendo `__copy_dir`, `rollback_was_required` cujo *rollback* também falhou, qualquer `do_rollback` | grava `critical = true` e **nunca mais tenta automaticamente**. E-mail imediato |
| **Transitória** — nem começou, e a culpa pode ser do outro lado | `incompatible_archive`, `download_failed`, `insane_distro`, `locked` | **uma** nova tentativa em 1 hora, **sem avisar ninguém**. Se a segunda falhar, vira gravosa |
| **Gravosa** — nem começou, mas a causa é local | todo o resto (`files_not_writable` etc.) | não repete o mesmo par versão-origem; tenta se sair outra versão. E-mail |

O comentário no código explica o critério e a assimetria:

> *"Any of these WP_Error codes are critical failures, as in they occurred after we started
> to copy core files. We should not try to perform a background update again until there is
> a successful one-click update performed by the user."* (`:810-813`)

> *"Any other WP_Error code (like download_failed or files_not_writable) occurs before we
> tried to copy over core files. Thus, the failures are early and graceful. … It's possible
> the issue could actually be on WordPress.org's side."* (`:843-853`)

O estado é **a presença e o conteúdo da opção de rede `auto_core_update_failed`**, e quem
o consulta é `Core_Upgrader::should_update_to_version()` (`wp-admin/includes/class-core-upgrader.php:324-344`):

```php
if ( ! empty( $failure_data['critical'] ) ) { return false; }   // :327-329
```

**O destravamento é o fecho da decisão, e está implementado:** ao fim de uma atualização
bem-sucedida do núcleo, `update_core()` apaga a opção, com o comentário
*"Clear the option that blocks auto-updates after failures, now that we've been
successful."* 🟢 `wp-admin/includes/update-core.php:1920-1923`

```php
if ( function_exists( 'delete_site_option' ) ) {
    delete_site_option( 'auto_core_update_failed' );
}
```

O mecanismo é elegante: a limpeza está no caminho **comum** de toda atualização, não num
caminho especial de "atualização manual". O que torna a intervenção humana obrigatória é
que, com `critical = true`, a atualização **automática** nem chega ali — ela é recusada
antes, em `should_update_to_version()`. Só uma atualização conduzida por uma pessoa alcança
a linha que destrava. É exatamente o que o docblock prometia, sem nenhum código dedicado a
cumpri-lo.

Em paralelo, `auto_core_update_notified` guarda e-mail, versão e tipo do último aviso, e
a dupla repetida cancela o envio (`:313-320`, `:861-870`). Essa opção, sim, **não é
apagada** no sucesso.

## Alternativas consideradas

| Alternativa | Por que não foi adotada | Conf. |
|---|---|---|
| **Tentar sempre, até dar certo** | numa falha crítica, repetir sobre uma instalação meio copiada pode torná-la irrecuperável. O docblock recusa isso explicitamente | 🟢 |
| **Travar em qualquer falha** | uma indisponibilidade momentânea do servidor de pacotes paralisaria a atualização automática de todos os sites, e justamente a de segurança. É o que a classe "transitória" existe para evitar | 🟢 o comentário cita a possibilidade de o problema ser do outro lado |
| **Repetição com recuo exponencial** | daria mais tentativas sem risco, mas também mais e-mails ou mais silêncio prolongado. O sistema escolheu **uma** retentativa e um limite claro | 🟡 |
| **Reverter automaticamente a cópia parcial** | existe, e é parte do fluxo: um `rollback` é tentado. A classe crítica é precisamente **o rollback que também falhou** — não há terceira defesa automática possível | 🟢 `:817-820` |
| **Destravar por tempo** (ex. tentar de novo em 30 dias) | deixaria o sistema voltar a mexer numa instalação inconsistente sem que ninguém a tivesse olhado. A decisão exige um humano, não um relógio | 🟡 |

## Consequências

**Desejadas**

- Uma instalação meio copiada não é mexida de novo por processo automático. 🟢
- Falha de rede não paralisa a atualização automática. 🟢
- O estado de falha é **persistente e inspecionável**: tentativa, versão corrente, código
  de erro, dados e instante ficam gravados. É o único histórico de falha que o sistema
  mantém (ver [`domain.md`](../domain.md) §5). 🟢
- Nenhum aviso é repetido. 🟢

**Indesejadas, e ainda pagas**

- **O destravamento é implícito e frágil.** 🟢 Ele funciona porque a limpeza está no
  caminho comum de `update_core()` e porque a atualização automática é recusada antes de
  chegar lá. Nenhum comentário liga as duas pontas: `should_update_to_version()` não
  menciona onde a trava é removida, e `update_core()` não menciona que é a **única** porta
  de saída. Quem mover a linha 1922 para um ramo condicional quebra a decisão sem que
  nenhum teste acuse — e não há teste nesta árvore.
- **O estado é visível, mas só na tela de diagnóstico.** `auto_core_update_failed` é lido
  por `wp-admin/includes/class-wp-site-health-auto-updates.php:171` e por
  `wp-admin/includes/update.php:857`, que mostram o aviso. Não há, porém, registro de
  **quando** a trava foi posta em lugar algum da interface — o `timestamp` está na opção e
  não é exibido. 🟢
- **Falha por incompatibilidade de ambiente não gera sinal algum.** PHP ou MySQL abaixo do
  mínimo da versão oferecida cancelam a atualização **em silêncio**
  (`wp-admin/includes/class-wp-automatic-updater.php:278-291`), enquanto falta de permissão e política
  bloqueada geram e-mail (`:213-215`, `:271-273`). Um site parado numa versão antiga por
  PHP velho não avisa ninguém. 🟢
- **A classificação é por `str_contains` no código de erro.** `__copy_dir` e `do_rollback`
  são procurados como substring (`:815`, `:821`), o que é frágil: um código de erro novo que
  contenha a substring por coincidência passa a ser crítico. 🟢
- **A segunda chance é única e não é contada por versão.** `retry` é booleano, e a condição
  para reagendar inclui "a opção ainda não existia" (`:856`) — logo uma falha transitória
  sobre um estado de falha anterior não ganha a retentativa. 🟢

## Para um porte

- **Replique a classificação por momento da falha.** Ela é a parte boa e não é óbvia:
  "falhou antes de tocar nos arquivos" e "falhou depois" são problemas de natureza
  diferente e merecem políticas diferentes.
- **Troque `str_contains` por códigos de erro tipados.** É a correção mais barata.
- **Torne o destravamento explícito.** O legado o consegue por coincidência de caminhos:
  a limpeza está no fluxo comum, e só a atualização manual chega ao fluxo comum. Funciona,
  mas é uma invariante não declarada entre dois arquivos. Num destino novo, destravar deve
  ser uma operação com nome.
- **Mostre a data.** A tela de diagnóstico já sabe que o site está travado; o `timestamp`
  está gravado na opção e não é exibido. "Travado desde X por Y" é uma linha de código e
  responde a pergunta que o administrador realmente faz.

## Como verificar num ambiente real

```sql
SELECT option_value FROM wp_options WHERE option_name = 'auto_core_update_failed';
-- em multisite: SELECT meta_value FROM wp_sitemeta WHERE meta_key = 'auto_core_update_failed';
```

Se a opção existe com `critical = true`, o site **não está se atualizando sozinho** — e a
data em `timestamp` diz desde quando.
