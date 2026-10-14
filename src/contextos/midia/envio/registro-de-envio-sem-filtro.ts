/**
 * **US-9**: contornar o filtro de tipo de arquivo so por decisao declarada da
 * instalacao — e o **registro** de cada envio que passou por esse caminho.
 *
 * Entrega de **T019** da feature `006-biblioteca-de-midia`: *"o comportamento de
 * US-9 existe e os criterios CA-9.1, CA-9.2, CA-9.3 e CA-9.4 passam contra o
 * sistema novo"*. E a excecao *"tipo de arquivo nao permitido"* de **UC-12**:
 * *"`unfiltered_upload` contorna o filtro, mas e sempre `do_not_allow` a menos
 * que `ALLOW_UNFILTERED_UPLOADS` esteja definida — e a unica capacidade cuja
 * concessao depende de uma constante existir"*.
 *
 * ---
 *
 * # Dos quatro criterios, tres ja tinham codigo. Este arquivo e o quarto
 *
 * O contorno do filtro no legado sao **cinco ocorrencias em quatro arquivos** —
 * o censo foi feito arquivo por arquivo na arvore do 7.1.2, e nao por busca
 * recursiva:
 *
 * | ancora | o que e | criterio | onde esta neste porte |
 * |---|---|---|---|
 * | `wp-includes/capabilities.php:587`-`:592` | o `case` de `map_meta_cap()`: com a constante, a capacidade resolve em si mesma; sem ela, em `do_not_allow` | **CA-9.1**, **CA-9.2**, **CA-9.3** | `plataforma/autorizacao/revogacao-por-constante.ts`, **desde a feature 001** |
 * | `wp-admin/includes/schema.php:894` | `populate_roles_230()` concede `unfiltered_upload` ao administrador | **CA-9.1** (*"inclusive a de maior poder"*) | `contextos/identidade-e-acesso/armazenamento/matriz-de-fabrica.ts:221` |
 * | `wp-admin/includes/file.php:971` | o `if` que deixa o envio passar com o tipo nao reconhecido | **CA-9.3** | `./enviar-arquivo.ts`, passo 6 — portado por **T003**, onde o legado o faz |
 * | `wp-includes/functions.php:2934` | o mesmo contorno em `wp_upload_bits()` | — | 🔴 **nao portado** — ver abaixo |
 * | `wp-includes/capabilities.php:588`, trecho `( ! is_multisite() \|\| is_super_admin( ... ) )` | em rede, so o super administrador alcanca a capacidade **mesmo com a constante** | **CA-9.3** | 🔴 **nao portado** — ver abaixo |
 *
 * Logo o que T019 acrescenta em codigo e **CA-9.4** e so ele: *"cada envio feito
 * por esse caminho fica registrado com conta, arquivo e instante"*. Os outros
 * tres fecham por teste — `./us-9-envio-sem-filtro.test.ts` os afirma **pelo
 * envio**, de ponta a ponta, que e o que *"passam contra o sistema novo"* pede;
 * afirmados so na pergunta de capacidade, eles seriam o teste da feature 001 de
 * novo.
 *
 * ---
 *
 * # Por que CA-9.4 e acrescimo, e nao porte
 *
 * **O legado nao registra nada.** Nem no contorno, nem em lugar nenhum: a arvore
 * tem zero arquivo de log, e das 49 chamadas de `error_log(` nenhuma esta num
 * caminho de dominio (o censo esta em
 * `plataforma/registro-de-operacao/evento-de-operacao.ts`). Um envio que passa
 * por `file.php:971` e, no legado, indistinguivel de qualquer outro depois de
 * gravado — o unico vestigio e o `post_mime_type` ter vindo do que o **navegador
 * afirmou** (`:975`), e isso nao diz quem enviou nem quando.
 *
 * O **P7** da constituicao e o que autoriza este arquivo, com o limite escrito:
 * *"registro e diagnostico novos podem ser acrescentados, mas nenhuma decisao do
 * sistema pode passar a depender deles"*, e a forma de conferir e *"o registro
 * acrescentado e so escrita: nenhuma ramificacao do codigo testa o resultado de
 * escrever log"*. Daqui saem as tres propriedades desta funcao:
 *
 * 1. **devolve `void`** — e a porta tambem (`PortaDeCanal.registrar`), por
 *    contrato de `plataforma/registro-de-operacao`;
 * 2. **nao lanca** e nao decide nada: quem chama nao tem o que conferir;
 * 3. **a colaboracao e opcional** ({@link RegistroDeEnvioSemFiltro} ausente em
 *    {@link ContextoDeEnvio}), e omiti-la devolve exatamente o comportamento do
 *    legado: o envio acontece igual e nenhuma linha e escrita. O unico `if`
 *    desta pasta sobre registro e a **presenca da colaboracao**, nunca o
 *    **resultado** de escrever — e `./us-9-envio-sem-filtro.test.ts` afirma que
 *    os dois caminhos devolvem o mesmo resultado, o mesmo anexo e a mesma
 *    sequencia de operacoes de disco.
 *
 * ⚠️ **Nenhum numero nasce aqui** (P6, e a linha *"introduzir limite de taxa,
 * prazo de retencao ou qualquer numero que o legado nao tem"* da tabela *Nao
 * negociavel*): nao ha prazo de guarda, nao ha teto de eventos e nao ha contagem
 * de contornos. O evento tem instante porque CA-9.4 pede instante, e instante
 * nao e prazo. O mesmo conflito pelo outro lado esta registrado em
 * `plataforma/registro-de-operacao/README.md`, *O que ninguem decidiu*, item 1,
 * e este arquivo **nao o resolve**.
 *
 * ---
 *
 * # Quando o evento sai, e qual era a alternativa
 *
 * **Sai quando o envio terminou** — depois de o anexo existir —, e nao no `if`
 * de `file.php:971`. CA-9.4 diz *"cada envio **feito** por esse caminho"*, e um
 * contorno que passou da validacao de tipo e morreu depois (pasta nao gravavel,
 * `mover` que falhou, `wp_insert_attachment()` que devolveu erro) **nao e um
 * envio feito**: nada entrou na biblioteca. Registra-lo diria a quem audita que
 * um arquivo de tipo arbitrario entrou, quando nao entrou — e o fato que importa
 * ali e o oposto.
 *
 * A alternativa era emitir no proprio `if`, e ela tem uma vantagem que esta
 * declarada aqui para quem precisar dela: ali o **contorno** nunca escapa, mesmo
 * quando o envio falha depois. Se algum dia a tentativa precisar de registro,
 * ela e **outro** evento, com outra origem, e nao este — porque CA-9.4 e
 * contagem de envios feitos, e dois eventos pelo mesmo envio fariam a resposta
 * de *"quantos envios sem filtro houve"* contar duas vezes.
 *
 * O preco do ponto escolhido e o nome: la o nome e o informado pelo cliente, e
 * aqui ja e o nome **final em disco**, depois da sanitizacao e do laco de
 * colisao. O evento carrega os dois, porque so o segundo identifica o arquivo e
 * so o primeiro e o que o ator viu.
 *
 * ---
 *
 * # 🔴 Dois alcances do contorno que este porte NAO tem
 *
 * Nenhum dos dois e esquecimento, e nenhum dos dois se resolve aqui.
 *
 * ### 1. `wp_upload_bits()` e a segunda porta de entrada (`functions.php:2934`)
 *
 * `wp_upload_bits( $name, $deprecated, $bits )` grava **bytes** em vez de
 * elemento de `$_FILES`, e faz a mesma pergunta — *"se a extensao nao foi
 * reconhecida e o ator nao tem `unfiltered_upload`, recusa"* — com duas
 * diferencas: ela olha **so a extensao** (`wp_check_filetype()`, sem o confronto
 * com o conteudo) e devolve a mesma mensagem de recusa.
 *
 * **Ela nao esta portada, e nao e desta tarefa:** nenhuma historia desta feature
 * a descreve, a lista *Implementado em* de UC-12 nao a inclui, e US-1 portou o
 * par `media_handle_upload()` / `_wp_handle_upload()`. Fica nomeada aqui, que e
 * o que o **P8** cobra de quem nao porta, com a consequencia declarada: **quando
 * ela entrar, CA-9.4 exige que o registro saia dela tambem**, ou a resposta de
 * *"cada envio feito por esse caminho"* passa a ter um caminho fora da conta.
 *
 * ### 2. O recorte de rede do proprio `case` (`capabilities.php:588`)
 *
 * A condicao do legado tem **tres** termos, e `plataforma/autorizacao/` porta
 * dois: `defined( 'ALLOW_UNFILTERED_UPLOADS' ) && ALLOW_UNFILTERED_UPLOADS` esta
 * la, e `( ! is_multisite() || is_super_admin( $user_id ) )` **nao**. O arquivo
 * de la declara a ausencia, mas pela regra **inferida** de `PERM-10`
 * (BR-MIGRAR-096), cuja enumeracao o pacote nao traz — e para `unfiltered_upload`
 * o termo **nao e inferido**: ele esta literal na mesma linha do `case`.
 *
 * A consequencia cai exatamente em cima de CA-9.3: **numa instalacao de rede com
 * a constante definida, este porte concede a capacidade a quem a tem no papel,
 * e o legado so a concede ao super administrador.** Esta tarefa nao a conserta
 * porque o mecanismo e de `plataforma/autorizacao/`, que e entrega da feature
 * 001, e porque mexer nele muda a resposta de uma pergunta de capacidade para
 * todo contexto que a faz — e nao ha nenhuma tarefa deste pacote que o autorize.
 * Fica registrado nos dois lugares: aqui e em `../README.md`.
 */

