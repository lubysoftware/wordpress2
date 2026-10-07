/**
 * O preambulo da entrada: o que o legado faz com o identificador e com a senha
 * **antes** de percorrer a cadeia de autenticacao.
 *
 * Nao e detalhe de implementacao. Dois efeitos observaveis saem daqui:
 *
 * - a senha passa por remocao de espaco nas pontas, logo `" segredo "` entra
 *   como `"segredo"` e **autentica**;
 * - o login passa pela sanitizacao de conta, que consolida espaco interno e
 *   remove octeto codificado e referencia de caractere — logo dois textos
 *   diferentes podem chegar ao MESMO registro, que e o que CA-1.2 cobra por
 *   outro lado.
 *
 * Endurecer qualquer um dos dois produz um sistema mais fechado que o legado,
 * que e exatamente o erro que `target_screens.md` nomeia na secao de validacoes
 * desta tela: *"nenhuma validacao desta secao pode ser endurecida no alvo sem
 * decisao registrada"*.
 */

/**
 * A remocao de acentos da sanitizacao de conta.
 *
 * **Chega por argumento de proposito.** A tabela de equivalencia de caractere e
 * do slot `analise-e-sanitizacao-de-html` do plano — *"porte a mao das duas, com
 * a tabela de referencias de caracteres"* —, vive em `plataforma/` e AD-08
 * recusa dar porta a traducao e a escape por causa da escala (3.416 pontos de
 * entrada). AD-10 resolve a ligacao do outro jeito: *"toda chamada BC→BC e
 * resolvida no momento da chamada"*. Passar a funcao e essa ligacao tardia.
 *
 * Quem passa `(texto) => texto` esta declarando que a instalacao nao remove
 * acento — e isso **diverge** do legado. A divergencia e visivel na assinatura
 * de proposito: um default silencioso aqui seria P1 violado sem ninguem notar.
 */
export type RemocaoDeAcentos = (texto: string) => string;

/**
 * Sanitiza o identificador como a sanitizacao de conta do legado, em modo nao
 * estrito — que e o modo em que a entrada a chama.
 *
 * A ordem dos passos e a do legado, e ela importa: a remocao de acento vem
 * antes da remocao de octeto, e a consolidacao de espaco vem **depois** da
 * remocao de espaco nas pontas.
 *
 * O modo estrito (que reduz a ASCII) **nao** esta aqui: a entrada nao o usa, e
 * quem o usa e o cadastro (US-6 / T013). Escreve-lo antes da tarefa dele seria
 * comportamento sem teste.
 */
export function sanitizarLogin(
  identificador: string,
  removerAcentos: RemocaoDeAcentos,
): string {
  // Remove marcacao. O legado tira as etiquetas inteiras, nao escapa.
  let resultado = identificador.replace(/<[^>]*>/g, '');
  resultado = removerAcentos(resultado);
  // Mata octeto codificado em porcento.
  resultado = resultado.replace(/%[a-fA-F0-9][a-fA-F0-9]/g, '');
  // Mata referencia de caractere.
  resultado = resultado.replace(/&.+?;/g, '');
  resultado = resultado.trim();
  // Consolida espaco contiguo num unico espaco.
  resultado = resultado.replace(/\s+/g, ' ');
  return resultado;
}

/**
 * A remocao de espaco das pontas da senha, que o legado faz antes da cadeia.
 *
 * Existe como funcao nomeada, e nao como `.trim()` solto no meio do fluxo,
 * porque e **regra**: ela decide que `" segredo "` autentica. Um porte que
 * compare a senha crua recusa uma senha que o legado aceita.
 */
export function prepararSenha(senha: string): string {
  return senha.trim();
}

/**
 * Reconhece um endereco de e-mail como o legado reconhece.
 *
 * E o desvio que faz CA-1.2 funcionar: o autenticador por e-mail **desiste sem
 * erro** quando o identificador nao e um e-mail, e deixa o valor seguir a
 * cadeia. Sem isso, um login que nao e e-mail produziria erro de e-mail
 * invalido no lugar do erro de login inexistente, e as duas mensagens que
 * `ESC-ENUMERACAO` manda distinguir trocariam de lugar.
 *
 * As regras sao as do legado, na ordem dele, e cada uma delas aceita coisa que
 * um validador moderno recusaria. Isso e proposital: a lista de recusa do
 * legado termina aqui, e endurecer fecha o sistema.
 */
export function ehEmail(valor: string): boolean {
  // O menor e-mail possivel tem 6 caracteres.
  if (valor.length < 6) {
    return false;
  }

  // Tem de haver arroba depois da primeira posicao.
  const posicaoDoArroba = valor.indexOf('@', 1);
  if (posicaoDoArroba === -1) {
    return false;
  }

  const local = valor.slice(0, posicaoDoArroba);
  let dominio = valor.slice(posicaoDoArroba + 1);

  if (!/^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+$/.test(local)) {
    return false;
  }

  // Sequencia de dois pontos no dominio.
  if (/\.{2,}/.test(dominio)) {
    return false;
  }

  // O legado remove espaco, nulo e ponto das pontas do dominio.
  dominio = dominio.replace(/^[ \t\n\r\0\x0B.]+|[ \t\n\r\0\x0B.]+$/g, '');

  const partes = dominio.split('.');
  if (partes.length < 2) {
    return false;
  }

  for (const parte of partes) {
    const limpa = parte.replace(/^[ \t\n\r\0\x0B-]+|[ \t\n\r\0\x0B-]+$/g, '');
    if (limpa === '') {
      return false;
    }
    if (!/^[a-z0-9-]+$/i.test(limpa)) {
      return false;
    }
  }

  return true;
}
