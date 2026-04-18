const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.EMAIL_FROM_ADDRESS || 'bluearc.ingenieria@gmail.com';
const SENDER_NAME  = process.env.EMAIL_FROM_NAME    || 'BlueArc Ingeniería';

const emailEnabled = () => !!BREVO_API_KEY;

async function sendMail({ to, subject, html }) {
  if (!emailEnabled()) {
    console.log(`[EMAIL DESACTIVADO] Para: ${to} | Asunto: ${subject}`);
    return;
  }
  if (!to) return;
  try {
    const replyTo = process.env.EMAIL_REPLY_TO;
    const body = {
      sender:      { name: SENDER_NAME, email: SENDER_EMAIL },
      to:          [{ email: to }],
      subject,
      htmlContent: html,
      ...(replyTo && { replyTo: { email: replyTo } })
    };
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method:  'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      console.error(`[EMAIL ERROR] No se pudo enviar a ${to}:`, data.message || res.status);
    } else {
      console.log(`[EMAIL] Enviado a ${to}: ${subject} (messageId: ${data.messageId})`);
    }
  } catch (err) {
    console.error(`[EMAIL ERROR] No se pudo enviar a ${to}:`, err.message);
  }
}

// ─── Templates ───────────────────────────────────────────────────────────────

const EMAIL_THEMES = {
  default: {
    bodyBg: '#f4f6f8',
    headerBg: '#1B3A4B',
    headerTitle: '#4DB6A8',
    headerSubtitle: 'rgba(255,255,255,0.65)',
    titleColor: '#1B3A4B',
    textColor: '#2c3e50',
    highlightBg: '#f0faf9',
    highlightBorder: '#4DB6A8',
    highlightStrong: '#1B3A4B',
    buttonBg: '#4DB6A8',
    buttonText: '#ffffff',
    footerBg: '#f8f9fa',
    footerText: '#95a5a6',
    portalLabel: 'Sistema de Gestión de Proyectos'
  },
  cliente: {
    bodyBg: '#f2fbfa',
    headerBg: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
    headerTitle: '#ffffff',
    headerSubtitle: 'rgba(255,255,255,0.82)',
    titleColor: '#0F766E',
    textColor: '#24434a',
    highlightBg: '#ecfeff',
    highlightBorder: '#0D9488',
    highlightStrong: '#0F766E',
    buttonBg: '#1B3A4B',
    buttonText: '#ffffff',
    footerBg: '#eff8f7',
    footerText: '#5f7f85',
    portalLabel: 'Portal de Clientes'
  },
  empleado: {
    bodyBg: '#f4f6f8',
    headerBg: 'linear-gradient(135deg, #0A0F1A 0%, #1B3A4B 100%)',
    headerTitle: '#4DB6A8',
    headerSubtitle: 'rgba(255,255,255,0.7)',
    titleColor: '#1B3A4B',
    textColor: '#2c3e50',
    highlightBg: '#eef6f9',
    highlightBorder: '#4DB6A8',
    highlightStrong: '#1B3A4B',
    buttonBg: '#4DB6A8',
    buttonText: '#0A0F1A',
    footerBg: '#f8f9fa',
    footerText: '#95a5a6',
    portalLabel: 'Panel de Gestión'
  }
};

