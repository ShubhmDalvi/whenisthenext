import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  addDays, nextSaturday, differenceInSeconds, startOfTomorrow, 
  getYear, startOfMonth, addMonths, isLeapYear 
} from "date-fns";
import SunCalc from "suncalc";
import "./App.scss";

// --- CONFIG: DEFAULT COORDINATES ---
const DEFAULT_COORDS = { lat: 20.5937, lng: 78.9629 }; // Default to India Center

// --- UTILS: ROBUST TIME ENGINES ---

// 1. Sun Phase Engine (Fixed mapping for Blue Hour)
const getNextSunPhase = (phaseName, coords) => {
  const now = new Date();
  let times = SunCalc.getTimes(now, coords.lat, coords.lng);

  // MAP 'blueHour' to actual SunCalc property 'dusk' (Evening Civil Twilight)
  // SunCalc doesn't natively have "blueHour", causing the NaN error.
  const targetProp = phaseName === 'blueHour' ? 'dusk' : phaseName;

  if (!times[targetProp] || isNaN(times[targetProp])) {
      return addDays(now, 1); 
  }

  if (times[targetProp] < now) {
    const tomorrow = addDays(now, 1);
    times = SunCalc.getTimes(tomorrow, coords.lat, coords.lng);
  }
  return times[targetProp];
};

// 2. Cyclical Engine (Fixed for Future Projection)
const getNextCycle = (baseDateStr, cycleDays) => {
    const now = new Date().getTime();
    const base = new Date(baseDateStr).getTime();
    const cycleMs = cycleDays * 24 * 60 * 60 * 1000;

    // Use Math.ceil to ensure we jump to the NEXT cycle in the future
    // Math.max(0, ...) ensures we don't go backwards
    const cyclesPassed = Math.ceil((now - base) / cycleMs);
    const nextCycles = cyclesPassed > 0 ? cyclesPassed : 1;
    
    const nextEventTime = base + (nextCycles * cycleMs);
    return new Date(nextEventTime);
};

// 3. Annual Event Engine
const getNextAnnualDate = (month, day) => {
    const now = new Date();
    let y = now.getFullYear();
    let d = new Date(y, month, day); 
    if (d < now) d = new Date(y + 1, month, day);
    return d;
};

// 4. Workday Engine
const getNextWorkEnd = () => {
    const d = new Date();
    d.setHours(17, 0, 0, 0); 
    if (d < new Date()) d.setDate(d.getDate() + 1);
    while (d.getDay() === 6 || d.getDay() === 0) d.setDate(d.getDate() + 1);
    return d;
};

// 5. Friday 13th
const getNextFriday13 = () => {
    let d = new Date();
    d.setDate(13);
    if (d < new Date()) d = addMonths(d, 1);
    while (d.getDay() !== 5) {
        d = addMonths(d, 1);
        d.setDate(13);
    }
    d.setHours(0,0,0,0);
    return d;
};

// --- HOOK: ALIEN TEXT SCRAMBLER ---
const useScramble = (text) => {
  const [display, setDisplay] = useState(text);
  const chars = "1234567890!@#$%&(){}?";
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplay(text.split("").map((l, idx) => {
        if (idx < i) return text[idx];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(""));
      
      if (i >= text.length) clearInterval(interval);
      i += 1 / 2; 
    }, 30);
    return () => clearInterval(interval);
  }, [text]);
  
  return display;
};

const ScrambleText = ({ text }) => <span>{useScramble(text)}</span>;



