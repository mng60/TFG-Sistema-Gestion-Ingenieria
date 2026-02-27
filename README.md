# TFG - Sistema de Gestión para Ingeniería Eléctrica

Sistema integral de gestión desarrollado como Trabajo Fin de Grado para el Grado en Ingeniería Informática de la UCAM.

## Descripción

Sistema completo de gestión de proyectos de ingeniería que incluye:

- **Backend API REST** — Node.js + Express + PostgreSQL + Socket.io
- **Portal Administración** — React (empleados e ingenieros)
- **Portal Cliente** — React (acceso externo para clientes)
- **Aplicación Móvil PWA** — React (para empleados en campo)

## Tecnologías

### Backend
- Node.js + Express.js
- PostgreSQL (con `pg`)
- JWT (autenticación dual: empleados y clientes)
- Socket.io (chat en tiempo real)
- Multer (subida de archivos)
- node-cron (limpieza automática de chats)
- bcryptjs, express-validator

### Frontend Admin (puerto 3000)
- React 18 + React Router
- Context API (`EmpleadoAuthContext`)
- Socket.io-client
- CSS modular por componente

### Frontend Cliente (puerto 3001)
- React 18 + React Router
- Context API (`AuthContext`)
- Socket.io-client
- CSS modular por componente

### Mobile PWA (puerto 3002)
- React 18 (PWA con Service Worker)
- Socket.io-client
- Instalable en Android/iOS desde el navegador

## Estructura del Proyecto

```
TFG-Sistema-Gestion-Ingenieria/
├── backend/
│   ├── src/
│   │   ├── config/          # Conexión a BD
│   │   ├── controllers/     # auth, chat, cliente, documento,
│   │   │                    # portal, presupuesto, proyecto, user
│   │   ├── jobs/            # cleanupChats.js (cron diario)
│   │   ├── middlewares/     # auth, authAny, authCliente
│   │   ├── models/          # Conversacion, Mensaje, Proyecto...
│   │   ├── routes/          # auth, chat, cliente, documento,
│   │   │                    # portal, presupuesto, proyecto, user
│   │   └── utils/
│   └── server.js
├── frontend-admin/          # Portal de empleados/administración
│   └── src/
│       ├── components/
│       │   ├── Layout/      # AdminLayout (responsive sidebar)
│       │   ├── chat/        # ChatLayout, ChatWindow, ChatHeader...
│       │   └── modals/      # DocumentoModal y otros
│       ├── context/         # EmpleadoAuthContext
│       ├── pages/           # AdminDashboard, Clientes, Proyectos,
│       │                    # ProyectoCompleto, Chat, Usuarios
│       ├── services/
│       └── styles/
├── frontend-cliente/        # Portal externo para clientes
│   └── src/
│       ├── components/
│       │   ├── Layout/      # ClienteLayout (responsive sidebar)
│       │   └── chat/        # ChatLayout, ChatWindow, ChatHeader...
│       ├── context/         # AuthContext
│       ├── pages/           # Login, Dashboard, ProyectoCompleto, Chat
│       ├── services/
│       └── styles/
├── mobile/                  # PWA móvil para empleados
│   └── src/
│       ├── components/
│       │   └── chat/        # ChatLayout, ChatWindow, ChatHeader...
│       ├── context/         # AuthContext
│       ├── pages/           # Login, Proyectos, ProyectoCompleto,
│       │                    # Chat, Perfil
│       ├── services/
│       └── styles/
└── docs/
    └── diagramas/
```

## Funcionalidades implementadas

### Portal Administración
- Login con JWT (empleados)
- Dashboard con resumen de proyectos y clientes
- Gestión de clientes (CRUD)
- Gestión de proyectos (CRUD, asignación de empleados, estados)
- Vista detalle de proyecto: información, presupuestos, documentos
- Subida y descarga de documentos (Multer)
- Gestión de presupuestos
- Gestión de usuarios del sistema
- Chat en tiempo real con Socket.io (grupos por proyecto, conversaciones directas)
- Notificación de mensajes no leídos en sidebar
- Layout responsive con sidebar deslizante en móvil

### Portal Cliente
- Login con JWT (clientes)
- Dashboard con cuadrícula de proyectos propios
- Vista detalle de proyecto: información, presupuestos, documentos
- Descarga de documentos
- Aceptación de presupuestos
- Chat en tiempo real con empleados del proyecto
- Layout responsive con sidebar deslizante en móvil

### Aplicación Móvil (PWA)
- Login para empleados
- Listado de proyectos asignados
- Vista detalle de proyecto
- Chat en tiempo real
- Perfil de usuario
- Instalable como PWA en Android e iOS

### Backend
- API REST completa con autenticación dual (empleados / clientes)
- Middleware `authAny` que normaliza ambos tipos de token
- Chat con Socket.io: grupos de proyecto creados automáticamente al crear proyecto
- Borrado automático de chats 3 días después de completar un proyecto (cron job)
- Subida de archivos con Multer
- CORS configurado para los tres frontends

## Instalación y arranque

### Requisitos previos
- Node.js v18 o superior (backend/admin/cliente), v20+ recomendado
- PostgreSQL v14 o superior
- npm

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env   # Configurar DB, JWT_SECRET, FRONTEND_URL, etc.
npm run dev            # Puerto 5000
```

Variables de entorno relevantes en `backend/.env`:
```
DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
JWT_SECRET
PORT=5000
FRONTEND_URL=http://localhost:3000,http://localhost:3001,http://localhost:3002
```

### 2. Portal Administración
```bash
cd frontend-admin
npm install
# Crear .env con REACT_APP_API_URL=http://localhost:5000/api
npm start              # Puerto 3000
```

### 3. Portal Cliente
```bash
cd frontend-cliente
npm install
# Crear .env con REACT_APP_API_URL=http://localhost:5000/api
npm start              # Puerto 3001
```

### 4. Aplicación Móvil (PWA)
```bash
cd mobile
npm install --legacy-peer-deps
# Crear .env con REACT_APP_API_URL=http://<IP-LOCAL>:5000/api
npm start              # Puerto 3002
```

Para instalar como PWA en el móvil: abrir `http://<IP-del-PC>:3002` desde el móvil en la misma red WiFi y seleccionar "Añadir a pantalla de inicio".

## Metodología

Desarrollo siguiendo metodología **Scrum** con 6 sprints:

| Sprint | Descripción | Estado |
|--------|-------------|--------|
| Sprint 0 | Configuración inicial del proyecto | Completado |
| Sprint 1 | Backend e infraestructura base | Completado |
| Sprint 2 | Gestión de proyectos y documentos | Completado |
| Sprint 3 | Portal cliente + portal admin completo | Completado |
| Sprint 4 | Aplicación móvil PWA + chat responsive | Completado |
| Sprint 5 | Finalización y mejoras | En curso |

## Solución de problemas comunes

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
1. Verificar que el backend está corriendo (`npm run dev` en `/backend`)
2. Comprobar que el puerto no está ocupado (variable `PORT` en `.env`)
3. Revisar la configuración del firewall de Windows

## Autor

**Miguel Sebastián Cárdenas Nugra**
Grado en Ingeniería Informática
Universidad Católica San Antonio de Murcia (UCAM)

Fecha de inicio: 26 de enero de 2026
Fecha estimada de finalización: 18 de mayo de 2026

## Licencia

MIT License — ver archivo LICENSE para más detalles.
