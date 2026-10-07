# UC-01 · Consultar conteúdo publicado

> Grupo: **Conteúdo** · Confiança: 🟢 `confirmado`
> Índice: [`use-cases.md`](use-cases.md)

## Identificação

| Campo | Valor |
|---|---|
| **Objetivo** | ler no navegador o conteúdo que o site publicou, sem precisar de conta |
| **Ator principal** | Visitante (`visitante`, `human`) |
| **Atores secundários** | — nenhum |
| **Gatilho** | requisição HTTP a qualquer URL do site que não seja do painel |
| **Autorização** | não há verificação de capacidade. O portão é o `post_status`: só os status registrados como públicos entram na consulta principal, e `private` exige `read_private_posts` (`wp-includes/capabilities.php:369-380`) |
| **Relações UML** | estendido por [UC-02 — Abrir conteúdo protegido por senha](UC-02-abrir-conteudo-protegido-por-senha.md) |

## Pré-condições

- o conteúdo existe em `posts` com status público
- o tema ativo resolve ao menos um template, ou o sistema cai no `index.php` do tema

## Fluxo principal

1. Visitante pede uma URL do site
2. Sistema resolve a URL em variáveis de consulta pelas regras de reescrita
3. Sistema executa a consulta principal e carrega os registros
4. Sistema escolhe o template pela hierarquia do tema
5. Sistema devolve a página renderizada

## Sequência

O mesmo fluxo principal com remetente e destinatário explícitos. `self` é decisão interna do sistema.

| # | De | Para | Mensagem | Tipo | Condição ou regra |
|---|---|---|---|---|---|
| 1 | Visitante | Sistema | pede uma URL do site | `sync` | — |
| 2 | Sistema | Sistema | resolve a URL em variáveis de consulta | `self` | WP::parse_request, pelas regras de reescrita |
| 3 | Sistema | Sistema | executa a consulta principal | `self` | só status público; posts_per_page nasce em 10 |
| 4 | Sistema | Sistema | escolhe o template pela hierarquia do tema | `self` | — |
| 5 | Sistema | Visitante | devolve a página renderizada | `return` | — |

```mermaid
sequenceDiagram
    autonumber
    participant Visitante as Visitante
    participant Sistema as Sistema
    Visitante->>Sistema: pede uma URL do site
    Sistema->>Sistema: resolve a URL em variáveis de consulta
    Note over Sistema: WP::parse_request, pelas regras de reescrita
    Sistema->>Sistema: executa a consulta principal
    Note over Sistema: só status público; posts_per_page nasce em 10
    Sistema->>Sistema: escolhe o template pela hierarquia do tema
    Sistema-->>Visitante: devolve a página renderizada
```

## Fluxos alternativos

### Feed em vez de HTML

1. Sistema reconhece a variável `feed` na consulta
2. Sistema delega a `do_feed()` e devolve RSS ou Atom em lugar do template
3. O tipo de feed sai de `get_default_feed()` quando a URL não o nomeia

### Conteúdo privado

1. Sistema verifica `read_post` do registro
2. Status `private` exige `read_private_posts`; qualquer outro status não público cai em `edit_post`, isto é, ler o rascunho de outro exige poder editá-lo

### Pré-busca de navegação

1. Sistema injeta regras de `speculationrules` na página
2. O navegador do visitante pré-busca o próximo destino antes do clique

## Exceções

| O que dá errado | Como o sistema reage |
|---|---|
| Nenhum registro corresponde | `WP::handle_404()` marca a consulta como 404 e o tema serve o template de erro |
| Conteúdo protegido por senha | o corpo é substituído pelo formulário de senha — ver UC-02 |
| Site da rede arquivado, marcado como spam ou encerrado | `ms_site_check()` responde HTTP 410 antes de qualquer consulta; o super administrador é liberado antes de todo teste |

## Pós-condições

- nada muda no armazenamento
- o contador de visualizações não existe: o sistema não registra a leitura em lugar algum

## Regras de negócio aplicadas

- `posts_per_page` nasce em 10 e define o tamanho da página pública (domain.md §3)
- `blog_public` nasce em `'1'`: o site pede para ser indexado (domain.md §3)
- N1, N3 — quatro estados de supervisão de site da rede governam o acesso, e dois deles produzem a mesma resposta (domain.md §2.8)

## Implementado em

- `wp-blog-header.php:16`
- `wp-blog-header.php:19`
- `wp-includes/functions.php:1349`
- `wp-includes/class-wp.php:136`
- `wp-includes/class-wp.php:724`
- `wp-includes/class-wp.php:819`
- `wp-includes/class-wp-query.php:811`
- `wp-includes/class-wp-query.php:1900`
- `wp-includes/template-loader.php:23`
- `wp-includes/template-loader.php:114`
- `wp-includes/template.php:23`
- `wp-includes/functions.php:1612`
- `wp-includes/ms-load.php:74`

## O que um porte precisa saber

- 🟢 **A leitura não deixa rastro.** Não há tabela, opção nem log de acesso: nenhuma métrica de audiência existe neste sistema. Quem migrar esperando encontrar contador de visualização vai procurar o que não foi construído.
- 🟡 **O caso de uso mais executado é o menos protegido por teste.** São zero arquivos de teste em 3.381, e este é o caminho que toda visita percorre.
