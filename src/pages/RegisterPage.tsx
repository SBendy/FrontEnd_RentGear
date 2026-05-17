import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("client");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register({ name, email, password, role });
      navigate(role === "admin" ? "/admin" : "/", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: "420px" }}>
      <h1 style={{ marginTop: 0 }}>Регистрация</h1>
      <p style={{ color: "var(--muted)" }}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
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
          <label htmlFor="reg-name">Имя</label>
          <input
            id="reg-name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="reg-password">Пароль</label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={4}
          />
        </div>
        <div className="field">
          <label htmlFor="reg-role">Тип учётной записи</label>
          <select
            id="reg-role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="select-input"
          >
            <option value="client">Клиент - аренда техники</option>
            <option value="admin">Администратор - управление заявками</option>
          </select>
        </div>
        {error && <div className="flash flash--error">{error}</div>}
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? "Регистрация…" : "Зарегистрироваться"}
        </button>
      </form>
    </div>
  );
}
