const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Obtener el nombre del archivo desde los argumentos de línea de comandos
const args = process.argv.slice(2);
const outputDir = __dirname.replace('/scripts', '');

// Si se proporciona un argumento, usarlo; si no, buscar archivos PNG en la raíz
let sourcePngPath;
if (args.length > 0) {
  sourcePngPath = path.join(outputDir, args[0]);
} else {
  // Buscar archivos PNG en la raíz que no sean los que vamos a generar
  const excludedFiles = ['og-image.png', 'superfocus-logo.png', 'favicon-16x16.png', 
    'favicon-32x32.png', 'apple-touch-icon.png', 'icon-72x72.png', 'icon-96x96.png',
    'icon-144x144.png', 'icon-192x192.png', 'icon-512x512.png'];
  
  const files = fs.readdirSync(outputDir).filter(file => 
    file.endsWith('.png') && !excludedFiles.includes(file)
  );
  
  if (files.length === 0) {
    console.error('❌ No se encontró ningún archivo PNG en la raíz del proyecto.');
    console.error('   Por favor, coloca tu archivo PNG en la raíz y ejecuta:');
    console.error('   node scripts/update-logo-from-png.js nombre-del-archivo.png');
    process.exit(1);
  } else if (files.length === 1) {
    sourcePngPath = path.join(outputDir, files[0]);
    console.log(`📁 Usando archivo encontrado: ${files[0]}\n`);
  } else {
    console.error('❌ Se encontraron múltiples archivos PNG. Por favor, especifica cuál usar:');
    files.forEach((file, i) => console.error(`   ${i + 1}. ${file}`));
    console.error('\n   Ejecuta: node scripts/update-logo-from-png.js nombre-del-archivo.png');
    process.exit(1);
  }
}

// Tamaños de favicon a generar
const faviconSizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-72x72.png', size: 72 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'superfocus-logo.png', size: 512 }
];

async function generateFaviconsAndOgImage() {
  try {
    console.log('🔄 Generando favicons y og-image desde PNG...\n');
    
    // Verificar que el PNG existe
    if (!fs.existsSync(sourcePngPath)) {
      throw new Error(`❌ No se encontró el archivo PNG: ${sourcePngPath}\n   Por favor, coloca tu archivo PNG en la raíz del proyecto y actualiza la variable 'sourcePngPath' en este script.`);
    }

    console.log(`✓ Archivo fuente encontrado: ${path.basename(sourcePngPath)}\n`);

    // Generar cada tamaño de favicon
    console.log('📦 Generando favicons...');
    for (const { name, size } of faviconSizes) {
      const outputPath = path.join(outputDir, name);
      
      await sharp(sourcePngPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 } // Fondo blanco sólido
        })
        .png()
        .toFile(outputPath);
      
      console.log(`  ✓ ${name} (${size}x${size})`);
    }

    // Generar favicon.ico (usando 32x32 como base)
    console.log('\n📦 Generando favicon.ico...');
    const icoPath = path.join(outputDir, 'favicon.ico');
    await sharp(path.join(outputDir, 'favicon-32x32.png'))
      .resize(32, 32)
      .toFile(icoPath);
    console.log('  ✓ favicon.ico');

    // Generar og-image.png (1200x630 para Open Graph)
    console.log('\n🖼️  Generando og-image.png (1200x630)...');
    const ogImagePath = path.join(outputDir, 'og-image.png');
    
    // Crear una imagen con fondo blanco y el logo centrado
    const logo = await sharp(sourcePngPath)
      .resize(1000, 500, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toBuffer();

    await sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([
        {
          input: logo,
          gravity: 'center'
        }
      ])
      .png()
      .toFile(ogImagePath);
    
    console.log('  ✓ og-image.png (1200x630)');

    console.log('\n✅ ¡Todos los archivos han sido generados exitosamente!');
    console.log('\n📝 Archivos generados:');
    console.log('   - Todos los favicons (16x16, 32x32, 72x72, etc.)');
    console.log('   - favicon.ico');
    console.log('   - og-image.png (para Google y redes sociales)');
    console.log('\n💡 Nota: Puede tomar unos minutos para que Google actualice la imagen en los resultados de búsqueda.');
    
  } catch (error) {
    console.error('\n❌ Error al generar archivos:', error.message);
    process.exit(1);
  }
}

generateFaviconsAndOgImage();

