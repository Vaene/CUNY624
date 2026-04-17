const squirrelOverview = {
  labels: ["Ground Plane", "Above Ground", "Recorded Height"],
  values: [2116, 843, 793],
};

const squirrelMethods = [
  { task: "Location tree", value: 0.749, kind: "accuracy" },
  { task: "Feeding rules", value: 0.778, kind: "accuracy" },
  { task: "Bagged location", value: 0.738, kind: "accuracy" },
  { task: "Height RMSE", value: 12.42, kind: "rmse" },
];

const squirrelBenchmark = [
  { model: "rpart", fit: 0.003, accuracy: 0.832 },
  { model: "caret rpart", fit: 0.386, accuracy: 0.832 },
  { model: "C5.0", fit: 0.028, accuracy: 0.832 },
  { model: "caret C5.0", fit: 1.341, accuracy: 0.832 },
  { model: "randomForest", fit: 0.709, accuracy: 0.838 },
  { model: "caret rf", fit: 4.06, accuracy: 0.832 },
];

const treeOverview = {
  labels: ["Street trees", "Park-like trees"],
  values: [8987, 5500],
};

const treeMethods = [
  { label: "Site tree", accuracy: 0.995 },
  { label: "Bagged site trees", accuracy: 0.998 },
  { label: "Shade rules", accuracy: 0.933 },
];

const treeBenchmark = [
  { model: "rpart", fit: 0.073, accuracy: 0.523 },
  { model: "caret rpart", fit: 0.652, accuracy: 0.509 },
  { model: "caret C5.0", fit: 26.63, accuracy: 0.653 },
  { model: "randomForest", fit: 2.766, accuracy: 0.663 },
  { model: "caret rf", fit: 14.677, accuracy: 0.667 },
];

const treeSiteMix = [
  { region: "InlVal", share: 0.0 },
  { region: "InterW", share: 0.0 },
  { region: "LoMidW", share: 0.0 },
  { region: "MidWst", share: 0.0 },
  { region: "SoCalC", share: 0.0 },
  { region: "InlEmp", share: 0.0788 },
  { region: "SWDsrt", share: 0.5248 },
  { region: "PacfNW", share: 0.7646 },
  { region: "NoCalC", share: 0.7686 },
  { region: "Tropic", share: 0.9608 },
  { region: "GulfCo", share: 0.9736 },
  { region: "NMtnPr", share: 0.9769 },
  { region: "NoEast", share: 0.9795 },
  { region: "TpIntW", share: 0.9827 },
  { region: "Piedmt", share: 0.9988 },
  { region: "CenFla", share: 1.0 },
  { region: "SacVal", share: 1.0 },
];

const treeHeightProfile = [
  { site: "Park-like", dbh: 4.93, height: 3.47 },
  { site: "Park-like", dbh: 14.99, height: 6.56 },
  { site: "Park-like", dbh: 25.09, height: 9.21 },
  { site: "Park-like", dbh: 34.88, height: 11.42 },
  { site: "Park-like", dbh: 49.6, height: 14.3 },
  { site: "Park-like", dbh: 76.76, height: 18.36 },
  { site: "Park-like", dbh: 111.81, height: 22.08 },
  { site: "Street", dbh: 6.54, height: 4.14 },
  { site: "Street", dbh: 14.81, height: 6.46 },
  { site: "Street", dbh: 24.53, height: 8.9 },
  { site: "Street", dbh: 34.21, height: 11.2 },
  { site: "Street", dbh: 49.59, height: 14.39 },
  { site: "Street", dbh: 76.38, height: 19.1 },
  { site: "Street", dbh: 115.71, height: 22.61 },
];

const squirrelLocationMix = [
  { color: "Cinnamon", share: 0.2398 },
  { color: "Gray", share: 0.277 },
  { color: "Black", share: 0.301 },
];

const squirrelPerchStats = [
  { shift: "AM", min: 1, q1: 5, median: 10, q3: 20, max: 180, n: 424 },
  { shift: "PM", min: 0, q1: 5, median: 10, q3: 20, max: 65, n: 369 },
];

const wildfireMetrics = [
  {
    model: "Decision Tree",
    fitSeconds: 0.065,
    predictSeconds: 0.005,
    rmseLog: 0.04,
    maeLog: 0.014,
    r2: 0.999759,
    rmseAcres: 17786.8,
    maeAcres: 542.7,
  },
  {
    model: "Random Forest",
    fitSeconds: 1.636,
    predictSeconds: 0.057,
    rmseLog: 0.02,
    maeLog: 0.001,
    r2: 0.999938,
    rmseAcres: 15140.5,
    maeAcres: 254.4,
  },
  {
    model: "Gradient Boosting",
    fitSeconds: 5.387,
    predictSeconds: 0.015,
    rmseLog: 0.016,
    maeLog: 0.009,
    r2: 0.99996,
    rmseAcres: 10461.8,
    maeAcres: 196.5,
  },
  {
    model: "HistGradientBoosting",
    fitSeconds: 2.547,
    predictSeconds: 0.032,
    rmseLog: 0.034,
    maeLog: 0.013,
    r2: 0.999824,
    rmseAcres: 16304.4,
    maeAcres: 489.0,
  },
];

const importance = [
  ["log_shape_area", 0.84],
  ["log_shape_length", 0.51],
  ["duration_days", 0.24],
  ["centroid_lon", 0.18],
  ["ignition_month", 0.12],
  ["centroid_lat", 0.1],
];

const palette = {
  ink: "#1f2933",
  muted: "#5f6c7b",
  line: "rgba(31,41,51,0.08)",
  squirrel: "#8c6a2f",
  tree: "#2f6b5f",
  fire: "#c65a1e",
  smoke: "#7c8792",
  gold: "#d6a243",
};

const modelColors = {
  "Decision Tree": palette.smoke,
  "Random Forest": palette.tree,
  "Gradient Boosting": palette.fire,
  "HistGradientBoosting": palette.gold,
  rpart: palette.smoke,
  "caret rpart": "#a4adb6",
  "C5.0": palette.gold,
  "caret C5.0": "#e0b86f",
  randomForest: palette.tree,
  "caret rf": palette.fire,
};

const slides = Array.from(document.querySelectorAll(".slide"));
const pager = document.getElementById("pager");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
let currentSlide = 0;
const chartState = {};
const treeState = {};
const deferredSlideCharts = {
  5: [initSquirrelMethods],
  11: [initTreeMethods],
  13: [initTreeBenchmark],
  15: [initCrossDataset],
  20: [initRmseChart],
  21: [initTradeoffChart],
};

