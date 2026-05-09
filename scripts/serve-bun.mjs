import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist-bun");
const port = Number(process.env.PORT || 8080);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function fileForUrl(url) {
  const pathname = decodeURIComponent(new URL(url).pathname);
  if (pathname === "/") return path.join(dist, "index.html");
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const candidate = path.join(dist, safePath.replace(/^[/\\]/, ""));
  if (existsSync(candidate)) return candidate;
  return path.join(dist, "index.html");
}

Bun.serve({
  port,
  hostname: "0.0.0.0",
  async fetch(request) {
    const filePath = fileForUrl(request.url);
    const file = Bun.file(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new Response(file, {
      headers: {
        "content-type": mimeTypes[ext] || "application/octet-stream",
        "cache-control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
      },
    });
  },
});

console.log(`Kora Sutra production server running at http://localhost:${port}`);
await new Promise(() => {});
