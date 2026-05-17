import type { EquipmentItem, WeatherSummary } from "../types";
import { describeWmoCode } from "../api/weather";

export type DeliveryKind = "pickup" | "delivery";

export type DeliveryQuote = {
  baseRub: number;
  weatherSurchargeRub: number;
  windSurchargeRub: number;
  totalRub: number;
  detailLines: string[];
  showWarning: boolean;
  kind: DeliveryKind;
  sameCityDiscountRub?: number;
  priceBeforeSameCityDiscount?: number;
};

function weatherCodeSurcharge(code: number): { rub: number; key: string } {
  if (code === 0) return { rub: 0, key: "ясно" };
  if (code <= 3) return { rub: 0, key: "облачно" };
  if (code <= 48) return { rub: 600, key: "туман / низкая видимость" };
  if (code <= 57) return { rub: 900, key: "морось / изморозь" };
  if (code <= 67) return { rub: 1600, key: "дождь" };
  if (code <= 77) return { rub: 2200, key: "снег" };
  if (code <= 82) return { rub: 1900, key: "ливень" };
  if (code <= 86) return { rub: 2400, key: "снегопад" };
  if (code <= 99) return { rub: 3200, key: "гроза / опасные явления" };
  return { rub: 400, key: "нестабильная погода" };
}

function windSurcharge(kmh: number): { rub: number; label: string | null } {
  if (kmh >= 75) return { rub: 2000, label: `очень сильный ветер, ${Math.round(kmh)} км/ч` };
  if (kmh >= 55) return { rub: 1200, label: `сильный ветер, ${Math.round(kmh)} км/ч` };
  if (kmh >= 38) return { rub: 550, label: `повышенный ветер, ${Math.round(kmh)} км/ч` };
  return { rub: 0, label: null };
}

export function quoteDeliveryForWeather(
  item: EquipmentItem,
  weather: WeatherSummary | null,
  weatherLoadFailed: boolean,
): Omit<
  DeliveryQuote,
  "kind" | "sameCityDiscountRub" | "priceBeforeSameCityDiscount"
> {
  const baseRub = Math.max(
    2200,
    Math.round(800 + item.dayPriceRub * 0.24 + item.depositRub * 0.012),
  );

  if (weatherLoadFailed) {
    return {
      baseRub,
      weatherSurchargeRub: 0,
      windSurchargeRub: 0,
      totalRub: baseRub,
      detailLines: [
        "Не удалось получить прогноз. Указана базовая доставка; при сложной погоде менеджер сообщит точную сумму.",
      ],
      showWarning: true,
    };
  }

  if (!weather) {
    return {
      baseRub,
      weatherSurchargeRub: 0,
      windSurchargeRub: 0,
      totalRub: baseRub,
      detailLines: [],
      showWarning: false,
    };
  }

  const { current } = weather;
  const { rub: wRub, key: wKey } = weatherCodeSurcharge(current.weathercode);
  const { rub: windRub, label: windLabel } = windSurcharge(current.windspeed);

  const totalRub = baseRub + wRub + windRub;
  const showWarning = wRub > 0 || windRub > 0;

  const detailLines: string[] = [];
  if (wRub > 0) {
    detailLines.push(
      `Ухудшение условий (${wKey}): +${wRub.toLocaleString("ru-RU")} ₽`,
    );
  }
  if (windRub > 0 && windLabel) {
    detailLines.push(
      `${windLabel}: +${windRub.toLocaleString("ru-RU")} ₽`,
    );
  }
  if (!showWarning) {
    detailLines.push(
      `Сейчас: ${describeWmoCode(current.weathercode)} - надбавок по погоде нет.`,
    );
  }

  return {
    baseRub,
    weatherSurchargeRub: wRub,
    windSurchargeRub: windRub,
    totalRub,
    detailLines,
    showWarning,
  };
}

const SAME_CITY_DELIVERY_FACTOR = 0.62;
const SAME_CITY_MIN_TOTAL = 790;

export function quoteDelivery(
  item: EquipmentItem,
  weather: WeatherSummary | null,
  weatherFailed: boolean,
  mode: DeliveryKind,
  deliveryCityName: string,
): DeliveryQuote {
  if (mode === "pickup") {
    return {
      baseRub: 0,
      weatherSurchargeRub: 0,
      windSurchargeRub: 0,
      totalRub: 0,
      detailLines: [
        `Самовывоз со склада в г. ${item.city}. Адрес и график выдачи будет согласован при обратной связи после подтверждения заявки.`,
      ],
      showWarning: false,
      kind: "pickup",
    };
  }

  const raw = quoteDeliveryForWeather(item, weather, weatherFailed);
  const sameCity =
    deliveryCityName.trim().toLowerCase() === item.city.trim().toLowerCase();

  if (!sameCity) {
    return { ...raw, kind: "delivery" };
  }

  const before = raw.totalRub;
  const after = Math.max(
    SAME_CITY_MIN_TOTAL,
    Math.round(before * SAME_CITY_DELIVERY_FACTOR),
  );
  const saved = before - after;

  return {
    ...raw,
    totalRub: after,
    priceBeforeSameCityDiscount: before,
    sameCityDiscountRub: saved,
    detailLines: [
      "Доставка по городу наличия - скидка",
      ...raw.detailLines,
    ],
    kind: "delivery",
  };
}
