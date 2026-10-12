/**
 * Testes da entrega de **T002**: *"os enderecos dos servicos externos estao num
 * registro unico e inspecionavel, com o esquema de cada um explicito, de modo
 * que a pergunta 'quantos canais nascem sem cifra' tenha resposta por consulta e
 * nao por varredura de codigo"*.
 *
 * `satisfaz: — (infraestrutura)`: **nenhum teste daqui afirma criterio de aceite
 * de historia nenhuma**, e nenhum deles e teste de paridade. Os criterios de US-1
 * sao de T003 e os casos do catalogo `backlog/tests.md` (UT-149-1 a UT-149-6) sao
 * de **T004** — e vale ler o primeiro deles antes de escrever qualquer coisa
 * aqui: *"declara todo endereco externo do catalogo com esquema cifrado"*. E o
 * lado de REQ-149 do conflito, e afirma-lo seria resolver, pelo teste, o que a
 * tabela *Nao negociavel* da constituicao poe fora do que um agente decide.
 * Esta suite afirma o **registro**, nao a politica.
 *
 * O que se afirma, e por que cada coisa:
 *
 * 1. **A forma do registro**: 19 servicos, 54 enderecos, identificador unico,
 *    ancora em toda linha, e a coerencia interna que `conferirCatalogo` cobra.
 * 2. **Os dois recortes da pergunta da entrega**, nome por nome: os **13** do
 *    servico de infraestrutura, que e o numero que a regra de negocio de US-1
 *    declara, e os **21** do catalogo inteiro, que e o numero que ninguem havia
 *    escrito. Nenhum dos dois esta escondido atras do outro.
 * 3. **Os 7 que repetem em claro**, e que todos eles nascem em claro.
 * 4. **Que o catalogo nao traz numero de politica nenhum** — nem prazo, nem
 *    limite, nem contagem de repeticao. E a mesma afirmacao que `modulo.test.ts`
 *    faz para T001, e aqui ela e literal: `P6` recusa *"numero que o legado nao
 *    tem"*, e o prazo que o legado tem e de T011.
 * 5. **Que ler o catalogo nao faz chamada nenhuma** (`EXT-ORDEM`): compor o
 *    modulo com o catalogo dentro continua nao tocando porta nenhuma.
 *
 * ⚠️ As afirmacoes abaixo conferem a **leitura estatica** das ancoras citadas no
 * dado, nao a execucao do legado: `parity_specs.md` registra que nenhum dos 985
 * testes do catalogo rodou contra o legado (*"sao especificacao, nao
 * evidencia"*), e o oraculo executavel e T001 da feature `015`.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CATALOGO_DE_ENDERECOS_EXTERNOS,
  SERVICOS_EXTERNOS,
  canaisPromovidosPeloAmbiente,
  canaisQueNascemSemCifra,
  canaisQueRepetemEmClaro,
  canaisSemAutenticacaoDoOutroLado,
  conferirCatalogo,
  contarPorCifraDeNascimento,
  enderecosDaFonte,
  enderecosDoServico,
  enderecosSemValidacaoDeDestino,
} from './index.js';
import type { EnderecoExterno } from './index.js';

/** Os identificadores de uma lista, em ordem estavel, para comparar conjunto. */
function ids(enderecos: readonly EnderecoExterno[]): readonly string[] {
  return enderecos.map((endereco) => endereco.id).sort();
}

test('o registro e unico: 19 servicos de saida e 54 enderecos', () => {
  // A aritmetica esta no cabecalho de `catalogo-de-enderecos.ts`: 50 linhas de
  // endpoint nas 19 integracoes de saida que a `spec.md` conta, menos as 4 que
  // sao superficie de ENTRADA deste sistema, mais o feixe de loopback aberto em
  // 10 e o dos feeds do painel aberto em 2.
  assert.equal(SERVICOS_EXTERNOS.length, 19);
  assert.equal(CATALOGO_DE_ENDERECOS_EXTERNOS.length, 54);
});

