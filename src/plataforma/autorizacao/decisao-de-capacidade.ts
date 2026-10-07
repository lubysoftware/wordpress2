/**
 * A decisao: perguntar permissao, e a ordem em que ela e decidida.
 *
 * Entrega de **T015** da feature `001-identidade-e-acesso` (US-7). E a operacao
 * *"perguntar permissao"* da tabela **Contratos** do `plan.md`: *"recebe a
 * capacidade pedida, traduz em lista de capacidades primitivas e exige **todas**
 * as devolvidas"*, com saida *"sim ou nao"* e **nenhum erro** — *"a resposta e
 * sempre booleana, e a lista vazia de mapeamento significa permitido"*.
 *
 * Mora em `plataforma/autorizacao/` porque `target_architecture.md` divide a area
 * em dois: *"o **dado** do papel pertence a BC-05; a **decisao** de capacidade
 * fica em `plataforma/autorizacao/`, porque e chamada 1.279 vezes em 224 arquivos
 * e precisa estar abaixo de todo contexto"*. E a regra de dependencia 2 proibe
 * `plataforma/` importar `contextos/`, logo o dado do papel chega por argumento —
 * a costura de ligacao tardia que o README de BC-05 previu para esta tarefa, e
 * que esta em `contextos/identidade-e-acesso/autorizacao/`.
 *
 * ---
 *
 * # A ORDEM, que e a regra
 *
 * `PERM-9` (BR-MIGRAR-095) e ADR-0009 nao descrevem uma lista de condicoes: eles
 * descrevem uma **sequencia**, e o ADR recusou por escrito a alternativa de
 * verificar a negacao depois do ponto de extensao (*"permitiria a um plugin
 * remover a negacao. Seria a ordem errada, e o codigo escolheu a outra"*). Os seis
 * passos de {@link perguntarPermissao}, na ordem do legado
 * (`class-wp-user.php:787`-`:833`):
 *
 * | # | passo | por que aqui, e nao depois |
 * |---|---|---|
 * | 1 | traduzir a capacidade pedida na lista exigida | `PERM-3`: ninguem pergunta pela meta-capacidade, todos perguntam pelo que o mapeamento devolveu |
 * | 2 | atalho do super administrador, **em rede** | `PERM-9`: acontece **antes** do ponto de extensao, logo extensao nenhuma lhe retira poder; so `do_not_allow` o detem |
 * | 3 | montar o mapa de capacidades do ator | `PERM-1`: funde os papeis e sobrepoe as individuais |
 * | 4 | ponto de extensao `user_has_cap` | pode conceder e pode retirar — e o que faz de cada regra deste catalogo um *default* filtravel (`ESC-FILTRAVEL`) |
 * | 5 | `exist` a todos, `do_not_allow` a ninguem | **depois** do ponto de extensao: e o que impede conceder `do_not_allow` por filtro |
 * | 6 | exigir **todas** as da lista; lista vazia e permitido | `PERM-1` e `PERM-6` |
 *
 * Trocar dois destes passos de lugar nao produz um defeito visivel: produz um
 * sistema que decide diferente em um caso que ninguem testa. E por isso que a
 * ordem esta afirmada por teste, e nao so escrita aqui.
 *
 * ---
 *
 * # 🔴 Um ponto que esta tarefa encontrou aberto, e NAO resolveu
 *
 * **A forma numerica depreciada de perguntar nao foi portada, e a razao e o
 * conflito REQ-017.**
 *
 * ADR-0001 registra que `has_cap()` *"ainda aceita numero, com aviso de
 * depreciacao"* (`class-wp-user.php:788`-`:791`): um numero e traduzido em
 * `level_{n}` e decidido como qualquer capacidade. O **P8** poe superficie
 * publicada fora do alcance de quem codifica, logo **nao** se trata de descarte.
 *
 * O que trava: o conteudo de `level_0` a `level_10` e **exatamente** o objeto do
 * conflito entre o card `REQ-017` (prioridade `wont`, que manda remover as 11
 * concessoes de nivel numerico) e a resposta 5 de `questions.md` (que fixa a
 * matriz de fabrica como a matriz real). Uma das formas de conferir o descarte,
 * escrita no proprio card, e *"nenhuma decisao de autorizacao compara nivel
 * numerico"*. Construir a forma numerica aqui seria dar resposta a uma das duas
 * partes; a tabela **Nao negociavel** da constituicao poe *"resolver um dos
 * conflitos entre card `wont` e resposta humana"* fora do alcance do agente de
 * codificacao, e T002 tratou o mesmo conflito do mesmo modo — isolando-o num
 * argumento obrigatorio em vez de escolher (`armazenamento/matriz-de-fabrica.ts`).
 *
 * Fica, entao, **nomeado e nao construido**, como a costura do fragmento de hash
 * ficou em T007. Quando a decisao vier: a forma numerica e uma traducao de
 * argumento — `numero` para `level_{n}` — e nao toca nada da ordem acima, porque
 * o que ela produz e um nome de capacidade como qualquer outro. O custo de
 * construi-la depois e de linhas, nao de desenho.
 */

import {
  CAPACIDADE_CONCEDIDA_A_TODOS,
  CAPACIDADE_NEGADA,
  type Capacidade,
} from './capacidade.js';
import { capacidadesDoAtor } from './capacidades-do-ator.js';
import type { ContextoDeAutorizacao } from './contexto-de-autorizacao.js';
import {
  CONSTANTES_DE_FABRICA,
  revogacaoPorConstante,
} from './revogacao-por-constante.js';
import { traduzirCapacidade } from './traducao-de-capacidade.js';

