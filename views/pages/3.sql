-- 1. Criar nova tabela temporária
CREATE TABLE temp_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iduser INTEGER,
    title TEXT,
    content TEXT,
    datepost TEXT  -- Armazenaremos datas como texto ISO
);

-- 2. Migrar dados existentes corrigindo datas inválidas
INSERT INTO temp_posts (id, iduser, title, content, datepost)
SELECT 
    id, 
    iduser, 
    title, 
    content,
    CASE 
        WHEN typeof(datepost) = 'text' AND datepost NOT LIKE 'Invalid Date%' 
            THEN datepost
        ELSE datetime('now')  -- Usa data atual para registros inválidos
    END
FROM posts;

-- 3. Apagar tabela original
DROP TABLE posts;

-- 4. Renomear tabela temporária
ALTER TABLE temp_posts RENAME TO posts;