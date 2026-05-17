import type { WeatherSummary } from "../types";

async function fetchOpenMeteo(
  latitude: number,
  longitude: number,
  cityLabel: string,
): Promise<WeatherSummary> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current_weather", "true");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`open-meteo ${res.status}`);
  }
  const data = (await res.json()) as {
    current_weather?: {
      temperature: number;
      windspeed: number;
      weathercode: number;
      time: string;
    };
  };
  const cw = data.current_weather;
  if (!cw) {
    throw new Error("open-meteo: нет current_weather");
  }
  return {
    city: cityLabel,
    current: {
      temperature: cw.temperature,
      windspeed: cw.windspeed,
      weathercode: cw.weathercode,
      time: cw.time,
    },
  };
}

type SevenTimerPayload = {
  dataseries?: Array<{
    temp2m?: number | string;
    wind10m?: { speed?: number };
    prec_type?: string
  }>;
};

function parseTemp2m(raw: number | string | undefined): number {
  if (raw == null) return 0;
  if (typeof raw === "number" && !Number.isNaN(raw)) return raw;
  const parts = String(raw)
    .split("_")
    .map((p) => Number.parseInt(p, 10))
    .filter((n) => !Number.isNaN(n));
  if (parts.length === 0) return 0;
  if (parts.length === 1) return parts[0] ?? 0;
  const a = parts[0] ?? 0;
  const b = parts[1] ?? a;
  return Math.round((a + b) / 2);
}

function precToCode(prec: string | undefined): number {
  switch (prec) {
    case "none":
      return 0;
    case "rain":
      return 61;
    case "snow":
      return 71;
    case "ice":
      return 56;
    case "frzraine":
      return 67;
    default:
      return 3;
  }
}

async function fetchSevenTimer(
  latitude: number,
  longitude: number,
  cityLabel: string,
): Promise<WeatherSummary> {
  const u = new URL("https://www.7timer.info/bin/api.pl");
  u.searchParams.set("lon", String(longitude));
  u.searchParams.set("lat", String(latitude));
  u.searchParams.set("product", "civil");
  u.searchParams.set("output", "json");

  const res = await fetch(u.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`7timer ${res.status}`);
  }
  const data = (await res.json()) as SevenTimerPayload;
  const ds = data.dataseries?.[0];
  if (!ds) {
    throw new Error("7timer: пустой ответ");
  }
  const temperature = parseTemp2m(ds.temp2m);
  const windScale = typeof ds.wind10m?.speed === "number" ? ds.wind10m.speed : 0;
  const windspeed = Math.min(130, Math.max(0, windScale * 6));
  const weathercode = precToCode(ds.prec_type);
  const time = new Date().toISOString().slice(0, 16).replace("T", " ");
  return {
    city: cityLabel,
    current: {
      temperature,
      windspeed,
      weathercode,
      time,
    },
  };
}

export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
  cityLabel: string,
): Promise<WeatherSummary> {
  try {
    return await fetchOpenMeteo(latitude, longitude, cityLabel);
  } catch (first) {
    console.warn("[RentGear] Open-Meteo недоступен, пробуем 7timer:", first);
    try {
      return await fetchSevenTimer(latitude, longitude, cityLabel);
    } catch (second) {
      console.warn("[RentGear] 7timer:", second);
      throw new Error("Не удалось загрузить погоду");
    }
  }
}

export function describeWmoCode(code: number): string {
  if (code === 0) return "Ясно";
  if (code <= 3) return "Переменная облачность";
  if (code <= 48) return "Туман";
  if (code <= 57) return "Изморозь / морось";
  if (code <= 67) return "Дождь";
  if (code <= 77) return "Снег";
  if (code <= 82) return "Ливень";
  if (code <= 86) return "Снегопад";
  if (code <= 99) return "Гроза";
  return "Переменная погода";
}
