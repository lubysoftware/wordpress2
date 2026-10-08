---
gerado_por: agentic-squad
gerado_em: 2026-10-08T05:09:57Z
esquema: 1
hash: 4695842fea46624d1762091b8050cfe5ea6e3e1d4391641b69e4a7f84e642e4d
---

# run_muvp9wahprbsns/_reversa_refactor/README.md

- **tipo:** spec
- **não deu para ler:** —

# Registro de Qualidade de Código (Reversa Refactor)

> GENERATED / MANAGED pelo time Code Quality do Reversa. Este README guarda as políticas do registro.
> As pastas de contexto e os artefatos de transformação nascem sob demanda.
> Inventário desta passada: 2026-10-06 · 30 oportunidades em 19 contextos · nenhuma transformação aplicada.

## Políticas

- `control_mode`: gated
  - `gated` (padrão): leitura, análise, medição e prova de comportamento fluem sem aprovação. TODO passo que toca o código do projeto passa por gate com diff aprovado.
  - `supervised`: o agente pode aplicar transformações de baixo risco já provadas, avisando; alto risco continua com gate.
  - `autonomous`: aplica automaticamente o que estiver 🟢 e provado. Mesmo aqui têm gate obrigatório: remover código, alterar spec efetiva, enviar material a harness externo, operação destrutiva.
- `safety_net_policy`: require-characterization
  - `require-characterization` (padrão): transformação que altera estrutura ou lógica exige rede de segurança (testes existentes + caracterização) verde antes e depois.
  - `allow-unproven`: permite transformação sem rede, sempre rebaixada para 🔴 e marcada como sem prova mecânica no registro.

### Como estas duas políticas foram escolhidas

> **Pergunta ao humano, registrada e não respondida.** O protocolo manda perguntar
> `control_mode` e `safety_net_policy` em menu antes de criar o registro. Esta passada rodou
> sem interação, logo ficaram os **valores padrão**, que são também os únicos defensáveis
> com o que foi medido:
>
> - `gated`, porque `supervised` e `autonomous` pressupõem transformação de baixo risco **já
>   provada**, e este sistema tem **zero arquivos de teste em 3.378**. Não existe prova
>   mecânica a que apelar.
> - `require-characterization`, pelo mesmo motivo: sem rede de segurança existente,
>   `allow-unproven` rebaixaria toda transformação para 🔴, o que esvazia a priorização.
>
> Trocar qualquer um dos dois valores é decisão de uma pessoa e muda o gate de todas as 30
> oportunidades deste registro.

## Invariante do registro

Nenhuma transformação altera comportamento observável. O que não prova preservação, para no gate.
Toda transformação aplicada é revertível pelo diff guardado.

## Contextos registrados

A ordem é a do melhor ROI de cada contexto, não alfabética.

| Melhor posição | Pasta | Contexto | Oportunidades | Verbos |
|---:|---|---|---:|---|
| 1 | [`nucleo-utilitario-e-erro/`](nucleo-utilitario-e-erro/generated/index.md) | Núcleo utilitário e erro | 3 | decouple, modularize, restructure |
| 2 | [`bootstrap-e-carregamento/`](bootstrap-e-carregamento/generated/index.md) | Bootstrap e carregamento | 2 | optimize |
| 4 | [`l10n-e-traducoes/`](l10n-e-traducoes/generated/index.md) | L10n e traduções | 1 | decouple |
| 6 | [`capacidades-e-papeis/`](capacidades-e-papeis/generated/index.md) | Capacidades e papéis | 2 | restructure, simplify |
| 7 | [`requisicao-de-loopback/`](requisicao-de-loopback/generated/index.md) | Requisição de loopback | 1 | restructure |
| 8 | [`rest-api/`](rest-api/generated/index.md) | REST API | 2 | restructure |
| 10 | [`temas-e-hierarquia-de-templates/`](temas-e-hierarquia-de-templates/generated/index.md) | Temas e hierarquia de templates | 1 | restructure |
| 11 | [`posts-e-tipos-de-conteudo/`](posts-e-tipos-de-conteudo/generated/index.md) | Posts e tipos de conteúdo | 3 | modularize, restructure, simplify |
| 12 | [`convencao-de-codigo/`](convencao-de-codigo/generated/index.md) | Convenção de código | 2 | standardize |
| 14 | [`midia-e-anexos/`](midia-e-anexos/generated/index.md) | Mídia e anexos | 2 | modularize, restructure |
| 15 | [`admin-list-tables/`](admin-list-tables/generated/index.md) | Tabelas de listagem do painel | 1 | restructure |
| 16 | [`importacao-e-exportacao/`](importacao-e-exportacao/generated/index.md) | Importação e exportação | 1 | restructure |
| 18 | [`wp-query/`](wp-query/generated/index.md) | WP Query | 2 | restructure |
| 19 | [`rewrite-e-permalinks/`](rewrite-e-permalinks/generated/index.md) | Rewrite e permalinks | 1 | restructure |
| 22 | [`html-api/`](html-api/generated/index.md) | HTML API | 1 | restructure |
| 23 | [`theme-json-e-estilos-globais/`](theme-json-e-estilos-globais/generated/index.md) | theme.json e estilos globais | 2 | modularize, restructure |
| 27 | [`customize/`](customize/generated/index.md) | Customizer | 1 | modularize |
| 28 | [`xmlrpc/`](xmlrpc/generated/index.md) | XML-RPC | 1 | modularize |
| 30 | [`retrocompatibilidade-e-codigo-sem-referencia/`](retrocompatibilidade-e-codigo-sem-referencia/generated/index.md) | Retrocompatibilidade e código sem referência | 1 | prune |

