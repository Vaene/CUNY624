#!/usr/bin/env bash
###############################################################################
# deploy-tree-shiny.sh
#
# One-shot deployment of 5 Shiny apps (slides 45-49 of the Data 624 Tree Models
# deck) to AWS App Runner via ECR.
#
# This script mirrors the interactive app structure used by the presentation
# embeds so the local test path and the hosted App Runner path stay aligned.
#
# Apps served:
#   /m5p       Regression Tree   (slide 45)
#   /m5rules   Rule-Based Tree   (slide 46)
#   /bagging   Bagged Trees      (slide 47)
#   /rf        Random Forest     (slide 48)
#   /gbm       Boosting          (slide 49)
#
# Prerequisites:
#   - AWS CLI v2 configured (aws sts get-caller-identity must succeed)
#   - Docker installed and running
#   - A CSV of the USDA urban tree data at ./Data/TS3_Raw_tree_data.csv in the
#     cwd when this script is run (or edit DATA_CSV below)
#
# Usage:
#   chmod +x deploy-tree-shiny.sh
#   ./deploy-tree-shiny.sh              # build + deploy
#   ./deploy-tree-shiny.sh update       # rebuild image + redeploy service
#   ./deploy-tree-shiny.sh destroy      # tear everything down
#
###############################################################################
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

############################### CONFIG ########################################
export AWS_REGION="${AWS_REGION:-us-east-1}"
export ECR_REPO="${ECR_REPO:-tree-shiny}"
export APP_NAME="${APP_NAME:-tree-shiny}"
export IMAGE_TAG="${IMAGE_TAG:-v1}"
export DATA_CSV="${DATA_CSV:-${REPO_ROOT}/Data/TS3_Raw_tree_data.csv}"
export CPU_SIZE="${CPU_SIZE:-1 vCPU}"
export MEM_SIZE="${MEM_SIZE:-2 GB}"
export MIN_SIZE="${MIN_SIZE:-0}"     # 0 = scale to zero when idle
export MAX_SIZE="${MAX_SIZE:-2}"
export MAX_CONCURRENCY="${MAX_CONCURRENCY:-100}"

export BUILD_DIR="${BUILD_DIR:-${SCRIPT_DIR}/tree-shiny-build}"
export LOCAL_APPS_DIR="${LOCAL_APPS_DIR:-${SCRIPT_DIR}/tree_shiny_local}"
###############################################################################

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
IMAGE_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${IMAGE_TAG}"
ROLE_NAME="AppRunnerECRAccessRole-${APP_NAME}"
ASC_NAME="${APP_NAME}-scaling"

ACTION="${1:-deploy}"

############################### HELPERS #######################################
log()  { echo -e "\033[1;34m[+]\033[0m $*"; }
warn() { echo -e "\033[1;33m[!]\033[0m $*"; }
err()  { echo -e "\033[1;31m[x]\033[0m $*" >&2; }

require() {
  command -v "$1" >/dev/null 2>&1 || { err "Missing command: $1"; exit 1; }
}

