import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  X,
  Upload,
  Monitor,
  Clock,
  Calendar,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Artigo {
  id: string;
  slug: string;
  tag: string;
  title: string;
  description: string | null;
  content: string | null;
  image: string | null;
  author: string;
  read_time: string;
  ativo: boolean;
  ordem: number;
}

const TAGS = ["TREINO", "EQUIPAMENTO", "PERFORMANCE", "NUTRIÇÃO", "RECUPERAÇÃO", "MENTALIDADE"];

export function ArtigosManager() {
  const [artigos, setArtigos] = useState<Artigo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingArtigo, setEditingArtigo] = useState<Artigo | null>(null);
  const [deleteArtigo, setDeleteArtigo] = useState<Artigo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    slug: "",
    tag: "TREINO",
    title: "",
    description: "",
    content: "",
    image: "",
    author: "Equipe Superação",
    read_time: "5 min",
    ativo: true,
    ordem: 0,
  });

  useEffect(() => {
    fetchArtigos();
  }, []);

  const fetchArtigos = async () => {
    try {
      const { data, error } = (await supabase
        .from("artigos" as any)
        .select("*")
        .order("ordem", { ascending: true })) as any;

      if (error) throw error;
      setArtigos((data as Artigo[]) || []);
    } catch (err) {
      logger.error("Error fetching artigos:", err);
      toast.error("Erro ao carregar artigos");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      slug: "",
      tag: "TREINO",
      title: "",
      description: "",
      content: "",
      image: "",
      author: "Equipe Superação",
      read_time: "5 min",
      ativo: true,
      ordem: 0,
    });
    setEditingArtigo(null);
    setImagePrompt("");
  };

  const openForm = (artigo?: Artigo) => {
    if (artigo) {
      setEditingArtigo(artigo);
      setFormData({
        slug: artigo.slug,
        tag: artigo.tag,
        title: artigo.title,
        description: artigo.description || "",
        content: artigo.content || "",
        image: artigo.image || "",
        author: artigo.author,
        read_time: artigo.read_time,
        ativo: artigo.ativo,
        ordem: artigo.ordem,
      });
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error("Digite uma descrição para a imagem");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const response = await supabase.functions.invoke("generate-image", {
        body: { prompt: imagePrompt, type: "article" },
      });

      if (response.error) throw response.error;

      const { imageUrl } = response.data;
      if (imageUrl) {
        // Upload base64 to storage
        const base64Data = imageUrl.split(",")[1];
        const fileName = `artigo-${Date.now()}.png`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("artigos")
          .upload(fileName, decode(base64Data), {
            contentType: "image/png",
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("artigos").getPublicUrl(fileName);

        setFormData((prev) => ({ ...prev, image: urlData.publicUrl }));
        toast.success("Imagem gerada com sucesso!");
      }
    } catch (err: unknown) {
      logger.error("Error generating image:", err);
      toast.error(err.message || "Erro ao gerar imagem");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);

    try {
      const fileName = `artigo-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("artigos").upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("artigos").getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, image: urlData.publicUrl }));
      toast.success("Imagem enviada!");
    } catch (err: unknown) {
      logger.error("Error uploading image:", err);
      toast.error(err.message || "Erro ao enviar imagem");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file);
    } else {
      toast.error("Por favor, arraste apenas arquivos de imagem");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingArtigo) {
        const { error } = await supabase
          .from("artigos" as any)
          .update({
            slug: formData.slug,
            tag: formData.tag,
            title: formData.title,
            description: formData.description || null,
            content: formData.content || null,
            image: formData.image || null,
            author: formData.author,
            read_time: formData.read_time,
            ativo: formData.ativo,
            ordem: formData.ordem,
          })
          .eq("id", editingArtigo.id);

        if (error) throw error;
        toast.success("Artigo atualizado!");
      } else {
        const { error } = await supabase.from("artigos" as any).insert({
          slug: formData.slug,
          tag: formData.tag,
          title: formData.title,
          description: formData.description || null,
          content: formData.content || null,
          image: formData.image || null,
          author: formData.author,
          read_time: formData.read_time,
          ativo: formData.ativo,
          ordem: formData.ordem,
        });

        if (error) throw error;
        toast.success("Artigo criado!");
      }

      setShowForm(false);
      resetForm();
      fetchArtigos();
    } catch (err: unknown) {
      logger.error("Error saving artigo:", err);
      toast.error(err.message || "Erro ao salvar artigo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteArtigo) return;

    try {
      const { error } = await supabase
        .from("artigos" as any)
        .delete()
        .eq("id", deleteArtigo.id);

      if (error) throw error;
      toast.success("Artigo excluído!");
      setDeleteArtigo(null);
      fetchArtigos();
    } catch (err: unknown) {
      logger.error("Error deleting artigo:", err);
      toast.error(err.message || "Erro ao excluir artigo");
    }
  };

  const handleToggleActive = async (artigo: Artigo) => {
    try {
      const { error } = await supabase
        .from("artigos" as any)
        .update({ ativo: !artigo.ativo })
        .eq("id", artigo.id);

      if (error) throw error;
      toast.success(artigo.ativo ? "Artigo desativado" : "Artigo ativado");
      fetchArtigos();
    } catch (err) {
      logger.error("Error toggling artigo:", err);
      toast.error("Erro ao atualizar artigo");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Parse inline markdown for preview
  const parseInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  // Parse markdown content for preview
  const parseContentPreview = (content: string) => {
    return content.split("\n").map((line, index) => {
      if (line.startsWith("## ")) {
        return (
          <h2 key={index} className="text-xl font-bold mt-8 mb-3 text-foreground">
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h3 key={index} className="text-lg font-semibold mt-6 mb-2 text-foreground">
            {line.replace("### ", "")}
          </h3>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <li key={index} className="ml-6 mb-1 list-disc text-muted-foreground">
            {parseInlineMarkdown(line.replace("- ", ""))}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={index} className="ml-6 mb-1 list-decimal text-muted-foreground">
            {parseInlineMarkdown(line.replace(/^\d+\.\s/, ""))}
          </li>
        );
      }
      if (line.trim() === "") {
        return <div key={index} className="h-2" />;
      }
      return (
        <p key={index} className="text-muted-foreground leading-relaxed mb-3">
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  };

  return (
    <div>
      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card rounded-2xl w-full max-w-6xl my-4">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingArtigo ? "Editar Artigo" : "Novo Artigo"}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <Tabs defaultValue="edit" className="w-full">
              <div className="px-6 pt-4">
                <TabsList className="grid w-full grid-cols-2 max-w-xs">
                  <TabsTrigger value="edit" className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Editar
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-2">
                    <Monitor className="w-4 h-4" />
                    Prévia
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="edit" className="mt-0">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug *</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tag">Categoria</Label>
                      <Select
                        value={formData.tag}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, tag: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TAGS.map((tag) => (
                            <SelectItem key={tag} value={tag}>
                              {tag}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author">Autor</Label>
                      <Input
                        id="author"
                        value={formData.author}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, author: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="read_time">Tempo de leitura</Label>
                      <Input
                        id="read_time"
                        value={formData.read_time}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, read_time: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Conteúdo (Markdown)</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, content: e.target.value }))
                      }
                      rows={10}
                      placeholder="## Título&#10;&#10;Parágrafo...&#10;&#10;### Subtítulo&#10;&#10;- Item 1&#10;- Item 2"
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Image Section */}
                  <div className="space-y-4">
                    <Label>Imagem de Capa</Label>

                    {/* Drag & Drop Zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative rounded-lg border-2 border-dashed transition-colors ${
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      } ${formData.image ? "" : "aspect-video"}`}
                    >
                      {formData.image ? (
                        <div className="relative aspect-video">
                          <img
                            src={formData.image}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => setFormData((prev) => ({ ...prev, image: "" }))}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full min-h-[150px] cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileInputChange}
                            className="hidden"
                          />
                          {isUploading ? (
                            <Loader2 className="w-10 h-10 text-muted-foreground animate-spin mb-2" />
                          ) : (
                            <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                          )}
                          <p className="text-sm text-muted-foreground text-center px-4">
                            {isDragging
                              ? "Solte a imagem aqui"
                              : "Arraste uma imagem ou clique para selecionar"}
                          </p>
                        </label>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={formData.image}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, image: e.target.value }))
                        }
                        placeholder="Ou cole a URL da imagem"
                        className="flex-1"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="Descreva a imagem para gerar com IA..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage}
                      >
                        {isGeneratingImage ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4 mr-2" />
                        )}
                        Gerar com IA
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, ativo: checked }))
                      }
                    />
                    <Label htmlFor="ativo">Artigo ativo</Label>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingArtigo ? "Salvar" : "Criar"}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <div className="bg-background rounded-b-2xl">
                  {/* Preview Header */}
                  <header className="py-8 bg-gradient-to-b from-muted to-background">
                    <div className="px-8 max-w-4xl mx-auto">
                      <span className="inline-block text-sm font-bold text-primary uppercase tracking-wide mb-4">
                        {formData.tag}
                      </span>
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-4 leading-tight text-foreground">
                        {formData.title || "Título do Artigo"}
                      </h1>
                      <p className="text-base text-muted-foreground mb-6 max-w-2xl">
                        {formData.description || "Descrição do artigo..."}
                      </p>

                      {/* Author and Meta */}
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold text-sm">
                              {formData.author?.charAt(0) || "A"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{formData.author || "Autor"}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date().toLocaleDateString("pt-BR", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formData.read_time || "5 min"} de leitura
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </header>

                  {/* Featured Image */}
                  <div className="px-8 max-w-5xl mx-auto mb-8">
                    <div className="aspect-[21/9] rounded-xl overflow-hidden bg-muted">
                      {formData.image ? (
                        <img
                          src={formData.image}
                          alt={formData.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Article Content Preview */}
                  <div className="px-8 max-w-3xl mx-auto pb-8">
                    <div className="prose prose-lg max-w-none">
                      {formData.content ? (
                        parseContentPreview(formData.content)
                      ) : (
                        <p className="text-muted-foreground italic">
                          O conteúdo do artigo aparecerá aqui...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Artigos</h2>
          <p className="text-muted-foreground">
            {artigos.length} artigo{artigos.length !== 1 ? "s" : ""} cadastrado
            {artigos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => openForm()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Artigo
        </Button>
      </div>

      {/* List */}
      {artigos.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum artigo cadastrado</h3>
          <p className="text-muted-foreground mb-4">Comece criando seu primeiro artigo</p>
          <Button onClick={() => openForm()}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Artigo
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {artigos.map((artigo) => (
            <div
              key={artigo.id}
              className={`bg-card rounded-xl border border-border p-4 flex items-center gap-4 transition-opacity ${
                !artigo.ativo ? "opacity-60" : ""
              }`}
            >
              <div className="w-20 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {artigo.image ? (
                  <img
                    src={artigo.image}
                    alt={artigo.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-primary">{artigo.tag}</span>
                  {!artigo.ativo && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">Inativo</span>
                  )}
                </div>
                <h3 className="font-medium truncate">{artigo.title}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {artigo.author} • {artigo.read_time}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleActive(artigo)}
                  title={artigo.ativo ? "Desativar" : "Ativar"}
                >
                  {artigo.ativo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openForm(artigo)} title="Editar">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteArtigo(artigo)}
                  title="Excluir"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteArtigo} onOpenChange={() => setDeleteArtigo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Artigo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteArtigo?.title}"? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
