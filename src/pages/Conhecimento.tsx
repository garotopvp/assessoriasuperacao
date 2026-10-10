import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Clock, User, ArrowRight, Dumbbell, Loader2 } from "lucide-react";
import { artigos } from "@/data/artigos";
import { useHeroImage } from "@/hooks/useHeroImage";
import { SEO } from "@/components/common/SEO";

const allTags = [
  "Todos",
  "Treino",
  "Equipamento",
  "Performance",
  "Nutrição",
  "Recuperação",
  "Mentalidade",
];

export default function Conhecimento() {
  const { heroImage } = useHeroImage("conhecimento");
  const [activeTag, setActiveTag] = useState("Todos");
  const [visibleCount, setVisibleCount] = useState(6);
  const [loadingMore, setLoadingMore] = useState(false);

  const categorias = useMemo(() => {
    return allTags.map((tag) => ({
      name: tag,
      count:
        tag === "Todos"
          ? artigos.length
          : artigos.filter((a) => a.tag.toUpperCase() === tag.toUpperCase()).length,
      active: tag === activeTag,
    }));
  }, [activeTag]);

  const filteredArtigos = useMemo(() => {
    if (activeTag === "Todos") return artigos;
    return artigos.filter((a) => a.tag.toUpperCase() === activeTag.toUpperCase());
  }, [activeTag]);

  const visibleArtigos = useMemo(() => {
    return filteredArtigos.slice(0, visibleCount);
  }, [filteredArtigos, visibleCount]);

  const hasMore = visibleCount < filteredArtigos.length;

  const handleTagClick = (tag: string) => {
    setActiveTag(tag);
    setVisibleCount(6); // Reset quando muda o filtro
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    // Simula um pequeno delay para feedback visual
    setTimeout(() => {
      setVisibleCount((prev) => prev + 6);
      setLoadingMore(false);
    }, 300);
  };

  const featuredArticle = filteredArtigos[0];
  const gridArtigos = visibleArtigos.slice(1);

  return (
    <>
      <SEO
        title="Conhecimento - Superação Assessoria"
        description="Artigos sobre treinamento, equipamento, performance, nutrição e mentalidade na corrida. Aprenda com os especialistas."
        keywords="artigos corrida, treino running, nutrição atleta, performance corrida"
      />
      <Layout>
        {/* Hero Section */}
        <section
          className="relative py-20 overflow-hidden bg-dynamic bg-cover"
          style={
            {
              "--bg-image": `url('${heroImage.url}')`,
              "--bg-position": heroImage.posicao,
            } as React.CSSProperties
          }
        >
          <div className="absolute inset-0 bg-obsidian/90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.15),transparent_50%)]" />
          <div className="container relative">
            <div className="max-w-3xl">
              <span className="inline-block text-sm font-bold text-primary tracking-wider uppercase mb-4">
                BASE DE CONHECIMENTO
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight text-white">
                CONHECIMENTO <br />
                <span className="text-white">QUE TRANSFORMA</span>
              </h1>
              <p className="text-lg text-white/70 max-w-xl">
                Artigos, guias e insights baseados em ciência para elevar sua performance. Conteúdo
                exclusivo desenvolvido por nossa equipe de especialistas.
              </p>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="border-b border-border sticky top-16 bg-background/95 backdrop-blur-sm z-40">
          <div className="container">
            <div className="flex items-center gap-1 overflow-x-auto py-4 scrollbar-hide">
              {categorias.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => handleTagClick(cat.name)}
                  className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                    cat.active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat.name}
                  <span className="ml-1.5 text-xs opacity-70">({cat.count})</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Article */}
        {featuredArticle && (
          <section className="py-12 bg-background">
            <div className="container">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl">
                  <img
                    src={featuredArticle.image}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="lg:pl-8">
                  <span className="inline-flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wide mb-4">
                    <Dumbbell className="w-4 h-4" />
                    {featuredArticle.tag} • Destaque
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    {featuredArticle.title}
                  </h2>
                  <p className="text-muted-foreground text-lg mb-6">
                    {featuredArticle.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      {featuredArticle.author}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {featuredArticle.readTime} de leitura
                    </span>
                  </div>
                  <Link
                    to={`/conhecimento/${featuredArticle.id}`}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Ler artigo completo
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Articles Grid */}
        <section className="py-16 bg-muted">
          <div className="container">
            <h2 className="text-2xl font-bold mb-8">Artigos Recentes</h2>

            {gridArtigos.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gridArtigos.map((artigo) => (
                  <Link
                    key={artigo.id}
                    to={`/conhecimento/${artigo.id}`}
                    className="bg-background border border-border rounded-xl overflow-hidden group hover:border-primary transition-colors"
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={artigo.image}
                        alt={artigo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wide mb-3">
                        {artigo.tag}
                      </span>
                      <h3 className="text-lg font-bold mb-2 leading-snug group-hover:text-primary transition-colors">
                        {artigo.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {artigo.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{artigo.author}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {artigo.readTime}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhum artigo encontrado para esta categoria.
                </p>
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 border border-border rounded-lg font-semibold hover:bg-background transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    "Carregar mais artigos"
                  )}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-4">RECEBA CONTEÚDO EXCLUSIVO</h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Cadastre-se para receber dicas semanais, novos artigos e ofertas exclusivas
              diretamente no seu email.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Seu melhor email"
                className="flex-1 px-4 py-3 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-background text-foreground font-semibold rounded-lg hover:bg-background/90 transition-colors"
              >
                Inscrever-se
              </button>
            </form>
          </div>
        </section>
      </Layout>
    </>
  );
}
