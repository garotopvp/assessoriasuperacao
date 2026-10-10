import { logger } from "@/lib/logger";
import { createSystemLog } from "@/utils/logger";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Plus, Trash2, Search, UserCheck, AlertTriangle } from "lucide-react";
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

interface AdminProfile {
  user_id: string;
  email: string;
  nome_completo: string | null;
  created_at: string;
  role?: string;
}

export function AdminsManager() {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("admin");
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, nome_completo, created_at")
        .eq("is_admin", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const { data: rolesData } = await supabase.from("user_roles").select("*");

      const merged = (data || []).map((admin) => {
        const foundRole = rolesData?.find(
          (r) => r.user_id === admin.user_id && r.role !== "teacher"
        );
        return {
          ...admin,
          role: foundRole?.role || "admin",
        };
      });

      setAdmins(merged);
    } catch (err) {
      logger.error("Error fetching admins:", err);
      toast.error("Erro ao carregar administradores");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setIsAdding(true);
    try {
      // 1. Find user by email
      // Note: We can't query auth.users directly from client easily due to security.
      // So we'll try to find in public.profiles first.

      // Attempt to find profile
      const searchEmail = newAdminEmail.trim().toLowerCase();
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, email")
        .eq("email", searchEmail)
        .single();

      if (profileError || !profile) {
        // Fallback: If profile doesn't exist, we can't add them easily via pure client-side
        // unless we have an Edge Function for this.
        // For now, let's assume the user MUST have logged in at least once or created an account.
        toast.error("Usuário não encontrado. Peça para ele criar uma conta no site primeiro.");
        return;
      }

      // 2. Update profile to be admin
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ is_admin: true })
        .eq("user_id", profile.user_id);

      if (updateError) throw updateError;

      // 3. Adiciona na tabela user_roles
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert([{ user_id: profile.user_id, role: selectedRole }], {
          onConflict: "user_id, role",
        });
      if (roleError) throw roleError;

      toast.success("Administrador adicionado com sucesso!");

      await createSystemLog({
        action: "novo_admin",
        category: "system",
        level: "warning",
        message: `O acesso de Administrador (${selectedRole}) foi concedido para o e-mail: ${newAdminEmail}`,
        details: { targetUserId: profile.user_id, email: newAdminEmail, role: selectedRole },
      });

      setNewAdminEmail("");
      fetchAdmins();
    } catch (err: any) {
      logger.error("Error adding admin:", err);
      toast.error(err.message || "Erro ao adicionar administrador");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveAdmin = async () => {
    if (!deleteId) return;

    try {
      // Prevent removing yourself is good UX, but Supabase RLS policies usually allow it if not careful.
      // We'll trust the RLS or just do it.
      const { data: currentUser } = await supabase.auth.getUser();
      if (currentUser.user?.id === deleteId) {
        toast.error("Você não pode remover a si mesmo.");
        setDeleteId(null);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: false })
        .eq("user_id", deleteId);

      if (error) throw error;

      // Remove da tabela user_roles
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", deleteId)
        .in("role", [
          "admin",
          "super_admin",
          "marketing",
          "comercial",
          "operacional",
          "financeiro",
        ]);
      if (roleError) throw roleError;

      toast.success("Privilégios de administrador removidos.");

      await createSystemLog({
        action: "remove_admin",
        category: "system",
        level: "warning",
        message: `O acesso de Administrador foi REMOVIDO do usuário com ID: ${deleteId}`,
        details: { targetUserId: deleteId },
      });

      fetchAdmins();
    } catch (err: any) {
      logger.error("Error removing admin:", err);
      toast.error("Erro ao remover privilégios");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Administradores</h2>
          <p className="text-muted-foreground">
            Adicione ou remova permissões de acesso ao painel.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Adicionar Novo Admin
        </h3>
        <form onSubmit={handleAddAdmin} className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Input
              placeholder="email.do.usuario@exemplo.com"
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              * O usuário já deve ter criado uma conta/login no site.
            </p>
          </div>
          <div className="w-[200px]">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o painel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Super Admin (Tudo)</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="operacional">Operacional</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isAdding}>
            {isAdding ? "Adicionando..." : "Adicionar Admin"}
          </Button>
        </form>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum administrador encontrado. (Isso não deveria acontecer se você está vendo isso!)
          </div>
        ) : (
          admins.map((admin) => (
            <div
              key={admin.user_id}
              className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold flex items-center gap-2">
                    {admin.email}
                    <Badge variant="secondary" className="text-xs uppercase">
                      {admin.role}
                    </Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {admin.nome_completo || "Nome não informado"} • ID: {admin.user_id.slice(0, 8)}
                    ...
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteId(admin.user_id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Permissão?</AlertDialogTitle>
            <AlertDialogDescription>
              Este usuário perderá o acesso a todo o painel administrativo imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAdmin}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
