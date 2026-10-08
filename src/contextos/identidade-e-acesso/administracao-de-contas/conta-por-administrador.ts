/**
 * Criar e alterar conta pelo painel — o `edit_user()` de
 * `wp-admin/includes/user.php:30`, com as guardas de `wp-admin/user-new.php` e de
 * `wp-admin/user-edit.php`.
 *
 * Entrega de **T023** da feature `001-identidade-e-acesso` (US-11). No legado
 * **e uma funcao so**: `edit_user( $user_id = 0 )` cria quando o identificador e
 * zero e altera quando nao e, e `add_user()` e um apelido de uma linha para ela
 * (`includes/user.php:16`). As duas operacoes abaixo compartilham o portao de
 * papel e a validacao por essa razao, e nao por economia.
 *
 * ---
 *
 * # O portao de papel, e as DUAS formas da trava de CA-11.4
 *
 * `includes/user.php:58`-`:79`, e sao tres condicoes encaixadas:
 *
 * ```
 * if ( isset( $_POST['role'] ) && current_user_can( 'promote_users' )
 *      && ( ! $user_id || current_user_can( 'promote_user', $user_id ) ) ) { … }
 * ```
 *
 * 1. **`promote_users` para a acao, e `promote_user` para a conta alvo** — CA-11.1
 *    de novo, e aqui com um detalhe: na **criacao** (`! $user_id`) a segunda
 *    pergunta nao e feita, porque nao ha alvo.
 * 2. **Quem nao tem `promote_users` nao recebe recusa: o papel e simplesmente
 *    ignorado.** O `if` inteiro e saltado, `$user->role` nao e definido e
 *    `wp_insert_user()` cai no `default_role` da instalacao. Um porte que
 *    recusasse aqui fecharia uma porta que o legado deixa passar — e um que
 *    gravasse o papel pedido a abriria. Reproduzido: o papel vira o padrao.
 * 3. **A trava do proprio papel tem outra forma aqui.**
 *
 * ```
 * if ( ( is_multisite() && current_user_can( 'manage_network_users' ) )
 *      || get_current_user_id() !== $user_id
 *      || ( $potential_role && $potential_role->has_cap( 'promote_users' ) ) ) {
 *     $user->role = $new_role;
 * }
 * ```
 *
 * Em `wp-admin/users.php:147` a trava **recusa** (CA-11.5) ou **salta com aviso**
 * (CA-11.4); aqui ela so **nao aplica o papel**, em silencio, e o resto do
 * formulario e gravado normalmente. Sao duas implementacoes da mesma intencao, com
 * respostas observaveis diferentes, e as duas estao portadas onde estao. UC-24
 * avisa que a regra *"esta na tela, nao no modelo de autorizacao"* — sao duas
 * telas.
 *
 * ⚠️ **Papel vazio passa pela conferencia de editaveis.** A guarda e
 * `if ( ! empty( $new_role ) && empty( $editable_roles[ $new_role ] ) )`, logo
 * cadeia vazia **nao** e recusada: ela chega a {@link definirPapel} como "nenhum
 * papel". E diferente do lote, onde `! $role` recusa antes. Reproduzido.
 *
 * ---
 *
 * # A ordem da validacao, e o que ela NAO confere na alteracao
 *
 * `includes/user.php:156`-`:236`, na ordem das linhas. Os ramos marcados com
 * **criacao** so rodam quando nao ha conta ainda:
 *
 * | # | ramo | codigo |
 * |---|---|---|
 * | 1 | login vazio | `user_login` |
 * | 2 | apelido de exibicao vazio — **alteracao** | `nickname` |
 * | 3 | senha ausente — **criacao** | `pass` |
 * | 4 | senha com barra invertida | `pass` |
 * | 5 | senha diferente da confirmacao | `pass` |
 * | 6 | login com caractere ilegal — **criacao** | `user_login` |
 * | 7 | login duplicado — **criacao** | `user_login` |
 * | 8 | login na lista de proibidos (`U3`) | `invalid_username` |
 * | 9 | e-mail vazio, invalido, ou duplicado de **outra** conta | `empty_email`, `invalid_email`, `email_exists` |
 *
 * **Os itens somam, nao param.** Diferente de `../cadastro/criacao-de-conta.ts`,
 * que devolve no primeiro: aqui o legado acumula num `WP_Error` e devolve no fim,
 * logo o formulario em branco produz um erro com varios codigos. O ramo 9 e o
 * unico com cadeia de `senao` interna — e-mail vazio e e-mail invalido nao somam
 * entre si.
 *
 * E o ramo 8 vale **tambem na alteracao**: uma extensao que proiba um login
 * depois de a conta existir trava a edicao daquela conta para sempre, porque o
 * login e imutavel. Quirk do legado, reproduzido.
 *
 * ---
 *
 * # ⚠️ O que estas duas operacoes NAO gravam, e esta declarado
 *
 * O `edit_user()` do legado grava, alem de login, senha, e-mail e papel, um bloco
 * de campos de perfil (nome, sobrenome, apelido de exibicao, descricao, URL,
 * editor visual, realce de sintaxe, cor do painel, barra no site, TLS, idioma, e
 * os metodos de contato que uma extensao registre). **Nenhum deles esta aqui**,
 * pela mesma razao e com o mesmo precedente de `../cadastro/criacao-de-conta.ts`:
 * *"o pacote nao as registra em lugar nenhum… inventar nome e valor de onze chaves
 * que nenhum documento deste pacote nomeia inventaria onze bytes gravados"*.
 *
 * Nenhum criterio de US-11 fala deles: CA-11.1 a CA-11.7 falam de permissao por
 * conta alvo, de lote, de exclusao com conteudo, de papel proprio e de
 * notificacao. O criterio desta area e **efeito no banco**, logo a ausencia e
 * divergencia a conferir contra o oraculo, e nao escolha de desenho — e ela esta
 * nomeada aqui e na nota de entrega de T023 do `README.md`.
 *
 * Duas consequencias praticas: `display_name` fica igual ao login na criacao, como
 * {@link criarConta} o deixa; e o ramo 2 da validacao (`nickname` vazio na
 * alteracao) **nunca dispara**, porque este porte nao recebe o campo. Esta
 * declarado no proprio ramo.
 */

