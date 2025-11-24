# 🔧 Troubleshooting: Emails No Se Envían

## 🚨 Diagnóstico Rápido

**Paso 1**: Visita el endpoint de diagnóstico:
```
https://www.superfocus.live/api/diagnose-email-issues
```

Este endpoint te mostrará:
- ✅ Qué variables de entorno están configuradas
- ❌ Qué problemas hay
- 📋 Recomendaciones específicas

## 🔍 Posibles Causas (Orden de Probabilidad)

### 1. **Variables de Entorno No Configuradas o Incorrectas** ⚠️ MÁS COMÚN

**Síntomas:**
- No se envían emails desde hace X días
- Logs muestran: `⚠️ RESEND_API_KEY not configured`
- Logs muestran: `Email service not configured`

**Solución:**
1. Ve a **Vercel Dashboard** → Tu Proyecto → **Settings** → **Environment Variables**
2. Verifica que estas variables estén en **Production**:
   ```
   RESEND_API_KEY=re_QCe6cbmi_Jg9UofdiDBQsdinUgKAyqUb5
   RESEND_FROM_EMAIL=noreply@updates.superfocus.live
   CRON_SECRET=[tu secreto]
   ```
3. **IMPORTANTE**: Después de agregar/modificar variables, haz **redeploy** del proyecto
4. Verifica que las variables estén sin espacios extra al inicio/final

**Cómo verificar:**
- Visita: `https://www.superfocus.live/api/test-resend-config`
- Debe mostrar: `✅ Configurado`

---

### 2. **DNS No Configurados o No Verificados** ⚠️ MUY COMÚN

**Síntomas:**
- Los emails se "envían" pero no llegan
- Resend rechaza los emails
- Errores en logs sobre dominio no verificado

