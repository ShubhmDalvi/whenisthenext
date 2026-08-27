import { useMemo } from "react";
import { motion } from "framer-motion";
import SunCalc from "suncalc";

const SAMPLES = 96;
const RAD2DEG = 180 / Math.PI;
const EASE = [0.22, 1, 0.36, 1];
const Fill = motion.div;

const clamp01 = (p) => Math.min(Math.max(p ?? 0, 0), 1);

const SolarCurve = ({ coords, progress, color, dayKey }) => {
  const w = 320;
  const h = 96;
  const pad = 10;

  const alts = useMemo(() => {
    const start = new Date(dayKey);
    start.setHours(0, 0, 0, 0);
    const out = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const t = new Date(start.getTime() + (i / SAMPLES) * 86400000);
      out.push(SunCalc.getPosition(t, coords.lat, coords.lng).altitude * RAD2DEG);
    }
    return out;
  }, [coords.lat, coords.lng, dayKey]);

  const lo = Math.min(...alts, 0);
  const hi = Math.max(...alts, 0);
  const span = Math.max(hi - lo, 1);
  const y = (a) => pad + (1 - (a - lo) / span) * (h - pad * 2);

  const path = alts
    .map((a, i) => `${i === 0 ? "M" : "L"} ${((i / SAMPLES) * w).toFixed(1)} ${y(a).toFixed(2)}`)
    .join(" ");

  const p = clamp01(progress);
  const idx = p * SAMPLES;
  const i0 = Math.min(Math.floor(idx), SAMPLES - 1);
  const frac = idx - i0;
  const nowAlt = alts[i0] * (1 - frac) + alts[i0 + 1] * frac;
  const mx = p * w;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="plate-svg" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" y1={y(0)} x2={w} y2={y(0)} className="plate-horizon" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.1" opacity="0.6" />
      <line x1={mx} y1="4" x2={mx} y2={h - 4} stroke={color} strokeWidth="1" strokeDasharray="2 3" opacity="0.4" />
      <circle cx={mx} cy={y(nowAlt)} r="3.2" fill={color} />
      <circle cx={mx} cy={y(nowAlt)} r="6" fill="none" stroke={color} strokeWidth="0.75" opacity="0.4" />
    </svg>
  );
};

const OrbitalPlate = ({ progress, color }) => {
  const size = 128;
  const r = 46;
  const cx = size / 2;
  const cy = size / 2;
  const p = clamp01(progress);
  const rad = ((p * 360 - 90) * Math.PI) / 180;
  const mx = cx + r * Math.cos(rad);
  const my = cy + r * Math.sin(rad);
  const large = p > 0.5 ? 1 : 0;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="plate-svg" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" className="plate-ring" />
      <circle cx={cx} cy={cy} r={r - 10} fill="none" className="plate-ring plate-ring--dashed" />
      <path
        d={`M ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${mx} ${my}`}
        fill="none" stroke={color} strokeWidth="1.4" opacity="0.6"
      />
      <circle cx={cx} cy={cy} r="1.6" fill={color} opacity="0.5" />
      <circle cx={mx} cy={my} r="3.2" fill={color} />
    </svg>
  );
};

const LinearPlate = ({ progress, color }) => {
  const p = clamp01(progress);
  return (
    <div className="plate-linear" aria-hidden="true">
      <div className="plate-linear__track">
        <Fill
          className="plate-linear__fill"
          style={{ backgroundColor: color }}
          initial={false}
          animate={{ width: `${p * 100}%` }}
          transition={{ duration: 0.6, ease: EASE }}
        />
        {[0, 25, 50, 75, 100].map((t) => (
          <div key={t} className="plate-linear__tick" style={{ left: `${t}%` }} />
        ))}
      </div>
    </div>
  );
};

const Plate = ({ family, progress, color, coords, dayKey }) => {
  if (family === "diurnal") return <SolarCurve coords={coords} progress={progress} color={color} dayKey={dayKey} />;
  if (family === "orbital") return <OrbitalPlate progress={progress} color={color} />;
  return <LinearPlate progress={progress} color={color} />;
};

export default Plate;
