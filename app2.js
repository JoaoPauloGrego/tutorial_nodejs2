const express = require('express');
<<<<<<< HEAD
const session = require('express-session');
const sqlite3 = require("sqlite3");
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');
const validator = require('validator');
=======
const session = require('express-session'); // Para gerenciamento de sessões
const sqlite3 = require("sqlite3"); // Banco de dados SQLite
//const bodyparser = require("body-parser");
>>>>>>> 85dbb8a11f399e2dd046f1957aed7134670b75e1

const app = express();
const port = 8000;

// Conexão com banco de dados
const db = new sqlite3.Database("users.db");

// Cria tabelas se não existirem
db.serialize(() => {
    db.run(
        "CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, role TEXT)"
    );
    db.run(
        "CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY AUTOINCREMENT, iduser INTEGER, title TEXT, content TEXT, datepost TEXT)"
    );
    db.run(
        "CREATE TABLE IF NOT EXISTS backups(id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)"
    );
});

<<<<<<< HEAD
// Middlewares
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
=======
// Middleware de sessão (gerencia autenticação de usuários)
>>>>>>> 85dbb8a11f399e2dd046f1957aed7134670b75e1
app.use(
    session({
        secret: "senhaforteparacriptografarasessao", // Chave secreta para criptografia
        resave: true,
        saveUninitialized: true,
    })
<<<<<<< HEAD
);

// Middleware para cabeçalhos de segurança
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:");
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

app.use('/static', express.static(__dirname + '/static'));
app.set('view engine', 'ejs');

// Helper para conteúdo seguro
app.locals.formatDate = function(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
};


// ============= ROTAS ============= //

// Rotas públicas
=======
)

// Servir arquivos estáticos (CSS, JS, imagens)
app.use('/static', express.static(__dirname + '/static'));

// Middleware para analisar dados de formulários
app.use(express.urlencoded({ extended: true }));

// Configura EJS como engine de templates
app.set('view engine', 'ejs');

//Página inicial
>>>>>>> 85dbb8a11f399e2dd046f1957aed7134670b75e1
app.get("/index2", (req, res) => {
    res.render("./pages/index2", { titulo: "index2", req: req });
});

// Página "Sobre"
app.get("/sobre2", (req, res) => {
    res.render("./pages/sobre2", { titulo: "sobre2", req: req });
});

<<<<<<< HEAD
=======
// Dashboard principal (com controle de acesso)
app.get("/dashboard2", (req, res) => {
  if (req.session.loggedin) {
    // Busca todos os posts ordenados por data
    const query = "SELECT * FROM posts ORDER BY datepost DESC";    
    db.all(query, [], (err, posts) => {
      if (err) {
        console.error("Erro ao buscar posts:", err);
        posts = []; // Array vazio em caso de erro
      }
      
        // Renderização diferenciada para admin/normal
      if (req.session.role === 'admin') {
        res.render("pages/dashboard_admin", { 
          titulo: "Dashboard Admin",
          posts: posts,
          req: req
        });
      } else {
        res.render("pages/dashboard_normal", { 
          titulo: "Meus Posts",
          posts: posts, // Passando os posts para a partial
          req: req
        });
      }
    });
  } else {
     // Redireciona se não autenticado
    res.redirect("/unauthorized2");
  }
});


// Página de acesso não autorizado
app.get("/unauthorized2", (req, res) =>
    res.render("pages/unauthorized2", { titulo: "Unauthorized", req: req })
);

// Formulário de cadastro de novos usuários
>>>>>>> 85dbb8a11f399e2dd046f1957aed7134670b75e1
app.get("/cadastro2", (req, res) => {
    res.render("./pages/cadastro2", { titulo: "cadastro2", req: req });
});

<<<<<<< HEAD
app.get("/login2", (req, res) => {
    res.render("./pages/login2", { titulo: "login2", req: req });
});

app.get("/sucessfullysigned", (req, res) => {
    res.render("pages/sucessfullysigned", {
        titulo: "sucessfullysigned",
        req: req
    });
});

app.get("/alreadysign", (req, res) => {
    res.render("pages/alreadysign", {
        titulo: "usuário já cadastrado",
        req: req
    });
});

