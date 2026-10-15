/**
 * A borda simulada, compartilhada pelo roteiro de terminal e pelo servidor.
 *
 * NAO faz parte da arvore. O slot `framework-http` do pacote esta em aberto e o
 * proprio `tech-stack.json` registra que a borda e "codigo novo, nao porte" —
 * logo isto e andaime descartavel, e vive na scratchpad de proposito.
 *
 * O que ESTE arquivo tem de legitimo: nada aqui decide regra. Ele so monta as
 * portas em memoria e repassa os contratos como as suites os montam.
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** `dist/` ao lado de `demo/`. Rode `npm run build` antes. */
export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

export const ident = await import(`${RAIZ}/contextos/identidade-e-acesso/index.js`);
export const autz = await import(`${RAIZ}/plataforma/autorizacao/index.js`);
export const priv = await import(`${RAIZ}/contextos/privacidade/index.js`);

export const AGORA = 1_700_000_000;

export const PAPEIS = [
  'administrator',
  'editor',
  'author',
  'contributor',
  'subscriber',
];

export const removerAcentos = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');
export const apelidoDeTexto = (t) => t.toLowerCase().replace(/\s+/g, '-');

export const resumoDaChave = {
  resumir: (chave) => `resumo:${chave}`,
  conferir: (chave, resumo) => resumo === `resumo:${chave}`,
};

export const bcryptDeGeracao = {
  gerar(pre) {
    const m = Buffer.from(pre, 'utf8').toString('hex');
    return `$2y$10$${m.slice(0, 53)}`;
  },
};

export const bcryptDeVerificacao = {
  verificar(pre, hash) {
    return hash === bcryptDeGeracao.gerar(pre);
  },
};

export const geradorDeHash = ident.criarGeradorDeHashDeSenhaDoNucleo({
  bcrypt: bcryptDeGeracao,
});

export function sorteioDeterminista() {
  let passo = 0;
  return (limite) => {
    const valor = passo % limite;
    passo += 1;
    return valor;
  };
}

/** Porta de dados em memoria que TAMBEM registra todo comando emitido. */
export function bancoEmMemoria() {
  const contas = [];
  const metadados = [];
  const opcoes = new Map();
  const consultas = [];
  let proximaConta = 1;
  let proximoMetadado = 1;

  const texto = (v) => (v instanceof Uint8Array ? new TextDecoder().decode(v) : String(v));

  const porta = {
    prefixoDeTabela: 'wp_',
    prefixoBaseDeTabela: 'wp_',

    selecionar(consulta) {
      consultas.push({ tipo: 'SELECT', ...consulta });
      if (consulta.texto.includes('FROM wp_users')) {
        const coluna = consulta.texto.includes('WHERE ID')
          ? 'ID'
          : consulta.texto.includes('WHERE user_login')
            ? 'user_login'
            : consulta.texto.includes('WHERE user_email')
              ? 'user_email'
              : 'user_nicename';
        const alvo = texto(consulta.parametros[0]);
        return contas.filter((l) => String(l[coluna]) === alvo);
      }
      if (consulta.texto.includes('FROM wp_usermeta')) {
        const contaId = Number(consulta.parametros[0]);
        const chave = texto(consulta.parametros[1]);
        return metadados.filter((l) => l.user_id === contaId && l.meta_key === chave);
      }
      if (consulta.texto.includes('FROM wp_options')) {
        const valor = opcoes.get(texto(consulta.parametros[0]));
        return valor === undefined ? [] : [{ option_value: valor }];
      }
      return [];
    },

    escrever(consulta) {
      consultas.push({ tipo: 'ESCRITA', ...consulta });
      const p = consulta.parametros;

      if (consulta.texto.startsWith('INSERT INTO wp_users')) {
        const id = proximaConta;
        proximaConta += 1;
        contas.push({
          ID: id,
          user_login: texto(p[0]),
          user_pass: texto(p[1]),
          user_nicename: texto(p[2]),
          user_email: texto(p[3]),
          user_url: texto(p[4]),
          user_registered: texto(p[5]),
          user_activation_key: texto(p[6]),
          user_status: 0,
          display_name: texto(p[7]),
        });
        return { linhasAfetadas: 1, idGerado: id };
      }

      if (consulta.texto.startsWith('UPDATE wp_users')) {
        const colunas = /SET (.*) WHERE ID = \?$/.exec(consulta.texto);
        const nomes = (colunas?.[1] ?? '').split(', ').map((a) => a.replace(' = ?', ''));
        const id = Number(p[p.length - 1]);
        const linha = contas.find((c) => c.ID === id);
        if (linha === undefined) return { linhasAfetadas: 0, idGerado: null };
        nomes.forEach((nome, i) => {
          linha[nome] = texto(p[i]);
        });
        return { linhasAfetadas: 1, idGerado: null };
      }

      if (consulta.texto.startsWith('INSERT INTO wp_usermeta')) {
        const id = proximoMetadado;
        proximoMetadado += 1;
        metadados.push({
          umeta_id: id,
          user_id: Number(p[0]),
          meta_key: texto(p[1]),
          meta_value: p[2] ?? null,
        });
        return { linhasAfetadas: 1, idGerado: id };
      }

      if (consulta.texto.startsWith('UPDATE wp_usermeta')) {
        const contaId = Number(p[1]);
        const chave = texto(p[2]);
        let afetadas = 0;
        for (const l of metadados) {
          if (l.user_id === contaId && l.meta_key === chave) {
            l.meta_value = p[0] ?? null;
            afetadas += 1;
          }
        }
        return { linhasAfetadas: afetadas, idGerado: null };
      }

      if (consulta.texto.startsWith('DELETE FROM wp_usermeta')) {
        return { linhasAfetadas: 0, idGerado: null };
      }

      if (consulta.texto.startsWith('INSERT INTO wp_options')) {
        opcoes.set(texto(p[0]), p[1] ?? null);
        return { linhasAfetadas: 1, idGerado: null };
      }
      if (consulta.texto.startsWith('UPDATE wp_options')) {
        opcoes.set(texto(p[1]), p[0] ?? null);
        return { linhasAfetadas: 1, idGerado: null };
      }

      return { linhasAfetadas: 0, idGerado: null };
    },
  };

  return { porta, consultas, contas, metadados, opcoes };
}

