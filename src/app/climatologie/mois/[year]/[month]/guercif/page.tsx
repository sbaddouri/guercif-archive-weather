import { getDailyDataForMonth } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getTemperatureColor, getPrecipitationColor, getTextColor, getSunshineColor } from "@/lib/weather-colors";

interface PageProps {
  params: Promise<{
    year: string;
    month: string;
  }>;
}

export default async function MonthPage({ params }: PageProps) {
  const { year, month } = await params;
  const data = await getDailyDataForMonth(year, month);

  if (data.length === 0) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Aucune donnée pour {month}/{year}</h1>
        <Link href="/" className="text-primary hover:underline">Retour à l'accueil</Link>
      </div>
    );
  }

  const absMax = Math.max(...data.map(d => d.temp_max));
  const absMin = Math.min(...data.map(d => d.temp_min));
  const avgMax = data.reduce((acc, d) => acc + d.temp_max, 0) / data.length;
  const avgMin = data.reduce((acc, d) => acc + d.temp_min, 0) / data.length;
  const totalRain = data.reduce((acc, d) => acc + d.precipitation, 0);

  const avgMaxColor = getTemperatureColor(avgMax);
  const avgMinColor = getTemperatureColor(avgMin);
  const absMaxColor = getTemperatureColor(absMax);
  const absMinColor = getTemperatureColor(absMin);

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold capitalize">
          Climatologie de Guercif - {format(parseISO(data[0].date), "MMMM yyyy", { locale: fr })}
        </h1>
        <p className="text-muted-foreground">Tableau quotidien détaillé au format Wikipédia.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="col-span-1 border-none shadow-sm" style={{ backgroundColor: avgMinColor, color: getTextColor(avgMinColor) }}>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider opacity-80">Moyenne Min</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">{avgMin.toFixed(1)}°C</div>
          </CardContent>
        </Card>
        <Card className="col-span-1 border-none shadow-sm" style={{ backgroundColor: avgMaxColor, color: getTextColor(avgMaxColor) }}>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider opacity-80">Moyenne Max</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">{avgMax.toFixed(1)}°C</div>
          </CardContent>
        </Card>
        <Card className="col-span-1 border-none shadow-sm" style={{ backgroundColor: absMinColor, color: getTextColor(absMinColor) }}>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider opacity-80">Record Froid</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">{absMin.toFixed(1)}°C</div>
          </CardContent>
        </Card>
        <Card className="col-span-1 border-none shadow-sm" style={{ backgroundColor: absMaxColor, color: getTextColor(absMaxColor) }}>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider opacity-80">Record Chaleur</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">{absMax.toFixed(1)}°C</div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1 border-none shadow-sm bg-blue-600 text-white">
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider opacity-80">Pluie Cumulée</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">{totalRain.toFixed(1)} mm</div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          <div className="overflow-x-auto border rounded-sm">
            <Table className="border-collapse text-[13px] text-center w-full min-w-[800px]">
              <TableHeader>
                <TableRow className="bg-[#f2f2f2] dark:bg-muted/50 border-b">
                  <TableHead className="border font-bold text-black dark:text-white px-2 py-1 h-auto text-left w-[120px]">Date</TableHead>
                  <TableHead className="border font-bold text-black dark:text-white px-1 py-1 h-auto">Temp. Min</TableHead>
                  <TableHead className="border font-bold text-black dark:text-white px-1 py-1 h-auto">Temp. Max</TableHead>
                  <TableHead className="border font-bold text-black dark:text-white px-1 py-1 h-auto">Moyenne</TableHead>
                  <TableHead className="border font-bold text-black dark:text-white px-1 py-1 h-auto">Pluie (mm)</TableHead>
                  <TableHead className="border font-bold text-black dark:text-white px-1 py-1 h-auto">Soleil (h)</TableHead>
                  <TableHead className="border font-bold text-black dark:text-white px-1 py-1 h-auto">Vent Max</TableHead>
                  <TableHead className="border font-bold text-black dark:text-white px-1 py-1 h-auto">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((day) => {
                  const maxColor = getTemperatureColor(day.temp_max);
                  const minColor = getTemperatureColor(day.temp_min);
                  const meanColor = getTemperatureColor(day.temp_mean);
                  const rainColor = getPrecipitationColor(day.precipitation);
                  const sunHours = day.sunshine / 3600;
                  const sunColor = getSunshineColor(sunHours * 30); // Multiplied by 30 to match monthly scale logic in colors.ts

                  return (
                    <TableRow key={day.date}>
                      <TableCell className="border bg-[#f2f2f2] dark:bg-muted/30 font-bold text-left px-2 py-1">
                        {format(parseISO(day.date), "d EEE", { locale: fr })}
                      </TableCell>
                      <TableCell className="border p-0" style={{ backgroundColor: minColor, color: getTextColor(minColor) }}>
                        {day.temp_min.toFixed(1)}
                      </TableCell>
                      <TableCell className="border p-0" style={{ backgroundColor: maxColor, color: getTextColor(maxColor) }}>
                        {day.temp_max.toFixed(1)}
                      </TableCell>
                      <TableCell className="border p-0" style={{ backgroundColor: meanColor, color: getTextColor(meanColor) }}>
                        {day.temp_mean.toFixed(1)}
                      </TableCell>
                      <TableCell className="border p-0" style={{ backgroundColor: rainColor, color: getTextColor(rainColor) }}>
                        {day.precipitation.toFixed(1)}
                      </TableCell>
                      <TableCell className="border p-0" style={{ backgroundColor: sunColor, color: getTextColor(sunColor) }}>
                        {sunHours.toFixed(1)}
                      </TableCell>
                      <TableCell className="border bg-white dark:bg-background">
                        {day.wind_speed_max.toFixed(1)}
                      </TableCell>
                      <TableCell className="border bg-white dark:bg-background">
                        <Link 
                          href={`/climatologie/jour/${year}/${month}/${format(parseISO(day.date), "dd")}/guercif`}
                          className="text-primary hover:underline"
                        >
                          Détails
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground italic">
            Source : Open-Meteo Archive. Échelle de couleurs basée sur Wikipédia.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
