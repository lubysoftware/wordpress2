/**
 * A fatia de `AGG-Conta` que US-1 le, e as duas unicas consultas que ela faz.
 *
 * > ⚠️ **T002 e a dona da forma de armazenamento de conta**, e T002 nao fechou
 * > quando T003 foi escrita (`tasks.md` poe T002 antes, e a linha dela segue
 * > `[ ]`). Este arquivo e a **fatia minima** que CA-1.2 e CA-1.3 exigem — ler a
 * > conta pelo login e pelo e-mail, e apagar a chave de ativacao —, escrita
 * > contra a `PortaDeDados` de T001 e com as colunas que
 * > `target_data_model.md` declara. Quando T002 entrar, ela absorve este
 * > arquivo: a forma e dela, o comportamento de entrada e desta tarefa. Nada
 * > aqui serializa valor, e por isso nada aqui depende do codec de
 * > `serialize()` (`DB-SER`), que e da fronteira do banco.
 *
 * Tres coisas que este arquivo faz porque o legado faz:
 *
 * 1. **A unicidade de `user_login` e de `user_email` nao e do banco.**
 *    `target_data_model.md` e literal: *"`users.user_login` nao e unico no banco
 *    (e so `KEY`)"*, e BR-MIGRAR-022 poe a conferencia em codigo. REQ-010, que
 *    pediria a restricao, esta `bloqueado` e `plan.md` e explicito em **nao**
 *    declara-la. Logo a leitura toma a **primeira** linha, como o legado.
 * 2. **`users.user_status` nao e lida nem escrita.** E coluna morta
 *    (`DB-DEAD`, BR-MIGRAR-086: *"o nucleo nunca escreve nada nela"*), e
 *    inventar significado para ela seria inventar comportamento.
 * 3. **`spam` e `deleted` so existem na variante de rede.**
 *    `target_data_model.md` marca as duas linhas do DDL com *"AS DUAS LINHAS
 *    ABAIXO EXISTEM SOMENTE NA VARIANTE MULTISITE"*, e `plan.md` diz que o
 *    modelo novo precisa das duas variantes. Por isso elas chegam opcionais.
 */

import type {
  LinhaDeResultado,
  PortaDeDados,
} from '../portas/index.js';

/**
 * A conta, na fatia que a entrada le.
 *
 * Nao e `AGG-Conta` inteira: perfil, papel e senha de aplicacao entram nas
 * tarefas delas. Os nomes das colunas do legado ficam visiveis de proposito —
 * `target_domain_model.md` mapeia `Conta` 1-para-1 com `users`, e um nome
 * traduzido aqui esconderia qual coluna alimenta qual decisao.
 */
export interface Conta {
  readonly id: number;
  /** `users.user_login`, imutavel. */
  readonly login: string;
  /** `users.user_pass`: o hash, nunca a senha. */
  readonly senhaHash: string;
  /** `users.user_email`. */
  readonly email: string;
  /** `users.user_nicename`: o identificador do autor na URL. */
  readonly apelido: string;
  /** `users.display_name`. */
  readonly nomeExibido: string;
  /**
   * `users.user_activation_key`, com o instante prefixado quando foi emitida
   * por um pedido de redefinicao (BR-MIGRAR-024). Vazia quando nao ha nenhuma
   * pendente — o DDL usa `default ''`, nao `NULL`, e `DB-SENT` registra que o
   * esquema evita `NULL` e usa sentinelas.
   */
  readonly chaveDeAtivacao: string;
  /** `users.spam`, so na variante de rede. */
  readonly marcadaComoSpam?: boolean;
  /** `users.deleted`, so na variante de rede. */
  readonly marcadaComoApagada?: boolean;
}

/** As colunas que as consultas desta tarefa pedem, na ordem do DDL. */
const COLUNAS =
  'ID, user_login, user_pass, user_email, user_nicename, user_activation_key, display_name';