############################### BUILD PROJECT #################################
scaffold_project() {
  log "Scaffolding build directory at ${BUILD_DIR}"
  rm -rf "${BUILD_DIR}"
  if [[ ! -d "${LOCAL_APPS_DIR}" ]]; then
    err "Cannot find local app source at ${LOCAL_APPS_DIR}."
    exit 1
  fi
  if [[ ! -f "${DATA_CSV}" ]]; then
    err "Cannot find data CSV at ${DATA_CSV}. Set DATA_CSV if needed."
    exit 1
  fi
  mkdir -p "${BUILD_DIR}"
  log "Copying local app source from ${LOCAL_APPS_DIR}"
  cp -R "${LOCAL_APPS_DIR}/." "${BUILD_DIR}/"
  mkdir -p "${BUILD_DIR}/Data"
  cp "${DATA_CSV}" "${BUILD_DIR}/Data/TS3_Raw_tree_data.csv"
  cat > "${BUILD_DIR}/shiny-server.conf" <<'EOF'
run_as shiny;
server {
  listen 3838;
  location / {
    site_dir /srv/shiny-server;
    log_dir  /var/log/shiny-server;
    directory_index on;
    app_idle_timeout 0;
  }
}
EOF
  cat > "${BUILD_DIR}/Dockerfile" <<'EOF'
FROM rocker/shiny:4.4.1

RUN apt-get update && apt-get install -y --no-install-recommends \
      libxml2-dev libcurl4-openssl-dev libssl-dev && \
    rm -rf /var/lib/apt/lists/*

RUN R -e "install.packages(c('rpart','rpart.plot','ipred','randomForest', \
    'gbm','Cubist','caret','partykit','shiny'), repos='https://cloud.r-project.org')"

COPY . /srv/shiny-server/
COPY shiny-server.conf /etc/shiny-server/shiny-server.conf

EXPOSE 3838
CMD ["/usr/bin/shiny-server"]
EOF
  log "Build scaffold ready."
  return 0

  # ---------- shared prep script (runs at image build) ----------
  cat > "${BUILD_DIR}/_shared/data_prep.R" <<'EOF'
suppressPackageStartupMessages(library(dplyr))
tree_df <- read.csv("/tmp/data/usda_trees.csv")
keep <- intersect(c("Age","Region","Park.Street","TreeType",
                    "DBH..cm.","TreeHt..m.","CrnBase","CrnHt..m.",
                    "AvgCdia..m."), names(tree_df))
tree_df <- tree_df[, keep] |> na.omit()
set.seed(624)
idx   <- sample(seq_len(nrow(tree_df)), 0.8 * nrow(tree_df))
train <- tree_df[idx, ]; test <- tree_df[-idx, ]
for (app in c("m5p","m5rules","bagging","rf","gbm")) {
  saveRDS(train, sprintf("/srv/shiny-server/%s/train.rds", app))
  saveRDS(test,  sprintf("/srv/shiny-server/%s/test.rds",  app))
}
cat("Prepared train/test for all apps.\n")
EOF

  # ---------- shared scorecard helper ----------
  cat > "${BUILD_DIR}/_shared/scorecard.R" <<'EOF'
suppressPackageStartupMessages(library(caret))
metric_card <- function(obs, pred) {
  round(caret::defaultSummary(data.frame(obs = obs, pred = pred)), 4)
}
EOF

  # ---------- app 1: Regression Tree (rpart stand-in for M5P) ----------
  cat > "${BUILD_DIR}/apps/m5p/app.R" <<'EOF'
library(shiny); library(rpart); library(rpart.plot)
source("scorecard.R")
train <- readRDS("train.rds"); test <- readRDS("test.rds")
ui <- fluidPage(
  titlePanel("Regression Tree (slide 45)"),
  fluidRow(
    column(4,
      sliderInput("cp","complexity (cp)",0.001,0.1,0.01,step=0.001),
      sliderInput("maxdepth","maxdepth",1,15,6),
      sliderInput("minsplit","minsplit",2,60,20)),
    column(8,
      h4("Test-set metrics"), verbatimTextOutput("metrics"),
      h5("Slide 45 M5P baseline: RMSE 12.08 | R2 0.726 | MAE 8.32"),
      plotOutput("tree", height="360px"))
  )
)
server <- function(input, output) {
  fit <- reactive(rpart(Age ~ ., data=train, method="anova",
    control=rpart.control(cp=input$cp, maxdepth=input$maxdepth,
                          minsplit=input$minsplit)))
  output$metrics <- renderPrint(metric_card(test$Age, predict(fit(), test)))
  output$tree    <- renderPlot(rpart.plot(fit(), box.palette="Blues"))
}
shinyApp(ui, server)
EOF

  # ---------- app 2: Rule-Based (lmtree stand-in for M5Rules) ----------
  cat > "${BUILD_DIR}/apps/m5rules/app.R" <<'EOF'
library(shiny); library(partykit)
source("scorecard.R")
train <- readRDS("train.rds"); test <- readRDS("test.rds")
ui <- fluidPage(
  titlePanel("Rule-Based Model (slide 46)"),
  fluidRow(
    column(4,
      sliderInput("minsize","min node size",10,200,40,step=10),
      sliderInput("alpha","split significance (alpha)",0.001,0.1,0.05,step=0.001)),
    column(8,
      h4("Test-set metrics"), verbatimTextOutput("metrics"),
      h5("Slide 46 M5Rules baseline: RMSE 13.43 | R2 0.672 | MAE 8.76"),
      h4("Rules / partition"), verbatimTextOutput("rules"))
  )
)
server <- function(input, output) {
  fit <- reactive(lmtree(Age ~ DBH..cm. | ., data=train,
                         minsize=input$minsize, alpha=input$alpha))
  output$metrics <- renderPrint(metric_card(test$Age, predict(fit(), test)))
  output$rules   <- renderPrint(fit())
}
shinyApp(ui, server)
EOF

  # ---------- app 3: Bagged Trees ----------
  cat > "${BUILD_DIR}/apps/bagging/app.R" <<'EOF'
library(shiny); library(ipred); library(rpart)
source("scorecard.R")
train <- readRDS("train.rds"); test <- readRDS("test.rds")
ui <- fluidPage(
  titlePanel("Bagged Trees (slide 47)"),
  fluidRow(
    column(4,
      sliderInput("nbagg","nbagg",1,100,25),
      sliderInput("depth","maxdepth",1,20,10)),
    column(8,
      h4("Test-set metrics"), verbatimTextOutput("metrics"),
      h5("Slide 47 baseline: RMSE 12.43 | R2 0.698 | MAE 8.92"),
      plotOutput("curve", height="300px"))
  )
)
server <- function(input, output) {
  output$metrics <- renderPrint({
    m <- bagging(Age ~ ., data=train, nbagg=input$nbagg,
                 control=rpart.control(maxdepth=input$depth))
    metric_card(test$Age, predict(m, test))
  })
  output$curve <- renderPlot({
    ns <- c(1,5,10,25,50,100)
    rmses <- sapply(ns, function(n){
      m <- bagging(Age ~ ., data=train, nbagg=n,
                   control=rpart.control(maxdepth=input$depth))
      sqrt(mean((test$Age - predict(m, test))^2))
    })
    plot(ns, rmses, type="b", xlab="nbagg", ylab="Test RMSE",
         main="Variance shrinks as you bag more trees")
  })
}
shinyApp(ui, server)
EOF

  # ---------- app 4: Random Forest ----------
  cat > "${BUILD_DIR}/apps/rf/app.R" <<'EOF'
library(shiny); library(randomForest)
source("scorecard.R")
train <- readRDS("train.rds"); test <- readRDS("test.rds")
p_max <- ncol(train) - 1
ui <- fluidPage(
  titlePanel("Random Forest (slide 48)"),
  fluidRow(
    column(4,
      sliderInput("ntree","ntree",50,1000,500,step=50),
      sliderInput("mtry","mtry",1,p_max,max(1,floor(sqrt(p_max)))),
      sliderInput("nodesize","nodesize",1,30,5)),
    column(8,
      h4("Test-set metrics"), verbatimTextOutput("metrics"),
      h5("Slide 48 baseline: RMSE 10.88 | R2 0.799 | MAE 7.16"),
      plotOutput("imp", height="260px"),
      plotOutput("err", height="220px"))
  )
)
server <- function(input, output) {
  fit <- reactive(randomForest(Age ~ ., data=train,
                               ntree=input$ntree, mtry=input$mtry,
                               nodesize=input$nodesize, importance=TRUE))
  output$metrics <- renderPrint(metric_card(test$Age, predict(fit(), test)))
  output$imp <- renderPlot(varImpPlot(fit(), main="Variable importance"))
  output$err <- renderPlot(plot(fit(), main="OOB error vs. trees"))
}
shinyApp(ui, server)
EOF

  # ---------- app 5: Boosting ----------
  cat > "${BUILD_DIR}/apps/gbm/app.R" <<'EOF'
library(shiny); library(gbm)
source("scorecard.R")
train <- readRDS("train.rds"); test <- readRDS("test.rds")
ui <- fluidPage(
  titlePanel("Gradient Boosting (slide 49)"),
  fluidRow(
    column(4,
      sliderInput("ntrees","n.trees",10,1000,100,step=10),
      sliderInput("shrink","shrinkage (lambda)",0.001,0.3,0.1,step=0.001),
      sliderInput("depth","interaction.depth",1,8,3),
      sliderInput("bagfrac","bag.fraction",0.3,1.0,0.5,step=0.05)),
    column(8,
      h4("Test-set metrics"), verbatimTextOutput("metrics"),
      h5("Slide 49 baseline: RMSE 11.07 | R2 0.764 | MAE 7.92"),
      plotOutput("resid", height="280px"))
  )
)
server <- function(input, output) {
  fit <- reactive(gbm(Age ~ ., data=train, distribution="gaussian",
                      n.trees=input$ntrees, shrinkage=input$shrink,
                      interaction.depth=input$depth,
                      bag.fraction=input$bagfrac, verbose=FALSE))
  output$metrics <- renderPrint({
    p <- predict(fit(), test, n.trees=input$ntrees)
    metric_card(test$Age, p)
  })
  output$resid <- renderPlot({
    p <- predict(fit(), test, n.trees=input$ntrees)
    hist(test$Age - p, breaks=40, col="steelblue",
         main="Test residuals", xlab="Residual")
  })
}
shinyApp(ui, server)
EOF

  # Copy scorecard.R into each app (Shiny apps must be self-contained)
  for a in m5p m5rules bagging rf gbm; do
    cp "${BUILD_DIR}/_shared/scorecard.R" "${BUILD_DIR}/apps/$a/scorecard.R"
  done

  # ---------- shiny-server.conf ----------
  cat > "${BUILD_DIR}/shiny-server.conf" <<'EOF'
run_as shiny;
server {
  listen 3838;
  location / {
    site_dir /srv/shiny-server;
    log_dir  /var/log/shiny-server;
    directory_index on;
    app_idle_timeout 0;
  }
}
EOF

  # ---------- Dockerfile ----------
  cat > "${BUILD_DIR}/Dockerfile" <<'EOF'
FROM rocker/shiny:4.4.1

RUN apt-get update && apt-get install -y --no-install-recommends \
      libxml2-dev libcurl4-openssl-dev libssl-dev && \
    rm -rf /var/lib/apt/lists/*

RUN R -e "install.packages(c('rpart','rpart.plot','ipred','randomForest', \
    'gbm','caret','partykit','dplyr','shiny'), repos='https://cloud.r-project.org')"

COPY apps/       /srv/shiny-server/
COPY _shared/    /tmp/data/
COPY shiny-server.conf /etc/shiny-server/shiny-server.conf

# Prepare train/test rds files at image build time so the container is ready
RUN Rscript /tmp/data/data_prep.R && chown -R shiny:shiny /srv/shiny-server

EXPOSE 3838
CMD ["/usr/bin/shiny-server"]
EOF

  log "Scaffold complete."
}

############################### AWS: ECR ######################################
ensure_ecr() {
  log "Ensuring ECR repo ${ECR_REPO} exists"
  aws ecr describe-repositories --repository-names "${ECR_REPO}" \
    --region "${AWS_REGION}" >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name "${ECR_REPO}" \
    --region "${AWS_REGION}" \
    --image-scanning-configuration scanOnPush=true >/dev/null
}

docker_login() {
  log "Logging docker into ECR"
  aws ecr get-login-password --region "${AWS_REGION}" \
    | docker login --username AWS --password-stdin \
      "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com" >/dev/null
}

build_and_push() {
  log "Building image ${IMAGE_URI}"
  (cd "${BUILD_DIR}" && docker build --platform=linux/amd64 \
     -t "${ECR_REPO}:${IMAGE_TAG}" .)
  docker tag "${ECR_REPO}:${IMAGE_TAG}" "${IMAGE_URI}"
  log "Pushing image"
  docker push "${IMAGE_URI}" >/dev/null
}

############################### AWS: IAM ######################################
ensure_iam_role() {
  log "Ensuring IAM role ${ROLE_NAME}"
  if ! aws iam get-role --role-name "${ROLE_NAME}" >/dev/null 2>&1; then
    cat > /tmp/apprunner-trust.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "build.apprunner.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
EOF
    aws iam create-role --role-name "${ROLE_NAME}" \
      --assume-role-policy-document file:///tmp/apprunner-trust.json >/dev/null
    aws iam attach-role-policy --role-name "${ROLE_NAME}" \
      --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess
    log "Waiting 10s for IAM propagation..."
    sleep 10
  fi
  ACCESS_ROLE_ARN=$(aws iam get-role --role-name "${ROLE_NAME}" \
    --query 'Role.Arn' --output text)
}

############################### AWS: AUTOSCALING ##############################
ensure_autoscaling() {
  log "Ensuring autoscaling config ${ASC_NAME} (min=${MIN_SIZE}, max=${MAX_SIZE})"
  ASC_ARN=$(aws apprunner list-auto-scaling-configurations \
    --region "${AWS_REGION}" \
    --query "AutoScalingConfigurationSummaryList[?AutoScalingConfigurationName=='${ASC_NAME}'] | [0].AutoScalingConfigurationArn" \
    --output text 2>/dev/null || echo "None")
  if [[ "${ASC_ARN}" == "None" || -z "${ASC_ARN}" ]]; then
    ASC_ARN=$(aws apprunner create-auto-scaling-configuration \
      --auto-scaling-configuration-name "${ASC_NAME}" \
      --min-size "${MIN_SIZE}" --max-size "${MAX_SIZE}" \
      --max-concurrency "${MAX_CONCURRENCY}" \
      --region "${AWS_REGION}" \
      --query 'AutoScalingConfiguration.AutoScalingConfigurationArn' \
      --output text)
  fi
  echo "${ASC_ARN}"
}

############################### AWS: APP RUNNER ###############################
service_arn() {
  aws apprunner list-services --region "${AWS_REGION}" \
    --query "ServiceSummaryList[?ServiceName=='${APP_NAME}'] | [0].ServiceArn" \
    --output text 2>/dev/null || echo "None"
}

create_or_update_service() {
  local asc_arn=$1
  local existing
  existing=$(service_arn)

  if [[ "${existing}" == "None" || -z "${existing}" ]]; then
    log "Creating App Runner service ${APP_NAME}"
    cat > /tmp/apprunner-service.json <<EOF
{
  "ServiceName": "${APP_NAME}",
  "SourceConfiguration": {
    "AuthenticationConfiguration": { "AccessRoleArn": "${ACCESS_ROLE_ARN}" },
    "AutoDeploymentsEnabled": false,
    "ImageRepository": {
      "ImageIdentifier": "${IMAGE_URI}",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": { "Port": "3838" }
    }
  },
  "InstanceConfiguration": {
    "Cpu": "${CPU_SIZE}",
    "Memory": "${MEM_SIZE}"
  },
  "AutoScalingConfigurationArn": "${asc_arn}",
  "HealthCheckConfiguration": {
    "Protocol": "TCP", "Interval": 10, "Timeout": 5,
    "HealthyThreshold": 1, "UnhealthyThreshold": 5
  }
}
EOF
    aws apprunner create-service \
      --cli-input-json file:///tmp/apprunner-service.json \
      --region "${AWS_REGION}" >/dev/null
  else
    log "Service exists, starting new deployment"
    aws apprunner start-deployment --service-arn "${existing}" \
      --region "${AWS_REGION}" >/dev/null
  fi
}

wait_for_running() {
  local arn
  arn=$(service_arn)
  log "Waiting for service to reach RUNNING..."
  while true; do
    local st
    st=$(aws apprunner describe-service --service-arn "${arn}" \
         --region "${AWS_REGION}" --query 'Service.Status' --output text)
    echo "   status: ${st}"
    [[ "${st}" == "RUNNING" ]] && break
    [[ "${st}" == "CREATE_FAILED" || "${st}" == "DELETE_FAILED" ]] && {
      err "Service entered failure state: ${st}"; exit 1; }
    sleep 15
  done
  local url
  url=$(aws apprunner describe-service --service-arn "${arn}" \
        --region "${AWS_REGION}" --query 'Service.ServiceUrl' --output text)
  echo
  log "DONE. App Runner base URL: https://${url}"
  echo "   Regression Tree: https://${url}/m5p"
  echo "   Rule-Based:      https://${url}/m5rules"
  echo "   Bagged Trees:    https://${url}/bagging"
  echo "   Random Forest:   https://${url}/rf"
  echo "   Boosting:        https://${url}/gbm"
  echo
  echo "Embed in Next.js with:"
  echo "   <iframe src=\"https://${url}/rf\" width=\"100%\" height=\"560\" />"
}

############################### DESTROY #######################################
destroy_all() {
  warn "Tearing down ${APP_NAME}"
  local arn
  arn=$(service_arn)
  if [[ "${arn}" != "None" && -n "${arn}" ]]; then
    aws apprunner delete-service --service-arn "${arn}" \
      --region "${AWS_REGION}" >/dev/null || true
  fi

  # wait until deleted before removing ECR/IAM
  while true; do
    arn=$(service_arn)
    [[ "${arn}" == "None" || -z "${arn}" ]] && break
    echo "   waiting for service deletion..."
    sleep 15
  done

  aws ecr delete-repository --repository-name "${ECR_REPO}" --force \
    --region "${AWS_REGION}" >/dev/null 2>&1 || true

  aws iam detach-role-policy --role-name "${ROLE_NAME}" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess \
    2>/dev/null || true
  aws iam delete-role --role-name "${ROLE_NAME}" 2>/dev/null || true

  local asc
  asc=$(aws apprunner list-auto-scaling-configurations --region "${AWS_REGION}" \
        --query "AutoScalingConfigurationSummaryList[?AutoScalingConfigurationName=='${ASC_NAME}'] | [0].AutoScalingConfigurationArn" \
        --output text 2>/dev/null || echo "None")
  if [[ "${asc}" != "None" && -n "${asc}" ]]; then
    aws apprunner delete-auto-scaling-configuration \
      --auto-scaling-configuration-arn "${asc}" \
      --region "${AWS_REGION}" >/dev/null 2>&1 || true
  fi

  log "Teardown complete."
}

############################### MAIN ##########################################
require aws
require docker

case "${ACTION}" in
  deploy)
    scaffold_project
    ensure_ecr
    docker_login
    build_and_push
    ensure_iam_role
    asc_arn=$(ensure_autoscaling)
    create_or_update_service "${asc_arn}"
    wait_for_running
    ;;
  update)
    scaffold_project
    ensure_ecr
    docker_login
    build_and_push
    create_or_update_service "$(ensure_autoscaling)"
    wait_for_running
    ;;
  destroy)
    destroy_all
    ;;
  *)
    err "Unknown action: ${ACTION}"
    echo "Usage: $0 [deploy|update|destroy]"
    exit 1
    ;;
esac
