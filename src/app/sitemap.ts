import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://guercif-weather.vercel.app';
const DATA_DIR = path.join(process.cwd(), 'data', 'daily');

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  if (fs.existsSync(DATA_DIR)) {
    const years = fs.readdirSync(DATA_DIR);
    years.forEach(year => {
      routes.push({
        url: `${BASE_URL}/climatologie/annee/${year}/guercif`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      });

      const monthsDir = path.join(DATA_DIR, year);
      const months = fs.readdirSync(monthsDir);
      months.forEach(month => {
        routes.push({
          url: `${BASE_URL}/climatologie/mois/${year}/${month}/guercif`,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.7,
        });

        const daysDir = path.join(monthsDir, month);
        const days = fs.readdirSync(daysDir);
        days.forEach(dayFile => {
          const day = dayFile.replace('.json', '');
          routes.push({
            url: `${BASE_URL}/climatologie/jour/${year}/${month}/${day}/guercif`,
            lastModified: new Date(),
            changeFrequency: 'never',
            priority: 0.5,
          });
        });
      });
    });
  }

  return routes;
}
