/**
 * Onde a definicao de papel e a autorizacao da conta sao lidas e gravadas.
 *
 * Duas coisas, duas moradas, e a diferenca e `PERM-2` (BR-MIGRAR-088):
 *
 * - **a definicao dos papeis** e a opcao `{site}user_roles`, por site;
 * - **o que cada conta tem** e a chave `{site}capabilities` de `usermeta`, com o
 *   identificador do site **dentro do nome da chave**.
 *
 * A consequencia esta no plano desta feature e nao pode ser apagada por
 * esperteza de modelagem: *"nenhum indice alcanca a permissao"*. A pergunta
 * "quem sao os administradores deste site" so tem uma resposta no legado, e e
 * busca por texto com curinga sobre valor serializado — e e ela que
 * {@link RepositorioDePapeis.idsDeContasComPapel} faz.
 *
 * **Isto nao decide autorizacao.** A decisao e `plataforma/autorizacao/`, em
 * T015. Aqui ha leitura e escrita de dado, e so.
 */

import {
  desserializar,
  serializar,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import type { PortaDeDados } from '../portas/index.js';
import {
  chaveDeCapacidades,
  chaveDeNivel,
  opcaoDeDefinicaoDePapeis,
  prefixosDe,
  tabelaDeOpcoes,
} from './chaves-e-tabelas.js';
import { comoInteiro, primeiraLinha } from './leitura-de-linha.js';
import {
  povoarPapeis,
  type LadoDoConflitoDeNivelNumerico,
} from './matriz-de-fabrica.js';
import {
  concessoesDeValor,
  concessoesParaValor,
  definicaoDeValor,
  definicaoParaValor,
  type ConcessaoDeCapacidade,
  type DefinicaoDePapeis,
} from './papel.js';
import type { RepositorioDeMetadadosDeConta } from './perfil.js';

/**
 * O que foi lido: o valor como esta gravado **e** a leitura estrita dele.
 *
 * Os dois juntos de proposito. `interpretado` e `null` quando a estrutura
 * gravada nao e a que o legado escreve, e nesse caso `bruto` continua
 * disponivel para ser regravado sem alterar um byte — nada e normalizado em
 * silencio.
 */
export interface ValorGravado<T> {
  readonly bruto: ValorPhp;
  readonly interpretado: T | null;
}

export interface RepositorioDePapeis {
  /** A definicao gravada, ou `null` quando a opcao nao existe. */
  obterDefinicao(): ValorGravado<DefinicaoDePapeis> | null;
  /** Grava a definicao. Devolve se chegou a escrever. */
  gravarDefinicao(definicao: DefinicaoDePapeis): boolean;
  /**
   * Semeia a matriz de fabrica.
   *
   * **Os tres momentos, e nenhum outro:** instalar, atualizar e criar site de
   * rede (`PERM-13`, BR-MIGRAR-067). Chamar isto em qualquer outro ponto
   * reescreve a customizacao de permissao da instalacao, que o ADR-0001 declara
   * dado legitimo do produto.
   *
   * O lado do conflito REQ-017 e obrigatorio: ver `matriz-de-fabrica.ts`.
   */
  semearMatrizDeFabrica(lado: LadoDoConflitoDeNivelNumerico): DefinicaoDePapeis;
  /** O conteudo de `{site}capabilities` daquela conta. */
  obterCapacidadesDaConta(
    contaId: number,
  ): ValorGravado<readonly ConcessaoDeCapacidade[]> | null;
  gravarCapacidadesDaConta(
    contaId: number,
    concessoes: readonly ConcessaoDeCapacidade[],
  ): boolean;
  /**
   * `{site}user_level` — gravado como **texto decimal**, nao serializado, por
   * ser escalar. Ver a ressalva sobre esta chave em `chaves-e-tabelas.ts`.
   */
  obterNivelDaConta(contaId: number): number | null;
  gravarNivelDaConta(contaId: number, nivel: number): boolean;
  /** As contas que tem aquele papel, pela unica busca que o legado tem. */
  idsDeContasComPapel(identificador: string): readonly number[];
}

export function criarRepositorioDePapeis(
  dados: PortaDeDados,
  perfil: RepositorioDeMetadadosDeConta,
): RepositorioDePapeis {
  const prefixos = prefixosDe(dados);
  const tabela = tabelaDeOpcoes(prefixos);
  const nomeDaOpcao = opcaoDeDefinicaoDePapeis(prefixos);
  const chaveDasCapacidades = chaveDeCapacidades(prefixos);
  const chaveDoNivel = chaveDeNivel(prefixos);

  function lerOpcao(): Uint8Array | string | null {
    const linha = primeiraLinha(
      dados.selecionar({
        texto: `SELECT option_value FROM ${tabela} WHERE option_name = ?`,
        parametros: [nomeDaOpcao],
      }),
    );
    if (linha === null) {
      return null;
    }
    const valor = linha['option_value'];
    if (valor === null || valor === undefined) {
      return null;
    }
    return typeof valor === 'number' ? String(valor) : valor;
  }

  const repositorio: RepositorioDePapeis = {
    obterDefinicao() {
      const bruto = lerOpcao();
      if (bruto === null) {
        return null;
      }
      const lido = desserializar(bruto);
      if (!lido.ok) {
        return null;
      }
      return { bruto: lido.valor, interpretado: definicaoDeValor(lido.valor) };
    },

    gravarDefinicao(definicao) {
      const bytes = serializar(definicaoParaValor(definicao));
      const atual = lerOpcao();

      // O legado nao escreve quando o valor nao mudou — e isso e efeito no
      // banco, nao otimizacao: a requisicao que "salva sem mudar nada" nao
      // emite comando nenhum.
      if (atual !== null && mesmosBytes(atual, bytes)) {
        return false;
      }

      if (atual === null) {
        // `autoload` fica de fora da insercao: o padrao da coluna no DDL e o
        // valor que o esquema declara, e nomear aqui um valor que o pacote nao
        // declara seria inventa-lo.
        dados.escrever({
          texto: `INSERT INTO ${tabela} (option_name, option_value) VALUES (?, ?)`,
          parametros: [nomeDaOpcao, bytes],
        });
        return true;
      }

      const resultado = dados.escrever({
        texto: `UPDATE ${tabela} SET option_value = ? WHERE option_name = ?`,
        parametros: [bytes, nomeDaOpcao],
      });
      return resultado.linhasAfetadas > 0;
    },

    semearMatrizDeFabrica(lado) {
      const definicao = povoarPapeis(lado);
      repositorio.gravarDefinicao(definicao);
      return definicao;
    },

    obterCapacidadesDaConta(contaId) {
      const linhas = perfil.obter(contaId, chaveDasCapacidades);
      if (linhas.length === 0) {
        return null;
      }
      const bruto = linhas[0]?.valor;
      if (bruto === null || bruto === undefined || typeof bruto === 'number') {
        return null;
      }
      const lido = desserializar(bruto);
      if (!lido.ok) {
        return null;
      }
      return { bruto: lido.valor, interpretado: concessoesDeValor(lido.valor) };
    },

    gravarCapacidadesDaConta(contaId, concessoes) {
      return perfil.gravar(
        contaId,
        chaveDasCapacidades,
        serializar(concessoesParaValor(concessoes)),
      );
    },

    obterNivelDaConta(contaId) {
      const linhas = perfil.obter(contaId, chaveDoNivel);
      if (linhas.length === 0) {
        return null;
      }
      return comoInteiro(linhas[0]?.valor);
    },

    gravarNivelDaConta(contaId, nivel) {
      return perfil.gravar(contaId, chaveDoNivel, String(nivel));
    },

    idsDeContasComPapel(identificador) {
      // O trecho procurado inclui as aspas do texto serializado: e assim que o
      // legado evita casar `administrator` dentro de outro nome.
      return perfil.idsDeContasComValorContendo(
        chaveDasCapacidades,
        `"${identificador}"`,
      );
    },
  };

  return repositorio;
}

/**
 * Comparacao de valor gravado contra valor novo, em bytes.
 *
 * Em bytes, e nao em texto decodificado: a coluna pode guardar byte que nenhuma
 * decodificacao recupera, e comparar texto decodificado daria dois valores
 * diferentes como iguais — o que suprimiria uma escrita que o legado faz.
 */
function mesmosBytes(gravado: Uint8Array | string, novo: Uint8Array): boolean {
  const aqui =
    typeof gravado === 'string' ? new TextEncoder().encode(gravado) : gravado;
  if (aqui.length !== novo.length) {
    return false;
  }
  for (let indice = 0; indice < aqui.length; indice += 1) {
    if (aqui[indice] !== novo[indice]) {
      return false;
    }
  }
  return true;
}
