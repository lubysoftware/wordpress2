/**
 * O adaptador HTTP que o pacote NAO tem — andaime descartavel, fora da arvore.
 *
 * O slot `framework-http` de `.specify/arquitetura/tech-stack.json` esta em
 * aberto, e o proprio pacote registra que a borda "e codigo novo, nao porte".
 * Este arquivo nao decide o slot: ele usa `node:http` cru, sem dependencia, so
 * para que o porte possa ser visto num navegador. Nenhuma regra mora aqui — toda
 * decisao vem de `dist/`, pelas operacoes publicadas.
 *
 *   node servidor.mjs        ->  http://127.0.0.1:7112
 */

import { createServer } from 'node:http';

import {
  PAPEIS,
  autz,
  baseDeAutorizacao,
  contextoDeAutenticacao,
  contextoDeCadastro,
  fonteDeAutorizacao,
  ident,
  instalacaoNova,
  priv,
} from './nucleo.mjs';

const PORTA = Number(process.env.PORTA ?? 7112);

/** Uma instalacao por processo. Reiniciar o servidor = instalar de novo. */
let inst = instalacaoNova({ cadastroAberto: false });

/* ───────────────────────────── chassi HTML ───────────────────────────── */

const esc = (v) =>
  String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const CSS = `
:root{--bg:#fbfaf8;--pane:#fff;--ink:#1a1a1a;--dim:#6b6b6b;--line:#e3e0da;
--ok:#1a7f4b;--no:#b3261e;--warn:#8a6d00;--accent:#2b4c7e;--mono:ui-monospace,SFMono-Regular,Menlo,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#14151a;--pane:#1b1d23;
--ink:#e8e6e3;--dim:#9a9a9a;--line:#2e3138;--ok:#4ec47e;--no:#ef6f68;--warn:#d6b23d;--accent:#8fb3e0}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 ui-sans-serif,system-ui,-apple-system,sans-serif}
.wrap{max-width:980px;margin:0 auto;padding:28px 16px 64px}
header{border-bottom:1px solid var(--line);margin-bottom:24px;padding-bottom:16px}
h1{font-size:20px;margin:0 0 4px;letter-spacing:-.01em}
h2{font-size:15px;margin:28px 0 10px;letter-spacing:.02em;text-transform:uppercase;color:var(--dim)}
.sub{color:var(--dim);font-size:13px;margin:0}
nav{display:flex;flex-wrap:wrap;gap:4px;margin-top:14px}
nav a{padding:5px 11px;border:1px solid var(--line);border-radius:999px;text-decoration:none;
color:var(--ink);font-size:13px;background:var(--pane)}
nav a.on{background:var(--accent);color:var(--bg);border-color:var(--accent)}
.card{background:var(--pane);border:1px solid var(--line);border-radius:10px;padding:16px 18px;margin:12px 0}
table{width:100%;border-collapse:collapse;font-size:13.5px}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-weight:600;color:var(--dim);font-size:12px;text-transform:uppercase;letter-spacing:.03em}
td.c,th.c{text-align:center}
code,pre,.mono{font-family:var(--mono);font-size:12.5px}
pre{background:var(--bg);border:1px solid var(--line);border-radius:7px;padding:10px;overflow-x:auto;margin:0}
.ok{color:var(--ok);font-weight:600}.no{color:var(--no);font-weight:600}
.dim{color:var(--dim)}.warn{color:var(--warn)}
label{display:block;font-size:12px;color:var(--dim);margin:10px 0 3px;text-transform:uppercase;letter-spacing:.03em}
input[type=text],input[type=password]{width:100%;padding:8px 10px;border:1px solid var(--line);
border-radius:7px;background:var(--bg);color:var(--ink);font-size:14px}
button{margin-top:14px;padding:8px 16px;border:0;border-radius:7px;background:var(--accent);
color:var(--bg);font-size:14px;font-weight:600;cursor:pointer}
.aviso{border-left:3px solid var(--no);padding:8px 12px;background:var(--bg);border-radius:0 7px 7px 0;margin:8px 0}
.aviso.bom{border-left-color:var(--ok)}
.flex{display:flex;gap:18px;flex-wrap:wrap}.flex>*{flex:1;min-width:260px}
.pill{display:inline-block;padding:1px 7px;border:1px solid var(--line);border-radius:999px;font-size:11.5px;color:var(--dim)}
footer{margin-top:40px;padding-top:14px;border-top:1px solid var(--line);color:var(--dim);font-size:12px}
@media (max-width:520px){.wrap{padding:18px 16px 48px}}
`;

