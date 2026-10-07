# language: pt
# spec-id: PT-003
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/posts-e-tipos-de-conteudo.md · _reversa_sdd/flowcharts/taxonomias-e-termos.md
#   target_architecture: BC-01 Conteúdo · BC-02 Classificação · AD-01 (um processo, nenhuma saga) · AD-11 (esquema inalterado)
#   paradigma_alvo: Opção 3 híbrido — as 7 etapas ficam INTEIRAS na mesma pilha; não há compensação a escrever
#   regras: BR-MIGRAR-104 (EXT-EXCLUSAO) · BR-MIGRAR-077 a BR-MIGRAR-080 (DB-TRG1 a DB-TRG4) · BR-MIGRAR-031 (R2)
#   aggregate: AGG-Conteudo · AGG-Termo
#   fatia: 7 — escrita de conteúdo e moderação
#   area_da_decisao_2: efeito no banco, incluindo os órfãos que o legado deixa de propósito
#   casos_de_uso: UC-09, UC-10, UC-11, UC-08
#
# A implicação 8 do paradigma: zero START TRANSACTION, zero COMMIT, zero FOREIGN KEY
# em toda a árvore. Apagar um conteúdo são SETE passos sequenciais atravessando
# quatro tabelas, com semântica DELIBERADA de reparenteamento, e três contadores
# desnormalizados costurando os domínios. Se esses passos virassem eventos, a
# sequência seria saga sem compensação — e o legado não tem compensação porque
# nunca precisou de uma. AD-01 mantém tudo num processo, logo não há saga.

Funcionalidade: Exclusão de conteúdo e de termo, com reparenteamento e contadores
  Como editor ou administrador
  Quero descartar, restaurar e apagar conteúdo e termos
  Para que o estado final do banco seja idêntico ao do legado, inclusive os
  órfãos e as inconsistências que ele deixa de propósito

  Contexto:
    Dado um oráculo com o legado na mesma versão e o mesmo esquema
    E um snapshot do banco tomado antes de cada cenário
    E o cache de objeto desligado nas duas metades

  # DB-TRG3: apagar REPOSICIONA os filhos em vez de apagá-los. Uma chave estrangeira
  # com ON DELETE CASCADE no destino MUDARIA o comportamento observável.
  @paridade @critico @cascata @invariante
  Cenário: Apagar reparenteia página filha e anexo para o avô, e não os apaga
    Dado uma página com uma página filha e um anexo vinculados
    E essa página tendo uma página mãe
    Quando a página do meio é apagada definitivamente
    Então as duas metades reparenteiam a página filha para a página avó
    E as duas reparenteiam o anexo para a página avó
    E nenhuma das duas apaga a página filha nem o anexo
    E o conjunto de linhas restante em cada uma das quatro tabelas é idêntico nas duas

  @paridade @critico @cascata
  Cenário: As sete etapas rodam na mesma ordem e deixam o mesmo estado intermediário
    Dado um conteúdo com revisões, termos vinculados, metadados e comentários
    Quando o conteúdo é apagado definitivamente
    Então as duas metades executam as sete etapas na mesma ordem
    E o estado do banco após cada etapa é idêntico nas duas
    E nenhuma das duas abre transação nem emite confirmação de transação
    E nenhuma das duas executa compensação, porque nenhuma etapa falha remotamente

  @paridade @critico @cascata
  Cenário: Interromper a exclusão no meio deixa o MESMO estado parcial nas duas metades
    Dado um conteúdo preparado para exclusão
    Quando a exclusão é interrompida após a terceira etapa nas duas metades
    Então o estado parcial do banco é idêntico nas duas
    E nenhuma das duas desfaz as etapas já executadas
    E os órfãos resultantes são os mesmos nas duas

  @paridade @critico @invariante
  Cenário: A lixeira guarda o estado anterior em metadado e restaurar devolve como rascunho
    Dado um conteúdo publicado
    Quando ele é descartado na lixeira
    Então as duas metades gravam o estado anterior em metadado, com a mesma chave e o mesmo valor
    Quando ele é restaurado
    Então as duas metades o devolvem como rascunho
    E nenhuma das duas o devolve ao estado publicado
    E o metadado de estado anterior fica no mesmo estado nas duas

  @paridade @critico @cascata
  Cenário: Os três contadores desnormalizados chegam ao mesmo valor, e um deles tem dois critérios
    Dado um conteúdo com comentários aprovados e termos de duas taxonomias diferentes
    Quando o conteúdo é apagado definitivamente
    Então o contador de comentários do conteúdo some junto com a linha nas duas metades
    E o contador de cada termo é recalculado nas duas, com o mesmo valor final
    E o critério de cálculo usado para a taxonomia de conteúdo difere do usado para as demais, igualmente nas duas

  # DB-TRG4: apagar um termo DEVOLVE o objeto ao termo padrão, se aquele era o único.
  @paridade @critico @invariante @cascata
  Cenário: Apagar um termo devolve o objeto ao termo padrão, se aquele era o único
    Dado um conteúdo vinculado a exatamente um termo da taxonomia que tem termo padrão
    Quando esse termo é apagado
    Então as duas metades vinculam o conteúdo ao termo padrão
    Mas um conteúdo vinculado a dois termos da mesma taxonomia não recebe o padrão
    Quando um dos dois termos é apagado
    Então nenhuma das duas metades vincula o termo padrão
    E o conteúdo fica com o termo restante nas duas

  @paridade @invariante
  Cenário: O vínculo objeto para termo é polimórfico e serve conteúdo e links
    Dado um termo vinculado a um conteúdo e a um link
    Quando o termo é apagado
    Então as duas metades removem os dois vínculos
    E nenhuma das duas confunde o identificador de conteúdo com o de link

  @paridade @invariante
  Cenário: Desligar a lixeira torna apagar irreversível, e isso é o default do anexo
    Dado a lixeira desligada por constante
    Quando um conteúdo é descartado
    Então as duas metades o apagam definitivamente, sem passar pela lixeira
    E a constante que liga a lixeira de anexo é falsa por padrão nas duas
    E apagar um anexo é definitivo nas duas, sem aviso ao ator

  @paridade @concorrencia @cascata
  Cenário: Duas exclusões simultâneas em ramos vizinhos não corrompem o reparenteamento
    Dado duas páginas irmãs, cada uma com filhas, sob a mesma página mãe
    Quando as duas são apagadas ao mesmo tempo, no mesmo processo do sistema novo
    Então cada conjunto de filhas é reparenteado para a mesma avó
    E nenhuma filha fica sem mãe nas duas metades
    E o estado final do banco é idêntico ao de executar as duas exclusões em sequência no oráculo

  @paridade @composicao
  Cenário: A sequência é equivalente com a porta de dados substituída por duplo
    Dado a cascata exercitada com a porta de dados substituída por duplo que registra cada comando
    Quando um conteúdo com dependências é apagado
    Então a sequência de comandos registrada é idêntica à do oráculo
    E nenhum comando de transação aparece na sequência
