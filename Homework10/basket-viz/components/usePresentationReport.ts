"use client";

import { useEffect, useState } from "react";

export type PresentationReport = {
  summary: {
    total_transactions: number;
    unique_items: number;
    average_basket_size: number;
    median_basket_size: number;
    largest_basket: number;
    total_rules: number;
    strongest_lift: number;
    cluster_count: number;
  };
  item_frequency: {
    top_items: Array<{
      item: string;
      count: number;
      support: number;
      support_pct: number;
    }>;
  };
  association_rules: {
    top_rules: Array<{
      lhs?: string;
      rhs?: string;
      rules?: string;
      support: number;
      confidence: number;
      coverage?: number;
      lift: number;
      count: number;
    }>;
  };
  clustering: {
    variance_explained: Array<{
      component: string;
      variance: number;
      variance_pct: number;
    }>;
    elbow: Array<{
      k: number;
      within_cluster_sum_squares: number;
    }>;
    cluster_counts: Array<{
      cluster: string;
      count: number;
    }>;
    cluster_profiles: Array<{
      cluster: string;
      item: string;
      within_cluster_support: number;
      within_cluster_support_pct: number;
    }>;
  };
};

const emptyReport: PresentationReport = {
  summary: {
    total_transactions: 0,
    unique_items: 0,
    average_basket_size: 0,
    median_basket_size: 0,
    largest_basket: 0,
    total_rules: 0,
    strongest_lift: 0,
    cluster_count: 0,
  },
  item_frequency: { top_items: [] },
  association_rules: { top_rules: [] },
  clustering: {
    variance_explained: [],
    elbow: [],
    cluster_counts: [],
    cluster_profiles: [],
  },
};

export function usePresentationReport() {
  const [report, setReport] = useState<PresentationReport>(emptyReport);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${basePath}/presentation_report.json`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load presentation data (${response.status})`);
        }

        const data = (await response.json()) as PresentationReport;
        if (!cancelled) {
          setReport(data);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unknown data loading error");
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [basePath]);

  return { report, loading, error };
}
