import type { OrderStatus } from "../types";

export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "На рассмотрении";
    case "confirmed":
      return "Подтверждена";
    case "completed":
      return "Завершена";
    default:
      return status;
  }
}
