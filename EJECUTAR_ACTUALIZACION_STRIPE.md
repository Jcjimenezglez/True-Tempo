# 🚀 Cómo Actualizar el Trial en Stripe (PASO A PASO)

## ⚠️ IMPORTANTE: Lee esto primero

Este cambio **NO afectará** a usuarios que ya tienen un trial activo de 3 meses.  
Solo afectará a **nuevos usuarios** que se suscriban después de esta actualización.

---

## 📋 Requisitos Previos

1. ✅ Tener acceso a tu cuenta de Stripe
2. ✅ Tener las credenciales de Stripe en tu `.env` local
3. ✅ Node.js instalado

---

## 🎯 Paso 1: Verificar Variables de Entorno

Asegúrate de tener en tu archivo `.env`:

```bash
STRIPE_SECRET_KEY=sk_live_...  # Tu Stripe Secret Key
STRIPE_PRICE_ID=price_...      # Tu Price ID actual (con trial de 90 días)
```

---

## 🎯 Paso 2: Ejecutar el Script de Actualización

```bash
# Navega al directorio del proyecto
cd /Users/juliojimenez/Timer

# Ejecuta el script
node scripts/update-trial-to-1-month.js
```

### ¿Qué hace este script?

1. 🔍 Busca tu producto "Superfocus Premium" en Stripe
2. 📋 Lista todos los precios activos
3. 🔧 Crea un nuevo precio con trial de 30 días (1 mes)
4. 🗄️ Archiva el precio anterior (90 días)
5. 📝 Te da el nuevo `PRICE_ID` para actualizar

### Ejemplo de Output:

```
✅ Producto encontrado: Superfocus Premium
   ID: prod_xxxxx

💰 Precio ID: price_xxxxx
   Cantidad: $3.99
   Recurrencia: month
   Trial actual: 90 días

🔧 Actualizando trial de 90 días a 30 días...
✅ Nuevo precio creado con trial de 30 días:
   Nuevo Price ID: price_NEW_ID_HERE
   Trial period: 30 días

📝 ACCIÓN REQUERIDA:
   1. Actualiza STRIPE_PRICE_ID en tus variables de entorno:
      STRIPE_PRICE_ID=price_NEW_ID_HERE
```

---

## 🎯 Paso 3: Actualizar Variables de Entorno en Vercel

### Opción A: Desde Vercel Dashboard (Recomendado)

1. Ve a: https://vercel.com/[tu-usuario]/[tu-proyecto]/settings/environment-variables
2. Busca la variable: `STRIPE_PRICE_ID`
3. Click en "Edit"
4. Pega el nuevo Price ID que te dio el script
5. Click "Save"

### Opción B: Desde CLI de Vercel

```bash
# Instala Vercel CLI si no lo tienes
npm i -g vercel

# Login
vercel login

# Actualiza la variable
vercel env add STRIPE_PRICE_ID
# Pega el nuevo Price ID cuando te lo pida
# Selecciona: Production, Preview, Development (todos)
```

---

## 🎯 Paso 4: Actualizar .env Local (Opcional pero recomendado)

```bash
# Edita tu archivo .env
nano .env

# Actualiza la línea:
STRIPE_PRICE_ID=price_NEW_ID_HERE

# Guarda (Ctrl+O, Enter, Ctrl+X)
```

---

## 🎯 Paso 5: Redeploy en Vercel

### Opción A: Desde Vercel Dashboard

1. Ve a: https://vercel.com/[tu-usuario]/[tu-proyecto]
2. Click en la pestaña "Deployments"
3. Click en el deployment más reciente
4. Click en "..." (tres puntos)
5. Click "Redeploy"
6. Confirma

### Opción B: Hacer Push a Git

```bash
# Commit los cambios (ya están hechos)
git add .
git commit -m "Update trial period from 3 months to 1 month"
git push origin main

# Vercel detectará el push y redeployará automáticamente
```

---

## ✅ Paso 6: Verificación

### 1. Verificar Stripe Dashboard

1. Ve a: https://dashboard.stripe.com/products
2. Busca "Superfocus Premium"
3. Verifica que el precio activo tenga:
   - ✅ Trial period: 30 days
   - ✅ Amount: $3.99/month
4. Verifica que el precio anterior (90 days) esté archivado

### 2. Verificar Pricing Page

1. Ve a: https://superfocus.live/pricing
2. Verifica que diga: **"Try 1 month for $0"**
3. Verifica el texto: **"$0 for 1 month, then $3.99 per month after"**

### 3. Probar Checkout (IMPORTANTE)

1. Abre una ventana de incógnito
2. Ve a: https://superfocus.live/pricing
3. Click en "Try 1 month for $0"
4. En la página de Stripe Checkout, verifica:
   - ✅ Dice "1 month free trial"
   - ✅ Muestra "$0.00 today"
   - ✅ Muestra "$3.99/month after trial"

**NO COMPLETES EL CHECKOUT** (a menos que quieras crear una suscripción de prueba)

### 4. Verificar Logs

```bash
# Si estás en desarrollo local
npm run dev

# Inicia un checkout y verifica en la consola:
# Debería decir: "✅ Premium trial configured: 30 days free trial"
```

---

## 🔄 Rollback (Si algo sale mal)

### Si necesitas volver al trial de 3 meses:

1. **En Stripe Dashboard:**
   - Ve a Products → Superfocus Premium
   - Reactiva el precio anterior (90 days)
   - Archiva el precio nuevo (30 days)

2. **En Vercel:**
   - Actualiza `STRIPE_PRICE_ID` con el Price ID anterior
   - Redeploy

3. **En el código:**
   ```bash
   git revert HEAD
   git push origin main
   ```

---

## 📊 Monitoreo Post-Actualización

### Primeras 24 horas:

- [ ] Verificar que nuevos usuarios vean "1 month free"
- [ ] Confirmar que checkouts se completen correctamente
- [ ] Revisar emails que se envían (deben decir "1 month")
- [ ] Monitorear Stripe Dashboard para nuevas suscripciones

### Primera semana:

- [ ] Comparar tasa de conversión vs. semana anterior
- [ ] Revisar feedback de usuarios
- [ ] Verificar que trials expiren correctamente a los 30 días

---

## 📞 Soporte

Si algo no funciona:

1. **Revisa los logs de Vercel:**
   - https://vercel.com/[tu-proyecto]/logs

2. **Revisa Stripe Dashboard:**
   - https://dashboard.stripe.com/logs

3. **Revisa este archivo:**
   - `/Users/juliojimenez/Timer/TRIAL_UPDATE_SUMMARY.md`

---

## ✅ Checklist Final

Antes de considerar la actualización completa:

- [ ] Script ejecutado exitosamente
- [ ] Nuevo Price ID obtenido
- [ ] Variables de entorno actualizadas en Vercel
- [ ] Aplicación redeployada
- [ ] Pricing page muestra "1 month"
- [ ] Checkout de prueba realizado
- [ ] Stripe Dashboard verificado
- [ ] Emails de prueba verificados

---

**¡Listo!** 🎉

Una vez completados todos los pasos, tu aplicación estará usando el trial de 1 mes en lugar de 3 meses.

**Fecha de creación**: Enero 5, 2026  
**Última actualización**: Enero 5, 2026

