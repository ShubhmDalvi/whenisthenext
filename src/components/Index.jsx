import { useEffect, useRef } from "react";

const Index = ({ events, categories, activeIndex, onSelect }) => {
  const rowRefs = useRef([]);

  useEffect(() => {
    const el = rowRefs.current[activeIndex];
    if (!el) return;
    if (!window.matchMedia("(max-width: 900px)").matches) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: reduced ? "auto" : "smooth",
    });
  }, [activeIndex]);

  return (
    <nav className="index" aria-label="Event index">
      {categories.map((cat) => (
        <div className="index__group" key={cat}>
          <div className="index__group-label">{cat}</div>
          {events.filter((e) => e.category === cat).map((evt) => {
            const idx = events.indexOf(evt);
            const active = idx === activeIndex;
            return (
              <button
                key={evt.id}
                ref={(el) => { rowRefs.current[idx] = el; }}
                type="button"
                className={`index__row ${active ? "is-active" : ""}`}
                onClick={() => onSelect(idx)}
                aria-current={active ? "true" : undefined}
                style={{ "--row-color": evt.color }}
              >
                <span className="index__num">{evt.id}</span>
                <span className="index__dot" aria-hidden="true" />
                <span className="index__title">{evt.title}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
};

export default Index;
