import { chromium } from "playwright";
import pptxgen from "pptxgenjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "../..");
const presentationDir = path.resolve(projectRoot, "presentation");
const htmlPath = path.resolve(presentationDir, "index.html");
const outputDir = path.join(__dirname, "output");
const assetDir = path.join(outputDir, "translated_assets");
const pptxPath = path.join(outputDir, "trees_translated_first_pass.pptx");

const viewport = { width: 1600, height: 900 };
const slideSize = { w: 13.333, h: 7.5 };

const theme = {
  baseBg: "EDE9DF",
  card: "FFF9F0",
  panel: "FBF5EA",
  ink: "1F2933",
  muted: "5F6C7B",
  line: "D8D0C3",
  squirrel: "8C6A2F",
  tree: "2F6B5F",
  fire: "C65A1E",
  smoke: "7C8792",
  gold: "D6A243",
};

const accentTheme = {
  intro: { bar: theme.smoke, orbA: "D6A243", orbB: "2F6B5F" },
  squirrel: { bar: theme.squirrel, orbA: "D6A243", orbB: "C9AE7D" },
  tree: { bar: theme.tree, orbA: "2F6B5F", orbB: "D6A243" },
  fire: { bar: theme.fire, orbA: "C65A1E", orbB: "D6A243" },
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function clearDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (fs.lstatSync(fullPath).isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function scaleX(px) {
  return (px / viewport.width) * slideSize.w;
}

function scaleY(px) {
  return (px / viewport.height) * slideSize.h;
}

function splitTextBlocks(blocks) {
  if (blocks.length <= 3) return [blocks];
  const half = Math.ceil(blocks.length / 2);
  return [blocks.slice(0, half), blocks.slice(half)];
}

function estimateTextHeight(block, widthInches) {
  const charsPerLine = Math.max(24, Math.floor(widthInches * 15));
  const lines = block.lines.reduce((sum, line) => {
    const raw = line.text.length || 1;
    return sum + Math.max(1, Math.ceil(raw / charsPerLine));
  }, 0);
  const labelBonus = block.lines.some((line) => line.kind === "label") ? 0.18 : 0;
  return clamp(0.44 + lines * 0.17 + labelBonus, 0.7, 2.2);
}

function colorForBlock(accent, index) {
  const base = {
    intro: ["FFF9F0", "F7F1E6", "F4EFE8"],
    squirrel: ["FFF7EB", "F7EEDB", "F3E6CE"],
    tree: ["F2F7F2", "EDF5F0", "F8F4E8"],
    fire: ["FFF4EC", "FBEDE3", "F7EFE2"],
  };
  const palette = base[accent] || base.intro;
  return palette[index % palette.length];
}

async function collectSlides() {
  ensureDir(outputDir);
  ensureDir(assetDir);
  clearDir(assetDir);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.goto(`file://${htmlPath}`);
  await page.addStyleTag({
    content: `
      body { overflow: hidden !important; }
      .nav, .pager { display: none !important; }
      .deck { padding: 0 !important; }
      .slide {
        width: 100vw !important;
        max-width: 100vw !important;
        height: 100vh !important;
        min-height: 100vh !important;
        margin: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
      }
    `,
  });

  const slideCount = await page.evaluate(() => document.querySelectorAll(".slide").length);
  const slidePayload = [];

  for (let index = 0; index < slideCount; index += 1) {
    await page.evaluate((slideIndex) => {
      showSlide(slideIndex);

      if (slideIndex === 4) {
        renderAnimatedTree("squirrelTreeViz", squirrelTreeData, palette.squirrel);
      }
      if (slideIndex === 12) {
        renderAnimatedTree("urbanTreeViz", urbanTreeData, palette.tree);
      }
      if (slideIndex === 18) {
        renderAnimatedTree("wildfireTreeViz", wildfireTreeData, palette.fire);
      }
      if (slideIndex === 19) {
        renderBoostSequence();
      }

      maybeRunDeferredCharts();
    }, index);

    await page.waitForTimeout(200);
    await page.evaluate(() => {
      if (window.gsap?.globalTimeline) {
        window.gsap.globalTimeline.progress(1);
      }
    });
    await page.waitForTimeout(150);

    const data = await page.evaluate((slideIndex) => {
      const slide = document.querySelectorAll(".slide")[slideIndex];
      const active = slide.classList.contains("active") ? slide : document.querySelector(".slide.active");
      if (!active) return null;

      const contentSelector = ".hero-grid, .two-col, .code-grid, .image-grid, .formula-grid, .three-col, .feature-split, .stat-grid";
      const blockRoots = [];

      Array.from(active.children)
        .filter((child) => child.matches(contentSelector))
        .forEach((container) => {
        Array.from(container.children).forEach((child) => {
          if (!blockRoots.includes(child)) blockRoots.push(child);
        });
      });

      const graphicSelector = ".chart-panel, .custom-chart, .tree-viz, .boost-sequence-chart";

      const findGraphic = (block) => {
        if (block.matches(graphicSelector)) return block;
        return block.querySelector(graphicSelector);
      };

      const textNodesForBlock = (block) => {
        const candidates = block.querySelectorAll(
          ".label, h2, p, li, .equation, .stat-label, .stat-value, figcaption, .pill, .note-strip span"
        );
        const seen = new Set();
        const lines = [];

        candidates.forEach((node) => {
          if (
            node.closest(".code-block, .output-block, .replay-button, .button, .tree-viz, .chart-panel, .custom-chart, .boost-sequence-chart") ||
            node.matches(".replay-button, .button")
          ) {
            return;
          }

          const text = node.innerText.replace(/\s+/g, " ").trim();
          if (!text || seen.has(text)) return;
          seen.add(text);

          let kind = "body";
          if (node.matches(".label")) kind = "label";
          else if (node.matches("h2")) kind = "heading";
          else if (node.matches(".equation, .stat-value")) kind = "equation";
          else if (node.matches("li")) kind = "bullet";
          else if (node.matches("figcaption, .viz-caption")) kind = "caption";
          else if (node.matches(".pill, .note-strip span")) kind = "tag";
          else if (node.matches(".stat-label")) kind = "label";

          lines.push({ kind, text });
        });

        return lines;
      };

      const graphics = [];
      let graphicIndex = 0;
      blockRoots.forEach((block) => {
        const graphic = findGraphic(block);
        if (!graphic) return;
        const id = `slide-${String(slideIndex + 1).padStart(2, "0")}-graphic-${String(graphicIndex + 1).padStart(2, "0")}`;
        graphic.setAttribute("data-export-graphic", id);
        graphics.push({ id });
        graphicIndex += 1;
      });

      return {
        step: slideIndex + 1,
        accent: active.dataset.accent || "intro",
        eyebrow: active.querySelector(".eyebrow")?.innerText.trim() || "",
        title: active.querySelector("h1")?.innerText.trim() || "",
        subtitle: active.querySelector(".subtitle")?.innerText.replace(/\s+/g, " ").trim() || "",
        blocks: blockRoots
          .map((block) => ({
            lines: textNodesForBlock(block),
            hasGraphic: Boolean(findGraphic(block)),
          }))
          .filter((block) => block.lines.length || block.hasGraphic),
        graphics,
      };
    }, index);

    if (!data) continue;

    for (const graphic of data.graphics) {
      const locator = page.locator(`[data-export-graphic="${graphic.id}"]`);
      const targetPath = path.join(assetDir, `${graphic.id}.png`);
      await locator.screenshot({ path: targetPath });
      graphic.path = targetPath;
    }

    slidePayload.push(data);
  }

  await browser.close();
  return slidePayload;
}

function addBackground(slide, accent) {
  const palette = accentTheme[accent] || accentTheme.intro;

  slide.background = { color: theme.baseBg };
  slide.addShape("rect", {
    x: 0,
    y: 0,
    w: slideSize.w,
    h: slideSize.h,
    line: { color: theme.baseBg, transparency: 100 },
    fill: { color: theme.baseBg },
  });
  slide.addShape("ellipse", {
    x: -0.3,
    y: -0.55,
    w: 3.2,
    h: 2.0,
    line: { color: palette.orbA, transparency: 100 },
    fill: { color: palette.orbA, transparency: 78 },
  });
  slide.addShape("ellipse", {
    x: 10.3,
    y: -0.2,
    w: 3.0,
    h: 2.2,
    line: { color: palette.orbB, transparency: 100 },
    fill: { color: palette.orbB, transparency: 84 },
  });
  slide.addShape("roundRect", {
    x: 0.28,
    y: 0.22,
    w: 12.77,
    h: 7.0,
    rectRadius: 0.14,
    line: { color: "D9D1C6", transparency: 30, width: 1 },
    fill: { color: "FFFDF8", transparency: 8 },
  });
  slide.addShape("rect", {
    x: 0.28,
    y: 0.22,
    w: 12.77,
    h: 0.08,
    line: { color: palette.bar, transparency: 100 },
    fill: { color: palette.bar },
  });
}

function addTitleArea(slide, data) {
  slide.addText(data.eyebrow, {
    x: 0.72,
    y: 0.34,
    w: 4.2,
    h: 0.24,
    fontFace: "Georgia",
    fontSize: 8.5,
    bold: true,
    color: theme.muted,
    charSpace: 1.2,
    allCaps: true,
    margin: 0,
  });

  slide.addText(data.title, {
    x: 0.72,
    y: 0.58,
    w: 11.7,
    h: 0.74,
    fontFace: "Georgia",
    fontSize: 24,
    bold: false,
    color: theme.ink,
    margin: 0,
    fit: "shrink",
    breakLine: false,
    valign: "mid",
  });

  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 0.72,
      y: 1.22,
      w: 11.5,
      h: 0.5,
      fontFace: "Georgia",
      fontSize: 11.5,
      color: theme.muted,
      margin: 0,
      fit: "shrink",
    });
  }
}

