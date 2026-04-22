-- ============================================================
-- MoraSuite — Script de Creación de Base de Datos
-- Ejecutar manualmente en MySQL antes de iniciar el servidor
-- ============================================================
-- Uso: mysql -u root -p < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS `morasuite_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Otorgar permisos (ajustar usuario según tu hosting)
-- GRANT ALL PRIVILEGES ON morasuite_db.* TO 'tu_usuario'@'localhost';
-- FLUSH PRIVILEGES;
