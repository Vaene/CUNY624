"use client";

import SlideFrame from "../../components/SlideFrame";
import { formatCount, formatScore } from "../../components/report-format";
import { usePresentationReport } from "../../components/usePresentationReport";

export default function ConclusionSlide() {
  const { report } = usePresentationReport();

  return (
    <SlideFrame
      kicker="Conclusion"
      title="What the market basket analysis lets us conclude"
      lede="The final structure mirrors the original R Markdown report, but the slide deck makes the strongest analytical conclusions easier to see and compare."
      meta={
        <>
          <div className="slide-stat-card">
            <span>Transactions</span>
            <strong>{formatCount(report.summary.total_transactions)}</strong>
          </div>
          <div className="slide-stat-card">
            <span>Rules</span>
            <strong>{formatCount(report.summary.total_rules)}</strong>
          </div>
          <div className="slide-stat-card">
            <span>Clusters</span>
            <strong>{formatCount(report.summary.cluster_count)}</strong>
          </div>
          <div className="slide-stat-card">
            <span>Strongest lift</span>
            <strong>{formatScore(report.summary.strongest_lift)}</strong>
          </div>
        </>
      }
    >
      <div className="slide-two-panel">
        <section className="slide-stack">
          <div className="slide-callout">
            <h3>What the deck shows</h3>
            <ul className="slide-bullet-list">
              <li>Item frequency establishes the grocery context</li>
              <li>Association rules highlight item combinations worth attention</li>
              <li>3D network and 3D basket cloud add depth only where it adds meaning</li>
              <li>Cluster profiles translate the point cloud back into shopping missions</li>
            </ul>
          </div>

          <div className="slide-panel">
            <h3>Design choice</h3>
            <p>
              The deck uses 3D sparingly. Basket clusters and rule networks are
              spatial by nature, so the third axis adds context. Other sections
              stay 2D, tabular, or narrative to keep the presentation readable.
            </p>
          </div>
        </section>

        <section className="slide-stack">
          <div className="slide-callout">
            <h3>Conclusions we can draw</h3>
            <p>
              The grocery baskets are not random. A small set of common items
              anchors most transactions, several rules show unusually strong
              item pairings, and the cluster view suggests distinct shopping
              missions rather than one uniform basket pattern.
            </p>
          </div>

          <div className="slide-chip-grid">
            <div className="slide-chip">
              <strong>Frequent staples</strong>
              <span>Core items appear across many baskets and shape the baseline</span>
            </div>
            <div className="slide-chip">
              <strong>High-lift pairs</strong>
              <span>Some item combinations occur together more often than chance</span>
            </div>
            <div className="slide-chip">
              <strong>Distinct clusters</strong>
              <span>Receipts group into a few interpretable shopping patterns</span>
            </div>
            <div className="slide-chip">
              <strong>Practical use</strong>
              <span>Placement, bundling, and recommendation opportunities follow</span>
            </div>
          </div>
        </section>
      </div>
    </SlideFrame>
  );
}