function pagina(titulo, caminho, corpo, sessao) {
  const abas = [
    ['/', 'painel'],
    ['/entrar', 'entrar'],
    ['/cadastrar', 'cadastro'],
    ['/autorizacao', 'autorizacao'],
    ['/privacidade', 'privacidade'],
    ['/comandos', 'comandos'],
  ];
  const quem =
    sessao === null
      ? '<span class="dim">anonimo</span>'
      : `<span class="ok">${esc(sessao.login)}</span> <span class="pill">conta #${sessao.id}</span> &middot; <a href="/sair" class="dim">sair</a>`;

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titulo)}</title><style>${CSS}</style></head><body><div class="wrap">
<header><h1>Porte do nucleo do WordPress 7.1.2 &rarr; TypeScript</h1>
<p class="sub">Adaptador HTTP descartavel sobre <code>dist/</code>. Nenhuma regra mora na borda:
toda decisao abaixo sai de uma operacao publicada do porte. Sessao: ${quem}</p>
<nav>${abas
    .map(
      ([href, rotulo]) =>
        `<a href="${href}"${href === caminho ? ' class="on"' : ''}>${rotulo}</a>`,
    )
    .join('')}</nav></header>
${corpo}
<footer>101 de 301 tarefas do pacote Spec Kit fechadas &middot; 2226 testes verdes &middot;
banco, relogio e e-mail entram por porta-falsa em memoria &mdash; reiniciar o processo reinstala o site.</footer>
</div></body></html>`;
}

/* ──────────────────────── sessao pela operacao real ──────────────────────── */

function sessaoDaRequisicao(cookies) {
  const bruto = cookies['wp_token'];
  if (bruto === undefined) return null;
  const [idTexto, token] = bruto.split(':');
  const idDaConta = Number(idTexto);
  if (!Number.isInteger(idDaConta) || token === undefined) return null;

  // A operacao de US-3 (T007), exatamente como publicada.
  const r = ident.sessaoDaRequisicao(
    inst.sessoes,
    { idDaConta, token },
    Math.floor(Date.now() / 1000),
  );
  if (r.reconhecida !== true) return null;

  const conta = inst.armazenamento.contas.obterPorId(r.idDaConta);
  if (conta === null) return null;
  return { id: conta.id, login: conta.login, resumoDoToken: r.resumoDoToken };
}

/* ─────────────────────────────── as paginas ─────────────────────────────── */

function painel() {
  const base = baseDeAutorizacao(inst);
  const linhas = base.matriz
    .map((papel) => {
      const concedidas = papel.capacidades.filter((c) => c.concedida).length;
      const negadas = papel.capacidades.length - concedidas;
      const id = inst.contasPorPapel.get(papel.identificador);
      return `<tr><td><code>${esc(papel.identificador)}</code></td>
<td class="c">${concedidas}</td><td class="c dim">${negadas || ''}</td>
<td class="dim">conta #${id} &middot; senha <code>senha-${esc(papel.identificador)}</code></td></tr>`;
    })
    .join('');

  return `
<div class="card"><h2 style="margin-top:0">Estado da instalacao</h2>
<table><tr><th>papeis povoados</th><td>${base.matriz.length} <span class="dim">&mdash; <code>povoarPapeis('legado-integral')</code>, como o legado povoa em <code>schema.php</code></span></td></tr>
<tr><th>contas</th><td>${inst.banco.contas.length}</td></tr>
<tr><th>cadastro aberto</th><td>${
    inst.opcoes.cadastroAberto
      ? '<span class="ok">ligado</span>'
      : '<span class="no">desligado</span> <span class="dim">&mdash; o default do legado (<code>U1</code>, BR-MIGRAR-021)</span>'
  }</td></tr>
<tr><th>comandos emitidos</th><td>${inst.banco.consultas.length} <span class="dim">(${inst.comandosDaSemeadura} deles pela semeadura)</span></td></tr>
<tr><th>e-mails</th><td>${inst.enviadas.length}</td></tr></table></div>

<h2>A matriz de papeis, como esta gravada</h2>
<div class="card"><table>
<tr><th>papel</th><th class="c">concedidas</th><th class="c">negadas</th><th>credencial de teste</th></tr>
${linhas}</table>
<p class="sub" style="margin-top:12px">Lida por requisicao e nao guardada: <code>PERM-13</code> e CA-7.2 exigem
que uma alteracao em execucao passe a valer.</p></div>

<h2>O que esta borda nao e</h2>
<div class="card"><p class="sub" style="margin:0">Nao ha front controller, nao ha reescrita de URL, nao ha cabecalho do
legado. O pacote tem 301 tarefas e <strong>nenhuma</strong> entrega a borda HTTP: existe so o slot
<code>framework-http</code>, em aberto, com <code>node-http</code> recomendado. Os 109 front controllers,
o reescritor proprio e as 209 chamadas <code>header()</code> do legado continuam sem porte.</p></div>`;
}

