/**
 * A mensagem que leva ao titular o caminho para definir a senha (CA-6.5), e o
 * ponto de substituicao que a emite.
 *
 * **E um dos 42 pontos de substituicao de BR-MIGRAR-103 (`EXT-SUBST`).** No legado a
 * notificacao de conta nova e uma funcao substituivel inteira, protegida por guarda
 * de existencia — e a consequencia disso e maior do que parece: **quem a substitui
 * tira tambem a emissao da chave**, porque e ela que pede a chave. Nao e detalhe de
 * organizacao; e o que o legado faz, e por isso a emissao mora **dentro** desta
 * operacao e nao antes dela, em `cadastrar.ts`. Um porte que emitisse a chave fora
 * daqui gravaria `user_activation_key` numa instalacao em que o legado nao grava
 * nada.
 *
 * **Falha de envio e valor, nunca excecao** — `../portas/porta-de-email.ts` ja
 * carrega as tres fontes dessa regra, e esta operacao devolve o resultado de cada
 * tentativa em vez de interpreta-lo. **E o cadastro nao consulta esse resultado**:
 * no legado `register_new_user` nao olha o retorno da notificacao, e a conta
 * continua criada com e-mail enviado ou nao. Relatar a falha ao requisitante e
 * US-5 / T011, no fluxo de **redefinicao**; aqui ela e estado devolvido, e nenhuma
 * ramificacao a le (**P7**).
 *
 * ---
 *
 * ## ⚠️ O texto reproduz o legado e fecha contra o oraculo
 *
 * `target_screens.md` cataloga as 8 mensagens literais da **tela** de registro
 * (`SCR-005`) e **nenhuma mensagem de e-mail**: o corpo da notificacao nao esta em
 * nenhum documento deste pacote. Mesmo precedente e mesma postura de
 * `erro-de-cadastro.ts` e de `../autenticacao/erro-de-autenticacao.ts`: reproduzir o
 * legado, em ingles, porque `EC-05` fixa que *"o `msgid` em ingles E a chave do
 * catalogo"*, e marcar a conferencia contra o oraculo (`ESC-ORACULO`,
 * BR-MIGRAR-116).
 *
 * **O fim de linha e `\r\n`**, como no legado, e nao `\n`: ele esta dentro do corpo
 * da mensagem, logo e byte gravado e enviado.
 *
 * ## 🔴 O que esta operacao NAO faz: avisar o administrador
 *
 * No legado o cadastro aberto pede a notificacao em modo **"ambos"**, e esse modo
 * manda **duas** mensagens: uma ao titular e uma ao administrador do site.
 * **Esta operacao manda somente a do titular**, e a razao e que tres documentos
 * independentes registram so ela:
 *
 * - UC-21, passo 5: *"Sistema envia ao e-mail informado o link para definir a
 *   senha"*, com **um** ator secundario e **uma** linha na tabela de sequencia;
 * - UC-21, pos-condicoes: duas, e nenhuma menciona aviso ao administrador;
 * - CA-6.5: *"**o titular** recebe por e-mail um caminho para definir a senha"*.
 *
 * E o texto da mensagem ao administrador tambem nao esta no pacote. Escrever um
 * aviso que nenhum documento pede, com um texto que nenhum documento registra,
 * inventa duas coisas de uma vez; omiti-lo deixa de portar uma mensagem que o legado
 * manda. **T013 nao escolheu entre as duas**: reproduziu o que o pacote registra e
 * deixa o aviso ao administrador como lacuna declarada — ela esta nomeada aqui, na
 * nota de entrega de T013 do `README.md`, e o retorno desta operacao e uma **lista**
 * de tentativas justamente para que a segunda mensagem entre sem mudar a forma de
 * nada. A decisao e de quem tiver o oraculo, ou de quem decidir sem ele.
 */

import type { MensagemDeEmail, PortaDeEmail, ResultadoDeEnvio } from '../portas/index.js';
import type { RepositorioDeContas } from '../armazenamento/conta.js';
import {
  caminhoDeDefinicaoDeSenha,
  emitirChaveDeRedefinicao,
  gravarChaveDeRedefinicao,
  type ResumoDaChaveDeRedefinicao,
} from './chave-de-redefinicao.js';

/** O fim de linha do corpo da mensagem, como o legado o escreve. */
export const FIM_DE_LINHA_DA_MENSAGEM = '\r\n';

/**
 * As mensagens da notificacao de conta nova. Ver a ressalva do cabecalho.
 *
 * `%s` fica como o legado o deixa, e quem monta a mensagem o preenche — a mesma
 * convencao de `MENSAGENS_DE_ERRO_DE_AUTENTICACAO`.
 */
export const MENSAGENS_DA_NOTIFICACAO_DE_CONTA_NOVA = {
  /** `%s` recebe o titulo do site (`blogname`). */
  assunto_do_titular: '[%s] Login Details',
  /** `%s` recebe o login da conta. */
  linha_do_login: 'Username: %s',
  linha_de_instrucao: 'To set your password, visit the following address:',
} as const;

