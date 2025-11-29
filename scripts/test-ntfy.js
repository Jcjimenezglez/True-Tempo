// Script para probar notificaciones de ntfy.sh
// Uso: node scripts/test-ntfy.js

const topic = process.env.NTFY_TOPIC || 'superfocus-trials';
const password = process.env.NTFY_PASSWORD;

async function testNtfy() {
  console.log('🧪 Probando notificación de ntfy.sh...\n');
  console.log(`📡 Topic: ${topic}`);
  console.log(`🔒 Password: ${password ? 'Configurada' : 'No configurada'}\n`);

  const headers = {
    'Content-Type': 'text/plain',
    'Title': 'Test de Notificacion',
    'Priority': 'high',
    'Tags': 'test,superfocus'
  };

  // Agregar autenticación si hay contraseña
  if (password) {
    const auth = Buffer.from(`:${password}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  const message = `👤 Usuario: Usuario de Prueba
📧 Email: test@example.com
📦 Plan: Premium (90 días trial)
📅 Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'America/New_York' })}

💰 Trial gratuito activado

✅ Si recibes esta notificación, ¡todo está funcionando!`;

  try {
    console.log('📤 Enviando notificación...\n');
    
    const response = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: headers,
      body: message
    });

    if (response.ok) {
      console.log('✅ ¡Notificación enviada exitosamente!');
      console.log(`📱 Revisa tu móvil - deberías recibir la notificación en unos segundos.\n`);
      console.log(`Status: ${response.status}`);
      console.log(`Topic: ${topic}`);
    } else {
      const errorText = await response.text();
      console.error('❌ Error al enviar notificación:');
      console.error(`Status: ${response.status}`);
      console.error(`Error: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error de conexión:');
    console.error(error.message);
  }
}

testNtfy();