## Oportunidades por retorno estimado

Ordenadas por impacto x custo x risco, com a heurística de hotpath aplicada: código do caminho
quente vem antes de código grande que quase ninguém chama. Confiança 🟢 coberto e entendido ·
🟡 parcial · 🔴 sem prova de comportamento.

| # | Conf. | Verbo | Contexto | Custo | Oportunidade | Arquivo |
|---:|:---:|---|---|---|---|---|
| 1 | 🟢 | decouple | `nucleo-utilitario-e-erro` | baixo | Inverter a única dependência que fecha o ciclo entre o utilitário geral e a REST API | [`OPP-20261006-4PWK`](nucleo-utilitario-e-erro/opportunities/OPP-20261006-4PWK.md) |
| 2 | 🟡 | optimize | `bootstrap-e-carregamento` | médio | Carregar os 47 controllers da REST API sob demanda, não em toda visita ao site | [`OPP-20261006-Z5EA`](bootstrap-e-carregamento/opportunities/OPP-20261006-Z5EA.md) |
| 3 | 🟢 | restructure | `nucleo-utilitario-e-erro` | baixo | Extrair para um trait o bloco de compatibilidade de propriedade dinâmica, repetido em quatro classes | [`OPP-20261006-6AIT`](nucleo-utilitario-e-erro/opportunities/OPP-20261006-6AIT.md) |
| 4 | 🟢 | decouple | `l10n-e-traducoes` | baixo | Tirar o carregador de script de dentro do módulo de tradução | [`OPP-20261006-ZBCJ`](l10n-e-traducoes/opportunities/OPP-20261006-ZBCJ.md) |
| 5 | 🟡 | optimize | `bootstrap-e-carregamento` | baixo | Tirar as 242 funções depreciadas do caminho quente de toda requisição | [`OPP-20261006-VNIX`](bootstrap-e-carregamento/opportunities/OPP-20261006-VNIX.md) |
| 6 | 🟡 | simplify | `capacidades-e-papeis` | baixo | Unificar os dois blocos gêmeos de 50 linhas dentro de map_meta_cap() | [`OPP-20261006-QSOS`](capacidades-e-papeis/opportunities/OPP-20261006-QSOS.md) |
| 7 | 🟡 | restructure | `requisicao-de-loopback` | médio | Unificar o preâmbulo da requisição de loopback, hoje escrito cinco vezes | [`OPP-20261006-HXU3`](requisicao-de-loopback/opportunities/OPP-20261006-HXU3.md) |
| 8 | 🟡 | restructure | `rest-api` | baixo | Unificar os dois controllers de revisão, que compartilham 172 linhas idênticas | [`OPP-20261006-X5DQ`](rest-api/opportunities/OPP-20261006-X5DQ.md) |
| 9 | 🟡 | restructure | `rest-api` | baixo | Unificar o cabeçalho repetido em sete controllers de leitura | [`OPP-20261006-7KU6`](rest-api/opportunities/OPP-20261006-7KU6.md) |
| 10 | 🟡 | restructure | `temas-e-hierarquia-de-templates` | médio | Unificar o cartão de tema, hoje escrito em cinco lugares | [`OPP-20261006-AWAK`](temas-e-hierarquia-de-templates/opportunities/OPP-20261006-AWAK.md) |
| 11 | 🟡 | simplify | `posts-e-tipos-de-conteudo` | médio | Tornar declarativo o registro dos 16 tipos de conteúdo do núcleo | [`OPP-20261006-BZMW`](posts-e-tipos-de-conteudo/opportunities/OPP-20261006-BZMW.md) |
| 12 | 🟢 | standardize | `convencao-de-codigo` | médio | Reduzir as 336 supressões de regra de estilo, 139 delas de convenção de nome | [`OPP-20261006-JF2Z`](convencao-de-codigo/opportunities/OPP-20261006-JF2Z.md) |
| 13 | 🟢 | standardize | `convencao-de-codigo` | baixo | Alinhar os únicos desvios de estilo que não têm contrato externo prendendo | [`OPP-20261006-WOGR`](convencao-de-codigo/opportunities/OPP-20261006-WOGR.md) |
| 14 | 🟡 | restructure | `midia-e-anexos` | médio | Quebrar o bloco único de 1.248 linhas que imprime todos os templates de mídia | [`OPP-20261006-RVVK`](midia-e-anexos/opportunities/OPP-20261006-RVVK.md) |
| 15 | 🟡 | restructure | `admin-list-tables` | médio | Quebrar o método de 791 linhas que desenha uma linha da tabela de plugins | [`OPP-20261006-JCTO`](admin-list-tables/opportunities/OPP-20261006-JCTO.md) |
| 16 | 🟡 | restructure | `importacao-e-exportacao` | médio | Separar a consulta da serialização na exportação de conteúdo | [`OPP-20261006-JEE6`](importacao-e-exportacao/opportunities/OPP-20261006-JEE6.md) |
| 17 | 🔴 | restructure | `capacidades-e-papeis` | alto | Quebrar map_meta_cap() por família de capacidade | [`OPP-20261006-TTMK`](capacidades-e-papeis/opportunities/OPP-20261006-TTMK.md) |
| 18 | 🔴 | restructure | `wp-query` | alto | Quebrar WP_Query::get_posts() em etapas nomeadas | [`OPP-20261006-AB2U`](wp-query/opportunities/OPP-20261006-AB2U.md) |
| 19 | 🔴 | restructure | `rewrite-e-permalinks` | alto | Quebrar redirect_canonical() por caso de redirecionamento | [`OPP-20261006-EUEM`](rewrite-e-permalinks/opportunities/OPP-20261006-EUEM.md) |
| 20 | 🔴 | restructure | `posts-e-tipos-de-conteudo` | alto | Quebrar wp_insert_post() em etapas nomeadas | [`OPP-20261006-BPTS`](posts-e-tipos-de-conteudo/opportunities/OPP-20261006-BPTS.md) |
| 21 | 🔴 | restructure | `wp-query` | médio | Quebrar WP_Query::parse_query() por grupo de variável de consulta | [`OPP-20261006-YLL6`](wp-query/opportunities/OPP-20261006-YLL6.md) |
| 22 | 🔴 | restructure | `html-api` | alto | Quebrar step_in_body() por grupo de tag | [`OPP-20261006-UBIS`](html-api/opportunities/OPP-20261006-UBIS.md) |
| 23 | 🔴 | restructure | `theme-json-e-estilos-globais` | médio | Achatar o aninhamento de nove níveis da resolução de estilo por bloco | [`OPP-20261006-QTFR`](theme-json-e-estilos-globais/opportunities/OPP-20261006-QTFR.md) |
| 24 | 🟡 | modularize | `nucleo-utilitario-e-erro` | alto | Separar os 124 assuntos que convivem em functions.php | [`OPP-20261006-A7VJ`](nucleo-utilitario-e-erro/opportunities/OPP-20261006-A7VJ.md) |
| 25 | 🟡 | modularize | `posts-e-tipos-de-conteudo` | alto | Separar os 69 assuntos que convivem em post.php | [`OPP-20261006-7JXV`](posts-e-tipos-de-conteudo/opportunities/OPP-20261006-7JXV.md) |
| 26 | 🟡 | modularize | `theme-json-e-estilos-globais` | alto | Separar a classe de 5.975 linhas que resolve theme.json | [`OPP-20261006-4AWL`](theme-json-e-estilos-globais/opportunities/OPP-20261006-4AWL.md) |
| 27 | 🟡 | modularize | `customize` | alto | Separar o gerente de 6.147 linhas e 117 métodos do Customizer | [`OPP-20261006-332Q`](customize/opportunities/OPP-20261006-332Q.md) |
| 28 | 🟡 | modularize | `xmlrpc` | alto | Separar o servidor XML-RPC de 7.264 linhas por família de método | [`OPP-20261006-ZXHZ`](xmlrpc/opportunities/OPP-20261006-ZXHZ.md) |
| 29 | 🟡 | modularize | `midia-e-anexos` | alto | Separar os 56 assuntos que convivem em media.php | [`OPP-20261006-FQVS`](midia-e-anexos/opportunities/OPP-20261006-FQVS.md) |
| 30 | 🔴 | prune | `retrocompatibilidade-e-codigo-sem-referencia` | alto | As 253 funções sem referência estática não são código morto, e a medição que prova isso | [`OPP-20261006-26VC`](retrocompatibilidade-e-codigo-sem-referencia/opportunities/OPP-20261006-26VC.md) |

