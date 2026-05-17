import { mapEquipmentItem, mapOrder } from "../lib/assetUrls";
import type {
  AuthResponse,
  CreateOrderPayload,
  EquipmentItem,
  LoginPayload,
  Order,
  OrderStatus,
  RegisterPayload,
  UserPublic,
} from "../types";

export const AUTH_TOKEN_KEY = "rentgear_token";

function apiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${p}`;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
}

function authHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Content-Type", "application/json");
  const t = getAuthToken();
  if (t) headers.set("Authorization", `Bearer ${t}`);
  return headers;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const err = (await res.json()) as { message?: string };
      if (err.message) message = err.message;
    } catch {}
    throw new Error(message);
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function registerUser(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  const res = await fetch(apiUrl("api/auth/register"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson<AuthResponse>(res);
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch(apiUrl("api/auth/login"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson<AuthResponse>(res);
}

export async function logoutUser(): Promise<void> {
  const res = await fetch(apiUrl("api/auth/logout"), {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    await parseJson<unknown>(res);
  }
}

export async function fetchMe(): Promise<UserPublic> {
  const res = await fetch(apiUrl("api/auth/me"), { headers: authHeaders() });
  return parseJson<UserPublic>(res);
}

export async function fetchEquipmentList(): Promise<EquipmentItem[]> {
  const res = await fetch(apiUrl("api/equipment"));
  const items = await parseJson<EquipmentItem[]>(res);
  return items.map(mapEquipmentItem);
}

export async function fetchEquipmentById(
  id: string,
): Promise<EquipmentItem> {
  const res = await fetch(apiUrl(`api/equipment/${id}`));
  const item = await parseJson<EquipmentItem>(res);
  return mapEquipmentItem(item);
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(apiUrl("api/orders"), { headers: authHeaders() });
  const orders = await parseJson<Order[]>(res);
  return orders.map(mapOrder);
}

export async function fetchAdminOrders(): Promise<Order[]> {
  const res = await fetch(apiUrl("api/admin/orders"), {
    headers: authHeaders(),
  });
  const orders = await parseJson<Order[]>(res);
  return orders.map(mapOrder);
}

export async function createOrder(
  payload: CreateOrderPayload,
): Promise<Order> {
  const res = await fetch(apiUrl("api/orders"), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const order = await parseJson<Order>(res);
  return mapOrder(order);
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<Order> {
  const res = await fetch(apiUrl(`api/orders/${orderId}`), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  const order = await parseJson<Order>(res);
  return mapOrder(order);
}
