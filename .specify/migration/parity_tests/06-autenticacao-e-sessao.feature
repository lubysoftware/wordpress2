# language: pt
# spec-id: PT-006
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/autenticacao-e-sessoes.md · _reversa_sdd/flowcharts/autenticacao-e-sessoes-wp_check_password.md · _reversa_sdd/flowcharts/application-passwords-wp_authenticate_application_password.md
#   target_architecture: BC-05 Identidade e Acesso · AD-02 (contexto por requisição é o primeiro componente)
#   paradigma_alvo: Opção 3 híbrido — identidade é escopo de REQUISIÇÃO, e isso deixou de ser de graça
#   regras: BR-MIGRAR-021 a BR-MIGRAR-026 (U1 a U6) · BR-MIGRAR-110 (ESC-ENUMERACAO) · BR-MIGRAR-111 (ESC-SESSAO)
#   aggregate: AGG-Conta · AGG-Sessao · AGG-SenhaDeAplicacao
#   fatia: 6 — identidade e autorização
#   area_da_decisao_2: efeito no banco + teste próprio de concorrência
#   casos_de_uso: UC-19, UC-20, UC-21, UC-22, UC-23
#
# Dívida herdada DE PROPÓSITO, decidida em P6 e P7 e registrada no backlog como
# REQ-004 e REQ-008: a mensagem de erro de login DISTINGUE conta inexistente de
# senha incorreta, e trocar a senha NÃO revoga sessão. Os dois são @divida-herdada:
# endurecê-los é decisão separada e registrada, nunca efeito colateral de reescrita.
# Um alvo "bem escrito" os conserta por acidente e quebra o critério de idêntico.

