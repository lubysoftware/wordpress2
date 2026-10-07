# Rede multisite

**Origem:** épico EP-12 do backlog do sistema legado (`muitos sites, uma identidade, um ciclo de vida supervisionado`)  
**Cards:** REQ-136
**Dos quais, cards de descarte (prioridade `wont`):** REQ-136

## Por que esta feature existe

Muitos sites, uma identidade, um ciclo de vida supervisionado. O épico EP-12 tem 13 cards
no backlog, e **um** deles entrou nesta seleção: um card de descarte. Os outros 12 ficaram
em `bloqueado` e em `backlog`, todos travados pelo mesmo card (REQ-129), que dependia de
saber se a instalação analisada roda em modo rede.

Essa pergunta foi respondida depois de o backlog ter sido escrito. A resposta 4 de
`questions.md` diz que a instalação é simples, mas que o multisite **não** sai do escopo:
o núcleo que está sendo clonado traz os arquivos de rede e as seis tabelas, e um porte sem
elas não é idêntico. A decisão humana é manter a rede como capacidade do produto, com o
modo de subdiretório como padrão e o de subdomínio suportado. Logo esta feature está
vazia por um motivo que não é escopo: ela está vazia porque a seleção é anterior à
resposta que a liberaria. Enquanto os 12 cards não voltarem, este pacote não especifica
nada do que a resposta 4 mandou manter.

## Histórias de usuário

Nenhuma. O único card de EP-12 nesta seleção tem prioridade `wont` e está na seção Fora de escopo. Os 12 cards que especificariam a rede ficaram nas colunas `bloqueado` (REQ-129, REQ-135) e `backlog` (REQ-130 a REQ-134), e estão listados no [README do pacote](../../README.md).

## Fora de escopo

Os cards abaixo entraram na seleção na coluna `pronto`, mas têm prioridade `wont`: eles declaram o que o sistema novo **não** terá. Não viraram história porque um descarte não tem comportamento a construir; estão aqui com o motivo registrado no card e com a forma de conferir que o descarte foi respeitado.

### REQ-136 — Descartar o sinalizador de conteúdo adulto do site da rede

O sistema novo não terá o eixo de supervisão que marca um site da rede como de conteúdo adulto.

**Motivo registrado no card:** É sinalização que o próprio legado grava e não consulta: UC-43 registra que o campo não tem efeito algum no núcleo. Reescrevê-lo é escrever um campo, uma tela, dois ganchos e uma migração para um dado que nenhuma decisão lê. Se a rede precisar classificar sites por conteúdo, isso é um requisito a especificar, não um campo a portar — e o terceiro critério existe porque uma rede real pode ter valores gravados ali por extensão.

**Como conferir que ficou fora**

- [ ] Nenhuma tela do sistema novo oferece esse sinalizador
- [ ] Nenhuma decisão do sistema consulta esse campo
- [ ] A migração de dados declara o que fazer com os valores existentes, se houver

> Conflito registrado, não resolvido. A resposta 4 decidiu manter a rede no escopo como capacidade do produto, com as seis tabelas, porque "um porte sem elas não é idêntico". A regra N4 do domínio registra que cada um dos eixos de supervisão do site, inclusive este, tem gancho de entrada e de saída e é comparado campo a campo na atualização, logo o campo é observável por extensão mesmo não sendo consultado pelo núcleo. O card está certo ao dizer que nenhuma decisão do núcleo o lê; a resposta 4 está certa ao dizer que remover campo muda o que se clona. Ninguém reconciliou as duas.

## Perguntas em aberto

- [ ] A resposta 4 resolveu REQ-129, que é o card que trava o épico inteiro. Os 12 cards restantes de EP-12 devem voltar à seleção para que esta feature exista de verdade? A decisão é de quem monta a seleção, não deste pacote.
- [ ] A identidade é global à rede, e o vínculo entre conta e site mora dentro do nome da chave do metadado de autorização. A resposta 4 manda preservar esse comportamento ainda que o armazenamento seja normalizado por baixo. Nenhuma história deste pacote carrega essa regra, e ela é a decisão mais consequente de um porte de rede.
- [ ] O estado "criado e ainda não ativado" de um site da rede usa um terceiro valor numa coluna que o dicionário de dados descreve como de dois valores (regra N2 do domínio). Quem portar lendo o dicionário produz um estado a menos, e a falha aparece só quando um site novo da rede é criado.
- [ ] REQ-136 depende de `REQ-133` (Supervisionar o site da rede por eixos independentes, com gancho de entrada e de saída), que ficou na coluna `backlog` e não entrou neste pacote. Construir sem essa dependência, ou esperar que ela entre?

## Rastreabilidade

| item | vem de | evidência no legado |
|---|---|---|
| fora de escopo: REQ-136 | REQ-136 · UC-43 | `wp-includes/ms-site.php:541`, `wp-includes/ms-site.php:1222`, `wp-admin/network/site-info.php:39` |
