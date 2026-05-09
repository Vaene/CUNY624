source(file.path("..", "shared.R"), local = TRUE)

df <- load_tree_data()
parts <- split_tree_data(df)

ui <- fluidPage(
  titlePanel("Slide 47. Bagged Tree Example"),
  fluidRow(
    column(
      4,
      h4("Controls"),
      sliderInput("nbagg", "Number of trees", 5, 250, 50, step = 5),
      sliderInput("maxdepth", "Max depth per base tree", 1, 20, 8, step = 1),
      sliderInput("minsplit", "Min split", 2, 80, 20, step = 1),
      sliderInput("minbucket", "Min bucket", 1, 30, 7, step = 1)
    ),
    column(
      8,
      div(
        class = "shiny-panel-grid",
        div(class = "shiny-panel", h4("Performance curve"), plotOutput("rmse_plot", height = "280px")),
        div(class = "shiny-panel", h4("Metrics"), verbatimTextOutput("metrics")),
        div(class = "shiny-panel", h4("Model summary"), verbatimTextOutput("summary"))
      )
    )
  )
)

server <- function(input, output, session) {
  bag_model <- reactive({
    fit_bagging(parts$train, nbagg = input$nbagg, maxdepth = input$maxdepth,
                minsplit = input$minsplit, minbucket = input$minbucket)
  })

  output$rmse_plot <- renderPlot({
    ns <- unique(pmin(c(5, 10, 25, 50, 100, 150, 200, input$nbagg), input$nbagg))
    rmses <- sapply(ns, function(n) {
      fit <- fit_bagging(parts$train, nbagg = n, maxdepth = input$maxdepth,
                         minsplit = input$minsplit, minbucket = input$minbucket)
      pred <- predict(fit, parts$test)
      sqrt(mean((parts$test$Age - pred)^2))
    })
    plot(ns, rmses, type = "b", pch = 19, col = "#2f6b5f",
         xlab = "Number of bagged trees", ylab = "Test RMSE",
         main = "More bags usually mean lower variance")
  })

  output$metrics <- renderPrint({
    pred <- predict(bag_model(), parts$test)
    metric_card(parts$test$Age, pred)
  })

  output$summary <- renderPrint({
    cat("Bagged trees:", input$nbagg, "\n")
    cat("Base-tree size:", tree_size(bag_model()$mtrees[[1]]), "\n")
    cat("Base-tree depth:", tree_depth(bag_model()$mtrees[[1]]), "\n")
  })
}

shinyApp(ui, server)
