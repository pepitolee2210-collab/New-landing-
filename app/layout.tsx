import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { MetaPixel } from "@/components/meta/MetaPixel";
import { ConsentBanner } from "@/components/meta/ConsentBanner";

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

const SITE_NAME = "USA Latino Prime";
const SITE_TITLE = "UsaLatinoPrime — Evaluación migratoria gratuita";
const SITE_DESCRIPTION =
  "Lleva tu propio trámite migratorio desde el celular, paso a paso, con validación automática y nuestro equipo a tu lado. Descubre si calificas en minutos.";
const SHARE_DESCRIPTION =
  "Descubre si calificas para tu trámite migratorio en minutos, desde tu celular.";
const SHARE_IMAGE = "/og-image.jpg";

// URL pública del sitio. Permite override manual; si no, usa el dominio de
// producción que Vercel inyecta automáticamente; en local cae a localhost.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: { icon: "/logo.png", apple: "/logo.png" },
  openGraph: {
    title: SITE_TITLE,
    description: SHARE_DESCRIPTION,
    type: "website",
    locale: "es_US",
    siteName: SITE_NAME,
    url: "/",
    images: [
      {
        url: SHARE_IMAGE,
        width: 1600,
        height: 902,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SHARE_DESCRIPTION,
    images: [SHARE_IMAGE],
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
      <body>
        {children}
        <MetaPixel />
        <ConsentBanner />
      </body>
    </html>
  );
}