import { perguntarPermissao } from '../../../plataforma/autorizacao/index.js';
import type { Conta } from '../armazenamento/conta.js';
import { ehEmail } from '../autenticacao/normalizacao-de-credencial.js';
import {
  LIMITES_DO_CADASTRO_DE_FABRICA,
  LOGINS_PROIBIDOS_DE_FABRICA,
} from '../cadastro/configuracao-de-cadastro.js';
import {
  criarConta,
  type ResultadoDaCriacaoDeConta,
} from '../cadastro/criacao-de-conta.js';
import { gerarSegredo, ALEATORIEDADE_DO_RUNTIME } from '../cadastro/geracao-de-segredo.js';
import {
  criarNotificacaoDeContaNovaDoNucleo,
  type ResultadoDaNotificacaoDeContaNova,
} from '../cadastro/notificacao-de-conta-nova.js';
import {
  loginEnviadoEhValido,
  loginEstaProibido,
} from '../cadastro/validacao-de-cadastro.js';
import { sanitizarLogin } from '../autenticacao/normalizacao-de-credencial.js';
import type { ResultadoDeEnvio } from '../portas/index.js';
import type {
  ContextoDaAdministracaoDeContas,
  ModoDeNotificacaoDeContaNova,
} from './contexto-de-administracao.js';
import {
  erroDaAdministracao,
  MENSAGENS_DE_ERRO_DA_ADMINISTRACAO,
  temAlgumErroDaAdministracao,
  type ErroDaAdministracao,
  type ItemDeErroDaAdministracao,
} from './erro-da-administracao.js';
import {
  AVISOS_DA_ADMINISTRACAO,
  RECUSAS_DA_ADMINISTRACAO,
  type AvisoDaAdministracao,
  type RecusaDaAdministracao,
} from './mensagens-da-administracao.js';
import {
  mensagemDeContaNovaAoAdministrador,
  mensagemDeEmailAlterado,
  mensagemDeSenhaAlterada,
} from './notificacoes-da-administracao.js';
import {
  CAPACIDADE_QUE_O_PROPRIO_PAPEL_PRECISA_CONSERVAR,
  definirPapel,
  type ResultadoDaDefinicaoDePapel,
} from './papel-da-conta.js';
import { papeisEditaveis, papelConcede } from './papeis-editaveis.js';
import { autorizacaoDoAtor, podeSobreConta } from './permissao-sobre-conta.js';

