/**
 * A forma de armazenamento da credencial de aplicacao — `AGG-SenhaDeAplicacao`.
 *
 * Entrega de **T021** (US-10), do lado do dado. Como a sessao, a credencial **nao
 * tem tabela**: e um arranjo serializado dentro de uma linha de `usermeta`, e
 * `perfil.ts` ja declarava isso desde T002 — *"`usermeta` nao guarda so perfil:
 * guarda perfil e autorizacao, e tambem a sessao e a senha de aplicacao"*. A
 * pos-condicao de UC-22 e literal: *"existe um item no metadado da conta com o
 * hash, o nome e o instante de criacao"*, e *"a senha em claro nao existe em lugar
 * algum do sistema"*.
 *
 * **A diferenca entre este arranjo e o da sessao e a chave, e ela e regra.** A
 * sessao e indexada pelo resumo do token; aqui o arranjo e uma **lista**, com
 * chave inteira, e o identificador da credencial e um campo **dentro** de cada
 * item. A consequencia aparece no banco: duas credenciais com o mesmo nome
 * descritivo nao se sobrepoem (o legado as recusa em codigo, ver
 * `../senha-de-aplicacao/emitir-credencial.ts`), e apagar uma nao reindexa as
 * outras — ver {@link proximaChaveDaLista}.
 *
 * Tres coisas que este arquivo **nao** faz, e as tres sao de propósito:
 *
 * - **nao decide permissao.** Quem pode administrar a credencial de uma conta e
 *   `edit_user` daquela conta (CA-10.4, `U6`), e isso e traducao de capacidade:
 *   mora em `../senha-de-aplicacao/autorizacao-de-senha-de-aplicacao.ts`;
 * - **nao gera, nao resume e nao confere segredo.** Aqui so passa o **resumo**
 *   gravado. O segredo em claro nao entra neste arquivo em nenhum caminho, que e o
 *   que faz CA-10.2 ser uma propriedade do desenho e nao uma promessa;
 * - **nao registra uso.** O campo do ultimo uso existe (CA-10.5) e quem o escreve
 *   e a autenticacao por credencial — `REQ-012`, que esta em `do-not-rewrite.md` e
 *   **nao** entrou neste pacote (risco 2 de `plan.md`). Nasce nulo e continua
 *   nulo.
 */

import {
  arranjo,
  arranjoPorNome,
  desserializar,
  inteiro,
  nomeDaChave,
  NULO,
  serializar,
  texto,
  type ChaveDeArranjo,
  type ValorPhp,
} from '../../../plataforma/serializacao/index.js';
import { CHAVE_DE_SENHAS_DE_APLICACAO } from './chaves-e-tabelas.js';
import { comoTexto } from './leitura-de-linha.js';
import type { RepositorioDeMetadadosDeConta } from './perfil.js';

/**
 * Um item da lista como esta gravado: a chave do arranjo e os campos.
 *
 * A chave vem junto, e nao e detalhe de implementacao: ela e o que o legado
 * preserva ao apagar um item, e e dela que sai a chave do item seguinte. Os campos
 * ficam como {@link ValorPhp} pelo mesmo motivo de `sessao.ts` — *"guardado como
 * esta para que a gravacao de volta nao perca campo que nao e deste nucleo"*.
 */
export interface RegistroDeSenhaDeAplicacao {
  readonly chave: ChaveDeArranjo;
  readonly campos: ValorPhp;
}

/**
 * Os campos de uma credencial, como estao gravados.
 *
 * Todos anulaveis porque a leitura devolve **o que esta no banco**: um item
 * gravado por extensao de terceiro, ou por uma versao anterior do produto, pode
 * nao ter o campo. Quem exige campo e a operacao, nao a leitura.
 *
 * ⚠️ **O pacote nomeia quatro destes campos, e esta lista tem sete.** CA-10.5 pede
 * *"nome descritivo, instante de criacao e instante do ultimo uso"*, a
 * pos-condicao de UC-22 acrescenta o hash, e a tabela *Contratos* de `plan.md`
 * exige um *"identificador da credencial"* para a revogacao. Os dois restantes —
 * o identificador da aplicacao e o endereco do ultimo uso — foram lidos do legado
 * na ancora que a rastreabilidade de US-10 cita
 * (`class-wp-application-passwords.php:98`) e **nenhum documento deste pacote os
 * registra**. Eles estao aqui porque o valor gravado e conferido byte a byte
 * (Decisao 2 de `parity_specs.md`, area *efeito no banco*) e um item com dois
 * campos a menos nao bate; a enumeracao fecha contra o oraculo (`ESC-ORACULO`,
 * BR-MIGRAR-116), que nesta arvore nao existe. **A correcao, se houver, e em
 * {@link camposGravaveisDeSenhaDeAplicacao} e em {@link lerCamposDeSenhaDeAplicacao},
 * e em nenhum outro lugar.**
 */