app.get("/unauthorized2", (req, res) => {
    res.render("pages/unauthorized2", { titulo: "Unauthorized", req: req });
});

// Rotas de autenticação
app.post("/cadastro2", [
    body('username')
        .notEmpty().withMessage('O nome de usuário é obrigatório')
        .isLength({ min: 3, max: 20 }).withMessage('O nome deve ter entre 3 e 20 caracteres')
        .trim()
        .escape(),
    
    body('password')
        .notEmpty().withMessage('A senha é obrigatória')
        .isLength({ min: 6 }).withMessage('A senha deve ter no mínimo 6 caracteres')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('pages/cadastro2', {
            titulo: "cadastro2",
            req: req,
            errors: errors.array(),
            oldInput: req.body
        });
    }

=======
// Processa cadastro de novo usuário
app.post("/cadastro2", (req, res) => {
    console.log("POST /cadastro2");
    console.log(JSON.stringify(req.body));
>>>>>>> 85dbb8a11f399e2dd046f1957aed7134670b75e1
    const { username, password, role } = req.body;
    // Verifica se usuário já existe
    const query = "SELECT * FROM users WHERE username = ?";

    db.get(query, [username], (err, row) => {
        if (err) {
            console.error(err);
            return res.redirect("/alreadysign");
        }

        if (row) {
<<<<<<< HEAD
            console.log(`Usuário ${username} já cadastrado`);
            res.redirect("/alreadysign");
        } else {
            const insert = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
            db.run(insert, [username, password, role || 'normal'], function (err) {
                if (err) {
                    console.error(err);
                    return res.redirect("/alreadysign");
                }
                console.log(`Usuário ${username} cadastrado com sucesso`);
                res.redirect("/sucessfullysigned");
=======
            console.log(`usuario:${username} já cadastrado`);
            // Usuário já cadastrado
            res.redirect("/alreadysign");
        } else {
            // Cria novo usuário
            const insert = "INSERT INTO users (username, password, role) VALUES (?,?,?)";
            db.get(insert, [username, password], (err, row) => {
                if (err) throw err;
                console.log(`usuario:${username} já cadastrado`);
                res.redirect("/sucessfullysigned")
>>>>>>> 85dbb8a11f399e2dd046f1957aed7134670b75e1
            });
        }
    });
});
<<<<<<< HEAD

app.post("/login2", [
    body('username')
        .notEmpty().withMessage('O nome de usuário é obrigatório')
        .trim()
        .escape(),
    
    body('password')
        .notEmpty().withMessage('A senha é obrigatória')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('pages/login2', {
            titulo: "login2",
            req: req,
            errors: errors.array(),
            oldInput: req.body
        });
    }

=======

// Página de sucesso após cadastro
app.get("/sucessfullysigned", (req, res) =>
    res.render("pages/sucessfullysigned", {
        titulo: "sucessfullysigned",
        req: req
    })
);

// Página de usuário já cadastrado
app.get("/alreadysign", (req, res) =>
    res.render("pages/alreadysign", {
        titulo: "usuário já cadastrado",
        req: req
    })
);

// Formulário de login
app.get("/login2", (req, res) => {
    console.log("GET /login2");
    res.render("./pages/login2", { titulo: "login2", req: req });
});

// Processa login de usuário
app.post("/login2", (req, res) => {
>>>>>>> 85dbb8a11f399e2dd046f1957aed7134670b75e1
    const { username, password } = req.body;
    const query = "SELECT * FROM users WHERE username = ? AND password = ?";

    db.get(query, [username, password, role], (err, row) => {
        if (err) {
            console.error(err);
            return res.redirect("/unauthorized2");
        }

        if (row)   // Configura sessão do usuário 
        {
            req.session.username = username;
            req.session.loggedin = true;
            req.session.id_username = row.id;
<<<<<<< HEAD
            req.session.role = row.role;

=======
            req.session.role = row.role; // Armazena perfil do usuário

             // Redireciona conforme perfil
>>>>>>> 85dbb8a11f399e2dd046f1957aed7134670b75e1
            if (row.role === 'admin') {
                return res.redirect("/modify");
            } else {
                return res.redirect("/dashboard2");
            }
        } else {
            return res.redirect("/unauthorized2");
        }
    });
});

<<<<<<< HEAD
<<<<<<< HEAD
// Rotas protegidas
app.get("/dashboard2", (req, res) => {
    if (!req.session.loggedin) return res.redirect("/unauthorized2");

    const query = "SELECT * FROM posts ORDER BY datepost DESC";

    db.all(query, [], (err, posts) => {
        if (err) {
            console.error("Erro ao buscar posts:", err);
            posts = [];
        }

        if (req.session.role === 'admin') {
            res.render("pages/dashboard_admin", {
                titulo: "Dashboard Admin",
                posts: posts,
                req: req
            });
        } else {
            res.render("pages/dashboard_normal", {
                titulo: "Meus Posts",
                posts: posts,
                req: req
            });
        }
    });
});

app.get("/post_edit/:id", (req, res) => {
    if (!req.session.loggedin) return res.redirect("/unauthorized2");

    const postId = req.params.id;
    const query = "SELECT * FROM posts WHERE id = ?";

    db.get(query, [postId], (err, post) => {
        if (err) {
            console.error("Erro ao buscar post:", err);
            return res.status(500).render('pages/error', {
                message: "Erro ao carregar post para edição",
                error: err
            });
        }

        if (!post) {
            return res.status(404).render('pages/error', {
                message: "Post não encontrado",
                error: { status: 404 }
            });
        }

        // Verificar permissões
        const isAuthor = req.session.id_username == post.iduser;
        const isAdmin = req.session.role === 'admin';

        if (!isAuthor && !isAdmin) return res.redirect("/unauthorized2");

        // Adicione esta linha para inicializar oldInput
        const oldInput = req.body || {};
        
        res.render("pages/post_edit", {
            titulo: "Editar Postagem",
            post: post,
            req: req,
            oldInput: oldInput // Garante que oldInput sempre exista
        });
    });
});
app.get("/post_create", (req, res) => {
    if (!req.session.loggedin) return res.redirect("/unauthorized2");
    
    res.render("pages/post_form", {
        titulo: "Criar Postagem",
        req: req,
        oldInput: {}
});
});

app.post("/post_create", [
    body('title')
        .notEmpty().withMessage('O título é obrigatório')
        .isLength({ min: 5, max: 100 }).withMessage('O título deve ter entre 5 e 100 caracteres')
        .trim()
        .escape(),
    
    body('content')
        .notEmpty().withMessage('O conteúdo é obrigatório')
        .isLength({ min: 10 }).withMessage('O conteúdo deve ter no mínimo 10 caracteres')
], (req, res) => {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('pages/post_form', {
            titulo: "Criar Postagem",
            req: req,
            errors: errors.array(),
            oldInput: req.body
        });
=======
=======
// Formulário de criação de novo post
>>>>>>> 85dbb8a11f399e2dd046f1957aed7134670b75e1
app.get("/post_create", (req, res) => {
    console.log("GET /post_create");
    if (req.session.loggedin) {
        res.render("pages/post_form", { 
            titulo: "Criar Postagem",
            req: req,
            errors: errors.array(),
            oldInput: req.body
        });
>>>>>>> 10283021c4b033cd5c611cf0c3a921c24c075263
    }

<<<<<<< HEAD
=======
app.get("/posts", (req, res) => {
    console.log("GET /posts");
    res.render("./pages/posts", { titulo: "posts", req: req });
});


// Processa criação de novo post
app.post("/post_create", (req, res) => {
    console.log("POST /post_create");
    
    // Verificação de segurança
>>>>>>> 85dbb8a11f399e2dd046f1957aed7134670b75e1
    if (!req.session.loggedin || !req.session.id_username) {
        return res.redirect("/unauthorized2");
    }

    const { title, content } = req.body;
    const datepost = new Date().toISOString();

    const query = "INSERT INTO posts (iduser, title, content, datepost) VALUES(?, ?, ?, ?)";

<<<<<<< HEAD
    db.run(query, [req.session.id_username, title, content, datepost], function (err) {
=======
    // Insere novo post no banco
    db.run(query, [req.session.id_username, title, content, datepost], function(err) {
>>>>>>> 85dbb8a11f399e2dd046f1957aed7134670b75e1
        if (err) {
            console.error("Erro ao criar post:", err);
            return res.status(500).render("pages/error", {
                message: "Erro ao criar post",
                error: err
            });
        }
        console.log(`Post criado com ID: ${this.lastID}`);
        res.redirect("/dashboard2");
    });
});

app.get("/post_edit/:id", (req, res) => {
    if (!req.session.loggedin) return res.redirect("/unauthorized2");

    const postId = req.params.id;
    const query = "SELECT * FROM posts WHERE id = ?";

    db.get(query, [postId], (err, post) => {
        if (err) {
            console.error("Erro ao buscar post:", err);
            return res.status(500).render('pages/error', {
                message: "Erro ao carregar post para edição",
                error: err
            });
        }

        if (!post) {
            return res.status(404).render('pages/error', {
                message: "Post não encontrado",
                error: { status: 404 }
            });
        }

        // Verificar permissões
        const isAuthor = req.session.id_username == post.iduser;
        const isAdmin = req.session.role === 'admin';

        if (!isAuthor && !isAdmin) return res.redirect("/unauthorized2");

        res.render("pages/post_edit", {
            titulo: "Editar Postagem",
            post: post,
            req: req
        });
    });
});

app.post("/post_edit/:id", [
    body('title')
        .notEmpty().withMessage('O título é obrigatório')
        .isLength({ min: 5, max: 100 }).withMessage('O título deve ter entre 5 e 100 caracteres')
        .trim()
        .escape(),
    
    body('content')
        .notEmpty().withMessage('O conteúdo é obrigatório')
        .isLength({ min: 10 }).withMessage('O conteúdo deve ter no mínimo 10 caracteres')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Garanta que oldInput seja passado mesmo em erros
        return res.status(400).render('pages/post_edit', {
            titulo: "Editar Postagem",
            post: { id: req.params.id }, // Passa apenas o ID necessário
            req: req,
            errors: errors.array(),
            oldInput: req.body // Importante: passe os dados submetidos
        });
    }

    if (!req.session.loggedin) return res.redirect("/unauthorized2");

    const postId = req.params.id;
    const { title, content } = req.body;
    
    // Verificar permissões
    db.get("SELECT * FROM posts WHERE id = ?", [postId], (err, post) => {
        if (err || !post) {
            console.error("Erro ao buscar post:", err);
            return res.redirect("/dashboard2?error=post_not_found");
        }
        
        const isAuthor = req.session.id_username == post.iduser;
        const isAdmin = req.session.role === 'admin';
        
        if (!isAuthor && !isAdmin) return res.redirect("/unauthorized2");

        // Atualizar o post
        const updateQuery = `
            UPDATE posts 
            SET title = ?, content = ?, datepost = datetime('now')
            WHERE id = ?
        `;
        
        db.run(updateQuery, [title, content, postId], function(err) {
            if (err) {
                console.error("Erro ao atualizar post:", err);
                return res.redirect(`/post_edit/${postId}?error=update_failed`);
            }
            
            console.log(`Post ${postId} atualizado com sucesso`);
            res.redirect("/dashboard2?success=post_updated");
        });
    });
}); 


<<<<<<< HEAD
// Rotas administrativas
=======
app.use(express.json()); // Para analisar application/json
// Busca dados para o painel admin

// Página administrativa (acesso restrito a admin)
>>>>>>> 85dbb8a11f399e2dd046f1957aed7134670b75e1
app.get("/modify", (req, res) => {
    if (!req.session.loggedin || req.session.role !== 'admin') {
        return res.redirect("/unauthorized2");
    }

    db.all("SELECT id, username, role FROM users", [], (err, users) => {
        if (err) {
            console.error(err);
            return res.redirect("/unauthorized2");
        }

        db.all(`
            SELECT posts.*, users.username
            FROM posts
            JOIN users ON posts.iduser = users.id
        `, [], (err, posts) => {
            if (err) {
                console.error(err);
                return res.redirect("/unauthorized2");
            }

            db.get("SELECT COUNT(*) AS count FROM users", [], (err, userCount) => {
                db.get("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'", [], (err, adminCount) => {
                    db.get("SELECT COUNT(*) AS count FROM posts", [], (err, postCount) => {
                        db.get("SELECT MAX(created_at) AS last_backup FROM backups", [], (err, backupResult) => {
                            const lastBackup = backupResult ? backupResult.last_backup : null;
                            res.render("pages/modify", {
                                titulo: "Painel Admin",
                                users: users,
                                posts: posts,
                                userCount: userCount.count,
                                adminCount: adminCount.count,
                                postCount: postCount.count,
                                logs: [],
                                req: req
                            });
                        });
                    });
                });
<<<<<<< HEAD
            });
=======
            })
        })
    } else {
        res.redirect("/unauthorized2");
    }
});

// Promove usuário para admin
app.post("/promote_user", (req, res) => {
    if (req.session.role === 'admin') {
        const userId = req.body.userId;
        db.run("UPDATE users SET role='admin' WHERE id=?", [userId], (err) => {
            // Registrar ação em logs
            logAction(req.session.username, `Promoveu usuário ${userId} para admin`); // Registro de ação
            res.redirect("/modify");
>>>>>>> 85dbb8a11f399e2dd046f1957aed7134670b75e1
        });
    });
});
// app.js
app.get("/posts_management", (req, res) => {
    if (!req.session.loggedin || req.session.role !== 'admin') {
        return res.redirect("/unauthorized2");
    }

<<<<<<< HEAD
    db.all(`
        SELECT posts.*, users.username
        FROM posts
        JOIN users ON posts.iduser = users.id
    `, [], (err, posts) => {
        if (err) {
            console.error(err);
            return res.redirect("/unauthorized2");
        }

<<<<<<< HEAD
        db.all("SELECT id, username FROM users", [], (err, users) => {
            if (err) {
                console.error(err);
                return res.redirect("/unauthorized2");
            }

            res.render("pages/posts_management", {
                titulo: "Gerenciamento de Posts",
                posts: posts,
                users: users,
                req: req
            });
        });
=======
// Excluir post (pelo admin)
=======
// Rebaixa usuário para normal
app.post("/demote_user", (req, res) => {
    if (req.session.role === 'admin') {
        const userId = req.body.userId;
        db.run("UPDATE users SET role='normal' WHERE id=?", [userId], (err) => {
            logAction(req.session.username, `Rebaixou usuário ${userId} para normal`);
            res.redirect("/modify");
        });
    }
});

// Exclui usuário
app.post("/delete_user", (req, res) => {
    if (req.session.role === 'admin') {
        const userId = req.body.userId;
        db.run("DELETE FROM users WHERE id=?", [userId], (err) => {
            logAction(req.session.username, `Excluiu usuário ${userId}`);
            res.redirect("/modify");
        });
    }
});

// Exclui post (pelo admin)
>>>>>>> 85dbb8a11f399e2dd046f1957aed7134670b75e1
app.post("/delete_post_admin", (req, res) => {
    if (req.session.role === 'admin') {
        const postId = req.body.postId;
        db.run("DELETE FROM posts WHERE id=?", [postId], (err) => {
            logAction(req.session.username, `Excluiu post ${postId}`);
            res.redirect("/modify#posts-tab");
        });
    }
});

// Função para registrar ações (simplificada)
function logAction(username, action) {
    const timestamp = new Date().toISOString();
    console.log(`[ADMIN ACTION] ${timestamp} | ${username}: ${action}`);
    // Implementar: salvar em tabela de logs no banco
}

// Exclui post (pelo usuário)
app.post("/post_delete", (req, res) => {
    if (!req.session.loggedin || req.session.role !== 'admin') {
        return res.redirect("/unauthorized2");
    }

    const postId = req.body.postId;
    db.run("DELETE FROM posts WHERE id = ?", [postId], (err) => {
        if (err) {
            console.error(err);
            res.send("Erro ao deletar post");
        } else {
            res.redirect("/dashboard2");
        }
>>>>>>> 10283021c4b033cd5c611cf0c3a921c24c075263
    });
});

<<<<<<< HEAD
app.post("/promote_user", (req, res) => {
    if (req.session.role !== 'admin') return res.redirect("/unauthorized2");
    
    const userId = req.body.userId;
    db.run("UPDATE users SET role='admin' WHERE id=?", [userId], (err) => {
        if (err) console.error(err);
        res.redirect("/modify");
    });
});

app.post("/demote_user", (req, res) => {
    if (req.session.role !== 'admin') return res.redirect("/unauthorized2");
    
    const userId = req.body.userId;
    db.run("UPDATE users SET role='normal' WHERE id=?", [userId], (err) => {
        if (err) console.error(err);
        res.redirect("/modify");
    });
});

app.post("/delete_user", (req, res) => {
    if (req.session.role !== 'admin') return res.redirect("/unauthorized2");
    
    const userId = req.body.userId;
    db.run("DELETE FROM users WHERE id=?", [userId], (err) => {
        if (err) console.error(err);
        res.redirect("/modify");
    });
});

app.post("/delete_post_admin", (req, res) => {
    if (req.session.role !== 'admin') return res.redirect("/unauthorized2");
    
    const postId = req.body.postId;
    db.run("DELETE FROM posts WHERE id=?", [postId], (err) => {
        if (err) console.error(err);
        res.redirect("/posts_management"); // Redireciona para a nova página
    });
});

app.post("/post_delete", (req, res) => {
    if (!req.session.loggedin || req.session.role !== 'admin') {
        return res.redirect("/unauthorized2");
    }

    const postId = req.body.postId;
    db.run("DELETE FROM posts WHERE id = ?", [postId], (err) => {
        if (err) {
            console.error(err);
            res.send("Erro ao deletar post");
        } else {
            res.redirect("/dashboard2");
        }
    });
});

=======
// Logout: Destrói sessão e redireciona
>>>>>>> 85dbb8a11f399e2dd046f1957aed7134670b75e1
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/index2");
    });
});

<<<<<<< HEAD


// Rotas de teste de cookies
app.get('/set-cookie', (req, res) => {
    res.cookie('usuarioToken', 'token-local-simples', {
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        maxAge: 1000 * 60 * 60,
        path: '/'
    });
    res.send('Cookie local definido!');
});

app.get('/ver-cookie', (req, res) => {
    const token = req.cookies.usuarioToken;
    res.send(token ? `Cookie recebido: ${token}` : 'Nenhum cookie encontrado.');
});

// Rota de erro 404
app.use((req, res) => {
=======
// Tratamento de erros 404
app.use('/{*erro}', (req, res) => {
    // Envia uma resposta de erro 404
>>>>>>> 85dbb8a11f399e2dd046f1957aed7134670b75e1
    res.status(404).render('pages/erro', { titulo: "ERRO 404", req: req, msg: "404" });
});
<<<<<<< HEAD
=======
const fs = require('fs');
const path = require('path');

<<<<<<< HEAD

>>>>>>> 10283021c4b033cd5c611cf0c3a921c24c075263

// Iniciar servidor
=======
// Cria backup do banco de dados
app.post("/backup_db", (req, res) => {
    if (req.session.role === 'admin') {
        const backupDir = path.join(__dirname, 'backups');

        // Criar diretório se não existir
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFilename = `backup-${timestamp}.db`;
        const backupPath = path.join(backupDir, backupFilename);

        // Copiar o arquivo do banco de dados
        fs.copyFile('users.db', backupPath, (err) => {
            if (err) {
                console.error("Backup failed:", err);
                return res.redirect("/modify?error=backup_failed");
            }

              // Registra backup no banco
            db.run("INSERT INTO backups (filename) VALUES (?)", [backupFilename], (err) => {
                if (err) {
                    console.error("Failed to log backup:", err);
                }

                logAction(req.session.username, `Backup criado: ${backupFilename}`);
                res.redirect("/modify?success=backup_created");
            });
        });
    } else {
        res.redirect("/unauthorized2");
    }
});

// Inicialização do servidor
>>>>>>> 85dbb8a11f399e2dd046f1957aed7134670b75e1
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});