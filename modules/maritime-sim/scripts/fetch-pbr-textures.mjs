// A small, explicit CC0 selection. No credentials, scraping, or Unreal plugin.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const out = new URL('../generated/textures/', import.meta.url);
await mkdir(out, { recursive: true });
const manifest = [];
const headers = { 'User-Agent': 'AgentUs-MaritimeSim/3 (https://github.com/openlabollioules/agent-us)' };
for (const id of ['coast_sand_rocks_02', 'rock_boulder_dry', 'aerial_grass_rock', 'metal_plate_02', 'rubber_tiles']) {
  const response = await fetch(`https://api.polyhaven.com/files/${id}`, { headers, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${id}: metadata HTTP ${response.status}`);
  const files = await response.json();
  for (const [map, aliases] of Object.entries({ albedo: ['diff', 'diffuse'], normal: ['nor_gl'], roughness: ['rough', 'roughness'] })) {
    const key = Object.keys(files).find(k => aliases.includes(k.toLowerCase()));
    const file = files[key]?.['2k']?.jpg;
    if (!file || new URL(file.url).hostname !== 'dl.polyhaven.org') throw new Error(`No 2K JPG ${map} for ${id}: ${Object.keys(files)}`);
    const name = `${id}_${map}.jpg`, dest = new URL(name, out);
    let bytes = await readFile(dest).catch(() => null);
    if (!bytes || createHash('md5').update(bytes).digest('hex') !== file.md5) {
      const download = await fetch(file.url, { headers, signal: AbortSignal.timeout(60000) });
      if (!download.ok) throw new Error(`${name}: HTTP ${download.status}`);
      bytes = Buffer.from(await download.arrayBuffer());
      if (bytes.length !== file.size || createHash('md5').update(bytes).digest('hex') !== file.md5) throw new Error(`Integrity check failed: ${name}`);
      await writeFile(dest, bytes);
    }
    manifest.push({ id, map, name, url: file.url, source: `https://polyhaven.com/a/${id}`, license: 'CC0-1.0', md5: file.md5, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length });
    console.log(`${name}: verified ${bytes.length} bytes`);
  }
}
await writeFile(new URL('manifest.json', out), JSON.stringify(manifest, null, 2) + '\n');
