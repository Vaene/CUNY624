source(file.path("..", "shared.R"), local = TRUE)

df <- load_tree_data()
parts <- split_tree_data(df)

ui <- fluidPage(
  titlePanel("Slide 49. Boosting Example"),
  fluidRow(
    column(
      4,
      h4("Controls"),
      sliderInput("ntrees", "n.trees", 10, 1500, 100, step = 10),
      sliderInput("shrinkage", "Shrinkage", 0.001, 0.3, 0.1, step = 0.001),
      sliderInput("depth", "Interaction depth", 1, 8, 3, step = 1),
      sliderInput("bagfrac", "Bag fraction", 0.3, 1.0, 0.5, step = 0.05)
    ),
    column(
      8,
      div(
        class = "shiny-panel-grid",
        div(class = "shiny-panel", h4("Residual distribution"), plotOutput("resid", height = "220px")),
        div(class = "shiny-panel", h4("RMSE curve"), plotOutput("rmse_plot", height = "220px")),
        div(class = "shiny-panel", h4("Metrics"), verbatimTextOutput("metrics")),
        div(class = "shiny-panel", h4("Model summary"), verbatimTextOutput("summary"))
      )
    )
  )
)

server <- function(input, output, session) {
  gbm_model <- reactive({
    fit_gbm(parts$train, ntrees = input$ntrees, shrinkage = input$shrinkage,
            depth = input$depth, bagfrac = input$bagfrac)
  })

  output$resid <- renderPlot({
    pred <- predict_gbm(gbm_model(), parts$test, ntrees = input$ntrees)
    hist(parts$test$Age - pred, breaks = 30, col = "#c65a1e", border = "white",
         main = "Test residuals", xlab = "Observed - predicted")
  })

  output$rmse_plot <- renderPlot({
    ns <- unique(pmin(c(10, 25, 50, 100, 250, 500, 1000, input$ntrees), input$ntrees))
    rmses <- sapply(ns, function(n) {
      fit <- fit_gbm(parts$train, ntrees = n, shrinkage = input$shrinkage,
                     depth = input$depth, bagfrac = input$bagfrac)
      pred <- predict_gbm(fit, parts$test, ntrees = n)
      sqrt(mean((parts$test$Age - pred)^2))
    })
    plot(ns, rmses, type = "b", pch = 19, col = "#c65a1e",
         xlab = "n.trees", ylab = "Test RMSE",
         main = "Boosting usually improves as trees accumulate")
  })

  output$metrics <- renderPrint({
    pred <- predict_gbm(gbm_model(), parts$test, ntrees = input$ntrees)
    metric_card(parts$test$Age, pred)
  })

  output$summary <- renderPrint({
    cat(boost_summary_text(gbm_model()))
  })
}

shinyApp(ui, server)
