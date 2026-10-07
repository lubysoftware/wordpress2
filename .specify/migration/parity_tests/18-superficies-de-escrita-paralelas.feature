# language: pt
# spec-id: PT-018
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/xmlrpc.md · _reversa_sdd/flowcharts/rest-api.md · _reversa_sdd/flowcharts/sistema-de-arquivos-e-ftp.md
#   target_architecture: BC-09 Superfícies de Programação · BC-10 Painel · entradas/ (roteador)
#   paradigma_alvo: Opção 3 híbrido — as quatro superfícies entram no porte COM O COMPORTAMENTO ATUAL
#   regras: BR-MIGRAR-107 (ESC-SUPERFICIES) · BR-MIGRAR-008 (P8) · BR-MIGRAR-074 (I7) · BR-MIGRAR-094 (PERM-8)
#   fatia: 10 — superfícies de escrita paralelas
#   area_da_decisao_2: ÁREA 1 — saída byte a byte, contrato de terceiro
#   casos_de_uso: UC-44, UC-45
#
# A FATIA EM QUE NENHUMA SUPERFÍCIE SAI, APESAR DE TRÊS CARDS DO BACKLOG A
# MARCAREM COMO DESCARTÁVEL.
# O catálogo de regras é explícito: as quatro superfícies de escrita paralelas à
# API entram no porte com o comportamento atual. O backlog marca três delas como
# fora de escopo, e o critério declarado ali — "o valor de um descarte não é o
# código que não se escreve: é a superfície que não se precisa defender depois" —
# é bom argumento, MAS A REGRA VENCEU. Esta divergência entre dois artefatos do
# pacote está registrada aqui de propósito, para quem decidir.
#
# O canal assíncrono do painel é por onde METADE DO PAINEL CONVERSA. Cortá-lo não
# é cortar uma superfície obscura.

