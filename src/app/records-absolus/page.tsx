import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDailyDataForMonth, listAvailableYears } from "@/lib/data";
import { format, parseISO } from "date-fns";
import { getTemperatureColor, getTextColor } from "@/lib/weather-colors";

export const dynamic = 'force-dynamic';

const CURRENT_YEAR = 2026;
const CURRENT_MONTH = 10; // October

function isIncompletePeriod(year: number, monthNum: string): boolean {
  const month = parseInt(monthNum);
  // Exclude current incomplete month
  if (year === CURRENT_YEAR && month === CURRENT_MONTH) return true;
  return false;
}

function isIncompleteYear(year: number): boolean {
  // Exclude current incomplete year
  return year === CURRENT_YEAR;
}

const months = [
  { num: "01", name: "Janvier", short: "Jan" },
  { num: "02", name: "FÃ©vrier", short: "FÃ©v" },
  { num: "03", name: "Mars", short: "Mar" },
  { num: "04", name: "Avril", short: "Avr" },
  { num: "05", name: "Mai", short: "Mai" },
  { num: "06", name: "Juin", short: "Juin" },
  { num: "07", name: "Juillet", short: "Juil" },
  { num: "08", name: "AoÃ»t", short: "AoÃ»t" },
  { num: "09", name: "Septembre", short: "Sep" },
  { num: "10", name: "Octobre", short: "Oct" },
  { num: "11", name: "Novembre", short: "Nov" },
  { num: "12", name: "DÃ©cembre", short: "DÃ©c" },
];

async function getAbsoluteMaxTempForMonth(monthNum: string): Promise<{ value: number; date: string; year: string } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let absoluteMax: { value: number; date: string; year: string } | null = null;

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompletePeriod(yearNum, monthNum)) continue;

    const data = await getDailyDataForMonth(year, monthNum);
    
    for (const day of data) {
      if (day.temp_max !== null && day.temp_max !== undefined) {
        const temp = day.temp_max;
        if (absoluteMax === null || temp > absoluteMax.value) {
          absoluteMax = {
            value: temp,
            date: day.date,
            year: year
          };
        }
      }
    }
  }

  return absoluteMax;
}

async function getAbsoluteMinTempForMonth(monthNum: string): Promise<{ value: number; date: string; year: string } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let absoluteMin: { value: number; date: string; year: string } | null = null;

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompletePeriod(yearNum, monthNum)) continue;

    const data = await getDailyDataForMonth(year, monthNum);
    
    for (const day of data) {
      if (day.temp_min !== null && day.temp_min !== undefined) {
        const temp = day.temp_min;
        if (absoluteMin === null || temp < absoluteMin.value) {
          absoluteMin = {
            value: temp,
            date: day.date,
            year: year
          };
        }
      }
    }
  }

  return absoluteMin;
}

async function getMinOfMaxTempForMonth(monthNum: string): Promise<{ value: number; date: string; year: string } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let minOfMax: { value: number; date: string; year: string } | null = null;

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompletePeriod(yearNum, monthNum)) continue;

    const data = await getDailyDataForMonth(year, monthNum);
    
    for (const day of data) {
      if (day.temp_max !== null && day.temp_max !== undefined) {
        const temp = day.temp_max;
        if (minOfMax === null || temp < minOfMax.value) {
          minOfMax = {
            value: temp,
            date: day.date,
            year: year
          };
        }
      }
    }
  }

  return minOfMax;
}

async function getMaxOfMinTempForMonth(monthNum: string): Promise<{ value: number; date: string; year: string } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let maxOfMin: { value: number; date: string; year: string } | null = null;

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompletePeriod(yearNum, monthNum)) continue;

    const data = await getDailyDataForMonth(year, monthNum);
    
    for (const day of data) {
      if (day.temp_min !== null && day.temp_min !== undefined) {
        const temp = day.temp_min;
        if (maxOfMin === null || temp > maxOfMin.value) {
          maxOfMin = {
            value: temp,
            date: day.date,
            year: year
          };
        }
      }
    }
  }

  return maxOfMin;
}

async function getHighestMonthlyAvgMaxTempForMonth(monthNum: string): Promise<{ value: number; year: string } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let highestAvgMax: { value: number; year: string } | null = null;

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompletePeriod(yearNum, monthNum)) continue;

    const data = await getDailyDataForMonth(year, monthNum);
    
    // Calculate average max temp for this month in this year
    const validDays = data.filter(d => d.temp_max !== null && d.temp_max !== undefined);
    if (validDays.length === 0) continue;
    
    const sumMax = validDays.reduce((sum, d) => sum + (d.temp_max as number), 0);
    const avgMax = sumMax / validDays.length;
    
    if (highestAvgMax === null || avgMax > highestAvgMax.value) {
      highestAvgMax = {
        value: avgMax,
        year: year
      };
    }
  }

  return highestAvgMax;
}

async function getLowestMonthlyAvgMaxTempForMonth(monthNum: string): Promise<{ value: number; year: string } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let lowestAvgMax: { value: number; year: string } | null = null;

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompletePeriod(yearNum, monthNum)) continue;

    const data = await getDailyDataForMonth(year, monthNum);
    
    // Calculate average max temp for this month in this year
    const validDays = data.filter(d => d.temp_max !== null && d.temp_max !== undefined);
    if (validDays.length === 0) continue;
    
    const sumMax = validDays.reduce((sum, d) => sum + (d.temp_max as number), 0);
    const avgMax = sumMax / validDays.length;
    
    if (lowestAvgMax === null || avgMax < lowestAvgMax.value) {
      lowestAvgMax = {
        value: avgMax,
        year: year
      };
    }
  }

  return lowestAvgMax;
}

