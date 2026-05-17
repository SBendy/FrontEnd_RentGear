import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminOrders, updateOrderStatus } from "../api/rentalClient";
import { OrderEquipmentThumb } from "../components/OrderEquipmentThumb";
import { orderStatusLabel } from "../lib/orderLabels";
import type { Order, OrderStatus } from "../types";

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

const statusOptions: OrderStatus[] = ["pending", "confirmed", "completed"];

export function AdminPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    fetchAdminOrders()
      .then(setOrders)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Ошибка"),
      );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onStatusChange(order: Order, status: OrderStatus) {
    if (status === order.status) return;
    setUpdatingId(order.id);
    setError(null);
    try {
      await updateOrderStatus(order.id, status);
      setOrders((prev) =>
        prev
          ? prev.map((o) => (o.id === order.id ? { ...o, status } : o))
          : prev,
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Не удалось обновить");
    } finally {
      setUpdatingId(null);
    }
  }

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
          <h1 style={{ margin: "0 0 0.35rem" }}>Админ-панель</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Все заявки клиентов и смена статуса обработки
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
        <p style={{ color: "var(--muted)" }}>Заявок пока нет.</p>
      )}
      {orders && orders.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table className="orders-table">
            <thead>
              <tr>
                <th>Фото</th>
                <th>№</th>
                <th>Клиент</th>
                <th>Техника</th>
                <th>Период</th>
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
                  <td data-label="Клиент">
                    <strong>{o.clientName}</strong>
                    <br />
                    <span style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
                      {o.clientEmail}
                    </span>
                    <br />
                    <span style={{ color: "var(--muted)", fontSize: "0.88rem" }}>
                      {o.clientPhone}
                    </span>
                  </td>
                  <td data-label="Техника">
                    <Link to={`/equipment/${o.equipmentId}`}>{o.equipmentName}</Link>
                  </td>
                  <td data-label="Период">
                    {formatDate(o.startDate)} - {formatDate(o.endDate)}
                  </td>
                  <td data-label="Сумма">{formatRub(o.totalRub)}</td>
                  <td data-label="Статус">
                    <select
                      className="select-input select-input--inline"
                      value={o.status}
                      disabled={updatingId === o.id}
                      onChange={(e) =>
                        onStatusChange(o, e.target.value as OrderStatus)
                      }
                      aria-label={`Статус заявки ${o.id}`}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {orderStatusLabel(s)}
                        </option>
                      ))}
                    </select>
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