test('o catalogo e coerente consigo mesmo, e lista vazia e a afirmacao', () => {
  assert.deepEqual(
    conferirCatalogo(CATALOGO_DE_ENDERECOS_EXTERNOS, SERVICOS_EXTERNOS),
    [],
  );
});

test('toda linha tem identificador unico, servico declarado e ancora no legado', () => {
  const declarados = new Set(SERVICOS_EXTERNOS.map((servico) => servico.id));
  const vistos = new Set<string>();

  for (const endereco of CATALOGO_DE_ENDERECOS_EXTERNOS) {
    assert.equal(vistos.has(endereco.id), false, `id repetido: ${endereco.id}`);
    vistos.add(endereco.id);

    assert.equal(
      declarados.has(endereco.servico),
      true,
      `servico nao declarado em ${endereco.id}`,
    );

    // "Tire a linha do grep -n no oraculo e confira a ancora antes de afirmar":
    // linha sem ancora e descricao de memoria, e a revisao desta arvore recusa.
    assert.ok(
      endereco.ancoras.length > 0,
      `sem ancora no legado: ${endereco.id}`,
    );
    for (const ancora of endereco.ancoras) {
      assert.match(
        ancora,
        /^[\w./-]+\.(php|crt)(:\d+)?$/,
        `ancora fora do formato arquivo:linha em ${endereco.id}: ${ancora}`,
      );
    }
  }
});

test('os 13 canais do servico de infraestrutura que nascem sem cifra, nome por nome', () => {
  const infraestrutura = enderecosDoServico(
    CATALOGO_DE_ENDERECOS_EXTERNOS,
    'api-wordpress-org',
  );

  assert.equal(infraestrutura.length, 15);

  // O numero que a regra de negocio de US-1 declara, e que `BR-MIGRAR-115`
  // repete: *"13 canais nascem em `http://`"*. Conferido pelo literal na arvore
  // analisada: `grep -rn "http://api.wordpress.org"` devolve 14 ocorrencias, uma
  // delas docblock
  // (`class-wp-rest-pattern-directory-controller.php:13`), logo 13 em codigo.
  assert.deepEqual(ids(canaisQueNascemSemCifra(infraestrutura)), [
    'wporg-core-browse-happy',
    'wporg-core-checksums',
    'wporg-core-credits',
    'wporg-core-importers',
    'wporg-core-serve-happy',
    'wporg-core-version-check',
    'wporg-events',
    'wporg-patterns',
    'wporg-plugins-info',
    'wporg-plugins-update-check',
    'wporg-themes-info',
    'wporg-themes-update-check',
    'wporg-translations',
  ]);

  // Os dois que sobram nascem cifrados, e sao literais `https://` no legado.
  assert.deepEqual(
    ids(infraestrutura.filter((e) => e.cifraDeNascimento === 'cifrado')),
    ['wporg-raiz-conectividade', 'wporg-secret-key-salt'],
  );

  // ⚠️ A analise do legado afirma que os 13 sao "os treze primeiros endpoints"
  // da tabela dela, o que incluiria o endereco de sais e deixaria o de eventos
  // de fora. Conferido pelo literal: e o contrario. O numero bate; a frase que
  // o explica, nao.
  assert.equal(
    infraestrutura.some(
      (e) => e.id === 'wporg-events' && e.cifraDeNascimento === 'sem-cifra',
    ),
    true,
  );
  assert.equal(
    infraestrutura.some(
      (e) =>
        e.id === 'wporg-secret-key-salt' && e.cifraDeNascimento === 'cifrado',
    ),
    true,
  );
});

test('os 13 sao promovidos a cifrado quando o ambiente suporta, e so eles no nucleo', () => {
  const nucleo = enderecosDaFonte(CATALOGO_DE_ENDERECOS_EXTERNOS, 'nucleo');

  // *"... e promovidos a cifrado apenas se o ambiente suportar"*, regra de
  // negocio de US-1. No nucleo, promocao e exatamente o conjunto do servico de
  // infraestrutura: nem a sondagem de DNS curinga tem o par de linhas de
  // promocao, e por isso ela nasce e MORRE em claro.
  assert.deepEqual(
    ids(canaisPromovidosPeloAmbiente(nucleo)),
    ids(
      canaisQueNascemSemCifra(
        enderecosDoServico(CATALOGO_DE_ENDERECOS_EXTERNOS, 'api-wordpress-org'),
      ),
    ),
  );

  assert.equal(
    CATALOGO_DE_ENDERECOS_EXTERNOS.find(
      (e) => e.id === 'sondagem-de-dns-curinga',
    )?.promovidoSeOAmbienteSuportar,
    false,
  );
});