/** `create_users` — a capacidade da acao de criar (`user-new.php:192`). */
const CAPACIDADE_DE_CRIAR = 'create_users';

/** `edit_user` — a capacidade sobre a conta alvo (`user-edit.php:135`). */
const CAPACIDADE_DE_ALTERAR = 'edit_user';

/** `promote_users` — a primitiva do portao de papel (`includes/user.php:58`). */
const CAPACIDADE_DE_PROMOVER = 'promote_users';

/** `promote_user` — a meta-capacidade do portao de papel, sobre a conta alvo. */
const CAPACIDADE_DE_PROMOVER_A_CONTA = 'promote_user';

/** `manage_network_users` — dispensa a trava do proprio papel, em rede. */
const CAPACIDADE_DE_REDE_QUE_DISPENSA_A_TRAVA = 'manage_network_users';

/** O que o formulario de conta nova envia. */
export interface DadosDaContaNovaPorAdministrador {
  readonly login: string;
  readonly email: string;
  /** `pass1`. Obrigatoria na criacao — ramo 3 da validacao. */
  readonly senha: string;
  /**
   * `pass2`. Omitida, vale {@link DadosDaContaNovaPorAdministrador.senha}.
   *
   * Existe porque o ramo 5 compara as duas, e omiti-la faria o ramo
   * inalcancavel — o mesmo argumento que `../cadastro/validacao-de-cadastro.ts`
   * usa sobre nao truncar o apelido.
   */
  readonly confirmacaoDeSenha?: string;
  /**
   * `role`. **Ausente** e diferente de vazio: ausente salta o portao inteiro
   * (`isset( $_POST['role'] )`), vazio entra nele e significa "nenhum papel".
   */
  readonly papel?: string;
  /**
   * `send_user_notification` — a caixa do formulario.
   *
   * Ausente, o modo e `administrador` e o titular **nao** recebe nada. Ver
   * {@link ModoDeNotificacaoDeContaNova}.
   */
  readonly notificarOTitular?: boolean;
}

/** O que a criacao por administrador informa de volta. Nao lanca. */
export type ResultadoDaCriacaoPorAdministrador =
  | {
      readonly criada: false;
      readonly recusa: RecusaDaAdministracao;
      readonly motivo: 'criar_acao' | 'papel_nao_editavel';
    }
  | {
      readonly criada: false;
      readonly recusa: null;
      readonly motivo: 'dados-recusados';
      readonly erro: ErroDaAdministracao;
    }
  | {
      readonly criada: false;
      readonly recusa: null;
      readonly motivo: 'criacao-recusada';
      /** O erro que {@link criarConta} devolveu. */
      readonly causa: Extract<ResultadoDaCriacaoDeConta, { criada: false }>['erro'];
    }
  | {
      readonly criada: true;
      readonly contaId: number;
      readonly login: string;
      /** O papel efetivamente gravado — o pedido, ou o padrao da instalacao. */
      readonly papel: string;
      readonly modoDeNotificacao: ModoDeNotificacaoDeContaNova;
      /** Uma tentativa por mensagem, na ordem de emissao. */
      readonly envios: readonly ResultadoDeEnvio[];
      /** `null` quando o modo nao manda mensagem ao titular. */
      readonly notificacaoDoTitular: ResultadoDaNotificacaoDeContaNova | null;
      readonly aviso: AvisoDaAdministracao;
    };

/**
 * `edit_user()` sem conta — cria a conta pelo painel (US-11, CA-11.7).
 *
 * **Permissao exigida: `create_users`**, declarada (**P4**) e lida de
 * `user-new.php:192`. O portao de papel exige `promote_users` **em separado**, e
 * nao recusa quem nao a tem: ver o item 2 do cabecalho. O nonce `create-user` nao
 * e deste pacote; ver `permissao-sobre-conta.ts`.
 *
 * ⚠️ A guarda de **tela** de `user-new.php:12`-`:26` e outra, e mais larga em
 * rede: ali a tela abre para `create_users` **ou** `promote_users`. Ela nao esta
 * nesta operacao porque e guarda de tela e nao da acao — a acao, em `:192`, exige
 * `create_users` nas duas variantes de instalacao. A recusa da tela esta
 * declarada em `RECUSAS_DA_ADMINISTRACAO.criar_na_rede` para quem montar a borda.
 */
