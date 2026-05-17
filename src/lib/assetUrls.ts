import { publicUrl } from "./publicUrl";
import type { EquipmentItem, Order } from "../types";

export function mapEquipmentItem(item: EquipmentItem): EquipmentItem {
  return { ...item, imageUrl: publicUrl(item.imageUrl) };
}

export function mapOrder(order: Order): Order {
  return { ...order, equipmentImageUrl: publicUrl(order.equipmentImageUrl) };
}
