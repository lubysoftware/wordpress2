/**
 * Porta de relogio do modulo de identidade e acesso (BC-05).
 *
 * Existe porque esta feature e feita de prazos, e a constituicao manda conferi-
 * los na borda: o P4 pede "teste por atestado que fixa prazo e forca, com
 * relogio controlado", e o P6 pede, para cada numero, "teste que afirma o valor
 * e o efeito da borda (no ultimo instante aceita, um instante depois recusa)".
 * Um modulo que leia o relogio do sistema direto nao tem como ser conferido
 * assim.
 *
 * **A unidade e segundo inteiro, e isso e regra, nao gosto.** No legado todo
 * prazo desta feature e aritmetica sobre `time()`, que devolve segundos
 * inteiros em UTC: a chave de redefinicao leva o instante prefixado
 * (`wp-includes/user.php:3204`), a sessao expira em `time()` mais o prazo
 * (`wp-includes/pluggable.php:1082`) e o tique do nonce e divisao sobre o mesmo
 * inteiro. Expor milissegundo aqui seria inventar precisao que o produto nao
 * tem, e o P6 recusa numero que o legado nao tem.
 *
 * Nenhum prazo mora nesta porta. Os prazos — 24 horas da chave, 2 e 14 dias da
 * sessao, 12 horas de carencia — entram nas tarefas que os implementam (T007,
 * T009), cada um num ponto de configuracao nomeado com o valor de fabrica,
 * como o P6 exige.
 *
 * **Nota de arquitetura, declarada e nao resolvida aqui:** AD-08 de
 * `target_architecture.md` diz "portas somente nas 5 bordas" e lista dados,
 * HTTP, sistema de arquivos, cache de objeto e e-mail — relogio nao esta entre
 * elas, e `target_architecture.md` nao o menciona em lugar nenhum. T001 de
 * `tasks.md` pede esta porta pelo nome. As duas coisas convivem: o que AD-08
 * recusa e dar porta ao barramento de hooks, a traducao e ao escape, por custo
 * de indirecao em escala de 13.335 e 3.416 pontos de entrada; o relogio nao
 * substitui sistema externo, e so o costurar que torna o P4 e o P6
 * conferiveis. Fica registrado para quem revisar a conta das portas.
 */

export interface PortaDeRelogio {
  /**
   * Instante corrente em segundos inteiros desde a epoca Unix, em UTC: a mesma
   * unidade e o mesmo fuso de `time()`.
   */
  agoraEmSegundos(): number;
}
