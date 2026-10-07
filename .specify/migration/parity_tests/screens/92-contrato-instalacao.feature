# language: pt
# spec-id: PTS-017
# rastreabilidade:
#   process_flows: _reversa_sdd/migration/target_screens.md § "Tela: <cada tela da tabela de Exemplos>"
#   target_architecture: BC-11 Operação do Software · entradas/ (rota preservada) · AD-12 (caminho público preservado)
#   paradigma_alvo: Opção 3 híbrido — modo MODERNIZADO: contrato SEMÂNTICO, SEM comparação byte a byte
#   grupo de telas: Instalacao · 4 telas em modo modernizado
#   modo: modernizado · deviations: DEV-001 em todas
#   fatia: 0 e 1 — fundação verificável e núcleo compartilhado
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

Funcionalidade: Contrato de tela do grupo Instalacao
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
      | tela                      | id      | origem                    |
      | configuracao-do-wp-config | SCR-032 | wp-admin/setup-config.php |
      | instalador                | SCR-033 | wp-admin/install.php      |
      | atualizacao-do-banco      | SCR-034 | wp-admin/upgrade.php      |
      | reparo-do-banco           | SCR-035 | wp-admin/maint/repair.php |

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
