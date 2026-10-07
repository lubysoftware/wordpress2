---
schemaVersion: 1
generatedAt: 2026-10-06T18:30:00-03:00
reversa:
  version: "1.0.0"
kind: target_business_rules
producedBy: curator
hash: "sha256:b67e1d7cbcaa4cbee694bc853eb4d2ee4504f99a042396168dce52f0581dcde6"
---

# Target Business Rules

> Catálogo das regras de negócio do legado com decisão de migração: MIGRAR, DESCARTAR ou DECISÃO HUMANA.
> Cada item rastreia para a origem em `_reversa_sdd/` e respeita o [`paradigm_decision.md`](paradigm_decision.md).

> Gerado pelo **Curator** (Time de Migração) em 2026-10-06 · `doc_level` **detalhado** · idioma **Português**
> Sistema analisado: **wordpress 7.1.2**

| Escala de confiança | Significado |
|---|---|
| 🟢 CONFIRMADA | Evidência direta em artefato do `_reversa_sdd/`, com seção citada |
| 🟡 INFERIDA | Padrão observado nos artefatos, sem afirmação explícita |
| 🔴 LACUNA | Não dedutível pelas specs disponíveis |
| ⚠️ AMBÍGUA | As evidências apontam para mais de uma leitura |

**O que não é o sistema analisado:** `.claude/` e `.reversa/` são o ferramental deste processo e não
entraram em contagem alguma. Nenhuma regra foi inventada: cada item cita o artefato de origem, e as
**276 referências arquivo:linha** deste pacote foram conferidas uma a uma contra a árvore.

---

## O chão desta etapa, antes do catálogo

Três fatos mudam a leitura de tudo o que vem abaixo, e dois deles dizem respeito a artefatos que
**mudaram durante esta etapa ou envelheceram sem que ninguém reparasse**.

### 1. O pré-requisito do SKILL não está cumprido — e não foi contornado por invenção

