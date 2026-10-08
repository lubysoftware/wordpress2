/**
 * A entrega de T023: *"o comportamento de US-11 existe e os critérios CA-11.1,
 * CA-11.2, CA-11.3, CA-11.4, CA-11.5, CA-11.6, CA-11.7 passam contra o sistema
 * novo"*.
 *
 * **Nao sao os testes de US-11.** Esses sao T024, que pede 8 testes, um por caso
 * registrado no catalogo de testes do backlog (UT-013-1 a UT-013-8), *"com o mesmo
 * dado de entrada, acao e resultado esperado"*. Esta suite afirma os sete critérios
 * **e** as regras do legado que a implementacao poderia quebrar em silencio:
 *
 * - a diferenca entre **saltar** e **parar** nas tres acoes em lote;
 * - o fato de o ator **nunca** ter o proprio papel trocado pelo lote;
 * - o curto-circuito de `set_role`, que nao emite comando nenhum;
 * - a ordem invertida entre a escolha de exclusao e a pergunta de permissao;
 * - a cascata exata de apagar uma conta, **com o que fica orfao** (P5);
 * - a **ausencia** de notificacao quando so o papel muda.
 *
 * **A suite corre sobre a porta de dados, nao sobre repositorio de mentira**, pelo
 * mesmo motivo de `../cadastro/cadastrar.test.ts`: o criterio de aceite desta area
 * e *"efeito no banco"* (Decisao 2 de `parity_specs.md`), e o que se tem de afirmar
 * e qual comando sai, com quais parametros — inclusive o caso em que **nenhum
 * comando sai**.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CAPACIDADE_NEGADA,
  REDE_INATIVA_NA_AUTORIZACAO,
  casoDeConta,
  comAtor,
  perguntarPermissao,
  traduzirCapacidade,
  type AtorDeAutorizacao,
  type BaseDeAutorizacao,
  type Capacidade,
  type FonteDeContaNaAutorizacao,
  type GanchosDeAutorizacao,
  type MatrizDePapeis,
} from '../../../plataforma/autorizacao/index.js';
import { criarArmazenamento } from '../armazenamento/index.js';
import { matrizDeAutorizacao } from '../autorizacao/fonte-de-papeis.js';
import type { GeradorDeHashDeSenha } from '../autenticacao/geracao-de-hash-de-senha.js';
import type { ResumoDaChaveDeRedefinicao } from '../cadastro/chave-de-redefinicao.js';
import type {
  Consulta,
  LinhaDeResultado,
  MensagemDeEmail,
  PortaDeDados,
  PortaDeEmail,
  ValorDeColuna,
} from '../portas/index.js';

import {
  apagarConta,
  apagarContas,
  contaTemConteudo,
} from './apagar-contas.js';
import {
  alterarContaPorAdministrador,
  criarContaPorAdministrador,
} from './conta-por-administrador.js';
import {
  OPCOES_DA_ADMINISTRACAO_DE_FABRICA,
  type AcervoDaConta,
  type ContextoDaAdministracaoDeContas,
  type GanchosDaAdministracaoDeContas,
} from './contexto-de-administracao.js';
import { codigosDeErroDaAdministracao } from './erro-da-administracao.js';
import {
  AVISOS_DA_ADMINISTRACAO,
  RECUSAS_DA_ADMINISTRACAO,
} from './mensagens-da-administracao.js';
import {
  PAPEL_DE_NENHUM_PAPEL,
  papeisEditaveis,
  papelConcede,
  papelEhFalsoNoLegado,
} from './papeis-editaveis.js';
import {
  chavesDaAutorizacaoDaConta,
  contaEhMembroDoSite,
  definirPapel,
  papeisDaConta,
  removerTodasAsCapacidades,
} from './papel-da-conta.js';
import { atorDaAdministracao, podeNaAdministracao } from './permissao-sobre-conta.js';
import { promoverContas } from './promover-contas.js';
import { removerContasDoSite } from './remover-contas-do-site.js';

const AGORA = 1_700_000_000;
const TITULO = 'Sitio';
const EMAIL_DO_ADMIN = 'admin@exemplo.invalido';
const URL_DO_SITE = 'https://exemplo.invalido';

/* ───────────────────────── a borda simulada ───────────────────────── */

const REMOVER_ACENTOS = (texto: string): string =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '');

const APELIDO_DE_TEXTO = (texto: string): string =>
  texto.toLowerCase().replace(/\s+/g, '-');

const RESUMO_DA_CHAVE: ResumoDaChaveDeRedefinicao = {
  resumir: (chave) => `resumo:${chave}`,
  conferir: (chave, resumo) => resumo === `resumo:${chave}`,
};

const GERADOR_DE_HASH: GeradorDeHashDeSenha = {
  gerar: (senha) => `$wp$hash:${senha}`,
};

/* ───────────────────── a porta de dados em memoria ───────────────────── */

interface LinhaDeConta {
  ID: number;
  user_login: string;
  user_pass: string;
  user_nicename: string;
  user_email: string;
  user_url: string;
  user_registered: string;
  user_activation_key: string;
  user_status: number;
  display_name: string;
}

interface LinhaDeMetadado {
  umeta_id: number;
  user_id: number;
  meta_key: string;
  meta_value: ValorDeColuna;
}

interface Banco {
  readonly porta: PortaDeDados;
  readonly leituras: Consulta[];
  readonly escritas: Consulta[];
  readonly contas: LinhaDeConta[];
  readonly metadados: LinhaDeMetadado[];
  readonly opcoes: Map<string, ValorDeColuna>;
}

/**
 * Uma porta de dados que guarda o que foi gravado **e** registra todo comando.
 *
 * E a mesma de `../cadastro/cadastrar.test.ts`, com o que T023 acrescenta: a
 * leitura de **todas** as linhas de uma conta (`listar`), o `DELETE` por
 * `umeta_id` e o `DELETE` da linha de `users`.
 */
