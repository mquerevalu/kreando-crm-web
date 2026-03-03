const fs = require('fs');
const path = require('path');

// SVG content
const svgContent = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <!-- Fondo verde WhatsApp -->
  <rect width="512" height="512" fill="#008069" rx="128"/>
  
  <!-- Icono de chat -->
  <g transform="translate(128, 128)">
    <!-- Burbuja de chat -->
    <path d="M128 0C57.3 0 0 57.3 0 128c0 25.3 7.3 48.9 20 68.9L0 256l59.1-20C79.1 248.7 102.7 256 128 256c70.7 0 128-57.3 128-128S198.7 0 128 0z" 
          fill="white"/>
    
    <!-- Puntos del chat -->
    <circle cx="80" cy="128" r="16" fill="#008069"/>
    <circle cx="128" cy="128" r="16" fill="#008069"/>
    <circle cx="176" cy="128" r="16" fill="#008069"/>
  </g>
</svg>`;

// Para generar PNGs desde SVG, necesitamos usar una herramienta externa
// Opción 1: Usar sharp (requiere instalación: npm install sharp)
// Opción 2: Usar un servicio online
// Opción 3: Usar ImageMagick desde línea de comandos

console.log('Para generar los iconos PNG, tienes 3 opciones:');
console.log('');
console.log('OPCIÓN 1 - Usar sharp (recomendado):');
console.log('  1. Instalar: npm install sharp');
console.log('  2. Ejecutar: node generate-icons-sharp.js');
console.log('');
console.log('OPCIÓN 2 - Usar servicio online:');
console.log('  1. Ir a: https://cloudconvert.com/svg-to-png');
console.log('  2. Subir: public/icon.svg');
console.log('  3. Convertir a 192x192 y 512x512');
console.log('  4. Guardar como icon-192.png e icon-512.png en public/');
console.log('');
console.log('OPCIÓN 3 - Usar ImageMagick (si está instalado):');
console.log('  convert public/icon.svg -resize 192x192 public/icon-192.png');
console.log('  convert public/icon.svg -resize 512x512 public/icon-512.png');
console.log('');
console.log('Creando script con sharp...');

// Crear script con sharp
const sharpScript = `const sharp = require('sharp');
const fs = require('fs');

const svgBuffer = Buffer.from(\`${svgContent}\`);

async function generateIcons() {
  try {
    // Generar icon-192.png
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile('public/icon-192.png');
    console.log('✓ icon-192.png generado');

    // Generar icon-512.png
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile('public/icon-512.png');
    console.log('✓ icon-512.png generado');

    console.log('');
    console.log('Iconos generados exitosamente!');
  } catch (error) {
    console.error('Error generando iconos:', error);
    console.log('');
    console.log('Si sharp no está instalado, ejecuta: npm install sharp');
  }
}

generateIcons();
`;

fs.writeFileSync('generate-icons-sharp.js', sharpScript);
console.log('✓ Script generate-icons-sharp.js creado');
console.log('');
console.log('Para usar sharp, ejecuta:');
console.log('  npm install sharp && node generate-icons-sharp.js');
