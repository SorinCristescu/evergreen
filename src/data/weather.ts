/**
 * Weather — live forecast from Open-Meteo (https://open-meteo.com): free, no API key, includes
 * geocoding. A module-level cache keys forecasts by coordinates so every screen that asks for the
 * same location (Today's banner, the Weather screen) shares one fetch — i.e. they stay in sync.
 *
 * Coordinates come from the location's stored climate.lat/lon; when those are 0 (locations created
 * during onboarding, which only captured a city name) we geocode the climateLabel first.
 *
 * Fields are chosen for garden care: temperature + feels-like, humidity, wind, rain probability,
 * UV, and daily min (frost) — the inputs a future watering/notification engine needs.
 */
import { useEffect, useState } from 'react';

import type { LocationRef } from './types';

/** Condition family → which animated glyph to show (see components/ui/weather-glyph). */
export type WeatherKind = 'sun' | 'cloud' | 'rain' | 'snow';

export type ForecastDay = {
  date: string; // ISO yyyy-mm-dd
  label: string; // 'Today' | 'Tomorrow' | weekday
  tempMax: number;
  tempMin: number;
  condition: string;
  kind: WeatherKind;
  precipProb?: number; // %
  wind?: number; // km/h (max)
  uvIndex?: number; // max
};

export type Forecast = {
  place: string;
  current: {
    temp: number;
    feelsLike: number;
    humidity: number; // %
    wind: number; // km/h
    condition: string;
    kind: WeatherKind;
  };
  days: ForecastDay[]; // today, tomorrow, day-after
};

export type ForecastLoc = Pick<LocationRef, 'id' | 'climateLabel' | 'lat' | 'lon'>;

// WMO weather-interpretation codes → label + condition family.
const WMO: { codes: number[]; label: string; kind: WeatherKind }[] = [
  { codes: [0], label: 'Clear', kind: 'sun' },
  { codes: [1], label: 'Mostly clear', kind: 'sun' },
  { codes: [2], label: 'Partly cloudy', kind: 'cloud' },
  { codes: [3], label: 'Overcast', kind: 'cloud' },
  { codes: [45, 48], label: 'Fog', kind: 'cloud' },
  { codes: [51, 53, 55, 56, 57], label: 'Drizzle', kind: 'rain' },
  { codes: [61, 63, 65, 66, 67, 80, 81, 82], label: 'Rain', kind: 'rain' },
  { codes: [71, 73, 75, 77, 85, 86], label: 'Snow', kind: 'snow' },
  { codes: [95, 96, 99], label: 'Thunderstorm', kind: 'rain' },
];

function decode(code: number): { label: string; kind: WeatherKind } {
  return WMO.find((w) => w.codes.includes(code)) ?? { label: 'Cloudy', kind: 'cloud' };
}

function dayLabel(iso: string, i: number): string {
  if (i === 0) return 'Today';
  if (i === 1) return 'Tomorrow';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
}

async function resolveCoords(loc: ForecastLoc): Promise<{ lat: number; lon: number; place: string } | null> {
  if (loc.lat && loc.lon && !(loc.lat === 0 && loc.lon === 0)) {
    return { lat: loc.lat, lon: loc.lon, place: loc.climateLabel };
  }
  const name = (loc.climateLabel || '').split(',')[0].trim();
  if (!name) return null;
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`);
    const json = await res.json();
    const hit = json?.results?.[0];
    if (!hit) return null;
    return { lat: hit.latitude, lon: hit.longitude, place: loc.climateLabel || hit.name };
  } catch {
    return null;
  }
}

async function fetchForecast(loc: ForecastLoc): Promise<Forecast | null> {
  const coords = await resolveCoords(loc);
  if (!coords) return null;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max` +
    `&timezone=auto&forecast_days=3`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json();
    const cur = decode(j.current.weather_code);
    const days: ForecastDay[] = (j.daily.time as string[]).slice(0, 3).map((iso, i) => {
      const dec = decode(j.daily.weather_code[i]);
      return {
        date: iso,
        label: dayLabel(iso, i),
        tempMax: Math.round(j.daily.temperature_2m_max[i]),
        tempMin: Math.round(j.daily.temperature_2m_min[i]),
        condition: dec.label,
        kind: dec.kind,
        precipProb: j.daily.precipitation_probability_max?.[i] ?? undefined,
        wind: j.daily.wind_speed_10m_max?.[i] != null ? Math.round(j.daily.wind_speed_10m_max[i]) : undefined,
        uvIndex: j.daily.uv_index_max?.[i] != null ? Math.round(j.daily.uv_index_max[i]) : undefined,
      };
    });
    return {
      place: coords.place,
      current: {
        temp: Math.round(j.current.temperature_2m),
        feelsLike: Math.round(j.current.apparent_temperature),
        humidity: Math.round(j.current.relative_humidity_2m),
        wind: Math.round(j.current.wind_speed_10m),
        condition: cur.label,
        kind: cur.kind,
      },
      days,
    };
  } catch {
    return null;
  }
}

const cache = new Map<string, Forecast>();
const inflight = new Map<string, Promise<Forecast | null>>();

function keyFor(loc: ForecastLoc): string {
  return loc.lat && loc.lon && !(loc.lat === 0 && loc.lon === 0)
    ? `${loc.lat},${loc.lon}`
    : `name:${(loc.climateLabel || '').toLowerCase()}`;
}

/**
 * Live forecast for a location. `undefined` while loading (or if the lookup failed). Shares a
 * module cache + in-flight de-dupe by coordinates, so repeated calls across screens hit the
 * network once and render identical data.
 */
export function useForecast(loc?: ForecastLoc): Forecast | undefined {
  const key = loc ? keyFor(loc) : '';
  const [data, setData] = useState<Forecast | undefined>(() => (key ? cache.get(key) : undefined));

  useEffect(() => {
    if (!loc || !key) return;
    const cached = cache.get(key);
    if (cached) {
      setData(cached);
      return;
    }
    let alive = true;
    let pending = inflight.get(key);
    if (!pending) {
      pending = fetchForecast(loc);
      inflight.set(key, pending);
    }
    pending.then((f) => {
      inflight.delete(key);
      if (f) cache.set(key, f);
      if (alive) setData(f ?? undefined);
    });
    return () => {
      alive = false;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return data;
}

/**
 * A single most-relevant garden care tip derived from the forecast (frost > rain > wind > dry air
 * > high UV). Returns null when conditions are unremarkable. Drives the Weather screen hint today,
 * and is the seed of the care-notification rules later.
 */
export type CareTip = { icon: 'warning' | 'droplet' | 'rain' | 'wind' | 'sun'; text: string };

export function careTipFor(fc: Forecast): CareTip | null {
  const d0 = fc.days[0];
  if (d0 && d0.tempMin <= 2) return { icon: 'warning', text: 'Frost risk tonight — bring tender plants indoors.' };
  if (d0 && (d0.kind === 'rain' || (d0.precipProb ?? 0) >= 60)) return { icon: 'droplet', text: 'Rain likely — outdoor watering can wait.' };
  if (d0 && (d0.wind ?? 0) >= 35) return { icon: 'wind', text: 'Windy — shelter pots and stake tall plants.' };
  if (fc.current.humidity <= 35) return { icon: 'rain', text: 'Dry air — mist your humidity-loving plants.' };
  if (d0 && (d0.uvIndex ?? 0) >= 8) return { icon: 'sun', text: 'High UV — shade sun-sensitive leaves midday.' };
  return null;
}
