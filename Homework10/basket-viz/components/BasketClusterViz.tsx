"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type BasketRecord = {
  transaction_id: number;
  x: number;
  y: number;
  z: number;
  cluster: string;
  basket_size: number;
  basket_size_scaled: number;
  rarity_score: number;
  rarity_score_scaled: number;
  items: string;
};

type LoadedBasketRecord = BasketRecord & {
  clusterColor: string;
};

type SceneApi = {
  rotate: (deltaTheta: number, deltaPhi: number) => void;
  zoom: (scale: number) => void;
  reset: () => void;
  clearPinned: () => void;
  pin: (index: number | null) => void;
};

const CLUSTER_COLORS = [
  "#5cc8ff",
  "#ff6b9e",
  "#ffd166",
  "#72f0be",
  "#b29dff",
];

const ORBIT_STEP = Math.PI / 24;
const ZOOM_IN_SCALE = 0.88;
const ZOOM_OUT_SCALE = 1.14;

function formatScore(value: number) {
  return value.toFixed(3);
}

function splitItems(items: string) {
  return items
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeBasketRow(row: Partial<BasketRecord> & Record<string, unknown>): BasketRecord {
  return {
    transaction_id: Number(row.transaction_id ?? 0),
    x: Number(row.x ?? 0),
    y: Number(row.y ?? 0),
    z: Number(row.z ?? 0),
    cluster: String(row.cluster ?? ""),
    basket_size: Number(row.basket_size ?? 0),
    basket_size_scaled: Number(row.basket_size_scaled ?? 0),
    rarity_score: Number(row.rarity_score ?? row.rarityScore ?? row.z ?? 0),
    rarity_score_scaled: Number(
      row.rarity_score_scaled ?? row.rarityScoreScaled ?? row.z ?? 0,
    ),
    items: String(row.items ?? ""),
  };
}

export default function BasketClusterViz() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneApiRef = useRef<SceneApi | null>(null);
  const hoveredIndexRef = useRef<number | null>(null);
  const selectedIndexRef = useRef<number | null>(null);
  const [records, setRecords] = useState<LoadedBasketRecord[]>([]);
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

        const response = await fetch(`${basePath}/basket_clusters.json`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load basket data (${response.status})`);
        }

        const payload = (await response.json()) as Array<
          Partial<BasketRecord> & Record<string, unknown>
        >;

        const normalized = payload.map((row, index) => {
          const record = normalizeBasketRow(row);
          const parsedCluster = Number.parseInt(record.cluster, 10);
          const clusterIndex =
            Number.isFinite(parsedCluster) && parsedCluster > 0
              ? parsedCluster - 1
              : index % CLUSTER_COLORS.length;

          return {
            ...record,
            clusterColor: CLUSTER_COLORS[clusterIndex % CLUSTER_COLORS.length],
          };
        });

        if (!cancelled) {
          setRecords(normalized);
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

  const summary = useMemo(() => {
    const total = records.length;
    const clusterCounts = new Map<string, number>();
    let averageBasket = 0;
    let averageRarity = 0;

    records.forEach((record) => {
      clusterCounts.set(record.cluster, (clusterCounts.get(record.cluster) ?? 0) + 1);
      averageBasket += record.basket_size;
      averageRarity += record.rarity_score;
    });

    return {
      total,
      clusterCounts,
      averageBasket: total ? averageBasket / total : 0,
      averageRarity: total ? averageRarity / total : 0,
    };
  }, [records]);

  const hoveredRecord = hoveredIndex === null ? null : records[hoveredIndex] ?? null;
  const selectedRecord = selectedIndex === null ? null : records[selectedIndex] ?? null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || records.length === 0) {
      return;
    }

    let disposed = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#09111f");
    scene.fog = new THREE.Fog("#09111f", 12, 28);

    const camera = new THREE.PerspectiveCamera(
      50,
      Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
      0.1,
      100,
    );
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.rotateSpeed = 0.6;
    controls.zoomSpeed = 0.95;
    controls.minDistance = 6;
    controls.maxDistance = 28;
    controls.target.set(0, 0, 0);
    controls.update();
    controls.saveState();

    const ambient = new THREE.AmbientLight("#ffffff", 1.55);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight("#ffffff", 1.8);
    keyLight.position.set(8, 12, 10);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight("#9edcff", 0.75);
    fillLight.position.set(-10, -4, -6);
    scene.add(fillLight);

    const axes = new THREE.AxesHelper(6.5);
    scene.add(axes);

    const grid = new THREE.GridHelper(18, 18, 0x31415a, 0x1a2434);
    grid.position.y = -3.5;
    scene.add(grid);

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(records.length * 3);
    const colors = new Float32Array(records.length * 3);
    const sizes = new Float32Array(records.length);

    records.forEach((record, index) => {
      positions[index * 3] = record.x;
      positions[index * 3 + 1] = record.y;
      positions[index * 3 + 2] = record.z;

      const color = new THREE.Color(record.clusterColor);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;

      sizes[index] = record.basket_size_scaled;
    });

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uSizeScale: { value: 10.5 },
      },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        varying vec3 vColor;
        uniform float uSizeScale;

        void main() {
          vColor = aColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float pointSize = aSize * uSizeScale;
          gl_PointSize = clamp(pointSize * (12.0 / max(0.8, -mvPosition.z)), 3.0, 24.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          vec2 centered = gl_PointCoord - vec2(0.5);
          float dist = length(centered);
          float alpha = smoothstep(0.5, 0.15, dist);
          if (alpha < 0.02) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const markerGeometry = new THREE.SphereGeometry(0.11, 18, 18);
    const hoverMarker = new THREE.Mesh(
      markerGeometry,
      new THREE.MeshStandardMaterial({
        color: "#fff4a3",
        emissive: "#7c6510",
        emissiveIntensity: 0.7,
        metalness: 0.1,
        roughness: 0.2,
      }),
    );
    hoverMarker.visible = false;
    scene.add(hoverMarker);

    const pinnedMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 22, 22),
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: "#8fc7ff",
        emissiveIntensity: 0.8,
        metalness: 0.05,
        roughness: 0.15,
      }),
    );
    pinnedMarker.visible = false;
    scene.add(pinnedMarker);

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.18;
    const pointer = new THREE.Vector2();
    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    const applyHover = (index: number | null) => {
      if (disposed) {
        return;
      }

      if (hoveredIndexRef.current === index) {
        return;
      }

      hoveredIndexRef.current = index;
      setHoveredIndex(index);

      if (index === null) {
        hoverMarker.visible = false;
        return;
      }

      const position = records[index];
      if (position) {
        hoverMarker.position.set(position.x, position.y, position.z);
        hoverMarker.visible = selectedIndexRef.current !== index;
      }
    };

    const syncPinnedMarker = (index: number | null) => {
      if (selectedIndexRef.current === index) {
        return;
      }

      selectedIndexRef.current = index;
      setSelectedIndex(index);

      if (index === null) {
        pinnedMarker.visible = false;
        return;
      }

      const position = records[index];
      if (position) {
        pinnedMarker.position.set(position.x, position.y, position.z);
        pinnedMarker.visible = true;
      }
    };

    const pickPoint = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObject(points);
      return intersections.length > 0 ? intersections[0]?.index ?? null : null;
    };

    const updateHoveredFromEvent = (event: PointerEvent) => {
      const index = pickPoint(event);
      applyHover(index);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.buttons !== 0) {
        const dx = event.clientX - dragStartX;
        const dy = event.clientY - dragStartY;
        if (Math.hypot(dx, dy) > 5) {
          dragging = true;
        }
      }

      updateHoveredFromEvent(event);
    };

    const handlePointerDown = (event: PointerEvent) => {
      dragging = false;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      updateHoveredFromEvent(event);
    };

    const handlePointerUp = (event: PointerEvent) => {
      const index = pickPoint(event);
      if (!dragging && index !== null) {
        const next = selectedIndexRef.current === index ? null : index;
        syncPinnedMarker(next);
        if (next !== null && hoveredIndexRef.current !== next) {
          applyHover(next);
        }
      }

      dragging = false;
    };

    const handlePointerLeave = () => {
      applyHover(null);
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
      camera.position.set(0, 0, 12);
      controls.target.set(0, 0, 0);
      controls.update();
    };

    const clearPinned = () => {
      syncPinnedMarker(null);
    };

    sceneApiRef.current = {
      rotate: orbit,
      zoom,
      reset,
      clearPinned,
      pin: syncPinnedMarker,
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
      const currentSelectedIndex = selectedIndexRef.current;
      const currentHoveredIndex = hoveredIndexRef.current;

      if (currentSelectedIndex === null) {
        pinnedMarker.visible = false;
      } else {
        const selected = records[currentSelectedIndex];
        if (selected) {
          pinnedMarker.position.set(selected.x, selected.y, selected.z);
          pinnedMarker.visible = true;
        }
      }

      if (currentHoveredIndex !== null) {
        const hovered = records[currentHoveredIndex];
        if (hovered) {
          hoverMarker.position.set(hovered.x, hovered.y, hovered.z);
          hoverMarker.visible = currentSelectedIndex !== currentHoveredIndex;
        }
      }

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

      geometry.dispose();
      material.dispose();
      markerGeometry.dispose();
      (hoverMarker.material as THREE.Material).dispose();
      pinnedMarker.geometry.dispose();
      (pinnedMarker.material as THREE.Material).dispose();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [records]);

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

  const clusterLegend = useMemo(() => {
    const clusters = [...new Set(records.map((record) => record.cluster))].sort(
      (left, right) => Number(left) - Number(right),
    );

    return clusters.map((cluster, index) => {
      const color = CLUSTER_COLORS[index % CLUSTER_COLORS.length];
      const count = summary.clusterCounts.get(cluster) ?? 0;

      return { cluster, color, count };
    });
  }, [records, summary.clusterCounts]);

  const detailRecord = selectedRecord ?? hoveredRecord;
  const showHoverPreview = Boolean(
    hoveredRecord && selectedRecord && hoveredIndex !== selectedIndex,
  );

  const detailLabel = selectedRecord
    ? "Pinned basket"
    : hoveredRecord
      ? "Hovered basket"
      : "No basket selected";

  const liveAnnounce = detailRecord
    ? `Transaction ${detailRecord.transaction_id}, cluster ${detailRecord.cluster}, basket size ${detailRecord.basket_size}, rarity ${formatScore(detailRecord.rarity_score)}`
    : "Hover a point to inspect basket details.";

  return (
    <section className="viz-shell" aria-label="Interactive 3D basket clustering">
      <div className="viz-stage-card">
        <div className="stage-header">
          <div className="stage-title-block">
            <p className="section-kicker">Interactive scene</p>
            <h2>Point cloud driven by basket similarity</h2>
          </div>
          <div className="stage-meta">
            <span>{summary.total.toLocaleString()} baskets</span>
            <span>{summary.clusterCounts.size} clusters</span>
          </div>
        </div>

        <section className="legend-bar" aria-label="Cluster legend">
          {clusterLegend.map((cluster) => (
            <div key={cluster.cluster} className="legend-chip">
              <span className="legend-swatch" style={{ backgroundColor: cluster.color }} />
              <span>Cluster {cluster.cluster}</span>
              <strong>{cluster.count.toLocaleString()}</strong>
            </div>
          ))}
        </section>

        <div className="stage-main">
          <div className="stage-canvas-wrap">
            <div className="stage-hint">
              <span>Drag to orbit</span>
              <span>Scroll to zoom</span>
              <span>Hover for details</span>
            </div>

            <div className="axis-note axis-x">X = PCA 1</div>
            <div className="axis-note axis-y">Y = PCA 2</div>
            <div className="axis-note axis-z">Z = basket rarity</div>

            <div ref={containerRef} className="stage-canvas" aria-hidden="true" />

            {loading ? (
              <div className="stage-state-overlay">Loading basket cloud…</div>
            ) : null}

            {loadError ? (
              <div className="stage-state-overlay error">Could not load data: {loadError}</div>
            ) : null}
          </div>

          <aside className="side-panel">
            <section className="panel-card details-card">
              <div className="panel-heading">
                <h3>Basket details</h3>
                <p>{detailLabel}</p>
              </div>

              {detailRecord ? (
                <div className="details-stack">
                  <div className="details-grid">
                    <div>
                      <span className="detail-label">Transaction</span>
                      <strong>#{detailRecord.transaction_id}</strong>
                    </div>
                    <div>
                      <span className="detail-label">Cluster</span>
                      <strong>{detailRecord.cluster}</strong>
                    </div>
                    <div>
                      <span className="detail-label">Basket size</span>
                      <strong>{detailRecord.basket_size} items</strong>
                    </div>
                    <div>
                      <span className="detail-label">Rarity score</span>
                      <strong>{formatScore(detailRecord.rarity_score)}</strong>
                    </div>
                  </div>

                  <div className="detail-subgrid">
                    <div>
                      <span className="detail-label">Scaled rarity</span>
                      <strong>{formatScore(detailRecord.rarity_score_scaled)}</strong>
                    </div>
                    <div>
                      <span className="detail-label">Scaled size</span>
                      <strong>{formatScore(detailRecord.basket_size_scaled)}</strong>
                    </div>
                  </div>

                  <div className="items-wrap">
                    {splitItems(detailRecord.items).map((item) => (
                      <span key={item} className="item-pill">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="empty-details">
                  Hover a point or click one to pin its basket contents here.
                </p>
              )}

              {showHoverPreview && hoveredRecord ? (
                <div className="details-stack details-preview">
                  <div className="panel-heading">
                    <p>Hover preview</p>
                  </div>
                  <div className="details-grid">
                    <div>
                      <span className="detail-label">Transaction</span>
                      <strong>#{hoveredRecord.transaction_id}</strong>
                    </div>
                    <div>
                      <span className="detail-label">Cluster</span>
                      <strong>{hoveredRecord.cluster}</strong>
                    </div>
                    <div>
                      <span className="detail-label">Basket size</span>
                      <strong>{hoveredRecord.basket_size} items</strong>
                    </div>
                    <div>
                      <span className="detail-label">Rarity score</span>
                      <strong>{formatScore(hoveredRecord.rarity_score)}</strong>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="panel-card tools-card">
              <div className="panel-heading compact-heading">
                <h3>Controls</h3>
                <p>Collapsed buttons and keyboard help.</p>
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
                    <span>Pin hovered basket</span>
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

      <div className="summary-strip" aria-label="Dataset summary">
        <div className="summary-card">
          <span className="summary-label">Average basket size</span>
          <strong>{summary.averageBasket.toFixed(2)}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Average rarity score</span>
          <strong>{summary.averageRarity.toFixed(3)}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Hover selection</span>
          <strong>{hoveredRecord ? `Transaction #${hoveredRecord.transaction_id}` : "None"}</strong>
        </div>
      </div>
    </section>
  );
}
