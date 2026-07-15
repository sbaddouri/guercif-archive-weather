import { getDailyData, getHourlyData } from "@/lib/data";
import WeatherChart from "@/components/weather-chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import ExportData from "@/components/export-data";
import { Metadata } from "next";
import { getTemperatureColor, getPrecipitationColor, getTextColor, getWeatherIcon } from "@/lib/weather-colors";

interface PageProps {
  params: Promise<{
    year: string;
    month: string;
    day: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year, month, day } = await params;
  const dateStr = `${year}-${month}-${day}`;
  const dateFormatted = format(parseISO(dateStr), "d MMMM yyyy", { locale: fr });
  
  return {
    title: `Météo Guercif - ${dateFormatted} | Archive Climatologique`,
    description: `Découvrez les archives météo détaillées de Guercif pour le ${dateFormatted}. Températures, précipitations, vent et humidité heure par heure.`,
  };
}

export default async function DayPage({ params }: PageProps) {
  const { year, month, day } = await params;
  const dateStr = `${year}-${month}-${day}`;
  
  const dailyData = await getDailyData(dateStr);
  const hourlyData = await getHourlyData(dateStr);

  if (!dailyData || !hourlyData) {
    notFound();
  }

  const maxColor = getTemperatureColor(dailyData.temp_max);
  const minColor = getTemperatureColor(dailyData.temp_min);
  const rainColor = getPrecipitationColor(dailyData.precipitation);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center gap-3">
            {(() => {
              const weather = getWeatherIcon(dailyData.weather_code);
              if (weather.imagePath) {
                return <img src={weather.imagePath} alt={weather.description} className="h-12 w-12" />;
              }
              return <span className="text-4xl">{weather.icon}</span>;
            })()}
            <h1 className="text-3xl font-bold">
              Météo à Guercif le {format(parseISO(dateStr), "d MMMM yyyy", { locale: fr })}
            </h1>
          </div>
          <p className="text-muted-foreground">
            Archives détaillées heure par heure.
          </p>
          <p className="text-sm text-muted-foreground">
            Lever du soleil: {format(parseISO(dailyData.sunrise), "HH:mm", { locale: fr })} • Coucher du soleil: {format(parseISO(dailyData.sunset), "HH:mm", { locale: fr })}
          </p>
        </div>
        <ExportData data={hourlyData} filename={`guercif_weather_${dateStr}`} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm" style={{ backgroundColor: minColor, color: getTextColor(minColor) }}>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider opacity-80">Température Min</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">{dailyData.temp_min}°C</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm" style={{ backgroundColor: maxColor, color: getTextColor(maxColor) }}>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider opacity-80">Température Max</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">{dailyData.temp_max}°C</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm" style={{ backgroundColor: rainColor, color: getTextColor(rainColor) }}>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider opacity-80">Précipitations</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">{dailyData.precipitation} mm</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-yellow-400 text-black">
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider opacity-80">Ensoleillement</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-2xl font-bold">{(dailyData.sunshine / 3600).toFixed(1)} h</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeatherChart 
          data={hourlyData} 
          title="Température (°C)" 
          dataKey="temp" 
          color="#f97316" 
          unit="°C" 
        />
        <WeatherChart 
          data={hourlyData} 
          title="Précipitations (mm)" 
          dataKey="precipitation" 
          color="#0ea5e9" 
          unit="mm" 
        />
      </div>

      {/* Hourly Table */}
      <Card className="overflow-hidden border-none shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle>Tableau Horaire (Format Wikipédia)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto border rounded-sm">
            <Table className="border-collapse text-[13px] text-center w-full min-w-[800px]">
              <TableHeader>
                <TableRow className="bg-[#f2f2f2] dark:bg-muted/50 border-b">
                  <TableHead className="border font-bold text-black dark:text-white px-1 py-1 h-auto">Météo</TableHead>
                  <TableHead className="border font-bold text-black dark:text-white px-2 py-1 h-auto text-left w-[80px]">Heure</TableHead>
                  <TableHead className="border font-bold text-black dark:text-white px-1 py-1 h-auto">Temp. (°C)</TableHead>
                  <TableHead className="border font-bold text-black dark:text-white px-1 py-1 h-auto">Pluie (mm)</TableHead>
                  <TableHead className="border font-bold text-black dark:text-white px-1 py-1 h-auto">Humidité</TableHead>
                  <TableHead className="border font-bold text-black dark:text-white px-1 py-1 h-auto">Vent</TableHead>
                  <TableHead className="border font-bold text-black dark:text-white px-1 py-1 h-auto">Rafales</TableHead>
                  <TableHead className="border font-bold text-black dark:text-white px-1 py-1 h-auto">Pression</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hourlyData.map((hour) => {
                  const tColor = getTemperatureColor(hour.temp);
                  const pColor = getPrecipitationColor(hour.precipitation);
                  const weather = getWeatherIcon(hour.weather_code, hour.time, dailyData.sunrise, dailyData.sunset);
                  return (
                    <TableRow key={hour.time}>
                      <TableCell className="border bg-white dark:bg-background text-center">
                        {weather.imagePath ? (
                          <img src={weather.imagePath} alt={weather.description} className="h-8 w-8 inline-block" />
                        ) : (
                          weather.icon
                        )}
                      </TableCell>
                      <TableCell className="border bg-[#f2f2f2] dark:bg-muted/30 font-bold text-left px-2 py-1">
                        {format(parseISO(hour.time), "HH:mm")}
                      </TableCell>
                      <TableCell className="border p-0" style={{ backgroundColor: tColor, color: getTextColor(tColor) }}>
                        {hour.temp.toFixed(1)}
                      </TableCell>
                      <TableCell className="border p-0" style={{ backgroundColor: pColor, color: getTextColor(pColor) }}>
                        {hour.precipitation.toFixed(1)}
                      </TableCell>
                      <TableCell className="border bg-white dark:bg-background">{hour.humidity}%</TableCell>
                      <TableCell className="border bg-white dark:bg-background">{hour.wind_speed} km/h</TableCell>
                      <TableCell className="border bg-white dark:bg-background">{hour.wind_gusts} km/h</TableCell>
                      <TableCell className="border bg-white dark:bg-background">{hour.pressure} hPa</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
