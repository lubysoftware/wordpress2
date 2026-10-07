# language: pt
# spec-id: PT-016
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/multisite.md · _reversa_sdd/flowcharts/usuarios-e-perfis-wp_insert_user.md
#   target_architecture: BC-12 Rede (multisite) · plataforma/autorizacao
#   paradigma_alvo: Opção 3 híbrido — multisite entra como CAPACIDADE do produto, com subdiretório como modo padrão
#   regras: BR-MIGRAR-061 a BR-MIGRAR-067 (N1 a N7) · BR-MIGRAR-027 a BR-MIGRAR-029 (U7 a U9) · BR-MIGRAR-109 (ESC-MULTISITE)
#   aggregate: AGG-Rede · AGG-SiteDaRede · AGG-Cadastro
#   fatia: 11 — rede
#   area_da_decisao_2: efeito no banco
#   casos_de_uso: UC-41, UC-42, UC-43
#   adr: ADR-0009
#   lacuna_que_pode_remover_esta_fatia: A-3 — não se sabe se a instalação é multisite
#
# O ACHADO QUE MUDA CONCLUSÃO, e que o dicionário de dados do pacote descrevia
# errado: a coluna de exclusão de site da rede tem TRÊS valores, não dois. O
# valor que significa "não ativado" não é nenhum dos dois que a documentação
# descrevia. Quem migrar lendo o dicionário produz um sistema que trata site não
# ativado como site ativo.
#
# E ADR-0009: a NEGAÇÃO EXPLÍCITA VENCE O SUPER ADMINISTRADOR.

