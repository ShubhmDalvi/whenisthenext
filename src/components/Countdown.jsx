import { Fragment, useMemo } from "react";
import { differenceInSeconds } from "date-fns";
import RollingNumber from "./RollingNumber";
import { YEAR_SECONDS } from "../lib/time";

const pad = (n) => n.toString().padStart(2, "0");

const Countdown = ({ target, now }) => {
  const valid = target instanceof Date && !isNaN(target.getTime());
  const rawDiff = valid ? differenceInSeconds(target, now) : 0;
  const arrived = valid && rawDiff < 0;
  const diff = Math.max(rawDiff, 0);
  const deep = diff > 730 * 86400;

  const units = useMemo(() => {
    if (deep) {
      const years = Math.floor(diff / YEAR_SECONDS);
      const rem = diff - years * YEAR_SECONDS;
      return [
        { value: years.toLocaleString("en-US"), label: "yrs" },
        { value: pad(Math.floor(rem / 86400)), label: "dys" },
        { value: pad(Math.floor((rem % 86400) / 3600)), label: "hrs" },
        { value: pad(Math.floor((rem % 3600) / 60)), label: "min" },
      ];
    }
    return [
      { value: pad(Math.floor(diff / 86400)), label: "days" },
      { value: pad(Math.floor((diff % 86400) / 3600)), label: "hrs" },
      { value: pad(Math.floor((diff % 3600) / 60)), label: "min" },
      { value: pad(diff % 60), label: "sec" },
    ];
  }, [deep, diff]);

  const announcement = useMemo(() => {
    if (!valid) return "date unresolved";
    if (arrived) return "the event has arrived";
    if (deep) return `${units[0].value} years and ${units[1].value} days remaining`;
    return `${units[0].value} days, ${units[1].value} hours, ${units[2].value} minutes remaining`;
  }, [valid, arrived, deep, units]);

  if (!valid) return <div className="countdown countdown--error">date unresolved</div>;
  if (arrived) return <div className="countdown countdown--arrived">event has arrived</div>;

  const compact = deep || units[0].value.length > 2;

  return (
    <div
      className={`countdown ${compact ? "countdown--compact" : ""}`}
      role="timer"
      aria-label={announcement}
    >
      {units.map((u, i) => (
        <Fragment key={u.label}>
          {i > 0 && <span className="countdown__sep" aria-hidden="true">:</span>}
          <div className="countdown__unit">
            <RollingNumber value={u.value} />
            <span className="countdown__label">{u.label}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
};

export default Countdown;
