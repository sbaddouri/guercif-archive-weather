const fs = require('fs');
const path = require('path');

function analyzeMonth(year, month) {
  const dailyDir = path.join(__dirname, 'data', 'daily', year, month);
  const hourlyDir = path.join(__dirname, 'data', 'hourly', year, month);
  
  if (!fs.existsSync(dailyDir) || !fs.existsSync(hourlyDir)) {
    return null;
  }
  
  const dailyFiles = fs.readdirSync(dailyDir).filter(f => f.endsWith('.json')).sort();
  const sampleDays = dailyFiles.slice(0, 3); // Prendre 3 jours comme échantillon
  
  const monthData = {
    year,
    month,
    totalDays: dailyFiles.length,
    sampleDays: []
  };
  
  sampleDays.forEach(dayFile => {
    const day = dayFile.replace('.json', '');
    const dailyPath = path.join(dailyDir, dayFile);
    const hourlyPath = path.join(hourlyDir, dayFile);
    
    try {
      const dailyData = JSON.parse(fs.readFileSync(dailyPath, 'utf8'));
      const hourlyData = JSON.parse(fs.readFileSync(hourlyPath, 'utf8'));
      
      // Analyser les codes météo
      const weatherCodes = new Set();
      hourlyData.forEach(hour => {
        if (hour.weather_code !== null && hour.weather_code !== undefined) {
          weatherCodes.add(hour.weather_code);
        }
      });
      
      // Vérifier si getWeatherIcon retournerait des imagePath null
      const codesWithNullImage = [];
      Array.from(weatherCodes).forEach(code => {
        // Simuler getWeatherIcon pour voir si imagePath serait null
        const imagePath = getWeatherIconPath(code, "12:00", dailyData.sunrise, dailyData.sunset);
        if (!imagePath || imagePath.includes('null')) {
          codesWithNullImage.push(code);
        }
      });
      
      monthData.sampleDays.push({
        date: dailyData.date,
        uniqueCodes: Array.from(weatherCodes).sort((a, b) => a - b),
        totalHours: hourlyData.length,
        codesWithPossibleNullImage: codesWithNullImage,
        sunrise: dailyData.sunrise,
        sunset: dailyData.sunset
      });
    } catch (error) {
      console.error(`Erreur pour ${year}-${month}-${day}:`, error.message);
    }
  });
  
  return monthData;
}

// Version simplifiée de getWeatherIcon pour obtenir juste le chemin
function getWeatherIconPath(code, time, sunrise, sunset) {
  const WMO_ICON_PATHS = {
    0: { day: 'ciel-degage.png', night: 'ciel-degage.png' },
    1: { day: 'ciel-voile.png', night: 'ciel-voile.png' },
    2: { day: 'eclaircies.png', night: 'eclaircies.png' },
    3: { day: 'couvert.png', night: 'couvert.png' },
    45: { day: 'brouillard.png', night: 'brouillard.png' },
    48: { day: 'brouillard.png', night: 'brouillard.png' },
    51: { day: 'bruine.png', night: 'bruine.png' },
    53: { day: 'bruine.png', night: 'bruine.png' },
    55: { day: 'bruine.png', night: 'bruine.png' },
    56: { day: 'pluie-verglacante.png', night: 'pluie-verglacante.png' },
    57: { day: 'pluie-verglacante.png', night: 'pluie-verglacante.png' },
    61: { day: 'pluie-faible.png', night: 'pluie-faible.png' },
    63: { day: 'pluie.png', night: 'pluie.png' },
    65: { day: 'pluie.png', night: 'pluie.png' },
    66: { day: 'pluie-verglacante.png', night: 'pluie-verglacante.png' },
    67: { day: 'pluie-verglacante.png', night: 'pluie-verglacante.png' },
    71: { day: 'neige.png', night: 'neige.png' },
    73: { day: 'neige.png', night: 'neige.png' },
    75: { day: 'neige.png', night: 'neige.png' },
    77: { day: 'neige.png', night: 'neige.png' },
    80: { day: 'averses-pluie.png', night: 'averses-pluie.png' },
    81: { day: 'averses-pluie.png', night: 'averses-pluie.png' },
    82: { day: 'averses-pluie.png', night: 'averses-pluie.png' },
    85: { day: 'averses-neige.png', night: 'averses-neige.png' },
    86: { day: 'averses-neige.png', night: 'averses-neige.png' },
    95: { day: 'orage.png', night: 'orage.png' },
    96: { day: 'orage.png', night: 'orage.png' },
    99: { day: 'orage.png', night: 'orage.png' }
  };
  
  const iconInfo = WMO_ICON_PATHS[code];
  if (!iconInfo) return null;
  
  // Déterminer si c'est le jour ou la nuit (simplifié)
  const isDaytime = true; // Pour simplifier, on suppose le jour
  const period = isDaytime ? 'day' : 'night';
  
  return `/weather-icons/${period}/${iconInfo[period]}`;
}

