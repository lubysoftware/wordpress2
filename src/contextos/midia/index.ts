/**
 * Modulo de midia — BC-04 de `target_architecture.md`.
 *
 * Feature `006-biblioteca-de-midia`, tarefas fechadas **T001**, **T002**,
 * **T003**, **T005**, **T007** e **T019**. O que existe aqui e o que as seis
 * entregam: T001, *"o modulo carrega com as portas de dados, de sistema de
 * arquivos e de processamento de imagem declaradas, e os tamanhos de fabrica do
 * legado registrados como dado"*; T002, *"o anexo existe como registro de
 * conteudo com estado herdado, e o metadado que descreve as derivadas e gravado
 * e lido pela porta de dados com a mesma forma do legado"*; T003, *"o
 * comportamento de US-1 existe e os criterios CA-1.1 a CA-1.6 passam contra o
 * sistema novo"*; T005, *"o comportamento de US-2 existe e os criterios CA-2.1 a
 * CA-2.4 passam contra o sistema novo"*; T007, *"o comportamento de US-3 existe
 * e os criterios CA-3.1 a CA-3.4 passam contra o sistema novo"*; T019, *"o
 * comportamento de US-9 existe e os criterios CA-9.1 a CA-9.4 passam contra o
 * sistema novo"*.
 *
 * **As quatro regras de negocio implementadas sao as de US-1, US-2, US-3 e
 * US-9** — o envio com validacao do tipo real do arquivo, em `envio/`; a
 * visibilidade herdada do anexo, em `visibilidade/`, que e a metade de leitura
 * de `P2` (a metade de gravacao e de BC-01 e ja existia); a geracao das
 * derivadas de cada tamanho registrado, em `derivadas/`; e o contorno do filtro
 * de tipo com registro, tambem em `envio/`, porque no legado ele e um ramo de
 * `_wp_handle_upload()` e nao uma operacao propria. A reducao na ingestao, o
 * relato de falha, a escolha da derivada, a transformacao e o descarte do
 * arquivo entram nas tarefas delas (T009 em diante), e a leitura obrigatoria de
 * cada uma esta em `./README.md`.
 *
 * A pasta e `contextos/midia/` porque e assim que `target_architecture.md`
 * nomeia BC-04 no esboco de arvore; a feature se chama `006-biblioteca-de-midia`
 * no pacote de specs, e sao a mesma coisa.
 *
 * Duas coisas que este arquivo faz de proposito, as mesmas que o esqueleto de
 * BC-05 faz, e pelos mesmos dois motivos:
 *
 * - **Nao guarda estado de modulo.** BR-MIGRAR-105 (`EXT-CONTEXTO`) poe
 *   identidade, consulta corrente e conexao no escopo da REQUISICAO. Por isso as
 *   portas chegam por argumento e nao existe instancia compartilhada neste
 *   arquivo: duas composicoes nao se enxergam, e o armazenamento de cada uma
 *   nasce da porta dela. O unico dado compartilhado e a lista de tamanhos de
 *   fabrica, que e congelada.
 * - **Nao resolve nada no carregamento.** O modulo nao consulta dados, nao toca
 *   disco e nao abre imagem ao ser criado: compor o armazenamento monta nome de
 *   tabela e nada mais. A ordem de arranque e contrato publico (BR-MIGRAR-106,
 *   `EXT-ORDEM`), e trabalho feito na importacao e trabalho fora da ordem.
 *   `modulo.test.ts` afirma as duas coisas.
 */