Funcionalidade: Rede de sites, supervisão e cadastro
  Como super administrador, administrador de site ou pessoa que se cadastra
  Quero que os estados de supervisão, as reservas de nome e os poderes de rede
  sejam idênticos aos do legado

  Contexto:
    Dado um oráculo com o legado na mesma versão, em instalação de rede
    E o mesmo conjunto de seis tabelas de rede nas duas metades
    E o cache de objeto desligado nas duas metades

  # N1: QUATRO estados de supervisão governam o acesso, e o super administrador
  # os IGNORA.
  @paridade @critico @invariante
  Esquema do Cenário: Cada estado de supervisão produz a mesma resposta, e o super administrador o ignora
    Dado um site da rede no estado "<estado>"
    Quando um visitante anônimo o pede às duas metades
    Então o código HTTP é idêntico nas duas
    E o corpo da resposta é idêntico byte a byte nas duas
    Quando um super administrador o pede
    Então as duas o atendem normalmente
    E o estado de supervisão é ignorado nas duas

    Exemplos:
      | estado            |
      | publico           |
      | arquivado         |
      | marcado-como-spam |
      | apagado           |

  # N3: dois estados diferentes produzem A MESMA resposta HTTP e a MESMA mensagem
  # — e são campos distintos no banco. Um alvo que os unificasse perderia a
  # distinção que a supervisão usa.
  @paridade @critico @invariante
  Cenário: Arquivado e marcado como spam produzem a mesma resposta, e continuam sendo campos distintos
    Dado um site arquivado e outro marcado como spam
    Quando os dois são pedidos às duas metades
    Então as respostas dos dois são idênticas entre si, nas duas metades
    E o código HTTP é o mesmo nos dois casos
    E a mensagem é idêntica byte a byte nos dois casos
    Quando o banco é inspecionado
    Então os dois estados estão em campos diferentes nas duas metades
    E nenhuma das duas unifica os dois campos

  # N2: a coluna de exclusão tem TRÊS valores, não dois, e o terceiro significa
  # "não ativado".
  @paridade @critico @invariante
  Cenário: A coluna de exclusão de site tem três valores, e o terceiro significa não ativado
    Dado um site com cada um dos três valores possíveis na coluna de exclusão
    Quando cada um é avaliado pelas duas metades
    Então as três decisões são idênticas nas duas
    E o valor que significa não ativado é tratado de forma distinta dos outros dois nas duas
    E nenhuma das duas trata o valor de não ativado como site ativo

  # N4: cada estado tem gancho de ENTRADA e de SAÍDA. São pontos de extensão, e
  # perder um deles quebra extensão de supervisão.
  @paridade @critico
  Cenário: Cada estado de site tem ponto de extensão de entrada e de saída
    Dado uma extensão registrada no ponto de entrada e no de saída de cada estado
    Quando cada estado é ligado e desligado nas duas metades
    Então a sequência de pontos acionados é idêntica nas duas
    E o conjunto de pontos existentes é idêntico nas duas
    E nenhum ponto do legado deixou de existir no sistema novo

  @paridade @invariante
  Cenário: O nome de site tem comprimento mínimo e herda a lista de proibidos, somada aos nomes de página
    Dado um nome de site abaixo do comprimento mínimo
    Quando o cadastro é tentado nas duas metades
    Então as duas recusam, com a mesma mensagem
    Quando um nome presente na lista de proibidos é tentado
    Então as duas recusam
    Quando um nome que coincide com o de uma página do site principal é tentado
    Então as duas recusam, e a razão registrada é a mesma

  # U7: cadastro pendente RESERVA o nome pelo prazo do legado.
  @paridade @invariante
  Cenário: Cadastro pendente reserva o nome pelo prazo do legado
    Dado um cadastro pendente de um nome
    Quando outro cadastro do mesmo nome é tentado dentro do prazo nas duas metades
    Então as duas recusam, com a mesma mensagem
    Quando o tempo avança além do prazo
    Então as duas aceitam o cadastro do mesmo nome
    E o instante exato em que a reserva deixa de valer é o mesmo nas duas

  @paridade @invariante
  Cenário: O domínio do endereço de e-mail pode ser restringido ou banido na rede
    Dado a lista de domínios permitidos preenchida
    Quando um cadastro de domínio fora da lista é tentado nas duas metades
    Então as duas recusam, com a mesma mensagem
    Quando a lista de domínios banidos contém o domínio do cadastro
    Então as duas recusam, com a mesma mensagem
    Quando as duas listas estão vazias
    Então as duas aceitam qualquer domínio

  # U9: ativar cadastro gera senha de comprimento fixo e, se o login já existir
  # como conta, devolve ERRO.
  @paridade @invariante
  Cenário: Ativar cadastro gera senha de comprimento fixo, e login já existente é erro
    Dado um cadastro pendente com um login que não existe como conta
    Quando ele é ativado nas duas metades
    Então as duas geram senha do mesmo comprimento
    E as duas criam a conta com os mesmos campos
    Mas um cadastro cujo login já existe como conta é recusado
    Quando esse cadastro é ativado
    Então as duas devolvem erro, com a mesma mensagem
    E nenhuma das duas cria conta duplicada

  # A chave de ativação NÃO TEM PRAZO, e reabrir o cadastro NÃO a invalida. É um
  # dos cinco pontos que decidem acesso sem consultar capacidade (PERM-12), e é
  # @divida-herdada.
  @paridade @critico @divida-herdada
  Cenário: A chave de ativação não tem prazo, e reabrir o cadastro não a invalida
    Dado uma chave de ativação emitida
    Quando o tempo avança um ano nas duas metades
    Então as duas ainda aceitam a chave
    Quando o cadastro é reaberto e uma chave nova é emitida
    Então as duas continuam aceitando a chave antiga
    E nenhuma das duas invalida a anterior

  # ADR-0009: a verificação de negação acontece ANTES da concessão geral.
  @paridade @critico @invariante
  Cenário: A negação explícita vence o super administrador, e é verificada antes da concessão geral
    Dado um super administrador da rede
    Quando uma capacidade negada explicitamente é verificada nas duas metades
    Então as duas negam
    Quando qualquer outra capacidade é verificada
    Então as duas concedem
    E a ordem entre negação e concessão é a mesma nas duas

  # PERM-10: em rede, o administrador de um site é "um editor com configuração".
  @paridade @critico
  Cenário: Em rede, o administrador de site perde poderes que tem fora da rede
    Dado um administrador de site em instalação de rede
    Quando o conjunto de capacidades concedidas a ele é enumerado nas duas metades
    Então ele é idêntico nas duas
    E ele é menor que o conjunto do mesmo papel fora da rede, igualmente nas duas
    E a capacidade de HTML não filtrado é negada a ele nas duas

  # N7: criar o conjunto de tabelas de um site novo REPOVOA os papéis a partir do
  # código. É o ÚNICO momento em que isso acontece.
  @paridade @critico @invariante
  Cenário: Criar um site novo é o único momento em que os papéis são repovoados do código
    Dado uma rede com a definição de papéis do site principal alterada em execução
    Quando um site novo é criado nas duas metades
    Então as duas repovoam os papéis do site novo a partir do código
    E o valor gravado é idêntico byte a byte nas duas
    E a definição do site principal permanece alterada nas duas
    Quando qualquer outra operação de rede é executada
    Então nenhuma das duas repovoa papéis

  @paridade @concorrencia
  Cenário: Duas operações concorrentes em sites diferentes não trocam de contexto de site
    Dado duas requisições autenticadas em sites diferentes da mesma rede
    Quando as duas são atendidas ao mesmo tempo no mesmo processo
    Então cada resposta usa o prefixo de tabela do seu próprio site
    E a definição de papéis aplicada a cada uma é a do seu próprio site
    E nenhuma das duas lê opção do site da outra
    E o resultado é idêntico ao de executar as duas em sequência no oráculo

  # A-3: não se sabe se a instalação é multisite. Se não for, esta fatia sai
  # INTEIRA. O cenário fica registrado para que a dúvida não seja esquecida.
  @paridade
  Cenário: O escopo desta fatia depende de uma resposta que ainda não existe
    Dado a instalação de referência
    Quando o modo de instalação é conferido
    Então sendo ela de rede, todos os cenários deste arquivo valem
    Mas não sendo ela de rede, este arquivo inteiro sai do conjunto
    E a resposta é registrada antes de a fatia ser planejada
