# 🚀 Vercel Staging Environment Setup

## **Configuración de Entorno de Staging para Probar Pagos**

### **1. Crear Proyecto de Staging en Vercel**

#### **A. Opción 1: Desde Vercel Dashboard**
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en "New Project"
3. Importa tu repositorio de GitHub
4. En "Framework Preset" selecciona "Other"
5. En "Root Directory" deja vacío
6. En "Build Command" deja vacío
7. En "Output Directory" deja vacío
8. Click "Deploy"

#### **B. Opción 2: Desde CLI**
```bash
# En el branch develop
npm run deploy-staging
```

### **2. Configurar Variables de Entorno en Vercel**

#### **A. Ve a tu proyecto en Vercel Dashboard**
1. Click en tu proyecto de staging
2. Ve a "Settings" → "Environment Variables"
3. Agrega estas variables:

```bash
# Stripe Test Mode (IMPORTANTE: usa claves de TEST)
STRIPE_SECRET_KEY=sk_test_51ABC123...
STRIPE_PRICE_ID=price_1ABC123...
STRIPE_WEBHOOK_SECRET=whsec_ABC123...

# Clerk Development
CLERK_PUBLISHABLE_KEY=pk_test_ABC123...
CLERK_SECRET_KEY=sk_test_ABC123...

# URLs de Staging (reemplaza YOUR_STAGING_URL)
STRIPE_SUCCESS_URL=https://YOUR_STAGING_URL.vercel.app?premium=1&payment=success
STRIPE_CANCEL_URL=https://YOUR_STAGING_URL.vercel.app
STRIPE_RETURN_URL=https://YOUR_STAGING_URL.vercel.app
```

### **3. Configurar Webhook de Stripe para Staging**

#### **A. En Stripe Dashboard:**
1. Ve a [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. URL: `https://YOUR_STAGING_URL.vercel.app/api/stripe-webhook`
4. Selecciona eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copia el "Signing secret" y agrégalo como `STRIPE_WEBHOOK_SECRET`

### **4. Configurar Clerk para Staging**

#### **A. En Clerk Dashboard:**
1. Ve a [Clerk Dashboard](https://dashboard.clerk.com/)
2. Selecciona tu aplicación
3. Ve a "Domains"
4. Agrega tu dominio de staging: `YOUR_STAGING_URL.vercel.app`
5. Configura las URLs:
   - **Sign-in URL:** `https://YOUR_STAGING_URL.vercel.app`
   - **Sign-up URL:** `https://YOUR_STAGING_URL.vercel.app`
   - **After sign-in URL:** `https://YOUR_STAGING_URL.vercel.app`
   - **After sign-up URL:** `https://YOUR_STAGING_URL.vercel.app`

### **5. Probar el Flujo Completo**

#### **A. Tarjetas de Test de Stripe:**
```bash
# Pagos exitosos
4242 4242 4242 4242 - Visa
5555 5555 5555 4444 - Mastercard
4000 0566 5566 5556 - Visa con 3D Secure

# Pagos fallidos
4000 0000 0000 0002 - Tarjeta rechazada
4000 0000 0000 9995 - Fondos insuficientes
```

#### **B. Flujo de Prueba:**
1. **Abre** tu URL de staging
2. **Regístrate** con una cuenta de test
3. **Haz login** con tu cuenta
4. **Click** en "Upgrade to Pro"
5. **Usa** una tarjeta de test
6. **Verifica** que funciona correctamente

### **6. Comandos Útiles**

```bash
# Deploy a staging
npm run deploy-staging

# Ver logs de staging
vercel logs --follow

# Cambiar a branch develop
git checkout develop

# Hacer cambios y deploy
git add .
git commit -m "Test changes"
git push origin develop
npm run deploy-staging
```

### **7. URLs de Ejemplo**

Si tu proyecto se llama `superfocus-staging`, tu URL será:
- **Staging:** `https://superfocus-staging.vercel.app`
- **Webhook:** `https://superfocus-staging.vercel.app/api/stripe-webhook`

### **8. Verificación Final**

#### **✅ Checklist:**
- [ ] Proyecto creado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Webhook de Stripe configurado
- [ ] Clerk configurado para staging
- [ ] Prueba de pago exitosa
- [ ] Usuario marcado como Pro
- [ ] Redirección funciona correctamente

## **🚨 IMPORTANTE**

- **USA SIEMPRE** claves de TEST en staging
- **NUNCA** uses claves de producción en staging
- **TESTEA** todos los flujos antes de mergear a main
- **VERIFICA** que los webhooks funcionen correctamente

## **🔄 Workflow Recomendado**

1. **Desarrollo** → Branch `develop`
2. **Testing** → Staging en Vercel
3. **Producción** → Branch `main` → `www.superfocus.live`