test('o catalogo inteiro tem 21 canais que nascem sem cifra, e os 8 fora dos 13 estao nomeados', () => {
  const semCifra = canaisQueNascemSemCifra(CATALOGO_DE_ENDERECOS_EXTERNOS);

  // 🔴 Este numero nao desmente o 13: o 13 conta o literal
  // `http://api.wordpress.org` do servico de infraestrutura, e e exato naquele
  // recorte. O 21 e o catalogo inteiro, que ninguem havia contado — e e a
  // diferenca que a entrega de T002 existe para tornar consultavel.
  assert.equal(semCifra.length, 21);

  assert.deepEqual(
    ids(semCifra.filter((e) => e.servico !== 'api-wordpress-org')),
    [
      // Nucleo, e nenhum deles no servico de infraestrutura:
      'arquivos-remotos-ftp',
      'caixa-postal',
      // Extensao empacotada, pela resposta 13 — ver o quarto item em aberto:
      'reputacao-comment-check',
      'reputacao-painel-e-ciclo-da-chave',
      'reputacao-submit-spam-e-ham',
      'reputacao-teste-de-conectividade',
      'reputacao-verify-key',
      'sondagem-de-dns-curinga',
    ],
  );

  // O recorte do nucleo clonado: 16, que sao os 13 mais tres. A separacao existe
  // porque a decisao de escopo do servico de reputacao nao esta registrada em
  // card nenhum, e nem omitir nem incorporar e decisao de agente.
  assert.equal(
    canaisQueNascemSemCifra(
      enderecosDaFonte(CATALOGO_DE_ENDERECOS_EXTERNOS, 'nucleo'),
    ).length,
    16,
  );
  assert.equal(
    canaisQueNascemSemCifra(
      enderecosDaFonte(CATALOGO_DE_ENDERECOS_EXTERNOS, 'extensao-empacotada'),
    ).length,
    5,
  );
});

test('a contagem por esquema de nascimento fecha com o total, e nenhuma chave desaparece', () => {
  const contagem = contarPorCifraDeNascimento(CATALOGO_DE_ENDERECOS_EXTERNOS);

  assert.deepEqual(contagem, {
    'sem-cifra': 21,
    cifrado: 13,
    'do-dado': 18,
    'sem-endereco-no-codigo': 2,
  });

  assert.equal(
    Object.values(contagem).reduce((soma, parcela) => soma + parcela, 0),
    CATALOGO_DE_ENDERECOS_EXTERNOS.length,
  );

  // Os dois sem endereco no codigo sao fato do legado, nao lacuna de
  // transcricao: o transporte de e-mail de fabrica nao tem endereco, e a URL
  // base dos conectores de modelo de linguagem e metodo abstrato sem
  // implementacao nesta arvore.
  assert.deepEqual(
    ids(
      CATALOGO_DE_ENDERECOS_EXTERNOS.filter(
        (e) => e.cifraDeNascimento === 'sem-endereco-no-codigo',
      ),
    ),
    ['email-de-saida', 'ia-provedor-sem-endereco'],
  );
});

