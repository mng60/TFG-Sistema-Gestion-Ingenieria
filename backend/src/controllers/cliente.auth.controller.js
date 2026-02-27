const bcrypt = require('bcryptjs');
const Cliente = require('../models/Cliente');
const { generateToken } = require('../utils/jwt');

// Registro de cliente (admin crea el acceso)
const activarAccesoCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Verificar que el cliente existe
    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Actualizar cliente con acceso
    const query = `
      UPDATE clientes 
      SET password = $1, activo_login = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, nombre_empresa, email, cif, activo_login
    `;

    const { pool } = require('../config/database');
    const result = await pool.query(query, [hashedPassword, id]);

    res.json({
      success: true,
      message: 'Acceso al portal activado exitosamente',
      cliente: result.rows[0]
    });
  } catch (error) {
    console.error('Error en activarAccesoCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al activar acceso',
      error: error.message
    });
  }
};

// Login de cliente
const loginCliente = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar cliente por email (necesitamos la contraseña)
    const { pool } = require('../config/database');
    const query = 'SELECT * FROM clientes WHERE email = $1';
    const result = await pool.query(query, [email]);
    const cliente = result.rows[0];

    if (!cliente) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar que tiene acceso activado
    if (!cliente.activo_login) {
      return res.status(403).json({
        success: false,
        message: 'Acceso al portal no activado. Contacte con la empresa.'
      });
    }

    // Verificar que tiene contraseña configurada
    if (!cliente.password) {
      return res.status(403).json({
        success: false,
        message: 'Acceso no configurado. Contacte con la empresa.'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, cliente.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último acceso
    const updateQuery = 'UPDATE clientes SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = $1';
    await pool.query(updateQuery, [cliente.id]);

    // Generar token con tipo "cliente"
    const token = generateToken({
      id: cliente.id,
      email: cliente.email,
      tipo: 'cliente',
      nombre_empresa: cliente.nombre_empresa
    });

    // Devolver datos sin contraseña
    const { password: _, ...clienteData } = cliente;

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      cliente: clienteData
    });
  } catch (error) {
    console.error('Error en loginCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

// Obtener perfil del cliente autenticado
const getPerfilCliente = async (req, res) => {
  try {
    const clienteId = req.user.id;

    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      cliente
    });
  } catch (error) {
    console.error('Error en getPerfilCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

// Obtener proyectos del cliente autenticado
const getMisProyectos = async (req, res) => {
  try {
    const clienteId = req.user.id;

    const proyectos = await Cliente.getProyectos(clienteId);

    res.json({
      success: true,
      count: proyectos.length,
      proyectos
    });
  } catch (error) {
    console.error('Error en getMisProyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proyectos',
      error: error.message
    });
  }
};

// Cambiar contraseña del cliente
const cambiarPasswordCliente = async (req, res) => {
  try {
    const clienteId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Obtener cliente con contraseña
    const { pool } = require('../config/database');
    const query = 'SELECT * FROM clientes WHERE id = $1';
    const result = await pool.query(query, [clienteId]);
    const cliente = result.rows[0];

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, cliente.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Hash de la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Actualizar contraseña
    const updateQuery = 'UPDATE clientes SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    await pool.query(updateQuery, [hashedPassword, clienteId]);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error en cambiarPasswordCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña',
      error: error.message
    });
  }
};

// Obtener presupuestos de los proyectos del cliente (acepta ?proyecto_id= para filtrar)
const getMisPresupuestos = async (req, res) => {
  try {
    const clienteId = req.user.id;
    const { proyecto_id } = req.query;

    const { pool } = require('../config/database');
    let query = `
      SELECT
        p.*,
        pr.nombre as proyecto_nombre,
        u.nombre as creado_por_nombre
      FROM presupuestos p
      JOIN proyectos pr ON p.proyecto_id = pr.id
      LEFT JOIN users u ON p.creado_por = u.id
      WHERE pr.cliente_id = $1
    `;

    const params = [clienteId];

    if (proyecto_id) {
      query += ' AND p.proyecto_id = $2';
      params.push(proyecto_id);
    }

    query += ' ORDER BY p.fecha_emision DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      presupuestos: result.rows
    });
  } catch (error) {
    console.error('Error en getMisPresupuestos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener presupuestos',
      error: error.message
    });
  }
};

// Obtener un presupuesto específico (solo si es de sus proyectos)
const getPresupuestoDetalle = async (req, res) => {
  try {
    const clienteId = req.user.id;
    const { id } = req.params;

    const { pool } = require('../config/database');
    const query = `
      SELECT 
        p.*,
        pr.nombre as proyecto_nombre,
        pr.descripcion as proyecto_descripcion,
        u.nombre as creado_por_nombre
      FROM presupuestos p
      JOIN proyectos pr ON p.proyecto_id = pr.id
      LEFT JOIN users u ON p.creado_por = u.id
      WHERE p.id = $1 AND pr.cliente_id = $2
    `;

    const result = await pool.query(query, [id, clienteId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado o no autorizado'
      });
    }

    res.json({
      success: true,
      presupuesto: result.rows[0]
    });
  } catch (error) {
    console.error('Error en getPresupuestoDetalle:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener presupuesto',
      error: error.message
    });
  }
};

