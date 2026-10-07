# ADR 0011 — Autorização própria para agente de IA

| | |
|---|---|
| **Status** | Vigente — superfície nova, sem consumidor verificável nesta árvore |
| **Decidido em** | 6.9.0 (`WP_Ability`, `check_permissions()`) · ampliado na **7.1.0** (filtros de resultado e de curto-circuito) |
| **Área** | autorização |
| **Confiança** | 🟢 comportamento lido no código · 🔴 superfície real não determinável |
| **Evidência** | `wp-includes/abilities-api/class-wp-ability.php:46-59`, `:124`, `:623-657`, `:769-812`; `wp-includes/rest-api/endpoints/class-wp-rest-abilities-v1-run-controller.php:66`, `:143-172` |

## Contexto

A Abilities API expõe operações nomeadas, descritas por esquema JSON de entrada e saída,
para que um agente externo — tipicamente um modelo de linguagem — as descubra e invoque. É
um consumidor novo, com propriedades que nenhum consumidor anterior tinha: ele **escolhe**
qual operação chamar, a partir de descrições em linguagem natural, e pode encadear
chamadas sem supervisão.

O sistema já tinha duas camadas de autorização: capacidades (`current_user_can`) e o
`permission_callback` das rotas REST. Restava decidir se a nova superfície usaria uma
delas ou teria a própria.

## Decisão

**Camada própria, com falha fechada** — e, na 7.1.0, com dois pontos de intervenção que
a tornam mais permeável do que as outras duas.

**1. O callback de permissão é obrigatório, e sua ausência nega.**
🟢 `wp-includes/abilities-api/class-wp-ability.php:623-630`

```php
public function check_permissions( $input = null ) {
    if ( ! is_callable( $this->permission_callback ) ) {
        return new WP_Error( 'ability_invalid_permission_callback', … );
    }
```

É o oposto da camada REST, onde rota sem `permission_callback` **funciona** e só emite
aviso de uso indevido (`wp-includes/rest-api.php:122-133`). Aqui, não declarar é negar.

**2. A autorização é anotada semanticamente, não só verificada.** 🟢 `:46-59` Cada
*ability* declara três anotações, destinadas a quem a invoca:

| Anotação | Significado declarado |
|---|---|
| `readonly` | não modifica o ambiente |
| `destructive` | pode fazer atualização destrutiva; `false` = só aditiva |
| `idempotent` | repetir com a mesma entrada não tem efeito adicional |

E o docblock as desqualifica como garantia: *"They are not guaranteed to provide a faithful
description of ability behavior."* (`:40-41`) São **dica para ferramenta**, não contrato.

**3. O resultado da permissão é filtrável, inclusive para conceder.** 🟢 `:634-656` O filtro
`wp_ability_permission_result` (`@since 7.1.0`) recebe o que o callback produziu e pode
devolver `true`. O docblock nomeia o caso de uso:

> *"Plugins can use this to layer additional authorization rules on top of the ability's own
> permission logic — for example, multi-factor authorization gates or temporary permission
> elevation for trusted contexts."*

Retorno que não seja `bool` nem `WP_Error` é coagido a `false` (`:653-655`).

**4. A execução inteira pode ser contornada.** 🟢 `:787-812` O filtro
`wp_pre_execute_ability` (`@since 7.1.0`) curto-circuita normalização de entrada,
validação de entrada, **verificação de permissão**, execução e validação de saída. O
docblock avisa quem assume o risco:

> *"Because validation is bypassed, callers that short-circuit are responsible for the
> integrity of any value they consume from `$input`."*

O mecanismo usa uma sentinela única por invocação (`WP_Filter_Sentinel`), de modo que
qualquer valor — `null`, `false`, objeto — possa ser um resultado legítimo de
curto-circuito.

## Alternativas consideradas

