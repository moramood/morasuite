# MoraSuite POS — Sistema Profesional de Punto de Venta

**Mora Mood** — Sistema POS profesional con Node.js + Express + MySQL.

---

## 📋 Requisitos

- **Node.js** >= 18.x
- **MySQL** >= 8.0 (o MariaDB >= 10.5)
- **npm** >= 9.x

---

## ⚡ Instalación Rápida

### 1. Crear la Base de Datos

```bash
mysql -u root -p < database.sql
```

O desde phpMyAdmin en cPanel: ejecutar el contenido de `database.sql`.

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
DB_HOST=localhost
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_contraseña
DB_NAME=morasuite_db
JWT_SECRET=clave-secreta-de-64-caracteres-unica
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Iniciar el Servidor

```bash
npm start
```

El servidor creará automáticamente las tablas e insertará el usuario admin.

### 5. Acceder

Abrir `http://localhost:3000`

**Credenciales por defecto:**
- Usuario: `AdminMora`
- Contraseña: `moramood2026*`

---

## 🗂️ Estructura del Proyecto

```
morapos/
├── server.js              # Servidor Express principal
├── package.json           # Dependencias
├── .env                   # Variables de entorno (NO subir a git)
├── .env.example           # Plantilla de variables
├── database.sql           # Script de creación de BD
├── config/
│   ├── database.js        # Pool MySQL + auto-migración de tablas
│   └── logger.js          # Winston logger
├── middleware/
│   ├── auth.js            # JWT (httpOnly cookies) + roles
│   ├── errorHandler.js    # Manejo global de errores
│   └── validate.js        # Validación de entradas
├── models/                # Modelos de datos (queries)
├── controllers/           # Lógica de endpoints
├── routes/                # Definición de rutas API
└── public/                # Frontend (HTML/CSS/JS)
```

---

## 🔐 Seguridad

- **JWT en httpOnly cookies** (no localStorage)
- **Helmet** — headers de seguridad
- **Rate limiting** — 10 intentos de login por 15 min
- **Bcrypt** — contraseñas hasheadas con salt de 12 rondas
- **Validación** — sanitización de todas las entradas
- **CORS** — orígenes configurables
- **Transacciones** — ventas atómicas con locks

---

## 👥 Roles

| Rol | Acceso |
|-----|--------|
| `admin` | POS, Dashboard, Productos, Clientes, Historial |
| `cajero` | POS, Historial |

---

## 🚀 Despliegue en cPanel

### Opción A: Node.js Application Manager

1. Subir el proyecto a `public_html/morasuite/` (o subdirectorio)
2. En cPanel → "Setup Node.js App":
   - Root: `/home/usuario/public_html/morasuite`
   - Startup file: `server.js`
   - Node version: 18+
3. Crear la BD desde "MySQL Databases" en cPanel
4. Ejecutar `database.sql` desde phpMyAdmin
5. Configurar `.env` con las credenciales de cPanel
6. Click "Run NPM Install" y "Restart"

### Opción B: VPS (Ubuntu + Nginx)

```bash
# 1. Clonar/subir proyecto
cd /var/www/morasuite
npm install

# 2. Configurar .env
cp .env.example .env
nano .env

# 3. Crear BD
mysql -u root -p < database.sql

# 4. Instalar PM2
npm install -g pm2
pm2 start server.js --name morasuite
pm2 save
pm2 startup

# 5. Configurar Nginx
# /etc/nginx/sites-available/morasuite
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📡 API Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login (rate-limited) |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Datos del usuario actual |

### Productos
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/productos?page=1&search=` | Todos | Lista paginada |
| GET | `/api/productos/all` | Todos | Lista completa (POS) |
| POST | `/api/productos` | Admin | Crear producto |
| PUT | `/api/productos/:id` | Admin | Actualizar |
| DELETE | `/api/productos/:id` | Admin | Eliminar |

### Clientes
| Método | Ruta | Rol | Descripción |
|--------|------|-----|-------------|
| GET | `/api/clientes?page=1&search=` | Todos | Lista paginada |
| GET | `/api/clientes/all` | Todos | Lista completa (POS) |
| POST | `/api/clientes` | Todos | Crear cliente |
| PUT | `/api/clientes/:id` | Admin | Actualizar |
| DELETE | `/api/clientes/:id` | Admin | Eliminar |

### Ventas
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/ventas?page=1&search=` | Lista paginada |
| GET | `/api/ventas/:id` | Detalle de venta |
| POST | `/api/ventas` | Crear venta (transaccional) |

### Dashboard (Admin)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard/stats` | Estadísticas del día |
| GET | `/api/dashboard/top-products` | Top 5 productos |
| GET | `/api/dashboard/recent-sales` | Últimas 10 ventas |
| GET | `/api/dashboard/hourly` | Ventas por hora |

---

## 📄 Licencia

Propiedad de José Fernando Julio Hernandez — Mora Mood. Todos los derechos reservados.