import type {
  EventoDeOperacao,
  PortaDeCanal,
} from '../../../plataforma/registro-de-operacao/index.js';

/**
 * A origem do evento, no formato `<contexto>/<area>` — a chave de busca de
 * CA-1.2 de REQ-159 (*"consultavel por periodo, por severidade e por origem"*).
 *
 * E aberta por contrato (`Origem` e `string`, e o motivo esta em
 * `plataforma/registro-de-operacao/evento-de-operacao.ts`: origem fechada
 * impediria extensao de registrar a dela). Ter o valor numa constante exportada
 * e o que permite consultar por ela sem repetir a cadeia.
 */
export const ORIGEM_DO_ENVIO_SEM_FILTRO = 'midia/envio-sem-filtro';

/**
 * A severidade do evento.
 *
 * ⚠️ **A escala de severidade do sistema novo nao esta decidida**, e quem a
 * decide nao e esta tarefa: `plataforma/registro-de-operacao/evento-de-operacao.ts`
 * deixa `Severidade` como uniao **aberta** de proposito — *"o legado nao tem log,
 * logo nao tem escala de severidade de log para copiar"* — e registra que *"qual
 * conjunto o sistema novo usa e trabalho de T003"* da feature `015`, que nao
 * esta fechada. Por isso a palavra vive **numa constante so**: quando a escala
 * for fixada, troca-se uma linha.
 *
 * `'informativo'` e a palavra porque **nada falhou**: o envio aconteceu como a
 * instalacao declarou que podia acontecer. Marca-lo como erro ou aviso diria que
 * o sistema reprovou o que ele aprovou.
 */
