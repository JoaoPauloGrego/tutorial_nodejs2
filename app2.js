const express = require('express');
const session = require('express-session');
const sqlite3 = require("sqlite3");
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const { body, validationResult } = require('express-validator');
const validator = require('validator');

const app = express();
const port = 8000;

// Conexão com banco de dados
const db = new sqlite3.Database("users.db");
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

// Middlewares
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
    session({
        secret: "senhaforteparacriptografarasessao",
        resave: true,
        saveUninitialized: true,
    })
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
app.locals.safeContent = function (content) {
    return validator.escape(content).replace(/\n/g, '<br>');
};

// Helper para formatar datas
app.locals.formatDate = function (dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date)) return 'Data inválida';

        return date.toLocaleDateString('pt-BR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

    } catch (e) {
        return 'Erro de data';
    }
};
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
// ============= ROTAS ============= //

// Rotas públicas
app.get("/index2", (req, res) => {
    res.render("./pages/index2", { titulo: "index2", req: req });
});

app.get("/sobre2", (req, res) => {
    res.render("./pages/sobre2", { titulo: "sobre2", req: req });
});

app.get("/cadastro2", (req, res) => {
    res.render("./pages/cadastro2", { titulo: "cadastro2", req: req });
});

app.get("/login2", (req, res) => {
    res.render("./pages/login2", { titulo: "login2", req: req });
});

app.get("/sucessfullysigned", (req, res) => {
    res.render("pages/sucessfullysigned", {titulo: "sucessfullysigned", req: req
    });
});

app.get("/alreadysign", (req, res) => {
    res.render("pages/alreadysign", {titulo: "usuário já cadastrado", req: req});
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

    const { username, password, role } = req.body;
    const query = "SELECT * FROM users WHERE username = ?";

    db.get(query, [username], (err, row) => {
        if (err) {
            console.error(err);
            return res.redirect("/alreadysign");
        }

        if (row) {
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
            });
        }
    });
});

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

    const { username, password } = req.body;
    const query = "SELECT * FROM users WHERE username = ? AND password = ?";

    db.get(query, [username, password], (err, row) => {
        if (err) {
            console.error(err);
            return res.redirect("/unauthorized2");
        }

        if (row) {
            req.session.username = username;
            req.session.loggedin = true;
            req.session.id_username = row.id;
            req.session.role = row.role;

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
            res.render("pages/dashboard_admin", {titulo: "Dashboard Admin", posts: posts, req: req});
        } else {
            res.render("pages/dashboard_normal", {titulo: "Meus Posts", posts: posts, req: req});
        }
    });
});

app.get("/post/:id", (req, res) => {
    if (!req.session.loggedin) return res.redirect("/unauthorized2");

    const postId = req.params.id;
    const query = `
        SELECT posts.*, users.username 
        FROM posts 
        JOIN users ON posts.iduser = users.id
        WHERE posts.id = ?
    `;

    db.get(query, [postId], (err, post) => {
        if (err) {
            console.error("Erro ao buscar post:", err);
            return res.status(500).render('pages/error', {
                message: "Erro ao carregar post"
            });
        }

        if (!post) {
            return res.status(404).render('pages/error', {
                message: "Post não encontrado"
            });
        }

        res.render("pages/post_detail", {titulo: post.title, post: post, req: req});
    });
});

app.get("/post_create", (req, res) => {
    if (!req.session.loggedin) return res.redirect("/unauthorized2");

    res.render("pages/post_form", {
        titulo: "Criar Postagem",
        req: req,
        oldInput: req.body
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
    }

    if (!req.session.loggedin || !req.session.id_username) {
        return res.redirect("/unauthorized2");
    }

    const { title, content } = req.body;
    const datepost = new Date().toISOString();

    const query = "INSERT INTO posts (iduser, title, content, datepost) VALUES(?, ?, ?, ?)";

    db.run(query, [req.session.id_username, title, content, datepost], function (err) {
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
            req: req,
            errors: [], // Array vazio para erros
            oldInput: req.body 
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
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return db.get("SELECT * FROM posts WHERE id = ?", [req.params.id], (err, post) => {
            if (err || !post) {
                return res.redirect("/dashboard2?error=post_not_found");
            }

            res.status(400).render('pages/post_edit', {
                titulo: "Editar Postagem",
                post: post,
                req: req,
                errors: errors.array(),
                oldInput: req.body  
            });
        });
    }

    if (!req.session.loggedin) return res.redirect("/unauthorized2");

    const postId = req.params.id;
    const { title, content } = req.body;

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

        db.run(updateQuery, [title, content, postId], function (err) {
            if (err) {
                console.error("Erro ao atualizar post:", err);
                return res.redirect(`/post_edit/${postId}?error=update_failed`);
            }

            console.log(`Post ${postId} atualizado com sucesso`);
            res.redirect("/dashboard2?success=post_updated");
        });
    });
});

// Rotas administrativas
app.get("/modify", (req, res) => {
    if (!req.session.loggedin || req.session.role !== 'admin') {
        return res.redirect("/unauthorized2");
    }

    db.all("SELECT id, username, role FROM users", [], (err, users) => {
        if (err) {
            console.error(err);
            return res.redirect("/unauthorized2");
        }

        // Página principal do admin (apenas usuários)
        db.get("SELECT COUNT(*) AS count FROM users", [], (err, userCount) => {
            db.get("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'", [], (err, adminCount) => {
                res.render("pages/modify", {
                    titulo: "Painel Admin",
                    users: users,
                    userCount: userCount.count,
                    adminCount: adminCount.count,
                    req: req
                });
            });
        });
    });
});

// Rota para gerenciamento de posts
app.get("/modify/posts", (req, res) => {
    if (!req.session.loggedin || req.session.role !== 'admin') {
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

        res.render("pages/posts_admin", {titulo: "Gerenciamento de Posts", posts: posts, req: req });
    });
});


// Promove um usuário para admin
app.post("/promote_user", (req, res) => {
    if (req.session.role !== 'admin') return res.redirect("/unauthorized2");

    const userId = req.body.userId;
    db.run("UPDATE users SET role='admin' WHERE id=?", [userId], (err) => {
        if (err) console.error(err);
        res.redirect("/modify");
    });
});

// Rebaixa/despromove um usuário para user
app.post("/demote_user", (req, res) => {
    if (req.session.role !== 'admin') return res.redirect("/unauthorized2");

    const userId = req.body.userId;
    db.run("UPDATE users SET role='normal' WHERE id=?", [userId], (err) => {
        if (err) console.error(err);
        res.redirect("/modify");
    });
});


// Apaga um usuário
app.post("/delete_user", (req, res) => {
    if (req.session.role !== 'admin') return res.redirect("/unauthorized2");

    const userId = req.body.userId;
    db.run("DELETE FROM users WHERE id=?", [userId], (err) => {
        if (err) console.error(err);
        res.redirect("/modify");
    });
});


// Apaga um post(se o usuário for admin)
app.post("/delete_post_admin", (req, res) => {
    if (req.session.role !== 'admin') return res.redirect("/unauthorized2");

    const postId = req.body.postId;
    db.run("DELETE FROM posts WHERE id=?", [postId], (err) => {
        if (err) console.error(err);
        res.redirect("/modify/posts");
    });
});


// Define que o único que pode deletar posts é o admin //
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


app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/index2");
    });
});



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
    res.status(404).render('pages/erro', { titulo: "ERRO 404", req: req, msg: "404" });
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});