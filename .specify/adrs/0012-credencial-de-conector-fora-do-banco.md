# ADR 0012 — Credencial de conector fora do banco

| | |
|---|---|
| **Status** | Vigente |
| **Decidido em** | 7.0.0 (`connectors.php`, `_wp_connectors_get_api_key_source()`) · 7.1.0 (credencial `usuario:senha`) |
| **Área** | integração externa |
| **Confiança** | 🟢 comportamento lido no código |
| **Evidência** | `wp-includes/connectors.php:239-242`, `:385-397`, `:432-468`, `:470-501` |

## Contexto

A API de Conectores, nova nesta geração, declara integrações externas — provedores de IA,
serviço de filtragem de spam — e cada uma precisa de credencial. O hábito de duas décadas
do produto é inequívoco: **configuração mora em `wp_options`**, é editável pela tela de
ajustes, e é isso que permite ao dono do site se manter sem tocar em arquivo
([`soul.md` D5](../soul.md), [ADR 0001](0001-papeis-como-dado-mutavel-nao-como-codigo.md)).

Mas chave de API não é configuração como as outras. Ela é segredo, muda por ambiente —
desenvolvimento, homologação, produção — e, num banco que vai para *backup* e para o
dump de migração, vaza com ele. E o produto, nesta geração, passou a ser empacotado em
container e implantado por pipeline, cenários em que a variável de ambiente é o veículo
natural.

## Decisão

**Precedência de três fontes, com o banco em último lugar.** 🟢 `wp-includes/connectors.php:444-468`

```
variável de ambiente  →  constante PHP  →  opção no banco  →  'none'
```

```php
function _wp_connectors_get_api_key_source( string $setting_name,
        string $env_var_name = '', string $constant_name = '' ): string {
    if ( '' !== $env_var_name ) {
        $env_value = getenv( $env_var_name );
        if ( false !== $env_value && '' !== $env_value ) { return 'env'; }
    }
    if ( '' !== $constant_name && defined( $constant_name ) ) {
        $const_value = constant( $constant_name );
        if ( is_string( $const_value ) && '' !== $const_value ) { return 'constant'; }
    }
    $db_value = get_option( $setting_name, '' );
    if ( '' !== $db_value ) { return 'database'; }
    return 'none';
}
```

Três detalhes de desenho que acompanham a decisão:

| Detalhe | Efeito | Linha |
|---|---|---|
| **A função devolve a fonte, não o valor** | quem chama sabe *de onde* veio a chave, e pode dizê-lo na interface em lugar de exibir o segredo | `:442` |
| **Nomes derivados automaticamente** | para um provedor de IA, `connectors_ai_{id}_api_key` como opção, e o mesmo identificador em maiúsculas como constante **e** como variável de ambiente | `:385-397` |
| **Valor vazio não conta** | string vazia em qualquer fonte não interrompe a cadeia — a próxima é consultada | `:448`, `:456`, `:463` |

O Akismet é registrado por este mecanismo, com os nomes que já existiam:
`wordpress_api_key` como opção e `WPCOM_API_KEY` como constante (`:239-242`) — isto é, a
decisão foi **retroencaixada** sobre a convenção anterior, sem quebrá-la. 🟢

Na 7.1.0 veio o complemento para autenticação básica: a credencial pode ser
`usuario:senha`, dividida no **primeiro** dois-pontos para que a senha possa conter
dois-pontos, com `trim` em ambas as metades — o comentário explica que é para o caso de o
valor vir de arquivo ou `.env` com espaço ou quebra de linha à solta. Se qualquer metade
sair vazia, **as duas** voltam vazias (`:483-501`). 🟢

## Alternativas consideradas

