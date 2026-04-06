-- =====================================================
-- ESQUEMA ACTUALIZADO DE BASE DE DATOS
-- TFG - Sistema de Gestion para Ingenieria Electrica
-- =====================================================

BEGIN;

-- =====================================================
-- USUARIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'empleado',
    telefono VARCHAR(20),
    foto_url VARCHAR(500),
    email_personal VARCHAR(255),
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_personal VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_rol ON users(rol);

COMMENT ON TABLE users IS 'Tabla de empleados y administradores del sistema';
COMMENT ON COLUMN users.rol IS 'Roles soportados: admin, empleado';

-- =====================================================
-- CLIENTES
-- =====================================================

CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre_empresa VARCHAR(200) NOT NULL,
    cif VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    telefono VARCHAR(20),
    direccion TEXT,
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(10),
    provincia VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Espana',
    persona_contacto VARCHAR(200),
    telefono_contacto VARCHAR(20),
    email_contacto VARCHAR(255),
    email_personal VARCHAR(255),
    foto_url VARCHAR(500),
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    activo_login BOOLEAN DEFAULT false,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS email_personal VARCHAR(255);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS foto_url VARCHAR(500);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS activo_login BOOLEAN DEFAULT false;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_clientes_cif ON clientes(cif);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo);
CREATE INDEX IF NOT EXISTS idx_clientes_activo_login ON clientes(activo_login);

COMMENT ON TABLE clientes IS 'Tabla de empresas/clientes que contratan servicios';

