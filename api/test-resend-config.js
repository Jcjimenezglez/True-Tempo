// api/test-resend-config.js
// Endpoint para verificar la configuración de Resend sin enviar emails

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = {
    hasResendApiKey: !!process.env.RESEND_API_KEY,
    hasResendFromEmail: !!process.env.RESEND_FROM_EMAIL,
    resendFromEmail: process.env.RESEND_FROM_EMAIL || 'NOT SET',
    hasCronSecret: !!process.env.CRON_SECRET,
    nodeEnv: process.env.NODE_ENV || 'NOT SET',
    vercelEnv: process.env.VERCEL_ENV || 'NOT SET',
  };

  // No exponer la API key completa por seguridad
  if (config.hasResendApiKey) {
    const apiKey = process.env.RESEND_API_KEY;
    config.resendApiKeyPreview = apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5);
  }

  const status = {
    configured: config.hasResendApiKey && config.hasResendFromEmail,
    missing: [],
  };

  if (!config.hasResendApiKey) {
    status.missing.push('RESEND_API_KEY');
  }
  if (!config.hasResendFromEmail) {
    status.missing.push('RESEND_FROM_EMAIL');
  }

  return res.status(200).json({
    status: status.configured ? '✅ Configurado' : '❌ Faltan variables',
    config,
    status,
    message: status.configured 
      ? 'Resend está configurado correctamente'
      : `Faltan las siguientes variables: ${status.missing.join(', ')}`,
    instructions: status.configured 
      ? 'Las variables están configuradas. Si los emails no se envían, verifica DNS y dominio en Resend.'
      : 'Ve a Vercel Dashboard → Settings → Environment Variables y agrega las variables faltantes.',
  });
};