function addTextBlock(slide, block, x, y, w, h, accent, idx) {
  const fillColor = colorForBlock(accent, idx);
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h,
    rectRadius: 0.12,
    line: { color: theme.line, transparency: 18, width: 1 },
    fill: { color: fillColor },
  });

  const runs = [];
  block.lines.forEach((line, i) => {
    let fontSize = 11;
    let bold = false;
    let color = theme.muted;

    if (line.kind === "label") {
      fontSize = 8.5;
      bold = true;
      color = theme.muted;
    } else if (line.kind === "heading") {
      fontSize = 13;
      bold = true;
      color = theme.ink;
    } else if (line.kind === "equation") {
      fontSize = 14;
      bold = true;
      color = theme.ink;
    } else if (line.kind === "caption") {
      fontSize = 10;
      color = theme.muted;
    } else if (line.kind === "tag") {
      fontSize = 9.5;
      color = theme.ink;
    }

    const text = line.kind === "bullet" ? `• ${line.text}` : line.text;
    runs.push({
      text: i === 0 ? text : `\n${text}`,
      options: {
        fontFace: "Georgia",
        fontSize,
        bold,
        color,
        breakLine: false,
      },
    });
  });

  slide.addText(runs, {
    x: x + 0.18,
    y: y + 0.12,
    w: w - 0.36,
    h: h - 0.22,
    margin: 0,
    valign: "top",
    fit: "shrink",
  });
}

