import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const root = process.cwd();
const outDir = path.join(root, "dist-bun");

function readDotenv() {
  const envPath = path.join(root, ".env");
  if (!existsSync(envPath)) return {};

  return Object.fromEntries(
    readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
        return [key, value];
      }),
  );
}

const env = { ...readDotenv(), ...process.env };

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const cssInput = readFileSync(path.join(root, "src", "index.css"), "utf8");
const cssResult = await postcss([
  tailwindcss({ config: path.join(root, "tailwind.config.ts") }),
  autoprefixer,
]).process(cssInput, {
  from: path.join(root, "src", "index.css"),
  to: path.join(outDir, "tailwind.css"),
});
await Bun.write(path.join(outDir, "tailwind.css"), cssResult.css);

const result = await Bun.build({
  entrypoints: ["src/main.tsx"],
  outdir: outDir,
  target: "browser",
  splitting: true,
  sourcemap: "none",
  minify: true,
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL || ""),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY || ""),
    "import.meta.env.VITE_APP_URL": JSON.stringify(env.VITE_APP_URL || env.NEXT_PUBLIC_SITE_URL || "https://korasutra.com"),
    "import.meta.env.VITE_PUBLIC_SITE_URL": JSON.stringify(env.VITE_PUBLIC_SITE_URL || env.NEXT_PUBLIC_SITE_URL || env.VITE_APP_URL || "https://korasutra.com"),
    "import.meta.env.VITE_PUBLIC_SITE_NAME": JSON.stringify(env.VITE_PUBLIC_SITE_NAME || env.NEXT_PUBLIC_SITE_NAME || "Korasutra"),
    "import.meta.env.VITE_PUBLIC_DEFAULT_OG_IMAGE": JSON.stringify(env.VITE_PUBLIC_DEFAULT_OG_IMAGE || env.NEXT_PUBLIC_DEFAULT_OG_IMAGE || "/og-image.png"),
    "import.meta.env.DEV": "false",
    "import.meta.env.PROD": "true",
    "import.meta.env.MODE": JSON.stringify("production"),
  },
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

if (existsSync(path.join(root, "public"))) {
  await cp(path.join(root, "public"), outDir, { recursive: true });
}

const html = readFileSync(path.join(root, "index.html"), "utf8")
  .replace('<script type="module" src="/src/main.tsx"></script>', '<script type="module" src="/main.js"></script>')
  .replace("</head>", '    <link rel="stylesheet" href="/tailwind.css" />\n  </head>');

await Bun.write(path.join(outDir, "index.html"), html);
console.log(`Built ${outDir}`);
