import { getRecentDailyData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CloudSun, Thermometer, Droplets, Wind, Sun, MapPin, Calendar } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import HomeClient from "@/components/home-client";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export default async function Home() {
  const recentData = await getRecentDailyData(7);
  const latest = recentData[0];

  // Dynamically get available years from data folder
  const dataPath = path.join(process.cwd(), "data", "daily");
  let availableYears: string[] = [];
  if (fs.existsSync(dataPath)) {
    availableYears = fs.readdirSync(dataPath).sort((a, b) => b.localeCompare(a));
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Guercif Weather Archive",
    "description": "Archives météorologiques et climatologiques de Guercif, Maroc.",
    "url": "https://guercif-weather.vercel.app",
    "applicationCategory": "WeatherService",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Guercif",
      "addressRegion": "Oriental",
      "addressCountry": "MA"
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-12 bg-gradient-to-b from-primary/10 to-transparent rounded-3xl">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Guercif <span className="text-primary">Archive</span> Weather
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Découvrez la climatologie détaillée de Guercif, Oriental, Maroc. 
          Archives historiques, graphiques interactifs et statistiques précises.
        </p>
      </section>

      {/* Latest Weather Summary */}
      {latest && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Dernière mise à jour</span>
                <Badge variant="outline">
                  {format(parseISO(latest.date), "d MMMM yyyy", { locale: fr })}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-4 bg-orange-500/5 rounded-xl">
                <Thermometer className="h-8 w-8 text-orange-500 mb-2" />
                <span className="text-2xl font-bold">{latest.temp_min}°C</span>
                <span className="text-xs text-muted-foreground text-center">Temp. Min</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-blue-500/5 rounded-xl">
                <Thermometer className="h-8 w-8 text-blue-500 mb-2" />
                <span className="text-2xl font-bold">{latest.temp_max}°C</span>
                <span className="text-xs text-muted-foreground text-center">Temp. Max</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-cyan-500/5 rounded-xl">
                <Droplets className="h-8 w-8 text-cyan-500 mb-2" />
                <span className="text-2xl font-bold">{latest.precipitation}mm</span>
                <span className="text-xs text-muted-foreground text-center">Précipitations</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-yellow-500/5 rounded-xl">
                <Sun className="h-8 w-8 text-yellow-500 mb-2" />
                <span className="text-2xl font-bold">{(latest.sunshine / 3600).toFixed(1)}h</span>
                <span className="text-xs text-muted-foreground text-center">Ensoleillement</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Localisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ville:</span>
                  <span className="font-medium">Guercif</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Région:</span>
                  <span className="font-medium">Oriental</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pays:</span>
                  <span className="font-medium">Maroc</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coordonnées:</span>
                  <span className="font-medium">34.22°N, 3.35°W</span>
                </div>
              </div>
              <Link href="/archives" className="block">
                <Button className="w-full">Explorer les archives</Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Map Section moved to HomeClient */}
      <HomeClient />

      {/* Quick Access */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Archives annuelles</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {availableYears.length > 0 ? (
            availableYears.map((year) => (
              <Link key={year} href={`/climatologie/annee/${year}/guercif`}>
                <Card className="hover:border-primary transition-colors cursor-pointer group">
                  <CardContent className="p-6 text-center">
                    <span className="text-2xl font-bold group-hover:text-primary transition-colors">{year}</span>
                    <p className="text-sm text-muted-foreground">Consulter l'année</p>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <p className="text-muted-foreground col-span-full italic">
              Aucune archive disponible pour le moment. Le robot de données commencera sa collecte prochainement.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
