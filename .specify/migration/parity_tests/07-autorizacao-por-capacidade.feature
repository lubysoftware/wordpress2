# language: pt
# spec-id: PT-007
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/capacidades-e-papeis.md · _reversa_sdd/flowcharts/capacidades-e-papeis-map_meta_cap.md
#   target_architecture: BC-05 Identidade e Acesso · BC-09 Superfícies de Programação · plataforma/autorizacao · AD-02
#   paradigma_alvo: Opção 3 híbrido — autorização é POLÍTICA, não aggregate; a decisão é síncrona
#   regras: BR-MIGRAR-087 a BR-MIGRAR-099 (PERM-1 a PERM-13) · BR-MIGRAR-074 (I7)
#   fatia: 6 — identidade e autorização
#   area_da_decisao_2: efeito no banco + teste próprio de concorrência
#   casos_de_uso: UC-24, UC-40 (autoria por remetente de e-mail), UC-44, UC-46
#   adr: ADR-0001 · ADR-0009
#   decisao_humana_que_trava: BR-HUMANA-008 (default aberto de rota REST sem permission_callback)
#
# O achado que este arquivo protege: a matriz papel por capacidade NÃO EXISTE
# como dado no legado. Ela foi derivada executando simbolicamente as oito rotinas
# de povoamento de papéis. E QUATRO capacidades que o código exige não estão em
# papel algum: entram por ponto de extensão. Quem migrar lendo só o povoamento
# produz um sistema onde ninguém retoma extensão pausada.
#
# E TRÊS CAMADAS PARALELAS de autorização, cada uma com sua própria falha padrão
# — uma delas falhando ABERTA. Qualquer coexistência das duas metades tem de
# produzir a MESMA decisão de acesso nas duas, ou a fatia vira falha de segurança.