export function criarContaPorAdministrador(
  dados: DadosDaContaNovaPorAdministrador,
  contexto: ContextoDaAdministracaoDeContas,
): ResultadoDaCriacaoPorAdministrador {
  const autorizacao = autorizacaoDoAtor(contexto);

  if (!perguntarPermissao(autorizacao, CAPACIDADE_DE_CRIAR)) {
    return {
      criada: false,
      recusa: RECUSAS_DA_ADMINISTRACAO.criar_acao,
      motivo: 'criar_acao',
    };
  }

  const limites = contexto.limites ?? LIMITES_DO_CADASTRO_DE_FABRICA;

  // O legado sanitiza o login em modo ESTRITO antes de qualquer conferencia
  // (`includes/user.php:44`), e e esse valor que vai para o banco. A conferencia
  // de caractere ilegal, no ramo 6, compara o valor CRU com o estrito.
  const login = sanitizarLogin(dados.login, contexto.removerAcentos, true);

  // O portao de papel. `undefined` salta o portao inteiro.
  const portao = resolverPapel(
    dados.papel,
    null,
    contexto,
    autorizacao,
  );
  if (portao.recusado) {
    return {
      criada: false,
      recusa: RECUSAS_DA_ADMINISTRACAO.papel_nao_editavel,
      motivo: 'papel_nao_editavel',
    };
  }
  const papel = portao.papel ?? contexto.opcoes.papelPadrao;

  const erro = validarFormulario(dados, login, null, contexto);
  if (temAlgumErroDaAdministracao(erro)) {
    return { criada: false, recusa: null, motivo: 'dados-recusados', erro };
  }

  const criacao = criarConta(
    { login, email: dados.email, senhaEmClaro: dados.senha },
    {
      contas: contexto.armazenamento.contas,
      papeis: contexto.armazenamento.papeis,
      limites,
      papelPadrao: papel,
      loginsProibidos: loginsProibidos(contexto),
      removerAcentos: contexto.removerAcentos,
      apelidoDeTexto: contexto.apelidoDeTexto,
      geradorDeHashDeSenha: contexto.geradorDeHashDeSenha,
      agoraEmSegundos: contexto.relogio.agoraEmSegundos(),
    },
  );

  if (!criacao.criada) {
    return {
      criada: false,
      recusa: null,
      motivo: 'criacao-recusada',
      causa: criacao.erro,
    };
  }

  const modo: ModoDeNotificacaoDeContaNova =
    dados.notificarOTitular === true ? 'ambos' : 'administrador';

  // `edit_user_created_user`: no legado e esta acao que DISPARA o envio, logo ela
  // vem antes das mensagens e quem a remove tira a notificacao junto.
  contexto.ganchos?.aoCriarContaPorAdministrador?.(criacao.contaId, modo);

  const notificacao = notificarContaNova(
    contexto,
    { contaId: criacao.contaId, login: criacao.login, email: dados.email },
    modo,
    limites.comprimentoDaChaveDeRedefinicao,
  );

  return {
    criada: true,
    contaId: criacao.contaId,
    login: criacao.login,
    papel,
    modoDeNotificacao: modo,
    envios: notificacao.envios,
    notificacaoDoTitular: notificacao.doTitular,
    aviso: AVISOS_DA_ADMINISTRACAO.criacao,
  };
}

/** O que o formulario de alteracao envia. Campo omitido e campo nao tocado. */
export interface AlteracoesDaConta {
  /** `pass1`. Vazia ou omitida nao troca a senha. */
  readonly senha?: string;
  /** `pass2`. Omitida, vale {@link AlteracoesDaConta.senha}. */
  readonly confirmacaoDeSenha?: string;
  readonly email?: string;
  /** `role`. Ausente salta o portao de papel; vazio significa "nenhum papel". */
  readonly papel?: string;
}