Funcionalidade: As quatro superfícies de escrita paralelas à API
  Como cliente programático antigo, ou como o próprio painel
  Quero escrever pelas mesmas quatro superfícies do legado
  Para que nenhum consumidor existente deixe de funcionar, inclusive os que o
  backlog gostaria de descontinuar

  Contexto:
    Dado um oráculo com o legado na mesma versão e o mesmo conteúdo semeado
    E as mesmas constantes de restrição definidas nas duas metades
    E o cache de objeto desligado nas duas metades

  @paridade @critico @contrato
  Esquema do Cenário: Cada superfície de escrita existe e responde idêntico
    Dado a superfície de escrita "<superficie>"
    Quando uma operação de escrita válida é enviada às duas metades
    Então o código HTTP é idêntico
    E o corpo da resposta é idêntico byte a byte
    E o efeito no banco é idêntico
    Quando uma operação inválida é enviada
    Então o código HTTP e o corpo do erro são idênticos byte a byte
    E nenhuma das duas descontinua a superfície

    Exemplos:
      | superficie                     |
      | api-rest-escrita               |
      | xml-rpc                        |
      | canal-assincrono-do-painel     |
      | editor-de-arquivo-do-servidor  |

  @paridade @critico @contrato
  Cenário: O protocolo antigo de chamada remota mantém a mesma lista de métodos
    Dado a superfície de chamada remota
    Quando a lista de métodos disponíveis é pedida às duas metades
    Então ela é idêntica, método por método, na mesma ordem
    E nenhum método do legado está ausente no sistema novo
    E nenhum método novo foi acrescentado
    Quando a opção que desliga essa superfície está no valor padrão
    Então as duas se comportam da mesma forma

  @paridade @critico @contrato
  Cenário: O formato de falha do protocolo antigo é preservado
    Dado uma chamada remota com argumento de tipo errado
    Quando ela é enviada às duas metades
    Então as duas devolvem o mesmo código de falha do protocolo
    E a mensagem de falha é idêntica byte a byte
    E o envelope da resposta é idêntico byte a byte

  # O canal assíncrono do painel é por onde METADE DO PAINEL CONVERSA, e a
  # identidade por requisição é pré-requisito dele (implicações 2 e 3).
  @paridade @critico @concorrencia
  Cenário: O canal assíncrono do painel decide pela identidade de cada requisição
    Dado duas contas com papéis diferentes, cada uma com sessão válida
    Quando as duas enviam a mesma ação pelo canal assíncrono ao mesmo tempo
    Então a decisão de cada uma corresponde à sua própria identidade
    E a resposta de cada uma é idêntica à que o oráculo daria para aquela identidade
    E nenhuma resposta contém dado da outra conta

  @paridade @critico @contrato
  Cenário: A ação sem registro no canal assíncrono responde como no legado
    Dado uma ação não registrada no canal assíncrono
    Quando ela é enviada às duas metades
    Então o código HTTP é idêntico
    E o corpo da resposta é idêntico byte a byte
    E nenhuma das duas trata a ação desconhecida de forma mais estrita que a outra

  @paridade @critico
  Cenário: A verificação de uso único do formulário é idêntica nas quatro superfícies
    Dado uma escrita enviada sem o campo de uso único
    Quando ela é enviada a cada uma das quatro superfícies, nas duas metades
    Então o comportamento de cada superfície é idêntico nas duas
    E as superfícies que exigem o campo o exigem nas duas
    E as superfícies que não o exigem continuam não o exigindo nas duas

  # O editor de arquivo do servidor é a superfície de escrita mais perigosa do
  # produto, e PERM-8 declara as constantes que a retiram.
  @paridade @critico @divida-herdada
  Cenário: O editor de arquivo do servidor existe, e as constantes o retiram
    Dado nenhuma constante de restrição definida
    Quando um administrador abre o editor de arquivo nas duas metades
    Então as duas o atendem
    Quando a constante de proibição de edição de arquivo é definida
    Então as duas negam, com a mesma mensagem
    Quando a constante de proibição de modificação de arquivo é definida
    Então as duas negam, com a mesma mensagem
    E a revogação acontece antes de qualquer consulta ao papel nas duas

  @paridade @critico @divida-herdada
  Cenário: A verificação de integridade antes de gravar arquivo é a do legado
    Dado uma gravação de arquivo que introduz erro de sintaxe
    Quando ela é enviada às duas metades
    Então as duas aplicam a mesma verificação antes de gravar
    E as duas chegam à mesma decisão
    E onde a verificação depende do protocolo de retorno ao próprio host, as duas falham da mesma forma

  @paridade @critico
  Cenário: HTML bruto nas superfícies de escrita respeita o mesmo privilégio
    Dado um ator sem a capacidade de HTML não filtrado
    Quando ele grava conteúdo com marcação fora do conjunto permitido, por cada uma das quatro superfícies
    Então cada superfície grava o conteúdo saneado, idêntico byte a byte nas duas metades
    E o conjunto de marcação removido é o mesmo em cada superfície, nas duas

  # I7: rota de escrita sem retorno de permissão declarado FUNCIONA — a camada
  # falha ABERTA. BR-HUMANA-008 ainda não decidiu se isso muda, e até decidir o
  # alvo preserva.
  @paridade @critico @divida-herdada
  Cenário: Rota de escrita sem retorno de permissão declarado funciona, nas duas metades
    Dado uma rota de escrita registrada sem retorno de permissão declarado
    Quando ela é chamada sem autenticação nas duas metades
    Então as duas a atendem
    E o efeito no banco é idêntico nas duas
    E nenhuma das duas nega por ausência de declaração
    E esta divergência de default está declarada como dívida herdada nas duas

  # A divergência entre dois artefatos do pacote, registrada para quem decide.
  @paridade @contrato
  Cenário: Nenhuma das quatro superfícies sai, apesar de três cards marcarem o contrário
    Dado o catálogo de regras e o backlog do pacote
    Quando o escopo desta fatia é avaliado
    Então o catálogo de regras determina que as quatro entram no porte
    Mas o backlog marca três delas como fora de escopo
    E a divergência entre os dois artefatos é registrada e não resolvida por este agente
    E até alguém decidir, os cenários deste arquivo valem para as quatro
