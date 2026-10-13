/**
 * Testes de **T013** — US-6, *"liberar o corpo de conteudo protegido por senha a
 * quem informa a senha"*, com os seis criterios de aceite da tarefa:
 *
 * | criterio | o que afirma |
 * |---|---|
 * | CA-6.1 | sem a senha, o corpo e substituido pelo formulario, e o resto da pagina continua servido |
 * | CA-6.2 | senha correta grava um atestado no navegador e o corpo passa a ser servido |
 * | CA-6.3 | senha errada devolve o formulario e mantem o corpo oculto |
 * | CA-6.4 | quem pode editar o conteudo ve o corpo sem informar a senha |
 * | CA-6.5 | comentar num conteudo protegido sem ter informado a senha e recusado com motivo proprio |
 * | CA-6.6 | o conteudo protegido continua em sitemap e listagem: a protecao e do corpo, nao da existencia |
 *
 * Mais o que T013 entrega e que nao e criterio de aceite proprio: os tres fatos
 * do atestado que a resposta 8 de `questions.md` manda preservar (dez dias, sem
 * verificacao de idade no servidor, sem limite de tentativa), os quatro pontos de
 * extensao que o fluxo atravessa, e o isolamento entre dois visitantes
 * concorrentes (`EXT-CONTEXTO`).
 *
 * **Nao sao os testes do catalogo.** Os oito casos `UT-043-1` a `UT-043-8` de
 * `backlog/tests.md` sao de **T014**, a tarefa `[P]`, e nenhum deles e afirmado
 * aqui: aqui se afirma o criterio de aceite, la se transcreve o caso.
 *
 * ⚠️ **Nada externo entra nestes testes.** O relogio chega por argumento, os
 * bytes da semeadura do hash chegam por argumento, e a capacidade, o endereco do
 * conteudo, o remetente e o registro de estilos sao duplos que **registram
 * chamada** — e e assim que se afirma o caso em que o legado nao pergunta
 * capacidade nenhuma.
 *
 * ⚠️ **Sobre os vetores do hash.** Os quatro valores transcritos em
 * {@link VETORES_DO_HASH} saem da **transcricao** do algoritmo de
 * `wp-includes/class-phpass.php:131-166`, conferida contra uma segunda
 * implementacao independente da mesma leitura — **nao** de uma execucao do
 * legado, que nao ha nesta maquina. Eles fixam o algoritmo contra regressao; a
 * conferencia contra o oraculo e `ESC-ORACULO` (BR-MIGRAR-116), T001 da feature
 * 015.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  acessoAoCorpoProtegidoNoPedido,
  AVISO_DE_CONTEUDO_PROTEGIDO,
  AVISO_DE_RESUMO_PROTEGIDO,
  CAMPO_DA_SENHA,
  CAMPO_DE_ENVIO,
  CAMPO_DE_RETORNO,
  CAMINHO_DO_ENVIO,
  CLASSE_DE_ERRO_DO_FORMULARIO,
  CLASSE_DE_SENHA_EXIGIDA,
  CLASSE_DE_SENHA_INFORMADA,
  CLASSE_DO_AVISO_DE_ERRO,
  CLASSE_DO_BOTAO_DE_BLOCO,
  CLASSE_DO_FORMULARIO,
  classesDaSenhaNoConteudo,
  cifrarComoPhpass,
  consultarConteudo,
  contextoDeSenhaResolvido,
  COMPRIMENTO_DO_HASH_PORTAVEL,
  COMPRIMENTO_MAXIMO_DA_SENHA,
  criarHashDoAtestado,
  criarModuloDeLeituraPublica,
  esquemaDoDestino,
  ESQUEMA_DO_ENVIO,
  ESTILO_DO_BOTAO_DE_BLOCO,
  FORMATO_DO_TITULO_PROTEGIDO,
  gravarAtestadoDeSenha,
  hashDoCookie,
  HASH_AUSENTE,
  MENSAGEM_DE_SENHA_INVALIDA,
  METODO_DO_ENVIO,
  montarFormularioDeSenha,
  MOTIVO_DE_COMENTARIO_EM_CONTEUDO_PROTEGIDO,
  nomeDoCookieDoAtestado,
  PRAZO_DO_ATESTADO_EM_SEGUNDOS,
  PREFIXO_DO_ATESTADO,
  PREFIXO_DO_COOKIE_DO_ATESTADO,
  PREFIXO_DO_ID_DO_CAMPO,
  PREFIXO_DO_ID_DO_ERRO,
  recusaDeComentarioEmConteudoProtegido,
  resumoOuAviso,
  semeaduraDoPhpass,
  senhaDoConteudoExigida,
  tituloComPrefixoDeProtecao,
  corpoOuFormulario,
  filtroDeSenhaDoPedidoRest,
  type ConteudoComCorpo,
  type ConteudoConsultado,
  type ContextoDaSenhaDeConteudo,
  type CriteriosDaConsulta,
  type HashDoAtestado,
  type PortasDeLeituraPublica,
  type TiposDeConsulta,
} from '../index.js';

/** A senha gravada no conteudo de todos os casos deste arquivo. */
const SENHA = 'abre-te-sesamo';

/** O endereco publico do conteudo protegido. */
const ENDERECO = 'https://exemplo.test/2026/10/protegido/';

/** A porta de dados, que **nenhuma** operacao de US-6 deve tocar. */
function portasDeTeste(): PortasDeLeituraPublica {
  return {
    dados: {
      prefixoDeTabela: 'wp_',
      selecionar() {
        throw new Error('a senha de conteudo nao consulta o banco');
      },
      escrever() {
        throw new Error('a senha de conteudo nao grava no banco');
      },
    },
  };
}

