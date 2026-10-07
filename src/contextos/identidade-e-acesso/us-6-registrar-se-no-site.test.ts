/**
 * Os testes de **US-6** — a entrega de **T014**.
 *
 * > *8 testes automatizados, um por caso registrado em `../../../backlog/tests.md`
 * > (UT-009-1 … UT-009-8), com o mesmo dado de entrada, ação e resultado
 * > esperado. Os 2 testes de regra de negócio (UT-009-7, UT-009-8) entram na
 * > mesma suíte.*
 * > — `.specify/specs/001-identidade-e-acesso/tasks.md`, T014
 *
 * São **exatamente 8** `test`, um por identificador, e o nome de cada um carrega
 * o identificador para que a conferência contra o catálogo seja de olho.
 *
 * ---
 *
 * # 🔴 Por que esta suíte foi reescrita, e contra o quê ela corre agora
 *
 * A primeira entrega de T014 foi escrita **em paralelo com T013**, antes de o
 * comportamento de US-6 existir na árvore, e resolvia a operação por `import`
 * dinâmico contra um contrato **declarado dentro do próprio arquivo**: um
 * `ContextoDeRegistro` com `armazenamento`, `urlDoSite` e `cadastroAberto`
 * opcional. T013 entregou outra forma — `ContextoDeCadastro`, com `contas`,
 * `papeis`, `opcoes`, `rede`, `destinos` e mais sete colaboradores —, e os oito
 * casos passaram a estourar em `Cannot read properties of undefined (reading
 * 'ativa')`: a primeira linha de `cadastrar` é a guarda de rede, e `rede` não
 * existia no objeto que a suíte montava.
 *
 * `tasks.md` reabriu a tarefa com a instrução: *"A operação de T013 chama-se
 * `cadastrar`. Escreva contra o contrato real."* É o que esta versão faz —
 * `import` estático de `./cadastro/`, nenhuma forma inventada, nenhuma resolução
 * em execução. O que a suíte protege continua sendo o comportamento de UC-21, não
 * o identificador; o que mudou é que o contrato agora é **lido**, não suposto.
 *
 * ## `backlog/tests.md` não existe nesta árvore
 *
 * O catálogo de testes é entrada declarada desta tarefa e **não veio no pacote**:
 * `tasks.md` o endereça em `../../../backlog/tests.md`, que resolve para a raiz do
 * repositório, e ali não há pasta `backlog/`. A única menção aos identificadores
 * `UT-009-*` em toda a árvore é a própria linha de T014, e `.specify/README.md` só
 * os conta. Logo o *"mesmo dado de entrada, ação e resultado esperado"* que T014
 * cobra **não pôde ser copiado**, e os oito casos abaixo foram **reconstruídos**.
 * É a mesma situação que T004, T006 e T008 registraram nas suítes delas, e a
 * reconstrução segue o mesmo método.
 *
 * **A aritmética de T014 não fecha, e a correspondência adotada declara onde ela
 * não fecha.** US-6 tem **6** critérios de aceite (CA-6.1 a CA-6.6) e **3** regras
 * de negócio (`U1`, `U2`, `U3`), o que daria 9 casos; `tasks.md` pede **8**, dos
 * quais **2** são *"de regra de negócio"*. Sobram 6 para os 6 critérios, na ordem,
 * e 2 para 3 regras. A regra que **não** ganhou caso próprio foi `U1`, e por um
 * motivo verificável: ela é a única das três cujas duas metades já são critério —
 * *"registro aberto é desligado por padrão"* é CA-6.1 e *"o papel de quem se
 * registra é o de menor poder"* é CA-6.4 —, enquanto `U2` e `U3` afirmam, cada
 * uma, algo que nenhum critério diz (ver a tabela).
 *
 * | caso | o que afirma | fonte da reconstrução |
 * |---|---|---|
 * | `UT-009-1` | CA-6.1 — o cadastro aberto nasce desligado, e desligado a ação é recusada | `spec.md`, US-6 |
 * | `UT-009-2` | CA-6.2 — login > 60 e apelido > 50 são erro, nunca truncamento | `spec.md`, US-6 |
 * | `UT-009-3` | CA-6.3 — login ou e-mail já em uso devolvem erro no formulário | `spec.md`, US-6 |
 * | `UT-009-4` | CA-6.4 — papel padrão de menor poder, e nenhuma senha definida pelo titular | `spec.md`, US-6 |
 * | `UT-009-5` | CA-6.5 — o titular recebe por e-mail um caminho para definir a senha | `spec.md`, US-6 |
 * | `UT-009-6` | CA-6.6 — login da lista de proibidos é recusado, e a lista nasce vazia | `spec.md`, US-6 |
 * | `UT-009-7` | `U2` / `BR-MIGRAR-022` — os dois números nas duas bordas **e** a unicidade cobrada em código, com o banco aceitando duplicata | `target_business_rules.md` |
 * | `UT-009-8` | `U3` / `BR-MIGRAR-023` — a lista existe **só como filtro**, sem interface, e o interceptador altera o resultado | `target_business_rules.md`, P2 |
 *
 * **O que isto deixa devendo, declarado para não ser descoberto depois:** se o
 * catálogo aparecer e um `UT-009-*` tiver dado de entrada diferente do que está
 * aqui, o caso de lá vale e este arquivo muda. Nenhuma assertiva desta suíte
 * inventa comportamento — cada uma sai de `spec.md`, de `target_business_rules.md`,
 * de `UC-21`, de `SCR-005` ou de `parity_tests/06-autenticacao-e-sessao.feature` —,
 * mas a reconstrução não prova que o enunciado é o mesmo. **Quem tiver o catálogo
 * refaz a correspondência aqui, não reescreve a suíte.**
 *
 * ---
 *
 * ## O que esta suíte afirma, e por onde
 *
 * O critério de paridade desta área é **efeito no banco** (`parity_specs.md`,
 * Decisão 2), e é por ali que cada caso é afirmado: qual comando sai, com quais
 * parâmetros e com quais bytes — **inclusive quando o legado não emite comando
 * nenhum**, que é o caso de todas as recusas. A montagem é a composição do
 * armazenamento de T002 sobre uma porta de dados de mentira, mais a porta de
 * e-mail e o relógio.
 *
 * **Por que não a `porta-falsa.ts` de T002 nesta suíte.** Aquela porta responde
 * leitura por **fila posicional**, e US-6 faz quatro consultas de unicidade — login
 * e e-mail no formulário, login e e-mail de novo na criação — cuja ordem relativa o
 * pacote não fixa. Uma fila posicional faria a suíte cobrar uma ordem que ninguém
 * decidiu. O banco de mentira deste arquivo responde **pela coluna do `WHERE`**, e
 * é indiferente à ordem. `textoDoParametro` continua vindo de lá.
 *
 * **O relógio e o sorteio são controlados em todos os casos**, como o P4 e o P6
 * cobram (*"teste por atestado que fixa prazo e força, com relógio controlado"*,
 * *"no último instante aceita, um instante depois recusa"*).
 *
 * ## Que a suíte não passa por acidente: 15 violações plantadas, 15 apanhadas
 *
 * Uma suíte verde contra uma implementação verde não prova nada sozinha. Esta foi
 * conferida contra 15 violações plantadas uma a uma em `cadastro/` e em
 * `armazenamento/`, com a árvore revertida depois de cada uma, e **cada violação
 * foi apanhada** pelos casos indicados:
 *
 * | violação plantada | apanhada por |
 * |---|---|
 * | `cadastroAberto` nasce ligado | `UT-009-1` |
 * | `papelPadrao` nasce em `editor` | `UT-009-1`, `UT-009-4` |
 * | a guarda de cadastro desligado consulta o banco antes de recusar | `UT-009-1` |
 * | o login acima do limite é truncado em vez de recusado | `UT-009-2`, `UT-009-7` |
 * | o apelido acima do limite é truncado em vez de recusado | `UT-009-2`, `UT-009-7` |
 * | a unicidade do login não é conferida | `UT-009-3` |
 * | a unicidade do e-mail não é conferida | `UT-009-3` |
 * | `user_status` volta à lista de colunas da inserção | `UT-009-4` |
 * | `user_level` é gravado **antes** de `capabilities` | `UT-009-4` |
 * | o que o visitante informou é gravado como senha | `UT-009-4` |
 * | a notificação monta a mensagem e não a envia | `UT-009-5` |
 * | a chave é gravada sem o instante prefixado | `UT-009-5` |
 * | a chave em claro é gravada na conta, em vez do resumo | `UT-009-5` |
 * | a lista de logins proibidos é ignorada na comparação | `UT-009-6`, `UT-009-8` |
 * | o ponto de extensão dos logins proibidos não dispara | `UT-009-6`, `UT-009-8` |
 *
 * **O erro que o visitante vê não é o motivo real, e a suíte afirma os dois.** O
 * legado joga fora o erro da criação e põe `registerfail` no lugar; `cadastrar`
 * reproduz isso e guarda o motivo em `causa`, que o **P7** autoriza como
 * observabilidade *"desde que nenhuma decisão do sistema passe a depender dele"*.
 * Os casos de limite (`UT-009-2`, `UT-009-7`) afirmam `registerfail` no que é
 * visível **e** o código específico em `causa`: sem a segunda metade, truncar em
 * silêncio e recusar por outro motivo qualquer seriam indistinguíveis.
 *
 * ---
 *
 * ## O que esta suíte NÃO afirma, de propósito
 *
 * - **O formulário não ser oferecido** (a primeira metade de CA-6.1). `SCR-005`
 *   põe isso na tela: cadastro desligado redireciona para
 *   `wp-login.php?registration=disabled` (`wp-login.php:1109`), e em rede para
 *   `wp-signup.php` (`:1104`). Montar redirecionamento é da borda HTTP, não do
 *   domínio. O que esta suíte afirma é a outra metade — *"a ação é recusada"* —, e
 *   ela é afirmada no banco: **nenhum comando sai**. A pergunta que a borda faz
 *   antes de montar o formulário (`cadastroEstaAberto`) também é afirmada.
 * - **O caminho de rede.** O fluxo alternativo *"Instalação em rede"* de `UC-21`
 *   manda o registro percorrer `UC-21`→`UC-41`, que cria um cadastro **pendente**
 *   em tabela própria. `UC-41` não é US-6 e não é desta feature: `U7` a `U9` e
 *   `ESC-MULTISITE` são de `parity_tests/16-rede-multisite-e-cadastro.feature`.
 *   Cobrá-lo aqui inventaria escopo. Todos os casos correm com a rede inativa.
 * - **O segundo exato da borda de 24 horas.** CA-6.5 exige que o caminho de definir
 *   senha valha 24 horas, e `U4` / `BR-MIGRAR-024` é o prazo. `UT-009-5` afirma o
 *   que US-6 **produz** — a chave gravada com o instante do relógio prefixado, que
 *   é a origem de onde as 24 horas são aritmética — e as duas pontas em que as duas
 *   implementações de chave desta árvore concordam. **Elas discordam em um
 *   segundo** no vencimento exato: `cadastro/chave-de-redefinicao.ts` (T013) vence
 *   com `agora - instante > prazo`, logo `instante + prazo` ainda vale, e
 *   `redefinicao-de-senha/chave-de-redefinicao.ts` (T009) vale com
 *   `agora < instante + prazo`, logo `instante + prazo` já venceu. Escolher um
 *   lado aqui seria decidir no lugar de quem consome a chave, que é US-4 / T009,
 *   com os testes dela em T010. Esta suíte **registra a divergência e não a
 *   resolve**.
 * - **Os literais dos códigos de erro como contrato de tela.** O pacote não traz a
 *   tabela: a de `SCR-005` lista as 8 cadeias da tela e **nenhuma** é mensagem de
 *   erro de validação. Os literais afirmados aqui são os que T013 pôs em
 *   `erro-de-cadastro.ts`, e o que esta suíte prova é que a recusa **carrega** o
 *   código certo e a mensagem que aquele módulo declara; o texto fecha contra o
 *   oráculo (`ESC-ORACULO`, `BR-MIGRAR-116`), como `erro-de-autenticacao.ts` já
 *   registra para os textos da tela de entrada.
 * - **Limite de tentativa de cadastro.** Não existe no legado, e o P6 recusa número
 *   que o legado não tem.
 *
 * ---
 *
 * ## O conflito REQ-017 continua aberto, e esta suíte se recusa a escolher
 *
 * A matriz de fábrica de T002 exige, por argumento obrigatório sem valor padrão,
 * qual lado do conflito entre `REQ-017` e a resposta 5 está sendo construído — e a
 * tabela *Não negociável* da constituição põe essa escolha fora do alcance de quem
 * codifica. US-6 toca a matriz, porque o papel atribuído a quem se cadastra sai
 * dela. A saída desta suíte é rodar **cada caso nos dois lados** e afirmar o
 * **mesmo** resultado nos dois (ver {@link LADOS_DO_CONFLITO}): se US-6 passa a
 * depender do lado, esta suíte abre. Nenhum caso escolhe.
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
  serializar,
  serializarComoTexto,
} from '../../plataforma/serializacao/index.js';
import {
  chaveDeCapacidades,
  chaveDeNivel,
  concessoesParaValor,
  criarArmazenamento,
  definicaoParaValor,
  povoarPapeis,
  prefixosDe,
  type Armazenamento,
  type DefinicaoDePapeis,
  type LadoDoConflitoDeNivelNumerico,
} from './armazenamento/index.js';
// `porta-falsa.ts` não sai pelo barril do armazenamento, e o caminho direto é
// deliberado: T014 é `[P]` e não acrescenta reexportação a arquivo de outra
// tarefa.
import { textoDoParametro } from './armazenamento/porta-falsa.js';
import { REDE_INATIVA } from './autenticacao/contexto-de-autenticacao.js';
import {
  criarGeradorDeHashDeSenhaDoNucleo,
  type PrimitivaDeBcryptDeGeracao,
} from './autenticacao/geracao-de-hash-de-senha.js';
import { SEGUNDOS_POR_HORA } from './autenticacao/prazos-de-sessao.js';
import {
  criarVerificadorDeSenhaDoNucleo,
  type PrimitivaDeBcrypt,
} from './autenticacao/verificacao-de-senha.js';
import {
  cadastrar,
  cadastroEstaAberto,
  type ResultadoDoCadastro,
} from './cadastro/cadastrar.js';
import {
  caminhoDeDefinicaoDeSenha,
  chaveDeRedefinicaoVencida,
  instanteDaChaveGravada,
  type ResumoDaChaveDeRedefinicao,
} from './cadastro/chave-de-redefinicao.js';
import {
  LIMITES_DO_CADASTRO_DE_FABRICA,
  LOGINS_PROIBIDOS_DE_FABRICA,
  OPCOES_DO_CADASTRO_DE_FABRICA,
} from './cadastro/configuracao-de-cadastro.js';
import type {
  ContextoDeCadastro,
  GanchosDoCadastro,
} from './cadastro/contexto-de-cadastro.js';
import {
  codigosDeErro,
  MENSAGENS_DE_ERRO_DE_CADASTRO,
  type CodigoDeErroDeCadastro,
} from './cadastro/erro-de-cadastro.js';
import { gerarSegredo } from './cadastro/geracao-de-segredo.js';
import { assuntoDaMensagemDoTitular } from './cadastro/notificacao-de-conta-nova.js';
import { contarCaracteres } from './cadastro/validacao-de-cadastro.js';
import type {
  Consulta,
  LinhaDeResultado,
  MensagemDeEmail,
  PortaDeDados,
  PortaDeEmail,
  PortaDeRelogio,
} from './portas/index.js';

/*
  ── O DADO DE ENTRADA DOS OITO CASOS ────────────────────────────────────────
*/