const squirrelTreeData = {
  name: "Root",
  lines: ["Root", "n = 1976", "Ground Plane"],
  children: [
    {
      name: "Feeding = Not feeding",
      lines: ["Feeding = Not feeding", "n = 760"],
      edgeLabel: "No",
      children: [
        {
          name: "Human.Response = Indifferent, Unclear",
          lines: ["Human.Response", "Indifferent / Unclear"],
          children: [
            {
              name: "Shift = AM",
              lines: ["Shift = AM"],
              children: [
                {
                  name: "Hectare.Number < 37.5",
                  lines: ["Hectare.Number < 37.5", "Leaf: Above Ground"],
                  edgeLabel: "left",
                },
                {
                  name: "Hectare.Number >= 37.5",
                  lines: ["Hectare.Number >= 37.5", "Leaf: Ground Plane"],
                  edgeLabel: "right",
                },
              ],
            },
            {
              name: "Shift = PM",
              lines: ["Shift = PM"],
              children: [
                {
                  name: "Hectare.Letter = B, H",
                  lines: ["Hectare.Letter = B, H", "Leaf: Above Ground"],
                  edgeLabel: "left",
                },
                {
                  name: "Other letters",
                  lines: ["Other letters", "Leaf: Ground Plane"],
                  edgeLabel: "right",
                },
              ],
            },
          ],
        },
        {
          name: "Approaches or Runs from",
          lines: ["Approaches / Runs from"],
          children: [
            {
              name: "Vocal = Vocal",
              lines: ["Vocal = Vocal", "Leaf: Above Ground"],
              edgeLabel: "yes",
            },
            {
              name: "Vocal = Quiet",
              lines: ["Vocal = Quiet", "Leaf: Ground Plane"],
              edgeLabel: "no",
            },
          ],
        },
      ],
    },
    {
      name: "Feeding = Feeding",
      lines: ["Feeding = Feeding", "Leaf: Ground Plane"],
      edgeLabel: "Yes",
    },
  ],
};

const urbanTreeData = {
  name: "Root",
  lines: ["Root", "n = 3501", "Street"],
  children: [
    {
      name: "Region = InterW, MidWst",
      lines: ["Region = InterW, MidWst", "Leaf: Park-like"],
      edgeLabel: "A",
    },
    {
      name: "Other regions",
      lines: ["Other regions", "mostly Street"],
      edgeLabel: "B",
      children: [
        {
          name: "LandUse = 5",
          lines: ["LandUse = 5", "mixed"],
          children: [
            {
              name: "Region = SWDsrt",
              lines: ["Region = SWDsrt", "Leaf: Park-like"],
              edgeLabel: "yes",
            },
            {
              name: "Other in LandUse 5",
              lines: ["Other in LandUse 5", "Leaf: Street"],
              edgeLabel: "no",
            },
          ],
        },
        {
          name: "LandUse = 1,2,3,4,6",
          lines: ["LandUse = 1,2,3,4,6", "Leaf: Street"],
          edgeLabel: "otherwise",
        },
      ],
    },
  ],
};

const wildfireTreeData = {
  name: "Root",
  lines: ["Root", "Predict log acres"],
  children: [
    {
      name: "log_shape_area < 5.4",
      lines: ["log_shape_area < 5.4"],
      edgeLabel: "small",
      children: [
        {
          name: "duration_days < 3",
          lines: ["duration_days < 3", "Leaf: smaller fire"],
          edgeLabel: "short",
        },
        {
          name: "duration_days >= 3",
          lines: ["duration_days >= 3", "Leaf: moderate fire"],
          edgeLabel: "longer",
        },
      ],
    },
    {
      name: "log_shape_area >= 5.4",
      lines: ["log_shape_area >= 5.4"],
      edgeLabel: "large",
      children: [
        {
          name: "centroid_lon < -112",
          lines: ["centroid_lon < -112", "Leaf: western large fire"],
          edgeLabel: "west",
        },
        {
          name: "centroid_lon >= -112",
          lines: ["centroid_lon >= -112"],
          edgeLabel: "east",
          children: [
            {
              name: "duration_days < 10",
              lines: ["duration_days < 10", "Leaf: large but shorter"],
              edgeLabel: "short",
            },
            {
              name: "duration_days >= 10",
              lines: ["duration_days >= 10", "Leaf: very large fire"],
              edgeLabel: "long",
            },
          ],
        },
      ],
    },
  ],
};

function showSlide(index) {
  currentSlide = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => slide.classList.toggle("active", i === currentSlide));
  window.scrollTo({ top: 0, behavior: "auto" });
  renderPager();
  initChartsForSlide(currentSlide);
  animateSlideMedia(currentSlide);
  maybeRunDeferredCharts();
}

function renderPager() {
  pager.innerHTML = "";
  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = `pager-dot ${index === currentSlide ? "active" : ""}`;
    dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
    dot.addEventListener("click", () => showSlide(index));
    pager.appendChild(dot);
  });
}

function activeSlide() {
  return slides[currentSlide];
}

function slideNearBottom(slide) {
  if (!slide) return false;
  const rect = slide.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.bottom <= viewportHeight + 48;
}

function maybeRunDeferredCharts() {
  const fns = deferredSlideCharts[currentSlide];
  if (!fns || !fns.length) return;
  const slide = activeSlide();
  if (!slide) return;
  const shortEnough = slide.scrollHeight <= (window.innerHeight || document.documentElement.clientHeight) + 24;
  if (shortEnough || slideNearBottom(slide)) {
    fns.forEach((fn) => fn());
  }
}

function chartDefaults() {
  Chart.defaults.font.family = 'Georgia, "Times New Roman", serif';
  Chart.defaults.color = palette.muted;
  Chart.defaults.animation.duration = 850;
  Chart.defaults.plugins.legend.labels.boxWidth = 10;
  Chart.defaults.borderColor = palette.line;
  Chart.defaults.scale.grid.display = false;
  Chart.defaults.animations.colors = { duration: 650 };
  Chart.defaults.animations.x = { duration: 850, easing: "easeOutQuart" };
  Chart.defaults.animations.y = { duration: 850, easing: "easeOutQuart" };
}