// --- COMPONENT: SOLAR WIND PARTICLES ---
const SolarWind = () => {
  const canvasRef = React.useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let particles = [];
    let mouse = { x: -1000, y: -1000 };

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      const particleCount = 70; // Low count for subtlety

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.5, // Very small dots
          baseVx: Math.random() * 0.5 + 0.2, // Drift Right
          baseVy: Math.random() * -0.5 - 0.2, // Drift Up
          vx: 0,
          vy: 0,
          alpha: Math.random() * 0.5 + 0.1 // Varied transparency
        });
      }
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p) => {
        // 1. Calculate Distance to Mouse
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 150; // Interaction radius

        // 2. Physics: Mouse Repulsion (Turbulence)
        if (distance < maxDist) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const force = (maxDist - distance) / maxDist;
          const directionX = forceDirectionX * force * 2; // Strength
          const directionY = forceDirectionY * force * 2;

          p.vx -= directionX;
          p.vy -= directionY;
        }

        // 3. Apply Velocity (Base Wind + Turbulence)
        // Lerp back to base wind speed (Friction/Restoration)
        p.vx = p.vx * 0.95 + p.baseVx * 0.05;
        p.vy = p.vy * 0.95 + p.baseVy * 0.05;

        p.x += p.vx;
        p.y += p.vy;

        // 4. Wrap Around Screen (Infinite Flow)
        if (p.x > canvas.width) p.x = 0;
        if (p.x < 0) p.x = canvas.width;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // 5. Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 180, 200, ${p.alpha})`; // Bluish-Grey dust
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    window.addEventListener("resize", init);
    window.addEventListener("mousemove", handleMouseMove);
    animate();

    return () => {
      window.removeEventListener("resize", init);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="solar-wind-canvas" />;
};


// --- COMPONENT: ORBITAL GEOMETRY (REDESIGNED v2) ---
const OrbitalGeometry = ({ color }) => {
  return (
    <div className="orbital-system">
      <svg viewBox="0 0 400 400" style={{ overflow: "visible" }}>
        
        {/* 1. Large Outer Radar Ring (Dashed & Slow) */}
        <motion.circle 
          cx="200" cy="200" r="195" 
          fill="none" 
          stroke={color} 
          strokeWidth="1"
          strokeOpacity="0.15"
          strokeDasharray="4 8" // Crisp mechanical dashes
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }} // 2 minutes per rotation (super smooth)
        />

        {/* 2. The "Arc" (Asymmetric scanner line) */}
        <motion.circle 
          cx="200" cy="200" r="170" 
          fill="none" 
          stroke={color} 
          strokeWidth="1.5"
          strokeOpacity="0.4"
          strokeDasharray="80 1000" // Creates a single curved line segment
          strokeLinecap="round"
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }} // Counter-clockwise, faster
        />

        {/* 3. The Breathing Core (Subtle Pulse) */}
        <motion.circle 
          cx="200" cy="200" r="150" 
          fill="none" 
          stroke={color} 
          strokeWidth="0.5"
          strokeOpacity="0.2"
          animate={{ scale: [1, 1.02, 1], strokeOpacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        
      </svg>
    </div>
  );
};




const BootSequence = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1600); 
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="boot-layer">
      {/* Option 1: Wrap in {' ... '} (Best for React readability) */}
      <div className="boot-line"> {'>'} SYSTEM_CHECK... OK</div>
      <div className="boot-line"> {'>'} LOADING_MODULES [/////////////] 100%</div>
      <div className="boot-line"> {'>'} GEOLOCATION_TRIANGULATION... LOCKED</div>
      
      {/* Option 2: Use HTML Entity code &gt; */}
      <div className="boot-line"> &gt; WELCOME_USER_01</div>
    </div>
  );
};



