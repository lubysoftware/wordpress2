/**
 * O contexto das duas operacoes de credencial de aplicacao: tudo que elas precisam
 * e que **nao e** porta deste modulo.
 *
 * Mesma forma e mesmas razoes de `../cadastro/contexto-de-cadastro.ts` e de
 * `../autenticacao/contexto-de-autenticacao.ts`, e elas valem palavra por palavra
 * aqui:
 *
 * - **contexto por argumento, nao estado de modulo.** AD-02 e BR-MIGRAR-105
 *   (`EXT-CONTEXTO`) poem identidade, consulta e conexao no escopo da REQUISICAO, e
 *   a area 5 do critério de paridade tem tolerancia **zero** nisso;
 * - **os ganchos e as colaboracoes chegam aqui, e nao como porta.** AD-08 fixa
 *   portas somente nas 5 bordas; AD-10 manda resolver toda chamada entre contextos
 *   no momento da chamada.
 *
 * **O contexto de autorizacao entra inteiro, e e isto que faz desta a primeira
 * operacao do modulo com capacidade exigida.** As quatro anteriores declaram
 * *"nenhuma capacidade"*; esta declara `edit_user` daquela conta (CA-10.4), e por
 * isso ela recebe o {@link ContextoDeAutorizacao} que a decisao da plataforma
 * consome. Quem compoe tem de registrar o caso de traducao das seis capacidades em
 * `casosDeTraducao` — ver {@link casoDeSenhaDeAplicacao}. **Nao registrar nao abre
 * a porta:** a capacidade pedida atravessaria a traducao sem mudanca e nenhum papel
 * da matriz de fabrica a concede, logo a resposta e negada. Fecha, nao vaza.
 *
 * ---
 *
 * # 🔴 A pre-condicao de UC-22 que esta tarefa NAO construiu
 *
 * UC-22 tem duas pre-condicoes, e a segunda e *"a conexao e segura, ou a instalacao
 * dispensou o requisito"*. Ela **nao** esta aqui, e a razao e a mesma do nonce de
 * `../sessao/saida.ts`: no legado quem a cobra e a **camada de rota** — e o slot
 * `framework-http` de `plan.md` esta em aberto, logo nada nesta arvore sabe se a
 * conexao e segura. Construi-la aqui exigiria inventar de onde vem a resposta.
 *
 * **Consequencia, declarada:** hoje a emissao nao exige conexao segura, e no legado
 * a rota a exige (com dispensa para ambiente local, e com ponto de extensao proprio
 * para a instalacao que decida outra coisa). Neste ponto o sistema e **mais aberto**
 * que o legado, e fecha quando a borda HTTP existir — sem alterar este arquivo:
 * quem recusa e quem roteia. Fica aqui para que quem montar a borda nao descubra a
 * pre-condicao depois.
 */

import type { ContextoDeAutorizacao } from '../../../plataforma/autorizacao/index.js';
import type {
  CamposDeSenhaDeAplicacao,
  CamposGravaveisDeSenhaDeAplicacao,
  RepositorioDeSenhasDeAplicacao,
} from '../armazenamento/senha-de-aplicacao.js';
import type { PortaDeRelogio } from '../portas/index.js';
import type { FonteDeAleatoriedade } from '../cadastro/geracao-de-segredo.js';
import type {
  GeradorDeIdentificadorDeCredencial,
  ResumoDaSenhaDeAplicacao,
} from './geracao-de-credencial.js';
import type { PedidoDeEmissao } from './emitir-credencial.js';

/**
 * A sanitizacao do nome descritivo.
 *
 * ⚠️ **Obrigatoria e sem valor padrao**, pelo mesmo motivo de `removerAcentos` e
 * `apelidoDeTexto` em `../cadastro/contexto-de-cadastro.ts`: e a tabela de
 * equivalencia e o saneamento de texto de `plataforma/`, que **nao existe nesta
 * arvore**. No legado e a mesma funcao de saneamento de campo de texto que o resto
 * do produto usa, e ela faz mais do que cortar espaco — tira marcacao, tira
 * caractere de controle e colapsa o que sobra. Um padrao silencioso aqui seria P1
 * violado sem ninguem notar, e o efeito seria visivel: o nome e o que o titular le
 * na lista de credenciais dele.
 *
 * **A ordem em que ela e aplicada e regra**, e esta em
 * {@link emitirCredencialDeAplicacao}: o legado sanea **antes** de conferir se o
 * nome esta vazio, logo um nome que sanea para vazio e recusado como vazio.
 */
export type SanitizacaoDeTexto = (texto: string) => string;

/**
 * O registro, na instalacao, de que a credencial de aplicacao passou a ser usada.
 *
 * ⚠️ **Opcional, e a ausencia tem consequencia declarada.** O legado grava, na
 * primeira emissao da instalacao, uma opcao de rede que marca o recurso como em
 * uso — e a grava **so** quando ela ainda nao esta marcada, o que faz da segunda
 * emissao em diante uma emissao sem essa escrita. Nenhum documento deste pacote
 * registra essa opcao: nem a secao *Modelo de dados* do `plan.md`, que lista
 * `{site}user_roles` como a unica opcao desta feature, nem UC-22, cuja pos-condicao
 * fala somente do item no metadado. E escrever opcao de **rede** exigiria um
 * armazenamento que este pacote nao tem.
 *
 * Por isso ela entra como colaborador, nao como invencao: omitido, **nada e
 * escrito**, e o efeito no banco de uma instalacao de fabrica tem uma escrita a
 * menos que o legado na primeira emissao. Fornecido, a ordem e a do legado — ler
 * primeiro, gravar so se ainda nao estiver marcado — e a conferencia fecha contra o
 * oraculo (`ESC-ORACULO`).
 */
