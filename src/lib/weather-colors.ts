/**
 * Wikipédia English Weather Box color mapping logic
 * Based on the provided JSON scale: -89.2°C to 56.7°C
 */

// Table de correspondance WMO → Durée estimée d'ensoleillement par heure (en minutes)
const WMO_TO_ESTIMATED_SUNSHINE: Record<number, number> = {
  0: 60,    // ☀️ - Ciel dégagé
  1: 45,    // 🌤️ - Principalement dégagé
  2: 30,    // ⛅ - Partiellement nuageux
  3: 0,     // ☁️ - Couvert
  45: 0,    // 🌫️ - Brouillard
  48: 0,    // 🌫️ - Brouillard givrant
  51: 15,   // 🌦️ - Bruine faible
  53: 10,   // 🌦️ - Bruine modérée
  55: 0,    // 🌧️ - Bruine forte
  56: 0,    // 🌧️❄️ - Bruine verglaçante faible
  57: 0,    // 🌧️❄️ - Bruine verglaçante forte
  61: 5,    // 🌧️ - Pluie faible
  63: 0,    // 🌧️ - Pluie modérée
  65: 0,    // 🌧️ - Pluie forte
  66: 0,    // 🌧️❄️ - Pluie verglaçante faible
  67: 0,    // 🌧️❄️ - Pluie verglaçante forte
  71: 5,    // 🌨️ - Neige faible
  73: 0,    // 🌨️ - Neige modérée
  75: 0,    // 🌨️ - Neige forte
  77: 0,    // 🌨️ - Grains de neige
  80: 20,   // 🌦️ - Averses de pluie faibles
  81: 5,    // 🌧️ - Averses de pluie modérées
  82: 5,    // 🌧️ - Averses de pluie violentes
  85: 5,    // 🌨️ - Averses de neige faibles
  86: 5,    // 🌨️ - Averses de neige fortes
  95: 10,   // ⛈️ - Orage faible ou modéré
  96: 10,   // ⛈️ - Orage avec grêle faible
  99: 10    // ⛈️ - Orage avec forte grêle
};

/**
 * Convertit un code WMO horaire en durée d'ensoleillement estimée en minutes
 * @param code - Code WMO horaire
 * @returns Durée estimée en minutes (0 si code inconnu)
 */
export function calculateHourlySunshine(code: number): number {
  return WMO_TO_ESTIMATED_SUNSHINE[code] ?? 0;
}

function isHourBetweenSunriseAndSunset(timeStr: string, sunriseStr: string | null | undefined, sunsetStr: string | null | undefined): boolean {
  const getTimeMinutes = (timeStr: string) => {
    if (!timeStr || !timeStr.includes('T')) return 0;
    const timePart = timeStr.split('T')[1];
    if (!timePart || !timePart.includes(':')) return 0;
    const [hour, minute] = timePart.split(':').map(Number);
    if (isNaN(hour) || isNaN(minute)) return 0;
    return hour * 60 + minute;
  };

  // Si sunrise ou sunset sont manquants, on suppose qu'il fait jour toute la journée (sécurité)
  if (!sunriseStr || !sunsetStr) return true;

  const timeMinutes = getTimeMinutes(timeStr);
  const sunriseMinutes = getTimeMinutes(sunriseStr);
  const sunsetMinutes = getTimeMinutes(sunsetStr);

  // For an hourly period like 07:00-08:00, we consider if the hour starts during daytime
  return timeMinutes >= sunriseMinutes && timeMinutes < sunsetMinutes;
}

/**
 * Agrège les valeurs horaires pour obtenir une durée journalière totale en minutes,
 * seulement pour les heures entre le lever et le coucher du soleil
 * @param hourlyData - Tableau des données horaires avec time et weather_code
 * @param sunrise - Heure du lever du soleil (format ISO)
 * @param sunset - Heure du coucher du soleil (format ISO)
 * @returns Durée journalière totale en minutes, ou null si données insuffisantes
 */
