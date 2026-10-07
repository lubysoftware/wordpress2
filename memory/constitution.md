# Constituição do projeto

> Pacote Spec Kit gerado em 2026-10-07 a partir da engenharia reversa de `wordpress`
> (WordPress Core 7.1.2, distribuição empacotada, 3.378 arquivos, 634.999 linhas de PHP).
> Fontes desta constituição: [`soul.md`](../../soul.md) seção 3 (decisões fundadoras D1 a D7),
> [`domain.md`](../../domain.md) seção 2 (75 regras de negócio),
> [`permissions.md`](../../permissions.md) seções 1, 8 e 9, os 12
> [ADRs](../../adrs/README.md) e as 23 respostas humanas de
> [`questions.md`](../../questions.md).

Este documento é relido a cada tarefa. Ele não lista boas práticas: lista o que
nenhuma implementação deste projeto pode violar, com o motivo que veio do sistema
analisado e a forma de conferir que uma mudança não o violou.

O alvo foi fixado por decisão humana registrada nas respostas 1 a 5 e 15 a 18 de
`questions.md`: **um porte do núcleo para outra linguagem, com comportamento
observável idêntico**, partindo de instalação nova, sem dado a migrar. Não é uma
modernização, não é um redesenho e não é uma oportunidade de corrigir o que o
legado faz de estranho. Os oito princípios abaixo existem porque cada um deles já
foi violado por acidente em alguma tentativa de porte, e o custo de cada violação
está escrito junto.

---

## P1. O comportamento observável do legado é a especificação

**Princípio:** reproduza o comportamento observável do sistema analisado, inclusive
quando ele parecer defeito. Divergir exige uma decisão humana registrada, citada no
código que divergiu.

**Por que existe:** nove das 23 respostas humanas foram exatamente sobre isto, e em
todas elas a escolha foi preservar o legado contra a intuição de quem lê o backlog.
A mensagem de erro do login continua distinguindo conta inexistente de senha errada,
e isso permite enumerar contas (resposta 6). Trocar a senha não revoga sessão
nenhuma: o cookie antigo só deixa de validar por causa de um fragmento de quatro
caracteres do hash da senha dentro da chave do HMAC, e o registro do token sobrevive
e acumula (resposta 7). O atestado de senha de conteúdo é um cookie de dez dias sem
verificação de idade no servidor e sem limite de tentativa (resposta 8). Apagar mídia
é definitivo, sem lixeira e sem aviso (resposta 9). Pacote sem assinatura verificada
é instalado (resposta 11). A chamada externa é repetida em canal sem cifra quando o
TLS falha, em sete endpoints, inclusive o de checksums (resposta 12).

Existem exatamente três divergências autorizadas, todas com a palavra do humano:
o tempo limite do adaptador de IA deixa de herdar o default curto de 5 s (resposta 18),
a reimplementação do serviço de reputação externo, se um dia acontecer, envia só o que
a classificação exige em vez de todo campo de formulário e todo cabeçalho (resposta 13),
e um ambiente executável do legado na mesma versão é levantado como oráculo de
comparação (resposta 16).

**Como conferir:** toda divergência de comportamento observável tem, no código, uma
referência à resposta de `questions.md` ou ao ADR que a autorizou. Mudança que altera
o que um cliente externo vê sem essa referência é recusada na revisão. Quando o
ambiente de referência da resposta 16 existir, a conferência passa a ser a comparação
caso a caso contra ele.

---

## P2. Todo ponto de extensão é produto, não acidente de implementação

**Princípio:** preserve cada ponto de extensão com o nome, os argumentos, a ordem de
disparo e a capacidade de alterar o resultado que ele tem hoje. Ponto de extensão é
contrato público.

**Por que existe:** é a decisão fundadora D2 de `soul.md`, e é dela que vem a economia
de extensões em torno do produto. São 3.373 pontos de extensão: 999 chamadas de ação em
198 arquivos e 2.374 de filtro em 356. A resposta 3 é literal: "o ponto de extensão é o
produto, não acidente de implementação". Toda regra de negócio documentada nesta análise
passa por um desses pontos, o que significa que cada regra é um default filtrável e não
uma garantia. Remover ou renomear um deles quebra código de terceiro que o núcleo não
sabe que existe.