function bancoEmMemoria(): Banco {
  const contas: LinhaDeConta[] = [];
  const metadados: LinhaDeMetadado[] = [];
  const opcoes = new Map<string, ValorDeColuna>();
  const leituras: Consulta[] = [];
  const escritas: Consulta[] = [];
  let proximaConta = 1;
  let proximoMetadado = 1;

  function texto(valor: unknown): string {
    if (valor instanceof Uint8Array) {
      return new TextDecoder().decode(valor);
    }
    return String(valor);
  }

  const porta: PortaDeDados = {
    prefixoDeTabela: 'wp_',
    prefixoBaseDeTabela: 'wp_',

    selecionar(consulta) {
      leituras.push(consulta);

      if (consulta.texto.includes('FROM wp_users')) {
        const coluna = consulta.texto.includes('WHERE user_login')
          ? 'user_login'
          : consulta.texto.includes('WHERE user_email')
            ? 'user_email'
            : consulta.texto.includes('WHERE user_nicename')
              ? 'user_nicename'
              : 'ID';
        const alvo = texto(consulta.parametros[0]);
        return contas.filter(
          (linha) => String(linha[coluna as keyof LinhaDeConta]) === alvo,
        ) as unknown as LinhaDeResultado[];
      }

      if (consulta.texto.includes('FROM wp_usermeta')) {
        const contaId = Number(consulta.parametros[0]);
        // `listar` manda um parametro so; `obter` manda dois.
        if (consulta.parametros.length === 1) {
          return metadados.filter(
            (linha) => linha.user_id === contaId,
          ) as unknown as LinhaDeResultado[];
        }
        const chave = texto(consulta.parametros[1]);
        return metadados.filter(
          (linha) => linha.user_id === contaId && linha.meta_key === chave,
        ) as unknown as LinhaDeResultado[];
      }

      if (consulta.texto.includes('FROM wp_options')) {
        const valor = opcoes.get(texto(consulta.parametros[0]));
        return valor === undefined ? [] : [{ option_value: valor }];
      }

      return [];
    },

    escrever(consulta) {
      escritas.push(consulta);
      const p = consulta.parametros;

      if (consulta.texto.startsWith('INSERT INTO wp_users')) {
        const id = proximaConta;
        proximaConta += 1;
        contas.push({
          ID: id,
          user_login: texto(p[0]),
          user_pass: texto(p[1]),
          user_nicename: texto(p[2]),
          user_email: texto(p[3]),
          user_url: texto(p[4]),
          user_registered: texto(p[5]),
          user_activation_key: texto(p[6]),
          user_status: 0,
          display_name: texto(p[7]),
        });
        return { linhasAfetadas: 1, idGerado: id };
      }

      if (consulta.texto.startsWith('UPDATE wp_users')) {
        const colunas = /SET (.*) WHERE ID = \?$/.exec(consulta.texto);
        const nomes = (colunas?.[1] ?? '')
          .split(', ')
          .map((atribuicao) => atribuicao.replace(' = ?', ''));
        const id = Number(p[p.length - 1]);
        const linha = contas.find((candidata) => candidata.ID === id);
        if (linha === undefined) {
          return { linhasAfetadas: 0, idGerado: null };
        }
        nomes.forEach((nome, posicao) => {
          (linha as unknown as Record<string, ValorDeColuna>)[nome] = texto(
            p[posicao],
          );
        });
        return { linhasAfetadas: 1, idGerado: null };
      }

      if (consulta.texto.startsWith('DELETE FROM wp_users')) {
        const id = Number(p[0]);
        const posicao = contas.findIndex((linha) => linha.ID === id);
        if (posicao < 0) {
          return { linhasAfetadas: 0, idGerado: null };
        }
        contas.splice(posicao, 1);
        return { linhasAfetadas: 1, idGerado: null };
      }

      if (consulta.texto.startsWith('INSERT INTO wp_usermeta')) {
        const id = proximoMetadado;
        proximoMetadado += 1;
        metadados.push({
          umeta_id: id,
          user_id: Number(p[0]),
          meta_key: texto(p[1]),
          meta_value: p[2] ?? null,
        });
        return { linhasAfetadas: 1, idGerado: id };
      }

      if (consulta.texto.startsWith('UPDATE wp_usermeta')) {
        const contaId = Number(p[1]);
        const chave = texto(p[2]);
        let afetadas = 0;
        for (const linha of metadados) {
          if (linha.user_id === contaId && linha.meta_key === chave) {
            linha.meta_value = p[0] ?? null;
            afetadas += 1;
          }
        }
        return { linhasAfetadas: afetadas, idGerado: null };
      }

      if (consulta.texto.startsWith('DELETE FROM wp_usermeta')) {
        if (consulta.texto.includes('umeta_id')) {
          const id = Number(p[0]);
          const posicao = metadados.findIndex((linha) => linha.umeta_id === id);
          if (posicao < 0) {
            return { linhasAfetadas: 0, idGerado: null };
          }
          metadados.splice(posicao, 1);
          return { linhasAfetadas: 1, idGerado: null };
        }
        const contaId = Number(p[0]);
        const chave = texto(p[1]);
        let afetadas = 0;
        for (let indice = metadados.length - 1; indice >= 0; indice -= 1) {
          const linha = metadados[indice] as LinhaDeMetadado;
          if (linha.user_id === contaId && linha.meta_key === chave) {
            metadados.splice(indice, 1);
            afetadas += 1;
          }
        }
        return { linhasAfetadas: afetadas, idGerado: null };
      }

      if (consulta.texto.startsWith('INSERT INTO wp_options')) {
        opcoes.set(texto(p[0]), p[1] ?? null);
        return { linhasAfetadas: 1, idGerado: null };
      }

      if (consulta.texto.startsWith('UPDATE wp_options')) {
        opcoes.set(texto(p[1]), p[0] ?? null);
        return { linhasAfetadas: 1, idGerado: null };
      }

      return { linhasAfetadas: 0, idGerado: null };
    },
  };

  return { porta, leituras, escritas, contas, metadados, opcoes };
}

/* ─────────────────────────── a montagem ─────────────────────────── */

interface ChamadaDoAcervo {
  readonly operacao: 'temConteudo' | 'apagar' | 'reatribuir';
  readonly contaId: number;
  readonly destinoId?: number;
}

interface Montagem {
  readonly banco: Banco;
  readonly contexto: ContextoDaAdministracaoDeContas;
  readonly enviadas: MensagemDeEmail[];
  readonly acervo: ChamadaDoAcervo[];
  readonly disparos: string[];
  readonly matriz: MatrizDePapeis;
  /** Cria uma conta com aquele papel e devolve o identificador. */
  readonly semearConta: (login: string, papel: string) => number;
  /** Recompoe o contexto com o ator sendo aquela conta. */
  readonly comAtorDaConta: (
    contaId: number,
  ) => ContextoDaAdministracaoDeContas;
}

interface OpcoesDaMontagem {
  readonly rede?: boolean;
  readonly loginsDeSuperAdmin?: readonly string[];
  readonly adicaoDeContaLiberadaNaRede?: boolean;
  readonly ganchos?: GanchosDaAdministracaoDeContas;
  readonly ganchosDeAutorizacao?: GanchosDeAutorizacao;
  readonly comConteudo?: boolean;
}

function montar(opcoes: OpcoesDaMontagem = {}): Montagem {
  const banco = bancoEmMemoria();
  const armazenamento = criarArmazenamento(banco.porta);
  const enviadas: MensagemDeEmail[] = [];
  const acervo: ChamadaDoAcervo[] = [];
  const disparos: string[] = [];

  // A matriz de fabrica e semeada ANTES, como no legado: povoar e operacao de
  // instalacao e nunca de requisicao (`PERM-13`, BR-MIGRAR-067). O lado do
  // conflito REQ-017 e argumento obrigatorio desde T002, e um teste proprio
  // afirma que nada desta tarefa depende da escolha.
  const definicao = armazenamento.papeis.semearMatrizDeFabrica('legado-integral');
  const matriz = matrizDeAutorizacao(definicao);

  const email: PortaDeEmail = {
    enviar(mensagem) {
      enviadas.push(mensagem);
      return { enviado: true };
    },
  };

  const portaDoAcervo: AcervoDaConta = {
    contaTemConteudo(contaId) {
      acervo.push({ operacao: 'temConteudo', contaId });
      return opcoes.comConteudo === true;
    },
    apagarConteudoDaConta(contaId) {
      acervo.push({ operacao: 'apagar', contaId });
    },
    reatribuirConteudoDaConta(contaId, destinoId) {
      acervo.push({ operacao: 'reatribuir', contaId, destinoId });
    },
  };

  const base: BaseDeAutorizacao = {
    matriz,
    rede:
      opcoes.rede === true
        ? {
            ativa: true,
            loginsDeSuperAdmin: opcoes.loginsDeSuperAdmin ?? [],
          }
        : REDE_INATIVA_NA_AUTORIZACAO,
    ...(opcoes.ganchosDeAutorizacao === undefined
      ? {}
      : { ganchos: opcoes.ganchosDeAutorizacao }),
  };

  const ganchos: GanchosDaAdministracaoDeContas = {
    aoRemoverPapel: (contaId, papel) => disparos.push(`remove_user_role:${contaId}:${papel}`),
    aoAcrescentarPapel: (contaId, papel) =>
      disparos.push(`add_user_role:${contaId}:${papel}`),
    aoDefinirPapel: (contaId, papel) => disparos.push(`set_user_role:${contaId}:${papel}`),
    aoApagarConta: (contaId) => disparos.push(`delete_user:${contaId}`),
    contaApagada: (contaId) => disparos.push(`deleted_user:${contaId}`),
    aoRemoverContaDoSite: (contaId) => disparos.push(`remove_user_from_blog:${contaId}`),
    aoCriarContaPorAdministrador: (contaId, modo) =>
      disparos.push(`edit_user_created_user:${contaId}:${modo}`),
    ...(opcoes.ganchos ?? {}),
  };

  function montarContexto(ator: AtorDeAutorizacao): ContextoDaAdministracaoDeContas {
    return {
      base,
      ator,
      armazenamento,
      chaves: chavesDaAutorizacaoDaConta(banco.porta),
      acervo: portaDoAcervo,
      email,
      relogio: { agoraEmSegundos: () => AGORA },
      opcoes: {
        ...OPCOES_DA_ADMINISTRACAO_DE_FABRICA,
        tituloDoSite: TITULO,
        emailDoAdministrador: EMAIL_DO_ADMIN,
        urlDoSite: URL_DO_SITE,
        urlDeEntrada: `${URL_DO_SITE}/wp-login.php`,
        adicaoDeContaLiberadaNaRede:
          opcoes.adicaoDeContaLiberadaNaRede ?? false,
      },
      siteId: 1,
      removerAcentos: REMOVER_ACENTOS,
      apelidoDeTexto: APELIDO_DE_TEXTO,
      resumoDaChave: RESUMO_DA_CHAVE,
      geradorDeHashDeSenha: GERADOR_DE_HASH,
      montarUrlDaRede: (caminho) => `${URL_DO_SITE}/${caminho}`,
      ganchos,
    };
  }

  function semearConta(login: string, papel: string): number {
    const contaId = armazenamento.contas.inserir({
      login,
      senhaHash: GERADOR_DE_HASH.gerar(`senha-de-${login}`),
      apelido: login,
      email: `${login}@exemplo.invalido`,
      url: '',
      registradoEm: '2026-01-01 00:00:00',
      chaveDeAtivacao: '',
      nomeExibido: login,
    });
    // As duas chaves que `atribuirPapel` grava, na mesma ordem: uma conta real
    // tem as duas, e a cascata de P5 conta linha por linha.
    armazenamento.papeis.gravarCapacidadesDaConta(
      contaId,
      papel === '' ? [] : [{ capacidade: papel, concedida: true }],
    );
    armazenamento.papeis.gravarNivelDaConta(contaId, 0);
    return contaId;
  }

  return {
    banco,
    contexto: montarContexto({
      contaId: 0,
      login: '',
      existe: false,
      concessoes: [],
    }),
    enviadas,
    acervo,
    disparos,
    matriz,
    semearConta,
    comAtorDaConta: (contaId) =>
      montarContexto(atorDaAdministracao(contaId, armazenamento)),
  };
}