/** Um conteudo protegido, nos campos que a liberacao do corpo le. */
function protegido(parcial: Partial<ConteudoComCorpo> = {}): ConteudoComCorpo {
  return {
    id: 42,
    senha: SENHA,
    corpo: 'o corpo secreto',
    resumo: 'o resumo gravado',
    titulo: 'Conteudo protegido',
    ...parcial,
  };
}

/** O hash do atestado com semeadura fixa, para que o valor seja afirmavel. */
const BYTES_FIXOS = Uint8Array.from([1, 2, 3, 4, 5, 6]);

function hashFixo(): HashDoAtestado {
  return criarHashDoAtestado({ bytesAleatorios: () => BYTES_FIXOS });
}

/**
 * O contexto de um visitante, com o atestado que ele tiver.
 *
 * `podeEditarConteudo` registra chamada e devolve **nao**: e com ele que se
 * afirma que o portao publico nao pergunta capacidade nenhuma.
 */
function visitante(
  atestado?: string,
  extra: ContextoDaSenhaDeConteudo = {},
): { contexto: ContextoDaSenhaDeConteudo; capacidadesPerguntadas: number[] } {
  const capacidadesPerguntadas: number[] = [];
  const contexto: ContextoDaSenhaDeConteudo = {
    ...(atestado === undefined ? {} : { atestado }),
    hashDoAtestado: hashFixo(),
    podeEditarConteudo: (id) => {
      capacidadesPerguntadas.push(id);
      return false;
    },
    enderecoDoConteudo: () => ENDERECO,
    ...extra,
  };
  return { contexto, capacidadesPerguntadas };
}

/** O atestado que a senha `SENHA` produz com a semeadura fixa. */
const ATESTADO_CERTO = hashFixo().gerar(SENHA);

/** O atestado que uma senha errada produz com a mesma semeadura. */
const ATESTADO_ERRADO = hashFixo().gerar('chute');

// ---------------------------------------------------------------------------
// CA-6.1 — sem a senha, o corpo sai e o formulario entra
// ---------------------------------------------------------------------------

test('CA-6.1: sem atestado, o corpo e substituido pelo formulario de senha', () => {
  const { contexto, capacidadesPerguntadas } = visitante();

  const resultado = corpoOuFormulario(protegido(), { contexto });

  assert.equal(resultado.liberado, false);
  assert.ok(!resultado.liberado);
  assert.equal(resultado.formulario.aviso, AVISO_DE_CONTEUDO_PROTEGIDO);
  assert.equal(resultado.formulario.metodo, METODO_DO_ENVIO);
  // UT-043-8 do catalogo afirma o mesmo por outro caminho: o portao decide sem
  // consultar o modelo de capacidades, e aqui isso e um zero.
  assert.deepEqual(capacidadesPerguntadas, []);
});

test('CA-6.1: o formulario traz os tres campos de SCR-011, com o nome e o tipo do legado', () => {
  const { contexto } = visitante();

  const formulario = montarFormularioDeSenha(protegido(), { contexto });

  // A tabela § 3 de `target_screens.md`, e o cenario de nome de campo de
  // `PTS-004`: o nome do campo e a API, e renomear quebra cliente externo.
  assert.deepEqual(
    formulario.campos.map((campo) => [campo.nome, campo.tipo]),
    [
      [CAMPO_DE_RETORNO, 'hidden'],
      [CAMPO_DA_SENHA, 'password'],
      [CAMPO_DE_ENVIO, 'submit'],
    ],
  );
  // ⚠️ O `required` e do legado (`post-template.php:1828`), e so o campo da
  // senha o tem — § 6 de `target_screens.md`: "1 de 3 campos com `required`".
  assert.deepEqual(
    formulario.campos.map((campo) => campo.obrigatorio),
    [false, true, false],
  );
  assert.equal(formulario.retorno, ENDERECO);
  assert.equal(formulario.idDoCampo, `${PREFIXO_DO_ID_DO_CAMPO}42`);
  assert.deepEqual(formulario.classes, [CLASSE_DO_FORMULARIO]);
});

test('CA-6.1: o endereco do conteudo e pedido DUAS vezes, como no legado', () => {
  // `post-template.php:1789` e `:1808` chamam `get_permalink()` cada uma, e ela
  // dispara ponto de extensao: reusar o valor trocaria duas execucoes do
  // interceptador por uma (P2).
  const pedidos: number[] = [];
  const { contexto } = visitante(undefined, {
    enderecoDoConteudo: (id) => {
      pedidos.push(id);
      return ENDERECO;
    },
  });

  montarFormularioDeSenha(protegido(), { contexto });

  assert.deepEqual(pedidos, [42, 42]);

  // E sem identificador nenhuma das duas acontece, porque o `&&` do
  // interpretador curto-circuita em `! empty( $post->ID )`.
  const semId: number[] = [];
  montarFormularioDeSenha(
    { id: 0, senha: SENHA },
    {
      contexto: visitante(undefined, {
        numeroAleatorio: () => 1,
        enderecoDoConteudo: (id) => {
          semId.push(id);
          return ENDERECO;
        },
      }).contexto,
    },
  );
  assert.deepEqual(semId, []);
});

test('CA-6.1: o destino do formulario e o caminho de `postpass`, pelo esquema de login', () => {
  const pedidos: [string, string][] = [];
  const { contexto } = visitante(undefined, {
    enderecoDoSite: (caminho, esquema) => {
      pedidos.push([caminho, esquema]);
      return `https://exemplo.test/${caminho}`;
    },
  });

  const formulario = montarFormularioDeSenha(protegido(), { contexto });

  assert.deepEqual(pedidos, [[CAMINHO_DO_ENVIO, ESQUEMA_DO_ENVIO]]);
  assert.equal(
    formulario.destino,
    'https://exemplo.test/wp-login.php?action=postpass',
  );
});

