# language: pt
# spec-id: PT-014
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/midia-e-anexos-wp_generate_attachment_metadata.md · _reversa_sdd/flowcharts/edicao-de-imagem-image_edit_apply_changes.md
#   target_architecture: BC-04 Mídia · adaptadores/sistema-de-arquivos
#   paradigma_alvo: Opção 3 híbrido — a falha de geração de derivada é SILENCIOSA, e isso é reproduzido
#   regras: BR-MIGRAR-057 a BR-MIGRAR-060 (M1 a M4) · BR-MIGRAR-002 (P2) · BR-MIGRAR-032 (R3)
#   aggregate: AGG-Anexo
#   fatia: 7 (escrita) e 9 (painel)
#   area_da_decisao_2: efeito no banco + comportamento de caso de uso
#   casos_de_uso: UC-12, UC-13
#
# A regra de retenção do anexo é o OPOSTO da do conteúdo: ele só vai para a
# lixeira se uma constante estiver ligada, e ela é FALSA por padrão. Logo apagar
# mídia é DEFINITIVO por padrão, e o ator NÃO É AVISADO. REQ-051 do backlog pede
# o contrário e está BLOQUEADO por decisão humana — o alvo preserva.

Funcionalidade: Ingestão de arquivo, geração de derivadas e edição de imagem
  Como autor ou editor
  Quero enviar, derivar e editar mídia
  Para que o conjunto de arquivos em disco, os metadados gravados e as falhas
  silenciosas sejam idênticos aos do legado

  Contexto:
    Dado um oráculo com o legado na mesma versão e a mesma biblioteca de imagem
    E o mesmo conjunto de tamanhos registrados nas duas metades
    E o cache de objeto desligado nas duas metades

  @paridade @invariante
  Cenário: Imagem grande é reduzida na ingestão, e a original reduzida substitui a enviada
    Dado uma imagem acima do limite de redução na ingestão
    Quando ela é enviada às duas metades
    Então as duas gravam uma versão reduzida como arquivo principal
    E as dimensões da versão reduzida são idênticas nas duas
    E a referência gravada no metadado aponta para o mesmo arquivo nas duas
    Mas uma imagem abaixo do limite não é reduzida
    Quando uma imagem abaixo do limite é enviada
    Então as duas gravam o arquivo original sem alteração de dimensão

  @paridade @invariante
  Cenário: Os quatro tamanhos que nascem com o site são gerados com as mesmas dimensões
    Dado uma imagem maior que todos os tamanhos registrados
    Quando ela é enviada às duas metades
    Então as duas geram exatamente os mesmos arquivos derivados
    E o tamanho de miniatura é recortado quadrado nas duas
    E os outros três são proporcionais nas duas
    E o metadado de cada derivada é idêntico campo por campo nas duas

  @paridade @invariante
  Cenário: A lista de origens responsivas para no limite do legado, independente dos tamanhos existentes
    Dado uma imagem com derivadas acima e abaixo do limite de origens responsivas
    Quando a marcação da imagem é montada nas duas metades
    Então a lista de origens emitida é idêntica byte a byte nas duas
    E nenhuma das duas inclui derivada acima do limite
    E o limite aplicado é o do legado nas duas, mesmo havendo derivada maior

  # M4: falha ao gerar derivada é SILENCIOSA. AD-09: o adaptador reproduz o modo
  # de falha de propósito.
  @paridade @divida-herdada
  Cenário: Falha ao gerar derivada é silenciosa, e o envio é considerado bem-sucedido
    Dado a geração de derivada falhando para um dos tamanhos
    Quando a imagem é enviada às duas metades
    Então as duas consideram o envio bem-sucedido
    E nenhuma das duas avisa o ator
    E nenhuma das duas registra erro em arquivo de log
    E o metadado gravado omite o tamanho que falhou, igualmente nas duas
    E a marcação emitida depois não referencia o tamanho ausente em nenhuma das duas

  @paridade @invariante
  Cenário: Anexo nunca é publicado, e todo estado fora do conjunto aceito é reescrito
    Dado um anexo criado com um estado fora do conjunto aceito
    Quando ele é gravado nas duas metades
    Então as duas reescrevem o estado para o de herança
    E a visibilidade efetiva do arquivo é a do conteúdo pai nas duas
    Quando o estado informado já é um dos aceitos
    Então nenhuma das duas o reescreve

  # R3: o anexo só vai para a lixeira se a constante estiver ligada, e ela é
  # FALSA por padrão. Apagar é DEFINITIVO e o ator NÃO é avisado.
  @paridade @critico @divida-herdada
  Cenário: Apagar mídia é definitivo por padrão, e o ator não é avisado
    Dado a constante de lixeira de mídia no valor padrão
    Quando um anexo é descartado nas duas metades
    Então as duas o apagam definitivamente
    E as duas apagam os arquivos derivados do disco
    E nenhuma das duas avisa o ator de que a operação é irreversível
    Quando a constante é ligada
    Então as duas passam a mandar o anexo para a lixeira
    E a regra de retenção aplicada passa a ser a mesma do conteúdo nas duas

  @paridade @invariante @cascata
  Cenário: Apagar o anexo remove os arquivos derivados e os metadados, na mesma ordem
    Dado um anexo com quatro derivadas em disco e metadados vinculados
    Quando ele é apagado definitivamente nas duas metades
    Então o conjunto de arquivos restante no disco é idêntico nas duas
    E o conjunto de linhas de metadado restante é idêntico nas duas
    E a ordem das operações em disco é a mesma nas duas

  @paridade @invariante
  Cenário: Editar imagem preserva o original e permite restaurá-lo
    Dado uma imagem enviada e derivadas geradas
    Quando uma rotação é aplicada nas duas metades
    Então as duas gravam arquivos novos e preservam o original
    E o metadado de referência ao original é o mesmo nas duas
    Quando a restauração do original é pedida
    Então as duas voltam ao conjunto de arquivos anterior à edição
    E o conjunto final em disco é idêntico nas duas

  @paridade @invariante
  Cenário: O nome de arquivo em conflito recebe o mesmo sufixo nas duas metades
    Dado um arquivo já existente com o nome que será enviado
    Quando o mesmo nome é enviado às duas metades
    Então as duas gravam com o mesmo nome final
    E o sufixo aplicado é idêntico nas duas
    Quando o envio é repetido três vezes
    Então a sequência de nomes gerada é idêntica nas duas

  @paridade @concorrencia
  Cenário: Dois envios simultâneos do mesmo nome não se sobrescrevem
    Dado dois envios do mesmo nome de arquivo, de autores diferentes
    Quando os dois chegam ao mesmo tempo ao sistema novo
    Então dois arquivos distintos existem em disco
    E cada anexo aponta para o seu próprio arquivo
    E a autoria de cada anexo corresponde a quem o enviou
    E o conjunto final é equivalente ao de dois envios em sequência no oráculo

  @paridade @composicao
  Cenário: A ingestão é equivalente com a porta de sistema de arquivos substituída por duplo
    Dado a porta de sistema de arquivos substituída por duplo que registra cada operação
    Quando uma imagem é enviada
    Então a sequência de operações registrada é idêntica à do oráculo
    E nenhuma operação a mais é executada
    E a falha de uma operação de derivada continua silenciosa
