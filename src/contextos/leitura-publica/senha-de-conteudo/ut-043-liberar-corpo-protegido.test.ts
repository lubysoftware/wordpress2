/**
 * A entrega de **T014**: *"8 testes automatizados, um por caso registrado em
 * `../../../backlog/tests.md` (UT-043-1 a UT-043-8), com o mesmo dado de entrada,
 * acao e resultado esperado. Os 2 testes de regra de negocio (UT-043-7, UT-043-8)
 * entram na mesma suite."*
 *
 * ✅ **Os oito casos foram COPIADOS do catalogo, nao reconstruidos.** A tabela de
 * `REQ-043` em `backlog/tests.md:659-666` da nome, tipo e prova de cada caso, e e
 * ela que esta transcrita abaixo, em ordem de catalogo, com o nome do caso dentro
 * do nome do teste:
 *
 * | caso | tipo | nome no catalogo | prova que o catalogo cita | CA |
 * |---|---|---|---|---|
 * | `UT-043-1` | `feliz` | substitui o corpo pelo formulario de senha mantendo o resto da pagina | *"Sem a senha, o corpo é substituído pelo formulário de senha e o resto da página continua servido"* | CA-6.1 |
 * | `UT-043-2` | `feliz` | grava o atestado e passa a servir o corpo quando a senha confere | *"Senha correta grava no navegador do visitante um atestado e o corpo passa a ser servido"* | CA-6.2 |
 * | `UT-043-3` | `erro` | mantem o corpo oculto quando a senha esta errada | *"Senha errada devolve o formulário e mantém o corpo oculto"* | CA-6.3 |
 * | `UT-043-4` | `feliz` | serve o corpo sem senha a quem pode editar o conteudo | *"Quem pode editar o conteúdo vê o corpo sem informar a senha"* | CA-6.4 |
 * | `UT-043-5` | `erro` | recusa com motivo proprio o comentario em conteudo protegido sem atestado | *"Comentar num conteúdo protegido sem ter informado a senha é recusado com motivo próprio"* | CA-6.5 |
 * | `UT-043-6` | `feliz` | mantem o conteudo protegido em sitemap e em listagem | *"O conteúdo protegido continua aparecendo em sitemap e listagem: a proteção é do corpo, não da existência"* | CA-6.6 |
 * | `UT-043-7` | `feliz` | exibe a senha em texto claro a quem edita o conteudo | *"D6 — senha de conteúdo é texto claro por desenho: é senha de acesso a conteúdo, não de conta, e precisa poder ser exibida a quem edita"* | regra de negocio |
 * | `UT-043-8` | `feliz` | libera o corpo pelo atestado sem consultar o modelo de capacidades | *"Senha de conteúdo é um dos cinco mecanismos de autorização que não consultam o modelo de capacidades"* | regra de negocio |
 *
 * ---
 *
 * # O que o catalogo NAO da, e de onde veio
 *
 * O catalogo registra nome, tipo e prova, e **nao** o dado de entrada literal
 * (`backlog/tests.md:5`). O dado daqui sai de **UC-02**
 * (`.specify/use-cases/UC-02-abrir-conteudo-protegido-por-senha.md`), que a tabela
 * de rastreabilidade de `spec.md:179` liga a US-6: o gatilho (*"o visitante envia
 * a senha no formulario que substituiu o corpo"*), as duas excecoes, o fluxo
 * alternativo de quem edita e a pos-condicao *"nada muda no armazenamento do
 * site"*, que aqui e o log da porta de dados.
 *
 * ⚠️ **As ancoras do legado neste arquivo nao foram reconferidas por T014.** O
 * oraculo (`~/Downloads/wordpress`) nao estava nesta maquina, e o daemon do
 * contêiner tambem nao: toda linha citada aqui e **copiada** de quem a conferiu em
 * T013 (`./senha-exigida.ts`, `./corpo-protegido.ts`, `./atestado-de-senha.ts` e
 * `./recusa-de-comentario.ts`) ou de T015 da feature 013
 * (`contextos/superficies-programaticas/mapa-do-site/provedores-do-nucleo.ts`).
 * Nenhuma ancora nova entrou.
 *
 * ---
 *
 * # Nao e a suite de T013, e o nivel e outro
 *
 * `./us-6-liberar-corpo-protegido.test.ts` e a suite da **entrega** de T013, e o
 * cabecalho dela ja declara a fronteira. Ela chama as funcoes soltas e afirma os
 * quirks de cada ramo (o `'0'`, o teto de 4096 bytes, os vetores do hash, os
 * pontos de extensao).
 *
 * Esta entra pelo **modulo**, e cada caso percorre o caminho inteiro de UC-02: a
 * pagina vem de `atender`, a mesma linha alimenta o portao, e o envio do
 * formulario produz o cookie que volta na requisicao seguinte. A porta de dados
 * **registra comando**, e a assercao e o log: a senha de conteudo nao escreve
 * nada no site.
 *
 * ---
 *
 * # Onde esta suite PARA
 *
 * - **UT-043-4 so acontece em contexto de edicao.** E o unico mecanismo que T013
 *   encontrou: `post_password_required()` nao tem ramo de capacidade
 *   (`post-template.php:882-915`), e CA-6.4 existe pelo interceptador que a
 *   superficie REST instala (`class-wp-rest-posts-controller.php:629-653` e
 *   `:188-205`). Na pagina publica a mesma conta recebe o formulario, e UT-043-8
 *   afirma isso. ⚠️ UC-02 diz mais do que isso — *"verifica `edit_post` do registro
 *   antes de pedir a senha"* —, e esse texto, lido ao pe da letra, nao descreve a
 *   pagina publica. A leitura de CA-6.4 esta em `README.md` deste modulo, em
 *   *"CA-6.4 nao acontece na pagina publica"*; esta suite segue o observavel (P1).
 * - **UT-043-6 afirma a consulta do mapa do site, e nao o XML.** A regra de
 *   dependencia 3 proibe este contexto importar
 *   `contextos/superficies-programaticas/`, logo os criterios abaixo sao
 *   **transcritos** de `criteriosDaPaginaDeConteudo`. O byte da pagina do mapa e
 *   CA-7.6 da feature 013, no teste daquele contexto.
 * - **UT-043-7 afirma o valor, e nao a tela.** Nenhuma superficie de edicao que
 *   mostre a senha existe nesta arvore (nem a tela de edicao nem o campo da
 *   superficie REST). O que o caso fixa e o que qualquer uma delas vai ler: a
 *   coluna chega literal a quem a consulta. ⚠️ `BR-HUMANA-009` esta **PENDENTE**:
 *   este caso reproduz o observavel, que e a opcao (a), e nao resolve a pergunta.
 *   Se um humano escolher (b) ou (c), este e o caso que muda.
 * - **A busca fica de fora de UT-043-6.** A ressalva de `class-wp-query.php:1534-1537`
 *   e clausula de SQL, logo e do repositorio (ver `../consulta/conteudo-consultado.ts`).
 *
 * ⚠️ **Nada externo entra nestes testes.** A porta de dados, o repositorio e a
 * capacidade sao duplos que **registram chamada**; o relogio e os bytes da
 * semeadura do hash chegam por argumento.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  acessoAoCorpoProtegidoNoPedido,
  AVISO_DE_CONTEUDO_PROTEGIDO,
  AVISO_DE_RESUMO_PROTEGIDO,
  CAMPO_DA_SENHA,
  CLASSE_DE_SENHA_EXIGIDA,
  CLASSE_DE_SENHA_INFORMADA,
  classesDaSenhaNoConteudo,
  criarHashDoAtestado,
  criarModuloDeLeituraPublica,
  filtroDeSenhaDoPedidoRest,
  hashDoCookie,
  MENSAGEM_DE_SENHA_INVALIDA,
  MOTIVO_DE_COMENTARIO_EM_CONTEUDO_PROTEGIDO,
  nomeDoCookieDoAtestado,
  PRAZO_DO_ATESTADO_EM_SEGUNDOS,
  PREFIXO_DO_ATESTADO,
  resumoOuAviso,
  tituloComPrefixoDeProtecao,
  type ConteudoComCorpo,
  type ConteudoConsultado,
  type ContextoDaConsulta,
  type ContextoDaSenhaDeConteudo,
  type CriteriosDaConsulta,
  type EnderecoPedido,
  type ModuloDeLeituraPublica,
  type PortasDeLeituraPublica,
} from '../index.js';

// ---------------------------------------------------------------------------
// O dado dos oito casos
// ---------------------------------------------------------------------------

/** A senha gravada no conteudo de UC-02. */
const SENHA = 'abre-te-sesamo';

