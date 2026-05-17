import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { format, subDays, startOfMonth, startOfYear, parseISO } from 'date-fns';

const LAT = 34.22199159989515;
const LON = -3.3490744462380326;
const TIMEZONE = 'Africa/Casablanca';

const DATA_DIR = path.join(process.cwd(), 'data');

async function fetchWeatherData(startDate: string, endDate: string) {
  let currentEndDate = endDate;
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${LAT}&longitude=${LON}&start_date=${startDate}&end_date=${currentEndDate}&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_gusts_10m,visibility,uv_index,sunshine_duration&daily=weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,sunshine_duration,wind_speed_10m_max&timezone=${TIMEZONE}`;

    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400 && attempts < maxAttempts - 1) {
        console.log(`Data not yet available for ${currentEndDate}, retrying with previous day...`);
        const date = parseISO(currentEndDate);
        currentEndDate = format(subDays(date, 1), 'yyyy-MM-dd');
        attempts++;
        continue;
      }
      console.error('Error fetching weather data:', error.message);
      return null;
    }
  }
  return null;
}

async function saveDailyData(daily: any) {
  const dates = daily.time;
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const [year, month, day] = date.split('-');
    const dir = path.join(DATA_DIR, 'daily', year, month);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const dayData = {
      date,
      weather_code: daily.weather_code[i],
      temp_max: daily.temperature_2m_max[i],
      temp_min: daily.temperature_2m_min[i],
      temp_mean: daily.temperature_2m_mean[i],
      precipitation: daily.precipitation_sum[i],
      sunshine: daily.sunshine_duration[i],
      wind_speed_max: daily.wind_speed_10m_max[i],
    };

    fs.writeFileSync(path.join(dir, `${day}.json`), JSON.stringify(dayData, null, 2));
  }
}

async function saveHourlyData(hourly: any) {
  const times = hourly.time;
  const hourlyByDate: { [key: string]: any[] } = {};

  for (let i = 0; i < times.length; i++) {
    const time = times[i];
    const date = time.split('T')[0];
    if (!hourlyByDate[date]) hourlyByDate[date] = [];

    hourlyByDate[date].push({
      time,
      temp: hourly.temperature_2m[i],
      humidity: hourly.relative_humidity_2m[i],
      dew_point: hourly.dew_point_2m[i],
      precipitation: hourly.precipitation[i],
      weather_code: hourly.weather_code[i],
      pressure: hourly.pressure_msl[i],
      wind_speed: hourly.wind_speed_10m[i],
      wind_gusts: hourly.wind_gusts_10m[i],
      visibility: hourly.visibility[i],
      uv_index: hourly.uv_index[i],
      sunshine: hourly.sunshine_duration[i],
    });
  }

  for (const date in hourlyByDate) {
    const [year, month, day] = date.split('-');
    const dir = path.join(DATA_DIR, 'hourly', year, month);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(path.join(dir, `${day}.json`), JSON.stringify(hourlyByDate[date], null, 2));
  }
}

async function updateStats(startDate: string, endDate: string) {
  // Logic to update monthly and yearly stats
  // For simplicity, we can re-calculate for the affected months/years
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  // Implementation for monthly/yearly aggregation would go here
  // For now, let's just focus on getting the raw data
}

async function main() {
  const args = process.argv.slice(2);
  let startDate: string;
  let endDate: string;

  if (args.length === 2) {
    startDate = args[0];
    endDate = args[1];
  } else {
    const today = new Date();
    const yesterday = subDays(today, 1);
    endDate = format(yesterday, 'yyyy-MM-dd');
    startDate = format(subDays(yesterday, 30), 'yyyy-MM-dd');
  }

  console.log(`Fetching data from ${startDate} to ${endDate}...`);
  const data = await fetchWeatherData(startDate, endDate);

  if (data) {
    await saveDailyData(data.daily);
    await saveHourlyData(data.hourly);
    console.log('Data saved successfully.');
  }
}

main();