function addGraphicBlock(slide, graphic, x, y, w, h, accent, caption, idx) {
  slide.addShape("roundRect", {
    x,
    y,
    w,
    h,
    rectRadius: 0.12,
    line: { color: theme.line, transparency: 18, width: 1 },
    fill: { color: colorForBlock(accent, idx) },
  });

  const imgX = x + 0.14;
  const imgY = y + 0.14;
  const imgW = w - 0.28;
  const captionHeight = caption ? 0.54 : 0.06;
  const imgH = h - 0.14 - captionHeight - 0.08;

  slide.addImage({
    path: graphic.path,
    x: imgX,
    y: imgY,
    w: imgW,
    h: Math.max(0.6, imgH),
    sizing: { type: "contain", x: imgX, y: imgY, w: imgW, h: Math.max(0.6, imgH) },
  });

  if (caption) {
    slide.addText(caption, {
      x: x + 0.18,
      y: y + h - 0.42,
      w: w - 0.36,
      h: 0.28,
      fontFace: "Georgia",
      fontSize: 9.5,
      color: theme.muted,
      margin: 0,
      fit: "shrink",
    });
  }
}

function buildPptx(slidesData) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Codex";
  pptx.company = "CUNY";
  pptx.subject = "Tree-Based Models translated PowerPoint draft";
  pptx.title = "Tree-Based Models: Squirrels, Trees, and Wildfires";

  for (const data of slidesData) {
    const slide = pptx.addSlide();
    addBackground(slide, data.accent);
    addTitleArea(slide, data);

    const graphics = data.graphics || [];
    const textBlocks = data.blocks
      .map((block) => ({
        lines: block.lines.filter((line) => line.text !== "Animated Tree" && line.text !== "R Code" && line.text !== "Python Code" && line.text !== "Resulting Rules" && line.text !== "Console Output"),
      }))
      .filter((block) => block.lines.length);

    const rightWidth = graphics.length ? 4.7 : 0;
    const leftWidth = graphics.length ? 7.0 : 11.5;
    const topY = 1.78;
    const maxHeight = 5.25;

    if (!graphics.length) {
      const columns = splitTextBlocks(textBlocks);
      const gutter = columns.length > 1 ? 0.22 : 0;
      const colWidth = (leftWidth - gutter) / columns.length;

      columns.forEach((columnBlocks, colIndex) => {
        let y = topY;
        columnBlocks.forEach((block, idx) => {
          const height = estimateTextHeight(block, colWidth);
          addTextBlock(slide, block, 0.78 + colIndex * (colWidth + gutter), y, colWidth, height, data.accent, idx);
          y += height + 0.12;
        });
      });
      continue;
    }

    let textY = topY;
    textBlocks.forEach((block, idx) => {
      const height = estimateTextHeight(block, leftWidth);
      if (textY + height > topY + maxHeight) return;
      addTextBlock(slide, block, 0.78, textY, leftWidth, height, data.accent, idx);
      textY += height + 0.12;
    });

    const imageX = 7.82;
    const availableGraphicHeight = maxHeight - 0.1;
    const gap = graphics.length > 1 ? 0.14 : 0;
    const boxHeight = (availableGraphicHeight - gap * (graphics.length - 1)) / graphics.length;

    graphics.forEach((graphic, idx) => {
      const relatedText = data.blocks
        .find((block) => block.hasGraphic && block.lines.some((line) => line.kind === "caption"))
        ?.lines.find((line) => line.kind === "caption")?.text;

      addGraphicBlock(
        slide,
        graphic,
        imageX,
        topY + idx * (boxHeight + gap),
        rightWidth,
        boxHeight,
        data.accent,
        idx === graphics.length - 1 ? relatedText : "",
        idx
      );
    });
  }

  return pptx.writeFile({ fileName: pptxPath });
}

async function main() {
  const slidesData = await collectSlides();
  await buildPptx(slidesData);
  console.log(`Created ${pptxPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
