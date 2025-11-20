# Email Scheduling Solution - Vercel Cron Jobs

## 🎯 Problema Resuelto

El problema con `setTimeout` en Vercel serverless functions es que las funciones se terminan antes de que el timeout se ejecute. Esto hace que los emails programados nunca se envíen.

## ✅ Solución Implementada

### 1. **Clerk Metadata para Scheduling**
- Cuando un usuario se registra o abandona el checkout, guardamos las fechas de envío en `user.publicMetadata.scheduledEmails`
- Esto persiste la información de scheduling de forma confiable

### 2. **Vercel Cron Job**
- Un cron job se ejecuta cada hora (`0 * * * *`)
- El endpoint `/api/cron/process-scheduled-emails` revisa todos los usuarios
- Envía los emails que están programados para ese momento o antes
- Marca los emails como enviados en Clerk metadata

### 3. **Archivos Creados/Modificados**

#### Nuevos:
- `api/cron/process-scheduled-emails.js` - Endpoint que procesa emails programados

#### Modificados:
- `api/triggers/on-signup.js` - Ahora guarda scheduling en Clerk metadata
- `api/triggers/on-checkout-abandoned.js` - Ahora guarda scheduling en Clerk metadata
- `vercel.json` - Agregado cron job configuration

## 🔧 Configuración Requerida

### 1. **Variable de Entorno en Vercel**
Agregar en Vercel Dashboard → Project Settings → Environment Variables:

```
CRON_SECRET=GENERATE_NEW_SECRET_IN_VERCEL
```

**Importante**: 
- Genera una clave secreta fuerte y única en Vercel Dashboard
- Puedes usar: `openssl rand -hex 32` o cualquier generador de secrets
- El cron job verifica esta clave para seguridad
- **NO** commitees esta clave al repositorio

### 2. **Estructura de Metadata en Clerk**

Los emails programados se guardan así en `user.publicMetadata.scheduledEmails`:

```json
{
  "scheduledEmails": {
    "signupFollowUp1": 1234567890000,  // timestamp
    "signupFollowUp1Sent": false,
    "signupFollowUp2": 1234567890000,
    "signupFollowUp2Sent": false,
    "checkoutAbandoned1": 1234567890000,
    "checkoutAbandoned1Sent": false,
    "checkoutAbandoned2": 1234567890000,
    "checkoutAbandoned2Sent": false,
    "checkoutAbandoned3": 1234567890000,
    "checkoutAbandoned3Sent": false
  }
}
```

## 📅 Timing de Emails

### Signup Sequence:
- **Welcome**: Inmediato (se envía en `on-signup.js`)
- **Follow-up 1**: 24 horas después del signup
- **Follow-up 2**: 3 días después del signup

### Checkout Abandoned Sequence:
- **Email 1**: 1 hora después de abandonar checkout
- **Email 2**: 24 horas después
- **Email 3**: 3 días después

## 🚀 Cómo Funciona

1. **Usuario se registra** → `on-signup.js` se llama
2. **Se envía welcome email** inmediatamente
3. **Se guarda en Clerk metadata** las fechas de los follow-ups
4. **Cron job se ejecuta cada hora** → Revisa todos los usuarios
5. **Si un email está programado y no se ha enviado** → Se envía y se marca como enviado

## 🔒 Seguridad

El endpoint del cron job verifica el header `Authorization: Bearer {CRON_SECRET}` para asegurar que solo Vercel puede llamarlo.

## 📊 Monitoreo

El endpoint retorna estadísticas:
```json
{
  "success": true,
  "processed": 50,
  "sent": 3,
  "errors": 0,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## ⚠️ Limitaciones Actuales

- El cron job procesa hasta 100 usuarios por ejecución (límite de Clerk API)
- Para escalar, necesitarías implementar paginación o procesar en batches

## 🔄 Mejoras Futuras

1. **Paginación**: Procesar todos los usuarios en batches
2. **Rate Limiting**: Respetar límites de Resend API
3. **Retry Logic**: Reintentar emails fallidos
4. **Logging**: Mejor tracking de emails enviados/fallidos