/** Os papeis gravados daquela conta, pela matriz do contexto. */
function papeisDe(
  contexto: ContextoDaAdministracaoDeContas,
  matriz: MatrizDePapeis,
  contaId: number,
): readonly string[] {
  return papeisDaConta(
    { papeis: contexto.armazenamento.papeis },
    matriz,
    contaId,
  );
}

/** Zera os registros do banco, para que a semeadura nao conte como efeito. */
function limparRegistros(montagem: Montagem): void {
  montagem.banco.leituras.length = 0;
  montagem.banco.escritas.length = 0;
  montagem.disparos.length = 0;
  montagem.enviadas.length = 0;
  montagem.acervo.length = 0;
}

/* ══════════════════ CA-11.1: a permissao, duas vezes ══════════════════ */

test('CA-11.1: sem a capacidade da acao, nenhuma conta alvo e consultada', () => {
  const montagem = montar();
  const assinante = montagem.semearConta('ana', 'subscriber');
  const alvo = montagem.semearConta('bia', 'subscriber');
  limparRegistros(montagem);

  const resultado = promoverContas(
    { contas: [alvo], papel: 'editor' },
    montagem.comAtorDaConta(assinante),
  );

  assert.equal(resultado.desfecho, 'promover_acao');
  assert.deepEqual(resultado.recusa, RECUSAS_DA_ADMINISTRACAO.promover_acao);
  assert.equal(resultado.aviso, null);
  assert.deepEqual(resultado.alteradas, []);
  // A recusa da ACAO acontece antes do laco: nenhuma escrita, e o papel do alvo
  // continua o que era.
  assert.deepEqual(montagem.banco.escritas, []);
  assert.deepEqual(papeisDe(montagem.contexto, montagem.matriz, alvo), [
    'subscriber',
  ]);
});

test('CA-11.1: a permissao e perguntada conta a conta, e a recusa de uma para o lote', () => {
  const protegida = 3;
  const montagem = montar({
    ganchosDeAutorizacao: {
      // `user_has_cap` com o objeto da pergunta: e assim que o legado permite
      // negar `promote_user` sobre UMA conta sem mexer na capacidade da acao.
      aoMontarCapacidadesDoAtor: (capacidades, _exigidas, argumentos) => {
        if (argumentos[0] === protegida) {
          const copia = new Map(capacidades);
          copia.delete('promote_users');
          return copia;
        }
        return capacidades;
      },
    },
  });
  const dona = montagem.semearConta('ada', 'administrator');
  const primeira = montagem.semearConta('bia', 'subscriber');
  const segunda = montagem.semearConta('cle', 'subscriber');
  const terceira = montagem.semearConta('dio', 'subscriber');
  assert.equal(segunda, protegida);
  limparRegistros(montagem);

  const contexto = montagem.comAtorDaConta(dona);
  const resultado = promoverContas(
    { contas: [primeira, segunda, terceira], papel: 'editor' },
    contexto,
  );

  assert.equal(resultado.desfecho, 'promover_alvo');
  assert.deepEqual(resultado.recusa, RECUSAS_DA_ADMINISTRACAO.promover_alvo);
  // A primeira foi gravada ANTES da recusa, e o estado parcial e a regra
  // (BR-MIGRAR-104: nao existe transacao).
  assert.deepEqual(
    resultado.alteradas.map((conta) => conta.contaId),
    [primeira],
  );
  assert.deepEqual(papeisDe(contexto, montagem.matriz, primeira), ['editor']);
  assert.deepEqual(papeisDe(contexto, montagem.matriz, segunda), ['subscriber']);
  assert.deepEqual(papeisDe(contexto, montagem.matriz, terceira), ['subscriber']);
});

test('CA-11.1: a capacidade da acao e perguntada SEM objeto, e a da conta COM objeto', () => {
  const perguntas: { capacidade: Capacidade; argumentos: readonly unknown[] }[] = [];
  const montagem = montar({
    ganchosDeAutorizacao: {
      aoMontarCapacidadesDoAtor: (capacidades, exigidas, argumentos) => {
        perguntas.push({ capacidade: exigidas[0] ?? '', argumentos });
        return capacidades;
      },
    },
  });
  const dona = montagem.semearConta('ada', 'administrator');
  const alvo = montagem.semearConta('bia', 'subscriber');
  limparRegistros(montagem);
  perguntas.length = 0;

  promoverContas({ contas: [alvo], papel: 'editor' }, montagem.comAtorDaConta(dona));

  const dePromocao = perguntas.filter(
    (pergunta) => pergunta.capacidade === 'promote_users',
  );
  // Duas perguntas pela MESMA primitiva, e e isso que faz de `promote_user` uma
  // meta-capacidade: a da acao sem argumento, a da conta com o identificador.
  assert.deepEqual(
    dePromocao.map((pergunta) => pergunta.argumentos),
    [[], [alvo]],
  );
});

/* ════════ CA-11.2: saltar numa acao, parar nas outras duas ════════ */

test('CA-11.2: no desvinculo, a conta sem permissao e saltada e as demais prosseguem', () => {
  // O caso real do legado, e o que o bilhete da tela nomeia — *"You cannot
  // remove the current user."*: o `case 'remove_user'` nega a **propria** conta a
  // quem nao e super administrador, e o laco de `doremove` a **salta**.
  const montagem = montar({ rede: true, loginsDeSuperAdmin: [] });
  const dona = montagem.semearConta('ada', 'administrator');
  const primeira = montagem.semearConta('bia', 'subscriber');
  const terceira = montagem.semearConta('dio', 'subscriber');
  limparRegistros(montagem);

  const contexto = montagem.comAtorDaConta(dona);
  const resultado = removerContasDoSite(
    { contas: [primeira, dona, terceira] },
    contexto,
  );

  assert.equal(resultado.desfecho, 'concluido');
  assert.equal(resultado.recusa, null);
  assert.equal(resultado.aviso, AVISOS_DA_ADMINISTRACAO.remocao_do_proprio_ator);
  assert.deepEqual(resultado.saltadas, [dona]);
  assert.deepEqual(
    resultado.removidas.map((conta) => conta.contaId),
    [primeira, terceira],
  );
  // A saltada conserva a autorizacao; as outras duas a perderam.
  assert.equal(
    contaEhMembroDoSite(
      { perfil: montagem.contexto.armazenamento.perfil, chaves: contexto.chaves },
      dona,
    ),
    true,
  );
  assert.equal(
    contaEhMembroDoSite(
      { perfil: montagem.contexto.armazenamento.perfil, chaves: contexto.chaves },
      primeira,
    ),
    false,
  );
  assert.equal(
    contaEhMembroDoSite(
      { perfil: montagem.contexto.armazenamento.perfil, chaves: contexto.chaves },
      terceira,
    ),
    false,
  );
});