test('os 7 canais do nucleo que repetem a requisicao em claro, nome por nome', () => {
  const nucleo = enderecosDaFonte(CATALOGO_DE_ENDERECOS_EXTERNOS, 'nucleo');

  // `ESC-HTTP` (BR-MIGRAR-115): *"7 repetem a requisicao em claro"*. A repeticao
  // e sempre uma SEGUNDA chamada escrita a mao, sob
  // `if ( $ssl && is_wp_error( ... ) )`, e o endpoint de somas de verificacao
  // esta entre elas — que e o detalhe que o descarte REQ-150 singulariza e que a
  // resposta 12 mandou manter.
  assert.deepEqual(ids(canaisQueRepetemEmClaro(nucleo)), [
    'wporg-core-checksums',
    'wporg-core-version-check',
    'wporg-plugins-info',
    'wporg-plugins-update-check',
    'wporg-themes-info',
    'wporg-themes-update-check',
    'wporg-translations',
  ]);

  // Com a extensao empacotada sao 11: os 4 enderecos do servico de reputacao que
  // atravessam a funcao de envio dela repetem pelo mesmo desenho.
  assert.equal(
    canaisQueRepetemEmClaro(CATALOGO_DE_ENDERECOS_EXTERNOS).length,
    11,
  );

  // Quem repete em claro nasce em claro. Nao e tautologia: e a invariante que
  // impede alguem marcar repeticao num canal cifrado e, com isso, descrever um
  // rebaixamento que o legado nao tem.
  for (const endereco of canaisQueRepetemEmClaro(
    CATALOGO_DE_ENDERECOS_EXTERNOS,
  )) {
    assert.equal(endereco.cifraDeNascimento, 'sem-cifra', endereco.id);
  }
});

test('o rebaixamento de verificacao de certificado tem linha propria, e e um ponto so', () => {
  // E o segundo eixo de `ESC-HTTP`, e o unico ponto da arvore em que o
  // rebaixamento nao troca o esquema: a deteccao de canal seguro tenta com
  // certificado verificado e repete sem verificar quando falha.
  assert.deepEqual(
    ids(
      CATALOGO_DE_ENDERECOS_EXTERNOS.filter(
        (e) => e.verificacaoDeCertificado === 'repete-sem-verificar',
      ),
    ),
    ['loopback-deteccao-de-https'],
  );

  // E os 6 pontos de chamada com a verificacao desligada pelo valor de fabrica
  // do filtro de verificacao local. ⚠️ A analise do legado registra 4; os dois
  // que faltam sao as duas varreduras de erro fatal, conferidas na arvore e
  // anotadas na nota de cada linha.
  assert.deepEqual(
    ids(
      CATALOGO_DE_ENDERECOS_EXTERNOS.filter(
        (e) => e.verificacaoDeCertificado === 'desligada',
      ),
    ),
    [
      'loopback-disparo-do-agendador',
      'loopback-teste-de-cache-de-pagina',
      'loopback-teste-do-agendador',
      'loopback-teste-do-diagnostico',
      'loopback-varredura-de-erro-fatal-apos-atualizacao',
      'loopback-varredura-de-erro-fatal-apos-edicao',
    ],
  );

  assert.equal(
    canaisSemAutenticacaoDoOutroLado(CATALOGO_DE_ENDERECOS_EXTERNOS).length,
    7,
  );
});

test('a lista de pontos de chamada sem validacao de destino sai por consulta', () => {
  const semValidacao = enderecosSemValidacaoDeDestino(
    CATALOGO_DE_ENDERECOS_EXTERNOS,
  );

  // CA-2.4 pede a lista; a reprovacao e de T005. O cruzamento que aquela tarefa
  // vai querer e este: endereco que **vem de dado** e passa pela variante nao
  // validada. No legado ha um, e ele e a regra de negocio que US-2 registra.
  assert.deepEqual(
    ids(
      semValidacao.filter(
        (e) =>
          e.origemDoEndereco === 'declarado-pelo-tema' ||
          e.origemDoEndereco === 'conteudo-do-site' ||
          e.origemDoEndereco === 'resposta-de-outro-servico',
      ),
    ),
    ['estilo-de-editor-remoto'],
  );

  // E o contraponto que prova que a coluna nao e decorativa: os dois enderecos
  // vindos de conteudo do site que o legado valida, e o pacote de atualizacao,
  // que tambem vem de dado e tambem e validado.
  for (const id of [
    'pingback-descoberta',
    'pingback-notificacao',
    'trackback-notificacao',
    'downloads-pacote',
    'oembed-descoberta',
  ]) {
    assert.equal(
      CATALOGO_DE_ENDERECOS_EXTERNOS.find((e) => e.id === id)
        ?.validacaoDeDestino,
      'validada',
      id,
    );
  }
});

