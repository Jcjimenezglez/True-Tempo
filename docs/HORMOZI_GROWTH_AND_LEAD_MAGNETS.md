# Hormozi: Growth Levers + Lead Magnets por Segmento

Plan unificado para Superfocus. Combina los 11 Strongest Growth Levers con la estrategia de Lead Magnets de Alex Hormozi. **Sin PDFs**: todo se entrega via **modal dentro del site** o **link a otra página del site**.

---

## Visión del funnel

```
Guest ──(lead magnet)──> Free ──(lead magnet)──> Premium ──(referral)──> más Premium
```

---

## Principios Hormozi - Resumen Completo

Todo lo discutido de Alex Hormozi (Growth Levers + Lead Magnets + $100M Leads), consolidado:

### Growth Levers (11)
1. **Nobody Knows You Exist** — Primeras 4h del día en obscurity. Core 4: Outreach, Content, Ads. Elegir 1, ir all-in.
2. **Shrink Your Competition** — No competir: crecer tanto que los demás se vuelven irrelevantes, o "kill them with kindness".
3. **Clear Not Clever** — Nivel 3º–5º grado. "If you can explain it to a third grader, you understand it." +50% conversion al simplificar.
4. **Proof Over Promise** — Proof up to your eyeballs. 11,382 reviews a 4.7 gana a 1 review de 5 estrellas. Show don't sell.
5. **Hook** — Primeros 5 segundos = 80% del valor. Fórmula: Proof + Promise + Plan. Un video pasó de 40K a 780K vistas recortando 3s.
6. **Do More** — Más de lo que ya funciona. Riesgo más bajo que "better" o "new". 1→4 sales reps = 4x vs optimizar script.
7. **Word of Mouth** — Negativo 5–37x más fuerte que positivo (Disney). Proof over promise para minimizar negativo.
8. **Steal From Yourself** — 70% carbon copy, 20% adyacente, 10% nuevo. "You will get bored before your customers do."
9. **Emotional vs Logical Buyers** — Continuum. High-info buyers = mayoría. 70% brand/awareness, 30% direct response (New Balance).
10. **State the Facts & Tell the Truth** — Cambiar realidad, no exagerar. "It's toasted." Best in a puddle.
11. **Target the Right List** — Winter coats in South Florida. Si targeting falla, nada importa. Person in ad = avatar.
12. **Masters Have More Ways to Win** — Más leading indicators. Direccional > binario.

### Lead Magnets ($100M Leads)
- **Principio:** "Most visitors aren't ready to buy — they leave and never come back." Dar valor antes de pedir.
- **3 tipos:** Reveal a problem | Free trial (taste) | One step of many.
- **4 entregas:** Software/tool | Información | Servicios | Físico. Sin PDFs: modal o página interna.
- **Naming:** Advertise result, not vehicle. "Big Booty Boot Camp" > "Six week deadlift seminar." Probar con audiencia.
- **CTA fórmula:** Clear + Exact next action + Reason to do now.
- **Ratio 3.5:1** — Give : Ask. Por cada ask, ~3.5x valor (give).

### Value Equation
Value = (Dream Outcome × Perceived Likelihood × Time to Achievement) ÷ Effort & Sacrifice. Aumentar numerador o reducir denominador.

---

## Parte A: Growth Levers (copy y estructura)

### 1. Clear Not Clever
- Nivel de lectura 3º–5º grado en todo el copy
- Simplificar: "productivity analytics" → "see how much you focus"
- Analogías por audiencia: Student, Professional, Freelancer

### 2. Proof Over Promise
- Proof visible above the fold: "5,050+ users", métricas de resultado
- Testimonios con resultados concretos
- Garantía explícita: "Free 1 month. Cancel anytime."

### 3. Hook (primeros 5 segundos)
- Fórmula: Proof + Promise + Plan
- Memory test: 10 headlines → 5 amigos → ganador = headline oficial
- Screenshot/demo visible sin scroll

