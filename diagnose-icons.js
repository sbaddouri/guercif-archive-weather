const fs = require('fs');
const path = require('path');

console.log('=== DIAGNOSTIC DES ICÔNES MÉTÉOROLOGIQUES (Système Numérique 0-99) ===\n');

// Chemins des icônes
const dayIconsDir = path.join(__dirname, 'public', 'weather-icons', 'day');
const nightIconsDir = path.join(__dirname, 'public', 'weather-icons', 'night');

// Codes WMO standards (de 0 à 99)
const wmoCodes = Array.from({ length: 100 }, (_, i) => i);
const periods = ['day', 'night'];

console.log('1. Vérification des dossiers d\'icônes...');
console.log(`   - ${dayIconsDir}: ${fs.existsSync(dayIconsDir) ? '✅ Existe' : '❌ Manquant'}`);
console.log(`   - ${nightIconsDir}: ${fs.existsSync(nightIconsDir) ? '✅ Existe' : '❌ Manquant'}`);

if (!fs.existsSync(dayIconsDir) || !fs.existsSync(nightIconsDir)) {
  console.log('\n❌ Dossiers d\'icônes manquants. Arrêt.');
  process.exit(1);
}

console.log('\n2. Vérification des icônes (système numérique 0-99)...\n');

let missingIcons = [];
let totalExpected = 0;

periods.forEach(period => {
  const iconsDir = period === 'day' ? dayIconsDir : nightIconsDir;
  const existingIcons = fs.readdirSync(iconsDir)
    .filter(f => f.endsWith('.png'))
    .map(f => parseInt(f.replace('.png', ''), 10))
    .filter(n => !isNaN(n) && n >= 0 && n <= 99);
  
  console.log(`Icônes ${period}:`);
  console.log(`   - Existantes (format numérique 0-99): ${existingIcons.length} icônes`);
  
  // Vérifier quels codes manquent
  const missingForPeriod = wmoCodes.filter(code => !existingIcons.includes(code));
  missingIcons.push(...missingForPeriod.map(code => ({ code, period })));
  
  if (missingForPeriod.length > 0) {
    console.log(`   - Manquantes: ${missingForPeriod.length} codes (${missingForPeriod.slice(0, 10).join(', ')}${missingForPeriod.length > 10 ? '...' : ''})`);
  } else {
    console.log(`   - ✅ Toutes les icônes numériques sont présentes`);
  }
  
  totalExpected += wmoCodes.length;
});

console.log(`\nTotal d'icônes attendues: ${totalExpected} (${wmoCodes.length} codes × 2 périodes)`);
console.log(`Total d'icônes numériques manquantes: ${missingIcons.length}`);

// Codes WMO officiellement définis vs non définis
const definedCodes = [0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99];
const undefinedCodes = wmoCodes.filter(c => !definedCodes.includes(c));

console.log('\n3. Analyse par type de code WMO:');
console.log(`   - Codes WMO officiellement définis (${definedCodes.length}): ${definedCodes.join(', ')}`);
console.log(`   - Codes WMO non définis/réservés (${undefinedCodes.length}): ${undefinedCodes.slice(0, 20).join(', ')}${undefinedCodes.length > 20 ? '...' : ''}`);

const missingDefined = missingIcons.filter(({ code }) => definedCodes.includes(code));
const missingUndefined = missingIcons.filter(({ code }) => undefinedCodes.includes(code));

console.log(`\n   - Icônes manquantes pour codes DÉFINIS: ${missingDefined.length} (${missingDefined.map(m => m.code).join(', ')})`);
console.log(`   - Icônes manquantes pour codes NON DÉFINIS: ${missingUndefined.length} (normal, utiliseront emoji fallback)`);

if (missingDefined.length > 0) {
  console.log('\n⚠️  ATTENTION: Certains codes WMO officiellement définis n\'ont pas d\'icônes !');
  missingDefined.forEach(({ code, period }) => {
    console.log(`   - Code ${code} (${period})`);
  });
}