async function getLowestMonthlyAvgMinTempForMonth(monthNum: string): Promise<{ value: number; year: string } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let lowestAvgMin: { value: number; year: string } | null = null;

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompletePeriod(yearNum, monthNum)) continue;

    const data = await getDailyDataForMonth(year, monthNum);
    
    // Calculate average min temp for this month in this year
    const validDays = data.filter(d => d.temp_min !== null && d.temp_min !== undefined);
    if (validDays.length === 0) continue;
    
    const sumMin = validDays.reduce((sum, d) => sum + (d.temp_min as number), 0);
    const avgMin = sumMin / validDays.length;
    
    if (lowestAvgMin === null || avgMin < lowestAvgMin.value) {
      lowestAvgMin = {
        value: avgMin,
        year: year
      };
    }
  }

  return lowestAvgMin;
}

async function getHighestMonthlyAvgMinTempForMonth(monthNum: string): Promise<{ value: number; year: string } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let highestAvgMin: { value: number; year: string } | null = null;

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompletePeriod(yearNum, monthNum)) continue;

    const data = await getDailyDataForMonth(year, monthNum);
    
    // Calculate average min temp for this month in this year
    const validDays = data.filter(d => d.temp_min !== null && d.temp_min !== undefined);
    if (validDays.length === 0) continue;
    
    const sumMin = validDays.reduce((sum, d) => sum + (d.temp_min as number), 0);
    const avgMin = sumMin / validDays.length;
    
    if (highestAvgMin === null || avgMin > highestAvgMin.value) {
      highestAvgMin = {
        value: avgMin,
        year: year
      };
    }
  }

  return highestAvgMin;
}

async function getAverageAbsoluteMinTempForMonth(monthNum: string): Promise<{ value: number } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let absoluteMinRecords: number[] = [];

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompletePeriod(yearNum, monthNum)) continue;

    const data = await getDailyDataForMonth(year, monthNum);
    
    // Find the absolute minimum temperature for this month in this year
    const validDays = data.filter(d => d.temp_min !== null && d.temp_min !== undefined);
    if (validDays.length === 0) continue;
    
    const minTemp = Math.min(...validDays.map(d => d.temp_min as number));
    absoluteMinRecords.push(minTemp);
  }

  if (absoluteMinRecords.length === 0) return null;
  
  const avg = absoluteMinRecords.reduce((sum, v) => sum + v, 0) / absoluteMinRecords.length;
  return { value: avg };
}

async function getAverageAbsoluteMinTempOverall(): Promise<{ value: number } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let annualMinRecords: number[] = [];

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompleteYear(yearNum)) continue;

    let yearMin: number | null = null;

    // Check all 12 months for this year
    for (let month = 1; month <= 12; month++) {
      const monthNum = month.toString().padStart(2, '0');
      if (isIncompletePeriod(yearNum, monthNum)) continue;
      
      const data = await getDailyDataForMonth(year, monthNum);
      
      const validDays = data.filter(d => d.temp_min !== null && d.temp_min !== undefined);
      if (validDays.length === 0) continue;
      
      const monthMin = Math.min(...validDays.map(d => d.temp_min as number));
      if (yearMin === null || monthMin < yearMin) {
        yearMin = monthMin;
      }
    }

    if (yearMin !== null) {
      annualMinRecords.push(yearMin);
    }
  }

  if (annualMinRecords.length === 0) return null;
  
  const avg = annualMinRecords.reduce((sum, v) => sum + v, 0) / annualMinRecords.length;
  return { value: avg };
}

async function getAverageAbsoluteMaxTempForMonth(monthNum: string): Promise<{ value: number } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let absoluteMaxRecords: number[] = [];

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompletePeriod(yearNum, monthNum)) continue;

    const data = await getDailyDataForMonth(year, monthNum);
    
    // Find the absolute maximum temperature for this month in this year
    const validDays = data.filter(d => d.temp_max !== null && d.temp_max !== undefined);
    if (validDays.length === 0) continue;
    
    const maxTemp = Math.max(...validDays.map(d => d.temp_max as number));
    absoluteMaxRecords.push(maxTemp);
  }

  if (absoluteMaxRecords.length === 0) return null;
  
  const avg = absoluteMaxRecords.reduce((sum, v) => sum + v, 0) / absoluteMaxRecords.length;
  return { value: avg };
}

async function getAverageAbsoluteMaxTempOverall(): Promise<{ value: number } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let annualMaxRecords: number[] = [];

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompleteYear(yearNum)) continue;

    let yearMax: number | null = null;

    // Check all 12 months for this year
    for (let month = 1; month <= 12; month++) {
      const monthNum = month.toString().padStart(2, '0');
      if (isIncompletePeriod(yearNum, monthNum)) continue;
      
      const data = await getDailyDataForMonth(year, monthNum);
      
      const validDays = data.filter(d => d.temp_max !== null && d.temp_max !== undefined);
      if (validDays.length === 0) continue;
      
      const monthMax = Math.max(...validDays.map(d => d.temp_max as number));
      if (yearMax === null || monthMax > yearMax) {
        yearMax = monthMax;
      }
    }

    if (yearMax !== null) {
      annualMaxRecords.push(yearMax);
    }
  }

  if (annualMaxRecords.length === 0) return null;
  
  const avg = annualMaxRecords.reduce((sum, v) => sum + v, 0) / annualMaxRecords.length;
  return { value: avg };
}

