# TFG - Sistema de Gestion para Ingenieria Electrica

Sistema de gestion para una empresa de ingenieria electrica con backend API, portal de administracion, portal cliente y aplicacion movil/PWA. El repositorio esta pensado como guia tecnica para clonar, ejecutar y revisar el codigo del proyecto.

## Acceso rapido

### Versiones desplegadas

| Servicio | URL | Plataforma |
|---------|-----|-----------|
| Backend API | https://tfg-sistema-gestion-ingenieria-production.up.railway.app | Railway |
| Portal Administracion | https://tfg-admin.vercel.app | Vercel |
| Portal Cliente | https://tfg-cliente.vercel.app | Vercel |

### Credenciales de demostracion

Estas credenciales se usan para la base de datos local de prueba y para la revision funcional del sistema:

- Admin: `admin@tfg.local` / `Admin123!`
- Empleado: `empleado@tfg.local` / `Empleado123!`
- Cliente: `cliente@tfg.local` / `Cliente123!`

## Stack principal

- Backend: Node.js, Express, PostgreSQL, JWT, Socket.io
- Frontend admin: React 18, React Router, Axios
- Frontend cliente: React 18, React Router, Axios
- Mobile/PWA: React 18, Capacitor, Service Worker
- Integraciones opcionales: Ollama/Groq, Cloudinary, Nodemailer
- Despliegue: Railway para API y Vercel para frontends

## Instalacion local

### 1. Clonar el repositorio

```bash
git clone https://github.com/mng60/TFG-Sistema-Gestion-Ingenieria.git
cd TFG-Sistema-Gestion-Ingenieria
```

### 2. Requisitos

Para una revision local normal:

- Node.js v18 o superior (v20+ recomendado)
- PostgreSQL v14 o superior
- npm

Opcional segun lo que se quiera probar:

- Ollama para el asistente IA en local
- Android Studio para generar la APK

### 3. Instalar dependencias

Desde la raiz:

```bash
npm run install:all
```

### 4. Configurar variables de entorno

Copiar los archivos `.env.example` a `.env` en:

- `backend/.env`
- `frontend-admin/.env`
- `frontend-cliente/.env`
- `mobile/.env`

Configuracion base para `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tfg_gestion_ingenieria
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD_DE_POSTGRES
JWT_SECRET=cambiar_en_local_123
PORT=5000
FRONTEND_URL=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Solo si se quiere probar el asistente IA en local
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=phi3:mini
```

Configuracion base para los frontends en local:

```env
# frontend-admin/.env
PORT=3000
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_BACKEND_URL=http://localhost:5000

# frontend-cliente/.env
PORT=3001
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_BACKEND_URL=http://localhost:5000

# mobile/.env
PORT=3002
HOST=0.0.0.0
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_BACKEND_URL=http://localhost:5000
```

### 5. Preparar la base de datos local

Crear la base e importar esquema y datos de prueba:

```bash
createdb -U postgres tfg_gestion_ingenieria
psql -U postgres -d tfg_gestion_ingenieria -f backend/src/config/schema.sql
psql -U postgres -d tfg_gestion_ingenieria -f backend/src/config/seed.sql
```

### 6. Probar la IA en local (opcional)

```bash
ollama pull phi3:mini
ollama serve
```

### 7. Arrancar los modulos

Desde la raiz, en terminales separadas segun los modulos que se quieran usar:

```bash
npm run start:backend
npm run start:admin
npm run start:cliente
npm run start:mobile
```

Puertos por defecto:

- `backend`: `5000`
- `frontend-admin`: `3000`
- `frontend-cliente`: `3001`
- `mobile`: `3002`

### 8. Notas para revision local

- No hace falta configurar Groq, Cloudinary ni un proveedor de correo para revisar el flujo principal.
- Si no se configura Cloudinary, los archivos se guardan en `backend/uploads`.
- Si no se configura correo, las notificaciones no se envian pero la aplicacion sigue siendo navegable.
- Si no se levanta Ollama, la parte que puede no responder como en produccion es el asistente IA.

### 9. Generar APK Android (opcional)

```bash
cd mobile
npm run build
npx cap sync android
npx cap open android
```

Despues, desde Android Studio:

`Build -> Build Bundle(s) / APK(s) -> Build APK(s)`

