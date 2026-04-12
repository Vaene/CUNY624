library(shiny)
library(glmnet)
library(MASS)
library(ISLR)
library(dplyr)

# Helper functions
rmse <- function(actual, predicted) {
  sqrt(mean((actual - predicted)^2))
}

fit_three_models <- function(x_train, y_train, x_test, y_test, alpha_enet = 0.5) {
  ridge_cv <- cv.glmnet(x_train, y_train, alpha = 0)
  lasso_cv <- cv.glmnet(x_train, y_train, alpha = 1)
  enet_cv  <- cv.glmnet(x_train, y_train, alpha = alpha_enet)

  pred_ridge <- predict(ridge_cv, newx = x_test, s = "lambda.min")
  pred_lasso <- predict(lasso_cv, newx = x_test, s = "lambda.min")
  pred_enet  <- predict(enet_cv,  newx = x_test, s = "lambda.min")

  out <- data.frame(
    model = c("ridge", "lasso", paste0("elastic_net_alpha_", alpha_enet)),
    lambda_min = c(ridge_cv$lambda.min, lasso_cv$lambda.min, enet_cv$lambda.min),
    test_rmse = c(
      rmse(y_test, pred_ridge),
      rmse(y_test, pred_lasso),
      rmse(y_test, pred_enet)
    )
  )

  list(
    summary = out,
    ridge = ridge_cv,
    lasso = lasso_cv,
    enet = enet_cv
  )
}

nonzero_count <- function(model) {
  sum(coef(model, s = "lambda.min")[-1, 1] != 0)
}

# Multiple random splits analysis
run_multiple_splits <- function(x, y, n_splits = 10, alpha_enet = 0.5, train_split = 0.7) {
  results_list <- list()
  
  for (i in 1:n_splits) {
    train_id <- sample(seq_len(nrow(x)), size = floor(train_split * nrow(x)))
    x_train <- x[train_id, ]
    x_test  <- x[-train_id, ]
    y_train <- y[train_id]
    y_test  <- y[-train_id]
    
    ridge_cv <- cv.glmnet(x_train, y_train, alpha = 0)
    lasso_cv <- cv.glmnet(x_train, y_train, alpha = 1)
    enet_cv  <- cv.glmnet(x_train, y_train, alpha = alpha_enet)
    
    pred_ridge <- predict(ridge_cv, newx = x_test, s = "lambda.min")
    pred_lasso <- predict(lasso_cv, newx = x_test, s = "lambda.min")
    pred_enet  <- predict(enet_cv,  newx = x_test, s = "lambda.min")
    
    results_list[[i]] <- data.frame(
      split = i,
      model = c("ridge", "lasso", "elastic_net"),
      rmse = c(
        rmse(y_test, pred_ridge),
        rmse(y_test, pred_lasso),
        rmse(y_test, pred_enet)
      ),
      nonzero_coefs = c(
        nonzero_count(ridge_cv),
        nonzero_count(lasso_cv),
        nonzero_count(enet_cv)
      )
    )
  }
  
  do.call(rbind, results_list)
}


