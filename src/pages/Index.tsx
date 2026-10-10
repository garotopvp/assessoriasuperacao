import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/common/SEO";
import { HeroSection } from "@/components/home/HeroSection";
import { SistemaSection } from "@/components/home/SistemaSection";
import { HistoriaSection } from "@/components/home/HistoriaSection";
// import { PlanosSection } from "@/components/home/PlanosSection";
import { DepoimentosSection } from "@/components/home/DepoimentosSection";
// import { TeamSection } from "@/components/home/TeamSection";
import { TeamGallerySection } from "@/components/home/TeamGallerySection";
import { TrainingLocationSection } from "@/components/home/TrainingLocationSection";
// import { CTASection } from "@/components/home/CTASection";
import { SITE_CONFIG } from "@/config/site";

const Index = () => {
  return (
    <>
      <SEO
        title={SITE_CONFIG.name}
        description={SITE_CONFIG.description}
        keywords="corrida, triathlon, ciclismo, treino, assessoria esportiva, atleta"
      />
      <Layout>
        <HeroSection />
        <HistoriaSection />
        <SistemaSection />
        <TeamGallerySection />
        <TrainingLocationSection />
        <DepoimentosSection />
        {/*
        <PlanosSection />
        <TeamSection />
        <CTASection />
        */}
      </Layout>
    </>
  );
};

export default Index;