async function getSunniestMonthForMonth(monthNum: string): Promise<{ value: number; date: string; year: string } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let sunniestMonth: { value: number; date: string; year: string } | null = null;

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompletePeriod(yearNum, monthNum)) continue;

    const data = await getDailyDataForMonth(year, monthNum);
    
    let monthTotal = 0;
    let validDays = 0;
    for (const day of data) {
      if (day.estimated_daily_sunshine_minutes !== null && day.estimated_daily_sunshine_minutes !== undefined) {
        monthTotal += day.estimated_daily_sunshine_minutes;
        validDays++;
      }
    }
    if (validDays === 0) continue;

    const monthTotalHours = monthTotal / 60;
    if (sunniestMonth === null || monthTotalHours > sunniestMonth.value) {
      sunniestMonth = {
        value: monthTotalHours,
        date: `${year}-${monthNum}`,
        year: year
      };
    }
  }

  return sunniestMonth;
}

async function getSunniestYearOverall(): Promise<{ value: number; year: string } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let sunniestYear: { value: number; year: string } | null = null;

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompleteYear(yearNum)) continue;

    let yearTotal = 0;
    let validMonths = 0;

    for (let month = 1; month <= 12; month++) {
      const monthNum = month.toString().padStart(2, '0');
      if (isIncompletePeriod(yearNum, monthNum)) continue;
      
      const data = await getDailyDataForMonth(year, monthNum);
      
      let monthTotal = 0;
      let validDays = 0;
      for (const day of data) {
        if (day.estimated_daily_sunshine_minutes !== null && day.estimated_daily_sunshine_minutes !== undefined) {
          monthTotal += day.estimated_daily_sunshine_minutes;
          validDays++;
        }
      }
      if (validDays > 0) {
        yearTotal += monthTotal;
        validMonths++;
      }
    }

    if (validMonths === 0) continue;

    const yearTotalHours = yearTotal / 60;
    if (sunniestYear === null || yearTotalHours > sunniestYear.value) {
      sunniestYear = {
        value: yearTotalHours,
        year: year
      };
    }
  }

  return sunniestYear;
}

async function getAverageSunniestMonthPerMonth(monthNum: string): Promise<{ value: number } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let monthlySunshineRecords: number[] = [];

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompletePeriod(yearNum, monthNum)) continue;

    const data = await getDailyDataForMonth(year, monthNum);
    
    let monthTotal = 0;
    let validDays = 0;
    for (const day of data) {
      if (day.estimated_daily_sunshine_minutes !== null && day.estimated_daily_sunshine_minutes !== undefined) {
        monthTotal += day.estimated_daily_sunshine_minutes;
        validDays++;
      }
    }
    if (validDays === 0) continue;

    monthlySunshineRecords.push(monthTotal / 60);
  }

  if (monthlySunshineRecords.length === 0) return null;
  
  const avg = monthlySunshineRecords.reduce((sum, v) => sum + v, 0) / monthlySunshineRecords.length;
  return { value: avg };
}

async function getAverageSunniestYearOverall(): Promise<{ value: number } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let annualSunshineRecords: number[] = [];

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompleteYear(yearNum)) continue;

    let yearTotal = 0;
    let validMonths = 0;

    for (let month = 1; month <= 12; month++) {
      const monthNum = month.toString().padStart(2, '0');
      if (isIncompletePeriod(yearNum, monthNum)) continue;
      
      const data = await getDailyDataForMonth(year, monthNum);
      
      let monthTotal = 0;
      let validDays = 0;
      for (const day of data) {
        if (day.estimated_daily_sunshine_minutes !== null && day.estimated_daily_sunshine_minutes !== undefined) {
          monthTotal += day.estimated_daily_sunshine_minutes;
          validDays++;
        }
      }
      if (validDays > 0) {
        yearTotal += monthTotal;
        validMonths++;
      }
    }

    if (validMonths === 0) continue;

    annualSunshineRecords.push(yearTotal / 60);
  }

  if (annualSunshineRecords.length === 0) return null;
  
  const avg = annualSunshineRecords.reduce((sum, v) => sum + v, 0) / annualSunshineRecords.length;
  return { value: avg };
}

async function getLeastSunnyMonthForMonth(monthNum: string): Promise<{ value: number; date: string; year: string } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let leastSunnyMonth: { value: number; date: string; year: string } | null = null;

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompletePeriod(yearNum, monthNum)) continue;

    const data = await getDailyDataForMonth(year, monthNum);
    
    let monthTotal = 0;
    let validDays = 0;
    for (const day of data) {
      if (day.estimated_daily_sunshine_minutes !== null && day.estimated_daily_sunshine_minutes !== undefined) {
        monthTotal += day.estimated_daily_sunshine_minutes;
        validDays++;
      }
    }
    if (validDays === 0) continue;

    const monthTotalHours = monthTotal / 60;
    if (leastSunnyMonth === null || monthTotalHours < leastSunnyMonth.value) {
      leastSunnyMonth = {
        value: monthTotalHours,
        date: `${year}-${monthNum}`,
        year: year
      };
    }
  }

  return leastSunnyMonth;
}

