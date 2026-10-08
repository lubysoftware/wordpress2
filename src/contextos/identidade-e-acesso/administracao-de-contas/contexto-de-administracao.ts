/**
 * O contexto de uma operacao de administracao de contas: tudo que as acoes de
 * UC-24 precisam e que **nao e** porta deste modulo.
 *
 * Entrega de **T023** da feature `001-identidade-e-acesso` (US-11). Mesma forma e
 * mesmas razoes de `../cadastro/contexto-de-cadastro.ts` e de
 * `../autenticacao/contexto-de-autenticacao.ts`, e elas valem palavra por palavra
 * aqui:
 *
 * - **contexto por argumento, nao estado de modulo.** AD-02 e BR-MIGRAR-105
 *   (`EXT-CONTEXTO`) poem identidade no escopo da REQUISICAO, e a area 5 do
 *   criterio de paridade tem tolerancia zero. Nesta tarefa isso pesa dobrado: a
 *   administracao pergunta permissao **uma vez por conta alvo** (CA-11.1), e um
 *   ator guardado em estado de modulo trocaria de identidade no meio do lote;
 * - **os ganchos e as colaboracoes chegam aqui, e nao como porta.** AD-08 fixa
 *   portas somente nas 5 bordas; AD-10 manda resolver toda chamada entre
 *   contextos no momento da chamada.
 *
 * ---
 *
 * # O acervo da conta e porta, e a razao e a cascata (P5)
 *
 * Apagar uma conta **nao** e so apagar a linha de `users`: `wp_delete_user()`
 * (`wp-admin/includes/user.php:351`) toca `posts` e `links`, e deliberadamente
 * **nao** toca `comments`. Nenhuma dessas tres tabelas e desta feature. O **P5**
 * poe o resultado no contrato observavel — *"mantenha, no modelo novo,
 * exatamente o que desaparece e o que fica orfao"* —, logo a cascata precisa
 * existir, com fronteira declarada, e nao pode ser inventada aqui.
 *
 * {@link AcervoDaConta} e essa fronteira: tres perguntas, implementadas pela
 * feature do conteudo, e o comentario orfao **fora** delas de proposito. Ver a
 * nota em {@link AcervoDaConta}.
 */

import type {
  AtorDeAutorizacao,
  BaseDeAutorizacao,
} from '../../../plataforma/autorizacao/index.js';
import type { RepositorioDeContas } from '../armazenamento/conta.js';
import type { RepositorioDeMetadadosDeConta } from '../armazenamento/perfil.js';
import type { RepositorioDePapeis } from '../armazenamento/repositorio-de-papeis.js';
import type { RemocaoDeAcentos } from '../autenticacao/normalizacao-de-credencial.js';
import type { GeradorDeHashDeSenha } from '../autenticacao/geracao-de-hash-de-senha.js';
import type { ResumoDaChaveDeRedefinicao } from '../cadastro/chave-de-redefinicao.js';
import type { LimitesDoCadastro } from '../cadastro/configuracao-de-cadastro.js';
import type { GanchosDoCadastro } from '../cadastro/contexto-de-cadastro.js';
import type { FonteDeAleatoriedade } from '../cadastro/geracao-de-segredo.js';
import type { NotificacaoDeContaNova } from '../cadastro/notificacao-de-conta-nova.js';
import type { ApelidoDeTexto } from '../cadastro/validacao-de-cadastro.js';
import type { PortaDeEmail, PortaDeRelogio } from '../portas/index.js';
import type { GanchosDasMensagensDaAdministracao } from './notificacoes-da-administracao.js';
import type {
  ChavesDaAutorizacaoDaConta,
  GanchosDoPapelDaConta,
} from './papel-da-conta.js';
import type { GanchosDosPapeisEditaveis } from './papeis-editaveis.js';

/** O que a administracao le e grava do armazenamento de BC-05. */
export interface ArmazenamentoDaAdministracaoDeContas {
  readonly contas: RepositorioDeContas;
  readonly papeis: RepositorioDePapeis;
  readonly perfil: RepositorioDeMetadadosDeConta;
}

