/**
 * Os nomes das duas tabelas desta feature, o tipo de registro e as duas chaves
 * de metadado que a solicitacao carrega.
 *
 * Entrega de **T002** da feature `008-privacidade-e-dados-pessoais`:
 * *"a solicitacao existe como tipo de conteudo proprio"*.
 * `satisfaz: — (infraestrutura)`.
 *
 * **Sao duas tabelas, e nenhuma e nova.** `target_data_model.md` poe `{p}posts`
 * e `{p}postmeta` como donas da solicitacao — *"`SolicitacaoDeDadoPessoal` |
 * `{p}posts` (`post_type='user_request'`) | `AGG-SolicitacaoDeDadoPessoal`"* e
 * *"`MetadadoDeConteudo` | `{p}postmeta` | o aggregate possuidor | `BC-01` /
 * `BC-04` / `BC-06` / `BC-07`"* —, e o documento diz o que fazer com a
 * sobreposicao: *"Isso **nao** e erro de modelagem a corrigir — e a forma do
 * legado, e separa-las em tabelas proprias mudaria `erd-complete.md` §3 e
 * quebraria a coexistencia"*. O cenario `@invariante` de `PT-012` cobra a mesma
 * coisa pelo avesso: *"nenhuma das duas cria tabela propria para a
 * solicitacao"*.
 *
 * As duas estao no bloco **ESCOPO POR SITE** do DDL, logo as duas levam o
 * prefixo **do site** — numa rede, `wp_2_posts` e `wp_2_postmeta`. O prefixo
 * **base**, que localiza as tabelas globais, nao esta na porta deste modulo de
 * proposito (ver `../portas/porta-de-dados.ts`): a conta do titular e dado de
 * BC-05, alcancado por ligacao tardia (AD-10), e nao por consulta daqui.
 *
 * **Nao ha nome montado a mao fora deste arquivo.** A nota 3 de
 * `target_data_model.md` registra por que isso importa numa instalacao de rede:
 * *"o prefixo de tabela nao e so configuracao de conexao: ele e dado"*.
 */

import type { PortaDeDados } from '../portas/index.js';

/** `{site}posts` — o registro universal de conteudo, com 23 colunas. */
export function tabelaDeConteudo(dados: PortaDeDados): string {
  return `${dados.prefixoDeTabela}posts`;
}

/** `{site}postmeta` — a extensao aberta em par chave e valor, com 4 colunas. */
export function tabelaDeMetadadosDeConteudo(dados: PortaDeDados): string {
  return `${dados.prefixoDeTabela}postmeta`;
}

/**
 * `user_request` — o valor de `post_type` que discrimina a solicitacao.
 *
 * `D1` / BR-MIGRAR-038, 🟢: *"A solicitacao e um Post. Exportacao e apagamento
 * de dados pessoais vivem como `post_type = 'user_request'` com quatro status
 * dedicados"*. O registro esta em `wp-includes/post.php:285`, dentro de
 * `create_initial_post_types()`, e o proprio legado explica por que o tipo
 * existe: *"Requests are stored inside a post type named `user_request` since
 * they can apply to both users on the site, or guests without a user account"*
 * (`wp-includes/user.php:4790`). E essa frase que faz CA-1.3 valer — *"titular
 * sem conta no site tem solicitacao valida do mesmo jeito"*.
 *
 * ⚠️ **O valor e a cadeia do legado, byte a byte**, porque e ela que vai para a
 * coluna, e porque e ela que aparece em tres guardas de leitura que devolvem
 * falso em vez de erro: `wp_get_user_request` (`user.php:5138`),
 * `_wp_privacy_resend_request` (`wp-admin/includes/privacy-tools.php:22`) e o
 * laco da lista. Ver `./solicitacao.ts`.
 *
 * **Sete propriedades do registro do tipo sao observaveis e nao sao deste
 * arquivo** (`post.php:291` a `:298`): `public => false`, `hierarchical =>
 * false`, `rewrite => false`, `query_var => false`, `can_export => false`,
 * `delete_with_user => false` e `supports => array()` — mais `_builtin => true`
 * e os dois rotulos traduziveis de `:287`. Elas moram no registro
 * de tipos de conteudo, que `target_domain_model.md` poe em `REG-TipoDeConteudo`
 * e **nao** neste contexto; o que vale aqui, e que esta declarado para a proxima
 * onda nao redescobrir, e a consequencia de `delete_with_user => false`:
 * **apagar a conta do titular nao apaga a solicitacao dele**, o que e o
 * complemento exato de UC-27 — *"o arquivo expira; o registro nao"*.
 */
