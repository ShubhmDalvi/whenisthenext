const Masthead = ({ now, locationName, status, locating, onRefineLocation }) => (
  <>
    <header className="masthead">
      <div className="masthead__title">
        <span className="masthead__mark" aria-hidden="true" />
        When Is The Next?
      </div>
      <div className="masthead__meta">
        <button
          type="button"
          className="masthead__location"
          onClick={onRefineLocation}
          disabled={locating}
          title="Use precise location"
        >
          {locating ? "refining\u2026" : locationName}
        </button>
        <span className="masthead__divider" aria-hidden="true">&middot;</span>
        <span>{status}</span>
        <span className="masthead__divider" aria-hidden="true">&middot;</span>
        <span className="masthead__clock">
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </header>
    <div className="masthead__rule" aria-hidden="true" />
  </>
);

export default Masthead;
