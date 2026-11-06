/**
 * cards.js — renderização dos cartões de produto reutilizada em várias telas.
 */

function criarCardProduto(produto) {
  const nomesCategorias = {
    bovina: 'Bovina',
    suina: 'Suína',
    ave: 'Ave',
    ovino: 'Ovino',
    embutido: 'Embutido',
  };

  const cartao = document.createElement('article');
  cartao.className = 'cartao-produto';
  cartao.innerHTML = `
    <div class="foto-produto c-${escaparHtml(produto.categoria)}">
      <span>${escaparHtml(produto.emoji)}</span>
      <span class="etiqueta-categoria">${escaparHtml(nomesCategorias[produto.categoria] || produto.categoria)}</span>
    </div>
    <div class="info-produto">
      <h3>${escaparHtml(produto.nome)}</h3>
      <p class="descricao">${escaparHtml(produto.descricao)}</p>
      <div class="preco-produto">
        <span class="valor">${formatarPreco(produto.preco)}</span>
        <span class="medida">/ kg</span>
      </div>
      <button class="botao ao-adicionar" type="button">Adicionar à sacola</button>
    </div>
  `;

  const botao = cartao.querySelector('.ao-adicionar');
  botao.addEventListener('click', () => {
    carrinhoAdicionar(produto);
    botao.textContent = 'Adicionado ✓';
    botao.disabled = true;
    setTimeout(() => {
      botao.textContent = 'Adicionar à sacola';
      botao.disabled = false;
    }, 900);
  });

  return cartao;
}

function mostrarEstadoNosCards(container, icone, mensagem) {
  container.innerHTML = `
    <div class="carregando">
      <span class="emoji">${icone}</span>
      ${escaparHtml(mensagem)}
    </div>
  `;
}
