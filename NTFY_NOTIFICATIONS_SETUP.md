# 📱 Ntfy.sh Push Notifications Setup - Superfocus

## 🎯 Descripción

Sistema de notificaciones push **gratuito y simple** que te envía notificaciones a tu móvil cuando un usuario se suscribe al trial de Premium (90 días gratis).

**Trigger**: Se activa automáticamente en el webhook de Stripe cuando `checkout.session.completed` se completa y el plan es `premium` (trial).

**Ventajas de ntfy.sh**:
- ✅ **100% Gratis** - Sin costos, sin límites
- ✅ **Súper Simple** - Solo necesitas elegir un nombre de canal
- ✅ **Sin Configuración Compleja** - No necesitas comprar números ni tokens
- ✅ **App Móvil Oficial** - Notificaciones push nativas en iOS y Android
- ✅ **Funciona Inmediatamente** - Sin verificación de números

---

## 📧 Variables de Entorno Requeridas

Agregar las siguientes variables de entorno en **Vercel Dashboard** → **Project Settings** → **Environment Variables**:

### Producción (Production):
```
NTFY_TOPIC=superfocus-sales
NTFY_PASSWORD=tu_password_opcional
```

**⚠️ IMPORTANTE**: 
- `NTFY_TOPIC`: Elige un nombre único para tu canal (ej: `superfocus-sales`, `superfocus-trials`, etc.) — **debe coincidir exactamente con el topic al que estás suscrito en la app móvil**
- `NTFY_PASSWORD`: (Opcional) Contraseña para proteger tu canal. Si no la pones, cualquiera puede ver tus notificaciones
- Después de agregar las variables, haz **redeploy** del proyecto en Vercel

---

## 🔧 Configuración Paso a Paso

### Paso 1: Elegir un Topic (Canal)

1. Elige un nombre único para tu canal (ej: `superfocus-sales`)
   - Debe ser único en todo ntfy.sh
   - Solo letras, números y guiones
   - Recomendación: usa algo como `superfocus-sales` o `tu-nombre-sales`

### Paso 2: Instalar la App Móvil de Ntfy

