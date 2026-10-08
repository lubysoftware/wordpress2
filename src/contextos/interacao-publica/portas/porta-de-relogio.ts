/**
 * Porta de relogio do modulo de interacao publica (BC-03).
 *
 * Existe porque quase toda etapa da cascata tem prazo ou janela, e a
 * constituicao manda conferi-los na borda: o P6 pede, para cada numero, *"teste
 * que afirma o valor e o efeito da borda (no ultimo instante aceita, um instante
 * depois recusa)"*. Os numeros desta feature que dependem do relogio sao tres,
 * e os tres aparecem em `configuracao/configuracao-de-moderacao.ts`: a janela de
 * uma hora da vazao (C2), o prazo de 14 dias do fechamento automatico (C11) e o
 * intervalo minimo entre dois comentarios. Um modulo que leia o relogio do
 * sistema direto nao tem como ser conferido assim.
 *
 * **A unidade e segundo inteiro, e isso e regra, nao gosto.** No legado as tres
 * contas sao aritmetica sobre `time()`, que devolve segundos inteiros em UTC: a
 * janela da vazao e `time() - HOUR_IN_SECONDS` formatado em GMT
 * (`wp-includes/comment.php:922`), o fechamento por idade e
 * `time() - strtotime( $posts[0]->post_date_gmt ) > $days_old * DAY_IN_SECONDS`
 * (`wp-includes/comment.php:3863`) e o intervalo entre comentarios e subtracao
 * de dois instantes convertidos por `mysql2date( 'U', ... )`. Expor milissegundo
 * aqui seria inventar precisao que o produto nao tem, e o P6 recusa numero que o
 * legado nao tem.
 *
 * ⚠️ **O fuso e UTC porque as colunas que a comparacao usa sao as `_gmt`.** A
 * tabela `comments` guarda `comment_date` e `comment_date_gmt`, e as duas
 * consultas de prazo deste modulo comparam contra a coluna GMT. Um relogio local
 * mudaria o resultado da janela de vazao em toda instalacao com `gmt_offset`
 * diferente de zero.
 *
 * **Nenhum prazo mora nesta porta.** Os prazos vivem nos pontos de configuracao
 * nomeados de `configuracao/configuracao-de-moderacao.ts`, com os valores de
 * fabrica do legado, como o P6 exige. Aplica-los e das tarefas que os
 * implementam (T008 da vazao, T014 do fechamento automatico).
 *
 * **Nota de arquitetura, declarada e nao resolvida aqui:** AD-08 de
 * `target_architecture.md` diz *"portas somente nas 5 bordas"* e lista dados,
 * HTTP, sistema de arquivos, cache de objeto e e-mail — relogio nao esta entre
 * elas. T001 de `tasks.md` pede esta porta pelo nome, e a porta de BC-05 carrega
 * a mesma nota. As duas coisas convivem: o que AD-08 recusa e dar porta ao
 * barramento de hooks, a traducao e ao escape, por custo de indirecao em escala
 * de 13.335 e 3.416 pontos de entrada; o relogio nao substitui sistema externo,
 * e so o costurar torna o P6 conferivel. Fica registrado para quem revisar a
 * conta das portas.
 */

export interface PortaDeRelogio {
  /**
   * Instante corrente em segundos inteiros desde a epoca Unix, em UTC: a mesma
   * unidade e o mesmo fuso de `time()`.
   */
  agoraEmSegundos(): number;
}
