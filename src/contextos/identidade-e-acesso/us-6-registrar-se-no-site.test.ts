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
 * # 🔴 Duas coisas que esta suíte NÃO resolve, e que têm de ser lidas antes de confiar nela
 *
 * ## 1. `backlog/tests.md` não existe nesta árvore
 *
 * O catálogo de testes é entrada declarada desta tarefa e **não veio no pacote**:
 * `tasks.md` o endereça em `../../../backlog/tests.md`, que resolve para a raiz
 * do repositório, e ali não há pasta `backlog/`. A única menção aos
 * identificadores `UT-009-*` em toda a árvore é a própria linha de T014, e
 * `.specify/README.md` só os conta. Logo o *"mesmo dado de entrada, ação e
 * resultado esperado"* que T014 cobra **não pôde ser copiado**, e os oito casos
 * abaixo foram **reconstruídos**. É a mesma situação que T004, T006 e T008
 * registraram nas suítes delas, e a reconstrução segue o mesmo método.
 *
 * **A aritmética de T014 não fecha, e a correspondência adotada declara onde ela
 * não fecha.** US-6 tem **6** critérios de aceite (CA-6.1 a CA-6.6) e **3**
 * regras de negócio (`U1`, `U2`, `U3`), o que daria 9 casos; `tasks.md` pede
 * **8**, dos quais **2** são *"de regra de negócio"*. Sobram 6 para os 6
 * critérios, na ordem, e 2 para 3 regras. A regra que **não** ganhou caso próprio
 * foi `U1`, e por um motivo verificável: ela é a única das três cujas duas metades
 * já são critério — *"registro aberto é desligado por padrão"* é CA-6.1 e *"o
 * papel de quem se registra é o de menor poder"* é CA-6.4 —, enquanto `U2` e `U3`
 * afirmam, cada uma, algo que nenhum critério diz (ver a tabela).
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
 * inventa comportamento — cada uma sai de `spec.md`, de
 * `target_business_rules.md`, de `UC-21`, de `SCR-005` ou de
 * `parity_tests/06-autenticacao-e-sessao.feature` —, mas a reconstrução não prova
 * que o enunciado é o mesmo. **Quem tiver o catálogo refaz a correspondência
 * aqui, não reescreve a suíte.**
 *
 * ## 2. T013 não está nesta árvore, e `tasks.md` põe *"T014 depende de T013"*
 *
 * No commit em que esta tarefa começou, a linha de T013 seguia `[ ]` e **nenhum
 * arquivo de US-6 existia**: a onda corrente abriu T009 a T016 em paralelo, a
 * partir do mesmo commit, e o comportamento de US-6 é entrega de T013. Daí duas
 * consequências, e nenhuma delas é escolha desta tarefa:
 *
 * - **a superfície de US-6 é resolvida em execução** (ver
 *   {@link resolverSuperficieDeUS6}), com o contrato declarado aqui em vez de
 *   importado. É o que T006 fez quando esteve nesta mesma posição, e pelo mesmo
 *   motivo: com `import` estático a árvore inteira deixaria de compilar, levando
 *   embora as suítes de T002, T003, T005 e T007, que nada têm a ver com esta
 *   tarefa. É também o que faz esta suíte ser verificação **independente** — ela
 *   cobra de US-6 o contrato que `spec.md`, `plan.md` e `UC-21` descrevem, e
 *   falha **alto, nomeando o que falta**, em vez de adotar em silêncio qualquer
 *   forma que a implementação tiver;
 * - **até T013 entrar, os 8 casos falham**, com a mensagem de
 *   {@link us6}. Isso é a dependência declarada se manifestando, não defeito
 *   desta suíte. O que roda e passa desde já são as assertivas que não dependem
 *   de T013 e que cada caso faz **antes** de chamar a operação: os bytes
 *   esperados da concessão de papel, a matriz de fábrica de T002 e, em
 *   `UT-009-7`, a prova de que **o banco aceita duplicata**.
 *
 * **Os 8 casos foram conferidos como satisfazíveis, e a conferência foi
 * descartada.** Para que as 8 falhas de hoje fossem provadamente só a
 * dependência ausente — e não assertiva impossível —, esta suíte foi rodada uma
 * vez contra um rascunho de `registrar` que atende ao contrato declarado abaixo:
 * os 8 passaram. Em seguida o rascunho foi **apagado**, porque escrever o
 * comportamento de US-6 é T013 e T014 é *"só ela"*. A suíte também foi conferida
 * contra 7 violações plantadas nesse rascunho — cadastro aberto por padrão,
 * truncar o login em lugar de recusar, papel padrão errado, não enviar e-mail,
 * ignorar o filtro de logins proibidos, não conferir unicidade e gravar a chave
 * sem o instante prefixado —, e **cada uma foi apanhada** pelo caso que a cobre.
 *
 * ⚠️ **O pacote não nomeia nenhuma função de US-6.** `plan.md` nomeia a operação
 * em prosa (*"cadastrar-se"*) e `target_domain_model.md` nomeia o comando de
 * `AGG-Conta` (**`registrar`**); nome de arquivo, nome de campo e literal de
 * código de erro não estão em documento nenhum. Logo o nome e a forma cobrados
 * aqui são **reconstrução**, e {@link NOMES_ACEITOS_DE_REGISTRAR} aceita um
 * conjunto declarado em vez de um nome só. Na reconciliação, **o nome de T013
 * ganha**: o que esta suíte protege é o comportamento, não o identificador.
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
 * leitura por **fila posicional**, e US-6 faz duas consultas de unicidade — login
 * e e-mail — cuja **ordem o pacote não fixa**. Uma fila posicional faria a suíte
 * cobrar uma ordem que ninguém decidiu, e `UT-009-3` passaria ou falharia por
 * causa dela. O banco de mentira deste arquivo responde **pelo conteúdo da
 * consulta**, e é indiferente à ordem. `textoDoParametro` continua vindo de lá.
 *
 * **O relógio é controlado em todos os casos**, como o P4 da constituição cobra
 * (*"teste por atestado que fixa prazo e força, com relógio controlado"*).
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
 *   ela é afirmada no banco: **nenhum comando sai**.
 * - **O caminho de rede.** O fluxo alternativo *"Instalação em rede"* de `UC-21`
 *   manda o registro percorrer `UC-21`→`UC-41`, que cria um cadastro **pendente**
 *   em tabela própria. `UC-41` não é US-6 e não é desta feature: `U7` a `U9` e
 *   `ESC-MULTISITE` são de `parity_tests/16-rede-multisite-e-cadastro.feature`.
 *   Cobrá-lo aqui inventaria escopo.
 * - **A borda de 24 horas da chave.** CA-6.5 exige que o caminho de definir senha
 *   valha 24 horas, e `U4` / `BR-MIGRAR-024` é o prazo. Afirmar a borda exige a
 *   operação que **consome** a chave, que é US-4 / T009, com os testes dela em
 *   T010. Aqui o que se afirma é o que US-6 produz: a chave gravada na conta, com
 *   o instante do relógio controlado **prefixado** nela, que é a origem a partir
 *   da qual as 24 horas são aritmética (`wp-includes/user.php:3204`, e a nota de
 *   `armazenamento/conta.ts` sobre `user_activation_key`).
 * - **Os literais dos códigos e das mensagens de erro.** O pacote não os traz: a
 *   tabela de mensagens de `SCR-005` lista as 8 strings da tela e **nenhuma** é
 *   mensagem de erro de validação. Cobrar um literal aqui seria inventá-lo. Esta
 *   suíte cobra que a recusa **carrega** ao menos um código, e o literal fecha
 *   contra o oráculo (`ESC-ORACULO`, `BR-MIGRAR-116`), como `erro-de-autenticacao.ts`
 *   já registra para os textos da tela de entrada.
 * - **Limite de tentativa de cadastro.** Não existe no legado, e o P6 recusa
 *   número que o legado não tem.
 *
 * ---
 *
 * ## O conflito REQ-017 continua aberto, e esta suíte se recusa a escolher
 *
 * A matriz de fábrica de T002 exige, por argumento obrigatório sem valor padrão,
 * qual lado do conflito entre `REQ-017` e a resposta 5 está sendo construído — e
 * a tabela *Não negociável* da constituição põe essa escolha fora do alcance de
 * quem codifica. US-6 toca a matriz, porque o papel atribuído a quem se cadastra
 * sai dela. A saída desta suíte é rodar **cada caso nos dois lados** e afirmar o
 * **mesmo** resultado nos dois (ver {@link LADOS_DO_CONFLITO}): se US-6 passa a
 * depender do lado, esta suíte abre. Nenhum caso escolhe.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  serializar,
  serializarComoTexto,
} from '../../plataforma/serializacao/index.js';
import {
  chaveDeCapacidades,
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
import type {
  Consulta,
  LinhaDeResultado,
  PortaDeDados,
  PortaDeEmail,
  PortaDeRelogio,
  MensagemDeEmail,
} from './portas/index.js';

/*
  ── O CONTRATO DE US-6, COMO ESTA SUÍTE O COBRA ─────────────────────────────

  Declarado aqui, e não importado, pelo motivo do item 2 do cabeçalho. Cada campo
  abaixo vem de um documento do pacote, e a origem está dita no comentário: o que
  não tem origem declarada não é cobrado.
*/

/**
 * O que o formulário de cadastro envia.
 *
 * Os nomes de campo são contrato **externo** nesta tela: `SCR-005` está em modo
 * literal justamente por isso (*"C: campos user_login, user_email sao contrato de
 * formulario de registro"*), e lista os 4 campos com `arquivo:linha`. A
 * correspondência fica registrada para que quem montar a borda HTTP não a
 * invente:
 *
 * | campo do formulário | aqui | linha em `wp-login.php` |
 * |---|---|---|
 * | `user_login` | `login` | 1164 |
 * | `user_email` | `email` | 1168 |
 * | `redirect_to` | `destinoPedido` | 1183 |
 *
 * ⚠️ **Não há campo de senha, e isso é o que CA-6.4 chama de *"nenhuma senha
 * definida pelo titular"*.** `SCR-005` conta **4** campos e nenhum é senha. A
 * ausência deste campo no tipo é, portanto, parte da assertiva de `UT-009-4`.
 *
 * ⚠️ **`apelido` não tem campo no formulário, e de onde ele vem quando não é
 * informado NÃO ESTÁ EM DOCUMENTO NENHUM deste pacote.** CA-6.2 e a tabela de
 * exceções de `UC-21` cobram o limite de 50 do apelido num fluxo cujo formulário
 * não o coleta, logo em algum ponto ele é derivado — e a derivação não está
 * escrita. Esta suíte **informa o apelido explicitamente** nos casos que o
 * exercitam e **não afirma a derivação**, que é ponto a fechar contra o oráculo.
 */
interface PedidoDeRegistro {
  readonly login: string;
  readonly email: string;
  readonly apelido?: string;
  readonly destinoPedido?: string;
}

/**
 * Os pontos de extensão que o cadastro atravessa.
 *
 * Estão aqui **nomeados e opcionais** porque o P2 põe cada um no contrato público
 * — *"o nome, os argumentos, a ordem de disparo e a capacidade de alterar o
 * resultado"* — e porque o barramento que os dispara não existe nesta árvore. Um
 * ponto sem interceptador registrado é, no legado, um no-op: a ausência aqui
 * reproduz o legado em vez de enfraquecê-lo.
 */
interface GanchosDoRegistro {
  /**
   * `illegal_user_logins`: filtra a lista de logins proibidos.
   *
   * É **filtro, e só filtro**: `BR-MIGRAR-023` (`U3`) diz que a lista *"é vazia
   * por padrão e existe só como filtro, sem interface"*, e por isso ela não é
   * opção de instalação neste contrato — é o argumento que o interceptador
   * recebe e o valor que ele devolve. O argumento de fábrica é a **lista vazia**,
   * e `UT-009-8` afirma exatamente isso.
   */
  readonly loginsProibidos?: (lista: readonly string[]) => readonly string[];
}

/**
 * O contexto de uma tentativa de cadastro.
 *
 * **Por que contexto por argumento, e não estado de módulo:** AD-02 e
 * `BR-MIGRAR-105` (`EXT-CONTEXTO`) põem identidade, consulta e conexão no escopo
 * da REQUISIÇÃO. É a mesma forma de `ContextoDeAutenticacao`, de T003.
 *
 * Os três pontos de configuração são **opcionais de propósito**: omitir é o que
 * esta suíte usa para cobrar o valor de fábrica, que é o que o P6 exige —
 * *"cada número vive num ponto de configuração nomeado, com o valor de fábrica do
 * legado"*. Omitir `cadastroAberto` tem de recusar; omitir `papelPadrao` tem de
 * atribuir o papel de menor poder; omitir `ganchos` tem de aceitar qualquer
 * login válido.
 */
interface ContextoDeRegistro {
  readonly relogio: PortaDeRelogio;
  readonly email: PortaDeEmail;
  /** O armazenamento de T002: `contas`, `perfil`, `sessoes` e `papeis`. */
  readonly armazenamento: Armazenamento;
  /**
   * A URL do site, que o caminho de definir senha carrega (CA-6.5). Vem de fora
   * porque é da instalação, não do domínio — o mesmo motivo de `urlDoPainel` em
   * `ContextoDeAutenticacao`.
   */
  readonly urlDoSite: string;
  /** `users_can_register`. Omitido, vale o de fábrica: **desligado** (`U1`). */
  readonly cadastroAberto?: boolean;
  /** `default_role`. Omitido, vale o de fábrica: `subscriber` (`U1`). */
  readonly papelPadrao?: string;
  readonly ganchos?: GanchosDoRegistro;
}

/** Um item do erro: um código e a mensagem dele, na ordem em que foi somado. */
interface ItemDeErroDeRegistro {
  readonly codigo: string;
  readonly mensagem: string;
}

/**
 * O erro do cadastro, na forma de `WP_Error`: um ou mais códigos somados.
 *
 * É **valor devolvido, nunca exceção** — a mesma decisão que
 * `erro-de-autenticacao.ts` registra para a entrada, e o mesmo motivo (AD-03, e o
 * barramento do legado devolvendo valor). O acúmulo de itens também é regra: o
 * legado soma códigos no mesmo `WP_Error` e quem lê toma o primeiro.
 */
interface ErroDeRegistro {
  readonly itens: readonly ItemDeErroDeRegistro[];
}

/**
 * O relato do cadastro.
 *
 * Deliberadamente mínimo. Tudo que `spec.md` e `UC-21` põem como pós-condição é
 * **efeito**, não campo de retorno — a conta criada, o papel atribuído, a chave
 * de 24 horas e o e-mail enviado são afirmados no banco e na porta de e-mail, que
 * é onde a Decisão 2 de `parity_specs.md` manda afirmá-los. Campo de retorno que
 * o pacote não pede não entra, para que esta suíte não dite forma que ninguém
 * decidiu.
 */
type ResultadoDeRegistro =
  | { readonly registrado: true; readonly contaId: number }
  | { readonly registrado: false; readonly erro: ErroDeRegistro };

/** A operação de US-6 que os oito casos exercitam. */
interface SuperficieDeUS6 {
  registrar(
    pedido: PedidoDeRegistro,
    contexto: ContextoDeRegistro,
  ): ResultadoDeRegistro;
}

/**
 * Os nomes que esta suíte aceita para a operação de US-6.
 *
 * O primeiro é o do comando de `AGG-Conta` em `target_domain_model.md`
 * (*"Comandos aceitos: `registrar`, …"*), que é a única nomeação de código que o
 * pacote traz. Os outros são as variantes que a prosa de `plan.md`
 * (*"cadastrar-se"*) e o título de T013 admitem. Aceitar um conjunto, e não um
 * nome só, é o que impede esta suíte de reprovar T013 por sinônimo — e a lista é
 * impressa na falha, para que a reconciliação seja de olho.
 */
const NOMES_ACEITOS_DE_REGISTRAR: readonly string[] = [
  'registrar',
  'registrarNovaConta',
  'registrarVisitante',
  'cadastrarSe',
  'criarContaPorCadastroAberto',
];

/**
 * Onde a implementação de US-6 é procurada.
 *
 * O primeiro caminho é o **barril do módulo**, e é ele que faz esta resolução
 * funcionar sem adivinhar o nome de arquivo de T013: `index.ts` é a superfície
 * publicada do módulo (P8) e o próprio arquivo registra que *"cada história
 * acrescenta aqui a sua operação"*. Os demais são palpites de caminho direto, para
 * o caso de T013 não ter passado pelo barril.
 *
 * São **variáveis**, e não literais num `import`, exatamente para que a ausência
 * deles seja falha de teste com nome em lugar de falha de compilação da árvore
 * inteira.
 */
const MODULOS_DE_US6: readonly string[] = [
  './index.js',
  './cadastro/registro.js',
  './cadastro/index.js',
  './cadastro/cadastro-aberto.js',
  './registro/registro.js',
  './registro/index.js',
  './conta/registro.js',
  './conta/cadastro.js',
];

type Resolucao =
  | { readonly disponivel: true; readonly us6: SuperficieDeUS6 }
  | {
      readonly disponivel: false;
      /**
       * Quantos nomes a resolução viu, e quais deles **parecem** ser de cadastro.
       *
       * Só os parecidos entram na mensagem de falha: a superfície do módulo já
       * tem mais de oitenta nomes, e despejá-la em cada uma das oito falhas
       * esconderia a informação em lugar de dá-la. O que a mensagem precisa dizer
       * é se T013 entrou com outro nome — e para isso bastam os candidatos.
       */
      readonly nomesParecidos: readonly string[];
      readonly quantosNomes: number;
    };

/**
 * Resolve a superfície de US-6 e **confere a forma dela** antes de devolver.
 *
 * A conferência por `typeof` é o que autoriza a conversão da última linha: o que
 * chega de um `import` dinâmico é `any`, e só depois de haver, entre os nomes
 * aceitos, um que seja função, a conversão deixa de ser aposta.
 */
async function resolverSuperficieDeUS6(): Promise<Resolucao> {
  const encontrado: Record<string, unknown> = {};

  for (const caminho of MODULOS_DE_US6) {
    let modulo: Record<string, unknown>;
    try {
      modulo = (await import(caminho)) as Record<string, unknown>;
    } catch {
      continue;
    }
    for (const [nome, valor] of Object.entries(modulo)) {
      encontrado[nome] = valor;
    }
  }

  const nome = NOMES_ACEITOS_DE_REGISTRAR.find(
    (candidato) => typeof encontrado[candidato] === 'function',
  );

  if (nome === undefined) {
    const nomes = Object.keys(encontrado).sort();
    return {
      disponivel: false,
      nomesParecidos: nomes.filter((candidato) =>
        /registr|cadastr/i.test(candidato),
      ),
      quantosNomes: nomes.length,
    };
  }

  return {
    disponivel: true,
    us6: { registrar: encontrado[nome] as SuperficieDeUS6['registrar'] },
  };
}

const RESOLUCAO = await resolverSuperficieDeUS6();

/** A superfície, ou uma falha que diz o que falta e de quem é a tarefa. */
function us6(): SuperficieDeUS6 {
  if (!RESOLUCAO.disponivel) {
    assert.fail(
      'US-6 nao esta nesta arvore: nenhum dos nomes aceitos para a operacao de ' +
        `cadastro (${NOMES_ACEITOS_DE_REGISTRAR.join(', ')}) foi encontrado em ` +
        `${MODULOS_DE_US6.join(', ')}. Estes oito testes sao T014, e tasks.md poe ` +
        '"T014 depende de T013" — o comportamento de US-6 e entrega de T013. ' +
        'Se T013 ja entrou e usou outro nome, acrescente-o a ' +
        'NOMES_ACEITOS_DE_REGISTRAR: o que esta suite protege e o comportamento, ' +
        `nao o identificador. Dos ${RESOLUCAO.quantosNomes} nomes resolvidos, os ` +
        'que parecem ser de cadastro sao: ' +
        `${RESOLUCAO.nomesParecidos.join(', ') || '(nenhum)'}.`,
    );
  }
  return RESOLUCAO.us6;
}

/*
  ── O DADO DE ENTRADA DOS OITO CASOS ────────────────────────────────────────
*/

/** O instante do relógio controlado, como o P4 cobra para todo prazo. */
const AGORA = 1_700_000_000;

/** O visitante que se cadastra: os dois campos que `SCR-005` coleta. */
const LOGIN = 'visitante';
const EMAIL = 'visitante@example.com';

/** O apelido informado explicitamente, pelo motivo dito em `PedidoDeRegistro`. */
const APELIDO = 'visitante';

/** A URL do site, de onde sai o caminho de definir senha (CA-6.5). */
const URL_DO_SITE = 'https://exemplo.invalido';

/** O papel de fábrica de quem se cadastra: `default_role` nasce em `subscriber`. */
const PAPEL_DE_FABRICA = 'subscriber';

/** Os limites de `U2` / `BR-MIGRAR-022`, com o valor de fábrica do legado. */
const LIMITE_DE_LOGIN = 60;
const LIMITE_DE_APELIDO = 50;

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
  ── O BANCO DE MENTIRA, QUE RESPONDE PELO CONTEÚDO DA CONSULTA ──────────────

  O motivo de não ser a fila posicional de `porta-falsa.ts` está no cabeçalho: a
  ordem entre a consulta de login e a de e-mail não é fixada por documento
  nenhum, e uma fila posicional faria esta suíte cobrá-la.
*/

interface BancoDeMentira {
  readonly porta: PortaDeDados;
  /** Toda leitura pedida, na ordem. */
  readonly selecoes: readonly Consulta[];
  /** Toda escrita pedida, na ordem. Lista vazia é afirmação, não ausência. */
  readonly escritas: readonly Consulta[];
}

interface ContasEmUso {
  readonly logins?: readonly string[];
  readonly emails?: readonly string[];
  readonly apelidos?: readonly string[];
}

/** O id que a inserção devolve, para que `contaId` possa ser afirmado. */
const ID_GERADO = 7;

/** A linha de `users` de uma conta que já existe — o que CA-6.3 precisa ver. */
function linhaDeContaExistente(valor: string): LinhaDeResultado {
  return {
    ID: 3,
    user_login: valor,
    user_pass: '$wp$2y$10$jaExiste',
    user_nicename: valor,
    user_email: valor,
    user_url: '',
    user_registered: '2026-01-01 00:00:00',
    user_activation_key: '',
    user_status: 0,
    display_name: valor,
  };
}

function bancoDeMentira(
  definicaoDePapeis: DefinicaoDePapeis,
  emUso: ContasEmUso = {},
): BancoDeMentira {
  const logins = new Set(emUso.logins ?? []);
  const emails = new Set(emUso.emails ?? []);
  const apelidos = new Set(emUso.apelidos ?? []);
  const definicaoGravada = serializar(definicaoParaValor(definicaoDePapeis));

  const selecoes: Consulta[] = [];
  const escritas: Consulta[] = [];

  return {
    porta: {
      prefixoDeTabela: 'wp_',
      prefixoBaseDeTabela: 'wp_',
      selecionar(consulta) {
        selecoes.push(consulta);
        const texto = consulta.texto;
        const valores = consulta.parametros.map(textoDoParametro);

        // A definição dos papéis: a opção que o ADR-0001 põe como dado gravado.
        if (/\bwp_options\b/.test(texto)) {
          return [{ option_value: definicaoGravada }];
        }

        // A conta: as três unicidades que o legado cobra em código.
        if (/\bwp_users\b/.test(texto)) {
          const achou =
            (/user_login/.test(texto) &&
              valores.some((valor) => logins.has(valor))) ||
            (/user_email/.test(texto) &&
              valores.some((valor) => emails.has(valor))) ||
            (/user_nicename/.test(texto) &&
              valores.some((valor) => apelidos.has(valor)));
          const valor = valores[0] ?? '';
          return achou ? [linhaDeContaExistente(valor)] : [];
        }

        // Conta nova não tem metadado nenhum, e é por isso que a gravação de
        // capacidade sai como INSERT (ver `perfil.ts`, `gravar`).
        return [];
      },
      escrever(consulta) {
        escritas.push(consulta);
        return { linhasAfetadas: 1, idGerado: ID_GERADO };
      },
    },
    selecoes,
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

/** O relógio controlado: um instante fixo, em segundos inteiros UTC. */
const RELOGIO: PortaDeRelogio = { agoraEmSegundos: () => AGORA };

/*
  ── A MONTAGEM DE UM CASO ───────────────────────────────────────────────────
*/

interface Cenario {
  readonly banco: BancoDeMentira;
  readonly email: EmailDeMentira;
  readonly armazenamento: Armazenamento;
  readonly definicao: DefinicaoDePapeis;
  /** O contexto base. Cada caso o completa com o que ele exercita. */
  readonly contexto: ContextoDeRegistro;
}

/**
 * Monta um caso para um lado do conflito `REQ-017`.
 *
 * O contexto base **não traz** `cadastroAberto`, `papelPadrao` nem `ganchos`: a
 * ausência é o valor de fábrica, e é assim que os casos o cobram.
 */
function cenario(
  lado: LadoDoConflitoDeNivelNumerico,
  emUso: ContasEmUso = {},
): Cenario {
  const definicao = povoarPapeis(lado);
  const banco = bancoDeMentira(definicao, emUso);
  const email = emailDeMentira();
  const armazenamento = criarArmazenamento(banco.porta);

  return {
    banco,
    email,
    armazenamento,
    definicao,
    contexto: {
      relogio: RELOGIO,
      email: email.porta,
      armazenamento,
      urlDoSite: URL_DO_SITE,
    },
  };
}

/** O pedido de cadastro, com o apelido sempre informado (ver `PedidoDeRegistro`). */
function pedido(
  campos: { login?: string; email?: string; apelido?: string } = {},
): PedidoDeRegistro {
  return {
    login: campos.login ?? LOGIN,
    email: campos.email ?? EMAIL,
    apelido: campos.apelido ?? APELIDO,
  };
}

/*
  ── LEITURA DO EFEITO NO BANCO ──────────────────────────────────────────────

  As consultas que o armazenamento de T002 emite são parametrizadas, logo o valor
  de uma coluna não está no texto: está no parâmetro, na posição em que a coluna
  aparece na lista. Estes dois ajudantes leem por **nome de coluna**, e não por
  posição fixa, para que a ordem das colunas de T013 não decida o resultado.
*/

/** O valor que um `INSERT` dá àquela coluna, ou `null` quando não a menciona. */
function valorInserido(consulta: Consulta, coluna: string): string | null {
  const lista = /\(([^)]*)\)\s*VALUES/i.exec(consulta.texto);
  if (lista === null) {
    return null;
  }
  const colunas = (lista[1] ?? '').split(',').map((nome) => nome.trim());
  const indice = colunas.indexOf(coluna);
  if (indice < 0 || indice >= consulta.parametros.length) {
    return null;
  }
  return textoDoParametro(consulta.parametros[indice]);
}

/** As escritas que tocaram aquela tabela. */
function escritasEm(banco: BancoDeMentira, tabela: string): readonly Consulta[] {
  return banco.escritas.filter((consulta) =>
    new RegExp(`\\b${tabela}\\b`).test(consulta.texto),
  );
}

/**
 * O valor gravado naquela chave de `usermeta`, nas duas formas que `perfil.ts`
 * emite: `INSERT` quando não havia linha, `UPDATE` quando havia.
 */
function metadadoGravado(banco: BancoDeMentira, chave: string): string | null {
  for (const consulta of escritasEm(banco, 'wp_usermeta')) {
    const valores = consulta.parametros.map(textoDoParametro);
    if (!valores.includes(chave)) {
      continue;
    }
    if (/^INSERT/i.test(consulta.texto)) {
      return valorInserido(consulta, 'meta_value');
    }
    // `UPDATE wp_usermeta SET meta_value = ? WHERE …`: o valor é o primeiro.
    return valores[0] ?? null;
  }
  return null;
}

/** Nada foi escrito e nada foi enviado: a forma de afirmar uma recusa. */
function nadaSaiu(cen: Cenario, oQue: string): void {
  assert.deepEqual(
    cen.banco.escritas.map((consulta) => consulta.texto),
    [],
    `${oQue}: nenhum comando de escrita pode sair do banco`,
  );
  assert.equal(
    cen.email.enviadas.length,
    0,
    `${oQue}: nenhum e-mail pode ser enviado`,
  );
}

/** A recusa carrega ao menos um código, e devolve o primeiro deles. */
function codigoDaRecusa(
  resultado: ResultadoDeRegistro,
  oQue: string,
): string {
  assert.equal(resultado.registrado, false, `${oQue}: tem de ser recusado`);
  assert.ok(
    !resultado.registrado && resultado.erro.itens.length > 0,
    `${oQue}: a recusa tem de carregar ao menos um codigo de erro`,
  );
  const primeiro = !resultado.registrado
    ? resultado.erro.itens[0]
    : undefined;
  assert.ok(primeiro, `${oQue}: o primeiro item do erro tem de existir`);
  return primeiro.codigo;
}

/*
  ── UT-009-1 ───────────────────────────────────────────────────────────────

  CA-6.1 — *"O cadastro aberto nasce desligado; desligado, o formulário não é
  oferecido e a ação é recusada"*.

  Entrada: um pedido válido, e o contexto **sem** `cadastroAberto` — que é como
  esta suíte cobra o valor de fábrica de `users_can_register`, que `UC-21` anota
  como *"nasce em 0"*. O mesmo pedido é repetido com a opção explicitamente
  desligada, porque o valor de fábrica e o valor explícito têm de produzir o mesmo
  resultado.
  Ação: cadastrar-se.
  Esperado: recusa com código, e **nenhum comando no banco e nenhum e-mail** — que
  é a forma observável de *"a ação é recusada"*. A outra metade do critério, o
  formulário não ser oferecido, é de `SCR-005` e está declarada no cabeçalho.
*/
test('UT-009-1 · CA-6.1 · o cadastro aberto nasce desligado, e desligado a acao e recusada', () => {
  for (const lado of LADOS_DO_CONFLITO) {
    // O valor de fábrica, cobrado pela ausência da opção.
    const defabrica = cenario(lado);
    const recusaDeFabrica = us6().registrar(pedido(), defabrica.contexto);
    codigoDaRecusa(recusaDeFabrica, `${lado}: cadastro aberto no valor de fabrica`);
    nadaSaiu(defabrica, `${lado}: cadastro aberto no valor de fabrica`);

    // O mesmo, desligado explicitamente: tem de ser indistinguível.
    const desligado = cenario(lado);
    const recusaExplicita = us6().registrar(pedido(), {
      ...desligado.contexto,
      cadastroAberto: false,
    });
    codigoDaRecusa(recusaExplicita, `${lado}: cadastro aberto desligado`);
    nadaSaiu(desligado, `${lado}: cadastro aberto desligado`);
  }
});

/*
  ── UT-009-2 ───────────────────────────────────────────────────────────────

  CA-6.2 — *"Login acima de 60 caracteres e apelido acima de 50 devolvem erro,
  nunca truncamento silencioso"*.

  Entrada: cadastro aberto ligado, e dois pedidos — um com login de 61 caracteres
  e apelido curto, outro com login curto e apelido de 51. Os dois campos são
  exercitados **separadamente** porque `UC-21` os lista como duas condições na
  mesma linha de exceção, e cruzá-los esconderia qual dos dois recusou.
  Ação: cadastrar-se.
  Esperado: recusa com código nos dois; nenhum comando no banco; e — a parte que
  dá nome ao critério — **nenhuma escrita carrega o valor truncado no limite**,
  que é como um truncamento silencioso apareceria.
*/
test('UT-009-2 · CA-6.2 · login acima de 60 e apelido acima de 50 sao erro, nunca truncamento', () => {
  for (const lado of LADOS_DO_CONFLITO) {
    const loginLongo = textoDe(LIMITE_DE_LOGIN + 1);
    const comLoginLongo = cenario(lado);
    const recusaDeLogin = us6().registrar(
      pedido({ login: loginLongo, apelido: APELIDO }),
      { ...comLoginLongo.contexto, cadastroAberto: true },
    );
    codigoDaRecusa(recusaDeLogin, `${lado}: login de ${LIMITE_DE_LOGIN + 1}`);
    nadaSaiu(comLoginLongo, `${lado}: login de ${LIMITE_DE_LOGIN + 1}`);
    assert.ok(
      !comLoginLongo.banco.escritas.some((consulta) =>
        consulta.parametros
          .map(textoDoParametro)
          .includes(loginLongo.slice(0, LIMITE_DE_LOGIN)),
      ),
      `${lado}: nenhuma escrita pode carregar o login truncado em ${LIMITE_DE_LOGIN}`,
    );

    const apelidoLongo = textoDe(LIMITE_DE_APELIDO + 1, 'b');
    const comApelidoLongo = cenario(lado);
    const recusaDeApelido = us6().registrar(
      pedido({ apelido: apelidoLongo }),
      { ...comApelidoLongo.contexto, cadastroAberto: true },
    );
    codigoDaRecusa(recusaDeApelido, `${lado}: apelido de ${LIMITE_DE_APELIDO + 1}`);
    nadaSaiu(comApelidoLongo, `${lado}: apelido de ${LIMITE_DE_APELIDO + 1}`);
    assert.ok(
      !comApelidoLongo.banco.escritas.some((consulta) =>
        consulta.parametros
          .map(textoDoParametro)
          .includes(apelidoLongo.slice(0, LIMITE_DE_APELIDO)),
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
  Esperado: recusa com código nos dois; nenhum comando de escrita; e o banco **foi
  consultado** sobre a coluna em questão, porque é isso que `UC-21` quer dizer com
  *"a verificação é feita em código: o banco permite duplicata"* — sem a consulta
  não há regra, há restrição de esquema, que este produto não tem.
*/
test('UT-009-3 · CA-6.3 · login ou e-mail ja em uso devolvem erro no formulario', () => {
  for (const lado of LADOS_DO_CONFLITO) {
    const loginEmUso = cenario(lado, { logins: [LOGIN] });
    const recusaDeLogin = us6().registrar(pedido(), {
      ...loginEmUso.contexto,
      cadastroAberto: true,
    });
    codigoDaRecusa(recusaDeLogin, `${lado}: login ja em uso`);
    nadaSaiu(loginEmUso, `${lado}: login ja em uso`);
    assert.ok(
      loginEmUso.banco.selecoes.some(
        (consulta) =>
          /\bwp_users\b/.test(consulta.texto) &&
          /user_login/.test(consulta.texto),
      ),
      `${lado}: a unicidade do login e cobrada por consulta, nao por restricao`,
    );

    const emailEmUso = cenario(lado, { emails: [EMAIL] });
    const recusaDeEmail = us6().registrar(pedido(), {
      ...emailEmUso.contexto,
      cadastroAberto: true,
    });
    codigoDaRecusa(recusaDeEmail, `${lado}: e-mail ja em uso`);
    nadaSaiu(emailEmUso, `${lado}: e-mail ja em uso`);
    assert.ok(
      emailEmUso.banco.selecoes.some(
        (consulta) =>
          /\bwp_users\b/.test(consulta.texto) &&
          /user_email/.test(consulta.texto),
      ),
      `${lado}: a unicidade do e-mail e cobrada por consulta, nao por restricao`,
    );
  }
});

/*
  ── UT-009-4 ───────────────────────────────────────────────────────────────

  CA-6.4 — *"A conta criada recebe o papel padrão de menor poder e nenhuma senha
  definida pelo titular"*.

  Entrada: cadastro aberto ligado, e o contexto **sem** `papelPadrao` — porque é a
  ausência que cobra o valor de fábrica de `default_role`, que `UC-21` anota como
  *"nasce em subscriber"*.
  Ação: cadastrar-se.
  Esperado: a conta é criada; **uma** inserção em `users`, com o login e o e-mail
  informados; o metadado `{site}capabilities` gravado com os bytes exatos da
  concessão de `subscriber`; `subscriber` é o papel de **menor poder** da matriz de
  fábrica, nos dois lados do conflito; e nada do que o visitante informou foi
  gravado como senha — o formulário não tem campo de senha, e a ausência dele em
  `PedidoDeRegistro` é parte desta assertiva.
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

  for (const lado of LADOS_DO_CONFLITO) {
    const cen = cenario(lado);

    // `subscriber` é o de menor poder da matriz de fábrica — e é nos dois lados
    // do conflito, porque nível numérico entra em todos os cinco papéis.
    const concessoesPorPapel = cen.definicao.map((entrada) => ({
      identificador: entrada.identificador,
      quantas: entrada.papel.capacidades.filter(
        (concessao) => concessao.concedida,
      ).length,
    }));
    const menor = concessoesPorPapel.reduce((atual, candidato) =>
      candidato.quantas < atual.quantas ? candidato : atual,
    );
    assert.equal(
      menor.identificador,
      PAPEL_DE_FABRICA,
      `${lado}: o papel de menor poder da matriz de fabrica e ${PAPEL_DE_FABRICA}`,
    );

    const resultado = us6().registrar(pedido(), {
      ...cen.contexto,
      cadastroAberto: true,
    });

    assert.ok(resultado.registrado, `${lado}: o cadastro tem de ser aceito`);
    assert.equal(resultado.contaId, ID_GERADO, `${lado}: o id gerado e devolvido`);

    const insercoes = escritasEm(cen.banco, 'wp_users').filter((consulta) =>
      /^INSERT/i.test(consulta.texto),
    );
    assert.equal(insercoes.length, 1, `${lado}: uma unica insercao em users`);
    const insercao = insercoes[0] as Consulta;
    assert.equal(valorInserido(insercao, 'user_login'), LOGIN);
    assert.equal(valorInserido(insercao, 'user_email'), EMAIL);

    // A coluna morta continua morta: `DB-DEAD` / BR-MIGRAR-086 e o cenário de
    // paridade cobram que nenhuma das duas metades escreva nela.
    assert.ok(
      !/user_status/.test(insercao.texto),
      `${lado}: user_status e coluna morta e nenhuma escrita a menciona`,
    );

    assert.equal(
      metadadoGravado(cen.banco, chaveDeCapacidades(prefixosDe(cen.banco.porta))),
      concessaoEsperada,
      `${lado}: o papel atribuido e gravado como a concessao de ${PAPEL_DE_FABRICA}`,
    );

    // Nenhuma senha definida pelo titular: nada do que o visitante informou pode
    // ter virado o valor de `user_pass`.
    const senhaGravada = valorInserido(insercao, 'user_pass');
    assert.ok(
      senhaGravada !== LOGIN &&
        senhaGravada !== EMAIL &&
        senhaGravada !== APELIDO,
      `${lado}: nada que o visitante informou pode ser gravado como senha`,
    );
  }
});

/*
  ── UT-009-5 ───────────────────────────────────────────────────────────────

  CA-6.5 — *"O titular recebe por e-mail um caminho para definir a senha, válido
  por 24 horas"*.

  Entrada: cadastro aberto ligado, relógio parado em `AGORA`.
  Ação: cadastrar-se.
  Esperado: **um** e-mail, para o endereço informado, com um caminho do site no
  corpo; e a chave gravada na conta com o **instante do relógio prefixado** nela,
  que é a origem a partir da qual as 24 horas de `U4` são aritmética. A chave
  gravada não pode aparecer no corpo do e-mail: CA-4.1 põe o hash na conta e o
  valor em claro só na mensagem. A **borda** das 24 horas é de US-4 / T010, pelo
  motivo dito no cabeçalho.
*/
test('UT-009-5 · CA-6.5 · o titular recebe por e-mail um caminho para definir a senha', () => {
  for (const lado of LADOS_DO_CONFLITO) {
    const cen = cenario(lado);

    const resultado = us6().registrar(pedido(), {
      ...cen.contexto,
      cadastroAberto: true,
    });
    assert.ok(resultado.registrado, `${lado}: o cadastro tem de ser aceito`);

    assert.equal(
      cen.email.enviadas.length,
      1,
      `${lado}: exatamente um e-mail sai do cadastro`,
    );
    const mensagem = cen.email.enviadas[0] as MensagemDeEmail;
    assert.deepEqual(
      mensagem.destinatarios,
      [EMAIL],
      `${lado}: o e-mail vai para o endereco informado no formulario`,
    );
    assert.ok(
      mensagem.corpo.includes(URL_DO_SITE),
      `${lado}: o corpo carrega um caminho do site para definir a senha`,
    );

    // A chave de ativação, onde o legado a guarda: na conta, com o instante
    // prefixado (`wp-includes/user.php:3204`).
    const comChave = cen.banco.escritas.filter(
      (consulta) =>
        /\bwp_users\b/.test(consulta.texto) &&
        /user_activation_key/.test(consulta.texto),
    );
    assert.ok(
      comChave.length > 0,
      `${lado}: a chave de definicao de senha e gravada na conta`,
    );
    const chaveGravada = comChave
      .flatMap((consulta) => consulta.parametros.map(textoDoParametro))
      .find((valor) => valor.startsWith(String(AGORA)));
    assert.ok(
      chaveGravada,
      `${lado}: a chave gravada leva o instante ${AGORA} prefixado, que e de onde as 24 horas contam`,
    );
    assert.ok(
      !mensagem.corpo.includes(chaveGravada),
      `${lado}: o valor guardado na conta nao vai no e-mail (CA-4.1)`,
    );
  }
});

/*
  ── UT-009-6 ───────────────────────────────────────────────────────────────

  CA-6.6 — *"Login constante da lista de proibidos é recusado, e a lista nasce
  vazia"*.

  Entrada: cadastro aberto ligado. Duas montagens: uma **sem** `ganchos`, que é
  como esta suíte cobra a lista de fábrica, e uma com um interceptador que põe o
  login pedido na lista.
  Ação: cadastrar-se.
  Esperado: sem interceptador, o mesmo login é aceito — é isso que *"a lista nasce
  vazia"* significa de fora; com o login na lista, recusa com código e nenhum
  comando no banco.
*/
test('UT-009-6 · CA-6.6 · login da lista de proibidos e recusado, e a lista nasce vazia', () => {
  for (const lado of LADOS_DO_CONFLITO) {
    const semLista = cenario(lado);
    const aceito = us6().registrar(pedido(), {
      ...semLista.contexto,
      cadastroAberto: true,
    });
    assert.ok(
      aceito.registrado,
      `${lado}: a lista de logins proibidos nasce vazia, logo este login passa`,
    );

    const comLista = cenario(lado);
    const recusado = us6().registrar(pedido(), {
      ...comLista.contexto,
      cadastroAberto: true,
      ganchos: { loginsProibidos: () => [LOGIN] },
    });
    codigoDaRecusa(recusado, `${lado}: login na lista de proibidos`);
    nadaSaiu(comLista, `${lado}: login na lista de proibidos`);
  }
});

/*
  ── UT-009-7 · TESTE DE REGRA DE NEGÓCIO ───────────────────────────────────

  `U2` / `BR-MIGRAR-022` — *"Login até 60 caracteres, apelido até 50 — e os dois
  são erro, não truncamento. A unicidade de login e e-mail é verificada **em
  código**: o índice `user_login_key` não é `UNIQUE` e o banco permite
  duplicata."*

  O que este caso afirma e CA-6.2 não afirma: **as bordas nos dois sentidos**,
  como o P6 exige (*"no último instante aceita, um instante depois recusa"*), e a
  segunda metade da regra — que a unicidade **não** é restrição de armazenamento.

  Entrada e ação: login de exatamente 60 e apelido de exatamente 50 (com o outro
  campo curto, pelo motivo dito em `PedidoDeRegistro`); depois 61 e 51. E, antes
  de tudo, duas inserções do **mesmo** login direto pelo armazenamento de T002.
  Esperado: 60 e 50 aceitos, 61 e 51 recusados; e as duas inserções iguais saem as
  duas, sem erro — a duplicata é aceita pelo banco, e é por isso que a regra tem
  de viver no cadastro.
*/
test('UT-009-7 · U2 · os limites de 60 e 50 nas duas bordas, e o banco aceitando duplicata', () => {
  for (const lado of LADOS_DO_CONFLITO) {
    // A segunda metade de BR-MIGRAR-022, afirmada no armazenamento de T002: o
    // banco aceita duas contas com o mesmo login, e nada reclama. Isto não
    // depende de T013 — e é o motivo de a regra ter de ser cobrada no cadastro.
    const semRestricao = cenario(lado);
    const contaNova = {
      login: LOGIN,
      senhaHash: '$wp$2y$10$qualquer',
      apelido: APELIDO,
      email: EMAIL,
      url: '',
      registradoEm: '2026-01-01 00:00:00',
      chaveDeAtivacao: '',
      nomeExibido: LOGIN,
    };
    semRestricao.armazenamento.contas.inserir(contaNova);
    semRestricao.armazenamento.contas.inserir(contaNova);
    assert.equal(
      escritasEm(semRestricao.banco, 'wp_users').length,
      2,
      `${lado}: as duas insercoes do mesmo login saem — o banco aceita duplicata`,
    );

    // A borda de baixo: exatamente no limite, aceita.
    const noLimite = cenario(lado);
    const aceitoNoLimite = us6().registrar(
      pedido({
        login: textoDe(LIMITE_DE_LOGIN),
        apelido: textoDe(LIMITE_DE_APELIDO, 'b'),
      }),
      { ...noLimite.contexto, cadastroAberto: true },
    );
    assert.ok(
      aceitoNoLimite.registrado,
      `${lado}: login de ${LIMITE_DE_LOGIN} e apelido de ${LIMITE_DE_APELIDO} sao aceitos`,
    );

    // A borda de cima: um caractere depois, recusa. Um campo por vez.
    const acimaDoLogin = cenario(lado);
    codigoDaRecusa(
      us6().registrar(
        pedido({ login: textoDe(LIMITE_DE_LOGIN + 1), apelido: APELIDO }),
        { ...acimaDoLogin.contexto, cadastroAberto: true },
      ),
      `${lado}: login de ${LIMITE_DE_LOGIN + 1}`,
    );

    const acimaDoApelido = cenario(lado);
    codigoDaRecusa(
      us6().registrar(
        pedido({ apelido: textoDe(LIMITE_DE_APELIDO + 1, 'b') }),
        { ...acimaDoApelido.contexto, cadastroAberto: true },
      ),
      `${lado}: apelido de ${LIMITE_DE_APELIDO + 1}`,
    );
  }
});

/*
  ── UT-009-8 · TESTE DE REGRA DE NEGÓCIO ───────────────────────────────────

  `U3` / `BR-MIGRAR-023` — *"A lista de logins proibidos é vazia por padrão e
  existe só como filtro (`illegal_user_logins`), sem interface."*

  O que este caso afirma e CA-6.6 não afirma: que a lista é **ponto de extensão**,
  e o que o P2 cobra de todo ponto de extensão — *"que ele dispara, com os
  argumentos declarados, na posição declarada do fluxo, e que um interceptador
  consegue alterar o resultado onde o legado permite"*. É o cenário
  `@paridade @invariante` de `parity_tests/06-autenticacao-e-sessao.feature`:
  *"Dado nenhuma extensão registrada no ponto de logins proibidos … as duas
  metades aceitam. Quando uma extensão acrescenta um login à lista … as duas
  metades recusam esse login"*.

  Entrada e ação: cadastro aberto ligado, e um interceptador que **registra o que
  recebeu** e acrescenta um login à lista.
  Esperado: o interceptador é chamado e recebe a **lista vazia** de fábrica; o
  login que ele acrescentou é recusado; e um outro login continua aceito pelo
  mesmo interceptador — o que prova que a recusa veio da lista, e não do fato de
  haver interceptador.
*/
test('UT-009-8 · U3 · a lista de logins proibidos e vazia por padrao e existe so como filtro', () => {
  for (const lado of LADOS_DO_CONFLITO) {
    const recebido: (readonly string[])[] = [];
    const interceptador = (lista: readonly string[]): readonly string[] => {
      recebido.push(lista);
      return [...lista, LOGIN];
    };

    // O login que o interceptador acrescentou: recusado.
    const proibido = cenario(lado);
    codigoDaRecusa(
      us6().registrar(pedido(), {
        ...proibido.contexto,
        cadastroAberto: true,
        ganchos: { loginsProibidos: interceptador },
      }),
      `${lado}: o interceptador altera o resultado`,
    );
    nadaSaiu(proibido, `${lado}: login proibido por extensao`);

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
    const outro = cenario(lado);
    const aceito = us6().registrar(
      pedido({ login: 'outro-visitante', apelido: 'outro-visitante' }),
      {
        ...outro.contexto,
        cadastroAberto: true,
        ganchos: { loginsProibidos: interceptador },
      },
    );
    assert.ok(
      aceito.registrado,
      `${lado}: o que a lista nao proibe continua passando`,
    );
  }
});
