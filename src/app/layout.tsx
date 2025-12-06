import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { FavoritesProvider } from "@/contexts/favorites-context";
import { LanguageProvider } from "@/contexts/language-context";
import { EventsProvider } from "@/contexts/events-context";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "CultuChat - Descubre eventos culturales",
  description: "Encuentra y explora eventos culturales cerca de ti",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${nunito.variable} antialiased`}>
        <ThemeProvider>
          <LanguageProvider>
            <EventsProvider>
              <FavoritesProvider>
                {children}
              </FavoritesProvider>
            </EventsProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
