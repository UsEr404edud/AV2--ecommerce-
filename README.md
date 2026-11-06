# 🥩 Açougue Prime — E-commerce de carnes (API + Site)

Projeto completo de um e-commerce sobre **carne**, com API autenticada por **JWT**,
banco de dados **SQLite** com **script de migration** e um **site** com cadastro e
login funcionais, que guarda o **nome** e o **token** do cliente logado no **LocalStorage**.

**Stack:** Node.js + Express · SQLite (better-sqlite3) · bcryptjs · jsonwebtoken · HTML/CSS/JS puro

---

## 📁 Estrutura do repositório (uma única pasta = um único repo!)

```
acougue-prime/
├── index.js                     # servidor da API (Express) — CRAIZ do repo
├── db.js                        # conexão com o banco usando variáveis do .env
├── migrate.js                   # executor do script de migration
├── migrations/
│   ├── 001_criar_tabelas.js     # cria as tabelas clientes e produtos
│   └── 002_popular_produtos.js  # popula o catálogo de carnes (23 produtos)
├── middlewares/
│   └── autenticar.js            # middleware que valida o token JWT
├── rotas/
│   ├── rotasClientes.js         # POST /cliente · POST /login · GET /cliente/perfil
│   └── rotasProdutos.js         # GET /produto (filtros) · GET /categorias
├── site/                        # FRONT-END (pasta "site")
│   ├── index.html               # página inicial (destaques do catálogo)
│   ├── cadastro.html            # cadastro de cliente
│   ├── login.html               # login (salva nome + token no LocalStorage)
│   ├── produtos.html            # catálogo completo com filtros + paginação
│   ├── carrinho.html            # sacola de compras
│   ├── css/estilo.css
│   └── js/ (api.js · cards.js · navbar.js)
├── .env                         # variáveis de ambiente (NÃO versionar)
├── dotenv-example.txt           # AQUI. exemplo do .env (pedido no trabalho)
├── package.json
└── README.md
```

---

## 🚀 Como rodar do zero

```bash
# 1) Clone o repositório e entre na pasta
git clone <sua-url-aqui> acougue-prime
cd acougue-prime

# 2) Instale as dependências
npm install

# 3) Crie seu .env a partir do exemplo
cp dotenv-example.txt .env        # no Windows: copy dotenv-example.txt .env
# (edite JWT_SENHA se quiser — precisa existir para o servidor subir)

# 4) Rode o script de migration (cria as tabelas e popula o catálogo)
npm run migrate

# 5) Inicie a API
npm start
```

Com a API no ar:

| O que | Onde |
| --- | --- |
| **Site completo** | <http://localhost:3000> (a API também serve a pasta `site/`) |
| API de teste | <http://localhost:3000/> responde um JSON |
| Teste rápido de rota | <http://localhost:3000/produto> |

> Se preferir rodar o site num servidor estático separado
> (ex: *Live Server* do VS Code na porta 5500), funciona do mesmo jeito,
> porque as chamadas do front vão para `http://localhost:3000`.

---

## 🔐 Variáveis de ambiente (.env)

A conexão do banco (`db.js`) e o servidor usam **apenas variáveis de ambiente**.
Exemplo completo disponível em `dotenv-example.txt`:

| Variável | Descrição | Exemplo |
| --- | --- | --- |
| `PORTA` | porta que a API escuta | `3000` |
| `JWT_SENHA` | segredo usado para assinar/validar o JWT | `sua-senha-secreta` |
| `JWT_EXPIRA` | tempo de vida do token | `4h` |
| `DB_ARQUIVO` | caminho do arquivo SQLite do banco | `./banco/dados.db` |

---

## 🗄️ Banco de dados (migration)

O script de migration roda com `npm run migrate`:

- `migrations/001_criar_tabelas.js` — cria as tabelas `clientes` e `produtos`;
- `migrations/002_popular_produtos.js` — popula 23 produtos (carnes) no catálogo.

Cada migration roda **uma única vez**, dentro de uma transação, e a lista de
migrations aplicadas fica na tabela interna `_migracoes`. Comandos úteis:

```bash
npm run migrate          # aplica o que estiver pendente
npm run migrate:fresh    # reset total + reexecuta (cuidado: apaga dados!)
```

> Dica: para visualizar o banco no VS Code, instale a extensão
> **"SQLite Viewer"** (alexcvzz ou fluoride-bearing) e abra `banco/dados.db`.

---

## 📮 Rotas da API

### Cadastro e autenticação

