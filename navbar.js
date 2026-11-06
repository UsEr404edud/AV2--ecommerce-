/**
 * navbar.js — desenha o menu superior em todas as páginas,
 * mostrando o estado da sessão (logado ou não) no LocalStorage.
 *
 * Também injeta o modal "Minha conta", que busca o perfil na rota
 * autenticada GET /cliente/perfil usando o token salvo no LocalStorage.
 */

function desenharNavbar(paginaAtiva) {
  const local = document.getElementById('navbar');
  if (!local) return;

  const links = [
    { href: 'index.html', titulo: 'Início', id: 'inicio' },
    { href: 'produtos.html', titulo: 'Produtos', id: 'produtos' },
    { href: 'carrinho.html', titulo: 'Sacola', id: 'carrinho' },
  ];

  const htmlLinks = links
    .map(
      ({ href, titulo, id }) =>
        `<a href="${href}" class="${id === paginaAtiva ? 'ativo' : ''}">${titulo}</a>`,
    )
    .join('');

  const logado = usuarioLogado();
  const areaAcoes = logado
    ? `
      <a href="#" class="ao-entrar" id="link-minha-conta" title="Minha conta">Olá, ${escaparHtml(nomeUsuario()) || 'cliente'} 👋</a>
      <button class="botao ao-entrar" id="botao-sair" type="button">Sair</button>
    `
    : `
      <a class="fantasma botao ao-entrar" href="login.html">Entrar</a>
      <a class="botao ao-entrar" href="cadastro.html">Criar conta</a>
    `;

  local.innerHTML = `
    <header class="topo">
      <nav class="topo-interno">
        <a class="logotipo" href="index.html">
          <span class="selo">🥩</span>
          <span>Açougue<b>Prime</b><small>carnes premium</small></span>
        </a>
        <div class="topo-links">${htmlLinks}</div>
        <div class="topo-acoes">
          <a class="sacola" href="carrinho.html" title="Ver minha sacola">🛒
            <span class="selo-carrinho" data-selo-carrinho>0</span>
          </a>
          ${areaAcoes}
        </div>
      </nav>

      <div class="modal-fundo" id="modal-perfil" style="display:none">
        <div class="modal" role="dialog" aria-modal="true">
          <button class="fechar-modal" type="button" title="Fechar">✕</button>
          <h2>Minha conta</h2>
          <p class="subtitulo">Dados do seu perfil, buscados na rota autenticada da API.</p>
          <div id="conteudo-perfil">Carregando…</div>
          <p class="aviso" id="erro-perfil" hidden></p>
          <div class="rodape-modal">
            <button class="botao escuro botao-fechar-perfil" type="button">Voltar às compras</button>
          </div>
        </div>
      </div>
    </header>
  `;

  atualizarContagemCarrinho();

  // ---- ações do usuário logado / visitante ----
  const botaoSair = document.getElementById('botao-sair');
  if (botaoSair) {
    botaoSair.addEventListener('click', () => {
      encerrarSessao();
      window.location.href = 'index.html';
    });
  }

  const linkPerfil = document.getElementById('link-minha-conta');
  if (linkPerfil) {
    linkPerfil.addEventListener('click', (evento) => {
      evento.preventDefault();
      abrirModalPerfil();
    });
  }

  const modal = document.getElementById('modal-perfil');
  modal.querySelector('.fechar-modal').addEventListener('click', () => fecharModalPerfil());
  modal.querySelector('.botao-fechar-perfil').addEventListener('click', () => fecharModalPerfil());
  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) fecharModalPerfil();
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') fecharModalPerfil();
  });
}

async function abrirModalPerfil() {
  const modal = document.getElementById('modal-perfil');
  const conteudo = document.getElementById('conteudo-perfil');
  const aviso = document.getElementById('erro-perfil');

  conteudo.innerHTML = 'Carregando perfil…';
  aviso.hidden = true;
  modal.classList.add('aberto');
  modal.style.display = 'flex';

  try {
    const resposta = await buscarPerfil(); // usa o token do LocalStorage
    const { id, nome, email, criado_em } = resposta.cliente;

    conteudo.innerHTML = `
      <div class="linha-perfil"><b>ID</b><b>#${id}</b></div>
      <div class="linha-perfil"><b>Nome</b><b>${escaparHtml(nome)}</b></div>
      <div class="linha-perfil"><b>E-mail</b><b>${escaparHtml(email)}</b></div>
      <div class="linha-perfil"><b>Cliente desde</b><b>${escaparHtml(criado_em)}</b></div>
    `;
  } catch (erro) {
    conteudo.innerHTML = '';
    aviso.textContent = erro.message;
    aviso.hidden = false;

    // Token inválido/expirado -> derruba a sessão para forçar novo login
    if (erro.status === 401) {
      encerrarSessao();
      setTimeout(() => (window.location.href = 'login.html'), 1200);
    }
  }
}

function fecharModalPerfil() {
  const modal = document.getElementById('modal-perfil');
  if (!modal) return;
  modal.classList.remove('aberto');
  modal.style.display = 'none';
}