function animateSlideMedia(index) {
  if (index === 3 || index === 10) return;
  const slide = slides[index];
  if (!slide) return;
  const targets = slide.querySelectorAll(
    ".chart-panel, .image-grid .tree-figure, .stat, .focus-card, .boost-sequence-chart"
  );
  if (!targets.length) return;
  targets.forEach((el) => el.classList.add("media-reveal"));
  gsap.killTweensOf(targets);
  gsap.fromTo(
    targets,
    { opacity: 0, y: 18 },
    {
      opacity: 1,
      y: 0,
      duration: 0.65,
      stagger: 0.08,
      ease: "power2.out",
      clearProps: "opacity,transform",
    }
  );
}

function animateVisualBriefing(slideIndex, figureIds, renderers) {
  const slide = slides[slideIndex];
  if (!slide) return;

  const figures = figureIds
    .map((id) => document.getElementById(id)?.closest(".tree-figure"))
    .filter(Boolean);

  if (!figures.length) return;

  figureIds.forEach((id) => {
    const container = document.getElementById(id);
    if (container) {
      container.innerHTML = "";
      delete chartState[id];
    }
  });

  gsap.killTweensOf(figures);
  gsap.set(figures, { opacity: 0, y: 22 });

  const tl = gsap.timeline();
  figures.forEach((figure, i) => {
    tl.to(figure, {
      opacity: 1,
      y: 0,
      duration: 0.48,
      ease: "power2.out",
      onStart: () => {
        if (renderers[i]) renderers[i]();
      },
    });
    if (i < figures.length - 1) {
      tl.to({}, { duration: 0.12 });
    }
  });
}

function replayChart(chart) {
  if (!chart || typeof chart.reset !== "function") return;
  chart.reset();
  chart.update();
}

function renderAnimatedTree(containerId, data, accent) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (treeState[containerId]?.timeline) {
    treeState[containerId].timeline.kill();
  }
  container.innerHTML = "";

  const width = container.clientWidth || 560;
  const height = 360;
  const margin = { top: 28, right: 36, bottom: 28, left: 36 };

  const root = d3.hierarchy(data);
  const layout = d3
    .tree()
    .nodeSize([104, 84])
    .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.7));
  layout(root);

  const nodes = root.descendants();
  const links = root.links();
  const xExtent = d3.extent(nodes, (d) => d.x);
  const yExtent = d3.extent(nodes, (d) => d.y);
  const xShift = margin.left + (width - margin.left - margin.right) / 2 - (xExtent[0] + xExtent[1]) / 2;
  const yShift = margin.top - yExtent[0];

  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img");

  const g = svg
    .append("g")
    .attr("transform", `translate(${xShift},${yShift})`);

  const color = accent;

  const linkGroup = g.append("g");
  const nodeGroup = g.append("g");

  const drawnLinks = linkGroup
    .selectAll("path")
    .data(links)
    .enter()
    .append("path")
    .attr("class", "tree-link")
    .attr("d", (d) => {
      const midY = d.source.y + (d.target.y - d.source.y) * 0.48;
      return `M${d.source.x},${d.source.y} V${midY} H${d.target.x} V${d.target.y}`;
    })
    .attr("stroke", color)
    .attr("stroke-width", 2.2)
    .attr("opacity", 0.95);

  drawnLinks.each(function () {
    const length = this.getTotalLength();
    d3.select(this)
      .attr("stroke-dasharray", length)
      .attr("stroke-dashoffset", length);
  });

  const edgeLabels = linkGroup
    .selectAll("text")
    .data(links.filter((d) => d.target.data.edgeLabel))
    .enter()
    .append("text")
    .attr("x", (d) => {
      const isRootSplit = d.source.depth === 0;
      if (isRootSplit) {
        const share = d.target.x > d.source.x ? 0.72 : 0.28;
        return d.source.x + (d.target.x - d.source.x) * share;
      }
      if (d.target.x > d.source.x) {
        return d.target.x - 10;
      }
      return d.target.x + 10;
    })
    .attr("y", (d) => {
      const isRootSplit = d.source.depth === 0;
      return d.source.y + (d.target.y - d.source.y) * (isRootSplit ? 0.46 : 0.48) - 8;
    })
    .attr("text-anchor", (d) => {
      if (d.source.depth === 0) return "middle";
      return d.target.x > d.source.x ? "end" : "start";
    })
    .attr("fill", palette.muted)
    .attr("font-size", 11)
    .attr("opacity", 0)
    .text((d) => d.target.data.edgeLabel);

  const nodeEnter = nodeGroup
    .selectAll("g")
    .data(nodes)
    .enter()
    .append("g")
    .attr("transform", (d) => `translate(${d.x},${d.y})`)
    .attr("opacity", 0);

  const textNodes = nodeEnter
    .append("text")
    .attr("class", "tree-node-label")
    .attr("text-anchor", "middle")
    .attr("font-size", 11.5)
    .attr("font-weight", (d) => (d.depth === 0 ? 600 : 500));

  textNodes.each(function (d) {
    const text = d3.select(this);
    (d.data.lines || [d.data.name]).forEach((line, i) => {
      text
        .append("tspan")
        .attr("x", 0)
        .attr("dy", i === 0 ? 0 : 14)
        .text(line);
    });
  });

  nodeEnter.each(function () {
    const gNode = d3.select(this);
    const textBox = gNode.select("text").node().getBBox();
    gNode
      .insert("rect", "text")
      .attr("class", "tree-node-bg")
      .attr("x", textBox.x - 10)
      .attr("y", textBox.y - 7)
      .attr("width", Math.max(textBox.width + 20, 108))
      .attr("height", textBox.height + 14)
      .attr("rx", 12)
      .attr("ry", 12);
  });

  const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

  drawnLinks.nodes().forEach((path, i) => {
    tl.to(
      path,
      {
        strokeDashoffset: 0,
        duration: 0.56,
      },
      i === 0 ? 0.28 : ">-0.04"
    );

    const targetIndex = i + 1;
    if (nodes[targetIndex]) {
      tl.to(
        nodeEnter.nodes()[targetIndex],
        {
          opacity: 1,
          duration: 0.34,
        },
        ">-0.01"
      );
    }
  });

  tl.to(
    nodeEnter.nodes()[0],
    {
      opacity: 1,
      duration: 0.42,
      scale: 1,
    },
    0
  );
  tl.fromTo(
    nodeEnter.nodes()[0],
    { scale: 0.94, transformOrigin: "center center" },
    { scale: 1, duration: 0.42, ease: "power2.out" },
    0
  );
  tl.to(edgeLabels.nodes(), { opacity: 1, stagger: 0.08, duration: 0.24 }, 0.8);

  treeState[containerId] = { timeline: tl };
}