/** O instante do relógio controlado, como o P4 cobra para todo prazo. */
const AGORA = 1_700_000_000;

/** O visitante que se cadastra: os dois campos que `SCR-005` coleta. */
const LOGIN = 'visitante';
const EMAIL = 'visitante@example.com';

const URL_DO_SITE = 'https://exemplo.invalido';
const URL_DE_ENTRADA = `${URL_DO_SITE}/wp-login.php`;

const TITULO_DO_SITE = 'Sitio';
const EMAIL_DO_ADMINISTRADOR = 'admin@exemplo.invalido';

/**
 * Os três destinos de `SCR-005`, com os caminhos que `wp-login.php` usa. Eles não
 * são afirmados como contrato de tela — ver *"o que esta suíte NÃO afirma"* —, mas
 * entram no contexto porque `ContextoDeCadastro` os exige, e `UT-009-1` afirma que
 * a recusa devolve **o destino que o contexto declarou**, não um inventado.
 */
const DESTINOS = {
  cadastroEmRede: `${URL_DO_SITE}/wp-signup.php`,
  cadastroDesligado: `${URL_DO_SITE}/wp-login.php?registration=disabled`,
  avisoDeCadastro: 'wp-login.php?checkemail=registered',
} as const;

/** O papel de fábrica de quem se cadastra: `default_role` nasce em `subscriber`. */
const PAPEL_DE_FABRICA = 'subscriber';

