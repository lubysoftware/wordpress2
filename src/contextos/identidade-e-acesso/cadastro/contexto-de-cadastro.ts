/**
 * O contexto de uma tentativa de cadastro: tudo que o cadastro precisa e que **nao
 * e** porta deste modulo.
 *
 * Mesma forma e mesmas razoes de `../autenticacao/contexto-de-autenticacao.ts`, e
 * elas valem palavra por palavra aqui:
 *
 * - **contexto por argumento, nao estado de modulo.** AD-02 e BR-MIGRAR-105
 *   (`EXT-CONTEXTO`) poem identidade, consulta e conexao no escopo da REQUISICAO, e a
 *   area 5 do critério de paridade tem tolerancia **zero** nisso. Um contexto que
 *   chega por argumento nao tem como vazar entre requisicoes;
 * - **os ganchos e as colaboracoes chegam aqui, e nao como porta.** AD-08 fixa portas
 *   somente nas 5 bordas e recusa dar porta ao barramento de ganchos; AD-10 manda
 *   resolver toda chamada entre contextos **no momento da chamada**.
 *
 * ⚠️ **Tres colaboradores sao obrigatorios e nao tem valor padrao**, e a ausencia de
 * padrao e a mensagem: `removerAcentos`, `apelidoDeTexto` e `resumoDaChave`. Os dois
 * primeiros sao a tabela de equivalencia de caractere de `plataforma/`, que nao existe
 * nesta arvore; o terceiro e o algoritmo do resumo da chave, que o pacote nao registra
 * e que T009 decide (ver `chave-de-redefinicao.ts`). Um padrao silencioso em qualquer
 * um deles seria divergencia que ninguem veria — o que
 * `../autenticacao/normalizacao-de-credencial.ts` ja diz sobre `removerAcentos`:
 * *"um default silencioso aqui seria P1 violado sem ninguem notar"*.
 */

import type { PortaDeEmail, PortaDeRelogio } from '../portas/index.js';
import type { RepositorioDeContas } from '../armazenamento/conta.js';
import type { RepositorioDePapeis } from '../armazenamento/repositorio-de-papeis.js';
import type { EstadoDaRede } from '../autenticacao/contexto-de-autenticacao.js';
import type { RemocaoDeAcentos } from '../autenticacao/normalizacao-de-credencial.js';
import type { GeradorDeHashDeSenha } from '../autenticacao/geracao-de-hash-de-senha.js';
import type { ResumoDaChaveDeRedefinicao } from './chave-de-redefinicao.js';
import type {
  LimitesDoCadastro,
  OpcoesDoCadastro,
} from './configuracao-de-cadastro.js';
import type { ErroDeCadastro } from './erro-de-cadastro.js';
import type { FonteDeAleatoriedade } from './geracao-de-segredo.js';
import type { NotificacaoDeContaNova } from './notificacao-de-conta-nova.js';
import type { ApelidoDeTexto } from './validacao-de-cadastro.js';

/**
 * Os tres destinos que a tela de registro declara.
 *
 * Nenhum deles e inventado: `target_screens.md`, `SCR-005`, lista *"Transicoes de
 * saida: `wp-signup.php`, `wp-login.php?registration=disabled`"* e a tabela de
 * redirecionamentos da tela traz os tres com arquivo e linha (`wp-login.php:1104`,
 * `:1109` e `:1129`). As URLs vem de fora porque sao da instalacao, como `urlDoPainel`
 * em `../autenticacao/contexto-de-autenticacao.ts`.
 */
export interface DestinosDoCadastro {
  /**
   * Onde a instalacao em rede manda quem tenta se cadastrar (`wp-login.php:1104`).
   *
   * ⚠️ O que acontece **depois** de chegar la e UC-41, e UC-41 **nao esta neste
   * pacote**: `REQ-129` a `REQ-132` estao em `do-not-rewrite.md`. Aqui ha o desvio, e
   * so o desvio.
   */
  readonly cadastroEmRede: string;
  /** Onde o cadastro desligado manda o visitante (`wp-login.php:1109`, CA-6.1). */
  readonly cadastroDesligado: string;
  /** O destino padrao do cadastro aceito, quando nenhum foi pedido (`:1129`). */
  readonly avisoDeCadastro: string;
}

/**
 * Os pontos de extensao que o cadastro atravessa.
 *
 * Estao **nomeados e opcionais** porque o **P2** poe cada um no contrato publico, com
 * *"o nome, os argumentos, a ordem de disparo e a capacidade de alterar o resultado"*,
 * e porque o barramento que os dispara nao existe nesta arvore. Ponto sem
 * interceptador registrado e, no legado, um no-op — logo a ausencia aqui reproduz o
 * legado em vez de enfraquece-lo.
 *
 * ⚠️ **A ordem de disparo esta afirmada por teste** na suite desta tarefa, e nao
 * implicita na ordem do codigo: o inventario de pontos de extensao que o **P2** exige
 * nao existe nesta arvore, e a conferencia de nome e posicao fecha contra o oraculo —
 * a mesma lacuna que `GanchosDaEntrada` ja registra.
 */