function renderSquirrelLocationMix() {
  const id = "squirrelLocationMixViz";
  if (chartState[id]) return;
  const container = document.getElementById(id);
  if (!container) return;
  const width = container.clientWidth || 480;
  const height = 290;
  const margin = { top: 28, right: 36, bottom: 34, left: 88 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = d3.select(container).append("svg").attr("viewBox", `0 0 ${width} ${height}`);
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, 0.34]).range([0, innerW]);
  const y = d3
    .scaleBand()
    .domain(squirrelLocationMix.map((d) => d.color))
    .range([innerH, 0])
    .padding(0.5);

  g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickValues([0, 0.1, 0.2, 0.3]).tickFormat(d3.format(".0%")))
    .call((sel) => sel.selectAll("path,line").attr("stroke", "rgba(31,41,51,0.14)"))
    .call((sel) => sel.selectAll("text").attr("fill", palette.muted));

  g.append("g")
    .call(d3.axisLeft(y).tickSize(0))
    .call((sel) => sel.selectAll("path,line").remove())
    .call((sel) => sel.selectAll("text").attr("fill", palette.ink));

  g.selectAll(".guide")
    .data(squirrelLocationMix)
    .enter()
    .append("line")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", (d) => y(d.color) + y.bandwidth() / 2)
    .attr("y2", (d) => y(d.color) + y.bandwidth() / 2)
    .attr("stroke", "rgba(31,41,51,0.14)")
    .attr("stroke-width", 1);

  const guides = g.selectAll(".guide");
  const dots = g.selectAll(".dot")
    .data(squirrelLocationMix)
    .enter()
    .append("circle")
    .attr("cx", 0)
    .attr("cy", (d) => y(d.color) + y.bandwidth() / 2)
    .attr("r", 0)
    .attr("fill", palette.squirrel);

  const labels = g.selectAll(".mix-label")
    .data(squirrelLocationMix)
    .enter()
    .append("text")
    .attr("x", (d) => x(d.share) + 8)
    .attr("y", (d) => y(d.color) + y.bandwidth() / 2 + 4)
    .attr("fill", palette.ink)
    .attr("font-size", 12)
    .attr("opacity", 0)
    .text((d) => d3.format(".1%")(d.share));

  gsap.to(guides.nodes(), {
    attr: { x2: (_i, t) => x(squirrelLocationMix[_i].share) },
    duration: 0.8,
    stagger: 0.09,
    ease: "power2.out",
  });
  gsap.to(dots.nodes(), {
    attr: { cx: (_i, t) => x(squirrelLocationMix[_i].share), r: 4.5 },
    duration: 0.8,
    stagger: 0.09,
    ease: "power2.out",
  });
  gsap.to(labels.nodes(), {
    opacity: 1,
    duration: 0.35,
    stagger: 0.09,
    delay: 0.45,
  });
  chartState[id] = true;
}

function renderSquirrelPerchBox() {
  const id = "squirrelPerchBoxViz";
  if (chartState[id]) return;
  const container = document.getElementById(id);
  if (!container) return;
  const width = container.clientWidth || 480;
  const height = 290;
  const margin = { top: 24, right: 24, bottom: 34, left: 54 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const svg = d3.select(container).append("svg").attr("viewBox", `0 0 ${width} ${height}`);
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3.scaleBand().domain(squirrelPerchStats.map((d) => d.shift)).range([0, innerW]).padding(0.45);
  const y = d3.scaleLinear().domain([0, 190]).range([innerH, 0]);

  g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickSize(0))
    .call((sel) => sel.selectAll("path,line").attr("stroke", "rgba(31,41,51,0.14)"))
    .call((sel) => sel.selectAll("text").attr("fill", palette.ink));

  g.append("g")
    .call(d3.axisLeft(y).tickValues([0, 50, 100, 150]).tickSize(-innerW))
    .call((sel) => sel.selectAll(".domain").remove())
    .call((sel) => sel.selectAll("line").remove())
    .call((sel) => sel.selectAll("text").attr("fill", palette.muted));

  const groups = g.selectAll(".boxgroup")
    .data(squirrelPerchStats)
    .enter()
    .append("g")
    .attr("transform", (d) => `translate(${x(d.shift) + x.bandwidth() / 2},0)`);

  groups.append("line")
    .attr("class", "whisker")
    .attr("y1", y((squirrelPerchStats[0].median)))
    .attr("y2", y((squirrelPerchStats[0].median)))
    .attr("stroke", palette.smoke)
    .attr("stroke-width", 1.5);

  groups.append("rect")
    .attr("class", "box")
    .attr("x", -18)
    .attr("width", 36)
    .attr("y", (d) => y(d.median))
    .attr("height", 0)
    .attr("fill", "rgba(255,253,248,0.96)")
    .attr("stroke", palette.ink);

  groups.append("line")
    .attr("class", "median")
    .attr("x1", -18)
    .attr("x2", 18)
    .attr("y1", (d) => y(d.median))
    .attr("y2", (d) => y(d.median))
    .attr("stroke", palette.squirrel)
    .attr("stroke-width", 2);

  groups.append("line")
    .attr("class", "cap-top")
    .attr("x1", -10)
    .attr("x2", 10)
    .attr("y1", (d) => y(d.min))
    .attr("y2", (d) => y(d.min))
    .attr("stroke", palette.smoke)
    .attr("stroke-width", 1.2);

  groups.append("line")
    .attr("class", "cap-bottom")
    .attr("x1", -10)
    .attr("x2", 10)
    .attr("y1", (d) => y(d.max))
    .attr("y2", (d) => y(d.max))
    .attr("stroke", palette.smoke)
    .attr("stroke-width", 1.2);

  const labels = groups.append("text")
    .attr("y", (d) => y(d.max) - 8)
    .attr("text-anchor", "middle")
    .attr("fill", palette.ink)
    .attr("font-size", 12)
    .attr("opacity", 0)
    .text((d) => `n=${d.n}`);

  gsap.to(groups.selectAll(".whisker").nodes(), {
    attr: {
      y1: (_i) => y(squirrelPerchStats[_i].min),
      y2: (_i) => y(squirrelPerchStats[_i].max),
    },
    duration: 0.8,
    stagger: 0.12,
    ease: "power2.out",
  });
  gsap.to(groups.selectAll(".box").nodes(), {
    attr: {
      y: (_i) => y(squirrelPerchStats[_i].q3),
      height: (_i) => y(squirrelPerchStats[_i].q1) - y(squirrelPerchStats[_i].q3),
    },
    duration: 0.7,
    stagger: 0.12,
    ease: "power2.out",
  });
  gsap.to(labels.nodes(), { opacity: 1, duration: 0.3, stagger: 0.12, delay: 0.45 });
  chartState[id] = true;
}

