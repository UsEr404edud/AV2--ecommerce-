/**
 * db.js — conexão com o banco de dados (SQLite).
 *
 * Todas as configurações vêm de variáveis de ambiente do arquivo ".env":
 *   DB_ARQUIVO -> caminho do arquivo do banco (ex.: ./banco/dados.db)
 */
require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

// Caminho do banco definido no .env (com valor padrão de segurança)
const DB_ARQUIVO = process.env.DB_ARQUIVO || './banco/dados.db';
const caminhoBanco = path.resolve(__dirname, DB_ARQUIVO);

// Garante que a pasta do banco exista antes de abrir o arquivo
fs.mkdirSync(path.dirname(caminhoBanco), { recursive: true });

// Abre a conexão
const db = new Database(caminhoBanco);

// WAL melhora leitura/escrita simultânea no SQLite
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