### 4. Steal From Yourself (70/20/10)
- 70% carbon copy de lo que convierte
- Reutilizar testimonios en landing, pricing, emails

### 5. State the Facts
- Unique mechanism en 1 frase
- Best in a puddle (ICP definido)
- Sin exageraciones

### 6. Target the Right List
- ICP: Freelancers, profesionales, estudiantes
- Segmentar mensajes por rol
- Calificar antes de dar lead magnet (dropdown)

### 7. Nobody Knows You Exist + Do More
- Core 4: Outreach, Content, Ads — elegir 1, ir all-in
- Más volumen antes de optimizar

### 8. Masters Have More Ways to Win
- Leading indicators: tiempo hasta 1ª sesión, % que completa 1 sesión, etc.

---

## Parte B: Lead Magnets por Segmento

**Regla:** Sin PDFs. Usar **modal** o **página interna** (`/focus-quiz`, `/5-mistakes`, `/invite`).

---

### Segmento 1: Guest → Free

**Objetivo:** Que el guest experimente valor antes de signup. Deprivation: "Quiero guardar progreso, 2h/día."

| Lead magnet | Entrega | CTA |
|-------------|---------|-----|
| **Sesión 25 min sin signup** (guest) | Ya existe | Modal al terminar: "Save your progress and get 2h/day — sign up free" |
| **Quiz "What's your focus style?"** | Modal o página `/focus-quiz` | "Get your preset in Superfocus — sign up free" |
| **"5 mistakes that kill deep work"** | Modal o página `/focus-mistakes` | "Superfocus fixes these — try free" |

**Implementación:**
- Modal post-sesión guest en [script.js](script.js)
- Quiz: modal en [index.html](index.html) o página `focus-quiz.html` → `/focus-quiz`
- 5 mistakes: modal o página `focus-mistakes.html` → `/focus-mistakes`
- CTA alternativo hero: "Try 25 min free — no signup"

---

### Segmento 2: Free → Premium

**Objetivo:** Que el free user experimente un "taste" de Premium. Deprivation: "Quiero mantener esto / tener más."

| Lead magnet | Entrega | CTA |
|-------------|---------|-----|
| **Daily limit modal** (ya existe) | Al llegar a 2h | "Get unlimited focus — try 1 month free" |
| **Preview de analytics** | Modal o sección en Report con blur | "Unlock full insights — try Premium free" |
| **Taste 1 cassette/1 técnica 24h** | Desbloquear temporalmente | "Want this every day? Try Premium" |
| **"What Premium users get"** | Modal o página `/premium-benefits` | "Try 1 month free" |

**Implementación:**
- Mejorar copy en daily limit modal [script.js](script.js)
- Modal o página `premium-benefits.html` → `/premium-benefits` (comparativa clara)
- En Report (free): preview difuminado + CTA
- Opcional: taste de 1 feature Premium por 24h

---

### Segmento 3: Premium → Premium (referrals)

**Objetivo:** Que Premium users inviten a otros. Incentivo para referrer + experiencia para referido.

| Mecánica | Para referrer | Para referido | CTA |
|----------|---------------|---------------|-----|
| **Referral program** | "You both get 1 month free" | Trial Premium | "Invite a friend" |
| **Share link** | Link con `?ref=USER_ID` | Llega como guest | "Share your link" |
| **Share streak/level** | Compartir logro con link | Ve resultado, quiere probar | "Try Superfocus" |

**Implementación:**
- Página `/invite` o modal en Settings para Premium
- Link único: `https://www.superfocus.live/?ref=USER_ID`
- API: tracking de conversiones por ref
- Sección "Invite friends" en dashboard Premium

---

## Parte C: Qué Dar Gratis en Cada Etapa ("Give First, Then Ask")

Principio Hormozi: "When someone pays with time now, they're more likely to pay with money later." Ratio 3.5:1 give-to-ask: por cada CTA (ask), dar ~3.5x valor (give). El give crea deprivation para el siguiente paso.

---

