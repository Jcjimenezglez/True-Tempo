# 🚀 Configuración de Todoist OAuth

## 📋 Pasos para Configurar Todoist OAuth

### 1. **Crear App en Todoist Developer Console**

1. Ve a: https://developer.todoist.com/appconsole.html
2. Haz clic en "Create new app"
3. Completa la información:
   - **App name**: SuperFocus Timer
   - **Description**: Pomodoro timer with Todoist integration
   - **Redirect URI**: `https://superfocus.live/api/todoist-oauth`

### 2. **Obtener Credenciales**

Después de crear la app, obtendrás:
- **Client ID**: `abc123...`
- **Client Secret**: `def456...`

### 3. **Configurar Variables de Entorno en Vercel**

Ve a tu dashboard de Vercel → Project Settings → Environment Variables:

```bash
TODOIST_CLIENT_ID=tu_client_id_aqui
TODOIST_CLIENT_SECRET=tu_client_secret_aqui
FRONTEND_URL=https://superfocus.live
```

### 4. **Flujo de Usuario Mejorado**

#### **Antes (Complicado):**
1. Usuario va a Settings → Integrations → API token
2. Copia el token manualmente
3. Pega el token en la app
4. Hace clic en "Save" y "Fetch Tasks"

#### **Después (Simple):**
1. Usuario hace clic en "Connect with Todoist"
2. Se redirige a Todoist OAuth
3. Autoriza la app
4. Regresa automáticamente con las tareas cargadas

### 5. **Beneficios de OAuth**

✅ **Mejor UX**: Un solo clic para conectar
✅ **Más Seguro**: No se almacenan tokens en localStorage
✅ **Renovación Automática**: Los tokens se renuevan automáticamente
✅ **Menos Errores**: No hay que copiar/pegar tokens
✅ **Profesional**: Experiencia similar a apps como Notion, Slack, etc.

### 6. **Implementación Técnica**

#### **Archivos Creados:**
- `api/todoist-oauth.js` - Maneja el flujo OAuth
- `api/todoist-tasks.js` - Obtiene tareas de forma segura
- `script_todoist_improved.js` - Nueva UI mejorada

#### **Flujo Técnico:**
1. Usuario hace clic en "Connect with Todoist"
2. Se redirige a `/api/todoist-oauth`
3. OAuth endpoint redirige a Todoist
4. Usuario autoriza en Todoist
5. Todoist redirige de vuelta con código
6. Intercambiamos código por access_token
7. Redirigimos al frontend con token encriptado
8. Frontend usa token para obtener tareas

### 7. **Testing Local**

Para probar localmente:

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
export TODOIST_CLIENT_ID=tu_client_id
export TODOIST_CLIENT_SECRET=tu_client_secret
export FRONTEND_URL=http://localhost:3000

# Ejecutar servidor
npm run dev
```

### 8. **Deployment**

Una vez configuradas las variables de entorno en Vercel:

```bash
git add .
git commit -m "Add Todoist OAuth integration"
git push origin main
```

Vercel automáticamente desplegará los cambios.

## 🎯 **Resultado Final**

Los usuarios ahora pueden:
- Conectar Todoist con un solo clic
- Ver sus tareas organizadas por prioridad
- Seleccionar tareas para enfocarse
- Completar tareas directamente desde la app
- Experiencia fluida y profesional

¡La integración está lista para producción! 🚀
