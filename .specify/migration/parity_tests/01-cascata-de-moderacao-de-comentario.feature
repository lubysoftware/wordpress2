# language: pt
# spec-id: PT-001
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/comentarios-check_comment.md · _reversa_sdd/flowcharts/comentarios.md
#   target_architecture: BC-03 Interação Pública · AD-05 (cadeia de curto-circuito com ordem declarada)
#   paradigma_alvo: Opção 3 híbrido — cadeia SÍNCRONA com retorno; NÃO coreografia de eventos
#   regras: BR-MIGRAR-009 a BR-MIGRAR-020 (C1 a C12) · DB-TRG1 · ADR-0002 · ADR-0003
#   aggregate: AGG-Comentario (a ordem FAZ parte da invariante)
#   fatia: 7 — escrita de conteúdo e moderação
#   casos_de_uso: UC-14, UC-16, UC-17, UC-18
#   area_da_decisao_2: efeito no banco + byte a byte no valor devolvido por hook
#
# POR QUE ESTE É O PRIMEIRO ARQUIVO: domain.md §2.2 chama esta de "a área de maior
# densidade de regra de negócio do sistema". A implicação 3 do paradigma avisa que
# publicar `comentario.submetido` e deixar 12 handlers reagirem perde as DUAS
# propriedades que SÃO a regra: a ordem e o encerramento. E o visitante receberia
# 202 em vez de 409 e 429.

