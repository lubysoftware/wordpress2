# language: pt
# spec-id: PTS-012
# rastreabilidade:
#   process_flows: wp-admin/widgets-form-blocks.php (origem no legado) · _reversa_sdd/migration/target_screens.md § "Tela: widgets-em-blocos"
#   target_architecture: BC-10 Painel · BC-07 Apresentação · entradas/ (rota preservada) · AD-12 (caminho público preservado)
#   paradigma_alvo: Opção 3 híbrido — modo LITERAL: comparação do HTML EMITIDO, não de pixel
#   tela: SCR-062 widgets-em-blocos · grupo Painel · crítica: não
#   modo: literal · compare: dom-and-field-names · formato de golden file: html-css-snapshot
#   deviations: DEV-001 (par origem→alvo sem adapter) · DEV-002 (literal SEM captura — PENDENTE, bloqueia)
#   fatia: 9 — painel
#   area_da_decisao_2: comportamento de caso de uso, com contrato de DOM e de nome de campo
#   familia: A — ponto de montagem do editor de áreas de widget
#
# BLOQUEIO HERDADO, DECLARADO EM CADA ARQUIVO: `DEV-002` está PENDENTE e o golden
# file desta tela tem `present: false`. Até a captura ser executada, a validação
# destes cenários é MANUAL — conferência do HTML emitido contra as tabelas de
# campos, mensagens e pontos de montagem de `target_screens.md`. Não é comparação
# de pixel em nenhuma hipótese: o alvo emite HTML no servidor, como a origem.
#
# COMANDO DE CAPTURA sugerido pelo manifest, para quem tiver a instalação:
#   ver _reversa_sdd/screens/golden/manifest.yaml, entrada SCR-062 (campo capture.command; nulo quando a tela não tem URL própria)

Funcionalidade: Paridade visual da tela widgets-em-blocos
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
    Dado a rota preservada "/wp-admin/widgets.php (tema de blocos)"
    Quando ela é pedida à implementação alvo
    Então o HTML emitido é idêntico ao golden file depois da normalização
    E o campo de uso único é mascarado antes da comparação, nas duas saídas
    E a consulta de versão de cada script e de cada folha de estilo é mascarada
    E o identificador de conta e o token de sessão são mascarados
    E o espaço à direita NÃO é removido de nenhuma das duas saídas
    E a ordem dos atributos de cada elemento é comparada, não ignorada

  @paridade-visual @critico
  Cenário: Toda mensagem literal desta tela chega ao alvo sem alteração
    Dado as 2 mensagens literais que o oráculo emite nesta tela
    Quando a tela é servida pela implementação alvo
    Então cada mensagem aparece idêntica à chave do catálogo, em inglês
    E a diferença de texto é zero, ignorando apenas espaço à direita
    E nenhuma revisão linguística foi aplicada, porque nenhuma foi aprovada

  # FAMÍLIA A — o alvo entrega o PONTO DE MONTAGEM e o OBJETO DE CONFIGURAÇÃO.
  # LACUNA: `wp-includes/js/dist/` não existe nesta árvore, logo o que o cliente
  # desenha DEPOIS do ponto de montagem não tem cenário — e por `ESC-CLIENTE` não
  # entra no porte. O contrato verificável é o que o servidor emite.
  @paridade-visual @critico
  Cenário: O ponto de montagem e o objeto de configuração do cliente externo são preservados
    Dado o cliente do editor na versão cravada como dependência externa
    Quando a tela é servida pelas duas metades
    Então o identificador do ponto de montagem é idêntico nas duas
    E o objeto de configuração entregue ao cliente é idêntico campo por campo
    E a ordem dos pacotes de script enfileirados é idêntica nas duas
    E o cliente externo monta sem erro sobre a saída das duas

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
