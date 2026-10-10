import { logger } from "@/lib/logger";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { downloadCSV } from "@/utils/exportData";
import { createSystemLog } from "@/utils/logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Mail, Trash2, Download, Trash } from "lucide-react";
import { toast } from "sonner";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Copy } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_sign_in_at?: string;
  phone?: string;
  cpf?: string;
}

export function AccountsCentral() {
  const { user } = useAuthContext();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteUser, setDeleteUser] = useState<UserData | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map((u) => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, id]);
    } else {
      setSelectedUsers((prev) => prev.filter((userId) => userId !== id));
    }
  };

  const handleExportCSV = () => {
    const dataToExport =
      selectedUsers.length > 0 ? users.filter((u) => selectedUsers.includes(u.id)) : users;

    if (dataToExport.length === 0) return;

    downloadCSV(
      dataToExport.map((u) => ({
        Nome: u.name,
        Email: u.email,
        CPF: u.cpf || "",
        Celular: u.phone || "",
        DataCadastro: new Date(u.created_at).toLocaleString(),
        UltimoLogin: u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "",
      })),
      "alunos_bora_correr_club"
    );

    toast.success(`${dataToExport.length} contas exportadas com sucesso.`);

    createSystemLog({
      action: "export_accounts",
      category: "user_action",
      level: "info",
      message: `Exportou ${dataToExport.length} contas para CSV.`,
      details: { exportCount: dataToExport.length, ids: selectedUsers },
    });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) return;

      const { data, error } = await supabase.functions.invoke("manage-users", {
        method: "GET",
      });

      if (error) {
        logger.error("Edge Function error (GET):", error);
        throw new Error(error.message || "Falha ao carregar usuários");
      }

      setUsers(data || []);
    } catch (error: unknown) {
      logger.error("Error fetching users:", error);
      toast.error((error as Error).message || "Erro ao carregar lista de usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!deleteUser) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        toast.error("Sessão expirada");
        return;
      }

      const { error } = await supabase.functions.invoke("manage-users", {
        method: "DELETE",
        body: { userId: deleteUser.id },
      });

      if (error) {
        logger.error("Edge Function error (DELETE):", error);
        throw new Error(error.message || "Erro ao excluir usuário");
      }

      toast.success("Usuário excluído com sucesso");
      createSystemLog({
        action: "delete_user",
        category: "system",
        level: "warning",
        message: `O acesso do usuário ${deleteUser.name} (${deleteUser.email}) foi excluído definitivamente.`,
        details: { targetUserId: deleteUser.id, targetEmail: deleteUser.email },
      });
      setDeleteUser(null);
      fetchUsers();
    } catch (error: unknown) {
      logger.error("Error deleting user:", error);
      toast.error((error as Error).message || "Erro ao excluir usuário");
    }
  };

  const handleEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className="space-y-6">
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle>Central de Contas Criadas</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                {users.length} usuários{" "}
                {selectedUsers.length > 0 && `(${selectedUsers.length} selecionados)`}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleExportCSV} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={users.length > 0 && selectedUsers.length === users.length}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow
                    key={u.id}
                    className={selectedUsers.includes(u.id) ? "bg-muted/50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(u.id)}
                        onCheckedChange={(checked) => handleSelectUser(u.id, !!checked)}
                        aria-label={`Select ${u.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{u.name}</span>
                        {u.cpf && (
                          <span className="text-xs text-muted-foreground">CPF: {u.cpf}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" title="Opções de Email">
                              <Mail className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(
                                  `https://mail.google.com/mail/?view=cm&fs=1&to=${u.email}`,
                                  "_blank"
                                )
                              }
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Abrir no Gmail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(`mailto:${u.email}`, "_blank")}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              App Padrão
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(u.email);
                                toast.success("Email copiado!");
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar Email
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteUser(u)}
                          title="Excluir Conta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <b>{deleteUser?.name}</b> (
              {deleteUser?.email})?
              <br />
              <br />
              Esta ação removerá permanentemente o acesso, perfil e dados associados. Não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
