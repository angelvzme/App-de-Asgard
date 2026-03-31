import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("Building client...");
  await viteBuild();

  console.log("Building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const deps = Object.keys(pkg.dependencies || {});

  // Bundle everything except native/heavy deps
  const external = deps.filter(d => !["drizzle-orm", "drizzle-zod", "express", "express-session",
    "connect-pg-simple", "memorystore", "pg", "zod", "date-fns", "wouter"].includes(d));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: { "process.env.NODE_ENV": '"production"' },
    external,
    logLevel: "info",
  });

  console.log("Build complete.");
}

buildAll().catch(err => { console.error(err); process.exit(1); });