**Solución:**
1. Ve a [Resend Dashboard](https://resend.com/domains) → `updates.superfocus.live`
2. Verifica que los 3 registros DNS estén en estado **"Verified"** (verde):
   - DKIM (TXT)
   - SPF MX (MX)
   - SPF TXT (TXT)
3. Si no están verificados:
   - Ve a **Cloudflare Dashboard** → `superfocus.live` → **DNS**
   - Agrega los 3 registros que Resend te muestra
   - **IMPORTANTE**: Proxy debe estar **OFF** (nube gris, NO naranja)
   - Espera 5-15 minutos
   - Verifica en Resend que estén "Verified"

**Guía completa**: Ver `RESEND_DNS_QUICK_SETUP.md`

---

### 3. **Cron Job No Está Funcionando** ⚠️ COMÚN

**Síntomas:**
- Emails inmediatos funcionan (signup welcome)
- Emails programados NO se envían (follow-ups, abandoned checkout)

**Solución:**
1. Ve a **Vercel Dashboard** → Tu Proyecto → **Settings** → **Cron Jobs**
2. Verifica que el cron job esté activo:
   - Path: `/api/cron/process-scheduled-emails`
   - Schedule: `0 * * * *` (cada hora)
3. Verifica que `CRON_SECRET` esté configurado en:
   - Variables de entorno de Vercel
   - Configuración del cron job en Vercel (deben coincidir)
4. Revisa logs del cron job en **Vercel Dashboard** → **Deployments** → **Functions** → `/api/cron/process-scheduled-emails`

**Cómo probar manualmente:**
```bash
curl -X GET "https://www.superfocus.live/api/cron/process-scheduled-emails" \
  -H "Authorization: Bearer [TU_CRON_SECRET]"
```

---

### 4. **Triggers No Se Están Llamando** ⚠️ MENOS COMÚN

**Síntomas:**
- No se envían emails de signup welcome
- No se envían emails de checkout abandoned

**Solución:**
1. Revisa que los triggers se llamen desde el frontend:
   - **Signup**: `script.js` línea ~13135 debe llamar a `/api/triggers/on-signup`
   - **Checkout abandoned**: `pricing/index.html` línea ~2240 debe llamar a `/api/triggers/on-checkout-abandoned`
2. Revisa logs en **Vercel Dashboard** → **Deployments** → **Functions**:
   - `/api/triggers/on-signup`
   - `/api/triggers/on-checkout-abandoned`
3. Busca errores en los logs

**Cómo verificar:**
- Abre la consola del navegador cuando un usuario se registra
- Debe mostrar llamadas a los endpoints de triggers
- Revisa la pestaña Network en DevTools

---

### 5. **API Key de Resend Expirada o Inválida** ⚠️ RARO

**Síntomas:**
- Variables configuradas correctamente
- Errores de autenticación en logs
- Resend rechaza las peticiones

**Solución:**
1. Ve a [Resend Dashboard](https://resend.com/api-keys)
2. Verifica que la API key esté activa
3. Si es necesario, genera una nueva API key
4. Actualiza `RESEND_API_KEY` en Vercel
5. Haz redeploy

---

### 6. **Dominio No Verificado en Resend** ⚠️ RARO

**Síntomas:**
- Variables configuradas
- DNS configurados
- Pero Resend rechaza los emails

**Solución:**
1. Ve a [Resend Dashboard](https://resend.com/domains)
2. Verifica que `updates.superfocus.live` esté completamente verificado
3. Todos los registros DNS deben estar en verde
4. Si no está verificado, sigue la guía en `RESEND_DNS_QUICK_SETUP.md`

---

## 📊 Checklist de Diagnóstico

Usa este checklist para identificar el problema:

- [ ] **Paso 1**: Visita `/api/diagnose-email-issues` y revisa el reporte
- [ ] **Paso 2**: Verifica variables de entorno en Vercel (Production)
- [ ] **Paso 3**: Verifica que el proyecto esté redeployado después de cambios
- [ ] **Paso 4**: Verifica DNS en Cloudflare (3 registros con Proxy OFF)
- [ ] **Paso 5**: Verifica DNS en Resend (todos en "Verified")
- [ ] **Paso 6**: Verifica cron job en Vercel (activo y configurado)
- [ ] **Paso 7**: Revisa logs en Vercel Dashboard → Deployments → Functions
- [ ] **Paso 8**: Verifica en Resend Dashboard → Emails que los emails se estén enviando

---

## 🔍 Cómo Revisar Logs en Vercel

1. Ve a **Vercel Dashboard** → Tu Proyecto
2. Click en **Deployments**
3. Selecciona el deployment más reciente
4. Click en **Functions**
5. Busca estos endpoints:
   - `/api/email/send-email`
   - `/api/triggers/on-signup`
   - `/api/triggers/on-checkout-abandoned`
   - `/api/cron/process-scheduled-emails`
6. Revisa los logs buscando:
   - `✅ Email sent successfully` (funciona)
   - `❌ Resend error` (error)
   - `⚠️ RESEND_API_KEY not configured` (falta variable)

---

## 🧪 Pruebas Rápidas

### Test 1: Configuración
```bash
curl https://www.superfocus.live/api/test-resend-config
```
Debe mostrar: `✅ Configurado`

### Test 2: Diagnóstico Completo
```bash
curl https://www.superfocus.live/api/diagnose-email-issues
```
Muestra diagnóstico completo

### Test 3: Verificar Variables (desde código)
Revisa que `send-email.js` tenga acceso a las variables:
- Abre logs de cualquier función que use `sendEmail`
- Busca mensajes de error sobre variables faltantes

---

## 📞 Si Nada Funciona

1. **Revisa Resend Dashboard**:
   - Ve a [Resend Dashboard](https://resend.com/emails)
   - Verifica si los emails se están enviando pero no llegan (problema de DNS)
   - O si no se están enviando (problema de código/configuración)

2. **Revisa Vercel Logs**:
   - Busca errores específicos
   - Copia los mensajes de error completos

3. **Verifica el código**:
   - Asegúrate de que los triggers se llamen correctamente
   - Verifica que `send-email.js` esté funcionando

4. **Contacta soporte**:
   - Si todo está configurado pero no funciona, puede ser un problema con Resend
   - Contacta a Resend support con los logs de error

---

## ✅ Estado Esperado Cuando Todo Funciona

- ✅ Variables de entorno configuradas en Vercel
- ✅ DNS verificados en Resend (todos en verde)
- ✅ Cron job activo en Vercel
- ✅ Logs muestran `✅ Email sent successfully`
- ✅ Emails aparecen en Resend Dashboard → Emails
- ✅ Emails llegan a los destinatarios

---

## 📝 Notas Importantes

1. **Después de cambiar variables de entorno**: SIEMPRE haz redeploy en Vercel
2. **DNS**: Los registros DNS pueden tardar hasta 48 horas en propagarse (normalmente 5-15 minutos)
3. **Cron Job**: Se ejecuta cada hora, los emails programados pueden tardar hasta 1 hora en enviarse
4. **Rate Limits**: Resend tiene límites de envío, verifica en el dashboard si los alcanzaste

