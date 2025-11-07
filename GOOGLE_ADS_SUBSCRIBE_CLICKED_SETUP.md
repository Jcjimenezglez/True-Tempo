# Configuración de "Subscribe Clicked" en Google Ads para Performance Max

## ✅ Cambios Implementados en el Código

Se ha agregado tracking de Google Ads (`gtag`) en todos los lugares donde se rastrea "Subscribe Clicked" en Mixpanel. El evento se envía como `subscribe_clicked` con los siguientes parámetros:

- **Event Category**: `engagement` (señal de intención, no conversión)
- **Event Label**: El source (timer_header, create_timer_modal, pricing_page, etc.)
- **Value**: 0.1 (valor de intención, no conversión)
- **Currency**: USD

### Lugares donde se agregó el tracking:
1. ✅ `create_timer_modal` - Modal de crear timer personalizado
2. ✅ `timer_header` - Botón de suscripción en el header
3. ✅ `profile_dropdown` - Menú de perfil/configuración
4. ✅ `pricing_modal` - Modal de pricing
5. ✅ `settings_modal` - Modal de configuración
6. ✅ `daily_limit_modal` - Modal de límite diario alcanzado
7. ✅ `task_limit_modal` - Modal de límite de tareas alcanzado
8. ✅ `integration_modal` - Modal de integraciones (Todoist, Notion, etc.)
9. ✅ `pricing_page` - Página de pricing (/pricing/)

---

## 📋 Pasos para Configurar en Google Ads

### Paso 1: Verificar que los Eventos Llegan a Google Analytics

1. Ve a **Google Analytics 4** (tu propiedad G-T3T0PES8C0)
2. Navega a **Configuración** → **Eventos** → **Eventos personalizados**
3. Haz clic en algunos botones de "Subscribe" en tu sitio
4. Espera 24-48 horas y verifica que el evento `subscribe_clicked` aparezca en la lista
5. Puedes verificar en tiempo real:
   - Ve a **Informes** → **Tiempo real**
   - Haz clic en un botón de suscripción
   - Deberías ver el evento `subscribe_clicked` aparecer

### Paso 2: Importar el Evento desde Google Analytics a Google Ads

1. En **Google Ads**, ve a **Herramientas y configuración** (icono de herramientas) → **Conversiones**
2. Haz clic en el botón **+** para crear una nueva conversión
3. Selecciona **Importar** (en lugar de "Crear una acción de conversión")
4. Selecciona **Google Analytics 4**
5. Elige tu propiedad de GA4 (debería estar vinculada)
6. Selecciona el evento `subscribe_clicked`
7. Configura los siguientes parámetros:

   **Configuración del Evento:**
   - **Categoría**: Selecciona **"Intención de compra"** o **"Otro"** (NO "Compra")
   - **Nombre**: `Subscribe Clicked` o `Intención de Suscripción`
   - **Valor**: Usar el valor del evento (0.1) o seleccionar "No usar valor"
   - **Contar**: **Una por clic** (no "Una por conversión")
   - **Atribución**: **Última clic** (puedes cambiarlo después si es necesario)
   - **Incluir en "Conversiones"**: **SÍ** (esto permitirá que Performance Max lo use)
   - **Tipo de conversión**: Selecciona **"Secundaria"** si ya tienes conversiones de suscripción reales

8. Haz clic en **Crear y continuar**

### Paso 3: Configurar Performance Max para Usar Este Evento

#### Opción A: Usar como Objetivo de Optimización (Recomendado si tienes 0 conversiones)

1. Ve a tu campaña **Performance Max**
2. Haz clic en **Editar**
3. En **Objetivos y ofertas**, busca **"Ofertas de conversión"**
4. Edita la oferta actual
5. Selecciona **"Subscribe Clicked"** (el evento que acabas de importar) como objetivo de optimización
6. O puedes configurar múltiples objetivos:
   - Objetivo primario: "Subscribe Clicked"
   - Objetivo secundario: Tu conversión de suscripción real (si la tienes)

#### Opción B: Crear Audiencia Basada en "Subscribe Clicked"

1. En **Google Ads**, ve a **Audiencias** → **Audiencias personalizadas**
2. Haz clic en **+** para crear nueva audiencia
3. Selecciona **"Personalizada"**
4. **Tipo**: **Público de conversión**
5. Selecciona **"Subscribe Clicked"** como evento de conversión
6. Configura:
   - **Tiempo**: Últimos 30-90 días
   - **Incluir**: Usuarios que realizaron el evento