function renderTreeSiteMix() {
  const id = "treeSiteMixViz";
  if (chartState[id]) return;
  const container = document.getElementById(id);
  if (!container) return;
  const width = container.clientWidth || 480;
  const height = 360;
  const margin = { top: 18, right: 24, bottom: 28, left: 86 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const svg = d3.select(container).append("svg").attr("viewBox", `0 0 ${width} ${height}`);
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3.scaleLinear().domain([0, 1.02]).range([0, innerW]);
  const y = d3.scaleBand().domain(treeSiteMix.map((d) => d.region)).range([innerH, 0]).padding(0.38);

  g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickValues([0, 0.25, 0.5, 0.75, 1]).tickFormat(d3.format(".0%")))
    .call((sel) => sel.selectAll("path,line").attr("stroke", "rgba(31,41,51,0.14)"))
    .call((sel) => sel.selectAll("text").attr("fill", palette.muted));

  g.append("g")
    .call(d3.axisLeft(y).tickSize(0))
    .call((sel) => sel.selectAll("path,line").remove())
    .call((sel) => sel.selectAll("text").attr("fill", palette.ink).attr("font-size", 11));

  const guides = g.selectAll(".guide")
    .data(treeSiteMix)
    .enter()
    .append("line")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", (d) => y(d.region) + y.bandwidth() / 2)
    .attr("y2", (d) => y(d.region) + y.bandwidth() / 2)
    .attr("stroke", "rgba(31,41,51,0.12)")
    .attr("stroke-width", 1);

  const dots = g.selectAll(".dot")
    .data(treeSiteMix)
    .enter()
    .append("circle")
    .attr("cx", 0)
    .attr("cy", (d) => y(d.region) + y.bandwidth() / 2)
    .attr("r", 0)
    .attr("fill", palette.tree);

  gsap.to(guides.nodes(), {
    attr: { x2: (_i) => x(treeSiteMix[_i].share) },
    duration: 0.8,
    stagger: 0.04,
    ease: "power2.out",
  });
  gsap.to(dots.nodes(), {
    attr: { cx: (_i) => x(treeSiteMix[_i].share), r: 3.8 },
    duration: 0.8,
    stagger: 0.04,
    ease: "power2.out",
  });
  chartState[id] = true;
}

function renderTreeHeightProfile() {
  const id = "treeHeightProfileViz";
  if (chartState[id]) return;
  const container = document.getElementById(id);
  if (!container) return;
  const width = container.clientWidth || 480;
  const height = 360;
  const margin = { top: 18, right: 20, bottom: 34, left: 48 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const svg = d3.select(container).append("svg").attr("viewBox", `0 0 ${width} ${height}`);
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const x = d3.scaleLinear().domain([0, 125]).range([0, innerW]);
  const y = d3.scaleLinear().domain([0, 25]).range([innerH, 0]);
  const color = { Street: palette.tree, "Park-like": palette.smoke };

  g.append("g")
    .attr("transform", `translate(0,${innerH})`)
    .call(d3.axisBottom(x).tickValues([0, 25, 50, 75, 100, 125]))
    .call((sel) => sel.selectAll("path,line").attr("stroke", "rgba(31,41,51,0.14)"))
    .call((sel) => sel.selectAll("text").attr("fill", palette.muted));

  g.append("g")
    .call(d3.axisLeft(y).tickValues([0, 5, 10, 15, 20, 25]).tickSize(-innerW))
    .call((sel) => sel.selectAll(".domain").remove())
    .call((sel) => sel.selectAll("line").remove())
    .call((sel) => sel.selectAll("text").attr("fill", palette.muted));

  ["Street", "Park-like"].forEach((site) => {
    const data = treeHeightProfile.filter((d) => d.site === site).sort((a, b) => a.dbh - b.dbh);
    const line = d3.line().x((d) => x(d.dbh)).y((d) => y(d.height));
    const path = g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color[site])
      .attr("stroke-width", 2)
      .attr("opacity", 0.9)
      .attr("d", line);
    const len = path.node().getTotalLength();
    path.attr("stroke-dasharray", len).attr("stroke-dashoffset", len);
    gsap.to(path.node(), { strokeDashoffset: 0, duration: 1, ease: "power2.out" });

    const dots = g.selectAll(`.dot-${site}`)
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => x(d.dbh))
      .attr("cy", (d) => y(d.height))
      .attr("r", 0)
      .attr("fill", color[site])
      .attr("opacity", 0.9);
    gsap.to(dots.nodes(), { attr: { r: 3.5 }, duration: 0.45, stagger: 0.05, delay: 0.25 });
  });

  const legend = g.append("g").attr("transform", `translate(${innerW - 120},${innerH - 44})`);
  [["Street", palette.tree], ["Park-like", palette.smoke]].forEach((item, i) => {
    const row = legend.append("g").attr("transform", `translate(0,${i * 18})`);
    row.append("line").attr("x1", 0).attr("x2", 18).attr("y1", 0).attr("y2", 0).attr("stroke", item[1]).attr("stroke-width", 2);
    row.append("text").attr("x", 24).attr("y", 4).attr("fill", palette.ink).attr("font-size", 11.5).text(item[0]);
  });
  chartState[id] = true;
}

function minimalBar(canvasId, labels, data, colors, title, formatValue, options = {}) {
  if (chartState[canvasId]) {
    replayChart(chartState[canvasId]);
    return;
  }
  const ctx = document.getElementById(canvasId);
  const yTitle = options.yTitle || "";
  const yMin = options.yMin;
  const yMax = options.yMax;
  const topPadding = options.topPadding ?? 18;
  chartState[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderRadius: 2,
          barThickness: 18,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      layout: {
        padding: { top: topPadding, right: 8 },
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: title,
          color: palette.ink,
          font: { size: 16, weight: "600" },
        },
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: {
          min: yMin,
          max: yMax,
          title: yTitle ? { display: true, text: yTitle } : { display: false },
          grid: { color: palette.line },
          border: { display: false },
        },
      },
    },
    plugins: [valueLabelPlugin(formatValue)],
  });
}

