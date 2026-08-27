# When Is The Next?

> A quiet almanac of countdowns — from the next sunset to deep time.

**When Is The Next?** tracks 24 events across five families — daily sky events, the working week, celestial cycles, calendar oddities, and deep time — and answers each one with a live countdown, an engraved progress plate, and a target date. The same instrument measures five hours to sunset and fifty thousand years until Niagara Falls erodes away.

## Features

* **Live ephemeris** — sunset, dawn, solar noon and blue hour computed for your location with SunCalc; click the location in the masthead to refine it with device GPS.
* **Honest progress** — every plate shows the fraction of its own cycle actually elapsed, anchored to documented dates.
* **Event states** — the weekend knows when it is in progress; the workday knows when you are released.
* **Deep-time units** — countdowns beyond two years switch to years / days / hours / minutes.
* **Keyboard navigation** — `←` and `→` move between entries.
* **Location memory** — your last location is stored locally; nothing is sent anywhere except the IP geolocation lookup.

## Tech stack

* React 19 + Vite
* Framer Motion (honours `prefers-reduced-motion`)
* SunCalc, date-fns
* SCSS with CSS custom properties

## Development

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`.

## Project structure

```text
/src
  ├── App.jsx              # Shell: clock, location, keyboard, plate page
  ├── App.scss             # Design system and responsive rules
  ├── main.jsx             # Entry point
  ├── lib/time.js          # Time engines (sun phases, cycles, fractions)
  ├── data/events.js       # The 24-entry event registry
  └── components/          # Countdown, plates, index, masthead, type
```
