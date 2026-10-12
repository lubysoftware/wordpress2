# `plataforma/registro-de-operacao/` — o canal do evento de operacao

Feature `015-plataforma-transversal`. Tarefas fechadas com nota de entrega neste
arquivo: **T002** (esqueleto: a porta do canal declarada e nada mais). Este
arquivo e a leitura obrigatoria de quem pegar **T003** — US-1, *"registrar o
evento de operacao em canal estruturado e consultavel"* —, **T004** (os oito
testes do catalogo) e **T011**, que depende deste modulo por CA-5.4. Ele diz o
que ja esta decidido, o que esta decidido **em outro lugar**, e o que **ninguem**
decidiu.

A pasta **nao** se chama `registro/`: aquele nome e, em
`target_architecture.md`, o do *"registro explicito que substitui as 38 funcoes
substituiveis... e os 4 *drop-ins***"* — reposicao de `EXT-SUBST`, assunto
diferente. O nome daqui e o que `plan.md` e `tasks.md` usam.

---

> ## 🔴 PARE AQUI SE A SUA TAREFA E T003 OU T004
>
> **Dois dos seis criterios de US-1 colidem com decisao humana registrada, e
> nenhum dos dois conflitos foi resolvido por ninguem.** Eles estao detalhados em
> *O que ninguem decidiu*, itens 1 e 2. Em resumo:
>
> - **CA-1.3** pede *"prazo de retencao declarado"*, e `UT-159-3` manda afirmar
>   que o registro vencido e descartado. `ESC-RETENCAO` (BR-MIGRAR-113) diz o
>   oposto, e a tabela *Nao negociavel* da constituicao poe *"introduzir limite
>   de taxa, prazo de retencao ou qualquer numero que o legado nao tem"* entre o
>   que o agente **nao decide sozinho**.
> - **CA-1.6** pede que *"nenhum caminho de erro seja silencioso por omissao"*, e
>   tres silencios do legado foram preservados por resposta humana.
>
> A spec desta feature **registra o segundo** na secao *Perguntas em aberto*; o
> primeiro nao esta registrado em lugar nenhum do pacote, e passa a estar aqui.
> Os outros quatro criterios (CA-1.1, CA-1.2, CA-1.4, CA-1.5) nao dependem de
> nenhuma das duas respostas: T003 fecha esses e para nos dois.

---

## O que ja esta decidido, e onde

| decisao | onde foi tomada |
|---|---|
| este modulo e **acrescimo**, nao porte | P7 da constituicao: *"registro e diagnostico novos podem ser acrescentados"*. O `plan.md` registra que o registro de operacao **nao existe** no legado |
| `registrar` nao devolve nada e nao falha | P7, forma de conferir: *"o registro acrescentado e so escrita: nenhuma ramificacao do codigo testa o resultado de escrever log"*; e a tabela *Contratos* do `plan.md`: *"nenhum: falha de registro **nao** pode alterar o fluxo"* |
| os quatro campos do evento | CA-1.1, palavra por palavra: instante, origem, severidade, contexto |
| os tres filtros da consulta | CA-1.2, palavra por palavra: periodo, severidade, origem |
| severidade e origem sao conjuntos **abertos** | `BR-MIGRAR-075` (*"o conjunto documentado e piso, nao teto"*) e `ESC-FILTRAVEL` (BR-MIGRAR-108). E porque o legado nao tem escala de log para copiar |
| o instante chega como dado, sem porta de relogio | AD-08 declara **cinco** bordas, e relogio nao e uma delas |
| campo de contexto e escalar | slot `observabilidade` do `plan.md`: *"redacao embutida e a diferenca entre cumprir o criterio e abrir o vazamento"* |

## O que esta decidido em outro lugar

- **Quem registra e cada contexto, nao este modulo.** As tres perguntas de
  CA-1.4 se respondem com dado de BC-11 (atualizacao, modo de recuperacao) e de
  BC-03 (spam), e a regra de dependencia 3 proibe a ligacao horizontal. Este
  modulo oferece o canal; a chamada nasce na tarefa de cada contexto.
- **Os tres dados de CA-1.4 existem hoje como estado corrente, nao como
  historico** — e e por isso que a pergunta nao tem resposta no legado:
  - falha de atualizacao: a opcao `auto_core_update_failed`, gravada em
    `wp-admin/includes/class-wp-automatic-updater.php:838` (pacote montado em
    `:826`) e apagada so pelo caminho manual
    (`wp-admin/includes/update-core.php:1922`);
  - extensao que derrubou o site: a lista de extensoes pausadas
    (`wp-includes/class-wp-recovery-mode.php:441`), que sair do modo de
    recuperacao **apaga de uma vez** (`:214`, e `A12`/BR-MIGRAR-056);
  - volume de spam: `comment_approved = 'spam'`
    (`wp-admin/includes/schema.php:112`) — o **estado** e do nucleo, o
    classificador que o atribui e extensao (`BR-DESCARTAR-001`).
