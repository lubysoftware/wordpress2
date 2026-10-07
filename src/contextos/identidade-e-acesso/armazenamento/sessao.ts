/**
 * A forma de armazenamento da sessao — `AGG-Sessao`.
 *
 * A sessao **nao tem tabela**: e um arranjo serializado dentro de uma linha de
 * `usermeta`, com um registro por token e a expiracao dentro de cada registro
 * (`target_data_model.md`, § Modelo de dados do plano desta feature). A chave do
 * arranjo e o **resumo** do token, nunca o token: quem le o banco nao consegue
 * se autenticar com o que leu.
 *
 * Duas coisas que este arquivo **nao** faz, e as duas sao regra de outra tarefa:
 *
 * - **nao descarta sessao vencida.** O legado filtra o que venceu na leitura, e
 *   esse filtro precisa do relogio: os 2 dias, os 14 e as 12 horas de carencia
 *   sao `U5` (BR-MIGRAR-025) e entram em T007, com teste de borda, como o P6 da
 *   constituicao exige. Aqui devolve-se **o que esta gravado**;
 * - **nao revoga nada quando a senha muda.** `ESC-SESSAO` (BR-MIGRAR-111) e a
 *   resposta 7 sao explicitas: trocar a senha nao revoga sessao, e o registro do
 *   token **sobrevive e acumula**. O acumulo e comportamento do produto, nao
 *   vazamento a corrigir.
 */

import { createHash } from 'node:crypto';

import {
  arranjo,
  arranjoPorNome,
  desserializar,
  inteiro,
  nomeDaChave,
  normalizarChaveDeTexto,
  serializar,
  texto,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import { CHAVE_DE_TOKENS_DE_SESSAO } from './chaves-e-tabelas.js';
import { comoTexto } from './leitura-de-linha.js';
import type { RepositorioDeMetadadosDeConta } from './perfil.js';

/** Um registro de sessao como esta gravado: o resumo do token e os campos. */
export interface RegistroDeSessao {
  readonly resumoDoToken: string;
  /** O arranjo gravado, inteiro. Guardado como esta para que a gravacao de
   * volta nao perca campo que nao e deste nucleo. */
  readonly campos: ValorPhp;
}

/** Os quatro campos que o legado escreve, quando escreve. */
export interface CamposDeSessao {
  /** `expiration` — o instante em que o token deixa de valer, em segundos. */
  readonly expiracao: number | null;
  /** `ip` — ausente quando o endereco de origem e vazio. */
  readonly ip: string | null;
  /** `ua` — ausente quando o agente e vazio. */
  readonly agente: string | null;
  /** `login` — o instante da entrada, em segundos. */
  readonly entradaEm: number | null;
}

export interface RepositorioDeSessoes {
  /** O que esta gravado, na ordem em que esta, sem filtrar o que venceu. */
  obter(contaId: number): readonly RegistroDeSessao[];
  /**
   * Grava o conjunto inteiro.
   *
   * Conjunto vazio **apaga a linha de metadado**, em vez de gravar um arranjo
   * vazio: e o que o legado faz, e a diferenca aparece no banco.
   */
  gravar(contaId: number, registros: readonly RegistroDeSessao[]): void;
}

/**
 * O resumo do token, que e o que vira chave do arranjo.
 *
 * O legado usa SHA-256 quando a funcao de resumo existe no runtime, e cai para
 * MD5 quando nao existe — o ramo de MD5 e inalcancavel na versao analisada,
 * porque a funcao sempre existe, e por isso ele nao e reproduzido aqui. Fica
 * registrado para quem comparar os dois ramos contra o oraculo.
 */
export function resumoDeToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** Os campos conhecidos, lidos de um registro gravado. */
export function lerCamposDeSessao(campos: ValorPhp): CamposDeSessao {
  const vazio: CamposDeSessao = {
    expiracao: null,
    ip: null,
    agente: null,
    entradaEm: null,
  };
  if (campos.tipo !== 'arranjo') {
    return vazio;
  }

  let expiracao: number | null = null;
  let ip: string | null = null;
  let agente: string | null = null;
  let entradaEm: number | null = null;

  for (const entrada of campos.entradas) {
    const chave = nomeDaChave(entrada.chave);
    if (chave === 'expiration' && entrada.valor.tipo === 'inteiro') {
      expiracao = entrada.valor.valor;
    } else if (chave === 'ip' && entrada.valor.tipo === 'texto') {
      ip = comoTexto(entrada.valor.valor);
    } else if (chave === 'ua' && entrada.valor.tipo === 'texto') {
      agente = comoTexto(entrada.valor.valor);
    } else if (chave === 'login' && entrada.valor.tipo === 'inteiro') {
      entradaEm = entrada.valor.valor;
    }
  }

  return { expiracao, ip, agente, entradaEm };
}

/**
 * Os campos de uma sessao nova, na ordem em que o legado os escreve:
 * expiracao, endereco, agente e instante de entrada — e os dois do meio **nao
 * sao escritos** quando vem vazios.
 */
export function camposDeSessao(sessao: CamposDeSessao): ValorPhp {
  const pares: [string, ValorPhp][] = [];
  if (sessao.expiracao !== null) {
    pares.push(['expiration', inteiro(sessao.expiracao)]);
  }
  if (sessao.ip !== null && sessao.ip !== '') {
    pares.push(['ip', texto(sessao.ip)]);
  }
  if (sessao.agente !== null && sessao.agente !== '') {
    pares.push(['ua', texto(sessao.agente)]);
  }
  if (sessao.entradaEm !== null) {
    pares.push(['login', inteiro(sessao.entradaEm)]);
  }
  return arranjoPorNome(pares);
}

export function criarRepositorioDeSessoes(
  perfil: RepositorioDeMetadadosDeConta,
): RepositorioDeSessoes {
  return {
    obter(contaId) {
      const linhas = perfil.obter(contaId, CHAVE_DE_TOKENS_DE_SESSAO);
      if (linhas.length === 0) {
        return [];
      }

      const bruto = linhas[0]?.valor;
      if (bruto === null || bruto === undefined || typeof bruto === 'number') {
        return [];
      }

      const lido = desserializar(bruto);
      // Valor que nao e arranjo vira conjunto vazio, como no legado — e nao
      // erro: uma linha corrompida nao derruba a requisicao.
      if (!lido.ok || lido.valor.tipo !== 'arranjo') {
        return [];
      }

      return lido.valor.entradas.map((entrada) => ({
        resumoDoToken: nomeDaChave(entrada.chave),
        campos: prepararRegistro(entrada.valor),
      }));
    },

    gravar(contaId, registros) {
      if (registros.length === 0) {
        perfil.apagar(contaId, CHAVE_DE_TOKENS_DE_SESSAO);
        return;
      }

      const valor = arranjo(
        registros.map((registro) => ({
          chave: normalizarChaveDeTexto(registro.resumoDoToken),
          valor: registro.campos,
        })),
      );
      perfil.gravar(contaId, CHAVE_DE_TOKENS_DE_SESSAO, serializar(valor));
    },
  };
}

/**
 * A conversao da forma antiga, em que o registro era so o instante de
 * expiracao.
 *
 * O legado continua aceitando essa forma na leitura e a converte para arranjo,
 * e e a conversao que faz a proxima gravacao normalizar a linha. Um porte que
 * nao a reproduzisse trataria uma instalacao antiga como sem sessao nenhuma.
 */
function prepararRegistro(valor: ValorPhp): ValorPhp {
  if (valor.tipo === 'inteiro') {
    return arranjoPorNome([['expiration', inteiro(valor.valor)]]);
  }
  return valor;
}
