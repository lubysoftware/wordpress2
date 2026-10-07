# language: pt
# spec-id: PT-013
# rastreabilidade:
#   process_flows: _reversa_sdd/flowcharts/atualizacoes-e-upgrader.md · _reversa_sdd/flowcharts/recovery-mode-e-tratamento-de-erro-fatal.md · _reversa_sdd/flowcharts/criptografia-e-assinaturas.md
#   target_architecture: BC-11 Operação do Software · AD-06 (nenhum retry de infraestrutura) · AD-09 (o adaptador reproduz o modo de falha)
#   paradigma_alvo: Opção 3 híbrido — a política de nova tentativa é ESCRITA À MÃO, caso a caso
#   regras: BR-MIGRAR-045 a BR-MIGRAR-056 (A1 a A12) · BR-MIGRAR-052 (A8)
#   aggregate: AGG-AtualizacaoAutomatica · AGG-ModoDeRecuperacao
#   fatia: 9 — painel
#   area_da_decisao_2: efeito no banco + comportamento de caso de uso
#   casos_de_uso: UC-33, UC-34, UC-35, UC-36
#   adr: ADR-0008 · ADR-0010
#   decisao_humana_que_trava: BR-HUMANA-007 (o destravamento depende de invariante não declarada entre dois arquivos)
#
# O CRITÉRIO DE ACEITE DESTE ARQUIVO É O NÚMERO DE E-MAILS AO ADMINISTRADOR.
# A política de nova tentativa do legado é escrita à mão, caso a caso, com efeito
# visível: falha transitória tem EXATAMENTE UMA segunda chance, em uma hora, e
# NÃO notifica — só a segunda falha manda e-mail. Falha crítica CONGELA a
# atualização até intervenção humana. E o mesmo aviso NÃO é repetido.
#
# Um retry genérico de fila sobrepõe as três e muda quantos e-mails o
# administrador recebe — que é comportamento observável. Quem tratar isso como
# "o broker resolve" quebra ADR-0008 e A7 de uma vez. E NÃO HÁ BROKER.
#
# A dívida herdada mais grave do pacote vive aqui: a assinatura do pacote NÃO É
# VERIFICADA e isso NÃO PRODUZ SINAL VISÍVEL. A lista de chaves confiáveis
# devolve lista vazia desde 2021-04-01, nenhum chamador exige verificação, e a
# falha é rebaixada a aviso com o caso "sem assinatura" SILENCIADO fora do modo
# de depuração. P11 e ADR-0010 mandam PRESERVAR.

