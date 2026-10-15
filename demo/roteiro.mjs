/**
 * O mesmo porte, no terminal — para quem nao quer subir o servidor.
 *
 * NAO faz parte da arvore: ver `README.md` desta pasta. Toda a borda simulada
 * mora em `nucleo.mjs`; aqui so ha as cinco cenas e a pintura.
 *
 *   npm run build && node demo/roteiro.mjs
 */

import {
  PAPEIS,
  autz,
  baseDeAutorizacao,
  contextoDeAutenticacao,
  contextoDeCadastro,
  fonteDeAutorizacao,
  geradorDeHash,
  ident,
  instalacaoNova,
  priv,
} from './nucleo.mjs';

/* ───────────────────────── pintura de terminal ───────────────────────── */

const cor = (c, t) => `\x1b[${c}m${t}\x1b[0m`;
const neg = (t) => cor('1', t);
const verde = (t) => cor('32', t);
const vermelho = (t) => cor('31', t);
const amarelo = (t) => cor('33', t);
const cinza = (t) => cor('90', t);

let cena = 0;
function titulo(texto) {
  cena += 1;
  console.log(`\n${neg(`${cena}. ${texto}`)}`);
  console.log(cinza('─'.repeat(72)));
}
const sim = verde('sim');
const nao = vermelho('nao');
const marca = (v) => (v ? sim : nao);

/* ══════════════════════════════ CENA 1 ══════════════════════════════ */

titulo('A matriz de papeis que a instalacao nova semeia');

const inst = instalacaoNova();
const base = baseDeAutorizacao(inst);
const fonte = fonteDeAutorizacao(inst);

console.log(
  `  ${base.matriz.length} papeis povoados, como o legado povoa em ` +
    cinza('wp-admin/includes/schema.php') +
    ':\n',
);
for (const papel of base.matriz) {
  const concedidas = papel.capacidades.filter((c) => c.concedida).length;
  const negadas = papel.capacidades.length - concedidas;
  console.log(
    `  ${papel.identificador.padEnd(16)}${String(concedidas).padStart(3)} capacidades concedidas` +
      (negadas > 0 ? cinza(`  (+${negadas} negadas explicitamente)`) : ''),
  );
}

/* ══════════════════════════════ CENA 2 ══════════════════════════════ */

titulo('A mesma pergunta de capacidade, papel por papel');

const PERGUNTAS = [
  ['read', 'ler o site'],
  ['publish_posts', 'publicar conteudo proprio'],
  ['edit_others_posts', 'editar conteudo alheio'],
  ['manage_categories', 'administrar classificacao'],
  ['export_others_personal_data', 'exportar dado pessoal de terceiro'],
  ['delete_users', 'apagar contas'],
  ['manage_options', 'administrar a instalacao'],
];

const cabecalho = PAPEIS.map((p) => p.slice(0, 7).padStart(8)).join('');
console.log(`  ${''.padEnd(36)}${cabecalho}${'  anonimo'}`);
for (const [capacidade, humano] of PERGUNTAS) {
  const celulas = PAPEIS.map((papel) => {
    const ator = autz.atorDeAutorizacao(inst.contasPorPapel.get(papel), fonte);
    const pode = autz.perguntarPermissao(autz.comAtor(base, ator), capacidade);
    return (pode ? verde('  ok   ') : cinza('  ---  ')).padStart(8);
  }).join('');
  const anonimo = autz.perguntarPermissao(
    autz.comAtor(base, autz.ATOR_ANONIMO),
    capacidade,
  );
  console.log(
    `  ${humano.padEnd(36)}${celulas}${anonimo ? verde('    ok') : cinza('   ---')}`,
  );
}
console.log(cinza('\n  (cada celula e uma chamada real a perguntarPermissao)'));

/* ══════════════════════════════ CENA 3 ══════════════════════════════ */

titulo('Cadastro aberto: o portao que nasce FECHADO');

// Sem as contas de exemplo: a cena afirma "zero comandos", e a semeadura delas
// contaria como efeito do cadastro.
const fechada = instalacaoNova({ cadastroAberto: false, contasDeExemplo: false });
fechada.banco.consultas.length = 0;
const r1 = ident.cadastrar(
  { login: 'ada', email: 'ada@exemplo.invalido' },
  contextoDeCadastro(fechada),
);
console.log('  com users_can_register desligado (o default do legado):');
console.log(
  `    cadastrado: ${marca(r1.cadastrado)}    motivo: ${amarelo(r1.motivo ?? '-')}`,
);
console.log(`    contas no banco: ${fechada.banco.contas.length}`);
console.log(`    e-mails enviados: ${fechada.enviadas.length}`);
console.log(`    comandos emitidos: ${fechada.banco.consultas.length}`);

const aberta = instalacaoNova({ cadastroAberto: true, contasDeExemplo: false });
aberta.banco.consultas.length = 0;
const r2 = ident.cadastrar(
  { login: 'ada', email: 'ada@exemplo.invalido' },
  contextoDeCadastro(aberta),
);
console.log('\n  com users_can_register ligado:');
console.log(`    cadastrado: ${marca(r2.cadastrado)}`);
const nova = aberta.banco.contas[0];
if (nova !== undefined) {
  console.log(
    `    conta #${nova.ID}: login=${neg(nova.user_login)}  apelido=${nova.user_nicename}  email=${nova.user_email}`,
  );
  console.log(
    `    user_pass gravado: ${cinza(String(nova.user_pass).slice(0, 24) + '...')}`,
  );
  const papel = aberta.armazenamento.papeis.obterCapacidadesDaConta(nova.ID);
  console.log(`    papel atribuido: ${neg(JSON.stringify(papel?.interpretado ?? []))}`);
}
console.log(`    e-mails enviados: ${aberta.enviadas.length}`);
for (const msg of aberta.enviadas) {
  console.log(
    `      -> ${msg.destinatarios.join(', ')}  ${cinza(`assunto: ${msg.assunto}`)}`,
  );
}

