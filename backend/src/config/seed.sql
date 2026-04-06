-- =====================================================
-- DATOS DE PRUEBA PARA ENTORNO LOCAL
-- TFG - Sistema de Gestion para Ingenieria Electrica
-- =====================================================

BEGIN;

-- =====================================================
-- USUARIOS DE DEMO
-- Passwords:
--   admin@tfg.local    -> Admin123!
--   empleado@tfg.local -> Empleado123!
--   cliente@tfg.local  -> Cliente123!
-- =====================================================

INSERT INTO users (nombre, email, password, rol, telefono, email_personal)
VALUES (
    'Administrador Demo',
    'admin@tfg.local',
    '$2a$10$gCee.NdUe8fTu/LeuomSjeOOsU7F8JqGeHaqhS8zSO230LRGfeOrm',
    'admin',
    '600111222',
    'admin.personal@tfg.local'
)
ON CONFLICT (email) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    password = EXCLUDED.password,
    rol = EXCLUDED.rol,
    telefono = EXCLUDED.telefono,
    email_personal = EXCLUDED.email_personal,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO users (nombre, email, password, rol, telefono, email_personal)
VALUES (
    'Empleado Demo',
    'empleado@tfg.local',
    '$2a$10$KtbKgZPUabuOkwSbCk8kB.zHikTdfAwYuhK.RrYx1wpnyaqSiZc22',
    'empleado',
    '600333444',
    'empleado.personal@tfg.local'
)
ON CONFLICT (email) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    password = EXCLUDED.password,
    rol = EXCLUDED.rol,
    telefono = EXCLUDED.telefono,
    email_personal = EXCLUDED.email_personal,
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO clientes (
    nombre_empresa,
    cif,
    email,
    password,
    telefono,
    direccion,
    ciudad,
    codigo_postal,
    provincia,
    pais,
    persona_contacto,
    telefono_contacto,
    email_contacto,
    email_personal,
    notas,
    activo,
    activo_login
)
VALUES (
    'Cliente Demo SL',
    'B12345678',
    'cliente@tfg.local',
    '$2a$10$kgoFeZCZ50Z2KolOjLHXZeObinHXEqD82jF3JfI6/8PvVysKqqS5i',
    '968000111',
    'Avenida Principal 12',
    'Murcia',
    '30001',
    'Murcia',
    'Espana',
    'Laura Cliente',
    '600555666',
    'contacto@clientedemo.local',
    'laura@clientedemo.local',
    'Cliente de demostracion para pruebas locales.',
    TRUE,
    TRUE
)
ON CONFLICT (cif) DO UPDATE SET
    nombre_empresa = EXCLUDED.nombre_empresa,
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    telefono = EXCLUDED.telefono,
    direccion = EXCLUDED.direccion,
    ciudad = EXCLUDED.ciudad,
    codigo_postal = EXCLUDED.codigo_postal,
    provincia = EXCLUDED.provincia,
    pais = EXCLUDED.pais,
    persona_contacto = EXCLUDED.persona_contacto,
    telefono_contacto = EXCLUDED.telefono_contacto,
    email_contacto = EXCLUDED.email_contacto,
    email_personal = EXCLUDED.email_personal,
    notas = EXCLUDED.notas,
    activo = EXCLUDED.activo,
    activo_login = EXCLUDED.activo_login,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- PROYECTO DE DEMO
-- =====================================================

INSERT INTO proyectos (
    nombre,
    descripcion,
    cliente_id,
    estado,
    prioridad,
    fecha_inicio,
    fecha_fin_estimada,
    presupuesto_estimado,
    responsable_id,
    ubicacion,
    notas
)
SELECT
    'Reforma electrica nave industrial',
    'Proyecto de prueba para validar panel interno, portal cliente y aplicacion movil en local.',
    c.id,
    'en_progreso',
    'alta',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '20 days',
    12000.00,
    u.id,
    'Murcia - Poligono Industrial Oeste',
    'Proyecto semilla para testing local.'
FROM clientes c
CROSS JOIN users u
WHERE c.cif = 'B12345678'
  AND u.email = 'admin@tfg.local'
  AND NOT EXISTS (
      SELECT 1
      FROM proyectos p
      WHERE p.nombre = 'Reforma electrica nave industrial'
  );

INSERT INTO proyecto_empleados (proyecto_id, user_id, rol_proyecto, activo)
SELECT p.id, u.id, 'Direccion de proyecto', TRUE
FROM proyectos p
JOIN users u ON u.email = 'admin@tfg.local'
WHERE p.nombre = 'Reforma electrica nave industrial'
ON CONFLICT (proyecto_id, user_id) DO UPDATE SET
    rol_proyecto = EXCLUDED.rol_proyecto,
    activo = TRUE,
    fecha_desasignacion = NULL;

INSERT INTO proyecto_empleados (proyecto_id, user_id, rol_proyecto, activo)
SELECT p.id, u.id, 'Tecnico de campo', TRUE
FROM proyectos p
JOIN users u ON u.email = 'empleado@tfg.local'
WHERE p.nombre = 'Reforma electrica nave industrial'
ON CONFLICT (proyecto_id, user_id) DO UPDATE SET
    rol_proyecto = EXCLUDED.rol_proyecto,
    activo = TRUE,
    fecha_desasignacion = NULL;

-- =====================================================
-- PRESUPUESTO DE DEMO
-- =====================================================

