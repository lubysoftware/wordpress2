# language: pt
# spec-id: PT-019
# rastreabilidade:
#   process_flows: _reversa_sdd/state-machines.md (9 ciclos de vida, 9 diagramas) · _reversa_sdd/flowcharts/customize.md
#   target_architecture: BC-01 Conteúdo · BC-03 Interação Pública · BC-04 Mídia · BC-06 Privacidade · BC-07 Apresentação · BC-11 Operação · BC-12 Rede
#   paradigma_alvo: Opção 3 híbrido — a transição é chamada de função na mesma pilha, não publicação de evento
#   regras: BR-MIGRAR-100 (SM-ALL) · BR-MIGRAR-101 (SM-CHANGESET)
#   aggregate: AGG-Conteudo · AGG-Comentario · AGG-Anexo · AGG-SolicitacaoDeDadoPessoal · AGG-Changeset · AGG-Cadastro · AGG-SiteDaRede · AGG-AtualizacaoAutomatica · AGG-ModoDeRecuperacao
#   fatia: transversal — cada máquina pertence à fatia do seu contexto
#   casos_de_uso: UC-29 (changeset do personalizador); as demais máquinas pelo fluxo do seu contexto
#   area_da_decisao_2: efeito no banco + byte a byte no valor devolvido por hook
#
# POR QUE ESTE ARQUIVO EXISTE SEPARADO DOS OUTROS.
# As nove máquinas de estado atravessam sete contextos, e cada transição delas já
# aparece dentro do fluxo do seu contexto — publicação em PT-002, moderação em
# PT-001, anexo em PT-014, privacidade em PT-012, rede em PT-016, atualização e
# recuperação em PT-013. O que NÃO aparece em nenhum deles é a propriedade
# TRANSVERSAL que `SM-ALL` fixa: as nove migram INTEIRAS, COM OS GATILHOS DE CADA
# TRANSIÇÃO. Gatilho é ponto de extensão — e uma extensão que escute transição é
# consumidor do contrato.
#
# Quatro entidades do modelo NÃO TÊM máquina de estado — contas, termos, opções e
# links. Isso está declarado para que ninguém invente uma: invariante que o
# legado não tem, o alvo não inventa.
#
# E o estado de exclusão de site da rede tem QUATRO CAMPOS, não um: é a única
# máquina do conjunto cujo estado é composto.

