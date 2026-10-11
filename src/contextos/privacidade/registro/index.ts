/**
 * O registro de provedores de dado pessoal — tarefa **T001** da feature
 * `008-privacidade-e-dados-pessoais`.
 *
 * Duas coisas moram aqui: a **forma** de um provedor, que e o contrato dos dois
 * pontos de extensao do legado (`./provedor-de-dado-pessoal.ts`), e o
 * **registro** que os guarda na ordem em que entraram
 * (`./registro-de-provedores.ts`). Percorre-los e de T011 (US-5) e T013 (US-6).
 */

export type {
  ApagadorDeDadoPessoal,
  CampoExportado,
  DadoExportado,
  ExportadorDeDadoPessoal,
  FalhaDoProvedor,
  PaginaApagada,
  PaginaExportada,
  RespostaDeApagamento,
  RespostaDeExportacao,
} from './provedor-de-dado-pessoal.js';

export type {
  ApagadorRegistrado,
  ExportadorRegistrado,
  RegistroDeProvedores,
} from './registro-de-provedores.js';

export { criarRegistroDeProvedores } from './registro-de-provedores.js';