ui <- fluidPage(
  titlePanel("Ridge, Lasso, and Elastic Net Explorer"),
  
  sidebarLayout(
    sidebarPanel(
      selectInput("dataset", "Choose Dataset:",
        choices = c(
          "Hitters (Real Data)" = "hitters",
          "Boston Housing (Correlated Predictors)" = "boston",
          "Sparse Synthetic Data" = "sparse",
          "High-Dimensional (p > n)" = "highdim"
        )
      ),
      
      sliderInput("alpha_enet", "Elastic Net Alpha:",
        min = 0, max = 1, value = 0.5, step = 0.1
      ),
      
      sliderInput("train_split", "Train/Test Split (% train):",
        min = 0.5, max = 0.9, value = 0.7, step = 0.05
      ),
      
      checkboxInput("use_multiple_splits", "Use Multiple Random Splits?", value = FALSE),
      
      conditionalPanel(
        condition = "input.use_multiple_splits == true",
        sliderInput("n_splits", "Number of Splits to Test:",
          min = 5, max = 50, value = 10, step = 5
        ),
        helpText("Tests the models on many different random train/test splits to assess stability.")
      ),
      
      actionButton("run_analysis", "Run Analysis", class = "btn-primary")
    ),
    
    mainPanel(
      tabsetPanel(
        tabPanel("Model Comparison",
          h3("Test RMSE and Lambda Values"),
          tableOutput("model_summary"),
          h3("Non-Zero Coefficients"),
          tableOutput("coef_counts")
        ),
        
        tabPanel("Lasso Coefficients",
          h3("Non-Zero Coefficients from Lasso"),
          verbatimTextOutput("lasso_coefs")
        ),
        
        tabPanel("Ridge Paths",
          h3("Ridge Coefficient Paths"),
          plotOutput("ridge_plot", height = "500px")
        ),
        
        tabPanel("Lasso Paths",
          h3("Lasso Coefficient Paths"),
          plotOutput("lasso_plot", height = "500px")
        ),
        
        tabPanel("Cross-Validation",
          h3("Ridge Cross-Validation Curve"),
          plotOutput("ridge_cv", height = "400px"),
          h3("Lasso Cross-Validation Curve"),
          plotOutput("lasso_cv", height = "400px")
        ),
        
        tabPanel("Predictions",
          h3("Predicted vs Actual Values"),
          p("Points closer to the diagonal line indicate better predictions."),
          plotOutput("predictions_plot", height = "600px")
        ),
        
        tabPanel("Residuals",
          h3("Residuals vs Predicted Values"),
          p("Look for random scatter around zero. Systematic patterns indicate model issues."),
          plotOutput("residuals_plot", height = "600px")
        ),
        
        tabPanel("Cross-Validation Analysis",
          h3("Stability Across Multiple Random Splits"),
          p("Shows mean and standard deviation of RMSE across multiple train/test splits."),
          tableOutput("cv_summary"),
          br(),
          plotOutput("cv_boxplot", height = "500px")
        ),
        
        tabPanel("Data Info",
          h3("Dataset Description"),
          textOutput("data_info"),
          h3("Data Summary"),
          verbatimTextOutput("data_summary")
        )
      )
    )
  )
)

