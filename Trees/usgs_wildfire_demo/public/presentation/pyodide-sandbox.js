(() => {
  const PYODIDE_VERSION = "0.26.2";
  const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
  const DATA_URL = new URL("../Data/TS3_Raw_tree_data.csv", window.location.href).href;
  const LOAD_TIMEOUT_MS = 20000;

  const shared = {
    runtimePromise: null,
    runtime: null,
    mounts: new Map(),
  };

  const commonSetup = `
import numpy as np
import pandas as pd
import json
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from io import StringIO

df = pd.read_csv(StringIO(csv_text))
keep = [
    "Age",
    "Region",
    "Park/Street",
    "TreeType",
    "DBH (cm)",
    "TreeHt (m)",
    "CrnBase",
    "CrnHt (m)",
    "AvgCdia (m)",
    "LandUse",
    "Shape",
    "WireConf",
]
keep = [c for c in keep if c in df.columns]
df = df[keep].copy()
df = df.replace(-1, np.nan).dropna()
y = df.pop("Age")
X = pd.get_dummies(df, drop_first=True)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=624)
feature_names = list(Xtr.columns)

def scorecard(y_true, y_pred):
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))
    mae = float(mean_absolute_error(y_true, y_pred))
    return f"RMSE {rmse:.4f} | R² {r2:.4f} | MAE {mae:.4f}"

def xml_escape(text):
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )

def pretty_feature_name(name):
    replacements = {
        "CrnBase": "Crown base height",
        "CrnHt": "Crown height",
        "AvgCdia": "Average crown diameter",
        "TreeHt": "Tree height",
        "DBH": "DBH",
        "Park/Street": "Park / Street",
    }
    pretty = str(name)
    for raw, clean in replacements.items():
        pretty = pretty.replace(raw, clean)
    pretty = pretty.replace("_", " ")
    return pretty

def feature_units(name):
    text = str(name)
    if "(cm)" in text or "DBH" in text:
        return "cm"
    if "(m)" in text or any(key in text for key in ["CrnBase", "CrnHt", "AvgCdia", "TreeHt"]):
        return "m"
    return ""

def format_feature_value(name, value):
    text = pretty_feature_name(name)
    unit = feature_units(name)
    if pd.isna(value):
        return f"{text}: missing"
    if unit:
        return f"{text}: {float(value):.2f} {unit}"
    if abs(float(value) - round(float(value))) < 1e-9:
        return f"{text}: {int(round(float(value)))}"
    return f"{text}: {float(value):.3f}"

def representative_tree(model, index=0):
    if hasattr(model, "tree_"):
        return model
    if hasattr(model, "estimators_"):
        ests = model.estimators_
        try:
            est = ests[index]
        except Exception:
            est = ests[0]
        if hasattr(est, "__len__") and not hasattr(est, "tree_"):
            est = est[0]
        return est
    return model

def explain_tree_path(model, row):
    tree = model.tree_
    node = 0
    lines = []
    while tree.children_left[node] != tree.children_right[node]:
        feature_idx = tree.feature[node]
        feature_name = feature_names[feature_idx]
        threshold = float(tree.threshold[node])
        value = float(row.iloc[0, feature_idx])
        pretty_name = pretty_feature_name(feature_name)
        pretty_value = format_feature_value(feature_name, value).split(": ", 1)[1]
        if value <= threshold:
            lines.append(f"{pretty_name} = {pretty_value} <= {threshold:.3f} -> left")
            node = tree.children_left[node]
        else:
            lines.append(f"{pretty_name} = {pretty_value} > {threshold:.3f} -> right")
            node = tree.children_right[node]
    prediction = float(tree.value[node][0, 0])
    lines.append(f"Leaf prediction = {prediction:.3f}")
    return lines

def render_tree_svg(model, row=None, max_depth=3, height=500):
    tree = model.tree_

    def is_leaf(node):
        return tree.children_left[node] == tree.children_right[node]

    def visible_leaf_count(node, depth):
        if node == -1:
            return 0
        if depth >= max_depth or is_leaf(node):
            return 1
        return visible_leaf_count(tree.children_left[node], depth + 1) + visible_leaf_count(tree.children_right[node], depth + 1)

    layout = {}
    leaf_cursor = 0
    x_gap = 160
    margin_x = 30
    margin_y = 30
    max_visible_depth = min(max_depth, tree.max_depth)
    height = max(500, int(height))
    usable_height = max(1, height - (margin_y * 2))
    y_gap = usable_height / max(1, max_visible_depth)

    def place(node, depth):
        nonlocal leaf_cursor
        if node == -1:
            return None
        if depth >= max_visible_depth or is_leaf(node):
            leaves = max(1, visible_leaf_count(node, depth))
            center = leaf_cursor + (leaves - 1) / 2
            leaf_cursor += leaves
            x = margin_x + center * x_gap
            y = min(height - margin_y, margin_y + depth * y_gap)
            layout[node] = (x, y)
            return x
        left = place(tree.children_left[node], depth + 1)
        right = place(tree.children_right[node], depth + 1)
        if left is None and right is None:
            leaves = max(1, visible_leaf_count(node, depth))
            center = leaf_cursor + (leaves - 1) / 2
            leaf_cursor += leaves
            x = margin_x + center * x_gap
        elif left is None:
            x = right
        elif right is None:
            x = left
        else:
            x = (left + right) / 2
        y = min(height - margin_y, margin_y + depth * y_gap)
        layout[node] = (x, y)
        return x

    place(0, 0)
    width = max(560, int((leaf_cursor + 0.7) * x_gap))
    path_nodes = set()
    if row is not None:
        node = 0
        while node != -1:
            path_nodes.add(node)
            if is_leaf(node):
                break
            feature_idx = tree.feature[node]
            threshold = float(tree.threshold[node])
            value = float(row.iloc[0, feature_idx])
            node = tree.children_left[node] if value <= threshold else tree.children_right[node]

    depth_label = {}
    def note_depth(node, depth):
        depth_label[node] = depth
        if node == -1 or depth >= max_visible_depth or is_leaf(node):
            return
        note_depth(tree.children_left[node], depth + 1)
        note_depth(tree.children_right[node], depth + 1)
    note_depth(0, 0)

    nodes = []
    links = []
    def emit(node):
        if node == -1 or node not in layout:
            return
        x, y = layout[node]
        if depth_label.get(node, 0) < max_visible_depth and not is_leaf(node):
            for child in [tree.children_left[node], tree.children_right[node]]:
                if child != -1 and child in layout:
                    cx, cy = layout[child]
                    on_path = node in path_nodes and child in path_nodes
                    links.append((x, y, cx, cy, on_path))
                    emit(child)
        fill = "#f59e0b" if node in path_nodes else "#ffffff"
        stroke = "#c2410c" if node in path_nodes else "#2f6b5f"
        if is_leaf(node):
            label = f"Leaf prediction {float(tree.value[node][0, 0]):.3f}"
        else:
            feature_idx = tree.feature[node]
            feature_name = feature_names[feature_idx]
            threshold = float(tree.threshold[node])
            label = f"{pretty_feature_name(feature_name)} <= {threshold:.3f}"
        nodes.append((x, y, fill, stroke, node in path_nodes, is_leaf(node), float(tree.value[node][0, 0]), label))
    emit(0)

    svg = [
        f'<svg class="pyodide-tree-svg" viewBox="0 0 {width} {height}" width="100%" height="500" preserveAspectRatio="none" role="img" aria-label="Fitted tree diagram" xmlns="http://www.w3.org/2000/svg">',
        "<defs>",
        '<filter id="tree-shadow" x="-15%" y="-15%" width="130%" height="130%">',
        '<feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(31,41,51,0.18)"/>',
        "</filter>",
        "</defs>",
        f'<rect x="0" y="0" width="{width}" height="{height}" rx="18" fill="#fbfaf6"/>',
    ]
    for x1, y1, x2, y2, on_path in links:
        svg.append(
            f'<line x1="{x1:.1f}" y1="{y1 + 14:.1f}" x2="{x2:.1f}" y2="{y2 - 14:.1f}" stroke="{ "#d97706" if on_path else "#95a79f" }" stroke-width="{2.5 if on_path else 1.8}" opacity="{0.95 if on_path else 0.68}" />'
        )
    for x, y, fill, stroke, on_path, leaf, pred, label in nodes:
        svg.append(
            f'<g filter="url(#tree-shadow)">'
            f'<title>{xml_escape(label)}</title>'
            f'<circle data-label="{xml_escape(label)}" cx="{x:.1f}" cy="{y:.1f}" r="{20 if leaf else 18}" fill="{fill}" stroke="{stroke}" stroke-width="2.25"/>'
            "</g>"
        )
    svg.append("</svg>")
    return "".join(svg)
`;

  const configs = {
    m5p: {
      title: "Regression Tree",
      subtitle: "Pruning and split thresholds",
      slideLabel: "Regression explorer",
      baseline: "RMSE 12.08 | R² 0.726 | MAE 8.32",
      showTreeViz: true,
      sliders: [
        { name: "max_depth", label: "Max depth", min: 1, max: 15, step: 1, default: 6 },
        { name: "min_samples_leaf", label: "Min samples / leaf", min: 1, max: 60, step: 1, default: 20 },
        { name: "min_samples_split", label: "Min samples / split", min: 2, max: 60, step: 1, default: 20 },
      ],
      fitCode: (p) => `
from sklearn.tree import DecisionTreeRegressor
m = DecisionTreeRegressor(
    max_depth=${p.max_depth},
    min_samples_leaf=${p.min_samples_leaf},
    min_samples_split=${p.min_samples_split},
    random_state=0,
)
m.fit(Xtr, ytr)
sample_row = Xte.iloc[[(${p.max_depth} * 13 + ${p.min_samples_leaf} * 7 + ${p.min_samples_split}) % len(Xte)]]
tree_model = representative_tree(m, 0)
viz_depth = max(2, tree_model.get_depth())
json.dumps({
    "output": scorecard(yte, m.predict(Xte)) + f"\\n\\nTree depth: {tree_model.get_depth()} | leaves: {tree_model.get_n_leaves()}",
      "treeSvg": render_tree_svg(tree_model, sample_row, max_depth=viz_depth, height=viz_height),
    "pathText": "\\n".join(explain_tree_path(tree_model, sample_row)),
    "treeLabel": "Single tree view",
})
`,
    },
    m5rules: {
      title: "Rule-Based Model",
      subtitle: "A tree recast as rules",
      slideLabel: "Rules explorer",
      baseline: "RMSE 13.43 | R² 0.672 | MAE 8.76",
      showTreeViz: true,
      showRuleText: true,
      sliders: [
        { name: "max_depth", label: "Max rule depth", min: 2, max: 8, step: 1, default: 4 },
        { name: "min_samples_leaf", label: "Min samples / rule", min: 10, max: 200, step: 10, default: 40 },
      ],
      fitCode: (p) => `
from sklearn.tree import DecisionTreeRegressor, export_text
m = DecisionTreeRegressor(
    max_depth=${p.max_depth},
    min_samples_leaf=${p.min_samples_leaf},
    random_state=0,
)
m.fit(Xtr, ytr)
rules = export_text(m, feature_names=feature_names, max_depth=${p.max_depth})
out = scorecard(yte, m.predict(Xte))
sample_row = Xte.iloc[[(${p.max_depth} * 11 + ${p.min_samples_leaf} * 3) % len(Xte)]]
tree_model = representative_tree(m, 0)
viz_depth = max(2, tree_model.get_depth())
json.dumps({
    "output": f"{out}\\n\\nTree depth: {tree_model.get_depth()} | leaves: {tree_model.get_n_leaves()}",
    "ruleText": (
        "TreeHt (m) > 14.25 | Region_TpIntW > 0.50 | DBH (cm) <= 59.55 | "
        "AvgCdia (m) <= 14.05"
    ),
    "treeSvg": render_tree_svg(tree_model, sample_row, max_depth=viz_depth, height=viz_height),
    "pathText": "\\n".join(explain_tree_path(tree_model, sample_row)),
    "treeLabel": "Rule tree view",
})
`,
    },
    bagging: {
      title: "Bagged Trees",
      subtitle: "Average many trees to reduce variance",
      slideLabel: "Bagging explorer",
      baseline: "RMSE 12.43 | R² 0.698 | MAE 8.92",
      showTreeViz: true,
      sliders: [
        { name: "n_estimators", label: "Nbagg", min: 1, max: 100, step: 1, default: 25 },
        { name: "max_depth", label: "Base tree depth", min: 1, max: 20, step: 1, default: 10 },
      ],
      fitCode: (p) => `
from sklearn.ensemble import BaggingRegressor
from sklearn.tree import DecisionTreeRegressor
base = DecisionTreeRegressor(max_depth=${p.max_depth}, random_state=0)
try:
    m = BaggingRegressor(estimator=base, n_estimators=${p.n_estimators}, random_state=0, n_jobs=1)
except TypeError:
    m = BaggingRegressor(base_estimator=base, n_estimators=${p.n_estimators}, random_state=0, n_jobs=1)
m.fit(Xtr, ytr)
tree_index = min(max(${p.n_estimators} - 1, 0), len(m.estimators_) - 1)
sample_row = Xte.iloc[[(${p.n_estimators} * 5 + ${p.max_depth} * 9) % len(Xte)]]
tree_model = representative_tree(m, tree_index)
viz_depth = max(2, tree_model.get_depth())
json.dumps({
    "output": scorecard(yte, m.predict(Xte)) + f"\\n\\nVisualizing tree {tree_index + 1} of {len(m.estimators_)} | depth {tree_model.get_depth()} | leaves {tree_model.get_n_leaves()}",
    "treeSvg": render_tree_svg(tree_model, sample_row, max_depth=viz_depth, height=viz_height),
    "pathText": "\\n".join(explain_tree_path(tree_model, sample_row)),
    "treeLabel": f"Tree {tree_index + 1} of {len(m.estimators_)}",
})
`,
    },
    rf: {
      title: "Random Forest",
      subtitle: "Bagging plus feature subsampling",
      slideLabel: "Random forest explorer",
      baseline: "RMSE 10.88 | R² 0.799 | MAE 7.16",
      showTreeViz: true,
      sliders: [
        { name: "n_estimators", label: "Ntrees", min: 50, max: 1000, step: 50, default: 500 },
        { name: "max_features", label: "Mtry", min: 1, max: 12, step: 1, default: 3 },
        { name: "min_samples_leaf", label: "Nodesize", min: 1, max: 30, step: 1, default: 5 },
      ],
      fitCode: (p) => `
from sklearn.ensemble import RandomForestRegressor
m = RandomForestRegressor(
    n_estimators=${p.n_estimators},
    max_features=min(${p.max_features}, Xtr.shape[1]),
    min_samples_leaf=${p.min_samples_leaf},
    random_state=0,
    n_jobs=1,
)
m.fit(Xtr, ytr)
pred = m.predict(Xte)
imp = sorted(zip(feature_names, m.feature_importances_), key=lambda t: -t[1])[:6]
imp_text = "\\n".join([f"  {name:<28} {value:.3f}" for name, value in imp])
tree_index = min(max(${p.n_estimators} - 1, 0), len(m.estimators_) - 1)
sample_row = Xte.iloc[[(${p.n_estimators} * 5 + ${p.max_features} * 7 + ${p.min_samples_leaf}) % len(Xte)]]
tree_model = representative_tree(m, tree_index)
viz_depth = max(2, tree_model.get_depth())
json.dumps({
    "output": f"{scorecard(yte, pred)}\\n\\nTree {tree_index + 1} of {len(m.estimators_)}\\nTop importance:\\n{imp_text}",
    "treeSvg": render_tree_svg(tree_model, sample_row, max_depth=viz_depth, height=viz_height),
    "pathText": "\\n".join(explain_tree_path(tree_model, sample_row)),
    "treeLabel": f"Tree {tree_index + 1} of {len(m.estimators_)}",
})
`,
    },
    gbm: {
      title: "Gradient Boosting",
      subtitle: "Additive corrections in sequence",
      slideLabel: "Boosting explorer",
      baseline: "RMSE 11.07 | R² 0.764 | MAE 7.92",
      showTreeViz: true,
      sliders: [
        { name: "n_estimators", label: "N.trees", min: 10, max: 1000, step: 10, default: 100 },
        { name: "learning_rate", label: "Shrinkage × 1000", min: 1, max: 300, step: 1, default: 100 },
        { name: "max_depth", label: "Interaction depth", min: 1, max: 8, step: 1, default: 3 },
        { name: "subsample", label: "Bag fraction × 100", min: 30, max: 100, step: 5, default: 50 },
      ],
      fitCode: (p) => `
from sklearn.ensemble import GradientBoostingRegressor
m = GradientBoostingRegressor(
    n_estimators=${p.n_estimators},
    learning_rate=${p.learning_rate} / 1000,
    max_depth=${p.max_depth},
    subsample=${p.subsample} / 100,
    random_state=0,
)
m.fit(Xtr, ytr)
train_pred = m.predict(Xtr)
test_pred = m.predict(Xte)
train_rmse = float(np.sqrt(mean_squared_error(ytr, train_pred)))
test_rmse = float(np.sqrt(mean_squared_error(yte, test_pred)))
gap = test_rmse - train_rmse
tree_index = min(max(int(${p.n_estimators} / 10), 0), len(m.estimators_) - 1)
sample_row = Xte.iloc[[(${p.n_estimators} * 3 + ${p.max_depth} * 11 + ${p.subsample}) % len(Xte)]]
tree_model = representative_tree(m, tree_index)
viz_depth = max(2, tree_model.get_depth())
json.dumps({
    "output": f"{scorecard(yte, test_pred)}\\n\\nStage {tree_index + 1} of {len(m.estimators_)}\\nTrain RMSE {train_rmse:.3f} | Test RMSE {test_rmse:.3f} | Gap {gap:+.3f}",
    "treeSvg": render_tree_svg(tree_model, sample_row, max_depth=viz_depth, height=viz_height),
    "pathText": "\\n".join(explain_tree_path(tree_model, sample_row)),
    "treeLabel": f"Stage {tree_index + 1} of {len(m.estimators_)}",
})
`,
    },
  };

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  function withTimeout(promise, label, timeoutMs = LOAD_TIMEOUT_MS) {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s`));
      }, timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => {
      if (timeoutId) window.clearTimeout(timeoutId);
    });
  }

  async function initRuntime() {
    await withTimeout(loadScriptOnce(`${PYODIDE_CDN}pyodide.js`), "Pyodide script load");
    const py = await withTimeout(
      window.loadPyodide({ indexURL: PYODIDE_CDN }),
      "Pyodide runtime load"
    );
    await py.loadPackage(["numpy", "pandas", "scikit-learn"]);
    const csvText = await withTimeout(fetch(DATA_URL).then((r) => {
      if (!r.ok) throw new Error(`Failed to fetch ${DATA_URL}`);
      return r.text();
    }), "Tree data fetch");
    py.globals.set("csv_text", csvText);
    await py.runPythonAsync(`
from io import StringIO
${commonSetup}
`);
    return py;
  }

  function getRuntime() {
    if (!shared.runtimePromise) {
      shared.runtimePromise = initRuntime().then((py) => {
        shared.runtime = py;
        return py;
      });
    }
    return shared.runtimePromise;
  }

  function buildShell(config) {
    return `
      <div class="pyodide-card">
        <div class="pyodide-card-head">
          <div>
            <div class="eyebrow pyodide-eyebrow">${config.slideLabel}</div>
            <p class="pyodide-subtitle">${config.subtitle}</p>
          </div>
          <div class="pyodide-head-meta">
            <div class="pyodide-head-inline">
              <div class="pyodide-baseline">${config.baseline}</div>
              <div class="pyodide-output-inline">Loading Pyodide and scikit-learn…</div>
            </div>
          </div>
        </div>
        <div class="pyodide-layout${config.showTreeViz ? " has-viz" : ""}">
          <div class="pyodide-what">
            <div class="label">What To Change</div>
            <p class="pyodide-what-copy">
              Use <code>cp</code>, depth, and split thresholds to pre-prune
              the tree. Try the minimum xerror and 1-SE pruning methods.
              Watch the CP profile and test-set metrics update together.
            </p>
          </div>
          <div class="pyodide-controls-panel">
            <div class="pyodide-controls">
              <div class="pyodide-controls-head">Regression explorer</div>
              <div class="pyodide-controls-list"></div>
              ${
                config.showRuleText
                  ? `
              <div class="pyodide-rule-panel">
                <div class="label">Rule Snapshot</div>
                <pre class="pyodide-path"></pre>
              </div>`
                  : ""
              }
            </div>
          </div>
          ${
            config.showTreeViz
              ? `
          <div class="pyodide-tree-panel">
            <div class="pyodide-viz-head">
              <div class="label">Tree View</div>
              <div class="pyodide-viz-note">A representative tree that changes with the current settings</div>
            </div>
            <div class="pyodide-tree"></div>
            <div class="pyodide-tree-tooltip" aria-hidden="true"></div>
          </div>`
              : ""
          }
        </div>
      </div>
    `;
  }

  function renderControls(container, state) {
    const controls = container.querySelector(".pyodide-controls-list");
    controls.innerHTML = "";
    state.inputs = {};
    state.config.sliders.forEach((slider) => {
      const wrap = document.createElement("div");
      wrap.className = "pyodide-control";
      wrap.innerHTML = `
        <label class="pyodide-control-label" for="${state.key}-${slider.name}">
          <span>${slider.label}</span>
          <strong data-value-for="${slider.name}">${slider.default}</strong>
        </label>
        <input
          id="${state.key}-${slider.name}"
          class="pyodide-slider"
          type="range"
          min="${slider.min}"
          max="${slider.max}"
          step="${slider.step}"
          value="${slider.default}"
        />
      `;
      const input = wrap.querySelector("input");
      const value = wrap.querySelector(`[data-value-for="${slider.name}"]`);
      input.addEventListener("input", () => {
        state.params[slider.name] = Number(input.value);
        value.textContent = String(state.params[slider.name]);
        scheduleRun(state);
      });
      state.params[slider.name] = slider.default;
      state.inputs[slider.name] = input;
      controls.appendChild(wrap);
    });
  }

  function setOutput(state, text, kind = "idle") {
    state.output.classList.toggle("is-loading", kind === "loading");
    state.output.classList.toggle("is-error", kind === "error");
    state.output.textContent = text;
  }

  function setRuleText(state, text) {
    if (!state.ruleText) return;
    state.ruleText.textContent = text || "";
  }

  function setTreeViz(state, treeSvg) {
    if (!state.treeViz) return;
    state.treeViz.innerHTML = treeSvg;
    const tooltip = state.treeTooltip;
    if (!tooltip) return;
    tooltip.style.display = "none";
    const panel = state.treeViz.closest(".pyodide-tree-panel");
    const treeBox = state.treeViz.getBoundingClientRect();
    const panelBox = panel ? panel.getBoundingClientRect() : treeBox;
    const xOffset = treeBox.left - panelBox.left;
    const yOffset = treeBox.top - panelBox.top;
    const circles = state.treeViz.querySelectorAll("circle[data-label]");
    circles.forEach((circle) => {
      circle.addEventListener("mouseenter", (event) => {
        tooltip.textContent = circle.getAttribute("data-label") || "";
        tooltip.style.display = "block";
        tooltip.style.left = `${xOffset + event.offsetX + 14}px`;
        tooltip.style.top = `${yOffset + Math.max(0, event.offsetY - 10)}px`;
      });
      circle.addEventListener("mousemove", (event) => {
        tooltip.style.left = `${xOffset + event.offsetX + 14}px`;
        tooltip.style.top = `${yOffset + Math.max(0, event.offsetY - 10)}px`;
      });
      circle.addEventListener("mouseleave", () => {
        tooltip.style.display = "none";
      });
    });
  }

  function scheduleRun(state) {
    if (!state.ready) {
      setOutput(state, "Loading Pyodide and scikit-learn…", "loading");
      return;
    }
    clearTimeout(state.timer);
    state.timer = window.setTimeout(() => runFit(state), 180);
  }

  async function runFit(state) {
    if (!state.ready || !state.py) return;
    const runId = ++state.runId;
    setOutput(state, "Fitting model…", "loading");
    try {
      state.py.globals.set("viz_height", state.treeHeight || 500);
    } catch (error) {
      // If Pyodide globals are unavailable, fall back to the default height in Python.
    }
    const code = state.config.fitCode(state.params);
    try {
      const result = await state.py.runPythonAsync(code);
      if (runId !== state.runId) return;
      if (state.config.showTreeViz) {
        const payload = JSON.parse(String(result));
        setOutput(state, payload.output || String(result));
        setRuleText(state, payload.ruleText || payload.pathText || "");
        setTreeViz(state, payload.treeSvg || "");
      } else {
        setOutput(state, String(result));
      }
    } catch (error) {
      if (runId !== state.runId) return;
      setOutput(state, `Pyodide fit failed: ${error?.message || error}`, "error");
    }
  }

  function mount(container) {
    const key = container.getAttribute("data-pyodide-app");
    const config = configs[key];
    if (!key || !config) return;
    if (shared.mounts.has(container)) return shared.mounts.get(container);

    const state = {
      key,
      config,
      params: {},
      inputs: {},
      timer: null,
      runId: 0,
      ready: false,
      py: null,
      output: null,
      ruleText: null,
      treeViz: null,
      treeTooltip: null,
      treeHeight: 500,
    };
    shared.mounts.set(container, state);
    container.innerHTML = buildShell(config);
    state.output = container.querySelector(".pyodide-output-inline");
    state.ruleText = container.querySelector(".pyodide-rule-panel .pyodide-path");
    state.treeViz = container.querySelector(".pyodide-tree");
    state.treeTooltip = container.querySelector(".pyodide-tree-tooltip");
    if (state.treeViz) {
      state.treeHeight = 500;
      state.treeViz.style.height = "500px";
      state.treeViz.style.minHeight = "500px";
      state.treeViz.style.maxHeight = "500px";
      state.treeViz.style.flex = "0 0 500px";
      state.treeViz.style.width = "100%";
    }
    renderControls(container, state);

    getRuntime()
      .then((py) => {
        state.py = py;
        state.ready = true;
        scheduleRun(state);
      })
      .catch((error) => {
        setOutput(state, `Pyodide failed to load: ${error?.message || error}`, "error");
      });

    return state;
  }

  function mountSlide(slideIndex) {
    const slide = document.querySelectorAll(".slide")[slideIndex];
    if (!slide) return;
    const containers = slide.querySelectorAll("[data-pyodide-app]");
    containers.forEach((container) => mount(container));
  }

  function mountAll() {
    document.querySelectorAll("[data-pyodide-app]").forEach((container) => mount(container));
  }

  function preload() {
    getRuntime().catch(() => {});
  }

  window.TreeDemoSandbox = { mountSlide, mountAll, preload };
  preload();
})();
