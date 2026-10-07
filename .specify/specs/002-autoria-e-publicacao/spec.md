# Autoria e publicação

**Origem:** épico EP-2 do backlog do sistema legado (`escrever conteúdo e levá-lo ao público, por decisão explícita`)  
**Cards:** REQ-019, REQ-020, REQ-021, REQ-022, REQ-023, REQ-024, REQ-025, REQ-026, REQ-027, REQ-029, REQ-031

## Por que esta feature existe

Publicar é ato explícito, e é esta feature que leva essa frase até o código. O épico
EP-2 cobre a gravação do rascunho quando ninguém informa estado, a transição para
publicado, o identificador na URL que só precisa ser único a partir da publicação, o
conteúdo privado, o agendamento para data futura com verificação dupla na hora de
publicar, a submissão para revisão de quem pode publicar, a publicação por outra pessoa
preservando a autoria original, as versões anteriores e o rascunho automático criado ao
abrir o editor.

A parte delicada não é gravar: é a quantidade de regra que o legado pendura na transição
de estado, e quase toda ela é invisível para quem olha a tela. Duas regras diferentes
governam a mesma coluna de estado dependendo de quem escreve, porque a gravação por
programa assume rascunho enquanto o esquema do banco assume publicado. Republicar o que
já está publicado é operação nula e não dispara ponto de extensão nenhum. O
identificador na URL de um rascunho muda sozinho ao publicar, porque a unicidade é
dispensada antes disso. E quem não pode publicar tem o identificador esvaziado enquanto
o conteúdo está em revisão, para não reservar endereço que ele não pode usar. São
comportamentos que ninguém adivinha e que só um teste de paridade pega.

## Histórias de usuário

### US-1 — Publicar conteúdo próprio por ato explícito

Como autor, quero tornar o meu conteúdo visível ao público do site, para que ele passe a ser lido.

**Critérios de aceite**

- [ ] CA-1.1 A publicação exige a capacidade de publicar aquele tipo de conteúdo; sem ela a ação é recusada com 403 na API e com recusa explícita na tela
- [ ] CA-1.2 Publicar grava o estado publicado e dispara a transição de estado uma única vez
- [ ] CA-1.3 O conteúdo publicado passa a aparecer na consulta pública e tem endereço definitivo
- [ ] CA-1.4 Toda taxonomia que declare termo padrão fica com ao menos um termo atribuído ao fim da publicação
- [ ] CA-1.5 Evento de publicação agendada pendente para aquele conteúdo é removido

**Regras de negócio que valem aqui**

- P1 — publicar é ato explícito `domain.md §2.1`
- P3 — conteúdo do tipo padrão sempre tem categoria `domain.md §2.1`
- P7 — republicar é operação nula `domain.md §2.1`

**Depende de:** REQ-015, REQ-033, fora desta feature

### US-2 — Gravar rascunho quando o estado não é informado

Como autor, quero que um conteúdo salvo sem eu dizer que é para publicar fique guardado como rascunho, para nunca publicar sem querer.

**Critérios de aceite**

- [ ] CA-2.1 Gravar conteúdo sem informar o estado resulta em rascunho, nunca em publicado
- [ ] CA-2.2 O default do armazenamento não contradiz esta regra: não existe caminho em que a omissão publique
- [ ] CA-2.3 Conteúdo em rascunho não aparece em consulta pública alguma

**Regras de negócio que valem aqui**

- P1 — publicar é ato explícito: a escrita grava rascunho quando o estado não é informado, enquanto o default do esquema é publicado. Duas regras para a mesma coluna, dependendo de quem escreve `domain.md §2.1`

### US-3 — Exigir identificador único na URL só a partir da publicação

Como autor, quero poder trabalhar em rascunhos com títulos parecidos sem o sistema brigar por endereço, e ter endereço único garantido quando o conteúdo for ao ar.

**Critérios de aceite**