/** Os limites de `U2` / `BR-MIGRAR-022`, com o valor de fábrica do legado. */
const LIMITE_DE_LOGIN = 60;
const LIMITE_DE_APELIDO = 50;

/** O id que a inserção devolve, para que `contaId` possa ser afirmado. */
const ID_GERADO = 7;

/**
 * Os dois lados do conflito `REQ-017`, e o motivo de os oito casos rodarem nos
 * dois: ver o último bloco do cabeçalho. A ordem é a de
 * `LadoDoConflitoDeNivelNumerico`.
 */
const LADOS_DO_CONFLITO: readonly LadoDoConflitoDeNivelNumerico[] = [
  'legado-integral',
  'req-017-sem-niveis',
];

/** Um texto de `tamanho` caracteres, para as bordas de `U2`. */
function textoDe(tamanho: number, caractere = 'a'): string {
  return caractere.repeat(tamanho);
}

/*
  ── A BORDA SIMULADA ────────────────────────────────────────────────────────

  Os quatro colaboradores que `ContextoDeCadastro` pede de fora e que, no produto,
  vêm de `plataforma/` ou de uma biblioteca nativa. Aqui ficam reduções suficientes
  para o que os oito casos exercitam, com a ressalva dita em cada um.
*/

/**
 * A remoção de acentos. No produto vem da tabela de equivalência de caractere de
 * `plataforma/`, que não existe nesta árvore e que AD-10 manda resolver no momento
 * da chamada.
 */
const REMOVER_ACENTOS = (texto: string): string =>
  texto.normalize('NFD').replace(/[̀-ͯ]/gu, '');

/** A conversão do login em identificador de URL. Mesma ressalva. */
const APELIDO_DE_TEXTO = (texto: string): string =>
  texto.toLowerCase().replace(/\s+/gu, '-');

/**
 * O resumo da chave. O algoritmo real é de T009; aqui um resumo **que não deixa a
 * chave em claro aparecer no valor gravado**, porque é exatamente isso que
 * `UT-009-5` tem de poder afirmar (CA-4.1).
 */
const RESUMO_DA_CHAVE: ResumoDaChaveDeRedefinicao = {
  resumir: (chave) => createHash('sha256').update(chave).digest('hex'),
  conferir: (chave, resumo) =>
    createHash('sha256').update(chave).digest('hex') === resumo,
};

/** Um bcrypt de teste, com as duas pontas pareadas. */
const BCRYPT_DE_GERACAO: PrimitivaDeBcryptDeGeracao = {
  gerar(senhaPreProcessada) {
    const marca = Buffer.from(senhaPreProcessada, 'utf8').toString('hex');
    return `$2y$10$${marca.slice(0, 53)}`;
  },
};

const BCRYPT_DE_VERIFICACAO: PrimitivaDeBcrypt = {
  verificar(senhaPreProcessada, hash) {
    return hash === BCRYPT_DE_GERACAO.gerar(senhaPreProcessada);
  },
};

/** O relógio controlado: um instante fixo, em segundos inteiros UTC. */
const RELOGIO: PortaDeRelogio = { agoraEmSegundos: () => AGORA };

/** Um sorteio determinista: percorre o alfabeto em ordem, e repete. */
function sorteioDeterminista(): (limite: number) => number {
  let passo = 0;
  return (limite) => {
    const valor = passo % limite;
    passo += 1;
    return valor;
  };
}

/**
 * O que o sorteio determinista produz, na ordem em que `cadastrar` o consome: a
 * senha inicial primeiro, a chave de redefinição depois.
 */
function segredosPrevistos(): { readonly senha: string; readonly chave: string } {
  const sorteio = sorteioDeterminista();
  return {
    senha: gerarSegredo(
      LIMITES_DO_CADASTRO_DE_FABRICA.comprimentoDaSenhaInicial,
      sorteio,
    ),
    chave: gerarSegredo(
      LIMITES_DO_CADASTRO_DE_FABRICA.comprimentoDaChaveDeRedefinicao,
      sorteio,
    ),
  };
}

/*
  ── O BANCO DE MENTIRA, QUE RESPONDE PELA COLUNA DO `WHERE` ─────────────────
*/

interface BancoDeMentira {
  readonly porta: PortaDeDados;
  /** Todo comando, na ordem. Lista vazia é afirmação, não ausência. */
  readonly consultas: readonly Consulta[];
  readonly leituras: readonly Consulta[];
  readonly escritas: readonly Consulta[];
}

/** Os valores que já pertencem a outra conta, por coluna. */
interface ContasEmUso {
  readonly logins?: readonly string[];
  readonly emails?: readonly string[];
}

/** A coluna do `WHERE` de uma consulta de uma coluna só. */
function colunaDoWhere(texto: string): string {
  return /WHERE\s+(\w+)\s*=/u.exec(texto)?.[1] ?? '';
}

/** A linha de `users` de uma conta que já existe — o que CA-6.3 precisa ver. */
function linhaDeContaExistente(coluna: string, valor: string): LinhaDeResultado {
  return {
    ID: 3,
    user_login: coluna === 'user_login' ? valor : 'ja-existe',
    user_pass: '$wp$2y$10$jaExiste',
    user_nicename: 'ja-existe',
    user_email: coluna === 'user_email' ? valor : 'ja-existe@example.com',
    user_url: '',
    user_registered: '2026-01-01 00:00:00',
    user_activation_key: '',
    user_status: 0,
    display_name: 'ja-existe',
  };
}

function bancoDeMentira(
  definicaoDePapeis: DefinicaoDePapeis,
  emUso: ContasEmUso = {},
): BancoDeMentira {
  const logins = new Set(emUso.logins ?? []);
  const emails = new Set(emUso.emails ?? []);
  // A definição dos papéis é dado **já gravado**, não semeado em execução:
  // povoar é operação de instalação (`PERM-13`, BR-MIGRAR-067), e assim nenhuma
  // escrita da semeadura entra na conta do que o cadastro fez.
  const definicaoGravada = serializar(definicaoParaValor(definicaoDePapeis));

  const consultas: Consulta[] = [];
  const leituras: Consulta[] = [];
  const escritas: Consulta[] = [];

  return {
    porta: {
      prefixoDeTabela: 'wp_',
      prefixoBaseDeTabela: 'wp_',
      selecionar(consulta) {
        consultas.push(consulta);
        leituras.push(consulta);

        // A opção que o ADR-0001 põe como dado gravado.
        if (/\bFROM wp_options\b/u.test(consulta.texto)) {
          return [{ option_value: definicaoGravada }];
        }

        // A conta: as unicidades que o legado cobra em código.
        if (/\bFROM wp_users\b/u.test(consulta.texto)) {
          const coluna = colunaDoWhere(consulta.texto);
          const valor = textoDoParametro(consulta.parametros[0]);
          const existe =
            (coluna === 'user_login' && logins.has(valor)) ||
            (coluna === 'user_email' && emails.has(valor));
          return existe ? [linhaDeContaExistente(coluna, valor)] : [];
        }

        // Conta nova não tem metadado nenhum, e é por isso que a gravação de
        // capacidade sai como INSERT (ver `armazenamento/perfil.ts`, `gravar`).
        return [];
      },
      escrever(consulta) {
        consultas.push(consulta);
        escritas.push(consulta);
        return { linhasAfetadas: 1, idGerado: ID_GERADO };
      },
    },
    consultas,
    leituras,
    escritas,
  };
}

/*
  ── A PORTA DE E-MAIL DE MENTIRA ────────────────────────────────────────────
*/

interface EmailDeMentira {
  readonly porta: PortaDeEmail;
  readonly enviadas: readonly MensagemDeEmail[];
}

function emailDeMentira(): EmailDeMentira {
  const enviadas: MensagemDeEmail[] = [];
  return {
    porta: {
      enviar(mensagem) {
        enviadas.push(mensagem);
        return { enviado: true };
      },
    },
    enviadas,
  };
}

/*
  ── A MONTAGEM DE UM CASO ───────────────────────────────────────────────────
*/

