import { logger } from "@/lib/logger";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { clearHeroImageCache } from "@/hooks/useHeroImage";
import { Image, Sparkles, Loader2, Save, X, Move, Upload } from "lucide-react";

interface HeroImage {
  id: string;
  pagina: string;
  url: string;
  posicao: string;
}

const PAGINAS = [
  { value: "home", label: "Home" },
  { value: "consultoria", label: "Consultoria" },
  { value: "roupas", label: "Roupas" },
  { value: "conhecimento", label: "Conhecimento" },
];

export function HeroImagesManager() {
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [draggingOver, setDraggingOver] = useState<string | null>(null);
  const [repositioning, setRepositioning] = useState<string | null>(null);
  const [imagePrompts, setImagePrompts] = useState<Record<string, string>>({});
  const [localUrls, setLocalUrls] = useState<Record<string, string>>({});
  const [localPosicoes, setLocalPosicoes] = useState<Record<string, string>>({});

  // For drag repositioning
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  useEffect(() => {
    fetchHeroImages();
  }, []);

  const fetchHeroImages = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_images")
        .select("*")
        .order("created_at", { ascending: false }); // Pega o mais recente primeiro se houver duplicatas

      if (error) throw error;

      // Remove duplicatas no cliente se houver, mantendo o mais recente
      const uniqueImages = (data || []).reduce((acc: HeroImage[], current: any) => {
        const existingString = acc.find((item) => item.pagina === current.pagina);
        if (!existingString) {
          acc.push(current);
        }
        return acc;
      }, []);

      setHeroImages(uniqueImages);

      // Initialize local state
      const urls: Record<string, string> = {};
      const posicoes: Record<string, string> = {};

      PAGINAS.forEach((p) => {
        const existing = uniqueImages.find((img) => img.pagina === p.value);
        urls[p.value] = existing?.url || "";
        posicoes[p.value] = existing?.posicao || "50% 50%";
      });

      setLocalUrls(urls);
      setLocalPosicoes(posicoes);
    } catch (err) {
      logger.error("Error fetching hero images:", err);
      toast.error("Erro ao carregar imagens");
    } finally {
      setLoading(false);
    }
  };

  const persistImage = async (pagina: string, url: string, posicao: string) => {
    setSaving(pagina);

    try {
      if (!url || typeof url !== "string" || !url.trim()) {
        toast.error("URL da imagem é obrigatória e deve ser uma string válida");
        return;
      }

      // Primeiro, vamos limpar quaisquer duplicatas antigas para esta página
      // deixando apenas o registro mais recente se existir
      const { data: existingData } = await supabase
        .from("hero_images")
        .select("id")
        .eq("pagina", pagina)
        .order("created_at", { ascending: false });

      if (existingData && existingData.length > 1) {
        // Remove todos exceto o primeiro (mais recente)
        const idsToRemove = existingData.slice(1).map((d) => d.id);
        if (idsToRemove.length > 0) {
          await supabase.from("hero_images").delete().in("id", idsToRemove);
        }
      }

      // Agora fazemos o upsert usando a coluna pagina como constraint lógica
      const { error } = await supabase
        .from("hero_images")
        .upsert(
          {
            pagina: pagina,
            url: url,
            posicao: posicao,
          },
          { onConflict: "pagina" }
        )
        .select()
        .single();

      if (error) {
        // Fallback para update manual se upsert falhar
        if (existingData && existingData.length > 0) {
          const { error: updateError } = await supabase
            .from("hero_images")
            .update({ url, posicao })
            .eq("id", existingData[0].id);
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from("hero_images")
            .insert({ pagina, url, posicao });
          if (insertError) throw insertError;
        }
      }

      // Atualiza o estado local para refletir o salvamento
      setLocalUrls((prev) => ({ ...prev, [pagina]: url }));
      setLocalPosicoes((prev) => ({ ...prev, [pagina]: posicao }));

      // Invalida o cache para forçar reload da imagem
      clearHeroImageCache(pagina);

      // Recarrega tudo para garantir estado limpo
      await fetchHeroImages();

      toast.success("Imagem salva com sucesso!");
    } catch (err: unknown) {
      logger.error("Error saving hero image:", err);
      let errorMsg = "Erro ao salvar imagem";
      if (typeof err === "string") {
        errorMsg = err;
      } else if (err?.message) {
        errorMsg = err.message;
      }
      toast.error(errorMsg);
    } finally {
      setSaving(null);
    }
  };

  const handleSave = async (pagina: string) => {
    const url = localUrls[pagina];
    const posicao = localPosicoes[pagina];
    await persistImage(pagina, url, posicao);
  };

  const handleGenerateImage = async (pagina: string) => {
    const prompt = imagePrompts[pagina];
    if (!prompt?.trim()) {
      toast.error("Digite uma descrição para a imagem");
      return;
    }

    setGeneratingFor(pagina);
    try {
      const response = await supabase.functions.invoke("generate-image", {
        body: { prompt, type: "hero" },
      });

      if (response.error) throw response.error;

      const { imageUrl } = response.data;
      if (imageUrl) {
        // Upload base64 to storage
        const base64Data = imageUrl.split(",")[1];
        const fileName = `hero-${pagina}-${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
          .from("hero-images")
          .upload(fileName, decode(base64Data), {
            contentType: "image/png",
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("hero-images").getPublicUrl(fileName);

        // Adiciona timestamp para cache-busting
        const publicUrlWithTimestamp = `${urlData.publicUrl}?t=${Date.now()}`;

        // Auto-save após gerar
        await persistImage(pagina, publicUrlWithTimestamp, "50% 50%");
      }
    } catch (err: unknown) {
      logger.error("Error generating image:", err);
      toast.error(err.message || "Erro ao gerar imagem");
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleImageUpload = async (pagina: string, file: File) => {
    setUploadingFor(pagina);
    try {
      const fileName = `hero-${pagina}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("hero-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("hero-images").getPublicUrl(fileName);

      // Adiciona timestamp para cache-busting
      const publicUrlWithTimestamp = `${urlData.publicUrl}?t=${Date.now()}`;

      // Auto-save após upload
      await persistImage(pagina, publicUrlWithTimestamp, "50% 50%");
    } catch (err: unknown) {
      logger.error("Error uploading image:", err);
      toast.error(err.message || "Erro ao enviar imagem");
    } finally {
      setUploadingFor(null);
    }
  };

  const handleDragOver = (e: React.DragEvent, pagina: string) => {
    e.preventDefault();
    if (!repositioning) {
      setDraggingOver(pagina);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingOver(null);
  };

  const handleDrop = (e: React.DragEvent, pagina: string) => {
    e.preventDefault();
    setDraggingOver(null);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(pagina, file);
    } else {
      toast.error("Por favor, arraste apenas arquivos de imagem");
    }
  };

  // Parse position string to get X and Y percentages
  const parsePosition = (posicao: string): { x: number; y: number } => {
    const parts = posicao.split(" ");
    const x = parseFloat(parts[0]) || 50;
    const y = parseFloat(parts[1]) || 50;
    return { x, y };
  };

  // Start repositioning
  const handleRepositionStart = (e: React.MouseEvent, pagina: string) => {
    e.preventDefault();
    const pos = parsePosition(localPosicoes[pagina] || "50% 50%");
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: pos.x,
      posY: pos.y,
    };
    setRepositioning(pagina);
  };

  // Handle mouse move during repositioning
  useEffect(() => {
    if (!repositioning) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !repositioning) return;

      const container = containerRefs.current[repositioning];
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      // Convert pixel movement to percentage (inverted because we're moving the image, not the viewport)
      const percentX = (deltaX / rect.width) * 100;
      const percentY = (deltaY / rect.height) * 100;

      // Calculate new position (subtract because dragging right should move image left)
      let newX = dragStartRef.current.posX - percentX;
      let newY = dragStartRef.current.posY - percentY;

      // Clamp values between 0 and 100
      newX = Math.max(0, Math.min(100, newX));
      newY = Math.max(0, Math.min(100, newY));

      setLocalPosicoes((prev) => ({
        ...prev,
        [repositioning]: `${newX.toFixed(1)}% ${newY.toFixed(1)}%`,
      }));
    };

    const handleMouseUp = () => {
      setRepositioning(null);
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [repositioning]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Capas das Páginas</h2>
        <p className="text-muted-foreground">
          Gerencie as imagens de fundo das páginas principais. Arraste para posicionar como capa do
          Facebook.
        </p>
      </div>

      <div className="grid gap-6">
        {PAGINAS.map((pagina) => {
          // Proteção extra: só renderiza <img> se a URL for string válida e começar com http ou data
          const url = localUrls[pagina.value];
          const isValidUrl =
            typeof url === "string" &&
            url.trim() &&
            (url.startsWith("http") || url.startsWith("data:"));
          if (url && !isValidUrl) {
            logger.warn(
              `[HeroImagesManager] URL inválida detectada para página ${pagina.value}:`,
              url
            );
          }
          return (
            <div
              key={pagina.value}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <h3 className="font-bold text-lg">{pagina.label}</h3>
                {isValidUrl && (
                  <span className="text-xs text-muted-foreground">
                    Posição: {localPosicoes[pagina.value]}
                  </span>
                )}
              </div>

              <div className="p-4 space-y-4">
                {/* Image Preview with Repositioning */}
                <div
                  ref={(el) => (containerRefs.current[pagina.value] = el)}
                  onDragOver={(e) => handleDragOver(e, pagina.value)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, pagina.value)}
                  className={`aspect-[21/9] rounded-lg overflow-hidden bg-muted relative border-2 transition-colors ${
                    draggingOver === pagina.value
                      ? "border-primary border-dashed bg-primary/5"
                      : repositioning === pagina.value
                        ? "border-primary"
                        : "border-transparent"
                  }`}
                >
                  {isValidUrl ? (
                    <>
                      <img
                        src={url}
                        alt={`Hero ${pagina.label}`}
                        className={`w-full h-full object-cover select-none ${repositioning === pagina.value ? "cursor-grabbing" : ""}`}
                        style={{ objectPosition: localPosicoes[pagina.value] }}
                        draggable={false}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          toast.error("Erro ao carregar imagem. URL inválida ou inacessível.");
                        }}
                      />

                      {/* Reposition Overlay */}
                      <div
                        onMouseDown={(e) => handleRepositionStart(e, pagina.value)}
                        className={`absolute inset-0 flex items-center justify-center transition-colors ${
                          repositioning === pagina.value
                            ? "bg-black/30 cursor-grabbing"
                            : "bg-black/0 hover:bg-black/20 cursor-grab"
                        }`}
                      >
                        <div
                          className={`flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 text-white text-sm font-medium transition-opacity ${repositioning === pagina.value ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                          style={{ opacity: repositioning === pagina.value ? 1 : undefined }}
                        >
                          <Move className="w-4 h-4" />
                          {repositioning === pagina.value
                            ? "Solte para confirmar"
                            : "Arraste para posicionar"}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity z-10"
                        style={{ opacity: repositioning ? 0 : undefined }}
                        onClick={() => setLocalUrls((prev) => ({ ...prev, [pagina.value]: "" }))}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(pagina.value, file);
                        }}
                        className="hidden"
                      />
                      {uploadingFor === pagina.value ? (
                        <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
                      ) : (
                        <>
                          <Image className="w-12 h-12 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {draggingOver === pagina.value
                              ? "Solte a imagem aqui"
                              : "Arraste uma imagem ou clique"}
                          </p>
                        </>
                      )}
                    </label>
                  )}
                </div>

                {/* URL Input */}
                <div className="space-y-2">
                  <Label>URL da Imagem</Label>
                  <div className="flex gap-2">
                    <Input
                      value={url || ""}
                      onChange={(e) =>
                        setLocalUrls((prev) => ({ ...prev, [pagina.value]: e.target.value }))
                      }
                      placeholder="Cole a URL da imagem..."
                      className="flex-1"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(pagina.value, file);
                        }}
                        className="hidden"
                      />
                      <Button type="button" variant="outline" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </span>
                      </Button>
                    </label>
                  </div>
                  {!isValidUrl && url && (
                    <div className="text-xs text-red-500 mt-1">
                      URL inválida para imagem. Só URLs http(s) ou data: são aceitas.
                    </div>
                  )}
                </div>

                {/* AI Generate */}
                <div className="space-y-2">
                  <Label>Gerar com IA</Label>
                  <div className="flex gap-2">
                    <Input
                      value={imagePrompts[pagina.value] || ""}
                      onChange={(e) =>
                        setImagePrompts((prev) => ({ ...prev, [pagina.value]: e.target.value }))
                      }
                      placeholder="Descreva a imagem que deseja gerar..."
                      className="flex-1"
                    />
                    <Button
                      variant="secondary"
                      onClick={() => handleGenerateImage(pagina.value)}
                      disabled={generatingFor === pagina.value}
                    >
                      {generatingFor === pagina.value ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Save Button */}
                <Button
                  onClick={() => handleSave(pagina.value)}
                  disabled={saving === pagina.value}
                  className="w-full"
                >
                  {saving === pagina.value ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper to decode base64
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
