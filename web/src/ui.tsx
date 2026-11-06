import type { ReactNode } from "react";

/** A box: 12px uppercase heading with a coloured square, an optional muted note at the right. */
export function Box({ id, title, color, note, className = "", children, headingLevel = 2 }: {
  id: string; title: string; color: string; note?: ReactNode; className?: string; children: ReactNode; headingLevel?: 2 | 3;
}) {
  const H = headingLevel === 2 ? "h2" : "h3";
  return (
    <section className={`box ${className}`} aria-labelledby={`${id}-h`} id={id}>
      <div className="box-head">
        <H id={`${id}-h`} className="box-title"><span className="sq" style={{ background: color }} aria-hidden="true" />{title}</H>
        {note && <span className="box-note">{note}</span>}
      </div>
      {children}
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