import type { ValorPhp } from '../../plataforma/serializacao/index.js';
import {
  criarArmazenamentoDeMidia,
  type ArmazenamentoDeMidia,
} from './armazenamento/index.js';
import {
  criarDerivadasDeImagem,
  regerarDerivadasQueFaltam,
  type ContextoDeDerivadas,
  type PedidoDeIngestaoDeImagem,
  type ResultadoDaRegeracao,
} from './derivadas/index.js';
import {
  enviarArquivo,
  type ContextoDeEnvio,
  type PedidoDeEnvio,
  type ResultadoDoEnvio,
} from './envio/index.js';
import type {
  PortaDeDados,
  PortaDeProcessamentoDeImagem,
  PortaDeSistemaDeArquivos,
} from './portas/index.js';
import {
  TAMANHOS_DE_IMAGEM_DE_FABRICA,
  type TamanhoDeImagemDeFabrica,
} from './tamanhos/index.js';
import {
  visibilidadeDoAnexo,
  type ContextoDeVisibilidade,
  type RegistroNaVisibilidade,
} from './visibilidade/index.js';

export * from './armazenamento/index.js';
export * from './derivadas/index.js';
export * from './envio/index.js';
export * from './portas/index.js';
export * from './tamanhos/index.js';
export * from './visibilidade/index.js';

/** As tres portas de que este modulo depende, na forma em que ele as recebe. */
export interface PortasDeMidia {
  readonly dados: PortaDeDados;
  readonly sistemaDeArquivos: PortaDeSistemaDeArquivos;
  readonly processamentoDeImagem: PortaDeProcessamentoDeImagem;
}

/**
 * O modulo carregado.
 *
 * Cada historia acrescenta aqui a sua operacao, com a declaracao explicita de
 * permissao que o P4 da constituicao exige, e nenhuma antes da propria tarefa.
 * Hoje ha as portas e os tamanhos de fabrica, de T001, o armazenamento, de T002,
 * e **quatro** operacoes: **uma** de T003 — {@link ModuloDeMidia.enviarArquivo}
 * —, **uma** de T005 — {@link ModuloDeMidia.visibilidadeDoAnexo} — e **duas**
 * de T007, {@link ModuloDeMidia.criarDerivadasDeImagem} e {@link
 * ModuloDeMidia.regerarDerivadasQueFaltam}. As duas de T007 sao **uma**
 * historia: US-3 pede a geracao no envio (CA-3.1) e, no mesmo criterio CA-3.3,
 * *"uma acao explicita para regerar"* — e no legado sao duas funcoes, com duas
 * superficies e duas respostas de permissao diferentes.
 *
 * ⚠️ **T019 fechou sem acrescentar operacao, e isso e declaracao e nao
 * omissao.** US-9 nao e uma coisa que alguem chama: no legado o contorno do
 * filtro e um ramo de `_wp_handle_upload()` (`wp-admin/includes/file.php:971`)
 * dentro do envio que ja existe, e o registro de CA-9.4 e um passo do mesmo
 * fluxo. Expo-lo como operacao propria criaria uma superficie que o legado nao
 * tem, e o **P8** e sobre nao tirar da superficie — nao sobre acrescentar.
 * Quem compoe liga o canal em {@link ContextoDeEnvio.registroDeEnvioSemFiltro}.
 *
 * A tabela abaixo e o que a secao *Contratos* de `plan.md` lista, com a
 * capacidade que a `spec.md` cobra em cada uma. Ela esta aqui como **pauta**, e
 * nao como promessa de forma: quem fechar cada tarefa escreve a operacao dela e
 * declara a permissao na interface, como BC-05 fez.
 *
 * | operacao | historia | tarefa | permissao, como o pacote a declara |
 * |---|---|---|---|
 * | enviar arquivo ✔ | US-1 | T003 | `upload_files`, mais `edit_post` do destino quando ha destino — UC-12 nomeia as duas, CA-1.1 as cobra |
 * | visibilidade do anexo ✔ | US-2 | T005 | **nenhuma**, e e declaracao e nao omissao: e esta leitura que alimenta a decisao de capacidade (`capabilities.php:350`) — ver {@link ModuloDeMidia.visibilidadeDoAnexo} |
 * | gerar derivadas ✔ | US-3 | T007 | o pacote nao declara nenhuma, e o legado nao pergunta: **a superficie declara a dela** — ver {@link ModuloDeMidia.regerarDerivadasQueFaltam} |
 * | servir derivada | US-6 | T013 | nenhuma: a historia e do visitante, e a rastreabilidade dela aponta UC-01 |
 * | transformar imagem | US-7 | T015 | *"a capacidade de editar aquele anexo"* (CA-7.1), sem que o pacote a nomeie |
 * | restaurar original | US-7 | T015 | a mesma (CA-7.4) |
 * | apagar anexo | US-8 | T017 | `plan.md` registra so o erro *"sem permissao"*, sem nomear capacidade — e o apagamento e **definitivo** (`R3`) |
 * | contornar filtro de tipo ✔ | US-9 | T019 | `unfiltered_upload`, que UC-12 nomeia e que **so existe se a instalacao declarar** (CA-9.1, CA-9.2) — perguntada dentro de {@link ModuloDeMidia.enviarArquivo}, onde o legado a pergunta, e **sem operacao propria** |
 */