export interface CamposDeSenhaDeAplicacao {
  /** `uuid` — o identificador da credencial, e a entrada da revogacao. */
  readonly identificador: string | null;
  /** `app_id` — o identificador que a aplicacao informa de si. Vazio por padrao. */
  readonly aplicacaoId: string | null;
  /** `name` — o nome descritivo (CA-10.5). */
  readonly nome: string | null;
  /** `password` — o **resumo**, nunca o segredo (CA-10.1). */
  readonly resumo: string | null;
  /** `created` — o instante da emissao, em segundos inteiros UTC (CA-10.5). */
  readonly criadoEm: number | null;
  /** `last_used` — o instante do ultimo uso, nulo enquanto nao houver (CA-10.5). */
  readonly ultimoUsoEm: number | null;
  /** `last_ip` — o endereco do ultimo uso, nulo enquanto nao houver. */
  readonly ultimoIp: string | null;
}

/** Os campos de uma credencial nova: o que a emissao tem de ter em mao. */
export interface CamposGravaveisDeSenhaDeAplicacao {
  readonly identificador: string;
  readonly aplicacaoId: string;
  readonly nome: string;
  readonly resumo: string;
  readonly criadoEm: number;
  readonly ultimoUsoEm: number | null;
  readonly ultimoIp: string | null;
}

/** Os nomes de campo do legado, na ordem em que ele os escreve. */
const CAMPO = {
  identificador: 'uuid',
  aplicacaoId: 'app_id',
  nome: 'name',
  resumo: 'password',
  criadoEm: 'created',
  ultimoUsoEm: 'last_used',
  ultimoIp: 'last_ip',
} as const;

/** Os campos conhecidos, lidos de um item gravado. */
export function lerCamposDeSenhaDeAplicacao(
  campos: ValorPhp,
): CamposDeSenhaDeAplicacao {
  const vazio: CamposDeSenhaDeAplicacao = {
    identificador: null,
    aplicacaoId: null,
    nome: null,
    resumo: null,
    criadoEm: null,
    ultimoUsoEm: null,
    ultimoIp: null,
  };
  if (campos.tipo !== 'arranjo') {
    return vazio;
  }

  let identificador: string | null = null;
  let aplicacaoId: string | null = null;
  let nome: string | null = null;
  let resumo: string | null = null;
  let criadoEm: number | null = null;
  let ultimoUsoEm: number | null = null;
  let ultimoIp: string | null = null;

  for (const entrada of campos.entradas) {
    const chave = nomeDaChave(entrada.chave);
    const valor = entrada.valor;
    if (chave === CAMPO.identificador && valor.tipo === 'texto') {
      identificador = comoTexto(valor.valor);
    } else if (chave === CAMPO.aplicacaoId && valor.tipo === 'texto') {
      aplicacaoId = comoTexto(valor.valor);
    } else if (chave === CAMPO.nome && valor.tipo === 'texto') {
      nome = comoTexto(valor.valor);
    } else if (chave === CAMPO.resumo && valor.tipo === 'texto') {
      resumo = comoTexto(valor.valor);
    } else if (chave === CAMPO.criadoEm && valor.tipo === 'inteiro') {
      criadoEm = valor.valor;
    } else if (chave === CAMPO.ultimoUsoEm && valor.tipo === 'inteiro') {
      ultimoUsoEm = valor.valor;
    } else if (chave === CAMPO.ultimoIp && valor.tipo === 'texto') {
      ultimoIp = comoTexto(valor.valor);
    }
  }

  return {
    identificador,
    aplicacaoId,
    nome,
    resumo,
    criadoEm,
    ultimoUsoEm,
    ultimoIp,
  };
}

/**
 * Os campos de uma credencial nova, **na ordem em que o legado os escreve** — e
 * os sete sempre, inclusive os dois que nascem nulos.
 *
 * A diferenca com `camposDeSessao`, que omite campo vazio, e do legado e aparece no
 * banco: la o item e montado com dois `if`, aqui ele e um literal de sete chaves,
 * duas delas com `null`. Omitir `last_used` e `last_ip` produziria um arranjo com
 * cinco entradas em vez de sete, e o valor gravado nao bateria byte a byte.
 */