/**
 * O que a conta tem **fora** deste modulo, e o que acontece com isso quando ela
 * e apagada ou desvinculada.
 *
 * `wp_delete_user()` tem dois ramos e eles nao sao simetricos:
 *
 * | ramo | `posts` | `links` | `comments` |
 * |---|---|---|---|
 * | sem reatribuicao | **apagados**, e so os dos tipos que o registro marca como apagaveis com o autor | **apagados** | **intactos** |
 * | com reatribuicao | `post_author` passa ao destino, **todos** os tipos | `link_owner` passa ao destino | **intactos** |
 *
 * ⚠️ **O comentario orfao nao esta nesta porta, e a ausencia e a regra.**
 * `target_data_model.md` poe a razao entre os tres motivos pelos quais a
 * integridade referencial esta desativada: *"comentario orfao e **estado
 * normal**: apagar o usuario **nao** toca nos comentarios, de proposito, para
 * preservar o historico da discussao"*, e `erd-complete.md` registra `0` como
 * *"anonimo legitimo"*. Uma porta com `apagarComentarios` convidaria a chamar o
 * metodo; nao ter o metodo e o que torna a omissao legivel. O **P5** cobra o
 * teste que afirma o que **permaneceu orfao**, e ele esta na suite desta tarefa.
 *
 * ⚠️ **A assimetria dos tipos de conteudo tambem fica desta porta para la.** Qual
 * tipo e apagado junto com o autor sai do registro do tipo
 * (`delete_with_user`, com o ponto de extensao `post_types_to_delete_with_user`),
 * e registro de tipo e da feature do conteudo. Reproduzi-la aqui seria reescrever
 * o catalogo de tipos dentro do modulo de identidade.
 */
export interface AcervoDaConta {
  /**
   * A conta tem conteudo? — `wp-admin/users.php:373`-`:395`, e e CA-11.3.
   *
   * No legado sao tres perguntas em cadeia, com curto-circuito: o ponto de
   * extensao `users_have_additional_content` (valor de fabrica **falso**),
   * depois `SELECT ID FROM posts WHERE post_author = ? LIMIT 1`, depois `SELECT
   * link_id FROM links WHERE link_owner = ? LIMIT 1`. A primeira **pode abrir** a
   * escolha para uma conta sem post nenhum, e e por isso que ela e ponto de
   * extensao e nao consulta.
   *
   * A resposta decide se a tela oferece a escolha entre reatribuir e apagar. Ela
   * **nao** decide a exclusao: com conteudo ou sem, a opcao escolhida e o que
   * manda.
   */
  contaTemConteudo(contaId: number): boolean;

  /** O ramo sem reatribuicao: apaga o que o registro do tipo manda apagar. */
  apagarConteudoDaConta(contaId: number): void;

  /**
   * O ramo com reatribuicao: `post_author` e `link_owner` passam ao destino.
   *
   * ⚠️ O legado **nao** confere se o destino existe: `wp_delete_user( $id,
   * $reassign )` converte para inteiro e manda o `UPDATE`. Reatribuir a uma conta
   * inexistente produz conteudo com autor inexistente — orfao, que e estado
   * normal neste banco. Conferir aqui fecharia uma porta que o legado deixa
   * aberta.
   */
  reatribuirConteudoDaConta(contaId: number, destinoId: number): void;
}

/**
 * O que a **instalacao** informa, e que a administracao le.
 *
 * Mesma postura de `OpcoesDoCadastro`: o registro de opcoes (`REG-Opcao`) nao
 * existe nesta arvore, e o *Modelo de dados* desta feature declara uma unica
 * chave de `options`. Logo a opcao e **entrada lida de fora**.
 */
export interface OpcoesDaAdministracaoDeContas {
  /** `default_role` — o papel de quem e criado sem papel declarado. */
  readonly papelPadrao: string;
  /** `blogname` — entra no assunto das tres mensagens. */
  readonly tituloDoSite: string;
  /** `admin_email` — destinatario do aviso de conta nova, e `###ADMIN_EMAIL###`. */
  readonly emailDoAdministrador: string;
  /** `home_url()` — `###SITEURL###` nas duas mensagens de alteracao. */
  readonly urlDoSite: string;
  /** A URL de entrada do site, que a notificacao de conta nova poe no corpo. */
  readonly urlDeEntrada: string;
  /**
   * `get_site_option( 'add_new_users' )` — `N6` (BR-MIGRAR-066).
   *
   * **Nasce desligada**, e e isso que faz de criar conta uma permissao de rede:
   * sem ela, `create_users` so passa para super administrador.
   */
  readonly adicaoDeContaLiberadaNaRede: boolean;
}

