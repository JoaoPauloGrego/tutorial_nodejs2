const express = require('express');
const session = require('express-session');
const sqlite3 = require("sqlite3");
//const bodyparser = require("body-parser");

const app = express();
const port = 8000;

//conexão com banco de dados
const db = new sqlite3.Database("users.db");
db.serialize(() => {
    // Tabela userAD (administradores)
    db.run(
        `CREATE TABLE IF NOT EXISTS userAD (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            function2 TEXT
        )`,
        (err) => {
            if (err) console.error("Erro criando userAD:", err);
            else console.log("Tabela userAD criada/verificada");
        }
    );

    // Tabela users (usuários comuns)
    db.run(
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`,
        (err) => {
            if (err) console.error("Erro criando users:", err);
        }
    );

    // Tabela posts
    db.run(
        `CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            iduser INTEGER,
            title TEXT,
            content TEXT,
            datepost TEXT,
            FOREIGN KEY(iduser) REFERENCES users(id)
        )`,
        (err) => {
            if (err) console.error("Erro criando posts:", err);
        }
    );
});

app.use(
    session({
        secret: "senhaforteparacriptografarasessao",
        resave: true,
        saveUninitialized: true,
    })
)
app.use('/static', express.static(__dirname + '/static'));

app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.get("/index2", (req, res) => {
    console.log("GET /index2")
    res.render("./pages/index2", { titulo: "index2", req: req });
});

app.get("/sobre2", (req, res) => {
    console.log("GET /sobre2");
    res.render("./pages/sobre2", { titulo: "sobre2", req: req });
});

app.get("/dashboard2", (req, res) => {
    console.log("GET /dashboard2");
    if (req.session.loggedin) {
        const query = "SELECT * FROM posts";
        db.all(query, [], (err, row) => {
            res.render("pages/dashboard2", { titulo: "Tabela de usuários", dados: row });
        })

    } else {
        res.redirect("/unauthorized2")
    }
});
app.get("/unauthorized2", (req, res) =>
    res.render("pages/unauthorized2", { titulo: "Unauthorized", req: req })
);
app.get("/cadastro2", (req, res) => {
    console.log("GET /cadastro2");
    res.render("./pages/cadastro2", { titulo: "cadastro2", req: req });
});

app.post("/cadastro2", (req, res) => {
    console.log("POST /cadastro2");
    console.log(JSON.stringify(req.body));
    const { username, password, function2 } = req.body;
    const query = "SELECT * FROM userAD WHERE username = ? AND function2 = ?";
    db.get(query, [username], (err, row) => {
        if (err) throw err;
        console.log("query SELECT do cadastro: ", JSON.stringify(row));
        if (row) {
            console.log(`usuario:${username} já cadastrado`);
            res.redirect("/alreadysign");
        } else {
            const insert = "INSERT INTO userAD (username, password, function2) VALUES (?, ?, ?)";
            db.get(insert, [username, password, function2], (err, row) => {
                if (err) throw err;
                console.log(`usuario:${username} já cadastrado`);
                res.redirect("/sucessfullysigned")
            });
        }
    });
});
app.get("/sucessfullysigned", (req, res) =>
    res.render("pages/sucessfullysigned", {
        titulo: "sucessfullysigned",
        req: req
    })
);
app.get("/alreadysign", (req, res) =>
    res.render("pages/alreadysign", {
        titulo: "usuário já cadastrado",
        req: req
    })
);
app.get("/login2", (req, res) => {
    console.log("GET /login2");
    res.render("./pages/login2", { titulo: "login2", req: req });
});

app.post("/login2", (req, res) => {
    console.log("POST /login2");
    console.log(JSON.stringify(req.body));
    const { username, password, function2 } = req.body;
    const query = "SELECT * FROM userAD WHERE username = ? AND password = ? AND function2 = ?";
    db.get(query, [username, password, function2], (err, row) => {
        if (err) throw err;
        console.log(JSON.stringify(row));
        if (row) {
            req.session.username = username;
            req.session.loggedin = true;
            req.session.id_username = row.id;
            req.session.function2 = function2;
            if (row.function2 == "admin") {
                res.redirect("/modify");
            } else if
                (row.function2 == "user") {
                res.redirect("/dashboard2");
            } else {
                res.redirect("/unauthorized2")
            }
        }
    });

});

app.get("/post_create", (req, res) => {
    console.log("GET /post_create");
    if (req.session.loggedin) {
        res.render("pages/post_form", { titulo: "criar postagem", req: req, })
    } else {
        res.redirect("/unauthorized2")
    }
});
app.get("/posts", (req, res) => {
    console.log("GET /posts");
    const query = "SELECT * FROM posts";
    db.all(query, [], (err, row) => {
        if (err) throw err;
        console.log(JSON.stringify(row));
        res.render("./pages/posts", { titulo: "posts", req: req, dados: row, });
    })
});

app.post("/post_create", (req, res) => {
    console.log("POST /post_create");
    console.log("dados da postagem", req.body);
    const { title, content } = req.body;
    const datepost = new Date();
    const Ndata = datepost.toLocaleTimeString()
    console.log("Data de criação: ", Ndata, "Username: ", req.session.username, "id username: ", req.session.id)

    const query = "INSERT INTO posts (iduser, title, content, datepost) VALUES(?, ?, ?, ?)"

    db.get(query, [req.session.id_username, title, content, datepost], (err) => {
        if (err) throw err;
        res.send('Post Criado');
    })
});
app.get("/modify", (req, res) => {
    console.log("GET /modify");
    if (req.session.loggedin && req.session.function2 == "admin") {
        res.render("./pages/modify", { titulo: "modificar", req: req })
    } else {
        res.redirect("/unauthorized2")
    }
})

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/index2");
    });

});
app.use('/{*erro}', (req, res) => {
    // Envia uma resposta de erro 404
    res.status(404).render('pages/erro', { titulo: "ERRO 404", req: req, msg: "404" });
});


app.listen(port, () => {
    console.log(__dirname + "\\static");
    console.log(`Server is running on port ${port}`);
});