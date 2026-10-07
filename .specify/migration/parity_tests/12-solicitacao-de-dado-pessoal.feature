# language: pt
# spec-id: PT-012
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/privacidade-e-dados-pessoais.md
#   target_architecture: BC-06 Privacidade · AD-06 (falha de negócio é VALOR DE RETORNO, não exceção)
#   paradigma_alvo: Opção 3 híbrido — a solicitação é um conteúdo, com máquina de estado própria
#   regras: BR-MIGRAR-038 a BR-MIGRAR-044 (D1 a D6, D3b) · BR-MIGRAR-036 (R7) · BR-MIGRAR-037 (R8)
#   aggregate: AGG-SolicitacaoDeDadoPessoal
#   fatia: 8 — DOMÍNIO REGULADO, com Parallel Run PERMANENTE
#   area_da_decisao_2: efeito no banco + Parallel Run permanente
#   casos_de_uso: UC-02 (senha de conteúdo), UC-25, UC-26, UC-27, UC-28
#
# DOMÍNIO REGULADO. São 7 regras de LGPD/GDPR, e é o recorte que dispara o caso
# de borda regulatório do SKILL de estratégia: Big Bang é PROIBIDA e o Parallel
# Run desta fatia é PERMANENTE, não temporário. Não há janela que o encerre.
#
# E o achado que muda a conclusão: a maior exportação de dado pessoal do sistema
# NÃO sai daqui — sai de um formulário ANÔNIMO. Cada comentário submetido faz o
# serviço de reputação externo receber todo campo de texto do corpo da requisição
# e todo cabeçalho do ambiente, exceto o cookie. Isso está em PT-017, e é por
# isso que PT-017 também é @regulatorio.

