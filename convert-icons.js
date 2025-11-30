const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsPath = path.join(__dirname, 'assets', 'images');

// Criar ícone principal (1024x1024)
const iconSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#FFFFFF" rx="180"/>
  <text x="512" y="700" font-family="Arial, sans-serif" font-size="600" font-weight="bold" fill="#16a34a" text-anchor="middle">M</text>
</svg>`;

// Android foreground (432x432)
const foregroundSvg = `
<svg width="432" height="432" xmlns="http://www.w3.org/2000/svg">
  <text x="216" y="300" font-family="Arial, sans-serif" font-size="280" font-weight="bold" fill="#16a34a" text-anchor="middle">M</text>
</svg>`;

// Android background (432x432)
const backgroundSvg = `
<svg width="432" height="432" xmlns="http://www.w3.org/2000/svg">
  <rect width="432" height="432" fill="#dcfce7"/>
</svg>`;

// Android monochrome (432x432)
const monochromeSvg = `
<svg width="432" height="432" xmlns="http://www.w3.org/2000/svg">
  <text x="216" y="300" font-family="Arial, sans-serif" font-size="280" font-weight="bold" fill="#000000" text-anchor="middle">M</text>
</svg>`;

// Splash icon (200x200)
const splashSvg = `
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <text x="100" y="155" font-family="Arial, sans-serif" font-size="150" font-weight="bold" fill="#16a34a" text-anchor="middle">M</text>
</svg>`;

async function convertIcons() {
  try {
    console.log('Convertendo ícones...');
    
    // Icon principal
    await sharp(Buffer.from(iconSvg))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsPath, 'icon.png'));
    console.log('✓ icon.png criado');
    
    // Android foreground
    await sharp(Buffer.from(foregroundSvg))
      .resize(432, 432)
      .png()
      .toFile(path.join(assetsPath, 'android-icon-foreground.png'));
    console.log('✓ android-icon-foreground.png criado');
    
    // Android background
    await sharp(Buffer.from(backgroundSvg))
      .resize(432, 432)
      .png()
      .toFile(path.join(assetsPath, 'android-icon-background.png'));
    console.log('✓ android-icon-background.png criado');
    
    // Android monochrome
    await sharp(Buffer.from(monochromeSvg))
      .resize(432, 432)
      .png()
      .toFile(path.join(assetsPath, 'android-icon-monochrome.png'));
    console.log('✓ android-icon-monochrome.png criado');
    
    // Splash icon
    await sharp(Buffer.from(splashSvg))
      .resize(200, 200)
      .png()
      .toFile(path.join(assetsPath, 'splash-icon.png'));
    console.log('✓ splash-icon.png criado');
    
    console.log('\n✅ Todos os ícones foram criados com sucesso!');
    console.log('Execute: npx expo start --clear');
  } catch (error) {
    console.error('Erro ao converter ícones:', error);
  }
}

convertIcons();
