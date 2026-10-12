/**
 * As consultas ao catalogo de enderecos externos.
 *
 * Tarefa **T002** da feature `014-integracao-externa`. A entrega termina em
 * *"de modo que a pergunta 'quantos canais nascem sem cifra' tenha resposta por
 * consulta e nao por varredura de codigo"*, e e este arquivo que faz da
 * pergunta uma funcao. `satisfaz: — (infraestrutura)`.
 *
 * ## O que estas funcoes sao, e o que elas NAO sao
 *
 * Sao **leitura**: recebem o catalogo por argumento e devolvem lista ou
 * contagem. Nenhuma delas recusa, reprova ou lanca.
 *
 * 🔴 **Nenhuma delas e a verificacao automatizada de CA-1.2, CA-2.4, CA-4.4 nem
 * CA-5.5**, e isso e deliberado. Aqueles quatro criterios pedem verificacao que
 * **falha** — e o primeiro deles esta no centro do conflito entre REQ-149 e a
 * resposta 12, que a tabela *Nao negociavel* da constituicao poe fora do que um
 * agente decide. Uma funcao que devolvesse `boolean` de aprovacao aqui teria
 * decidido o conflito pelo lado que o `tsc` aceitasse primeiro. O que T002
 * entrega e o **dado** e a **contagem**; a reprovacao e de quem tiver a decisao
 * humana na mao (T003, T005, T009 e T011).
 *
 * O catalogo entra por argumento, e nao por `import` dentro de cada funcao, pela
 * mesma razao que as portas entram por argumento no modulo: `EXT-CONTEXTO`
 * (BR-MIGRAR-105) poe o estado no escopo da requisicao, e o cenario
 * `@concorrencia` de `PT-017` exige que *"o estado de rebaixamento de canal de um
 * nao afete o do outro"*. Consulta que resolve a propria fonte nao e
 * substituivel, e `BR-MIGRAR-103` (`EXT-SUBST`) cobra substituivel.
 */

import type {
  CifraDeNascimento,
  EnderecoExterno,
  FonteDoEndereco,
  ServicoExterno,
  VerificacaoDeCertificado,
} from './endereco-externo.js';

/**
 * **A resposta da pergunta da entrega:** os enderecos que nascem sem cifra.
 *
 * Com o catalogo inteiro, devolve os 21 — os 13 do servico de infraestrutura, a
 * sondagem de DNS curinga, a caixa postal, o sistema de arquivos remoto em FTP
 * puro e os 5 da extensao empacotada. Com
 * {@link enderecosDoServico}(catalogo, 'api-wordpress-org') antes, devolve os
 * **13** que a regra de negocio de US-1 declara. Os dois recortes estao
 * afirmados, nome por nome, na suite desta tarefa: a pergunta tem mais de uma
 * resposta legitima, e o que nao pode haver e resposta sem recorte declarado.
 */
export function canaisQueNascemSemCifra(
  catalogo: readonly EnderecoExterno[],
): readonly EnderecoExterno[] {
  return catalogo.filter(
    (endereco) => endereco.cifraDeNascimento === 'sem-cifra',
  );
}

/**
 * Os canais que **repetem a requisicao em claro** quando a cifrada falha.
 *
 * E a outra metade de `ESC-HTTP` (BR-MIGRAR-115): *"7 repetem a requisicao em
 * claro"*. Com o catalogo inteiro sao 11, porque os 4 enderecos do servico de
 * reputacao que atravessam a funcao de envio da extensao tambem repetem; com o
 * recorte do nucleo ({@link enderecosDaFonte}) sao os 7.
 *
 * O cenario `@divida-herdada` de `PT-017` compara exatamente *"o conjunto de
 * canais que repete"* entre as duas metades, e e esta funcao que produz o
 * conjunto de um dos lados.
 */
export function canaisQueRepetemEmClaro(
  catalogo: readonly EnderecoExterno[],
): readonly EnderecoExterno[] {
  return catalogo.filter((endereco) => endereco.repeteEmClaroNaFalha);
}

