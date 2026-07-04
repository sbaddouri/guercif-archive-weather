import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import temperatureSpectrum from "../../../plage et spectre de température.json";
import precipitationSpectrum from "../../../plage de précipitation.json";

type TemperatureEntry = {
  "Température (°C)": number;
  "Température (°F)": number;
  "Hex fond": string;
  "Hex texte": string;
  "Aperçu": string;
  "Style CSS": string;
};

type PrecipitationEntry = {
  precipitation_mm: number;
  precipitation_inches: number;
  background_hex: string;
  text_hex: string;
  preview: string;
  css_style: string;
};

const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc', 'Année'];

const climateData = {
  recordHigh: [27.6, 32.9, 35.6, 39.9, 41.5, 44.6, 46.6, 46.3, 43.8, 38.4, 32.3, 29.8, 46.6],
  meanMax: [21.4, 23.7, 28.8, 31.6, 34.9, 38.7, 42.3, 41.5, 36.6, 32.4, 26.3, 21.6, 42.21],
  meanDailyMax: [15.3, 17.4, 20.3, 22.9, 26.8, 31.8, 36.2, 36.0, 30.8, 25.7, 19.6, 15.9, 24.9],
  dailyMean: [10.0, 11.8, 14.4, 16.9, 20.5, 25.0, 28.8, 28.9, 24.7, 20.1, 14.5, 10.9, 18.9],
  meanDailyMin: [4.6, 6.2, 8.5, 10.8, 14.1, 18.1, 21.4, 21.8, 18.6, 14.4, 9.4, 5.9, 12.8],
  meanMin: [-0.5, 1.8, 3.2, 6.4, 9.4, 14.3, 18.0, 17.9, 13.5, 9.4, 3.5, 0.9, -1.07],
  recordLow: [-8.5, -4.2, -2.0, -0.5, 2.0, 6.0, 10.5, 8.8, 5.3, 0.0, -2.0, -3.5, -8.5],
  avgPrecipitation: [20, 24, 30, 27, 23, 8, 3, 6, 16, 27, 30, 19, 233],
  avgSnowfall: [0.11, 0.07, 0.01, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.08, 0.15, 0.42],
  avgPrecipitationDays: [3, 4, 4, 4, 3, 2, 1, 1, 2, 3, 4, 3, 34],
  avgSnowyDays: [0.005, 0.002, 0.001, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.000, 0.002, 0.01],
  avgRelativeHumidity: [65, 61, 55, 51, 46, 40, 36, 39, 50, 56, 64, 69, 58.7],
  avgDewPoint: [3.8, 4.5, 5.7, 6.8, 8.7, 10.9, 11.9, 13.1, 12.9, 10.5, 7.0, 4.8, 8.4],
  meanMonthlySunshine: [210.8, 198.8, 244.9, 258.0, 300.7, 318.0, 347.2, 322.4, 270.0, 248.0, 207.0, 204.6, 3130.4],
  percentagePossibleSunshine: [68.0, 64.5, 65.8, 66.2, 69.3, 72.1, 77.8, 77.6, 72.6, 70.8, 66.3, 66.0, 70.0],
  avgUvIndex: [3, 5, 8, 9, 11, 12, 11, 10, 9, 7, 5, 4, 8]
};

const getTempStyle = (temp: number) => {
  // Find the closest temperature entry
  let closestEntry: TemperatureEntry | undefined;
  let minDiff = Infinity;

  for (const entry of temperatureSpectrum as TemperatureEntry[]) {
    const diff = Math.abs(entry["Température (°C)"] - temp);
    if (diff < minDiff) {
      minDiff = diff;
      closestEntry = entry;
    }
  }

  if (closestEntry) {
    return {
      backgroundColor: closestEntry["Hex fond"],
      color: closestEntry["Hex texte"],
    };
  }
  return {};
};

const getPrecipitationStyle = (mm: number) => {
  // Find the closest precipitation entry
  let closestEntry: PrecipitationEntry | undefined;
  let minDiff = Infinity;

  for (const entry of precipitationSpectrum as PrecipitationEntry[]) {
    const diff = Math.abs(entry.precipitation_mm - mm);
    if (diff < minDiff) {
      minDiff = diff;
      closestEntry = entry;
    }
  }

  if (closestEntry) {
    return {
      backgroundColor: closestEntry.background_hex,
      color: closestEntry.text_hex,
    };
  }
  return {};
};