| Método | Rota | Corpo | Observações |
| --- | --- | --- | --- |
| `POST` | `/cliente` | `{ "nome": "Maria", "email": "maria@email.com", "senha": "123456" }` | Senha guardada com hash **bcrypt** |
| `POST` | `/login` | `{ "email": "maria@email.com", "senha": "123456" }` | Devolve `{ token, cliente }` |
| `GET` | `/cliente/perfil` | — | ⚠️ **Exige autenticação:** `Authorization: Bearer <token>` |

### Catálogo

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/produto` | Lista filtrada e paginada (ver parâmetros abaixo) |
| `GET` | `/categorias` | Lista de categorias existentes (uso pelo filtro do site) |

### `/produto` — parâmetros de consulta (query)

| Parâmetro | Para que serve | Exemplo |
| --- | --- | --- |
| `nome` | filtro de busca por nome | `?nome=picanha` |
| `ordenar` | ordenação por preço: `menor_preco` ou `maior_preco` | `?ordenar=menor_preco` |
| `categoria` | filtro por categoria | `?categoria=bovina` (categorias: `bovina`, `suina`, `ave`, `ovino`, `embutido`) |
| `preco_min` / `preco_max` | faixa de preço (R$/kg) | `?preco_min=20&preco_max=70` |
| `pagina` | mudança de offset da paginação | `?pagina=2` |

A consulta é **limitada a uma quantidade fixa de 10 produtos por página**:

- `?pagina=1` → produtos de **1º ao 10º**
- `?pagina=2` → produtos do **11º ao 20º**
- `?pagina=3` → produtos do **21º em diante**

Parâmetros podem ser **combinados**, por exemplo:

```
GET /produto?categoria=ave&ordenar=menor_preco&preco_min=15&preco_max=25&pagina=1
```

Resposta (resumida):

```json
{
  "total": 23,
  "pagina": 1,
  "limite": 10,
  "totalPaginas": 3,
  "produtos": [
    { "id": 1, "nome": "Picanha Bovina", "categoria": "bovina", "preco": 89.9, "emoji": "🥩", "descricao": "..." }
  ]
}
```

### Exemplo de chamada autenticada (curl)

```bash
# login (recebe o token)
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@email.com","senha":"123456"}'

# perfil com o token
curl http://localhost:3000/cliente/perfil \
  -H "Authorization: Bearer COLE_O_TOKEN_AQUI"
```

---

## 🖥️ Site — o que o front-end faz

- 📥 **Cadastro** (`cadastro.html`): cria cliente na rota `POST /cliente`.
- 🔑 **Login** (`login.html`): chama `POST /login` e grava no **LocalStorage**:
  - `token` → o token JWT do cliente;
  - `usuarioNome` → nome do cliente logado.
- 👤 **Minha conta** (modal no menu): busca `GET /cliente/perfil` com o token
  salvo, mostrando id, nome, e-mail e data do cadastro.
- 🛒 **Produtos** (`produtos.html`): busca por **nome**, **ordenação por menor/maior
  preço**, **filtro por categoria**, **faixa de preço mínimo e máximo** e
  **paginação** (10 itens por página).
- 🍖 **Sacola** (`carrinho.html`): carrinho guardado no LocalStorage, com
  quantidades, subtotal/total e finalização (exige login).
- ✅ Menu reflete a sessão: visitante vê "Entrar / Criar conta";
  logado vê "Olá, {nome} 👋" + botão **Sair** (limpa o LocalStorage).

---

## 📦 Publicando no GitHub (passo a passo)

1. Crie um repositório **vazio** no GitHub chamado, por exemplo, `acougue-prime`
   (em <https://github.com/new>; sem README automático).
2. Na pasta do projeto:

```bash
git init
git add .
git commit -m "E-commerce de carnes: API JWT + site (cadastro/login/filtros)"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/acougue-prime.git
git push -u origin main
```

3. Finalmente, envie o link do repositório para avaliação:
   `https://github.com/SEU-USUARIO/acougue-prime`

> ⚠️ O `.gitignore` já impede que `.env`, `node_modules/` e o banco local (`banco/`)
> subam para o GitHub — só o código vai para o repositório.

---

## ✅ Checklist do trabalho

- [x] Cadastro e login funcionando no front-end
- [x] LocalStorage guarda **nome** e **token** do cliente logado
- [x] Repositório único: API na **raiz**, site na pasta **`site/`**
- [x] `GET /produto` com busca por nome, ordenação por menor/maior preço, filtro de categoria, faixa de preço e paginação (limite fixo de 10)
- [x] API com **JWT**: `POST /cliente`, `POST /login`, `GET /cliente/perfil` (autenticada)
- [x] Script de **migration** do banco
- [x] Conexão (`db.js`) com variáveis de ambiente do `.env`
- [x] Exemplo do `.env` salvo como **`dotenv-example.txt`**
- [x] E-commerce de **alimento (carne)** com API + banco de dados
