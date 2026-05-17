export type EquipmentCategory =

  | "Строительство"

  | "Сад и ландшафт"

  | "Склад и логистика"

  | "Генераторы";



export type UserRole = "admin" | "client";



export interface UserPublic {

  id: string;

  email: string;

  name: string;

  role: UserRole;

}



export interface EquipmentItem {

  id: string;

  name: string;

  category: EquipmentCategory;

  description: string;

  dayPriceRub: number;

  depositRub: number;

  imageUrl: string;

  city: string;

  latitude: number;

  longitude: number;

  availableUnits: number;

  specs: { label: string; value: string }[];

}



export type OrderStatus = "pending" | "confirmed" | "completed";



export interface Order {

  id: string;

  equipmentId: string;

  equipmentName: string;

  startDate: string;

  endDate: string;

  totalRub: number;

  status: OrderStatus;

  createdAt: string;

  clientUserId: string;

  clientEmail: string;

  clientName: string;

  clientPhone: string;

  equipmentImageUrl: string;
}



export interface CreateOrderPayload {

  equipmentId: string;

  startDate: string;

  endDate: string;

  clientPhone: string;

}



export interface RegisterPayload {

  email: string;

  password: string;

  name: string;

  role: UserRole;

}



export interface LoginPayload {

  email: string;

  password: string;

}



export interface AuthResponse {

  token: string;

  user: UserPublic;

}



export interface WeatherCurrent {

  temperature: number;

  windspeed: number;

  weathercode: number;

  time: string;

}



export interface WeatherSummary {

  city: string;

  current: WeatherCurrent;

}