export const SEVERIDADE_DO_ENVIO_SEM_FILTRO = 'informativo';

/**
 * A colaboracao que escreve o registro: o canal, e o instante.
 *
 * ⚠️ **O instante vem daqui, e nao de `RelogioNoEnvio`**, e sao duas leituras de
 * tempo diferentes de proposito. O relogio do envio e
 * `current_time( 'mysql' )` (`wp-admin/includes/media.php:297`), que e **hora
 * local do site em texto** e que o fluxo **retrodata pelo conteudo de destino**
 * (`:301`) — ele existe para escolher a subpasta `/AAAA/MM`. Um evento de
 * auditoria carimbado com esse valor diria que o envio aconteceu na data do
 * rascunho a que o arquivo foi anexado, que pode ser de anos antes. O que
 * `EventoDeOperacao.instante` quer e *"milissegundos desde a epoca"*, do relogio
 * de agora.
 *
 * As duas coisas chegam **juntas**, num campo so, porque e isso que torna a
 * ausencia inteira: sem a colaboracao nao ha canal **nem** instante, e nao
 * sobra a pergunta *"que hora escrevo no evento que nao vou escrever"*.
 *
 * Nao e porta do modulo de midia, pela mesma razao que
 * {@link DeteccaoDeTipoReal} e {@link RelogioNoEnvio} nao sao: AD-08 declara
 * cinco bordas, a porta do canal e do modulo que a consome (regra de dependencia
 * 4) e ela ja existe em `plataforma/registro-de-operacao/portas/`.
 */