test('🔴 CA-11.2 nao vale na promocao nem na exclusao: o legado PARA o lote', () => {
  // A divergencia esta declarada no cabecalho de `promover-contas.ts`, com a
  // tabela das quatro acoes em lote e a citacao do P1. Este teste a fixa para que
  // ninguem "conserte" a leitura sem decisao humana.
  const protegida = 3;
  const montagem = montar({
    ganchosDeAutorizacao: {
      // `do_not_allow` concedido por aqui **nao** nega: as duas sinteticas sao
      // aplicadas DEPOIS do ponto de extensao (passo 6 de `decisao-de-capacidade.ts`,
      // garantia 2 de ADR-0009). O que uma extensao consegue e **retirar** a
      // primitiva exigida, e e isso que este gancho faz.
      aoMontarCapacidadesDoAtor: (capacidades, _exigidas, argumentos) => {
        if (argumentos[0] === protegida) {
          const copia = new Map(capacidades);
          copia.delete('promote_users');
          copia.delete('delete_users');
          return copia;
        }
        return capacidades;
      },
    },
  });
  const dona = montagem.semearConta('ada', 'administrator');
  const primeira = montagem.semearConta('bia', 'subscriber');
  const segunda = montagem.semearConta('cle', 'subscriber');
  const terceira = montagem.semearConta('dio', 'subscriber');
  assert.equal(segunda, protegida);
  limparRegistros(montagem);

  const contexto = montagem.comAtorDaConta(dona);

  const promocao = promoverContas(
    { contas: [primeira, segunda, terceira], papel: 'editor' },
    contexto,
  );
  assert.equal(promocao.desfecho, 'promover_alvo');
  assert.deepEqual(promocao.saltadas, []);

  const exclusao = apagarContas(
    {
      contas: [segunda, terceira],
      escolhas: {
        [segunda]: { opcao: 'delete' },
        [terceira]: { opcao: 'delete' },
      },
    },
    contexto,
  );
  assert.equal(exclusao.desfecho, 'apagar_alvo');
  assert.deepEqual(exclusao.apagadas, []);
  assert.deepEqual(exclusao.saltadas, []);
});

/* ═════ CA-11.3: reatribuir ou apagar o conteudo, e a cascata (P5) ═════ */

test('CA-11.3: sem escolha de exclusao, a acao volta pedindo a escolha — ANTES da permissao', () => {
  const montagem = montar();
  const assinante = montagem.semearConta('ana', 'subscriber');
  const alvo = montagem.semearConta('bia', 'subscriber');
  limparRegistros(montagem);

  // O ator NAO tem `delete_users`, e ainda assim o que volta e o pedido de
  // escolha: `users.php:192` vem antes de `:199`. Agrupar as guardas de permissao
  // no topo trocaria esta resposta.
  const resultado = apagarContas(
    { contas: [alvo], escolhas: {} },
    montagem.comAtorDaConta(assinante),
  );

  assert.equal(resultado.desfecho, 'opcao-de-exclusao-ausente');
  assert.equal(resultado.recusa, null);
  assert.deepEqual(montagem.banco.escritas, []);
});

test('CA-11.3: reatribuicao sem destino salta aquela conta, e as demais prosseguem', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  const primeira = montagem.semearConta('bia', 'subscriber');
  const segunda = montagem.semearConta('cle', 'subscriber');
  limparRegistros(montagem);

  const resultado = apagarContas(
    {
      contas: [primeira, segunda],
      escolhas: {
        [primeira]: { opcao: 'reassign' },
        [segunda]: { opcao: 'delete' },
      },
    },
    montagem.comAtorDaConta(dona),
  );

  assert.equal(resultado.desfecho, 'concluido');
  assert.equal(resultado.aviso, AVISOS_DA_ADMINISTRACAO.reatribuicao_sem_destino);
  assert.deepEqual(resultado.saltadas, [
    { contaId: primeira, motivo: 'reatribuicao-sem-destino' },
  ]);
  assert.deepEqual(
    resultado.apagadas.map((conta) => conta.contaId),
    [segunda],
  );
  assert.equal(resultado.quantidade, 1);
});

test('CA-11.3: destino zero conta como ausente, como o vazio de PHP', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  const alvo = montagem.semearConta('bia', 'subscriber');
  limparRegistros(montagem);

  const resultado = apagarContas(
    { contas: [alvo], escolhas: { [alvo]: { opcao: 'reassign', destinoId: 0 } } },
    montagem.comAtorDaConta(dona),
  );

  assert.equal(resultado.aviso, AVISOS_DA_ADMINISTRACAO.reatribuicao_sem_destino);
  assert.deepEqual(resultado.apagadas, []);
});

test('CA-11.3: as duas escolhas chegam ao acervo como duas operacoes distintas', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  const comApagar = montagem.semearConta('bia', 'subscriber');
  const comReatribuir = montagem.semearConta('cle', 'subscriber');
  limparRegistros(montagem);

  apagarContas(
    {
      contas: [comApagar, comReatribuir],
      escolhas: {
        [comApagar]: { opcao: 'delete' },
        [comReatribuir]: { opcao: 'reassign', destinoId: dona },
      },
    },
    montagem.comAtorDaConta(dona),
  );

  assert.deepEqual(montagem.acervo, [
    { operacao: 'apagar', contaId: comApagar },
    { operacao: 'reatribuir', contaId: comReatribuir, destinoId: dona },
  ]);
});

test('P5: a cascata apaga usermeta linha por linha e a linha de users, e NADA mais', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  const alvo = montagem.semearConta('bia', 'subscriber');
  const contexto = montagem.comAtorDaConta(dona);
  // Tres linhas de metadado: a autorizacao, o nivel e uma de perfil qualquer.
  montagem.contexto.armazenamento.perfil.gravar(alvo, 'first_name', 'Bia');
  const metadadosDoAlvo = montagem.banco.metadados.filter(
    (linha) => linha.user_id === alvo,
  ).length;
  assert.equal(metadadosDoAlvo, 3);
  limparRegistros(montagem);

  const resultado = apagarConta(contexto, alvo, null);

  assert.equal(resultado.apagada, true);
  assert.equal(resultado.metadadosApagados, 3);
  assert.equal(resultado.linhasDeConta, 1);
  // Uma escrita por `umeta_id`, depois uma pela linha de `users`. E so.
  assert.deepEqual(
    montagem.banco.escritas.map((consulta) => consulta.texto),
    [
      'DELETE FROM wp_usermeta WHERE umeta_id = ?',
      'DELETE FROM wp_usermeta WHERE umeta_id = ?',
      'DELETE FROM wp_usermeta WHERE umeta_id = ?',
      'DELETE FROM wp_users WHERE ID = ?',
    ],
  );
  assert.equal(
    montagem.banco.metadados.some((linha) => linha.user_id === alvo),
    false,
  );
  assert.equal(montagem.banco.contas.some((linha) => linha.ID === alvo), false);
  // O conteudo foi apagado pela porta; o comentario **nao tem operacao nenhuma**
  // nesta cascata, e e a ausencia que `target_data_model.md` chama de estado
  // normal: *"apagar o usuario nao toca nos comentarios, de proposito"*.
  assert.deepEqual(montagem.acervo, [{ operacao: 'apagar', contaId: alvo }]);
  assert.deepEqual(montagem.disparos, [
    `delete_user:${alvo}`,
    `deleted_user:${alvo}`,
  ]);
});

test('P5: conta inexistente nao emite comando nenhum, e o ponto de extensao nao dispara', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  limparRegistros(montagem);

  const resultado = apagarConta(montagem.comAtorDaConta(dona), 999, null);

  assert.equal(resultado.apagada, false);
  assert.deepEqual(montagem.banco.escritas, []);
  assert.deepEqual(montagem.disparos, []);
  assert.deepEqual(montagem.acervo, []);
});

test('CA-11.3: o ponto de extensao de conteudo adicional pode abrir a escolha sem consulta', () => {
  const montagem = montar({
    ganchos: { filtrarContaTemConteudo: () => true },
  });
  const alvo = montagem.semearConta('bia', 'subscriber');
  limparRegistros(montagem);

  assert.equal(contaTemConteudo(montagem.contexto, alvo), true);
  // O curto-circuito e do legado: com o filtro respondendo verdadeiro, as duas
  // consultas de conteudo nao saem.
  assert.deepEqual(montagem.acervo, []);
});

/* ═════════ CA-11.4 e CA-11.5: a trava do proprio papel ═════════ */

test('CA-11.5: tirar o proprio papel e recusado com mensagem explicita', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  limparRegistros(montagem);

  const contexto = montagem.comAtorDaConta(dona);
  const resultado = promoverContas(
    { contas: [dona], papel: PAPEL_DE_NENHUM_PAPEL },
    contexto,
  );

  assert.equal(resultado.desfecho, 'remocao_do_proprio_papel');
  assert.equal(
    resultado.recusa?.mensagem,
    'Sorry, you cannot remove your own role.',
  );
  assert.equal(resultado.recusa?.codigoHttp, 403);
  assert.deepEqual(papeisDe(contexto, montagem.matriz, dona), [
    'administrator',
  ]);
  assert.deepEqual(montagem.banco.escritas, []);
});

