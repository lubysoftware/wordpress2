# ADRs retroativos — wordpress 7.1.2

> Gerado pelo Detective na fase de **interpretação** · `doc_level`: `detalhado`
> Reconstrução feita em 2026-10-05.

## O que estes documentos são, e o que não são

**Nenhum destes ADRs foi escrito por quem tomou a decisão.** São reconstruções: para cada
um, o comportamento está no código, as consequências são observáveis, e a decisão é
inferida. As **alternativas consideradas** são as opções que estavam tecnicamente
disponíveis no momento — não há registro de que tenham sido avaliadas.

**O `git log` não existe nesta árvore.** Verificado: não há `.git` próprio, o repositório
ao redor é o do ferramental Reversa/Studio, e este caminho está em `.gitignore`
(`studio/.gitignore:3:data/`), de modo que `git log -- .` retorna vazio. Em lugar do
histórico, cada ADR ancora-se em **`arquivo:linha` e na anotação `@since`** do docblock —
a cronologia que o próprio código carrega: 15.929 `@since` em 176 versões distintas
(apuração em `.reversa/work/reversa-detective/chronology.py`).

Decisões **fundadoras** — as sete que sustentam o esqueleto do sistema — não estão aqui:
estão em [`soul.md`](../soul.md) §3. Os ADRs abaixo são **pontuais**: decisões locais,
cada uma com um dono identificável no código e um custo que ainda se paga.

## Convenção

| Campo | Significado |
|---|---|
| **Status** | `Vigente` = o código ainda se comporta assim nesta árvore |
| **Decidido em** | a versão do produto, lida de `@since` — nunca um commit |
| **Confiança** | 🟢 comportamento lido no código · 🟡 intenção inferida · 🔴 não verificável |

## Índice

| # | Decisão | Área | Conf. |
|---|---|---|---|
| [0001](0001-papeis-como-dado-mutavel-nao-como-codigo.md) | Papéis como dado mutável, não como código | autorização | 🟢 |
| [0002](0002-moderacao-de-comentario-em-cascata-com-atalho-de-confianca.md) | Moderação de comentário em cascata, com atalho de confiança | moderação | 🟢 |
| [0003](0003-pingback-do-proprio-site-aprovado-trackback-nunca.md) | Pingback do próprio site aprovado; trackback, nunca | moderação | 🟢 |
| [0004](0004-lixeira-com-memoria-e-restauracao-para-rascunho.md) | Lixeira com memória, e restauração para rascunho | ciclo de vida | 🟢 |
| [0005](0005-agendamento-por-comparacao-de-data-nao-por-transicao.md) | Agendamento por comparação de data, não por transição | ciclo de vida | 🟢 |
| [0006](0006-retencao-agendada-por-visita-ao-painel.md) | Retenção agendada por visita ao painel | retenção | 🟢 |
| [0007](0007-chave-consumida-antes-de-validar.md) | Chave consumida antes de ser validada | segurança | 🟢 |
| [0008](0008-falha-critica-de-atualizacao-exige-intervencao-humana.md) | Falha crítica de atualização exige intervenção humana | operação | 🟢 |
| [0009](0009-negacao-explicita-que-vence-o-super-admin.md) | Negação explícita que vence o super admin | autorização | 🟢 |
| [0010](0010-tolerar-pacote-sem-assinatura-verificada.md) | Tolerar pacote sem assinatura verificada | segurança | 🟢 |
| [0011](0011-autorizacao-propria-para-agente-de-ia.md) | Autorização própria para agente de IA | autorização | 🟢 |
| [0012](0012-credencial-de-conector-fora-do-banco.md) | Credencial de conector fora do banco | integração | 🟢 |

## Para quem for portar o sistema

Os ADRs 0001, 0004, 0005 e 0009 descrevem comportamento que **parece** detalhe de
implementação e **é** regra de produto: reimplementá-los "corretamente" muda o que o
sistema faz. Os ADRs 0006, 0007, 0010 e 0011 descrevem fronteiras onde uma reescrita tem
a oportunidade de melhorar — e, nos quatro casos, a melhoria é compatível com o
comportamento atual.