export interface RegistroDeEnvioSemFiltro {
  /** A porta de `plataforma/registro-de-operacao`. Escreve e nao devolve nada. */
  readonly canal: PortaDeCanal;
  /** O instante do evento, em milissegundos desde a epoca. */
  agoraEmMilissegundos(): number;
}

/**
 * O envio que contornou o filtro, nos campos que o evento carrega.
 *
 * Os tres que CA-9.4 nomeia sao {@link contaId} (*"conta"*),
 * {@link nomeDeArquivo} (*"arquivo"*) e o instante, que vem da colaboracao. Os
 * outros tres estao aqui porque sao o que torna o registro util sem trazer nada
 * que ele nao deva ter:
 *
 * - {@link tipoGravado} e **o motivo de o criterio existir**: num envio por este
 *   caminho o `post_mime_type` e o que o **navegador** afirmou
 *   (`wp-admin/includes/file.php:975`), e nao um tipo confrontado com o conteudo;
 * - {@link anexoId} e {@link endereco} ligam o evento a linha e ao arquivo.
 *
 * ⚠️ **O login do ator NAO entra.** `AtorDeAutorizacao` o tem, e ele seria o
 * campo mais legivel do evento — mas CA-1.3 de REQ-159 manda que no registro
 * *"nao entre credencial nem dado pessoal alem do declarado"*, e `contaId`
 * identifica a conta sem publicar o nome de quem entra com ele. Quem precisar do
 * nome o resolve na leitura, onde a autorizacao de ler o registro existe.
 */
export interface EnvioSemFiltroRegistrado {
  /** `$user->ID` de quem enviou — a *"conta"* de CA-9.4. */
  readonly contaId: number;
  /** O anexo criado. */
  readonly anexoId: number;
  /** O nome final em disco — o *"arquivo"* de CA-9.4. */
  readonly nomeDeArquivo: string;
  /** O nome que o cliente informou, que pode nao ser o final. */
  readonly nomeInformado: string;
  /** O endereco publico do arquivo, que e o que foi gravado no `guid`. */
  readonly endereco: string;
  /** O `post_mime_type` gravado, que neste caminho e o afirmado pelo cliente. */
  readonly tipoGravado: string;
}

/**
 * Escreve o evento de um envio que passou pelo contorno — **CA-9.4**.
 *
 * Sem colaboracao, nao escreve e nao reclama: e o comportamento do legado, que
 * e nao registrar nada (P7). **Nao devolve nada**, para que nenhuma ramificacao
 * possa depender de ter escrito.
 *
 * A decisao de **se houve contorno** nao e desta funcao: ela e do fluxo, no
 * ponto em que o legado a toma (`./enviar-arquivo.ts`, passo 6). Esta funcao so
 * sabe escrever.
 */
export function registrarEnvioSemFiltro(
  registro: RegistroDeEnvioSemFiltro | undefined,
  envio: EnvioSemFiltroRegistrado,
): void {
  if (registro === undefined) {
    return;
  }

  const evento: EventoDeOperacao = {
    instante: registro.agoraEmMilissegundos(),
    origem: ORIGEM_DO_ENVIO_SEM_FILTRO,
    severidade: SEVERIDADE_DO_ENVIO_SEM_FILTRO,
    /*
      Todo campo e escalar, que e o contrato de `ValorDeContexto`: o slot de
      observabilidade recomenda "registro estruturado em linha JSON" e campo
      aninhado e por onde dado pessoal entra sem ninguem ver.
    */
    contexto: {
      contaId: envio.contaId,
      anexoId: envio.anexoId,
      arquivo: envio.nomeDeArquivo,
      nomeInformado: envio.nomeInformado,
      endereco: envio.endereco,
      tipoGravado: envio.tipoGravado,
    },
  };

  registro.canal.registrar(evento);
}