test('o endereco semeado na instalacao e um so, e nasce cifrado nesta versao', () => {
  const semeados = CATALOGO_DE_ENDERECOS_EXTERNOS.filter(
    (e) => e.origemDoEndereco === 'padrao-de-opcao',
  );

  // A regra de negocio de US-8: *"o endereco do servico de notificacao e valor
  // padrao de uma opcao semeada na instalacao"*. ⚠️ Dois fatos conferidos em
  // `wp-admin/includes/schema.php:450` que quem fechar T017 precisa ler antes de
  // CA-8.2 (*"a lista nasce vazia, ou nasce com o valor declarado"*): a lista
  // **nao** nasce vazia, e o valor de fabrica desta versao nasce **cifrado**.
  assert.deepEqual(ids(semeados), ['notificacao-de-atualizacao']);
  assert.equal(semeados[0]?.cifraDeNascimento, 'cifrado');
  assert.equal(semeados[0]?.enderecoNoLegado, 'https://rpc.pingomatic.com/');
});

test('nenhum numero de politica nasce no catalogo', () => {
  // A mesma afirmacao que `modulo.test.ts` faz de T001, e aqui ela e literal: o
  // catalogo e de enderecos, e prazo, limite e contagem de repeticao sao de
  // T011. O P6 exige que cada numero viva *"num ponto de configuracao nomeado,
  // com o valor de fabrica do legado"*, e nenhum campo deste registro e um.
  for (const endereco of CATALOGO_DE_ENDERECOS_EXTERNOS) {
    for (const [campo, valor] of Object.entries(endereco)) {
      assert.notEqual(
        typeof valor,
        'number',
        `${endereco.id} tem numero no campo ${campo}`,
      );
    }
  }

  for (const servico of SERVICOS_EXTERNOS) {
    for (const [campo, valor] of Object.entries(servico)) {
      assert.notEqual(
        typeof valor,
        'number',
        `${servico.id} tem numero no campo ${campo}`,
      );
    }
  }
});

test('o catalogo e dado congelado, e consultar nao o altera', () => {
  assert.equal(Object.isFrozen(CATALOGO_DE_ENDERECOS_EXTERNOS), true);
  assert.equal(Object.isFrozen(SERVICOS_EXTERNOS), true);

  const antes = CATALOGO_DE_ENDERECOS_EXTERNOS.length;
  canaisQueNascemSemCifra(CATALOGO_DE_ENDERECOS_EXTERNOS);
  canaisQueRepetemEmClaro(CATALOGO_DE_ENDERECOS_EXTERNOS);
  conferirCatalogo(CATALOGO_DE_ENDERECOS_EXTERNOS, SERVICOS_EXTERNOS);

  assert.equal(CATALOGO_DE_ENDERECOS_EXTERNOS.length, antes);
});

test('as consultas recebem a fonte por argumento, logo respondem sobre um recorte qualquer', () => {
  // `BR-MIGRAR-103` (`EXT-SUBST`) cobra substituivel, e o cenario
  // `@concorrencia` de `PT-017` exige que o estado de um site nao alcance o
  // outro. Uma consulta que resolvesse a propria fonte nao atenderia nenhum dos
  // dois: aqui, um recorte arbitrario responde igual.
  const recorte = CATALOGO_DE_ENDERECOS_EXTERNOS.filter(
    (e) => e.servico === 'loopback-do-proprio-site',
  );

  assert.equal(recorte.length, 10);
  assert.deepEqual(canaisQueNascemSemCifra(recorte), []);
  assert.deepEqual(contarPorCifraDeNascimento(recorte), {
    'sem-cifra': 0,
    cifrado: 1,
    'do-dado': 9,
    'sem-endereco-no-codigo': 0,
  });

  // Com um catalogo vazio, a conferencia so reclama do servico sem endereco — e
  // nunca lanca.
  assert.equal(conferirCatalogo([], SERVICOS_EXTERNOS).length, 19);
  assert.deepEqual(conferirCatalogo([], []), []);
});
