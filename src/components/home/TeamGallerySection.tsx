import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

const mainSliderImages = [
  "/images/conquista_1.jpg",
  "/images/conquista_2.jpg",
  "/images/conquista_3.jpg",
  "/images/conquista_4.jpg",
];

const communitySliderImages = [
  "/images/comunidade_1.png",
  "/images/comunidade_2.png",
  "/images/comunidade_3.png",
  "/images/comunidade_4.png",
  "/images/comunidade_5.png",
];

const triathlonSliderImages = [
  "/images/galeria_triathlon_1.jpg",
  "/images/galeria_triathlon_2.jpg",
];

// Todas as imagens para o lightbox
const allImages = [
  ...mainSliderImages,
  ...triathlonSliderImages,
  ...communitySliderImages,
];

export function TeamGallerySection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentCommSlide, setCurrentCommSlide] = useState(0);
  const [currentTriSlide, setCurrentTriSlide] = useState(0);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mainSliderImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentCommSlide((prev) => (prev + 1) % communitySliderImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTriSlide((prev) => (prev + 1) % triathlonSliderImages.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % mainSliderImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + mainSliderImages.length) % mainSliderImages.length);

  const openLightbox = (img: string) => {
    const idx = allImages.indexOf(img);
    setLightboxIdx(idx >= 0 ? idx : 0);
    setLightboxImg(img);
  };

  const closeLightbox = () => setLightboxImg(null);

  const lightboxNext = useCallback(() => {
    const next = (lightboxIdx + 1) % allImages.length;
    setLightboxIdx(next);
    setLightboxImg(allImages[next]);
  }, [lightboxIdx]);

  const lightboxPrev = useCallback(() => {
    const prev = (lightboxIdx - 1 + allImages.length) % allImages.length;
    setLightboxIdx(prev);
    setLightboxImg(allImages[prev]);
  }, [lightboxIdx]);

  // Fechar com ESC, navegar com setas do teclado
  useEffect(() => {
    if (!lightboxImg) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") lightboxNext();
      if (e.key === "ArrowLeft") lightboxPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxImg, lightboxNext, lightboxPrev]);

  return (
    <>
      {/* LIGHTBOX */}
      {lightboxImg && (
        <div
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          {/* Fechar */}
          <button
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 z-10 transition-colors"
            onClick={closeLightbox}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navegar — Anterior */}
          <button
            className="absolute left-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 z-10 transition-colors"
            onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Imagem */}
          <img
            src={lightboxImg}
            alt="Foto ampliada"
            className="max-h-[90vh] max-w-full rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Navegar — Próxima */}
          <button
            className="absolute right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 z-10 transition-colors"
            onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Contador */}
          <p className="absolute bottom-4 text-white/50 text-sm">
            {lightboxIdx + 1} / {allImages.length}
          </p>
        </div>
      )}

      <section className="pt-16 pb-6 bg-white relative" id="galeria">
        <div className="container px-4 md:px-8 mx-auto z-10 relative">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-12 gap-4">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-5xl font-heading text-black uppercase mb-3 tracking-tight">Galeria de Conquistas</h2>
              <p className="text-neutral-500 text-base md:text-lg leading-relaxed">
                Momentos que definem nossa trajetória de sucesso. Da superação diária aos pódios mais disputados.
              </p>
            </div>
            <button
              onClick={() => openLightbox(allImages[0])}
              className="flex items-center gap-2 text-primary font-heading uppercase tracking-widest text-sm hover:text-primary/80 transition-colors shrink-0"
            >
              Ver todas as fotos <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Grid da Galeria */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 md:h-[600px]">

            {/* Slider Principal */}
            <div
              className="md:col-span-7 lg:col-span-8 rounded-lg overflow-hidden group h-[280px] sm:h-[380px] md:h-full relative shadow-md cursor-pointer"
              onClick={() => openLightbox(mainSliderImages[currentSlide])}
            >
              {mainSliderImages.map((img, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <img
                    src={img}
                    alt={`Conquista ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}

              {/* Ícone de zoom */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                <ZoomIn className="w-12 h-12 text-white drop-shadow-lg" />
              </div>

              {/* Controles do slider */}
              <div
                className="absolute inset-x-0 bottom-4 px-4 z-20 flex justify-between items-end"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="hidden sm:block translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <h3 className="text-white font-heading text-xl tracking-wide uppercase">Alta Performance</h3>
                  <p className="text-neutral-300 font-light text-sm">Mais de 100 pódios conquistados.</p>
                </div>
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={prevSlide}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-70 z-10 pointer-events-none" />
            </div>

            {/* Coluna Direita */}
            <div className="md:col-span-5 lg:col-span-4 grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-6 md:h-full">

              {/* Triathlon */}
              <div
                className="rounded-lg overflow-hidden group md:flex-1 relative shadow-sm h-[160px] md:h-auto cursor-pointer"
                onClick={() => openLightbox(triathlonSliderImages[currentTriSlide])}
              >
                {triathlonSliderImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentTriSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    <img
                      src={img}
                      alt={`Triathlon ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                  <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
                <div className="absolute bottom-3 left-3 z-20">
                  <h3 className="text-white font-heading text-sm md:text-lg uppercase tracking-wide">Triathlon</h3>
                </div>
              </div>

              {/* Comunidade */}
              <div
                className="rounded-lg overflow-hidden group md:flex-1 relative shadow-sm h-[160px] md:h-auto bg-neutral-100 cursor-pointer"
                onClick={() => openLightbox(communitySliderImages[currentCommSlide])}
              >
                {communitySliderImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentCommSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    <img
                      src={img}
                      alt={`Comunidade ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                  <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
                <div className="absolute bottom-3 left-3 z-20">
                  <h3 className="text-white font-heading text-sm md:text-lg uppercase tracking-wide">Comunidade</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Logos Provas */}
          <div className="mt-10 pt-6 border-t border-neutral-200">
            <p className="text-center font-heading text-neutral-400 uppercase tracking-widest text-xs md:text-sm mb-6 md:mb-8">
              Nossos atletas já superaram as maiores provas do mundo
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-24">
              <span className="font-heading text-lg md:text-2xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-blue-900 bg-clip-text text-transparent">IRONMAN®</span>
              <span className="font-heading text-lg md:text-2xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-blue-900 bg-clip-text text-transparent">SÃO SILVESTRE</span>
              <span className="font-heading text-lg md:text-2xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-blue-900 bg-clip-text text-transparent">MARATONA DO RIO</span>
              <span className="font-heading text-lg md:text-2xl font-bold tracking-tight text-center bg-gradient-to-r from-red-600 to-blue-900 bg-clip-text text-transparent">ULTRABM</span>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
