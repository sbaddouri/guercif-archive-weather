const fs = require('fs');
const path = require('path');

// Mapping des anciens noms descriptifs vers les codes WMO
const iconMapping = {
  // Ciel
  'ciel-degage': 0,
  'ciel-voile': 1,
  'eclaircies': 2,
  'couvert': 3,
  
  // Brouillard
  'brouillard': 45,  // aussi pour 48
  
  // Bruine
  'bruine': 51,  // aussi pour 53, 55
  
  // Pluie verglaçante
  'pluie-verglacante': 56,  // aussi pour 57, 66, 67
  
  // Pluie
  'pluie-faible': 61,
  'pluie': 63,  // aussi pour 65
  
  // Neige
  'neige': 71,  // aussi pour 73, 75, 77
  
  // Averses de pluie
  'averses-pluie': 80,  // aussi pour 81, 82
  
  // Averses de neige
  'averses-neige': 85,  // aussi pour 86
  
  // Orage
  'orage': 95  // aussi pour 96, 99
};

// Codes qui partagent la même icône
const sharedIcons = {
  48: 45,   // brouillard givrant -> brouillard
  53: 51,   // bruine modérée -> bruine faible
  55: 51,   // bruine forte -> bruine faible
  57: 56,   // bruine verglaçante forte -> bruine verglaçante faible
  66: 56,   // pluie verglaçante faible -> bruine verglaçante faible
  67: 56,   // pluie verglaçante forte -> bruine verglaçante faible
  63: 61,   // pluie modérée -> pluie faible
  65: 61,   // pluie forte -> pluie faible
  73: 71,   // neige modérée -> neige faible
  75: 71,   // neige forte -> neige faible
  77: 71,   // grains de neige -> neige faible
  81: 80,   // averses modérées -> averses faibles
  82: 80,   // averses violentes -> averses faibles
  86: 85,   // averses neige fortes -> averses neige faibles
  96: 95,   // orage grêle faible -> orage
  99: 95    // orage grêle forte -> orage
};

const dayDir = path.join(__dirname, 'public', 'weather-icons', 'day');
const nightDir = path.join(__dirname, 'public', 'weather-icons', 'night');

console.log('=== Création des icônes numériques (0-99) ===\n');

// Copier les icônes existantes vers leurs nouveaux noms numériques
Object.entries(iconMapping).forEach(([oldName, code]) => {
  const daySrc = path.join(dayDir, `${oldName}.png`);
  const nightSrc = path.join(nightDir, `${oldName}.png`);
  
  const dayDest = path.join(dayDir, `${code}.png`);
  const nightDest = path.join(nightDir, `${code}.png`);
  
  if (fs.existsSync(daySrc)) {
    fs.copyFileSync(daySrc, dayDest);
    console.log(`✓ Jour: ${oldName}.png -> ${code}.png`);
  }
  if (fs.existsSync(nightSrc)) {
    fs.copyFileSync(nightSrc, nightDest);
    console.log(`✓ Nuit: ${oldName}.png -> ${code}.png`);
  }
});

// Créer les icônes partagées (copies)
Object.entries(sharedIcons).forEach(([code, sourceCode]) => {
  const daySrc = path.join(dayDir, `${sourceCode}.png`);
  const nightSrc = path.join(nightDir, `${sourceCode}.png`);
  
  const dayDest = path.join(dayDir, `${code}.png`);
  const nightDest = path.join(nightDir, `${code}.png`);
  
  if (fs.existsSync(daySrc)) {
    fs.copyFileSync(daySrc, dayDest);
    console.log(`✓ Jour: ${sourceCode}.png -> ${code}.png (partagé)`);
  }
  if (fs.existsSync(nightSrc)) {
    fs.copyFileSync(nightSrc, nightDest);
    console.log(`✓ Nuit: ${sourceCode}.png -> ${code}.png (partagé)`);
  }
});

// Vérifier les codes manquants (0-99)
console.log('\n=== Vérification des codes 0-99 ===');
const missingDay = [];
const missingNight = [];

for (let code = 0; code <= 99; code++) {
  const dayFile = path.join(dayDir, `${code}.png`);
  const nightFile = path.join(nightDir, `${code}.png`);
  
  if (!fs.existsSync(dayFile)) missingDay.push(code);
  if (!fs.existsSync(nightFile)) missingNight.push(code);
}

console.log(`\nCodes manquants Jour: ${missingDay.length} (${missingDay.slice(0, 20).join(', ')}${missingDay.length > 20 ? '...' : ''})`);
console.log(`Codes manquants Nuit: ${missingNight.length} (${missingNight.slice(0, 20).join(', ')}${missingNight.length > 20 ? '...' : ''})`);

// Pour les codes vraiment manquants, on pourrait générer des SVG simples
// Mais pour l'instant, le système fallback sur les emojis fonctionne

console.log('\n=== Terminé ===');
console.log('Les icônes existantes ont été copiées vers les noms numériques.');
console.log('Les codes partagés utilisent la même icône que leur code principal.');
console.log('Pour les codes sans icône, l\'application utilisera les emojis de fallback.');