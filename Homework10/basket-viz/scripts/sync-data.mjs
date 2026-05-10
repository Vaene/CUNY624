import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

const appRoot = process.cwd();
const source = path.resolve(appRoot, "..", "basket_clusters.json");
const destination = path.join(appRoot, "public", "basket_clusters.json");
const rulesSource = path.resolve(appRoot, "..", "rules_graph.json");
const rulesDestination = path.join(appRoot, "public", "rules_graph.json");
const presentationSource = path.resolve(appRoot, "..", "presentation_report.json");
const presentationDestination = path.join(appRoot, "public", "presentation_report.json");

await mkdir(path.dirname(destination), { recursive: true });
await copyFile(source, destination);
await copyFile(rulesSource, rulesDestination);
await copyFile(presentationSource, presentationDestination);

console.log(`Synced ${source} -> ${destination}`);
console.log(`Synced ${rulesSource} -> ${rulesDestination}`);
console.log(`Synced ${presentationSource} -> ${presentationDestination}`);