function paginaDeEntrada(resultado) {
  let saida = '';
  if (resultado !== undefined) {
    if (resultado.autenticado === true) {
      saida = `<div class="aviso bom"><strong class="ok">Autenticado.</strong>
conta #${resultado.conta.id} (<code>${esc(resultado.conta.login)}</code>), sessao aberta,
destino <code>${esc(resultado.destinoDeRetorno)}</code>.</div>`;
    } else if (resultado.motivo === 'credencial-invalida') {
      saida = (resultado.erro?.itens ?? [])
        .map(
          (i) =>
            `<div class="aviso"><span class="pill">${esc(i.codigo)}</span><br>${i.mensagem}</div>`,
        )
        .join('');
    } else {
      saida = `<div class="aviso"><strong class="no">Recusado.</strong> motivo <code>${esc(resultado.motivo)}</code></div>`;
    }
  }

  return `
<h2>Entrar</h2>
<div class="flex">
<div class="card"><form method="post" action="/entrar">
<label>login ou e-mail</label><input type="text" name="login" value="administrator" autocomplete="off">
<label>senha</label><input type="password" name="senha" value="senha-administrator">
<button type="submit">entrar</button></form></div>
<div class="card"><p class="sub" style="margin:0 0 8px"><strong>O que roda aqui:</strong>
<code>autenticar(credenciais, contexto)</code> &mdash; US-1 / T003.</p>
<p class="sub" style="margin:0">Nenhuma capacidade e exigida, e a declaracao e o ponto: UC-19 fixa que
<em>"nenhuma capacidade e exigida para entrar: o papel decide o que a pessoa faz depois, nao se ela entra"</em>.
As mensagens de erro saem do porte com a cadeia do legado, <code>&lt;strong&gt;Error:&lt;/strong&gt;</code> inclusive.</p>
<p class="sub" style="margin:10px 0 0">Experimente: campo vazio, login inexistente, senha errada.</p></div>
</div>
${saida}`;
}

