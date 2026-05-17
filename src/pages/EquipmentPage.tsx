import { FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createOrder, fetchEquipmentById } from "../api/rentalClient";
import { useAuth } from "../context/AuthContext";
import { describeWmoCode, fetchCurrentWeather } from "../api/weather";
import {
  PICKUP_POINTS,
  defaultPickupForCity,
  type PickupPoint,
} from "../data/pickupPoints";
import { quoteDelivery, type DeliveryKind } from "../lib/deliveryByWeather";
import { publicUrl } from "../lib/publicUrl";
import type { EquipmentItem, WeatherSummary } from "../types";

function formatRub(n: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(n);
}

function defaultStartDate() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function defaultEndDate() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
}

function rentalDays(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return 0;
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

export function EquipmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<EquipmentItem | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [weatherText, setWeatherText] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherSnapshot, setWeatherSnapshot] = useState<WeatherSummary | null>(
    null,
  );
  const [weatherFailed, setWeatherFailed] = useState(false);

  const [pickupChoice, setPickupChoice] = useState<PickupPoint | null>(null);
  const [receiveMode, setReceiveMode] = useState<DeliveryKind>("delivery");

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchEquipmentById(id)
      .then((data) => {
        if (!cancelled) setItem(data);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setLoadError(e instanceof Error ? e.message : "Не найдено");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    setPickupChoice(null);
    setReceiveMode("delivery");
    setPhone("");
  }, [id]);

  const pickupPoint = useMemo(() => {
    if (!item) return null;
    return pickupChoice ?? defaultPickupForCity(item.city);
  }, [item, pickupChoice]);

  const weatherAnchor = useMemo((): PickupPoint | null => {
    if (!item) return null;
    if (receiveMode === "pickup") return defaultPickupForCity(item.city);
    return pickupPoint;
  }, [item, receiveMode, pickupPoint]);

  useEffect(() => {
    if (!item || !weatherAnchor) return;
    let cancelled = false;
    setWeatherLoading(true);
    setWeatherText(null);
    setWeatherSnapshot(null);
    setWeatherFailed(false);
    fetchCurrentWeather(
      weatherAnchor.latitude,
      weatherAnchor.longitude,
      weatherAnchor.name,
    )
      .then((w) => {
        if (cancelled) return;
        setWeatherSnapshot(w);
        setWeatherFailed(false);
        const desc = describeWmoCode(w.current.weathercode);
        setWeatherText(
          `${w.city}: ${desc}, ${Math.round(w.current.temperature)}°C, ветер ${w.current.windspeed} км/ч (на момент ${w.current.time})`,
        );
      })
      .catch(() => {
        if (!cancelled) {
          setWeatherSnapshot(null);
          setWeatherFailed(true);
          setWeatherText("Погода недоступна (проверьте сеть).");
        }
      })
      .finally(() => {
        if (!cancelled) setWeatherLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [item, weatherAnchor]);

  const days = useMemo(
    () => rentalDays(startDate, endDate),
    [startDate, endDate],
  );

  const deliveryQuote = useMemo(() => {
    if (!item) return null;
    if (receiveMode === "pickup") {
      return quoteDelivery(item, null, false, "pickup", item.city);
    }
    if (weatherLoading || !pickupPoint) return null;
    return quoteDelivery(
      item,
      weatherSnapshot,
      weatherFailed,
      "delivery",
      pickupPoint.name,
    );
  }, [
    item,
    receiveMode,
    pickupPoint,
    weatherSnapshot,
    weatherFailed,
    weatherLoading,
  ]);

  const total = item && days > 0 ? days * item.dayPriceRub : 0;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormOk(null);
    if (!item) return;
    if (!user || user.role !== "client") {
      setFormError(
        "Оформить аренду может только клиент. Войдите или зарегистрируйтесь.",
      );
      return;
    }
    if (days <= 0) {
      setFormError("Укажите корректный период аренды.");
      return;
    }
    const phoneTrim = phone.trim();
    const phoneDigits = phoneTrim.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      setFormError(
        "Укажите номер телефона для связи по заявке (не менее 10 цифр).",
      );
      return;
    }
    setSubmitting(true);
    try {
      await createOrder({
        equipmentId: item.id,
        startDate,
        endDate,
        clientPhone: phoneTrim,
      });
      setFormOk("Заявка создана - перенаправляем в список…");
      setTimeout(() => navigate("/orders"), 900);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Ошибка отправки");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className="page">
        <div className="flash flash--error">{loadError}</div>
        <p>
          <Link to="/catalog">← В каталог</Link>
        </p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page">
        <p style={{ color: "var(--muted)" }}>Загрузка карточки…</p>
      </div>
    );
  }

  return (
    <div className="page page--with-pickup-floater">
      <p style={{ marginTop: 0 }}>
        <Link to="/catalog" style={{ color: "var(--muted)" }}>
          ← Каталог
        </Link>
      </p>
      <div
        className="equipment-layout"
        style={{
          display: "grid",
          gap: "1.75rem",
          gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 380px)",
          alignItems: "start",
        }}
      >
        <div>
          <div
            className="card"
            style={{ boxShadow: "none", marginBottom: "1rem" }}
          >
            <div className="card__image-wrap" style={{ aspectRatio: "16/10" }}>
              <img className="card__image" src={publicUrl(item.imageUrl)} alt="" />
            </div>
          </div>
          <span className="pill">
            {item.category} · склад: {item.city}
          </span>
          <h1 style={{ margin: "0.5rem 0 0.75rem" }}>{item.name}</h1>
          <p style={{ color: "var(--muted)", marginTop: 0 }}>{item.description}</p>
          <h3 style={{ fontSize: "1rem" }}>Характеристики</h3>
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "0.35rem 1.25rem",
              margin: 0,
              fontSize: "0.95rem",
            }}
          >
            {item.specs.map((s) => (
              <Fragment key={s.label}>
                <dt style={{ color: "var(--muted)" }}>{s.label}</dt>
                <dd style={{ margin: 0 }}>{s.value}</dd>
              </Fragment>
            ))}
          </dl>
        </div>
        <aside style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1.2rem",
            }}
          >
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
              Тариф
            </p>
            <p
              style={{
                margin: "0.25rem 0 0",
                fontSize: "1.35rem",
                fontWeight: 700,
              }}
            >
              {formatRub(item.dayPriceRub)}
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "var(--muted)",
                }}
              >
                {" "}
                / сутки
              </span>
            </p>
            <p
              style={{
                margin: "0.75rem 0 0",
                fontSize: "0.9rem",
                color: "var(--muted)",
              }}
            >
              Залог: {formatRub(item.depositRub)} · Свободно единиц:{" "}
              <span className="badge-ok">{item.availableUnits}</span>
            </p>
          </div>

          <div className="weather-panel">
            <div>
              <h3>Погода</h3>
              <p>
                {weatherLoading && "Загрузка прогноза…"}
                {!weatherLoading && weatherText}
              </p>
            </div>
          </div>

          {deliveryQuote &&
            (receiveMode === "pickup" || pickupPoint) && (
            <div
              className={`flash ${
                deliveryQuote.kind === "pickup"
                  ? "flash--success"
                  : deliveryQuote.showWarning
                    ? "flash--warn"
                    : "flash--info"
              }`}
              role="status"
            >
              <strong>
                {deliveryQuote.kind === "pickup"
                  ? `Самовывоз со склада · ${item.city}`
                  : `Доставка в ${pickupPoint!.name}`}
              </strong>
              {deliveryQuote.kind === "delivery" && (
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.88rem" }}>
                  Базовая ставка: {formatRub(deliveryQuote.baseRub)}
                  {deliveryQuote.weatherSurchargeRub +
                    deliveryQuote.windSurchargeRub >
                    0 && (
                    <>
                      {" "}
                      · Надбавки из‑за погоды:{" "}
                      {formatRub(
                        deliveryQuote.weatherSurchargeRub +
                          deliveryQuote.windSurchargeRub,
                      )}
                    </>
                  )}
                </p>
              )}
              {deliveryQuote.kind === "pickup" ? (
                <p
                  style={{
                    margin: "0.35rem 0 0",
                    fontSize: "0.95rem",
                    color: "var(--muted)",
                  }}
                >
                  Доставка не начисляется - вы забираете технику с нашего склада в
                  указанном городе.
                </p>
              ) : (
                <p
                  style={{
                    margin: "0.35rem 0 0",
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "var(--text)",
                  }}
                >
                  {deliveryQuote.priceBeforeSameCityDiscount != null &&
                  deliveryQuote.sameCityDiscountRub ? (
                    <>
                      <span
                        style={{
                          textDecoration: "line-through",
                          color: "var(--muted)",
                          fontWeight: 500,
                          marginRight: "0.5rem",
                        }}
                      >
                        {formatRub(deliveryQuote.priceBeforeSameCityDiscount)}
                      </span>
                      Итого доставка:{" "}
                      {formatRub(deliveryQuote.totalRub)}{" "}
                      <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>
                        (экономия{" "}
                        {formatRub(deliveryQuote.sameCityDiscountRub)})
                      </span>
                    </>
                  ) : (
                    <>Итого доставка: {formatRub(deliveryQuote.totalRub)}</>
                  )}
                </p>
              )}
              {deliveryQuote.detailLines.length > 0 && (
                <ul
                  style={{
                    margin: "0.45rem 0 0",
                    paddingLeft: "1.15rem",
                    fontSize: "0.84rem",
                  }}
                >
                  {deliveryQuote.detailLines.map((line, idx) => (
                    <li key={`${idx}-${line.slice(0, 24)}`}>{line}</li>
                  ))}
                </ul>
              )}
              {deliveryQuote.kind === "delivery" &&
                deliveryQuote.weatherSurchargeRub +
                  deliveryQuote.windSurchargeRub >
                  0 ? (
                <p style={{ margin: "0.65rem 0 0", fontSize: "0.82rem" }}>
                  <strong className="badge-warn">Внимание:</strong> при
                  неблагоприятной погоде увеличиваются сроки и риски доставки,
                  поэтому к базе добавлены надбавки. Точную сумму при необходимости
                  подтвердит менеджер перед выездом.
                </p>
              ) : null}
            </div>
          )}

          <form
            onSubmit={onSubmit}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1.2rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.85rem",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Оформить аренду</h3>
            {!user && (
              <div className="flash flash--error" style={{ margin: 0 }}>
                <Link to="/login" state={{ from: `/equipment/${item.id}` }}>
                  Войдите
                </Link>
                {" "}
                или{" "}
                <Link to="/register">зарегистрируйтесь</Link> как клиент, чтобы
                отправить заявку.
              </div>
            )}
            {user?.role === "admin" && (
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.92rem" }}>
                Войдите под учётной записью клиента, чтобы бронировать технику.
                Панель администратора - в меню справа сверху.
              </p>
            )}
            <div className="field">
              <label htmlFor="start">Начало</label>
              <input
                id="start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={!user || user.role !== "client"}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="end">Окончание</label>
              <input
                id="end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={!user || user.role !== "client"}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="order-phone">Телефон для связи</label>
              <input
                id="order-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+7 900 123-45-67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!user || user.role !== "client"}
                required
              />
              <p
                style={{
                  margin: "0.25rem 0 0",
                  fontSize: "0.82rem",
                  color: "var(--muted)",
                }}
              >
                Укажите номер телефона: он нужен, чтобы подтвердить заявку и
                согласовать детали доставки или самовывоза.
              </p>
            </div>
            <p style={{ margin: 0, fontSize: "0.95rem" }}>
              Срок: <strong>{days > 0 ? `${days} сут.` : "-"}</strong>
              {days > 0 && (
                <>
                  {" "}
                  · Итого: <strong>{formatRub(total)}</strong>
                </>
              )}
            </p>
            {formError && <div className="flash flash--error">{formError}</div>}
            {formOk && <div className="flash flash--success">{formOk}</div>}
            <button
              type="submit"
              className="btn btn--primary"
              disabled={
                submitting ||
                days <= 0 ||
                !user ||
                user.role !== "client"
              }
            >
              {submitting ? "Отправка…" : "Создать заявку"}
            </button>
          </form>
        </aside>
      </div>
      <style>{`
        @media (max-width: 860px) {
          .equipment-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {item ? (
        <div className="pickup-floater">
          <div className="pickup-floater-modes" role="radiogroup" aria-label="Способ получения">
            <button
              type="button"
              className={receiveMode === "delivery" ? "active" : ""}
              onClick={() => setReceiveMode("delivery")}
              aria-pressed={receiveMode === "delivery"}
            >
              Доставка
            </button>
            <button
              type="button"
              className={receiveMode === "pickup" ? "active" : ""}
              onClick={() => setReceiveMode("pickup")}
              aria-pressed={receiveMode === "pickup"}
            >
              Самовывоз
            </button>
          </div>
          {receiveMode === "delivery" && pickupPoint ? (
            <>
              <label htmlFor="pickup-city">Куда везём</label>
              <select
                id="pickup-city"
                className="select-input"
                value={pickupPoint.id}
                onChange={(e) => {
                  const p = PICKUP_POINTS.find((x) => x.id === e.target.value);
                  if (p) setPickupChoice(p);
                }}
                aria-label="Город доставки"
              >
                {PICKUP_POINTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <p className="pickup-floater-static">
              Склад самовывоза: <strong>{item.city}</strong>
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
