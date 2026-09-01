import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import "./agent.css";
import { MetaPixel } from "@/components/meta/MetaPixel";
import { PixelRouteTracker } from "@/components/meta/PixelRouteTracker";
import { ConsentBanner } from "@/components/meta/ConsentBanner";
import AgentWidget from "@/components/agent/AgentWidget";
import { agentEnabled } from "@/lib/agent/server";

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

import { SITE_URL } from "@/lib/site";

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
  // Android Chrome: el teclado encoge el viewport en vez de tapar el contenido.
  interactiveWidget: "resizes-content",
  themeColor: "#1b4fa0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-style="clasico" className={`${sourceSans.variable} ${sourceSerif.variable}`}>
      <body>
        {children}
        <MetaPixel />
        <PixelRouteTracker />
        <ConsentBanner />
        <AgentWidget enabled={agentEnabled || process.env.AGENT_PREVIEW === "1"} />
      </body>
    </html>
  );
}
