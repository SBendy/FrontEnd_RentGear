import { randomHex } from "../lib/randomId";
import type { EquipmentItem, Order, OrderStatus, UserRole } from "../types";

export const equipmentCatalog: EquipmentItem[] = [
  {
    id: "exc-001",
    name: "Мини-экскаватор 1.7 т",
    category: "Строительство",
    description:
      "Компактная машина для копки траншей и планировки на участках с ограниченным доступом.",
    dayPriceRub: 8900,
    depositRub: 45000,
    imageUrl: "images/equipment/exc-001.png",
    city: "Москва",
    latitude: 55.7558,
    longitude: 37.6173,
    availableUnits: 3,
    specs: [
      { label: "Масса", value: "1.7 т" },
      { label: "Ковш", value: "0.04 м³" },
      { label: "Глубина копания", value: "2.4 м" },
    ],
  },
  {
    id: "lift-002",
    name: "Ножничный подъёмник 12 м",
    category: "Строительство",
    description:
      "Электрический ножничный подъёмник для внутренних и наружных высотных работ.",
    dayPriceRub: 7200,
    depositRub: 60000,
    imageUrl: "images/equipment/lift-002.png",
    city: "Санкт-Петербург",
    latitude: 59.9343,
    longitude: 30.3351,
    availableUnits: 2,
    specs: [
      { label: "Высота подъёма", value: "12 м" },
      { label: "Грузоподъёмность", value: "230 кг" },
      { label: "Питание", value: "АКБ" },
    ],
  },
  {
    id: "fork-003",
    name: "Вилочный погрузчик 2.5 т",
    category: "Склад и логистика",
    description:
      "Дизельный погрузчик для склада и погрузочно-разгрузочных работ.",
    dayPriceRub: 6500,
    depositRub: 80000,
    imageUrl: "images/equipment/fork-003.png",
    city: "Казань",
    latitude: 55.7963,
    longitude: 49.1088,
    availableUnits: 4,
    specs: [
      { label: "Грузоподъёмность", value: "2.5 т" },
      { label: "Высота подъёма", value: "4.5 м" },
      { label: "Топливо", value: "дизель" },
    ],
  },
  {
    id: "gen-004",
    name: "Дизель-генератор 30 кВт",
    category: "Генераторы",
    description:
      "Автономное питание для стройки или мероприятия, шумозащитный кожух.",
    dayPriceRub: 4800,
    depositRub: 120000,
    imageUrl: "images/equipment/gen-004.png",
    city: "Екатеринбург",
    latitude: 56.8389,
    longitude: 60.6057,
    availableUnits: 5,
    specs: [
      { label: "Мощность", value: "30 кВт" },
      { label: "Резервуар", value: "80 л" },
      { label: "Уровень шума", value: "68 дБ" },
    ],
  },
  {
    id: "mower-005",
    name: "Райдер для газона",
    category: "Сад и ландшафт",
    description:
      "Манёвренная косилка для больших участков, выгрузка травосборника.",
    dayPriceRub: 3200,
    depositRub: 25000,
    imageUrl: "images/equipment/mower-005.png",
    city: "Краснодар",
    latitude: 45.0355,
    longitude: 38.9753,
    availableUnits: 6,
    specs: [
      { label: "Ширина захвата", value: "98 см" },
      { label: "Мощность", value: "18 л.с." },
      { label: "Топливо", value: "бензин" },
    ],
  },
  {
    id: "comp-006",
    name: "Виброплита 140 кг",
    category: "Строительство",
    description:
      "Уплотнение песка, щебня и асфальта при укладке брусчатки и дорожек.",
    dayPriceRub: 1800,
    depositRub: 15000,
    imageUrl: "images/equipment/comp-006.png",
    city: "Новосибирск",
    latitude: 55.0084,
    longitude: 82.9357,
    availableUnits: 8,
    specs: [
      { label: "Масса", value: "140 кг" },
      { label: "Площадь подошвы", value: "66×50 см" },
      { label: "Топливо", value: "бензин" },
    ],
  },
];

export function imageUrlForEquipmentId(equipmentId: string): string {
  return (
    equipmentCatalog.find((e) => e.id === equipmentId)?.imageUrl ??
    "images/equipment/placeholder.svg"
  );
}

export interface StoredUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface StoredSession {
  token: string;
  userId: string;
}

const ordersKey = "rentgear_orders_v2";
const legacyOrdersKey = "rentgear_orders_v1";
const usersKey = "rentgear_users_v1";
const sessionsKey = "rentgear_sessions_v1";
function pickNonEmpty(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (value == null) continue;
    const s = String(value).trim();
    if (s) return s;
  }
  return undefined;
}

const PLACEHOLDER_CLIENT_NAME = "Без учётной записи";
const PLACEHOLDER_CLIENT_EMAIL = "-";
const PLACEHOLDER_CLIENT_PHONE = "-";

