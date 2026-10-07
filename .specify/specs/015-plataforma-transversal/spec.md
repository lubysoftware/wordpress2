# Plataforma transversal

**Origem:** épico EP-15 do backlog do sistema legado (`extensibilidade, tradução, sanitização, observabilidade e limite de taxa — o que atravessa tudo`)  
**Cards:** REQ-159, REQ-163, REQ-164, REQ-166, REQ-167, REQ-168, REQ-170, REQ-178
**Dos quais, cards de descarte (prioridade `wont`):** REQ-170, REQ-178

## Por que esta feature existe

Extensibilidade, tradução, sanitização, observabilidade e limite de taxa: o que atravessa
tudo. O épico EP-15 cobre o registro estruturado do evento de operação, a suíte de teste
que prova a paridade de comportamento, a camada de dados que não aceita consulta montada
por concatenação, a tradução a partir de catálogo declarado, o relato do erro de análise
de marcação e a recusa, na instalação, da entrada que o próprio instalador sabe que não
deveria aceitar.

Duas medições explicam por que esta feature existe. A aresta mais pesada do grafo medido é
a tradução, com 13.335 pontos de entrada vindos de 68 dos 71 módulos, o que num porte é o
sinal de que não existe separação entre domínio e apresentação; e o card que faria essa
separação (REQ-161) ficou `bloqueado`. A segunda é que a árvore tem zero arquivo de teste
em 3.381, logo não existe rede de segurança executável: a história de REQ-163 é a que
constrói o oráculo de paridade, e ela só fecha com a resposta 16, que manda levantar uma
instalação executável do legado na mesma versão como referência de comparação.

## Histórias de usuário

### US-1 — Registrar o evento de operação em canal estruturado e consultável

Como responsável pela operação, quero poder responder com que frequência o site falha e em quê, porque hoje nenhuma pergunta de operação tem resposta.

**Critérios de aceite**

- [ ] CA-1.1 Todo erro tratado e toda falha de integração produzem registro com instante, origem, severidade e contexto
- [ ] CA-1.2 O registro é estruturado e consultável por período, por severidade e por origem
- [ ] CA-1.3 O registro tem prazo de retenção declarado e não guarda credencial nem dado pessoal além do declarado
- [ ] CA-1.4 É possível responder, pelo registro: com que frequência o site falha ao se atualizar, quais extensões já o derrubaram, e qual o volume de spam
- [ ] CA-1.5 O registro funciona sem depender de o site estar em modo de depuração
- [ ] CA-1.6 Nenhum caminho de erro do sistema é silencioso por omissão: uma verificação automatizada falha quando encontra tratamento de erro sem registro

**Regras de negócio que valem aqui**

- Zero arquivos de log nesta árvore. O único histórico persistente de falha é a opção de falha de atualização automática
- Erros recorrentes não podem ser identificados: não há histórico
- A tela de saúde do site calcula na hora e não armazena

### US-2 — Garantir a paridade de comportamento por suíte de teste executável

Como responsável pelo porte, quero poder provar que o sistema novo decide igual ao antigo nos casos que importam, para que a migração não dependa de inspeção manual.

**Critérios de aceite**

- [ ] CA-2.1 Cada regra de negócio catalogada tem ao menos um teste automatizado que a exercita, e a correspondência regra → teste é consultável
- [ ] CA-2.2 A cascata de decisão de moderação tem teste para cada etapa e para a ordem entre elas
- [ ] CA-2.3 A resolução de permissão sobre objeto tem teste para cada combinação de autoria e estado
- [ ] CA-2.4 A suíte roda em ambiente limpo, sem depender de dado de produção
- [ ] CA-2.5 A suíte é condição para integrar alteração: nenhuma mudança entra com teste vermelho

**Regras de negócio que valem aqui**

- Zero arquivos de teste em 3.381: não existe rede de segurança executável
- Nenhum dos 47 casos de uso foi observado em execução: não há banco, não há conteúdo, não há log e não há configuração nesta árvore

