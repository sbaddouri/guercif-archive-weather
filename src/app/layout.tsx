import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Navbar from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Guercif Weather Archive - Climatologie de Guercif, Maroc",
  description: "Archives météorologiques complètes de Guercif, Oriental, Maroc. Températures, précipitations et statistiques climatiques.",
  keywords: ["Guercif", "Météo", "Climatologie", "Maroc", "Archives Météo", "Oriental", "Températures", "Pluie"],
  authors: [{ name: "Guercif Weather" }],
  openGraph: {
    title: "Guercif Weather Archive",
    description: "Climatologie et archives météo de Guercif, Maroc.",
    url: "https://guercif-weather.vercel.app",
    siteName: "Guercif Weather",
    locale: "fr_FR",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-6">
              {children}
            </main>
            <footer className="border-t py-6 text-center text-sm text-muted-foreground">
              &copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span> Guercif Weather Archive. Données via{" "}
              <a 
                href="https://open-meteo.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:underline text-primary"
              >
                Open-Meteo
              </a>.
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
