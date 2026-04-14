# Lead Magnets por Segmento: Guest → Free → Premium → Premium

Actualización del plan Hormozi: los lead magnets y mini offers aplican a **los tres segmentos** del funnel, no solo a tráfico frío.

---

## Visión general del funnel

```
Guest ──(lead magnet)──> Free ──(lead magnet)──> Premium ──(referral)──> más Premium
```

Cada transición usa el mismo principio Hormozi: **valor antes de pedir**, crear deprivation, vender en el punto de mayor necesidad.

---

## 1. Guest → Free (capturar signups)

**Objetivo:** Que guests creen cuenta sin sentir que "les piden algo grande".

**Mini offer (lead magnet):**
- **Free trial (taste):** Sesión de 25 min sin signup (ya existe guest mode)
- Deprivación: "Funcionó — quiero guardar progreso, 2h/día, sync"
- CTA: "Sign up free — takes 10 seconds. Get 2h of focus per day."

**Mejoras concretas:**
- Al terminar primera sesión guest: modal "Want to save your progress and get 2h/day? Sign up free."
- CTA alternativo en hero: "Try 25 min free — no signup" además de "Try 1 month for $0" (para tráfico frío)
- Quiz "What's your focus style?" → resultado + "Get your preset in Superfocus — sign up free"

**Archivos:** [index.html](index.html), [script.js](script.js), posible `/focus-quiz`

---

## 2. Free → Premium (convertir a suscripción)

**Objetivo:** Que free users suban a Premium cuando experimenten el valor, no cuando les "vendemos".

**Mini offer (lead magnet):**
- **Taste de Premium:** Dar un "preview" o trial corto de features Premium
  - Ej: "Try Premium free for 1 month" (ya existe) — pero el lead magnet es lo que les hace *querer* probarlo
- **Reveal a problem:** "See how much focus you're losing" — free focus audit que muestra patrones, luego "Premium te da unlimited + todas las técnicas"
- **One step of many:** Darles Todoist integration para 1 lista como trial → "Premium desbloquea integración completa"
- **Deprivación:** Tras probar Premium (o ver qué les falta), quieren mantenerlo

**Mejoras concretas:**
- Modal daily limit (ya existe): CTA "Upgrade Now" — mejorar copy: "You're on a roll. Get unlimited focus — try 1 month free."
- En Report/Analytics (free): "See your full focus patterns — unlock with Premium"
- Taste de 1 cassette Premium o 1 técnica extra por 24h → luego quitar
- Quiz/assessment: "Your ideal setup needs Flowtime + custom cassettes — try Premium free"

**Archivos:** [script.js](script.js) (daily limit modal, report panel), [pricing/index.html](pricing/index.html)

---

## 3. Premium → Premium (referrals: que Premium traigan más Premium)

**Objetivo:** Que usuarios Premium inviten a otros que acaben siendo Premium.

**Mini offer (para el referidor):**
- "Invite a friend — you both get 1 extra month of Premium"
- "Give a friend 1 month free — when they go Premium, you get X"
- El "lead magnet" para el referidor: beneficio (mes extra, badge, etc.) a cambio de compartir

**Mini offer (para el referido):**
- Mismo que Guest → Free o Free → Premium según si el referido es nuevo o ya free
- Link con `?ref=xxx`: el referido ve mensaje personalizado "Julio te invitó — try 1 month free"

**Mejoras concretas:**
- Programa de referidos: "Invite friends — both get 1 month free" (o similar)
- Share link con tracking (`?ref=user_id`)
- En dashboard Premium: sección "Invite friends" con link copiable
- Email a Premium: "Love Superfocus? Give a friend 1 month free — you get 1 month too"

**Archivos:** Nueva lógica de referidos en [script.js](script.js), posible API para tracking, emails (cuando se reactiven)

---

## Resumen por segmento

| Segmento | Lead magnet / mini offer | Deprivación creada | CTA |
|----------|--------------------------|--------------------|-----|
| **Guest → Free** | Sesión 25 min sin signup, quiz focus style | "Quiero guardar progreso, 2h/día" | Sign up free |
| **Free → Premium** | Taste de Premium, focus audit, preview de analytics | "Quiero unlimited, todas las técnicas" | Try 1 month for $0 |
| **Premium → Premium** | "Invite friend, both get 1 month free" | (Referidor: beneficio; Referido: mismo funnel) | Invite / Sign up con ref |

---

## Integración con Growth Levers

- **Clear Not Clever:** Copy de cada CTA en nivel 3º–5º grado
- **Proof Over Promise:** Cada mini offer entrega valor real
- **70/30 Give/Ask:** Valor (give) antes de cada CTA (ask)
- **Target Right List:** Calificar (Student/Professional/Freelancer) donde aplique
- **State the Facts:** "1 month free", "2h per day", "cancel anytime" — sin exagerar

---

## Orden de implementación sugerido

1. **Guest → Free:** Optimizar CTA post-sesión guest (bajo esfuerzo)
2. **Free → Premium:** Mejorar copy en daily limit modal y report panel (bajo)
3. **Premium → Premium:** Programa de referidos (medio esfuerzo)
4. Quiz o PDF como lead magnet transversal (medio)
