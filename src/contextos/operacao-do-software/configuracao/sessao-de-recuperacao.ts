/**
 * A sessao de modo de recuperacao: dois prazos, quatro comprimentos, cinco
 * opcoes e tres pontos de extensao.
 *
 * Entrega de **T002** da feature `010-operacao-do-software`, terceiro dos tres
 * grupos que a tarefa nomeia. A secao *Modelo de dados* do plano descreve a
 * linha inteira — *"chave com resumo criptografico, cookie de uma semana, e
 * marcador de aviso diario gravado **antes** do envio"* — e acrescenta a regra:
 * *"o marcador antes do envio e regra: falhar na gravacao aborta o aviso"*.
 *
 * `A10` (BR-MIGRAR-054) e a regra, com as tres ancoras dela:
 * `class-wp-recovery-mode-cookie-service.php:46` (a semana do cookie),
 * `class-wp-recovery-mode.php:307` (o dia entre avisos) e
 * `class-wp-recovery-mode-email-service.php:53` (o marcador antes do envio). E
 * a justificativa de migracao e a frase que esta tarefa nao pode contrariar:
 * *"A ordem (gravar antes de enviar) e a regra, e ela escolhe perder o aviso em
 * vez de arriscar repeticao"*.
 *
 * ── A ESCALA DA PAUSA E A SESSAO, E ISSO E ESTRUTURA DE DADO ───────────────
 *
 * 🔴 O nome da opcao de extensoes pausadas **carrega o identificador da
 * sessao** (`nomeDaOpcaoDeExtensoesPausadas` em
 * `../armazenamento/chaves-e-tabelas.ts`). UC-36 poe isso entre as tres coisas
 * que um porte precisa saber, e CA-12.3 o cobra: *"o visitante continua vendo o
 * site como estava"*. Nao e detalhe de nomenclatura — e o que faz a feature ser
 * usavel em producao, e um porte que use nome fixo entrega a pausa ao
 * visitante.
 *
 * ── OS TRES COMPORTAMENTOS QUE SE PERDEM SE O PRAZO VIRAR CONSTANTE SOLTA ──
 *
 * **1. O prazo do link nao e um numero: e um `max`.** `get_link_ttl()` parte do
 * limite entre avisos, passa pelo ponto de extensao
 * `recovery_mode_email_link_ttl` e devolve
 * `max( $valid_for, $rate_limit )` (`class-wp-recovery-mode.php:317` a `:334`).
 * O comentario do legado diz por que: *"The ttl must be at least as long as the
 * email rate limit"*. Um interceptador que encurte o link **nao encurta nada**;
 * um que o alongue, alonga. Ver {@link prazoDoLinkDeRecuperacao}.
 *
 * **2. O limite entre avisos tem ponto de extensao proprio, e o prazo do link
 * depende dele.** `recovery_mode_email_rate_limit` nasce em `DAY_IN_SECONDS`
 * (`:307`), e e o valor filtrado dele que entra no `max` acima. Dobrar o limite
 * dobra o prazo do link, sem que ninguem toque no segundo filtro.
 *
 * **3. O cookie vale uma semana, e o mesmo ponto de extensao e consultado DUAS
 * vezes com o mesmo nome.** `recovery_mode_cookie_length` e aplicado ao gravar
 * (`class-wp-recovery-mode-cookie-service.php:46`) **e** ao validar (`:99`), e
 * a validacao compara `time() > $created_at + $length` com o valor **do momento
 * da validacao**, nao com o que valia quando o cookie foi emitido. Reduzir o
 * prazo por interceptador invalida cookie ja emitido; aumenta-lo revive cookie
 * vencido. O prazo nao viaja dentro do cookie — so o instante de emissao viaja.
 *
 * ── O QUE NAO ESTA AQUI, DE PROPOSITO ──────────────────────────────────────
 *
 * - **Gerar, verificar e consumir a chave.** 🔴 A chave e **consumida antes de
 *   ser verificada** (ADR 0007, `class-wp-recovery-mode-key-service.php:91`), e
 *   isso e divida herdada registrada — o cenario `@divida-herdada` de PT-013 a
 *   cobra. Reproduzi-la e **T027** (US-13); a forma do registro gravado e
 *   daqui.
 * - **O resumo criptografico.** `wp_fast_hash()` e `wp_verify_fast_hash()`
 *   (`:51` e `:97`) sao a borda de hash do plano, nao desta feature: AD-08 nao
 *   a lista entre as cinco bordas deste modulo e `modulo.test.ts` afirma desde
 *   T001 que as portas sao **quatro**. {@link ChaveDeRecuperacaoGravada} guarda
 *   o resumo como **texto opaco**, que e tudo o que a coluna sabe dele.
 * - **Montar, assinar e ler o cookie.** Os nomes e o formato estao declarados
 *   aqui porque sao contrato publico; a montagem e **T025**, e ela e borda —
 *   cabecalho HTTP nao e configuracao.
 * - **Pausar, retomar e sair.** `A12` retoma todas de uma vez e zera o limite
 *   (`class-wp-recovery-mode.php:206` a `:217`), e e **T025**. ⚠️ O que esta
 *   tarefa deixa registrado para la: `delete_all()` e **por tipo**, e quando o
 *   outro tipo ainda tem registro o legado **grava** em vez de apagar
 *   (`class-wp-paused-extensions-storage.php:185` a `:193`) — sair da
 *   recuperacao com um plugin e um tema pausados emite **duas** escritas, e so
 *   a segunda e um `DELETE`.
 * - **Quem tem `resume_plugins`.** 🔴 UC-36 registra que a capacidade *"nao
 *   esta em papel algum: entra por filtro"*, e CA-12.7 cobra que exista conta
 *   capaz de retomar numa instalacao de fabrica. E autorizacao, e e de T025.
 */

