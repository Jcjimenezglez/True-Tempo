# 📱 Pasos Simples para Configurar Notificaciones

## 🎯 ¿Qué vamos a hacer?

Configurar notificaciones push en tu móvil para que te llegue un mensaje cada vez que alguien se suscribe al trial de Premium.

---

## 📋 PASO 1: Instalar la App en tu Móvil

### Si tienes iPhone:
1. Abre la App Store
2. Busca "ntfy"
3. Instala la app (es gratis, se llama "ntfy")

### Si tienes Android:
1. Abre Google Play Store
2. Busca "ntfy"
3. Instala la app (es gratis, se llama "ntfy")

✅ **Listo cuando**: Tienes la app instalada en tu móvil

---

## 📋 PASO 2: Elegir un Nombre para tu Canal

Piensa en un nombre único para tu canal. Ejemplos:
- `superfocus-trials`
- `julio-trials`
- `superfocus-2024`

**Reglas**:
- Solo letras, números y guiones
- Sin espacios
- Debe ser único (nadie más lo use)

✅ **Listo cuando**: Tienes un nombre elegido (ej: `superfocus-trials`)

---

## 📋 PASO 3: Suscribirte al Canal en la App

1. Abre la app "ntfy" en tu móvil
2. Verás un campo que dice "Subscribe to topic" o "Suscribirse a tema"
3. Escribe el nombre que elegiste (ej: `superfocus-trials`)
4. Presiona "Subscribe" o "Suscribirse"

✅ **Listo cuando**: Ves el canal en la app y dice "Subscribed" o "Suscrito"

---

## 📋 PASO 4: (Opcional) Proteger con Contraseña

**¿Por qué?** Para que solo tú veas las notificaciones.

1. En la app de ntfy, en el canal que creaste
2. Busca la opción de contraseña o "Set password"
3. Elige una contraseña (ej: `miPassword123`)
4. Guárdala, la necesitarás después

✅ **Listo cuando**: Tienes una contraseña elegida (o decides no usarla)

---

## 📋 PASO 5: Agregar Variables en Vercel

1. Ve a [vercel.com](https://vercel.com) y entra a tu cuenta
2. Selecciona tu proyecto "Timer" o "Superfocus"
3. Ve a **Settings** (Configuración)
4. Click en **Environment Variables** (Variables de Entorno)
5. Click en **Add New** (Agregar Nueva)

### Agregar primera variable:
- **Name**: `NTFY_TOPIC`
- **Value**: El nombre que elegiste (ej: `superfocus-trials`)
- Selecciona **Production** (y Preview/Development si quieres)
- Click **Save**

### Agregar segunda variable (si pusiste contraseña):
- **Name**: `NTFY_PASSWORD`
- **Value**: La contraseña que elegiste (ej: `miPassword123`)
- Selecciona **Production** (y Preview/Development si quieres)
- Click **Save**

✅ **Listo cuando**: Ves las 2 variables en la lista (o solo `NTFY_TOPIC` si no usas contraseña)

---

## 📋 PASO 6: Hacer Redeploy

1. En Vercel, ve a la pestaña **Deployments**
2. Click en los 3 puntos (⋯) del último deployment
3. Click en **Redeploy**
4. Espera a que termine (1-2 minutos)

✅ **Listo cuando**: El deployment está completo y dice "Ready"

---

## 📋 PASO 7: Probar que Funciona

### Opción A: Probar desde tu computadora (rápido)

Abre la terminal y ejecuta:

```bash
curl -d "Mensaje de prueba desde Superfocus" \
     -H "Title: 🎉 Test" \
     -H "Priority: high" \
     https://ntfy.sh/superfocus-trials
```

(Reemplaza `superfocus-trials` con el nombre que elegiste)

**Deberías ver**: Una notificación en tu móvil inmediatamente

### Opción B: Probar con una suscripción real

1. Ve a tu sitio web
2. Haz una suscripción de prueba
3. Completa el checkout de Stripe
4. **Deberías recibir**: Una notificación en tu móvil en menos de 5 segundos

✅ **Listo cuando**: Recibes la notificación en tu móvil

---

## ✅ Checklist Final

- [ ] App "ntfy" instalada en mi móvil
- [ ] Elegí un nombre para el canal (ej: `superfocus-trials`)
- [ ] Me suscribí al canal en la app
- [ ] (Opcional) Configuré contraseña
- [ ] Agregué `NTFY_TOPIC` en Vercel
- [ ] (Opcional) Agregué `NTFY_PASSWORD` en Vercel
- [ ] Hice redeploy en Vercel
- [ ] Probé y recibí la notificación

---

## 🆘 Si algo no funciona

### No recibo notificaciones:
1. Verifica que estés suscrito al canal en la app (debe aparecer en la lista)
2. Verifica que el nombre del canal en Vercel sea exactamente igual al de la app
3. Verifica que hiciste redeploy después de agregar las variables

### Error en Vercel:
1. Ve a **Logs** en Vercel
2. Busca mensajes que digan "ntfy" o "notification"
3. Si dice "NTFY_TOPIC not configured", verifica que agregaste la variable

### La app no se conecta:
1. Verifica tu conexión a internet
2. Cierra y abre la app de nuevo
3. Verifica que el nombre del canal no tenga espacios ni caracteres raros

---

## 📞 Resumen Ultra Rápido

1. **Instala app "ntfy"** en tu móvil
2. **Elige nombre** (ej: `superfocus-trials`)
3. **Suscríbete** al canal en la app
4. **Agrega** `NTFY_TOPIC=superfocus-trials` en Vercel
5. **Redeploy** en Vercel
6. **Prueba** con curl o suscripción real

¡Listo! 🎉

