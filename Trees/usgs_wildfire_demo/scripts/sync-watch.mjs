#!/usr/bin/env node
import { spawn } from "node:child_process";
import { watch } from "node:fs";
import path from "node:path";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const presentationDir = path.join(rootDir, "presentation");
const syncScript = path.join(rootDir, "scripts", "sync-public.sh");

let syncing = false;
let pending = false;

function runSync() {
  if (syncing) {
    pending = true;
    return;
  }

  syncing = true;
  const child = spawn("bash", [syncScript], {
    stdio: "inherit",
    cwd: rootDir,
  });

  child.on("exit", (code) => {
    syncing = false;
    if (pending) {
      pending = false;
      runSync();
      return;
    }
    if (code !== 0) {
      console.error(`sync-public.sh exited with code ${code}`);
    }
  });
}

console.log(`Watching ${presentationDir} for changes...`);
runSync();

watch(
  presentationDir,
  { recursive: true },
  (_eventType, filename) => {
    if (!filename) return;
    console.log(`Change detected: ${filename}`);
    runSync();
  }
);
