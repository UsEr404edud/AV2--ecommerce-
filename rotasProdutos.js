/**
 * Rotas de produtos (catálogo do Açougue Prime).
 *
 * GET /produto aceita os parâmetros:
 *   nome        -> filtro de busca por nome (parcial, sem acento de caso)  Ex.: nome=picanha
 *   ordenar     -> ordenação por preço                                   Ex.: ordenar=menor_preco | maior_preco
 *   categoria   -> filtro por categoria                                  Ex.: categoria=bovina
 *   preco_min   -> preço mínimo (kg)                                     Ex.: preco_min=20
 *   preco_max   -> preço máximo (kg)                                     Ex.: preco_max=70
 *   pagina      -> página da consulta (offset automático)                Ex.: pagina=2
 *
 * A quantidade por página é FIXA (LIMITE_POR_PAGINA). Ex.:
 *   pagina=1 -> produtos de 1 a 10
 *   pagina=2 -> produtos de 11 a 20
 */
const express = require('express');
const db = require('../db');

const router = express.Router();

// Quantidade fixa de produtos por página (escolhida: 10)
const LIMITE_POR_PAGINA = 10;

const CATEGORIAS_VALIDAS = ['bovina', 'suina', 'ave', 'ovino', 'embutido'];

router.get('/produto', (req, res) => {
  const filtros = req.query;

  // Os professores às vezes escrevem "preco min" com espaço; aceitamos os dois
  const precoMinimoBruto =
    filtros.preco_min !== undefined ? filtros.preco_min : filtros['preco min'];
  const precoMaximoBruto =
    filtros.preco_max !== undefined ? filtros.preco_max : filtros['preco max'];

  const nome = typeof filtros.nome === 'string' ? filtros.nome.trim() : '';
  const ordenar = typeof filtros.ordenar === 'string' ? filtros.ordenar : '';
  const categoria =
    typeof filtros.categoria === 'string' ? filtros.categoria.trim().toLowerCase() : '';
  const paginaBruta = parseInt(String(filtros.pagina ?? '1'), 10);

  // ----- Validações -----
  if (filtros.pagina !== undefined && (Number.isNaN(paginaBruta) || paginaBruta < 1)) {
    return res.status(400).json({ erro: 'Parâmetro "pagina" deve ser um número maior ou igual a 1.' });
  }
  if (filtros.categoria && !CATEGORIAS_VALIDAS.includes(categoria)) {
    return res.status(400).json({
      erro: `Categoria inválida. Categorias válidas: ${CATEGORIAS_VALIDAS.join(', ')}.`,
    });
  }

  let precoMinimo = null;
  let precoMaximo = null;
  if (precoMinimoBruto !== undefined && String(precoMinimoBruto) !== '') {
    precoMinimo = parseFloat(precoMinimoBruto);
    if (Number.isNaN(precoMinimo) || precoMinimo < 0) {
      return res.status(400).json({ erro: 'Parâmetro "preco_min" deve ser um número maior ou igual a 0.' });
    }
  }
  if (precoMaximoBruto !== undefined && String(precoMaximoBruto) !== '') {
    precoMaximo = parseFloat(precoMaximoBruto);
    if (Number.isNaN(precoMaximo) || precoMaximo <= 0) {
      return res.status(400).json({ erro: 'Parâmetro "preco_max" deve ser um número maior que 0.' });
    }
  }
  if (precoMinimo !== null && precoMaximo !== null && precoMinimo > precoMaximo) {
    return res.status(400).json({ erro: '"preco_min" não pode ser maior que "preco_max".' });
  }

  // ----- Ordenação -----
  // Normaliza sinônimos: "menor_preco", "menor-preco", "MENOR", "menor preço"...
  const chaveOrdenacao = ordenar.toLowerCase().replace(/[\s_-]/g, '');
  let ordemSql = '';
  if (['menorpreco', 'menor'].includes(chaveOrdenacao)) ordemSql = 'ORDER BY preco ASC';
  if (['maiorpreco', 'maior'].includes(chaveOrdenacao)) {
    if (ordemSql) {
      return res.status(400).json({ erro: 'Informe apenas uma ordenação (menor_preco ou maior_preco).' });
    }
    ordemSql = 'ORDER BY preco DESC';
  }
  if (ordenar && !ordemSql) {
    return res.status(400).json({ erro: 'Ordem inválida. Use ordenar=menor_preco ou ordenar=maior_preco.' });
  }

  // ----- Montagem dinâmica do WHERE -----
  const condicoes = [];
  const valores = [];

  if (nome) {
    condicoes.push('nome LIKE ?');
    valores.push(`%${nome}%`); // LIKE no SQLite já ignora maiúsculas/minúsculas
  }
  if (filtros.categoria) {
    condicoes.push('categoria = ?');
    valores.push(categoria);
  }
  if (precoMinimo !== null) {
    condicoes.push('preco >= ?');
    valores.push(precoMinimo);
  }
  if (precoMaximo !== null) {
    condicoes.push('preco <= ?');
    valores.push(precoMaximo);
  }

  const whereSql = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';

  // ----- Contagem total (para a paginação) -----
  const total = db
    .prepare(`SELECT COUNT(*) AS qtd FROM produtos ${whereSql}`)
    .get(...valores).qtd;

  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE_POR_PAGINA));
  const pagina = Math.min(paginaBruta, totalPaginas); // evita offset além do fim
  const offset = (pagina - 1) * LIMITE_POR_PAGINA;

  // ----- Consulta da página -----
  const produtos = db
    .prepare(
      `SELECT id, nome, categoria, preco, emoji, descricao
         FROM produtos
         ${whereSql}
         ${ordemSql}
         LIMIT ? OFFSET ?`,
    )
    .all(...valores, LIMITE_POR_PAGINA, offset);

  return res.status(200).json({
    total,
    pagina,
    limite: LIMITE_POR_PAGINA,
    totalPaginas,
    produtos,
  });
});

// ---------------------------------------------------------------------------
// GET /categorias — lista de categorias existentes (usado pelo filtro do site)
// ---------------------------------------------------------------------------
router.get('/categorias', (_req, res) => {
  const categorias = db
    .prepare('SELECT DISTINCT categoria FROM produtos ORDER BY categoria')
    .all()
    .map((linha) => linha.categoria);

  return res.status(200).json({ categorias });
});

module.exports = router;