/** O que a alteracao informa de volta. Nao lanca. */
export type ResultadoDaAlteracaoDeConta =
  | {
      readonly alterada: false;
      readonly recusa: RecusaDaAdministracao;
      readonly motivo: 'alterar_alvo' | 'papel_nao_editavel';
    }
  | {
      readonly alterada: false;
      readonly recusa: null;
      readonly motivo: 'conta-inexistente' | 'dados-recusados';
      readonly erro: ErroDaAdministracao | null;
    }
  | {
      readonly alterada: true;
      readonly contaId: number;
      /** `null` quando o portao de papel nao aplicou papel nenhum. */
      readonly papel: ResultadoDaDefinicaoDePapel | null;
      /**
       * O papel foi pedido e **silenciosamente** nao aplicado pela trava do
       * proprio papel? E o item 3 do cabecalho, e e CA-11.4 nesta tela.
       */
      readonly papelProprioNaoAplicado: boolean;
      readonly senhaAlterada: boolean;
      readonly emailAlterado: boolean;
      /** Uma tentativa por mensagem, na ordem de emissao. */
      readonly envios: readonly ResultadoDeEnvio[];
    };

/**
 * `edit_user( $conta )` — altera a conta pelo painel (US-11, CA-11.1 e CA-11.7).
 *
 * **Permissao exigida: `edit_user` sobre aquela conta** (`user-edit.php:135`), e
 * `promote_users` mais `promote_user` para o portao de papel. A primeira e uma
 * das que a traducao de `plataforma/autorizacao/traducao-de-conta.ts` resolve com
 * **lista vazia** para a propria conta — e e dai que vem *"qualquer conta edita o
 * proprio perfil, inclusive um assinante"* (UC-24).
 *
 * As duas mensagens de CA-11.7 saem daqui, e as duas vao para o endereco
 * **anterior**: ver `notificacoes-da-administracao.ts`. Trocar o papel **nao**
 * envia nada, e a razao esta no cabecalho daquele arquivo.
 */
export function alterarContaPorAdministrador(
  contaId: number,
  alteracoes: AlteracoesDaConta,
  contexto: ContextoDaAdministracaoDeContas,
): ResultadoDaAlteracaoDeConta {
  const autorizacao = autorizacaoDoAtor(contexto);

  if (!podeSobreConta(autorizacao, CAPACIDADE_DE_ALTERAR, contaId)) {
    return {
      alterada: false,
      recusa: RECUSAS_DA_ADMINISTRACAO.alterar_alvo,
      motivo: 'alterar_alvo',
    };
  }

  const conta: Conta | null = contexto.armazenamento.contas.obterPorId(contaId);
  if (conta === null) {
    return {
      alterada: false,
      recusa: null,
      motivo: 'conta-inexistente',
      erro: null,
    };
  }

  const portao = resolverPapel(
    alteracoes.papel,
    contaId,
    contexto,
    autorizacao,
  );
  if (portao.recusado) {
    return {
      alterada: false,
      recusa: RECUSAS_DA_ADMINISTRACAO.papel_nao_editavel,
      motivo: 'papel_nao_editavel',
    };
  }

  const erro = validarFormulario(
    {
      login: conta.login,
      email: alteracoes.email ?? conta.email,
      senha: alteracoes.senha ?? '',
      ...(alteracoes.confirmacaoDeSenha === undefined
        ? {}
        : { confirmacaoDeSenha: alteracoes.confirmacaoDeSenha }),
    },
    conta.login,
    conta,
    contexto,
  );
  if (temAlgumErroDaAdministracao(erro)) {
    return {
      alterada: false,
      recusa: null,
      motivo: 'dados-recusados',
      erro,
    };
  }

  // A senha so e considerada trocada quando ha valor NOVO: `! empty(
  // $userdata['user_pass'] ) && $userdata['user_pass'] !== $user_obj->user_pass`.
  const senhaNova = alteracoes.senha ?? '';
  const hashNovo =
    senhaNova === '' ? null : contexto.geradorDeHashDeSenha.gerar(senhaNova);
  const senhaAlterada = hashNovo !== null && hashNovo !== conta.senhaHash;

  const emailAlterado =
    alteracoes.email !== undefined && alteracoes.email !== conta.email;

  contexto.armazenamento.contas.atualizar(contaId, {
    ...(senhaAlterada ? { senhaHash: hashNovo as string } : {}),
    ...(emailAlterado ? { email: alteracoes.email as string } : {}),
  });

  const papel =
    portao.papel === undefined
      ? null
      : definirPapel(
          {
            papeis: contexto.armazenamento.papeis,
            perfil: contexto.armazenamento.perfil,
            chaves: contexto.chaves,
          },
          contexto.base.matriz,
          contaId,
          portao.papel,
          contexto.ganchos,
        );

  const envios: ResultadoDeEnvio[] = [];
  const dadosDoAviso = {
    login: conta.login,
    emailAnterior: conta.email,
    tituloDoSite: contexto.opcoes.tituloDoSite,
    emailDoAdministrador: contexto.opcoes.emailDoAdministrador,
    urlDoSite: contexto.opcoes.urlDoSite,
  };

  // A ordem e a do legado: senha primeiro, e-mail depois.
  if (
    senhaAlterada &&
    (contexto.ganchos?.filtrarEnvioDeAvisoDeSenha?.(true, contaId) ?? true)
  ) {
    envios.push(
      contexto.email.enviar(mensagemDeSenhaAlterada(dadosDoAviso, contexto.ganchos)),
    );
  }
  if (
    emailAlterado &&
    (contexto.ganchos?.filtrarEnvioDeAvisoDeEmail?.(true, contaId) ?? true)
  ) {
    envios.push(
      contexto.email.enviar(
        mensagemDeEmailAlterado(
          { ...dadosDoAviso, emailNovo: alteracoes.email as string },
          contexto.ganchos,
        ),
      ),
    );
  }

  return {
    alterada: true,
    contaId,
    papel,
    papelProprioNaoAplicado: portao.papelProprioNaoAplicado,
    senhaAlterada,
    emailAlterado,
    envios,
  };
}

