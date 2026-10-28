import { getOccurrencesData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
      { label: "Tx ≥ 30 (jours/an)", key: "txGe30" },
      { label: "Tx ≥ 25 (jours/an)", key: "txGe25" },
      { label: "Tx ≥ 20 (jours/an)", key: "txGe20" },
      { label: "Tn ≥ 20 (jours/an)", key: "tnGe20" },
      { label: "Tx ≤ 0 (jours/an)", key: "txLe0" },
      { label: "Tn ≤ 0 (jours/an)", key: "tnLe0" },
      { label: "Tn ≤ -5 (jours/an)", key: "tnLeMinus5" },
      { label: "Tn ≤ -10 (jours/an)", key: "tnLeMinus10" },
      { label: "Tx ≤ 0 (max. jours consécutifs)", key: "txLe0ConsecutiveMax" },
      { label: "Tx ≥ 25 (max. jours consécutifs)", key: "txGe25ConsecutiveMax" },
    ],
  },
  {
    title: "Précipitations",
    rows: [
      { label: "RR ≥ 1 (jours/an)", key: "rrGe1" },
      { label: "RR ≥ 5 (jours/an)", key: "rrGe5" },
      { label: "RR ≥ 10 (jours/an)", key: "rrGe10" },
      { label: "RR ≥ 1 (max. jours consécutifs)", key: "rrGe1ConsecutiveMax" },
      { label: "RR ≤ 1 (max. jours consécutifs)", key: "rrLe1ConsecutiveMax" },
    ],
  },
  {
    title: "Phénomènes observées",
    rows: [
      { label: "Orage (jours/an)", key: "orage" },
      { label: "Brouillard (jours/an)", key: "brouillard" },
      { label: "Neige (jours/an)", key: "neige" },
      { label: "Beau temps (jours/an)", key: "beauTemps" },
      { label: "Gris (jours/an)", key: "gris" },
    ],
  },
  {
    title: "Vents",
    rows: [
      { label: "Vent ≥ 57.6 km/h (jours/an)", key: "ventGe576" },
      { label: "Vent ≥ 100.8 km/h (jours/an)", key: "ventGe1008" },
    ],
  },
];

export const revalidate = 3600;

export default async function OccurrencesPage() {
  const { byMonth, months, yearCount, period } = await getOccurrencesData();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Occurrences de phénomènes - Guercif</h1>
        <p className="text-muted-foreground">
          Nombre moyen de jours par mois et par an (moyenne sur la période {period}, {yearCount} années).
          Les valeurs "max. jours consécutifs" sont le maximum observé sur la période.
        </p>
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
                      <TableHead className="border font-bold text-black dark:text-white px-1 py-1">Moyenne annuelle</TableHead>
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
                              {num.toFixed(1)}
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
        Source : Open-Meteo Archive (Guercif). Période {period}. Les seuils de vent sont exprimés en km/h (vitesse max journalière). Température et précipitations : moyenne de jours par an. Consécutifs : maximum observé sur la période.
      </div>

      <div className="text-center mt-6">
        <Link href="/climatologie">
          <Button variant="outline">← Retour à la climatologie</Button>
        </Link>
      </div>
    </div>
  );
}
