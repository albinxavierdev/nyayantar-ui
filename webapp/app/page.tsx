import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { BrandSection } from "@/components/sections/BrandSection";
import { FeatureIntroSection } from "@/components/sections/FeatureIntroSection";
import { SpacerDivider } from "@/components/sections/SpacerDivider";
import { BuiltSection } from "@/components/sections/BuiltSection";
import { FeatureGridSection } from "@/components/sections/FeatureGridSection";
import { TestimonialSection } from "@/components/sections/TestimonialSection";
import { AuthSection } from "@/components/sections/AuthSection";
import { WorkspaceSection } from "@/components/sections/WorkspaceSection";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AdvancedFeaturesSection } from "@/components/sections/AdvancedFeaturesSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { CtaSection } from "@/components/sections/CtaSection";

export default function Page() {
  return (
    <AuthProvider>
      <Header />
      <main>
        <HeroSection />
        <BrandSection />
        <FeatureIntroSection />
        <SpacerDivider />
        <BuiltSection />
        <FeatureGridSection />
        <TestimonialSection />
        <AuthSection />
        <WorkspaceSection />
        <AdvancedFeaturesSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </AuthProvider>
  );
}