# Server
server <- function(input, output, session) {
  
  results <- reactiveVal(NULL)
  data_info <- reactiveVal("")
  cv_results <- reactiveVal(NULL)
  
  observeEvent(input$run_analysis, {
    set.seed(42)
    
    if (input$dataset == "hitters") {
      data(Hitters)
      hitters <- na.omit(Hitters)
      x <- model.matrix(Salary ~ ., hitters)[, -1]
      y <- hitters$Salary
      
      train_id <- sample(seq_len(nrow(x)), size = floor(input$train_split * nrow(x)))
      info_text <- paste(
        "Dataset: Hitters (Baseball player salaries)",
        "n =", nrow(x), "observations",
        "p =", ncol(x), "predictors",
        sep = "\n"
      )
    } else if (input$dataset == "boston") {
      data(Boston)
      x <- model.matrix(medv ~ ., Boston)[, -1]
      y <- Boston$medv
      
      train_id <- sample(seq_len(nrow(x)), size = floor(input$train_split * nrow(x)))
      info_text <- paste(
        "Dataset: Boston Housing (Housing prices)",
        "n =", nrow(x), "observations",
        "p =", ncol(x), "predictors",
        "Note: Contains correlated predictors (e.g., tax, rad, indus)",
        sep = "\n"
      )
    } else if (input$dataset == "sparse") {
      n <- 150
      p <- 60
      x <- matrix(rnorm(n * p), nrow = n, ncol = p)
      true_beta <- c(4, -3, 2.5, -2, 1.5, rep(0, p - 5))
      y <- x %*% true_beta + rnorm(n, sd = 2)
      
      train_id <- sample(seq_len(n), size = floor(input$train_split * n))
      info_text <- paste(
        "Dataset: Synthetic Sparse Data",
        "n =", n, "observations",
        "p =", p, "predictors",
        "True signal in first 5 predictors only",
        sep = "\n"
      )
    } else if (input$dataset == "highdim") {
      n <- 60
      p <- 300
      x <- matrix(rnorm(n * p), nrow = n, ncol = p)
      true_beta <- c(3, -2.5, 2, -1.5, 1, rep(0, p - 5))
      y <- x %*% true_beta + rnorm(n, sd = 2)
      
      train_id <- sample(seq_len(n), size = floor(input$train_split * n))
      info_text <- paste(
        "Dataset: High-Dimensional (p > n)",
        "n =", n, "observations",
        "p =", p, "predictors",
        "High-dimensional regime where OLS fails",
        sep = "\n"
      )
    }
    
    x_train <- x[train_id, ]
    x_test  <- x[-train_id, ]
    y_train <- y[train_id]
    y_test  <- y[-train_id]
    
    fit <- fit_three_models(x_train, y_train, x_test, y_test, alpha_enet = input$alpha_enet)
    
    results(list(
      fit = fit,
      x_test = x_test,
      y_test = y_test
    ))
    data_info(info_text)
    
    # Run multiple splits analysis if requested
    if (input$use_multiple_splits) {
      cv_data <- run_multiple_splits(x, y, n_splits = input$n_splits, 
                                     alpha_enet = input$alpha_enet, 
                                     train_split = input$train_split)
      cv_results(cv_data)
    } else {
      cv_results(NULL)
    }
  })
  
  output$model_summary <- renderTable({
    if (is.null(results())) return(NULL)
    results()$fit$summary
  }, digits = 4)
  
  output$coef_counts <- renderTable({
    if (is.null(results())) return(NULL)
    data.frame(
      model = c("ridge", "lasso", "elastic_net"),
      nonzero = c(
        nonzero_count(results()$fit$ridge),
        nonzero_count(results()$fit$lasso),
        nonzero_count(results()$fit$enet)
      )
    )
  })
  
  output$lasso_coefs <- renderPrint({
    if (is.null(results())) return(NULL)
    coef(results()$fit$lasso, s = "lambda.min")
  })
  
  output$ridge_plot <- renderPlot({
    if (is.null(results())) return(NULL)
    plot(results()$fit$ridge$glmnet.fit, xvar = "lambda", 
         main = "Ridge Coefficient Paths")
  })
  
  output$lasso_plot <- renderPlot({
    if (is.null(results())) return(NULL)
    plot(results()$fit$lasso$glmnet.fit, xvar = "lambda", 
         main = "Lasso Coefficient Paths")
  })
  
  output$ridge_cv <- renderPlot({
    if (is.null(results())) return(NULL)
    plot(results()$fit$ridge, main = "Ridge Cross-Validation")
  })
  
  output$lasso_cv <- renderPlot({
    if (is.null(results())) return(NULL)
    plot(results()$fit$lasso, main = "Lasso Cross-Validation")
  })
  
  output$data_info <- renderText({
    data_info()
  })
  
  output$data_summary <- renderPrint({
    if (is.null(results())) {
      cat("Click 'Run Analysis' to see data summary")
    } else {
      cat("Train/Test split:", input$train_split, "\n")
      cat("Elastic Net Alpha:", input$alpha_enet, "\n")
    }
  })
  
  output$predictions_plot <- renderPlot({
    if (is.null(results())) return(NULL)
    
    fit <- results()$fit
    x_test <- results()$x_test
    y_test <- results()$y_test
    
    # Get predictions
    pred_ridge <- predict(fit$ridge, newx = x_test, s = "lambda.min")[, 1]
    pred_lasso <- predict(fit$lasso, newx = x_test, s = "lambda.min")[, 1]
    pred_enet <- predict(fit$enet, newx = x_test, s = "lambda.min")[, 1]
    
    # Create plot with 3 subplots
    par(mfrow = c(1, 3))
    
    # Ridge
    plot(y_test, pred_ridge, main = "Ridge", xlab = "Actual", ylab = "Predicted",
         pch = 19, col = rgb(0, 0, 1, 0.5))
    abline(0, 1, col = "red", lwd = 2)
    
    # Lasso
    plot(y_test, pred_lasso, main = "Lasso", xlab = "Actual", ylab = "Predicted",
         pch = 19, col = rgb(0, 1, 0, 0.5))
    abline(0, 1, col = "red", lwd = 2)
    
    # Elastic Net
    plot(y_test, pred_enet, main = paste0("Elastic Net (α=", input$alpha_enet, ")"), 
         xlab = "Actual", ylab = "Predicted",
         pch = 19, col = rgb(1, 0, 0, 0.5))
    abline(0, 1, col = "red", lwd = 2)
    
    par(mfrow = c(1, 1))
  })
  
  output$residuals_plot <- renderPlot({
    if (is.null(results())) return(NULL)
    
    fit <- results()$fit
    x_test <- results()$x_test
    y_test <- results()$y_test
    
    # Get predictions
    pred_ridge <- predict(fit$ridge, newx = x_test, s = "lambda.min")[, 1]
    pred_lasso <- predict(fit$lasso, newx = x_test, s = "lambda.min")[, 1]
    pred_enet <- predict(fit$enet, newx = x_test, s = "lambda.min")[, 1]
    
    # Calculate residuals
    res_ridge <- y_test - pred_ridge
    res_lasso <- y_test - pred_lasso
    res_enet <- y_test - pred_enet
    
    # Create plot with 3 subplots
    par(mfrow = c(1, 3))
    
    # Ridge
    plot(pred_ridge, res_ridge, main = "Ridge", xlab = "Predicted", 
         ylab = "Residuals", pch = 19, col = rgb(0, 0, 1, 0.5))
    abline(h = 0, col = "red", lwd = 2)
    
    # Lasso
    plot(pred_lasso, res_lasso, main = "Lasso", xlab = "Predicted", 
         ylab = "Residuals", pch = 19, col = rgb(0, 1, 0, 0.5))
    abline(h = 0, col = "red", lwd = 2)
    
    # Elastic Net
    plot(pred_enet, res_enet, main = paste0("Elastic Net (α=", input$alpha_enet, ")"), 
         xlab = "Predicted", ylab = "Residuals",
         pch = 19, col = rgb(1, 0, 0, 0.5))
    abline(h = 0, col = "red", lwd = 2)
    
    par(mfrow = c(1, 1))
  })
  
  output$cv_summary <- renderTable({
    if (is.null(cv_results())) {
      return(data.frame(Note = "Enable 'Multiple Random Splits' and run analysis"))
    }
    
    cv_data <- cv_results()
    summary_table <- cv_data %>%
      group_by(model) %>%
      summarise(
        mean_rmse = mean(rmse),
        sd_rmse = sd(rmse),
        min_rmse = min(rmse),
        max_rmse = max(rmse),
        mean_nonzero = mean(nonzero_coefs),
        .groups = 'drop'
      )
    
    as.data.frame(summary_table)
  }, digits = 4)
  
  output$cv_boxplot <- renderPlot({
    if (is.null(cv_results())) return(NULL)
    
    cv_data <- cv_results()
    
    boxplot(rmse ~ model, data = cv_data,
            main = paste("Model Performance Across", length(unique(cv_data$split)), "Random Splits"),
            ylab = "RMSE",
            col = c("lightblue", "lightgreen", "lightcoral"))
  })
}

shinyApp(ui, server)
