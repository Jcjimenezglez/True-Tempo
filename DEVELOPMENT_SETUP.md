# 🛠️ Development Environment Setup

## **Configuración para Probar Pagos sin Usar Tarjeta Real**

### **1. Configurar Stripe en Modo Test**

#### **A. Obtener las claves de test:**
1. Ve a [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copia las claves de **Test Mode**:
   - `STRIPE_SECRET_KEY` (empieza con `sk_test_`)
   - `STRIPE_PUBLISHABLE_KEY` (empieza con `pk_test_`)

#### **B. Crear un producto de test:**
1. Ve a [Products](https://dashboard.stripe.com/test/products)
2. Crea un producto "Superfocus Pro" con precio $9/mes
3. Copia el `STRIPE_PRICE_ID` (empieza con `price_`)

#### **C. Configurar webhook de desarrollo:**
1. Ve a [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Agrega endpoint: `http://localhost:3000/api/stripe-webhook`
3. Selecciona eventos: `checkout.session.completed`, `customer.subscription.*`
4. Copia el `STRIPE_WEBHOOK_SECRET` (empieza con `whsec_`)

### **2. Configurar Clerk en Modo Test**

#### **A. Obtener las claves de desarrollo:**
1. Ve a [Clerk Dashboard](https://dashboard.clerk.com/)
2. Selecciona tu aplicación
3. Ve a "API Keys" en la sidebar
4. Copia las claves de **Development**:
   - `CLERK_PUBLISHABLE_KEY` (empieza con `pk_test_`)
   - `CLERK_SECRET_KEY` (empieza con `sk_test_`)

### **3. Crear archivo de variables de entorno**

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Stripe Test Mode
STRIPE_SECRET_KEY=sk_test_51ABC123...
STRIPE_PRICE_ID=price_1ABC123...
STRIPE_WEBHOOK_SECRET=whsec_ABC123...

# Clerk Development
CLERK_PUBLISHABLE_KEY=pk_test_ABC123...
CLERK_SECRET_KEY=sk_test_ABC123...

# Development URLs
STRIPE_SUCCESS_URL=http://localhost:3000?premium=1&payment=success&session_id={CHECKOUT_SESSION_ID}
STRIPE_CANCEL_URL=http://localhost:3000
STRIPE_RETURN_URL=http://localhost:3000
```

### **4. Instalar dependencias y ejecutar**

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
# o
vercel dev
```

### **5. Tarjetas de Test de Stripe**

Usa estas tarjetas para probar sin cobrar dinero real:

#### **✅ Pagos exitosos:**
- `4242 4242 4242 4242` - Visa exitosa
- `4000 0566 5566 5556` - Visa con 3D Secure
- `5555 5555 5555 4444` - Mastercard exitosa

#### **❌ Pagos fallidos:**
- `4000 0000 0000 0002` - Tarjeta rechazada
- `4000 0000 0000 9995` - Fondos insuficientes

#### **📱 Apple Pay / Google Pay:**
- Usa cualquier tarjeta de test en tu dispositivo
- No se cobrará dinero real

### **6. Verificar que funciona**

1. **Abre** `http://localhost:3000`
2. **Haz login** con tu cuenta
3. **Click** en "Upgrade to Pro"
4. **Usa** una tarjeta de test
5. **Verifica** que te redirige correctamente
6. **Confirma** que tu cuenta muestra Pro status

### **7. Logs de desarrollo**

Para ver los logs de Stripe y Clerk:
```bash
# En otra terminal
vercel logs --follow
```

## **🚀 Deploy a Staging**

Para probar en un entorno más realista:

```bash
# Deploy a branch de desarrollo
git checkout -b develop
git push origin develop

# En Vercel, crea un proyecto para el branch develop
# Configura las variables de entorno de test
```

## **⚠️ Importante**

- **NUNCA** uses claves de producción en desarrollo
- **SIEMPRE** usa tarjetas de test de Stripe
- **VERIFICA** que las URLs de webhook apunten a localhost en desarrollo
- **TESTEA** todos los flujos antes de deployar a producción
