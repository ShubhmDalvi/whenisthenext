import SunCalc from "suncalc";
import { addDays, addMonths, format } from "date-fns";

const DAY_MS = 86400000;

export const YEAR_SECONDS = 31557600;

export const dayFraction = (date) =>
  (date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()) / 86400;

export const getNextSunPhase = (phase, coords) => {
  const now = new Date();
  for (const base of [now, addDays(now, 1)]) {
    const times = SunCalc.getTimes(base, coords.lat, coords.lng);
    const t = times[phase];
    if (t && !isNaN(t) && t > now) return t;
  }
  return addDays(now, 1);
};

export const getNextBlueHour = (coords) => {
  const now = new Date();
  for (const base of [now, addDays(now, 1), addDays(now, 2)]) {
    const times = SunCalc.getTimes(base, coords.lat, coords.lng);
    const candidates = [
      { t: times.nauticalDawn, label: "dawn" },
      { t: times.nauticalDusk, label: "dusk" },
    ];
    for (const c of candidates) {
      if (c.t && !isNaN(c.t) && c.t > now) return { date: c.t, label: c.label };
    }
  }
  return { date: addDays(now, 1), label: "dusk" };
};

export const getNextCycle = (baseIso, cycleDays) => {
  const base = new Date(baseIso).getTime();
  const cycleMs = cycleDays * DAY_MS;
  const now = Date.now();
  if (now <= base) return new Date(base);
  const passed = Math.floor((now - base) / cycleMs);
  return new Date(base + (passed + 1) * cycleMs);
};

export const cycleProgress = (baseIso, cycleDays) => {
  const base = new Date(baseIso).getTime();
  const cycleMs = cycleDays * DAY_MS;
  const now = Date.now();
  if (now <= base) return 0;
  const passed = Math.floor((now - base) / cycleMs);
  return (now - (base + passed * cycleMs)) / cycleMs;
};

export const fractionBetween = (from, to) => {
  const a = from instanceof Date ? from.getTime() : new Date(from).getTime();
  const b = to instanceof Date ? to.getTime() : new Date(to).getTime();
  const now = Date.now();
  if (now <= a) return 0;
  if (now >= b) return 1;
  return (now - a) / (b - a);
};

export const getNextAnnualDate = (month, day) => {
  const now = new Date();
  const y = now.getFullYear();
  const candidate = new Date(y, month, day);
  const endOfThatDay = new Date(y, month, day, 23, 59, 59, 999);
  return endOfThatDay < now ? new Date(y + 1, month, day) : candidate;
};

export const annualProgress = (month, day) => {
  const now = new Date();
  const next = getNextAnnualDate(month, day);
  let last = new Date(now.getFullYear(), month, day);
  if (last.getTime() >= next.getTime()) {
    last = new Date(now.getFullYear() - 1, month, day);
  }
  return (now - last) / (next - last);
};

export const isWeekday = (date) => date.getDay() >= 1 && date.getDay() <= 5;

export const getNextWorkEnd = () => {
  const d = new Date();
  d.setHours(17, 0, 0, 0);
  if (d <= new Date()) d.setDate(d.getDate() + 1);
  while (!isWeekday(d)) d.setDate(d.getDate() + 1);
  return d;
};

export const getNextFriday13 = () => {
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const c = addMonths(new Date(now.getFullYear(), now.getMonth(), 13), i);
    if (c.getDay() === 5 && c > now) return c;
  }
  return addDays(now, 1);
};

export const getLastFriday13 = () => {
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const c = addMonths(new Date(now.getFullYear(), now.getMonth(), 13), -i);
    if (c.getDay() === 5 && c <= now) return c;
  }
  return null;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const formatTarget = (date, { utc = false, near = false } = {}) => {
  if (!date || isNaN(date.getTime())) return "unresolved";
  if (date.getFullYear() >= 10000) {
    return `the year ${date.getFullYear().toLocaleString("en-US")}`;
  }
  if (utc) {
    const hh = String(date.getUTCHours()).padStart(2, "0");
    const mm = String(date.getUTCMinutes()).padStart(2, "0");
    const day = `${WEEKDAYS[date.getUTCDay()]}, ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
    return near ? `${day} · ${hh}:${mm} UTC` : `${day} UTC`;
  }
  return format(date, near ? "EEE, d MMM yyyy · HH:mm" : "EEE, d MMM yyyy");
};