/** O que a notificacao precisa saber sobre a conta e sobre a instalacao. */
export interface EntradaDaNotificacaoDeContaNova {
  readonly contaId: number;
  readonly login: string;
  readonly email: string;
  /** O instante corrente, que vai prefixado no valor gravado da chave. */
  readonly agoraEmSegundos: number;
  /** `blogname`, que entra no assunto. */
  readonly tituloDoSite: string;
  /** A chave em claro, ja sorteada por quem compoe. */
  readonly chaveEmClaro: string;
  /** A URL de entrada do site, que o legado poe na ultima linha do corpo. */
  readonly urlDeEntrada: string;
  /** Transforma um caminho em endereco absoluto da rede. Da borda. */
  readonly montarUrlDaRede: (caminho: string) => string;
}

/** O que a notificacao faz, e o que ela informa de volta. */
export interface ResultadoDaNotificacaoDeContaNova {
  /** Uma tentativa por mensagem, na ordem de emissao. */
  readonly envios: readonly ResultadoDeEnvio[];
  /**
   * A chave foi emitida e gravada?
   *
   * ⚠️ **A chave em claro nao sai daqui**, e isso e CA-4.1: *"o valor em claro so
   * existe no e-mail enviado"*. Devolve-la ao chamador faria dela um valor que o
   * legado nao expoe, e o caminho de definicao de senha deixaria de ser segredo
   * compartilhado so com o titular.
   */
  readonly chaveEmitida: boolean;
}

/** O ponto de substituicao. */
export interface NotificacaoDeContaNova {
  notificar(
    entrada: EntradaDaNotificacaoDeContaNova,
  ): ResultadoDaNotificacaoDeContaNova;
}

/** O que a notificacao do nucleo precisa receber. */
export interface DependenciasDaNotificacaoDeContaNova {
  readonly email: PortaDeEmail;
  readonly contas: RepositorioDeContas;
  readonly resumoDaChave: ResumoDaChaveDeRedefinicao;
}

/**
 * Monta o corpo do e-mail do titular, linha por linha, na ordem do legado.
 *
 * Exportado para que a suite possa afirmar o corpo sem passar pela porta de e-mail,
 * e para que a borda que montar a tela de aviso use **o mesmo** caminho de definicao
 * de senha que foi enviado.
 */
export function corpoDaMensagemDoTitular(
  login: string,
  urlDeDefinicaoDeSenha: string,
  urlDeEntrada: string,
): string {
  const fim = FIM_DE_LINHA_DA_MENSAGEM;
  return (
    MENSAGENS_DA_NOTIFICACAO_DE_CONTA_NOVA.linha_do_login.replace('%s', login) +
    fim +
    fim +
    MENSAGENS_DA_NOTIFICACAO_DE_CONTA_NOVA.linha_de_instrucao +
    fim +
    fim +
    urlDeDefinicaoDeSenha +
    fim +
    fim +
    urlDeEntrada +
    fim
  );
}

/** O assunto, com o titulo do site no lugar do marcador. */
export function assuntoDaMensagemDoTitular(tituloDoSite: string): string {
  return MENSAGENS_DA_NOTIFICACAO_DE_CONTA_NOVA.assunto_do_titular.replace(
    '%s',
    tituloDoSite,
  );
}

/**
 * A notificacao do nucleo: emite a chave, grava, monta e envia — nesta ordem.
 *
 * A ordem e observavel: a gravacao de `user_activation_key` acontece **antes** do
 * envio, logo uma falha de transporte deixa a chave valida gravada e o titular sem
 * o e-mail. E o legado, e e o que CA-5.3 depois usa (*"pedir de novo apos a falha
 * gera uma chave nova"*) — nao ha estado intermediario a inventar.
 */
export function criarNotificacaoDeContaNovaDoNucleo(
  dependencias: DependenciasDaNotificacaoDeContaNova,
): NotificacaoDeContaNova {
  return {
    notificar(entrada) {
      const emitida = emitirChaveDeRedefinicao(
        entrada.chaveEmClaro,
        entrada.agoraEmSegundos,
        dependencias.resumoDaChave,
      );
      gravarChaveDeRedefinicao(dependencias.contas, entrada.contaId, emitida);

      const mensagem: MensagemDeEmail = {
        destinatarios: [entrada.email],
        assunto: assuntoDaMensagemDoTitular(entrada.tituloDoSite),
        corpo: corpoDaMensagemDoTitular(
          entrada.login,
          entrada.montarUrlDaRede(
            caminhoDeDefinicaoDeSenha(entrada.login, emitida.chaveEmClaro),
          ),
          entrada.urlDeEntrada,
        ),
        // Sem cabecalho e sem anexo, como o legado os deixa nesta mensagem.
        cabecalhos: [],
        anexos: [],
      };

      return {
        envios: [dependencias.email.enviar(mensagem)],
        chaveEmitida: true,
      };
    },
  };
}
