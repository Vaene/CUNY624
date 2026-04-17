import { chromium } from "playwright";
import pptxgen from "pptxgenjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "../..");
const presentationDir = path.resolve(projectRoot, "presentation");
const htmlPath = path.resolve(presentationDir, "index.html");
const outputDir = path.resolve(__dirname, "output");
const stillDir = path.join(outputDir, "stills");

const viewport = { width: 1920, height: 1080 };
const slideSize = { w: 13.333, h: 7.5 };
const slideCount = 23;

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

function stepToIndex(step) {
  return step - 1;
}

async function captureSlides() {
  ensureDir(outputDir);
  ensureDir(stillDir);
  clearDir(stillDir);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  await page.goto(`file://${htmlPath}`);

  const captureCSS = `
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
  `;

  await page.addStyleTag({ content: captureCSS });

  for (let step = 1; step <= slideCount; step += 1) {
    await page.evaluate((index) => {
      if (typeof window.showSlide === "function") {
        window.showSlide(index);
      }
    }, stepToIndex(step));

    await page.waitForTimeout(500);
    const stillPath = path.join(stillDir, `slide_${String(step).padStart(2, "0")}.png`);
    await page.screenshot({ path: stillPath });
  }

  await browser.close();
}

async function buildPptx() {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Trees Export";
  pptx.company = "CUNY";
  pptx.subject = "Tree-Based Models Presentation";

  for (let step = 1; step <= slideCount; step += 1) {
    const slide = pptx.addSlide();
    const stillPath = path.join(stillDir, `slide_${String(step).padStart(2, "0")}.png`);
    slide.addImage({
      path: stillPath,
      x: 0,
      y: 0,
      w: slideSize.w,
      h: slideSize.h,
    });
  }

  const pptxPath = path.join(outputDir, "trees_slides.pptx");
  await pptx.writeFile({ fileName: pptxPath });
}

function zipOutput() {
  const zipPath = path.join(outputDir, "trees_slides_png_only.zip");
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  const cmd = `zip -r ${JSON.stringify(zipPath)} trees_slides.pptx stills`;
  execSync(cmd, { cwd: outputDir, stdio: "ignore" });
  return zipPath;
}

async function main() {
  await captureSlides();
  await buildPptx();
  const zipPath = zipOutput();
  console.log(`ZIP created at ${zipPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
