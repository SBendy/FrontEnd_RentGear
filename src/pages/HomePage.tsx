import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="page">
      <section
        style={{
          display: "grid",
          gap: "1.5rem",
          maxWidth: "640px",
          marginBottom: "2.5rem",
        }}
      >
        <p className="pill" style={{ width: "fit-content" }}>
          Аренда без лишних звонков
        </p>
        <h1 style={{ margin: 0, fontSize: "clamp(1.85rem, 4vw, 2.6rem)" }}>
          Платформа аренды строительной и спецтехники
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: "1.05rem" }}>
          Выберите технику в каталоге, уточните условия по карточке с прогнозом
          погоды в городе выдачи и оформите заявку онлайн.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link to="/catalog" className="btn btn--primary">
            Каталог
          </Link>
          {user ? (
            <Link to="/orders" className="btn btn--ghost">
              Мои заявки
            </Link>
          ) : (
            <Link to="/register" className="btn btn--ghost">
              Создать аккаунт
            </Link>
          )}
        </div>
      </section>

      <section
        className="card"
        style={{
          maxWidth: "640px",
          marginBottom: "2rem",
          padding: "1.35rem 1.5rem",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "1.08rem",
            lineHeight: 1.65,
            color: "var(--text)",
          }}
        >
          RentGear — каталог спецтехники с прогнозом погоды в городе выдачи и
          расчётом доставки. Оформите заявку онлайн или выберите самовывоз со склада
          без дополнительной платы за доставку.
        </p>
      </section>
    </div>
  );
}
