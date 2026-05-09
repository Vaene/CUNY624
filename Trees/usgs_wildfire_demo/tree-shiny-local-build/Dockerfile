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
