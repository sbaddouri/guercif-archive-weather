const fs = require('fs');
const path = require('path');

console.log('=== VÉRIFICATION DE LA VALIDITÉ DES DONNÉES HORAIRES ===\n');

const hourlyDir = path.join(__dirname, 'data', 'hourly');

// Vérifier quelques fichiers pour 1999 (l'année problématique)
const year = '1999';
const yearHourlyDir = path.join(hourlyDir, year);

if (!fs.existsSync(yearHourlyDir)) {
  console.log(`❌ Dossier horaire manquant pour ${year}`);
  process.exit(1);
}

const months = fs.readdirSync(yearHourlyDir).sort();
console.log(`Vérification des données pour ${year}...\n`);

let totalFilesChecked = 0;
let invalidFiles = [];
let emptyFiles = [];
let wrongFormatFiles = [];

// Vérifier 30 fichiers (10 par mois pendant 3 mois)
const monthsToCheck = months.slice(0, 3);
monthsToCheck.forEach(month => {
  const monthHourlyDir = path.join(yearHourlyDir, month);
  const hourlyFiles = fs.readdirSync(monthHourlyDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .slice(0, 10); // 10 premiers jours du mois
  
  hourlyFiles.forEach(dayFile => {
    totalFilesChecked++;
    const day = dayFile.replace('.json', '');
    const filePath = path.join(monthHourlyDir, dayFile);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      // Vérification 1: Est-ce un tableau?
      if (!Array.isArray(data)) {
        wrongFormatFiles.push(`${year}-${month}-${day}: Pas un tableau (type: ${typeof data})`);
        return;
      }
      
      // Vérification 2: Le tableau est-il vide?
      if (data.length === 0) {
        emptyFiles.push(`${year}-${month}-${day}`);
        return;
      }
      
      // Vérification 3: A-t-il 24 heures?
      if (data.length !== 24) {
        console.log(`⚠️  ${year}-${month}-${day}: ${data.length} heures au lieu de 24`);
      }
      
      // Vérification 4: Les champs requis existent-ils?
      const sampleHour = data[0];
      const requiredFields = ['time', 'weather_code', 'temp', 'precipitation'];
      const missingFields = requiredFields.filter(field => sampleHour[field] === undefined);
      
      if (missingFields.length > 0) {
        invalidFiles.push(`${year}-${month}-${day}: Champs manquants: ${missingFields.join(', ')}`);
      }
      
      // Vérification 5: Les données temp sont-elles valides?
      const invalidTemps = data.filter(hour => 
        hour.temp !== null && (hour.temp < -50 || hour.temp > 60)
      );
      
      if (invalidTemps.length > 0) {
        console.log(`⚠️  ${year}-${month}-${day}: ${invalidTemps.length} températures extrêmes`);
      }
      
    } catch (error) {
      invalidFiles.push(`${year}-${month}-${day}: Erreur de parsing - ${error.message}`);
    }
  });
});

console.log('\n=== RÉSULTATS ===');
console.log(`Fichiers vérifiés: ${totalFilesChecked}`);
console.log(`Fichiers vides: ${emptyFiles.length}`);
console.log(`Fichiers mauvais format: ${wrongFormatFiles.length}`);
console.log(`Fichiers invalides: ${invalidFiles.length}`);

if (emptyFiles.length > 0) {
  console.log('\nFichiers vides:');
  emptyFiles.slice(0, 5).forEach(file => console.log(`  - ${file}`));
  if (emptyFiles.length > 5) console.log(`  ... et ${emptyFiles.length - 5} autres`);
}

if (wrongFormatFiles.length > 0) {
  console.log('\nFichiers mauvais format:');
  wrongFormatFiles.slice(0, 5).forEach(file => console.log(`  - ${file}`));
}

if (invalidFiles.length > 0) {
  console.log('\nFichiers invalides:');
  invalidFiles.slice(0, 5).forEach(file => console.log(`  - ${file}`));
}

// Vérifier aussi un fichier spécifique qui pourrait causer des problèmes
console.log('\n=== TEST DÉTAILLÉ POUR 1999-01-01 ===');
const testFile = path.join(hourlyDir, '1999', '01', '01.json');
if (fs.existsSync(testFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(testFile, 'utf8'));
    console.log(`Données: ${data.length} heures`);
    console.log('Structure du premier élément:');
    console.log(JSON.stringify(data[0], null, 2));
    
    // Vérifier si les données sont bonnes pour Recharts
    const hasTemp = data.every(hour => hour.temp !== undefined);
    const hasPrecipitation = data.every(hour => hour.precipitation !== undefined);
    console.log(`\n✓ Toutes les heures ont 'temp': ${hasTemp}`);
    console.log(`✓ Toutes les heures ont 'precipitation': ${hasPrecipitation}`);
    
    // Vérifier les valeurs null
    const nullTemps = data.filter(hour => hour.temp === null).length;
    const nullPrecip = data.filter(hour => hour.precipitation === null).length;
    console.log(`\nHeures avec temp=null: ${nullTemps}/24`);
    console.log(`Heures avec precipitation=null: ${nullPrecip}/24`);
    
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

// Recommandations
console.log('\n=== RECOMMANDATIONS ===');
if (emptyFiles.length > 0 || invalidFiles.length > 0) {
  console.log('1. Corriger les fichiers problématiques:');
  console.log('   - Remplacer les fichiers vides par des tableaux avec 24 heures de données nulles');
  console.log('   - Vérifier le format JSON des fichiers invalides');
  
  console.log('\n2. Modifier WeatherChart pour mieux gérer:');
  console.log('   - Données vides []');
  console.log('   - Données avec valeurs null');
  console.log('   - Tableaux de longueur incorrecte');
} else {
  console.log('✅ Les données semblent valides. Le problème est ailleurs.');
}