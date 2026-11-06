/**
 * Migration 001 — criação das tabelas do Açougue Prime.
 */
const nome = '001_criar_tabelas';

/**
 * @param {import('better-sqlite3').Database} db
 */
function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      nome         TEXT    NOT NULL,
      email        TEXT    NOT NULL UNIQUE,
      senha        TEXT    NOT NULL, -- guardaremos o hash gerado pelo bcrypt
      criado_em    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS produtos (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      nome         TEXT    NOT NULL,
      categoria    TEXT    NOT NULL, -- bovina | suina | ave | ovino | embutido
      preco        REAL    NOT NULL, -- valor por kg
      emoji        TEXT    NOT NULL DEFAULT '🥩',
      descricao    TEXT    NOT NULL DEFAULT '',
      criado_em    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_produtos_nome      ON produtos (nome);
    CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos (categoria);
    CREATE INDEX IF NOT EXISTS idx_produtos_preco     ON produtos (preco);
  `);
}

module.exports = { nome, migrate };
