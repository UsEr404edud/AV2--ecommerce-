/**
 * Rotas de clientes (cadastro, login e perfil).
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const autenticar = require('../middlewares/autenticar');

const router = express.Router();

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// POST /cliente — cadastra um novo cliente
// ---------------------------------------------------------------------------
router.post('/cliente', (req, res) => {
  const { nome, email, senha } = req.body || {};

  const erros = [];
  if (!nome || String(nome).trim().length < 3) {
    erros.push('Informe um nome com pelo menos 3 caracteres.');
  }
  if (!email || !EMAIL_VALIDO.test(String(email).trim())) {
    erros.push('Informe um e-mail válido.');
  }
  if (!senha || String(senha).length < 6) {
    erros.push('A senha deve ter no mínimo 6 caracteres.');
  }
  if (erros.length > 0) {
    return res.status(400).json({ erro: erros.join(' ') });
  }

  const emailLimpo = String(email).trim().toLowerCase();
  const nomeLimpo = String(nome).trim();

  const clienteExistente = db
    .prepare('SELECT id FROM clientes WHERE email = ?')
    .get(emailLimpo);

  if (clienteExistente) {
    return res.status(409).json({ erro: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' });
  }

  // Nunca guardamos a senha em texto puro — guardamos o HASH
  const hashSenha = bcrypt.hashSync(String(senha), 10);

  const resultado = db
    .prepare('INSERT INTO clientes (nome, email, senha) VALUES (?, ?, ?)')
    .run(nomeLimpo, emailLimpo, hashSenha);

  return res.status(201).json({
    mensagem: 'Cliente cadastrado com sucesso!',
    cliente: { id: resultado.lastInsertRowid, nome: nomeLimpo, email: emailLimpo },
  });
});

// ---------------------------------------------------------------------------
// POST /login — autentica um cliente e devolve um token JWT
// ---------------------------------------------------------------------------
router.post('/login', (req, res) => {
  const { email, senha } = req.body || {};

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha para entrar.' });
  }

  const emailLimpo = String(email).trim().toLowerCase();
  const cliente = db
    .prepare('SELECT * FROM clientes WHERE email = ?')
    .get(emailLimpo);

  // Usuário não existe OU senha não bate (mesma resposta para não revelar qual dos dois)
  if (!cliente || !bcrypt.compareSync(String(senha), cliente.senha)) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  }

  const payload = { id: cliente.id, nome: cliente.nome, email: cliente.email };
  const token = jwt.sign(payload, process.env.JWT_SENHA, {
    expiresIn: process.env.JWT_EXPIRA || '4h',
  });

  return res.status(200).json({
    mensagem: 'Login realizado com sucesso!',
    token,
    cliente: payload,
  });
});

// ---------------------------------------------------------------------------
// GET /cliente/perfil — REQUISITA autenticação (Bearer token)
// ---------------------------------------------------------------------------
router.get('/cliente/perfil', autenticar, (req, res) => {
  const cliente = db
    .prepare('SELECT id, nome, email, criado_em FROM clientes WHERE id = ?')
    .get(req.cliente.id);

  if (!cliente) {
    return res.status(404).json({ erro: 'Conta não encontrada.' });
  }

  return res.status(200).json({
    mensagem: 'Perfil recuperado com sucesso.',
    cliente,
  });
});

module.exports = router;
