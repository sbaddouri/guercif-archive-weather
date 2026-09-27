import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  calculateHourlySunshineWithDaylight,
  calculateDailySunshine,
  formatSunshineDuration,
  calculateSunshineConsistency,
  convertOfficialSunshineToMinutes
} from '../src/lib/weather-colors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');

interface HourlyDataRaw {
  time: string;
  temp: number | null;
  humidity: number | null;
  dew_point: number | null;
  precipitation: number | null;
  weather_code: number | null;
  pressure: number | null;
  wind_speed: number | null;
  wind_gusts: number | null;
  visibility: number | null;
  uv_index: number | null;
  sunshine: number | null;
  estimated_hourly_sunshine_minutes?: number;
}

interface DailyDataRaw {
  date: string;
  weather_code: number | null;
  temp_max: number | null;
  temp_min: number | null;
  temp_mean: number | null;
  precipitation: number | null;
  sunshine: number | null;
  wind_speed_max: number | null;
  sunrise: string | null;
  sunset: string | null;
  sunshine_duration_seconds: number | null;
  sunshine_duration_minutes: number | null;
  estimated_daily_sunshine_minutes: number | null;
  estimated_daily_sunshine: string | null;
  sunshine_difference_minutes: number | null;
  sunshine_consistency: 'Excellent' | 'Bon' | 'Moyen' | 'Faible' | null;
}

async function processHourlyFile(
  hourlyFilePath: string,
  dailyFilePath: string
): Promise<boolean> {
  try {
    const hourlyRaw = JSON.parse(fs.readFileSync(hourlyFilePath, 'utf8')) as HourlyDataRaw[];
    
    let sunrise: string | null = null;
    let sunset: string | null = null;
    
    if (fs.existsSync(dailyFilePath)) {
      const dailyRaw = JSON.parse(fs.readFileSync(dailyFilePath, 'utf8')) as DailyDataRaw;
      sunrise = dailyRaw.sunrise ?? null;
      sunset = dailyRaw.sunset ?? null;
    }

    if (!sunrise || !sunset) {
      console.log(`  ⚠️ Pas de lever/coucher pour ${hourlyFilePath}`);
      return false;
    }

    let updated = false;
    const updatedHourly = hourlyRaw.map(hour => {
      const newEstimated = calculateHourlySunshineWithDaylight(
        hour.weather_code ?? 0,
        hour.time,
        sunrise,
        sunset
      );
      
      if (hour.estimated_hourly_sunshine_minutes !== newEstimated) {
        updated = true;
        return {
          ...hour,
          estimated_hourly_sunshine_minutes: newEstimated
        };
      }
      return hour;
    });

    if (updated) {
      fs.writeFileSync(hourlyFilePath, JSON.stringify(updatedHourly, null, 2));
      console.log(`  ✅ Mis à jour: ${path.basename(hourlyFilePath)}`);
    } else {
      console.log(`  ⏭️ Déjà à jour: ${path.basename(hourlyFilePath)}`);
    }
    return updated;
  } catch (error) {
    console.error(`  ❌ Erreur ${hourlyFilePath}:`, error);
    return false;
  }
}

async function main() {
  console.log('🔄 Régénération des valeurs d\'ensoleillement horaire...\n');
  
  const hourlyDir = path.join(DATA_DIR, 'hourly');
  if (!fs.existsSync(hourlyDir)) {
    console.error('❌ Dossier hourly non trouvé');
    return;
  }

  const years = fs.readdirSync(hourlyDir).filter(f => fs.statSync(path.join(hourlyDir, f)).isDirectory()).sort();
  let totalFiles = 0;
  let updatedFiles = 0;

  for (const year of years) {
    const yearDir = path.join(hourlyDir, year);
    const months = fs.readdirSync(yearDir).filter(f => fs.statSync(path.join(yearDir, f)).isDirectory()).sort();
    
    console.log(`\n📅 Année ${year}:`);
    
    for (const month of months) {
      const monthDir = path.join(yearDir, month);
      const files = fs.readdirSync(monthDir).filter(f => f.endsWith('.json')).sort();
      
      for (const file of files) {
        const hourlyFilePath = path.join(monthDir, file);
        const day = file.replace('.json', '');
        const dailyFilePath = path.join(DATA_DIR, 'daily', year, month, `${day}.json`);
        
        totalFiles++;
        const updated = await processHourlyFile(hourlyFilePath, dailyFilePath);
        if (updated) updatedFiles++;
      }
    }
  }

  console.log(`\n✨ Terminé !`);
  console.log(`   Fichiers traités: ${totalFiles}`);
  console.log(`   Fichiers mis à jour: ${updatedFiles}`);
  console.log(`   Fichiers inchangés: ${totalFiles - updatedFiles}`);
}

main().catch(console.error);