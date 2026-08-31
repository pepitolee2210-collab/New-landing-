/* ============================================================
   UsaLatinoPrime — Página propia de cada servicio (/visa-juvenil, …)
   Una URL por servicio para campañas de Meta Ads: el anuncio aterriza
   directo en el embudo (video → preguntas → resultado), sin selector.
   ============================================================ */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceFunnel from "@/components/ServiceFunnel";
import { SERVICES, getServiceBySlug } from "@/lib/services";

// Solo existen los slugs declarados en lib/services.ts; el resto → 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const svc = getServiceBySlug(params.slug);
  if (!svc) return {};
  const title = `${svc.name} — USA Latino Prime`;
  const description = `${svc.desc} Descubre en minutos si calificas, desde tu celular.`;
  return {
    title,
    description,
    alternates: { canonical: `/${svc.slug}` },
    openGraph: {
      title,
      description: svc.tagline,
      url: `/${svc.slug}`,
      type: "website",
    },
    twitter: { title, description: svc.tagline },
  };
}

export default function ServicePage({ params }: { params: { slug: string } }) {
  const svc = getServiceBySlug(params.slug);
  if (!svc) notFound();
  return <ServiceFunnel serviceId={svc.id} />;
}
