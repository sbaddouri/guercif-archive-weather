import fs from 'fs';
import path from 'path';
import { format, subDays } from 'date-fns';
import {
  calculateHourlySunshine,
  calculateDailySunshine,
  formatSunshineDuration,
  calculateSunshineConsistency,
  convertOfficialSunshineToMinutes
} from './weather-colors';

const DATA_DIR = path.join(process.cwd(), 'data');

export interface DailyData {
  date: string;
  weather_code: number;
  temp_max: number;
  temp_min: number;
  temp_mean: number;
  precipitation: number;
  sunshine: number; // Valeur officielle Open-Meteo en secondes (conservée pour compatibilité)
  wind_speed_max: number;
  sunrise: string;
  sunset: string;
  
  // Nouvelles variables pour l'ensoleillement estimé
  sunshine_duration_seconds: number | null; // Valeur officielle Open-Meteo en secondes
  sunshine_duration_minutes: number | null; // Valeur officielle convertie en minutes
  estimated_daily_sunshine_minutes: number | null; // Estimation journalière basée sur les codes WMO horaires
  estimated_daily_sunshine: string | null; // Estimation journalière formatée ("X h Y min")
  sunshine_difference_minutes: number | null; // Différence absolue entre les deux valeurs
  sunshine_consistency: 'Excellent' | 'Bon' | 'Moyen' | 'Faible' | null; // Indice de cohérence
}

export interface HourlyData {
  time: string;
  temp: number;
  humidity: number;
  dew_point: number;
  precipitation: number;
  weather_code: number;
  pressure: number;
  wind_speed: number;
  wind_gusts: number;
  visibility: number;
  uv_index: number;
  sunshine: number; // Valeur officielle Open-Meteo en secondes
  
  // Nouvelle variable pour l'ensoleillement estimé horaire
  estimated_hourly_sunshine_minutes: number; // Estimation basée sur le code WMO horaire
}

async function fillMissingDailyDataFields(data: any): Promise<DailyData> {
  try {
    // Check if fields are missing
    if (
      data.sunshine_duration_seconds === undefined ||
      data.sunshine_duration_minutes === undefined ||
      data.estimated_daily_sunshine_minutes === undefined ||
      data.estimated_daily_sunshine === undefined ||
      data.sunshine_difference_minutes === undefined ||
      data.sunshine_consistency === undefined
    ) {
      // Calculate official values from existing "sunshine" field
      const sunshineDurationSeconds = data.sunshine ?? null;
      const sunshineDurationMinutes = convertOfficialSunshineToMinutes(sunshineDurationSeconds);

      // Calculate estimated values from hourly data
      let hourlyData = null;
      try {
        hourlyData = await getHourlyData(data.date);
      } catch (e) {
        hourlyData = null;
      }
      const estimatedDailyMinutes = calculateDailySunshine(
        hourlyData || [], 
        data.sunrise, 
        data.sunset
      );
      const estimatedDailySunshine = formatSunshineDuration(estimatedDailyMinutes);

      // Calculate difference and consistency
      const sunshineDifferenceMinutes = (sunshineDurationMinutes !== null && estimatedDailyMinutes !== null)
        ? Math.abs(sunshineDurationMinutes - estimatedDailyMinutes)
        : null;
      const consistency = calculateSunshineConsistency(sunshineDurationMinutes, estimatedDailyMinutes);

      return {
        ...data,
        sunshine_duration_seconds: sunshineDurationSeconds,
        sunshine_duration_minutes: sunshineDurationMinutes,
        estimated_daily_sunshine_minutes: estimatedDailyMinutes,
        estimated_daily_sunshine: estimatedDailySunshine,
        sunshine_difference_minutes: sunshineDifferenceMinutes,
        sunshine_consistency: consistency
      };
    }
    return data as DailyData;
  } catch (e) {
    // Si erreur, retourner les données brutes sans les nouveaux champs (éviter crash)
    return {
      date: data.date,
      weather_code: data.weather_code ?? 0,
      temp_max: data.temp_max ?? 0,
      temp_min: data.temp_min ?? 0,
      temp_mean: data.temp_mean ?? 0,
      precipitation: data.precipitation ?? 0,
      sunshine: data.sunshine ?? 0,
      wind_speed_max: data.wind_speed_max ?? 0,
      sunrise: data.sunrise ?? "",
      sunset: data.sunset ?? "",
      sunshine_duration_seconds: null,
      sunshine_duration_minutes: null,
      estimated_daily_sunshine_minutes: null,
      estimated_daily_sunshine: null,
      sunshine_difference_minutes: null,
      sunshine_consistency: null
    };
  }
}