/** A lista efetiva de logins proibidos: a de fabrica, passada pelo filtro. */
function loginsProibidos(
  contexto: ContextoDaAdministracaoDeContas,
): readonly string[] {
  const filtrar = contexto.ganchos?.filtrarLoginsProibidos;
  return filtrar === undefined
    ? LOGINS_PROIBIDOS_DE_FABRICA
    : filtrar(LOGINS_PROIBIDOS_DE_FABRICA);
}

/** O que o portao de papel decidiu. */
interface DecisaoDoPortaoDePapel {
  /** O papel pedido nao esta entre os editaveis: a requisicao para. */
  readonly recusado: boolean;
  /**
   * O papel a aplicar, ou `undefined` quando nao se aplica papel nenhum —
   * porque nao foi pedido, porque o ator nao tem `promote_users`, ou porque a
   * trava do proprio papel o bloqueou.
   */
  readonly papel?: string;
  /** A trava do proprio papel bloqueou, em silencio (item 3 do cabecalho). */
  readonly papelProprioNaoAplicado: boolean;
}

/**
 * O portao de papel de `includes/user.php:58`-`:79`, com as tres condicoes do
 * cabecalho na ordem em que o legado as avalia.
 *
 * `contaAlvo` e `null` na criacao, e e isso que torna a segunda pergunta de
 * CA-11.1 dispensavel ali — `! $user_id` curto-circuita o `&&`.
 */
function resolverPapel(
  papelPedido: string | undefined,
  contaAlvo: number | null,
  contexto: ContextoDaAdministracaoDeContas,
  autorizacao: ReturnType<typeof autorizacaoDoAtor>,
): DecisaoDoPortaoDePapel {
  // `isset( $_POST['role'] )`.
  if (papelPedido === undefined) {
    return { recusado: false, papelProprioNaoAplicado: false };
  }

  // `current_user_can( 'promote_users' ) && ( ! $user_id || current_user_can(
  // 'promote_user', $user_id ) )`. Sem elas o portao e saltado SEM recusa.
  if (!perguntarPermissao(autorizacao, CAPACIDADE_DE_PROMOVER)) {
    return { recusado: false, papelProprioNaoAplicado: false };
  }
  if (
    contaAlvo !== null &&
    !podeSobreConta(autorizacao, CAPACIDADE_DE_PROMOVER_A_CONTA, contaAlvo)
  ) {
    return { recusado: false, papelProprioNaoAplicado: false };
  }

  // `! empty( $new_role ) && empty( $editable_roles[ $new_role ] )`: cadeia vazia
  // NAO e conferida. Ver a ressalva do cabecalho.
  if (
    papelPedido !== '' &&
    !papeisEditaveis(contexto.base.matriz, contexto.ganchos).includes(papelPedido)
  ) {
    return { recusado: true, papelProprioNaoAplicado: false };
  }

  const ehOProprioAtor = contaAlvo !== null && contaAlvo === contexto.ator.contaId;
  const aplicavel =
    (contexto.base.rede.ativa &&
      perguntarPermissao(autorizacao, CAPACIDADE_DE_REDE_QUE_DISPENSA_A_TRAVA)) ||
    !ehOProprioAtor ||
    papelConcede(
      contexto.base.matriz,
      papelPedido,
      CAPACIDADE_QUE_O_PROPRIO_PAPEL_PRECISA_CONSERVAR,
      contexto.ganchos,
    );

  if (!aplicavel) {
    return { recusado: false, papelProprioNaoAplicado: true };
  }

  return { recusado: false, papel: papelPedido, papelProprioNaoAplicado: false };
}