| Alternativa | Por que não foi adotada | Conf. |
|---|---|---|
| **Só no banco** (a convenção do produto) | a chave vai no *backup*, no dump de migração e na exportação; e um mesmo código implantado em três ambientes precisaria de três bancos diferentes só por causa dela | 🟡 |
| **Só em constante** (o padrão histórico para segredo, como os *salts* de `wp-config.php`) | exige editar arquivo, o que contraria o objetivo de o dono do site se manter sem tocar em código — e em hospedagem compartilhada pode ser o que ele menos consegue fazer | 🟡 |
| **Banco com precedência sobre ambiente** | a tela de ajustes passaria a vencer a configuração do servidor, e o operador do ambiente perderia o controle. A ordem escolhida é a oposta, e é a certa | 🟢 a ordem no código é inequívoca |
| **Cofre de segredos** (serviço externo dedicado) | exigiria dependência de infraestrutura que o produto não pode assumir, pela mesma razão de [`soul.md` D7](../soul.md) | 🟡 |
| **Criptografar o valor no banco** | o sistema **tem** criptografia (`sodium_compat`, módulo 56), mas a chave de criptografia teria de morar em algum lugar — e esse lugar seria `wp-config.php`, isto é, uma constante. A precedência resolve o mesmo problema sem a indireção | 🟡 |

## Consequências

**Desejadas**

- O segredo pode ficar inteiramente **fora** do banco e fora do código. 🟢
- O mesmo artefato roda em três ambientes com três chaves, sem três bancos. 🟡
- A configuração do servidor vence a da interface, e não o contrário. 🟢
- A interface pode informar a **fonte** da chave sem exibi-la. 🟢
- A convenção anterior do Akismet foi absorvida sem quebra. 🟢

**Indesejadas, e ainda pagas**

- **A precedência é invisível para quem usa a tela de ajustes.** Com a chave no ambiente,
  digitar outra no campo não tem efeito algum — e nada no mecanismo obriga a interface a
  dizê-lo. A função devolve a fonte justamente para permitir o aviso, mas **permitir não é
  garantir**. É a classe de confusão mais previsível desta decisão. 🟡
- **A superfície triplicou.** A mesma chave pode estar em três lugares, e remover só do
  banco não a remove. Auditar "quais chaves esta instalação tem" passa a exigir inspecionar
  ambiente, `wp-config.php` e banco. 🟢
- **Valor vazio é indistinguível de ausente.** Definir a variável de ambiente como string
  vazia para "desligar" o conector **não** desliga: a cadeia continua e cai no banco
  (`wp-includes/connectors.php:448`). Não há como negar a partir de uma fonte de
  precedência maior. 🟢
- **`getenv()` não vê tudo.** Em FastCGI e em alguns ambientes de PHP-FPM, variáveis
  passadas por `fastcgi_param` aparecem em `$_SERVER` e não em `getenv()`. A fonte mais
  prioritária é a que mais depende de configuração de servidor correta, e a falha é
  silenciosa: cai para a próxima. 🟡
- **Rompe a coerência do modelo de configuração.** Toda a configuração do produto está em
  `wp_options`; esta não. É uma exceção justificada, e exceções em modelo de configuração
  custam entendimento. 🟡

## Para um porte

- **Replique a precedência, inclusive a ordem.** Ambiente acima de banco é a decisão
  correta e é a que um porte tende a inverter por engano, porque "a tela de ajustes deveria
  mandar".
- **Acrescente a negação explícita.** Um valor sentinela — `false`, `none`, string vazia
  **tratada como decisão** — resolve o furo de "não consigo desligar pela fonte
  prioritária".
- **Leia `$_SERVER` além de `getenv()`.** É uma linha e cobre os ambientes em que a decisão
  falha em silêncio hoje.
- **Faça a interface dizer a fonte.** O mecanismo já entrega o dado; usá-lo é obrigação do
  consumidor, e o legado não a impõe. "Esta chave vem do ambiente e não pode ser alterada
  aqui" elimina a confusão inteira.
- **Decida se esta é a exceção ou o novo padrão.** Se o destino for implantado por
  pipeline, a precedência de três fontes serve para **toda** configuração sensível, não só
  para chave de conector — e aí deixa de ser exceção.