test('CA-6.1: o resto da pagina continua servido — titulo, resumo e classes', () => {
  const { contexto } = visitante();
  const conteudo = protegido();

  // O titulo continua, com o prefixo de `post-template.php:128`.
  assert.equal(
    tituloComPrefixoDeProtecao(conteudo, { contexto }),
    FORMATO_DO_TITULO_PROTEGIDO.replace('%s', 'Conteudo protegido'),
  );
  // O resumo troca pela frase propria do legado (`:424`), e nao desaparece.
  assert.equal(resumoOuAviso(conteudo, { contexto }), AVISO_DE_RESUMO_PROTEGIDO);
  // E a listagem marca o item (`:535`), e suprime a imagem destacada (`:541`).
  const classes = classesDaSenhaNoConteudo(conteudo, { contexto });
  assert.deepEqual(classes.classes, [CLASSE_DE_SENHA_EXIGIDA]);
  assert.equal(classes.imagemDestacadaPermitida, false);
});

test('CA-6.1: conteudo sem senha nao encosta no portao, e o corpo sai inteiro', () => {
  const { contexto } = visitante();

  const resultado = corpoOuFormulario(protegido({ senha: '' }), { contexto });

  assert.ok(resultado.liberado);
  assert.equal(resultado.corpo, 'o corpo secreto');
  assert.deepEqual(
    classesDaSenhaNoConteudo(protegido({ senha: '' }), { contexto }).classes,
    [],
  );
  assert.equal(
    tituloComPrefixoDeProtecao(protegido({ senha: '' }), { contexto }),
    'Conteudo protegido',
  );
});

// ---------------------------------------------------------------------------
// CA-6.2 — senha correta grava o atestado, e o corpo passa a ser servido
// ---------------------------------------------------------------------------

test('CA-6.2: a senha correta grava o atestado e, com ele, o corpo e servido', () => {
  const agora = 1_760_000_000;
  const { contexto } = visitante(undefined, {
    hashDoCookie: hashDoCookie('https://exemplo.test'),
  });

  const gravacao = gravarAtestadoDeSenha(
    { senhaInformada: SENHA, destino: ENDERECO },
    { contexto, agora },
  );

  assert.ok(gravacao.cookie !== undefined);
  assert.equal(
    gravacao.cookie.nome,
    nomeDoCookieDoAtestado(hashDoCookie('https://exemplo.test')),
  );
  assert.ok(gravacao.cookie.valor.startsWith(PREFIXO_DO_ATESTADO));
  assert.equal(gravacao.destino, ENDERECO);

  // E a leitura seguinte, com o cookie que acabou de ser gravado, serve o corpo.
  const { contexto: comAtestado } = visitante(gravacao.cookie.valor);
  const resultado = corpoOuFormulario(protegido(), { contexto: comAtestado });

  assert.ok(resultado.liberado);
  assert.equal(resultado.corpo, 'o corpo secreto');
});

test('CA-6.2 / P6: o atestado vence em dez dias, e e o unico numero deste fluxo', () => {
  const agora = 1_760_000_000;
  const { contexto } = visitante();

  const gravacao = gravarAtestadoDeSenha(
    { senhaInformada: SENHA, destino: ENDERECO },
    { contexto, agora },
  );

  assert.equal(PRAZO_DO_ATESTADO_EM_SEGUNDOS, 10 * 24 * 60 * 60);
  assert.equal(gravacao.cookie?.vencimento, agora + 864_000);
});

test('CA-6.2: o nome do cookie e `wp-postpass_` mais o hash do endereco do site', () => {
  const comEndereco = hashDoCookie('https://exemplo.test');

  assert.equal(comEndereco.length, 32);
  assert.equal(
    nomeDoCookieDoAtestado(comEndereco),
    `${PREFIXO_DO_COOKIE_DO_ATESTADO}${comEndereco}`,
  );
  // `default-constants.php:254`: sem `siteurl`, `COOKIEHASH` e texto vazio.
  assert.equal(hashDoCookie(''), '');
  assert.equal(
    nomeDoCookieDoAtestado(''),
    PREFIXO_DO_COOKIE_DO_ATESTADO,
  );
});

test('CA-6.2: a marca de cifrado sai do esquema do destino, e so dele', () => {
  const agora = 0;
  const { contexto } = visitante();

  const comTls = gravarAtestadoDeSenha(
    { senhaInformada: SENHA, destino: 'https://exemplo.test/x/' },
    { contexto, agora },
  );
  const semTls = gravarAtestadoDeSenha(
    { senhaInformada: SENHA, destino: 'http://exemplo.test/x/' },
    { contexto, agora },
  );
  const semEsquema = gravarAtestadoDeSenha(
    { senhaInformada: SENHA, destino: '/x/' },
    { contexto, agora },
  );
  const semDestino = gravarAtestadoDeSenha(
    { senhaInformada: SENHA },
    { contexto, agora },
  );

  assert.equal(comTls.cookie?.somenteCifrado, true);
  assert.equal(semTls.cookie?.somenteCifrado, false);
  // ⚠️ Destino relativo grava o atestado **sem** a marca de cifrado: e o
  // rebaixamento que a resposta 12 manda preservar.
  assert.equal(semEsquema.cookie?.somenteCifrado, false);
  assert.equal(semDestino.cookie?.somenteCifrado, false);
  assert.equal(semDestino.destino, '');
  assert.equal(esquemaDoDestino('HTTPS://exemplo.test'), 'https');
  assert.equal(esquemaDoDestino('/x/'), '');
});

