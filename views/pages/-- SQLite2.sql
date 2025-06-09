-- SQLite
-- Corrige datas inválidas usando a data atual
UPDATE posts 
SET datepost = datetime('now')
WHERE datepost LIKE 'Invalid Date%' OR datepost IS NULL;

-- Converte todas as datas para formato ISO
UPDATE posts
SET datepost = datetime(datepost);