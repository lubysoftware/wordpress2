# language: pt
# spec-id: PT-015
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/opcoes-e-metadados-update_option.md · _reversa_sdd/flowcharts/opcoes-e-metadados.md
#   target_architecture: plataforma/dados/ · plataforma/opcoes/ · adaptadores/driver-mysql · AD-11 (esquema inalterado)
#   paradigma_alvo: Opção 3 híbrido — SQL por fragmento, com ponto de filtro entre cada fragmento; sem mapeador objeto-relacional
#   regras: BR-MIGRAR-075 a BR-MIGRAR-086 (DB-ENUM, DB-UNIQ, DB-TRG1 a DB-TRG4, DB-SENT, DB-SER, DB-DEG, DB-SEED, DB-MIG, DB-DEAD)
#   fatia: 0 — fundação verificável, antes de qualquer domínio
#   area_da_decisao_2: efeito no banco
#   decisao_humana_que_trava: BR-HUMANA-003 (a sentinela de data; a resposta (a) DERRUBA o banco compartilhado)
#
# ESTE ARQUIVO É A CONDIÇÃO 1 DA COEXISTÊNCIA.
# Quatro famílias de coluna de texto longo guardam ESTRUTURA SERIALIZADA do
# legado — as opções e as quatro tabelas de metadados. E a AUTORIZAÇÃO mora num
# metadado serializado por site, com o nome do papel dentro do nome da chave.
# Se a metade nova não escrever byte a byte o que a metade legada lê, a
# coexistência é IMPOSSÍVEL e a estratégia recomendada cai.
# Teste de ida e volta do codec sem verde é no-go declarado (RISK-005).
#
# E o banco é armazenamento puro: 18 tabelas, ZERO chaves estrangeiras, zero
# gatilho, zero procedimento, zero visão. AD-11 proíbe mudar o esquema nesta fase.