7. Guarda como: `Intent de Suscripción - Subscribe Clicked`
8. Ahora puedes usar esta audiencia en Performance Max:
   - Ve a tu campaña Performance Max
   - **Grupos de anuncios** → **Audiencias de optimización**
   - Agrega la audiencia que creaste

### Paso 4: Configurar Signals Personalizadas (Opcional pero Recomendado)

Para ayudar a Performance Max a encontrar más usuarios similares:

1. En **Google Ads**, ve a **Herramientas y configuración** → **Configuración de la cuenta**
2. Busca **"Signals personalizados"** o **"Conversion tracking"** → **Custom insights**
3. Crea un signal personalizado basado en:
   - Eventos que ocurren: `subscribe_clicked`
   - Con parámetros específicos (puedes segmentar por source si quieres)

### Paso 5: Verificar y Monitorear

1. Espera 24-48 horas después de la configuración
2. En **Google Ads**, ve a tu campaña Performance Max
3. Verifica en **Métricas de conversión** que aparezcan eventos de "Subscribe Clicked"
4. Revisa **Herramientas y configuración** → **Conversiones** para ver el volumen de eventos

---

## 🎯 Estrategia Recomendada

### Si tienes 0 conversiones de suscripción:

1. **Corto plazo (primeras 2-4 semanas)**:
   - Optimiza Performance Max hacia **"Subscribe Clicked"** como objetivo principal
   - Esto le dará al algoritmo más señales para aprender
   - Deberías ver más tráfico cualificado

2. **Mediano plazo (después de tener datos)**:
   - Una vez que tengas al menos 10-20 "Subscribe Clicked" al día
   - Cambia el objetivo a tu conversión real de suscripción
   - O usa ambos: "Subscribe Clicked" como señal secundaria

### Optimización por Source:

Si quieres optimizar por los sources más valiosos (ej: `pricing_page` vs `timer_header`):

1. En Google Analytics, crea segmentos personalizados por el parámetro `source` del evento
2. Importa esos segmentos como audiencias en Google Ads
3. Usa esas audiencias en Performance Max para ajustar las ofertas

---

## 🔍 Verificación de que Funciona

### Prueba Rápida:

1. Abre tu sitio en modo incógnito
2. Abre la consola del navegador (F12)
3. Haz clic en cualquier botón de "Subscribe"
4. Deberías ver en la consola: `✅ Subscribe Clicked tracked to Google Ads: [source]`
5. En Google Analytics (Tiempo real), deberías ver el evento `subscribe_clicked`

### En Google Ads:

- Espera 24-48 horas
- Ve a **Herramientas y configuración** → **Conversiones**
- El evento "Subscribe Clicked" debería aparecer con datos

---

## 📊 Métricas a Monitorear

Después de configurar, monitorea:

1. **Volumen de "Subscribe Clicked"**: ¿Cuántos eventos al día?
2. **Tasa de "Subscribe Clicked" a Conversión Real**: ¿Qué % de clicks se convierten?
3. **Coste por "Subscribe Clicked"**: ¿Cuánto cuesta generar intención?
4. **Sources más efectivos**: ¿De dónde vienen los clicks más valiosos?

---

## ⚠️ Notas Importantes

1. **Tiempo de procesamiento**: Google Ads puede tardar 24-48 horas en mostrar los datos
2. **Mínimo de conversiones**: Performance Max necesita al menos 30 conversiones en 30 días para optimizar bien
3. **Valor del evento**: Usamos 0.1 para indicar que es intención, no conversión. Si quieres, puedes cambiarlo más adelante
4. **No es conversión final**: Este evento es una **señal de intención**, no una conversión de suscripción real. Úsalo para mejorar el funnel, no como métrica final

---

## 📞 Próximos Pasos

1. ✅ **Código implementado** - Listo para usar
2. ⏳ **Verificar eventos en GA4** - Espera 24h y verifica
3. ⏳ **Importar evento a Google Ads** - Sigue el Paso 2
4. ⏳ **Configurar Performance Max** - Sigue el Paso 3
5. ⏳ **Monitorear resultados** - Espera 1-2 semanas para ver mejoras

---

¿Necesitas ayuda con algún paso específico? Puedo ayudarte a configurarlo o ajustar el código según sea necesario.

