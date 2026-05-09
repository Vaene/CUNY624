source(file.path("..", "shared.R"), local = TRUE)

df <- load_tree_data()
parts <- split_tree_data(df)

ui <- fluidPage(
  titlePanel("Slide 45. Regression Tree Example"),
  fluidRow(
    column(
      4,
      h4("Controls"),
      sliderInput("cp", "Pre-pruning cp", 0.001, 0.05, 0.01, step = 0.001),
      sliderInput("maxdepth", "Max depth", 1, 20, 6, step = 1),
      sliderInput("minsplit", "Min split", 2, 80, 20, step = 1),
      sliderInput("minbucket", "Min bucket", 1, 30, 7, step = 1),
      sliderInput("xval", "Cross-validation folds", 2, 20, 10, step = 1),
      radioButtons(
        "prune_mode",
        "Pruning method",
        choices = c("As grown" = "none", "Minimum xerror" = "min_xerror", "1-SE rule" = "one_se"),
        selected = "one_se"
      ),
      helpText("The slide points to Weka_control(); this local build uses rpart controls to show the same pruning ideas.")
    ),
    column(
      8,
      div(
        class = "shiny-panel-grid",
        div(class = "shiny-panel", h4("Tree"), plotOutput("tree_plot", height = "360px")),
        div(class = "shiny-panel", h4("CP profile"), plotOutput("cp_plot", height = "250px")),
        div(class = "shiny-panel", h4("Metrics"), verbatimTextOutput("metrics")),
        div(class = "shiny-panel", h4("Pruning summary"), verbatimTextOutput("summary"))
      )
    )
  )
)

server <- function(input, output, session) {
  model <- reactive({
    fit <- fit_rpart(parts$train, cp = input$cp, maxdepth = input$maxdepth,
                     minsplit = input$minsplit, minbucket = input$minbucket,
                     xval = input$xval)
    prune_choice <- choose_rpart_prune(fit, input$prune_mode)
    list(
      grown = fit,
      model = prune_choice$model,
      prune_cp = prune_choice$cp,
      prune_label = prune_choice$label
    )
  })

  output$tree_plot <- renderPlot({
    rpart.plot(model()$model, box.palette = "Blues", shadow.col = "gray85",
               tweak = 1.02, fallen.leaves = TRUE, main = NULL)
  })

  output$cp_plot <- renderPlot({
    plotcp(model()$grown, main = "Cross-validated pruning path")
    if (!is.na(model()$prune_cp)) {
      abline(v = model()$prune_cp, col = "#c65a1e", lwd = 2, lty = 2)
    }
  })

  output$metrics <- renderPrint({
    pred <- predict(model()$model, parts$test)
    metric_card(parts$test$Age, pred)
  })

  output$summary <- renderPrint({
    grown <- model()$grown
    pruned <- model()$model
    cat("Pre-pruned tree size:", tree_size(grown), "\n")
    cat("Post-pruned tree size:", tree_size(pruned), "\n")
    cat("Selected pruning rule:", model()$prune_label, "\n")
    if (!is.na(model()$prune_cp)) {
      cat("Pruning cp:", format(model()$prune_cp, digits = 5), "\n")
    }
    cat("Depth:", tree_depth(pruned), "\n")
  })
}

shinyApp(ui, server)
