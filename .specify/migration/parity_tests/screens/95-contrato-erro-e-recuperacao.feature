# language: pt
# spec-id: PTS-020
# rastreabilidade:
#   process_flows: _reversa_sdd/migration/target_screens.md § "Tela: <cada tela da tabela de Exemplos>"
#   target_architecture: BC-11 Operação do Software · entradas/ (rota preservada) · AD-12 (caminho público preservado)
#   paradigma_alvo: Opção 3 híbrido — modo MODERNIZADO: contrato SEMÂNTICO, SEM comparação byte a byte
#   grupo de telas: Erro e recuperacao · 2 telas em modo modernizado
#   modo: modernizado · deviations: DEV-001 em todas · DEV-003 (SCR-112, SCR-113)
#   fatia: 9 — painel (superfície compartilhada de erro)
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

Funcionalidade: Contrato de tela do grupo Erro e recuperacao
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
      | tela                  | id      | origem                                           |
      | tela-de-erro-generica | SCR-112 | wp-includes/functions.php:3907                   |
      | tela-de-erro-critico  | SCR-113 | wp-includes/class-wp-fatal-error-handler.php:174 |

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

  # DEV-003: as telas deste grupo passam pelo MESMO renderizador, que NÃO CARREGA
  # CSS ALGUM do painel — escreve a folha inteira embutida. A comparação de CSS
  # destas telas usa `tokens-derived.md` como fonte, NÃO `tokens.md`.
  @paridade-contrato-de-tela @critico
  Cenário: A folha embutida destas telas é comparada contra os tokens derivados
    Dado a folha de estilo embutida que o oráculo escreve nestas telas
    Quando a saída alvo é comparada
    Então os doze valores sem token no sistema de design são comparados contra os tokens derivados
    E o cinza de fundo do documento NÃO é tratado como igual ao cinza do sistema de design
    E a diferença de um ponto por canal entre os dois é detectada por comparação, não por olho
    E nenhuma das duas telas carrega folha de estilo do painel

  # O SEGUNDO ACHADO DE DEV-003: a pilha de fonte TROCA INTEIRA quando a direção
  # do texto é da direita para a esquerda. Isso é COMPORTAMENTO OBSERVÁVEL, não
  # estilo.
  @paridade-contrato-de-tela @critico
  Cenário: A pilha de fonte troca inteira em direção da direita para a esquerda
    Dado a direção de texto da esquerda para a direita
    Quando a tela é servida pelas duas metades
    Então a pilha de fonte emitida é idêntica nas duas
    Quando a direção de texto passa a ser da direita para a esquerda
    Então a pilha de fonte emitida TROCA INTEIRA nas duas
    E a pilha trocada é idêntica nas duas
    E a troca é tratada como comportamento observável, não como preferência de estilo

  # A tela de erro genérica é SUPERFÍCIE COMPARTILHADA: 152 pontos de interrupção
  # do legado convergem nela, e cada tela que interrompe TRANSITA para ela.
  @paridade-contrato-de-tela @critico
  Cenário: A tela de erro genérica é superfície compartilhada de todos os pontos de interrupção
    Dado cada ponto de interrupção do legado que converge nesta tela
    Quando ele é acionado nas duas metades
    Então as duas servem a mesma tela
    E a mensagem específica daquele ponto é idêntica nas duas
    E o código HTTP é idêntico nas duas
    E nenhuma das duas serve uma tela de erro diferente por ponto
