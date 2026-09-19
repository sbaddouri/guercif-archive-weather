const fs = require('fs');
const path = require('path');

console.log('=== VÉRIFICATION DES DONNÉES HORAIRES MANQUANTES ===\n');

const dailyDir = path.join(__dirname, 'data', 'daily');
const hourlyDir = path.join(__dirname, 'data', 'hourly');

if (!fs.existsSync(dailyDir) || !fs.existsSync(hourlyDir)) {
  console.log('Erreur: Dossiers data/daily ou data/hourly manquants');
  process.exit(1);
}

const years = fs.readdirSync(dailyDir).sort();
let totalDays = 0;
let missingHourly = 0;
const missingFiles = [];

console.log('Analyse en cours...\n');

// Pour chaque année
years.forEach(year => {
  const yearDailyDir = path.join(dailyDir, year);
  const yearHourlyDir = path.join(hourlyDir, year);
  
  if (!fs.existsSync(yearHourlyDir)) {
    console.log(`⚠️  Dossier horaire manquant pour ${year}`);
    return;
  }
  
  const months = fs.readdirSync(yearDailyDir).sort();
  
  // Pour chaque mois
  months.forEach(month => {
    const monthDailyDir = path.join(yearDailyDir, month);
    const monthHourlyDir = path.join(yearHourlyDir, month);
    
    if (!fs.existsSync(monthHourlyDir)) {
      console.log(`⚠️  Dossier horaire manquant pour ${year}/${month}`);
      return;
    }
    
    const dailyFiles = fs.readdirSync(monthDailyDir)
      .filter(f => f.endsWith('.json'))
      .sort();
    
    // Pour chaque jour
    dailyFiles.forEach(dayFile => {
      totalDays++;
      const day = dayFile.replace('.json', '');
      const hourlyPath = path.join(monthHourlyDir, dayFile);
      
      if (!fs.existsSync(hourlyPath)) {
        missingHourly++;
        missingFiles.push(`${year}-${month}-${day}`);
        
        // Afficher seulement les 20 premiers
        if (missingFiles.length <= 20) {
          console.log(`❌ ${year}-${month}-${day}: données horaires manquantes`);
        }
      }
    });
  });
});

console.log('\n=== RÉSUMÉ ===');
console.log(`Jours totaux avec données quotidiennes: ${totalDays}`);
console.log(`Jours SANS données horaires: ${missingHourly}`);
console.log(`Pourcentage manquant: ${((missingHourly / totalDays) * 100).toFixed(2)}%`);

if (missingHourly > 0) {
  console.log('\n=== SOLUTIONS ===');
  console.log('1. Option A: Récupérer les données manquantes');
  console.log('   - Exécuter les scripts de mise à jour des données');
  console.log('   - Vérifier les fichiers de configuration Open-Meteo');
  
  console.log('\n2. Option B: Modifier le code pour gérer les données manquantes');
  console.log('   - Modifier generateStaticParams pour ignorer les jours sans données');
  console.log('   - Modifier la page pour afficher un message au lieu d\'un graphique');
  
  console.log('\n3. Option C: Générer des données de secours');
  console.log('   - Créer un script pour générer des données horaires vides');
  
  // Écrire la liste complète dans un fichier
  const outputFile = path.join(__dirname, 'missing-hourly-days.txt');
  fs.writeFileSync(outputFile, missingFiles.join('\n'));
  console.log(`\nListe complète sauvegardée dans: ${outputFile}`);
  
  // Vérifier aussi la validité des fichiers existants
  console.log('\n=== VÉRIFICATION RAPIDE DES FICHIERS EXISTANTS ===');
  let corruptedFiles = 0;
  
  // Vérifier 10 fichiers au hasard
  const sampleYears = years.slice(0, 2);
  sampleYears.forEach(year => {
    const months = fs.readdirSync(path.join(dailyDir, year)).slice(0, 1);
    months.forEach(month => {
      const dailyFiles = fs.readdirSync(path.join(dailyDir, year, month))
        .filter(f => f.endsWith('.json'))
        .slice(0, 3);
      
      dailyFiles.forEach(dayFile => {
        const hourlyPath = path.join(hourlyDir, year, month, dayFile);
        if (fs.existsSync(hourlyPath)) {
          try {
            const data = JSON.parse(fs.readFileSync(hourlyPath, 'utf8'));
            if (!Array.isArray(data) || data.length === 0) {
              console.log(`⚠️  ${year}-${month}-${dayFile.replace('.json', '')}: données horaires vides ou invalides`);
              corruptedFiles++;
            }
          } catch (error) {
            console.log(`❌ ${year}-${month}-${dayFile.replace('.json', '')}: erreur de parsing JSON`);
            corruptedFiles++;
          }
        }
      });
    });
  });
  
  if (corruptedFiles > 0) {
    console.log(`\n⚠️  ${corruptedFiles} fichiers horaires sont corrompus ou vides`);
  }
} else {
  console.log('\n✅ Tous les jours ont des données horaires!');
}