"use client";

import SlideFrame from "../../components/SlideFrame";
import { formatCount, formatPercent } from "../../components/report-format";
import { usePresentationReport } from "../../components/usePresentationReport";

export default function DatasetSlide() {
  const { report } = usePresentationReport();
  const topItems = report.item_frequency.top_items;
  const maxCount = Math.max(...topItems.map((item) => item.count), 1);

  return (
    <SlideFrame
      kicker="Dataset overview"
      title="The groceries data sets the scale for the whole story"
      lede="The report starts with transaction counts and the most frequently purchased items, which gives the later rules and clusters a concrete retail context."
      meta={
        <>
          <div className="slide-stat-card">
            <span>Average basket</span>
            <strong>{report.summary.average_basket_size.toFixed(2)}</strong>
          </div>
          <div className="slide-stat-card">
            <span>Median basket</span>
            <strong>{formatCount(report.summary.median_basket_size)}</strong>
          </div>
          <div className="slide-stat-card">
            <span>Largest basket</span>
            <strong>{formatCount(report.summary.largest_basket)}</strong>
          </div>
          <div className="slide-stat-card">
            <span>Clusters</span>
            <strong>{formatCount(report.summary.cluster_count)}</strong>
          </div>
        </>
      }
    >
      <div className="slide-two-panel">
        <section className="slide-table-card">
          <h3>Top 20 items by frequency</h3>
          <div className="slide-table-scroll compact">
            <div className="slide-bar-list">
              {topItems.map((item) => {
                const width = Math.max((item.count / maxCount) * 100, 4);
                return (
                  <div key={item.item} className="slide-bar-row">
                    <div className="slide-bar-label">{item.item}</div>
                    <div className="slide-bar-track">
                      <div
                        className="slide-bar-fill"
                        style={{
                          width: `${width}%`,
                          background:
                            "linear-gradient(90deg, rgba(125,211,252,0.92), rgba(255,209,102,0.88))",
                        }}
                      />
                    </div>
                    <div className="slide-bar-value">
                      {formatCount(item.count)} · {formatPercent(item.support_pct)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="slide-stack">
          <div className="slide-callout">
            <h3>Why this slide matters</h3>
            <p>
              Item frequency gives the later rule-mining slide a baseline.
              Support is only interesting when it is compared against how often
              the items appear overall.
            </p>
          </div>

          <div className="slide-callout-grid">
            <div className="slide-callout">
              <div className="callout-title">Transactions</div>
              <strong>{formatCount(report.summary.total_transactions)}</strong>
            </div>
            <div className="slide-callout">
              <div className="callout-title">Unique items</div>
              <strong>{formatCount(report.summary.unique_items)}</strong>
            </div>
            <div className="slide-callout">
              <div className="callout-title">Average basket</div>
              <strong>{report.summary.average_basket_size.toFixed(2)}</strong>
            </div>
            <div className="slide-callout">
              <div className="callout-title">Median basket</div>
              <strong>{formatCount(report.summary.median_basket_size)}</strong>
            </div>
          </div>

          <div className="slide-panel">
            <h3>Reading tip</h3>
            <p>
              Higher support percentages show staple items. Those staples become
              the anchor points for both the association rules and the basket
              clustering slide later in the deck.
            </p>
          </div>
        </section>
      </div>
    </SlideFrame>
  );
}
