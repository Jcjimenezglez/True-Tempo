#!/bin/bash

# Script wrapper para ejecutar update-trial-to-1-month.js con las variables de entorno correctas

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Buscando archivo de configuración..."

# Buscar archivo .env
if [ -f .env.local ]; then
    echo -e "${GREEN}✅ Encontrado .env.local${NC}"
    ENV_FILE=".env.local"
elif [ -f .env ]; then
    echo -e "${GREEN}✅ Encontrado .env${NC}"
    ENV_FILE=".env"
elif [ -f .env.vercel.tmp ]; then
    echo -e "${YELLOW}⚠️  Usando .env.vercel.tmp${NC}"
    ENV_FILE=".env.vercel.tmp"
else
    echo -e "${RED}❌ No se encontró ningún archivo .env${NC}"
    echo ""
    echo "Por favor, crea un archivo .env.local con:"
    echo "STRIPE_SECRET_KEY=sk_live_..."
    echo "STRIPE_PRICE_ID=price_..."
    exit 1
fi

# Cargar variables de entorno
echo "📦 Cargando variables de entorno desde $ENV_FILE..."
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Verificar que STRIPE_SECRET_KEY exista
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${RED}❌ STRIPE_SECRET_KEY no está configurada en $ENV_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Variables de entorno cargadas${NC}"
echo ""
echo "🚀 Ejecutando script de actualización..."
echo ""

# Ejecutar el script
node scripts/update-trial-to-1-month.js

# Capturar el exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Script ejecutado exitosamente${NC}"
else
    echo ""
    echo -e "${RED}❌ Error al ejecutar el script (exit code: $EXIT_CODE)${NC}"
fi

exit $EXIT_CODE

