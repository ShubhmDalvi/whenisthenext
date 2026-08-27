import { addDays, nextSaturday, startOfDay } from "date-fns";
import {
  dayFraction, getNextSunPhase, getNextBlueHour,
  getNextCycle, cycleProgress, fractionBetween,
  getNextAnnualDate, annualProgress, getNextWorkEnd,
  getNextFriday13, getLastFriday13,
} from "../lib/time";

const SUPERMOON_BASE = "2025-11-05T00:00:00";
const SUPERMOON_PERIOD_DAYS = 413.4;

const SOLAR_MAX_BASE = "2025-07-01T00:00:00";
const SOLAR_CYCLE_DAYS = 4015;

const SAROS_BASE = "2026-08-12T17:46:00Z";
const SAROS_DAYS = 6585.32;

const MARS_OPPOSITION_BASE = "2025-01-16T00:00:00";
const MARS_SYNODIC_DAYS = 779.94;

const HALLEY_LAST_PERIHELION = "1986-02-09T00:00:00";
const HALLEY_NEXT_PERIHELION = "2061-07-28T00:00:00";

const GALACTIC_SEGMENT_BASE = "2000-01-01T00:00:00";
const GALACTIC_SEGMENT_DAYS = 365250;

const UNIX_EPOCH = "1970-01-01T00:00:00Z";
const UNIX_TWO_BILLION = "2033-05-18T03:33:20Z";
const UNIX_OVERFLOW = "2038-01-19T03:14:07Z";

const HALVING_LAST = "2024-04-19T00:00:00";
const HALVING_NEXT_EST = "2028-04-17T00:00:00";

const KARDASHEV_SCALE_PROPOSED = "1964-01-01T00:00:00";
const KARDASHEV_TYPE_I_EST = "2125-01-01T00:00:00";

const CHERNOBYL_ACCIDENT = "1986-04-26T00:00:00";
const CHERNOBYL_SAFE_YEAR = 22000;

const VOYAGER_LAUNCH = "1977-09-05T00:00:00";
const VOYAGER_ARRIVAL_YEAR = 42000;

const NIAGARA_FORMED_YEAR = -10000;
const NIAGARA_DRY_YEAR = 52000;

