const fs = require('fs');
const path = require('path');

const dayDir = path.join(__dirname, 'public', 'weather-icons', 'day');
const nightDir = path.join(__dirname, 'public', 'weather-icons', 'night');

// Les 72 codes manquants (non définis WMO)
const missingCodes = [
  4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44,
  46, 47,
  49, 50, 52, 54,
  58, 59, 60, 62, 64,
  68, 69, 70,
  72, 74, 76, 78, 79,
  83, 84, 87, 88, 89, 90, 91, 92, 93, 94,
  97, 98
];

console.log('=== Création des fichiers vides pour codes manquants ===\n');

const createdFiles = [];

missingCodes.forEach(code => {
  const dayFile = path.join(dayDir, `${code}.png`);
  const nightFile = path.join(nightDir, `${code}.png`);
  
  // Créer un fichier PNG minimal (1x1 pixel transparent)
  // PNG header + IHDR + IDAT + IEND
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  // PNG signature
    0x00, 0x00, 0x00, 0x0D,  // IHDR chunk length
    0x49, 0x48, 0x44, 0x52,  // IHDR
    0x00, 0x00, 0x00, 0x01,  // width: 1
    0x00, 0x00, 0x00, 0x01,  // height: 1
    0x08, 0x06, 0x00, 0x00, 0x00,  // bit depth, color type, compression, filter, interlace
    0x1F, 0x15, 0xC4, 0x89,  // CRC
    0x00, 0x00, 0x00, 0x0C,  // IDAT chunk length
    0x49, 0x44, 0x41, 0x54,  // IDAT
    0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x01, 0x01, 0x00, 0x05, 0x00, 0x1A,  // compressed data
    0x0B, 0x0C, 0x02, 0x50,  // CRC
    0x00, 0x00, 0x00, 0x00,  // IEND chunk length
    0x49, 0x45, 0x4E, 0x44,  // IEND
    0xAE, 0x42, 0x60, 0x82   // CRC
  ]);
  
  fs.writeFileSync(dayFile, pngBuffer);
  fs.writeFileSync(nightFile, pngBuffer);
  
  createdFiles.push({ code, day: dayFile, night: nightFile });
  console.log(`✅ Code ${code}: day/${code}.png, night/${code}.png`);
});

console.log(`\n=== ${createdFiles.length} codes créés (${createdFiles.length * 2} fichiers) ===`);

// Afficher tous les chemins
console.log('\n=== CHEMINS D\'ACCÈS ===\n');
console.log('DOSSIER JOUR:');
createdFiles.forEach(f => console.log(`  public/weather-icons/day/${f.code}.png`));

console.log('\nDOSSIER NUIT:');
createdFiles.forEach(f => console.log(`  public/weather-icons/night/${f.code}.png`));

// Mettre à jour weather-colors.ts avec descriptions par défaut
console.log('\n=== MISE À JOUR DES DESCRIPTIONS (weather-colors.ts) ===');
console.log('Ajoutez ces lignes dans WMO_DESCRIPTIONS :\n');

missingCodes.forEach(code => {
  let desc = "Non défini (code WMO réservé)";
  if (code >= 4 && code <= 44) desc = "Ciel - Non défini";
  else if (code === 46 || code === 47) desc = "Brouillard - Non défini";
  else if (code >= 49 && code <= 54) desc = "Bruine - Non défini";
  else if (code >= 58 && code <= 64) desc = "Pluie - Non défini";
  else if (code >= 68 && code <= 70) desc = "Pluie verglaçante - Non défini";
  else if (code >= 72 && code <= 79) desc = "Neige - Non défini";
  else if (code >= 83 && code <= 94) desc = "Averses - Non défini";
  else if (code >= 97 && code <= 98) desc = "Orage - Non défini";
  
  console.log(`  ${code}: "${desc}",`);
});

console.log('\n=== TERMINÉ ===');
console.log('Fichiers PNG 1x1 transparents créés pour tous les codes manquants.');
console.log('Vous pouvez maintenant les remplacer par vos vraies icônes.');