- **A tela de saude do site nao e este modulo, e nao passa a ser.** UC-37 fecha
  com *"nada foi armazenado: o diagnostico e calculado a cada visita"*, e
  `domain.md` §5 diz o mesmo. Fazer a tela ler o registro mudaria o que ela
  responde, o que e comportamento observavel.

## O que ninguem decidiu

1. **🔴 CA-1.3 pede um prazo de retencao, e o pacote proibe inventar um.**
   O criterio: *"o registro tem prazo de retencao declarado e nao guarda
   credencial nem dado pessoal alem do declarado"*. `UT-159-3` o traduz em teste:
   *"descarta o registro vencido"*. Do outro lado, `ESC-RETENCAO`
   (BR-MIGRAR-113), confianca 🟢, com a resposta 20 atras: *"o nucleo nao declara
   prazo de retencao nenhum, e porta-lo identico e nao inventar um... a obrigacao
   de LGPD/GDPR e assumida pela **implantacao**, com a rotina de descarte
   **configuravel, nao embutida**"*, e a nota de compatibilidade e explicita:
   *"declarar um default embutido deixa de ser identico"*. O P6 da constituicao
   repete, e a tabela *Nao negociavel* poe a decisao fora do alcance do agente.
   **As duas metades do criterio nao sao iguais:** a segunda (nao guardar
   credencial nem dado pessoal alem do declarado) nao depende de numero nenhum e
   T003 pode fecha-la. A primeira depende de um numero que ninguem autorizou.
   **O que T002 fez:** nao declarou prazo, nao declarou campo de validade e nao
   declarou expurgo — ver `./evento-de-operacao.ts`. **O que T003 faz:** fecha a
   segunda metade, para na primeira, e escreve aqui.
2. **🔴 CA-1.6 recusa o silencio que respostas humanas mandaram preservar.** O
   criterio pede que *"nenhum caminho de erro do sistema seja silencioso por
   omissao: uma verificacao automatizada falha quando encontra tratamento de erro
   sem registro"*. Os silencios estruturais do legado, com a palavra do humano
   atras de cada um:
   - o pacote sem assinatura verificada, com o caso *"sem assinatura"* silenciado
     fora do modo de depuracao (resposta 11, `A8`/BR-MIGRAR-052,
     [ADR-0010](../../../.specify/adrs/0010-tolerar-pacote-sem-assinatura-verificada.md));
   - os cinco pontos do processamento de imagem sem registro (`M4`,
     BR-MIGRAR-060) — dois deles sao os `// TODO: Log errors.` de
     `wp-admin/includes/image.php:356` e `:359`;
   - o disparo da fila agendada, nao bloqueante por projeto (resposta 10,
     `A9`/BR-MIGRAR-053, AD-07).
   P7 resolve **metade**: acrescentar registro e permitido, desde que nenhuma
   decisao passe a depender dele — logo o registro pode ser acrescentado nos tres
   pontos sem mudar o fluxo. A outra metade e a verificacao automatizada que
   **falha** ao encontrar tratamento de erro sem registro: ela reprovaria os tres
   pontos preservados de proposito, ou teria de nascer com uma lista de excecoes
   que ninguem autorizou. `spec.md` e `index.md` registram este conflito; T003
   nao o resolve.
3. **Qual das cinco bordas de AD-08 e o canal.** Arquivo (linha JSON, que e o que
   o slot `observabilidade` recomenda) ou banco pela camada de dados (que e o que
   a `Sequencia` do `plan.md` sugere ao mandar construir a camada de dados
   antes). A forma da porta e a mesma nas duas; o adaptador nao. E se a escolha
   for tabela nova, AD-11 congela o esquema nesta fase — o que **por si** e
   motivo para perguntar antes de abrir tabela. Ver
   `./portas/porta-de-canal.ts`.
4. **Qual conjunto de severidades.** Ver `./evento-de-operacao.ts`: o unico
   vocabulario da arvore e o da tela de saude (`'good'`, `'recommended'`,
   `'critical'`, em `wp-admin/includes/class-wp-site-health.php:172`), e aquilo
   nao e um registro. T003 escolhe contra o oraculo, e o tipo ficou aberto para
   que a escolha nao precise mudar este arquivo.

## Onde esta feature nao chegou

T002 entrega **quatro** modulos, que e o que a tarefa nomeia: este, mais
`../dados/`, `../traducao/` e `../sanitizacao/`. US-2 (suite de paridade,
**T005**) e US-6 (validacao de instalacao, **T013**) nao ganharam pasta aqui.