### US-3 — Acessar os dados por uma camada que não aceite consulta montada por concatenação

Como responsável pela segurança, quero que nenhuma consulta ao banco seja montada juntando texto com dado de entrada, para que injeção deixe de ser possível por construção.

**Critérios de aceite**

- [ ] CA-3.1 Toda consulta é expressa por parâmetro, nunca por texto concatenado com dado
- [ ] CA-3.2 A camada de dados recusa receber fragmento de consulta vindo de dado de entrada
- [ ] CA-3.3 Uma verificação automatizada falha quando encontra consulta montada por concatenação
- [ ] CA-3.4 A camada de dados é a única porta de acesso ao banco: nenhum módulo de domínio abre conexão própria
- [ ] CA-3.5 O perfil de consultas por requisição é mensurável, de modo que uma regressão de desempenho seja detectável

**Regras de negócio que valem aqui**

- A camada de dados é o 14º módulo mais dependido do sistema medido, e não existia no recorte declarado pela análise anterior
- Peso de aresta é piso, não teto: esta árvore quase não declara tipo, logo chamada dinâmica não resolve na medição

### US-4 — Traduzir a interface a partir de catálogo declarado e atualizável

Como pessoa que usa o site noutro idioma, quero ver a interface na minha língua, para trabalhar sem traduzir de cabeça.

**Critérios de aceite**

- [ ] CA-4.1 O idioma da interface é configurável por instalação e por conta
- [ ] CA-4.2 Os textos vêm de catálogo externo ao código, atualizável sem alterar o sistema
- [ ] CA-4.3 Texto sem tradução no catálogo cai no idioma de origem, sem erro e sem espaço vazio
- [ ] CA-4.4 A instalação de catálogo novo exige a capacidade declarada, e essa capacidade consta da matriz
- [ ] CA-4.5 Texto com número e com ordem de palavras variável é tratado por forma declarada, não por concatenação

**Regras de negócio que valem aqui**

- A capacidade de instalar tradução não está em papel algum no legado: entra por filtro

**Depende de:** REQ-016, REQ-161, fora desta feature

### US-5 — Reportar o erro de análise de marcação em lugar de o reconhecer em silêncio

Como autor, quero saber quando o corpo do conteúdo tem marcação que o sistema não conseguiu interpretar, para corrigir antes de o visitante ver a página torta.

**Critérios de aceite**

- [ ] CA-5.1 O analisador de marcação devolve, junto do resultado, a lista de condições de erro que encontrou, com posição
- [ ] CA-5.2 A tela de edição mostra essas condições ao autor
- [ ] CA-5.3 O conteúdo com erro de marcação continua sendo servido, sem ser reescrito
- [ ] CA-5.4 Uma condição de erro é registrada, com conteúdo e posição, para que o volume seja mensurável

**Regras de negócio que valem aqui**

- O analisador de marcação carrega 50 marcadores, a maioria declarando que reconhece a condição de erro e não tem como reportá-la. Quem depende de validação de marcação não a tem

**Depende de:** US-1 (REQ-159)

### US-6 — Impedir na instalação a entrada que o próprio instalador sabe que não deveria aceitar

Como responsável por instalar o sistema, quero que o instalador recuse configuração inválida na hora, para não descobrir o problema com o site já no ar.

**Critérios de aceite**

- [ ] CA-6.1 Cada campo do instalador é validado antes de gravar, e o erro nomeia o campo e o motivo
- [ ] CA-6.2 Endereço do site, endereço de e-mail e credencial de administração são validados contra as mesmas regras que o resto do sistema usa
- [ ] CA-6.3 O endereço da rede, de que depende a identificação de sessão, tem forma de edição declarada
- [ ] CA-6.4 Nenhum campo do instalador é aceito e corrigido em silêncio

**Regras de negócio que valem aqui**