/** O corpo que so sai com o atestado. */
const CORPO = 'o corpo secreto';

/** O endereco publico do conteudo protegido. */
const ENDERECO = 'https://exemplo.test/2026/10/protegido/';

/** O instante do envio do formulario, em segundos. */
const AGORA = 1_760_000_000;

/** A linha de `posts`, com os dois campos que so a pagina le. */
type LinhaDoConteudo = ConteudoConsultado & ConteudoComCorpo;

/** O conteudo publicado com `post_password` preenchido: a pre-condicao de UC-02. */
const PROTEGIDO: LinhaDoConteudo = Object.freeze({
  id: 42,
  identificadorNaUrl: 'protegido',
  tipo: 'post',
  corpo: CORPO,
  data: '2026-10-11 09:00:00',
  senha: SENHA,
  resumo: 'o resumo gravado',
  titulo: 'Conteudo protegido',
});

/** Um conteudo publicado sem senha, para a listagem ter com o que comparar. */
const ABERTO: LinhaDoConteudo = Object.freeze({
  id: 41,
  identificadorNaUrl: 'aberto',
  tipo: 'post',
  corpo: 'o corpo aberto',
  data: '2026-10-10 09:00:00',
  senha: '',
});

/** A pagina singular do conteudo protegido. */
const PAGINA_DO_PROTEGIDO: EnderecoPedido = {
  uriPedida: '/?p=42',
  parametrosDeConsulta: { p: '42' },
};

