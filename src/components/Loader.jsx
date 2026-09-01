export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="loader-wrap" role="status" aria-live="polite">
      <svg className="pl" viewBox="0 0 160 160" aria-hidden="true">
        <g className="pl__ring-rotate">
          <line className="pl__tick" x1="80" y1="6" x2="80" y2="18" transform="rotate(0 80 80)" />
          <line className="pl__tick" x1="80" y1="6" x2="80" y2="18" transform="rotate(45 80 80)" />
          <line className="pl__tick" x1="80" y1="6" x2="80" y2="18" transform="rotate(90 80 80)" />
          <line className="pl__tick" x1="80" y1="6" x2="80" y2="18" transform="rotate(135 80 80)" />
          <line className="pl__tick" x1="80" y1="6" x2="80" y2="18" transform="rotate(180 80 80)" />
          <line className="pl__tick" x1="80" y1="6" x2="80" y2="18" transform="rotate(225 80 80)" />
          <line className="pl__tick" x1="80" y1="6" x2="80" y2="18" transform="rotate(270 80 80)" />
          <line className="pl__tick" x1="80" y1="6" x2="80" y2="18" transform="rotate(315 80 80)" />
        </g>
        <circle className="pl__ring-stroke" cx="80" cy="80" r="72" />
      </svg>
      {label ? <p className="hint">{label}</p> : null}
    </div>
  )
}
