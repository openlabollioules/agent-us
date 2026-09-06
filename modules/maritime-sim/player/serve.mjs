import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const files = { "/": ["index.html", "text/html"], "/player.js": ["dist/player.js", "text/javascript"] };
createServer(async (req, res) => {
  const file = files[new URL(req.url, "http://localhost").pathname];
  if (!file) { res.writeHead(404); res.end(); return; }
  try {
    const data = await readFile(new URL(file[0], import.meta.url));
    res.writeHead(200, { "Content-Type": file[1], "Cache-Control": "no-store" }); res.end(data);
  } catch { res.writeHead(503); res.end("Run npm run build in player first."); }
}).listen(8081, "127.0.0.1", () => console.log("Player: http://localhost:8081"));