/** O valor de fabrica de cada opcao desta familia. */
export const OPCOES_DA_ADMINISTRACAO_DE_FABRICA: OpcoesDaAdministracaoDeContas = {
  papelPadrao: 'subscriber',
  tituloDoSite: '',
  emailDoAdministrador: '',
  urlDoSite: '',
  urlDeEntrada: '',
  adicaoDeContaLiberadaNaRede: false,
};

/**
 * Os pontos de extensao que a administracao de contas atravessa.
 *
 * Tres familias chegam por heranca, e as tres sao reuso **do legado** e nao
 * economia de digitacao: `editable_roles` e `role_has_cap` sao da leitura de
 * papel, os tres de `set_role` sao da escrita, os tres de mensagem sao do envio,
 * e `illegal_user_logins` e **literalmente o mesmo filtro** que o cadastro aberto
 * atravessa (`includes/user.php:205` e `user.php:3577` registram um `@see` para o
 * outro). Declarar um ponto proprio aqui daria a entender que uma extensao pode
 * proibir um login no cadastro e nao no painel.
 */
export interface GanchosDaAdministracaoDeContas
  extends GanchosDosPapeisEditaveis,
    GanchosDoPapelDaConta,
    GanchosDasMensagensDaAdministracao,
    Pick<GanchosDoCadastro, 'filtrarLoginsProibidos'> {
  /**
   * `users_have_additional_content`: **filtro**, valor de fabrica `false`.
   *
   * Dispara **antes** das duas consultas de conteudo e pode abrir a escolha de
   * CA-11.3 para uma conta que nao escreveu nada. Quem o implementa e a porta
   * {@link AcervoDaConta}; esta declaracao existe para que o inventario do **P2**
   * o encontre pelo nome.
   */
  readonly filtrarContaTemConteudo?: (
    temConteudo: boolean,
    contaId: number,
  ) => boolean;
  /**
   * `delete_user`: **acao**, dispara **antes** de qualquer escrita da exclusao.
   *
   * Recebe o identificador, o destino da reatribuicao (`null` quando nao ha) e a
   * conta ainda existente — e essa terceira coisa e o que a torna util: depois
   * desta acao a linha some.
   */
  readonly aoApagarConta?: (contaId: number, destinoId: number | null) => void;
  /** `deleted_user`: **acao**, depois de a conta ter sido apagada. */
  readonly contaApagada?: (contaId: number, destinoId: number | null) => void;
  /**
   * `remove_user_from_blog`: **acao**, antes de a conta perder as capacidades do
   * site.
   */
  readonly aoRemoverContaDoSite?: (
    contaId: number,
    siteId: number,
    destinoId: number,
  ) => void;
  /**
   * `edit_user_created_user`: **acao**, depois de a conta criada pelo
   * administrador existir e **antes** da notificacao.
   *
   * Recebe o identificador e o modo de notificacao, como no legado
   * (`wp-admin/includes/user.php:253`). No legado e esta acao que **dispara** o
   * envio: quem a remove tira a notificacao junto.
   */
  readonly aoCriarContaPorAdministrador?: (
    contaId: number,
    modo: ModoDeNotificacaoDeContaNova,
  ) => void;
  /** `send_password_change_email`: **filtro**, valor de fabrica `true`. */
  readonly filtrarEnvioDeAvisoDeSenha?: (enviar: boolean, contaId: number) => boolean;
  /** `send_email_change_email`: **filtro**, valor de fabrica `true`. */
  readonly filtrarEnvioDeAvisoDeEmail?: (enviar: boolean, contaId: number) => boolean;
  /** `wp_send_new_user_notification_to_admin`: **filtro**, valor de fabrica `true`. */
  readonly filtrarAvisoDeContaNovaAoAdministrador?: (
    enviar: boolean,
    contaId: number,
  ) => boolean;
  /** `wp_send_new_user_notification_to_user`: **filtro**, valor de fabrica `true`. */
  readonly filtrarAvisoDeContaNovaAoTitular?: (
    enviar: boolean,
    contaId: number,
  ) => boolean;
}

