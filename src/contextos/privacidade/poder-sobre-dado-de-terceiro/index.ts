/**
 * `poder-sobre-dado-de-terceiro/` — **T017** da feature
 * `008-privacidade-e-dados-pessoais`: *"tratar exportar e apagar dado de
 * terceiro como poder do nivel mais alto da instalacao"* (US-8, `REQ-095`).
 *
 * | arquivo | o que e | criterio |
 * |---|---|---|
 * | `caso-de-poder-de-privacidade.ts` | o `case` de tres rotulos de `capabilities.php:795`-`:799`, e a pergunta sobre a matriz que `CA-8.3` faz | `CA-8.1`, `CA-8.2`, `CA-8.3` |
 * | `permissao-nas-telas-de-dado-pessoal.ts` | os quatro portoes que consomem esses nomes, com o `msgid` de cada recusa | `CA-8.1`, `CA-8.2` |
 * | `us-8-poder-sobre-dado-de-terceiro.test.ts` | os quatro criterios afirmados | todos |
 *
 * Esta pasta **nao tem operacao de modulo**, e por isso `criarModuloDePrivacidade()`
 * nao mudou: US-8 nao e um verbo, e a resolucao de capacidade. O `P4` pede que
 * *"toda operacao exposta nova nasca com declaracao explicita de permissao"*, e e
 * o contrario que acontece aqui — esta tarefa **e** a declaracao de permissao das
 * operacoes que ainda vao nascer, e a tabela de `ModuloDePrivacidade` aponta para
 * ela. A decisao e funcao pura sobre o `ContextoDeAutorizacao` da requisicao, sem
 * estado de modulo (`EXT-CONTEXTO`, BR-MIGRAR-105).
 *
 * ---
 *
 * # `CA-8.4` nao tem codigo nesta pasta, e a razao esta no legado
 *
 * *"Apagar a pagina de politica de privacidade exige a capacidade de privacidade
 * somada as capacidades normais de apagar conteudo"* (`D5`, BR-MIGRAR-043).
 *
 * No legado esse ramo **nao pergunta** por `manage_privacy_options`: ele **soma**
 * o que a traducao dela devolveu, dentro do `case` de conteudo —
 * `$caps = array_merge( $caps, map_meta_cap( 'manage_privacy_options', $user_id ) );`,
 * em `wp-includes/capabilities.php:180` ao apagar e `:283` ao editar, cada um
 * guardado pelo mesmo `if ( (int) get_option( 'wp_page_for_privacy_policy' ) === $post->ID )`
 * (`:179` e `:282`).
 *
 * O `case` de conteudo e da feature `001` (US-8 / T017 daquela feature) e ja esta
 * portado, com esse ramo, em
 * `plataforma/autorizacao/traducao-de-conteudo.ts` — e o *ramo 7* de
 * `resolverPorAutoriaEEstado()`, que chama a mesma `capacidadesDePrivacidade()`
 * que o caso desta pasta chama. Reimplementar o ramo aqui produziria **duas**
 * copias da mesma soma, e a segunda so poderia divergir da primeira; o `P8` e a
 * regra de dependencia 3 fecham a outra saida, que seria mover o ramo para ca.
 *
 * O que esta tarefa faz por `CA-8.4`, entao, e **afirma-lo**: a suite desta pasta
 * monta a pagina de politica, exercita `casoDeConteudo()` e cobra os dois lados —
 * o ator com as capacidades de apagar mas sem a de privacidade e recusado, e o
 * mesmo ator com as duas passa. E o que o cenario `@regulatorio` de `PT-012`
 * pede, com estas palavras: *"um ator sem a capacidade de privacidade tenta
 * apaga-la: as duas metades negam, com a mesma mensagem; um ator com a
 * capacidade tenta: as duas permitem, com o mesmo efeito no banco"*.
 *
 * # O que fica fora, e de quem e
 *
 * | o que | de quem |
 * |---|---|
 * | o HTML das telas, a resposta HTTP da recusa e o `nonce` das acoes | **BC-10** (`plataforma/telas`), `SCR-080`, `SCR-081`, `SCR-092`, `SCR-093` e `SCR-112` |
 * | a resposta das duas operacoes nomeadas que repetem estes portoes | **BC-11** (`superficies-programaticas`) — a mensagem delas esta declarada em `permissao-nas-telas-de-dado-pessoal.ts` |
 * | a matriz de papeis gravada, e a rotina que a povoa | **BC-05** (`contextos/identidade-e-acesso/armazenamento/`). A regra de dependencia 3 proibe importa-la daqui; a suite a **transcreve** de `wp-admin/includes/schema.php`, como `contextos/midia` ja fazia |
 * | o recorte de rede de `PERM-10` e as quatro constantes do dono do servidor | `plataforma/autorizacao/revogacao-por-constante.ts` |
 * | o barramento que dispararia `user_has_cap` a cada pergunta | `REQ-162`, em `do-not-rewrite.md` |
 */

export {
  CAPACIDADES_DE_DADO_PESSOAL_DE_TERCEIRO,
  CAPACIDADES_DO_PODER_DE_PRIVACIDADE,
  CAPACIDADE_DE_ADMINISTRAR_PRIVACIDADE,
  CAPACIDADE_DE_APAGAR_DADO_DE_TERCEIRO,
  CAPACIDADE_DE_EXPORTAR_DADO_DE_TERCEIRO,
  casoDePoderDePrivacidade,
  papeisQueConcedemPoderDePrivacidade,
} from './caso-de-poder-de-privacidade.js';

export {
  CAPACIDADE_DE_APAGAR_CONTAS,
  MENSAGENS_DAS_TELAS_DE_DADO_PESSOAL,
  MENSAGEM_DA_OPERACAO_NOMEADA,
  permissaoDeAdministrarPrivacidade,
  permissaoDeApagarDadoDeTerceiro,
  permissaoDeExportarDadoDeTerceiro,
  podeComOPoderDePrivacidade,
  type MotivoDaRecusaDeDadoPessoal,
  type RecusaDeDadoPessoal,
} from './permissao-nas-telas-de-dado-pessoal.js';