/** A home de uma instalacao nova: a listagem publica. */
const HOME: EnderecoPedido = { uriPedida: '/' };

/**
 * Os criterios da pagina de conteudo do mapa do site, transcritos de
 * `criteriosDaPaginaDeConteudo( 'post' )`, em
 * `contextos/superficies-programaticas/mapa-do-site/provedores-do-nucleo.ts:64`.
 *
 * Transcritos porque a regra de dependencia 3 proibe o `import`, e sem
 * `has_password` nem `post_password` porque o legado nao os tem. As quatro
 * bandeiras booleanas daquela funcao (`no_found_rows`, `ignore_sticky_posts` e as
 * duas de cache) ficam de fora: `ValorDaConsulta` nao carrega booleano, e nenhuma
 * delas decide que linha entra.
 */
const CRITERIOS_DA_PAGINA_DO_MAPA: CriteriosDaConsulta = {
  orderby: 'ID',
  order: 'ASC',
  post_type: 'post',
  posts_per_page: 2000,
  post_status: ['publish'],
};

// ---------------------------------------------------------------------------
// Os duplos: todos registram chamada
// ---------------------------------------------------------------------------

/**
 * A porta de dados que **registra** em vez de simular banco. Nenhum dos oito
 * casos a usa, e o log vazio e a pos-condicao *"nada muda no armazenamento do
 * site"* de UC-02 afirmada como resultado.
 */
function portaQueRegistra(comandos: string[]): PortasDeLeituraPublica {
  return {
    dados: {
      prefixoDeTabela: 'wp_',
      selecionar(consulta) {
        comandos.push(`porta.selecionar ${consulta.texto}`);
        return [];
      },
      escrever(consulta) {
        comandos.push(`porta.escrever ${consulta.texto}`);
        return { linhasAfetadas: 0, idGerado: null };
      },
    },
  };
}

/**
 * O duplo do repositorio: registra a leitura, casa por `p` e **obedece** a um
 * criterio de senha se ele chegar, como `class-wp-query.php:2594-2600` obedece.
 *
 * E isso que torna UT-043-6 uma afirmacao e nao uma tautologia: um porte que
 * acrescentasse o recorte por senha veria o conteudo protegido sumir aqui.
 */
function repositorioDe(
  tabela: readonly LinhaDoConteudo[],
  comandos: string[],
): NonNullable<ContextoDaConsulta['repositorio']> {
  return (criterios) => {
    comandos.push('repositorio.ler');
    // `parse_query` poe zero em `p` quando ninguem o pediu.
    const pedido = Number(criterios['p'] ?? 0);
    const casadas = tabela.filter(
      (linha) =>
        (pedido === 0 || pedido === linha.id) &&
        (!('has_password' in criterios || 'post_password' in criterios) ||
          linha.senha === ''),
    );
    return { conteudos: casadas, totalEncontrado: casadas.length };
  };
}

