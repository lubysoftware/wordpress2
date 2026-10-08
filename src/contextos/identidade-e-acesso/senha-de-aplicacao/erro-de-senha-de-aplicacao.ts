/**
 * O erro da credencial de aplicacao: os codigos e as mensagens que o legado emite
 * ao recusar uma emissao ou uma revogacao.
 *
 * Primo de `../cadastro/erro-de-cadastro.ts` e de
 * `../autenticacao/erro-de-autenticacao.ts`, e repete a propriedade que faz
 * daqueles arquivos um porte: **e valor devolvido, nunca excecao**. A tabela
 * *Contratos* de `plan.md` lista o erro desta operacao como erro de operacao, e
 * UC-22 poe os dele na tabela de excecoes do caso de uso — tabela de excecao de caso
 * de uso descreve resposta, nao falha de processo.
 *
 * **Uma diferenca com os dois primos, e ela e do legado:** aqui o erro **nao
 * acumula**. O fluxo de registro soma um erro de login e um de e-mail antes de
 * devolver; este devolve no primeiro motivo e para. Por isso o tipo guarda **um**
 * codigo, e nao uma lista: um tipo com lista convidaria a somar dois motivos que o
 * legado nunca soma.
 *
 * ---
 *
 * ## ⚠️ Divergencia de contagem com a tabela *Contratos*, registrada e nao resolvida
 *
 * `plan.md` lista **um** erro para emitir — *"sem permissao de editar aquela
 * conta"* — e *"idem"* para revogar. O legado emite, nas duas operacoes, erros que
 * essa tabela nao conta: nome vazio, nome repetido, credencial inexistente e falha
 * de gravacao. Esta tarefa fez o que T003 fez quando achou sete codigos onde o
 * pacote contava quatro: **implementou os que o fluxo emite e registrou a
 * divergencia de contagem**, em vez de escolher entre o pacote e o legado. Ver
 * `../autenticacao/erro-de-autenticacao.ts`, item 0 da lista de pontos abertos do
 * `README.md`.
 *
 * E a recusa por **permissao** nao esta nesta lista de codigos, de proposito: no
 * legado ela nao e emitida pela classe que esta tarefa porta, e sim pela camada de
 * rota, que tem codigo proprio (`rest_cannot_*`) e que este pacote nao tem — o slot
 * `framework-http` esta em aberto, como a propria tabela *Contratos* avisa. Ela
 * volta como **motivo** do resultado, do mesmo jeito que a saida sem token corrente
 * volta como `motivo: 'token-inexistente'` em `../sessao/saida.ts`.
 *
 * ## ⚠️ As mensagens reproduzem o legado e fecham contra o oraculo
 *
 * O pacote **nao transcreve nenhuma delas**. Valem as tres regras que
 * `erro-de-cadastro.ts` ja fixou para o caso identico: reproduzir o legado, em
 * **ingles**, porque *"o `msgid` em ingles E a chave do catalogo"* (`EC-05`);
 * nao unificar, nao encurtar e nao revisar; e fechar a conferencia contra o oraculo
 * (`ESC-ORACULO`, BR-MIGRAR-116), que nesta arvore nao existe.
 *
 * O legado carrega tambem, no dado do erro, uma dica de codigo de resposta HTTP para
 * os dois primeiros codigos. Ela **nao** esta aqui: e detalhe da borda que serve a
 * rota, e nenhum documento deste pacote a registra. Quem montar a borda a decide com
 * o oraculo na mao.
 */

/**
 * Os codigos que a emissao e a revogacao emitem.
 *
 * | codigo | de onde vem | qual operacao |
 * |---|---|---|
 * | `application_password_empty_name` | o legado exige nome descritivo (CA-10.5) | emitir |
 * | `application_password_duplicate_name` | o legado recusa nome repetido na mesma conta | emitir |
 * | `application_password_not_found` | UC-22, fluxo *Revogar uma senha*: sem item, nada a apagar | revogar |
 * | `db_error` | a gravacao do metadado nao escreveu | as duas |
 */
export type CodigoDeErroDeSenhaDeAplicacao =
  | 'application_password_empty_name'
  | 'application_password_duplicate_name'
  | 'application_password_not_found'
  | 'db_error';

/**
 * As mensagens, na forma em que o legado as emite. Ver a ressalva do cabecalho.
 *
 * `db_error` tem **duas** mensagens, uma por operacao, e o codigo e o mesmo nas
 * duas — e assim no legado, e e o tipo de detalhe que um porte unifica por engano:
 * quem le o codigo nao distingue a gravacao que falhou, quem le o texto distingue.
 */
export const MENSAGENS_DE_ERRO_DE_SENHA_DE_APLICACAO = {
  application_password_empty_name:
    'An application name is required to create an application password.',
  application_password_duplicate_name: 'Each application name should be unique.',
  application_password_not_found:
    'Could not find an application password with that id.',
  /** A da emissao. */
  db_error: 'Could not save application password.',
  /** A da revogacao, com o mesmo codigo. */
  db_error_na_revogacao: 'Could not delete application password.',
} as const;

/** O erro: um codigo e a mensagem dele. Equivale a um `WP_Error` de um codigo. */
export interface ErroDeSenhaDeAplicacao {
  readonly erroDeSenhaDeAplicacao: true;
  readonly codigo: CodigoDeErroDeSenhaDeAplicacao;
  readonly mensagem: string;
}

/** Monta o erro com a mensagem que o legado emite para aquele codigo. */
export function erroDeSenhaDeAplicacao(
  codigo: CodigoDeErroDeSenhaDeAplicacao,
): ErroDeSenhaDeAplicacao {
  return {
    erroDeSenhaDeAplicacao: true,
    codigo,
    mensagem: MENSAGENS_DE_ERRO_DE_SENHA_DE_APLICACAO[codigo],
  };
}

/** O erro de gravacao da revogacao: mesmo codigo, a outra mensagem. */
export function erroDeGravacaoDaRevogacao(): ErroDeSenhaDeAplicacao {
  return {
    erroDeSenhaDeAplicacao: true,
    codigo: 'db_error',
    mensagem: MENSAGENS_DE_ERRO_DE_SENHA_DE_APLICACAO.db_error_na_revogacao,
  };
}

/** Reconhece o erro no meio de um valor. */
export function ehErroDeSenhaDeAplicacao(
  valor: unknown,
): valor is ErroDeSenhaDeAplicacao {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    (valor as { erroDeSenhaDeAplicacao?: unknown }).erroDeSenhaDeAplicacao ===
      true
  );
}