Funcionalidade: Autenticação, sessão e senha de aplicação
  Como qualquer ator que se autentica
  Quero entrar, recuperar senha e usar credencial não interativa
  Para que o comportamento seja idêntico ao do legado, inclusive onde o legado
  é permissivo de propósito

  Contexto:
    Dado um oráculo com o legado na mesma versão
    E as mesmas chaves e sais de assinatura nas duas metades
    E o cache de objeto desligado nas duas metades

  # ESC-ENUMERACAO: a mensagem de erro de login continua distinguindo conta
  # inexistente de senha incorreta. É @divida-herdada, não defeito a corrigir.
  @paridade @critico @divida-herdada
  Cenário: A mensagem de erro de login distingue conta inexistente de senha incorreta
    Dado uma conta que não existe e uma conta que existe
    Quando uma tentativa de entrada é feita com o login inexistente
    Então a mensagem devolvida é idêntica byte a byte à do oráculo
    Quando uma tentativa é feita com o login existente e a senha errada
    Então a mensagem devolvida é idêntica byte a byte à do oráculo
    E as duas mensagens são diferentes entre si, nas duas metades

  # ESC-SESSAO: trocar a senha NÃO revoga sessão. REQ-008 do backlog pede o
  # contrário, e está BLOQUEADO por decisão humana — logo o alvo preserva.
  @paridade @critico @divida-herdada
  Cenário: Trocar a senha não revoga nenhuma sessão aberta
    Dado uma conta com duas sessões abertas em dispositivos diferentes
    Quando a senha da conta é trocada
    Então as duas sessões continuam válidas nas duas metades
    E nenhuma das duas invalida o cookie de nenhuma sessão

  @paridade @critico @invariante
  Cenário: A chave de redefinição vale o prazo do legado e é apagada no primeiro acesso bem-sucedido
    Dado uma chave de redefinição emitida
    Quando o tempo avança até um instante antes do prazo
    Então a chave é aceita pelas duas metades
    Quando o tempo avança além do prazo
    Então a chave é recusada pelas duas, com a mesma mensagem
    Quando uma entrada bem-sucedida acontece com a chave ainda válida
    Então as duas metades apagam a chave no mesmo passo

  @paridade @invariante
  Cenário: A duração da sessão e a carência são as do legado
    Dado uma entrada sem a opção de lembrar
    Quando o tempo avança até depois da duração padrão
    Então as duas metades recusam a sessão
    Mas uma entrada com a opção de lembrar tem duração estendida
    Quando o tempo avança até dentro da carência da duração estendida
    Então as duas metades aceitam a sessão
    E o instante exato em que cada uma passa a recusar é o mesmo

  @paridade @critico @invariante
  Cenário: O cookie e o nonce amarram os mesmos fatores nas duas metades
    Dado uma sessão aberta
    Quando o cookie emitido é inspecionado nas duas metades
    Então ele embute o mesmo fragmento do hash da senha nas duas
    E o nonce emitido amarra tique, ação, identidade e token de sessão nas duas
    Quando a senha é trocada
    Então o cookie emitido depois difere do anterior da mesma forma nas duas

  # Condição 2 da coexistência: administrador que atravessa a fronteira do proxy
  # NÃO pode ser deslogado. RISK-006 e no-go da § 6.2 do cutover_plan.
  @paridade @critico @concorrencia
  Cenário: A sessão atravessa a fronteira do proxy sem ser perdida
    Dado uma entrada feita na metade legada
    Quando o ator navega para uma superfície já virada
    Então a sessão é reconhecida pela metade nova
    E a identidade reconhecida é a mesma
    E um formulário aberto antes da virada continua validando o nonce
    Quando o ator volta para uma superfície não virada
    Então a sessão continua válida na metade legada

  # ÁREA 5 DA DECISÃO 2 — e o motivo de AD-02 existir. No legado a identidade
  # corrente é, DE FATO, variável de requisição, porque o processo morre no fim
  # da resposta. Numa runtime longo-viva isso deixa de ser de graça.
  @paridade @critico @concorrencia
  Cenário: Duas sessões concorrentes não trocam de identidade entre si
    Dado duas contas com papéis diferentes, cada uma com sessão válida
    Quando as duas pedem a mesma rota autenticada ao mesmo tempo, no mesmo processo do sistema novo
    Então cada resposta corresponde à identidade de quem a pediu
    E nenhuma das duas respostas contém dado da outra conta
    E repetir o cenário mil vezes não produz nenhuma troca
    E nenhuma asserção deste cenário depende de ordem de chegada

  @paridade @critico @concorrencia
  Cenário: A identidade não sobrevive ao fim da requisição no processo longo-vivo
    Dado uma requisição autenticada concluída no sistema novo
    Quando uma requisição anônima chega em seguida ao mesmo processo
    Então ela é tratada como anônima
    E nenhuma decisão de autorização dela usa a identidade anterior
    E o resultado é idêntico ao do oráculo, onde o processo foi descartado

  @paridade @critico @invariante
  Cenário: A senha de aplicação é credencial de segunda classe, por desenho
    Dado uma senha de aplicação gerada
    Quando ela é inspecionada nas duas metades
    Então o comprimento gerado é o mesmo
    E o valor é guardado com hash nas duas
    Quando ela é usada para uma operação que a conta poderia fazer pela sessão
    Então o conjunto de operações permitidas é idêntico nas duas
    E esse conjunto é menor que o da sessão nas duas

  @paridade @invariante
  Cenário: Registro aberto é desligado por padrão, e os limites de login e apelido são erro
    Dado a opção de registro aberto no valor padrão
    Quando um registro é tentado nas duas metades
    Então as duas recusam, com a mesma mensagem
    Quando o registro é ligado e um login acima do limite é enviado
    Então as duas recusam com erro, e nenhuma trunca
    Quando um apelido acima do limite é enviado
    Então as duas recusam com erro, e nenhuma trunca

  @paridade @invariante
  Cenário: A lista de logins proibidos é vazia por padrão e existe só como ponto de extensão
    Dado nenhuma extensão registrada no ponto de logins proibidos
    Quando qualquer login válido é registrado
    Então as duas metades aceitam
    Quando uma extensão acrescenta um login à lista
    Então as duas metades recusam esse login, com a mesma mensagem

  # P7: duas funções DEFINIDAS e SEM NENHUM CHAMADOR no legado, e a resposta
  # humana manda portá-las — "existir sem ser chamada é parte do que se clona".
  @paridade @substituicao
  Cenário: As duas operações de encerramento de sessão existem sem caminho de uso
    Dado o sistema novo construído
    Quando a superfície de encerramento de outras sessões e de todas as sessões é inspecionada
    Então as duas operações existem no sistema novo
    E nenhum caminho de uso do produto as invoca, como no oráculo
    Quando elas são invocadas diretamente
    Então o efeito no banco é idêntico ao do oráculo
