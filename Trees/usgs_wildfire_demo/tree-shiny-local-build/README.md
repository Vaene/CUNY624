# Local Tree Shiny Demo

This folder contains a local version of the five slide demos that correspond to slides 45-49 in `Data 624 Tree Models.pdf`.

## Run one app

From the repo root:

```bash
Rscript -e 'shiny::runApp("usgs_wildfire_demo/tree_shiny_local/m5p", port = 3838, launch.browser = FALSE)'
```

Then open the app at `http://127.0.0.1:3838`.

## Apps

- `m5p`
- `m5rules`
- `bagging`
- `rf`
- `gbm`

## Notes

- The local environment does not currently expose RWeka, so the slide 45-46 behavior is demonstrated with `rpart` pruning controls and rule extraction.
- The data source is `Data/TS3_Raw_tree_data.csv`.
