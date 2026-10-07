---
schemaVersion: 1
generatedAt: 2026-10-06T00:00:00-03:00
reversa:
  version: "1.0.0"
kind: target_domain_model
producedBy: designer
hash: "sha256:15ccd22f9d309662725c31b7d29b27a6ca252e436cf82bb6a1cb3b6d31b49936"
---

# Target Domain Model

> Modelo de domínio do sistema novo. Rastreabilidade explícita para o legado
> ([`domain.md`](../domain.md), [`state-machines.md`](../state-machines.md),
> [`permissions.md`](../permissions.md), [`erd-complete.md`](../erd-complete.md)).

> 📌 **PREMISSA DECLARADA.** Este modelo aplica a **opção 3 — híbrido** de
> [`topology_decision.md`](topology_decision.md), que **não foi aprovada**, e pressupõe a estratégia **A**
> de [`migration_strategy.md`](migration_strategy.md), cuja § 6 está **em branco**.
> **Nada neste artefato muda com a resposta de topologia**: aggregate, invariante e evento não dependem de
> onde a pasta fica. O que muda com a topologia é apenas o **caminho** em que cada aggregate é escrito, e
> isso está em [`target_architecture.md`](target_architecture.md) § *Honra à topologia escolhida*.

| Escala de confiança | Significado |
|---|---|
| 🟢 CONFIRMADO | Invariante com origem citada em artefato ou `arquivo:linha` |
| 🟡 INFERIDO | Decisão de modelagem deste agente, derivada de evidência |
| 🔴 LACUNA | Depende de resposta que não existe |

---

## O princípio de modelagem desta etapa, antes dos aggregates

Três regras governaram cada decisão abaixo, e vale declará-las porque explicam escolhas que de outro modo
parecem erro.

1. **O legado não encapsula invariante, e o alvo encapsula — sem mudar onde o dado mora.**
   [`domain.md`](../domain.md) §1.3 e §1.5 registram que o papel *"não é coluna: é uma chave dentro da
   opção `{prefixo}user_roles`"*, que widget e *sidebar* *"vivem em opções, não em tabela"*, e que o bloco é
   *"serializado em comentário HTML dentro de `post_content` — não em tabela"*. O aggregate novo **ganha a
   invariante** e **mantém o armazenamento**, porque forma de armazenamento é área *efeito no banco* do
   critério de aceite da Decisão 2.
2. **Nem todo conceito do legado é aggregate, e forçar que seja é o erro mais fácil aqui.** Opção e
   metadado são **registro chave-valor**, não aggregate: não têm invariante própria, têm 53 e praticamente
   todos os módulos como dependentes. Autorização é **política**, não aggregate. Três contextos **não têm
   aggregate nenhum** — e isso está declarado em vez de disfarçado com um aggregate inventado.
