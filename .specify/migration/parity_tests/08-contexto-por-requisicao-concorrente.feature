# language: pt
# spec-id: PT-008
# rastreabilidade:
#   process_flows: nenhum — ESTE FLUXO NÃO EXISTE NO LEGADO COMO FLUXO
#   target_architecture: plataforma/contexto/ · AD-02 (contexto por requisição é o PRIMEIRO componente)
#   paradigma_alvo: Opção 3 híbrido — implicação 2, a mais grave da travessia
#   regras: BR-MIGRAR-105 (EXT-CONTEXTO), marcada como PRÉ-REQUISITO e não refinamento
#   fatia: 0 — fundação verificável, antes de qualquer domínio
#   area_da_decisao_2: ÁREA 5 — estado entre requisições concorrentes, teste PRÓPRIO, fora dos 47 UCs
#   risco: RISK-011 — o único risco do registro cujo trigger diz que NÃO HÁ SINAL NATURAL
#
# POR QUE ESTE ARQUIVO É DIFERENTE DE TODOS OS OUTROS.
# Ele não tem process_flow de origem porque o comportamento que ele verifica NÃO
# EXISTE no legado: lá o processo é montado do zero e DESCARTADO no fim da resposta,
# logo as variáveis globais SÃO, de fato, variáveis de requisição. Numa runtime
# assíncrona e longo-viva o mesmo módulo atende N requisições concorrentes e esse
# estado passa a ser COMPARTILHADO.
#
# A medida que torna isso grave: 1.121 declarações de variável global, 3.410 usos
# de superglobal em 216 arquivos, e 1.279 verificações de capacidade em 224.
# NENHUM dos 985 testes do backlog exercita duas requisições concorrentes.
#
# Inspeção de paridade que rode UMA requisição POR VEZ NÃO DETECTA nada disto.
# Por isso este arquivo é fatia 0: ele é pré-requisito, não refinamento.

Funcionalidade: Contexto por requisição num processo longo-vivo
  Como o próprio sistema, atendendo requisições concorrentes
  Quero que identidade, consulta corrente, conexão e requisição sejam escopo de
  REQUISIÇÃO
  Para que o comportamento observável de N requisições concorrentes seja idêntico
  ao de N requisições sequenciais contra o legado, que descartava o processo

  Contexto:
    Dado um oráculo com o legado na mesma versão, que monta e descarta um processo por requisição
    E o sistema novo em um único processo longo-vivo
    E o cache de objeto desligado nas duas metades

  @paridade @critico @concorrencia
  Cenário: Duas identidades concorrentes não se misturam em nenhum ponto do pipeline
    Dado duas contas com papéis diferentes, cada uma com sessão válida
    Quando as duas pedem rotas autenticadas distintas ao mesmo tempo, no mesmo processo
    Então cada resposta contém apenas dado da própria conta
    E a identidade corrente observada em cada etapa do pipeline é a da própria requisição
    E a comparação de cada resposta com a do oráculo, executada em sequência, é idêntica

  @paridade @critico @concorrencia
  Cenário: A consulta corrente de uma requisição não vaza para outra
    Dado duas requisições que montam consultas diferentes sobre o mesmo tipo de conteúdo
    Quando as duas são atendidas ao mesmo tempo no mesmo processo
    Então o conjunto de resultados de cada uma é idêntico ao do oráculo para a mesma consulta
    E nenhuma das duas observa parâmetro de consulta da outra
    E o estado de consulta corrente após as duas respostas não guarda nenhuma das duas

  @paridade @critico @concorrencia
  Cenário: O registro de pontos de extensão não acumula entre requisições
    Dado uma requisição que registra um ponto de extensão em tempo de execução
    Quando essa requisição é concluída
    E uma requisição seguinte chega ao mesmo processo
    Então o ponto registrado pela primeira não está ativo na segunda
    E o conjunto de pontos ativos na segunda é idêntico ao do oráculo em processo novo

  @paridade @critico @concorrencia
  Cenário: A conexão de banco não é compartilhada de forma que uma requisição veja a transação da outra
    Dado duas requisições que escrevem na mesma tabela ao mesmo tempo
    Quando as duas são atendidas no mesmo processo
    Então o estado final da tabela é idêntico ao de executar as duas em sequência no oráculo
    E nenhuma das duas observa escrita não concluída da outra
    E nenhuma das duas abre transação, como no oráculo

  @paridade @critico @concorrencia
  Cenário: Estado de módulo é proibido, e a violação é detectável
    Dado o sistema novo construído
    Quando a camada de plataforma e a de contextos são inspecionadas
    Então nenhum módulo guarda identidade em estado de módulo
    E nenhum módulo guarda consulta corrente em estado de módulo
    E nenhum módulo guarda conexão de banco em estado de módulo
    E nenhum módulo guarda a requisição corrente em estado de módulo

  @paridade @critico @concorrencia
  Cenário: A carga concorrente não degrada a decisão de acesso
    Dado cem requisições com identidades distintas, metade com papel permissivo e metade restritivo
    Quando as cem são emitidas ao mesmo tempo contra a mesma rota protegida
    Então o número de permissões concedidas é exatamente o número de identidades permissivas
    E nenhuma identidade restritiva recebe permissão
    E o resultado é o mesmo em dez repetições do cenário

  @paridade @critico @concorrencia
  Cenário: A requisição que falha no meio não deixa contexto para a seguinte
    Dado uma requisição autenticada que termina em erro fatal tratado
    Quando uma requisição anônima chega em seguida ao mesmo processo
    Então ela é tratada como anônima
    E nenhum resíduo de contexto da requisição anterior é observável
    E a resposta é idêntica à do oráculo, que teria descartado o processo

  @paridade @critico @concorrencia @ordem-de-emissao
  Cenário: A ordem de emissão de uma resposta não é intercalada pela resposta concorrente
    Dado duas requisições que emitem HTML longo ao mesmo tempo
    Quando as duas são atendidas no mesmo processo
    Então cada resposta é idêntica byte a byte à do oráculo para a mesma requisição
    E nenhum fragmento de uma aparece dentro da outra
    E a ordem interna de cada resposta é preservada

  @paridade @concorrencia @composicao
  Cenário: O contexto é entregue por injeção e não por variável global
    Dado um módulo de domínio exercitado fora de qualquer requisição
    Quando ele é invocado com um contexto fornecido explicitamente
    Então ele produz o resultado esperado sem ler nenhuma variável global
    Quando ele é invocado sem contexto
    Então ele falha de forma declarada, e não assume uma identidade padrão

  # O que este arquivo NÃO pode provar, e vale dizer:
  # sem o oráculo no ar e sem corpus de entrada declarado, nenhum destes cenários
  # é executável hoje. É por isso que a fatia 0 é pré-requisito e por isso que
  # "teste de concorrência inexistente ou vermelho" é no-go SEM EXCEÇÃO.
  @paridade @critico @concorrencia
  Cenário: A ausência deste teste é bloqueio de virada, não dívida
    Dado uma superfície autenticada pronta para virar
    Quando o relatório de paridade dessa superfície é avaliado
    Então a linha de concorrência existe no relatório
    E ela está verde
    Quando a linha de concorrência está ausente ou vermelha
    Então a virada é bloqueada, sem exceção