/** O que a validacao recebe: o que o formulario enviou, em forma comum. */
interface CamposDoFormulario {
  readonly login: string;
  readonly email: string;
  readonly senha: string;
  readonly confirmacaoDeSenha?: string;
}

/**
 * Os nove ramos da validacao de `includes/user.php:156`-`:236`, na ordem, com os
 * itens **somando**.
 *
 * `contaAtual` e `null` na criacao: e o `$update` do legado, invertido.
 */
function validarFormulario(
  campos: CamposDoFormulario,
  loginSanitizado: string,
  contaAtual: Conta | null,
  contexto: ContextoDaAdministracaoDeContas,
): ErroDaAdministracao {
  const criando = contaAtual === null;
  const itens: ItemDeErroDaAdministracao[] = [];
  const senha = campos.senha;
  const confirmacao = campos.confirmacaoDeSenha ?? campos.senha;

  // 1. Login vazio.
  if (loginSanitizado === '') {
    itens.push({
      codigo: 'user_login',
      mensagem: MENSAGENS_DE_ERRO_DA_ADMINISTRACAO.user_login_vazio,
    });
  }

  // 2. Apelido de exibicao vazio, so na alteracao.
  //
  // ⚠️ **Inalcancavel neste porte**, e de proposito: o campo de perfil nao e
  // recebido. Ver a ultima secao do cabecalho. O ramo fica escrito para que
  // quem acrescentar o bloco de perfil o encontre no lugar certo da ordem.

  // 3. Senha ausente, so na criacao.
  if (criando && senha === '') {
    itens.push({
      codigo: 'pass',
      mensagem: MENSAGENS_DE_ERRO_DA_ADMINISTRACAO.pass_vazia,
    });
  }

  // 4. Barra invertida na senha. Vale na criacao e na alteracao.
  if (senha.includes('\\')) {
    itens.push({
      codigo: 'pass',
      mensagem: MENSAGENS_DE_ERRO_DA_ADMINISTRACAO.pass_com_barra,
    });
  }

  // 5. Senha diferente da confirmacao. Na ALTERACAO a comparacao acontece
  //    sempre — inclusive com as duas vazias, caso em que ela passa.
  if ((!criando || senha !== '') && senha !== confirmacao) {
    itens.push({
      codigo: 'pass',
      mensagem: MENSAGENS_DE_ERRO_DA_ADMINISTRACAO.pass_diferente,
    });
  }

  if (criando) {
    // 6. Caractere ilegal: a comparacao e sobre o valor CRU.
    if (!loginEnviadoEhValido(campos.login, contexto.removerAcentos)) {
      itens.push({
        codigo: 'user_login',
        mensagem: MENSAGENS_DE_ERRO_DA_ADMINISTRACAO.user_login_invalido,
      });
    }

    // 7. Login duplicado — `U2`, conferido em codigo e nao no armazenamento.
    if (contexto.armazenamento.contas.obterPorLogin(loginSanitizado) !== null) {
      itens.push({
        codigo: 'user_login',
        mensagem: MENSAGENS_DE_ERRO_DA_ADMINISTRACAO.user_login_duplicado,
      });
    }
  }

  // 8. Lista de proibidos (`U3`) — vale TAMBEM na alteracao. Ver o cabecalho.
  if (loginEstaProibido(loginSanitizado, loginsProibidos(contexto))) {
    itens.push({
      codigo: 'invalid_username',
      mensagem: MENSAGENS_DE_ERRO_DA_ADMINISTRACAO.invalid_username,
    });
  }

  // 9. O e-mail, em cadeia de `senao`: os tres nao somam entre si.
  if (campos.email === '') {
    itens.push({
      codigo: 'empty_email',
      mensagem: MENSAGENS_DE_ERRO_DA_ADMINISTRACAO.empty_email,
    });
  } else if (!ehEmail(campos.email)) {
    itens.push({
      codigo: 'invalid_email',
      mensagem: MENSAGENS_DE_ERRO_DA_ADMINISTRACAO.invalid_email,
    });
  } else {
    const dono = contexto.armazenamento.contas.obterPorEmail(campos.email);
    if (dono !== null && (criando || dono.id !== contaAtual?.id)) {
      itens.push({
        codigo: 'email_exists',
        mensagem: MENSAGENS_DE_ERRO_DA_ADMINISTRACAO.email_exists,
      });
    }
  }

  return erroDaAdministracao(...itens);
}

