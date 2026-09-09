import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildModel, Mesh } from "../generate-models.mjs";
import { elevation, terrain } from "./terrain.mjs";
import { triangulate } from "./geometry.mjs";
import { oceanMesh, seaHeight, spectrum } from './sea.mjs';
import { identities } from './markings.mjs';
const catalog=JSON.parse(await readFile(new URL("../../catalog/models.json",import.meta.url),"utf8"));

test("exterior assets keep metre scale, waterline origin and bounded complexity",()=>{
  for(const [id,length,beam] of [["fdi",122,17.7],["suffren",99.5,8.8]]) {
    const m=buildModel(catalog.find(x=>x.id===id));
    const bounds=[0,1,2].map(k=>[Math.min(...m.vertices.map(v=>v[k])),Math.max(...m.vertices.map(v=>v[k]))]);
    assert.ok(Math.abs(bounds[0][1]-bounds[0][0]-length)<.01,id);
    const hullVertices=id==="suffren"?m.vertices.filter(v=>v[0]>0&&v[0]<24):m.vertices;
    assert.ok(Math.abs(Math.max(...hullVertices.map(v=>v[1]))-Math.min(...hullVertices.map(v=>v[1]))-beam)<.01,id);
    assert.ok(bounds[2][0]<0&&bounds[2][1]>0,id);
    assert.ok(m.faces.length<100000,id);
  }
});
test("OBJ exports finite unit normals and valid independent corner indices",()=>{
  const m=buildModel(catalog.find(x=>x.id==="suffren"));
  const obj=m.obj(), lines=obj.split("\n");
  assert.ok(!/NaN|Infinity/.test(obj));
  const normals=lines.filter(l=>l.startsWith("vn "));
  assert.equal(normals.length,m.faces.length*3);
  for(const n of normals)assert.ok(Math.abs(Math.hypot(...n.split(" ").slice(1).map(Number))-1)<1e-6);
  const firstVertex=lines.find(l=>l.startsWith("v ")).split(" ").slice(1).map(Number);
  assert.equal(firstVertex[0],-4975); // OBJ centimetres, not metres
  assert.equal(lines.filter(l=>l.startsWith("f ")).length,m.faces.length);
});
test("terrain has a continuous seabed and keeps water and land in the fictional map sectors",()=>{
  assert.ok(elevation(0,0)<-200);
  assert.ok(elevation(4500,-4500)>0);
  assert.ok(elevation(-4500,4000)>0);
  const models=terrain(Mesh);
  assert.ok(models.find(([name])=>name==='coast')[1].faces.every(f=>f.material!=='surf'), 'Nanite coast must be opaque');
  assert.ok(models.find(([name])=>name==='surf')[1].faces.every(f=>f.material==='surf'));
  for(const [,m] of models) {
    assert.ok(m.vertices.every(v=>v.every(Number.isFinite)));
    for(const face of m.faces.filter(f=>f.material==='land'||f.material==='sand')) {
      const [a,b,c]=face.indices.map(i=>m.vertices[i]);
      assert.ok((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])>0,"terrain must face up");
    }
  }
});
test("asset generation is repeatable and retains every catalog model",()=>{
  for(const entry of catalog) {
    const a=buildModel(entry),b=buildModel(entry);
    assert.deepEqual(a.vertices,b.vertices,entry.id);
    assert.deepEqual(a.faces,b.faces,entry.id);
  }
});
test("concave decks triangulate inside their outline",()=>{
  const outline=[[0,0],[4,0],[4,1],[1,1],[1,4],[0,4]];
  const faces=triangulate(outline);
  const area=faces.reduce((sum,f)=>{const [a,b,c]=f.map(i=>outline[i]);return sum+((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;},0);
  assert.equal(faces.length,4);assert.equal(area,7);
});

test('hull markings face outwards on both sides, and only attested pennants are assigned',()=>{
  assert.equal(identities.fdi.pennant,'D660');
  assert.equal(identities.suffren.pennant,'S635');
  assert.deepEqual(Object.keys(identities).sort(),['fdi','suffren']);
  for(const entry of catalog.filter(x=>x.visualRevision)) {
    const m=buildModel(entry),faces=m.faces.filter(f=>['marking','sub_marking'].includes(f.material));
    assert.ok(faces.length>0,entry.id);
    for(const f of faces) {
      const [a,b,c]=f.indices.map(i=>m.vertices[i]);
      const normalY=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
      assert.ok(normalY*a[1]>0,entry.id+' inward lettering');
    }
  }
});

test('ocean rings have no internal open edges or inverted faces',()=>{
  const m=oceanMesh(Mesh),edges=new Map();
  for(const f of m.faces) {
    const [a,b,c]=f.indices.map(i=>m.vertices[i]);
    assert.ok((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])>0);
    for(let i=0;i<3;i++){const key=[f.indices[i],f.indices[(i+1)%3]].sort((x,y)=>x-y).join(',');edges.set(key,(edges.get(key)||0)+1);}
  }
  const outer=m.vertices.reduce((r,v)=>Math.max(r,Math.abs(v[0]),Math.abs(v[1])),0);
  for(const [key,count] of edges) {
    assert.ok(count<=2,'non-manifold edge');
    if(count===1)for(const id of key.split(',').map(Number))assert.ok(Math.abs(Math.max(Math.abs(m.vertices[id][0]),Math.abs(m.vertices[id][1]))-outer)<1e-5,'hole in ocean');
  }
});

test('shared visual sea is continuous, bounded, stationary when calm and deterministic',()=>{
  assert.ok(spectrum.reduce((s,w)=>s+w.amplitude,0)<=.5);
  for(let i=0;i<500;i++) {
    const a=seaHeight(i*71,i*-21,12,4);
    assert.ok(Math.abs(a)<=2);
    assert.equal(a,seaHeight(i*71,i*-21,12,4));
    assert.equal(seaHeight(i,i,12,0),0);
    assert.ok(Math.abs(a-seaHeight(i*71,i*-21,12.001,4))<.01);
  }
});
