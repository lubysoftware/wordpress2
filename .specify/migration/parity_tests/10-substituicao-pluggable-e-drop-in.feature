# language: pt
# spec-id: PT-010
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/hooks-e-plugin-api.md · _reversa_sdd/flowcharts/object-cache.md · _reversa_sdd/flowcharts/recovery-mode-e-tratamento-de-erro-fatal.md
#   target_architecture: plataforma/registro/ · AD-12 (o caminho público é preservado; o de fonte não)
#   paradigma_alvo: Opção 3 híbrido — o alvo compra injeção de dependência POR NECESSIDADE, não por gosto
#   regras: BR-MIGRAR-103 (EXT-SUBST)
#   fatia: 0 (registro) e 1 (núcleo compartilhado)
#   area_da_decisao_2: comportamento de caso de uso + efeito no banco
#
# IMPLICAÇÃO 7 DO PARADIGMA, em uma frase: TypeScript não permite redefinir função
# importada, então o que hoje é AUSÊNCIA DE CÓDIGO vira REGISTRO EXPLÍCITO.
# São três formas de substituição, e as três são REQUISITO FUNCIONAL:
#   1. 38 funções do núcleo substituíveis inteiras;
#   2. 176 guardas de existência de função em 67 arquivos;
#   3. 4 componentes do núcleo substituídos pela SIMPLES PRESENÇA DE UM ARQUIVO.
#
# AD-12 preserva o caminho público e o caminho de componente substituto byte a
# byte: a PRESENÇA DO ARQUIVO num caminho É A API. A árvore de fonte é
# reorganizada livremente e um roteador liga os dois.

Funcionalidade: Substituição por registro explícito e por presença de arquivo
  Como integrador ou autor de extensão
  Quero substituir função do núcleo e componente inteiro do núcleo
  Para que as três formas de substituição do legado continuem funcionando, com
  o mesmo efeito observável

  Contexto:
    Dado um oráculo com o legado na mesma versão
    E a pasta de conteúdo preservada byte a byte nos mesmos caminhos públicos nas duas metades
    E o cache de objeto desligado nas duas metades

  @paridade @substituicao @critico
  Cenário: Uma função do núcleo substituída tem o mesmo efeito observável nas duas metades
    Dado uma substituição registrada para uma função do núcleo que é substituível no legado
    Quando a operação que a invoca é executada nas duas metades
    Então o efeito observável é idêntico nas duas
    E a implementação original do núcleo não é invocada em nenhuma das duas
    Quando nenhuma substituição é registrada
    Então as duas usam a implementação original, com o mesmo efeito

  @paridade @substituicao @critico
  Cenário: O conjunto de funções substituíveis é o mesmo nas duas metades
    Dado o sistema novo construído
    Quando o registro de substituição é inspecionado
    Então o conjunto de funções declaradas substituíveis é idêntico ao do legado
    E nenhuma função substituível no legado deixou de ser substituível no sistema novo
    E nenhuma função não substituível no legado passou a ser substituível no sistema novo

  @paridade @substituicao @critico
  Cenário: A guarda de existência de função vira registro explícito, com o mesmo efeito
    Dado um ponto do legado protegido por guarda de existência de função
    Quando esse ponto é alcançado nas duas metades sem nenhuma substituição registrada
    Então as duas definem a implementação padrão
    Quando uma substituição é registrada antes de o ponto ser alcançado
    Então nenhuma das duas sobrescreve a substituição
    E o efeito observável é o da substituição nas duas

  # OS 4 COMPONENTES SUBSTITUÍDOS PELA PRESENÇA DE UM ARQUIVO. AD-12: a presença
  # do arquivo num caminho É A API, e o caminho é preservado byte a byte.
  @paridade @substituicao @critico
  Esquema do Cenário: A presença de um arquivo no caminho público substitui um componente inteiro do núcleo
    Dado nenhum arquivo no caminho público de "<componente>"
    Quando o arranque é executado nas duas metades
    Então as duas usam a implementação do núcleo
    Quando um arquivo substituto é posto nesse caminho público
    Então as duas passam a usar o substituto
    E o momento do arranque em que o substituto é carregado é o mesmo nas duas
    E o caminho público conferido é idêntico byte a byte nas duas

    Exemplos:
      | componente                    |
      | cache-avancado                |
      | cache-de-objeto               |
      | tratador-de-erro-fatal        |
      | pagina-de-site-apagado        |

  @paridade @substituicao @critico
  Cenário: O caminho público é preservado e o caminho de fonte não precisa ser
    Dado o sistema novo com a árvore de fonte reorganizada
    Quando cada caminho público servido pelo legado é pedido às duas metades
    Então as duas respondem na mesma URL
    E a resposta é idêntica byte a byte onde a área da Decisão 2 exige byte a byte
    E nenhum caminho público do legado deixou de existir no sistema novo

  @paridade @substituicao
  Cenário: Substituir um componente por presença de arquivo não exige reinício nem configuração
    Dado o sistema no ar sem o arquivo substituto
    Quando o arquivo substituto é posto no caminho público
    Então o substituto passa a valer na requisição seguinte nas duas metades
    E nenhuma das duas exige alteração de configuração
    Quando o arquivo é removido
    Então as duas voltam à implementação do núcleo na requisição seguinte

  @paridade @substituicao @composicao
  Cenário: A substituição é verificável no build, e isso é ganho sem mudança observável
    Dado o sistema novo construído com o registro de substituição tipado
    Quando uma substituição com assinatura incompatível é declarada
    Então o build falha
    Mas o comportamento observável de uma substituição com assinatura compatível é idêntico ao do oráculo
    Quando essa substituição compatível é exercitada
    Então o efeito observável é idêntico ao do oráculo

  @paridade @substituicao @concorrencia
  Cenário: Uma substituição registrada por uma requisição não vaza para outra
    Dado uma substituição registrada em tempo de execução por uma requisição
    Quando essa requisição é concluída e outra chega ao mesmo processo
    Então a segunda observa a implementação do núcleo
    E o resultado é idêntico ao do oráculo, que descartaria o processo
    Mas uma substituição por presença de arquivo vale para todas as requisições
    Quando o arquivo substituto está presente e duas requisições chegam
    Então as duas observam o substituto, como no oráculo

  # A condição 4 da coexistência: o cache de objeto tem 27 dependentes e é
  # substituído POR PRESENÇA DE ARQUIVO. Durante a coexistência ele fica
  # DESLIGADO NAS DUAS METADES, e ligá-lo em qualquer uma é no-go (RISK-009).
  @paridade @substituicao @critico
  Cenário: O cache de objeto persistente fica desligado nas duas metades durante a coexistência
    Dado a coexistência ativa
    Quando o estado do cache de objeto é conferido nas duas metades
    Então nenhuma das duas tem cache persistente ligado
    Quando o cache persistente é ligado em qualquer uma das duas
    Então a virada é bloqueada
    E a divergência que isso produziria seria intermitente, e está declarada como tal
