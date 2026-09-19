const fs = require('fs');
const path = require('path');

// Importer les fonctions de calcul (versions simplifiées)
const WMO_TO_ESTIMATED_SUNSHINE = {
  0: 60,    // ☀️ - Ciel dégagé
  1: 45,    // 🌤️ - Principalement dégagé
  2: 30,    // ⛅ - Partiellement nuageux
  3: 0,     // ☁️ - Couvert
  45: 0,    // 🌫️ - Brouillard
  48: 0,    // 🌫️ - Brouillard givrant
  51: 15,   // 🌦️ - Bruine faible
  53: 10,   // 🌦️ - Bruine modérée
  55: 0,    // 🌧️ - Bruine forte
  56: 0,    // 🌧️❄️ - Bruine verglaçante faible
  57: 0,    // 🌧️❄️ - Bruine verglaçante forte
  61: 5,    // 🌧️ - Pluie faible
  63: 0,    // 🌧️ - Pluie modérée
  65: 0,    // 🌧️ - Pluie forte
  66: 0,    // 🌧️❄️ - Pluie verglaçante faible
  67: 0,    // 🌧️❄️ - Pluie verglaçante forte
  71: 5,    // 🌨️ - Neige faible
  73: 0,    // 🌨️ - Neige modérée
  75: 0,    // 🌨️ - Neige forte
  77: 0,    // 🌨️ - Grains de neige
  80: 20,   // 🌦️ - Averses de pluie faibles
  81: 5,    // 🌧️ - Averses de pluie modérées
  82: 5,    // 🌧️ - Averses de pluie violentes
  85: 5,    // 🌨️ - Averses de neige faibles
  86: 5,    // 🌨️ - Averses de neige fortes
  95: 10,   // ⛈️ - Orage faible ou modéré
  96: 10,   // ⛈️ - Orage avec grêle faible
  99: 10    // ⛈️ - Orage avec forte grêle
};

function calculateHourlySunshine(code) {
  return WMO_TO_ESTIMATED_SUNSHINE[code] ?? 0;
}

function getTimeMinutes(timeStr) {
  if (!timeStr || !timeStr.includes('T')) return 0;
  const timePart = timeStr.split('T')[1];
  if (!timePart || !timePart.includes(':')) return 0;
  const [hour, minute] = timePart.split(':').map(Number);
  if (isNaN(hour) || isNaN(minute)) return 0;
  return hour * 60 + minute;
}

function isHourBetweenSunriseAndSunset(timeStr, sunriseStr, sunsetStr) {
  if (!sunriseStr || !sunsetStr) return true;

  const timeMinutes = getTimeMinutes(timeStr);
  const sunriseMinutes = getTimeMinutes(sunriseStr);
  const sunsetMinutes = getTimeMinutes(sunsetStr);

  // Vérification de sécurité
  if (sunriseMinutes >= sunsetMinutes) return true; // Données invalides, on inclut tout

  return timeMinutes >= sunriseMinutes && timeMinutes < sunsetMinutes;
}

function calculateDailySunshine(hourlyData, sunrise, sunset) {
  if (!hourlyData || hourlyData.length === 0) return null;
  
  return hourlyData.reduce((total, hour) => {
    if (isHourBetweenSunriseAndSunset(hour.time, sunrise, sunset)) {
      return total + calculateHourlySunshine(hour.weather_code);
    }
    return total;
  }, 0);
}

function convertOfficialSunshineToMinutes(sunshineSeconds) {
  if (sunshineSeconds === null || sunshineSeconds === undefined) return null;
  return Math.round(sunshineSeconds / 60);
}

