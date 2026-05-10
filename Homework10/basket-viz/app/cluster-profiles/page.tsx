"use client";

import SlideFrame from "../../components/SlideFrame";
import { formatPercent } from "../../components/report-format";
import { usePresentationReport } from "../../components/usePresentationReport";

type ClusterGroup = {
  cluster: string;
  items: Array<{
    item: string;
    within_cluster_support_pct: number;
  }>;
};

export default function ClusterProfilesSlide() {
  const { report } = usePresentationReport();

  const clusters = report.clustering.cluster_profiles.reduce<ClusterGroup[]>(
    (groups, entry) => {
      const target = groups.find((group) => group.cluster === entry.cluster);
      const item = {
        item: entry.item,
        within_cluster_support_pct: entry.within_cluster_support_pct,
      };

      if (target) {
        target.items.push(item);
      } else {
        groups.push({ cluster: entry.cluster, items: [item] });
      }

      return groups;
    },
    [],
  );

  return (
    <SlideFrame
      kicker="Cluster profiles"
      title="Each cluster is easiest to understand through its common items"
      lede="The cluster profile slide shows which groceries appear most often inside each cluster. That helps translate a PCA cloud back into shopping missions."
      meta={
        <>
          <div className="slide-stat-card">
            <span>Clusters</span>
            <strong>{report.summary.cluster_count}</strong>
          </div>
          <div className="slide-stat-card">
            <span>Profile items</span>
            <strong>Top 10 each</strong>
          </div>
          <div className="slide-stat-card">
            <span>Interpretation</span>
            <strong>Mission-based</strong>
          </div>
          <div className="slide-stat-card">
            <span>Export</span>
            <strong>JSON-backed</strong>
          </div>
        </>
      }
    >
      <div className="slide-stack">
        <div className="slide-callout">
          <h3>How to read the clusters</h3>
          <p>
            A cluster is more than a color on the 3D cloud. Its profile tells
            you what kind of basket shape dominates that region of the point
            cloud.
          </p>
        </div>

        <div className="slide-callout-grid slide-cluster-grid">
          {clusters.map((cluster) => {
            const maxSupport = Math.max(
              ...cluster.items.map((item) => item.within_cluster_support_pct),
              1,
            );

            return (
              <section key={cluster.cluster} className="slide-table-card slide-cluster-card">
                <h3>Cluster {cluster.cluster}</h3>
                <div className="slide-table-scroll compact">
                  <div className="slide-bar-list">
                    {cluster.items.map((item) => {
                      const width = Math.max((item.within_cluster_support_pct / maxSupport) * 100, 4);
                      return (
                        <div key={`${cluster.cluster}-${item.item}`} className="slide-bar-row">
                          <div className="slide-bar-label">{item.item}</div>
                          <div className="slide-bar-track">
                            <div
                              className="slide-bar-fill"
                              style={{
                                width: `${width}%`,
                                background:
                                  "linear-gradient(90deg, rgba(125,211,252,0.9), rgba(114,240,190,0.88))",
                              }}
                            />
                          </div>
                          <div className="slide-bar-value">{formatPercent(item.within_cluster_support_pct)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </SlideFrame>
  );
}