export interface ModuloDeMidia {
  readonly nome: 'midia';
  readonly portas: PortasDeMidia;

  /**
   * A forma de armazenamento do anexo e das derivadas (T002). Le e grava
   * **somente** pela porta de dados.
   *
   * **Nao e operacao, e por isso nao declara permissao:** ele nao decide nada,
   * nao recusa nada e nao autoriza nada. A linha de `tasks.md` e literal —
   * `satisfaz: — (infraestrutura)`.
   */
  readonly armazenamento: ArmazenamentoDeMidia;

  /**
   * Coloca um arquivo na biblioteca, validando o **tipo real** dele (US-1,
   * T003). E `media_handle_upload()` com `_wp_handle_upload()` dentro
   * (`wp-admin/includes/media.php:296` e `wp-admin/includes/file.php:809`), e e
   * o fluxo principal de UC-12.
   *
   * **Permissao exigida: `upload_files`, mais `edit_post` do conteudo de destino
   * quando ha destino** — as duas que UC-12 nomeia e que CA-1.1 cobra. A recusa
   * e **valor**, com os textos do legado.
   *
   * ⚠️ **A consequencia da segunda pergunta depende da superficie, e isso e o
   * legado, nao uma brecha.** Duas das tres superficies do envio **descartam o
   * destino** e seguem — o anexo nasce sem pai — e so o envio assincrono do
   * editor recusa. CA-1.1 lido como *"toda superficie recusa"* divergiria do
   * legado em duas das tres, e a divergencia esta registrada, com as ancoras das
   * tres, em `envio/permissao-de-envio.ts`. Esta tarefa **nao a resolve**:
   * {@link PedidoDeEnvio.superficie} diz de onde a chamada veio e os tres
   * desfechos do legado sao devolvidos como sao.
   *
   * **O que esta operacao NAO faz:** nao gera derivada (T007), nao reduz imagem
   * na ingestao (T009) e nao relata falha de processamento (T011). Os tres
   * pontos estao nomeados no lugar exato do fluxo, em
   * `envio/enviar-arquivo.ts`.
   *
   * **E o que T019 acrescentou a ela:** o passo 12, o registro de **CA-9.4** —
   * *"cada envio feito por esse caminho fica registrado com conta, arquivo e
   * instante"*. O contorno do filtro de tipo (US-9) acontece **dentro** desta
   * operacao, porque e dentro de `_wp_handle_upload()` que o legado o faz
   * (`wp-admin/includes/file.php:971`). O canal chega por
   * {@link ContextoDeEnvio.registroDeEnvioSemFiltro}, e **omiti-lo devolve o
   * comportamento do legado**, que e nao registrar nada (P7).
   *
   * O contexto chega por argumento, e nao pela composicao, porque identidade,
   * matriz de papeis e estado de rede sao escopo de REQUISICAO (AD-02,
   * BR-MIGRAR-105) — e porque a colaboracao com BC-01, que e quem grava a linha
   * do anexo, e de ligacao tardia (AD-10, regra de dependencia 3).
   */
  enviarArquivo(
    contexto: ContextoDeEnvio,
    pedido: PedidoDeEnvio,
  ): ResultadoDoEnvio;

