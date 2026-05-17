import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const raw = (location.state as { from?: string } | null)?.from;
  const from =
    raw &&
    raw.startsWith("/") &&
    raw !== "/login" &&
    raw !== "/register"
      ? raw
      : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: "420px" }}>
      <h1 style={{ marginTop: 0 }}>Вход</h1>
      <p style={{ color: "var(--muted)" }}>
        Нет аккаунта? <Link to="/register">Регистрация</Link>
      </p>
      <form
        onSubmit={onSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginTop: "1.25rem",
        }}
      >
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Пароль</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="flash flash--error">{error}</div>}
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? "Вход…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
