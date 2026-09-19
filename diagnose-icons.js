const fs = require('fs');
const path = require('path');

console.log('=== DIAGNOSTIC DES ICÔNES MÉTÉOROLOGIQUES MANQUANTES ===\n');

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

console.log('\n2. Vérification des icônes manquantes...\n');

let missingIcons = [];
let totalExpected = 0;

periods.forEach(period => {
  const iconsDir = period === 'day' ? dayIconsDir : nightIconsDir;
  const existingIcons = fs.readdirSync(iconsDir)
    .filter(f => f.endsWith('.png'))
    .map(f => parseInt(f.replace('.png', ''), 10))
    .filter(n => !isNaN(n));
  
  console.log(`Icônes ${period}:`);
  console.log(`   - Existantes: ${existingIcons.length} icônes`);
  
  // Vérifier quels codes manquent
  const missingForPeriod = wmoCodes.filter(code => !existingIcons.includes(code));
  missingIcons.push(...missingForPeriod.map(code => ({ code, period })));
  
  if (missingForPeriod.length > 0) {
    console.log(`   - Manquantes: ${missingForPeriod.length} codes (${missingForPeriod.slice(0, 10).join(', ')}${missingForPeriod.length > 10 ? '...' : ''})`);
  } else {
    console.log(`   - ✅ Toutes les icônes sont présentes`);
  }
  
  totalExpected += wmoCodes.length;
});

console.log(`\nTotal d'icônes attendues: ${totalExpected} (${wmoCodes.length} codes × 2 périodes)`);
console.log(`Total d'icônes manquantes: ${missingIcons.length}`);

if (missingIcons.length > 0) {
  console.log('\n3. Codes WMO avec icônes manquantes:');
  missingIcons.forEach(({ code, period }) => {
    console.log(`   - Code ${code} (${period})`);
  });
  
  console.log('\n4. Impact sur l\'application:');
  console.log('   - Le code WMO 0 = ciel clair, 1 = peu nuageux, etc.');
  console.log('   - L\'absence d\'icônes peut causer des erreurs ou des images manquantes');
}

console.log('\n5. Test de la fonction getWeatherIcon...');
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
  
  // Tester quelques codes courants
  const testCodes = [0, 1, 2, 3, 45, 51, 61, 71, 80, 95];
  console.log('   Test de codes WMO courants:');
  
  testCodes.forEach(code => {
    const dayResult = testWeatherIcon(code, true);
    const nightResult = testWeatherIcon(code, false);
    
    console.log(`   - Code ${code}:`);
    console.log(`       Jour: ${dayResult.exists ? '✅' : '❌'} (${dayResult.path})`);
    console.log(`       Nuit: ${nightResult.exists ? '✅' : '❌'} (${nightResult.path})`);
  });
  
} catch (error) {
  console.log(`   ❌ Erreur: ${error.message}`);
}

console.log('\n6. Vérification des données météo réelles...');
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
    console.log(`\n⚠️  ATTENTION: ${missingUsedCodes.length} codes utilisés n\'ont pas d\'icônes!`);
    console.log(`   - Codes: ${missingUsedCodes.join(', ')}`);
    console.log(`   - Ceci cause les icônes manquantes dans l\'application`);
  } else {
    console.log('\n✅ Tous les codes utilisés ont des icônes');
  }
}

console.log('\n7. SOLUTIONS POUR LES ICÔNES MANQUANTES:');
console.log('   a) Télécharger les icônes manquantes depuis Open-Meteo');
console.log('   b) Utiliser un jeu d\'icônes alternatif compatible');
console.log('   c) Modifier le code pour afficher une icône par défaut quand manquante');
console.log('   d) Générer des icônes de secours avec des caractères ou SVG');

console.log('\n8. VÉRIFICATION DU CODE ACTUEL:');
// Lire weather-colors.ts pour vérifier la logique
const weatherColorsPath = path.join(__dirname, 'src', 'lib', 'weather-colors.ts');
if (fs.existsSync(weatherColorsPath)) {
  const content = fs.readFileSync(weatherColorsPath, 'utf8');
  const hasErrorHandling = content.includes('catch') || content.includes('error') || content.includes('default') || content.includes('fallback');
  
  console.log(`   - Fichier trouvé: ${weatherColorsPath}`);
  console.log(`   - Gestion d\'erreurs: ${hasErrorHandling ? '✅ Présente' : '❌ Absente'}`);
} else {
  console.log(`   - ❌ Fichier non trouvé: ${weatherColorsPath}`);
}

console.log('\n=== DIAGNOSTIC TERMINÉ ===');