test('CA-6.2: campo de senha ausente ou nao textual redireciona SEM gravar cookie', () => {
  const { contexto } = visitante();

  const ausente = gravarAtestadoDeSenha(
    { destino: ENDERECO },
    { contexto, agora: 0 },
  );
  const naoTextual = gravarAtestadoDeSenha(
    { senhaInformada: { textual: false }, destino: ENDERECO },
    { contexto, agora: 0 },
  );

  assert.equal(ausente.cookie, undefined);
  assert.equal(ausente.destino, ENDERECO);
  assert.equal(naoTextual.cookie, undefined);
  assert.equal(naoTextual.destino, ENDERECO);
});

test('CA-6.2: o campo `redirect_to` vence o remetente, e o vazio dele tambem vence', () => {
  const { contexto } = visitante();

  const comCampo = gravarAtestadoDeSenha(
    { senhaInformada: SENHA, destino: ENDERECO, remetente: 'https://outro/' },
    { contexto, agora: 0 },
  );
  const semCampo = gravarAtestadoDeSenha(
    { senhaInformada: SENHA, remetente: 'https://outro/' },
    { contexto, agora: 0 },
  );
  // ⚠️ `$_POST['redirect_to'] ?? wp_get_referer()`: o `??` so cai no remetente
  // quando o campo esta **ausente**; campo presente e vazio continua vencendo.
  const campoVazio = gravarAtestadoDeSenha(
    { senhaInformada: SENHA, destino: '', remetente: 'https://outro/' },
    { contexto, agora: 0 },
  );

  assert.equal(comCampo.destino, ENDERECO);
  assert.equal(semCampo.destino, 'https://outro/');
  assert.equal(campoVazio.destino, '');
});

// ---------------------------------------------------------------------------
// CA-6.3 — senha errada devolve o formulario e mantem o corpo oculto
// ---------------------------------------------------------------------------

test('CA-6.3: a senha errada grava atestado, e o corpo continua oculto', () => {
  const { contexto } = visitante();

  const gravacao = gravarAtestadoDeSenha(
    { senhaInformada: 'chute', destino: ENDERECO },
    { contexto, agora: 0 },
  );

  // 🔴 O cookie e gravado mesmo com a senha errada: `wp-login.php:789` nao
  // confere nada. E e essa presenca que o formulario le depois.
  assert.ok(gravacao.cookie !== undefined);
  assert.ok(gravacao.cookie.valor.startsWith(PREFIXO_DO_ATESTADO));

  const { contexto: comAtestadoErrado } = visitante(gravacao.cookie.valor);
  const resultado = corpoOuFormulario(protegido(), {
    contexto: comAtestadoErrado,
  });

  assert.ok(!resultado.liberado);
  assert.equal(resultado.formulario.aviso, AVISO_DE_CONTEUDO_PROTEGIDO);
});

test('CA-6.3: vindo do proprio endereco e com atestado, o formulario avisa da senha invalida', () => {
  const { contexto } = visitante(ATESTADO_ERRADO, {
    remetenteDaRequisicao: ENDERECO,
  });

  const formulario = montarFormularioDeSenha(protegido(), { contexto });

  assert.equal(formulario.mensagemDeSenhaInvalida, MENSAGEM_DE_SENHA_INVALIDA);
  assert.deepEqual(formulario.classes, [
    CLASSE_DO_FORMULARIO,
    CLASSE_DE_ERRO_DO_FORMULARIO,
  ]);
  assert.equal(formulario.classeDoAvisoDeErro, CLASSE_DO_AVISO_DE_ERRO);
  assert.equal(formulario.papelDoAvisoDeErro, 'alert');
  assert.equal(
    formulario.idDoErro,
    `${PREFIXO_DO_ID_DO_ERRO}${PREFIXO_DO_ID_DO_CAMPO}42`,
  );
});

test('CA-6.3: sem remetente igual ao endereco, nao ha aviso de senha invalida', () => {
  const { contexto } = visitante(ATESTADO_ERRADO, {
    remetenteDaRequisicao: 'https://buscador.test/',
  });

  const formulario = montarFormularioDeSenha(protegido(), { contexto });

  assert.equal(formulario.mensagemDeSenhaInvalida, '');
  assert.equal(formulario.idDoErro, undefined);
  assert.deepEqual(formulario.classes, [CLASSE_DO_FORMULARIO]);
});

test('CA-6.3: a deteccao olha a PRESENCA do cookie, nunca o conteudo dele', () => {
  // 🔴 Um visitante que acertou a senha de **outro** conteudo, e chega neste por
  // um link do proprio conteudo, ve "Invalid password." sem ter digitado nada:
  // `post-template.php:1789` testa `isset( $_COOKIE[...] )`, e mais nada.
  const { contexto } = visitante(hashFixo().gerar('senha-de-outro-conteudo'), {
    remetenteDaRequisicao: ENDERECO,
  });

  const formulario = montarFormularioDeSenha(protegido(), { contexto });

  assert.equal(formulario.mensagemDeSenhaInvalida, MENSAGEM_DE_SENHA_INVALIDA);
});

test('CA-6.3 / P6: nao ha contador de tentativa — a decima tentativa errada responde como a primeira', () => {
  const { contexto } = visitante();

  for (let tentativa = 1; tentativa <= 10; tentativa += 1) {
    const gravacao = gravarAtestadoDeSenha(
      { senhaInformada: `chute-${tentativa}`, destino: ENDERECO },
      { contexto, agora: tentativa },
    );
    assert.ok(gravacao.cookie !== undefined);
    assert.equal(gravacao.cookie.vencimento, tentativa + 864_000);
    const { contexto: depois } = visitante(gravacao.cookie.valor);
    assert.equal(senhaDoConteudoExigida(protegido(), { contexto: depois }), true);
  }

  // E a senha certa na decima primeira continua valendo.
  const certa = gravarAtestadoDeSenha(
    { senhaInformada: SENHA, destino: ENDERECO },
    { contexto, agora: 11 },
  );
  const { contexto: liberado } = visitante(certa.cookie?.valor ?? '');
  assert.equal(senhaDoConteudoExigida(protegido(), { contexto: liberado }), false);
});