- [ ] CA-3.1 Em rascunho, pendente e rascunho automático, identificadores de URL repetidos são aceitos
- [ ] CA-3.2 Na publicação, o identificador é tornado único e o conteúdo passa a responder nesse endereço
- [ ] CA-3.3 O autor é informado quando o identificador muda na publicação, em lugar de descobrir pelo endereço quebrado
- [ ] CA-3.4 Em conteúdo pendente de quem não pode publicar, o identificador fica vazio e só é atribuído na publicação

**Regras de negócio que valem aqui**

- P4 — colaborador não escolhe a URL do que está em revisão `domain.md §2.1`
- P5 — rascunho pode ter identificador duplicado; publicado, não. O identificador do rascunho muda sozinho ao publicar `domain.md §2.1`

**Depende de:** US-2 (REQ-020)

### US-4 — Publicar conteúdo como privado, visível só a quem tem a permissão declarada

Como autor, quero publicar um conteúdo que só pessoas com permissão enxerguem, para usar o site como canal interno sem tirá-lo do ar.

**Critérios de aceite**

- [ ] CA-4.1 Escolher visibilidade privada grava um estado distinto de publicado
- [ ] CA-4.2 O conteúdo privado exige, para leitura, a capacidade de ler conteúdo privado
- [ ] CA-4.3 Visitante anônimo recebe a mesma resposta que receberia para conteúdo inexistente
- [ ] CA-4.4 O conteúdo privado não aparece em listagem pública, feed nem sitemap

**Depende de:** US-1 (REQ-019) · REQ-015, fora desta feature

### US-5 — Tratar a republicação do que já está publicado como operação sem efeito

Como integrador, quero que pedir a publicação de um conteúdo já publicado não produza efeito nenhum, para poder repetir a chamada sem disparar notificação ou automação duas vezes.

**Critérios de aceite**

- [ ] CA-5.1 Pedir a publicação de conteúdo já publicado retorna sucesso sem alterar o registro
- [ ] CA-5.2 Nenhuma transição de estado é disparada nesse caminho
- [ ] CA-5.3 Nenhuma notificação, nenhum agendamento e nenhuma automação ligada à publicação é acionada

**Regras de negócio que valem aqui**

- P7 — republicar é operação nula: nenhum gancho de transição dispara `domain.md §2.1`

**Depende de:** US-1 (REQ-019)

### US-6 — Agendar a publicação para data futura, com verificação dupla na hora de publicar

Como autor, quero marcar uma data futura para o conteúdo aparecer sozinho, para preparar a publicação com antecedência.

**Critérios de aceite**

- [ ] CA-6.1 Salvar conteúdo publicado com data mais de 60 segundos à frente do instante atual resulta em estado agendado, sem comando próprio
- [ ] CA-6.2 Salvar conteúdo agendado com data no passado o publica na hora, pela mesma comparação
- [ ] CA-6.3 Na hora de publicar, o sistema recusa publicar o que não está mais em estado agendado
- [ ] CA-6.4 Se a data ainda não chegou quando o evento roda, o evento é reagendado em lugar de publicar
- [ ] CA-6.5 Qualquer transição de estado do conteúdo limpa o evento pendente

**Regras de negócio que valem aqui**

- P6 — agendamento é guardado por verificação dupla `domain.md §2.1`
- ADR 0005 — agendamento por comparação de data, não por transição

**Depende de:** US-1 (REQ-019) · REQ-122, fora desta feature

### US-7 — Submeter conteúdo próprio para revisão de quem pode publicar

Como colaborador, quero entregar o meu texto para que alguém com poder de publicar o avalie, para contribuir sem ter o poder de pôr no ar.

**Critérios de aceite**

