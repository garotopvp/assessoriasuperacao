import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy, Check, TicketPercent, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface Partner {
  id: string;
  name: string;
  description: string;
  category: string;
  discount: string;
  code?: string;
  url?: string;
  image_url?: string;
  active: boolean;
}

const ALL_CATEGORY = "Todos";

export default function Clube() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([ALL_CATEGORY]);
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("active", true)
        .order("position", { ascending: true });

      if (error) throw error;

      const partnersData = data || [];
      setPartners(partnersData);

      // Extract unique categories
      const uniqueCats = Array.from(new Set(partnersData.map((p) => p.category))).sort();
      setCategories([ALL_CATEGORY, ...uniqueCats]);
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast.error("Erro ao carregar benefícios do clube.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Cupom copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPartners =
    activeCategory === ALL_CATEGORY
      ? partners
      : partners.filter((p) => p.category === activeCategory);

  return (
    <Layout>
      <div className="bg-black min-h-screen pb-20">
        <section className="relative py-24 bg-black overflow-hidden border-b border-white/10 mb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-neutral-900/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <div className="container relative z-10 text-center px-4">
            <div className="mb-6 flex justify-center">
              <Button
                variant="ghost"
                className="gap-2 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </div>
            
            <span className="text-primary font-heading uppercase tracking-[0.2em] mb-4 block">
              VANTAGENS EXCLUSIVAS
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-8xl font-heading mb-6 tracking-tight text-white uppercase">
              Clube de <span className="text-primary">Benefícios</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-400 font-light max-w-2xl mx-auto">
              Descontos exclusivos em grandes marcas e serviços parceiros do Superação Assessoria. 
              Aproveite as vantagens de ser membro!
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="flex flex-col h-full bg-white/5 border-white/10">
                  <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2 bg-white/10" />
                    <Skeleton className="h-8 w-48 bg-white/10" />
                  </CardHeader>
                  <CardContent className="flex-1">
                    <Skeleton className="h-24 w-full rounded-md bg-white/10" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Tabs defaultValue={ALL_CATEGORY} className="mb-8" onValueChange={setActiveCategory}>
              <div className="flex justify-center mb-8 overflow-x-auto pb-2">
                <TabsList className="bg-white/5 border border-white/10 p-1">
                  {categories.map((cat) => (
                    <TabsTrigger 
                      key={cat} 
                      value={cat}
                      className="data-[state=active]:bg-primary data-[state=active]:text-black text-neutral-400 hover:text-white transition-colors"
                    >
                      {cat}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value={activeCategory} className="mt-0">
                {filteredPartners.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
                    <TicketPercent className="w-16 h-16 mx-auto text-neutral-500 opacity-50 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      Nenhum parceiro encontrado nesta categoria.
                    </h3>
                    <p className="text-neutral-400">Tente outra categoria ou volte mais tarde.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPartners.map((partner) => (
                      <Card
                        key={partner.id}
                        className="flex flex-col h-full bg-white/5 border-white/10 hover:border-accent/50 transition-colors shadow-none"
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start mb-2">
                            <Badge
                              variant="outline"
                              className="bg-primary/10 border-primary/20 text-primary font-bold"
                            >
                              {partner.category}
                            </Badge>
                            <div className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-bold px-3 py-1 rounded-sm uppercase tracking-wider">
                              {partner.discount}
                            </div>
                          </div>
                          <CardTitle className="text-xl text-white font-heading tracking-widest uppercase">{partner.name}</CardTitle>
                          <CardDescription className="line-clamp-2 h-10 mt-2 text-neutral-400">
                            {partner.description}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="flex-1 flex flex-col justify-end pt-4">
                          {partner.code ? (
                            <div className="bg-black p-4 rounded-sm border border-dashed border-primary/30 flex items-center justify-between group relative overflow-hidden">
                              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <code className="text-lg font-mono font-bold tracking-wider text-primary relative z-10">
                                {partner.code}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 hover:bg-white/5 text-neutral-400 hover:text-white relative z-10"
                                onClick={() => copyToClipboard(partner.code!, partner.id)}
                              >
                                {copiedId === partner.id ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                                <span className="sr-only">Copiar</span>
                              </Button>
                            </div>
                          ) : (
                            <div className="bg-black p-4 rounded-sm text-center text-sm font-semibold text-neutral-400 border border-white/5">
                              Desconto aplicado automaticamente
                            </div>
                          )}
                        </CardContent>

                        <CardFooter>
                          {partner.url ? (
                            <Button className="w-full gap-2 bg-primary hover:bg-primary/90 text-black font-heading tracking-wider rounded-sm uppercase" asChild>
                              <a href={partner.url} target="_blank" rel="noopener noreferrer">
                                Acessar Benefício <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          ) : (
                            <Button className="w-full gap-2 rounded-sm font-heading uppercase" disabled variant="outline">
                              Site Indisponível
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </Layout>
  );
}
