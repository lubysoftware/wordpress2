/**
 * O portao da instalacao de catalogo novo: **quem pode pedir, e quando o painel
 * oferece.**
 *
 * Tarefa **T009** da feature `015-plataforma-transversal` — US-4. Satisfaz
 * **CA-4.4**: *"a instalacao de catalogo novo exige a capacidade declarada, e essa
 * capacidade consta da matriz"*.
 *
 * ---
 *
 * ## A metade que ja estava na arvore
 *
 * **A capacidade consta da matriz.** `install_languages` nao esta em papel algum
 * no legado e entra por ponto de extensao em prioridade `1`
 * (`wp_maybe_grant_install_languages_cap()`, `wp-includes/capabilities.php:1309`,
 * registrada em `wp-includes/default-filters.php:771`). Isso e `PERM-7`
 * (BR-MIGRAR-093), fechado por T019 da feature `001` em
 * `plataforma/autorizacao/concessao-por-extensao.ts` e declarado no catalogo de
 * capacidades (`plataforma/autorizacao/catalogo-de-capacidades.ts`). Esta tarefa
 * **nao** reimplementa a concessao e nao declara capacidade nova:
 * {@link CAPACIDADE_DE_INSTALAR_CATALOGO} e o mesmo nome, e a pergunta de
 * permissao chega por argumento — ligacao tardia, porque a decisao e de
 * `plataforma/autorizacao/` e este modulo nao a importa.
 *
 * ## A metade desta tarefa: os dois portoes do painel
 *
 * O legado nao tem um portao so. Sao dois, e os dois perguntam a capacidade
 * **antes** de qualquer outra coisa:
 *
 * | portao | onde | aqui |
 * |---|---|---|
 * | capacidade **e** sistema de arquivos sem pedir credencial | `wp-admin/options-general.php:358`, `wp-admin/user-edit.php:392`, `wp-admin/includes/user.php:129`, `wp-admin/network/settings.php:112` e `:475`, `wp-admin/network/site-new.php:78` e `:269` | {@link instalacaoDeCatalogoPossivel} |
 * | so a capacidade | `wp-admin/options.php:307` — gravar as opcoes gerais com um idioma novo | {@link instalacaoDeCatalogoAutorizada} |
 *
 * O primeiro decide se o painel **oferece** os idiomas disponiveis para baixar
 * (`show_available_translations`) e se baixa ao gravar o perfil ou o site da
 * rede; o segundo e a gravacao das opcoes gerais, que baixa sem perguntar pelo
 * sistema de arquivos — quem pergunta, ali, e `wp_download_language_pack()`
 * (`wp-admin/includes/translation-install.php:254`), so por
 * `wp_is_file_mod_allowed()`.
 *
 * ## 🔴 O caminho em que o legado instala catalogo SEM capacidade
 *
 * **O instalador.** `wp-admin/install.php:374` e `wp-admin/setup-config.php:148`
 * chamam `wp_download_language_pack()` sem perguntar capacidade nenhuma — e nao
 * teriam a quem perguntar: a conta ainda nao existe. CA-4.4, lido ao pe da letra
 * (*"a instalacao de catalogo novo exige a capacidade"*), e mais largo que o
 * legado. Esta tarefa nao constroi o instalador (e a feature `015`, US-6, e
 * UC-43), e **nao** fecha a diferenca: quem construir o instalador **nao** aplica
 * estes portoes la, porque o legado nao aplica (P1). Registrado em `./README.md`.
 *
 * ## O que este arquivo nao faz
 *
 * Baixar e escrever o catalogo. Isso e `wp_download_language_pack()` e o
 * `Language_Pack_Upgrader`, o mecanismo de UC-33, que toca as respostas 11 e 12
 * de `questions.md` (pacote sem assinatura verificada, rebaixamento para canal
 * sem cifra) — as duas na tabela *Nao negociavel*. Nenhuma tarefa desta feature o
 * constroi.
 */

/** A capacidade que os dois portoes perguntam. Consta da matriz por `PERM-7`. */
export const CAPACIDADE_DE_INSTALAR_CATALOGO = 'install_languages';

/** `current_user_can( $capability )`, por ligacao tardia. */
export type PerguntaDeCapacidade = (capacidade: string) => boolean;

/**
 * `wp_can_install_language_pack()`
 * (`wp-admin/includes/translation-install.php:302`): o sistema de arquivos
 * aceita escrever em `WP_CONTENT_DIR` e `WP_LANG_DIR` sem pedir credencial.
 * Ligacao tardia: e a borda de sistema de arquivos, e a pergunta abre conexao.
 */
export type SistemaDeArquivosAceitaCatalogo = () => boolean;

/**
 * O portao de `wp-admin/options.php:307`: **so a capacidade.**
 */
export function instalacaoDeCatalogoAutorizada(
  temCapacidade: PerguntaDeCapacidade,
): boolean {
  return temCapacidade(CAPACIDADE_DE_INSTALAR_CATALOGO);
}

/**
 * O portao das outras seis chamadas: `current_user_can( 'install_languages' ) &&
 * wp_can_install_language_pack()`.
 *
 * ⚠️ **A ordem e regra, nao estilo.** O `&&` do legado nao chega a conectar no
 * sistema de arquivos quando falta a capacidade, e a conexao e efeito
 * observavel na borda. Por isso a segunda pergunta e funcao, e so e chamada
 * quando a primeira deu sim.
 */
export function instalacaoDeCatalogoPossivel(
  temCapacidade: PerguntaDeCapacidade,
  sistemaDeArquivosAceita: SistemaDeArquivosAceitaCatalogo,
): boolean {
  return instalacaoDeCatalogoAutorizada(temCapacidade) && sistemaDeArquivosAceita();
}