- [ ] CA-7.1 Quem tem permissão de escrever e não tem de publicar envia o conteúdo para o estado pendente
- [ ] CA-7.2 O conteúdo pendente aparece na fila de quem pode publicar aquele tipo
- [ ] CA-7.3 O conteúdo pendente não aparece em consulta pública alguma
- [ ] CA-7.4 Quem não pode publicar não reserva endereço: o identificador de URL fica vazio
- [ ] CA-7.5 Quem pode publicar e ainda assim envia para revisão mantém o identificador escolhido
- [ ] CA-7.6 Ler o conteúdo pendente de outra pessoa exige poder editá-lo

**Regras de negócio que valem aqui**

- P4 — colaborador não escolhe a URL do que está em revisão `domain.md §2.1`
- P5 — a unicidade do identificador é dispensada em pendente `domain.md §2.1`

**Depende de:** US-3 (REQ-021) · REQ-015, fora desta feature

### US-8 — Revisar e publicar conteúdo de outro autor preservando a autoria original

Como editor, quero avaliar, ajustar e publicar o texto que outra pessoa escreveu, para manter a qualidade do que vai ao ar sem me apropriar do trabalho dela.

**Critérios de aceite**

- [ ] CA-8.1 A autorização soma a capacidade de mexer em conteúdo alheio à capacidade exigida pelo estado do conteúdo
- [ ] CA-8.2 A publicação mantém o autor original gravado no registro
- [ ] CA-8.3 O identificador de URL, vazio no pendente de colaborador, é fixado na publicação
- [ ] CA-8.4 Devolver o conteúdo ao autor volta o estado para rascunho sem perder o texto
- [ ] CA-8.5 Conteúdo hierárquico (página) resolve numa família de capacidades distinta da do conteúdo em linha do tempo
- [ ] CA-8.6 Conteúdo com função especial declarada exige a capacidade dessa função, que o papel editorial pode não ter

**Regras de negócio que valem aqui**

- Nenhuma capacidade de página chega a autor ou colaborador: a assimetria é deliberada
- A resolução de edição depende de quem é o autor e de em que estado o conteúdo está

**Depende de:** US-7 (REQ-025) · REQ-015, fora desta feature

### US-9 — Notificar o autor quando o conteúdo é devolvido ou publicado por outra pessoa

Como autor que submeteu um texto, quero ser avisado quando ele é devolvido ou publicado, para não precisar ficar conferindo a fila.

**Critérios de aceite**

- [ ] CA-9.1 Devolver conteúdo pendente para rascunho envia aviso ao autor original
- [ ] CA-9.2 Publicar conteúdo de outra pessoa envia aviso ao autor original
- [ ] CA-9.3 O aviso diz quem agiu e qual o estado novo
- [ ] CA-9.4 Falha no envio do aviso não impede a transição de estado, e fica registrada

**Depende de:** US-8 (REQ-026)

### US-10 — Guardar versões anteriores do conteúdo editado

Como autor, quero poder olhar e recuperar uma versão anterior do que escrevi, para desfazer uma alteração ruim sem reescrever o texto.

**Critérios de aceite**

- [ ] CA-10.1 Cada gravação de conteúdo já existente guarda a versão anterior, vinculada ao conteúdo
- [ ] CA-10.2 A quantidade de versões guardadas é configurável, inclusive para guardar todas
- [ ] CA-10.3 Uma versão não é editável e não é apagável por permissão de conteúdo
- [ ] CA-10.4 Restaurar uma versão substitui o corpo corrente e guarda o corrente como versão nova

**Regras de negócio que valem aqui**

- Revision é conteúdo filho do conteúdo editado, com estado herdado, e não se apaga por capacidade própria
- `WP_POST_REVISIONS` define quantas versões de um conteúdo se guardam

**Depende de:** US-1 (REQ-019)

### US-11 — Criar rascunho automático ao abrir o editor, antes de qualquer digitação

Como autor, quero que o sistema reserve um registro assim que eu abro o editor, para que o salvamento automático tenha onde escrever desde o primeiro caractere.

**Critérios de aceite**

