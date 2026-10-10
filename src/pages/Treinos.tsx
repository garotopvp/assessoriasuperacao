import { useState } from "react";
import { Plus } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { WorkoutForm } from "@/components/treinos/WorkoutForm";
import { WorkoutList } from "@/components/treinos/WorkoutList";

export default function Treinos() {
  const [open, setOpen] = useState(false);

  return (
    <Layout>
      <div className="container py-8 max-w-5xl min-h-[80vh]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">DIÁRIO DE TREINOS</h1>
            <p className="text-sm text-muted-foreground max-w-lg">
              Mantenha o histórico dos seus treinos atualizado para que nossos treinadores possam
              acompanhar sua evolução.
            </p>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                size="lg"
                className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="mr-2 h-5 w-5" />
                Registrar Treino
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-bold">Novo Registro</SheetTitle>
                <SheetDescription>Detalhe como foi seu treino de hoje.</SheetDescription>
              </SheetHeader>
              <WorkoutForm onSuccess={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="bg-background/50 rounded-lg">
          <WorkoutList />
        </div>
      </div>
    </Layout>
  );
}
