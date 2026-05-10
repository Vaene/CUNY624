"use client";

import Link from "next/link";
import SlideFrame from "../components/SlideFrame";
import { formatCount, formatScore } from "../components/report-format";
import { usePresentationReport } from "../components/usePresentationReport";

export default function HomePage() {
  const { report, loading, error } = usePresentationReport();

  return (
    <SlideFrame
      kicker="Executive summary"
      title="A slide deck version of the basket analysis report"
      lede="This presentation translates the R Markdown output into a sequence of slides. Depth is used only where it adds analytical meaning: the basket cluster cloud and the association-rules network."
      meta={
        <>
          <div className="slide-stat-card">
            <span>Transactions</span>
            <strong>{formatCount(report.summary.total_transactions)}</strong>
          </div>
          <div className="slide-stat-card">
            <span>Unique items</span>
            <strong>{formatCount(report.summary.unique_items)}</strong>
          </div>
          <div className="slide-stat-card">
            <span>Total rules</span>
            <strong>{formatCount(report.summary.total_rules)}</strong>
          </div>
          <div className="slide-stat-card">
            <span>Strongest lift</span>
            <strong>{formatScore(report.summary.strongest_lift)}</strong>
          </div>
        </>
      }
    >
      <div className="slide-two-panel">
        <section className="slide-panel">
          <h3>What follows</h3>
          <ul className="slide-bullet-list">
            <li>Dataset overview and item-frequency context</li>
            <li>Association-rule summary and a 3D rule network</li>
            <li>Rules interpretation and practical retail uses</li>
            <li>Clustering with PCA, elbow selection, and a 3D basket cloud</li>
            <li>Cluster profiles and a short conclusion slide</li>
          </ul>
        </section>

        <section className="slide-callout">
          <h3>3D only when it helps</h3>
          <p>
            The 3D slides keep a meaningful z axis: basket rarity for receipt
            clusters and association prominence for the rule network. Everything
            else stays 2D or tabular so the report remains readable.
          </p>

          <div className="slide-chip-grid">
            <Link href="/dataset" className="slide-chip">
              <strong>Next slide</strong>
              <span>Dataset overview</span>
            </Link>
            <Link href="/basket-clusters" className="slide-chip">
              <strong>3D basket cloud</strong>
              <span>Meaningful depth axis</span>
            </Link>
          </div>

          <p className="slide-note">
            Use the bottom arrows or the pager dots to move between slides like
            Story5.
          </p>
        </section>
      </div>

      {loading ? <p className="slide-note">Loading report data…</p> : null}
      {error ? <p className="slide-note">Could not load slide data: {error}</p> : null}
    </SlideFrame>
  );
}
