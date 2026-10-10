import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify if the user is an admin
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Check admin role in user_roles table
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      // Fallback: check email
      const adminEmails = ["boracorrerclub@gmail.com"]; // Add other admin emails if needed
      if (!adminEmails.includes(user.email ?? "")) {
        throw new Error("Unauthorized: User is not an admin");
      }
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is missing");
      throw new Error("Configuration Error: SUPABASE_SERVICE_ROLE_KEY is not set");
    }

    // Create a Supabase client with the SERVICE ROLE key to access auth.users
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL") ?? "", serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const url = new URL(req.url);
    const method = req.method;

    // LIST USERS
    if (method === "GET") {
      try {
        console.log("Attempting to fetch profiles...");
        // Also fetch profiles to get names - moved UP to test DB connection first
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from("profiles")
          .select("user_id, nome_completo, cpf, telefone");

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
          throw new Error(`Profile Error: ${profilesError.message}`);
        }
        console.log(`Fetched ${profiles?.length ?? 0} profiles`);

        console.log("Attempting to list users via RPC 'get_all_users_admin'...");

        // Use RPC to bypass Auth API errors and Schema restrictions
        const { data: usersData, error: listError } =
          await supabaseAdmin.rpc("get_all_users_admin");

        if (listError) {
          console.error("Error listing users (RPC):", listError);
          throw new Error(`RPC Error: ${listError.message}`);
        }

        // RPC returns the array directly or null
        const users = usersData || [];
        console.log(`Fetched ${users.length} users via RPC`);

        // Merge data
        const enrichedUsers = users.map((user) => {
          const profile = profiles.find((p) => p.user_id === user.id);
          // user_metadata is already normalized in the RPC
          const metadata = user.user_metadata || {};

          return {
            id: user.id,
            email: user.email,
            last_sign_in_at: user.last_sign_in_at,
            created_at: user.created_at,
            name: metadata.full_name || profile?.nome_completo || "Sem nome",
            phone: metadata.phone || profile?.telefone,
            cpf: profile?.cpf,
          };
        });

        // Sort by created_at desc
        enrichedUsers.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return new Response(JSON.stringify(enrichedUsers), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (innerError) {
        throw innerError; // Re-throw to be caught by outer catch
      }
    }

    // DELETE USER
    if (method === "DELETE") {
      const { userId } = await req.json();

      if (!userId) {
        throw new Error("User ID is required");
      }

      console.log(`Attempting to delete user ${userId} via RPC...`);

      // Use RPC for safe deletion
      const { error } = await supabaseAdmin.rpc("delete_user_admin", { user_id: userId });

      if (error) {
        console.error("Error deleting user (RPC):", error);
        throw new Error(`RPC Delete Error: ${error.message}`);
      }

      return new Response(JSON.stringify({ message: "User deleted successfully" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
