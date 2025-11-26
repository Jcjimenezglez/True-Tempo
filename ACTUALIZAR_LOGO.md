# 📸 Actualizar Logo y Favicon

Este guía te ayudará a actualizar el logo que aparece en Google y los favicons de la página.

## 🚀 Pasos Rápidos

1. **Coloca tu archivo PNG** en la raíz del proyecto (junto a `index.html`)
   - El archivo debe tener el logo con buen contraste (preferiblemente oscuro sobre fondo claro o viceversa)
   - Formatos recomendados: PNG con fondo transparente o fondo blanco

2. **Ejecuta el script:**
   ```bash
   npm run update-logo
   ```
   
   O si tienes múltiples PNGs y quieres especificar cuál usar:
   ```bash
   npm run update-logo nombre-de-tu-archivo.png
   ```

3. **El script generará automáticamente:**
   - ✅ Todos los favicons (16x16, 32x32, 72x72, 96x96, 144x144, 192x192, 512x512)
   - ✅ `apple-touch-icon.png` (180x180)
   - ✅ `favicon.ico`
   - ✅ `og-image.png` (1200x630) - **Este es el que aparece en Google**

4. **Despliega los cambios** a producción para que Google los vea

5. **Solicita reindexación en Google Search Console:**
   - Ve a [Google Search Console](https://search.google.com/search-console)
   - Usa la herramienta "Inspección de URL" para tu página principal
   - Solicita nueva indexación

## ⏱️ Tiempo de Actualización

- Los cambios en el sitio se reflejan inmediatamente después del despliegue
- Google puede tardar **varios días o semanas** en actualizar la imagen en los resultados de búsqueda
- Puedes acelerar el proceso solicitando reindexación en Search Console

## 📝 Notas

- El `og-image.png` debe ser de 1200x630 píxeles para mejor visualización
- Asegúrate de que el logo tenga buen contraste para verse bien en fondos claros
- Todos los favicons se generan automáticamente desde tu PNG original

