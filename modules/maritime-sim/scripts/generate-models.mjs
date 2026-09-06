import { readFile, mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { detailedModel } from "./visuals/fleet.mjs";
import { terrain } from "./visuals/terrain.mjs";

// Original exterior reconstructions from public imagery; see catalog/REFERENCES.md.
export class Mesh {
  vertices = [];
  faces = [];
  add(vertices, faces, material = "steel", smooth = false) {
    const offset = this.vertices.length;
    this.vertices.push(...vertices);
    for (const face of faces) {
      for (let i = 1; i < face.length - 1; i++)
        this.faces.push({ indices: [face[0], face[i], face[i + 1]].map((v) => v + offset), material, smooth });
    }
  }
  box(x, y, z, length, width, height, material = "steel", taper = 1) {
    this.add([
      [x-length/2,y-width/2,z], [x+length/2,y-width/2,z],
      [x+length/2,y+width/2,z], [x-length/2,y+width/2,z],
      [x-length*taper/2,y-width*taper/2,z+height], [x+length*taper/2,y-width*taper/2,z+height],
      [x+length*taper/2,y+width*taper/2,z+height], [x-length*taper/2,y+width*taper/2,z+height],
    ], [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]], material);
  }
  ellipsoid(x, y, z, length, width, height, material = "steel") {
    const vertices = [], faces = [], rings = 24, sides = 32;
    for (let i = 0; i <= rings; i++) {
      const a = -Math.PI / 2 + (i + 0.01) / (rings + 0.02) * Math.PI;
      for (let j = 0; j < sides; j++) {
        const b = j * Math.PI * 2 / sides;
        vertices.push([x + Math.sin(a) * length / 2, y + Math.cos(a) * Math.cos(b) * width / 2,
          z + Math.cos(a) * Math.sin(b) * height / 2]);
      }
    }
    for (let i = 0; i < rings; i++) for (let j = 0; j < sides; j++) {
      const a = i*sides+j, b = i*sides+(j+1)%sides;
      faces.push([a,b,b+sides,a+sides]);
    }
    faces.push(Array.from({ length: sides }, (_, j) => sides-1-j));
    faces.push(Array.from({ length: sides }, (_, j) => rings*sides+j));
    this.add(vertices, faces, material, true);
  }
  hull(length, width, deck, draft) {
    const stations = [[-.5,.65],[-.45,.93],[-.3,1],[-.1,1],[.1,.97],[.3,.8],[.43,.4],[.5,.025]];
    const vertices = [], faces = [];
    for (const [x, beam] of stations) {
      for (const [y,z] of [[-1,0],[-.88,-.45],[-.45,-1],[.45,-1],[.88,-.45],[1,0]])
        vertices.push([x*length,y*beam*width/2,deck+z*(draft+deck)]);
    }
    for (let i=0;i<stations.length-1;i++) for (let j=0;j<6;j++)
      faces.push([i*6+j,i*6+(j+1)%6,(i+1)*6+(j+1)%6,(i+1)*6+j]);
    faces.push([5,4,3,2,1,0], [42,43,44,45,46,47]);
    this.add(vertices, faces, "steel");
  }
  obj() {
    const lines = ["# Original exterior reconstruction; centimetres, +X bow, +Z up", "mtllib maritime.mtl"];
    const normals = this.vertices.map(() => [0,0,0]);
    const faceNormals = this.faces.map((face) => {
      const [a,b,c] = face.indices.map((i) => this.vertices[i]);
      const u = b.map((n,i) => n-a[i]), v = c.map((n,i) => n-a[i]);
      const n = [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      if (face.smooth) for (const id of face.indices) for (let k=0;k<3;k++) normals[id][k] += n[k];
      return n;
    });
    for (const v of this.vertices) lines.push(`v ${v.map((n) => (n*100).toFixed(5)).join(" ")}`);
    // Each flat triangle gets a non-degenerate planar UV projection and a normal.
    for (const [index,face] of this.faces.entries()) {
      const [a,b,c] = face.indices.map((i) => this.vertices[i]);
      const u = b.map((v,i) => v-a[i]), v = c.map((n,i) => n-a[i]);
      const normal = [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      const dominant = normal.map(Math.abs).indexOf(Math.max(...normal.map(Math.abs)));
      const axes = [0,1,2].filter((axis) => axis !== dominant);
      for (const point of [a,b,c]) lines.push(`vt ${(point[axes[0]]/10).toFixed(6)} ${(point[axes[1]]/10).toFixed(6)}`);
      for (const id of face.indices) {
        const n = face.smooth ? normals[id] : faceNormals[index];
        const size = Math.hypot(...n);
        if (size < 1e-15) throw new Error(`Invalid normal at triangle ${index}`);
        lines.push(`vn ${n.map((v) => (v/size).toFixed(8)).join(" ")}`);
      }
    }
    let material = "";
    let smoothing = null;
    for (const [index,face] of this.faces.entries()) {
      if (material !== face.material) { material = face.material; lines.push(`usemtl ${material}`); }
      if (smoothing !== face.smooth) { smoothing=face.smooth; lines.push(`s ${smoothing?1:"off"}`); }
      lines.push(`f ${face.indices.map((i,j) => `${i+1}/${index*3+j+1}/${index*3+j+1}`).join(" ")}`);
    }
    return lines.join("\n") + "\n";
  }
}

export function buildModel(model) {
  const m = new Mesh();
  if (detailedModel(m, model)) return m;
  const [l,w,h] = model.sizeM;
  if (model.shape === "marker") {
    m.add([[0,0,15],[0,0,-15],[15,0,0],[0,15,0],[-15,0,0],[0,-15,0]],
      [[0,2,3],[0,3,4],[0,4,5],[0,5,2],[1,3,2],[1,4,3],[1,5,4],[1,2,5]], "signal");
    return m;
  }
  if (model.shape === "submarine") {
    m.ellipsoid(0,0,0,l,w,w,"dark");
    if (model.id === "suffren") {
      m.box(l*.08,0,w*.3,l*.11,w*.38,h*.45,"dark",.8);
      m.box(l*.09,0,h*.6,.15,.15,h*.23,"steel");
    }
    m.box(-l*.37,0,-w*.04,l*.09,w*1.6,w*.08,"dark",.6);
    m.box(-l*.38,0,-w*.6,l*.09,w*.07,w*1.2,"dark",.6);
    return m;
  }
  if (model.shape === "helicopter") {
    m.ellipsoid(l*.15,0,h*.5,l*.55,w,h*.8);
    m.ellipsoid(l*.31,0,h*.55,l*.28,w*.92,h*.65,"glass");
    m.box(-l*.28,0,h*.5,l*.5,w*.17,h*.17,"steel",.5);
    m.box(-l*.5,0,h*.45,l*.1,w*.12,h*.4);
    m.box(0,0,h*.86,.12,.12,h*.23,"dark");
    m.box(0,0,h*1.1,l*1.4,.14,.035,"dark");
    m.box(0,0,h*1.1,.14,l*1.4,.035,"dark");
    for (const side of [-1,1]) {
      m.box(0,side*w*.45,0,l*.65,.07,.08,"dark");
      for (const x of [-l*.15,l*.15]) m.box(x,side*w*.38,.04,.06,.06,h*.35,"dark");
    }
    return m;
  }
  const deck = model.shape === "carrier" ? h*.25 : h*.16;
  m.hull(l,w,deck,Math.min(w*.3,8));
  m.box(-l*.03,0,deck,l*.78,w*.84,.15,"deck");
  if (model.shape === "carrier") {
    m.box(-l*.015,0,deck,l*.98,w,1,"deck",.98);
    m.box(-l*.05,w*.31,deck+1,l*.18,w*.16,h*.35,"steel",.85);
    m.box(-l*.06,w*.31,h*.6,l*.12,w*.18,h*.05,"glass");
    m.box(-l*.04,w*.31,h*.65,l*.045,w*.1,h*.32,"steel",.35);
    for (let i=0;i<20;i++) m.box(-l*.44+i*l*.045,-w*.12,deck+1.03,l*.022,.5,.035,"white");
    for (const side of [-1,1]) m.box(0,side*w*.44,deck+1.03,l*.85,.3,.03,"white");
  } else if (model.shape === "cargo") {
    m.box(-l*.33,0,deck,l*.15,w*.85,h*.6,"white",.93);
    m.box(-l*.33,0,deck+h*.47,l*.16,w*.9,h*.055,"glass");
    for (let i=0;i<6;i++) for (let j=0;j<3;j++) for (let k=0;k<2;k++)
      m.box(-l*.16+i*l*.09,(j-1)*w*.26,deck+k*2.7,l*.08,w*.23,2.6,(i+j)%2 ? "container" : "dark");
  } else {
    m.box(-l*.05,0,deck,l*.43,w*.68,h*.32,"steel",.75);
    m.box(l*.075,0,deck+h*.27,l*.18,w*.6,h*.075,"glass",.95);
    m.box(-l*.08,0,deck+h*.32,l*.09,w*.22,h*.42,"steel",.35);
    m.box(-l*.08,0,h*.9,.18,.18,h*.1,"dark");
    if (model.shape === "frigate") {
      // Flat-faced integrated mast and aft hangar; no functioning equipment.
      m.box(-l*.26,0,deck,l*.18,w*.72,h*.22,"steel",.9);
      m.box(-l*.29,0,deck+.1,l*.22,w*.55,.08,"deck");
      for (const side of [-1,1]) {
        m.ellipsoid(-l*.1,side*w*.43,deck+h*.05,l*.065,w*.12,h*.07,"dark");
        for (let i=0;i<14;i++) m.box(-l*.4+i*l*.055,side*w*.43,deck,.08,.08,1,"steel");
        m.box(-l*.04,side*w*.43,deck+1,l*.73,.045,.045,"steel");
      }
    }
    if (model.shape === "fishing") {
      m.box(-l*.3,0,deck,.15,.15,h*.65,"steel");
      m.box(-l*.3,0,h*.8,.15,w*.9,.15,"steel");
    }
  }
  return m;
}

function grid(size, cells, elevation, material) {
  const m = new Mesh(), vertices = [], faces = [];
  for (let y=0;y<=cells;y++) for (let x=0;x<=cells;x++)
    vertices.push([(x/cells-.5)*size,(y/cells-.5)*size,elevation]);
  for (let y=0;y<cells;y++) for (let x=0;x<cells;x++) {
    const a=y*(cells+1)+x;
    faces.push([a,a+1,a+cells+2,a+cells+1]);
  }
  m.add(vertices,faces,material); return m;
}

export async function generate() {
  const output = new URL("../generated/", import.meta.url);
  await mkdir(output,{recursive:true});
  const catalog = JSON.parse(await readFile(new URL("../catalog/models.json",import.meta.url),"utf8"));
  const models = catalog.map((model) => [model.id.replaceAll("-","_"),buildModel(model)]);
  models.push(["ocean",grid(30000,256,0,"water")]);
  models.push(...terrain(Mesh));
  const colors = { steel:[.42,.48,.52],dark:[.055,.075,.085],glass:[.035,.12,.16],deck:[.14,.17,.18],
    white:[.8,.83,.8],container:[.38,.17,.11],signal:[.1,.8,1],water:[.015,.16,.22],sand:[.2,.18,.11],land:[.12,.25,.15],
    hull:[.38,.42,.44],paint:[.46,.49,.5],rubber:[.025,.031,.034],panel:[.26,.28,.29],metal:[.36,.38,.4],
    antifouling:[.13,.038,.026],yellow:[.72,.48,.075],red:[.5,.022,.015],green:[.02,.3,.09],rock:[.27,.25,.21] };
  await writeFile(new URL("maritime.mtl",output),Object.entries(colors).map(([id,rgb])=>
    `newmtl ${id}\nKd ${rgb.join(" ")}\nKs 0.3 0.3 0.3\nNs 60\n`).join("\n"));
  for (const [id,mesh] of models) await writeFile(new URL(`SM_${id}.obj`,output),mesh.obj());
  await writeFile(new URL("mesh-report.json",output), JSON.stringify(Object.fromEntries(models.map(([id,m]) => [id, {
    vertices: m.vertices.length, triangles: m.faces.length, materials: [...new Set(m.faces.map(f=>f.material))],
    boundsM: [0,1,2].map(k => { let lo=Infinity, hi=-Infinity; for(const v of m.vertices){lo=Math.min(lo,v[k]);hi=Math.max(hi,v[k]);} return [lo,hi]; }),
  }])),null,2));
  console.log(`Generated ${models.length} meshes; geometry statistics: generated/mesh-report.json`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await generate();
