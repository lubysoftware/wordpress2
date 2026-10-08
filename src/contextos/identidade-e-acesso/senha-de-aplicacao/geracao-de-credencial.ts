/**
 * Como a credencial de aplicacao nasce: os **24 caracteres**, o identificador e a
 * forma em que o segredo e exibido.
 *
 * Entrega de **T021** (US-10), e o ponto em que CA-10.1 e CA-10.2 deixam de ser
 * promessa: *"a credencial e gerada pelo sistema com 24 caracteres e apenas o hash
 * e guardado"*, *"o segredo em claro e exibido uma unica vez e nao e recuperavel
 * depois"*. A regra `U6` (BR-MIGRAR-026) e a mesma frase do lado do catalogo:
 * *"credencial de segunda classe por desenho: 24 caracteres gerados, guardados com
 * hash em metadado"*.
 *
 * **Nenhuma funcao deste arquivo guarda, registra ou devolve o segredo duas
 * vezes.** O segredo existe como valor de retorno de {@link gerarSenhaDeAplicacao},
 * atravessa o resumo e e descartado pela operacao que o emitiu. CA-10.2 nao e
 * conferida por teste de ausencia: ela e conferida por nao haver, em lugar algum
 * deste modulo, caminho que leia o segredo do armazenamento — porque o
 * armazenamento nunca o recebe.
 */

import { randomUUID } from 'node:crypto';

import {
  ALEATORIEDADE_DO_RUNTIME,
  ALFABETO_DE_SEGREDO,
  gerarSegredo,
  type FonteDeAleatoriedade,
} from '../cadastro/geracao-de-segredo.js';

/**
 * O comprimento da credencial, no valor de fabrica do legado: 24 caracteres.
 *
 * Ponto de configuracao nomeado, como o **P6** exige. E o **unico** numero desta
 * feature que o pacote fixa para uma credencial — `chave-de-redefinicao.ts` ja o
 * registrou de fora: *"o pacote fixa o comprimento de **uma** credencial desta
 * feature, a senha de aplicacao (24 caracteres, `U6`/BR-MIGRAR-026)"* —, e ele vem
 * de tres lugares que concordam: CA-10.1, `U6` e a ancora
 * `class-wp-application-passwords.php:42`.
 *
 * **Nao e filtravel, e isso e diferente dos prazos.** No legado o comprimento e uma
 * constante de classe lida direto na chamada que gera, sem ponto de extensao pelo
 * caminho — ao contrario do prazo da chave de redefinicao, que passa por um filtro
 * antes de ser comparado. Por isso ele e argumento com valor padrao e nao campo de
 * contexto: quem compoe pode mudar, quem estende nao.
 */
export const COMPRIMENTO_DA_SENHA_DE_APLICACAO = 24;

/**
 * Com que funcao o segredo e resumido para ser gravado.
 *
 * ⚠️ **Obrigatorio e sem valor padrao**, e a ausencia de padrao e a mensagem — a
 * mesma decisao que `../redefinicao-de-senha/chave-de-redefinicao.ts` tomou para o
 * resumo da chave, pela mesma razao: **o pacote nao nomeia o algoritmo**.
 * BR-MIGRAR-026 diz *"guardados com hash em metadado"* e para ai; o slot
 * `hash-de-senha` de `plan.md` descreve o hash da **senha da conta** — bcrypt com
 * HMAC e o prefixo `$wp` —, e o legado nao usa o mesmo caminho para credencial
 * gerada de alta entropia, que e justamente por isso que ela e *"de segunda
 * classe"*. Escolher aqui seria divergir em silencio, e o **P1** pede decisao
 * humana registrada para divergir.
 *
 * O que fecha a conta e o oraculo (`ESC-ORACULO`). Enquanto ele nao existir, a
 * escolha e da composicao e fica legivel onde foi feita — e `GeradorDeHashDeSenha`
 * de `../autenticacao/geracao-de-hash-de-senha.ts` satisfaz esta forma, para a
 * composicao que decidir usar o mesmo hash da conta.
 *
 * **Nao ha `conferir` nesta interface, e e de proposito:** quem confere a
 * credencial apresentada e a autenticacao por credencial de aplicacao, que e
 * `REQ-012` e esta em `do-not-rewrite.md`. Declarar aqui metade da superficie dela
 * seria construi-la pela metade.
 */
