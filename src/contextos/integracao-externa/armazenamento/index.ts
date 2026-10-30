/**
 * Armazenamento do modulo de integracao externa. Nasce em **T007** (US-3), com
 * o unico acesso ao banco que a precedencia de credencial precisa: ler uma
 * opcao do site. Ver o cabecalho de `./opcao.ts` para o recorte de
 * `get_option()` e o que fica para `REG-Opcao`.
 */

export {
  aparaComoPhp,
  lerOpcao,
  tabelaDeOpcoes,
  OPCAO_AUSENTE,
  OPCAO_COM_NOME_RECUSADO,
  type LeituraDeOpcao,
} from './opcao.js';

export {
  criarPortaDeDadosFalsa,
  type OpcoesDaPortaDeDadosFalsa,
  type PortaDeDadosFalsa,
} from './porta-falsa.js';