Funcionalidade: As nove máquinas de estado e o ciclo de vida do changeset
  Como qualquer ator, ou como o próprio decurso do tempo
  Quero que cada transição de estado dispare os mesmos gatilhos, na mesma ordem
  Para que toda extensão que escute transição continue sendo chamada do mesmo
  modo

  Contexto:
    Dado um oráculo com o legado na mesma versão, com relógio controlável
    E uma extensão registrada em cada gatilho de entrada e de saída de cada transição
    E o cache de objeto desligado nas duas metades

  @paridade @critico @invariante
  Esquema do Cenário: Cada máquina de estado migra inteira, com os gatilhos de cada transição
    Dado a máquina de estado "<maquina>", da entidade "<entidade>"
    Quando cada transição válida dela é exercitada nas duas metades
    Então o conjunto de estados alcançáveis é idêntico nas duas
    E o conjunto de transições permitidas é idêntico nas duas
    E cada transição dispara os mesmos gatilhos, na mesma ordem, nas duas
    E cada transição PROIBIDA é recusada da mesma forma nas duas
    E o valor gravado na coluna de estado é idêntico byte a byte nas duas

    Exemplos:
      | maquina                                  | entidade                      |
      | conteudo-post_status                     | conteúdo                      |
      | comentario-comment_approved              | comentário                    |
      | anexo-post_status                        | anexo                         |
      | solicitacao-de-dados-pessoais            | solicitação de dado pessoal   |
      | changeset-do-customizer                  | changeset do personalizador   |
      | cadastro-em-rede-signups-active          | cadastro em rede              |
      | site-da-rede-quatro-campos               | site da rede                  |
      | atualizacao-automatica-do-nucleo         | atualização automática        |
      | modo-de-recuperacao-e-extensao-pausada   | modo de recuperação           |

  @paridade @critico
  Cenário: Nenhuma transição acontece por publicação de evento, e o gatilho devolve ao chamador
    Dado uma extensão registrada num gatilho de transição que altera o valor em trânsito
    Quando a transição é executada nas duas metades
    Então o valor devolvido pelo gatilho é idêntico byte a byte nas duas
    E o chamador usa esse valor na mesma expressão nas duas
    E nenhuma das duas publica evento assíncrono na transição

  @paridade @critico @invariante
  Cenário: O estado de supervisão de site da rede é composto por quatro campos, não por um
    Dado um site da rede
    Quando o estado de supervisão dele é consultado nas duas metades
    Então as duas leem os quatro campos, não um
    E a decisão de acesso resultante da combinação é idêntica nas duas
    Quando cada campo é alterado isoladamente
    Então a decisão de acesso muda da mesma forma nas duas
    E nenhuma das duas colapsa os quatro campos em um

  @paridade @invariante
  Cenário: As quatro entidades sem máquina de estado continuam sem nenhuma
    Dado o sistema novo construído
    Quando o modelo de contas, de termos, de opções e de links é inspecionado
    Então nenhuma das quatro tem coluna de estado com conjunto fechado de valores
    E nenhuma das quatro tem transição proibida declarada
    E nenhuma das quatro ganhou máquina de estado que o legado não tem

  # SM-CHANGESET: o changeset do personalizador é um conteúdo COM REGRAS PRÓPRIAS
  # de ciclo de vida, SEPARADO do conteúdo editorial. Ele compartilha a tabela e
  # não a máquina.
  @paridade @critico @invariante
  Cenário: O changeset do personalizador é conteúdo com ciclo de vida próprio
    Dado um changeset criado pelo personalizador
    Quando o tipo e o estado dele são inspecionados nas duas metades
    Então as duas o gravam na mesma tabela do conteúdo editorial
    E as duas usam um conjunto de estados próprio, diferente do editorial
    Quando uma transição válida no conteúdo editorial é tentada no changeset
    Então as duas a recusam, ou as duas a aceitam, da mesma forma
    E nenhuma das duas aplica a máquina editorial ao changeset

  @paridade @critico @invariante
  Cenário: Publicar o changeset aplica os valores e encerra o ciclo de vida dele
    Dado um changeset com alterações de várias configurações
    Quando ele é publicado nas duas metades
    Então as duas aplicam exatamente o mesmo conjunto de valores
    E as duas levam o changeset ao mesmo estado final
    E a ordem em que as configurações são aplicadas é a mesma nas duas
    Quando a publicação é pedida de novo
    Então nenhuma das duas reaplica nada

  @paridade @invariante
  Cenário: O changeset abandonado segue a política de retenção do legado, nem mais nem menos
    Dado um changeset não publicado com idade crescente
    Quando a rotina de retenção é executada nas duas metades
    Então as duas decidem igual em cada ponto da linha do tempo
    E nenhuma das duas acrescenta prazo que o legado não tem
    E nenhuma das duas remove prazo que o legado tem

  @paridade @concorrencia
  Cenário: Duas transições simultâneas da mesma entidade não produzem estado inválido
    Dado uma entidade em um estado de partida
    Quando duas transições diferentes são pedidas ao mesmo tempo, no mesmo processo
    Então o estado final é um dos dois estados de destino, não uma mistura
    E os gatilhos disparados correspondem à transição que venceu
    E o resultado é equivalente ao de executar as duas em sequência no oráculo

  @paridade @composicao
  Cenário: A máquina é equivalente sem depender de estado global
    Dado cada máquina exercitada com a entidade e o contexto fornecidos explicitamente
    Quando todas as transições de todas as nove são percorridas
    Então toda decisão é idêntica à do oráculo
    E nenhum ponto da máquina lê identidade nem conexão de variável global