export interface ResumoDaSenhaDeAplicacao {
  /** O resumo a gravar. O segredo em claro nao e devolvido a lugar nenhum. */
  gerar(segredo: string): string;
}

/**
 * O identificador da credencial — `uuid`, e a entrada da revogacao.
 *
 * Por argumento pelo mesmo motivo da aleatoriedade em
 * `../cadastro/geracao-de-segredo.ts`: *"um sorteio lido de dentro nao tem como ser
 * afirmado"*. O valor de fabrica e o gerador do runtime, que produz a mesma forma
 * do legado — 36 caracteres, minusculas, com os quatro hifens e a versao 4 na
 * posicao que o formato fixa.
 */
export type GeradorDeIdentificadorDeCredencial = () => string;

/** O identificador de fabrica: o gerador de UUID do runtime. */
export const IDENTIFICADOR_DO_RUNTIME: GeradorDeIdentificadorDeCredencial = () =>
  randomUUID();

/**
 * Gera o segredo da credencial: 24 caracteres do alfabeto **sem** caractere
 * especial.
 *
 * O alfabeto nao e redeclarado aqui: e o mesmo
 * {@link ALFABETO_DE_SEGREDO} que o cadastro usa, porque no legado e **a mesma
 * funcao** — a geracao de segredo com os caracteres especiais desligados — chamada
 * com outro comprimento. O arquivo dela mora em `cadastro/` por ter nascido em
 * T013; o que ela declara vale para as tres chamadas desta feature, e o proprio
 * cabecalho dela avisa que *"o alfabeto e regra, nao detalhe"*. Redeclara-lo aqui
 * criaria dois alfabetos que ninguem garantiria iguais.
 */
export function gerarSenhaDeAplicacao(
  aleatorio: FonteDeAleatoriedade = ALEATORIEDADE_DO_RUNTIME,
  comprimento: number = COMPRIMENTO_DA_SENHA_DE_APLICACAO,
): string {
  return gerarSegredo(comprimento, aleatorio, ALFABETO_DE_SEGREDO);
}

/** Em quantos caracteres o segredo e agrupado para ser lido por uma pessoa. */
export const TAMANHO_DO_GRUPO_DE_EXIBICAO = 4;

/**
 * O segredo na forma em que o legado o **exibe**: grupos de quatro, separados por
 * espaco.
 *
 * ⚠️ **O pacote nao registra este agrupamento**, e ele esta aqui por dois motivos
 * que se somam: o legado o publica como operacao da mesma classe que esta tarefa
 * porta, logo o **P8** o poe fora do alcance de quem codifica (*"nao remova funcao,
 * constante, tabela, rota, superficie nem comportamento publicado"*); e e esta
 * forma, e nao o segredo cru, que a resposta da rota de criacao devolve no legado —
 * logo o agrupamento e observavel por quem integra, e nao enfeite de tela.
 *
 * **Nao e aplicado pela emissao.** {@link ResultadoDaEmissao} devolve o segredo
 * como ele foi gerado, e quem exibe decide. Aplica-lo dentro da operacao faria o
 * valor devolvido depender de uma decisao de apresentacao que o pacote nao
 * registra; deixa-lo de fora perderia a superficie. A funcao existe, nomeada, e a
 * conferencia de quem a chama fecha contra o oraculo (`ESC-ORACULO`).
 *
 * O corte de tudo que nao e letra nem digito e do legado e **nao** e defensivo: e
 * ele que faz o caminho de volta aceitar o segredo colado com os espacos, no
 * consumo que `REQ-012` faria.
 */
export function agruparSenhaDeAplicacao(segredo: string): string {
  const alfanumerico = segredo.replace(/[^a-zA-Z0-9]/g, '');
  const grupos: string[] = [];
  for (
    let inicio = 0;
    inicio < alfanumerico.length;
    inicio += TAMANHO_DO_GRUPO_DE_EXIBICAO
  ) {
    grupos.push(
      alfanumerico.slice(inicio, inicio + TAMANHO_DO_GRUPO_DE_EXIBICAO),
    );
  }
  return grupos.join(' ');
}