- Quatro marcadores do instalador declaram, por escrito, que ele aceita entrada que deveria impedir
- `@todo Network admins should have a method of editing the network siteurl` — o endereço da rede, de que depende a identificação de sessão, não tem interface

**Depende de:** REQ-010, fora desta feature

## Fora de escopo

Os cards abaixo entraram na seleção na coluna `pronto`, mas têm prioridade `wont`: eles declaram o que o sistema novo **não** terá. Não viraram história porque um descarte não tem comportamento a construir; estão aqui com o motivo registrado no card e com a forma de conferir que o descarte foi respeitado.

### REQ-170 — Descartar a substituição de componente do núcleo por arquivo solto na pasta de conteúdo

O sistema novo não terá o mecanismo em que um arquivo colocado numa pasta substitui um componente inteiro do núcleo, sem registro e sem contrato.

**Motivo registrado no card:** É substituição de componente por efeito colateral de existência de arquivo: nenhum contrato, nenhum registro, nenhuma versão, e nenhuma forma de saber de dentro do sistema que o componente foi trocado. Dois dos quatro casos têm consequência direta sobre requisito deste backlog — o substituto do tratamento de erro fatal desliga todo o REQ-117, e os substitutos de resposta de bloqueio desligam parte do REQ-133 — e nada no sistema avisa. Reescrever o mecanismo é reescrever a possibilidade de um requisito deste backlog estar desligado sem ninguém saber. O quarto critério existe porque uma instalação real pode ter esses arquivos.

**Como conferir que ficou fora**

- [ ] Nenhum componente do sistema novo é substituível pela simples presença de um arquivo num caminho
- [ ] Cache de objeto, cache de página, tratamento de erro fatal e resposta de site bloqueado passam a ser configurados por declaração explícita, com contrato nomeado
- [ ] A configuração em uso é inspecionável: o diagnóstico do site diz qual implementação está ativa para cada um desses pontos
- [ ] A migração identifica os arquivos de substituição presentes numa instalação real e diz a que declaração cada um corresponde

> Conflito registrado, não resolvido. A resposta 3 é literal ao dizer que o ponto de extensão é o produto e não acidente de implementação, e a decisão fundadora D2 registra que a pasta de conteúdo é a única tratada como substituível. O card está certo ao dizer que a substituição por presença de arquivo não tem contrato, registro nem versão, e que dois dos quatro casos desligam requisitos deste próprio backlog sem avisar. Remover o mecanismo, porém, remove extensibilidade publicada, o que cai em P8 da constituição.

### REQ-178 — Descartar a configuração declarativa de tela que ninguém lê

O sistema novo não portará o contêiner de configuração de tela de dados que o legado grava e cujo leitor não existe nesta árvore.

**Motivo registrado no card:** É estrutura escrita sem leitor: `domain.md` §1.8 registra que o contêiner é só de escrita e que o consumidor é JavaScript que não está nesta árvore. Portar significa escrever o produtor de um dado que nada consome, e depois mantê-lo versionado. Se a configuração declarativa de tela fizer sentido no sistema novo, ela vira requisito com consumidor especificado — e aí o terceiro critério deste card é o que a autoriza.

**Como conferir que ficou fora**

- [ ] Nenhuma estrutura do sistema novo é escrita sem ter um leitor identificado
- [ ] Uma verificação automatizada lista as estruturas produzidas e não consumidas, e falha se houver alguma
- [ ] A configuração de tela de dados, se vier a ser necessária, entra como requisito próprio, com o seu consumidor especificado

> Conflito registrado, não resolvido. A premissa do card é que o contêiner é escrito e nunca lido, porque o consumidor é código de cliente ausente desta árvore. A resposta 15 muda a premissa: o lado cliente deve ser obtido do repositório de origem, onde o leitor existe. O descarte pode estar certo e a justificativa dele, não.

## Perguntas em aberto

