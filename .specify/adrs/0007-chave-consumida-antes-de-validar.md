# ADR 0007 — Chave consumida antes de ser validada

| | |
|---|---|
| **Status** | Vigente |
| **Decidido em** | 5.2.0 (`WP_Recovery_Mode_Key_Service`) |
| **Área** | segurança |
| **Confiança** | 🟢 comportamento lido no código |
| **Evidência** | `wp-includes/class-wp-recovery-mode-key-service.php:85-96`, `:115`; `wp-includes/class-wp-recovery-mode.php:99-100`, `:261`, `:307`; `wp-includes/class-wp-recovery-mode-email-service.php:53-62` |

## Contexto

O modo de recuperação dá a quem administra um caminho para entrar no painel quando um
plugin ou tema derrubou o site. O acesso é concedido por um **link enviado por e-mail**,
contendo uma chave — e o endereço de destino é o do administrador, que a essa altura
pode ser o único jeito de recuperar a instalação.

A chave é, portanto, uma credencial de acesso administrativo entregue por um canal que o
sistema não controla. E o contexto em que ela é usada é o pior possível: o site está
quebrado, não há sessão, e **não há onde contar tentativas** — contar exigiria escrever no
banco a cada tentativa, numa instalação cujo carregamento normal está falhando.

## Decisão

**Remover a chave do armazenamento antes de verificá-la.**

```php
// class-wp-recovery-mode-key-service.php:85-92
if ( ! isset( $records[ $token ] ) ) {
    return new WP_Error( 'token_not_found', __( 'Recovery Mode not initialized.' ) );
}

$record = $records[ $token ];

$this->remove_key( $token );      // ← consumo ANTES da verificação

if ( ! is_array( $record ) || ! isset( $record['hashed_key'], $record['created_at'] ) ) {
    return new WP_Error( 'invalid_recovery_key_format', … );
}
```

A verificação do *hash* e do prazo acontece **depois**, sobre o registro já em memória.
Qualquer resultado — sucesso, chave errada, formato inválido, prazo vencido — deixa a
chave inexistente.

A decisão vem acompanhada de dois limitadores no caminho de **emissão**, que a tornam
sustentável:

| Limitador | Efeito | Linha |
|---|---|---|
| Um e-mail por dia | `recovery_mode_email_rate_limit`, default `DAY_IN_SECONDS` | `wp-includes/class-wp-recovery-mode.php:307` |
| **Marcador gravado antes do envio** | se gravar o `last_sent` falha, o envio é abortado — um site em laço de erro não gera enxurrada de e-mail | `wp-includes/class-wp-recovery-mode-email-service.php:53-62` |

E uma limpeza: `clean_expired_keys()` roda por cron diário
(`wp-includes/class-wp-recovery-mode.php:99-100`, `:261`).

## Alternativas consideradas

| Alternativa | Por que não foi adotada | Conf. |
|---|---|---|
| **Contador de tentativas por chave** | exigiria escrita no banco a cada tentativa, no caminho de um site que está quebrado, e criaria um alvo para esgotar o contador de propósito. O consumo resolve o mesmo problema sem estado adicional | 🟡 |
| **Limite por IP** | o IP de quem administra não é conhecido de antemão, e trancar o único caminho de recuperação por origem de requisição pode trancar quem precisa entrar | 🟡 |
| **Verificar primeiro, consumir só no sucesso** | é o comportamento intuitivo, e permite força bruta: cada tentativa errada preserva a chave para a próxima. Dado que a chave é gerada por `wp_generate_password()` e que não há contador, é exatamente o cenário que a decisão evita | 🟢 a ordem no código é inequívoca |
| **Chave de uso único com sessão longa** | é o que acontece de fato: consumida a chave, o acesso passa a ser o cookie, que vale uma semana (`wp-includes/class-wp-recovery-mode-cookie-service.php:46`). A decisão **é** essa, com o consumo acontecendo cedo demais para errar | 🟢 |

## Consequências

**Desejadas**

- Força bruta sobre a chave é impossível sem contador de tentativas, sem escrita adicional
  e sem estado. 🟢
- Um link vazado só vale enquanto não for usado — e usar errado o invalida. 🟢
- O custo de um erro de formato ou de prazo é o mesmo de um acerto: nada fica para trás. 🟢

**Indesejadas, e ainda pagas**

- **Um clique duplo falha.** O navegador que pré-busca o link, o cliente de e-mail que o
  abre para gerar preview, o antivírus que o visita — qualquer um consome a chave antes do
  administrador. A segunda abertura devolve "Recovery Mode not initialized", mensagem que
  não explica o que aconteceu. 🟢
- **Recuperar exige um novo e-mail, e ele está limitado a um por dia.** Perdida a chave, o
  próximo erro fatal só dispara e-mail depois de 24 horas — salvo se o administrador
  conseguir entrar por outro caminho e limpar o limite. 🟢
  `wp-includes/class-wp-recovery-mode.php:307`
- **A mensagem de erro não distingue "chave já usada" de "modo de recuperação nunca
  iniciado".** São o mesmo `token_not_found` (`:86`), e a diferença importa para quem está
  tentando entender por que o link não funciona. 🟢
- **A decisão é invisível.** Nada na interface nem no e-mail avisa que o link é de uso
  único e que abrir duas vezes o queima. 🟡

## Para um porte

- **Mantenha a ordem.** Consumir antes de verificar é a decisão, e ela é correta para uma
  credencial sem contador.
- **Corrija a ergonomia, não a segurança.** Duas melhorias são compatíveis com a decisão:
  distinguir "chave já consumida" de "nunca iniciado" na mensagem, e avisar no próprio
  e-mail que o link é de uso único.
- O padrão é reutilizável: o Arqueólogo o registrou em `code-analysis.md` §4 ao lado de
  dois outros mecanismos de concorrência mínima (trava por `INSERT IGNORE`, marcador
  gravado antes da ação limitada). Os três resolvem problemas de corrida **sem** adicionar
  estado, e os três valem num destino novo.
