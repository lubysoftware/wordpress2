# ADR 0010 — Tolerar pacote sem assinatura verificada

| | |
|---|---|
| **Status** | Vigente — e é a decisão mais grave deste conjunto |
| **Decidido em** | 5.2.0 (`verify_file_signature()`, `wp_trusted_keys()`) · a chave venceu em **1º de abril de 2021** |
| **Área** | segurança |
| **Confiança** | 🟢 comportamento lido no código |
| **Evidência** | `wp-admin/includes/file.php:1429`, `:1548`, `:1553`; `wp-admin/includes/class-wp-upgrader.php:849`, `:855`; `wp-admin/includes/class-core-upgrader.php:128` |

> **Crédito:** este achado foi levantado pelo Arqueólogo e registrado em
> [`code-analysis.md`](../code-analysis.md) §8 como "a lacuna mais importante do
> levantamento". Este ADR não o descobre — ele o reconstrói como **decisão**, com as
> alternativas e as consequências, que é o que falta para alguém poder agir sobre ele.

## Contexto

O sistema baixa pacotes pela rede e os descompacta **sobre o próprio código em execução**
([`soul.md` D7](../soul.md)). Um pacote adulterado é execução remota de código com
privilégio total. Verificar assinatura criptográfica é a defesa óbvia, e a 5.2.0 a
implementou: `verify_file_signature()` com Ed25519, usando `sodium_compat` quando a
extensão nativa falta — 1,6 MB de libsodium em PHP puro, cujo **desempenho é medido antes
de ser usado** (`file.php:1429`), tal é o cuidado com o caminho.

Implementada a verificação, restava a parte difícil: **o que fazer quando ela falha ou não
é possível.** Tornar a falha fatal significa que um problema de chave, de extensão PHP ou
de infraestrutura de distribuição **para a atualização de segurança de todos os sites**.

## Decisão

**Verificar quando der, e seguir quando não der.** Três camadas de tolerância, cada uma
tomada separadamente:

**1. A verificação é opcional por parâmetro, e ninguém a pede.** O argumento `$required`
de `verify_file_signature()` existe, e os dois chamadores do núcleo passam `false`
explicitamente — `wp-admin/includes/class-wp-upgrader.php:849` e `wp-admin/includes/class-core-upgrader.php:128`. 🟢

**2. A falha é rebaixada de erro para aviso.** 🟢 `wp-admin/includes/class-wp-upgrader.php:855` — e o caso
"pacote sem assinatura alguma" é **silenciado** fora de `WP_DEBUG`.

**3. A lista de chaves confiáveis está vazia.** 🟢 `wp-admin/includes/file.php:1548` — a
única chave está dentro de `if ( time() < 1617235200 )`, isto é, **1º de abril de 2021**.
A linha seguinte é:

```php
// TODO: Add key #2 with longer expiration.
```

`wp_trusted_keys()` devolve, portanto, lista vazia em toda instalação desde aquela data.

O efeito composto das três é que **nenhum pacote tem autenticidade verificada, e isso não
produz sinal visível.** Não é uma das três decisões: é a soma.

## Alternativas consideradas

| Alternativa | Por que não foi adotada (inferência) | Conf. |
|---|---|---|
| **Falha de assinatura é fatal** | numa frota de milhões de instalações, um erro na infraestrutura de assinatura paralisa a distribuição de correção de segurança. O risco de parar a atualização foi julgado maior que o de aceitar pacote não verificado — e, em 2019, era um julgamento defensável, porque a verificação acabava de nascer | 🟡 |
| **Fatal só quando há assinatura e ela não confere** (tolerar ausência, recusar divergência) | é a posição intermediária, e é a que o código **quase** implementa: o caso "sem assinatura" já é tratado separadamente de "assinatura inválida" (`:855`). Falta apenas que o segundo seja fatal. Não foi feito | 🟢 a distinção existe no código |
| **Chave de longa validade** | é literalmente o que o `TODO` pede. A razão de não ter sido feito não está nesta árvore | 🔴 |
| **Exigir assinatura só para o núcleo**, tolerando plugin e tema | daria a defesa onde o impacto é maior, a custo de compatibilidade mínimo. `wp-admin/includes/class-core-upgrader.php:128` passa `false` como os demais | 🟢 |
| **Verificar integridade sem assinatura** (soma de verificação da API) | não protege contra quem controla a resposta da API, mas protegeria contra corrupção em trânsito. Não há indício de que exista no caminho de atualização | 🟡 |

## Consequências

**Desejadas**

- A atualização automática nunca é bloqueada por problema de assinatura. 🟢
- Instalações sem a extensão sodium continuam funcionando — e o substituto em PHP puro é
  medido antes de ser usado, para não arrastar o tempo de resposta. 🟢
- O código da verificação **existe e está pronto**: ligar a defesa é questão de política,
  não de implementação. 🟢 É a consequência mais útil para quem herda o sistema.

**Indesejadas, e ainda pagas**

- **Nenhum pacote tem autenticidade verificada.** 🟢 O vetor é a execução de código
  arbitrário com os privilégios do servidor web, no caminho que o produto usa para se
  manter atualizado.
- **A ausência da defesa é silenciosa.** Não há aviso na tela de Saúde do Site, não há
  entrada em log, não há indicação ao administrador. Um auditor que leia o nome
  `verify_file_signature()` na árvore conclui, razoavelmente e erradamente, que pacotes são
  verificados. 🟢
- **O `TODO` tem mais de cinco anos** (comparado a 2026-10-05, data desta análise) e está no
  caminho de maior privilégio do sistema. É o marcador mais consequente dos 205 encontrados
  nesta árvore ([`domain.md`](../domain.md) §4). 🟢
- **A infraestrutura paga seu custo sem entregar benefício.** `sodium_compat/` são 1,6 MB
  de código vendorizado, carregado e medido, para uma verificação cuja lista de chaves está
  vazia. 🟢
- **Interage com o [ADR 0008](0008-falha-critica-de-atualizacao-exige-intervencao-humana.md)
  no pior sentido:** o sistema tem política elaborada para falha de **cópia** e nenhuma
  para falha de **autenticidade**. Disco cheio trava a atualização automática
  permanentemente; pacote de origem não verificada passa sem registro. 🟡

## Para um porte

Esta é a decisão onde um destino novo ganha mais, pelo menor custo:

1. **Popule uma chave válida.** É o que o `TODO` pede, e sem isso nada mais funciona.
2. **Torne fatal a divergência**, mantendo tolerante a ausência. O código já distingue os
   dois casos; só o tratamento muda. É a posição intermediária que o legado quase tem.
3. **Exija assinatura para o núcleo.** Se for para fazer uma coisa só, é esta — é o pacote
   com o maior alcance e o único cujo publicador você controla.
4. **Torne a ausência visível.** Um teste na tela de diagnóstico dizendo "pacotes não têm
   assinatura verificada" transforma uma lacuna invisível em decisão consciente de quem
   administra. Custa menos que qualquer uma das outras três e já seria uma melhora.

> **Nota sobre escopo.** Este ADR descreve o estado de **uma cópia** cujo número de versão
> não pôde ser cruzado com nenhuma release pública ([Lacuna L3 do `soul.md`](../soul.md)).
> Antes de tratar o achado como característica do produto, confirme-o contra a distribuição
> oficial de mesma versão: a diferença, se houver, é informação sobre a procedência desta
> árvore.