export function calculateDailySunshine(
  hourlyData: { time: string; weather_code: number }[],
  sunrise: string | null | undefined,
  sunset: string | null | undefined
): number | null {
  if (!hourlyData || hourlyData.length === 0) return null;
  
  return hourlyData.reduce((total, hour) => {
    if (isHourBetweenSunriseAndSunset(hour.time, sunrise, sunset)) {
      return total + calculateHourlySunshine(hour.weather_code);
    }
    return total;
  }, 0);
}

/**
 * Agrège les valeurs journalières pour obtenir une durée mensuelle totale en minutes
 * @param dailyMinutes - Tableau des durées journalières en minutes
 * @returns Durée mensuelle totale en minutes
 */
export function calculateMonthlySunshine(dailyMinutes: (number | null)[]): number | null {
  const validDays = dailyMinutes.filter((d): d is number => d !== null);
  if (validDays.length === 0) return null;
  return validDays.reduce((total, minutes) => total + minutes, 0);
}

/**
 * Agrège les valeurs mensuelles pour obtenir une durée annuelle totale en minutes
 * @param monthlyMinutes - Tableau des durées mensuelles en minutes
 * @returns Durée annuelle totale en minutes
 */
export function calculateYearlySunshine(monthlyMinutes: (number | null)[]): number | null {
  const validMonths = monthlyMinutes.filter((m): m is number => m !== null);
  if (validMonths.length === 0) return null;
  return validMonths.reduce((total, minutes) => total + minutes, 0);
}

/**
 * Formate une durée en minutes en chaîne de caractères "X h Y min"
 * @param totalMinutes - Durée totale en minutes
 * @returns Chaîne formatée, ou "Données indisponibles" si null
 */
