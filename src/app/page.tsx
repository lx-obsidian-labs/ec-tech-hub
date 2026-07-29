import { AiAssistPreview, DigitalServices, EcosystemMap, FinalCta, LearningPreview, MarketplacePreview, RepairProcess, TechnicianDiscovery, TrustSection } from "@/components/home/landing-sections";
import { HeroSection } from "@/components/home/hero-section";
import { QuickActions } from "@/components/home/quick-actions";

export default function Home() {
  return (
    <main id="main-content">
      <HeroSection />
      <QuickActions />
      <TrustSection />
      <RepairProcess />
      <TechnicianDiscovery />
      <AiAssistPreview />
      <MarketplacePreview />
      <LearningPreview />
      <DigitalServices />
      <EcosystemMap />
      <FinalCta />
    </main>
  );
}
