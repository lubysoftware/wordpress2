# Tarefa: T001 de `015-plataforma-transversal` — a instalacao executavel do legado
# como oraculo de paridade. Satisfaz: — (infraestrutura).
#
# O hospedeiro do oraculo. Nenhum valor aqui foi escolhido por gosto: cada um
# vem do que o legado declara exigir ou recomendar.
#
#   PHP 8.3            `readme.html:61` recomenda 8.3; o piso e 7.4 em
#                      `wp-includes/version.php:40`
#   json, hash         obrigatorias em `wp-includes/version.php:47-50` (a carga
#                      aborta sem elas) — ja vem na imagem oficial
#   mysqli             `wp-includes/class-wpdb.php:705` fixa `$use_mysqli = true`
#                      e verifica a conexao com `instanceof mysqli`: sem ela nada
#                      funciona, ainda que ela nao esteja na lista de obrigatorias
#   mod_rewrite        `readme.html:63` o recomenda, e e dele que depende o
#                      `wp_install_maybe_enable_pretty_permalinks()` de
#                      `wp-admin/includes/upgrade.php:500` acabar a instalacao com
#                      permalink bonito em vez de simples
#   imagick e gd       `_reversa_sdd/tech/technologies.md` secao 3 registra imagick
#                      como 1a escolha do produto e gd como 2a. As duas ficam
#                      presentes para que o caminho que o legado prefere seja o
#                      que o oraculo exercita, e o alternativo continue alcancavel
#   zip, exif          caminho alternativo existe (`class-pclzip.php`), mas o
#                      caminho que o produto prefere e a extensao
#
# NAO se sobrescreve valor de `php.ini`. `memory_limit`, `upload_max_filesize`,
# `post_max_size` e `max_execution_time` sao numeros do hospedeiro que o produto
# le e exibe; inventar valor aqui seria inventar numero que o legado nao tem (P6).
# O que `conferir.sh` faz e REGISTRAR os valores em uso, para que o relatorio de
# paridade diga contra que hospedeiro a comparacao foi feita.
#
# Digest fixado: a receita tem de poder ser recriada igual (RISK-022). Trocar a
# imagem e trocar o oraculo, e o oraculo e a instalacao de 7.1.2 que nao muda
# durante o projeto (RISK-021).
FROM php:8.3-apache@sha256:f8506a19d79cad7fcf0c8049f1ed2208824961018fdc10bd80f324094dcd36bd

# `1` liga imagick (1a escolha do produto). `0` deixa so gd (2a escolha), e nesse
# caso o relatorio de `conferir.sh` registra qual editor de imagem o oraculo usou.
ARG ORACULO_IMAGICK=1

# O Apache escuta DENTRO do conteiner na mesma porta que o hospedeiro publica, e
# isso nao e detalhe de gosto: a requisicao de loopback do produto vai ao proprio
# `home_url()` — e `home_url()` carrega a porta do pedido que instalou o site. Com
# porta diferente dentro e fora, o loopback do oraculo falharia por artefato desta
# receita, e nao pelo motivo do legado (timeout de 0,01 s, `blocking` falso,
# `sslverify` falso — `integrations.md`, fatia 5 de `parity_specs.md`). O primeiro
# loopback acontece ja na instalacao, em
# `wp_install_maybe_enable_pretty_permalinks()` (`wp-admin/includes/upgrade.php:500`).
ARG ORACULO_PORTA=8080

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        libfreetype6-dev \
        libjpeg62-turbo-dev \
        libpng-dev \
        libwebp-dev \
        libzip-dev; \
    docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp; \
    docker-php-ext-install -j"$(nproc)" gd mysqli zip exif; \
    a2enmod rewrite; \
    rm -rf /var/lib/apt/lists/*

RUN set -eux; \
    if [ "$ORACULO_IMAGICK" = "1" ]; then \
        apt-get update; \
        apt-get install -y --no-install-recommends libmagickwand-dev; \
        pecl install imagick; \
        docker-php-ext-enable imagick; \
        rm -rf /var/lib/apt/lists/* /tmp/pear; \
    fi

# `AllowOverride All` porque o produto escreve `.htaccess` por conta propria em
# `wp-admin/includes/misc.php` quando o permalink deixa de ser simples. Sem isto o
# mod_rewrite recomendado em `readme.html:63` esta ligado e nao serve para nada.
RUN printf '%s\n' \
    '<Directory /var/www/html>' \
    '    AllowOverride All' \
    '</Directory>' \
    > /etc/apache2/conf-available/oraculo.conf \
    && a2enconf oraculo

RUN set -eux; \
    sed -i "s/^Listen 80$/Listen ${ORACULO_PORTA}/" /etc/apache2/ports.conf; \
    sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${ORACULO_PORTA}>/" /etc/apache2/sites-available/000-default.conf

EXPOSE 8080