function valueLabelPlugin(formatValue) {
  return {
    id: `labels-${Math.random().toString(36).slice(2, 8)}`,
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.fillStyle = palette.ink;
      ctx.font = '12px Georgia, "Times New Roman", serif';
      chart.data.datasets[0].data.forEach((value, i) => {
        const meta = chart.getDatasetMeta(0).data[i];
        const label = formatValue ? formatValue(value) : String(value);
        if (chart.config.type === "bar" && chart.options.indexAxis === "y") {
          ctx.fillText(label, meta.x + 8, meta.y + 4);
        } else {
          ctx.fillText(label, meta.x + 6, meta.y - 8);
        }
      });
      ctx.restore();
    },
  };
}

function initSquirrelOverview() {
  minimalBar(
    "squirrelOverviewChart",
    squirrelOverview.labels,
    squirrelOverview.values,
    [palette.squirrel, palette.tree, palette.gold],
    "Central Park Squirrel Census: Simple Targets For Tree Models",
    (v) => v.toLocaleString(),
    { yTitle: "Observations", yMax: 2400, topPadding: 12 }
  );
}

function initSquirrelMethods() {
  if (chartState.squirrelMethodsChart) {
    replayChart(chartState.squirrelMethodsChart);
    return;
  }
  const ctx = document.getElementById("squirrelMethodsChart");
  chartState.squirrelMethodsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: squirrelMethods.map((d) => d.task),
      datasets: [
        {
          label: "Accuracy",
          data: squirrelMethods.map((d) => (d.kind === "accuracy" ? d.value : null)),
          backgroundColor: palette.squirrel,
          borderRadius: 2,
          barThickness: 18,
        },
        {
          label: "RMSE",
          data: squirrelMethods.map((d) => (d.kind === "rmse" ? d.value : null)),
          backgroundColor: palette.smoke,
          borderRadius: 2,
          barThickness: 18,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", align: "start" },
        title: {
          display: true,
          text: "One Dataset, Three Tree Tasks: Classification, Regression, Rules",
          color: palette.ink,
          font: { size: 16, weight: "600" },
        },
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: {
          position: "left",
          min: 0,
          max: 1,
          title: { display: true, text: "Accuracy" },
          grid: { color: palette.line },
          border: { display: false },
        },
        y1: {
          position: "right",
          min: 0,
          max: 15,
          title: { display: true, text: "RMSE" },
          grid: { drawOnChartArea: false },
          border: { display: false },
        },
      },
    },
  });
}

function initSquirrelBenchmark() {
  if (chartState.squirrelBenchmarkChart) {
    replayChart(chartState.squirrelBenchmarkChart);
    return;
  }
  const ctx = document.getElementById("squirrelBenchmarkChart");
  chartState.squirrelBenchmarkChart = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          data: squirrelBenchmark.map((d) => ({
            x: d.fit,
            y: d.accuracy,
            model: d.model,
          })),
          pointRadius: 6,
          pointHoverRadius: 8,
          backgroundColor: squirrelBenchmark.map((d) => modelColors[d.model]),
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Harder Squirrel Task: Fur Color Benchmark",
          color: palette.ink,
          font: { size: 16, weight: "600" },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const raw = context.raw;
              return `${raw.model}: fit ${raw.x}s, accuracy ${raw.y}`;
            },
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Fit time (seconds)" },
          grid: { display: false },
          border: { display: false },
        },
        y: {
          title: { display: true, text: "Accuracy" },
          min: 0.82,
          max: 0.845,
          grid: { display: false },
          border: { display: false },
        },
      },
    },
    plugins: [
      pointLabelPlugin({
        rpart: { dx: 8, dy: -12 },
        "C5.0": { dx: 8, dy: 14 },
        "caret rpart": { dx: 8, dy: -2 },
        "caret C5.0": { dx: 8, dy: -12 },
        randomForest: { dx: 8, dy: -8 },
        "caret rf": { dx: 8, dy: -8 },
      }),
    ],
  });
}

function initTreeOverview() {
  minimalBar(
    "treeOverviewChart",
    treeOverview.labels,
    treeOverview.values,
    [palette.tree, palette.gold],
    "USDA Urban Trees: Street vs Park-Like Sites",
    (v) => v.toLocaleString(),
    { yTitle: "Observations", yMax: 10000, topPadding: 12 }
  );
}

function initTreeMethods() {
  minimalBar(
    "treeMethodsChart",
    treeMethods.map((d) => d.label),
    treeMethods.map((d) => d.accuracy),
    [palette.smoke, palette.tree, palette.gold],
    "Urban Tree Methods: Easy Tasks Already Favor Tree Ensembles",
    (v) => v.toFixed(3),
    { yTitle: "Accuracy", yMin: 0, yMax: 1.08, topPadding: 22 }
  );
}

function initTreeBenchmark() {
  if (chartState.treeBenchmarkChart) {
    replayChart(chartState.treeBenchmarkChart);
    return;
  }
  const ctx = document.getElementById("treeBenchmarkChart");
  chartState.treeBenchmarkChart = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          data: treeBenchmark.map((d) => ({
            x: d.fit,
            y: d.accuracy,
            model: d.model,
          })),
          pointRadius: 7,
          pointHoverRadius: 9,
          backgroundColor: treeBenchmark.map((d) => modelColors[d.model]),
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Hard Urban-Tree Task: Predicting TreeType",
          color: palette.ink,
          font: { size: 16, weight: "600" },
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Fit time (seconds)" },
          grid: { color: palette.line },
          border: { display: false },
        },
        y: {
          title: { display: true, text: "Accuracy" },
          min: 0.48,
          max: 0.69,
          grid: { color: palette.line },
          border: { display: false },
        },
      },
    },
    plugins: [pointLabelPlugin()],
  });
}