**Para iOS:**
1. Ve a [App Store](https://apps.apple.com/app/ntfy/id1625396347)
2. Instala la app "ntfy"
3. Abre la app y suscríbete a tu topic: `superfocus-sales` (o el que configuraste en Vercel)

**Para Android:**
1. Ve a [Google Play](https://play.google.com/store/apps/details?id=io.heckel.ntfy)
2. Instala la app "ntfy"
3. Abre la app y suscríbete a tu topic: `superfocus-sales` (o el que configuraste en Vercel)

### Paso 3: (Opcional) Proteger tu Canal con Contraseña

Si quieres que solo tú puedas ver las notificaciones:

1. Ve a [ntfy.sh](https://ntfy.sh)
2. En la sección "Subscribe to topic", escribe tu topic: `superfocus-sales`
3. Click en "🔒 Set password"
4. Elige una contraseña segura
5. Copia la contraseña y úsala como `NTFY_PASSWORD` en Vercel

**⚠️ Nota**: Si no pones contraseña, cualquiera que conozca el nombre del topic puede ver tus notificaciones. Para notificaciones privadas, siempre usa contraseña.

### Paso 4: Agregar Variables en Vercel

1. Ve a **Vercel Dashboard** → Tu Proyecto → **Settings** → **Environment Variables**
2. Agrega estas variables en **Production**:
   ```
   NTFY_TOPIC=superfocus-sales
   NTFY_PASSWORD=tu_password_aqui  # Opcional pero recomendado
   ```
3. **IMPORTANTE**: Haz **redeploy** del proyecto después de agregar las variables

---

## 📋 Formato de la Notificación

Cuando un usuario se suscribe al trial, recibirás una notificación push con:

**Título**: `🎉 Nuevo Trial Suscrito!`

**Mensaje**:
```
👤 Usuario: [Nombre del usuario]
📧 Email: [Email del usuario]
📦 Plan: Premium (90 días trial)
📅 Fecha: [Fecha y hora]

💰 Trial gratuito activado
```

---

## 🧪 Testing

### Probar Manualmente

1. **Probar desde la terminal** (para verificar que funciona):
   ```bash
   curl -d "Mensaje de prueba" \
        -H "Title: 🎉 Test" \
        -H "Priority: high" \
        https://ntfy.sh/superfocus-sales
   ```
   Deberías recibir una notificación en tu móvil inmediatamente.

2. **Probar con una suscripción real**:
   - Haz una suscripción de prueba en tu sitio
   - Completa el checkout de Stripe
   - Deberías recibir una notificación push en menos de 5 segundos

### Verificar Logs

1. Ve a **Vercel Dashboard** → Tu Proyecto → **Logs**
2. Busca mensajes que contengan:
   - `✅ Ntfy notification sent successfully` - Notificación enviada correctamente
   - `⚠️ NTFY_TOPIC not configured` - Variable de entorno faltante
   - `❌ Error sending ntfy notification` - Error al enviar

---

## 💰 Costos

**Completamente GRATIS** - Sin costos, sin límites, sin tarjetas de crédito.

---

## 🔍 Troubleshooting

### ❌ No recibo notificaciones (pero los tests sí funcionan)

**Causa: Topic diferente entre Vercel y la app móvil**

Si los tests (desde `node scripts/test-ntfy.js` o curl) te llegan pero las compras reales no, casi seguro es porque `NTFY_TOPIC` en Vercel no coincide con el topic al que estás suscrito en la app.

- Verifica qué topic tienes en la app móvil (ej: `superfocus-sales`)
- En Vercel → Environment Variables, pon exactamente el mismo: `NTFY_TOPIC=superfocus-sales`
- Haz **redeploy** del proyecto
- Prueba con una compra de prueba

### ❌ No recibo notificaciones

**Causa 1: No estás suscrito al topic en la app móvil**
- Abre la app de ntfy en tu móvil
- Asegúrate de estar suscrito al topic correcto (ej: `superfocus-sales`)
- Verifica que el nombre del topic coincida exactamente con `NTFY_TOPIC`

**Causa 2: Variables de entorno no configuradas**
- Verifica que `NTFY_TOPIC` esté en Vercel
- Asegúrate de hacer redeploy después de agregar variables

**Causa 3: Contraseña incorrecta**
- Si configuraste `NTFY_PASSWORD`, verifica que sea correcta
- La contraseña debe ser la misma que configuraste en ntfy.sh

**Causa 4: Topic con caracteres inválidos**
- El topic solo puede tener letras, números y guiones
- No uses espacios, caracteres especiales o mayúsculas (aunque funcionan, es mejor usar minúsculas)

### ⚠️ Error en logs: "NTFY_TOPIC not configured"

- Verifica que la variable `NTFY_TOPIC` esté en Vercel
- Revisa que no tenga espacios extra al inicio/final
- Haz redeploy del proyecto

### 🔒 Notificaciones públicas (sin contraseña)

Si no configuraste `NTFY_PASSWORD`, cualquiera puede ver tus notificaciones si conoce el nombre del topic. Para privacidad:
1. Elige un topic único y difícil de adivinar (ej: `superfocus-sales-xyz123`)
2. O mejor aún, configura `NTFY_PASSWORD`

---

## 📁 Archivos Modificados

```
api/
  stripe-webhook.js    # Agregada función sendNtfyNotification y lógica para enviar notificaciones en handleCheckoutCompleted
```

---

## ✅ Checklist de Configuración

- [ ] Elegido un nombre único para el topic (ej: `superfocus-sales`)
- [ ] Instalada la app de ntfy en tu móvil (iOS o Android)
- [ ] Suscrito al topic en la app móvil
- [ ] (Opcional) Configurada contraseña en ntfy.sh
- [ ] Variables de entorno agregadas en Vercel:
  - [ ] `NTFY_TOPIC` (obligatorio)
  - [ ] `NTFY_PASSWORD` (opcional pero recomendado)
- [ ] Redeploy del proyecto en Vercel
- [ ] Prueba realizada: suscripción de prueba → notificación recibida

---

## 🚀 Próximos Pasos

1. **Elige un topic único** (ej: `superfocus-sales` o `julio-sales-2024`)
2. **Instala la app de ntfy** en tu móvil
3. **Suscríbete al topic** en la app
4. **Agrega las variables en Vercel**:
   ```
   NTFY_TOPIC=tu-topic-aqui
   NTFY_PASSWORD=tu-password-opcional
   ```
5. **Haz redeploy** del proyecto
6. **Prueba** con una suscripción de prueba

---

## 📞 Recursos

- **Sitio web**: https://ntfy.sh
- **Documentación**: https://docs.ntfy.sh
- **App iOS**: https://apps.apple.com/app/ntfy/id1625396347
- **App Android**: https://play.google.com/store/apps/details?id=io.heckel.ntfy

---

## 💡 Tips

1. **Topic único**: Usa algo como `superfocus-trials-xyz123` para que sea difícil de adivinar
2. **Contraseña**: Siempre configura contraseña para notificaciones privadas
3. **Testing**: Prueba primero con curl antes de hacer una suscripción real
4. **Múltiples dispositivos**: Puedes suscribirte al mismo topic en varios dispositivos