interface Cenario {
  readonly banco: BancoDeMentira;
  readonly armazenamento: Armazenamento;
  readonly definicao: DefinicaoDePapeis;
  readonly enviadas: readonly MensagemDeEmail[];
  readonly contexto: ContextoDeCadastro;
}

interface OpcoesDoCenario {
  /** `users_can_register`. Omitido, vale o de fábrica: **desligado** (`U1`). */
  readonly cadastroAberto?: boolean;
  readonly emUso?: ContasEmUso;
  readonly ganchos?: GanchosDoCadastro;
  /**
   * A conversão do login em apelido, para que o limite do **login** possa ser
   * exercitado sem que o do apelido recuse antes: com o apelido derivado do
   * próprio login, 50 vence 60 e o caso de 60 nunca chegaria a ser testado.
   */
  readonly apelidoDeTexto?: (texto: string) => string;
  /**
   * Usa `OPCOES_DO_CADASTRO_DE_FABRICA` **sem tocar em nada** — nem no título, nem
   * no e-mail do administrador. É como `UT-009-1` cobra o valor de fábrica de
   * `users_can_register`: a constante inteira, do jeito que T013 a declarou.
   */
  readonly opcoesDeFabricaCruas?: boolean;
}

function cenario(
  lado: LadoDoConflitoDeNivelNumerico,
  opcoes: OpcoesDoCenario = {},
): Cenario {
  const definicao = povoarPapeis(lado);
  const banco = bancoDeMentira(definicao, opcoes.emUso ?? {});
  const email = emailDeMentira();
  const armazenamento = criarArmazenamento(banco.porta);

  const contexto: ContextoDeCadastro = {
    relogio: RELOGIO,
    email: email.porta,
    contas: armazenamento.contas,
    papeis: armazenamento.papeis,
    opcoes:
      opcoes.opcoesDeFabricaCruas === true
        ? OPCOES_DO_CADASTRO_DE_FABRICA
        : {
            ...OPCOES_DO_CADASTRO_DE_FABRICA,
            cadastroAberto: opcoes.cadastroAberto ?? false,
            tituloDoSite: TITULO_DO_SITE,
            emailDoAdministrador: EMAIL_DO_ADMINISTRADOR,
          },
    // Rede inativa em todos os casos: o desvio para UC-41 está fora de US-6.
    rede: REDE_INATIVA,
    destinos: { ...DESTINOS },
    urlDeEntrada: URL_DE_ENTRADA,
    montarUrlDaRede: (caminho) => `${URL_DO_SITE}/${caminho}`,
    removerAcentos: REMOVER_ACENTOS,
    apelidoDeTexto: opcoes.apelidoDeTexto ?? APELIDO_DE_TEXTO,
    resumoDaChave: RESUMO_DA_CHAVE,
    geradorDeHashDeSenha: criarGeradorDeHashDeSenhaDoNucleo({
      bcrypt: BCRYPT_DE_GERACAO,
    }),
    aleatorio: sorteioDeterminista(),
    ...(opcoes.ganchos === undefined ? {} : { ganchos: opcoes.ganchos }),
  };

  return {
    banco,
    armazenamento,
    definicao,
    enviadas: email.enviadas,
    contexto,
  };
}

/** Um cenário com o cadastro ligado, que é a pré-condição de UC-21. */
function cenarioAberto(
  lado: LadoDoConflitoDeNivelNumerico,
  opcoes: Omit<OpcoesDoCenario, 'cadastroAberto'> = {},
): Cenario {
  return cenario(lado, { ...opcoes, cadastroAberto: true });
}

/** O pedido de cadastro: os dois campos que `SCR-005` coleta, e nada mais. */
function pedido(campos: { login?: string; email?: string } = {}) {
  return {
    login: campos.login ?? LOGIN,
    email: campos.email ?? EMAIL,
  };
}

/*
  ── LEITURA DO RESULTADO ────────────────────────────────────────────────────
*/

type CadastroAceito = Extract<ResultadoDoCadastro, { cadastrado: true }>;
type DadosRecusados = Extract<
  ResultadoDoCadastro,
  { motivo: 'dados-recusados' }
>;

function aceite(resultado: ResultadoDoCadastro, oQue: string): CadastroAceito {
  if (resultado.cadastrado !== true) {
    assert.fail(
      `${oQue}: o cadastro tinha de ser aceito, e veio ${JSON.stringify(resultado)}`,
    );
  }
  return resultado;
}

/** A recusa que o formulário reexibe: a que carrega erro e valores. */
function recusaDeDados(
  resultado: ResultadoDoCadastro,
  oQue: string,
): DadosRecusados {
  if (resultado.cadastrado !== false || resultado.motivo !== 'dados-recusados') {
    assert.fail(
      `${oQue}: tinha de ser uma recusa de dados, e veio ${JSON.stringify(resultado)}`,
    );
  }
  return resultado;
}

/** A recusa anterior ao formulário: cadastro desligado, ou desvio de rede. */
function recusaAnteriorAoFormulario(
  resultado: ResultadoDoCadastro,
  oQue: string,
): Exclude<ResultadoDoCadastro, CadastroAceito | DadosRecusados> {
  if (resultado.cadastrado !== false || resultado.motivo === 'dados-recusados') {
    assert.fail(
      `${oQue}: tinha de ser recusa anterior ao formulário, e veio ${JSON.stringify(
        resultado,
      )}`,
    );
  }
  return resultado;
}

/**
 * O motivo real de uma recusa que o visitante vê como `registerfail`.
 *
 * ⚠️ Lê `causa`, que é **observabilidade e não fluxo** (P7): nenhuma ramificação de
 * `cadastro/` a consulta, e o que esta suíte faz com ela é afirmar que truncar em
 * silêncio e recusar pelo limite não são o mesmo resultado.
 */
function causaDaRecusa(
  recusado: DadosRecusados,
  oQue: string,
): readonly CodigoDeErroDeCadastro[] {
  const causa = recusado.causa;
  assert.ok(causa !== undefined, `${oQue}: a recusa tinha de registrar a causa`);
  return codigosDeErro(causa);
}

/*
  ── LEITURA DO EFEITO NO BANCO ──────────────────────────────────────────────

  As consultas que o armazenamento de T002 emite são parametrizadas, logo o valor
  de uma coluna não está no texto: está no parâmetro, na posição em que a coluna
  aparece. Estes ajudantes leem por **nome de coluna**, e não por posição fixa,
  para que a ordem das colunas de T013 não decida o resultado.
*/

/** As escritas que tocaram aquela tabela. */
function escritasEm(cen: Cenario, tabela: string): readonly Consulta[] {
  return cen.banco.escritas.filter((consulta) =>
    new RegExp(`\\b${tabela}\\b`, 'u').test(consulta.texto),
  );
}

/**
 * O valor que uma escrita dá àquela coluna, nas duas formas que o armazenamento
 * emite: `INSERT INTO t (a, b) VALUES (?, ?)` e `UPDATE t SET a = ?, b = ? WHERE …`.
 */
function valorEscritoEm(consulta: Consulta, coluna: string): string | null {
  const daInsercao = /\(([^)]*)\)\s*VALUES/iu.exec(consulta.texto);
  const colunas =
    daInsercao !== null
      ? (daInsercao[1] ?? '').split(',').map((nome) => nome.trim())
      : (/\bSET\s+(.*?)\s+WHERE\b/iu.exec(consulta.texto)?.[1] ?? '')
          .split(',')
          .map((atribuicao) => atribuicao.replace(/\s*=\s*\?$/u, '').trim());

  const indice = colunas.indexOf(coluna);
  if (indice < 0 || indice >= consulta.parametros.length) {
    return null;
  }
  return textoDoParametro(consulta.parametros[indice]);
}

/** As chaves de `usermeta` gravadas, na ordem em que foram gravadas. */
function chavesDeMetadadoGravadas(cen: Cenario): readonly string[] {
  return escritasEm(cen, 'wp_usermeta').map((consulta) =>
    textoDoParametro(consulta.parametros[1]),
  );
}

/** O valor gravado naquela chave de `usermeta`. */
function metadadoGravado(cen: Cenario, chave: string): string | null {
  for (const consulta of escritasEm(cen, 'wp_usermeta')) {
    if (valorEscritoEm(consulta, 'meta_key') === chave) {
      return valorEscritoEm(consulta, 'meta_value');
    }
  }
  return null;
}

