from __future__ import annotations

import math
import time
from pathlib import Path

import geopandas as gpd
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    GradientBoostingRegressor,
    HistGradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeRegressor


ROOT = Path(__file__).resolve().parents[1]
DATA_GDB = ROOT / "data" / "gdb" / "US_Wildfires_1878_2019.gdb"
ARTIFACTS = ROOT / "artifacts"
ARTIFACTS.mkdir(parents=True, exist_ok=True)

TARGET = "Combined_Acres"
RANDOM_STATE = 42
MAX_SAMPLE = 18000


def tufte_theme() -> None:
    plt.rcParams.update(
        {
            "figure.figsize": (10, 6),
            "figure.dpi": 150,
            "axes.facecolor": "white",
            "figure.facecolor": "white",
            "axes.spines.top": False,
            "axes.spines.right": False,
            "axes.spines.left": False,
            "axes.spines.bottom": True,
            "axes.grid": True,
            "grid.color": "#d9d9d9",
            "grid.linewidth": 0.5,
            "grid.alpha": 0.45,
            "axes.axisbelow": True,
            "font.size": 11,
            "axes.titlesize": 14,
            "axes.labelsize": 11,
            "xtick.color": "#333333",
            "ytick.color": "#333333",
            "text.color": "#222222",
        }
    )


def load_data() -> gpd.GeoDataFrame:
    if not DATA_GDB.exists():
        raise FileNotFoundError(f"Expected geodatabase at {DATA_GDB}")
    gdf = gpd.read_file(DATA_GDB, layer="US_Wildfires_1878_2019")
    return gdf


def prepare_features(gdf: gpd.GeoDataFrame) -> pd.DataFrame:
    df = gdf.copy()
    df["Combined_Ignition_Date"] = pd.to_datetime(
        df["Combined_Ignition_Date"], errors="coerce"
    )
    df["Combined_Containment_Date"] = pd.to_datetime(
        df["Combined_Containment_Date"], errors="coerce"
    )
    df["Combined_Controled_Date"] = pd.to_datetime(
        df["Combined_Controled_Date"], errors="coerce"
    )

    df = df[df[TARGET].notna() & (df[TARGET] > 0)].copy()

    if len(df) > MAX_SAMPLE:
        df = df.sample(MAX_SAMPLE, random_state=RANDOM_STATE).copy()

    centroids = df.geometry.to_crs(4326).centroid
    df["centroid_lon"] = centroids.x
    df["centroid_lat"] = centroids.y

    containment_end = df["Combined_Containment_Date"].combine_first(
        df["Combined_Controled_Date"]
    )
    duration = (containment_end - df["Combined_Ignition_Date"]).dt.days

    df["fire_year"] = pd.to_numeric(df["Combined_Fire_Year"], errors="coerce")
    df["ignition_month"] = df["Combined_Ignition_Date"].dt.month
    df["ignition_dayofyear"] = df["Combined_Ignition_Date"].dt.dayofyear
    df["duration_days"] = duration.clip(lower=0, upper=365)
    df["log_shape_area"] = np.log1p(pd.to_numeric(df["Shape_Area"], errors="coerce"))
    df["log_shape_length"] = np.log1p(
        pd.to_numeric(df["Shape_Length"], errors="coerce")
    )
    df["perimeter_area_ratio"] = pd.to_numeric(
        df["Shape_Length"], errors="coerce"
    ) / pd.to_numeric(df["Shape_Area"], errors="coerce")

    keep = [
        "Combined_Fire_Cause",
        "Combined_Data_Source",
        "Fire_Quality_Ranking",
        "fire_year",
        "ignition_month",
        "ignition_dayofyear",
        "duration_days",
        "centroid_lon",
        "centroid_lat",
        "log_shape_area",
        "log_shape_length",
        "perimeter_area_ratio",
        TARGET,
    ]
    prepared = df[keep].replace([np.inf, -np.inf], np.nan).dropna(subset=[TARGET])
    prepared["log_acres"] = np.log1p(prepared[TARGET])
    return prepared