| Alternativa | Por que não foi adotada (inferência) | Conf. |
|---|---|---|
| **Reusar capacidades diretamente** (cada *ability* declara a capacidade que exige) | capacidade é booleana e não recebe a entrada da operação. Uma *ability* precisa decidir com base **no que foi pedido** — "pode editar *este* post", "pode ler *este* intervalo" — e o callback recebe `$input` | 🟡 |
| **Reusar o `permission_callback` do REST** | é o que o controlador REST de execução faz na prática: `check_ability_permissions()` delega a `$ability->check_permissions( $input )` (`wp-includes/rest-api/endpoints/class-wp-rest-abilities-v1-run-controller.php:143-172`). A camada própria existe para que a *ability* seja autorizada **igual** por qualquer invocador, não só por HTTP | 🟢 |
| **Liberar por padrão** quando não há callback | é o que a camada REST faz, e teria sido a escolha consistente com o resto do sistema. **Foi recusada** — e é a melhor decisão deste ADR | 🟢 |
| **Sem filtro de resultado** | fecharia a elevação, e tornaria impossível adicionar um fator de autenticação sobre uma *ability* de terceiro. A permeabilidade é deliberada | 🟢 o caso de uso está no docblock |
| **Anotações verificadas** (o sistema garante que uma *ability* `readonly` não escreve) | exigiria instrumentar a execução. O docblock desiste explicitamente: são dicas | 🟢 |

## Consequências

**Desejadas**

- **Falha fechada.** Uma *ability* mal registrada não vira porta aberta. É a correção do
  erro que a camada REST carrega desde a 4.7. 🟢
- A autorização é a mesma por qualquer invocador — HTTP, CLI, código. 🟢
- A decisão recebe a entrada, logo pode ser por objeto e por valor, não só por verbo. 🟢
- As anotações dão a um agente a informação de que ele precisa para decidir se pede
  confirmação antes de invocar. 🟡

**Indesejadas, e ainda pagas**

- **A elevação de permissão é um caso de uso documentado.** `wp_ability_permission_result`
  pode transformar negação em concessão, e "contexto confiável" é definido por quem
  escreveu o plugin. Numa superfície cujo invocador é um modelo de linguagem, é a porta
  mais larga do sistema — e, diferente do filtro `user_has_cap`, não há atalho de super
  admin que a anteceda. 🟢
- **O curto-circuito contorna a verificação de permissão junto com a validação.** Os casos
  de uso citados (cache, limite de taxa, modo de manutenção, mock de teste) são legítimos;
  o mecanismo não distingue "devolver cache" de "pular a autorização". 🟢
- **As anotações são declaração sem verificação.** Uma *ability* pode declarar-se
  `readonly` e escrever. O agente que confiar na anotação para decidir se pede confirmação
  está confiando em quem registrou. 🟢 O docblock é honesto sobre isso, o que não resolve.
- **Não há inventário.** Nenhuma função lista o que está registrado com quais permissões e
  quais anotações, de modo que uma auditoria pudesse conferir a superfície. 🟡
- 🔴 **Nenhuma *ability* de núcleo foi encontrada registrada nesta árvore.** O registro é
  de quem estende, e o consumidor é cliente que não está aqui — o que esta camada autoriza
  **de fato** não é determinável. Combina com a [Lacuna L4 do `soul.md`](../soul.md): a
  superfície de IA desta geração (`abilities-api`, `ai-client`, `connectors`) tem o lado PHP
  completo e nenhum consumidor verificável.

## Para um porte

- **Mantenha a falha fechada.** É a melhor propriedade das três camadas e não custa nada.
- **Separe o curto-circuito da autorização.** Dois filtros em lugar de um: um que possa
  devolver resultado pronto **depois** da verificação de permissão, e outro, explicitamente
  privilegiado, que a contorne. Os casos de uso citados no docblock são atendidos pelo
  primeiro.
- **Trate a elevação como operação auditável.** Se "elevação temporária para contexto
  confiável" é requisito, ela merece registro — quem elevou, o quê, quando, para qual
  *ability*. Numa superfície invocada por agente, é a diferença entre poder e não poder
  explicar o que aconteceu.
- **Verifique as anotações, ou pare de publicá-las.** Uma anotação `readonly` não verificada
  é pior que nenhuma: ela induz confiança que o sistema não sustenta.
- **Construa o inventário.** Uma listagem de *abilities* registradas com permissão e
  anotações é a ferramenta mínima para auditar esta camada, e não existe.
