import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

export default function ClimatologiePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Climatologie de Guercif</h1>
        <p className="text-muted-foreground">Données climatiques moyennes et records pour la ville de Guercif.</p>
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
            <CardTitle>Records Historiques (Exemple)</CardTitle>
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
                  <TableCell className="text-red-500 font-bold">48.2°C</TableCell>
                  <TableCell>Juillet 2021</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Température Min</TableCell>
                  <TableCell className="text-blue-500 font-bold">-4.5°C</TableCell>
                  <TableCell>Janvier 2005</TableCell>
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

      <div className="text-center">
        <Link href="/archives">
          <Button size="lg">Explorer les données par année</Button>
        </Link>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
