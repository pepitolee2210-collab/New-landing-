/* ============================================================
   UsaLatinoPrime — Home "El expediente del sueño americano"
   Portada navy (hero · cómo funciona · app · CTA · footer) +
   páginas de papel (servicios · opiniones). Interacción: HomeFX.
   ============================================================ */
import LpHeader from "@/components/home/LpHeader";
import HomeHero from "@/components/home/HomeHero";
import ServicesSection from "@/components/home/ServicesSection";
import HowItWorks from "@/components/home/HowItWorks";
import AppSection from "@/components/home/AppSection";
import ReviewsSection from "@/components/home/ReviewsSection";
import CtaBand from "@/components/home/CtaBand";
import SiteFooter from "@/components/home/SiteFooter";
import WhatsAppFab from "@/components/home/WhatsAppFab";
import HomeFX from "@/components/home/HomeFX";
import { listApprovedReviews, reviewsEnabled } from "@/lib/reviews";

// Render dinámico: las reseñas se leen con fetch directo (memo-caché de 30s en
// lib/reviews.ts); /admin invalida la memo al aprobar para verlo al instante.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const reviews = await listApprovedReviews();
  return (
    <div className="lp">
      <LpHeader />
      <main>
        <HomeHero />
        <ServicesSection />
        <HowItWorks />
        <AppSection />
        <ReviewsSection reviews={reviews} enabled={reviewsEnabled} />
        <CtaBand />
      </main>
      <SiteFooter />
      <WhatsAppFab />
      <HomeFX />
    </div>
  );
}