/** O que o cadastro gravou em `user_activation_key`, ou `null` se nada gravou. */
function chaveDeAtivacaoGravada(cen: Cenario): string | null {
  for (const consulta of escritasEm(cen, 'wp_users')) {
    const valor = valorEscritoEm(consulta, 'user_activation_key');
    if (valor !== null && valor !== '') {
      return valor;
    }
  }
  return null;
}

/** Todo valor que passou por alguma escrita, para as assertivas de ausência. */
function valoresEscritos(cen: Cenario): readonly string[] {
  return cen.banco.escritas.flatMap((consulta) =>
    consulta.parametros.map(textoDoParametro),
  );
}

/** Nada foi gravado e nada foi enviado: a forma de afirmar uma recusa. */
function nadaFoiGravado(cen: Cenario, oQue: string): void {
  assert.deepEqual(
    cen.banco.escritas.map((consulta) => consulta.texto),
    [],
    `${oQue}: nenhum comando de escrita pode sair do banco`,
  );
  assert.equal(cen.enviadas.length, 0, `${oQue}: nenhum e-mail pode ser enviado`);
}

/** Nem leitura saiu: é o que CA-6.1 quer dizer com a ação ser recusada antes. */
function nadaFoiConsultado(cen: Cenario, oQue: string): void {
  assert.deepEqual(
    cen.banco.consultas.map((consulta) => consulta.texto),
    [],
    `${oQue}: nenhum comando pode sair do banco, nem leitura`,
  );
  assert.equal(cen.enviadas.length, 0, `${oQue}: nenhum e-mail pode ser enviado`);
}

/*
  ── UT-009-1 ───────────────────────────────────────────────────────────────

  CA-6.1 — *"O cadastro aberto nasce desligado; desligado, o formulário não é
  oferecido e a ação é recusada"*.

  Entrada: um pedido válido, e o contexto com `OPCOES_DO_CADASTRO_DE_FABRICA`
  **inteira e intocada** — que é como esta suíte cobra o valor de fábrica de
  `users_can_register`, que `UC-21` anota como *"nasce em 0"*. O mesmo pedido é
  repetido com a opção explicitamente desligada, porque o valor de fábrica e o
  valor explícito têm de produzir o mesmo resultado.
  Ação: cadastrar-se.
  Esperado: `cadastroEstaAberto` responde `false` antes de haver envio nenhum;
  `cadastrar` recusa com `cadastro-desligado`, devolvendo o destino declarado; e
  **nenhum comando sai do banco, nem leitura, e nenhum e-mail sai** — que é a forma
  observável de *"a ação é recusada"*. A outra metade do critério, o formulário não
  ser oferecido, é de `SCR-005` e está declarada no cabeçalho.
*/
test('UT-009-1 · CA-6.1 · o cadastro aberto nasce desligado, e desligado a acao e recusada', () => {
  // `U1` / BR-MIGRAR-021 no ponto de configuração nomeado que o P6 exige.
  assert.equal(
    OPCOES_DO_CADASTRO_DE_FABRICA.cadastroAberto,
    false,
    'users_can_register nasce desligada',
  );
  assert.equal(
    OPCOES_DO_CADASTRO_DE_FABRICA.papelPadrao,
    PAPEL_DE_FABRICA,
    'default_role nasce em subscriber',
  );

  for (const lado of LADOS_DO_CONFLITO) {
    // O valor de fábrica, cobrado pela constante inteira.
    const deFabrica = cenario(lado, { opcoesDeFabricaCruas: true });
    assert.equal(
      cadastroEstaAberto(deFabrica.contexto),
      false,
      `${lado}: a borda decide antes de montar o formulario, e no valor de fabrica a resposta e nao`,
    );
    const recusaDeFabrica = recusaAnteriorAoFormulario(
      cadastrar(pedido(), deFabrica.contexto),
      `${lado}: cadastro aberto no valor de fabrica`,
    );
    assert.equal(recusaDeFabrica.motivo, 'cadastro-desligado');
    assert.equal(recusaDeFabrica.destinoDeRetorno, DESTINOS.cadastroDesligado);
    nadaFoiConsultado(deFabrica, `${lado}: cadastro aberto no valor de fabrica`);

    // O mesmo, desligado explicitamente: tem de ser indistinguível.
    const desligado = cenario(lado, { cadastroAberto: false });
    const recusaExplicita = recusaAnteriorAoFormulario(
      cadastrar(pedido(), desligado.contexto),
      `${lado}: cadastro aberto desligado`,
    );
    assert.deepEqual(
      recusaExplicita,
      recusaDeFabrica,
      `${lado}: o valor de fabrica e o valor explicito produzem a mesma recusa`,
    );
    nadaFoiConsultado(desligado, `${lado}: cadastro aberto desligado`);

    // E ligado, a mesma pergunta responde sim: a recusa é da opção, não do fluxo.
    assert.equal(
      cadastroEstaAberto(cenarioAberto(lado).contexto),
      true,
      `${lado}: ligado, o formulario e oferecido`,
    );
  }
});

/*
  ── UT-009-2 ───────────────────────────────────────────────────────────────

  CA-6.2 — *"Login acima de 60 caracteres e apelido acima de 50 devolvem erro,
  nunca truncamento silencioso"*.

  Entrada: cadastro aberto ligado, e dois pedidos — um com login de 61 caracteres
  (com o apelido fixado curto, para que seja o limite do login a decidir) e outro
  com login de 51, cujo apelido derivado tem os mesmos 51. Os dois campos são
  exercitados **separadamente** porque `UC-21` os lista como duas condições na
  mesma linha de exceção, e cruzá-los esconderia qual dos dois recusou.
  Ação: cadastrar-se.
  Esperado: recusa nos dois, com `registerfail` no que o visitante vê e o código do
  limite em `causa`; nenhum comando de escrita; e — a parte que dá nome ao critério
  — **nenhuma escrita carrega o valor truncado no limite**, que é como um
  truncamento silencioso apareceria.
*/
test('UT-009-2 · CA-6.2 · login acima de 60 e apelido acima de 50 sao erro, nunca truncamento', () => {
  for (const lado of LADOS_DO_CONFLITO) {
    const loginLongo = textoDe(LIMITE_DE_LOGIN + 1);
    const comLoginLongo = cenarioAberto(lado, { apelidoDeTexto: () => 'curto' });
    const recusaDeLogin = recusaDeDados(
      cadastrar(pedido({ login: loginLongo }), comLoginLongo.contexto),
      `${lado}: login de ${LIMITE_DE_LOGIN + 1}`,
    );
    assert.deepEqual(
      codigosDeErro(recusaDeLogin.erro),
      ['registerfail'],
      `${lado}: o visitante ve registerfail, nao o codigo do limite`,
    );
    assert.deepEqual(
      causaDaRecusa(recusaDeLogin, `${lado}: login de ${LIMITE_DE_LOGIN + 1}`),
      ['user_login_too_long'],
      `${lado}: o motivo real e o limite do login`,
    );
    nadaFoiGravado(comLoginLongo, `${lado}: login de ${LIMITE_DE_LOGIN + 1}`);
    assert.ok(
      !valoresEscritos(comLoginLongo).includes(
        loginLongo.slice(0, LIMITE_DE_LOGIN),
      ),
      `${lado}: nenhuma escrita pode carregar o login truncado em ${LIMITE_DE_LOGIN}`,
    );

    const loginDeApelidoLongo = textoDe(LIMITE_DE_APELIDO + 1, 'b');
    const comApelidoLongo = cenarioAberto(lado);
    const recusaDeApelido = recusaDeDados(
      cadastrar(pedido({ login: loginDeApelidoLongo }), comApelidoLongo.contexto),
      `${lado}: apelido de ${LIMITE_DE_APELIDO + 1}`,
    );
    assert.deepEqual(
      codigosDeErro(recusaDeApelido.erro),
      ['registerfail'],
      `${lado}: o visitante ve registerfail, nao o codigo do limite`,
    );
    assert.deepEqual(
      causaDaRecusa(recusaDeApelido, `${lado}: apelido de ${LIMITE_DE_APELIDO + 1}`),
      ['user_nicename_too_long'],
      `${lado}: o motivo real e o limite do apelido`,
    );
    nadaFoiGravado(comApelidoLongo, `${lado}: apelido de ${LIMITE_DE_APELIDO + 1}`);
    assert.ok(
      !valoresEscritos(comApelidoLongo).includes(
        loginDeApelidoLongo.slice(0, LIMITE_DE_APELIDO),
      ),
      `${lado}: nenhuma escrita pode carregar o apelido truncado em ${LIMITE_DE_APELIDO}`,
    );
  }
});

