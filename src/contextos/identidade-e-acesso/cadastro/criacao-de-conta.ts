/**
 * A criacao da conta: a fatia de `AGG-Conta`.`registrar` que grava a linha de
 * `users` e da a ela o papel padrao.
 *
 * E a segunda metade de UC-21, passo 4 — *"Sistema cria a conta com o papel padrao e
 * gera a senha"* —, e esta separada de `cadastrar.ts` porque no legado sao **duas
 * funcoes**, com validacoes proprias e uma fronteira entre elas que descarta
 * informacao. Fundi-las esconderia exatamente o que
 * {@link erroQueOVisitanteVe} documenta.
 *
 * As quatro validacoes desta metade sao as de `U2` e `U3`, com as ancoras que
 * BR-MIGRAR-022 e BR-MIGRAR-023 citam, **na ordem das linhas**:
 *
 * | ordem | ancora | o que confere | codigo |
 * |---|---|---|---|
 * | 1 | — | login vazio | `empty_user_login` |
 * | 2 | `wp-includes/user.php:2318` | login acima do limite | `user_login_too_long` |
 * | 3 | `wp-includes/user.php:2325` | login duplicado | `existing_user_login` |
 * | 4 | `wp-includes/user.php:2336` | login na lista de proibidos | `invalid_username` |
 * | 5 | `wp-includes/user.php:2347` | apelido acima do limite | `user_nicename_too_long` |
 * | 6 | — | e-mail duplicado | `existing_user_email` |
 *
 * **A ordem e observavel** porque cada uma devolve na hora, sem somar: um login de
 * 61 caracteres que tambem esteja duplicado devolve `user_login_too_long` e nunca
 * chega a consultar o banco. A suite afirma isso pelo numero de consultas emitidas.
 *
 * ⚠️ **Duas destas seis sao inalcancaveis pelo cadastro aberto, e existem de
 * proposito.** As conferencias 3, 4 e 6 **repetem** o que `cadastrar.ts` ja fez —
 * sao duas conferencias do mesmo fato em dois lugares do legado, nao um erro de
 * leitura. Elas ficam porque esta funcao e tambem o caminho da criacao por
 * administrador (`criarPorAdministrador`, de T023) e porque o **P8** nao deixa
 * remover superficie: *"nao remova funcao, constante, tabela, rota, superficie nem
 * comportamento publicado"*.
 *
 * ## O que esta funcao NAO grava, e esta declarado
 *
 * O legado, ao criar uma conta, grava mais linhas de `usermeta` do que estas duas —
 * um bloco de preferencias de perfil (apelido de exibicao, nome, sobrenome,
 * descricao, editor visual, realce de sintaxe, atalhos de comentario, cor do painel,
 * uso de TLS, barra no site, idioma) e, **somente no cadastro aberto**, o marcador de
 * aviso de senha padrao.
 *
 * **Nenhuma delas esta aqui**, e a razao e que o pacote nao as registra em lugar
 * nenhum: `target_data_model.md` descreve `usermeta` como chave e valor sem catalogar
 * chave alguma de perfil, o *Modelo de dados* de `plan.md` nomeia **uma** chave desta
 * tabela (`{prefixo}capabilities`) e as pos-condicoes de UC-21 declaram **duas**
 * coisas, nenhuma delas uma linha de perfil: *"existe uma conta com o papel padrao e
 * sem senha definida pelo titular"* e *"ha uma chave de definicao de senha valida por
 * 24 horas"*.
 *
 * O criterio desta area e **efeito no banco** (Decisao 2 de `parity_specs.md`), logo
 * a ausencia dessas linhas e divergencia a conferir — nao e escolha de desenho. Ela
 * esta aqui, na nota de entrega de T013 do `README.md`, e fecha contra o oraculo
 * (`ESC-ORACULO`): inventar nome e valor de onze chaves que nenhum documento deste
 * pacote nomeia inventaria onze bytes gravados.
 */

import type { RepositorioDeContas } from '../armazenamento/conta.js';
import type { RepositorioDePapeis } from '../armazenamento/repositorio-de-papeis.js';
import type { RemocaoDeAcentos } from '../autenticacao/normalizacao-de-credencial.js';
import { sanitizarLogin } from '../autenticacao/normalizacao-de-credencial.js';
import type { GeradorDeHashDeSenha } from '../autenticacao/geracao-de-hash-de-senha.js';
import {
  atribuirPapel,
  type ResultadoDaAtribuicaoDePapel,
} from './atribuicao-de-papel.js';
import type { LimitesDoCadastro } from './configuracao-de-cadastro.js';
import {
  erroDeCadastro,
  MENSAGENS_DE_ERRO_DE_CADASTRO,
  type CodigoDeErroDeCadastro,
  type ErroDeCadastro,
} from './erro-de-cadastro.js';
import {
  apelidoDoLogin,
  excedeComprimento,
  loginEstaProibido,
  type ApelidoDeTexto,
} from './validacao-de-cadastro.js';

/**
 * O comprimento da data textual do banco: `AAAA-MM-DD HH:MM:SS`, 19 caracteres.
 *
 * E o corte que descarta o milissegundo e o `Z` do formato do runtime. O legado nao
 * tem fracao de segundo nesta coluna, e acrescenta-la mudaria o byte gravado.
 */
const TAMANHO_DA_DATA_DO_BANCO = 19;

/**
 * O instante corrente no formato textual de `user_registered`, em UTC.
 *
 * **E texto, e e literal**, nao um tipo de data deste runtime: `DB-SENT` registra que
 * a coluna guarda a cadeia no formato do banco e que a sentinela
 * `'0000-00-00 00:00:00'` **carrega significado de negocio**, e
 * `../armazenamento/conta.ts` repete — *"converter para nulo, ou para um tipo de data
 * deste runtime, perde o significado e muda o byte gravado"*.
 *
 * O fuso e UTC porque o legado monta esta coluna com a funcao de data **em UTC**, e
 * nao com o fuso da instalacao: `target_data_model.md` descreve `user_registered`
 * como *"em UTC"*. Montar com o fuso local gravaria outro byte.
 */
