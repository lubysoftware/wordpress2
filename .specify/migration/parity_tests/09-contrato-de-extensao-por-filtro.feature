# language: pt
# spec-id: PT-009
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/hooks-e-plugin-api.md · _reversa_sdd/flowcharts/script-e-style-loader.md
#   target_architecture: plataforma/barramento/ · plataforma/arranque/ · AD-03 (barramento síncrono COM retorno) · AD-04 (fronteira de await nos adaptadores) · AD-08 (o barramento NÃO ganha porta)
#   paradigma_alvo: Opção 3 híbrido — o barramento permanece chamada de função na mesma pilha
#   regras: BR-MIGRAR-102 (EXT-FILTROS) · BR-MIGRAR-106 (EXT-ORDEM) · BR-MIGRAR-108 (ESC-FILTRAVEL)
#   fatia: 0 (barramento e ordem de arranque) e 1 (núcleo compartilhado)
#   area_da_decisao_2: ÁREA 2 — byte a byte no VALOR devolvido por hook
#   casos_de_uso: transversal aos 47
#
# A ÁREA DE PARIDADE QUE NENHUM TESTE DE SUPERFÍCIE APANHA.
# São 2.460 pontos de filtro que DEVOLVEM VALOR contra 1.068 que não devolvem:
# 69,7% do gancho devolve valor e o chamador usa o retorno na mesma expressão.
# O filtro intercepta valor NO MEIO DO DOMÍNIO, de propósito — e é por isso que
# AD-08 declara que o barramento NÃO ganha porta hexagonal.
#
# E a resposta humana P3 diz que esse ponto de extensão É O PRODUTO, não acidente
# de implementação. Logo este arquivo não testa uma funcionalidade: testa o
# contrato que o produto vende.