## Extensiones utiles de VS Code

No son obligatorias para ejecutar el proyecto, pero pueden facilitar la revision del codigo:

- `ESLint`
- `Prettier - Code formatter`
- `PostgreSQL`
- `Thunder Client` o `Postman`
- `vscode-pdf`
- `Auto Rename Tag`

## Estructura del proyecto

```text
TFG-Sistema-Gestion-Ingenieria/
+-- package.json                 # Scripts raiz para instalar y arrancar modulos
+-- backend/
|   +-- server.js               # Punto de entrada del servidor
|   +-- src/
|   |   +-- config/             # DB, socket, multer, schema.sql y seed.sql
|   |   +-- controllers/        # Logica de negocio por dominio
|   |   |   +-- helpers/        # Soporte para el asistente IA
|   |   +-- data/knowledge/     # Base de conocimiento del asistente
|   |   +-- jobs/               # Tareas programadas
|   |   +-- middlewares/        # Auth, roles y validaciones comunes
|   |   +-- models/             # Acceso a datos
|   |   +-- routes/             # Endpoints de la API
|   |   +-- services/           # Integraciones externas
|   |   +-- utils/              # JWT, email y utilidades compartidas
|   +-- uploads/                # Almacenamiento local en desarrollo
+-- frontend-admin/
|   +-- src/
|       +-- components/         # Layout, chat y modales reutilizables del panel
|       +-- context/            # Estado global de autenticacion y sesion
|       +-- pages/              # Vistas del portal de administracion
|       +-- services/           # Cliente HTTP y llamadas a la API
|       +-- styles/             # Estilos por pagina y componente
|       +-- utils/              # Helpers de frontend
+-- frontend-cliente/
|   +-- src/
|       +-- components/         # Layout, chat, asistente IA y componentes comunes
|       +-- context/            # Estado del portal cliente
|       +-- pages/              # Landing, login, dashboard y area privada
|       +-- services/           # Consumo de API y sockets
|       +-- styles/             # Estilos del portal cliente
|       +-- utils/              # Helpers y formatos de apoyo
+-- mobile/
|   +-- android/                # Proyecto nativo generado por Capacitor
|   +-- capacitor.config.json   # Configuracion de empaquetado movil
|   +-- src/
|       +-- components/
|       |   +-- chat/           # UI de mensajeria en movil
|       |   +-- common/         # Componentes compartidos
|       |   +-- layout/         # Estructura base y navegacion
|       |   +-- proyecto/       # Componentes de detalle y seguimiento
|       +-- context/            # Estado global en la app movil
|       +-- pages/              # Pantallas principales
|       +-- services/           # API, sockets y acceso a datos
|       +-- styles/             # Estilos para vista movil/PWA
|       +-- utils/              # Helpers del cliente movil
|       +-- serviceWorkerRegistration.js
+-- docs/
|   +-- diagramas/              # Diagramas de apoyo del sistema
|   +-- logos/                  # Recursos graficos del proyecto
+-- .vscode/                    # Configuracion local del editor
+-- LICENSE
+-- README.md
```

## Solucion de problemas comunes

### Error de scripts deshabilitados en PowerShell

```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Alerta de Windows Defender Firewall

Hacer clic en "Permitir acceso" la primera vez que se arranque el servidor.

### Error de build en Node v24 (mobile)

```bash
cd mobile
npm install ajv@^8 --legacy-peer-deps
```

### El navegador no conecta a localhost:5000

1. Verificar que el backend esta corriendo (`npm run start:backend` desde la raiz o `npm run dev` en `backend`).
2. Comprobar que el puerto no esta ocupado (variable `PORT` en `.env`).
3. Revisar la configuracion del firewall de Windows.

### Network error en el APK Android

El APK Capacitor envia peticiones desde el origen `https://localhost`. Asegurarse de que `FRONTEND_URL` en Railway incluye `capacitor://localhost,https://localhost,http://localhost`.

## Autor

**Miguel Sebastian Cardenas Nugra**  
Grado en Ingenieria Informatica  
Universidad Catolica San Antonio de Murcia (UCAM)

Fecha de inicio: 26 de enero de 2026  
Fecha estimada de finalizacion: 18 de mayo de 2026

## Licencia

MIT License - ver archivo `LICENSE` para mas detalles.
