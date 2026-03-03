# Actualizar Lifetime a $4.99 (Stripe Live)

Esta guía crea un precio **Lifetime one-time de $4.99** en Stripe y actualiza el entorno para usarlo en producción.

## 1) Requisitos

- Cuenta Stripe con permisos de escritura.
- `STRIPE_SECRET_KEY` live disponible localmente.
- Node.js instalado.

## 2) Crear el nuevo Price Lifetime

Desde la raíz del proyecto:

```bash
node scripts/create-lifetime-price.js
```

El script imprimirá:

- `Product ID`
- `Price ID`
- la variable a actualizar:
  - `STRIPE_PRICE_ID_LIFETIME=price_...`

## 3) Actualizar variable en Vercel (producción)

Actualiza **solo** esta variable:

- `STRIPE_PRICE_ID_LIFETIME`

No borres ni cambies:

- `STRIPE_PRICE_ID_MONTHLY` (se mantiene en Stripe, pero no se usa en el sitio).

## 4) Redeploy

Haz redeploy para que API routes tomen el nuevo `Price ID`.

## 5) Verificación rápida

1. Abre `https://www.superfocus.live/pricing`.
2. Confirma que los CTAs visibles apunten a Lifetime.
3. Inicia checkout y valida en Stripe Checkout:
   - monto `USD $4.99`
   - tipo one-time payment
4. Completa una compra de prueba controlada y verifica:
   - webhook procesado
   - usuario marcado como `paymentType: lifetime`.

## 6) Rollback rápido

Si algo sale mal:

1. Restaurar `STRIPE_PRICE_ID_LIFETIME` al `price_...` anterior en Vercel.
2. Redeploy.
3. Validar nuevamente checkout.