export function formatSunshineDuration(totalMinutes: number | null): string {
  if (totalMinutes === null) return "Données indisponibles";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} h ${minutes.toString().padStart(2, '0')} min`;
}

/**
 * Calcule l'indice de cohérence entre la durée officielle et l'estimation
 * @param officialMinutes - Durée officielle en minutes
 * @param estimatedMinutes - Durée estimée en minutes
 * @returns Indice de cohérence (Excellent/Bon/Moyen/Faible), ou null si données manquantes
 */
export function calculateSunshineConsistency(officialMinutes: number | null, estimatedMinutes: number | null): 'Excellent' | 'Bon' | 'Moyen' | 'Faible' | null {
  if (officialMinutes === null || estimatedMinutes === null) return null;
  const difference = Math.abs(officialMinutes - estimatedMinutes);
  if (difference <= 5) return 'Excellent';
  if (difference <= 15) return 'Bon';
  if (difference <= 30) return 'Moyen';
  return 'Faible';
}

/**
 * Convertit la durée officielle Open-Meteo (en secondes) en minutes
 * @param sunshineSeconds - Durée officielle en secondes
 * @returns Durée en minutes, ou null si valeur invalide
 */
export function convertOfficialSunshineToMinutes(sunshineSeconds: number | null | undefined): number | null {
  if (sunshineSeconds === null || sunshineSeconds === undefined) return null;
  return Math.round(sunshineSeconds / 60);
}

const tempScale: Record<number, { b: string; t: string }> = {
  "-89": { b: "#000005", t: "#FFFFFF" },
  "-88": { b: "#00000A", t: "#FFFFFF" },
  "-87": { b: "#000010", t: "#FFFFFF" },
  "-86": { b: "#000015", t: "#FFFFFF" },
  "-85": { b: "#00001B", t: "#FFFFFF" },
  "-84": { b: "#000020", t: "#FFFFFF" },
  "-83": { b: "#000025", t: "#FFFFFF" },
  "-82": { b: "#00002B", t: "#FFFFFF" },
  "-81": { b: "#000030", t: "#FFFFFF" },
  "-80": { b: "#000036", t: "#FFFFFF" },
  "-79": { b: "#00003B", t: "#FFFFFF" },
  "-78": { b: "#000040", t: "#FFFFFF" },
  "-77": { b: "#000046", t: "#FFFFFF" },
  "-76": { b: "#00004B", t: "#FFFFFF" },
  "-75": { b: "#000051", t: "#FFFFFF" },
  "-74": { b: "#000056", t: "#FFFFFF" },
  "-73": { b: "#00005B", t: "#FFFFFF" },
  "-72": { b: "#000061", t: "#FFFFFF" },
  "-71": { b: "#000066", t: "#FFFFFF" },
  "-70": { b: "#00006C", t: "#FFFFFF" },
  "-69": { b: "#000071", t: "#FFFFFF" },
  "-68": { b: "#000076", t: "#FFFFFF" },
  "-67": { b: "#00007C", t: "#FFFFFF" },
  "-66": { b: "#000081", t: "#FFFFFF" },
  "-65": { b: "#000087", t: "#FFFFFF" },
  "-64": { b: "#00008C", t: "#FFFFFF" },
  "-63": { b: "#000091", t: "#FFFFFF" },
  "-62": { b: "#000097", t: "#FFFFFF" },
  "-61": { b: "#00009C", t: "#FFFFFF" },
  "-60": { b: "#0000A2", t: "#FFFFFF" },
  "-59": { b: "#0000A7", t: "#FFFFFF" },
  "-58": { b: "#0000AC", t: "#FFFFFF" },
  "-57": { b: "#0000B2", t: "#FFFFFF" },
  "-56": { b: "#0000B7", t: "#FFFFFF" },
  "-55": { b: "#0000BD", t: "#FFFFFF" },
  "-54": { b: "#0000C2", t: "#FFFFFF" },
  "-53": { b: "#0000C7", t: "#FFFFFF" },
  "-52": { b: "#0000CD", t: "#FFFFFF" },
  "-51": { b: "#0000D2", t: "#FFFFFF" },
  "-50": { b: "#0000D8", t: "#FFFFFF" },
  "-49": { b: "#0000DD", t: "#FFFFFF" },
  "-48": { b: "#0000E2", t: "#FFFFFF" },
  "-47": { b: "#0000E8", t: "#FFFFFF" },
  "-46": { b: "#0000ED", t: "#FFFFFF" },
  "-45": { b: "#0000F3", t: "#FFFFFF" },
  "-44": { b: "#0000F8", t: "#FFFFFF" },
  "-43": { b: "#0000FD", t: "#FFFFFF" },
  "-42": { b: "#0404FF", t: "#FFFFFF" },
  "-41": { b: "#0909FF", t: "#FFFFFF" },
  "-40": { b: "#0E0EFF", t: "#FFFFFF" },
  "-39": { b: "#1414FF", t: "#FFFFFF" },
  "-38": { b: "#1919FF", t: "#FFFFFF" },
  "-37": { b: "#1F1FFF", t: "#FFFFFF" },
  "-36": { b: "#2424FF", t: "#FFFFFF" },
  "-35": { b: "#2929FF", t: "#FFFFFF" },
  "-34": { b: "#2F2FFF", t: "#FFFFFF" },
  "-33": { b: "#3434FF", t: "#FFFFFF" },
  "-32": { b: "#3A3AFF", t: "#FFFFFF" },
  "-31": { b: "#3F3FFF", t: "#FFFFFF" },
  "-30": { b: "#4444FF", t: "#FFFFFF" },
  "-29": { b: "#4A4AFF", t: "#FFFFFF" },
  "-28": { b: "#4F4FFF", t: "#FFFFFF" },
  "-27": { b: "#5555FF", t: "#FFFFFF" },
  "-26": { b: "#5A5AFF", t: "#FFFFFF" },
  "-25": { b: "#5F5FFF", t: "#FFFFFF" },
  "-24": { b: "#6565FF", t: "#FFFFFF" },
  "-23": { b: "#6A6AFF", t: "#000000" },
  "-22": { b: "#6F6FFF", t: "#000000" },
  "-21": { b: "#7575FF", t: "#000000" },
  "-20": { b: "#7A7AFF", t: "#000000" },
  "-19": { b: "#8080FF", t: "#000000" },
  "-18": { b: "#8585FF", t: "#000000" },
  "-17": { b: "#8A8AFF", t: "#000000" },
  "-16": { b: "#9090FF", t: "#000000" },
  "-15": { b: "#9595FF", t: "#000000" },
  "-14": { b: "#9B9BFF", t: "#000000" },
  "-13": { b: "#A0A0FF", t: "#000000" },
  "-12": { b: "#A5A5FF", t: "#000000" },
  "-11": { b: "#ABABFF", t: "#000000" },
  "-10": { b: "#B0B0FF", t: "#000000" },
  "-9": { b: "#B6B6FF", t: "#000000" },
  "-8": { b: "#BBBBFF", t: "#000000" },
  "-7": { b: "#C0C0FF", t: "#000000" },
  "-6": { b: "#C6C6FF", t: "#000000" },
  "-5": { b: "#CBCBFF", t: "#000000" },
  "-4": { b: "#D1D1FF", t: "#000000" },
  "-3": { b: "#D6D6FF", t: "#000000" },
  "-2": { b: "#DBDBFF", t: "#000000" },
  "-1": { b: "#E1E1FF", t: "#000000" },
  "0": { b: "#E6E6FF", t: "#000000" },
  "1": { b: "#ECECFF", t: "#000000" },
  "2": { b: "#F1F1FF", t: "#000000" },
  "3": { b: "#F6F6FF", t: "#000000" },
  "4": { b: "#FCFCFF", t: "#000000" },
  "5": { b: "#FFFBF8", t: "#000000" },
  "6": { b: "#FFF4EA", t: "#000000" },
  "7": { b: "#FFEDDC", t: "#000000" },
  "8": { b: "#FFE6CE", t: "#000000" },
  "9": { b: "#FFDFC0", t: "#000000" },
  "10": { b: "#FFD9B3", t: "#000000" },
  "11": { b: "#FFD2A5", t: "#000000" },
  "12": { b: "#FFCB97", t: "#000000" },
  "13": { b: "#FFC489", t: "#000000" },
  "14": { b: "#FFBD7C", t: "#000000" },
  "15": { b: "#FFB66E", t: "#000000" },
  "16": { b: "#FFAF60", t: "#000000" },
  "17": { b: "#FFA852", t: "#000000" },
  "18": { b: "#FFA144", t: "#000000" },
  "19": { b: "#FF9B37", t: "#000000" },
  "20": { b: "#FF9429", t: "#000000" },
  "21": { b: "#FF8D1B", t: "#000000" },
  "22": { b: "#FF860D", t: "#000000" },
  "23": { b: "#FF7F00", t: "#000000" },
  "24": { b: "#FF7800", t: "#000000" },
  "25": { b: "#FF7100", t: "#000000" },
  "26": { b: "#FF6A00", t: "#000000" },
  "27": { b: "#FF6300", t: "#000000" },
  "28": { b: "#FF5D00", t: "#000000" },
  "29": { b: "#FF5600", t: "#000000" },
  "30": { b: "#FF4F00", t: "#000000" },
  "31": { b: "#FF4800", t: "#FFFFFF" },
  "32": { b: "#FF4100", t: "#FFFFFF" },
  "33": { b: "#FF3A00", t: "#FFFFFF" },
  "34": { b: "#FF3300", t: "#FFFFFF" },
  "35": { b: "#FF2C00", t: "#FFFFFF" },
  "36": { b: "#FF2500", t: "#FFFFFF" },
  "37": { b: "#FF1F00", t: "#FFFFFF" },
  "38": { b: "#FF1800", t: "#FFFFFF" },
  "39": { b: "#FF1100", t: "#FFFFFF" },
  "40": { b: "#FF0A00", t: "#FFFFFF" },
  "41": { b: "#FF0300", t: "#FFFFFF" },
  "42": { b: "#F80000", t: "#FFFFFF" },
  "43": { b: "#EA0000", t: "#FFFFFF" },
  "44": { b: "#DC0000", t: "#FFFFFF" },
  "45": { b: "#CE0000", t: "#FFFFFF" },
  "46": { b: "#C00000", t: "#FFFFFF" },
  "47": { b: "#B30000", t: "#FFFFFF" },
  "48": { b: "#A50000", t: "#FFFFFF" },
  "49": { b: "#970000", t: "#FFFFFF" },
  "50": { b: "#890000", t: "#FFFFFF" },
  "51": { b: "#7C0000", t: "#FFFFFF" },
  "52": { b: "#6E0000", t: "#FFFFFF" },
  "53": { b: "#600000", t: "#FFFFFF" },
  "54": { b: "#520000", t: "#FFFFFF" },
  "55": { b: "#440000", t: "#FFFFFF" },
  "56": { b: "#370000", t: "#FFFFFF" },
};

export function getTemperatureColor(temp: number): string {
  if (temp === null || temp === undefined) return "transparent";
  const roundedTemp = Math.round(temp);
  
  // Clamp values to the scale range
  const key = Math.max(-89, Math.min(56, roundedTemp));
  return tempScale[key]?.b || "#ffffff";
}

export function getTextColor(bgColor: string): string {
  // Find the temp key associated with this background color
  const entry = Object.values(tempScale).find(e => e.b === bgColor);
  return entry?.t || "#000000";
}

export function getPrecipitationColor(precip: number): string {
  if (precip === null || precip === undefined || precip === 0) return "transparent";
  
  // Wikipedia's scale for monthly precipitation (mm)
  if (precip >= 300) return "#000033";
  if (precip >= 200) return "#000066";
  if (precip >= 150) return "#000099";
  if (precip >= 100) return "#0000cc";
  if (precip >= 75)  return "#0000ff";
  if (precip >= 50)  return "#3333ff";
  if (precip >= 30)  return "#6666ff";
  if (precip >= 15)  return "#9999ff";
  if (precip >= 5)   return "#ccccff";
  return "#e6e6ff";
}

export function getSunshineColor(hours: number): string {
  if (hours === null || hours === undefined) return "transparent";
  
  // Sunshine scale
  if (hours >= 300) return "#ffff00";
  if (hours >= 250) return "#ffff33";
  if (hours >= 200) return "#ffff66";
  if (hours >= 150) return "#ffff99";
  if (hours >= 100) return "#ffffcc";
  return "#ffffee";
}

function getTimeHM(timeStr: string): number {
  // timeStr is like "2026-07-07T00:00" or "2026-07-07T06:08"
  const timePart = timeStr.split('T')[1];
  const [hour, minute] = timePart.split(':').map(Number);
  return hour * 60 + minute;
}

export function getWeatherIcon(
  code: number, 
  time?: string, 
  sunrise?: string, 
  sunset?: string
): { icon: string; imagePath: string | null; description: string } {
  if (code === null || code === undefined) return { icon: "❓", imagePath: null, description: "Inconnu" };

  let isNight = false;
  if (time && sunrise && sunset) {
    const hourMinutes = getTimeHM(time);
    const sunriseMinutes = getTimeHM(sunrise);
    const sunsetMinutes = getTimeHM(sunset);
    isNight = hourMinutes < sunriseMinutes || hourMinutes > sunsetMinutes;
  }

  // Open-Meteo WMO weather code icons, images, and descriptions (from user's mapping)
  switch (code) {
    case 0: return { 
      icon: isNight ? "🌙" : "☀️", 
      imagePath: isNight ? "/weather-icons/night/ciel dégagé pleine-lune.png" : null, 
      description: "Ciel dégagé - Aucun nuage significatif" 
    };
    case 1: return { 
      icon: isNight ? "🌥️" : "🌤️", 
      imagePath: isNight ? "/weather-icons/night/ciel trés voilé - pleine lune.png" : null, 
      description: "Principalement dégagé - Peu nuageux, majorité de ciel clair" 
    };
    case 2: return { 
      icon: isNight ? "🌦️" : "⛅", 
      imagePath: isNight ? "/weather-icons/night/Nuages et soleil nuit.png" : null, 
      description: "Partiellement nuageux - Alternance nuages / éclaircies" 
    };
    case 3: return { 
      icon: "☁️", 
      imagePath: isNight ? "/weather-icons/night/Très nuageux nuit.png" : null, 
      description: "Couvert - Ciel très nuageux à totalement couvert" 
    };
    case 45: 
    case 48: return { 
      icon: "🌫️", 
      imagePath: isNight ? "/weather-icons/night/brouillard lune.png" : null, 
      description: code === 45 ? "Brouillard - Brouillard “classique”" : "Brouillard givrant - Brouillard avec dépôt de givre" 
    };
    case 51: return { icon: "🌦️", imagePath: null, description: "Bruine faible - Petite pluie fine, faible intensité" };
    case 53: return { icon: "🌦️", imagePath: null, description: "Bruine modérée - Bruine plus marquée" };
    case 55: return { icon: "🌧️", imagePath: null, description: "Bruine forte / dense - Bruine intense et persistante" };
    case 56: return { icon: "🌧️❄️", imagePath: null, description: "Bruine verglaçante faible - Bruine surfondue pouvant geler au contact" };
    case 57: return { icon: "🌧️❄️", imagePath: null, description: "Bruine verglaçante forte - Version plus intense de la bruine verglaçante" };
    case 61: return { icon: "🌧️", imagePath: null, description: "Pluie faible - Pluie continue légère" };
    case 63: return { icon: "🌧️", imagePath: null, description: "Pluie modérée - Pluie “normale” / soutenue" };
    case 65: return { icon: "🌧️", imagePath: null, description: "Pluie forte - Forte pluie continue" };
    case 66: return { icon: "🌧️❄️", imagePath: null, description: "Pluie verglaçante faible - Pluie qui gèle au contact, faible intensité" };
    case 67: return { icon: "🌧️❄️", imagePath: null, description: "Pluie verglaçante forte - Pluie verglaçante plus forte" };
    case 71: return { icon: "🌨️", imagePath: null, description: "Neige faible - Chute de neige légère" };
    case 73: return { icon: "🌨️", imagePath: null, description: "Neige modérée - Chute de neige modérée" };
    case 75: return { icon: "🌨️", imagePath: null, description: "Neige forte - Forte chute de neige" };
    case 77: return { icon: "🌨️", imagePath: null, description: "Grains de neige - Très petites particules de neige, distinctes des gros flocons" };
    case 80: 
    case 81: 
    case 82: return { 
      icon: code === 80 ? "🌦️" : "🌧️", 
      imagePath: isNight ? "/weather-icons/night/Averses ou pluie intermittente nuit.png" : null, 
      description: code === 80 ? "Averses de pluie faibles - Pluie en averses, faible" : code === 81 ? "Averses de pluie modérées - Averses plus marquées" : "Averses de pluie violentes - Averses très fortes" 
    };
    case 85: 
    case 86: return { 
      icon: "🌨️", 
      imagePath: isNight ? "/weather-icons/night/Averses de neige nuit.png" : null, 
      description: code === 85 ? "Averses de neige faibles - Neige sous forme d’averses, faible" : "Averses de neige fortes - Averses de neige marquées" 
    };
    case 95: 
    case 96: 
    case 99: return { 
      icon: "⛈️", 
      imagePath: isNight ? "/weather-icons/night/Très nuageux, tendance orageuse lune.png" : null, 
      description: code === 95 ? "Orage faible ou modéré - Présence orageuse" : code === 96 ? "Orage avec grêle faible - Orage avec grêle légère" : "Orage avec forte grêle - Orage avec grêle importante" 
    };
    default: return { icon: "❓", imagePath: null, description: "Inconnu" };
  }
}