export const EVENTS = [
  {
    id: "01", category: "Atmospherics", family: "diurnal",
    title: "Next Sunset", color: "var(--c-atmospherics)",
    meta: (ctx) => `Horizon · ${ctx.locationName}`,
    resolve: (ctx) => ({
      date: getNextSunPhase("sunset", ctx.coords),
      progress: dayFraction(ctx.now),
    }),
  },
  {
    id: "02", category: "Atmospherics", family: "diurnal",
    title: "First Light", color: "var(--c-atmospherics)",
    meta: "Civil twilight · dawn",
    resolve: (ctx) => ({
      date: getNextSunPhase("dawn", ctx.coords),
      progress: dayFraction(ctx.now),
    }),
  },
  {
    id: "03", category: "Atmospherics", family: "diurnal",
    title: "Solar Noon", color: "var(--c-atmospherics)",
    meta: "Zenith · maximum height",
    resolve: (ctx) => ({
      date: getNextSunPhase("solarNoon", ctx.coords),
      progress: dayFraction(ctx.now),
    }),
  },
  {
    id: "04", category: "Atmospherics", family: "diurnal",
    title: "Blue Hour", color: "var(--c-atmospherics)",
    meta: "Nautical twilight",
    resolve: (ctx) => {
      const next = getNextBlueHour(ctx.coords);
      return { date: next.date, progress: dayFraction(ctx.now), note: `occurs at ${next.label}` };
    },
  },
  {
    id: "05", category: "Atmospherics", family: "orbital",
    title: "Supermoon", color: "var(--c-atmospherics)",
    meta: "Lunar perigee · est.",
    resolve: () => ({
      date: getNextCycle(SUPERMOON_BASE, SUPERMOON_PERIOD_DAYS),
      progress: cycleProgress(SUPERMOON_BASE, SUPERMOON_PERIOD_DAYS),
    }),
  },
  {
    id: "06", category: "Atmospherics", family: "linear",
    title: "Perseids Peak", color: "var(--c-atmospherics)",
    meta: "Meteor shower · 12 Aug",
    resolve: () => ({ date: getNextAnnualDate(7, 12), progress: annualProgress(7, 12) }),
  },
  {
    id: "07", category: "Atmospherics", family: "linear",
    title: "Earth Perihelion", color: "var(--c-atmospherics)",
    meta: "Maximum velocity · 4 Jan",
    resolve: () => ({ date: getNextAnnualDate(0, 4), progress: annualProgress(0, 4) }),
  },

  {
    id: "08", category: "Chronology", family: "linear",
    title: "Workday End", color: "var(--c-chronology)",
    meta: "Release · 17:00 local",
    resolve: (ctx) => {
      const now = ctx.now;
      const day = now.getDay();
      const h = now.getHours();
      const weekday = day >= 1 && day <= 5;
      const date = getNextWorkEnd();
      if (weekday && h >= 9 && h < 17) {
        const progress = ((h - 9) * 3600 + now.getMinutes() * 60 + now.getSeconds()) / (8 * 3600);
        return { date, progress };
      }
      if (weekday && h < 9) return { date, progress: 0, note: "opens 09:00" };
      if (weekday) {
        return { date, progress: 1, note: day === 5 ? "released · until Monday" : "released · until tomorrow" };
      }
      return { date, progress: 1, note: "off duty · weekend" };
    },
  },
  {
    id: "09", category: "Chronology", family: "linear",
    title: "Weekend", color: "var(--c-chronology)",
    meta: "Rest · begins Saturday",
    resolve: (ctx) => {
      const now = ctx.now;
      const day = now.getDay();
      if (day === 6 || day === 0) {
        const start = addDays(startOfDay(now), day === 6 ? 0 : -1);
        const end = addDays(startOfDay(now), day === 6 ? 2 : 1);
        return {
          date: end,
          progress: (now - start) / (end - start),
          note: "in progress · ends Monday",
        };
      }
      const next = nextSaturday(now);
      next.setHours(0, 0, 0, 0);
      const monday = addDays(startOfDay(now), 1 - day);
      return {
        date: next,
        progress: Math.min(Math.max((now - monday) / (next - monday), 0), 1),
      };
    },
  },
  {
    id: "10", category: "Chronology", family: "linear",
    title: "Mid-Year", color: "var(--c-chronology)",
    meta: "Orbit 50 percent · 2 Jul",
    resolve: () => ({ date: getNextAnnualDate(6, 2), progress: annualProgress(6, 2) }),
  },
  {
    id: "11", category: "Chronology", family: "linear",
    title: "New Year", color: "var(--c-chronology)",
    meta: "Orbit complete · 1 Jan",
    resolve: () => ({ date: getNextAnnualDate(0, 1), progress: annualProgress(0, 1) }),
  },

  {
    id: "12", category: "Cosmos", family: "orbital",
    title: "Solar Maximum", color: "var(--c-cosmos)",
    meta: "Sunspot cycle 25 · est.",
    resolve: () => ({
      date: getNextCycle(SOLAR_MAX_BASE, SOLAR_CYCLE_DAYS),
      progress: cycleProgress(SOLAR_MAX_BASE, SOLAR_CYCLE_DAYS),
    }),
  },
  {
    id: "13", category: "Cosmos", family: "orbital",
    title: "Total Eclipse", color: "var(--c-cosmos)",
    meta: "Saros cycle · 18 yrs",
    utc: true,
    resolve: () => ({
      date: getNextCycle(SAROS_BASE, SAROS_DAYS),
      progress: cycleProgress(SAROS_BASE, SAROS_DAYS),
    }),
  },
  {
    id: "14", category: "Cosmos", family: "orbital",
    title: "Mars Opposition", color: "var(--c-cosmos)",
    meta: "Minimum distance · est.",
    resolve: () => ({
      date: getNextCycle(MARS_OPPOSITION_BASE, MARS_SYNODIC_DAYS),
      progress: cycleProgress(MARS_OPPOSITION_BASE, MARS_SYNODIC_DAYS),
    }),
  },
  {
    id: "15", category: "Cosmos", family: "orbital",
    title: "Halley's Comet", color: "var(--c-cosmos)",
    meta: "75-year orbit · return 2061",
    resolve: () => ({
      date: new Date(HALLEY_NEXT_PERIHELION),
      progress: fractionBetween(HALLEY_LAST_PERIHELION, HALLEY_NEXT_PERIHELION),
    }),
  },
  {
    id: "16", category: "Cosmos", family: "linear",
    title: "Galactic Tick", color: "var(--c-cosmos)",
    meta: "Solar orbit · 1000-year segment",
    resolve: () => ({
      date: getNextCycle(GALACTIC_SEGMENT_BASE, GALACTIC_SEGMENT_DAYS),
      progress: cycleProgress(GALACTIC_SEGMENT_BASE, GALACTIC_SEGMENT_DAYS),
    }),
  },

  {
    id: "17", category: "Anomalies", family: "linear",
    title: "Friday the 13th", color: "var(--c-anomalies)",
    meta: "Calendar coincidence",
    resolve: () => {
      const next = getNextFriday13();
      const last = getLastFriday13();
      return {
        date: next,
        progress: last ? fractionBetween(last, next) : 0,
      };
    },
  },
  {
    id: "18", category: "Anomalies", family: "linear",
    title: "Unix 2 Billion", color: "var(--c-anomalies)",
    meta: "Epoch · two billion seconds",
    utc: true,
    resolve: () => ({
      date: new Date(UNIX_TWO_BILLION),
      progress: fractionBetween(UNIX_EPOCH, UNIX_TWO_BILLION),
    }),
  },
  {
    id: "19", category: "Anomalies", family: "linear",
    title: "Bitcoin Halving", color: "var(--c-anomalies)",
    meta: "Block reward division · est.",
    resolve: () => ({
      date: new Date(HALVING_NEXT_EST),
      progress: fractionBetween(HALVING_LAST, HALVING_NEXT_EST),
    }),
  },
  {
    id: "20", category: "Anomalies", family: "linear",
    title: "Kardashev Type I", color: "var(--c-anomalies)",
    meta: "Planetary civilisation · est.",
    resolve: () => ({
      date: new Date(KARDASHEV_TYPE_I_EST),
      progress: fractionBetween(KARDASHEV_SCALE_PROPOSED, KARDASHEV_TYPE_I_EST),
    }),
  },

  {
    id: "21", category: "Deep Time", family: "linear",
    title: "Chernobyl Safe", color: "var(--c-deeptime)",
    meta: "Radiation decay · ~20,000 yrs",
    resolve: () => ({
      date: new Date(CHERNOBYL_SAFE_YEAR, 0, 1),
      progress: fractionBetween(CHERNOBYL_ACCIDENT, new Date(CHERNOBYL_SAFE_YEAR, 0, 1)),
    }),
  },
  {
    id: "22", category: "Deep Time", family: "linear",
    title: "The 2038 Problem", color: "var(--c-deeptime)",
    meta: "Integer overflow · 32-bit",
    utc: true,
    resolve: () => ({
      date: new Date(UNIX_OVERFLOW),
      progress: fractionBetween(UNIX_EPOCH, UNIX_OVERFLOW),
    }),
  },
  {
    id: "23", category: "Deep Time", family: "linear",
    title: "Voyager Arrival", color: "var(--c-deeptime)",
    meta: "Gliese 445 · est.",
    resolve: () => ({
      date: new Date(VOYAGER_ARRIVAL_YEAR, 0, 1),
      progress: fractionBetween(VOYAGER_LAUNCH, new Date(VOYAGER_ARRIVAL_YEAR, 0, 1)),
    }),
  },
  {
    id: "24", category: "Deep Time", family: "linear",
    title: "Niagara Dry", color: "var(--c-deeptime)",
    meta: "Erosion complete · est.",
    resolve: () => ({
      date: new Date(NIAGARA_DRY_YEAR, 0, 1),
      progress: fractionBetween(new Date(NIAGARA_FORMED_YEAR, 0, 1), new Date(NIAGARA_DRY_YEAR, 0, 1)),
    }),
  },
];

export const CATEGORIES = [...new Set(EVENTS.map((e) => e.category))];
