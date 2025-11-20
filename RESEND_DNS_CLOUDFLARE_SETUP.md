# Resend DNS Configuration - Cloudflare Setup

## 🎯 Dominio: `updates.superfocus.live`

Esta guía te ayudará a configurar los registros DNS necesarios en Cloudflare para que Resend pueda enviar correos desde `updates.superfocus.live`.

## 📋 Registros DNS Requeridos

### 1. **DKIM (DomainKeys Identified Mail)** - REQUERIDO
**Propósito**: Verifica que los emails provienen de tu dominio

**Tipo**: TXT  
**Nombre**: `resend._domainkey.updates` (o el que Resend te indique)  
**Contenido**: (Obtener de Resend Dashboard)

**Pasos en Cloudflare:**
1. Ve a Cloudflare Dashboard → Selecciona `superfocus.live`
2. Ve a **DNS** → **Records**
3. Click **Add record**
4. Tipo: **TXT**
5. Name: `resend._domainkey.updates` (o el nombre exacto que Resend te dé)
6. Content: (Pega el valor completo de Resend)
7. TTL: **Auto** (o 3600)
8. Proxy status: **DNS only** (nube gris, NO naranja)
9. Click **Save**

### 2. **SPF (Sender Policy Framework)** - REQUERIDO
**Propósito**: Autoriza a Resend a enviar emails desde tu dominio

#### 2a. Registro MX (para SPF)
**Tipo**: MX  
**Nombre**: `send.updates`  
**Priority**: 10  
**Target**: (Obtener de Resend Dashboard, algo como `feedback-smtp.resend.com`)

**Pasos en Cloudflare:**
1. Click **Add record**
2. Tipo: **MX**
3. Name: `send.updates`
4. Priority: `10`
5. Target: (Valor de Resend, ejemplo: `feedback-smtp.resend.com`)
6. TTL: **Auto**
7. Proxy status: **DNS only** (nube gris)
8. Click **Save**

#### 2b. Registro TXT (para SPF)
**Tipo**: TXT  
**Nombre**: `send.updates`  
**Contenido**: `v=spf1 include:resend.com ~all` (o el valor exacto de Resend)

**Pasos en Cloudflare:**
1. Click **Add record**
2. Tipo: **TXT**
3. Name: `send.updates`
4. Content: `v=spf1 include:resend.com ~all` (o el valor exacto de Resend)
5. TTL: **Auto**
6. Proxy status: **DNS only** (nube gris)
7. Click **Save**

### 3. **DMARC (Domain-based Message Authentication)** - OPCIONAL
**Propósito**: Política de autenticación de emails

**Tipo**: TXT  
**Nombre**: `_dmarc`  
**Contenido**: `v=DMARC1; p=none;` (ya configurado según la imagen)

**Nota**: Ya está configurado, no necesitas cambiarlo.

### 4. **MX (Mail Exchange)** - OPCIONAL (solo si quieres recibir emails)
**Propósito**: Permite recibir correos en el dominio

**Tipo**: MX  
**Nombre**: `updates`  
**Priority**: 10  
**Target**: (Obtener de Resend Dashboard)

**Nota**: Solo necesario si habilitas "Enable Receiving" en Resend.

## 🔍 Cómo Obtener los Valores Exactos de Resend

1. Ve a [Resend Dashboard](https://resend.com/domains)
2. Selecciona el dominio `updates.superfocus.live`
3. En la sección **DNS Records**, verás todos los registros necesarios con sus valores exactos
4. Copia cada valor y pégalo en Cloudflare

## ⚠️ Puntos Importantes

### Proxy Status (CRÍTICO)
- **SIEMPRE** usa **DNS only** (nube gris) para registros de email
- **NUNCA** uses **Proxied** (nube naranja) para registros MX, TXT de email
- Los registros de email NO funcionan con proxy de Cloudflare

### Propagación DNS
- Los cambios DNS pueden tardar **5 minutos a 48 horas** en propagarse
- Cloudflare generalmente propaga en **5-15 minutos**
- Resend verificará automáticamente cuando los registros estén activos

### Verificación en Resend
1. Después de agregar los registros en Cloudflare
2. Ve a Resend Dashboard → Domains → `updates.superfocus.live`
3. Click **Verify** o espera a que Resend verifique automáticamente
4. Los estados cambiarán de "Failed" a "Verified" cuando estén correctos

## 📝 Checklist de Configuración

- [ ] DKIM TXT agregado en Cloudflare
- [ ] SPF MX agregado en Cloudflare
- [ ] SPF TXT agregado en Cloudflare
- [ ] Todos los registros con **DNS only** (nube gris)
- [ ] Esperar 5-15 minutos para propagación
- [ ] Verificar en Resend Dashboard que los estados cambien a "Verified"
- [ ] Probar envío de email de prueba

## 🧪 Probar el Envío

Una vez que todos los registros estén verificados:

1. Ve a Resend Dashboard → Domains
2. Verifica que el estado del dominio sea "Verified" (verde)
3. Envía un email de prueba desde tu aplicación
4. Verifica que llegue correctamente

## 🚨 Troubleshooting

### Los registros siguen en "Failed"
- Verifica que los valores estén copiados exactamente (sin espacios extra)
- Verifica que el nombre del registro sea correcto (case-sensitive)
- Asegúrate de que los registros estén en **DNS only** (nube gris)
- Espera más tiempo para la propagación DNS

### Emails no se envían
- Verifica que `RESEND_FROM_EMAIL` en Vercel sea `noreply@updates.superfocus.live` (o el email correcto)
- Verifica que `RESEND_API_KEY` esté configurado correctamente
- Revisa los logs de Vercel para ver errores

### Verificación lenta
- Usa herramientas como [MXToolbox](https://mxtoolbox.com/) para verificar propagación DNS
- Verifica que los registros estén visibles públicamente