export interface GanchosDoCadastro {
  /**
   * `illegal_user_logins`: **filtro**, e e por aqui que `U3` existe.
   *
   * BR-MIGRAR-023 e literal — a lista *"existe so como filtro… sem interface"* —, logo
   * ela nao e opcao e nao chega por {@link OpcoesDoCadastro}. Recebe a lista de
   * fabrica (vazia) e devolve a lista efetiva. **Pode fechar o sistema**, e e o unico
   * ponto daqui que faz isso: CA-6.6 e o cenario de paridade da area cobram as duas
   * metades — sem extensao, qualquer login valido e aceito; com extensao, o login da
   * lista e recusado.
   */
  readonly filtrarLoginsProibidos?: (
    loginsProibidos: readonly string[],
  ) => readonly string[];
  /**
   * `user_registration_email`: **filtro** sobre o e-mail enviado, **antes** de ele ser
   * validado. Dispara ate quando o e-mail e vazio.
   */
  readonly filtrarEmailDoCadastro?: (email: string) => string;
  /**
   * `register_post`: **acao**, dispara depois das conferencias de login e de e-mail e
   * **antes** do filtro de erros. Recebe o login sanitizado, o e-mail e os erros
   * acumulados ate aqui. Nao altera o resultado.
   */
  readonly aoSubmeterCadastro?: (
    login: string,
    email: string,
    erro: ErroDeCadastro,
  ) => void;
  /**
   * `registration_errors`: **filtro**, e o ultimo portao antes de a conta ser criada.
   *
   * **Pode recusar um cadastro que passou em tudo** e pode liberar um que falhou —
   * quem devolve um erro sem itens libera. E ponto de extensao com poder de alterar o
   * resultado, que e o que o **P2** manda preservar.
   */
  readonly filtrarErrosDoCadastro?: (
    erro: ErroDeCadastro,
    login: string,
    email: string,
  ) => ErroDeCadastro;
  /**
   * `register_new_user`: **acao**, dispara depois de a conta existir e **antes** da
   * notificacao. Recebe o identificador da conta. Nao altera o resultado.
   */
  readonly aoCriarContaNoCadastro?: (contaId: number) => void;
}

/** O contexto de uma tentativa de cadastro. */
export interface ContextoDeCadastro {
  readonly relogio: PortaDeRelogio;
  readonly email: PortaDeEmail;
  readonly contas: RepositorioDeContas;
  readonly papeis: RepositorioDePapeis;

  /** O que a instalacao gravou. Ver `configuracao-de-cadastro.ts`. */
  readonly opcoes: OpcoesDoCadastro;
  /** Os limites do codigo. Omitidos, valem os de fabrica. */
  readonly limites?: LimitesDoCadastro;

  /**
   * O estado da rede desta requisicao.
   *
   * ⚠️ Em rede o cadastro **nao passa por aqui**: UC-21 registra no fluxo alternativo
   * que *"o registro nao passa por aqui: percorre UC-41, que cria um cadastro
   * **pendente** numa tabela propria"*. O desvio e reproduzido; UC-41 nao e.
   */
  readonly rede: EstadoDaRede;

  readonly destinos: DestinosDoCadastro;

  /** A URL de entrada do site, que entra na mensagem e no erro de e-mail duplicado. */
  readonly urlDeEntrada: string;
  /** Transforma um caminho em endereco absoluto da rede. Da borda. */
  readonly montarUrlDaRede: (caminho: string) => string;

  /** Ver a ressalva do cabecalho: obrigatorio, sem padrao. */
  readonly removerAcentos: RemocaoDeAcentos;
  /** Ver a ressalva do cabecalho: obrigatorio, sem padrao. */
  readonly apelidoDeTexto: ApelidoDeTexto;
  /** Ver a ressalva do cabecalho: obrigatorio, sem padrao. */
  readonly resumoDaChave: ResumoDaChaveDeRedefinicao;

  readonly geradorDeHashDeSenha: GeradorDeHashDeSenha;

  /** O sorteio dos dois segredos. Omitido, vale o do runtime. */
  readonly aleatorio?: FonteDeAleatoriedade;

  /**
   * A notificacao de conta nova. Omitida, vale a do nucleo.
   *
   * E ponto de substituicao (`EXT-SUBST`): trocar a implementacao aqui tira tambem a
   * emissao da chave, como no legado. Ver `notificacao-de-conta-nova.ts`.
   */
  readonly notificacao?: NotificacaoDeContaNova;

  readonly ganchos?: GanchosDoCadastro;
}
