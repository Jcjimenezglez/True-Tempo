# Email Marketing Setup - Superfocus

## 📧 Variables de Entorno Requeridas

Agregar las siguientes variables de entorno en **Vercel Dashboard** → **Project Settings** → **Environment Variables**:

### Producción (Production):
```
RESEND_API_KEY=re_QCe6cbmi_Jg9UofdiDBQsdinUgKAyqUb5
RESEND_FROM_EMAIL=noreply@superfocus.live
```

### Desarrollo/Staging (si aplica):
```
RESEND_API_KEY=re_QCe6cbmi_Jg9UofdiDBQsdinUgKAyqUb5
RESEND_FROM_EMAIL=noreply@superfocus.live
```

## 🎯 Secuencias de Email Implementadas

### 1. **Signup Sequence** (Usuarios que se registran)
- **Email 1 (Inmediato)**: Welcome email con introducción a Superfocus
- **Email 2 (24 horas después)**: "Your first focus session awaits"
- **Email 3 (3 días después)**: "Unlock unlimited productivity"

**Trigger**: Se activa automáticamente cuando el usuario completa el signup y regresa a la app.

### 2. **Checkout Abandoned Sequence** (Usuarios que abandonan checkout)
- **Email 1 (1 hora después)**: "Did you forget something?"
- **Email 2 (24 horas después)**: "Last chance: 3 months free ends soon"
- **Email 3 (3 días después)**: "A testimonial from Nina"

**Trigger**: Se activa cuando el usuario cancela el checkout de Stripe y regresa a `/pricing?canceled=1`.

### 3. **Subscription Welcome** (Usuarios que se suscriben)
- **Email 1 (Inmediato)**: "Welcome to Premium!" con todos los features

**Trigger**: Se activa automáticamente en el webhook de Stripe cuando `checkout.session.completed` se completa.

## 📁 Archivos Creados

```
api/
  email/
    send-email.js          # Helper para enviar emails con Resend
    templates.js            # Todos los templates de email
  triggers/
    on-signup.js           # Trigger para secuencia de signup
    on-checkout-abandoned.js # Trigger para secuencia de checkout abandonado
```

## 🔧 Configuración de Resend

1. **Crear cuenta en Resend**: https://resend.com
2. **Verificar dominio**: Agregar `superfocus.live` como dominio verificado
3. **Obtener API Key**: Copiar la API key desde el dashboard
4. **Agregar a Vercel**: Agregar las variables de entorno como se muestra arriba

## 📊 Tracking

Todos los emails incluyen tags para tracking:
- `signup_welcome`
- `signup_followup_1`
- `signup_followup_2`
- `checkout_abandoned_1`
- `checkout_abandoned_2`
- `checkout_abandoned_3`
- `subscription_welcome`

## ⚠️ Notas Importantes

1. **Delays con setTimeout**: Los emails programados usan `setTimeout` que funciona en Vercel serverless, pero para producción a gran escala, considera usar un sistema de cola (Bull, AWS SQS, etc.).

2. **Verificación de dominio**: Asegúrate de verificar el dominio en Resend antes de enviar emails en producción.

3. **Rate Limits**: Resend tiene límites de rate. El plan gratuito permite 3,000 emails/mes.

4. **Testing**: Puedes probar los emails localmente usando `vercel dev` y las variables de entorno.

## 🚀 Próximos Pasos

1. Verificar que las variables de entorno estén configuradas en Vercel
2. Verificar el dominio en Resend
3. Probar el flujo completo:
   - Signup → Verificar email de bienvenida
   - Abandonar checkout → Verificar secuencia de emails
   - Completar suscripción → Verificar email de bienvenida Premium

## 👀 Previsualizar Templates

### Opción 1: Página de Preview (Recomendado)
Abre `email-preview.html` en tu navegador o accede a:
```
http://localhost:3000/email-preview.html  (desarrollo)
https://www.superfocus.live/email-preview.html  (producción)
```

Esta página te permite:
- Ver todos los templates en un iframe
- Cambiar el nombre del destinatario
- Ver información sobre cada template
- Previsualizar cómo se verá el email

### Opción 2: Endpoint Directo
Accede directamente al endpoint:
```
/api/email/preview-template?template=welcome&firstName=Julio
```

Templates disponibles:
- `welcome` - Welcome email
- `signup_followup_1` - Signup follow-up 1
- `signup_followup_2` - Signup follow-up 2
- `checkout_abandoned_1` - Checkout abandoned 1
- `checkout_abandoned_2` - Checkout abandoned 2
- `checkout_abandoned_3` - Checkout abandoned 3
- `subscription_welcome` - Subscription welcome

## 📝 Personalización

Los templates están en `api/email/templates.js`. Puedes personalizar:
- Contenido de los emails
- Timing de las secuencias (cambiar delays)
- Diseño HTML/CSS
- Texto plano alternativo

