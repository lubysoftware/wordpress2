/**
 * A forma de armazenamento da definicao de papel — `VO-Papel`.
 *
 * ADR-0001 e a `PERM-13` (BR-MIGRAR-099) dizem o que este arquivo tem de
 * sustentar: **a definicao de papel e um retrato tirado na instalacao**; depois
 * disso a opcao gravada e a verdade e o codigo deixa de ser. O aviso de
 * compatibilidade da propria regra e endereçado a um arquivo como este: *"um
 * alvo tipado tenderia a declarar os papeis como uniao fechada de tipos — e isso
 * congela o que o legado deixa mutavel. E o caso mais claro em que 'idiomatico'
 * quebra a regra."* Por isso aqui papel e `string` e capacidade e `string`:
 * nenhuma uniao fechada, nenhum `enum`, nenhuma constante que impeça uma
 * extensao de criar o papel que ela quiser em execucao.
 *
 * E por isso a capacidade e uma **lista ordenada** e nao um mapa: a ordem em que
 * as concessoes entraram e a ordem em que elas saem nos bytes da opcao, e o
 * cenario de paridade exige que o valor gravado seja identico byte a byte
 * (`07-autorizacao-por-capacidade.feature`).
 *
 * **Decisao nenhuma de autorizacao mora aqui.** A decisao de capacidade e
 * `plataforma/autorizacao/` (T015), porque e chamada 1.279 vezes em 224
 * arquivos e precisa estar abaixo de todo contexto; o **dado** do papel e
 * daqui. Este arquivo le e escreve; ele nao responde "pode".
 */

