import { useState } from "react";
import { Plus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { WeeklyFeedbackForm } from "@/components/treinos/WeeklyFeedbackForm";
import { FeedbackList } from "@/components/treinos/FeedbackList";
import { Separator } from "@/components/ui/separator";

export default function FeedbackSemanal() {
  const [open, setOpen] = useState(false);

  return (
    <div className="container max-w-4xl py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            FEEDBACK SEMANAL
          </h1>
          <p className="text-muted-foreground mt-1">
            Compartilhe como foi sua semana de treinos para ajustarmos sua planilha.
          </p>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="lg" className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all">
              <Plus className="mr-2 h-5 w-5" />
              Enviar Novo Feedback
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto sm:max-w-xl w-full">
            <SheetHeader className="mb-6">
              <SheetTitle className="text-2xl font-bold text-primary">Novo Feedback</SheetTitle>
              <SheetDescription>
                Responda com honestidade para que possamos evoluir juntos!
              </SheetDescription>
            </SheetHeader>
            <WeeklyFeedbackForm onSuccess={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <Separator />

      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Histórico de Feedbacks</h2>
        <FeedbackList />
      </section>
    </div>
  );
}
