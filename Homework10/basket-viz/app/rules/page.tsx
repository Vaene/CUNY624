"use client";

import SlideFrame from "../../components/SlideFrame";
import { formatCount, formatPercent, formatScore } from "../../components/report-format";
import { usePresentationReport } from "../../components/usePresentationReport";

function splitRule(rule: { lhs?: string; rhs?: string; rules?: string }) {
  if (rule.lhs && rule.rhs) {
    return { lhs: rule.lhs, rhs: rule.rhs };
  }

  const raw = rule.rules ?? "";
  const match = raw.match(/^\s*\{(.+?)\}\s*=>\s*\{(.+?)\}\s*$/);

  if (match) {
    return {
      lhs: `{${match[1]}}`,
      rhs: `{${match[2]}}`,
    };
  }

  return {
    lhs: raw || "Unknown",
    rhs: "",
  };
}

export default function RulesSlide() {
  const { report } = usePresentationReport();
  const topRules = report.association_rules.top_rules;

  return (
    <SlideFrame
      kicker="Association rules"
      title="Rules describe which items travel together"
      lede="Support, confidence, and lift turn the item co-occurrence problem into something measurable. Lift is the strongest lens for finding unusual associations."
      meta={
        <>
            <div className="slide-stat-card">
              <span>Rules kept</span>
              <strong>{formatCount(report.summary.total_rules)}</strong>
            </div>
          <div className="slide-stat-card">
            <span>Strongest lift</span>
            <strong>{formatScore(report.summary.strongest_lift)}</strong>
          </div>
          <div className="slide-stat-card">
            <span>Method</span>
            <strong>Apriori</strong>
          </div>
          <div className="slide-stat-card">
            <span>Filter</span>
            <strong>Pruned rules</strong>
          </div>
        </>
      }
    >
      <div className="slide-two-panel">
        <section className="slide-stack">
          <div className="slide-callout">
            <h3>How to read the metrics</h3>
            <p>
              Support measures how often the rule appears overall. Confidence
              measures how often the right-hand side appears when the left-hand
              side is present. Lift compares the rule against chance.
            </p>
          </div>

          <div className="slide-callout-grid">
            <div className="slide-callout">
              <div className="callout-title">Support</div>
              <strong>Frequency</strong>
              <p>How common the itemset is in all transactions.</p>
            </div>
            <div className="slide-callout">
              <div className="callout-title">Confidence</div>
              <strong>Reliability</strong>
              <p>How often the rule fires when the antecedent is present.</p>
            </div>
            <div className="slide-callout">
              <div className="callout-title">Lift</div>
              <strong>Association strength</strong>
              <p>How much stronger the rule is than random chance.</p>
            </div>
            <div className="slide-callout">
              <div className="callout-title">Top rule type</div>
              <strong>High-lift pairs</strong>
              <p>Useful for placement, recommendations, and coupon strategy.</p>
            </div>
          </div>

          <div className="slide-panel">
            <h3>Why lift matters</h3>
            <p>
              A rule can be frequent without being interesting. Lift helps
              separate simply popular items from items that have a true
              association.
            </p>
          </div>
        </section>

        <section className="slide-table-card">
          <h3>Top 10 rules by lift</h3>
          <div className="slide-table-scroll">
            <table className="slide-table">
              <thead>
                <tr>
                  <th>Left side</th>
                  <th>Right side</th>
                  <th>Support</th>
                  <th>Confidence</th>
                  <th>Coverage</th>
                  <th>Lift</th>
                </tr>
              </thead>
              <tbody>
                {topRules.map((rule) => (
                  <tr key={`${rule.lhs ?? rule.rules ?? "rule"}-${rule.rhs ?? ""}`}>
                    {(() => {
                      const split = splitRule(rule);
                      return (
                        <>
                          <td>
                            <strong>{split.lhs}</strong>
                          </td>
                          <td>{split.rhs}</td>
                          <td>{formatPercent(rule.support * 100)}</td>
                          <td>{formatPercent(rule.confidence * 100)}</td>
                          <td>{rule.coverage ? formatPercent(rule.coverage * 100) : "—"}</td>
                          <td>{formatScore(rule.lift)}</td>
                        </>
                      );
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </SlideFrame>
  );
}
