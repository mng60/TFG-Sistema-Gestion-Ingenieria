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
Fecha estimada de finalización: 18 de mayo de 2026