import {
  arranjo,
  arranjoPorNome,
  booleano,
  nomeDaChave,
  normalizarChaveDeTexto,
  texto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';

/** Uma concessao: o nome da capacidade e se ela esta concedida ou negada. */
export interface ConcessaoDeCapacidade {
  readonly capacidade: string;
  readonly concedida: boolean;
}

/** Um papel: o nome exibido e as capacidades, na ordem em que entraram. */
export interface Papel {
  /**
   * O nome exibido, gravado **sem traducao**.
   *
   * O legado grava `Administrator` e traduz na exibicao. Gravar traduzido
   * mudaria os bytes da opcao conforme o idioma da instalacao.
   */
  readonly nome: string;
  readonly capacidades: readonly ConcessaoDeCapacidade[];
}

export interface EntradaDeDefinicao {
  /** O identificador do papel — `administrator`, `editor`, … */
  readonly identificador: string;
  readonly papel: Papel;
}

/** A definicao inteira, na ordem em que os papeis entraram. */
export type DefinicaoDePapeis = readonly EntradaDeDefinicao[];

/** A definicao como valor do formato serializado, pronta para a coluna. */
export function definicaoParaValor(definicao: DefinicaoDePapeis): ValorPhp {
  return arranjo(
    definicao.map((entrada) => ({
      chave: normalizarChaveDeTexto(entrada.identificador),
      valor: arranjoPorNome([
        ['name', texto(entrada.papel.nome)],
        ['capabilities', concessoesParaValor(entrada.papel.capacidades)],
      ]),
    })),
  );
}

/** As concessoes como valor: mapa de nome para booleano, na ordem. */
export function concessoesParaValor(
  concessoes: readonly ConcessaoDeCapacidade[],
): ValorPhp {
  return arranjo(
    concessoes.map((concessao) => ({
      chave: normalizarChaveDeTexto(concessao.capacidade),
      valor: booleano(concessao.concedida),
    })),
  );
}

/**
 * A definicao lida de um valor gravado, ou `null` quando a estrutura nao e a
 * que o legado escreve.
 *
 * **`null` nao e erro, e recusa de interpretar.** Quem le recebe tambem o valor
 * bruto (ver `repositorio-de-papeis.ts`) e pode grava-lo de volta sem alterar um
 * byte. A alternativa — adivinhar o que uma estrutura estranha quis dizer —
 * normalizaria o valor de alguem, e o cenario de paridade proibe por extenso:
 * *"nenhuma das duas normaliza, reordena nem reindexa a estrutura"*.
 */
export function definicaoDeValor(valor: ValorPhp): DefinicaoDePapeis | null {
  if (valor.tipo !== 'arranjo') {
    return null;
  }

  const definicao: EntradaDeDefinicao[] = [];
  for (const entrada of valor.entradas) {
    if (entrada.valor.tipo !== 'arranjo') {
      return null;
    }

    let nome: string | null = null;
    let capacidades: readonly ConcessaoDeCapacidade[] | null = null;

    for (const campo of entrada.valor.entradas) {
      const chave = nomeDaChave(campo.chave);
      if (chave === 'name' && campo.valor.tipo === 'texto') {
        nome = textoDeValor(campo.valor.valor);
      } else if (chave === 'capabilities') {
        capacidades = concessoesDeValor(campo.valor);
      } else {
        return null;
      }
    }

    if (nome === null || capacidades === null) {
      return null;
    }

    definicao.push({
      identificador: nomeDaChave(entrada.chave),
      papel: { nome, capacidades },
    });
  }

  return definicao;
}

/** As concessoes lidas de um valor gravado, ou `null` se a forma nao bater. */
export function concessoesDeValor(
  valor: ValorPhp,
): readonly ConcessaoDeCapacidade[] | null {
  if (valor.tipo !== 'arranjo') {
    return null;
  }

  const concessoes: ConcessaoDeCapacidade[] = [];
  for (const entrada of valor.entradas) {
    if (entrada.valor.tipo !== 'booleano') {
      return null;
    }
    concessoes.push({
      capacidade: nomeDaChave(entrada.chave),
      concedida: entrada.valor.valor,
    });
  }
  return concessoes;
}

/**
 * O construtor da definicao, com as duas operacoes do legado e a semantica
 * delas.
 *
 * - `adicionarPapel` **nao faz nada** se o papel ja existe — e por isso que
 *   repovoar nao apaga customizacao de papel existente;
 * - `adicionarCapacidade` **nao faz nada** se o papel nao existe, que e o motivo
 *   de cada uma das oito rotinas de povoamento conferir o papel antes de
 *   conceder;
 * - conceder de novo uma capacidade ja concedida **mantem a posicao dela**, e
 *   so troca o valor. Mover a posicao mudaria os bytes gravados.
 */
export interface ConstrutorDeDefinicao {
  adicionarPapel(identificador: string, nome: string): void;
  adicionarCapacidade(
    identificador: string,
    capacidade: string,
    concedida?: boolean,
  ): void;
  temPapel(identificador: string): boolean;
  resultado(): DefinicaoDePapeis;
}

export function criarConstrutorDeDefinicao(
  inicial: DefinicaoDePapeis = [],
): ConstrutorDeDefinicao {
  const papeis: { identificador: string; nome: string; capacidades: ConcessaoDeCapacidade[] }[] =
    inicial.map((entrada) => ({
      identificador: entrada.identificador,
      nome: entrada.papel.nome,
      capacidades: [...entrada.papel.capacidades],
    }));

  function procurar(identificador: string) {
    return papeis.find((papel) => papel.identificador === identificador);
  }

  return {
    adicionarPapel(identificador, nome) {
      if (procurar(identificador) !== undefined) {
        return;
      }
      papeis.push({ identificador, nome, capacidades: [] });
    },

    adicionarCapacidade(identificador, capacidade, concedida = true) {
      const papel = procurar(identificador);
      if (papel === undefined) {
        return;
      }
      const posicao = papel.capacidades.findIndex(
        (concessao) => concessao.capacidade === capacidade,
      );
      if (posicao === -1) {
        papel.capacidades.push({ capacidade, concedida });
        return;
      }
      papel.capacidades[posicao] = { capacidade, concedida };
    },

    temPapel(identificador) {
      return procurar(identificador) !== undefined;
    },

    resultado() {
      return papeis.map((papel) => ({
        identificador: papel.identificador,
        papel: { nome: papel.nome, capacidades: [...papel.capacidades] },
      }));
    },
  };
}

function textoDeValor(valor: string | Uint8Array): string {
  return typeof valor === 'string' ? valor : new TextDecoder().decode(valor);
}
