import { getDailyDataForYear } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { getTemperatureColor, getPrecipitationColor, getTextColor } from "@/lib/weather-colors";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{
    year: string;
  }>;
}

export default async function YearPage({ params }: PageProps) {
  const { year } = await params;
  const data = await getDailyDataForYear(year);

  if (data.length === 0) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Aucune donnée pour l'année {year}</h1>
        <Link href="/" className="text-primary hover:underline">Retour à l'accueil</Link>
      </div>
    );
  }

  // Group by month
  const monthlyStats: { [key: string]: any } = {};
  data.forEach(day => {
    const month = format(parseISO(day.date), "MM");
    if (!monthlyStats[month]) {
      monthlyStats[month] = {
        name: format(parseISO(day.date), "MMM", { locale: fr }),
        fullName: format(parseISO(day.date), "MMMM", { locale: fr }),
        days: 0,
        tempMaxSum: 0,
        tempMinSum: 0,
        tempMeanSum: 0,
        rainSum: 0,
        absMax: -Infinity,
        absMin: Infinity,
      };
    }
    const s = monthlyStats[month];
    s.days++;
    s.tempMaxSum += day.temp_max;
    s.tempMinSum += day.temp_min;
    s.tempMeanSum += day.temp_mean;
    s.rainSum += day.precipitation;
    if (day.temp_max > s.absMax) s.absMax = day.temp_max;
    if (day.temp_min < s.absMin) s.absMin = day.temp_min;
  });

  const sortedMonths = Object.keys(monthlyStats).sort();

  // Yearly absolute stats
  const yearlyAbsMax = Math.max(...sortedMonths.map(m => monthlyStats[m].absMax));
  const yearlyAbsMin = Math.min(...sortedMonths.map(m => monthlyStats[m].absMin));
  const yearlyTotalRain = sortedMonths.reduce((acc, m) => acc + monthlyStats[m].rainSum, 0);
  const yearlyAvgMax = sortedMonths.reduce((acc, m) => acc + monthlyStats[m].tempMaxSum, 0) / data.length;
  const yearlyAvgMin = sortedMonths.reduce((acc, m) => acc + monthlyStats[m].tempMinSum, 0) / data.length;

  const avgMaxColor = getTemperatureColor(yearlyAvgMax);
  const avgMinColor = getTemperatureColor(yearlyAvgMin);
  const absMaxColor = getTemperatureColor(yearlyAbsMax);
  const absMinColor = getTemperatureColor(yearlyAbsMin);

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Données climatiques {year} - Guercif, Maroc</h1>
        <p className="text-muted-foreground">Tableau climatologique au format Wikipédia.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="col-span-1 border-none shadow-sm" style={{ backgroundColor: avgMinColor, color: getTextColor(avgMinColor) }}>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider opacity-80">Moyenne Min</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">{yearlyAvgMin.toFixed(1)}°C</div>
          </CardContent>
        </Card>
        <Card className="col-span-1 border-none shadow-sm" style={{ backgroundColor: avgMaxColor, color: getTextColor(avgMaxColor) }}>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider opacity-80">Moyenne Max</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">{yearlyAvgMax.toFixed(1)}°C</div>
          </CardContent>
        </Card>
        <Card className="col-span-1 border-none shadow-sm" style={{ backgroundColor: absMinColor, color: getTextColor(absMinColor) }}>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider opacity-80">Record Froid</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">{yearlyAbsMin.toFixed(1)}°C</div>
          </CardContent>
        </Card>
        <Card className="col-span-1 border-none shadow-sm" style={{ backgroundColor: absMaxColor, color: getTextColor(absMaxColor) }}>
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider opacity-80">Record Chaleur</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">{yearlyAbsMax.toFixed(1)}°C</div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1 border-none shadow-sm bg-blue-600 text-white">
          <CardHeader className="pb-1 p-3">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider opacity-80">Pluie Annuelle</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xl font-bold">{yearlyTotalRain.toFixed(1)} mm</div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          <div className="overflow-x-auto border rounded-sm">
            <Table className="border-collapse text-[13px] text-center w-full min-w-[800px]">
              <TableHeader>
                <TableRow className="bg-[#f2f2f2] dark:bg-muted/50 border-b">
                  <TableHead className="border font-bold text-black dark:text-white px-2 py-1 h-auto text-left">Mois</TableHead>
                  {sortedMonths.map(m => (
                    <TableHead key={m} className="border font-bold text-black dark:text-white px-0 py-0 h-auto capitalize">
                      <Link 
                        href={`/climatologie/mois/${year}/${m}/guercif`}
                        className="flex items-center justify-center w-full h-full py-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        {monthlyStats[m].name}
                      </Link>
                    </TableHead>
                  ))}
                  <TableHead className="border font-bold text-black dark:text-white px-1 py-1 h-auto">Année</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Record Low */}
                <TableRow>
                  <TableCell className="border bg-[#f2f2f2] dark:bg-muted/30 font-bold text-left px-2 py-1">Record de froid (°C)</TableCell>
                  {sortedMonths.map(m => {
                    const val = monthlyStats[m].absMin;
                    const bgColor = getTemperatureColor(val);
                    return (
                      <TableCell key={m} className="border p-0" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        {val.toFixed(1)}
                      </TableCell>
                    );
                  })}
                  <TableCell className="border font-bold bg-[#f2f2f2] dark:bg-muted/30">
                    {Math.min(...sortedMonths.map(m => monthlyStats[m].absMin)).toFixed(1)}
                  </TableCell>
                </TableRow>

                {/* Avg Low */}
                <TableRow>
                  <TableCell className="border bg-[#f2f2f2] dark:bg-muted/30 font-bold text-left px-2 py-1">Moyenne des minimales (°C)</TableCell>
                  {sortedMonths.map(m => {
                    const val = monthlyStats[m].tempMinSum / monthlyStats[m].days;
                    const bgColor = getTemperatureColor(val);
                    return (
                      <TableCell key={m} className="border p-0" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        {val.toFixed(1)}
                      </TableCell>
                    );
                  })}
                  <TableCell className="border font-bold bg-[#f2f2f2] dark:bg-muted/30">
                    {(sortedMonths.reduce((acc, m) => acc + monthlyStats[m].tempMinSum, 0) / data.length).toFixed(1)}
                  </TableCell>
                </TableRow>

                {/* Daily Mean */}
                <TableRow>
                  <TableCell className="border bg-[#f2f2f2] dark:bg-muted/30 font-bold text-left px-2 py-1">Moyenne quotidienne (°C)</TableCell>
                  {sortedMonths.map(m => {
                    const val = monthlyStats[m].tempMeanSum / monthlyStats[m].days;
                    const bgColor = getTemperatureColor(val);
                    return (
                      <TableCell key={m} className="border p-0" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        {val.toFixed(1)}
                      </TableCell>
                    );
                  })}
                  <TableCell className="border font-bold bg-[#f2f2f2] dark:bg-muted/30">
                    {(sortedMonths.reduce((acc, m) => acc + monthlyStats[m].tempMeanSum, 0) / data.length).toFixed(1)}
                  </TableCell>
                </TableRow>

                {/* Avg High */}
                <TableRow>
                  <TableCell className="border bg-[#f2f2f2] dark:bg-muted/30 font-bold text-left px-2 py-1">Moyenne des maximales (°C)</TableCell>
                  {sortedMonths.map(m => {
                    const val = monthlyStats[m].tempMaxSum / monthlyStats[m].days;
                    const bgColor = getTemperatureColor(val);
                    return (
                      <TableCell key={m} className="border p-0" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        {val.toFixed(1)}
                      </TableCell>
                    );
                  })}
                  <TableCell className="border font-bold bg-[#f2f2f2] dark:bg-muted/30">
                    {(sortedMonths.reduce((acc, m) => acc + monthlyStats[m].tempMaxSum, 0) / data.length).toFixed(1)}
                  </TableCell>
                </TableRow>

                {/* Record High */}
                <TableRow>
                  <TableCell className="border bg-[#f2f2f2] dark:bg-muted/30 font-bold text-left px-2 py-1">Record de chaleur (°C)</TableCell>
                  {sortedMonths.map(m => {
                    const val = monthlyStats[m].absMax;
                    const bgColor = getTemperatureColor(val);
                    return (
                      <TableCell key={m} className="border p-0" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        {val.toFixed(1)}
                      </TableCell>
                    );
                  })}
                  <TableCell className="border font-bold bg-[#f2f2f2] dark:bg-muted/30">
                    {Math.max(...sortedMonths.map(m => monthlyStats[m].absMax)).toFixed(1)}
                  </TableCell>
                </TableRow>

                {/* Precipitation */}
                <TableRow>
                  <TableCell className="border bg-[#f2f2f2] dark:bg-muted/30 font-bold text-left px-2 py-1">Précipitations (mm)</TableCell>
                  {sortedMonths.map(m => {
                    const val = monthlyStats[m].rainSum;
                    const bgColor = getPrecipitationColor(val);
                    return (
                      <TableCell key={m} className="border p-0" style={{ backgroundColor: bgColor, color: getTextColor(bgColor) }}>
                        {val.toFixed(1)}
                      </TableCell>
                    );
                  })}
                  <TableCell className="border font-bold bg-[#f2f2f2] dark:bg-muted/30">
                    {sortedMonths.reduce((acc, m) => acc + monthlyStats[m].rainSum, 0).toFixed(1)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground italic">
            Source : Open-Meteo Archive (Guercif). Échelle de couleurs basée sur le modèle Weather Box de Wikipédia.
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {sortedMonths.map(m => (
          <Link 
            key={m} 
            href={`/climatologie/mois/${year}/${m}/guercif`}
            className={cn(buttonVariants({ variant: "outline" }), "w-full capitalize")}
          >
            Détails {monthlyStats[m].fullName} {year}
          </Link>
        ))}
      </div>
    </div>
  );
}