/** O hash do atestado com semeadura fixa: nada de sorteio dentro do teste. */
function hashFixo() {
  return criarHashDoAtestado({
    bytesAleatorios: () => Uint8Array.from([1, 2, 3, 4, 5, 6]),
  });
}

/**
 * O contexto de um visitante, com o atestado que ele tiver.
 *
 * `podeEditarConteudo` registra a pergunta e responde `resposta`: e com ele que
 * se afirma que o portao publico nao pergunta capacidade nenhuma.
 */
function visitante(
  atestado?: string,
  resposta = false,
): { contexto: ContextoDaSenhaDeConteudo; capacidadesPerguntadas: number[] } {
  const capacidadesPerguntadas: number[] = [];
  return {
    contexto: {
      ...(atestado === undefined ? {} : { atestado }),
      hashDoAtestado: hashFixo(),
      hashDoCookie: hashDoCookie('https://exemplo.test'),
      enderecoDoConteudo: () => ENDERECO,
      podeEditarConteudo: (id) => {
        capacidadesPerguntadas.push(id);
        return resposta;
      },
    },
    capacidadesPerguntadas,
  };
}

/** O atestado que a senha certa produz: o cookie de quem ja passou pelo formulario. */
const ATESTADO_CERTO = hashFixo().gerar(SENHA);

/** O modulo, com o log que os oito casos afirmam. */
function moduloDeTeste(): { modulo: ModuloDeLeituraPublica; comandos: string[] } {
  const comandos: string[] = [];
  return {
    modulo: criarModuloDeLeituraPublica(portaQueRegistra(comandos)),
    comandos,
  };
}

/** A visita a pagina do conteudo protegido: o que UC-01 entrega a UC-02. */
function abrirPagina(modulo: ModuloDeLeituraPublica, comandos: string[]) {
  const atendimento = modulo.atender(PAGINA_DO_PROTEGIDO, {
    contexto: { repositorio: repositorioDe([PROTEGIDO], comandos) },
  });
  const conteudo = atendimento.consulta?.conteudo;
  assert.ok(conteudo !== undefined);
  return { atendimento, conteudo };
}

// ---------------------------------------------------------------------------
// UT-043-1 · `feliz`
// ---------------------------------------------------------------------------

test('UT-043-1 substitui o corpo pelo formulario de senha mantendo o resto da pagina', () => {
  const { modulo, comandos } = moduloDeTeste();

  // Dado: conteudo publicado com senha, e um visitante sem atestado. Quando: ele
  // abre o endereco do conteudo.
  const { atendimento, conteudo } = abrirPagina(modulo, comandos);
  const { contexto } = visitante();
  const resultado = modulo.liberarCorpoProtegido(conteudo, { contexto });

  // Entao: no lugar do corpo sai o formulario (`post-template.php:319`)...
  assert.ok(!resultado.liberado);
  assert.equal(resultado.formulario.aviso, AVISO_DE_CONTEUDO_PROTEGIDO);
  assert.ok(
    resultado.formulario.campos.some((campo) => campo.nome === CAMPO_DA_SENHA),
  );
  // ...e nem o corpo nem a senha viajam dentro dele.
  const servido = JSON.stringify(resultado);
  assert.ok(!servido.includes(CORPO));
  assert.ok(!servido.includes(SENHA));

  // E o resto da pagina continua servido: a resposta e 200, e nao 404...
  assert.equal(atendimento.resposta.codigoHttp, 200);
  assert.equal(atendimento.consulta?.contagem, 1);
  // ...o titulo sai, com o prefixo (`post-template.php:125-128`)...
  assert.equal(
    tituloComPrefixoDeProtecao(PROTEGIDO, { contexto }),
    'Protected: Conteudo protegido',
  );
  // ...o resumo gravado da lugar a frase propria do legado (`:424`)...
  assert.equal(resumoOuAviso(PROTEGIDO, { contexto }), AVISO_DE_RESUMO_PROTEGIDO);
  // ...e o item e marcado como protegido (`:535`).
  assert.deepEqual(classesDaSenhaNoConteudo(PROTEGIDO, { contexto }).classes, [
    CLASSE_DE_SENHA_EXIGIDA,
  ]);

  assert.deepEqual(comandos, ['repositorio.ler']);
});

