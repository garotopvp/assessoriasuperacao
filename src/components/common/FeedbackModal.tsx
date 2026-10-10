import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function FeedbackModal() {
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState("Geral");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkFeedbackEligibility = async () => {
      // Avoid showing if explicitly dismissed in this session
      if (sessionStorage.getItem("feedback_dismissed")) return;

      try {
        // Check last feedback
        const { data, error } = await supabase
          .from("feedbacks")
          .select("created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error checking feedback:", error);
          return;
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

        // Show if no feedback or last feedback > 30 days ago
        if (!data || new Date(data.created_at) < thirtyDaysAgo) {
          // Add a small delay so it doesn't pop up immediately on load
          setTimeout(() => setIsOpen(true), 2000);
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkFeedbackEligibility();
  }, [user]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Por favor, selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("feedbacks").insert({
        user_id: user!.id,
        rating,
        comment: comment.trim() || null,
        category,
        status: "pendente",
      });

      if (error) throw error;

      toast.success("Obrigado pelo seu feedback!");
      setIsOpen(false);

      // Save submission date to prevent spam
      localStorage.setItem("feedback_submitted", new Date().toISOString());
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Erro ao enviar feedback. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem("feedback_dismissed", "true");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Como está sua experiência?
          </DialogTitle>
          <DialogDescription className="text-center">
            Sua opinião é fundamental para evoluirmos a assessoria.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-all hover:scale-110 focus:outline-none"
                onClick={() => setRating(star)}
                onMouseEnter={() => setRating(star)}
                aria-label={`Avaliar com ${star} estrelas`}
              >
                <Star
                  className={cn(
                    "w-8 h-8 transition-colors",
                    star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {rating === 1 && "Muito Insatisfeito"}
            {rating === 2 && "Insatisfeito"}
            {rating === 3 && "Neutro"}
            {rating === 4 && "Satisfeito"}
            {rating === 5 && "Muito Satisfeito!"}
            {rating === 0 && "Selecione uma nota"}
          </p>

          <div className="w-full space-y-2">
            <Label>Sobre o que você quer falar?</Label>
            <Select onValueChange={setCategory} defaultValue={category}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um assunto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Geral">Geral</SelectItem>
                <SelectItem value="Plataforma">Plataforma / App</SelectItem>
                <SelectItem value="Treinos">Treinos e Planilhas</SelectItem>
                <SelectItem value="Suporte">Atendimento / Suporte</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder="Conte mais sobre sua experiência (opcional)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full min-h-[100px]"
          />

          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={handleDismiss}>
              Agora não
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
