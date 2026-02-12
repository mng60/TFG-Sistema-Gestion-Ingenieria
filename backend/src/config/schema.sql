-- =====================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS
-- TFG - Sistema de Gestión para Ingeniería Eléctrica
-- =====================================================

-- Tabla de usuarios (empleados y administradores)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'empleado',
    telefono VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
COMMENT ON TABLE users IS 'Tabla de usuarios del sistema';
COMMENT ON COLUMN users.rol IS 'Roles: admin, empleado';

-- Tabla de clientes (empresas que contratan servicios)
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre_empresa VARCHAR(200) NOT NULL,
    cif VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(10),
    provincia VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'España',
    persona_contacto VARCHAR(200),
    telefono_contacto VARCHAR(20),
    email_contacto VARCHAR(255),
    notas TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clientes_cif ON clientes(cif);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_activo ON clientes(activo);
COMMENT ON TABLE clientes IS 'Tabla de empresas/clientes que contratan servicios de ingeniería';

-- Tabla de proyectos
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
COMMENT ON TABLE proyectos IS 'Tabla de proyectos de ingeniería eléctrica';
COMMENT ON COLUMN proyectos.estado IS 'Estados: pendiente, en_progreso, pausado, completado, cancelado';

-- Tabla intermedia: asignación de empleados a proyectos
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
COMMENT ON TABLE proyecto_empleados IS 'Relación muchos a muchos entre proyectos y empleados';

-- Tabla de presupuestos
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
    creado_por INTEGER REFERENCES users(id),
    aceptado BOOLEAN DEFAULT false,
    fecha_aceptacion TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_presupuestos_proyecto ON presupuestos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_estado ON presupuestos(estado);
COMMENT ON TABLE presupuestos IS 'Presupuestos de proyectos';

-- Tabla de documentos del proyecto
CREATE TABLE IF NOT EXISTS documentos (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(100),
    descripcion TEXT,
    ruta_archivo VARCHAR(500) NOT NULL,
    tamano_bytes BIGINT,
    extension VARCHAR(10),
    subido_por INTEGER REFERENCES users(id),
    version INTEGER DEFAULT 1,
    es_publico BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documentos_proyecto ON documentos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos(tipo_documento);
COMMENT ON TABLE documentos IS 'Documentos asociados a proyectos';