function initCrossDataset() {
  if (chartState.crossDatasetChart) {
    replayChart(chartState.crossDatasetChart);
    return;
  }
  const ctx = document.getElementById("crossDatasetChart");
  chartState.crossDatasetChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Single tree", "Bagging / RF", "Boosting / modern boosting"],
      datasets: [
        {
          label: "Squirrel story value",
          data: [0.95, 0.78, null],
          borderColor: palette.squirrel,
          pointBackgroundColor: palette.squirrel,
          pointRadius: 5,
          tension: 0,
        },
        {
          label: "Urban tree story value",
          data: [0.995, 0.998, 0.667],
          borderColor: palette.tree,
          pointBackgroundColor: palette.tree,
          pointRadius: 5,
          tension: 0,
        },
        {
          label: "Wildfire story value",
          data: [0.04, 0.02, 0.016],
          borderColor: palette.fire,
          pointBackgroundColor: palette.fire,
          pointRadius: 5,
          tension: 0,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Why Prediction-Focused Problems Push Us Toward Stronger Ensembles",
          color: palette.ink,
          font: { size: 16, weight: "600" },
        },
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: {
          min: 0.7,
          max: 1.02,
          title: { display: true, text: "Accuracy-oriented tasks" },
          grid: { display: false },
          border: { display: false },
        },
        y1: {
          position: "right",
          min: 0,
          max: 0.05,
          title: { display: true, text: "Wildfire RMSE (lower is better)" },
          grid: { display: false },
          border: { display: false },
          reverse: true,
        },
      },
    },
  });
}

function initImportanceChart() {
  if (chartState.importanceChart) {
    replayChart(chartState.importanceChart);
    return;
  }
  const ctx = document.getElementById("importanceChart");
  chartState.importanceChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: importance.map((d) => d[0]),
      datasets: [
        {
          data: importance.map((d) => d[1]),
          backgroundColor: palette.fire,
          borderRadius: 2,
          barThickness: 14,
        },
      ],
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Wildfire Feature Signals Used By The Modern Demo",
          color: palette.ink,
          font: { size: 16, weight: "600" },
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Relative importance" },
          grid: { color: palette.line },
          border: { display: false },
        },
        y: { grid: { display: false }, border: { display: false } },
      },
    },
    plugins: [valueLabelPlugin((v) => v.toFixed(2))],
  });
}

function initRmseChart() {
  minimalBar(
    "rmseChart",
    [...wildfireMetrics].sort((a, b) => b.rmseLog - a.rmseLog).map((d) => d.model),
    [...wildfireMetrics].sort((a, b) => b.rmseLog - a.rmseLog).map((d) => d.rmseLog),
    [...wildfireMetrics].sort((a, b) => b.rmseLog - a.rmseLog).map((d) => modelColors[d.model]),
    "Wildfire Regression: Lower Error For Boosting Methods",
    (v) => v.toFixed(3),
    { yTitle: "RMSE on log(acres + 1)", yMin: 0, yMax: 0.05, topPadding: 20 }
  );
}

function initTradeoffChart() {
  if (chartState.tradeoffChart) {
    replayChart(chartState.tradeoffChart);
    return;
  }
  const ctx = document.getElementById("tradeoffChart");
  chartState.tradeoffChart = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          data: wildfireMetrics.map((d) => ({
            x: d.fitSeconds,
            y: d.rmseLog,
            model: d.model,
          })),
          pointRadius: 7,
          pointHoverRadius: 9,
          backgroundColor: wildfireMetrics.map((d) => modelColors[d.model]),
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Wildfire Demo: Fit Time vs Error",
          color: palette.ink,
          font: { size: 16, weight: "600" },
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Fit time (seconds)" },
          grid: { color: palette.line },
          border: { display: false },
        },
        y: {
          title: { display: true, text: "RMSE on log(acres + 1)" },
          reverse: true,
          min: 0.01,
          max: 0.045,
          grid: { color: palette.line },
          border: { display: false },
        },
      },
    },
    plugins: [pointLabelPlugin()],
  });
}

function pointLabelPlugin(offsets = {}) {
  return {
    id: `points-${Math.random().toString(36).slice(2, 8)}`,
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.fillStyle = palette.ink;
      ctx.font = '12px Georgia, "Times New Roman", serif';
      chart.data.datasets[0].data.forEach((point, i) => {
        const meta = chart.getDatasetMeta(0).data[i];
        const tweak = offsets[point.model] || { dx: 8, dy: -8 };
        ctx.fillText(point.model, meta.x + tweak.dx, meta.y + tweak.dy);
      });
      ctx.restore();
    },
  };
}

function initChartsForSlide(index) {
  if (index === 1) initSquirrelOverview();
  if (index === 3) animateVisualBriefing(
    3,
    ["squirrelLocationMixViz", "squirrelPerchBoxViz"],
    [renderSquirrelLocationMix, renderSquirrelPerchBox]
  );
  if (index === 5) maybeRunDeferredCharts();
  if (index === 6) initSquirrelBenchmark();
  if (index === 8) initTreeOverview();
  if (index === 10) animateVisualBriefing(
    10,
    ["treeSiteMixViz", "treeHeightProfileViz"],
    [renderTreeSiteMix, renderTreeHeightProfile]
  );
  if (index === 11) maybeRunDeferredCharts();
  if (index === 13) maybeRunDeferredCharts();
  if (index === 15) maybeRunDeferredCharts();
  if (index === 17) initImportanceChart();
  if (index === 19) animateBoostFlow();
  if (index === 20) maybeRunDeferredCharts();
  if (index === 21) maybeRunDeferredCharts();
}

function animateBoostFlow() {
  renderBoostSequence();
}