import {
  arranjo,
  arranjoPorNome,
  inteiro,
  nomeDaChave,
  texto,
  type EntradaDeArranjo,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import {
  nomeDaOpcaoDeExtensoesPausadas,
  OPCAO_DA_CHAVE_DE_ASSINATURA_DE_RECUPERACAO,
  OPCAO_DE_CHAVES_DE_RECUPERACAO,
  OPCAO_DO_SAL_DE_ASSINATURA_DE_RECUPERACAO,
  OPCAO_DO_ULTIMO_AVISO_DE_RECUPERACAO,
  type EscopoDeRede,
  type RepositorioDeOpcoesDeRede,
  type RepositorioDeOpcoesDoSite,
} from '../armazenamento/index.js';
import { SEGUNDOS_POR_DIA, SEGUNDOS_POR_SEMANA } from './prazos.js';

/**
 * `DAY_IN_SECONDS`: um aviso por dia, que e a metade de `A10` que o `Contexto:`
 * de PT-013 mede (*"o numero de avisos enviados por dia e um nas duas"*).
 *
 * Valor de fabrica do ponto de extensao
 * {@link PONTO_DE_EXTENSAO_DO_LIMITE_DE_AVISO}
 * (`wp-includes/class-wp-recovery-mode.php:307`).
 */
export const LIMITE_ENTRE_AVISOS_DE_RECUPERACAO_EM_SEGUNDOS = SEGUNDOS_POR_DIA;

/**
 * `WEEK_IN_SECONDS`: a semana de `A10`
 * (`wp-includes/class-wp-recovery-mode-cookie-service.php:46`).
 *
 * Valor de fabrica do ponto de extensao
 * {@link PONTO_DE_EXTENSAO_DO_PRAZO_DO_COOKIE}, que e consultado tanto ao
 * gravar quanto ao validar — ver o cabecalho.
 */
export const PRAZO_DO_COOKIE_DE_RECUPERACAO_EM_SEGUNDOS = SEGUNDOS_POR_SEMANA;

/**
 * O prazo do link, que e `max( $valid_for, $rate_limit )`
 * (`wp-includes/class-wp-recovery-mode.php:333`).
 *
 * Os dois argumentos chegam **ja filtrados**, porque os dois pontos de extensao
 * sao de quem os dispara (T025): `limiteEntreAvisos` e o retorno de
 * `recovery_mode_email_rate_limit` e `validoPor` o de
 * `recovery_mode_email_link_ttl`, que nasce igual ao primeiro.
 *
 * O `max` e a regra, e nao uma defesa: *"The ttl must be at least as long as
 * the email rate limit"*. Sem ele, um link poderia vencer antes de o proximo
 * aviso poder ser pedido, e o site ficaria sem caminho de volta por um dia.
 */
export function prazoDoLinkDeRecuperacao(
  validoPor: number,
  limiteEntreAvisos: number,
): number {
  return Math.max(validoPor, limiteEntreAvisos);
}

/**
 * 22 caracteres: o comprimento do **token** que identifica a chave no
 * armazenamento (`wp_generate_password( 22, false )`,
 * `class-wp-recovery-mode-key-service.php:33`).
 *
 * `false` no segundo argumento e *"sem caracteres especiais"*: o token e a
 * **chave de arranjo** do valor serializado e viaja na URL de recuperacao.
 */
export const COMPRIMENTO_DO_TOKEN_DE_RECUPERACAO = 22;

/**
 * 22 caracteres: o comprimento da **chave** em texto claro, que e enviada por
 * e-mail e nunca gravada (`class-wp-recovery-mode-key-service.php:46`).
 */
export const COMPRIMENTO_DA_CHAVE_DE_RECUPERACAO = 22;

/**
 * 20 caracteres: o aleatorio dentro do cookie, que tambem **e** o identificador
 * da sessao depois de passar por `sha1()`
 * (`class-wp-recovery-mode-cookie-service.php:181` e `:142`).
 */
export const COMPRIMENTO_DO_ALEATORIO_DO_COOKIE = 20;

/**
 * 64 caracteres, **com** caracteres especiais e extra-especiais
 * (`wp_generate_password( 64, true, true )`,
 * `class-wp-recovery-mode-cookie-service.php:221` e `:236`): a chave e o sal
 * gerados quando a instalacao nao declarou os seus.
 */
export const COMPRIMENTO_DO_SEGREDO_DE_ASSINATURA = 64;

/** `recovery_mode_email_rate_limit` (`class-wp-recovery-mode.php:307`). */
export const PONTO_DE_EXTENSAO_DO_LIMITE_DE_AVISO =
  'recovery_mode_email_rate_limit';

/** `recovery_mode_email_link_ttl` (`class-wp-recovery-mode.php:331`). */
export const PONTO_DE_EXTENSAO_DO_PRAZO_DO_LINK =
  'recovery_mode_email_link_ttl';

/**
 * `recovery_mode_cookie_length` — aplicado **duas** vezes, ao gravar
 * (`class-wp-recovery-mode-cookie-service.php:46`) e ao validar (`:99`).
 */
export const PONTO_DE_EXTENSAO_DO_PRAZO_DO_COOKIE =
  'recovery_mode_cookie_length';

/**
 * `WP_RECOVERY_MODE_SESSION_ID`: a constante que **liga o modo sem cookie e sem
 * chave** (`wp-includes/class-wp-recovery-mode.php:103`).
 *
 * Declarada, ela vence tudo: o modo fica ativo, o identificador da sessao e o
 * valor dela, e nem o cookie nem o link sao consultados (`:104` a `:107`). E o
 * caminho de quem perdeu o acesso ao e-mail, e e tambem a razao pela qual a
 * pausa pode ser compartilhada entre pessoas: o identificador passa a ser
 * conhecido.
 */
export const CONSTANTE_DA_SESSAO_DE_RECUPERACAO = 'WP_RECOVERY_MODE_SESSION_ID';

/**
 * `'wordpress_rec_'`: o prefixo do nome do cookie, completado pelo `COOKIEHASH`
 * da instalacao (`wp-includes/default-constants.php:340`).
 *
 * O nome fica em ingles pelo mesmo motivo dos nomes de opcao: `RECOVERY_MODE_COOKIE`
 * e constante publicada, e a instalacao pode declarar a sua.
 */
export const PREFIXO_DO_COOKIE_DE_RECUPERACAO = 'wordpress_rec_';

/** `RECOVERY_MODE_COOKIE` (`wp-includes/default-constants.php:336`). */
export const CONSTANTE_DO_COOKIE_DE_RECUPERACAO = 'RECOVERY_MODE_COOKIE';

/**
 * `'recovery_mode'`: o primeiro dos quatro campos do cookie, e parte do que e
 * assinado (`class-wp-recovery-mode-cookie-service.php:181`).
 *
 * O formato e `recovery_mode|iat|rand|assinatura`, em base64, com `|` como
 * separador e **exatamente** quatro partes (`:157`). Montar e ler e **T025**:
 * os nomes estao aqui porque sao formato publicado.
 */
export const MARCA_ASSINADA_DO_COOKIE_DE_RECUPERACAO = 'recovery_mode';

/** As quatro partes do cookie (`class-wp-recovery-mode-cookie-service.php:157`). */
export const PARTES_DO_COOKIE_DE_RECUPERACAO = 4;

/** `'exit_recovery_mode'` — `WP_Recovery_Mode::EXIT_ACTION` (`class-wp-recovery-mode.php:17`). */
export const ACAO_DE_SAIR_DA_RECUPERACAO = 'exit_recovery_mode';

/**
 * `'recovery_mode_clean_expired_keys'` — o evento **diario** que remove chave
 * vencida (`class-wp-recovery-mode.php:97` e `:100`).
 *
 * E o que CA-13.4 cobra (*"chave vencida e removida por rotina agendada"*).
 * Agendar e da feature `011`; o nome esta aqui porque o evento e contrato
 * publico, e porque `clean_expired_keys()` grava **sempre** — logo, quando nada
 * venceu, nenhum comando sai (ver `../armazenamento/porta-falsa.ts`).
 */
export const EVENTO_DE_LIMPEZA_DE_CHAVES_DE_RECUPERACAO =
  'recovery_mode_clean_expired_keys';

/** `'plugin'` — o primeiro dos dois tipos de extensao pausavel. */
export const TIPO_DE_EXTENSAO_PLUGIN = 'plugin';

/** `'theme'` — o segundo. Fica em ingles: e **chave de arranjo gravada**. */
export const TIPO_DE_EXTENSAO_TEMA = 'theme';

/**
 * Uma chave de recuperacao como esta na coluna
 * (`class-wp-recovery-mode-key-service.php:50` a `:53`).
 *
 * O token e a **chave de arranjo**; o par gravado tem duas chaves, nesta ordem.
 */
export interface ChaveDeRecuperacaoGravada {
  /** A chave de arranjo: o token de {@link COMPRIMENTO_DO_TOKEN_DE_RECUPERACAO}. */
  readonly token: string;
  /**
   * `hashed_key` — **texto opaco**. O algoritmo e da borda de hash e nao desta
   * feature; a coluna so sabe que e texto.
   */
  readonly resumo: string;
  /** `created_at` — o instante de emissao, em segundos. */
  readonly criadaEm: number;
}

/**
 * O valor de fabrica de `recovery_keys`: **arranjo vazio**.
 *
 * E o default do proprio chamador — `get_option( $this->option_name, array() )`
 * (`class-wp-recovery-mode-key-service.php:168`) —, e nao uma linha semeada: o
 * instalador nao cria a opcao. A diferenca entre *"nunca houve chave"* e
 * *"havia e foram todas consumidas"* nao existe no legado depois de
 * `clean_expired_keys()`, que grava o arranjo vazio em vez de apagar a opcao.
 */
export const SEM_CHAVES_DE_RECUPERACAO: readonly ChaveDeRecuperacaoGravada[] =
  [];

/**
 * O arranjo de chaves pronto para gravar, na ordem em que as entradas estao na
 * lista.
 *
 * A ordem e observavel nos bytes, e no legado ela e a ordem de insercao do
 * arranjo: chave nova vai para o fim (`$records[ $token ] = ...`), chave
 * removida deixa as outras no lugar (`unset()`). Reordenar aqui mudaria o valor
 * gravado sem mudar o conteudo, e o cenario de paridade do codec e literal:
 * *"nenhuma das duas normaliza, reordena nem reindexa a estrutura"*.
 */
export function registroDeChavesDeRecuperacao(
  chaves: readonly ChaveDeRecuperacaoGravada[],
): ValorPhp {
  return arranjoPorNome(
    chaves.map((chave) => [
      chave.token,
      arranjoPorNome([
        ['hashed_key', texto(chave.resumo)],
        ['created_at', inteiro(chave.criadaEm)],
      ]),
    ]),
  );
}

/** Uma extensao pausada: o diretorio dela, e o erro que a pausou. */
export interface ExtensaoPausada {
  /** O nome do diretorio do plugin ou do tema, que e a chave de arranjo. */
  readonly slug: string;
  /**
   * O erro, **como o legado o guarda**: o retorno de `error_get_last()`, com as
   * quatro chaves `type`, `file`, `line` e `message`
   * (`class-wp-paused-extensions-storage.php:45` a `:52`).
   *
   * Fica como {@link ValorPhp} opaco porque a forma vem do runtime que capturou
   * o erro, e o runtime do alvo nao e o do legado: quem portar a captura (T025)
   * declara a forma, e esta tarefa nao a inventa.
   */
  readonly erro: ValorPhp;
}

/** A visao tipada da opcao `{sessao}_paused_extensions`. */
export interface ExtensoesPausadas {
  /** As do tipo `'plugin'`. */
  readonly plugins: readonly ExtensaoPausada[];
  /** As do tipo `'theme'`. */
  readonly temas: readonly ExtensaoPausada[];
  /** O arranjo como esta na coluna: dois niveis, tipo e depois diretorio. */
  readonly bruto: ValorPhp;
}

/** A opcao de extensoes pausadas de uma sessao que nunca pausou nada. */
export const SEM_EXTENSAO_PAUSADA: ExtensoesPausadas = {
  plugins: [],
  temas: [],
  bruto: arranjo([]),
};

/**
 * O arranjo de dois niveis pronto para gravar, na ordem do legado: cada tipo
 * aparece **quando tem entrada**, e so ai.
 *
 * O legado nunca grava `array( 'plugin' => array() )`: `delete()` e
 * `delete_all()` fazem `unset()` do tipo quando ele fica vazio
 * (`class-wp-paused-extensions-storage.php:107` e `:187`), e se o arranjo
 * inteiro ficar vazio a opcao e **apagada** em vez de gravada (`:112` e `:190`).
 * Quem decide entre gravar e apagar e T025; o que esta funcao garante e que a
 * forma gravada nunca tenha um tipo vazio dentro.
 */
export function registroDeExtensoesPausadas(
  plugins: readonly ExtensaoPausada[],
  temas: readonly ExtensaoPausada[],
): ValorPhp {
  const pares: [string, ValorPhp][] = [];
  if (plugins.length > 0) {
    pares.push([TIPO_DE_EXTENSAO_PLUGIN, porDiretorio(plugins)]);
  }
  if (temas.length > 0) {
    pares.push([TIPO_DE_EXTENSAO_TEMA, porDiretorio(temas)]);
  }
  return arranjoPorNome(pares);
}

function porDiretorio(extensoes: readonly ExtensaoPausada[]): ValorPhp {
  return arranjoPorNome(
    extensoes.map((extensao) => [extensao.slug, extensao.erro]),
  );
}

/**
 * As cinco opcoes da sessao de recuperacao, lidas e gravadas pela porta de
 * dados.
 *
 * Tres sao **por site** (as chaves, o marcador e a pausa) e duas sao **de
 * rede** (a chave e o sal de assinatura), e a diferenca e do legado: a
 * assinatura do cookie precisa valer para a instalacao inteira, porque o cookie
 * vale para o dominio.
 */
export interface SessaoDeRecuperacao {
  /**
   * `recovery_keys`, com {@link SEM_CHAVES_DE_RECUPERACAO} na ausencia.
   *
   * Entrada que nao seja arranjo de dois campos e **ignorada** aqui, e nao
   * recusada: o legado a le e devolve `invalid_recovery_key_format` no momento
   * da verificacao (`class-wp-recovery-mode-key-service.php:93`), que e T027 —
   * mas **depois de ja a ter removido**, que e o ADR 0007.
   */
  lerChaves(): readonly ChaveDeRecuperacaoGravada[];
  /**
   * `update_option( 'recovery_keys', ..., false )`
   * (`class-wp-recovery-mode-key-service.php:191`): autocarregamento
   * **desligado**, sempre.
   */
  gravarChaves(registro: ValorPhp): boolean;
  /**
   * `get_option( 'recovery_mode_email_last_sent' )`
   * (`class-wp-recovery-mode-email-service.php:55`).
   *
   * Devolve `null` quando a opcao nao existe **e** quando o valor gravado e
   * falso pela verdade de PHP, porque e assim que o legado o le:
   * `if ( ! $last_sent || ... )` (`:57`). Um marcador gravado com `0` nao
   * limita nada.
   */
  lerUltimoAviso(): number | null;
  /**
   * `update_option( self::RATE_LIMIT_OPTION, time() )`
   * (`class-wp-recovery-mode-email-service.php:58`), **sem** pedir
   * autocarregamento — logo o valor gravado na coluna e `'auto'`.
   *
   * 🔴 **O retorno importa.** E o unico ponto desta feature em que o resultado
   * de uma gravacao decide o fluxo: falhar aqui **aborta o aviso**
   * (`:59`), e `A10` registra que a ordem *"escolhe perder o aviso em vez de
   * arriscar repeti-lo"*. Quem chamar e descartar o retorno troca a regra.
   */
  gravarUltimoAviso(instante: number): boolean;
  /**
   * `delete_option( self::RATE_LIMIT_OPTION )` — o `clear_rate_limit()` que
   * `A12` executa ao sair da recuperacao
   * (`class-wp-recovery-mode-email-service.php:96`, chamado em
   * `class-wp-recovery-mode.php:211`).
   */
  apagarUltimoAviso(): boolean;
  /** `get_site_option( 'recovery_mode_auth_key' )` (cookie-service `:214`). */
  lerChaveDeAssinatura(escopo: EscopoDeRede): string | null;
  /** `update_site_option( 'recovery_mode_auth_key', ... )` (cookie-service `:222`). */
  gravarChaveDeAssinatura(escopo: EscopoDeRede, segredo: string): boolean;
  /** `get_site_option( 'recovery_mode_auth_salt' )` (cookie-service `:229`). */
  lerSalDeAssinatura(escopo: EscopoDeRede): string | null;
  /** `update_site_option( 'recovery_mode_auth_salt', ... )` (cookie-service `:237`). */
  gravarSalDeAssinatura(escopo: EscopoDeRede, segredo: string): boolean;
  /**
   * `get_option( "{$session_id}_paused_extensions", array() )`
   * (`class-wp-paused-extensions-storage.php:66`), com
   * {@link SEM_EXTENSAO_PAUSADA} na ausencia.
   */
  lerExtensoesPausadas(sessaoId: string): ExtensoesPausadas;
  /**
   * `update_option( "{$session_id}_paused_extensions", ..., false )`
   * (`class-wp-paused-extensions-storage.php:75`): autocarregamento
   * **desligado**, sempre.
   */
  gravarExtensoesPausadas(sessaoId: string, registro: ValorPhp): boolean;
  /**
   * `delete_option( "{$session_id}_paused_extensions" )`
   * (`class-wp-paused-extensions-storage.php:112` e `:190`) — o caminho em que
   * o arranjo ficou vazio.
   */
  apagarExtensoesPausadas(sessaoId: string): boolean;
}

export function criarSessaoDeRecuperacao(
  opcoesDoSite: RepositorioDeOpcoesDoSite,
  opcoesDeRede: RepositorioDeOpcoesDeRede,
): SessaoDeRecuperacao {
  function lerSegredo(escopo: EscopoDeRede, nome: string): string | null {
    const leitura = opcoesDeRede.ler(escopo, nome);
    if (!leitura.existe) {
      return null;
    }
    const valor = cadeiaDoValor(leitura.valor);
    // `if ( ! $auth_key )` (cookie-service `:216`): segredo gravado vazio conta
    // como ausente, e o legado gera outro.
    return valor === '' ? null : valor;
  }

  return {
    lerChaves() {
      const leitura = opcoesDoSite.ler(OPCAO_DE_CHAVES_DE_RECUPERACAO);
      if (!leitura.existe || leitura.valor.tipo !== 'arranjo') {
        return SEM_CHAVES_DE_RECUPERACAO;
      }
      const chaves: ChaveDeRecuperacaoGravada[] = [];
      for (const entrada of leitura.valor.entradas) {
        const chave = chaveGravada(entrada);
        if (chave !== null) {
          chaves.push(chave);
        }
      }
      return chaves;
    },

    gravarChaves(registro) {
      return opcoesDoSite.gravar(
        OPCAO_DE_CHAVES_DE_RECUPERACAO,
        registro,
        false,
      );
    },

    lerUltimoAviso() {
      const leitura = opcoesDoSite.ler(OPCAO_DO_ULTIMO_AVISO_DE_RECUPERACAO);
      if (!leitura.existe) {
        return null;
      }
      const instante = numeroDoValor(leitura.valor);
      return instante === 0 ? null : instante;
    },

    gravarUltimoAviso(instante) {
      return opcoesDoSite.gravar(
        OPCAO_DO_ULTIMO_AVISO_DE_RECUPERACAO,
        inteiro(instante),
      );
    },

    apagarUltimoAviso() {
      return opcoesDoSite.apagar(OPCAO_DO_ULTIMO_AVISO_DE_RECUPERACAO);
    },

    lerChaveDeAssinatura(escopo) {
      return lerSegredo(escopo, OPCAO_DA_CHAVE_DE_ASSINATURA_DE_RECUPERACAO);
    },

    gravarChaveDeAssinatura(escopo, segredo) {
      return opcoesDeRede.gravar(
        escopo,
        OPCAO_DA_CHAVE_DE_ASSINATURA_DE_RECUPERACAO,
        texto(segredo),
      );
    },

    lerSalDeAssinatura(escopo) {
      return lerSegredo(escopo, OPCAO_DO_SAL_DE_ASSINATURA_DE_RECUPERACAO);
    },

    gravarSalDeAssinatura(escopo, segredo) {
      return opcoesDeRede.gravar(
        escopo,
        OPCAO_DO_SAL_DE_ASSINATURA_DE_RECUPERACAO,
        texto(segredo),
      );
    },

    lerExtensoesPausadas(sessaoId) {
      const leitura = opcoesDoSite.ler(
        nomeDaOpcaoDeExtensoesPausadas(sessaoId),
      );
      if (!leitura.existe || leitura.valor.tipo !== 'arranjo') {
        return SEM_EXTENSAO_PAUSADA;
      }
      const bruto = leitura.valor;
      return {
        plugins: extensoesDoTipo(bruto, TIPO_DE_EXTENSAO_PLUGIN),
        temas: extensoesDoTipo(bruto, TIPO_DE_EXTENSAO_TEMA),
        bruto,
      };
    },

    gravarExtensoesPausadas(sessaoId, registro) {
      return opcoesDoSite.gravar(
        nomeDaOpcaoDeExtensoesPausadas(sessaoId),
        registro,
        false,
      );
    },

    apagarExtensoesPausadas(sessaoId) {
      return opcoesDoSite.apagar(nomeDaOpcaoDeExtensoesPausadas(sessaoId));
    },
  };
}

/** Uma entrada de `recovery_keys`, ou `null` quando ela nao tem as duas chaves. */
function chaveGravada(
  entrada: EntradaDeArranjo,
): ChaveDeRecuperacaoGravada | null {
  if (entrada.valor.tipo !== 'arranjo') {
    return null;
  }
  let resumo: string | null = null;
  let criadaEm: number | null = null;
  for (const campo of entrada.valor.entradas) {
    const nome = nomeDaChave(campo.chave);
    if (nome === 'hashed_key') {
      resumo = cadeiaDoValor(campo.valor);
    } else if (nome === 'created_at') {
      criadaEm = numeroDoValor(campo.valor);
    }
  }
  if (resumo === null || criadaEm === null) {
    return null;
  }
  return { token: nomeDaChave(entrada.chave), resumo, criadaEm };
}

function extensoesDoTipo(
  bruto: ValorPhp,
  tipo: string,
): readonly ExtensaoPausada[] {
  if (bruto.tipo !== 'arranjo') {
    return [];
  }
  const doTipo = bruto.entradas.find(
    (entrada) => nomeDaChave(entrada.chave) === tipo,
  );
  if (doTipo === undefined || doTipo.valor.tipo !== 'arranjo') {
    return [];
  }
  return doTipo.valor.entradas.map((entrada) => ({
    slug: nomeDaChave(entrada.chave),
    erro: entrada.valor,
  }));
}

/** O `(string)` do PHP para o valor lido. */
function cadeiaDoValor(valor: ValorPhp): string {
  switch (valor.tipo) {
    case 'nulo':
      return '';
    case 'booleano':
      return valor.valor ? '1' : '';
    case 'inteiro':
    case 'decimal':
      return String(valor.valor);
    case 'texto':
      return typeof valor.valor === 'string'
        ? valor.valor
        : new TextDecoder().decode(valor.valor);
    case 'arranjo':
      return 'Array';
  }
}

/** O `(int)` do PHP, que e o que o marcador e `created_at` carregam. */
function numeroDoValor(valor: ValorPhp): number {
  switch (valor.tipo) {
    case 'inteiro':
    case 'decimal':
      return Math.trunc(valor.valor);
    case 'booleano':
      return valor.valor ? 1 : 0;
    case 'texto': {
      const numero = Number.parseInt(cadeiaDoValor(valor), 10);
      return Number.isNaN(numero) ? 0 : numero;
    }
    case 'nulo':
    case 'arranjo':
      return 0;
  }
}