function texto(linha: LinhaDeResultado, coluna: string): string {
  const valor = linha[coluna];
  if (typeof valor === 'string') {
    return valor;
  }
  if (typeof valor === 'number') {
    return String(valor);
  }
  if (valor instanceof Uint8Array) {
    return Buffer.from(valor).toString('utf8');
  }
  return '';
}

/**
 * Le a bandeira de rede como o legado a le: a coluna e `tinyint` e o legado
 * compara com `'1'` sem exigir tipo, logo `1` e `'1'` valem o mesmo. Ausente
 * significa instalacao de site unico, nao "falso gravado".
 */
function bandeiraDeRede(
  linha: LinhaDeResultado,
  coluna: string,
): boolean | undefined {
  const valor = linha[coluna];
  if (valor === undefined || valor === null) {
    return undefined;
  }
  return texto(linha, coluna) === '1';
}

function contaDaLinha(linha: LinhaDeResultado): Conta {
  const spam = bandeiraDeRede(linha, 'spam');
  const apagada = bandeiraDeRede(linha, 'deleted');

  return {
    id: Number(linha['ID'] ?? 0),
    login: texto(linha, 'user_login'),
    senhaHash: texto(linha, 'user_pass'),
    email: texto(linha, 'user_email'),
    apelido: texto(linha, 'user_nicename'),
    nomeExibido: texto(linha, 'display_name'),
    chaveDeAtivacao: texto(linha, 'user_activation_key'),
    ...(spam === undefined ? {} : { marcadaComoSpam: spam }),
    ...(apagada === undefined ? {} : { marcadaComoApagada: apagada }),
  };
}

/**
 * As duas leituras e a escrita que a entrada precisa.
 *
 * A interface existe para que T002 troque a implementacao sem tocar na cadeia
 * de autenticacao — e e tambem o que `plan.md` chama de "a camada de dados e a
 * unica porta para o banco".
 */
export interface LeituraDeConta {
  /** `get_user_by( 'login', ... )`. */
  porLogin(login: string): Conta | null;
  /** `get_user_by( 'email', ... )`. */
  porEmail(email: string): Conta | null;
  /**
   * Apaga a chave de redefinicao pendente da conta (CA-1.4, BR-MIGRAR-024).
   *
   * Grava a sentinela vazia, nao `NULL`: `DB-SENT` registra que o esquema evita
   * `NULL`, e o DDL desta coluna e `NOT NULL default ''`.
   */
  apagarChaveDeAtivacao(idDaConta: number): void;
}

/**
 * Monta a leitura de conta sobre a porta de dados.
 *
 * O prefixo vem da porta porque ele carrega o identificador do site
 * (BR-MIGRAR-088) — mas `users` e `usermeta` sao as **duas tabelas de escopo
 * global** do legado (`target_data_model.md`: *"ESCOPO GLOBAL -- 2 tabelas,
 * sempre no prefixo base, sem numero de site"*), logo aqui o prefixo e o base e
 * nao leva numero de site. Quem compoe a porta e quem garante isso.
 */
export function criarLeituraDeConta(dados: PortaDeDados): LeituraDeConta {
  const tabela = `${dados.prefixoDeTabela}users`;

  function primeira(coluna: 'user_login' | 'user_email', valor: string): Conta | null {
    const linhas = dados.selecionar({
      texto: `SELECT ${COLUNAS} FROM ${tabela} WHERE ${coluna} = ? LIMIT 1`,
      parametros: [valor],
    });

    const linha = linhas[0];
    return linha === undefined ? null : contaDaLinha(linha);
  }

  return {
    porLogin(login) {
      return primeira('user_login', login);
    },

    porEmail(email) {
      return primeira('user_email', email);
    },

    apagarChaveDeAtivacao(idDaConta) {
      dados.escrever({
        texto: `UPDATE ${tabela} SET user_activation_key = ? WHERE ID = ?`,
        parametros: ['', idDaConta],
      });
    },
  };
}