test('CA-6.3: atestado em formato que nao e o do legado e recusado sem conferencia', () => {
  const conferencias: string[] = [];
  const hash: HashDoAtestado = {
    gerar: () => '',
    conferir: (senha) => {
      conferencias.push(senha);
      return true;
    },
  };

  const exigida = senhaDoConteudoExigida(protegido(), {
    contexto: { atestado: '$2y$10$qualquercoisa', hashDoAtestado: hash },
  });

  // `post-template.php:899-900`: sem o prefixo `$P$B`, nem se tenta conferir.
  assert.equal(exigida, true);
  assert.deepEqual(conferencias, []);
});

// ---------------------------------------------------------------------------
// CA-6.4 — quem pode editar ve o corpo sem informar a senha
// ---------------------------------------------------------------------------

test('CA-6.4: em contexto de edicao, quem pode editar libera o corpo sem atestado', () => {
  const perguntas: number[] = [];
  const contexto: ContextoDaSenhaDeConteudo = {
    hashDoAtestado: hashFixo(),
    podeEditarConteudo: (id) => {
      perguntas.push(id);
      return true;
    },
  };
  const conteudo = protegido();

  // `can_access_password_content()` decide instalar o interceptador...
  const libera = acessoAoCorpoProtegidoNoPedido(
    conteudo,
    { contexto: 'edit' },
    contexto,
  );
  assert.equal(libera, true);
  assert.deepEqual(perguntas, [conteudo.id]);

  // ...e com ele instalado, o portao deixa de exigir senha, sem cookie nenhum.
  const resultado = corpoOuFormulario(conteudo, {
    contexto,
    filtrosDoPortao: [
      filtroDeSenhaDoPedidoRest({
        contexto,
        aprovados: new Set([conteudo.id]),
      }),
    ],
  });

  assert.ok(resultado.liberado);
  assert.equal(resultado.corpo, 'o corpo secreto');
});

test('CA-6.4: fora do contexto de edicao, a capacidade nao abre nada', () => {
  const contexto: ContextoDaSenhaDeConteudo = {
    hashDoAtestado: hashFixo(),
    podeEditarConteudo: () => true,
  };

  assert.equal(
    acessoAoCorpoProtegidoNoPedido(protegido(), { contexto: 'view' }, contexto),
    false,
  );
  // Sem o interceptador instalado, o portao continua exigindo senha — e e esta
  // a assimetria observavel do legado: na pagina publica o editor ve o
  // formulario.
  assert.equal(senhaDoConteudoExigida(protegido(), { contexto }), true);
});

test('CA-6.4: a senha informada no proprio pedido libera o corpo, por comparacao literal', () => {
  const contexto: ContextoDaSenhaDeConteudo = { hashDoAtestado: hashFixo() };

  assert.equal(
    acessoAoCorpoProtegidoNoPedido(
      protegido(),
      { contexto: 'view', senhaInformada: SENHA },
      contexto,
    ),
    true,
  );
  assert.equal(
    acessoAoCorpoProtegidoNoPedido(
      protegido(),
      { contexto: 'view', senhaInformada: 'chute' },
      contexto,
    ),
    false,
  );
  // `:647-649` — `empty()`, logo a senha informada `'0'` nem e conferida.
  assert.equal(
    acessoAoCorpoProtegidoNoPedido(
      protegido({ senha: '0' }),
      { contexto: 'view', senhaInformada: '0' },
      contexto,
    ),
    false,
  );
});

test('CA-6.4: o interceptador respeita o que ja estava liberado, e nao fecha nada', () => {
  const contexto: ContextoDaSenhaDeConteudo = {
    podeEditarConteudo: () => false,
  };
  const filtro = filtroDeSenhaDoPedidoRest({ contexto });

  // `:189-191` — o filtro nunca transforma "nao exige" em "exige".
  assert.equal(filtro(false, protegido()), false);
  assert.equal(filtro(true, protegido()), true);
});

// ---------------------------------------------------------------------------
// CA-6.5 — comentar sem a senha e recusado com motivo proprio
// ---------------------------------------------------------------------------

test('CA-6.5: sem atestado, o comentario e recusado com o motivo proprio', () => {
  const avisados: number[] = [];
  const { contexto } = visitante();

  const recusa = recusaDeComentarioEmConteudoProtegido(protegido(), {
    contexto,
    aoRecusar: [(id) => avisados.push(id)],
  });

  assert.deepEqual(recusa, {
    codigo: MOTIVO_DE_COMENTARIO_EM_CONTEUDO_PROTEGIDO,
  });
  assert.equal(MOTIVO_DE_COMENTARIO_EM_CONTEUDO_PROTEGIDO, 'comment_on_password_protected');
  // 🔴 Um campo so: `comment.php:4064` nao passa mensagem nem codigo HTTP, e as
  // recusas vizinhas passam.
  assert.deepEqual(Object.keys(recusa ?? {}), ['codigo']);
  assert.deepEqual(avisados, [42]);
});

test('CA-6.5: com o atestado certo, o comentario segue a cadeia', () => {
  const avisados: number[] = [];
  const { contexto } = visitante(ATESTADO_CERTO);

  const recusa = recusaDeComentarioEmConteudoProtegido(protegido(), {
    contexto,
    aoRecusar: [(id) => avisados.push(id)],
  });

  assert.equal(recusa, undefined);
  assert.deepEqual(avisados, []);
});

