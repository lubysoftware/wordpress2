/**
 * O registro de provedores de dado pessoal — os dois pontos de extensao
 * `wp_privacy_personal_data_exporters` e `wp_privacy_personal_data_erasers` na
 * forma que o alvo tem.
 *
 * Tarefa **T001** da feature `008-privacidade-e-dados-pessoais`, metade da
 * entrega: *"o registro de provedores de dado pessoal vazio e inspecionavel"*.
 * `satisfaz: — (infraestrutura)`.
 *
 * ## Por que ele nasce vazio, e por que isso e o legado e nao uma lacuna
 *
 * No legado o registro **nao existe como variavel**: ele e o valor inicial de um
 * filtro, `apply_filters( 'wp_privacy_personal_data_exporters', array() )`, e
 * esse valor inicial e um **array vazio** — nos quatro lugares que o leem
 * (`wp-admin/includes/ajax-actions.php:5047` e `:5238`,
 * `wp-admin/includes/privacy-tools.php:822` e `:955`). Quem povoa sao
 * interceptadores, e os do nucleo sao quatro
 * (`wp-includes/default-filters.php:455` a `:458`):
 *
 * | chave | o que declara | de que contexto o dado e |
 * |---|---|---|
 * | `wordpress-user` | exportador de conta e metadado de conta | BC-05 |
 * | `wordpress-comments` | exportador e **o unico apagador do nucleo** | BC-03 |
 * | `wordpress-media` | exportador de arquivo enviado | BC-04 |
 *
 * Os quatro moram, no alvo, em **outros contextos**, e a regra de dependencia 3
 * de `target_architecture.md` proibe `import` entre contextos *"sempre, sem
 * excecao"*. Logo eles nao podem entrar por importacao aqui: entram por
 * **ligacao tardia**, registrados por quem compoe a operacao — o mesmo padrao de
 * `ClassificacaoNaPublicacao` em BC-01. Por isso o registro vazio nao e
 * incompletude de T001: e o estado inicial do legado, e e a unica forma que
 * respeita a regra de dependencia.
 *
 * ⚠️ **Qual tarefa registra os quatro provedores do nucleo nao esta no pacote.**
 * `tasks.md` nao tem tarefa de povoamento, e T011 e T013 sao as que percorrem o
 * registro. Fica declarado em `../README.md`, nao decidido aqui.
 *
 * ## Por que e uma instancia, e nao um mapa no escopo do modulo
 *
 * 🔴 No legado cada leitura do registro acontece num **processo novo**: as
 * chamadas de exportacao e de apagamento sao requisicoes separadas, disparadas
 * uma por pagina pelo laco do navegador, e cada uma reconstroi o registro do
 * zero ao carregar o arranque. O escopo de requisicao sai de graca porque o
 * processo morre no fim da resposta. `BR-MIGRAR-105` (`EXT-CONTEXTO`) manda que
 * nada disso vire estado de modulo, e `parity_specs.md` da nome a travessia:
 * **D-A, "escopo de requisicao para escopo de processo"**.
 *
 * O registro e **mutavel por projeto** — e isso que faz dele ponto de extensao e
 * nao tabela de constantes — e precisa ser mutavel **por requisicao**. Uma
 * instancia por composicao entrega as duas coisas; um mapa no escopo deste
 * arquivo entregaria a primeira e perderia a segunda, e o cenario
 * `@concorrencia` de `parity_tests/12-solicitacao-de-dado-pessoal.feature` tem
 * tolerancia zero aqui: *"duas solicitacoes confirmadas, de titulares
 * diferentes... nenhum arquivo de exportacao contem dado do outro titular"*.
 *
 * ## A ordem, que e observavel, e a armadilha dela
 *
 * O chamador acha o provedor da vez **por posicao** —
 * `array_keys( $exporters )[ $exporter_index - 1 ]`
 * (`ajax-actions.php:5067` e `:5068`) —, logo a ordem do registro decide a ordem
 * das chamadas, e a ordem das chamadas decide a ordem em que os grupos entram no
 * relatorio acumulado.
 *
 * ⚠️ **No legado a ordem NAO e a ordem das linhas que registram.** As tres
 * linhas de `default-filters.php` leem comentario (`:455`), midia (`:456`) e
 * conta (`:457`) — mas a de conta e registrada com **prioridade 1**, e as outras
 * duas com a prioridade padrao. Como o barramento dispara em ordem crescente de
 * prioridade, a ordem efetiva do registro e **`wordpress-user`,
 * `wordpress-comments`, `wordpress-media`**. Quem povoar este registro na ordem
 * em que as linhas aparecem produz um relatorio com os grupos em outra ordem.
 *
 * {@link RegistroDeProvedores.exportadores} devolve **na ordem de insercao**, que
 * e o que o `array` do PHP faz. Reproduzir a **prioridade** e de quem disparar o
 * ponto de extensao: `REQ-162` (*"declarar os pontos de extensao com contrato
 * explicito"*) esta `bloqueado` e listado em `do-not-rewrite.md`, logo nao existe
 * barramento nesta arvore e nenhuma tarefa deste pacote o constroi. O que esta
 * tarefa pode fazer, e faz, e **declarar** o ponto de extensao com nome,
 * argumento e ordem, no arquivo que o emitiria.
 *
 * ## O que este registro nao tem
 *
 * **Nao tem remocao.** O registro de contextos de classificacao tem
 * `unregister_taxonomy()` porque o legado tem essa funcao publicada; aqui nao
 * existe nenhuma funcao de desregistro — o unico jeito de tirar um provedor no
 * legado e remover o interceptador do filtro, que e operacao do barramento e nao
 * do registro. Acrescentar `remover` seria superficie que o legado nao tem.
 *
 * **Nao valida chave.** O legado nao valida: `$exporters['wordpress-user'] = ...`
 * aceita qualquer indice, e registrar com uma chave que ja existe **substitui** o
 * anterior, sem recusa e sem aviso — e e assim que uma extensao troca o
 * exportador de conta do nucleo. As validacoes do legado sao de **leitura**
 * (indice fora de faixa, pagina menor que 1, forma da resposta,
 * `ajax-actions.php:5049` a `:5100`) e pertencem a quem percorre: T011 e T013.
 */

