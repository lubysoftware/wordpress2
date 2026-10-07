# ADR 0001 — Papéis como dado mutável, não como código

| | |
|---|---|
| **Status** | Vigente |
| **Decidido em** | 2.0.0 (`@since 2.0.0` em `populate_roles()`) |
| **Área** | autorização |
| **Confiança** | 🟢 comportamento lido no código |
| **Evidência** | `wp-admin/includes/schema.php:719-743`, `:750-969`; `wp-includes/class-wp-user.php:882`, `:909`, `:533-538`; `wp-admin/includes/upgrade.php:80`; `wp-includes/ms-site.php:743` |

## Contexto

Antes da 2.0, a autorização era numérica: cada usuário tinha um `user_level` de 0 a 10, e
o código comparava números. Na 2.0 isso foi substituído por papéis nomeados com listas de
capacidades. Restava decidir **onde a definição de cada papel vive**.

Havia duas respostas possíveis, e elas levam a produtos diferentes: a definição pode ser
uma estrutura de dados no código (lida a cada requisição, igual em toda instalação) ou um
registro no banco (semeado uma vez, mutável depois).

## Decisão

A definição vive **no banco**, na opção `{prefixo}user_roles`, e o código a escreve
**apenas em três momentos**: ao instalar (`wp-admin/includes/upgrade.php:80`), ao atualizar
o schema, e ao criar um site novo numa rede (`wp-includes/ms-site.php:743`).

O mecanismo que a grava é uma sequência de oito funções, cada uma representando a versão
em que novos poderes entraram — `populate_roles_160()` a `populate_roles_300()` —
executadas em ordem com a escrita no banco desligada, e só então persistidas de uma vez:

```php
$wp_roles->use_db = false;        // schema.php:724
populate_roles_160(); /* … */ populate_roles_300();
update_option( $wp_roles->role_key, $wp_roles->roles, true );   // :738
```

As capacidades de **cada usuário** seguem o mesmo princípio: ficam em
`usermeta.{prefixo}capabilities` (`wp-includes/class-wp-user.php:882`, `:909`), e `allcaps` é montado
em memória fundindo as capacidades dos papéis do usuário com as capacidades individuais
dele, nessa ordem (`:533-538`).

## Alternativas consideradas

| Alternativa | Por que não foi adotada (inferência) | Conf. |
|---|---|---|
| **Papéis declarados em código, imutáveis** | mataria a capacidade de um plugin redefinir o que "editor" significa — e é exatamente isso que a economia de plugins em torno do produto faz. Seria incompatível com [`soul.md` D2](../soul.md) | 🟡 |
| **Tabela própria de papéis e capacidades** | exigiria DDL, e portanto `dbDelta()` e migração, para um dado que é lido em toda requisição. Com `autoload`, a opção já resolve a leitura numa consulta só. Casa com [`soul.md` D5](../soul.md) | 🟡 |
| **Papéis em código + sobreposições no banco** | é a solução que elimina a divergência (o código seria o piso, o banco o ajuste). Não foi adotada; nada no código indica que tenha sido avaliada | 🟡 |
| **Manter `user_level` numérico** | o próprio sistema o abandonou, mas **nunca o removeu**: `level_0` a `level_10` continuam sendo semeados em todos os papéis (`wp-admin/includes/schema.php:779-789`) e `WP_User::has_cap()` ainda aceita número, com aviso de depreciação (`wp-includes/class-wp-user.php:788-791`) | 🟢 |

## Consequências

**Desejadas**

- Um plugin acrescenta ou remove capacidade de um papel com uma chamada, sem DDL e sem
  tocar no núcleo. É a contrapartida de autorização para o modelo de extensão. 🟢
- A leitura é barata: a opção é `autoload`, logo vem junto com o resto da configuração. 🟡
- Cada site de uma rede tem seu próprio conjunto, porque a chave leva o prefixo do site
  (`wp-includes/class-wp-user.php:513-517`). O mesmo usuário é administrador num site e assinante em
  outro, sem duplicar identidade. 🟢

**Indesejadas, e ainda pagas**

- **A definição de papel é um retrato tirado na instalação.** Depois dele, a opção é a
  verdade e o código deixa de ser. Um site instalado em 2010 e atualizado desde então tem
  papéis cuja história não está em `populate_roles()` — está no que os plugins fizeram. 🟢
- **Nenhuma consulta SQL responde "quem é administrador aqui".** O valor está serializado;
  a única busca possível é `LIKE '%administrator%'` sobre `longtext`. 🟢
  Ver [`database/business-rules.md`](../database/business-rules.md) §5.
- **A divergência é silenciosa.** Nada compara a opção com o que o código esperaria, e não
  há como detectar que um papel perdeu uma capacidade — exceto pelo sintoma.
  A única ferramenta de reconciliação é a constante `RESET_CAPS`, que repõe tudo a partir
  do antigo `user_level` e está marcada `// FIXME: RESET_CAPS is temporary code`
  (`wp-admin/includes/upgrade.php:1203-1209`) — temporária desde 2005. 🟢
- **Quatro capacidades que o código exige não estão em papel algum**, e são injetadas por
  filtro: `install_languages`, `resume_plugins`, `resume_themes`,
  `view_site_health_checks`. Quem migrar lendo só `populate_roles()` produz um sistema em
  que ninguém retoma um plugin pausado. 🟢 Ver [`permissions.md`](../permissions.md) §4.

## Para um porte

Duas decisões a tomar, e elas são independentes:

1. **A definição de papel é código ou dado?** Se for código, o sistema ganha
   reconciliação e consulta, e perde a extensão sem fork. Se for dado, replique também o
   caminho de semeadura — e acrescente o que falta ao legado: uma rotina que **compare** o
   estado do banco com o esperado e relate a diferença.
2. **A autorização por usuário sai do EAV?** Se sair, "quem é administrador" volta a ser
   uma consulta. O custo é perder a liberdade de um plugin acrescentar capacidade a um
   usuário sem schema.

## Como verificar num ambiente real

```sql
SELECT option_value FROM wp_options WHERE option_name LIKE '%user_roles';
```

Desserialize e compare com `.reversa/work/reversa-detective/roles-matrix.json`, que contém
a matriz que `populate_roles()` produziria. **A diferença é a história que esta árvore não
conta.**