// Analyser tous les mois de 1999
console.log('=== ANALYSE DE TOUS LES MOIS DE 1999 ===\n');

const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const allMonthData = [];

months.forEach(month => {
  const data = analyzeMonth('1999', month);
  if (data) {
    allMonthData.push(data);
  }
});

// Afficher les résultats
console.log('Résumé par mois pour 1999:');
console.log('Mois | Jours | Codes uniques dans l\'échantillon | Codes avec image potentiellement null');
console.log('-----|-------|----------------------------------|--------------------------------------');

allMonthData.forEach(monthData => {
  const allCodes = new Set();
  const allNullCodes = new Set();
  
  monthData.sampleDays.forEach(day => {
    day.uniqueCodes.forEach(code => allCodes.add(code));
    day.codesWithPossibleNullImage.forEach(code => allNullCodes.add(code));
  });
  
  console.log(`${monthData.month} | ${monthData.totalDays} | [${Array.from(allCodes).sort((a, b) => a - b).join(', ')}] | [${Array.from(allNullCodes).sort((a, b) => a - b).join(', ')}]`);
});

// Vérifier s'il y a des codes sans image
const allCodes1999 = new Set();
const allNullCodes1999 = new Set();

allMonthData.forEach(monthData => {
  monthData.sampleDays.forEach(day => {
    day.uniqueCodes.forEach(code => allCodes1999.add(code));
    day.codesWithPossibleNullImage.forEach(code => allNullCodes1999.add(code));
  });
});

console.log('\n=== RÉSUMÉ GÉNÉRAL POUR 1999 ===');
console.log(`Tous les codes uniques trouvés: [${Array.from(allCodes1999).sort((a, b) => a - b).join(', ')}]`);
console.log(`Codes avec image potentiellement null: [${Array.from(allNullCodes1999).sort((a, b) => a - b).join(', ')}]`);

if (allNullCodes1999.size > 0) {
  console.log('\n⚠️  ATTENTION: Certains codes pourraient ne pas avoir d\'image associée!');
  console.log('Ces codes pourraient causer des icônes manquantes dans l\'affichage.');
} else {
  console.log('\n✅ Tous les codes ont des images associées.');
}

// Vérifier aussi les heures de lever/coucher du soleil
console.log('\n=== VÉRIFICATION DES HEURES DE LEVER/COUCHER DU SOLEIL ===');
const problematicSunriseSunset = [];

allMonthData.forEach(monthData => {
  monthData.sampleDays.forEach(day => {
    if (!day.sunrise || !day.sunrise.includes('T')) {
      problematicSunriseSunset.push(`${day.date}: sunrise format incorrect: "${day.sunrise}"`);
    }
    if (!day.sunset || !day.sunset.includes('T')) {
      problematicSunriseSunset.push(`${day.date}: sunset format incorrect: "${day.sunset}"`);
    }
    
    // Vérifier si sunrise est après sunset (inversion)
    if (day.sunrise && day.sunset && day.sunrise.includes('T') && day.sunset.includes('T')) {
      const sunriseTime = day.sunrise.split('T')[1];
      const sunsetTime = day.sunset.split('T')[1];
      
      if (sunriseTime > sunsetTime) {
        problematicSunriseSunset.push(`${day.date}: sunrise (${sunriseTime}) est après sunset (${sunsetTime})!`);
      }
    }
  });
});

if (problematicSunriseSunset.length > 0) {
  console.log('Problèmes détectés avec sunrise/sunset:');
  problematicSunriseSunset.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
} else {
  console.log('✅ Aucun problème détecté avec les heures de lever/coucher du soleil');
}