# language: pt
# spec-id: PTS-016
# rastreabilidade:
#   process_flows: _reversa_sdd/migration/target_screens.md § "Tela: <cada tela da tabela de Exemplos>"
#   target_architecture: BC-07 Apresentação · entradas/ (rota preservada) · AD-12 (caminho público preservado)
#   paradigma_alvo: Opção 3 híbrido — modo MODERNIZADO: contrato SEMÂNTICO, SEM comparação byte a byte
#   grupo de telas: Front-end · 20 telas em modo modernizado
#   modo: modernizado · deviations: DEV-001 em todas
#   fatia: 3 — leitura de tema
#   area_da_decisao_2: comportamento de caso de uso (os 47 UCs), tolerância de 1%
#
# O QUE O MODO MODERNIZADO EXIGE, e o que ele NÃO exige.
# EXIGE: hierarquia de componentes, eventos declarados, conteúdo textual e os
# quatro estados (ocioso, carregando, erro, sucesso).
# NÃO EXIGE: comparação byte a byte nem comparação de pixel.
#
# DUAS RESTRIÇÕES QUE NÃO SÃO DE APRESENTAÇÃO:
#   1. a diferença de texto tem de ser ZERO: 2.984 strings foram copiadas
#      verbatim e NENHUMA revisão linguística foi aprovada. A chave do catálogo
#      é o texto inglês, e é assim que ele chega ao alvo.
#   2. a moldura do painel NÃO é um envelope único: das 80 telas do painel, 68
#      carregam a moldura e 12 NÃO — entre elas o instalador, que abre o próprio
#      cabeçalho de documento, e o reparo de banco, que roda SEM autenticação.
#      São DOIS contratos de documento. Um alvo que aplicar um layout único
#      quebra 12 telas, e quebra calado.

Funcionalidade: Contrato de tela do grupo Front-end
  Como quem opera a virada das superfícies deste grupo
  Quero verificar o contrato semântico de cada tela modernizada
  Para que hierarquia, eventos, texto e os quatro estados correspondam ao legado
  sem exigir igualdade de bytes

  Contexto:
    Dado um oráculo com o legado na mesma versão e o mesmo conteúdo semeado
    E a rota pública de cada tela preservada byte a byte
    E a diferença de texto exigida igual a zero, ignorando espaço à direita

  @paridade-contrato-de-tela
  Esquema do Cenário: Cada tela modernizada deste grupo respeita o contrato semântico
    Dado a tela "<tela>", de identificador "<id>", com origem no legado em "<origem>"
    Quando a rota dela é pedida à implementação alvo e ao oráculo
    Então a hierarquia de componentes da saída alvo corresponde à da spec desta tela
    E todo evento declarado na spec existe na saída alvo
    E todo texto literal da spec aparece idêntico à chave do catálogo, em inglês
    E os quatro estados declarados na spec são alcançáveis na saída alvo
    E o contrato de documento desta tela é o declarado na spec, moldura própria ou herdada
    E a capacidade exigida para abrir a tela é a mesma nas duas metades

    Exemplos:
      | tela                               | id      | origem                                                                |
      | front-end-home-twentytwentyfive    | SCR-012 | wp-content/themes/twentytwentyfive/templates/home.html                |
      | front-end-home-twentytwentyfour    | SCR-013 | wp-content/themes/twentytwentyfour/templates/home.html                |
      | front-end-home-twentytwentythree   | SCR-014 | wp-content/themes/twentytwentythree/templates/home.html               |
      | front-end-fallback-index           | SCR-015 | wp-content/themes/twentytwentyfive/templates/index.html               |
      | front-end-post-individual          | SCR-016 | wp-content/themes/twentytwentyfive/templates/single.html              |
      | front-end-pagina                   | SCR-017 | wp-content/themes/twentytwentyfive/templates/page.html                |
      | front-end-arquivo                  | SCR-018 | wp-content/themes/twentytwentyfive/templates/archive.html             |
      | front-end-busca                    | SCR-019 | wp-content/themes/twentytwentyfive/templates/search.html              |
      | front-end-404                      | SCR-020 | wp-content/themes/twentytwentyfive/templates/404.html                 |
      | front-end-pagina-sem-titulo        | SCR-021 | wp-content/themes/twentytwentyfive/templates/page-no-title.html       |
      | front-end-pagina-larga             | SCR-022 | wp-content/themes/twentytwentyfour/templates/page-wide.html           |
      | front-end-pagina-com-barra-lateral | SCR-023 | wp-content/themes/twentytwentyfour/templates/page-with-sidebar.html   |
      | front-end-post-com-barra-lateral   | SCR-024 | wp-content/themes/twentytwentyfour/templates/single-with-sidebar.html |
      | front-end-tela-em-branco           | SCR-025 | wp-content/themes/twentytwentythree/templates/blank.html              |
      | front-end-blog-alternativo         | SCR-026 | wp-content/themes/twentytwentythree/templates/blog-alternative.html   |
      | front-end-fragmento-cabecalho      | SCR-027 | wp-content/themes/twentytwentyfive/parts/header.html                  |
      | front-end-fragmento-rodape         | SCR-028 | wp-content/themes/twentytwentyfive/parts/footer.html                  |
      | front-end-fragmento-barra-lateral  | SCR-029 | wp-content/themes/twentytwentyfive/parts/sidebar.html                 |
      | front-end-fragmento-meta-do-post   | SCR-030 | wp-content/themes/twentytwentyfour/parts/post-meta.html               |
      | front-end-fragmento-comentarios    | SCR-031 | wp-content/themes/twentytwentythree/parts/comments.html               |

  @paridade-contrato-de-tela
  Cenário: A diferença de texto do grupo é zero, porque nenhuma revisão foi aprovada
    Dado o conjunto de mensagens literais de todas as telas deste grupo
    Quando ele é comparado entre a implementação alvo e o oráculo
    Então a diferença é zero, ignorando apenas espaço à direita
    E nenhuma correção de rótulo foi aplicada
    E qualquer correção desejada entra como deviation de tipo correção, não como ajuste silencioso

  @paridade-contrato-de-tela
  Cenário: A rota pública de cada tela deste grupo é preservada
    Dado cada rota pública das telas deste grupo
    Quando ela é pedida às duas metades
    Então as duas respondem na mesma URL
    E nenhuma rota do legado deixou de existir no sistema novo
    E nenhuma rota nova foi introduzida neste grupo

  # LACUNA-IN-09: os três temas empacotados entram no porte? Sem tema o site
  # público NÃO RENDERIZA, logo esta fatia não tem critério de aceite até a
  # resposta chegar. As linhas de Exemplos nomeiam os três de propósito.
  @paridade-contrato-de-tela
  Cenário: O escopo dos temas empacotados é pré-requisito do critério de aceite deste grupo
    Dado os três temas empacotados na árvore
    Quando o escopo do porte é consultado
    Então nenhuma regra do catálogo diz o que acontece com eles
    E sem tema padrão nenhuma tela deste grupo tem saída a comparar
    E a decisão de escopo é registrada antes de a fatia de leitura de tema ser planejada

  @paridade-contrato-de-tela
  Cenário: Os fragmentos de tema são comparados dentro da tela que os invoca
    Dado cada fragmento de tema listado na tabela de Exemplos
    Quando a tela que o invoca é servida pelas duas metades
    Então o fragmento aparece na mesma posição da saída nas duas
    E o conteúdo dele corresponde à spec do fragmento
    E nenhum fragmento é comparado fora da tela que o invoca
