import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

/**
 * Componente de imagem otimizado com lazy loading, WebP e placeholder
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(priority ? src : "");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!priority && src) {
      // Lazy load image
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
        setImageLoaded(true);
      };
      img.onerror = () => {
        setError(true);
        setImageSrc("/images/placeholder.jpg");
      };
    } else if (priority) {
      setImageLoaded(true);
    }
  }, [src, priority]);

  // Gera URLs para diferentes formatos
  const getImageSources = () => {
    if (!src) return { webp: "", jpg: "" };

    const baseSrc = src.replace(/\.(jpg|jpeg|png)$/, "");
    return {
      webp: `${baseSrc}.webp`,
      jpg: src,
    };
  };

  const sources = getImageSources();

  if (error) {
    return (
      <div
        className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}
        style={{ width, height }}
      >
        <span className="text-sm">Imagem não disponível</span>
      </div>
    );
  }

  return (
    <picture className={cn("block", className)}>
      {/* WebP format for modern browsers */}
      <source srcSet={sources.webp} type="image/webp" />

      {/* Fallback to JPEG/PNG */}
      <img
        src={imageSrc || "/images/placeholder.jpg"}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        className={cn(
          "transition-opacity duration-300",
          imageLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setError(true);
          setImageSrc("/images/placeholder.jpg");
        }}
        {...props}
      />

      {/* Skeleton placeholder while loading */}
      {!imageLoaded && !error && (
        <div className="absolute inset-0 bg-muted animate-pulse" style={{ width, height }} />
      )}
    </picture>
  );
}

/**
 * Hook para gerar srcset responsivo
 */
export function useResponsiveImage(src: string, sizes: number[] = [320, 640, 1024, 1920]) {
  const generateSrcSet = () => {
    return sizes
      .map((size) => {
        const baseSrc = src.replace(/\.(jpg|jpeg|png)$/, "");
        return `${baseSrc}-${size}w.$1 ${size}w`;
      })
      .join(", ");
  };

  return {
    srcSet: generateSrcSet(),
    sizes: sizes
      .map((size, index) => {
        if (index === sizes.length - 1) return `${size}px`;
        return `(max-width: ${size}px) ${size}px`;
      })
      .join(", "),
  };
}
