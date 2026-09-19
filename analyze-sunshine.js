const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data', 'daily');

function analyzeSunshineData() {
  const years = fs.readdirSync(DATA_DIR).sort();
  const results = [];

  years.forEach(year => {
    if (year >= '1999' && year <= '2026') {
      const yearDir = path.join(DATA_DIR, year);
      const months = fs.readdirSync(yearDir).sort();
      
      let totalMinutes = 0;
      let daysCount = 0;
      let minMinutes = Infinity;
      let maxMinutes = -Infinity;
      
      months.forEach(month => {
        const monthDir = path.join(yearDir, month);
        const days = fs.readdirSync(monthDir).filter(f => f.endsWith('.json')).sort();
        
        days.forEach(dayFile => {
          const filePath = path.join(monthDir, dayFile);
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          
          if (data.estimated_daily_sunshine_minutes !== null && data.estimated_daily_sunshine_minutes !== undefined) {
            totalMinutes += data.estimated_daily_sunshine_minutes;
            daysCount++;
            
            if (data.estimated_daily_sunshine_minutes < minMinutes) {
              minMinutes = data.estimated_daily_sunshine_minutes;
            }
            if (data.estimated_daily_sunshine_minutes > maxMinutes) {
              maxMinutes = data.estimated_daily_sunshine_minutes;
            }
          }
        });
      });
      
      const avgMinutes = daysCount > 0 ? totalMinutes / daysCount : 0;
      const totalHours = totalMinutes / 60;
      
      results.push({
        year,
        daysCount,
        totalMinutes,
        totalHours: totalHours.toFixed(1),
        avgMinutes: avgMinutes.toFixed(1),
        minMinutes: minMinutes === Infinity ? 0 : minMinutes,
        maxMinutes: maxMinutes === -Infinity ? 0 : maxMinutes
      });
    }
  });
  
  return results;
}

// Also check if data has correct structure
function checkDataStructure(year) {
  const yearDir = path.join(DATA_DIR, year);
  const months = fs.readdirSync(yearDir).sort();
  
  const issues = [];
  
  months.slice(0, 1).forEach(month => {
    const monthDir = path.join(yearDir, month);
    const days = fs.readdirSync(monthDir).filter(f => f.endsWith('.json')).sort();
    
    days.slice(0, 2).forEach(dayFile => {
      const filePath = path.join(monthDir, dayFile);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Check required fields
      if (!data.date) issues.push(`${year}/${month}/${dayFile}: missing date`);
      if (data.estimated_daily_sunshine_minutes === undefined) {
        issues.push(`${year}/${month}/${dayFile}: missing estimated_daily_sunshine_minutes`);
      }
      if (data.weather_code === undefined) {
        issues.push(`${year}/${month}/${dayFile}: missing weather_code`);
      }
      
      // Check hourly data existence
      const hourlyPath = path.join(__dirname, 'data', 'hourly', year, month, dayFile);
      if (!fs.existsSync(hourlyPath)) {
        issues.push(`${year}/${month}/${dayFile}: missing hourly data`);
      }
    });
  });
  
  return issues;
}

console.log('Analyzing sunshine data for all years...\n');
const results = analyzeSunshineData();

console.log('Year | Days | Total Hours | Avg Minutes/Day | Min | Max');
console.log('-----|------|-------------|-----------------|-----|-----');
results.forEach(r => {
  console.log(`${r.year} | ${r.daysCount} | ${r.totalHours}h | ${r.avgMinutes}min | ${r.minMinutes} | ${r.maxMinutes}`);
});

// Compare 1999 with average of other years
const otherYears = results.filter(r => r.year !== '1999');
const avgOtherYears = otherYears.reduce((sum, r) => sum + parseFloat(r.avgMinutes), 0) / otherYears.length;
const avg1999 = parseFloat(results.find(r => r.year === '1999').avgMinutes);

console.log('\n=== COMPARISON ===');
console.log(`Average minutes/day for 1999: ${avg1999.toFixed(1)}`);
console.log(`Average minutes/day for other years (2000-2026): ${avgOtherYears.toFixed(1)}`);
console.log(`Difference: ${(avg1999 - avgOtherYears).toFixed(1)} minutes`);
console.log(`Percentage difference: ${((avg1999 - avgOtherYears) / avgOtherYears * 100).toFixed(1)}%`);

// Check data structure for 1999
console.log('\n=== CHECKING DATA STRUCTURE FOR 1999 ===');
const issues1999 = checkDataStructure('1999');
if (issues1999.length > 0) {
  console.log('Issues found:');
  issues1999.forEach(issue => console.log(`  - ${issue}`));
} else {
  console.log('No issues found in data structure');
}

// Check data structure for 2000 for comparison
console.log('\n=== CHECKING DATA STRUCTURE FOR 2000 ===');
const issues2000 = checkDataStructure('2000');
if (issues2000.length > 0) {
  console.log('Issues found:');
  issues2000.forEach(issue => console.log(`  - ${issue}`));
} else {
  console.log('No issues found in data structure');
}