/**
 * Os tres modos de `wp_new_user_notification()`
 * (`wp-includes/pluggable.php:2276`).
 *
 * ⚠️ **O modo de fabrica da criacao por administrador e `admin`, nao `ambos`**:
 * `wp-admin/user-new.php:242` monta `isset( $_POST['send_user_notification'] ) ?
 * 'both' : 'admin'`, logo **sem** a caixa marcada o titular nao recebe nada e so
 * o administrador do site e avisado. O formulario nasce com a caixa marcada, mas
 * isso e da tela: a operacao recebe a escolha.
 */
export type ModoDeNotificacaoDeContaNova = 'ambos' | 'administrador';

/**
 * O contexto de uma operacao de administracao de contas.
 *
 * Tres campos sao de **autorizacao** e chegam separados de proposito:
 * {@link base} e o que nao muda dentro da requisicao (matriz, rede, constantes),
 * {@link ator} e quem administra, e {@link opcoes} traz a opcao de rede que o
 * `case` de `create_users` consulta. Junta-los esconderia que a mesma base e
 * exercitada com **um ator por conta alvo** na pergunta de CA-11.1.
 */
export interface ContextoDaAdministracaoDeContas {
  /** A base da decisao de capacidade: matriz gravada, rede, constantes, casos. */
  readonly base: BaseDeAutorizacao;
  /** Quem administra. */
  readonly ator: AtorDeAutorizacao;

  readonly armazenamento: ArmazenamentoDaAdministracaoDeContas;
  /** Os nomes de `{site}capabilities` e `{site}user_level`. */
  readonly chaves: ChavesDaAutorizacaoDaConta;
  readonly acervo: AcervoDaConta;
  readonly email: PortaDeEmail;
  readonly relogio: PortaDeRelogio;

  readonly opcoes: OpcoesDaAdministracaoDeContas;

  /**
   * O site desta requisicao — o `get_current_blog_id()` do legado.
   *
   * Entra porque `remove_user_from_blog( $id, $blog_id )` o recebe e o repassa ao
   * ponto de extensao. Fora de uma instalacao de rede ele e `1`, que e o valor do
   * instalador.
   */
  readonly siteId: number;

  /** Os limites do codigo que a criacao reusa. Omitidos, valem os de fabrica. */
  readonly limites?: LimitesDoCadastro;

  /** Ver a ressalva de `../cadastro/contexto-de-cadastro.ts`: sem padrao. */
  readonly removerAcentos: RemocaoDeAcentos;
  /** Ver a ressalva de `../cadastro/contexto-de-cadastro.ts`: sem padrao. */
  readonly apelidoDeTexto: ApelidoDeTexto;
  /** Ver a ressalva de `../cadastro/contexto-de-cadastro.ts`: sem padrao. */
  readonly resumoDaChave: ResumoDaChaveDeRedefinicao;

  readonly geradorDeHashDeSenha: GeradorDeHashDeSenha;

  /** O sorteio dos dois segredos da conta nova. Omitido, vale o do runtime. */
  readonly aleatorio?: FonteDeAleatoriedade;

  /** Transforma um caminho em endereco absoluto da rede. Da borda. */
  readonly montarUrlDaRede: (caminho: string) => string;

  /**
   * A notificacao de conta nova — o **mesmo** ponto de substituicao do cadastro
   * aberto.
   *
   * E o mesmo de proposito: no legado as duas telas chamam a **mesma** funcao
   * substituivel, `wp_new_user_notification()`. Declarar um ponto proprio aqui
   * daria a entender que uma extensao pode trocar a notificacao de uma tela sem
   * trocar a da outra, e no legado ela nao pode.
   */
  readonly notificacao?: NotificacaoDeContaNova;

  readonly ganchos?: GanchosDaAdministracaoDeContas;
}
