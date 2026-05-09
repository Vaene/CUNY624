source(file.path("..", "shared.R"), local = TRUE)

df <- load_tree_data()
parts <- split_tree_data(df)

ui <- fluidPage(
  titlePanel("Slide 48. Random Forest"),
  fluidRow(
    column(
      4,
      h4("Controls"),
      sliderInput("ntree", "Number of trees", 50, 1000, 500, step = 50),
      sliderInput("mtry", "mtry", 1, max(1, ncol(parts$train) - 2), max(1, floor(sqrt(ncol(parts$train) - 2))), step = 1),
      sliderInput("nodesize", "Nodesize", 1, 25, 5, step = 1),
      sliderInput("missing_frac", "Inject missingness in predictors", 0, 0.3, 0, step = 0.02),
      radioButtons(
        "na_mode",
        "na.action",
        choices = c("Drop rows" = "omit", "Roughfix imputation" = "roughfix"),
        selected = "roughfix"
      )
    ),
    column(
      8,
      div(
        class = "shiny-panel-grid",
        div(class = "shiny-panel", h4("Variable importance"), plotOutput("imp", height = "260px")),
        div(class = "shiny-panel", h4("OOB error"), plotOutput("oob", height = "220px")),
        div(class = "shiny-panel", h4("Metrics"), verbatimTextOutput("metrics")),
        div(class = "shiny-panel", h4("Missingness handling"), verbatimTextOutput("missing_summary"))
      )
    )
  )
)

server <- function(input, output, session) {
  prep_data <- reactive({
    train <- parts$train
    test <- parts$test
    if (input$missing_frac > 0) {
      train <- inject_missingness(train, frac = input$missing_frac, seed = 624,
                                  cols = c("DBH..cm.", "TreeHt..m.", "AvgCdia..m."))
      test <- inject_missingness(test, frac = input$missing_frac / 2, seed = 625,
                                 cols = c("DBH..cm.", "TreeHt..m.", "AvgCdia..m."))
    }
    list(
      train = preprocess_na(train, input$na_mode),
      test = preprocess_na(test, input$na_mode)
    )
  })

  rf_model <- reactive({
    fit_random_forest(prep_data()$train, ntree = input$ntree, mtry = input$mtry, nodesize = input$nodesize)
  })

  output$imp <- renderPlot({
    varImpPlot(rf_model(), main = "Variable importance")
  })

  output$oob <- renderPlot({
    plot(rf_model(), main = "OOB error across trees")
  })

  output$metrics <- renderPrint({
    pred <- predict(rf_model(), prep_data()$test)
    metric_card(prep_data()$test$Age, pred)
  })

  output$missing_summary <- renderPrint({
    cat("Rows in training set:", nrow(prep_data()$train), "\n")
    cat("Rows in test set:", nrow(prep_data()$test), "\n")
    cat("na.action:", input$na_mode, "\n")
    cat("Injected missingness:", format(input$missing_frac, digits = 2), "\n")
  })
}

shinyApp(ui, server)