/**
 * Os canais que o legado promove a cifrado quando o ambiente suporta.
 *
 * E o conjunto de que CA-1.3 fala sem nomear: a promocao e condicional, logo
 * *"quando o ambiente nao suporta"* significa **canal em claro**, e nao erro.
 */
export function canaisPromovidosPeloAmbiente(
  catalogo: readonly EnderecoExterno[],
): readonly EnderecoExterno[] {
  return catalogo.filter((endereco) => endereco.promovidoSeOAmbienteSuportar);
}

/**
 * Os canais em que o legado nao autentica o outro lado, por verificacao
 * desligada ou por repeticao sem verificar.
 *
 * E o terceiro eixo que o catalogo torna consultavel, e sem ele uma leitura de
 * `cifraDeNascimento` sozinha diria *"cifrado"* sobre canal que nao prova com
 * quem fala.
 */
export function canaisSemAutenticacaoDoOutroLado(
  catalogo: readonly EnderecoExterno[],
): readonly EnderecoExterno[] {
  const semAutenticacao: readonly VerificacaoDeCertificado[] = [
    'desligada',
    'repete-sem-verificar',
  ];

  return catalogo.filter((endereco) =>
    semAutenticacao.includes(endereco.verificacaoDeCertificado),
  );
}

/**
 * Os pontos de chamada que usam a variante **nao validada** do cliente.
 *
 * E a lista que CA-2.4 cobra (*"lista os pontos de chamada que optaram por nao
 * validar"*), aqui sem o *"e falha se algum deles receber endereco vindo de
 * dado"* — a reprovacao e de **T005**, que tem a historia. ⚠️ A conta que
 * aquela tarefa vai querer esta a um cruzamento de distancia: endereco com
 * `validacaoDeDestino: 'nao-validada'` **e** `origemDoEndereco` fora de
 * `'literal-no-codigo'` e exatamente o achado que US-2 registra como regra —
 * *"a busca de folha de estilo remota declarada pelo tema usa a variante nao
 * validada"*.
 */
export function enderecosSemValidacaoDeDestino(
  catalogo: readonly EnderecoExterno[],
): readonly EnderecoExterno[] {
  return catalogo.filter(
    (endereco) => endereco.validacaoDeDestino === 'nao-validada',
  );
}

/** Os enderecos de um servico, pelo identificador dele. */
export function enderecosDoServico(
  catalogo: readonly EnderecoExterno[],
  servico: string,
): readonly EnderecoExterno[] {
  return catalogo.filter((endereco) => endereco.servico === servico);
}

/**
 * Os enderecos declarados pelo nucleo, ou os declarados pela extensao
 * empacotada.
 *
 * 🔴 E o recorte da **quarta pergunta em aberto** da `spec.md`, e existe para que
 * ela continue aberta: a resposta 13 poe o servico de reputacao fora do nucleo
 * clonado e *"a decisao de escopo nao esta registrada em card nenhum"*. Quem
 * precisar da contagem do nucleo filtra por `'nucleo'`; quem precisar do total
 * nao filtra. Nenhum dos dois numeros esta escondido, e nenhum dos dois esta
 * escolhido.
 */
export function enderecosDaFonte(
  catalogo: readonly EnderecoExterno[],
  fonte: FonteDoEndereco,
): readonly EnderecoExterno[] {
  return catalogo.filter((endereco) => endereco.fonte === fonte);
}

/** Quantos enderecos ha em cada esquema de nascimento. */
export type ContagemPorCifra = Readonly<Record<CifraDeNascimento, number>>;

/**
 * A contagem por esquema de nascimento, que e o resumo de uma linha do
 * catalogo inteiro.
 *
 * Devolve as quatro chaves sempre, inclusive com zero: um resumo em que a chave
 * desaparece quando a contagem e zero faz *"nenhum canal em claro"* parecer
 * *"nao perguntei"*, e e justamente essa diferenca que esta tarefa existe para
 * acabar.
 */
