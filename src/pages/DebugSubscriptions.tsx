import { logger } from "@/lib/logger";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function DebugSubscriptions() {
  const { user } = useAuthContext();
  const [subs, setSubs] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [writeResult, setWriteResult] = useState<any>(null);

  async function check() {
    try {
      // 1. Check User Roles
      const { data: userRoles, error: rolesError } = await supabase.from("user_roles").select("*");

      if (rolesError) logger.error("Roles error:", rolesError);
      setRoles(userRoles || []);

      // 2. Check Subscriptions
      const { data, error } = await supabase.from("recurring_subscriptions").select("*");

      if (error) {
        setError(error);
      } else {
        setSubs(data || []);
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    check();
  }, []);

  const testWrite = async () => {
    if (!user) {
      setWriteResult("User not logged in");
      return;
    }

    setWriteResult("Testing write...");
    try {
      const { data, error } = await supabase
        .from("recurring_subscriptions")
        .insert({
          user_id: user.id,
          student_name: "Test Debug User",
          student_email: user.email || "test@debug.com",
          plan_name: "Debug Testing Plan",
          status: "waiting_details",
          amount: 0,
          next_billing_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        setWriteResult({ success: false, error });
      } else {
        setWriteResult({ success: true, data });
        check(); // Refresh list
      }
    } catch (err) {
      setWriteResult({ success: false, error: err });
    }
  };

  return (
    <div className="p-8 space-y-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold">Debug Subscriptions (V2)</h1>

      <div className="border p-6 rounded-lg bg-white shadow-sm space-y-4">
        <h2 className="font-bold text-xl border-b pb-2">Diagnóstico de Escrita</h2>
        <p className="text-gray-600">
          Teste se o seu usuário atual tem permissão para gravar no banco.
        </p>

        <Button onClick={testWrite} className="bg-blue-600 hover:bg-blue-700 text-white">
          Testar Criação de Assinatura (Simular Cadastro)
        </Button>

        {writeResult && (
          <div
            className={`mt-4 p-4 border rounded font-mono text-sm overflow-auto ${writeResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
          >
            <h3 className="font-bold mb-2">Resultado do Teste:</h3>
            <pre className="whitespace-pre-wrap break-all">
              {JSON.stringify(writeResult, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border p-6 rounded-lg bg-white shadow-sm">
          <h2 className="font-bold mb-4">Usuário Atual</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-60">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="border p-6 rounded-lg bg-white shadow-sm">
          <h2 className="font-bold mb-4">User Roles (Tabela)</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-60">
            {JSON.stringify(roles, null, 2)}
          </pre>
        </div>
      </div>

      <div className="border p-6 rounded-lg bg-white shadow-sm">
        <h2 className="font-bold mb-4">Todas as Assinaturas (Tabela recurring_subscriptions)</h2>
        {error ? (
          <div className="text-red-500 font-bold p-4 bg-red-50 border border-red-200 rounded">
            Error Fetching: {JSON.stringify(error)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <pre className="text-xs bg-gray-100 p-2 rounded">{JSON.stringify(subs, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
