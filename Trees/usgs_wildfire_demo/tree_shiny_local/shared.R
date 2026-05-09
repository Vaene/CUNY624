suppressPackageStartupMessages({
  library(caret)
  library(ipred)
  library(randomForest)
  library(rpart)
  library(rpart.plot)
  if (requireNamespace("Cubist", quietly = TRUE)) {
    library(Cubist)
  }
  if (requireNamespace("gbm", quietly = TRUE)) {
    library(gbm)
  }
})

tree_data_path <- function() {
  script_dir <- NULL
  if (exists("ofile", inherits = TRUE)) {
    script_dir <- dirname(normalizePath(get("ofile", inherits = TRUE)))
  }

  workspace_root <- Sys.getenv("TREE_WORKSPACE_ROOT", unset = "/Users/randyhowk/Documents/CUNY/624/Trees")

  candidates <- c(
    Sys.getenv("TREE_DATA_PATH", unset = ""),
    file.path(workspace_root, "Data", "TS3_Raw_tree_data.csv"),
    if (!is.null(script_dir)) file.path(script_dir, "..", "..", "Data", "TS3_Raw_tree_data.csv") else NULL,
    if (!is.null(script_dir)) file.path(script_dir, "..", "TS3_Raw_tree_data.csv") else NULL,
    file.path("..", "..", "Data", "TS3_Raw_tree_data.csv"),
    file.path("..", "Data", "TS3_Raw_tree_data.csv"),
    file.path("Data", "TS3_Raw_tree_data.csv")
  )
  candidates <- candidates[nzchar(candidates)]
  existing <- candidates[file.exists(candidates)]
  if (!length(existing)) {
    stop("Could not find TS3_Raw_tree_data.csv. Set TREE_DATA_PATH or run from the repo.")
  }
  normalizePath(existing[[1]])
}

load_tree_data <- function() {
  df <- read.csv(tree_data_path(), stringsAsFactors = FALSE)

  keep <- intersect(
    c(
      "Age", "Region", "Park.Street", "TreeType",
      "DBH..cm.", "TreeHt..m.", "CrnBase", "CrnHt..m.", "AvgCdia..m.",
      "LandUse", "Shape", "WireConf"
    ),
    names(df)
  )

  df <- df[, keep, drop = FALSE]
  char_cols <- names(df)[vapply(df, is.character, logical(1))]
  df[char_cols] <- lapply(df[char_cols], as.factor)
  df$Age <- as.numeric(df$Age)
  df
}

split_tree_data <- function(df, seed = 624, train_prop = 0.8) {
  set.seed(seed)
  n_train <- max(1, floor(nrow(df) * train_prop))
  idx <- sample(seq_len(nrow(df)), n_train)
  list(train = df[idx, , drop = FALSE], test = df[-idx, , drop = FALSE])
}

metric_card <- function(obs, pred) {
  out <- caret::defaultSummary(data.frame(obs = obs, pred = pred))
  round(out, 4)
}

tree_size <- function(fit) {
  if (is.null(fit) || is.null(fit$frame)) return(NA_integer_)
  sum(fit$frame$var == "<leaf>")
}

tree_depth <- function(fit) {
  if (is.null(fit) || is.null(fit$frame)) return(NA_integer_)
  nodes <- as.integer(row.names(fit$frame))
  if (!length(nodes)) return(NA_integer_)
  floor(log(nodes, base = 2))
}

preprocess_na <- function(df, strategy = c("omit", "roughfix")) {
  strategy <- match.arg(strategy)
  if (strategy == "omit") {
    return(na.omit(df))
  }
  randomForest::na.roughfix(df)
}

inject_missingness <- function(df, frac = 0, seed = 624, cols = c("DBH..cm.", "TreeHt..m.")) {
  frac <- max(0, min(0.4, frac))
  if (frac <= 0) return(df)
  cols <- intersect(cols, names(df))
  if (!length(cols)) return(df)
  set.seed(seed)
  out <- df
  n <- nrow(out)
  n_missing <- max(1, floor(n * frac))
  for (col in cols) {
    idx <- sample(seq_len(n), n_missing)
    out[idx, col] <- NA
  }
  out
}