async function fillMissingHourlyDataFields(data: any[]): Promise<HourlyData[]> {
  return data.map(hour => {
    if (hour.estimated_hourly_sunshine_minutes === undefined) {
      return {
        ...hour,
        estimated_hourly_sunshine_minutes: calculateHourlySunshine(hour.weather_code)
      };
    }
    return hour as HourlyData;
  });
}

export async function getDailyData(date: string): Promise<DailyData | null> {
  const [year, month, day] = date.split('-');
  const filePath = path.join(DATA_DIR, 'daily', year, month, `${day}.json`);
  if (!fs.existsSync(filePath)) return null;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return await fillMissingDailyDataFields(data);
}

export async function getHourlyData(date: string): Promise<HourlyData[] | null> {
  const [year, month, day] = date.split('-');
  const filePath = path.join(DATA_DIR, 'hourly', year, month, `${day}.json`);
  if (!fs.existsSync(filePath)) return null;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return await fillMissingHourlyDataFields(data);
}

export async function getDailyDataForMonth(year: string, month: string): Promise<DailyData[]> {
  const dir = path.join(DATA_DIR, 'daily', year, month);
  if (!fs.existsSync(dir)) return [];
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const results: DailyData[] = [];
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    const filledData = await fillMissingDailyDataFields(data);
    results.push(filledData);
  }
  
  return results.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getDailyDataForYear(year: string): Promise<DailyData[]> {
  const yearDir = path.join(DATA_DIR, 'daily', year);
  if (!fs.existsSync(yearDir)) return [];
  
  const months = fs.readdirSync(yearDir);
  let allData: DailyData[] = [];
  
  for (const month of months) {
    const monthData = await getDailyDataForMonth(year, month);
    allData = [...allData, ...monthData];
  }
  
  return allData.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getRecentDailyData(days = 7): Promise<DailyData[]> {
  const results: DailyData[] = [];
  const today = new Date();
  
  // Start from 3 days ago to ensure complete data
  for (let i = 3; i < 3 + days; i++) {
    const dateStr = format(subDays(today, i), 'yyyy-MM-dd');
    const data = await getDailyData(dateStr);
    if (data) results.push(data);
  }
  
  return results;
}

export type AttemptDetail = {
  date: string;
  success: boolean;
  error?: string;
};

export type UpdateStatus = {
  success: boolean;
  date: string;
  message: string;
  initialStartDate: string;
  initialEndDate: string;
  finalStartDate: string;
  finalEndDate: string;
  attempts: number;
  daysUpdated: string[];
  missingDays: string[];
  attemptDetails: AttemptDetail[];
};

export async function getUpdateStatus(): Promise<UpdateStatus | null> {
  const statusFile = path.join(DATA_DIR, 'last-update-status.json');
  if (!fs.existsSync(statusFile)) return null;
  try {
    const content = fs.readFileSync(statusFile, 'utf8');
    const parsed = JSON.parse(content);
    return {
      success: parsed.success ?? false,
      date: parsed.date ?? new Date().toISOString(),
      message: parsed.message ?? '',
      initialStartDate: parsed.initialStartDate ?? '',
      initialEndDate: parsed.initialEndDate ?? '',
      finalStartDate: parsed.finalStartDate ?? '',
      finalEndDate: parsed.finalEndDate ?? '',
      attempts: parsed.attempts ?? 0,
      daysUpdated: parsed.daysUpdated ?? [],
      missingDays: parsed.missingDays ?? [],
      attemptDetails: parsed.attemptDetails ?? [],
    };
  } catch {
    return null;
  }
}