test('CA-6.5: a recusa do comentario nao pergunta capacidade nenhuma', () => {
  const { contexto, capacidadesPerguntadas } = visitante();

  recusaDeComentarioEmConteudoProtegido(protegido(), { contexto });

  assert.deepEqual(capacidadesPerguntadas, []);
});

// ---------------------------------------------------------------------------
// CA-6.6 — a protecao e do corpo, nao da existencia
// ---------------------------------------------------------------------------

test('CA-6.6: o conteudo protegido sai na consulta publica como qualquer outro', () => {
  const pedidos: { criterios: CriteriosDaConsulta; tipos: TiposDeConsulta }[] =
    [];
  const linha: ConteudoConsultado = {
    id: 42,
    identificadorNaUrl: 'protegido',
    tipo: 'post',
    corpo: 'o corpo secreto',
    data: '2026-10-11 09:00:00',
    senha: SENHA,
  };

  const consulta = consultarConteudo(
    { p: '42' },
    {
      contexto: {
        repositorio: (criterios, tipos) => {
          pedidos.push({ criterios, tipos });
          return { conteudos: [linha] };
        },
      },
    },
  );

  assert.equal(consulta.contagem, 1);
  assert.deepEqual(consulta.conteudos, [linha]);
  assert.equal(consulta.conteudo?.senha, SENHA);
  // E nenhum criterio de senha foi acrescentado ao que o repositorio recebeu:
  // `has_password` e `post_password` so existem quando alguem os informa
  // (`class-wp-query.php:2594-2600`), e nenhum dos dois vem da rede.
  const criterios = pedidos[0]?.criterios ?? {};
  assert.equal('post_password' in criterios, false);
  assert.equal('has_password' in criterios, false);

  // E a linha que a consulta devolveu alimenta o portao sem conversao nenhuma:
  // e a costura entre US-1 e US-6, e e por ela que o corpo daquele registro sai
  // ou nao.
  const daConsulta = consulta.conteudo;
  assert.ok(daConsulta !== undefined);
  assert.ok(!corpoOuFormulario(daConsulta, { contexto: visitante().contexto }).liberado);
  assert.ok(
    corpoOuFormulario(daConsulta, {
      contexto: visitante(ATESTADO_CERTO).contexto,
    }).liberado,
  );
});

test('CA-6.6: quem informou a senha continua vendo o item marcado como protegido', () => {
  const { contexto } = visitante(ATESTADO_CERTO);
  const conteudo = protegido();

  // O corpo sai...
  assert.ok(corpoOuFormulario(conteudo, { contexto }).liberado);
  // ...e o titulo e a classe continuam dizendo que o conteudo tem senha, porque
  // nenhum dos dois pergunta ao portao (`post-template.php:125` e `:536`).
  assert.equal(
    tituloComPrefixoDeProtecao(conteudo, { contexto }),
    'Protected: Conteudo protegido',
  );
  const classes = classesDaSenhaNoConteudo(conteudo, { contexto });
  assert.deepEqual(classes.classes, [CLASSE_DE_SENHA_INFORMADA]);
  assert.equal(classes.imagemDestacadaPermitida, true);
});

test('CA-6.6: no painel o titulo nao ganha prefixo, e isso nao depende do portao', () => {
  const { contexto } = visitante(undefined, { noPainel: true });

  assert.equal(
    tituloComPrefixoDeProtecao(protegido(), { contexto }),
    'Conteudo protegido',
  );
});

// ---------------------------------------------------------------------------
// Os quatro pontos de extensao (P2)
// ---------------------------------------------------------------------------

test('P2: `post_password_required` dispara nos TRES caminhos e altera o resultado', () => {
  const vistos: boolean[] = [];
  const filtros = [
    (exigida: boolean) => {
      vistos.push(exigida);
      return !exigida;
    },
  ];

  // Caminho 1: sem senha (`:887`).
  assert.equal(
    senhaDoConteudoExigida(protegido({ senha: '' }), { filtros }),
    true,
  );
  // Caminho 2: sem cookie (`:892`).
  assert.equal(senhaDoConteudoExigida(protegido(), { filtros }), false);
  // Caminho 3: com cookie, depois da conferencia (`:914`).
  assert.equal(
    senhaDoConteudoExigida(protegido(), {
      contexto: visitante(ATESTADO_CERTO).contexto,
      filtros,
    }),
    true,
  );

  assert.deepEqual(vistos, [false, true, false]);
});

test('P2: `post_password_expires` troca o prazo, e o zero o transforma em cookie de sessao', () => {
  const { contexto } = visitante();

  const sessao = gravarAtestadoDeSenha(
    { senhaInformada: SENHA, destino: ENDERECO },
    { contexto, agora: 100, filtrosDoPrazo: [() => 0] },
  );
  const vistos: number[] = [];
  const dobrado = gravarAtestadoDeSenha(
    { senhaInformada: SENHA, destino: ENDERECO },
    {
      contexto,
      agora: 100,
      filtrosDoPrazo: [
        (vencimento) => {
          vistos.push(vencimento);
          return vencimento + 1;
        },
      ],
    },
  );

  assert.equal(sessao.cookie?.vencimento, 0);
  // O filtro recebe o vencimento JA somado (`wp-login.php:781`).
  assert.deepEqual(vistos, [100 + PRAZO_DO_ATESTADO_EM_SEGUNDOS]);
  assert.equal(dobrado.cookie?.vencimento, 100 + PRAZO_DO_ATESTADO_EM_SEGUNDOS + 1);
});