// ---------------------------------------------------------------------------
// UT-043-2 · `feliz`
// ---------------------------------------------------------------------------

test('UT-043-2 grava o atestado e passa a servir o corpo quando a senha confere', () => {
  const { modulo, comandos } = moduloDeTeste();
  const { conteudo } = abrirPagina(modulo, comandos);

  // Dado: o visitante diante do formulario. Quando: ele envia a senha certa.
  const envio = modulo.gravarAtestadoDeSenha(
    { senhaInformada: SENHA, destino: ENDERECO },
    { contexto: visitante().contexto, agora: AGORA },
  );

  // Entao: o navegador recebe o atestado, com o hash e nao com a senha, pelo
  // nome e pelo prazo do legado (`wp-login.php:781` e `:789`), e volta ao conteudo.
  assert.ok(envio.cookie !== undefined);
  assert.equal(
    envio.cookie.nome,
    nomeDoCookieDoAtestado(hashDoCookie('https://exemplo.test')),
  );
  assert.ok(envio.cookie.valor.startsWith(PREFIXO_DO_ATESTADO));
  assert.notEqual(envio.cookie.valor, SENHA);
  assert.equal(envio.cookie.vencimento, AGORA + PRAZO_DO_ATESTADO_EM_SEGUNDOS);
  assert.equal(envio.destino, ENDERECO);

  // E na requisicao seguinte, com o cookie que acabou de ser gravado, o corpo sai.
  const resultado = modulo.liberarCorpoProtegido(conteudo, {
    contexto: visitante(envio.cookie.valor).contexto,
  });
  assert.ok(resultado.liberado);
  assert.equal(resultado.corpo, CORPO);

  // Pos-condicao de UC-02: *"nada muda no armazenamento do site"*.
  assert.deepEqual(comandos, ['repositorio.ler']);
});

// ---------------------------------------------------------------------------
// UT-043-3 · `erro`
// ---------------------------------------------------------------------------

test('UT-043-3 mantem o corpo oculto quando a senha esta errada', () => {
  const { modulo, comandos } = moduloDeTeste();
  const { conteudo } = abrirPagina(modulo, comandos);

  // Dado: o visitante diante do formulario. Quando: ele envia uma senha errada.
  const envio = modulo.gravarAtestadoDeSenha(
    { senhaInformada: 'chute', destino: ENDERECO },
    { contexto: visitante().contexto, agora: AGORA },
  );

  // 🔴 O cookie e gravado do mesmo jeito: `wp-login.php:789` nao confere nada, e
  // o erro so aparece na leitura seguinte.
  assert.ok(envio.cookie !== undefined);
  assert.equal(envio.destino, ENDERECO);

  // Entao: de volta ao endereco do conteudo, o formulario retorna com o aviso
  // (`post-template.php:1789`) e o corpo continua oculto.
  const { contexto } = visitante(envio.cookie.valor);
  const resultado = modulo.liberarCorpoProtegido(conteudo, {
    contexto: { ...contexto, remetenteDaRequisicao: ENDERECO },
  });

  assert.ok(!resultado.liberado);
  assert.equal(
    resultado.formulario.mensagemDeSenhaInvalida,
    MENSAGEM_DE_SENHA_INVALIDA,
  );
  assert.ok(!JSON.stringify(resultado).includes(CORPO));
  assert.equal(resumoOuAviso(PROTEGIDO, { contexto }), AVISO_DE_RESUMO_PROTEGIDO);

  // UC-02: *"nao ha contador de tentativas nem bloqueio"*, logo nada foi gravado.
  assert.deepEqual(comandos, ['repositorio.ler']);
});

// ---------------------------------------------------------------------------
// UT-043-4 · `feliz`
// ---------------------------------------------------------------------------

