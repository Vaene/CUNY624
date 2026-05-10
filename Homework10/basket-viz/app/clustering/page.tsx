"use client";

import SlideFrame from "../../components/SlideFrame";
import { formatCount, formatPercent } from "../../components/report-format";
import { usePresentationReport } from "../../components/usePresentationReport";

export default function ClusteringSlide() {
  const { report } = usePresentationReport();
  const variance = report.clustering.variance_explained.slice(0, 10);
  const elbow = report.clustering.elbow;
  const maxElbow = Math.max(...elbow.map((point) => point.within_cluster_sum_squares), 1);
  const chosenK = 4;

  const varianceChartWidth = 500;
  const varianceChartHeight = 146;
  const variancePadding = { top: 10, right: 10, bottom: 32, left: 40 };
  const varianceAxisMax = 0.06;
  const varianceInnerWidth = varianceChartWidth - variancePadding.left - variancePadding.right;
  const varianceInnerHeight = varianceChartHeight - variancePadding.top - variancePadding.bottom;
  const varianceBarWidth = ((varianceInnerWidth / variance.length) - 8) * 0.5;
  const varianceTickValues = [0, 0.02, 0.04, 0.06];

  const variancePoints = variance.map((point, index) => {
    const x =
      variancePadding.left +
      (index / Math.max(variance.length - 1, 1)) * varianceInnerWidth;
    const height = Math.min(point.variance / varianceAxisMax, 1) * varianceInnerHeight;
    const y = variancePadding.top + (varianceInnerHeight - height);
    return { point, x, y, height };
  });

  const elbowChartWidth = 540;
  const elbowChartHeight = 210;
  const elbowPadding = 28;
  const elbowPoints = elbow
    .map((point, index) => {
      const x =
        elbowPadding + (index / Math.max(elbow.length - 1, 1)) * (elbowChartWidth - elbowPadding * 2);
      const y =
        elbowChartHeight -
        elbowPadding -
        (point.within_cluster_sum_squares / maxElbow) * (elbowChartHeight - elbowPadding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <SlideFrame
      kicker="Clustering"
      title="PCA and elbow selection prepare the basket clustering slide"
      lede="This section answers a different question than association rules: which receipts look similar overall? PCA reduces the basket matrix, the elbow plot motivates k = 4, and the 3D basket cloud adds a meaningful depth axis."
      meta={
        <>
          <div className="slide-stat-card">
            <span>Top items used</span>
            <strong>{formatCount(50)}</strong>
          </div>
          <div className="slide-stat-card">
            <span>Chosen k</span>
            <strong>{formatCount(chosenK)}</strong>
          </div>
          <div className="slide-stat-card">
            <span>PCA dims</span>
            <strong>PC1, PC2, PC3</strong>
          </div>
          <div className="slide-stat-card">
            <span>3D z axis</span>
            <strong>Basket rarity</strong>
          </div>
        </>
      }
    >
      <div className="slide-two-panel">
        <section className="slide-stack">
          <div className="slide-panel">
            <h3>Variance explained</h3>
            <p>
              The first components carry the most signal, which is why the
              basket cloud starts with PCA 1 and PCA 2 on the plane.
            </p>
            <svg
              viewBox={`0 0 ${varianceChartWidth} ${varianceChartHeight}`}
              className="slide-svg variance-svg"
              role="img"
              aria-label="Variance explained by principal components"
            >
              <rect
                x="0"
                y="0"
                width={varianceChartWidth}
                height={varianceChartHeight}
                rx="16"
                fill="rgba(255,255,255,0.02)"
              />
              {varianceTickValues.map((tick) => {
                const y =
                  variancePadding.top +
                  varianceInnerHeight -
                  (tick / varianceAxisMax) * varianceInnerHeight;
                return (
                  <g key={tick}>
                    <line
                      x1={variancePadding.left}
                      x2={varianceChartWidth - variancePadding.right}
                      y1={y}
                      y2={y}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="1"
                    />
                    <text
                      x={variancePadding.left - 12}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="8"
                      fill="rgba(159,176,200,0.92)"
                    >
                      {formatPercent(tick * 100)}
                    </text>
                  </g>
                );
              })}
              {variancePoints.map(({ point, x, y, height }) => (
                <g key={point.component}>
                  <rect
                    x={x - varianceBarWidth / 2}
                    y={y}
                    width={varianceBarWidth}
                    height={height}
                    rx="8"
                    fill="rgba(125,211,252,0.92)"
                  />
                  <text
                    x={x}
                    y={varianceChartHeight - 8}
                    textAnchor="middle"
                    fontSize="8"
                    fill="rgba(231,240,255,0.82)"
                  >
                    {point.component}
                  </text>
                  <text
                    x={x}
                    y={Math.max(y - 8, 12)}
                    textAnchor="middle"
                    fontSize="8"
                    fill="rgba(159,176,200,0.92)"
                  >
                    {formatPercent(point.variance_pct)}
                  </text>
                </g>
              ))}
              <line
                x1={variancePadding.left}
                x2={varianceChartWidth - variancePadding.right}
                y1={variancePadding.top + varianceInnerHeight}
                y2={variancePadding.top + varianceInnerHeight}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1"
              />
            </svg>
          </div>

          <div className="slide-panel">
            <h3>Elbow method</h3>
            <p>
              k = 4 is a simple, interpretable choice for the report. The elbow
              point is where additional clusters stop reducing variance as
              dramatically.
            </p>
            <svg viewBox={`0 0 ${elbowChartWidth} ${elbowChartHeight}`} className="slide-svg">
              <rect x="0" y="0" width={elbowChartWidth} height={elbowChartHeight} rx="16" fill="rgba(255,255,255,0.02)" />
              <polyline
                fill="none"
                stroke="rgba(255,209,102,0.9)"
                strokeWidth="3"
                points={elbowPoints}
              />
              {elbow.map((point, index) => {
                const x =
                  elbowPadding + (index / Math.max(elbow.length - 1, 1)) * (elbowChartWidth - elbowPadding * 2);
                const y =
                  elbowChartHeight -
                  elbowPadding -
                  (point.within_cluster_sum_squares / maxElbow) * (elbowChartHeight - elbowPadding * 2);
                const active = point.k === chosenK;
                return (
                  <g key={point.k}>
                    <circle
                      cx={x}
                      cy={y}
                      r={active ? 7 : 5}
                      fill={active ? "rgba(125,211,252,0.95)" : "rgba(255,209,102,0.92)"}
                    />
                    <text
                      x={x}
                      y={elbowChartHeight - 8}
                      textAnchor="middle"
                      fontSize="11"
                      fill="rgba(231,240,255,0.82)"
                    >
                      k={point.k}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </section>

        <section className="slide-stack">
          <div className="slide-callout">
            <h3>Why the 3D basket slide works</h3>
            <p>
              PCA handles the planar similarity structure, while basket rarity
              provides the third dimension. That makes the depth axis meaningful
              instead of decorative.
            </p>
          </div>

          <div className="slide-callout-grid">
            <div className="slide-callout">
              <div className="callout-title">Input matrix</div>
              <strong>Top 50 items</strong>
              <p>Focuses the clustering on the most interpretable basket features.</p>
            </div>
            <div className="slide-callout">
              <div className="callout-title">Projection</div>
              <strong>PCA scores</strong>
              <p>PC1, PC2, and PC3 provide a compact basket embedding.</p>
            </div>
            <div className="slide-callout">
              <div className="callout-title">Cluster choice</div>
              <strong>k = 4</strong>
              <p>A straightforward default that keeps the story easy to follow.</p>
            </div>
            <div className="slide-callout">
              <div className="callout-title">Visual payoff</div>
              <strong>3D point cloud</strong>
              <p>Hover and pin baskets to inspect their composition and rarity.</p>
            </div>
          </div>

          <div className="slide-panel">
            <h3>Bottom line</h3>
            <p>
              This slide sets up the final 3D basket cloud, where cluster color,
              basket size, and rarity work together as a coherent visual story.
            </p>
          </div>
        </section>
      </div>
    </SlideFrame>
  );
}
