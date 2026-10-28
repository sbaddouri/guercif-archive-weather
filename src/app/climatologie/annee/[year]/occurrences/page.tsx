import { getOccurrencesDataForYear, listAvailableYears } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

const MONTH_NAMES: Record<string, string> = {
  '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
  '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
  '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre',
};

const fmt = (v: number) => v.toFixed(1);

const groups = [
  {
    title: "Température",
    rows: [
      { label: "Tx ≥ 30 (jours)", key: "txGe30" },
      { label: "Tx ≥ 25 (jours)", key: "txGe25" },
      { label: "Tx ≥ 20 (jours)", key: "txGe20" },
      { label: "Tn ≥ 20 (jours)", key: "tnGe20" },
      { label: "Tx ≤ 0 (jours)", key: "txLe0" },
      { label: "Tn ≤ 0 (jours)", key: "tnLe0" },
      { label: "Tn ≤ -5 (jours)", key: "tnLeMinus5" },
      { label: "Tn ≤ -10 (jours)", key: "tnLeMinus10" },
      { label: "Tx ≤ 0 (max. jours consécutifs)", key: "txLe0ConsecutiveMax" },
      { label: "Tx ≥ 25 (max. jours consécutifs)", key: "txGe25ConsecutiveMax" },
    ],
  },
  {
    title: "Précipitations",
    rows: [
      { label: "RR ≥ 1 (jours)", key: "rrGe1" },
      { label: "RR ≥ 5 (jours)", key: "rrGe5" },
      { label: "RR ≥ 10 (jours)", key: "rrGe10" },
      { label: "RR ≥ 1 (max. jours consécutifs)", key: "rrGe1ConsecutiveMax" },
      { label: "RR ≤ 1 (max. jours consécutifs)", key: "rrLe1ConsecutiveMax" },
    ],
  },
  {
    title: "Phénomènes observées",
    rows: [
      { label: "Orage (jours)", key: "orage" },
      { label: "Brouillard (jours)", key: "brouillard" },
      { label: "Neige (jours)", key: "neige" },
      { label: "Beau temps (jours)", key: "beauTemps" },
      { label: "Gris (jours)", key: "gris" },
    ],
  },
  {
    title: "Vents",
    rows: [
      { label: "Vent ≥ 57.6 km/h (jours)", key: "ventGe576" },
      { label: "Vent ≥ 100.8 km/h (jours)", key: "ventGe1008" },
    ],
  },
];

interface PageProps {
  params: Promise<{
    year: string;
  }>;
}

export async function generateStaticParams() {
  const years = listAvailableYears();
  return years.map((year: string) => ({ year }));
}

export const dynamicParams = true;
export const revalidate = 3600;

export default async function YearOccurrencesPage({ params }: PageProps) {
  const { year } = await params;
  const data = await getOccurrencesDataForYear(year);

  if (!data) {
    notFound();
  }

  const { byMonth, months } = data;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Occurrences de phénomènes - {year}</h1>
        <p className="text-muted-foreground">
          Nombre de jours par mois pour l'année {year} à Guercif.
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 flex-wrap">
        <Link href={`/climatologie/annee/${year}/guercif`}>
          <Button variant="outline" size="sm">
            Voir l'année {year}
          </Button>
        </Link>
        <Link href="/climatologie/occurrences">
          <Button variant="outline" size="sm">
            Occurrences (moyenne 1940–2026)
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {groups.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle>{group.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="border-collapse text-center text-sm w-full min-w-[600px]">
                  <TableHeader>
                    <TableRow className="bg-[#f2f2f2] dark:bg-muted/50 border-b">
                      <TableHead className="border font-bold text-black dark:text-white px-2 py-1 text-left">Indicateur</TableHead>
                      {months.map(m => (
                        <TableHead key={m} className="border font-bold text-black dark:text-white px-1 py-1 capitalize">
                          {MONTH_NAMES[m]}
                        </TableHead>
                      ))}
                      <TableHead className="border font-bold text-black dark:text-white px-1 py-1">Total année</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.rows.map((row) => (
                      <TableRow key={row.key}>
                        <TableCell className="border bg-[#f2f2f2] dark:bg-muted/30 font-bold text-left px-2 py-1">
                          {row.label}
                        </TableCell>
                        {months.map(m => {
                          const val = byMonth[m]?.[row.key as keyof typeof byMonth[string]];
                          const num = typeof val === 'number' ? val : 0;
                          return (
                            <TableCell key={m} className="border p-0">
                              {row.key.endsWith('ConsecutiveMax') ? num.toFixed(0) : num.toFixed(1)}
                            </TableCell>
                          );
                        })}
                        <TableCell className="border font-bold bg-[#f2f2f2] dark:bg-muted/30">
                          {months.reduce((acc, m) => {
                            const v = byMonth[m]?.[row.key as keyof typeof byMonth[string]];
                            return acc + (typeof v === 'number' ? v : 0);
                          }, 0).toFixed(1)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-2 text-[11px] text-muted-foreground italic text-center">
        Source : Open-Meteo Archive (Guercif). Année {year}. Températures et précipitations : nombre de jours. Consécutifs : maximum observé dans l'année.
      </div>
    </div>
  );
}