function baseLayout(contenido, themeName = 'default') {
  const theme = EMAIL_THEMES[themeName] || EMAIL_THEMES.default;
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { margin: 0; padding: 0; background: ${theme.bodyBg}; font-family: 'Segoe UI', Arial, sans-serif; }
      .wrapper { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
      .header { background: ${theme.headerBg}; padding: 28px 32px; }
      .header h1 { margin: 0; color: ${theme.headerTitle}; font-size: 1.4rem; font-weight: 700; letter-spacing: 0.03em; }
      .header p  { margin: 4px 0 0; color: ${theme.headerSubtitle}; font-size: 0.82rem; }
      .body { padding: 28px 32px; color: ${theme.textColor}; line-height: 1.6; }
      .body h2 { margin: 0 0 12px; font-size: 1.1rem; color: ${theme.titleColor}; }
      .body p  { margin: 0 0 12px; font-size: 0.95rem; }
      .highlight { background: ${theme.highlightBg}; border-left: 4px solid ${theme.highlightBorder}; border-radius: 6px; padding: 14px 18px; margin: 16px 0; font-size: 1rem; }
      .highlight strong { color: ${theme.highlightStrong}; }
      .btn { display: inline-block; background: ${theme.buttonBg}; color: ${theme.buttonText} !important; text-decoration: none; padding: 11px 24px; border-radius: 8px; font-weight: 700; font-size: 0.92rem; margin-top: 8px; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
      .badge-success { background: #d4edda; color: #155724; }
      .badge-warning { background: #fff3cd; color: #856404; }
      .badge-danger  { background: #f8d7da; color: #721c24; }
      .portal-pill { display: inline-block; margin-top: 12px; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,0.14); color: #ffffff; font-size: 0.76rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
      .footer { background: ${theme.footerBg}; padding: 16px 32px; text-align: center; font-size: 0.78rem; color: ${theme.footerText}; border-top: 1px solid #eee; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <h1>BlueArc Ingeniería</h1>
        <p>Sistema de Gestión de Proyectos</p>
        <span class="portal-pill">${themeName === 'cliente' ? 'Portal de Clientes' : themeName === 'empleado' ? 'Panel de Gestión' : 'Sistema de Gestión de Proyectos'}</span>
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
  `, 'empleado');
  await sendMail({ to, subject, html });
}

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
  `, 'cliente');
  await sendMail({ to, subject, html });
}

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

async function sendProyectoCompletado({ to, nombreEmpresa, nombreProyecto, portalUrl }) {
  const subject = `Tu proyecto ha finalizado — ${nombreProyecto}`;
  const html = baseLayout(`
    <h2>¡Proyecto completado!</h2>
    <p>Hola <strong>${nombreEmpresa}</strong>,</p>
    <p>Nos complace informarte de que tu proyecto <strong>${nombreProyecto}</strong> ha sido marcado como <span class="badge badge-success">completado</span>.</p>
    <p>Puedes acceder a tu portal para consultar los documentos finales y el histórico del proyecto:</p>
    ${portalUrl ? `<a class="btn" href="${portalUrl}">Ver proyecto</a>` : ''}
    <p style="margin-top:16px;">Gracias por confiar en BlueArc Ingeniería.</p>
  `, 'cliente');
  await sendMail({ to, subject, html });
}

async function sendBienvenidaPortal({ to, nombreEmpresa, emailLogin, password, portalUrl }) {
  const subject = 'Bienvenido al Portal de Clientes — BlueArc Ingeniería';
  const html = baseLayout(`
    <h2>Bienvenido al portal de clientes</h2>
    <p>Hola <strong>${nombreEmpresa}</strong>,</p>
    <p>Ya tienes activo tu acceso al <strong>Portal de Clientes</strong> de BlueArc Ingeniería.</p>
    <p>Desde este espacio podrás seguir el avance de tus proyectos, revisar presupuestos, consultar documentos compartidos y mantener la comunicación con nuestro equipo.</p>
    <div class="highlight">
      <strong>Email de acceso:</strong> ${emailLogin}<br/>
      <strong>Contraseña temporal:</strong> <span style="letter-spacing:0.08em;">${password}</span>
    </div>
    <p>Te recomendamos cambiar la contraseña desde tu perfil en cuanto completes el primer acceso.</p>
    ${portalUrl ? `<a class="btn" href="${portalUrl}">Acceder al portal</a>` : ''}
  `, 'cliente');
  await sendMail({ to, subject, html });
}

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
  `, 'cliente');
  await sendMail({ to, subject, html });
}

async function sendBienvenidaEmpleado({ to, emailLogin, nombre, password, adminUrl, rol }) {
  const esAdmin = rol === 'admin';
  const subject = esAdmin
    ? 'Acceso de administrador creado — BlueArc Ingeniería'
    : 'Bienvenido al equipo — BlueArc Ingeniería';
  const html = baseLayout(`
    <h2>${esAdmin ? 'Cuenta de administrador creada' : 'Bienvenido/a al sistema de gestión'}</h2>
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Se ha creado tu cuenta${esAdmin ? ' con permisos de <strong>administrador</strong>' : ''} en el <strong>Panel de Gestión</strong> de BlueArc Ingeniería.</p>
    <p>${esAdmin ? 'Desde el panel podrás coordinar equipos, supervisar proyectos, validar presupuestos y gestionar la operativa interna.' : 'Desde el panel podrás consultar tus proyectos asignados, registrar avances, acceder a documentación y colaborar con el resto del equipo.'}</p>
    <div class="highlight">
      <strong>Email de acceso:</strong> ${emailLogin}<br/>
      <strong>Contraseña temporal:</strong> <span style="font-size:1.1rem;letter-spacing:0.08em;">${password}</span>
    </div>
    <p>Por seguridad, cambia la contraseña desde tu perfil después de iniciar sesión por primera vez.</p>
    ${adminUrl ? `<a class="btn" href="${adminUrl}">Acceder al panel</a>` : ''}
  `, 'empleado');
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