Funcionalidade: Solicitação de exportação e de exclusão de dado pessoal
  Como titular de dado pessoal, ou como administrador que atende a solicitação
  Quero que o ciclo de vida da solicitação seja idêntico ao do legado
  Para que a obrigação regulatória herdada pela implantação continue cumprida do
  mesmo modo, e provada por comparação e não por inspeção

  Contexto:
    Dado um oráculo com o legado na mesma versão, com relógio controlável
    E o Parallel Run desta fatia declarado como permanente
    E o cache de objeto desligado nas duas metades

  # D1: a solicitação É UM CONTEÚDO. Não é tabela própria. Isso é "efeito no
  # banco" e o alvo não pode normalizar — AD-11 proíbe mudar o esquema.
  @paridade @critico @regulatorio @invariante
  Cenário: A solicitação é gravada como conteúdo, no mesmo tipo e com os mesmos campos
    Dado uma solicitação de exportação aberta para um titular
    Quando ela é gravada nas duas metades
    Então as duas a gravam como conteúdo do mesmo tipo
    E o campo que guarda o endereço do titular é o mesmo nas duas
    E o estado inicial gravado é o mesmo nas duas
    E nenhuma das duas cria tabela própria para a solicitação

  @paridade @critico @regulatorio @invariante
  Cenário: Nada acontece sem confirmação do titular
    Dado uma solicitação aberta e não confirmada
    Quando a execução da solicitação é tentada nas duas metades
    Então nenhuma das duas exporta nem apaga nada
    E nenhuma das duas muda o estado da solicitação
    Quando o titular confirma pela chave recebida
    Então as duas passam a solicitação ao mesmo estado confirmado
    E só então a execução é possível nas duas

  # D3b: a solicitação não confirmada no prazo expira para FALHA, e a chave é
  # apagada NO MESMO PASSO.
  @paridade @critico @regulatorio @idempotencia
  Cenário: A solicitação não confirmada expira para falha, e a chave é apagada no mesmo passo
    Dado uma solicitação aberta e não confirmada
    Quando o tempo avança até um instante antes do prazo de confirmação
    Então as duas metades ainda aceitam a chave
    Quando o tempo avança além do prazo
    Então as duas levam a solicitação ao estado de falha
    E as duas apagam a chave no mesmo passo
    Quando a expiração roda de novo sobre a mesma solicitação
    Então nenhuma das duas muda nada e nenhuma reenvia e-mail

  # D3: falha de envio de e-mail é ESTADO, NÃO EXCEÇÃO. E AD-06 declara que isso
  # é o que impede retry de infraestrutura de sobrepor a política do legado.
  @paridade @critico @regulatorio @invariante
  Cenário: Falha de envio de e-mail é estado, não exceção, e pode ser reenviada
    Dado o envio de e-mail falhando na porta de e-mail
    Quando uma solicitação é aberta nas duas metades
    Então nenhuma das duas lança exceção que interrompa o fluxo
    E as duas levam a solicitação ao estado de falha de envio
    E o estado é consultável pelo administrador nas duas
    Quando o reenvio é pedido com o envio funcionando
    Então as duas reenviam e levam a solicitação ao mesmo estado
    E o número de e-mails enviados é o mesmo nas duas

  @paridade @critico @regulatorio
  Cenário: Exportar ou apagar dado de terceiro é poder de rede
    Dado um administrador de site em instalação de rede
    Quando ele tenta executar uma solicitação de outro titular
    Então as duas metades decidem igual
    Quando um administrador de rede tenta a mesma operação
    Então as duas metades decidem igual
    E a diferença entre as duas decisões é a mesma nas duas metades

  @paridade @critico @regulatorio
  Cenário: A página de política de privacidade é protegida pela própria capacidade de privacidade
    Dado a página de política de privacidade definida
    Quando um ator sem a capacidade de privacidade tenta apagá-la
    Então as duas metades negam, com a mesma mensagem
    Quando um ator com a capacidade tenta
    Então as duas permitem, com o mesmo efeito no banco

  # D6 + BR-HUMANA-009: senha de conteúdo é TEXTO CLARO, POR DESENHO — é senha de
  # acesso a conteúdo, não de conta. SEM PRAZO e SEM LIMITE DE TENTATIVA. REQ-044
  # do backlog pede o contrário e está BLOQUEADO por decisão humana.
  @paridade @critico @divida-herdada
  Cenário: A senha de conteúdo é texto claro, sem prazo e sem limite de tentativa
    Dado um conteúdo protegido por senha
    Quando a senha é gravada nas duas metades
    Então as duas a gravam em texto claro
    Quando a senha correta é enviada
    Então as duas liberam o conteúdo e gravam o mesmo atestado
    E o atestado não tem prazo de validade em nenhuma das duas
    Quando mil senhas erradas são enviadas em sequência
    Então nenhuma das duas aplica limite de tentativa
    E nenhuma das duas registra a tentativa em log

  # R7: prazo e varredura DIFERENTES de R1, e isso é dado pessoal em disco.
  @paridade @critico @regulatorio
  Cenário: O arquivo de exportação tem prazo próprio e varredura horária
    Dado um arquivo de exportação gerado para um titular
    Quando o tempo avança até um instante antes do prazo próprio
    Então o arquivo existe nas duas metades e continua acessível pela mesma URL
    Quando o tempo avança além do prazo e a varredura horária roda
    Então as duas apagam o arquivo do disco
    E as duas invalidam a URL da mesma forma
    E o prazo aplicado é o de R7, diferente do da lixeira de conteúdo, nas duas

  # R8: o registro de cadastro em rede NÃO TEM POLÍTICA DE RETENÇÃO. Portá-lo
  # idêntico é NÃO INVENTAR uma — mesmo sendo dado pessoal.
  @paridade @critico @regulatorio @divida-herdada
  Cenário: O registro de cadastro em rede não tem retenção, e nenhuma é inventada
    Dado registros de cadastro em rede com endereço de e-mail e endereço de rede do solicitante
    Quando qualquer rotina de coleta roda nas duas metades
    Então nenhuma das duas apaga nenhum registro
    E nenhuma das duas acrescenta prazo que o legado não tem
    E a ausência de retenção está declarada como dívida herdada nas duas

  @paridade @critico @regulatorio
  Cenário: O conteúdo exportado é idêntico, campo por campo, e nada a mais
    Dado um titular com conteúdo, comentários, metadados e sessões
    Quando a exportação é executada nas duas metades
    Então o conjunto de grupos de dado exportado é idêntico
    E o conjunto de campos de cada grupo é idêntico
    E o valor de cada campo é idêntico, exceto os que carregam data de geração
    E nenhuma das duas exporta campo que a outra não exporta

  @paridade @critico @regulatorio @idempotencia
  Cenário: Executar a mesma exclusão duas vezes não produz efeito diferente
    Dado uma solicitação de exclusão confirmada e executada
    Quando a execução é pedida de novo nas duas metades
    Então nenhuma das duas apaga mais nada
    E o estado final da solicitação é o mesmo nas duas
    E o número de e-mails ao titular é o mesmo nas duas

  @paridade @critico @regulatorio @concorrencia
  Cenário: Duas solicitações simultâneas de titulares diferentes não se cruzam
    Dado duas solicitações confirmadas, de titulares diferentes
    Quando as duas são executadas ao mesmo tempo no mesmo processo
    Então o conteúdo exportado de cada uma pertence apenas ao seu titular
    E nenhum arquivo de exportação contém dado do outro titular
    E o resultado é idêntico ao de executar as duas em sequência no oráculo

  # A fatia 8 é a única com Parallel Run PERMANENTE. Isto não é redundância: é o
  # caso de borda regulatório do SKILL de estratégia, e é por isso que o oráculo
  # permanece no ar depois do corte final.
  @paridade @critico @regulatorio
  Cenário: O Parallel Run desta fatia não é encerrado por nenhuma janela
    Dado a fatia de privacidade virada há mais de trinta dias sem divergência
    Quando o encerramento do Parallel Run desta fatia é avaliado
    Então ele não é encerrado
    E o corpus desta fatia continua rodando contra o oráculo diariamente
    E o oráculo continua no ar depois do corte final, sem servir tráfego