- [ ] CA-11.1 Abrir o editor de um conteúdo novo cria um registro em estado de rascunho automático
- [ ] CA-11.2 O rascunho automático não aparece em listagem alguma, pública ou do painel
- [ ] CA-11.3 O estado de rascunho automático não pode ser pedido por quem chama a API: é criado só por este caminho
- [ ] CA-11.4 O salvamento automático escreve nesse registro no intervalo configurado

**Regras de negócio que valem aqui**

- Auto-draft é rascunho criado pelo ato de abrir o editor, antes de qualquer digitação
- `AUTOSAVE_INTERVAL` define de quanto em quanto tempo o editor salva sozinho

**Depende de:** US-2 (REQ-020)

## Fora de escopo

Nenhum card de descarte nesta feature, e nada mais a declarar fora de escopo.

## Perguntas em aberto

- [ ] REQ-030 (sanitizar o corpo do conteúdo na gravação, salvo privilégio declarado) ficou `bloqueado` e não entrou no pacote. Esta feature grava corpo de conteúdo sem que nada aqui diga como ele é sanitizado, e a regra P8 do domínio põe o privilégio de marcação bruta também no papel de editor, não só no de administrador. Quem construir US-1 a US-8 sem REQ-030 decide a sanitização sozinho.
- [ ] REQ-032 (formato declarado de armazenamento do corpo em blocos) ficou `bloqueado` pela ausência do lado cliente nesta árvore, e a resposta 15 resolve a ausência mandando construir a partir do repositório de origem. O card volta à seleção antes de esta feature começar, ou o corpo é portado sem formato declarado?
- [ ] REQ-028 (registrar quem decidiu cada transição de estado editorial) ficou em `refinamento`. US-8 publica conteúdo de outro autor preservando a autoria, e US-7 o submete para revisão, mas nada no pacote especifica o registro de quem decidiu a transição. Sem ele, a cadeia editorial existe e não é auditável.

## Rastreabilidade

| item | vem de | evidência no legado |
|---|---|---|
| US-1 | REQ-019 · UC-03 · `domain.md §2.1` (P1) · `domain.md §2.1` (P3) · `domain.md §2.1` (P7) | `wp-admin/post.php:236`, `wp-includes/post.php:4598`, `wp-includes/post.php:5404` (+2) |
| US-2 | REQ-020 · UC-03 · UC-06 · `domain.md §2.1` (P1) | `wp-includes/post.php:4703`, `wp-admin/includes/schema.php:159` |
| US-3 | REQ-021 · UC-03 · UC-06 · UC-07 · `domain.md §2.1` (P4) · `domain.md §2.1` (P5) | `wp-includes/post.php:4731`, `wp-includes/post.php:4745`, `wp-includes/post.php:5561` |
| US-4 | REQ-022 · UC-03 · UC-01 | `wp-includes/post.php:4598`, `wp-includes/capabilities.php:149` |
| US-5 | REQ-023 · UC-03 · `domain.md §2.1` (P7) | `wp-includes/post.php:5413` |
| US-6 | REQ-024 · UC-04 · `domain.md §2.1` (P6) | `wp-includes/post.php:4800`, `wp-includes/post.php:5482`, `wp-includes/post.php:8188` (+1) |
| US-7 | REQ-025 · UC-06 · `domain.md §2.1` (P4) · `domain.md §2.1` (P5) | `wp-includes/post.php:4731`, `wp-includes/post.php:5561`, `wp-includes/capabilities.php:369` |
| US-8 | REQ-026 · UC-07 | `wp-admin/post.php:236`, `wp-includes/capabilities.php:149`, `wp-includes/capabilities.php:113` (+1) |
| US-9 | REQ-027 · UC-07 | `wp-admin/post.php:236` |
| US-10 | REQ-029 · UC-03 · UC-07 | `wp-includes/capabilities.php:108`, `wp-includes/default-constants.php:392` |
| US-11 | REQ-031 · UC-03 | `wp-includes/post.php:8373`, `wp-includes/default-constants.php:381` |
