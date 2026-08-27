import { useEffect, useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import Masthead from "./components/Masthead";
import Index from "./components/Index";
import Plate from "./components/Plate";
import Countdown from "./components/Countdown";
import InkReveal from "./components/InkReveal";
import { EVENTS, CATEGORIES } from "./data/events";
import { formatTarget } from "./lib/time";
import "./App.scss";

const DEFAULT_COORDS = { lat: 20.5937, lng: 78.9629 };
const STORAGE_KEY = "ephemeris.location";

const loadStoredLocation = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data?.coords?.lat !== "number" || typeof data?.coords?.lng !== "number") return null;
    return data;
  } catch {
    return null;
  }
};

const formatCoords = ({ lat, lng }) =>
  `${Math.abs(lat).toFixed(2)}\u00b0 ${lat >= 0 ? "N" : "S"} \u00b7 ${Math.abs(lng).toFixed(2)}\u00b0 ${lng >= 0 ? "E" : "W"}`;

const PlatePage = motion.div;

export default function App() {
  const [stored] = useState(loadStoredLocation);
  const [now, setNow] = useState(() => new Date());
  const [ready, setReady] = useState(false);
  const [coords, setCoords] = useState(stored?.coords ?? DEFAULT_COORDS);
  const [locationName, setLocationName] = useState(stored?.name ?? "locating\u2026");
  const [status, setStatus] = useState(stored?.status ?? "searching");
  const [locating, setLocating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    const reveal = setTimeout(() => setReady(true), 80);
    return () => { clearInterval(tick); clearTimeout(reveal); };
  }, []);

  useEffect(() => {
    if (status === "searching") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ coords, name: locationName, status }));
    } catch {
      return;
    }
  }, [coords, locationName, status]);

  useEffect(() => {
    if (stored?.status === "precise") return;
    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 6000);

    fetch("https://ipwho.is/", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && typeof data.latitude === "number" && typeof data.longitude === "number") {
          setCoords({ lat: data.latitude, lng: data.longitude });
          setLocationName(`${data.city || "unknown"}, ${data.country_code || ""}`.replace(/, $/, ""));
          setStatus("approximate");
        } else {
          throw new Error("geo failed");
        }
      })
      .catch((err) => {
        if (err?.name === "AbortError" && !timedOut) return;
        setStatus((s) => (s === "searching" ? "estimated" : s));
        setLocationName((n) => (n === "locating\u2026" ? "default reference point" : n));
      })
      .finally(() => clearTimeout(timeout));

    return () => controller.abort();
  }, [stored]);

  const refineLocation = () => {
    if (!navigator.geolocation || locating) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setLocationName(formatCoords(c));
        setStatus("precise");
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000, maximumAge: 600000 }
    );
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      setActiveIndex((i) =>
        e.key === "ArrowRight"
          ? (i + 1) % EVENTS.length
          : (i - 1 + EVENTS.length) % EVENTS.length
      );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const event = EVENTS[activeIndex];
  const resolved = event.resolve({ now, coords, locationName });
  const meta = typeof event.meta === "function"
    ? event.meta({ now, coords, locationName })
    : event.meta;
  const near = resolved.date && resolved.date - now < 48 * 3600 * 1000;
  const dayKey = now.toDateString();

  useEffect(() => {
    document.title = `${EVENTS[activeIndex].title} \u00b7 When Is The Next?`;
  }, [activeIndex]);

  return (
    <MotionConfig reducedMotion="user">
      <div className={`instrument ${ready ? "is-ready" : ""}`}>
        <div className="paper-grain" aria-hidden="true" />

        <Masthead
          now={now}
          locationName={locationName}
          status={status}
          locating={locating}
          onRefineLocation={refineLocation}
        />

        <div className="body">
          <Index
            events={EVENTS}
            categories={CATEGORIES}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
          />

          <main className="plate-frame">
            <AnimatePresence mode="wait">
              <PlatePage
                key={event.id}
                className="plate-page"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="plate-page__eyebrow" style={{ color: event.color }}>
                  <span className="plate-page__eyebrow-num">{event.id}</span>
                  {meta}
                </div>

                <h1 className="plate-page__title">
                  <InkReveal text={event.title} />
                </h1>

                <div
                  className={`plate-box plate-box--${event.family}`}
                  style={{ "--plate-color": event.color }}
                >
                  <div className="plate-page__diagram">
                    <Plate
                      family={event.family}
                      progress={resolved.progress}
                      color={event.color}
                      coords={coords}
                      dayKey={dayKey}
                    />
                  </div>

                  <Countdown target={resolved.date} now={now} />
                </div>

                <div className="plate-page__target">
                  {resolved.note && <span className="plate-page__status">{resolved.note}</span>}
                  <span>
                    &rarr; {resolved.date
                      ? formatTarget(resolved.date, { utc: event.utc, near })
                      : "unresolved"}
                  </span>
                </div>
              </PlatePage>
            </AnimatePresence>
          </main>
        </div>

        <footer className="colophon">
          <span>{EVENTS.length} entries tracked</span>
          <a href="https://github.com/ShubhmDalvi/whenisthenext" target="_blank" rel="noopener noreferrer">
            source
          </a>
        </footer>
      </div>
    </MotionConfig>
  );
}
