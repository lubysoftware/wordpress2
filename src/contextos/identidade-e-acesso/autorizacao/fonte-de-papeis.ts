/**
 * O adaptador que liga a decisao de capacidade ao dado do papel.
 *
 * Entrega de **T015** do lado de BC-05. A decisao mora em
 * `plataforma/autorizacao/` — *"porque e chamada 1.279 vezes em 224 arquivos e
 * precisa estar abaixo de todo contexto"* — e o **dado** do papel mora aqui,
 * *"em metadado serializado por site, com o identificador do site dentro do nome
 * da chave"* (`target_architecture.md`, BC-05; BR-MIGRAR-088). A regra de
 * dependencia 2 proibe a plataforma importar o contexto, logo a interface e
 * declarada embaixo (`FonteDeAutorizacao`) e implementada aqui, na direcao
 * permitida.
 *
 * Este arquivo **nao decide nada**: ele le o que T002 grava e entrega na forma que
 * a politica espera. Nenhuma pergunta de permissao se responde aqui.
 *
 * ## 🔴 Uma diferenca de leitura que esta tarefa encontrou, e registrou
 *
 * `obterCapacidadesDaConta` de T002 devolve `interpretado: null` quando a estrutura
 * gravada nao e a que o legado escreve — e ela trata dois casos com o mesmo `null`:
 * **nao e arranjo** e **e arranjo com valor que nao e booleano**.
 *
 * No legado os dois casos divergem: `WP_User` faz `if ( ! is_array( $caps ) ) $caps
 * = array();`, logo o que nao e arranjo vira vazio — e e o que este adaptador
 * reproduz —, mas um arranjo com valor nao booleano e **mantido**, e a comparacao
 * final o avalia por verdade (`array_filter`). Para esse segundo caso, este
 * adaptador entrega vazio, o que e **mais fechado** que o legado.
 *
 * Nao foi "corrigido" aqui porque a correcao e na leitura de T002, e mexer nela
 * mudaria o que aquela tarefa afirma por teste sobre o valor bruto. Fica
 * **nomeado**: o valor bruto continua disponivel em `obterCapacidadesDaConta().bruto`
 * para quem fechar isso contra o oraculo executavel (`ESC-ORACULO`,
 * BR-MIGRAR-116), que nesta arvore nao existe.
 */

import type {
  FonteDeAutorizacao,
  MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';
import type { RepositorioDeContas } from '../armazenamento/conta.js';
import type { DefinicaoDePapeis } from '../armazenamento/papel.js';
import type { RepositorioDePapeis } from '../armazenamento/repositorio-de-papeis.js';

/** O que este adaptador precisa do armazenamento de BC-05, e nada mais. */
export interface ArmazenamentoParaAutorizacao {
  readonly contas: Pick<RepositorioDeContas, 'obterPorId'>;
  readonly papeis: Pick<
    RepositorioDePapeis,
    'obterDefinicao' | 'obterCapacidadesDaConta' | 'idsDeContasComPapel'
  >;
}

/**
 * A definicao gravada na forma que a politica consome.
 *
 * A conversao e rasa de proposito: tira o **nome exibido**, que a decisao nao pode
 * olhar (CA-7.1: nenhuma decisao compara nome de papel), e conserva a **ordem** das
 * concessoes, que e o que decide os bytes gravados.
 */
export function matrizDeAutorizacao(
  definicao: DefinicaoDePapeis,
): MatrizDePapeis {
  return definicao.map((entrada) => ({
    identificador: entrada.identificador,
    capacidades: entrada.papel.capacidades,
  }));
}

/**
 * A matriz **como esta gravada agora**, lida da opcao `{site}user_roles`.
 *
 * Devolve matriz vazia quando a opcao nao existe ou quando a estrutura gravada nao
 * e a que o legado escreve. Vazia e o que o legado tem antes de a instalacao
 * povoar os papeis, e nesse estado ninguem tem capacidade por papel — que e
 * exatamente o comportamento de uma instalacao cujo povoamento nao rodou.
 *
 * E lida **por requisicao**, nao guardada: `PERM-13` e CA-7.2 exigem que uma
 * alteracao em execucao passe a valer, e o risco 4 do `plan.md` avisa o que um
 * cache persistente faria aqui — *"muda o momento em que uma alteracao de papel
 * passa a valer, o que e observavel"*.
 */
export function matrizGravada(
  armazenamento: ArmazenamentoParaAutorizacao,
): MatrizDePapeis {
  const gravada = armazenamento.papeis.obterDefinicao();
  if (gravada === null || gravada.interpretado === null) {
    return [];
  }
  return matrizDeAutorizacao(gravada.interpretado);
}

/** A fonte que a politica consome, sobre o armazenamento de BC-05. */
export function criarFonteDeAutorizacao(
  armazenamento: ArmazenamentoParaAutorizacao,
): FonteDeAutorizacao {
  return {
    concessoesDaConta(contaId) {
      return armazenamento.papeis.obterCapacidadesDaConta(contaId)
        ?.interpretado ?? [];
    },

    loginDaConta(contaId) {
      return armazenamento.contas.obterPorId(contaId)?.login ?? null;
    },

    contasComNomeNasCapacidades(nome) {
      // A MESMA consulta que procura papel, e nao e economia: papel e capacidade
      // vivem no mesmo mapa serializado da chave `{site}capabilities`
      // (BR-MIGRAR-087, `chaves-e-tabelas.ts`), e o trecho procurado e o nome
      // entre aspas em qualquer um dos dois casos. Ter duas consultas daria a
      // entender que o armazenamento as distingue, e ele nao distingue.
      return armazenamento.papeis.idsDeContasComPapel(nome);
    },
  };
}
