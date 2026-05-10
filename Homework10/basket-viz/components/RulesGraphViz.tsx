"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type ItemNode = {
  item: string;
  count: number;
  support: number;
  connected_lift_mean: number;
  node_strength: number;
};

type RuleNode = {
  rule_id: string;
  lhs: string;
  rhs: string;
  lhs_items: string[] | string;
  rhs_items: string[] | string;
  support: number;
  confidence: number;
  lift: number;
  count: number;
  node_strength: number;
};

type GraphPayload = {
  graph: {
    title: string;
    z_axis: string;
    note: string;
  };
  items: ItemNode[];
  rules: RuleNode[];
};

type SceneApi = {
  rotate: (deltaTheta: number, deltaPhi: number) => void;
  zoom: (scale: number) => void;
  reset: () => void;
  clearPinned: () => void;
  pin: (index: number | null) => void;
};

type VisualNode = {
  id: string;
  label: string;
  kind: "item" | "rule";
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  strength: number;
  support: number;
  confidence: number;
  lift: number;
  count: number;
  lhsItems: string[];
  rhsItems: string[];
};

type VisualEdge = {
  from: string;
  to: string;
  color: string;
  opacity: number;
};

const ORBIT_STEP = Math.PI / 24;
const ZOOM_IN_SCALE = 0.88;
const ZOOM_OUT_SCALE = 1.14;