Funcionalidade: Contrato de extensão por ponto de filtro e ordem de arranque
  Como autor de extensão
  Quero que o barramento seja síncrono, reentrante, ordenado por prioridade
  inteira e COM retorno de valor
  Para que toda extensão escrita contra o legado continue produzindo o mesmo
  efeito observável no sistema novo

  Contexto:
    Dado um oráculo com o legado na mesma versão
    E o mesmo conjunto de extensões de teste registrado nas duas metades
    E o cache de objeto desligado nas duas metades

  @paridade @critico
  Cenário: O ponto de filtro devolve valor ao chamador, e o chamador usa o retorno
    Dado um ponto de filtro com uma extensão que transforma o valor recebido
    Quando o ponto é acionado nas duas metades
    Então o valor devolvido é idêntico byte a byte nas duas
    E o chamador usa o valor devolvido na mesma expressão nas duas
    E o valor original, antes da transformação, não aparece na saída de nenhuma das duas

  @paridade @critico @ordem-de-emissao
  Cenário: A ordem é determinística, por prioridade inteira, e empate preserva a ordem de registro
    Dado cinco extensões registradas no mesmo ponto, com prioridades 5, 10, 10, 20 e 20
    Quando o ponto é acionado nas duas metades
    Então a sequência de chamadas é idêntica nas duas
    E as duas extensões de prioridade 10 são chamadas na ordem em que foram registradas, igualmente nas duas
    E o valor que cada extensão recebe é o devolvido pela anterior, nas duas

  @paridade @critico
  Cenário: O barramento é reentrante, e acionar um ponto de dentro de outro funciona
    Dado uma extensão que aciona um segundo ponto de filtro de dentro do primeiro
    Quando o primeiro ponto é acionado nas duas metades
    Então a sequência de chamadas aninhadas é idêntica nas duas
    E o valor final devolvido pelo primeiro ponto é idêntico byte a byte nas duas
    E nenhuma das duas entra em laço infinito nem corta a reentrância

  @paridade @critico
  Cenário: Acionar o mesmo ponto recursivamente mantém o mesmo comportamento
    Dado uma extensão que aciona o PRÓPRIO ponto em que está registrada, com guarda de profundidade
    Quando o ponto é acionado nas duas metades
    Então a profundidade alcançada é a mesma nas duas
    E o valor final é idêntico byte a byte nas duas

  @paridade @critico
  Cenário: O ponto de ação não devolve valor, e a diferença entre os dois tipos é preservada
    Dado um ponto de ação e um ponto de filtro com a mesma extensão registrada
    Quando os dois são acionados nas duas metades
    Então o ponto de filtro devolve valor nas duas
    E o ponto de ação não devolve valor em nenhuma das duas
    E a razão entre pontos que devolvem valor e pontos que não devolvem é a mesma nas duas

  # IMPLICAÇÃO 1 + AD-03: await no meio dos 1.463 pontos de emissão muda a ORDEM
  # DE EMISSÃO do HTML, que é saída observável. AD-04 põe a fronteira de await nos
  # adaptadores exatamente para isso.
  @paridade @critico @ordem-de-emissao
  Cenário: Nenhum ponto de filtro introduz espera que altere a ordem de emissão
    Dado uma página que emite HTML em fragmentos, atravessando pontos de filtro entre eles
    Quando a página é servida pelas duas metades
    Então a resposta completa é idêntica byte a byte nas duas
    E a ordem dos fragmentos na resposta é idêntica nas duas
    E nenhum fragmento aparece antes do fragmento que o precede no oráculo

  @paridade @critico @ordem-de-emissao
  Cenário: A fronteira de espera fica nos adaptadores, e o domínio permanece síncrono
    Dado o sistema novo construído
    Quando a camada de contextos e a de plataforma são inspecionadas
    Então nenhuma delas contém espera assíncrona
    E toda espera assíncrona está na camada de adaptadores
    Quando a mesma página é servida com a entrada de dados já carregada
    Então a resposta é idêntica byte a byte à do oráculo

  # EXT-ORDEM: a ordem de carregamento é CONTRATO PÚBLICO. Um plugin que registra
  # gancho cedo ou tarde demais simplesmente não funciona — e isso é o legado.
  @paridade @critico
  Cenário: A ordem de arranque é contrato público, e registrar cedo ou tarde demais tem o mesmo efeito
    Dado uma extensão que se registra no estágio mais cedo do arranque
    Quando o arranque é executado nas duas metades
    Então ela é chamada nas duas
    Mas uma extensão que se registra depois do estágio em que o ponto é acionado não é chamada
    Quando o arranque é executado com essa segunda extensão
    Então nenhuma das duas a chama
    E a sequência completa de estágios de arranque é idêntica nas duas

  @paridade @critico
  Cenário: Remover uma extensão em execução tem o mesmo efeito nas duas metades
    Dado duas extensões registradas no mesmo ponto
    Quando a primeira remove a segunda durante a sua própria execução
    Então a segunda não é chamada em nenhuma das duas metades
    E o valor final é idêntico byte a byte nas duas
    Quando a primeira se remove a si mesma durante a execução
    Então o valor final é idêntico byte a byte nas duas

  # ESC-FILTRAVEL: toda regra do catálogo é um DEFAULT FILTRÁVEL, e preservar
  # isso É o porte.
  @paridade @critico
  Cenário: Toda regra de negócio continua sendo um default filtrável
    Dado um ponto de extensão registrado sobre uma regra de cada área do catálogo
    Quando cada extensão inverte o default daquela regra
    Então o comportamento observável das duas metades muda da mesma forma
    E nenhuma regra do sistema novo é inalterável onde a do legado é filtrável

  @paridade @critico @composicao
  Cenário: O barramento é equivalente sem depender de tabela global de ganchos
    Dado o barramento exercitado com o registro entregue pelo contexto da requisição
    Quando o conjunto completo de pontos de teste é percorrido
    Então todo valor devolvido é idêntico byte a byte ao do oráculo
    E nenhuma extensão registrada numa requisição aparece em outra

  @paridade @critico @concorrencia
  Cenário: Duas requisições concorrentes não compartilham o registro de extensões
    Dado duas requisições que registram extensões diferentes no mesmo ponto
    Quando as duas são atendidas ao mesmo tempo no mesmo processo
    Então o valor devolvido em cada uma reflete apenas a sua própria extensão
    E nenhuma das duas observa a extensão da outra
    E o resultado é idêntico ao de executar as duas em sequência no oráculo

  # A tradução NÃO ganha porta, por decisão (AD-08): 13.335 pontos de entrada,
  # vindos de 68 dos 71 módulos. A medida é o sinal de que não existe separação
  # entre domínio e apresentação — e isso é observado, não corrigido.
  @paridade
  Cenário: A tradução e o escape não ganham indireção, e o volume de chamadas é preservado
    Dado uma página que atravessa tradução e escape em cada fragmento
    Quando ela é servida pelas duas metades
    Então a saída é idêntica byte a byte nas duas
    E nenhuma das duas introduz porta nem indireção para tradução ou escape
