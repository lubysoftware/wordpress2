/**
 * A costura de ligacao tardia entre a decisao, que fica embaixo, e o dado do
 * papel, que fica em BC-05.
 *
 * O README de `contextos/identidade-e-acesso/` previu este arquivo ao fechar
 * T001: *"a regra de dependencia 2 proibe `plataforma/` importar `contextos/`.
 * Logo T015 vai precisar de uma costura de ligacao tardia entre a decisao, que
 * fica embaixo, e o dado do papel, que fica aqui."* E esta e ela: uma interface
 * **declarada embaixo** e **implementada em cima**, pelo adaptador de
 * `contextos/identidade-e-acesso/autorizacao/`.
 *
 * Tres metodos, e nenhum a mais. O que a decisao precisa de fora e sempre a mesma
 * coisa: o que a conta tem gravado, quem a conta e, e a unica busca que o
 * armazenamento alcanca.
 *
 * **E sincrona**, como todo `plataforma/`: AD-04 fixa a fronteira de `await` em
 * `adaptadores/`. Quem fala protocolo de banco resolve a I/O antes, ou expoe
 * fachada sincrona sobre dado ja carregado.
 */

import type { ConcessaoDeCapacidade } from './capacidade.js';
import {
  ATOR_ANONIMO,
  type AtorDeAutorizacao,
} from './contexto-de-autorizacao.js';

export interface FonteDeAutorizacao {
  /**
   * O conteudo da chave `{site}capabilities` daquela conta, na ordem gravada —
   * papel e capacidade individual no mesmo mapa (`PERM-2`).
   */
  concessoesDaConta(contaId: number): readonly ConcessaoDeCapacidade[];

  /**
   * O `user_login` daquela conta, ou `null` quando a conta nao existe.
   *
   * O login, e nao o identificador, porque **super administrador e nome de login
   * numa lista de rede** (`PERM-9`). Fora de rede nada o consulta.
   */
  loginDaConta(contaId: number): string | null;

  /**
   * As contas cujo valor serializado de `{site}capabilities` contem aquele nome —
   * papel **ou** capacidade, porque os dois vivem no mesmo mapa.
   *
   * E a unica busca que o legado tem para esta pergunta, e ela e por texto com
   * curinga sobre valor serializado: *"nenhuma consulta SQL responde 'quem e
   * administrador aqui'"* (`PERM-2`, pegadinha 5 de `permissions.md`). O plano
   * desta feature autoriza normalizar o armazenamento por baixo e proibe mudar o
   * que a interface de papeis devolve; esta assinatura e o que sobra quando as
   * duas coisas valem ao mesmo tempo.
   */
  contasComNomeNasCapacidades(nome: string): readonly number[];
}

/**
 * Monta o ator a partir da fonte.
 *
 * `contaId` igual a zero devolve {@link ATOR_ANONIMO} sem tocar a fonte: no
 * legado a requisicao sem autenticacao tem um usuario de `ID` 0 que nunca e
 * buscado no banco.
 *
 * A existencia e deduzida do login: o legado responde `exists()` por haver linha
 * em `users`, e e a leitura do login que diz se ela ha.
 */
export function atorDeAutorizacao(
  contaId: number,
  fonte: FonteDeAutorizacao,
): AtorDeAutorizacao {
  if (contaId === 0) {
    return ATOR_ANONIMO;
  }

  const login = fonte.loginDaConta(contaId);
  if (login === null) {
    return { contaId, login: '', existe: false, concessoes: [] };
  }

  return {
    contaId,
    login,
    existe: true,
    concessoes: fonte.concessoesDaConta(contaId),
  };
}