function paginaDeCadastro(resultado) {
  let saida = '';
  if (resultado !== undefined) {
    const r = resultado.r;
    if (r.cadastrado === true) {
      const nova = inst.banco.contas[inst.banco.contas.length - 1];
      const papel = inst.armazenamento.papeis.obterCapacidadesDaConta(nova.ID);
      saida = `<div class="aviso bom"><strong class="ok">Cadastrado.</strong>
conta #${nova.ID} &middot; login <code>${esc(nova.user_login)}</code> &middot;
apelido <code>${esc(nova.user_nicename)}</code><br>
papel atribuido: <code>${esc(JSON.stringify(papel?.interpretado ?? []))}</code>
<span class="dim">&mdash; o de menor poder, CA-6.4</span><br>
<code>user_pass</code>: <span class="mono dim">${esc(String(nova.user_pass).slice(0, 34))}...</span><br>
chave de ativacao: <span class="mono dim">${esc(String(nova.user_activation_key).slice(0, 34))}...</span></div>
<h2>Os comandos que o cadastro emitiu, na ordem</h2>
<div class="card"><pre>${resultado.comandos
        .map((c) => esc(c.texto.replace(/\s+/g, ' ')))
        .join('\n')}</pre></div>
${
  resultado.emails.length > 0
    ? `<h2>E-mail</h2><div class="card">${resultado.emails
        .map(
          (m) =>
            `<p class="sub" style="margin:0 0 6px"><strong>para</strong> ${esc(m.destinatarios.join(', '))}<br>
<strong>assunto</strong> ${esc(m.assunto)}</p><pre>${esc(m.corpo)}</pre>`,
        )
        .join('')}</div>`
    : ''
}`;
    } else if (r.motivo === 'dados-recusados') {
      saida = (r.erro?.itens ?? r.erros ?? [])
        .map(
          (i) =>
            `<div class="aviso"><span class="pill">${esc(i.codigo ?? '?')}</span><br>${i.mensagem ?? esc(JSON.stringify(i))}</div>`,
        )
        .join('');
      if (saida === '') {
        saida = `<div class="aviso"><strong class="no">Dados recusados.</strong> <pre>${esc(JSON.stringify(r, null, 1))}</pre></div>`;
      }
    } else {
      saida = `<div class="aviso"><strong class="no">Recusado.</strong>
motivo <code>${esc(r.motivo)}</code>
${
  r.motivo === 'cadastro-desligado'
    ? `<br><span class="dim">E o default: a opcao <code>users_can_register</code> nasce desligada.
Zero comandos emitidos, zero e-mails &mdash; CA-6.1 / CA-1.5.</span>`
    : ''
}</div>`;
    }
  }

  return `
<h2>Cadastro aberto</h2>
<div class="flex">
<div class="card"><p class="sub" style="margin:0 0 10px">opcao <code>users_can_register</code>:
${
  inst.opcoes.cadastroAberto
    ? '<span class="ok">ligada</span>'
    : '<span class="no">desligada</span>'
}
&nbsp;<a href="/alternar-cadastro" class="pill">alternar</a></p>
<form method="post" action="/cadastrar">
<label>login</label><input type="text" name="login" value="ada" autocomplete="off">
<label>e-mail</label><input type="text" name="email" value="ada@exemplo.invalido" autocomplete="off">
<button type="submit">cadastrar</button></form></div>
<div class="card"><p class="sub" style="margin:0 0 8px"><strong>O que roda aqui:</strong>
<code>cadastrar(dados, contexto)</code> &mdash; US-6 / T013, caso de uso UC-21.</p>
<p class="sub" style="margin:0">E a unica operacao do modulo cuja porta <strong>nasce fechada</strong>.
Quem autoriza nao e capacidade nenhuma: e a opcao, <em>"que nasce desligada; sem ela, este caso de uso
nao existe na instalacao"</em>. Com ela desligada o porte nao emite comando nenhum &mdash; e isso e
efeito no banco, nao otimizacao.</p>
<p class="sub" style="margin:10px 0 0">Experimente: login &gt; 60 caracteres, e-mail invalido, login repetido.</p></div>
</div>
${saida}`;
}

function paginaDeAutorizacao() {
  const base = baseDeAutorizacao(inst);
  const fonte = fonteDeAutorizacao(inst);

  const PERGUNTAS = [
    ['read', 'ler o site'],
    ['publish_posts', 'publicar conteudo proprio'],
    ['edit_posts', 'editar conteudo proprio'],
    ['edit_others_posts', 'editar conteudo alheio'],
    ['manage_categories', 'administrar classificacao'],
    ['upload_files', 'enviar arquivo'],
    ['moderate_comments', 'moderar comentario'],
    ['export_others_personal_data', 'exportar dado pessoal de terceiro'],
    ['delete_users', 'apagar contas'],
    ['manage_options', 'administrar a instalacao'],
  ];

  const atores = PAPEIS.map((p) => [
    p,
    autz.atorDeAutorizacao(inst.contasPorPapel.get(p), fonte),
  ]);

  const corpo = PERGUNTAS.map(([capacidade, humano]) => {
    const celulas = atores
      .map(([, ator]) => {
        const pode = autz.perguntarPermissao(autz.comAtor(base, ator), capacidade);
        return `<td class="c">${pode ? '<span class="ok">&#10003;</span>' : '<span class="dim">&middot;</span>'}</td>`;
      })
      .join('');
    const anon = autz.perguntarPermissao(
      autz.comAtor(base, autz.ATOR_ANONIMO),
      capacidade,
    );
    return `<tr><td>${esc(humano)}<br><code class="dim">${esc(capacidade)}</code></td>${celulas}
<td class="c">${anon ? '<span class="ok">&#10003;</span>' : '<span class="dim">&middot;</span>'}</td></tr>`;
  }).join('');

  return `
<h2>Decisao de capacidade, papel por papel</h2>
<div class="card"><table>
<tr><th>pergunta</th>${PAPEIS.map((p) => `<th class="c">${esc(p.slice(0, 7))}</th>`).join('')}<th class="c">anonimo</th></tr>
${corpo}</table>
<p class="sub" style="margin-top:12px">Cada celula e uma chamada real a <code>perguntarPermissao(contexto, capacidade)</code>.
A capacidade pedida nunca e comparada direto: compara-se o que a traducao devolveu (<code>PERM-3</code>).</p>
<p class="sub" style="margin:8px 0 0"><code>export_others_personal_data</code> nao passa para ninguem, e esta certo &mdash;
veja <a href="/privacidade">privacidade</a>.</p></div>`;
}

