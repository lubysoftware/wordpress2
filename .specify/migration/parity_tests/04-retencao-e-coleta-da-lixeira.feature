# language: pt
# spec-id: PT-004
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/cron.md · _reversa_sdd/flowcharts/posts-e-tipos-de-conteudo.md
#   target_architecture: BC-01 Conteúdo · BC-11 Operação do Software · AD-07 (o disparo tem de falhar)
#   paradigma_alvo: Opção 3 híbrido — o agendador é lista em wp_options disparada por requisição ao próprio host
#   regras: BR-MIGRAR-030 a BR-MIGRAR-037 (R1 a R8) · BR-MIGRAR-113 (ESC-RETENCAO)
#   aggregate: AGG-Conteudo · AGG-TarefaAgendada
#   fatia: 5 (coleta e disparo) e 7 (retenção de conteúdo)
#   area_da_decisao_2: efeito no banco + a falha do disparo
#   casos_de_uso: UC-09, UC-10, UC-11, UC-28
#   adr: ADR-0004 · ADR-0006
#
# O achado que este arquivo protege, e que nenhum artefato anterior ao Detetive
# tinha: a coleta da lixeira só é agendada por visita AUTENTICADA ao painel, porque
# o registro acontece em wp-admin/admin.php:104, DEPOIS de auth_redirect(). Logo
# um site que ninguém administra NUNCA limpa a própria lixeira. Isso é
# comportamento do produto, não defeito — P10 e ADR-0006 mandam preservar.

Funcionalidade: Retenção, coleta da lixeira e expiração agendada
  Como administrador, ou como o próprio decurso do tempo
  Quero que conteúdo descartado, rascunho automático e solicitação não confirmada
  expirem exatamente quando o legado os expira — e NÃO expirem quando o legado
  não os expira

  Contexto:
    Dado um oráculo com o legado na mesma versão, com relógio controlável
    E o cache de objeto desligado nas duas metades
    E nenhuma extensão ativa fora da lista congelada

  # ESTE É O CENÁRIO CENTRAL DA FATIA 5. O critério de aceite é a FALHA, não a
  # latência: critério escrito em latência é no-go declarado (RISK-015).
  @paridade @critico @falha-de-disparo
  Cenário: Um site que ninguém administra nunca executa a própria coleta de lixeira
    Dado conteúdo na lixeira com idade maior que o prazo de retenção
    E nenhuma visita autenticada ao painel desde que o conteúdo foi descartado
    Quando o tempo avança além do prazo de retenção nas duas metades
    Então nenhuma das duas apaga o conteúdo
    E nenhuma das duas tem a tarefa de coleta registrada na fila
    Quando uma visita AUTENTICADA ao painel acontece
    Então as duas metades registram a tarefa de coleta
    E as duas apagam o conteúdo vencido no mesmo ponto do fluxo

  @paridade @critico @falha-de-disparo
  Cenário: Visita não autenticada ao painel não registra a coleta
    Dado conteúdo na lixeira com idade maior que o prazo de retenção
    Quando uma requisição ao painel é feita sem sessão válida
    Então as duas metades redirecionam para a autenticação
    E nenhuma das duas registra a tarefa de coleta
    E o conteúdo vencido continua na lixeira nas duas

  @paridade @invariante
  Cenário: O prazo de retenção da lixeira é o do legado, e desligá-lo torna apagar irreversível
    Dado o prazo de retenção no valor padrão do legado
    Quando conteúdo é descartado e o tempo avança até um dia antes do prazo
    Então nenhuma das duas metades o apaga
    Quando o tempo avança além do prazo e a coleta é disparada por visita autenticada
    Então as duas o apagam
    Mas com a lixeira desligada por constante o descarte já apaga definitivamente
    Quando conteúdo é descartado com a lixeira desligada
    Então as duas metades o apagam na hora, sem passar pela lixeira

  @paridade @invariante
  Cenário: Rascunho automático expira pelo prazo próprio, por comparação de data
    Dado rascunhos automáticos com idades diferentes em torno do prazo de expiração
    Quando a rotina de expiração é executada nas duas metades
    Então as duas apagam exatamente o mesmo conjunto de rascunhos
    E a decisão usa a data de criação do registro nas duas, não a data de modificação

  @paridade @critico @invariante
  Cenário: A coleta tolera estado inconsistente e não aborta
    Dado conteúdo na lixeira sem o metadado de estado anterior
    E conteúdo na lixeira com metadado apontando para um estado que não existe mais
    Quando a coleta é executada nas duas metades
    Então nenhuma das duas aborta
    E as duas tratam cada caso da mesma forma
    E o conjunto de linhas restante é idêntico nas duas

  # R7: prazo e varredura DIFERENTES de R1 — e é domínio regulado.
  @paridade @critico @regulatorio
  Cenário: O arquivo de exportação de dado pessoal tem prazo próprio e varredura horária
    Dado um arquivo de exportação de dado pessoal gerado
    Quando o tempo avança até um instante antes do prazo próprio desse arquivo
    Então nenhuma das duas metades o apaga
    Quando o tempo avança além desse prazo e a varredura horária roda
    Então as duas o apagam
    E o prazo aplicado é o de R7, diferente do prazo da lixeira de conteúdo, nas duas

  @paridade @idempotencia @regulatorio
  Cenário: Solicitação não confirmada expira para falha, e a chave é apagada no mesmo passo
    Dado uma solicitação de dado pessoal aberta e não confirmada
    Quando o prazo de confirmação vence nas duas metades
    Então as duas levam a solicitação ao estado de falha
    E as duas apagam a chave de confirmação no mesmo passo
    Quando a expiração é executada de novo sobre a mesma solicitação
    Então nenhuma das duas muda nada
    E nenhuma das duas reenvia e-mail

  # ESC-RETENCAO e R8: o núcleo NÃO declara prazo de retenção nenhum para o
  # registro de cadastro em rede, e portá-lo idêntico é NÃO INVENTAR um.
  @paridade @invariante
  Cenário: O registro de cadastro em rede não tem política de retenção, e nenhuma é inventada
    Dado registros de cadastro em rede com idade arbitrária
    Quando qualquer rotina de coleta é executada nas duas metades
    Então nenhuma das duas apaga nenhum registro de cadastro
    E nenhuma das duas tem tarefa agendada que os apague

  @paridade @falha-de-disparo @divida-herdada
  Cenário: A falha do disparo é silenciosa nas duas metades
    Dado o endereço de retorno ao próprio host inalcançável
    Quando o disparo do agendador é tentado nas duas metades
    Então nenhuma das duas registra erro em arquivo de log
    E nenhuma das duas notifica o administrador
    E nenhuma tarefa da fila é executada em nenhuma das duas
    E a resposta ao visitante é idêntica nas duas, byte a byte
