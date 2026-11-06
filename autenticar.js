/**
 * Middleware de autenticação JWT.
 *
 * Escolha o token no cabeçalho da requisição:
 *     Authorization: Bearer <token>
 *
 * Se o token for válido, o payload vai para "req.cliente" e a requisição segue.
 * Se não, responde 401 imediatamente.
 */
require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SENHA = process.env.JWT_SENHA;
if (!JWT_SENHA) {
  throw new Error('Variável de ambiente JWT_SENHA não configurada. Consulte dotenv-example.txt');
}

module.exports = function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || '';

  // Espera o formato "Bearer <token>"
  const [tipo, token] = cabecalho.split(' ');

  if (!token || tipo !== 'Bearer') {
    return res.status(401).json({
      erro: 'Acesso não autorizado: envie um token no formato "Authorization: Bearer <token>".',
    });
  }

  try {
    req.cliente = jwt.verify(token, JWT_SENHA); // dados decodados do token
    return next();
  } catch (erro) {
    const mensagem =
      erro.name === 'TokenExpiredError'
        ? 'Sessão expirada. Faça login novamente.'
        : 'Token inválido. Faça login novamente.';
    return res.status(401).json({ erro: mensagem });
  }
};
