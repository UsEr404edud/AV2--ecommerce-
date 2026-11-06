/**
 * migrate.js — executador de migrations do banco de dados.
 *
 * Uso:
 *   npm run migrate          -> aplica as migrations pendentes
 *   npm run migrate:fresh    -> RESETA o banco (apaga tudo) e reexecuta tudo
 *
 * Cada migration fica em /migrations e é aplied uma única vez, na ordem do
 * número do arquivo (001, 002, ...). O controle fica na tabela "_migracoes".
 */
const fs = require('node:fs');
const path = require('node:path');
const db = require('./db');

const FRESH = process.argv.includes('--fresh');

const CRIAR_TABELA_MIGRACOES = `
  CREATE TABLE IF NOT EXISTS _migracoes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    nome         TEXT UNIQUE NOT NULL,
    aplicada_em  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

function obterMigrations() {
  const pasta = path.join(__dirname, 'migrations');
  return fs
    .readdirSync(pasta)
    .filter((arquivo) => /^\d{3}_.*\.js$/.test(arquivo))
    .sort()
    .map((arquivo) => require(path.join(pasta, arquivo)));
}

function main() {
  db.exec(CRIAR_TABELA_MIGRACOES);

  if (FRESH) {
    console.log('⚠️  Modo --fresh: apagando tabelas antigas...');
    db.exec('DELETE FROM _migracoes;');
    db.exec('DROP TABLE IF EXISTS produtos;');
    db.exec('DROP TABLE IF EXISTS clientes;');
  }

  const jaAplicadas = new Set(
    db.prepare('SELECT nome FROM _migracoes').all().map((linha) => linha.nome),
  );

  const migrations = obterMigrations();

  if (migrations.length === 0) {
    console.log('Nenhuma migration encontrada em /migrations.');
    return;
  }

  for (const migration of migrations) {
    if (!migration || typeof migration.migrate !== 'function') {
      throw new Error(`Migration inválida (não exporta "migrate()").`);
    }

    if (jaAplicadas.has(migration.nome)) {
      console.log(`• ${migration.nome} ... já aplicada (pulando)`);
      continue;
    }

    // Transação: ou a migration inteira roda, ou nada é gravado
    const rodar = db.transaction(() => {
      migration.migrate(db);
      db.prepare('INSERT INTO _migracoes (nome) VALUES (?)').run(migration.nome);
    });

    try {
      rodar();
      console.log(`✔ ${migration.nome} aplicada com sucesso`);
    } catch (erro) {
      console.error(`✖ Erro na migration ${migration.nome}:`, erro.message);
      process.exitCode = 1;
      return;
    }
  }

  const total = db.prepare('SELECT COUNT(*) AS qtd FROM _migracoes').get().qtd;
  console.log(`\n✅ Concluído! ${total} migration(s) aplicadas. Banco pronto em ${process.env.DB_ARQUIVO || './banco/dados.db'}`);
}

main();