test('CA-11.4: rebaixar-se a papel sem `promote_users` e recusado, com aviso', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  limparRegistros(montagem);

  const contexto = montagem.comAtorDaConta(dona);
  const resultado = promoverContas({ contas: [dona], papel: 'author' }, contexto);

  assert.equal(resultado.desfecho, 'concluido');
  assert.equal(resultado.aviso, AVISOS_DA_ADMINISTRACAO.papel_proprio_recusado);
  assert.deepEqual(resultado.saltadas, [
    { contaId: dona, motivo: 'propria-conta-sem-promocao' },
  ]);
  assert.deepEqual(resultado.alteradas, []);
  assert.deepEqual(papeisDe(contexto, montagem.matriz, dona), [
    'administrator',
  ]);
  assert.deepEqual(montagem.banco.escritas, []);
});

test('🔴 o ator nunca tem o proprio papel trocado pelo lote, nem quando o papel novo promove', () => {
  // O bilhete da tela diz por extenso: *"Your role was not changed."* Os dois
  // ramos do bloco de si mesmo terminam em `continue`, e `set_role` esta depois.
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  // Um papel que concede `promote_users` e nao e `administrator`.
  const definicao = montagem.contexto.armazenamento.papeis.obterDefinicao();
  assert.notEqual(definicao, null);
  montagem.contexto.armazenamento.papeis.gravarDefinicao([
    ...(definicao?.interpretado ?? []),
    {
      identificador: 'gerente',
      papel: {
        nome: 'Gerente',
        capacidades: [{ capacidade: 'promote_users', concedida: true }],
      },
    },
  ]);
  limparRegistros(montagem);

  const contexto = montagem.comAtorDaConta(dona);
  const matriz = matrizDeAutorizacao(
    contexto.armazenamento.papeis.obterDefinicao()?.interpretado ?? [],
  );
  assert.equal(papelConcede(matriz, 'gerente', 'promote_users'), true);

  const resultado = promoverContas(
    { contas: [dona], papel: 'gerente' },
    { ...contexto, base: { ...contexto.base, matriz } },
  );

  assert.equal(resultado.desfecho, 'concluido');
  // Aviso de sucesso, salto silencioso, e o papel do ator intacto.
  assert.equal(resultado.aviso, AVISOS_DA_ADMINISTRACAO.promocao);
  assert.deepEqual(resultado.saltadas, [{ contaId: dona, motivo: 'propria-conta' }]);
  assert.deepEqual(papeisDe(contexto, matriz, dona), ['administrator']);
  assert.deepEqual(montagem.banco.escritas, []);
});

test('CA-11.4: na tela de edicao a trava nao recusa — ela deixa de aplicar o papel, em silencio', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  limparRegistros(montagem);

  const contexto = montagem.comAtorDaConta(dona);
  const resultado = alterarContaPorAdministrador(
    dona,
    { papel: 'author', email: 'outro@exemplo.invalido' },
    contexto,
  );

  assert.equal(resultado.alterada, true);
  if (resultado.alterada) {
    assert.equal(resultado.papelProprioNaoAplicado, true);
    assert.equal(resultado.papel, null);
    // O resto do formulario foi gravado: a trava alcanca so o papel.
    assert.equal(resultado.emailAlterado, true);
  }
  assert.deepEqual(papeisDe(contexto, montagem.matriz, dona), [
    'administrator',
  ]);
});

/* ═══ CA-11.6: continua havendo quem promova, SEM contagem inventada ═══ */

test('CA-11.6: ao fim de qualquer operacao o ator conserva `promote_users`', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  const outraDona = montagem.semearConta('bia', 'administrator');
  limparRegistros(montagem);

  const contexto = montagem.comAtorDaConta(dona);

  // Rebaixa a OUTRA administradora e tenta se rebaixar na mesma leva.
  const resultado = promoverContas(
    { contas: [outraDona, dona], papel: 'subscriber' },
    contexto,
  );

  assert.equal(resultado.desfecho, 'concluido');
  assert.deepEqual(papeisDe(contexto, montagem.matriz, outraDona), [
    'subscriber',
  ]);
  // O ator sobreviveu, e e isso que mantem a invariante: nenhuma contagem global
  // foi acrescentada, porque o legado nao tem nenhuma (P6).
  assert.equal(
    podeNaAdministracao(montagem.comAtorDaConta(dona), 'promote_users'),
    true,
  );
});

test('CA-11.6: nenhuma contagem global foi inventada — rebaixar todos os outros e PERMITIDO', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  const segunda = montagem.semearConta('bia', 'administrator');
  const terceira = montagem.semearConta('cle', 'administrator');
  limparRegistros(montagem);

  const contexto = montagem.comAtorDaConta(dona);
  const resultado = promoverContas(
    { contas: [segunda, terceira], papel: 'subscriber' },
    contexto,
  );

  // O legado permite, e o P6 proibe acrescentar a trava que o impediria: *"onde o
  // legado nao tem numero, o sistema novo tambem nao tem"*.
  assert.equal(resultado.desfecho, 'concluido');
  assert.equal(resultado.alteradas.length, 2);
  assert.equal(
    podeNaAdministracao(montagem.comAtorDaConta(segunda), 'promote_users'),
    false,
  );
});

test('CA-11.6: o ator nunca e apagado pelo lote, e as demais contas sao', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  const alvo = montagem.semearConta('bia', 'subscriber');
  limparRegistros(montagem);

  const resultado = apagarContas(
    {
      contas: [dona, alvo],
      escolhas: { [dona]: { opcao: 'delete' }, [alvo]: { opcao: 'delete' } },
    },
    montagem.comAtorDaConta(dona),
  );

  assert.equal(resultado.desfecho, 'concluido');
  assert.equal(resultado.aviso, AVISOS_DA_ADMINISTRACAO.exclusao_do_proprio_ator);
  assert.deepEqual(resultado.saltadas, [{ contaId: dona, motivo: 'propria-conta' }]);
  assert.equal(montagem.banco.contas.some((linha) => linha.ID === dona), true);
  assert.equal(montagem.banco.contas.some((linha) => linha.ID === alvo), false);
});

/* ══════════════ CA-11.7: quem e notificado, e quem nao e ══════════════ */

test('CA-11.7: conta criada notifica o administrador do site, e so ele no modo de fabrica', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  limparRegistros(montagem);

  const resultado = criarContaPorAdministrador(
    {
      login: 'novato',
      email: 'novato@exemplo.invalido',
      senha: 'uma-senha-qualquer',
      papel: 'author',
    },
    montagem.comAtorDaConta(dona),
  );

  assert.equal(resultado.criada, true);
  if (!resultado.criada) {
    return;
  }
  assert.equal(resultado.papel, 'author');
  assert.equal(resultado.modoDeNotificacao, 'administrador');
  assert.equal(resultado.notificacaoDoTitular, null);
  assert.equal(montagem.enviadas.length, 1);
  const aviso = montagem.enviadas[0] as MensagemDeEmail;
  assert.deepEqual(aviso.destinatarios, [EMAIL_DO_ADMIN]);
  assert.equal(aviso.assunto, `[${TITULO}] New User Registration`);
  assert.equal(
    aviso.corpo,
    `New user registration on your site ${TITULO}:\r\n\r\n` +
      'Username: novato\r\n\r\n' +
      'Email: novato@exemplo.invalido\r\n',
  );
  assert.deepEqual(montagem.disparos.slice(0, 1), [
    `edit_user_created_user:${resultado.contaId}:administrador`,
  ]);
});

test('CA-11.7: com a caixa marcada, o administrador e avisado PRIMEIRO e o titular depois', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  limparRegistros(montagem);

  const resultado = criarContaPorAdministrador(
    {
      login: 'novato',
      email: 'novato@exemplo.invalido',
      senha: 'uma-senha-qualquer',
      papel: 'author',
      notificarOTitular: true,
    },
    montagem.comAtorDaConta(dona),
  );

  assert.equal(resultado.criada, true);
  assert.equal(montagem.enviadas.length, 2);
  assert.deepEqual(
    montagem.enviadas.map((mensagem) => mensagem.destinatarios[0]),
    [EMAIL_DO_ADMIN, 'novato@exemplo.invalido'],
  );
  assert.equal(
    montagem.enviadas[1]?.assunto,
    `[${TITULO}] Login Details`,
  );
});