  /**
   * A visibilidade com que o arquivo e visto — a do conteudo de destino, nunca a
   * propria (US-2, T005). E `get_post_status()`
   * (`wp-includes/post.php:1290`-`:1348`), e e a **metade de leitura** de `P2`
   * (BR-MIGRAR-002).
   *
   * **Permissao exigida: nenhuma, e isso e declaracao explicita e nao
   * omissao** (P4). A funcao do legado nao pergunta capacidade alguma, e nao
   * poderia: e ela que **alimenta** a decisao de capacidade —
   * `map_meta_cap()` resolve `read_post` com
   * `get_post_status_object( get_post_status( $post ) )`
   * (`wp-includes/capabilities.php:350`) e `is_post_publicly_viewable()` decide
   * o acesso do visitante com o mesmo valor (`wp-includes/post.php:2550`).
   * Exigir capacidade aqui inverteria a ordem das duas.
   *
   * ⚠️ **A outra metade de `P2` nao esta neste modulo, e nao e esquecimento.** A
   * reescrita do estado na **gravacao** (`:4705`) acontece dentro de
   * `wp_insert_post()`, que e BC-01, e ja existe em
   * `contextos/conteudo/gravacao/estado-na-gravacao.ts`. O que esta feature
   * garante do lado da escrita e que o pedido que atravessa a ligacao tardia
   * **nao tem campo de estado** — ver `PedidoDeAnexo`.
   *
   * ⚠️ **Nao escreve nada, nem corrige a coluna.** O valor resolvido vive so na
   * resposta, e e por isso que CA-2.4 — *"mudar a visibilidade do conteudo de
   * destino muda a do anexo junto"* — acontece sem escrita nenhuma no anexo.
   *
   * Devolve `null` onde o legado devolve `false`: identificador que nao existe.
   *
   * O contexto chega por argumento, e nao pela composicao, porque as duas
   * leituras que ela faz sao do **conteudo pai** — `get_post()` de BC-01 e o
   * marcador de lixeira de BC-05 —, e colaboracao entre contextos e ligacao
   * tardia (AD-10, regra de dependencia 3).
   */
  visibilidadeDoAnexo(
    contexto: ContextoDeVisibilidade,
    conteudo: number | RegistroNaVisibilidade,
  ): string | null;

  /**
   * Gera as derivadas de cada tamanho registrado para uma imagem recebida
   * (US-3, T007). E o ramo de imagem de `wp_generate_attachment_metadata()`
   * com `wp_create_image_subsizes()` dentro
   * (`wp-admin/includes/image.php:586` e `:240`), que e onde
   * `media_handle_upload()` termina (`wp-admin/includes/media.php:444`) e onde
   * T003 parou.
   *
   * **Permissao exigida: nenhuma, e isso e o legado.**
   * `wp_create_image_subsizes()` nao pergunta capacidade alguma — quem pergunta
   * e a superficie que envia o arquivo, e para ela a resposta esta em
   * {@link ModuloDeMidia.enviarArquivo}. A pauta acima registra isso desde
   * T001: *"o pacote nao declara nenhuma"*.
   *
   * **A falha e silencio, nao erro** (`M4`, BR-MIGRAR-060, e o P7 da
   * constituicao): derivada que nao pode ser gerada simplesmente **nao entra**
   * no metadado, ninguem e avisado e nada e registrado. O resultado e o metadado
   * do anexo, e o envio continua valendo como bem-sucedido.
   *
   * **O que esta operacao NAO faz:** nao reduz imagem acima de 2.560 px e nao
   * converte formato do arquivo principal (T009, US-4), nao relata falha
   * (T011, US-5) e nao monta marcacao (T013, US-6). 🔴 O passo da reducao esta
   * nomeado no lugar exato do fluxo, em
   * `derivadas/criar-derivadas-na-ingestao.ts`, **com o conflito aberto** entre
   * a `spec.md` (CA-4.3) e a arvore analisada sobre de qual arquivo as
   * derivadas saem — que esta tarefa nao resolve e nao precisou resolver.
   *
   * **A gravacao final de `media.php:444` e do chamador**, como no legado: esta
   * operacao devolve o metadado e nao o grava uma segunda vez.
   */
  criarDerivadasDeImagem(
    contexto: ContextoDeDerivadas,
    pedido: PedidoDeIngestaoDeImagem,
  ): ValorPhp;

