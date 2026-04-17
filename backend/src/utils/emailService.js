const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const emailEnabled = () => process.env.EMAIL_USER && process.env.EMAIL_USER !== 'tuCorreo@gmail.com';

async function sendMail({ to, subject, html }) {
  if (!emailEnabled()) {
    console.log(`[EMAIL DESACTIVADO] Para: ${to} | Asunto: ${subject}`);
    return;
  }
  if (!to) return;
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
    console.log(`[EMAIL] Enviado a ${to}: ${subject}`);
  } catch (err) {
    console.error(`[EMAIL ERROR] No se pudo enviar a ${to}:`, err.message);
  }
}

// ─── Templates ───────────────────────────────────────────────────────────────

function baseLayout(contenido) {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { margin: 0; padding: 0; background: #f4f6f8; font-family: 'Segoe UI', Arial, sans-serif; }
      .wrapper { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
      .header { background: #1B3A4B; padding: 28px 32px; }
      .header h1 { margin: 0; color: #4DB6A8; font-size: 1.4rem; font-weight: 700; letter-spacing: 0.03em; }
      .header p  { margin: 4px 0 0; color: rgba(255,255,255,0.65); font-size: 0.82rem; }
      .body { padding: 28px 32px; color: #2c3e50; line-height: 1.6; }
      .body h2 { margin: 0 0 12px; font-size: 1.1rem; color: #1B3A4B; }
      .body p  { margin: 0 0 12px; font-size: 0.95rem; }
      .highlight { background: #f0faf9; border-left: 4px solid #4DB6A8; border-radius: 6px; padding: 14px 18px; margin: 16px 0; font-size: 1rem; }
      .highlight strong { color: #1B3A4B; }
      .btn { display: inline-block; background: #4DB6A8; color: #fff !important; text-decoration: none; padding: 11px 24px; border-radius: 8px; font-weight: 700; font-size: 0.92rem; margin-top: 8px; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
      .badge-success { background: #d4edda; color: #155724; }
      .badge-warning { background: #fff3cd; color: #856404; }
      .badge-danger  { background: #f8d7da; color: #721c24; }
      .footer { background: #f8f9fa; padding: 16px 32px; text-align: center; font-size: 0.78rem; color: #95a5a6; border-top: 1px solid #eee; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <h1>BlueArc Ingeniería</h1>
        <p>Sistema de Gestión de Proyectos</p>
      </div>
      <div class="body">
        ${contenido}
        <div style="text-align:center;margin-top:24px;">
          <img src="https://raw.githubusercontent.com/mng60/TFG-Sistema-Gestion-Ingenieria/main/docs/logos/logo.png" alt="BlueArc Ingeniería" style="height:52px;" />
        </div>
      </div>
      <div class="footer">
        Este es un mensaje automático, por favor no respondas a este correo.<br/>
        © ${new Date().getFullYear()} BlueArc Ingeniería
      </div>
    </div>
  </body>
  </html>`;
}

// 1. Reset de contraseña → destinatario: empleado o cliente
async function sendPasswordReset({ to, nombre, newPassword, tipoUsuario }) {
  const subject = 'Tu nueva contraseña — BlueArc Ingeniería';
  const html = baseLayout(`
    <h2>Restablecimiento de contraseña</h2>
    <p>Hola <strong>${nombre || to}</strong>,</p>
    <p>Un administrador ha restablecido tu contraseña de acceso${tipoUsuario === 'cliente' ? ' al portal de clientes' : ''}.</p>
    <div class="highlight">
      <strong>Nueva contraseña:</strong><br/>
      <span style="font-size:1.15rem;letter-spacing:0.08em;">${newPassword}</span>
    </div>
    <p>Te recomendamos cambiarla desde tu perfil en cuanto inicies sesión.</p>
    <p style="color:#e67e22;font-size:0.88rem;">⚠️ Comparte esta contraseña únicamente a través de un canal seguro.</p>
  `);
  await sendMail({ to, subject, html });
}

// 2. Nuevo presupuesto enviado → destinatario: cliente (email_personal)
async function sendNuevoPresupuesto({ to, nombreEmpresa, nombreProyecto, numeroPresupuesto, total, portalUrl }) {
  const subject = `Nuevo presupuesto pendiente de aprobación — ${numeroPresupuesto}`;
  const html = baseLayout(`
    <h2>Tienes un presupuesto pendiente</h2>
    <p>Hola <strong>${nombreEmpresa}</strong>,</p>
    <p>Se ha enviado un nuevo presupuesto para tu proyecto <strong>${nombreProyecto}</strong> que requiere tu aprobación.</p>
    <div class="highlight">
      <strong>Nº Presupuesto:</strong> ${numeroPresupuesto}<br/>
      <strong>Importe total:</strong> ${total}
    </div>
    <p>Accede a tu portal para revisarlo y aceptarlo o rechazarlo:</p>
    ${portalUrl ? `<a class="btn" href="${portalUrl}">Ver presupuesto</a>` : ''}
  `);
  await sendMail({ to, subject, html });
}

// 3. Presupuesto aceptado → destinatario: admins (email_personal)
async function sendPresupuestoAceptado({ to, nombreEmpresa, nombreProyecto, numeroPresupuesto, total }) {
  const subject = `✅ Presupuesto aceptado — ${numeroPresupuesto}`;
  const html = baseLayout(`
    <h2>Presupuesto aceptado por el cliente</h2>
    <p>El cliente <strong>${nombreEmpresa}</strong> ha <span class="badge badge-success">aceptado</span> el siguiente presupuesto:</p>
    <div class="highlight">
      <strong>Proyecto:</strong> ${nombreProyecto}<br/>
      <strong>Nº Presupuesto:</strong> ${numeroPresupuesto}<br/>
      <strong>Importe total:</strong> ${total}
    </div>
    <p>Accede al panel de administración para gestionar los siguientes pasos.</p>
  `);
  await sendMail({ to, subject, html });
}

// 4. Presupuesto rechazado → destinatario: admins (email_personal)
async function sendPresupuestoRechazado({ to, nombreEmpresa, nombreProyecto, numeroPresupuesto }) {
  const subject = `❌ Presupuesto rechazado — ${numeroPresupuesto}`;
  const html = baseLayout(`
    <h2>Presupuesto rechazado por el cliente</h2>
    <p>El cliente <strong>${nombreEmpresa}</strong> ha <span class="badge badge-danger">rechazado</span> el siguiente presupuesto:</p>
    <div class="highlight">
      <strong>Proyecto:</strong> ${nombreProyecto}<br/>
      <strong>Nº Presupuesto:</strong> ${numeroPresupuesto}
    </div>
    <p>Accede al panel de administración para revisar y actuar en consecuencia.</p>
  `);
  await sendMail({ to, subject, html });
}

// 5. Proyecto completado → destinatario: cliente (email_personal)
async function sendProyectoCompletado({ to, nombreEmpresa, nombreProyecto, portalUrl }) {
  const subject = `Tu proyecto ha finalizado — ${nombreProyecto}`;
  const html = baseLayout(`
    <h2>¡Proyecto completado!</h2>
    <p>Hola <strong>${nombreEmpresa}</strong>,</p>
    <p>Nos complace informarte de que tu proyecto <strong>${nombreProyecto}</strong> ha sido marcado como <span class="badge badge-success">completado</span>.</p>
    <p>Puedes acceder a tu portal para consultar los documentos finales y el histórico del proyecto:</p>
    ${portalUrl ? `<a class="btn" href="${portalUrl}">Ver proyecto</a>` : ''}
    <p style="margin-top:16px;">Gracias por confiar en BlueArc Ingeniería.</p>
  `);
  await sendMail({ to, subject, html });
}

// 6. Bienvenida al portal → destinatario: cliente (email_personal)
async function sendBienvenidaPortal({ to, nombreEmpresa, emailLogin, password, portalUrl }) {
  const subject = 'Bienvenido al Portal de Clientes — BlueArc Ingeniería';
  const html = baseLayout(`
    <h2>Bienvenido al portal de clientes</h2>
    <p>Hola <strong>${nombreEmpresa}</strong>,</p>
    <p>Se ha activado tu acceso al <strong>Portal de Clientes</strong> de BlueArc Ingeniería. Desde aquí podrás consultar el estado de tus proyectos, revisar presupuestos y descargar documentos.</p>
    <div class="highlight">
      <strong>Email de acceso:</strong> ${emailLogin}<br/>
      <strong>Contraseña temporal:</strong> <span style="letter-spacing:0.08em;">${password}</span>
    </div>
    <p>Por seguridad, te recomendamos cambiar la contraseña desde tu perfil tras el primer acceso.</p>
    ${portalUrl ? `<a class="btn" href="${portalUrl}">Acceder al portal</a>` : ''}
  `);
  await sendMail({ to, subject, html });
}

// 7. Confirmación de contacto web → destinatario: usuario externo
async function sendConfirmacionContacto({ to, nombre }) {
  const subject = 'Hemos recibido tu mensaje — BlueArc Ingeniería';
  const html = baseLayout(`
    <h2>Mensaje recibido</h2>
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Hemos recibido tu mensaje correctamente. Nuestro equipo lo revisará y se pondrá en contacto contigo a la mayor brevedad posible.</p>
    <div class="highlight">
      <strong>¿Qué ocurre ahora?</strong><br/>
      Un miembro de BlueArc Ingeniería revisará tu consulta y te responderá por este mismo correo en un plazo de 1-2 días laborables.
    </div>
    <p>Gracias por contactar con nosotros.</p>
  `);
  await sendMail({ to, subject, html });
}

// 8. Bienvenida a empleado/admin recién creado → destinatario: empleado (email)
async function sendBienvenidaEmpleado({ to, nombre, password, adminUrl, rol }) {
  const esAdmin = rol === 'admin';
  const subject = esAdmin
    ? 'Acceso de administrador creado — BlueArc Ingeniería'
    : 'Bienvenido al equipo — BlueArc Ingeniería';
  const html = baseLayout(`
    <h2>${esAdmin ? 'Cuenta de administrador creada' : 'Bienvenido/a al sistema de gestión'}</h2>
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Se ha creado tu cuenta${esAdmin ? ' con permisos de <strong>administrador</strong>' : ''} en el <strong>Panel de Gestión</strong> de BlueArc Ingeniería.</p>
    <div class="highlight">
      <strong>Email de acceso:</strong> ${to}<br/>
      <strong>Contraseña temporal:</strong> <span style="font-size:1.1rem;letter-spacing:0.08em;">${password}</span>
    </div>
    <p>Por seguridad, te recomendamos cambiar la contraseña desde tu perfil tras el primer acceso.</p>
    ${adminUrl ? `<a class="btn" href="${adminUrl}">Acceder al panel</a>` : ''}
  `);
  await sendMail({ to, subject, html });
}

module.exports = {
  sendMail,
  sendPasswordReset,
  sendNuevoPresupuesto,
  sendPresupuestoAceptado,
  sendPresupuestoRechazado,
  sendProyectoCompletado,
  sendBienvenidaPortal,
  sendConfirmacionContacto,
  sendBienvenidaEmpleado
};
