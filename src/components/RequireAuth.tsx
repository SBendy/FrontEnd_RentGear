import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="page">
        <p style={{ color: "var(--muted)" }}>Загрузка…</p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return <>{children}</>;
}
