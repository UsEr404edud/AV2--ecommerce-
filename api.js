/**
 * api.js — comunicação com a API do Açougue Prime.
 *
 * Também centraliza a SESSÃO do cliente no LocalStorage:
 *   - "token"        -> token JWT recebido no login
 *   - "usuarioNome"  -> nome do cliente logado
 * E o carrinho de compras:
 *   - "carrinho"     -> JSON com os itens adicionados
 */

const API_URL = 'http://localhost:3000';

// ---------------------------------------------------------------------------
// Requisição base
// ---------------------------------------------------------------------------
async function requisicaoApi(caminho, opcoes = {}) {
  const { metodo = 'GET', corpo = null, autenticado = false } = opcoes;

  const cabecalhos = { 'Content-Type': 'application/json' };
  if (autenticado) {
    if (!usuarioLogado()) {
      throw new Error('Você precisa fazer login para isso.');
    }
    cabecalhos.Authorization = 'Bearer ' + localStorage.getItem('token');
  }

  let resposta;
  try {
    resposta = await fetch(API_URL + caminho, {
      method: metodo,
      headers: cabecalhos,
      body: corpo !== null ? JSON.stringify(corpo) : undefined,
    });
  } catch (erroRede) {
    throw new Error(
      'Não foi possível conectar à API. Verifique se ela está rodando (npm start).',
    );
  }

  let dados = null;
  try {
    dados = await resposta.json();
  } catch (_) {
    dados = null;
  }

  if (!resposta.ok) {
    const mensagemErro = (dados && (dados.erro || dados.mensagem)) ||
      'Erro na requisição (' + resposta.status + ')';
    const erro = new Error(mensagemErro);
    erro.status = resposta.status;
    throw erro;
  }

  return dados;
}

// ---------------------------------------------------------------------------
// Sessão do cliente (LocalStorage: NOME + TOKEN)
// ---------------------------------------------------------------------------
function iniciarSessao(token, nome) {
  localStorage.setItem('token', token);
  localStorage.setItem('usuarioNome', nome);
}

function encerrarSessao() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuarioNome');
}

function usuarioLogado() {
  return !!localStorage.getItem('token');
}

function nomeUsuario() {
  return localStorage.getItem('usuarioNome') || '';
}

// ---------------------------------------------------------------------------
// Chamadas usadas pelo site
// ---------------------------------------------------------------------------
function clienteCadastrar(dados) {
  return requisicaoApi('/cliente', { metodo: 'POST', corpo: dados });
}

function fazerLogin(email, senha) {
  return requisicaoApi('/login', { metodo: 'POST', corpo: { email, senha } });
}

function buscarPerfil() {
  return requisicaoApi('/cliente/perfil', { autenticado: true });
}

function buscarProdutos(filtros = {}) {
  const parametros = new URLSearchParams();
  for (const [chave, valor] of Object.entries(filtros)) {
    if (valor !== '' && valor !== null && valor !== undefined) {
      parametros.set(chave, valor);
    }
  }
  const consulta = parametros.toString();
  return requisicaoApi('/produto' + (consulta ? '?' + consulta : ''));
}

function buscarCategorias() {
  return requisicaoApi('/categorias');
}

// ---------------------------------------------------------------------------
// Carrinho de compras (localStorage: "carrinho")
// ---------------------------------------------------------------------------
function carrinhoItens() {
  try {
    return JSON.parse(localStorage.getItem('carrinho') || '[]');
  } catch (_) {
    return [];
  }
}

function carrinhoSalvar(itens) {
  localStorage.setItem('carrinho', JSON.stringify(itens));
  atualizarContagemCarrinho();
}

function carrinhoAdicionar(produto) {
  const itens = carrinhoItens();
  const existente = itens.find((item) => item.id === produto.id);
  if (existente) {
    existente.qtd += 1;
  } else {
    itens.push({ id: produto.id, nome: produto.nome, preco: produto.preco, emoji: produto.emoji, qtd: 1 });
  }
  carrinhoSalvar(itens);
}

function carrinhoRemover(id) {
  carrinhoSalvar(carrinhoItens().filter((item) => item.id !== id));
}

function carrinhoAtualizarQuantidade(id, quantidade) {
  const itens = carrinhoItens();
  const item = itens.find((i) => i.id === id);
  if (!item) return;
  item.qtd = Math.max(1, Math.min(99, Number(quantidade) || 1));
  carrinhoSalvar(itens);
}

function carrinhoTotal() {
  return carrinhoItens()
    .reduce((total, item) => total + item.preco * item.qtd, 0);
}

function carrinhoLimpar() {
  carrinhoSalvar([]);
}

function atualizarContagemCarrinho() {
  const selo = document.querySelector('[data-selo-carrinho]');
  if (!selo) return;
  const itens = carrinhoItens().reduce((soma, item) => soma + item.qtd, 0);
  selo.textContent = String(itens);
}

// ---------------------------------------------------------------------------
// Ajuntinhos diversos
// ---------------------------------------------------------------------------
function formatarPreco(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = String(texto ?? '');
  return div.innerHTML;
}
