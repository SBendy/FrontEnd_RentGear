import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Layout.module.css";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;

export function Layout() {
  const { user, logout, loading } = useAuth();

  return (
    <div className={styles.shell}>
      {typeof window !== "undefined" && window.__rentgearApiUnavailable ? (
        <div
          className="flash flash--error"
          role="alert"
          style={{
            margin: 0,
            borderRadius: 0,
            borderLeft: "none",
            borderRight: "none",
            textAlign: "center",
          }}
        >
          Не удалось инициализировать приложение. Обновите страницу или откройте
          сайт по HTTPS.
        </div>
      ) : null}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <NavLink to="/" className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              <span className={styles.brandLetter}>R</span>
            </span>
            <span>
              <strong>RentGear</strong>
              <span className={styles.brandSub}>аренда техники</span>
            </span>
          </NavLink>
          <nav className={styles.nav} aria-label="Основная навигация">
            <NavLink to="/" end className={linkClass}>
              Главная
            </NavLink>
            <NavLink to="/catalog" className={linkClass}>
              Каталог
            </NavLink>
            <NavLink to="/orders" className={linkClass}>
              Мои заявки
            </NavLink>
          </nav>
          <div className={styles.headerTools}>
            {user?.role === "admin" && (
              <Link to="/admin" className={`btn btn--ghost ${styles.adminLink}`}>
                Админ-панель
              </Link>
            )}
            {loading ? (
              <span className={styles.userHint} style={{ color: "var(--muted)" }}>
                …
              </span>
            ) : user ? (
              <>
                <span className={styles.userHint} title={user.email}>
                  {user.name}
                </span>
                <button
                  type="button"
                  className={`btn btn--ghost ${styles.logoutBtn}`}
                  onClick={() => void logout()}
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost">
                  Вход
                </Link>
                <Link to="/register" className="btn btn--primary">
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <p>
          © RentGear. Прогноз погоды:{" "}
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
            Open-Meteo
          </a>
          , резерв -{" "}
          <a href="https://www.7timer.info/" target="_blank" rel="noreferrer">
            7Timer
          </a>
        </p>
      </footer>
    </div>
  );
}
