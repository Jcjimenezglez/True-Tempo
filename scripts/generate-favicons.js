const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../Superfocus-logo-black.svg');
const outputDir = __dirname.replace('/scripts', '');

// Tamaños de favicon a generar
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 }, // Apple recomienda 180x180
  { name: 'icon-72x72.png', size: 72 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'superfocus-logo.png', size: 512 }
];

async function generateFavicons() {
  try {
    console.log('Generando favicons desde el logo negro...');
    
    // Verificar que el SVG existe
    if (!fs.existsSync(svgPath)) {
      throw new Error(`No se encontró el archivo SVG: ${svgPath}`);
    }

    // Generar cada tamaño
    for (const { name, size } of sizes) {
      const outputPath = path.join(outputDir, name);
      
      await sharp(svgPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Fondo transparente
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Generado: ${name} (${size}x${size})`);
    }

    // Generar favicon.ico (usando 32x32 como base)
    const icoPath = path.join(outputDir, 'favicon.ico');
    await sharp(path.join(outputDir, 'favicon-32x32.png'))
      .resize(32, 32)
      .toFile(icoPath);
    
    console.log('✓ Generado: favicon.ico');
    console.log('\n¡Todos los favicons han sido generados exitosamente!');
    
  } catch (error) {
    console.error('Error al generar favicons:', error);
    process.exit(1);
  }
}

generateFavicons();