Funcionalidade: Atualização do núcleo, política de nova tentativa e modo de recuperação
  Como administrador, ou como o próprio sistema
  Quero que a atualização, a falha e a recuperação se comportem exatamente como
  no legado
  Para que o número de e-mails, o congelamento e a tolerância à ausência de
  assinatura sejam idênticos

  Contexto:
    Dado um oráculo com o legado na mesma versão, com relógio controlável
    E a porta de e-mail substituída por duplo que CONTA mensagens enviadas nas duas metades
    E o cache de objeto desligado nas duas metades

  @paridade @critico @invariante
  Cenário: A atualização automática exige escrita no webroot e ausência de controle de versão
    Dado o webroot sem permissão de escrita
    Quando a atualização automática é avaliada nas duas metades
    Então nenhuma das duas atualiza
    E as duas registram o mesmo motivo
    Quando o webroot tem escrita mas existe pasta de controle de versão na árvore
    Então nenhuma das duas atualiza
    E o motivo registrado é o mesmo nas duas

  @paridade @critico @invariante
  Cenário: Versão menor atualiza por padrão, versão maior só com escolha explícita
    Dado uma versão menor disponível
    Quando a atualização automática é avaliada nas duas metades
    Então as duas atualizam
    Mas uma versão maior disponível não é aplicada sem escolha explícita
    Quando a atualização automática é avaliada com versão maior disponível
    Então nenhuma das duas atualiza
    Quando a escolha explícita por versão maior é registrada
    Então as duas atualizam

  @paridade @critico
  Cenário: A constante vence a opção, e a decisão ainda pode ser revertida por ponto de extensão
    Dado a constante de controle de atualização definida como falsa
    Quando a atualização é avaliada nas duas metades
    Então nenhuma das duas atualiza, mesmo com a opção ligada
    Quando um ponto de extensão reverte a decisão
    Então as duas voltam a atualizar
    E a ordem entre constante, opção e ponto de extensão é a mesma nas duas

  @paridade @critico @invariante
  Cenário: Não se atualiza para versão que o ambiente não suporta
    Dado uma versão disponível que exige ambiente superior ao instalado
    Quando a atualização é avaliada nas duas metades
    Então nenhuma das duas atualiza
    E o motivo registrado é o mesmo nas duas
    E nenhuma das duas tenta e falha: as duas recusam antes

  # A5 + ADR-0008: falha crítica CONGELA até intervenção humana. E NADA a desfaz
  # sozinho.
  @paridade @critico @invariante
  Cenário: Falha crítica congela a atualização automática e nada a desfaz sozinho
    Dado uma atualização que falha de forma crítica
    Quando a falha ocorre nas duas metades
    Então as duas gravam o congelamento na mesma opção, com o mesmo valor
    Quando o tempo avança trinta dias e a atualização é avaliada de novo
    Então nenhuma das duas atualiza
    E nenhuma das duas desfaz o congelamento por decurso de tempo
    Quando a intervenção humana registrada acontece
    Então as duas voltam a avaliar a atualização

  # A6: EXATAMENTE UMA segunda chance, em uma hora, e NÃO notifica. O número de
  # e-mails é o critério: ZERO na primeira falha, UM na segunda.
  @paridade @critico @idempotencia
  Cenário: Falha transitória tem exatamente uma segunda chance, e só a segunda notifica
    Dado uma atualização que falha de forma transitória
    Quando a primeira falha ocorre nas duas metades
    Então o número de e-mails enviados é zero nas duas
    E as duas reagendam a tentativa para o mesmo instante, uma hora depois
    Quando o tempo avança uma hora e a segunda tentativa falha
    Então o número de e-mails enviados é exatamente um nas duas
    E nenhuma das duas agenda uma terceira tentativa
    E nenhuma das duas aplica recuo exponencial

  # A7: o MESMO aviso NÃO é repetido. A contagem de e-mails por período é
  # comparada ao oráculo.
  @paridade @critico @idempotencia
  Cenário: O mesmo aviso não é repetido, e a contagem por período é idêntica
    Dado uma condição que gera aviso ao administrador
    Quando a condição persiste por dez ciclos de avaliação nas duas metades
    Então o número de e-mails enviados é o mesmo nas duas
    E esse número é menor que o número de ciclos nas duas
    Quando a condição muda e volta
    Então o comportamento de notificação é idêntico nas duas

  # A8 + ADR-0010 + P11: a assinatura NÃO é verificada, a lista de chaves é VAZIA,
  # e a falha é rebaixada a aviso com o caso "sem assinatura" SILENCIADO fora do
  # modo de depuração. O ADAPTADOR NOVO REPRODUZ ISSO DE PROPÓSITO (AD-09).
  @paridade @critico @divida-herdada
  Cenário: A assinatura do pacote não é verificada, e a ausência não produz sinal visível
    Dado um pacote de atualização sem assinatura
    Quando ele é instalado nas duas metades
    Então as duas instalam
    E nenhuma das duas interrompe a instalação
    E nenhuma das duas emite aviso visível ao administrador
    Quando a lista de chaves confiáveis é consultada nas duas metades
    Então ela é vazia nas duas
    Quando o modo de depuração é ligado
    Então as duas emitem o mesmo aviso, com a mesma mensagem

  @paridade @critico @divida-herdada
  Cenário: Um pacote com assinatura inválida também é tolerado, como no legado
    Dado um pacote com assinatura presente e inválida
    Quando ele é instalado nas duas metades
    Então o comportamento é idêntico nas duas
    E a decisão de instalar ou recusar é a mesma nas duas
    E nenhuma das duas endurece a verificação sem decisão registrada

  @paridade @critico @invariante
  Cenário: O modo de recuperação dura o prazo do legado e avisa uma vez por dia
    Dado o modo de recuperação iniciado por erro fatal
    Quando o tempo avança dentro do prazo nas duas metades
    Então as duas mantêm o modo ativo
    E o número de avisos enviados por dia é um nas duas
    Quando o prazo vence
    Então as duas encerram o modo
    E o estado final gravado é o mesmo nas duas

  @paridade @critico @invariante
  Cenário: Erro em superfície pública não aciona o modo de recuperação
    Dado um erro fatal numa superfície pública
    Quando ele ocorre nas duas metades
    Então nenhuma das duas inicia o modo de recuperação
    E as duas respondem com a mesma tela de erro
    Mas um erro fatal no painel aciona o modo
    Quando um erro fatal ocorre no painel
    Então as duas iniciam o modo de recuperação

  @paridade @critico @invariante
  Cenário: Sair do modo de recuperação retoma todas as extensões pausadas de uma vez
    Dado três extensões pausadas pelo modo de recuperação
    Quando a saída do modo é executada nas duas metades
    Então as duas retomam as três de uma vez
    E as duas zeram o contador de limite na mesma operação
    E nenhuma das duas retoma uma extensão de cada vez

  # ADR-0007: a chave de recuperação é CONSUMIDA ANTES de ser validada. É
  # @divida-herdada e não defeito a corrigir.
  @paridade @critico @divida-herdada
  Cenário: A chave de recuperação é consumida antes de ser validada
    Dado uma chave de recuperação emitida
    Quando uma chave inválida é apresentada nas duas metades
    Então as duas consomem a chave armazenada antes de recusar
    E a chave válida original deixa de funcionar nas duas
    E o ator tem de pedir outra chave nas duas

  # BR-HUMANA-007: o destravamento depende de uma INVARIANTE NÃO DECLARADA entre
  # dois arquivos. Este cenário existe para que a invariante apareça, de um jeito
  # ou de outro.
  @paridade @critico
  Cenário: O destravamento da atualização automática depende da invariante não declarada
    Dado a atualização automática congelada por falha crítica
    Quando a condição que o legado usa para destravar é reproduzida nas duas metades
    Então as duas destravam, ou as duas não destravam
    E a condição exata que produziu o resultado é registrada no relatório de paridade
    E se as duas divergirem, a invariante é declarada com teste antes da virada
