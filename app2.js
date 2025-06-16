const express = require('express');
const session = require('express-session');
const sqlite3 = require("sqlite3");
//const bodyparser = require("body-parser");

const app = express();
const port = 8000;

//conexão com banco de dados
const db = new sqlite3.Database("users.db");
db.serialize(() => {
    db.run(
        "CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)"
    )
    db.run(
        "CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY AUTOINCREMENT, iduser INTEGER,  title TEXT, content TEXT, datepost TEXT)",
    )
});

// Middleware de sessão (gerencia autenticação de usuários)
app.use(
    session({
        secret: "senhaforteparacriptografarasessao",
        resave: true,
        saveUninitialized: true,
    })
)

// Servir arquivos estáticos (CSS, JS, imagens)
app.use('/static', express.static(__dirname + '/static'));

// Middleware para parsear dados de formulários
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

//Página inicial
app.get("/index2", (req, res) => {
    console.log("GET /index2")
    res.render("./pages/index2", { titulo: "index2", req: req });
});

// Página "Sobre"
app.get("/sobre2", (req, res) => {
    console.log("GET /sobre2");
    res.render("./pages/sobre2", { titulo: "sobre2", req: req });
});

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
app.get("/cadastro2", (req, res) => {
    console.log("GET /cadastro2");
    res.render("./pages/cadastro2", { titulo: "cadastro2", req: req });
});

// Processa cadastro de novo usuário
app.post("/cadastro2", (req, res) => {
    console.log("POST /cadastro2");
    console.log(JSON.stringify(req.body));
    const { username, password, role } = req.body;
    // Verifica se usuário já existe
    const query = "SELECT * FROM users WHERE username = ?";
    db.get(query, [username], (err, row) => {
        if (err) throw err;
        console.log("query SELECT do cadastro: ", JSON.stringify(row));
        if (row) {
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
            });
        }
    });
});

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
            req.session.role = row.role; // Armazena a role na sessão

            // Verificação do admin usando a ROLE (melhor que senha fixa)
             // Redireciona conforme perfil
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

// Formulário de criação de novo post
app.get("/post_create", (req, res) => {
    console.log("GET /post_create");
    
    if (req.session.loggedin) {
        res.render("pages/post_form", { 
            titulo: "Criar Postagem",
            req: req 
        });
    } else {
        res.redirect("/unauthorized2");
    }
});

app.get("/posts", (req, res) => {
    console.log("GET /posts");
    res.render("./pages/posts", { titulo: "posts", req: req });
});


// Processa criação de novo post
app.post("/post_create", (req, res) => {
    console.log("POST /post_create");
    
    // Verificação de segurança
    if (!req.session.loggedin || !req.session.id_username) {
        return res.redirect("/unauthorized2");
    }
    
    console.log("dados da postagem", req.body);
    
    if (!req.body || !req.body.title || !req.body.content) {
        console.error("Dados incompletos:", req.body);
        return res.status(400).send("Título e conteúdo são obrigatórios");
    }
    
    const { title, content } = req.body;
    const datepost = new Date().toISOString();
    
    console.log("Data de criação: ", datepost, 
                "Username: ", req.session.username, 
                "id username: ", req.session.id_username);

    const query = "INSERT INTO posts (iduser, title, content, datepost) VALUES(?, ?, ?, ?)";

    // Insere novo post no banco
    db.run(query, [req.session.id_username, title, content, datepost], function(err) {
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

app.use(express.urlencoded({ extended: true }));


app.use(express.json()); // Para analisar application/json
// Busca dados para o painel admin

// Página administrativa (acesso restrito a admin)
app.get("/modify", (req, res) => {
    if (req.session.loggedin && req.session.role === 'admin') {
        // Buscar todos os usuários
        db.all("SELECT id, username, role FROM users", [], (err, users) => {
            if (err) throw err;

            // Buscar todos os posts com nome de usuário
            db.all(`
        SELECT posts.*, users.username 
        FROM posts 
        JOIN users ON posts.iduser = users.id
      `, [], (err, posts) => {
                if (err) throw err;

                // Buscar estatísticas (exemplo simplificado)
                db.get("SELECT COUNT(*) AS count FROM users", [], (err, userCount) => {
                    db.get("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'", [], (err, adminCount) => {
                        db.get("SELECT COUNT(*) AS count FROM posts", [], (err, postCount) => {
                            db.get("SELECT MAX(created_at) AS last_backup FROM backups", [], (err, backupResult) => {
                                const lastBackup = backupResult ? backupResult.last_backup : null;
                                // Renderizar a página com todos os dados
                                res.render("pages/modify", {
                                    titulo: "Painel Admin",
                                    users: users,
                                    posts: posts,
                                    userCount: userCount.count,
                                    adminCount: adminCount.count,
                                    postCount: postCount.count,
                                    lastBackup: lastBackup,
                                     logs: [],
                                    req: req
                                });
                            });
                        });
                    });
                });
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
            logAction(req.session.username, `Promoveu usuário ${userId} para admin`);
            res.redirect("/modify");
        });
    }
});

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
    if (req.session.loggedin && req.session.role === 'admin') {
        const postId = req.body.postId;
        db.run("DELETE FROM posts WHERE id = ?", [postId], (err) => {
            if (err) {
                console.error(err);
                res.send("Erro ao deletar post");
            } else {
                res.redirect("/dashboard2");
            }
        });
    } else {
        res.redirect("/unauthorized2");
    }
});

// Logout: Destrói sessão e redireciona
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/index2");
    });

});

// Tratamento de erros 404
app.use('/{*erro}', (req, res) => {
    // Envia uma resposta de erro 404
    res.status(404).render('pages/erro', { titulo: "ERRO 404", req: req, msg: "404" });
});
const fs = require('fs');
const path = require('path');

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

            // Registra no banco
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
app.listen(port, () => {
    console.log(__dirname + "\\static");
    console.log(`Server is running on port ${port}`);
});