async function getLeastSunnyYearOverall(): Promise<{ value: number; year: string } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let leastSunnyYear: { value: number; year: string } | null = null;

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompleteYear(yearNum)) continue;

    let yearTotal = 0;
    let validMonths = 0;

    for (let month = 1; month <= 12; month++) {
      const monthNum = month.toString().padStart(2, '0');
      if (isIncompletePeriod(yearNum, monthNum)) continue;
      
      const data = await getDailyDataForMonth(year, monthNum);
      
      let monthTotal = 0;
      let validDays = 0;
      for (const day of data) {
        if (day.estimated_daily_sunshine_minutes !== null && day.estimated_daily_sunshine_minutes !== undefined) {
          monthTotal += day.estimated_daily_sunshine_minutes;
          validDays++;
        }
      }
      if (validDays > 0) {
        yearTotal += monthTotal;
        validMonths++;
      }
    }

    if (validMonths === 0) continue;

    const yearTotalHours = yearTotal / 60;
    if (leastSunnyYear === null || yearTotalHours < leastSunnyYear.value) {
      leastSunnyYear = {
        value: yearTotalHours,
        year: year
      };
    }
  }

  return leastSunnyYear;
}

async function getAverageLeastSunnyMonthPerMonth(monthNum: string): Promise<{ value: number } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let monthlySunshineRecords: number[] = [];

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompletePeriod(yearNum, monthNum)) continue;

    const data = await getDailyDataForMonth(year, monthNum);
    
    let monthTotal = 0;
    let validDays = 0;
    for (const day of data) {
      if (day.estimated_daily_sunshine_minutes !== null && day.estimated_daily_sunshine_minutes !== undefined) {
        monthTotal += day.estimated_daily_sunshine_minutes;
        validDays++;
      }
    }
    if (validDays === 0) continue;

    monthlySunshineRecords.push(monthTotal / 60);
  }

  if (monthlySunshineRecords.length === 0) return null;
  
  const avg = monthlySunshineRecords.reduce((sum, v) => sum + v, 0) / monthlySunshineRecords.length;
  return { value: avg };
}

async function getAverageLeastSunnyYearOverall(): Promise<{ value: number } | null> {
  const years = listAvailableYears().sort((a, b) => parseInt(a) - parseInt(b));
  let annualSunshineRecords: number[] = [];

  for (const year of years) {
    const yearNum = parseInt(year);
    if (yearNum < 1940 || yearNum > 2026) continue;
    if (isIncompleteYear(yearNum)) continue;

    let yearTotal = 0;
    let validMonths = 0;

    for (let month = 1; month <= 12; month++) {
      const monthNum = month.toString().padStart(2, '0');
      if (isIncompletePeriod(yearNum, monthNum)) continue;
      
      const data = await getDailyDataForMonth(year, monthNum);
      
      let monthTotal = 0;
      let validDays = 0;
      for (const day of data) {
        if (day.estimated_daily_sunshine_minutes !== null && day.estimated_daily_sunshine_minutes !== undefined) {
          monthTotal += day.estimated_daily_sunshine_minutes;
          validDays++;
        }
      }
      if (validDays > 0) {
        yearTotal += monthTotal;
        validMonths++;
      }
    }

    if (validMonths === 0) continue;

    annualSunshineRecords.push(yearTotal / 60);
  }

  if (annualSunshineRecords.length === 0) return null;
  
  const avg = annualSunshineRecords.reduce((sum, v) => sum + v, 0) / annualSunshineRecords.length;
  return { value: avg };
}

