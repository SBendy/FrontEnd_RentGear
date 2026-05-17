import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchOrders } from "../api/rentalClient";
import { useAuth } from "../context/AuthContext";
import { OrderEquipmentThumb } from "../components/OrderEquipmentThumb";
import { orderStatusLabel } from "../lib/orderLabels";
import type { Order } from "../types";

function formatRub(n: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!user) {
      setOrders(null);
      return;
    }
    setError(null);
    setOrders(null);
    fetchOrders()
      .then(setOrders)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Ошибка"),
      );
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page">
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 0.35rem" }}>Мои заявки</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            История ваших обращений и текущий статус по каждой
          </p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={load}>
          Обновить
        </button>
      </header>

      {error && <div className="flash flash--error">{error}</div>}
      {!orders && !error && (
        <p style={{ color: "var(--muted)" }}>Загрузка…</p>
      )}
      {orders && orders.length === 0 && (
        <p style={{ color: "var(--muted)" }}>
          Заявок пока нет.{" "}
          <Link to="/catalog">Перейти в каталог</Link>
        </p>
      )}
      {orders && orders.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table className="orders-table">
            <thead>
              <tr>
                <th>Фото</th>
                <th>№</th>
                <th>Техника</th>
                <th>Период</th>
                <th>Телефон</th>
                <th>Сумма</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td data-label="Фото" className="order-thumb-wrap">
                    <OrderEquipmentThumb order={o} />
                  </td>
                  <td data-label="№">
                    <span className="mono">{o.id}</span>
                  </td>
                  <td data-label="Техника">
                    <Link to={`/equipment/${o.equipmentId}`}>
                      {o.equipmentName}
                    </Link>
                  </td>
                  <td data-label="Период">
                    {formatDate(o.startDate)} - {formatDate(o.endDate)}
                  </td>
                  <td data-label="Телефон">
                    <span className="mono">{o.clientPhone}</span>
                  </td>
                  <td data-label="Сумма">{formatRub(o.totalRub)}</td>
                  <td data-label="Статус">
                    <span className="pill">
                      {orderStatusLabel(o.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
