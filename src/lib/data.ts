import fs from 'fs';
import path from 'path';
import { format, subDays } from 'date-fns';

const DATA_DIR = path.join(process.cwd(), 'data');

export interface DailyData {
  date: string;
  weather_code: number;
  temp_max: number;
  temp_min: number;
  temp_mean: number;
  precipitation: number;
  sunshine: number;
  wind_speed_max: number;
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
  sunshine: number;
}

export async function getDailyData(date: string): Promise<DailyData | null> {
  const [year, month, day] = date.split('-');
  const filePath = path.join(DATA_DIR, 'daily', year, month, `${day}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export async function getHourlyData(date: string): Promise<HourlyData[] | null> {
  const [year, month, day] = date.split('-');
  const filePath = path.join(DATA_DIR, 'hourly', year, month, `${day}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export async function getDailyDataForMonth(year: string, month: string): Promise<DailyData[]> {
  const dir = path.join(DATA_DIR, 'daily', year, month);
  if (!fs.existsSync(dir)) return [];
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const results: DailyData[] = files.map(file => {
    return JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  });
  
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

export type UpdateStatus = {
  success: boolean;
  date: string;
  message: string;
};

export async function getUpdateStatus(): Promise<UpdateStatus | null> {
  const statusFile = path.join(DATA_DIR, 'last-update-status.json');
  if (!fs.existsSync(statusFile)) return null;
  try {
    const content = fs.readFileSync(statusFile, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}
