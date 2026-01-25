# Tracking Issues Diagnosis - Subscribe Clicked & Sidebar Panel

**Fecha**: Enero 23, 2026
**Reportado por**: Usuario  
**Problema**: Varios eventos "Subscribe Clicked" no están llegando a Mixpanel ni Google Ads

---

## 📊 Estado de Tracking

### ✅ Subscribe Clicked Events QUE SÍ Funcionan:
1. `daily_limit_modal` - ✅ Tiene data
2. `timer_header` - ✅ Tiene data
3. `pricing_page` - ✅ Tiene data
4. `task_limit_modal` - ✅ Tiene data
5. `profile_dropdown` - ✅ Tiene data

### ❌ Subscribe Clicked Events CON PROBLEMAS:
1. `settings_modal` - 🔴 3 días sin data
2. `cta_before_faq` - ⚠️ A veces sale, a veces no
3. `create_cassette_modal` - 🔴 No sale data
4. `report_panel` - 🔴 No sale data
5. `create_timer_modal` - 🔴 No sale data
6. `comparison_table_cta` - 🔴 No sale data
7. `final_cta` - 🔴 No sale data

### ℹ️ Otros Eventos (No relacionados con Subscribe):
- `Sidebar Panel Opened` - Solo va a Mixpanel (Timer, Tasks, Cassettes, Report no trackean)
- Solo Leaderboard trackea correctamente

---

## 🔍 Revisión de Código

### 1. **create_timer_modal** (línea 1759 de script.js)
```javascript
this.trackEvent('Subscribe Clicked', eventProperties);
```
✅ **Código está bien** - Llama a trackEvent correctamente

**Posible causa**: 
- El modal no se está abriendo (botón #customUpgradeBtn no existe)
- Free users no están viendo el modal
- El botón no tiene el event listener

### 2. **create_cassette_modal** (línea 1981 de script.js)
```javascript
this.trackEvent('Subscribe Clicked', eventProperties);
```
✅ **Código está bien** - Llama a trackEvent correctamente

**Posible causa**: Similar a create_timer_modal

### 3. **settings_modal** (línea 5077 de script.js)
```javascript
this.trackEvent('Subscribe Clicked', eventProperties);
```
✅ **Código está bien** - Llama a trackEvent correctamente

**Posible causa**:
- Modal no se abre o botón #upgradeToProModalBtn no existe
- El evento listener no se está binding

### 4. **report_panel** (líneas 13995-14001 de script.js)
```javascript
window.pomodoroTimer.trackEvent('Subscribe Clicked', {
    button_type: 'subscribe',
    source: 'report_panel',
    ...
});
```
✅ **Código está bien**

**Posible causa**:
- Botones upgradeFromChart, upgradeFromActivity, etc. no existen en el DOM
- Free users no ven estos botones (solo se muestran en displayBasicReport)

### 5. **comparison_table_cta** y **final_cta** (pricing/index.html, líneas 3276 y 3282)
```javascript
comparisonTableCTAButton.addEventListener('click', handleCTAClick(comparisonTableCTAButton, 'comparison_table_cta'));
finalCTAButton.addEventListener('click', handleCTAClick(finalCTAButton, 'final_cta'));
```
✅ **Código está bien** - handleCTAClick incluye tracking completo

**Posible causa**:
- Botones no están siendo encontrados en el DOM
- Event listeners no se están binding correctamente

---

## 🐛 Hipótesis Principal

**El problema NO es el código de tracking**, sino que:

1. **Los botones/modales no se están mostrando a free users**
   - Los modales requieren ciertas condiciones para abrirse
   - Si no se cumplen, el botón nunca se muestra y nunca se hace click

2. **Los event listeners no se están binding**
   - Si el DOM no está listo cuando se ejecuta el código
   - Si hay errores de JavaScript que previenen el binding

3. **Los selectores están incorrectos**
   - IDs o clases no coinciden con el HTML actual
   - Botones fueron renombrados pero código no actualizado

---

## 🔧 Plan de Diagnóstico

### Paso 1: Verificar que los botones existen
Abrir DevTools → Elements → Buscar:
- `#customUpgradeBtn` (create_timer_modal)
- `#cassetteUpgradeBtn` (create_cassette_modal)
- `#upgradeToProModalBtn` (settings_modal)
- `#comparisonTableCTA` (pricing page)
- `#finalCTA` (pricing page)

### Paso 2: Verificar event listeners
En DevTools Console:
```javascript
// Check if event listeners are attached
getEventListeners(document.getElementById('comparisonTableCTA'))
getEventListeners(document.getElementById('finalCTA'))
```

### Paso 3: Test manual tracking
En DevTools Console:
```javascript
// Test direct tracking call
window.pomodoroTimer.trackEvent('Subscribe Clicked', {
    source: 'test_manual',
    button_type: 'subscribe'
});
```

Verificar:
- ¿Se muestra en console "✅ Event tracked successfully"?
- ¿Se llama `trackSubscribeClickedToGoogleAds`?
- ¿Se envía a Google Ads?

---

## 🚨 Posibles Causas Raíz

### Causa 1: Modales no se abren (most likely)
Si free users no están intentando crear timers/cassettes, los modales nunca se abren:
- create_timer_modal solo abre cuando intentan crear segundo timer
- create_cassette_modal solo abre cuando intentan crear segunda cassette
- settings_modal no tiene botón "Upgrade" visible

### Causa 2: Selectores mal configurados
Los IDs en HTML no coinciden con los que busca JavaScript:
```javascript
// Código busca:
document.getElementById('comparisonTableCTA')

// Pero HTML tiene:
<button id="comparison-table-cta">  // ← Guión en lugar de camelCase
```

### Causa 3: Timing issues
Los event listeners se están binding ANTES de que el DOM esté listo:
- DOMContentLoaded no espera a que Clerk termine de cargar
- Botones se crean dinámicamente pero event listeners no se re-attach

---

## ✅ Siguiente Paso

Necesitamos verificar en el navegador con DevTools:

1. Abrir https://superfocus.live/pricing
2. Abrir DevTools → Console
3. Ejecutar:
```javascript
// Check if buttons exist
console.log('comparisonTableCTA:', document.getElementById('comparisonTableCTA'));
console.log('finalCTA:', document.getElementById('finalCTA'));
console.log('Clerk loaded:', window.Clerk?.loaded);
console.log('Mixpanel available:', typeof window.mixpanel);
console.log('gtag available:', typeof gtag);
```

4. Hacer click en botones y verificar console logs
5. Reportar qué aparece en console

---

**¿Puedes hacer esta verificación en el navegador y reportar qué ves en la consola?** Con eso podré identificar el problema exacto.