function normalizeOrder(raw: Record<string, unknown>): Order {
  const status = raw.status as Order["status"] | undefined;
  const safeStatus: OrderStatus =
    status === "confirmed" || status === "completed" || status === "pending"
      ? status
      : "pending";

  return {
    id: String(raw.id),
    equipmentId: String(raw.equipmentId),
    equipmentName: String(raw.equipmentName),
    startDate: String(raw.startDate),
    endDate: String(raw.endDate),
    totalRub: Number(raw.totalRub),
    status: safeStatus,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    clientUserId:
      pickNonEmpty(raw.clientUserId, raw.userId) ?? "legacy",
    clientEmail:
      pickNonEmpty(raw.clientEmail, raw.email) ?? PLACEHOLDER_CLIENT_EMAIL,
    clientName:
      pickNonEmpty(raw.clientName, raw.userName, raw.customerName) ??
      PLACEHOLDER_CLIENT_NAME,
    clientPhone:
      pickNonEmpty(raw.clientPhone, raw.phone, raw.telephone) ??
      PLACEHOLDER_CLIENT_PHONE,
    equipmentImageUrl: String(
      raw.equipmentImageUrl ?? imageUrlForEquipmentId(String(raw.equipmentId)),
    ),
  };
}

export function enrichOrderWithClient(order: Order): Order {
  const client =
    order.clientUserId && order.clientUserId !== "legacy"
      ? findUserById(order.clientUserId)
      : undefined;

  const clientName =
    pickNonEmpty(order.clientName) &&
    order.clientName !== PLACEHOLDER_CLIENT_NAME
      ? order.clientName
      : (client?.name ?? PLACEHOLDER_CLIENT_NAME);

  const clientEmail =
    pickNonEmpty(order.clientEmail) &&
    order.clientEmail !== PLACEHOLDER_CLIENT_EMAIL
      ? order.clientEmail
      : (client?.email ?? PLACEHOLDER_CLIENT_EMAIL);

  const clientPhone =
    pickNonEmpty(order.clientPhone) &&
    order.clientPhone !== PLACEHOLDER_CLIENT_PHONE
      ? order.clientPhone
      : PLACEHOLDER_CLIENT_PHONE;

  return { ...order, clientName, clientEmail, clientPhone };
}

function loadOrders(): Order[] {
  try {
    let raw = localStorage.getItem(ordersKey);
    if (!raw) {
      const legacy = localStorage.getItem(legacyOrdersKey);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy) as Record<string, unknown>[];
        const migrated = Array.isArray(parsedLegacy)
          ? parsedLegacy.map((o) => normalizeOrder(o))
          : [];
        if (migrated.length > 0) {
          localStorage.setItem(ordersKey, JSON.stringify(migrated));
        }
        raw = localStorage.getItem(ordersKey);
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, unknown>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((o) => normalizeOrder(o));
  } catch {
    return [];
  }
}

function saveOrders(orders: Order[]) {
  localStorage.setItem(ordersKey, JSON.stringify(orders));
}

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(usersKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(usersKey, JSON.stringify(users));
}

function loadSessions(): StoredSession[] {
  try {
    const raw = localStorage.getItem(sessionsKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: StoredSession[]) {
  localStorage.setItem(sessionsKey, JSON.stringify(sessions));
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const e = email.trim().toLowerCase();
  return loadUsers().find((u) => u.email === e);
}

export function findUserById(id: string): StoredUser | undefined {
  return loadUsers().find((u) => u.id === id);
}

export function createUser(data: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}): StoredUser {
  const user: StoredUser = {
    id: `usr-${randomHex(6)}`,
    email: data.email.trim().toLowerCase(),
    password: data.password,
    name: data.name.trim(),
    role: data.role,
  };
  const users = loadUsers();
  users.push(user);
  saveUsers(users);
  return user;
}

export function createSession(userId: string): string {
  const token = `sess-${randomHex(16)}`;
  const sessions = loadSessions();
  sessions.push({ token, userId });
  saveSessions(sessions);
  return token;
}

export function revokeSession(token: string) {
  saveSessions(loadSessions().filter((s) => s.token !== token));
}

export function getUserIdByToken(token: string): string | null {
  const s = loadSessions().find((x) => x.token === token);
  return s?.userId ?? null;
}

export function getStoredOrders(): Order[] {
  return loadOrders();
}

export function appendOrder(order: Order) {
  const next = [order, ...loadOrders()];
  saveOrders(next);
}

export function updateOrderStatus(orderId: string, status: OrderStatus): boolean {
  const orders = loadOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return false;
  const next = [...orders];
  const cur = orders[idx]!;
  next[idx] = { ...cur, status };
  saveOrders(next);
  return true;
}
