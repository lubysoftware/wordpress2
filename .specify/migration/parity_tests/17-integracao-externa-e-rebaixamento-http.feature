# language: pt
# spec-id: PT-017
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/cliente-http.md · _reversa_sdd/flowcharts/connectors.md · _reversa_sdd/flowcharts/ai-client.md · _reversa_sdd/flowcharts/abilities-api.md
#   target_architecture: BC-13 Integração Externa · adaptadores/cliente-http · AD-09 (o adaptador reproduz o modo de falha DE PROPÓSITO)
#   paradigma_alvo: Opção 3 híbrido — as 5 bordas são trocadas de qualquer forma, e é ali que vivem os 5 achados de segurança
#   regras: BR-MIGRAR-068 a BR-MIGRAR-074 (I1 a I7) · BR-MIGRAR-115 (ESC-HTTP) · BR-MIGRAR-114 (ESC-IA)
#   aggregate: AGG-Conector · AGG-Ability
#   fatia: 13 — integração externa
#   area_da_decisao_2: saída byte a byte nos contratos + comportamento de caso de uso
#   casos_de_uso: UC-15, UC-46
#   adr: ADR-0011 · ADR-0012
#
# ESTE É O ARQUIVO MAIS DESCONFORTÁVEL DO CONJUNTO, E DE PROPÓSITO.
# AD-09 decide que cada um dos cinco adaptadores REPRODUZ o modo de falha do
# legado, porque "um adaptador bem escrito os conserta por acidente e quebra o
# critério de idêntico". As respostas P11 e P12 mandam PRESERVAR. Onde o conserto
# for desejado, é decisão SEPARADA E REGISTRADA — nunca efeito colateral de
# reescrita.
#
# O achado que muda conclusão: 13 canais nascem em texto claro e SETE repetem a
# requisição em claro quando a camada de transporte segura falha — inclusive o
# canal de somas de verificação, que seria o que detectaria arquivo de núcleo
# alterado. Artefatos anteriores a esta análise registravam DOIS canais; são 13.
#
# E a maior exportação de dado pessoal do sistema sai de um FORMULÁRIO ANÔNIMO:
# cada comentário submetido faz o serviço de reputação receber todo campo de
# texto do corpo da requisição e todo cabeçalho do ambiente, exceto o cookie.
# Depois de uma falha de transporte seguro, isso trafega em claro por 24 h junto
# com a chave de API. P13 abre EXCEÇÃO: o envio é portado COM MINIMIZAÇÃO.