- [ ] REQ-159 exige, no último critério, que nenhum caminho de erro seja silencioso por omissão, com verificação automatizada que falha ao encontrar tratamento de erro sem registro. O legado tem silêncios estruturais que respostas humanas mandaram preservar: o caso "sem assinatura" silenciado fora do modo de depuração (resposta 11) e os cinco pontos do processamento de imagem sem registro (regra M4). P7 da constituição resolve metade do conflito, porque permite acrescentar registro sem mudar o fluxo; a outra metade, que é recusar o silêncio, precisa de decisão.
- [ ] O nome deste épico inclui limite de taxa, e nenhuma história o especifica: REQ-160 ficou `bloqueado`, e a resposta 19 o põe fora do núcleo, como decisão de implantação, para não inventar número que o produto nunca teve. A consequência precisa estar escrita para quem recebe o pacote: o produto portado nasce sem limite de taxa em superfície alguma, exatamente como o legado, e os dois únicos freios continuam sendo travas de tempo de 60 segundos e de 5 minutos.
- [ ] A resposta 21 autorizou gerar spec para 15 módulos que não tinham nenhuma, começando pelos cinco mais dependidos: camada de dados, arranque, formatação e escape, núcleo utilitário e telas do painel. Neste pacote, só a camada de dados tem história própria (REQ-164); os outros quatro aparecem apenas como módulos tocados por cards cujo assunto é outro. É a maior lacuna estrutural da entrega, e ela atravessa as 15 features.
- [ ] REQ-166 traduz a interface a partir de catálogo declarado, e depende de REQ-161, que ficou `bloqueado`. Sem a separação entre domínio e apresentação, a tradução continua entrando em 68 dos 71 módulos, o que é a forma medida do problema que REQ-161 descreve.
- [ ] US-4 (REQ-166) depende de `REQ-161` (Separar o domínio da apresentação, mantendo a tradução fora das regras de negócio), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] US-6 (REQ-168) depende de `REQ-010` (Garantir no armazenamento que login e e-mail de conta são únicos), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] REQ-170 depende de `REQ-162` (Declarar os pontos de extensão com contrato explícito), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?
- [ ] REQ-170 depende de `REQ-165` (Decidir se o cache de objeto nasce persistente, e dar significado real à expiração), que ficou na coluna `bloqueado` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?

## Rastreabilidade

| item | vem de | evidência no legado |
|---|---|---|
| US-1 | REQ-159 · UC-37 · UC-39 · UC-35 · UC-13 | `wp-includes/load.php:569`, `wp-admin/includes/class-wp-automatic-updater.php:826`, `wp-admin/includes/image.php:356` |
| US-2 | REQ-163 · UC-14 · UC-03 · UC-24 · UC-44 | `wp-includes/comment.php:46`, `wp-includes/capabilities.php:149`, `wp-includes/post.php:4703` |
| US-3 | REQ-164 · UC-01 · UC-11 · UC-24 | `wp-includes/class-wpdb.php:1458`, `wp-includes/class-wp-query.php:811`, `wp-includes/class-wpdb.php:2214` |
| US-4 | REQ-166 · UC-24 · UC-33 | `wp-includes/l10n.php:194`, `wp-includes/capabilities.php:1356`, `wp-includes/class-wp-locale.php:17` (+1) |
| US-5 | REQ-167 · UC-03 · UC-07 | `wp-includes/html-api/class-wp-html-processor.php:2018`, `wp-includes/kses.php:2609`, `wp-includes/html-api/class-wp-html-processor.php:147` |
| US-6 | REQ-168 · UC-24 · UC-43 | `wp-admin/install.php:420`, `wp-admin/install.php:435`, `wp-admin/includes/schema.php:1334` |
| fora de escopo: REQ-170 | REQ-170 · UC-36 · UC-43 · UC-01 | `wp-settings.php:98`, `wp-includes/class-wp-recovery-mode.php:92`, `wp-includes/ms-load.php:95` (+2) |
| fora de escopo: REQ-178 | REQ-178 · UC-24 | `wp-includes/class-wp-view-config-data.php:58` |