-- =====================================================
-- PROYECTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS proyectos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    estado VARCHAR(50) DEFAULT 'pendiente',
    prioridad VARCHAR(20) DEFAULT 'media',
    fecha_inicio DATE,
    fecha_fin_estimada DATE,
    fecha_fin_real DATE,
    presupuesto_estimado DECIMAL(12, 2),
    presupuesto_real DECIMAL(12, 2),
    responsable_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ubicacion TEXT,
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proyectos_cliente ON proyectos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_responsable ON proyectos(responsable_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_prioridad ON proyectos(prioridad);

COMMENT ON TABLE proyectos IS 'Tabla de proyectos de ingenieria electrica';
COMMENT ON COLUMN proyectos.estado IS 'Estados soportados: pendiente, en_progreso, pausado, completado, cancelado';

-- =====================================================
-- EMPLEADOS ASIGNADOS A PROYECTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS proyecto_empleados (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rol_proyecto VARCHAR(100),
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_desasignacion TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    UNIQUE(proyecto_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_proyecto_empleados_proyecto ON proyecto_empleados(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_empleados_user ON proyecto_empleados(user_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_empleados_activo ON proyecto_empleados(activo);

COMMENT ON TABLE proyecto_empleados IS 'Relacion entre proyectos y empleados asignados';

-- =====================================================
-- PRESUPUESTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS presupuestos (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    numero_presupuesto VARCHAR(50) UNIQUE NOT NULL,
    version INTEGER DEFAULT 1,
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_validez DATE,
    estado VARCHAR(50) DEFAULT 'borrador',
    subtotal DECIMAL(12, 2) NOT NULL,
    iva DECIMAL(5, 2) DEFAULT 21.00,
    total DECIMAL(12, 2) NOT NULL,
    observaciones TEXT,
    creado_por INTEGER REFERENCES users(id) ON DELETE SET NULL,
    aceptado BOOLEAN DEFAULT false,
    fecha_aceptacion TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_presupuestos_proyecto ON presupuestos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_estado ON presupuestos(estado);
CREATE INDEX IF NOT EXISTS idx_presupuestos_aceptado ON presupuestos(aceptado);

COMMENT ON TABLE presupuestos IS 'Presupuestos asociados a proyectos';

-- =====================================================
-- DOCUMENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS documentos (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(100),
    descripcion TEXT,
    ruta_archivo VARCHAR(500) NOT NULL,
    tamano_bytes BIGINT,
    extension VARCHAR(10),
    subido_por INTEGER REFERENCES users(id) ON DELETE SET NULL,
    version INTEGER DEFAULT 1,
    es_publico BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documentos_proyecto ON documentos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_documentos_publico ON documentos(es_publico);

COMMENT ON TABLE documentos IS 'Documentos asociados a proyectos';

CREATE TABLE IF NOT EXISTS documento_visibilidad_empleados (
    documento_id INTEGER NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (documento_id, user_id)
);

COMMENT ON TABLE documento_visibilidad_empleados IS 'Restricciones de visibilidad de documentos para empleados';

-- =====================================================
-- ACTUALIZACIONES DE PROYECTO
-- =====================================================

CREATE TABLE IF NOT EXISTS proyecto_actualizaciones (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    empleado_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    realizado TEXT,
    pendiente TEXT,
    sugiere_cambio_fecha BOOLEAN DEFAULT FALSE,
    fecha_sugerida DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proyecto_actualizaciones_proyecto ON proyecto_actualizaciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_actualizaciones_empleado ON proyecto_actualizaciones(empleado_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_actualizaciones_fecha ON proyecto_actualizaciones(created_at);

COMMENT ON TABLE proyecto_actualizaciones IS 'Seguimiento y partes de avance de los proyectos';

-- =====================================================
-- TICKETS
-- =====================================================

CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) DEFAULT 'olvido_password',
    tipo_usuario VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    nombre VARCHAR(200),
    empresa VARCHAR(255),
    telefono VARCHAR(50),
    mensaje TEXT,
    proyecto_id INTEGER REFERENCES proyectos(id) ON DELETE SET NULL,
    estado VARCHAR(20) DEFAULT 'pendiente',
    resuelto_por INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resuelto_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS empresa VARCHAR(255);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS telefono VARCHAR(50);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS proyecto_id INTEGER REFERENCES proyectos(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS resuelto_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email);
CREATE INDEX IF NOT EXISTS idx_tickets_tipo ON tickets(tipo);
CREATE INDEX IF NOT EXISTS idx_tickets_proyecto ON tickets(proyecto_id);

COMMENT ON TABLE tickets IS 'Tickets de soporte, contacto, recuperacion de acceso y solicitudes';

-- =====================================================
-- CHAT
-- =====================================================

CREATE TABLE IF NOT EXISTS conversaciones (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    nombre VARCHAR(255),
    proyecto_id INTEGER REFERENCES proyectos(id) ON DELETE CASCADE,
    deletion_scheduled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE conversaciones ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_conversaciones_tipo ON conversaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_conversaciones_proyecto ON conversaciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_conversaciones_deletion_scheduled_at ON conversaciones(deletion_scheduled_at);

COMMENT ON TABLE conversaciones IS 'Conversaciones de chat directas o grupales';

CREATE TABLE IF NOT EXISTS conversacion_participantes (
    conversacion_id INTEGER NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    tipo_usuario VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read TIMESTAMP,
    PRIMARY KEY (conversacion_id, user_id, tipo_usuario)
);

ALTER TABLE conversacion_participantes ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE conversacion_participantes ADD COLUMN IF NOT EXISTS last_read TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_conv_participantes_usuario ON conversacion_participantes(user_id, tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_conv_participantes_last_read ON conversacion_participantes(last_read);

COMMENT ON TABLE conversacion_participantes IS 'Participantes de cada conversacion';

CREATE TABLE IF NOT EXISTS mensajes (
    id SERIAL PRIMARY KEY,
    conversacion_id INTEGER NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    tipo_usuario VARCHAR(20) NOT NULL,
    mensaje TEXT,
    tipo_mensaje VARCHAR(20) DEFAULT 'texto',
    archivo_url VARCHAR(1000),
    archivo_nombre VARCHAR(255),
    archivo_tipo VARCHAR(255),
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS tipo_mensaje VARCHAR(20) DEFAULT 'texto';
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS archivo_url VARCHAR(1000);
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS archivo_nombre VARCHAR(255);
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS archivo_tipo VARCHAR(255);
ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_mensajes_conversacion ON mensajes(conversacion_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_created_at ON mensajes(created_at);
CREATE INDEX IF NOT EXISTS idx_mensajes_tipo_mensaje ON mensajes(tipo_mensaje);
CREATE INDEX IF NOT EXISTS idx_mensajes_is_deleted ON mensajes(is_deleted);

COMMENT ON TABLE mensajes IS 'Mensajes de las conversaciones de chat';

COMMIT;
