/**
 * Migration 002 — população inicial do catálogo de carnes do Açougue Prime.
 * (Só insere os produtos se a tabela ainda estiver vazia.)
 */
const nome = '002_popular_produtos';

const PRODUTOS = [
  // ---------------- BOVINAS ----------------
  { nome: 'Picanha Bovina', categoria: 'bovina', preco: 89.9, emoji: '🥩', descricao: 'A rainha do churrasco! Manta com capa de gordura, macia e suculenta.' },
  { nome: 'Filet Mignon', categoria: 'bovina', preco: 79.9, emoji: '🥩', descricao: 'Corte mais macio do boi, ideal para bifes e estrogonofe nobre.' },
  { nome: 'Ancho', categoria: 'bovina', preco: 74.9, emoji: '🥩', descricao: 'Corte premium do contrafilé, marmorizado, perfeito na brasa.' },
  { nome: 'Chuleta', categoria: 'bovina', preco: 69.9, emoji: '🥩', descricao: 'Bife de osso com osso, suculento e cheio de sabor.' },
  { nome: 'Maminha', categoria: 'bovina', preco: 59.9, emoji: '🥩', descricao: 'Macia e saborosa, ótima assada ou grelhada.' },
  { nome: 'Alcatra', categoria: 'bovina', preco: 54.9, emoji: '🥩', descricao: 'Corte versátil para churrasco, bistecas e espetinhos.' },
  { nome: 'Costela Bovina', categoria: 'bovina', preco: 44.9, emoji: '🍖', descricao: 'Feita para desmanchar no bafo. O clássico da hora boa.' },
  { nome: 'Acém', categoria: 'bovina', preco: 39.9, emoji: '🥩', descricao: 'Ideal para ensopados, escondidinho e carne seca caseira.' },
  { nome: 'Músculo Bovino', categoria: 'bovina', preco: 29.9, emoji: '🥩', descricao: 'Rei dos caldos e sopas, rende muito e aromatiza tudo.' },

  // ---------------- SUÍNAS ----------------
  { nome: 'Bacon em Fatias', categoria: 'suina', preco: 39.9, emoji: '🥓', descricao: 'Crocante na frigideira, apaixonante de verdade.' },
  { nome: 'Pancetta Suína', categoria: 'suina', preco: 37.9, emoji: '🥓', descricao: 'Barriga suína especial para grill e massas italianas.' },
  { nome: 'Costela de Porco', categoria: 'suina', preco: 34.9, emoji: '🍖', descricao: 'Perfeita ao molho barbecue, assada até dourar.' },
  { nome: 'Lombo Suíno', categoria: 'suina', preco: 29.9, emoji: '🥓', descricao: 'Corte magro e macio, ótimo ao forno com ervas.' },
  { nome: 'Pernil Suíno', categoria: 'suina', preco: 24.9, emoji: '🥓', descricao: 'Ideal para assar inteiro ou desfiar.' },

  // ---------------- AVES ----------------
  { nome: 'Filé de Peito de Frango', categoria: 'ave', preco: 24.9, emoji: '🍗', descricao: 'Magro e versátil, grelha em minutos.' },
  { nome: 'Peito de Frango', categoria: 'ave', preco: 21.9, emoji: '🍗', descricao: 'O básico confiável da geladeira: panela, frigideira e chapa.' },
  { nome: 'Coxa e Sobrecoxa', categoria: 'ave', preco: 16.9, emoji: '🍗', descricao: 'Mais gordura, mais sabor. Ótima ao forno e na airfryer.' },
  { nome: 'Asas de Frango', categoria: 'ave', preco: 15.9, emoji: '🍗', descricao: 'As campeãs do almolita e do futebol de sábado.' },

  // ---------------- OVINOS ----------------
  { nome: 'Costela de Cordeiro', categoria: 'ovino', preco: 59.9, emoji: '🍖', descricao: 'Sabor marcante e carne que solta do osso.' },
  { nome: 'Paleta de Cordeiro', categoria: 'ovino', preco: 49.9, emoji: '🍖', descricao: 'Corte delicioso para assar coberto por horas.' },

  // ---------------- EMBUTIDOS ----------------
  { nome: 'Linguiça Toscana', categoria: 'embutido', preco: 23.9, emoji: '🌭', descricao: 'Companheira oficial do pão na brasa.' },
  { nome: 'Linguiça Calabresa', categoria: 'embutido', preco: 22.9, emoji: '🌭', descricao: 'Picante na medida para pizza, feijoada e espaguete.' },
  { nome: 'Salame Italiano', categoria: 'embutido', preco: 45.9, emoji: '🥓', descricao: 'Curado lentamente, fatia perfeita para a tábua de frios.' },
];

/**
 * @param {import('better-sqlite3').Database} db
 */
function migrate(db) {
  const qtdAtual = db.prepare('SELECT COUNT(*) AS qtd FROM produtos').get().qtd;
  if (qtdAtual > 0) {
    // Se a turma/projeto já tiver produtos cadastrados, não mexe em nada
    console.log(`   (tabela produtos já possui ${qtdAtual} registros — seed ignorado)`);
    return;
  }

  const inserir = db.prepare(`
    INSERT INTO produtos (nome, categoria, preco, emoji, descricao)
    VALUES (@nome, @categoria, @preco, @emoji, @descricao)
  `);

  db.transaction(() => {
    for (const produto of PRODUTOS) inserir.run(produto);
  })();

  console.log(`   ${PRODUTOS.length} produtos cadastrados no catálogo.`);
}

module.exports = { nome, migrate };
