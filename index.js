/**
 * index.js — servidor da API Açougue Prime.
 *
 * Como rodar:
 *   1) cp dotenv-example.txt .env   (e ajuste as variáveis se quiser)
 *   2) npm install
 *   3) npm run migrate
 *   4) npm start
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('node:path');

const rotasClientes = require('./rotas/rotasClientes');
const rotasProdutos = require('./rotas/rotasProdutos');

const app = express();

// ---------------------------------------------------------------------------
// Configurações gerais
// ---------------------------------------------------------------------------
app.use(cors()); // libera o site consumir a API de outro endereço/porta
app.use(express.json()); // aceita JSON no corpo das requisições

// ---------------------------------------------------------------------------
// Rotas da API
// ---------------------------------------------------------------------------
app.use(rotasClientes); // POST /cliente | POST /login | GET /cliente/perfil
app.use(rotasProdutos); // GET /produto  | GET /categorias

// Rota de teste/diagnóstico
app.get('/', (_req, res) => {
  res.json({
    nome: 'Açougue Prime — API',
    status: 'online',
    dica: 'Veja o README.md para a lista de rotas, ou abra http://localhost:3000/site.html no navegador',
  });
});

// ---------------------------------------------------------------------------
// Servindo o site (pasta /site) pela própria API — bônus de conveniência :)
// O frontend também funciona com qualquer servidor estático (ex.: Live Server)
// ---------------------------------------------------------------------------
app.use(express.static(path.join(__dirname, 'site')));

// ---------------------------------------------------------------------------
// Tratamento de rotas inexistentes e erros
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
});

app.use((erro, _req, res, _next) => {
  console.error('Erro inesperado:', erro);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

// ---------------------------------------------------------------------------
// Subida do servidor
// ---------------------------------------------------------------------------
const PORTA = process.env.PORTA || 3000;

app.listen(PORTA, () => {
  console.log(`🥩 Açougue Prime — API no ar!`);
  console.log(`   API:        http://localhost:${PORTA}`);
  console.log(`   Site:       http://localhost:${PORTA}  (servindo a pasta ./site)`);
});