/** O mapa de sessoes pela porta, em memoria. A persistencia em usermeta e T002. */
export function mapaDeSessoesEmMemoria() {
  const porConta = new Map();
  return {
    ler: (id) => porConta.get(id) ?? {},
    gravar: (id, sessoes) => porConta.set(id, sessoes),
    todas: () => porConta,
  };
}

/** Uma instalacao nova: banco vazio, matriz de papeis semeada como na instalacao. */
export function instalacaoNova({
  cadastroAberto = false,
  contasDeExemplo = true,
} = {}) {
  const banco = bancoEmMemoria();
  const armazenamento = ident.criarArmazenamento(banco.porta);
  // Povoar e operacao de INSTALACAO, nunca de requisicao (PERM-13).
  armazenamento.papeis.gravarDefinicao(ident.povoarPapeis('legado-integral'));

  const enviadas = [];
  const email = {
    enviar(mensagem) {
      enviadas.push({ ...mensagem, em: Date.now() });
      return { enviado: true };
    },
  };

  const sessoes = mapaDeSessoesEmMemoria();
  const comandosDaSemeadura = banco.consultas.length;

  const inst = {
    banco,
    armazenamento,
    enviadas,
    email,
    sessoes,
    comandosDaSemeadura,
    opcoes: { cadastroAberto },
  };

  // Uma conta por papel, como a borda criaria depois de instalar. Quem quer
  // afirmar "zero comandos" numa instalacao recem-feita pede `contasDeExemplo: false`.
  inst.contasPorPapel = new Map();
  if (contasDeExemplo === false) {
    return inst;
  }
  for (const papel of PAPEIS) {
    const id = armazenamento.contas.inserir({
      login: papel,
      senhaHash: geradorDeHash.gerar(`senha-${papel}`),
      apelido: papel,
      email: `${papel}@exemplo.invalido`,
      url: '',
      registradoEm: '2026-01-01 00:00:00',
      chaveDeAtivacao: '',
      nomeExibido: papel,
    });
    // O papel entra como CONCESSAO, no mesmo mapa das capacidades (PERM-2).
    armazenamento.papeis.gravarCapacidadesDaConta(id, [
      { capacidade: papel, concedida: true },
    ]);
    inst.contasPorPapel.set(papel, id);
  }

  return inst;
}

export function baseDeAutorizacao(inst) {
  return {
    // Lida POR REQUISICAO, nao guardada (PERM-13, CA-7.2).
    matriz: ident.matrizGravada(inst.armazenamento),
    rede: autz.REDE_INATIVA_NA_AUTORIZACAO,
  };
}

export function fonteDeAutorizacao(inst) {
  return ident.criarFonteDeAutorizacao(inst.armazenamento);
}

export function contextoDeAutenticacao(inst) {
  return {
    relogio: { agoraEmSegundos: () => Math.floor(Date.now() / 1000) },
    contas: ident.criarLeituraDeConta(inst.banco.porta),
    sessoes: inst.sessoes,
    verificadorDeSenha: ident.criarVerificadorDeSenhaDoNucleo({
      bcrypt: bcryptDeVerificacao,
    }),
    removerAcentos,
    rede: ident.REDE_INATIVA,
    urlDeSenhaPerdida: '/entrar?acao=lostpassword',
    urlDoPainel: '/',
  };
}

export function contextoDeCadastro(inst) {
  return {
    relogio: { agoraEmSegundos: () => Math.floor(Date.now() / 1000) },
    email: inst.email,
    contas: inst.armazenamento.contas,
    papeis: inst.armazenamento.papeis,
    opcoes: {
      ...ident.OPCOES_DO_CADASTRO_DE_FABRICA,
      cadastroAberto: inst.opcoes.cadastroAberto,
      tituloDoSite: 'Porte TS',
      emailDoAdministrador: 'administrator@exemplo.invalido',
    },
    rede: ident.REDE_INATIVA,
    destinos: {
      cadastroEmRede: '/cadastrar?rede=1',
      cadastroDesligado: '/entrar?registration=disabled',
      avisoDeCadastro: '/entrar?checkemail=registered',
    },
    urlDeEntrada: '/entrar',
    montarUrlDaRede: (caminho) => `/${caminho}`,
    removerAcentos,
    apelidoDeTexto,
    resumoDaChave,
    geradorDeHashDeSenha: geradorDeHash,
    aleatorio: sorteioDeterminista(),
    ganchos: {},
  };
}
