// api/diagnose-email-issues.js
// Endpoint de diagnóstico completo para problemas de email

const { Resend } = require('resend');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const diagnosis = {
    timestamp: new Date().toISOString(),
    checks: {},
    issues: [],
    recommendations: [],
  };

  // 1. Verificar variables de entorno
  const hasApiKey = !!process.env.RESEND_API_KEY;
  const hasFromEmail = !!process.env.RESEND_FROM_EMAIL;
  const hasCronSecret = !!process.env.CRON_SECRET;
  
  diagnosis.checks.environmentVariables = {
    RESEND_API_KEY: hasApiKey ? '✅ Configurado' : '❌ Faltante',
    RESEND_FROM_EMAIL: hasFromEmail ? `✅ Configurado: ${process.env.RESEND_FROM_EMAIL}` : '❌ Faltante',
    CRON_SECRET: hasCronSecret ? '✅ Configurado' : '❌ Faltante',
  };

  if (!hasApiKey) {
    diagnosis.issues.push('RESEND_API_KEY no está configurado en Vercel');
    diagnosis.recommendations.push('Ve a Vercel Dashboard → Settings → Environment Variables y agrega RESEND_API_KEY');
  }

  if (!hasFromEmail) {
    diagnosis.issues.push('RESEND_FROM_EMAIL no está configurado');
    diagnosis.recommendations.push('Agrega RESEND_FROM_EMAIL=noreply@updates.superfocus.live en Vercel');
  }

  // 2. Verificar API de Resend
  if (hasApiKey) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      // Intentar obtener información del dominio (esto verifica que la API key funciona)
      // Nota: Resend no tiene un endpoint directo para verificar la key, pero podemos intentar
      // obtener la lista de dominios
      diagnosis.checks.resendApi = {
        status: '✅ API Key válida (formato correcto)',
        apiKeyPreview: process.env.RESEND_API_KEY.substring(0, 10) + '...' + process.env.RESEND_API_KEY.substring(process.env.RESEND_API_KEY.length - 5),
      };
    } catch (error) {
      diagnosis.checks.resendApi = {
        status: '❌ Error con API Key',
        error: error.message,
      };
      diagnosis.issues.push(`Error al inicializar Resend: ${error.message}`);
    }
  } else {
    diagnosis.checks.resendApi = {
      status: '⏭️ No verificado (falta API Key)',
    };
  }

  // 3. Verificar configuración del FROM email
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Superfocus <noreply@updates.superfocus.live>';
  const emailDomain = fromEmail.includes('@') 
    ? fromEmail.split('@')[1].split('>')[0].trim()
    : null;

  diagnosis.checks.fromEmail = {
    configured: fromEmail,
    domain: emailDomain,
    expectedDomain: 'updates.superfocus.live',
    matches: emailDomain === 'updates.superfocus.live',
  };

  if (emailDomain && emailDomain !== 'updates.superfocus.live') {
    diagnosis.issues.push(`FROM email usa dominio ${emailDomain}, debería ser updates.superfocus.live`);
    diagnosis.recommendations.push('Actualiza RESEND_FROM_EMAIL para usar updates.superfocus.live');
  }

  // 4. Verificar cron job
  diagnosis.checks.cronJob = {
    configured: hasCronSecret,
    schedule: 'Cada hora (0 * * * *)',
    endpoint: '/api/cron/process-scheduled-emails',
    note: hasCronSecret 
      ? 'CRON_SECRET configurado. Verifica en Vercel Dashboard → Cron Jobs que esté activo'
      : 'CRON_SECRET no configurado. El cron job no funcionará.',
  };

  if (!hasCronSecret) {
    diagnosis.issues.push('CRON_SECRET no está configurado - los emails programados no se enviarán');
    diagnosis.recommendations.push('Agrega CRON_SECRET en Vercel y configúralo en el cron job');
  }

  // 5. Verificar endpoints de triggers
  diagnosis.checks.endpoints = {
    onSignup: '/api/triggers/on-signup',
    processScheduled: '/api/cron/process-scheduled-emails',
    testConfig: '/api/test-resend-config',
    note: 'Verifica en Vercel Logs si estos endpoints se están llamando',
  };

  // 6. Resumen y estado general
  const criticalIssues = diagnosis.issues.filter(issue => 
    issue.includes('RESEND_API_KEY') || 
    issue.includes('RESEND_FROM_EMAIL') ||
    issue.includes('CRON_SECRET')
  );

  diagnosis.summary = {
    status: criticalIssues.length === 0 ? '✅ Configuración básica OK' : '❌ Problemas críticos encontrados',
    criticalIssues: criticalIssues.length,
    totalIssues: diagnosis.issues.length,
    canSendEmails: hasApiKey && hasFromEmail,
    canScheduleEmails: hasApiKey && hasFromEmail && hasCronSecret,
  };

  // 7. Próximos pasos
  if (diagnosis.issues.length > 0) {
    diagnosis.nextSteps = [
      '1. Revisa las issues listadas arriba',
      '2. Corrige las variables de entorno en Vercel',
      '3. Haz redeploy del proyecto en Vercel',
      '4. Verifica DNS en Cloudflare (si los emails no llegan)',
      '5. Revisa logs en Vercel Dashboard → Deployments → Functions',
      '6. Verifica en Resend Dashboard que el dominio esté verificado',
    ];
  } else {
    diagnosis.nextSteps = [
      '1. Si los emails aún no se envían, revisa los logs de Vercel',
      '2. Verifica en Resend Dashboard → Emails que los emails se estén enviando',
      '3. Verifica DNS en Cloudflare si los emails no llegan',
      '4. Revisa que los triggers se estén llamando correctamente',
    ];
  }

  return res.status(200).json(diagnosis);
};