Funcionalidade: Fronteira do banco, codec de serialização e sentinelas
  Como as duas metades compartilhando um banco só
  Quero que toda escrita de uma seja legível pela outra, byte a byte
  Para que a coexistência seja possível e a migração de dados continue sendo zero

  Contexto:
    Dado um oráculo com o legado na mesma versão e o mesmo esquema, revisão de banco inalterada
    E o mesmo modo permissivo do servidor de banco nas duas metades
    E o cache de objeto desligado nas duas metades

  # O CENÁRIO QUE DECIDE SE A ESTRATÉGIA A É VIÁVEL.
  @paridade @critico @dados
  Cenário: A metade legada lê byte a byte o que a metade nova escreve, e vice-versa
    Dado um conjunto de valores que cobre os tipos que o legado serializa
    Quando cada valor é escrito pela metade nova e lido pela metade legada
    Então o valor lido é idêntico ao escrito, tipo por tipo
    Quando cada valor é escrito pela metade legada e lido pela metade nova
    Então o valor lido é idêntico ao escrito, tipo por tipo
    E a cadeia de bytes gravada na coluna é idêntica nas duas direções

  @paridade @critico @dados
  Esquema do Cenário: O codec de serialização sobrevive à ida e volta em cada família de coluna
    Dado a família de coluna "<familia>"
    Quando um valor estruturado é gravado e lido de volta nas duas metades
    Então a cadeia de bytes gravada é idêntica nas duas
    E o valor reconstruído é idêntico nas duas
    E nenhuma das duas normaliza, reordena nem reindexa a estrutura

    Exemplos:
      | familia                      |
      | opcoes                       |
      | metadado-de-conteudo         |
      | metadado-de-conta            |
      | metadado-de-termo            |
      | metadado-de-comentario       |

  # PERM-2: a autorização mora num metadado serializado POR SITE, com o papel
  # dentro do nome da chave. É o caso que torna o codec questão de segurança.
  @paridade @critico @dados
  Cenário: A definição de papéis sobrevive à ida e volta, com o nome do site dentro da chave
    Dado a definição de papéis de um site gravada pela metade nova
    Quando a metade legada a lê e decide uma capacidade
    Então a decisão é idêntica à que ela tomaria lendo o que ela mesma gravou
    Quando a metade legada grava a definição e a metade nova decide
    Então a decisão é idêntica nas duas
    E o nome da chave, com o prefixo do site, é idêntico nas duas

  # DB-SENT + BR-HUMANA-003: o esquema EVITA valor nulo e usa SENTINELAS que
  # nenhuma restrição distingue de valor legítimo. A sentinela de data é o default
  # de dez colunas e CARREGA SIGNIFICADO DE NEGÓCIO.
  @paridade @critico @dados @invariante
  Cenário: A sentinela de data carrega significado de negócio e é preservada como literal
    Dado uma linha com a sentinela de data em cada uma das colunas que a usam como padrão
    Quando a linha é lida pelas duas metades
    Então as duas interpretam a sentinela da mesma forma
    E nenhuma das duas a converte para valor nulo
    Quando a metade nova grava a sentinela
    Então a cadeia de bytes gravada é idêntica à que a metade legada gravaria
    E a decisão de negócio que depende dela é a mesma nas duas

  @paridade @critico @dados
  Cenário: Toda enumeração do modelo vive em coluna de texto curto, sem restrição de valor
    Dado um valor fora do conjunto que o código reconhece, gravado diretamente na coluna
    Quando a linha é lida pelas duas metades
    Então nenhuma das duas rejeita a linha no nível do banco
    E as duas tratam o valor desconhecido da mesma forma na camada de aplicação
    E nenhuma das duas acrescenta restrição de valor que o legado não tem

  @paridade @critico @dados
  Cenário: Só as três garantias de unicidade do legado existem, e nenhuma a mais
    Dado o esquema das duas metades
    Quando os índices de unicidade são enumerados
    Então o conjunto é idêntico nas duas
    E são exatamente as três do legado
    Quando uma inserção que violaria uma unicidade inexistente é feita
    Então as duas aceitam, e deixam o mesmo estado duplicado

  # DB-DEG: escrita inválida NÃO FALHA, ela se DEGRADA. Um alvo que valida mais
  # produz um sistema mais fechado que o legado.
  @paridade @critico @dados @divida-herdada
  Cenário: Escrita inválida não falha, ela se degrada
    Dado um valor acima do comprimento da coluna
    Quando ele é gravado pelas duas metades
    Então nenhuma das duas lança erro ao chamador
    E o valor efetivamente gravado é idêntico nas duas
    Quando um valor de tipo incompatível é gravado
    Então o valor resultante na coluna é idêntico nas duas

  # DB-SEED: o esquema vazio NÃO É FUNCIONAL — parte da regra está nas linhas que
  # o instalador cria.
  @paridade @critico @dados @invariante
  Cenário: O esquema vazio não é funcional, e as linhas que o instalador cria são parte da regra
    Dado um banco com o esquema criado e nenhuma linha
    Quando o sistema é posto no ar nas duas metades
    Então as duas se comportam da mesma forma
    Quando a instalação é executada
    Então o conjunto de linhas que cada uma cria é idêntico, tabela por tabela
    E o valor de cada opção criada é idêntico byte a byte nas duas
    E a definição de papéis criada é idêntica byte a byte nas duas

  # DB-MIG + condição 3 da coexistência: o sistema é sua PRÓPRIA ferramenta de
  # migração, POR COMPARAÇÃO DE ESTRUTURA. Numa coexistência, as duas metades
  # disputando o esquema arriscam corromper a instalação de referência — que É O
  # ORÁCULO.
  @paridade @critico @dados
  Cenário: Nenhum comando de alteração de esquema sai da metade nova
    Dado um snapshot do esquema tomado antes da virada
    Quando a metade nova atende tráfego por toda a janela de observação
    Então nenhum comando de alteração de esquema partiu dela
    E a revisão de banco gravada permanece a mesma
    Quando qualquer comando de alteração de esquema parte da metade nova
    Então a virada é revertida e o caso é tratado como incidente

  @paridade @critico @dados
  Cenário: A comparação de estrutura do legado é reproduzida sem ser disparada
    Dado a revisão de banco gravada igual à do código nas duas metades
    Quando uma visita ao painel acontece
    Então nenhuma das duas dispara a comparação de estrutura
    Quando a revisão gravada é menor que a do código
    Então as duas disparam a comparação
    E o conjunto de alterações que cada uma proporia é idêntico

  # DB-DEAD: duas colunas existem no esquema e o núcleo NUNCA escreve nada nelas.
  # P7: "existir sem ser chamada é parte do que se clona".
  @paridade @dados @invariante
  Cenário: As colunas mortas continuam existindo e continuam nunca sendo escritas
    Dado o esquema das duas metades
    Quando as duas colunas que o núcleo nunca escreve são enumeradas
    Então as duas existem nas duas metades, com o mesmo tipo e o mesmo padrão
    Quando todo o corpus de escrita é executado nas duas
    Então nenhuma das duas escreve valor em nenhuma das duas colunas

  # AD-03 e architecture.md §9 risco 5: NOVE classes montam SQL por fragmento,
  # COM UM PONTO DE FILTRO ENTRE CADA FRAGMENTO. Um mapeador objeto-relacional
  # esconderia o fragmento e mataria o ponto de extensão que a P3 chama de produto.
  @paridade @critico @dados
  Cenário: O SQL é montado por fragmento, com ponto de filtro entre cada fragmento
    Dado uma extensão registrada em cada ponto de filtro de fragmento de consulta
    Quando a consulta é montada nas duas metades
    Então a sequência de pontos acionados é idêntica
    E o fragmento que cada ponto recebe é idêntico byte a byte
    E a consulta final montada é idêntica byte a byte
    Quando uma extensão altera um fragmento
    Então o conjunto de resultados muda da mesma forma nas duas

  @paridade @critico @dados
  Cenário: Nenhuma transação é aberta, e o estado parcial de uma falha é o mesmo
    Dado uma sequência de escritas em que a terceira falha
    Quando a sequência é executada nas duas metades
    Então nenhuma das duas abre transação
    E as duas primeiras escritas permanecem gravadas nas duas
    E nenhuma das duas desfaz nada
    E o estado parcial resultante é idêntico nas duas

  @paridade @dados @concorrencia
  Cenário: Duas escritas concorrentes na mesma opção deixam o mesmo estado final
    Dado duas requisições que gravam valores diferentes na mesma opção
    Quando as duas são atendidas ao mesmo tempo no mesmo processo
    Então o valor final é um dos dois valores, não uma mistura
    E a estrutura serializada final é válida e legível pela metade legada
    E o resultado é equivalente ao de duas gravações em sequência no oráculo
