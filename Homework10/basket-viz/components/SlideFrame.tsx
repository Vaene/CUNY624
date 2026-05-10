import type { ReactNode } from "react";

type SlideFrameProps = {
  kicker: string;
  title: string;
  lede: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function SlideFrame({
  kicker,
  title,
  lede,
  meta,
  children,
  className,
}: SlideFrameProps) {
  return (
    <main className="slide-page">
      <section className={`slide-frame ${className ?? ""}`.trim()}>
        <header className="slide-hero">
          <div className="slide-copy">
            <p className="eyebrow">{kicker}</p>
            <h1>{title}</h1>
            <p className="lede">{lede}</p>
          </div>
          {meta ? <div className="slide-meta-grid">{meta}</div> : null}
        </header>
        <div className="slide-content">{children}</div>
      </section>
    </main>
  );
}