/*
  ── UT-009-3 ───────────────────────────────────────────────────────────────

  CA-6.3 — *"Login ou e-mail já em uso devolvem erro no formulário"*.

  Entrada: cadastro aberto ligado, e dois bancos — um em que o login pedido já
  existe, outro em que o e-mail pedido já existe.
  Ação: cadastrar-se.
  Esperado: recusa nos dois, com o código e a mensagem que o formulário reexibe —
  e, ao contrário de `UT-009-2`, o visitante vê o motivo real, porque estas duas
  conferências são do fluxo de registro e não da criação; o valor volta para o
  formulário, porque este caso **não** o apaga; nenhum comando de escrita; e o
  banco **foi consultado** pela coluna em questão, porque é isso que `UC-21` quer
  dizer com *"a verificação é feita em código: o banco permite duplicata"* — sem a
  consulta não há regra, há restrição de esquema, que este produto não tem.
*/
test('UT-009-3 · CA-6.3 · login ou e-mail ja em uso devolvem erro no formulario', () => {
  for (const lado of LADOS_DO_CONFLITO) {
    const loginEmUso = cenarioAberto(lado, { emUso: { logins: [LOGIN] } });
    const recusaDeLogin = recusaDeDados(
      cadastrar(pedido(), loginEmUso.contexto),
      `${lado}: login ja em uso`,
    );
    assert.deepEqual(codigosDeErro(recusaDeLogin.erro), ['username_exists']);
    assert.equal(
      recusaDeLogin.erro.itens[0]?.mensagem,
      MENSAGENS_DE_ERRO_DE_CADASTRO.username_exists,
    );
    assert.equal(
      recusaDeLogin.valoresParaOFormulario.login,
      LOGIN,
      `${lado}: o login volta para o formulario — este caso nao o apaga`,
    );
    nadaFoiGravado(loginEmUso, `${lado}: login ja em uso`);
    assert.ok(
      loginEmUso.banco.leituras.some(
        (consulta) =>
          /\bFROM wp_users\b/u.test(consulta.texto) &&
          colunaDoWhere(consulta.texto) === 'user_login',
      ),
      `${lado}: a unicidade do login e cobrada por consulta, nao por restricao`,
    );

    const emailEmUso = cenarioAberto(lado, { emUso: { emails: [EMAIL] } });
    const recusaDeEmail = recusaDeDados(
      cadastrar(pedido(), emailEmUso.contexto),
      `${lado}: e-mail ja em uso`,
    );
    assert.deepEqual(codigosDeErro(recusaDeEmail.erro), ['email_exists']);
    assert.equal(
      recusaDeEmail.erro.itens[0]?.mensagem,
      MENSAGENS_DE_ERRO_DE_CADASTRO.email_exists.replace('%s', URL_DE_ENTRADA),
      `${lado}: a mensagem do e-mail em uso leva a URL de entrada interpolada`,
    );
    assert.equal(recusaDeEmail.valoresParaOFormulario.email, EMAIL);
    nadaFoiGravado(emailEmUso, `${lado}: e-mail ja em uso`);
    assert.ok(
      emailEmUso.banco.leituras.some(
        (consulta) =>
          /\bFROM wp_users\b/u.test(consulta.texto) &&
          colunaDoWhere(consulta.texto) === 'user_email',
      ),
      `${lado}: a unicidade do e-mail e cobrada por consulta, nao por restricao`,
    );
  }
});

/*
  ── UT-009-4 ───────────────────────────────────────────────────────────────

  CA-6.4 — *"A conta criada recebe o papel padrão de menor poder e nenhuma senha
  definida pelo titular"*.

  Entrada: cadastro aberto ligado, e `papelPadrao` vindo de
  `OPCOES_DO_CADASTRO_DE_FABRICA` — porque é a constante de fábrica que cobra o
  valor de `default_role`, que `UC-21` anota como *"nasce em subscriber"*.
  Ação: cadastrar-se.
  Esperado: a conta é criada com o id que o banco gerou; **uma** inserção em
  `users`, com o login e o e-mail informados; o metadado `{site}capabilities`
  gravado com os bytes exatos da concessão de `subscriber`, e `{site}user_level`
  **depois** dele; `subscriber` é o papel de **menor poder** da matriz de fábrica,
  nos dois lados do conflito; e nada do que o visitante informou foi gravado como
  senha — o formulário não tem campo de senha, e o que entra em `user_pass` é o
  hash de um segredo sorteado, cujo valor em claro não aparece em escrita nenhuma
  nem no resultado.
*/
test('UT-009-4 · CA-6.4 · a conta criada recebe o papel padrao de menor poder e nenhuma senha do titular', () => {
  // Os bytes esperados, montados pelo codec da árvore e confrontados com o
  // literal que o legado grava: duas âncoras para o mesmo valor.
  const concessaoEsperada = serializarComoTexto(
    concessoesParaValor([{ capacidade: PAPEL_DE_FABRICA, concedida: true }]),
  );
  assert.equal(
    concessaoEsperada,
    'a:1:{s:10:"subscriber";b:1;}',
    'a concessao de subscriber e o arranjo de um item que o legado grava',
  );

  const previstos = segredosPrevistos();
  const verificador = criarVerificadorDeSenhaDoNucleo({
    bcrypt: BCRYPT_DE_VERIFICACAO,
  });

  for (const lado of LADOS_DO_CONFLITO) {
    const cen = cenarioAberto(lado);
    const prefixos = prefixosDe(cen.banco.porta);

    // `subscriber` é o de menor poder da matriz de fábrica — e é nos dois lados
    // do conflito, porque nível numérico entra em todos os cinco papéis.
    const menor = cen.definicao
      .map((entrada) => ({
        identificador: entrada.identificador,
        quantas: entrada.papel.capacidades.filter(
          (concessao) => concessao.concedida,
        ).length,
      }))
      .reduce((atual, candidato) =>
        candidato.quantas < atual.quantas ? candidato : atual,
      );
    assert.equal(
      menor.identificador,
      PAPEL_DE_FABRICA,
      `${lado}: o papel de menor poder da matriz de fabrica e ${PAPEL_DE_FABRICA}`,
    );

    const resultado = aceite(
      cadastrar(pedido(), cen.contexto),
      `${lado}: cadastro valido`,
    );
    assert.equal(resultado.contaId, ID_GERADO, `${lado}: o id gerado e devolvido`);
    assert.equal(resultado.login, LOGIN, `${lado}: o login gravado e devolvido`);
    assert.equal(
      resultado.papel.papel,
      PAPEL_DE_FABRICA,
      `${lado}: o papel atribuido e o de fabrica`,
    );

    const insercoes = escritasEm(cen, 'wp_users').filter((consulta) =>
      /^INSERT/iu.test(consulta.texto),
    );
    assert.equal(insercoes.length, 1, `${lado}: uma unica insercao em users`);
    const insercao = insercoes[0] as Consulta;
    assert.equal(valorEscritoEm(insercao, 'user_login'), LOGIN);
    assert.equal(valorEscritoEm(insercao, 'user_email'), EMAIL);

    // A coluna morta continua morta: `DB-DEAD` / BR-MIGRAR-086 e o cenário de
    // paridade cobram que nenhuma das duas metades escreva nela.
    assert.ok(
      !/user_status/u.test(insercao.texto),
      `${lado}: user_status e coluna morta e nenhuma escrita a menciona`,
    );

    // As duas chaves, na ordem do legado: o nível é derivado do que a conta
    // passou a ter, logo vem depois.
    assert.deepEqual(
      chavesDeMetadadoGravadas(cen),
      [chaveDeCapacidades(prefixos), chaveDeNivel(prefixos)],
      `${lado}: capabilities primeiro, user_level depois`,
    );
    assert.equal(
      metadadoGravado(cen, chaveDeCapacidades(prefixos)),
      concessaoEsperada,
      `${lado}: o papel atribuido e gravado como a concessao de ${PAPEL_DE_FABRICA}`,
    );
    assert.equal(
      metadadoGravado(cen, chaveDeNivel(prefixos)),
      '0',
      `${lado}: o nivel derivado de subscriber e 0 nos dois lados do conflito`,
    );

    // Nenhuma senha definida pelo titular: o que entra em `user_pass` é o hash
    // de um segredo sorteado, e nada do que o visitante informou.
    const senhaGravada = valorEscritoEm(insercao, 'user_pass') ?? '';
    assert.ok(
      senhaGravada.startsWith('$wp'),
      `${lado}: o hash gravado e o do formato corrente`,
    );
    assert.ok(
      senhaGravada !== LOGIN && senhaGravada !== EMAIL,
      `${lado}: nada que o visitante informou pode ser gravado como senha`,
    );
    assert.equal(
      verificador.verificar(previstos.senha, senhaGravada),
      true,
      `${lado}: o hash e o do segredo sorteado, nao de um valor do formulario`,
    );
    // E a senha em claro não é gravada nem devolvida (CA-1.3 valendo na criação).
    assert.ok(
      !valoresEscritos(cen).includes(previstos.senha),
      `${lado}: a senha em claro nao chega ao banco`,
    );
    assert.ok(
      !JSON.stringify(resultado).includes(previstos.senha),
      `${lado}: a senha em claro nao volta no resultado`,
    );
  }
});