Funcionalidade: Decisão de autorização por capacidade, nas três camadas paralelas
  Como qualquer ator, humano ou programático
  Quero que a decisão de acesso seja a MESMA do legado
  Para que a virada não produza um sistema mais fechado nem mais aberto que ele

  Contexto:
    Dado um oráculo com o legado na mesma versão
    E a mesma definição de papéis gravada no metadado serializado das duas metades
    E o cache de objeto desligado nas duas metades

  # PERM-1 e PERM-2 + ADR-0001: o papel é DADO MUTÁVEL, não código. Vive numa
  # chave dentro de um metadado serializado POR SITE, com o papel dentro do nome
  # da chave.
  @paridade @critico @invariante
  Cenário: O papel é dado mutável e vive em metadado serializado por site
    Dado a definição de papéis lida das duas metades
    Quando ela é comparada campo por campo
    Então a estrutura serializada é idêntica byte a byte nas duas
    Quando uma capacidade é acrescentada a um papel em execução
    Então as duas metades passam a conceder essa capacidade
    E o valor gravado no metadado é idêntico byte a byte nas duas
    E nenhuma das duas lê a definição de papéis do código após a instalação

  @paridade @critico
  Esquema do Cenário: A decisão por papel é a mesma nas duas metades, capacidade por capacidade
    Dado um ator com o papel "<papel>"
    Quando a capacidade "<capacidade>" é verificada
    Então a decisão do sistema novo é idêntica à do oráculo
    E a decisão não muda se a verificação for repetida na mesma requisição

    Exemplos:
      | papel         | capacidade            |
      | administrador | unfiltered_html       |
      | administrador | manage_options        |
      | editor        | unfiltered_html       |
      | editor        | moderate_comments     |
      | editor        | manage_options        |
      | autor         | publish_posts         |
      | autor         | moderate_comments     |
      | colaborador   | publish_posts         |
      | colaborador   | edit_posts            |
      | assinante     | read                  |
      | assinante     | edit_posts            |

  # PERM-3 e PERM-4: capacidade sobre objeto NÃO é verificada direto, é TRADUZIDA.
  # E todo caminho de erro da tradução FECHA a porta.
  @paridade @critico @invariante
  Cenário: Capacidade sobre objeto é traduzida, e todo caminho de erro fecha a porta
    Dado um ator com papel de editor e um conteúdo de outro autor
    Quando uma capacidade sobre esse objeto é verificada
    Então as duas metades traduzem a capacidade antes de decidir
    E a decisão final é idêntica nas duas
    Quando a mesma capacidade é verificada sem informar o objeto
    Então as duas metades negam
    Quando o objeto informado não existe
    Então as duas metades negam
    E nenhuma das duas concede por ausência de informação

  # PERM-7: QUATRO capacidades que o código EXIGE não estão em papel algum e
  # entram por ponto de extensão. Este é o cenário que o migrador desatento quebra.
  @paridade @critico @substituicao
  Esquema do Cenário: As quatro capacidades fora de qualquer papel entram por ponto de extensão
    Dado nenhuma extensão registrada no ponto de concessão de capacidade
    Quando a capacidade "<capacidade>" é verificada para um administrador
    Então as duas metades negam
    Quando o ponto de extensão correspondente concede a capacidade
    Então as duas metades passam a permitir a operação que a exige
    E a operação produz o mesmo efeito observável nas duas

    Exemplos:
      | capacidade               |
      | install_languages        |
      | resume_plugins           |
      | resume_themes            |
      | view_site_health_checks  |

  # PERM-8: QUATRO constantes RETIRAM poder de quem já o tem, inclusive de
  # administrador e de super administrador. É o único mecanismo do sistema que
  # funciona assim.
  @paridade @critico
  Esquema do Cenário: Uma constante retira poder de quem já o tem, inclusive do super administrador
    Dado a constante "<constante>" definida
    Quando a capacidade que ela afeta é verificada para um super administrador
    Então a decisão do sistema novo é idêntica à do oráculo
    E a revogação acontece antes de qualquer consulta ao papel nas duas

    Exemplos:
      | constante                  |
      | DISALLOW_UNFILTERED_HTML   |
      | DISALLOW_FILE_EDIT         |
      | DISALLOW_FILE_MODS         |
      | ALLOW_UNFILTERED_UPLOADS   |

  # PERM-11: TRÊS camadas paralelas, cada uma com sua própria falha padrão, e
  # UMA FALHA ABERTA. BR-HUMANA-008 ainda não respondeu se isso muda.
  @paridade @critico @divida-herdada
  Cenário: As três camadas paralelas mantêm cada uma a sua própria falha padrão
    Dado uma verificação de capacidade sem decisão explícita
    Então as duas metades negam, pela camada de capacidades
    Mas uma rota de API sem retorno de permissão declarado FUNCIONA
    Quando uma rota de API é registrada sem declarar retorno de permissão
    Então as duas metades a atendem, sem negar
    E as duas emitem o mesmo aviso, ou a mesma ausência de aviso
    Mas uma habilidade sem retorno de permissão é ERRO, não liberação
    Quando uma habilidade é registrada sem declarar retorno de permissão
    Então as duas metades recusam executá-la, com a mesma mensagem

  # ADR-0009: a NEGAÇÃO EXPLÍCITA VENCE o super administrador, e a verificação
  # acontece antes da concessão geral.
  @paridade @critico @invariante
  Cenário: A negação explícita vence o super administrador
    Dado um super administrador em instalação de rede
    Quando uma capacidade negada explicitamente é verificada
    Então as duas metades negam
    Quando qualquer outra capacidade é verificada
    Então as duas metades concedem
    E a ordem entre a verificação de negação e a concessão geral é a mesma nas duas

  @paridade @critico
  Cenário: Os atalhos de nomenclatura resolvem uma capacidade em outra, igualmente nas duas
    Dado um ator sem o papel de administrador
    Quando uma capacidade que é atalho de outra é verificada
    Então as duas metades resolvem para a mesma capacidade de destino
    E a decisão final é idêntica nas duas
    E o conjunto de atalhos reconhecido é o mesmo nas duas

  # PERM-12: CINCO pontos decidem acesso SEM CONSULTAR o modelo de capacidades.
  # Quem portar lendo só a matriz de papéis produz um sistema MAIS FECHADO.
  @paridade @critico @divida-herdada
  Esquema do Cenário: Cinco pontos decidem acesso sem consultar o modelo de capacidades
    Dado o ponto de acesso "<ponto>"
    Quando o acesso é concedido por ele
    Então nenhuma das duas metades consulta o modelo de capacidades
    E a condição de concessão é idêntica nas duas
    E a ausência de prazo ou de limite de tentativa, onde existe no legado, é reproduzida

    Exemplos:
      | ponto                                        |
      | senha-de-conteudo-em-texto-claro             |
      | chave-de-confirmacao-de-dado-pessoal         |
      | chave-de-recuperacao-consumida-antes-de-conferida |
      | autoria-por-remetente-de-e-mail              |
      | chave-de-ativacao-de-cadastro-em-rede        |

  # ÁREA 5 DA DECISÃO 2. 1.279 pontos de verificação de capacidade em 224
  # arquivos: se a identidade corrente virar estado de módulo, duas requisições
  # concorrentes trocam de decisão de acesso entre si. E UMA das três camadas
  # falha ABERTA.
  @paridade @critico @concorrencia
  Cenário: Duas verificações concorrentes de identidades diferentes não trocam de decisão
    Dado um administrador e um assinante, cada um com sessão válida
    Quando os dois pedem a mesma rota protegida ao mesmo tempo, no mesmo processo do sistema novo
    Então o assinante recebe negação e o administrador recebe permissão
    E nenhuma das duas decisões corresponde à identidade da outra
    E repetir o cenário mil vezes não produz nenhuma inversão
    E o mesmo vale quando a rota é atendida pela camada de API sem retorno de permissão declarado

  @paridade @composicao
  Cenário: A política de autorização é equivalente sem depender de estado global
    Dado a política exercitada com a identidade entregue pelo contexto da requisição, não por variável global
    Quando a matriz completa de papel por capacidade é percorrida
    Então toda decisão é idêntica à do oráculo
    E nenhum ponto da política lê identidade de fora do contexto da requisição

  # PERM-13: a definição de papel é um RETRATO tirado na instalação. Criar o
  # conjunto de tabelas de um site novo é o único momento em que o código
  # repovoa os papéis.
  @paridade @invariante
  Cenário: A definição de papel é um retrato da instalação, e só o site novo a repovoa do código
    Dado uma instalação cuja definição de papéis foi alterada em execução
    Quando qualquer atualização do sistema é aplicada nas duas metades
    Então nenhuma das duas repovoa os papéis a partir do código
    Quando um site novo é criado na rede
    Então as duas repovoam os papéis daquele site a partir do código
    E o valor resultante é idêntico byte a byte nas duas
