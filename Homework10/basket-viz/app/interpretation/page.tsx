"use client";

import SlideFrame from "../../components/SlideFrame";
import { formatPercent, formatScore } from "../../components/report-format";
import { usePresentationReport } from "../../components/usePresentationReport";

export default function InterpretationSlide() {
  const { report } = usePresentationReport();
  const topRules = report.association_rules.top_rules.slice(0, 3);

  return (
    <SlideFrame
      kicker="Interpretation"
      title="The strongest rules point to practical retail actions"
      lede="The top rules are not just statistics. They suggest placement, bundling, and promotional ideas that can be tested in the store or in a recommendation system."
      meta={
        <>
          <div className="slide-stat-card">
            <span>Top rule lift</span>
            <strong>{formatScore(report.summary.strongest_lift)}</strong>
          </div>
          <div className="slide-stat-card">
            <span>Rules table</span>
            <strong>Top 10</strong>
          </div>
          <div className="slide-stat-card">
            <span>Action lens</span>
            <strong>Retail strategy</strong>
          </div>
          <div className="slide-stat-card">
            <span>Focus</span>
            <strong>High-lift pairs</strong>
          </div>
        </>
      }
    >
      <div className="slide-two-panel">
        <section className="slide-stack">
          <div className="slide-callout-grid">
            {topRules.map((rule, index) => (
              <div key={`${rule.lhs}-${rule.rhs}`} className="slide-callout">
                <div className="callout-title">Rule {index + 1}</div>
                <strong>
                  {rule.lhs} → {rule.rhs}
                </strong>
                <p>
                  Support {formatPercent(rule.support * 100)} · Confidence{" "}
                  {formatPercent(rule.confidence * 100)} · Lift {formatScore(rule.lift)}
                </p>
              </div>
            ))}
          </div>

          <div className="slide-panel">
            <h3>What these rules can drive</h3>
            <ul className="slide-bullet-list">
              <li>Adjacency and shelf placement for frequently paired items</li>
              <li>Bundle offers and discount strategies for strong item sets</li>
              <li>Cross-sell prompts in digital shopping carts</li>
              <li>Customer mission analysis for repeated grocery combinations</li>
            </ul>
          </div>
        </section>

        <section className="slide-stack">
          <div className="slide-callout">
            <h3>Reading the rule graph later</h3>
            <p>
              The next 3D slide places the highest-lift rules into a network.
              The z axis reflects association prominence so stronger
              relationships physically rise above weaker ones.
            </p>
          </div>

          <div className="slide-panel">
            <h3>Small caution</h3>
            <p>
              High lift does not always mean high volume. Some of the most
              interesting rules are rare but unusually informative, which is why
              the table and graph are both useful.
            </p>
          </div>
        </section>
      </div>
    </SlideFrame>
  );
}