/** O que a notificacao de conta nova produziu, nas duas metades. */
interface NotificacaoDaContaNova {
  readonly envios: readonly ResultadoDeEnvio[];
  readonly doTitular: ResultadoDaNotificacaoDeContaNova | null;
}

/**
 * `wp_new_user_notification( $conta, null, $modo )` — as duas mensagens, na ordem
 * do legado: **primeiro** o administrador do site, **depois** o titular.
 *
 * A do titular reusa o ponto de substituicao do cadastro aberto, e isso e o
 * legado: no legado as duas telas chamam a MESMA funcao substituivel. Ver
 * `contexto-de-administracao.ts`.
 */
function notificarContaNova(
  contexto: ContextoDaAdministracaoDeContas,
  conta: { readonly contaId: number; readonly login: string; readonly email: string },
  modo: ModoDeNotificacaoDeContaNova,
  comprimentoDaChave: number,
): NotificacaoDaContaNova {
  const envios: ResultadoDeEnvio[] = [];

  // `'user' !== $notify && true === $send_notification_to_admin`. Os dois modos
  // deste porte avisam o administrador; o modo `user` do legado, que nao avisa,
  // nao e alcancavel por esta tela (`user-new.php:242` so monta `both` e `admin`).
  if (
    contexto.ganchos?.filtrarAvisoDeContaNovaAoAdministrador?.(
      true,
      conta.contaId,
    ) ??
    true
  ) {
    envios.push(
      contexto.email.enviar(
        mensagemDeContaNovaAoAdministrador(
          {
            login: conta.login,
            email: conta.email,
            tituloDoSite: contexto.opcoes.tituloDoSite,
            emailDoAdministrador: contexto.opcoes.emailDoAdministrador,
          },
          contexto.ganchos,
        ),
      ),
    );
  }

  // `if ( 'admin' === $notify || true !== $send_notification_to_user ) return;`
  if (
    modo !== 'ambos' ||
    !(
      contexto.ganchos?.filtrarAvisoDeContaNovaAoTitular?.(true, conta.contaId) ??
      true
    )
  ) {
    return { envios, doTitular: null };
  }

  const notificacao =
    contexto.notificacao ??
    criarNotificacaoDeContaNovaDoNucleo({
      email: contexto.email,
      contas: contexto.armazenamento.contas,
      resumoDaChave: contexto.resumoDaChave,
    });

  const doTitular = notificacao.notificar({
    contaId: conta.contaId,
    login: conta.login,
    email: conta.email,
    agoraEmSegundos: contexto.relogio.agoraEmSegundos(),
    tituloDoSite: contexto.opcoes.tituloDoSite,
    chaveEmClaro: gerarSegredo(
      comprimentoDaChave,
      contexto.aleatorio ?? ALEATORIEDADE_DO_RUNTIME,
    ),
    urlDeEntrada: contexto.opcoes.urlDeEntrada,
    montarUrlDaRede: contexto.montarUrlDaRede,
  });

  return { envios: [...envios, ...doTitular.envios], doTitular };
}