function splitItems(items: string) {
  return items
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeItemList(value: string[] | string) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : value
      ? [value]
      : [];
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function rescale(value: number, min: number, max: number, targetMin: number, targetMax: number) {
  if (max === min) {
    return (targetMin + targetMax) / 2;
  }

  const normalized = (value - min) / (max - min);
  return targetMin + normalized * (targetMax - targetMin);
}

function averagePosition(points: Array<{ x: number; y: number; z: number }>) {
  if (points.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  const totals = points.reduce(
    (acc, point) => {
      acc.x += point.x;
      acc.y += point.y;
      acc.z += point.z;
      return acc;
    },
    { x: 0, y: 0, z: 0 },
  );

  return {
    x: totals.x / points.length,
    y: totals.y / points.length,
    z: totals.z / points.length,
  };
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatScore(value: number) {
  return value.toFixed(3);
}

function buildGraphLayout(payload: GraphPayload) {
  const sortedItems = [...payload.items].sort(
    (left, right) =>
      right.support - left.support || right.node_strength - left.node_strength || left.item.localeCompare(right.item),
  );
  const sortedRules = [...payload.rules].sort(
    (left, right) =>
      right.lift - left.lift || right.confidence - left.confidence || left.rule_id.localeCompare(right.rule_id),
  );

  const supportValues = sortedItems.map((item) => item.support);
  const itemStrengthValues = sortedItems.map((item) => item.node_strength);
  const liftValues = sortedRules.map((rule) => rule.lift);
  const confidenceValues = sortedRules.map((rule) => rule.confidence);

  const itemSupportMin = Math.min(...supportValues);
  const itemSupportMax = Math.max(...supportValues);
  const itemStrengthMin = Math.min(...itemStrengthValues);
  const itemStrengthMax = Math.max(...itemStrengthValues);
  const liftMin = Math.min(...liftValues);
  const liftMax = Math.max(...liftValues);
  const confidenceMin = Math.min(...confidenceValues);
  const confidenceMax = Math.max(...confidenceValues);

  const nodes: VisualNode[] = [];
  const edges: VisualEdge[] = [];
  const positions = new Map<string, { x: number; y: number; z: number }>();
  const itemCount = Math.max(sortedItems.length, 1);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  sortedItems.forEach((item, index) => {
    const supportNorm = clamp01(rescale(item.support, itemSupportMin, itemSupportMax, 0, 1));
    const strengthNorm = clamp01(rescale(item.node_strength, itemStrengthMin, itemStrengthMax, 0, 1));
    const angle = (index / itemCount) * Math.PI * 2;
    const radius = 3.6 + (1 - supportNorm) * 2.5;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.78;
    const z = rescale(item.node_strength, itemStrengthMin, itemStrengthMax, -2.9, 2.9);

    positions.set(item.item, { x, y, z });
    nodes.push({
      id: `item:${item.item}`,
      label: item.item,
      kind: "item",
      x,
      y,
      z,
      size: 0.14 + supportNorm * 0.28,
      color: new THREE.Color().setHSL(0.58, 0.35 + supportNorm * 0.18, 0.55 + supportNorm * 0.14).getStyle(),
      strength: item.node_strength,
      support: item.support,
      confidence: 0,
      lift: item.node_strength,
      count: item.count,
      lhsItems: [],
      rhsItems: [],
    });
  });

  sortedRules.forEach((rule, index) => {
    const lhsItems = normalizeItemList(rule.lhs_items);
    const rhsItems = normalizeItemList(rule.rhs_items);
    const connectedNames = [...new Set([...lhsItems, ...rhsItems])];
    const connectedPositions = connectedNames
      .map((itemName) => positions.get(itemName))
      .filter((position): position is { x: number; y: number; z: number } => Boolean(position));
    const centroid = averagePosition(connectedPositions);
    const liftNorm = clamp01(rescale(rule.lift, liftMin, liftMax, 0, 1));
    const confidenceNorm = clamp01(rescale(rule.confidence, confidenceMin, confidenceMax, 0, 1));
    const swirl = index * goldenAngle;
    const offset = 0.38 + liftNorm * 0.92;
    const x = centroid.x + Math.cos(swirl) * offset;
    const y = centroid.y + Math.sin(swirl) * offset * 0.72;
    const z = rescale(rule.lift, liftMin, liftMax, -3.8, 3.8);

    nodes.push({
      id: rule.rule_id,
      label: `${rule.lhs} => ${rule.rhs}`,
      kind: "rule",
      x,
      y,
      z,
      size: 0.18 + liftNorm * 0.26,
      color: new THREE.Color().setHSL(0.08 + liftNorm * 0.04, 0.8, 0.56 + liftNorm * 0.08).getStyle(),
      strength: rule.node_strength,
      support: rule.support,
      confidence: rule.confidence,
      lift: rule.lift,
      count: rule.count,
      lhsItems,
      rhsItems,
    });

    lhsItems.forEach((itemName) => {
      edges.push({
        from: `item:${itemName}`,
        to: rule.rule_id,
        color: "#77c8ff",
        opacity: 0.16 + confidenceNorm * 0.38,
      });
    });

    rhsItems.forEach((itemName) => {
      edges.push({
        from: rule.rule_id,
        to: `item:${itemName}`,
        color: "#ffd166",
        opacity: 0.16 + liftNorm * 0.34,
      });
    });
  });

  const avgLift = sortedRules.reduce((sum, rule) => sum + rule.lift, 0) / Math.max(sortedRules.length, 1);
  const strongestLift = sortedRules[0]?.lift ?? 0;

  return {
    nodes,
    edges,
    stats: {
      itemCount: sortedItems.length,
      ruleCount: sortedRules.length,
      avgLift,
      strongestLift,
      itemSupportMin,
      itemSupportMax,
    },
  };
}

export default function RulesGraphViz() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneApiRef = useRef<SceneApi | null>(null);
  const hoveredIndexRef = useRef<number | null>(null);
  const selectedIndexRef = useRef<number | null>(null);
  const nodeMeshesRef = useRef<THREE.Mesh[]>([]);
  const [payload, setPayload] = useState<GraphPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setLoadError(null);

        const response = await fetch(`${basePath}/rules_graph.json`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load rule graph data (${response.status})`);
        }

        const data = (await response.json()) as GraphPayload;
        if (!cancelled) {
          setPayload(data);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Unknown data loading error");
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [basePath]);

  const layout = useMemo(() => {
    if (!payload) {
      return null;
    }

    return buildGraphLayout(payload);
  }, [payload]);

  const hoveredNode = hoveredIndex === null || !layout ? null : layout.nodes[hoveredIndex] ?? null;
  const selectedNode = selectedIndex === null || !layout ? null : layout.nodes[selectedIndex] ?? null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !layout || layout.nodes.length === 0) {
      return;
    }

    let disposed = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#08111f");
    scene.fog = new THREE.Fog("#08111f", 14, 36);

    const camera = new THREE.PerspectiveCamera(
      48,
      Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
      0.1,
      120,
    );
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.rotateSpeed = 0.62;
    controls.zoomSpeed = 0.95;
    controls.minDistance = 8;
    controls.maxDistance = 34;
    controls.target.set(0, 0, 0);
    controls.update();
    controls.saveState();

    const ambient = new THREE.AmbientLight("#ffffff", 1.5);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight("#ffffff", 1.8);
    keyLight.position.set(10, 10, 12);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight("#6cb7ff", 0.65);
    fillLight.position.set(-10, -8, -10);
    scene.add(fillLight);

    const grid = new THREE.GridHelper(22, 22, 0x2c3d56, 0x18212f);
    grid.position.y = -5.5;
    scene.add(grid);

    const axisX = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-6, -5.5, 0),
      12,
      0xff6a6a,
      0.7,
      0.35,
    );
    const axisY = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(-6, -5.5, 0),
      8,
      0x55e08d,
      0.7,
      0.35,
    );
    const axisZ = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(-6, -5.5, 0),
      8,
      0x6a8dff,
      0.7,
      0.35,
    );
    scene.add(axisX);
    scene.add(axisY);
    scene.add(axisZ);

    const nodeGeometry = new THREE.SphereGeometry(1, 18, 18);
    const nodeMeshes: THREE.Mesh[] = [];
    nodeMeshesRef.current = nodeMeshes;
    const nodeMap = new Map<string, THREE.Mesh>();

    layout.nodes.forEach((node) => {
      const material = new THREE.MeshStandardMaterial({
        color: node.color,
        emissive: node.kind === "rule" ? "#3c2810" : "#111d2b",
        emissiveIntensity: node.kind === "rule" ? 0.35 : 0.25,
        roughness: 0.35,
        metalness: 0.08,
        transparent: true,
        opacity: 0.96,
      });

      const mesh = new THREE.Mesh(nodeGeometry, material);
      mesh.position.set(node.x, node.y, node.z);
      mesh.scale.setScalar(node.size);
      mesh.userData = {
        id: node.id,
        kind: node.kind,
        baseScale: node.size,
      };
      scene.add(mesh);
      nodeMeshes.push(mesh);
      nodeMap.set(node.id, mesh);
    });

    layout.edges.forEach((edge) => {
      const from = layout.nodes.find((node) => node.id === edge.from);
      const to = layout.nodes.find((node) => node.id === edge.to);
      if (!from || !to) {
        return;
      }

      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(from.x, from.y, from.z),
        new THREE.Vector3(to.x, to.y, to.z),
      ]);
      const material = new THREE.LineBasicMaterial({
        color: edge.color,
        transparent: true,
        opacity: edge.opacity,
      });
      const line = new THREE.Line(geometry, material);
      scene.add(line);
    });

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.22;
    const pointer = new THREE.Vector2();
    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    const setHovered = (index: number | null) => {
      if (hoveredIndexRef.current === index) {
        return;
      }

      hoveredIndexRef.current = index;
      setHoveredIndex(index);
    };

    const setSelected = (index: number | null) => {
      if (selectedIndexRef.current === index) {
        return;
      }

      selectedIndexRef.current = index;
      setSelectedIndex(index);
    };

    const pickNode = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(nodeMeshes, false);
      return intersections.length > 0 ? (intersections[0]?.object.userData.id as string) : null;
    };

    const updateHoverFromEvent = (event: PointerEvent) => {
      const id = pickNode(event);
      if (!id) {
        setHovered(null);
        return;
      }

      const index = layout.nodes.findIndex((node) => node.id === id);
      setHovered(index >= 0 ? index : null);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.buttons !== 0) {
        const dx = event.clientX - dragStartX;
        const dy = event.clientY - dragStartY;
        if (Math.hypot(dx, dy) > 5) {
          dragging = true;
        }
      }

      updateHoverFromEvent(event);
    };

    const handlePointerDown = (event: PointerEvent) => {
      dragging = false;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      updateHoverFromEvent(event);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const id = pickNode(event);
      if (!dragging && id) {
        const index = layout.nodes.findIndex((node) => node.id === id);
        if (index >= 0) {
          const next = selectedIndexRef.current === index ? null : index;
          setSelected(next);
          if (next !== null && hoveredIndexRef.current !== next) {
            setHovered(next);
          }
        }
      }

      dragging = false;
    };

    const handlePointerLeave = () => {
      setHovered(null);
      dragging = false;
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);

    const orbit = (deltaTheta: number, deltaPhi: number) => {
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta += deltaTheta;
      spherical.phi = THREE.MathUtils.clamp(
        spherical.phi + deltaPhi,
        0.05,
        Math.PI - 0.05,
      );
      offset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(offset);
      camera.lookAt(controls.target);
      controls.update();
    };

    const zoom = (scale: number) => {
      const offset = camera.position.clone().sub(controls.target);
      offset.multiplyScalar(scale);
      camera.position.copy(controls.target).add(offset);
      controls.update();
    };

    const reset = () => {
      controls.reset();
      camera.position.set(0, 0, 14);
      controls.target.set(0, 0, 0);
      controls.update();
    };

    const clearPinned = () => {
      setSelected(null);
    };

    sceneApiRef.current = {
      rotate: orbit,
      zoom,
      reset,
      clearPinned,
      pin: setSelected,
    };

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      camera.aspect = Math.max(clientWidth, 1) / Math.max(clientHeight, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const animationFrame = () => {
      if (disposed) {
        return;
      }

      controls.update();
      const currentHoveredIndex = hoveredIndexRef.current;
      const currentSelectedIndex = selectedIndexRef.current;

      nodeMeshes.forEach((mesh, index) => {
        const baseScale = mesh.userData.baseScale as number;
        const hoverBoost = index === currentHoveredIndex ? 1.18 : 1;
        const selectBoost = index === currentSelectedIndex ? 1.28 : 1;
        mesh.scale.setScalar(baseScale * hoverBoost * selectBoost);

        const material = mesh.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity =
          index === currentSelectedIndex ? 1.1 : index === currentHoveredIndex ? 0.7 : 0.25;
      });

      renderer.render(scene, camera);
      requestAnimationFrame(animationFrame);
    };

    animationFrame();

    return () => {
      disposed = true;
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      sceneApiRef.current = null;
      nodeMeshesRef.current = [];

      layout.nodes.forEach((_node, index) => {
        const mesh = nodeMeshes[index];
        if (mesh) {
          (mesh.material as THREE.Material).dispose();
        }
      });
      nodeGeometry.dispose();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [layout]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!sceneApiRef.current) {
        return;
      }

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          sceneApiRef.current.rotate(-ORBIT_STEP, 0);
          break;
        case "ArrowRight":
          event.preventDefault();
          sceneApiRef.current.rotate(ORBIT_STEP, 0);
          break;
        case "ArrowUp":
          event.preventDefault();
          sceneApiRef.current.rotate(0, -ORBIT_STEP);
          break;
        case "ArrowDown":
          event.preventDefault();
          sceneApiRef.current.rotate(0, ORBIT_STEP);
          break;
        case "+":
        case "=":
          event.preventDefault();
          sceneApiRef.current.zoom(ZOOM_IN_SCALE);
          break;
        case "-":
        case "_":
          event.preventDefault();
          sceneApiRef.current.zoom(ZOOM_OUT_SCALE);
          break;
        case "Escape":
          if (selectedIndexRef.current !== null) {
            event.preventDefault();
            sceneApiRef.current.clearPinned();
          }
          break;
        case "Enter":
        case " ":
          if (hoveredIndexRef.current !== null) {
            event.preventDefault();
            const next =
              selectedIndexRef.current === hoveredIndexRef.current
                ? null
                : hoveredIndexRef.current;
            if (next === null) {
              sceneApiRef.current.clearPinned();
            } else {
              sceneApiRef.current.pin(next);
            }
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const detailNode = selectedNode ?? hoveredNode;
  const detailLabel = selectedNode
    ? "Pinned node"
    : hoveredNode
      ? "Hovered node"
      : "No node selected";
  const showHoverPreview = Boolean(hoveredNode && selectedNode && hoveredIndex !== selectedIndex);

  const liveAnnounce = detailNode
    ? detailNode.kind === "rule"
      ? `Rule ${detailNode.label}, support ${formatPercent(detailNode.support)}, confidence ${formatPercent(detailNode.confidence)}, lift ${formatScore(detailNode.lift)}`
      : `Item ${detailNode.label}, support ${formatPercent(detailNode.support)}, connected lift ${formatScore(detailNode.strength)}`
    : "Hover a node to inspect rule or item details.";

  return (
    <section className="viz-shell" aria-label="Interactive association rules graph">
      <div className="viz-stage-card">
        <div className="stage-header">
          <div className="stage-title-block">
            <p className="section-kicker">Interactive graph</p>
            <h2>Association rules network in 3D</h2>
          </div>
          <div className="stage-meta">
            <span>{layout?.stats.itemCount.toLocaleString() ?? 0} items</span>
            <span>{layout?.stats.ruleCount.toLocaleString() ?? 0} rules</span>
          </div>
        </div>

        <section className="legend-bar" aria-label="Graph legend">
          <div className="legend-chip">
            <span className="legend-swatch" style={{ backgroundColor: "#7cc6ff" }} />
            <span>Item nodes</span>
            <strong>Support-driven</strong>
          </div>
          <div className="legend-chip">
            <span className="legend-swatch" style={{ backgroundColor: "#ffb35d" }} />
            <span>Rule nodes</span>
            <strong>Lift-driven</strong>
          </div>
          <div className="legend-chip">
            <span className="legend-swatch" style={{ backgroundColor: "#9ea8b8" }} />
            <span>Z axis</span>
            <strong>Association prominence</strong>
          </div>
        </section>

        <div className="stage-main">
          <div className="stage-canvas-wrap">
            <div className="stage-hint">
              <span>Drag to orbit</span>
              <span>Scroll to zoom</span>
              <span>Hover for details</span>
            </div>

            <div className="axis-note axis-x">X = layout flow</div>
            <div className="axis-note axis-y">Y = rule group position</div>
            <div className="axis-note axis-z">Z = association prominence</div>

            <div ref={containerRef} className="stage-canvas" aria-hidden="true" />

            {loading ? <div className="stage-state-overlay">Loading rule network…</div> : null}
            {loadError ? (
              <div className="stage-state-overlay error">Could not load data: {loadError}</div>
            ) : null}
          </div>

          <aside className="side-panel">
            <section className="panel-card details-card">
              <div className="panel-heading">
                <h3>Node details</h3>
                <p>{detailLabel}</p>
              </div>

              {detailNode ? (
                <div className="details-stack">
                  <div className="details-grid">
                    <div>
                      <span className="detail-label">Type</span>
                      <strong>{detailNode.kind}</strong>
                    </div>
                    <div>
                      <span className="detail-label">Strength</span>
                      <strong>{formatScore(detailNode.strength)}</strong>
                    </div>
                    <div>
                      <span className="detail-label">Support</span>
                      <strong>{formatPercent(detailNode.support)}</strong>
                    </div>
                    <div>
                      <span className="detail-label">Count</span>
                      <strong>{detailNode.count.toLocaleString()}</strong>
                    </div>
                  </div>

                  {detailNode.kind === "rule" ? (
                    <div className="detail-subgrid">
                      <div>
                        <span className="detail-label">Confidence</span>
                        <strong>{formatPercent(detailNode.confidence)}</strong>
                      </div>
                      <div>
                        <span className="detail-label">Lift</span>
                        <strong>{formatScore(detailNode.lift)}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="detail-subgrid">
                      <div>
                        <span className="detail-label">Connected lift</span>
                        <strong>{formatScore(detailNode.strength)}</strong>
                      </div>
                      <div>
                        <span className="detail-label">Z axis</span>
                        <strong>Prominence</strong>
                      </div>
                    </div>
                  )}

                  <div className="items-wrap">
                    {detailNode.kind === "rule"
                      ? detailNode.lhsItems.map((item) => (
                          <span key={`lhs-${item}`} className="item-pill">
                            {item}
                          </span>
                        ))
                      : splitItems(detailNode.label).map((item) => (
                          <span key={item} className="item-pill">
                            {item}
                          </span>
                        ))}
                    {detailNode.kind === "rule"
                      ? detailNode.rhsItems.map((item) => (
                          <span key={`rhs-${item}`} className="item-pill">
                            {item}
                          </span>
                        ))
                      : null}
                  </div>
                </div>
              ) : (
                <p className="empty-details">Hover a node or click one to pin it here.</p>
              )}

              {showHoverPreview && hoveredNode ? (
                <div className="details-stack details-preview">
                  <div className="panel-heading">
                    <p>Hover preview</p>
                  </div>
                  <div className="details-grid">
                    <div>
                      <span className="detail-label">Label</span>
                      <strong>{hoveredNode.label}</strong>
                    </div>
                    <div>
                      <span className="detail-label">Strength</span>
                      <strong>{formatScore(hoveredNode.strength)}</strong>
                    </div>
                    <div>
                      <span className="detail-label">Support</span>
                      <strong>{formatPercent(hoveredNode.support)}</strong>
                    </div>
                    <div>
                      <span className="detail-label">Count</span>
                      <strong>{hoveredNode.count.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="panel-card tools-card">
              <div className="panel-heading compact-heading">
                <h3>Controls</h3>
                <p>Small, collapsible camera and keyboard help.</p>
              </div>

              <details className="tool-group">
                <summary>Camera controls</summary>
                <div className="button-grid compact-grid">
                  <button type="button" onClick={() => sceneApiRef.current?.rotate(-ORBIT_STEP, 0)}>
                    ←
                  </button>
                  <button type="button" onClick={() => sceneApiRef.current?.rotate(0, -ORBIT_STEP)}>
                    ↑
                  </button>
                  <button type="button" onClick={() => sceneApiRef.current?.rotate(0, ORBIT_STEP)}>
                    ↓
                  </button>
                  <button type="button" onClick={() => sceneApiRef.current?.rotate(ORBIT_STEP, 0)}>
                    →
                  </button>
                  <button type="button" onClick={() => sceneApiRef.current?.zoom(ZOOM_IN_SCALE)}>
                    +
                  </button>
                  <button type="button" onClick={() => sceneApiRef.current?.zoom(ZOOM_OUT_SCALE)}>
                    -
                  </button>
                  <button type="button" onClick={() => sceneApiRef.current?.reset()}>
                    Reset
                  </button>
                  <button type="button" onClick={() => sceneApiRef.current?.clearPinned()}>
                    Clear
                  </button>
                </div>
              </details>

              <details className="tool-group">
                <summary>Keyboard</summary>
                <div className="keyboard-list compact-keyboard">
                  <div>
                    <kbd>Arrows</kbd>
                    <span>Rotate</span>
                  </div>
                  <div>
                    <kbd>+</kbd>
                    <kbd>-</kbd>
                    <span>Zoom</span>
                  </div>
                  <div>
                    <kbd>Enter</kbd>
                    <kbd>Space</kbd>
                    <span>Pin hovered node</span>
                  </div>
                  <div>
                    <kbd>Esc</kbd>
                    <span>Clear pin</span>
                  </div>
                </div>
              </details>
            </section>
          </aside>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {liveAnnounce}
      </p>

      <div className="summary-strip" aria-label="Rule network summary">
        <div className="summary-card">
          <span className="summary-label">Average lift</span>
          <strong>{layout ? formatScore(layout.stats.avgLift) : "0.000"}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Strongest lift</span>
          <strong>{layout ? formatScore(layout.stats.strongestLift) : "0.000"}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Hover selection</span>
          <strong>{hoveredNode ? hoveredNode.label : "None"}</strong>
        </div>
      </div>
    </section>
  );
}