Funcionalidade: Integração externa, rebaixamento de canal e autorização de habilidade
  Como o próprio sistema conversando com serviço de terceiro
  Quero que o canal, a precedência de credencial e o modo de falha sejam
  idênticos aos do legado
  Para que a dívida herdada seja reproduzida de propósito, e não consertada por
  acidente

  Contexto:
    Dado um oráculo com o legado na mesma versão
    E a porta de cliente HTTP substituída por duplo que registra cada requisição nas duas metades
    E o cache de objeto desligado nas duas metades

  # ESC-HTTP: o rebaixamento migra INTEIRO. Treze canais nascem em texto claro e
  # sete repetem em claro quando o transporte seguro falha.
  @paridade @critico @divida-herdada
  Cenário: Os treze canais nascem em texto claro, e nenhum é promovido pelo porte
    Dado o conjunto de canais de saída do sistema
    Quando cada um é exercitado nas duas metades
    Então o esquema de URL usado em cada canal é idêntico nas duas
    E o número de canais que nascem em texto claro é o mesmo nas duas
    E nenhum canal que nasce em texto claro no legado nasce seguro no sistema novo

  @paridade @critico @divida-herdada
  Cenário: Sete canais repetem a requisição em claro quando o transporte seguro falha
    Dado a camada de transporte segura falhando para cada um dos canais que rebaixam
    Quando a requisição é tentada nas duas metades
    Então as duas repetem a requisição em texto claro
    E o conjunto de canais que repete é idêntico nas duas
    E o corpo da requisição repetida é idêntico ao da primeira nas duas
    E nenhuma das duas avisa o administrador

  @paridade @critico @divida-herdada
  Cenário: O canal de somas de verificação também rebaixa, e isso é preservado
    Dado o transporte seguro falhando para o canal de somas de verificação
    Quando a verificação de integridade de arquivo é executada nas duas metades
    Então as duas obtêm as somas por canal em texto claro
    E as duas concluem a verificação com o mesmo resultado
    E nenhuma das duas recusa a soma obtida por canal não autenticado
    E o relatório de dívida herdada declara este caso nas duas

  # P13: a ÚNICA exceção de conteúdo autorizada neste arquivo. O envio é portado
  # COM MINIMIZAÇÃO — logo aqui a paridade NÃO é byte a byte, e isso está
  # declarado como exceção em parity_specs.md § Exceções.
  @paridade @critico @regulatorio
  Cenário: O envio ao serviço de reputação é minimizado, e a divergência é exceção declarada
    Dado um comentário submetido com campos de formulário extra e cabeçalhos de ambiente
    Quando o envio ao serviço de reputação é montado nas duas metades
    Então o oráculo envia todo campo de texto do corpo e todo cabeçalho, exceto o cookie
    E o sistema novo envia apenas o conjunto mínimo declarado
    E a diferença entre os dois conjuntos é exatamente a minimização aprovada
    E nenhum campo fora desse conjunto mínimo sai do sistema novo
    E a decisão de classificação devolvida produz o mesmo efeito nas duas

  @paridade @critico @divida-herdada @regulatorio
  Cenário: Após falha de transporte seguro, o serviço de reputação continua em claro pelo prazo do legado
    Dado uma falha de transporte seguro no canal do serviço de reputação
    Quando envios seguintes são feitos dentro do prazo de rebaixamento nas duas metades
    Então as duas usam canal em texto claro
    E a chave de API trafega em claro nas duas
    Quando o prazo vence
    Então as duas voltam a tentar o canal seguro
    E o prazo aplicado é o mesmo nas duas

  # I1 + ADR-0012: a credencial de conector tem PRECEDÊNCIA declarada, e ela fica
  # FORA DO BANCO quando vem de ambiente ou de constante.
  @paridade @critico @invariante
  Esquema do Cenário: A precedência de credencial de conector é respeitada, fonte por fonte
    Dado a credencial presente em "<fontes>"
    Quando o conector é resolvido nas duas metades
    Então as duas usam a fonte "<vencedora>"
    E nenhuma das duas grava no banco a credencial que veio de fora dele
    E a credencial efetivamente usada é a mesma nas duas

    Exemplos:
      | fontes                          | vencedora          |
      | ambiente, constante, banco      | ambiente           |
      | constante, banco                | constante          |
      | banco                           | banco              |
      | nenhuma                         | nenhuma            |

  @paridade @invariante
  Cenário: A credencial de conector pode ser um par separado no primeiro separador
    Dado uma credencial no formato de par, com separador também presente na segunda parte
    Quando ela é interpretada nas duas metades
    Então as duas dividem no PRIMEIRO separador
    E a segunda parte conserva os separadores seguintes nas duas
    E a requisição montada é idêntica nas duas

  # I4 + ADR-0011: toda habilidade EXIGE retorno de permissão, e a FALTA de
  # declaração é ERRO — não liberação. É a camada que falha FECHADA, ao contrário
  # da de API.
  @paridade @critico
  Cenário: Habilidade sem retorno de permissão é erro, e não liberação
    Dado uma habilidade registrada sem declarar retorno de permissão
    Quando a execução dela é pedida nas duas metades
    Então as duas recusam, com a mesma mensagem
    E nenhuma das duas executa
    Mas uma rota de API sem retorno de permissão FUNCIONA
    Quando uma rota de API sem declaração é pedida
    Então as duas a atendem
    E a diferença de falha padrão entre as duas camadas é a mesma nas duas metades

  # I5: a autorização de habilidade é FILTRÁVEL, INCLUSIVE PARA CONCEDER.
  @paridade @critico
  Cenário: A autorização de habilidade é filtrável, inclusive para conceder
    Dado uma habilidade cujo retorno de permissão nega para um ator
    Quando uma extensão altera o retorno para conceder
    Então as duas metades passam a executar
    E o efeito da execução é idêntico nas duas
    E a ordem entre o retorno declarado e o ponto de extensão é a mesma nas duas

  # I6: a execução pode ser CURTO-CIRCUITADA ANTES DE QUALQUER VALIDAÇÃO.
  @paridade @critico
  Cenário: A execução de habilidade pode ser curto-circuitada antes de qualquer validação
    Dado uma extensão registrada no ponto de curto-circuito de execução de habilidade
    Quando a execução é pedida com argumentos que não passariam a validação
    Então as duas metades devolvem o valor do curto-circuito
    E nenhuma das duas valida os argumentos
    E o valor devolvido é idêntico byte a byte nas duas

  @paridade
  Cenário: As cinco habilidades registradas nesta árvore existem com retorno de permissão
    Dado o sistema novo construído
    Quando o registro de habilidades é enumerado
    Então as cinco habilidades que o oráculo registra existem no sistema novo
    E todas declaram retorno de permissão nas duas
    E a decisão de cada retorno é idêntica nas duas

  # ESC-IA + P18: a ÚNICA exceção de infraestrutura autorizada. O tempo limite do
  # cliente de IA é DEFINIDO no adaptador, em vez de herdar o padrão curto.
  # AD-09 a nomeia como exceção única para NÃO ABRIR PRECEDENTE.
  @paridade @divida-herdada
  Cenário: O tempo limite do cliente de IA é definido no adaptador, e é a exceção única
    Dado o adaptador de cliente de IA do sistema novo
    Quando uma requisição de geração é montada
    Então o tempo limite declarado é maior que o padrão curto do cliente HTTP
    E o oráculo usa o padrão curto, e a divergência é a exceção aprovada
    E nenhum outro adaptador do sistema novo altera o tempo limite padrão

  @paridade @invariante
  Cenário: Os três conectores de provedor de IA continuam declarados sem provedor que os execute
    Dado nenhuma extensão de provedor de IA instalada
    Quando o registro de conectores é enumerado nas duas metades
    Então os três conectores de provedor estão declarados nas duas
    Quando a execução de qualquer um deles é pedida
    Então as duas falham da mesma forma, com a mesma mensagem
    E nenhuma das duas inventa implementação de provedor

  # ESC-LIMITE-TAXA, com o alerta que o Strategist acrescentou: a regra é
  # idêntica, o RAIO DE ALCANCE não. Em PHP uma enxurrada custa um processo por
  # requisição, que morre; em runtime de laço único, ela bloqueia o laço.
  @paridade @critico @divida-herdada
  Cenário: Nenhuma superfície de entrada tem limite de taxa, e os dois freios são travas de tempo
    Dado o conjunto de superfícies de entrada do sistema
    Quando cada uma recebe cem requisições em sequência rápida nas duas metades
    Então nenhuma das duas aplica limite de taxa
    E os dois únicos freios observados são as travas de tempo do legado
    E o valor de cada trava é idêntico nas duas
    E o relatório de dívida herdada declara que o limite de taxa é decisão de implantação, fora do núcleo

  @paridade @concorrencia
  Cenário: Duas integrações concorrentes não compartilham credencial nem canal
    Dado dois sites da mesma instalação com credenciais de conector diferentes
    Quando os dois fazem uma chamada externa ao mesmo tempo no mesmo processo
    Então cada requisição leva a credencial do seu próprio site
    E nenhuma das duas usa a credencial da outra
    E o estado de rebaixamento de canal de um não afeta o do outro
