const fs = require('fs');
const path = require('path');

// Check if weather icons exist with new numeric system
function checkWeatherIcons() {
  const publicDir = path.join(__dirname, 'public', 'weather-icons');
  const dayDir = path.join(publicDir, 'day');
  const nightDir = path.join(publicDir, 'night');
  
  console.log('Checking weather icons (numeric system 0-99)...\n');
  
  // All 100 WMO codes (0-99)
  const allCodes = Array.from({ length: 100 }, (_, i) => i);
  
  console.log('Expected: 100 icons (0.png through 99.png) in each directory\n');
  
  const dayIcons = fs.readdirSync(dayDir).filter(f => f.endsWith('.png'));
  const nightIcons = fs.readdirSync(nightDir).filter(f => f.endsWith('.png'));
  
  console.log('=== DAY ICONS ===');
  console.log(`Found ${dayIcons.length} icons in day directory:`);
  dayIcons.sort((a, b) => parseInt(a) - parseInt(b)).forEach(icon => console.log(`  - ${icon}`));
  
  console.log('\n=== NIGHT ICONS ===');
  console.log(`Found ${nightIcons.length} icons in night directory:`);
  nightIcons.sort((a, b) => parseInt(a) - parseInt(b)).forEach(icon => console.log(`  - ${icon}`));
  
  // Check missing icons
  const existingDayCodes = dayIcons.map(f => parseInt(f.replace('.png', ''), 10)).filter(n => !isNaN(n));
  const existingNightCodes = nightIcons.map(f => parseInt(f.replace('.png', ''), 10)).filter(n => !isNaN(n));
  
  const missingDay = allCodes.filter(code => !existingDayCodes.includes(code));
  const missingNight = allCodes.filter(code => !existingNightCodes.includes(code));
  
  console.log('\n=== MISSING ICONS ===');
  if (missingDay.length > 0) {
    console.log(`Missing in day directory (${missingDay.length} codes):`);
    console.log(`  ${missingDay.join(', ')}`);
  } else {
    console.log('All 100 icons found in day directory');
  }
  
  if (missingNight.length > 0) {
    console.log(`Missing in night directory (${missingNight.length} codes):`);
    console.log(`  ${missingNight.join(', ')}`);
  } else {
    console.log('All 100 icons found in night directory');
  }
  
  // Check for extra files (not 0-99)
  const extraDay = dayIcons.filter(f => {
    const code = parseInt(f.replace('.png', ''), 10);
    return isNaN(code) || code < 0 || code > 99;
  });
  const extraNight = nightIcons.filter(f => {
    const code = parseInt(f.replace('.png', ''), 10);
    return isNaN(code) || code < 0 || code > 99;
  });
  
  if (extraDay.length > 0) {
    console.log('\n=== EXTRA FILES (not 0-99) in day ===');
    extraDay.forEach(f => console.log(`  - ${f}`));
  }
  if (extraNight.length > 0) {
    console.log('\n=== EXTRA FILES (not 0-99) in night ===');
    extraNight.forEach(f => console.log(`  - ${f}`));
  }
  
  return { missingDay, missingNight, extraDay, extraNight };
}

// Check if icons are referenced correctly in weather-colors.ts
function checkIconReferences() {
  const weatherColorsPath = path.join(__dirname, 'src', 'lib', 'weather-colors.ts');
  const content = fs.readFileSync(weatherColorsPath, 'utf8');
  
  console.log('\n=== CHECKING ICON REFERENCES IN weather-colors.ts ===');
  
  // The new system uses numeric paths like /weather-icons/day/0.png
  // Check if getWeatherIcon constructs paths correctly
  const hasNumericPath = content.includes('`/weather-icons/${period}/${code}.png`') || 
                         content.includes('`/weather-icons/${period}/${imageName}`');
  
  if (hasNumericPath) {
    console.log('✅ Uses numeric icon paths (code.png)');
  } else {
    console.log('⚠️  May not use numeric icon paths');
  }
  
  // Check for fallback emoji system
  const hasEmojiFallback = content.includes('WMO_EMOJIS') || content.includes('getDefaultEmoji');
  if (hasEmojiFallback) {
    console.log('✅ Has emoji fallback system');
  } else {
    console.log('⚠️  No emoji fallback system found');
  }
  
  return [];
}

// Main function
console.log('=== WEATHER ICONS CHECK (Numeric System) ===\n');
const missingIcons = checkWeatherIcons();
const missingReferences = checkIconReferences();

// Summary
console.log('\n=== SUMMARY ===');
if (missingIcons.missingDay.length === 0 && missingIcons.missingNight.length === 0) {
  console.log('✅ All 100 weather icons (0-99) are present');
} else {
  console.log('ℹ️  Some icons are missing (this is expected for undefined WMO codes):');
  if (missingIcons.missingDay.length > 0) {
    console.log(`  - ${missingIcons.missingDay.length} icons missing in day directory (will use emoji fallback)`);
  }
  if (missingIcons.missingNight.length > 0) {
    console.log(`  - ${missingIcons.missingNight.length} icons missing in night directory (will use emoji fallback)`);
  }
}
if (missingIcons.extraDay.length > 0 || missingIcons.extraNight.length > 0) {
  console.log('⚠️  Extra files found that don\'t follow 0-99 naming convention');
}
console.log('\nNote: Missing icons for undefined WMO codes (4-44, 46-47, 49-50, 52, 54, 58-60, 62, 64, 68-70, 72, 74, 76, 78-79, 83-84, 87-94, 97-98)');
console.log('are expected. The app will use emoji fallbacks for these codes.');