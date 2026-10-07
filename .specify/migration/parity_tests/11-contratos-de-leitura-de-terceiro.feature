# language: pt
# spec-id: PT-011
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/rest-api.md · _reversa_sdd/flowcharts/sitemaps.md · _reversa_sdd/flowcharts/feeds-rss-atom.md · _reversa_sdd/flowcharts/oembed-e-embeds.md · _reversa_sdd/flowcharts/rewrite-e-permalinks.md
#   target_architecture: BC-08 Contratos de Leitura · BC-09 Superfícies de Programação · entradas/ (roteador)
#   paradigma_alvo: Opção 3 híbrido — URL pública preservada; o roteador é a indireção que o alvo tem e o legado não
#   regras: BR-MIGRAR-116 (ESC-ORACULO, área 1) · BR-MIGRAR-074 (I7)
#   fatia: 2 (somente leitura: sitemap, feeds, oEmbed, OPML) e 4 (API somente leitura)
#   area_da_decisao_2: ÁREA 1 — saída BYTE A BYTE, contrato de terceiro
#   casos_de_uso: UC-01, UC-44, UC-45, UC-47
#
# ESTAS SÃO AS PRIMEIRAS SUPERFÍCIES A VIRAR, E A RAZÃO É O CRITÉRIO.
# São somente leitura e têm critério byte a byte: uma divergência não pode
# corromper estado compartilhado, e o retorno é uma regra de proxy. As fatias de
# escrita vêm depois porque, com banco compartilhado, uma divergência PERSISTE.
#
# São 7 superfícies produzidas, 29 integrações e 64 endpoints documentados.

Funcionalidade: Contratos de leitura consumidos por terceiro
  Como cliente de API, leitor de feed, buscador ou serviço de incorporação
  Quero que a resposta do sistema novo seja idêntica byte a byte à do legado
  Para que nenhum consumidor externo precise saber que houve um porte

  Contexto:
    Dado um oráculo com o legado na mesma versão e o mesmo conteúdo semeado
    E o mesmo conjunto de opções de site nas duas metades
    E o cache de objeto desligado nas duas metades
    E o relógio e a semente de aleatoriedade fixados igualmente nas duas

  @paridade @critico @contrato
  Esquema do Cenário: A resposta de cada superfície de leitura é idêntica byte a byte
    Dado a superfície "<superficie>"
    Quando ela é pedida às duas metades com os mesmos parâmetros
    Então o corpo da resposta é idêntico byte a byte
    E o código HTTP é idêntico
    E o tipo de conteúdo declarado é idêntico
    E a ordem dos campos ou dos elementos do corpo é idêntica
    E nenhuma divergência é tolerada nesta superfície

    Exemplos:
      | superficie               |
      | api-rest-somente-leitura |
      | xml-rpc                  |
      | feed-rss                 |
      | feed-atom                |
      | mapa-do-site             |
      | oembed                   |
      | opml                     |
      | habilidades-via-api      |

  @paridade @critico @contrato
  Cenário: O cabeçalho de resposta que o consumidor usa é preservado
    Dado uma superfície de leitura que emite cabeçalho de cache ou de paginação
    Quando ela é pedida às duas metades
    Então o conjunto de cabeçalhos que o consumidor usa é idêntico
    E o valor de cada um é idêntico, ignorando apenas os que carregam data corrente
    E nenhum cabeçalho novo é introduzido pelo sistema novo

  @paridade @critico @contrato
  Cenário: O formato de erro de cada superfície é preservado
    Dado um pedido inválido para cada superfície de leitura
    Quando ele é feito às duas metades
    Então o código HTTP é idêntico
    E o corpo do erro é idêntico byte a byte, inclusive o identificador do erro
    E nenhuma das duas acrescenta detalhe que a outra não dá

  @paridade @critico @contrato
  Cenário: A URL pública é preservada, inclusive a forma do permalink
    Dado cada estrutura de permalink que o legado aceita
    Quando a mesma URL é pedida às duas metades
    Então a resposta é idêntica byte a byte
    E o redirecionamento canônico, onde existe, aponta para a mesma URL nas duas
    E nenhuma URL pública do legado deixou de existir no sistema novo

  @paridade @critico @contrato
  Cenário: A paginação e o limite de cada superfície são os do legado
    Dado conteúdo suficiente para ultrapassar o limite padrão de cada superfície
    Quando a primeira, a última e uma página intermediária são pedidas às duas metades
    Então cada resposta é idêntica byte a byte
    E o limite padrão aplicado é o mesmo nas duas
    Quando um limite acima do máximo é pedido
    Então as duas aplicam o mesmo máximo, com a mesma resposta

  # I7: toda rota de API DEVE declarar permissão explícita — e rota sem declaração
  # FUNCIONA, falhando ABERTA. BR-HUMANA-008 ainda não decidiu se isso muda.
  @paridade @critico @divida-herdada
  Cenário: Rota de leitura sem declaração de permissão continua funcionando nas duas metades
    Dado uma rota de leitura registrada sem retorno de permissão declarado
    Quando ela é pedida sem autenticação às duas metades
    Então as duas respondem com sucesso
    E nenhuma das duas nega por ausência de declaração
    E as duas emitem o mesmo aviso, ou a mesma ausência de aviso

  # ÁREA 2 cruzando com a ÁREA 1: a resposta de leitura atravessa pontos de filtro
  # que DEVOLVEM VALOR, e é o valor devolvido que forma o byte.
  @paridade @critico @contrato @ordem-de-emissao
  Cenário: A resposta de leitura atravessa os mesmos pontos de filtro, na mesma ordem
    Dado uma extensão registrada em cada ponto de filtro da montagem da resposta
    Quando a superfície é pedida às duas metades
    Então a sequência de pontos acionados é idêntica
    E o valor que cada ponto recebe é idêntico byte a byte
    E a resposta final é idêntica byte a byte

  @paridade @critico @concorrencia
  Cenário: Leituras concorrentes com contextos diferentes não se contaminam
    Dado duas leituras que pedem recortes diferentes da mesma superfície
    Quando as duas são atendidas ao mesmo tempo no mesmo processo
    Então cada resposta é idêntica byte a byte à do oráculo para o seu recorte
    E nenhuma contém elemento do recorte da outra
    Quando uma das leituras é autenticada e a outra anônima
    Então a resposta anônima não contém nada que só a autenticada veria

  # O arnês de Parallel Run espelha a LEITURA para o oráculo. Esta é a mecânica
  # do shadow mode, e as fatias 2 e 4 são somente leitura de propósito para que
  # a primeira comparação não dependa de ordem de escrita.
  @paridade @critico @contrato
  Cenário: O espelho de leitura compara as duas saídas sem o oráculo servir tráfego
    Dado o arnês de paridade ativo sobre uma superfície de leitura virada
    Quando uma leitura real chega ao proxy
    Então ela é atendida pela metade nova
    E a mesma leitura é espelhada ao oráculo
    E o oráculo não responde a nenhum cliente
    E a comparação das duas saídas é registrada com a quebra por área, não como número único
