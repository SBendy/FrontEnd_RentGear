import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchEquipmentList } from "../api/rentalClient";
import { publicUrl } from "../lib/publicUrl";
import type { EquipmentCategory, EquipmentItem } from "../types";

const categories: (EquipmentCategory | "Все")[] = [
  "Все",
  "Строительство",
  "Сад и ландшафт",
  "Склад и логистика",
  "Генераторы",
];

function formatRub(n: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n);
}

export function CatalogPage() {
  const [items, setItems] = useState<EquipmentItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<(typeof categories)[number]>("Все");

  useEffect(() => {
    let cancelled = false;
    fetchEquipmentList()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Ошибка загрузки");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (category === "Все") return items;
    return items.filter((i) => i.category === category);
  }, [items, category]);

  return (
    <div className="page">
      <header
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 0.35rem" }}>Каталог техники</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Подбор техники по категориям и городам выдачи
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`btn ${category === c ? "btn--primary" : "btn--ghost"}`}
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem" }}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </header>

      {error && <div className="flash flash--error">{error}</div>}
      {!items && !error && (
        <p style={{ color: "var(--muted)" }}>Загрузка каталога…</p>
      )}
      {items && (
        <div className="grid-cards">
          {filtered.map((item) => (
            <article key={item.id} className="card">
              <div className="card__image-wrap">
                <img
                  className="card__image"
                  src={publicUrl(item.imageUrl)}
                  alt=""
                  loading="lazy"
                />
              </div>
              <div className="card__body">
                <span className="card__meta">
                  {item.category} · {item.city}
                </span>
                <h2 className="card__title">{item.name}</h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.9rem",
                    color: "var(--muted)",
                    flex: 1,
                  }}
                >
                  {item.description.slice(0, 100)}
                  {item.description.length > 100 ? "…" : ""}
                </p>
                <p className="card__price">
                  от {formatRub(item.dayPriceRub)} / сутки
                </p>
                <Link
                  to={`/equipment/${item.id}`}
                  className="btn btn--primary"
                  style={{ marginTop: "0.5rem", textDecoration: "none" }}
                >
                  Подробнее и аренда
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
      {items && filtered.length === 0 && (
        <p style={{ color: "var(--muted)" }}>В этой категории пока пусто.</p>
      )}
    </div>
  );
}
