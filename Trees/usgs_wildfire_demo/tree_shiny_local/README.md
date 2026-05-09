# Legacy Tree Demo Assets

This folder contains the older R/Shiny versions of the five tree-model demos.
The presentation now uses browser-native Pyodide widgets instead, so you do
not need to run anything from here for the slide deck to work.

## Apps

- `m5p`
- `m5rules`
- `bagging`
- `rf`
- `gbm`

## Notes

- The local environment does not currently expose RWeka, so the slide 45-46 behavior is demonstrated with `rpart` pruning controls and rule extraction.
- The data source is `Data/TS3_Raw_tree_data.csv`.
