# 🚀 Instrucciones para Actualizar Trial en Stripe

## ⚠️ Situación Actual

El código ya está **100% actualizado** para usar trial de 1 mes en lugar de 3 meses.

**Falta solo 1 paso**: Actualizar el producto en Stripe y obtener el nuevo Price ID.

---

## 📋 Opción 1: Actualizar Manualmente en Stripe Dashboard (Recomendado)

### Paso 1: Ir a Stripe Dashboard

1. Ve a: https://dashboard.stripe.com/products
2. Busca el producto **"Superfocus Premium"**
3. Click en el producto

### Paso 2: Crear Nuevo Precio con Trial de 30 Días

1. En la sección de "Pricing", click **"Add another price"**
2. Configura el nuevo precio:
   - **Price**: $3.99
   - **Billing period**: Monthly
   - **Free trial**: ✅ Activar
   - **Trial period**: **30 days** (cambiar de 90 a 30)
3. Click **"Add price"**

### Paso 3: Copiar el Nuevo Price ID

1. Una vez creado, verás el nuevo precio en la lista
2. Click en el precio para ver los detalles
3. Copia el **Price ID** (empieza con `price_...`)
4. Ejemplo: `price_1XYZ123IMJUHQfsp7ABC456`

### Paso 4: Archivar el Precio Anterior

1. Vuelve a la lista de precios del producto
2. Encuentra el precio con trial de 90 días
3. Click en "..." (tres puntos)
4. Click **"Archive"**
5. Confirma

### Paso 5: Actualizar en Vercel

1. Ve a: https://vercel.com/[tu-usuario]/[tu-proyecto]/settings/environment-variables
2. Busca: `STRIPE_PRICE_ID`
3. Click "Edit"
4. Pega el nuevo Price ID
5. Click "Save"

### Paso 6: Redeploy

```bash
git add .
git commit -m "Update trial period from 3 months to 1 month"
git push origin main
```

---

## 📋 Opción 2: Usar el Script Automatizado

Si prefieres usar el script que creamos, necesitas:

### Requisitos:
- Tu Stripe Secret Key (empieza con `sk_live_...`)
- Acceso a terminal

### Ejecutar:

```bash
cd /Users/juliojimenez/Timer

# Opción A: Exportar la variable y ejecutar
export STRIPE_SECRET_KEY="sk_live_TU_KEY_AQUI"
node scripts/update-trial-to-1-month.js

# Opción B: Pasarla inline
STRIPE_SECRET_KEY="sk_live_TU_KEY_AQUI" node scripts/update-trial-to-1-month.js
```

El script:
1. ✅ Encuentra tu producto Premium
2. ✅ Crea nuevo precio con trial de 30 días
3. ✅ Archiva el precio anterior
4. ✅ Te da el nuevo Price ID para actualizar

---

## ✅ Verificación Final

### 1. Verificar Stripe Dashboard
- [ ] Nuevo precio tiene trial_period_days: 30
- [ ] Precio anterior está archivado
- [ ] Precio nuevo está activo

### 2. Verificar Pricing Page
- [ ] Ve a: https://superfocus.live/pricing
- [ ] Confirma que dice "Try 1 month for $0"

### 3. Probar Checkout
- [ ] Abre ventana de incógnito
- [ ] Inicia checkout desde pricing page
- [ ] Verifica que Stripe muestre "1 month free trial"
- [ ] **NO completes el checkout** (a menos que quieras)

---

## 📊 Resumen de Cambios Completados

### ✅ En el Código (Ya hecho):
- [x] Pricing page actualizada
- [x] APIs actualizadas (create-checkout-session, webhook)
- [x] Email templates actualizados
- [x] Scripts de Stripe actualizados
- [x] Documentación actualizada

### ⏳ Pendiente:
- [ ] Crear nuevo precio en Stripe con trial de 30 días
- [ ] Actualizar STRIPE_PRICE_ID en Vercel
- [ ] Redeploy

---

## 🎯 Price IDs Actuales (Referencia)

Según tu configuración actual:

```
STRIPE_PRICE_ID="price_1SPRSwIMJUHQfsp7IY9rZ0W4"  # Premium (trial 90 días) ← ESTE hay que reemplazar
STRIPE_PRICE_ID_LIFETIME="price_1SQpDlIMJUHQfsp7Yz061FXA"  # Lifetime (no cambiar)
STRIPE_PRICE_ID_MONTHLY="price_1SQpDlIMJUHQfsp78xbkktpJ"  # Monthly (no cambiar)
```

Solo necesitas reemplazar `STRIPE_PRICE_ID` con el nuevo que tenga trial de 30 días.

---

## 💡 Recomendación

**Usa la Opción 1 (Manual en Dashboard)** porque:
- ✅ Más visual y fácil de entender
- ✅ No requiere credenciales en terminal
- ✅ Puedes verificar todo en tiempo real
- ✅ Toma solo 5 minutos

---

## 🆘 Si Necesitas Ayuda

1. **No encuentras el producto en Stripe:**
   - Busca por "Superfocus" o "Premium"
   - Verifica que estés en el ambiente correcto (Live vs Test)

2. **No sabes cuál precio tiene 90 días:**
   - Click en cada precio
   - Busca "Free trial: 90 days"

3. **El nuevo precio no aparece en checkout:**
   - Verifica que actualizaste `STRIPE_PRICE_ID` en Vercel
   - Asegúrate de haber redeployado
   - Limpia caché del navegador

---

**Fecha**: Enero 5, 2026  
**Cambio**: Trial de 90 días (3 meses) → 30 días (1 mes)  
**Precio**: $3.99/mes (sin cambios)

