/**
 * `plataforma/registro-de-operacao/` — o canal estruturado do evento de
 * operacao, carregado vazio.
 *
 * Entrega de **T002** da feature `015-plataforma-transversal`: *"registro de
 * operacao, traducao, sanitizacao e camada de dados carregam como modulos
 * proprios, com as portas declaradas e nenhuma regra implementada"*.
 * `satisfaz: — (infraestrutura)`. **Nenhum criterio de aceite esta satisfeito
 * aqui**: US-1 e **T003**, os oito testes do catalogo (UT-159-1 a UT-159-8) sao
 * **T004**, e US-5 (**T011**) depende deste modulo por CA-5.4. Leitura
 * obrigatoria de quem pegar T003: `./README.md`.
 *
 * **Por que a pasta nao se chama `registro/`.** Porque esse nome ja tem dono no
 * desenho, e nao e este: `target_architecture.md` reserva `plataforma/registro/`
 * para o *"registro explicito que substitui as **38 funcoes substituiveis**, as
 * 176 guardas `function_exists` e os **4 *drop-ins***"* — a reposicao de
 * `EXT-SUBST` (BR-MIGRAR-103), que nao tem nada a ver com observabilidade. O
 * nome completo e o que o `plan.md` e a `tasks.md` usam para esta coisa
 * (*"registro de operacao"*), e manter os dois nomes distintos evita a colisao
 * mais cara que um esqueleto pode deixar: duas tarefas futuras escrevendo na
 * mesma pasta por acharem que e a delas.
 *
 * Duas coisas que este arquivo faz de proposito, as mesmas dos esqueletos
 * anteriores:
 *
 * - **Nao guarda estado de modulo.** `EXT-CONTEXTO` (BR-MIGRAR-105). Aqui a
 *   tentacao e concreta: um registro em memoria de processo seria o lugar obvio
 *   para acumular eventos — e acumularia os de todas as requisicoes e, numa
 *   rede, os de todos os sites, no mesmo saco. `./modulo.test.ts` afirma que
 *   duas composicoes nao se enxergam.
 * - **Nao resolve nada no carregamento.** Compor o modulo nao escreve evento e
 *   nao consulta nada (`EXT-ORDEM`, BR-MIGRAR-106). Escrever no carregamento
 *   seria, alem de tudo, registrar antes de haver o que registrar.
 */

import type { PortaDeCanal } from './portas/index.js';

export * from './portas/index.js';
export {
  criarCanalQueRegistra,
  type CanalQueRegistra,
} from './canal-que-registra.js';

/**
 * A porta de que este modulo depende, na forma em que ele a recebe.
 *
 * Uma so, e `./portas/index.ts` explica por que nao cinco — e por que nao seis.
 */
export interface PortasDeRegistroDeOperacao {
  readonly canal: PortaDeCanal;
}

/**
 * O modulo carregado.
 *
 * Nenhuma operacao, porque T002 nao entrega operacao nenhuma. A tabela abaixo e
 * a pauta de T003, com o que cada criterio de US-1 exige e o estado dele no
 * legado — e esta aqui para que a tarefa seguinte nao redescubra, e para que o
 * item CA-1.3 nao seja fechado por distracao:
 *
 * | criterio | o que ele exige | estado no legado |
 * |---|---|---|
 * | CA-1.1 | instante, origem, severidade e contexto em todo erro tratado e toda falha de integracao | 49 `error_log(` em 12 arquivos, nenhuma num caminho de dominio; zero arquivo de log |
 * | CA-1.2 | consultavel por periodo, por severidade e por origem | nao existe: nao ha registro a consultar |
 * | CA-1.3 | **prazo de retencao declarado** e sem credencial nem dado pessoal alem do declarado | 🔴 **conflito**: `ESC-RETENCAO` (BR-MIGRAR-113) diz que *"o nucleo nao declara prazo de retencao nenhum, e porta-lo identico e nao inventar um"*. Ver `./README.md` |
 * | CA-1.4 | responder: frequencia de falha de atualizacao, extensoes que derrubaram o site, volume de spam | os tres dados existem como **estado corrente**, nao como historico: `auto_core_update_failed` (`class-wp-automatic-updater.php:838`), as extensoes pausadas (`class-wp-recovery-mode.php:441`, apagadas de uma vez em `:214`) e `comment_approved = 'spam'` (`schema.php:112`) |
 * | CA-1.5 | registra sem depender do modo de depuracao | hoje depende: o `ini_set` do log esta dentro de `if ( WP_DEBUG )` (`wp-includes/load.php:613`, `:631`, `:632`) |
 * | CA-1.6 | nenhum caminho de erro silencioso por omissao, com verificacao automatizada | 🔴 **conflito**: tres silencios sao estruturais e respostas humanas mandaram preserva-los (P7). Ver `./README.md` |
 *
 * ⚠️ **CA-1.4 nao se resolve dentro deste modulo.** Os tres dados pertencem a
 * BC-11 (atualizacao e modo de recuperacao) e a BC-03 (spam), e a regra de
 * dependencia 3 proibe importar contexto de contexto: o que este modulo oferece
 * e o **canal**, e quem registra e cada contexto, na tarefa dele. Nenhuma linha
 * desta pasta vai consultar a opcao de falha de atualizacao.
 */
export interface ModuloDeRegistroDeOperacao {
  readonly nome: 'registro-de-operacao';
  readonly portas: PortasDeRegistroDeOperacao;
}

/**
 * Compoe o modulo sobre a porta recebida.
 *
 * Trocar o canal e passar outra implementacao aqui, sem alterar arquivo deste
 * modulo — o criterio de *"substituivel"* de `EXT-SUBST` (BR-MIGRAR-103). E vale
 * dizer o que isto **nao** e: nao e um *drop-in* por presenca de arquivo. O
 * legado tem quatro deles e nenhum e de observabilidade, porque observabilidade
 * nao existe no legado.
 */
export function criarModuloDeRegistroDeOperacao(
  portas: PortasDeRegistroDeOperacao,
): ModuloDeRegistroDeOperacao {
  return {
    nome: 'registro-de-operacao',
    portas,
  };
}