`_reversa_sdd/migration/migration_brief.md` **não existe**. Objetivo da migração, métricas de sucesso,
prazo, orçamento, *stakeholders* e escopo formal **não foram lidos de lugar nenhum**, e não há
substituto para eles neste pacote. O caso de borda do SKILL manda parar; a instrução de execução desta
etapa manda registrar a dúvida no artefato apropriado e seguir. Foi o que se fez: a lacuna está em
[`BR-HUMANA-001`](#br-humana-001) e em [`ambiguity_log.md`](ambiguity_log.md), e o **critério de
curadoria** usado em lugar do brief é o que já está gravado por escrito:

| Fonte do critério | O que ela declara |
|---|---|
| [`pending_decisions.md`](pending_decisions.md) **Decisão 1** | **Opção 3 — híbrido**: conservador no comportamento observável, idiomático na estrutura interna. `derived_appetite` = **`balanced`** |
| [`pending_decisions.md`](pending_decisions.md) **Decisão 2** | critério de aceite de "idêntico" = **(d) combinação por área**, com cinco áreas declaradas |
| [`questions.md`](../questions.md) | **23 respostas humanas**, item por item, que decidem comportamento |
| [`paradigm_decision.md`](paradigm_decision.md) | o paradigma do legado, as 8 implicações e os **3 mandatos** endereçados a este agente |

### 2. As duas entradas desta etapa mudaram no disco **durante** a execução, e isso está declarado

Os dois artefatos de entrada foram lidos no início e **reconferidos no fim** desta etapa. Entre as
duas leituras eles mudaram, e três mudanças alteram o resultado:

| Quando | O que mudou | Efeito nesta curadoria |
|---|---|---|
| no início | [`pending_decisions.md`](pending_decisions.md) já tinha **Decisão 1 = Opção 3** e **Decisão 2 = (d)**, enquanto [`paradigm_decision.md`](paradigm_decision.md) ainda dizia 🔴 PENDENTE com `derived_appetite: conservative` | o Curator operou com **`balanced`** desde o começo, e não com a hipótese `conservative` |
| durante | [`paradigm_decision.md`](paradigm_decision.md) § *Decisão do usuário* e § *Apetite derivado* foram **atualizadas fora do gerador**: agora dizem 🟢 **Opção 3 — HÍBRIDO** e `balanced` **DEFINITIVO** | confirma a premissa já usada; o artefato de leitura obrigatória deixou de contradizer a resposta |
| durante | a **Lacuna 2 foi respondida** — o lado cliente dos 5 módulos do editor é **dependência externa adotada como está** | deixou de ser DECISÃO HUMANA e virou regra a migrar, em [`BR-MIGRAR-117`](#br-migrar-117) |

**Quatro vestígios da versão anterior sobreviveram em**
[`paradigm_decision.md`](paradigm_decision.md), e quem o ler em ordem vai tropeçar neles antes de
chegar à decisão. Ficam nomeados aqui porque aquele arquivo é o de **leitura obrigatória** e não é
deste agente para corrigir — a regra absoluta do SKILL proíbe:

1. O aviso do topo ainda diz *"⚠️ A decisão desta etapa está ABERTA… a § 'Decisão do usuário' deste
   arquivo é hipótese de trabalho, não decisão"*. Está superado pela própria § *Decisão do usuário*.
2. A subseção *"Hipótese de trabalho até a resposta chegar (não é a decisão)"* continua inteira,
   ainda apostando em *"Opção provável: 2 (conservador)"*. A aposta errou, e a seção ficou.
3. A tabela de § *Apetite derivado* declara `balanced` DEFINITIVO na primeira linha e, nas três
   seguintes, ainda explica de onde vem a **hipótese** e *"quando vira definitivo"*.
4. § *Notas* item 7 ainda registra o critério de aceite de "idêntico" como **lacuna 🔴 aberta** — e a
   § *Decisão do usuário*, no mesmo arquivo, agora a responde por extenso. (Item 9 também envelheceu:
   diz que a pasta tem dois arquivos; tem cinco.)

É o padrão de falha que o achado A-04 de [`gaps.md`](../gaps.md) descreve — *"a correção existe, está
certa, e vive num artefato que quem lê o outro não abre"* —, só que desta vez **dentro do mesmo
arquivo**. Por isso a premissa desta etapa está escrita aqui em vez de referida: **o paradigma alvo do
comportamento observável é o MESMO do legado** (barramento síncrono com retorno de valor, cascata com
curto-circuito, agendador por requisição, as 4 superfícies de escrita), e o paradigma muda **só** na
estrutura interna e nas 5 bordas que o porte troca de qualquer forma. É por isso que a regra 3 da
política de decisão (*descartar o que é artefato do paradigma legado*) incide em **3 itens** deste
catálogo, e todos os 3 são **mecanismo**, nenhum é regra de negócio.

### 3. CORREÇÃO — o critério de aceite de "idêntico" **está respondido**

[`paradigm_decision.md`](paradigm_decision.md) § *Notas* item 7 e
[`refactor/architectures.md`](../refactor/architectures.md) §8 item 6 ainda registram, como lacuna 🔴
aberta, que *"ninguém declarou o critério de aceite de 'idêntico'"*. A **Decisão 2** respondeu: é
combinação por área. Todas as notas de *Compatibilidade com paradigma alvo* deste catálogo herdam
dela o teste de borda, e o item [`BR-MIGRAR-116`](#br-migrar-116) a registra como regra.

| Área | Critério |
|---|---|
| Contrato de terceiro: REST, XML-RPC, feeds, sitemaps, oEmbed | **saída byte a byte** |
| Valor devolvido por hook (os 2.460 `apply_filters`) | **byte a byte no valor** |
| Esquema e efeito de escrita no banco | **efeito no banco** |
| HTML de tema e painel | **comportamento de caso de uso** (os 47 UCs) |
| Estado entre requisições concorrentes | **teste próprio, fora dos UCs** |

---

## Resumo

- Total de regras analisadas: **136**
- MIGRAR: **117**
- DESCARTAR: **10** (3 vinculadas a paradigma — detalhe em [`discard_log.md`](discard_log.md))
- DECISÃO HUMANA: **9** (todas PENDENTES, replicadas em [`ambiguity_log.md`](ambiguity_log.md))

| Área | MIGRAR |
|---|---:|
| Publicação de conteúdo | 8 |
| Moderação de interação pública | 12 |
| Identidade e cadastro | 9 |
| Retenção e descarte | 8 |
| Privacidade e dados pessoais | 7 |
| Atualização e manutenção do software | 12 |
| Mídia | 4 |
| Rede (multisite) | 7 |
| Integração externa e IA | 7 |
| Fronteira do banco | 12 |
| Autorização | 13 |
| Máquinas de estado | 2 |
| Contrato de extensão (mandato do paradigma) | 5 |
| Escopo declarado | 11 |
| **Total** | **117** |

### Índice das regras MIGRAR

| ID | Área | Regra na fonte | Regra |
|---|---|---|---|
| [BR-MIGRAR-001](#br-migrar-001) | Publicação de conteúdo | `P1` | Publicar é ato explícito |
| [BR-MIGRAR-002](#br-migrar-002) | Publicação de conteúdo | `P2` | Anexo nunca é "publicado" |
| [BR-MIGRAR-003](#br-migrar-003) | Publicação de conteúdo | `P3` | Post do tipo `post` sempre tem categoria |
| [BR-MIGRAR-004](#br-migrar-004) | Publicação de conteúdo | `P4` | Colaborador não escolhe a URL do que está em revisão |
| [BR-MIGRAR-005](#br-migrar-005) | Publicação de conteúdo | `P5` | Rascunho pode ter slug duplicado; publicado, não |
| [BR-MIGRAR-006](#br-migrar-006) | Publicação de conteúdo | `P6` | Agendamento é guardado por verificação dupla |
| [BR-MIGRAR-007](#br-migrar-007) | Publicação de conteúdo | `P7` | Republicar é operação nula |
| [BR-MIGRAR-008](#br-migrar-008) | Publicação de conteúdo | `P8` | HTML bruto é privilégio, e revogável por constante |
| [BR-MIGRAR-009](#br-migrar-009) | Moderação de interação pública | `C1` | Duplicata é recusa, não moderação |
| [BR-MIGRAR-010](#br-migrar-010) | Moderação de interação pública | `C2` | Vazão limitada por hora, exceto para quem modera |
| [BR-MIGRAR-011](#br-migrar-011) | Moderação de interação pública | `C3` | Autor do post e moderador têm aprovação automática |
| [BR-MIGRAR-012](#br-migrar-012) | Moderação de interação pública | `C4` | Moderação manual vence tudo |
| [BR-MIGRAR-013](#br-migrar-013) | Moderação de interação pública | `C5` | Link em excesso manda para a fila |
| [BR-MIGRAR-014](#br-migrar-014) | Moderação de interação pública | `C6` | Palavra de moderação é buscada em seis campos |
| [BR-MIGRAR-015](#br-migrar-015) | Moderação de interação pública | `C7` | Autor já aprovado antes passa direto — se o e-mail estiver limpo |
| [BR-MIGRAR-016](#br-migrar-016) | Moderação de interação pública | `C8` | Pingback do próprio site publicado é aprovado; trackback nunca |
| [BR-MIGRAR-017](#br-migrar-017) | Moderação de interação pública | `C9` | Lista de proibição vai para a lixeira, não para spam |
| [BR-MIGRAR-018](#br-migrar-018) | Moderação de interação pública | `C10` | Texto longo demais é erro de usuário, não truncamento |
| [BR-MIGRAR-019](#br-migrar-019) | Moderação de interação pública | `C11` | Comentário em post antigo fecha sozinho |
| [BR-MIGRAR-020](#br-migrar-020) | Moderação de interação pública | `C12` | Nota editorial não é comentário público |
| [BR-MIGRAR-021](#br-migrar-021) | Identidade e cadastro | `U1` | Registro aberto é desligado por padrão (`users_can_register = 0`) e o papel de quem se regist… |
| [BR-MIGRAR-022](#br-migrar-022) | Identidade e cadastro | `U2` | Login até 60 caracteres, apelido até 50 — e os dois são erro, não truncamento |
| [BR-MIGRAR-023](#br-migrar-023) | Identidade e cadastro | `U3` | A lista de logins proibidos é vazia por padrão e existe só como filtro (`illegal_user_logins`… |
| [BR-MIGRAR-024](#br-migrar-024) | Identidade e cadastro | `U4` | A chave de reset de senha vale 24 horas e é apagada no primeiro login bem-sucedido. |
| [BR-MIGRAR-025](#br-migrar-025) | Identidade e cadastro | `U5` | Sessão dura 2 dias; "lembrar de mim", 14 — com 12 horas de carência |
| [BR-MIGRAR-026](#br-migrar-026) | Identidade e cadastro | `U6` | Senha de aplicação é credencial de segunda classe por desenho: 24 caracteres gerados, guardad… |
| [BR-MIGRAR-027](#br-migrar-027) | Identidade e cadastro | `U7` | Em multisite, cadastro pendente reserva o nome por 2 dias |
| [BR-MIGRAR-028](#br-migrar-028) | Identidade e cadastro | `U8` | O domínio do e-mail pode ser restringido ou banido na rede (`limited_email_domains`, `banned_… |
| [BR-MIGRAR-029](#br-migrar-029) | Identidade e cadastro | `U9` | Ativar cadastro gera senha de 12 caracteres e, se o login já existir como usuário, devolve er… |
| [BR-MIGRAR-030](#br-migrar-030) | Retenção e descarte | `R1` | Lixeira de 30 dias, e desligá-la torna apagar irreversível |
| [BR-MIGRAR-031](#br-migrar-031) | Retenção e descarte | `R2` | Restaurar da lixeira devolve como rascunho, não ao estado anterior |
| [BR-MIGRAR-032](#br-migrar-032) | Retenção e descarte | `R3` | Anexo só vai para a lixeira se `MEDIA_TRASH` estiver ligada — e ela é `false` por padrão. Apa… |
| [BR-MIGRAR-033](#br-migrar-033) | Retenção e descarte | `R4` | Auto-draft expira em 7 dias, por SQL direto sobre `post_date`. |
| [BR-MIGRAR-034](#br-migrar-034) | Retenção e descarte | `R5` | A coleta da lixeira só é agendada por visita autenticada ao painel |
| [BR-MIGRAR-035](#br-migrar-035) | Retenção e descarte | `R6` | A coleta tolera estado inconsistente |
| [BR-MIGRAR-036](#br-migrar-036) | Retenção e descarte | `R7` | O arquivo de exportação de dados pessoais vale 3 dias e a varredura é horária. Diferente de R… |
| [BR-MIGRAR-037](#br-migrar-037) | Retenção e descarte | `R8` | `registration_log` não tem política de retenção |
| [BR-MIGRAR-038](#br-migrar-038) | Privacidade e dados pessoais | `D1` | A solicitação é um Post |
| [BR-MIGRAR-039](#br-migrar-039) | Privacidade e dados pessoais | `D2` | Nada acontece sem confirmação do titular |
| [BR-MIGRAR-040](#br-migrar-040) | Privacidade e dados pessoais | `D3` | Falha de envio de e-mail é estado, não exceção |
| [BR-MIGRAR-041](#br-migrar-041) | Privacidade e dados pessoais | `D3b` | Solicitação não confirmada em 24 horas expira para `request-failed`, e a chave é apagada no m… |
| [BR-MIGRAR-042](#br-migrar-042) | Privacidade e dados pessoais | `D4` | Exportar ou apagar dados de terceiro é poder de rede |
| [BR-MIGRAR-043](#br-migrar-043) | Privacidade e dados pessoais | `D5` | A página de política de privacidade é protegida pela própria capacidade de privacidade: apagá… |
| [BR-MIGRAR-044](#br-migrar-044) | Privacidade e dados pessoais | `D6` | Senha de post é texto claro, por desenho — é senha de acesso a conteúdo, não de conta, e prec… |
| [BR-MIGRAR-045](#br-migrar-045) | Atualização e manutenção do software | `A1` | Atualização automática exige escrita no webroot e ausência de VCS |
| [BR-MIGRAR-046](#br-migrar-046) | Atualização e manutenção do software | `A2` | O núcleo atualiza *minor* e desenvolvimento por padrão; *major* só com escolha explícita |
| [BR-MIGRAR-047](#br-migrar-047) | Atualização e manutenção do software | `A3` | A constante vence a opção, e `false` desliga tudo — mas a decisão ainda pode ser revertida po… |
| [BR-MIGRAR-048](#br-migrar-048) | Atualização e manutenção do software | `A4` | Não se atualiza para versão que o ambiente não suporta |
| [BR-MIGRAR-049](#br-migrar-049) | Atualização e manutenção do software | `A5` | Falha crítica congela a atualização automática até intervenção humana |
| [BR-MIGRAR-050](#br-migrar-050) | Atualização e manutenção do software | `A6` | Falha transitória tem exatamente uma segunda chance, em uma hora |
| [BR-MIGRAR-051](#br-migrar-051) | Atualização e manutenção do software | `A7` | O mesmo aviso não é repetido |
| [BR-MIGRAR-052](#br-migrar-052) | Atualização e manutenção do software | `A8` | A assinatura do pacote não é verificada |
| [BR-MIGRAR-053](#br-migrar-053) | Atualização e manutenção do software | `A9` | Cron não é cron |
| [BR-MIGRAR-054](#br-migrar-054) | Atualização e manutenção do software | `A10` | Modo de recuperação dura uma semana e avisa uma vez por dia |
| [BR-MIGRAR-055](#br-migrar-055) | Atualização e manutenção do software | `A11` | Erro em endpoint público não aciona recuperação |
| [BR-MIGRAR-056](#br-migrar-056) | Atualização e manutenção do software | `A12` | Sair do modo de recuperação retoma todas as extensões pausadas de uma vez e zera o limite de… |
| [BR-MIGRAR-057](#br-migrar-057) | Mídia | `M1` | Imagem grande é reduzida na ingestão |
| [BR-MIGRAR-058](#br-migrar-058) | Mídia | `M2` | Quatro tamanhos nascem com o site: `thumbnail` 150×150, `medium` 300, `medium_large` 768, `la… |
| [BR-MIGRAR-059](#br-migrar-059) | Mídia | `M3` | O `srcset` para em 2048 px, independente dos tamanhos existentes. |
| [BR-MIGRAR-060](#br-migrar-060) | Mídia | `M4` | Falha ao gerar derivada de imagem é silenciosa |
| [BR-MIGRAR-061](#br-migrar-061) | Rede (multisite) | `N1` | Quatro estados de supervisão governam o acesso ao site, e o super admin os ignora |
| [BR-MIGRAR-062](#br-migrar-062) | Rede (multisite) | `N2` | `deleted` tem três valores, não dois |
| [BR-MIGRAR-063](#br-migrar-063) | Rede (multisite) | `N3` | `archived` e `spam` produzem a mesma resposta — HTTP 410, "arquivado ou suspenso" — e são cam… |
| [BR-MIGRAR-064](#br-migrar-064) | Rede (multisite) | `N4` | Cada estado de site tem gancho de entrada e de saída (`make_spam_blog`/`unspam_blog`, `archiv… |
| [BR-MIGRAR-065](#br-migrar-065) | Rede (multisite) | `N5` | Nome de site exige no mínimo 4 caracteres e herda a lista de nomes proibidos, somada aos nome… |
| [BR-MIGRAR-066](#br-migrar-066) | Rede (multisite) | `N6` | Criar usuário na rede é permissão de rede, salvo opção explícita |
| [BR-MIGRAR-067](#br-migrar-067) | Rede (multisite) | `N7` | Criar o conjunto de tabelas de um site novo repovoa os papéis a partir do código — é o único… |
| [BR-MIGRAR-068](#br-migrar-068) | Integração externa e IA | `I1` | Credencial de conector tem precedência: variável de ambiente → constante PHP → banco |
| [BR-MIGRAR-069](#br-migrar-069) | Integração externa e IA | `I2` | Credencial de conector pode ser `usuario:senha`, dividida no primeiro dois-pontos para que a… |
| [BR-MIGRAR-070](#br-migrar-070) | Integração externa e IA | `I3` | O Akismet é registrado como conector de filtragem de spam no núcleo, com `wordpress_api_key`… |
| [BR-MIGRAR-071](#br-migrar-071) | Integração externa e IA | `I4` | Toda *ability* exige retorno de permissão, e a falta de callback é erro — não liberação |
| [BR-MIGRAR-072](#br-migrar-072) | Integração externa e IA | `I5` | A autorização de *ability* é filtrável, inclusive para conceder |
| [BR-MIGRAR-073](#br-migrar-073) | Integração externa e IA | `I6` | A execução de *ability* pode ser curto-circuitada antes de qualquer validação — e o docblock… |
| [BR-MIGRAR-074](#br-migrar-074) | Integração externa e IA | `I7` | Toda rota REST deve declarar permissão explícita — e rota sem `permission_callback` funciona,… |
| [BR-MIGRAR-075](#br-migrar-075) | Fronteira do banco | `DB-ENUM` | Toda enumeração do modelo vive em `varchar(20)` sem `ENUM` e sem `CHECK` |
| [BR-MIGRAR-076](#br-migrar-076) | Fronteira do banco | `DB-UNIQ` | Só três garantias de unicidade existem no banco (`options.option_name`, `term_taxonomy(term_i… |
| [BR-MIGRAR-077](#br-migrar-077) | Fronteira do banco | `DB-TRG1` | O contador de comentários é recalculado em PHP e pode ser suspenso |
| [BR-MIGRAR-078](#br-migrar-078) | Fronteira do banco | `DB-TRG2` | A mesma coluna `term_taxonomy.count` tem pelo menos duas definições de "quantos" |
| [BR-MIGRAR-079](#br-migrar-079) | Fronteira do banco | `DB-TRG3` | Apagar reposiciona os filhos em vez de apagá-los |
| [BR-MIGRAR-080](#br-migrar-080) | Fronteira do banco | `DB-TRG4` | Apagar um termo devolve o objeto ao termo padrão, se aquele era o único |
| [BR-MIGRAR-081](#br-migrar-081) | Fronteira do banco | `DB-SENT` | O schema evita `NULL` e usa sentinelas que nenhuma constraint distingue de valor legítimo: `0… |
| [BR-MIGRAR-082](#br-migrar-082) | Fronteira do banco | `DB-SER` | Quatro famílias de coluna `longtext` guardam estrutura PHP serializada — opções, as quatro ta… |
| [BR-MIGRAR-083](#br-migrar-083) | Fronteira do banco | `DB-DEG` | Escrita inválida não falha, ela se degrada |
| [BR-MIGRAR-084](#br-migrar-084) | Fronteira do banco | `DB-SEED` | O schema vazio não é funcional: parte da regra está nas linhas que o instalador cria |
| [BR-MIGRAR-085](#br-migrar-085) | Fronteira do banco | `DB-MIG` | O sistema é sua própria ferramenta de migração, por comparação de estrutura |
| [BR-MIGRAR-086](#br-migrar-086) | Fronteira do banco | `DB-DEAD` | `users.user_status` e `comments.comment_karma` existem no schema e o núcleo nunca escreve nad… |
| [BR-MIGRAR-087](#br-migrar-087) | Autorização | `PERM-1` | O papel é um atalho; a capacidade é a unidade real |
| [BR-MIGRAR-088](#br-migrar-088) | Autorização | `PERM-2` | A autorização mora num metadado serializado, por site |
| [BR-MIGRAR-089](#br-migrar-089) | Autorização | `PERM-3` | Capacidade sobre objeto não é verificada direto: é traduzida |
| [BR-MIGRAR-090](#br-migrar-090) | Autorização | `PERM-4` | No mapeamento de capacidade, todo caminho de erro fecha a porta |
| [BR-MIGRAR-091](#br-migrar-091) | Autorização | `PERM-5` | Onze negações absolutas e proteções de objeto, entre elas: verificar capacidade de post sem i… |
| [BR-MIGRAR-092](#br-migrar-092) | Autorização | `PERM-6` | Dez atalhos de nomenclatura resolvem uma capacidade em outra — `customize` → `edit_theme_opti… |
| [BR-MIGRAR-093](#br-migrar-093) | Autorização | `PERM-7` | Quatro capacidades que o código exige não estão em papel algum: `install_languages`, `resume_… |
| [BR-MIGRAR-094](#br-migrar-094) | Autorização | `PERM-8` | Quatro constantes retiram poder de quem já o tem, inclusive administrador e super admin: `DIS… |
| [BR-MIGRAR-095](#br-migrar-095) | Autorização | `PERM-9` | Em multisite o super admin recebe tudo, menos o negado explicitamente — e a verificação acont… |
| [BR-MIGRAR-096](#br-migrar-096) | Autorização | `PERM-10` | Em rede, o administrador de um site é "um editor com configuração": mantém conteúdo, comentár… |
| [BR-MIGRAR-097](#br-migrar-097) | Autorização | `PERM-11` | Três camadas paralelas de autorização, cada uma com sua própria falha padrão: capacidades (se… |
| [BR-MIGRAR-098](#br-migrar-098) | Autorização | `PERM-12` | Cinco pontos decidem acesso sem consultar o modelo de capacidades: senha de post (sem prazo v… |
| [BR-MIGRAR-099](#br-migrar-099) | Autorização | `PERM-13` | A definição de papel é um retrato tirado na instalação |
| [BR-MIGRAR-100](#br-migrar-100) | Máquinas de estado | `SM-ALL` | Nove ciclos de vida com estado explícito migram inteiros, com os gatilhos de cada transição:… |
| [BR-MIGRAR-101](#br-migrar-101) | Máquinas de estado | `SM-CHANGESET` | O *changeset* do Customizer é um post com regras próprias de ciclo de vida, separado do conte… |
| [BR-MIGRAR-102](#br-migrar-102) | Contrato de extensão (mandato do paradigma) | `EXT-FILTROS` | Os 2.460 pontos de filtro são contrato de extensão a preservar, não detalhe de implementação |
| [BR-MIGRAR-103](#br-migrar-103) | Contrato de extensão (mandato do paradigma) | `EXT-SUBST` | Três formas de substituição são requisito funcional, não decisão de implementação |
| [BR-MIGRAR-104](#br-migrar-104) | Contrato de extensão (mandato do paradigma) | `EXT-EXCLUSAO` | As 7 etapas da exclusão de post e os 3 contadores desnormalizados são comportamento observáve… |
| [BR-MIGRAR-105](#br-migrar-105) | Contrato de extensão (mandato do paradigma) | `EXT-CONTEXTO` | Identidade, consulta, conexão de banco e requisição corrente são escopo de REQUISIÇÃO — e iss… |
| [BR-MIGRAR-106](#br-migrar-106) | Contrato de extensão (mandato do paradigma) | `EXT-ORDEM` | A ordem de carregamento é contrato público |
| [BR-MIGRAR-107](#br-migrar-107) | Escopo declarado | `ESC-SUPERFICIES` | As quatro superfícies de escrita paralelas à API entram no porte com o comportamento atual: X… |
| [BR-MIGRAR-108](#br-migrar-108) | Escopo declarado | `ESC-FILTRAVEL` | Toda regra deste catálogo é um default FILTRÁVEL, e preservar isso é o porte |
| [BR-MIGRAR-109](#br-migrar-109) | Escopo declarado | `ESC-MULTISITE` | Multisite entra no escopo como CAPACIDADE do produto, com subdiretório como modo padrão de in… |
| [BR-MIGRAR-110](#br-migrar-110) | Escopo declarado | `ESC-ENUMERACAO` | A mensagem de erro de login continua distinguindo conta inexistente de senha incorreta, com o… |
| [BR-MIGRAR-111](#br-migrar-111) | Escopo declarado | `ESC-SESSAO` | Trocar a senha não revoga sessão |
| [BR-MIGRAR-112](#br-migrar-112) | Escopo declarado | `ESC-LIMITE-TAXA` | Nenhuma superfície de entrada tem limite de taxa, e os dois únicos freios são travas de tempo… |
| [BR-MIGRAR-113](#br-migrar-113) | Escopo declarado | `ESC-RETENCAO` | O núcleo não declara prazo de retenção nenhum, e portá-lo idêntico é não inventar um |
| [BR-MIGRAR-114](#br-migrar-114) | Escopo declarado | `ESC-IA` | O cliente de IA, os três conectores (`anthropic`, `google`, `openai`) e a Abilities API migra… |
| [BR-MIGRAR-115](#br-migrar-115) | Escopo declarado | `ESC-HTTP` | O rebaixamento automático para HTTP quando o TLS falha migra inteiro: 13 canais nascem em `ht… |
| [BR-MIGRAR-116](#br-migrar-116) | Escopo declarado | `ESC-ORACULO` | O critério de aceite de "idêntico" é combinação por área, e existe um oráculo executável para… |
| [BR-MIGRAR-117](#br-migrar-117) | Escopo declarado | `ESC-CLIENTE` | O lado cliente dos 5 módulos do editor é dependência externa adotada como está, com versão cr… |

---

## Regras MIGRAR

### BR-MIGRAR-001
- **Origem**: [`domain.md`](../domain.md) §2.1 · unit [`posts-e-tipos-de-conteudo`](../posts-e-tipos-de-conteudo/requirements.md)
- **Regra na fonte**: `BR-LEGACY-P1`
- **Confiança original**: 🟢
- **Descrição**: **Publicar é ato explícito.** `wp_insert_post()` grava `draft` quando o status não é informado, enquanto o default do DDL é `publish`: duas regras para a mesma coluna, dependendo de quem escreve.
- **Justificativa de migração**: Política 6 — 🟢 CONFIRMADA, sem pain point, e compatível com o alvo. Nenhuma das 23 respostas a toca.
- **Compatibilidade com paradigma alvo**: A divergência entre o default do código e o default do DDL é **efeito no banco**, que a Decisão 2 põe no contrato. O alvo não pode unificar os dois defaults.
- **Âncora no legado**: `wp-includes/post.php:4703` · `wp-admin/includes/schema.php:167`

### BR-MIGRAR-002
- **Origem**: [`domain.md`](../domain.md) §2.1 · unit [`midia-e-anexos`](../midia-e-anexos/requirements.md)
- **Regra na fonte**: `BR-LEGACY-P2`
- **Confiança original**: 🟢
- **Descrição**: **Anexo nunca é "publicado".** Status fora de `inherit`, `private`, `trash`, `auto-draft` é reescrito para `inherit`: a visibilidade do arquivo é a do post pai.
- **Justificativa de migração**: Política 6 — regra de domínio pura (derivação de visibilidade). A rubrica proíbe descartar invariante de domínio por paradigma.
- **Compatibilidade com paradigma alvo**: Reescrita de valor em trânsito. No alvo é função pura aplicada na borda de escrita; o efeito observável é o valor gravado.
- **Âncora no legado**: `wp-includes/post.php:4705`

### BR-MIGRAR-003
- **Origem**: [`domain.md`](../domain.md) §2.1 · unit [`taxonomias-e-termos`](../taxonomias-e-termos/requirements.md)
- **Regra na fonte**: `BR-LEGACY-P3`
- **Confiança original**: 🟢
- **Descrição**: **Post do tipo `post` sempre tem categoria.** Sem categoria e fora de `auto-draft`, recebe `default_category`; na publicação a regra se repete para toda taxonomia com termo padrão.
- **Justificativa de migração**: Política 6. `database/business-rules.md` §3.4 chama esta de "a regra de negócio mais claramente de domínio em todo o modelo de dados".
- **Compatibilidade com paradigma alvo**: Inexpressável em DDL — é código nos dois lados. Nenhuma mudança de paradigma a afeta.
- **Âncora no legado**: `wp-includes/post.php:4719` · `wp-includes/post.php:5419`

### BR-MIGRAR-004
- **Origem**: [`domain.md`](../domain.md) §2.1
- **Regra na fonte**: `BR-LEGACY-P4`
- **Confiança original**: 🟢
- **Descrição**: **Colaborador não escolhe a URL do que está em revisão.** Em `pending`, quem não tem `publish_posts` tem o `post_name` esvaziado, para não reservar slug sem poder publicar.
- **Justificativa de migração**: Política 6 — regra de direito (capacidade determina efeito de escrita). A rubrica proíbe descartar direitos por paradigma.
- **Compatibilidade com paradigma alvo**: Depende de identidade corrente na borda de escrita: carrega a implicação 2 (contexto por requisição explícito).
- **Âncora no legado**: `wp-includes/post.php:4731`

### BR-MIGRAR-005
- **Origem**: [`domain.md`](../domain.md) §2.1 · [`database/business-rules.md`](../database/business-rules.md) §2.2
- **Regra na fonte**: `BR-LEGACY-P5`
- **Confiança original**: 🟢
- **Descrição**: **Rascunho pode ter slug duplicado; publicado, não.** A unicidade é dispensada em `draft`, `pending`, `auto-draft`, em revisão e no tipo `user_request`. Efeito observável: o slug de um rascunho **muda sozinho** ao publicar.
- **Justificativa de migração**: Política 6. O efeito observável está declarado na fonte, logo entra no contrato da Decisão 2 (efeito no banco).
- **Compatibilidade com paradigma alvo**: É atalho de desempenho com efeito observável. Um alvo que declare `UNIQUE` no slug **quebra** o produto: a dispensa é a regra.
- **Âncora no legado**: `wp-includes/post.php:5561`

### BR-MIGRAR-006
- **Origem**: [`domain.md`](../domain.md) §2.1 · unit [`posts-e-tipos-de-conteudo/publicacao-agendada`](../posts-e-tipos-de-conteudo/publicacao-agendada/requirements.md) · [ADR-0005](../adrs/0005-agendamento-por-comparacao-de-data-nao-por-transicao.md)
- **Regra na fonte**: `BR-LEGACY-P6`
- **Confiança original**: 🟢
- **Descrição**: **Agendamento é guardado por verificação dupla.** `check_and_publish_future_post()` recusa publicar o que não está em `future` e, se a data ainda não chegou, **reagenda** em vez de publicar. O cron não é confiado.
- **Justificativa de migração**: Política 6, e ADR-0005 a registra como decisão fundadora: agendamento por comparação de data, não por transição.
- **Compatibilidade com paradigma alvo**: A desconfiança do agendador é a regra. Num alvo com fila real a verificação dupla pareceria redundante — e removê-la mudaria o comportamento no primeiro atraso. P10 recusa trocar o agendador.
- **Âncora no legado**: `wp-includes/post.php:5482`

### BR-MIGRAR-007
- **Origem**: [`domain.md`](../domain.md) §2.1
- **Regra na fonte**: `BR-LEGACY-P7`
- **Confiança original**: 🟢
- **Descrição**: **Republicar é operação nula.** `wp_publish_post()` retorna sem efeito se o status já é `publish` — nenhum gancho de transição dispara.
- **Justificativa de migração**: Política 6. A ausência de gancho é observável por qualquer extensão que escute transição.
- **Compatibilidade com paradigma alvo**: Idempotência por guarda de estado, não por chave de evento. No alvo, a guarda permanece explícita: um emissor de evento idempotente por ID disparia o gancho, e aqui ele **não** dispara.
- **Âncora no legado**: `wp-includes/post.php:5413`

### BR-MIGRAR-008
- **Origem**: [`domain.md`](../domain.md) §2.1 · [`permissions.md`](../permissions.md) §6 · unit [`kses-e-sanitizacao`](../kses-e-sanitizacao/requirements.md)
- **Regra na fonte**: `BR-LEGACY-P8`
- **Confiança original**: 🟢
- **Descrição**: **HTML bruto é privilégio, e revogável por constante.** Sem `unfiltered_html` o conteúdo passa por kses na gravação; a capacidade é negada a **todos** (inclusive super admin) se `DISALLOW_UNFILTERED_HTML` estiver definida, e a todo não-super-admin em multisite.
- **Justificativa de migração**: Política 6 — direito/permissão, que a rubrica proíbe descartar. P3 manda preservar o default filtrável como produto.
- **Compatibilidade com paradigma alvo**: Constante que **retira** poder de quem o tem é o único mecanismo do sistema que funciona assim; o alvo precisa de um ponto de revogação equivalente, resolvido antes de qualquer verificação.
- **Âncora no legado**: `wp-includes/kses.php:2609` · `wp-includes/capabilities.php:594`

### BR-MIGRAR-009
- **Origem**: [`domain.md`](../domain.md) §2.2 · unit [`comentarios/moderacao-de-comentario`](../comentarios/moderacao-de-comentario/requirements.md)
- **Regra na fonte**: `BR-LEGACY-C1`
- **Confiança original**: 🟢
- **Descrição**: **Duplicata é recusa, não moderação.** Mesmo post, mesmo pai, mesmo autor, mesmo e-mail e mesmo texto ⇒ HTTP 409. Comentário na lixeira não conta como duplicata.
- **Justificativa de migração**: Política 6. É a primeira etapa da cascata que `domain.md` chama de área de maior densidade de regra do sistema.
- **Compatibilidade com paradigma alvo**: **O 409 na mesma resposta é a regra.** A implicação 3 avisa: publicar `comentario.submetido` e deixar handlers reagirem devolve 202 e perde o 409. A cascata fica síncrona (Opção 3 — "o que esta escolha NÃO afrouxa").
- **Âncora no legado**: `wp-includes/comment.php:759`

### BR-MIGRAR-010
- **Origem**: [`domain.md`](../domain.md) §2.2 · [`permissions.md`](../permissions.md) §10 pegadinha 7
- **Regra na fonte**: `BR-LEGACY-C2`
- **Confiança original**: 🟢
- **Descrição**: **Vazão limitada por hora, exceto para quem modera.** Um comentário do mesmo usuário logado, ou do mesmo IP/e-mail anônimo, na última hora aciona o filtro de enxurrada ⇒ HTTP 429. Quem tem `manage_options` ou `moderate_comments` **não é limitado**.
- **Justificativa de migração**: Política 6. A exceção por capacidade é direito, não ajuste de desempenho — a rubrica proíbe descartá-la.
- **Compatibilidade com paradigma alvo**: Mesmo ponto da C1: o 429 é a resposta síncrona. E a exceção exige identidade corrente no momento da avaliação (implicação 2).
- **Âncora no legado**: `wp-includes/comment.php:909` · `wp-includes/comment.php:918`

### BR-MIGRAR-011
- **Origem**: [`domain.md`](../domain.md) §2.2 · [ADR-0002](../adrs/0002-moderacao-de-comentario-em-cascata-com-atalho-de-confianca.md)
- **Regra na fonte**: `BR-LEGACY-C3`
- **Confiança original**: 🟢
- **Descrição**: **Autor do post e moderador têm aprovação automática.** O comentário de quem é `post_author` do post comentado, ou de quem tem `moderate_comments`, entra aprovado **sem passar por nenhuma verificação**.
- **Justificativa de migração**: Política 6, com ADR-0002 como decisão registrada. `domain.md` marca esta como "a regra que mais surpreende" num porte.
- **Compatibilidade com paradigma alvo**: Curto-circuito de confiança: encerra a cascata antes das demais 10 regras. Perde-se em coreografia; preserva-se em cadeia síncrona com ordem declarada.
- **Âncora no legado**: `wp-includes/comment.php:1365`

### BR-MIGRAR-012
- **Origem**: [`domain.md`](../domain.md) §2.2
- **Regra na fonte**: `BR-LEGACY-C4`
- **Confiança original**: 🟢
- **Descrição**: **Moderação manual vence tudo.** Com `comment_moderation = '1'`, `check_comment()` retorna falso na primeira linha: nenhuma outra regra é consultada.
- **Justificativa de migração**: Política 6. É o curto-circuito mais forte da cascata.
- **Compatibilidade com paradigma alvo**: Ordem **e** encerramento são a regra, e nenhum dos dois sobrevive a `publish`/`subscribe`. A cadeia do alvo precisa de ordem declarada e retorno que interrompa.
- **Âncora no legado**: `wp-includes/comment.php:46`

### BR-MIGRAR-013
- **Origem**: [`domain.md`](../domain.md) §2.2
- **Regra na fonte**: `BR-LEGACY-C5`
- **Confiança original**: 🟢
- **Descrição**: **Link em excesso manda para a fila.** `num_links >= comment_max_links` (default **2**) ⇒ moderação; a contagem inclui a URL do autor.
- **Justificativa de migração**: Política 6. O default é opção semeada, e P1 manda documentar cada opção pelo valor de fábrica nomeando o filtro que a altera.
- **Compatibilidade com paradigma alvo**: Compatível. O número é dado de configuração, não constante de código: o alvo precisa do mesmo ponto de leitura filtrável.
- **Âncora no legado**: `wp-includes/comment.php:55` · `wp-admin/includes/schema.php:451`

### BR-MIGRAR-014
- **Origem**: [`domain.md`](../domain.md) §2.2
- **Regra na fonte**: `BR-LEGACY-C6`
- **Confiança original**: 🟢
- **Descrição**: **Palavra de moderação é buscada em seis campos.** `moderation_keys`, linha a linha, como regex sobre autor, e-mail, URL, texto, **IP e user-agent**.
- **Justificativa de migração**: Política 6. Os dois campos inesperados (IP e user-agent) são o que um porte apressado perde.
- **Compatibilidade com paradigma alvo**: Compatível. Transformação de valor sem efeito colateral — é o caso em que o alvo funcional é tradução direta.
- **Âncora no legado**: `wp-includes/comment.php:80`

### BR-MIGRAR-015
- **Origem**: [`domain.md`](../domain.md) §2.2
- **Regra na fonte**: `BR-LEGACY-C7`
- **Confiança original**: 🟢
- **Descrição**: **Autor já aprovado antes passa direto — se o e-mail estiver limpo.** Com `comment_previously_approved = 1` (default **ligado**), exige-se comentário anterior aprovado do mesmo usuário ou do mesmo par nome+e-mail, **e** que o e-mail não contenha palavra de moderação.
- **Justificativa de migração**: Política 6. A conjunção das duas condições é a regra; tratá-las como alternativas inverte o resultado.
- **Compatibilidade com paradigma alvo**: Compatível. Exige leitura do histórico na avaliação — I/O dentro da cadeia síncrona, logo é ponto de fronteira de `await` (implicação 1).
- **Âncora no legado**: `wp-includes/comment.php:133` · `wp-admin/includes/schema.php:546`

### BR-MIGRAR-016
- **Origem**: [`domain.md`](../domain.md) §2.2 · [ADR-0003](../adrs/0003-pingback-do-proprio-site-aprovado-trackback-nunca.md)
- **Regra na fonte**: `BR-LEGACY-C8`
- **Confiança original**: 🟢
- **Descrição**: **Pingback do próprio site publicado é aprovado; trackback nunca.** A origem é resolvida por `url_to_postid()`, que compara host e portanto rejeita URL só aparentemente local, e precisa estar em `publish`. Trackback não é considerado, porque não traz prova de origem.
- **Justificativa de migração**: Política 6, com ADR-0003. P14 manda portar o `pingback` explicitamente.
- **Compatibilidade com paradigma alvo**: Compatível. A verificação de host é regra de segurança de domínio, não mecanismo de paradigma.
- **Âncora no legado**: `wp-includes/comment.php:168`

### BR-MIGRAR-017
- **Origem**: [`domain.md`](../domain.md) §2.2 · unit [`posts-e-tipos-de-conteudo/lixeira-e-restauracao`](../posts-e-tipos-de-conteudo/lixeira-e-restauracao/requirements.md)
- **Regra na fonte**: `BR-LEGACY-C9`
- **Confiança original**: 🟢
- **Descrição**: **Lista de proibição vai para a lixeira, não para spam.** `disallowed_keys` casando ⇒ `trash` se a lixeira estiver ligada, `spam` se não. A distinção existe para que o conteúdo seja recuperável.
- **Justificativa de migração**: Política 6. O destino depende de `EMPTY_TRASH_DAYS`, logo a regra acopla retenção a moderação — e isso é observável.
- **Compatibilidade com paradigma alvo**: Compatível. É o ponto de extensão onde um classificador externo entra (P13), e esse ponto migra mesmo sem o classificador.
- **Âncora no legado**: `wp-includes/comment.php:1384` · `wp-includes/comment.php:1459`

### BR-MIGRAR-018
- **Origem**: [`domain.md`](../domain.md) §2.2 · [`database/business-rules.md`](../database/business-rules.md) §6
- **Regra na fonte**: `BR-LEGACY-C10`
- **Confiança original**: 🟢
- **Descrição**: **Texto longo demais é erro de usuário, não truncamento.** Nome, e-mail, URL e conteúdo acima do tamanho da coluna devolvem `WP_Error` — ao contrário do resto do sistema, que trunca em silêncio.
- **Justificativa de migração**: Política 6. É a **exceção** à regra implícita de `wpdb` (escrita inválida degrada, não falha), e a exceção é o que se perde num porte.
- **Compatibilidade com paradigma alvo**: `WP_Error` como valor de retorno, não exceção (implicação 4). O alvo preserva falha como estado devolvido; retry genérico de fila atropelaria a regra.
- **Âncora no legado**: `wp-includes/comment.php:1319`

### BR-MIGRAR-019
- **Origem**: [`domain.md`](../domain.md) §2.2
- **Regra na fonte**: `BR-LEGACY-C11`
- **Confiança original**: 🟢
- **Descrição**: **Comentário em post antigo fecha sozinho.** Com `close_comments_for_old_posts`, um post do tipo `post` com mais de `close_comments_days_old` dias (default **14**) tem `comment_status` e `ping_status` reescritos para `closed` **em memória** — o banco não muda.
- **Justificativa de migração**: Política 6. `paradigm_decision.md` usa exatamente esta regra como exemplo da implicação 1.
- **Compatibilidade com paradigma alvo**: **É o caso-teste da implicação 1.** O efeito observável existe só porque o filtro devolve valor ao chamador. Barramento que não devolve retorno apaga esta regra sem erro algum. Decisão 2: valor devolvido por hook é contrato byte a byte.
- **Âncora no legado**: `wp-includes/comment.php:3841`

### BR-MIGRAR-020
- **Origem**: [`domain.md`](../domain.md) §2.2 · [`permissions.md`](../permissions.md) §10 pegadinha 6
- **Regra na fonte**: `BR-LEGACY-C12`
- **Confiança original**: 🟢
- **Descrição**: **Nota editorial não é comentário público.** `comment_type = 'note'` exige login, é excluída do `comment_count`, usa `edit_comment` do post em vez de `moderate_comments`, só aceita tipos de post que declarem suporte, e apagar ou lixeirar a nota raiz **arrasta as respostas**.
- **Justificativa de migração**: Política 6. Reúne autorização, contagem e cascata de exclusão num só tipo — três contratos distintos.
- **Compatibilidade com paradigma alvo**: O arrasto das respostas é cascata em PHP, não FK: ver a regra das 7 etapas de exclusão. `ON DELETE CASCADE` no destino mudaria o comportamento para comentário comum também.
- **Âncora no legado**: `wp-includes/comment.php:1652` · `wp-includes/comment.php:3138` · `wp-includes/rest-api/endpoints/class-wp-rest-comments-controller.php:441`

### BR-MIGRAR-021
- **Origem**: [`domain.md`](../domain.md) §2.3 · unit [`usuarios-e-perfis/cadastro-de-usuario`](../usuarios-e-perfis/cadastro-de-usuario/requirements.md)
- **Regra na fonte**: `BR-LEGACY-U1`
- **Confiança original**: 🟢
- **Descrição**: **Registro aberto é desligado por padrão** (`users_can_register = 0`) e o papel de quem se registra é `subscriber` (`default_role`).
- **Justificativa de migração**: Política 6. P1 manda documentar pelo valor de fábrica nomeando o filtro que o altera.
- **Compatibilidade com paradigma alvo**: Compatível. Dado de configuração, não código.
- **Âncora no legado**: `wp-admin/includes/schema.php:416` · `wp-admin/includes/schema.php:466`

### BR-MIGRAR-022
- **Origem**: [`domain.md`](../domain.md) §2.3 · [`database/business-rules.md`](../database/business-rules.md) §2.2
- **Regra na fonte**: `BR-LEGACY-U2`
- **Confiança original**: 🟢
- **Descrição**: **Login até 60 caracteres, apelido até 50 — e os dois são erro, não truncamento.** A unicidade de login e e-mail é verificada **em código**: o índice `user_login_key` não é `UNIQUE` e o banco permite duplicata.
- **Justificativa de migração**: Política 6. A unicidade só em código é invariante sujeita a corrida, e é o que o alvo precisa reproduzir ou declarar que mudou.
- **Compatibilidade com paradigma alvo**: Declarar `UNIQUE` no alvo fecha a corrida — e muda o efeito no banco, que a Decisão 2 põe no contrato. Se for feito, é decisão registrada, não efeito colateral.
- **Âncora no legado**: `wp-includes/user.php:2318` · `wp-includes/user.php:2347` · `wp-includes/user.php:2325`

### BR-MIGRAR-023
- **Origem**: [`domain.md`](../domain.md) §2.3
- **Regra na fonte**: `BR-LEGACY-U3`
- **Confiança original**: 🟢
- **Descrição**: **A lista de logins proibidos é vazia por padrão** e existe só como filtro (`illegal_user_logins`), sem interface.
- **Justificativa de migração**: Política 6. P3: o ponto de extensão é o produto — uma lista vazia com filtro é exatamente isso.
- **Compatibilidade com paradigma alvo**: Compatível. É um dos 2.460 pontos de filtro que a implicação 1 manda tratar como contrato.
- **Âncora no legado**: `wp-includes/user.php:2336`

### BR-MIGRAR-024
- **Origem**: [`domain.md`](../domain.md) §2.3 · [`permissions.md`](../permissions.md) §9 · unit [`autenticacao-e-sessoes/login-por-formulario`](../autenticacao-e-sessoes/login-por-formulario/requirements.md)
- **Regra na fonte**: `BR-LEGACY-U4`
- **Confiança original**: 🟢
- **Descrição**: **A chave de reset de senha vale 24 horas** e é apagada no primeiro login bem-sucedido.
- **Justificativa de migração**: Política 6 — autorização que não é capacidade, e a rubrica proíbe descartar direitos.
- **Compatibilidade com paradigma alvo**: Compatível. Prazo e consumo são regra de domínio.
- **Âncora no legado**: `wp-includes/user.php:3204` · `wp-includes/user.php:117`

### BR-MIGRAR-025
- **Origem**: [`domain.md`](../domain.md) §2.3 · unit [`autenticacao-e-sessoes/autenticacao-por-cookie`](../autenticacao-e-sessoes/autenticacao-por-cookie/requirements.md)
- **Regra na fonte**: `BR-LEGACY-U5`
- **Confiança original**: 🟢
- **Descrição**: **Sessão dura 2 dias; "lembrar de mim", 14 — com 12 horas de carência.** Sem "lembrar", o cookie é de sessão, mas o *token* ainda expira em 2 dias.
- **Justificativa de migração**: Política 6. Os três números são comportamento visível ao usuário.
- **Compatibilidade com paradigma alvo**: Compatível. Os prazos vivem em funções substituíveis (`pluggable.php`), logo carregam também a regra das 38 substituições.
- **Âncora no legado**: `wp-includes/pluggable.php:1082` · `wp-includes/pluggable.php:1088` · `wp-includes/pluggable.php:1091`

### BR-MIGRAR-026
- **Origem**: [`domain.md`](../domain.md) §2.3 · [`permissions.md`](../permissions.md) §8.2 · unit [`application-passwords/autenticacao-basic-por-senha-de-aplicacao`](../application-passwords/autenticacao-basic-por-senha-de-aplicacao/requirements.md)
- **Regra na fonte**: `BR-LEGACY-U6`
- **Confiança original**: 🟢
- **Descrição**: **Senha de aplicação é credencial de segunda classe por desenho:** 24 caracteres gerados, guardados com *hash* em metadado, e sua administração reusa a permissão de **editar aquele usuário**. Autenticar com ela **não** reduz as capacidades do usuário.
- **Justificativa de migração**: Política 6 — direito/permissão. P7 manda manter o comportamento atual, inclusive a sobrevivência da senha de aplicação à troca da senha da conta.
- **Compatibilidade com paradigma alvo**: ⚠️ `permissions.md` §8.2 registra a consequência: credencial de longa duração, sem escopo e sem prazo, que vale o que a conta vale. **Dar escopo a ela é mudança de comportamento** — fica como dívida herdada reproduzida de propósito, na mesma classe de P11 e P12.
- **Âncora no legado**: `wp-includes/class-wp-application-passwords.php:42` · `wp-includes/class-wp-application-passwords.php:98` · `wp-includes/capabilities.php:800`

### BR-MIGRAR-027
- **Origem**: [`domain.md`](../domain.md) §2.3 · unit [`multisite/cadastro-em-rede`](../multisite/cadastro-em-rede/requirements.md)
- **Regra na fonte**: `BR-LEGACY-U7`
- **Confiança original**: 🟢
- **Descrição**: **Em multisite, cadastro pendente reserva o nome por 2 dias.** Passado o prazo, o cadastro anterior é **apagado** e o novo prossegue. Nome de usuário entre 4 e 60 caracteres, com lista fixa de nomes proibidos (`www`, `web`, `root`, `admin`, `main`, `invite`, `administrator`…).
- **Justificativa de migração**: Política 6. P4 mantém multisite no escopo como capacidade do produto.
- **Compatibilidade com paradigma alvo**: Compatível. A reserva por prazo é lógica de domínio, não lock de banco: não há `SELECT … FOR UPDATE` a traduzir.
- **Âncora no legado**: `wp-includes/ms-functions.php:488` · `wp-includes/ms-functions.php:513` · `wp-includes/ms-functions.php:560`

### BR-MIGRAR-028
- **Origem**: [`domain.md`](../domain.md) §2.3
- **Regra na fonte**: `BR-LEGACY-U8`
- **Confiança original**: 🟢
- **Descrição**: **O domínio do e-mail pode ser restringido ou banido na rede** (`limited_email_domains`, `banned_email_domains`).
- **Justificativa de migração**: Política 6. Opção de rede com valor de fábrica, lida por P1.
- **Compatibilidade com paradigma alvo**: Compatível.
- **Âncora no legado**: `wp-includes/ms-functions.php:400` · `wp-includes/ms-functions.php:525`

### BR-MIGRAR-029
- **Origem**: [`domain.md`](../domain.md) §2.3 · [`state-machines.md`](../state-machines.md) §6
- **Regra na fonte**: `BR-LEGACY-U9`
- **Confiança original**: 🟢
- **Descrição**: **Ativar cadastro gera senha de 12 caracteres** e, se o login já existir como usuário, devolve erro específico — mas **marca o cadastro como ativo de todo jeito**.
- **Justificativa de migração**: Política 6. A inconsistência (erro + marcação de ativo) é comportamento observável, não defeito a corrigir de ofício.
- **Compatibilidade com paradigma alvo**: Compatível, e é exatamente o tipo de passo que um alvo transacional "consertaria por acidente": sem transação no legado, o efeito parcial é a regra.
- **Âncora no legado**: `wp-includes/ms-functions.php:1232` · `wp-includes/ms-functions.php:1248`

### BR-MIGRAR-030
- **Origem**: [`domain.md`](../domain.md) §2.4 · [ADR-0004](../adrs/0004-lixeira-com-memoria-e-restauracao-para-rascunho.md)
- **Regra na fonte**: `BR-LEGACY-R1`
- **Confiança original**: 🟢
- **Descrição**: **Lixeira de 30 dias, e desligá-la torna apagar irreversível.** Com `EMPTY_TRASH_DAYS = 0`, `wp_trash_post()` chama `wp_delete_post( force )` na primeira linha.
- **Justificativa de migração**: Política 6, com ADR-0004.
- **Compatibilidade com paradigma alvo**: Compatível. O valor da constante é 🔴 desconhecido nesta instalação; P1 manda portar o default de fábrica nomeando o ponto que o altera.
- **Âncora no legado**: `wp-includes/default-constants.php:388` · `wp-includes/post.php:4085`

### BR-MIGRAR-031
- **Origem**: [`domain.md`](../domain.md) §2.4 · [ADR-0004](../adrs/0004-lixeira-com-memoria-e-restauracao-para-rascunho.md)
- **Regra na fonte**: `BR-LEGACY-R2`
- **Confiança original**: 🟢
- **Descrição**: **Restaurar da lixeira devolve como rascunho, não ao estado anterior.** O estado anterior está gravado e disponível por filtro, mas o default desde 5.6 é `draft` (`inherit` para anexo) — mudança deliberada de comportamento.
- **Justificativa de migração**: Política 6. A memória do estado anterior existe e **não** é usada por default: as duas metades são a regra.
- **Compatibilidade com paradigma alvo**: Compatível. O filtro que expõe o estado anterior é um dos 2.460 pontos de contrato.
- **Âncora no legado**: `wp-includes/post.php:4209`

### BR-MIGRAR-032
- **Origem**: [`domain.md`](../domain.md) §2.4 · [`questions.md`](../questions.md) Pergunta 9
- **Regra na fonte**: `BR-LEGACY-R3`
- **Confiança original**: 🟢
- **Descrição**: **Anexo só vai para a lixeira se `MEDIA_TRASH` estiver ligada** — e ela é `false` por padrão. Apagar mídia é, por default, **definitivo, sem aviso**.
- **Justificativa de migração**: Política 4 teria mandado DECISÃO HUMANA (REQ-051 pede aviso), mas a **Pergunta 9 já foi respondida**: a exclusão continua definitiva, sem lixeira e sem aviso, porque a assimetria com o conteúdo é comportamento do produto.
- **Compatibilidade com paradigma alvo**: Compatível. Dar lixeira à mídia criaria retenção agendada que o legado não tem — e o agendador do legado depende de visita autenticada (R5).
- **Âncora no legado**: `wp-includes/default-constants.php:135` · `wp-includes/post.php:6829`

### BR-MIGRAR-033
- **Origem**: [`domain.md`](../domain.md) §2.4
- **Regra na fonte**: `BR-LEGACY-R4`
- **Confiança original**: 🟢
- **Descrição**: **Auto-draft expira em 7 dias**, por SQL direto sobre `post_date`.
- **Justificativa de migração**: Política 6.
- **Compatibilidade com paradigma alvo**: Compatível. SQL direto sem ORM: a reposição no alvo é consulta explícita, e `database/business-rules.md` §5 avisa que migrar o modelo exige desserializador, não conversor SQL.
- **Âncora no legado**: `wp-includes/post.php:8373`

### BR-MIGRAR-034
- **Origem**: [`domain.md`](../domain.md) §2.4 · [ADR-0006](../adrs/0006-retencao-agendada-por-visita-ao-painel.md) · [`questions.md`](../questions.md) Pergunta 10
- **Regra na fonte**: `BR-LEGACY-R5`
- **Confiança original**: 🟢
- **Descrição**: **A coleta da lixeira só é agendada por visita autenticada ao painel.** `wp_scheduled_delete` e `delete_expired_transients` são registrados em `wp-admin/admin.php` **depois** de `auth_redirect()`; `wp_scheduled_auto_draft_delete` é registrado ao abrir a tela de edição. Um site que ninguém administra **nunca agenda sua própria limpeza**.
- **Justificativa de migração**: Política 6, com ADR-0006, e a Pergunta 10 crava: a consequência observável **é** comportamento do WordPress, não acidente.
- **Compatibilidade com paradigma alvo**: ⚠️ **Implicação 6.** Num alvo assíncrono longo-vivo o laço de eventos sobrevive à resposta e o disparo pode **completar** — o que apagaria esta regra. O critério de aceite tem de verificar a **falha** do disparo, não a latência.
- **Âncora no legado**: `wp-admin/admin.php:104` · `wp-admin/includes/post.php:798`

### BR-MIGRAR-035
- **Origem**: [`domain.md`](../domain.md) §2.4
- **Regra na fonte**: `BR-LEGACY-R6`
- **Confiança original**: 🟢
- **Descrição**: **A coleta tolera estado inconsistente.** Se o registro marcado como "na lixeira desde" não está mais em `trash`, a rotina apaga só o metadado e segue — não apaga o registro.
- **Justificativa de migração**: Política 6. É tolerância deliberada a inconsistência, e um alvo com integridade referencial a removeria por construção.
- **Compatibilidade com paradigma alvo**: Compatível, com atenção: FK no destino tornaria o caso impossível e o caminho de código morto — o que muda o efeito no banco.
- **Âncora no legado**: `wp-includes/functions.php:6989` · `wp-includes/functions.php:7007`

### BR-MIGRAR-036
- **Origem**: [`domain.md`](../domain.md) §2.4 · unit [`privacidade-e-dados-pessoais/solicitacao-de-dados-pessoais`](../privacidade-e-dados-pessoais/solicitacao-de-dados-pessoais/requirements.md)
- **Regra na fonte**: `BR-LEGACY-R7`
- **Confiança original**: 🟢
- **Descrição**: **O arquivo de exportação de dados pessoais vale 3 dias** e a varredura é horária. Diferente de R5, este evento é registrado em `init` — logo existe mesmo num site que ninguém administra.
- **Justificativa de migração**: Política 6. A assimetria com R5 é a regra: dois agendamentos com gatilhos de registro diferentes.
- **Compatibilidade com paradigma alvo**: Compatível. Preservar **os dois** pontos de registro distintos, não unificá-los num só agendador.
- **Âncora no legado**: `wp-admin/includes/privacy-tools.php:610` · `wp-includes/functions.php:8550` · `wp-includes/default-filters.php:459`

### BR-MIGRAR-037
- **Origem**: [`domain.md`](../domain.md) §2.4 · [`database/business-rules.md`](../database/business-rules.md) §9 · [`questions.md`](../questions.md) Pergunta 20
- **Regra na fonte**: `BR-LEGACY-R8`
- **Confiança original**: 🟢
- **Descrição**: **`registration_log` não tem política de retenção.** Acumula IP e e-mail indefinidamente, e apagar o site não a toca.
- **Justificativa de migração**: Política 4 apontaria DECISÃO HUMANA, mas a **Pergunta 20 respondeu**: manter o comportamento e registrar como obrigação de LGPD/GDPR que a **implantação** assume, com rotina de descarte **configurável, não embutida**.
- **Compatibilidade com paradigma alvo**: Compatível. A rotina configurável é trabalho novo fora do núcleo; o núcleo não declara prazo nenhum, e inventar um deixa de ser idêntico.
- **Âncora no legado**: `wp-admin/includes/schema.php:274`

### BR-MIGRAR-038
- **Origem**: [`domain.md`](../domain.md) §2.5 · [`state-machines.md`](../state-machines.md) §4
- **Regra na fonte**: `BR-LEGACY-D1`
- **Confiança original**: 🟢
- **Descrição**: **A solicitação é um Post.** Exportação e apagamento de dados pessoais vivem como `post_type = 'user_request'` com quatro status dedicados.
- **Justificativa de migração**: Política 6. É escolha de modelagem com efeito observável: a solicitação herda tudo o que vale para post.
- **Compatibilidade com paradigma alvo**: É o caso em que a Opção 3 tenta separar estrutura de comportamento e **não consegue**: normalizar a solicitação numa tabela própria muda o efeito no banco, que a Decisão 2 põe no contrato.
- **Âncora no legado**: `wp-includes/post.php:767`

### BR-MIGRAR-039
- **Origem**: [`domain.md`](../domain.md) §2.5 · [`permissions.md`](../permissions.md) §9
- **Regra na fonte**: `BR-LEGACY-D2`
- **Confiança original**: 🟢
- **Descrição**: **Nada acontece sem confirmação do titular.** A chave de confirmação vale 24 horas, é guardada com *hash* em `post_password`, e só pode ser validada enquanto a solicitação está em `request-pending` ou `request-failed`.
- **Justificativa de migração**: Política 6 — autorização que não é capacidade. A rubrica proíbe descartar direitos.
- **Compatibilidade com paradigma alvo**: Compatível. A reutilização de `post_password` para guardar o hash é consequência de D1.
- **Âncora no legado**: `wp-includes/user.php:5058` · `wp-includes/user.php:5097`

### BR-MIGRAR-040
- **Origem**: [`domain.md`](../domain.md) §2.5
- **Regra na fonte**: `BR-LEGACY-D3`
- **Confiança original**: 🟢
- **Descrição**: **Falha de envio de e-mail é estado, não exceção.** A solicitação vai para `request-failed` e pode ser reenviada — por isso `request-failed` aceita validação de chave.
- **Justificativa de migração**: Política 6. `paradigm_decision.md` usa esta regra como exemplo da implicação 4.
- **Compatibilidade com paradigma alvo**: ⚠️ **Implicação 4.** Falha como estado persistido, não como exceção propagada nem DLQ. Um `retry` de infraestrutura sobrepõe a política e muda o que o titular vê.
- **Âncora no legado**: `wp-admin/includes/privacy-tools.php:226` · `wp-includes/user.php:5097`

### BR-MIGRAR-041
- **Origem**: [`domain.md`](../domain.md) §2.5
- **Regra na fonte**: `BR-LEGACY-D3b`
- **Confiança original**: 🟢
- **Descrição**: **Solicitação não confirmada em 24 horas expira para `request-failed`, e a chave é apagada** no mesmo `UPDATE` — o link antigo deixa de existir em vez de apenas vencer. Virou cron diário na 7.1.0; antes dependia de visita à tela de privacidade.
- **Justificativa de migração**: Política 6. A troca de gatilho na 7.1.0 é a cronologia que `@since` dá e nenhum commit confirma (L1).
- **Compatibilidade com paradigma alvo**: Compatível. Apagar a chave no mesmo `UPDATE` é atomicidade obtida por uma única instrução, não por transação — e não há transação no sistema para quebrar.
- **Âncora no legado**: `wp-admin/includes/privacy-tools.php:195` · `wp-includes/functions.php:8568` · `wp-includes/default-filters.php:461`

### BR-MIGRAR-042
- **Origem**: [`domain.md`](../domain.md) §2.5 · [`permissions.md`](../permissions.md) §5.4
- **Regra na fonte**: `BR-LEGACY-D4`
- **Confiança original**: 🟢
- **Descrição**: **Exportar ou apagar dados de terceiro é poder de rede.** `export_others_personal_data`, `erase_others_personal_data` e `manage_privacy_options` mapeiam para `manage_network` em multisite e `manage_options` fora dela.
- **Justificativa de migração**: Política 6 — direito/permissão.
- **Compatibilidade com paradigma alvo**: Compatível. Mapeamento condicionado ao modo de instalação: o alvo precisa resolver `MULTISITE` antes de autorizar.
- **Âncora no legado**: `wp-includes/capabilities.php:795`

### BR-MIGRAR-043
- **Origem**: [`domain.md`](../domain.md) §2.5 · [`permissions.md`](../permissions.md) §5.2
- **Regra na fonte**: `BR-LEGACY-D5`
- **Confiança original**: 🟢
- **Descrição**: **A página de política de privacidade é protegida pela própria capacidade de privacidade:** apagá-la exige `manage_privacy_options` somada às capacidades normais de apagar post.
- **Justificativa de migração**: Política 6 — direito/permissão sobre objeto específico.
- **Compatibilidade com paradigma alvo**: Compatível. É uma das 11 proteções de objeto de `map_meta_cap()`.
- **Âncora no legado**: `wp-includes/capabilities.php:179`

### BR-MIGRAR-044
- **Origem**: [`domain.md`](../domain.md) §2.5 · [`database/business-rules.md`](../database/business-rules.md) §9 · [`questions.md`](../questions.md) Pergunta 8
- **Regra na fonte**: `BR-LEGACY-D6`
- **Confiança original**: 🟢
- **Descrição**: **Senha de post é texto claro, por desenho** — é senha de acesso a conteúdo, não de conta, e precisa poder ser exibida a quem edita. O atestado é um cookie de 10 dias cuja idade o servidor **nunca** confere, e não há limite de tentativa.
- **Justificativa de migração**: Política 6 para o desenho (D6 é 🟢) e Pergunta 8 para o atestado: manter cookie de 10 dias, sem verificação de idade e sem limite de tentativa. **Correção de premissa:** `questions.options.json` apurou que o prazo de 10 dias existe, vive no cookie, e o servidor é que não o confere — a análise anterior registrava "sem prazo".
- **Compatibilidade com paradigma alvo**: Comparação literal, não verificação de hash: transformar em hash remove a exibição ao editor e muda o produto. O armazenamento em texto claro é item de **DECISÃO HUMANA** própria (ver BR-HUMANA), porque `database/business-rules.md` §9 pede decisão explícita.
- **Âncora no legado**: `wp-login.php:781` · `wp-includes/post-template.php:890` · `wp-admin/includes/schema.php:170`

### BR-MIGRAR-045
- **Origem**: [`domain.md`](../domain.md) §2.6 · unit [`atualizacoes-e-upgrader/atualizacao-automatica-do-nucleo`](../atualizacoes-e-upgrader/atualizacao-automatica-do-nucleo/requirements.md)
- **Regra na fonte**: `BR-LEGACY-A1`
- **Confiança original**: 🟢
- **Descrição**: **Atualização automática exige escrita no webroot e ausência de VCS.** Se as credenciais de sistema de arquivos falham, ou se o diretório é um *checkout* de controle de versão, a atualização é cancelada — e no caso do núcleo o administrador é avisado por e-mail.
- **Justificativa de migração**: Política 6.
- **Compatibilidade com paradigma alvo**: Compatível. A detecção de VCS é regra de produto; a escrita no próprio webroot é o que `deployment.md` §8 registra como obstáculo a containerizar — decisão de infra, ainda 🔴.
- **Âncora no legado**: `wp-admin/includes/class-wp-automatic-updater.php:210`

### BR-MIGRAR-046
- **Origem**: [`domain.md`](../domain.md) §2.6
- **Regra na fonte**: `BR-LEGACY-A2`
- **Confiança original**: 🟢
- **Descrição**: **O núcleo atualiza *minor* e desenvolvimento por padrão; *major* só com escolha explícita.** `auto_update_core_major` nasce `'unset'`.
- **Justificativa de migração**: Política 6. O sentinela `'unset'` (diferente de `true`/`false`) é a regra.
- **Compatibilidade com paradigma alvo**: Compatível. Três estados numa opção que o DDL não distingue — mesmo padrão de sentinela de `database/business-rules.md` §4.
- **Âncora no legado**: `wp-admin/includes/class-core-upgrader.php:288`

### BR-MIGRAR-047
- **Origem**: [`domain.md`](../domain.md) §2.6
- **Regra na fonte**: `BR-LEGACY-A3`
- **Confiança original**: 🟢
- **Descrição**: **A constante vence a opção, e `false` desliga tudo** — mas a decisão ainda pode ser revertida por filtro.
- **Justificativa de migração**: Política 6. A precedência de três níveis (constante → opção → filtro) é contrato.
- **Compatibilidade com paradigma alvo**: Compatível, e é o mesmo padrão de I1 (ambiente → constante → banco). O alvo precisa de uma ordem de precedência declarada, não herdada do acidente de carregamento.
- **Âncora no legado**: `wp-admin/includes/class-core-upgrader.php:293`

### BR-MIGRAR-048
- **Origem**: [`domain.md`](../domain.md) §2.6
- **Regra na fonte**: `BR-LEGACY-A4`
- **Confiança original**: 🟢
- **Descrição**: **Não se atualiza para versão que o ambiente não suporta.** PHP e MySQL do servidor são comparados com o mínimo da versão oferecida; plugin e tema também declaram `requires_php`.
- **Justificativa de migração**: Política 6.
- **Compatibilidade com paradigma alvo**: ⚠️ No alvo, "PHP mínimo" perde referente. A regra migra como **compatibilidade de ambiente declarada pelo pacote**, com o nome do runtime do alvo — e isso só se resolve quando a Lacuna 1 (runtime) for respondida.
- **Âncora no legado**: `wp-admin/includes/class-wp-automatic-updater.php:278`

### BR-MIGRAR-049
- **Origem**: [`domain.md`](../domain.md) §2.6 · [ADR-0008](../adrs/0008-falha-critica-de-atualizacao-exige-intervencao-humana.md) · [`state-machines.md`](../state-machines.md) §8
- **Regra na fonte**: `BR-LEGACY-A5`
- **Confiança original**: 🟢
- **Descrição**: **Falha crítica congela a atualização automática até intervenção humana.** `disk_full`, erro de cópia de diretório ou *rollback* que também falhou gravam `auto_core_update_failed` com `critical = true`, e `should_update_to_version()` passa a recusar tudo.
- **Justificativa de migração**: Política 6, com ADR-0008. É o **único histórico persistente de falha** do sistema.
- **Compatibilidade com paradigma alvo**: ⚠️ **Implicação 4.** Retry e DLQ de infraestrutura substituem esta política e quebram ADR-0008. A política de nova tentativa é escrita à mão e o número de e-mails ao administrador é critério de aceite.
- **Âncora no legado**: `wp-admin/includes/class-wp-automatic-updater.php:815` · `wp-admin/includes/class-core-upgrader.php:324`

### BR-MIGRAR-050
- **Origem**: [`domain.md`](../domain.md) §2.6
- **Regra na fonte**: `BR-LEGACY-A6`
- **Confiança original**: 🟢
- **Descrição**: **Falha transitória tem exatamente uma segunda chance, em uma hora.** `incompatible_archive`, `download_failed`, `insane_distro` e `locked` reagendam uma única tentativa e **não** notificam; só a segunda falha manda e-mail.
- **Justificativa de migração**: Política 6. "Exatamente uma" e "só a segunda notifica" são dois números observáveis por e-mail.
- **Compatibilidade com paradigma alvo**: ⚠️ **Implicação 4.** `maxReceiveCount` de uma fila não reproduz isto: a política distingue a primeira da segunda falha **no efeito de notificação**, não só na contagem.
- **Âncora no legado**: `wp-admin/includes/class-wp-automatic-updater.php:854`

### BR-MIGRAR-051
- **Origem**: [`domain.md`](../domain.md) §2.6
- **Regra na fonte**: `BR-LEGACY-A7`
- **Confiança original**: 🟢
- **Descrição**: **O mesmo aviso não é repetido.** Notificação é gravada com e-mail e versão; repetir a dupla cancela o envio.
- **Justificativa de migração**: Política 6. Deduplicação por chave de negócio, persistida em opção.
- **Compatibilidade com paradigma alvo**: ⚠️ **Implicação 4.** É idempotência de notificação feita à mão, e quem a delegar ao broker muda quantos e-mails chegam.
- **Âncora no legado**: `wp-admin/includes/class-wp-automatic-updater.php:313` · `wp-admin/includes/class-wp-automatic-updater.php:861`

### BR-MIGRAR-052
- **Origem**: [`domain.md`](../domain.md) §2.6 · [ADR-0010](../adrs/0010-tolerar-pacote-sem-assinatura-verificada.md) · [`questions.md`](../questions.md) Pergunta 11
- **Regra na fonte**: `BR-LEGACY-A8`
- **Confiança original**: 🟢
- **Descrição**: **A assinatura do pacote não é verificada.** `wp_trusted_keys()` devolve lista vazia desde 1º de abril de 2021, nenhum chamador exige verificação, e a falha é rebaixada a aviso com o caso "sem assinatura" silenciado fora de `WP_DEBUG`.
- **Justificativa de migração**: Política 4 apontaria DECISÃO HUMANA (é o achado de segurança nº 1 e o `TODO` mais consequente da árvore), mas a **Pergunta 11 respondeu**: manter a tolerância, **inclusive o modo de falha**, porque exigir assinatura tornaria o sistema incompatível com o ecossistema que ele clona. Registrado como **DÍVIDA HERDADA**, explicitamente.
- **Compatibilidade com paradigma alvo**: ⚠️ **Armadilha das 5 bordas.** `refactor/architectures.md` §6 avisa que "um adaptador bem escrito os conserta por acidente e quebra o critério de idêntico". O adaptador novo de verificação de assinatura reproduz a lista vazia e o *softfail* **de propósito**.
- **Âncora no legado**: `wp-admin/includes/file.php:1548` · `wp-admin/includes/file.php:1553`

### BR-MIGRAR-053
- **Origem**: [`domain.md`](../domain.md) §2.6 · unit [`cron`](../cron/requirements.md) · [`questions.md`](../questions.md) Pergunta 10
- **Regra na fonte**: `BR-LEGACY-A9`
- **Confiança original**: 🟢
- **Descrição**: **Cron não é cron.** A fila só avança quando chega requisição HTTP; a trava é um transiente de 60 segundos, descartado se passar de 10 minutos; `DISABLE_WP_CRON` desliga o disparo sem desligar a fila. O disparo é deliberadamente não bloqueante: *timeout* 0,01 s, `blocking` falso, `sslverify` falso.
- **Justificativa de migração**: Política 6, e a Pergunta 10 recusa explicitamente trocar o agendador: "trocar por agendador do sistema produz um produto que se comporta diferente no primeiro dia". Preservar também a trava de 60 s do `wp-cron.php` e a de 5 min do `wp-mail.php`.
- **Compatibilidade com paradigma alvo**: ⚠️ **Implicação 6, o caso em que o alvo acerta demais.** Em PHP o disparo **aborta**; numa runtime assíncrona o laço de eventos sobrevive à resposta e a requisição pode **completar**. Um porte fiel reproduz a **falha**, não a intenção. `integrations.json`: nenhum broker existe nesta árvore — num porte não há mensageria a migrar, e a resposta diz para **não** construir uma.
- **Âncora no legado**: `wp-includes/cron.php:915` · `wp-includes/cron.php:1051` · `wp-includes/default-constants.php:399`

### BR-MIGRAR-054
- **Origem**: [`domain.md`](../domain.md) §2.6 · unit [`recovery-mode-e-tratamento-de-erro-fatal/modo-de-recuperacao`](../recovery-mode-e-tratamento-de-erro-fatal/modo-de-recuperacao/requirements.md) · [`state-machines.md`](../state-machines.md) §9
- **Regra na fonte**: `BR-LEGACY-A10`
- **Confiança original**: 🟢
- **Descrição**: **Modo de recuperação dura uma semana e avisa uma vez por dia.** O cookie vale `WEEK_IN_SECONDS`; o e-mail é limitado a um por dia por sessão e o marcador é gravado **antes** do envio, de modo que falhar na gravação **aborta** o aviso.
- **Justificativa de migração**: Política 6. A ordem (gravar antes de enviar) é a regra, e ela escolhe perder o aviso em vez de arriscar repetição.
- **Compatibilidade com paradigma alvo**: Compatível. É decisão de ordenação dentro de um fluxo síncrono; invertê-la por conveniência de `await` muda o comportamento.
- **Âncora no legado**: `wp-includes/class-wp-recovery-mode-cookie-service.php:46` · `wp-includes/class-wp-recovery-mode.php:307` · `wp-includes/class-wp-recovery-mode-email-service.php:53`

### BR-MIGRAR-055
- **Origem**: [`domain.md`](../domain.md) §2.6
- **Regra na fonte**: `BR-LEGACY-A11`
- **Confiança original**: 🟢
- **Descrição**: **Erro em endpoint público não aciona recuperação.** Só `is_protected_endpoint()`; e erro causado por plugin **de rede** é explicitamente fora de escopo.
- **Justificativa de migração**: Política 6.
- **Compatibilidade com paradigma alvo**: Compatível.
- **Âncora no legado**: `wp-includes/class-wp-recovery-mode.php:172`

### BR-MIGRAR-056
- **Origem**: [`domain.md`](../domain.md) §2.6 · [`permissions.md`](../permissions.md) §4
- **Regra na fonte**: `BR-LEGACY-A12`
- **Confiança original**: 🟢
- **Descrição**: **Sair do modo de recuperação retoma todas as extensões pausadas de uma vez** e zera o limite de e-mail.
- **Justificativa de migração**: Política 6. Depende de `resume_plugins`/`resume_themes`, que **não estão em papel algum** e entram por filtro — ver a regra das 4 capacidades concedidas por filtro.
- **Compatibilidade com paradigma alvo**: Compatível. P3 manda incluir explicitamente as 4 capacidades por filtro: sem elas, ninguém retoma extensão pausada no alvo.
- **Âncora no legado**: `wp-includes/class-wp-recovery-mode.php:206` · `wp-includes/capabilities.php:1325`

### BR-MIGRAR-057
- **Origem**: [`domain.md`](../domain.md) §2.7 · unit [`midia-e-anexos/upload-e-geracao-de-tamanhos`](../midia-e-anexos/upload-e-geracao-de-tamanhos/requirements.md)
- **Regra na fonte**: `BR-LEGACY-M1`
- **Confiança original**: 🟢
- **Descrição**: **Imagem grande é reduzida na ingestão.** Acima de **2560 px** em qualquer dimensão, a imagem servida passa a ser uma cópia com sufixo `-scaled`, e o original fica guardado.
- **Justificativa de migração**: Política 6.
- **Compatibilidade com paradigma alvo**: Compatível.
- **Âncora no legado**: `wp-admin/includes/image.php:285` · `wp-admin/includes/image.php:336`

### BR-MIGRAR-058
- **Origem**: [`domain.md`](../domain.md) §2.7
- **Regra na fonte**: `BR-LEGACY-M2`
- **Confiança original**: 🟢
- **Descrição**: **Quatro tamanhos nascem com o site:** `thumbnail` 150×150, `medium` 300, `medium_large` 768, `large` 1024 — mais `1536x1536` e `2048x2048` registrados em código para telas de alta densidade.
- **Justificativa de migração**: Política 6. Metade vem de opção semeada e metade de código: as duas fontes são a regra.
- **Compatibilidade com paradigma alvo**: Compatível.
- **Âncora no legado**: `wp-admin/includes/schema.php:485` · `wp-includes/media.php:5863`

### BR-MIGRAR-059
- **Origem**: [`domain.md`](../domain.md) §2.7
- **Regra na fonte**: `BR-LEGACY-M3`
- **Confiança original**: 🟢
- **Descrição**: **O `srcset` para em 2048 px**, independente dos tamanhos existentes.
- **Justificativa de migração**: Política 6. É saída HTML observável.
- **Compatibilidade com paradigma alvo**: Decisão 2 põe o HTML de tema sob "comportamento de caso de uso", mas o `srcset` é consumido por navegador de terceiro — na dúvida, tratar como contrato de valor.
- **Âncora no legado**: `wp-includes/media.php:1545`

### BR-MIGRAR-060
- **Origem**: [`domain.md`](../domain.md) §2.7 · [`domain.md`](../domain.md) §4
- **Regra na fonte**: `BR-LEGACY-M4`
- **Confiança original**: 🟢
- **Descrição**: **Falha ao gerar derivada de imagem é silenciosa.** Cinco pontos do processamento têm o comentário `// TODO: Log errors.` e nenhum registro.
- **Justificativa de migração**: Política 6 — a ausência de registro é observável (nada aparece em lugar nenhum) e P19 confirma que não há log a reter. Não é defeito a consertar de ofício: é o mesmo teste de P11 e P12, e ninguém autorizou exceção aqui.
- **Compatibilidade com paradigma alvo**: Compatível. Acrescentar log no alvo não muda saída HTTP nem efeito no banco, logo a Opção 3 **admite** o log como estrutura interna — mas então é decisão registrada, não efeito colateral.
- **Âncora no legado**: `wp-admin/includes/image.php:356` · `wp-admin/includes/image.php:492`

### BR-MIGRAR-061
- **Origem**: [`domain.md`](../domain.md) §2.8 · [`state-machines.md`](../state-machines.md) §7 · unit [`multisite/ciclo-de-vida-do-site-da-rede`](../multisite/ciclo-de-vida-do-site-da-rede/requirements.md)
- **Regra na fonte**: `BR-LEGACY-N1`
- **Confiança original**: 🟢
- **Descrição**: **Quatro estados de supervisão governam o acesso ao site, e o super admin os ignora.** `ms_site_check()` libera super admin antes de qualquer teste.
- **Justificativa de migração**: Política 6 — direito/permissão. P4 mantém multisite no escopo.
- **Compatibilidade com paradigma alvo**: Compatível.
- **Âncora no legado**: `wp-includes/ms-load.php:74`

### BR-MIGRAR-062
- **Origem**: [`domain.md`](../domain.md) §2.8 · [`state-machines.md`](../state-machines.md) §7
- **Regra na fonte**: `BR-LEGACY-N2`
- **Confiança original**: 🟢
- **Descrição**: **`deleted` tem três valores, não dois.** `'1'` = site encerrado (HTTP 410); `'2'` = **ainda não ativado**; `'0'` = normal. O dicionário de dados descreve a coluna como 0/1 — o terceiro valor só aparece aqui.
- **Justificativa de migração**: Política 6, e é uma **correção interna** que o Detetive registrou: quem modelar a coluna como booleana perde o estado "ainda não ativado".
- **Compatibilidade com paradigma alvo**: Compatível. Enumeração sem `ENUM` (`database/business-rules.md` §1): um alvo que declare o tipo como booleano quebra a regra.
- **Âncora no legado**: `wp-includes/ms-load.php:95`

### BR-MIGRAR-063
- **Origem**: [`domain.md`](../domain.md) §2.8
- **Regra na fonte**: `BR-LEGACY-N3`
- **Confiança original**: 🟢
- **Descrição**: **`archived` e `spam` produzem a mesma resposta** — HTTP 410, "arquivado ou suspenso" — e são campos distintos.
- **Justificativa de migração**: Política 6. Dois campos, uma resposta: consolidar os campos muda o efeito no banco.
- **Compatibilidade com paradigma alvo**: Compatível.
- **Âncora no legado**: `wp-includes/ms-load.php:118`

### BR-MIGRAR-064
- **Origem**: [`domain.md`](../domain.md) §2.8
- **Regra na fonte**: `BR-LEGACY-N4`
- **Confiança original**: 🟢
- **Descrição**: **Cada estado de site tem gancho de entrada e de saída** (`make_spam_blog`/`unspam_blog`, `archive_blog`/`unarchive_blog`, `mature_blog`/`unmature_blog`), e a comparação é feita campo a campo na atualização.
- **Justificativa de migração**: Política 6. Os 6 ganchos são contrato de extensão (implicação 1).
- **Compatibilidade com paradigma alvo**: Compatível. A comparação campo a campo é o que decide qual gancho dispara — não há `publish` de "site mudou".
- **Âncora no legado**: `wp-includes/ms-site.php:541` · `wp-includes/ms-site.php:1174`

### BR-MIGRAR-065
- **Origem**: [`domain.md`](../domain.md) §2.8
- **Regra na fonte**: `BR-LEGACY-N5`
- **Confiança original**: 🟢
- **Descrição**: **Nome de site exige no mínimo 4 caracteres** e herda a lista de nomes proibidos, somada aos nomes reservados de subdiretório.
- **Justificativa de migração**: Política 6. P4 fixa subdiretório como modo padrão, logo a lista de reservados é parte do contrato.
- **Compatibilidade com paradigma alvo**: Compatível.
- **Âncora no legado**: `wp-includes/ms-functions.php:648`

### BR-MIGRAR-066
- **Origem**: [`domain.md`](../domain.md) §2.8 · [`permissions.md`](../permissions.md) §7
- **Regra na fonte**: `BR-LEGACY-N6`
- **Confiança original**: 🟢
- **Descrição**: **Criar usuário na rede é permissão de rede, salvo opção explícita.** `create_users` só passa para quem não é super admin se `add_new_users` estiver ligada.
- **Justificativa de migração**: Política 6 — direito/permissão.
- **Compatibilidade com paradigma alvo**: Compatível.
- **Âncora no legado**: `wp-includes/capabilities.php:682`

### BR-MIGRAR-067
- **Origem**: [`domain.md`](../domain.md) §2.8 · [ADR-0001](../adrs/0001-papeis-como-dado-mutavel-nao-como-codigo.md)
- **Regra na fonte**: `BR-LEGACY-N7`
- **Confiança original**: 🟢
- **Descrição**: **Criar o conjunto de tabelas de um site novo repovoa os papéis** a partir do código — é o único momento, fora da instalação e da atualização, em que a definição de papel é reescrita.
- **Justificativa de migração**: Política 6, com ADR-0001. Os três gatilhos de `populate_roles()` são a regra.
- **Compatibilidade com paradigma alvo**: Compatível. Ver a regra "papel é dado mutável": depois dos três gatilhos, a opção é a verdade e o código deixa de ser.
- **Âncora no legado**: `wp-includes/ms-site.php:743` · `wp-admin/includes/upgrade.php:80`

### BR-MIGRAR-068
- **Origem**: [`domain.md`](../domain.md) §2.9 · [ADR-0012](../adrs/0012-credencial-de-conector-fora-do-banco.md) · unit [`connectors`](../connectors/requirements.md)
- **Regra na fonte**: `BR-LEGACY-I1`
- **Confiança original**: 🟢
- **Descrição**: **Credencial de conector tem precedência: variável de ambiente → constante PHP → banco.** Se a chave está no ambiente, o valor do banco é ignorado. É inversão do hábito do produto, que sempre guardou configuração em `options`.
- **Justificativa de migração**: Política 6, com ADR-0012.
- **Compatibilidade com paradigma alvo**: Compatível, e é o único ponto da árvore em que segredo não nasce no banco — a precedência tem de ser declarada no alvo, não emergir da ordem de carregamento.
- **Âncora no legado**: `wp-includes/connectors.php:444`

### BR-MIGRAR-069
- **Origem**: [`domain.md`](../domain.md) §2.9
- **Regra na fonte**: `BR-LEGACY-I2`
- **Confiança original**: 🟢
- **Descrição**: **Credencial de conector pode ser `usuario:senha`**, dividida no **primeiro** dois-pontos para que a senha possa conter dois-pontos; com qualquer das metades vazia, as duas voltam vazias.
- **Justificativa de migração**: Política 6. As duas sutilezas (primeiro separador, e o tudo-ou-nada) são a regra.
- **Compatibilidade com paradigma alvo**: Compatível. Função pura de string — tradução direta.
- **Âncora no legado**: `wp-includes/connectors.php:483`

### BR-MIGRAR-070
- **Origem**: [`domain.md`](../domain.md) §2.9 · [`questions.md`](../questions.md) Pergunta 13
- **Regra na fonte**: `BR-LEGACY-I3`
- **Confiança original**: 🟢
- **Descrição**: **O Akismet é registrado como conector de filtragem de spam** no núcleo, com `wordpress_api_key` como opção e `WPCOM_API_KEY` como constante.
- **Justificativa de migração**: Política 6. O **registro** vive em `wp-includes/connectors.php`, que é núcleo, e portanto migra — ainda que a implementação do Akismet esteja fora de escopo (ver `discard_log.md`).
- **Compatibilidade com paradigma alvo**: Compatível. Distinção que um porte apressado perde: o registro do conector é núcleo, o classificador é extensão.
- **Âncora no legado**: `wp-includes/connectors.php:239`

### BR-MIGRAR-071
- **Origem**: [`domain.md`](../domain.md) §2.9 · [`permissions.md`](../permissions.md) §8 camada 3 · unit [`abilities-api/execucao-de-ability`](../abilities-api/execucao-de-ability/requirements.md)
- **Regra na fonte**: `BR-LEGACY-I4`
- **Confiança original**: 🟢
- **Descrição**: **Toda *ability* exige retorno de permissão, e a falta de callback é erro — não liberação.** `check_permissions()` devolve `WP_Error` se o callback não for chamável.
- **Justificativa de migração**: Política 6 — direito/permissão. É a única das três camadas de autorização que falha **fechada**.
- **Compatibilidade com paradigma alvo**: Compatível. P18 manda portar a Abilities API como o núcleo a traz: contrato para agente externo, com `permission_callback` próprio e filtrável.
- **Âncora no legado**: `wp-includes/abilities-api/class-wp-ability.php:623`

### BR-MIGRAR-072
- **Origem**: [`domain.md`](../domain.md) §2.9 · [ADR-0011](../adrs/0011-autorizacao-propria-para-agente-de-ia.md)
- **Regra na fonte**: `BR-LEGACY-I5`
- **Confiança original**: 🟢
- **Descrição**: **A autorização de *ability* é filtrável, inclusive para conceder.** O filtro `wp_ability_permission_result` (`@since 7.1.0`) recebe o resultado e pode trocar negação por permissão; o docblock cita "elevação temporária de permissão para contextos confiáveis" como caso de uso. Retorno que não seja `bool` nem `WP_Error` é coagido a `false`.
- **Justificativa de migração**: Política 6, com ADR-0011. Concessão por filtro é **caso de uso declarado**, não brecha acidental.
- **Compatibilidade com paradigma alvo**: ⚠️ É um dos 2.460 pontos que devolvem valor, e aqui o valor devolvido é uma **decisão de autorização**. Decisão 2: valor devolvido por hook é contrato byte a byte.
- **Âncora no legado**: `wp-includes/abilities-api/class-wp-ability.php:634`

### BR-MIGRAR-073
- **Origem**: [`domain.md`](../domain.md) §2.9
- **Regra na fonte**: `BR-LEGACY-I6`
- **Confiança original**: 🟢
- **Descrição**: **A execução de *ability* pode ser curto-circuitada antes de qualquer validação** — e o docblock avisa que, nesse caminho, a integridade do insumo é responsabilidade de quem curto-circuitou.
- **Justificativa de migração**: Política 6. O curto-circuito contorna normalização, validação, permissão, execução e validação de saída: cinco etapas de uma vez.
- **Compatibilidade com paradigma alvo**: ⚠️ Curto-circuito por filtro é mecanismo do barramento síncrono. Em coreografia de eventos não existe "antes de tudo". Fica síncrono, como a Opção 3 declara.
- **Âncora no legado**: `wp-includes/abilities-api/class-wp-ability.php:787`

### BR-MIGRAR-074
- **Origem**: [`domain.md`](../domain.md) §2.9 · [`permissions.md`](../permissions.md) §8 camada 2 · unit [`rest-api/despacho-de-requisicao-rest`](../rest-api/despacho-de-requisicao-rest/requirements.md)
- **Regra na fonte**: `BR-LEGACY-I7`
- **Confiança original**: 🟢
- **Descrição**: **Toda rota REST deve declarar permissão explícita** — e rota sem `permission_callback` **funciona**, emitindo apenas aviso de uso indevido desde a 5.5.0. O texto do aviso ensina a declarar `__return_true` para rota pública.
- **Justificativa de migração**: Política 6 para o contrato declarado ("toda rota deve declarar"). O **default que falha aberta** é item de DECISÃO HUMANA própria (ver BR-HUMANA): nenhuma das 23 perguntas o cobriu, embora três perguntas da mesma classe tenham sido feitas (P6, P11, P12).
- **Compatibilidade com paradigma alvo**: Compatível. O aviso que ensina `__return_true` é parte do contrato documentado para quem estende.
- **Âncora no legado**: `wp-includes/rest-api.php:122`

### BR-MIGRAR-075
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §1 · unit [`opcoes-e-metadados`](../opcoes-e-metadados/requirements.md)
- **Regra na fonte**: `BR-LEGACY-DB-ENUM`
- **Confiança original**: 🟢
- **Descrição**: **Toda enumeração do modelo vive em `varchar(20)` sem `ENUM` e sem `CHECK`.** `posts.post_status` (default `'publish'`), `comments.comment_approved` (default `'1'`, e aceita `'0'`, `'1'`, `'spam'`, `'trash'`), `comments.comment_type` (default `'comment'`) e `options.autoload` (sete valores, que são classificação de carregamento e não ciclo de vida).
- **Justificativa de migração**: Política 6. O domínio de valores é código, não schema — e extensões registram status adicionais por `register_post_status()`, logo o conjunto documentado é **piso, não teto** (S2).
- **Compatibilidade com paradigma alvo**: Declarar `ENUM` ou união fechada de tipos no alvo **quebra** a extensibilidade que P3 chama de produto. A tipagem do TypeScript é ganho de estrutura interna só se o conjunto permanecer aberto em tempo de execução.
- **Âncora no legado**: `wp-admin/includes/schema.php:167` · `wp-admin/includes/schema.php:112` · `wp-admin/includes/schema.php:114` · `wp-admin/includes/schema.php:145`

### BR-MIGRAR-076
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §2
- **Regra na fonte**: `BR-LEGACY-DB-UNIQ`
- **Confiança original**: 🟢
- **Descrição**: **Só três garantias de unicidade existem no banco** (`options.option_name`, `term_taxonomy(term_id,taxonomy)`, a chave primária de `term_relationships`). Todas as outras são verificação de código, sujeitas a corrida: login, e-mail, slug de post, slug de termo, `signups.activation_key` (que não é verificada por nada) e `sitemeta.meta_key`. E `options.option_name` é `varchar(191)` — a única coluna cujo tipo foi **encurtado para viabilizar a constraint** sob `utf8mb4`.
- **Justificativa de migração**: Política 6. Saber o que o banco garante e o que ele não garante é pré-requisito para não "consertar" o modelo por acidente.
- **Compatibilidade com paradigma alvo**: ⚠️ Acrescentar `UNIQUE` no alvo fecha corridas reais — e muda o efeito no banco, que a Decisão 2 põe no contrato. Se for feito, é decisão registrada por coluna, não varredura.
- **Âncora no legado**: `wp-admin/includes/schema.php:143` · `wp-includes/post.php:5560`

### BR-MIGRAR-077
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §3.1 · unit [`comentarios`](../comentarios/requirements.md)
- **Regra na fonte**: `BR-LEGACY-DB-TRG1`
- **Confiança original**: 🟢
- **Descrição**: **O contador de comentários é recalculado em PHP e pode ser suspenso.** `COUNT(*)` de `comment_approved = '1'` e `comment_type <> 'note'`; `wp_defer_comment_counting( true )` desliga o recálculo durante lotes — é o que `wp_delete_post()` faz. **Entre o início e o fim do lote, `comment_count` está errado no banco.**
- **Justificativa de migração**: Política 6, e o mandato do paradigma (implicação 8) manda marcar os contadores desnormalizados como **comportamento observável**, não dívida de modelagem.
- **Compatibilidade com paradigma alvo**: ⚠️ Nenhum *trigger* faria isso, e nenhuma *view materializada* reproduz a janela de inconsistência. A janela é observável por leitura concorrente — e não há teste que a exercite (implicação 2).
- **Âncora no legado**: `wp-includes/comment.php:3106` · `wp-includes/comment.php:3138` · `wp-includes/post.php:3925`

### BR-MIGRAR-078
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §3.2 · unit [`taxonomias-e-termos`](../taxonomias-e-termos/requirements.md)
- **Regra na fonte**: `BR-LEGACY-DB-TRG2`
- **Confiança original**: 🟢
- **Descrição**: **A mesma coluna `term_taxonomy.count` tem pelo menos duas definições de "quantos".** `_update_post_term_count()` conta só `post_status = 'publish'` e faz **anexo contar pelo status do pai**; `_update_generic_term_count()` é `COUNT(*)` sem filtro. E a taxonomia pode declarar `update_count_callback` próprio.
- **Justificativa de migração**: Política 6. É o contador cuja regra depende de **quem registrou a taxonomia** — o caso que mais facilmente se unifica por engano.
- **Compatibilidade com paradigma alvo**: ⚠️ Implementar como *view* exige duas views, ou um `CASE` sobre a taxonomia. E o terceiro caminho (callback de quem registra) não é expressável em SQL de jeito nenhum.
- **Âncora no legado**: `wp-includes/taxonomy.php:4193` · `wp-includes/taxonomy.php:4272` · `wp-includes/taxonomy.php:3629`

### BR-MIGRAR-079
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §3.3 · [`domain.md`](../domain.md) §2.4
- **Regra na fonte**: `BR-LEGACY-DB-TRG3`
- **Confiança original**: 🟢
- **Descrição**: **Apagar reposiciona os filhos em vez de apagá-los.** Post hierárquico, anexo do post, comentário e termo hierárquico têm o pai trocado pelo **avô**. Revisões, essas sim, são apagadas recursivamente.
- **Justificativa de migração**: Política 6, e mandato do paradigma (implicação 8): a cascata que **reparenteia** é comportamento observável.
- **Compatibilidade com paradigma alvo**: ⚠️ **`ON DELETE CASCADE` ingênuo no destino muda o produto**: página filha e anexo passariam a desaparecer com o pai. `architecture.md` §6 registra isto, e a Pergunta 2 confirma: qualquer chave que o modelo novo declare não pode mudar o que é observável.
- **Âncora no legado**: `wp-includes/post.php:3908` · `wp-includes/post.php:3923` · `wp-includes/post.php:3913` · `wp-includes/comment.php:1590` · `wp-includes/taxonomy.php:2132`

### BR-MIGRAR-080
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §3.4
- **Regra na fonte**: `BR-LEGACY-DB-TRG4`
- **Confiança original**: 🟢
- **Descrição**: **Apagar um termo devolve o objeto ao termo padrão, se aquele era o único.** Cada objeto vinculado é reprocessado: se era o único termo do objeto naquela taxonomia e a taxonomia tem termo padrão (`default_category`, semeada com `1`), o objeto recebe o padrão; senão perde só aquele termo.
- **Justificativa de migração**: Política 6. A fonte chama esta de "a regra de negócio mais claramente de domínio em todo o modelo de dados — e é inexpressável em DDL".
- **Compatibilidade com paradigma alvo**: Compatível, e é o par de P3 (publicação): as duas metades da mesma invariante, uma na escrita e outra na exclusão.
- **Âncora no legado**: `wp-includes/taxonomy.php:2152`

### BR-MIGRAR-081
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §4
- **Regra na fonte**: `BR-LEGACY-DB-SENT`
- **Confiança original**: 🟢
- **Descrição**: **O schema evita `NULL` e usa sentinelas que nenhuma constraint distingue de valor legítimo:** `0` em coluna de referência significa "sem vínculo" (logo `WHERE pai IS NULL` nunca acusa órfão), `''` significa "ausente" em `post_name`, `post_password`, `user_activation_key` e `signups.domain`, e `links.link_owner` nasce `'1'` pressupondo que o usuário 1 existe.
- **Justificativa de migração**: Política 6. É o vocabulário de valores do modelo, e lê-lo errado produz consultas que nunca encontram nada.
- **Compatibilidade com paradigma alvo**: ⚠️ O sentinela de data `'0000-00-00 00:00:00'` é tratado à parte, em **DECISÃO HUMANA**: é a maior incompatibilidade do schema com qualquer banco moderno e a escolha muda a semântica de "rascunho sem data".
- **Âncora no legado**: `wp-admin/includes/schema.php:132` · `wp-admin/includes/schema.php:170`

### BR-MIGRAR-082
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §5 · [`permissions.md`](../permissions.md) §1 fato 2
- **Regra na fonte**: `BR-LEGACY-DB-SER`
- **Confiança original**: 🟢
- **Descrição**: **Quatro famílias de coluna `longtext` guardam estrutura PHP serializada** — opções, as quatro tabelas de meta, `sitemeta`/`blogmeta` e `signups.meta`. A regra de `maybe_serialize()`: array e objeto são serializados, **e uma string que já pareça serializada é serializada de novo**, por compatibilidade retroativa. Consequências: nenhuma consulta SQL filtra o conteúdo de forma confiável, nenhum índice ajuda, e **toda a camada de permissão mora aqui**.
- **Justificativa de migração**: Política 6. A dupla serialização é **observável**: gravar a string `'a:1:{i:0;s:1:"b";}'` e lê-la de volta devolve a string, não o array. Um alvo que troque o formato sem reproduzir essa regra muda o valor devolvido ao chamador.
- **Compatibilidade com paradigma alvo**: ⚠️ `database/business-rules.md` §5 chama isto de "o item mais custoso de qualquer reescrita deste modelo". Trocar PHP-serialize por JSON é mudança de **efeito no banco**, que a Decisão 2 põe no contrato; a Pergunta 2 alivia o custo (instalação nova, sem dado a migrar) mas **não** o contrato.
- **Âncora no legado**: `wp-includes/functions.php:628` · `wp-includes/class-wp-user.php:882`

### BR-MIGRAR-083
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §6
- **Regra na fonte**: `BR-LEGACY-DB-DEG`
- **Confiança original**: 🟢
- **Descrição**: **Escrita inválida não falha, ela se degrada.** A camada `wpdb` trunca pelo tamanho real da coluna, **remove** caractere que o charset não comporta, e coage o formato conforme `%d`/`%f`/`%s`. Tudo em silêncio.
- **Justificativa de migração**: Política 6. É a regra implícita de todo o sistema, e a exceção declarada é C10 (comentário devolve `WP_Error`).
- **Compatibilidade com paradigma alvo**: ⚠️ **Um destino com constraints estritas rejeita escritas que o legado aceitava deformadas.** Isso é mudança de efeito no banco e de resposta ao chamador: entra no contrato da Decisão 2 e precisa de decisão por coluna, não de default do driver.
- **Âncora no legado**: `wp-includes/class-wpdb.php:2993` · `wp-includes/class-wpdb.php:3823` · `wp-includes/class-wpdb.php:2879`

### BR-MIGRAR-084
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §7 · [`domain.md`](../domain.md) §3
- **Regra na fonte**: `BR-LEGACY-DB-SEED`
- **Confiança original**: 🟢
- **Descrição**: **O schema vazio não é funcional: parte da regra está nas linhas que o instalador cria.** `populate_options()` semeia ~150 linhas (incluindo `db_version`, `default_category = 1`, `default_comment_status = 'open'`, `default_role = 'subscriber'`, `posts_per_page = 10`, `thread_comments_depth = 5`), `populate_roles()` grava os 5 papéis **na opção** `{prefixo}user_roles`, `wp_install_defaults()` cria o termo "Uncategorized", o post "Hello world!", a página de exemplo, a política de privacidade e o primeiro comentário, e `populate_network*()` cria a rede e suas metas.
- **Justificativa de migração**: Política 6, e a Pergunta 1 é categórica: **o default do código É a especificação**, porque o alvo é a distribuição oficial limpa e não existe instância cujo comportamento possa divergir dele.
- **Compatibilidade com paradigma alvo**: Compatível, e é a resposta à maior causa de lacuna da análise (279 lacunas de "valor de opção ou constante"): o porte documenta e reproduz o valor de fábrica, nomeando o ponto de filtro que o altera em execução.
- **Âncora no legado**: `wp-admin/includes/schema.php:362` · `wp-admin/includes/schema.php:750` · `wp-admin/includes/upgrade.php:188` · `wp-admin/includes/schema.php:1005`

### BR-MIGRAR-085
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §8
- **Regra na fonte**: `BR-LEGACY-DB-MIG`
- **Confiança original**: 🟢
- **Descrição**: **O sistema é sua própria ferramenta de migração, por comparação de estrutura.** `dbDelta()` compara o DDL desejado com o `DESCRIBE`/`SHOW INDEX` real e emite só os `ALTER TABLE` necessários; `upgrade_*()` cuida de dados. Três propriedades: **não há rollback** (só avança), **o histórico não é reprodutível a partir do banco** (só a opção `db_version` diz onde a instalação está, não há tabela de migrações aplicadas), e **a estrutura real pode divergir do DDL** porque coluna criada por extensão permanece e não aparece em `wp_get_db_schema()` — o DDL é o piso, não o retrato.
- **Justificativa de migração**: Política 6. É arquitetura de migração com efeito observável: adotar Flyway/Prisma Migrate no alvo introduz tabela de histórico e rollback que o produto **não tem**.
- **Compatibilidade com paradigma alvo**: ⚠️ Os **38 portões históricos** de `upgrade_all()` (db_version 2541→61644) são caso separado e estão em `discard_log.md`: numa instalação nova não há dado de versões 1.0–7.0 a transformar. O **mecanismo** migra; o **histórico** não.
- **Âncora no legado**: `wp-admin/includes/schema.php:36` · `wp-admin/includes/upgrade.php:2936` · `wp-admin/includes/upgrade.php:715`

### BR-MIGRAR-086
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §10 item 6 · [`state-machines.md`](../state-machines.md) §10 · [`questions.md`](../questions.md) Pergunta 7
- **Regra na fonte**: `BR-LEGACY-DB-DEAD`
- **Confiança original**: 🟡
- **Descrição**: **`users.user_status` e `comments.comment_karma` existem no schema e o núcleo nunca escreve nada além de `0`.** `wp_links.link_visible` é visibilidade de um recurso que o próprio sistema desliga quando a tabela está vazia.
- **Justificativa de migração**: Política 5 — 🟡 INFERIDA, compatível com o alvo, **migra com aviso para validação no agente de codificação**. O precedente é explícito: a Pergunta 7 manda portar duas funções definidas e sem nenhum chamador, porque "existir sem ser chamada é parte do que se clona".
- **Compatibilidade com paradigma alvo**: Compatível. A Decisão 2 põe **esquema** no contrato por área, logo as colunas mortas entram. Se houver valor diferente de zero numa instalação real, é regra de extensão que esta árvore não contém (L6).
- **Âncora no legado**: `wp-admin/includes/schema.php:201` · `wp-admin/includes/schema.php:111`

### BR-MIGRAR-087
- **Origem**: [`permissions.md`](../permissions.md) §1 fatos 1 e 4 · unit [`capacidades-e-papeis/verificacao-de-capacidade`](../capacidades-e-papeis/verificacao-de-capacidade/requirements.md)
- **Regra na fonte**: `BR-LEGACY-PERM-1`
- **Confiança original**: 🟢
- **Descrição**: **O papel é um atalho; a capacidade é a unidade real.** `allcaps` funde as capacidades de **cada** papel do usuário e sobrepõe as individuais; um usuário pode ter vários papéis, ou capacidade sem papel nenhum. É necessário ter **todas** as capacidades devolvidas, não qualquer uma. Duas são sintéticas: `exist` é concedida a todo mundo e **`do_not_allow` é removida de `allcaps` antes da comparação**, de modo que ninguém pode tê-la.
- **Justificativa de migração**: Política 6 — direito/permissão, que a rubrica proíbe descartar por paradigma.
- **Compatibilidade com paradigma alvo**: Compatível. `do_not_allow` como capacidade que ninguém pode ter é mecanismo de negação **inegociável**: é o único que vence o super admin.
- **Âncora no legado**: `wp-includes/class-wp-user.php:533` · `wp-includes/class-wp-user.php:833` · `wp-includes/class-wp-user.php:827` · `wp-includes/class-wp-user.php:830`

### BR-MIGRAR-088
- **Origem**: [`permissions.md`](../permissions.md) §1 fato 2 · §10 pegadinha 5
- **Regra na fonte**: `BR-LEGACY-PERM-2`
- **Confiança original**: 🟢
- **Descrição**: **A autorização mora num metadado serializado, por site.** A chave é `{prefixo_do_site}capabilities` em `wp_usermeta` e a definição dos papéis é a **opção** `{prefixo}user_roles`. Consequência direta: **nenhuma consulta SQL responde "quem é administrador aqui"** — exigiria `LIKE` sobre texto serializado. Em multisite, trocar de site troca a chave.
- **Justificativa de migração**: Política 6 — direito/permissão. A Pergunta 4 confirma: o vínculo conta↔site dentro do nome da `meta_key` é **regra observável**.
- **Compatibilidade com paradigma alvo**: ⚠️ A Pergunta 4 autoriza explicitamente normalizar o armazenamento **por baixo**, preservando o comportamento. É o exemplo canônico da fronteira da Opção 3 — e a única área em que uma resposta humana admite trocar a estrutura.
- **Âncora no legado**: `wp-includes/class-wp-user.php:882` · `wp-includes/class-wp-user.php:513`

### BR-MIGRAR-089
- **Origem**: [`permissions.md`](../permissions.md) §1 fato 3 · §5
- **Regra na fonte**: `BR-LEGACY-PERM-3`
- **Confiança original**: 🟢
- **Descrição**: **Capacidade sobre objeto não é verificada direto: é traduzida.** `map_meta_cap()` devolve a **lista de capacidades primitivas** necessárias, em 86 `case`. `edit_post` é a mais verificada do sistema (104 chamadas) e **nenhuma** delas pergunta por `edit_post`: todas perguntam pelo que o mapeamento devolveu. A decisão depende de **quem é o autor** e de **em que estado o conteúdo está**.
- **Justificativa de migração**: Política 6 — direito/permissão, e é o lugar onde mora a regra de negócio da autorização.
- **Compatibilidade com paradigma alvo**: Compatível. Os 86 casos são uma função pura de (capacidade, usuário, objeto) → lista de capacidades: tradução direta para o alvo, e um dos poucos pontos em que o alvo funcional é ganho sem risco.
- **Âncora no legado**: `wp-includes/capabilities.php:45` · `wp-includes/capabilities.php:149`

### BR-MIGRAR-090
- **Origem**: [`permissions.md`](../permissions.md) §5.3
- **Regra na fonte**: `BR-LEGACY-PERM-4`
- **Confiança original**: 🟢
- **Descrição**: **No mapeamento de capacidade, todo caminho de erro fecha a porta.** Três ramos tratam tipo ou status **não registrado** e todos degradam para a capacidade **mais alta**, `edit_others_posts`, com aviso. No resto do sistema, caminho de erro degrada para **menos** garantia.
- **Justificativa de migração**: Política 6. A fonte diz textualmente: "é a distinção que um porte precisa preservar".
- **Compatibilidade com paradigma alvo**: Compatível, e é a inversão mais fácil de perder: um alvo com tratamento de erro uniforme degradaria para menos garantia **aqui também**, abrindo a porta.
- **Âncora no legado**: `wp-includes/capabilities.php:135` · `wp-includes/capabilities.php:337` · `wp-includes/capabilities.php:365`

### BR-MIGRAR-091
- **Origem**: [`permissions.md`](../permissions.md) §5.2
- **Regra na fonte**: `BR-LEGACY-PERM-5`
- **Confiança original**: 🟢
- **Descrição**: **Onze negações absolutas e proteções de objeto**, entre elas: verificar capacidade de post **sem informar o objeto** devolve `do_not_allow`; o objeto inexistente, idem; **revisão não se apaga por capacidade**; página inicial e página de posts exigem `manage_options`; o **termo padrão da taxonomia é indestrutível**; comentário cujo post não existe mais cai em `edit_posts`; `delete_site` fora de multisite não existe.
- **Justificativa de migração**: Política 6 — direitos. Cada uma é uma porta que o alvo tem de fechar explicitamente.
- **Compatibilidade com paradigma alvo**: Compatível. Negação por ausência de argumento é padrão que um alvo com tipos obrigatórios tornaria impossível de alcançar — e o aviso de uso indevido deixaria de existir, o que é observável por quem estende.
- **Âncora no legado**: `wp-includes/capabilities.php:83` · `wp-includes/capabilities.php:103` · `wp-includes/capabilities.php:108` · `wp-includes/capabilities.php:113` · `wp-includes/capabilities.php:738` · `wp-includes/capabilities.php:701`

### BR-MIGRAR-092
- **Origem**: [`permissions.md`](../permissions.md) §5.4
- **Regra na fonte**: `BR-LEGACY-PERM-6`
- **Confiança original**: 🟢
- **Descrição**: **Dez atalhos de nomenclatura resolvem uma capacidade em outra** — `customize` → `edit_theme_options`, cinco nomes de taxonomia → `manage_categories`, `upload_themes` → `install_themes`, as seis capacidades de senha de aplicação → `edit_user` daquele usuário, `edit_block_binding` → `edit_post` do contexto (ou `edit_theme_options` no editor de site, ou `do_not_allow` sem contexto). E **`edit_user` sobre si mesmo devolve lista vazia, o que significa permitido.**
- **Justificativa de migração**: Política 6 — direitos. A lista vazia que significa "permitido" é a pegadinha nº 2 de `permissions.md`: um alvo que trate lista vazia como negação tranca todo mundo fora do próprio perfil.
- **Compatibilidade com paradigma alvo**: Compatível.
- **Âncora no legado**: `wp-includes/capabilities.php:698` · `wp-includes/capabilities.php:751` · `wp-includes/capabilities.php:70` · `wp-includes/capabilities.php:808`

### BR-MIGRAR-093
- **Origem**: [`permissions.md`](../permissions.md) §4 · [`questions.md`](../questions.md) Pergunta 3
- **Regra na fonte**: `BR-LEGACY-PERM-7`
- **Confiança original**: 🟢
- **Descrição**: **Quatro capacidades que o código exige não estão em papel algum**: `install_languages`, `resume_plugins`, `resume_themes` e `view_site_health_checks` são injetadas em `allcaps` por filtros registrados com prioridade `1` — isto é, **antes de qualquer extensão**. A derivação é parte do modelo.
- **Justificativa de migração**: Política 6, e a Pergunta 3 manda **incluí-las explicitamente**: "quem portar lendo só a matriz de papéis produz um sistema onde ninguém retoma extensão pausada".
- **Compatibilidade com paradigma alvo**: Compatível. A prioridade `1` é parte da regra: o alvo precisa de um ponto de injeção que rode antes dos pontos de extensão de terceiro.
- **Âncora no legado**: `wp-includes/default-filters.php:771` · `wp-includes/capabilities.php:1309` · `wp-includes/capabilities.php:1331` · `wp-includes/capabilities.php:1356`

### BR-MIGRAR-094
- **Origem**: [`permissions.md`](../permissions.md) §6
- **Regra na fonte**: `BR-LEGACY-PERM-8`
- **Confiança original**: 🟢
- **Descrição**: **Quatro constantes retiram poder de quem já o tem**, inclusive administrador e super admin: `DISALLOW_UNFILTERED_HTML`, `DISALLOW_FILE_EDIT`, `DISALLOW_FILE_MODS`, e a inversa `ALLOW_UNFILTERED_UPLOADS` (sem ela, `unfiltered_upload` é sempre negada mesmo a quem a tem concedida). É o único mecanismo do sistema que funciona assim.
- **Justificativa de migração**: Política 6 — direitos. P1 manda portar pelo valor de fábrica (todas indefinidas) nomeando o ponto que as altera.
- **Compatibilidade com paradigma alvo**: Compatível. Revogação que vence concessão exige ordem de avaliação declarada no alvo — não pode ser "mais um filtro".
- **Âncora no legado**: `wp-includes/capabilities.php:594` · `wp-includes/capabilities.php:605` · `wp-includes/capabilities.php:587` · `wp-includes/capabilities.php:611`

### BR-MIGRAR-095
- **Origem**: [`permissions.md`](../permissions.md) §1 fato 5 · §7 · [ADR-0009](../adrs/0009-negacao-explicita-que-vence-o-super-admin.md)
- **Regra na fonte**: `BR-LEGACY-PERM-9`
- **Confiança original**: 🟢
- **Descrição**: **Em multisite o super admin recebe tudo, menos o negado explicitamente** — e a verificação acontece **antes** do filtro `user_has_cap`, logo extensão nenhuma lhe retira poder por ali; só `do_not_allow` dentro de `map_meta_cap()` o detém. "Super admin" **não é capacidade**: é nome de login numa lista de rede. E **fora de multisite a mesma função usa outra definição**: quem tem `delete_users`.
- **Justificativa de migração**: Política 6, com ADR-0009. A mesma função com dois modelos é o tipo de detalhe que um porte unifica por engano.
- **Compatibilidade com paradigma alvo**: Compatível. A ordem (super admin antes do filtro) é a regra, não acidente de implementação.
- **Âncora no legado**: `wp-includes/class-wp-user.php:796` · `wp-includes/capabilities.php:1188` · `wp-includes/capabilities.php:1193`

### BR-MIGRAR-096
- **Origem**: [`permissions.md`](../permissions.md) §7
- **Regra na fonte**: `BR-LEGACY-PERM-10`
- **Confiança original**: 🟡
- **Descrição**: **Em rede, o administrador de um site é "um editor com configuração":** mantém conteúdo, comentário e opções do site e **perde** arquivo, extensão, identidade, idioma e HTML bruto. Nove capacidades são **só** de rede (`create_sites`, `delete_sites`, `manage_network`, `manage_sites`, `manage_network_users`, `manage_network_plugins`, `manage_network_themes`, `manage_network_options`, `upgrade_network`) e não são concedidas a papel algum.
- **Justificativa de migração**: Política 5 — o recorte é 🟡 (coerência inferida), migra com aviso para validação. A fonte avisa: "quem reimplementar multisite precisa replicar o recorte, não só a tabela de sites".
- **Compatibilidade com paradigma alvo**: Compatível. P4 mantém multisite como capacidade do produto, logo o recorte entra.
- **Âncora no legado**: `wp-includes/capabilities.php:762` · `wp-includes/capabilities.php:613` · `wp-includes/capabilities.php:673`

### BR-MIGRAR-097
- **Origem**: [`permissions.md`](../permissions.md) §8 · [`use-cases/UC-46-executar-ability.md`](../use-cases/UC-46-executar-ability.md)
- **Regra na fonte**: `BR-LEGACY-PERM-11`
- **Confiança original**: 🟢
- **Descrição**: **Três camadas paralelas de autorização, cada uma com sua própria falha padrão:** capacidades (sempre pergunta explícita), `permission_callback` do REST (falha **aberta**) e `permission_callback` da Abilities API (falha **fechada**, mas filtrável para conceder). **CORREÇÃO:** `permissions.md` §8.1 e a lacuna P7 afirmam que nenhuma *ability* está registrada nesta árvore — são **cinco**, três do núcleo (`core/get-site-info`, `core/get-user-info`, `core/get-environment-info`) e duas do Akismet, todas com `permission_callback`.
- **Justificativa de migração**: Política 6 — direitos. O catálogo de casos de uso apurou a correção e ela é incorporada aqui para não viver só num artefato que quem lê o outro não abre (padrão de falha A-04).
- **Compatibilidade com paradigma alvo**: Compatível. As 3 *abilities* do núcleo migram (P18); as 2 do Akismet estão em `discard_log.md`, por escopo.
- **Âncora no legado**: `wp-includes/abilities.php:90` · `wp-includes/abilities.php:207` · `wp-includes/abilities.php:294` · `wp-includes/default-filters.php:553`

### BR-MIGRAR-098
- **Origem**: [`permissions.md`](../permissions.md) §9
- **Regra na fonte**: `BR-LEGACY-PERM-12`
- **Confiança original**: 🟢
- **Descrição**: **Cinco pontos decidem acesso sem consultar o modelo de capacidades:** senha de post (sem prazo verificado, texto claro, comparação literal), *nonce* (12 a 24 h, aceita o *tick* anterior, HMAC-MD5 por padrão), chave de reset de senha (24 h, apagada no primeiro login), chave de confirmação de solicitação (24 h, com *hash*) e chave de modo de recuperação (**consumida antes de ser verificada**, ADR-0007). Uma matriz que ignore estes cinco descreve um sistema **mais fechado do que o real**.
- **Justificativa de migração**: Política 6 — direitos. O catálogo de casos de uso reforça: cinco casos de uso não são autorizados por capacidade alguma, e "quem portar lendo `permissions.md` produz um sistema mais fechado do que o legado".
- **Compatibilidade com paradigma alvo**: Compatível. A chave consumida antes de verificada (ADR-0007) é decisão registrada, não defeito — e é exatamente o tipo de passo que um adaptador bem escrito inverteria por acidente.
- **Âncora no legado**: `wp-includes/pluggable.php:2454` · `wp-includes/user.php:3204` · `wp-includes/user.php:5067` · `wp-includes/class-wp-recovery-mode-key-service.php:91`

### BR-MIGRAR-099
- **Origem**: [`permissions.md`](../permissions.md) §10 pegadinhas 3 e 4 · [ADR-0001](../adrs/0001-papeis-como-dado-mutavel-nao-como-codigo.md) · [`questions.md`](../questions.md) Pergunta 5
- **Regra na fonte**: `BR-LEGACY-PERM-13`
- **Confiança original**: 🟢
- **Descrição**: **A definição de papel é um retrato tirado na instalação.** `populate_roles()` só roda ao instalar, ao atualizar e ao criar site de rede; depois disso a opção `{prefixo}user_roles` é a verdade e **o código deixa de ser**.
- **Justificativa de migração**: Política 6, com ADR-0001, e a Pergunta 5 crava: assumir a matriz de fábrica como a real, mas **o porte precisa reproduzir a mutabilidade, não congelar a matriz**.
- **Compatibilidade com paradigma alvo**: ⚠️ Um alvo tipado tenderia a declarar os papéis como união fechada de tipos — e isso **congela** o que o legado deixa mutável. É o caso mais claro em que "idiomático" quebra a regra.
- **Âncora no legado**: `wp-admin/includes/upgrade.php:80` · `wp-includes/ms-site.php:743`

### BR-MIGRAR-100
- **Origem**: [`state-machines.md`](../state-machines.md) §§1–9
- **Regra na fonte**: `BR-LEGACY-SM-ALL`
- **Confiança original**: 🟢
- **Descrição**: **Nove ciclos de vida com estado explícito migram inteiros, com os gatilhos de cada transição:** conteúdo (`post_status`), comentário (`comment_approved`), anexo, solicitação de dados pessoais, *changeset* do Customizer, cadastro em rede (`signups.active`), site da rede (**quatro campos independentes**, não um estado), atualização automática do núcleo (opção `auto_core_update_failed`) e modo de recuperação com extensão pausada. Quatro entidades centrais **não** têm máquina de estado, e isso é registrado para que ninguém procure: `users`, `terms`, `options` e `wp_links`.
- **Justificativa de migração**: Política 6. Cada transição é uma regra com gatilho declarado, e `state-machines.md` traz 9 diagramas conferidos por lint.
- **Compatibilidade com paradigma alvo**: ⚠️ **Nenhuma das nove foi observada em execução** (S1): não há banco, log nem conteúdo nesta árvore. Toda transição foi lida no código. E extensões registram status adicionais por `register_post_status()`, logo as máquinas 1, 3, 4 e 5 são **piso, não teto** (S2).
- **Âncora no legado**: `wp-includes/post.php:767` · `wp-includes/ms-site.php:541`

### BR-MIGRAR-101
- **Origem**: [`state-machines.md`](../state-machines.md) §5 · unit [`customize/changeset-do-customizer`](../customize/changeset-do-customizer/requirements.md)
- **Regra na fonte**: `BR-LEGACY-SM-CHANGESET`
- **Confiança original**: 🟢
- **Descrição**: **O *changeset* do Customizer é um post com regras próprias de ciclo de vida**, separado do conteúdo que ele altera: a personalização em andamento é dado persistido antes de ser aplicada.
- **Justificativa de migração**: Política 6. É a única máquina de estado que serve a um fluxo de edição, não a um objeto de domínio.
- **Compatibilidade com paradigma alvo**: Compatível. `architecture.md` registra o ciclo secundário `customize ↔ menus-de-navegacao ↔ widgets-e-sidebars`: os três são uma unidade de migração, não três fatias.
- **Âncora no legado**: `wp-includes/post.php:767`

### BR-MIGRAR-102
- **Origem**: [`paradigm_decision.md`](paradigm_decision.md) § *Implicações pendentes*, linha **Curator / implicação 1** · [`refactor/architectures.md`](../refactor/architectures.md) §2 · [`questions.md`](../questions.md) Pergunta 3
- **Regra na fonte**: `BR-LEGACY-EXT-FILTROS`
- **Confiança original**: 🟢
- **Descrição**: **Os 2.460 pontos de filtro são contrato de extensão a preservar, não detalhe de implementação.** O barramento tem 3.373 pontos de gancho, e 2.460 `apply_filters` contra 1.068 `do_action` significam **69,7% do gancho devolvendo valor ao chamador**, que usa o retorno na mesma expressão. O barramento é síncrono, reentrante, ordenado por prioridade inteira, e morre com o processo da requisição.
- **Justificativa de migração**: Mandato explícito do `paradigm_decision.md` para este agente. E a Pergunta 3 fecha a questão: *"o ponto de extensão é o produto, não acidente de implementação"*.
- **Compatibilidade com paradigma alvo**: ⚠️ **Implicação 1 — é a regra que mais depende da decisão de paradigma.** A Decisão 2 põe o **valor devolvido por hook em contrato byte a byte**, porque é a interface de extensão do produto: um filtro que devolve diferente muda todo plugin que o usa. Consequências que a Opção 3 declara não afrouxar: retorno de valor, reentrância, ordem por prioridade inteira. E tornar o filtro assíncrono obriga todo chamador a `await` — o que, no meio dos 1.463 `echo`/`print`, muda a **ordem de emissão do HTML**.
- **Âncora no legado**: `wp-includes/plugin.php:174` · `wp-includes/class-wp-hook.php:110`

### BR-MIGRAR-103
- **Origem**: [`paradigm_decision.md`](paradigm_decision.md) § *Implicações pendentes*, linha **Curator / implicação 7** · [`domain.md`](../domain.md) §1.6 · [`refactor/architectures.md`](../refactor/architectures.md) §4
- **Regra na fonte**: `BR-LEGACY-EXT-SUBST`
- **Confiança original**: 🟢
- **Descrição**: **Três formas de substituição são requisito funcional, não decisão de implementação.** (a) **38 funções do núcleo substituíveis inteiras** em `pluggable.php`, protegidas por `function_exists`; (b) **176 guardas `function_exists` em 67 arquivos**, que fazem da *ausência* de código o mecanismo de extensão; (c) **4 *drop-ins*** (`advanced-cache.php`, `object-cache.php`, `fatal-error-handler.php`, `blog-deleted.php`) que **substituem um componente inteiro do núcleo pela simples presença de um arquivo**.
- **Justificativa de migração**: Mandato explícito do `paradigm_decision.md` para este agente, que manda inventariar as três formas **com o critério de o que conta como "substituível" no alvo** — e não deixar isso virar decisão silenciosa. P3: o ponto de extensão é o produto.
- **Compatibilidade com paradigma alvo**: ⚠️ **Implicação 7.** TypeScript não permite redefinir função importada: o que hoje é **ausência de código** vira registro explícito, e o alvo compra injeção de dependência **por necessidade**, não por gosto. **Critério proposto de "substituível":** um ponto é substituível no alvo se um pacote de terceiro puder trocar a implementação sem alterar arquivo do núcleo, com a resolução acontecendo antes do primeiro uso e verificável em tempo de *build*. Os 42 pontos (38 + 4) são a lista de cobertura mínima.
- **Âncora no legado**: `wp-includes/pluggable.php:146` · `wp-includes/load.php:825` · `wp-settings.php:98`

### BR-MIGRAR-104
- **Origem**: [`paradigm_decision.md`](paradigm_decision.md) § *Implicações pendentes*, linha **Curator / implicação 8** · [`refactor/architectures.md`](../refactor/architectures.md) §2.2 · [`database/business-rules.md`](../database/business-rules.md) §3
- **Regra na fonte**: `BR-LEGACY-EXT-EXCLUSAO`
- **Confiança original**: 🟢
- **Descrição**: **As 7 etapas da exclusão de post e os 3 contadores desnormalizados são comportamento observável, não dívida de modelagem.** Em 1.467 arquivos há **zero `START TRANSACTION`, zero `COMMIT` e zero `FOREIGN KEY`**. Apagar um post são 7 passos sequenciais em PHP atravessando 4 tabelas, com semântica deliberada de **reparentamento** — página filha e anexo vão para o avô, não são apagados —, revisões apagadas recursivamente, e 3 contadores desnormalizados costurando os domínios, um deles com **dois critérios de cálculo diferentes**.
- **Justificativa de migração**: Mandato explícito do `paradigm_decision.md` para este agente. E a Pergunta 2 confirma pelo outro lado: a ausência de chave estrangeira é **comportamento do produto, não defeito de dado**.
- **Compatibilidade com paradigma alvo**: ⚠️ **Implicação 8 — não há transação a quebrar, e isso agrava em vez de liberar.** Se os passos virarem eventos, a sequência sem proteção passa a ser **saga sem compensação**, e o legado não tem lógica de compensação porque nunca precisou de uma. `refactor/architectures.md` é direto: partir em serviços transforma uma sequência sem proteção numa saga sem compensação, com 1 time.
- **Âncora no legado**: `wp-includes/post.php:3908` · `wp-includes/post.php:3925` · `wp-includes/comment.php:3106`

### BR-MIGRAR-105
- **Origem**: [`paradigm_decision.md`](paradigm_decision.md) § *Gap identificado*, implicação 2 · [`refactor/architectures.md`](../refactor/architectures.md) §2
- **Regra na fonte**: `BR-LEGACY-EXT-CONTEXTO`
- **Confiança original**: 🟢
- **Descrição**: **Identidade, consulta, conexão de banco e requisição corrente são escopo de REQUISIÇÃO — e isso é regra, não acidente.** No legado o processo é montado do zero por `wp-settings.php` e descartado no fim da resposta, logo `$wpdb`, `$wp_query`, `$wp_filter` e `$current_user` são, **de fato**, variáveis de requisição. `current_user_can` aparece 1.279 vezes em 224 arquivos.
- **Justificativa de migração**: A **regra** migra obrigatoriamente (é direito e invariante: duas requisições não compartilham identidade). O **mecanismo** que a implementa — `global $` mais morte do processo — está em `discard_log.md`, vinculado a paradigma.
- **Compatibilidade com paradigma alvo**: ⚠️ **Implicação 2, a mais grave da travessia.** Numa runtime assíncrona e longo-viva o mesmo módulo atende N requisições concorrentes e esse estado passa a ser **compartilhado**: se a identidade corrente virar estado de módulo, duas requisições trocam de identidade entre si — e `permissions.md` descreve três camadas de autorização, uma delas falhando **aberta**. **Nenhum dos 985 testes de [`backlog/tests.md`](../backlog/tests.md) apanha isso**: todos descrevem uma requisição por vez. A Decisão 2 criou uma área própria para o caso ("estado entre requisições concorrentes: teste próprio, fora dos UCs") — e esse teste **ainda não existe**.
- **Âncora no legado**: `wp-settings.php:66` · `wp-includes/capabilities.php:913` · `wp-includes/query.php:28`

### BR-MIGRAR-106
- **Origem**: [`architecture.md`](../architecture.md) §2.2 e §4.1 D1 · [`paradigm_decision.md`](paradigm_decision.md) § *Opções*, opção 3
- **Regra na fonte**: `BR-LEGACY-EXT-ORDEM`
- **Confiança original**: 🟢
- **Descrição**: **A ordem de carregamento é contrato público.** Não há camadas com interface, há ordem: um plugin que registra gancho cedo ou tarde demais simplesmente não funciona.
- **Justificativa de migração**: Política 6, e a Opção 3 lista "ordem de arranque como contrato público" entre o que a escolha **não afrouxa**.
- **Compatibilidade com paradigma alvo**: ⚠️ **Implicação 5.** No legado o ciclo não dói porque o carregamento é `require`/`include` com 176 guardas `function_exists`; num sistema de módulos real, importação circular lida na avaliação do módulo é **erro de inicialização**, não aviso. O mecanismo de tolerância está em `discard_log.md`; o **contrato de ordem** migra.
- **Âncora no legado**: `wp-settings.php:52` · `wp-includes/default-filters.php:771`

### BR-MIGRAR-107
- **Origem**: [`questions.md`](../questions.md) Pergunta 14 · [`backlog/backlog.json`](../backlog/backlog.json) REQ-121, REQ-148, REQ-179
- **Regra na fonte**: `BR-LEGACY-ESC-SUPERFICIES`
- **Confiança original**: 🟢
- **Descrição**: **As quatro superfícies de escrita paralelas à API entram no porte com o comportamento atual:** XML-RPC (inclusive o `pingback`), o editor de arquivos do painel, o canal assíncrono `admin-ajax.php` — *"por onde metade do painel conversa"* — e a própria API REST.
- **Justificativa de migração**: **CORREÇÃO DE LEITURA, e é a mais fácil de errar.** O backlog marca REQ-121, REQ-148 e REQ-179 como `wont`, e o resumo do próprio backlog celebra que *"três superfícies de escrita paralelas podem sair inteiras"*. A Pergunta 14 inverte isso: *"nenhuma das três sai… o `wont` vale como 'não mudar', nunca como 'não portar'"*. Quem curar lendo só o `wont` descarta metade do painel.
- **Compatibilidade com paradigma alvo**: Compatível. As quatro superfícies dependem de identidade correta **por requisição** (implicação 2): o `paradigm_decision.md` avisa que traduzir tela sem esse contexto produz **vazamento de sessão entre usuários**.
- **Âncora no legado**: `xmlrpc.php:13` · `wp-admin/admin-ajax.php:17` · `wp-admin/theme-editor.php:17`

### BR-MIGRAR-108
- **Origem**: [`questions.md`](../questions.md) Perguntas 1 e 3 · [`gaps.md`](../gaps.md) §2.1
- **Regra na fonte**: `BR-LEGACY-ESC-FILTRAVEL`
- **Confiança original**: 🟢
- **Descrição**: **Toda regra deste catálogo é um default FILTRÁVEL, e preservar isso é o porte.** Nenhum valor real de opção ou constante é conhecido (não há `wp-config.php`), e 279 das 567 lacunas da análise têm essa única causa. A resposta: documentar e reproduzir **o valor de fábrica**, nomeando o ponto de filtro que pode alterá-lo em execução — porque é o filtro que faz parte do produto.
- **Justificativa de migração**: Política 6 aplicada ao conjunto. A Pergunta 1 é categórica: *"o default do código É a especificação"*, porque o alvo é a distribuição oficial limpa e não existe instância cujo comportamento possa divergir dele.
- **Compatibilidade com paradigma alvo**: Compatível, e é o que converte a maior lacuna da análise em requisito executável: cada constante e cada opção migram com (a) o valor de fábrica e (b) o nome do ponto de filtro. Sem (b), o alvo é mais rígido que o legado.
- **Âncora no legado**: `wp-admin/includes/schema.php:362` · `wp-includes/default-constants.php:388`

### BR-MIGRAR-109
- **Origem**: [`questions.md`](../questions.md) Pergunta 4 · [`backlog/backlog.json`](../backlog/backlog.json) EP-12
- **Regra na fonte**: `BR-LEGACY-ESC-MULTISITE`
- **Confiança original**: 🟢
- **Descrição**: **Multisite entra no escopo como CAPACIDADE do produto**, com subdiretório como modo padrão de instalação e subdomínio suportado. O núcleo clonado traz os `ms-*.php` e as 6 tabelas de rede, e um porte sem elas não é idêntico.
- **Justificativa de migração**: Política 6. A Pergunta 4 resolve o bloqueio de REQ-129 e dos 8 cards de EP-12: não se sabe se a instalação é multisite (L5, S3, lacuna P3 de `permissions.md`), **e isso deixa de importar** porque o escopo é o núcleo, não um site.
- **Compatibilidade com paradigma alvo**: Compatível. O vínculo conta↔site dentro do nome da `meta_key` é regra observável: a resposta autoriza normalizar o armazenamento **por baixo**, preservando o comportamento (ver PERM-2).
- **Âncora no legado**: `wp-includes/ms-load.php:74` · `wp-admin/includes/schema.php:248`

### BR-MIGRAR-110
- **Origem**: [`questions.md`](../questions.md) Pergunta 6 · [`backlog/backlog.json`](../backlog/backlog.json) REQ-004
- **Regra na fonte**: `BR-LEGACY-ESC-ENUMERACAO`
- **Confiança original**: 🟢
- **Descrição**: **A mensagem de erro de login continua distinguindo conta inexistente de senha incorreta**, com os quatro códigos de erro e o texto nomeando o login ou e-mail tentado.
- **Justificativa de migração**: Política 4 apontaria DECISÃO HUMANA (REQ-004 pede o contrário e está bloqueado por decisão humana), mas a **Pergunta 6 respondeu**: é comportamento visível, a escolha já foi feita uma vez em favor da usabilidade, e o porte é idêntico. A enumeração de contas fica registrada como **divergência herdada, para a implantação decidir — não para o porte corrigir**.
- **Compatibilidade com paradigma alvo**: Compatível. Mesma classe de P11 e P12: dívida herdada reproduzida de propósito, fechável por configuração na implantação sem alterar o núcleo.
- **Âncora no legado**: `wp-includes/user.php:41` · `wp-login.php:476`

### BR-MIGRAR-111
- **Origem**: [`questions.md`](../questions.md) Pergunta 7 · [`gaps.md`](../gaps.md) achado A-05 · [`backlog/backlog.json`](../backlog/backlog.json) REQ-008
- **Regra na fonte**: `BR-LEGACY-ESC-SESSAO`
- **Confiança original**: 🟢
- **Descrição**: **Trocar a senha não revoga sessão.** O cookie antigo deixa de valer por causa do fragmento de 4 caracteres do *hash* da senha na chave do HMAC, mas **nada é revogado**: o registro do *token* sobrevive em `usermeta` e acumula, e as senhas de aplicação sobrevivem à troca. `wp_destroy_other_sessions()` e `wp_destroy_all_sessions()` são portadas **definidas e sem chamador**, como estão hoje.
- **Justificativa de migração**: Política 4 apontaria DECISÃO HUMANA (REQ-008 está bloqueado por isso, e A-05 registra que dois artefatos diziam coisas opostas), mas a **Pergunta 7 respondeu**: manter como está. E fixa o precedente que este catálogo usa em outros pontos: *"existir sem ser chamada é parte do que se clona"*.
- **Compatibilidade com paradigma alvo**: Compatível. O acúmulo de *token* em `usermeta` é efeito no banco, que a Decisão 2 põe no contrato — e o critério de aceite tem de verificar o acúmulo, não a limpeza.
- **Âncora no legado**: `wp-includes/user.php:3725` · `wp-includes/user.php:3738`

### BR-MIGRAR-112
- **Origem**: [`questions.md`](../questions.md) Pergunta 19 · [`integrations/integrations.json`](../integrations/integrations.json)
- **Regra na fonte**: `BR-LEGACY-ESC-LIMITE-TAXA`
- **Confiança original**: 🟢
- **Descrição**: **Nenhuma superfície de entrada tem limite de taxa, e os dois únicos freios são travas de tempo:** 60 s no `wp-cron.php` e 5 min no `wp-mail.php`. Os dois números estão no código. Limite de taxa fica declarado como decisão de **IMPLANTAÇÃO, fora do núcleo**.
- **Justificativa de migração**: Política 6, e a Pergunta 19 é explícita sobre o motivo: *"para não inventar número que o produto nunca teve"*. Não há log retido nem instalação em operação — o alvo é o CMS, não um site.
- **Compatibilidade com paradigma alvo**: Compatível. **Exceção observável:** o limitador de vazão de comentário (C2) existe e é por hora, com exceção por capacidade — ele não é limite de taxa de superfície, é regra de moderação.
- **Âncora no legado**: `wp-cron.php:92` · `wp-mail.php:39` · `wp-mail.php:53`

### BR-MIGRAR-113
- **Origem**: [`questions.md`](../questions.md) Pergunta 20 · [`domain.md`](../domain.md) §6 lacuna L7
- **Regra na fonte**: `BR-LEGACY-ESC-RETENCAO`
- **Confiança original**: 🟢
- **Descrição**: **O núcleo não declara prazo de retenção nenhum, e portá-lo idêntico é não inventar um.** Onde o legado já encerra por propósito, preservar: a solicitação de dados pessoais morre ao concluir e o cadastro em rede morre ao ativar. `registration_log` acumula IP e e-mail sem prazo, e apagar o site não o toca.
- **Justificativa de migração**: Política 6 com a Pergunta 20. A obrigação de LGPD/GDPR é assumida pela **implantação**, com a rotina de descarte **configurável, não embutida**.
- **Compatibilidade com paradigma alvo**: Compatível. A rotina configurável é trabalho novo **fora** do núcleo, e o default dela não existe no legado: declarar um default embutido deixa de ser idêntico.
- **Âncora no legado**: `wp-admin/includes/schema.php:274` · `wp-includes/ms-functions.php:1232`

### BR-MIGRAR-114
- **Origem**: [`questions.md`](../questions.md) Pergunta 18 · unit [`ai-client`](../ai-client/requirements.md) · [`use-cases/use-cases.md`](../use-cases/use-cases.md)
- **Regra na fonte**: `BR-LEGACY-ESC-IA`
- **Confiança original**: 🟢
- **Descrição**: **O cliente de IA, os três conectores (`anthropic`, `google`, `openai`) e a Abilities API migram como o núcleo os traz: o provedor é extensão e o núcleo só roteia.** Nenhum provedor entra no escopo, e o ator `provedor-de-ia` continua **sem caso de uso algum**, como no legado — os plugins de provedor não existem nesta árvore e `wp-content/plugins/` tem apenas Akismet e Hello Dolly.
- **Justificativa de migração**: Política 6 com a Pergunta 18. O ator morto é achado, não omissão: `use-cases.md` o registra explicitamente.
- **Compatibilidade com paradigma alvo**: Compatível. O adaptador PSR-18 do núcleo existe e roteia por `wp_remote_request`. **A exceção autorizada ao idêntico está em `discard_log.md`** (tempo limite declarado no adaptador em vez de herdado).
- **Âncora no legado**: `wp-includes/connectors.php:290` · `wp-includes/ai-client/class-wp-ai-client-prompt-builder.php:193`

### BR-MIGRAR-115
- **Origem**: [`questions.md`](../questions.md) Pergunta 12 · [`integrations/integrations.md`](../integrations/integrations.md) · [`gaps.md`](../gaps.md) achado A-04
- **Regra na fonte**: `BR-LEGACY-ESC-HTTP`
- **Confiança original**: 🟢
- **Descrição**: **O rebaixamento automático para HTTP quando o TLS falha migra inteiro:** 13 canais nascem em `http://` e **7 repetem a requisição em claro** quando o TLS falha — inclusive o de *checksums*, que seria o que detectaria arquivo de núcleo alterado.
- **Justificativa de migração**: Política 4 apontaria DECISÃO HUMANA (é achado de segurança em dois pontos independentes, REQ-085 e REQ-150), mas a **Pergunta 12 respondeu**: manter, como **dívida herdada reproduzida de propósito**, e a implantação pode fechá-la por configuração sem alterar o núcleo. **CORREÇÃO incorporada:** quatro artefatos afirmavam, marcado 🟢, que eram **2** canais; são 13, e o agente de integrações apurou isso sem propagar a correção (achado A-04).
- **Compatibilidade com paradigma alvo**: ⚠️ **Armadilha das 5 bordas.** Os 15 `fsockopen` e o cliente HTTP são trocados de qualquer forma, e é exatamente ali que vive este modo de falha. O adaptador novo **reproduz o rebaixamento de propósito**; consertá-lo por acidente quebra o critério de idêntico.
- **Âncora no legado**: `wp-includes/update.php:226` · `wp-includes/update.php:228` · `wp-admin/includes/update.php:132`

### BR-MIGRAR-116
- **Origem**: [`questions.md`](../questions.md) Perguntas 15, 16 e 17 · [`pending_decisions.md`](pending_decisions.md) Decisão 2
- **Regra na fonte**: `BR-LEGACY-ESC-ORACULO`
- **Confiança original**: 🟢
- **Descrição**: **O critério de aceite de "idêntico" é combinação por área, e existe um oráculo executável para compará-lo.** Contrato de terceiro (REST, XML-RPC, feeds, sitemaps, oEmbed): **saída byte a byte**. Valor devolvido por hook: **byte a byte no valor**. Esquema e efeito de escrita: **efeito no banco**. HTML de tema e painel: **comportamento de caso de uso** (os 47 UCs). Estado entre requisições concorrentes: **teste próprio, fora dos UCs**. O oráculo é uma instalação executável do legado na **mesma versão** (P16), o fonte do lado cliente vem de `wordpress-develop` (P15), e o *"por quê"* que as 15.929 anotações `@since` não dão está no histórico público de versão e nos bilhetes do Trac (P17).
- **Justificativa de migração**: **CORREÇÃO:** `paradigm_decision.md` § *Notas* item 7 e `refactor/architectures.md` §8 item 6 registram, como lacuna 🔴 aberta, que *"ninguém declarou o critério de aceite de 'idêntico'"*. **Isso está respondido** na Decisão 2 de [`pending_decisions.md`](pending_decisions.md), preenchida depois daqueles artefatos. É a resposta que torna verificável a fronteira da Opção 3.
- **Compatibilidade com paradigma alvo**: Esta regra **é** a fronteira da Opção 3: todo item deste catálogo com nota de compatibilidade herda dela o teste de borda — *muda a saída HTTP, o efeito no banco ou o comportamento de caso de uso? Se não muda, pode ser idiomático.*
- **Âncora no legado**: `wp-includes/version.php:19`

### BR-MIGRAR-117
- **Origem**: [`pending_decisions.md`](pending_decisions.md) § *Lacuna 2*, **respondida** · [`questions.md`](../questions.md) Pergunta 15 · [`architecture.md`](../architecture.md) §10 A-4
- **Regra na fonte**: `BR-LEGACY-ESC-CLIENTE`
- **Confiança original**: 🟢
- **Descrição**: **O lado cliente dos 5 módulos do editor é dependência externa adotada como está, com versão cravada — e o que entra no porte é o lado SERVIDOR que o alimenta.** O contrato do servidor para esse cliente, declarado item por item na resposta: o registro de *scripts* e estilos **com suas dependências**, o registro dos blocos do núcleo por `block.json`, a resolução de `theme.json` e do *style engine*, os *endpoints* REST que o editor chama, e a **serialização de bloco em comentário HTML dentro de `post_content`**.
- **Justificativa de migração**: Decisão humana gravada em [`pending_decisions.md`](pending_decisions.md) § *Lacuna 2* **durante esta etapa** (ver § *O chão desta etapa*). A razão declarada é a mesma que decidiu o paradigma: *"não há porte de linguagem a fazer ali… reescrevê-los não aproxima do idêntico, afasta, porque garante divergência da única implementação de referência que existe"*.
- **Compatibilidade com paradigma alvo**: ⚠️ **A Opção 3 passa a ter DUAS fronteiras de paradigma, e isso fica declarado em vez de descoberto.** A de dentro (servidor) é a fronteira híbrida da Decisão 1; a de fora (cliente) é **adoção pura** do paradigma upstream, com gap de paradigma **zero**. O contrato servidor→cliente é **byte a byte** pelo critério da Decisão 2, porque é o que o cliente consome. Escopo do Screen Translator: as ~100 telas do painel, **sem** o editor. Preço nomeado: dependência de versão com o upstream — atualizar o cliente passa a exigir conferir o contrato servidor da mesma versão. **Micro-correção de contagem:** a resposta fala em 116 blocos; esta árvore tem **115** arquivos `block.json` em `wp-includes/blocks/`. Não muda a decisão, muda o número da lista de cobertura.
- **Âncora no legado**: `wp-includes/script-loader.php:129` · `wp-includes/blocks.php:520` · `wp-includes/blocks.php:1795` · `wp-includes/class-wp-theme-json-resolver.php:644` · `wp-includes/rest-api.php:265`

---

## Regras DESCARTAR (resumo)

| ID | Regra descartada | Origem | Motivo curto | Vínculo a paradigma? |
|---|---|---|---|---|
| [BR-DESCARTAR-001](discard_log.md#br-descartar-001) | Prazo de 15 dias para spam e apagamento em lotes de até 10.000, com reconsult… | [`domain.md`](../domain.md) §2.2 regra **C13** | fora de escopo (extensão empacotada) | não |
| [BR-DESCARTAR-002](discard_log.md#br-descartar-002) | O envio integral ao classificador externo: cada comentário submetido faz envi… | [`integrations/integrations.md`](../integrations/integrations.md) achado de segurança **akismet-em-http-puro-por-24h** | fora de escopo (extensão empacotada) | não |
| [BR-DESCARTAR-003](discard_log.md#br-descartar-003) | As duas *abilities* do Akismet — `akismet/comment-check` e `akismet/get-stats… | [`use-cases/UC-46-executar-ability.md`](../use-cases/UC-46-executar-ability.md) | fora de escopo (extensão empacotada) | não |
| [BR-DESCARTAR-004](discard_log.md#br-descartar-004) | O tempo limite herdado do cliente HTTP no caminho de geração de IA | [`questions.md`](../questions.md) Pergunta 18 | exceção autorizada ao idêntico | não |
| [BR-DESCARTAR-005](discard_log.md#br-descartar-005) | `RESET_CAPS` — a constante que, numa atualização, repõe papéis e capacidades… | [`domain.md`](../domain.md) §3 e §4 | instalação nova: o caso não ocorre | não |
| [BR-DESCARTAR-006](discard_log.md#br-descartar-006) | Os 38 portões históricos de `upgrade_all()`, cobrindo `db_version` de 2541 a… | [`database/business-rules.md`](../database/business-rules.md) §8.2 | instalação nova: o caso não ocorre | não |
| [BR-DESCARTAR-007](discard_log.md#br-descartar-007) | O laço infinito da exportação em hierarquia com ciclo | unit [`importacao-e-exportacao`](../importacao-e-exportacao/design.md) §*Riscos e Lacunas* | defeito a não reproduzir | não |
| [BR-DESCARTAR-008](discard_log.md#br-descartar-008) | O estado global como mecanismo de escopo de requisição: 1.121 declarações `gl… | [`paradigm_decision.md`](paradigm_decision.md) § *Gap identificado*, implicação 2 | mecanismo absorvido pelo alvo | **sim** |
| [BR-DESCARTAR-009](discard_log.md#br-descartar-009) | A substituição por ausência de código: redefinir uma função do núcleo antes d… | [`paradigm_decision.md`](paradigm_decision.md) § *Gap identificado*, implicação 7 | mecanismo absorvido pelo alvo | **sim** |
| [BR-DESCARTAR-010](discard_log.md#br-descartar-010) | A tolerância a dependência circular por carregamento em `require`: 1.342 `req… | [`paradigm_decision.md`](paradigm_decision.md) § *Gap identificado*, implicação 5 | mecanismo absorvido pelo alvo | **sim** |

> Detalhe completo, com reposição no sistema novo e risco por item, em [`discard_log.md`](discard_log.md).

---

## Regras DECISÃO HUMANA

As 9 têm status **PENDENTE** e estão replicadas em [`ambiguity_log.md`](ambiguity_log.md).
Nenhuma foi decidida em nome de ninguém: onde há recomendação, ela está marcada como **do Curator**.

### BR-HUMANA-001
- **Origem**: [`pending_decisions.md`](pending_decisions.md) § *Lacuna 1* · [`paradigm_decision.md`](paradigm_decision.md) § *Stack alvo declarada* e § *Notas* item 1
- **Tipo de ambiguidade**: 🔴 GAP de pré-requisito — `migration_brief.md` não existe
- **Descrição**: **A stack alvo está incompleta e o brief não existe.** Só a **linguagem** foi declarada, e fora de um brief (🟡 inferida da Pergunta 15). **Runtime, framework e infra estão em branco (🔴)**, e o framework **decide retroativamente parte do paradigma**: o catálogo põe NestJS em *OO com DI* e Fastify/Express em *event-driven leve*. Em branco também, e **sem substituto neste pacote**: objetivo da migração, métricas de sucesso, prazo, orçamento, *stakeholders* e escopo formal.
- **Opções**:
  - **(a) NestJS** — o registro explícito que a implicação 7 obriga já vem pronto como container, com verificação em tempo de *build*; em troca, o framework impõe decoradores e módulos a um núcleo que não tem camadas.
  - **(b) Fastify ou Express com registro próprio** — mais perto da forma atual e sem imposição estrutural; o container das 42 substituições é trabalho próprio.
  - **(c) decidir depois** — permite começar pelas 2 raízes do grafo, que não dependem da escolha; custa reavaliar as 8 implicações quando a escolha chegar.
- **Recomendação do Curator**: **(a) ou (b), decidido junto com o paradigma — não (c).** A implicação 7 mostra que o porte compra injeção de dependência **por necessidade**, não por gosto: 42 pontos de substituição precisam de um registro resolvido antes do primeiro uso. Entre (a) e (b) a diferença é quem escreve o container. O que o Curator **não** recomenda é (c): `paradigm_decision.md` § *Notas* item 3 avisa que a escolha tardia decide retroativamente parte do paradigma, e este catálogo tem 5 notas de compatibilidade que dependem dela (A4 inclusive, cujo "PHP mínimo" perde referente sem o runtime).
- **Status**: PENDENTE
- **Âncora no legado**: `wp-includes/version.php:19`

### BR-HUMANA-002
- **Origem**: [`pending_decisions.md`](pending_decisions.md) § *Lacuna 1*, campo **Banco** · [`architecture.md`](../architecture.md) §9 risco 5 · [`questions.md`](../questions.md) Pergunta 2
- **Tipo de ambiguidade**: 🔴 GAP — banco alvo não declarado, com restrição conhecida
- **Descrição**: **O banco alvo não foi declarado, e a restrição é estrutural.** Nove classes montam SQL de MySQL **por fragmento, com um filtro entre cada fragmento**, e esses filtros **são contrato de extensão**. Trocar o motor é reescrever a camada de dados inteira. A Pergunta 2 restringe pelo outro lado: manter `count_users` na variante aproximada, e qualquer chave que o modelo novo declare **não pode mudar o que é observável**.
- **Opções**:
  - **(a) MySQL ou MariaDB** — os filtros entre fragmentos continuam literais e o contrato de extensão sobrevive sem tradução.
  - **(b) PostgreSQL** — os filtros entre fragmentos passam a alimentar uma camada de tradução de dialeto, e o contrato de extensão deixa de ser literal: um plugin que injete SQL de MySQL por filtro quebra.
  - **(c) MySQL em produção e SQLite em desenvolvimento** — barato para teste, e introduz duas gramáticas no mesmo contrato de filtro.
- **Recomendação do Curator**: **(a).** A Decisão 2 põe *esquema e efeito de escrita no banco* em contrato de **efeito no banco**, e os filtros entre fragmentos de SQL são a interface de extensão da camada de dados — não detalhe de implementação. Em (b) e (c) o contrato só pode ser aproximado, e aproximação aqui não é verificável contra o oráculo da Pergunta 16.
- **Status**: PENDENTE
- **Âncora no legado**: `wp-includes/class-wp-query.php:2796` · `wp-includes/class-wp-query.php:2806`

### BR-HUMANA-003
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §4 · [`state-machines.md`](../state-machines.md) §1
- **Tipo de ambiguidade**: ⚠️ AMBÍGUA — o sentinela de data tem significado de negócio e não tem destino óbvio
- **Descrição**: **`'0000-00-00 00:00:00'` é o default de 10 colunas `datetime` e carrega significado de negócio:** em `posts` marca um rascunho cujo status declara `date_floating` (`draft`, `pending`); em `signups.activated` marca um cadastro ainda pendente. **Não é data válida** em MySQL com `NO_ZERO_DATE`, e a fonte a chama de *"a maior incompatibilidade do schema com qualquer banco moderno"*.
- **Opções**:
  - **(a) coluna anulável mais marcador explícito de "data flutuante"** — a semântica fica declarada em vez de codificada num valor impossível; muda o valor gravado, logo muda o efeito no banco.
  - **(b) data de referência fixa** (por exemplo `1970-01-01`) — preserva a coluna não anulável e reintroduz o mesmo problema: um valor legítimo indistinguível do sentinela.
  - **(c) manter a string literal `'0000-00-00 00:00:00'`** — idêntico ao legado byte a byte, e só viável se o banco alvo aceitar zero-date (depende da decisão do banco).
- **Recomendação do Curator**: **(c) se o banco alvo for MySQL com `sql_mode` permissivo; (a) em qualquer outro caso** — e nunca (b), que troca um sentinela por outro sem ganhar nada. A escolha **depende** da decisão do banco acima e não deve ser tomada antes dela. Em (a), o marcador de data flutuante precisa reproduzir exatamente quais status são flutuantes, porque isso é o que o legado deduz do sentinela.
- **Status**: PENDENTE
- **Âncora no legado**: `wp-admin/includes/schema.php:162` · `wp-admin/includes/schema.php:307`

### BR-HUMANA-004
- **Origem**: [`gaps.md`](../gaps.md) achado **A-01** · [`questions.md`](../questions.md) Pergunta 21 · [`.reversa/state.json`](../../.reversa/state.json) `redator_progress.units`
- **Tipo de ambiguidade**: dependência de stakeholder — a cobertura deste catálogo está limitada por 15 módulos sem spec
- **Descrição**: **Quinze dos 71 módulos do grafo medido não têm spec alguma, e entre eles estão cinco dos mais dependidos da árvore:** `nucleo-utilitario-e-erro` (2º, 68 dependentes de 71), `formatacao-e-escape` (3º, 65), `bootstrap-e-carregamento` (5º, 60), `camada-de-dados-wpdb` (14º) e `telas-do-painel` (16º, que recebe a aresta mais pesada do sistema). **Consequência direta para esta etapa:** regra que viva **somente** nesses 15 módulos não está neste catálogo. A Pergunta 21 **já autorizou** rodar o redator para eles, começando pelos 5 mais dependidos — e isso ainda não aconteceu (`redator_progress.units` tem 74 unidades, nenhuma dessas).
- **Opções**:
  - **(a) rodar o redator para os 15 módulos antes do Strategist, e reexecutar o Curator depois** — fecha a lacuna na ordem certa e atrasa o pipeline de uma etapa.
  - **(b) seguir com a lacuna declarada e tratar os 15 módulos como fatia de descoberta dentro da estratégia** — não atrasa, e transporta para a estratégia uma incerteza que é de entendimento, não de desenho.
  - **(c) seguir sem declarar** — não é opção: o `backlog.json` declara cobrir 71 de 71 módulos, o que é verdade para os **cards** e falso para as **specs**, e é exatamente o que torna a lacuna fácil de não ver.
- **Recomendação do Curator**: **(a).** A Pergunta 21 já respondeu com a palavra que decide: *"sem `camada-de-dados-wpdb`, `bootstrap-e-carregamento`, `formatacao-e-escape`, `nucleo-utilitario-e-erro` e `telas-do-painel` não existe porte fiel — são exatamente as camadas em que 'idêntico' se decide"*, e *"precisa ser fechada antes de qualquer trabalho de porte"*. O Curator registra que a autorização existe, não foi executada, e que esta é a **limitação de cobertura declarada** desta etapa.
- **Status**: PENDENTE
- **Âncora no legado**: `wp-includes/class-wpdb.php:2993` · `wp-settings.php:52`

### BR-HUMANA-005
- **Origem**: [`integrations/integrations.md`](../integrations/integrations.md) · [`architecture.md`](../architecture.md) §10 · [`paradigm_decision.md`](paradigm_decision.md) § *Implicações pendentes*, linha **Strategist / implicação 6**
- **Tipo de ambiguidade**: dependência de stakeholder — regra citada como problema, com duplicação admitida em comentário
- **Descrição**: **O protocolo de *loopback* está implementado 4 vezes**, com a duplicação **admitida em comentário** em `class-wp-site-health.php`. É a integração mais crítica do sistema — *"sem loopback nada agendado roda"* — e a falha é silenciosa **por projeto**, porque a requisição é não bloqueante (*timeout* 0,01 s, `blocking` falso, `sslverify` falso).
- **Opções**:
  - **(a) uma implementação, quatro pontos de chamada**, com o comportamento conferido contra o oráculo da Pergunta 16 **antes** de unificar.
  - **(b) reproduzir as quatro**, se a conferência mostrar que divergem em algo observável.
  - **(c) unificar sem conferir** — barato e cego: se as quatro divergem, a unificação muda comportamento sem que nada acuse.
- **Recomendação do Curator**: **(a), com a conferência como pré-requisito e não como formalidade.** Unificar não muda saída HTTP nem efeito no banco **se** as quatro forem equivalentes, e nesse caso a Opção 3 autoriza (estrutura interna). Mas ninguém verificou a equivalência, e a falha é silenciosa por desenho — logo a conferência é o item de trabalho, não a unificação. E o critério de aceite tem de verificar a **falha** do disparo, não a latência: o `paradigm_decision.md` endereça ao Strategist que o agendador e o *loopback* vão numa fatia própria por essa razão (implicação 6).
- **Status**: PENDENTE
- **Âncora no legado**: `wp-admin/includes/class-wp-site-health.php:3622`

### BR-HUMANA-006
- **Origem**: [`tech/technologies.json`](../tech/technologies.json) `declared_unused_ids` · [`questions.md`](../questions.md) Pergunta 7
- **Tipo de ambiguidade**: ⚠️ AMBÍGUA — o precedente da Pergunta 7, lido ao pé da letra, obriga a portar código abandonado que nada chama
- **Descrição**: **Seis bibliotecas vendorizadas estão abandonadas e não são usadas por nada:** Snoopy, Services_JSON, Jcrop, json2, SWFUpload e Prototype/script.aculo.us. O inventário de tecnologias diz que elas *"saem de graça"*. **Mas a Pergunta 7 fixou o precedente oposto** para outro caso: `wp_destroy_other_sessions()` e `wp_destroy_all_sessions()` são portadas definidas e sem nenhum chamador, porque *"existir sem ser chamada é parte do que se clona"*. As duas leituras são defensáveis e levam a resultados opostos.
- **Opções**:
  - **(i) o precedente cobre só o que o produto define** — função do núcleo escrita pelo produto entra mesmo sem chamador; biblioteca de terceiro vendorizada e sem chamador não entra como código.
  - **(ii) o precedente cobre tudo o que a distribuição entrega** — as seis entram, e o alvo carrega seis dependências abandonadas desde o primeiro dia.
  - **(iii) decidir uma a uma** — mais preciso e seis decisões em vez de uma; o inventário de tecnologias já tem o dado para cada.
- **Recomendação do Curator**: **(i).** O argumento da Pergunta 7 é que a **superfície pública do núcleo** inclui o que ele declara — e uma biblioteca de terceiro com zero chamadores não é superfície do núcleo, é conteúdo do pacote. O fato de a distribuição **entregar** esses arquivos migra como decisão de **empacotamento**, não como código a reescrever. O Curator registra a ambiguidade porque a leitura (ii) é literalmente compatível com o texto da resposta, e porque 1 das 6 (TinyMCE **não** está nesta lista, mas está em fim de vida e **é** usada) mostra que a distinção importa.
- **Status**: PENDENTE
- **Âncora no legado**: `wp-includes/class-snoopy.php:38` · `wp-includes/class-json.php:122`

### BR-HUMANA-007
- **Origem**: [`state-machines.md`](../state-machines.md) §11 lacuna **S4** · [ADR-0008](../adrs/0008-falha-critica-de-atualizacao-exige-intervencao-humana.md)
- **Tipo de ambiguidade**: ⚠️ AMBÍGUA — a regra existe, a invariante que a sustenta não está declarada em lugar nenhum
- **Descrição**: **O destravamento da atualização automática depende de uma invariante não declarada entre dois arquivos.** A transição `crítica → limpo` da máquina 8 existe: a limpeza está no caminho comum de `update_core()` e **só a atualização manual o alcança**, porque a automática é recusada antes. **Nada no código liga as duas pontas, e não há teste que proteja a ligação.**
- **Opções**:
  - **(a) reproduzir o acidente** — a limpeza fica no mesmo caminho comum, sem nada declarado; idêntico ao legado, inclusive na fragilidade.
  - **(b) reproduzir o comportamento e declarar a invariante explicitamente, com teste** — o efeito observável é o mesmo (só a atualização manual destrava) e a ligação deixa de depender de ninguém mexer naquele caminho.
  - **(c) mudar o comportamento** (por exemplo, um destravamento explícito no painel) — resolve a fragilidade mudando o produto, e colide com ADR-0008.
- **Recomendação do Curator**: **(b).** Declarar a invariante **não muda** saída HTTP, efeito no banco nem comportamento de caso de uso — logo a Opção 3 a autoriza como estrutura interna, e a regra de ADR-0008 (falha crítica congela até intervenção humana) sobrevive intacta. É o caso em que a fronteira da Opção 3 paga: o alvo fica mais verificável **sem** ficar diferente. Registrado como DECISÃO HUMANA, e não aplicado de ofício, porque (a) também é defensável sob o critério de idêntico e a escolha é de quem decide.
- **Status**: PENDENTE
- **Âncora no legado**: `wp-admin/includes/update-core.php:1922`

### BR-HUMANA-008
- **Origem**: [`permissions.md`](../permissions.md) §8 camada 2 · [`domain.md`](../domain.md) §2.9 regra **I7** · unit [`rest-api/despacho-de-requisicao-rest`](../rest-api/despacho-de-requisicao-rest/design.md)
- **Tipo de ambiguidade**: ⚠️ AMBÍGUA — camada de autorização que falha ABERTA, e nenhuma das 23 perguntas a cobriu
- **Descrição**: **Rota REST sem `permission_callback` funciona.** Desde a 5.5.0 ela apenas emite aviso de uso indevido — e o texto do aviso **ensina a declarar `__return_true`** para rota pública. É a única das três camadas paralelas de autorização que falha **aberta** (a de capacidades sempre pergunta; a da Abilities API falha **fechada**). `permissions.md` §8 diz textualmente: *"é aqui que uma auditoria precisa olhar"*.
- **Opções**:
  - **(a) reproduzir o default aberto, com o mesmo aviso** — idêntico, inclusive no texto que ensina `__return_true`; qualquer rota de terceiro que dependa do default continua funcionando.
  - **(b) falhar fechada no alvo** — mais seguro e **quebra** toda rota de extensão que hoje depende do default, inclusive as que o aviso ensinou a escrever.
  - **(c) falhar fechada só para rota do núcleo, aberta para rota registrada por extensão** — fecha o que o produto controla e preserva o contrato de terceiro; é comportamento novo, que o legado não tem.
- **Recomendação do Curator**: **(a), por consistência com decisão já tomada três vezes.** Três perguntas desta mesma classe foram feitas e **todas** mandaram preservar: P6 (enumeração de contas no login), P11 (pacote sem assinatura verificada) e P12 (rebaixamento para HTTP) — sempre com a mesma fórmula, *dívida herdada reproduzida de propósito, fechável pela implantação sem alterar o núcleo*. **O que o Curator registra é que esta não foi perguntada**, e é a de maior alcance das quatro: vale para toda rota de toda extensão. A regra do contrato declarado (I7 — *toda rota deve declarar permissão*) migra em qualquer das três opções; o que está em aberto é só o **default**.
- **Status**: PENDENTE
- **Âncora no legado**: `wp-includes/rest-api.php:122` · `wp-includes/rest-api/class-wp-rest-server.php:197`

### BR-HUMANA-009
- **Origem**: [`database/business-rules.md`](../database/business-rules.md) §9 item 1 · [`domain.md`](../domain.md) §2.5 regra **D6**
- **Tipo de ambiguidade**: dependência de stakeholder — a fonte pede decisão explícita e nenhuma resposta a cobriu
- **Descrição**: **`posts.post_password` é senha em texto claro, não *hash*, e a comparação é literal.** É senha de acesso a **conteúdo**, não de conta, e o modelo depende de poder compará-la literalmente e **exibi-la a quem edita**. `database/business-rules.md` §9 a lista entre os dois pontos que *"merecem decisão explícita numa migração"*.
- **Opções**:
  - **(a) manter texto claro** — idêntico, e a exibição ao editor continua possível.
  - **(b) guardar *hash* e aceitar perder a exibição** — mais seguro para o caso de vazamento do banco, e muda o produto: quem edita deixa de ver a senha que distribuiu.
  - **(c) guardar cifrado com chave da instalação** — exibição preservada e o segredo passa a depender de uma chave que o legado não tem, e cuja perda torna todo conteúdo protegido inacessível.
- **Recomendação do Curator**: **(a).** D6 declara o texto claro como **desenho**, não descuido, e a Pergunta 8 já mandou manter o atestado como está (cookie de 10 dias, sem verificação de idade no servidor, sem limite de tentativa). (b) muda comportamento visível; (c) acrescenta um mecanismo — e uma forma nova de perder dado — que o legado não tem. O Curator registra como DECISÃO HUMANA apenas porque a fonte pediu explicitamente, não porque a evidência esteja dividida.
- **Status**: PENDENTE
- **Âncora no legado**: `wp-admin/includes/schema.php:170` · `wp-includes/post-template.php:890`

---

## Notas

**Para o agente de codificação, em uma frase:** quase nada é descartado porque a decisão humana já
tomada manda preservar comportamento, e os 3 descartes vinculados a paradigma não tiram **nenhuma**
regra de negócio — tiram três *mecanismos* (estado global, substituição por ausência de código, e
tolerância a ciclo por `require`) cuja função migra em [`BR-MIGRAR`](#regras-migrar) com outro nome.

1. **A regra canônica de descarte por paradigma não ocorre neste sistema, e isso é achado.** A rubrica
   do Curator usa como exemplo-padrão o *lock* pessimista (`SELECT … FOR UPDATE`) e a transação ACID
   em torno do fluxo. Aqui não existe nenhum dos dois: são **zero `START TRANSACTION`, zero `COMMIT`**
   e **zero `FOREIGN KEY`** em 1.467 arquivos. Os únicos freios de concorrência são travas de *tempo*
   — 60 s no `wp-cron.php` e 5 min no `wp-mail.php` — e as duas são **observáveis**, logo migram
   (a Pergunta 10 manda preservar as duas pelo número). Não há o que descartar na dimensão em que a
   rubrica esperava descartar.

2. **O descarte mais perigoso é de ordem, não de conteúdo.** `BR-DESCARTAR-008` tira o estado global,
   e `BR-MIGRAR` mantém a regra de que identidade, consulta e conexão são escopo de requisição. Se o
   mecanismo sair antes de o contexto por requisição explícito entrar, duas requisições concorrentes
   trocam de identidade entre si — `current_user_can` aparece **1.279 vezes em 224 arquivos**, e uma
   das três camadas de autorização falha **aberta**. **Nenhum dos 985 testes de**
   [`backlog/tests.md`](../backlog/tests.md) **exercita duas requisições concorrentes.** A Decisão 2
   criou uma área de critério própria para isso, e o teste correspondente **ainda não existe**: é
   trabalho novo, e nenhum card do backlog o cobre.

3. **Limitação de cobertura declarada desta etapa.** O inventário foi construído sobre as 74 unidades
   que o redator gravou, mais `domain.md`, `database/business-rules.md`, `permissions.md`,
   `state-machines.md`, os 12 ADRs, `gaps.md` e as 23 respostas. **Quinze dos 71 módulos do grafo
   medido não têm spec alguma** (achado A-01), e entre eles estão o 2º, o 3º, o 5º, o 14º e o 16º mais
   dependidos da árvore — `nucleo-utilitario-e-erro`, `formatacao-e-escape`,
   `bootstrap-e-carregamento`, `camada-de-dados-wpdb` e `telas-do-painel`. **Regra que viva somente
   nesses 15 módulos não está neste catálogo.** A Pergunta 21 já autorizou fechar a lacuna e ela
   continua aberta: está em [`BR-HUMANA-004`](#br-humana-004).

4. **O erro mais fácil de cometer lendo o backlog, nomeado.** `backlog.json` marca REQ-121, REQ-148 e
   REQ-179 como `wont`, e o próprio resumo do backlog celebra que *"três superfícies de escrita
   paralelas podem sair inteiras"*. A **Pergunta 14 inverte isso**: *"nenhuma das três sai… o `wont`
   vale como 'não mudar', nunca como 'não portar'"*. Um Curator que lesse só o `wont` descartaria
   o XML-RPC, o editor de arquivos e o `admin-ajax.php` — *"por onde metade do painel conversa"*.
   Elas migram, em `ESC-SUPERFICIES`.

5. **Três exceções ao "idêntico" estão autorizadas por escrito, e a lista é fechada.** P18 (tempo
   limite do adaptador de IA, incondicional, dentro do núcleo), P13 (minimização do envio ao
   classificador externo, condicional, fora do núcleo) e o laço infinito da exportação em hierarquia
   com ciclo, que `gaps.md` classifica na causa *"limite conhecido do legado — defeito a **não**
   reproduzir"*. As três passam o mesmo teste, e é esse teste que separa exceção legítima de
   conveniência: **é defeito conhecido do legado, não regra do produto.** Qualquer quarta exceção
   precisa passar pelo mesmo teste e ser registrada aqui, não aplicada em silêncio.

6. **Uma pergunta da mesma classe das outras não foi feita, e é a de maior alcance.** P6, P11 e P12
   perguntaram se o porte deve reproduzir um defeito de segurança conhecido, e as três responderam
   *"sim, como dívida herdada, fechável pela implantação"*. **Rota REST sem `permission_callback`
   funciona** — a única das três camadas de autorização que falha **aberta** — e ninguém perguntou.
   Vale para toda rota de toda extensão. Está em [`BR-HUMANA-008`](#br-humana-008).

7. **Duas premissas de artefatos anteriores foram conferidas e estão superadas** (ver as duas
   correções no início). Além delas, uma terceira muda o **tamanho** de um conserto sem mudar a
   decisão: o `questions.options.json` apurou que o tempo limite do cliente de IA é de **30 s por
   padrão**, definido pelo construtor de prompt, e não os 5 s do cliente HTTP — os 5 s valem só para
   quem chamar o adaptador sem opções de requisição. O descarte de `BR-DESCARTAR-004` é, portanto,
   mais estreito do que P18 supôs. Registrado em [`ambiguity_log.md`](ambiguity_log.md) como item
   referido à codificação.

8. **Nada fora de `_reversa_sdd/migration/` foi modificado ou apagado.** Os três arquivos desta etapa
   são `target_business_rules.md`, `discard_log.md` e `ambiguity_log.md`. O rascunho de trabalho, com
   a fonte de verdade e os scripts reproduzíveis, está em `.reversa/work/reversa-curator/`.

---

## Onde este documento continua

| Próximo agente | O que este catálogo lhe entrega |
|---|---|
| **Strategist** | 117 regras a migrar com nota de compatibilidade por item, 10 descartes com reposição declarada, e os três mandatos do paradigma já traduzidos em requisito (`EXT-FILTROS`, `EXT-SUBST`, `EXT-EXCLUSAO`). A ordem de migração **não existe dentro do ciclo**: 2 raízes, o ciclo inteiro como unidade, 3 pontas |
| **Designer** | `EXT-CONTEXTO` é pré-requisito, não refinamento: o contexto por requisição explícito vem antes de qualquer módulo de domínio. E a cascata de moderação (C1 a C12) é cadeia síncrona de curto-circuito, não *pipeline* de eventos |
| **Screen Translator** | `ESC-SUPERFICIES` (as 4 superfícies de escrita entram) e `ESC-CLIENTE`, que fecha o escopo em **~100 telas do painel, sem o editor** — o editor chega pronto, como dependência externa de versão cravada |
| **Inspector** | o critério de aceite por área de `BR-MIGRAR-116`, o oráculo da Pergunta 16, e o aviso de que os 985 testes são **especificação, não evidência** — nenhum deles exercita concorrência |