def build_preprocessor(df: pd.DataFrame) -> tuple[ColumnTransformer, list[str], list[str]]:
    feature_cols = [c for c in df.columns if c not in {TARGET, "log_acres"}]
    categorical = [
        "Combined_Fire_Cause",
        "Combined_Data_Source",
        "Fire_Quality_Ranking",
    ]
    numerical = [c for c in feature_cols if c not in categorical]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        (
                            "encoder",
                            OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                        ),
                    ]
                ),
                categorical,
            ),
            (
                "numeric",
                Pipeline(steps=[("imputer", SimpleImputer(strategy="median"))]),
                numerical,
            ),
        ]
    )
    return preprocessor, feature_cols, numerical


def model_suite() -> dict[str, object]:
    return {
        "Decision Tree": DecisionTreeRegressor(
            max_depth=8, min_samples_leaf=30, random_state=RANDOM_STATE
        ),
        "Random Forest": RandomForestRegressor(
            n_estimators=250,
            max_depth=14,
            min_samples_leaf=8,
            n_jobs=-1,
            random_state=RANDOM_STATE,
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=250,
            learning_rate=0.05,
            max_depth=3,
            random_state=RANDOM_STATE,
        ),
        "HistGradientBoosting": HistGradientBoostingRegressor(
            learning_rate=0.05,
            max_depth=8,
            max_iter=350,
            min_samples_leaf=25,
            random_state=RANDOM_STATE,
        ),
    }


def evaluate_predictions(y_test_log: pd.Series, y_pred_log: np.ndarray) -> dict[str, float]:
    y_test = np.expm1(y_test_log)
    y_pred = np.expm1(y_pred_log)
    rmse_log = math.sqrt(mean_squared_error(y_test_log, y_pred_log))
    rmse_acres = math.sqrt(mean_squared_error(y_test, y_pred))
    return {
        "rmse_log_acres": rmse_log,
        "mae_log_acres": mean_absolute_error(y_test_log, y_pred_log),
        "r2_log_acres": r2_score(y_test_log, y_pred_log),
        "rmse_acres": rmse_acres,
        "mae_acres": mean_absolute_error(y_test, y_pred),
    }


def plot_model_scores(metrics: pd.DataFrame) -> None:
    order = metrics.sort_values("rmse_log_acres", ascending=False)
    fig, ax = plt.subplots(figsize=(10, 4.8))
    ax.barh(order["model"], order["rmse_log_acres"], color="#4C78A8", height=0.5)
    ax.set_title("Wildfire Size Prediction Error by Tree Method")
    ax.set_xlabel("RMSE on log(acres + 1)")
    ax.set_ylabel("")
    ax.grid(axis="x")
    ax.grid(axis="y", visible=False)
    for i, row in enumerate(order.itertuples(index=False)):
        ax.text(row.rmse_log_acres + 0.01, i, f"R² {row.r2_log_acres:.2f}", va="center")
    fig.tight_layout()
    fig.savefig(ARTIFACTS / "model_comparison_rmse.png", bbox_inches="tight")
    plt.close(fig)


def plot_fit_speed(metrics: pd.DataFrame) -> None:
    order = metrics.sort_values("fit_seconds", ascending=False)
    fig, ax = plt.subplots(figsize=(10, 4.8))
    ax.plot(order["fit_seconds"], order["model"], "o", color="#E45756", markersize=8)
    ax.hlines(order["model"], xmin=0, xmax=order["fit_seconds"], color="#E45756", lw=1)
    ax.set_title("Training Time: Baselines vs Boosting Variants")
    ax.set_xlabel("Fit time (seconds)")
    ax.set_ylabel("")
    ax.grid(axis="x")
    ax.grid(axis="y", visible=False)
    fig.tight_layout()
    fig.savefig(ARTIFACTS / "model_fit_times.png", bbox_inches="tight")
    plt.close(fig)


def plot_predicted_vs_actual(
    y_test_log: pd.Series, predictions: dict[str, np.ndarray], sample_n: int = 500
) -> None:
    y_actual = np.expm1(y_test_log)
    sample_idx = y_test_log.sample(min(sample_n, len(y_test_log)), random_state=RANDOM_STATE).index

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.5), sharex=True, sharey=True)
    panels = ["Random Forest", "HistGradientBoosting"]
    for ax, model_name in zip(axes, panels):
        y_pred = np.expm1(pd.Series(predictions[model_name], index=y_test_log.index))
        ax.scatter(
            y_actual.loc[sample_idx],
            y_pred.loc[sample_idx],
            s=10,
            color="#2A9D8F" if model_name == "Random Forest" else "#F4A261",
            alpha=0.45,
            linewidths=0,
        )
        upper = np.percentile(
            np.concatenate([y_actual.loc[sample_idx], y_pred.loc[sample_idx]]), 98
        )
        ax.plot([0, upper], [0, upper], color="#555555", lw=1)
        ax.set_title(model_name)
        ax.set_xlabel("Actual acres burned")
    axes[0].set_ylabel("Predicted acres burned")
    fig.suptitle("How the Stronger Tree Ensembles Track Wildfire Size", y=1.02)
    fig.tight_layout()
    fig.savefig(ARTIFACTS / "predicted_vs_actual.png", bbox_inches="tight")
    plt.close(fig)