test('CA-11.7: trocar a senha avisa no endereco ANTERIOR, com os marcadores trocados', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  const alvo = montagem.semearConta('bia', 'subscriber');
  limparRegistros(montagem);

  const resultado = alterarContaPorAdministrador(
    alvo,
    { senha: 'senha-nova' },
    montagem.comAtorDaConta(dona),
  );

  assert.equal(resultado.alterada, true);
  if (resultado.alterada) {
    assert.equal(resultado.senhaAlterada, true);
    assert.equal(resultado.emailAlterado, false);
  }
  assert.equal(montagem.enviadas.length, 1);
  const aviso = montagem.enviadas[0] as MensagemDeEmail;
  assert.deepEqual(aviso.destinatarios, ['bia@exemplo.invalido']);
  assert.equal(aviso.assunto, `[${TITULO}] Password Changed`);
  assert.equal(
    aviso.corpo,
    [
      'Hi bia,',
      '',
      `This notice confirms that your password was changed on ${TITULO}.`,
      '',
      'If you did not change your password, please contact the Site Administrator at',
      EMAIL_DO_ADMIN,
      '',
      'This email has been sent to bia@exemplo.invalido',
      '',
      'Regards,',
      `All at ${TITULO}`,
      URL_DO_SITE,
    ].join('\n'),
  );
  // E o hash gravado e o da senha nova.
  assert.equal(
    montagem.banco.contas.find((linha) => linha.ID === alvo)?.user_pass,
    GERADOR_DE_HASH.gerar('senha-nova'),
  );
});

test('CA-11.7: trocar o e-mail avisa no endereco ANTERIOR e nomeia o novo', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  const alvo = montagem.semearConta('bia', 'subscriber');
  limparRegistros(montagem);

  alterarContaPorAdministrador(
    alvo,
    { email: 'nova@exemplo.invalido' },
    montagem.comAtorDaConta(dona),
  );

  assert.equal(montagem.enviadas.length, 1);
  const aviso = montagem.enviadas[0] as MensagemDeEmail;
  assert.deepEqual(aviso.destinatarios, ['bia@exemplo.invalido']);
  assert.equal(aviso.assunto, `[${TITULO}] Email Changed`);
  assert.equal(
    aviso.corpo.includes(
      `your email address on ${TITULO} was changed to nova@exemplo.invalido.`,
    ),
    true,
  );
  assert.equal(
    aviso.corpo.includes('This email has been sent to bia@exemplo.invalido'),
    true,
  );
});

test('🔴 CA-11.7 contra o legado: trocar SO o papel nao envia mensagem nenhuma', () => {
  // UC-24 registra o mesmo achado: *"Promover alguem nao deixa rastro."* A
  // divergencia de redacao esta declarada no cabecalho de
  // `notificacoes-da-administracao.ts`, e este teste a fixa.
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  const alvo = montagem.semearConta('bia', 'subscriber');
  limparRegistros(montagem);

  const contexto = montagem.comAtorDaConta(dona);
  const pelaTela = alterarContaPorAdministrador(alvo, { papel: 'editor' }, contexto);
  assert.equal(pelaTela.alterada, true);
  assert.deepEqual(papeisDe(contexto, montagem.matriz, alvo), ['editor']);
  assert.deepEqual(montagem.enviadas, []);

  const peloLote = promoverContas({ contas: [alvo], papel: 'author' }, contexto);
  assert.equal(peloLote.desfecho, 'concluido');
  assert.deepEqual(papeisDe(contexto, montagem.matriz, alvo), ['author']);
  assert.deepEqual(montagem.enviadas, []);
});

test('CA-11.7: o filtro de cada aviso pode calar o envio, sem mudar a escrita', () => {
  const montagem = montar({
    ganchos: { filtrarEnvioDeAvisoDeSenha: () => false },
  });
  const dona = montagem.semearConta('ada', 'administrator');
  const alvo = montagem.semearConta('bia', 'subscriber');
  limparRegistros(montagem);

  const resultado = alterarContaPorAdministrador(
    alvo,
    { senha: 'senha-nova' },
    montagem.comAtorDaConta(dona),
  );

  assert.equal(resultado.alterada && resultado.senhaAlterada, true);
  assert.deepEqual(montagem.enviadas, []);
  assert.equal(
    montagem.banco.contas.find((linha) => linha.ID === alvo)?.user_pass,
    GERADOR_DE_HASH.gerar('senha-nova'),
  );
});

/* ═════════════ os cinco `case` de conta do `map_meta_cap` ═════════════ */

/** Uma fonte de conta programavel, para exercitar os cinco `case` isolados. */
function fonteDeConta(
  superAdmins: readonly number[],
  comCapacidade: readonly Capacidade[],
  adicaoLiberada = false,
): FonteDeContaNaAutorizacao {
  return {
    ehSuperAdmin: (contaId) => superAdmins.includes(contaId),
    temCapacidade: (_contaId, capacidade) => comCapacidade.includes(capacidade),
    adicaoDeContaLiberadaNaRede: () => adicaoLiberada,
  };
}

function traduzir(
  capacidade: Capacidade,
  contaId: number,
  argumentos: readonly unknown[],
  fonte: FonteDeContaNaAutorizacao,
  emRede: boolean,
): readonly Capacidade[] {
  return traduzirCapacidade(
    {
      capacidade,
      contaId,
      argumentos,
      constantes: {},
      emRede,
    },
    [casoDeConta(fonte)],
  );
}

test('`edit_user` sobre si mesmo devolve LISTA VAZIA, e lista vazia e permitido', () => {
  const fonte = fonteDeConta([], []);
  assert.deepEqual(traduzir('edit_user', 7, [7], fonte, false), []);
  // E a consequencia de UC-24: *"qualquer conta edita o proprio perfil, inclusive
  // um assinante"*.
  const montagem = montar();
  const assinante = montagem.semearConta('ana', 'subscriber');
  const contexto = montagem.comAtorDaConta(assinante);
  assert.equal(podeNaAdministracao(contexto, 'edit_user', assinante), true);
  assert.equal(podeNaAdministracao(contexto, 'edit_user', assinante + 1), false);
});

test('`edit_user` de conta inexistente nega — nem sobre si mesma', () => {
  const fonte = fonteDeConta([], []);
  // O ramo de `$user_id < 1` vem ANTES do de si mesmo, logo o anonimo nao passa.
  assert.deepEqual(traduzir('edit_user', 0, [0], fonte, false), [
    CAPACIDADE_NEGADA,
  ]);
});

test('`edit_user` em rede exige `manage_network_users`, e nega quem edita super admin', () => {
  const comRede = fonteDeConta([], ['manage_network_users']);
  assert.deepEqual(traduzir('edit_user', 7, [8], comRede, true), ['edit_users']);

  const semRede = fonteDeConta([], []);
  assert.deepEqual(traduzir('edit_user', 7, [8], semRede, true), [
    CAPACIDADE_NEGADA,
  ]);

  // Editar um super administrador sem ser um: negado, mesmo com a de rede.
  const alvoEhSuperAdmin = fonteDeConta([8], ['manage_network_users']);
  assert.deepEqual(traduzir('edit_user', 7, [8], alvoEhSuperAdmin, true), [
    CAPACIDADE_NEGADA,
  ]);
  // E um super administrador edita outro.
  const ambos = fonteDeConta([7, 8], ['manage_network_users']);
  assert.deepEqual(traduzir('edit_user', 7, [8], ambos, true), ['edit_users']);
});

test('`delete_user` em rede e so de super administrador, e fora dela e `delete_users`', () => {
  const comum = fonteDeConta([], []);
  assert.deepEqual(traduzir('delete_user', 7, [8], comum, false), ['delete_users']);
  assert.deepEqual(traduzir('delete_user', 7, [8], comum, true), [
    CAPACIDADE_NEGADA,
  ]);
  const superAdmin = fonteDeConta([7], []);
  assert.deepEqual(traduzir('delete_user', 7, [8], superAdmin, true), [
    'delete_users',
  ]);
});

test('`remove_user` nega remover a si mesmo a quem nao e super administrador', () => {
  const comum = fonteDeConta([], []);
  assert.deepEqual(traduzir('remove_user', 7, [7], comum, true), [
    CAPACIDADE_NEGADA,
  ]);
  assert.deepEqual(traduzir('remove_user', 7, [8], comum, true), ['remove_users']);
  const superAdmin = fonteDeConta([7], []);
  assert.deepEqual(traduzir('remove_user', 7, [7], superAdmin, true), [
    'remove_users',
  ]);
  // 🔴 E **sem** guarda de rede: a condicao do legado nao consulta
  // `is_multisite()`, ao contrario do que o comentario dele e UC-24 dizem. Ver a
  // nota do cabecalho de `plataforma/autorizacao/traducao-de-conta.ts`.
  assert.deepEqual(traduzir('remove_user', 7, [7], comum, false), [
    CAPACIDADE_NEGADA,
  ]);
});