### Guest: Qué Dar Gratis ANTES de Pedir Signup

**Objetivo:** Que el guest experimente valor real antes de ver "Sign up free".

#### Ya existe (mantener/mejorar)

| Dar gratis | Estado actual | Mejora |
|------------|---------------|--------|
| 1h focus/día sin signup | Sí (guest limit) | Mantener; asegurar buena UX |
| Timer Pomodoro 25/5 | Sí | Cassette por defecto atractivo |
| Onboarding por perfil | Sí | Mensaje personalizado con valor |
| "Try Without Account" | Sí | Reforzar como opción válida |

#### Añadir (nuevos "gives")

| Dar gratis | Entrega | Deprivación creada |
|------------|---------|--------------------|
| Quiz "What's your focus style?" | Modal o `/focus-quiz` | "Sé mi preset ideal — quiero usarlo en Superfocus" |
| "5 mistakes that kill deep work" | Modal o `/focus-mistakes` | "Tengo estos problemas — Superfocus los resuelve" |
| Calculadora "Your ideal work block length" | Modal o `/focus-calculator` | "Sé mi bloque ideal — necesito el timer" |
| 1 sesión completa con sonido/cassette | Ya existe | "Funcionó — quiero guardar progreso y 2h/día" |
| Preview de analytics (blurrado) | Pequeño teaser en UI | "Quiero ver mis stats completos" |
| "Focus tip of the day" | Micro-contenido en modal o banner | Valor educativo; crea confianza |
| Modal post-sesión | Al terminar 1ª sesión | "Save your progress" (ask después del give) |

**Momento del ask:** Después de 1 sesión completada, resultado del quiz, o leer 5 mistakes. CTA: "Sign up free — save your progress and get 2h/day. Takes 10 seconds."

---

### Free: Qué Dar Gratis ANTES de Pedir Premium

**Objetivo:** Que el free user experimente un "taste" de Premium. Deprivation: "Quiero más."

#### Ya existe (mantener/mejorar)

| Dar gratis | Estado actual | Mejora |
|------------|---------------|--------|
| 2h focus/día | Sí | — |
| 1 custom timer | Sí | — |
| 1 task | Sí | — |
| Basic analytics/report | Sí | Añadir preview de Premium |
| Leaderboard | Sí | — |

#### Añadir (nuevos "gives" para free)

| Dar gratis | Entrega | Deprivación creada |
|------------|---------|--------------------|
| Taste de 1 cassette Premium | Desbloquear 1 cassette por 24h | "Quiero más variedad de sonidos" |
| Taste de Flowtime | 1 sesión Flowtime gratis | "Esta técnica me funciona — quiero usarla siempre" |
| Preview de analytics avanzados | Modal o Report con blur + "Unlock to see" | "Quiero ver heatmap, streaks completos" |
| "Focus audit" one-time | Modal: "Here's your focus pattern this week" | "Quiero esto cada día" |
| "What Premium users get" | Modal o `/premium-benefits` | Comparativa clara; informar, no vender |
| Daily limit como trigger | Ya existe | "Llegué al límite — quiero unlimited" |
| Email con valor (cuando se reactiven) | "3 tips to get 3h of deep work" | Valor + soft CTA a Premium |
| 1 Todoist sync trial (si aplica) | Probar integración limitada | "Quiero sync completo" |

**Momento del ask:** Después de taste de cassette/Flowtime, preview de analytics, o daily limit. CTA: "Try Premium free for 1 month — unlimited focus. Cancel anytime."

---

### Premium: Qué Seguir Dando Gratis para Boca a Boca

**Objetivo:** Que los Premium users reciban valor continuo que les motive a compartir (word of mouth).

#### Ya existe (mantener)

| Dar gratis | Estado actual |
|------------|---------------|
| Unlimited focus | Sí |
| Todas las técnicas | Sí |
| Todos los cassettes | Sí |
| Analytics completos | Sí |
| Todoist integration | Sí |

#### Añadir (nuevos "gives" para Premium → boca a boca)