function renderBoostSequence() {
  const id = "boostSequenceViz";
  const container = document.getElementById(id);
  if (!container) return;
  container.innerHTML = "";

  const width = container.clientWidth || 960;
  const height = 320;
  const svg = d3.select(container).append("svg").attr("viewBox", `0 0 ${width} ${height}`);

  const defs = svg.append("defs");
  defs.append("marker")
    .attr("id", "boost-arrowhead")
    .attr("viewBox", "0 0 10 10")
    .attr("refX", 9)
    .attr("refY", 5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto-start-reverse")
    .append("path")
    .attr("d", "M 0 0 L 10 5 L 0 10 z")
    .attr("fill", palette.fire);

  const stages = [
    { x: 110, title: "Tree 1", error: 62, color: palette.smoke },
    { x: 330, title: "Tree 2", error: 37, color: palette.gold },
    { x: 550, title: "Tree 3", error: 21, color: palette.fire },
    { x: 790, title: "Final model", error: 12, color: palette.tree, final: true },
  ];

  function miniTree(group, color) {
    const links = [
      "M0,0 V24 H-24 V48",
      "M0,0 V24 H24 V48",
      "M-24,48 V72 H-40 V94",
      "M-24,48 V72 H-8 V94",
      "M24,48 V72 H8 V94",
      "M24,48 V72 H40 V94",
    ];
    const paths = group.selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("d", (d) => d)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2.1)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round");

    paths.each(function () {
      const len = this.getTotalLength();
      d3.select(this).attr("stroke-dasharray", len).attr("stroke-dashoffset", len);
    });

    const circles = group.selectAll("circle")
      .data([[0, 0], [-24, 48], [24, 48], [-40, 94], [-8, 94], [8, 94], [40, 94]])
      .enter()
      .append("circle")
      .attr("cx", (d) => d[0])
      .attr("cy", (d) => d[1])
      .attr("r", 0)
      .attr("fill", color);

    return { paths, circles };
  }

  const stageNodes = stages.map((stage) => {
    const g = svg.append("g").attr("transform", `translate(${stage.x},82)`);
    g.append("text")
      .attr("x", 0)
      .attr("y", -28)
      .attr("text-anchor", "middle")
      .attr("fill", palette.ink)
      .attr("font-size", 13)
      .attr("font-weight", 600)
      .text(stage.title);

    if (!stage.final) {
      const tree = miniTree(g, stage.color);
      g.append("text")
        .attr("x", 0)
        .attr("y", 124)
        .attr("text-anchor", "middle")
        .attr("fill", palette.muted)
        .attr("font-size", 11.5)
        .text("current residual fit");

      g.append("rect")
        .attr("x", -44)
        .attr("y", 140)
        .attr("width", 88)
        .attr("height", 10)
        .attr("fill", "rgba(31,41,51,0.08)");

      const bar = g.append("rect")
        .attr("x", -44)
        .attr("y", 140)
        .attr("width", 0)
        .attr("height", 10)
        .attr("fill", stage.color);

      const err = g.append("text")
        .attr("x", 0)
        .attr("y", 168)
        .attr("text-anchor", "middle")
        .attr("fill", palette.ink)
        .attr("font-size", 12)
        .attr("opacity", 0)
        .text(`error ${stage.error}%`);

      return { tree, bar, err, stage };
    }

    const circle = g.append("circle")
      .attr("cx", 0)
      .attr("cy", 50)
      .attr("r", 0)
      .attr("fill", stage.color);

    const sum = g.append("text")
      .attr("x", 0)
      .attr("y", 54)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", 11.5)
      .attr("opacity", 0)
      .text("sum");

    g.append("text")
      .attr("x", 0)
      .attr("y", 124)
      .attr("text-anchor", "middle")
      .attr("fill", palette.muted)
      .attr("font-size", 11.5)
      .text("combined prediction");

    const err = g.append("text")
      .attr("x", 0)
      .attr("y", 168)
      .attr("text-anchor", "middle")
      .attr("fill", palette.ink)
      .attr("font-size", 12)
      .attr("opacity", 0)
      .text(`error ${stage.error}%`);

    return { circle, sum, err, stage, final: true };
  });

  const arrows = [
    { x1: 170, x2: 270, y: 104, label: "fit residuals" },
    { x1: 390, x2: 490, y: 104, label: "correct what remains" },
    { x1: 610, x2: 720, y: 104, label: "add another small tree" },
  ].map((a) => {
    const line = svg.append("line")
      .attr("x1", a.x1)
      .attr("x2", a.x1)
      .attr("y1", a.y)
      .attr("y2", a.y)
      .attr("stroke", palette.fire)
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#boost-arrowhead)");
    const text = svg.append("text")
      .attr("x", (a.x1 + a.x2) / 2)
      .attr("y", a.y - 12)
      .attr("text-anchor", "middle")
      .attr("fill", palette.muted)
      .attr("font-size", 11.5)
      .attr("opacity", 0)
      .text(a.label);
    return { line, text, a };
  });

  const tl = gsap.timeline();
  stageNodes.forEach((entry, i) => {
    if (!entry.final) {
      tl.to(entry.tree.paths.nodes(), {
        strokeDashoffset: 0,
        duration: 0.34,
        stagger: 0.035,
        ease: "power2.out",
      }, i === 0 ? 0.1 : ">0.08");
      tl.to(entry.tree.circles.nodes(), {
        attr: { r: 4 },
        duration: 0.24,
        stagger: 0.02,
      }, ">-0.16");
      tl.to(entry.bar.node(), {
        attr: { width: 0.88 * entry.stage.error },
        duration: 0.32,
      }, ">-0.08");
      tl.to(entry.err.node(), { opacity: 1, duration: 0.2 }, ">-0.14");
    } else {
      tl.to(entry.circle.node(), { attr: { r: 28 }, duration: 0.32 }, ">0.08");
      tl.to(entry.sum.node(), { opacity: 1, duration: 0.2 }, ">-0.18");
      tl.to(entry.err.node(), { opacity: 1, duration: 0.2 }, ">-0.1");
    }

    if (i < arrows.length) {
      tl.to(arrows[i].line.node(), { attr: { x2: arrows[i].a.x2 }, duration: 0.26 }, ">-0.04");
      tl.to(arrows[i].text.node(), { opacity: 1, duration: 0.18 }, ">-0.14");
    }
  });
}

document.querySelectorAll("[data-tree-replay]").forEach((button) => {
  button.addEventListener("click", () => {
    const id = button.getAttribute("data-tree-replay");
    if (id === "squirrelTreeViz") {
      renderAnimatedTree(id, squirrelTreeData, palette.squirrel);
    }
    if (id === "urbanTreeViz") {
      renderAnimatedTree(id, urbanTreeData, palette.tree);
    }
    if (id === "wildfireTreeViz") {
      renderAnimatedTree(id, wildfireTreeData, palette.fire);
    }
  });
});

prevBtn.addEventListener("click", () => showSlide(currentSlide - 1));
nextBtn.addEventListener("click", () => showSlide(currentSlide + 1));
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") showSlide(currentSlide + 1);
  if (event.key === "ArrowLeft") showSlide(currentSlide - 1);
});
window.addEventListener("scroll", maybeRunDeferredCharts, { passive: true });

chartDefaults();
showSlide(0);
