# 🚀 Resend DNS Setup - Guía Rápida

## Dominio: `updates.superfocus.live`

### ⚡ Pasos Rápidos

#### 1. Obtener Valores de Resend Dashboard

1. Ve a: https://resend.com/domains
2. Click en el dominio `updates.superfocus.live`
3. En la sección **DNS Records**, verás 3 registros principales que están en "Failed":

   **a) DKIM:**
   - Tipo: TXT
   - Name: `resend._domainkey.updates` (o similar)
   - Value: (copia el valor completo)

   **b) SPF MX:**
   - Tipo: MX
   - Name: `send.updates`
   - Priority: `10`
   - Value: (copia el valor, algo como `feedback-smtp.resend.com`)

   **c) SPF TXT:**
   - Tipo: TXT
   - Name: `send.updates`
   - Value: (copia el valor completo, algo como `v=spf1 include:resend.com ~all`)

#### 2. Agregar en Cloudflare

1. Ve a: https://dash.cloudflare.com
2. Selecciona el dominio `superfocus.live`
3. Ve a **DNS** → **Records**
4. Click **Add record** para cada uno:

   **Registro 1 - DKIM:**
   ```
   Type: TXT
   Name: resend._domainkey.updates
   Content: [Pega el valor de Resend]
   TTL: Auto
   Proxy: OFF (nube gris, NO naranja) ⚠️ IMPORTANTE
   ```

   **Registro 2 - SPF MX:**
   ```
   Type: MX
   Name: send.updates
   Priority: 10
   Target: [Pega el valor de Resend]
   TTL: Auto
   Proxy: OFF (nube gris) ⚠️ IMPORTANTE
   ```

   **Registro 3 - SPF TXT:**
   ```
   Type: TXT
   Name: send.updates
   Content: [Pega el valor de Resend]
   TTL: Auto
   Proxy: OFF (nube gris) ⚠️ IMPORTANTE
   ```

#### 3. Verificar

1. Espera 5-15 minutos para propagación DNS
2. Regresa a Resend Dashboard → `updates.superfocus.live`
3. Los estados deberían cambiar de "Failed" a "Verified" (verde)
4. Si aún están en "Failed", verifica:
   - ✅ Los valores están copiados exactamente
   - ✅ Los nombres son correctos (case-sensitive)
   - ✅ Todos los registros tienen Proxy OFF (nube gris)

## ⚠️ ERRORES COMUNES

### ❌ Proxy Activado (Nube Naranja)
**Problema**: Los registros de email NO funcionan con proxy de Cloudflare  
**Solución**: Asegúrate de que todos los registros tengan **Proxy: OFF** (nube gris)

### ❌ Valores Incorrectos
**Problema**: Copiaste valores con espacios extra o caracteres incorrectos  
**Solución**: Copia exactamente desde Resend, sin modificar nada

### ❌ Nombres Incorrectos
**Problema**: El nombre del registro no coincide exactamente  
**Solución**: Verifica que el nombre sea exactamente el que Resend indica (case-sensitive)

## 📸 Ejemplo Visual

En Cloudflare, los registros deberían verse así:

```
Type    Name                        Content/Target                    Proxy
TXT     resend._domainkey.updates   [valor de Resend]                OFF (gris)
MX      send.updates                 10 feedback-smtp.resend.com      OFF (gris)
TXT     send.updates                 v=spf1 include:resend.com ~all   OFF (gris)
```

## ✅ Checklist Final

- [ ] DKIM TXT agregado con Proxy OFF
- [ ] SPF MX agregado con Proxy OFF
- [ ] SPF TXT agregado con Proxy OFF
- [ ] Esperado 5-15 minutos
- [ ] Verificado en Resend Dashboard
- [ ] Todos los estados en "Verified" (verde)

## 🧪 Probar Envío

Una vez verificado:

1. El dominio en Resend debería mostrar estado "Verified"
2. Los emails se enviarán desde `noreply@updates.superfocus.live`
3. Verifica que `RESEND_FROM_EMAIL` en Vercel sea correcto

## 🆘 Si Necesitas Ayuda

Si después de 30 minutos los registros siguen en "Failed":
1. Verifica los registros con: https://mxtoolbox.com/SuperTool.aspx
2. Asegúrate de que los valores sean visibles públicamente
3. Contacta a Resend support si persiste el problema

