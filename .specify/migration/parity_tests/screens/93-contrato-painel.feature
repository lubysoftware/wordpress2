# language: pt
# spec-id: PTS-018
# rastreabilidade:
#   process_flows: _reversa_sdd/migration/target_screens.md § "Tela: <cada tela da tabela de Exemplos>"
#   target_architecture: BC-10 Painel · BC-07 Apresentação · entradas/ (rota preservada) · AD-12 (caminho público preservado)
#   paradigma_alvo: Opção 3 híbrido — modo MODERNIZADO: contrato SEMÂNTICO, SEM comparação byte a byte
#   grupo de telas: Painel · 54 telas em modo modernizado
#   modo: modernizado · deviations: DEV-001 em todas · DEV-004 (SCR-057) · DEV-005 (SCR-084)
#   fatia: 9 — painel
#   area_da_decisao_2: comportamento de caso de uso (os 47 UCs), tolerância de 1%
#
# O QUE O MODO MODERNIZADO EXIGE, e o que ele NÃO exige.
# EXIGE: hierarquia de componentes, eventos declarados, conteúdo textual e os
# quatro estados (ocioso, carregando, erro, sucesso).
# NÃO EXIGE: comparação byte a byte nem comparação de pixel.
#
# DUAS RESTRIÇÕES QUE NÃO SÃO DE APRESENTAÇÃO:
#   1. a diferença de texto tem de ser ZERO: 2.984 strings foram copiadas
#      verbatim e NENHUMA revisão linguística foi aprovada. A chave do catálogo
#      é o texto inglês, e é assim que ele chega ao alvo.
#   2. a moldura do painel NÃO é um envelope único: das 80 telas do painel, 68
#      carregam a moldura e 12 NÃO — entre elas o instalador, que abre o próprio
#      cabeçalho de documento, e o reparo de banco, que roda SEM autenticação.
#      São DOIS contratos de documento. Um alvo que aplicar um layout único
#      quebra 12 telas, e quebra calado.

