/**
 * Os nomes das duas tabelas desta feature.
 *
 * Sao **duas**, e e esse o achado que o nome deste arquivo nao conta: nao
 * existe tabela de versao. `target_data_model.md` poe **seis** entidades de
 * dominio na mesma tabela `posts`, discriminadas por `post_type`, e diz o que
 * fazer com isso: *"Isso **nao** e erro de modelagem a corrigir — e a forma do
 * legado, e separa-las em tabelas proprias mudaria `erd-complete.md` §3 e
 * quebraria a coexistencia"*. Revisao, anexo, solicitacao de dado pessoal,
 * changeset e item de menu sao linhas de `posts`.
 *
 * As duas estao no bloco **ESCOPO POR SITE** do DDL, logo as duas levam o
 * prefixo **do site** — numa rede, `wp_2_posts` e `wp_2_postmeta`. O prefixo
 * **base**, que localiza as tabelas globais, nao esta na porta deste modulo de
 * proposito (ver `portas/porta-de-dados.ts`): o autor do conteudo e dado de
 * BC-05, alcancado por ligacao tardia (AD-10), e nao por consulta daqui.
 *
 * **Nao ha nome montado a mao fora deste arquivo.** A nota 3 de
 * `target_data_model.md` registra por que isso importa numa instalacao de rede:
 * *"o prefixo de tabela nao e so configuracao de conexao: ele e dado"*. Um nome
 * montado no meio de uma consulta e a forma mais barata de gravar o conteudo de
 * um site na tabela de outro.
 *
 * O que **nao** esta aqui: as quatro tabelas obsoletas (`categories`,
 * `post2cat`, `link2cat`, `sitecategories`), que o legado **declara e nunca
 * cria** para que rotinas de limpeza as reconhecam. Elas sao declaracao da
 * camada de dados (`wp-includes/class-wpdb.php:314` e `:351`), nao deste
 * contexto, e o alvo mantem a declaracao sem criar nenhuma — `post2cat` e
 * `link2cat` seriam as de conteudo, se existissem.
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