const getColorClass = (type: string, value: number) => {
  switch (type) {
    case 'temp':
      return ''; // Handled by inline style now
    case 'precipitation':
      if (value === 0) return 'bg-gray-200';
      if (value < 10) return 'bg-cyan-200';
      if (value < 20) return 'bg-cyan-400';
      if (value < 30) return 'bg-green-300';
      return 'bg-green-500 text-white';
    case 'humidity':
      if (value < 40) return 'bg-blue-400 text-white';
      if (value < 50) return 'bg-blue-500 text-white';
      if (value < 60) return 'bg-blue-600 text-white';
      return 'bg-blue-700 text-white';
    case 'sunshine':
      return 'bg-yellow-300';
    case 'uv':
      if (value < 3) return 'bg-yellow-300';
      if (value < 6) return 'bg-yellow-500';
      if (value < 8) return 'bg-orange-500';
      if (value < 10) return 'bg-red-500 text-white';
      return 'bg-purple-600 text-white';
    default:
      return '';
  }
};

export default function ClimatologiePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Climatologie de Guercif</h1>
        <p className="text-muted-foreground">Données climatiques moyennes et records pour la ville de Guercif (1940–present).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Profil Climatique</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              Guercif possède un climat méditerranéen avec des influences continentales. 
              Les étés sont chauds et secs, tandis que les hivers sont doux avec des précipitations modérées.
            </p>
            <p>
              La ville est située dans la plaine du Tamlelt, entourée par les montagnes du Rif au nord et du Moyen Atlas au sud. 
              Cette position géographique influence grandement les températures extrêmes et les vents.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Records Historiques</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicateur</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Température Max</TableCell>
                  <TableCell className="text-red-500 font-bold">46.6°C</TableCell>
                  <TableCell>10 juillet 2023</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Température Min</TableCell>
                  <TableCell className="text-blue-500 font-bold">-8.5°C</TableCell>
                  <TableCell>8 janvier 1965</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Précipitations (24h)</TableCell>
                  <TableCell className="text-cyan-500 font-bold">85 mm</TableCell>
                  <TableCell>Novembre 2014</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle>Données Climatiques Détaillées (1940–2025)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-gray-100 dark:bg-gray-800 sticky left-0 z-10">Mois</TableHead>
                  {months.map((m, i) => (
                    <TableHead key={i} className="bg-gray-100 dark:bg-gray-800 text-center min-w-[80px]">
                      {m}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Record High */}
                <TableRow>
                  <TableCell className="bg-gray-50 dark:bg-gray-900 sticky left-0 z-10 font-semibold">Record haut °C (°F)</TableCell>
                  {climateData.recordHigh.map((v, i) => (
                    <TableCell key={i} className="text-center" style={getTempStyle(v)}>
                      {v}° ({Math.round(v * 9/5 + 32)}°F)
                    </TableCell>
                  ))}
                </TableRow>
                {/* Mean Maximum */}
                <TableRow>
                  <TableCell className="bg-gray-50 dark:bg-gray-900 sticky left-0 z-10 font-semibold">Moyenne max °C (°F)</TableCell>
                  {climateData.meanMax.map((v, i) => (
                    <TableCell key={i} className="text-center" style={getTempStyle(v)}>
                      {v}° ({Math.round(v * 9/5 + 32)}°F)
                    </TableCell>
                  ))}
                </TableRow>
                {/* Mean Daily Maximum */}
                <TableRow>
                  <TableCell className="bg-gray-50 dark:bg-gray-900 sticky left-0 z-10 font-semibold">Moyenne quotidienne max °C (°F)</TableCell>
                  {climateData.meanDailyMax.map((v, i) => (
                    <TableCell key={i} className="text-center" style={getTempStyle(v)}>
                      {v}° ({Math.round(v * 9/5 + 32)}°F)
                    </TableCell>
                  ))}
                </TableRow>
                {/* Daily Mean */}
                <TableRow>
                  <TableCell className="bg-gray-50 dark:bg-gray-900 sticky left-0 z-10 font-semibold">Moyenne quotidienne °C (°F)</TableCell>
                  {climateData.dailyMean.map((v, i) => (
                    <TableCell key={i} className="text-center" style={getTempStyle(v)}>
                      {v}° ({Math.round(v * 9/5 + 32)}°F)
                    </TableCell>
                  ))}
                </TableRow>
                {/* Mean Daily Minimum */}
                <TableRow>
                  <TableCell className="bg-gray-50 dark:bg-gray-900 sticky left-0 z-10 font-semibold">Moyenne quotidienne min °C (°F)</TableCell>
                  {climateData.meanDailyMin.map((v, i) => (
                    <TableCell key={i} className="text-center" style={getTempStyle(v)}>
                      {v}° ({Math.round(v * 9/5 + 32)}°F)
                    </TableCell>
                  ))}
                </TableRow>
                {/* Mean Minimum */}
                <TableRow>
                  <TableCell className="bg-gray-50 dark:bg-gray-900 sticky left-0 z-10 font-semibold">Moyenne min °C (°F)</TableCell>
                  {climateData.meanMin.map((v, i) => (
                    <TableCell key={i} className="text-center" style={getTempStyle(v)}>
                      {v}° ({Math.round(v * 9/5 + 32)}°F)
                    </TableCell>
                  ))}
                </TableRow>
                {/* Record Low */}
                <TableRow>
                  <TableCell className="bg-gray-50 dark:bg-gray-900 sticky left-0 z-10 font-semibold">Record bas °C (°F)</TableCell>
                  {climateData.recordLow.map((v, i) => (
                    <TableCell key={i} className="text-center" style={getTempStyle(v)}>
                      {v}° ({Math.round(v * 9/5 + 32)}°F)
                    </TableCell>
                  ))}
                </TableRow>
                {/* Average Precipitation */}
                <TableRow>
                  <TableCell className="bg-gray-50 dark:bg-gray-900 sticky left-0 z-10 font-semibold">Précipitations moy. mm (pouces)</TableCell>
                  {climateData.avgPrecipitation.map((v, i) => (
                    <TableCell key={i} className="text-center" style={getPrecipitationStyle(v)}>
                      {v} ({(v / 25.4).toFixed(1)}")
                    </TableCell>
                  ))}
                </TableRow>
                {/* Average Snowfall */}
                <TableRow>
                  <TableCell className="bg-gray-50 dark:bg-gray-900 sticky left-0 z-10 font-semibold">Chute de neige moy. cm (pouces)</TableCell>
                  {climateData.avgSnowfall.map((v, i) => (
                    <TableCell key={i} className="text-center">
                      {v} ({(v / 2.54).toFixed(3)}")
                    </TableCell>
                  ))}
                </TableRow>
                {/* Average Precipitation Days */}
                <TableRow>
                  <TableCell className="bg-gray-50 dark:bg-gray-900 sticky left-0 z-10 font-semibold">Jours de précip. (≥ 1 mm)</TableCell>
                  {climateData.avgPrecipitationDays.map((v, i) => (
                    <TableCell key={i} className="text-center bg-indigo-100">
                      {v}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Average Snowy Days */}
                <TableRow>
                  <TableCell className="bg-gray-50 dark:bg-gray-900 sticky left-0 z-10 font-semibold">Jours de neige</TableCell>
                  {climateData.avgSnowyDays.map((v, i) => (
                    <TableCell key={i} className="text-center bg-blue-100">
                      {v}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Average Relative Humidity */}
                <TableRow>
                  <TableCell className="bg-gray-50 dark:bg-gray-900 sticky left-0 z-10 font-semibold">Humidité relative moy. (%)</TableCell>
                  {climateData.avgRelativeHumidity.map((v, i) => (
                    <TableCell key={i} className={`text-center ${getColorClass('humidity', v)}`}>
                      {v}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Average Dew Point */}
                <TableRow>
                  <TableCell className="bg-gray-50 dark:bg-gray-900 sticky left-0 z-10 font-semibold">Point de rosée moy. °C (°F)</TableCell>
                  {climateData.avgDewPoint.map((v, i) => (
                    <TableCell key={i} className="text-center" style={getTempStyle(v)}>
                      {v}° ({Math.round(v * 9/5 + 32)}°F)
                    </TableCell>
                  ))}
                </TableRow>
                {/* Mean Monthly Sunshine */}
                <TableRow>
                  <TableCell className="bg-gray-50 dark:bg-gray-900 sticky left-0 z-10 font-semibold">Ensoleillement moy. mensuel (h)</TableCell>
                  {climateData.meanMonthlySunshine.map((v, i) => (
                    <TableCell key={i} className={`text-center ${getColorClass('sunshine', v)}`}>
                      {v}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Percentage Possible Sunshine */}
                <TableRow>
                  <TableCell className="bg-gray-50 dark:bg-gray-900 sticky left-0 z-10 font-semibold">% d'ensoleillement possible</TableCell>
                  {climateData.percentagePossibleSunshine.map((v, i) => (
                    <TableCell key={i} className={`text-center ${getColorClass('sunshine', v)}`}>
                      {v}%
                    </TableCell>
                  ))}
                </TableRow>
                {/* Average UV Index */}
                <TableRow>
                  <TableCell className="bg-gray-50 dark:bg-gray-900 sticky left-0 z-10 font-semibold">Indice UV moyen</TableCell>
                  {climateData.avgUvIndex.map((v, i) => (
                    <TableCell key={i} className={`text-center ${getColorClass('uv', v)} font-bold`}>
                      {v}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="text-sm text-muted-foreground">
        <CardHeader>
          <CardTitle>Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Données climatiques basées sur les records historiques de 1940 à 2025, compilées à partir de diverses sources météorologiques internationales.</li>
            <li>Open-Meteo</li>
            <li>Visual Crossing</li>
            <li>Climate-Data.org</li>
          </ol>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link href="/archives">
          <Button size="lg">Explorer les données par année</Button>
        </Link>
      </div>
    </div>
  );
}