test('UT-043-4 serve o corpo sem senha a quem pode editar o conteudo', () => {
  const { modulo, comandos } = moduloDeTeste();
  const { conteudo } = abrirPagina(modulo, comandos);

  // Dado: uma conta com a capacidade sobre este registro, e nenhum atestado.
  // Quando: ela pede o conteudo em contexto de edicao.
  const editora = visitante(undefined, true);
  const liberado = acessoAoCorpoProtegidoNoPedido(
    conteudo,
    { contexto: 'edit' },
    editora.contexto,
  );

  // Entao: o interceptador e instalado (`class-wp-rest-posts-controller.php:639-644`)
  // e o corpo sai, sem cookie e sem formulario.
  assert.equal(liberado, true);
  const resultado = modulo.liberarCorpoProtegido(conteudo, {
    contexto: editora.contexto,
    filtrosDoPortao: [filtroDeSenhaDoPedidoRest({ contexto: editora.contexto })],
  });
  assert.ok(resultado.liberado);
  assert.equal(resultado.corpo, CORPO);
  // A pergunta e por capacidade, sobre o registro, e nunca por papel (P3): uma
  // vez para instalar o interceptador e outra dentro dele (`:204`).
  assert.deepEqual(editora.capacidadesPerguntadas, [42, 42]);

  // A referencia: o mesmo pedido de uma conta sem a capacidade nao abre nada.
  const semCapacidade = visitante();
  assert.equal(
    acessoAoCorpoProtegidoNoPedido(
      conteudo,
      { contexto: 'edit' },
      semCapacidade.contexto,
    ),
    false,
  );
  assert.ok(
    !modulo.liberarCorpoProtegido(conteudo, { contexto: semCapacidade.contexto })
      .liberado,
  );

  assert.deepEqual(comandos, ['repositorio.ler']);
});

// ---------------------------------------------------------------------------
// UT-043-5 · `erro`
// ---------------------------------------------------------------------------

test('UT-043-5 recusa com motivo proprio o comentario em conteudo protegido sem atestado', () => {
  const { modulo, comandos } = moduloDeTeste();
  const { conteudo } = abrirPagina(modulo, comandos);
  const avisados: number[] = [];

  // Dado: um visitante sem atestado. Quando: ele tenta comentar.
  const recusa = modulo.recusarComentarioEmConteudoProtegido(conteudo, {
    contexto: visitante().contexto,
    aoRecusar: [(id) => avisados.push(id)],
  });

  // Entao: a recusa e a de `comment.php:4064`, e so ela: o codigo proprio, sem
  // mensagem e sem codigo HTTP, depois da acao de mesmo nome (`:4062`).
  assert.deepEqual(recusa, { codigo: 'comment_on_password_protected' });
  assert.equal(recusa?.codigo, MOTIVO_DE_COMENTARIO_EM_CONTEUDO_PROTEGIDO);
  assert.deepEqual(avisados, [42]);

  // A referencia: com o atestado certo nao ha recusa, e a cadeia segue.
  assert.equal(
    modulo.recusarComentarioEmConteudoProtegido(conteudo, {
      contexto: visitante(ATESTADO_CERTO).contexto,
    }),
    undefined,
  );

  assert.deepEqual(comandos, ['repositorio.ler']);
});

// ---------------------------------------------------------------------------
// UT-043-6 · `feliz`
// ---------------------------------------------------------------------------

test('UT-043-6 mantem o conteudo protegido em sitemap e em listagem', () => {
  const { modulo, comandos } = moduloDeTeste();
  const tabela = [PROTEGIDO, ABERTO];
  const repositorio = repositorioDe(tabela, comandos);

  // Dado: um conteudo com senha e outro sem. Quando: um visitante sem atestado
  // abre a listagem publica...
  const listagem = modulo.atender(HOME, { contexto: { repositorio } });
  // ...e o mapa do site pede a sua pagina de conteudo.
  const mapa = modulo.consultarConteudo(CRITERIOS_DA_PAGINA_DO_MAPA, {
    contexto: { repositorio },
  });

  // Entao: o protegido esta nas duas, com o aberto, e nada recortou por senha.
  assert.equal(listagem.resposta.codigoHttp, 200);
  assert.deepEqual(
    listagem.consulta?.conteudos.map((conteudo) => conteudo.id),
    [42, 41],
  );
  assert.deepEqual(
    mapa.conteudos.map((conteudo) => conteudo.id),
    [42, 41],
  );

  // A protecao e do corpo: o item listado continua fechado, e o aberto nao.
  const { contexto } = visitante();
  const [protegido, aberto] = listagem.consulta?.conteudos ?? [];
  assert.ok(protegido !== undefined && aberto !== undefined);
  assert.ok(!modulo.liberarCorpoProtegido(protegido, { contexto }).liberado);
  assert.ok(modulo.liberarCorpoProtegido(aberto, { contexto }).liberado);

  // E quem ja informou a senha continua vendo o item marcado como protegido
  // (`post-template.php:536-537`): a marca nao pergunta ao portao.
  assert.deepEqual(
    classesDaSenhaNoConteudo(PROTEGIDO, {
      contexto: visitante(ATESTADO_CERTO).contexto,
    }).classes,
    [CLASSE_DE_SENHA_INFORMADA],
  );

  assert.deepEqual(comandos, ['repositorio.ler', 'repositorio.ler']);
});

