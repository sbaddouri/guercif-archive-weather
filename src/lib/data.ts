import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format, subDays } from 'date-fns';
import {
  calculateHourlySunshine,
  calculateHourlySunshineWithDaylight,
  calculateDailySunshine,
  formatSunshineDuration,
  calculateSunshineConsistency,
  convertOfficialSunshineToMinutes
} from './weather-colors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple possible paths for data directory (works both locally and on Vercel)
const possibleDataDirs = [
  path.join(process.cwd(), 'data'),                    // Local development
  path.join(__dirname, '..', '..', '..', 'data'),     // Vercel production (from src/lib)
  path.join(__dirname, '..', '..', 'data'),           // Alternative Vercel path
  '/var/task/data',                                    // Vercel serverless function root
];

let DATA_DIR = '';
for (const dir of possibleDataDirs) {
  if (fs.existsSync(dir)) {
    DATA_DIR = dir;
    break;
  }
}

// Fallback to process.cwd() if none found
if (!DATA_DIR) {
  DATA_DIR = path.join(process.cwd(), 'data');
}

export interface DailyData {
  date: string;
  weather_code: number | null;
  temp_max: number | null;
  temp_min: number | null;
  temp_mean: number | null;
  precipitation: number | null;
  sunshine: number | null; // Valeur officielle Open-Meteo en secondes (conservée pour compatibilité)
  wind_speed_max: number | null;
  sunrise: string | null;
  sunset: string | null;
  
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
  sunshine: number | null; // Valeur officielle Open-Meteo en secondes
  
  // Nouvelle variable pour l'ensoleillement estimé horaire
  estimated_hourly_sunshine_minutes: number | null; // Estimation basée sur le code WMO horaire
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
      weather_code: data.weather_code ?? null,
      temp_max: data.temp_max ?? null,
      temp_min: data.temp_min ?? null,
      temp_mean: data.temp_mean ?? null,
      precipitation: data.precipitation ?? null,
      sunshine: data.sunshine ?? null,
      wind_speed_max: data.wind_speed_max ?? null,
      sunrise: data.sunrise ?? null,
      sunset: data.sunset ?? null,
      sunshine_duration_seconds: null,
      sunshine_duration_minutes: null,
      estimated_daily_sunshine_minutes: null,
      estimated_daily_sunshine: null,
      sunshine_difference_minutes: null,
      sunshine_consistency: null
    };
  }
}

