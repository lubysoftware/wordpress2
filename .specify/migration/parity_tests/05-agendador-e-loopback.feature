# language: pt
# spec-id: PT-005
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/cron.md · _reversa_sdd/flowcharts/cliente-http.md · _reversa_sdd/flowcharts/site-health-e-diagnostico.md
#   target_architecture: BC-11 Operação do Software · AD-07 (o disparo tem de falhar) · AD-06 (nenhum retry de infraestrutura)
#   paradigma_alvo: Opção 3 híbrido — NÃO existe mensageria; o agendador é lista em wp_options
#   regras: BR-MIGRAR-053 (A9) · BR-MIGRAR-112 (ESC-LIMITE-TAXA) · BR-MIGRAR-006 (P6)
#   aggregate: AGG-TarefaAgendada
#   fatia: 5 — FATIA PRÓPRIA, POR MANDATO DO PARADIGMA
#   area_da_decisao_2: a falha do disparo, não a latência
#   casos_de_uso: UC-37 (sonda de diagnóstico, uma das 4 implementações), UC-39
#   decisao_humana_que_trava: BR-HUMANA-005 (as 4 implementações do protocolo de loopback)
#
# ESTA FATIA É A ÚNICA EM QUE O COMPORTAMENTO CORRETO É UM FRACASSO.
# Em PHP, timeout 0,01 s + blocking falso + sslverify falso ABORTAM a requisição
# de saída. Numa runtime assíncrona o laço de eventos continua vivo depois da
# resposta e a requisição pode COMPLETAR — e aí o produto se comporta diferente
# no primeiro dia. Um porte fiel reproduz a FALHA, não a intenção.
# Critério de aceite escrito em latência é no-go (RISK-015).

Funcionalidade: Agendador e protocolo de retorno ao próprio host
  Como o próprio sistema
  Quero disparar a fila agendada por requisição HTTP não bloqueante ao próprio host
  Para que o disparo FALHE exatamente como falha no legado, com as mesmas
  consequências observáveis

  Contexto:
    Dado um oráculo com o legado na mesma versão
    E nenhuma fila, nenhum broker e nenhum agendador do sistema operacional em nenhuma das duas metades
    E o cache de objeto desligado nas duas metades

  # O CENÁRIO QUE DEFINE A FATIA.
  @paridade @critico @falha-de-disparo
  Cenário: O disparo não bloqueante não completa, e isso é o comportamento correto
    Dado a fila agendada com uma tarefa vencida
    Quando uma requisição qualquer chega e o disparo ao próprio host é emitido
    Então o disparo é emitido com tempo limite de fração de segundo nas duas metades
    E o disparo é emitido sem bloquear a resposta nas duas
    E o disparo é emitido sem verificação de certificado nas duas
    E a resposta ao cliente é concluída sem esperar o disparo nas duas
    E o disparo NÃO completa em nenhuma das duas
    E a tarefa vencida permanece na fila em nenhum estado de execução nas duas

  @paridade @critico @falha-de-disparo
  Cenário: O laço de eventos do alvo não pode completar o disparo depois da resposta
    Dado a fila agendada com uma tarefa vencida
    Quando a resposta ao cliente é concluída no sistema novo
    Então nenhuma requisição de disparo pendente completa depois da resposta
    E o estado da fila após a resposta é idêntico ao do oráculo
    E repetir o cenário cem vezes não produz nenhuma execução de tarefa no sistema novo

  @paridade @critico @falha-de-disparo
  Cenário: A latência do disparo não é critério de aceite
    Dado um endereço de retorno que responde rápido e outro que responde devagar
    Quando o disparo é emitido contra cada um nas duas metades
    Então o resultado observável é o mesmo nos dois casos, nas duas metades
    E nenhuma asserção deste cenário mede tempo de resposta

  @paridade @critico
  Cenário: A fila é uma lista em opção, lida e escrita como o legado a lê e escreve
    Dado a fila agendada com tarefas de três horários diferentes
    Quando a fila é lida nas duas metades
    Então a estrutura serializada lida é idêntica byte a byte nas duas
    Quando uma tarefa é acrescentada e outra removida
    Então o valor gravado na opção é idêntico byte a byte nas duas
    E a ordem das tarefas dentro da estrutura é a mesma nas duas

  @paridade @critico
  Cenário: A trava de tempo do disparo é o único freio, e é a do legado
    Dado um disparo já emitido há menos tempo que a trava
    Quando outro disparo é tentado nas duas metades
    Então nenhuma das duas emite o segundo disparo
    Quando o tempo avança além da trava
    Então as duas emitem o disparo seguinte
    E nenhuma das duas tem limite de taxa além dessa trava

  # BR-HUMANA-005: a duplicação está ADMITIDA em comentário no legado, e a falha
  # é silenciosa por projeto. Unificar sem conferir muda comportamento sem que
  # nada acuse.
  @paridade @critico @falha-de-disparo
  Esquema do Cenário: As quatro implementações do protocolo de retorno se comportam igual antes de qualquer unificação
    Dado a implementação "<implementacao>" do protocolo de retorno ao próprio host
    Quando ela é exercitada contra um endereço alcançável e contra um inalcançável
    Então o resultado observável de cada caso é idêntico ao da mesma implementação no oráculo
    E o conjunto de parâmetros de requisição que ela usa é idêntico ao do oráculo
    E a diferença entre esta implementação e as outras três é a mesma nas duas metades

    Exemplos:
      | implementacao                   |
      | disparo-do-agendador            |
      | sonda-de-diagnostico-de-site    |
      | verificacao-de-retorno-do-nucleo|
      | verificacao-de-editor-de-arquivo|

  @paridade @invariante
  Cenário: O agendador não é confiado pela tarefa, e a verificação dupla permanece
    Dado uma tarefa de publicação agendada executada antes da data chegar
    Quando a tarefa roda nas duas metades
    Então nenhuma das duas publica
    E as duas reagendam, com o mesmo próximo horário
    E a verificação dupla não é removida por nenhuma das duas

  # AD-06: nenhum retry de infraestrutura. A política de nova tentativa é escrita
  # à mão, caso a caso, e o número de e-mails ao administrador é critério de aceite.
  @paridade @critico @idempotencia
  Cenário: Não existe retry genérico, e reexecutar a mesma tarefa não duplica efeito
    Dado uma tarefa que falha na primeira execução
    Quando o disparo volta a ocorrer nas duas metades
    Então nenhuma das duas aplica recuo exponencial
    E nenhuma das duas move a tarefa para fila de descarte
    E o número de execuções da tarefa é o mesmo nas duas
    E o número de e-mails enviados ao administrador é o mesmo nas duas

  @paridade @falha-de-disparo @divida-herdada
  Cenário: Nenhuma falha de disparo é registrada em log, e isso é reproduzido de propósito
    Dado o endereço de retorno recusando conexão
    Quando o disparo é tentado dez vezes nas duas metades
    Então nenhuma das duas escreve arquivo de log
    E nenhuma das duas incrementa contador visível ao administrador
    E a única informação persistente de falha continua sendo a mesma opção que o legado usa

  @paridade @composicao
  Cenário: O disparo é equivalente com a porta HTTP substituída por duplo
    Dado a porta de cliente HTTP substituída por duplo que registra cada requisição
    Quando o disparo é emitido
    Então os parâmetros registrados são idênticos aos do oráculo, campo por campo
    E o tempo limite registrado é o mesmo
    E a verificação de certificado registrada está desligada nas duas