import type {
  ApagadorDeDadoPessoal,
  ExportadorDeDadoPessoal,
} from './provedor-de-dado-pessoal.js';

/** Um exportador no registro, com a chave sob a qual ele entrou. */
export interface ExportadorRegistrado {
  readonly chave: string;
  readonly exportador: ExportadorDeDadoPessoal;
}

/** Um apagador no registro, com a chave sob a qual ele entrou. */
export interface ApagadorRegistrado {
  readonly chave: string;
  readonly apagador: ApagadorDeDadoPessoal;
}

/**
 * O registro, com a superficie que o legado tem: escrever sob uma chave, e ler a
 * lista inteira ou um provedor por chave.
 *
 * As duas metades sao independentes porque no legado sao **dois filtros
 * diferentes**: ha tres exportadores de fabrica e **um** apagador, e a contagem
 * de um nao diz nada sobre a do outro.
 */
export interface RegistroDeProvedores {
  /**
   * O `$exporters[ $chave ] = array( ... )` do interceptador do filtro.
   *
   * Nao devolve nada e nao recusa nada: chave repetida substitui o provedor
   * anterior e **mantem a posicao** que a chave ja tinha, como o `array` do PHP
   * faz. A posicao importa — ver a secao da ordem no cabecalho.
   */
  registrarExportador(chave: string, exportador: ExportadorDeDadoPessoal): void;

  /** O mesmo, para `wp_privacy_personal_data_erasers`. */
  registrarApagador(chave: string, apagador: ApagadorDeDadoPessoal): void;

  /**
   * Os exportadores registrados, **na ordem de insercao**: o valor que
   * `apply_filters( 'wp_privacy_personal_data_exporters', array() )` devolveria.
   *
   * E por aqui que o registro e *inspecionavel*, que e o que T001 entrega: a
   * contagem (`count( $exporters )`, que o legado compara com o indice para
   * saber se chegou ao ultimo) e o comprimento desta lista.
   */
  exportadores(): readonly ExportadorRegistrado[];

  /** O mesmo, para os apagadores. */
  apagadores(): readonly ApagadorRegistrado[];

  /**
   * O `$exporters[ $exporter_key ]` de `ajax-actions.php:5069`.
   *
   * Chave inexistente devolve `null`, que e o lugar onde o legado cai no erro
   * *"Exporter index is out of range."* (`ajax-actions.php:5060`) — a
   * **mensagem** e de quem percorre, porque e ela que o titular ve, e isso e de
   * T011.
   */
  obterExportador(chave: string): ExportadorDeDadoPessoal | null;

  /** O mesmo, para os apagadores. */
  obterApagador(chave: string): ApagadorDeDadoPessoal | null;
}

/**
 * Cria um registro vazio.
 *
 * Vazio e o estado inicial do legado, nao uma pendencia: ver a primeira secao do
 * cabecalho. Cada chamada devolve uma instancia nova — duas composicoes nao se
 * enxergam, e `../modulo.test.ts` afirma isso.
 */
export function criarRegistroDeProvedores(): RegistroDeProvedores {
  // `Map` guarda a ordem de insercao e mantem a posicao da chave quando o valor
  // e substituido, que e exatamente o que o `array` associativo do PHP faz.
  const exportadores = new Map<string, ExportadorDeDadoPessoal>();
  const apagadores = new Map<string, ApagadorDeDadoPessoal>();

  return {
    registrarExportador(chave, exportador) {
      exportadores.set(chave, exportador);
    },

    registrarApagador(chave, apagador) {
      apagadores.set(chave, apagador);
    },

    exportadores() {
      return [...exportadores].map(([chave, exportador]) => ({
        chave,
        exportador,
      }));
    },

    apagadores() {
      return [...apagadores].map(([chave, apagador]) => ({ chave, apagador }));
    },

    obterExportador(chave) {
      // `?? null` porque o `undefined` de um Map nao e o `false` do legado: o
      // alvo tem uma ausencia so, e e `null`.
      return exportadores.get(chave) ?? null;
    },

    obterApagador(chave) {
      return apagadores.get(chave) ?? null;
    },
  };
}