async function fillMissingHourlyDataFields(
  data: any[],
  sunrise: string | null | undefined,
  sunset: string | null | undefined
): Promise<HourlyData[]> {
  return data.map(hour => {
    if (hour.estimated_hourly_sunshine_minutes === undefined) {
      return {
        ...hour,
        estimated_hourly_sunshine_minutes: calculateHourlySunshineWithDaylight(
          hour.weather_code,
          hour.time,
          sunrise,
          sunset
        )
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
  
  // Récupérer le lever/coucher du soleil depuis les données journalières
  const dailyFilePath = path.join(DATA_DIR, 'daily', year, month, `${day}.json`);
  let sunrise: string | null | undefined = null;
  let sunset: string | null | undefined = null;
  if (fs.existsSync(dailyFilePath)) {
    const dailyData = JSON.parse(fs.readFileSync(dailyFilePath, 'utf8'));
    sunrise = dailyData.sunrise ?? null;
    sunset = dailyData.sunset ?? null;
  }
  
  return await fillMissingHourlyDataFields(data, sunrise, sunset);
}

export function hasDailyDataForMonth(year: string, month: string): boolean {
  const dir = path.join(DATA_DIR, 'daily', year, month);
  return fs.existsSync(dir);
}

export function listAvailableYears(): string[] {
  const dailyDir = path.join(DATA_DIR, 'daily');
  if (!fs.existsSync(dailyDir)) return [];
  return fs.readdirSync(dailyDir).sort((a, b) => b.localeCompare(a));
}

export function listAvailableMonths(year: string): string[] {
  const yearDir = path.join(DATA_DIR, 'daily', year);
  if (!fs.existsSync(yearDir)) return [];
  return fs.readdirSync(yearDir).sort();
}

export function listAvailableDays(year: string, month: string): string[] {
  const monthDir = path.join(DATA_DIR, 'daily', year, month);
  if (!fs.existsSync(monthDir)) return [];
  return fs.readdirSync(monthDir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort();
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

export async function getHourlyDataForMonth(year: string, month: string): Promise<Record<string, HourlyData[]>> {
  const dir = path.join(DATA_DIR, 'hourly', year, month);
  const result: Record<string, HourlyData[]> = {};
  if (!fs.existsSync(dir)) return result;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const day = file.replace('.json', '');
    const date = `${year}-${month}-${day}`;
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      
      // Récupérer lever/coucher depuis données journalières
      const dailyFilePath = path.join(DATA_DIR, 'daily', year, month, `${day}.json`);
      let sunrise: string | null | undefined = null;
      let sunset: string | null | undefined = null;
      if (fs.existsSync(dailyFilePath)) {
        const dailyData = JSON.parse(fs.readFileSync(dailyFilePath, 'utf8'));
        sunrise = dailyData.sunrise ?? null;
        sunset = dailyData.sunset ?? null;
      }
      
      result[date] = await fillMissingHourlyDataFields(raw, sunrise, sunset);
    } catch {
      result[date] = [];
    }
  }

  return result;
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

export interface MonthlyOccurrenceStats {
  txGe30: number;   // Tx ≥ 30 (jours) - moyenne par année
  txGe25: number;   // Tx ≥ 25 (jours) - moyenne par année
  txGe20: number;   // Tx ≥ 20 (jours) - moyenne par année
  tnGe20: number;   // Tn ≥ 20 (jours) - moyenne par année
  txLe0: number;    // Tx ≤ 0 (jours) - moyenne par année
  tnLe0: number;    // Tn ≤ 0 (jours) - moyenne par année
  tnLeMinus5: number; // Tn ≤ -5 (jours) - moyenne par année
  tnLeMinus10: number; // Tn ≤ -10 (jours) - moyenne par année
  txLe0ConsecutiveMax: number; // Tx ≤ 0 (max. jours consécutifs)
  txGe25ConsecutiveMax: number; // Tx ≥ 25 (max. jours consécutifs)
  rrGe1: number;    // RR ≥ 1 (jours) - moyenne par année
  rrGe5: number;    // RR ≥ 5 (jours) - moyenne par année
  rrGe10: number;   // RR ≥ 10 (jours) - moyenne par année
  rrGe1ConsecutiveMax: number; // RR ≥ 1 (max. jours consécutifs)
  rrLe1ConsecutiveMax: number; // RR ≤ 1 (max. jours consécutifs)
  orage: number;    // Orage (jours) - moyenne par année
  brouillard: number; // Brouillard (jours) - moyenne par année
  neige: number;    // Neige (jours) - moyenne par année
  beauTemps: number; // Beau temps (jours) - moyenne par année
  gris: number;     // Gris (jours) - moyenne par année
  ventGe576: number; // Vent ≥ 57.6 (km/h - jours) - moyenne par année
  ventGe1008: number; // Vent ≥ 100.8 (km/h - jours) - moyenne par année
  dayCount: number; // Total jours observés pour ce mois sur la période
}

export interface OccurrencesData {
  byMonth: Record<string, MonthlyOccurrenceStats>;
  months: string[];
  yearCount: number;
  period: string;
}

function maxConsecutive(dailyData: DailyData[], predicate: (d: DailyData) => boolean): number {
  let max = 0;
  let current = 0;
  for (const d of dailyData) {
    if (predicate(d)) {
      current++;
      if (current > max) max = current;
    } else {
      current = 0;
    }
  }
  return max;
}

function isOrage(code: number | null): boolean {
  // Orage codes: 13 (éclairs), 17, 29, 91-99, and thunder-related codes
  if (code === null) return false;
  return [13, 17, 29, 91, 92, 93, 94, 95, 96, 97, 98, 99].includes(code);
}

function isBrouillard(code: number | null): boolean {
  // Brouillard codes: 10-17, 40-49, 120, 130-135
  if (code === null) return false;
  return [10, 11, 12, 13, 14, 15, 16, 17, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 120, 130, 131, 132, 133, 134, 135].includes(code);
}

function isNeige(code: number | null): boolean {
  // Neige codes: 22, 26, 70-79, 85, 86, 87, 88, 93, 94
  if (code === null) return false;
  return [22, 26, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 85, 86, 87, 88, 93, 94].includes(code);
}

function isBeauTemps(code: number | null): boolean {
  // Beau temps: ciel dégagé ou peu nuageux (codes 0, 1, 2)
  if (code === null) return false;
  return [0, 1, 2].includes(code);
}

function isGris(code: number | null): boolean {
  // Gris: couvert (code 3)
  if (code === null) return false;
  return code === 3;
}

export interface YearOccurrencesData {
  byMonth: Record<string, MonthlyOccurrenceStats>;
  months: string[];
  year: string;
  dayCount: number;
}

interface OccurrenceAccumulator {
  txGe30: number; txGe25: number; txGe20: number; tnGe20: number;
  txLe0: number; tnLe0: number; tnLeMinus5: number; tnLeMinus10: number;
  txLe0ConsecutiveMax: number; txGe25ConsecutiveMax: number;
  rrGe1: number; rrGe5: number; rrGe10: number;
  rrGe1ConsecutiveMax: number; rrLe1ConsecutiveMax: number;
  orage: number; brouillard: number; neige: number; beauTemps: number; gris: number;
  ventGe576: number; ventGe1008: number;
  dayCount: number;
}

function newAccumulator(): OccurrenceAccumulator {
  return {
    txGe30: 0, txGe25: 0, txGe20: 0, tnGe20: 0,
    txLe0: 0, tnLe0: 0, tnLeMinus5: 0, tnLeMinus10: 0,
    txLe0ConsecutiveMax: 0, txGe25ConsecutiveMax: 0,
    rrGe1: 0, rrGe5: 0, rrGe10: 0,
    rrGe1ConsecutiveMax: 0, rrLe1ConsecutiveMax: 0,
    orage: 0, brouillard: 0, neige: 0, beauTemps: 0, gris: 0,
    ventGe576: 0, ventGe1008: 0,
    dayCount: 0,
  };
}

function accumulateDays(acc: OccurrenceAccumulator, days: DailyData[]): void {
  acc.dayCount += days.length;
  for (const d of days) {
    if (d.temp_max !== null) {
      if (d.temp_max >= 30) acc.txGe30++;
      if (d.temp_max >= 25) acc.txGe25++;
      if (d.temp_max >= 20) acc.txGe20++;
      if (d.temp_max <= 0) acc.txLe0++;
    }
    if (d.temp_min !== null) {
      if (d.temp_min >= 20) acc.tnGe20++;
      if (d.temp_min <= 0) acc.tnLe0++;
      if (d.temp_min <= -5) acc.tnLeMinus5++;
      if (d.temp_min <= -10) acc.tnLeMinus10++;
    }
    if (d.precipitation !== null) {
      if (d.precipitation >= 1) acc.rrGe1++;
      if (d.precipitation >= 5) acc.rrGe5++;
      if (d.precipitation >= 10) acc.rrGe10++;
    }
    if (isOrage(d.weather_code)) acc.orage++;
    if (isBrouillard(d.weather_code)) acc.brouillard++;
    if (isNeige(d.weather_code)) acc.neige++;
    if (isBeauTemps(d.weather_code)) acc.beauTemps++;
    if (isGris(d.weather_code)) acc.gris++;
    if (d.wind_speed_max !== null) {
      if (d.wind_speed_max >= 57.6) acc.ventGe576++;
      if (d.wind_speed_max >= 100.8) acc.ventGe1008++;
    }
  }
}

function finalizeAccumulator(acc: OccurrenceAccumulator, divisor: number): MonthlyOccurrenceStats {
  const yc = Math.max(1, divisor);
  return {
    txGe30: acc.txGe30 / yc,
    txGe25: acc.txGe25 / yc,
    txGe20: acc.txGe20 / yc,
    tnGe20: acc.tnGe20 / yc,
    txLe0: acc.txLe0 / yc,
    tnLe0: acc.tnLe0 / yc,
    tnLeMinus5: acc.tnLeMinus5 / yc,
    tnLeMinus10: acc.tnLeMinus10 / yc,
    txLe0ConsecutiveMax: acc.txLe0ConsecutiveMax,
    txGe25ConsecutiveMax: acc.txGe25ConsecutiveMax,
    rrGe1: acc.rrGe1 / yc,
    rrGe5: acc.rrGe5 / yc,
    rrGe10: acc.rrGe10 / yc,
    rrGe1ConsecutiveMax: acc.rrGe1ConsecutiveMax,
    rrLe1ConsecutiveMax: acc.rrLe1ConsecutiveMax,
    orage: acc.orage / yc,
    brouillard: acc.brouillard / yc,
    neige: acc.neige / yc,
    beauTemps: acc.beauTemps / yc,
    gris: acc.gris / yc,
    ventGe576: acc.ventGe576 / yc,
    ventGe1008: acc.ventGe1008 / yc,
    dayCount: acc.dayCount,
  };
}

function computeMonthlyAccumulators(dailyData: DailyData[]): Record<string, OccurrenceAccumulator> {
  const monthKeys = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const acc: Record<string, OccurrenceAccumulator> = {};
  for (const m of monthKeys) acc[m] = newAccumulator();

  const byMonthData: Record<string, DailyData[]> = {};
  for (const day of dailyData) {
    const month = day.date.substring(5, 7);
    if (!byMonthData[month]) byMonthData[month] = [];
    byMonthData[month].push(day);
  }

  for (const m of monthKeys) {
    const days = byMonthData[m] ?? [];
    const s = acc[m];
    accumulateDays(s, days);
    s.txLe0ConsecutiveMax = Math.max(s.txLe0ConsecutiveMax, maxConsecutive(days, d => d.temp_max !== null && d.temp_max <= 0));
    s.txGe25ConsecutiveMax = Math.max(s.txGe25ConsecutiveMax, maxConsecutive(days, d => d.temp_max !== null && d.temp_max >= 25));
    s.rrGe1ConsecutiveMax = Math.max(s.rrGe1ConsecutiveMax, maxConsecutive(days, d => d.precipitation !== null && d.precipitation >= 1));
    s.rrLe1ConsecutiveMax = Math.max(s.rrLe1ConsecutiveMax, maxConsecutive(days, d => d.precipitation !== null && d.precipitation <= 1));
  }

  return acc;
}

export async function getOccurrencesData(): Promise<OccurrencesData> {
  const years = listAvailableYears().sort();
  const monthKeys = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  const summed: Record<string, OccurrenceAccumulator> = {};
  for (const m of monthKeys) summed[m] = newAccumulator();

  let totalYears = 0;

  for (const year of years) {
    const data = await getDailyDataForYear(year);
    if (data.length === 0) continue;
    totalYears++;

    const acc = computeMonthlyAccumulators(data);
    for (const m of monthKeys) {
      const s = summed[m];
      const a = acc[m];
      s.txGe30 += a.txGe30; s.txGe25 += a.txGe25; s.txGe20 += a.txGe20; s.tnGe20 += a.tnGe20;
      s.txLe0 += a.txLe0; s.tnLe0 += a.tnLe0; s.tnLeMinus5 += a.tnLeMinus5; s.tnLeMinus10 += a.tnLeMinus10;
      s.rrGe1 += a.rrGe1; s.rrGe5 += a.rrGe5; s.rrGe10 += a.rrGe10;
      s.orage += a.orage; s.brouillard += a.brouillard; s.neige += a.neige;
      s.beauTemps += a.beauTemps; s.gris += a.gris;
      s.ventGe576 += a.ventGe576; s.ventGe1008 += a.ventGe1008;
      s.dayCount += a.dayCount;
      s.txLe0ConsecutiveMax = Math.max(s.txLe0ConsecutiveMax, a.txLe0ConsecutiveMax);
      s.txGe25ConsecutiveMax = Math.max(s.txGe25ConsecutiveMax, a.txGe25ConsecutiveMax);
      s.rrGe1ConsecutiveMax = Math.max(s.rrGe1ConsecutiveMax, a.rrGe1ConsecutiveMax);
      s.rrLe1ConsecutiveMax = Math.max(s.rrLe1ConsecutiveMax, a.rrLe1ConsecutiveMax);
    }
  }

  const byMonth: Record<string, MonthlyOccurrenceStats> = {};
  const firstYear = years[0] ?? '1940';
  const lastYear = years[years.length - 1] ?? '2026';
  for (const m of monthKeys) {
    byMonth[m] = finalizeAccumulator(summed[m], totalYears);
  }

  return {
    byMonth,
    months: monthKeys,
    yearCount: totalYears,
    period: `${firstYear}–${lastYear}`,
  };
}

export async function getOccurrencesDataForYear(year: string): Promise<YearOccurrencesData | null> {
  const data = await getDailyDataForYear(year);
  if (data.length === 0) return null;

  const acc = computeMonthlyAccumulators(data);
  const monthKeys = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const byMonth: Record<string, MonthlyOccurrenceStats> = {};
  let dayCount = 0;
  for (const m of monthKeys) {
    const s = finalizeAccumulator(acc[m], 1);
    byMonth[m] = s;
    dayCount += s.dayCount;
  }

  return { byMonth, months: monthKeys, year, dayCount };
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
