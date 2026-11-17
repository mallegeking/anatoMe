import type { ReactNode } from "react";

// The small pieces every tab panel is built from, so the panels look alike.

// The name of the thing the panel is about, with an optional muted line under it.
export function PanelTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <>
      <h2 className="panel-title">{children}</h2>
      {sub ? <p className="panel-sub">{sub}</p> : null}
    </>
  );
}

// A small label such as the type or the side. The warn tone is for things the reader should notice.
export function Chip({ children, tone = "plain", icon }: { children: ReactNode; tone?: "plain" | "warn"; icon?: ReactNode }) {
  return (
    <span className={tone === "warn" ? "chip chip--warn" : "chip"}>
      {icon}
      {children}
    </span>
  );
}

// The row that holds chips.
export function Chips({ children }: { children: ReactNode }) {
  return <div className="chips">{children}</div>;
}

// A small muted heading over a group. The swatch is a colour, shown as a dot before the words.
export function SectionHeading({ children, swatch }: { children: ReactNode; swatch?: string }) {
  return (
    <h3 className="section-heading">
      {swatch ? <span className="swatch" aria-hidden="true" style={{ background: swatch }} /> : null}
      {children}
    </h3>
  );
}

// A bordered box. The current one uses the raised surface.
export function Card({ children, current = false, as: Tag = "div" }: { children: ReactNode; current?: boolean; as?: "div" | "li" }) {
  return <Tag className={current ? "card card--current" : "card"}>{children}</Tag>;
}

// Muted keys on the left, values on the right.
export function KeyValue({ rows }: { rows: { key: string; value: ReactNode }[] }) {
  return (
    <dl className="kv">
      {rows.map((row, i) => (
        <div key={i} className="kv-row">
          <dt>{row.key}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