test('`promote_user` e `add_users` resolvem os dois em `promote_users`', () => {
  const fonte = fonteDeConta([], []);
  assert.deepEqual(traduzir('promote_user', 7, [8], fonte, false), [
    'promote_users',
  ]);
  assert.deepEqual(traduzir('add_users', 7, [], fonte, true), ['promote_users']);
});

test('N6: em rede, `create_users` depende de super admin ou da opcao `add_new_users`', () => {
  const comum = fonteDeConta([], [], false);
  // Fora da rede a capacidade atravessa sem mudanca.
  assert.deepEqual(traduzir('create_users', 7, [], comum, false), ['create_users']);
  // Em rede, sem a opcao e sem ser super admin: negada.
  assert.deepEqual(traduzir('create_users', 7, [], comum, true), [
    CAPACIDADE_NEGADA,
  ]);
  // Com a opcao ligada: passa.
  const comOpcao = fonteDeConta([], [], true);
  assert.deepEqual(traduzir('create_users', 7, [], comOpcao, true), [
    'create_users',
  ]);
  // Super administrador: passa mesmo sem a opcao.
  const superAdmin = fonteDeConta([7], [], false);
  assert.deepEqual(traduzir('create_users', 7, [], superAdmin, true), [
    'create_users',
  ]);
});

test('capacidade que nao e de conta devolve `null` e a consulta segue', () => {
  const caso = casoDeConta(fonteDeConta([], []));
  assert.equal(
    caso({
      capacidade: 'manage_options',
      contaId: 7,
      argumentos: [],
      constantes: {},
      emRede: false,
    }),
    null,
  );
});

/* ═══════════════ `set_role` e `remove_all_caps` ═══════════════ */

test('`set_role` com o papel que a conta ja tem NAO emite comando nenhum', () => {
  const montagem = montar();
  const alvo = montagem.semearConta('bia', 'subscriber');
  limparRegistros(montagem);

  const resultado = definirPapel(
    {
      papeis: montagem.contexto.armazenamento.papeis,
      perfil: montagem.contexto.armazenamento.perfil,
      chaves: montagem.contexto.chaves,
    },
    montagem.matriz,
    alvo,
    'subscriber',
    montagem.contexto.ganchos,
  );

  assert.equal(resultado.aplicado, false);
  assert.deepEqual(resultado.papeisAnteriores, ['subscriber']);
  assert.deepEqual(montagem.banco.escritas, []);
  // E nenhum ponto de extensao dispara.
  assert.deepEqual(montagem.disparos, []);
});

test('`set_role` conserva as capacidades individuais, poe o papel no fim e deriva o nivel', () => {
  const montagem = montar();
  const alvo = montagem.semearConta('bia', 'subscriber');
  const armazenamento = {
    papeis: montagem.contexto.armazenamento.papeis,
    perfil: montagem.contexto.armazenamento.perfil,
    chaves: montagem.contexto.chaves,
  };
  // Uma concessao individual e uma negacao explicita, na ordem gravada.
  armazenamento.papeis.gravarCapacidadesDaConta(alvo, [
    { capacidade: 'subscriber', concedida: true },
    { capacidade: 'manage_options', concedida: true },
    { capacidade: 'unfiltered_html', concedida: false },
  ]);
  limparRegistros(montagem);

  const resultado = definirPapel(
    armazenamento,
    montagem.matriz,
    alvo,
    'editor',
    montagem.contexto.ganchos,
  );

  assert.equal(resultado.aplicado, true);
  assert.deepEqual(
    armazenamento.papeis.obterCapacidadesDaConta(alvo)?.interpretado,
    [
      { capacidade: 'manage_options', concedida: true },
      { capacidade: 'unfiltered_html', concedida: false },
      { capacidade: 'editor', concedida: true },
    ],
  );
  // O nivel sai do mapa FUNDIDO: `editor` tem `level_7` na matriz de fabrica.
  assert.equal(resultado.nivel, 7);
  assert.equal(
    String(
      montagem.banco.metadados.find(
        (linha) =>
          linha.user_id === alvo &&
          linha.meta_key === montagem.contexto.chaves.nivel,
      )?.meta_value,
    ),
    '7',
  );
  // A ordem dos pontos de extensao: remover, acrescentar, definir.
  assert.deepEqual(montagem.disparos, [
    `remove_user_role:${alvo}:subscriber`,
    `add_user_role:${alvo}:editor`,
    `set_user_role:${alvo}:editor`,
  ]);
});

test('`set_role` com papel vazio tira o papel e nao grava nome nenhum', () => {
  const montagem = montar();
  const alvo = montagem.semearConta('bia', 'subscriber');
  const armazenamento = {
    papeis: montagem.contexto.armazenamento.papeis,
    perfil: montagem.contexto.armazenamento.perfil,
    chaves: montagem.contexto.chaves,
  };
  limparRegistros(montagem);

  const resultado = definirPapel(armazenamento, montagem.matriz, alvo, '');

  assert.equal(resultado.aplicado, true);
  assert.deepEqual(
    armazenamento.papeis.obterCapacidadesDaConta(alvo)?.interpretado,
    [],
  );
  assert.equal(resultado.nivel, 0);
  // A conta continua MEMBRO do site: a chave existe, com o mapa vazio.
  assert.equal(
    contaEhMembroDoSite(
      { perfil: armazenamento.perfil, chaves: armazenamento.chaves },
      alvo,
    ),
    true,
  );
});

test('`remove_all_caps` apaga as duas chaves de autorizacao, e so elas', () => {
  const montagem = montar();
  const alvo = montagem.semearConta('bia', 'subscriber');
  const armazenamento = {
    papeis: montagem.contexto.armazenamento.papeis,
    perfil: montagem.contexto.armazenamento.perfil,
    chaves: montagem.contexto.chaves,
  };
  armazenamento.perfil.gravar(alvo, 'first_name', 'Bia');
  limparRegistros(montagem);

  const resultado = removerTodasAsCapacidades(armazenamento, alvo);

  assert.equal(resultado.linhasDeCapacidades, 1);
  assert.deepEqual(
    montagem.banco.escritas.map((consulta) => consulta.parametros[1]),
    [montagem.contexto.chaves.capacidades, montagem.contexto.chaves.nivel],
  );
  // O resto do perfil e a linha de `users` ficam.
  assert.equal(
    montagem.banco.metadados.some(
      (linha) => linha.user_id === alvo && linha.meta_key === 'first_name',
    ),
    true,
  );
  assert.equal(montagem.banco.contas.some((linha) => linha.ID === alvo), true);
});

/* ═══════════════ os papeis editaveis, e o papel inventado ═══════════════ */

test('o ponto de extensao de papeis editaveis pode recusar um papel, e nao alcanca `none`', () => {
  const montagem = montar({
    ganchos: {
      filtrarPapeisEditaveis: (papeis) =>
        papeis.filter((papel) => papel !== 'administrator'),
    },
  });
  const dona = montagem.semearConta('ada', 'administrator');
  const alvo = montagem.semearConta('bia', 'subscriber');
  limparRegistros(montagem);

  const contexto = montagem.comAtorDaConta(dona);
  assert.equal(
    papeisEditaveis(montagem.matriz, contexto.ganchos).includes('administrator'),
    false,
  );

  const recusado = promoverContas(
    { contas: [alvo], papel: 'administrator' },
    contexto,
  );
  assert.equal(recusado.desfecho, 'papel_nao_editavel');
  assert.equal(
    recusado.recusa?.mensagem,
    'Sorry, you are not allowed to give users that role.',
  );

  // `none` entra DEPOIS do filtro, logo o filtro nao consegue remove-lo.
  const semPapel = promoverContas(
    { contas: [alvo], papel: PAPEL_DE_NENHUM_PAPEL },
    contexto,
  );
  assert.equal(semPapel.desfecho, 'concluido');
  assert.deepEqual(papeisDe(contexto, montagem.matriz, alvo), []);
});