choose_rpart_prune <- function(fit, mode = c("none", "min_xerror", "one_se")) {
  mode <- match.arg(mode)
  if (mode == "none" || is.null(fit$cptable) || !nrow(fit$cptable)) {
    return(list(model = fit, cp = NA_real_, label = "as-grown"))
  }

  cp_tbl <- as.data.frame(fit$cptable)
  names(cp_tbl) <- c("CP", "nsplit", "rel_error", "xerror", "xstd")

  if (mode == "min_xerror") {
    cp <- cp_tbl$CP[[which.min(cp_tbl$xerror)]]
    return(list(model = prune(fit, cp = cp), cp = cp, label = "minimum xerror"))
  }

  min_ix <- which.min(cp_tbl$xerror)
  cutoff <- cp_tbl$xerror[[min_ix]] + cp_tbl$xstd[[min_ix]]
  eligible <- cp_tbl[cp_tbl$xerror <= cutoff, , drop = FALSE]
  cp <- max(eligible$CP)
  list(model = prune(fit, cp = cp), cp = cp, label = "1-SE rule")
}

format_rules <- function(fit, max_lines = 18) {
  rules <- capture.output(rpart.plot::rpart.rules(fit))
  if (length(rules) > max_lines) {
    rules <- c(rules[seq_len(max_lines)], "...", sprintf("(%d total lines)", length(rules)))
  }
  paste(rules, collapse = "\n")
}

fit_rpart <- function(train, response = "Age", cp = 0.01, maxdepth = 6, minsplit = 20,
                      minbucket = 7, xval = 10) {
  rpart(
    stats::as.formula(paste(response, "~ .")),
    data = train,
    method = "anova",
    control = rpart.control(
      cp = cp,
      maxdepth = maxdepth,
      minsplit = minsplit,
      minbucket = minbucket,
      xval = xval
    )
  )
}

fit_bagging <- function(train, response = "Age", nbagg = 25, maxdepth = 8, minsplit = 20, minbucket = 7) {
  bagging(
    stats::as.formula(paste(response, "~ .")),
    data = train,
    nbagg = nbagg,
    control = rpart.control(
      cp = 0.0,
      maxdepth = maxdepth,
      minsplit = minsplit,
      minbucket = minbucket
    )
  )
}

fit_random_forest <- function(train, response = "Age", ntree = 500, mtry = NULL, nodesize = 5) {
  predictors <- setdiff(names(train), response)
  if (is.null(mtry)) {
    mtry <- max(1, floor(sqrt(length(predictors))))
  }
  randomForest(
    stats::as.formula(paste(response, "~ .")),
    data = train,
    ntree = ntree,
    mtry = mtry,
    nodesize = nodesize,
    importance = TRUE,
    na.action = na.omit
  )
}

fit_gbm <- function(train, response = "Age", ntrees = 100, shrinkage = 0.1,
                    depth = 3, bagfrac = 0.5) {
  if (requireNamespace("gbm", quietly = TRUE)) {
    model <- gbm::gbm(
      stats::as.formula(paste(response, "~ .")),
      data = train,
      distribution = "gaussian",
      n.trees = ntrees,
      shrinkage = shrinkage,
      interaction.depth = depth,
      bag.fraction = bagfrac,
      verbose = FALSE
    )
    return(list(
      backend = "gbm",
      model = model,
      response = response,
      ntrees = ntrees,
      shrinkage = shrinkage,
      depth = depth,
      bagfrac = bagfrac
    ))
  }

  predictors <- setdiff(names(train), response)
  dv <- caret::dummyVars(stats::as.formula(paste("~", paste(predictors, collapse = "+"))),
                         data = train, fullRank = TRUE)
  x <- as.data.frame(predict(dv, newdata = train))
  model <- Cubist::cubist(x, train[[response]], committees = ntrees)
  list(
    backend = "cubist",
    model = model,
    dummy_vars = dv,
    response = response,
    ntrees = ntrees,
    shrinkage = shrinkage,
    depth = depth,
    bagfrac = bagfrac
  )
}

predict_gbm <- function(fit, newdata, ntrees = NULL) {
  if (fit$backend == "gbm") {
    return(predict(fit$model, newdata, n.trees = if (is.null(ntrees)) fit$ntrees else ntrees))
  }
  x <- as.data.frame(predict(fit$dummy_vars, newdata = newdata))
  predict(fit$model, x)
}

boost_summary_text <- function(fit) {
  if (fit$backend == "gbm") {
    infl <- summary(fit$model, plotit = FALSE)
    infl <- infl[seq_len(min(nrow(infl), 10)), , drop = FALSE]
    lines <- c(
      sprintf("Backend: gbm"),
      sprintf("n.trees: %s", fit$ntrees),
      "",
      "Top relative influence:"
    )
    for (i in seq_len(nrow(infl))) {
      lines <- c(lines, sprintf("  %s: %.2f", infl$var[[i]], infl$rel.inf[[i]]))
    }
    return(paste(lines, collapse = "\n"))
  }

  paste(capture.output(summary(fit$model)), collapse = "\n")
}