console.log(`\n  ${neg('os comandos que o cadastro emitiu, na ordem:')}`);
for (const c of aberta.banco.consultas) {
  console.log(`    ${cinza(c.texto.replace(/\s+/g, ' ').slice(0, 96))}`);
}

/* ══════════════════════════════ CENA 4 ══════════════════════════════ */

titulo('Entrar: autenticar() nas cinco tentativas');

const senhaReal = 'senha-correta';
const comConta = instalacaoNova({ contasDeExemplo: false });
comConta.armazenamento.contas.inserir({
  login: 'ada',
  senhaHash: geradorDeHash.gerar(senhaReal),
  apelido: 'ada',
  email: 'ada@exemplo.invalido',
  url: '',
  registradoEm: '2026-01-01 00:00:00',
  chaveDeAtivacao: '',
  nomeExibido: 'Ada',
});

const ctxAut = contextoDeAutenticacao(comConta);
const tentativas = [
  ['campo vazio', { login: '', senha: '' }],
  ['login inexistente', { login: 'ninguem', senha: senhaReal }],
  ['senha errada', { login: 'ada', senha: 'chute' }],
  ['por e-mail, senha certa', { login: 'ada@exemplo.invalido', senha: senhaReal }],
  ['por login, senha certa', { login: 'ada', senha: senhaReal }],
];

for (const [rotulo, credenciais] of tentativas) {
  const r = ident.autenticar(credenciais, ctxAut);
  if (r.autenticado === true) {
    console.log(
      `  ${rotulo.padEnd(26)} ${sim}   ` +
        cinza(`conta #${r.conta.id} (${r.conta.login}), sessao aberta`),
    );
    console.log(
      `  ${''.padEnd(26)}      ` +
        cinza(`destino: ${r.destinoDeRetorno}`),
    );
  } else {
    console.log(`  ${rotulo.padEnd(26)} ${nao}   ` + cinza(`motivo: ${r.motivo}`));
    for (const item of r.erro?.itens ?? []) {
      console.log(
        `  ${''.padEnd(26)}      ` +
          cinza(`[${item.codigo}] "${String(item.mensagem).slice(0, 72)}"`),
      );
    }
  }
}

/* ══════════════════════════════ CENA 5 ══════════════════════════════ */

titulo('Privacidade: as duas telas de dado pessoal, papel por papel');

console.log(
  '  o legado soma DUAS capacidades na tela de apagar ' +
    cinza('(wp-admin/erase-personal-data.php:12)') +
    ', e uma na de exportar:\n',
);
console.log(
  `    exportar -> ${JSON.stringify(priv.CAPACIDADES_POR_ACAO.export_personal_data)}`,
);
console.log(
  `    apagar   -> ${JSON.stringify(priv.CAPACIDADES_POR_ACAO.remove_personal_data)}\n`,
);

/**
 * O ponto da cena: os tres nomes NAO estao em papel algum da matriz de fabrica —
 * o povoamento portado vai de 1.6 a 2.8, e estas capacidades sao de 4.9.6. Quem
 * as concede e um CASO DE TRADUCAO que o contexto da operacao injeta. Sem ele,
 * nem o administrador exporta dado pessoal — e o proprio arquivo avisa disso
 * (`caso-de-poder-de-privacidade.ts:148`).
 */
const baseComTraducao = {
  ...base,
  casosDeTraducao: [priv.casoDePoderDePrivacidade],
};

console.log(
  `  ${neg('papeis da matriz de fabrica que concedem os tres nomes:')} ` +
    `${JSON.stringify(priv.papeisQueConcedemPoderDePrivacidade(base.matriz))}` +
    cinza('  <- vazio: elas sao de 4.9.6, e o povoamento portado vai ate 2.8'),
);
console.log();

for (const superficie of Object.keys(priv.ACAO_DA_SUPERFICIE)) {
  console.log(
    `  ${neg(superficie)}  ${cinza(`(acao: ${priv.ACAO_DA_SUPERFICIE[superficie]})`)}`,
  );
  console.log(cinza('    papel           sem o caso de traducao     com o caso injetado'));
  for (const papel of PAPEIS) {
    const ator = autz.atorDeAutorizacao(inst.contasPorPapel.get(papel), fonte);
    const sem = priv.autorizarAbertura({ base, ator }, superficie);
    const com = priv.autorizarAbertura({ base: baseComTraducao, ator }, superficie);
    console.log(
      `    ${papel.padEnd(16)}${marca(sem.desfecho === 'autorizado').padEnd(21)}` +
        `${marca(com.desfecho === 'autorizado')}` +
        (com.desfecho === 'autorizado'
          ? ''
          : cinza(`   ${com.recusa.codigoHttp} "${com.recusa.mensagem.slice(0, 46)}"`)),
    );
  }
  console.log();
}

console.log(cinza('─'.repeat(72)));
console.log(
  `${neg('Nada aqui e banco, rede ou relogio real.')} ` +
    cinza('Toda borda entrou por porta-falsa, como o P6 da constituicao manda.'),
);
console.log();
