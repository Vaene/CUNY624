# USGS Wildfire Tree Regression Demo

This demo uses the official USGS data release "Combined wildfire datasets for the United States and certain territories, 1878-2019" to predict wildfire size in acres with tree-based regression models.

Models included:

- `DecisionTreeRegressor`
- `RandomForestRegressor`
- `GradientBoostingRegressor`
- `HistGradientBoostingRegressor`

The target is `log1p(Combined_Acres)` so the comparison is more stable and easier to explain in a presentation.

## Run

```bash
Trees/.venv_wildfire_demo/bin/python Trees/usgs_wildfire_demo/scripts/usgs_wildfire_boosting_demo.py
```

## Outputs

Artifacts are written to `Trees/usgs_wildfire_demo/artifacts/`:

- `model_metrics.csv`
- `benchmark_summary.txt`
- `model_comparison_rmse.png`
- `model_fit_times.png`
- `predicted_vs_actual.png`
- `histgb_permutation_importance.png`