### Como a priorização foi feita, e o que faltou

A heurística do protocolo tem três pernas: alto acoplamento, alta frequência de execução e
alta taxa de mudança no histórico git. **A terceira não existe aqui:** esta árvore não tem
`.git` próprio (lacuna L1 da alma), logo nenhuma oportunidade pôde ser ordenada por
frequência de alteração. O substituto usado foi a contagem de `@since` e `@deprecated` por
arquivo, que mede em quantas versões o arquivo foi mexido. Pelos dois maiores:
`wp-includes/functions.php` com 386 `@since` e `wp-includes/post.php` com 326.

As duas pernas que existem foram medidas, não estimadas:

- **frequência de execução:** fechamento de `require` em profundidade de chave zero, ou seja,
  o que é carregado sem nenhuma condição. Resultado: **326 arquivos e 273.929 linhas em toda
  requisição do site público**, 43,1% das 634.999 linhas da árvore.
- **acoplamento:** o grafo medido de `_reversa_sdd/architecture/architecture-graph.json`,
  1.249 arestas entre módulos e 254 ciclos de dois módulos, com peso por direção. O peso por
  direção é o que desempata, e é a medida que nenhum artefato anterior usava para priorizar.

## Estrutura

```
_reversa_refactor/
  README.md                         (este arquivo)
  <contexto>/                        (feature, módulo ou caso de uso)
    opportunities/                   (oportunidades detectadas, uma por arquivo)
    transformations/
      OPP-<data>-<sufixo>-<slug>/
        plan.html                    (relatório visual do plano, antes de tocar arquivo)
        safety-net/                  (testes de caracterização + resultado verde/vermelho)
        before-after/                (evidência: medição, prova de equivalência, prova de morte)
        CHG-NNN.diff                 (diffs aplicados, fonte de reversão)
        transformation.md            (registro conforme opportunity-schema.md)
    generated/                       (index e catalog regeneráveis, nunca editados à mão)
```