/**
 * A capacidade que define "super administrador" **fora** de uma instalacao de
 * rede.
 *
 * `PERM-9` (BR-MIGRAR-095): *"'super admin' **nao e capacidade**: e nome de login
 * numa lista de rede. E **fora de multisite a mesma funcao usa outra definicao**:
 * quem tem `delete_users`."* A pre-condicao de UC-24 diz o mesmo com outras
 * palavras. A regra avisa o que um porte faz de errado aqui: *"a mesma funcao com
 * dois modelos e o tipo de detalhe que um porte **unifica por engano**"* — e o
 * conselho de ADR-0009 de unificar os dois modelos e conselho **para um porte que
 * pudesse divergir**, que nao e este: o **P1** exige decisao humana registrada
 * para divergir, e nenhuma existe.
 */
const CAPACIDADE_QUE_DEFINE_SUPER_ADMIN_FORA_DA_REDE: Capacidade = 'delete_users';

/**
 * A lista de capacidades primitivas que a pergunta exige — o `map_meta_cap()`.
 *
 * A **ordem declarada** dos casos, e ela e exigencia de BR-MIGRAR-094
 * (*"revogacao que vence concessao exige ordem de avaliacao declarada no alvo —
 * nao pode ser 'mais um filtro'"*):
 *
 * 1. as quatro constantes do dono do servidor, **sempre**, e nao substituiveis;
 * 2. os casos de traducao de objeto que o contexto trouxer — o de conteudo e
 *    `casoDeConteudo()`, de `traducao-de-conteudo.ts` (US-8 / T017);
 * 3. o ramo final: a propria capacidade pedida.
 *
 * Um caso de objeto nao consegue, portanto, reabrir o que uma constante fechou —
 * que e o que "o unico mecanismo do sistema que funciona assim" quer dizer.
 */
export function capacidadesExigidas(
  contexto: ContextoDeAutorizacao,
  capacidade: Capacidade,
  ...argumentos: readonly unknown[]
): readonly Capacidade[] {
  return traduzirCapacidade(
    {
      capacidade,
      contaId: contexto.ator.contaId,
      argumentos,
      constantes: contexto.constantes ?? CONSTANTES_DE_FABRICA,
      emRede: contexto.rede.ativa,
    },
    [revogacaoPorConstante, ...(contexto.casosDeTraducao ?? [])],
  );
}

/**
 * `is_super_admin()` — as duas definicoes, e so uma delas vale por instalacao.
 *
 * Fora da rede a pergunta volta para {@link perguntarPermissao}, e isso **nao**
 * recursiona: o atalho do passo 2 so existe em rede, logo a volta cai no caminho
 * normal de capacidade. No legado e exatamente assim, e e por isso que num site
 * unico o administrador **passa** pelo ponto de extensao e uma extensao pode lhe
 * retirar poder (ADR-0009, consequencias).
 */
export function ehSuperAdmin(contexto: ContextoDeAutorizacao): boolean {
  if (!contexto.ator.existe) {
    return false;
  }

  if (contexto.rede.ativa) {
    return contexto.rede.loginsDeSuperAdmin.includes(contexto.ator.login);
  }

  return perguntarPermissao(
    contexto,
    CAPACIDADE_QUE_DEFINE_SUPER_ADMIN_FORA_DA_REDE,
  );
}

/**
 * Pergunta se o ator do contexto pode fazer o que a capacidade nomeia.
 *
 * Devolve `true` ou `false` e **nada mais**: nao lanca, nao avisa e nao distingue
 * "negado" de "nao sei". A tabela Contratos do `plan.md` e explicita — *"erros:
 * nenhum"* —, e e essa ausencia que faz da autorizacao uma pergunta que se pode
 * fazer 1.279 vezes por requisicao.
 *
 * Os argumentos variadicos sao o `...$args` do legado: o objeto, quando a
 * capacidade e sobre um objeto. Quem os consome sao os casos de traducao de
 * objeto — os de conteudo estao em `traducao-de-conteudo.ts` (US-8 / T017).
 */
export function perguntarPermissao(
  contexto: ContextoDeAutorizacao,
  capacidade: Capacidade,
  ...argumentos: readonly unknown[]
): boolean {
  // 1. A capacidade pedida nunca e comparada direto: compara-se o que a
  //    traducao devolveu (PERM-3).
  const exigidas = capacidadesExigidas(contexto, capacidade, ...argumentos);

  // 2. O atalho do super administrador, e ele existe SO em rede (PERM-9). Vem
  //    antes do ponto de extensao de proposito: e a garantia 2 de ADR-0009.
  if (contexto.rede.ativa && ehSuperAdmin(contexto)) {
    return !exigidas.includes(CAPACIDADE_NEGADA);
  }

  // 3. O mapa do ator: papeis fundidos, individuais por cima (PERM-1).
  const capacidadesMontadas = capacidadesDoAtor(contexto.ator, contexto.matriz);

  // 4. `user_has_cap`: pode conceder e pode retirar.
  const gancho = contexto.ganchos?.aoMontarCapacidadesDoAtor;
  const capacidadesFiltradas =
    gancho === undefined
      ? capacidadesMontadas
      : gancho(capacidadesMontadas, exigidas, argumentos, contexto.ator);

  // 5. As duas sinteticas, DEPOIS do ponto de extensao e nesta ordem.
  const capacidades = new Map(capacidadesFiltradas);
  capacidades.set(CAPACIDADE_CONCEDIDA_A_TODOS, true);
  capacidades.delete(CAPACIDADE_NEGADA);

  // 6. Todas as exigidas, e so as concedidas contam: no legado a comparacao e
  //    sobre `array_filter`, logo capacidade presente com valor falso conta como
  //    AUSENTE. E lista vazia passa — lista vazia significa permitido (PERM-6).
  return exigidas.every((nome) => capacidades.get(nome) === true);
}
