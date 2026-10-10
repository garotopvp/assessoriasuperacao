import { Helmet } from "react-helmet-async";
import { SITE_CONFIG } from "@/config/site";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  product?: {
    price?: number;
    currency?: string;
    availability?: "in stock" | "out of stock" | "preorder";
    brand?: string;
  };
}

export function SEO({
  title = SITE_CONFIG.name,
  description = SITE_CONFIG.description,
  keywords = "corrida, running, treino, maratona, consultoria, corrida de rua, atleta",
  image = "/images/og-image.jpg",
  url = window.location.href,
  type = "website",
  article,
  product,
}: SEOProps) {
  const fullTitle = title === SITE_CONFIG.name ? title : `${title} | ${SITE_CONFIG.name}`;
  const fullImageUrl = image.startsWith("http") ? image : `${window.location.origin}${image}`;
  const canonicalUrl = url.split("?")[0]; // Remove query params

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:site_name" content={SITE_CONFIG.name} />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Article Specific Tags */}
      {type === "article" && article && (
        <>
          {article.publishedTime && (
            <meta property="article:published_time" content={article.publishedTime} />
          )}
          {article.modifiedTime && (
            <meta property="article:modified_time" content={article.modifiedTime} />
          )}
          {article.author && <meta property="article:author" content={article.author} />}
          {article.section && <meta property="article:section" content={article.section} />}
          {article.tags?.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Product Specific Tags */}
      {type === "product" && product && (
        <>
          <meta property="product:price:amount" content={product.price?.toString()} />
          <meta property="product:price:currency" content={product.currency || "BRL"} />
          {product.availability && (
            <meta property="product:availability" content={product.availability} />
          )}
          {product.brand && <meta property="product:brand" content={product.brand} />}
        </>
      )}

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === "product" ? "Product" : "WebSite",
          name: fullTitle,
          description,
          url,
          ...(type === "product" &&
            product && {
              offers: {
                "@type": "Offer",
                price: product.price,
                priceCurrency: product.currency || "BRL",
                availability:
                  product.availability === "in stock"
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
              },
              brand: {
                "@type": "Brand",
                name: product.brand || SITE_CONFIG.name,
              },
            }),
        })}
      </script>
    </Helmet>
  );
}