export default async function RecordsAbsolusPage() {
  // Fetch all records in parallel
  const maxTempPromises = months.map(m => getAbsoluteMaxTempForMonth(m.num));
  const minTempPromises = months.map(m => getAbsoluteMinTempForMonth(m.num));
  const minOfMaxPromises = months.map(m => getMinOfMaxTempForMonth(m.num));
  const maxOfMinPromises = months.map(m => getMaxOfMinTempForMonth(m.num));
  const highestAvgMaxPromises = months.map(m => getHighestMonthlyAvgMaxTempForMonth(m.num));
  const lowestAvgMaxPromises = months.map(m => getLowestMonthlyAvgMaxTempForMonth(m.num));
  const lowestAvgMinPromises = months.map(m => getLowestMonthlyAvgMinTempForMonth(m.num));
  const highestAvgMinPromises = months.map(m => getHighestMonthlyAvgMinTempForMonth(m.num));
  const avgAbsMinPromises = months.map(m => getAverageAbsoluteMinTempForMonth(m.num));
  const avgAbsMinOverallPromise = getAverageAbsoluteMinTempOverall();
  const avgAbsMaxPromises = months.map(m => getAverageAbsoluteMaxTempForMonth(m.num));
  const avgAbsMaxOverallPromise = getAverageAbsoluteMaxTempOverall();
  const sunniestMonthPromises = months.map(m => getSunniestMonthForMonth(m.num));
  const sunniestYearPromise = getSunniestYearOverall();
  const avgSunniestMonthPromises = months.map(m => getAverageSunniestMonthPerMonth(m.num));
  const avgSunniestYearPromise = getAverageSunniestYearOverall();
  const leastSunnyMonthPromises = months.map(m => getLeastSunnyMonthForMonth(m.num));
  const leastSunnyYearPromise = getLeastSunnyYearOverall();
  const avgLeastSunnyMonthPromises = months.map(m => getAverageLeastSunnyMonthPerMonth(m.num));
  const avgLeastSunnyYearPromise = getAverageLeastSunnyYearOverall();

  const [maxTemps, minTemps, minOfMaxTemps, maxOfMinTemps, highestAvgMaxTemps, lowestAvgMaxTemps, lowestAvgMinTemps, highestAvgMinTemps, avgAbsMinTemps, avgAbsMinOverall, avgAbsMaxTemps, avgAbsMaxOverall, sunniestMonths, sunniestYear, avgSunniestMonths, avgSunniestYear, leastSunnyMonths, leastSunnyYear, avgLeastSunnyMonths, avgLeastSunnyYear] = await Promise.all([
    Promise.all(maxTempPromises),
    Promise.all(minTempPromises),
    Promise.all(minOfMaxPromises),
    Promise.all(maxOfMinPromises),
    Promise.all(highestAvgMaxPromises),
    Promise.all(lowestAvgMaxPromises),
    Promise.all(lowestAvgMinPromises),
    Promise.all(highestAvgMinPromises),
    Promise.all(avgAbsMinPromises),
    avgAbsMinOverallPromise,
    Promise.all(avgAbsMaxPromises),
    avgAbsMaxOverallPromise,
    Promise.all(sunniestMonthPromises),
    sunniestYearPromise,
    Promise.all(avgSunniestMonthPromises),
    avgSunniestYearPromise,
    Promise.all(leastSunnyMonthPromises),
    leastSunnyYearPromise,
    Promise.all(avgLeastSunnyMonthPromises),
    avgLeastSunnyYearPromise
  ]);

  // Ensure all arrays are defined (fallback to empty arrays)
  const maxTempsSafe = maxTemps ?? [];
  const minTempsSafe = minTemps ?? [];
  const minOfMaxTempsSafe = minOfMaxTemps ?? [];
  const maxOfMinTempsSafe = maxOfMinTemps ?? [];
  const highestAvgMaxTempsSafe = highestAvgMaxTemps ?? [];
  const lowestAvgMaxTempsSafe = lowestAvgMaxTemps ?? [];
  const lowestAvgMinTempsSafe = lowestAvgMinTemps ?? [];
  const highestAvgMinTempsSafe = highestAvgMinTemps ?? [];
  const avgAbsMinTempsSafe = avgAbsMinTemps ?? [];
  const avgAbsMaxTempsSafe = avgAbsMaxTemps ?? [];
  const sunniestMonthsSafe = sunniestMonths ?? [];
  const avgSunniestMonthsSafe = avgSunniestMonths ?? [];
  const leastSunnyMonthsSafe = leastSunnyMonths ?? [];
  const avgLeastSunnyMonthsSafe = avgLeastSunnyMonths ?? [];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Records Absolus - Guercif</h1>
        <p className="text-muted-foreground">
          Records absolus de tempÃ©rature (1940-2026) basÃ©s sur les donnÃ©es journaliÃ¨res Open-Meteo.
        </p>
      </div>

      {/* Max Temperature Records */}
      <Card>
        <CardHeader>
          <CardTitle>TempÃ©. maxi extrÃªme (Â°C)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="border px-3 py-2 font-bold text-left sticky left-0 z-10">Record</TableHead>
                  {months.map(m => (
                    <TableHead key={m.num} className="border px-2 py-2 font-bold text-center text-sm capitalize">
                      {m.short}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">TempÃ©. maxi extrÃªme (Â°C)</TableCell>
                  {maxTempsSafe.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    const bgColor = getTemperatureColor(record.value);
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        <div className="font-bold">{record.value?.toFixed(1) ?? '-'}</div>
                        <div className="text-[10px] text-muted-foreground/80">{record.year}</div>
                      </TableCell>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">Date</TableCell>
                  {maxTempsSafe.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center text-[11px] text-muted-foreground">
                        {format(parseISO(record.date), 'dd/MM/yyyy')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Min Temperature Records */}
      <Card>
        <CardHeader>
          <CardTitle>TempÃ©. mini extrÃªme (Â°C)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="border px-3 py-2 font-bold text-left sticky left-0 z-10">Record</TableHead>
                  {months.map(m => (
                    <TableHead key={m.num} className="border px-2 py-2 font-bold text-center text-sm capitalize">
                      {m.short}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">TempÃ©. mini extrÃªme (Â°C)</TableCell>
                  {minTempsSafe.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    const bgColor = getTemperatureColor(record.value);
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        <div className="font-bold">{record.value?.toFixed(1) ?? '-'}</div>
                        <div className="text-[10px] text-muted-foreground/80">{record.year}</div>
                      </TableCell>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">Date</TableCell>
                  {minTempsSafe.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center text-[11px] text-muted-foreground">
                        {format(parseISO(record.date), 'dd/MM/yyyy')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Min of Max Temperature Records (TXN) */}
      <Card>
        <CardHeader>
          <CardTitle>TempÃ©. maxi minimale (Â°C)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="border px-3 py-2 font-bold text-left sticky left-0 z-10">Record</TableHead>
                  {months.map(m => (
                    <TableHead key={m.num} className="border px-2 py-2 font-bold text-center text-sm capitalize">
                      {m.short}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">TempÃ©. maxi minimale (Â°C)</TableCell>
{minOfMaxTempsSafe?.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    const bgColor = getTemperatureColor(record.value);
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        <div className="font-bold">{record.value?.toFixed(1) ?? '-'}</div>
                        <div className="text-[10px] text-muted-foreground/80">{record.year}</div>
                      </TableCell>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">Date</TableCell>
                  {minOfMaxTempsSafe?.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center text-[11px] text-muted-foreground">
                        {format(parseISO(record.date), 'dd/MM/yyyy')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Max of Min Temperature Records (TNX) */}
      <Card>
        <CardHeader>
          <CardTitle>TempÃ©. mini maximale (Â°C)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="border px-3 py-2 font-bold text-left sticky left-0 z-10">Record</TableHead>
                  {months.map(m => (
                    <TableHead key={m.num} className="border px-2 py-2 font-bold text-center text-sm capitalize">
                      {m.short}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">TempÃ©. mini maximale (Â°C)</TableCell>
                  {maxOfMinTempsSafe.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    const bgColor = getTemperatureColor(record.value);
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        <div className="font-bold">{record.value?.toFixed(1) ?? '-'}</div>
                        <div className="text-[10px] text-muted-foreground/80">{record.year}</div>
                      </TableCell>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">Date</TableCell>
                  {maxOfMinTempsSafe.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center text-[11px] text-muted-foreground">
                        {format(parseISO(record.date), 'dd/MM/yyyy')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Highest Monthly Average Max Temperature Records */}
      <Card>
        <CardHeader>
          <CardTitle>TempÃ©. maxi moyenne la plus haute (Â°C)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="border px-3 py-2 font-bold text-left sticky left-0 z-10">Record</TableHead>
                  {months.map(m => (
                    <TableHead key={m.num} className="border px-2 py-2 font-bold text-center text-sm capitalize">
                      {m.short}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
<TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">TempÃ©. maxi moyenne la plus haute (Â°C)</TableCell>
                  {highestAvgMaxTempsSafe?.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    const bgColor = getTemperatureColor(record.value);
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        <div className="font-bold">{record.value?.toFixed(1) ?? '-'}</div>
                        <div className="text-[10px] text-muted-foreground/80">{record.year}</div>
                      </TableCell>
                    );
                  })}
                </TableRow>
<TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">AnnÃ©e</TableCell>
                  {highestAvgMaxTempsSafe?.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center text-[11px] text-muted-foreground">
                        {record.year}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Lowest Monthly Average Max Temperature Records */}
      <Card>
        <CardHeader>
          <CardTitle>TempÃ©. maxi moyenne la plus basse (Â°C)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="border px-3 py-2 font-bold text-left sticky left-0 z-10">Record</TableHead>
                  {months.map(m => (
                    <TableHead key={m.num} className="border px-2 py-2 font-bold text-center text-sm capitalize">
                      {m.short}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">TempÃ©. maxi moyenne la plus basse (Â°C)</TableCell>
                  {lowestAvgMaxTempsSafe.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    const bgColor = getTemperatureColor(record.value);
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        <div className="font-bold">{record.value?.toFixed(1) ?? '-'}</div>
                        <div className="text-[10px] text-muted-foreground/80">{record.year}</div>
                      </TableCell>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">AnnÃ©e</TableCell>
                  {lowestAvgMaxTempsSafe.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center text-[11px] text-muted-foreground">
                        {record.year}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Lowest Monthly Average Min Temperature Records */}
      <Card>
        <CardHeader>
          <CardTitle>TempÃ©. mini moyenne la plus basse (Â°C)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="border px-3 py-2 font-bold text-left sticky left-0 z-10">Record</TableHead>
                  {months.map(m => (
                    <TableHead key={m.num} className="border px-2 py-2 font-bold text-center text-sm capitalize">
                      {m.short}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
<TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">TempÃ©. mini moyenne la plus basse (Â°C)</TableCell>
                  {lowestAvgMinTempsSafe?.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    const bgColor = getTemperatureColor(record.value);
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        <div className="font-bold">{record.value?.toFixed(1) ?? '-'}</div>
                        <div className="text-[10px] text-muted-foreground/80">{record.year}</div>
                      </TableCell>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">AnnÃ©e</TableCell>
                  {lowestAvgMinTempsSafe.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center text-[11px] text-muted-foreground">
                        {record.year}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Highest Monthly Average Min Temperature Records */}
      <Card>
        <CardHeader>
          <CardTitle>TempÃ©. mini moyenne la plus haute (Â°C)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="border px-3 py-2 font-bold text-left sticky left-0 z-10">Record</TableHead>
                  {months.map(m => (
                    <TableHead key={m.num} className="border px-2 py-2 font-bold text-center text-sm capitalize">
                      {m.short}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
<TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">TempÃ©. mini moyenne la plus haute (Â°C)</TableCell>
                  {highestAvgMinTempsSafe?.map((record, idx) => {
                      if (!record) {
                        return (
                          <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                        );
                      }
                    const bgColor = getTemperatureColor(record.value);
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        <div className="font-bold">{record.value?.toFixed(1) ?? '-'}</div>
                        <div className="text-[10px] text-muted-foreground/80">{record.year}</div>
                      </TableCell>
                    );
                  })}
                </TableRow>
<TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">AnnÃ©e</TableCell>
                  {highestAvgMinTempsSafe?.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center text-[11px] text-muted-foreground">
                        {record.year}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Average of Absolute Minimum Records per Month */}
      <Card>
        <CardHeader>
          <CardTitle>Moyenne des records de froid absolu (Â°C)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="border px-3 py-2 font-bold text-left sticky left-0 z-10">Record</TableHead>
                  {months.map(m => (
                    <TableHead key={m.num} className="border px-2 py-2 font-bold text-center text-sm capitalize">
                      {m.short}
                    </TableHead>
                  ))}
                  <TableHead className="border px-3 py-2 font-bold text-center text-sm capitalize bg-primary/10">AnnÃ©e</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">Moyenne records froid absolu (Â°C)</TableCell>
                  {avgAbsMinTempsSafe.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    const bgColor = getTemperatureColor(record.value);
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        <div className="font-bold">{record.value?.toFixed(1) ?? '-'}</div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="border font-bold px-3 py-2 text-center bg-primary/10" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                    {avgAbsMinOverall?.value?.toFixed(1) ?? 'â€”'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Average of Absolute Maximum Records per Month */}
      <Card>
        <CardHeader>
          <CardTitle>Moyenne des records de chaleur absolu (Â°C)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="border px-3 py-2 font-bold text-left sticky left-0 z-10">Record</TableHead>
                  {months.map(m => (
                    <TableHead key={m.num} className="border px-2 py-2 font-bold text-center text-sm capitalize">
                      {m.short}
                    </TableHead>
                  ))}
                  <TableHead className="border px-3 py-2 font-bold text-center text-sm capitalize bg-primary/10">AnnÃ©e</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
<TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">Moyenne records chaleur absolu (Â°C)</TableCell>
                  {avgAbsMaxTempsSafe?.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    const bgColor = getTemperatureColor(record.value);
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        <div className="font-bold">{record.value?.toFixed(1) ?? '-'}</div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="border font-bold px-3 py-2 text-center bg-primary/10" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                    {avgAbsMaxOverall?.value?.toFixed(1) ?? 'â€”'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
</Card>

      {/* Sunniest Month Records (Estimated Sunshine) */}
      <Card>
        <CardHeader>
          <CardTitle>Mois le plus ensoleillÃ© (EstimÃ©) - Total mensuel (h)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="border px-3 py-2 font-bold text-left sticky left-0 z-10">Record</TableHead>
                  {months.map(m => (
                    <TableHead key={m.num} className="border px-2 py-2 font-bold text-center text-sm capitalize">
                      {m.short}
                    </TableHead>
                  ))}
                  <TableHead className="border px-3 py-2 font-bold text-center text-sm capitalize bg-primary/10">AnnÃ©e</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">Total ensoleillement estimÃ© (h)</TableCell>
                  {sunniestMonthsSafe.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    const bgColor = getTemperatureColor(record.value / 15 * 50);
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        <div className="font-bold">{record.value?.toFixed(1) ?? '-'}</div>
                        <div className="text-[10px] text-muted-foreground/80">{record.year}</div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="border font-bold px-3 py-2 text-center bg-primary/10" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                    {sunniestYear?.value?.toFixed(1) ?? 'â€”'}
                    <div className="text-[10px] text-muted-foreground/80">{sunniestYear?.year ?? ''}</div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Average of Sunniest Month per Month (Estimated Sunshine) */}
      <Card>
        <CardHeader>
          <CardTitle>Moyenne mensuelle d'ensoleillement estimÃ© (h)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="border px-3 py-2 font-bold text-left sticky left-0 z-10">Record</TableHead>
                  {months.map(m => (
                    <TableHead key={m.num} className="border px-2 py-2 font-bold text-center text-sm capitalize">
                      {m.short}
                    </TableHead>
                  ))}
                  <TableHead className="border px-3 py-2 font-bold text-center text-sm capitalize bg-primary/10">AnnÃ©e</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">Moyenne ensoleillement estimÃ© (h)</TableCell>
                  {avgSunniestMonthsSafe.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    const bgColor = getTemperatureColor(record.value / 15 * 50);
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        <div className="font-bold">{record.value?.toFixed(1) ?? '-'}</div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="border font-bold px-3 py-2 text-center bg-primary/10" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                    {avgSunniestYear?.value?.toFixed(1) ?? 'â€”'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Least Sunny Month Records (Estimated Sunshine) */}
      <Card>
        <CardHeader>
          <CardTitle>Mois le moins ensoleillÃ© (EstimÃ©) - Total mensuel (h)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="border px-3 py-2 font-bold text-left sticky left-0 z-10">Record</TableHead>
                  {months.map(m => (
                    <TableHead key={m.num} className="border px-2 py-2 font-bold text-center text-sm capitalize">
                      {m.short}
                    </TableHead>
                  ))}
                  <TableHead className="border px-3 py-2 font-bold text-center text-sm capitalize bg-primary/10">AnnÃ©e</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">Total ensoleillement estimÃ© (h)</TableCell>
                  {leastSunnyMonthsSafe.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    const bgColor = getTemperatureColor(record.value / 15 * 50);
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        <div className="font-bold">{record.value?.toFixed(1) ?? '-'}</div>
                        <div className="text-[10px] text-muted-foreground/80">{record.year}</div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="border font-bold px-3 py-2 text-center bg-primary/10" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                    {leastSunnyYear?.value?.toFixed(1) ?? 'â€”'}
                    <div className="text-[10px] text-muted-foreground/80">{leastSunnyYear?.year ?? ''}</div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Average of Least Sunny Month per Month (Estimated Sunshine) */}
      <Card>
        <CardHeader>
          <CardTitle>Moyenne mensuelle d'ensoleillement estimÃ© le plus faible (h)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-muted/50 border-b">
                  <TableHead className="border px-3 py-2 font-bold text-left sticky left-0 z-10">Record</TableHead>
                  {months.map(m => (
                    <TableHead key={m.num} className="border px-2 py-2 font-bold text-center text-sm capitalize">
                      {m.short}
                    </TableHead>
                  ))}
                  <TableHead className="border px-3 py-2 font-bold text-center text-sm capitalize bg-primary/10">AnnÃ©e</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="border font-bold px-3 py-2 text-left bg-muted/50">Moyenne ensoleillement estimÃ© le plus faible (h)</TableCell>
                  {avgLeastSunnyMonthsSafe.map((record, idx) => {
                    if (!record) {
                      return (
                        <TableCell key={idx} className="border px-2 py-2 text-center text-muted-foreground">â€”</TableCell>
                      );
                    }
                    const bgColor = getTemperatureColor(record.value / 15 * 50);
                    return (
                      <TableCell key={idx} className="border px-2 py-2 text-center" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        <div className="font-bold">{record.value?.toFixed(1) ?? '-'}</div>
                      </TableCell>
                    );
                  })}
                  <TableCell className="border font-bold px-3 py-2 text-center bg-primary/10" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                    {avgLeastSunnyYear?.value?.toFixed(1) ?? 'â€”'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="text-sm text-muted-foreground">
        <CardHeader>
          <CardTitle>Sources & MÃ©thodologie</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-1">
            <li>DonnÃ©es basÃ©es sur les relevÃ©s journaliers Open-Meteo (ERA5 reanalysis) pour Guercif (34.2257Â°N, -3.3536Â°W).</li>
            <li>PÃ©riode couverte : janvier 1940 Ã  janvier 2026 (87 annÃ©es).</li>
            <li>TempÃ©. maxi extrÃªme : valeur maximale de temp_max journaliÃ¨re pour chaque mois sur toute la pÃ©riode.</li>
            <li>TempÃ©. mini maximale : valeur maximale de temp_min journaliÃ¨re pour chaque mois sur toute la pÃ©riode (nuit la plus chaude).</li>
            <li>TempÃ©. maxi moyenne la plus haute : moyenne mensuelle des maximales la plus Ã©levÃ©e pour chaque mois sur toute la pÃ©riode (mois le plus chaud en moyenne).</li>
            <li>TempÃ©. maxi moyenne la plus basse : moyenne mensuelle des maximales la plus basse pour chaque mois sur toute la pÃ©riode (mois le plus froid en moyenne).</li>
            <li>TempÃ©. mini moyenne la plus haute : moyenne mensuelle des minimales la plus Ã©levÃ©e pour chaque mois sur toute la pÃ©riode (mois le plus chaud en moyenne des minimales).</li>
            <li>TempÃ©. mini moyenne la plus basse : moyenne mensuelle des minimales la plus basse pour chaque mois sur toute la pÃ©riode (mois le plus froid en moyenne des minimales).</li>
            <li>Moyenne des records de froid absolu : moyenne des tempÃ©ratures minimales absolues pour chaque mois sur toute la pÃ©riode, avec moyenne annuelle en 13Ã¨me colonne.</li>
            <li>Mois le plus ensoleillÃ© (estimÃ©) : mois ayant le total d'ensoleillement estimÃ© le plus Ã©levÃ© pour chaque mois sur la pÃ©riode 1940-2026, basÃ© sur les codes WMO horaires (estimation). La 13Ã¨me colonne affiche l'annÃ©e la plus ensoleillÃ©e globalement.</li>
            <li>Moyenne mensuelle d'ensoleillement estimÃ© : moyenne des totaux mensuels d'ensoleillement estimÃ© pour chaque mois sur la pÃ©riode, avec moyenne annuelle en 13Ã¨me colonne.</li>
            <li>Mois le moins ensoleillÃ© (estimÃ©) : mois ayant le total d'ensoleillement estimÃ© le plus faible pour chaque mois sur la pÃ©riode 1940-2026, basÃ© sur les codes WMO horaires (estimation). La 13Ã¨me colonne affiche l'annÃ©e la moins ensoleillÃ©e globalement.</li>
            <li>Moyenne mensuelle d'ensoleillement estimÃ© le plus faible : moyenne des totaux mensuels d'ensoleillement estimÃ© les plus faibles pour chaque mois sur la pÃ©riode, avec moyenne annuelle en 13Ã¨me colonne.</li>
            <li>ModÃ¨le utilisÃ© : ERA5-Land / best_match Open-Meteo.</li>
            <li>Les donnÃ©es horaires ont Ã©tÃ© utilisÃ©es pour complÃ©ter les valeurs journaliÃ¨res manquantes quand nÃ©cessaire</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}