console.log('\n4. Test de la fonction getWeatherIcon (simulation)...');
try {
  // Simuler la fonction getWeatherIcon
  const testWeatherIcon = (wmoCode, isDay) => {
    const period = isDay ? 'day' : 'night';
    const iconPath = `/weather-icons/${period}/${wmoCode}.png`;
    const fullPath = path.join(__dirname, 'public', iconPath.substring(1));
    return {
      path: iconPath,
      exists: fs.existsSync(fullPath),
      wmoCode,
      period
    };
  };
  
  // Tester tous les codes WMO définis
  console.log('   Test des codes WMO officiellement définis:');
  
  definedCodes.forEach(code => {
    const dayResult = testWeatherIcon(code, true);
    const nightResult = testWeatherIcon(code, false);
    
    const status = dayResult.exists && nightResult.exists ? '✅' : '❌';
    console.log(`   ${status} Code ${code}: Jour=${dayResult.exists ? '✅' : '❌'}, Nuit=${nightResult.exists ? '✅' : '❌'}`);
  });
  
  // Tester quelques codes non définis
  console.log('\n   Test de quelques codes NON définis (doivent utiliser fallback emoji):');
  [4, 10, 50, 70, 90].forEach(code => {
    const dayResult = testWeatherIcon(code, true);
    const nightResult = testWeatherIcon(code, false);
    
    console.log(`   ℹ️  Code ${code}: Jour=${dayResult.exists ? '✅' : '❌ (fallback emoji)'}, Nuit=${nightResult.exists ? '✅' : '❌ (fallback emoji)'}`);
  });
  
} catch (error) {
  console.log(`   ❌ Erreur: ${error.message}`);
}

console.log('\n5. Vérification des données météo réelles...');
console.log('   Analyse des fichiers horaires pour voir quels codes sont utilisés...');

// Analyser un échantillon de données
const hourlyDir = path.join(__dirname, 'data', 'hourly');
const sampleYear = '1999';
const sampleMonth = '01';

if (fs.existsSync(path.join(hourlyDir, sampleYear, sampleMonth))) {
  const hourlyFiles = fs.readdirSync(path.join(hourlyDir, sampleYear, sampleMonth))
    .filter(f => f.endsWith('.json'))
    .slice(0, 5); // 5 premiers jours
  
  const usedCodes = new Set();
  
  hourlyFiles.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(hourlyDir, sampleYear, sampleMonth, file), 'utf8'));
      data.forEach(hour => {
        if (hour.weather_code !== undefined) {
          usedCodes.add(hour.weather_code);
        }
      });
    } catch (error) {
      // Ignorer les erreurs
    }
  });
  
  console.log(`   Codes WMO utilisés dans les données de ${sampleYear}-${sampleMonth}:`);
  console.log(`   - ${Array.from(usedCodes).sort((a, b) => a - b).join(', ')}`);
  
  // Vérifier si les codes utilisés ont des icônes
  const missingUsedCodes = Array.from(usedCodes).filter(code => {
    const dayPath = path.join(dayIconsDir, `${code}.png`);
    const nightPath = path.join(nightIconsDir, `${code}.png`);
    return !fs.existsSync(dayPath) || !fs.existsSync(nightPath);
  });
  
  if (missingUsedCodes.length > 0) {
    console.log(`\n⚠️  ATTENTION: ${missingUsedCodes.length} codes utilisés n'ont pas d'icônes!`);
    console.log(`   - Codes: ${missingUsedCodes.join(', ')}`);
    console.log(`   - Ces codes utiliseront le fallback emoji (fonctionne correctement)`);
  } else {
    console.log('\n✅ Tous les codes utilisés ont des icônes');
  }
}

console.log('\n6. COMMENT AJOUTER DE NOUVELLES ICÔNES:');
console.log('   1. Créez deux fichiers PNG: {code}.png pour jour et nuit');
console.log('   2. Placez-les dans:');
console.log('      - public/weather-icons/day/{code}.png');
console.log('      - public/weather-icons/night/{code}.png');
console.log('   3. Ajoutez la description dans WMO_DESCRIPTIONS (weather-colors.ts)');
console.log('   4. Ajoutez les emojis dans WMO_EMOJIS si nécessaire');
console.log('   5. C\'est tout ! Le système détecte automatiquement les nouveaux fichiers.');

console.log('\n7. AVANTAGES DU NOUVEAU SYSTÈME:');
console.log('   ✅ Utilise TOUS les codes WMO (0-99)');
console.log('   ✅ Nommage simple et prévisible: 0.png, 1.png, ... 99.png');
console.log('   ✅ Ajout d\'icônes = déposer un fichier, pas de modification de code');
console.log('   ✅ Fallback automatique sur emojis si icône manquante');
console.log('   ✅ Compatible avec futures extensions WMO');

console.log('\n=== DIAGNOSTIC TERMINÉ ===');