function paginaDePrivacidade() {
  const base = baseDeAutorizacao(inst);
  const fonte = fonteDeAutorizacao(inst);
  const comTraducao = { ...base, casosDeTraducao: [priv.casoDePoderDePrivacidade] };
  const papeisComPoder = priv.papeisQueConcedemPoderDePrivacidade(base.matriz);

  const blocos = Object.keys(priv.ACAO_DA_SUPERFICIE)
    .map((superficie) => {
      const linhas = PAPEIS.map((papel) => {
        const ator = autz.atorDeAutorizacao(inst.contasPorPapel.get(papel), fonte);
        const sem = priv.autorizarAbertura({ base, ator }, superficie);
        const com = priv.autorizarAbertura({ base: comTraducao, ator }, superficie);
        const cel = (d) =>
          d.desfecho === 'autorizado'
            ? '<span class="ok">autorizado</span>'
            : `<span class="no">${d.recusa.codigoHttp}</span>`;
        return `<tr><td><code>${esc(papel)}</code></td><td class="c">${cel(sem)}</td>
<td class="c">${cel(com)}</td><td class="dim">${
          com.desfecho === 'autorizado' ? '' : esc(com.recusa.mensagem)
        }</td></tr>`;
      }).join('');

      return `<h2>${esc(superficie)} <span class="pill">acao: ${esc(priv.ACAO_DA_SUPERFICIE[superficie])}</span></h2>
<div class="card"><table>
<tr><th>papel</th><th class="c">sem o caso<br>de traducao</th><th class="c">com o caso<br>injetado</th><th>wp_die</th></tr>
${linhas}</table></div>`;
    })
    .join('');

  return `
<div class="card"><p class="sub" style="margin:0 0 8px">O legado soma <strong>duas</strong> capacidades na tela de apagar
(<code>wp-admin/erase-personal-data.php:12</code>) e uma na de exportar:</p>
<pre>exportar &rarr; ${esc(JSON.stringify(priv.CAPACIDADES_POR_ACAO.export_personal_data))}
apagar   &rarr; ${esc(JSON.stringify(priv.CAPACIDADES_POR_ACAO.remove_personal_data))}</pre>
<p class="sub" style="margin:10px 0 0">Papeis da matriz de fabrica que concedem os tres nomes:
<code>${esc(JSON.stringify(papeisComPoder))}</code> &mdash; <strong>vazio</strong>. Elas sao de 4.9.6, e o povoamento
portado vai de 1.6 a 2.8. Quem as concede e um <strong>caso de traducao</strong> que o contexto da operacao injeta:
sem ele nem o administrador exporta dado pessoal, e o proprio arquivo avisa que isso seria
<em>"um sistema mais fechado do que o legado"</em> (<code>caso-de-poder-de-privacidade.ts:148</code>).</p></div>
${blocos}`;
}

function paginaDeComandos() {
  const linhas = inst.banco.consultas
    .map((c, i) => {
      const params = (c.parametros ?? [])
        .map((p) =>
          p instanceof Uint8Array
            ? `<bytes:${p.length}>`
            : typeof p === 'string' && p.length > 30
              ? `${p.slice(0, 30)}...`
              : String(p),
        )
        .join(', ');
      return `<tr><td class="dim c">${i + 1}</td><td class="c"><span class="pill">${esc(c.tipo)}</span></td>
<td><code>${esc(c.texto.replace(/\s+/g, ' '))}</code>${
        params === '' ? '' : `<br><span class="dim mono">[${esc(params)}]</span>`
      }</td></tr>`;
    })
    .join('');

  return `
<h2>Todo comando que saiu pela porta de dados</h2>
<div class="card"><p class="sub" style="margin:0 0 10px">${inst.banco.consultas.length} comandos, na ordem.
A porta-falsa <strong>registra comando</strong> em vez de simular banco &mdash; e assim que se afirma o caso
em que o legado nao emite comando nenhum.</p>
<table><tr><th class="c">#</th><th class="c">tipo</th><th>comando</th></tr>${linhas}</table></div>`;
}

/* ─────────────────────────────── o servidor ─────────────────────────────── */

function lerCookies(req) {
  const bruto = req.headers.cookie ?? '';
  const mapa = {};
  for (const parte of bruto.split(';')) {
    const [k, ...resto] = parte.trim().split('=');
    if (k) mapa[k] = resto.join('=');
  }
  return mapa;
}