// Aceptar un presupuesto
const aceptarMiPresupuesto = async (req, res) => {
  try {
    const clienteId = req.user.id;
    const { id } = req.params;

    const { pool } = require('../config/database');

    // Verificar que el presupuesto pertenece a un proyecto del cliente
    const checkQuery = `
      SELECT p.id, p.aceptado
      FROM presupuestos p
      JOIN proyectos pr ON p.proyecto_id = pr.id
      WHERE p.id = $1 AND pr.cliente_id = $2
    `;

    const checkResult = await pool.query(checkQuery, [id, clienteId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado o no autorizado'
      });
    }

    if (checkResult.rows[0].aceptado) {
      return res.status(400).json({
        success: false,
        message: 'El presupuesto ya está aceptado'
      });
    }

    // Aceptar presupuesto
    const updateQuery = `
      UPDATE presupuestos 
      SET aceptado = true, 
          fecha_aceptacion = CURRENT_TIMESTAMP,
          estado = 'aceptado',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [id]);

    res.json({
      success: true,
      message: 'Presupuesto aceptado exitosamente',
      presupuesto: result.rows[0]
    });
  } catch (error) {
    console.error('Error en aceptarMiPresupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aceptar presupuesto',
      error: error.message
    });
  }
};

// Obtener documentos públicos de los proyectos del cliente
const getMisDocumentos = async (req, res) => {
  try {
    const clienteId = req.user.id;
    const { proyecto_id } = req.query;

    const { pool } = require('../config/database');
    let query = `
      SELECT 
        d.*,
        pr.nombre as proyecto_nombre,
        u.nombre as subido_por_nombre
      FROM documentos d
      JOIN proyectos pr ON d.proyecto_id = pr.id
      LEFT JOIN users u ON d.subido_por = u.id
      WHERE pr.cliente_id = $1 AND d.es_publico = true
    `;

    const params = [clienteId];

    if (proyecto_id) {
      query += ' AND d.proyecto_id = $2';
      params.push(proyecto_id);
    }

    query += ' ORDER BY d.created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      documentos: result.rows
    });
  } catch (error) {
    console.error('Error en getMisDocumentos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos',
      error: error.message
    });
  }
};

// Descargar documento (solo si es público y del cliente)
const descargarMiDocumento = async (req, res) => {
  try {
    const clienteId = req.user.id;
    const { id } = req.params;

    const { pool } = require('../config/database');
    const query = `
      SELECT d.*
      FROM documentos d
      JOIN proyectos pr ON d.proyecto_id = pr.id
      WHERE d.id = $1 AND pr.cliente_id = $2 AND d.es_publico = true
    `;

    const result = await pool.query(query, [id, clienteId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado o no autorizado'
      });
    }

    const documento = result.rows[0];

    // Verificar que el archivo existe
    const fs = require('fs');
    if (!fs.existsSync(documento.ruta_archivo)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado en el servidor'
      });
    }

    // Enviar archivo
    res.download(documento.ruta_archivo, documento.nombre);
  } catch (error) {
    console.error('Error en descargarMiDocumento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar documento',
      error: error.message
    });
  }
};

// Obtener empleados asignados a uno de los proyectos del cliente (para iniciar chat)
const getEmpleadosProyecto = async (req, res) => {
  try {
    const clienteId = req.user.id;
    const { id: proyectoId } = req.params;

    const { pool } = require('../config/database');

    // Verificar que el proyecto pertenece al cliente autenticado
    const checkQuery = 'SELECT id FROM proyectos WHERE id = $1 AND cliente_id = $2';
    const checkResult = await pool.query(checkQuery, [proyectoId, clienteId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado o no autorizado'
      });
    }

    const query = `
      SELECT u.id, u.nombre, u.email, u.rol, pe.rol_proyecto
      FROM proyecto_empleados pe
      JOIN users u ON pe.user_id = u.id
      WHERE pe.proyecto_id = $1
      ORDER BY u.nombre ASC
    `;

    const result = await pool.query(query, [proyectoId]);

    res.json({
      success: true,
      count: result.rows.length,
      empleados: result.rows
    });
  } catch (error) {
    console.error('Error en getEmpleadosProyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener empleados del proyecto',
      error: error.message
    });
  }
};

module.exports = {
  activarAccesoCliente,
  loginCliente,
  getPerfilCliente,
  getMisProyectos,
  cambiarPasswordCliente,
  getMisPresupuestos,
  getPresupuestoDetalle,
  aceptarMiPresupuesto,
  getMisDocumentos,
  descargarMiDocumento,
  getEmpleadosProyecto
};