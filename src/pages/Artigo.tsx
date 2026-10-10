import { useParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar,
  Share2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getArtigoById,
  getArtigosRelacionados,
  getNextArtigo,
  getPreviousArtigo,
} from "@/data/artigos";
import { useEffect, useState } from "react";

export default function Artigo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [readProgress, setReadProgress] = useState(0);

  const artigo = id ? getArtigoById(id) : undefined;
  const artigosRelacionados = id ? getArtigosRelacionados(id, 3) : [];
  const nextArtigo = id ? getNextArtigo(id) : undefined;
  const prevArtigo = id ? getPreviousArtigo(id) : undefined;

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadProgress(Math.min(progress, 100));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!artigo) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
          <p className="text-muted-foreground mb-8">
            O artigo que você está procurando não existe ou foi removido.
          </p>
          <Button onClick={() => navigate("/conhecimento")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Conhecimento
          </Button>
        </div>
      </Layout>
    );
  }

  // Parse inline markdown (bold text)
  const parseInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Parse markdown-like content to HTML
  const parseContent = (content: string) => {
    return content.split("\n").map((line, index) => {
      // Headers
      if (line.startsWith("## ")) {
        return (
          <h2 key={index} className="text-2xl font-bold mt-10 mb-4">
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h3 key={index} className="text-xl font-semibold mt-8 mb-3">
            {line.replace("### ", "")}
          </h3>
        );
      }
      // List items
      if (line.startsWith("- ")) {
        return (
          <li key={index} className="ml-6 mb-1 list-disc text-muted-foreground">
            {parseInlineMarkdown(line.replace("- ", ""))}
          </li>
        );
      }
      // Numbered list
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={index} className="ml-6 mb-1 list-decimal text-muted-foreground">
            {parseInlineMarkdown(line.replace(/^\d+\.\s/, ""))}
          </li>
        );
      }
      // Empty lines
      if (line.trim() === "") {
        return <div key={index} className="h-2" />;
      }
      // Regular paragraphs (with inline bold support)
      return (
        <p key={index} className="text-muted-foreground leading-relaxed mb-4">
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  };

  return (
    <Layout>
      {/* Reading Progress Bar */}
      <div className="fixed top-16 left-0 right-0 h-1 bg-muted z-50">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Back Navigation */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-16 z-40">
        <div className="container py-3">
          <Link
            to="/conhecimento"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Conhecimento
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <article>
        <header className="py-12 bg-gradient-to-b from-muted to-background">
          <div className="container max-w-4xl">
            <span className="inline-block text-sm font-bold text-primary uppercase tracking-wide mb-4">
              {artigo.tag}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 leading-tight">
              {artigo.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">{artigo.description}</p>

            {/* Author and Meta */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <img
                  src={artigo.authorAvatar}
                  alt={artigo.author}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium">{artigo.author}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {artigo.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {artigo.readTime} de leitura
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="container max-w-5xl mb-12">
          <div className="aspect-[21/9] rounded-2xl overflow-hidden">
            <img src={artigo.image} alt={artigo.title} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Article Content */}
        <div className="container max-w-3xl pb-16">
          <div className="prose prose-lg max-w-none">{parseContent(artigo.content)}</div>

          {/* Tags / Share */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tags:</span>
                <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
                  {artigo.tag}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Compartilhar:</span>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation between articles */}
          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            {prevArtigo ? (
              <Link
                to={`/conhecimento/${prevArtigo.id}`}
                className="group p-4 border border-border rounded-xl hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <ChevronLeft className="w-4 h-4" />
                  Artigo anterior
                </div>
                <p className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                  {prevArtigo.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
            {nextArtigo && (
              <Link
                to={`/conhecimento/${nextArtigo.id}`}
                className="group p-4 border border-border rounded-xl hover:border-primary transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground mb-2">
                  Próximo artigo
                  <ChevronRight className="w-4 h-4" />
                </div>
                <p className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                  {nextArtigo.title}
                </p>
              </Link>
            )}
          </div>
        </div>
      </article>

      {/* Related Articles */}
      {artigosRelacionados.length > 0 && (
        <section className="py-16 bg-muted">
          <div className="container">
            <h2 className="text-2xl font-bold mb-8">Artigos Relacionados</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {artigosRelacionados.map((relacionado) => (
                <Link
                  key={relacionado.id}
                  to={`/conhecimento/${relacionado.id}`}
                  className="bg-background border border-border rounded-xl overflow-hidden group hover:border-primary transition-colors"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={relacionado.image}
                      alt={relacionado.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-bold text-primary uppercase tracking-wide">
                      {relacionado.tag}
                    </span>
                    <h3 className="font-bold mt-2 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {relacionado.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {relacionado.readTime}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-4">QUER MAIS CONTEÚDO?</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-6">
            Explore nossa base completa de conhecimento ou assine nossa newsletter.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="secondary" size="lg" onClick={() => navigate("/conhecimento")}>
              Ver todos os artigos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