function corpoDoPedido(req) {
  return new Promise((resolve) => {
    let dados = '';
    req.on('data', (p) => {
      dados += p;
      if (dados.length > 1e6) req.destroy();
    });
    req.on('end', () => resolve(new URLSearchParams(dados)));
  });
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const caminho = url.pathname;
  const cookies = lerCookies(req);
  const sessao = sessaoDaRequisicao(cookies);

  const responder = (html, cabecalhos = {}) => {
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      ...cabecalhos,
    });
    res.end(html);
  };
  const redirecionar = (destino, cabecalhos = {}) => {
    res.writeHead(303, { location: destino, ...cabecalhos });
    res.end();
  };

  try {
    if (caminho === '/favicon.ico') {
      // Sem isto o 404 em HTML suja o console do navegador.
      res.writeHead(204);
      return res.end();
    }

    if (caminho === '/' ) {
      return responder(pagina('Porte TS — painel', '/', painel(), sessao));
    }

    if (caminho === '/entrar' && req.method === 'GET') {
      return responder(pagina('Entrar', '/entrar', paginaDeEntrada(), sessao));
    }

    if (caminho === '/entrar' && req.method === 'POST') {
      const form = await corpoDoPedido(req);
      const r = ident.autenticar(
        { login: form.get('login') ?? '', senha: form.get('senha') ?? '' },
        contextoDeAutenticacao(inst),
      );
      const cab =
        r.autenticado === true
          ? {
              'set-cookie': `wp_token=${r.conta.id}:${r.sessao.token}; Path=/; HttpOnly; SameSite=Lax`,
            }
          : {};
      return responder(
        pagina('Entrar', '/entrar', paginaDeEntrada(r), r.autenticado === true ? null : sessao),
        cab,
      );
    }

    if (caminho === '/sair') {
      return redirecionar('/', {
        'set-cookie': 'wp_token=; Path=/; Max-Age=0',
      });
    }

    if (caminho === '/cadastrar' && req.method === 'GET') {
      return responder(pagina('Cadastro', '/cadastrar', paginaDeCadastro(), sessao));
    }

    if (caminho === '/cadastrar' && req.method === 'POST') {
      const form = await corpoDoPedido(req);
      const antes = inst.banco.consultas.length;
      const antesEmail = inst.enviadas.length;
      const r = ident.cadastrar(
        { login: form.get('login') ?? '', email: form.get('email') ?? '' },
        contextoDeCadastro(inst),
      );
      return responder(
        pagina(
          'Cadastro',
          '/cadastrar',
          paginaDeCadastro({
            r,
            comandos: inst.banco.consultas.slice(antes),
            emails: inst.enviadas.slice(antesEmail),
          }),
          sessao,
        ),
      );
    }

    if (caminho === '/alternar-cadastro') {
      inst.opcoes.cadastroAberto = !inst.opcoes.cadastroAberto;
      return redirecionar('/cadastrar');
    }

    if (caminho === '/autorizacao') {
      return responder(
        pagina('Autorizacao', '/autorizacao', paginaDeAutorizacao(), sessao),
      );
    }

    if (caminho === '/privacidade') {
      return responder(
        pagina('Privacidade', '/privacidade', paginaDePrivacidade(), sessao),
      );
    }

    if (caminho === '/comandos') {
      return responder(pagina('Comandos', '/comandos', paginaDeComandos(), sessao));
    }

    if (caminho === '/reinstalar') {
      inst = instalacaoNova({ cadastroAberto: false });
      return redirecionar('/');
    }

    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(
      pagina(
        '404',
        caminho,
        `<div class="card"><p class="sub" style="margin:0"><strong>404.</strong>
Esta borda tem seis rotas. O legado tem 109 front controllers e um reescritor de URL proprio, e nada disso
foi portado &mdash; o slot <code>framework-http</code> esta em aberto.</p></div>`,
        sessao,
      ),
    );
  } catch (erro) {
    res.writeHead(500, { 'content-type': 'text/html; charset=utf-8' });
    res.end(
      pagina(
        'Erro',
        caminho,
        `<div class="card"><p class="sub"><strong class="no">A borda estourou.</strong>
Erro do andaime ou contrato lido errado &mdash; nao e recusa do porte.</p>
<pre>${esc(erro?.stack ?? erro)}</pre></div>`,
        null,
      ),
    );
  }
});

servidor.listen(PORTA, '127.0.0.1', () => {
  console.log(`porte TS servido em http://127.0.0.1:${PORTA}`);
});
