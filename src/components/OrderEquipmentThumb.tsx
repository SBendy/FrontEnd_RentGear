import { publicUrl } from "../lib/publicUrl";
import type { Order } from "../types";

export function OrderEquipmentThumb({ order }: { order: Order }) {
  return (
    <img
      className="order-thumb"
      src={publicUrl(order.equipmentImageUrl)}
      alt=""
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src = publicUrl("images/equipment/placeholder.svg");
      }}
    />
  );
}