def plot_feature_importance(
    pipeline: Pipeline, X_test: pd.DataFrame, y_test_log: pd.Series, feature_cols: list[str]
) -> None:
    preprocessor = pipeline.named_steps["preprocess"]
    model = pipeline.named_steps["model"]
    transformed_names = list(preprocessor.get_feature_names_out())
    result = permutation_importance(
        pipeline,
        X_test,
        y_test_log,
        n_repeats=5,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    importance = (
        pd.DataFrame(
            {"feature": transformed_names[: len(result.importances_mean)], "importance": result.importances_mean}
        )
        .sort_values("importance", ascending=False)
        .head(10)
        .iloc[::-1]
    )
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.barh(importance["feature"], importance["importance"], color="#4C78A8", height=0.5)
    ax.set_title("Permutation Importance for HistGradientBoosting Pipeline")
    ax.set_xlabel("Decrease in score when shuffled")
    ax.set_ylabel("")
    ax.grid(axis="x")
    ax.grid(axis="y", visible=False)
    fig.tight_layout()
    fig.savefig(ARTIFACTS / "histgb_permutation_importance.png", bbox_inches="tight")
    plt.close(fig)


def main() -> None:
    tufte_theme()
    gdf = load_data()
    df = prepare_features(gdf)

    X = df.drop(columns=[TARGET, "log_acres"])
    y = df["log_acres"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=RANDOM_STATE
    )

    preprocessor, feature_cols, _ = build_preprocessor(df)

    metrics_rows: list[dict[str, float | str]] = []
    predictions: dict[str, np.ndarray] = {}
    fitted_pipelines: dict[str, Pipeline] = {}

    for name, estimator in model_suite().items():
        pipeline = Pipeline(
            steps=[("preprocess", preprocessor), ("model", estimator)]
        )
        fit_start = time.perf_counter()
        pipeline.fit(X_train, y_train)
        fit_seconds = time.perf_counter() - fit_start

        predict_start = time.perf_counter()
        y_pred = pipeline.predict(X_test)
        predict_seconds = time.perf_counter() - predict_start

        row = {
            "model": name,
            "fit_seconds": fit_seconds,
            "predict_seconds": predict_seconds,
        }
        row.update(evaluate_predictions(y_test, y_pred))
        metrics_rows.append(row)
        predictions[name] = y_pred
        fitted_pipelines[name] = pipeline

    metrics = pd.DataFrame(metrics_rows).sort_values(
        "rmse_log_acres", ascending=True
    )
    metrics.to_csv(ARTIFACTS / "model_metrics.csv", index=False)

    summary_lines = [
        f"Rows modeled: {len(df):,}",
        f"Train rows: {len(X_train):,}",
        f"Test rows: {len(X_test):,}",
        "",
        metrics.to_string(
            index=False,
            formatters={
                "fit_seconds": "{:.3f}".format,
                "predict_seconds": "{:.3f}".format,
                "rmse_log_acres": "{:.3f}".format,
                "mae_log_acres": "{:.3f}".format,
                "r2_log_acres": "{:.3f}".format,
                "rmse_acres": "{:.1f}".format,
                "mae_acres": "{:.1f}".format,
            },
        ),
    ]
    (ARTIFACTS / "benchmark_summary.txt").write_text("\n".join(summary_lines))
    print("\n".join(summary_lines))

    plot_model_scores(metrics)
    plot_fit_speed(metrics)
    plot_predicted_vs_actual(y_test, predictions)
    plot_feature_importance(
        fitted_pipelines["HistGradientBoosting"], X_test, y_test, feature_cols
    )


if __name__ == "__main__":
    main()
