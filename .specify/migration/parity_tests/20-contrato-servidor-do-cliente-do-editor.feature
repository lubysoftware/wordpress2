# language: pt
# spec-id: PT-020
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/editor-de-blocos.md · _reversa_sdd/flowcharts/block-supports.md · _reversa_sdd/flowcharts/block-bindings.md · _reversa_sdd/flowcharts/interactivity-api.md · _reversa_sdd/flowcharts/script-modules.md · _reversa_sdd/flowcharts/theme-json-e-estilos-globais.md · _reversa_sdd/flowcharts/style-engine.md
#   target_architecture: BC-07 Apresentação · BC-09 Superfícies de Programação · plataforma/tema
#   paradigma_alvo: ONDE O GAP DE PARADIGMA É ZERO — o lado cliente já é TypeScript na origem; há ADOÇÃO, não tradução
#   regras: BR-MIGRAR-117 (ESC-CLIENTE)
#   fatia: 12 — pontas de consumo (blocos do núcleo), com o lado servidor nas fatias 1 e 9
#   area_da_decisao_2: ÁREA 1 — contrato servidor para cliente, BYTE A BYTE
#   lacuna: wp-includes/js/dist/ AUSENTE nesta árvore — o lado cliente dos 5 módulos do editor não está aqui
#
# O ÚNICO ARQUIVO DO CONJUNTO EM QUE NÃO HÁ MUDANÇA DE PARADIGMA.
# O fonte do editor em bloco e da API de interatividade JÁ É TypeScript na origem,
# e é dele que o porte parte. `ESC-CLIENTE` o adota como dependência externa COM
# VERSÃO CRAVADA, e NÃO o reescreve: reescrever afastaria do idêntico.
#
# O QUE ENTRA NO PORTE, e é o que este arquivo verifica: o LADO SERVIDOR que
# alimenta esse cliente — o registro de scripts, o registro dos 116 blocos por
# arquivo de manifesto de bloco, a configuração de tema em arquivo, o motor de
# estilo, os endpoints de API do editor e a serialização de bloco dentro da
# coluna de conteúdo.
#
# E a assimetria que define a paridade aqui: o cliente não é nosso, logo o
# contrato servidor→cliente é BYTE A BYTE. Não há margem de negociação com um
# consumidor que este porte não pode mudar.

Funcionalidade: Contrato do lado servidor que alimenta o cliente do editor
  Como o cliente do editor em bloco, adotado como dependência externa
  Quero receber do servidor exatamente o que o legado entrega
  Para montar sem erro sobre a saída do sistema novo, sem ter sido reescrito

  Contexto:
    Dado o cliente do editor na mesma versão cravada nas duas metades
    E o mesmo conjunto de blocos, temas e configuração de tema nas duas
    E o cache de objeto desligado nas duas metades

  @paridade @critico @contrato
  Cenário: O registro de blocos entregue ao cliente é idêntico byte a byte
    Dado os blocos do núcleo registrados por arquivo de manifesto
    Quando o registro é entregue ao cliente pelas duas metades
    Então o número de blocos registrados é idêntico
    E o conjunto de campos de cada registro é idêntico
    E o valor de cada campo é idêntico byte a byte
    E a ordem dos blocos no registro é idêntica
    E nenhum bloco do legado está ausente no sistema novo

  @paridade @critico @contrato
  Cenário: A configuração de tema resolvida é entregue com a mesma estrutura e os mesmos valores
    Dado a configuração de tema do tema ativo, somada à do núcleo
    Quando a configuração resolvida é entregue ao cliente pelas duas metades
    Então a estrutura entregue é idêntica byte a byte
    E a precedência entre a configuração do núcleo, do tema e do usuário é a mesma
    E os valores calculados a partir de escala são idênticos nas duas

  @paridade @critico @contrato @ordem-de-emissao
  Cenário: O motor de estilo produz as mesmas regras, na mesma ordem
    Dado um conjunto de atributos de bloco que geram estilo
    Quando o estilo é gerado pelas duas metades
    Então as regras produzidas são idênticas byte a byte
    E a ordem das regras na folha emitida é idêntica
    E o nome de cada classe gerada é idêntico
    E nenhuma das duas reordena nem minifica o que a outra não reordena

  @paridade @critico @contrato
  Cenário: A serialização de bloco dentro da coluna de conteúdo é idêntica
    Dado um documento com blocos aninhados, atributos e blocos reutilizáveis
    Quando ele é gravado pelas duas metades
    Então a cadeia serializada gravada na coluna é idêntica byte a byte
    E o delimitador de cada bloco é idêntico, inclusive o espaçamento
    E a ordem dos atributos dentro do delimitador é idêntica
    Quando a mesma cadeia é lida de volta
    Então a árvore de blocos reconstruída é idêntica nas duas

  @paridade @critico @contrato
  Cenário: Os suportes de bloco e as vinculações resolvem para o mesmo resultado
    Dado blocos que declaram suportes e blocos com vinculação de atributo a fonte
    Quando eles são renderizados no servidor pelas duas metades
    Então a marcação emitida é idêntica byte a byte
    E o conjunto de atributos resolvidos por vinculação é idêntico
    E a fonte consultada por cada vinculação é a mesma nas duas

  @paridade @critico @contrato
  Cenário: O registro de scripts e de módulos entregue ao cliente preserva ordem e dependência
    Dado o conjunto de pacotes de script e de módulos que o editor consome
    Quando a página do editor é servida pelas duas metades
    Então o conjunto de pacotes enfileirados é idêntico
    E a ordem de enfileiramento é idêntica
    E o grafo de dependência declarado é idêntico
    E a estratégia de carregamento de cada pacote é idêntica

  @paridade @critico @contrato
  Cenário: Os endpoints de API que o editor consome respondem idêntico
    Dado cada endpoint de API que o cliente do editor consome
    Quando ele é pedido às duas metades com os mesmos parâmetros
    Então o corpo da resposta é idêntico byte a byte
    E o código HTTP é idêntico
    E o formato de erro é idêntico byte a byte

  # A LACUNA, declarada em vez de contornada.
  @paridade
  Cenário: O que o cliente desenha depois do ponto de montagem não tem cenário aqui
    Dado que o lado cliente dos cinco módulos do editor não está nesta árvore
    Quando o escopo deste arquivo é avaliado
    Então ele cobre apenas o que o servidor entrega
    E nenhum cenário deste arquivo afirma nada sobre o que o cliente desenha
    E a verificação do cliente é responsabilidade do projeto de origem dele, não deste porte

  @paridade @critico
  Cenário: A versão do cliente é cravada, e o contrato do servidor é da mesma versão
    Dado a versão do cliente do editor congelada no corte final
    Quando o contrato do servidor é publicado
    Então ele declara a mesma versão do cliente
    E uma atualização do cliente sem revisão do contrato do servidor é tratada como mudança, não como manutenção
    E a deriva entre a referência do legado e a versão adotada é registrada como risco

  @paridade @concorrencia
  Cenário: Duas sessões de edição concorrentes recebem a configuração do seu próprio contexto
    Dado dois atores editando conteúdo de tipos diferentes ao mesmo tempo
    Quando os dois recebem o registro de blocos e a configuração de tema no mesmo processo
    Então cada um recebe o recorte correspondente ao seu próprio contexto
    E nenhum dos dois recebe recorte do outro
    E o resultado é idêntico ao de duas sessões em sequência no oráculo