Funcionalidade: Contrato de tela do grupo Painel
  Como quem opera a virada das superfícies deste grupo
  Quero verificar o contrato semântico de cada tela modernizada
  Para que hierarquia, eventos, texto e os quatro estados correspondam ao legado
  sem exigir igualdade de bytes

  Contexto:
    Dado um oráculo com o legado na mesma versão e o mesmo conteúdo semeado
    E a rota pública de cada tela preservada byte a byte
    E a diferença de texto exigida igual a zero, ignorando espaço à direita

  @paridade-contrato-de-tela
  Esquema do Cenário: Cada tela modernizada deste grupo respeita o contrato semântico
    Dado a tela "<tela>", de identificador "<id>", com origem no legado em "<origem>"
    Quando a rota dela é pedida à implementação alvo e ao oráculo
    Então a hierarquia de componentes da saída alvo corresponde à da spec desta tela
    E todo evento declarado na spec existe na saída alvo
    E todo texto literal da spec aparece idêntico à chave do catálogo, em inglês
    E os quatro estados declarados na spec são alcançáveis na saída alvo
    E o contrato de documento desta tela é o declarado na spec, moldura própria ou herdada
    E a capacidade exigida para abrir a tela é a mesma nas duas metades

    Exemplos:
      | tela                            | id      | origem                                          |
      | painel-inicial                  | SCR-036 | wp-admin/index.php                              |
      | meus-sites                      | SCR-037 | wp-admin/my-sites.php                           |
      | atualizacoes                    | SCR-038 | wp-admin/update-core.php                        |
      | lista-de-conteudo               | SCR-039 | wp-admin/edit.php                               |
      | editor-classico                 | SCR-042 | wp-admin/edit-form-advanced.php                 |
      | comparacao-de-revisoes          | SCR-043 | wp-admin/revision.php                           |
      | lista-de-termos                 | SCR-044 | wp-admin/edit-tags.php                          |
      | edicao-de-termo                 | SCR-045 | wp-admin/term.php                               |
      | biblioteca-de-midia             | SCR-046 | wp-admin/upload.php                             |
      | envio-de-midia                  | SCR-047 | wp-admin/media-new.php                          |
      | lista-de-links                  | SCR-050 | wp-admin/link-manager.php                       |
      | cadastro-de-link                | SCR-051 | wp-admin/link-add.php                           |
      | importacao-de-opml              | SCR-052 | wp-admin/link-parse-opml.php                    |
      | fila-de-comentarios             | SCR-053 | wp-admin/edit-comments.php                      |
      | edicao-de-comentario            | SCR-054 | wp-admin/comment.php                            |
      | lista-de-temas                  | SCR-055 | wp-admin/themes.php                             |
      | biblioteca-de-fontes            | SCR-057 | wp-admin/font-library.php                       |
      | cabecalho-personalizado         | SCR-060 | wp-admin/includes/class-custom-image-header.php |
      | fundo-personalizado             | SCR-061 | wp-admin/includes/class-custom-background.php   |
      | instalar-tema                   | SCR-064 | wp-admin/theme-install.php                      |
      | editor-de-arquivo-de-tema       | SCR-065 | wp-admin/theme-editor.php                       |
      | lista-de-extensoes              | SCR-066 | wp-admin/plugins.php                            |
      | instalar-extensao               | SCR-067 | wp-admin/plugin-install.php                     |
      | editor-de-arquivo-de-extensao   | SCR-068 | wp-admin/plugin-editor.php                      |
      | progresso-de-instalacao         | SCR-069 | wp-admin/update.php                             |
      | lista-de-usuarios               | SCR-070 | wp-admin/users.php                              |
      | cadastro-de-usuario             | SCR-071 | wp-admin/user-new.php                           |
      | perfil-proprio                  | SCR-072 | wp-admin/profile.php                            |
      | edicao-de-usuario               | SCR-073 | wp-admin/user-edit.php                          |
      | ferramentas-disponiveis         | SCR-075 | wp-admin/tools.php                              |
      | importar                        | SCR-076 | wp-admin/import.php                             |
      | exportar                        | SCR-077 | wp-admin/export.php                             |
      | saude-do-site                   | SCR-078 | wp-admin/site-health.php                        |
      | saude-do-site-informacoes       | SCR-079 | wp-admin/site-health-info.php                   |
      | exportar-dados-pessoais         | SCR-080 | wp-admin/export-personal-data.php               |
      | apagar-dados-pessoais           | SCR-081 | wp-admin/erase-personal-data.php                |
      | apagar-site-da-rede             | SCR-082 | wp-admin/ms-delete-site.php                     |
      | instalacao-de-rede              | SCR-083 | wp-admin/network.php                            |
      | press-this                      | SCR-084 | wp-admin/press-this.php                         |
      | opcoes-gerais                   | SCR-085 | wp-admin/options-general.php                    |
      | opcoes-de-conectores            | SCR-086 | wp-admin/options-connectors.php                 |
      | opcoes-de-escrita               | SCR-087 | wp-admin/options-writing.php                    |
      | opcoes-de-leitura               | SCR-088 | wp-admin/options-reading.php                    |
      | opcoes-de-discussao             | SCR-089 | wp-admin/options-discussion.php                 |
      | opcoes-de-midia                 | SCR-090 | wp-admin/options-media.php                      |
      | opcoes-de-links-permanentes     | SCR-091 | wp-admin/options-permalink.php                  |
      | opcoes-de-privacidade           | SCR-092 | wp-admin/options-privacy.php                    |
      | guia-da-politica-de-privacidade | SCR-093 | wp-admin/privacy-policy-guide.php               |
      | gravacao-generica-de-opcoes     | SCR-094 | wp-admin/options.php                            |
      | sobre-o-wordpress               | SCR-095 | wp-admin/about.php                              |
      | creditos                        | SCR-096 | wp-admin/credits.php                            |
      | liberdades                      | SCR-097 | wp-admin/freedoms.php                           |
      | contribuir                      | SCR-098 | wp-admin/contribute.php                         |
      | privacidade-do-projeto          | SCR-099 | wp-admin/privacy.php                            |

  @paridade-contrato-de-tela
  Cenário: A diferença de texto do grupo é zero, porque nenhuma revisão foi aprovada
    Dado o conjunto de mensagens literais de todas as telas deste grupo
    Quando ele é comparado entre a implementação alvo e o oráculo
    Então a diferença é zero, ignorando apenas espaço à direita
    E nenhuma correção de rótulo foi aplicada
    E qualquer correção desejada entra como deviation de tipo correção, não como ajuste silencioso

  @paridade-contrato-de-tela
  Cenário: A rota pública de cada tela deste grupo é preservada
    Dado cada rota pública das telas deste grupo
    Quando ela é pedida às duas metades
    Então as duas respondem na mesma URL
    E nenhuma rota do legado deixou de existir no sistema novo
    E nenhuma rota nova foi introduzida neste grupo

  # DEV-004 e DEV-005: DUAS telas deste grupo NUNCA renderizam interface nesta
  # árvore. Teste de paridade contra esta árvore PASSARIA REPRODUZINDO O ERRO —
  # logo o único contrato verificável delas é o código HTTP e as mensagens de
  # recusa.
  @paridade-contrato-de-tela
  Cenário: As duas telas que nunca renderizam interface têm contrato de recusa, não de corpo
    Dado a tela da biblioteca de fontes, que nesta árvore responde sempre indisponível
    Quando ela é pedida às duas metades
    Então as duas devolvem o mesmo código de indisponibilidade
    E as duas devolvem as mesmas duas mensagens, idênticas à chave do catálogo
    E nenhuma asserção verifica corpo de interface desta tela
    Quando cada um dos quatro caminhos da tela de publicação rápida é pedido às duas metades
    Então as três mensagens de recusa são idênticas nas duas
    E o código HTTP de cada caminho é idêntico nas duas
    E as URLs de ativação e de instalação carregam o campo de uso único correto nas duas

  # LACUNA-ST-02: as quatro telas do gerenciador de links talvez não devam ser
  # traduzidas. O módulo está oculto por padrão e nenhum dos 56 módulos o cobre.
  @paridade-contrato-de-tela
  Cenário: As quatro telas do gerenciador de links dependem de uma decisão de escopo
    Dado a opção que habilita o gerenciador de links no valor padrão
    Quando as quatro telas são pedidas às duas metades
    Então as duas se comportam da mesma forma
    Mas se a decisão de escopo for descartá-las, as quatro linhas saem da tabela de Exemplos
    E a decisão é registrada antes de a fatia do painel ser planejada

  # O ACHADO QUE QUEBRA CALADO: 12 das 80 telas do painel NÃO carregam a moldura.
  @paridade-contrato-de-tela
  Cenário: As telas sem a moldura do painel não recebem o layout das outras
    Dado cada tela deste grupo cuja spec declara moldura própria
    Quando ela é servida pela implementação alvo
    Então ela abre o próprio cabeçalho de documento, como no oráculo
    E ela não recebe a moldura aplicada às outras telas do painel
    Quando a tela de reparo de banco é pedida sem sessão às duas metades
    Então as duas a atendem
    E nenhuma das duas acrescenta exigência de autenticação que o legado não tem