| Dar gratis | Entrega | Efecto en boca a boca |
|------------|---------|------------------------|
| 1 mes extra por referral | Por cada amigo que se suscriba | Incentivo directo a compartir |
| Share streak/level con link | Botón "Share" en leaderboard o stats | El referido ve el resultado; quiere probar |
| Contenido exclusivo Premium | Modal o `/premium-tips`: "Advanced focus techniques" | Valor que comparten orgullosos |
| Early access a nuevas features | Aviso cuando hay novedad | "Superfocus acaba de añadir X" — lo cuentan |
| Badge/achievement por compartir | "You referred 3 friends" | Gamificación; más shares |
| Newsletter Premium (cuando emails se reactiven) | Tips exclusivos, novedades | Mantiene engagement |
| Free "focus masterclass" | Webinar o video corto para Premium | Contenido que recomiendan |
| Swag digital | "Premium member" badge para profile/share | Identidad; lo muestran |
| Referral leaderboard | "Top referrers this month" | Competencia sana; más referrals |

**Momento del ask:** Después de streak alto, nivel subido, o contenido exclusivo consumido. CTA: "Invite a friend — they get 1 month free, you get 1 month free."

---

### Resumen Give vs Ask por Segmento

```
Guest:   [GIVE: 1h timer, quiz, 5 mistakes, calculator, tip] → [ASK: Sign up free]
Free:    [GIVE: 2h, 1 timer, 1 task, taste cassette, preview analytics] → [ASK: Try Premium free]
Premium: [GIVE: todo + exclusive content, early access, referral reward] → [ASK: Invite a friend]
```

---

## Resumen: modales y páginas (sin PDFs)

| Contenido | Entrega | Ubicación |
|-----------|---------|-----------|
| Quiz focus style | Modal o `/focus-quiz` | index.html, focus-quiz.html |
| 5 mistakes deep work | Modal o `/focus-mistakes` | index.html, focus-mistakes.html |
| What Premium users get | Modal o `/premium-benefits` | pricing, premium-benefits.html |
| Invite friends | Modal o `/invite` | Settings, invite.html |
| Post-sesión guest | Modal | script.js |
| Daily limit (free) | Modal (ya existe) | script.js |
| Preview analytics (free) | Modal o sección Report | script.js |

---

## Orden de implementación

| Prioridad | Fase | Esfuerzo | Impacto |
|-----------|------|----------|---------|
| 1 | Guest flow: modal post-sesión | Bajo | Alto |
| 2 | Clear Not Clever (copy) | Medio | Alto |
| 3 | Hook (headlines) | Bajo | Alto |
| 4 | Proof Over Promise | Bajo | Alto |
| 5 | Free→Premium: mejorar daily limit modal | Bajo | Alto |
| 6 | Quiz o "5 mistakes" (modal o página) | Medio | Alto |
| 7 | Premium benefits (modal o `/premium-benefits`) | Bajo | Medio |
| 8 | Referral program (`/invite`, ?ref=) | Medio | Alto |
| 9 | State the Facts, Target Right List | Bajo | Medio |
| 10 | Métricas, Nobody Knows | Medio/Operativo | Largo plazo |

---

## Archivos principales

- [index.html](index.html): Hero, CTAs, modales quiz/5-mistakes
- [script.js](script.js): Modal post-sesión guest, daily limit, referral logic
- [pricing/index.html](pricing/index.html): CTAs por segmento
- [style.css](style.css): Estilos modales
- Nuevas páginas: `focus-quiz.html`, `focus-mistakes.html`, `premium-benefits.html`, `invite.html`
- API: referral tracking

---

## CTA fórmula (todos los segmentos)

**Clear + Exact next action + Reason to do now**

- Guest: "Sign up free — save your progress. Takes 10 seconds."
- Free: "Try Premium free for 1 month — unlimited focus. Cancel anytime."
- Premium: "Invite a friend — they get 1 month free, you get 1 month free."