export function camposGravaveisDeSenhaDeAplicacao(
  credencial: CamposGravaveisDeSenhaDeAplicacao,
): ValorPhp {
  return arranjoPorNome([
    [CAMPO.identificador, texto(credencial.identificador)],
    [CAMPO.aplicacaoId, texto(credencial.aplicacaoId)],
    [CAMPO.nome, texto(credencial.nome)],
    [CAMPO.resumo, texto(credencial.resumo)],
    [CAMPO.criadoEm, inteiro(credencial.criadoEm)],
    [
      CAMPO.ultimoUsoEm,
      credencial.ultimoUsoEm === null ? NULO : inteiro(credencial.ultimoUsoEm),
    ],
    [
      CAMPO.ultimoIp,
      credencial.ultimoIp === null ? NULO : texto(credencial.ultimoIp),
    ],
  ]);
}

/**
 * A chave que o item seguinte recebe: o maior inteiro da lista mais um, ou zero
 * quando nao ha nenhum.
 *
 * 🔴 **E aqui que mora a duvida que esta tarefa nao consegue fechar sozinha.** O
 * legado acrescenta a credencial nova com o operador de empilhar do PHP, cuja
 * regra e exatamente esta; o que **nao** esta em documento algum deste pacote e se
 * a remocao de um item **reindexa** a lista antes de gravar. As duas escolhas
 * produzem bytes diferentes na coluna — `a:2:{i:0;…i:2;…}` contra
 * `a:2:{i:0;…i:1;…}` — e o cenario de paridade do codec e categorico: *"nenhuma
 * das duas normaliza, reordena nem reindexa a estrutura"*
 * (`15-fronteira-do-banco-e-codec-serialize.feature`).
 *
 * **O que esta implementado:** a remocao **nao** reindexa, e a chave seguinte vem
 * desta funcao — logo apagar o item do meio deixa um vao, e a credencial seguinte
 * nasce depois do maior. E a leitura que o cenario do codec autoriza, e ela esta
 * isolada aqui e em {@link RepositorioDeSenhasDeAplicacao.gravar}: se o oraculo
 * mostrar que o legado reindexa, a correcao e nestes dois pontos e em nenhum
 * outro.
 */
export function proximaChaveDaLista(
  registros: readonly RegistroDeSenhaDeAplicacao[],
): ChaveDeArranjo {
  let maior = -1;
  for (const registro of registros) {
    if (registro.chave.tipo === 'inteiro' && registro.chave.valor > maior) {
      maior = registro.chave.valor;
    }
  }
  return { tipo: 'inteiro', valor: maior + 1 };
}

export interface RepositorioDeSenhasDeAplicacao {
  /** O que esta gravado, na ordem e com as chaves em que esta. */
  obter(contaId: number): readonly RegistroDeSenhaDeAplicacao[];
  /**
   * Grava a lista inteira. Devolve se chegou a escrever.
   *
   * **Lista vazia grava o arranjo vazio**, e **nao** apaga a linha de metadado —
   * ao contrario da sessao, que apaga. A diferenca e do legado: la a sessao usa a
   * operacao de apagar metadado quando o conjunto esvazia, e a credencial usa
   * sempre a de gravar. Aparece no banco: a conta que teve credencial e revogou
   * todas continua com uma linha `_application_passwords` guardando `a:0:{}`.
   *
   * O retorno e consumido: a emissao e a revogacao transformam *"nao escreveu"* no
   * erro `db_error` do legado, que e o mesmo valor que a gravacao de metadado
   * devolve quando nada muda.
   */
  gravar(
    contaId: number,
    registros: readonly RegistroDeSenhaDeAplicacao[],
  ): boolean;
}

export function criarRepositorioDeSenhasDeAplicacao(
  perfil: RepositorioDeMetadadosDeConta,
): RepositorioDeSenhasDeAplicacao {
  return {
    obter(contaId) {
      const linhas = perfil.obter(contaId, CHAVE_DE_SENHAS_DE_APLICACAO);
      if (linhas.length === 0) {
        return [];
      }

      const bruto = linhas[0]?.valor;
      if (bruto === null || bruto === undefined || typeof bruto === 'number') {
        return [];
      }

      const lido = desserializar(bruto);
      // Valor que nao e arranjo vira lista vazia, como no legado — e nao erro:
      // `get_user_application_passwords()` devolve conjunto vazio quando o que
      // esta gravado nao e arranjo, e nenhuma requisicao cai por isso.
      if (!lido.ok || lido.valor.tipo !== 'arranjo') {
        return [];
      }

      return lido.valor.entradas.map((entrada) => ({
        chave: entrada.chave,
        campos: entrada.valor,
      }));
    },

    gravar(contaId, registros) {
      const valor = arranjo(
        registros.map((registro) => ({
          chave: registro.chave,
          valor: registro.campos,
        })),
      );
      return perfil.gravar(
        contaId,
        CHAVE_DE_SENHAS_DE_APLICACAO,
        serializar(valor),
      );
    },
  };
}