export function dataDoBanco(agoraEmSegundos: number): string {
  return new Date(agoraEmSegundos * 1000)
    .toISOString()
    .slice(0, TAMANHO_DA_DATA_DO_BANCO)
    .replace('T', ' ');
}

/** O que se informa para criar a conta. */
export interface DadosDaContaACriar {
  /** O login ja sanitizado em modo nao estrito por quem chamou. */
  readonly login: string;
  readonly email: string;
  /** A senha em claro, que **nao** e gravada: so o hash dela. */
  readonly senhaEmClaro: string;
}

/** O que a criacao precisa, fora dos dados. */
export interface ColaboradoresDaCriacaoDeConta {
  readonly contas: RepositorioDeContas;
  readonly papeis: RepositorioDePapeis;
  readonly limites: LimitesDoCadastro;
  readonly papelPadrao: string;
  readonly loginsProibidos: readonly string[];
  readonly removerAcentos: RemocaoDeAcentos;
  readonly apelidoDeTexto: ApelidoDeTexto;
  readonly geradorDeHashDeSenha: GeradorDeHashDeSenha;
  readonly agoraEmSegundos: number;
}

export type ResultadoDaCriacaoDeConta =
  | {
      readonly criada: true;
      readonly contaId: number;
      readonly login: string;
      readonly apelido: string;
      readonly registradoEm: string;
      readonly papel: ResultadoDaAtribuicaoDePapel;
    }
  | { readonly criada: false; readonly erro: ErroDeCadastro };

/**
 * Cria a conta e lhe da o papel padrao (CA-6.4).
 *
 * **Nao lanca.** A recusa volta como valor, pelo mesmo motivo de `autenticar` e de
 * `cadastrar`: os contratos de `plan.md` chamam a falha desta familia de *"estado
 * reportavel e nao excecao"*.
 *
 * ⚠️ **A senha em claro nao e gravada em lugar nenhum**, e isso e CA-1.3 valendo
 * tambem para a criacao. Ela entra, vira hash e nao aparece no resultado: um porte
 * que a devolvesse para "conveniencia de teste" a poria em todo registro de quem
 * logar o retorno.
 */
export function criarConta(
  dados: DadosDaContaACriar,
  colaboradores: ColaboradoresDaCriacaoDeConta,
): ResultadoDaCriacaoDeConta {
  // O legado sanitiza o login em modo ESTRITO antes de gravar. Para o cadastro
  // aberto isto nao muda nada — `cadastrar.ts` so chega aqui com login que a
  // comparacao estrita aprovou —, e muda para quem cria conta por outro caminho.
  const login = sanitizarLogin(dados.login, colaboradores.removerAcentos, true);

  if (login === '') {
    return recusa('empty_user_login', MENSAGENS_DE_ERRO_DE_CADASTRO.empty_user_login);
  }

  if (excedeComprimento(login, colaboradores.limites.comprimentoMaximoDeLogin)) {
    return recusa(
      'user_login_too_long',
      MENSAGENS_DE_ERRO_DE_CADASTRO.user_login_too_long,
    );
  }

  if (colaboradores.contas.obterPorLogin(login) !== null) {
    return recusa(
      'existing_user_login',
      MENSAGENS_DE_ERRO_DE_CADASTRO.existing_user_login,
    );
  }

  if (loginEstaProibido(login, colaboradores.loginsProibidos)) {
    return recusa(
      'invalid_username',
      MENSAGENS_DE_ERRO_DE_CADASTRO.invalid_username_na_criacao,
    );
  }

  const apelido = apelidoDoLogin(
    login,
    colaboradores.apelidoDeTexto,
    colaboradores.removerAcentos,
  );

  if (
    excedeComprimento(apelido, colaboradores.limites.comprimentoMaximoDeApelido)
  ) {
    return recusa(
      'user_nicename_too_long',
      MENSAGENS_DE_ERRO_DE_CADASTRO.user_nicename_too_long,
    );
  }

  if (colaboradores.contas.obterPorEmail(dados.email) !== null) {
    return recusa(
      'existing_user_email',
      MENSAGENS_DE_ERRO_DE_CADASTRO.existing_user_email,
    );
  }

  const registradoEm = dataDoBanco(colaboradores.agoraEmSegundos);

  const contaId = colaboradores.contas.inserir({
    login,
    senhaHash: colaboradores.geradorDeHashDeSenha.gerar(dados.senhaEmClaro),
    apelido,
    email: dados.email,
    // `user_url` nasce vazia: o cadastro aberto nao pede endereco, e o DDL usa a
    // cadeia vazia como padrao (`DB-SENT`: o esquema evita `NULL`).
    url: '',
    registradoEm,
    // Sem chave de ativacao na insercao. Ela e gravada depois, pela notificacao,
    // como no legado — ver `notificacao-de-conta-nova.ts`.
    chaveDeAtivacao: '',
    // O nome exibido nasce igual ao login, como no legado.
    nomeExibido: login,
  });

  const papel = atribuirPapel(
    colaboradores.papeis,
    contaId,
    colaboradores.papelPadrao,
  );

  return { criada: true, contaId, login, apelido, registradoEm, papel };
}

function recusa(
  codigo: CodigoDeErroDeCadastro,
  mensagem: string,
): { readonly criada: false; readonly erro: ErroDeCadastro } {
  return { criada: false, erro: erroDeCadastro({ codigo, mensagem }) };
}
