-- Tornar boracorrerclub@gmail.com admin
UPDATE profiles 
SET is_admin = true
WHERE email = 'boracorrerclub@gmail.com';

-- Verificar
SELECT user_id, email, is_admin, nome_completo 
FROM profiles 
WHERE email = 'boracorrerclub@gmail.com';