function formatSunshineDuration(totalMinutes) {
  if (totalMinutes === null) return "Données indisponibles";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} h ${minutes.toString().padStart(2, '0')} min`;
}

function calculateSunshineConsistency(officialMinutes, estimatedMinutes) {
  if (officialMinutes === null || estimatedMinutes === null) return null;
  const difference = Math.abs(officialMinutes - estimatedMinutes);
  if (difference <= 5) return 'Excellent';
  if (difference <= 15) return 'Bon';
  if (difference <= 30) return 'Moyen';
  return 'Faible';
}

function regenerateYear(year) {
  console.log(`=== REGÉNÉRATION DES DONNÉES CALCULÉES POUR ${year} ===\n`);
  
  const dailyDir = path.join(__dirname, 'data', 'daily', year);
  const hourlyDir = path.join(__dirname, 'data', 'hourly', year);
  
  if (!fs.existsSync(dailyDir) || !fs.existsSync(hourlyDir)) {
    console.log(`Données manquantes pour ${year}`);
    return 0;
  }
  
  const months = fs.readdirSync(dailyDir).sort();
  let updatedDays = 0;
  
  months.forEach(month => {
    const monthDailyDir = path.join(dailyDir, month);
    const monthHourlyDir = path.join(hourlyDir, month);
    
    if (!fs.existsSync(monthHourlyDir)) {
      console.log(`Mois ${month}: dossier horaire manquant, skipping`);
      return;
    }
    
    const dailyFiles = fs.readdirSync(monthDailyDir).filter(f => f.endsWith('.json')).sort();
    
    dailyFiles.forEach(dayFile => {
      const day = dayFile.replace('.json', '');
      const dailyPath = path.join(monthDailyDir, dayFile);
      const hourlyPath = path.join(monthHourlyDir, dayFile);
      
      try {
        const dailyData = JSON.parse(fs.readFileSync(dailyPath, 'utf8'));
        const hourlyData = JSON.parse(fs.readFileSync(hourlyPath, 'utf8'));
        
        // Calculer les nouvelles valeurs
        const sunshineDurationSeconds = dailyData.sunshine ?? null;
        const sunshineDurationMinutes = convertOfficialSunshineToMinutes(sunshineDurationSeconds);
        const estimatedDailyMinutes = calculateDailySunshine(hourlyData, dailyData.sunrise, dailyData.sunset);
        const estimatedDailySunshine = formatSunshineDuration(estimatedDailyMinutes);
        
        const sunshineDifferenceMinutes = (sunshineDurationMinutes !== null && estimatedDailyMinutes !== null)
          ? Math.abs(sunshineDurationMinutes - estimatedDailyMinutes)
          : null;
        const consistency = calculateSunshineConsistency(sunshineDurationMinutes, estimatedDailyMinutes);
        
        // Mettre à jour les données horaires avec estimated_hourly_sunshine_minutes
        const updatedHourlyData = hourlyData.map(hour => ({
          ...hour,
          estimated_hourly_sunshine_minutes: calculateHourlySunshine(hour.weather_code)
        }));
        
        // Mettre à jour les données quotidiennes
        const updatedDailyData = {
          ...dailyData,
          sunshine_duration_seconds: sunshineDurationSeconds,
          sunshine_duration_minutes: sunshineDurationMinutes,
          estimated_daily_sunshine_minutes: estimatedDailyMinutes,
          estimated_daily_sunshine: estimatedDailySunshine,
          sunshine_difference_minutes: sunshineDifferenceMinutes,
          sunshine_consistency: consistency
        };
        
        // Écrire les fichiers mis à jour
        fs.writeFileSync(dailyPath, JSON.stringify(updatedDailyData, null, 2));
        fs.writeFileSync(hourlyPath, JSON.stringify(updatedHourlyData, null, 2));
        
        updatedDays++;
        
        if (updatedDays % 50 === 0) {
          console.log(`  ${updatedDays} jours mis à jour...`);
        }
      } catch (error) {
        console.error(`Erreur pour ${year}-${month}-${day}:`, error.message);
      }
    });
  });
  
  console.log(`\n✅ ${updatedDays} jours mis à jour pour ${year}`);
  return updatedDays;
}

// Regénérer 1999
console.log('REGÉNÉRATION DES DONNÉES CALCULÉES\n');
const daysUpdated1999 = regenerateYear('1999');

// Pour comparaison, regénérer aussi 2000
console.log('\n' + '='.repeat(60) + '\n');
const daysUpdated2000 = regenerateYear('2000');

console.log('\n=== RÉSUMÉ ===');
console.log(`Jours mis à jour pour 1999: ${daysUpdated1999}`);
console.log(`Jours mis à jour pour 2000: ${daysUpdated2000}`);

// Vérifier si les calculs sont maintenant cohérents
console.log('\n=== VÉRIFICATION POST-REGÉNÉRATION ===');

function verifyDay(year, month, day) {
  const dailyPath = path.join(__dirname, 'data', 'daily', year, month, `${day}.json`);
  const hourlyPath = path.join(__dirname, 'data', 'hourly', year, month, `${day}.json`);
  
  const dailyData = JSON.parse(fs.readFileSync(dailyPath, 'utf8'));
  const hourlyData = JSON.parse(fs.readFileSync(hourlyPath, 'utf8'));
  
  // Recalculer pour vérifier
  const recalculated = calculateDailySunshine(hourlyData, dailyData.sunrise, dailyData.sunset);
  
  return {
    date: `${year}-${month}-${day}`,
    stored: dailyData.estimated_daily_sunshine_minutes,
    recalculated,
    match: dailyData.estimated_daily_sunshine_minutes === recalculated
  };
}

const testDays = [
  ['1999', '01', '01'],
  ['1999', '06', '15'],
  ['2000', '01', '01'],
  ['2000', '06', '15']
];

console.log('\nVérification des calculs:');
testDays.forEach(([year, month, day]) => {
  const result = verifyDay(year, month, day);
  console.log(`${result.date}: Stocké=${result.stored}, Recalculé=${result.recalculated}, Match=${result.match ? '✅' : '❌'}`);
});