export function contarPorCifraDeNascimento(
  catalogo: readonly EnderecoExterno[],
): ContagemPorCifra {
  const contagem: Record<CifraDeNascimento, number> = {
    'sem-cifra': 0,
    cifrado: 0,
    'do-dado': 0,
    'sem-endereco-no-codigo': 0,
  };

  for (const endereco of catalogo) {
    contagem[endereco.cifraDeNascimento] += 1;
  }

  return contagem;
}

/** Um problema de coerencia encontrado no proprio catalogo. */
export interface ProblemaDeCatalogo {
  /** O {@link EnderecoExterno.id} em que o problema esta, ou `null`. */
  readonly endereco: string | null;
  readonly motivo: string;
}

/**
 * Confere a coerencia **interna** do catalogo.
 *
 * ⚠️ **Nao e verificacao de politica, e nao tem nada a ver com CA-1.2.** O que
 * esta funcao afirma e que o registro e um registro: identificador unico, servico
 * existente, ancora presente e campos que nao se contradizem. Nenhuma das regras
 * abaixo olha para o esquema para aprova-lo ou reprova-lo; elas olham para pares
 * de campos que **nao podem** divergir sem que alguem tenha errado a
 * transcricao:
 *
 * | regra | por que |
 * |---|---|
 * | identificador unico | duas linhas com o mesmo nome fazem a consulta mentir sem avisar |
 * | servico declarado | linha orfa some de toda consulta por servico |
 * | ao menos uma ancora | *"nao descreva comportamento de memoria"*: afirmacao sem `arquivo:linha` nao entra nesta arvore |
 * | quem repete em claro nasce sem cifra | a repeticao do legado e `if ( $ssl && is_wp_error( ... ) )` sobre o endereco em claro guardado antes: sem endereco em claro nao ha o que repetir |
 * | quem e promovido nasce sem cifra | promover o que ja nasce cifrado nao e estado possivel no legado |
 * | endereco nulo sai do eixo da cifra | os dois casos sem endereco no codigo sao o transporte de e-mail de fabrica e os conectores sem provedor, e nenhum dos dois tem esquema a classificar |
 *
 * Devolve lista vazia quando esta tudo coerente — e lista vazia e **afirmacao**,
 * como nas portas falsas desta arvore.
 */
export function conferirCatalogo(
  catalogo: readonly EnderecoExterno[],
  servicos: readonly ServicoExterno[],
): readonly ProblemaDeCatalogo[] {
  const problemas: ProblemaDeCatalogo[] = [];
  const vistos = new Set<string>();
  const declarados = new Set(servicos.map((servico) => servico.id));

  for (const endereco of catalogo) {
    if (vistos.has(endereco.id)) {
      problemas.push({
        endereco: endereco.id,
        motivo: 'identificador repetido no catalogo',
      });
    }
    vistos.add(endereco.id);

    if (!declarados.has(endereco.servico)) {
      problemas.push({
        endereco: endereco.id,
        motivo: `servico nao declarado: ${endereco.servico}`,
      });
    }

    if (endereco.ancoras.length === 0) {
      problemas.push({
        endereco: endereco.id,
        motivo: 'nenhuma ancora no legado',
      });
    }

    if (
      endereco.repeteEmClaroNaFalha &&
      endereco.cifraDeNascimento !== 'sem-cifra'
    ) {
      problemas.push({
        endereco: endereco.id,
        motivo: 'repete em claro sem nascer em claro',
      });
    }

    if (
      endereco.promovidoSeOAmbienteSuportar &&
      endereco.cifraDeNascimento !== 'sem-cifra'
    ) {
      problemas.push({
        endereco: endereco.id,
        motivo: 'promovido a cifrado sem nascer em claro',
      });
    }

    if (
      (endereco.enderecoNoLegado === null) !==
      (endereco.cifraDeNascimento === 'sem-endereco-no-codigo')
    ) {
      problemas.push({
        endereco: endereco.id,
        motivo:
          'endereco ausente e esquema de nascimento nao concordam entre si',
      });
    }
  }

  for (const servico of servicos) {
    if (!catalogo.some((endereco) => endereco.servico === servico.id)) {
      problemas.push({
        endereco: null,
        motivo: `servico declarado sem nenhum endereco: ${servico.id}`,
      });
    }
  }

  return problemas;
}