3. **Invariante que o legado não tem, o alvo não inventa.** `ESC-RETENCAO`
   ([`BR-MIGRAR-113`](target_business_rules.md#br-migrar-113)) diz que o núcleo **não declara prazo de
   retenção nenhum**, e `ESC-LIMITE-TAXA` ([`BR-MIGRAR-112`](target_business_rules.md#br-migrar-112)) que
   **nenhuma superfície de entrada tem limite de taxa**. Acrescentar qualquer um dos dois seria requisito
   não funcional inventado.

**Resumo quantitativo**: **21 aggregates**, 2 registros, 2 políticas, 14 entidades, 12 *value objects*,
**zero eventos de domínio** (seção com a justificativa), e **117 de 117** regras MIGRAR mapeadas.

---

## Aggregates

### AGG-Conteudo · `BC-01`
- **Aggregate root**: `Conteudo` (o registro de `posts`, qualquer `post_type`)
- **Invariantes**:
  - Publicar é **ato explícito**: nenhuma transição para `publish` acontece por efeito colateral 🟢 `P1`
  - `post_type = 'post'` **sempre** tem ao menos um termo da taxonomia `category`; apagar o último devolve
    o padrão 🟢 `P3` + `DB-TRG4`
  - Rascunho **pode** ter `post_name` duplicado; publicado, **não** 🟢 `P5`
  - Agendamento é guardado por **comparação de data**, não por transição de estado 🟢 `P6` +
    [ADR-0005](../adrs/0005-agendamento-por-comparacao-de-data-nao-por-transicao.md)
  - Republicar é **operação nula** 🟢 `P7`
  - A lixeira guarda o estado anterior em metadado, e **restaurar devolve como rascunho**, não ao estado
    anterior 🟢 `R1`, `R2` + [ADR-0004](../adrs/0004-lixeira-com-memoria-e-restauracao-para-rascunho.md)
  - Apagar **reparenteia** página filha e anexo para o avô — **não** os apaga 🟢 `DB-TRG3`,
    `wp-includes/post.php:3908` e `:3923`
  - `comment_count` é contador desnormalizado que **pode divergir** e é recalculado em PHP 🟢 `DB-TRG1`
  - Senha de conteúdo é **texto claro**, sem prazo e sem limite de tentativa 🟢 `D6` · 🔴 `BR-HUMANA-009`
- **Comandos aceitos**: `criar`, `salvarRascunho`, `submeterParaRevisao`, `publicar`, `agendar`,
  `atualizar`, `descartarNaLixeira`, `restaurarDaLixeira`, `apagarDefinitivamente`,
  `classificar`, `anexarBloco`, `definirSenha`
- **Eventos publicados**: **nenhum** — ver § *Eventos de domínio*
- **Origem no legado**: [`domain.md`](../domain.md) §2.1 · [`state-machines.md`](../state-machines.md) §1
  (`conteudo-post_status`) · `wp-includes/post.php`

### AGG-Revisao · `BC-01`
- **Aggregate root**: `Revisao`
- **Invariantes**: a revisão é um `post` de `post_type = 'revision'` filho do conteúdo, e apagar o pai
  apaga as revisões **pelo mesmo caminho** de exclusão (recursão por `wp_delete_post_revision`) 🟢
  `wp-includes/post.php:3912`–`:3920`
- **Comandos aceitos**: `registrar`, `restaurar`, `apagar`
- **Origem no legado**: `wp-includes/revision.php` · [`erd-complete.md`](../erd-complete.md) §3
- **Justificativa de ser aggregate próprio e não parte de `AGG-Conteudo`** 🟡: a revisão tem ciclo de vida
  independente do conteúdo (é criada por salvamento, não por publicação) e é o único caso em que a cascata
  de exclusão **recorre sobre si mesma**. Modelá-la dentro de `AGG-Conteudo` tornaria a recursão implícita.

### AGG-Termo · `BC-02`
- **Aggregate root**: `Termo` (a fusão `terms` + `term_taxonomy`)
- **Invariantes**:
  - `UNIQUE (term_id, taxonomy)` — é o que **impede** o mesmo termo duas vezes na mesma taxonomia 🟢
    `DB-UNIQ`, `wp-admin/includes/schema.php:82`
  - `count` tem **dois critérios de cálculo diferentes**: um para taxonomia de `post` e outro para as
    demais 🟢 `DB-TRG2`
  - Apagar um termo **devolve o objeto ao termo padrão**, se aquele era o único 🟢 `DB-TRG4`,
    `wp-includes/taxonomy.php:2152`
  - O vínculo objeto↔termo é **polimórfico** e serve `posts` **e** `links` 🟢
    [`erd-complete.md`](../erd-complete.md) §7.1 relações 5 e 10
- **Comandos aceitos**: `criar`, `renomear`, `reposicionarNaHierarquia`, `vincularObjeto`,
  `desvincularObjeto`, `apagar`, `recalcularContador`
- **Origem no legado**: [`domain.md`](../domain.md) §2.7 · `wp-includes/taxonomy.php`
- **Justificativa da fusão `terms` + `term_taxonomy`** 🟡: [`erd-complete.md`](../erd-complete.md) §9 risco
  6 declara que *"a fusão é segura por causa do `UNIQUE KEY term_id_taxonomy`, e simplifica a hierarquia"*.
  ⚠️ **A fusão é do aggregate, não das tabelas**: o esquema fica intacto (AD-11), e as duas tabelas
  continuam existindo.

### AGG-Comentario · `BC-03`
- **Aggregate root**: `Comentario`
- **Invariantes** — **a ordem faz parte da invariante**, e esta é a única lista deste documento em que
  reordenar as linhas muda o comportamento 🟢:
  1. Duplicata é **recusa** (HTTP 409), não moderação `C1`
  2. `comment_moderation = '1'` **encerra a decisão na primeira linha**: nenhuma outra regra é consultada
     `C4`
  3. Autor do post ou quem tem `moderate_comments` entra aprovado **sem passar por nenhuma verificação**
     `C3`
  4. Vazão limitada por hora (HTTP 429), **exceto** para quem modera `C2`
  5. Lista de proibição vai para a **lixeira**, não para spam `C9`
  6. Palavra de moderação é buscada em **seis** campos `C6`
  7. Link em excesso manda para a fila `C5`
  8. Autor já aprovado antes passa direto — **se o e-mail estiver limpo** `C7`
  9. Texto longo demais é **erro de usuário**, não truncamento `C10`
  10. *Pingback* do próprio site publicado é aprovado; *trackback* **nunca** `C8` +
      [ADR-0003](../adrs/0003-pingback-do-proprio-site-aprovado-trackback-nunca.md)
  11. Comentário em post antigo **fecha sozinho**, reescrevendo `comment_status` **em memória — o banco não
      muda** `C11`
  12. Nota editorial **não é** comentário público `C12`
  - **E a cascata de moderação é em cascata**: apagar o pai propaga
    [ADR-0002](../adrs/0002-moderacao-de-comentario-em-cascata-com-atalho-de-confianca.md)
  - Comentário **órfão é estado normal**: apagar o usuário **não** toca nos comentários 🟢
    [`erd-complete.md`](../erd-complete.md) §9 risco 2, `wp-admin/includes/user.php:351`
- **Comandos aceitos**: `submeter`, `decidir` (a cadeia), `aprovar`, `reprovar`, `marcarComoSpam`,
  `descartarNaLixeira`, `apagar`, `registrarNotificacaoDeLink`
- **Eventos publicados**: **nenhum** — e aqui a ausência é **requisito**: publicar
  `comentario.submetido` e deixar 13 *handlers* reagirem perderia a ordem **e** o encerramento, e a
  resposta ao visitante viraria 202 em vez de 409/429 (implicação 3)
- **Origem no legado**: [`domain.md`](../domain.md) §2.2 — *"a área de maior densidade de regra de negócio
  do sistema"* · [`state-machines.md`](../state-machines.md) (`comentario-comment_approved`)

### AGG-Anexo · `BC-04`
- **Aggregate root**: `Anexo`
- **Invariantes**:
  - Anexo **nunca** é "publicado": o `post_status` dele não participa da máquina de publicação 🟢 `P2`
  - Imagem grande é **reduzida na ingestão** 🟢 `M1`
  - Quatro tamanhos nascem com o site: `thumbnail` 150×150, `medium` 300, `medium_large` 768, `large` 🟢 `M2`
  - O `srcset` **para em 2048 px**, independente dos tamanhos existentes 🟢 `M3`
  - Falha ao gerar derivada é **silenciosa** 🟢 `M4`
  - Só vai para a lixeira se `MEDIA_TRASH` estiver ligada — e ela é **`false` por padrão**, logo apagar é
    **definitivo** e o ator **não é avisado** 🟢 `R3`
- **Comandos aceitos**: `enviar`, `gerarDerivadas`, `editarImagem`, `restaurarOriginal`, `apagar`
- **Origem no legado**: [`domain.md`](../domain.md) §2.6 (mídia) ·
  [`state-machines.md`](../state-machines.md) (`anexo-post_status`)

### AGG-Conta · `BC-05`
- **Aggregate root**: `Conta`
- **Invariantes**:
  - Registro aberto é **desligado por padrão** (`users_can_register = 0`) 🟢 `U1`
  - Login até **60** caracteres, apelido até **50** — e os dois são **erro**, não truncamento 🟢 `U2`
  - A lista de logins proibidos é **vazia por padrão** e existe só como filtro 🟢 `U3`
  - A chave de *reset* vale **24 h** e é apagada no **primeiro login bem-sucedido** 🟢 `U4`
  - A mensagem de erro de login **distingue conta inexistente de senha incorreta** 🟢 `ESC-ENUMERACAO`
  - Trocar a senha **não revoga sessão** 🟢 `ESC-SESSAO`
  - `users.user_status` existe no esquema e o núcleo **nunca escreve nada nela** 🟢 `DB-DEAD`
  - O papel é **dado mutável**, não código: vive em metadado serializado por site 🟢 `PERM-1`, `PERM-2` +
    [ADR-0001](../adrs/0001-papeis-como-dado-mutavel-nao-como-codigo.md)
- **Comandos aceitos**: `registrar`, `criarPorAdministrador`, `atualizarPerfil`, `trocarSenha`,
  `solicitarResetDeSenha`, `consumirChaveDeReset`, `atribuirPapel`, `apagar`
- **Origem no legado**: [`domain.md`](../domain.md) §2.3 · [`permissions.md`](../permissions.md)

### AGG-Sessao · `BC-05`
- **Aggregate root**: `Sessao`
- **Invariantes**:
  - Dura **2 dias**; com "lembrar de mim", **14** — com **12 h de carência** 🟢 `U5`
  - A chave do HMAC do *cookie* embute **4 caracteres do hash da senha** 🟢
    `wp-includes/pluggable.php:855`–`:867`, [`gaps.md`](../gaps.md) A-05
  - O *nonce* amarra **tique, ação, usuário e token de sessão** 🟢
- **Comandos aceitos**: `abrir`, `renovar`, `encerrar`, `encerrarOutras`, `encerrarTodas`
- **Origem no legado**: [`domain.md`](../domain.md) §2.3 · `wp-includes/class-wp-session-tokens.php`
- ⚠️ **Nota de escopo**: `wp_destroy_other_sessions()` e `wp_destroy_all_sessions()` estão **definidas e
  sem nenhum chamador** no legado, e [`questions.md`](../questions.md) P7 manda portá-las — *"existir sem
  ser chamada é parte do que se clona"*. Os dois comandos existem **de propósito** sem caminho de uso.

### AGG-SenhaDeAplicacao · `BC-05`
- **Aggregate root**: `SenhaDeAplicacao`
- **Invariantes**: credencial de **segunda classe por desenho** — 24 caracteres gerados, guardada com
  *hash*, e não dá acesso a tudo que a conta dá 🟢 `U6`
- **Comandos aceitos**: `criar`, `revogar`, `revogarTodas`, `registrarUso`
- **Origem no legado**: [`domain.md`](../domain.md) §2.3 · `wp-includes/class-wp-application-passwords.php`

### AGG-SolicitacaoDeDadoPessoal · `BC-06`
- **Aggregate root**: `SolicitacaoDeDadoPessoal`
- **Invariantes**:
  - É armazenada como um `post` — e **ainda assim não pertence a `BC-01`** 🟢 `D1`
  - **Nada acontece sem confirmação do titular** 🟢 `D2`
  - Falha de envio de e-mail é **estado**, não exceção: vai para `request-failed` e pode ser reenviada 🟢 `D3`
  - Não confirmada em **24 h** expira para `request-failed`, e a chave é apagada **no mesmo movimento** 🟢 `D3b`
  - Exportar ou apagar dado de terceiro é **poder de rede** 🟢 `D4`
  - A página de política é protegida pela **própria capacidade de privacidade** 🟢 `D5`
  - O arquivo de exportação vale **3 dias** e a varredura é **horária** — diferente de `R1` 🟢 `R7`
- **Comandos aceitos**: `abrir`, `enviarConfirmacao`, `confirmar`, `executar`, `expirar`, `reenviar`
- **Origem no legado**: [`domain.md`](../domain.md) §2.5 ·
  [`state-machines.md`](../state-machines.md) (`solicitacao-de-dados-pessoais-user_request`)

### AGG-Tema · `BC-07`
- **Aggregate root**: `Tema`
- **Invariantes**: a hierarquia de template é resolvida por **ordem declarada**, e `theme.json` é contrato
  **em dado** resolvido para CSS por estágios 🟢 [`domain.md`](../domain.md) §1.5 e §1.8
- **Comandos aceitos**: `ativar`, `resolverTemplate`, `compilarEstilosGlobais`
- **Origem no legado**: `wp-includes/class-wp-theme.php` · `wp-includes/class-wp-theme-json.php`

### AGG-Changeset · `BC-07`
- **Aggregate root**: `Changeset` (do Customizer)
- **Invariantes**: é um `post` com **regras próprias de ciclo de vida, separado do conteúdo** 🟢
  `SM-CHANGESET`
- **Comandos aceitos**: `criar`, `salvar`, `publicar`, `descartar`
- **Origem no legado**: [`state-machines.md`](../state-machines.md) (`changeset-do-customizer`)
- **Justificativa de ser aggregate próprio** 🟡: é o segundo caso (depois de `D1`) em que **a forma de
  armazenamento não decide o contexto**. O *changeset* é um `post`, e a sua máquina de estado não tem
  interseção alguma com `post_status`.

### AGG-AreaDeWidget · `BC-07`
- **Aggregate root**: `AreaDeWidget` (a *sidebar*)
- **Invariantes**: widget e área **vivem em opções, não em tabela** — e o aggregate encapsula a invariante
  **sem mudar isso** 🟢 [`domain.md`](../domain.md) §1.3
- **Comandos aceitos**: `registrar`, `adicionarWidget`, `reordenar`, `removerWidget`
- **Origem no legado**: [`domain.md`](../domain.md) §1.3 · `wp-includes/widgets.php`

### AGG-MenuDeNavegacao · `BC-07`
- **Aggregate root**: `MenuDeNavegacao`
- **Invariantes**: o item de menu é um `post` de tipo `nav_menu_item` classificado por uma taxonomia — logo
  o aggregate **atravessa** `BC-01` e `BC-02` por armazenamento, e é por isso que ele é aggregate daqui e
  não de lá 🟡
- **Comandos aceitos**: `criar`, `adicionarItem`, `reordenarItens`, `atribuirALocal`
- **Origem no legado**: `wp-includes/nav-menu.php`

### AGG-Ability · `BC-09`
- **Aggregate root**: `Ability`
- **Invariantes**:
  - Toda *ability* **exige** retorno de permissão, e a **falta de callback é erro** — não liberação 🟢 `I4`
  - A autorização é **filtrável, inclusive para conceder** 🟢 `I5`
  - A execução pode ser **curto-circuitada antes de qualquer validação** 🟢 `I6`
- **Comandos aceitos**: `registrar`, `listar`, `executar`
- **Origem no legado**: `wp-includes/abilities.php:90`, `:207`, `:294` ·
  `wp-includes/default-filters.php:553`
- ⚠️ **Correção que já estava registrada**: [`permissions.md`](../permissions.md) §8.1 e a lacuna P7 afirmam
  que **nenhuma** *ability* está registrada nesta árvore; **são cinco** — 3 do núcleo e 2 do Akismet, todas
  com `permission_callback`. A correção é do agente de casos de uso e está aplicada aqui.

### AGG-AtualizacaoAutomatica · `BC-11`
- **Aggregate root**: `AtualizacaoAutomatica`
- **Invariantes**:
  - Exige **escrita no webroot e ausência de VCS** 🟢 `A1`
  - *Minor* e desenvolvimento por padrão; ***major* só com escolha explícita** 🟢 `A2`
  - A **constante vence a opção**, e `false` desliga tudo — mas a decisão ainda pode ser revertida por
    filtro 🟢 `A3`
  - Não se atualiza para versão que o ambiente não suporta 🟢 `A4`
  - Falha crítica **congela** até intervenção humana 🟢 `A5` +
    [ADR-0008](../adrs/0008-falha-critica-de-atualizacao-exige-intervencao-humana.md)
  - Falha transitória tem **exatamente uma** segunda chance, em **uma hora**, e **não notifica**: zero
    e-mail na primeira falha, **um** na segunda 🟢 `A6`
  - O mesmo aviso **não é repetido** 🟢 `A7`
  - **A assinatura do pacote não é verificada**: `wp_trusted_keys()` devolve lista vazia desde 2021-04-01 🟢
    `A8`, `wp-admin/includes/file.php:1548` e `:1553` +
    [ADR-0010](../adrs/0010-tolerar-pacote-sem-assinatura-verificada.md)
- **Comandos aceitos**: `verificarVersao`, `baixarPacote`, `aplicar`, `congelar`, `destravar`,
  `notificarAdministrador`
- **Origem no legado**: [`domain.md`](../domain.md) §2.6 ·
  [`state-machines.md`](../state-machines.md) (`atualizacao-automatica-do-nucleo`)
- 🔴 **Lacuna de invariante**: o destravamento existe (`wp-admin/includes/update-core.php:1922`) mas
  **depende de uma invariante não declarada entre dois arquivos** — `BR-HUMANA-007` /
  [AMB-010](ambiguity_log.md). O aggregate **não pode** declarar essa invariante sem inventá-la.

### AGG-ModoDeRecuperacao · `BC-11`
- **Aggregate root**: `ModoDeRecuperacao`
- **Invariantes**:
  - Dura **uma semana** e avisa **uma vez por dia** 🟢 `A10`
  - Erro em *endpoint* público **não aciona** recuperação 🟢 `A11`
  - Sair retoma **todas** as extensões pausadas de uma vez e **zera** o limite de e-mail 🟢 `A12`
  - A chave de recuperação é **consumida antes de ser validada** 🟢
    [ADR-0007](../adrs/0007-chave-consumida-antes-de-validar.md)
- **Comandos aceitos**: `entrar`, `pausarExtensao`, `retomarTodas`, `sair`
- **Origem no legado**: [`state-machines.md`](../state-machines.md)
  (`modo-de-recuperacao-e-extensao-pausada`)

### AGG-TarefaAgendada · `BC-11`
- **Aggregate root**: `TarefaAgendada`
- **Invariantes**:
  - **Cron não é cron**: é uma lista em `wp_options` disparada por requisição HTTP ao próprio host 🟢 `A9`
  - O disparo é **deliberadamente não bloqueante** — *timeout* 0,01 s, `blocking` falso, `sslverify`
    falso — e **tem de falhar**: o comportamento correto é um fracasso 🟢 `A9`, implicação 6
  - A coleta da lixeira é agendada **só por visita autenticada ao painel**
    (`wp-admin/admin.php:104`, depois de `auth_redirect()`) — logo **um site que ninguém administra nunca
    limpa a própria lixeira** 🟢 `R5` +
    [ADR-0006](../adrs/0006-retencao-agendada-por-visita-ao-painel.md)
  - A coleta **tolera estado inconsistente** 🟢 `R6`
  - Os dois únicos freios do sistema são travas de tempo: **60 s** em `wp-cron.php` e **5 min** em
    `wp-mail.php` 🟢 `ESC-LIMITE-TAXA`
- **Comandos aceitos**: `agendar`, `desagendar`, `dispararLoopback`, `executarVencidas`
- **Origem no legado**: [`domain.md`](../domain.md) §2.6 A9 · [`questions.md`](../questions.md) P10
- 🔴 **Lacuna**: o protocolo de *loopback* está implementado **4 vezes** e a equivalência das quatro
  **não foi conferida** — `BR-HUMANA-005` / [AMB-008](ambiguity_log.md). O aggregate recebe **dono único**,
  mas unificar antes de conferir muda comportamento sem que nada acuse.

### AGG-Rede · `BC-12`
- **Aggregate root**: `Rede`
- **Invariantes**: o domínio do e-mail pode ser **restringido ou banido** na rede 🟢 `U8`; criar usuário na
  rede é **permissão de rede**, salvo opção explícita 🟢 `N6`
- **Comandos aceitos**: `criar`, `configurar`, `criarUsuario`
- **Origem no legado**: [`domain.md`](../domain.md) §2.8

### AGG-SiteDaRede · `BC-12`
- **Aggregate root**: `SiteDaRede`
- **Invariantes**:
  - **Quatro** estados de supervisão governam o acesso, e o super admin **os ignora** 🟢 `N1`
  - **`deleted` tem três valores, não dois** — o valor `2` significa "não ativado" 🟢 `N2`. ⚠️ Esta é uma
    correção do Detetive ao dicionário de dados, que descrevia `0`/`1`
  - `archived` e `spam` produzem **a mesma resposta** (HTTP 410) e são campos distintos 🟢 `N3`
  - Cada estado tem gancho de **entrada e de saída** 🟢 `N4`
  - Nome exige **no mínimo 4 caracteres** e herda a lista de nomes proibidos 🟢 `N5`
  - Criar o conjunto de tabelas de um site novo **repovoa os papéis a partir do código** — é o **único**
    ponto em que isso acontece 🟢 `N7`
  - `blogs.lang_id` é indexada e **nunca escrita** pelo núcleo 🟢 `DB-DEAD`
- **Comandos aceitos**: `criar`, `arquivar`, `desarquivar`, `marcarComoSpam`, `desmarcar`,
  `marcarComoAdulto`, `apagar`, `repovoarPapeis`
- **Origem no legado**: [`state-machines.md`](../state-machines.md) (`site-da-rede-quatro-campos`)

### AGG-Cadastro · `BC-12`
- **Aggregate root**: `Cadastro` (`signups`)
- **Invariantes**:
  - Cadastro pendente **reserva o nome por 2 dias** 🟢 `U7`
  - Ativar gera senha de **12 caracteres** e, se o login já existir como usuário, **devolve erro** 🟢 `U9`
  - A chave de ativação **não tem prazo**, e reabrir **não a invalida** 🟢 [`use-cases/UC-42`](../use-cases/UC-42-ativar-cadastro-em-rede.md)
  - `registration_log` **não tem política de retenção** 🟢 `R8`
- **Comandos aceitos**: `abrir`, `ativar`, `materializarConta`, `materializarSite`
- **Origem no legado**: [`state-machines.md`](../state-machines.md) (`cadastro-em-rede-signups-active`)

### AGG-Conector · `BC-13`
- **Aggregate root**: `Conector`
- **Invariantes**:
  - A credencial tem **precedência**: variável de ambiente → constante → banco 🟢 `I1` +
    [ADR-0012](../adrs/0012-credencial-de-conector-fora-do-banco.md)
  - A credencial pode ser `usuario:senha`, **dividida no primeiro dois-pontos** 🟢 `I2`
  - O Akismet é registrado como conector de filtragem de *spam* no núcleo 🟢 `I3`
  - O rebaixamento para `http://` quando o TLS falha é **comportamento a preservar** 🟢 `ESC-HTTP`
- **Comandos aceitos**: `registrar`, `resolverCredencial`, `chamar`, `rebaixarParaHttp`
- **Origem no legado**: `wp-includes/connectors.php:290`–`:325`
- 🔴 **Lacuna**: os **3 conectores de IA** (`anthropic`, `google`, `openai`) estão **declarados sem
  provedor que os execute** nesta árvore, logo o *payload* deles é *"não encontrado no código"*. O
  aggregate existe; o caminho de execução, não.

### Os três contextos sem aggregate, declarados em vez de inventados

| Contexto | Por que não tem aggregate | O que tem no lugar |
|---|---|---|
| `BC-08` contratos de leitura | serializa dado de `BC-01` e `BC-02` e **não tem estado próprio**. Inventar um `AGG-Feed` seria modelar a saída como se fosse entidade | 5 serializadores puros (RSS 2.0, Atom, RDF, *sitemap*, OPML) e o provedor de oEmbed, todos funções de dado → bytes |
| `BC-10` painel | as ~100 telas **leem e comandam** aggregates de outros contextos; nenhuma guarda invariante própria | tabelas de listagem, telas e o editor de arquivo de extensão |
| `BC-13` (parcial) | a **política** de integração é regra, não entidade, fora de `AGG-Conector` | resolução de credencial e o construtor de *prompt* com tempo limite de 30 s |

---

## Registros e políticas (não são aggregates, e isso é decisão)

| Elemento | Tipo | Por que **não** é aggregate | Onde vive | Origem |
|---|---|---|---|---|
| `REG-TipoDeConteudo` | registro | é tabela de declarações consultada por **42 dos 71 módulos**; não tem ciclo de vida nem invariante própria | `plataforma/tipos-de-conteudo/` | `wp-includes/post.php` |
| `REG-Opcao` | registro chave-valor | sem invariante própria; **53 dos 71 módulos** dependem dele. `options.option_name` é a única garantia de unicidade real | `plataforma/opcoes/` | `DB-UNIQ`, `wp-admin/includes/schema.php:147` |
| `POL-Autorizacao` | política | é **decisão**, não entidade: chamada 1.279 vezes em 224 arquivos. Modelá-la como aggregate criaria um aggregate consultado por todos os outros | `plataforma/autorizacao/` | [`permissions.md`](../permissions.md) |
| `POL-ContratoDeExtensao` | política | os 2.460 pontos de filtro, as 38 substituíveis e os 4 *drop-ins* são **contrato**, não estado | `plataforma/barramento/` e `plataforma/registro/` | `EXT-FILTROS`, `EXT-SUBST` |

---

## Entidades

| Entidade | Aggregate dono | Atributos principais | Origem no legado |
|---|---|---|---|
| `Conteudo` | `AGG-Conteudo` | `id`, `autorId`, `data`, `dataGmt`, `conteudo`, `titulo`, `resumo`, `status`, `statusDeComentario`, `statusDePing`, `senha`, `slug`, `paiId`, `guid`, `ordem`, `tipo`, `tipoMime`, `contadorDeComentarios` | `posts` · [`erd-complete.md`](../erd-complete.md) §3 |
| `Revisao` | `AGG-Revisao` | `id`, `conteudoId`, `data`, `conteudo`, `titulo` | `posts` com `post_type = 'revision'` |
| `Metadado` | o aggregate que o possui | `id`, `objetoId`, `chave`, `valor` (estrutura PHP serializada) | `postmeta`, `commentmeta`, `termmeta`, `usermeta`, `blogmeta`, `sitemeta` · `DB-SER` |
| `Termo` | `AGG-Termo` | `termoId`, `taxonomiaId`, `nome`, `slug`, `taxonomia`, `descricao`, `paiId`, `contador`, `grupo` | `terms` + `term_taxonomy` |
| `VinculoObjetoTermo` | `AGG-Termo` | `objetoId` (**polimórfico**), `taxonomiaId`, `ordem` — **PK composta** | `term_relationships` · `wp-admin/includes/schema.php:89` |
| `Marcador` | `AGG-Termo` | `id`, `url`, `nome`, `donoId`, `visivel`, `avaliacao`, `atualizado` | `links` — 🔴 *"nenhum módulo ativo"* é dono ([`erd-complete.md`](../erd-complete.md) §8) |
| `Comentario` | `AGG-Comentario` | `id`, `conteudoId`, `autor`, `autorEmail`, `autorUrl`, `autorIp`, `data`, `dataGmt`, `texto`, `aprovado`, `agente`, `tipo`, `paiId`, `usuarioId`, `karma` | `comments` · [`erd-complete.md`](../erd-complete.md) §3 |
| `Anexo` | `AGG-Anexo` | `id` (é um `Conteudo`), `tipoMime`, `metadadoDeArquivo`, `derivadas` | `posts` + `postmeta` |
| `Conta` | `AGG-Conta` | `id`, `login`, `senhaHash`, `apelido`, `email`, `url`, `registradoEm`, `chaveDeAtivacao`, `nomeExibido`, `status` (**morta**) | `users` · `wp-admin/includes/schema.php:192` e `:210` |
| `Sessao` | `AGG-Sessao` | `token`, `expiraEm`, `ip`, `agente`, `usuarioId` | `usermeta` (`session_tokens`) |
| `SenhaDeAplicacao` | `AGG-SenhaDeAplicacao` | `uuid`, `nome`, `senhaHash`, `criadaEm`, `ultimoUsoEm`, `ultimoIp` | `usermeta` |
| `SolicitacaoDeDadoPessoal` | `AGG-SolicitacaoDeDadoPessoal` | `id` (é um `Conteudo`), `emailDoTitular`, `acao`, `estado`, `confirmadaEm`, `concluidaEm` | `posts` com `post_type = 'user_request'` |
| `SiteDaRede` | `AGG-SiteDaRede` | `blogId`, `redeId`, `dominio`, `caminho`, `registradoEm`, `atualizadoEm`, `publico`, `arquivado`, `adulto`, `spam`, `apagado` (**3 valores**), `idiomaId` (**morto**) | `blogs` · `wp-admin/includes/schema.php:248` |
| `Cadastro` | `AGG-Cadastro` | `id`, `dominio`, `caminho`, `titulo`, `login`, `email`, `registradoEm`, `ativadoEm`, `ativo`, `chaveDeAtivacao`, `meta` | `signups` · `wp-admin/includes/schema.php:299` |

---

## Value objects

| Value object | Atributos | Validações | Origem |
|---|---|---|---|
| `VO-Slug` | `texto` | até **200** caracteres; único entre publicados, **livre entre rascunhos** | `P5` · `wp-admin/includes/schema.php:171` |
| `VO-Login` | `texto` | até **60** caracteres; acima é **erro**, não truncamento; cotejado com a lista de proibidos (**vazia por padrão**) | `U2`, `U3` |
| `VO-Apelido` | `texto` | até **50** caracteres; acima é **erro** | `U2` · `wp-admin/includes/schema.php:196` |
| `VO-Papel` | `nome`, `capacidades` | o nome é **chave dentro** de uma opção, não coluna; a definição é **retrato tirado na instalação** | `PERM-1`, `PERM-2`, `PERM-13` |
| `VO-Capacidade` | `nome` | **93** nomes verificados no código; **4** que o código exige **não estão em papel algum** e entram por filtro | `PERM-7` |
| `VO-DataSentinela` | `valor` | `'0000-00-00 00:00:00'` **carrega significado de negócio** e é o *default* de **10** colunas `datetime`. ⚠️ Não é "data ausente" | `DB-SENT` · 🔴 `BR-HUMANA-003` |
| `VO-EstruturaSerializada` | `bytes` | **`serialize()` do PHP, byte a byte** — é condição da coexistência | `DB-SER` · [`migration_strategy.md`](migration_strategy.md) § 4.3 condição 1 |
| `VO-SenhaDeConteudo` | `texto` | **texto claro, comparação literal**, sem prazo e sem limite de tentativa | `D6` · 🔴 `BR-HUMANA-009` |
| `VO-ChaveDeAtivacao` | `valor`, `expiraEm?` | três formas **incompatíveis** no mesmo sistema: *reset* de senha com **24 h**, confirmação de privacidade com *hash* e **24 h**, ativação de cadastro em rede **sem prazo** | `U4`, `D3b`, `UC-42` |
| `VO-Nonce` | `acao`, `tique`, `usuarioId`, `tokenDeSessao` | amarra os quatro; a validade é por **tique**, não por timestamp | `wp-includes/pluggable.php` |
| `VO-PrioridadeDeGancho` | `inteiro` | ordena o barramento de forma **determinística**; é **contrato público** | `EXT-FILTROS`, `EXT-ORDEM` |
| `VO-TamanhoDeImagem` | `nome`, `largura`, `altura`, `recorta` | os quatro nativos: `thumbnail` 150×150, `medium` 300, `medium_large` 768, `large`; `srcset` **para em 2048 px** | `M2`, `M3` |

---

## Eventos de domínio

> O *template* marca esta seção como **obrigatória se o paradigma é event-driven ou híbrido**. O paradigma
> alvo **é** híbrido, logo a seção é obrigatória — e a resposta honesta é que **não há eventos de domínio
> neste modelo**. Deixá-la vazia seria omissão; preenchê-la com eventos inventados seria pior.

**Zero eventos de domínio.** Três razões independentes, todas já decididas e nenhuma escolha deste agente:

1. **O barramento do legado devolve valor, e o alvo preserva isso.** São **2.460 `apply_filters` contra
   1.068 `do_action`** — **69,7% dos pontos de gancho devolvem valor ao chamador**, que o consome na mesma
   expressão. Um evento de domínio, por definição, **não devolve nada a quem publicou**. AD-03 de
   [`target_architecture.md`](target_architecture.md) preserva o retorno; logo o que existe são **pontos de
   filtro** e **pontos de ação**, que são chamada de função na mesma pilha — não eventos.
2. **A *stack* alvo não tem mensageria, por decisão.** [`questions.md`](../questions.md) P10 e
   [`pending_decisions.md`](pending_decisions.md) § *Lacuna 1*: não há *broker*, não há DLQ, não há fila.
   Evento de domínio sem entrega assíncrona é só nome novo para chamada de método.
3. **Num caso, o evento quebraria a regra.** `BC-03` tem 12 regras **com ordem significativa e
   curto-circuito**, devolvendo 409 e 429 na mesma resposta. Publicar `comentario.submetido` e deixar
   *handlers* reagirem **perde as duas propriedades que são a regra** e troca a resposta por 202.

**O que o legado tem, e que se parece com evento sem ser** 🟢: o grafo medido registra **62 arestas de
publicação e 49 de assinatura, com peso somado 4.874** — e **todas as 111 apontam para dois destinos
internos**, o módulo `hooks-e-plugin-api` e o container `nucleo-compartilhado`. Não há um terceiro destino
**porque não há um fora do processo**
([`refactor/architectures.md`](../refactor/architectures.md) §7). O modelo mental já é orientado a eventos;
a **entrega**, não — e é a entrega que faria deles eventos de domínio.

> 📌 **Se a decisão de paradigma fosse revista para a Opção 1** (que foi **recusada**, `fit` 14 contra 86),
> esta seção passaria a ter as 9 máquinas de estado como fonte de evento — `ConteudoPublicado`,
> `ComentarioAprovado`, `SolicitacaoConfirmada`, `SiteArquivado`… — e as implicações 1, 3, 4 e 8 teriam de
> ser pagas item por item. Fica registrado para que a ausência desta seção seja legível como **decisão**, e
> não como esquecimento.

---

## Regras de domínio

Mapeamento das **117 regras MIGRAR** de [`target_business_rules.md`](target_business_rules.md) para o local
no domínio novo. **117 de 117 mapeadas**; nenhuma linha em branco.

### Publicação de conteúdo — 8 regras → `BC-01`

| Regra (ID) | Local no domínio novo | Origem |
|---|---|---|
| [BR-MIGRAR-001](target_business_rules.md#br-migrar-001) | `AGG-Conteudo`.invariante *publicar é ato explícito* | `P1` |
| [BR-MIGRAR-002](target_business_rules.md#br-migrar-002) | `AGG-Anexo`.invariante *anexo nunca é publicado* | `P2` |
| [BR-MIGRAR-003](target_business_rules.md#br-migrar-003) | `AGG-Conteudo` × `AGG-Termo`.invariante *categoria obrigatória* | `P3` |
| [BR-MIGRAR-004](target_business_rules.md#br-migrar-004) | `POL-Autorizacao` + `AGG-Conteudo`.comando `submeterParaRevisao` | `P4` |
| [BR-MIGRAR-005](target_business_rules.md#br-migrar-005) | `VO-Slug`.validação | `P5` |
| [BR-MIGRAR-006](target_business_rules.md#br-migrar-006) | `AGG-Conteudo`.comando `agendar` (comparação de data) | `P6` |
| [BR-MIGRAR-007](target_business_rules.md#br-migrar-007) | `AGG-Conteudo`.comando `publicar` (idempotente) | `P7` |
| [BR-MIGRAR-008](target_business_rules.md#br-migrar-008) | `POL-Autorizacao`.capacidade `unfiltered_html` + `utilitarios/kses` | `P8` |

### Moderação de interação pública — 12 regras → `BC-03`

> Todas as 12 vivem **na mesma cadeia**, e a **posição** de cada uma é parte da regra (AD-05).

| Regra (ID) | Local no domínio novo | Origem |
|---|---|---|
| [BR-MIGRAR-009](target_business_rules.md#br-migrar-009) | `AGG-Comentario`.cadeia **posição 1** → HTTP 409 | `C1` |
| [BR-MIGRAR-010](target_business_rules.md#br-migrar-010) | `AGG-Comentario`.cadeia **posição 4** → HTTP 429 | `C2` |
| [BR-MIGRAR-011](target_business_rules.md#br-migrar-011) | `AGG-Comentario`.cadeia **posição 3** (atalho, encerra) | `C3` |
| [BR-MIGRAR-012](target_business_rules.md#br-migrar-012) | `AGG-Comentario`.cadeia **posição 2** (encerra na primeira linha) | `C4` |
| [BR-MIGRAR-013](target_business_rules.md#br-migrar-013) | `AGG-Comentario`.cadeia **posição 7** | `C5` |
| [BR-MIGRAR-014](target_business_rules.md#br-migrar-014) | `AGG-Comentario`.cadeia **posição 6** (6 campos) | `C6` |
| [BR-MIGRAR-015](target_business_rules.md#br-migrar-015) | `AGG-Comentario`.cadeia **posição 8** | `C7` |
| [BR-MIGRAR-016](target_business_rules.md#br-migrar-016) | `AGG-Comentario`.cadeia **posição 10** | `C8` |
| [BR-MIGRAR-017](target_business_rules.md#br-migrar-017) | `AGG-Comentario`.cadeia **posição 5** → lixeira | `C9` |
| [BR-MIGRAR-018](target_business_rules.md#br-migrar-018) | `AGG-Comentario`.cadeia **posição 9** (erro, não truncamento) | `C10` |
| [BR-MIGRAR-019](target_business_rules.md#br-migrar-019) | `AGG-Comentario`.cadeia **posição 11** — reescreve **em memória** | `C11` |
| [BR-MIGRAR-020](target_business_rules.md#br-migrar-020) | `AGG-Comentario`.cadeia **posição 12** (nota editorial) | `C12` |

### Identidade e cadastro — 9 regras → `BC-05` e `BC-12`

| Regra (ID) | Local no domínio novo | Origem |
|---|---|---|
| [BR-MIGRAR-021](target_business_rules.md#br-migrar-021) | `AGG-Conta`.invariante *registro desligado por padrão* | `U1` |
| [BR-MIGRAR-022](target_business_rules.md#br-migrar-022) | `VO-Login` + `VO-Apelido`.validações | `U2` |
| [BR-MIGRAR-023](target_business_rules.md#br-migrar-023) | `VO-Login`.validação (lista vazia, só filtro) | `U3` |
| [BR-MIGRAR-024](target_business_rules.md#br-migrar-024) | `VO-ChaveDeAtivacao` (24 h) + `AGG-Conta`.comando `consumirChaveDeReset` | `U4` |
| [BR-MIGRAR-025](target_business_rules.md#br-migrar-025) | `AGG-Sessao`.invariante de duração (2 / 14 dias, 12 h) | `U5` |
| [BR-MIGRAR-026](target_business_rules.md#br-migrar-026) | `AGG-SenhaDeAplicacao` inteiro | `U6` |
| [BR-MIGRAR-027](target_business_rules.md#br-migrar-027) | `AGG-Cadastro`.invariante *reserva de 2 dias* — **`BC-12`** | `U7` |
| [BR-MIGRAR-028](target_business_rules.md#br-migrar-028) | `AGG-Rede`.invariante de domínio de e-mail — **`BC-12`** | `U8` |
| [BR-MIGRAR-029](target_business_rules.md#br-migrar-029) | `AGG-Cadastro`.comando `ativar` — **`BC-12`** | `U9` |

### Retenção e descarte — 8 regras → `BC-01`, `BC-04`, `BC-06`, `BC-11`, `BC-12`

| Regra (ID) | Local no domínio novo | Origem |
|---|---|---|
| [BR-MIGRAR-030](target_business_rules.md#br-migrar-030) | `AGG-Conteudo`.invariante de lixeira (30 dias) | `R1` |
| [BR-MIGRAR-031](target_business_rules.md#br-migrar-031) | `AGG-Conteudo`.comando `restaurarDaLixeira` → rascunho | `R2` |
| [BR-MIGRAR-032](target_business_rules.md#br-migrar-032) | `AGG-Anexo`.invariante `MEDIA_TRASH` — **`BC-04`** | `R3` |
| [BR-MIGRAR-033](target_business_rules.md#br-migrar-033) | `AGG-TarefaAgendada` (agenda) × `AGG-Conteudo` (executa) — auto-draft 7 dias | `R4` |
| [BR-MIGRAR-034](target_business_rules.md#br-migrar-034) | `AGG-TarefaAgendada`.invariante *agendada por visita autenticada* — **`BC-11`** | `R5` |
| [BR-MIGRAR-035](target_business_rules.md#br-migrar-035) | `AGG-TarefaAgendada`.invariante *tolera estado inconsistente* | `R6` |
| [BR-MIGRAR-036](target_business_rules.md#br-migrar-036) | `AGG-SolicitacaoDeDadoPessoal`.invariante *3 dias, varredura horária* — **`BC-06`** | `R7` |
| [BR-MIGRAR-037](target_business_rules.md#br-migrar-037) | `AGG-Cadastro` / `registration_log` **sem retenção** — **`BC-12`** | `R8` |

### Privacidade e dados pessoais — 7 regras → `BC-06` (e `BC-01` em uma)

| Regra (ID) | Local no domínio novo | Origem |
|---|---|---|
| [BR-MIGRAR-038](target_business_rules.md#br-migrar-038) | `AGG-SolicitacaoDeDadoPessoal` (armazenada como `Conteudo`) | `D1` |
| [BR-MIGRAR-039](target_business_rules.md#br-migrar-039) | `AGG-SolicitacaoDeDadoPessoal`.comando `confirmar` | `D2` |
| [BR-MIGRAR-040](target_business_rules.md#br-migrar-040) | `AGG-SolicitacaoDeDadoPessoal`.estado `request-failed` (**não** exceção) | `D3` |
| [BR-MIGRAR-041](target_business_rules.md#br-migrar-041) | `AGG-SolicitacaoDeDadoPessoal`.comando `expirar` (24 h) | `D3b` |
| [BR-MIGRAR-042](target_business_rules.md#br-migrar-042) | `POL-Autorizacao` + `AGG-Rede` — poder de rede | `D4` |
| [BR-MIGRAR-043](target_business_rules.md#br-migrar-043) | `POL-Autorizacao`.capacidade de privacidade sobre `AGG-Conteudo` | `D5` |
| [BR-MIGRAR-044](target_business_rules.md#br-migrar-044) | `VO-SenhaDeConteudo` em `AGG-Conteudo` — **`BC-01`** · 🔴 `BR-HUMANA-009` | `D6` |

### Atualização e manutenção do software — 12 regras → `BC-11`

| Regra (ID) | Local no domínio novo | Origem |
|---|---|---|
| [BR-MIGRAR-045](target_business_rules.md#br-migrar-045) | `AGG-AtualizacaoAutomatica`.invariante de pré-condição | `A1` |
| [BR-MIGRAR-046](target_business_rules.md#br-migrar-046) | `AGG-AtualizacaoAutomatica`.política de canal | `A2` |
| [BR-MIGRAR-047](target_business_rules.md#br-migrar-047) | `AGG-AtualizacaoAutomatica`.precedência constante > opção > filtro | `A3` |
| [BR-MIGRAR-048](target_business_rules.md#br-migrar-048) | `AGG-AtualizacaoAutomatica`.comando `verificarVersao` | `A4` |
| [BR-MIGRAR-049](target_business_rules.md#br-migrar-049) | `AGG-AtualizacaoAutomatica`.comando `congelar` | `A5` |
| [BR-MIGRAR-050](target_business_rules.md#br-migrar-050) | `AGG-AtualizacaoAutomatica`.invariante *uma segunda chance, zero e-mail* | `A6` |
| [BR-MIGRAR-051](target_business_rules.md#br-migrar-051) | `AGG-AtualizacaoAutomatica`.comando `notificarAdministrador` (sem repetição) | `A7` |
| [BR-MIGRAR-052](target_business_rules.md#br-migrar-052) | `adaptadores/sistema-de-arquivos` — **a assinatura não é verificada** (AD-09) | `A8` |
| [BR-MIGRAR-053](target_business_rules.md#br-migrar-053) | `AGG-TarefaAgendada` inteiro — **o disparo tem de falhar** (AD-07) | `A9` |
| [BR-MIGRAR-054](target_business_rules.md#br-migrar-054) | `AGG-ModoDeRecuperacao`.invariante de duração (1 semana, 1 aviso/dia) | `A10` |
| [BR-MIGRAR-055](target_business_rules.md#br-migrar-055) | `AGG-ModoDeRecuperacao`.comando `entrar` (só fora de *endpoint* público) | `A11` |
| [BR-MIGRAR-056](target_business_rules.md#br-migrar-056) | `AGG-ModoDeRecuperacao`.comando `retomarTodas` | `A12` |

### Mídia — 4 regras → `BC-04`

| Regra (ID) | Local no domínio novo | Origem |
|---|---|---|
| [BR-MIGRAR-057](target_business_rules.md#br-migrar-057) | `AGG-Anexo`.comando `enviar` (redução na ingestão) | `M1` |
| [BR-MIGRAR-058](target_business_rules.md#br-migrar-058) | `VO-TamanhoDeImagem` × 4 nativos | `M2` |
| [BR-MIGRAR-059](target_business_rules.md#br-migrar-059) | `VO-TamanhoDeImagem`.invariante *teto de 2048 px* | `M3` |
| [BR-MIGRAR-060](target_business_rules.md#br-migrar-060) | `AGG-Anexo`.comando `gerarDerivadas` — **falha silenciosa** | `M4` |

### Rede (multisite) — 7 regras → `BC-12`

| Regra (ID) | Local no domínio novo | Origem |
|---|---|---|
| [BR-MIGRAR-061](target_business_rules.md#br-migrar-061) | `AGG-SiteDaRede`.invariante dos 4 estados | `N1` |
| [BR-MIGRAR-062](target_business_rules.md#br-migrar-062) | `AGG-SiteDaRede`.`apagado` — **3 valores** | `N2` |
| [BR-MIGRAR-063](target_business_rules.md#br-migrar-063) | `AGG-SiteDaRede`.invariante *mesma resposta, campos distintos* | `N3` |
| [BR-MIGRAR-064](target_business_rules.md#br-migrar-064) | `AGG-SiteDaRede` + `POL-ContratoDeExtensao` (gancho de entrada e saída) | `N4` |
| [BR-MIGRAR-065](target_business_rules.md#br-migrar-065) | `AGG-SiteDaRede`.comando `criar` (mín. 4 caracteres) | `N5` |
| [BR-MIGRAR-066](target_business_rules.md#br-migrar-066) | `AGG-Rede`.comando `criarUsuario` | `N6` |
| [BR-MIGRAR-067](target_business_rules.md#br-migrar-067) | `AGG-SiteDaRede`.comando `repovoarPapeis` — **único ponto** | `N7` |

### Integração externa e IA — 7 regras → `BC-13` e `BC-09`

| Regra (ID) | Local no domínio novo | Origem |
|---|---|---|
| [BR-MIGRAR-068](target_business_rules.md#br-migrar-068) | `AGG-Conector`.comando `resolverCredencial` (precedência) | `I1` |
| [BR-MIGRAR-069](target_business_rules.md#br-migrar-069) | `AGG-Conector`.comando `resolverCredencial` (primeiro dois-pontos) | `I2` |
| [BR-MIGRAR-070](target_business_rules.md#br-migrar-070) | `AGG-Conector`.registro do Akismet | `I3` |
| [BR-MIGRAR-071](target_business_rules.md#br-migrar-071) | `AGG-Ability`.invariante *falta de callback é erro* — **`BC-09`** | `I4` |
| [BR-MIGRAR-072](target_business_rules.md#br-migrar-072) | `AGG-Ability` + `POL-ContratoDeExtensao` — filtrável **para conceder** | `I5` |
| [BR-MIGRAR-073](target_business_rules.md#br-migrar-073) | `AGG-Ability`.comando `executar` — curto-circuito **antes** de validar | `I6` |
| [BR-MIGRAR-074](target_business_rules.md#br-migrar-074) | `BC-09`.despachante REST — **falha ABERTA** · 🔴 `BR-HUMANA-008` | `I7` |

### Fronteira do banco — 12 regras → transversais (`plataforma/dados/` e o modelo de dados)

| Regra (ID) | Local no domínio novo | Origem |
|---|---|---|
| [BR-MIGRAR-075](target_business_rules.md#br-migrar-075) | `plataforma/dados/` — enumeração em `varchar(20)`, validada **na aplicação** | `DB-ENUM` |
| [BR-MIGRAR-076](target_business_rules.md#br-migrar-076) | `REG-Opcao` + `AGG-Termo` + `VinculoObjetoTermo` — as **3** garantias reais | `DB-UNIQ` |
| [BR-MIGRAR-077](target_business_rules.md#br-migrar-077) | `AGG-Conteudo`.`contadorDeComentarios` — recalculado e **suspensível** | `DB-TRG1` |
| [BR-MIGRAR-078](target_business_rules.md#br-migrar-078) | `AGG-Termo`.`contador` — **dois** critérios de cálculo | `DB-TRG2` |
| [BR-MIGRAR-079](target_business_rules.md#br-migrar-079) | `AGG-Conteudo`.comando `apagarDefinitivamente` — **reparenteia** | `DB-TRG3` |
| [BR-MIGRAR-080](target_business_rules.md#br-migrar-080) | `AGG-Termo`.comando `apagar` → termo padrão | `DB-TRG4` |
| [BR-MIGRAR-081](target_business_rules.md#br-migrar-081) | `VO-DataSentinela` · 🔴 `BR-HUMANA-003` **trava a estratégia** | `DB-SENT` |
| [BR-MIGRAR-082](target_business_rules.md#br-migrar-082) | `VO-EstruturaSerializada` + `Metadado` — *codec* de `serialize()` byte a byte | `DB-SER` |
| [BR-MIGRAR-083](target_business_rules.md#br-migrar-083) | `plataforma/dados/` — escrita inválida **se degrada**, não falha | `DB-DEG` |
| [BR-MIGRAR-084](target_business_rules.md#br-migrar-084) | `BC-11`.`instalador` — o esquema vazio **não é funcional** | `DB-SEED` |
| [BR-MIGRAR-085](target_business_rules.md#br-migrar-085) | `BC-11`.evolução por **comparação de estrutura** (`db_version` 61833) | `DB-MIG` |
| [BR-MIGRAR-086](target_business_rules.md#br-migrar-086) | `Conta`.`status` e `Comentario`.`karma` — colunas **mortas, preservadas** | `DB-DEAD` |

### Autorização — 13 regras → `POL-Autorizacao`, `BC-05` e `BC-09`

| Regra (ID) | Local no domínio novo | Origem |
|---|---|---|
| [BR-MIGRAR-087](target_business_rules.md#br-migrar-087) | `VO-Capacidade` é a unidade; `VO-Papel` é atalho | `PERM-1` |
| [BR-MIGRAR-088](target_business_rules.md#br-migrar-088) | `VO-Papel` em `Metadado` serializado **por site** — **`BC-05`** | `PERM-2` |
| [BR-MIGRAR-089](target_business_rules.md#br-migrar-089) | `POL-Autorizacao`.tradução de capacidade sobre objeto (86 casos) | `PERM-3` |
| [BR-MIGRAR-090](target_business_rules.md#br-migrar-090) | `POL-Autorizacao` — **todo caminho de erro fecha a porta** | `PERM-4` |
| [BR-MIGRAR-091](target_business_rules.md#br-migrar-091) | `POL-Autorizacao`.11 negações absolutas (40 `do_not_allow`) | `PERM-5` |
| [BR-MIGRAR-092](target_business_rules.md#br-migrar-092) | `POL-Autorizacao`.10 atalhos de nomenclatura | `PERM-6` |
| [BR-MIGRAR-093](target_business_rules.md#br-migrar-093) | `VO-Capacidade` — **4** concedidas só por filtro | `PERM-7` |
| [BR-MIGRAR-094](target_business_rules.md#br-migrar-094) | `POL-Autorizacao`.4 constantes que **retiram** poder | `PERM-8` |
| [BR-MIGRAR-095](target_business_rules.md#br-migrar-095) | `POL-Autorizacao` + `AGG-Rede` — negação explícita **vence o super admin** + [ADR-0009](../adrs/0009-negacao-explicita-que-vence-o-super-admin.md) | `PERM-9` |
| [BR-MIGRAR-096](target_business_rules.md#br-migrar-096) | `VO-Papel` em rede — administrador de site é *"editor com configuração"* | `PERM-10` |
| [BR-MIGRAR-097](target_business_rules.md#br-migrar-097) | `BC-09` — as **3 camadas paralelas**, cada uma com a sua falha padrão | `PERM-11` |
| [BR-MIGRAR-098](target_business_rules.md#br-migrar-098) | **5 pontos sem capacidade**: `VO-SenhaDeConteudo`, `VO-ChaveDeAtivacao` (×3) e a autoria por remetente de e-mail | `PERM-12` |
| [BR-MIGRAR-099](target_business_rules.md#br-migrar-099) | `VO-Papel` — a definição é **retrato tirado na instalação** | `PERM-13` |

### Máquinas de estado — 2 regras

| Regra (ID) | Local no domínio novo | Origem |
|---|---|---|
| [BR-MIGRAR-100](target_business_rules.md#br-migrar-100) | as **9** máquinas, uma por aggregate — tabela abaixo | `SM-ALL` |
| [BR-MIGRAR-101](target_business_rules.md#br-migrar-101) | `AGG-Changeset` — **`BC-07`** | `SM-CHANGESET` |

As 9 máquinas de [`state-machines.md`](../state-machines.md), cada uma com **exatamente um** aggregate dono:

| Máquina do legado | Aggregate dono | Contexto |
|---|---|---|
| `conteudo-post_status` | `AGG-Conteudo` | `BC-01` |
| `comentario-comment_approved` | `AGG-Comentario` | `BC-03` |
| `anexo-post_status` | `AGG-Anexo` | `BC-04` |
| `solicitacao-de-dados-pessoais-user_request` | `AGG-SolicitacaoDeDadoPessoal` | `BC-06` |
| `changeset-do-customizer` | `AGG-Changeset` | `BC-07` |
| `cadastro-em-rede-signups-active` | `AGG-Cadastro` | `BC-12` |
| `site-da-rede-quatro-campos` | `AGG-SiteDaRede` | `BC-12` |
| `atualizacao-automatica-do-nucleo` | `AGG-AtualizacaoAutomatica` | `BC-11` |
| `modo-de-recuperacao-e-extensao-pausada` | `AGG-ModoDeRecuperacao` | `BC-11` |

E as **4 entidades sem máquina de estado** que [`state-machines.md`](../state-machines.md) registra —
`users`, `terms`, `options`, `wp_links` — mapeiam para `AGG-Conta`, `AGG-Termo`, `REG-Opcao` e
`Marcador`. **Nenhuma ganha máquina de estado no alvo**: inventar estado que o legado não tem violaria o
critério de idêntico.

### Contrato de extensão — 5 regras → `plataforma/`

| Regra (ID) | Local no domínio novo | Origem |
|---|---|---|
| [BR-MIGRAR-102](target_business_rules.md#br-migrar-102) | `POL-ContratoDeExtensao` em `plataforma/barramento/` — 2.460 pontos **com retorno** (AD-03) | `EXT-FILTROS` |
| [BR-MIGRAR-103](target_business_rules.md#br-migrar-103) | `plataforma/registro/` — 38 substituíveis, 176 guardas, 4 *drop-ins* | `EXT-SUBST` |
| [BR-MIGRAR-104](target_business_rules.md#br-migrar-104) | `AGG-Conteudo`.comando `apagarDefinitivamente` — 7 etapas e 3 contadores, **comportamento observável** | `EXT-EXCLUSAO` |
| [BR-MIGRAR-105](target_business_rules.md#br-migrar-105) | `plataforma/contexto/` — **pré-requisito**, não refinamento (AD-02) | `EXT-CONTEXTO` |
| [BR-MIGRAR-106](target_business_rules.md#br-migrar-106) | `plataforma/arranque/` + `VO-PrioridadeDeGancho` | `EXT-ORDEM` |

### Escopo declarado — 11 regras

| Regra (ID) | Local no domínio novo | Origem |
|---|---|---|
| [BR-MIGRAR-107](target_business_rules.md#br-migrar-107) | `BC-09` (3 superfícies) + `BC-10` (telas e editor de arquivo) | `ESC-SUPERFICIES` |
| [BR-MIGRAR-108](target_business_rules.md#br-migrar-108) | `POL-ContratoDeExtensao` — **toda** regra deste documento é *default* filtrável | `ESC-FILTRAVEL` |
| [BR-MIGRAR-109](target_business_rules.md#br-migrar-109) | `BC-12` como contexto **que pode estar ausente** | `ESC-MULTISITE` |
| [BR-MIGRAR-110](target_business_rules.md#br-migrar-110) | `AGG-Conta`.invariante da mensagem de erro de login | `ESC-ENUMERACAO` |
| [BR-MIGRAR-111](target_business_rules.md#br-migrar-111) | `AGG-Sessao` — trocar senha **não** revoga | `ESC-SESSAO` |
| [BR-MIGRAR-112](target_business_rules.md#br-migrar-112) | `AGG-TarefaAgendada` — as **2** travas de tempo, e **nenhum** limite de taxa | `ESC-LIMITE-TAXA` |
| [BR-MIGRAR-113](target_business_rules.md#br-migrar-113) | **nenhum aggregate ganha prazo de retenção** — ausência deliberada | `ESC-RETENCAO` |
| [BR-MIGRAR-114](target_business_rules.md#br-migrar-114) | `AGG-Conector` + `AGG-Ability` — 🔴 os 3 conectores **sem provedor** | `ESC-IA` |
| [BR-MIGRAR-115](target_business_rules.md#br-migrar-115) | `AGG-Conector`.comando `rebaixarParaHttp` + `adaptadores/cliente-http` (AD-09) | `ESC-HTTP` |
| [BR-MIGRAR-116](target_business_rules.md#br-migrar-116) | critério de aceite **por área** — governa a verificação de todos os aggregates | `ESC-ORACULO` |
| [BR-MIGRAR-117](target_business_rules.md#br-migrar-117) | `BC-07` e `BC-09` — só o **lado servidor**; o cliente é dependência cravada | `ESC-CLIENTE` |

---

## Rastreabilidade para o legado

| Elemento novo | Origem no legado | Tipo de mapeamento |
|---|---|---|
| `AGG-Conteudo` | [`domain.md`](../domain.md) §2.1 + [`state-machines.md`](../state-machines.md) `conteudo-post_status` + `posts` | **fundido** — regra, máquina e tabela num aggregate |
| `AGG-Revisao` | `wp-includes/revision.php` + `posts` com `post_type='revision'` | **dividido** de `posts` |
| `AGG-Termo` | `terms` + `term_taxonomy` + `term_relationships` + `links` | **fundido** — 4 tabelas, 1 aggregate |
| `AGG-Comentario` | [`domain.md`](../domain.md) §2.2 (12 regras) + `comments` | **fundido** |
| `AGG-Anexo` | `posts` com `post_type='attachment'` + `postmeta` + [`domain.md`](../domain.md) mídia | **dividido** de `posts` — justificado por `R3` |
| `AGG-Conta` | [`domain.md`](../domain.md) §2.3 + `users` | **1-para-1** |
| `AGG-Sessao` | `usermeta` (`session_tokens`) + `wp-includes/pluggable.php:855`–`:867` | **dividido** de `usermeta` |
| `AGG-SenhaDeAplicacao` | `usermeta` + `class-wp-application-passwords.php` | **dividido** de `usermeta` |
| `AGG-SolicitacaoDeDadoPessoal` | `posts` com `post_type='user_request'` + [`domain.md`](../domain.md) §2.5 | **dividido** de `posts` — justificado por regime |
| `AGG-Tema` | `class-wp-theme.php` + `class-wp-theme-json.php` + `options` | **fundido** |
| `AGG-Changeset` | `posts` com `post_type='customize_changeset'` + `SM-CHANGESET` | **dividido** de `posts` |
| `AGG-AreaDeWidget` | `options` ([`domain.md`](../domain.md) §1.3) | **dividido** de `options` |
| `AGG-MenuDeNavegacao` | `posts` (`nav_menu_item`) + `term_taxonomy` (`nav_menu`) | **fundido** de 2 tabelas de 2 contextos |
| `AGG-Ability` | `wp-includes/abilities.php:90`, `:207`, `:294` | **novo como aggregate** — o legado tem registro, não aggregate |
| `AGG-AtualizacaoAutomatica` | [`domain.md`](../domain.md) §2.6 + `options` (`auto_core_update_failed`) | **fundido** |
| `AGG-ModoDeRecuperacao` | `state-machines.md` + 5 classes de modo de recuperação | **fundido** |
| `AGG-TarefaAgendada` | `options` (`cron`) + `wp-cron.php` + as **4** implementações de *loopback* | **fundido** — e é o que dá dono único |
| `AGG-Rede` | `site` + `sitemeta` | **fundido** |
| `AGG-SiteDaRede` | `blogs` + `blogmeta` + `SM site-da-rede-quatro-campos` | **fundido** |
| `AGG-Cadastro` | `signups` + `registration_log` | **fundido** |
| `AGG-Conector` | `wp-includes/connectors.php:290`–`:325` + `options` | **1-para-1** |
| `REG-TipoDeConteudo` | `wp-includes/post.php` (registro de tipo) | **dividido** de `posts-e-tipos-de-conteudo` |
| `REG-Opcao` | `options` + as 4 tabelas de metadado | **fundido** |
| `POL-Autorizacao` | [`permissions.md`](../permissions.md) inteiro (5 papéis, 93 capacidades, 86 casos de tradução) | **novo como política** — no legado é função global |
| `POL-ContratoDeExtensao` | 3.373 pontos de gancho + 38 substituíveis + 4 *drop-ins* | **novo como política** — no legado é tabela de funções do PHP |
| `plataforma/contexto/` | **nada** — não existe no legado | **novo por necessidade** — ver [`discard_log.md`](discard_log.md) e implicação 2 |
| `entradas/` (roteador) | **nada** — os 109 *front controllers* são a tabela de rotas | **novo** — é a indireção que a *stack* alvo tem |
| Arnês de paridade | **nada** | **novo** — exigido por `ESC-ORACULO` |
| 5 `permission_callback` de *ability* do Akismet, 2 descartadas | `wp-content/plugins/akismet/abilities/` | **removido** — `BR-DESCARTAR-003`, fora de escopo |
| 6 bibliotecas vendorizadas que nada chama | `wp-includes/` | **removido** — [`discard_log.md`](discard_log.md) · 🔴 `BR-HUMANA-006` |
| lado cliente dos 5 módulos do editor | `wp-includes/js/dist/` — **ausente desta árvore** | **removido do porte** — `ESC-CLIENTE` |

**Cobertura**: os **21 aggregates**, **2 registros** e **2 políticas** cobrem as **117 regras MIGRAR**, as
**9 máquinas de estado**, as **4 entidades sem máquina** e as **18 tabelas** do esquema. Nenhum elemento
novo está sem origem no legado ou sem apontar para [`discard_log.md`](discard_log.md), como a regra absoluta
do SKILL exige.

---

## Notas

**Para o agente de codificação, em uma frase:** a única lista deste documento em que a **ordem é a regra**
é a de invariantes de `AGG-Comentario` — reordená-la muda comportamento observável, e nenhum dos 985 testes
especificados apanharia isso.

1. **Quatro aggregates são `posts` por armazenamento e não são conteúdo por regra**: `AGG-Anexo`,
   `AGG-SolicitacaoDeDadoPessoal`, `AGG-Changeset` e `AGG-MenuDeNavegacao` (parcial). **A forma de
   armazenamento não decidiu o contexto em nenhum dos quatro**, e cada um tem a justificativa escrita. É a
   decisão de modelagem mais repetida deste documento, e a mais fácil de "corrigir" por engano.

2. **Três invariantes do legado são, pelo padrão da indústria, defeitos — e migram inteiras.**
   `VO-SenhaDeConteudo` é texto claro com comparação literal, sem prazo e sem limite de tentativa (`D6`);
   `AGG-Conta` distingue conta inexistente de senha incorreta na mensagem de erro (`ESC-ENUMERACAO`);
   `AGG-Sessao` não é revogada por troca de senha (`ESC-SESSAO`). As três são **decisão humana já
   registrada**, e consertá-las é mudança no que o usuário conhece hoje — não é bug a corrigir de ofício.
   🔴 `BR-HUMANA-009` cobre a primeira.

3. **Cinco pontos decidem acesso sem consultar o modelo de capacidades** (`PERM-12`), e por isso aparecem
   como *value object* e não como política: senha de post, as três formas de `VO-ChaveDeAtivacao` e a
   autoria por remetente de e-mail (**falsificável**). Quem portar lendo só
   [`permissions.md`](../permissions.md) produz um sistema **mais fechado** do que o legado — que é o
   achado 2 do agente de casos de uso, e vale repetido aqui porque este é o documento que o codificador lê.

4. **Duas correções a artefatos anteriores já estavam registradas e são aplicadas aqui**, não reabertas:
   (a) as **cinco** *abilities* registradas, contra a afirmação de [`permissions.md`](../permissions.md)
   §8.1 de que não há nenhuma — logo `AGG-Ability` tem âncora de código; (b) `blogs.deleted` tem o valor
   **2** ("não ativado") e não só `0`/`1`, contra o que o dicionário de dados descreve — logo
   `AGG-SiteDaRede` tem **3** valores e não 2.

5. 🔴 **Três lacunas que impedem fechar uma invariante, e que não foram contornadas por invenção**:
   `BR-HUMANA-003` (o significado do sentinela de data, que **trava a estratégia**, não só o desenho),
   `BR-HUMANA-005` (a equivalência das 4 implementações de *loopback*) e `BR-HUMANA-007` (a invariante não
   declarada que destrava a atualização automática). Em cada caso o aggregate existe e a invariante está
   marcada 🔴 **no lugar em que faltaria**, não só nesta nota.

6. **Cobertura limitada por `BR-HUMANA-004`, e vale dito no documento que mais depende disso.** **15 dos 71
   módulos não têm spec alguma** (achado A-01), e entre eles estão o 2º, 3º, 5º, 14º e 16º mais dependidos.
   Regra que viva **somente** nesses 15 módulos **não está neste modelo** — não porque foi descartada, mas
   porque ninguém a escreveu ainda.
