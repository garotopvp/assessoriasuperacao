import { logger } from "@/lib/logger";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { GraduationCap, Plus, Trash2, Shield, UserCheck, AlertTriangle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

interface TeacherProfile {
  user_id: string;
  email: string;
  nome_completo: string | null;
  created_at: string;
}

export function TeachersManager() {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      // First get IDs from user_roles where role is 'teacher'
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "teacher");

      if (roleError) throw roleError;

      if (!roleData || roleData.length === 0) {
        setTeachers([]);
        return;
      }

      const userIds = roleData.map((r) => r.user_id);

      // Then get profile details
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, nome_completo, created_at")
        .in("user_id", userIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTeachers(data || []);
    } catch (err) {
      logger.error("Error fetching teachers:", err);
      toast.error("Erro ao carregar professores");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherEmail.trim()) return;

    setIsAdding(true);
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, email")
        .eq("email", newTeacherEmail.trim())
        .single();

      if (profileError || !profile) {
        toast.error("Usuário não encontrado. Peça para ele criar uma conta no site primeiro.");
        return;
      }

      // Add to user_roles table
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ user_id: profile.user_id, role: "teacher" });

      if (roleError) throw roleError;

      toast.success("Professor adicionado com sucesso!");
      setNewTeacherEmail("");
      fetchTeachers();
    } catch (err: any) {
      logger.error("Error adding teacher:", err);
      toast.error(err.message || "Erro ao adicionar professor");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveTeacher = async () => {
    if (!deleteId) return;

    try {
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", deleteId)
        .eq("role", "teacher");

      if (roleError) throw roleError;

      toast.success("Privilégios de professor removidos.");
      fetchTeachers();
    } catch (err: any) {
      logger.error("Error removing teacher:", err);
      toast.error("Erro ao remover privilégios");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Professores</h2>
          <p className="text-muted-foreground">
            Gerencie os professores que têm acesso ao portal do professor.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-orange-600" />
          Adicionar Novo Professor
        </h3>
        <form onSubmit={handleAddTeacher} className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Input
              placeholder="email.do.professor@exemplo.com"
              type="email"
              value={newTeacherEmail}
              onChange={(e) => setNewTeacherEmail(e.target.value)}
              required
              className="bg-slate-50/50"
            />
            <p className="text-xs text-muted-foreground">
              * O professor já deve ter uma conta no site.
            </p>
          </div>
          <Button type="submit" disabled={isAdding} className="bg-orange-600 hover:bg-orange-700">
            {isAdding ? "Adicionando..." : "Adicionar Professor"}
          </Button>
        </form>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-sm text-muted-foreground">Carregando professores...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 border border-dashed rounded-xl ">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum professor cadastrado ainda.</p>
          </div>
        ) : (
          teachers.map((teacher) => (
            <div
              key={teacher.user_id}
              className="bg-white dark:bg-slate-900 border border-border rounded-xl p-5 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-orange-600" />
                </div>
                <div>
                  <p className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    {teacher.email}
                    <Badge
                      variant="outline"
                      className="text-xs border-orange-200 text-orange-600 bg-orange-50"
                    >
                      Professor
                    </Badge>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {teacher.nome_completo || "Nome não informado"} • ID:{" "}
                    {teacher.user_id.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full h-10 w-10"
                onClick={() => setDeleteId(teacher.user_id)}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Remover Acesso?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Este usuário não poderá mais acessar o painel do professor. Os dados vinculados a ele
              não serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-slate-200">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveTeacher}
              className="bg-red-600 text-white hover:bg-red-700 rounded-xl px-6"
            >
              Confirmar Remoção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