export interface RegistroDeUsoDeSenhaDeAplicacao {
  estaEmUso(): boolean;
  marcarEmUso(): void;
}

/**
 * Os pontos de extensao que as duas operacoes atravessam.
 *
 * Estao **nomeados e opcionais** pelo mesmo motivo de `GanchosDoCadastro`: o **P2**
 * poe cada um no contrato publico, com *"o nome, os argumentos, a ordem de disparo
 * e a capacidade de alterar o resultado"*, e o barramento que os dispara nao existe
 * nesta arvore (`REQ-162`, em `do-not-rewrite.md`). Ponto sem interceptador
 * registrado e, no legado, um no-op — logo a ausencia aqui reproduz o legado em vez
 * de enfraquece-lo.
 *
 * **Os dois sao acao, nenhum e filtro, e nenhum dos dois altera o resultado.** E a
 * diferenca com o cadastro, onde dois dos cinco pontos podem recusar: aqui o legado
 * dispara **depois** de a gravacao ter acontecido, logo nao ha o que recusar. Um
 * porte que os deixasse alterar o resultado daria a uma extensao um poder que o
 * legado nao lhe da.
 *
 * ⚠️ **A ordem de disparo esta afirmada por teste**, e nao implicita na ordem do
 * codigo: o inventario de pontos de extensao que o **P2** exige nao existe nesta
 * arvore, e nome, argumento e posicao fecham contra o oraculo — a mesma lacuna que
 * `GanchosDaEntrada` e `GanchosDoCadastro` ja registram.
 */
export interface GanchosDeSenhaDeAplicacao {
  /**
   * `wp_create_application_password`: **acao**, dispara depois de a credencial
   * estar gravada.
   *
   * 🔴 **E o unico lugar deste pacote em que o segredo em claro atravessa uma
   * fronteira que nao e a do titular**, e isso e do legado: o terceiro argumento e
   * o segredo. Quem registra interceptador neste ponto le a credencial inteira.
   * CA-10.2 continua valendo — *"exibido uma unica vez e nao recuperavel depois"* —
   * porque nada o guarda; o que este ponto da e a passagem, no instante da emissao.
   * Tirar o argumento seria mudar o contrato publico (**P2**) e quebrar toda
   * extensao que o usa para entregar a credencial ao programa que a pediu.
   *
   * Sao **quatro** argumentos, e o quarto e o pedido como ele chegou — com o nome
   * **antes** do saneamento. E a forma do legado, lida na mesma ancora dos sete
   * campos; o pacote nao documenta ponto de extensao nenhum desta area, e nome,
   * argumentos e posicao fecham contra o oraculo, como em `GanchosDoCadastro`.
   */
  readonly aoEmitirCredencial?: (
    contaId: number,
    credencial: CredencialEmitida,
    segredo: string,
    pedido: PedidoDeEmissao,
  ) => void;
  /**
   * `wp_delete_application_password`: **acao**, dispara depois de a credencial ter
   * sido removida da lista gravada, e recebe **o item apagado** — que nesse
   * momento nao existe mais em lugar nenhum.
   *
   * O item chega na forma **lida**, com campo anulavel, e nao na forma gravavel: o
   * legado entrega ao interceptador o item como ele estava no metadado, e um item
   * gravado por terceiro pode nao ter todos os campos. Completar o que falta com
   * vazio daria ao interceptador um item que nunca existiu.
   */
  readonly aoRevogarCredencial?: (
    contaId: number,
    credencial: CredencialRevogada,
  ) => void;
}

/**
 * A credencial como o ponto de extensao da emissao a recebe: os campos gravados,
 * sem o segredo.
 *
 * Os dois nomes vem da forma de armazenamento de proposito, e nao sao
 * redeclarados: o que o legado passa ao interceptador e **o item**, com os mesmos
 * campos e os mesmos nomes que estao no metadado.
 */
export type CredencialEmitida = CamposGravaveisDeSenhaDeAplicacao;

/** A credencial como o ponto de extensao da revogacao a recebe: o item lido. */
export type CredencialRevogada = CamposDeSenhaDeAplicacao;

/** O contexto das duas operacoes. */
export interface ContextoDeSenhaDeAplicacao {
  readonly relogio: PortaDeRelogio;
  /** A lista gravada, pela forma de armazenamento de T021. */
  readonly credenciais: RepositorioDeSenhasDeAplicacao;
  /**
   * A autorizacao desta requisicao — quem pergunta, com que matriz, em que
   * instalacao.
   *
   * Inteiro e por argumento porque identidade e escopo de REQUISICAO (AD-02,
   * BR-MIGRAR-105), e porque e dele que sai a resposta de CA-10.4.
   */
  readonly autorizacao: ContextoDeAutorizacao;
  /** Ver a ressalva em `geracao-de-credencial.ts`: obrigatorio, sem padrao. */
  readonly resumo: ResumoDaSenhaDeAplicacao;
  /** Ver a ressalva acima: obrigatoria, sem padrao. */
  readonly sanitizarTexto: SanitizacaoDeTexto;
  /** O sorteio dos 24 caracteres. Omitido, vale o do runtime. */
  readonly aleatorio?: FonteDeAleatoriedade;
  /** O identificador da credencial. Omitido, vale o do runtime. */
  readonly gerarIdentificador?: GeradorDeIdentificadorDeCredencial;
  /** Ver a ressalva acima. Omitido, nada e escrito. */
  readonly usoNaInstalacao?: RegistroDeUsoDeSenhaDeAplicacao;
  readonly ganchos?: GanchosDeSenhaDeAplicacao;
}
