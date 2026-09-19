const fs = require('fs');
const path = require('path');

function checkDataIntegrity(year) {
  console.log(`=== VÉRIFICATION DE L'INTÉGRITÉ DES DONNÉES POUR ${year} ===\n`);
  
  const dailyDir = path.join(__dirname, 'data', 'daily', year);
  const hourlyDir = path.join(__dirname, 'data', 'hourly', year);
  
  if (!fs.existsSync(dailyDir) || !fs.existsSync(hourlyDir)) {
    console.log(`Données manquantes pour ${year}`);
    return;
  }
  
  const months = fs.readdirSync(dailyDir).sort();
  let totalDays = 0;
  let daysWithIssues = 0;
  const issues = [];
  
  months.forEach(month => {
    const monthDailyDir = path.join(dailyDir, month);
    const monthHourlyDir = path.join(hourlyDir, month);
    
    if (!fs.existsSync(monthHourlyDir)) {
      issues.push(`Mois ${month}: dossier horaire manquant`);
      return;
    }
    
    const dailyFiles = fs.readdirSync(monthDailyDir).filter(f => f.endsWith('.json')).sort();
    
    dailyFiles.forEach(dayFile => {
      totalDays++;
      const day = dayFile.replace('.json', '');
      const dailyPath = path.join(monthDailyDir, dayFile);
      const hourlyPath = path.join(monthHourlyDir, dayFile);
      
      try {
        // Vérifier les données quotidiennes
        const dailyData = JSON.parse(fs.readFileSync(dailyPath, 'utf8'));
        
        // Vérifications des données quotidiennes
        if (!dailyData.date) {
          issues.push(`${year}-${month}-${day}: champ 'date' manquant`);
          daysWithIssues++;
        }
        if (dailyData.weather_code === undefined) {
          issues.push(`${year}-${month}-${day}: champ 'weather_code' manquant`);
          daysWithIssues++;
        }
        if (dailyData.sunrise && !dailyData.sunrise.includes('T')) {
          issues.push(`${year}-${month}-${day}: format de sunrise incorrect: ${dailyData.sunrise}`);
          daysWithIssues++;
        }
        if (dailyData.sunset && !dailyData.sunset.includes('T')) {
          issues.push(`${year}-${month}-${day}: format de sunset incorrect: ${dailyData.sunset}`);
          daysWithIssues++;
        }
        
        // Vérifier les données horaires
        if (!fs.existsSync(hourlyPath)) {
          issues.push(`${year}-${month}-${day}: données horaires manquantes`);
          daysWithIssues++;
        } else {
          const hourlyData = JSON.parse(fs.readFileSync(hourlyPath, 'utf8'));
          
          if (!Array.isArray(hourlyData)) {
            issues.push(`${year}-${month}-${day}: données horaires pas un tableau`);
            daysWithIssues++;
          } else if (hourlyData.length !== 24) {
            issues.push(`${year}-${month}-${day}: données horaires n'ont pas 24 heures (${hourlyData.length})`);
            daysWithIssues++;
          } else {
            // Vérifier chaque heure
            hourlyData.forEach((hour, index) => {
              if (!hour.time) {
                issues.push(`${year}-${month}-${day} heure ${index}: champ 'time' manquant`);
                daysWithIssues++;
              }
              if (hour.weather_code === undefined) {
                issues.push(`${year}-${month}-${day} heure ${index}: champ 'weather_code' manquant`);
                daysWithIssues++;
              }
              if (hour.estimated_hourly_sunshine_minutes === undefined) {
                issues.push(`${year}-${month}-${day} heure ${index}: champ 'estimated_hourly_sunshine_minutes' manquant`);
                daysWithIssues++;
              }
            });
          }
        }
      } catch (error) {
        issues.push(`${year}-${month}-${day}: erreur de lecture/parsing - ${error.message}`);
        daysWithIssues++;
      }
    });
  });
  
  console.log(`Résumé pour ${year}:`);
  console.log(`  - Jours totaux: ${totalDays}`);
  console.log(`  - Jours avec problèmes: ${daysWithIssues}`);
  console.log(`  - Pourcentage de problèmes: ${((daysWithIssues / totalDays) * 100).toFixed(2)}%`);
  
  if (issues.length > 0) {
    console.log(`\nProblèmes détectés (premiers 20):`);
    issues.slice(0, 20).forEach(issue => console.log(`  - ${issue}`));
    
    if (issues.length > 20) {
      console.log(`  ... et ${issues.length - 20} autres problèmes`);
    }
  } else {
    console.log(`\n✅ Aucun problème détecté dans les données`);
  }
  
  return { totalDays, daysWithIssues, issues };
}

// Vérifier 1999 et 2000 pour comparer
console.log('VÉRIFICATION DE L\'INTÉGRITÉ DES DONNÉES MÉTÉOROLOGIQUES\n');
const results1999 = checkDataIntegrity('1999');
console.log('\n' + '='.repeat(60) + '\n');
const results2000 = checkDataIntegrity('2000');

// Comparaison
console.log('\n=== COMPARAISON 1999 vs 2000 ===');
if (results1999 && results2000) {
  console.log(`Taux de problèmes 1999: ${((results1999.daysWithIssues / results1999.totalDays) * 100).toFixed(2)}%`);
  console.log(`Taux de problèmes 2000: ${((results2000.daysWithIssues / results2000.totalDays) * 100).toFixed(2)}%`);
  
  if (results1999.daysWithIssues > results2000.daysWithIssues) {
    console.log(`\n⚠️  ATTENTION: 1999 a ${results1999.daysWithIssues - results2000.daysWithIssues} jours de plus avec problèmes que 2000`);
  }
}

// Vérifier spécifiquement les champs calculés pour 1999
console.log('\n=== VÉRIFICATION DES CHAMPS CALCULÉS POUR 1999 ===');
const dailyDir1999 = path.join(__dirname, 'data', 'daily', '1999');
const months = fs.readdirSync(dailyDir1999).sort();

let daysMissingCalculatedFields = 0;
const missingFieldsDetails = [];

months.slice(0, 3).forEach(month => { // Vérifier seulement 3 premiers mois pour performance
  const monthDir = path.join(dailyDir1999, month);
  const dailyFiles = fs.readdirSync(monthDir).filter(f => f.endsWith('.json')).sort().slice(0, 10); // 10 premiers jours
  
  dailyFiles.forEach(dayFile => {
    const dailyPath = path.join(monthDir, dayFile);
    const dailyData = JSON.parse(fs.readFileSync(dailyPath, 'utf8'));
    
    const missingFields = [];
    if (dailyData.estimated_daily_sunshine_minutes === undefined) missingFields.push('estimated_daily_sunshine_minutes');
    if (dailyData.estimated_daily_sunshine === undefined) missingFields.push('estimated_daily_sunshine');
    if (dailyData.sunshine_difference_minutes === undefined) missingFields.push('sunshine_difference_minutes');
    if (dailyData.sunshine_consistency === undefined) missingFields.push('sunshine_consistency');
    
    if (missingFields.length > 0) {
      daysMissingCalculatedFields++;
      missingFieldsDetails.push(`${dailyData.date}: ${missingFields.join(', ')}`);
    }
  });
});

console.log(`Jours avec champs calculés manquants: ${daysMissingCalculatedFields}`);
if (missingFieldsDetails.length > 0) {
  console.log('Détails:');
  missingFieldsDetails.slice(0, 10).forEach(detail => console.log(`  - ${detail}`));
}