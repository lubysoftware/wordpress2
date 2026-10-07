# ADR 0009 — Negação explícita que vence o super admin

| | |
|---|---|
| **Status** | Vigente |
| **Decidido em** | 3.0.0 (multisite entra no núcleo e `is_super_admin()` passa a existir) |
| **Área** | autorização |
| **Confiança** | 🟢 comportamento lido no código |
| **Evidência** | `wp-includes/class-wp-user.php:787-833`; `wp-includes/capabilities.php:45-838`, `:1177-1198` |

## Contexto

Com a entrada de multisite no núcleo na 3.0, apareceu um papel acima do administrador: o
super admin da rede. Ele precisa poder fazer tudo — é quem conserta a rede quando ela
quebra. Mas "tudo" não pode ser literal: há ações que **ninguém** deve poder fazer,
independentemente de quem seja.

Dois exemplos concretos do próprio sistema: com `DISALLOW_UNFILTERED_HTML` definida,
o dono do servidor **declarou** que ninguém posta HTML bruto — e um super admin que ignore
a declaração a torna inútil. E uma revisão de post não deve ser apagável por capacidade, de
ninguém, porque revisão é histórico.

O modelo de capacidades, como estava, só sabia responder "tem" ou "não tem". Faltava um
terceiro valor: "não, e isto não se negocia".

## Decisão

Criar uma **pseudocapacidade que ninguém pode possuir** — `do_not_allow` — e verificá-la
**antes** do atalho do super admin.

```php
// class-wp-user.php:793-801
$caps = map_meta_cap( $cap, $this->ID, ...$args );

// Multisite super admin has all caps by definition, Unless specifically denied.
if ( is_multisite() && is_super_admin( $this->ID ) ) {
    if ( in_array( 'do_not_allow', $caps, true ) ) {
        return false;
    }
    return true;
}
```

Duas garantias sustentam a decisão:

1. **Ninguém pode ter a capacidade.** Mesmo no caminho normal, ela é removida de `allcaps`
   antes da comparação, com o comentário *"Nobody is allowed to do things they are not
   allowed to do."* (`:829-830`). Um plugin que a conceda por filtro não consegue nada.
2. **A verificação antecede o filtro.** O atalho do super admin roda **antes** de
   `apply_filters( 'user_has_cap', … )` (`:824`), logo nenhum plugin consegue retirar poder
   do super admin por ali — só `map_meta_cap()` o detém.

`map_meta_cap()` atribui `do_not_allow` em **40 pontos** 🟢 (contagem de
`$caps[] = 'do_not_allow'` em `wp-includes/capabilities.php`), em três famílias:

| Família | Exemplos |
|---|---|
| **Declaração do dono do servidor** | `DISALLOW_UNFILTERED_HTML`, `DISALLOW_FILE_EDIT`, `DISALLOW_FILE_MODS`, `ALLOW_UNFILTERED_UPLOADS` ausente (`:588-652`) |
| **Proteção de objeto** | revisão não se apaga (`:108-111`); termo padrão da taxonomia não se apaga (`:738-744`); `delete_site` não existe fora de multisite (`:701-706`); `manage_links` com o gerenciador desligado (`:691-696`) |
| **Erro de uso da API** | verificar capacidade de objeto **sem informar o objeto**, ou com objeto inexistente (`:83-106`, `:289-312`, `:383-401`) |

E um complemento coerente: lista vazia significa **permitido**. `edit_user` sobre si mesmo
sai do `switch` sem acrescentar nada (`:70-72`), e `array_all` sobre lista vazia é
verdadeiro (`wp-includes/class-wp-user.php:833`).

## Alternativas consideradas

| Alternativa | Por que não foi adotada | Conf. |
|---|---|---|
| **Super admin verdadeiramente irrestrito** | tornaria `DISALLOW_UNFILTERED_HTML` e `DISALLOW_FILE_EDIT` inúteis em multisite — e são exatamente as constantes que um provedor de hospedagem define para proteger a rede de si mesma | 🟢 o comentário em `:596` é categórico: *"even admins and super admins"* |
| **Lista de exceções mantida à parte** ("estas capacidades o super admin não tem") | centralizaria a regra, mas a desacoplaria da condição: `do_not_allow` é devolvido **condicionalmente**, dependendo de constante, de estado do objeto e de contexto de rede. Uma lista estática não expressa isso | 🟡 |
| **Capacidade com valor `false` em `allcaps`** | `! empty( $capabilities[ $cap ] )` já trata `false` como ausência — mas a ausência é vencida pelo atalho do super admin. Precisava de um mecanismo que o atalho **respeitasse**, e por isso a verificação é sobre `$caps`, não sobre `allcaps` | 🟢 |
| **Verificar `do_not_allow` depois do filtro** | permitiria a um plugin remover a negação. Seria a ordem errada, e o código escolheu a outra | 🟢 |

## Consequências

**Desejadas**

- Constante de configuração passa a ser **inviolável**, e não uma sugestão. 🟢
- Erro de uso da API — verificar `edit_post` sem dizer de qual post — **nega** em vez de
  liberar. Combinado com a degradação para `edit_others_posts` quando o tipo ou o status
  não está registrado (`:135`, `:337`, `:365`), produz a propriedade que o Arqueólogo
  destacou em `code-analysis.md` §3: **no mapeamento de capacidade, todo caminho de erro
  fecha a porta.** 🟢
- Objetos estruturais ficam protegidos sem tabela de exceções: revisão e termo padrão não
  são apagáveis por ninguém. 🟢

**Indesejadas, e ainda pagas**

- **A negação é invisível na interface.** O usuário vê o controle desaparecer ou a ação
  falhar, sem saber que uma constante no `wp-config.php` o impediu. 🟡
- **Não há como auditar o que está negado.** Nenhuma função lista "capacidades atualmente
  negadas nesta instalação"; a resposta depende de rodar `map_meta_cap()` para cada uma das
  86 meta-capacidades, em cada contexto. 🟢
- **A assimetria de `is_super_admin()` confunde.** Em multisite, é lista de **logins** de
  rede; fora dela, é quem tem `delete_users` (`wp-includes/capabilities.php:1188-1194`). A mesma função,
  dois modelos — e o atalho de "tem tudo" só existe no primeiro caso. Num site único, o
  administrador **passa** pelo filtro `user_has_cap`, e um plugin pode tirar poder dele. 🟢
- **Lista vazia significando "permitido" é uma convenção perigosa.** Um `case` novo em
  `map_meta_cap()` que esqueça de preencher `$caps` **libera** a ação para todo mundo. Nada
  no código avisa, e não há teste nesta árvore que pegaria isso. 🟢

## Para um porte

- **Replique os três valores**, não dois: "tem", "não tem", "negado". É a parte do modelo
  que mais se perde numa reimplementação, porque parece redundante até a primeira vez que
  um privilégio demais atravessa uma política de configuração.
- **Inverta a convenção da lista vazia.** Exigir que todo ramo declare explicitamente
  "permitido" ou "negado" custa uma linha por `case` e elimina uma classe inteira de falha
  silenciosa.
- **Unifique `is_super_admin()`.** Dois modelos na mesma função é dívida pura; escolha um.
- **Exponha a negação.** Quando uma ação é negada por configuração do servidor, dizê-lo na
  interface economiza horas de investigação de quem administra.