INSERT INTO presupuestos (
    proyecto_id,
    numero_presupuesto,
    version,
    fecha_emision,
    fecha_validez,
    estado,
    subtotal,
    iva,
    total,
    observaciones,
    creado_por,
    aceptado,
    fecha_aceptacion
)
SELECT
    p.id,
    'PRES-2026-001',
    1,
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '25 days',
    'aceptado',
    12000.00,
    21.00,
    14520.00,
    'Presupuesto de demostracion aceptado por el cliente.',
    u.id,
    TRUE,
    CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM proyectos p
JOIN users u ON u.email = 'admin@tfg.local'
WHERE p.nombre = 'Reforma electrica nave industrial'
ON CONFLICT (numero_presupuesto) DO UPDATE SET
    estado = EXCLUDED.estado,
    subtotal = EXCLUDED.subtotal,
    iva = EXCLUDED.iva,
    total = EXCLUDED.total,
    observaciones = EXCLUDED.observaciones,
    creado_por = EXCLUDED.creado_por,
    aceptado = EXCLUDED.aceptado,
    fecha_aceptacion = EXCLUDED.fecha_aceptacion,
    updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- TICKET Y ACTUALIZACION DE DEMO
-- =====================================================

INSERT INTO tickets (tipo, tipo_usuario, email, nombre, empresa, telefono, mensaje, proyecto_id, estado)
SELECT
    'solicitud_presupuesto',
    'empleado',
    'empleado@tfg.local',
    'Empleado Demo',
    NULL,
    '600333444',
    'Solicitud de revision del presupuesto por ampliacion de materiales.',
    p.id,
    'pendiente'
FROM proyectos p
WHERE p.nombre = 'Reforma electrica nave industrial'
  AND NOT EXISTS (
      SELECT 1
      FROM tickets t
      WHERE t.tipo = 'solicitud_presupuesto'
        AND t.email = 'empleado@tfg.local'
  );

INSERT INTO proyecto_actualizaciones (
    proyecto_id,
    empleado_id,
    realizado,
    pendiente,
    sugiere_cambio_fecha,
    fecha_sugerida
)
SELECT
    p.id,
    u.id,
    'Instalado el nuevo cuadro electrico y revisadas las lineas de distribucion.',
    'Pendiente certificacion final y pruebas de carga.',
    FALSE,
    NULL
FROM proyectos p
JOIN users u ON u.email = 'empleado@tfg.local'
WHERE p.nombre = 'Reforma electrica nave industrial'
  AND NOT EXISTS (
      SELECT 1
      FROM proyecto_actualizaciones a
      WHERE a.proyecto_id = p.id
        AND a.empleado_id = u.id
  );

-- =====================================================
-- CHAT DE DEMO
-- =====================================================

INSERT INTO conversaciones (tipo, nombre, proyecto_id, updated_at)
SELECT
    'empleado_cliente',
    'Chat demo cliente-empleado',
    p.id,
    CURRENT_TIMESTAMP - INTERVAL '1 hour'
FROM proyectos p
WHERE p.nombre = 'Reforma electrica nave industrial'
  AND NOT EXISTS (
      SELECT 1
      FROM conversaciones c
      WHERE c.nombre = 'Chat demo cliente-empleado'
  );

INSERT INTO conversacion_participantes (conversacion_id, user_id, tipo_usuario, joined_at, last_read)
SELECT c.id, u.id, 'empleado', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '3 hours'
FROM conversaciones c
JOIN users u ON u.email = 'empleado@tfg.local'
WHERE c.nombre = 'Chat demo cliente-empleado'
ON CONFLICT (conversacion_id, user_id, tipo_usuario) DO UPDATE SET
    last_read = EXCLUDED.last_read;

INSERT INTO conversacion_participantes (conversacion_id, user_id, tipo_usuario, joined_at, last_read)
SELECT c.id, cl.id, 'cliente', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '30 minutes'
FROM conversaciones c
JOIN clientes cl ON cl.cif = 'B12345678'
WHERE c.nombre = 'Chat demo cliente-empleado'
ON CONFLICT (conversacion_id, user_id, tipo_usuario) DO UPDATE SET
    last_read = EXCLUDED.last_read;

INSERT INTO mensajes (
    conversacion_id,
    user_id,
    tipo_usuario,
    mensaje,
    tipo_mensaje,
    created_at
)
SELECT
    c.id,
    u.id,
    'empleado',
    'Buenos dias, hemos terminado la instalacion principal.',
    'texto',
    CURRENT_TIMESTAMP - INTERVAL '4 hours'
FROM conversaciones c
JOIN users u ON u.email = 'empleado@tfg.local'
WHERE c.nombre = 'Chat demo cliente-empleado'
  AND NOT EXISTS (
      SELECT 1
      FROM mensajes m
      WHERE m.conversacion_id = c.id
        AND m.mensaje = 'Buenos dias, hemos terminado la instalacion principal.'
  );

INSERT INTO mensajes (
    conversacion_id,
    user_id,
    tipo_usuario,
    mensaje,
    tipo_mensaje,
    created_at
)
SELECT
    c.id,
    cl.id,
    'cliente',
    'Perfecto, gracias. Quedo pendiente de la certificacion final.',
    'texto',
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
FROM conversaciones c
JOIN clientes cl ON cl.cif = 'B12345678'
WHERE c.nombre = 'Chat demo cliente-empleado'
  AND NOT EXISTS (
      SELECT 1
      FROM mensajes m
      WHERE m.conversacion_id = c.id
        AND m.mensaje = 'Perfecto, gracias. Quedo pendiente de la certificacion final.'
  );

UPDATE conversaciones
SET updated_at = CURRENT_TIMESTAMP - INTERVAL '2 hours'
WHERE nombre = 'Chat demo cliente-empleado';

COMMIT;