/*
  ── UT-009-5 ───────────────────────────────────────────────────────────────

  CA-6.5 — *"O titular recebe por e-mail um caminho para definir a senha, válido
  por 24 horas"*.

  Entrada: cadastro aberto ligado, relógio parado em `AGORA`, sorteio determinista.
  Ação: cadastrar-se.
  Esperado: **um** e-mail, para o endereço informado, com o assunto do legado e com
  o caminho de definição de senha montado sobre a URL do site; a chave gravada na
  conta com o **instante do relógio prefixado** nela, que é a origem de onde as 24
  horas de `U4` são aritmética; e a chave em claro **só** no e-mail — o que a conta
  guarda é o resumo (CA-4.1). O prazo de 24 horas é afirmado no ponto de
  configuração nomeado e nas duas pontas em que as implementações desta árvore
  concordam; o segundo exato do vencimento é de US-4 / T010, pelo motivo declarado
  no cabeçalho.
*/
test('UT-009-5 · CA-6.5 · o titular recebe por e-mail um caminho para definir a senha', () => {
  // `U4` / BR-MIGRAR-024 no ponto de configuração nomeado que o P6 exige.
  const prazo = LIMITES_DO_CADASTRO_DE_FABRICA.prazoDaChaveDeRedefinicaoEmSegundos;
  assert.equal(prazo, 24 * SEGUNDOS_POR_HORA, 'a chave vale 24 horas');

  const previstos = segredosPrevistos();

  for (const lado of LADOS_DO_CONFLITO) {
    const cen = cenarioAberto(lado);

    const resultado = aceite(
      cadastrar(pedido(), cen.contexto),
      `${lado}: cadastro valido`,
    );
    assert.equal(resultado.chaveEmitida, true, `${lado}: a chave foi emitida`);
    assert.deepEqual(
      resultado.envios,
      [{ enviado: true }],
      `${lado}: uma tentativa de envio, e o relato dela volta como valor`,
    );

    assert.equal(
      cen.enviadas.length,
      1,
      `${lado}: exatamente um e-mail sai do cadastro`,
    );
    const mensagem = cen.enviadas[0] as MensagemDeEmail;
    assert.deepEqual(
      mensagem.destinatarios,
      [EMAIL],
      `${lado}: o e-mail vai para o endereco informado no formulario`,
    );
    assert.equal(mensagem.assunto, assuntoDaMensagemDoTitular(TITULO_DO_SITE));

    const caminho = caminhoDeDefinicaoDeSenha(LOGIN, previstos.chave);
    assert.ok(
      mensagem.corpo.includes(`${URL_DO_SITE}/${caminho}`),
      `${lado}: o corpo carrega o caminho de definicao de senha com a chave em claro`,
    );
    assert.ok(
      mensagem.corpo.includes(`Username: ${LOGIN}`),
      `${lado}: o corpo carrega o login, como o legado monta`,
    );

    // A chave de ativação, onde o legado a guarda: na conta, com o instante
    // prefixado (`wp-includes/user.php:3204`).
    const gravada = chaveDeAtivacaoGravada(cen);
    assert.ok(
      gravada !== null,
      `${lado}: a chave de definicao de senha e gravada na conta`,
    );
    assert.equal(
      instanteDaChaveGravada(gravada),
      AGORA,
      `${lado}: a chave gravada leva o instante ${AGORA} prefixado, que e de onde as 24 horas contam`,
    );
    assert.ok(
      !gravada.includes(previstos.chave),
      `${lado}: o que a conta guarda e o resumo — a chave em claro so existe no e-mail (CA-4.1)`,
    );
    assert.ok(
      !mensagem.corpo.includes(gravada),
      `${lado}: o valor guardado na conta nao vai no e-mail (CA-4.1)`,
    );

    // As duas pontas em que as duas implementações de chave desta árvore
    // concordam. O segundo exato de `AGORA + prazo` é onde elas divergem, e
    // decidi-lo é de US-4 / T010 — ver o cabeçalho.
    assert.equal(
      chaveDeRedefinicaoVencida(gravada, AGORA, prazo),
      false,
      `${lado}: recem emitida, a chave vale`,
    );
    assert.equal(
      chaveDeRedefinicaoVencida(gravada, AGORA + prazo + 1, prazo),
      true,
      `${lado}: passado o prazo, a chave nao vale mais`,
    );
  }
});

/*
  ── UT-009-6 ───────────────────────────────────────────────────────────────

  CA-6.6 — *"Login constante da lista de proibidos é recusado, e a lista nasce
  vazia"*.

  Entrada: cadastro aberto ligado. Duas montagens: uma **sem** `ganchos`, que é
  como esta suíte cobra a lista de fábrica, e uma com um interceptador que põe o
  login pedido na lista — com a diferença de caixa, porque a comparação do legado
  é insensível a ela.
  Ação: cadastrar-se.
  Esperado: sem interceptador, `admin` é aceito — é isso que *"a lista nasce
  vazia"* significa de fora, e o legado não tem lista embutida nenhuma; com o login
  na lista, recusa com `invalid_username`, a mensagem de login não permitido, e
  nenhum comando de escrita.
*/
test('UT-009-6 · CA-6.6 · login da lista de proibidos e recusado, e a lista nasce vazia', () => {
  // `U3` / BR-MIGRAR-023 no ponto de configuração nomeado que o P6 exige.
  assert.deepEqual(
    LOGINS_PROIBIDOS_DE_FABRICA,
    [],
    'a lista de logins proibidos nasce vazia',
  );

  for (const lado of LADOS_DO_CONFLITO) {
    const semLista = cenarioAberto(lado);
    aceite(
      cadastrar(pedido({ login: 'admin' }), semLista.contexto),
      `${lado}: a lista nasce vazia, logo nem 'admin' e proibido`,
    );

    const comLista = cenarioAberto(lado, {
      ganchos: { filtrarLoginsProibidos: () => ['Admin'] },
    });
    const recusado = recusaDeDados(
      cadastrar(pedido({ login: 'admin' }), comLista.contexto),
      `${lado}: login na lista de proibidos`,
    );
    assert.deepEqual(codigosDeErro(recusado.erro), ['invalid_username']);
    assert.equal(
      recusado.erro.itens[0]?.mensagem,
      MENSAGENS_DE_ERRO_DE_CADASTRO.invalid_username_nao_permitido,
      `${lado}: a mensagem e a de login nao permitido, nao a de caractere ilegal`,
    );
    nadaFoiGravado(comLista, `${lado}: login na lista de proibidos`);
  }
});