// ---------------------------------------------------------------------------
// UT-043-7 · `feliz` · regra de negocio D6
// ---------------------------------------------------------------------------

test('UT-043-7 exibe a senha em texto claro a quem edita o conteudo', () => {
  const { modulo, comandos } = moduloDeTeste();
  const { conteudo } = abrirPagina(modulo, comandos);

  // Dado: uma conta que pode editar o conteudo. Quando: ela o abre para edicao.
  const editora = visitante(undefined, true);
  assert.equal(
    acessoAoCorpoProtegidoNoPedido(conteudo, { contexto: 'edit' }, editora.contexto),
    true,
  );

  // Entao: o que ela le e a senha que foi distribuida, literal, e nao um hash.
  assert.equal(conteudo.senha, SENHA);
  assert.ok(!conteudo.senha.startsWith(PREFIXO_DO_ATESTADO));

  // E e o texto claro que torna a comparacao literal possivel
  // (`class-wp-rest-posts-controller.php:652`): a senha abre, e o hash dela nao.
  const semConta = visitante().contexto;
  assert.equal(
    acessoAoCorpoProtegidoNoPedido(
      conteudo,
      { contexto: 'view', senhaInformada: SENHA },
      semConta,
    ),
    true,
  );
  assert.equal(
    acessoAoCorpoProtegidoNoPedido(
      conteudo,
      { contexto: 'view', senhaInformada: ATESTADO_CERTO },
      semConta,
    ),
    false,
  );

  // A exibicao e de quem edita: ao visitante a senha nao vai em lugar nenhum.
  assert.ok(
    !JSON.stringify(
      modulo.liberarCorpoProtegido(conteudo, { contexto: semConta }),
    ).includes(SENHA),
  );

  assert.deepEqual(comandos, ['repositorio.ler']);
});

// ---------------------------------------------------------------------------
// UT-043-8 · `feliz` · regra de negocio (BR-MIGRAR-098, `PERM-12`)
// ---------------------------------------------------------------------------

test('UT-043-8 libera o corpo pelo atestado sem consultar o modelo de capacidades', () => {
  const { modulo, comandos } = moduloDeTeste();
  const { conteudo } = abrirPagina(modulo, comandos);

  // Dado: um visitante com atestado, cuja capacidade responderia nao. Quando: o
  // portao decide.
  const comAtestado = visitante(ATESTADO_CERTO, false);
  const liberado = modulo.liberarCorpoProtegido(conteudo, {
    contexto: comAtestado.contexto,
  });

  // Entao: o corpo sai, e o modelo de capacidades nao foi perguntado.
  assert.ok(liberado.liberado);
  assert.equal(liberado.corpo, CORPO);
  assert.deepEqual(comAtestado.capacidadesPerguntadas, []);

  // O inverso prova que a decisao e so do atestado: a conta cuja capacidade
  // responderia sim, sem atestado, recebe o formulario na pagina publica.
  const semAtestado = visitante(undefined, true);
  assert.ok(
    !modulo.liberarCorpoProtegido(conteudo, { contexto: semAtestado.contexto })
      .liberado,
  );
  assert.equal(
    modulo.senhaDoConteudoExigida(conteudo, { contexto: semAtestado.contexto }),
    true,
  );
  assert.deepEqual(semAtestado.capacidadesPerguntadas, []);

  assert.deepEqual(comandos, ['repositorio.ler']);
});