**Como conferir:** o inventário de pontos de extensão é artefato versionado, com nome,
argumentos e ordem. Existe teste que, para cada ponto documentado, verifica que ele
dispara, com os argumentos declarados, na posição declarada do fluxo, e que um
interceptador consegue alterar o resultado onde o legado permite. Sumir com um ponto
de extensão é mudança de contrato público e cai em [Não negociável](#não-negociável).

---

## P3. A capacidade é a unidade de autorização; o papel é dado mutável

**Princípio:** nenhuma decisão de autorização compara nome de papel. Toda pergunta de
permissão é feita sobre capacidade, e a definição dos papéis é dado gravado que o
sistema sabe reescrever.

**Por que existe:** `permissions.md` abre com este fato, e o ADR-0001 o registra: a
definição de papel é um retrato tirado na instalação, e depois disso o dado gravado é a
verdade enquanto o código deixa de ser. Um usuário pode ter vários papéis, e pode ter
capacidade sem papel nenhum. A autorização sobre objeto não é verificada direto, é
traduzida numa lista de capacidades primitivas por 86 casos de mapeamento, e é
necessário ter **todas** as capacidades devolvidas, não qualquer uma. Duas capacidades
são sintéticas: uma é concedida a todo mundo e a outra é removida da lista antes da
comparação, para que ninguém possa tê-la. A matriz de fábrica tem 61 concessões, das
quais 50 são reais, e quatro capacidades que o código exige não estão em papel algum:
existem só por filtro. A resposta 3 manda incluí-las explicitamente, porque quem portar
lendo apenas a matriz de papéis produz um sistema em que ninguém retoma extensão pausada.

**Como conferir:** uma busca por nome de papel dentro de decisão de autorização devolve
zero ocorrências. Existe teste para: duas contas com nomes de papel diferentes e as
mesmas capacidades respondem igual; renomear papel sem mudar capacidade não altera
resultado; a capacidade sintética negada não pode ser concedida por nenhum caminho;
lista de mapeamento vazia significa permitido; e as quatro capacidades concedidas por
filtro chegam a quem o legado faz chegar.

---

## P4. A autorização tem três camadas paralelas, e cinco atestados fora delas

**Princípio:** declare permissão explícita em toda operação exposta, e preserve o
default de cada camada como ele é hoje, inclusive quando o default é permissivo.

**Por que existe:** `permissions.md` seção 8 mostra que capacidade não é a única porta.
A camada de rotas falha **aberta**: rota sem declaração de permissão funciona e só emite
aviso de uso indevido, e o texto do aviso ensina a declarar permissão pública. A camada
de operações nomeadas para agente externo falha **fechada**, mas a autorização dela é
filtrável inclusive para conceder, com elevação temporária de permissão citada como caso
de uso no próprio código, e a execução pode ser curto-circuitada antes de qualquer
validação. Além das três camadas, cinco atestados decidem acesso sem consultar
capacidade alguma: senha de conteúdo em texto claro sem prazo, nonce de 12 a 24 horas,
chave de redefinição de senha de 24 horas apagada no primeiro acesso, chave de
confirmação de solicitação de dados pessoais de 24 horas com hash, e chave de modo de
recuperação consumida antes de ser verificada. Uma matriz que ignore esses cinco
descreve um sistema mais fechado do que o real, e cinco casos de uso do catálogo não são
autorizados por capacidade nenhuma.

**Como conferir:** teste por camada que fixa o default (rota sem declaração funciona;
operação nomeada sem callback nega; concessão por filtro funciona onde o legado permite).
Teste por atestado que fixa prazo e força, com relógio controlado. Toda operação exposta
nova nasce com declaração explícita de permissão, e a revisão recusa o registro sem ela.

---

## P5. A cascata de apagamento é código, e é observável

**Princípio:** mantenha, no modelo novo, exatamente o que desaparece e o que fica órfão
quando um registro é apagado. Integridade declarada no armazenamento não pode mudar o
que é observável.

**Por que existe:** é a decisão fundadora D3, e a resposta 2 a fixa como contrato:
o armazenamento do legado tem 18 tabelas, 59 índices e **zero** chave estrangeira, logo
toda relação é convenção de coluna cobrada em código, caso a caso. Onde ninguém escreveu
esse código, órfãos acumulam em silêncio, e o sistema trata isso como estado normal.
A resposta é explícita: a ausência de chave estrangeira é comportamento do produto, não
defeito de dado, e qualquer chave que o modelo novo declare não pode mudar o que é
observável, nem na cascata de conteúdo e metadados, nem em conta e conteúdo, nem em
termo e relação.

**Como conferir:** para cada cascata catalogada no ERD, um teste apaga o registro pai e
afirma o conjunto exato do que sumiu e do que permaneceu, inclusive o que permaneceu
órfão. Declarar restrição no armazenamento que faça o teste mudar de resultado é
violação, mesmo quando a restrição é "mais correta".

---

## P6. Prazo e número do legado se reproduzem; número que o legado não tem não se inventa

**Princípio:** todo prazo, contagem e limite vem do legado, com o valor de fábrica e o
ponto de configuração que o altera em execução. Onde o legado não tem número, o sistema
novo também não tem.

**Por que existe:** as respostas 1, 8, 19 e 20 convergem nisto. O default do código É a
especificação, porque não existe instalação cujo comportamento possa divergir dele.
Os números que o produto tem são regra: 30 dias de lixeira, e desligar a lixeira torna
apagar irreversível; 7 dias de rascunho automático; 3 dias do arquivo de exportação;
24 horas da chave de redefinição; 10 dias do cookie de senha de conteúdo; 2 dias de
sessão e 14 com lembrança, com 12 horas de carência; 2 links no limite de moderação;
14 dias para o fechamento automático de comentário; 15 dias de retenção de spam em lotes
de 10.000; 2.560 px na redução de imagem na ingestão; 2.048 px no teto do conjunto de
derivadas; 60 segundos de trava da fila agendada e 5 minutos da caixa postal; 2 dias de
reserva de nome no cadastro em rede; uma hora de segunda chance na falha transitória de
atualização; uma semana de modo de recuperação com um aviso por dia. E os números que o
produto **não** tem são igualmente regra: nenhuma superfície de entrada tem limite de
taxa, e nenhum prazo de retenção é declarado para registro editorial interno, para
solicitação concluída nem para o registro de cadastro em rede. A resposta 19 põe limite
de taxa fora do núcleo, como decisão de implantação, para não inventar número que o
produto nunca teve.

**Como conferir:** cada número vive num ponto de configuração nomeado, com o valor de
fábrica do legado, e existe teste que afirma o valor e o efeito da borda (no último
instante aceita, um instante depois recusa). Introduzir limite, prazo ou contagem que o
legado não tem é violação e cai em [Não negociável](#não-negociável).

---

## P7. Falha silenciosa do legado é comportamento; observabilidade nova não muda o fluxo

**Princípio:** preserve o modo de falha, inclusive o silêncio. Registro e diagnóstico
novos podem ser acrescentados, mas nenhuma decisão do sistema pode passar a depender
deles.

**Por que existe:** a árvore tem zero arquivo de log, 49 chamadas de registro de erro em
12 arquivos, e o único histórico persistente de falha é a opção que marca atualização
automática falhada. Três silêncios são estruturais e foram confirmados por resposta
humana: a verificação de assinatura de pacote é rebaixada a aviso, com o caso "sem
assinatura" silenciado fora do modo de depuração (resposta 11); o disparo da fila
agendada é uma requisição não bloqueante ao próprio host, com tempo limite de 0,01 s,
sem bloqueio e sem verificação de certificado, logo a falha é invisível por projeto, e a
consequência de um site sem visita nunca executar a própria limpeza é comportamento do
produto (resposta 10); e cinco pontos do processamento de imagem têm o marcador de
registro ausente e nenhuma linha escrita. Acrescentar registro é permitido e desejável;
fazer o fluxo depender dele troca o produto.

**Como conferir:** o registro acrescentado é só escrita: nenhuma ramificação do código
testa o resultado de escrever log. Existe teste que afirma que a falha de geração de
derivada de imagem, a falha de disparo da fila e o pacote sem assinatura verificada
continuam produzindo o mesmo resultado observável de hoje.

---

## P8. Nada sai da superfície sem decisão humana

**Princípio:** não remova função, constante, tabela, rota, superfície nem comportamento
publicado. Retrocompatibilidade é restrição absoluta, não cortesia.

**Por que existe:** é a decisão fundadora D6. O instalador ainda cria a tabela de lista
de links herdada do produto anterior; quatro tabelas obsoletas seguem no vocabulário;
oito funções de atualização de papéis que nunca foram removidas continuam no código; um
arquivo inteiro é mantido como atalho para outro; duas funções de encerramento de sessão
estão definidas e sem nenhum chamador, e a resposta 7 manda portá-las assim, porque
"existir sem ser chamada é parte do que se clona". A resposta 14 é o caso mais direto:
três superfícies que o backlog marcou como descarte continuam no escopo, e o descarte
"vale como não mudar, nunca como não portar".

**Por que isto é o princípio mais frágil deste pacote:** os 15 cards de prioridade
`wont` desta seleção foram escritos antes das 23 respostas, e propõem exatamente
remoções. Em oito deles a resposta humana posterior contradiz o descarte, de forma
explícita em cinco. Nenhum desses conflitos foi resolvido por ninguém, e este pacote
**não** os resolve: cada um está registrado na seção "Fora de escopo" da spec da sua
feature e na pauta consolidada do [README](../README.md).

**Como conferir:** toda remoção tem uma linha no registro de descartes, apontando para a
resposta ou o ADR que a autorizou. Descarte sem essa linha é tratado como conflito
aberto, não como decisão, e a tarefa que dependeria dele não começa.

---

## Não negociável

O que o agente de codificação **não** decide sozinho. Em qualquer destes casos ele para,
registra a pergunta e espera decisão humana:

| Decisão | Por que exige humano |
|---|---|
| Mudar regra de negócio documentada em `domain.md` | são 75 regras lidas do código, e cada uma é comportamento que alguém conhece hoje |
| Renomear ou remover ponto de extensão, rota, opção, constante ou função publicada | é contrato público, e quebra código de terceiro que o núcleo não conhece (P2, P8) |
| Resolver um dos conflitos entre card `wont` e resposta humana | são duas decisões humanas em sentidos opostos; escolher uma é decidir no lugar de quem decide (P8) |
| Introduzir limite de taxa, prazo de retenção ou qualquer número que o legado não tem | a resposta 19 e a 20 põem isso fora do núcleo, como decisão de implantação (P6) |
| Exigir assinatura verificada de pacote | a resposta 11 manda manter a tolerância, e tornaria o sistema incompatível com o ecossistema que ele clona |
| Fechar o rebaixamento para canal sem cifra | a resposta 12 manda manter, e registra como dívida herdada reproduzida de propósito |
| Apagar dado, ou declarar restrição no armazenamento que mude a cascata observável | P5, e a resposta 2 |
| Escolher a tecnologia de qualquer slot do plano | o leque de candidatos de `refactor/tech-stack.json` é pesquisa, não escolha; quem define é quem vai construir |
| Portar o serviço de reputação externo sem minimização | a resposta 13 classifica o envio integral como defeito conhecido, não regra do produto |
| Mudar a ordem de carregamento do arranque | em D1 ela é contrato público: ponto de extensão registrado cedo ou tarde demais simplesmente não funciona |
