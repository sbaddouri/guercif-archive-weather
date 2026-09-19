const fs = require('fs');
const path = require('path');

// Check if weather icons exist
function checkWeatherIcons() {
  const publicDir = path.join(__dirname, 'public', 'weather-icons');
  const dayDir = path.join(publicDir, 'day');
  const nightDir = path.join(publicDir, 'night');
  
  console.log('Checking weather icons...\n');
  
  // List of expected icon files based on weather-colors.ts
  const expectedIcons = [
    'ciel-degage.png',
    'ciel-voile.png',
    'eclaircies.png',
    'couvert.png',
    'brouillard.png',
    'bruine.png',
    'pluie-faible.png',
    'pluie-verglacante.png',
    'pluie.png',
    'neige.png',
    'averses-pluie.png',
    'averses-neige.png',
    'orage.png'
  ];
  
  console.log('Expected icons:', expectedIcons);
  
  const dayIcons = fs.readdirSync(dayDir);
  const nightIcons = fs.readdirSync(nightDir);
  
  console.log('\n=== DAY ICONS ===');
  console.log(`Found ${dayIcons.length} icons in day directory:`);
  dayIcons.forEach(icon => console.log(`  - ${icon}`));
  
  console.log('\n=== NIGHT ICONS ===');
  console.log(`Found ${nightIcons.length} icons in night directory:`);
  nightIcons.forEach(icon => console.log(`  - ${icon}`));
  
  // Check missing icons
  const missingDay = expectedIcons.filter(icon => !dayIcons.includes(icon));
  const missingNight = expectedIcons.filter(icon => !nightIcons.includes(icon));
  
  console.log('\n=== MISSING ICONS ===');
  if (missingDay.length > 0) {
    console.log('Missing in day directory:');
    missingDay.forEach(icon => console.log(`  - ${icon}`));
  } else {
    console.log('All expected icons found in day directory');
  }
  
  if (missingNight.length > 0) {
    console.log('Missing in night directory:');
    missingNight.forEach(icon => console.log(`  - ${icon}`));
  } else {
    console.log('All expected icons found in night directory');
  }
  
  return { missingDay, missingNight };
}

// Check if icons are referenced correctly in weather-colors.ts
function checkIconReferences() {
  const weatherColorsPath = path.join(__dirname, 'src', 'lib', 'weather-colors.ts');
  const content = fs.readFileSync(weatherColorsPath, 'utf8');
  
  console.log('\n=== CHECKING ICON REFERENCES IN weather-colors.ts ===');
  
  // Extract all imagePath values from getWeatherIcon function
  const imagePathMatches = content.match(/imagePath: `\/weather-icons\/[^`]+`/g);
  
  if (imagePathMatches) {
    console.log(`Found ${imagePathMatches.length} icon references:`);
    const uniquePaths = new Set();
    
    imagePathMatches.forEach(match => {
      // Extract the path
      const pathMatch = match.match(/`(\/weather-icons\/[^`]+)`/);
      if (pathMatch) {
        uniquePaths.add(pathMatch[1]);
      }
    });
    
    console.log('\nUnique icon paths referenced:');
    Array.from(uniquePaths).sort().forEach(p => console.log(`  - ${p}`));
    
    // Check if these paths exist
    console.log('\n=== VERIFYING ICON PATHS EXIST ===');
    const missingPaths = [];
    
    Array.from(uniquePaths).forEach(p => {
      // Remove leading / and check in public directory
      const relativePath = p.substring(1); // Remove leading '/'
      const fullPath = path.join(__dirname, 'public', relativePath);
      
      if (!fs.existsSync(fullPath)) {
        missingPaths.push(p);
        console.log(`  ❌ Missing: ${p} (${fullPath})`);
      } else {
        console.log(`  ✓ Found: ${p}`);
      }
    });
    
    if (missingPaths.length > 0) {
      console.log(`\n${missingPaths.length} icon paths are referenced but files don't exist:`);
      missingPaths.forEach(p => console.log(`  - ${p}`));
      return missingPaths;
    } else {
      console.log('\nAll referenced icon paths exist in public directory');
      return [];
    }
  }
  
  return [];
}

// Main function
console.log('=== WEATHER ICONS CHECK ===\n');
const missingIcons = checkWeatherIcons();
const missingReferences = checkIconReferences();

// Summary
console.log('\n=== SUMMARY ===');
if (missingIcons.missingDay.length === 0 && missingIcons.missingNight.length === 0 && missingReferences.length === 0) {
  console.log('✅ All weather icons are present and correctly referenced');
} else {
  console.log('❌ Issues found with weather icons:');
  if (missingIcons.missingDay.length > 0) {
    console.log(`  - ${missingIcons.missingDay.length} icons missing in day directory`);
  }
  if (missingIcons.missingNight.length > 0) {
    console.log(`  - ${missingIcons.missingNight.length} icons missing in night directory`);
  }
  if (missingReferences.length > 0) {
    console.log(`  - ${missingReferences.length} icon paths referenced but files don't exist`);
  }
}