import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UsaLatinoPrime — Evaluación migratoria gratuita",
  description:
    "Lleva tu propio trámite migratorio desde el celular, paso a paso, con validación automática y nuestro equipo a tu lado. Descubre si calificas en minutos.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
  openGraph: {
    title: "UsaLatinoPrime — Evaluación migratoria gratuita",
    description:
      "Descubre si calificas para tu trámite migratorio en minutos, desde tu celular.",
    type: "website",
    locale: "es_US",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2563c4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-style="moderno" className={`${sourceSans.variable} ${sourceSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
