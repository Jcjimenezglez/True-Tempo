# ⚡ Configuración Rápida de Cloudflare - Prevenir Errores

## 🎯 Objetivo

Prevenir que los usuarios vean el error:
> **"Please unblock challenges.cloudflare.com to proceed"**

## ✅ Pasos Rápidos (5 minutos)

### 1. Ajustar Security Level
1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Selecciona el dominio: **accounts.superfocus.live**
3. Ve a **Security** → **Settings**
4. Cambia **Security Level** de "High" a **"Medium"**
5. Guarda los cambios

### 2. Crear Page Rule para Autenticación
1. Ve a **Rules** → **Page Rules**
2. Click **"Create Page Rule"**
3. **URL Pattern**: `accounts.superfocus.live/sign-in*`
4. **Settings**:
   - Security Level: **Medium**
   - Cache Level: **Bypass**
5. Click **"Save and Deploy"**

Repite para:
- `accounts.superfocus.live/sign-up*`
- `accounts.superfocus.live/callback*`

### 3. Ajustar Challenge Passage
1. Ve a **Security** → **Settings**
2. En **Challenge Passage**, configura:
   - **Challenge Passage Time**: **30 minutos**
3. Guarda

### 4. Verificar Rate Limiting
1. Ve a **Security** → **WAF** → **Rate limiting rules**
2. Asegúrate de que las reglas no sean demasiado restrictivas
3. Para rutas de autenticación, permite al menos **10-20 requests/minuto por IP**

## ✅ Verificación

Después de aplicar estos cambios:
1. Espera 1-2 minutos para que los cambios se propaguen
2. Prueba el login desde un navegador con bloqueador de anuncios activo
3. No deberías ver el error de Cloudflare

## 📋 Configuración Recomendada Completa

Para una configuración más detallada, consulta [CLOUDFLARE_CONFIG.md](./CLOUDFLARE_CONFIG.md)

## ⚠️ Notas Importantes

- **No desactives completamente la seguridad**: Solo ajústala a "Medium"
- **Monitorea los logs**: Revisa si hay ataques reales después de cambiar la configuración
- **Considera Cloudflare Access**: Para usuarios premium, puedes usar Access para bypass completo

## 🔧 Si el Problema Persiste

1. Verifica que los cambios se hayan aplicado (puede tomar 1-2 minutos)
2. Limpia la caché del navegador
3. Prueba desde modo incógnito
4. Revisa los logs de Cloudflare en **Analytics** → **Security**