Funcionalidade: Cascata de moderação de comentário, com ordem e curto-circuito
  Como visitante ou autor autenticado
  Quero submeter um comentário
  Para que a decisão de moderação seja a MESMA do legado, tomada na MESMA ordem
  e encerrada no MESMO ponto

  # A ordem declarada em AD-05 e em AGG-Comentario:
  # C1 → C4 → C3 → C2 → C9 → C6 → C5 → C7 → C10 → C8 → C11 → C12
  # Reordenar estas etapas muda o comportamento observável. É a única lista do
  # modelo de domínio em que isso acontece.
  Contexto:
    Dado um oráculo com o legado na mesma versão, sem extensão ativa fora da lista congelada
    E o cache de objeto desligado nas duas metades
    E o mesmo corpus de comentários submetidos nas duas metades

  @paridade @critico @ordem-de-decisao @invariante
  Cenário: A decisão encerra na primeira etapa que decide, e nenhuma outra regra é consultada
    Dado a opção "comment_moderation" com o valor "1"
    E um comentário que TAMBÉM violaria a lista de proibição e TAMBÉM teria link em excesso
    Quando o comentário é submetido ao sistema novo e ao oráculo
    Então os dois gravam o comentário com o mesmo valor em "comment_approved"
    E os dois registram que a decisão foi tomada por C4
    E nenhum dos dois consulta a lista de proibição nem conta links
    E o efeito no banco é idêntico nas duas metades

  @paridade @critico @ordem-de-decisao
  Cenário: Duplicata é recusa com 409 na MESMA resposta, não moderação
    Dado um comentário já existente com mesmo post, mesmo pai, mesmo autor, mesmo e-mail e mesmo texto
    Quando o mesmo comentário é submetido de novo
    Então a resposta HTTP é 409 nas duas metades
    E nenhum comentário novo é gravado em nenhuma das duas
    E a resposta não é 202 em nenhuma das duas

  @paridade @critico @ordem-de-decisao
  Cenário: Vazão limitada responde 429 na MESMA resposta, e quem modera não é limitado
    Dado um autor anônimo que submeteu um comentário na última hora
    Quando ele submete outro comentário
    Então a resposta HTTP é 429 nas duas metades
    Mas um autor com a capacidade "moderate_comments" na mesma situação não é limitado
    Quando esse autor submete outro comentário
    Então a resposta não é 429 em nenhuma das duas metades
    E o comentário é gravado nas duas com o mesmo valor em "comment_approved"

  @paridade @critico @ordem-de-decisao
  Cenário: Comentário na lixeira não conta como duplicata
    Dado um comentário idêntico que está na lixeira
    Quando um comentário com o mesmo conteúdo é submetido
    Então a resposta HTTP não é 409 em nenhuma das duas metades
    E o comentário novo é gravado nas duas

  @paridade @critico
  Cenário: Lista de proibição vai para a lixeira, não para spam
    Dado um termo presente na lista de proibição do site
    Quando um comentário que contém esse termo é submetido
    Então as duas metades gravam o comentário com o estado de lixeira
    E nenhuma das duas o marca como spam

  @paridade @critico
  Cenário: A palavra de moderação é buscada em seis campos, não só no texto
    Dado uma palavra presente na lista de moderação
    Quando um comentário traz essa palavra apenas no campo de nome do autor
    Então as duas metades mandam o comentário para a fila de moderação
    E o mesmo vale para cada um dos seis campos, exercitado um por vez

  @paridade @critico
  Cenário: Autor já aprovado passa direto, se o e-mail estiver limpo
    Dado um autor com ao menos um comentário aprovado antes, com o mesmo e-mail
    Quando ele submete um comentário novo sem nenhum outro gatilho de moderação
    Então as duas metades gravam o comentário como aprovado
    Mas o mesmo autor com um e-mail que aciona outra etapa da cadeia não recebe o atalho
    Quando esse autor submete um comentário novo
    Então a decisão das duas metades é a da etapa que acionou, não a do atalho

  @paridade @critico
  Cenário: Texto longo demais é erro de usuário, não truncamento
    Dado um comentário maior que o limite aceito
    Quando ele é submetido
    Então as duas metades devolvem erro ao visitante
    E nenhuma das duas grava texto truncado

  @paridade @critico
  Cenário: Pingback do próprio site publicado é aprovado, trackback nunca
    Dado um pingback originado de um conteúdo publicado do próprio site
    Quando ele é registrado
    Então as duas metades o gravam como aprovado
    Mas um trackback de qualquer origem nunca é aprovado
    Quando um trackback é registrado
    Então nenhuma das duas metades o grava como aprovado

  # ESTE É O CENÁRIO QUE A IMPLICAÇÃO 1 DO PARADIGMA TORNA OBRIGATÓRIO.
  # C11 reescreve comment_status e ping_status para "closed" EM MEMÓRIA, e o banco
  # NÃO muda. O efeito observável existe SÓ porque o valor volta ao chamador: um
  # alvo que publicasse evento aqui passaria em todo teste de superfície e perderia
  # a regra. A área 2 da Decisão 2 compara byte a byte o VALOR devolvido pelo hook.
  @paridade @critico @ordem-de-emissao
  Cenário: Comentário em conteúdo antigo fecha sozinho, em memória, sem tocar o banco
    Dado um conteúdo publicado com idade maior que o limite de fechamento automático
    Quando o estado de comentário desse conteúdo é consultado
    Então o valor devolvido pelo ponto de filtro é "closed" nas duas metades, byte a byte
    E o valor gravado no banco permanece inalterado nas duas
    E a diferença entre o valor em memória e o valor no banco é a mesma nas duas

  @paridade @critico
  Cenário: Nota editorial não é comentário público
    Dado uma nota editorial registrada em um conteúdo
    Quando a lista pública de comentários desse conteúdo é pedida
    Então a nota não aparece em nenhuma das duas metades
    E o contador público de comentários é o mesmo nas duas

  # DB-TRG1: o contador é recalculado em PHP e PODE ser suspenso. Não é trigger.
  @paridade @critico @cascata
  Cenário: O contador de comentários é desnormalizado, pode divergir e pode ser suspenso
    Dado a atualização do contador suspensa
    Quando vários comentários são aprovados em sequência
    Então o contador do conteúdo permanece defasado nas duas metades, com o mesmo valor
    Quando o recálculo é disparado
    Então as duas metades chegam ao mesmo valor final

  # ADR-0002: a moderação é em cascata. Apagar o pai propaga.
  @paridade @critico @cascata
  Cenário: Apagar o comentário pai propaga para a árvore de respostas
    Dado um comentário com respostas em dois níveis
    Quando o comentário pai é apagado
    Então as duas metades deixam a mesma árvore no banco
    E os contadores afetados ficam iguais nas duas

  # erd-complete.md §9 risco 2: comentário órfão é ESTADO NORMAL. Apagar o usuário
  # NÃO toca nos comentários. Um alvo que acrescentasse FK com ON DELETE CASCADE
  # mudaria o comportamento observável — e AD-11 proíbe mudar o esquema.
  @paridade @critico @invariante
  Cenário: Comentário órfão é estado normal, e apagar a conta não apaga comentário
    Dado uma conta com comentários aprovados
    Quando a conta é apagada
    Então os comentários continuam existindo nas duas metades
    E o vínculo com a conta apagada fica no mesmo estado nas duas

  # ÁREA 5 DA DECISÃO 2. Nenhum dos 985 testes do backlog exercita isto.
  @paridade @critico @concorrencia
  Cenário: Duas submissões simultâneas de identidades diferentes não trocam de decisão
    Dado um autor com a capacidade "moderate_comments" e um visitante anônimo
    Quando os dois submetem um comentário ao mesmo tempo, no mesmo processo do sistema novo
    Então a decisão aplicada a cada comentário corresponde à identidade de quem o submeteu
    E o comentário do visitante não recebe o atalho de confiança do moderador
    E nenhuma das duas decisões muda se as requisições forem repetidas em ordem invertida

  @paridade @critico @composicao
  Cenário: A cadeia é equivalente sem depender de estado global
    Dado a cadeia de decisão exercitada com as cinco portas de infraestrutura substituídas por duplo
    Quando o mesmo corpus de comentários atravessa a cadeia
    Então a decisão de cada comentário é idêntica à do oráculo
    E nenhuma etapa da cadeia lê identidade de fora do contexto da requisição

  # ESC-FILTRAVEL: toda regra deste catálogo é um default FILTRÁVEL, e preservar
  # isso É o porte.
  @paridade @critico
  Cenário: Cada etapa da cadeia continua sendo um default filtrável
    Dado um ponto de extensão registrado em cada etapa da cadeia
    Quando cada ponto devolve um valor que inverte a decisão daquela etapa
    Então a decisão final das duas metades muda da mesma forma
    E a ordem em que os pontos de extensão são chamados é a mesma nas duas