export const TIPO_DE_SOLICITACAO = 'user_request';

/**
 * `_wp_user_request_confirmed_timestamp` — o instante em que o titular
 * confirmou, em segundos inteiros.
 *
 * Lido por `WP_User_Request` (`wp-includes/class-wp-user-request.php:117`) e
 * gravado por `_wp_privacy_account_request_confirmed` (`wp-includes/user.php:4256`),
 * **antes** da mudanca de estado — a ordem dos dois comandos e observavel e esta
 * em `./solicitacao.ts`. Quem o grava e **T005** (US-2).
 */
export const CHAVE_DO_INSTANTE_DE_CONFIRMACAO =
  '_wp_user_request_confirmed_timestamp';

/**
 * `_wp_user_request_completed_timestamp` — o instante em que a solicitacao foi
 * executada, em segundos inteiros.
 *
 * Lido por `WP_User_Request` (`class-wp-user-request.php:118`) e gravado por
 * `_wp_privacy_completed_request` (`wp-admin/includes/privacy-tools.php:55`),
 * tambem **antes** da mudanca de estado. Quem o grava e **T011** (US-5) e
 * **T013** (US-6).
 */
export const CHAVE_DO_INSTANTE_DE_CONCLUSAO =
  '_wp_user_request_completed_timestamp';

/*
  ── AS OUTRAS SETE CHAVES DE METADADO DESTA FEATURE, E DE QUEM SAO ──────────

  `WP_User_Request` le **duas** chaves, e sao as duas de cima: elas fazem parte
  da forma da solicitacao, logo sao de T002. As outras sete vivem na mesma
  tabela, pertencem ao mesmo registro e **nao** sao desta tarefa. Ficam
  declaradas aqui, com a ancora, para que a tarefa de cada uma nao as
  redescubra e para que ninguem invente nome parecido:

  | chave | o que guarda | ancora | tarefa |
  |---|---|---|---|
  | `_wp_admin_notified` | que o aviso ao administrador ja saiu | `user.php:4282` (le), `:4474` (grava) | T005 |
  | `_wp_user_notified` | que o aviso ao titular ja saiu | `user.php:4494` (le), `:4745` (grava) | T011, T013 |
  | `_export_data_raw` | o parcial acumulado entre paginas | `privacy-tools.php:807`, `:809`, `:818`, `:861` | T011 |
  | `_export_data_grouped` | o parcial agrupado | `privacy-tools.php:400`, `:862`, `:874` | T011 |
  | `_export_file_name` | o nome do arquivo gerado | `privacy-tools.php:513`, `:525`, `:535`, `:614` | T011, T015 |
  | `_export_file_path` | o caminho em disco | `privacy-tools.php:516`, `:529` | T011, T015 |
  | `_export_file_url` | o endereco publico | `privacy-tools.php:528` | T011, T015 |

  Tres coisas dessa tabela que um porte perde, e que estao aqui porque sao
  **efeito no banco** (area 3 da Decisao 2 de `parity_specs.md`):

  1. **`_wp_admin_notified` e `_wp_user_notified` sao o que torna o aviso
     idempotente**, e nao o estado da solicitacao. O legado le as duas com
     `(bool) get_post_meta( ..., true )` e **desiste** quando ja avisou
     (`user.php:4284` e `:4496`). E disso que depende o cenario
     `@idempotencia` de `PT-012` — *"o numero de e-mails ao titular e o mesmo
     nas duas"*.
  2. **`_export_data_raw` e apagado e `_export_data_grouped` e gravado no mesmo
     trecho** (`privacy-tools.php:861` e `:862`), e e esse acumulo em metadado —
     nao estado em memoria — que faz CA-5.6 valer: *"uma execucao interrompida
     pode ser retomada do ponto em que parou"*.
  3. **A varredura do arquivo (US-7) apaga o arquivo e deixa as chaves.** UC-27
     e literal: *"o arquivo expira; o registro nao"*, e CA-7.4 repete. Apagar
     metadado ali seria apagar a prova do procedimento.
*/
