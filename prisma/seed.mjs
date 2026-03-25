// This file bootstraps tsx and then runs the actual seed
import { register } from "node:module";
register("tsx/esm", import.meta.url);

const { runSeed } = await import("./seed-run.ts");
await runSeed();