test('P2: `the_password_form_incorrect_password` troca a mensagem, e so quando ha erro', () => {
  const chamadas: string[] = [];
  const filtrosDaMensagem = [
    (mensagem: string) => {
      chamadas.push(mensagem);
      return 'Senha invalida, tente de novo.';
    },
  ];

  const comErro = montarFormularioDeSenha(protegido(), {
    contexto: visitante(ATESTADO_ERRADO, { remetenteDaRequisicao: ENDERECO })
      .contexto,
    filtrosDaMensagem,
  });
  const semErro = montarFormularioDeSenha(protegido(), {
    contexto: visitante().contexto,
    filtrosDaMensagem,
  });

  assert.equal(comErro.mensagemDeSenhaInvalida, 'Senha invalida, tente de novo.');
  assert.equal(semErro.mensagemDeSenhaInvalida, '');
  assert.deepEqual(chamadas, [MENSAGEM_DE_SENHA_INVALIDA]);
});

test('P2: o tema de blocos acrescenta a classe do botao e enfileira o estilo', () => {
  const enfileirados: string[] = [];
  const { contexto } = visitante(undefined, {
    temaDeBlocos: true,
    estiloRegistrado: (apelido) => apelido === ESTILO_DO_BOTAO_DE_BLOCO,
    enfileirarEstilo: (apelido) => enfileirados.push(apelido),
  });

  const comBlocos = montarFormularioDeSenha(protegido(), { contexto });
  const classico = montarFormularioDeSenha(protegido(), {
    contexto: visitante(undefined, { temaDeBlocos: false }).contexto,
  });

  assert.ok(comBlocos.classesDoBotao.includes(CLASSE_DO_BOTAO_DE_BLOCO));
  assert.deepEqual(enfileirados, [ESTILO_DO_BOTAO_DE_BLOCO]);
  assert.deepEqual(classico.classesDoBotao, []);
  assert.equal(classico.envoltorioDoBotao, undefined);
});

// ---------------------------------------------------------------------------
// Os quirks do legado que um porte "limpo" apaga em silencio
// ---------------------------------------------------------------------------

test('quirk: a senha literal `0` nao protege nada, porque o portao usa `empty()`', () => {
  const { contexto } = visitante();

  assert.equal(senhaDoConteudoExigida(protegido({ senha: '0' }), { contexto }), false);
  assert.ok(corpoOuFormulario(protegido({ senha: '0' }), { contexto }).liberado);
  // E o titulo tambem nao ganha prefixo, pela mesma razao (`:125`).
  assert.equal(
    tituloComPrefixoDeProtecao(protegido({ senha: '0' }), { contexto }),
    'Conteudo protegido',
  );
});

test('quirk: a leitura do atestado nao recebe relogio nenhum', () => {
  // A resposta 8 manda preservar "sem verificacao de idade no servidor", e a
  // forma de afirmar isso e esta: o portao e funcao de (conteudo, contexto), e o
  // contexto nao tem instante nenhum. Um atestado gravado para vencer no passado
  // continua valendo no servidor.
  const vencidoHaMuito = gravarAtestadoDeSenha(
    { senhaInformada: SENHA, destino: ENDERECO },
    { contexto: visitante().contexto, agora: -1_000_000_000 },
  );

  assert.ok((vencidoHaMuito.cookie?.vencimento ?? 0) < 0);
  assert.equal(
    senhaDoConteudoExigida(protegido(), {
      contexto: visitante(vencidoHaMuito.cookie?.valor ?? '').contexto,
    }),
    false,
  );
  // E o contexto resolvido nao tem campo de tempo nenhum: nao ha onde um
  // relogio entrar sem mudar o contrato.
  assert.deepEqual(
    Object.keys(contextoDeSenhaResolvido()).filter((campo) =>
      /agora|relogio|instante|tempo|prazo|idade/i.test(campo),
    ),
    [],
  );
});

test('quirk: o atestado nao carrega identificador, e serve todo conteudo com a mesma senha', () => {
  const { contexto } = visitante(ATESTADO_CERTO);

  assert.equal(
    senhaDoConteudoExigida({ id: 42, senha: SENHA }, { contexto }),
    false,
  );
  assert.equal(
    senhaDoConteudoExigida({ id: 777, senha: SENHA }, { contexto }),
    false,
  );
  assert.equal(
    senhaDoConteudoExigida({ id: 777, senha: 'outra' }, { contexto }),
    true,
  );
});

test('quirk: sem identificador, o formulario perde o campo de retorno e sorteia o id', () => {
  const { contexto } = visitante(undefined, { numeroAleatorio: () => 123456 });

  const formulario = montarFormularioDeSenha(
    { id: 0, senha: SENHA },
    { contexto },
  );

  assert.equal(formulario.retorno, undefined);
  assert.equal(formulario.idDoCampo, `${PREFIXO_DO_ID_DO_CAMPO}123456`);
  assert.deepEqual(
    formulario.campos.map((campo) => campo.nome),
    [CAMPO_DA_SENHA, CAMPO_DE_ENVIO],
  );
  assert.equal(formulario.mensagemDeSenhaInvalida, '');
});

// ---------------------------------------------------------------------------
// O hash do atestado
// ---------------------------------------------------------------------------

/**
 * Vetores do formato portavel, com a semeadura fixa de 6 bytes `01..06`.
 *
 * Transcritos do algoritmo de `class-phpass.php:131-166` — ver o aviso do
 * cabecalho deste arquivo sobre o que eles provam e o que nao provam.
 */
