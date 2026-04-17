# Presenter Notes

These notes are organized by slide and keep the emphasis on how tree-based models work. The datasets are there to make the modeling ideas concrete, not to be the main story.

## Slide 1

Title: From Squirrels To Wildfires: A Story About Tree-Based Models

Talking points:
- Open by saying the presentation is really about the tree-model family.
- Explain that the three datasets are just teaching vehicles.
- Preview the arc: single trees, rules, bagging/random forests, then boosting.

## Slide 2

Title: What Are Tree-Based Models Good At?

Talking points:
- Define a tree model as recursive splitting of the feature space.
- Stress that trees work with numeric and categorical predictors without scaling.
- Mention that the key selling point early on is interpretability.

## Slide 3

Title: The Squirrel Data Already Suggests Useful Splits

Talking points:
- Use this slide to explain why exploratory plots matter before modeling.
- Point out that the boxplot and share plot already hint at separable structure.
- Transition: a decision tree formalizes those visual partitions.

## Slide 4

Title: Squirrel Data Makes The Core Tree Ideas Easy To See

Talking points:
- Define `rpart` explicitly as a standard R package for recursive partitioning.
- Explain classification tree, regression tree, and rule-based tree as three closely related ideas.
- Note that the same family can answer different kinds of questions.
- Clarify that this slide is about the range of tasks trees can handle.

## Slide 5

Title: Two Regression Metrics Show Up Throughout The Talk

Talking points:
- Define MAE as average absolute error in the original unit.
- Define RMSE as a metric that penalizes larger misses more strongly.
- Point out that lower is better for both.
- Use this slide to prepare the class for perch-height and wildfire regression results later.

## Slide 6

Title: Example R Setup: Fit A Classification Tree And Read The Splits

Talking points:
- Walk through `rpart()` and the formula syntax.
- Explain `method = "class"` and how prediction with `type = "class"` returns labels.
- Read the tree top-down: first split, then child nodes, then terminal leaves.

## Slide 7

Title: Interpretability Is The Main Selling Point Up Front

Talking points:
- Explain that accuracy is not the only reason to use trees.
- Mention that the benchmark is intentionally harder than the main squirrel classification task.
- Use this slide to explain that different tree methods can behave similarly when the signal is weak.

## Slide 8

Title: Rules Turn Tree Logic Into Plain Language

Talking points:
- Define `C5.0` as a tree/rule learner in the C4.5 family.
- Explain that rules are another way of expressing a tree.
- Point out that `C5.0(..., rules = TRUE)` is useful when the class wants readable conditions.
- Emphasize that this is often easier for non-technical audiences to interpret.

## Slide 9

Title: Urban Trees Let The Ensemble Story Become Concrete

Talking points:
- Transition from single trees to ensembles.
- Explain why a larger and more varied dataset helps motivate stronger methods.
- Say that once tasks get harder, one tree may be too unstable or too weak.

## Slide 10

Title: The Urban Tree Data Shows Structure Before Modeling Starts

Talking points:
- Explain that regional separation suggests strong classification splits.
- Explain that the nonlinear height-diameter relationship suggests why trees can work better than a single straight line.
- Transition to ensemble methods as a way to stabilize and strengthen these patterns.

## Slide 11

Title: Bagging Barely Changes The Story On Easy Tasks, But Helps On Hard Ones

Talking points:
- Define bagging as bootstrap aggregating.
- Define random forest as bagging plus random feature subsets at each split.
- Explain that bagging mainly reduces variance.
- Point out that if a single tree already performs well, bagging may only help a little.

## Slide 12

Title: Example R Setup: Single Tree, Bagging, And Stronger Classification

Talking points:
- Highlight how similar the syntax stays while the method changes.
- Contrast `rpart()`, `bagging()`, and `randomForest()`.
- Explain that the estimator changes, but the supervised learning workflow remains the same.

## Slide 13

Title: Accuracy Gains Cost Time, And The Urban Tree Data Shows That Tradeoff Clearly

Talking points:
- Define `caret` as a training/tuning framework, not a separate tree algorithm.
- Explain that ensembles usually trade more compute for better predictive performance.
- Use the chart to make the speed-versus-accuracy point concrete.
- Introduce random forests as many decorrelated bagged trees.

## Slide 14

Title: The Urban Tree Rules Stay Readable Even When The Story Is Ecological

Talking points:
- Remind the audience that interpretability does not disappear once we move beyond the simplest task.
- Explain how rule-based output can still support explanation in applied settings.
- Transition to the idea that boosting will prioritize predictive strength more heavily.

## Slide 15

Title: The Narrative So Far: Interpretability First, Power Second

Talking points:
- Summarize the logic so far: single trees explain, bagging stabilizes, random forests improve harder tasks.
- Say that the next step is boosting, where trees are built sequentially instead of independently.

## Slide 16

Title: Wildfire Data Is The Right Stage For Boosting

Talking points:
- Define boosting as sequential fitting that targets earlier mistakes.
- Explain why this dataset is used here: it supports a stronger performance-oriented demo.
- Stress again that the wildfire data is a vehicle for the final tree-method comparison.
- Introduce the regression target and the idea of modeling `log1p(acres)`.

## Slide 17

Title: Modern Tree Models Still Depend On Good Features

Talking points:
- Explain that trees do not need scaling, but they still need sensible features.
- Walk through time, location, and geometry features briefly.
- Mention that feature engineering still matters even with flexible tree models.

## Slide 18

Title: Classic Gradient Boosting Was The Most Accurate On Fire Size

Talking points:
- Define boosting as sequential error correction.
- Define histogram boosting as a faster implementation that bins feature values.
- Explain that each new tree focuses on residual mistakes left by earlier trees.
- Contrast this with random forests, where trees are built independently and then averaged.

## Slide 19

Title: Python Demo: One Preprocessing Pipeline, Four Tree Regressors

Talking points:
- Show that the preprocessing pipeline stays fixed while the estimator changes.
- Explain `ColumnTransformer` and `Pipeline` at a high level.
- Mention that `HistGradientBoostingRegressor` is the sklearn-friendly modern boosting variant in this talk.

## Slide 20

Title: One Theme, Three Datasets, Full Tree-Model Arc

Talking points:
- Recap the conceptual progression, not the datasets.
- State clearly when to choose a simple tree versus an ensemble versus boosting.
- End by emphasizing interpretability-versus-performance tradeoffs.

## Slide 21

Title: Data And Report Sources

Talking points:
- Keep this short.
- Mention that all examples came from real analyses in the workspace.
- Invite questions about tree setup, tuning, interpretation, or model choice.