// --- COMPONENT: ROBUST MATRIX COUNTDOWN ---
const CountdownMatrix = ({ targetDate }) => {
  const [diff, setDiff] = useState(0);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    // Check if valid date object
    if (!targetDate || isNaN(new Date(targetDate).getTime())) {
        setIsValid(false);
        return;
    } else {
        setIsValid(true);
    }

    const tick = () => {
        const d = differenceInSeconds(targetDate, new Date());
        setDiff(d);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!isValid) return <div className="complete-msg" style={{color: '#FF3B30'}}>TEMPORAL_ERROR // CHECK_LOGS</div>;
  if (diff < 0) return <div className="complete-msg">EVENT_REACHED // SYNCING</div>;

  const d = Math.floor(diff / (3600 * 24));
  const h = Math.floor((diff % (3600 * 24)) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  
  const pad = (n) => n.toString().padStart(2, "0");

  return (
    <div className="count-matrix" style={{ position: 'relative' }}>
       <OrbitalGeometry color="var(--accent-primary)" />
      <div className="col"><div className="val">{pad(d)}</div><div className="label">DAYS</div></div>
      <div className="sep">:</div>
      <div className="col"><div className="val">{pad(h)}</div><div className="label">HRS</div></div>
      <div className="sep">:</div>
      <div className="col"><div className="val">{pad(m)}</div><div className="label">MIN</div></div>
      <div className="sep">:</div>
      <div className="col"><div className="val accent">{pad(s)}</div><div className="label">SEC</div></div>
    </div>
  );
};






export default function App() {
  const [booting, setBooting] = useState(true);
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [locationName, setLocationName] = useState("INITIALIZING...");
  const [signalStatus, setSignalStatus] = useState("SEARCHING"); 
  const [activeIndex, setActiveIndex] = useState(0);

  // --- EFFECT: IP GEOLOCATION (UPDATED PROVIDER) ---
  useEffect(() => {
    // Switching to ipwho.is (More reliable for free tier/local dev)
    fetch("https://ipwho.is/")
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                setCoords({ lat: data.latitude, lng: data.longitude });
                setLocationName(`${data.city.toUpperCase()}, ${data.country_code}`);
                setSignalStatus("LOCKED");
            } else {
                throw new Error("Geo Failed");
            }
        })
        .catch(err => {
            console.warn("Geo Error:", err);
            // If it fails, we just keep the default (India) coordinates
            setLocationName("BASE_STATION (DEFAULT)");
            setSignalStatus("OFFLINE");
        });
  }, []);

  // --- DATA: THE EXPANDED EVENT UNIVERSE ---
  const events = [
    // --- SECTOR 01: ATMOSPHERICS ---
    {
        id: "A-01",
        category: "ATMOSPHERICS",
        title: "Next Sunset",
        meta: `Horizon // ${locationName}`,
        color: "#FF9F1C", 
        getDate: () => getNextSunPhase("sunset", coords)
    },
    {
        id: "A-02",
        category: "ATMOSPHERICS",
        title: "First Light",
        meta: "Civil_Twilight // Dawn",
        color: "#E09F3E",
        getDate: () => getNextSunPhase("dawn", coords)
    },
    {
        id: "A-03",
        category: "ATMOSPHERICS",
        title: "Solar Noon",
        meta: "Zenith // Max_Height",
        color: "#FFD700",
        getDate: () => getNextSunPhase("solarNoon", coords)
    },
    {
        id: "A-04",
        category: "ATMOSPHERICS",
        title: "Blue Hour",
        meta: "Twilight_Deep // Optimum",
        color: "#4361EE", 
        // FIXED: Now maps to 'dusk' internally
        getDate: () => getNextSunPhase("blueHour", coords) 
    },
    {
        id: "A-05",
        category: "ATMOSPHERICS",
        title: "Supermoon",
        meta: "Lunar_Perigee // Cyclic",
        color: "#E0E1DD",
        // FIXED: Logic now forces future date
        getDate: () => getNextCycle("2025-11-05T00:00:00", 413.4) 
    },
    {
        id: "A-06",
        category: "ATMOSPHERICS",
        title: "Perseids Peak",
        meta: "Meteor_Shower // Aug_12",
        color: "#7209B7",
        getDate: () => getNextAnnualDate(7, 12)
    },
    {
        id: "A-07",
        category: "ATMOSPHERICS",
        title: "Earth Perihelion",
        meta: "Max_Velocity // Jan_4",
        color: "#D90429",
        getDate: () => getNextAnnualDate(0, 4)
    },

    // --- SECTOR 02: CHRONOLOGY ---
    {
        id: "T-01",
        category: "CHRONOLOGY",
        title: "Workday End",
        meta: "Corp_Release // 17:00",
        color: "#2EC4B6", 
        getDate: () => getNextWorkEnd()
    },
    {
        id: "T-02",
        category: "CHRONOLOGY",
        title: "Weekend",
        meta: "System_Rest // Global",
        color: "#00E0FF",
        getDate: () => nextSaturday(new Date())
    },
    {
        id: "T-03",
        category: "CHRONOLOGY",
        title: "Mid-Year",
        meta: "Orbit_50% // Checkpoint",
        color: "#F72585", 
        getDate: () => getNextAnnualDate(6, 2)
    },
    {
        id: "T-04",
        category: "CHRONOLOGY",
        title: "New Year",
        meta: "Orbit_Complete // 365d",
        color: "#FFD700",
        getDate: () => getNextAnnualDate(0, 1)
    },

    // --- SECTOR 03: COSMOS ---
    {
        id: "C-01",
        category: "COSMOS",
        title: "Solar Max",
        meta: "Sunspot_Cycle_25 // Peak",
        color: "#FF5400",
        getDate: () => getNextCycle("2025-07-01T00:00:00", 4015) 
    },
    {
        id: "C-02",
        category: "COSMOS",
        title: "Total Eclipse",
        meta: "Saros_Cycle // 18yrs",
        color: "#10002B", 
        getDate: () => getNextCycle("2026-08-12T17:00:00", 6585.3) 
    },
    {
        id: "C-03",
        category: "COSMOS",
        title: "Mars Opposition",
        meta: "Min_Distance // Red",
        color: "#E63946",
        getDate: () => getNextCycle("2025-01-16T00:00:00", 780)
    },
    {
        id: "C-04",
        category: "COSMOS",
        title: "Halley's Comet",
        meta: "75_Year_Orbit // Return",
        color: "#90E0EF",
        getDate: () => getNextCycle("1986-02-09T00:00:00", 27400)
    },
    {
        id: "C-05",
        category: "COSMOS",
        title: "Galactic Tick",
        meta: "Sun_Orbit_Segment",
        color: "#FFFFFF",
        getDate: () => getNextCycle("2000-01-01T00:00:00", 365250) 
    },

    // --- SECTOR 04: ANOMALIES ---
    {
        id: "G-01",
        category: "ANOMALIES",
        title: "Friday the 13th",
        meta: "Superstition // Detection",
        color: "#FF0055",
        getDate: () => getNextFriday13()
    },
    {
        id: "G-02",
        category: "ANOMALIES",
        title: "Unix 2 Billion",
        meta: "Epoch_Overflow // 32-bit",
        color: "#390099",
        getDate: () => new Date("2033-05-18T03:33:20")
    },
    {
        id: "G-03",
        category: "ANOMALIES",
        title: "Bitcoin Halving",
        meta: "Block_Reward_Div // Crypto",
        color: "#F7931A", 
        getDate: () => new Date("2028-04-17T00:00:00")
    },
    {
        id: "G-04",
        category: "ANOMALIES",
        title: "Kardashev Type I",
        meta: "Planetary_Civ // Est.",
        color: "#00B4D8", 
        getDate: () => new Date("2125-01-01T00:00:00")
    },

    // --- SECTOR 05: DEEP TIME (FIXED: Numeric Date Constructors) ---
    {
        id: "D-01",
        category: "DEEP_TIME",
        title: "Chernobyl Safe",
        meta: "Radiation_Decay // 20k_Yrs",
        color: "#70E000", 
        // FIXED: Using numeric args: Year 22,000, Month 0, Day 1
        getDate: () => new Date(22000, 0, 1) 
    },
    {
        id: "D-02",
        category: "DEEP_TIME",
        title: "The 2038 Problem",
        meta: "Integer_Fail // Critical",
        color: "#FF0000", 
        getDate: () => new Date("2038-01-19T03:14:07")
    },
    {
        id: "D-03",
        category: "DEEP_TIME",
        title: "Voyager Arrival",
        meta: "Gliese_445 // 40k_Yrs",
        color: "#3A0CA3", 
        // FIXED: Year 42,000
        getDate: () => new Date(42000, 0, 1)
    },
    {
        id: "D-04",
        category: "DEEP_TIME",
        title: "Niagara Dry",
        meta: "Erosion_Complete // 50k_Yrs",
        color: "#4CC9F0",
        // FIXED: Year 52,000
        getDate: () => new Date(52000, 0, 1)
    }
  ];

  const currentEvent = events[activeIndex];
  const categories = [...new Set(events.map(e => e.category))];

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-primary', currentEvent.color);
  }, [currentEvent]);

  if (booting) {
    return <BootSequence onComplete={() => setBooting(false)} />;
  }

  return (
    <div className="interface-shell">
      <div className="grid-overlay" />
      <SolarWind /> 

      {/* HEADER */}
      <header className="top-bar">
        <div className="brand">
          <div className="status-light" />
          <span>WHEN_IS_THE_NEXT <span style={{opacity: 0.5}}></span></span>
        </div>
        <div className="sys-info">
          <span style={{ color: signalStatus === "LOCKED" ? "#00FF00" : "#FF3B30" }}>
            NET: {signalStatus}
          </span> 
          <span style={{ marginLeft: '15px', opacity: 0.5 }}>
            UPLINK: {locationName}
          </span>
        </div>
      </header>

      {/* MAIN STAGE */}
      <main className="main-stage">
        
        {/* SCROLLABLE SIDEBAR */}
        <nav className="nav-rail">
          {categories.map(cat => (
             <div key={cat} className="nav-group">
                <div className="group-header">{cat}</div>
                {events.filter(e => e.category === cat).map((evt) => {
                    const idx = events.findIndex(e => e.id === evt.id);
                    return (
                        <div 
                        key={evt.id} 
                        className={`nav-item ${idx === activeIndex ? 'active' : ''}`}
                        onClick={() => setActiveIndex(idx)}
                        >
                        <span className="code">[{evt.id}]</span> {evt.title}
                        </div>
                    );
                })}
             </div>
          ))}
        </nav>

        {/* DISPLAY PORT */}
        <div className="event-viewport">
            <div className="decor-cross tl" />
            <div className="decor-cross tr" />
            <div className="decor-cross bl" />
            <div className="decor-cross br" />

            <AnimatePresence mode="wait">
              <motion.div
                key={currentEvent.id}
                initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(5px)" }}
                transition={{ duration: 0.4 }}
                className="event-card"
              >
                <div className="sub-meta">
                  <span>TARGET_LOCK</span>
                  <ScrambleText text={currentEvent.meta} />
                </div>

                {/* REPLACEMENT: SOLID TERMINAL STYLE */}
<h1 
  className="glitch-title liquid-title" 
  style={{ 
    // We pass the dynamic color as a CSS variable for the gradient
    background: `linear-gradient(120deg, ${currentEvent.color} 30%, #FFFFFF 50%, ${currentEvent.color} 70%)`,
    backgroundSize: '200% auto',
    // Ensure the clip properties are inline to override any potential conflicts
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent'
  }}
>
  <ScrambleText text={currentEvent.title.toUpperCase()} />
</h1>

                <CountdownMatrix targetDate={currentEvent.getDate()} />

                <div className="data-readout">
                    <div>CALC_METHOD: {currentEvent.category === 'ATMOSPHERICS' ? 'IP_TRIANGULATION' : 'PREDICTIVE_ALGO'}</div>
                    <div>LATENCY: 12ms</div>
                </div>
              </motion.div>
            </AnimatePresence>
        </div>
      </main>

      <footer className="status-bar">
        <div>TRACKING_ACTIVE: {events.length} TARGETS</div>
        
        {/* RIGHT SIDE GROUP: GitHub + Memory */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          
          <a 
            href="https://github.com/ShubhmDalvi/whenisthenext"
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              textDecoration: 'none', 
              color: 'inherit', 
              opacity: 0.6,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = 2}
            onMouseLeave={(e) => e.target.style.opacity = 0.6}
          >
            GITHUB
          </a>

          <div>MEMORY: 19%</div>
        </div>
      </footer>
    </div>
  );
}