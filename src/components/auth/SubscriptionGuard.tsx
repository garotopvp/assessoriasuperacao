import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const SubscriptionGuard = () => {
  const { user, loading, subscriptionStatus, isAdmin } = useAuthContext();
  const location = useLocation();

  // Rotas permitidas mesmo se bloqueado
  const allowedPath = "/blocked";

  // Se for admin, sempre libera
  if (isAdmin) {
    return <Outlet />;
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (subscriptionStatus === "blocked") {
    return <Navigate to="/blocked" replace />;
  }

  return <Outlet />;
};
