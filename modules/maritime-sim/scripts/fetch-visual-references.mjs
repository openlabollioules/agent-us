// Public reference photographs, for local comparison only. Never used as textures.
import { mkdir, writeFile } from "node:fs/promises";
const folder = new URL("../generated/references/", import.meta.url);
await mkdir(folder, { recursive: true });
const references = {
  "vsr700.jpg": "https://www.naval-group.com/sites/default/files/styles/heading_default_fallback/public/2026-01/MB_Naval%20Group_FREMM%20%2B%20VSR700_002_0.jpg?itok=FHm8OQNM",
  "france-libre.jpg": "https://www.naval-group.com/sites/default/files/styles/heading_fallback/public/2026-03/Visuel%20PA-NG%204.jpg?itok=tGwmiH6u",
  "fdi-quarter.jpg": "https://www.naval-group.com/sites/default/files/styles/heading_default_fallback/public/2026-04/REA_POLComNavalFDI_AMIRAL_RONARCH-028.jpg?itok=7ZjSQtXV",
  "suffren.jpg": "https://www.naval-group.com/sites/default/files/styles/heading_default_fallback/public/2020-11/Suffren%20Toulon%208%20--%20%C2%A9Axel%20Manzano%20-%20Marine%20Nationale%20-%20D%C3%A9fense.jpg?itok=1os3yBCE",
  "fdi.jpg": "https://www.naval-group.com/sites/default/files/styles/heading_default_fallback/public/2026-01/FDI%20carrousel%202.jpg?itok=1g37jVwo",
  "seaquest-s.png": "https://www.naval-group.com/sites/default/files/styles/heading_default_fallback/public/2026-02/Seaquest%2012_1.png?itok=YEdAP78N",
  "seaquest-ml.png": "https://www.naval-group.com/sites/default/files/styles/default_landscape_small_fallback/public/2026-04/NG_SEAQUEST_ML_0.png?itok=aZIZwSOc",
  "seagent-m.png": "https://www.naval-group.com/sites/default/files/styles/default_landscape_small_fallback/public/2026-02/1167_NG_DRONE_SEAGENT-M.png?itok=pHkUOl3t",
  "seagent-xl.png": "https://www.naval-group.com/sites/default/files/styles/default_landscape_small_fallback/public/2026-04/1167_NG_DRONE_SEAGENT-XL.png?itok=F-1uwBmR",
};
for (const [name, url] of Object.entries(references)) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/"))
    throw new Error(`${name}: HTTP ${response.status}, expected an image`);
  await writeFile(new URL(name, folder), Buffer.from(await response.arrayBuffer()));
  console.log(name);
}
await writeFile(new URL("sources.json", folder), JSON.stringify(references, null, 2));
