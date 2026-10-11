/**
 * Os nomes das duas tabelas desta feature.
 *
 * Sao **duas**, e a segunda nao e detalhe de implementacao: a secao *Modelo de
 * dados* do `plan.md` poe `commentmeta` na mesma linha de `comments` e nomeia o
 * que ela guarda — *"metadado, incluindo o estado anterior ao descarte"*. Sem
 * ela, CA-11.1 (*"o descarte guarda o estado anterior e o instante, junto do
 * comentario"*) nao tem onde morar.
 *
 * As duas estao no bloco **ESCOPO POR SITE** do DDL
 * (`wp-admin/includes/schema.php:55`, `// Blog-specific tables.`), logo as duas
 * levam o prefixo **do site** — numa rede, `wp_2_comments` e
 * `wp_2_commentmeta`. O prefixo **base**, que localiza as tabelas globais, nao
 * esta na porta deste modulo de proposito, e a falta esta prevista no cabecalho
 * de `portas/porta-de-dados.ts`: `C7` (BR-MIGRAR-015) resolve o autor por e-mail
 * em `users`, que e global, e **nenhuma consulta desta tarefa faz isso**. Quem
 * precisar do prefixo base acrescenta o campo na tarefa que precisar — T010.
 *
 * **Nao ha nome de tabela montado a mao fora deste arquivo.** A nota 3 de
 * `target_data_model.md` registra por que isso importa numa instalacao de rede:
 * *"o prefixo de tabela nao e so configuracao de conexao: ele e dado"*. Um nome
 * montado no meio de uma consulta e a forma mais barata de gravar o comentario
 * de um site na tabela de outro.
 *
 * O que **nao** esta aqui, e e vizinho: `posts`. O contador de comentarios vive
 * em `posts.comment_count` e BC-03 e responsavel por *"manter"* ele
 * (`target_architecture.md` § BC-03), mas a tabela e de BC-01 e quem a escreve e
 * a operacao de contagem — T026 (US-12). Declarar o nome dela aqui convidaria
 * este armazenamento a escrever na tabela de outro contexto, que e a ligacao
 * horizontal que AD-10 recusa.
 */

import type { PortaDeDados } from '../portas/index.js';

/** `{site}comments` — a interacao: comentario, notificacao de link e nota, com 15 colunas. */
export function tabelaDeComentarios(dados: PortaDeDados): string {
  return `${dados.prefixoDeTabela}comments`;
}

/** `{site}commentmeta` — a extensao aberta em par chave e valor, com 4 colunas. */
export function tabelaDeMetadadosDeComentario(dados: PortaDeDados): string {
  return `${dados.prefixoDeTabela}commentmeta`;
}