  /**
   * A **acao explicita** de regerar as derivadas que faltam (CA-3.3, T007). E
   * `wp_update_image_subsizes( $attachment_id )`
   * (`wp-admin/includes/image.php:159`).
   *
   * Ela existe porque *"tamanho registrado depois do envio nao e gerado
   * retroativamente"*: nada no legado reprocessa um anexo por conta propria, e
   * esta e a unica porta de entrada para o reprocessamento.
   *
   * **Permissao exigida: a da superficie, e as duas superficies do legado pedem
   * coisas diferentes** — `upload_files` no envio assincrono do editor
   * (`wp-admin/includes/ajax-actions.php:2552`, que tambem confere o nonce
   * `media-form`) e `edit_post` **daquele** anexo na rota REST de
   * pos-processamento
   * (`class-wp-rest-attachments-controller.php:1052`). Trazer uma das duas para
   * dentro tornaria a outra mais fechada ou mais aberta que o legado, e o P1 nao
   * autoriza nem uma coisa nem outra. **Toda superficie que expuser esta
   * operacao declara a permissao dela, explicitamente** (P4): e a mesma leitura
   * que a pauta acima registrou em T001.
   */
  regerarDerivadasQueFaltam(
    contexto: ContextoDeDerivadas,
    anexoId: number,
  ): ResultadoDaRegeracao;

  /**
   * Os seis tamanhos de fabrica do legado, na ordem dele (`M2`,
   * BR-MIGRAR-058; CA-3.2).
   *
   * E dado, nao registro: acrescentar tamanho e `add_image_size()`, que e
   * estado de requisicao e nao de modulo. Ver `tamanhos/tamanhos-de-fabrica.ts`.
   */
  readonly tamanhosDeFabrica: readonly TamanhoDeImagemDeFabrica[];
}

/**
 * Compoe o modulo sobre as portas recebidas.
 *
 * Substitui, no alvo, o que no legado era ausencia de codigo: BR-MIGRAR-103
 * (`EXT-SUBST`) poe o registro explicito, resolvido antes do primeiro uso, no
 * lugar da redefinicao de funcao global. Trocar uma porta e passar outra
 * implementacao aqui — sem alterar arquivo deste modulo, que e o criterio de
 * "substituivel" que BR-MIGRAR-103 propoe, e que o cenario `@composicao` do
 * teste de paridade desta feature exercita quando substitui a porta de sistema
 * de arquivos por um duplo que registra cada operacao.
 *
 * O registro e escrito a mao de proposito: a Lacuna 1 de `pending_decisions.md`
 * fixou "nenhum framework opinativo... sem container de DI, sem ORM, sem ciclo
 * de vida de framework", porque a ordem de arranque do legado e contrato publico
 * e framework com ciclo de vida proprio disputa com ela.
 */
export function criarModuloDeMidia(portas: PortasDeMidia): ModuloDeMidia {
  return {
    nome: 'midia',
    portas,
    // Compor o armazenamento monta nome de tabela e nada mais: nenhuma consulta
    // sai daqui (`EXT-ORDEM`, BR-MIGRAR-106).
    armazenamento: criarArmazenamentoDeMidia(portas.dados),
    enviarArquivo,
    visibilidadeDoAnexo,
    criarDerivadasDeImagem,
    regerarDerivadasQueFaltam,
    tamanhosDeFabrica: TAMANHOS_DE_IMAGEM_DE_FABRICA,
  };
}