/*
  ── UT-009-7 · TESTE DE REGRA DE NEGÓCIO ───────────────────────────────────

  `U2` / `BR-MIGRAR-022` — *"Login até 60 caracteres, apelido até 50 — e os dois
  são erro, não truncamento. A unicidade de login e e-mail é verificada **em
  código**: o índice `user_login_key` não é `UNIQUE` e o banco permite
  duplicata."*

  O que este caso afirma e CA-6.2 não afirma: **as bordas nos dois sentidos**, como
  o P6 exige (*"no último instante aceita, um instante depois recusa"*), e a segunda
  metade da regra — que a unicidade **não** é restrição de armazenamento.

  Entrada e ação: login de exatamente 60 (com o apelido fixado curto) e login de
  exatamente 50 (cujo apelido derivado tem os mesmos 50); depois 61 e 51. E, antes
  de tudo, duas inserções do **mesmo** login direto pelo armazenamento de T002.
  Esperado: 60 e 50 aceitos, e o valor gravado com o comprimento inteiro — nenhum
  truncamento onde passou; 61 e 51 recusados pelo código do limite; e as duas
  inserções iguais saem as duas, sem erro — a duplicata é aceita pelo banco, e é
  por isso que a regra tem de viver no cadastro.
*/
test('UT-009-7 · U2 · os limites de 60 e 50 nas duas bordas, e o banco aceitando duplicata', () => {
  // Os dois números no ponto de configuração nomeado que o P6 exige.
  assert.equal(
    LIMITES_DO_CADASTRO_DE_FABRICA.comprimentoMaximoDeLogin,
    LIMITE_DE_LOGIN,
  );
  assert.equal(
    LIMITES_DO_CADASTRO_DE_FABRICA.comprimentoMaximoDeApelido,
    LIMITE_DE_APELIDO,
  );

  for (const lado of LADOS_DO_CONFLITO) {
    // A segunda metade de BR-MIGRAR-022, afirmada no armazenamento de T002: o
    // banco aceita duas contas com o mesmo login, e nada reclama. É o motivo de
    // a regra ter de ser cobrada em código, no cadastro.
    const semRestricao = cenarioAberto(lado);
    const contaNova = {
      login: LOGIN,
      senhaHash: '$wp$2y$10$qualquer',
      apelido: LOGIN,
      email: EMAIL,
      url: '',
      registradoEm: '2026-01-01 00:00:00',
      chaveDeAtivacao: '',
      nomeExibido: LOGIN,
    };
    assert.equal(semRestricao.armazenamento.contas.inserir(contaNova), ID_GERADO);
    assert.equal(semRestricao.armazenamento.contas.inserir(contaNova), ID_GERADO);
    assert.equal(
      escritasEm(semRestricao, 'wp_users').length,
      2,
      `${lado}: as duas insercoes do mesmo login saem — o banco aceita duplicata`,
    );

    // A borda de baixo do login: exatamente no limite, aceita e sem truncar.
    const loginNoLimite = textoDe(LIMITE_DE_LOGIN);
    const noLimiteDoLogin = cenarioAberto(lado, {
      apelidoDeTexto: () => 'curto',
    });
    aceite(
      cadastrar(pedido({ login: loginNoLimite }), noLimiteDoLogin.contexto),
      `${lado}: login de ${LIMITE_DE_LOGIN}`,
    );
    const insercaoDoLogin = escritasEm(noLimiteDoLogin, 'wp_users').find(
      (consulta) => /^INSERT/iu.test(consulta.texto),
    ) as Consulta;
    assert.equal(
      contarCaracteres(valorEscritoEm(insercaoDoLogin, 'user_login') ?? ''),
      LIMITE_DE_LOGIN,
      `${lado}: o login de ${LIMITE_DE_LOGIN} e gravado inteiro`,
    );

    // A borda de cima do login: um caractere depois, recusa.
    const acimaDoLogin = cenarioAberto(lado, { apelidoDeTexto: () => 'curto' });
    assert.deepEqual(
      causaDaRecusa(
        recusaDeDados(
          cadastrar(
            pedido({ login: textoDe(LIMITE_DE_LOGIN + 1) }),
            acimaDoLogin.contexto,
          ),
          `${lado}: login de ${LIMITE_DE_LOGIN + 1}`,
        ),
        `${lado}: login de ${LIMITE_DE_LOGIN + 1}`,
      ),
      ['user_login_too_long'],
    );
    nadaFoiGravado(acimaDoLogin, `${lado}: login de ${LIMITE_DE_LOGIN + 1}`);

    // A borda de baixo do apelido: exatamente no limite, aceita e sem truncar.
    const noLimiteDoApelido = cenarioAberto(lado);
    const aceitoNoApelido = aceite(
      cadastrar(
        pedido({ login: textoDe(LIMITE_DE_APELIDO, 'b') }),
        noLimiteDoApelido.contexto,
      ),
      `${lado}: apelido de ${LIMITE_DE_APELIDO}`,
    );
    assert.equal(
      contarCaracteres(aceitoNoApelido.apelido),
      LIMITE_DE_APELIDO,
      `${lado}: o apelido de ${LIMITE_DE_APELIDO} e aceito inteiro`,
    );
    const insercaoDoApelido = escritasEm(noLimiteDoApelido, 'wp_users').find(
      (consulta) => /^INSERT/iu.test(consulta.texto),
    ) as Consulta;
    assert.equal(
      contarCaracteres(valorEscritoEm(insercaoDoApelido, 'user_nicename') ?? ''),
      LIMITE_DE_APELIDO,
      `${lado}: o apelido de ${LIMITE_DE_APELIDO} e gravado inteiro`,
    );

    // A borda de cima do apelido: um caractere depois, recusa.
    const acimaDoApelido = cenarioAberto(lado);
    assert.deepEqual(
      causaDaRecusa(
        recusaDeDados(
          cadastrar(
            pedido({ login: textoDe(LIMITE_DE_APELIDO + 1, 'b') }),
            acimaDoApelido.contexto,
          ),
          `${lado}: apelido de ${LIMITE_DE_APELIDO + 1}`,
        ),
        `${lado}: apelido de ${LIMITE_DE_APELIDO + 1}`,
      ),
      ['user_nicename_too_long'],
    );
    nadaFoiGravado(acimaDoApelido, `${lado}: apelido de ${LIMITE_DE_APELIDO + 1}`);
  }
});

/*
  ── UT-009-8 · TESTE DE REGRA DE NEGÓCIO ───────────────────────────────────

  `U3` / `BR-MIGRAR-023` — *"A lista de logins proibidos é vazia por padrão e
  existe só como filtro (`illegal_user_logins`), sem interface."*

  O que este caso afirma e CA-6.6 não afirma: que a lista é **ponto de extensão**, e
  o que o P2 cobra de todo ponto de extensão — *"que ele dispara, com os argumentos
  declarados, na posição declarada do fluxo, e que um interceptador consegue
  alterar o resultado onde o legado permite"*. É o cenário `@paridade @invariante`
  de `parity_tests/06-autenticacao-e-sessao.feature`: *"Dado nenhuma extensão
  registrada no ponto de logins proibidos … as duas metades aceitam. Quando uma
  extensão acrescenta um login à lista … as duas metades recusam esse login"*.

  Entrada e ação: cadastro aberto ligado, e um interceptador que **registra o que
  recebeu** e acrescenta um login à lista.
  Esperado: o interceptador é chamado e **todo** argumento que ele recebe é a lista
  vazia de fábrica; o login que ele acrescentou é recusado e nada é gravado; e um
  outro login continua aceito pelo mesmo interceptador — o que prova que a recusa
  veio da lista, e não do fato de haver interceptador. A **contagem** de disparos
  não é afirmada: o legado consulta o ponto em dois lugares, e fixar o número aqui
  cobraria da implementação uma decisão que o pacote não registra.
*/
test('UT-009-8 · U3 · a lista de logins proibidos e vazia por padrao e existe so como filtro', () => {
  for (const lado of LADOS_DO_CONFLITO) {
    const recebido: (readonly string[])[] = [];
    const interceptador = (lista: readonly string[]): readonly string[] => {
      recebido.push(lista);
      return [...lista, LOGIN];
    };

    // O login que o interceptador acrescentou: recusado.
    const proibido = cenarioAberto(lado, {
      ganchos: { filtrarLoginsProibidos: interceptador },
    });
    const recusado = recusaDeDados(
      cadastrar(pedido(), proibido.contexto),
      `${lado}: o interceptador altera o resultado`,
    );
    assert.deepEqual(codigosDeErro(recusado.erro), ['invalid_username']);
    nadaFoiGravado(proibido, `${lado}: login proibido por extensao`);

    assert.ok(
      recebido.length > 0,
      `${lado}: o ponto de extensao dos logins proibidos tem de disparar`,
    );
    for (const lista of recebido) {
      assert.deepEqual(
        [...lista],
        [],
        `${lado}: o argumento de fabrica do filtro e a lista vazia`,
      );
    }

    // Outro login, com o MESMO interceptador: aceito. A recusa é da lista.
    const outro = cenarioAberto(lado, {
      ganchos: { filtrarLoginsProibidos: interceptador },
    });
    aceite(
      cadastrar(pedido({ login: 'outro-visitante' }), outro.contexto),
      `${lado}: o que a lista nao proibe continua passando`,
    );
  }
});
