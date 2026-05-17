import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page">
        <p style={{ color: "var(--muted)" }}>Загрузка…</p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
