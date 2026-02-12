# TFG - Sistema de Gestión para Ingeniería Eléctrica

Sistema integral de gestión desarrollado como Trabajo Fin de Grado para el Grado en Ingeniería Informática de la UCAM.

## 📋 Descripción

Sistema completo que incluye:
- **Backend API REST** (Node.js + Express + PostgreSQL)
- **Frontend Web** (React)
- **Aplicación Móvil** (React Native)

## 🚀 Tecnologías

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT para autenticación

### Frontend
- React 18
- React Router
- Axios

### Mobile
- React Native
- Expo
- React Navigation

## 📁 Estructura del Proyecto
```
TFG-Sistema-Gestion-Ingenieria/
├── backend/           # API REST
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── server.js
├── frontend/          # Aplicación web React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── assets/
│   │   └── styles/
│   ├── public/
│   └── package.json
├── mobile/            # App móvil React Native
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── navigation/
│   │   ├── services/
│   │   ├── utils/
│   │   └── assets/
│   └── package.json
└── docs/              # Documentación
    ├── diagramas/
    ├── guias/
    └── sprint-reports/
```

## 🔧 Instalación

### Requisitos previos
- Node.js (v18 o superior)
- PostgreSQL (v14 o superior)
- npm o yarn

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

### Mobile
```bash
cd mobile
npm install
npm start
```

## 📖 Metodología

Desarrollo siguiendo metodología **Scrum** con 6 sprints:

- **Sprint 0**: Configuración inicial (1 semana)
- **Sprint 1**: Backend e infraestructura (3 semanas)
- **Sprint 2**: Gestión de proyectos (3 semanas)
- **Sprint 3**: Portal cliente y presupuestos (3 semanas)
- **Sprint 4**: Aplicación móvil (3 semanas)
- **Sprint 5**: IA y finalización (2 semanas)

## 👨‍💻 Autor

**Miguel Sebastián Cárdenas Nugra**  
Grado en Ingeniería Informática  
Universidad Católica San Antonio de Murcia (UCAM)

## 📄 Licencia

MIT License - ver archivo LICENSE para más detalles

## 📝 Estado del Proyecto

🚧 **En desarrollo - Sprint 0** 🚧

Fecha de inicio: 26 de enero de 2026  

## 🔧 Solución de Problemas Comunes

### Error: "No se puede cargar el archivo porque la ejecución de scripts está deshabilitada"

**Problema:** Al ejecutar `npm install` en Windows PowerShell aparece un error de seguridad.

**Solución:**
```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Este comando permite ejecutar scripts locales sin comprometer la seguridad del sistema.

### Alerta de Windows Defender Firewall al arrancar el servidor

**Problema:** Windows bloquea la comunicación de Node.js en la red.

**Solución:**
- Hacer clic en "Permitir acceso" cuando aparezca la alerta
- Esto solo es necesario la primera vez que se ejecuta el servidor
- Permite la comunicación entre backend (puerto 5000) y frontend (puerto 3000)

### El navegador no conecta a localhost:5000

**Problema:** Al abrir `http://localhost:5000` aparece "ERR_CONNECTION_REFUSED"

**Posibles causas y soluciones:**
1. **El servidor no está corriendo:** Ejecuta `npm start` en la carpeta backend
2. **El puerto está ocupado:** Cambia el puerto en el archivo `.env` (variable PORT)
3. **Firewall bloqueando:** Revisa la configuración del firewall de Windows

### Error al clonar el repositorio

**Problema:** Git solicita credenciales o falla la autenticación.

**Solución:**
- Usa Git con HTTPS: `git clone https://github.com/mng60/TFG-Sistema-Gestion-Ingenieria.git`
- Si usa autenticación de dos factores, genera un Personal Access Token en GitHub
- Configurar credenciales: `git config --global user.name "Tu Nombre"` y `git config --global user.email "tu@email.com"`

Fecha estimada de finalización: 18 de mayo de 2026
