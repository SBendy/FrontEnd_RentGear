import { http, HttpResponse, delay, passthrough } from "msw";
import {
  appendOrder,
  createSession,
  createUser,
  enrichOrderWithClient,
  equipmentCatalog,
  findUserByEmail,
  findUserById,
  getStoredOrders,
  getUserIdByToken,
  revokeSession,
  updateOrderStatus,
  type StoredUser,
} from "./seed";
import { mapEquipmentItem, mapOrder } from "../lib/assetUrls";
import { randomHex } from "../lib/randomId";
import type {
  CreateOrderPayload,
  Order,
  OrderStatus,
  UserPublic,
  UserRole,
} from "../types";

function daysBetween(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return 0;
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
}

function randomOrderId() {
  return `ord-${randomHex(4)}`;
}

function toPublic(user: StoredUser): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

function bearerToken(request: Request): string | null {
  const h = request.headers.get("Authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7);
}

function getAuthUser(request: Request): StoredUser | null {
  const token = bearerToken(request);
  if (!token) return null;
  const userId = getUserIdByToken(token);
  if (!userId) return null;
  return findUserById(userId) ?? null;
}

export const handlers = [
  http.get("https://api.open-meteo.com/*", () => passthrough()),
  http.get("https://www.7timer.info/*", () => passthrough()),

  http.post("*/api/auth/register", async ({ request }) => {
    await delay(150);
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
      role?: UserRole;
    };
    if (!body.email?.trim() || !body.password || !body.name?.trim()) {
      return HttpResponse.json(
        { message: "Заполните все поля" },
        { status: 400 },
      );
    }
    if (body.role !== "admin" && body.role !== "client") {
      return HttpResponse.json({ message: "Некорректная роль" }, { status: 400 });
    }
    if (findUserByEmail(body.email)) {
      return HttpResponse.json(
        { message: "Этот email уже зарегистрирован" },
        { status: 409 },
      );
    }
    const user = createUser({
      email: body.email,
      password: body.password,
      name: body.name,
      role: body.role,
    });
    const token = createSession(user.id);
    return HttpResponse.json({ token, user: toPublic(user) }, { status: 201 });
  }),

  http.post("*/api/auth/login", async ({ request }) => {
    await delay(120);
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    if (!body.email?.trim() || !body.password) {
      return HttpResponse.json(
        { message: "Укажите email и пароль" },
        { status: 400 },
      );
    }
    const user = findUserByEmail(body.email);
    if (!user || user.password !== body.password) {
      return HttpResponse.json(
        { message: "Неверный email или пароль" },
        { status: 401 },
      );
    }
    const token = createSession(user.id);
    return HttpResponse.json({ token, user: toPublic(user) });
  }),

  http.post("*/api/auth/logout", async ({ request }) => {
    await delay(40);
    const token = bearerToken(request);
    if (token) revokeSession(token);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/api/auth/me", async ({ request }) => {
    await delay(60);
    const user = getAuthUser(request);
    if (!user) {
      return HttpResponse.json({ message: "Не авторизован" }, { status: 401 });
    }
    return HttpResponse.json(toPublic(user));
  }),

  http.get("*/api/equipment", async () => {
    await delay(120);
    return HttpResponse.json(equipmentCatalog.map(mapEquipmentItem));
  }),

  http.get("*/api/equipment/:id", async ({ params }) => {
    await delay(80);
    const item = equipmentCatalog.find((e) => e.id === params.id);
    if (!item) {
      return HttpResponse.json({ message: "Не найдено" }, { status: 404 });
    }
    return HttpResponse.json(mapEquipmentItem(item));
  }),

  http.get("*/api/orders", async ({ request }) => {
    await delay(100);
    const user = getAuthUser(request);
    if (!user) {
      return HttpResponse.json({ message: "Требуется вход" }, { status: 401 });
    }
    const mine = getStoredOrders().filter((o) => o.clientUserId === user.id);
    return HttpResponse.json(mine.map(mapOrder));
  }),

  http.get("*/api/admin/orders", async ({ request }) => {
    await delay(100);
    const user = getAuthUser(request);
    if (!user) {
      return HttpResponse.json({ message: "Требуется вход" }, { status: 401 });
    }
    if (user.role !== "admin") {
      return HttpResponse.json({ message: "Доступ запрещён" }, { status: 403 });
    }
    const all = getStoredOrders().map(enrichOrderWithClient).map(mapOrder);
    return HttpResponse.json(all);
  }),

  http.post("*/api/orders", async ({ request }) => {
    await delay(200);
    const user = getAuthUser(request);
    if (!user) {
      return HttpResponse.json({ message: "Требуется вход" }, { status: 401 });
    }
    if (user.role !== "client") {
      return HttpResponse.json(
        { message: "Оформлять заявки могут только клиенты" },
        { status: 403 },
      );
    }
    const body = (await request.json()) as CreateOrderPayload;
    const eq = equipmentCatalog.find((e) => e.id === body.equipmentId);
    if (!eq) {
      return HttpResponse.json(
        { message: "Техника не найдена" },
        { status: 400 },
      );
    }
    const days = daysBetween(body.startDate, body.endDate);
    if (days <= 0) {
      return HttpResponse.json({ message: "Неверные даты" }, { status: 400 });
    }
    const phoneRaw = String(body.clientPhone ?? "").trim();
    const phoneDigits = phoneRaw.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return HttpResponse.json(
        { message: "Укажите корректный номер телефона (от 10 цифр)" },
        { status: 400 },
      );
    }
    const order: Order = {
      id: randomOrderId(),
      equipmentId: eq.id,
      equipmentName: eq.name,
      startDate: body.startDate,
      endDate: body.endDate,
      totalRub: days * eq.dayPriceRub,
      status: "pending",
      createdAt: new Date().toISOString(),
      clientUserId: user.id,
      clientEmail: user.email,
      clientName: user.name,
      clientPhone: phoneRaw,
      equipmentImageUrl: eq.imageUrl,
    };
    appendOrder(order);
    return HttpResponse.json(mapOrder(order), { status: 201 });
  }),

  http.patch("*/api/orders/:id", async ({ request, params }) => {
    await delay(120);
    const admin = getAuthUser(request);
    if (!admin || admin.role !== "admin") {
      return HttpResponse.json({ message: "Доступ запрещён" }, { status: 403 });
    }
    const body = (await request.json()) as { status?: OrderStatus };
    if (
      body.status !== "pending" &&
      body.status !== "confirmed" &&
      body.status !== "completed"
    ) {
      return HttpResponse.json({ message: "Некорректный статус" }, { status: 400 });
    }
    const ok = updateOrderStatus(String(params.id), body.status);
    if (!ok) {
      return HttpResponse.json({ message: "Заявка не найдена" }, { status: 404 });
    }
    const list = getStoredOrders();
    const updated = list.find((o) => o.id === params.id);
    if (!updated) {
      return HttpResponse.json({ message: "Заявка не найдена" }, { status: 404 });
    }
    return HttpResponse.json(mapOrder(enrichOrderWithClient(updated)));
  }),
];
