# language: pt
# spec-id: PTS-003
# rastreabilidade:
#   process_flows: wp-login.php:1095 (origem no legado) · _reversa_sdd/migration/target_screens.md § "Tela: registro-de-usuario"
#   target_architecture: BC-05 Identidade e Acesso · BC-01 Conteúdo (formulário de senha de conteúdo) · entradas/ (rota preservada) · AD-12 (caminho público preservado)
#   paradigma_alvo: Opção 3 híbrido — modo LITERAL: comparação do HTML EMITIDO, não de pixel
#   tela: SCR-005 registro-de-usuario · grupo Entradas publicas · crítica: sim
#   modo: literal · compare: dom-and-field-names · formato de golden file: html-css-snapshot
#   deviations: DEV-001 (par origem→alvo sem adapter) · DEV-002 (literal SEM captura — PENDENTE, bloqueia)
#   fatia: 6 — identidade e autorização
#   area_da_decisao_2: comportamento de caso de uso, com contrato de DOM e de nome de campo
#   familia: C — o nome do campo é a API: aplicação externa ou tema de terceiro depende dele
#
# BLOQUEIO HERDADO, DECLARADO EM CADA ARQUIVO: `DEV-002` está PENDENTE e o golden
# file desta tela tem `present: false`. Até a captura ser executada, a validação
# destes cenários é MANUAL — conferência do HTML emitido contra as tabelas de
# campos, mensagens e pontos de montagem de `target_screens.md`. Não é comparação
# de pixel em nenhuma hipótese: o alvo emite HTML no servidor, como a origem.
#
# COMANDO DE CAPTURA sugerido pelo manifest, para quem tiver a instalação:
#   ver _reversa_sdd/screens/golden/manifest.yaml, entrada SCR-005 (campo capture.command; nulo quando a tela não tem URL própria)

Funcionalidade: Paridade visual da tela registro-de-usuario
  Como quem opera a virada desta superfície
  Quero comparar o HTML emitido pela implementação alvo com o golden file do legado
  Para que o contrato de DOM e de nome de campo desta tela, que um cliente
  externo consulta, continue valendo

  Contexto:
    Dado um golden file desta tela capturado do oráculo na mesma versão
    E as regras de normalização do manifest aplicadas às duas saídas
    E a ordem de atributo NÃO ignorada, porque ela faz parte do contrato

  @paridade-visual @critico
  Cenário: O HTML emitido é idêntico ao golden file dentro das regras de normalização
    Dado a rota preservada "/wp-login.php?action=register"
    Quando ela é pedida à implementação alvo
    Então o HTML emitido é idêntico ao golden file depois da normalização
    E o campo de uso único é mascarado antes da comparação, nas duas saídas
    E a consulta de versão de cada script e de cada folha de estilo é mascarada
    E o identificador de conta e o token de sessão são mascarados
    E o espaço à direita NÃO é removido de nenhuma das duas saídas
    E a ordem dos atributos de cada elemento é comparada, não ignorada

  @paridade-visual @critico
  Cenário: Toda mensagem literal desta tela chega ao alvo sem alteração
    Dado as 8 mensagens literais que o oráculo emite nesta tela
    Quando a tela é servida pela implementação alvo
    Então cada mensagem aparece idêntica à chave do catálogo, em inglês
    E a diferença de texto é zero, ignorando apenas espaço à direita
    E nenhuma revisão linguística foi aplicada, porque nenhuma foi aprovada

  # FAMÍLIA C — o NOME DO CAMPO é a API. Renomear um campo quebra cliente externo
  # que este porte não reescreve e não enxerga.
  @paridade-visual @critico
  Cenário: O nome de cada campo do formulário é preservado, e nenhum é renomeado
    Dado um cliente externo que envia o formulário desta tela
    Quando o formulário é servido pelas duas metades
    Então o nome de cada campo é idêntico nas duas
    E o tipo declarado de cada campo é idêntico nas duas
    E o destino e o método do formulário são idênticos nas duas
    Quando o cliente externo envia o formulário contra as duas metades
    Então as duas aceitam o envio e produzem o mesmo efeito observável

  # Os nomes abaixo saíram da tabela de campos desta tela em target_screens.md,
  # que carrega arquivo e linha de cada um. Nenhum deles tem atributo de
  # obrigatoriedade no HTML do legado: a validação é toda do lado servidor, e um
  # alvo que acrescentar obrigatoriedade muda comportamento observável sem que
  # ninguém tenha decidido.
  @paridade-visual @critico
  Cenário: Cada nome de campo desta tela existe no alvo, com o mesmo nome
    Dado o formulário desta tela, com os nomes de campo que o oráculo emite
    Quando a saída da implementação alvo é inspecionada
    Então cada um destes nomes de campo existe nela, sem renomeação:
      | nome do campo |
      | user_login    |
      | user_email    |
      | redirect_to   |
      | wp-submit     |
    E nenhum campo recebeu atributo de obrigatoriedade que o legado não tem
    E nenhum campo do legado está ausente na saída alvo

  @paridade-visual @critico
  Cenário: A capacidade exigida para abrir esta tela é a mesma nas duas metades
    Dado a capacidade exigida declarada na spec desta tela: nenhuma checagem `current_user_can()` neste arquivo
    Quando um ator sem essa capacidade pede a rota às duas metades
    Então as duas decidem igual
    E a resposta de recusa é idêntica byte a byte nas duas
    E nenhuma das duas exige capacidade que o legado não exige

  @paridade-visual
  Cenário: A captura é determinística, e sem as máscaras o resultado seria ruído
    Dado duas capturas da MESMA tela, feitas no mesmo dia no oráculo
    Quando as duas são comparadas sem as máscaras do manifest
    Então elas divergem, porque o campo de uso único é rotativo
    Quando as mesmas duas são comparadas COM as máscaras
    Então elas são idênticas
    E a estratégia de determinismo aplicada é a declarada no manifest para esta tela

  @paridade-visual
  Cenário: Enquanto o golden file não existir, a validação desta tela é manual
    Dado o golden file desta tela ausente
    Quando a paridade desta tela é avaliada
    Então o resultado registrado é "validação manual pendente de captura"
    E a tela não pode ser declarada verde por ausência de divergência
    E a deviation DEV-002 continua bloqueando a virada desta superfície
