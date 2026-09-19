const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data', 'daily');

function analyzeWeatherCodes(year) {
  const yearDir = path.join(DATA_DIR, year);
  const months = fs.readdirSync(yearDir).sort();
  
  const codeDistribution = {};
  let totalDays = 0;
  
  months.forEach(month => {
    const monthDir = path.join(yearDir, month);
    const days = fs.readdirSync(monthDir).filter(f => f.endsWith('.json')).sort();
    
    days.forEach(dayFile => {
      const filePath = path.join(monthDir, dayFile);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      const code = data.weather_code;
      if (code !== null && code !== undefined) {
        codeDistribution[code] = (codeDistribution[code] || 0) + 1;
        totalDays++;
      }
    });
  });
  
  return { codeDistribution, totalDays };
}

function compareYears(years) {
  console.log('Analyzing weather code distribution...\n');
  
  const results = {};
  years.forEach(year => {
    const { codeDistribution, totalDays } = analyzeWeatherCodes(year);
    results[year] = { codeDistribution, totalDays };
  });
  
  // Calculate averages for comparison
  const allCodes = new Set();
  years.forEach(year => {
    Object.keys(results[year].codeDistribution).forEach(code => allCodes.add(code));
  });
  
  console.log('Weather code distribution (percentage of days):');
  console.log('Code | ' + years.join(' | '));
  console.log('-----|' + years.map(() => '------').join('|'));
  
  Array.from(allCodes).sort((a, b) => a - b).forEach(code => {
    const row = [code];
    years.forEach(year => {
      const count = results[year].codeDistribution[code] || 0;
      const percentage = ((count / results[year].totalDays) * 100).toFixed(1);
      row.push(percentage + '%');
    });
    console.log(row.join(' | '));
  });
  
  // Calculate average sunshine minutes based on code distribution
  console.log('\n=== ESTIMATED SUNSHINE ANALYSIS ===');
  
  // WMO to sunshine mapping from weather-colors.ts
  const WMO_TO_SUNSHINE = {
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
  
  years.forEach(year => {
    const { codeDistribution, totalDays } = results[year];
    let totalSunshine = 0;
    
    Object.keys(codeDistribution).forEach(code => {
      const count = codeDistribution[code];
      const sunshinePerDay = WMO_TO_SUNSHINE[code] || 0;
      totalSunshine += count * sunshinePerDay;
    });
    
    const avgSunshine = totalSunshine / totalDays;
    console.log(`${year}: Average estimated sunshine = ${avgSunshine.toFixed(1)} minutes/day`);
  });
  
  return results;
}

// Analyze specific years
const yearsToAnalyze = ['1999', '2000', '2001', '2002', '2003'];
compareYears(yearsToAnalyze);

// Also check for any anomalies in 1999 data
console.log('\n=== CHECKING FOR DATA ANOMALIES IN 1999 ===');
const { codeDistribution: dist1999 } = analyzeWeatherCodes('1999');
const { codeDistribution: dist2000 } = analyzeWeatherCodes('2000');

const allCodes1999 = Object.keys(dist1999).map(Number).sort((a, b) => a - b);
const allCodes2000 = Object.keys(dist2000).map(Number).sort((a, b) => a - b);

console.log('Codes in 1999:', allCodes1999);
console.log('Codes in 2000:', allCodes2000);

// Check for codes that appear only in one year
const onlyIn1999 = allCodes1999.filter(code => !allCodes2000.includes(code));
const onlyIn2000 = allCodes2000.filter(code => !allCodes1999.includes(code));

if (onlyIn1999.length > 0) {
  console.log('Codes only in 1999:', onlyIn1999);
}
if (onlyIn2000.length > 0) {
  console.log('Codes only in 2000:', onlyIn2000);
}