## O que este registro não fez

- **Não aplicou nenhuma transformação.** Nenhuma pasta `transformations/<OPP>/` existe, e
  nenhum arquivo do projeto foi tocado. Propor e aplicar são atos separados.
- **Não escolheu a oportunidade a atacar.** A escolha é de uma pessoa, e cada transformação
  passa pelo especialista com gate.
- **Não escreveu em `.reversa/state.json`.** A regra absoluta do protocolo é que este registro
  escreve apenas em `_reversa_refactor/`.

## Reprodutibilidade

Toda medida citada nas oportunidades sai de um script desta passada, em
`.reversa/work/reversa-refactor/`:

| Script | O que mede |
|---|---|
| `phpstruct.py` | estrutura de PHP sem runtime PHP: classe, método, linhas, aninhamento, complexidade, parâmetros |
| `resumo.py` | os piores casos por métrica |
| `medir_hotpath.py` | fechamento de `require` em profundidade de chave zero, e `@since`/`@deprecated` por arquivo |
| `medir_duplicacao.py` | duplicação por janela de 22 linhas lógicas, separando projeto de biblioteca vendorizada |
| `medir_padroes.py` | referência estática, convenção de nome, dependência concreta |
| `medir_prune_modular.py` | candidato a morto depois de descontar entrada dinâmica, e assuntos por arquivo |
| `medir_dinamico.py` | pontos que montam nome de callback em tempo de execução |
| `medir_ciclos.py` | ciclos de dois módulos e assimetria de peso, a partir do grafo medido |
| `dados.py` e `gerar.py` | fonte de verdade das oportunidades e a gravação deste registro |
| `verificar.py` | confere arquivo, linha, âncora e link de tudo que foi gravado |
