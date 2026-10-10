import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface ProductSearchProps {
  onSearch: (filters: SearchFilters) => void;
}

export interface SearchFilters {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  sortBy?: "name" | "price_asc" | "price_desc" | "newest";
}

export function ProductSearch({ onSearch }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [size, setSize] = useState<string>("");
  const [sortBy, setSortBy] = useState<SearchFilters["sortBy"]>("newest");

  const handleSearch = () => {
    onSearch({
      query,
      category: category || undefined,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      size: size || undefined,
      sortBy,
    });
  };

  const handleClearFilters = () => {
    setQuery("");
    setCategory("");
    setPriceRange([0, 500]);
    setSize("");
    setSortBy("newest");
    onSearch({ query: "", sortBy: "newest" });
  };

  const hasActiveFilters = query || category || size || priceRange[0] > 0 || priceRange[1] < 500;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar produtos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>

        <Select value={sortBy} onValueChange={(value: string | number) => setSortBy(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Mais recentes</SelectItem>
            <SelectItem value="name">Nome (A-Z)</SelectItem>
            <SelectItem value="price_asc">Menor preço</SelectItem>
            <SelectItem value="price_desc">Maior preço</SelectItem>
          </SelectContent>
        </Select>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <SlidersHorizontal className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
              <SheetDescription>Refine sua busca com os filtros abaixo</SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-6">
              {/* Categoria */}
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="camisetas">Camisetas</SelectItem>
                    <SelectItem value="shorts">Shorts</SelectItem>
                    <SelectItem value="tenis">Tênis</SelectItem>
                    <SelectItem value="acessorios">Acessórios</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tamanho */}
              <div className="space-y-2">
                <Label>Tamanho</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tamanhos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="P">P</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="G">G</SelectItem>
                    <SelectItem value="GG">GG</SelectItem>
                    <SelectItem value="XGG">XGG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Faixa de Preço */}
              <div className="space-y-4">
                <Label>Faixa de Preço</Label>
                <div className="px-2">
                  <Slider
                    min={0}
                    max={500}
                    step={10}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>R$ {priceRange[0]}</span>
                  <span>R$ {priceRange[1]}</span>
                </div>
              </div>

              {/* Botões */}
              <div className="space-y-2 pt-4">
                <Button onClick={handleSearch} className="w-full">
                  Aplicar Filtros
                </Button>
                {hasActiveFilters && (
                  <Button onClick={handleClearFilters} variant="outline" className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Button onClick={handleSearch}>Buscar</Button>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filtros ativos:</span>
          {query && <span className="px-2 py-1 bg-primary/10 rounded-md">Busca: "{query}"</span>}
          {category && (
            <span className="px-2 py-1 bg-primary/10 rounded-md">Categoria: {category}</span>
          )}
          {size && <span className="px-2 py-1 bg-primary/10 rounded-md">Tamanho: {size}</span>}
          {(priceRange[0] > 0 || priceRange[1] < 500) && (
            <span className="px-2 py-1 bg-primary/10 rounded-md">
              R$ {priceRange[0]} - R$ {priceRange[1]}
            </span>
          )}
          <Button onClick={handleClearFilters} variant="ghost" size="sm" className="h-6 px-2">
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
