const fs = require('fs');
const path = require('path');

function checkHourlyWeatherCodes(year, month, day) {
  const hourlyPath = path.join(__dirname, 'data', 'hourly', year, month, `${day}.json`);
  
  if (!fs.existsSync(hourlyPath)) {
    console.log(`No hourly data for ${year}-${month}-${day}`);
    return null;
  }
  
  const hourlyData = JSON.parse(fs.readFileSync(hourlyPath, 'utf8'));
  
  // Get unique weather codes
  const uniqueCodes = new Set();
  hourlyData.forEach(hour => {
    if (hour.weather_code !== null && hour.weather_code !== undefined) {
      uniqueCodes.add(hour.weather_code);
    }
  });
  
  return {
    date: `${year}-${month}-${day}`,
    uniqueCodes: Array.from(uniqueCodes).sort((a, b) => a - b),
    totalHours: hourlyData.length,
    sampleCodes: hourlyData.slice(0, 5).map(h => h.weather_code)
  };
}

// Check multiple days in 1999
console.log('=== CHECKING HOURLY WEATHER CODES FOR 1999 ===\n');

const testDays1999 = [
  ['1999', '01', '01'],
  ['1999', '01', '15'],
  ['1999', '06', '01'],
  ['1999', '06', '15'],
  ['1999', '12', '01'],
  ['1999', '12', '15']
];

const results1999 = [];
testDays1999.forEach(([year, month, day]) => {
  const result = checkHourlyWeatherCodes(year, month, day);
  if (result) {
    results1999.push(result);
  }
});

// Check same days in 2000 for comparison
console.log('=== CHECKING HOURLY WEATHER CODES FOR 2000 ===\n');

const testDays2000 = [
  ['2000', '01', '01'],
  ['2000', '01', '15'],
  ['2000', '06', '01'],
  ['2000', '06', '15'],
  ['2000', '12', '01'],
  ['2000', '12', '15']
];

const results2000 = [];
testDays2000.forEach(([year, month, day]) => {
  const result = checkHourlyWeatherCodes(year, month, day);
  if (result) {
    results2000.push(result);
  }
});

// Print results
console.log('=== RESULTS FOR 1999 ===');
results1999.forEach(r => {
  console.log(`${r.date}: ${r.uniqueCodes.length} unique codes: [${r.uniqueCodes.join(', ')}], Hours: ${r.totalHours}`);
});

console.log('\n=== RESULTS FOR 2000 ===');
results2000.forEach(r => {
  console.log(`${r.date}: ${r.uniqueCodes.length} unique codes: [${r.uniqueCodes.join(', ')}], Hours: ${r.totalHours}`);
});

// Check if any codes in 1999 are not in 2000
const allCodes1999 = new Set();
results1999.forEach(r => {
  r.uniqueCodes.forEach(code => allCodes1999.add(code));
});

const allCodes2000 = new Set();
results2000.forEach(r => {
  r.uniqueCodes.forEach(code => allCodes2000.add(code));
});

console.log('\n=== CODE COMPARISON ===');
console.log(`All codes in 1999 sample: [${Array.from(allCodes1999).sort((a, b) => a - b).join(', ')}]`);
console.log(`All codes in 2000 sample: [${Array.from(allCodes2000).sort((a, b) => a - b).join(', ')}]`);

const onlyIn1999 = Array.from(allCodes1999).filter(code => !allCodes2000.has(code));
const onlyIn2000 = Array.from(allCodes2000).filter(code => !allCodes1999.has(code));

if (onlyIn1999.length > 0) {
  console.log(`Codes only in 1999: [${onlyIn1999.join(', ')}]`);
}
if (onlyIn2000.length > 0) {
  console.log(`Codes only in 2000: [${onlyIn2000.join(', ')}]`);
}

// Check if getWeatherIcon returns valid image paths for all codes
console.log('\n=== CHECKING getWeatherIcon FOR ALL CODES ===');
function getWeatherIcon(code, time, sunrise, sunset) {
  // Simplified version for testing
  let isNight = false;
  if (time && sunrise && sunset) {
    const getTime = (str) => {
      if (!str || !str.includes('T')) return 720;
      const part = str.split('T')[1];
      if (!part || !part.includes(':')) return 720;
      const [h, m] = part.split(':').map(Number);
      return h * 60 + m;
    };
    isNight = getTime(time) < getTime(sunrise) || getTime(time) > getTime(sunset);
  }
  const period = isNight ? "night" : "day";
  
  // Only check which image path would be returned
  const imagePaths = {
    0: `/weather-icons/${period}/ciel-degage.png`,
    1: `/weather-icons/${period}/ciel-voile.png`,
    2: `/weather-icons/${period}/eclaircies.png`,
    3: `/weather-icons/${period}/couvert.png`,
    45: `/weather-icons/${period}/brouillard.png`,
    48: `/weather-icons/${period}/brouillard.png`,
    51: `/weather-icons/${period}/bruine.png`,
    53: `/weather-icons/${period}/bruine.png`,
    55: `/weather-icons/${period}/bruine.png`,
    56: `/weather-icons/${period}/pluie-verglacante.png`,
    57: `/weather-icons/${period}/pluie-verglacante.png`,
    61: `/weather-icons/${period}/pluie-faible.png`,
    63: `/weather-icons/${period}/pluie.png`,
    65: `/weather-icons/${period}/pluie.png`,
    66: `/weather-icons/${period}/pluie-verglacante.png`,
    67: `/weather-icons/${period}/pluie-verglacante.png`,
    71: `/weather-icons/${period}/neige.png`,
    73: `/weather-icons/${period}/neige.png`,
    75: `/weather-icons/${period}/neige.png`,
    77: `/weather-icons/${period}/neige.png`,
    80: `/weather-icons/${period}/averses-pluie.png`,
    81: `/weather-icons/${period}/averses-pluie.png`,
    82: `/weather-icons/${period}/averses-pluie.png`,
    85: `/weather-icons/${period}/averses-neige.png`,
    86: `/weather-icons/${period}/averses-neige.png`,
    95: `/weather-icons/${period}/orage.png`,
    96: `/weather-icons/${period}/orage.png`,
    99: `/weather-icons/${period}/orage.png`
  };
  
  return imagePaths[code] || null;
}

// Test all codes found
const allCodes = new Set([...allCodes1999, ...allCodes2000]);
console.log(`\nTesting ${allCodes.size} unique codes found in data:`);

Array.from(allCodes).sort((a, b) => a - b).forEach(code => {
  const dayPath = `/weather-icons/day/sample.png`;
  const nightPath = `/weather-icons/night/sample.png`;
  const imagePath = getWeatherIcon(code, "2024-01-01T12:00", "2024-01-01T08:00", "2024-01-01T18:00");
  
  if (imagePath) {
    // Check if file exists for day version
    const dayFile = imagePath.replace('${period}', 'day');
    const nightFile = imagePath.replace('${period}', 'night');
    
    console.log(`Code ${code}: ${imagePath}`);
  } else {
    console.log(`Code ${code}: NO IMAGE PATH RETURNED!`);
  }
});