test('papel falso para o legado — vazio e `0` — e recusado antes do laco', () => {
  assert.equal(papelEhFalsoNoLegado(''), true);
  assert.equal(papelEhFalsoNoLegado('0'), true);
  assert.equal(papelEhFalsoNoLegado('subscriber'), false);

  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  const alvo = montagem.semearConta('bia', 'subscriber');
  limparRegistros(montagem);

  const resultado = promoverContas(
    { contas: [alvo], papel: '' },
    montagem.comAtorDaConta(dona),
  );
  assert.equal(resultado.desfecho, 'papel_nao_editavel');
  assert.deepEqual(montagem.banco.escritas, []);
});

/* ═══════════ a criacao por administrador: portao e validacao ═══════════ */

test('quem nao tem `promote_users` nao recebe recusa: o papel pedido e IGNORADO', () => {
  const montagem = montar();
  // Um papel que cria conta e nao promove.
  montagem.contexto.armazenamento.papeis.gravarDefinicao([
    ...(montagem.contexto.armazenamento.papeis.obterDefinicao()?.interpretado ??
      []),
    {
      identificador: 'recepcao',
      papel: {
        nome: 'Recepcao',
        capacidades: [{ capacidade: 'create_users', concedida: true }],
      },
    },
  ]);
  const recepcao = montagem.semearConta('rec', 'recepcao');
  limparRegistros(montagem);

  const contexto = montagem.comAtorDaConta(recepcao);
  const matriz = matrizDeAutorizacao(
    contexto.armazenamento.papeis.obterDefinicao()?.interpretado ?? [],
  );
  const resultado = criarContaPorAdministrador(
    {
      login: 'novato',
      email: 'novato@exemplo.invalido',
      senha: 'uma-senha',
      papel: 'administrator',
    },
    { ...contexto, base: { ...contexto.base, matriz } },
  );

  assert.equal(resultado.criada, true);
  if (resultado.criada) {
    // Nao recusou, e nao deu o papel pedido: valeu o padrao da instalacao.
    assert.equal(resultado.papel, 'subscriber');
  }
});

test('a criacao sem `create_users` e recusada antes de qualquer escrita', () => {
  const montagem = montar();
  const assinante = montagem.semearConta('ana', 'subscriber');
  limparRegistros(montagem);

  const resultado = criarContaPorAdministrador(
    { login: 'novato', email: 'novato@exemplo.invalido', senha: 'uma-senha' },
    montagem.comAtorDaConta(assinante),
  );

  assert.equal(resultado.criada, false);
  if (!resultado.criada && resultado.recusa !== null) {
    assert.equal(resultado.recusa.mensagem, 'Sorry, you are not allowed to create users.');
    assert.equal(resultado.recusa.titulo, 'You need a higher level of permission.');
  }
  assert.deepEqual(montagem.banco.escritas, []);
  assert.deepEqual(montagem.enviadas, []);
});

test('os erros do formulario de conta SOMAM, e sao a familia do painel', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  limparRegistros(montagem);

  const resultado = criarContaPorAdministrador(
    { login: '', email: '', senha: '' },
    montagem.comAtorDaConta(dona),
  );

  assert.equal(resultado.criada, false);
  if (!resultado.criada && resultado.motivo === 'dados-recusados') {
    assert.deepEqual(codigosDeErroDaAdministracao(resultado.erro), [
      'user_login',
      'pass',
      'empty_email',
    ]);
    // E o texto do e-mail vazio e o do PAINEL — *"enter"*, nao *"type"*.
    assert.equal(
      resultado.erro.itens[2]?.mensagem,
      '<strong>Error:</strong> Please enter an email address.',
    );
  }
  assert.deepEqual(montagem.banco.escritas, []);
});

test('a senha com barra invertida e recusada, e a confirmacao diferente tambem', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  limparRegistros(montagem);
  const contexto = montagem.comAtorDaConta(dona);

  const comBarra = criarContaPorAdministrador(
    { login: 'novato', email: 'n@exemplo.invalido', senha: 'a\\b' },
    contexto,
  );
  assert.equal(comBarra.criada, false);
  if (!comBarra.criada && comBarra.motivo === 'dados-recusados') {
    assert.equal(
      comBarra.erro.itens[0]?.mensagem,
      '<strong>Error:</strong> Passwords may not contain the character "\\".',
    );
  }

  const diferente = criarContaPorAdministrador(
    {
      login: 'novato',
      email: 'n@exemplo.invalido',
      senha: 'abc',
      confirmacaoDeSenha: 'abd',
    },
    contexto,
  );
  assert.equal(diferente.criada, false);
  if (!diferente.criada && diferente.motivo === 'dados-recusados') {
    assert.deepEqual(codigosDeErroDaAdministracao(diferente.erro), ['pass']);
  }
});

/* ═════════════ o desvinculo fora da rede, e a conta inexistente ═════════════ */

test('fora de uma instalacao de rede, desvincular e recusado com 400', () => {
  const montagem = montar();
  const dona = montagem.semearConta('ada', 'administrator');
  const alvo = montagem.semearConta('bia', 'subscriber');
  limparRegistros(montagem);

  const resultado = removerContasDoSite(
    { contas: [alvo] },
    montagem.comAtorDaConta(dona),
  );

  assert.equal(resultado.desfecho, 'remocao_fora_da_rede');
  assert.equal(resultado.recusa?.mensagem, 'You cannot remove users.');
  assert.equal(resultado.recusa?.codigoHttp, 400);
  assert.deepEqual(montagem.banco.escritas, []);
});

test('em rede, apagar pelo lote e recusado com 400: identidade e poder de rede', () => {
  const montagem = montar({ rede: true, loginsDeSuperAdmin: ['ada'] });
  const dona = montagem.semearConta('ada', 'administrator');
  const alvo = montagem.semearConta('bia', 'subscriber');
  limparRegistros(montagem);

  const resultado = apagarContas(
    { contas: [alvo], escolhas: { [alvo]: { opcao: 'delete' } } },
    montagem.comAtorDaConta(dona),
  );

  assert.equal(resultado.desfecho, 'exclusao_em_rede');
  assert.equal(
    resultado.recusa?.mensagem,
    'User deletion is not allowed from this screen.',
  );
  assert.equal(resultado.recusa?.codigoHttp, 400);
  assert.deepEqual(montagem.banco.escritas, []);
});

/* ═════════════ o conflito REQ-017 continua aberto, e nada aqui o decide ═════════════ */

test('🟢 nada desta tarefa depende do lado do conflito REQ-017', () => {
  // T002 travou a matriz de fabrica num argumento obrigatorio, e T015 provou que a
  // decisao de autorizacao nao olha nivel numerico. Aqui a conta a fechar e outra:
  // a administracao de contas **deriva** o nivel da matriz gravada, e o resultado
  // observavel tem de ser o mesmo nos dois lados para o papel padrao.
  for (const lado of ['legado-integral', 'req-017-sem-niveis'] as const) {
    const banco = bancoEmMemoria();
    const armazenamento = criarArmazenamento(banco.porta);
    const definicao = armazenamento.papeis.semearMatrizDeFabrica(lado);
    const matriz = matrizDeAutorizacao(definicao);
    const contaId = armazenamento.contas.inserir({
      login: 'bia',
      senhaHash: 'x',
      apelido: 'bia',
      email: 'bia@exemplo.invalido',
      url: '',
      registradoEm: '2026-01-01 00:00:00',
      chaveDeAtivacao: '',
      nomeExibido: 'bia',
    });
    armazenamento.papeis.gravarCapacidadesDaConta(contaId, [
      { capacidade: 'subscriber', concedida: true },
    ]);

    const resultado = definirPapel(
      {
        papeis: armazenamento.papeis,
        perfil: armazenamento.perfil,
        chaves: chavesDaAutorizacaoDaConta(banco.porta),
      },
      matriz,
      contaId,
      'editor',
      undefined,
    );

    // O nivel sai da matriz: 7 no lado que tem nivel numerico, 0 no que nao tem.
    assert.equal(resultado.nivel, lado === 'legado-integral' ? 7 : 0);
    // E a DECISAO e a mesma nos dois: o papel gravado e o mesmo, e a permissao
    // que ele concede nao olha nivel.
    const ator: AtorDeAutorizacao = {
      contaId,
      login: 'bia',
      existe: true,
      concessoes:
        armazenamento.papeis.obterCapacidadesDaConta(contaId)?.interpretado ?? [],
    };
    const base: BaseDeAutorizacao = { matriz, rede: REDE_INATIVA_NA_AUTORIZACAO };
    assert.equal(perguntarPermissao(comAtor(base, ator), 'edit_others_posts'), true);
    assert.equal(perguntarPermissao(comAtor(base, ator), 'promote_users'), false);
  }
});
