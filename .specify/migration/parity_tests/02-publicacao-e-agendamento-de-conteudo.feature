# language: pt
# spec-id: PT-002
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/posts-e-tipos-de-conteudo-wp_insert_post.md · _reversa_sdd/flowcharts/posts-e-tipos-de-conteudo-wp_unique_post_slug.md
#   target_architecture: BC-01 Conteúdo · plataforma/tipos-de-conteudo
#   paradigma_alvo: Opção 3 híbrido — idempotência por guarda de estado, não por chave de evento
#   regras: BR-MIGRAR-001 (P1) · BR-MIGRAR-003 a BR-MIGRAR-007 (P3 a P7) · BR-MIGRAR-008 (P8)
#   aggregate: AGG-Conteudo · AGG-Revisao
#   fatia: 7 — escrita de conteúdo e moderação
#   area_da_decisao_2: efeito no banco
#   casos_de_uso: UC-03 a UC-07
#
# O achado que este arquivo protege: o default do código e o default do DDL
# DIVERGEM para a mesma coluna. wp_insert_post() grava "draft" quando o status
# não é informado; o default do DDL é "publish". São duas regras para a mesma
# coluna, dependendo de quem escreve — e a Decisão 2 põe isso no contrato de
# "efeito no banco". O alvo NÃO pode unificar os dois defaults.

Funcionalidade: Publicação, agendamento e slug de conteúdo
  Como autor, colaborador ou editor
  Quero criar, submeter, publicar e agendar conteúdo
  Para que o efeito no banco seja idêntico ao do legado, inclusive onde o legado
  é inconsistente de propósito

  Contexto:
    Dado um oráculo com o legado na mesma versão e o mesmo esquema, revisão de banco inalterada
    E o cache de objeto desligado nas duas metades

  @paridade @critico @invariante
  Cenário: Publicar é ato explícito, e o default do código não é o default do DDL
    Dado uma requisição de criação de conteúdo que não informa o status
    Quando o conteúdo é criado pelo caminho de aplicação nas duas metades
    Então as duas gravam o status "draft"
    Mas uma linha inserida diretamente na tabela, sem informar o status, recebe "publish"
    Quando essa inserção direta é feita nas duas metades
    Então as duas gravam "publish"
    E a divergência entre os dois defaults é idêntica nas duas metades

  @paridade @critico @invariante
  Cenário: Nenhuma transição para publicado acontece por efeito colateral
    Dado um conteúdo em rascunho
    Quando qualquer operação de atualização que não peça publicação é executada
    Então o status permanece "draft" nas duas metades
    E nenhum gancho de transição para publicado dispara em nenhuma das duas

  @paridade @invariante
  Cenário: Conteúdo do tipo padrão sempre recebe a categoria padrão
    Dado um conteúdo do tipo padrão sem nenhum termo de categoria, fora de rascunho automático
    Quando ele é gravado
    Então as duas metades vinculam a categoria padrão
    E na publicação a regra se repete para toda taxonomia que tenha termo padrão
    E o vínculo gravado é o mesmo nas duas

  @paridade @critico @invariante
  Cenário: Rascunho pode ter slug duplicado, publicado não — e o slug muda sozinho ao publicar
    Dado dois rascunhos com o mesmo slug
    Quando os dois são gravados
    Então as duas metades aceitam o slug duplicado
    Quando um deles é publicado
    Então o slug dele muda sozinho, da mesma forma nas duas metades
    E o slug resultante é idêntico byte a byte nas duas
    E a dispensa de unicidade vale também para pendente, rascunho automático, revisão e solicitação de dado pessoal

  @paridade @critico @invariante
  Cenário: Colaborador não reserva slug do que está em revisão
    Dado um ator sem a capacidade de publicar
    Quando ele submete um conteúdo para revisão informando um slug
    Então as duas metades gravam o campo de slug vazio
    E nenhuma das duas reserva o slug

  # ADR-0005: agendamento por comparação de data, não por transição de estado.
  # O cron NÃO é confiado, e num alvo com fila real a verificação dupla pareceria
  # redundante — removê-la mudaria o comportamento no primeiro atraso.
  @paridade @critico @invariante
  Cenário: O agendamento é guardado por verificação dupla, e o agendador não é confiado
    Dado um conteúdo agendado para uma data futura
    Quando a tarefa de publicação agendada é executada antes da data chegar
    Então nenhuma das duas metades publica
    E as duas reagendam a tarefa, com o mesmo próximo horário
    Quando a tarefa é executada para um conteúdo que não está em estado agendado
    Então nenhuma das duas publica
    E nenhuma das duas registra erro

  # P7: idempotência por GUARDA DE ESTADO, não por chave de evento. Um emissor de
  # evento idempotente por identificador dispararia o gancho; aqui ele NÃO dispara.
  @paridade @idempotencia @invariante
  Cenário: Republicar é operação nula e nenhum gancho de transição dispara
    Dado um conteúdo já publicado
    Quando a publicação é pedida de novo
    Então nenhuma das duas metades altera qualquer campo
    E nenhum gancho de transição de estado dispara em nenhuma das duas
    E uma extensão que escute transição de estado não é chamada em nenhuma das duas

  @paridade @critico
  Cenário: HTML bruto é privilégio, e uma constante o retira de todos
    Dado um ator sem a capacidade de HTML não filtrado
    Quando ele grava conteúdo com marcação fora do conjunto permitido
    Então as duas metades gravam o conteúdo saneado, idêntico byte a byte
    Mas a constante de proibição de HTML não filtrado retira a capacidade de todos
    Quando essa constante está definida e um super administrador grava a mesma marcação
    Então as duas metades gravam o conteúdo saneado
    E a revogação acontece antes de qualquer verificação de capacidade nas duas

  @paridade @invariante @cascata
  Cenário: A revisão é um conteúdo filho e a exclusão do pai recorre sobre ela
    Dado um conteúdo com três revisões registradas
    Quando o conteúdo é apagado definitivamente
    Então as duas metades apagam as revisões pelo mesmo caminho de exclusão
    E o número de linhas restantes em cada tabela é o mesmo nas duas

  @paridade @concorrencia
  Cenário: Duas gravações simultâneas de autores diferentes não trocam de autoria
    Dado dois autores autenticados com capacidades diferentes
    Quando os dois gravam um conteúdo ao mesmo tempo, no mesmo processo do sistema novo
    Então a autoria gravada em cada conteúdo corresponde a quem o gravou
    E a decisão sobre o slug de cada um usa a capacidade de quem o gravou
    E nenhuma das duas gravações vê o estado da outra

  @paridade @ordem-de-emissao
  Cenário: A ordem dos pontos de filtro na gravação é a mesma nas duas metades
    Dado um ponto de extensão registrado em cada estágio da gravação, com prioridade inteira declarada
    Quando um conteúdo é gravado
    Então a sequência de chamadas registrada é idêntica nas duas metades
    E o valor que cada ponto recebe é idêntico byte a byte
    E o valor final gravado é o do último ponto da cadeia nas duas
