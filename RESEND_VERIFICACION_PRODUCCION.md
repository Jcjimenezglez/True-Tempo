# 🔍 Verificación de Resend en Producción

## ✅ Estado del Código
- ✅ Código subido a producción (commits: `867a621`, `f8d3d12`)
- ✅ Endpoints implementados:
  - `/api/triggers/on-signup` - Se llama desde `script.js` cuando usuario se registra
  - `/api/triggers/on-checkout-abandoned` - Se llama desde `pricing/index.html` cuando se cancela checkout
  - `/api/cron/process-scheduled-emails` - Cron job cada hora para emails programados
  - `/api/stripe-webhook` - Envía email de bienvenida cuando se completa suscripción

## ⚠️ Configuraciones Pendientes

### 1. Variables de Entorno en Vercel (CRÍTICO)

Ve a **Vercel Dashboard** → Tu Proyecto → **Settings** → **Environment Variables**

Agregar/Verificar estas variables en **Production**, **Preview** y **Development**:

```
RESEND_API_KEY=re_QCe6cbmi_Jg9UofdiDBQsdinUgKAyqUb5
RESEND_FROM_EMAIL=noreply@updates.superfocus.live
CRON_SECRET=[genera un secreto aleatorio, ej: openssl rand -hex 32]
```

**⚠️ IMPORTANTE**: 
- Después de agregar las variables, **redeploy** el proyecto en Vercel
- El `CRON_SECRET` debe ser el mismo que uses en la configuración del cron job en Vercel

### 2. Configurar DNS en Cloudflare (CRÍTICO)

Sigue la guía completa en `RESEND_DNS_QUICK_SETUP.md`:

1. Ve a [Resend Dashboard](https://resend.com/domains) → `updates.superfocus.live`
2. Copia los 3 registros DNS:
   - **DKIM** (TXT): `resend._domainkey.updates`
   - **SPF MX** (MX): `send.updates`
   - **SPF TXT** (TXT): `send.updates`
3. Agrégalos en **Cloudflare Dashboard** → `superfocus.live` → **DNS** → **Records**
4. **IMPORTANTE**: Proxy debe estar **OFF** (nube gris, NO naranja)
5. Espera 5-15 minutos
6. Verifica en Resend que todos estén en estado "Verified" (verde)

### 3. Configurar Cron Job en Vercel

El cron job está configurado en `vercel.json`, pero necesitas:

1. Ve a **Vercel Dashboard** → Tu Proyecto → **Settings** → **Cron Jobs**
2. Verifica que el cron job esté activo:
   - **Path**: `/api/cron/process-scheduled-emails`
   - **Schedule**: `0 * * * *` (cada hora)
   - **Authorization**: Usa el mismo `CRON_SECRET` que configuraste arriba

### 4. Verificar Dominio en Resend

1. Ve a [Resend Dashboard](https://resend.com/domains)
2. Verifica que `updates.superfocus.live` esté:
   - ✅ Agregado como dominio
   - ✅ Todos los registros DNS en "Verified" (verde)
   - ✅ Estado general: "Verified"

## 🧪 Cómo Probar

### Test 1: Email de Signup (Inmediato)
1. Crea una cuenta nueva en tu app
2. Revisa los logs de Vercel en **Deployments** → **Functions** → `/api/triggers/on-signup`
3. Deberías ver: `✅ Email sent successfully: [email-id]`
4. Revisa tu bandeja de entrada (y spam)

### Test 2: Email de Checkout Abandonado
1. Ve a `/pricing`
2. Inicia checkout y cancélalo (o agrega `?canceled=1` a la URL)
3. Revisa logs en `/api/triggers/on-checkout-abandoned`
4. El email se programará para 1 hora después

### Test 3: Cron Job (Emails Programados)
1. Espera a que se ejecute el cron (cada hora en el minuto 0)
2. O llama manualmente desde terminal:
   ```bash
   curl -X GET "https://www.superfocus.live/api/cron/process-scheduled-emails" \
     -H "Authorization: Bearer [TU_CRON_SECRET]"
   ```
3. Revisa los logs para ver cuántos emails se enviaron

### Test 4: Email de Suscripción
1. Completa un checkout de Stripe
2. Revisa logs en `/api/stripe-webhook`
3. Deberías ver: `✅ Subscription welcome email sent to: [email]`

## 🔍 Debugging

### Verificar Configuración Rápida

**Endpoint de test creado**: Visita esta URL para verificar si las variables están configuradas:
```
https://www.superfocus.live/api/test-resend-config
```

Esto te mostrará:
- ✅ Si `RESEND_API_KEY` está configurado
- ✅ Si `RESEND_FROM_EMAIL` está configurado
- ✅ Qué variables faltan (si hay alguna)

### Si los emails NO se envían:

1. **Verifica configuración primero**:
   - Visita: `https://www.superfocus.live/api/test-resend-config`
   - Si falta alguna variable, agrégalas en Vercel y redeploy

2. **Revisa logs de Vercel**:
   - Ve a **Vercel Dashboard** → Tu Proyecto → **Deployments**
   - Selecciona el deployment más reciente
   - Click en **Functions** → Busca los endpoints:
     - `/api/triggers/on-signup`
     - `/api/triggers/on-checkout-abandoned`
     - `/api/email/send-email`
   - Busca errores como:
     - `⚠️ RESEND_API_KEY not configured`
     - `❌ Resend error: [error]`
     - `✅ Email sent successfully` (si funciona)

2. **Verifica variables de entorno**:
   - En Vercel Dashboard → **Settings** → **Environment Variables**
   - Asegúrate de que estén en **Production**
   - Verifica que los valores sean correctos (sin espacios extra)

3. **Verifica DNS**:
   - En Resend Dashboard, verifica que todos los registros estén "Verified"
   - En Cloudflare, verifica que los registros existan y tengan Proxy OFF

4. **Verifica dominio en Resend**:
   - El dominio debe estar completamente verificado
   - Si no está verificado, Resend rechazará los emails

### Errores Comunes:

- **"Email service not configured"**: `RESEND_API_KEY` no está configurado
- **"Unauthorized"** en cron job: `CRON_SECRET` no coincide o no está configurado
- **Emails no llegan**: DNS no configurados o dominio no verificado en Resend
- **Emails van a spam**: DNS no configurados correctamente (SPF/DKIM)

## 📊 Monitoreo

Para ver si los emails se están enviando:

1. **Resend Dashboard** → **Emails**: Ver todos los emails enviados
2. **Vercel Logs**: Revisar logs de las funciones
3. **Clerk Metadata**: Los usuarios tienen `scheduledEmails` en su `publicMetadata`

## ✅ Checklist Final

- [ ] Variables de entorno configuradas en Vercel (Production, Preview, Development)
- [ ] Proyecto redeployado en Vercel después de agregar variables
- [ ] DNS configurados en Cloudflare (3 registros con Proxy OFF)
- [ ] DNS verificados en Resend Dashboard (todos en verde)
- [ ] Dominio `updates.superfocus.live` verificado en Resend
- [ ] Cron job configurado en Vercel con `CRON_SECRET`
- [ ] Probado signup y verificado que se envía email
- [ ] Revisado logs de Vercel para confirmar que no hay errores