const VETORES_DO_HASH: readonly [string, string][] = [
  ['senha-do-conteudo', '$P$B/6k.2IU/Wd/tCzZoO7QfpBV4DRCDm.'],
  ['', '$P$B/6k.2IU/DfDOIF8wsy2MXyD9pDWQT0'],
  ['a'.repeat(100), '$P$B/6k.2IU/9syc09vMPuXm4qDSGWAit.'],
  ['a\u00e7\u00e3o', '$P$B/6k.2IU/M4MpbB.7tT7huRL/z8OTb/'],
];

test('hash: a semeadura do atestado e `$P$B`, de 12 caracteres', () => {
  const semeadura = semeaduraDoPhpass(BYTES_FIXOS);

  // `min( 8 + 5, 30 ) = 13`, e `ALFABETO_DO_PHPASS[13]` e `B` — que e o prefixo
  // literal que `post-template.php:899` exige.
  assert.equal(semeadura, '$P$B/6k.2IU/');
  assert.equal(semeadura.length, 12);
  assert.ok(semeadura.startsWith(PREFIXO_DO_ATESTADO));
});

test('hash: os vetores transcritos do formato portavel', () => {
  const semeadura = semeaduraDoPhpass(BYTES_FIXOS);

  for (const [senha, esperado] of VETORES_DO_HASH) {
    assert.equal(cifrarComoPhpass(senha, semeadura), esperado);
    assert.equal(esperado.length, COMPRIMENTO_DO_HASH_PORTAVEL);
  }
});

test('hash: as quatro recusas de `crypt_private`', () => {
  assert.equal(cifrarComoPhpass('x', '$2y$10$abcdefgh'), '*0');
  // Expoente que nao esta no alfabeto, e expoente abaixo de 7.
  assert.equal(cifrarComoPhpass('x', '$P$!/6k.2IU/'), '*0');
  assert.equal(cifrarComoPhpass('x', '$P$4/6k.2IU/'), '*0');
  // Semeadura curta.
  assert.equal(cifrarComoPhpass('x', '$P$B/6k'), '*0');
  // ⚠️ E a recusa muda de `*0` para `*1` quando a propria semeadura era `*0`.
  assert.equal(cifrarComoPhpass('x', '*0qualquercoisa'), '*1');
  // `$H$` do phpBB3 e aceito pelo mesmo caminho (`:137-138`).
  assert.equal(
    cifrarComoPhpass('senha-do-conteudo', '$H$B/6k.2IU/').slice(0, 4),
    '$H$B',
  );
});

test('hash / P6: o teto de 4096 BYTES e do legado, e acima dele nao se confere', () => {
  const hash = hashFixo();
  const noLimite = 'a'.repeat(COMPRIMENTO_MAXIMO_DA_SENHA);
  const umAcima = 'a'.repeat(COMPRIMENTO_MAXIMO_DA_SENHA + 1);

  assert.equal(hash.gerar(noLimite).length, COMPRIMENTO_DO_HASH_PORTAVEL);
  assert.equal(hash.gerar(umAcima), HASH_AUSENTE);
  assert.equal(hash.conferir(umAcima, hash.gerar(noLimite)), false);
  // ⚠️ `strlen()` conta bytes: 2.048 caracteres de dois bytes passam do teto.
  assert.equal(hash.gerar('\u00e7'.repeat(2049)), HASH_AUSENTE);

  // E o `'*'` gravado no cookie nao comeca em `$P$B`, logo o corpo fica oculto.
  const gravacao = gravarAtestadoDeSenha(
    { senhaInformada: umAcima, destino: ENDERECO },
    { contexto: visitante().contexto, agora: 0 },
  );
  assert.equal(gravacao.cookie?.valor, HASH_AUSENTE);
  assert.equal(
    senhaDoConteudoExigida(protegido({ senha: umAcima }), {
      contexto: visitante(HASH_AUSENTE).contexto,
    }),
    true,
  );
});

// ---------------------------------------------------------------------------
// EXT-CONTEXTO: dois visitantes concorrentes
// ---------------------------------------------------------------------------

test('EXT-CONTEXTO: o atestado de um visitante nao libera o corpo para o outro', () => {
  const comSenha = visitante(ATESTADO_CERTO).contexto;
  const semSenha = visitante().contexto;
  const conteudo = protegido();

  const primeiro = corpoOuFormulario(conteudo, { contexto: comSenha });
  const segundo = corpoOuFormulario(conteudo, { contexto: semSenha });
  // E a ordem inversa da o mesmo, que e o que um estado de modulo quebraria.
  const terceiro = corpoOuFormulario(conteudo, { contexto: comSenha });

  assert.ok(primeiro.liberado);
  assert.ok(!segundo.liberado);
  assert.ok(terceiro.liberado);
});

test('EXT-CONTEXTO: criar o modulo nao resolve atestado nenhum, e as operacoes nao guardam estado', () => {
  const modulo = criarModuloDeLeituraPublica(portasDeTeste());

  assert.equal(
    modulo.senhaDoConteudoExigida(protegido(), {
      contexto: visitante(ATESTADO_CERTO).contexto,
    }),
    false,
  );
  assert.equal(
    modulo.senhaDoConteudoExigida(protegido(), {
      contexto: visitante().contexto,
    }),
    true,
  );
  assert.equal(
    modulo.recusarComentarioEmConteudoProtegido(protegido(), {
      contexto: visitante(ATESTADO_CERTO).contexto,
    }),
    undefined,
  );
  assert.ok(
    modulo.liberarCorpoProtegido(protegido(), {
      contexto: visitante(ATESTADO_CERTO).contexto,
    }).liberado,
  );
  assert.ok(
    modulo.gravarAtestadoDeSenha(
      { senhaInformada: SENHA, destino: ENDERECO },
      { contexto: visitante().contexto, agora: 7 },
    ).cookie !== undefined,
  );
});
